**Navigation**: [Back to Index](../00_MASTER_INDEX.md)

# 🗓️ Weekend SDET Upskilling Plan — JavaScript → TypeScript → Playwright

> **Created:** Sunday, 09 August 2026
> **Format:** Saturdays + Sundays only (you work weekdays)
> **Goal:** Become a stronger SDET — real depth in JS, then TS, then Playwright
> **Span:** 18 weekends, Sat 15 Aug 2026 → Sun 13 Dec 2026

---

## Why This Order (JS → TS → Playwright)

This isn't arbitrary sequencing. Each layer is the *substrate* the next one runs on, and skipping ahead is exactly why many automation engineers plateau:

- **JavaScript first** — Playwright tests are JS/TS programs. Every flaky test you'll ever debug traces back to async behavior, event-loop ordering, or DOM lifecycle. If `await`, promises, and closures aren't second nature, you'll be pattern-matching Playwright syntax instead of reasoning about *why* a test failed.
- **TypeScript second** — Playwright's API is TypeScript-first. Its fixtures, custom matchers, and page-object patterns lean hard on generics, utility types, and interfaces. Learning TS *after* JS means you understand what TS is adding, rather than treating types as syntax noise to satisfy the compiler.
- **Playwright last** — by then you're not learning "a tool," you're applying two languages you already understand to a testing problem. That's the difference between an automation *user* and an SDET.

**The SDET-specific payoff:** `09_Browser_Internals_Rendering`, `12_V8_Engine_Internals`, `13_NodeJS_Architecture`, and `14_Browser_Engines_And_Chromium_Architecture` in the JS module are deliberately scheduled next to the Playwright architecture material — because Playwright's whole design (CDP, browser contexts, auto-waiting, the Node-side test runner driving a browser-side page) only makes sense once you know what a browser and a Node process actually do.

---

## How Each Study Day Works

**Core block: 3 hours.** Stretch block: +1 hour if you have it. Skipping the stretch is fine; skipping the core isn't.

| Block | What | Time |
|---|---|---|
| 📖 **Read** | One chapter, actively. Not a skim — stop at every code block and predict the output *before* reading on. | 45 min |
| ⌨️ **Type** | Retype every code example by hand and run it. No copy-paste. Break it on purpose, see the error. | 45 min |
| 🧩 **Practice** | The chapter's Section Challenge + matching problem-set questions. Write the answer before opening `<details>`. | 60 min |
| ✍️ **Consolidate** | Write 5-10 lines in your own words: what this chapter changed about how you think. Note ONE thing you still can't explain. | 30 min |
| 🔁 *Stretch* | *Revisit last weekend's "can't explain" note. Answer it, or bring it to Claude.* | *60 min* |

**The rule that makes this work:** if you can't explain a concept out loud without looking, you haven't learned it — you've read it. The "can't explain" note is the most valuable line you write each day.

---

## Phase 1 — JavaScript (Weekends 1-5)

Source: [`16_JavaScript/`](../16_JavaScript/00_INDEX.md) · Problems: [`16_PROBLEM_SETS.md`](../16_JavaScript/16_PROBLEM_SETS.md)

### Weekend 1 — Sat 15 Aug / Sun 16 Aug
- [ ] **Sat:** [01_JS_Foundations](../16_JavaScript/01_JS_Foundations.md) — types, coercion, scope, hoisting
- [ ] **Sun:** [02_JS_Functions_Closures](../16_JavaScript/02_JS_Functions_Closures.md) — closures, `this`, call/apply/bind
- [ ] 🎯 *SDET link:* closures are how test fixtures hold state between setup and teardown

