# GrowPath MVP — Implementation Sequence

## Context

The MVP is built slice-by-slice: each slice is independently deliverable, touches DB → API → UI, and is tested before the next begins. Epics are sequenced by **risk, not feature completeness** — the riskiest assumption (the revelation moment) is validated with a real Vietnamese family before Epic 3 code begins. Within Epic 3, the build order is **reveal-first**: synthesis → child view → parent view → validate → then forms.

Source documents:
- `/Users/khanhpham/Workplace/Projects/growpath/docs/MVP_PLAN.md` — feature specs, test scenarios, build order
- `/Users/khanhpham/Workplace/Projects/growpath/docs/PRD_MVP.md` — requirements, user stories, acceptance criteria
- `/Users/khanhpham/Workplace/Projects/growpath/docs/FATAL_FLAW.md` — three fatal flaws to watch; read before each epic

---

## Principles

- **Vertical slices only** — every slice touches DB schema → API route → UI component
- **Done = merged + tested** — unit + integration + manual sign-off before next slice starts
- **Vietnamese copy in every slice** — no English placeholders reach a testable screen
- **AI calls mocked in unit/integration tests** — real Claude API only in E2E and manual testing
- **Gate before proceeding** — validation gates (G-xx) are hard stops; do not skip

---

## Sequence

---

### EPIC 1 — Foundation
> Goal: `docker compose up` starts the full stack; a test user can authenticate.

---

#### S-01 — Project Scaffold & Local Dev Environment

**User Stories**
- As a developer, I want `docker compose up` to start the full stack (app + PostgreSQL + Redis) so that I never need to manage services manually.
- As a developer, I want `npm run dev` with hot reload so that UI changes are visible instantly without restarting.

**Technical Deliverables**
- Next.js 14+ (App Router) + Tailwind CSS + shadcn/ui initialised
- Docker Compose: `app`, `postgres`, `redis` services
- `.env.example` with all required vars
- Health check endpoint `GET /api/health` → 200

**Done When**
- [ ] `docker compose up` starts without errors
- [ ] `http://localhost:3000` loads with no console errors
- [ ] Hot reload works
- [ ] `npm run lint` passes clean

---

#### S-02 — Core Database Schema

**User Stories**
- As a developer, I want all MVP entities defined and migrated in Prisma so that every subsequent slice has a stable data layer.

**Technical Deliverables**
Prisma schema with all 10 entities:
`User`, `FamilyLink`, `ChildProfile`, `Persona`, `PersonaDelta`, `Dream`, `CareerCluster`, `SkillRoadmap`, `WeeklyCheckin`, `Milestone`

Key fields added beyond MVP_PLAN.md baseline:
- `Persona.childConfirmedAt DateTime?` — child confirmation gate
- `Persona.needsEditorialReview Boolean` — AI self-eval fallback flag
- `User.philosophyAcknowledgedAt DateTime?` — parent philosophy opt-in

Seed script: one sample parent + one sample child + FamilyLink

**Done When**
- [ ] `npx prisma migrate dev` runs clean
- [ ] All 10 tables visible in `npx prisma studio`
- [ ] Seed script populates sample family data
- [ ] All foreign key constraints enforced (orphaned record inserts fail)

---

#### S-03 — Authentication (NextAuth.js v5)

**User Stories**
- As a parent, I want to log in with Google so that I can access the product without creating a new account.
- As a child, I want to log in separately from my parent so that I see my own experience from first login.
- As the system, I want role-based route protection so that a parent cannot access `/child/*` routes and vice versa.

**Technical Deliverables**
- NextAuth.js v5 with Google provider; Facebook + Telegram configured but disabled
- Session stores `userId`, `role`, `name`
- Middleware: `role=PARENT` → `/parent/*`; `role=CHILD` → `/child/*`
- Protected routes redirect unauthenticated users to `/login`

**Done When**
- [ ] Google login completes and redirects to correct dashboard by role
- [ ] Logout clears session
- [ ] Parent URL accessed as child → redirected correctly (and vice versa)
- [ ] New user created in DB on first login; returning user retrieves existing record

---

#### S-04 — CI/CD Pipeline

**User Stories**
- As a developer, I want failing tests to block merges to `main` so that broken code never reaches the main branch.

