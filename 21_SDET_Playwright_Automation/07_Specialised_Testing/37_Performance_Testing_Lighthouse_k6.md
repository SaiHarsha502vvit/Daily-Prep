# 37. Performance Testing — Core Web Vitals, Lighthouse & Response Time Assertions

**Navigation**: [← Chapter 36: TypeScript Type System](../06_SDET_to_SDE_Bridge/36_TypeScript_Type_System_Mastery.md) | [Index](../00_INDEX.md) | [→ Chapter 38: Contract Testing with Pact](./38_Contract_Testing_Pact.md)

**Open-Source Tools Referenced:**

- **Lighthouse CI** — https://github.com/GoogleChrome/lighthouse-ci (Apache 2.0)
- **@playwright/test** — built-in performance timing APIs
- **k6** — https://github.com/grafana/k6 (AGPL 3.0) — load testing
- **web-vitals** — https://github.com/GoogleChrome/web-vitals (Apache 2.0)
- **playwright-lighthouse** — https://github.com/abhinaba-ghosh/playwright-lighthouse — provides the `playAudit()` helper used in Challenge 5; it drives Lighthouse against an already-open Playwright page over the browser's remote-debugging port

**Online References:**

- https://web.dev/vitals/ — Google's Core Web Vitals explainer
- https://playwright.dev/docs/api/class-tracing — Playwright tracing API
- https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/getting-started.md — LHCI Getting Started

**Cross-references (this repo):**

- [`../../14_Mental_Models/09_Complexity_Intuition.md`](../../14_Mental_Models/09_Complexity_Intuition.md) — O(n) thinking applies to load test design
- [`25_CICD_Integration_GitHub_Azure.md`](../05_Advanced_Topics/25_CICD_Integration_GitHub_Azure.md) — Where to run LHCI in CI pipeline

---

## 5W1H

- **WHAT**: Measuring and asserting on how fast your application loads and responds — not just whether it works, but whether it works _fast enough_ for users.
- **WHY**: A page that takes 8 seconds to load in D365 after a form save might pass all functional tests but fail all users. Google's 2021 Core Web Vitals update made performance a search ranking factor — enterprise portals need to meet **LCP < 2.5s, INP < 200ms, CLS < 0.1**. Without automation, regressions sneak in silently.
  - ⚠️ **The responsiveness metric changed.** Much of the material you'll find online still names **FID (First Input Delay) < 100ms** as the third Core Web Vital. That is out of date: **on 12 March 2024, INP (Interaction to Next Paint) officially replaced FID as a Core Web Vital, and FID was deprecated in the same transition** ([web.dev announcement](https://web.dev/blog/inp-cwv-march-12)). FID lingered in some Google tooling for a six-month grace period before removal. Use INP for any new budget; the distinction matters because they measure different things — FID timed only the *delay before* processing the first interaction, whereas INP measures the *full* duration from interaction to the next rendered frame, across all interactions on the page. A page could score well on FID and badly on INP, which is precisely why the swap happened. §2's `CoreWebVitals` interface below is already correct on this.
- **WHO**: SDETs on teams where performance is part of the Definition of Done. Also: any SDET wanting to work on frontend-heavy apps.
- **WHEN**: After functional coverage is solid (same rule as visual regression). Don't measure performance on an unstable page.
- **HOW**: Three layers — (1) Playwright response time assertions, (2) Navigation Timing API via `page.evaluate()`, (3) Lighthouse CI for full audit.

---

## 1. Layer 1 — API Response Time Assertions (Playwright Built-in)

The simplest performance assertion: measure how long an API call takes.

```typescript
// tests/specs/performance/api-response-time.spec.ts

test("Citation API responds within SLA", async ({ request, account }) => {
  // Measure: start timer → call → stop timer
  const start = Date.now();
  const response = await request.get(
    `${process.env.API_BASE_URL}/api/v2/citations/CIT-001`,
    { headers: HeadersCrm.bearer(account.accessToken) },
  );
  const duration = Date.now() - start;

  // Assert correctness
  expect(response.status()).toBe(200);

  // Assert performance — SLA from your API contract
  expect(duration, `GET /citations response time exceeded SLA`).toBeLessThan(
    500,
  ); // 500ms SLA

  // Report for visibility (even when passing)
  console.log(`[Perf] GET /citations: ${duration}ms (SLA: 500ms)`);
});

// Parameterised — test all critical endpoints
const slaTable = [
  { name: "List citations", path: "/api/v2/citations", slaMs: 500 },
  { name: "Get citation", path: "/api/v2/citations/CIT-001", slaMs: 200 },
  { name: "Search citations", path: "/api/v2/citations/search", slaMs: 1000 },
  { name: "Get user profile", path: "/api/v2/users/me", slaMs: 200 },
] as const;

for (const { name, path, slaMs } of slaTable) {
  test(`SLA: ${name} responds within ${slaMs}ms`, async ({
    request,
    account,
  }) => {
    const start = Date.now();
    const response = await request.get(`${process.env.API_BASE_URL}${path}`, {
      headers: HeadersCrm.bearer(account.accessToken),
    });
    const duration = Date.now() - start;

    expect(response.ok()).toBe(true);
    expect(
      duration,
      `${name}: SLA ${slaMs}ms exceeded, got ${duration}ms`,
    ).toBeLessThan(slaMs);
  });
}
```

