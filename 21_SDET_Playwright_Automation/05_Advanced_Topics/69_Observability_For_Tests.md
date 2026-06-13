# 69. Observability for Tests

[← 68. Chaos Engineering](./68_Chaos_Engineering_And_Resilience_Testing.md) | [Index](../00_INDEX.md)

---

## 5W1H

| Element | Description |
|---------|-------------|
| **What** | Test observability is the practice of instrumenting your test framework and test execution environment with telemetry—traces, metrics, and logs—so you can understand not just whether tests pass or fail, but why, and where time is spent. It connects test execution to the broader observability stack (Jaeger, Tempo, Datadog, Prometheus) used by the services under test. |
| **Why** | As test suites grow, interpreting failures becomes expensive. "The checkout test failed" is actionable. "Some tests failed in CI, probably network-related" is not. Observability transforms test output from pass/fail binary signals into rich diagnostic data that can be correlated with service-side traces, enabling root cause analysis in minutes instead of hours. |
| **When** | Instrument tests when you have more than ~200 tests, when tests interact with multiple services, or when you need to correlate test failures with production incidents. For small suites (< 50 tests), basic logging is sufficient. |
| **Where** | At every layer of the test stack: API client (traces per HTTP call), page object methods (spans per POM action), test fixtures (metrics for setup time), and CI pipeline (build-level telemetry). |
| **Who** | SDETs own the test instrumentation. SREs/Platform teams own the observability backend (where traces are stored, retention policies, sampling rates). Developers consume test observability data when debugging CI failures. |
| **How** | By wrapping existing code with OpenTelemetry SDK calls, emitting spans for each logical operation (API call, POM method, data factory invocation), and exporting traces to a centralized collector. Correlate using trace IDs propagated from tests through services back to assertions. |

---

## Table of Contents

