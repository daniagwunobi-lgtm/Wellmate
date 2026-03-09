import { db } from "./db";
import {
  moodLogs,
  journalEntries,
  habits,
  habitLogs,
  financialLogs,
  userSkills,
  quotes,
  type InsertMoodLog,
  type InsertJournalEntry,
  type InsertHabit,
  type InsertFinancialLog,
} from "@shared/schema";
import { eq, and, gte } from "drizzle-orm";

export interface IStorage {
  // Moods
  getMoodLogs(userId: string): Promise<(typeof moodLogs.$inferSelect)[]>;
  createMoodLog(log: InsertMoodLog): Promise<typeof moodLogs.$inferSelect>;
  // Journal
  getJournalEntries(userId: string): Promise<(typeof journalEntries.$inferSelect)[]>;
  createJournalEntry(entry: InsertJournalEntry): Promise<typeof journalEntries.$inferSelect>;
  // Habits
  getHabits(userId: string): Promise<(typeof habits.$inferSelect)[]>;
  createHabit(habit: InsertHabit): Promise<typeof habits.$inferSelect>;
  getHabitLogs(habitId: number): Promise<(typeof habitLogs.$inferSelect)[]>;
  createHabitLog(habitId: number, userId: string): Promise<typeof habitLogs.$inferSelect>;
  // Financial
  getFinancialLog(userId: string): Promise<typeof financialLogs.$inferSelect | undefined>;
  upsertFinancialLog(log: InsertFinancialLog): Promise<typeof financialLogs.$inferSelect>;
  // Skills
  getUserSkills(userId: string): Promise<(typeof userSkills.$inferSelect)[]>;
  setUserSkills(userId: string, skills: string[]): Promise<(typeof userSkills.$inferSelect)[]>;
  // Quotes
  getDailyQuotes(): Promise<(typeof quotes.$inferSelect)[]>;
  createQuote(quote: Omit<typeof quotes.$inferSelect, "id" | "createdAt">): Promise<typeof quotes.$inferSelect>;
}

export class DatabaseStorage implements IStorage {
  async getMoodLogs(userId: string) {
    return db.select().from(moodLogs).where(eq(moodLogs.userId, userId));
  }
  async createMoodLog(log: InsertMoodLog) {
    const [res] = await db.insert(moodLogs).values(log).returning();
    return res;
  }
  async getJournalEntries(userId: string) {
    return db.select().from(journalEntries).where(eq(journalEntries.userId, userId));
  }
  async createJournalEntry(entry: InsertJournalEntry) {
    const [res] = await db.insert(journalEntries).values(entry).returning();
    return res;
  }
  async getHabits(userId: string) {
    return db.select().from(habits).where(eq(habits.userId, userId));
  }
  async createHabit(habit: InsertHabit) {
    const [res] = await db.insert(habits).values(habit).returning();
    return res;
  }
  async getHabitLogs(habitId: number) {
    return db.select().from(habitLogs).where(eq(habitLogs.habitId, habitId));
  }
  async createHabitLog(habitId: number, userId: string) {
    const [res] = await db.insert(habitLogs).values({ habitId, userId }).returning();
    return res;
  }
  async getFinancialLog(userId: string) {
    const logs = await db.select().from(financialLogs).where(eq(financialLogs.userId, userId));
    return logs[0];
  }
  async upsertFinancialLog(log: InsertFinancialLog) {
    const existing = await this.getFinancialLog(log.userId);
    if (existing) {
      const [res] = await db.update(financialLogs).set(log).where(eq(financialLogs.id, existing.id)).returning();
      return res;
    }
    const [res] = await db.insert(financialLogs).values(log).returning();
    return res;
  }
  async getUserSkills(userId: string) {
    return db.select().from(userSkills).where(eq(userSkills.userId, userId));
  }
  async setUserSkills(userId: string, skills: string[]) {
    await db.delete(userSkills).where(eq(userSkills.userId, userId));
    if (skills.length === 0) return [];
    return db.insert(userSkills).values(skills.map(s => ({ userId, skill: s }))).returning();
  }
  async getDailyQuotes() {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    return db.select().from(quotes).where(gte(quotes.createdAt, oneDayAgo));
  }
  async createQuote(quote: Omit<typeof quotes.$inferSelect, "id" | "createdAt">) {
    const [res] = await db.insert(quotes).values(quote).returning();
    return res;
  }
}

export const storage = new DatabaseStorage();
