# Level 8 — Geolocation, Permissions & Storage State

### Companion track: [Playwright Mobile Testing with TypeScript](00_ROADMAP.md) · Previous: [Level 7](Level_07_Multi_Device_Config.md)

---

## Basics — Geolocation, Set at Context Creation or Live

```typescript
import { test, expect, devices } from '@playwright/test';

test.use({
  ...devices['Pixel 7'],
  geolocation: { latitude: 37.7749, longitude: -122.4194 }, // San Francisco
  permissions: ['geolocation'],
});

test('shows nearby stores based on location', async ({ page }) => {
  await page.goto('/stores/nearby');
  await expect(page.getByText('Store #42 - Market St')).toBeVisible();
});
```

Per Playwright's own docs, geolocation set this way applies to **every page in the context** — there's no per-page override. Changing it mid-test uses `context.setGeolocation()` instead:

```typescript
test('store list updates when location changes', async ({ page, context }) => {
  await page.goto('/stores/nearby');
  await expect(page.getByText('Store #42 - Market St')).toBeVisible();

  await context.setGeolocation({ latitude: 51.5074, longitude: -0.1278 }); // London
  await page.reload(); // most apps re-fetch location-based data on reload, not automatically
  await expect(page.getByText('Store #17 - Oxford St')).toBeVisible();
});
```

---

## Concept — Testing the Denial Path Is Not Optional

A location feature that only gets tested with permission *granted* has an entire real-world path never verified — and it's one of the most common places for a genuine crash or blank screen to hide, because "what if the user says no" is exactly the branch developers forget to build carefully.

```typescript
test('falls back to manual city entry when location is denied', async ({ browser }) => {
  // Create a context with NO permissions granted at all
  const context = await browser.newContext({ ...devices['Pixel 7'] });
  const page = await context.newPage();

  await page.goto('/stores/nearby');

  // The app should detect the denial and offer a graceful fallback,
  // not hang on a spinner forever or throw a visible error
  await expect(page.getByText('Enter your city')).toBeVisible();
  await context.close();
});
```

Note this test deliberately uses `browser.newContext()` directly rather than `test.use()` — because it needs a context with genuinely **no** permissions, distinct from the rest of the file's default. This is the pattern for "one test in this file needs different context settings than all the others."

---

## Real-World Problem — Testing Three Different User States Without Three Real Accounts

`storageState` — teased in Level 7 for auth — generalizes to any persisted browser state you want a test to start from, letting you test "new user," "returning user with items in cart," and "user with an expired session" as three cheap, deterministic starting points instead of three real accounts you have to maintain.

```typescript
// Capture different states once, in setup scripts:

// new-user.setup.ts — literally does nothing, saves empty state
setup('new user', async ({ page, context }) => {
  await context.storageState({ path: 'playwright/.auth/new-user.json' });
});

// returning-user-with-cart.setup.ts
setup('returning user with cart', async ({ page, context }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('returning@example.com');
  await page.getByLabel('Password').fill('pass123');
  await page.getByRole('button', { name: 'Log In' }).click();
  await page.getByRole('button', { name: 'Add to Cart' }).click(); // pre-populate a cart
  await context.storageState({ path: 'playwright/.auth/returning-user-cart.json' });
});
```

```typescript
// Tests load whichever state fits the scenario being tested:
test.describe('new user experience', () => {
  test.use({ storageState: 'playwright/.auth/new-user.json' });

  test('shows onboarding flow', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Welcome! Let\'s get started')).toBeVisible();
  });
});

test.describe('returning user with existing cart', () => {
  test.use({ storageState: 'playwright/.auth/returning-user-cart.json' });

  test('cart badge shows correct count on load, no re-adding needed', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('cart-badge-count')).toHaveText('1');
  });
});
```

`test.describe()`'s own `test.use()` scopes a setting to just that block, without affecting other `describe` blocks in the same file — this is how one test file can cover several distinct user states cleanly, instead of needing a separate file per state.

---

## Solution — What `storageState` Actually Captures (and What It Doesn't)

```typescript
const state = await context.storageState();
console.log(state);
// {
//   cookies: [ { name: 'session_id', value: '...', domain: '...', ... } ],
//   origins: [
//     {
//       origin: 'https://example-shop.com',
//       localStorage: [ { name: 'cart', value: '[{"id":123,"qty":1}]' } ],
//     },
//   ],
// }
```

