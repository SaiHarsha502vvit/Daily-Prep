# 29. Visual Regression Testing — `toHaveScreenshot()` in Enterprise Apps

**Navigation**: [← Chapter 28: Test Data Lifecycle](../03_Real_World_Scenarios/28_Test_Data_Lifecycle_and_Cleanup.md) | [Index](../00_INDEX.md) | [→ Chapter 30: Database Verification](../03_Real_World_Scenarios/30_Database_Verification_Direct_SQL.md)

**Cross-links:**

- [`17_D365_Advanced_Timing_Patterns.md`](../04_Cross_Site_Patterns_And_D365/17_D365_Advanced_Timing_Patterns.md) — Wait for stable state before screenshotting
- [`25_CICD_Integration_GitHub_Azure.md`](../06_CI_CD_And_Reliability/25_CICD_Integration_GitHub_Azure.md) — Storing snapshots in CI
- [`26_Flakiness_Diagnosis_and_Fixing.md`](../06_CI_CD_And_Reliability/26_Flakiness_Diagnosis_and_Fixing.md) — Animation flakiness in screenshots
- [`61_Emulation_Clock_Network_And_Devices.md`](../03_Real_World_Scenarios/61_Emulation_Clock_Network_And_Devices.md) — aria snapshots (structural assertions) + dark-mode screenshot projects

---

## 5W1H

- **WHAT**: Pixel-by-pixel comparison of browser screenshots against approved baseline images — catching unintended UI regressions that functional tests completely miss.
- **WHY**: A functional test verifies that a button _exists_ and _clicks_. Visual regression verifies that the button still _looks right_ — correct colour, position, size, text, and spacing. In D365 and enterprise portals, unintended CSS changes routinely break UI without breaking any functional assertion.
- **WHO**: SDETs responsible for UI stability. Particularly valuable when a designer or frontend developer makes a "small CSS change" that breaks the entire CRM's data grid layout.
- **WHEN**: After functional coverage is solid. Don't add visual tests before the UI is stable — changing UI invalidates screenshots constantly.
- **HOW**: `expect(page).toHaveScreenshot()` with masking for dynamic content, threshold for minor rendering differences, and baseline management strategy.

---

## 1. How Screenshot Comparison Works — The Internals

### The Comparison Flow Visualised

```mermaid
graph TD
    A[Playwright toHaveScreenshot] --> B{Baseline Exists?}
    B -->|No| C[Save as New Baseline]
    B -->|Yes| D[Take New Screenshot]
    D --> E[Run Pixelmatch Algorithm]
    E --> F{Pixels Differ > Threshold?}
    F -->|Yes| G[Test FAILS]
    G --> H[Generate Diff Image Red Highlights]
    F -->|No| I[Test PASSES]
```

### The Pixelmatch Algorithm — What Actually Happens