**Technical Deliverables**
- `test.yml`: unit + integration on every push (PostgreSQL + Redis as service containers)
- `e2e.yml`: Playwright on PR to `main`
- Lint + TypeScript check step

**Done When**
- [ ] Broken test → pipeline fails with clear error
- [ ] Passing commit → pipeline green
- [ ] PR with failing E2E is blocked from merge

---

#### S-05 — Observability Baseline

**User Stories**
- As a developer, I want every API route to emit an OpenTelemetry trace so that I can debug production issues without guessing.

**Technical Deliverables**
- `@opentelemetry/sdk-node` initialised in Next.js
- Auto-instrumentation: HTTP + Prisma
- Custom span wrapper for Claude API calls: `claude.synthesis`, `claude.careerGeneration`, `claude.roadmapGeneration`, `claude.nudge`, `claude.digest`
- Prometheus metrics at `/api/metrics`
- Grafana + Jaeger in Docker Compose at `localhost:3001` / `localhost:16686`

**Done When**
- [ ] API call → trace visible in Jaeger
- [ ] `/api/metrics` returns valid Prometheus format
- [ ] Grafana dashboard loads with request count + latency visible

---

### EPIC 2 — User Identity
> Goal: Parent and child have separate, role-tailored experiences from first login.

---

#### S-06 — Sample Parent Profile + Philosophy Onboarding Screen

**User Stories**
- As a parent logging in for the first time, I want to see a clear, warm explanation of how GrowPath works — including that my child's view is tried first when we disagree — so that I understand and consent to the philosophy before I input anything.
- As a parent, I want a dashboard showing my linked child and their journey state so that I have a clear home base.

**Technical Deliverables**
- Philosophy screen (shown once, before dashboard): explains privacy model + child's view rule
  - Copy: *"GrowPath được thiết kế để con trẻ cảm thấy an toàn khi nói thật. Khi Ba/Mẹ và con chưa đồng ý, chúng tôi sẽ thử theo góc nhìn của con trước — rồi cùng nhau xem lại sau."*
  - CTA: "Tôi hiểu và đồng ý" → sets `User.philosophyAcknowledgedAt`
  - Not skippable; not shown again after acknowledgement
- Parent dashboard: header, tab bar (Home, Report, Persona, Settings), linked child card
- Indigo colour theme
- `GET /api/parent/profile`

**Done When**
- [ ] Philosophy screen appears before anything else on first login
- [ ] A Vietnamese parent can explain the child's view rule in their own words after reading it
- [ ] Dashboard shows parent's name in Vietnamese
- [ ] `philosophyAcknowledgedAt` is set and dashboard is accessible after acknowledgement

---

#### S-07 — Sample Child Profile + Dashboard Shell

**User Stories**
- As a child logging in, I want to see my own dashboard — visually distinct from my parent's — with my name, an XP bar, and friendly navigation so that the product feels like mine.

**Technical Deliverables**
- Child dashboard: greeting, XP bar, tab bar (Home, Journey, Check-in, Achievements)
- Sample child: `Nguyễn Minh Anh`, age 10, grade 5
- Orange/warm colour theme; age-appropriate Vietnamese language throughout
- `GET /api/child/profile`

**Done When**
- [ ] Child dashboard looks and feels distinctly different from parent dashboard
- [ ] XP bar displays correctly
- [ ] Vietnamese copy is age-appropriate for 8–13 year olds
- [ ] An 8–13 year old can navigate without adult help

---

#### S-08 — Role-Based Routing & Family Link

**User Stories**
- As a parent, I want to be automatically routed to my dashboard on login so that I never accidentally land on the child experience.
- As a parent, I want to see my linked child's name and avatar on my dashboard so that I can navigate to their journey from my home screen.

**Technical Deliverables**
- Middleware enforces role routing on every request
- `FamilyLink` API: `GET /api/parent/children` returns linked children
- Parent dashboard renders linked child cards
- Child dashboard renders no parent-facing information
- API cross-role rejection: parent endpoints return 403 with `role=CHILD` session (and vice versa)

**Done When**
- [ ] Parent navigating to `/child/dashboard` → redirected to parent dashboard
- [ ] Child navigating to `/parent/dashboard` → redirected to child dashboard
- [ ] Parent sees linked child card on dashboard
- [ ] Cross-role API calls return 403

---

#### S-09 — Device Handoff (Parent → Child)

