import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import OpenAI from "openai";
import Stripe from "stripe";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-03-31.basil" })
  : null;

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

  // ── Stripe checkout ───────────────────────────────────────────────────────
  app.post("/api/subscription/checkout", isAuthenticated, async (req: any, res) => {
    if (!stripe) return res.status(503).json({ message: "Payments not configured yet" });
    const userId = req.user.claims.sub;
    const origin = `${req.protocol}://${req.hostname}`;
    try {
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        currency: "gbp",
        line_items: [{ price: MONTHLY_PRICE_ID, quantity: 1 }],
        success_url: `${origin}/check-in?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/check-in`,
        metadata: { userId },
      });
      res.json({ url: session.url });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // ── Stripe webhook ────────────────────────────────────────────────────────
  app.post("/api/webhook/stripe", async (req, res) => {
    if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) return res.sendStatus(400);
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body, req.headers["stripe-signature"] as string, process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch {
      return res.sendStatus(400);
    }
    const session = event.data.object as any;
    if (event.type === "checkout.session.completed") {
      const userId = session.metadata?.userId;
      if (userId) {
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        await storage.createOrUpdateSubscription({
          userId,
          stripeCustomerId: session.customer,
          stripeSubscriptionId: session.subscription,
          status: "active",
          currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
        });
      }
    }
    if (event.type === "customer.subscription.deleted") {
      const userId = session.metadata?.userId;
      if (userId) {
        await storage.createOrUpdateSubscription({ userId, status: "expired" });
      }
    }
    res.sendStatus(200);
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