Playwright uses the [pixelmatch](https://github.com/mapbox/pixelmatch) library for comparison. Understanding the algorithm prevents confusion about thresholds:

```
For each pixel at (x, y):
  1. Get RGB values from baseline: (r1, g1, b1)
  2. Get RGB values from new screenshot: (r2, g2, b2)
  3. Convert both to YIQ color space (perceptual color model)
     YIQ weights: Y = 0.299R + 0.587G + 0.114B (human eye sensitivity)
  4. Calculate YIQ delta: abs(Y1 - Y2)
  5. If YIQ delta > threshold (e.g., 0.1):
     → pixel is counted as DIFFERENT
     → diff image shows this pixel in red
  6. Total diffPixels / totalPixels = diffPixelRatio

maxDiffPixelRatio:  0.002 = 0.2% pixels allowed to differ
threshold:          0.1   = color distance per pixel (0 = exact, 1 = anything)
maxDiffPixels:      500   = absolute pixel count alternative

Playwright fails the test if EITHER limit is exceeded.
```

**Why YIQ instead of RGB delta?**
Human vision is most sensitive to brightness (Y channel) and less sensitive to color (I, Q channels). Two pixels that are both "dark blue" might differ significantly in RGB space but look identical to humans. YIQ prevents false failures from sub-pixel rendering differences.

```typescript
// The full threshold parameter set:
await expect(page).toHaveScreenshot("form.png", {
  // Pixel ratio threshold (fraction of total pixels)
  maxDiffPixelRatio: 0.002, // 0.2% of pixels can differ

  // Absolute pixel count threshold (alternative — use ONE of these two)
  // maxDiffPixels: 50,            // max 50 different pixels

  // Per-pixel color sensitivity (0 = exact match, 1 = any color counts as match)
  threshold: 0.1, // 10% brightness difference per pixel

  // Scale factor (for high-DPI/Retina displays)
  // scale: 'css',                 // compare at CSS pixel size (default)
  // scale: 'device',              // compare at device pixel size (2x on Retina)

  // Animation handling
  animations: "disabled", // freeze CSS animations before capture

  // Caret handling (text cursor blinking)
  caret: "hide", // hide text cursor (default)
  // caret: 'initial',             // don't modify caret

  // Style tag injected before screenshot (for custom overrides)
  style: `
    * { animation: none !important; transition: none !important; }
    .dynamic-timestamp { visibility: hidden !important; }
  `,
});
```

---

## 2. The Basic `toHaveScreenshot()` Call

```typescript
// tests/specs/visual/citation-form.visual.spec.ts

import { test, expect } from "../../fixtures";
import { CitationDetailPage } from "../../pages/CitationDetailPage";

test.describe("Visual regression @visual @citations", () => {
  test("Citation detail form layout is correct", async ({
    page,
    testCitation,
  }) => {
    const citationDetail = new CitationDetailPage(page);

    // Navigate to the citation
    await citationDetail.goto(testCitation.citationId);

    // Wait for the page to be fully stable BEFORE screenshotting
    // D365: wait for spinners and OData to complete
    await expect(page.locator(".ms-Spinner")).toHaveCount(0, {
      timeout: 45_000,
    });
    await expect(citationDetail.citationIdField).toHaveText(
      testCitation.citationId,
      { timeout: 30_000 },
    );

    // Take the screenshot and compare to baseline
    await expect(page).toHaveScreenshot("citation-detail-form.png", {
      // Allow up to 0.2% pixel difference (for anti-aliasing, font rendering)
      maxDiffPixelRatio: 0.002,
    });
  });
});
```

**Where is `citation-detail-form.png` stored?**

Playwright creates a `__screenshots__` directory next to your spec file:

```
tests/specs/visual/
├── citation-form.visual.spec.ts
└── citation-form.visual.spec.ts-snapshots/
    ├── citation-detail-form-chromium-linux.png   ← CI baseline (Linux + Chromium)
    ├── citation-detail-form-chromium-darwin.png  ← macOS baseline
    └── citation-detail-form-chromium-win32.png   ← Windows baseline
```

**Why separate baselines per OS?** Font rendering differs between Linux, macOS, and Windows. A snapshot taken on Windows will always fail on Linux if you use the same file.

**Convention:** Use Linux baselines as the CI standard. Generate and update baselines on Linux (or a Linux Docker container) to match CI.

---

## 3. Masking Dynamic Content — The Critical Skill

The biggest challenge in enterprise visual testing: **dynamic content that changes every run**.

```typescript
// D365 Citation Detail — things that CHANGE every run:
// - createdAt timestamp: "05/28/2026 09:13:22"
// - modifiedAt timestamp: "05/28/2026 09:13:45"
// - User avatar / profile picture (might differ per test account)
// - Loading spinners (must wait for them to hide)
// - Breadcrumb with session-specific paths
// - Any auto-generated reference numbers

await expect(page).toHaveScreenshot("citation-detail.png", {
  maxDiffPixelRatio: 0.002,

  // Mask dynamic areas — they're replaced with a solid block in the diff
  mask: [
    // Timestamp fields
    page.locator('[data-automation-key="createdon"]'),
    page.locator('[data-automation-key="modifiedon"]'),

    // User-specific content
    page.locator(".ms-Persona-imageArea"), // profile pictures
    page.locator(".ms-BreadcrumbItem"), // breadcrumb (session-specific)

    // Any auto-generated IDs that change per run
    page.locator('[data-automation-key="ticketnumber"]'),
  ],

  // Color of the mask (default: magenta — visible in diff image)
  maskColor: "#FF00FF",
});
```

### Masking a Specific Region (Without a Locator)

```typescript
// When a dynamic element doesn't have a good selector, mask by position
await expect(page).toHaveScreenshot("dashboard.png", {
  clip: {
    // Screenshot only this portion (excludes the dynamic header)
    x: 0,
    y: 120, // skip the top 120px (header with timestamps/user info)
    width: 1920,
    height: 900,
  },
});
```

### Advanced Mask Strategy — Hide via CSS Injection

When you have many dynamic elements that are hard to locate:

```typescript
// Inject CSS to hide all dynamic content before screenshotting
await page.addStyleTag({
  content: `
    /* Hide all timestamps */
    [data-automation-key="createdon"],
    [data-automation-key="modifiedon"],
    [data-automation-key="overriddencreatedon"] {
      visibility: hidden !important;
    }

    /* Hide user-specific content */
    .ms-Persona-imageArea,
    .ms-Persona-initials {
      filter: blur(10px) !important;
    }

    /* Stabilize any pulsing/animated elements */
    .ms-Spinner,
    [class*="shimmer"],
    [class*="skeleton"] {
      animation: none !important;
      background: #e1e1e1 !important;
    }
  `,
});

await expect(page).toHaveScreenshot("form-stable.png", {
  animations: "disabled",
  maxDiffPixelRatio: 0.001, // tighter threshold when we control the content
});
```

---

## 4. Component-Level Screenshots (Safer Than Full-Page)

Instead of screenshotting the full page (which catches irrelevant changes), screenshot specific components:

```typescript
test("Search results grid layout", async ({
  page,
  citationsClient,
  account,
}) => {
  // Setup: create a known citation so the grid has consistent data
  await citationsClient.create(
    PayloadsCitation.pending({ customerId: account.userId }),
  );

  await masterSearch.goto();
  await masterSearch.searchPanel.searchByUser(account.userId);
  await masterSearch.resultsGrid.waitForResults();

  // Screenshot ONLY the results grid, not the entire page
  const gridLocator = page.locator(".ms-DetailsList");
  await expect(gridLocator).toHaveScreenshot("search-results-grid.png", {
    maxDiffPixelRatio: 0.001,
    mask: [
      gridLocator.locator('[data-automation-key="createdon"]'),
      gridLocator.locator('[data-automation-key="ticketnumber"]'),
    ],
  });
});

test("Citation status badge - PENDING", async ({ page, testCitation }) => {
  await citationDetail.goto(testCitation.citationId);

  // Only the status badge — tiny, stable, meaningful
  const badge = page.locator(".citation-status-badge");
  await expect(badge).toBeVisible();
  await expect(badge).toHaveScreenshot("status-badge-pending.png");
});
```

### What to Screenshot at Component Level

```typescript
// ✅ Good component targets — isolated, meaningful, stable:
await expect(page.locator(".status-badge")).toHaveScreenshot(
  "status-pending.png",
);
await expect(page.locator(".payment-summary-card")).toHaveScreenshot(
  "payment-summary.png",
);
await expect(page.locator(".error-notification")).toHaveScreenshot(
  "error-state.png",
);
await expect(page.locator(".ms-DetailsList")).toHaveScreenshot("data-grid.png");
await expect(
  page.locator('nav[aria-label="Main navigation"]'),
).toHaveScreenshot("nav.png");

// ❌ Bad targets — too large, too many dynamic parts:
await expect(page).toHaveScreenshot("full-page.png"); // catches everything including irrelevant
await expect(page.locator("body")).toHaveScreenshot("body.png"); // same problem
```

---

## 5. Threshold Configuration in `playwright.config.ts`

```typescript
export default defineConfig({
  // ...
  expect: {
    toHaveScreenshot: {
      // Global defaults — override per-test as needed
      maxDiffPixelRatio: 0.002, // 0.2% pixel difference allowed globally
      threshold: 0.2, // Per-pixel colour difference threshold (0-1)
      animations: "disabled", // Disable CSS animations before screenshotting (key!)
    },
  },
  // ...
});
```

**Why `animations: 'disabled'`?** CSS animations (fade-ins, slide-ins, spinners) make screenshots non-deterministic. Playwright freezes all CSS animations before capturing when this is set.

### Threshold Tuning Guide

```
maxDiffPixelRatio: 0.0001  → Extremely strict (exact match minus 0.01%)
                             Use for: tiny status badges, icon-only components
                             Risk: flaky on any font rendering difference

maxDiffPixelRatio: 0.002   → Standard enterprise threshold (0.2%)
                             Use for: most form components, data grids
                             Covers: sub-pixel anti-aliasing, minor font hinting

maxDiffPixelRatio: 0.01    → Loose (1% difference allowed)
                             Use for: complex pages with many text elements
                             Risk: might miss real regressions in text-heavy areas

threshold: 0.1             → 10% color distance per pixel
                             Good balance: catches real color changes, ignores sub-pixel noise

threshold: 0.3             → Very loose per-pixel comparison
                             Use for: pages with gradients, shadow effects
                             Risk: might miss subtle color changes
```

---

## 6. D365-Specific Visual Testing Challenges

D365's Fluent UI has several visual testing pitfalls:

```typescript
// Challenge 1: Command Bar is user-role-dependent
// Different roles see different buttons → screenshot differs per account
// Solution: mask the entire command bar
await expect(page).toHaveScreenshot("d365-form.png", {
  mask: [
    page.locator(".ms-CommandBar"), // entire command bar
    page.locator(".ms-CommandBar-overflowMenu"),
  ],
});

// Challenge 2: Fluent UI Tooltips appear on hover
// Solution: move mouse away from interactive elements before screenshotting
await page.mouse.move(0, 0); // move to top-left corner
await expect(page.getByRole("tooltip")).toHaveCount(0); // wait for the tooltip to hide — a state, not a sleep
await expect(page).toHaveScreenshot("d365-grid.png");

// Challenge 3: Focus rings (accessibility outlines) show when keyboard-navigating
// Solution: ensure mouse is used for navigation (not keyboard) in visual tests
// Or: add CSS to hide focus rings for visual tests
await page.addStyleTag({
  content: "*:focus { outline: none !important; }",
});
// ⚠ Only in visual tests — never in functional tests (breaks accessibility)

// Challenge 4: D365 Two-Phase Render — shell loads, then data loads
// Solution: wait for actual data, not just DOM ready
await expect(
  page.locator('[data-id="citation_status"] .ms-TextField-field'),
).not.toHaveText("", { timeout: 30_000 }); // wait for non-empty field
// THEN screenshot

// Challenge 5: Fluent UI panel animations (slide-in/slide-out)
// Even with animations: 'disabled', Fluent UI uses requestAnimationFrame
// Solution: wait for panel to fully open before screenshotting
await expect(
  page.locator('[data-id="editDialog"][aria-hidden="false"]'),
).toBeVisible({ timeout: 10_000 });
await page.waitForFunction(() => {
  const panel = document.querySelector(".ms-Panel-main");
  if (!panel) return false;
  const transform = window.getComputedStyle(panel).transform;
  return transform === "none" || transform === "matrix(1, 0, 0, 1, 0, 0)";
});
// THEN screenshot
```

---

## 7. Snapshot Naming Strategy

```typescript
// Bad: vague names
await expect(page).toHaveScreenshot("test.png");
await expect(page).toHaveScreenshot("screenshot1.png");

// Good: descriptive, context-specific names
await expect(page).toHaveScreenshot("citation-detail-pending-status.png");
await expect(badge).toHaveScreenshot("status-badge-overdue-warning.png");
await expect(grid).toHaveScreenshot("search-results-3-citations.png");

// Pattern: [component]-[state]-[variant].png
// Examples:
//   payment-form-empty.png
//   payment-form-validation-errors.png
//   payment-form-processing.png
//   payment-form-success.png
//   nav-admin-role.png
//   nav-customer-role.png
//   nav-supervisor-role.png
```

### Viewport Standardization

```typescript
// playwright.config.ts — fix viewport so screenshots are consistent
export default defineConfig({
  use: {
    viewport: { width: 1920, height: 1080 }, // standard enterprise desktop
    // All screenshots taken at this size
  },

  // For responsive testing, create separate projects:
  projects: [
    {
      name: "visual-desktop",
      use: { viewport: { width: 1920, height: 1080 } },
      testMatch: "**/*.visual.spec.ts",
    },
    {
      name: "visual-laptop",
      use: { viewport: { width: 1366, height: 768 } },
      testMatch: "**/*.visual.spec.ts",
    },
  ],
});
```

---

## 8. The Visual Test Fixture — Reusable Stability Helper

```typescript
// fixtures/visual.fixture.ts

import { test as base, expect } from "@playwright/test";
import type { Page, Locator } from "@playwright/test";

interface VisualFixtures {
  /**
   * Takes a stable screenshot of a page or component.
   * Automatically: moves mouse away, waits for spinners, disables animations.
   */
  screenshotStable: (
    target: Page | Locator,
    name: string,
    options?: {
      mask?: Locator[];
      maxDiffPixelRatio?: number;
      readySelector?: string; // wait for this to be visible before screenshotting
    },
  ) => Promise<void>;
}

export const test = base.extend<VisualFixtures>({
  screenshotStable: async ({ page }, use) => {
    const helper = async (
      target: Page | Locator,
      name: string,
      options: {
        mask?: Locator[];
        maxDiffPixelRatio?: number;
        readySelector?: string;
      } = {},
    ): Promise<void> => {
      // 1. Wait for D365 spinners to disappear
      await expect(page.locator(".ms-Spinner")).toHaveCount(0, {
        timeout: 30_000,
      });
      await expect(page.locator('[class*="shimmer"]')).toHaveCount(0, {
        timeout: 15_000,
      });

      // 2. Wait for custom content selector if specified
      if (options.readySelector) {
        await expect(page.locator(options.readySelector)).toBeVisible({
          timeout: 20_000,
        });
      }

      // 3. Move mouse to safe position (avoid hover states and tooltips)
      await page.mouse.move(5, 5); // top-left, out of the way
      await expect(page.getByRole("tooltip")).toHaveCount(0); // wait until the tooltip is gone

      // 4. Inject stability CSS
      await page.addStyleTag({
        content: `
          * { animation: none !important; transition: none !important; }
          .ms-Spinner { display: none !important; }
          [class*="shimmer"] { animation: none !important; background: #f0f0f0 !important; }
        `,
      });

      // 5. Take the screenshot
      await expect(target).toHaveScreenshot(name, {
        animations: "disabled",
        caret: "hide",
        maxDiffPixelRatio: options.maxDiffPixelRatio ?? 0.002,
        mask: options.mask ?? [],
      });
    };

    await use(helper);
  },
});

// Usage in tests:
test("Citation form stable screenshot", async ({
  page,
  screenshotStable,
  testCitation,
}) => {
  await page.goto(`/citations/${testCitation.citationId}`);

  await screenshotStable(
    page.locator(".citation-form"),
    "citation-form-stable.png",
    {
      mask: [
        page.locator('[data-automation-key="createdon"]'),
        page.locator('[data-automation-key="modifiedon"]'),
      ],
      readySelector: '[data-testid="citation-status"]',
    },
  );
});
```

---

## 9. Updating Baselines — The Team Workflow

```bash
# 1. Developer makes a legitimate UI change
# 2. Visual tests fail in CI (expected — baseline is stale)
# 3. SDET reviews the diff images in the Playwright HTML report
# 4. Confirms the change is intentional
# 5. Updates baselines locally:
npx playwright test --update-snapshots --grep "@visual"

# 6. Reviews all updated .png files in git diff
git diff --stat  # shows which baselines changed
# Expected: only the files related to the intentional change

# 7. If more files changed than expected → investigate (something else changed)
# 8. Commits the updated baselines
git add tests/**/*-snapshots/*.png
git commit -m "Visual baselines: update citation form layout (TICKET-1234)"

# 9. CI re-runs → visual tests pass with new baselines
```

**The baseline review step is critical.** Blindly running `--update-snapshots` is the same as disabling the visual tests. Always look at the diff images before accepting.

### The Golden Rule: Baselines Live in Git

```
❌ Bad: .gitignore contains *.png (baselines not tracked)
  → Every CI run generates its own baselines → visual tests never actually compare

✅ Good: *.png files IN the snapshot directories are committed
❌ Bad: ALL *.png files committed (test artifacts too)

# .gitignore — include snapshots, exclude test artifacts
test-results/**/*.png    ← IGNORE (generated diff images)
playwright-report/**     ← IGNORE (HTML report)
# DO NOT IGNORE tests/**/*-snapshots/*.png ← these are the baselines
```

---

## 10. CI Integration — Linux-Only Baselines

```yaml
# .github/workflows/playwright.yml (visual tests section)

visual-tests:
  runs-on: ubuntu-latest # ← MUST match the OS used to generate baselines
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: "20"
        cache: "npm"
    - run: npm ci
    - run: npx playwright install chromium --with-deps

    - name: Run visual regression tests
      run: npx playwright test --grep "@visual" --reporter=html
      env:
        CI: true

    - name: Upload visual diff report (always — check failures)
      uses: actions/upload-artifact@v4
      if: always()
      with:
        name: visual-regression-report
        path: |
          playwright-report/
          test-results/          # ← contains the diff .png files
        retention-days: 30
```

### Generating Linux Baselines from Windows (the Docker approach)

```bash
# When your team uses Windows locally but CI is Linux:
# Run baseline generation in a Docker container matching CI

docker run --rm \
  -v "$(pwd):/work" \
  -w /work \
  mcr.microsoft.com/playwright:v1.44.0-jammy \
  npx playwright test --update-snapshots --grep "@visual"

# Now the baselines in tests/**/*-snapshots/ are Linux-generated
# Commit these and CI will pass
```

---

## 11. Real-World War Story: The CSS Variable Incident

**Situation**: A designer changes `--primary-color: #0078d4` to `--primary-color: #0079d3` — a 1-digit hex difference. 40 visual tests fail in CI. The designer insists "it's the same blue."

**The diagnosis**:

```
pixelmatch found 2,847 pixels different in citation-detail-form.png
YIQ delta: 0.12 (above 0.1 threshold)
Affected area: all primary buttons, command bar, highlighted rows
```

**Why it matters**: The change was intentional for the new brand style guide. But it affected 40 baseline images — which means 40 forms, 40 grids, 40 buttons.

**The lesson**:

```typescript
// ✅ Isolate color from layout — screenshot components separately
// If color changes, only badge/button screenshots need updating
// Layout screenshots (grid structure, form layout) are unaffected

// Instead of: one full-page screenshot that includes both layout AND color
// Use:
await expect(page.locator(".citation-form-layout")).toHaveScreenshot(
  "form-layout.png",
);
// → Tests layout positioning (column widths, row heights, spacing)

await expect(page.locator(".status-badge")).toHaveScreenshot(
  "status-badge-color.png",
);
// → Tests color appearance

// When CSS variable changes → only color screenshots need updating
// Layout screenshots stay the same → fewer false positives
```

---

## 12. Visual Tests vs Functional Tests — When to Use Each

```
FUNCTIONAL TEST:                          VISUAL REGRESSION TEST:
"The Save button exists"                  "The Save button is 32px tall, blue,
"Clicking Save shows success message"      in the top-right corner of the form"
"The status field says PENDING"           "The PENDING status badge has the
                                           correct yellow color and padding"

USE FUNCTIONAL TESTS FOR:                USE VISUAL TESTS FOR:
- Business logic verification            - Layout regression (spacing breaks)
- API response validation                - Color/brand changes
- Data correctness                       - CSS regression from framework updates
- User workflow testing                  - Component visual states (hover, focus, disabled)
- Error handling                         - Responsive breakpoints
- Permissions/access control             - Print stylesheet verification
                                         - Dark mode vs light mode
```

**The 80/20 rule for visual tests:**

- 80% of your testing budget: functional tests
- 20%: visual regression on critical, stable UI components (navigation, forms, status badges, data grids)
- 0%: visual tests on unstable, frequently-changing UI

---

## 13. Canvas and WebGL — When There's No DOM to Screenshot

Every technique so far assumes a `data-automation-key`, a CSS class, or *some* DOM node to build a locator from. A `<canvas>` element (charts, drawing tools, generated thumbnails, WebGL visualizations) breaks that assumption completely: everything inside it is pixels the browser painted from JavaScript draw calls — there is no accessibility tree, no child elements, nothing for `page.locator()` to find. `page.getByRole('button', { name: 'Pending' })` cannot locate a pie-chart slice, because as far as the DOM is concerned, the slice doesn't exist — only the single `<canvas>` element does.

### 13.1 The Two Real Techniques — Verified Against How Canvas Actually Works

**Spatial clicking** — since there's no element to target, you target a *coordinate* within the canvas element's own bounding box instead:

```typescript
test('clicking a pie chart slice by computed coordinate selects it', async ({ page }) => {
  await page.goto('/dashboard/citation-status-chart');
  const chart = page.locator('canvas#status-pie-chart');
  await expect(chart).toBeVisible();

  // No DOM node exists for "the PENDING slice" — click at a coordinate
  // computed relative to the canvas's own bounding box instead.
  await chart.click({ position: { x: 120, y: 80 } });

  await expect(page.locator('[data-testid="selected-slice-label"]')).toHaveText('PENDING');
});
```

`{ position: { x, y } }` is a real `locator.click()` option — coordinates are measured from the element's own top-left corner, not the page's, so the click stays correct even if the chart moves due to a layout change elsewhere on the page. The coordinates themselves have to come from somewhere real: read them off the charting library's own data (most chart libraries expose the computed slice angles/coordinates in JS, which you can pull via `page.evaluate()`), or compute them from the chart's known dimensions and data proportions — never eyeball pixel numbers from a screenshot, because they'll silently drift the next time the data changes.

**Pixel-level assertion** — reading the canvas's actual backing-store pixels, verified against the real Canvas 2D API:

```typescript
test('selected pie slice renders with the highlight color', async ({ page }) => {
  await page.goto('/dashboard/citation-status-chart');
  const chart = page.locator('canvas#status-pie-chart');
  await chart.click({ position: { x: 120, y: 80 } });

  const pixel = await page.evaluate(({ x, y }) => {
    const canvas = document.querySelector<HTMLCanvasElement>('#status-pie-chart')!;
    const ctx = canvas.getContext('2d')!;
    const data = ctx.getImageData(x, y, 1, 1).data; // [r, g, b, a] for that one pixel
    return { r: data[0], g: data[1], b: data[2], a: data[3] };
  }, { x: 120, y: 80 });

  expect(pixel.r, 'Selected slice should render in the highlight orange, not the default blue').toBeGreaterThan(200);
  expect(pixel.b).toBeLessThan(100);
});
```

`getImageData(x, y, 1, 1)` reads a single pixel directly from the canvas's memory — no screenshot file, no pixelmatch, just the literal RGBA bytes the GPU/software renderer produced. This is the right tool for *"is this one known point the color I expect"* — a targeted assertion, not a full-image comparison.

**The real gotcha, worth knowing before it surprises you in CI**: if the canvas ever draws an image loaded from a different origin without that origin's CORS headers permitting it, the canvas becomes **tainted**, and `getImageData()` throws a `SecurityError` — Playwright does not and cannot bypass this, because it's a browser security boundary, not a Playwright limitation. A pixel-assertion test that works fine against a canvas drawing only same-origin, JS-generated shapes can start throwing the moment someone adds a cross-origin avatar image or map tile to the same canvas. If you hit this, the fix is on the application side (serve the image with proper CORS headers, or set `crossOrigin="anonymous"` on the source `<img>`), not the test.

### 13.2 `toHaveScreenshot()` Already Works on Canvas — No New API Needed

The one thing that *doesn't* need a new technique: this chapter's own §1 pixelmatch machinery applies to a canvas locator exactly as-is, because `toHaveScreenshot()` captures whatever pixels are rendered in an element's bounding box — it has no idea, and no need to know, whether those pixels came from DOM+CSS or from canvas draw calls:

```typescript
test('overall chart layout matches the approved baseline', async ({ page }) => {
  await page.goto('/dashboard/citation-status-chart');
  const chart = page.locator('canvas#status-pie-chart');
  await expect(chart).toBeVisible();
  await expect(chart).toHaveScreenshot('citation-status-pie-chart.png', {
    maxDiffPixelRatio: 0.002, // same threshold reasoning as §5 — nothing canvas-specific here
  });
});
```

**Choosing between the three**: `toHaveScreenshot()` on the canvas answers *"did the overall rendering change at all"* — the right default for catching an unintended visual regression in a chart nobody touched on purpose. `getImageData()` on a specific coordinate answers a narrower, more targeted *"is this one known data point the right color"* — useful when you want a fast, file-free assertion tied to actual application state (a slice being selected) rather than a full pixel-diff. Spatial `click({ position })` is how you interact with canvas content at all, full stop — there's no alternative, because there's nothing else to click.

---

## 🏋️ Practice Challenges

### Challenge 1 [MCQ] — Why Separate OS Baselines?

Why does Playwright store separate screenshots per OS (e.g., `screenshot-chromium-linux.png`, `screenshot-chromium-win32.png`)?

- A) Each OS has different screen resolutions
- B) Font rendering, sub-pixel anti-aliasing, and default system font metrics differ between Linux, macOS, and Windows — the same page looks subtly different
- C) Playwright uses different Chromium versions per OS
- D) CI runs on Linux; local runs on Windows — tests would always fail

