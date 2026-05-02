# GrowPath MVP — Product Requirements Document

> Version 1.1 | 2026-05-01
> Scope: 12-week solo build | Launch market: Vietnam (HCMC + Hanoi)

---

## Problem Statement

Vietnamese parents are deeply invested in their children's futures but lack a structured way to surface a child's true strengths, passions, and dreams together with the child — and no system exists to translate that shared understanding into a living growth journey. Without a shared discovery framework, parents either over-direct (imposing their own vision) or disengage, while children reach adolescence without having consciously explored who they are or built intentional capability toward what they want. The cost of not solving this is a generation of children whose career paths are shaped by cultural defaults rather than personal identity — and parents who missed the window to be meaningful partners in that journey.

---

## Goals

1. **Deliver the revelation moment:** At least 80% of families who complete persona discovery rate the synthesised persona as "felt true" — the product's core proof of value.
2. **Complete the discovery flow:** At least 70% of families who start persona discovery complete all 7 dimensions and see the shared persona.
3. **Establish the weekly ritual:** At least 50% of families who complete persona discovery submit a second weekly check-in (week 2 retention).
4. **Validate premium value:** At least 15% of families convert from free trial to paid subscription within 30 days.
5. **Prove the loop:** Families who complete a milestone celebration have measurably higher week-4 retention than those who do not.

---

## Non-Goals

The following are explicitly out of scope for the MVP and will not be built:

- **Full registration and invite flows** — sample profiles are used to de-risk auth complexity and accelerate to the core experience. Real registration ships in V1.
- **Situational scenario engine** — the AI-generated real-world scenarios that reveal child thinking require a separate AI pipeline; deferred to V1.
- **Evidence portfolio uploads** — file storage, CDN, and artifact management are infrastructure-heavy; deferred to V1.
- **Quarterly persona realignment** — the inspect & adapt cycle requires at least one quarter of user history; will not trigger in a 12-week MVP window.
- **School referral dashboard** — the broker channel requires its own authenticated surface; the school channel is distribution-only in MVP (no digital touchpoint for schools).
- **Payment and subscription management** — billing integration (MoMo, ZaloPay, VNPay) deferred to V2; the 30-day trial is time-gated in code, not payment-gated.
- **Mobile app (React Native)** — responsive web is the MVP platform; native app is a V2 deliverable.
- **English language toggle** — Vietnamese is the only supported language in MVP.

---

## User Stories

### Parent

- As a Vietnamese parent, I want to input my observations about my child's dreams, strengths, interests, and personality so that the AI has my perspective to work with alongside my child's.
- As a parent, I want to see where my child's self-perception differs from mine — privately — so that I understand the gap without creating conflict with my child.
- As a parent, I want the AI to help me initiate a conversation that moves my child's perspective and mine toward alignment so that we can reach a shared understanding without me imposing my view.
- As a parent, I want to review and refine the AI-generated career cluster paths and skill roadmap before my child sees them so that I can apply my real-world experience and context.
- As a parent, I want to receive a weekly digest of my child's check-in activity and a suggested conversation starter so that I can engage with my child's growth without needing to interrogate them.
- As a parent, I want to celebrate my child's first milestone together so that growth feels meaningful and recognised, not just tracked.

### Child (age 8–13)

- As a child, I want to know that my raw answers are private and only a summary reaches my parents so that I feel safe being honest about my real dreams.
- As a child, I want to answer questions about my dreams and what I love in a way that feels like exploring rather than a test so that I can express myself honestly without pressure.
- As a child, I want to review my synthesised persona before my parents see it so that I feel in control of how I am represented.
- As a child, I want to see a persona description that reflects who I truly am — in language I understand — so that I feel seen and excited about my journey.
- As a child, I want to name a dream career and see it expanded into real paths I could take so that my dream feels achievable rather than fantasy.
- As a child, I want to pick my own skill focus each week so that the journey feels like mine and not something imposed on me.
- As a child, I want to log one activity and one reflection each week in under 10 minutes so that the ritual fits into my life without becoming a chore.
- As a child, I want to be celebrated when I reach a milestone so that effort and progress feel worth showing up for.

### Both (shared moments)

- As a family, we want to see the shared persona revealed together so that we have a moment of genuine mutual discovery.
- As a family, we want the journey to visually show how far we've come over time so that growth feels real and cumulative.

---

## Requirements

### Must-Have — P0

These are the minimum requirements. The MVP does not ship without them.

