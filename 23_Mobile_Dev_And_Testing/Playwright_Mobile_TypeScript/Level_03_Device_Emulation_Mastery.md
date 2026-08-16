# Level 3 — Device Emulation Mastery

### Companion track: [Playwright Mobile Testing with TypeScript](00_ROADMAP.md) · Previous: [Level 2](Level_02_Locators_and_Assertions.md)

---

## Basics — What's Actually Inside a Device Descriptor

Levels 1-2 used `devices['Pixel 7']` without asking what that object actually contains. Time to open it up:

```typescript
import { devices } from '@playwright/test';

console.log(devices['Pixel 7']);
// {
//   userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7)...',
//   viewport: { width: 412, height: 915 },
//   screenSize: { width: 412, height: 915 },
//   deviceScaleFactor: 2.625,
//   isMobile: true,
//   hasTouch: true,
//   defaultBrowserType: 'chromium',
// }
```

Per Playwright's own emulation docs, each property controls one specific thing:

| Property | Controls |
|---|---|
| `userAgent` | The `navigator.userAgent` string your app's JavaScript sees — many sites branch behavior on this (mobile-specific analytics, a "download our app" banner) |
| `viewport` | The rendering area's CSS pixel dimensions — this is what your responsive CSS media queries actually respond to |
| `screenSize` | The *physical* screen dimensions reported to `window.screen` — usually matches viewport for phones, can differ when testing browser chrome scenarios |
| `deviceScaleFactor` | Pixels-per-CSS-pixel — controls how crisp/blurry images and text render, and affects any code reading `window.devicePixelRatio` |
| `isMobile` | Whether the `viewport` meta tag's scaling behavior applies — this is genuinely a distinct concept from `hasTouch` |
| `hasTouch` | Whether `Touchscreen` methods (Level 4) work at all, and whether `(pointer: coarse)` CSS media queries match |
| `defaultBrowserType` | Which engine this device profile is meant to run in — `webkit` for iOS devices (matching Safari's real engine), `chromium` for Android |

---

## Concept — `isMobile` and `hasTouch` Are Genuinely Independent

This is the part worth slowing down on, because it's not obvious from the property names alone:

```typescript
// A touch-enabled laptop — hasTouch: true, but isMobile: false
// (the viewport meta tag's mobile-specific scaling rules don't apply)
const context = await browser.newContext({
  hasTouch: true,
  isMobile: false,
  viewport: { width: 1280, height: 800 },
});

// A small desktop browser window resized to phone dimensions —
// isMobile: false, hasTouch: false — NOT the same as an actual phone,
// even though the viewport width matches
const context2 = await browser.newContext({
  viewport: { width: 375, height: 812 },
  // isMobile defaults false, hasTouch defaults false
});
```

**Why this distinction matters in a real test:** a site's CSS might correctly show a "mobile" layout at `context2`'s narrow viewport (that's just a media query responding to width) — but any JavaScript checking `navigator.maxTouchPoints > 0` or listening for `touchstart` events will behave as if it's on a desktop, because `hasTouch` is `false`. A test asserting "the mobile touch-swipe gesture works" against `context2` would be testing something that can't actually happen — there's no touch capability, regardless of how narrow the viewport is.

---

## Real-World Problem — Testing a Device Playwright Doesn't Ship a Preset For

Playwright ships dozens of presets, but not infinite ones — testing against, say, a specific budget Android tablet your analytics show real users on means building a descriptor by hand.

```typescript
import { test, expect } from '@playwright/test';

test.use({
  userAgent: 'Mozilla/5.0 (Linux; Android 11; SM-T510) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36',
  viewport: { width: 800, height: 1280 },
  screenSize: { width: 800, height: 1280 },
  deviceScaleFactor: 1.5,
  isMobile: true,
  hasTouch: true,
});

test('layout adapts correctly on a budget Android tablet', async ({ page }) => {
  await page.goto('https://example-shop.com');
  // At 800px width, this app's breakpoint might show a 2-column grid
  // instead of the phone's 1-column or the desktop's 4-column layout —
  // a real device this specific isn't covered by any built-in preset
  await expect(page.getByTestId('product-grid')).toHaveCSS('grid-template-columns', /repeat\(2,/);
});
```

---

## Solution — Spreading a Preset, Then Overriding Just What You Need

You don't have to choose between "use a full preset" and "build one entirely from scratch" — spread a close preset and override only the specific properties you need to differ:

```typescript
import { devices } from '@playwright/test';

test.use({
  ...devices['Pixel 7'],
  // Override just the viewport — testing the same device's browser,
  // but in split-screen multitasking mode, which shrinks the viewport
  // without changing the user agent or touch capability at all
  viewport: { width: 412, height: 500 },
});
```

This is the pattern worth defaulting to: start from the closest real preset (correct user agent, correct scale factor, correct touch/mobile flags), and override only the one or two properties your specific test scenario actually needs to differ — rather than hand-writing every property and risking a typo in something like the user-agent string that silently makes your test not representative of anything real.

---

## Challenges

### 🐛 Bug Hunt — The Swipe Test That Silently Does Nothing

```typescript
test.use({
  viewport: { width: 390, height: 844 }, // iPhone-sized viewport
  isMobile: true,
});

test('swiping the carousel advances to the next image', async ({ page }) => {
  await page.goto('/product/456');
  await page.touchscreen.tap(200, 400); // throws an error here
});
```

This throws an error the instant `touchscreen.tap()` runs, before the test even gets to check anything. Using [this level's own device-descriptor table](#basics--whats-actually-inside-a-device-descriptor), name the missing property.

<details><summary>Diagnosis & Fix</summary>

🔴 **Explanation:** `hasTouch` was never set — it defaults to `false`. Per Playwright's own `Touchscreen` documentation (already covered in [DOC_09](../Flutter_Bootcamp/Reference/DOC_09_Mobile_Debugging_Toolkit.md) and [05_Mobile_Web_And_Hybrid_Playwright.md](../05_Mobile_Web_And_Hybrid_Playwright.md)), touchscreen methods throw if the context wasn't initialized with `hasTouch: true`. Setting `viewport` and `isMobile` alone gets you a phone-*shaped* context, but not a touch-*capable* one — exactly [this level's Concept section](#concept--ismobile-and-hastouch-are-genuinely-independent) distinction. Fix:

```typescript
test.use({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true, // the missing piece
});
```

</details>

---

### 🎭 Two Truths and a Lie — Device Descriptor Properties

**A.** `deviceScaleFactor` affects how sharp images render, but has no effect on your test's actual assertions or locators — it's a purely visual/rendering property.

**B.** Spreading `...devices['iPhone 14']` and then overriding `viewport` still keeps the rest of that preset's properties (user agent, touch, scale factor) intact — only the explicitly overridden key changes.

**C.** `defaultBrowserType` in a device preset is purely informational — Playwright ignores it and always uses whatever browser project is currently configured to run.

<details><summary>Which one's the lie</summary>

**C is the lie.** `defaultBrowserType` genuinely matters — it's why `devices['iPhone 14']` is meant to be paired with WebKit (matching real Safari, the actual engine iPhones use) rather than Chromium; using an iOS device preset with a Chromium project tests a combination that doesn't correspond to any real device (real iPhones don't run Chrome's actual engine — "Chrome for iOS" is Safari's WebKit engine wearing Chrome's UI, a genuinely different setup than desktop Chrome). Playwright's test runner respects this field to help you avoid that mismatch when your config is set up correctly.

🔴 **Explanation:** A is mostly true for logical assertions but worth a caveat — `deviceScaleFactor` doesn't change *what* elements exist or their CSS pixel positions, so most locator/assertion code is unaffected, but it absolutely matters for Level 11's visual regression screenshots, where a mismatched scale factor between a baseline and a new run produces a false failure that has nothing to do with an actual UI bug. B is true and is exactly [this level's Solution section](#solution--spreading-a-preset-then-overriding-just-what-you-need) — object spread only touches the keys you explicitly list after it, every other property from the original preset survives unchanged.

</details>

---

**Next → [Level 4: Touch & Gesture Interactions](Level_04_Touch_and_Gesture_Interactions.md)**
