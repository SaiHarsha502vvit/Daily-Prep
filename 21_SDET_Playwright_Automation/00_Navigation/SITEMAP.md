# Sitemap — `21_SDET_Playwright_Automation/`

One-page map of what's in this module. Use it when you can't remember where something lives.

> **First time here?** Don't read this — open [`WHERE_TO_START.md`](../WHERE_TO_START.md) instead. This file is for when you know what you want and just need the path.

---

## Top-level markdown files

| File                                                         | What it is                                                                                                | Open this if…                                               |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| [`00_INDEX.md`](../00_INDEX.md)                               | Canonical sequential index of all 70 chapters (Ch01–Ch69 + P1–P10), with reading time and dependency map. | …you want the **full list** in order.                       |
| [`00_Start_Here.md`](../00_Start_Here.md)                     | Original onboarding doc — three reading paths by background. Pre-dates the overlays.                      | …you want the legacy author-written intro.                  |
| [`WHERE_TO_START.md`](../WHERE_TO_START.md)                   | 60-second decision tree that routes you to one of the pathway files.                                      | …you're new and overwhelmed.                                |
| [`LENS_INDEX.md`](./LENS_INDEX.md)                           | One-line switchboard pointing at every overlay file (this file, the pathways, the maps).                  | …you forgot which overlay file does what.                   |
| [`PATHWAY_01_LEARNING.md`](../00_Pathways/PATHWAY_01_LEARNING.md)         | Ordered track: junior → mid-level SDET. ~80–110 h.                                                        | …you're new to test automation and want a curated sequence. |
| [`PATHWAY_02_PROFESSIONAL.md`](../00_Pathways/PATHWAY_02_PROFESSIONAL.md) | Ordered track: mid → senior → principal SDET. ~130–180 h.                                                 | …you already work as an SDET and want to level up.          |
| [`PATHWAY_03_OFFICE.md`](../00_Pathways/PATHWAY_03_OFFICE.md)             | Problem-indexed quick lookup ("My test is flaky" → here).                                                 | …something is broken at work and you need an answer now.    |
| [`MAP_CODE_TO_CHAPTER.md`](./MAP_CODE_TO_CHAPTER.md)         | Reverse map: framework file → chapter that teaches it.                                                    | …you're reading `framework/` code and want the explanation. |
| [`READINESS_RUBRIC.md`](../career/READINESS_RUBRIC.md)               | Self-assessment scorecard: 12 competencies × 5 bands (Junior → Principal).                                | …you want to honestly rate where you are.                   |
| [`CONTEXT.md`](../_meta/CONTEXT.md)                                 | Folder governance, writing style, boundaries with other modules.                                          | …you're a contributor, not a reader.                        |
| [`README.md`](../README.md)                                   | Module-level README for repo browsers (GitHub-style landing).                                             | …you came in from GitHub.                                   |
| [`SDET_PROBLEM_SETS.md`](../08_Practice_And_Quizzes/SDET_PROBLEM_SETS.md)             | Extra problem sets and exercises.                                                                         | …you finished the quizzes and want more practice.           |

---

## The 8 numbered chapter folders (the curriculum)

| Folder                                                         | Chapters                                                     | Topic                                                                                                                                                                                                                                                                      | Hours |
| -------------------------------------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| [`01_Foundations/`](../01_Foundations/)                         | Ch00–04                                                      | SDET mindset, Playwright basics, locators, browser console, JS/TS for automation                                                                                                                                                                                           | ~12 h |
| [`02_Core_Architecture/`](../02_Core_Architecture/)             | Ch05–09, Ch55, Ch56                                          | POM, fixtures, 15-step E2E pattern, browser internals, parallel execution, inspector/trace viewer, config deep-dive                                                                                                                                                        | ~15 h |
| [`03_D365_And_Patterns/`](../03_D365_And_Patterns/)             | Ch10–17                                                      | Dynamics 365 testing + 6 cross-site patterns (sequential, new tab, dual context, token/magic link, UI–API, storageState chaining)                                                                                                                                          | ~18 h |
| [`04_Enterprise_Architecture/`](../04_Enterprise_Architecture/) | Ch18, Ch21–24                                                | Mega POM splitting, project structure, headers/payloads/endpoints factory, APIUtils library, test script architecture                                                                                                                                                      | ~10 h |
| [`05_Advanced_Topics/`](../05_Advanced_Topics/)                 | Ch19, Ch25–31, Ch42–51, Ch57–59, Ch60–69 (a.k.a. **P1–P10**) | CI/CD, flakiness, advanced TS, test data, visual regression, API mocking, AI/MCP, BDD, Allure, sharding, feature flags, email, auth taxonomy, file I/O, Docker, **Principal-SDET extension** (analytics, leadership, cost, SLOs, healing, ADRs, PII, chaos, observability) | ~50 h |
| [`06_SDET_to_SDE_Bridge/`](../06_SDET_to_SDE_Bridge/)           | Ch32–36, Ch60 (Tool Comparison)                              | Interview prep (LADDER), CS thinking, algorithms in testing, OOP patterns, TS type system mastery, Cypress vs Selenium vs WebdriverIO                                                                                                                                      | ~12 h |
| [`07_Specialised_Testing/`](../07_Specialised_Testing/)         | Ch37–41, Ch53                                                | Performance (Lighthouse, k6), contract testing (Pact), accessibility (axe-core), security (OWASP ZAP), GraphQL/WebSocket, mutation testing (Stryker)                                                                                                                       | ~10 h |
| [`08_Practice_And_Quizzes/`](../08_Practice_And_Quizzes/)       | Quiz 01 + Quiz 02 + solutions                                | MCQ + code challenges with reference solutions                                                                                                                                                                                                                             | ~6 h  |

