# Where to start

This folder has 70+ chapters, a runnable framework, 10 capstones, a career system, and several supporting docs. If you don't know where to open, that's fair — it's a lot. **One question first:**

> ## What brings you here today?

Pick the one closest to you. Each branch is short and points at the next file to open.

---

## A. I'm new to test automation

You can write some code (any language) but you haven't built a real test suite. You want a sequence to follow without thinking about which file is next.

**Open:** [`PATHWAY_01_LEARNING.md`](./PATHWAY_01_LEARNING.md)

It's an ordered reading list of ~15 chapters with checkpoints, time estimates ("90 min", "2 hrs"), and built-in pause points. By the end you'll be writing your own POM-based test suite with fixtures.

**Time commitment:** ~80–110 hours, spread over 6–10 weeks.

**Not this one if** you already know Playwright fundamentals — go to (B) instead.

---

## B. I'm a working SDET. I want to level up

You write Playwright tests at work. You want senior, staff, or principal next. You don't need to be told what a locator is.

**Open:** [`PATHWAY_02_PROFESSIONAL.md`](./PATHWAY_02_PROFESSIONAL.md)

This skips fundamentals and jumps straight to: enterprise architecture (POM splitting, fixture hierarchies, 5-layer API client), CI/CD at scale, flakiness diagnosis, the 10 Principal SDET topics (analytics, leadership, cost, SLOs, healing, ADRs, PII, test impact, chaos, observability), and the [`READINESS_RUBRIC.md`](./READINESS_RUBRIC.md) for self-assessment. Each chapter is tagged with which competency in the rubric it unlocks.

**Time commitment:** ~130–180 hours.

**Not this one if** you're prepping for an interview in the next 4 weeks — see (E).

---

## C. I have a real problem at work right now

Something's broken, due tomorrow, or you need an answer in the next 15 minutes. You don't have time for a curriculum.

**Open:** [`PATHWAY_03_OFFICE.md`](./PATHWAY_03_OFFICE.md)

It's a problem-indexed lookup. Examples of what's in there:

- *My test is flaky*
- *I need to test an OAuth login*
- *How do I upload a file from a CSV?*
- *I need to write a test strategy doc*
- *We need to shard the suite to fit in our CI budget*
- *I need to integrate axe-core / Lighthouse / Pact / Stryker*
- *My PM is asking why our tests cost $X/month*

Each entry points to 2–4 chapters and the relevant framework code.

**Also useful for office work:** the [`reference/`](./reference/) folder has 10 short cheat-sheet cards (quickstart, config, locators, fixtures, auth, API, parallelism, reliability, file I/O, CI+Docker).

---

## D. I'm reading the `framework/` code and want to understand *why*

You opened, say, `framework/fixtures/auth.fixture.ts`, saw `proper-lockfile` and wondered "why a lockfile?". You want the chapter that explains the design.

**Open:** [`MAP_CODE_TO_CHAPTER.md`](./MAP_CODE_TO_CHAPTER.md)

It's a reverse index — every meaningful file in `framework/` → the chapter(s) that teach the concept and one-line "what this demonstrates". Use it to read the code top-down: open a file, look up its row, read that chapter.

---

## E. I have an interview soon

You have an SDET interview in days or weeks. You want focused prep, not a full curriculum.

**Open these three, in this order:**

1. [`06_SDET_to_SDE_Bridge/32_SDET_Interview_Prep.md`](./06_SDET_to_SDE_Bridge/32_SDET_Interview_Prep.md) — the LADDER framework + STAR answers + live-coding format.
2. [`career/mock_interviews/`](./career/mock_interviews/) — 5 LADDER walkthroughs (Design Round, System Design, Coding, Behavioral, Hiring Manager).
3. [`career/INTERVIEW_BANK.md`](./career/INTERVIEW_BANK.md) — question bank with worked answers.

If you have **more than 2 weeks**, also work through Ch33–36 (CS thinking, algorithms in testing, OOP patterns, TS type system). Otherwise stick to the three above.

---

## F. None of the above

You want to browse, search, or you already know exactly what you want. Two options:

- [`00_INDEX.md`](./00_INDEX.md) — full sequential list of every chapter, with reading time and dependencies. Read this if you want the canonical view.
- [`SITEMAP.md`](./SITEMAP.md) — one-page map of every folder and file with "open this if…" guidance.

---

## A note on what's where

| Type of thing | Where it lives |
|---------------|----------------|
| **Theory** (concepts, patterns, anti-patterns) | The 8 numbered chapter folders (`01_Foundations/` through `08_Practice_And_Quizzes/`). |
| **Runnable code** | [`framework/`](./framework/) — green on `npm run verify`. |
| **Exercises** | [`challenges/`](./challenges/) — 7 graded challenges + 3 capstones, with reference solutions. |
| **Career artifacts** | [`career/`](./career/) — rubrics, templates, mock interviews. |
| **Quick lookups** | [`reference/`](./reference/) — 10 short cheat-sheet cards. |
| **Single-topic deep dives** | [`deep_dives/`](./deep_dives/) — ~10 short topic notes. |
| **Starter scaffold** | [`projects/starter-playwright-ts/`](./projects/starter-playwright-ts/) — copy this to start a new project. |

---

## If you're still stuck

Open [`00_INDEX.md`](./00_INDEX.md). It's the canonical list of everything in this module. Look for whatever phrase fits your situation.

Or close this file, come back tomorrow with fresh eyes. Nothing here is going anywhere.