**1. Tailored UX shells for parent and child — with explicit philosophy onboarding**
- Parent and child have separate, role-appropriate interfaces from first login
- Child UX uses child-first language, bright visuals, and low-pressure framing
- Parent UX surfaces the delta view, full persona data, and coaching affordances
- **Parent's first session includes a philosophy screen** that explicitly states GrowPath's operating rules before any input is collected — including the child's view rule. This is informed opt-in, not a hidden policy.
  - Rule stated plainly: when parent and child disagree, the child's perspective is tried first for a trial period, then reviewed together. Parent always sees the full picture including the delta.
  - Parent taps "Tôi hiểu và đồng ý" to proceed. `philosophyAcknowledgedAt` is set.
  - The rule is a **product differentiator stated as a promise**, not a warning: *"Đây là cách chúng tôi giúp con mở lòng hơn với Ba/Mẹ."*
- Acceptance criteria:
  - [ ] Philosophy screen is the first thing a parent sees on first login — not skippable
  - [ ] Philosophy screen explicitly states the child's view rule in plain Vietnamese
  - [ ] Parent acknowledgement is recorded (`philosophyAcknowledgedAt`)
  - [ ] A parent session and a child session within the same family see different interfaces
  - [ ] Child never sees the parent's conflict view or delta data
  - [ ] Parent can see both their own input and the child's input, plus the synthesised persona

**2. Persona discovery — parent input form**
- Parent answers structured questions across all 7 persona dimensions in discovery order: Dreams & Aspirations → Interests & Passions → Strengths → Personality Traits → Growth Edges → Values → Learning Styles
- Parent can save progress and resume across sessions
- Acceptance criteria:
  - [ ] All 7 dimensions are present and completable
  - [ ] Progress is persisted if the parent closes the browser mid-flow
  - [ ] Parent can edit any dimension before submitting for synthesis

**3. Persona discovery — child input form (with honesty mechanisms)**
- Child answers the same 7 dimensions in an age-appropriate, exploratory interface designed to maximise honest self-expression
- Four honesty mechanisms are required — not optional:

  **3a. Visible privacy architecture:** Before question 1, the child sees a simple diagram: "Con viết ở đây → AI đọc → Ba/Mẹ chỉ thấy bản tóm tắt này." Raw answers are never accessible to the parent. This must be visible and understandable without adult explanation.

  **3b. Exploration framing:** Questions use exploration language, not declaration language. "Nếu không ai biết và không ai phán xét, con muốn thử công việc gì nhất?" not "Con muốn làm gì khi lớn lên?" Each question opens with an explicit no-wrong-answer statement.

  **3c. AI as advocate:** Intro copy frames the AI as the child's translator to the parent: "AI sẽ giúp con giải thích cho Ba/Mẹ hiểu con theo cách con muốn được hiểu."

  **3d. Child confirmation gate:** After synthesis, the child reviews the persona before the parent can access it. The child can flag a dimension for light re-synthesis. Parent API returns 403 until `childConfirmedAt` is set.

- Acceptance criteria:
  - [ ] Privacy diagram is the first screen, is not skippable, and is readable by a 10-year-old
  - [ ] All questions use exploration framing (no declaration-style questions)
  - [ ] Child can complete the flow without adult help
  - [ ] Child confirmation step blocks parent access until confirmed
  - [ ] Child can request a re-synthesis on one flagged dimension
  - [ ] `childConfirmedAt` timestamp is set on confirmation and checked by parent persona API

**4. AI persona synthesis (Claude Sonnet)**
- When both parent and child have submitted, Claude synthesises them into a shared persona
- The AI is prompted as the child's advocate, not a neutral arbitrator
- Synthesis produces: a persona summary, per-dimension synthesis, and the delta
- Delta is accessible to the parent only; includes "possibly understated" flags where child input appears performed
- Acceptance criteria:
  - [ ] Synthesis triggers after both inputs are complete
  - [ ] Synthesised persona is written in Vietnamese, using child-first language
  - [ ] Delta view is rendered only in the parent interface
  - [ ] Synthesis completes asynchronously via BullMQ; loading state shown while running
  - [ ] If synthesis fails, the family is notified and can retry
  - [ ] Delta includes "possibly understated" flag when child input appears over-aligned with typical parental expectations

**5. Shared persona reveal**
- Child sees and confirms the persona first; parent sees it after child confirms
- The reveal is designed as a meaningful experience — not a data dump
- Acceptance criteria:
  - [ ] Child confirmation screen exists before parent access is enabled
  - [ ] The shared view shows only the synthesised persona, never the delta
  - [ ] Parent sees a "Đang chờ con xem" waiting state until child confirms
  - [ ] Parent can access the full delta view separately at any time after confirmation

