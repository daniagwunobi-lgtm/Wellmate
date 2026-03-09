import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import OpenAI from "openai";
import { getUncachableStripeClient, getStripePublishableKey } from "./stripeClient";
import { db } from "./db";
import { sql } from "drizzle-orm";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

// Monthly price ID (£1.99) — populated after creating via seed script or Stripe dashboard
const MONTHLY_PRICE_ID = process.env.STRIPE_PRICE_ID || "";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);

  // ── Subscription status ───────────────────────────────────────────────────
  app.get("/api/subscription", isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    let sub = await storage.getSubscription(userId);
    if (!sub) {
      sub = await storage.createOrUpdateSubscription({ userId });
    }
    const now = new Date();
    let access = false;
    if (sub.status === "active" && sub.currentPeriodEnd && sub.currentPeriodEnd > now) {
      access = true;
    } else if (sub.status === "trial" && sub.trialEndsAt && sub.trialEndsAt > now) {
      access = true;
    }
    res.json({ ...sub, hasAccess: access });
  });

  // ── Stripe publishable key (for frontend) ─────────────────────────────────
  app.get("/api/stripe/publishable-key", async (req, res) => {
    try {
      const key = await getStripePublishableKey();
      res.json({ publishableKey: key });
    } catch {
      res.status(503).json({ message: "Stripe not configured" });
    }
  });

  // ── Stripe checkout ───────────────────────────────────────────────────────
  app.post("/api/subscription/checkout", isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const origin = `${req.protocol}://${req.hostname}`;
    try {
      const stripe = await getUncachableStripeClient();

      // Find or create Stripe customer
      let sub = await storage.getSubscription(userId);
      let customerId = sub?.stripeCustomerId;

      if (!customerId) {
        const customer = await stripe.customers.create({ metadata: { userId } });
        customerId = customer.id;
      }

      // Look up the price for £1.99/month from the stripe schema if STRIPE_PRICE_ID not set
      let priceId = MONTHLY_PRICE_ID;
      if (!priceId) {
        const prices = await db.execute(
          sql`SELECT id FROM stripe.prices WHERE currency = 'gbp' AND unit_amount = 199 AND active = true LIMIT 1`
        );
        priceId = (prices.rows[0] as any)?.id || "";
      }

      if (!priceId) {
        return res.status(503).json({ message: "Subscription product not configured. Please create a £1.99/month price in Stripe." });
      }

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: customerId,
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${origin}/check-in?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/check-in`,
        metadata: { userId },
      });

      res.json({ url: session.url });
    } catch (e: any) {
      console.error("Checkout error:", e.message);
      res.status(500).json({ message: e.message });
    }
  });

  // ── Subscription webhook handled in index.ts /api/stripe/webhook ──────────
  // When checkout.session.completed fires, stripe-replit-sync syncs the subscription
  // We also need to update our own subscriptions table via polling or a custom hook.
  // Listen for subscription status checks against the stripe schema:
  app.post("/api/subscription/verify-session", isAuthenticated, async (req: any, res) => {
    const { sessionId } = req.body;
    const userId = req.user.claims.sub;
    try {
      const stripe = await getUncachableStripeClient();
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.status === "complete" && session.metadata?.userId === userId) {
        const stripeSubId = session.subscription as string;
        const stripeSub = await stripe.subscriptions.retrieve(stripeSubId);
        await storage.createOrUpdateSubscription({
          userId,
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: stripeSubId,
          status: "active",
          currentPeriodEnd: new Date((stripeSub as any).current_period_end * 1000),
        });
      }
      const sub = await storage.getSubscription(userId);
      const now = new Date();
      const hasAccess = sub?.status === "active" && sub?.currentPeriodEnd && sub.currentPeriodEnd > now;
      res.json({ ...sub, hasAccess: !!hasAccess });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // ── AI Chat ───────────────────────────────────────────────────────────────
  app.post(api.chat.interact.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.chat.interact.input.parse(req.body);
      const response = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [
          { role: "system", content: "You are Humanity Hub, a supportive wellbeing companion acting in a motivational interviewing style. Ask open-ended questions, encourage reflection, reinforce strengths, and avoid judgment. Keep responses concise and supportive." },
          { role: "user", content: input.message }
        ]
      });
      res.json({ response: response.choices[0]?.message?.content || "I am here for you." });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Internal error" });
    }
  });

  // ── Mood Logs ─────────────────────────────────────────────────────────────
  app.get(api.moodLogs.list.path, isAuthenticated, async (req: any, res) => {
    const logs = await storage.getMoodLogs(req.user.claims.sub);
    res.json(logs);
  });

  app.post(api.moodLogs.createCheckIn.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.moodLogs.createCheckIn.input.parse(req.body);
      const userId = req.user.claims.sub;

      const moodLog = await storage.createMoodLog({
        userId,
        moodScore: input.moodScore,
        stressLevel: input.stressLevel,
        energyLevel: input.energyLevel,
        motivationLevel: input.motivationLevel,
        productivityLevel: input.productivityLevel,
        notes: input.notes,
      });

      let journalEntry = undefined;
      if (input.journalContent) {
        journalEntry = await storage.createJournalEntry({ userId, content: input.journalContent });
      }

      res.status(201).json({ moodLog, journalEntry });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal error" });
    }
  });

  // ── Journal ───────────────────────────────────────────────────────────────
  app.get(api.journal.list.path, isAuthenticated, async (req: any, res) => {
    const entries = await storage.getJournalEntries(req.user.claims.sub);
    res.json(entries);
  });

  // ── Habits ────────────────────────────────────────────────────────────────
  app.get(api.habits.list.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const userHabits = await storage.getHabits(userId);
    const result = await Promise.all(userHabits.map(async h => {
      const logs = await storage.getHabitLogs(h.id);
      return { habit: h, logs };
    }));
    res.json(result);
  });

  app.post(api.habits.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.habits.create.input.parse(req.body);
      const habit = await storage.createHabit({ userId: req.user.claims.sub, name: input.name });
      res.status(201).json(habit);
    } catch {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  app.post(api.habits.log.path, isAuthenticated, async (req: any, res) => {
    try {
      const habitId = Number(req.params.id);
      const log = await storage.createHabitLog(habitId, req.user.claims.sub);
      res.status(201).json(log);
    } catch {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  // ── Financial ─────────────────────────────────────────────────────────────
  app.get(api.financial.get.path, isAuthenticated, async (req: any, res) => {
    const log = await storage.getFinancialLog(req.user.claims.sub);
    res.json(log || null);
  });

  app.post(api.financial.upsert.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.financial.upsert.input.parse(req.body);
      const log = await storage.upsertFinancialLog({ ...input, userId: req.user.claims.sub });
      res.json(log);
    } catch {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  // ── Skills ────────────────────────────────────────────────────────────────
  app.get(api.skills.list.path, isAuthenticated, async (req: any, res) => {
    const skills = await storage.getUserSkills(req.user.claims.sub);
    res.json(skills);
  });

  app.post(api.skills.set.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.skills.set.input.parse(req.body);
      const skills = await storage.setUserSkills(req.user.claims.sub, input.skills);
      res.json(skills);
    } catch {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  app.get(api.skills.purposeMatch.path, isAuthenticated, async (req: any, res) => {
    const skills = await storage.getUserSkills(req.user.claims.sub);
    const skillList = skills.map(s => s.skill).join(", ");
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [
          { role: "system", content: "You suggest community contributions or volunteering opportunities based on user skills to reduce loneliness. Keep it very short, 1-2 sentences." },
          { role: "user", content: `My skills are: ${skillList || "general helping"}. Suggest a way I can contribute to my community.` }
        ]
      });
      res.json({ suggestion: response.choices[0]?.message?.content || "You could volunteer at a local community center." });
    } catch {
      res.status(500).json({ message: "Error generating purpose match" });
    }
  });

  // ── Quotes ────────────────────────────────────────────────────────────────
  app.get(api.quotes.daily.path, async (req, res) => {
    let dailyQuotes = await storage.getDailyQuotes();
    if (dailyQuotes.length === 0) {
      try {
        const response = await openai.chat.completions.create({
          model: "gpt-5.1",
          messages: [
            { role: "user", content: "Generate 3 motivational quotes on themes of resilience, growth, and purpose. Format as JSON object with key 'quotes' containing an array of objects with 'content' and 'theme' fields." }
          ],
          response_format: { type: "json_object" }
        });
        const data = JSON.parse(response.choices[0]?.message?.content || '{"quotes":[]}');
        const generatedQuotes = Array.isArray(data.quotes) ? data.quotes : [];
        for (const q of generatedQuotes.slice(0, 3)) {
          const quote = await storage.createQuote({ content: q.content, theme: q.theme || "motivation", imageUrl: null });
          dailyQuotes.push(quote);
        }
      } catch (e) {
        console.error(e);
      }
    }
    res.json(dailyQuotes);
  });

  return httpServer;
}
