# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Growpath** is a Vietnamese family growth platform helping parents and children (8–13) discover the child's true persona together and build a structured skill journey toward a dream career. This CLAUDE.md is the single source of truth for conventions, architecture decisions, and collaboration norms in this repo.

## Key Docs

| File | Purpose |
|---|---|
| `docs/BLUEPRINT.md` | Steel Thread roadmap — what we're building and in what order |
| `docs/PRODUCT_VISION.md` | Vision, mission, and the problem we're solving — read for strategic direction |
| `docs/PRD.md` | Product requirements, user stories, acceptance criteria, risk register, success metrics |
| `docs/PLAN.md` | Phase-by-phase build plan: 6 phases, 27 slices, 3 validation gates, definition of done |
| `docs/ref/` | Archived source documents (PRD_MVP.md, MVP_PLAN.md, IMPLEMENTATION_SEQUENCE.md, FATAL_FLAW.md) |

## Project Structure

```
/growpath
├── CLAUDE.md                   # Core project memory & conventions (this file)
├── .env                        # Non-secret local dev defaults (DATABASE_URL, REDIS_URL) — committed
├── .env.local                  # Secrets (NEXTAUTH_SECRET, GOOGLE_*, ANTHROPIC_API_KEY) — gitignored
├── .env.example                # Template showing all required vars
├── prisma.config.ts            # Prisma 7 CLI config (datasource URL, schema path)
├── prisma/schema.prisma        # DB schema — 10 entities, no datasource URL (moved to prisma.config.ts)
├── prisma/seed.ts              # Sample family seed (Nguyễn Thị Hương + Nguyễn Minh Anh)
├── /docs                       # Strategy, skill definitions, and user research
│   └── BLUEPRINT.md            # Steel Thread roadmap
├── /src
│   ├── /app/api/health/        # GET /api/health — DB + Redis liveness check
│   └── /lib/
│       ├── db.ts               # Prisma client singleton (uses PrismaPg adapter)
│       ├── redis.ts            # ioredis singleton
│       └── /ai/                # AI client abstraction layer
│           ├── index.ts        # Public export: `ai` singleton + types
│           ├── client.ts       # Factory: picks Ollama (dev) or Anthropic (prod)
│           ├── types.ts        # AIMessage, AICompletionOptions, AIProvider
│           └── /providers/
│               ├── anthropic.ts    # Claude Sonnet 4.6 (synthesis) + Haiku 4.5 (nudges)
│               └── ollama.ts       # qwen2.5:7b (synthesis) + llama3.2:3b (nudges)
├── /tests
│   ├── setup.ts                # Vitest global setup
│   ├── helpers/db.ts           # cleanDb() + disconnectDb() for integration tests
│   └── integration/            # Integration tests (require Docker postgres + redis)
├── /tools                      # Custom scripts for AI automation
└── .claude/                    # Session settings and automation hooks
```

## Commands

```bash
# Development
npm run dev                      # Next.js dev server (http://localhost:3000)
npm run build                    # Production build
npm run lint                     # ESLint (zero warnings policy)
npm run test                     # Unit tests (Vitest, no Docker needed)
npm run test:integration         # Integration tests (requires docker compose up postgres redis)
npm run test:e2e                 # Playwright E2E tests

# Database
docker compose up postgres redis # Start local DB + cache
npm run db:migrate               # prisma migrate dev (creates + applies migration)
npm run db:seed                  # Seed sample Vietnamese family data
npm run db:studio                # Open Prisma Studio at localhost:5555
npm run db:generate              # Regenerate Prisma client after schema changes
npm run db:reset                 # Reset DB and re-seed (destructive)
```

## Architecture Decisions

**Decision:** Prisma 7 driver adapter (`@prisma/adapter-pg`) instead of URL in schema
**Why:** Prisma 7 removed `url` from `schema.prisma`. Connection is now provided via a driver adapter at client construction. The Prisma CLI (migrate, studio) reads the URL from `prisma.config.ts` which loads `.env` via `dotenv/config`.
**Trade-off:** Requires `prisma.config.ts` to exist alongside `schema.prisma`. `dotenv` must be a transitive dependency.

**Key files:**
- `prisma.config.ts` — CLI datasource (reads `DATABASE_URL` from `.env`)
- `src/lib/db.ts` — runtime client (`new PrismaPg(process.env.DATABASE_URL!)`)
- `prisma/schema.prisma` — schema only, no URL

---

**Decision:** AI client abstraction layer at `src/lib/ai/`
**Why:** Claude API costs money during dev/test; Ollama runs free models locally with the same interface.
**Trade-off:** Behaviour differs between local models and Claude — always test AI flows against the real API before shipping.

**Usage:**
```typescript
import { ai } from '@/lib/ai';

const result = await ai.complete(
  [
    { role: 'system', content: 'You are a helpful persona coach.' },
    { role: 'user', content: 'Synthesise this child's persona...' },
  ],
  { model: 'synthesis' }  // 'synthesis' | 'nudge'
);
```

**Model mapping:**

| Semantic role | Local (Ollama) | Production (Claude) |
|---|---|---|
| `synthesis` | `qwen3.5:9b` | `claude-sonnet-4-6` |
| `nudge` | `llama3.2:3b` | `claude-haiku-4-5-20251001` |

**Provider selection:** `AI_PROVIDER` env var overrides; defaults to `ollama` in `development`, `anthropic` in `production`.

**Required packages:** `@anthropic-ai/sdk`, `openai` (used as Ollama client via OpenAI-compatible API).

## Conventions

- Keep features small and shippable — one Steel Thread milestone at a time
- Before building, confirm the user problem is validated in `docs/`
- Prefer editing existing files over creating new ones
- No speculative abstractions — build only what the current milestone requires

## Code generation rules
- Plan out what changes and present for me to review first before write any line of code
