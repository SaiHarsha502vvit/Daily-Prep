**Navigation**: [Start Here](00_START_HERE.md) | [Pace Log](02_Pace_Log.md) | [Audit Log](03_Content_Audit_Log.md) | [Master Index](../00_MASTER_INDEX.md)

# 🗓️ Weekend SDET Plan — Block 1 (JavaScript Core)

> **Created:** Sunday, 09 August 2026
> **This block:** 3 weekends — Sat 15 Aug → Sun 30 Aug 2026
> **Then:** we measure actual pace and plan Block 2 from real data, not guesses
> **Track:** JavaScript → TypeScript → Playwright · Goal: stronger SDET

---

## Why Only 3 Weekends

Planning 18 weekends up front assumes I know how fast you move through a 1,187-line chapter while typing every example by hand. I don't, and neither do you yet. So this block commits to three weekends, ends with a checkpoint that *measures* your real pace, and Block 2 gets built from that number.

Two things this protects against: a schedule so aggressive you fall behind in week 3 and quit, and one so soft you finish Block 1 having learned less than you could have.

---

## What Block 1 Covers (and What It Deliberately Skips)

Four chapters, chosen by **what breaks Playwright tests**, not by chapter order:

| Priority for an SDET | Chapter | Why it's in Block 1 |
|---|---|---|
| 🔴 Critical | `04_JS_Async_Promises` | Every flaky test, every race condition, every "element not attached" |
| 🔴 Critical | `05_JS_DOM_BrowserAPIs` | Every locator, every click that fired but did nothing |
| 🟠 High | `02_JS_Functions_Closures` | Closures = how fixtures hold state; `this` = a daily footgun |
| 🟡 Base | `01_JS_Foundations` | Coercion and scope rules that silently corrupt assertions |

**Deliberately deferred to Block 2:** `03_JS_Objects_Prototypes` and `06_JS_Modern_ES6Plus`. Both are genuinely valuable — prototypes explain how Playwright's classes work, ES6+ is everywhere in modern test code — but neither is what makes a test *flake at 2am*. Async and DOM are. You'll get them next block.

> **One note on your starting point:** you already write TypeScript professionally, so parts of Chapter 1 will be review. That's fine and expected — read it anyway, but at speed, and spend your saved time on §3 (coercion) and §8 (execution context), which are the two most people *think* they know. If a section is genuinely old news, mark it and move on. Honest skipping is fine; pretending is not.

---

## How Each Study Day Works

**Core: 3 hours.** Adjust after Weekend 1 once you know your real speed.

| Block | What | Time |
|---|---|---|
| 📖 **Read** | Assigned sections, actively. Stop at every code block and predict the output *before* reading on. | 50 min |
| ⌨️ **Type** | Retype every example by hand and run it. No copy-paste. Then break it on purpose and read the error. | 50 min |
| 🧩 **Practice** | The chapter's Interview Quick-Fire + practice questions. Write your answer *before* opening `<details>`. | 50 min |
| ✍️ **Consolidate** | 5-10 lines in your own words. Log ONE thing you still can't explain. | 20 min |

**The rule:** if you can't explain it out loud without looking, you read it — you didn't learn it. The "can't explain" line is the most valuable thing you write all day.

---

## Weekend 1 — Sat 15 Aug / Sun 16 Aug
### Foundations + Closures

**Saturday — [01_JS_Foundations](../16_JavaScript/01_JS_Foundations.md)** *(1,187 lines — the longest chapter in the block; pace yourself)*
- [ ] §0 War Stories, §1 What IS JavaScript
- [ ] §2 Data Types, **§3 Type Coercion** ⭐
- [ ] §4 var/let/const, §5 Scope, §6 Hoisting
- [ ] §7 Operators, **§8 Execution Context** ⭐, §9 Strict Mode
- [ ] Interview Quick-Fire + Practice Questions

> 🎯 **SDET check — can you answer these cold?**
> 1. Why does `expect('5' == 5).toBe(true)` pass but `'5' === 5` fail — and which one belongs in a test assertion?
> 2. A `var` inside a `for` loop that registers callbacks gives you the same final value every time. Why, and what does `let` change?

**Sunday — [02_JS_Functions_Closures](../16_JavaScript/02_JS_Functions_Closures.md)** *(853 lines)*
- [ ] §1 Declarations vs Expressions, §2 Parameters
- [ ] **§3 `this` Keyword** ⭐ — the arrow-function vs regular-function distinction
- [ ] **§4 Closures** ⭐ — the chapter's core
- [ ] §5 Higher-Order Functions, §6 IIFE
- [ ] §7 Currying, §8 Composition, §9 Recursion
- [ ] Interview Quick-Fire + Reality Check

> 🎯 **SDET check:**
> 1. A Playwright fixture needs to remember a value between setup and teardown. Which mechanism from §4 is that, and why doesn't a plain variable work?
> 2. Why does `this` break when you pass a class method as a callback — and why does an arrow function fix it?

---

## Weekend 2 — Sat 22 Aug / Sun 23 Aug ⭐
### Async — the whole weekend

This chapter gets **both days**. It's the highest-leverage 779 lines in the entire JS module for an SDET. Every time you write `await page.click()` you're using this; every flaky test you'll ever debug is explained by it. If you only half-learn one chapter in Block 1, do not let it be this one.

