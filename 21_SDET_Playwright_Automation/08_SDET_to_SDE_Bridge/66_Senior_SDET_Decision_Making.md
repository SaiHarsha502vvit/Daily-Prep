# 66. Senior SDET Decision-Making — Deriving the Reasoning, Not Just the Labels

**Navigation**: [← Chapter 65: Chaos Engineering](../06_CI_CD_And_Reliability/65_Chaos_Engineering_For_Playwright.md) | [Index](../00_INDEX.md) | [→ Chapter 67: Payment Gateway Testing](../03_Real_World_Scenarios/67_Payment_Gateway_Testing.md)

**Cross-links:**

- [`career/READINESS_RUBRIC.md`](../career/READINESS_RUBRIC.md) — labels the Junior→Principal bands; this chapter derives the reasoning that moves you between them
- [`career/mock_interviews/ladder_system.md`](../career/mock_interviews/ladder_system.md) — models senior thinking in dialogue; this chapter derives the same thinking as an explicit method
- [`career/RFC_TEMPLATE.md`](../career/RFC_TEMPLATE.md) — §4 below walks its real filled example section by section
- [`framework/docs/adrs/`](../framework/docs/adrs/README.md) — §3 below walks ADR-002 as a full worked case study
- [`01_Foundations/00_SDET_Foundations_Mindset.md`](../01_Foundations/00_SDET_Foundations_Mindset.md) — the Testing Pyramid and the 300-test classification exercise §1–2 formalize
- [`06_CI_CD_And_Reliability/62_Enterprise_Test_Operations.md`](../06_CI_CD_And_Reliability/62_Enterprise_Test_Operations.md) §3.2–3.3 — the compounding-probability and error-budget math §1 reuses directly

## Why this chapter exists

Every other chapter in this module derives a *technical* mechanism: how a fixture resolves, how a heap keeps its invariant, how a shrink search converges. [`career/READINESS_RUBRIC.md`](../career/READINESS_RUBRIC.md) labels a *different* kind of progression — Junior, Mid, Senior, Staff, Principal — and [`career/mock_interviews/`](../career/mock_interviews/ladder_system.md) shows what that progression *sounds like* in a real conversation. Neither one derives the reasoning itself, the way this module derives everything else. This chapter does that, using only material that already exists elsewhere in this module — the real Testing Pyramid exercise, the real error-budget math, a real ADR, a real filled RFC — because senior judgment is not a separate body of knowledge from the technical content; it's what you get when you apply the same "trace it to the mechanism" discipline to *decisions* instead of to code.

---

## 5W1H

- **WHAT**: Four decision patterns that separate mid-level from senior: prioritizing risk when you can't fix everything, deciding *not* to automate something, justifying infrastructure investment with real numbers, and writing a proposal that earns buy-in instead of just describing an idea.
- **WHY**: A mid-level engineer can execute a well-specified task correctly. A senior engineer is trusted to decide *which* task, *whether* to automate it, and *how* to convince a skeptical stakeholder it's worth the cost — and that trust is earned by showing your reasoning, not by seniority itself.
- **WHO**: Anyone at the Mid→Senior or Senior→Staff transition on [`career/READINESS_RUBRIC.md`](../career/READINESS_RUBRIC.md) — the technical competencies (1–9) are usually already there by this point; competencies 10–12 (Leadership, Cost Governance, AI-Assisted Testing judgment) are what this chapter targets.
- **WHEN**: Whenever a decision has more than one defensible answer and real cost on both sides — which is most decisions above the "how do I write this test" level.
- **WHERE**: In the artifacts a senior engineer actually produces: a prioritized backlog, a "we're not automating this" comment with a reason attached, an ADR, an RFC.
- **HOW**: By deriving each decision from data that already exists in this module, the same way every technical chapter derives a mechanism from a real API instead of asserting a rule.

---

## 1. Risk-Based Prioritization — Deciding What Gets Attention First

[`01_Foundations/00_SDET_Foundations_Mindset.md`](../01_Foundations/00_SDET_Foundations_Mindset.md) already contains the seed of this, inside its 300-test classification exercise: *"Which 20 UI tests, if broken, would cause a production incident? Automate those first. Don't automate low-risk admin screens that change monthly."* That's a real risk heuristic — but it's stated once, for one scenario, and left there. Formalized, it's two independent axes, and the mistake mid-level engineers make is collapsing them into one:

