# Reliability

> The authoritative reference for making tests deterministic. Every class of flakiness, every wait primitive, every async pattern, every real-world failure mode with diagnosis. The single most important reference doc in this repository — flakiness is what kills test suites, and flakiness is fixable.

---

## Table of contents

1. [Why flakiness matters](#1-why-flakiness-matters)
2. [The 10 classes of flakiness](#2-the-10-classes-of-flakiness)
3. [The diagnostic flowchart](#3-the-diagnostic-flowchart)
4. [Wait primitives — the complete reference](#4-wait-primitives)
5. [`expect.poll` — the polling primitive](#5-expectpoll)
6. [`page.waitFor*` — the navigation/network primitives](#6-pagewaitfor)
7. [Auto-waiting — what Playwright handles automatically](#7-auto-waiting)
8. [Timing in SPAs vs SSR](#8-timing-in-spas-vs-ssr)
9. [The D365 two-phase render problem](#9-the-d365-two-phase-render)
10. [Animations, transitions, and stable bounding boxes](#10-animations-transitions)
11. [Network timing — flush before assert](#11-network-timing)
12. [Race conditions in Promise.all patterns](#12-race-conditions)
13. [Retry semantics — when retries lie](#13-retry-semantics)
14. [The trace viewer as diagnostic tool](#14-trace-viewer-diagnostic)
15. [War stories — 14 real production bugs](#15-war-stories)
16. [Anti-pattern catalog](#16-anti-pattern-catalog)

---

## 1. Why flakiness matters

A flaky test is one that passes and fails non-deterministically on the same code. Industry data:

- The average enterprise SDET suite has 5–15% flaky tests.
- Each flaky test costs ~30 min of investigation per occurrence.
- Teams with >5% flakiness eventually start ignoring failures ("just rerun") — at which point real bugs slip through.

The fix is not "add more retries." Retries hide flakes — they don't fix them. A test that fails 1/10 attempts with `retries: 3` looks green 80% of the time and broken 20%. Both are worse than a deterministic test.

### 1.1 The economic case

For a 500-test suite with 5% flakiness, weekly CI:
- 25 flakes × 30 min × 1/week = 12.5 hours/week
- 50 weeks × 12.5 = 625 hours/year
- One engineer's full-time for a quarter

Fixing flakiness has the highest ROI of any test-quality investment.

### 1.2 The trust case

Beyond the time cost, flakiness destroys trust. Engineers start to:
- Auto-rerun on failure without investigating.
- Merge PRs with "known-flaky" tests still red.
- Stop writing tests because "they'll just be flaky anyway."

This is the death spiral. Every flake fixed restores a small amount of trust.

### 1.3 The "flaky" label is dangerous

When a test is labelled `@flaky`, it stops being investigated. The label becomes a hospice. Real bugs hide there.

Replace `@flaky` with `@investigate` and assign an owner. Either fix it within 2 weeks or quarantine it.

---

## 2. The 10 classes of flakiness

Every flaky test falls into one of these categories. The fix depends on the class.

| # | Class | Example | Root cause | Fix |
|---|---|---|---|---|
| 1 | **Hard sleep** | `await page.waitForTimeout(2000)` | Wall-clock isn't deterministic | Replace with content-based wait |
| 2 | **Race condition (event)** | `waitForEvent` AFTER click | Event fires before listener | `Promise.all([waitForEvent, action])` |
| 3 | **Race condition (state)** | Read after write before commit | DB / API hasn't fsync'd | `expect.poll` for the expected state |
| 4 | **Stale render** | Reading a field before re-render | Two-phase render shows old value | Wait for landmark element + spinner clear |
| 5 | **Animation interception** | Click mid-fade-in | Bounding box moving | Auto-wait handles most; disable animations otherwise |
| 6 | **Shared mutable state** | Module-level `let createdId` | Parallel workers see different memory | Test isolation; per-test data |
| 7 | **External dependency** | Real OAuth IdP rate-limits | 3rd-party service can flake | Cache tokens; use stubs in CI |
| 8 | **Resource contention** | DB lock from another test | Concurrent test data conflicts | Account pools; unique IDs |
| 9 | **Environment drift** | Test passes on macOS, fails on Linux | OS-specific differences | Run in Docker; reproduce locally |
| 10 | **Test-data leak** | Previous run left data | Cleanup didn't run | Aggressive cleanup; namespace data |

### 2.1 Frequencies (from empirical analysis)

In a typical enterprise suite:

| Class | % of total flakes |
|---|---|
| Hard sleep (1) | ~30% |
| Race conditions (2, 3) | ~25% |
| Stale render (4) | ~15% |
| Shared state (6) | ~10% |
| External dependency (7) | ~8% |
| Resource contention (8) | ~5% |
| Animation (5) | ~3% |
| Test-data leak (10) | ~2% |
| Environment drift (9) | ~2% |

Hard sleep + race conditions = 55% of all flakes. Fixing those two patterns moves the needle most.

---

## 3. The diagnostic flowchart

When a test fails intermittently:

```
1. Is it deterministic? (--repeat-each=20)
   ├── Always fails → it's a real bug, not flake
   └── Passes some of the time → flake; continue
   
2. What's the failure mode?
   ├── Timeout → likely class 1 (hard sleep) or class 4 (stale render)
   ├── "strict mode violation" → likely class 6 (shared state) or class 10 (data leak)
   ├── "element not visible" or "not actionable" → likely class 5 (animation) or class 4 (stale render)
   ├── "context destroyed" / "page closed" → likely class 7 (external service)
   ├── 4xx or 5xx response → likely class 7 (external) or class 8 (resource contention)
   └── "could not connect" → likely class 9 (env) or class 7 (external)
   
3. Open the trace (npx playwright show-trace).
   ├── Look at the action that failed.
   ├── Check the timeline — what was happening 5s before failure?
   ├── Look at network — was there an in-flight request?
   ├── Look at console — any errors from the page?
   └── Compare with a passing trace (if you have one).

4. Apply the class-specific fix from §2.
```

### 3.1 The repro

Step 1 (`--repeat-each`) is the most important. A test that passes 19/20 with the same code is flaky. A test that fails 20/20 is broken.

```bash
# Run the suspected flake 20 times locally
npx playwright test --repeat-each=20 --grep "flaky test name"

# Or run a specific file 50 times in parallel
npx playwright test path/to/file.spec.ts --repeat-each=50 --workers=4
```

### 3.2 The class diagnosis from error message

| Error pattern | Likely class |
|---|---|
| `Test timeout of 30000ms exceeded` | 1, 4 |
| `Timeout 5000ms exceeded while waiting for expect()` | 4, 5 |
| `locator.click: Timeout` | 4, 5 |
| `strict mode violation` | 6, 10 |
| `element is not visible` | 4, 5 |
| `element is not enabled` | 4 |
| `target closed` / `context destroyed` | 5, 7 |
| `net::ERR_*` | 9 |
| `expect(received).toBe(expected)` with status 5xx | 7, 8 |
| `expect(received).toBe(expected)` with empty string | 4 |

### 3.3 The trace

Always start with the trace. Without a trace, you're guessing.

If the failure didn't capture a trace:
- `trace: 'retain-on-failure'` should have captured it. Check `test-results/<test>/trace.zip`.
- If the trace zip is missing, the test was killed before Playwright could write it (worker crash, OOM, timeout exceeded).

---

## 4. Wait primitives

The complete list of "wait for X" primitives, with their semantics.

### 4.1 The hierarchy

```
1. Auto-waiting (built into click, fill, etc.)
2. expect(locator).toX() — polling assertion
3. expect.poll(callback) — polling on custom predicate
4. page.waitForResponse / waitForRequest — network-bound
5. page.waitForURL — navigation-bound
6. page.waitForLoadState — page lifecycle
7. page.waitForFunction — JS predicate in page
8. locator.waitFor — element state
9. page.waitForEvent — generic event
10. page.waitForTimeout — DON'T (only for triaging)
```

### 4.2 What each waits for

| Primitive | Waits for | Timeout default |
|---|---|---|
| Auto-wait | Actionable state (5 checks) | `actionTimeout` or `timeout` |
| `expect(loc).toX` | Assertion to pass | `expect.timeout` (5s) |
| `expect.poll` | Callback result to satisfy assertion | Caller-specified |
| `waitForResponse` | An HTTP response matching predicate | `navigationTimeout` (30s) |
| `waitForRequest` | An outbound HTTP request matching predicate | `navigationTimeout` |
| `waitForURL` | URL to match pattern | `navigationTimeout` |
| `waitForLoadState` | `'load'` / `'domcontentloaded'` / `'networkidle'` | `navigationTimeout` |
| `waitForFunction` | JS function in page to return truthy | `actionTimeout` |
| `locator.waitFor` | Element to reach state (`visible`/`hidden`/`attached`/`detached`) | `actionTimeout` |
| `waitForEvent` | Event to fire on context/page | `navigationTimeout` |
| `waitForTimeout` | Wall-clock duration | N/A (the value IS the wait) |

### 4.3 Selection guide

| Situation | Use |
|---|---|
| Asserting on UI text | `expect(loc).toHaveText(...)` |
| Asserting on element visibility | `expect(loc).toBeVisible()` |
| Asserting on element count | `expect(loc).toHaveCount(N)` |
| Asserting on URL after navigation | `expect(page).toHaveURL(...)` or `page.waitForURL(...)` |
| Waiting for async DB write to propagate | `expect.poll(async () => api.get(id).then(r => r.status))` |
| Waiting for a download/upload event | `Promise.all([page.waitForEvent('download'), trigger])` |
| Waiting for new tab open | `Promise.all([context.waitForEvent('page'), trigger])` |
| Waiting for specific network response | `Promise.all([page.waitForResponse(predicate), trigger])` |
| Waiting for spinner to disappear | `expect(spinner).toHaveCount(0)` |
| Waiting for animation to finish | Auto-wait handles it; or disable animations |
| Waiting for fixed time (triaging only) | `waitForTimeout` — replace before merging |

### 4.4 What NOT to use

- `setTimeout` in tests — never. Use `expect.poll` or `expect(loc)`.
- `setInterval` — same.
- Manual polling loops — Playwright's polling is exponential-backoff with deduplication.

---

## 5. `expect.poll`

The general-purpose polling primitive.

### 5.1 Basic syntax

```typescript
await expect.poll(
  async () => {
    const response = await api.get(`/citations/${id}`);
    const body = await response.json();
    return body.status;
  },
  {
    message: 'Citation never reached PAID',
    timeout: 120_000,
    intervals: [1000, 2000, 5000, 10000],
  },
).toBe('PAID');
```

### 5.2 Options

| Option | Default | Notes |
|---|---|---|
| `timeout` | 5000 ms | Caller-specified — usually you want this much higher |
| `intervals` | `[100, 250, 500, 1000]` ms | Backoff array; cycles through then stays at last |
| `message` | undefined | Custom error message on timeout |

### 5.3 Interval mechanics

```typescript
intervals: [1000, 2000, 5000, 10000]
```

Means:
- 1st poll after 1s
- 2nd poll after 1s + 2s = 3s
- 3rd poll after 3s + 5s = 8s
- 4th poll after 8s + 10s = 18s
- 5th poll after 18s + 10s = 28s (interval stays at last value)
- ... continues at 10s intervals until timeout

For a 120-second timeout: 1, 3, 8, 18, 28, 38, 48, ..., 118.

### 5.4 Backoff strategy

For fast events (UI), use short intervals: `[100, 200, 500]`. For slow events (cron jobs, eventual consistency), use long: `[1000, 5000, 15000]`.

Wrong intervals = wasted CPU (too short, hammer the system) or wasted time (too long, slow tests).

### 5.5 Throwing inside `poll`

To short-circuit on permanent failure:

```typescript
await expect.poll(async () => {
  const response = await api.get(`/jobs/${id}`);
  const body = await response.json();
  if (body.status === 'FAILED') {
    throw new Error(`Job failed permanently: ${body.error}`);
  }
  return body.status;
}, { timeout: 300_000 }).toBe('SUCCESS');
```

Without the throw, you'd poll for 5 minutes waiting for SUCCESS that will never come.

### 5.6 Matchers beyond `.toBe`

```typescript
await expect.poll(() => fetchCount()).toBeGreaterThan(0);
await expect.poll(() => fetchStatus()).toMatch(/^(PROCESSING|PAID)$/);
await expect.poll(() => fetchObject()).toMatchObject({ status: 'PAID', amount: 150 });
```

Any expect matcher works after `expect.poll(callback)`.

### 5.7 The "wait + return" pattern in domain clients

```typescript
class CitationsClient {
  async waitForStatus(id: string, expected: Citation['status'], timeoutMs = 120_000): Promise<Citation> {
    let last: Citation | undefined;
    await expect.poll(async () => {
      last = await this.getById(id);
      return last.status;
    }, { timeout: timeoutMs, intervals: [500, 1000, 2000, 5000] }).toBe(expected);
    return last!;
  }
}

// Usage
const citation = await citations.waitForStatus(id, 'PAID');
expect(citation.amount).toBe(150);
```

Wrap polling in domain methods so tests don't repeat the pattern.

---

## 6. `page.waitFor*`

Navigation and network primitives.

### 6.1 `waitForURL`

```typescript
await page.waitForURL(/\/dashboard$/);
await page.waitForURL('https://example.com/done', { timeout: 60_000 });
await page.waitForURL(url => url.searchParams.has('success'));
```

Resolves when the page's URL matches. The match runs on every navigation event.

### 6.2 `waitForLoadState`

```typescript
await page.waitForLoadState('domcontentloaded');      // HTML parsed
await page.waitForLoadState('load');                  // all resources loaded
await page.waitForLoadState('networkidle');           // no network for 500ms
```

| State | When it fires |
|---|---|
| `'domcontentloaded'` | After initial HTML is parsed |
| `'load'` | After all subresources (images, CSS, JS) loaded |
| `'networkidle'` | After 500ms of no network activity |

> **Warning:** `'networkidle'` is FRAGILE in real SPAs. Many apps maintain persistent connections (WebSockets, long-polling, analytics beacons) that never go idle. Tests waiting for `'networkidle'` hang forever.
>
> Prefer content-based waits (`expect(loc).toBeVisible()`) over `'networkidle'`.

### 6.3 `waitForResponse`

```typescript
const [response] = await Promise.all([
  page.waitForResponse(r => r.url().includes('/api/citations') && r.method() === 'POST'),
  page.click('#save'),
]);
expect(response.ok()).toBeTruthy();
const body = await response.json();
expect(body.id).toBeDefined();
```

Resolves with the matching `Response` object. Useful when:
- You need to inspect the response of an action.
- You need to verify the request was made (e.g., "Save" actually called the API).

The `Promise.all` is essential — `waitForResponse` must be registered BEFORE the action that triggers it.

### 6.4 `waitForRequest`

```typescript
const [request] = await Promise.all([
  page.waitForRequest(r => r.url().includes('/track')),
  page.click('#submit'),
]);
expect(request.postDataJSON()).toMatchObject({ event: 'click-submit' });
```

Resolves with the matching outgoing `Request`. Useful for analytics testing.

### 6.5 `waitForFunction`

```typescript
await page.waitForFunction(() => window.app && window.app.initialised === true);
await page.waitForFunction(
  ({ expected }) => document.querySelectorAll('.row').length === expected,
  { expected: 10 },
  { timeout: 30_000 },
);
```

The function runs in the page context. Useful when you need a custom JS predicate.

> Most uses of `waitForFunction` can be replaced with `expect(locator).toX()` or `expect.poll`. Reach for it only when the predicate can't be expressed as a locator.

### 6.6 `locator.waitFor`

```typescript
await page.locator('.toast').waitFor({ state: 'visible' });
await page.locator('.spinner').waitFor({ state: 'hidden' });
await page.locator('.modal').waitFor({ state: 'attached' });
await page.locator('.placeholder').waitFor({ state: 'detached' });
```

| State | Meaning |
|---|---|
| `'attached'` | Element is in the DOM (may be hidden) |
| `'detached'` | Element is NOT in the DOM |
| `'visible'` | Attached + non-zero size + not display:none |
| `'hidden'` | Detached OR display:none OR visibility:hidden OR zero size |

Most actions and assertions imply `waitFor`. Use it explicitly when you need to wait without acting.

---

## 7. Auto-waiting

Playwright actions auto-wait for the element to be actionable. This handles 80% of timing concerns.

### 7.1 The 5 actionability checks

Before `click`, `fill`, `type`, `check`, `selectOption`, `tap`, `dblclick`:

1. **Attached** to the DOM.
2. **Visible** — non-zero size, not `display: none`.
3. **Stable** — 2 consecutive `requestAnimationFrame` with same bounding box.
4. **Receives events** — hit test passes at the centre point.
5. **Enabled** — not `[disabled]` or `aria-disabled`.

All 5 must pass within `actionTimeout`. If any fails, Playwright retries until timeout.

### 7.2 What this prevents

| Scenario | Without auto-wait | With auto-wait |
|---|---|---|
| Click during fade-in animation | Click registers at wrong coords | Wait for stable bounding box |
| Click on element covered by spinner | Spinner gets the click | Wait for hit-testable |
| Click on `<button disabled>` until enabled | Click is no-op | Wait for enabled |
| Fill input that's tab-hidden | Fill goes nowhere | Wait for visible |

### 7.3 When auto-wait isn't enough

Auto-wait checks the ELEMENT. It doesn't check the APPLICATION state. If your app needs to load data before the field has meaningful value, auto-wait won't help — the field exists and is "actionable" but contains stale data.

Use content-based assertions:

```typescript
// Wait for the field to contain the EXPECTED value, not just be visible
await expect(page.locator('[data-field="customer-name"]')).toHaveText('Contoso');
```

### 7.4 The `force` option — escape hatch

```typescript
await locator.click({ force: true });
```

Skips ALL actionability checks. Useful for adversarial tests ("can we click a hidden button?"). Don't use to "fix" flakes — you're fixing the symptom, not the cause.

### 7.5 Assertion auto-retry

Every `expect(locator).toX()` polls until pass or timeout:

```typescript
await expect(page.locator('.status')).toHaveText('Active');
// Internally polls every 100ms (exponential backoff) until either:
//   .status text === 'Active' → pass
//   timeout exceeded → fail
```

This is FAR better than reading textContent once and comparing:

```typescript
// ❌ Single snapshot — fails if DOM hasn't rendered yet
expect(await page.locator('.status').textContent()).toBe('Active');

// ✅ Polling — succeeds when the value eventually appears
await expect(page.locator('.status')).toHaveText('Active');
```

---

## 8. Timing in SPAs vs SSR

### 8.1 Server-side rendered (SSR)

```
1. Browser requests URL
2. Server renders HTML
3. Browser receives complete HTML
4. domcontentloaded fires
5. Page is interactive
```

By `domcontentloaded`, all visible content is present. Locators find what they're looking for.

### 8.2 Single-page application (SPA)

```
1. Browser requests URL
2. Server returns shell HTML + JS bundle (200KB-10MB)
3. Browser parses HTML, loads JS
4. domcontentloaded fires (page is BLANK)
5. JS executes, renders the app
6. App fetches data from API
7. Data renders into DOM
8. Page is interactive
```

By `domcontentloaded`, the page is empty. Locators find nothing. `'networkidle'` may never fire (analytics, WebSockets).

### 8.3 The SPA-friendly wait pattern

```typescript
// Navigate
await page.goto('/dashboard');

// Don't wait for load state — wait for content
await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible();

// Now interact
await page.getByRole('link', { name: 'Customers' }).click();
```

### 8.4 The framework-specific signals

| Framework | Hint that app is ready |
|---|---|
| React | `window.app && window.app.ready` (if app exposes it) OR a known root element |
| Vue | `document.getElementById('app').children.length > 0` |
| Angular | `getAllAngularRootElements().length > 0` (legacy AngularJS) |
| D365 | `.ms-Spinner` count is 0 (see §9) |

Don't rely on these — they're fragile. Always prefer content-based assertions on the specific page.

### 8.5 SSR + SPA hybrid (Next.js, Nuxt, Remix)

Hybrid frameworks SSR the initial page then hydrate to SPA. Behaviour:

- First navigation: SSR — page is complete at `domcontentloaded`.
- Subsequent in-app navigation: SPA — same patterns as full SPAs.

Tests that goto the URL fresh are SSR; tests that click links are SPA.

---

## 9. The D365 two-phase render

D365 (and other Fluent UI apps) render in two phases:

### 9.1 Phase 1 — shell

```
1. Browser navigates to /customers/CUST-001
2. D365 shell renders (header, sidebar, command bar, form skeleton)
3. .ms-Spinner appears in the form area
4. domcontentloaded fires
```

The form fields exist but have NO values. `textContent` returns empty.

### 9.2 Phase 2 — data fetch + populate

```
5. D365 fires OData call: /api/data/v9.2/accounts(CUST-001)
6. Response (5-30 seconds in production CRM)
7. D365 populates fields
8. .ms-Spinner disappears
9. Form is interactive with real data
```

### 9.3 The wait pattern

```typescript
async function waitForD365Load(page: Page, expectedTitle?: string): Promise<void> {
  // Phase 2 complete: spinners gone
  await expect(page.locator('.ms-Spinner')).toHaveCount(0, { timeout: 45_000 });

  // Optional: verify we're on the right record
  if (expectedTitle) {
    const titleArea = page.locator('.ms-CommandBar, .ms-PageHeader, h1[title]').first();
    await expect(titleArea).toContainText(expectedTitle, { timeout: 30_000 });
  }
}
```

### 9.4 The stale-render trap

If you navigate from CUST-001 to CUST-002, D365 may briefly show CUST-001's data while fetching CUST-002. Reading a field's text content at that moment returns the WRONG value.

```typescript
// ❌ Reads stale value
await navigateToCustomer('CUST-002');
const name = await page.locator('[data-automation-key="name"]').textContent();
// name might be 'CUST-001'

// ✅ Wait for data refresh
await navigateToCustomer('CUST-002');
await waitForD365Load(page, 'CUST-002');  // verifies header shows new ID
const name = await page.locator('[data-automation-key="name"]').textContent();
```

### 9.5 The form-iframe pattern

D365 model-driven apps render forms inside an IFrame. Spinners are INSIDE the frame:

```typescript
const formFrame = page.frameLocator('iframe[name^="pages-iframe"]');
await expect(formFrame.locator('.ms-Spinner')).toHaveCount(0, { timeout: 45_000 });
```

Without entering the frame, you'd wait on the outer page's spinners — usually gone before the form is ready.

---

## 10. Animations, transitions

### 10.1 The stable-bounding-box check

Auto-wait verifies the element's bounding box hasn't changed for 2 consecutive `requestAnimationFrame` ticks (~33ms at 60fps).

A modal fading in over 200ms: stable bounding box appears at the END of the animation. Auto-wait waits ~200ms then clicks.

A modal sliding in with `transform: translateX(...)`: also handled by the stable check.

A continuous infinite animation (e.g., a CSS spinner): bounding box never stabilises → auto-wait times out. Always wait for the animation to STOP or DISABLE it.

### 10.2 Disabling animations globally

```typescript
// playwright.config.ts
use: {
  // No built-in option; inject CSS
  contextOptions: {
    // ...
  },
},
```

Better: inject a global stylesheet:

```typescript
// fixtures/no-animations.ts
const test = base.extend({
  page: async ({ page }, use) => {
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          transition-duration: 0s !important;
          animation-delay: 0s !important;
          transition-delay: 0s !important;
        }
      `,
    });
    await use(page);
  },
});
```

This disables all CSS animations and transitions. Most apps look the same; tests run faster.

### 10.3 Per-screenshot animation handling

```typescript
await expect(page).toHaveScreenshot({ animations: 'disabled' });
```

For visual regression, this freezes animations to a stable state.

### 10.4 The "wait for animation to finish"

```typescript
await page.locator('.modal').waitFor({ state: 'visible' });
await page.locator('.modal').evaluate(el => el.getAnimations().forEach(a => a.finish()));
```

Force-finishes all running CSS animations. Useful when you don't control the styles.

---

## 11. Network timing

### 11.1 The "click then read" race

```typescript
// ❌ Race
await page.click('#save');
const status = await api.get(`/citations/${id}`);
expect(status.status).toBe('PAID');
```

`click` resolves when the click is dispatched. The save request flies out, lands on the server, server processes, DB writes, ack comes back. None of that is in `click`'s critical path.

The `api.get` may fire before the DB write completes.

### 11.2 The fix — wait for the response

```typescript
const [saveResponse] = await Promise.all([
  page.waitForResponse(r => r.url().includes('/api/citations') && r.method() === 'POST'),
  page.click('#save'),
]);
expect(saveResponse.ok()).toBeTruthy();

const status = await api.get(`/citations/${id}`);
expect(status.status).toBe('PAID');
```

Now `api.get` runs after the save response is received.

### 11.3 The "save is async" case

Some apps return 202 Accepted and process asynchronously:

```
POST /citations { ... } → 202 Accepted (job_id: "abc")
GET /citations/abc → status: 'PENDING'  
GET /citations/abc → status: 'PROCESSING'  
GET /citations/abc → status: 'PAID'        ← target state
```

Use `expect.poll`:

```typescript
const [saveResponse] = await Promise.all([
  page.waitForResponse(r => r.url().includes('/api/citations')),
  page.click('#save'),
]);
expect(saveResponse.status()).toBe(202);

await expect.poll(
  async () => (await api.get(`/citations/${id}`)).status,
  { timeout: 60_000, intervals: [1000, 2000, 5000] },
).toBe('PAID');
```

### 11.4 The notification panel pattern

UI confirms success via a notification, but the actual data isn't ready:

```typescript
await page.click('#save');
await expect(page.getByRole('alert')).toContainText('Saved');
// Notification is up — but the API may not have responded yet

await expect.poll(
  async () => (await api.get(`/citations/${id}`)).status,
  { timeout: 30_000 },
).toBe('PAID');
```

Cross-validate UI and API/DB state.

---

## 12. Race conditions

### 12.1 The new tab race

```typescript
// ❌ waitForEvent AFTER click
await page.click('#open-in-new-tab');
const newPage = await context.waitForEvent('page');
// New tab might have opened before waitForEvent registered. Test hangs.
```

```typescript
// ✅ Promise.all
const [newPage] = await Promise.all([
  context.waitForEvent('page'),
  page.click('#open-in-new-tab'),
]);
```

The pattern:
- The event listener is registered SYNCHRONOUSLY before `Promise.all` returns control.
- `click` is started but doesn't complete until at least one microtask.
- New tab event fires AFTER listener registered.

### 12.2 The download race

```typescript
// ✅
const [download] = await Promise.all([
  page.waitForEvent('download'),
  page.click('#export-csv'),
]);
const path = await download.path();
```

### 12.3 The file chooser race

```typescript
// ✅
const [fileChooser] = await Promise.all([
  page.waitForEvent('filechooser'),
  page.click('#upload-button'),
]);
await fileChooser.setFiles('/path/to/file.csv');
```

### 12.4 The dialog race

```typescript
// ✅ Register dialog handler BEFORE the action
page.once('dialog', dialog => dialog.accept('input value'));
await page.click('#prompt-button');
```

For dialogs use `page.once` (or `on`) — the handler MUST be registered first.

### 12.5 The console race

For capturing console messages:

```typescript
const messages: string[] = [];
page.on('console', msg => messages.push(msg.text()));

await page.goto('/');

expect(messages).toContainEqual(expect.stringContaining('App initialized'));
```

Note: `console` is registered before navigation. If you navigate first then add the listener, messages from before are lost.

---

## 13. Retry semantics

`retries: 2` in config means: each test gets up to 3 total attempts (1 + 2 retries).

### 13.1 What gets retried

| Item | Retried on retry? |
|---|---|
| Test body | Yes — re-runs from the start |
| `beforeEach` | Yes |
| `afterEach` | Yes |
| Test-scoped fixtures | Yes — re-setup, re-teardown |
| Worker-scoped fixtures | NO — held across retries |
| `beforeAll` / `afterAll` | NO |
| Setup project | NO — runs once before all retries |

### 13.2 The "retry hides bugs" problem

A test that fails 30% of the time has 30% × 30% × 30% = 2.7% chance of failing all 3 attempts. Suddenly it looks 97.3% green.

The bug is still there. Production users hit it.

### 13.3 Detecting flake-via-retry

```typescript
// Custom reporter
class FlakeDetector implements Reporter {
  onTestEnd(test: TestCase, result: TestResult): void {
    if (result.status === 'passed' && result.retry > 0) {
      console.warn(`FLAKE: ${test.title} passed only after retry ${result.retry}`);
    }
  }
}
```

Track these warnings. Tests that consistently need retries are flaky — fix or quarantine.

### 13.4 The retry policy

| Environment | Retries | Reason |
|---|---|---|
| Local development | 0 | Surface flakes immediately for debugging |
| PR builds | 0 | Block flaky tests from merging |
| Main branch CI | 2 | Tolerate transient infra issues |
| Nightly E2E | 3 | Maximum tolerance; alerts on retry rate |

A 1-2% retry rate is acceptable infrastructure noise. A 10% retry rate is a red flag.

### 13.5 `describe.serial` retry

If any test in a serial block fails, the WHOLE BLOCK retries from the top. This is correct (serial = atomic) but expensive.

If your block has 3 tests and fails on test 3, retry runs tests 1+2+3 again. Three retries = 9 test executions for a 3-test block.

For very slow serial blocks, consider splitting into independent tests.

---

## 14. Trace viewer diagnostic

When a test fails, the trace is your primary tool.

### 14.1 Opening

```bash
npx playwright show-trace test-results/<test>/trace.zip
```

Opens in browser at `http://localhost:8000`.

### 14.2 The interface

| Pane | Purpose |
|---|---|
| Top — timeline | Action-by-action wall-clock view. Click any action to jump. |
| Left — actions list | Every Playwright call. Click to time-travel. |
| Centre — snapshot | DOM state at the selected action's time. Live-pickable. |
| Right tabs | Source, Console, Network, Errors, Metadata |

### 14.3 Diagnostic workflow

1. **Identify the failing action** — last entry in red.
2. **Inspect the snapshot AT failure** — what was on screen? Is the target visible? Hidden?
3. **Inspect the snapshot BEFORE failure** — what was happening? Was it animating?
4. **Check the network tab** — was a request in-flight?
5. **Check the console** — any errors from the page?
6. **Compare with a successful trace** — what's different?

### 14.4 The "element is not visible" mystery

Trace shows the element exists, but action says "not visible." Common causes:

| In trace | Likely cause |
|---|---|
| Element is behind a modal | Hit-test failure |
| Element is `opacity: 0` | `:visible` only checks display/visibility, not opacity |
| Element is at `transform: translateX(-9999px)` | Off-screen but still "visible" by Playwright's check |
| Bounding box outside viewport | Scroll required first |
| Element is in a closed shadow DOM | Inaccessible |

### 14.5 The "timed out" mystery

Trace shows the test ran for 30s, then timed out. Where was time spent?

Look at the timeline:
- 0s–2s — initial navigation
- 2s–4s — `goto` waiting for `domcontentloaded`
- 4s–10s — `expect(loc).toBeVisible()` retrying
- 10s–30s — `expect(loc).toBeVisible()` retrying (timing out)

If 20 seconds are spent on a `toBeVisible` that never passes, the element didn't render. Check the network — did the API call complete? Check the console — did the page error?

---

## 15. War stories

Real production bugs and their resolution.

### Story 1 — The ghost click

**Symptom:** Test passes 95% of the time. The other 5%, it fails with "element not actionable."

**Investigation:** Trace shows a modal dialog opening as the test clicks the button. The modal is animating in. Hit test fails because the modal is over the button.

**Cause:** A welcome modal appears for new users on first login. The test uses storageState — but the storageState was saved BEFORE the welcome flow completed (the user had dismissed the modal).

**Fix:** In the setup project, dismiss the welcome modal before saving storageState.

### Story 2 — The stale session

**Symptom:** Tests pass at 9am, fail at 3pm.

**Investigation:** Trace shows 401 from API at 3pm. storageState was generated at 9am. Session cookie expired at 12pm.

**Cause:** Long-lived storageState + short-lived session.

**Fix:** Regenerate storageState every CI run via setup project. Don't commit storageState.

### Story 3 — The silent 200

**Symptom:** UI test says "Saved." API test says the record doesn't exist.

**Investigation:** Trace shows POST returned 200. Network response body: `{ "success": true, "id": null }`. ID is null — the save did NOT persist.

**Cause:** Server returns 200 with `success: true` for validation errors (uses the body field, not the status code).

**Fix:** Update API tests to assert `body.id != null`. Cross-validate UI changes with DB. File a bug for the misleading 200.

### Story 4 — The parallel collision

**Symptom:** 1 worker passes. 4 workers fail intermittently.

**Investigation:** Multiple tests create customers with email `test@example.com`. Database has UNIQUE constraint.

**Cause:** Hardcoded email.

**Fix:** `test-${randomUUID()}@example.com`.

### Story 5 — The frame trap

**Symptom:** `getByRole('button')` works in dev but times out in test.

**Investigation:** Trace snapshot shows the button — but the test was running against the main page, while the button is inside an IFrame.

**Cause:** Test used `page.getByRole` instead of `frameLocator.getByRole`.

**Fix:** Use frame locator. Also added a check: `expect(page.locator('iframe')).toHaveCount(N)` to catch frame structural changes.

### Story 6 — The OAuth quota

**Symptom:** Last 3 tests of every CI run fail with 429.

**Investigation:** Each worker fetches an OAuth token. 8 workers + 5 tests each that re-fetch = 40 fetches per run. IdP allows 30 per minute.

**Cause:** Token fetched per-test instead of worker-scoped.

**Fix:** Move to worker scope. Reduces fetches from 40 to 8.

### Story 7 — The flaky network

**Symptom:** ~2% of tests fail with `net::ERR_CONNECTION_RESET`.

**Investigation:** Trace shows the error mid-test on a random API call. CI runs in AWS region us-east-1; API in us-west-2.

**Cause:** Cross-region network jitter.

**Fix:** Move CI to the same region OR add network retry middleware (`maxRetries: 2` on `request`).

### Story 8 — The viewport mismatch

**Symptom:** Tests pass in headed mode, fail in headless.

**Investigation:** Trace snapshot shows different layout in headless. A responsive breakpoint kicks in at 1280px; headed defaults to 1280×720; headless defaults differently.

**Cause:** Implicit viewport.

**Fix:** Always set explicit viewport in config: `viewport: { width: 1440, height: 900 }`.

### Story 9 — The animation hang

**Symptom:** Test times out at 30s; trace shows infinite spinner.

**Investigation:** The "loading" CSS spinner is `animation: spin 1s infinite`. Auto-wait waits for the spinner bounding box to stabilise — but it's continuously rotating.

**Cause:** Auto-wait stable-box check fails on continuous animation.

**Fix:** Either disable animations globally (CSS injection) OR explicitly wait for the spinner to be HIDDEN: `await spinner.waitFor({ state: 'hidden' })`.

### Story 10 — The TZ bug

**Symptom:** Tests pass on developer laptops (US), fail on CI (UTC).

**Investigation:** Date assertion `expect(page.locator('.date')).toHaveText('Jan 1')` — page displays "Dec 31" in UTC.

**Cause:** Date rendering depends on browser locale + TZ, which depends on system TZ.

**Fix:** Set `timezoneId: 'America/Los_Angeles'` in playwright.config.ts.

### Story 11 — The hidden element

**Symptom:** Test fails with "element is not visible" but DOM shows the element.

**Investigation:** Trace snapshot shows the element. Inspect: `style="display: none"` set by an ad blocker that the developer has installed.

**Cause:** Ad blocker injected CSS during real-browser dev. Not present in CI.

**Fix:** Test against the canonical app behavior, not local browser state. Remove ad blocker for the test profile.

### Story 12 — The race in CI

**Symptom:** Tests fail randomly in CI, never reproducibly. Even `--repeat-each=20` locally doesn't reproduce.

**Investigation:** CI machine has 2 cores; local has 8. Different scheduling reveals the race.

**Cause:** Hidden test inter-dependency exposed only under high contention.

**Fix:** Run `--workers=2` locally to reproduce. Then add `describe.serial` or eliminate the shared state.

### Story 13 — The CDN cache

**Symptom:** Tests pass against staging, fail against production.

**Investigation:** Production has Cloudflare in front. Test data created via API isn't visible via UI for ~30 seconds (CDN cache miss).

**Cause:** Caching layer.

**Fix:** Either purge CDN before tests OR use a no-cache header on test requests OR poll for the change via `expect.poll`.

### Story 14 — The infinite spinner

**Symptom:** Test hangs at 30s with `expect(spinner).toHaveCount(0)`.

**Investigation:** Spinner has CSS `animation: spin 1s infinite`. Network shows a stuck OData request — server returns nothing.

**Cause:** Server bug — request never gets a response.

**Fix:** This is a real bug. File it. Test should fail fast (`timeout: 30_000`).

---

## 16. Anti-pattern catalog

| ❌ | ✅ |
|---|---|
| `await page.waitForTimeout(5000)` | `expect(loc).toX()` or `expect.poll` |
| `setTimeout` in test code | `expect.poll` |
| `await Promise.race([action, sleep])` | Real timeout via Playwright |
| Manual `for { ... waitForTimeout(); }` polling | `expect.poll` |
| `retries: 5` to "fix" flakes | Fix the underlying flake |
| Hardcoded IDs in parallel tests | UUIDs or per-test scoping |
| `waitForLoadState('networkidle')` for SPAs | Content-based assertion |
| Reading `textContent` then asserting | `expect(loc).toHaveText` |
| `if (await loc.isVisible()) { ... }` | `await expect(loc).toBeVisible()` |
| Click then immediate read | `Promise.all([waitForResponse, click])` |
| `waitForEvent` AFTER trigger | `Promise.all([waitForEvent, trigger])` |
| Module-level state across tests | Object accumulator in `describe.serial` |
| Shared `Date.now()` ID | Per-test UUID |
| Catch-and-retry inside the test body | Let Playwright's retry handle it |
| `force: true` to bypass actionability | Find why the element isn't actionable; fix that |
| Hard-coded `await page.waitForTimeout(N)` between actions | Auto-wait + explicit content assertions |
| `console.log("done")` instead of asserting | Real assertions |
| Single test that depends on global setup state | Each test sets up its own data |
| Skipping flaky tests with `test.skip()` "for now" | Fix in 2 weeks or quarantine with explicit owner |

---

## Cross-references

- Wait primitives in config: [`./02_config.md#3-the-4-level-timeout-cascade`](./02_config.md#3-the-4-level-timeout-cascade)
- Locator auto-waiting: [`./03_locators.md#13-auto-waiting`](./03_locators.md#13-auto-waiting)
- Parallel execution: [`./07_parallelism.md`](./07_parallelism.md)
- Trace viewer setup: [`./11_reporting.md`](./11_reporting.md)
- D365 patterns deep dive: [`../deep_dives/d365.md`](../deep_dives/d365.md)
- Practice problems: Q01, Q02, Q04 in [`../practice/quiz_02_solutions/`](../practice/quiz_02_solutions/)