**Saturday — [04_JS_Async_Promises](../16_JavaScript/04_JS_Async_Promises.md), first half**
- [ ] **§1 The Event Loop** ⭐ — build the mental model properly, draw it on paper
- [ ] §2 Callbacks — the old way, and why it hurt
- [ ] §3 Promises — states, chaining, error propagation

> 🎯 **SDET check:** draw the event loop from memory — call stack, task queue, microtask queue. Then trace: `console.log(1); setTimeout(()=>console.log(2),0); Promise.resolve().then(()=>console.log(3)); console.log(4);` — what's the output order, and *why*?

**Sunday — [04_JS_Async_Promises](../16_JavaScript/04_JS_Async_Promises.md), second half**
- [ ] §4 Async/Await — what it desugars to
- [ ] §5 Advanced Async Patterns — `all` / `allSettled` / `race` / `any`
- [ ] **§6 Microtasks vs Macrotasks** ⭐ — the deep dive
- [ ] §7 Common Async Patterns in Real Code
- [ ] Interview Quick-Fire + Reality Check

> 🎯 **SDET check:**
> 1. You have 5 independent API calls in a test. Sequential `await`s vs `Promise.all` — what's the time difference, and when is `allSettled` the right call instead?
> 2. A test passes locally and fails in CI. Explain — using the event loop, not vibes — how a timing difference produces that.

---

## Weekend 3 — Sat 29 Aug / Sun 30 Aug
### DOM + Block Checkpoint

**Saturday — [05_JS_DOM_BrowserAPIs](../16_JavaScript/05_JS_DOM_BrowserAPIs.md)** *(767 lines)*
- [ ] §1 What IS the DOM, §2 Selecting Elements ⭐
- [ ] §3 Traversing, §4 Creating & Modifying
- [ ] **§5 Events** ⭐ — bubbling, capture, delegation
- [ ] §6 Forms, §7 Storage APIs, §8 Fetch API
- [ ] §9 Other Browser APIs, §10 Why React Exists

> 🎯 **SDET check:**
> 1. Your locator matched 3 elements when you expected 1. Using §2-3, name three different ways to make it unambiguous — and which is most resilient to a UI refactor.
> 2. You clicked a button and nothing happened, but the click *did* fire. Using §5, give two mechanisms that explain it.

**Sunday — Checkpoint (no new chapter)**

This is the day the plan earns its keep. No new material — measure, consolidate, and set the real pace.

- [ ] **Pace audit** — [`02_Pace_Log.md`](02_Pace_Log.md), honestly. How long did each day *actually* take vs. the 3-hour estimate?
- [ ] **Cold recall** — without notes, explain out loud: the event loop, closures, event bubbling, and `==` vs `===` coercion. Anything you fumble goes on the re-read list.
- [ ] **Gap-fill** — re-read only the weakest sections from the last 3 weekends
- [ ] **Problem sets** — work through the JS sections of [`16_PROBLEM_SETS.md`](../16_JavaScript/16_PROBLEM_SETS.md)
- [ ] **Plan Block 2** — bring your numbers to Claude and we'll build the next block around your actual speed

---

## Pace Log

Lives in its own file so there's exactly one place to record: **[`02_Pace_Log.md`](02_Pace_Log.md)**

Fill in a row at the end of every study day — planned vs actual time, a 1-5 rating, and the one thing you still can't explain. That last column is the whole point of stopping at three weekends.

The log also holds the **cold-recall checklist** and the three questions that decide what Block 2 looks like.

---

## The Arc Ahead (sketch only — not committed)

Not scheduled, deliberately. Here so you can see where this goes:

- **Block 2 — JS finish:** Prototypes, ES6+, Error Handling/Debugging, Deep Reasoning
- **Block 3 — JS for SDET:** Browser Internals, Node Architecture *(the two that make Playwright's design click)*
- **Block 4-5 — TypeScript:** Foundations, Advanced Types ⭐, Patterns, Deep Reasoning, Decorators, Modules
- **Block 6+ — Playwright:** Foundations → Core Architecture → POM → Enterprise → Advanced → 7 challenges → 3 capstones

Each block gets planned when the previous one ends, sized to your measured pace.

---

## If You Miss a Weekend

You will. Plan for it now so it doesn't become quitting:

- **Missed a day** — do it as a third session next weekend, or drop it. The schedule is a guide, not a debt.
- **Missed a weekend** — shift everything one weekend later. Don't double up; two big chapters in a day is reading without absorbing.
- **Fell behind badly** — don't restart. Jump to where the current block is and keep going. Momentum beats completeness.

Non-negotiable: **don't skip Weekend 2.** Everything downstream leans on async.

---

## Using This With Claude

Say where you are — e.g. *"Weekend 1 Saturday, foundations"* — and I'll pull the local date, confirm your position in the plan, and work the session with you.

Good session prompts:
- *"Quiz me on last weekend before I start today"*
- *"Here's my answer to the SDET check — is it right?"*
- *"This test is flaky, here's the code — walk me through why using the event loop"*
- *"I couldn't explain [X] from my log — teach me that properly"*
