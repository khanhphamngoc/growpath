# GrowPath — MVP Agile Plan

> Each slice is independently buildable, testable, and usable.
> Solo developer + Claude Code | Target: 12 weeks
> Last updated: 2026-05-01

---

## Principles

- **Vertical slices only** — each feature touches DB → API → UI. No horizontal layers.
- **Done = shipped + tested** — automated tests + manual scenarios before closing any feature.
- **AI-first testing** — Claude API calls are always tested against a mock in unit/integration tests. Real calls only in E2E and manual.
- **Vietnamese copy in every slice** — no English placeholder text reaches a testable screen.
- **Each epic is independently demonstrable** — a stakeholder can see working software after each epic, not just at the end.

---

## Definition of Done (applies to every feature)

A feature is **Done** when:

- [ ] Code is merged to `main` and CI passes
- [ ] Unit tests written and passing (coverage for business logic)
- [ ] Integration tests written and passing (API routes + DB)
- [ ] E2E test written for any user-facing flow (Playwright)
- [ ] Manual test scenarios executed and signed off
- [ ] Vietnamese copy reviewed for naturalness
- [ ] Responsive layout verified (mobile + desktop)
- [ ] No TypeScript errors (`npm run lint` passes)
- [ ] OpenTelemetry span added for any new API route

---

## Test Stack

| Type | Tool | Scope |
|---|---|---|
| Unit | Jest + ts-jest | Business logic, prompt builders, transformations |
| Integration | Jest + test PostgreSQL (Docker) | API routes, DB operations, Claude mock |
| E2E | Playwright | Critical user flows end-to-end |
| Manual | Test scenario checklists (below each feature) | UX quality, AI output quality, Vietnamese copy |
| CI | GitHub Actions | Runs unit + integration on every push; E2E on PR |

---

## Epic Overview

| Epic | Goal | Sequence Logic |
|---|---|---|
| **E1: Foundation** | Running dev environment, schema, auth, CI, observability | Technical necessity — everything depends on this |
| **E2: User Identity** | Parent + child profiles with role-tailored UX | Required before any feature can be tested with real users |
| **E2.5: Vietnamese AI Quality Gate** | Claude Vietnamese output validated + real family revelation test | **Risk gate** — blocks Epic 3. Riskiest assumption tested as early as possible |
| **E3: Persona Discovery** | Reveal-first build: synthesis → child view → parent view → then forms | Core hypothesis; built reveal-first not form-first (see build order below) |
| **E4: Career Journey** | Dream → career clusters → skill roadmap | Extends the revelation into a tangible path; validates career cluster quality |
| **E5: Weekly Ritual** | Check-in, digest, AI nudge | Validates retention mechanism; tests whether weekly ritual sticks |
| **E6: Milestones** | First milestone detection + celebration | Validates celebration as a retention driver |

## Build Sequence Rationale

Epics are sequenced **by risk, not by feature completeness.** The principle: get the riskiest assumption in front of a real Vietnamese family as fast as possible, before building features that depend on it.

**Risk register (highest to lowest):**
1. Does the AI-synthesised Vietnamese persona produce a genuine "that's me" reaction? ← tested in E2.5
2. Is Claude's Vietnamese output quality sufficient without heavy post-processing? ← gated in E2.5
3. Does the career cluster + roadmap feel compelling enough to sustain the journey? ← validated in E4
4. Does the weekly ritual stick beyond week 2? ← validated in E5
5. Does milestone celebration improve retention? ← validated in E6

**Epic 3 build order within the epic (reveal-first, not form-first):**
Build the reveal screen and synthesis pipeline first using minimal hardcoded inputs, test with a real family, then expand to the full 7-dimension input forms. Do not build all of F3.1 + F3.2 before knowing whether F3.4 lands.

```
F3.3 (synthesis with minimal input) → F3.4 (child reveal) → F3.5 (parent view + delta)
→ validate with real family →
F3.1 (full parent form) → F3.2 (full child form) → F3.6 (versioning)
```

---

---

# EPIC 1 — Foundation

**Goal:** A running, observable, deployable development environment that every subsequent feature builds on.
**Done when:** `docker compose up` starts the full stack, health check passes, and a test user can authenticate with Google OAuth.

---

## F1.1 — Project Scaffold & Local Dev Environment

**What:** Next.js app + Docker Compose stack (PostgreSQL, Redis, app) running locally with a single command.

**Includes:**
- Next.js 14+ (App Router) initialised with Tailwind CSS + shadcn/ui
- Docker Compose: app + postgres + redis + (observability stack)
- `.env.example` with all required vars
- `npm run dev` starts app; `npm run test` runs test suite

**Automated Tests:**
- Unit: Health check endpoint returns 200
- Integration: App connects to PostgreSQL and Redis on startup

**Manual Test Scenarios:**
- [ ] `docker compose up` starts without errors
- [ ] `http://localhost:3000` loads with no console errors
- [ ] Hot reload works when editing a component
- [ ] `npm run lint` passes with no errors

---

## F1.2 — Core Database Schema

**What:** Prisma schema with all MVP entities defined and migrated.

**Entities:**
```
User (id, email, role: PARENT|CHILD, name, city, createdAt)
FamilyLink (parentId, childId)
ChildProfile (userId, dob, grade, school, avatarUrl)
Persona (childId, version, dimensions: JSON, createdAt)
PersonaDelta (personaId, parentView: JSON, childView: JSON, deltaNotes: JSON)
Dream (childId, text, createdAt)
CareerCluster (dreamId, clusters: JSON, selectedCluster: String)
SkillRoadmap (childId, careerId, roadmap: JSON, createdAt)
WeeklyCheckin (childId, weekNumber, responses: JSON, scenarioResponse: String, mood: String, createdAt)
Milestone (childId, type, title, xp, achievedAt)
```

