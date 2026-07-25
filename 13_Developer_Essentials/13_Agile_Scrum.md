**Navigation**: [< Previous](12_Monitoring_Observability.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](14_Code_Review_Practices.md)

# Agile & Scrum — Complete Developer Guide

## Why Every Developer Needs This

90%+ of software teams use some form of Agile.
Interviewers WILL ask: "How do you work in Agile teams?"

This isn't just process — it changes HOW you code:

- Smaller PRs (fit in a sprint)
- User stories → acceptance criteria → test cases
- Daily standups → early blockers → faster delivery

---

## Agile Manifesto — The Foundation

THE 4 VALUES (2001, 17 Software Developers)

Individuals & Interactions OVER Processes & Tools
Working Software OVER Comprehensive Documentation
Customer Collaboration OVER Contract Negotiation
Responding to Change OVER Following a Plan

⚠️ Items on the RIGHT still have value.
Items on the LEFT have MORE value.

### The 12 Principles (Summarized)

```
 1. Highest priority: satisfy customer through early, continuous delivery
 2. Welcome changing requirements, even late in development
 3. Deliver working software frequently (weeks, not months)
 4. Business people and developers work together DAILY
 5. Build projects around motivated individuals — trust them
 6. Face-to-face conversation is the most efficient communication
 7. Working software is the primary measure of progress
 8. Sustainable pace — no death marches
 9. Continuous attention to technical excellence
10. Simplicity — maximize the work NOT done
11. Best architectures emerge from self-organizing teams
12. Regular reflection and adjustment
```

---

## Waterfall vs Agile — Mental Model

WATERFALL (Like building a house)

Requirements ──→ Design ──→ Build ──→ Test ──→ Deploy
▔▔▔▔▔▔▔▔▔▔▔ ▔▔▔▔▔▔ ▔▔▔▔▔ ▔▔▔▔ ▔▔▔▔▔▔
Month 1-2 Month 3 Month 4-6 Month 7 Month 8

Customer sees product: Month 8 😱
"That's not what I wanted!"

─────────────────────────────────────────────────────

AGILE (Like sculpting with feedback)

Sprint 1: [Plan→Build→Test→Demo] → Feedback → Adjust
Sprint 2: [Plan→Build→Test→Demo] → Feedback → Adjust
Sprint 3: [Plan→Build→Test→Demo] → Feedback → Adjust
Sprint 4: [Plan→Build→Test→Demo] → Feedback → Adjust
...

Customer sees product: Every 2 weeks ✓
"Let me tweak this one thing..."

---

## Scrum Framework — Deep Dive

### The Scrum Team

```
SCRUM TEAM (Typically 5-9 People)

┌──────────────────────────────────────────────────┐
│  PRODUCT OWNER (1 person)                        │
│  • Owns the Product Backlog                      │
│  • Prioritizes features by business value        │
│  • Writes user stories                           │
│  • Says YES/NO to "what to build"                │
│  • Available for questions during sprint         │
└──────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  SCRUM MASTER (1 person, servant-leader)        │
│  • Facilitates ceremonies                       │
│  • Removes blockers                             │
│  • Protects team from distractions              │
│  • Coaches on Scrum practices                   │
│  • NOT a project manager / NOT a boss           │
└─────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  DEVELOPMENT TEAM (3-7 people)                   │
│  • Cross-functional (frontend, backend, QA)      │
│  • Self-organizing (they decide HOW to build)    │
│  • Collectively own the sprint deliverables      │
│  • No sub-teams or hierarchies within            │
└──────────────────────────────────────────────────┘
```

### The Sprint — 2-Week Cycle