---

## 2. Layer 2 — Browser Navigation Timing API

The [Navigation Timing API](https://developer.mozilla.org/en-US/docs/Web/API/Navigation_timing_API) gives you precise browser-side metrics. Access it via `page.evaluate()`:

```typescript
// utils/performance.utils.ts
// Collects browser-side performance metrics using the W3C Navigation Timing API
// Spec: https://www.w3.org/TR/navigation-timing-2/

export interface NavigationTimingMetrics {
  // Time to first byte (server processing + network) — most affected by backend speed
  ttfb: number;
  // DOM fully parsed and sub-resources loaded
  domContentLoaded: number;
  // Everything loaded, including images and stylesheets
  loadComplete: number;
  // DNS + TCP + TLS handshake
  connectionTime: number;
}

export async function captureNavigationTiming(
  page: Page,
): Promise<NavigationTimingMetrics> {
  // Wait for load to complete before measuring
  await page.waitForLoadState("load");

  return page.evaluate((): NavigationTimingMetrics => {
    const nav = performance.getEntriesByType(
      "navigation",
    )[0] as PerformanceNavigationTiming;
    return {
      ttfb: nav.responseStart - nav.requestStart,
      domContentLoaded: nav.domContentLoadedEventEnd - nav.startTime,
      loadComplete: nav.loadEventEnd - nav.startTime,
      connectionTime: nav.connectEnd - nav.connectStart,
    };
  });
}

// The Core Web Vitals — require web-vitals library (or measure via PerformanceObserver)
export interface CoreWebVitals {
  // Largest Contentful Paint — when the largest image/text is painted
  // Target: < 2500ms (good), < 4000ms (needs improvement), > 4000ms (poor)
  // Source: https://web.dev/lcp/
  lcp: number;

  // Cumulative Layout Shift — visual stability (elements jumping around)
  // Target: < 0.1 (good), < 0.25 (needs improvement), > 0.25 (poor)
  // Source: https://web.dev/cls/
  cls: number;

  // Interaction to Next Paint (successor to FID) — responsiveness
  // Target: < 200ms (good), < 500ms (needs improvement), > 500ms (poor)
  // Source: https://web.dev/inp/
  inp: number;
}

export async function captureCoreWebVitals(page: Page): Promise<CoreWebVitals> {
  // Inject the web-vitals library (open source: https://github.com/GoogleChrome/web-vitals)
  await page.addScriptTag({
    url: "https://unpkg.com/web-vitals@3/dist/web-vitals.iife.js",
    // In offline/CI environments, bundle it locally instead:
    // path: 'node_modules/web-vitals/dist/web-vitals.iife.js',
  });

  // ❌ BROKEN — see "Why this hangs then crashes" below. Kept because this is the
  // shape almost every blog post shows, and you need to recognise it.
  return page.evaluate(async (): Promise<CoreWebVitals> => {
    return new Promise((resolve) => {
      const vitals: Partial<CoreWebVitals> = {};
      let collected = 0;

      const checkDone = () => {
        if (collected >= 3) resolve(vitals as CoreWebVitals);
      };

      // @ts-ignore — webVitals is injected globally by the script tag
      webVitals.onLCP((metric: { value: number }) => {
        vitals.lcp = metric.value;
        collected++;
        checkDone();
      });
      webVitals.onCLS((metric: { value: number }) => {
        vitals.cls = metric.value;
        collected++;
        checkDone();
      });
      webVitals.onINP((metric: { value: number }) => {
        vitals.inp = metric.value;
        collected++;
        checkDone();
      });

      // Fallback: if not all vitals fire within 30s, resolve with what we have
      setTimeout(() => resolve(vitals as CoreWebVitals), 30_000);
    });
  });
}
```

### Why that collector hangs for 30 seconds and then crashes

The `collected >= 3` gate is never satisfied in a normal Playwright run, because of how
web-vitals decides a metric is final. From the library's own documentation, the default
(without `reportAllChanges`) is that the callback fires **when the metric is ready to be
reported** — and for CLS and INP that means the callback is *"always called when the
page's visibility state changes to hidden"*. A Playwright test navigates, asserts, and
ends; it never backgrounds or unloads the page, so nothing ever reports.

Measured, running the collector above verbatim against a real loaded page in Chromium
with `web-vitals@3` and default options — no interaction, no page hide:

```
--- defaults, no page hide (the collector above) ---
vitals:          {}
callbacks fired: []
=> collected count would be: 0   (gate needs 3)
```

Zero callbacks. So `collected` stays at 0, the promise sits for the full 30 seconds, and
the `setTimeout` fallback resolves an **empty object** — which the `as CoreWebVitals`
cast launders into a type that promises three numbers. The test then does
`vitals.lcp.toFixed(0)` and dies:

```
TypeError: Cannot read properties of undefined (reading 'toFixed')
```

Every performance test in the suite pays 30 seconds to produce that. Worse, the
**assertions fail open** if you drop the `.toFixed()` formatting:

```js
undefined < 0.1; // → false
// so expect(vitals.cls).toBeLessThan(0.1) FAILS LOUDLY (good) …
// but a hand-rolled `if (vitals.cls < 0.1) pass()` silently reports "not good"
// and an `if (vitals.cls > 0.1) fail()` silently reports SUCCESS on missing data.
```

A metric collector that can't distinguish "0.05 CLS" from "never measured" is worse than
no collector, because it produces green builds from absent data.

### The fixed collector

One change does the real work: **ask for values as soon as they're known**, via
`reportAllChanges: true`. Then wait for them to actually arrive instead of sleeping, and
validate rather than cast. Measured with the same page and the flag turned on:

```
--- reportAllChanges: true, after one click, no page hide ---
vitals:          { lcp: 1768, cls: 0, inp: 144 }
callbacks fired: [ 'lcp', 'cls', 'inp' ]
```

All three report, with no page-hide needed. (It's worth stating what this rules out:
manually dispatching a `visibilitychange` with `document.visibilityState` overridden to
`"hidden"` is a popular workaround for this problem, but it is **not** what fixes it —
adding that step after the flag changed nothing, because the values had already been
reported. `reportAllChanges` is the fix; the visibility dance is cargo cult.)

```typescript
export async function captureCoreWebVitals(
  page: Page,
  timeoutMs = 10_000,
): Promise<CoreWebVitals> {
  await page.addScriptTag({
    // Pin the version — the global name and metric set differ across majors.
    url: "https://unpkg.com/web-vitals@3/dist/web-vitals.iife.js",
    // path: 'node_modules/web-vitals/dist/web-vitals.iife.js',  // preferred in CI
  });

  // 1. Register collectors that report on every change, into a page-level bucket.
  await page.evaluate(() => {
    (window as any).__vitals = {} as Record<string, number>;
    const opts = { reportAllChanges: true };
    const wv = (window as any).webVitals;
    wv.onLCP((m: { value: number }) => ((window as any).__vitals.lcp = m.value), opts);
    wv.onCLS((m: { value: number }) => ((window as any).__vitals.cls = m.value), opts);
    wv.onINP((m: { value: number }) => ((window as any).__vitals.inp = m.value), opts);
  });

  // 2. Wait for the values to actually arrive — don't sleep a fixed 30s.
  //    With reportAllChanges they land within a few hundred ms of being known.
  const raw = await page
    .waitForFunction(
      () => {
        const v = (window as any).__vitals;
        return typeof v?.lcp === "number" && typeof v?.cls === "number" ? v : null;
      },
      undefined,
      { timeout: timeoutMs },
    )
    .then((handle) => handle.jsonValue() as Promise<Partial<CoreWebVitals>>);

  // 3. Validate instead of casting — a missing metric must be loud, not `undefined`.
  const missing = (["lcp", "cls"] as const).filter(
    (k) => typeof raw[k] !== "number",
  );
  if (missing.length > 0) {
    throw new Error(
      `Core Web Vitals not collected: [${missing.join(", ")}]. ` +
        `Check that web-vitals actually loaded (window.webVitals) and that ` +
        `reportAllChanges: true was passed — without it these never report.`,
    );
  }

  return {
    lcp: raw.lcp!,
    cls: raw.cls!,
    // INP requires a real interaction to exist at all; absent is legitimate, so
    // report it as NaN rather than silently as 0 (which would pass any budget).
    inp: typeof raw.inp === "number" ? raw.inp : NaN,
  };
}
```

Note the deliberate asymmetry on INP: LCP and CLS are always measurable on a loaded
page, so their absence is a **collector bug** and throws. INP has nothing to measure
until the user interacts, so on a pure page-load test its absence is **expected** — and
returning `NaN` is the honest encoding, because `expect(NaN).toBeLessThan(200)` fails
(`NaN < 200` is `false`), whereas returning `0` would sail through the budget and report
perfect responsiveness for a page nobody touched. If you want an INP number, you must
interact first — which is exactly what the test in the next block does before measuring.

**Using the utilities in a test:**

```typescript
test("Citation search page meets performance budget @performance", async ({
  page,
}) => {
  await page.goto("/citations");

  // Interact to trigger a measurement (INP requires user interaction)
  await page.locator("#searchInput").click();
  await page.locator("#searchInput").fill("CIT");
  await page.keyboard.press("Enter");
  await page.waitForLoadState("networkidle");

  const timing = await captureNavigationTiming(page);
  const vitals = await captureCoreWebVitals(page);

  // Navigation timing assertions:
  expect(timing.ttfb, "TTFB must be under 600ms").toBeLessThan(600);
  expect(
    timing.domContentLoaded,
    "DOMContentLoaded must be under 2s",
  ).toBeLessThan(2000);

  // Core Web Vitals (Google's thresholds):
  expect(vitals.lcp, `LCP ${vitals.lcp}ms exceeds 2500ms (poor)`).toBeLessThan(
    2500,
  );
  expect(vitals.cls, `CLS ${vitals.cls} exceeds 0.1 (poor)`).toBeLessThan(0.1);
  expect(vitals.inp, `INP ${vitals.inp}ms exceeds 200ms (poor)`).toBeLessThan(
    200,
  );

  // Attach metrics to the test report
  test
    .info()
    .annotations.push(
      { type: "LCP", description: `${vitals.lcp.toFixed(0)}ms` },
      { type: "CLS", description: `${vitals.cls.toFixed(3)}` },
      { type: "INP", description: `${vitals.inp.toFixed(0)}ms` },
      { type: "TTFB", description: `${timing.ttfb.toFixed(0)}ms` },
    );
});
```

---

## 3. Layer 3 — Lighthouse CI (Full Automated Audit)

**Lighthouse CI** ([github.com/GoogleChrome/lighthouse-ci](https://github.com/GoogleChrome/lighthouse-ci)) runs the full Lighthouse audit in CI and fails the build when scores drop below your thresholds.

### Installation

```bash
npm install --save-dev @lhci/cli
# Or globally:
npm install -g @lhci/cli
```

### Configuration — `lighthouserc.js`

```javascript
// lighthouserc.js — at project root
// Full config reference: https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/configuration.md

module.exports = {
  ci: {
    collect: {
      url: [
        `${process.env.APP_BASE_URL}/citations`,
        `${process.env.APP_BASE_URL}/citations/new`,
        `${process.env.APP_BASE_URL}/dashboard`,
      ],
      numberOfRuns: 3, // take 3 measurements, use median → more stable results
      settings: {
        // Authenticate using a stored cookie or localStorage state
        // For apps requiring login:
        extraHeaders: JSON.stringify({
          Cookie: `session=${process.env.SESSION_COOKIE}`,
          Authorization: `Bearer ${process.env.PERF_TEST_TOKEN}`,
        }),
        // Emulate a mid-range mobile device:
        // preset: 'desktop',  // or leave blank for mobile emulation (default)
        onlyCategories: ["performance", "accessibility", "best-practices"],
      },
    },

    assert: {
      // Fail CI if any score drops below these thresholds
      // Scoring reference: https://developer.chrome.com/docs/lighthouse/performance/performance-scoring/
      assertions: {
        "categories:performance": ["error", { minScore: 0.75 }], // ≥75
        "categories:accessibility": ["error", { minScore: 0.9 }], // ≥90
        "categories:best-practices": ["warn", { minScore: 0.85 }], // ≥85 (warning only)

        // Individual metric thresholds:
        "first-contentful-paint": ["error", { maxNumericValue: 2000 }], // ≤2s
        "largest-contentful-paint": ["error", { maxNumericValue: 2500 }], // ≤2.5s
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.1 }], // ≤0.1
        interactive: ["error", { maxNumericValue: 5000 }], // ≤5s TTI
        "speed-index": ["warn", { maxNumericValue: 3400 }], // ≤3.4s

        // D365-specific: these often fail out of the box; track them as warnings first
        "render-blocking-resources": ["warn", { maxLength: 5 }],
        "unused-javascript": ["warn", { maxLength: 5 }],
      },
    },

    upload: {
      // Store results in LHCI server or GitHub Actions artifact
      target: "temporary-public-storage", // or 'lhci' for your own server
      // For self-hosted: serverBaseUrl: 'https://lhci.your-company.com'
    },
  },
};
```

### GitHub Actions Integration

```yaml
# .github/workflows/performance.yml
name: Performance Audit

on:
  push:
    branches: [main, develop]
  pull_request:
    types: [opened, synchronize]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - run: npm ci
      - run: npm run build # build the app for production measurement

      - name: Start the application
        run: npm run start:ci & # start app in background
        env:
          NODE_ENV: production
          PORT: 3000

      - name: Wait for app to be ready
        run: npx wait-on http://localhost:3000 --timeout 60000

      - name: Run Lighthouse CI
        run: npx lhci autorun
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
          APP_BASE_URL: http://localhost:3000
          PERF_TEST_TOKEN: ${{ secrets.PERF_TEST_TOKEN }}

      - name: Upload LHCI results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: lighthouse-results
          path: .lighthouseci/
          retention-days: 30
```

---

## 4. Layer 4 — Load Testing with k6

For **concurrent user load testing** (not Playwright's domain), use [k6](https://github.com/grafana/k6) (open source, AGPL 3.0, by Grafana Labs):

```bash
# Install: https://k6.io/docs/get-started/installation/
winget install k6
# Or: brew install k6 (macOS)
```

```javascript
// tests/load/citation-search.k6.js
// k6 script — NOT TypeScript, k6 uses ES6 JS
// Docs: https://k6.io/docs/using-k6/http-requests/

import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

// Custom metrics
const errorRate = new Rate("errors");
const citationSearchDuration = new Trend("citation_search_duration", true);

export const options = {
  // Ramp up: 0→50 users over 1min, hold 3min, ramp down
  stages: [
    { duration: "1m", target: 50 }, // ramp up
    { duration: "3m", target: 50 }, // sustain load
    { duration: "1m", target: 100 }, // spike test
    { duration: "2m", target: 100 }, // sustain spike
    { duration: "1m", target: 0 }, // ramp down
  ],

  // Pass/fail thresholds — CI will fail if these are breached
  thresholds: {
    http_req_duration: ["p(95)<500"], // 95% of requests under 500ms
    citation_search_duration: ["p(99)<1000"], // 99% of searches under 1s
    errors: ["rate<0.01"], // error rate under 1%
    http_req_failed: ["rate<0.01"], // HTTP failures under 1%
  },
};

export default function () {
  const BASE_URL = __ENV.API_BASE_URL ?? "https://staging-api.company.com";
  const TOKEN = __ENV.PERF_TOKEN;

  const headers = {
    Authorization: `Bearer ${TOKEN}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  // Scenario: search for citations
  const searchStart = Date.now();
  const searchRes = http.get(
    `${BASE_URL}/api/v2/citations?status=PENDING&page=1&size=20`,
    { headers },
  );
  citationSearchDuration.add(Date.now() - searchStart);

  // Validate the response
  const ok = check(searchRes, {
    "status is 200": (r) => r.status === 200,
    "has data array": (r) => JSON.parse(r.body)?.data?.length >= 0,
    "response time under 1s": (r) => r.timings.duration < 1000,
  });
  errorRate.add(!ok);

  sleep(1); // think time between requests
}
```

```bash
# Run locally:
k6 run tests/load/citation-search.k6.js \
  -e API_BASE_URL=https://staging-api.company.com \
  -e PERF_TOKEN=$TOKEN

# Run in CI:
k6 run tests/load/citation-search.k6.js --out json=load-test-results.json
```

---

## 5. Performance Budget — The Contract

Define your performance budget explicitly — it's a contract between engineering and product:

```typescript
// config/performance-budget.ts
// These thresholds are SLAs agreed with the product owner.
// Changing them requires a documented decision in DECISIONS.md.

export const PerformanceBudget = {
  api: {
    citation: {
      list: { p50: 200, p95: 500, p99: 1000 }, // ms
      get: { p50: 100, p95: 200, p99: 500 },
      create: { p50: 300, p95: 800, p99: 2000 },
      search: { p50: 400, p95: 1000, p99: 3000 },
    },
    notification: {
      send: { p50: 500, p95: 2000, p99: 5000 }, // async — higher tolerance
    },
  },
  ui: {
    citationsPage: {
      lcp: 2500, // ms — Google "good" threshold
      cls: 0.1, // score — Google "good" threshold
      inp: 200, // ms — Google "good" threshold
      ttfb: 600, // ms
    },
  },
  load: {
    concurrentUsers: 100,
    errorRatePercent: 1,
    p95ResponseTimeMs: 500,
  },
} as const;
```

---

## 5b. Resource Timing API — Find the Slow Asset

The Navigation Timing API tells you about the page load overall. The Resource Timing API pinpoints which specific resource is slow:

```typescript
// utils/resourceTiming.util.ts

export interface SlowResource {
  name: string; // URL of the resource
  type: string; // script, stylesheet, fetch, img, etc.
  duration: number; // total time in ms
  size: number; // encoded size in bytes
}

export async function findSlowResources(
  page: import("@playwright/test").Page,
  thresholdMs: number = 500,
  thresholdBytes: number = 500_000, // 500 KB
): Promise<SlowResource[]> {
  return page.evaluate(
    ({ thresholdMs, thresholdBytes }) => {
      const entries = performance.getEntriesByType(
        "resource",
      ) as PerformanceResourceTiming[];
      return entries
        .filter(
          (e) => e.duration > thresholdMs || e.encodedBodySize > thresholdBytes,
        )
        .map((e) => ({
          name: e.name,
          type: e.initiatorType,
          duration: Math.round(e.duration),
          size: e.encodedBodySize,
        }))
        .sort((a, b) => b.duration - a.duration); // slowest first
    },
    { thresholdMs, thresholdBytes },
  );
}

// Usage in test:
test("No resource takes over 1s to load on citations page", async ({
  page,
}) => {
  await page.goto("/citations");
  await page.waitForLoadState("networkidle");

  const slowResources = await findSlowResources(page, 1000);

  if (slowResources.length > 0) {
    // Format for readable test failure message:
    const formatted = slowResources
      .map(
        (r) =>
          `  [${r.type}] ${r.name.split("/").pop()} — ${r.duration}ms, ${(r.size / 1024).toFixed(0)}KB`,
      )
      .join("\n");
    throw new Error(
      `${slowResources.length} slow resource(s) found:\n${formatted}`,
    );
  }
});
```

---

## 5c. Memory Leak Detection via `performance.memory`

Repetitive actions (navigating, opening modals, filtering grids) can cause memory leaks in SPAs. Detect them in Playwright:

```typescript
test("Repeated citation searches do not leak memory", async ({ page }) => {
  await page.goto("/citations");
  await page.waitForLoadState("networkidle");

  // Capture baseline memory (Chrome-only: performance.memory is non-standard)
  const baselineMemoryMB = await page.evaluate(() => {
    // performance.memory is Chrome-only — check feature support
    const mem = (performance as any).memory;
    if (!mem) return null;
    return mem.usedJSHeapSize / 1024 / 1024;
  });

  if (baselineMemoryMB === null) {
    test.skip(); // memory API not available in this browser
    return;
  }

  // Perform 20 rapid search-clear cycles (simulates power user)
  for (let i = 0; i < 20; i++) {
    await page.fill("#searchInput", `CIT-00${i}`);
    await page.click("#searchBtn");
    await page.waitForLoadState("networkidle");
    await page.click("#clearBtn");
  }

  const finalMemoryMB = await page.evaluate(
    () => (performance as any).memory.usedJSHeapSize / 1024 / 1024,
  );

  const growthMB = finalMemoryMB - baselineMemoryMB;
  console.log(
    `[Memory] Baseline: ${baselineMemoryMB.toFixed(1)}MB, Final: ${finalMemoryMB.toFixed(1)}MB, Growth: ${growthMB.toFixed(1)}MB`,
  );

  // A growth of more than 50MB after 20 cycles is a likely memory leak
  expect(
    growthMB,
    `Memory grew by ${growthMB.toFixed(1)}MB after 20 search cycles — possible memory leak`,
  ).toBeLessThan(50);
});
```

---

## 5d. k6 Scenario Patterns — Beyond Simple Ramping

```javascript
// tests/load/citation-scenarios.k6.js
// k6 scenarios: run different load patterns for the same test in one run

export const options = {
  scenarios: {
    // Scenario 1: Constant load — baseline performance measurement
    constant_load: {
      executor: "constant-vus",
      vus: 20,
      duration: "5m",
      tags: { scenario: "constant" },
    },

    // Scenario 2: Ramping — find the breaking point
    ramp_to_limit: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "2m", target: 50 },
        { duration: "2m", target: 100 },
        { duration: "2m", target: 200 },
        { duration: "1m", target: 0 },
      ],
      startTime: "5m", // start after constant_load finishes
      tags: { scenario: "ramp" },
    },

    // Scenario 3: Spike — sudden burst (simulates end-of-month processing)
    spike: {
      executor: "ramping-vus",
      stages: [
        { duration: "10s", target: 0 },
        { duration: "10s", target: 200 }, // instant spike to 200 users
        { duration: "2m", target: 200 },
        { duration: "10s", target: 0 },
      ],
      startTime: "12m",
      tags: { scenario: "spike" },
    },

    // Scenario 4: Soak — extended low load (find memory leaks and connection pool exhaustion)
    soak: {
      executor: "constant-vus",
      vus: 10,
      duration: "30m", // run overnight with --out influxdb for dashboards
      startTime: "15m",
      tags: { scenario: "soak" },
    },
  },

  thresholds: {
    "http_req_duration{scenario:constant}": ["p(95)<500"],
    "http_req_duration{scenario:ramp}": ["p(95)<1000"],
    "http_req_duration{scenario:spike}": ["p(95)<2000"],
    http_req_failed: ["rate<0.01"],
  },
};
```

---

## 5e. Flame Graph Reading for SDETs

When `findSlowResources` or Lighthouse highlights a problem, the next step is often looking at a **Flame Graph** (via Playwright Traces or Chrome DevTools).

**What is a Flame Graph?**
It's a visual representation of the call stack over time.

- **X-axis**: Time. Wide blocks mean the function took a long time to execute.
- **Y-axis**: Call stack depth. Top blocks call bottom blocks (or vice-versa depending on the tool).

**How to Read It for Performance Bugs:**

1. **The "Flat Top" (Long Tasks)**: If you see a very wide block at the bottom of the stack without many children, it means a single function is blocking the main thread (synchronous JS).
   - **Fix**: This function needs to be optimized, memoized, or pushed to a Web Worker.
2. **The "Spiky Comb" (Excessive Renders)**: Lots of tiny, repeated vertical spikes. This usually means React/Angular is re-rendering a component hundreds of times unnecessarily.
   - **Fix**: Check for missing `useMemo`, `useCallback`, or bad state management triggering render loops.
3. **The "Staircase" (Waterfall Requests)**: Stacks that step down sequentially. Component A loads → fetches Data A → renders Component B → fetches Data B.
   - **Fix**: Hoist data fetching to the route level with `Promise.all()` to fetch concurrently.

**Playwright Tracing for Flame Graphs:**
Playwright trace viewer includes a timeline and call stacks for network requests, making it easy to spot "Staircases".

```typescript
test.use({ trace: "on" }); // Enable tracing