**Automated Tests:**
- Unit: Prisma schema validation (all relations correct)
- Integration: All CRUD operations on each model via test DB
- Integration: FamilyLink enforces parent-child relationship correctly

**Manual Test Scenarios:**
- [ ] `npx prisma studio` opens and shows all tables
- [ ] Seed script populates sample parent + child + persona data
- [ ] All foreign key constraints enforced (try inserting orphaned records)

---

## F1.3 — Authentication (NextAuth.js v5)

**What:** Google OAuth login. Parent and child authenticate separately. Session includes `userId` and `role`.

**Includes:**
- NextAuth.js v5 with Google provider
- Facebook + Telegram providers configured (can enable later)
- Session stores `userId`, `role`, `name`
- Protected routes redirect to login if unauthenticated
- Role middleware: `/parent/*` requires `role=PARENT`, `/child/*` requires `role=CHILD`

**Automated Tests:**
- Unit: Role middleware blocks wrong role
- Unit: Session shape validation
- Integration: OAuth callback creates User record if new, retrieves if existing
- Integration: Protected API routes return 401 without session

**Manual Test Scenarios:**
- [ ] Google login flow completes and redirects to correct dashboard
- [ ] Logging out clears session and redirects to login
- [ ] Parent URL accessed as child → redirected correctly
- [ ] New user created in DB on first login
- [ ] Returning user retrieves existing account

---

## F1.4 — CI/CD Pipeline

**What:** GitHub Actions pipeline that runs tests on every push and blocks merge on failure.

**Includes:**
- `test.yml`: runs unit + integration tests on push to any branch
- `e2e.yml`: runs Playwright on PR to `main`
- Test PostgreSQL + Redis spun up in GitHub Actions via service containers
- Lint + type check step

**Automated Tests:**
- The pipeline itself is the test (it must pass)

**Manual Test Scenarios:**
- [ ] Push a broken test → pipeline fails and shows error
- [ ] Push a passing commit → pipeline goes green
- [ ] PR with failing E2E is blocked from merge

---

## F1.5 — Observability Baseline

**What:** OpenTelemetry instrumentation wired up. Every API route emits a trace. Prometheus + Grafana visible locally.

**Includes:**
- `@opentelemetry/sdk-node` initialised in Next.js
- Auto-instrumentation for HTTP, Prisma
- Custom span wrapper for Claude API calls: `claude.synthesis`, `claude.careerGeneration` etc.
- Prometheus metrics endpoint at `/api/metrics`
- Grafana + Jaeger accessible at `localhost:3001` and `localhost:16686` via Docker Compose

**Automated Tests:**
- Integration: `/api/metrics` returns 200 with valid Prometheus format
- Integration: A sample API call produces a trace in Jaeger

**Manual Test Scenarios:**
- [ ] Make an API call → see trace in Jaeger UI
- [ ] `/api/metrics` shows request count and latency metrics
- [ ] Grafana dashboard loads with metrics visible

---

---

# EPIC 2 — User Identity

**Goal:** A parent and a child have separate, role-tailored experiences from the moment they log in.
**Done when:** A sample parent can log in and see their parent dashboard. A sample child can log in and see their child dashboard. The UX feels distinctly different for each role.

---

## F2.1 — Sample Parent Profile & Dashboard Shell

**What:** A parent logs in and sees their dashboard with sample data pre-loaded (no real data yet). Critically, the parent's first session includes a one-screen philosophy statement that explains GrowPath's design principles — including the child's view rule — before they input anything.

**Includes:**
- **Parent philosophy screen (shown once on first login, before dashboard):** A single screen that sets expectations for how GrowPath works. Must include, in plain Vietnamese:
  1. Your child's raw answers are private — you will see a synthesised summary, not their exact words
  2. When you and your child see things differently, GrowPath will try your child's perspective first — because that is the only way children learn to be honest with their parents
  3. You will always see the full picture, including where you differ — and you will always have the last word on the journey
  - Copy example: *"GrowPath được thiết kế để con trẻ cảm thấy an toàn khi nói thật. Khi Ba/Mẹ và con chưa đồng ý, chúng tôi sẽ thử theo góc nhìn của con trước — rồi cùng nhau xem lại sau. Đây là cách chúng tôi giúp con mở lòng hơn với Ba/Mẹ."*
  - Parent must tap "Tôi hiểu và đồng ý" to proceed — this is informed opt-in, not a buried terms checkbox
  - `parent.philosophyAcknowledgedAt` timestamp set on acknowledgement
- Parent dashboard layout: header, bottom tab bar (Home, Report, Persona, Settings)
- Sample parent profile card (name, city)
- Placeholder cards for "Children" section
- Seed script: creates sample parent user `Nguyễn Thị Hương`
- Indigo colour theme applied consistently

**Automated Tests:**
- Unit: Philosophy screen renders before dashboard on first login
- Unit: Dashboard is inaccessible until `philosophyAcknowledgedAt` is set
- Integration: `GET /api/parent/profile` returns parent profile
- E2E: Parent logs in → sees philosophy screen → acknowledges → sees dashboard

**Manual Test Scenarios:**
- [ ] Philosophy screen appears before anything else on first login
- [ ] A Vietnamese parent reads the screen and can explain the child's view rule in their own words
- [ ] The framing feels empowering, not like a warning — parent feels informed, not warned off
- [ ] "Tôi hiểu và đồng ý" tap registers and is not shown again on subsequent logins
- [ ] Dashboard greeting shows parent's name in Vietnamese
- [ ] All navigation tabs are visible and tappable
- [ ] Layout is correct on both desktop (390px centered) and actual mobile browser

---

## F2.2 — Sample Child Profile & Dashboard Shell

**What:** A child logs in and sees their own dashboard — visually distinct from the parent experience.

**Includes:**
- Child dashboard layout: greeting, XP bar, bottom tab bar (Home, Journey, Check-in, Achievements)
- Sample child profile: `Nguyễn Minh Anh`, age 10, grade 5
- Orange/warm colour theme applied consistently
- Age-appropriate language throughout
- Seed script extended to include child user