```
SPRINT TIMELINE (2 Weeks = 10 Working Days)

Day 1           Day 2-9              Day 10
┌─────────┐    ┌──────────────────┐  ┌────────────────────┐
│ Sprint  │    │   Development    │  │  Sprint Review     │
│ Planning│───→│                  │──→│  (Demo to PO)     │
│ (4 hrs) │    │  Daily Standups  │  │  (2 hrs)           │
└─────────┘    │  (15 min each)   │  └────────┬───────────┘
               └──────────────────┘           │
                                     ┌────────▼───────────┐
                                     │  Retrospective     │
                                     │  (What to improve) │
                                     │  (1.5 hrs)         │
                                     └────────────────────┘

KEY RULE: Sprint scope is FIXED once planning is done.
No adding work mid-sprint (unless truly urgent).
```

---

## The 5 Scrum Ceremonies

### 1. Sprint Planning

SPRINT PLANNING (4 hours for 2-week sprint)

Input: Product Backlog (prioritized by PO)
Output: Sprint Backlog (committed by team)

PART 1 — WHAT (with PO):

- PO presents top-priority items
- Team asks clarifying questions
- Team estimates capacity (story points)
- Team selects items they can commit to

PART 2 — HOW (dev team):

- Break stories into technical tasks
- Identify dependencies
- Create Sprint Goal (one-sentence summary)

SPRINT GOAL EXAMPLE:
"Users can register, login, and reset passwords"

### 2. Daily Standup (Daily Scrum)

DAILY STANDUP (15 minutes MAX, same time every day)

Each team member answers 3 questions:

1. What did I do YESTERDAY?
2. What will I do TODAY?
3. Are there any BLOCKERS?

❌ ANTI-PATTERNS:

