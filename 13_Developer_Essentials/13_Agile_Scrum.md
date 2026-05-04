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

Individuals & Interactions    OVER   Processes & Tools
Working Software              OVER   Comprehensive Documentation
Customer Collaboration        OVER   Contract Negotiation
Responding to Change          OVER   Following a Plan

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
▔▔▔▔▔▔▔▔▔▔▔    ▔▔▔▔▔▔    ▔▔▔▔▔    ▔▔▔▔    ▔▔▔▔▔▔
Month 1-2        Month 3    Month 4-6 Month 7 Month 8

Customer sees product: Month 8  😱
"That's not what I wanted!"

─────────────────────────────────────────────────────

AGILE (Like sculpting with feedback)

Sprint 1:  [Plan→Build→Test→Demo] → Feedback → Adjust
Sprint 2:  [Plan→Build→Test→Demo] → Feedback → Adjust
Sprint 3:  [Plan→Build→Test→Demo] → Feedback → Adjust
Sprint 4:  [Plan→Build→Test→Demo] → Feedback → Adjust
...

Customer sees product: Every 2 weeks  ✓
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

Input:  Product Backlog (prioritized by PO)
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

## Start Doing     │  Stop Doing      │  Continue Doing

| Pair programming | Skipping tests   | Code reviews |
| on complex tasks | for "quick fixes"| before merge |
| Writing ADRs for | Long meetings    | Daily standups |
| arch decisions   | without agenda   | at 10am |

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

🔬 **Section Challenge — Start Doing     │  Stop Doing      │  Continue Doing**

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
WHEN  I click "Forgot Password" and enter my email
THEN  I receive a reset link within 5 minutes

GIVEN I click the reset link
WHEN  I enter a valid new password (8+ chars, 1 uppercase)
THEN  my password is updated and I'm redirected to login

GIVEN the reset link is older than 24 hours
WHEN  I click it
THEN  I see "Link expired" and option to request new one

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

## Story Points & Estimation

STORY POINTS — Relative Sizing (NOT hours)

Fibonacci Scale: 1, 2, 3, 5, 8, 13, 21

1 point  → Trivial (change a label, update a config)
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

## Kanban — The Alternative Agile Framework

KANBAN BOARD

BACKLOG    │  IN PROGRESS   │  IN REVIEW    │  DONE
(No Limit) │  (WIP Limit:3) │ (WIP Limit:2) │
───────────┼────────────────┼───────────────┼──────
[Story 7]  │  [Story 4]     │  [Story 2]    │  [Story 1] ✓
[Story 8]  │  [Story 5]     │  [Story 3]    │
[Story 9]  │  [Story 6]     │               │
[Story 10] │                │               │

KEY PRINCIPLES:
- Visualize the workflow
- Limit Work In Progress (WIP)
- Manage flow (reduce bottlenecks)
- Make policies explicit
- Continuous improvement

### Scrum vs Kanban

ASPECT           │  SCRUM               │  KANBAN
Cadence          │  Fixed sprints       │  Continuous flow
Roles            │  PO, SM, Dev Team    │  No prescribed roles
Change during    │  Not recommended     │  Allowed anytime
iteration        │                      │
Commitment       │  Sprint backlog      │  WIP limits
Metrics          │  Velocity            │  Lead time, cycle time
Ceremonies       │  5 ceremonies        │  Just standups
Best for         │  Product development │  Support/ops/bugs

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

## Agile Metrics That Matter

METRIC         │  WHAT IT MEASURES           │  HEALTHY SIGN
Velocity       │  Points/sprint              │  Stable (±20%)
Sprint         │  % committed stories done   │  > 80%
Burndown       │  Remaining work over time   │  Steady decline
Cycle Time     │  Start → Done for one item  │  Decreasing
Lead Time      │  Request → Delivery         │  Decreasing
Escaped Bugs   │  Bugs found in production   │  Near zero
Code Coverage  │  % code with tests          │  ≥ 80%

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

*The best sprint is one where the team delivers what they committed to, learns something new, and enjoys working together.*

---

**Navigation**: [< Previous](12_Monitoring_Observability.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](14_Code_Review_Practices.md)

🔬 **Section Challenge — Mental Model: Agile Is a Mindset, Not Just Ceremonies**