**Automated Tests:**
- Unit: Child dashboard renders with sample data props
- Integration: `GET /api/child/profile` returns child profile
- E2E: Child logs in → sees child dashboard with name and XP bar

**Manual Test Scenarios:**
- [ ] Child dashboard looks and feels different from parent dashboard (colour, tone, language)
- [ ] XP bar displays correctly
- [ ] Vietnamese copy is age-appropriate for 8–13 year olds
- [ ] Emoji and visual elements render correctly

---

## F2.3 — Role-Based Routing & Layout

**What:** The app automatically routes authenticated users to the correct experience based on their role. A parent cannot see the child dashboard and vice versa.

**Includes:**
- Middleware: `role=PARENT` → `/parent/dashboard`, `role=CHILD` → `/child/dashboard`
- `FamilyLink` API: parent can see their linked children
- Parent dashboard shows linked child(ren) as cards with name + avatar
- Child dashboard shows no parent-facing information

**Automated Tests:**
- Unit: Role routing middleware returns correct redirect per role
- Integration: Parent API endpoints reject requests with `role=CHILD` session
- Integration: Child API endpoints reject requests with `role=PARENT` session
- E2E: Login as parent → parent dashboard. Login as child → child dashboard.

**Manual Test Scenarios:**
- [ ] Parent tries to navigate to `/child/dashboard` → redirected to parent dashboard
- [ ] Child tries to navigate to `/parent/dashboard` → redirected to child dashboard
- [ ] Parent sees their linked child(ren) on the dashboard
- [ ] Switching user (logout + login as child) lands on the correct dashboard

---

## F2.4 — Parent Can Hand Phone to Child

**What:** A parent can initiate a "hand off" from their session to the child's session — for scenarios where they share a device.

**Includes:**
- "Đưa điện thoại cho con" button on parent dashboard
- Generates a short-lived child login link (or PIN) valid for 10 minutes
- Child sees their own dashboard when they use it
- Parent session resumes normally after child is done

**Automated Tests:**
- Unit: Handoff token expires correctly after TTL
- Integration: `POST /api/auth/handoff` generates valid child session token
- Integration: Expired token returns 401

**Manual Test Scenarios:**
- [ ] Parent taps handoff → child sees child dashboard without logging in manually
- [ ] Handoff link/PIN expires after 10 minutes
- [ ] Child cannot access parent dashboard during handoff session
- [ ] After handoff, parent can return to their dashboard

---

---

# EPIC 2.5 — Vietnamese AI Quality Gate

**Goal:** Validate that Claude Sonnet can produce Vietnamese persona output that meets the product's quality bar before any Epic 3 application code is written.
**Done when:** All three test cases score ≥ 4.0 average across five dimensions, reviewed by a native Vietnamese speaker.
**Timing:** Completed by end of week 4, in parallel with Epic 2 UI work. Blocks Epic 3 start.

---

## QG.1 — Manual Prompt Quality Test

**What:** Run Claude Sonnet through three representative test cases using handcrafted Vietnamese parent + child inputs. Evaluate output before building the synthesis pipeline.

**Test Cases:**

| Case | Child Dream | Delta | Why |
|---|---|---|---|
| A | Bác sĩ (common, expected) | Small | Tests whether synthesis adds insight beyond the obvious |
| B | YouTuber / streamer | Large | Tests how Claude handles a dream parents commonly resist |
| C | Nhà thiên văn học | Medium | Tests an unusual-but-positive dream with ambiguous parental context |

**Evaluation Rubric (score each 1–5, reviewer must be a native Vietnamese speaker from HCMC):**

1. **Grammatical correctness** — no errors or awkward constructions
2. **Regional naturalness** — sounds like HCMC Vietnamese, not a textbook
3. **Age-appropriate register** — a 10-year-old can understand and own this
4. **Emotional warmth** — feels like a person wrote it, not a model
5. **Cultural fit** — respects Vietnamese family dynamics without being cliché

**Quality Gate:** Average ≥ 4.0 across all three cases and all five dimensions. If not met, iterate prompt before proceeding.

**Real Family Revelation Test (second gate, same week):**
After AI quality passes, show the Case B output (large delta, YouTuber dream) to one real Vietnamese family — one parent + one child aged 8–13. Use a static screen mockup, not a working app. Observe and record:
- Does the child say anything resembling "that's me"?
- Does the parent express surprise at any dimension?
- Does either party react negatively to any phrasing?

This is a 1-hour session, not a formal study. The goal is a directional signal on the core hypothesis before any Epic 3 code is written. A strong positive reaction confirms; a flat or negative reaction requires diagnosis before proceeding.

**Manual Test Scenarios:**
- [ ] All three test cases run and outputs saved to `tests/fixtures/claude/persona_vi/`
- [ ] Native Vietnamese speaker scores each output on the rubric (documented in `docs/vi_quality_review.md`)
- [ ] Average score ≥ 4.0 confirmed before Epic 3 kick-off
- [ ] At least one case with a large parent-child delta is tested
- [ ] Real family revelation test conducted with one parent + child — reaction documented
- [ ] Core hypothesis signal is positive before Epic 3 code starts

---

## QG.2 — Prompt Engineering Baseline

**What:** Establish the prompt configuration that achieves the quality gate. This becomes the canonical prompt used in F3.3.

**Prompt engineering levers to apply (in order):**

1. **Few-shot examples:** Write 2–3 gold-standard persona outputs in Vietnamese by hand. These are the exact tone, register, and warmth the product requires. Include them in the system prompt as examples. This is the highest-leverage lever.

