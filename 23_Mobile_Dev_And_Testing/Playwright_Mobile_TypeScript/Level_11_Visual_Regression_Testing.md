# Level 11 — Visual Regression Testing

### Companion track: [Playwright Mobile Testing with TypeScript](00_ROADMAP.md) · Previous: [Level 10](Level_10_Hybrid_WebView_Testing.md)

---

## Basics — `toHaveScreenshot()`, and What "First Run" Actually Does

Every assertion so far has been logical — "is this text visible," "does this locator exist." Visual regression testing asks a different question: "does this screen *look* right," pixel by pixel, which can catch a CSS regression that breaks nothing logically but genuinely looks broken.

```typescript
import { test, expect, devices } from '@playwright/test';

test.use({ ...devices['Pixel 7'] });

test('product page renders correctly', async ({ page }) => {
  await page.goto('/product/123');
  await expect(page).toHaveScreenshot('product-page.png');
});
```

**The first time this test runs**, per Playwright's own documentation, there's no baseline to compare against yet — Playwright captures multiple screenshots until two consecutive ones match (waiting out any settling animation), then **saves that as the baseline**, and the test passes automatically on that first run. Every subsequent run compares against that saved baseline and fails if the difference exceeds the configured threshold.

```
tests/
  product-page.spec.ts-snapshots/
    product-page-chromium-linux.png   ← the baseline, committed to git
```

The filename encodes `{browser}-{platform}` automatically, because — per Playwright's own docs — *"screenshots differ between browsers and platforms due to different rendering, fonts and more."*

---

## Concept — Why Mobile Visual Testing Has More Baselines Than Desktop

