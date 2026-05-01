# GrowPath — Product Vision

> Version 1.0 | 2026-05-01

---

## Vision Statement

Every child deserves to grow up knowing who they are, what they're capable of, and where they're headed — with their parents walking beside them, not ahead of them.

---

## Mission

GrowPath creates the shared space where Vietnamese parents and children discover the child's true persona together, build a meaningful growth journey, and celebrate every milestone along the way.

---

## The Problem

Vietnamese parents deeply want to support their children's futures. Children have energy, curiosity, and unspoken dreams. But between them sits a gap:

- **No discovery framework:** Families have no structured way to surface a child's strengths, passions, and dreams together
- **No shared language:** Parents hold their own hopes; children hold their own fears — they rarely align
- **No growth map:** Even when goals emerge, there's no system to nurture and evolve them over time
- **No reflection ritual:** Growth happens but isn't captured, celebrated, or built upon
- **Over-direction or disconnection:** Without a shared space, parents either impose their vision or stay disengaged

The result: children reach adulthood having never truly explored who they are or built intentional capability toward where they want to go.

---

## The Solution

GrowPath is a parent-child growth platform that:

1. **Surfaces the child's persona** through a dual-perspective discovery process — parent and child both contribute, AI synthesises the shared truth
2. **Builds an adaptable skill journey** anchored to the child's dream career and persona
3. **Creates a weekly ritual** of reflection, progress, and connection between parent and child
4. **Celebrates every milestone** — effort and growth, not just outcomes

---

## Target Users

### Primary: Vietnamese Families with Children Aged 8–13

**The Parent**
- Deeply invested in their child's future
- Carries lived experience and environmental awareness
- Wants to guide without over-directing
- Needs a framework to have meaningful conversations with their child about growth

**The Child (8–13)**
- Has dreams, curiosity, and energy but limited self-awareness
- Needs to feel ownership and agency over their own journey
- Responds to celebration, progress visibility, and low-pressure exploration
- Grows from participant to co-owner as they approach 16–18

### Secondary: Schools (Distribution Partners)
- Act as referral brokers — no data access
- Earn incentives per active family enrolled
- Benefit from a compelling parent engagement narrative

---

## Core Value Proposition

> "GrowPath helps you and your child discover who they truly are — together — and build the skills to get there."

For parents: *Finally understand what your child truly wants and how to help them grow toward it*

For children: *A journey that belongs to you — built on your dreams, your strengths, your pace*

---

## Product Pillars

### Pillar 1: Shared Persona Discovery
The heart of GrowPath. Parent and child each share their perspective on the child. AI synthesises both into a shared persona — the "shared realisation moment" that makes both say: *I see something I couldn't see before.*

The persona is built across 7 dimensions, discovered in this order:
1. Dreams & Aspirations
2. Interests & Passions
3. Strengths
4. Personality Traits
5. Growth Edges
6. Values
7. Learning Styles

The persona is never final. It evolves through quarterly inspect & adapt cycles as the child grows and conditions change.

### Pillar 2: Dream Career Journey
The child names a dream. Parents contribute their experience and context. AI expands it into 2–3 career cluster paths and generates a skill roadmap. The journey is structured across three time horizons:
- **Long-term vision** (1–3 years): anchored to the dream
- **Quarterly milestones**: specific, achievable growth markers
- **Weekly skill focus**: concrete actions the child picks themselves

### Pillar 3: Measurable Skill Growth
Skills — not tasks — are the unit of progress. Growth is measured through:
- **Evidence portfolio**: child uploads artifacts showing real-world capability
- **Dual assessment**: child and parent both rate skill confidence periodically
- **Situational scenarios**: AI-generated real-world situations that reveal how the child thinks and responds
- AI synthesises all three into a skill confidence curve over time

### Pillar 4: Reflection & Celebration
A lightweight weekly ritual keeps the journey alive:
- Child logs one activity + one reflection
- Parent receives a digest with progress and a conversation starter
- AI nudges mid-week with prompts and situational scenarios
- Milestone moments trigger special celebrations — effort is always recognised
- Monthly reviews show progress; quarterly reviews realign the journey

---

## User Experience Principles

**Child-first language:** The app speaks in the child's words, not clinical labels. "Loves figuring out how things work" not "analytical thinker."

**Age-graduated agency:** At 8, the parent leads. At 13, it's collaborative. At 16–18, the child owns it completely.

**Protection without exclusion:** The child never sees conflict or pressure. The parent sees the full picture. The AI holds both.

**Effort over outcome:** Celebrations are tied to trying, learning, and showing up — not just achieving.

**Always adaptable:** No journey is final. Conditions change. Dreams evolve. The inspect & adapt loop is built into every time horizon.

---

## Business Model

### Freemium B2C
| Tier | Features | Price |
|---|---|---|
| Free | Profile setup, basic persona discovery, 1 career direction, weekly check-in | Free forever |
| Premium | Full AI persona synthesis, 2–3 career clusters, skill roadmap, situational scenarios, milestone celebrations, monthly/quarterly reviews | Subscription (VND) |
| Trial | Full premium access for first child | 30 days |

### School Referral Channel
- Schools earn incentives per active family enrolled
- Zero data sharing — schools are distribution only
- Co-branded rollout ("Trường X cùng GrowPath đồng hành với con")

### Future Channels (post-MVP)
- Life coaches and child development practitioners (B2B2C)
- Corporate family benefit packages
- Regional expansion (SE Asia)

---

## Privacy Commitment

- **Minimal data collection:** DOB, OAuth, City, Persona only
- **PDPD compliant** (Vietnam Decree 13/2023/ND-CP)
- **Parental consent** required for all child accounts
- **No data to schools** or third parties — ever
- **Child data sovereignty:** The child's persona belongs to the child

---

## Technology Foundation

Built for millions of users from day one:

- **Vendor-agnostic:** Prisma ORM ensures database portability
- **Privacy-by-design:** Row-level security at the database layer
- **AI-native:** Claude API (Anthropic) powers all synthesis, generation, and personalisation
- **Observable:** OpenTelemetry instrumentation from day one
- **Cloud:** AWS (primary), GCP (secondary)
- **Platform:** Responsive web first → React Native mobile

---

## Launch Market

**Vietnam — Ho Chi Minh City and Hanoi first**

Vietnamese families have among the strongest cultural orientation toward structured child development in the world. The school referral network provides a credible, trusted distribution channel from day one.

- Primary language: Vietnamese
- Secondary: English (post-MVP)
- Payment: MoMo, ZaloPay, VNPay, international cards

---

## MVP Success Criteria

The MVP succeeds if families complete the persona discovery flow and the child says: *"That's me."*

| Metric | Target |
|---|---|
| Persona completion rate | > 70% of families who start |
| Revelation rating | > 80% rate persona as "felt true" |
| Week 2 retention | > 50% complete a second check-in |
| Premium conversion | > 15% within 30-day trial |

---

## Roadmap at a Glance

| Phase | Focus | Timeframe |
|---|---|---|
| **MVP** | Persona discovery, dream journey, weekly ritual, first milestone | Weeks 1–12 |
| **V1** | Full registration, invite flows, situational scenarios, portfolio | Months 4–6 |
| **V2** | Mobile app (React Native), payment integration, school dashboard | Months 7–9 |
| **V3** | English language, regional expansion (Singapore, Thailand), coach channel | Months 10–12 |