### Weekend 2 — Sat 22 Aug / Sun 23 Aug
- [ ] **Sat:** [03_JS_Objects_Prototypes](../16_JavaScript/03_JS_Objects_Prototypes.md) — prototype chain, inheritance
- [ ] **Sun:** [04_JS_Async_Promises](../16_JavaScript/04_JS_Async_Promises.md) ⭐ — event loop, microtasks, promise combinators
- [ ] 🎯 *SDET link:* **the single most important JS chapter for you.** Every `await page.click()`, every race-condition flake, every "element not attached" error lives here. Do not rush this one — if a weekend runs long, let it be this one.

### Weekend 3 — Sat 29 Aug / Sun 30 Aug
- [ ] **Sat:** [05_JS_DOM_BrowserAPIs](../16_JavaScript/05_JS_DOM_BrowserAPIs.md) — DOM tree, events, bubbling/capture
- [ ] **Sun:** [06_JS_Modern_ES6Plus](../16_JavaScript/06_JS_Modern_ES6Plus.md) — destructuring, modules, optional chaining
- [ ] 🎯 *SDET link:* DOM traversal + event model = why your locator matched 3 elements, and why `click()` fired but nothing happened

### Weekend 4 — Sat 5 Sep / Sun 6 Sep
- [ ] **Sat:** [07_JS_Error_Handling_Debugging](../16_JavaScript/07_JS_Error_Handling_Debugging.md) — error types, stack traces, async errors
- [ ] **Sun:** [08_JS_Deep_Reasoning](../16_JavaScript/08_JS_Deep_Reasoning.md) — the "why" chapter
- [ ] 🎯 *SDET link:* reading an async stack trace correctly is a daily SDET skill

### Weekend 5 — Sat 12 Sep / Sun 13 Sep — **JS Checkpoint**
- [ ] **Sat:** [09_Browser_Internals_Rendering](../16_JavaScript/09_Browser_Internals_Rendering.md) — parse, layout, paint, composite
- [ ] **Sun:** [13_NodeJS_Architecture](../16_JavaScript/13_NodeJS_Architecture.md) — libuv, event loop phases, streams
- [ ] ✅ **Checkpoint:** work through [`16_PROBLEM_SETS.md`](../16_JavaScript/16_PROBLEM_SETS.md). Can you explain the event loop, closures, and the prototype chain out loud, cold? If not, repeat the weak chapter before moving on.

> *Deferred by design:* `10_Web_Workers_ServiceWorkers`, `11_Advanced_Web_APIs`, `12_V8_Engine_Internals`, `14_Browser_Engines_And_Chromium_Architecture` are scheduled later (Weekend 11), where they pair directly with Playwright's browser architecture and actually land.

---

## Phase 2 — TypeScript (Weekends 6-8)

Source: [`17_TypeScript/`](../17_TypeScript/00_INDEX.md) · Problems: [`17_PROBLEM_SETS.md`](../17_TypeScript/17_PROBLEM_SETS.md)

### Weekend 6 — Sat 19 Sep / Sun 20 Sep
- [ ] **Sat:** [01_TS_Foundations](../17_TypeScript/01_TS_Foundations.md) — structural typing, inference, narrowing
- [ ] **Sun:** [02_TS_Advanced_Types](../17_TypeScript/02_TS_Advanced_Types.md) ⭐ — generics, conditional & mapped types, utility types
- [ ] 🎯 *SDET link:* Playwright's `test.extend<MyFixtures>()` is generics. Custom matchers are declaration merging. This chapter is why they work.

### Weekend 7 — Sat 26 Sep / Sun 27 Sep
- [ ] **Sat:** [03_TS_Patterns_BestPractices](../17_TypeScript/03_TS_Patterns_BestPractices.md) — practical patterns
- [ ] **Sun:** [04_TS_Deep_Reasoning](../17_TypeScript/04_TS_Deep_Reasoning.md) — the "why" chapter
- [ ] 🎯 *SDET link:* typed page objects catch broken selectors at compile time instead of at 2am in CI