**6. Dream → career cluster → skill roadmap (Claude Sonnet)**
- Child names a dream career; parent adds environmental context
- Claude generates 2–3 related career cluster paths and a skill roadmap per path
- Parent reviews and can request one refinement round
- Roadmap displayed with long-term vision, quarterly milestones, and weekly skill suggestions
- Acceptance criteria:
  - [ ] Child input for dream career is free-text with optional suggestions
  - [ ] Parent context input is a structured form
  - [ ] Claude generates exactly 2–3 career clusters, each with a named path and skill roadmap
  - [ ] Parent can request one re-generation with additional guidance
  - [ ] Roadmap is readable by both parent and child in their respective UX shells

**7. Weekly skill focus — child selection**
- Child picks one skill to focus on for the current week from the roadmap
- Acceptance criteria:
  - [ ] Child sees their current roadmap and can select a skill as this week's focus
  - [ ] Selected skill is persisted and displayed in the child's weekly check-in flow

**8. Weekly check-in — child**
- Child logs one activity and one reflection per week in under 10 minutes
- Acceptance criteria:
  - [ ] Check-in form is accessible from the child home screen each week
  - [ ] Form captures: activity description (free-text), reflection (guided prompt), optional mood indicator
  - [ ] Submission is confirmed with a small celebration moment
  - [ ] Completed check-ins are stored and retrievable for parent digest and monthly review

**9. Weekly digest — parent**
- Parent receives a digest after the child's weekly check-in
- Digest includes: child's activity log, reflection, progress snapshot, and a suggested conversation starter generated by Claude Haiku
- Acceptance criteria:
  - [ ] Digest is generated within 24 hours of the child submitting their check-in
  - [ ] Conversation starter is contextually relevant to the child's reflection (not generic)
  - [ ] Parent can access all past digests from their dashboard

**10. First milestone celebration**
- When the child completes their first weekly check-in, a milestone is triggered
- Celebration is a meaningful, effort-focused in-app moment
- Acceptance criteria:
  - [ ] Milestone celebration triggers on first completed check-in submission
  - [ ] Celebration is visible to both child and parent in their respective interfaces
  - [ ] Celebration language emphasises effort and showing up, not outcome

**11. Sample profiles (registration deferred)**
- MVP uses pre-seeded sample parent and child profiles
- Real OAuth registration is built but not user-facing in MVP
- Acceptance criteria:
  - [ ] Sample profiles exist for at least one parent + child family pair
  - [ ] Tester can log in as parent or child using sample credentials
  - [ ] Auth infrastructure (NextAuth.js v5) is wired and functional for V1 activation

---

### Nice-to-Have — P1

- **Progress visualisation timeline:** Visual representation of the child's journey — skills worked on, check-ins, milestones. Helps both parent and child see momentum.
- **AI conflict facilitation dialogue:** When the delta is large, Claude generates a guided dialogue script for the parent. Requires more prompt engineering and testing.
- **Mid-week AI nudges:** Claude Haiku generates a short mid-week prompt for the child. Increases engagement between check-ins.
- **Persona versioning UI:** Exposes how the persona has changed over time; adds depth to quarterly reviews.
- **Onboarding walkthrough:** Guided first-time experience for parents explaining the GrowPath philosophy before they start inputting data.

---

### Future Considerations — P2

Design must not foreclose these:

- **Situational scenario engine:** Requires a separate async pipeline and session design. Design check-in data model to accommodate scenario responses from day one.
- **Evidence portfolio:** Requires file storage (S3) and CDN. Design the skill model with an `evidence` relation from day one.
- **Quarterly inspect & adapt:** Requires persona versioning model in place (it is). Persona accuracy improves over time as trust builds — instrument for this.
- **School referral dashboard:** Separate auth context from the family app.
- **Payment and billing:** 30-day trial gate is in code; payment activation is a configuration change when billing is ready.
- **React Native mobile app:** Use responsive design from day one. No web-only APIs.

---

## Success Metrics

### Leading Indicators (days 1–30 post-launch)

| Metric | Target | Measurement |
|---|---|---|
| Persona discovery start rate | > 85% of families who log in | Event: `persona_discovery_started` |
| Persona discovery completion rate | > 70% of families who start | Event: `persona_synthesis_completed` |
| Child confirmation rate | > 90% of children who see synthesis | Event: `persona_child_confirmed` |
| Revelation rating — child | > 80% rate persona as "felt true" | Post-reveal 1-question survey (in-app) |
| Revelation rating — parent | > 80% rate persona as "felt true" | Post-reveal 1-question survey (in-app) |
| Dream career input completion | > 90% of families with a completed persona | Event: `career_dream_submitted` |
| Skill roadmap generation | > 85% of families who submitted a dream | Event: `roadmap_generated` |
| Week 1 check-in completion | > 60% of families with a roadmap | Event: `checkin_submitted` |

