# GrowPath MVP — Technical Design Document

> Version 1.0 | 2026-05-02  
> Scope: 12-week solo build (S-01 → S-27) | For review before any code is written.

---

## Table of Contents

1. [High-Level Architecture](#1-high-level-architecture)
2. [Technology Stack](#2-technology-stack)
3. [Folder Structure](#3-folder-structure)
4. [Database Schema](#4-database-schema)
5. [API Reference](#5-api-reference)
6. [Job Queue Architecture](#6-job-queue-architecture)
7. [Sequence Diagrams](#7-sequence-diagrams)
8. [User Flow Diagrams](#8-user-flow-diagrams)
9. [Infrastructure — Docker Compose](#9-infrastructure--docker-compose)
10. [Security Model](#10-security-model)
11. [AI Pipeline Design](#11-ai-pipeline-design)
12. [Observability Plan](#12-observability-plan)
13. [Resolved Decisions](#13-resolved-decisions)

---

## 1. High-Level Architecture

```mermaid
graph TD
    subgraph Browser["Browser (Responsive Web)"]
        PA[Parent App\n/parent/*]
        CA[Child App\n/child/*]
    end

    subgraph NextJS["Next.js 14 — App Router (Vercel)"]
        MW["Middleware\n(Role Guard + Auth)"]
        AR["API Routes\n/api/*"]
        SC["Server Components\n(RSC)"]
    end

    subgraph Workers["Background Workers (Docker / EC2)"]
        BQ["BullMQ Workers\n(AI Jobs)"]
        CR["Cron Jobs\n(Scenarios + Nudges)"]
    end

    subgraph Data["Data Layer"]
        PG[("PostgreSQL\n(Prisma ORM)")]
        RD[("Redis\n(Queue + Sessions + Cache)")]
    end

    subgraph AILayer["AI Abstraction Layer — src/lib/ai/"]
        AC["ai.complete()\nAIProvider interface"]
        OL["OllamaProvider\n(local dev)"]
        AN["AnthropicProvider\n(production)"]
    end

    subgraph Obs["Observability Stack"]
        OT["OpenTelemetry\n(traces + metrics)"]
        JG["Jaeger\n(trace UI)"]
        PR["Prometheus\n(metrics store)"]
        GR["Grafana\n(dashboards)"]
    end

    PA --> MW
    CA --> MW
    MW --> AR
    MW --> SC
    AR --> PG
    AR --> RD
    AR --> BQ
    BQ --> AC
    CR --> BQ
    AC --> OL
    AC --> AN
    AR --> OT
    BQ --> OT
    OT --> JG
    OT --> PR
    PR --> GR
```

### Layer Responsibilities

| Layer | Responsibility | Must NOT |
|---|---|---|
| `app/` — Next.js routes | HTTP request/response, session reading, calling core services | Contain business logic |
| `src/core/` — Domain services | Business rules, validation, orchestration | Import Next.js or framework packages |
| `src/lib/` — Infrastructure | DB client, AI client, queue client, auth config | Contain business rules |
| BullMQ Workers | Execute async AI jobs, retry on failure | Block HTTP request cycle |
| Cron Jobs | Generate weekly scenarios + nudges | Read session context |

---

## 2. Technology Stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | Next.js 14+ (App Router) | RSC + API Routes in one deployment; Vercel-native |
| Styling | Tailwind CSS + shadcn/ui | Fast UI iteration; accessible components |
| ORM | Prisma | Vendor-agnostic; type-safe queries; easy migrations |
| Database | PostgreSQL (Docker → AWS RDS) | ACID; JSONB for flexible AI output storage |
| Auth | NextAuth.js v5 | Google OAuth; session management; middleware integration |
| Job Queue | BullMQ + Redis | Durable async AI jobs; retry logic; cron scheduling built-in |
| Cache / Sessions | Redis | BullMQ backend; handoff token store; future response caching |
| AI (production) | Claude Sonnet 4.6 (synthesis) + Haiku 4.5 (nudges/eval) | Best Vietnamese reasoning; cost-efficient for high-frequency nudges |
| AI (local dev) | Ollama — qwen2.5:7b + llama3.2:3b | Zero API cost during development |
| Validation | Zod | Runtime schema validation for AI output + API boundaries |
| Testing | Vitest + Playwright | Fast, native ESM; better Next.js App Router compatibility than Jest |
| Observability | OpenTelemetry + Prometheus + Grafana + Jaeger | Industry standard; full trace → metric → dashboard pipeline |
| Logging | Pino (structured JSON) | Low-overhead; JSON output compatible with ELK/Loki |
| Hosting | Vercel (app) + Docker/EC2 (BullMQ workers) | Serverless frontend; persistent workers for job queue |
| Cloud | AWS (primary) | RDS, ElastiCache, EC2 for workers |
| Payment (deferred) | MoMo + ZaloPay + VNPay | Post-MVP; time-gated trial in code for now |

---

## 3. Folder Structure

```
/growpath
├── src/
│   ├── app/                          # Next.js App Router — framework layer ONLY
│   │   ├── (parent)/                 # Parent route group
│   │   │   ├── layout.tsx            # Parent shell (indigo theme)
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── persona/page.tsx
│   │   │   ├── career/page.tsx
│   │   │   └── digest/page.tsx
│   │   ├── (child)/                  # Child route group
│   │   │   ├── layout.tsx            # Child shell (orange/warm theme)
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── persona/page.tsx
│   │   │   ├── journey/page.tsx
│   │   │   └── checkin/page.tsx
│   │   ├── api/                      # API routes — thin controllers only
│   │   │   ├── health/route.ts
│   │   │   ├── metrics/route.ts
│   │   │   ├── auth/
│   │   │   │   ├── [...nextauth]/route.ts
│   │   │   │   └── handoff/route.ts
│   │   │   ├── parent/
│   │   │   │   ├── profile/route.ts
│   │   │   │   ├── children/route.ts
│   │   │   │   └── child/[id]/
│   │   │   │       ├── persona/route.ts
│   │   │   │       ├── dream-context/route.ts
│   │   │   │       ├── career-flag/route.ts
│   │   │   │       ├── roadmap-note/route.ts
│   │   │   │       ├── digest/route.ts
│   │   │   │       └── milestones/route.ts
│   │   │   ├── child/
│   │   │   │   ├── profile/route.ts
│   │   │   │   ├── persona/route.ts
│   │   │   │   ├── dream/route.ts
│   │   │   │   ├── career/
│   │   │   │   │   ├── clusters/route.ts
│   │   │   │   │   └── select/route.ts
│   │   │   │   ├── roadmap/route.ts
│   │   │   │   ├── skill/focus/route.ts
│   │   │   │   └── checkin/route.ts
│   │   │   └── discovery/
│   │   │       ├── parent/route.ts
│   │   │       └── child/route.ts
│   │   ├── login/page.tsx
│   │   └── layout.tsx                # Root layout
│   │
│   ├── core/                         # Domain logic — 90% test coverage required
│   │   ├── persona/
│   │   │   ├── schema.ts             # Zod schemas: PersonaDimensions, PersonaDelta
│   │   │   ├── service.ts            # Synthesis orchestration, version management
│   │   │   └── prompts.ts            # Canonical persona synthesis prompt (from G-02)
│   │   ├── career/
│   │   │   ├── schema.ts             # Zod schemas: CareerCluster, SkillRoadmap
│   │   │   ├── service.ts            # Cluster + roadmap generation logic
│   │   │   └── prompts.ts
│   │   ├── checkin/
│   │   │   ├── schema.ts             # Zod schemas: WeeklyCheckin, Scenario, Nudge
│   │   │   ├── service.ts            # Check-in processing, streak calculation
│   │   │   └── prompts.ts
│   │   ├── milestone/
│   │   │   ├── schema.ts
│   │   │   └── service.ts            # Milestone detection, XP calculation
│   │   └── auth/
│   │       └── service.ts            # Handoff token generation + validation
│   │
│   ├── lib/                          # Infrastructure
│   │   ├── ai/                       # Already built — AI client abstraction
│   │   │   ├── index.ts
│   │   │   ├── client.ts
│   │   │   ├── types.ts
│   │   │   └── providers/
│   │   │       ├── anthropic.ts
│   │   │       └── ollama.ts
│   │   ├── db/
│   │   │   └── index.ts              # Prisma singleton (globalThis pattern)
│   │   ├── queue/
│   │   │   ├── index.ts              # BullMQ queue + worker registry
│   │   │   └── jobs/
│   │   │       ├── persona.synthesise.ts
│   │   │       ├── career.generateClusters.ts
│   │   │       ├── career.generateRoadmap.ts
│   │   │       ├── digest.generate.ts
│   │   │       ├── scenario.generate.ts
│   │   │       └── nudge.generate.ts
│   │   ├── auth/
│   │   │   └── config.ts             # NextAuth v5 config
│   │   └── observability/
│   │       └── index.ts              # OpenTelemetry init + span helpers
│   │
│   └── components/                   # Shared UI components
│       ├── parent/                   # Parent-specific components
│       ├── child/                    # Child-specific components
│       └── shared/                   # Role-agnostic UI primitives
│
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts                       # Sample: Nguyễn Thị Hương + Nguyễn Minh Anh
│
├── tests/
│   ├── fixtures/
│   │   └── claude/
│   │       └── persona_vi/           # Gold-standard Vietnamese persona fixtures (G-01)
│   ├── unit/
│   ├── integration/
│   └── e2e/                          # Playwright tests
│
├── docker-compose.yml
├── .env.example
└── middleware.ts                     # Next.js middleware — role guard
```

---

## 4. Database Schema

### 4.1 Full Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── Enums ───────────────────────────────────────────────────────────────────

enum Role {
  PARENT
  CHILD
}

enum MilestoneType {
  FIRST_CHECKIN
  SKILL_LEVEL_UP
  WEEK_STREAK_7
  FIRST_ROADMAP_MONTH
}

// ─── NextAuth Tables ──────────────────────────────────────────────────────────

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

// ─── Core Domain Tables ───────────────────────────────────────────────────────

model User {
  id                       String       @id @default(cuid())
  email                    String       @unique
  name                     String
  role                     Role
  city                     String?
  philosophyAcknowledgedAt DateTime?
  createdAt                DateTime     @default(now())
  updatedAt                DateTime     @updatedAt

  accounts     Account[]
  sessions     Session[]
  parentLinks  FamilyLink[] @relation("ParentLinks")
  childLinks   FamilyLink[] @relation("ChildLinks")
  childProfile ChildProfile?
}

model FamilyLink {
  parentId  String
  childId   String
  createdAt DateTime @default(now())

  parent User @relation("ParentLinks", fields: [parentId], references: [id], onDelete: Cascade)
  child  User @relation("ChildLinks",  fields: [childId],  references: [id], onDelete: Cascade)

  @@id([parentId, childId])
}

model ChildProfile {
  id        String   @id @default(cuid())
  userId    String   @unique
  dob       DateTime
  grade     Int
  school    String?
  avatarUrl String?
  xp        Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user           User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  personas       Persona[]
  dreams         Dream[]
  skillRoadmaps  SkillRoadmap[]
  weeklyCheckins WeeklyCheckin[]
  weeklyScenarios WeeklyScenario[]
  weeklyNudges   WeeklyNudge[]
  parentDigests  ParentDigest[]
  milestones     Milestone[]
}

model Persona {
  id                   String       @id @default(cuid())
  childId              String
  version              Int          @default(1)
  dimensions           Json         @db.JsonB   // PersonaDimensions — validated by Zod on write
  headline             String
  childConfirmedAt     DateTime?
  needsEditorialReview Boolean      @default(false)
  createdAt            DateTime     @default(now())

  child ChildProfile @relation(fields: [childId], references: [id], onDelete: Cascade)
  delta PersonaDelta?

  @@unique([childId, version])
}

model PersonaDelta {
  id                  String  @id @default(cuid())
  personaId           String  @unique
  parentView          Json    @db.JsonB   // raw parent input summary
  childView           Json    @db.JsonB   // raw child input summary
  deltaNotes          Json    @db.JsonB   // DeltaNotes[] — validated by Zod
  possiblyUnderstated Json    @db.JsonB   // string[] of dimension keys

  persona Persona @relation(fields: [personaId], references: [id], onDelete: Cascade)
}

model Dream {
  id            String   @id @default(cuid())
  childId       String
  text          String
  parentContext String?  @db.Text
  version       Int      @default(1)
  createdAt     DateTime @default(now())

  child          ChildProfile    @relation(fields: [childId], references: [id], onDelete: Cascade)
  careerClusters CareerCluster[]
}

model CareerCluster {
  id              String   @id @default(cuid())
  dreamId         String
  clusters        Json     @db.JsonB   // CareerClusterItem[] — validated by Zod
  selectedCluster String?             // cluster title key
  parentFlag      String?  @db.Text   // private parent concern — never shown to child
  createdAt       DateTime @default(now())

  dream        Dream         @relation(fields: [dreamId], references: [id], onDelete: Cascade)
  skillRoadmap SkillRoadmap?
}

model SkillRoadmap {
  id               String   @id @default(cuid())
  childId          String
  careerClusterId  String   @unique
  roadmap          Json     @db.JsonB   // SkillRoadmap — validated by Zod
  currentWeekFocus String?
  parentNotes      String?  @db.Text   // private parent notes — never shown to child
  createdAt        DateTime @default(now())

  child         ChildProfile  @relation(fields: [childId], references: [id], onDelete: Cascade)
  careerCluster CareerCluster @relation(fields: [careerClusterId], references: [id], onDelete: Cascade)
}

model WeeklyScenario {
  id         String   @id @default(cuid())
  childId    String
  weekNumber Int
  question   String   @db.Text   // AI-generated scenario question (max 100 words)
  createdAt  DateTime @default(now())

  child    ChildProfile    @relation(fields: [childId], references: [id], onDelete: Cascade)
  checkins WeeklyCheckin[]

  @@unique([childId, weekNumber])
}

model WeeklyCheckin {
  id               String   @id @default(cuid())
  childId          String
  weekNumber       Int
  scenarioId       String?
  mood             String              // emoji key: 'great' | 'good' | 'okay' | 'hard'
  activityLog      String   @db.Text  // min 20 chars
  reflection       String   @db.Text
  scenarioResponse String?  @db.Text
  createdAt        DateTime @default(now())

  child    ChildProfile    @relation(fields: [childId], references: [id], onDelete: Cascade)
  scenario WeeklyScenario? @relation(fields: [scenarioId], references: [id])

  @@unique([childId, weekNumber])
}

model WeeklyNudge {
  id          String    @id @default(cuid())
  childId     String
  weekNumber  Int
  content     String    @db.Text   // max 50 words, question or challenge format
  dismissedAt DateTime?
  createdAt   DateTime  @default(now())

  child ChildProfile @relation(fields: [childId], references: [id], onDelete: Cascade)

  @@unique([childId, weekNumber])
}

model ParentDigest {
  id         String    @id @default(cuid())
  childId    String
  weekNumber Int
  content    Json      @db.JsonB  // DigestContent — validated by Zod
  viewedAt   DateTime?
  createdAt  DateTime  @default(now())

  child ChildProfile @relation(fields: [childId], references: [id], onDelete: Cascade)

  @@unique([childId, weekNumber])
}

model Milestone {
  id         String        @id @default(cuid())
  childId    String
  type       MilestoneType
  title      String
  xp         Int
  achievedAt DateTime      @default(now())

  child ChildProfile @relation(fields: [childId], references: [id], onDelete: Cascade)

  @@unique([childId, type])  // idempotency guard — each type fires exactly once per child
}
```

### 4.2 Entity Count

| Category | Tables |
|---|---|
| NextAuth (required) | Account, Session, VerificationToken |
| Core domain | User, FamilyLink, ChildProfile |
| Persona | Persona, PersonaDelta |
| Career | Dream, CareerCluster, SkillRoadmap |
| Weekly ritual | WeeklyScenario, WeeklyCheckin, WeeklyNudge, ParentDigest |
| Milestones | Milestone |
| **Total** | **16 tables** |

> **Note:** S-02 spec lists 10 entities. The expanded count adds NextAuth tables (3) and AI output storage tables (WeeklyScenario, WeeklyNudge, ParentDigest) that are required by the feature spec but were omitted from the original list.

### 4.3 Zod Schemas (Domain Contracts)

JSON columns are validated at the application boundary — never written raw from Claude output.

```typescript
// src/core/persona/schema.ts
export const PersonaDimensionsSchema = z.object({
  dreams:        z.string().min(10),
  interests:     z.string().min(10),
  strengths:     z.string().min(10),
  personality:   z.string().min(10),
  growthEdges:   z.string().min(10),
  values:        z.string().min(10),
  learningStyle: z.string().min(10),
});

export const DeltaNoteSchema = z.object({
  dimension: z.enum(['dreams','interests','strengths','personality','growthEdges','values','learningStyle']),
  note:      z.string(),
});

export const PersonaDeltaContentSchema = z.object({
  deltaNotes:          z.array(DeltaNoteSchema),
  possiblyUnderstated: z.array(z.string()),
  notes:               z.string(),
});

// src/core/career/schema.ts
export const CareerClusterItemSchema = z.object({
  title:       z.string(),
  emoji:       z.string(),
  description: z.string().max(200),
  skillTags:   z.array(z.string()).min(4).max(6),
  examples:    z.array(z.string()),
});

export const CareerClustersSchema = z.array(CareerClusterItemSchema).min(2).max(3);

export const RoadmapQuarterSchema = z.object({
  quarter:      z.number().int().min(1).max(4),
  monthlyGoals: z.array(z.string()).length(3),
  weeklySkills: z.array(z.string()),
});

export const SkillRoadmapSchema = z.array(RoadmapQuarterSchema).length(4);

// src/core/checkin/schema.ts
export const DigestContentSchema = z.object({
  streakWeeks:         z.number().int(),
  xpDelta:             z.number().int(),
  aiHighlight:         z.string(),
  scenarioQuestion:    z.string().optional(),
  scenarioResponse:    z.string().optional(),
  conversationStarter: z.string(),
  nextWeekPrep:        z.string(),
});
```

---

## 5. API Reference

All endpoints require an authenticated session unless noted. Role enforcement happens at the middleware level AND inside each route handler.

### 5.1 Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/health` | None | Health check → `{status: "ok"}` |
| `GET` | `/api/metrics` | None | Prometheus metrics scrape endpoint |
| `POST` | `/api/auth/handoff` | PARENT session | Generate child handoff token (10-min TTL) |
| `GET` | `/api/auth/handoff` | None | Validate handoff token → create child session |
| `GET` | `/api/auth/handoff/status` | PARENT session | Check if handoff session is still active |

**POST /api/auth/handoff**
```typescript
// Response
{ token: string; expiresAt: string; childId: string }
```

**GET /api/auth/handoff?token=xxx**
```typescript
// Redirects to /child/dashboard on success; /login on failure
```

### 5.2 Parent APIs

All require `role=PARENT` session. Return 403 with `role=CHILD`.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/parent/profile` | Parent profile + `philosophyAcknowledgedAt` status |
| `PATCH` | `/api/parent/profile` | Set `philosophyAcknowledgedAt` |
| `GET` | `/api/parent/children` | List linked children with journey state |
| `GET` | `/api/parent/child/:id/persona` | Persona + delta (403 until `childConfirmedAt` set) |
| `POST` | `/api/parent/child/:id/dream-context` | Parent context on child's dream |
| `POST` | `/api/parent/child/:id/career-flag` | Private concern on career cluster selection |
| `POST` | `/api/parent/child/:id/roadmap-note` | Private note on skill roadmap |
| `GET` | `/api/parent/child/:id/digest/latest` | Latest weekly digest |
| `GET` | `/api/parent/child/:id/digest/history` | All digests in order |
| `GET` | `/api/parent/child/:id/milestones` | All milestones in order |

**GET /api/parent/child/:id/persona**
```typescript
// Returns 403 if childConfirmedAt is null
// Returns 200:
{
  persona: {
    id: string; version: number; dimensions: PersonaDimensions;
    headline: string; childConfirmedAt: string; createdAt: string;
  };
  delta: {
    deltaNotes: DeltaNote[]; possiblyUnderstated: string[]; notes: string;
  };
  conversationStarter: string;  // Claude Haiku generated
}
```

### 5.3 Child APIs

All require `role=CHILD` session. Return 403 with `role=PARENT`.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/child/profile` | Child profile + XP + streak |
| `GET` | `/api/child/persona` | Child's persona (no delta fields ever) |
| `POST` | `/api/child/persona/confirm` | Confirm persona (sets `childConfirmedAt`) |
| `POST` | `/api/child/persona/amend` | Flag one dimension for re-synthesis |
| `GET` | `/api/child/persona/history` | All persona versions in order |
| `POST` | `/api/child/dream` | Submit dream career text |
| `GET` | `/api/child/career/clusters` | Get generated career clusters |
| `POST` | `/api/child/career/select` | Select a career cluster |
| `GET` | `/api/child/roadmap` | Full skill roadmap with lock states |
| `POST` | `/api/child/skill/focus` | Set this week's skill focus |
| `GET` | `/api/child/checkin/scenario/current` | Current week's scenario question |
| `POST` | `/api/child/checkin` | Submit weekly check-in |

**GET /api/child/persona**
```typescript
// NEVER returns delta, parentView, childView, possiblyUnderstated
{
  persona: {
    id: string; version: number; dimensions: PersonaDimensions;
    headline: string; childConfirmedAt: string | null; createdAt: string;
  };
  synthesising: boolean;  // true while BullMQ job is running
}
```

**POST /api/child/checkin**
```typescript
// Request
{ mood: 'great'|'good'|'okay'|'hard'; activityLog: string; reflection: string; scenarioResponse?: string }

// Response — milestone field only present when one was just triggered
{ weekNumber: number; xpEarned: number; milestone?: { type: MilestoneType; title: string; xp: number } }
```

### 5.4 Discovery APIs

Called from parent/child forms. Trigger BullMQ synthesis when both exist.

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/discovery/parent` | PARENT | Save 7-dimension parent form + auto-save draft |
| `POST` | `/api/discovery/child` | CHILD | Save 7-dimension child form + enqueue synthesis if both done |

---

## 6. Job Queue Architecture

### 6.1 Jobs

| Job Name | Trigger | AI Model | Output |
|---|---|---|---|
| `persona.synthesise` | Both discovery forms submitted | Sonnet (synthesis) + Haiku (self-eval) | Persona + PersonaDelta saved to DB |
| `career.generateClusters` | Child dream submitted | Sonnet (synthesis) | CareerCluster saved to DB |
| `career.generateRoadmap` | Career cluster selected | Sonnet (synthesis) | SkillRoadmap saved to DB |
| `digest.generate` | Child check-in submitted | Haiku (nudge) | ParentDigest saved to DB |
| `scenario.generate` | Cron: Mon 08:00 ICT | Haiku (nudge) | WeeklyScenario saved per active child |
| `nudge.generate` | Cron: Wed 10:00 ICT | Haiku (nudge) | WeeklyNudge saved per active child |

### 6.2 Retry Policy

All jobs use exponential backoff: 3 attempts, delays `[5s, 30s, 120s]`.

On permanent failure: job moves to `failed` queue; `Persona.needsEditorialReview` set to `true` for synthesis jobs.

### 6.3 Queue Configuration

```typescript
// src/lib/queue/index.ts
const defaultJobOptions = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 5000 },
  removeOnComplete: { count: 100 },
  removeOnFail:     { count: 50 },
};
```

### 6.4 Cron Schedule

```typescript
// Vietnam timezone = UTC+7
// Monday 08:00 ICT = Monday 01:00 UTC
new Worker('scenario.generate', scenarioProcessor, { connection: redis });
new CronJob('0 1 * * 1', () => queue.add('scenario.generate', {}));

// Wednesday 10:00 ICT = Wednesday 03:00 UTC
new CronJob('0 3 * * 3', () => queue.add('nudge.generate', {}));
```

---

## 7. Sequence Diagrams

### 7.1 Authentication Flow

```mermaid
sequenceDiagram
    actor U as User
    participant B as Browser
    participant MW as Next.js Middleware
    participant NA as NextAuth v5
    participant DB as PostgreSQL

    U->>B: Navigate to /login
    B->>NA: Click "Đăng nhập với Google"
    NA->>B: Redirect to Google OAuth
    U->>B: Complete Google login
    B->>NA: OAuth callback with code
    NA->>DB: Upsert User (email, name, role)
    Note over NA,DB: role=PARENT or CHILD set at registration
    NA->>B: Set session cookie
    B->>MW: Request /parent/dashboard (role=PARENT)
    MW->>MW: Validate role in session
    MW->>B: Allow → /parent/dashboard
    Note over MW: CHILD session → redirect to /child/dashboard
```

### 7.2 Device Handoff (Parent → Child)

```mermaid
sequenceDiagram
    actor P as Parent
    actor C as Child
    participant API as Next.js API
    participant RD as Redis
    participant DB as PostgreSQL

    P->>API: POST /api/auth/handoff (PARENT session)
    API->>API: Sign JWT {childId, type: handoff, exp: +10min}
    API->>RD: SET handoff:{token} childId EX 600
    API-->>P: {token, expiresAt, childId}
    P->>C: Hand device with token URL

    C->>API: GET /api/auth/handoff?token=xxx
    API->>RD: GET handoff:{token}
    RD-->>API: childId (or nil if expired)
    alt Token valid
        API->>DB: Fetch child User record
        API->>API: Create NextAuth session (role=CHILD)
        API-->>C: Redirect to /child/dashboard
    else Token expired or invalid
        API-->>C: Redirect to /login
    end
```

### 7.3 Persona Synthesis Pipeline (Core Flow)

```mermaid
sequenceDiagram
    actor P as Parent
    actor C as Child
    participant API as Next.js API
    participant DB as PostgreSQL
    participant Q as BullMQ
    participant Sonnet as Claude Sonnet 4.6
    participant Haiku as Claude Haiku 4.5

    P->>API: POST /api/discovery/parent {7 dimensions}
    API->>DB: Save parent submission draft
    API->>DB: Check child submitted → false
    API-->>P: 200 {status: "saved"}

    C->>API: POST /api/discovery/child {7 dimensions}
    API->>DB: Save child submission
    API->>DB: Check parent submitted → true
    API->>Q: Enqueue persona.synthesise {childId}
    API-->>C: 200 {status: "saved", synthesising: true}

    Q->>Sonnet: Synthesis prompt (parent + child + few-shot examples)
    Note over Q,Sonnet: System prompt cached (cache_control: ephemeral)
    Sonnet-->>Q: {dimensions: PersonaDimensions, headline, delta}

    Q->>Haiku: Self-evaluation prompt: score output quality
    Haiku-->>Q: {score, needs_review: false}

    alt needs_review: true
        Q->>Sonnet: Re-prompt with quality feedback
        Sonnet-->>Q: Revised output
        Q->>Haiku: Re-evaluate
        Haiku-->>Q: {needs_review: true}
        Q->>DB: Save Persona {needsEditorialReview: true}
    else Quality acceptable
        Q->>DB: Save Persona {needsEditorialReview: false}
    end
    Q->>DB: Save PersonaDelta

    C->>API: GET /api/child/persona
    API->>DB: Fetch Persona (synthesising = false now)
    API-->>C: 200 {persona, synthesising: false}
    Note over C: Reveal screen shown

    C->>API: POST /api/child/persona/confirm
    API->>DB: SET childConfirmedAt = now()
    API-->>C: 200

    P->>API: GET /api/parent/child/:id/persona
    API->>DB: childConfirmedAt is set → allow
    API-->>P: 200 {persona, delta, conversationStarter}
```

### 7.4 Career Journey Pipeline

```mermaid
sequenceDiagram
    actor C as Child
    actor P as Parent
    participant API as Next.js API
    participant DB as PostgreSQL
    participant Q as BullMQ
    participant Sonnet as Claude Sonnet 4.6

    C->>API: POST /api/child/dream {text: "Nhà thiên văn học"}
    API->>DB: Save Dream (version 1)
    API->>Q: Enqueue career.generateClusters {dreamId, childId}
    API-->>C: 200 {dreamId, generating: true}

    P->>API: POST /api/parent/child/:id/dream-context {context}
    API->>DB: Update Dream.parentContext
    API-->>P: 200

    Q->>Sonnet: Prompt: dream + persona + parent context → 2-3 career clusters
    Sonnet-->>Q: CareerClusterItem[] (validated by Zod)
    Q->>DB: Save CareerCluster

    C->>API: GET /api/child/career/clusters
    API-->>C: 200 {clusters: CareerClusterItem[]}

    C->>API: POST /api/child/career/select {clusterId, clusterTitle}
    API->>DB: SET CareerCluster.selectedCluster
    API->>Q: Enqueue career.generateRoadmap {careerClusterId, childId}
    API-->>C: 200 {generating: true}

    Q->>Sonnet: Prompt: selected cluster + persona + child age → 4-quarter roadmap
    Sonnet-->>Q: SkillRoadmap (validated by Zod)
    Q->>DB: Save SkillRoadmap

    C->>API: GET /api/child/roadmap
    API->>DB: Fetch roadmap with current week lock states
    API-->>C: 200 {roadmap, currentWeek, lockedQuarters}
```

### 7.5 Weekly Ritual Flow

```mermaid
sequenceDiagram
    participant CR as Cron (Mon 08:00 ICT)
    participant CR2 as Cron (Wed 10:00 ICT)
    actor C as Child
    actor P as Parent
    participant API as Next.js API
    participant DB as PostgreSQL
    participant Q as BullMQ
    participant Haiku as Claude Haiku 4.5

    CR->>Q: Enqueue scenario.generate for all active children
    Q->>Haiku: Prompt: career + current skill + persona → scenario question
    Haiku-->>Q: Scenario question (< 100 words)
    Q->>DB: Save WeeklyScenario {childId, weekNumber, question}

    CR2->>Q: Enqueue nudge.generate for all active children
    Q->>Haiku: Prompt: current skill + progress + persona → nudge (< 50 words)
    Haiku-->>Q: Nudge content
    Q->>DB: Save WeeklyNudge {childId, weekNumber, content}

    C->>API: GET /api/child/checkin/scenario/current
    API->>DB: Fetch WeeklyScenario for current weekNumber
    API-->>C: 200 {question}

    C->>API: POST /api/child/checkin {mood, activityLog, reflection, scenarioResponse}
    API->>DB: Save WeeklyCheckin
    API->>API: Run milestone detection (sync)
    alt Milestone triggered
        API->>DB: Save Milestone (@@unique guard — idempotent)
        API->>DB: UPDATE ChildProfile.xp
    end
    API->>Q: Enqueue digest.generate {childId, weekNumber}
    API-->>C: 200 {weekNumber, xpEarned, milestone?}

    Q->>Haiku: Prompt: checkin + previous weeks patterns → digest sections
    Haiku-->>Q: DigestContent (validated by Zod)
    Q->>DB: Save ParentDigest {childId, weekNumber, content}

    P->>API: GET /api/parent/child/:id/digest/latest
    API-->>P: 200 {digest: DigestContent, unread: true}
```

---

## 8. User Flow Diagrams

### 8.1 Parent User Flow

```mermaid
graph TD
    A[Login with Google] --> B{First login?}
    B -->|Yes| C[Philosophy Screen\nTôi hiểu và đồng ý]
    B -->|No| D[Parent Dashboard]
    C --> D

    D --> E{Child submitted\ndiscovery?}
    E -->|No| F[Parent Discovery Form\n7 dimensions]
    E -->|Yes — synthesising| G[Waiting State\nĐang chờ tổng hợp]
    E -->|Done, child confirmed| H[Persona View\n+ Delta + Conversation Starter]

    F --> G
    G --> H

    H --> I[Career Cluster Review\n+ Private Flag]
    I --> J[Roadmap Review\n+ Private Notes]
    J --> K[Weekly Digest\nafter child check-in]
    K --> L[Milestone Notification\n+ Affirmation to say]
    L --> K
```

### 8.2 Child User Flow

```mermaid
graph TD
    A[Login or Handoff from Parent] --> B[Child Dashboard\nOrange theme — XP bar]

    B --> C[Child Discovery Form\n7 dimensions + Privacy Diagram]
    C --> D{Parent also\nsubmitted?}
    D -->|No — waiting| E[Waiting Screen]
    D -->|Yes| F[Persona Reveal Screen\nThe revelation moment]

    E --> F
    F --> G{Feels right?}
    G -->|Đúng rồi!| H[Start Journey CTA]
    G -->|Chỉnh lại| I[Flag one dimension\n→ partial re-synthesis]
    I --> F

    H --> J[Dream Input\nFree text + suggestions]
    J --> K[Career Clusters Display\n2-3 cards]
    K --> L[Select Career Path]
    L --> M[Skill Roadmap View\nCurrent week highlighted]
    M --> N[Weekly Skill Focus\nPick this week]

    N --> O[Mid-week Nudge\nWednesday — dismissable]
    O --> P[Weekly Check-in\nMood + Activity + Reflection + Scenario]
    P --> Q{Milestone\ntriggered?}
    Q -->|Yes| R[Celebration Screen\nConfetti + Badge + XP]
    Q -->|No| M
    R --> M
```

---

## 9. Infrastructure — Docker Compose

```yaml
# docker-compose.yml

services:
  app:
    build: .
    ports: ["3000:3000"]
    environment:
      DATABASE_URL: postgresql://growpath:growpath@postgres:5432/growpath
      REDIS_URL: redis://redis:6379
      AI_PROVIDER: ollama
      OLLAMA_BASE_URL: http://ollama:11434
    depends_on: [postgres, redis, ollama]
    volumes: [".:/app", "/app/node_modules"]

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: growpath
      POSTGRES_PASSWORD: growpath
      POSTGRES_DB: growpath
    ports: ["5432:5432"]
    volumes: ["postgres_data:/var/lib/postgresql/data"]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
    volumes: ["redis_data:/data"]

  ollama:
    image: ollama/ollama
    ports: ["11434:11434"]
    volumes: ["ollama_data:/root/.ollama"]
    # Pull models on startup: qwen2.5:7b + llama3.2:3b

  jaeger:
    image: jaegertracing/all-in-one:latest
    ports: ["16686:16686", "4317:4317"]

  prometheus:
    image: prom/prometheus
    ports: ["9090:9090"]
    volumes: ["./prometheus.yml:/etc/prometheus/prometheus.yml"]

  grafana:
    image: grafana/grafana
    ports: ["3001:3000"]
    depends_on: [prometheus]

volumes:
  postgres_data:
  redis_data:
  ollama_data:
```

**Service summary:**

| Service | Port | Purpose |
|---|---|---|
| app | 3000 | Next.js dev server |
| postgres | 5432 | Primary database |
| redis | 6379 | BullMQ + session store + handoff tokens |
| ollama | 11434 | Local AI inference (dev) |
| jaeger | 16686 | Trace UI |
| prometheus | 9090 | Metrics store |
| grafana | 3001 | Dashboards |

---

## 10. Security Model

### 10.1 Role Enforcement — Two-Layer Strategy

Role enforcement is applied at two independent layers so that a bypass of one layer is caught by the other.

| Layer | Mechanism | Blocks |
|---|---|---|
| Middleware (`middleware.ts`) | Reads session role → redirects wrong-role page requests | UI-level access |
| API route handler | Reads session role → returns 403 | Direct API calls |

Both layers must be present. Relying on middleware alone does not protect API routes called directly.

### 10.2 Child Data Privacy

| Rule | Enforcement |
|---|---|
| Delta never reaches child | `GET /api/child/persona` strips all delta fields in the route handler; unit test asserts zero delta fields in response |
| Parent cannot access persona until child confirms | Route handler checks `childConfirmedAt !== null`; returns 403 otherwise |
| Parent flag is private | `CareerCluster.parentFlag` only returned in parent API responses |
| Parent roadmap notes are private | `SkillRoadmap.parentNotes` only returned in parent API responses |

### 10.3 Handoff Token Security

- Short-lived signed JWT (10-minute TTL)
- Stored in Redis with TTL; Redis expiry is the authoritative source (not JWT `exp` alone)
- Token is single-use: deleted from Redis on first valid use
- Handoff session is scoped to child only — cannot access parent routes

### 10.4 PDPD Compliance (Vietnam Decree 13/2023)

| Requirement | Implementation |
|---|---|
| Parental consent for child data | `philosophyAcknowledgedAt` must be set before any data collection |
| Minimal PII | Collect only: email, name, city, DOB, persona data |
| No school data access | Schools are referral brokers only — zero DB access |
| Data deletion | Cascade deletes on User → all child data removed on account deletion |
| Row-level security | Enforced at API layer (role-scoped queries); RLS policies on Postgres post-MVP |

### 10.5 Input Sanitisation

- All user text inputs sanitised with DOMPurify before storage
- AI output is parsed through Zod schemas — malformed output is rejected before DB write
- SQL injection: prevented by Prisma's parameterised queries (no raw SQL in MVP)

---

## 11. AI Pipeline Design

### 11.1 Model Selection per Task

| Task | Model | Rationale |
|---|---|---|
| Persona synthesis | Claude Sonnet 4.6 | Best Vietnamese reasoning; complex multi-dimension output |
| Career cluster generation | Claude Sonnet 4.6 | Requires cultural + domain knowledge |
| Skill roadmap generation | Claude Sonnet 4.6 | Structured long-form output; age calibration |
| Self-evaluation (quality gate) | Claude Haiku 4.5 | Fast, cheap; binary judgment task |
| Conversation starter | Claude Haiku 4.5 | Short-form; low reasoning load |
| Weekly digest | Claude Haiku 4.5 | Short-form; pattern synthesis from structured data |
| Scenario generation | Claude Haiku 4.5 | Short-form; templated output |
| Mid-week nudge | Claude Haiku 4.5 | Very short-form; < 50 words |

### 11.2 Prompt Caching Strategy

The persona synthesis prompt has a large, static system block (dialect instructions + few-shot examples ≈ 2,000 tokens). This block does not change between calls and must be marked for caching to avoid re-tokenising it on every synthesis job.

```typescript
// src/core/persona/prompts.ts
// Mark the static system block as cacheable using cache_control
export const SYNTHESIS_SYSTEM_BLOCK = {
  type: 'text' as const,
  text: DIALECT_INSTRUCTIONS + FEW_SHOT_EXAMPLES,
  cache_control: { type: 'ephemeral' as const },
};
```

This is passed to the Anthropic SDK directly (not through `ai.complete()`) because the current `AIProvider` interface does not expose `cache_control`. The AnthropicProvider should be extended to support this for synthesis jobs.

**Expected cache hit rate:** ~95% in production (same system prompt across all synthesis calls). Cache TTL: 5 minutes (Anthropic ephemeral cache).

### 11.3 Output Validation Pipeline

Every AI call follows this pipeline before any DB write:

```
Claude output (string)
  → JSON.parse()                 // catch malformed JSON
  → ZodSchema.parse(parsed)      // catch schema violations
  → domain service logic         // apply business rules
  → DB write (Prisma)            // persist validated data
```

On Zod parse failure: job retries (up to 3 attempts). After 3 failures: `needsEditorialReview = true`.

### 11.4 Vietnamese Output Quality

The canonical system prompt (saved to `src/core/persona/prompts.ts` after G-02) must include:
1. Dialect instruction: HCMC Vietnamese, thân mật, non-translated
2. Register instruction: age-appropriate for 8–13; readable aloud by parent and child
3. 2–3 gold-standard few-shot persona examples (written by hand before S-10)

---

## 12. Observability Plan

### 12.1 Custom Spans

Every AI call must wrap with a named span:

| Span Name | Attributes |
|---|---|
| `claude.synthesis` | `childId`, `personaVersion`, `model`, `latencyMs` |
| `claude.careerGeneration` | `childId`, `dreamId`, `model`, `latencyMs` |
| `claude.roadmapGeneration` | `childId`, `careerClusterId`, `model`, `latencyMs` |
| `claude.nudge` | `childId`, `weekNumber`, `model`, `latencyMs` |
| `claude.digest` | `childId`, `weekNumber`, `model`, `latencyMs` |

### 12.2 Key Metrics

| Metric | Alert Threshold |
|---|---|
| `persona.synthesis.latency_p95` | > 30s |
| `persona.synthesis.error_rate` | > 5% |
| `bullmq.job.failed_count` | > 0 in 5 min |
| `api.response_time_p95` | > 2s |
| `checkin.completion_rate` | < 40% (product alert) |

### 12.3 Structured Logging

All log entries use Pino with mandatory fields:

```typescript
logger.info({ childId, jobName, durationMs, status }, 'Job completed');
```

Sensitive fields (`email`, `sessionToken`) must never appear in log output.

---

## 13. Resolved Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Test runner | **Vitest** (not Jest) | Native ESM; better Next.js App Router compatibility; faster |
| API layer | **API Routes** (not Server Actions) | Server Actions bypass middleware — cannot enforce role-based 403s reliably |
| JSON columns | **JSONB + Zod** | Flexible for AI output evolution; typed + validated at app boundary |
| Prisma singleton | **globalThis pattern** | Prevents connection pool exhaustion on Next.js hot reload |
| Handoff token storage | **JWT + Redis TTL** | Single-use; revocable; Redis already in stack |
| Session store | **NextAuth default (DB sessions)** | Avoids JWT rotation complexity; sessions invalidated on DB delete |
| AI call in request cycle | **Never** — always via BullMQ | Claude P50 latency ~5s; cannot block HTTP request |
| Prompt caching | **Ephemeral cache on system prompt** | ~2,000 token static block; ~95% cache hit rate in production |

---

*GrowPath Technical Design Document v1.0 — Ready for review. No code written.*
