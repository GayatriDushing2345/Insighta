# Insighta — Setup & Run Guide

## Prerequisites

- [Node.js 20+](https://nodejs.org/)
- [pnpm](https://pnpm.io/installation) — install with: `npm install -g pnpm`
- A PostgreSQL database (local or cloud, e.g. [Neon](https://neon.tech), [Supabase](https://supabase.com), or local Postgres)

---

## 1. Install Dependencies

```bash
pnpm install
```

---

## 2. Set Environment Variables

Create a `.env` file in the root (or export these in your shell):

```env
# PostgreSQL connection string
DATABASE_URL=postgresql://user:password@localhost:5432/insighta

# Session secret (any long random string)
SESSION_SECRET=your-very-long-random-secret-here

# OpenAI API Key (required for AI insights & Q&A)
OPENAI_API_KEY=sk-...

# Replit OIDC (only needed if using Replit Auth — skip for local dev)
# REPL_ID=...
# REPLIT_DEV_DOMAIN=...
```

> **Note:** For AI features to work you need an OpenAI API key.
> In the AI service (`artifacts/api-server/src/services/aiService.ts`),
> update the client initialization to use `OPENAI_API_KEY` directly:
>
> ```typescript
> return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
> ```

---

## 3. Push Database Schema

```bash
pnpm --filter @workspace/db run push
```

This creates all tables: `users`, `sessions`, `businesses`, `datasets`, `insights`, `queries`.

---

## 4. (Optional) Seed Sample Data

```bash
# You can use any PostgreSQL client to run this SQL:
psql $DATABASE_URL -f seed.sql
```

---

## 5. Run the Project

Open **two terminals**:

**Terminal 1 — API Server:**
```bash
pnpm --filter @workspace/api-server run dev
```
Starts at: `http://localhost:8080`

**Terminal 2 — Frontend:**
```bash
pnpm --filter @workspace/insighta run dev
```
Starts at: `http://localhost:5173` (or next available port)

Open your browser at: **http://localhost:5173**

---

## Project Structure

```
├── artifacts/
│   ├── api-server/         # Express 5 backend
│   │   └── src/
│   │       ├── routes/     # API route handlers
│   │       ├── services/   # AI service + data processor
│   │       └── middlewares/# Auth middleware
│   └── insighta/           # React + Vite frontend
│       └── src/
│           ├── pages/      # Home, Dashboard, Business Detail, Login
│           └── components/ # UI components, charts, layout
├── lib/
│   ├── api-spec/           # OpenAPI spec (openapi.yaml)
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas
│   ├── db/                 # Drizzle ORM schema + DB client
│   └── replit-auth-web/    # Auth hook for React
```

---

## Key Features

| Feature | Description |
|---------|-------------|
| Business Profiles | Create & manage company profiles |
| Data Upload | Upload CSV or JSON datasets |
| AI Insights | GPT-generated business insights (5 types) |
| AI Q&A | Ask anything about a business |
| Public Explorer | Browse all businesses, charts, trends |
| Authentication | Secure login via Replit Auth (OIDC) |
| Charts | Revenue & growth trend charts (Recharts) |

---

## Re-run Codegen (after changing the API spec)

```bash
pnpm --filter @workspace/api-spec run codegen
```

---

## Build for Production

```bash
# Build API server
pnpm --filter @workspace/api-server run build

# Build frontend
pnpm --filter @workspace/insighta run build
```
