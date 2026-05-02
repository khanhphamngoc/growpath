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
├── .env.example                # Required env vars with defaults
├── /docs                       # Strategy, skill definitions, and user research
│   ├── SKILL_PARTNER.md        # Collaborative co-founder engagement skill
│   └── BLUEPRINT.md            # Steel Thread roadmap
├── /src
│   └── /lib/ai/                # AI client abstraction layer
│       ├── index.ts            # Public export: `ai` singleton + types
│       ├── client.ts           # Factory: picks Ollama (dev) or Anthropic (prod)
│       ├── types.ts            # AIMessage, AICompletionOptions, AIProvider
│       └── /providers/
│           ├── anthropic.ts    # Claude Sonnet 4.6 (synthesis) + Haiku 4.5 (nudges)
│           └── ollama.ts       # qwen3.5:9b (synthesis) + llama3.2:3b (nudges)
├── /tools                      # Custom scripts for AI automation
└── .claude/                    # Session settings and automation hooks
    └── settings.json           # Permissions, hooks, and env vars
```

## Commands

> Fill in as the project stack is decided. Examples:

```bash
# Development
npm run dev          # Start dev server
npm run build        # Production build
npm run test         # Run test suite
npm run test -- path/to/file.test.ts  # Run a single test file
npm run lint         # Lint & type-check
```

## Architecture Decisions

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
