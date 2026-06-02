# Quiz 01 — Playwright & TypeScript Fundamentals (25 MCQ)

**Navigation**: [Index](../00_INDEX.md) | [→ Quiz 02: Code Challenges](./QUIZ_02_Playwright_CodeChallenge.md)

> Test yourself after completing Chapters 01–16. Do NOT look at the answers until you've chosen an option.
> Score: 23–25 = Expert | 18–22 = Solid | 14–17 = Review chapters | <14 = Re-read from Chapter 1

---

## Async / Await (Questions 1–5)

### Q1 [EASY] — Which of these requires `await`?

A) `page.locator('#myElement')`  
B) `page.locator('#myElement').click()`  
C) `page.locator('#myElement').nth(2)`  
D) `page.locator('#myElement').filter({ hasText: 'foo' })`  

<details><summary>Answer</summary>

**B** — `.click()` is an async action that interacts with the browser. It must be awaited.

A, C, and D all return `Locator` objects (synchronous chaining) — they create a description of what to find but don't touch the DOM until an action or assertion is called.
</details>

---

### Q2 [MEDIUM] — What is wrong with this code?

```typescript
const items = ['A', 'B', 'C'];
items.forEach(async (item) => {
  await page.locator(`#item-${item}`).click();
});
```

A) `forEach` does not support async callbacks  
B) The `await` calls run sequentially but `forEach` doesn't await them  
C) `forEach` returns a Promise that should be awaited  
D) The `page.locator()` call inside `forEach` is wrong  

<details><summary>Answer</summary>

**B** — `forEach` fires each async callback but never awaits the returned Promises. The loop completes instantly (the callbacks are launched but not waited for), and the test continues before any click happens.

Fix:
```typescript
for (const item of items) {
  await page.locator(`#item-${item}`).click(); // awaits each click
}
// OR: run in parallel
await Promise.all(items.map(item => page.locator(`#item-${item}`).click()));
```
</details>

---

### Q3 [MEDIUM] — When should you use `Promise.all`?

A) When you have sequential async operations that each depend on the previous result  
B) When you have independent async operations that can run simultaneously  
C) When you need to catch errors from multiple promises  
D) When you need to retry a failing operation  

<details><summary>Answer</summary>

**B** — `Promise.all` runs multiple independent async operations SIMULTANEOUSLY and waits for all of them to complete. Use it when the operations don't depend on each other.

Example: `Promise.all([context.waitForEvent('page'), page.click('#openNewTab')])` — both start at the same instant.

A = use `await` sequentially. C = use `Promise.allSettled`. D = use `expect.poll` or retry libraries.
</details>

---

### Q4 [HARD] — What does this code actually do?

```typescript
const result = await Promise.all([
  page.locator('#first').textContent(),
  page.locator('#second').textContent(),
  page.locator('#third').textContent(),
]);
```

A) Gets all three texts sequentially, returns the last one  
B) Gets all three texts in parallel, returns `[text1, text2, text3]`  
C) This is a syntax error — `textContent()` cannot be used in `Promise.all`  
D) Gets the text from the element that loads fastest  

<details><summary>Answer</summary>

**B** — `Promise.all` fires all three `textContent()` calls simultaneously. Each returns a Promise. `Promise.all` waits for ALL three to resolve and returns them as an array in order: `[text1, text2, text3]`.

Destructure for readability:
```typescript
const [first, second, third] = await Promise.all([
  page.locator('#first').textContent(),
  page.locator('#second').textContent(),
  page.locator('#third').textContent(),
]);
```
</details>

---

### Q5 [MEDIUM] — Which CORRECTLY handles the "new tab" race condition?

A) `await page.click('#link'); const tab = await context.waitForEvent('page');`  
B) `const [tab] = await Promise.all([context.waitForEvent('page'), page.click('#link')]);`  
C) `const tab = await page.waitForEvent('page');`  
D) `await page.click('#link'); const tab = page.context().pages()[1];`  

<details><summary>Answer</summary>

**B** — `Promise.all` starts the listener (`waitForEvent`) BEFORE the click fires. This prevents the race condition where the tab opens before the listener is registered.

A = race condition (click fires first, tab might open before listener starts). C = `page` doesn't emit `'page'` events, `context` does. D = `pages()[1]` might not exist yet when accessed (tab might not be open yet).
</details>

---

## POM Patterns (Questions 6–8)

### Q6 [EASY] — Why do POM constructors NOT query the DOM?

```typescript
// This POM constructor:
constructor(page: Page) {
  this.button = page.locator('#myButton');  // Does NOT hit the DOM
}
// vs this approach:
constructor(page: Page) {
  this.button = page.$('#myButton');  // DOES hit the DOM (async)
}
```

A) `locator()` is a newer API that replaced `$()`  
B) `locator()` creates a lazy description of HOW to find the element — no DOM query until `.click()`, `.fill()`, or an assertion is called  
C) Querying the DOM in the constructor causes test failures  
D) `locator()` is faster than `$()` because it's synchronous  

<details><summary>Answer</summary>

**B** — `page.locator('#myButton')` does NOT touch the DOM. It creates a `Locator` object that describes a CSS selector. The actual DOM query only happens when you call an action (`.click()`, `.fill()`) or assertion (`toBeVisible()`). This is called "lazy evaluation" and it's intentional — POMs represent the PAGE, not a snapshot of the page at construction time.
</details>

---

### Q7 [MEDIUM] — Which is the correct Component POM composition pattern?

A) Child class extends the parent page class  
B) The page class imports and instantiates component classes in the constructor  
C) Components are created in `beforeEach` and passed to tests  
D) Each component has its own `page.goto()` call  

<details><summary>Answer</summary>

**B** — Composition over inheritance. The page class (orchestrator) creates component instances in its constructor:
```typescript
constructor(page: Page) {
  this.searchPanel = new SearchPanel(page);
  this.resultsGrid = new ResultsGrid(page);
}
```
A = inheritance makes the class larger and harder to maintain. C = components should live in the POM, not be created per-test. D = components don't have their own navigation.
</details>

---

### Q8 [HARD] — What is the benefit of the Locator Dictionary pattern for 400+ locators?

A) It's faster because object lookups are O(1)  
B) Locators are namespaced and typed, giving IDE autocomplete and preventing naming conflicts  
C) It avoids the need for a constructor  
D) Object properties are automatically lazy-evaluated  

<details><summary>Answer</summary>

**B** — The Locator Dictionary pattern groups locators into a typed nested object (e.g., `this.loc.customerSearch.firstName()`). Benefits: namespaced access prevents name collisions, TypeScript gives full autocomplete, and the structure mirrors the page's logical layout. 

A = performance is irrelevant at this scale. C = constructors are still needed. D = arrow functions `() => page.locator(...)` give lazy evaluation, but this is an explicit design choice, not automatic.
</details>

---

## Custom Fixtures & Scope (Questions 9–11)

### Q9 [MEDIUM] — What is the key difference between `scope: 'test'` and `scope: 'worker'` fixtures?

A) `'test'` fixtures can use async code; `'worker'` fixtures cannot  
B) `'test'` fixtures run before each test and tear down after; `'worker'` fixtures run once per worker process, shared across all tests in that worker  
C) `'worker'` fixtures are shared across all workers; `'test'` fixtures are not  
D) `'test'` fixtures are faster because they run in parallel  

<details><summary>Answer</summary>

**B** — `scope: 'test'` (default): setup runs before each test, teardown runs after each test. Isolated per test.

`scope: 'worker'`: setup runs ONCE when the worker starts, teardown when the worker stops. Shared across all tests in that worker.

Practical use: Login (storageState) should be worker-scoped — login once, run 20 tests, login again only when needed. Database seeding for one test should be test-scoped.
</details>

---

### Q10 [MEDIUM] — What does this fixture provide?

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

<details><summary>Answer</summary>

**B** — `scope: 'worker'` means setup (create account) happens once when the worker process starts. All tests in that worker use the SAME account. Teardown (delete account) happens when the worker stops. If you have 20 tests in a worker, all 20 share this one account — login once, run 20 tests.
</details>

---

### Q11 [HARD] — Why is this worker-scoped fixture WRONG for data that tests modify?

```typescript
// Worker-scoped fixture:
citationData: [async ({}, use) => {
  const citation = await createCitation({ amount: 150, status: 'PENDING' });
  await use(citation);
  await deleteCitation(citation.id);
}, { scope: 'worker' }]
```

A) Worker-scoped fixtures can't be async  
B) Test 1 might change the citation status to 'PAID', then Test 2 starts with a 'PAID' citation instead of 'PENDING'  
C) The fixture must return a function, not an object  
D) Fixtures can't use `await` inside them  

<details><summary>Answer</summary>

**B** — Worker-scoped fixtures are SHARED. If Test 1 changes the citation's status from 'PENDING' to 'PAID', Test 2 gets the now-PAID citation. Tests step on each other's data.

Data that tests READ (account info, pre-set up records that don't change) → worker-scoped ✓  
Data that tests MODIFY (citation status, form values, records with mutable state) → test-scoped ✓
</details>

---

## Browser Internals & Waiting (Questions 12–14)

### Q12 [MEDIUM] — D365 renders a field shell (empty) immediately, then loads data via OData (3 seconds). Which wait is correct?

A) `await page.locator('[data-automation-key="status"]').waitFor({ state: 'visible' })`  
B) `await page.waitForTimeout(5000)`  
C) `await expect(page.locator('[data-automation-key="status"]')).toHaveText('Active', { timeout: 30000 })`  
D) `const status = await page.locator('[data-automation-key="status"]').textContent()`  

<details><summary>Answer</summary>

**C** — `toHaveText('Active', { timeout: 30000 })` waits until the text is EXACTLY 'Active'. It automatically handles the two-phase render: the field is visible but empty → assertion retries → text arrives after OData call → assertion passes.

A = waits for visibility, but the field IS visible with empty text — passes too early. B = hard sleep, never acceptable. D = reads text immediately, may get `""`.
</details>

---

### Q13 [MEDIUM] — An element is in the DOM but `isVisible()` returns false. What is the FIRST thing to check?

A) The element is inside an IFrame  
B) The element is CSS-hidden (display:none, visibility:hidden, opacity:0, zero-size)  
C) The element hasn't loaded yet  
D) Playwright has a bug  

<details><summary>Answer</summary>

**B** — If `count() > 0` (element IS in the DOM) but `isVisible()` returns `false`, the element is CSS-hidden. Check `display: none`, `visibility: hidden`, `opacity: 0`, or `height/width: 0`. In D365, this happens with inactive tabs, collapsed sections, and conditional fields.

A = if it were inside an IFrame, `count()` would likely return 0 (Playwright doesn't pierce IFrames without `frameLocator`).
</details>

---

### Q14 [HARD] — `waitForLoadState('networkidle')` is called on a D365 page. What will happen?

A) It waits 500ms after all network requests finish — reliable for D365  
B) It times out because D365 SPAs make continuous background requests (telemetry, keep-alive, OData polls)  
C) It works correctly for the first load but not for subsequent navigations  
D) It's equivalent to `waitForLoadState('domcontentloaded')`  

<details><summary>Answer</summary>

**B** — `networkidle` waits for 500ms with NO network activity. D365 (and most SPAs) have continuous background activity: telemetry, keep-alive pings, OData queries for caching. The `networkidle` condition never fires, and the test hangs until timeout.

Use instead:
```typescript
await page.waitForLoadState('domcontentloaded');
await expect(page.locator('.ms-Spinner')).toHaveCount(0, { timeout: 30000 });
await expect(targetContent).toBeVisible({ timeout: 30000 });
```
</details>

---

## D365 Specific (Questions 15–17)

### Q15 [MEDIUM] — In D365, "New Record" on the CommandBar uses which ARIA role?

A) `role="button"` with `name="New Record"`  
B) `role="menuitem"` with `name="New Record"`  
C) `role="link"` with `name="New Record"`  
D) `role="option"` with `name="New Record"`  

<details><summary>Answer</summary>

**B** — D365 CommandBar buttons use `role="menuitem"`. This is because the CommandBar is implemented as an ARIA menu (`role="toolbar"`) where each button is a menu item.

```typescript
// Correct:
await page.getByRole('menuitem', { name: 'New Record' }).click();