2. **Register and dialect specification:** Replace vague tone instructions with precise guidance:
   ```
   Viết bằng tiếng Việt miền Nam, thân mật như người anh/chị lớn đang nói
   chuyện với một bạn nhỏ 8–13 tuổi. Tránh từ ngữ hàn lâm, tránh những
   cụm từ nghe như dịch từ tiếng Anh. Dùng ngôn ngữ mà bố/mẹ và con đều
   cảm thấy tự nhiên khi đọc to cùng nhau.
   ```

3. **Structured output with tone-sensitive slots:** Define a fixed template (headline, per-dimension, closing affirmation) and ask Claude to fill each slot. Constrains shape; makes quality evaluation and re-prompting easier.

**Output:** Canonical prompt saved to `src/ai/prompts/persona-synthesis.ts` before F3.3 build starts.

---

## QG.3 — Fallback Plan (if quality gate not met by end of week 4)

If prompt engineering alone cannot reach ≥ 4.0 average:

| Fallback | Action |
|---|---|
| **Human editorial layer** | A Vietnamese-speaking editor reviews every synthesised persona before it surfaces to the family. Adds 24–48h latency. Acceptable for first 50–100 MVP families. Flag this as a known operational cost. |
| **Template-assisted generation** | A Vietnamese copywriter writes structural template shells. Claude fills in personalised content slots. Less creative, more consistent. Implement as a fallback prompt mode. |
| **Parent light-editing** | Parent can adjust 1–2 phrases in the persona before the child sees the reveal. Requires a lightweight editing UI added to F3.5. |

Decision on which fallback to activate must be made before Epic 3 week 5 kickoff — not during it.

---

---

# EPIC 3 — Persona Discovery

**Goal:** Parent and child each share their perspective. AI synthesises both into a shared persona. Parent sees the full picture (with delta). Child sees only the empowering view.
**Done when:** The "shared realisation moment" works end-to-end with real Claude API output.

---

## F3.1 — Parent Discovery Form

**What:** A multi-section form where the parent shares their observations of the child across all 7 persona dimensions.

**Includes:**
- 7-section form: Dreams, Interests, Strengths, Personality, Growth Edges, Values, Learning Styles
- Mix of chip selection + free-text for each dimension
- Progress indicator (step X of 7)
- Saves draft automatically (no data lost if interrupted)
- Vietnamese prompts that feel warm and non-clinical

**Automated Tests:**
- Unit: Form validation (required fields, min character counts)
- Unit: Draft auto-save debounce logic
- Integration: `POST /api/discovery/parent` saves form data correctly to DB
- Integration: Partial save (draft) and resume works correctly

**Manual Test Scenarios:**
- [ ] Each of the 7 sections is clear and easy to understand for a Vietnamese parent
- [ ] Chips are relevant and cover common observations
- [ ] Free-text prompts feel like a conversation, not a questionnaire
- [ ] Progress bar advances correctly
- [ ] Closing app mid-form and returning preserves all answers
- [ ] Form is comfortable on mobile (no keyboard obscuring inputs)

---

## F3.2 — Child Discovery Form

**What:** A child-friendly version of the discovery form. Same 7 dimensions but age-appropriate language, visual design, and interaction style — designed to maximise honest self-expression, not performed answers.

**Includes:**
- **Privacy architecture visual before the first question:** A simple diagram the child can read — "Con viết ở đây → AI đọc → Ba/Mẹ chỉ thấy bản tóm tắt này." Raw answers are never shown to the parent. Only the synthesised persona is shared. This is shown at the start, not buried in a terms screen.
- **Exploration framing, not declaration framing:** Questions are reframed to remove evaluation pressure. Examples:
  - ❌ "Con muốn làm gì khi lớn lên?" → ✅ "Nếu không ai biết và không ai phán xét, con muốn thử công việc gì nhất?"
  - ❌ "Con giỏi môn gì?" → ✅ "Khi nào con quên mất cả giờ vì quá mê làm điều gì đó?"
  - Each question opens with: "Không có câu trả lời đúng hay sai — đây là về con, không phải về điểm số."
- **AI positioned as the child's advocate:** Intro copy reads: "AI sẽ giúp con giải thích cho Ba/Mẹ hiểu con theo cách con muốn được hiểu." This frames the AI as translating the child to the parent — not reporting the child to the parent.
- Large emoji-led sections, simple language
- Dream input is prominent and expressive (large text input with star icon)
- Chip selections use fun, relatable labels
- Progress bar with encouraging messages at each step
- "Con làm tốt lắm!" encouragement on completion

**Automated Tests:**
- Unit: Child form validation (different rules from parent — more lenient)
- Integration: `POST /api/discovery/child` saves to DB and links to correct `childId`
- Integration: Both parent and child submissions linked to same `Persona` record
- Unit: Privacy architecture screen is rendered before question 1 (not skippable)

**Manual Test Scenarios:**
- [ ] A real 8–13 year old can complete the form without adult help
- [ ] Child reads the privacy diagram and can explain in their own words what Ba/Mẹ will and won't see
- [ ] The exploration-framed questions produce meaningfully different answers than declaration-framed versions (test with 2 children — same child, different framing, compare outputs)
- [ ] Language feels exciting, not like homework
- [ ] Dream input is the first and most prominent field
- [ ] Emoji and visual elements make the form feel playful
- [ ] Completion screen is enthusiastic and celebratory

---

## F3.3 — AI Persona Synthesis (Claude API)

**What:** When both parent and child have submitted, Claude synthesises both inputs into a structured persona. This is the core AI feature of the product.

