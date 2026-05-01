# GrowPath — Pre-Mortem Report

> Generated after Proving Ground interrogation | 2026-05-01
> Audience: Founder. Read this before starting each epic.

---

## The Question This Document Answers

It is 2027. GrowPath failed. What killed it?

---

## Fatal Flaw 1 — The Revelation Moment Never Landed

**The failure scenario:**

Claude's Vietnamese output is grammatically correct but emotionally flat. Parents read the persona and say "yes, that sounds like my child" — but feel nothing surprising. Children read it and say "okay" — not "that's me." The 80% revelation rating target is not met. Families complete the discovery flow but do not feel the shift that was supposed to anchor everything downstream. The career roadmap is built on a persona nobody believes in. The weekly ritual has no emotional foundation. Retention collapses by week 3.

This failure is invisible until week 11 if the quality gate is skipped or passed superficially with a developer-written evaluation instead of a real family test.

**Why it happens:**

- Prompt engineering is done by a developer, not validated by native Vietnamese speakers from the launch cities
- The few-shot examples in the prompt are written in formal Vietnamese, not the warm Southern Vietnamese register required
- The child self-censors their inputs (Q1) and the synthesis has nothing authentic to work with
- The reveal UX is a data display, not a designed emotional moment

**The signal that proves this wrong:**

> At end of week 4, one real Vietnamese family (parent + child, HCMC) reads the Case B persona output from a static mockup. The child says an unprompted variant of "đúng là con rồi" or "sao biết con vậy?" The parent expresses surprise at at least one dimension they had not previously articulated. Both rate the output ≥ 4 on emotional resonance without being asked to use a rubric.

If this signal is not seen by end of week 4, Epic 3 does not start. Diagnosis happens first.

---

## Fatal Flaw 2 — The Weekly Ritual Never Became a Ritual

**The failure scenario:**

The product delivers an outstanding first experience — revelation moment, career roadmap, first milestone celebration. Families are excited. Then week 2 arrives. The child has a busy school week. The check-in takes 12 minutes, not 10. The parent reads the digest but the conversation starter feels generic. Nobody says it at dinner. Week 3, the child skips the check-in. Week 4, the parent checks the app and sees nothing new. The 30-day trial expires. The family does not convert — not because the product failed, but because it never became part of their week.

This is the classic consumer product retention cliff: strong onboarding, weak habit formation.

**Why it happens:**

- Check-in UX takes longer than 10 minutes for a first-time child — no time budget testing done with real children
- Digest conversation starters are generated from only the current week's check-in — no accumulation, no personalisation over time — and parents find them too generic to actually say
- No designed mid-week engagement that reminds the family the journey is alive
- The progress visualisation that would make accumulated effort visible is P1, deferred — so the parent cannot see the momentum they are building
- No explicit conversion trigger at day 25 — the trial expires cold

**The signal that proves this wrong:**

> By the end of the first real user testing week (week 12), at least 2 of 3 test families submit a second check-in without being reminded. At least one parent reports using a digest conversation starter with their child unprompted. Week-2 retention in user testing is ≥ 50%.

If week-2 retention in user testing is below 50%, the ritual design — not the AI quality — is the problem. Diagnose the dropout point before launching.

---

## Fatal Flaw 3 — Parents Disengaged Silently When the Journey Didn't Match Their Vision

**The failure scenario:**

The conflict resolution model and the child's view rule work as designed — technically. The philosophy screen is shown, parents acknowledge it, the child's perspective wins the first trial period. But in practice, a meaningful portion of Vietnamese parents in the 8–13 demographic do not internalise the rule as a philosophy. They read the screen, tap "Tôi hiểu," and then experience cognitive dissonance when the skill roadmap is built around their child's "YouTuber" dream rather than the science career they believe is more suitable.

They do not complain. They do not churn immediately. They stop engaging: the weekly digest goes unread, the conversation starters go unused, the parent stops checking the app. The child, sensing disengagement, stops submitting check-ins. The product records them as retained users — they have not cancelled — but the family is functionally dead.

This failure is undetectable with standard retention metrics because the family does not cancel. It shows as low digest open rates and low check-in submission rates, which look identical to disengagement from poor AI quality or a busy week.

**Why it happens:**

- The philosophy screen communicates the rule but does not help parents emotionally accept it
- There is no designed follow-up mechanism that shows parents the child's view is producing real results — evidence that would convert acceptance into belief
- The delta view shows divergence but does not show the parent why their child's perspective might be valuable on its own terms
- No exit survey or mid-journey survey captures the silent disengagement reason

**The signal that proves this wrong:**

> In user testing, parents with a large delta (Case B scenario — parent expects science, child dreams of YouTube) complete at least 4 consecutive weekly check-ins and report in a mid-journey check-in survey that they feel their input is valued and that they understand why the child's view was prioritised. The philosophy screen specifically: parents can explain the child's view rule in their own words when asked 2 weeks after acknowledging it.

If parents cannot explain the rule 2 weeks later, the screen informed them but did not convince them. Redesign the framing before launch.

---

## What to Do With This Document

Read it at the start of every epic. Ask: "Does anything I am building this week reduce the probability of these three failures?"

- **Before Epic 3:** Is the quality gate real (native speaker, real family, honest scoring)?
- **Before Epic 5:** Is there a specific mechanism that makes the weekly ritual feel effortless and rewarding — not just functional?
- **Before launch:** Have you tested the philosophy screen with 3 parents who have a large delta? Can they explain the rule? Do they feel respected?

The three signals above are your pre-launch checklist. If all three are green, the product has earned the right to launch.

---

## Resolved Risks (addressed during interrogation)

These were identified as risks but have been designed into the product:

| Risk | Resolution |
|---|---|
| Child self-censorship | Privacy architecture visual, exploration framing, AI as advocate, child confirmation gate (PRD Req 3, MVP F3.2) |
| Child's view rule causing parent abandonment | Philosophy onboarding screen with explicit informed opt-in before any input (MVP F2.1) |
| Synthesis build order delays revelation validation | Reveal-first Epic 3 build order: F3.3 → F3.4 → F3.5 → validate → forms (MVP Epic overview) |
| Vietnamese AI quality discovered late | Quality gate at end of week 4 with real family test before Epic 3 code starts (MVP E2.5) |
| No conversion trigger at day 31 | Flagged — not yet designed. Must be addressed before Epic 5. |

---

*GrowPath Pre-Mortem | Proving Ground session 2026-05-01*
