# Sitemap — `21_SDET_Playwright_Automation/`

One-page map of what's in this module. Use it when you can't remember where something lives.

> **First time here?** Don't read this — open [`WHERE_TO_START.md`](../../README.md) instead. This file is for when you know what you want and just need the path.

---

## Top-level markdown files

| File                                                         | What it is                                                                                                | Open this if…                                               |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| [`00_INDEX.md`](../../00_INDEX.md)                               | Canonical sequential index of all chapters (Ch00–Ch62; the former P1–P10 extension was folded in or cut during the Phase 6 audit), with reading time and dependency map. | …you want the **full list** in order.                       |
| [`00_Start_Here.md`](../../README.md)                     | Original onboarding doc — three reading paths by background. Pre-dates the overlays.                      | …you want the legacy author-written intro.                  |
| [`WHERE_TO_START.md`](../../README.md)                   | 60-second decision tree that routes you to one of the pathway files.                                      | …you're new and overwhelmed.                                |
| [`LENS_INDEX.md`](./LENS_INDEX.md)                           | One-line switchboard pointing at every overlay file (this file, the pathways, the maps).                  | …you forgot which overlay file does what.                   |
| [`PATHWAY_01_LEARNING.md`](../learning_paths/PATHWAY_01_LEARNING.md)         | Ordered track: junior → mid-level SDET. ~80–110 h.                                                        | …you're new to test automation and want a curated sequence. |
| [`PATHWAY_02_PROFESSIONAL.md`](../learning_paths/PATHWAY_02_PROFESSIONAL.md) | Ordered track: mid → senior → principal SDET. ~130–180 h.                                                 | …you already work as an SDET and want to level up.          |
| [`PATHWAY_03_OFFICE.md`](../learning_paths/PATHWAY_03_OFFICE.md)             | Problem-indexed quick lookup ("My test is flaky" → here).                                                 | …something is broken at work and you need an answer now.    |
| [`MAP_CODE_TO_CHAPTER.md`](./MAP_CODE_TO_CHAPTER.md)         | Reverse map: framework file → chapter that teaches it.                                                    | …you're reading `framework/` code and want the explanation. |
| [`READINESS_RUBRIC.md`](../../career/READINESS_RUBRIC.md)               | Self-assessment scorecard: 12 competencies × 5 bands (Junior → Principal).                                | …you want to honestly rate where you are.                   |
| [`CONTEXT.md`](../../_meta/CONTEXT.md)                                 | Folder governance, writing style, boundaries with other modules.                                          | …you're a contributor, not a reader.                        |
| [`README.md`](../../README.md)                                   | **The module front door** — one ordered learning path through the nine stages.                                             | …you came in from GitHub.                                   |
| [`SDET_PROBLEM_SETS.md`](../../09_Practice_And_Quizzes/SDET_PROBLEM_SETS.md)             | Extra problem sets and exercises.                                                                         | …you finished the quizzes and want more practice.           |

---

## The 9 stage folders (the curriculum, in learning order)

Chapter numbers are permanent IDs, not reading order; each stage's `README.md` gives the order.

| Folder | Chapters | Topic |
| --- | --- | --- |
| [`01_Foundations/`](../../01_Foundations/README.md) | Ch00–04, 55, 56 | SDET mindset, first test, Playwright basics, locators, JS/TS, browser console, Trace Viewer, config |
| [`02_Test_Architecture/`](../../02_Test_Architecture/README.md) | Ch05–09, 64 | POM, fixtures, `test.step` structure, browser internals, parallel workers, dynamic locators |
| [`03_Real_World_Scenarios/`](../../03_Real_World_Scenarios/README.md) | Ch28, 30, 31, 41, 42, 49, 50, 57, 58, 61, 67 | Mocking, async polling, test data, DB checks, logins (OAuth/SAML/MFA/OTP/passkeys), email, files, emulation, GraphQL/WebSocket, feature flags, payments |
| [`04_Cross_Site_Patterns_And_D365/`](../../04_Cross_Site_Patterns_And_D365/README.md) | Ch10–17 | Six cross-site patterns + a Dynamics 365 case study |
| [`05_Enterprise_Framework/`](../../05_Enterprise_Framework/README.md) | Ch18, 21–24, 27, 44, 63 | Project structure, factories, HTTP layer, API client library, Mega POM, advanced TS, static analysis |
| [`06_CI_CD_And_Reliability/`](../../06_CI_CD_And_Reliability/README.md) | Ch25, 26, 43, 47, 48, 51, 54, 59, 62, 65 | CI/CD, Docker, flakiness, war stories, sharding, reporting, secrets, synthetics, test operations, chaos |
| [`07_Specialised_Testing/`](../../07_Specialised_Testing/README.md) | Ch19, 29, 37–40, 45, 46, 52, 53 | Visual, accessibility, security, performance, contract, component, mutation, BDD, AI/MCP |
| [`08_SDET_to_SDE_Bridge/`](../../08_SDET_to_SDE_Bridge/README.md) | Ch32–36, 60, 66 | CS thinking, algorithms, OOP patterns, TS type system, tool comparison, senior decisions, interviews |
| [`09_Practice_And_Quizzes/`](../../09_Practice_And_Quizzes/README.md) | Quiz 01, Quiz 02, problem sets | MCQ + code challenges with reference solutions |