### Weekend 8 — Sat 3 Oct / Sun 4 Oct — **TS Checkpoint**
- [ ] **Sat:** [05_TS_Decorators_Metaprogramming](../17_TypeScript/05_TS_Decorators_Metaprogramming.md)
- [ ] **Sun:** [06_TS_Module_System_Performance](../17_TypeScript/06_TS_Module_System_Performance.md) — `tsconfig`, module resolution, build perf
- [ ] ✅ **Checkpoint:** [`17_PROBLEM_SETS.md`](../17_TypeScript/17_PROBLEM_SETS.md). You should be able to write a generic function with a constrained type parameter without looking it up.

---

## Phase 3 — Playwright (Weekends 9-18)

Source: [`21_SDET_Playwright_Automation/`](../21_SDET_Playwright_Automation/00_Start_Here.md) · Challenges: [`challenges/`](../21_SDET_Playwright_Automation/challenges/README.md)

**Shift in rhythm:** from here, every weekend ends with *working code you wrote*, not just a chapter you read. Sat = learn, Sun = build.

### Weekend 9 — Sat 10 Oct / Sun 11 Oct
- [ ] **Sat:** [00_SDET_Foundations_Mindset](../21_SDET_Playwright_Automation/01_Foundations/00_SDET_Foundations_Mindset.md) + [00_Testing_Fundamentals](../21_SDET_Playwright_Automation/01_Foundations/00_Testing_Fundamentals/)
- [ ] **Sun:** [01_Environment_Setup_and_First_Test](../21_SDET_Playwright_Automation/01_Foundations/01_Environment_Setup_and_First_Test.md) — get a real test running locally

### Weekend 10 — Sat 17 Oct / Sun 18 Oct
- [ ] **Sat:** [01_Playwright_TS_Basics](../21_SDET_Playwright_Automation/01_Foundations/01_Playwright_TS_Basics.md) + [04_JS_TS_For_Automation](../21_SDET_Playwright_Automation/01_Foundations/04_JS_TS_For_Automation.md)
- [ ] **Sun:** [02_Enterprise_Locators_XPath](../21_SDET_Playwright_Automation/01_Foundations/02_Enterprise_Locators_XPath.md) + [03_Browser_Console_Scripting](../21_SDET_Playwright_Automation/01_Foundations/03_Browser_Console_Scripting.md)
- [ ] 🏗️ **Challenge:** [CH01_Core_Infrastructure](../21_SDET_Playwright_Automation/challenges/CH01_Core_Infrastructure.md)

### Weekend 11 — Sat 24 Oct / Sun 25 Oct — *browser internals week*
- [ ] **Sat:** [02_Core_Architecture](../21_SDET_Playwright_Automation/02_Core_Architecture/) — how Playwright actually drives a browser
- [ ] **Sun:** JS deep-dives that now pay off: [12_V8_Engine_Internals](../16_JavaScript/12_V8_Engine_Internals.md) + [14_Browser_Engines_And_Chromium_Architecture](../16_JavaScript/14_Browser_Engines_And_Chromium_Architecture.md)
- [ ] 🏗️ **Challenge:** [CH02_Single_Website_POM](../21_SDET_Playwright_Automation/challenges/CH02_Single_Website_POM.md)

### Weekend 12 — Sat 31 Oct / Sun 1 Nov
- [ ] **Sat/Sun:** [03_D365_And_Patterns](../21_SDET_Playwright_Automation/03_D365_And_Patterns/) — Page Object Model done properly
- [ ] 🏗️ **Challenge:** [CH03_API_UI_Cross_Validation](../21_SDET_Playwright_Automation/challenges/CH03_API_UI_Cross_Validation.md)

### Weekend 13 — Sat 7 Nov / Sun 8 Nov
- [ ] **Sat/Sun:** [04_Enterprise_Architecture](../21_SDET_Playwright_Automation/04_Enterprise_Architecture/) — fixtures, config, scaling a suite
- [ ] 🏗️ **Challenge:** [CH04_New_Tab_Scenario](../21_SDET_Playwright_Automation/challenges/CH04_New_Tab_Scenario.md)