**Includes:**
- BullMQ job triggered when both submissions exist for a `childId`
- Claude Sonnet prompt: structured synthesis using canonical prompt from QG.2 (few-shot examples included)
- Conflict detection: identifies dimensions where parent and child views differ significantly
- Output schema: `persona: { dimensions: [...], headline: string }` + `delta: { conflicts: [...], notes: string }`
- **AI self-evaluation step:** After synthesis, a second Claude Haiku call scores the output before saving:
  ```
  Đọc bản mô tả nhân cách trẻ em sau. Đánh giá:
  1. Có nghe tự nhiên với người Việt Nam không? (1-5)
  2. Có phù hợp với trẻ 8-13 tuổi không? (1-5)
  3. Có điểm nào nghe như dịch máy không?
  Nếu điểm dưới 4, trả về needs_review: true
  ```
  If `needs_review: true`, the job re-prompts Sonnet with the evaluation feedback appended. Max one retry via self-eval. If still flagged, sets `persona.needsEditorialReview: true` — human fallback (QG.3) is triggered.
- Retry logic: 3 attempts with exponential backoff on API errors
- Vietnamese output dialect and register specified explicitly in prompt (per QG.2)

**Prompt Design:**
```
System: You are a child development specialist helping Vietnamese families understand their child.
You are the child's advocate — your job is to help the parent understand the child on the
child's own terms, not to arbitrate between them.

Viết bằng tiếng Việt miền Nam, thân mật như người anh/chị lớn đang nói chuyện với
một bạn nhỏ 8–13 tuổi. Tránh từ ngữ hàn lâm, tránh những cụm từ nghe như dịch từ
tiếng Anh. Dùng ngôn ngữ mà bố/mẹ và con đều cảm thấy tự nhiên khi đọc to cùng nhau.

[FEW-SHOT EXAMPLES: 2–3 gold-standard persona outputs written by hand — see
src/ai/prompts/persona-synthesis.ts for the canonical examples established in QG.2]

Given parent observations and child self-description, synthesise a persona that:
1. Centres the child's authentic voice — child's view takes precedence on all dimensions
2. Incorporates parent's context where it adds genuine depth (not where it overrides)
3. Uses warm, non-clinical Vietnamese a child aged 8–13 can own and feel proud of
4. Assumes the child may have partially self-censored — where child input seems performed
   or overly aligned with typical parental expectations, note this in the delta as
   "possibly understated" for the parent's awareness
5. Returns structured JSON matching the PersonaOutput schema
```

**Automated Tests:**
- Unit: Prompt builder constructs correct prompt from parent + child inputs (including few-shot examples)
- Unit: Output parser handles malformed Claude response gracefully
- Unit: Conflict detection algorithm identifies meaningful deltas
- Unit: Self-evaluation step triggers re-prompt when `needs_review: true`
- Unit: `needsEditorialReview` flag set correctly when self-eval fails after retry
- Integration: BullMQ job is enqueued when both submissions exist
- Integration: Claude mock returns valid persona → job saves to DB correctly
- Integration: Job retry logic triggers on Claude API error

**Manual Test Scenarios:**
- [ ] With sample parent + child inputs, Claude produces a persona that feels authentic
- [ ] Vietnamese output is fluent and warm — scores ≥ 4.0 on QG.1 rubric (re-use rubric here)
- [ ] The "headline" feels like something the child would be proud of
- [ ] When parent and child inputs conflict, the delta is detected and "possibly understated" is flagged appropriately
- [ ] Self-evaluation correctly rejects a deliberately flat/robotic test output
- [ ] Processing completes within 30 seconds (including self-eval call)
- [ ] What happens if Claude API is down? (graceful error, retry queued)

---

## F3.4 — Child Persona View + Confirmation Gate

**What:** The child sees their synthesised persona first — before the parent. The child reviews, confirms it feels right, and only then does the parent gain access. This is both a UX moment and a trust mechanism.

**Includes:**
- Full persona display across all 7 dimensions
- Visual tags for interests/strengths (colourful chips)
- Headline sentence the child can own
- No delta, no conflict — only empowerment
- **Child confirmation step:** After reading, the child sees: "Bản sắc này có đúng với con không?" with two options: "Đúng rồi! 🎉" and "Con muốn chỉnh lại một chút". If the child flags something, they can add a short note — this is stored as an "amendment request" and surfaced to the AI for a light re-synthesis on the flagged dimension only. Parent access is blocked until the child confirms.
- `persona.childConfirmedAt` timestamp set on confirmation — parent API returns 403 until this is set
- "Bắt đầu hành trình!" CTA → leads to Dream screen (only appears after confirmation)
- Shareable moment (optional: screenshot prompt)

**Automated Tests:**
- Unit: Persona view renders correctly with all 7 dimensions populated
- Unit: Missing dimensions handled gracefully (not all 7 may have data)
- Integration: `GET /api/child/persona` returns correct persona for authenticated child
- Integration: `GET /api/parent/child/:id/persona` returns 403 until `childConfirmedAt` is set
- Integration: Amendment request triggers partial re-synthesis job on flagged dimension only
- E2E: Child completes discovery → sees persona reveal screen → confirms → parent can now access

**Manual Test Scenarios:**
- [ ] The reveal screen feels special — like opening a gift
- [ ] A child reading this would say "that's me!"
- [ ] The confirmation question feels empowering, not administrative
- [ ] "Con muốn chỉnh lại" path works — child can flag a dimension and see it updated
- [ ] No adult-only or negative content visible to child
- [ ] All 7 dimensions are readable and understandable by a 10-year-old
- [ ] CTA button is prominent and exciting
- [ ] Parent accessing persona before child confirms sees a "Đang chờ con xem" waiting state

---

## F3.5 — Parent Persona View (with Delta)

**What:** The parent sees the same persona plus a hidden "delta" section showing where parent and child views differed — and AI-generated conversation guidance.

**Includes:**
- Full persona display (same as child view)
- Delta section below: "Điểm khác biệt thú vị" — shown only to parent
- AI-generated conversation starter based on the delta
- "Gợi ý hoạt động" — one suggested activity to bridge the gap
- Version history: if persona has been updated before, parent can see previous versions

**Automated Tests:**
- Unit: Delta section only renders when `role=PARENT`
- Unit: Conversation starter generator produces contextually relevant output
- Integration: `GET /api/parent/child/:id/persona` returns persona + delta for parent
- Integration: Child endpoint `GET /api/child/persona` never returns delta fields

