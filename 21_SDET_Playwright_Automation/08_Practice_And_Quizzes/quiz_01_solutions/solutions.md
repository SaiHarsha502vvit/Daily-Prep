# Quiz 01 — Playwright & TypeScript Fundamentals: Solutions

Reference document for Quiz 01 (25 MCQ). Each entry contains the question, correct answer, explanation, and why each incorrect option is wrong.

**Navigation**: [Index](../../00_INDEX.md) | [→ Quiz 02: Code Challenges](../QUIZ_02_Playwright_CodeChallenge.md)

---

## Async / Await (Q1–Q5)

### Q1 — EASY — Async / Await

**Question:** Which of these requires `await`?

A) `page.locator('#myElement')`  
B) `page.locator('#myElement').click()`  
C) `page.locator('#myElement').nth(2)`  
D) `page.locator('#myElement').filter({ hasText: 'foo' })`

**Correct Answer:** B

**Explanation:** `.click()` is an async action that interacts with the browser. It must be awaited. A, C, and D all return `Locator` objects (synchronous chaining) — they create a description of what to find but don't touch the DOM until an action or assertion is called.

**Why others are wrong:**

- A: Returns a `Locator` object synchronously; no DOM interaction occurs.
- C: Returns a `Locator` object synchronously; it is a description, not a query.
- D: Returns a `Locator` object synchronously; chaining with `.filter()` is lazy evaluation.

**Reference Chapter:** Chapter 1 — Async / Await Fundamentals

---

### Q2 — MEDIUM — Async / Await

**Question:** What is wrong with this code?