<details><summary>Answer</summary>

**B** — OS-level font rendering is different. Linux uses FreeType, macOS uses CoreText, Windows uses DirectWrite. Even with the same font file, the rendered pixels differ slightly — enough to fail a pixel-perfect comparison. Playwright solves this by maintaining separate baseline files per OS. In practice, use Linux as the CI baseline standard and run `--update-snapshots` on Linux (or Docker) to generate/update baselines.

</details>

---

### Challenge 2 [MCQ] — Animations Flag

Your visual tests are failing intermittently because a CSS slide-in animation sometimes captures mid-animation. Which TWO approaches fix this correctly?

- A) Add `await page.waitForTimeout(2000)` before every screenshot
- B) Set `animations: 'disabled'` in playwright.config.ts `toHaveScreenshot` defaults
- C) Use `page.addStyleTag({ content: '* { animation-duration: 0s !important; }' })`
- D) Screenshot a component instead of the full page
- E) Increase `maxDiffPixelRatio` to 0.05

<details><summary>Answer</summary>

**B and C** are correct.

**B** — `animations: 'disabled'` tells Playwright to freeze CSS animations before capturing. This is the official solution and should be in your global config.

**C** — Injecting `animation-duration: 0s` via CSS is a belt-and-suspenders approach that works for animations Playwright's built-in freezing might miss (e.g., animations triggered by JavaScript, not CSS transitions).

