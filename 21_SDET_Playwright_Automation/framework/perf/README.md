# Performance Testing Module

Provides Core Web Vitals (CWV) measurement and budget enforcement for the Playwright framework.

## Overview

This module measures page load performance using the browser's Performance API, specifically tracking:

- **FCP** (First Contentful Paint) - When the first content is rendered
- **LCP** (Largest Contentful Paint) - When the largest content element is visible
- **TTFB** (Time To First Byte) - Server response time

## Configuration

Edit `perf/budgets.ts` to define acceptable thresholds for different pages:

```typescript
export const PERF_BUDGETS = {
  orangehrm: {
    loginLoad: { maxFCP: 2000, maxLCP: 3000 },
    dashboardLoad: { maxFCP: 2500, maxLCP: 4000 },
  },
};
```

## Usage

### Measuring Page Load

```typescript
import { measurePageLoad, assertWithinBudget } from '../../perf/helpers';
import { PERF_BUDGETS } from '../../perf/budgets';

test('page performance', async ({ page }) => {
  await page.goto('/some-page');
  const metrics = await measurePageLoad(page);
  assertWithinBudget(metrics, PERF_BUDGETS.orangehrm.loginLoad);
});
```

### Individual Metric Assertions

```typescript
test('FCP is fast', async ({ page }) => {
  await page.goto('/some-page');
  const metrics = await measurePageLoad(page);
  expect(metrics.fcp).toBeLessThan(2000);
});
```

## Test Tags

Use `@perf` tag to run only performance tests:

```bash
npx playwright test --grep @perf
```

## Performance Budgets

| Metric | What it measures | Why it matters |
|--------|------------------|----------------|
| FCP | Time to first content render | Perceived load speed |
| LCP | Time to largest content render | Perceived load completion |
| TTFB | Server response time | Backend performance |

## CI Integration

Performance metrics are logged to console during test runs. For CI dashboards, parse the console output:

```
Login page metrics: FCP=1234ms, LCP=2345ms, TTFB=100ms
```

## Notes

- Performance metrics can vary based on network conditions, system load, and browser state
- For consistent CI results, consider using Playwright's `--project=chromium` with dedicated CI agents
- TTFB measurement uses `performance.getEntriesByType('navigation')` which may not be available in all contexts