```typescript
const items = ["A", "B", "C"];
items.forEach(async (item) => {
  await page.locator(`#item-${item}`).click();
});
```

A) `forEach` does not support async callbacks  
B) The `await` calls run sequentially but `forEach` doesn't await them  
C) `forEach` returns a Promise that should be awaited  
D) The `page.locator()` call inside `forEach` is wrong

**Correct Answer:** B

**Explanation:** `forEach` fires each async callback but never awaits the returned Promises. The loop completes instantly (the callbacks are launched but not waited for), and the test continues before any click happens.

Fix:

```typescript
for (const item of items) {
  await page.locator(`#item-${item}`).click(); // awaits each click
}
// OR: run in parallel
await Promise.all(items.map((item) => page.locator(`#item-${item}`).click()));
```

**Why others are wrong:**

- A: `forEach` does support async callbacks — the problem is it doesn't wait for them.
- C: `forEach` always returns `undefined`, not a Promise.
- D: `page.locator()` inside `forEach` is perfectly valid.

**Reference Chapter:** Chapter 1 — Async / Await Fundamentals

---

### Q3 — MEDIUM — Async / Await

**Question:** When should you use `Promise.all`?

A) When you have sequential async operations that each depend on the previous result  
B) When you have independent async operations that can run simultaneously  
C) When you need to catch errors from multiple promises  
D) When you need to retry a failing operation

**Correct Answer:** B

**Explanation:** `Promise.all` runs multiple independent async operations SIMULTANEOUSLY and waits for all of them to complete. Use it when the operations don't depend on each other.

Example: `Promise.all([context.waitForEvent('page'), page.click('#openNewTab')])` — both start at the same instant.

**Why others are wrong:**

- A: Sequential dependent operations should be awaited one after another, not combined with `Promise.all`.
- C: `Promise.all` fails fast — if any promise rejects, the entire call rejects. Use `Promise.allSettled` to catch individual errors.
- D: Retry logic is handled by `expect.poll` or dedicated retry libraries, not `Promise.all`.

**Reference Chapter:** Chapter 1 — Async / Await Fundamentals

---

### Q4 — HARD — Async / Await

**Question:** What does this code actually do?

```typescript
const result = await Promise.all([
  page.locator("#first").textContent(),
  page.locator("#second").textContent(),
  page.locator("#third").textContent(),
]);
```

A) Gets all three texts sequentially, returns the last one  
B) Gets all three texts in parallel, returns `[text1, text2, text3]`  
C) This is a syntax error — `textContent()` cannot be used in `Promise.all`  
D) Gets the text from the element that loads fastest

**Correct Answer:** B

**Explanation:** `Promise.all` fires all three `textContent()` calls simultaneously. Each returns a Promise. `Promise.all` waits for ALL three to resolve and returns them as an array in order: `[text1, text2, text3]`.

Destructure for readability:

```typescript
const [first, second, third] = await Promise.all([
  page.locator("#first").textContent(),
  page.locator("#second").textContent(),
  page.locator("#third").textContent(),
]);
```

**Why others are wrong:**

- A: The operations run in parallel, not sequentially, and all results are returned.
- C: `textContent()` returns a Promise and is fully compatible with `Promise.all`.
- D: `Promise.all` waits for all Promises to resolve, not just the fastest.

**Reference Chapter:** Chapter 1 — Async / Await Fundamentals

---

### Q5 — MEDIUM — Async / Await

**Question:** Which CORRECTLY handles the "new tab" race condition?

A) `await page.click('#link'); const tab = await context.waitForEvent('page');`  
B) `const [tab] = await Promise.all([context.waitForEvent('page'), page.click('#link')]);`  
C) `const tab = await page.waitForEvent('page');`  
D) `await page.click('#link'); const tab = page.context().pages()[1];`

**Correct Answer:** B

**Explanation:** `Promise.all` starts the listener (`waitForEvent`) BEFORE the click fires. This prevents the race condition where the tab opens before the listener is registered.

**Why others are wrong:**

- A: Race condition — the click fires first, and the tab might open before the listener starts listening.
- C: `page` does not emit `'page'` events; `context` does.
- D: `pages()[1]` might not exist yet when accessed (the tab might not have fully opened).

**Reference Chapter:** Chapter 1 — Async / Await Fundamentals

---

## Locators & Selectors (Q6–Q10)

### Q6 — EASY — Locators & Selectors

**Question:** Why do POM constructors NOT query the DOM?

A) `locator()` is a newer API that replaced `$()`  
B) `locator()` creates a lazy description of HOW to find the element — no DOM query until `.click()`, `.fill()`, or an assertion is called  
C) Querying the DOM in the constructor causes test failures  
D) `locator()` is faster than `$()` because it's synchronous

**Correct Answer:** B

**Explanation:** `page.locator('#myButton')` does NOT touch the DOM. It creates a `Locator` object that describes a CSS selector. The actual DOM query only happens when you call an action (`.click()`, `.fill()`) or assertion (`toBeVisible()`). This is called "lazy evaluation" and it's intentional — POMs represent the PAGE, not a snapshot of the page at construction time.

**Why others are wrong:**

- A: While `locator()` is the modern API, the reason POMs don't query the DOM is about lazy evaluation, not replacement of `$()`.
- C: DOM queries in constructors don't inherently cause failures — the issue is that a snapshot taken at construction time quickly becomes stale.
- D: `locator()` being synchronous is a consequence of lazy evaluation, but speed is not the primary reason.

**Reference Chapter:** Chapter 2 — Locators & Selectors

---

### Q7 — MEDIUM — Locators & Selectors

**Question:** Which is the correct Component POM composition pattern?

A) Child class extends the parent page class  
B) The page class imports and instantiates component classes in the constructor  
C) Components are created in `beforeEach` and passed to tests  
D) Each component has its own `page.goto()` call

**Correct Answer:** B

**Explanation:** Composition over inheritance. The page class (orchestrator) creates component instances in its constructor:

```typescript
constructor(page: Page) {
  this.searchPanel = new SearchPanel(page);
  this.resultsGrid = new ResultsGrid(page);
}
```

**Why others are wrong:**

- A: Inheritance makes the class larger and harder to maintain; composition is preferred.
- C: Components should live in the POM, not be created per-test in `beforeEach`.
- D: Components don't have their own navigation — they rely on the parent page object's navigation.

**Reference Chapter:** Chapter 2 — Locators & Selectors

---

### Q8 — HARD — Locators & Selectors

**Question:** What is the benefit of the Locator Dictionary pattern for 400+ locators?

A) It's faster because object lookups are O(1)  
B) Locators are namespaced and typed, giving IDE autocomplete and preventing naming conflicts  
C) It avoids the need for a constructor  
D) Object properties are automatically lazy-evaluated

**Correct Answer:** B

**Explanation:** The Locator Dictionary pattern groups locators into a typed nested object (e.g., `this.loc.customerSearch.firstName()`). Benefits: namespaced access prevents name collisions, TypeScript gives full autocomplete, and the structure mirrors the page's logical layout.

**Why others are wrong:**

- A: Performance is irrelevant at this scale; object lookup efficiency is not the motivation.
- C: Constructors are still needed to initialize the page object.
- D: Arrow functions `() => page.locator(...)` give lazy evaluation, but this is an explicit design choice, not automatic behavior of the dictionary pattern.

**Reference Chapter:** Chapter 2 — Locators & Selectors

---

### Q9 — MEDIUM — Fixtures & Test Architecture

**Question:** What is the key difference between `scope: 'test'` and `scope: 'worker'` fixtures?

A) `'test'` fixtures can use async code; `'worker'` fixtures cannot  
B) `'test'` fixtures run before each test and tear down after; `'worker'` fixtures run once per worker process, shared across all tests in that worker  
C) `'worker'` fixtures are shared across all workers; `'test'` fixtures are not  
D) `'test'` fixtures are faster because they run in parallel

**Correct Answer:** B

**Explanation:** `scope: 'test'` (default): setup runs before each test, teardown runs after each test. Isolated per test.

`scope: 'worker'`: setup runs ONCE when the worker starts, teardown when the worker stops. Shared across all tests in that worker.

Practical use: Login (storageState) should be worker-scoped — login once, run 20 tests, login again only when needed. Database seeding for one test should be test-scoped.

**Why others are wrong:**

- A: Both `'test'` and `'worker'` fixtures can use async code.
- C: `'worker'` fixtures are shared within a single worker, not across all workers (each worker is a separate process).
- D: Scope doesn't directly determine speed; it determines isolation and reuse.

**Reference Chapter:** Chapter 3 — Custom Fixtures & Test Architecture

---

### Q10 — MEDIUM — Fixtures & Test Architecture

**Question:** What does this fixture provide?

```typescript
account: [
  async ({}, use) => {
    const acc = await createTestAccount();
    await use(acc);
    await deleteTestAccount(acc.id);
  },
  { scope: 'worker' }
],
```

A) A new account for each test, deleted after each test  
B) One account created when the worker starts, deleted when the worker stops, shared by all tests in the worker  
C) An account that persists permanently across all test runs  
D) A mocked account object that never hits the database

**Correct Answer:** B

**Explanation:** `scope: 'worker'` means setup (create account) happens once when the worker process starts. All tests in that worker use the SAME account. Teardown (delete account) happens when the worker stops. If you have 20 tests in a worker, all 20 share this one account — login once, run 20 tests.

**Why others are wrong:**

- A: That would require `scope: 'test'` (or no scope specified, which defaults to `'test'`).
- C: The account is deleted when the worker stops (teardown), so it does not persist across runs.
- D: `createTestAccount()` and `deleteTestAccount()` are real DB operations, not mocks.

**Reference Chapter:** Chapter 3 — Custom Fixtures & Test Architecture

---

### Q11 — HARD — Fixtures & Test Architecture

**Question:** Why is this worker-scoped fixture WRONG for data that tests modify?

```typescript
// Worker-scoped fixture:
citationData: [
  async ({}, use) => {
    const citation = await createCitation({ amount: 150, status: "PENDING" });
    await use(citation);
    await deleteCitation(citation.id);
  },
  { scope: "worker" },
];
```

A) Worker-scoped fixtures can't be async  
B) Test 1 might change the citation status to 'PAID', then Test 2 starts with a 'PAID' citation instead of 'PENDING'  
C) The fixture must return a function, not an object  
D) Fixtures can't use `await` inside them

**Correct Answer:** B

**Explanation:** Worker-scoped fixtures are SHARED. If Test 1 changes the citation's status from 'PENDING' to 'PAID', Test 2 gets the now-PAID citation. Tests step on each other's data.

Data that tests READ (account info, pre-set up records that don't change) → worker-scoped ✓  
Data that tests MODIFY (citation status, form values, records with mutable state) → test-scoped ✓

**Why others are wrong:**

- A: Worker-scoped fixtures fully support async code.
- C: The fixture format is correct; it uses the tuple `[setupFn, options]` pattern.
- D: Fixtures routinely use `await` for async setup and teardown.

**Reference Chapter:** Chapter 3 — Custom Fixtures & Test Architecture

---

### Q12 — MEDIUM — POM & Page Objects

**Question:** D365 renders a field shell (empty) immediately, then loads data via OData (3 seconds). Which wait is correct?

A) `await page.locator('[data-automation-key="status"]').waitFor({ state: 'visible' })`  
B) `await page.waitForTimeout(5000)`  
C) `await expect(page.locator('[data-automation-key="status"]')).toHaveText('Active', { timeout: 30000 })`  
D) `const status = await page.locator('[data-automation-key="status"]').textContent()`

**Correct Answer:** C

**Explanation:** `toHaveText('Active', { timeout: 30000 })` waits until the text is EXACTLY 'Active'. It automatically handles the two-phase render: the field is visible but empty → assertion retries → text arrives after OData call → assertion passes.

**Why others are wrong:**

- A: The field is visible immediately (empty shell), so `waitFor({ state: 'visible' })` passes too early.
- B: Hard sleep is never acceptable — it is brittle and wastes time.
- D: `textContent()` reads immediately, returning `""` before the data loads.

**Reference Chapter:** Chapter 4 — POM & Page Objects

---

### Q13 — MEDIUM — POM & Page Objects

**Question:** An element is in the DOM but `isVisible()` returns false. What is the FIRST thing to check?

A) The element is inside an IFrame  
B) The element is CSS-hidden (display:none, visibility:hidden, opacity:0, zero-size)  
C) The element hasn't loaded yet  
D) Playwright has a bug

**Correct Answer:** B

**Explanation:** If `count() > 0` (element IS in the DOM) but `isVisible()` returns `false`, the element is CSS-hidden. Check `display: none`, `visibility: hidden`, `opacity: 0`, or `height/width: 0`. In D365, this happens with inactive tabs, collapsed sections, and conditional fields.

**Why others are wrong:**

- A: If it were inside an IFrame, `count()` would likely return 0 (Playwright doesn't pierce IFrames without `frameLocator`).
- C: If the element hasn't loaded, `count()` would return 0, not `isVisible()` being false.
- D: This is almost never the issue; always assume a legitimate cause first.

**Reference Chapter:** Chapter 4 — POM & Page Objects

---

### Q14 — HARD — POM & Page Objects

**Question:** `waitForLoadState('networkidle')` is called on a D365 page. What will happen?

A) It waits 500ms after all network requests finish — reliable for D365  
B) It times out because D365 SPAs make continuous background requests (telemetry, keep-alive, OData polls)  
C) It works correctly for the first load but not for subsequent navigations  
D) It's equivalent to `waitForLoadState('domcontentloaded')`

**Correct Answer:** B

**Explanation:** `networkidle` waits for 500ms with NO network activity. D365 (and most SPAs) have continuous background activity: telemetry, keep-alive pings, OData queries for caching. The `networkidle` condition never fires, and the test hangs until timeout.

Use instead:

```typescript
await page.waitForLoadState("domcontentloaded");
await expect(page.locator(".ms-Spinner")).toHaveCount(0, { timeout: 30000 });
await expect(targetContent).toBeVisible({ timeout: 30000 });
```

**Why others are wrong:**

- A: `networkidle` is not reliable for D365 because the page never reaches true idle state.
- C: It does not work correctly for the first load either; the timeout happens on every call.
- D: `domcontentloaded` and `networkidle` are completely different load states.

**Reference Chapter:** Chapter 4 — POM & Page Objects

---

### Q15 — MEDIUM — Cross-Browser & Device Testing

**Question:** In D365, "New Record" on the CommandBar uses which ARIA role?

A) `role="button"` with `name="New Record"`  
B) `role="menuitem"` with `name="New Record"`  
C) `role="link"` with `name="New Record"`  
D) `role="option"` with `name="New Record"`

**Correct Answer:** B

**Explanation:** D365 CommandBar buttons use `role="menuitem"`. This is because the CommandBar is implemented as an ARIA menu (`role="toolbar"`) where each button is a menu item.

```typescript
// Correct:
await page.getByRole("menuitem", { name: "New Record" }).click();