// Wrong (the button element is there but won't match 'button' role):
await page.getByRole('button', { name: 'New Record' }).click(); // fails!
```
</details>

---

### Q16 [HARD] — Which describes D365's "two-phase render" problem?

A) D365 renders the page twice because of React StrictMode  
B) React renders the UI shell immediately with empty data, then fires OData API calls; data appears 2–12 seconds later  
C) D365 uses server-side rendering then client-side hydration  
D) The browser renders HTML then JavaScript overwrites it  

<details><summary>Answer</summary>

**B** — D365's React components render INSTANTLY with empty state (phase 1 — the shell). Then they fire OData/Dataverse API calls. When the API responds (2–12 seconds), React re-renders with real data (phase 2). Tests that check for visibility (phase 1) get empty fields.
</details>

---

### Q17 [MEDIUM] — A D365 test clicks a tab and then reads a field. The test fails with "element not visible". What is the most likely cause?

A) The tab click didn't register  
B) React unmounted the previous tab's component and is still mounting the new tab's component  
C) The field is inside an IFrame  
D) The locator is wrong  

<details><summary>Answer</summary>

**B** — In D365, tab switches unmount the old tab's React components and mount new ones. The new component takes time to mount AND load its data. Reading a field immediately after a tab click hits the component before it's mounted or before data has loaded.

Fix:
```typescript
await page.getByRole('tab', { name: 'TabName' }).click();
await expect(page.getByRole('tab', { name: 'TabName' })).toHaveAttribute('aria-selected', 'true');
await expect(page.locator('.ms-Spinner')).toHaveCount(0, { timeout: 20000 });
// Now the component is mounted and data has loaded
await expect(fieldLocator).toBeVisible({ timeout: 15000 });
```
</details>

---

## Parallel Execution & Workers (Questions 18–20)

### Q18 [EASY] — Where should shared, immutable test data (e.g., account credentials) be defined?

A) As `const` at module level in the spec file  
B) As a `let` variable at module level  
C) Inside the test function  
D) In `playwright.config.ts` directly  

<details><summary>Answer</summary>

**A** — Immutable test data (credentials, expected values, product IDs that never change) can safely be `const` at module level. It's read-only and parallel workers each get their own copy.

B = mutable module-level state is dangerous in parallel execution. C = fine for test-specific data, but duplication if shared across tests. D = config is for Playwright settings, not test data.
</details>

---

### Q19 [HARD] — This test fails 50% of the time in parallel execution. Why?

```typescript
let createdUserId: string;