test("Trace performance bottleneck", async ({ page }) => {
  await page.goto("/dashboard");
  // Open the trace.zip in trace.playwright.dev to view the timeline!
});
```

## 🏋️ Practice Challenges

### Challenge 1 [Write It Yourself]

Write a Playwright test that:

1. Navigates to `/dashboard`
2. Captures TTFB, DOM Content Loaded, and Full Load time using the Navigation Timing API
3. Asserts TTFB < 600ms and full load < 3000ms
4. Attaches all three metrics as test annotations (visible in Playwright HTML report)

### Challenge 2 [MCQ] — Which Tool for Which Problem?

Match the tool to the use case:

| Use case                                                                 | Tool |
| ------------------------------------------------------------------------ | ---- |
| Verify that the citation search page's LCP is < 2.5s in CI               | ?    |
| Verify that the API handles 100 concurrent users with p95 < 500ms        | ?    |
| Verify that a single API call responds within 200ms in a functional test | ?    |
| Generate a full accessibility + performance score for stakeholders       | ?    |

<details><summary>Answer</summary>

| Use case                               | Tool                                                         |
| -------------------------------------- | ------------------------------------------------------------ |
| Verify LCP < 2.5s in CI                | **Lighthouse CI** (`@lhci/cli`) — runs full Lighthouse audit |
| 100 concurrent users, p95 < 500ms      | **k6** — load testing tool for concurrent scenarios          |
| Single API call within 200ms           | **Playwright `request`** with `Date.now()` timing — built-in |
| Full accessibility + performance score | **Lighthouse CI** — produces scores for all categories       |

</details>

### Challenge 3 [Interpret the k6 Output]

Your k6 run produces this output:

```
citation_search_duration..... avg=1247ms min=823ms med=1089ms max=4821ms p(90)=1890ms p(95)=2340ms p(99)=4100ms
http_req_failed.............. 3.2%
Errors...................... ✓ 0.00%
```

Your thresholds are: `citation_search_duration p(95)<1000` and `http_req_failed rate<0.01`. What does this output tell you, and what do you report to the team?

<details><summary>Answer</summary>

**Two threshold violations:**

1. `p(95) = 2340ms` — threshold is `<1000ms`. The 95th percentile is more than 2× over the SLA. This means 1 in 20 users experienced a search taking over 2.3 seconds.

2. `http_req_failed = 3.2%` — threshold is `<1%`. Over 3% of all HTTP requests failed (likely 5xx errors or timeouts). This is a reliability issue, not just a performance issue.

**What to report:**

```
Load Test Results — Citation Search API
Status:       FAILED ❌
Date:         2026-05-28
Load:         [as configured]

