# The 15-Week FTE Conversion Plan — Jul 27 → Nov 9, 2026

**Navigation**: [← Daily Practice Index](00_DAILY_PRACTICE_INDEX.md) | [Master Index](../00_MASTER_INDEX.md) | [Daily Log Template](DAILY_LOG_TEMPLATE.md)

> **The situation this plan is built for:** Engineering Trainee (SDET) at Cubic Transport Systems, ~3.5 months to the conversion decision. Goal is not "study more CS" — it is **arrive at the decision with visible impact at work, demonstrable range beyond your current role, and interview-readiness as insurance.**

> **Read this once fully, then only look at the current week.** Planning past the current week is procrastination wearing a spreadsheet.

---

## 0. The Strategy Before the Schedule

You have three outcomes ahead: converted to FTE, extended, or unemployed. This plan is engineered so that **the same work maximizes your chances in all three** — because you cannot know which one you are optimizing for until it is decided for you.

| Outcome | What actually decides it | What this plan does about it |
| --- | --- | --- |
| **Converted at Cubic** | Whether the team sees you as *already doing the FTE job* | Every week has a **Work-Visible Action** — something that lands in your team's repo, dashboard, or review process |
| **Extended / uncertain** | Whether you are the obvious person to keep | Same as above + the range that makes you hard to replace (SDET **and** backend **and** DB **and** DevOps) |
| **Need to interview elsewhere** | Portfolio + interview performance | Weeks 13–15 are explicitly for this, and the portfolio is built incrementally from week 1, not crammed |

**The load-bearing insight:** an engineering trainee converts by *reducing the team's uncertainty about them*. Uncertainty is reduced by artifacts other people can see — a merged PR that removed a flaky test class, a dashboard nobody had, an ADR that settled an argument. Not by private study. Hence the Work-Visible Action on every single week; if you drop everything else in a busy week, **do not drop that.**

### The three-lane model

Every week runs three lanes simultaneously. They are sized deliberately.

```
┌─ LANE A: DEPTH (≈60% of study time) ───────────────────────────┐
│  The chapter work. Builds the CS foundation you are here for.  │
│  Weekday 3h blocks. This is where the repo gets consumed.      │
└────────────────────────────────────────────────────────────────┘
┌─ LANE B: BUILD (≈30%) ─────────────────────────────────────────┐
│  One thing built FROM SCRATCH per week. Not tutorials.         │
│  This is the "I can build things" capability you asked for.    │
│  Weekend blocks. Accumulates into the portfolio.               │
└────────────────────────────────────────────────────────────────┘
┌─ LANE C: WORK-VISIBLE (≈10%, highest leverage per minute) ─────┐
│  One action per week that your TEAM sees. Small is fine.       │
│  This is what actually converts trainees.                      │
└────────────────────────────────────────────────────────────────┘
```

### Daily cadence (reuses your existing 3h structure)

