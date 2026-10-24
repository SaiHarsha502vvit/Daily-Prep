# Lab 06 — Virtual Grid: Testing 10,000 Rows That Mostly Don't Exist

- **You'll practise:** asserting the *logical* state of a UI whose DOM is a small window onto it · reaching deep rows deterministically · using the API as an independent oracle · spotting boundary bugs
- **Read first:** [Ch64 — Dynamic Locators & Data Structures](../../02_Test_Architecture/64_Dynamic_Locators_And_Data_Structures_In_POMs.md) §6 (virtualised grids)
- **Time:** 90–150 minutes

---

## The mission

The back office lists every parking citation — 10,000 of them — in one scrolling grid. To stay fast, the grid is **virtualised**: it only builds the rows you can see (plus a few either side) and loads data from the API in chunks of 500 as you scroll. There's also a **Status** filter.

Support keeps getting reports that "the grid lies sometimes", but nobody can reproduce them on the first screen. Your job: prove the grid tells the truth everywhere, not just at the top.

## What you can use

| Endpoint | What it does |
| --- | --- |
| `GET /` | The grid page. |
| `GET /api/citations?status=&offset=&limit=` | What the grid calls for each chunk: `{ total, rows: [{ id, status, amountPence }] }`. |
| `GET /api/citations/summary` | The back office's own totals: `{ total, byStatus: { PAID, PENDING, DISPUTED } }`. |

**A fact from the back office** (use it as a known-good data point): `CIT-07342` is **DISPUTED**, amount **£74.46**.

## The requirements

| ID | Requirement |
| --- | --- |
| **R1** | The grid tells assistive technology its **real** size and each row its **real** position: `aria-rowcount="10000"` on the grid, and the row for citation *n* has `aria-rowindex="n"` — wherever it is in the list. The page says `Showing 10,000 citations`. |
| **R2** | Every citation is reachable — including the **last** one, `CIT-10000`. |
| **R3** | Every row shows **its own** data — including rows far down the list. |
| **R4** | Filtering by status finds **every** match: the count text and `aria-rowcount` equal the back office's total for that status, every visible row has that status, and the last match is reachable. |

---

## How to work this lab

### 1. Explore — measure before you plan

`npm run app -- 06`, open <http://localhost:4400>, open DevTools.

- How many `[role=row]` elements are in the DOM right now? Scroll a bit. Now? (Count them in the console: `document.querySelectorAll('[role=row]').length`.)
- How tall is one row? Where does the grid get its scrollbar length from, if the rows aren't there?
- Scroll fast to the middle. What do the rows show for a moment, before the data arrives? Watch the Network tab while you do it.

### 2. Plan

Write the TEST PLAN block in `tests/grid.spec.ts`. Decide:

- **Counting:** `expect(rows).toHaveCount(10000)` — will it pass? What *should* you count, and where does the true number live?
- **Reaching row 7,342:** scrolling with the mouse wheel 7,000 times would be slow *and* flaky (Ch64 §6 measured it). What single thing can you set to put any row on screen?
- **Knowing the right answer:** for R4, if the page's filter is wrong, its count label will be wrong in exactly the same way. Who else can tell you how many disputed citations exist?

### 3. Predict

1. Straight after you jump to row 7,342, you read the row's text with `textContent()`. What do you get, and why?
2. A bug that only affects rows after 5,000 — which of your tests would catch it, and which wouldn't?
3. `rows.filter({ hasNotText: 'DISPUTED' })` has a count of 0. Does that prove every row is DISPUTED? (What if there are no rows at all?)

### 4. Code, run, grade

```bash
npx playwright test 06-virtual-grid        # app running in another terminal
npm run grade -- 06
```

---

## Hints — one at a time

<details><summary>Hint 1 — jumping to a row</summary>

Every row is the same height, so row *i* (0-based) starts at `i × rowHeight`. Set the grid's own scroll position:

```ts
await grid.evaluate((el, top) => { el.scrollTop = top; }, 7341 * ROW_HEIGHT);
```

`el.scrollTop = el.scrollHeight` takes you to the very end.

</details>

<details><summary>Hint 2 — finding a row once it's rendered</summary>

Rows are named by their content, so `grid.getByRole('row', { name: 'CIT-07342' })` finds it. Pair it with a **web-first assertion** (`toBeVisible`, `toHaveAttribute`, `toHaveText`) — those wait through the "Loading…" moment; a one-shot `textContent()` doesn't.

</details>

<details><summary>Hint 3 — checking a row's data exactly</summary>

`row.getByRole('gridcell')` gives the cells; `toHaveText(['CIT-07342', 'DISPUTED', '£74.46'])` checks all three in order.

</details>

<details><summary>Hint 4 — the oracle</summary>

`const { byStatus } = await (await request.get('/api/citations/summary')).json();` — then build the expected label with `byStatus.DISPUTED.toLocaleString('en-GB')`.

</details>

## Debrief

- Every one of the four bugs was invisible on the first screen. What does that tell you about where a virtualised component's bugs live — and about the value of a test that only checks "the grid loads"?
- R1's bug is an accessibility bug no sighted tester would ever notice. Who finds it in production?
- Your R4 test trusts `/api/citations/summary`. When would *that* be the wrong oracle, and what would you use instead?