Violations:
  ● citation_search_duration p(95): 2340ms (SLA: <1000ms) — 2.3× over threshold
  ● http_req_failed: 3.2% (SLA: <1%) — 3× over threshold

Observations:
  - Median (p50) = 1089ms: average users see ~1s response — borderline acceptable
  - p(99) = 4100ms: tail latency is severe — some users see >4s
  - 3.2% failure rate: investigate error logs for 5xx and timeouts

Recommended actions:
  1. Check DB connection pool under load (pool exhaustion = both high latency + errors)
  2. Profile the citation search query (EXPLAIN ANALYZE) under 50+ concurrent users
  3. Check API server CPU/memory at peak load (CloudWatch / Application Insights)
  4. Do NOT deploy to production until p(95) < 1000ms and failure rate < 1%
```

</details>

---

### Challenge 4 [Performance Budget Decision]

Your team proposes: "Let's run Lighthouse CI on every PR to block merges if the performance score drops below 75." What are the risks of this approach, and how would you improve it?

<details><summary>Answer</summary>

**Risks of blocking all PRs on Lighthouse score:**

1. **Flaky by nature**: Lighthouse scores vary ±5 points between runs even on the same build. A PR that scores 74 on run 1 and 78 on run 2 causes unnecessary re-runs and team frustration.

2. **Wrong scope**: Lighthouse runs against a built app. Most PRs don't touch performance-sensitive code. Blocking all PRs creates friction without adding signal.

3. **Single-number fallacy**: A score of 75 could mean excellent LCP but terrible CLS, or vice versa. A single number masks which metric actually regressed.

**Improved approach:**

```yaml
# Run LHCI but assert on individual METRICS, not the composite score:
assertions:
  "largest-contentful-paint": ["error", { maxNumericValue: 2500 }] # hard fail
  "cumulative-layout-shift": ["error", { maxNumericValue: 0.1 }] # hard fail
  "first-contentful-paint": ["warn", { maxNumericValue: 2000 }] # soft warn
  "categories:performance": ["warn", { minScore: 0.75 }] # warning only