// Wrong (the button element is there but won't match 'button' role):
await page.getByRole("button", { name: "New Record" }).click(); // fails!
```

**Why others are wrong:**

- A: The DOM element may look like a button, but the ARIA role is `"menuitem"`, not `"button"`.
- C: `"link"` is for hyperlink elements, not CommandBar items.
- D: `"option"` is for listbox options, not toolbar items.

**Reference Chapter:** Chapter 5 — Cross-Browser & Device Testing

---

### Q16 — HARD — Cross-Browser & Device Testing

**Question:** Which describes D365's "two-phase render" problem?

A) D365 renders the page twice because of React StrictMode  
B) React renders the UI shell immediately with empty data, then fires OData API calls; data appears 2–12 seconds later  
C) D365 uses server-side rendering then client-side hydration  
D) The browser renders HTML then JavaScript overwrites it

**Correct Answer:** B

**Explanation:** D365's React components render INSTANTLY with empty state (phase 1 — the shell). Then they fire OData/Dataverse API calls. When the API responds (2–12 seconds), React re-renders with real data (phase 2). Tests that check for visibility (phase 1) get empty fields.

**Why others are wrong:**

- A: React StrictMode does not cause double rendering in production builds.
- C: D365 is a fully client-side SPA; there is no server-side rendering.
- D: This describes a generic browser behavior, not the specific D365 two-phase OData pattern.

**Reference Chapter:** Chapter 5 — Cross-Browser & Device Testing

---

### Q17 — MEDIUM — Cross-Browser & Device Testing

**Question:** A D365 test clicks a tab and then reads a field. The test fails with "element not visible". What is the most likely cause?

A) The tab click didn't register  
B) React unmounted the previous tab's component and is still mounting the new tab's component  
C) The field is inside an IFrame  
D) The locator is wrong

**Correct Answer:** B

**Explanation:** In D365, tab switches unmount the old tab's React components and mount new ones. The new component takes time to mount AND load its data. Reading a field immediately after a tab click hits the component before it's mounted or before data has loaded.

Fix:

```typescript
await page.getByRole("tab", { name: "TabName" }).click();
await expect(page.getByRole("tab", { name: "TabName" })).toHaveAttribute(
  "aria-selected",
  "true",
);
await expect(page.locator(".ms-Spinner")).toHaveCount(0, { timeout: 20000 });
// Now the component is mounted and data has loaded
await expect(fieldLocator).toBeVisible({ timeout: 15000 });
```

**Why others are wrong:**

- A: The tab click almost certainly registered; the issue is React's component lifecycle.
- C: IFrame issues would typically show as a different error (frame not found).
- D: The locator is likely correct; the real issue is timing relative to React's lifecycle.

**Reference Chapter:** Chapter 5 — Cross-Browser & Device Testing

---

### Q18 — EASY — Security & Authentication

**Question:** Where should shared, immutable test data (e.g., account credentials) be defined?

A) As `const` at module level in the spec file  
B) As a `let` variable at module level  
C) Inside the test function  
D) In `playwright.config.ts` directly

**Correct Answer:** A

**Explanation:** Immutable test data (credentials, expected values, product IDs that never change) can safely be `const` at module level. It's read-only and parallel workers each get their own copy.

**Why others are wrong:**

- B: Mutable module-level `let` is dangerous in parallel execution — tests could overwrite shared state.
- C: Works for test-specific data but causes duplication if the same data is needed across tests.
- D: `playwright.config.ts` is for Playwright settings, not test data.

**Reference Chapter:** Chapter 6 — Security & Authentication

---

### Q19 — HARD — Security & Authentication

**Question:** This test fails 50% of the time in parallel execution. Why?

```typescript
let createdUserId: string;