**A** is the anti-pattern (waitForTimeout is never the answer — the typings say it "should only be used for debugging"). **D** helps with scope but doesn't fix the animation problem. **E** loosens the threshold but masks the real problem.

</details>

---

### Challenge 3 [Write It Yourself]

Write a `screenshotComponent` helper that:

1. Waits for a locator to be stable (no animation, no layout shift)
2. Moves the mouse away (avoids hover states)
3. Takes a component-level screenshot with dynamic elements masked

<details><summary>Answer</summary>

```typescript
// utils/visual.utils.ts

import { type Locator, type Page, expect } from "@playwright/test";

interface ScreenshotOptions {
  name: string;
  maskLocators?: Locator[];
  maxDiffPixelRatio?: number;
}

export async function screenshotComponent(
  page: Page,
  component: Locator,
  options: ScreenshotOptions,
): Promise<void> {
  // 1. Ensure the component is visible and stable
  await expect(component).toBeVisible({ timeout: 15_000 });

  // 2. Wait for D365 spinners to settle
  await expect(page.locator(".ms-Spinner")).toHaveCount(0, { timeout: 15_000 });

  // 3. Move mouse away to avoid hover states and tooltips
  await page.mouse.move(0, 0);
  await expect(page.getByRole("tooltip")).toHaveCount(0); // wait until the tooltip is gone (no fixed sleep)

  // 4. Inject animation-killer CSS
  await page.addStyleTag({
    content: `* { animation: none !important; transition: none !important; }`,
  });

  // 5. Take the screenshot
  await expect(component).toHaveScreenshot(options.name, {
    maxDiffPixelRatio: options.maxDiffPixelRatio ?? 0.002,
    mask: options.maskLocators ?? [],
    animations: "disabled",
    caret: "hide",
  });
}

// Usage:
await screenshotComponent(page, page.locator(".citation-form"), {
  name: "citation-form.png",
  maskLocators: [
    page.locator('[data-automation-key="createdon"]'),
    page.locator(".ms-Persona-imageArea"),
  ],
});
```

