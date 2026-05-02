# GrowPath — Steel Thread Blueprint

> Single source of truth for what we're building and in what order.
> Last updated: 2026-05-01

---

## North Star

Help Vietnamese parents and children (aged 8–13) discover the child's true persona together, then build a structured, adaptable skill journey toward a dream career — celebrated every step of the way.

---

## Core Product Loop

```
Persona Discovery → Dream + Career Path → Skill Journey → Weekly Ritual → Reflect & Adapt → Celebrate
```

---

## Product Pillars

### 1. Persona Discovery
- Parent inputs their observations of the child
- Child inputs their own self-perception
- AI synthesises both into a shared persona — the "shared realisation" moment
- Delta surfaced to parents only; AI facilitates dialogue to resolve conflicts
- Child's view wins for a trial period when agreement isn't reached
- Persona is versioned — evolves through periodic inspect & adapt cycles

**Persona dimensions (in discovery order):**
1. Dreams & Aspirations
2. Interests & Passions
3. Strengths
4. Personality Traits
5. Growth Edges
6. Values
7. Learning Styles

### 2. Dream → Career Journey
- Child names a dream career first (anchors identity)
- Parent provides inputs — experience, environment, context
- AI expands to 2–3 related career cluster paths
- AI generates a skill roadmap per path
- Parent reviews and refines
- Child picks skill focus per week, month, and quarter
- Everything is measurable and trackable

### 3. Skill & Capability Building
- Skills are the unit of growth — not tasks or content completion
- Progress measured via: evidence portfolio + dual assessment (child + parent) + situational scenarios
- AI infers growth patterns from accumulated reflections
- AI and parents provide guidance and learning topics based on scenario performance

### 4. Engagement & Reflection Loop
- **Weekly:** Child check-in (activity log + reflection) + parent digest
- **Mid-week:** AI nudges — prompts and situational scenarios
- **Monthly:** Progress review against milestones
- **Quarterly:** Inspect & adapt — persona realignment + journey adjustment
- **Always:** Milestone celebrations and effort recognition

---

## User Model

| Role | Age | Control Level |
|---|---|---|
| Parent | Adult | High initially, coaching as child grows |
| Child | 8–13 (MVP) | Grows from participant → co-owner |
| Child | 16–18 | Full ownership of journey |

- UX is tailored separately for parent and child
- Parent sees the delta (conflict view); child sees only empowerment
- Schools act as referral brokers only — zero data access

---

## Business Model

- **B2C Freemium**
- **Free tier:** Profile setup, basic persona discovery, one career direction, weekly check-in
- **Premium tier:** Full AI persona synthesis, 2–3 career clusters, skill roadmap, situational scenarios, milestone celebrations, monthly/quarterly reviews
- **Trial:** 30 days full access for first child
- **School channel:** Referral broker model — schools earn incentives per active family, receive zero data

---

## Privacy Model

- Minimal PII: DOB, OAuth token, City, Persona data
- PDPD (Vietnam Decree 13/2023) compliant
- Parental consent required for child accounts
- No individual data shared with schools or third parties
- Row-level security enforced at database level

---

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 14+ (App Router) + Tailwind CSS + shadcn/ui |
| ORM | Prisma (vendor-agnostic, swap DB anytime) |
| Database | PostgreSQL (Docker local → AWS RDS production) |
| Auth | NextAuth.js v5 — Google, Facebook, Telegram, Apple |
| API Gateway | Next.js API routes (MVP) → Kong / AWS API Gateway (scale) |
| Cache | Redis (Docker local → AWS ElastiCache) |
| AI Job Queue | BullMQ + Redis |
| AI (production) | Claude API — Sonnet 4.6 (synthesis) + Haiku 4.5 (nudges) |
| AI (local dev) | Ollama — qwen2.5:7b (synthesis) + llama3.2:3b (nudges) |
| Observability | OpenTelemetry + Prometheus + Grafana + Jaeger |
| Logging | Pino (structured) → ELK / Grafana Loki |
| Hosting | Vercel (frontend) → AWS (production) |
| Mobile (post-MVP) | React Native + Expo |
| Cloud | AWS first, GCP second |

**Local dev:** Full stack via Docker Compose — all free, zero vendor lock-in.

## Standards & Compliance
- **Safety:** Strict TypeScript. Zero `any`. No `@ts-ignore`.
- **Security:** Sanitize all inputs. Use OWASP Top 10 as a mental checklist.
- **Audit:** All sensitive mutations must log to an audit trail.
- **Testing:** 90% coverage for `@/core` and `@/lib`. Use Vitest + Playwright.

## Architectural Patterns
- **Clean Architecture:** Separate Business Logic (Services) from Framework Logic (Controllers/Routes).
- **Domain Driven Design:** Organize by domain (e.g., `Accounts`, `Transactions`, `Users`).
- **Idempotency:** All Server Actions must be idempotent to handle network retries safely.

## Interaction Protocol
- **Loom Check:** Propose a technical design before writing more than 50 lines of code.
- **Dependency Guard:** Do not add new `npm` packages without justifying the bundle size impact.

## Engineering Best Practices
- Follow best practices such as SOLID, DRY, KISS
- Code must be covered by comprehensive tests
- Self-explanation code, only write comments where really need to explain the WHY
- Scalability, Extendability, Security, Observability are among important quality metrics must have
- Take TDD, DDD approach

---

## Market

- **Launch market:** Vietnam — Ho Chi Minh City + Hanoi first
- **Primary language:** Vietnamese (default); English post-MVP
- **Distribution:** School referral network + B2C acquisition
- **Payment:** MoMo, ZaloPay, VNPay + international cards

---

## MVP Scope

The MVP must deliver one thing above all: **the shared persona revelation moment** — when parent and child both see a persona that feels true and surprising.

### In scope
- [ ] Sample parent + child profiles (full registration deferred)
- [ ] Tailored UX for parent vs child
- [ ] Persona discovery flow — parent input + child input + Claude synthesis
- [ ] Dream → 2–3 career clusters → skill roadmap (Claude generated)
- [ ] Weekly check-in + parent digest
- [ ] First milestone celebration

### Deferred (post-MVP)
- Full registration, sign-up, invite flows
- Situational scenario engine
- Portfolio evidence upload
- Quarterly persona realignment
- School referral dashboard
- Payment + subscription management
- Mobile app (React Native)
- English language toggle

---

## MVP Build Order (12-week solo plan)

| Week | Milestone |
|---|---|
| 1–2 | Docker Compose stack + Next.js scaffold + Prisma schema + NextAuth.js |
| 3–4 | Sample parent + child profiles with tailored UX shells |
| 5–6 | Persona discovery flow — parent form + child form + Claude synthesis |
| 7–8 | Dream → career cluster → skill roadmap (Claude) + journey display |
| 9–10 | Weekly check-in + parent digest + first milestone celebration |
| 11–12 | Polish, observability wiring, Vietnamese copy, first real user testing |

---

## Success Metrics (MVP)

- **Activation:** % of families who complete the persona discovery flow
- **Revelation rate:** % who rate the persona as "felt true" (parent + child)
- **Weekly retention:** % of families completing a check-in after week 1, 2, 4
- **Upgrade rate:** % converting from free to premium within 30 days
- **School referrals:** Number of families acquired via school broker channel