**User Stories**
- As a parent sharing one device with my child, I want to hand my phone to my child with a single tap so that my child sees their own experience without me logging out.

**Technical Deliverables**
- "Đưa điện thoại cho con" button on parent dashboard
- `POST /api/auth/handoff` → short-lived child session token (10-minute TTL)
- Child lands on their dashboard via handoff token
- Handoff token expires after TTL; child cannot access parent dashboard during handoff session
- `GET /api/auth/handoff/status` for parent to reclaim session

**Done When**
- [ ] Parent taps handoff → child sees child dashboard without manually logging in
- [ ] Handoff token expires after 10 minutes
- [ ] Child cannot access parent dashboard during handoff session
- [ ] Parent can return to their dashboard after handoff

---

### EPIC 2.5 — Vietnamese AI Quality Gate
> Hard stop before Epic 3. These are validation activities, not code slices.
> If gates are not passed, activate QG.3 fallback before proceeding.

---

#### G-01 — Manual Prompt Quality Test

**What**
Run Claude Sonnet through three test cases using handcrafted Vietnamese parent + child inputs. Score with a native Vietnamese speaker (HCMC).

| Case | Child Dream | Delta | Purpose |
|---|---|---|---|
| A | Bác sĩ | Small | Does synthesis add insight beyond the obvious? |
| B | YouTuber / streamer | Large | Does Claude handle a parent-resisted dream well? |
| C | Nhà thiên văn học | Medium | Unusual dream with ambiguous parental context |

**Rubric** (1–5 per dimension, native Vietnamese speaker):
1. Grammatical correctness
2. Regional naturalness (HCMC register)
3. Age-appropriate register (10-year-old can own this)
4. Emotional warmth (person-written feel)
5. Cultural fit (respects Vietnamese family dynamics)

**Gate:** Average ≥ 4.0 across all three cases. Document results in `docs/vi_quality_review.md`.

---

#### G-02 — Prompt Engineering Baseline + Real Family Test

**What — Prompt baseline**
Apply levers until quality gate is met (in order):
1. Write 2–3 gold-standard Vietnamese persona examples by hand → add as few-shot examples to system prompt
2. Add explicit dialect/register instruction (HCMC, thân mật, non-translated)
3. Switch to structured slot-fill output if free prose is inconsistent

Save canonical prompt to `src/ai/prompts/persona-synthesis.ts` before F3.3 build.

**What — Real family revelation test**
Show Case B output (YouTuber delta) to one real Vietnamese parent + child (8–13, HCMC) using a static screen mockup. Observe:
- Does the child say an unprompted variant of "đúng là con rồi"?
- Does the parent express surprise at ≥ 1 dimension?
- Does either party react negatively to any phrasing?

**Gate:** Positive directional signal from real family AND prompt baseline saved to code. If signal is flat or negative — do not start Epic 3 code. Diagnose first.

---

### EPIC 3 — Persona Discovery
> Build order: synthesis → child reveal → parent view → real family validation → parent form → child form → versioning.

---

#### S-10 — AI Persona Synthesis Pipeline

**User Stories**
- As the system, I want to synthesise parent and child inputs into a Vietnamese persona using Claude Sonnet so that the family receives an authentic, shared understanding of the child.
- As the system, I want a Haiku self-evaluation step to score the output before saving so that low-quality output is caught automatically before any user sees it.

**Technical Deliverables**
- BullMQ job: triggers when both parent + child submissions exist for a `childId`
- Claude Sonnet synthesis: uses canonical prompt from G-02 (few-shot examples included)
- Claude Haiku self-evaluation: scores output; if `needs_review: true` → one re-prompt; if still flagged → sets `Persona.needsEditorialReview: true`
- Output schema: `{ dimensions: [...], headline: string }` + `{ conflicts: [...], notes: string, possiblyUnderstated: string[] }`
- Retry logic: 3 attempts with exponential backoff on API errors
- In this slice: use minimal hardcoded test inputs to validate the pipeline before forms are built
- `POST /api/discovery/synthesise` (internal, triggered by job)

**Done When**
- [ ] BullMQ job enqueues and processes successfully
- [ ] Haiku self-evaluation triggers re-prompt when given a deliberately flat test output
- [ ] `needsEditorialReview` flag sets correctly when self-eval fails after retry
- [ ] Processing completes within 30 seconds including self-eval
- [ ] Graceful error + retry on Claude API failure
- [ ] Output saved to `Persona` + `PersonaDelta` tables correctly

