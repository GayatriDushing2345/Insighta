# INSIGHTA — Full-Stack Business Insight Engine 🚀

> **Transform raw business data into actionable insights for smarter, data-driven decision-making.**

[![React](https://img.shields.io/badge/Frontend-React%20%7C%20Vite-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express%205-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Drizzle ORM](https://img.shields.io/badge/ORM-Drizzle%20ORM-C5F74F?logo=drizzle&logoColor=black)](https://orm.drizzle.team/)
[![OpenAI](https://img.shields.io/badge/AI-OpenAI%20GPT-412991?logo=openai&logoColor=white)](https://openai.com/)

---

## 📽️ Demo & Links
- **Video Walkthrough (Loom):** [Watch Demo](https://www.loom.com/share/72eb187c9a0c4fe491ca41072c63955a)
- **Repository:** [https://github.com/GayatriDushing2345/Insighta](https://github.com/GayatriDushing2345/Insighta)

---

## 🌟 Overview

**Insighta** is a full-stack business analytics platform designed to solve one of the biggest challenges facing modern businesses: interpreting unstructured, scattered data quickly and accurately. 

By unifying client-side data intake with an Express/Node.js API pipeline and intelligent AI analytics, Insighta empowers founders, analysts, and operators to ingest CSV/JSON datasets, automatically categorize business activities, and surface strategic insights in seconds.

---

## ✨ Key Features & Capabilities

- **End-to-End Data Flow**: Smooth file upload workflow in React that securely routes dataset payloads to server-side processing endpoints and renders dynamic visual results.
- **AI-Powered Recommendation Engine**: Leverages OpenAI models to analyze revenue patterns, churn risks, operational bottlenecks, and growth opportunities.
- **Automated Business Categorization**: Dynamically classifies business models (Tech, SaaS, Retail, Finance, Services) and tailors analytical metrics accordingly.
- **Interactive AI Q&A Assistant**: Allows decision-makers to interrogate their datasets using natural language questions and receive contextual, grounded answers.
- **Interactive Visualization**: Visual breakdown of metrics, historical data trends, and categorization signals using Recharts and Tailwind UI components.
- **Contract-Driven API Architecture**: OpenAPI 3.0 specification paired with Zod runtime validation and Orval code generation for end-to-end type safety between client and server.

---

## 🛠️ Architecture & Tech Stack

```
Insighta/
├── artifacts/
│   ├── api-server/         # Express 5 backend with AI service & data processors
│   └── insighta/           # React 19 + Vite frontend application
├── lib/
│   ├── api-spec/           # OpenAPI 3.0 schema definitions & codegen configuration
│   ├── api-client-react/   # Generated React Query hooks & API client
│   ├── api-zod/            # Zod validation schemas for all endpoints
│   ├── db/                 # Drizzle ORM schema, migrations, and PostgreSQL client
│   └── replit-auth-web/    # Authentication hook & provider
```

### Frontend
- **Framework:** React 19, Vite, Wouter (lightweight routing)
- **Styling & UI:** Tailwind CSS, Radix UI primitives, Lucide Icons, Framer Motion
- **State & Data Fetching:** TanStack React Query v5 with auto-generated typed hooks

### Backend
- **Runtime & Framework:** Node.js 20+, Express 5, TypeScript
- **Database & ORM:** PostgreSQL, Drizzle ORM
- **Validation:** Zod schemas shared across client and server
- **AI Integration:** OpenAI API for automated insights generation and conversational Q&A

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v20 or higher)
- [pnpm](https://pnpm.io/) (`npm install -g pnpm`)
- PostgreSQL database (local or cloud, e.g. Supabase, Neon)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/GayatriDushing2345/Insighta.git
cd Insighta
pnpm install
```

### 2. Environment Variables
Create a `.env` file in the project root:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/insighta
SESSION_SECRET=your-random-secret-key-at-least-32-chars
OPENAI_API_KEY=sk-...
PORT=8080
```

### 3. Initialize Database
```bash
pnpm --filter @workspace/db run push
```

### 4. Run Development Servers
Open two terminal windows:

**Terminal 1 — Backend API:**
```bash
pnpm --filter @workspace/api-server run dev
# Running on http://localhost:8080
```

**Terminal 2 — Frontend Application:**
```bash
pnpm --filter @workspace/insighta run dev
# Running on http://localhost:5173
```

### 5. Build for Production
```bash
pnpm run build
```

---

## 🧪 Testing & Verification
API endpoints are designed following RESTful principles and tested with Postman:
- `GET /api/healthz` — Health check
- `POST /api/businesses` — Create business profile
- `GET /api/businesses/:id` — Retrieve business analytics & profile
- `POST /api/businesses/:id/datasets` — Ingest CSV/JSON business dataset
- `POST /api/businesses/:id/insights` — Trigger AI insight generation
- `POST /api/businesses/:id/ask` — Natural language Q&A on dataset

---

## 👤 Author
**Gayatri Dushing**
- GitHub: [@GayatriDushing2345](https://github.com/GayatriDushing2345)
