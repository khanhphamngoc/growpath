# GrowPath MVP — Build Plan

> Solo developer + Claude Code | Target: 12 weeks
> Last updated: 2026-05-01
> Each slice is independently deliverable, touches DB → API → UI, and is tested before the next begins.

---

## Principles

- **Vertical slices only** — every slice touches DB schema → API route → UI component. No horizontal layers.
- **Done = merged + tested** — unit + integration + manual sign-off before next slice starts.
- **Vietnamese copy in every slice** — no English placeholder text reaches a testable screen.
- **AI calls mocked in unit/integration tests** — real Claude API only in E2E and manual testing.
- **Gate before proceeding** — validation gates (G-xx, V-xx) are hard stops; do not skip.
- **Each epic is independently demonstrable** — a stakeholder can see working software after each epic.

---

## Definition of Done

A slice is **Done** when all of the following are true:

- [ ] Code is merged to `main` and CI passes
- [ ] Unit tests written and passing (coverage for business logic)
- [ ] Integration tests written and passing (API routes + DB)
- [ ] E2E test written for any user-facing flow (Playwright)
- [ ] Manual test scenarios executed and signed off
- [ ] Vietnamese copy reviewed for naturalness (native speaker for parent/child-facing copy)
- [ ] Responsive layout verified on mobile viewport (390px)
- [ ] `npm run lint` passes with zero TypeScript errors
- [ ] OpenTelemetry span added for any new API route

Gates (G-xx, V-xx) are verified by: rubric scores documented in `docs/vi_quality_review.md` and founder sign-off recorded before the next slice begins.

---

## Epic Overview

| Epic | Goal | Sequence Logic |
|---|---|---|
| **E1: Foundation** | Running dev environment, schema, auth, CI, observability | Technical necessity — everything depends on this |
| **E2: User Identity** | Parent + child profiles with role-tailored UX | Required before any feature can be tested with real users |
| **E2.5: Vietnamese AI Quality Gate** | Claude Vietnamese output validated + real family revelation test | **Risk gate** — blocks Epic 3. Riskiest assumption tested as early as possible |
| **E3: Persona Discovery** | Reveal-first build: synthesis → child view → parent view → then forms | Core hypothesis; built reveal-first not form-first |
| **E4: Career Journey** | Dream → career clusters → skill roadmap | Extends revelation into a tangible path |
| **E5: Weekly Ritual** | Check-in, digest, AI nudge | Validates retention mechanism |
| **E6: Milestones** | First milestone detection + celebration | Validates celebration as a retention driver |

### Sequencing Rationale

Epics are sequenced **by risk, not by feature completeness.** The principle: get the riskiest assumption in front of a real Vietnamese family as fast as possible, before building features that depend on it.

**Risk register (highest to lowest):**
1. Does the AI-synthesised Vietnamese persona produce a genuine "that's me" reaction? ← tested in E2.5
2. Is Claude's Vietnamese output quality sufficient without heavy post-processing? ← gated in E2.5
3. Does the career cluster + roadmap feel compelling enough to sustain the journey? ← validated in E4
4. Does the weekly ritual stick beyond week 2? ← validated in E5
5. Does milestone celebration improve retention? ← validated in E6

### Epic 3 Build Order (reveal-first, not form-first)

Build synthesis → child reveal → parent view first using minimal hardcoded inputs. Test with a real family. Only then build the full 7-dimension input forms. Do not build all input forms before knowing whether the reveal screen lands.

```
S-10 (synthesis) → S-11 (child reveal) → S-12 (parent view + delta)
→ V-01 (real family validation) →
S-13 (parent form) → S-14 (child form) → S-15 (versioning)
```

---

---

## Phase 1 — Foundation (Epic 1)

**Goal:** `docker compose up` starts the full stack; a test user can authenticate.

---

### S-01 — Project Scaffold & Local Dev Environment

**User Stories**
- As a developer, I want `docker compose up` to start the full stack (app + PostgreSQL + Redis) so that I never need to manage services manually.
- As a developer, I want `npm run dev` with hot reload so that UI changes are visible instantly without restarting.

**Technical Deliverables**
- Next.js 14+ (App Router) + Tailwind CSS + shadcn/ui initialised
- Docker Compose: `app`, `postgres`, `redis` services
- `.env.example` with all required vars
- Health check endpoint `GET /api/health` → 200

**Automated Tests**
- Unit: Health check endpoint returns 200
- Integration: App connects to PostgreSQL and Redis on startup

**Done When**
- [ ] `docker compose up` starts without errors
- [ ] `http://localhost:3000` loads with no console errors
- [ ] Hot reload works when editing a component
- [ ] `npm run lint` passes with no errors

**Manual Scenarios**
- [ ] `docker compose up` starts without errors
- [ ] `http://localhost:3000` loads with no console errors
- [ ] Hot reload works
- [ ] `npm run lint` passes clean

---

### S-02 — Core Database Schema

**User Stories**
- As a developer, I want all MVP entities defined and migrated in Prisma so that every subsequent slice has a stable data layer.

**Technical Deliverables**

Prisma schema with all 10 entities:
`User`, `FamilyLink`, `ChildProfile`, `Persona`, `PersonaDelta`, `Dream`, `CareerCluster`, `SkillRoadmap`, `WeeklyCheckin`, `Milestone`

```
User (id, email, role: PARENT|CHILD, name, city, philosophyAcknowledgedAt, createdAt)
FamilyLink (parentId, childId)
ChildProfile (userId, dob, grade, school, avatarUrl, xp)
Persona (childId, version, dimensions: JSON, headline, childConfirmedAt, needsEditorialReview, createdAt)
PersonaDelta (personaId, parentView: JSON, childView: JSON, deltaNotes: JSON, possiblyUnderstated: JSON)
Dream (childId, text, createdAt)
CareerCluster (dreamId, clusters: JSON, selectedCluster: String)
SkillRoadmap (childId, careerId, roadmap: JSON, currentWeekFocus, createdAt)
WeeklyCheckin (childId, weekNumber, mood, activityLog, reflection, scenarioResponse, createdAt)
Milestone (childId, type, title, xp, achievedAt)
```

Seed script: one sample parent `Nguyễn Thị Hương` + one sample child `Nguyễn Minh Anh` + FamilyLink.

**Automated Tests**
- Unit: Prisma schema validation (all relations correct)
- Integration: All CRUD operations on each model via test DB
- Integration: FamilyLink enforces parent-child relationship correctly

**Done When**
- [ ] `npx prisma migrate dev` runs clean
- [ ] All 10 tables visible in `npx prisma studio`
- [ ] Seed script populates sample family data
- [ ] All foreign key constraints enforced (orphaned record inserts fail)