</details>

---

### Challenge 4 [Spot the Bug]

What is wrong with this visual test?

```typescript
test("Citation status badge", async ({ page }) => {
  await page.goto("/citations/CIT-001");
  await expect(page.locator(".status-badge")).toHaveScreenshot("badge.png");
});
```

<details><summary>Answer — 4 issues</summary>

**Issue 1: Hardcoded citation ID**
`CIT-001` must exist in the test environment. If it doesn't, the test fails. If another test modified it, the visual state is wrong. Fix: use a fixture that creates a citation with a known status.

**Issue 2: No wait for page stability**
The screenshot is taken immediately after `goto()`. In D365, the page does a two-phase render — the status badge might be empty when the screenshot fires. Fix: `await expect(page.locator('.status-badge')).not.toHaveText('', { timeout: 30_000 })` before screenshotting.

**Issue 3: No spinner wait**
D365 Fluent UI shows `.ms-Spinner` during data loading. If it's visible when the screenshot fires, the baseline will include it. Fix: `await expect(page.locator('.ms-Spinner')).toHaveCount(0)`.

**Issue 4: No animation handling**
If the badge has a fade-in animation, the screenshot might capture it mid-animation. Fix: add `animations: 'disabled'` or inject `* { animation: none !important; }`.

**Fixed version:**