**Manual Test Scenarios:**
- [ ] Parent can read the delta and it provides genuine insight
- [ ] The framing of the delta is positive and constructive — never critical of the child
- [ ] Conversation starter feels natural to say to a child
- [ ] Child persona URL returns no delta information (test this explicitly)
- [ ] Version history shows previous persona if it exists

---

## F3.6 — Persona Versioning & Inspect/Adapt

**What:** Persona is not static. When the quarterly review triggers, a new version is created. Parent and child can see how the persona has evolved.

**Includes:**
- `Persona.version` increments on each update
- Quarterly review prompt: "Đã 3 tháng — cùng xem lại bản sắc của con nhé!"
- Parent-triggered re-discovery: opens discovery forms for re-submission
- "Persona timeline" — simple view showing Version 1 → Version 2 changes
- Delta between versions: what changed and what stayed the same

**Automated Tests:**
- Unit: Version increment logic is correct
- Integration: Re-submission creates new version, does not overwrite old
- Integration: `GET /api/child/persona/history` returns all versions in order

**Manual Test Scenarios:**
- [ ] After quarterly review, new version is created and displayed correctly
- [ ] Old versions are accessible and show their original content
- [ ] The "what changed" comparison is readable and meaningful
- [ ] Re-running discovery with same answers produces similar (not wildly different) persona

---

---

# EPIC 4 — Career Journey

**Goal:** A child can name their dream, receive AI-generated career paths, select one, and see a structured skill roadmap.
**Done when:** A child completes the full dream → roadmap flow with real Claude output, and the roadmap displays weekly/monthly/quarterly structure.

---

## F4.1 — Dream Input

**What:** The child names their dream career. Parent adds contextual input. Both are saved.

**Includes:**
- Child: expressive dream input screen (large text, emoji, suggested options)
- Parent: context input ("Ba/Mẹ nghĩ gì về ước mơ này?") — separate, async
- Dream saved to `Dream` table with timestamp
- Child can update their dream (creates new version)
- AI validation: if dream is very unusual, Claude adds a gentle positive framing

**Automated Tests:**
- Unit: Dream text validation (min length, sanitisation)
- Integration: `POST /api/child/dream` saves correctly, links to child profile
- Integration: Parent context `POST /api/parent/child/:id/dream-context` saves separately

**Manual Test Scenarios:**
- [ ] Child can type any dream freely — no restrictions
- [ ] Suggested dream options are varied and inspiring
- [ ] AI positive framing for unusual dreams ("Tôi muốn là siêu anh hùng") is encouraging not dismissive
- [ ] Parent context screen is separate and doesn't pressure the child
- [ ] Dream can be updated without losing previous version

---

## F4.2 — AI Career Cluster Generation

**What:** Claude takes the child's dream + persona and generates 2–3 career cluster paths with descriptions and required skill tags.

**Includes:**
- BullMQ async job: triggered when dream is submitted
- Claude prompt: `dream + persona → 2-3 career clusters in Vietnamese`
- Each cluster: title, emoji, description (2 sentences), 4–6 skill tags, career examples
- Parent input factored in as "context" not "override"
- Output saved to `CareerCluster` table

**Automated Tests:**
- Unit: Prompt builder correctly incorporates dream + persona + parent context
- Unit: Output parser validates cluster schema (title, emoji, description, skills)
- Integration: Job produces 2–3 clusters within expected schema
- Integration: Claude mock → clusters saved to DB correctly

**Manual Test Scenarios:**
- [ ] For "Nhà khoa học vũ trụ", the 3 clusters are meaningfully different and all relevant
- [ ] Skill tags are specific (not generic like "học giỏi")
- [ ] Career descriptions are exciting and age-appropriate
- [ ] Parent's context input visibly influences at least one cluster
- [ ] For an unusual dream, clusters are still thoughtful and positive

---

## F4.3 — Career Cluster Selection

**What:** The child views the 3 career clusters and selects one (or saves all for later). Parent reviews and can suggest changes.

**Includes:**
- Career cluster display screen (child view): visual cards, tappable
- Parent review screen: same cards + AI note on alignment with persona
- "Chọn hướng này" CTA → saves selection, triggers roadmap generation
- Parent can flag a concern (text input) → stored as note, not shown to child
- Child can change selection later

**Automated Tests:**
- Unit: Selection state management (only one can be selected at a time)
- Integration: `POST /api/child/career/select` saves selection correctly
- Integration: Parent flag `POST /api/parent/child/:id/career-flag` saves without showing to child

**Manual Test Scenarios:**
- [ ] Child finds the selection process exciting, not overwhelming
- [ ] Tapping a card makes it clearly selected (visual feedback)
- [ ] Parent flag field is clearly separate and private
- [ ] After selection, the transition to roadmap generation feels smooth
- [ ] Can change selection: old selection is deselected, new one activates

---

## F4.4 — AI Skill Roadmap Generation

**What:** Claude generates a structured skill roadmap from the selected career cluster and the child's persona, organised into quarterly milestones, monthly goals, and weekly focus areas.

**Includes:**
- BullMQ async job: triggered on career selection
- Claude prompt: `career cluster + persona → roadmap with 4 quarters, each with 3 monthly goals, each with weekly skill focus`
- Skills mapped to concrete activities, not abstract concepts
- Difficulty appropriately calibrated to age 8–13
- Roadmap saved to `SkillRoadmap` table as structured JSON

**Automated Tests:**
- Unit: Prompt correctly passes career cluster + persona + child age
- Unit: Roadmap output parser validates structure (4 quarters, monthly goals, weekly skills)
- Unit: Skill difficulty calibration logic (age-appropriate check)
- Integration: Generated roadmap saved correctly to DB