**Manual Scenarios**
- [ ] `npx prisma studio` opens and shows all tables
- [ ] Seed script populates sample parent + child + persona data
- [ ] All foreign key constraints enforced (try inserting orphaned records)

---

### S-03 — Authentication (NextAuth.js v5)

**User Stories**
- As a parent, I want to log in with Google so that I can access the product without creating a new account.
- As a child, I want to log in separately from my parent so that I see my own experience from first login.
- As the system, I want role-based route protection so that a parent cannot access `/child/*` routes and vice versa.

**Technical Deliverables**
- NextAuth.js v5 with Google provider; Facebook + Telegram configured but disabled
- Session stores `userId`, `role`, `name`
- Middleware: `role=PARENT` → `/parent/*`; `role=CHILD` → `/child/*`
- Protected routes redirect unauthenticated users to `/login`

**Automated Tests**
- Unit: Role middleware blocks wrong role
- Unit: Session shape validation
- Integration: OAuth callback creates User record if new, retrieves if existing
- Integration: Protected API routes return 401 without session

**Done When**
- [ ] Google login completes and redirects to correct dashboard by role
- [ ] Logout clears session
- [ ] Parent URL accessed as child → redirected correctly (and vice versa)
- [ ] New user created in DB on first login; returning user retrieves existing record

**Manual Scenarios**
- [ ] Google login flow completes and redirects to correct dashboard
- [ ] Logging out clears session and redirects to login
- [ ] Parent URL accessed as child → redirected correctly
- [ ] New user created in DB on first login
- [ ] Returning user retrieves existing account

---

### S-04 — CI/CD Pipeline

**User Stories**
- As a developer, I want failing tests to block merges to `main` so that broken code never reaches the main branch.

**Technical Deliverables**
- `test.yml`: unit + integration on every push (PostgreSQL + Redis as service containers)
- `e2e.yml`: Playwright on PR to `main`
- Lint + TypeScript check step

**Automated Tests**
- The pipeline itself is the test

**Done When**
- [ ] Broken test → pipeline fails with clear error
- [ ] Passing commit → pipeline green
- [ ] PR with failing E2E is blocked from merge

**Manual Scenarios**
- [ ] Push a broken test → pipeline fails and shows error
- [ ] Push a passing commit → pipeline goes green
- [ ] PR with failing E2E is blocked from merge

---

### S-05 — Observability Baseline

**User Stories**
- As a developer, I want every API route to emit an OpenTelemetry trace so that I can debug production issues without guessing.

**Technical Deliverables**
- `@opentelemetry/sdk-node` initialised in Next.js
- Auto-instrumentation: HTTP + Prisma
- Custom span wrapper for Claude API calls: `claude.synthesis`, `claude.careerGeneration`, `claude.roadmapGeneration`, `claude.nudge`, `claude.digest`
- Prometheus metrics at `/api/metrics`
- Grafana + Jaeger in Docker Compose at `localhost:3001` / `localhost:16686`

**Automated Tests**
- Integration: `/api/metrics` returns 200 with valid Prometheus format
- Integration: A sample API call produces a trace in Jaeger

**Done When**
- [ ] API call → trace visible in Jaeger
- [ ] `/api/metrics` returns valid Prometheus format
- [ ] Grafana dashboard loads with request count + latency visible

**Manual Scenarios**
- [ ] Make an API call → see trace in Jaeger UI
- [ ] `/api/metrics` shows request count and latency metrics
- [ ] Grafana dashboard loads with metrics visible

---

---

## Phase 2 — User Identity (Epic 2)

**Goal:** Parent and child have separate, role-tailored experiences from first login.

---

### S-06 — Parent Profile + Philosophy Onboarding Screen

**User Stories**
- As a parent logging in for the first time, I want to see a clear, warm explanation of how GrowPath works — including that my child's view is tried first when we disagree — so that I understand and consent to the philosophy before I input anything.
- As a parent, I want a dashboard showing my linked child and their journey state so that I have a clear home base.

**Technical Deliverables**
- Philosophy screen (shown once, before dashboard):
  - Copy: *"GrowPath được thiết kế để con trẻ cảm thấy an toàn khi nói thật. Khi Ba/Mẹ và con chưa đồng ý, chúng tôi sẽ thử theo góc nhìn của con trước — rồi cùng nhau xem lại sau. Đây là cách chúng tôi giúp con mở lòng hơn với Ba/Mẹ."*
  - CTA: "Tôi hiểu và đồng ý" → sets `User.philosophyAcknowledgedAt`
  - Not skippable; not shown again after acknowledgement
- Parent dashboard: header, tab bar (Home, Report, Persona, Settings), linked child card
- Indigo colour theme
- `GET /api/parent/profile`

**Automated Tests**
- Unit: Philosophy screen renders before dashboard on first login
- Unit: Dashboard is inaccessible until `philosophyAcknowledgedAt` is set
- Integration: `GET /api/parent/profile` returns parent profile
- E2E: Parent logs in → sees philosophy screen → acknowledges → sees dashboard

**Done When**
- [ ] Philosophy screen appears before anything else on first login
- [ ] A Vietnamese parent can explain the child's view rule in their own words after reading it
- [ ] Dashboard shows parent's name in Vietnamese
- [ ] `philosophyAcknowledgedAt` is set and dashboard is accessible after acknowledgement

**Manual Scenarios**
- [ ] Philosophy screen appears before anything else on first login
- [ ] A Vietnamese parent reads the screen and can explain the child's view rule in their own words
- [ ] The framing feels empowering, not like a warning — parent feels informed, not warned off
- [ ] "Tôi hiểu và đồng ý" tap registers and is not shown again on subsequent logins
- [ ] Dashboard greeting shows parent's name in Vietnamese
- [ ] All navigation tabs are visible and tappable
- [ ] Layout is correct on both desktop (390px centered) and actual mobile browser

---

### S-07 — Child Profile + Dashboard Shell

**User Stories**
- As a child logging in, I want to see my own dashboard — visually distinct from my parent's — with my name, an XP bar, and friendly navigation so that the product feels like mine.

**Technical Deliverables**
- Child dashboard: greeting, XP bar, tab bar (Home, Journey, Check-in, Achievements)
- Sample child: `Nguyễn Minh Anh`, age 10, grade 5
- Orange/warm colour theme; age-appropriate Vietnamese language throughout
- `GET /api/child/profile`

**Automated Tests**
- Unit: Child dashboard renders with sample data props
- Integration: `GET /api/child/profile` returns child profile
- E2E: Child logs in → sees child dashboard with name and XP bar

