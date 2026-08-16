# Level 8 — The Fixture Gap

### Companion track: [Mobilewright Native Testing with TypeScript](00_ROADMAP.md) · Previous: [Level 7](Level_07_Sharding_for_CI_Speed.md)

---

## Basics — What Playwright's `test.extend()` Gives You, That Mobilewright Currently Doesn't

Playwright's own test runner lets you define **custom fixtures** — reusable, composable, dependency-injected setup/teardown that any test can request just by naming it as a parameter:

```typescript
// Playwright-style custom fixture (NOT Mobilewright — shown for contrast)
import { test as base } from '@playwright/test';

const test = base.extend<{ loggedInPage: Page }>({
  loggedInPage: async ({ page }, use) => {
    await page.goto('/login');
    await page.fill('#email', 'test@example.com');
    await page.click('#submit');
    await use(page); // hand the ready-to-use page to the test
    // (teardown code could go here, after `use` resolves)
  },
});

test('shows dashboard', async ({ loggedInPage }) => {
  await expect(loggedInPage.locator('h1')).toHaveText('Dashboard');
});
```

Per Mobilewright's own documented API surface, **there is currently no `test.extend()`-equivalent.** `@mobilewright/test` exposes `test.use()` — but that's for overriding *config-level options* (`platform`, `bundleId`, `deviceType`) per test file, the same mechanism [Level 2's Bug Hunt](Level_02_Cross_Platform_Locators.md#-bug-hunt--the-locator-that-works-on-one-platform-not-the-other) already used — not for injecting arbitrary custom setup logic with dependency-graph composition.

---

## Concept — Confirming a Gap Is Real Before Building a Workaround Around It

This matters as a discipline, not just as a fact about one framework: before concluding "Mobilewright can't do X," the honest move is checking the actual current documentation, not assuming based on API-shape similarity to Playwright. This track has done that check specifically for custom fixtures — [06's own limitations section](../06_Mobilewright_Native_Testing.md) and mobilewright.dev's documented API surface, as of this writing, list `test.use()` for config overrides with no `test.extend()`-equivalent alongside it. That's the actual gap this level teaches around — not an assumption, a verified absence.

---

## Real-World Problem — A "Logged In" Setup Needed by Dozens of Tests

```typescript
// The naive version — copy-pasted into every test file that needs a logged-in state
test('shows dashboard after login', async ({ screen }) => {
  await screen.getByRole('textfield', { name: 'Email' }).fill('test@example.com');
  await screen.getByRole('textfield', { name: 'Password' }).fill('password123');
  await screen.getByRole('button', { name: 'Sign In' }).tap();
  await expect(screen.getByText('Home')).toBeVisible();

  // ... the actual test starts HERE, four lines in
  await expect(screen.getByText('Dashboard')).toBeVisible();
});
```

Copy-pasted across 30 test files, this becomes a real maintenance cost — a UI change to the login flow means editing 30 files, not one.

---

## Solution — The Honest Workaround: a Plain Helper, Not a Fake Fixture

```typescript
// helpers/auth.ts
import type { Screen } from '@mobilewright/test';

export async function loginAsTestUser(screen: Screen) {
  await screen.getByRole('textfield', { name: 'Email' }).fill('test@example.com');
  await screen.getByRole('textfield', { name: 'Password' }).fill('password123');
  await screen.getByRole('button', { name: 'Sign In' }).tap();
  await expect(screen.getByText('Home')).toBeVisible();
}
```

```typescript
// tests/dashboard.spec.ts
import { test, expect } from '@mobilewright/test';
import { loginAsTestUser } from '../helpers/auth';

test.beforeEach(async ({ screen }) => {
  await loginAsTestUser(screen);
});

test('shows dashboard after login', async ({ screen }) => {
  await expect(screen.getByText('Dashboard')).toBeVisible(); // setup already done
});
```

**What this workaround genuinely gives up, compared to a real custom fixture:** no automatic dependency graph (a real fixture system can let fixtures depend on other fixtures and resolve them in the right order automatically), no per-test/per-worker scoping control, no guaranteed teardown symmetry the way `use()`-based fixtures provide. `test.beforeEach()` plus a plain async function is a completely standard, honest pattern — it's just doing manually what a fixture system would otherwise automate. Naming that gap explicitly, rather than pretending `beforeEach` + a helper *is* a fixture system, is the actual point of this level.

---

## Challenges

### 🐛 Bug Hunt — The Helper That Silently Doesn't Wait

```typescript
export function loginAsTestUser(screen: Screen) {
  screen.getByRole('textfield', { name: 'Email' }).fill('test@example.com');
  screen.getByRole('textfield', { name: 'Password' }).fill('password123');
  screen.getByRole('button', { name: 'Sign In' }).tap();
}
```

```typescript
test.beforeEach(async ({ screen }) => {
  loginAsTestUser(screen); // no await here either
});

test('shows dashboard', async ({ screen }) => {
  await expect(screen.getByText('Dashboard')).toBeVisible(); // flaky — sometimes fails
});
```

Using [this level's own Solution section](#solution--the-honest-workaround-a-plain-helper-not-a-fake-fixture) as the reference implementation, find both mistakes.

<details><summary>Diagnosis & Fix</summary>

🔴 **Explanation:** two separate missing-`await` mistakes stack here. First, inside `loginAsTestUser` itself, `.fill()` and `.tap()` are async calls with no `await` — they fire and the function moves to the next line without waiting for each action to actually complete, meaning the three steps could race each other instead of running in the guaranteed order the login flow needs. Second, the `beforeEach` hook calls `loginAsTestUser(screen)` without awaiting the (now doubly-broken) async function, so the test body itself might start running before login even begins. The fix restores every `await`, both inside the helper and at its call site — matching [this level's own Solution code](#solution--the-honest-workaround-a-plain-helper-not-a-fake-fixture) exactly:

```typescript
export async function loginAsTestUser(screen: Screen) {
  await screen.getByRole('textfield', { name: 'Email' }).fill('test@example.com');
  await screen.getByRole('textfield', { name: 'Password' }).fill('password123');
  await screen.getByRole('button', { name: 'Sign In' }).tap();
}

test.beforeEach(async ({ screen }) => {
  await loginAsTestUser(screen);
});
```

The general lesson: a plain-function workaround for a missing fixture system carries plain-function risks a real fixture system would have structurally prevented — a fixture's `use()` callback is awaited by the framework itself, so this exact category of bug can't occur the same way inside one.

</details>

---

### 🎭 Two Truths and a Lie — `test.use()` vs a Real Fixture System

**A.** `test.use({ platform: 'ios' })` can override which platform a specific test file targets, without editing `mobilewright.config.ts` itself.

**B.** `test.use()` can define an entirely new fixture (like a custom `loggedInScreen` object) the way Playwright's `test.extend()` can.

**C.** A `test.beforeEach()` hook combined with a plain async helper function can approximate shared setup logic, but without the composability of fixtures depending on other fixtures.

<details><summary>Which one's the lie</summary>

**B is the lie**, and it's the entire point of this level — [this level's own Basics section](#basics--what-playwrights-testextend-gives-you-that-mobilewright-currently-doesnt) established that `test.use()` overrides existing config *options*, it doesn't define new fixtures the way `test.extend()` does. Reaching for `test.use()` expecting fixture-like custom setup is a natural mistake for anyone coming from Playwright directly, precisely because the names sound related — but they solve different problems.

🔴 **Explanation:** A is true and is exactly [Level 2's Bug Hunt](Level_02_Cross_Platform_Locators.md#-bug-hunt--the-locator-that-works-on-one-platform-not-the-other) already demonstrated — `test.use()` is real and useful for config-option overrides scoped to a file or describe block. C is true and is [this level's own Solution section](#solution--the-honest-workaround-a-plain-helper-not-a-fake-fixture) — a real, working pattern, just one that trades away automatic dependency resolution for simplicity.

</details>

---

**Tier 2 complete.** You can test flows that start outside your app, run one suite against both platforms from shared config, split CI runs correctly across real device capacity, and know precisely where Mobilewright's fixture system stops and a plain workaround has to start. Tier 3 goes further into genuine gaps and deeper tooling — visual regression (which doesn't exist as a built-in assertion), the Inspector tool, the WebView bridge in full depth, and running without a local device at all.

**Next → [Level 9: Screenshots & the Missing Visual-Regression Assertion](Level_09_Screenshots_and_Missing_Visual_Regression.md)**