- Status report to the manager (it's team sync, not reporting)
- Problem-solving in standup (say "let's take this offline")
- Going over 15 minutes
- Not showing up / phoning it in

✅ GOOD EXAMPLE:
"Yesterday I completed the login API endpoint and wrote tests.
Today I'll start on password reset. No blockers."

✅ GOOD BLOCKER CALL:
"I'm blocked on the email service integration — need access
credentials from DevOps. Can someone help after standup?"

### 3. Sprint Review (Demo)

```
Who: Entire Scrum team + stakeholders
When: Last day of sprint (2 hours for 2-week sprint)
Purpose: Show WORKING software (not slides)

Format:
  1. PO states Sprint Goal
  2. Team demos completed stories (live, not screenshots)
  3. Stakeholders give feedback
  4. PO updates backlog based on feedback
  5. Discuss what's next

TIP: As a developer, volunteer to demo YOUR work.
     It's visibility + practice for presentations.
```

### 4. Sprint Retrospective

## Start Doing │ Stop Doing │ Continue Doing

| Pair programming | Skipping tests | Code reviews |
| on complex tasks | for "quick fixes"| before merge |
| Writing ADRs for | Long meetings | Daily standups |
| arch decisions | without agenda | at 10am |

### 5. Backlog Refinement (Grooming)

```
When: Mid-sprint (ongoing, ~10% of sprint capacity)
Who: PO + Dev Team
Purpose: Prepare stories for NEXT sprint

Activities:
  • PO presents upcoming stories
  • Team asks questions, identifies unknowns
  • Team estimates (story points)
  • Large stories get broken down
  • Acceptance criteria get refined
```

---

🔬 **Section Challenge — Start Doing │ Stop Doing │ Continue Doing**

**Challenge 1 (Reasoning):** A retrospective ends with 12 action items. Next sprint, none were implemented. Why does this happen and what structural fix makes retros actually change team behavior?

<details><summary>Answer</summary>

Root cause: **action items without owners and deadlines are wishes, not commitments**. 12 items means the team is spreading attention too thin — nothing gets prioritized. Structural fix: (1) **Maximum 2-3 action items per retro** — ruthlessly prioritize. (2) **Each item has ONE named owner** (not "the team") and a specific definition of done: "Alice will add pre-commit ESLint hook by Wednesday." (3) **First agenda item of NEXT retro**: review last sprint's action items. If they weren't done, why not? This creates accountability. (4) **Convert action items to stories** in the sprint backlog — if it doesn't make the board, it doesn't happen. The team that does 2 action items per retro consistently will outperform the team that promises 12 and delivers 0.

### Production Reality

**Agile and Scrum practices fail in production in these named ways:**

- **Sprint commitment overestimation causing crunch** — a team commits to 40 story points in a 2-week sprint but delivers 20. Every sprint, the burndown chart shows the same shortfall. The response: extend hours, skip meetings, merge unfinished code. Technical debt accumulates; code quality degrades; bugs increase. The root cause is often velocity gaming: teams inflate estimates to look consistent with past sprints that were already overestimated.
- **Retrospective action items never completed** — each sprint retrospective produces 5 "action items": "improve code review turnaround," "document deployment runbook," "reduce flaky tests." By the next retrospective, none are done. No one owns them. No time was allocated. The retrospective becomes theater. Fix: action items must have an owner, a deadline, and be reviewed at sprint planning.
- **Story point inflation over time** — a "2-point story" in 2024 is not the same effort as a 2-point story in 2022. Points tend to inflate by ~10-15% per year as the team gets more comfortable. Velocity becomes meaningless for capacity planning. Fix: use reference stories calibrated annually, or switch to using T-shirt sizes with explicit anchor points.

**Debug workflow:** Track velocity trend over 6+ sprints; if it consistently exceeds or falls short of average, recalibrate. Track retrospective action item completion rate — if <50%, the retrospective process is broken.
**Mitigation discipline:** Use rolling average velocity (last 5 sprints) for capacity planning, not last sprint alone. Allocate 20% of sprint capacity to tech debt and process improvement. Review retrospective action items at the start of every sprint planning as the first agenda item.

---

</details>

**Challenge 2 (Design):** A team does the "Start/Stop/Continue" format every sprint. After 6 months, retros feel stale and participation drops. Name two alternative retrospective formats and when to use each.

<details><summary>Answer</summary>

1. **"4Ls" (Liked, Learned, Lacked, Longed For)**: Use when the team needs to focus on growth and learning, not just process. "Liked" = what went well, "Learned" = new insights, "Lacked" = missing support/tools, "Longed For" = desired improvements. Better than Start/Stop/Continue when team morale needs boosting — starts with positives. 2. **"Sailboat" (anchors vs wind)**: Draw a sailboat. Wind = things pushing us forward (strengths). Anchors = things slowing us down (blockers). Use when the team is stuck on systemic blockers (team dependencies, tooling, org impediments). Visual format increases engagement. Rule: rotate formats every 3-4 sprints. Format variety prevents retro fatigue and surfaces different problem dimensions.

</details>

## User Stories — Writing & Understanding

USER STORY FORMAT:

"As a [USER ROLE],
I want to [ACTION],
so that [BENEFIT]."

EXAMPLE:
"As a registered user,
I want to reset my password via email,
so that I can regain access to my account."

─────────────────────────────────────────────────
ACCEPTANCE CRITERIA (Given-When-Then):

GIVEN I am on the login page
WHEN I click "Forgot Password" and enter my email
THEN I receive a reset link within 5 minutes

GIVEN I click the reset link
WHEN I enter a valid new password (8+ chars, 1 uppercase)
THEN my password is updated and I'm redirected to login

GIVEN the reset link is older than 24 hours
WHEN I click it
THEN I see "Link expired" and option to request new one

### INVEST Criteria for Good Stories

```
I — Independent (can be developed in any order)
N — Negotiable  (details can be discussed)
V — Valuable    (delivers value to the user)
E — Estimable   (team can size it)
S — Small       (fits in one sprint)
T — Testable    (has clear acceptance criteria)
```

---

🔬 **Section Challenge — User Stories — Writing & Understanding**

**Challenge 1 (Trace):** Evaluate this user story: "As a user, I want the system to be faster." Apply all 6 INVEST criteria and identify every violation.

<details><summary>Answer</summary>

**I (Independent)**: ❌ Violates. "Faster" is vague — it could mean DB queries, API response time, page load, background jobs. It has implicit dependencies on every system component. **N (Negotiable)**: ❌ Violates. No scope to negotiate — there's no defined measure of "faster." **V (Valuable)**: ✅ Passes loosely — performance does provide user value. But without specificity, can't verify value was delivered. **E (Estimable)**: ❌ Violates critically. No acceptance criteria, no baseline, no target. The team can't size this in any unit. **S (Small)**: ❌ Violates. "Faster" could be a 1-point DB index addition or a 21-point distributed caching overhaul. **T (Testable)**: ❌ Violates. No criterion for "done." Fixed version: "As a user, I want product search results to appear in under 500ms for the first 20 results, so I can browse quickly on mobile." Now it's measurable, testable, and estimable.

</details>

**Challenge 2 (Design):** A PO writes: "As a developer, I want to refactor the PaymentService to use the Strategy pattern." Why is this a problematic user story format and how do you rewrite it correctly?

<details><summary>Answer</summary>

Problematic because: (1) **Wrong actor** — user stories are FROM the perspective of who receives VALUE, not who does the work. "As a developer" is a technical task, not a user story. Stakeholders can't prioritize it because they can't see the business value. (2) **Solution-prescribing** — the story specifies the implementation (Strategy pattern) rather than the need. The team should decide HOW to solve the problem. Fix: First, identify WHY the refactor is needed. If it's to add new payment providers: "As a product owner, I want to add PayPal as a payment option without a 4-week development cycle, so we can respond to market demand quickly." Now engineering can propose the Strategy pattern refactoring as the HOW. The business value is visible. The sprint review can demonstrate the outcome (adding a new payment method takes 2 days instead of 3 weeks).

</details>

## Story Points & Estimation

STORY POINTS — Relative Sizing (NOT hours)

Fibonacci Scale: 1, 2, 3, 5, 8, 13, 21

1 point → Trivial (change a label, update a config)
2 points → Simple (add a field, simple validation)
3 points → Standard (new API endpoint with tests)
5 points → Moderate (feature with multiple components)
8 points → Complex (new service, significant logic)
13 points → Very complex (consider splitting)
21 points → TOO BIG (must split into smaller stories)

─────────────────────────────────────────────────
ESTIMATION METHOD: Planning Poker

1. PO presents story
2. Team discusses (2 min)
3. Everyone reveals estimate simultaneously
4. If estimates differ: highest & lowest explain
5. Re-vote until consensus

VELOCITY = Total story points completed per sprint
(Used to predict future capacity, NOT to judge productivity)

---

🔬 **Section Challenge — Story Points & Estimation**

**Challenge 1 (Reasoning):** A team's velocity is 40 points/sprint for 6 months. A manager starts using velocity as a performance KPI and pressures teams to increase it each sprint. What two failure modes emerge?

<details><summary>Answer</summary>

1. **Story point inflation**: the team unconsciously (or consciously) inflates estimates. A story that was 3 points becomes 5 points. Velocity climbs from 40 to 55 points/sprint. But throughput (actual features delivered) stays the same. The metric looks better; the system is no better. Goodhart's Law: "When a measure becomes a target, it ceases to be a good measure." 2. **Quality collapse**: to hit point targets, the team skips tests, cuts corners on error handling, accumulates tech debt. Velocity is high this quarter; production incidents spike next quarter. Fix: velocity is an **internal planning tool** — use it to forecast sprint capacity, nothing else. If stakeholders want a performance metric, use **cycle time** (how long from story start to production) or **escaped defect rate** (bugs found in production). These can't be gamed as easily.

</details>

**Challenge 2 (Trace):** Planning Poker: a 5-person team estimates a story. Estimates are: 2, 3, 13, 3, 5. What should the Scrum Master do next and why?

<details><summary>Answer</summary>

The SM asks the **highest** (13) and **lowest** (2) estimators to explain their reasoning — in that order. The 13: "This touches the payment gateway, which requires a new API contract negotiation with the vendor. I've done this before and it took 2 weeks." The 2: "I thought we were just changing the discount calculation logic, one method." **This is a misunderstanding of scope** — the team has two different mental models of the story. The PO clarifies: the story includes the vendor negotiation. Re-vote: now estimates are 8, 8, 13, 8, 8. Consensus at 8. The divergence in the first round was valuable: it revealed a hidden dependency. If everyone had voted 3, the sprint would have blown up in week 1. Planning Poker's real value is not the number — it's surfacing disagreements about scope.

</details>

## Kanban — The Alternative Agile Framework

KANBAN BOARD

BACKLOG │ IN PROGRESS │ IN REVIEW │ DONE
(No Limit) │ (WIP Limit:3) │ (WIP Limit:2) │
───────────┼────────────────┼───────────────┼──────
[Story 7] │ [Story 4] │ [Story 2] │ [Story 1] ✓
[Story 8] │ [Story 5] │ [Story 3] │
[Story 9] │ [Story 6] │ │
[Story 10] │ │ │

KEY PRINCIPLES:

- Visualize the workflow
- Limit Work In Progress (WIP)
- Manage flow (reduce bottlenecks)
- Make policies explicit
- Continuous improvement

### Scrum vs Kanban

ASPECT │ SCRUM │ KANBAN
Cadence │ Fixed sprints │ Continuous flow
Roles │ PO, SM, Dev Team │ No prescribed roles
Change during │ Not recommended │ Allowed anytime
iteration │ │
Commitment │ Sprint backlog │ WIP limits
Metrics │ Velocity │ Lead time, cycle time
Ceremonies │ 5 ceremonies │ Just standups
Best for │ Product development │ Support/ops/bugs
**Timeboxed sprints** │ Yes (2-4 weeks) │ No (continuous flow)
**Interrupt handling** │ Interrupts defer to next sprint (backlog buffer) │ Interrupts pull capacity from current flow immediately
**Bug fix priority** │ Bugs enter backlog, prioritized in next sprint planning │ Bugs enter current flow, prioritized against in-flight work
**Tech debt allocation** │ Reserve % of sprint capacity (e.g., 20%) │ Limit WIP, debt work pulls from same capacity as features
**Team structure** │ Cross-functional Scrum team (all roles embedded) │ Specialized functions; work flows across team boundaries
**Cadence** │ Sprint boundary forces stop-and-reflect │ Continuous delivery, no natural stop points
**Predictability** │ Sprint goal + burndown chart │ Cycle time histogram (when does X-sized work typically complete?)

---

## Definition of Done (DoD)

TEAM'S DEFINITION OF DONE (Example)

A story is "Done" when ALL of these are true:

□ Code is written and follows coding standards
□ Unit tests written and passing (>80% coverage)
□ Integration tests passing
□ Code reviewed by at least 1 team member
□ No critical SonarQube issues
□ Documentation updated (API docs, README)
□ Deployed to staging environment
□ PO has accepted the story
□ No known bugs

"Done" means SHIPPABLE — not "coding is finished"

---

🔬 **Section Challenge — Definition of Done (DoD)**

**Challenge 1 (Reasoning):** A team's DoD says "Code reviewed by at least 1 team member." In practice, under sprint deadline pressure, developers self-approve their own PRs and merge directly. What organizational mechanism prevents DoD bypass?

<details><summary>Answer</summary>

Soft DoD (honor-system) breaks under pressure every time. Hard enforcement mechanisms: (1) **Branch protection rules** (GitHub/GitLab): require minimum 1 approved review before merge is allowed — the UI literally won't let you merge without it. Configure: Settings → Branches → Branch protection rules → "Require a pull request before merging" + "Require approvals: 1." (2) **CODEOWNERS file**: specific files require specific owners' approval. Payment code requires a senior engineer sign-off regardless of who wrote it. (3) **CI gate**: the "deployed to staging" DoD item is enforced by making the CD pipeline the only deploy path — no manual pushes to staging. The key insight: DoD items that CAN be bypassed WILL be bypassed under pressure. Every DoD item should have a corresponding automated or structural gate. If you can't automate it, make the bypass visible (e.g., required PR label "DoD-exception" that notifies the Scrum Master).

</details>

**Challenge 2 (Design):** A team's DoD includes "PO has accepted the story." But the PO is in a different timezone and review takes 48+ hours, creating a sprint-end bottleneck. Redesign this DoD item without removing the PO acceptance requirement.

<details><summary>Answer</summary>

The bottleneck is synchronous, end-of-sprint acceptance. Fixes: (1) **Continuous acceptance**: PO reviews and accepts stories as they complete during the sprint (not only at Sprint Review). Schedule a 30-min PO slot mid-sprint for story acceptance. Stories completed early get accepted early — no end-of-sprint pile-up. (2) **Acceptance criteria as contract**: write acceptance criteria in Given-When-Then format at story creation time (planning). If all ACs are met and verified by automated tests, the story is "conditionally accepted" — PO reviews the test results async, not the live feature. (3) **Async demo recordings**: developer records a 2-min Loom showing the feature working against each AC. PO reviews async in their timezone. Approval via PR comment. The redesigned DoD: "All acceptance criteria verified by automated tests AND PO has reviewed the demo recording and approved via PR comment." Removes the synchronous dependency while keeping PO accountability.

</details>

## Agile Metrics That Matter

METRIC │ WHAT IT MEASURES │ HEALTHY SIGN
Velocity │ Points/sprint │ Stable (±20%)
Sprint │ % committed stories done │ > 80%
Burndown │ Remaining work over time │ Steady decline
Cycle Time │ Start → Done for one item │ Decreasing
Lead Time │ Request → Delivery │ Decreasing
Escaped Bugs │ Bugs found in production │ Near zero
Code Coverage │ % code with tests │ ≥ 80%

### Burndown Chart

```
Story Points
Remaining
  30 │╲
     │  ╲___
  20 │      ╲
     │       ╲___
  10 │           ╲
     │            ╲
   0 │─────────────╲───
     Day 1   5    10

  ── Ideal Burndown (straight line)
  ╲_ Actual Burndown (healthy — roughly follows ideal)
```

---

## Common Interview Questions

```
Q: "What Agile methodology do you use?"
A: Describe your experience — Scrum, Kanban, or hybrid.
   Mention ceremonies, your role, how stories flow.

Q: "How do you handle scope creep in a sprint?"
A: "We protect sprint scope. If something urgent comes in,
    we discuss with PO — either it replaces an equal-sized
    story, or it goes to next sprint. Emergency bugs are
    the exception."

Q: "Your velocity dropped this sprint. Why?"
A: Multiple reasons are valid: team member was sick,
    unexpected tech debt, underestimated stories,
    too many meetings. Key: what did you learn and
    how will you adjust?

Q: "How do you split stories that are too big?"
A: By user workflow, by input method, by data type,
    by CRUD operations, by platform, or by happy path
    vs edge cases.
```

---

## Mental Model: Agile Is a Mindset, Not Just Ceremonies

"Doing Agile" vs "Being Agile"

DOING AGILE:

- Having standups but nobody listens
- Sprint retros but no action items
- Jira board but waterfall in disguise
  → "Cargo cult Agile" — copying the rituals without the values

BEING AGILE:

- Genuinely welcoming feedback and change
- Shipping small, getting feedback, iterating
- Talking to users, not hiding behind specs
- Reflecting honestly on what's not working

The BEST teams I've seen take what works from Scrum, Kanban,
XP, and create their own system. The framework serves the
team — not the other way around.

---

_The best sprint is one where the team delivers what they committed to, learns something new, and enjoys working together._

---

**Navigation**: [< Previous](12_Monitoring_Observability.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](14_Code_Review_Practices.md)

🔬 **Section Challenge — Mental Model: Agile Is a Mindset, Not Just Ceremonies**

**Challenge 1 (Reasoning):** A team has daily standups, sprint planning, reviews, and retros — but ships features on a 6-month cycle and never talks to users. A consultant says they're "doing Agile." What specific Agile values are they violating?

<details><summary>Answer</summary>

They violate the core manifesto values, not just surface ceremonies: (1) **Working software over comprehensive documentation** — a 6-month cycle means no working software reaches users for 6 months. Ceremonies without delivery is theater. (2) **Customer collaboration over contract negotiation** — never talking to users means requirements are assumed, not validated. The Agile principle "satisfy the customer through early and continuous delivery" is directly violated. (3) **Responding to change** — a 6-month cycle makes the team structurally unable to respond to change. By the time they ship, the market has moved. What they have is **Cargo Cult Agile**: adopting Agile rituals (standups, sprints) while keeping a Waterfall delivery model underneath. Fix: the ceremonies are not the problem — the lack of feedback loops is. Add: weekly production deploys (even to beta users), monthly user interviews, sprint reviews with actual end users present. Ceremonies are instruments of feedback; without actual feedback loops, they're meaningless.

</details>

**Challenge 2 (Design):** Your team is Scrum-certified and follows all ceremonies. A senior engineer proposes switching to Kanban for the next quarter. The Scrum Master objects: "We can't abandon Agile." Why is this objection logically flawed?

<details><summary>Answer</summary>

The objection conflates **Scrum** with **Agile** — they are not the same thing. Agile is a set of values and principles (the Manifesto). Scrum is ONE framework for implementing those values. Kanban is ALSO an Agile framework. Both prioritize continuous delivery, feedback, and adaptation. The Scrum Master's objection is an example of Agile fundamentalism: treating the framework as the goal instead of treating the team's effectiveness as the goal. Manifesto Principle 12: "At regular intervals, the team reflects on how to become more effective, then tunes and adjusts its behavior accordingly." If Kanban serves the team better (e.g., they have high-priority support tickets interrupting sprints), switching is the most Agile thing they can do. The correct response: "What problem are we solving by switching? What outcomes do we expect to improve?" Choose the framework that serves the work, not the work that serves the framework.

</details>

## WHO: Origin Story

**Ken Schwaber and Jeff Sutherland** co-created **Scrum in 1993** at the OOPSLA conference. Sutherland had been applying Scrum-like patterns at Easel Corporation; Schwaber independently developed similar ideas at his company. They merged approaches and presented jointly. The original 1993 paper formalized the sprint, daily standup, and retrospective.

**The pre-Manifesto method wars (1990s)**: software development was dominated by heavyweight methodologies — **CMM** (Capability Maturity Model, SEI 1987/1993), **RUP** (Rational Unified Process, 1996), **SSADM** (UK government standard). These had hundreds of artifacts and months-long phases. Practitioners rebelled.

**Kent Beck** published **Extreme Programming Explained (1999)** — TDD, pair programming, continuous integration. Beck explicitly said "turn all the good practices up to eleven."

**Beck, Schwaber, and 15 other practitioners** met at **Snowbird, Utah in February 2001** and signed the **Agile Manifesto**. Other signatories included representatives from Crystal (Alistair Cockburn), DSDM, FDD (Jeff De Luca), and Pragmatic Programming (Andy Hunt, Dave Thomas). Scrum was ONE of multiple signatories, not the origin.

**Mike Cohn** created the **Testing Pyramid** concept in **2009** (Succeeding with Agile) — the unit-heavy, integration-light, e2e-sparse pattern that became canonical.

**Eric Ries** published **The Lean Startup (2011)** — applied agile to startup product development via the build-measure-learn loop and MVP concept. This extended agile thinking beyond engineering teams to product/market fit.

### Conceptual Depth: The Agile Manifesto Invariant

**Core invariant:** Individuals and interactions over processes and tools. Working software over comprehensive documentation. Customer collaboration over contract negotiation. Responding to change over following a plan.

**Why this matters:** Software development under uncertainty cannot be fully specified upfront. Waterfall assumed you could specify all requirements before coding; agile assumes requirements emerge from working software.

**The deep pattern:** The manifesto is NOT anti-process — it's anti-ritual-process. The right side ("while there is value in the items on the right, we value the items on the left more") acknowledges processes have value but should serve humans, not the reverse.

**Historical context:** Written in February 2001 at Snowbird, Utah by 17 software practitioners (Beck, Fowler, Cockburn, Poppendieck, Jeffries, etc.). The signatories included representatives from Scrum, XP, Crystal, DSDM, FDD, and pragmatic programming traditions — a coalition, not a single methodology.

**Constraint that breaks the invariant:** When teams become "doing agile" (standups, story points, retros) without the underlying values (individuals/working software/customer/change), they get Cargo Cult Agile — ceremony without substance.

**Practical signal:** If a team's "Agile transformation" produced more meetings but no faster delivery, they have the rituals without the invariant.


---

## Reality Check

**"Agile means Scrum ceremonies"** ? The ceremonies are one implementation of the underlying bet � SHORT FEEDBACK LOOPS beat long-range prediction in high-uncertainty work � and cargo-culting ceremonies without the loops produces waterfall-in-sprints (the two-week mini-deadlines, the roadmap fixed a year out, the demo to nobody who can redirect anything): the diagnostic questions are loop questions, not ritual questions � when did user feedback last change what the team built, how long from idea to production ([CI/CD]'s latency lens applied to process), what did the last retro actually change? Teams that answer well while skipping half the ceremonies are agile; teams that answer badly while performing all of them are doing synchronized meetings.

**"Story points measure how long work takes"** ? Points were designed as RELATIVE-complexity tokens whose only legitimate output is the team's own rolling forecast (velocity as an empirical planning input) � and every other use corrupts the instrument: cross-team comparison (different scales by construction), individual performance measurement (points-per-person converts estimation into negotiation), and hour-conversion (the false precision that re-imports deadline physics into a relative scale). The corruption is Goodhart's law on schedule: measured-as-target, points inflate within quarters � which is why the teams with the healthiest forecasting often drift toward throughput counting (stories per week, sized to be small) and treat estimation primarily as the CONVERSATION that surfaces hidden complexity before the sprint starts.

**"The standup is a status report"** ? Status is the least valuable payload (readable async from the board � the meeting that could have been a bot message): the meeting's economic function is BLOCKER ROUTING and re-coordination � surfacing the stuck ticket while it costs hours instead of days, catching the two people about to collide in the same module, re-planning around yesterday's discovery � which is why the walk-the-board format (talk about the WORK, right-to-left by proximity to done) reliably outperforms the round-robin (talk about the PEOPLE, optimized for accountability theater and phone-glancing). A standup where nothing routes and nothing re-plans is a daily tax; fifteen minutes times the team, every day, compounds into real money.

**"Technical debt is what managers won't let us fix"** ? The framing fails because debt is invisible in the backlog language decision-makers read: the working pattern makes debt LEGIBLE � attached to the features it taxes (this quarter's slowdown in checkout changes traces to these three seams; fixing them is two sprints and buys 30 percent on every future checkout ticket � [production-code]'s cost accounting spoken in product terms), paid continuously via the boy-scout margin inside feature work ([clean-code]'s preparatory refactoring, no permission required), and escalated as an explicit budget line only for the big rewires. Teams that ask permission to refactor per-instance lose; teams that price debt in feature-velocity terms and bundle small payments invisibly mostly do not need to ask.

**"Retros are where the team complains safely"** ? Venting without CLOSED LOOPS is process theater that curdles into cynicism (the same sticky note three retros running � the surest morale leak in the toolkit): functioning retros produce one to two OWNED, dated, checkable changes (smaller is better: change the alert threshold, add the review-latency norm, kill the meeting � [monitoring]'s actionability rule applied to process), open by verifying last retro's actions (the accountability loop that makes the exercise real), and vary format only to surface different data (the format is instrumentation; the follow-through is the product). A retro whose actions have no owner is a complaint ceremony with better branding � and teams notice, silently, within a quarter.
