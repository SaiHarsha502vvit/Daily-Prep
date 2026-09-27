# Lab 01 — First Contact: Locators, Auto-Waiting & Precise Assertions

**You'll practise:** turning written requirements into tests · finding elements the way a user does · why Playwright tests don't need `sleep` · assertions precise enough to catch real bugs
**Read first:** [Ch01 Playwright & TS Basics](../../01_Foundations/01_Playwright_TS_Basics.md), [Ch02 Locators](../../01_Foundations/02_Enterprise_Locators_XPath.md), [Ch55 Trace Viewer](../../01_Foundations/55_Inspector_TraceViewer_UIMode_Walkthrough.md)
**Time:** 45–90 minutes

---

## The mission

The parking-fines team shipped a **Citation Lookup** page. Members of the public type the ID from their fine and see its status and amount. The backend is slow (it calls a legacy system), so results take a moment to appear.

You're the only tester. Write the automated tests that would stop a broken version of this page from shipping.

## The requirements

Your test plan comes from these — nothing else.

| ID | Requirement |
| --- | --- |
| **R1** | Searching a valid ID shows its status and its amount formatted in pounds with two decimals. Known data: `CIT-001` = PAID, £50.00 · `CIT-002` = PENDING, £125.50 · `CIT-003` = DISPUTED, £9.99 |
| **R2** | Citation IDs are case-insensitive. |
| **R3** | Submitting an empty search shows **"Enter a citation ID"**. |
| **R4** | Searching an ID that doesn't exist shows **"No citation found"**. |
| **R5** | A successful search clears any previous error message. |

---

## How to work this lab

### 1. Explore (10 min) — no code yet

```bash
cd labs
npm install          # first time only
npm run app -- 01    # serves the correct app on http://localhost:4400
```

Open http://localhost:4400 in your browser. Try every requirement by hand. Open DevTools → **Network** and watch what happens when you search. Notice how long the result takes.

### 2. Plan (10 min) — still no code

Open [`tests/lookup.spec.ts`](./tests/lookup.spec.ts). At the top, fill in the **test plan** comment: for each requirement, one line saying *what you'll do* and *what exactly you'll assert*. For example:

```
R4: search "CIT-999" -> the alert says exactly "No citation found"
```

If you can't write that line for a requirement, you don't understand the requirement yet — go back to step 1.

### 3. Predict — write your answers down before running anything

1. The result takes ~600 ms. If your test clicks Search and then immediately does `const s = await page.locator('#status').textContent()`, what will `s` be? Will the test pass?
2. What does `await expect(page.locator('#status')).toHaveText('PAID')` do differently?
3. `toContainText('£125')` vs `toHaveText('£125.50')` — can you invent a bug that one would catch and the other would miss?

### 4. Code

Write your tests in `tests/lookup.spec.ts`. Run them against the correct app (with `npm run app -- 01` still running in another terminal):

```bash
npx playwright test 01-first-contact            # headless
npx playwright test 01-first-contact --headed   # watch it
npx playwright test 01-first-contact --ui       # step through (Ch55)
```

### 5. Grade

Stop the app (Ctrl+C) — the grader starts its own copies.

```bash
npm run grade -- 01
```

The grader runs your tests against the **correct** app three times (they must pass every time), then against **four buggy versions**, each hiding one bug that breaks one requirement. For every buggy version your tests must **fail**. A missed bug comes with a hint — improve your tests and grade again. Don't open `app/server.mjs` until you've caught everything; after that, reading it is part of the debrief.

### 6. Debrief — after all bugs are caught

The grader prints what each bug was. Then answer for yourself:

- Which requirement was hardest to turn into a precise assertion, and why?
- Did any of your first attempts fail on the *correct* app? What did that teach you about reading text right after a click?
- Look at your R1 test. Would it still catch the amount bug if the known data were `£50.00` only? What does that tell you about choosing test data?

Then compare with the reference: `npm run grade -- 01 --solution` and [`../_solutions/01-first-contact/`](../_solutions/01-first-contact/).

---

## Hints — open one at a time, only when stuck

<details><summary>Hint 1 — finding the elements</summary>

Find elements the way a user describes them: `page.getByLabel('Citation ID')`, `page.getByRole('button', { name: 'Search' })`, `page.getByRole('alert')`. For the result, the section has an accessible name: `page.getByRole('region', { name: 'Result' })`.

</details>

<details><summary>Hint 2 — my test fails on the correct app</summary>

If you read text with `await locator.textContent()` right after clicking, you read it *before* the slow backend answers. Web-first assertions — `await expect(locator).toHaveText(...)` — retry until they pass or time out. That's the whole reason Playwright tests don't need `waitForTimeout`.

</details>

<details><summary>Hint 3 — "MISSED" on a requirement you think you tested</summary>

Compare what you assert with what the requirement actually says. "Shows the amount" and "shows the amount formatted with two decimals" are different tests. So are "shows the result" and "shows the result *and the old error is gone*".

</details>

## Stretch goals

- Run `npx playwright test 01-first-contact --repeat-each=20`. Any failures mean a timing assumption in your tests.
- Break a test on purpose, then open its trace (`npx playwright show-trace test-results/.../trace.zip`) and find the exact moment the result appeared.
- Add a test for whitespace-only input (`"   "`). Is it covered by the requirements? Should it be? (Real testers ask this question out loud.)