---

#### S-11 — Child Persona View + Confirmation Gate

**User Stories**
- As a child, I want to see my synthesised persona in beautiful, warm language that feels like me so that I feel seen and excited to start my journey.
- As a child, I want to review my persona and flag anything that doesn't feel right — before my parents see it — so that I feel in control of how I am represented.
- As a parent, I want to see a "waiting" state until my child confirms their persona so that my child knows their voice comes first.

**Technical Deliverables**
- Child reveal screen: full persona across 7 dimensions, colourful chips, headline sentence
- Confirmation question: "Bản sắc này có đúng với con không?" + "Đúng rồi! 🎉" / "Con muốn chỉnh lại một chút"
- Amendment path: child flags one dimension → note stored → partial re-synthesis job triggered on flagged dimension only
- `persona.childConfirmedAt` set on confirmation
- `GET /api/parent/child/:id/persona` returns 403 until `childConfirmedAt` is set
- Parent waiting screen: "Đang chờ con xem" state
- "Bắt đầu hành trình!" CTA appears only after confirmation

**Done When**
- [ ] Reveal screen feels special — like opening a gift (manual sign-off)
- [ ] Child confirmation blocks parent API (403 test explicit)
- [ ] Amendment path works — flagged dimension re-synthesises, others unchanged
- [ ] Parent waiting state displays correctly before child confirms
- [ ] No delta or conflict content visible to child

---

#### S-12 — Parent Persona View + Delta

**User Stories**
- As a parent, I want to see the full synthesised persona plus a private view of where my child and I see things differently so that I have genuine insight without confronting my child.
- As a parent, I want an AI-generated conversation starter rooted in the delta so that I know how to open a dialogue naturally at dinner.

**Technical Deliverables**
- Parent persona view: same 7-dimension display as child view
- Delta section ("Điểm khác biệt thú vị"): shown only when `role=PARENT`; renders `PersonaDelta.deltaNotes` + `possiblyUnderstated` flags
- AI conversation starter: Claude Haiku generates one context-specific starter from delta
- "Gợi ý hoạt động": one bridging activity suggestion
- `GET /api/parent/child/:id/persona` returns persona + delta (only after `childConfirmedAt`)
- `GET /api/child/persona` never returns delta fields (unit test confirms this)

**Done When**
- [ ] Parent can read delta and it provides genuine insight (manual sign-off)
- [ ] Delta framing is positive and constructive — never critical of the child
- [ ] Conversation starter is something a parent would naturally say (manual sign-off)
- [ ] Child endpoint returns zero delta fields (explicit test)

---

#### V-01 — Real Family Validation (Reveal Loop)
> Validation gate. S-10 + S-11 + S-12 must be working before this.

**What**
Run one real Vietnamese family (parent + child, 8–13, HCMC) through the working synthesis → reveal → parent view flow using sample profile credentials.

**Observe**
- Does the child react with "đúng là con rồi" or equivalent unprompted?
- Does the parent express surprise at ≥ 1 dimension?
- Does the parent feel the delta view is insightful rather than alarming?
- Does either party react negatively to any copy or phrasing?

**Gate:** Strong positive reaction from both parent and child. Document reactions. If flat → diagnose (prompt quality? reveal UX? copy tone?) before building S-13.

---

#### S-13 — Parent Discovery Form (7 Dimensions)

**User Stories**
- As a parent, I want to share my observations of my child across 7 dimensions in a warm, structured form so that the AI has my full perspective.
- As a parent, I want my draft saved automatically so that I can complete the form across multiple sessions without losing my answers.

**Technical Deliverables**
- 7-section form: Dreams, Interests, Strengths, Personality, Growth Edges, Values, Learning Styles
- Each section: chip selection + free-text; warm Vietnamese prompts
- Progress indicator (step X of 7)
- Auto-save debounce (draft persisted on every change)
- `POST /api/discovery/parent` (saves + updates draft state)
- Resume logic: form pre-fills from existing draft on re-entry
- Synthesis trigger: fires BullMQ job when both parent + child submissions are complete

