import { z } from "zod";
import {
  insertMoodLogSchema,
  insertJournalEntrySchema,
  insertHabitSchema,
  insertHabitLogSchema,
  insertFinancialLogSchema,
  insertUserSkillSchema,
  insertQuoteSchema,
  moodLogs,
  journalEntries,
  habits,
  habitLogs,
  financialLogs,
  userSkills,
  quotes,
} from "./schema";

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

export const api = {
  chat: {
    interact: {
      method: "POST" as const,
      path: "/api/chat/interact" as const,
      input: z.object({
        message: z.string(),
      }),
      responses: {
        200: z.object({ response: z.string() }),
        401: errorSchemas.unauthorized,
      },
    },
  },
  moodLogs: {
    list: {
      method: "GET" as const,
      path: "/api/mood-logs" as const,
      responses: {
        200: z.array(z.custom<typeof moodLogs.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    createCheckIn: {
      method: "POST" as const,
      path: "/api/check-in" as const,
      input: z.object({
        moodScore: z.number().min(1).max(10),
        stressLevel: z.number().min(1).max(10),
        energyLevel: z.number().min(1).max(10),
        motivationLevel: z.number().min(1).max(10),
        productivityLevel: z.number().min(1).max(10),
        notes: z.string().optional(),
        journalContent: z.string().optional(),
      }),
      responses: {
        201: z.object({
          moodLog: z.custom<typeof moodLogs.$inferSelect>(),
          journalEntry: z.custom<typeof journalEntries.$inferSelect>().optional(),
        }),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
  },
  journal: {
    list: {
      method: "GET" as const,
      path: "/api/journal" as const,
      responses: {
        200: z.array(z.custom<typeof journalEntries.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
  },
  habits: {
    list: {
      method: "GET" as const,
      path: "/api/habits" as const,
      responses: {
        200: z.array(z.object({
          habit: z.custom<typeof habits.$inferSelect>(),
          logs: z.array(z.custom<typeof habitLogs.$inferSelect>()),
        })),
        401: errorSchemas.unauthorized,
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/habits" as const,
      input: z.object({ name: z.string() }),
      responses: {
        201: z.custom<typeof habits.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    log: {
      method: "POST" as const,
      path: "/api/habits/:id/log" as const,
      responses: {
        201: z.custom<typeof habitLogs.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
  },
  financial: {
    get: {
      method: "GET" as const,
      path: "/api/financial" as const,
      responses: {
        200: z.custom<typeof financialLogs.$inferSelect>().nullable(),
        401: errorSchemas.unauthorized,
      },
    },
    upsert: {
      method: "POST" as const,
      path: "/api/financial" as const,
      input: z.object({
        rent: z.number(),
        food: z.number(),
        utilities: z.number(),
        transport: z.number(),
        income: z.number(),
        savings: z.number(),
      }),
      responses: {
        200: z.custom<typeof financialLogs.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
  },
  skills: {
    list: {
      method: "GET" as const,
      path: "/api/skills" as const,
      responses: {
        200: z.array(z.custom<typeof userSkills.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    set: {
      method: "POST" as const,
      path: "/api/skills" as const,
      input: z.object({ skills: z.array(z.string()).max(3) }),
      responses: {
        200: z.array(z.custom<typeof userSkills.$inferSelect>()),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    purposeMatch: {
      method: "GET" as const,
      path: "/api/skills/purpose-match" as const,
      responses: {
        200: z.object({ suggestion: z.string() }),
        401: errorSchemas.unauthorized,
      },
    }
  },
  quotes: {
    daily: {
      method: "GET" as const,
      path: "/api/quotes/daily" as const,
      responses: {
        200: z.array(z.custom<typeof quotes.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