test("Create user", async ({ page }) => {
  createdUserId = await adminPortal.createUser(testData);
});

test("Verify user in portal", async ({ page }) => {
  await customerPortal.verifyUser(createdUserId); // sometimes undefined!
});
```

A) Module-level `let` is not accessible between test functions  
B) In parallel execution, the two tests may run in DIFFERENT worker processes that don't share module-level variables  
C) `createdUserId` should be `const`  
D) The `async` keyword is missing

**Correct Answer:** B

**Explanation:** Playwright workers are separate Node.js processes. Module-level variables are NOT shared between processes. Worker 1 runs "Create user" and sets `createdUserId`. Worker 2 runs "Verify user" and sees `createdUserId` as `undefined` (it was never set in Worker 2's process).

Fix: Use `test.describe()` serial mode to force sequential execution, or use fixtures that pass data through the Playwright fixture system, or use an API/DB to share state between tests.

**Why others are wrong:**

- A: Module-level variables are absolutely accessible between test functions within the same worker.
- C: Changing to `const` would make it even worse (immutable, can't be assigned). The problem is sharing, not mutability.
- D: The `async` keyword is correctly present on both test functions.

**Reference Chapter:** Chapter 6 — Security & Authentication

---

### Q20 — MEDIUM — Security & Authentication

**Question:** What does `test.describe.serial()` do?

A) Makes tests run faster by skipping slow operations  
B) Forces all tests in the describe block to run in the same worker, sequentially — previous test's state is preserved  
C) Runs tests in alphabetical order  
D) Prevents tests from being retried on failure

**Correct Answer:** B

**Explanation:** `test.describe.serial()` runs all tests in the block in the SAME worker, one at a time, in the order they're defined. This allows tests to share state (the first test sets up, subsequent tests verify). If any test fails, the rest are skipped by default.

Use only when you NEED shared state (E2E flows across multiple tests). Prefer self-contained tests otherwise.

**Why others are wrong:**

- A: Sequential execution is slower than parallel execution.
- C: Tests run in definition order, not alphabetical order.
- D: Serial mode has no effect on retry behavior.

**Reference Chapter:** Chapter 6 — Security & Authentication

---

### Q21 — MEDIUM — Security & Authentication

**Question:** When should you use two separate `BrowserContext` objects?

A) When running tests in parallel (always)  
B) When two different user accounts need to interact simultaneously  
C) When testing on two different browsers  
D) When a test opens a new tab

**Correct Answer:** B

**Explanation:** Two different user accounts (e.g., admin + customer) need isolated sessions — different cookies, different localStorage, different auth states. Two separate `BrowserContext` objects give complete isolation.

**Why others are wrong:**

- A: Playwright workers each have their own browser context automatically; you don't manage that manually.
- C: Different browsers are configured in `playwright.config.ts` projects.
- D: New tabs in the same session share a context (Pattern 2, Chapter 12).

**Reference Chapter:** Chapter 6 — Security & Authentication

---

### Q22 — HARD — Security & Authentication

**Question:** What does `storageState` NOT capture?

A) `HttpOnly` cookies  
B) `localStorage` values  
C) `sessionStorage` values  
D) Regular (non-HttpOnly) cookies

**Correct Answer:** C

**Explanation:** `sessionStorage` is NOT captured by Playwright's `storageState`. Session storage is per-tab and designed to be non-persistent. Playwright's serialized state file only includes cookies and localStorage.

This is a practical problem: if your app stores auth tokens in `sessionStorage`, `storageState` won't work for pre-loading auth. Fix: inject the token via `page.addInitScript()` or change the app to use localStorage or HttpOnly cookies.

**Why others are wrong:**

- A: `HttpOnly` cookies ARE captured by `storageState` (Playwright reads them from the browser context before serialization).
- B: `localStorage` values ARE captured and restored by `storageState`.
- D: Regular (non-HttpOnly) cookies ARE captured by `storageState`.

**Reference Chapter:** Chapter 6 — Security & Authentication

---

### Q23 — MEDIUM — Security & Authentication

**Question:** In a cross-website sequential flow, where should the Data Accumulator object be defined?

A) As a module-level `let` variable  
B) Inside the `test()` function, as a local `const` object  
C) In the fixture, with `scope: 'worker'`  
D) In a separate JSON file on disk

**Correct Answer:** B

**Explanation:** The Data Accumulator is a plain TypeScript object defined INSIDE the test function. It's isolated to that test's execution context. Each test has its own accumulator — no sharing between parallel tests.

**Why others are wrong:**

- A: Module-level variables are shared across tests in the same worker → data corruption.
- C: Worker-scoped fixtures are shared across tests in the same worker → same problem as A.
- D: Unnecessary disk I/O, and file conflicts can occur in parallel runs.

**Reference Chapter:** Chapter 6 — Security & Authentication

---

### Q24 — MEDIUM — Fixtures & Test Architecture

**Question:** Why do you need `as const` for ARIA role strings?

```typescript
const role = "button"; // TypeScript infers: string
const role = "button" as const; // TypeScript infers: 'button' (literal type)

