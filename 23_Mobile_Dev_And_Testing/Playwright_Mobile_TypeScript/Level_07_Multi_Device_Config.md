# Level 7 — Multi-Device Config

### Companion track: [Playwright Mobile Testing with TypeScript](00_ROADMAP.md) · Previous: [Level 6](Level_06_Page_Object_Model.md)

---

## Basics — The `projects` Array

Every test so far ran against whatever single device `test.use()` set at the top of a file. Real suites need to run the *same* tests across several devices in one command — that's what `playwright.config.ts`'s `projects` array is for.

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  projects: [
    { name: 'mobile-chrome-pixel7', use: { ...devices['Pixel 7'] } },
    { name: 'mobile-safari-iphone14', use: { ...devices['iPhone 14'] } },
    { name: 'tablet-ipad', use: { ...devices['iPad Pro 11'] } },
    { name: 'desktop-chrome', use: { browserName: 'chromium', viewport: { width: 1440, height: 900 } } },
  ],
});
```

```bash
npx playwright test                          # runs EVERY project, all tests, in parallel
npx playwright test --project=mobile-chrome-pixel7   # only that one project
npx playwright test --project="mobile-*"      # glob-matches multiple projects at once
```

The **same test files** run once per project by default — write one `checkout.spec.ts`, and it executes against Pixel 7, iPhone 14, an iPad, and desktop Chrome, four times total, without duplicating a single line of test code.

---

## Concept — Scoping Which Tests Run on Which Project

Not every test needs to run on every device — a desktop-only admin panel test wastes CI time running against a Pixel 7 project it was never meant for.

```typescript
export default defineConfig({
  projects: [
    {
      name: 'mobile-chrome-pixel7',
      use: { ...devices['Pixel 7'] },
      testMatch: /.*\.mobile\.spec\.ts/, // ONLY files matching this pattern
    },
    {
      name: 'desktop-chrome',
      use: { browserName: 'chromium' },
      testIgnore: /.*\.mobile-only\.spec\.ts/, // run everything EXCEPT these
    },
  ],
});
```

```
tests/
  checkout.spec.ts              → runs on every project (no testMatch/testIgnore restricts it)
  swipe-gestures.mobile.spec.ts → only runs on mobile-chrome-pixel7
  admin-panel.spec.ts           → runs on desktop-chrome, explicitly excluded nowhere on mobile if untagged
```

**The real-world shape this produces:** most tests (checkout, search, product browsing) genuinely should run cross-device, because your users are on all of them. A smaller set — gesture-specific tests, tablet-split-view-specific tests — only make sense on the device shape they're testing, and scoping them with `testMatch` keeps CI time proportional to what actually needs checking on each device.

---

## Real-World Problem — A Setup Project That Runs Once, Shared Across Projects

Logging in before every single test, on every single device project, is slow and repetitive. Playwright's `dependencies` field lets one project run first, do setup work, and hand off state to the projects that depend on it.

```typescript
export default defineConfig({
  projects: [
    {
      name: 'setup',
      testMatch: /global\.setup\.ts/,
    },
    {
      name: 'mobile-chrome-pixel7',
      use: { ...devices['Pixel 7'], storageState: 'playwright/.auth/user.json' },
      dependencies: ['setup'], // waits for 'setup' to finish first
    },
    {
      name: 'mobile-safari-iphone14',
      use: { ...devices['iPhone 14'], storageState: 'playwright/.auth/user.json' },
      dependencies: ['setup'],
    },
  ],
});
```

```typescript
// tests/global.setup.ts
import { test as setup } from '@playwright/test';