```typescript
test("Citation status badge shows PENDING correctly", async ({
  page,
  citationsClient,
  account,
}) => {
  const citation = await citationsClient.create(
    PayloadsCitation.pending({ customerId: account.userId }),
  );
  await page.goto(`/citations/${citation.citationId}`);

  await expect(page.locator(".ms-Spinner")).toHaveCount(0, { timeout: 30_000 });
  await expect(page.locator(".status-badge")).not.toHaveText("", {
    timeout: 20_000,
  });
  await page.mouse.move(0, 0);

  await expect(page.locator(".status-badge")).toHaveScreenshot(
    "status-badge-pending.png",
    {
      animations: "disabled",
      maxDiffPixelRatio: 0.001,
    },
  );
});
```

</details>

---

### Challenge 5 [MCQ] — Screenshot Baseline Update Strategy

Your team ships a UI redesign that changes the primary color scheme (blue to green) across 47 components. 312 visual regression tests fail with pixel differences. How should you handle the baseline updates?

- A) Delete all `.png` baselines and re-run tests — they will auto-regenerate
- B) Run `npx playwright test --update-snapshots` on the CI machine that generates the official baselines, review the diff report, get design approval on the changes, then commit the new baselines
- C) Manually inspect each of the 312 screenshots and approve individually
- D) Increase the pixel threshold to 20% to ignore the color changes