test('Create user', async ({ page }) => {
  createdUserId = await adminPortal.createUser(testData);
});

test('Verify user in portal', async ({ page }) => {
  await customerPortal.verifyUser(createdUserId); // sometimes undefined!
});
```

A) Module-level `let` is not accessible between test functions  
B) In parallel execution, the two tests may run in DIFFERENT worker processes that don't share module-level variables  
C) `createdUserId` should be `const`  
D) The `async` keyword is missing  

<details><summary>Answer</summary>

**B** — Playwright workers are separate Node.js processes. Module-level variables are NOT shared between processes. Worker 1 runs "Create user" and sets `createdUserId`. Worker 2 runs "Verify user" and sees `createdUserId` as `undefined` (it was never set in Worker 2's process).

Fix: Use `test.describe()` serial mode to force sequential execution, or use fixtures that pass data through the Playwright fixture system, or use an API/DB to share state between tests.
</details>

---

### Q20 [MEDIUM] — What does `test.describe.serial()` do?

A) Makes tests run faster by skipping slow operations  
B) Forces all tests in the describe block to run in the same worker, sequentially — previous test's state is preserved  
C) Runs tests in alphabetical order  
D) Prevents tests from being retried on failure  

<details><summary>Answer</summary>

**B** — `test.describe.serial()` runs all tests in the block in the SAME worker, one at a time, in the order they're defined. This allows tests to share state (the first test sets up, subsequent tests verify). If any test fails, the rest are skipped by default.

Use only when you NEED shared state (E2E flows across multiple tests). Prefer self-contained tests otherwise.
</details>

---

## Cross-Website Patterns (Questions 21–23)

### Q21 [MEDIUM] — When should you use two separate `BrowserContext` objects?

A) When running tests in parallel (always)  
B) When two different user accounts need to interact simultaneously  
C) When testing on two different browsers  
D) When a test opens a new tab  

<details><summary>Answer</summary>

**B** — Two different user accounts (e.g., admin + customer) need isolated sessions — different cookies, different localStorage, different auth states. Two separate `BrowserContext` objects give complete isolation.

A = Playwright workers each have their own browser; you don't manage that manually. C = different browsers are configured in `playwright.config.ts` projects. D = new tabs in the same session share a context (Pattern 2, Chapter 12).
</details>

---

### Q22 [HARD] — What does `storageState` NOT capture?

A) `HttpOnly` cookies  
B) `localStorage` values  
C) `sessionStorage` values  
D) Regular (non-HttpOnly) cookies  

<details><summary>Answer</summary>

**C** — `sessionStorage` is NOT captured by Playwright's `storageState`. Session storage is per-tab and designed to be non-persistent. Playwright's serialized state file only includes cookies and localStorage.

This is a practical problem: if your app stores auth tokens in `sessionStorage`, `storageState` won't work for pre-loading auth. Fix: inject the token via `page.addInitScript()` or change the app to use localStorage or HttpOnly cookies.
</details>

---

### Q23 [MEDIUM] — In a cross-website sequential flow, where should the Data Accumulator object be defined?

A) As a module-level `let` variable  
B) Inside the `test()` function, as a local `const` object  
C) In the fixture, with `scope: 'worker'`  
D) In a separate JSON file on disk  

<details><summary>Answer</summary>

**B** — The Data Accumulator is a plain TypeScript object defined INSIDE the test function. It's isolated to that test's execution context. Each test has its own accumulator — no sharing between parallel tests.

A = module-level variables are shared across tests in the same worker → data corruption. C = worker-scoped fixtures are shared across tests → same problem. D = unnecessary disk I/O, and file conflicts in parallel runs.
</details>

---

## TypeScript for Playwright (Questions 24–25)

### Q24 [MEDIUM] — Why do you need `as const` for ARIA role strings?

```typescript
const role = 'button';                   // TypeScript infers: string
const role = 'button' as const;          // TypeScript infers: 'button' (literal type)