page.getByRole(role, { name: "Submit" }); // ← which works?
```

A) Both work — `string` and `'button'` are equivalent for `getByRole`  
B) Only `as const` works — `getByRole` expects a specific literal union type, not `string`  
C) Neither works — you must write the string inline  
D) `as const` prevents the role from being reassigned

**Correct Answer:** B

**Explanation:** `page.getByRole()` expects `AriaRole` which is a union type: `'button' | 'checkbox' | 'menuitem' | ...`. A plain `string` doesn't satisfy this type constraint — TypeScript sees `string` as too broad. `as const` narrows the type from `string` to the literal type `'button'`, which matches `AriaRole`.

```typescript
const role = "button" as const; // type: 'button' ← matches AriaRole
page.getByRole(role); // ✓ TypeScript happy
```

**Why others are wrong:**

- A: `string` is not assignable to the `AriaRole` union type; TypeScript will reject it.
- C: Inline strings work, but so does `as const` — the issue is type narrowing, not inline usage.
- D: While `as const` does prevent reassignment, the primary reason is type compatibility with `AriaRole`.

**Reference Chapter:** Chapter 3 — Custom Fixtures & Test Architecture

---

### Q25 — HARD — Fixtures & Test Architecture

**Question:** What is the purpose of `expect.objectContaining` vs `toEqual`?

```typescript
const response = {
  id: "C-001",
  name: "John",
  email: "j@test.com",
  createdAt: "2026-01-01",
};