setup('authenticate once', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('test@example.com');
  await page.getByLabel('Password').fill('testpass123');
  await page.getByRole('button', { name: 'Log In' }).click();
  await page.waitForURL('/dashboard');

  // Save the authenticated browser state (cookies, localStorage) to a file
  await page.context().storageState({ path: 'playwright/.auth/user.json' });
});
```

The `setup` project logs in **once**, saves the resulting cookies/localStorage to a JSON file, and every other project that lists `dependencies: ['setup']` loads that saved state via `storageState: '...'` instead of re-running the login flow itself — turning "log in before every device project's every test" into "log in once, total, for the whole run."

---

## Solution — Sharding for CI Speed

For genuinely large suites, even parallel project execution on one machine isn't fast enough — Playwright supports **sharding**, splitting the total test set across multiple machines/CI jobs:

```bash
# Machine 1 of 4
npx playwright test --shard=1/4
# Machine 2 of 4
npx playwright test --shard=2/4
# ...and so on
```

Each shard runs a disjoint subset of the total tests — four machines running `--shard=1/4` through `--shard=4/4` in parallel finish in roughly a quarter of the time one machine running the full suite would take. [Level 13's capstone](Level_13_Capstone_CICD_Pipeline.md) wires this into a real GitHub Actions matrix.

---

## Challenges

### 🐛 Bug Hunt — The Setup That Runs on Every Project Anyway

```typescript
export default defineConfig({
  projects: [
    { name: 'setup', testMatch: /global\.setup\.ts/ },
    { name: 'mobile-chrome-pixel7', use: { ...devices['Pixel 7'] } }, // no dependencies!
    { name: 'mobile-safari-iphone14', use: { ...devices['iPhone 14'] } },
  ],
});
```

The `setup` project runs, but every actual test in `mobile-chrome-pixel7` and `mobile-safari-iphone14` still shows an unauthenticated state — as if `setup` never ran at all from their perspective. Find the missing piece.

<details><summary>Diagnosis & Fix</summary>

🔴 **Explanation:** neither device project declares `dependencies: ['setup']`, and neither one's `use` block references `storageState: 'playwright/.auth/user.json'` — so `setup` genuinely does run (logging in and saving the file), but nothing tells Playwright to (a) wait for it to finish before starting the other projects, or (b) actually load the saved auth state into their browser contexts. The `setup` project ran in complete isolation, its output file created but never consumed. Fix:

```typescript
{
  name: 'mobile-chrome-pixel7',
  use: { ...devices['Pixel 7'], storageState: 'playwright/.auth/user.json' },
  dependencies: ['setup'],
},
```

Both pieces are required together — `dependencies` controls *ordering* (setup finishes before this project's tests start), `storageState` controls *what state those tests actually load*. Missing either one leaves you with unauthenticated tests even though `setup` technically succeeded.

</details>

---

### 🎭 Two Truths and a Lie — Config Mechanics

**A.** `testMatch` and `testIgnore` on a project can both be set at once — a test file must match `testMatch` AND not match `testIgnore` to run under that project.

**B.** `--shard=2/4` and `--project=mobile-chrome-pixel7` can be combined in the same command — sharding applies within whatever project selection is already in effect.

**C.** A `storageState` file saved from one device project (e.g., Pixel 7's Chrome-based context) can always be safely reused by a WebKit-based project (e.g., iPhone 14), since cookies and localStorage are browser-agnostic web standards.

<details><summary>Which one's the lie</summary>

**C is the lie**, and it's a genuinely easy assumption to make incorrectly. While cookies and localStorage are standardized formats, the *serialized storage state file itself* is tied to the origin and session context it was captured from — and more practically, some auth flows set browser-engine-specific artifacts (certain security cookies, IndexedDB data not captured by `storageState`, or engine-specific session handling) that don't round-trip identically between Chromium and WebKit contexts. In practice, teams that need pre-authenticated state across both engine types often run **separate** `setup` flows per engine, rather than assuming one saved file works everywhere.

🔴 **Explanation:** A and B are both true and are genuinely useful to combine in a large CI matrix — A lets you precisely scope which files belong to which device project, and B means a command like `npx playwright test --project=mobile-chrome-pixel7 --shard=2/4` runs exactly one-quarter of *just* that project's tests, letting you shard within a single device target when that target alone has enough tests to justify it.

</details>

---

**Next → [Level 8: Geolocation, Permissions & Storage State](Level_08_Geolocation_Permissions_Storage.md)**
