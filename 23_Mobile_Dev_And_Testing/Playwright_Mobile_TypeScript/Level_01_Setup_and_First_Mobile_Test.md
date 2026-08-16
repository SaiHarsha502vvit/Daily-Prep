# Level 1 — Setup & Your First Mobile Test

### Companion track: [Playwright Mobile Testing with TypeScript](00_ROADMAP.md)

---

## Basics — What You're Actually Installing

Playwright is a **Node.js library** that drives real browser engines (Chromium, Firefox, WebKit) via each engine's own remote-debugging protocol. When you "test on mobile" with Playwright, you're not running an emulator or a virtual phone — you're running one of those same three browser engines on your own machine, told to *behave* like a phone (specific viewport, touch events enabled, a phone's user-agent string). [01_Playwright_vs_Appium_Full_Comparison.md](../01_Playwright_vs_Appium_Full_Comparison.md) covers this distinction — browser emulation vs. a real device — in full; this level just needs you to know it exists before you start typing commands.

---

## Setup — From an Empty Folder

```bash
mkdir mobile-playwright-demo && cd mobile-playwright-demo
npm init playwright@latest
```

The installer asks a few questions. Answer them this way for this track:
- **Language:** TypeScript
- **Tests folder:** `tests` (the default — keep it)
- **Add a GitHub Actions workflow:** No for now (Level 13's capstone builds this properly, by hand, so you understand every line)
- **Install browsers:** Yes

Per Playwright's own documentation, this scaffolds exactly this structure:

```
playwright.config.ts
package.json
package-lock.json
tests/
  example.spec.ts
```

**`playwright.config.ts`** is the file that centralizes everything — which browsers to run against, timeouts, retries, and (starting in Level 7) which device projects to test. Leave it at its defaults for now; every level from here rewrites small pieces of it deliberately, not accidentally.

---

## Concept — Anatomy of a Test File

```typescript
import { test, expect } from '@playwright/test';

test('homepage has the correct title', async ({ page }) => {
  await page.goto('https://playwright.dev');
  await expect(page).toHaveTitle(/Playwright/);
});
```

Four things worth understanding precisely, not just pattern-matching:

1. **`import { test, expect } from '@playwright/test'`** — both come from the test runner package, not the core `playwright` library. This distinction matters later (Level 9 imports differently, from `playwright` directly, for the Android API).
2. **`test('name', async ({ page }) => {...})`** — the second argument is a function receiving a **fixture object**. `page` is one fixture Playwright provides automatically; you'll build your own custom fixtures in Level 6.
3. **`await page.goto(...)`** — every Playwright action that touches the browser is `async` and must be `await`ed. Forgetting `await` is the single most common beginner mistake — the test moves on before the action actually happens, and failures show up as confusing, unrelated errors several lines later.
4. **`await expect(page).toHaveTitle(...)`** — this is an **auto-retrying assertion**, per Playwright's own docs: it doesn't check once and fail immediately, it keeps re-checking for up to 5 seconds (the default timeout) until it either passes or genuinely times out. This is why Playwright tests need far fewer manual "wait a second" hacks than older tools.

---

## Real-World Problem — "I Want to Test This on a Phone, Not My Desktop Browser"

Replace `example.spec.ts`'s content with your first genuinely mobile test:

```typescript
// tests/mobile-homepage.spec.ts
import { test, expect, devices } from '@playwright/test';

test.use({ ...devices['Pixel 7'] });

test('homepage renders correctly on a Pixel 7 viewport', async ({ page }) => {
  await page.goto('https://playwright.dev');
  await expect(page).toHaveTitle(/Playwright/);

  // A real assertion specific to mobile: is there a hamburger/mobile nav,
  // not a desktop nav bar? (Adjust the locator to whatever the real site uses.)
  const viewport = page.viewportSize();
  expect(viewport?.width).toBeLessThan(500); // confirms we're actually in a phone-sized viewport
});
```

`test.use({ ...devices['Pixel 7'] })` at the top of a file applies that device's settings to every test in the file — you'll see the alternative (per-test, via `browser.newContext()`) starting in Level 3, once you actually need the difference.

---

## Solution — Running It

```bash
npx playwright test tests/mobile-homepage.spec.ts
```

```bash
# See it happen, not just pass/fail — headed mode
npx playwright test tests/mobile-homepage.spec.ts --headed

# The interactive UI mode — Playwright's own recommended way to develop tests
npx playwright test --ui
```

`--ui` is worth using from day one, not saving for later — it shows you every action, every assertion, and a live DOM snapshot as your test runs, which is the fastest way to understand *why* a test failed rather than reading a wall of terminal output.

---

## Challenges

### 🐛 Bug Hunt — The Test That Times Out for the Wrong Reason

```typescript
test('adds an item to cart', async ({ page }) => {
  page.goto('https://example-shop.com'); // missing await
  await page.getByRole('button', { name: 'Add to Cart' }).click();
  await expect(page.getByText('1 item in cart')).toBeVisible();
});
```

This test fails with a timeout on the `.click()` line, not the `goto()` line. Explain why the *symptom* shows up two lines away from the actual mistake.

<details><summary>Diagnosis</summary>

🔴 **Explanation:** `page.goto(...)` without `await` doesn't stop and wait for navigation — it fires the navigation and immediately returns, letting the test continue to the next line while the page is potentially still loading (or hasn't started loading at all yet). The `.click()` call then runs against a page that may not have the "Add to Cart" button rendered yet — Playwright's auto-waiting locator will retry for a few seconds looking for that button, fail to find it because the page never actually finished navigating, and time out there instead. The fix is one word: `await page.goto(...)`. The general lesson worth internalizing now, in Level 1, before it costs real debugging time later: **a missing `await` on an earlier line very often produces a confusing failure on a completely different, later line** — when a test fails somewhere that looks correct, check every `await` above it first.

</details>

---

### 🎭 Two Truths and a Lie — What You Just Installed

**A.** `npx playwright test` runs every `.spec.ts` file under the `tests/` folder by default, in parallel, unless configured otherwise.

**B.** `test.use({ ...devices['Pixel 7'] })` at the top of a file changes the *browser* being used, not just its emulated properties — Pixel 7 tests always run in a different browser engine than desktop tests.

**C.** `--ui` mode and `--headed` mode are not the same thing — `--headed` shows the actual browser window; `--ui` shows Playwright's own separate interface for stepping through and inspecting a test run.

<details><summary>Which one's the lie</summary>

**B is the lie.** `devices['Pixel 7']` sets viewport, user-agent, `deviceScaleFactor`, `isMobile`, and `hasTouch` — but it does **not** force a specific browser engine; by default Playwright runs it in whichever browser project is currently active (typically Chromium, unless your config specifies otherwise). It's genuinely just browser-level emulation, exactly as [01_Playwright_vs_Appium_Full_Comparison.md](../01_Playwright_vs_Appium_Full_Comparison.md) states — "You are testing how Chrome renders your app under phone conditions... there is no actual iOS or Android present."

🔴 **Explanation:** A and C are both true. A is the default parallelism that makes Playwright's test suite fast even with dozens of files — worth knowing now because it means two tests writing to the same external state (a shared test account, a shared database row) can race each other unless you deliberately serialize them (a Level 6+ concern). C matters because they solve different problems: `--headed` is "let me watch it happen in a real browser window," `--ui` is "let me interactively inspect and re-run individual steps" — genuinely different tools, not two names for the same feature.

</details>

---

**Next → [Level 2: Locators & Assertions for Mobile](Level_02_Locators_and_Assertions.md)**