A desktop suite might run against 2-3 browser engines. A mobile suite testing across [Level 7's multi-device projects](Level_07_Multi_Device_Config.md) genuinely needs a **separate baseline per device project** — a Pixel 7 baseline and an iPhone 14 baseline for the same screen are not interchangeable, because `deviceScaleFactor`, viewport dimensions, and font rendering all differ.

```typescript
// playwright.config.ts — Level 7's projects, now each with its OWN visual baselines
projects: [
  { name: 'mobile-chrome-pixel7', use: { ...devices['Pixel 7'] } },
  { name: 'mobile-safari-iphone14', use: { ...devices['iPhone 14'] } },
]
```

```
tests/product-page.spec.ts-snapshots/
  product-page-mobile-chrome-pixel7-linux.png
  product-page-mobile-safari-iphone14-linux.png
```

Running the same `toHaveScreenshot()` call across both projects automatically produces and checks against two entirely separate baseline files — exactly the multi-device parallelism [Level 7](Level_07_Multi_Device_Config.md) already set up, now applied to pixels instead of just logical assertions.

---

## Real-World Problem — The Screenshot That Fails for the Wrong Reason

Mobile UIs are animation-heavy — that's precisely where naive visual testing gets flaky, catching *timing* differences instead of genuine visual regressions.

```typescript
// FLAKY: fails intermittently even with zero real UI changes
test('cart badge shows correctly', async ({ page }) => {
  await page.goto('/product/123');
  await page.getByRole('button', { name: 'Add to Cart' }).tap();
  await expect(page).toHaveScreenshot('cart-added.png'); // races the badge's pop-in animation
});
```

The badge's own "just added" pop animation means the screenshot might capture it mid-scale, mid-color-transition, or fully settled — different every run, none of which reflects an actual regression. Fixes, layered:

```typescript
test('cart badge shows correctly', async ({ page }) => {
  await page.goto('/product/123');
  await page.getByRole('button', { name: 'Add to Cart' }).tap();

  // Wait for the animation to genuinely settle — an explicit signal,
  // not a fixed timeout guess
  await expect(page.getByTestId('cart-badge')).toHaveCSS('transform', 'none');

  await expect(page).toHaveScreenshot('cart-added.png', {
    maxDiffPixels: 50, // tolerate minor anti-aliasing noise, not real differences
  });
});
```

`maxDiffPixels` is a **tolerance**, not a fix for a genuinely racy screenshot — set too high, it silently accepts real regressions; set too low on a test that's still racing an animation, it stays flaky regardless. The actual fix is always "wait for a real settled-state signal first," with `maxDiffPixels` handling only the residual, expected pixel noise (font anti-aliasing, sub-pixel rendering differences) that exists even on a genuinely stable screen.

---

## Solution — Masking Content That's Supposed to Change

Some content is *correctly* different on every run — a live clock, a rotating promotional banner, a timestamp — and shouldn't fail a visual test just for existing.

```typescript
await expect(page).toHaveScreenshot('dashboard.png', {
  mask: [page.getByTestId('live-clock'), page.getByTestId('promo-banner')],
});
```

Or, for broader coverage via a stylesheet, per Playwright's own `stylePath` option:

```css
/* mobile-mask.css */
[data-testid="live-clock"] { visibility: hidden; }
[data-testid="promo-banner"] { visibility: hidden; }
```

```typescript
await expect(page).toHaveScreenshot('dashboard.png', {
  stylePath: path.join(__dirname, 'mobile-mask.css'),
});
```

**The mobile-specific version of this problem worth naming directly:** a real device's status bar (battery percentage, WiFi signal, the actual clock) is *always* different — if your screenshots ever include the real device chrome rather than just the app's own content, masking (or cropping the screenshot to exclude the status bar entirely) isn't optional, it's required for the test to ever pass reliably at all.

---

## Challenges

### 🐛 Bug Hunt — The Baseline That's Wrong for Everyone Except One Developer

```bash
# A teammate runs this locally on macOS and commits the result:
npx playwright test --update-snapshots
git add tests/product-page.spec.ts-snapshots/
git commit -m "update baseline for new button color"
```

CI (running on Linux) now fails this test on every single run, even though the button color change is genuinely correct and intentional. Using [this level's own basics section](#basics--tohavescreenshot-and-what-first-run-actually-does), diagnose the mismatch.

<details><summary>Diagnosis & Fix</summary>

🔴 **Explanation:** per this level's own coverage of baseline filenames — `{browser}-{platform}` — a baseline generated on macOS (`-darwin`) is a **different file** from one expected on Linux (`-linux`), and font rendering/anti-aliasing genuinely differs between operating systems even for identical CSS. The teammate's locally-generated baseline is correct for macOS but was never the file CI is actually comparing against; CI needed a **Linux**-generated baseline, which nobody produced. The fix: **always generate baselines inside the same environment CI actually runs in** — typically via a Docker container matching the CI image, or by running `--update-snapshots` inside CI itself and committing the resulting artifact, never by trusting a locally-generated one on a different OS to transfer correctly.

</details>

---

### 🎭 Two Truths and a Lie — Visual Testing Mechanics

**A.** `toHaveScreenshot()`'s very first run always passes, regardless of what the screen actually looks like, because there's no baseline yet to compare against.

**B.** `maxDiffPixels` set high enough will eventually make any visual test pass, including ones with a real, meaningful UI regression — it's a blunt tool, not a substitute for fixing genuine test flakiness at its root.

**C.** A `mask` option and cropping a screenshot to a specific region achieve the identical practical effect — there's no reason to prefer one over the other.

<details><summary>Which one's the lie</summary>

**C is the lie.** `mask` and region-cropping solve related but distinct problems — `mask` keeps the full-page screenshot but blacks out (or hides) *specific elements* wherever they happen to be, which is correct when you want to verify everything else on the page except a few known-volatile spots. Cropping to a region instead only captures — and only compares — a specific rectangular area, discarding everything outside it entirely, which is the right tool when you only care about verifying one component in isolation and have no interest in the rest of the page at all. Choosing the wrong one either hides too much (a crop that's too narrow misses a regression elsewhere on the page) or too little (a mask that misses a volatile element you forgot to list).

🔴 **Explanation:** A is true and is exactly [this level's own opening explanation](#basics--tohavescreenshot-and-what-first-run-actually-does) — the first run's job is only to *establish* the baseline, not to judge it; a genuinely broken screen captured on first run becomes the "correct" baseline until a human catches it in code review. B is also true and is the direct point of [this level's Real-World Problem section](#real-world-problem--the-screenshot-that-fails-for-the-wrong-reason) — tuning tolerance up to silence flakiness is treating a symptom, not the actual timing/settling problem underneath it.

</details>

---

**Next → [Level 12: Debugging Flaky Tests](Level_12_Debugging_Flaky_Tests.md)**
