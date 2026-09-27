# 01. Mindset

> **Canonical lesson:** [00 SDET Foundations Mindset](../../01_Foundations/00_SDET_Foundations_Mindset.md). This page is a shorter summary kept for quick lookup; the chapter is the maintained version — if the two disagree, trust the chapter.

> What the SDET role actually is, why it differs from developer testing, the pyramid as a tool not a doctrine, and the mental model that separates senior SDETs from script-kiddies.

---

## The role, plainly

A Software Development Engineer in Test (SDET) is a developer whose product is **confidence in the system**. The artifact is code, but the value is signal — does this work? will this break? when?

|                  | Developer                     | SDET                                                             |
| ---------------- | ----------------------------- | ---------------------------------------------------------------- |
| Primary artifact | Production code               | Test code + production observability                             |
| Customer         | End users                     | Other engineers + their customers                                |
| Success metric   | Features shipped, bugs absent | Bugs caught, false positives low, time-to-detection short        |
| Failure mode     | Broken feature                | Broken release confidence — bad signal                           |
| Career ceiling   | CTO, Principal Engineer       | Test Architect, Director of QA, Principal Engineer (with caveat) |

The "with caveat" matters. SDET → Senior SDE is the bridge most successful SDETs walk. Chapter 07 covers it.

---

## Why it's not "just QA"

Manual QA: exercises the app, files bugs.
SDET: designs systems that catch bugs without humans.

The mental shift is from "find one bug today" to "design a thing that finds this class of bugs forever." The deliverable is code, not bug reports.

This is why an SDET who writes 50 Playwright tests but doesn't think about flakiness, isolation, parallelism, or signal quality is a manual QA writing scripts. The role is engineering.

---

## The testing pyramid — useful, not sacred

The classic pyramid:

```
              ╱ E2E ╲       Few, slow, expensive
            ╱─────────╲
          ╱ Integration ╲   Some
        ╱─────────────────╲
      ╱       Unit         ╲ Many, fast, cheap
    ╱─────────────────────────╲
```

It's a heuristic for "where should the bulk of tests live?" Answer: lower-level layers, because they're cheaper and faster.

### Where the pyramid lies

For modern frontend stacks:

- "Unit tests" of a React component without rendering it test nothing useful — they test the wiring, not the behavior.
- "Integration tests" between two services without the network are also mostly wiring tests.
- The MEANINGFUL behavior often lives in the integration between layers.

So the pyramid sometimes inverts. For UI-heavy SPAs:

```
              ╱ Visual ╲      Per-component visual checks
            ╱───────────╲
          ╱  Component   ╲    Component logic
        ╱─────────────────╲
      ╱       E2E           ╲  User-facing flows
    ╱─────────────────────────╲
```

The "diamond" or "trophy" model (Kent C. Dodds): heaviest in integration, with E2E and unit smaller at the ends.

### What actually matters

Not the shape. The questions:

- Where do bugs typically originate? Test there.
- Where is feedback fastest? Test there too.
- What costs the most to maintain? Avoid stacking too much there.

A pyramid that's all E2E is slow and flaky. A pyramid with zero E2E is uninformed about real user behavior. The right shape is your team's, not Martin Fowler's.

---

## The three pillars

Every test investment serves one of:

| Pillar          | Question it answers           | When to invest            |
| --------------- | ----------------------------- | ------------------------- |
| **Correctness** | Does this do the right thing? | Always                    |
| **Reliability** | Will it work tomorrow?        | After hitting flakiness   |
| **Speed**       | Can we iterate fast?          | When feedback is too slow |

These trade against each other. A perfectly correct test that takes 30 minutes blocks deployment. A 1-second test that's flaky teaches you nothing.

The right balance shifts over time:

- Early: optimize for correctness — get coverage of critical paths.
- Mid: optimize for reliability — fix the flakes that erode trust.
- Late: optimize for speed — sharding, parallel, dropping coverage that's not earning.

---

## The "test as code" mindset

Tests are code that runs forever. They have:

- An API (fixtures, helpers).
- A maintenance cost.
- A blast radius when they break.
- Stakeholders (other engineers).

This means:

- Apply DRY where it matters.
- Refactor when patterns emerge.
- Write tests as if a junior will read them next year (because they will).
- Bad tests are debt; sometimes deleting is the right call.

Most SDET teams treat their test code as second-class — write-once, never-refactor, never-review. This is the single biggest unforced error in the industry.

---

## Pillars of an enterprise test framework

What separates "scripts that pass" from "infrastructure that scales":

1. **Locator stability** — survives DOM changes (covered in `reference/03_locators.md`).
2. **Isolation** — tests don't bleed (`reference/07_parallelism.md`, `reference/12_data.md`).
3. **Deterministic waits** — no `waitForTimeout` (`reference/08_reliability.md`).
4. **Layered API client** — tests speak business, not HTTP (`reference/06_api_testing.md`, `learn/06_enterprise_structure.md`).
5. **Fixture-driven setup** — no per-test boilerplate (`reference/04_fixtures.md`).
6. **Observable failures** — trace + screenshot + log every fail (`reference/11_reporting.md`).
7. **Parallel-safe data** — UUIDs, pools, sweepers (`reference/12_data.md`).

A team hitting all 7 has a healthy framework. Most teams hit 3–4. The gap is where the maintenance pain lives.

---

## What makes someone "senior" at this

Three observable behaviours:

1. **Designs for the failure mode, not the happy path.** Knows the test will fail; designs the failure to be actionable. Trace on, descriptive error messages, isolation that prevents cascading.

2. **Removes tests as readily as adds them.** A test catching a class of bug nobody will ever introduce again is debt. Senior SDETs delete with judgment.

3. **Frames trade-offs in business terms.** "We could reduce flakes by 80% by adding 20s setup per test, slowing CI by 3 minutes — is the team's confidence worth the 3 minutes?" The technical questions ARE business questions.

If you don't see yourself making these calls yet, this curriculum is for you.

---

## What's next

- [02. TypeScript for tests](./02_typescript_for_tests.md) — making the type system work for you.
- [03. POM thinking](./03_pom.md) — when patterns earn their complexity.
- [`reference/01_quickstart.md`](../quick_reference/01_quickstart.md) — get the framework running if you haven't.
- [`reference/08_reliability.md`](../quick_reference/08_reliability.md) — the 10 classes of flakiness. Required reading for the senior level.
