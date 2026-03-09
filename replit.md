# Humanity Hub — replit.md

## Overview

Humanity Hub is an AI-powered daily wellbeing companion web application. It helps users improve mental health, resilience, and emotional wellbeing through:

- **Daily Check-In**: Track mood, stress, energy, motivation, and productivity (1–10 sliders) with optional journal notes
- **AI Companion**: Chat-based emotional support powered by OpenAI
- **Habit Tracker**: Build daily habits and log completions
- **Journal**: View past reflections created during check-ins
- **Survival Tracker**: Financial stress management (income vs. expenses with buffer calculation)
- **Purpose Matcher**: Enter up to 3 skills and get AI-suggested ways to help others
- **Daily Quotes**: AI-generated inspirational quotes refreshed daily
- **Crisis Support**: Geo-detected emergency mental health resources by country

The app is monetised via a **£1.99/month Stripe subscription**, with a free trial period. Authentication is handled by **Replit Auth** (OIDC).

---

## User Preferences

Preferred communication style: Simple, everyday language.

---

## System Architecture

### Full-Stack Structure

The project is a monorepo with three logical layers:

```
/client        — React frontend (Vite)
/server        — Express backend (Node.js/TypeScript)
/shared        — Shared types, schemas, and route definitions
```

**Shared schema** (`shared/schema.ts`, `shared/models/`) is imported by both frontend and backend. This avoids type duplication and ensures API contracts stay in sync.

### Frontend

- **Framework**: React 18 with TypeScript, bundled by Vite
- **Routing**: `wouter` (lightweight client-side router)
- **Data fetching**: TanStack Query v5 (`@tanstack/react-query`) — all API calls go through typed hooks in `client/src/hooks/`
- **UI components**: shadcn/ui (Radix UI primitives) with Tailwind CSS
- **Animations**: Framer Motion for page transitions and micro-interactions
- **Charts**: Recharts for dashboard analytics
- **Fonts**: DM Sans (body), Outfit (display), loaded via Google Fonts

**Auth flow**: `useAuth` hook polls `/api/auth/user`. If unauthenticated, shows `Landing` page. Authenticated users see `MainLayout` with sidebar navigation.

**Subscription gate**: `SubscriptionGate` component wraps premium content (Daily Check-In). It reads `/api/subscription` and blocks access with an upgrade prompt if the trial has expired or the user is unsubscribed.

### Backend

- **Framework**: Express.js (ESM, TypeScript via `tsx`)
- **Entry point**: `server/index.ts` — registers routes, sets up Vite dev middleware or static serving
- **Route organisation**: All app routes in `server/routes.ts`; Replit integration routes are modular (`server/replit_integrations/`)
- **Storage layer**: `server/storage.ts` defines `IStorage` interface, implemented by `DatabaseStorage` — all DB calls are abstracted here

**Important ordering**: The Stripe webhook route (`/api/stripe/webhook`) must be registered **before** `express.json()` because Stripe requires the raw Buffer body for signature verification.

### Database

- **Engine**: PostgreSQL
- **ORM**: Drizzle ORM with `drizzle-zod` for schema-derived Zod validators
- **Schema location**: `shared/schema.ts` (imports from `shared/models/auth.ts` and `shared/models/chat.ts`)
- **Migrations**: `drizzle-kit push` (schema push workflow, not migration files)
- **Connection**: `server/db.ts` using `pg.Pool` + `DATABASE_URL` env var

**Key tables**:
| Table | Purpose |
|---|---|
| `users` | Replit Auth user records |
| `sessions` | Express session store (connect-pg-simple) |
| `subscriptions` | Stripe subscription state per user |
| `mood_logs` | Daily check-in numeric scores |
| `journal_entries` | Free-text journal content |
| `habits` | User-defined habits |
| `habit_logs` | Completion records per habit |
| `financial_logs` | Survival tracker income/expense data |
| `user_skills` | Skills for Purpose Matcher |
| `quotes` | AI-generated daily quotes |
| `conversations` / `messages` | Chat conversation history |

### Authentication

- **Provider**: Replit Auth via OpenID Connect (`openid-client` + `passport`)
- **Session storage**: PostgreSQL via `connect-pg-simple` (uses the `sessions` table)
- **Middleware**: `isAuthenticated` guard applied to all protected routes
- **User upsert**: On each login, the user record is upserted into the `users` table

### API Design

Routes follow a typed contract defined in `shared/routes.ts` using Zod schemas. Each route object specifies method, path, input schema, and response schemas. Frontend hooks use these constants directly (no string literals scattered in components).

### Build

- **Dev**: `tsx server/index.ts` runs Express with Vite middleware (HMR via WebSocket at `/vite-hmr`)
- **Production build**: `script/build.ts` — runs Vite build for client, then esbuild bundles the server into `dist/index.cjs`. A server dependency allowlist is bundled directly (OpenAI, Stripe, Drizzle, etc.) to reduce cold start syscalls; everything else is externalised.

---

## External Dependencies

### Stripe (Payments)

- **Purpose**: £1.99/month subscription billing
- **Integration**: `server/stripeClient.ts` fetches credentials dynamically from Replit Connectors SDK (supports dev/production environments automatically)
- **Webhook**: Raw body parsing at `/api/stripe/webhook` with signature verification via `WebhookHandlers`
- **Checkout**: Server creates a Stripe Checkout Session; client redirects to Stripe-hosted page. On return, `?session_id=` param triggers subscription verification
- **Seed script**: `server/seed-stripe-product.ts` creates the product and price in Stripe (run once); sets `STRIPE_PRICE_ID` env var

### OpenAI (AI Features)

- **Purpose**: AI Companion chat, Purpose Matcher suggestions, Daily Quotes generation
- **Client**: Configured with `AI_INTEGRATIONS_OPENAI_API_KEY` and `AI_INTEGRATIONS_OPENAI_BASE_URL` (Replit AI Integrations proxy)
- **Models used**: `gpt-*` for chat/text, `gpt-image-1` for image generation (available but not actively used in main app flow)
- **Voice**: Full SSE voice streaming infrastructure exists (`server/replit_integrations/audio/`) but is not wired into main UI routes

### Replit Platform Integrations

- **Replit Auth**: OIDC-based authentication (`REPL_ID`, `ISSUER_URL` env vars)
- **Replit Connectors SDK**: `@replit/connectors-sdk` — used to dynamically fetch Stripe API keys for the correct environment (dev vs. production deployment)
- **Vite plugins**: `@replit/vite-plugin-runtime-error-modal`, `@replit/vite-plugin-cartographer`, `@replit/vite-plugin-dev-banner` (dev-only)

### Required Environment Variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | Express session signing key |
| `REPL_ID` | Replit app identifier (for OIDC) |
| `ISSUER_URL` | OIDC issuer (defaults to `https://replit.com/oidc`) |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | OpenAI API key via Replit proxy |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | OpenAI base URL via Replit proxy |
| `STRIPE_PRICE_ID` | Stripe monthly price ID (set after running seed script) |
| `REPLIT_CONNECTORS_HOSTNAME` | Replit connectors service hostname |
| `REPL_IDENTITY` or `WEB_REPL_RENEWAL` | Token for Replit Connectors auth |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook endpoint secret |