```
                    LOW BLAST RADIUS         HIGH BLAST RADIUS
                    (few users, low $)       (checkout, auth, payments)
CHANGES OFTEN       Quadrant 3               Quadrant 1
(new code weekly)   Low priority             FIX FIRST — new code + high
                    despite frequent breaks  stakes is where incidents come from

CHANGES RARELY      Quadrant 4               Quadrant 2
(stable for months) Lowest priority —        Fix soon, but a stable area breaking
                    stable AND low-stakes    is a signal something else changed
                    is genuinely fine to     underneath it (a dependency, an
                    leave flaky a while      infra change) — investigate, don't
                                             just patch
```

The reason this is two axes and not one "how bad is it" score: a Quadrant 1 failure (checkout, changing weekly) and a Quadrant 2 failure (checkout, stable for six months, suddenly breaking) have the *same* blast radius but demand *different responses*. Quadrant 1 is expected friction from active development — fix the test. Quadrant 2 is a stable system suddenly moving — that's usually not the test's fault, and treating it as "just flaky" is how a real regression gets waved through.

**Making it quantitative, using [Ch62 §3.3](../06_CI_CD_And_Reliability/62_Enterprise_Test_Operations.md)'s error-budget math directly:** the flake SLA's day-11 escalation is a *flat* clock — every quarantined test gets the same 10 days regardless of quadrant. A senior engineer's improvement isn't a new tool, it's noticing the clock should be quadrant-aware: a Quadrant 1 checkout test burning error budget at a high rate (§3.3's burn-rate math) escalates immediately, the same way that section already argued a high burn rate should override the flat day-11 trigger. A Quadrant 4 admin-screen test can sit in quarantine the full 10 days without anyone's attention being misallocated. **The prioritization rule and the escalation rule are the same math, applied to a different axis** — that's the kind of connection a senior engineer is expected to make explicit instead of maintaining two unrelated policies that happen to both be about test health.

---

## 2. When *Not* to Automate — Making the Pyramid's Economics Rigorous

[`01_Foundations/00_SDET_Foundations_Mindset.md`](../01_Foundations/00_SDET_Foundations_Mindset.md)'s Reality Check already states the conclusion: *"Some tests are inherently manual: visual aesthetics, user experience intuitiveness, accessibility with real assistive technology, and exploratory testing for undiscovered scenarios."* A mid-level engineer can quote that sentence. A senior engineer can derive it for a *specific* test case someone is asking them to automate today, under time pressure, without the answer being "it depends" — which is where a rigorous heuristic earns its cost over a memorized rule.

**The heuristic, derived from the same economics the Testing Pyramid exercise already uses:**

```
Automate when:   (times_run_per_period × cost_per_manual_run)  >  build_cost + (maintenance_cost × periods)

Don't automate when either:
  (a) the check requires human judgment no assertion can encode
      (does this look right? is this copy tone-appropriate? — no locator or
      assertion answers these; this is the "inherently manual" category)
  (b) the break-even point is further out than the feature's expected lifetime
      (a promotional banner shipping for one week doesn't clear build_cost
      before it's deleted, regardless of how easy it would be to automate)
```