**Done When**
- [ ] All 7 sections completable
- [ ] Closing mid-form and returning preserves all answers
- [ ] Prompts feel like a conversation, not a questionnaire (native speaker sign-off)
- [ ] Form is comfortable on mobile (keyboard doesn't obscure inputs)
- [ ] Synthesis job enqueues after both submissions exist

---

#### S-14 — Child Discovery Form (7 Dimensions + Honesty Mechanisms)

**User Stories**
- As a child, I want to see a clear, simple explanation that my raw answers are private before I answer anything so that I feel safe being honest about my real dreams.
- As a child, I want to answer questions in an exploratory, fun way — not a test — so that I can say what I actually think.
- As a child, I want the app to feel like it is helping me explain myself to my parents, not reporting me to them.

**Technical Deliverables**
Four honesty mechanisms — all required:
1. **Privacy diagram** (first screen, not skippable): "Con viết ở đây → AI đọc → Ba/Mẹ chỉ thấy bản tóm tắt này"
2. **Exploration framing**: All questions rewritten in exploration language (e.g., "Nếu không ai biết và không ai phán xét, con muốn thử công việc gì nhất?" not "Con muốn làm gì khi lớn lên?"); each opens with "Không có câu trả lời đúng hay sai"
3. **AI as advocate**: Intro copy — "AI sẽ giúp con giải thích cho Ba/Mẹ hiểu con theo cách con muốn được hiểu"
4. **Child confirmation gate** (links to S-11 — already built)

Large emoji-led sections; dream input is first and most prominent
`POST /api/discovery/child`

**Done When**
- [ ] Privacy diagram is first screen, not skippable, readable by a 10-year-old
- [ ] A real 8–13 year old completes the form without adult help
- [ ] Child can explain in their own words what Ba/Mẹ will and won't see
- [ ] Language feels like exploring, not like homework (child tester sign-off)
- [ ] Completion screen is enthusiastic and celebratory

---

#### S-15 — Persona Versioning

**User Stories**
- As a parent, I want to see how my child's persona has evolved over time so that I can appreciate how they are growing and changing as a person.

**Technical Deliverables**
- `Persona.version` auto-increments on each new synthesis
- Re-discovery trigger: parent can open discovery forms for re-submission; new version created, old versions preserved
- `GET /api/child/persona/history` returns all versions in order
- Parent persona timeline view: Version 1 → Version N with diff highlights
- "What changed" comparison: dimensions that shifted vs. dimensions that stayed constant

**Done When**
- [ ] Re-submission creates new version; old version unchanged
- [ ] History endpoint returns all versions in correct order
- [ ] Version comparison shows meaningful diffs (not just raw JSON)

---

### EPIC 4 — Career Journey
> Goal: Child names a dream, receives AI career paths, selects one, sees a skill roadmap.

---

#### S-16 — Dream Input

**User Stories**
- As a child, I want to name my dream career freely — no restrictions — so that my journey is anchored to what I actually want.
- As a parent, I want to add my experience and context to my child's dream separately so that the AI can factor in real-world considerations without overriding my child.

**Technical Deliverables**
- Child dream screen: expressive large text input, emoji, suggested options
- AI validation: if dream is unusual, Claude Haiku adds gentle positive framing (not dismissal)
- Parent context screen: "Ba/Mẹ nghĩ gì về ước mơ này?" — structured form, separate session
- `POST /api/child/dream`; `POST /api/parent/child/:id/dream-context`
- Dream can be updated (creates new version, preserves previous)

**Done When**
- [ ] Child can type any dream freely with no restrictions
- [ ] Unusual dreams ("Tôi muốn là siêu anh hùng") get encouraging, not dismissive, framing
- [ ] Parent context screen is clearly separate and does not pressure the child

---

#### S-17 — AI Career Cluster Generation

**User Stories**
- As a child, I want to see 2–3 career paths that expand my dream into real directions so that my dream feels achievable rather than fantasy.

**Technical Deliverables**
- BullMQ job: triggers after dream submission
- Claude Sonnet prompt: `dream + persona → 2–3 career clusters in Vietnamese`
- Each cluster: title, emoji, 2-sentence description, 4–6 skill tags, career examples
- Parent context factored in as context, not override
- Output saved to `CareerCluster` table
- `GET /api/child/career/clusters`

**Done When**
- [ ] For "Nhà khoa học vũ trụ", 3 clusters are meaningfully different and all relevant
- [ ] Skill tags are specific, not generic
- [ ] Parent's context input visibly influences at least one cluster
- [ ] Unusual dreams produce thoughtful, positive clusters

---

#### S-18 — Career Cluster Selection

**User Stories**
- As a child, I want to browse the career clusters and choose the one that excites me most so that my skill journey goes in a direction I own.
- As a parent, I want to review the career clusters and optionally flag a private concern so that I can be involved without overriding my child.

**Technical Deliverables**
- Child cluster display: visual cards, tap to select, "Chọn hướng này" CTA
- Parent review screen: same cards + AI note on alignment with persona
- Parent flag: private text input, stored in DB, not shown to child
- `POST /api/child/career/select`; `POST /api/parent/child/:id/career-flag`
- Selection triggers roadmap generation job (S-19)
- Child can change selection (deselects previous)

**Done When**
- [ ] Child finds selection exciting, not overwhelming
- [ ] Tapping a card gives clear visual selection feedback
- [ ] Parent flag field is clearly private and separate
- [ ] After selection, transition to roadmap generation feels smooth

---

#### S-19 — AI Skill Roadmap Generation

**User Stories**
- As the system, I want to generate a structured skill roadmap from the selected career and the child's persona so that the journey is personally relevant and age-appropriate.

**Technical Deliverables**
- BullMQ job: triggers on career selection
- Claude Sonnet prompt: `career cluster + persona + child age → roadmap: 4 quarters × 3 monthly goals × weekly skill focus`
- Skills mapped to concrete activities (not abstract concepts); calibrated to age 8–13
- Output saved to `SkillRoadmap` table as structured JSON
- `GET /api/child/roadmap`

**Done When**
- [ ] Roadmap has logical skill progression (foundational → advanced over 4 quarters)
- [ ] Week 1 skills are achievable for a 10-year-old
- [ ] Skills are concrete ("Giải 5 bài toán logic mỗi ngày") not vague ("Học toán")
- [ ] All 4 quarters are meaningfully different (not repetitive)

---

#### S-20 — Roadmap Display + Weekly Skill Focus Selection

**User Stories**
- As a child, I want to see my roadmap with my current week highlighted and future quarters visible but locked so that I know exactly where I am and have something exciting to look forward to.
- As a child, I want to pick my skill focus for this week so that I own my pace within the journey.
- As a parent, I want to see my child's full roadmap and add private notes so that I can guide without controlling.

**Technical Deliverables**
- Child roadmap view: current week highlighted, upcoming weeks visible, future quarters locked (greyed, with lock icon)
- Skill detail modal: tap skill → description + suggested activities
- Weekly skill focus selection: child taps a skill → saved as `currentWeekFocus`
- Progress persistence: completed skills remembered across sessions
- Parent roadmap view: same display + private adjustment notes
- `POST /api/child/skill/focus`; `POST /api/parent/child/:id/roadmap-note`
- Lock/unlock logic based on current date vs. roadmap week number

**Done When**
- [ ] Roadmap is scannable at a glance — current position immediately clear
- [ ] Locked future content feels exciting, not frustrating
- [ ] Weekly skill focus selection persists and appears in check-in flow
- [ ] Progress is preserved across browser sessions

---

### EPIC 5 — Weekly Ritual
> Goal: Child completes weekly check-in in under 10 minutes. Parent receives a digest with a usable conversation starter.

---

#### S-21 — Weekly Check-in Form (Child)

**User Stories**
- As a child, I want to log my week's activity and one reflection in under 10 minutes so that the ritual fits my life without feeling like homework.
- As a child, I want to feel celebrated when I submit my check-in so that showing up every week feels worth it.

**Technical Deliverables**
- Check-in form: mood selector (4 emoji), activity log (free-text, min 20 chars), reflection (guided prompt)
- Week number calculated automatically from `createdAt`
- Encouragement animation on submission
- `POST /api/child/checkin`
- Triggers: digest generation job (S-23) + milestone detection (S-25) + scenario storage link (S-22)

**Done When**
- [ ] Entire check-in completable in under 10 minutes (timed with a real child)
- [ ] Mood selector is expressive and fun
- [ ] Completion confirmation is warm and celebratory
- [ ] Check-in data persists and is retrievable for parent digest

---

#### S-22 — Situational Scenario (AI Generated)

**User Stories**
- As a child, I want to respond to a real-world scenario related to my skill focus so that I can explore how I think, not just what I know.
- As a parent, I want to see my child's scenario and their response in the weekly digest so that I understand how my child is developing their thinking.

**Technical Deliverables**
- BullMQ cron job: generates scenario for each active child at start of each week (Monday 08:00 Vietnam time)
- Claude Haiku prompt: `career cluster + current skill + persona → open-ended scenario question (max 100 words, understandable by a 10-year-old)`
- Scenario embedded in check-in form as a final step
- Child's response stored linked to scenario and check-in
- `GET /api/child/checkin/scenario/current`

**Done When**
- [ ] Scenario for week 2 of "Nhà thiên văn học" is genuinely relevant
- [ ] Scenario is understandable by a 10-year-old without adult explanation
- [ ] Different children with same career get meaningfully varied scenarios
- [ ] 5 consecutive scenarios for the same child are all different

---

#### S-23 — Parent Weekly Digest + Conversation Starter

**User Stories**
- As a parent, I want a weekly digest after my child checks in so that I have genuine insight into my child's week without interrogating them.
- As a parent, I want an AI-generated conversation starter I can actually say at dinner so that the digest translates into real connection with my child.

**Technical Deliverables**
- BullMQ job: triggered after child check-in submission
- Digest structure: streak + XP delta, AI highlight of child's reflection (Claude Haiku), scenario + child's response, conversation starter, "what to prepare next week"
- Conversation starter prompt references **current week AND previous weeks' patterns** (not just this week's check-in — this is the accumulation mechanism)
- `GET /api/parent/child/:id/digest/latest`; `GET /api/parent/child/:id/digest/history`
- Digest notification badge on parent dashboard tab