<details><summary>Answer</summary>

**B** — The correct process has four required steps:

**Step 1 — Use the official CI environment to regenerate**: Run `--update-snapshots` on the same OS and browser version that the CI pipeline uses. Baselines generated on Windows Chrome 120 will produce false positives when compared on Linux Chrome 120 due to sub-pixel rendering differences. The baseline must be generated in the canonical environment.

**Step 2 — Review the diff report**: Playwright's HTML report shows side-by-side before/after for every changed screenshot. The SDET lead reviews: are ALL 312 changes expected (color only), or did some test catch an unintended layout regression?

**Step 3 — Design team approval**: Visual regression baselines are design artifacts. The design team signs off that the new screenshots match the intended redesign. This step is often skipped and causes "approved" screenshots to contain bugs.

**Step 4 — Commit as a separate PR**: The baseline update PR is separate from the feature PR. Code reviewers can diff the PNG files (GitHub renders visual diffs for images). This gives full audit trail: who approved which visual change and when.

Option A skips review entirely — you'll auto-approve regressions you didn't intend. Option D is the worst choice: a 20% threshold would pass a button that's the wrong size, not just the wrong color.

</details>

---

**Navigation**: [← Chapter 28: Test Data Lifecycle](../03_Real_World_Scenarios/28_Test_Data_Lifecycle_and_Cleanup.md) | [Index](../00_INDEX.md) | [→ Chapter 30: Database Verification](../03_Real_World_Scenarios/30_Database_Verification_Direct_SQL.md)