page.getByRole(role, { name: 'Submit' }); // ← which works?
```

A) Both work — `string` and `'button'` are equivalent for `getByRole`  
B) Only `as const` works — `getByRole` expects a specific literal union type, not `string`  
C) Neither works — you must write the string inline  
D) `as const` prevents the role from being reassigned  

<details><summary>Answer</summary>

**B** — `page.getByRole()` expects `AriaRole` which is a union type: `'button' | 'checkbox' | 'menuitem' | ...`. A plain `string` doesn't satisfy this type constraint — TypeScript sees `string` as too broad. `as const` narrows the type from `string` to the literal type `'button'`, which matches `AriaRole`.

```typescript
const role = 'button' as const;  // type: 'button' ← matches AriaRole
page.getByRole(role);            // ✓ TypeScript happy
```
</details>

---

### Q25 [HARD] — What is the purpose of `expect.objectContaining` vs `toEqual`?

```typescript
const response = { id: 'C-001', name: 'John', email: 'j@test.com', createdAt: '2026-01-01' };

// Option A:
expect(response).toEqual({ id: 'C-001', name: 'John' });

// Option B:
expect(response).toEqual(expect.objectContaining({ id: 'C-001', name: 'John' }));
```

A) Both are equivalent — `toEqual` ignores extra properties  
B) Option A fails (toEqual requires EXACT match); Option B passes (objectContaining is a partial match)  
C) Option B is slower because it checks more properties  
D) `objectContaining` is only for arrays, not objects  

<details><summary>Answer</summary>

**B** — `toEqual` requires EXACT object equality. Option A fails because `response` also has `email` and `createdAt` which are not in `{ id: 'C-001', name: 'John' }`.

`expect.objectContaining({ id: 'C-001', name: 'John' })` is a PARTIAL matcher — it only checks that the specified keys have the specified values, ignoring other properties.

Use `toEqual` when you know ALL properties and want to verify the complete shape.  
Use `objectContaining` when you only care about some properties (or when the API may add new fields).
</details>

---

## Advanced Topics: CDP, API Mocking & Flakiness (Questions 26–40)

### Q26 [HARD] — How do you use CDP (Chrome DevTools Protocol) to throttle network in Playwright?

A) `await page.route('**/*', route => route.throttle({ download: 50 }))`  
B) `await page.context().setNetworkConditions({ download: 50, upload: 50, latency: 100 })`  
C) Create a CDPSession and send 'Network.emulateNetworkConditions'  
D) Network throttling is not supported in Playwright  

<details><summary>Answer</summary>

**C** — Playwright doesn't have a built-in `setNetworkConditions` like Puppeteer. You must use a CDP session:
```typescript
const client = await page.context().newCDPSession(page);
await client.send('Network.emulateNetworkConditions', {
  offline: false,
  downloadThroughput: 50 * 1024,
  uploadThroughput: 50 * 1024,
  latency: 100
});
```
</details>

---

### Q27 [MEDIUM] — What is the fundamental difference between `page.route` and `request.get`?

A) `page.route` makes HTTP requests, `request.get` intercepts them  
B) `page.route` intercepts and modifies network traffic made by the browser; `request.get` initiates a new HTTP request from the Node.js test process  
C) They do the same thing but `page.route` is for the UI and `request.get` is for API  
D) `page.route` only works for GET requests  

<details><summary>Answer</summary>

**B** — `page.route` is a listener. It catches requests made by the webpage (e.g. `fetch()`, `<img>`, `<script>`) and allows you to fulfill, abort, or modify them. `request.get` (the `APIRequestContext`) acts as an HTTP client, sending a new HTTP request directly from the Node.js process (bypassing the browser entirely).
</details>

---

### Q28 [EASY] — Why should you NOT use `Math.random()` to generate unique test data (like emails)?

A) `Math.random()` is not cryptographically secure  
B) It can generate duplicates, causing flaky test failures that are hard to reproduce  
C) Playwright overrides `Math.random()` to return 0  
D) It slows down parallel test execution  

<details><summary>Answer</summary>

**B** — `Math.random()` can generate duplicates, leading to random constraint violations in the database. Use deterministic UUIDs (`crypto.randomUUID()`) or test-run-specific timestamps + worker IDs.
</details>

---

### Q29 [HARD] — How does Playwright's `expect.poll` help with testing polling architectures?

A) It automatically mocks the API to return the expected result  
B) It repeatedly executes the provided synchronous/asynchronous block until the expectation passes or the timeout is reached  
C) It replaces `waitForTimeout` with a more efficient sleep  
D) It intercepts WebSocket traffic to check for messages  

<details><summary>Answer</summary>

**B** — `expect.poll` executes the block, evaluates the assertion, and if it fails, waits an interval and tries again, repeating until timeout. It is essential for testing systems where data state changes over time (like external webhooks or background jobs).
</details>

---

### Q30 [MEDIUM] — When doing Visual Regression Testing (`toHaveScreenshot`), what does `maxDiffPixelRatio` control?

A) The maximum number of total pixels that can differ  
B) The threshold at which color differences are ignored  
C) The percentage of total pixels that are allowed to differ before the test fails  
D) The resolution of the screenshot taken  

<details><summary>Answer</summary>

**C** — `maxDiffPixelRatio` (e.g., `0.01` for 1%) allows a certain percentage of the image's pixels to differ before throwing an error. This helps ignore small rendering differences (like anti-aliasing) across environments.
</details>

---

### Q31 [HARD] — Why is it recommended to clean up database test data in the `beforeEach` block instead of `afterEach`?

A) Because `afterEach` is skipped if a test fails  
B) If a test fails and `afterEach` is skipped, the data is left behind. Doing cleanup in `beforeEach` ensures a clean state regardless of what happened in the previous run.  
C) `beforeEach` runs faster than `afterEach`  
D) Database connections are closed before `afterEach` runs  

<details><summary>Answer</summary>

**B** — The "Cleanup Before, Not After" pattern. If a test crashes, `afterEach` might not execute, leaving dirty data that ruins the next test run. Cleaning up in `beforeEach` ensures the test controls its own starting state.
</details>

---

### Q32 [MEDIUM] — Which of these is a valid use case for GraphQL testing compared to REST testing?

A) Asserting on the HTTP status code (since it's always 200/400)  
B) Verifying that the endpoint returns XML  
C) Asserting on the `errors` array in the JSON response body, even when HTTP status is 200  
D) Testing URL path parameters (e.g., `/graphql/users/1`)  

<details><summary>Answer</summary>

**C** — GraphQL APIs almost always return HTTP 200, even when the query fails (e.g., permission denied, item not found). SDETs must inspect the `errors` array in the JSON body, rather than relying on HTTP 4xx/5xx status codes.
</details>

---

### Q33 [HARD] — In Playwright, what is the best way to bypass a third-party CAPTCHA during automated E2E tests?

A) Use an AI service to solve the CAPTCHA via CDP  
B) Ask developers to provide a test environment bypass (e.g., a specific cookie, header, or hardcoded test user)  
C) Run the test in headed mode and manually solve it  
D) Slow down the typing speed to trick the CAPTCHA  

<details><summary>Answer</summary>

**B** — The golden rule of testing third-party security is "don't". You do not want to test Google's reCAPTCHA implementation; you want to test your app. Providing a bypass (like an `X-Bypass-Captcha` header for the test environment) is the industry standard.
</details>

---

### Q34 [MEDIUM] — You want to intercept and modify the JSON response of an API call made by the frontend. How?

A) `page.route('**/api/data', route => route.abort())`  
B) `page.route('**/api/data', async route => { const resp = await route.fetch(); const json = await resp.json(); json.field = 'mocked'; await route.fulfill({ json }); })`  
C) `page.on('response', resp => resp.json = () => ({ field: 'mocked' }))`  
D) `request.get('**/api/data').then(res => res.json())`  

<details><summary>Answer</summary>

**B** — To modify a response, you must first let the request go to the server (`route.fetch()`), read the response, modify the JSON payload, and then fulfill the route with the modified JSON using `route.fulfill()`.
</details>

---

### Q35 [EASY] — Which tool is integrated into Playwright to run accessibility scans?

A) Lighthouse  
B) OWASP ZAP  
C) @axe-core/playwright  
D) SonarQube  

<details><summary>Answer</summary>

**C** — `@axe-core/playwright` is the standard library used with Playwright to run accessibility checks based on WCAG standards.
</details>

---

### Q36 [HARD] — You need to run a specific setup script only once for the entire test suite (e.g., creating a global database schema). Where do you place it?

A) In `test.beforeAll` in every spec file  
B) In a `scope: 'worker'` fixture  
C) In `globalSetup` in the `playwright.config.ts`  
D) In the `playwright.config.ts` top-level code  

<details><summary>Answer</summary>

**C** — `globalSetup` runs exactly once before all workers spawn. `test.beforeAll` runs once per worker per file. `scope: 'worker'` fixtures run once per worker.
</details>

---

### Q37 [MEDIUM] — When testing file downloads, how do you capture the downloaded file path?

A) `const download = await page.waitForEvent('download'); await page.click('button'); console.log(await download.path());`  
B) `const [download] = await Promise.all([page.waitForEvent('download'), page.click('button')]); console.log(await download.path());`  
C) `page.on('download', download => console.log(download.path()))`  
D) `const file = await page.download('button');`  

<details><summary>Answer</summary>

**B** — You must use `Promise.all` to set up the `waitForEvent` listener BEFORE clicking the button that triggers the download, to avoid race conditions.
</details>

---

### Q38 [HARD] — Why might `page.waitForLoadState('networkidle')` cause flaky tests in Modern SPAs?

A) SPAs often use WebSockets, which don't count as network activity  
B) SPAs frequently run background polling, keep-alive pings, or telemetry, meaning the network is never truly "idle" for 500ms  
C) `networkidle` only works for static HTML pages  
D) Playwright has a bug with `networkidle` on Chrome  

<details><summary>Answer</summary>

**B** — Modern apps (especially Dynamics 365, React, Angular) continuously send tracking data or poll for notifications. `networkidle` requires 500ms of zero network connections, which rarely happens, leading to timeouts.
</details>

---

### Q39 [MEDIUM] — You want to test that clicking a 'Delete' button shows a browser native `window.confirm` dialog, and you want to click 'OK'. How?

A) `await page.click('button'); await page.click('text=OK');`  
B) `page.on('dialog', dialog => dialog.accept()); await page.click('button');`  
C) `const dialog = await page.waitForSelector('dialog'); await dialog.accept();`  
D) Native dialogs cannot be tested in Playwright  

<details><summary>Answer</summary>

**B** — Native browser dialogs (`alert`, `confirm`, `prompt`) do NOT appear in the DOM. You must listen for the `'dialog'` event and call `.accept()` or `.dismiss()` on the dialog object.
</details>

---

### Q40 [HARD] — What is the "Page Object Model Component Pattern"?

A) Inheriting a BasePage for every new page  
B) Putting all locators in one giant JSON file  
C) Splitting a large Page Object into smaller, reusable classes (e.g., `HeaderComponent`, `TableComponent`) that the main Page Object instantiates in its constructor  
D) Using Web Components in your tests  

<details><summary>Answer</summary>

**C** — The Component POM pattern breaks down mega-pages into smaller, logical pieces. The main Page Object acts as an orchestrator, instantiating the components (e.g. `this.header = new HeaderComponent(page)`), leading to modular and maintainable code.
</details>

---

**Your Score:**
- 35–40: 🏆 Expert — Ready for senior SDET interviews
- 28–34: ✅ Solid — Review any categories you missed
- 20–27: 📖 Good foundation — Re-read the chapters for missed questions
- Below 20: 🔁 Start from Chapter 1, these fundamentals need more practice

---
**Navigation**: [Index](../00_INDEX.md) | [→ Quiz 02: Code Challenges](./QUIZ_02_Playwright_CodeChallenge.md)