**Done When**
- [ ] Digest gives parent genuine insight they wouldn't otherwise have
- [ ] Conversation starter is something a parent would naturally say (manual sign-off by a Vietnamese parent)
- [ ] Week 4 digest references patterns from weeks 1–3 (not just week 4 data)
- [ ] Digest readable in under 3 minutes

---

#### S-24 — Mid-Week AI Nudge

**User Stories**
- As a child, I want a mid-week prompt or challenge related to my skill focus so that the journey stays alive between check-ins without feeling like another task.

**Technical Deliverables**
- BullMQ cron job: Wednesday 10:00 Vietnam time for all active children
- Claude Haiku prompt: `current skill + progress + persona → short encouraging nudge (max 50 words, question or challenge format)`
- Nudge card on child home dashboard; dismissed on tap
- Dismissed nudges not re-shown
- Parent sees the nudge in their weekly view

**Done When**
- [ ] Nudge card is visible and prominent mid-week on child dashboard
- [ ] Nudge feels like a friendly challenge from a coach, not a notification
- [ ] 5 consecutive nudges for same child are meaningfully different
- [ ] Dismissing nudge works — it does not reappear

---

### EPIC 6 — Milestones
> Goal: When a child reaches their first milestone, they experience a special celebration and the parent is notified.

---

