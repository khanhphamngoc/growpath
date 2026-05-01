# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Growpath** is a [describe your product here]. This CLAUDE.md is the single source of truth for conventions, architecture decisions, and collaboration norms in this repo.

## Key Docs

| File | Purpose |
|---|---|
| `docs/BLUEPRINT.md` | Steel Thread roadmap — what we're building and in what order |
| `docs/SKILL_PARTNER.md` | How to engage Claude as a collaborative co-founder |

## Project Structure

```
/growpath
├── CLAUDE.md             # Core project memory & conventions (this file)
├── /docs                 # Strategy, skill definitions, and user research
│   ├── SKILL_PARTNER.md  # Collaborative co-founder engagement skill
│   └── BLUEPRINT.md      # Steel Thread roadmap
├── /src                  # Application source code
├── /tools                # Custom scripts for AI automation
└── .claude/              # Session settings and automation hooks
    └── settings.json     # Permissions, hooks, and env vars
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

> Record significant decisions here as they are made. Format:
> **Decision:** What was chosen
> **Why:** The reason
> **Trade-off:** What was accepted

## Conventions

- Keep features small and shippable — one Steel Thread milestone at a time
- Before building, confirm the user problem is validated in `docs/`
- Prefer editing existing files over creating new ones
- No speculative abstractions — build only what the current milestone requires