| | Mon–Fri (3h) | Sat–Sun (3h) |
| --- | --- | --- |
| **Block 1** | 60 min — Lane A chapter (deep read + notes in your own words) | 90 min — Lane B build |
| **Block 2** | 45 min — Lane A problems (from the week's problem set) | 60 min — Lane B build / Lane A catch-up |
| **Block 3** | 45 min — Derivation drill (see §Rituals) | 30 min — **Weekly review ritual** |
| **Block 4** | 30 min — Lane C or log-writing | — |

**If you only have 60 minutes on a given day:** do Block 1 only. Consistency beats volume — this is [09_Career/13's](../09_Career_Reference/13_Daily_Habits_Tracking.md) never-miss-twice rule, and the plan is designed to survive missed days.

---

## 1. The Phase Map

| Phase | Weeks | Dates | Theme | Why here |
| --- | --- | --- | --- | --- |
| **I — Invention** | 1–3 | Jul 27 – Aug 16 | Build-from-scratch capability | Front-loaded because it changes *how* you read everything after it |
| **II — SDET Mastery** | 4–6 | Aug 17 – Sep 6 | Your actual job, at depth | Maximum work-visible leverage; earliest impact on the decision |
| **III — Backend + Data** | 7–9 | Sep 7 – Sep 27 | Complete-developer half | The range that makes conversion easy to justify |
| **IV — Systems + DevOps** | 10–12 | Sep 28 – Oct 18 | Infrastructure literacy | Completes the "not just a test writer" case |
| **V — Consolidation** | 13–15 | Oct 19 – Nov 9 | Portfolio + interview + review | Insurance, and the retrospective that makes it all legible |

**Checkpoint dates** (put these in your calendar now): **Aug 16, Sep 6, Sep 27, Oct 18, Nov 9.**

---

## PHASE I — INVENTION (Weeks 1–3)

*Goal: stop being someone who applies known structures, become someone who derives them. Everything after this phase reads differently.*

### Week 1 — Jul 27 – Aug 2 · The Design Loop

| Lane | What |
| --- | --- |
| **A — Depth** | [DS A5: Designing Your Own Data Structures](../02_Data_Structures/A5_Designing_Your_Own_Data_Structures.md) — the whole chapter, slowly. §10 (Fenwick derivation) **with pen and paper, not reading**. Then [A1: Invariants](../02_Data_Structures/A1_DS_Correctness_Invariants.md). |
| **B — Build** | Implement an **order-statistic tree** from scratch (augmented BST, §3.2). Include `checkInvariants()` and the differential test vs a sorted `ArrayList`. No library BST. |
| **C — Work** | Add `checkInvariants()`-style assertions (or one property-based test) to *one* thing in your team's codebase. Small PR. Ship it. |
| **Checkpoint** | Can you derive `i & -i` for the Fenwick tree without looking? If no, redo §10. |

### Week 2 — Aug 3 – Aug 9 · Deriving Algorithms

| Lane | What |
| --- | --- |
| **A — Depth** | [Algo A5: Designing Your Own Algorithms](../03_Algorithms/A5_Designing_Your_Own_Algorithms.md) fully; §9 (Boyer–Moore) derived on paper. Then [A1: Correctness Proofs](../03_Algorithms/A1_Correctness_Proofs.md) — the exchange argument is the piece to own. |
| **B — Build** | Implement **reservoir sampling** + the frequency test that proves uniformity (Algo A5 Challenge 4). Then an **LRU cache** from scratch — map + DLL, no `LinkedHashMap`. |
| **C — Work** | Find one place at work where a test or script is O(n²)-ish or does repeated scans. Write up the fix in two paragraphs — even if you do not ship it, send it to someone. |
| **Checkpoint** | Write the exchange argument for interval scheduling from memory. Then break it by switching to earliest-start and produce the counterexample. |

### Week 3 — Aug 10 – Aug 16 · Complexity You Can Defend

| Lane | What |
| --- | --- |
| **A — Depth** | [A2 Complexity First Principles](../02_Data_Structures/A2_DS_Complexity_FirstPrinciples.md) (both DS and [Algo](../03_Algorithms/A2_Complexity_FirstPrinciples.md)) + [A3 Lower Bounds](../03_Algorithms/A3_Lower_Bounds_And_NP.md). Potential-function method until you can apply it unaided. |
| **B — Build** | Build a **dynamic array** and prove its O(1) amortized append three ways (aggregate, accounting, potential). Then **deamortize it** — incremental resizing with worst-case O(1). Feel the difference. |
| **C — Work** | Pick any component you own. Write its complexity + its adversarial input in your team's docs or a PR comment. |
| **🚩 CHECKPOINT 1 (Aug 16)** | **Can you take an unfamiliar operation-contract table and design a structure for it, state the invariants, and prove the bound? If yes, Phase I worked.** |

---

## PHASE II — SDET MASTERY (Weeks 4–6)

*Goal: be the person on your team who knows testing more deeply than anyone. This is your job, so this is where impact is cheapest and most visible.*

### Week 4 — Aug 17 – Aug 23 · Flakiness & Test Architecture

| Lane | What |
| --- | --- |
| **A — Depth** | [Ch26 Flakiness Diagnosis](../21_SDET_Playwright_Automation/05_Advanced_Topics/26_Flakiness_Diagnosis_and_Fixing.md) (the calibration-anchor chapter) + [Ch09 Parallel Execution](../21_SDET_Playwright_Automation/02_Core_Architecture/09_Parallel_Execution_Workers.md) + [Ch28 Test Data Lifecycle](../21_SDET_Playwright_Automation/05_Advanced_Topics/28_Test_Data_Lifecycle_and_Cleanup.md). |
| **B — Build** | Build a **flake detector** from scratch — parse your suite's result JSON over N runs, compute per-test flake rate, output the ranked list. (This is [CAP_C1](../21_SDET_Playwright_Automation/challenges/CAP_C1_Flaky_Test_Detector.md).) |
| **C — Work** | Run the detector on your team's actual suite. **Bring the top-5 flaky tests to your lead with the diagnosis, not just the list.** This single action has converted trainees. |
| **Checkpoint** | Can you name all 9 flakiness types and the diagnostic that distinguishes them? |

### Week 5 — Aug 24 – Aug 30 · Test Operations & CI

| Lane | What |
| --- | --- |
| **A — Depth** | [Ch62 Enterprise Test Operations](../21_SDET_Playwright_Automation/04_Enterprise_Architecture/62_Enterprise_Test_Operations.md) + [Ch25 CI/CD](../21_SDET_Playwright_Automation/05_Advanced_Topics/25_CICD_Integration_GitHub_Azure.md) + [Ch48 Sharding](../21_SDET_Playwright_Automation/05_Advanced_Topics/48_Sharding_And_Test_Selection.md). |
| **B — Build** | Extend last week's detector into the **quarantine workflow**: auto-label, track age, emit the weekly report (Ch62 §3). |
| **C — Work** | Write your team's **flake SLA** (Ch62 Challenge 1) as a one-page doc with real names in the escalation path. Circulate it. Even if rejected, you authored the org's first version. |
| **Checkpoint** | Do you know your team's actual pipeline duration, flake rate, and gate tiers? If not — measure them this week. That measurement *is* the deliverable. |

### Week 6 — Aug 31 – Sep 6 · Emulation & The Environment Axis

| Lane | What |
| --- | --- |
| **A — Depth** | [Ch61 Emulation & Environment Simulation](../21_SDET_Playwright_Automation/05_Advanced_Topics/61_Emulation_Clock_Network_And_Devices.md) + [Ch56 Config Deep Dive](../21_SDET_Playwright_Automation/02_Core_Architecture/56_Playwright_Config_Deep_Dive.md). |
| **B — Build** | Add to a real suite: one `page.clock` test that collapses a slow time-dependent test, and one CDP-throttled test that catches a double-submit. |
| **C — Work** | Demo the clock test to your team. "This 30-minute session-timeout test now runs in 2 seconds and is deterministic" is a **memorable** contribution. |
| **🚩 CHECKPOINT 2 (Sep 6)** | **Has your team's suite measurably improved because of you — flake rate, runtime, or coverage of a class of bug? Name the number.** |

---

## PHASE III — BACKEND + DATA (Weeks 7–9)

*Goal: stop being "the test person." Demonstrate you can build and reason about the system under test.*

### Week 7 — Sep 7 – Sep 13 · Spring Internals

| Lane | What |
| --- | --- |
| **A — Depth** | [Ch55 Spring Internals](../07_Modern_Java/Ch55_Spring_Internals.md) — especially §12A–12H (the filter/interceptor/request pipeline). Then [Ch58 SB Deep Reasoning](../07_Modern_Java/Ch58_SB_Deep_Reasoning.md). |
| **B — Build** | Build a **tiny DI container** from scratch — scan for annotations, resolve constructor dependencies, detect cycles. ~200 lines. You will never find Spring mysterious again. |
| **C — Work** | Next time a backend bug appears, be the one who explains *why* at the framework level (proxy? transaction boundary? filter order?). |
| **Checkpoint** | Trace a request end-to-end: servlet container → filters → DispatcherServlet → interceptors → controller → back. No notes. |

### Week 8 — Sep 14 – Sep 20 · Database Design

| Lane | What |
| --- | --- |
| **A — Depth** | [08_SQL Ch21 Database Internals](../08_SQL/21_Database_Internals.md) + [Ch11 Indexes](../08_SQL/11_Indexes_Performance.md) + [Ch13 Transactions/ACID](../08_SQL/13_Transactions_ACID.md) + [Ch14 Query Optimization](../08_SQL/14_Query_Optimization.md). |
| **B — Build** | **Design a schema from requirements** (not from a tutorial) — pick a domain from your work. Then deliberately break it: write the query that the schema makes slow, and fix it with an index you can justify from the B-tree mechanics. |
| **C — Work** | Read one EXPLAIN plan from your team's slowest real query. Bring the finding. |
| **Checkpoint** | Can you explain why an index makes reads fast *and* writes slower, from the B-tree structure? |

### Week 9 — Sep 21 – Sep 27 · Enterprise Data Reality

| Lane | What |
| --- | --- |
| **A — Depth** | [10_Enterprise/09 Distributed Patterns](../10_Enterprise_Systems/09_Distributed_Patterns.md) + [Ch03 Finance Core](../10_Enterprise_Systems/03_ERP_Finance_Core.md) (transactional discipline) + [13_DE/07 API Design](../13_Developer_Essentials/07_API_Design_REST.md). |
| **B — Build** | Implement an **idempotent endpoint** with a real dedup table + the retry that proves it works. Then break it — concurrent duplicate requests. |
| **C — Work** | Find one place at work where a retry could double-execute. Even just documenting it is valuable. |
| **🚩 CHECKPOINT 3 (Sep 27)** | **Can you design a schema, justify its indexes, and explain the consistency behavior of a multi-step operation? You are now dangerous beyond QA.** |

---

## PHASE IV — SYSTEMS + DEVOPS (Weeks 10–12)

*Goal: the infrastructure literacy that makes you the person who can debug across the whole stack.*

### Week 10 — Sep 28 – Oct 4 · Containers & Pipelines

| Lane | What |
| --- | --- |
| **A — Depth** | [22_DevOps Ch17 Docker](../22_DevOps/17_Docker_Complete.md) + [Ch19 CI/CD](../22_DevOps/19_CICD_Pipelines.md) + [13_DE Ch03 Docker](../13_Developer_Essentials/03_Docker_Containers.md). |
| **B — Build** | Containerize something of yours properly: multi-stage build, non-root, correct PID-1 signal handling. Measure the image size before/after. |
| **C — Work** | Improve one thing in your team's pipeline — cache the dependency install, parallelize a stage, or fix a step that reruns unnecessarily. Time it before and after. |

### Week 11 — Oct 5 – Oct 11 · Networking & Observability

| Lane | What |
| --- | --- |
| **A — Depth** | [22_DevOps Ch06 TCP/UDP](../22_DevOps/06_TCP_UDP_Deep_Dive.md) + [Ch08 HTTP](../22_DevOps/08_HTTP_Complete.md) + [Ch21 Monitoring](../22_DevOps/21_Monitoring_Observability.md) + [13_DE Ch12 Observability](../13_Developer_Essentials/12_Monitoring_Observability.md). |
| **B — Build** | Instrument one of your builds with real metrics + a trace, then answer a question you could not answer before from the data. |
| **C — Work** | Add one *actionable* alert or dashboard panel your team lacks — with the runbook line attached. |

### Week 12 — Oct 12 – Oct 18 · Reliability Thinking

| Lane | What |
| --- | --- |
| **A — Depth** | [22_DevOps Ch22 SRE Practices](../22_DevOps/22_SRE_Practices.md) + [14_MM/18 Production Debugging](../14_Mental_Models/18_Production_Debugging_Thinking.md) + [14_MM/16 Distributed Thinking](../14_Mental_Models/16_Distributed_Systems_Thinking.md). |
| **B — Build** | Take any service you built and inject failure: kill a dependency, add 2s latency, return 500s. Make it degrade gracefully. |
| **C — Work** | Write one blameless postmortem — even for a small incident, even retroactively. Circulate it. |
| **🚩 CHECKPOINT 4 (Oct 18)** | **Given a production symptom, can you bisect it across app / network / infra layers and name the artifacts you would inspect?** |

---

## PHASE V — CONSOLIDATION (Weeks 13–15)

*Goal: make everything you have done legible — to your manager, to an interviewer, and to yourself.*

### Week 13 — Oct 19 – Oct 25 · Portfolio & Evidence

| Lane | What |
| --- | --- |
| **A** | [09_Career/04–06 Career Projects](../09_Career_Reference/04_Career_Projects_Part1.md) + [21_SDET career/PORTFOLIO_PLAN](../21_SDET_Playwright_Automation/career/PORTFOLIO_PLAN.md). |
| **B** | Take your **best** build from weeks 1–12 through the full hardening ladder: tests, README with decisions/trade-offs, deployed, monitored. One deep artifact, not twelve shallow ones. |
| **C** | **Write your impact list.** Every Lane C action from weeks 1–12, with numbers. This is your conversion conversation and your résumé, and you will have forgotten half of it if you do not write it now. |

### Week 14 — Oct 26 – Nov 1 · Interview Readiness

| Lane | What |
| --- | --- |
| **A** | [20_Interview_Mastery](../20_Interview_Mastery/00_INDEX.md) — [01 Interview Brain](../20_Interview_Mastery/01_The_Interview_Brain.md), [02 Constraint→Algorithm](../20_Interview_Mastery/02_Constraint_to_Algorithm_Map.md), [06 System Design Blueprint](../20_Interview_Mastery/06_System_Design_Blueprint.md). Mixed unlabeled problems daily. |
| **B** | Timed mocks — **out loud**, recorded. One DSA, one system design, one SDET-specific. Watch them back; that is where the communication gaps show. |
| **C** | [09_Career/15 Behavioral](../09_Career_Reference/15_Behavioral_Interview.md) — build your story bank from *this plan's own weeks*. You now have real stories: the flake reduction, the SLA doc, the pipeline fix. |

### Week 15 — Nov 2 – Nov 9 · Review & The Conversation

| Lane | What |
| --- | --- |
| **A** | Deep-reasoning files only: [DSA](../03_Algorithms/16_DSA_Deep_Reasoning.md), [Java](../07_Modern_Java/Ch22_Java_Deep_Reasoning.md), [SQL](../08_SQL/23_SQL_Deep_Reasoning.md), [JS](../16_JavaScript/08_JS_Deep_Reasoning.md). These are the freeze-moment files — pure retrieval practice. |
| **B** | Fix whatever the week-14 mocks exposed. Nothing new. |
| **C** | **Have the conversation.** Bring the impact list. Ask directly what the conversion decision depends on and what would change it. Asking is itself a signal — it reads as ownership, not anxiety. |
| **🚩 FINAL CHECKPOINT (Nov 9)** | You have 15 weeks of artifacts, a measured impact list, and interview readiness. Whichever way the decision goes, you are not starting from zero. |

---

## 2. The Rituals (These Are What Make It Work)

### Daily — the derivation drill (Block 3, 45 min)
Take one structure or algorithm and **derive it from its contract**, no notes. Not implement — *derive*. Rotate through: Fenwick, LRU, quickselect, Dijkstra's greedy property, Boyer–Moore, the doubling argument. When one becomes easy, drop it and add a new one.

*Why:* this is the single highest-transfer practice in the plan. It converts [09_Career/12](../09_Career_Reference/12_Brain_Psychology.md)'s "retrieval beats re-reading" into a habit, and it is what makes the A5 chapters permanent rather than read-once.

### Weekly — the review (Sunday, 30 min)
1. What did I **build**? (Lane B artifact — does it exist?)
2. What did my **team see**? (Lane C action — did it land?)
3. What **failed** and what did it teach? (one sentence, into your log)
4. What is **weak** and gets extra time next week?

### Per-checkpoint — the honest audit
At each 🚩, answer the checkpoint question **out loud, to yourself, without notes**. If the answer is shaky, **repeat the phase's weakest week rather than advancing.** The plan is a sequence, not a schedule — falling behind the dates is fine, skipping the capability is not.

### The log
Use [DAILY_LOG_TEMPLATE.md](DAILY_LOG_TEMPLATE.md). Non-negotiable field: **"what I could not do today."** That field is your weakness diagnostic, and it drives what gets extra time. Everything else in the log is optional.

---

## 3. What To Do When (Not If) You Fall Behind

You will have weeks where work is brutal and you study 3 hours total, not 21. That is planned for.

| Situation | Do this |
| --- | --- |
| **One bad day** | Nothing. Never-miss-twice. Resume tomorrow. |
| **One bad week** | Keep only **Lane C** (the work-visible action, ~30 min). Skip A and B guilt-free. Lane C is the highest-leverage lane per minute — that is why it is smallest. |
| **Two bad weeks** | Do not "catch up" by cramming two weeks. **Skip the missed week entirely** and rejoin at the current week. The phases are ordered by leverage, not by dependency — you can miss a week without breaking the next. |
| **A whole phase collapses** | Drop Phase IV (DevOps) first — it is the most deferrable. Never drop Phase II (SDET) — it is your actual job. |
| **You are exhausted** | Rest is part of the plan ([09_Career/12](../09_Career_Reference/12_Brain_Psychology.md)). A burned-out trainee converts at a lower rate than a rested one who did 70% of the plan. |

**The one rule with no exceptions:** the weekly review happens even in a collapsed week. Thirty minutes of "what happened and what is weak" preserves the thread that makes resumption possible.

---

## 4. Adapting This Plan

This plan encodes assumptions. When one is wrong for you, **change the plan, do not abandon it**:

| If… | Change |
| --- | --- |
| Your team is not Playwright-based | Keep the Phase II *concepts* (flakiness, test ops, CI tiers), swap the chapter links to your stack |
| You already know Phase III material | Compress it to one week; expand Phase IV or V |
| The conversion decision moves earlier | Compress Phase IV, keep Phases II and V intact |
| Your role shifts to more dev work | Swap Phase II and Phase III ordering |
| You get an interview opportunity mid-plan | Jump to Week 14 immediately, return afterward |

---

## 📎 Related

- [Daily Practice Index](00_DAILY_PRACTICE_INDEX.md) — the original 3h daily structure this reuses
- [Daily Log Template](DAILY_LOG_TEMPLATE.md) — use it every study day
- [09_Career/13 Daily Habits](../09_Career_Reference/13_Daily_Habits_Tracking.md) — the habit science behind the rituals
- [SDET Readiness Rubric](../21_SDET_Playwright_Automation/career/READINESS_RUBRIC.md) — self-assess at each checkpoint
- [21_SDET career/PROGRESS](../21_SDET_Playwright_Automation/career/PROGRESS.md) — track the SDET-specific track

---

## Reality Check

**"A 15-week plan means I should follow it exactly"** → The plan is a **sequence of capabilities**, and the dates are scaffolding. Falling two weeks behind while genuinely acquiring the Phase I derivation skill is a success; hitting every date while skimming is a failure. The checkpoints — not the calendar — are the real progress measure, which is why each one is a question you answer out loud rather than a box you tick.

**"Studying hard is what converts a trainee to FTE"** → Conversion decisions are made by people using the evidence they can see, and private study is invisible. That is the entire reason Lane C exists and is protected even in collapsed weeks: a merged PR that removed a flaky test class, a circulated flake SLA, a measured pipeline improvement. Depth without visible artifacts optimizes the wrong variable — and this is the most common mistake ambitious trainees make.

**"I should maximize breadth to look well-rounded"** → Breadth without depth reads as shallow, and this plan is deliberately **depth-first inside a broad frame**: one phase per domain, one deep build per week, one hardened portfolio artifact at the end rather than twelve half-finished ones. The range (SDET + backend + data + infra) comes from the phase sequence; the credibility comes from each phase producing something real.

**"If I fall behind, the plan has failed"** → The plan explicitly assumes you will fall behind (§3) — you have a full-time job and a finite nervous system. It degrades gracefully by design: Lane C alone in a bad week, skip-don't-cram for missed weeks, and a documented drop-order (Phase IV first, Phase II never). A plan that only works at 100% adherence is a plan that fails in week 3.

**"The goal is to be ready by November 9"** → The goal is to be *materially more capable and more visible* than you were on July 27, and to have that be legible to the person making the decision. The date is when someone else decides something; the capability is yours permanently, and it transfers whether you convert, extend, or interview elsewhere. Optimize for the capability and the impact list — the date takes care of itself.
