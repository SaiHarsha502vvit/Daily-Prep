# Performance Testing

> Specialised reference for performance assertions inside Playwright — Lighthouse CI, k6 load testing, Core Web Vitals, Navigation Timing API, and how to bake performance budgets into the test pipeline. The reference covers timing as a CORRECTNESS concern; this covers timing as a QUALITY concern.

---

## Table of contents

1. [What performance testing in Playwright is for](#1-what-its-for)
2. [Core Web Vitals — LCP, INP, CLS](#2-core-web-vitals)
3. [Navigation Timing API](#3-navigation-timing)
4. [The `web-vitals` library](#4-web-vitals-library)
5. [Lighthouse CI integration](#5-lighthouse-ci)
6. [k6 for load](#6-k6)
7. [Performance budgets in CI](#7-budgets)
8. [CPU throttling for realistic measurement](#8-cpu-throttling)
9. [Network throttling for realistic measurement](#9-network-throttling)
10. [The "first-time visitor" measurement problem](#10-first-time-visitor)
11. [Cumulative measurements over time](#11-cumulative)
12. [Anti-patterns](#12-anti-patterns)

---

## 1. What it's for

Performance testing in Playwright catches:

| Bug class | Caught? |
|---|---|
| Page load >3s | Yes |
| LCP regression | Yes |
| INP regression | Yes |
| CLS regression | Yes |
| Memory leaks (long sessions) | Partial — need Chrome DevTools API |
| Bundle size growth | Indirect (via timings) |
| Render-blocking resource added | Yes |
| Server-side latency | Yes (Navigation Timing) |
| Database N+1 from UI | Indirect |

Performance testing in Playwright does NOT:
- Replace dedicated load testing (k6, Gatling).
- Replace synthetic monitoring (Checkly, Datadog Synthetics).
- Replace RUM (real user monitoring).

Use Playwright for SYNTHETIC perf budgets in PR/CI. Use real tools for production monitoring.

---

## 2. Core Web Vitals

The three vitals Google ranks by:

| Vital | Measures | Good | Needs Improvement | Poor |
|---|---|---|---|---|
| **LCP** (Largest Contentful Paint) | Time to render largest above-fold element | <2.5s | 2.5-4.0s | >4.0s |
| **INP** (Interaction to Next Paint) | Responsiveness to user input | <200ms | 200-500ms | >500ms |
| **CLS** (Cumulative Layout Shift) | Visual stability | <0.1 | 0.1-0.25 | >0.25 |

INP replaced FID (First Input Delay) in March 2024 as the responsiveness vital.

### 2.1 Capturing in Playwright

```typescript
test('homepage LCP is under 2.5s', async ({ page }) => {
  await page.goto('/');

  const lcp = await page.evaluate(() => new Promise<number>(resolve => {
    new PerformanceObserver(list => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1] as PerformanceEntry;
      resolve(last.startTime);
    }).observe({ type: 'largest-contentful-paint', buffered: true });
  }));

  expect(lcp).toBeLessThan(2500);
});
```

### 2.2 Why this is fragile

CI is variable. CPU on shared runners is variable. Network is variable. The same page load can be 1.5s one run, 3.5s the next.

Mitigations:
- Run 5 times, take p75.
- Use Lighthouse CI (which does this for you).
- Compare to baseline, not absolute thresholds.

---

## 3. Navigation Timing API

Browser-native API. Returns timings for the entire page load cycle.

```typescript
const timing = await page.evaluate(() => {
  const t = performance.timing;
  return {
    fetchStart: t.fetchStart - t.navigationStart,
    domainLookup: t.domainLookupEnd - t.domainLookupStart,
    tcpConnect: t.connectEnd - t.connectStart,
    request: t.responseStart - t.requestStart,
    response: t.responseEnd - t.responseStart,
    domInteractive: t.domInteractive - t.navigationStart,
    domComplete: t.domComplete - t.navigationStart,
    loadEvent: t.loadEventEnd - t.navigationStart,
  };
});

console.table(timing);
```

### 3.1 What each metric tells you

| Metric | Tells you |
|---|---|
| DNS lookup | DNS performance / caching |
| TCP connect | Network RTT |
| Request | Server processing + TCP send |
| Response | Server send + TCP receive |
| domInteractive | HTML fully parsed |
| domComplete | All blocking resources loaded |
| loadEvent | window.onload fired |

For diagnosing where time goes.

### 3.2 The newer `PerformanceNavigationTiming`

The `performance.timing` is deprecated. Use:

```typescript
const navTiming = await page.evaluate(() => {
  const entry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  return {
    fetchStart: entry.fetchStart,
    domainLookup: entry.domainLookupEnd - entry.domainLookupStart,
    // ... etc.
  };
});
```

Same data, better API.

---

## 4. The `web-vitals` library

Google's library wraps Core Web Vitals measurement.

```bash
npm i -D web-vitals
```

```typescript
import { onCLS, onFID, onLCP, onINP } from 'web-vitals';

// Inject into the page
await page.addInitScript(() => {
  (window as any).__vitals = {};
  // Library injects via script tag separately
});

await page.goto('/');

// Interact with the page to trigger INP
await page.click('button');

// Collect
const vitals = await page.evaluate(() => (window as any).__vitals);
console.log(vitals);
```

In production apps, web-vitals is usually instrumented via the app code, not the test. Tests verify the instrumentation works rather than computing vitals themselves.

---

## 5. Lighthouse CI

Lighthouse runs perf audits as a CI step.

### 5.1 Setup

```bash
npm i -D @lhci/cli
```

```javascript
// lighthouserc.js
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000/'],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
```

### 5.2 CI step

```yaml
- name: Lighthouse CI
  run: |
    npm install -g @lhci/cli
    lhci autorun
```

Outputs:
- Per-run scores.
- Diff vs main branch (with --compare-with-base).
- Public URL for the detailed report.

### 5.3 Integration with Playwright

Lighthouse and Playwright can coexist:

```typescript
test('lighthouse audit', async ({ page }) => {
  const { runLighthouse } = require('playwright-lighthouse');
  await page.goto('/');
  await runLighthouse(page, {
    thresholds: { performance: 90, accessibility: 95 },
  });
});
```

`playwright-lighthouse` runs LH against the already-open Playwright page.

### 5.4 LH vs Playwright assertions

| | Lighthouse CI | Playwright |
|---|---|---|
| Comprehensive scoring | Yes | No |
| Per-vital threshold | Yes | Yes (manually) |
| Visual audit | Yes (sniffer) | No |
| Integration with E2E flow | Standalone | Integrated |
| Best practices coverage | Extensive | None built-in |

Use LH for full audits; Playwright for focused per-page perf assertions.

---

## 6. k6

For LOAD testing — many concurrent users.

```javascript
// load-test.js
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 50 },     // ramp to 50 VUs
    { duration: '5m', target: 50 },     // hold
    { duration: '1m', target: 0 },      // ramp down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500'],   // 95% < 500ms
    'http_req_failed': ['rate<0.01'],     // <1% failed
  },
};

export default function () {
  const res = http.get('https://api.example.com/citations');
  check(res, { 'status was 200': r => r.status === 200 });
}
```

```bash
k6 run load-test.js
```

### 6.1 k6 vs Playwright

| Tool | For |
|---|---|
| k6 | API load — many concurrent requests |
| Playwright | UI / E2E — single user flows |

You can't load test with Playwright (each Playwright "user" requires its own Chromium — far too expensive). k6 sends HTTP directly.

### 6.2 Integrating k6 in CI

```yaml
- name: k6 load test
  uses: grafana/k6-action@v0.3.0
  with:
    filename: load-test.js
```

### 6.3 When to use each

- Functional E2E: Playwright.
- Per-user perf budget: Playwright + LH CI.
- Load testing (1000 concurrent): k6.
- Stress testing: k6 with higher ramps.
- Soak testing (long runs): k6 with `duration: '24h'`.

---

## 7. Budgets

A performance budget is a threshold beyond which builds fail.

### 7.1 Per-PR budget enforcement

```typescript
test('performance budget', async ({ page }) => {
  await page.goto('/');
  
  const lcp = await getLCP(page);
  expect(lcp, `LCP regression: ${lcp}ms (budget: 2500ms)`).toBeLessThan(2500);
});
```

Failure blocks merge.

### 7.2 Soft budgets

```typescript
test('performance soft check', async ({ page }, testInfo) => {
  await page.goto('/');
  const lcp = await getLCP(page);
  
  if (lcp > 2500) {
    testInfo.annotations.push({
      type: 'performance-regression',
      description: `LCP ${lcp}ms exceeds budget`,
    });
  }
});
```

Doesn't fail; surfaces in reports. For triage.

### 7.3 Setting realistic budgets

| Page type | Realistic LCP | Realistic CLS |
|---|---|---|
| Marketing landing | <2.0s | <0.05 |
| SPA dashboard | <2.5s | <0.1 |
| Heavy form / admin | <3.0s | <0.15 |
| Static blog | <1.5s | <0.05 |

Start lenient. Tighten as you optimise.

---

## 8. CPU throttling

CI runs on fast machines; production users on slow ones. To simulate:

```typescript
const client = await page.context().newCDPSession(page);
await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });
// 4× slower CPU

await page.goto('/');
// Measurements now reflect a mid-tier mobile device
```

### 8.1 CPU throttling rates

| Rate | Approximates |
|---|---|
| 1× | Test runner (no throttling) |
| 4× | Mid-tier mobile |
| 6× | Low-end mobile |
| 10× | Very low-end device |

Lighthouse uses 4× by default (matches the "low-end mobile" persona).

---

## 9. Network throttling

```typescript
const client = await page.context().newCDPSession(page);
await client.send('Network.enable');
await client.send('Network.emulateNetworkConditions', {
  offline: false,
  downloadThroughput: (1.5 * 1024 * 1024) / 8,   // 1.5 Mbps
  uploadThroughput: (750 * 1024) / 8,             // 750 Kbps
  latency: 40,                                     // ms RTT
});
```

### 9.1 Common profiles

| Profile | Download | Upload | RTT |
|---|---|---|---|
| Fast 3G | 1.6 Mbps | 750 Kbps | 150ms |
| Slow 3G | 400 Kbps | 400 Kbps | 400ms |
| 4G | 9 Mbps | 9 Mbps | 170ms |
| WiFi | 30 Mbps | 15 Mbps | 2ms |

For "is this loadable on 3G", emulate Slow 3G.

### 9.2 Combined throttling

Real-world is BOTH slow CPU and slow network:

```typescript
await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });
await client.send('Network.emulateNetworkConditions', { /* Slow 3G */ });
```

---

## 10. First-time visitor

A user with a cold cache loads more than a returning user.

### 10.1 Cold cache simulation

```typescript
const ctx = await browser.newContext({
  // No storage state, no cookies, no cache
});
```

Each new context starts cold.

### 10.2 The two-load test

```typescript
test('cold vs warm load', async ({ browser }) => {
  // Cold
  const cold = await browser.newContext();
  const coldPage = await cold.newPage();
  const coldStart = Date.now();
  await coldPage.goto('/');
  await coldPage.waitForLoadState('networkidle');
  const coldDuration = Date.now() - coldStart;
  await cold.close();

  // Warm (reuses HTTP cache via storage)
  // Need actual warmup — load it once, then test
  const warm = await browser.newContext();
  const warmPage = await warm.newPage();
  await warmPage.goto('/');  // warmup
  
  const warmStart = Date.now();
  await warmPage.goto('/');  // measured
  await warmPage.waitForLoadState('networkidle');
  const warmDuration = Date.now() - warmStart;
  await warm.close();

  console.log('Cold:', coldDuration, 'Warm:', warmDuration);
  expect(warmDuration).toBeLessThan(coldDuration);  // sanity
});
```

For production perf budgets: cold load matters most (first impression).

---

## 11. Cumulative

Performance can degrade over time (memory leaks).

### 11.1 Memory growth test

```typescript
test('no memory leak on repeated navigations', async ({ page }) => {
  const client = await page.context().newCDPSession(page);
  await client.send('Performance.enable');

  for (let i = 0; i < 20; i++) {
    await page.goto('/page-a');
    await page.goto('/page-b');
  }

  const metrics = await client.send('Performance.getMetrics');
  const heapSize = metrics.metrics.find(m => m.name === 'JSHeapUsedSize')?.value;
  
  // Memory should NOT grow linearly with navigations
  expect(heapSize).toBeLessThan(100 * 1024 * 1024);  // 100 MB
});
```

Heap growth past a threshold suggests a leak.

### 11.2 The leak triage process

1. Run the test 20 times, plot heap size.
2. If it grows linearly, suspect leak.
3. Use Chrome DevTools heap profiler to identify the source (event listeners not removed, references in closures, etc.).

---

## 12. Anti-patterns

| ❌ | ✅ |
|---|---|
| Single-shot perf test on shared CI | Aggregate over multiple runs |
| Hard-coded "<2000ms" threshold | Baseline-relative comparison |
| Measuring perf with `trace: 'on'` | Trace adds overhead; turn off for perf tests |
| Using Playwright for load testing | Use k6 |
| Network throttling without CPU throttling | Both, for realism |
| Measuring on idle dev machine | CI environment, or controlled |
| LCP threshold of 1.5s for SPA dashboard | Match the page type |
| Ignoring p75/p95 in favour of average | Long tail matters most |
| Performance tests on every PR for every page | Critical paths only |
| Skipping perf tests because flaky | Tighten with median-of-3 or median-of-5 |

---

## Cross-references

- Config (network throttling, etc.): [`../reference/02_config.md`](../reference/02_config.md)
- Mocking for predictable performance: [`../reference/13_mocking.md`](../reference/13_mocking.md)
- CI integration: [`../reference/10_ci_docker.md`](../reference/10_ci_docker.md)
- Accessibility (also a vital): [`./accessibility.md`](./accessibility.md)
