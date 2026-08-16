# Level 9 — Screenshots & the Missing Visual-Regression Assertion

### Companion track: [Mobilewright Native Testing with TypeScript](00_ROADMAP.md) · Previous: [Level 8](Level_08_The_Fixture_Gap.md)

---

## Basics — `screen.screenshot()` Captures Pixels; It Doesn't Compare Them

```typescript
// Captures a PNG of the current screen — that's the entire feature
const buffer = await screen.screenshot();
await fs.writeFile('login-screen.png', buffer);

// Also works scoped to a single locator, not just the whole screen
const badgeBuffer = await screen.getByTestId('cart-badge').screenshot();
```

Compare this directly against [Playwright_Mobile_TypeScript's Level 11](../Playwright_Mobile_TypeScript/Level_11_Visual_Regression_Testing.md), which is built entirely around `expect(page).toHaveScreenshot()` — a single assertion that captures, compares against a stored baseline, computes a pixel diff, and fails the test if the difference exceeds a threshold, all in one call. **Mobilewright's `screenshot()` only does the first of those four things.** There is no documented `toHaveScreenshot()`-equivalent assertion in `@mobilewright/test` as of this writing — capturing an image and asserting it matches a baseline are two separate concerns here, where Playwright bundles them into one.

---

## Concept — Why This Gap Matters More on Native Than on Web

On a web page, a `toHaveScreenshot()` failure is often genuinely actionable — a CSS regression, a layout shift, a font that failed to load. Native mobile rendering introduces more legitimate, meaningless pixel noise: status bar clock digits changing between runs, battery icon state, notification badges, subtle anti-aliasing differences between two runs of the *same* emulator image. A visual-regression system for native screens generally needs deliberate masking (excluding the status bar region, for instance) to be usable at all — which is exactly why building one properly is a real undertaking, not a one-line assertion, even before considering that Mobilewright doesn't ship the comparison half at all.

---

## Real-World Problem — What "Doing Visual Regression Anyway" Actually Requires

```typescript
import { screenshot as takeScreenshot } from '@mobilewright/test'; // capture only
import pixelmatch from 'pixelmatch'; // third-party, NOT part of Mobilewright
import { PNG } from 'pngjs';
import fs from 'node:fs';

test('login screen matches baseline', async ({ screen }) => {
  const currentBuffer = await screen.screenshot();
  const baselinePath = 'baselines/login-screen.png';

  if (!fs.existsSync(baselinePath)) {
    fs.writeFileSync(baselinePath, currentBuffer); // first run establishes baseline
    return;
  }

  const current = PNG.sync.read(currentBuffer);
  const baseline = PNG.sync.read(fs.readFileSync(baselinePath));
  const diff = new PNG({ width: current.width, height: current.height });

  const diffPixelCount = pixelmatch(
    current.data, baseline.data, diff.data,
    current.width, current.height,
    { threshold: 0.1 },
  );

  expect(diffPixelCount).toBeLessThan(50); // an arbitrary, project-chosen tolerance
});
```

This is real, working code — but notice how much of it is generic image-diffing plumbing (`pixelmatch`, `pngjs`, manual baseline-file handling) that has nothing to do with Mobilewright itself. Playwright's `toHaveScreenshot()` hides all of this; Mobilewright currently requires building it, or adopting a third-party tool, yourself.

---

## Solution — Deciding Whether Full Visual Regression Is Worth Building Yet

Given the real cost shown above, the honest question for most projects: is a hand-built pixel-diff pipeline worth maintaining, or does the project's actual need stop at **capturing screenshots as debugging artifacts on failure** — useful for a human reviewing a failed CI run, without the ongoing maintenance burden (baseline updates, masking status-bar noise, threshold tuning) of a full comparison system?

```typescript
// A lighter, honest middle ground — screenshot on failure for human review,
// no automated comparison at all
test.afterEach(async ({ screen }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    const buffer = await screen.screenshot();
    await testInfo.attach('failure-screenshot', { body: buffer, contentType: 'image/png' });
  }
});
```

Neither answer is universally correct — the point of this level is knowing the real tradeoff exists and picking deliberately, rather than assuming `screenshot()` gives you regression detection it doesn't.

---

## Challenges

### 🐛 Bug Hunt — Assuming a Built-In Comparison That Doesn't Exist

```typescript
test('settings screen matches baseline', async ({ screen }) => {
  await expect(screen).toMatchScreenshot('settings-baseline.png'); // this method doesn't exist
});
```

A developer coming from the Playwright track writes this, expecting it to work the way `toHaveScreenshot()` does there. What actually happens, and why?

<details><summary>Diagnosis & Fix</summary>

🔴 **Explanation:** `toMatchScreenshot()` (or any built-in comparison assertion) isn't part of Mobilewright's documented API — this call fails immediately, likely with a "not a function" or similar error, because the method genuinely doesn't exist, not because of a typo or misconfiguration. This is the exact assumption [this level's Basics section](#basics--screenscreenshot-captures-pixels-it-doesnt-compare-them) warned against: the two frameworks share a lot of API shape (`getByRole`, locator/value assertion split, `test.use()`), which makes it easy to assume feature parity where it doesn't actually exist. The fix requires explicitly building the comparison step, using [this level's Real-World Problem pattern](#real-world-problem--what-doing-visual-regression-anyway-actually-requires) — there's no drop-in single-call replacement.

The broader lesson: **shared API design between two frameworks is a productivity win, not a guarantee of feature parity** — every specific method still needs to be confirmed against the actual framework you're using, not assumed by analogy.

</details>

---

### 🎭 Two Truths and a Lie — Screenshots and Comparison

**A.** `screen.screenshot()` can be called on a specific locator, not just the whole screen, to capture a narrower region.

**B.** Because native screens include noise like a live clock in the status bar, a naive full-screen pixel diff is more likely to produce false-positive failures on mobile than the equivalent web-page comparison would be.

**C.** Since Mobilewright doesn't ship a built-in visual-regression assertion, screenshot-based testing isn't possible at all without writing custom code.

<details><summary>Which one's the lie</summary>

**C is the lie** — or at least an overstatement. [This level's Solution section](#solution--deciding-whether-full-visual-regression-is-worth-building-yet) showed a legitimate, useful pattern (failure-screenshot attachment for human review) that requires no comparison logic at all, and is still genuinely valuable without building a full pixel-diff pipeline. "No built-in automated comparison" isn't the same as "no useful screenshot-based testing is possible" — it just means the *automated* comparison half specifically has to be built or adopted separately, as [the Real-World Problem section](#real-world-problem--what-doing-visual-regression-anyway-actually-requires) did.

🔴 **Explanation:** A is true and directly enables narrower, more targeted captures (a single badge or icon) instead of always diffing an entire noisy screen. B is true and is [this level's own Concept section](#concept--why-this-gap-matters-more-on-native-than-on-web) — native screens carry system-chrome noise a typical web page comparison doesn't have to contend with.

</details>

---

**Next → [Level 10: The Mobilewright Inspector](Level_10_The_Mobilewright_Inspector.md)**