Case (a) is a *hard* no — no amount of frequency changes it, because the thing being checked isn't expressible as a boolean. Case (b) is a *soft* no — it's purely arithmetic, and the same feature automated a year later (once it's proven durable) can clear the same bar easily. Conflating the two is the actual mid-level mistake: treating every "not automating this" decision as if it's a permanent judgment about the feature, when most of them are really a statement about *this feature's current lifetime estimate*, which changes.

**Applying it to a real number already in this module:** [`career/RFC_TEMPLATE.md`](../career/RFC_TEMPLATE.md)'s filled example states Puppeteer E2E flakiness costs "~120 engineer-hours per week" in reruns across 42 suites — roughly 2.9 hours/suite/week already being *spent*, before any new automation is even proposed. That number is exactly `cost_per_manual_run × times_run_per_period` for the *existing* suites' toil cost, which is precisely why the RFC's motivation section leads with it: it's the left side of the inequality above, made concrete enough that a stakeholder doesn't have to trust a vibe.

---

## 3. Cost/Benefit Reasoning for Infrastructure Investment — Walking a Real ADR

Ch62 already argues, informally, that suite health needs funding metrics. [ADR-002](../framework/docs/adrs/ADR-002-sqlite-trend-store.md) — a real decision in this framework's own history — shows what that reasoning looks like when someone actually had to make the call: *how should flake-analytics history be stored?*

**The shape of the reasoning, extracted from the real document:**

1. **Name the actual workload first, not the abstract problem.** ADR-002 doesn't ask "what's the best database?" — it states the workload precisely: *"single writer per run... a few thousand rows per week, read by one weekly report."* That sentence alone eliminates two of the four options considered before any comparison table is needed — a hosted vendor and a full Postgres service are both solving for concurrent multi-writer scale this workload doesn't have.
2. **List real alternatives with real rejection reasons, not a strawman.** All four options in ADR-002 are options a reasonable engineer would actually consider (vendor dashboard, Postgres, SQLite, flat JSON) — none are there just to be knocked down. The rejection reasons are specific costs (*"data leaves the org," "a dependency heavier than the problem," "no indexes; concurrent appends corrupt"*), not "it's not as good."
3. **State the negative consequences of the chosen option too.** ADR-002's own "Negative" section admits single-writer limitations and no live UI — a senior engineer's proposal names its own weaknesses before a reviewer has to find them, which is what makes the positive claims credible.
4. **Give the future reader an exit ramp.** The last risk row — *"Team outgrows CLI reports → migrating to Postgres is a pg_dump-shaped problem, not a rewrite"* — is the difference between a decision and a trap. It's fine to pick the smaller tool now, as long as outgrowing it later is cheap, and saying so explicitly is part of the decision, not an afterthought.

**Why this is an ADR and not an RFC**, a distinction this module's own artifacts embody but never state: an ADR is written **after** a decision, tersely, for a future engineer asking "why is it built this way?" — it has no Stakeholders field, no Reviewers, no Rollout Plan, because nobody needs to be *convinced*; the decision already happened. An RFC is written **before** the work, to *get* that agreement — which is exactly why, as §4 derives next, its structure is built entirely around persuasion: stakeholders, alternatives, a rollout plan, success criteria. Same underlying reasoning discipline (name the workload, compare real alternatives, admit the downsides); different audience and different moment in time.

---

## 4. Writing the RFC — Deriving Why Each Section Exists

[`career/RFC_TEMPLATE.md`](../career/RFC_TEMPLATE.md)'s filled example (migrating Puppeteer → Playwright) is real, complete, and already in this module. Rather than restate it, derive *why* each of its eight sections is shaped the way it is — the template's structure is not arbitrary, and understanding why turns "fill in the template" into "know what a reviewer is actually checking for."

| Section | What it forces you to do | What happens if you skip it |
| --- | --- | --- |
| **1. Summary** | State the expected outcome in one paragraph, with numbers ("~40% less flakiness, ~25% faster") | A reviewer has to read the whole document to find out what you're even proposing |
| **2. Motivation** | Prove the problem is real and *now* — the filled example leads with "8.3% flake rate... 120 engineer-hours per week" | Without a quantified "why now," this reads as a nice-to-have any stakeholder can deprioritize indefinitely |
| **3. Proposal** | Be concrete enough that someone else could start building from this document alone | Vague proposals get vague approval, which becomes a dispute at implementation time about what was actually agreed |
| **4. Alternatives Considered** | Prove you didn't skip the analysis — the filled example's Cypress rejection ("~40% [less migration cost]... closer to our existing Puppeteer patterns") is a specific, falsifiable comparison | Without this, a reviewer's first question is always "did you consider X?" — and now you're doing the analysis live, in the meeting, instead of in the document |
| **5. Impact** | Name who has to do work, and how much — the filled example's team table (Checkout: 14 suites, ~900 tests) turns "this affects everyone" into a plannable, assignable list | Teams discover they're affected *after* the RFC is approved, which is how "approved" proposals quietly stall |
| **6. Rollout Plan** | Force a phased path with a success signal *per phase*, not one big-bang cutover | Big-bang migrations fail all-at-once, at the worst possible time, with no partial credit for what already worked |
| **7. Success Criteria** | Define, in advance, what "done and worth it" looks like — measured, not felt | Without pre-committed criteria, success becomes whatever the loudest voice says after the fact, in either direction |
| **8. Risks & Mitigations** | Name what could go wrong *before* it does, with a specific response ready — the filled example's "WebKit tests expose new flaky behavior → start non-blocking, promote after 2 weeks" is an actual plan, not a hope | Unnamed risks still happen; the difference is whether there's already an agreed response or a scramble |

The pattern across all eight: **every section exists to remove one specific way a reviewer could reasonably say no, or one specific way the project could quietly fail after approval.** That's the same discipline as [ADR-002](../framework/docs/adrs/ADR-002-sqlite-trend-store.md)'s self-admitted weaknesses (§3 above) — a senior engineer's proposal pre-empts the objections a careful reviewer would raise, rather than waiting to be asked.

---

## 🏋️ Practice Challenges

**Challenge 1 — Quadrant your own suite.** Take 10 real tests from any suite you maintain (or this module's `framework/tests/`). Plot each on the blast-radius × change-frequency grid from §1. Which quadrant has the most tests? Is that where your team's actual attention goes, or is attention currently allocated by "whoever's loudest in standup"?

**Challenge 2 — Apply the automate/don't-automate heuristic to a real dispute.** Recall (or invent, grounded in a real product) a case where someone argued for automating something you suspected wasn't worth it. Write out the actual numbers for `times_run_per_period`, `cost_per_manual_run`, `build_cost`, and `maintenance_cost`. Does the arithmetic agree with your gut, or did your gut have it backwards?

**Challenge 3 — Write your own ADR-shaped decision.** Pick a real tooling choice on your team that was never written down (why this reporter, why this CI runner, why this retry count). Write it in ADR-002's shape: workload first, real alternatives with real rejection reasons, your own chosen option's negatives stated honestly, one exit-ramp risk.

**Challenge 4 — Find the weakest section in a real RFC.** Re-read the filled Puppeteer→Playwright example in [`career/RFC_TEMPLATE.md`](../career/RFC_TEMPLATE.md). Using §4's table, identify which of the 8 sections is weakest — where would a skeptical reviewer (Checkout's own on-call engineer, say) push back hardest? Rewrite just that section stronger.

<details>
<summary>Challenge 4 — one reasonable answer</summary>

A strong candidate: **Risks & Mitigations**' first row — "Migration takes longer than planned, delaying other work" is real but generic; nearly any project RFC could paste that row unchanged. A sharper version would quantify the delay's actual cost (e.g., "each week of delay keeps Checkout's team absorbing ~20 of the 120 weekly toil-hours this RFC exists to eliminate — call it a running cost of not finishing, not just a scheduling risk") — turning a vague risk into the same kind of quantified argument the Motivation section already uses. That's the general lesson: the weakest section in most real RFCs is the one that reverted to a generic template phrase instead of reusing a number the document already established elsewhere.

</details>

---

**Navigation**: [← Chapter 65: Chaos Engineering](../06_CI_CD_And_Reliability/65_Chaos_Engineering_For_Playwright.md) | [Index](../00_INDEX.md) | [→ Chapter 67: Payment Gateway Testing](../03_Real_World_Scenarios/67_Payment_Gateway_Testing.md)

---

## Reality Check

**"Senior engineers just have better instincts"** → What reads as instinct is usually a heuristic applied fast enough that the steps become invisible, the same way an experienced developer "just knows" a locator will be flaky without consciously walking through Ch26's taxonomy. §1's quadrant grid and §2's automate/don't-automate inequality are exactly the kind of thing that becomes "instinct" after the tenth time you've derived it explicitly — the derivation is the training, not a crutch to eventually discard.

**"A good idea should be able to get approved without all this RFC paperwork"** → A good idea and a *funded, staffed, scheduled* idea are different things. §4's table isn't paperwork for its own sake — every section maps to a specific way real proposals actually die (vague scope, unnamed risk, no rollout plan, all-at-once cutover). Skipping the template doesn't remove those failure modes; it just means you discover them after approval instead of before.

**"Cost/benefit analysis is a finance skill, not an engineering one"** → [ADR-002](../framework/docs/adrs/ADR-002-sqlite-trend-store.md) never mentions a dollar figure — it reasons entirely in engineering terms (workload shape, dependency weight, exit cost) and still produces a rigorous, defensible decision. The senior-level skill isn't accounting; it's naming the *actual* workload precisely enough that the wrong-sized solutions eliminate themselves, which is a technical skill wearing a business-sounding name.
