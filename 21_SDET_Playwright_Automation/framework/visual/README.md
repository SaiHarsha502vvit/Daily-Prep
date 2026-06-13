# Visual Regression Testing Module

Provides screenshot-based visual regression testing capabilities for the Playwright framework.

## Overview

This module ensures UI consistency by capturing screenshots and comparing them against baselines using Playwright's built-in `toHaveScreenshot` assertion with configurable thresholds.

## Configuration

Edit `visual/config.ts` to adjust:

- `threshold` - Maximum pixel ratio difference allowed (0.0 - 1.0)
- `maxDiffPixels` - Absolute pixel count threshold
- `maskRegions` - CSS selectors for elements to hide before screenshots

## Usage

### Masking Dynamic Elements

```typescript
import { maskDynamicElements } from '../../visual/helpers';

test('my visual test', async ({ page }) => {
  await page.goto('/some-page');
  await maskDynamicElements(page);
  // Now take screenshot...
});
```

### Screenshot Comparison

```typescript
import { test, expect } from '@playwright/test';
import { maskDynamicElements } from '../../visual/helpers';

test('@visual login page', async ({ page }) => {
  await page.goto('/web/index.php/auth/login');
  await maskDynamicElements(page);
  await expect(page).toHaveScreenshot('login-page.png', { maxDiffPixels: 100 });
});
```

## Test Tags

Use `@visual` tag to run only visual regression tests:

```bash
npx playwright test --grep @visual
```

## Screenshot Storage

Baseline screenshots are stored in `tests/visual/__snapshots__/`. On first run, these are created as baselines. Subsequent runs compare against them.

To update baselines (after intentional UI changes):

```bash
npx playwright test --grep @visual --update-snapshots
```

## Masking Dynamic Content

The `maskDynamicElements` helper hides elements matching selectors in `VISUAL_CONFIG.maskRegions`:

- `.timestamp` - Dynamic timestamps
- `.date` - Date displays
- `[data-visual-mask]` - Custom masked elements

Add custom selectors to `config.ts` as needed for your application.