**Done When**
- [ ] Child dashboard looks and feels distinctly different from parent dashboard
- [ ] XP bar displays correctly
- [ ] Vietnamese copy is age-appropriate for 8–13 year olds
- [ ] An 8–13 year old can navigate without adult help

**Manual Scenarios**
- [ ] Child dashboard looks and feels different from parent dashboard (colour, tone, language)
- [ ] XP bar displays correctly
- [ ] Vietnamese copy is age-appropriate for 8–13 year olds
- [ ] Emoji and visual elements render correctly

---

### S-08 — Role-Based Routing & Family Link

**User Stories**
- As a parent, I want to be automatically routed to my dashboard on login so that I never accidentally land on the child experience.
- As a parent, I want to see my linked child's name and avatar on my dashboard so that I can navigate to their journey from my home screen.

**Technical Deliverables**
- Middleware enforces role routing on every request
- `FamilyLink` API: `GET /api/parent/children` returns linked children
- Parent dashboard renders linked child cards
- Child dashboard renders no parent-facing information
- API cross-role rejection: parent endpoints return 403 with `role=CHILD` session (and vice versa)

**Automated Tests**
- Unit: Role routing middleware returns correct redirect per role
- Integration: Parent API endpoints reject requests with `role=CHILD` session
- Integration: Child API endpoints reject requests with `role=PARENT` session
- E2E: Login as parent → parent dashboard. Login as child → child dashboard.

**Done When**
- [ ] Parent navigating to `/child/dashboard` → redirected to parent dashboard
- [ ] Child navigating to `/parent/dashboard` → redirected to child dashboard
- [ ] Parent sees linked child card on dashboard
- [ ] Cross-role API calls return 403

**Manual Scenarios**
- [ ] Parent tries to navigate to `/child/dashboard` → redirected to parent dashboard
- [ ] Child tries to navigate to `/parent/dashboard` → redirected to child dashboard
- [ ] Parent sees their linked child(ren) on the dashboard
- [ ] Switching user (logout + login as child) lands on the correct dashboard

---

### S-09 — Device Handoff (Parent → Child)

**User Stories**
- As a parent sharing one device with my child, I want to hand my phone to my child with a single tap so that my child sees their own experience without me logging out.

**Technical Deliverables**
- "Đưa điện thoại cho con" button on parent dashboard
- `POST /api/auth/handoff` → short-lived child session token (10-minute TTL)
- Child lands on their dashboard via handoff token
- Handoff token expires after TTL; child cannot access parent dashboard during handoff session
- `GET /api/auth/handoff/status` for parent to reclaim session

**Automated Tests**
- Unit: Handoff token expires correctly after TTL
- Integration: `POST /api/auth/handoff` generates valid child session token
- Integration: Expired token returns 401

**Done When**
- [ ] Parent taps handoff → child sees child dashboard without manually logging in
- [ ] Handoff token expires after 10 minutes
- [ ] Child cannot access parent dashboard during handoff session
- [ ] Parent can return to their dashboard after handoff

**Manual Scenarios**
- [ ] Parent taps handoff → child sees child dashboard without logging in manually
- [ ] Handoff link/PIN expires after 10 minutes
- [ ] Child cannot access parent dashboard during handoff session
- [ ] After handoff, parent can return to their dashboard

---

---

## Gate: Vietnamese AI Quality (Epic 2.5)

> **Hard stop before Epic 3.** These are validation activities, not code slices. Run in parallel with Epic 2 UI work during weeks 3–4.
> If gates are not passed, activate QG.3 fallback before proceeding.

---

### G-01 — Manual Prompt Quality Test

**What**
Run Claude Sonnet through three test cases using handcrafted Vietnamese parent + child inputs. Score with a native Vietnamese speaker (HCMC).

| Case | Child Dream | Delta | Purpose |
|---|---|---|---|
| A | Bác sĩ (common, expected) | Small | Does synthesis add insight beyond the obvious? |
| B | YouTuber / streamer | Large | Does Claude handle a parent-resisted dream well? |
| C | Nhà thiên văn học | Medium | Unusual dream with ambiguous parental context |

**Evaluation Rubric** (score each 1–5, native Vietnamese speaker from HCMC):
1. Grammatical correctness — no errors or awkward constructions
2. Regional naturalness — sounds like HCMC Vietnamese, not a textbook
3. Age-appropriate register — a 10-year-old can understand and own this
4. Emotional warmth — feels like a person wrote it, not a model
5. Cultural fit — respects Vietnamese family dynamics without being cliché

**Gate:** Average ≥ 4.0 across all three cases and all five dimensions.

**Done When**
- [ ] All three test cases run and outputs saved to `tests/fixtures/claude/persona_vi/`
- [ ] Native Vietnamese speaker scores each output on the rubric (documented in `docs/vi_quality_review.md`)
- [ ] Average score ≥ 4.0 confirmed before Epic 3 kick-off
- [ ] At least one case with a large parent-child delta is tested

---

### G-02 — Prompt Engineering Baseline + Real Family Test

**What — Prompt baseline**
Apply levers until quality gate is met (in order):
1. Write 2–3 gold-standard Vietnamese persona examples by hand → add as few-shot examples to system prompt
2. Add explicit dialect/register instruction (HCMC, thân mật, non-translated):
   ```
   Viết bằng tiếng Việt miền Nam, thân mật như người anh/chị lớn đang nói chuyện
   với một bạn nhỏ 8–13 tuổi. Tránh từ ngữ hàn lâm, tránh những cụm từ nghe như
   dịch từ tiếng Anh. Dùng ngôn ngữ mà bố/mẹ và con đều cảm thấy tự nhiên khi
   đọc to cùng nhau.
   ```
3. Switch to structured slot-fill output if free prose is inconsistent

Save canonical prompt to `src/ai/prompts/persona-synthesis.ts` before S-10 build.

**What — Real family revelation test**
Show Case B output (YouTuber delta) to one real Vietnamese family — one parent + one child aged 8–13, HCMC — using a static screen mockup. Observe:
- Does the child say an unprompted variant of "đúng là con rồi"?
- Does the parent express surprise at ≥ 1 dimension?
- Does either party react negatively to any phrasing?

**Gate:** Positive directional signal from real family AND prompt baseline saved to code. If signal is flat or negative — do not start Epic 3 code. Diagnose first.

**Done When**
- [ ] Real family revelation test conducted with one parent + child — reaction documented
- [ ] Core hypothesis signal is positive before Epic 3 code starts
- [ ] Canonical prompt saved to `src/ai/prompts/persona-synthesis.ts`

---

### QG.3 — Fallback Plan (if quality gate not met by end of week 4)