### Weekend 14 — Sat 14 Nov / Sun 15 Nov
- [ ] **Sat/Sun:** [05_Advanced_Topics](../21_SDET_Playwright_Automation/05_Advanced_Topics/) part 1 (network, auth, parallelism)
- [ ] 🏗️ **Challenge:** [CH05_Cross_Website_Data_Bridge](../21_SDET_Playwright_Automation/challenges/CH05_Cross_Website_Data_Bridge.md)

### Weekend 15 — Sat 21 Nov / Sun 22 Nov
- [ ] **Sat/Sun:** [05_Advanced_Topics](../21_SDET_Playwright_Automation/05_Advanced_Topics/) part 2 (flakiness, retries, tracing)
- [ ] 🏗️ **Challenge:** [CH06_Understand_Auth_Fixture](../21_SDET_Playwright_Automation/challenges/CH06_Understand_Auth_Fixture.md)

### Weekend 16 — Sat 28 Nov / Sun 29 Nov
- [ ] **Sat/Sun:** [07_Specialised_Testing](../21_SDET_Playwright_Automation/07_Specialised_Testing/) — visual, a11y, performance, mobile
- [ ] 🏗️ **Challenge:** [CH07_Full_Cross_Site_Flow](../21_SDET_Playwright_Automation/challenges/CH07_Full_Cross_Site_Flow.md)

### Weekend 17 — Sat 5 Dec / Sun 6 Dec — **capstone 1**
- [ ] **Sat:** [06_SDET_to_SDE_Bridge](../21_SDET_Playwright_Automation/06_SDET_to_SDE_Bridge/)
- [ ] 🏆 **Capstone:** [CAP_C1_Flaky_Test_Detector](../21_SDET_Playwright_Automation/challenges/CAP_C1_Flaky_Test_Detector.md)

### Weekend 18 — Sat 12 Dec / Sun 13 Dec — **capstone 2 + close-out**
- [ ] 🏆 **Capstone:** [CAP_C2_Custom_Reporter](../21_SDET_Playwright_Automation/challenges/CAP_C2_Custom_Reporter.md)
- [ ] 🏆 **Capstone:** [CAP_C3_Test_Analytics_Dashboard](../21_SDET_Playwright_Automation/challenges/CAP_C3_Test_Analytics_Dashboard.md)
- [ ] ✅ **Final:** [08_Practice_And_Quizzes](../21_SDET_Playwright_Automation/08_Practice_And_Quizzes/) + update your resume with the three capstones

---

## Progress Log

Fill this in as you go — one line per study day. It's the honest record of what stuck.

| Date | Chapter | Rating /5 | The thing I still can't explain |
|---|---|---|---|
| | | | |

---

## If You Miss a Weekend

You will miss some. Plan for it now so it doesn't turn into quitting:

- **Missed one day** — do it next weekend as a third session, or just drop it and move on. The schedule is a guide, not a debt.
- **Missed a whole weekend** — shift everything one weekend later. Don't try to double up; two chapters in one day is how you end up reading without absorbing.
- **Fell behind by a month** — don't restart. Skip forward to where the current phase is and keep going; you can backfill the middle later. Momentum beats completeness.

The one thing that *isn't* negotiable: **don't skip Weekend 2 (async) or Weekend 6 (advanced types).** Everything downstream leans on those two.

---

## Using This With Claude

Each study day, just say what you're working on — e.g. *"Weekend 3 Saturday, DOM chapter"* — and Claude will pull the local date, confirm where you are in the plan, and work through it with you: explaining, quizzing, reviewing your code, or debugging your challenge attempt.

Good prompts for a study session:
- *"Quiz me on last weekend's chapter before I start today's"*
- *"I wrote this test and it's flaky — here's the code, help me reason about why"*
- *"Explain why this Playwright locator matched 3 elements"*
- *"I couldn't answer my 'can't explain' note from last week: [the question]"*