// Option A:
expect(response).toEqual({ id: "C-001", name: "John" });

// Option B:
expect(response).toEqual(
  expect.objectContaining({ id: "C-001", name: "John" }),
);
```

A) Both are equivalent — `toEqual` ignores extra properties  
B) Option A fails (toEqual requires EXACT match); Option B passes (objectContaining is a partial match)  
C) Option B is slower because it checks more properties  
D) `objectContaining` is only for arrays, not objects

**Correct Answer:** B

**Explanation:** `toEqual` requires EXACT object equality. Option A fails because `response` also has `email` and `createdAt` which are not in `{ id: 'C-001', name: 'John' }`.

`expect.objectContaining({ id: 'C-001', name: 'John' })` is a PARTIAL matcher — it only checks that the specified keys have the specified values, ignoring other properties.

Use `toEqual` when you know ALL properties and want to verify the complete shape.  
Use `objectContaining` when you only care about some properties (or when the API may add new fields).

**Why others are wrong:**

- A: `toEqual` does NOT ignore extra properties; it requires exact equality.
- C: `objectContaining` is actually more focused and does not check all properties — it's the opposite of slower.
- D: `objectContaining` works on any object, not just arrays.

**Reference Chapter:** Chapter 3 — Custom Fixtures & Test Architecture

---

## Scoring Rubric

| Score | Interpretation         |
| ----- | ---------------------- |
| 23–25 | Expert                 |
| 18–22 | Solid                  |
| 14–17 | Review chapters        |
| <14   | Re-read from Chapter 1 |

---

**Navigation**: [Index](../../00_INDEX.md) | [→ Quiz 02: Code Challenges](../QUIZ_02_Playwright_CodeChallenge.md)