**Manual Test Scenarios:**
- [ ] Roadmap for "Nhà thiên văn học" has logical skill progression (foundational → advanced)
- [ ] Week 1 skills are achievable for a 10-year-old
- [ ] Skills are concrete ("Giải 5 bài toán logic mỗi ngày") not vague ("Học toán")
- [ ] Vietnamese descriptions are motivating and clear
- [ ] All 4 quarters are meaningfully different (not repetitive)

---

## F4.5 — Roadmap Display

**What:** The child and parent can see the full roadmap with clear time horizons, progress indicators, and locked/unlocked states.

**Includes:**
- Child roadmap view: current week highlighted, upcoming weeks visible, future quarters locked
- Parent roadmap view: same + ability to suggest adjustments (stored as notes)
- Progress persistence: completed skills remembered across sessions
- Skill detail modal: tap a skill → see description + suggested activities
- Visual lock/unlock mechanic: future quarters visible but greyed out until unlocked

**Automated Tests:**
- Unit: Lock/unlock logic based on current week number
- Unit: Progress calculation (% complete per skill, per quarter)
- Integration: `GET /api/child/roadmap` returns roadmap with correct lock states
- Integration: `POST /api/child/skill/progress` updates progress correctly
- E2E: Child views roadmap → current week is highlighted → taps skill → sees detail

**Manual Test Scenarios:**
- [ ] The roadmap is scannable at a glance — child can see where they are immediately
- [ ] Locked future content feels exciting (something to unlock), not frustrating
- [ ] Parent adjustment notes are visible to parent but not to child
- [ ] Progress is preserved across browser sessions
- [ ] Skill detail modal shows enough info to know what to do this week

---

---

# EPIC 5 — Weekly Ritual

**Goal:** A child can complete a weekly check-in in under 10 minutes. A parent receives a digest that gives genuine insight and a conversation starter.
**Done when:** The weekly ritual runs end-to-end with AI-generated scenarios and digest content.

---

## F5.1 — Weekly Check-in Form (Child)

**What:** The child's weekly touchpoint — logs their activity, mood, reflection, and completes a situational scenario.

**Includes:**
- Mood selector (4 emoji options)
- Activity log: what did the child do this week for their skill focus
- Reflection: one thing they learned or found interesting
- Situational scenario (pulled from F5.2)
- Encouragement on submit
- Week number tracked automatically

**Automated Tests:**
- Unit: Week number calculation from `createdAt` date
- Unit: Form validation (mood required, activity min 20 chars)
- Integration: `POST /api/child/checkin` saves all fields, links to correct week
- E2E: Child opens check-in → completes all fields → submits → sees confirmation

**Manual Test Scenarios:**
- [ ] Entire check-in completable in under 10 minutes
- [ ] Mood selector is expressive and fun
- [ ] Activity log prompt is open enough to capture anything
- [ ] Reflection prompt encourages thinking, not just recapping
- [ ] Completion confirmation is warm and celebratory

---

## F5.2 — Situational Scenario (AI Generated)

**What:** Each week, Claude generates a contextual scenario relevant to the child's skill focus and career path. The child's response reveals how they're growing.

**Includes:**
- BullMQ job: generates scenario for each active child at start of each week
- Claude prompt: `career cluster + current skill + child persona → real-world scenario question`
- Scenario stored in DB, linked to check-in
- Child's response stored alongside scenario
- Parent sees both scenario and response in digest

**Automated Tests:**
- Unit: Scenario generation prompt is correctly constructed
- Unit: Scenario output validation (question must be open-ended, under 100 words)
- Integration: Weekly scenario job runs and saves scenario to DB
- Integration: Child response saved linked to scenario

**Manual Test Scenarios:**
- [ ] Scenario for week 2 of "Nhà thiên văn học" is genuinely relevant
- [ ] Scenario is understandable by a 10-year-old without adult explanation
- [ ] Scenario feels like a fun challenge, not a test
- [ ] Different children with same career get appropriately varied scenarios

---

## F5.3 — Parent Weekly Digest

**What:** After the child submits their check-in, the parent sees a digest with stats, highlights, a conversation starter, and what to watch for next week.