If prompt engineering alone cannot reach ≥ 4.0 average, activate one of these before Epic 3 week 5 kickoff:

| Fallback | Action |
|---|---|
| **Human editorial layer** | A Vietnamese-speaking editor reviews every synthesised persona before it surfaces to the family. Adds 24–48h latency. Acceptable for first 50–100 MVP families. |
| **Template-assisted generation** | A Vietnamese copywriter writes structural template shells. Claude fills in personalised content slots. Less creative, more consistent. |
| **Parent light-editing** | Parent can adjust 1–2 phrases in the persona before the child sees the reveal. Requires a lightweight editing UI added to S-12. |

Decision on which fallback to activate must be made before Epic 3 week 5 kickoff — not during it.

---

---

## Phase 3 — Persona Discovery (Epic 3)

**Goal:** Parent and child each share their perspective. AI synthesises both into a shared persona. Parent sees the full picture (with delta). Child sees only the empowering view.

**Build order:** S-10 → S-11 → S-12 → V-01 → S-13 → S-14 → S-15

---

### S-10 — AI Persona Synthesis Pipeline

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

**System prompt design:**
```
System: You are a child development specialist helping Vietnamese families understand their child.
You are the child's advocate — your job is to help the parent understand the child on the
child's own terms, not to arbitrate between them.

[DIALECT INSTRUCTION from G-02]

[FEW-SHOT EXAMPLES from G-02 — see src/ai/prompts/persona-synthesis.ts]

Given parent observations and child self-description, synthesise a persona that:
1. Centres the child's authentic voice — child's view takes precedence on all dimensions
2. Incorporates parent's context where it adds genuine depth (not where it overrides)
3. Uses warm, non-clinical Vietnamese a child aged 8–13 can own and feel proud of
4. Where child input seems performed or over-aligned with typical parental expectations,
   note this in the delta as "possibly understated" for the parent's awareness
5. Returns structured JSON matching the PersonaOutput schema
```

**Automated Tests**
- Unit: Prompt builder constructs correct prompt from parent + child inputs (including few-shot examples)
- Unit: Output parser handles malformed Claude response gracefully
- Unit: Conflict detection algorithm identifies meaningful deltas
- Unit: Self-evaluation step triggers re-prompt when `needs_review: true`
- Unit: `needsEditorialReview` flag set correctly when self-eval fails after retry
- Integration: BullMQ job is enqueued when both submissions exist
- Integration: Claude mock returns valid persona → job saves to DB correctly
- Integration: Job retry logic triggers on Claude API error

**Done When**
- [ ] BullMQ job enqueues and processes successfully
- [ ] Haiku self-evaluation triggers re-prompt when given a deliberately flat test output
- [ ] `needsEditorialReview` flag sets correctly when self-eval fails after retry
- [ ] Processing completes within 30 seconds including self-eval
- [ ] Graceful error + retry on Claude API failure
- [ ] Output saved to `Persona` + `PersonaDelta` tables correctly

**Manual Scenarios**
- [ ] With sample parent + child inputs, Claude produces a persona that feels authentic
- [ ] Vietnamese output is fluent and warm — scores ≥ 4.0 on G-01 rubric (re-use rubric here)
- [ ] The "headline" feels like something the child would be proud of
- [ ] When parent and child inputs conflict, the delta is detected and "possibly understated" is flagged appropriately
- [ ] Self-evaluation correctly rejects a deliberately flat/robotic test output
- [ ] Processing completes within 30 seconds (including self-eval call)
- [ ] What happens if Claude API is down? (graceful error, retry queued)

---

### S-11 — Child Persona View + Confirmation Gate

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

**Automated Tests**
- Unit: Persona view renders correctly with all 7 dimensions populated
- Unit: Missing dimensions handled gracefully
- Integration: `GET /api/child/persona` returns correct persona for authenticated child
- Integration: `GET /api/parent/child/:id/persona` returns 403 until `childConfirmedAt` is set
- Integration: Amendment request triggers partial re-synthesis job on flagged dimension only
- E2E: Child completes discovery → sees persona reveal screen → confirms → parent can now access

**Done When**
- [ ] Reveal screen feels special — like opening a gift (manual sign-off)
- [ ] Child confirmation blocks parent API (403 test explicit)
- [ ] Amendment path works — flagged dimension re-synthesises, others unchanged
- [ ] Parent waiting state displays correctly before child confirms
- [ ] No delta or conflict content visible to child

**Manual Scenarios**
- [ ] The reveal screen feels special — like opening a gift
- [ ] A child reading this would say "that's me!"
- [ ] The confirmation question feels empowering, not administrative
- [ ] "Con muốn chỉnh lại" path works — child can flag a dimension and see it updated
- [ ] No adult-only or negative content visible to child
- [ ] All 7 dimensions are readable and understandable by a 10-year-old
- [ ] CTA button is prominent and exciting
- [ ] Parent accessing persona before child confirms sees a "Đang chờ con xem" waiting state

---

### S-12 — Parent Persona View + Delta

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

**Automated Tests**
- Unit: Delta section only renders when `role=PARENT`
- Unit: Conversation starter generator produces contextually relevant output
- Integration: `GET /api/parent/child/:id/persona` returns persona + delta for parent
- Integration: Child endpoint `GET /api/child/persona` never returns delta fields

**Done When**
- [ ] Parent can read delta and it provides genuine insight (manual sign-off)
- [ ] Delta framing is positive and constructive — never critical of the child
- [ ] Conversation starter is something a parent would naturally say (manual sign-off)
- [ ] Child endpoint returns zero delta fields (explicit test)

**Manual Scenarios**
- [ ] Parent can read the delta and it provides genuine insight
- [ ] The framing of the delta is positive and constructive — never critical of the child
- [ ] Conversation starter feels natural to say to a child
- [ ] Child persona URL returns no delta information (test this explicitly)
- [ ] Version history shows previous persona if it exists

---

### V-01 — Real Family Validation (Reveal Loop)

> **Validation gate.** S-10 + S-11 + S-12 must be working before this.

**What**
Run one real Vietnamese family (parent + child, 8–13, HCMC) through the working synthesis → reveal → parent view flow using sample profile credentials.

**Observe**
- Does the child react with "đúng là con rồi" or equivalent unprompted?
- Does the parent express surprise at ≥ 1 dimension?
- Does the parent feel the delta view is insightful rather than alarming?
- Does either party react negatively to any copy or phrasing?

**Gate:** Strong positive reaction from both parent and child. Document reactions. If flat → diagnose (prompt quality? reveal UX? copy tone?) before building S-13.

---

### S-13 — Parent Discovery Form (7 Dimensions)

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