`storageState` captures **cookies and `localStorage`** — it does **not** capture `IndexedDB`, `sessionStorage` (deliberately, since session storage is meant to be tab/session-scoped, not persisted), Service Worker caches, or any server-side session data your backend might independently track by, say, an IP address or device fingerprint. An app that stores its cart in `IndexedDB` instead of `localStorage` needs a different approach entirely — either a custom setup script that directly seeds IndexedDB via `page.evaluate()`, or accepting that this particular piece of state must be rebuilt by real UI interaction in each test, not restored from a file.

---

## Challenges

### 🐛 Bug Hunt — The Storage State That Doesn't Actually Log Anyone In

```typescript
setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('test@example.com');
  await page.getByLabel('Password').fill('testpass123');
  await page.getByRole('button', { name: 'Log In' }).click();

  await page.context().storageState({ path: 'playwright/.auth/user.json' });
});
```

Tests using this saved state still show a logged-out UI. The login itself works fine when run manually. What's the timing mistake?

<details><summary>Diagnosis & Fix</summary>

🔴 **Explanation:** `storageState()` is called **immediately** after `.click()`, with no wait for the login request/redirect to actually complete — cookies from a successful login are typically set as part of the server's response to the login request, and if that request is still in flight (or the resulting redirect to `/dashboard` hasn't happened yet) at the moment `storageState()` captures state, the saved file reflects the *pre-login* cookies, not the post-login ones. The fix is to wait for a concrete signal that login actually finished before capturing:

```typescript
setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('test@example.com');
  await page.getByLabel('Password').fill('testpass123');
  await page.getByRole('button', { name: 'Log In' }).click();

  await page.waitForURL('/dashboard'); // wait for the ACTUAL post-login signal
  await page.context().storageState({ path: 'playwright/.auth/user.json' });
});
```

This is the identical shape of mistake as [Level 1's missing-`await` Bug Hunt](Level_01_Setup_and_First_Mobile_Test.md#-bug-hunt--the-test-that-times-out-for-the-wrong-reason) — an action that takes real time to complete, captured or acted upon before it actually has.

</details>

---

### 🎭 Two Truths and a Lie — Storage State Boundaries

**A.** `storageState` captures cookies and `localStorage`, but not `sessionStorage` — this is deliberate, since session storage is meant to be scoped to a single browser session, not persisted across test runs.

**B.** A test using `test.use({ storageState: '...' })` inside a `test.describe()` block only affects tests within that block — sibling `describe` blocks in the same file are unaffected.

**C.** If an app stores its shopping cart in `IndexedDB` instead of `localStorage`, `storageState` will still capture it correctly, just under a differently-named field in the saved JSON.

<details><summary>Which one's the lie</summary>

**C is the lie.** Per [this level's own breakdown](#solution--what-storagestate-actually-captures-and-what-it-doesnt), `storageState` genuinely does not capture `IndexedDB` at all — there's no field for it, named or otherwise, in the saved JSON structure. An app relying on `IndexedDB` for persisted state needs a different strategy entirely: seeding it directly via `page.evaluate()` in a setup script, or accepting that this specific piece of state has to be rebuilt through real UI interaction each test run.

🔴 **Explanation:** A is true and is [this level's Solution section](#solution--what-storagestate-actually-captures-and-what-it-doesnt) stated plainly — the omission of `sessionStorage` isn't a bug or a limitation to work around, it's a deliberate design choice matching what session storage is *for*. B is also true and is exactly [this level's Real-World Problem section](#real-world-problem--testing-three-different-user-states-without-three-real-accounts) demonstrated — `test.describe()`'s own `test.use()` call scopes cleanly, letting one file cover multiple distinct starting states without them bleeding into each other.

</details>

---

**Tier 2 complete.** You can now mock any network condition, structure a suite that survives real UI changes, run it across every device that matters in one command, and start tests from a realistic pre-authenticated state instead of rebuilding it by hand every time. Tier 3 moves past emulation entirely — real devices, real hybrid apps, and the debugging skills to keep it all from becoming flaky.

**Tier 3 (Levels 9-12: Android API, hybrid WebView testing, visual regression, flaky-test debugging) and the Level 13 capstone are next — see [the roadmap](00_ROADMAP.md) for what's coming.**
