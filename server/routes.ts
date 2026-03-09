import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);

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
        journalEntry = await storage.createJournalEntry({
          userId,
          content: input.journalContent,
        });
      }

      res.status(201).json({ moodLog, journalEntry });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.get(api.journal.list.path, isAuthenticated, async (req: any, res) => {
    const entries = await storage.getJournalEntries(req.user.claims.sub);
    res.json(entries);
  });

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
    } catch (err) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  app.post(api.habits.log.path, isAuthenticated, async (req: any, res) => {
    try {
      const habitId = Number(req.params.id);
      const log = await storage.createHabitLog(habitId, req.user.claims.sub);
      res.status(201).json(log);
    } catch (err) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  app.get(api.financial.get.path, isAuthenticated, async (req: any, res) => {
    const log = await storage.getFinancialLog(req.user.claims.sub);
    res.json(log || null);
  });

  app.post(api.financial.upsert.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.financial.upsert.input.parse(req.body);
      const log = await storage.upsertFinancialLog({ ...input, userId: req.user.claims.sub });
      res.json(log);
    } catch (err) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  app.get(api.skills.list.path, isAuthenticated, async (req: any, res) => {
    const skills = await storage.getUserSkills(req.user.claims.sub);
    res.json(skills);
  });

  app.post(api.skills.set.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.skills.set.input.parse(req.body);
      const skills = await storage.setUserSkills(req.user.claims.sub, input.skills);
      res.json(skills);
    } catch (err) {
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
    } catch (e) {
      res.status(500).json({ message: "Error generating purpose match" });
    }
  });

  app.get(api.quotes.daily.path, async (req, res) => {
    let quotes = await storage.getDailyQuotes();
    if (quotes.length === 0) {
      try {
        const response = await openai.chat.completions.create({
          model: "gpt-5.1",
          messages: [
            { role: "user", content: "Generate 3 motivational quotes on themes of resilience, growth, and purpose. Format as JSON array with objects containing 'content' and 'theme'." }
          ],
          response_format: { type: "json_object" }
        });
        
        const data = JSON.parse(response.choices[0]?.message?.content || '{"quotes":[]}');
        const generatedQuotes = data.quotes || data;
        
        for (const q of generatedQuotes.slice(0, 3)) {
          const quote = await storage.createQuote({
            content: q.content,
            theme: q.theme || "motivation",
            imageUrl: null,
          });
          quotes.push(quote);
        }
      } catch (e) {
        console.error(e);
      }
    }
    res.json(quotes);
  });

  return httpServer;
}
