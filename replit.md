# Insighta — AI-Powered Business Insight Engine

## Overview

Insighta is a full-stack web application that lets businesses upload their data and receive AI-generated insights, while investors, students, and professionals can explore companies and ask AI-powered questions.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (ESM bundle)
- **Frontend**: React + Vite, Tailwind CSS, shadcn/ui, Recharts
- **Auth**: Replit Auth (OIDC/PKCE)
- **AI**: OpenAI via Replit AI Integrations (gpt-5.2) — no API key required

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/       # Express 5 backend API
│   └── insighta/         # React + Vite frontend
├── lib/
│   ├── api-spec/         # OpenAPI spec + Orval codegen
│   ├── api-client-react/ # Generated React Query hooks
│   ├── api-zod/          # Generated Zod schemas
│   ├── db/               # Drizzle ORM schema + DB connection
│   └── replit-auth-web/  # Replit Auth browser hook (useAuth)
├── scripts/
└── pnpm-workspace.yaml
```

## Features

### Auth (Replit Auth)
- OIDC-based sign-in (no custom forms)
- Auth state via `useAuth()` from `@workspace/replit-auth-web`
- Protected routes (Dashboard requires login)
- Session stored in PostgreSQL

### Business Profiles
- Businesses can create profiles (name, industry, description, website)
- Each user can have one business
- Public listing with search + industry filter

### Data Upload & Processing
- Upload CSV or JSON data via the Dashboard
- Backend parses and computes statistics (mean, median, trends, growth rates, std dev)
- Async processing pipeline — status tracked in DB

### AI Insight Engine (gpt-5.2)
- Generates 5 typed insights per dataset: summary, growth, risk, opportunity, trend
- Insights stored in DB and displayed publicly on business pages

### AI Q&A System (RAG-style)
- Users ask questions about any business
- Backend retrieves existing insights + dataset summaries as context
- LLM answers with business-specific, data-grounded responses
- All Q&A stored in DB (queries table)

### Data Visualization
- Recharts LineChart / BarChart for dataset trends
- Rendered on the Business Detail page

## Database Tables

- `users` — Auth sessions and user profiles
- `sessions` — Session storage for OIDC
- `businesses` — Business profiles
- `datasets` — Uploaded datasets with statistics
- `insights` — AI-generated insights
- `queries` — Q&A history

## API Routes

All under `/api`:

### Auth
- `GET /api/auth/user` — current user
- `GET /api/login` — start OIDC login
- `GET /api/callback` — OIDC callback
- `GET /api/logout` — logout

### Businesses
- `GET /api/businesses` — list all (search, industry filter)
- `GET /api/businesses/my` — current user's business
- `GET /api/businesses/:id` — detail + datasets + insights
- `POST /api/businesses` — create
- `PATCH /api/businesses/:id` — update

### Datasets
- `GET /api/businesses/:id/datasets` — list
- `POST /api/businesses/:id/datasets` — upload (CSV/JSON)

### Insights
- `GET /api/businesses/:id/insights` — list
- `POST /api/businesses/:id/insights/generate` — trigger AI generation

### Q&A
- `POST /api/businesses/:id/ask` — ask a question
- `GET /api/businesses/:id/queries` — past Q&A

## Key Files

- `artifacts/api-server/src/services/aiService.ts` — LLM calls (insights + Q&A)
- `artifacts/api-server/src/services/dataProcessor.ts` — CSV/JSON parsing + statistics
- `artifacts/api-server/src/routes/businesses.ts` — all business/dataset/insight/query routes
- `lib/db/src/schema/businesses.ts` — DB schema
- `lib/db/src/schema/auth.ts` — Auth tables
- `artifacts/insighta/src/App.tsx` — Frontend routing
- `artifacts/insighta/src/pages/home.tsx` — Home/explore page
- `artifacts/insighta/src/pages/dashboard.tsx` — Business dashboard
- `artifacts/insighta/src/pages/business-detail.tsx` — Business detail + charts + Q&A

## Running Locally

1. Start API: `pnpm --filter @workspace/api-server run dev`
2. Start Frontend: `pnpm --filter @workspace/insighta run dev`

## Adding New Tables

1. Add schema in `lib/db/src/schema/`
2. Export from `lib/db/src/schema/index.ts`
3. Run `pnpm --filter @workspace/db run push`

## Updating the API

1. Edit `lib/api-spec/openapi.yaml`
2. Run `pnpm --filter @workspace/api-spec run codegen`
3. Implement route in `artifacts/api-server/src/routes/`