```

This way: LCP or CLS regressions block the PR (they're real user experience regressions). The composite score is a warning only. Add `numberOfRuns: 3` and use the median to reduce flakiness.

</details>

### Challenge 5 [Spot the Bug — Lighthouse Test Flow]

```typescript
test("Dashboard performance meets Lighthouse budgets", async ({ page }) => {
  // 1. Authenticate and go to dashboard
  await page.goto("/login");
  await page.fill("#user", "admin");
  await page.fill("#pass", "secret");
  await page.click("#loginBtn");

  // 2. We are now navigating to the dashboard... run Lighthouse immediately!
  await playAudit({
    page: page,
    thresholds: { performance: 90 },
    port: 9222,
  });
});
```

Why does this test produce wildly inconsistent performance scores or sometimes fail completely?

<details><summary>Answer</summary>

**Bug**: The test triggers `playAudit` _immediately_ after clicking the login button. The browser is in the middle of navigating to the dashboard, loading resources, and hydrating React. Lighthouse might start its trace while the page is still blank, mid-redirect, or half-loaded.

**Fix**: Always wait for the network to idle and the target page to fully render before starting a performance audit on that specific view. Or, if you are auditing the _transition_, you must orchestrate the trace differently. For a static page audit:

```typescript
await page.click("#loginBtn");