---

## Supporting folders (code, exercises, careers)

| Folder                                                                 | What's in it                                                                                                                                                                                                                     | Open this if…                                                                  |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| [`framework/`](../framework/)                                           | Runnable Playwright + TypeScript framework demonstrating every pattern: config, fixtures, POMs, 5-layer API client, custom matchers, analytics CLI, visual/a11y/perf modules, OTel telemetry, Docker. Green on `npm run verify`. | …you want to **read or run** working code.                                     |
| [`projects/starter-playwright-ts/`](../projects/starter-playwright-ts/) | Stripped-down starter scaffold — copy this when starting a new project from scratch.                                                                                                                                             | …you're bootstrapping a new framework at work.                                 |
| [`challenges/`](../challenges/)                                         | 7 graded challenges (CH01–CH07) + 3 capstones (CAP_C1/C2/C3) — briefs in the root, reference impls in `challenges/solutions/`.                                                                                                   | …you want to **build** something to prove you learned.                         |
| [`career/`](../career/)                                                 | Career artifacts: PROGRESS tracker, INTERVIEW_BANK, PORTFOLIO_PLAN, RESUME_BULLETS, CODE_REVIEW_RUBRIC, RFC_TEMPLATE, TEST_STRATEGY_TEMPLATE, DEVSECOPS_THREAD, plus `mock_interviews/` (5 LADDER walkthroughs).                 | …you're preparing for an interview or a promotion.                             |
| [`learn/`](../learn/)                                                   | Slim 6-doc beginner track (mindset, TS for tests, POM, architecture, browser internals, enterprise structure) — an alternative to the full chapter sequence.                                                                     | …you want a **1-page-each summary** before committing to the full chapters.    |
| [`deep_dives/`](../deep_dives/)                                         | ~10 short topic-focused notes (a11y, AI/MCP, BDD, component testing, contract testing, cross-site patterns, D365, email, feature flags, mutation testing).                                                                       | …you want a **single-topic deep dive** without working through a full chapter. |
| [`reference/`](../reference/)                                           | 10 quick-reference cards (quickstart, config, locators, fixtures, auth, API testing, parallelism, reliability, file I/O, CI + Docker).                                                                                           | …you need a **5-minute lookup**, not a tutorial.                               |
| [`scripts/`](../scripts/)                                               | Utility scripts (currently: `generate-stubs.py`).                                                                                                                                                                                | …you're maintaining the curriculum itself.                                     |

---

## What's intentionally NOT inside this module

| Topic                          | Lives in                          | Why elsewhere                                                                                |
| ------------------------------ | --------------------------------- | -------------------------------------------------------------------------------------------- |
| Native mobile testing (Appium) | `23_Mobile_Dev_And_Testing/`      | Different runtime, different SDK — keeping it separate avoids muddling the Playwright story. |
| Backend API design             | `01_API_Design/` (sibling module) | Production code, not test code.                                                              |
| Pure JS/TS language reference  | `04_JS_TS_Mastery/` (sibling)     | Cross-cutting; Ch04 here just covers the test-relevant subset.                               |

---

## Stale / known-issue notes

- `_Curriculum/` at the **repo root** (not inside this module) is a partial draft mirror (3 files: Ch65, Ch66, Ch67) from an intermediate Kimi-2.6 session. Pending user decision; not deleted, not authoritative.
- ~~Two `46_5_Playwright_Config_Deep_Dive.md` files~~ — Resolved: the canonical (1460 L) version was renamed to `02_Core_Architecture/57_Playwright_Config_Theory_Catalog.md`; the brief overview (668 L) was deleted as redundant with Ch56.
- INDEX uses **P1–P10** labels for the Principal SDET Extension chapters whose files are named `60_…md` through `69_…md` — this is intentional to avoid colliding with `06_SDET_to_SDE_Bridge/60_Tool_Comparison…`.