**Includes:**
- Stats: streak, XP earned, skill progress delta
- Highlight of the week (AI-summarised from child's reflection)
- Scenario + child's response
- AI conversation starter for parent
- "What to prepare for next week" section
- Digest sent as in-app notification (push notification deferred to post-MVP)

**Automated Tests:**
- Unit: Digest generation prompt produces all required sections
- Integration: Digest is generated and saved after child check-in completes
- Integration: `GET /api/parent/child/:id/digest/latest` returns current week's digest
- E2E: Child submits check-in → parent refreshes → sees new digest

**Manual Test Scenarios:**
- [ ] Digest gives parent genuine insight they wouldn't have known otherwise
- [ ] AI highlight captures what is actually meaningful from child's response
- [ ] Conversation starter is something a parent could naturally say
- [ ] "What to prepare" section is practical and specific
- [ ] Digest is readable in under 3 minutes

---

## F5.4 — AI Nudge (Async Job)

**What:** Mid-week, an AI nudge is generated and surfaced in the child's dashboard — a short prompt, question, or mini-challenge related to their skill focus.

**Includes:**
- BullMQ cron job: runs Wednesday at 10:00 Vietnam time for all active children
- Claude prompt: `current skill + progress + persona → short encouraging nudge (max 50 words)`
- Nudge displayed as a card on child's home dashboard
- Nudge dismissed after child reads it (tap to dismiss)
- Parent sees the nudge in their view of the child's week

**Automated Tests:**
- Unit: Nudge prompt correctly uses current week's skill context
- Unit: Output validation (nudge must be under 50 words, must be a question or challenge)
- Integration: Cron job runs at correct time and saves nudge to DB
- Integration: Dismissed nudge is not re-shown

**Manual Test Scenarios:**
- [ ] Nudge card is visible and prominent on child dashboard mid-week
- [ ] Nudge feels like a friendly challenge from a coach, not a notification
- [ ] 5 consecutive nudges for same child are all meaningfully different
- [ ] Dismissing the nudge works — it doesn't reappear

---

---

# EPIC 6 — Milestones

**Goal:** When a child reaches their first skill milestone, they experience a special celebration. The parent is notified. Both feel the win.
**Done when:** The first milestone is detectable, the celebration screen displays, and the parent sees it in their digest.

---

## F6.1 — Milestone Detection

**What:** The system detects when a child has reached a skill milestone (first completion of a weekly skill, first completed month, etc.) and creates a `Milestone` record.

**Includes:**
- Milestone types for MVP: `FIRST_CHECKIN`, `SKILL_LEVEL_UP`, `WEEK_STREAK_7`, `FIRST_ROADMAP_MONTH`
- Detection runs after each check-in submission
- Each milestone type fires only once per child (idempotent)
- XP awarded on milestone
- `Milestone` record created with type, title, XP, and timestamp

**Automated Tests:**
- Unit: Detection logic correctly identifies each milestone type
- Unit: Idempotency check — same milestone not created twice
- Unit: XP calculation is correct per milestone type
- Integration: After check-in, if milestone condition met → Milestone record created
- Integration: Duplicate milestone detection prevents double-awarding

**Manual Test Scenarios:**
- [ ] Complete first check-in → `FIRST_CHECKIN` milestone fires immediately
- [ ] Complete 7 days in a row → `WEEK_STREAK_7` fires on day 7
- [ ] Milestone fires exactly once even if check-in is submitted twice
- [ ] XP is correctly added to child profile after milestone

---

## F6.2 — Milestone Celebration Screen (Child)

**What:** When a milestone is detected after check-in submission, the child is shown a special celebration screen before returning to their dashboard.

**Includes:**
- Full-screen celebration: gradient background, confetti animation (CSS), trophy/badge
- Milestone title and description
- XP gained display
- Badge unlocked (visual badge relevant to milestone type)
- "Tiếp tục hành trình!" CTA
- Celebration screen shown only once per milestone (redirect logic)

**Automated Tests:**
- Unit: Celebration screen renders correctly for each milestone type
- Integration: After check-in with milestone → API response includes `milestone` field
- E2E: Child submits check-in that triggers milestone → celebration screen shown → tap CTA → child home

**Manual Test Scenarios:**
- [ ] Celebration screen feels genuinely special and exciting for a 10-year-old
- [ ] Confetti animation plays without jank on mobile
- [ ] Badge image is relevant to the milestone (not generic)
- [ ] Celebration screen is not shown on subsequent check-ins without a new milestone
- [ ] The joy is immediate — no loading delay between submission and celebration

---

## F6.3 — Parent Milestone Notification

**What:** The parent sees that their child has reached a milestone — in their dashboard and in the weekly digest.

**Includes:**
- Parent home dashboard: milestone card appears with child name + milestone description
- Weekly digest: milestone section highlights what the child achieved
- AI-generated message: "Ba/Mẹ có thể nói với con: ..." — a specific affirmation for the parent to say
- Notification badge on parent dashboard tab bar
- Milestone history: parent can see all milestones the child has reached

**Automated Tests:**
- Unit: Parent milestone card renders correctly with all fields
- Integration: `GET /api/parent/child/:id/milestones` returns all milestones in order
- Integration: Notification badge count updates after new milestone
- E2E: Child earns milestone → parent refreshes dashboard → sees milestone card

**Manual Test Scenarios:**
- [ ] Parent notification makes them feel proud, not just informed
- [ ] AI affirmation message is something a parent would actually want to say
- [ ] Milestone card is visually distinct from regular content
- [ ] Milestone history shows all earned milestones in a readable timeline
- [ ] Notification badge disappears after parent views the milestone

---

---

# Testing Strategy Summary

## Automated Test Coverage Targets

| Epic | Unit | Integration | E2E |
|---|---|---|---|
| E1: Foundation | 100% of logic | All API routes | Health check + auth flow |
| E2: User Identity | 100% of routing logic | All profile APIs | Login → dashboard (parent + child) |
| E3: Persona Discovery | 100% of prompt builders + parsers | All discovery APIs + BullMQ jobs | Full discovery flow |
| E4: Career Journey | 100% of roadmap logic | All career APIs + BullMQ jobs | Dream → roadmap flow |
| E5: Weekly Ritual | 100% of cron + nudge logic | Check-in + digest APIs | Full check-in flow |
| E6: Milestones | 100% of detection logic | Milestone creation + notification | Milestone celebration flow |

## Claude API Testing Protocol

| Test Type | Claude API Behaviour |
|---|---|
| Unit tests | Fully mocked (no API calls) |
| Integration tests | Mock client returns fixtures from `tests/fixtures/claude/` |
| E2E tests | Real Claude API (with test API key, lower rate limit) |
| Manual testing | Real Claude API with production prompts |

## Manual Test Execution

Each epic has a **manual test session** before it is marked Done:
1. Developer self-tests all scenarios with real data
2. At least one Vietnamese-speaking adult tests the parent flows
3. If possible, one child aged 8–13 tests the child flows
4. Vietnamese copy reviewed by a native speaker for naturalness

## Regression Testing

After each epic, run the full E2E suite to ensure nothing is broken. Critical regression paths:
- Auth flow (Epic 1)
- Role routing (Epic 2)
- Persona synthesis (Epic 3 — the core)
- Roadmap integrity (Epic 4)

---

# Build Order Within Each Epic

Features within an epic follow this order to enable incremental testing:
1. **Database schema** changes first (Prisma migration)
2. **API routes** (with mocks for AI calls)
3. **BullMQ jobs** (AI integration)
4. **Frontend** (connects to live API)
5. **E2E tests** (full flow)
6. **Manual testing session**

This ensures every layer is independently testable before the next is built.