#### S-25 — Milestone Detection

**User Stories**
- As the system, I want to detect when a child reaches a skill milestone immediately after a check-in so that achievements are recognised without delay.

**Technical Deliverables**
- Detection runs after every check-in submission
- Milestone types for MVP: `FIRST_CHECKIN`, `SKILL_LEVEL_UP`, `WEEK_STREAK_7`, `FIRST_ROADMAP_MONTH`
- Idempotent: each type fires exactly once per child (duplicate guard on DB insert)
- XP awarded on milestone; `ChildProfile.xp` updated
- `Milestone` record created with type, title, XP, timestamp
- `POST /api/child/checkin` response includes `milestone` field if one was triggered

**Done When**
- [ ] `FIRST_CHECKIN` fires immediately on first check-in submission
- [ ] `WEEK_STREAK_7` fires on day 7 of a streak (not before)
- [ ] Milestone fires exactly once even if check-in submitted twice (idempotency test)
- [ ] XP correctly added to child profile after milestone

---

#### S-26 — Milestone Celebration Screen (Child)

**User Stories**
- As a child, I want to see a special full-screen celebration when I reach a milestone so that my effort feels genuinely recognised and not just logged.

**Technical Deliverables**
- Full-screen celebration: gradient background, CSS confetti animation, badge image relevant to milestone type
- Milestone title, description, XP gained
- "Tiếp tục hành trình!" CTA → child home
- Shown only once per milestone (redirect guard: if milestone already seen → skip to home)
- No loading delay between check-in submission and celebration (milestone in API response, not a poll)