### Lagging Indicators (30–90 days post-launch)

| Metric | Target | Measurement |
|---|---|---|
| Week 2 check-in retention | > 50% | % of families with ≥ 2 check-ins |
| Week 4 check-in retention | > 35% | % of families with ≥ 4 check-ins |
| Premium conversion (30-day trial) | > 15% | % converting before trial expiry |
| Parent digest open rate | > 70% | In-app digest view event |
| Persona amendment rate | < 20% | % of children who flag a dimension for re-synthesis — a high rate signals the synthesis is not landing |

---

## Open Questions

**Engineering**

- [ ] **[Engineering] Vietnamese AI quality gate result:** Run QG.1 test cases before week 5. Score must average ≥ 4.0 on the five-dimension rubric before Epic 3 code starts. If not met, activate QG.3 fallback plan before proceeding.
- [ ] **[Engineering] Synthesis latency:** What is the p95 latency for Claude Sonnet synthesis + Haiku self-evaluation combined? Is BullMQ + Redis sufficient, or do we need streaming?
- [ ] **[Engineering] Partial re-synthesis scope:** When a child flags one dimension for correction, does the re-synthesis job re-run only that dimension or the full persona? Full re-synthesis risks changing dimensions the child already confirmed. Determine before building F3.4.
- [ ] **[Engineering] Sample profile strategy:** Hard-coded seed data (fastest) or configurable admin screen (more flexible for user testing)? Decision affects week 3–4 scope.

**Product / Design**

- [ ] **[Design] Child reveal UX:** What does the confirmation step look and feel like? Prototype and test with a real child before building — this is the product's most important moment.
- [ ] **[Product] Conflict delta threshold:** At what magnitude of divergence should the AI flag the delta as significant? Define this threshold to guide prompt engineering.
- [ ] **[Product] "Possibly understated" flag:** How is this presented to the parent without planting suspicion or undermining the child? Needs careful copy and UX design.
- [ ] **[Product] Honesty mechanism effectiveness:** How will we know if exploration framing actually produced more honest answers than declaration framing? Define a measurement approach before launch (e.g., a/b test copy variants with 2 cohorts of test families).

**Legal / Compliance**

- [ ] **[Legal] PDPD parental consent in sample profile MVP:** If real users test with sample profiles, is a parental consent flow required even though no real child PII is collected? Clarify before user testing (week 11).
- [ ] **[Legal] AI disclosure requirement:** Is there a legal or ethical obligation to disclose that the persona is AI-generated? Determine before the reveal screen is finalised.

---

## Timeline Considerations

### Build Phasing

| Weeks | Deliverable | Dependency |
|---|---|---|
| 1–2 | Infrastructure foundation (Docker, Next.js, Prisma, NextAuth.js) | None |
| 3–4 | Parent + child UX shells with sample profiles | Infrastructure complete |
| End of wk 4 | **Vietnamese AI quality gate (QG.1–QG.3)** — Claude output validated before Epic 3 starts | Claude API access |
| 5–7 | Persona discovery forms + Claude synthesis + reveal (with honesty mechanisms) | Quality gate passed |
| 8–9 | Dream → career cluster → skill roadmap | Persona synthesis complete |
| 10–11 | Weekly check-in + parent digest + first milestone celebration | Roadmap complete |
| 12 | Polish, observability, Vietnamese copy review, user testing | All features shippable |

### Critical Path

**Vietnamese AI quality → Real family revelation test → Reveal-first Epic 3 build → Full forms → Retention loop.**

Two principles govern the sequence:

1. **Risk before completeness.** The riskiest assumption (revelation moment lands with a real family) is tested at end of week 4 with a static mockup — before any Epic 3 application code is written.

2. **Reveal-first within Epic 3.** Build synthesis → child reveal → parent view first, using minimal hardcoded inputs. Test with a real family. Only then build the full 7-dimension input forms. This ensures the most critical screen is validated before the input surface is built around it.

If the quality gate is not met by end of week 4, activate the QG.3 fallback before starting Epic 3. Do not proceed without a positive revelation signal.

### Dependencies

- Claude API access confirmed before end of week 4 (quality gate requires real API calls)
- Native Vietnamese speaker (HCMC) available for QG.1 evaluation by end of week 4
- Gold-standard few-shot persona examples written before F3.3 prompt build starts
- Real user testing families (minimum 3 families) recruited by week 10
- Legal clarity on PDPD consent for sample profile testing by week 10

---

*GrowPath MVP PRD v1.1 — Solo Founder + Claude Code | Vietnam Launch | May 2026*