// 1. Wait for URL to change to dashboard
await page.waitForURL("**/dashboard");

// 2. Wait for the heavy UI components to finish rendering
await page.waitForSelector(".dashboard-chart-loaded", { state: "visible" });

// NOW run the audit
await playAudit({
  page: page,
  thresholds: { performance: 90 },
  port: 9222,
});
```

**SDE Principle**: Performance measurement requires a stable initial state. If you measure during unpredictable state transitions (like authentication redirects), your metrics become noisy and useless.

</details>

---

**Key References:**

- [web.dev/vitals](https://web.dev/vitals/) — Google's Core Web Vitals guide
- [github.com/GoogleChrome/lighthouse-ci](https://github.com/GoogleChrome/lighthouse-ci) — LHCI source + docs
- [k6.io/docs](https://k6.io/docs/) — k6 documentation
- [MDN Navigation Timing](https://developer.mozilla.org/en-US/docs/Web/API/Navigation_timing_API) — browser timing spec

---

**Navigation**: [← Chapter 36: TypeScript Type System](../06_SDET_to_SDE_Bridge/36_TypeScript_Type_System_Mastery.md) | [Index](../00_INDEX.md) | [→ Chapter 38: Contract Testing with Pact](./38_Contract_Testing_Pact.md)


---

## Reality Check

**"Performance testing and load testing are the same"** → Different focuses: Performance testing: measures response time, throughput, and resource usage under a specific load. Load testing: gradually increases users to find the breaking point. Stress testing: pushes beyond normal load to see failure behavior. Soak/endurance testing: runs at normal load for hours/days to find memory leaks or degradation over time. Spike testing: sudden large increase in load. Lighthouse: client-side **lab** metrics (FCP, LCP, TBT, CLS, Speed Index) — browser rendering performance. k6: server-side performance under concurrent users — API throughput and latency. Both are needed; neither covers the other's domain. Note what Lighthouse structurally *cannot* give you: neither FID nor INP, because both require a real user interaction to exist, and a lab run has no user — Lighthouse reports **Total Blocking Time** as its lab proxy for responsiveness instead. If your performance budget names an INP threshold, that number can only be verified from field data (CrUX / RUM) or from an interaction-driven Playwright test like §2's, never from a Lighthouse score.

**"Lighthouse score of 90+ means the site performs well for users"** → Lighthouse lab score measures performance under ideal conditions: a simulated mid-tier mobile device, throttled network, no other browser tabs, cached DNS. Real users have: different devices (old phones, slow connections), browser extensions, cached/uncached states, geographic distance to servers, concurrent network requests. Field data (Core Web Vitals from Chrome User Experience Report, aka CrUX) reflects actual user experiences. The gap between lab score (90) and field data (poor) is common and reveals what Lighthouse misses. Both lab and field data are needed.

**"k6 tests show how many users your app can handle"** → k6 shows how many simulated virtual users (VUs) your app handles — under the specific k6 test scenario. Real user behavior is more complex: users browse multiple pages (not just one endpoint), they interact with a mix of features, they have variable think time between requests, real HTTP clients have different connection behavior than k6's VUs. k6 results are directional, not exact. They identify bottlenecks (database connection pool, specific slow endpoint, memory growth) and regressions (this deployment made the API 30% slower). They don't predict exact user capacity with confidence.

**"Page weight reduction is always the most impactful performance improvement"** → Reducing JavaScript bundle size helps, but impact depends on the bottleneck. If LCP (Largest Contentful Paint) is slow because of a blocking server-side API call: no amount of JS reduction helps — fix the API. If FID (First Input Delay) is high because of long tasks on the main thread: JS optimization helps. If TTFB (Time To First Byte) is slow: server/CDN optimization, not JS bundling. Use Lighthouse's opportunities and diagnostics to identify the ACTUAL bottleneck before optimizing. "Reduce bundle size" is not the answer to every performance problem.

**"Performance tests should run in CI for every PR"** → For performance tests that take 30 minutes (load tests, endurance tests): running per PR is too slow. Strategy: lightweight Lighthouse audit per PR (fast, catches client-side regressions), nightly or release-branch full load tests (catches server-side capacity regressions), production monitoring (CrUX, synthetic monitoring with your production traffic pattern) for ongoing measurement. Three layers: per-PR fast checks, periodic heavy tests, and continuous production monitoring. Treating all performance tests as per-PR tests defeats the purpose of fast CI feedback.