---

## Reality Check

**"Visual regression tests detect all UI changes"** → Visual regression compares screenshots pixel-by-pixel. It detects: layout shifts, color changes, missing elements, wrong images. It does NOT detect: functional changes (button looks correct but doesn't work), data changes (wrong text that looks "right" visually in a diff), dynamic content that changes between runs (timestamps, user IDs, ads — these create false positives). Filter dynamic content: `mask: [page.locator('.timestamp')]` in Playwright tells the screenshotter to ignore that region.

**"A 0% pixel difference means the UI is unchanged"** → On CI machines: font rendering varies by OS (Linux vs Mac vs Windows), anti-aliasing differs, browser subpixel rendering varies. A test that passes locally (Mac) may fail on CI (Linux) with 0.5% pixel differences due to font rendering alone. Use `threshold: 0.2` (allow 20% of pixels to differ by up to 20% brightness) for cross-OS stability, or run all visual regression tests in Docker (consistent renderer). Store baseline screenshots from the CI environment, not from local development.

**"Updating baselines is always safe"** → `npx playwright test --update-snapshots` regenerates all baseline images. If you run this blindly, you accept all current visual regressions as the new baseline — including bugs that visual regression was supposed to catch. Update baselines with intent: look at ALL changed images, verify they represent intentional design changes, not regressions. Some teams require baseline updates to be reviewed in PRs like any other code change (the .png files are committed to version control).

**"Visual testing replaces functional assertions"** → Visual testing and functional assertions test different things. Functional: `expect(page.locator('[data-testid="order-total"]')).toHaveText('$45.00')` — the price is correct. Visual: a screenshot of the order summary — the layout is correct. A bug where the price is wrong but the layout is correct: functional assertion catches it, visual does not. A bug where the price column shifts 10px: visual catches it, functional does not. Both are necessary for different failure modes.

**"Percy/Chromatic are better than Playwright's built-in screenshot comparison"** → Playwright's built-in: `expect(page).toHaveScreenshot()` — stores baselines in your repo, pixel comparison, runs in your CI. Percy/Chromatic: cloud-based baseline storage, perceptual diff (smarter than pixel diff — accounts for anti-aliasing), cross-browser comparison from one snapshot upload, review workflows (approve/reject in UI). The trade-off: built-in is free, offline, simple; Percy/Chromatic costs money but has better diff tooling and cross-browser without running multiple browser tests. For large design systems with many components: Percy/Chromatic pay for themselves in review time saved.