1. [Why Tests Need Observability Too](#1-why-tests-need-observability-too)
2. [OpenTelemetry for the API Client](#2-opentelemetry-for-the-api-client)
3. [Trace Context Propagation](#3-trace-context-propagation)
4. [Browser Performance Metrics in Playwright](#4-browser-performance-metrics-in-playwright)
5. [Test-Level Telemetry](#5-test-level-telemetry)
6. [Correlating Test Failures with Service Traces](#6-correlating-test-failures-with-service-traces)
7. [Alerting on Test Health SLOs](#7-alerting-on-test-health-slos)
8. [Anti-Patterns](#8-anti-patterns)
9. [Decision Matrix: Instrument Tests vs Service-Side Observability](#9-decision-matrix-instrument-tests-vs-service-side-observability)
10. [Senior/Principal Perspective: QA and SRE Bridge](#10-seniorprincipal-perspective-qa-and-sre-bridge)
11. [Exercise: OpenTelemetry in ApiCore.ts](#11-exercise-opentelemetry-in-apicorets)

---

## 1. Why Tests Need Observability Too

### The Testing Visibility Gap

Production services emit traces, metrics, and logs. When a user reports a slow checkout, SREs open Jaeger and trace the request end-to-end. When a deployment causes an error rate spike, the alert fires from Prometheus with a Grafana link to the relevant traces.

But the test suite runs in a different universe. Tests output pass/fail, test duration, and maybe a screenshot on failure. This creates a visibility gap: you know the checkout test took 12 seconds, but you do not know if that is because the API responded slowly, the browser was waiting for a third-party script, or the POM method that clicked the button had to retry.

This gap is expensive. When a test fails in CI, the investigation typically follows this pattern:

1. Engineer reads the test output (2 minutes)
2. Engineer re-runs the test locally, watching the browser (10-15 minutes)
3. Engineer adds console logs and retries (15-30 minutes)
4. Engineer uses browser DevTools to understand the network timeline (20-60 minutes)
5. Engineer identifies the root cause

Observability collapses this timeline by providing the network timeline and span breakdown as first-class test output, queryable alongside service traces.

### Distributed Tracing of Test Execution

Distributed tracing models a request as a tree of spans, where each span represents a unit of work with a start time, duration, and metadata. Applying this model to tests:

```
Test: checkout_flow
  Span: navigate_to_cart (200ms)
  Span: add_item_to_cart (150ms)
  Span: click_checkout (50ms)
  Span: API call: POST /api/v1/checkout (4500ms)
    Span: validate_cart (100ms)
    Span: charge_payment (4200ms)
      Span: call_payment_gateway (4000ms)
    Span: send_confirmation_email (200ms)
  Span: assert_order_confirmation (100ms)
```

This trace shows that 4500ms of the 5-second test was the checkout API call, and within that, 4000ms was the payment gateway. Without this trace, the engineer would spend 30 minutes figuring out that the payment gateway was the bottleneck.

### Understanding Where Time Is Spent

The primary value of test observability is understanding where time is spent. Common categories:

- **Fixture setup time**: Time spent in `beforeAll` and `beforeEach` hooks
- **Navigation time**: Time spent in `page.goto()`
- **API client time**: Time spent in HTTP requests from the test
- **POM method time**: Time spent in page object method execution
- **Assertion time**: Time spent in `expect()` calls
- **Data factory time**: Time spent generating test data

Without instrumenting these categories, you cannot distinguish "the test is slow because the fixture setup is inefficient" from "the test is slow because the API is slow." These have completely different fixes.

---

## 2. OpenTelemetry for the API Client

### What Is OpenTelemetry?

OpenTelemetry (OTel) is an open-source observability framework that provides vendor-neutral APIs, SDKs, and instrumentation for collecting telemetry data: traces, metrics, and logs. It is the standard for service-side observability and is increasingly adopted for testing instrumentation.

Key concepts:
- **Tracer**: Creates spans for a given logical operation
- **Span**: A unit of work with a name, start/end time, attributes, and optional child spans
- **SpanContext**: Carries trace ID and span ID across process boundaries
- **Exporter**: Sends telemetry data to a collector (Jaeger, Tempo, OTLP endpoint)

### Integrating OTel with ApiCore.ts

Assume a typical API client structure:

```typescript
// src/api/ApiCore.ts (before instrumentation)
export class ApiCore {
  constructor(private baseUrl: string) {}

  async get<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) throw new Error(`GET ${path} failed: ${response.status}`);
    return response.json();
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error(`POST ${path} failed: ${response.status}`);
    return response.json();
  }
}
```

After instrumenting with OpenTelemetry:

```typescript
// src/api/ApiCore.ts (with OpenTelemetry instrumentation)
import { trace, SpanStatusCode, context, SpanKind } from '@opentelemetry/api';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';

// Initialize the tracer provider once at module load
const provider = new NodeTracerProvider();
provider.addSpanProcessor(new SimpleSpanProcessor(
  new OTLPTraceExporter({ url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT })
));
provider.register();

const tracer = trace.getTracer('api-client', '1.0.0');

export class ApiCore {
  constructor(private baseUrl: string) {}

  async get<T>(path: string): Promise<T> {
    return tracer.startActiveSpan(`HTTP GET ${path}`, {
      kind: SpanKind.CLIENT,
      attributes: {
        'http.method': 'GET',
        'http.url': `${this.baseUrl}${path}`,
        'http.target': path,
        'http.host': new URL(this.baseUrl).host
      }
    }, async (span) => {
      const startTime = Date.now();
      try {
        const response = await fetch(`${this.baseUrl}${path}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        const duration = Date.now() - startTime;
        span.setAttributes({
          'http.status_code': response.status,
          'http.response_time_ms': duration
        });
        
        if (!response.ok) {
          span.setStatus({ code: SpanStatusCode.ERROR, message: `HTTP ${response.status}` });
          throw new Error(`GET ${path} failed: ${response.status}`);
        }
        
        span.setStatus({ code: SpanStatusCode.OK });
        return response.json();
      } catch (error) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: String(error) });
        span.recordException(error as Error);
        throw error;
      } finally {
        span.end();
      }
    });
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    return tracer.startActiveSpan(`HTTP POST ${path}`, {
      kind: SpanKind.CLIENT,
      attributes: {
        'http.method': 'POST',
        'http.url': `${this.baseUrl}${path}`,
        'http.target': path,
        'http.host': new URL(this.baseUrl).host
      }
    }, async (span) => {
      const startTime = Date.now();
      try {
        const response = await fetch(`${this.baseUrl}${path}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        
        const duration = Date.now() - startTime;
        span.setAttributes({
          'http.status_code': response.status,
          'http.response_time_ms': duration,
          'http.request_content_length': JSON.stringify(body).length
        });
        
        if (!response.ok) {
          span.setStatus({ code: SpanStatusCode.ERROR, message: `HTTP ${response.status}` });
          throw new Error(`POST ${path} failed: ${response.status}`);
        }
        
        span.setStatus({ code: SpanStatusCode.OK });
        return response.json();
      } catch (error) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: String(error) });
        span.recordException(error as Error);
        throw error;
      } finally {
        span.end();
      }
    });
  }
}
```

### What Each API Call Produces

When `api.get('/users/123')` is called, the OTel instrumentation produces a span with these attributes:

| Attribute | Value |
|-----------|-------|
| `span.name` | `HTTP GET /users/123` |
| `http.method` | `GET` |
| `http.url` | `https://api.example.com/users/123` |
| `http.target` | `/users/123` |
| `http.host` | `api.example.com` |
| `http.status_code` | `200` |
| `http.response_time_ms` | `145` |

This span can be exported to any OTel-compatible backend (Jaeger, Tempo, Zipkin, Datadog, Honeycomb).

---

## 3. Trace Context Propagation

### What Is Trace Context Propagation?

Trace context propagation carries the trace ID from the initiating process (the test) through intermediate services (the backend APIs) to the receiving process (the database, the downstream service). This enables end-to-end traces that span multiple services, which is essential for understanding where time is spent in a distributed system.

Without trace context propagation, a test that calls `POST /checkout` produces a trace for the test and a separate trace for the checkout service. With propagation, both are linked under the same trace ID.

### Injecting Trace IDs into HTTP Headers

The test creates a span and injects the trace context into HTTP headers before making a request:

```typescript
import { trace, context, propagation, SpanKind } from '@opentelemetry/api';

test('checkout flow creates end-to-end trace', async ({ page }) => {
  // Get the current tracer and a span for the test
  const tracer = trace.getTracer('playwright-test');
  const span = tracer.startSpan('checkout-flow-test', {
    kind: SpanKind.INTERNAL
  });
  
  // Run the test within this span's context
  await context.with(trace.setSpan(context.active(), span), async () => {
    const api = new ApiCore('https://api.example.com');
    
    // Before making the API call, inject trace context into headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    propagation.inject(context, headers);
    // headers now contains: traceparent: 00-<trace-id>-<span-id>-01
    
    // Make the API call with injected headers
    await api.post('/checkout', { cartId: 'CART-123' }, headers);
    
    await page.goto('/order-confirmation');
    await expect(page.locator('.order-id')).toBeVisible();
  });
  
  span.end();
});
```

### Manual Header Injection

If your API client does not natively support OTel propagation, you can manually inject headers:

```typescript
test('manual trace context injection', async ({ page }) => {
  const tracer = trace.getTracer('playwright-test');
  
  return tracer.startActiveSpan('user-profile-flow', async (span) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    // Inject trace context manually
    const activeContext = context.active();
    propagation.inject(activeContext, headers);
    // headers['traceparent'] = '00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01'
    
    const response = await fetch('https://api.example.com/api/v1/user/profile', {
      method: 'GET',
      headers
    });
    
    const data = await response.json();
    expect(data.userId).toBe('U12345');
    
    // Add test-specific attributes to the span
    span.setAttribute('test.userId', 'U12345');
    span.setAttribute('test.status', response.status);
    
    span.end();
  });
});
```

### Trace ID in Test Output

For easy correlation, include the trace ID in test output:

```typescript
test('search functionality', async ({ page }) => {
  const tracer = trace.getTracer('playwright-test');
  
  return tracer.startActiveSpan('search-flow', async (span) => {
    const traceId = span.spanContext().traceId;
    
    // Log the trace ID so it appears in CI output
    console.log(`TraceID: ${traceId}`);
    
    await page.goto('/search');
    await page.fill('#search-input', 'playwright');
    await page.click('#search-button');
    await expect(page.locator('.search-results')).toBeVisible();
    
    // When this test fails, the CI output shows the trace ID
    // SRE can search Jaeger for traceId=xyz and see the full service trace
    span.end();
  });
});
```

---

## 4. Browser Performance Metrics in Playwright

### Using PerformanceObserver

The browser exposes Web Vitals through the Performance Observer API. Playwright can access this to capture metrics as part of test execution.

```typescript
import { test, expect } from '@playwright/test';

test('homepage meets Core Web Vitals thresholds', async ({ page }) => {
  const webVitals: Record<string, number> = {};
  
  // Capture Web Vitals using page.evaluate
  await page.goto('https://example.com', { waitUntil: 'networkidle' });
  
  // Collect Web Vitals using PerformanceObserver
  const metrics = await page.evaluate(() => {
    const vitals: Record<string, number> = {};
    
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          const nav = entry as PerformanceNavigationTiming;
          vitals['TTFB'] = nav.responseStart;
          vitals['FCP'] = (entry as any).firstContentfulPaint;
          vitals['LCP'] = (entry as any).largestContentfulPaint;
        }
        if (entry.entryType === 'paint') {
          vitals['FCP'] = entry.startTime; // First Contentful Paint
        }
        if (entry.entryType === 'largest-contentful-paint') {
          vitals['LCP'] = entry.startTime;
        }
        if (entry.entryType === 'layout-shift') {
          vitals['CLS'] = (vitals['CLS'] || 0) + (entry as any).value;
        }
        if (entry.entryType === 'event') {
          vitals['INP'] = Math.max(vitals['INP'] || 0, entry.duration);
        }
      }
    }).observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint', 'layout-shift', 'event'] });
    
    // Trigger CLS and INP measurements
    return vitals;
  });
  
  // Assert against SLO thresholds
  expect(metrics['FCP']).toBeLessThan(2000);  // First Contentful Paint < 2s
  expect(metrics['LCP']).toBeLessThan(4000);  // Largest Contentful Paint < 4s
  expect(metrics['CLS']).toBeLessThan(0.1);   // Cumulative Layout Shift < 0.1
  expect(metrics['INP']).toBeLessThan(200);   // Interaction to Next Paint < 200ms
  
  console.log('Web Vitals:', JSON.stringify(metrics, null, 2));
});
```

### Capturing Network Timing

Playwright provides detailed network timing through request.continue() and response.timing():

```typescript
test('API response time meets SLO', async ({ page }) => {
  const apiTimings: Array<{ url: string; duration: number }> = [];
  
  // Capture timing for all API requests
  page.on('response', async (response) => {
    if (response.url().includes('/api/')) {
      const timing = response.timing();
      if (timing) {
        const duration = timing.responseEnd - timing.requestStart;
        apiTimings.push({
          url: response.url(),
          duration
        });
      }
    }
  });
  
  await page.goto('/dashboard', { waitUntil: 'networkidle' });
  
  // Report all API timings
  for (const { url, duration } of apiTimings) {
    console.log(`API: ${url} - ${duration.toFixed(2)}ms`);
    expect(duration).toBeLessThan(1000);  // Each API < 1s
  }
});
```

### Playwright's Built-in Performance API

Playwright exposes browser performance data through the `performance` namespace:

```typescript
test('captures browser performance metrics', async ({ page }) => {
  await page.goto('/heavy-page');
  
  const metrics = await page.evaluate(() => {
    const perf = performance as any;
    return {
      memory: perf.memory ? {
        usedJSHeapSize: perf.memory.usedJSHeapSize,
        totalJSHeapSize: perf.memory.totalJSHeapSize,
      } : null,
      navigation: perf.getEntriesByType('navigation')[0],
      resourceCount: perf.getEntriesByType('resource').length
    };
  });
  
  expect(metrics.memory?.usedJSHeapSize).toBeLessThan(100 * 1024 * 1024); // < 100MB
  console.log('Memory used:', (metrics.memory?.usedJSHeapSize! / 1024 / 1024).toFixed(2), 'MB');
});
```

---

## 5. Test-Level Telemetry

### Instrumenting POM Methods

Page Object Model methods are natural span boundaries. Each method can be a span:

```typescript
// src/pages/LoginPage.ts
import { trace, SpanStatusCode } from '@opentelemetry/api';

const tracer = trace.getTracer('page-objects');

export class LoginPage {
  constructor(private page: Page) {}
  
  async navigate(): Promise<void> {
    return tracer.startActiveSpan('LoginPage.navigate', async (span) => {
      span.setAttribute('page.url', '/login');
      try {
        await this.page.goto('/login', { waitUntil: 'domcontentloaded' });
        span.setStatus({ code: SpanStatusCode.OK });
      } catch (e) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: String(e) });
        throw e;
      } finally {
        span.end();
      }
    });
  }
  
  async login(username: string, password: string): Promise<void> {
    return tracer.startActiveSpan('LoginPage.login', async (span) => {
      span.setAttributes({
        'login.username': username,
        'login.method': 'form-submit'
      });
      try {
        await this.page.fill('#username', username);
        await this.page.fill('#password', password);
        await this.page.click('#login-submit');
        await this.page.waitForURL('**/dashboard**', { timeout: 10000 });
        span.setStatus({ code: SpanStatusCode.OK });
      } catch (e) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: String(e) });
        throw e;
      } finally {
        span.end();
      }
    });
  }
}
```

### Fixture Setup Time

Test fixtures often involve data setup that can be slow. Instrument them to identify bottlenecks:

```typescript
// tests/fixtures/user.fixture.ts
import { test as base, trace, SpanStatusCode } from '@playwright/test';
import { DataFactory } from '../../src/factories/DataFactory';

const tracer = trace.getTracer('test-fixtures');

export const test = base.extend<{ userFixture: { userId: string; token: string } }>({
  userFixture: async ({ request }, use) => {
    return tracer.startActiveSpan('fixture.userFixture', async (span) => {
      const factory = new DataFactory();
      const startTime = Date.now();
      
      try {
        const factorySpan = tracer.startSpan('DataFactory.createTestUser');
        const user = await factory.createTestUser();
        factorySpan.setAttribute('factory.userId', user.id);
        factorySpan.end();
        
        const loginSpan = tracer.startSpan('userFixture.login');
        const response = await request.post('/api/v1/auth/login', {
          data: { username: user.username, password: user.password }
        });
        loginSpan.setAttribute('login.status', response.status());
        loginSpan.end();
        
        const token = (await response.json()).token;
        const setupTime = Date.now() - startTime;
        
        span.setAttributes({
          'fixture.userId': user.id,
          'fixture.setupTime_ms': setupTime
        });
        span.setStatus({ code: SpanStatusCode.OK });
        
        await use({ userId: user.id, token });
      } catch (e) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: String(e) });
        throw e;
      } finally {
        span.end();
      }
    });
  }
});
```

### Data Factory Latency Tracking

```typescript
// src/factories/DataFactory.ts
import { trace, SpanStatusCode } from '@opentelemetry/api';

const tracer = trace.getTracer('data-factory');

export class DataFactory {
  async createTestUser(): Promise<{ id: string; username: string; password: string }> {
    return tracer.startActiveSpan('DataFactory.createTestUser', async (span) => {
      const startTime = Date.now();
      try {
        // Simulated user creation
        const user = {
          id: `user-${Date.now()}`,
          username: `testuser-${Date.now()}@example.com`,
          password: 'TestPassword123!'
        };
        
        const duration = Date.now() - startTime;
        span.setAttributes({
          'factory.method': 'createTestUser',
          'factory.duration_ms': duration,
          'factory.entityType': 'user'
        });
        span.setStatus({ code: SpanStatusCode.OK });
        
        return user;
      } catch (e) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: String(e) });
        span.recordException(e as Error);
        throw e;
      } finally {
        span.end();
      }
    });
  }
  
  async createTestOrder(userId: string, itemCount: number): Promise<{ orderId: string }> {
    return tracer.startActiveSpan('DataFactory.createTestOrder', async (span) => {
      const startTime = Date.now();
      try {
        const order = {
          orderId: `ORD-${Date.now()}`,
          userId,
          itemCount,
          totalCents: itemCount * 999
        };
        
        span.setAttributes({
          'factory.method': 'createTestOrder',
          'factory.userId': userId,
          'factory.itemCount': itemCount,
          'factory.duration_ms': Date.now() - startTime
        });
        span.setStatus({ code: SpanStatusCode.OK });
        
        return { orderId: order.orderId };
      } catch (e) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: String(e) });
        throw e;
      } finally {
        span.end();
      }
    });
  }
}
```

---

## 6. Correlating Test Failures with Service Traces

### The Correlation Workflow

When a test fails in CI, the standard investigation workflow without observability:

1. Read test failure message
2. Re-run test locally to reproduce
3. Open browser DevTools
4. Manually inspect network waterfall
5. Guess which service call caused the failure

With observability:

1. Read test failure message (includes trace ID)
2. Open Jaeger/Tempo, search for trace ID
3. Read the end-to-end span tree to identify the exact failing service
4. File a ticket with the trace link pre-attached

### Including Trace ID in Test Failures

```typescript
import { test, expect } from '@playwright/test';
import { trace } from '@opentelemetry/api';

test('checkout flow', async ({ page }) => {
  const tracer = trace.getTracer('playwright-test');
  
  let testSpan: ReturnType<typeof tracer.startSpan>;
  
  return tracer.startActiveSpan('checkout-flow', async (span) => {
    testSpan = span;
    const traceId = span.spanContext().traceId;
    
    try {
      await page.goto('/checkout');
      await page.fill('#card-number', '4242424242424242');
      await page.click('#pay-button');
      
      // This might fail if payment service times out
      await expect(page.locator('.order-success')).toBeVisible({ timeout: 15000 });
      
      span.setStatus({ code: SpanStatusCode.OK });
    } catch (e) {
      // On failure, log the trace ID so CI output includes it
      const errorMessage = `
Test failed with trace ID: ${traceId}

To investigate in Jaeger:
  search: traceId=${traceId}

This trace shows all service calls made during this test, 
enabling root cause identification in the service layer.
`;
      
      console.error(errorMessage);
      span.setStatus({ code: SpanStatusCode.ERROR, message: errorMessage });
      span.recordException(e as Error);
      throw e;
    } finally {
      span.end();
    }
  });
});
```

### CI Output Example

When the test fails, CI logs include:

```
ERROR: Test failed with trace ID: 0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331

To investigate in Jaeger:
  search: traceId=0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331

This trace shows all service calls made during this test.
```

The engineer clicks the link (or copies the trace ID) and immediately sees the service trace.

### Querying Traces from CI Logs

For automated root cause analysis, query traces from CI:

```bash
# After test failure, query Jaeger for the trace
JAEGER_TRACE_ID="0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331"
curl -s "http://jaeger:16686/api/traces/${JAEGER_TRACE_ID}" | jq '.data[0].spans[] | {operationName, duration, status}'

# Output shows which spans failed and which were slow:
# {
#   "operationName": "POST /api/v1/checkout",
#   "duration": 32000,        # 32 seconds — the payment gateway timed out
#   "status": "error"
# }
# {
#   "operationName": "charge_payment",
#   "duration": 30000,        # 30 seconds — external payment gateway was slow
#   "status": "error"
# }
```

---

## 7. Alerting on Test Health SLOs

### Defining Test SLOs

Test health SLOs define acceptable thresholds for test suite behavior:

| SLO | Target | Alert Threshold |
|-----|--------|-----------------|
| Test pass rate | > 95% | < 90% |
| Flaky test rate | < 5% | > 10% |
| Average test duration | < 30s | > 60s |
| P95 test duration | < 60s | > 120s |
| Fixture setup time | < 10s | > 20s |

### Exporting Test Metrics to Prometheus

```typescript
// tests/telemetry/testMetrics.ts
import { metrics, Counter, Histogram } from '@opentelemetry/api';

const meter = metrics.getMeter('playwright-tests');

export const testMetrics = {
  // Counter: number of test executions by result
  testResults: meter.createCounter('playwright_test_results_total', {
    description: 'Total number of test executions by result'
  }),
  
  // Histogram: distribution of test durations
  testDuration: meter.createHistogram('playwright_test_duration_seconds', {
    description: 'Distribution of test durations in seconds',
    unit: 's'
  }),
  
  // Histogram: fixture setup time
  fixtureSetupTime: meter.createHistogram('playwright_fixture_setup_seconds', {
    description: 'Distribution of fixture setup times in seconds',
    unit: 's'
  }),
  
  // Counter: flaky test detections
  flakyTests: meter.createCounter('playwright_flaky_tests_total', {
    description: 'Total number of flaky test detections'
  })
};

// In a test reporter or global setup
export function recordTestResult(result: 'passed' | 'failed' | 'skipped', durationSeconds: number) {
  testMetrics.testResults.add(1, { result });
  testMetrics.testDuration.record(durationSeconds, { result });
}

export function recordFlakyTest(testName: string, attemptCount: number) {
  testMetrics.flakyTests.add(1, { testName, attemptCount });
}
```

### Integrating with PagerDuty

When test pass rate drops below SLO, trigger PagerDuty:

```typescript
// tests/alerting/testHealthAlert.ts
import { AlertManager } from './AlertManager';

const alertManager = new AlertManager({
  pagerdutyKey: process.env.PAGERDUTY_ROUTING_KEY,
  slackWebhook: process.env.SLACK_WEBHOOK_URL
});

export async function checkTestHealthSLO(metrics: TestSuiteMetrics) {
  const passRate = metrics.passed / metrics.total;
  
  if (passRate < 0.90) {
    // Critical: test pass rate below SLO
    await alertManager.trigger({
      severity: 'critical',
      summary: `Playwright test pass rate: ${(passRate * 100).toFixed(1)}% (SLO: >95%)`,
      source: 'playwright-test-suite',
      dedupKey: 'playwright-pass-rate-critical',
      runbook: 'https://runbooks.example.com/playwright-test-health'
    });
  } else if (passRate < 0.95) {
    // Warning: test pass rate below target but above critical
    await alertManager.trigger({
      severity: 'warning',
      summary: `Playwright test pass rate: ${(passRate * 100).toFixed(1)}% (target: >95%)`,
      source: 'playwright-test-suite',
      dedupKey: 'playwright-pass-rate-warning'
    });
  }
  
  // Check for flaky test spike
  const flakyRate = metrics.flaky / metrics.total;
  if (flakyRate > 0.10) {
    await alertManager.trigger({
      severity: 'warning',
      summary: `Flaky test rate: ${(flakyRate * 100).toFixed(1)}% (threshold: >10%)`,
      source: 'playwright-test-suite',
      dedupKey: 'playwright-flaky-rate-warning'
    });
  }
}
```

### Slack Integration for Daily Test Health Reports

```typescript
// tests/alerting/slackReport.ts
export async function sendDailyTestReport(metrics: DailyTestMetrics) {
  const webhook = process.env.SLACK_WEBHOOK_URL;
  
  const payload = {
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: 'Daily Playwright Test Health Report' }
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Pass Rate:* ${(metrics.passRate * 100).toFixed(1)}%` },
          { type: 'mrkdwn', text: `*Total Tests:* ${metrics.total}` },
          { type: 'mrkdwn', text: `*Flaky Rate:* ${(metrics.flakyRate * 100).toFixed(1)}%` },
          { type: 'mrkdwn', text: `*Avg Duration:* ${metrics.avgDurationSeconds.toFixed(1)}s` },
        ]
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Trend:* ${metrics.passRateTrend > 0 ? ':arrow_up:' : ':arrow_down:'} ${Math.abs(metrics.passRateTrend * 100).toFixed(1)}% vs yesterday`
        }
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'View Dashboard' },
            url: 'https://grafana.example.com/d/playwright'
          },
          {
            type: 'button',
            text: { type: 'plain_text', text: 'View Flaky Tests' },
            url: 'https://playwright.example.com/flaky'
          }
        ]
      }
    ]
  };
  
  await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}
```

---

## 8. Anti-Patterns

### 1. Tracing Without Sampling

Collecting traces for every test execution in a large suite (1000+ tests) generates enormous volumes of data and can saturate your observability backend. The solution is sampling: collect complete traces for a percentage of tests, and aggregate metrics for the rest.

```typescript
// BAD: Sample everything — will overwhelm storage
const sampler = new AlwaysOnSampler();

// GOOD: Sample 10% of tests, always sample failures
const sampler = new TraceIdRatioBasedSampler({
  ratio: 0.1,
  alwaysSampleOnForce: true  // Failures are always sampled
});
```

### 2. Infinite Cardinality in Span Attributes

Span attributes are indexed and queryable, but every unique value creates a new time series in your observability backend. Do not put high-cardinality data in span attributes.

```typescript
// BAD: User ID as attribute — creates a new time series per user
span.setAttribute('user.id', 'user-123456');
span.setAttribute('user.id', 'user-789012');

// GOOD: Use user ID for correlation, but aggregate by category
span.setAttribute('user.tier', 'premium');  // Low cardinality: free, basic, premium, enterprise
```

### 3. Ignoring Test Fixture Time

Test fixture setup (`beforeAll`, `beforeEach`) is a major source of test flakiness and slowness. If you instrument only the test body but not the fixtures, you have an incomplete picture.

```typescript
// BAD: Only instrument test body
test('checkout', async ({ page }) => {
  const span = tracer.startSpan('checkout-test');
  await page.goto('/checkout');
  // Fixture time (10+ seconds) is invisible
  span.end();
});

// GOOD: Instrument fixtures too
beforeAll(async ({ page }) => {
  const span = tracer.startSpan('fixture.beforeAll');
  await page.goto('/');  // Expensive setup
  span.end();
});
```

### 4. No Correlation Between Test Name and Trace

Traces are useful only if you can find them. If the trace name is generic (e.g., "HTTP POST") and does not include the test name, finding the trace for a specific test failure requires searching by timestamp alone.

```typescript
// BAD: Generic span name — hard to correlate with specific test
span.setName('HTTP POST');

// GOOD: Include test name in span
span.setName('checkout-flow: POST /api/v1/checkout');
span.setAttribute('test.name', 'checkout-flow');
```

### 5. Dumping All Trace Data Without Retention Policy

Traces are expensive to store. Keeping every trace forever is cost-prohibitive and creates noise. Define a retention policy:

- Full fidelity traces: 7 days
- Aggregated metrics only: 90 days
- Audit log of test runs: 1 year

### 6. Observability Without Action

Emitting traces that no one looks at is overhead, not observability. Define the workflow: when X happens, Y person takes Z action because of observability data. If this workflow does not exist, the observability investment is not paying off.

```typescript
// If observability does not drive action, it is not observability
const OBSERVABILITY_WORKFLOW = {
  'Test pass rate drops >5%': 'On-call SDET reviews flaky tests in Grafana within 1 hour',
  'Test duration increases >50%': 'Performance investigation ticket created automatically',
  'Test failure correlated with service trace': 'Incident ticket linked to trace, SRE notified'
};

// If your observability does not feed this workflow, it needs redesign
```

---

## 9. Decision Matrix: Instrument Tests vs Service-Side Observability

| Condition | Recommended Approach |
|-----------|---------------------|
| Test interacts with single service, simple flow | Service-side observability sufficient (no test instrumentation) |
| Test interacts with 3+ services in sequence | Test-side trace context propagation to correlate across services |
| Test failures are difficult to reproduce locally | Test telemetry to capture failure context automatically |
| Flaky tests suspected to be environment-related | Test-level metrics (fixture time, network time) to identify bottlenecks |
| Tests run in CI against staging environment | Test observability — CI does not have browser DevTools |
| Tests run against production via synthetic monitoring | Service-side observability — production has full telemetry |
| Need to understand POM method-level performance | Test-level span instrumentation for POM methods |
| Need to understand which specific API call failed | Both: test trace ID + service-side span for the specific call |

### Hybrid Approach

In practice, the most effective strategy is a hybrid:

1. **Service-side observability** (Jaeger, Tempo, Datadog): Always present, always collecting. This is the source of truth for service-level performance.

2. **Test-level telemetry** for CI: Lightweight metrics (test duration, fixture time, pass/fail) exported to Prometheus/Grafana. Traces only on failure or sampled execution.

3. **Full trace collection** for debugging: When a test fails, automatically collect the full trace and attach the trace ID to the CI failure report.

---

## 10. Senior/Principal Perspective: QA and SRE Bridge

### The Observability Bridge

One of the most valuable (and underappreciated) contributions a senior SDET makes is building the observability bridge between QA and SRE. These two teams traditionally speak different languages:

- **QA**: "The checkout test failed"
- **SRE**: "The checkout service P99 latency is 4.2 seconds"

The observability bridge makes these statements equivalent. When a test failure automatically produces a trace ID that links to the service's span tree, QA and SRE are looking at the same data, speaking the same language.

### Building the Bridge

The bridge consists of three components:

1. **Shared instrumentation**: Test traces and service traces use the same trace ID format and are stored in the same backend (Jaeger, Tempo, Honeycomb). This is the technical foundation.

2. **Shared runbooks**: The same runbook used for production incidents is used for test failures. When a test fails with a trace ID, the runbook tells the engineer (QA or SRE) exactly what to do with that trace.

3. **Shared SLOs**: Test pass rate is not just a QA metric — it is a reliability SLO. SRE owns the SLO, QA owns the test instrumentation that measures it.

### The Cultural Shift

The bridge requires a cultural shift in both teams:

- **For QA**: Accept that SRE owns the observability infrastructure, not QA. Your job is to integrate with it, not build it. Learn to read traces, not just write tests.

- **For SRE**: Accept that test execution is a legitimate source of production-like load and observability signal. A test that calls the checkout API is exercising the same code path as a user. Its trace is as valid as a production trace.

When this cultural shift happens, the organizational effect is powerful: reliability becomes a shared concern, not a turf war between QA and SRE.

### Principal-Level Responsibilities

At the principal level, your responsibility is not just to instrument your own test suite, but to:

- **Define the observability contract**: Which test metrics are exported? In what format? To which backend?
- **Evangelize the bridge**: Coach senior engineers across teams on trace-driven debugging
- **Measure the bridge's effectiveness**: Track mean time to diagnosis (MTTD) for test failures before and after observability investment
- **Maintain the instrumentation**: As the application evolves, ensure test observability keeps pace with service observability

---

## 11. Exercise: OpenTelemetry in ApiCore.ts

### Objective

Add OpenTelemetry instrumentation to the framework's `ApiCore.ts` class. Document the resulting trace structure with a diagram showing parent-child span relationships.

### Starting Context

You have an existing `ApiCore.ts`:

```typescript
// src/api/ApiCore.ts
export class ApiCore {
  constructor(private baseUrl: string) {}

  async get<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) throw new Error(`GET ${path} failed: ${response.status}`);
    return response.json();
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error(`POST ${path} failed: ${response.status}`);
    return response.json();
  }
}
```

### Requirements

1. **Install OTel dependencies**: `@opentelemetry/api`, `@opentelemetry/sdk-trace-node`, `@opentelemetry/exporter-trace-otlp-http`, `@opentelemetry/sdk-trace-base`

2. **Initialize the tracer provider at module load** with the standard OTel initialization pattern

3. **Wrap each API method (`get`, `post`) with `tracer.startActiveSpan`** that creates a span with attributes:
   - `http.method`
   - `http.url`
   - `http.status_code` (set after the response is received)
   - `http.response_time_ms`
   - `error` flag (true if response is not OK)

4. **Propagate trace context** into the HTTP request headers using `propagation.inject()`

5. **Handle errors**: Set span status to `SpanStatusCode.ERROR`, record the exception, and re-throw

6. **Document the trace structure** with a text diagram showing:
   - Parent span (the test)
   - Child spans (each API call)
   - Span attributes on each span

### Expected Trace Structure Diagram

```
Root Span: checkout-flow (test)
│
├── Span: LoginPage.navigate
│   └── Span: HTTP GET /login (200ms, status=200)
│
├── Span: LoginPage.login
│   └── Span: HTTP POST /api/v1/auth/login (1450ms, status=200)
│       ├── Attribute: auth.token.present=true
│       └── Attribute: auth.method=form-submit
│
├── Span: CartPage.navigate
│   └── Span: HTTP GET /cart (320ms, status=200)
│
└── Span: CheckoutPage.placeOrder
    └── Span: HTTP POST /api/v1/checkout (4530ms, status=200)
        ├── Attribute: checkout.cart.itemCount=3
        ├── Attribute: checkout.totalCents=14997
        └── Span: HTTP POST /api/v1/payments (4000ms, status=200)
            ├── Attribute: payment.gateway=stripe
            └── Attribute: payment.amountCents=14997
```

### Self-Grading Rubric

| Criterion | Points | How to Verify |
|-----------|--------|---------------|
| OTel SDK initialized at module load | 15 | `new NodeTracerProvider()` and `provider.register()` present |
| `tracer.startActiveSpan()` wraps get/post | 15 | Spans created for both methods |
| HTTP method attribute set | 10 | `'http.method': 'GET'` or `'POST'` |
| HTTP URL attribute set | 10 | `'http.url': ${this.baseUrl}${path}` |
| Status code attribute set (post-response) | 10 | Set after `fetch()` resolves |
| Response time attribute set | 10 | `Date.now()` difference captured |
| Trace context propagated to headers | 10 | `propagation.inject(context, headers)` |
| Error handling with `SpanStatusCode.ERROR` | 10 | `span.setStatus({ code: SpanStatusCode.ERROR })` |
| Exception recorded on error | 10 | `span.recordException(error)` |
| Trace structure diagram documented | 10 | Diagram in comments showing span hierarchy |
| **Total** | **100** | |

### Bonus Challenge

Add a custom `otel.config.ts` that configures:
- A `AlwaysOnSampler` for local development
- A `TraceIdRatioBasedSampler` with 10% sampling for CI
- OTLP exporter that reads endpoint from `process.env.OTEL_EXPORTER_OTLP_ENDPOINT`

---

[← 68. Chaos Engineering](./68_Chaos_Engineering_And_Resilience_Testing.md) | [Index](../00_INDEX.md)