**Automated Tests**
- Unit: Form validation (required fields, min character counts)
- Unit: Draft auto-save debounce logic
- Integration: `POST /api/discovery/parent` saves form data correctly to DB
- Integration: Partial save (draft) and resume works correctly

**Done When**
- [ ] All 7 sections completable
- [ ] Closing mid-form and returning preserves all answers
- [ ] Prompts feel like a conversation, not a questionnaire (native speaker sign-off)
- [ ] Form is comfortable on mobile (keyboard doesn't obscure inputs)
- [ ] Synthesis job enqueues after both submissions exist

**Manual Scenarios**
- [ ] Each of the 7 sections is clear and easy to understand for a Vietnamese parent
- [ ] Chips are relevant and cover common observations
- [ ] Free-text prompts feel like a conversation, not a questionnaire
- [ ] Progress bar advances correctly
- [ ] Closing app mid-form and returning preserves all answers
- [ ] Form is comfortable on mobile (no keyboard obscuring inputs)

---

### S-14 — Child Discovery Form (7 Dimensions + Honesty Mechanisms)

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

Large emoji-led sections; dream input is first and most prominent.
`POST /api/discovery/child`

**Automated Tests**
- Unit: Child form validation (different rules from parent — more lenient)
- Integration: `POST /api/discovery/child` saves to DB and links to correct `childId`
- Integration: Both parent and child submissions linked to same `Persona` record
- Unit: Privacy architecture screen is rendered before question 1 (not skippable)

**Done When**
- [ ] Privacy diagram is first screen, not skippable, readable by a 10-year-old
- [ ] A real 8–13 year old completes the form without adult help
- [ ] Child can explain in their own words what Ba/Mẹ will and won't see
- [ ] Language feels like exploring, not like homework (child tester sign-off)
- [ ] Completion screen is enthusiastic and celebratory

**Manual Scenarios**
- [ ] A real 8–13 year old can complete the form without adult help
- [ ] Child reads the privacy diagram and can explain in their own words what Ba/Mẹ will and won't see
- [ ] The exploration-framed questions produce meaningfully different answers than declaration-framed versions
- [ ] Language feels exciting, not like homework
- [ ] Dream input is the first and most prominent field
- [ ] Emoji and visual elements make the form feel playful
- [ ] Completion screen is enthusiastic and celebratory

---

### S-15 — Persona Versioning

**User Stories**
- As a parent, I want to see how my child's persona has evolved over time so that I can appreciate how they are growing and changing as a person.

**Technical Deliverables**
- `Persona.version` auto-increments on each new synthesis
- Re-discovery trigger: parent can open discovery forms for re-submission; new version created, old versions preserved
- `GET /api/child/persona/history` returns all versions in order
- Parent persona timeline view: Version 1 → Version N with diff highlights
- "What changed" comparison: dimensions that shifted vs. dimensions that stayed constant

**Automated Tests**
- Unit: Version increment logic is correct
- Integration: Re-submission creates new version, does not overwrite old
- Integration: `GET /api/child/persona/history` returns all versions in order

**Done When**
- [ ] Re-submission creates new version; old version unchanged
- [ ] History endpoint returns all versions in correct order
- [ ] Version comparison shows meaningful diffs (not just raw JSON)

**Manual Scenarios**
- [ ] After quarterly review, new version is created and displayed correctly
- [ ] Old versions are accessible and show their original content
- [ ] The "what changed" comparison is readable and meaningful
- [ ] Re-running discovery with same answers produces similar (not wildly different) persona

---

---

## Phase 4 — Career Journey (Epic 4)

**Goal:** Child names a dream, receives AI career paths, selects one, sees a skill roadmap.

---

### S-16 — Dream Input

**User Stories**
- As a child, I want to name my dream career freely — no restrictions — so that my journey is anchored to what I actually want.
- As a parent, I want to add my experience and context to my child's dream separately so that the AI can factor in real-world considerations without overriding my child.

**Technical Deliverables**
- Child dream screen: expressive large text input, emoji, suggested options
- AI validation: if dream is unusual, Claude Haiku adds gentle positive framing (not dismissal)
- Parent context screen: "Ba/Mẹ nghĩ gì về ước mơ này?" — structured form, separate session
- `POST /api/child/dream`; `POST /api/parent/child/:id/dream-context`
- Dream can be updated (creates new version, preserves previous)

**Automated Tests**
- Unit: Dream text validation (min length, sanitisation)
- Integration: `POST /api/child/dream` saves correctly, links to child profile
- Integration: Parent context `POST /api/parent/child/:id/dream-context` saves separately

**Done When**
- [ ] Child can type any dream freely with no restrictions
- [ ] Unusual dreams ("Tôi muốn là siêu anh hùng") get encouraging, not dismissive, framing
- [ ] Parent context screen is clearly separate and does not pressure the child

**Manual Scenarios**
- [ ] Child can type any dream freely — no restrictions
- [ ] Suggested dream options are varied and inspiring
- [ ] AI positive framing for unusual dreams ("Tôi muốn là siêu anh hùng") is encouraging not dismissive
- [ ] Parent context screen is separate and doesn't pressure the child
- [ ] Dream can be updated without losing previous version

---

### S-17 — AI Career Cluster Generation

**User Stories**
- As a child, I want to see 2–3 career paths that expand my dream into real directions so that my dream feels achievable rather than fantasy.

**Technical Deliverables**
- BullMQ job: triggers after dream submission
- Claude Sonnet prompt: `dream + persona → 2–3 career clusters in Vietnamese`
- Each cluster: title, emoji, 2-sentence description, 4–6 skill tags, career examples
- Parent context factored in as context, not override
- Output saved to `CareerCluster` table
- `GET /api/child/career/clusters`

**Automated Tests**
- Unit: Prompt builder correctly incorporates dream + persona + parent context
- Unit: Output parser validates cluster schema (title, emoji, description, skills)
- Integration: Job produces 2–3 clusters within expected schema
- Integration: Claude mock → clusters saved to DB correctly

**Done When**
- [ ] For "Nhà khoa học vũ trụ", 3 clusters are meaningfully different and all relevant
- [ ] Skill tags are specific, not generic
- [ ] Parent's context input visibly influences at least one cluster
- [ ] Unusual dreams produce thoughtful, positive clusters

**Manual Scenarios**
- [ ] For "Nhà khoa học vũ trụ", the 3 clusters are meaningfully different and all relevant
- [ ] Skill tags are specific (not generic like "học giỏi")
- [ ] Career descriptions are exciting and age-appropriate
- [ ] Parent's context input visibly influences at least one cluster
- [ ] For an unusual dream, clusters are still thoughtful and positive

---

### S-18 — Career Cluster Selection

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

**Automated Tests**
- Unit: Selection state management (only one can be selected at a time)
- Integration: `POST /api/child/career/select` saves selection correctly
- Integration: Parent flag `POST /api/parent/child/:id/career-flag` saves without showing to child

**Done When**
- [ ] Child finds selection exciting, not overwhelming
- [ ] Tapping a card gives clear visual selection feedback
- [ ] Parent flag field is clearly private and separate
- [ ] After selection, transition to roadmap generation feels smooth

**Manual Scenarios**
- [ ] Child finds the selection process exciting, not overwhelming
- [ ] Tapping a card makes it clearly selected (visual feedback)
- [ ] Parent flag field is clearly separate and private
- [ ] After selection, the transition to roadmap generation feels smooth
- [ ] Can change selection: old selection is deselected, new one activates

---

### S-19 — AI Skill Roadmap Generation

**User Stories**
- As the system, I want to generate a structured skill roadmap from the selected career and the child's persona so that the journey is personally relevant and age-appropriate.

**Technical Deliverables**
- BullMQ job: triggers on career selection
- Claude Sonnet prompt: `career cluster + persona + child age → roadmap: 4 quarters × 3 monthly goals × weekly skill focus`
- Skills mapped to concrete activities (not abstract concepts); calibrated to age 8–13
- Output saved to `SkillRoadmap` table as structured JSON
- `GET /api/child/roadmap`

**Automated Tests**
- Unit: Prompt correctly passes career cluster + persona + child age
- Unit: Roadmap output parser validates structure (4 quarters, monthly goals, weekly skills)
- Unit: Skill difficulty calibration logic (age-appropriate check)
- Integration: Generated roadmap saved correctly to DB

**Done When**
- [ ] Roadmap has logical skill progression (foundational → advanced over 4 quarters)
- [ ] Week 1 skills are achievable for a 10-year-old
- [ ] Skills are concrete ("Giải 5 bài toán logic mỗi ngày") not vague ("Học toán")
- [ ] All 4 quarters are meaningfully different (not repetitive)

**Manual Scenarios**
- [ ] Roadmap for "Nhà thiên văn học" has logical skill progression (foundational → advanced)
- [ ] Week 1 skills are achievable for a 10-year-old
- [ ] Skills are concrete ("Giải 5 bài toán logic mỗi ngày") not vague ("Học toán")
- [ ] Vietnamese descriptions are motivating and clear
- [ ] All 4 quarters are meaningfully different (not repetitive)

---

### S-20 — Roadmap Display + Weekly Skill Focus Selection

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

**Automated Tests**
- Unit: Lock/unlock logic based on current week number
- Unit: Progress calculation (% complete per skill, per quarter)
- Integration: `GET /api/child/roadmap` returns roadmap with correct lock states
- Integration: `POST /api/child/skill/progress` updates progress correctly
- E2E: Child views roadmap → current week is highlighted → taps skill → sees detail

**Done When**
- [ ] Roadmap is scannable at a glance — current position immediately clear
- [ ] Locked future content feels exciting, not frustrating
- [ ] Weekly skill focus selection persists and appears in check-in flow
- [ ] Progress is preserved across browser sessions

**Manual Scenarios**
- [ ] The roadmap is scannable at a glance — child can see where they are immediately
- [ ] Locked future content feels exciting (something to unlock), not frustrating
- [ ] Parent adjustment notes are visible to parent but not to child
- [ ] Progress is preserved across browser sessions
- [ ] Skill detail modal shows enough info to know what to do this week

---

---

## Phase 5 — Weekly Ritual (Epic 5)

**Goal:** Child completes weekly check-in in under 10 minutes. Parent receives a digest with a usable conversation starter.

---

### S-21 — Weekly Check-in Form (Child)

**User Stories**
- As a child, I want to log my week's activity and one reflection in under 10 minutes so that the ritual fits my life without feeling like homework.
- As a child, I want to feel celebrated when I submit my check-in so that showing up every week feels worth it.

**Technical Deliverables**
- Check-in form: mood selector (4 emoji), activity log (free-text, min 20 chars), reflection (guided prompt)
- Week number calculated automatically from `createdAt`
- Encouragement animation on submission
- `POST /api/child/checkin`
- Triggers: digest generation job (S-23) + milestone detection (S-25) + scenario storage link (S-22)

**Automated Tests**
- Unit: Week number calculation from `createdAt` date
- Unit: Form validation (mood required, activity min 20 chars)
- Integration: `POST /api/child/checkin` saves all fields, links to correct week
- E2E: Child opens check-in → completes all fields → submits → sees confirmation

**Done When**
- [ ] Entire check-in completable in under 10 minutes (timed with a real child)
- [ ] Mood selector is expressive and fun
- [ ] Completion confirmation is warm and celebratory
- [ ] Check-in data persists and is retrievable for parent digest

**Manual Scenarios**
- [ ] Entire check-in completable in under 10 minutes
- [ ] Mood selector is expressive and fun
- [ ] Activity log prompt is open enough to capture anything
- [ ] Reflection prompt encourages thinking, not just recapping
- [ ] Completion confirmation is warm and celebratory

---

### S-22 — Situational Scenario (AI Generated)

**User Stories**
- As a child, I want to respond to a real-world scenario related to my skill focus so that I can explore how I think, not just what I know.
- As a parent, I want to see my child's scenario and their response in the weekly digest so that I understand how my child is developing their thinking.

**Technical Deliverables**
- BullMQ cron job: generates scenario for each active child at start of each week (Monday 08:00 Vietnam time)
- Claude Haiku prompt: `career cluster + current skill + persona → open-ended scenario question (max 100 words, understandable by a 10-year-old)`
- Scenario embedded in check-in form as a final step
- Child's response stored linked to scenario and check-in
- `GET /api/child/checkin/scenario/current`

**Automated Tests**
- Unit: Scenario generation prompt is correctly constructed
- Unit: Scenario output validation (question must be open-ended, under 100 words)
- Integration: Weekly scenario job runs and saves scenario to DB
- Integration: Child response saved linked to scenario

**Done When**
- [ ] Scenario for week 2 of "Nhà thiên văn học" is genuinely relevant
- [ ] Scenario is understandable by a 10-year-old without adult explanation
- [ ] Different children with same career get meaningfully varied scenarios
- [ ] 5 consecutive scenarios for the same child are all different

**Manual Scenarios**
- [ ] Scenario for week 2 of "Nhà thiên văn học" is genuinely relevant
- [ ] Scenario is understandable by a 10-year-old without adult explanation
- [ ] Scenario feels like a fun challenge, not a test
- [ ] Different children with same career get appropriately varied scenarios

---

### S-23 — Parent Weekly Digest + Conversation Starter

**User Stories**
- As a parent, I want a weekly digest after my child checks in so that I have genuine insight into my child's week without interrogating them.
- As a parent, I want an AI-generated conversation starter I can actually say at dinner so that the digest translates into real connection with my child.

**Technical Deliverables**
- BullMQ job: triggered after child check-in submission
- Digest structure: streak + XP delta, AI highlight of child's reflection (Claude Haiku), scenario + child's response, conversation starter, "what to prepare next week"
- Conversation starter prompt references **current week AND previous weeks' patterns** — not just this week's check-in (this is the accumulation mechanism)
- `GET /api/parent/child/:id/digest/latest`; `GET /api/parent/child/:id/digest/history`
- Digest notification badge on parent dashboard tab

**Automated Tests**
- Unit: Digest generation prompt produces all required sections
- Integration: Digest is generated and saved after child check-in completes
- Integration: `GET /api/parent/child/:id/digest/latest` returns current week's digest
- E2E: Child submits check-in → parent refreshes → sees new digest

**Done When**
- [ ] Digest gives parent genuine insight they wouldn't otherwise have
- [ ] Conversation starter is something a parent would naturally say (manual sign-off by a Vietnamese parent)
- [ ] Week 4 digest references patterns from weeks 1–3 (not just week 4 data)
- [ ] Digest readable in under 3 minutes

**Manual Scenarios**
- [ ] Digest gives parent genuine insight they wouldn't have known otherwise
- [ ] AI highlight captures what is actually meaningful from child's response
- [ ] Conversation starter is something a parent could naturally say
- [ ] "What to prepare" section is practical and specific
- [ ] Digest is readable in under 3 minutes

---

### S-24 — Mid-Week AI Nudge

**User Stories**
- As a child, I want a mid-week prompt or challenge related to my skill focus so that the journey stays alive between check-ins without feeling like another task.

**Technical Deliverables**
- BullMQ cron job: Wednesday 10:00 Vietnam time for all active children
- Claude Haiku prompt: `current skill + progress + persona → short encouraging nudge (max 50 words, question or challenge format)`
- Nudge card on child home dashboard; dismissed on tap
- Dismissed nudges not re-shown
- Parent sees the nudge in their weekly view

**Automated Tests**
- Unit: Nudge prompt correctly uses current week's skill context
- Unit: Output validation (nudge must be under 50 words, must be a question or challenge)
- Integration: Cron job runs at correct time and saves nudge to DB
- Integration: Dismissed nudge is not re-shown

**Done When**
- [ ] Nudge card is visible and prominent mid-week on child dashboard
- [ ] Nudge feels like a friendly challenge from a coach, not a notification
- [ ] 5 consecutive nudges for same child are meaningfully different
- [ ] Dismissing nudge works — it does not reappear

**Manual Scenarios**
- [ ] Nudge card is visible and prominent on child dashboard mid-week
- [ ] Nudge feels like a friendly challenge from a coach, not a notification
- [ ] 5 consecutive nudges for same child are all meaningfully different
- [ ] Dismissing the nudge works — it doesn't reappear

---

---

## Phase 6 — Milestones (Epic 6)

**Goal:** When a child reaches their first milestone, they experience a special celebration and the parent is notified.

---

### S-25 — Milestone Detection

**User Stories**
- As the system, I want to detect when a child reaches a skill milestone immediately after a check-in so that achievements are recognised without delay.

**Technical Deliverables**
- Detection runs after every check-in submission
- Milestone types for MVP: `FIRST_CHECKIN`, `SKILL_LEVEL_UP`, `WEEK_STREAK_7`, `FIRST_ROADMAP_MONTH`
- Idempotent: each type fires exactly once per child (duplicate guard on DB insert)
- XP awarded on milestone; `ChildProfile.xp` updated
- `Milestone` record created with type, title, XP, timestamp
- `POST /api/child/checkin` response includes `milestone` field if one was triggered

**Automated Tests**
- Unit: Detection logic correctly identifies each milestone type
- Unit: Idempotency check — same milestone not created twice
- Unit: XP calculation is correct per milestone type
- Integration: After check-in, if milestone condition met → Milestone record created
- Integration: Duplicate milestone detection prevents double-awarding

**Done When**
- [ ] `FIRST_CHECKIN` fires immediately on first check-in submission
- [ ] `WEEK_STREAK_7` fires on day 7 of a streak (not before)
- [ ] Milestone fires exactly once even if check-in submitted twice (idempotency test)
- [ ] XP correctly added to child profile after milestone

**Manual Scenarios**
- [ ] Complete first check-in → `FIRST_CHECKIN` milestone fires immediately
- [ ] Complete 7 days in a row → `WEEK_STREAK_7` fires on day 7
- [ ] Milestone fires exactly once even if check-in is submitted twice
- [ ] XP is correctly added to child profile after milestone

---

### S-26 — Milestone Celebration Screen (Child)

**User Stories**
- As a child, I want to see a special full-screen celebration when I reach a milestone so that my effort feels genuinely recognised and not just logged.

**Technical Deliverables**
- Full-screen celebration: gradient background, CSS confetti animation, badge image relevant to milestone type
- Milestone title, description, XP gained
- "Tiếp tục hành trình!" CTA → child home
- Shown only once per milestone (redirect guard: if milestone already seen → skip to home)
- No loading delay between check-in submission and celebration (milestone in API response, not a poll)

**Automated Tests**
- Unit: Celebration screen renders correctly for each milestone type
- Integration: After check-in with milestone → API response includes `milestone` field
- E2E: Child submits check-in that triggers milestone → celebration screen shown → tap CTA → child home

**Done When**
- [ ] Celebration screen feels genuinely special for a 10-year-old (child tester sign-off)
- [ ] Confetti animation plays without jank on mobile
- [ ] Celebration screen not shown on subsequent check-ins without a new milestone
- [ ] No delay between submission and celebration appearance

**Manual Scenarios**
- [ ] Celebration screen feels genuinely special and exciting for a 10-year-old
- [ ] Confetti animation plays without jank on mobile
- [ ] Badge image is relevant to the milestone (not generic)
- [ ] Celebration screen is not shown on subsequent check-ins without a new milestone
- [ ] The joy is immediate — no loading delay between submission and celebration

---

### S-27 — Parent Milestone Notification

**User Stories**
- As a parent, I want to know when my child reaches a milestone — with a specific affirmation I can say to them — so that I can celebrate the effort with my child in real life.

**Technical Deliverables**
- Parent home dashboard: milestone card with child name + milestone description + AI-generated affirmation
  - Affirmation prompt: "Ba/Mẹ có thể nói với con: ..." — something specific the parent can say aloud
- Weekly digest: milestone section highlights what the child achieved
- Notification badge on parent tab bar; clears after parent views the milestone
- Milestone history: `GET /api/parent/child/:id/milestones` — all milestones in order

**Automated Tests**
- Unit: Parent milestone card renders correctly with all fields
- Integration: `GET /api/parent/child/:id/milestones` returns all milestones in order
- Integration: Notification badge count updates after new milestone
- E2E: Child earns milestone → parent refreshes dashboard → sees milestone card

**Done When**
- [ ] Parent milestone card makes them feel proud, not just informed (manual sign-off)
- [ ] AI affirmation is something a Vietnamese parent would actually say to their child
- [ ] Notification badge disappears after parent views the milestone
- [ ] Milestone history shows all earned milestones in a readable timeline

**Manual Scenarios**
- [ ] Parent notification makes them feel proud, not just informed
- [ ] AI affirmation message is something a parent would actually want to say
- [ ] Milestone card is visually distinct from regular content
- [ ] Milestone history shows all earned milestones in a readable timeline
- [ ] Notification badge disappears after parent views the milestone

---

---

## Slice Summary

| # | Slice | Phase | Type |
|---|---|---|---|
| S-01 | Project Scaffold | Phase 1 — Foundation | Code |
| S-02 | Database Schema | Phase 1 — Foundation | Code |
| S-03 | Authentication | Phase 1 — Foundation | Code |
| S-04 | CI/CD Pipeline | Phase 1 — Foundation | Code |
| S-05 | Observability | Phase 1 — Foundation | Code |
| S-06 | Parent Dashboard + Philosophy Screen | Phase 2 — User Identity | Code |
| S-07 | Child Dashboard | Phase 2 — User Identity | Code |
| S-08 | Role-Based Routing | Phase 2 — User Identity | Code |
| S-09 | Device Handoff | Phase 2 — User Identity | Code |
| G-01 | Vietnamese AI Quality Test | Gate 2.5 | **Gate** |
| G-02 | Prompt Baseline + Real Family Test | Gate 2.5 | **Gate** |
| S-10 | AI Persona Synthesis Pipeline | Phase 3 — Persona Discovery | Code |
| S-11 | Child Persona View + Confirmation Gate | Phase 3 — Persona Discovery | Code |
| S-12 | Parent Persona View + Delta | Phase 3 — Persona Discovery | Code |
| V-01 | Real Family Validation (Reveal Loop) | Phase 3 — Persona Discovery | **Gate** |
| S-13 | Parent Discovery Form | Phase 3 — Persona Discovery | Code |
| S-14 | Child Discovery Form + Honesty Mechanisms | Phase 3 — Persona Discovery | Code |
| S-15 | Persona Versioning | Phase 3 — Persona Discovery | Code |
| S-16 | Dream Input | Phase 4 — Career Journey | Code |
| S-17 | AI Career Cluster Generation | Phase 4 — Career Journey | Code |
| S-18 | Career Cluster Selection | Phase 4 — Career Journey | Code |
| S-19 | AI Skill Roadmap Generation | Phase 4 — Career Journey | Code |
| S-20 | Roadmap Display + Weekly Skill Focus | Phase 4 — Career Journey | Code |
| S-21 | Weekly Check-in Form | Phase 5 — Weekly Ritual | Code |
| S-22 | Situational Scenario | Phase 5 — Weekly Ritual | Code |
| S-23 | Parent Digest + Conversation Starter | Phase 5 — Weekly Ritual | Code |
| S-24 | Mid-Week AI Nudge | Phase 5 — Weekly Ritual | Code |
| S-25 | Milestone Detection | Phase 6 — Milestones | Code |
| S-26 | Milestone Celebration Screen | Phase 6 — Milestones | Code |
| S-27 | Parent Milestone Notification | Phase 6 — Milestones | Code |

**27 code slices. 3 validation gates (G-01, G-02, V-01). Gates are hard stops.**

---

---

## Testing Strategy

### Automated Test Coverage Targets

| Phase | Unit | Integration | E2E |
|---|---|---|---|
| Phase 1 — Foundation | 100% of logic | All API routes | Health check + auth flow |
| Phase 2 — User Identity | 100% of routing logic | All profile APIs | Login → dashboard (parent + child) |
| Phase 3 — Persona Discovery | 100% of prompt builders + parsers | All discovery APIs + BullMQ jobs | Full discovery flow |
| Phase 4 — Career Journey | 100% of roadmap logic | All career APIs + BullMQ jobs | Dream → roadmap flow |
| Phase 5 — Weekly Ritual | 100% of cron + nudge logic | Check-in + digest APIs | Full check-in flow |
| Phase 6 — Milestones | 100% of detection logic | Milestone creation + notification | Milestone celebration flow |

### Test Stack

| Type | Tool | Scope |
|---|---|---|
| Unit | Jest + ts-jest | Business logic, prompt builders, transformations |
| Integration | Jest + test PostgreSQL (Docker) | API routes, DB operations, Claude mock |
| E2E | Playwright | Critical user flows end-to-end |
| Manual | Test scenario checklists (above each slice) | UX quality, AI output quality, Vietnamese copy |
| CI | GitHub Actions | Runs unit + integration on every push; E2E on PR |

### Claude API Testing Protocol

| Test Type | Claude API Behaviour |
|---|---|
| Unit tests | Fully mocked (no API calls) |
| Integration tests | Mock client returns fixtures from `tests/fixtures/claude/` |
| E2E tests | Real Claude API (with test API key, lower rate limit) |
| Manual testing | Real Claude API with production prompts |

### Manual Test Execution

Each phase has a **manual test session** before it is marked Done:
1. Developer self-tests all scenarios with real data
2. At least one Vietnamese-speaking adult tests the parent flows
3. If possible, one child aged 8–13 tests the child flows
4. Vietnamese copy reviewed by a native speaker for naturalness

### Regression Testing

After each phase, run the full E2E suite to ensure nothing is broken. Critical regression paths:
- Auth flow (Phase 1)
- Role routing (Phase 2)
- Persona synthesis (Phase 3 — the core)
- Roadmap integrity (Phase 4)

### Build Order Within Each Phase

Features within a phase follow this order to enable incremental testing:
1. Database schema changes first (Prisma migration)
2. API routes (with mocks for AI calls)
3. BullMQ jobs (AI integration)
4. Frontend (connects to live API)
5. E2E tests (full flow)
6. Manual testing session

---

*GrowPath Build Plan v2.0 — Solo Founder + Claude Code | Vietnam Launch | May 2026*