**Done When**
- [ ] Celebration screen feels genuinely special for a 10-year-old (child tester sign-off)
- [ ] Confetti animation plays without jank on mobile
- [ ] Celebration screen not shown on subsequent check-ins without a new milestone
- [ ] No delay between submission and celebration appearance

---

#### S-27 — Parent Milestone Notification

**User Stories**
- As a parent, I want to know when my child reaches a milestone — with a specific affirmation I can say to them — so that I can celebrate the effort with my child in real life.

**Technical Deliverables**
- Parent home dashboard: milestone card with child name + milestone description + AI-generated affirmation
  - Affirmation prompt: "Ba/Mẹ có thể nói với con: ..." — something specific the parent can say aloud
- Weekly digest: milestone section highlights what the child achieved
- Notification badge on parent tab bar; clears after parent views the milestone
- Milestone history: `GET /api/parent/child/:id/milestones` — all milestones in order

**Done When**
- [ ] Parent milestone card makes them feel proud, not just informed (manual sign-off)
- [ ] AI affirmation is something a Vietnamese parent would actually say to their child
- [ ] Notification badge disappears after parent views the milestone
- [ ] Milestone history shows all earned milestones in a readable timeline

---

## Slice Summary

| # | Slice | Epic | Type |
|---|---|---|---|
| S-01 | Project Scaffold | E1 | Code |
| S-02 | Database Schema | E1 | Code |
| S-03 | Authentication | E1 | Code |
| S-04 | CI/CD Pipeline | E1 | Code |
| S-05 | Observability | E1 | Code |
| S-06 | Parent Dashboard + Philosophy Screen | E2 | Code |
| S-07 | Child Dashboard | E2 | Code |
| S-08 | Role-Based Routing | E2 | Code |
| S-09 | Device Handoff | E2 | Code |
| G-01 | Vietnamese AI Quality Test | E2.5 | **Gate** |
| G-02 | Prompt Baseline + Real Family Test | E2.5 | **Gate** |
| S-10 | AI Persona Synthesis Pipeline | E3 | Code |
| S-11 | Child Persona View + Confirmation Gate | E3 | Code |
| S-12 | Parent Persona View + Delta | E3 | Code |
| V-01 | Real Family Validation (Reveal Loop) | E3 | **Gate** |
| S-13 | Parent Discovery Form | E3 | Code |
| S-14 | Child Discovery Form + Honesty Mechanisms | E3 | Code |
| S-15 | Persona Versioning | E3 | Code |
| S-16 | Dream Input | E4 | Code |
| S-17 | AI Career Cluster Generation | E4 | Code |
| S-18 | Career Cluster Selection | E4 | Code |
| S-19 | AI Skill Roadmap Generation | E4 | Code |
| S-20 | Roadmap Display + Weekly Skill Focus | E4 | Code |
| S-21 | Weekly Check-in Form | E5 | Code |
| S-22 | Situational Scenario | E5 | Code |
| S-23 | Parent Digest + Conversation Starter | E5 | Code |
| S-24 | Mid-Week AI Nudge | E5 | Code |
| S-25 | Milestone Detection | E6 | Code |
| S-26 | Milestone Celebration Screen | E6 | Code |
| S-27 | Parent Milestone Notification | E6 | Code |

**27 code slices. 3 validation gates. Gates G-01, G-02, V-01 are hard stops.**

---

## Verification

Each slice is verified by:
1. `npm run test` (unit + integration) passes with no failures
2. Manual test scenarios in MVP_PLAN.md signed off for the slice
3. Vietnamese copy reviewed for naturalness (native speaker for any parent/child-facing copy)
4. Responsive layout verified on mobile viewport (390px)
5. `npm run lint` passes with zero TypeScript errors
6. For AI slices: manual test with real Claude API (not mock) before marking Done

Gates (G-01, G-02, V-01) verified by: rubric scores documented in `docs/vi_quality_review.md` and founder sign-off recorded before next slice begins.