> Before the 2026-09 restructure the folders were `02_Core_Architecture`, `03_D365_And_Patterns`,
> `04_Enterprise_Architecture`, `05_Advanced_Topics` (27 chapters) and `06_SDET_to_SDE_Bridge`;
> their chapters were redistributed into the stages above, keeping every chapter number.

---

## Supporting folders (code, exercises, careers)

| Folder                                                                 | What's in it                                                                                                                                                                                                                     | Open this if…                                                                  |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| [`framework/`](../../framework/)                                           | Runnable Playwright + TypeScript framework demonstrating every pattern: config, fixtures, POMs, 5-layer API client, custom matchers, analytics CLI, visual/a11y/perf modules, OTel telemetry, Docker. Green on `npm run verify`. | …you want to **read or run** working code.                                     |
| [`projects/starter-playwright-ts/`](../../projects/starter-playwright-ts/) | Stripped-down starter scaffold — copy this when starting a new project from scratch.                                                                                                                                             | …you're bootstrapping a new framework at work.                                 |
| [`challenges/`](../../challenges/)                                         | 7 graded challenges (CH01–CH07) + 3 capstones (CAP_C1/C2/C3) — briefs in the root, reference impls in `challenges/solutions/`.                                                                                                   | …you want to **build** something to prove you learned.                         |
| [`career/`](../../career/)                                                 | Career artifacts: PROGRESS tracker, INTERVIEW_BANK, PORTFOLIO_PLAN, RESUME_BULLETS, CODE_REVIEW_RUBRIC, RFC_TEMPLATE, TEST_STRATEGY_TEMPLATE, DEVSECOPS_THREAD, plus `mock_interviews/` (5 LADDER walkthroughs).                 | …you're preparing for an interview or a promotion.                             |
| [`learn/`](../short_course/)                                                   | Slim 6-doc beginner track (mindset, TS for tests, POM, architecture, browser internals, enterprise structure) — an alternative to the full chapter sequence.                                                                     | …you want a **1-page-each summary** before committing to the full chapters.    |
| [`deep_dives/`](../topic_summaries/)                                         | ~10 short topic-focused notes (a11y, AI/MCP, BDD, component testing, contract testing, cross-site patterns, D365, email, feature flags, mutation testing).                                                                       | …you want a **single-topic deep dive** without working through a full chapter. |
| [`reference/`](../quick_reference/)                                           | 10 quick-reference cards (quickstart, config, locators, fixtures, auth, API testing, parallelism, reliability, file I/O, CI + Docker).                                                                                           | …you need a **5-minute lookup**, not a tutorial.                               |
| [`scripts/`](../../scripts/)                                               | Utility scripts (currently: `generate-stubs.py`).                                                                                                                                                                                | …you're maintaining the curriculum itself.                                     |

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
- ~~INDEX uses **P1–P10** labels for the Principal SDET Extension chapters (`60_…md`–`69_…md`)~~ — Resolved: the P1–P10 extension no longer exists on disk (folded in or cut during the Phase 6 audit). Chapter numbers 61 (`03_Real_World_Scenarios/61_Emulation_Clock_Network_And_Devices.md`) and 62 (`06_CI_CD_And_Reliability/62_Enterprise_Test_Operations.md`) were later reused for new chapters — they are unrelated to the former P-extension. `06_SDET_to_SDE_Bridge/60_Tool_Comparison…` keeps its number.
