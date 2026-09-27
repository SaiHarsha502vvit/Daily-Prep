# Visual Regression Testing

> **Canonical lesson:** [29 Visual Regression Testing](../../07_Specialised_Testing/29_Visual_Regression_Testing.md). This page is a shorter summary kept for quick lookup; the chapter is the maintained version — if the two disagree, trust the chapter.

> Specialised reference for pixel-comparison testing with `toHaveScreenshot` and `toMatchSnapshot`. Mask strategies, baseline management, cross-platform rendering differences, the design-system-evolution problem, and the realities of running this in CI without going insane.
>
> Reference layer: locator basics, config, CI ([`reference/02_config.md`](../quick_reference/02_config.md), [`reference/10_ci_docker.md`](../quick_reference/10_ci_docker.md)). This focuses on what makes pixel comparison its own discipline.

---

## Table of contents

1. [What visual regression actually catches](#1-what-it-catches)
2. [`toHaveScreenshot` — full mechanics](#2-tohavescreenshot)
3. [`toMatchSnapshot` — generic snapshot matcher](#3-tomatchsnapshot)
4. [Baseline management](#4-baseline-management)
5. [The masking strategy](#5-masking)
6. [Animation handling](#6-animations)
7. [Stable viewports and fonts](#7-stable-viewports)
8. [Cross-platform: macOS vs Linux vs Windows](#8-cross-platform)
9. [Cross-browser visual diffs](#9-cross-browser)
10. [Per-component screenshots](#10-per-component)
11. [The design system evolution problem](#11-design-evolution)
12. [Diff visualisation](#12-diff-visualisation)
13. [CI ergonomics — updating baselines](#13-ci-ergonomics)
14. [Performance budget](#14-perf)
15. [When NOT to use visual regression](#15-when-not)
16. [Common production failures](#16-common-failures)

---

## 1. What it catches

| Bug class                                    | Visual regression catches?                |
| -------------------------------------------- | ----------------------------------------- |
| Layout shift (a sidebar moved 20px)          | ✅                                        |
| Color change (button went from blue to teal) | ✅                                        |
| Font change (Helvetica → Arial)              | ✅                                        |
| Spacing change (padding went from 16 to 12)  | ✅                                        |
| New unexpected element appeared              | ✅                                        |
| Element disappeared                          | ✅                                        |
| Element became invisible (opacity 0)         | ⚠️ Sometimes — depends on background      |
| Element became hidden (display: none)        | ✅                                        |
| Z-index changed (modal behind page)          | ✅                                        |
| Text content changed                         | ✅ — but DOM assertions catch this better |
| API change                                   | ❌ — different bug class                  |
| Behaviour change                             | ❌                                        |

Visual regression is RENDER-LEVEL testing. It complements behaviour tests; it doesn't replace them.

### 1.1 What it generates a lot of

False positives. Every CSS change, every browser version bump, every OS version bump, every font availability change → diff. Most diffs are NOT real bugs.

The discipline of visual regression is managing the false-positive rate.

---

## 2. `toHaveScreenshot`

### 2.1 Basic usage

```typescript
await expect(page).toHaveScreenshot();
await expect(page.locator(".modal")).toHaveScreenshot("modal.png");
await expect(page).toHaveScreenshot("full-page.png", { fullPage: true });
```

### 2.2 The full options

```typescript
await expect(page).toHaveScreenshot({
  // Name override
  name: "custom-name.png",

  // Full options
  fullPage: false, // entire scrollable page
  clip: { x: 0, y: 0, width: 800, height: 600 }, // crop
  omitBackground: false, // transparent background

  // Masking
  mask: [
    page.locator(".timestamp"), // hide dynamic timestamps
    page.locator(".user-avatar"), // hide variable avatars
  ],
  maskColor: "rgba(255, 0, 255, 0.5)", // pink for visibility

  // Behaviour
  animations: "disabled", // freeze animations
  caret: "hide", // hide text cursor

  // Tolerances
  threshold: 0.2, // pixel diff threshold (0-1)
  maxDiffPixels: 100, // total pixels different
  maxDiffPixelRatio: 0.02, // 2% of pixels different

  // Scaling
  scale: "device", // 'css' | 'device'

  // Stability
  timeout: 5000, // overall timeout
  stylePath: "tests/test-styles.css", // inject CSS before snapshot
});
```

### 2.3 What `threshold` and `maxDiffPixelRatio` do

The browser anti-aliasing means rendering is never byte-identical even between identical runs. `threshold` and `maxDiffPixelRatio` define the tolerance band.

- `threshold: 0.2` — per-pixel: how different can RGB channels be (0=identical, 1=any difference is "different").
- `maxDiffPixelRatio: 0.02` — globally: up to 2% of pixels can be "different" without failing.

Typical settings:

- New project (zero baselines): `threshold: 0.2, maxDiffPixelRatio: 0.02`.
- Established project: tighten over time as baselines stabilise.
- High-fidelity (design QA): `threshold: 0.1, maxDiffPixelRatio: 0.005`.

### 2.4 `animations: 'disabled'`

Internally Playwright sets `* { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; transition-delay: 0s !important; }` via CSS injection. After the screenshot, removes it.

For tests OUTSIDE visual regression that still want this, do it explicitly with `page.addStyleTag`.

### 2.5 `caret: 'hide'`

Text cursors blink. Without hiding, you get pixel diffs every other run.

### 2.6 First run vs subsequent runs

```bash
# First run (no baseline exists) — generates baseline, marks test as failed
npx playwright test

# Update existing baselines
npx playwright test --update-snapshots
```

The first run produces:

```
ERROR: Screenshot doesn't exist, generated.
```

Plus a `.png` file alongside the spec. Commit it.

---

## 3. `toMatchSnapshot`

A more generic matcher for any kind of file (PNG, text, JSON).

```typescript
const data = await page.evaluate(() => JSON.stringify(window.appState));
await expect(data).toMatchSnapshot("app-state.json");

const buf = await page.locator("canvas").screenshot();
await expect(buf).toMatchSnapshot("canvas.png");
```

For images, prefer `toHaveScreenshot` (more options). For non-image artifacts (JSON, text), use `toMatchSnapshot`.

### 3.1 Snapshot path

By default, snapshots live alongside the spec in a folder named `<spec>-snapshots/`:

```
tests/
├── homepage.spec.ts
└── homepage.spec.ts-snapshots/
    ├── full-page-chromium-darwin.png    # Mac Chromium
    ├── full-page-chromium-linux.png     # Linux Chromium
    └── full-page-firefox-darwin.png
```

Naming: `{name}-{project}-{platform}.png`. Different platforms get different baselines (rightly so — they render differently).

### 3.2 `snapshotPathTemplate`

```typescript
// playwright.config.ts
snapshotPathTemplate: '{snapshotDir}/{projectName}/{testFilePath}/{arg}{ext}',
```

Customise where snapshots land. Useful when:

- You want per-project subfolders.
- You're hosting snapshots externally.
- You want to deduplicate across platforms (don't — let each platform have its own).

---

## 4. Baseline management

### 4.1 The lifecycle

```
1. Write test with toHaveScreenshot()
2. Run locally → baseline created
3. Visually verify the baseline is correct
4. Commit baseline to git
5. Future runs compare against the baseline
6. When intentional UI change happens → --update-snapshots
7. Visually verify NEW baseline → commit
```

Step 3 and step 7 are the human review gates. Without them, you're committing whatever rendered — bugs included.

### 4.2 The baseline storage

PNG files in git. A typical large UI app accumulates 10–50 MB of baselines. Acceptable for most repos.

Alternative: store baselines in S3 / Azure Blob; reference by hash. Cleaner repo, more setup.

### 4.3 The diff artifacts on failure

When a test fails, Playwright produces three artifacts:

```
test-results/<test>/
├── actual.png           # what your code produced
├── expected.png         # the committed baseline
└── diff.png             # red-highlighted differences
```

The diff image is the most valuable. Visual inspection of the diff usually tells you immediately: real bug OR baseline-needs-update.

### 4.4 Branch-aware baselines

For teams maintaining multiple branches (current + LTS):

```
main branch:    homepage.spec.ts-snapshots/  (current design)
lts branch:     homepage.spec.ts-snapshots/  (old design)
```

Each branch has its own baselines. Merging a UI change to main updates main's baselines; lts continues to validate against its own.

For feature branches, baselines should match what the branch produces. Common workflow: PR runs → updates baselines on the PR branch → reviewer inspects diff → merges.

---

## 5. Masking

The most important visual-regression technique.

### 5.1 What to mask

Dynamic content that changes every render:

| Dynamic content                     | Why it's dynamic            |
| ----------------------------------- | --------------------------- |
| Timestamps ("Updated 2 min ago")    | Changes every minute        |
| User avatars                        | Randomised in test data     |
| Profile pictures                    | Same                        |
| Random IDs in URLs                  | UUID per record             |
| Loading indicators (between phases) | Timing-dependent            |
| Animated charts                     | Animation state             |
| Ad banners                          | Third-party content         |
| Auto-saved drafts                   | "Last saved: X seconds ago" |
| News feeds / activity feeds         | New items constantly        |
| Cursors / focus rings               | Position-dependent          |
| Cookie banners                      | Dismissed state varies      |

### 5.2 How to mask

```typescript
await expect(page).toHaveScreenshot({
  mask: [
    page.locator('[data-testid="last-updated"]'),
    page.locator(".user-avatar"),
    page.locator(".cookie-banner"),
  ],
  maskColor: "rgba(255, 0, 255, 0.5)", // pink, semi-transparent
});
```

Masked areas are filled with `maskColor`. The pink colour is intentional — easy to spot in diff images. Visually shows what's masked.

### 5.3 Mask hierarchy

If you mask `.parent`, all `.parent.child` are masked too. To preserve a child:

```typescript
mask: [
  page.locator('.parent:not(:has(.child))'),
],
```

CSS `:not(:has)` lets you selectively mask.

### 5.4 Masking strategy patterns

For SPAs with lots of dynamic content:

```typescript
// fixtures/visual.ts
const DEFAULT_MASKS = (page: Page) => [
  page.locator('[data-dynamic="true"]'), // app sets data-dynamic on dynamic elements
  page.locator("time"), // all <time> tags (timestamps)
  page.locator(".user-avatar"),
];

// In a test
await expect(page).toHaveScreenshot({
  mask: [...DEFAULT_MASKS(page), page.locator(".custom-mask")],
});
```

Convention: add `data-dynamic="true"` in the app to anything that's expected to differ. Tests then mask those by attribute. Single source of truth.

### 5.5 The "mask too much" trap

If you mask 80% of the page, your test passes anything. Visual regression becomes meaningless.

Rule of thumb: mask should cover <30% of the screenshot area. If more, your page is too dynamic for pixel comparison — use behaviour tests instead.

---

## 6. Animations

Visual regression and animations don't mix without intervention.

### 6.1 `animations: 'disabled'` baseline

Default for `toHaveScreenshot`. Disables CSS animations and transitions. Most cases are covered.

### 6.2 What `'disabled'` doesn't catch

- JavaScript-driven animations (canvas, WebGL, GSAP).
- SVG SMIL animations.
- Animations on continuously-rendered third-party widgets.

For these, additional intervention:

```typescript
// Pause GSAP
await page.evaluate(() => (window as any).gsap?.globalTimeline?.pause());

// Pause canvas animation by setting a flag
await page.evaluate(() => {
  (window as any).__animationsPaused = true;
});

// Force every Animation API instance to a fixed state
await page.evaluate(() => {
  document.querySelectorAll("*").forEach((el) => {
    (el as HTMLElement).getAnimations?.().forEach((a) => a.finish());
  });
});
```

### 6.3 Loading spinners

Spinners are animations. Before screenshot, wait for them to be gone:

```typescript
await expect(
  page.locator('.ms-Spinner, .spinner, [role="progressbar"]'),
).toHaveCount(0);
await expect(page).toHaveScreenshot();
```

Or mask them. Different choice depending on whether the test cares about the loaded state or the loading state.

### 6.4 Continuously-changing elements

A live clock display:

```html
<div class="clock">14:32:05</div>
```

Updates every second. ALWAYS will diff.

Options:

1. Mask it.
2. Stop the clock before snapshot: `await page.evaluate(() => clearInterval(window.clockInterval));`.
3. Freeze the system clock with `page.clock.install({ fixedTime: ... })`.

`page.clock` is the cleanest — see [Playwright docs on time mocking](https://playwright.dev/docs/clock).

---

## 7. Stable viewports

### 7.1 Always set explicit viewport

```typescript
// playwright.config.ts
use: {
  viewport: { width: 1440, height: 900 },
}
```

Without this, viewport defaults to whatever the browser chooses — varies between headless modes, OS versions, etc.

For visual tests specifically, lock the viewport and never change it. Different viewports = different baselines = baseline explosion.

### 7.2 Font stability

Fonts vary between OSes. The same `font-family: 'Helvetica'` renders differently on macOS (real Helvetica) vs Linux (Helvetica not installed → fallback).

Solutions:

1. Ship a font stack that resolves consistently: `font-family: 'Roboto', 'Arial', sans-serif`. As long as Roboto is web-loaded, looks the same everywhere.
2. Run tests in a container with controlled fonts (e.g., MS Playwright Docker image with `fonts-roboto` installed).
3. Per-platform baselines (default behaviour) — accept the duplication.

### 7.3 DeviceScaleFactor

A 1×, 2×, 3× DPR renders the same DOM at different pixel sizes. Lock it:

```typescript
use: {
  deviceScaleFactor: 1,   // consistent
}
```

### 7.4 ColorScheme

If your app responds to `prefers-color-scheme`, an OS-level "dark mode" preference breaks visual regression. Force it:

```typescript
use: {
  colorScheme: 'light',
}
```

---

## 8. Cross-platform

### 8.1 The macOS vs Linux problem

The same Chromium build renders text and images differently on macOS vs Linux:

- Font rendering: macOS uses subpixel antialiasing; Linux uses grayscale.
- Emoji: rendered from different system fonts.
- Image scaling: subtle interpolation differences.

For a 1000×800 screenshot, you'll typically see 50–200 pixel diffs between platforms even for identical pages.

### 8.2 The "test on Linux only" recommendation

Most teams pick one platform for visual regression:

- **CI Linux** (via Docker) — recommended; matches production for most web apps.
- Developers test locally on macOS/Windows but DON'T update baselines from there.

Setting:

```typescript
test("visual test", async ({ page }) => {
  test.skip(process.platform !== "linux", "Visual tests only run on Linux");
  // ...
  await expect(page).toHaveScreenshot();
});
```

Or scope project to Linux:

```typescript
projects: [
  { name: 'visual', testMatch: '**/*.visual.spec.ts', use: { /* linux config */ } },
],
```

Then CI runs visual; local doesn't.

### 8.3 Updating baselines from Linux only

```bash
# In Docker, on Linux
docker run --rm -v $(pwd):/work -w /work playwright-image \
  npx playwright test --update-snapshots
```

Pull the updated baselines back to your branch. Commit.

---

## 9. Cross-browser

### 9.1 Per-browser baselines

Each project gets its own baselines:

```
homepage.spec.ts-snapshots/
├── full-page-chromium-linux.png
├── full-page-firefox-linux.png
└── full-page-webkit-linux.png
```

Each browser renders slightly differently. Common differences:

- Form controls (button shapes, checkbox styling).
- Scrollbar styling.
- Font kerning.
- Anti-aliasing.

### 9.2 The cross-browser test count multiplier

10 visual tests × 3 browsers = 30 baselines. 200 tests × 3 = 600. Per-browser maintenance is real.

Common strategy: run visual tests ONLY in Chromium. If you need to validate cross-browser visual fidelity, do periodic manual review or use a separate dedicated tool (Percy, Chromatic).

---

## 10. Per-component

Instead of full-page screenshots, snapshot specific components.

### 10.1 Locator-scoped screenshot

```typescript
await expect(page.locator(".customer-card")).toHaveScreenshot(
  "customer-card.png",
);
```

Pros:

- Smaller diff surface — less false-positive risk.
- Each component's tests are independent.
- Easier to update (one component's baselines, not the whole page).

Cons:

- Layout context lost (a component looks fine alone, breaks in a page layout).

### 10.2 The component-test integration

Use Playwright Component Testing (CT) for true component isolation:

```typescript
import { test, expect } from '@playwright/experimental-ct-react';
import { CustomerCard } from './CustomerCard';

test('renders a CustomerCard correctly', async ({ mount }) => {
  const component = await mount(<CustomerCard name="Alice" status="Active" />);
  await expect(component).toHaveScreenshot('customer-card.png');
});
```

See [`./component_testing.md`](./component_testing.md).

### 10.3 The split visual-vs-E2E strategy

| Test type               | Scope                             |
| ----------------------- | --------------------------------- |
| Component visual tests  | Per-component rendering           |
| Page-level visual tests | Layout, header/footer, navigation |
| E2E visual tests        | Whole pages in real workflows     |

Components catch design system regressions cheaply. Page-level catches integration. E2E catches "the workflow shows the right page."

For most teams: heavy on components, light on E2E visual.

---

## 11. The design system evolution

The hardest problem in visual regression: when the design system intentionally changes.

### 11.1 Scenario

Designer changes button colours globally. 200 tests have buttons in their screenshots. All 200 fail.

You need to:

1. Verify the change is intentional (review).
2. Update all 200 baselines.
3. Verify each new baseline (more review).

### 11.2 Mitigations

**Theme tokens:**
If your app uses CSS custom properties for colors:

```css
:root {
  --color-primary: #0066cc;
}
.btn-primary {
  background: var(--color-primary);
}
```

A designer changes the token; the renders change once. Update all baselines via:

```bash
npx playwright test --update-snapshots
git diff --stat   # see scope of change
```

Reviewer scrolls through diff images, looks for the COLOR change (not other regressions).

**Visual regression review tools:**
Reviewer-side tools (Argos, Percy, Chromatic) provide a UI for accepting/rejecting groups of changes. Useful at scale.

**Granular tests:**
Lots of small component visual tests are easier to triage than few large page-level visual tests.

### 11.3 The "always update baselines" anti-pattern

Some teams set up CI to auto-update baselines on every change. Don't.

This means:

- Real visual regressions are silently accepted.
- The whole visual test layer becomes useless.
- You're paying for nothing.

Baseline updates require HUMAN review. Make this an accepted overhead.

---

## 12. Diff visualisation

When a visual test fails:

```
PASS: 100 tests
FAIL: 5 tests
  ✗ homepage › full page rendering
  ✗ profile › avatar grid
```

For each failure, Playwright produces `actual.png`, `expected.png`, `diff.png`. In the HTML report:

- Click the failed test.
- Three images shown side-by-side or as slider.
- Hover to compare.

### 12.1 The diff colour

By default, diff highlights are red. Pixels that differ between actual and expected are drawn in red over the diff image.

### 12.2 The "is it real?" diagnostic

Look at the diff:

- Many isolated red pixels scattered → anti-aliasing noise, raise tolerance.
- Red region in a specific area → real change in that area.
- Big red block → entire section differs.

The skill of visual review is reading diffs quickly.

---

## 13. CI ergonomics

### 13.1 The first run / CI mismatch

A test passes locally (macOS) but fails in CI (Linux) because the baseline was generated on macOS.

Always generate baselines in the same environment as CI:

```bash
docker run --rm -v $(pwd):/work -w /work playwright-image \
  npx playwright test --update-snapshots
```

### 13.2 The "snapshot doesn't exist" CI failure

First time a new visual test runs in CI:

```
ERROR: Screenshot doesn't exist, generated.
```

The test passes locally (file exists) but fails CI (file in git, but for a different platform).

Solutions:

- Pre-generate baselines for all target platforms before merging.
- OR have CI generate and upload as a separate "approval" step in PRs.

### 13.3 Updating baselines via CI

For automated baseline updates in PRs:

```yaml
- name: Run visual tests
  run: npx playwright test

- name: Update baselines on diff
  if: failure()
  run: |
    npx playwright test --update-snapshots
    git add -A '*.png'
    git commit -m "chore: update visual baselines"
    git push
```

⚠️ Don't enable this on `main` — only on PR branches. The reviewer sees the diff in PR review.

---

## 14. Performance

### 14.1 Per-test cost

`toHaveScreenshot` adds 200–800 ms per call:

- Wait for animations to settle.
- Capture pixel buffer.
- Compare with baseline.
- Write artifacts on mismatch.

For a 200-test suite where each test has 1 visual assertion: 40–160 seconds of overhead.

### 14.2 `fullPage: true` cost

A 5000-pixel-tall scrollable page screenshot:

- Captures the whole page, not just viewport.
- ~1–3 seconds extra.
- Larger PNG files (200 KB – 1 MB).

Use sparingly. Most "interesting" content is above-fold.

### 14.3 Cumulative file size

Baselines accumulate in git. 1000 baselines × 200 KB = 200 MB. Manageable but noticeable.

git LFS for baselines is reasonable above 500 MB.

---

## 15. When NOT to use

| Scenario                         | Better alternative               |
| -------------------------------- | -------------------------------- |
| Pure content changes             | DOM assertions (`toHaveText`)    |
| Behavior verification            | Behavior tests                   |
| Cross-browser layout differences | Don't — each is its own baseline |
| Highly dynamic dashboards        | Behavior + DOM assertions        |
| Real-time updating content       | Don't — false-positive forever   |
| Maps / 3D scenes / videos        | Specialized tools                |
| Pure design system QA            | Storybook + Chromatic dedicated  |

Visual regression is one tool. It's expensive (baselines, review, CI compute) and has high false-positive rate. Use where it shines: design-stable UI surfaces with infrequent intentional changes.

---

## 16. Common failures

### Failure 1 — Test passes locally, fails in CI

**Cause:** Baseline generated on different platform.
**Fix:** Generate baselines in CI environment (Docker).

### Failure 2 — Test fails after browser update

**Cause:** New Chromium version renders slightly differently.
**Fix:** Update baselines (`--update-snapshots`). Inspect changes.

### Failure 3 — Test fails on every run

**Cause:** Animations, dynamic content, or insufficient masking.
**Fix:** Mask dynamic elements; disable animations; freeze clocks.

### Failure 4 — Diff shows entire image red

**Cause:** Browser fonts changed (e.g., fallback used).
**Fix:** Ensure font loading. Use webfonts. Check Docker image font packages.

### Failure 5 — `--update-snapshots` doesn't update

**Cause:** Test was skipped (e.g., `test.skip(process.platform !== 'linux')`).
**Fix:** Run on the right platform.

### Failure 6 — Different developers generate different baselines

**Cause:** Different OSes, browser versions, viewport defaults.
**Fix:** Only update baselines via CI Docker; commit those.

---

## Cross-references

- Config (viewport, devices): [`../reference/02_config.md`](../quick_reference/02_config.md)
- CI baseline generation: [`../reference/10_ci_docker.md`](../quick_reference/10_ci_docker.md)
- Component testing for finer-grained visuals: [`./component_testing.md`](./component_testing.md)
- Accessibility visual checks (color contrast): [`./accessibility.md`](./accessibility.md)
