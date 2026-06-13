# 68. Chaos Engineering and Resilience Testing

[← 67. Test Impact Analysis](./67_Test_Impact_Analysis.md) | [Index](../00_INDEX.md) | [→ 69. Observability for Tests](./69_Observability_For_Tests.md)

---

## 5W1H

| Element | Description |
|---------|-------------|
| **What** | Chaos engineering is the disciplined practice of injecting controlled failures into a system to uncover weaknesses before they impact users in production. In the context of Playwright, this means using browser automation to simulate degraded conditions and verify that applications respond gracefully. |
| **Why** | Modern web applications depend on dozens of external services—payment gateways, auth providers, CDN nodes, database replicas. When any of these degrade, the user experience can catastrophically collapse unless the application has been designed to handle partial failures. Chaos testing reveals these gaps in controlled, measurable experiments. |
| **When** | Integrate chaos experiments into your CI/CD pipeline after core happy-path tests pass, and definitely before any production deployment. The ideal cadence is per-commit smoke, per-release deep dives, and per-quarter game days. |
| **Where** | In staging and pre-production environments that mirror production architecture. Never inject chaos directly into production unless you have documented emergency rollback procedures, a designated on-call engineer, and executive approval. |
| **Who** | SDETs own the test infrastructure and chaos experiment design. Backend SREs own the service-level resilience contracts. Product managers define acceptable degradation thresholds. Security team must approve any chaos experiment that involves auth, encryption, or data integrity. |
| **How** | Using Playwright's `page.route()` for application-level degradation injection, and Toxiproxy for network-level chaos. Experiments are defined as automated Playwright tests that assert specific resilience behaviors, not manual one-off demos. |

---

## Table of Contents

1. [What Chaos Engineering Means for Web Apps](#1-what-chaos-engineering-means-for-web-apps)
2. [The Three Principles of Chaos](#2-the-three-principles-of-chaos)
3. [Playwright `page.route()` for Degradation Injection](#3-playwright-pageroute-for-degradation-injection)
4. [Toxiproxy Primer: Network-Level Chaos](#4-toxiproxy-primer-network-level-chaos)
5. [Retry-Policy Validation](#5-retry-policy-validation)
6. [Circuit-Breaker Testing](#6-circuit-breaker-testing)
7. [Graceful Degradation Patterns](#7-graceful-degradation-patterns)
8. [Anti-Patterns](#8-anti-patterns)
9. [Decision Matrix: When to Use Chaos Testing](#9-decision-matrix-when-to-use-chaos-testing)
10. [Senior/Principal Perspective: Chaos as Empathy](#10-seniorprincipal-perspective-chaos-as-empathy)
11. [DevSecOps: Chaos for Security](#11-devsecops-chaos-for-security)
12. [Exercise: Latency Injection Test](#12-exercise-latency-injection-test)

---

## 1. What Chaos Engineering Means for Web Apps

### Beyond Infrastructure: The Frontend Blindspot

Traditional chaos engineering focuses on infrastructure—killing pods, severing network cables, exhausting disk space. These experiments validate that the underlying platform survives. But for a user, the platform surviving is invisible if the browser experience is broken.

A user does not experience "the Kubernetes cluster remained available." They experience "the checkout button did not respond for 12 seconds, so I closed the tab." Chaos engineering for web applications extends this discipline into the browser layer, asking: **when the services behind this page degrade, does the UI handle it gracefully?**

This is not a replacement for infrastructure chaos engineering. It is a complement. Infrastructure chaos validates that services stay up. Application chaos validates that the user experience degrades elegantly.

### The Scope of Application-Level Chaos

Application-level chaos includes:

- **API response degradation**: Latency injection, error status codes, partial JSON payloads, slow headers with fast bodies
- **Session and auth degradation**: Expired tokens, auth service timeouts, redirect loops
- **Resource degradation**: Images that load partially, fonts that fail to load, CSS that never downloads
- **Third-party widget degradation**: Embedded maps that freeze, chat widgets that hang, payment iframes that timeout

The goal is not to prevent failures—that is impossible. The goal is to ensure failures are **experienced as graceful degradation rather than catastrophic breakdown**.

### Why Playwright for Chaos

Playwright is uniquely suited for chaos testing because it operates at the boundary between the network and the UI. Unlike unit tests that mock HTTP clients in-process, Playwright's `page.route()` intercepts actual network requests in the browser context. This means the entire stack—browser caching, service workers, frontend code, HTTP/2 multiplexing—behaves exactly as it would in production, except the responses are controlled.

---

## 2. The Three Principles of Chaos

### Principle 1: Start in Staging

Every chaos experiment begins in an environment that mirrors production as closely as possible, but is not production. This is not a suggestion—it is a non-negotiable constraint.

Production chaos without safeguards is not chaos engineering; it is chaos. The difference is measured in customer impact and mean time to recovery.

A proper staging environment for chaos testing should have:

- Production-mirror architecture (same number of services, same load balancer configuration)
- Production-mirror data volumes (anonymized or synthetic)
- Isolated network segment (chaos experiments must not bleed into production traffic)
- Separate metrics and alerting namespace (so you can distinguish experiment metrics from production metrics)

```bash
# Environment checklist before any chaos experiment
CHAOS_ENVIRONMENT_CHECKLIST:
  - staging-dns-resolves-correctly: true
  - staging-load-matches-production-topology: true
  - staging-has-no-production-data: true
  - staging-alerting-is-isolated: true
  - staging-rollback-runbook-is-accessible: true
```

### Principle 2: Measure Steady State Before Injecting Failure

You cannot know that your chaos experiment had an impact if you do not first measure the steady state. Steady state is the baseline: what are your key metrics (error rate, latency, availability, user-visible error count) under normal conditions?

Define steady state metrics before every experiment:

| Metric | Steady State Value | Experiment Threshold | Alert Threshold |
|--------|-------------------|---------------------|-----------------|
| Login page load time | < 2s at P95 | < 5s acceptable | > 8s triggers rollback |
| API error rate | < 0.1% | < 5% acceptable | > 10% triggers rollback |
| Cart checkout success | > 99% | > 95% acceptable | < 90% triggers rollback |

The experiment only tells you something meaningful if you have a before and after. Without steady state measurement, you are guessing.

### Principle 3: Minimize Blast Radius

Blast radius is the scope of impact your chaos experiment can have. The goal is to maximize learning while minimizing blast radius.

Strategies for blast radius control:

- **Scope isolation**: Use feature flags to apply chaos only to a percentage of traffic (e.g., 1% of users experience degraded checkout API)
- **Time boxing**: Limit experiments to low-traffic windows (e.g., 2 AM to 4 AM UTC)
- **Automatic rollback**: Set a kill switch that automatically reverts all chaos injection if metrics breach alert thresholds
- **Observer pattern**: Have a human observer monitoring dashboards during the experiment with their hand on the rollback button

```typescript
// Blast radius control via traffic percentage
const BLAST_RADIUS = {
  percentage: 0.01,      // 1% of traffic
  duration: '10m',       // Maximum experiment duration
  autoRollback: {
    errorRateThreshold: 0.10,  // 10% error rate triggers rollback
    latencyP99Threshold: '8s'  // P99 latency > 8s triggers rollback
  },
  observer: 'on-call-sre'
};
```

---

## 3. Playwright `page.route()` for Degradation Injection

### Overview of `page.route()`

Playwright's `page.route()` intercepts network requests at the browser level. Unlike service mocks that run in the test process, `page.route()` runs in the actual browser context. This means service workers, HTTP caching, and browser-level retry logic all participate as they would in production.

The basic pattern:

```typescript
import { test, expect } from '@playwright/test';

test('API latency injection', async ({ page }) => {
  // Intercept all requests to the login API
  await page.route('**/api/v1/auth/login', async (route) => {
    // Inject 5 second delay before responding
    await new Promise(resolve => setTimeout(resolve, 5000));
    // Continue with a normal response
    await route.continue();
  });
  
  await page.goto('/login');
  // The login button click triggers the intercepted API call
  await page.click('#login-button');
  
  // Assert loading state is shown
  await expect(page.locator('.spinner')).toBeVisible();
  // Assert eventual success after the 5s delay
  await expect(page.locator('.dashboard')).toBeVisible({ timeout: 10000 });
});
```

### Latency Injection Patterns

#### Fixed Latency

The simplest pattern: add a constant delay to simulate a slow network or overloaded backend.

```typescript
test('fixed latency injection for image API', async ({ page }) => {
  await page.route('**/api/v1/images/**', async (route) => {
    await new Promise(resolve => setTimeout(resolve, 3000));
    await route.continue();
  });
  
  await page.goto('/product/123');
  // Page should render without blocking on images
  await expect(page.locator('.product-name')).toBeVisible();
});
```

#### Random Latency

Simulate real-world variance where requests take different amounts of time.

```typescript
function randomLatency(minMs: number, maxMs: number): Promise<void> {
  const delay = Math.floor(Math.random() * (maxMs - minMs)) + minMs;
  return new Promise(resolve => setTimeout(resolve, delay));
}

test('variable latency simulates real network conditions', async ({ page }) => {
  await page.route('**/api/v1/recommendations', async (route) => {
    await randomLatency(500, 4000);  // 500ms to 4s random delay
    await route.continue();
  });
  
  await page.goto('/homepage');
  // Recommendations may or may not load, but page should be usable
  await expect(page.locator('.main-content')).toBeVisible();
});
```

#### Percentile-Based Latency

Inject latency based on realistic distributions (e.g., most requests are fast, a tail percentage are slow).

```typescript
function percentileLatency(p95Ms: number): Promise<void> {
  const rand = Math.random();
  // 95% of requests: fast; 5% of requests: slow
  const delay = rand < 0.95 ? 50 : p95Ms;
  return new Promise(resolve => setTimeout(resolve, delay));
}

test('P95 latency injection for recommendations API', async ({ page }) => {
  await page.route('**/api/v1/recommendations', async (route) => {
    await percentileLatency(5000);  // 5% of requests take 5 seconds
    await route.continue();
  });
});
```

### Error Response Injection

#### HTTP Error Codes

Inject specific HTTP status codes to test error handling.

```typescript
test('handles 503 Service Unavailable gracefully', async ({ page }) => {
  await page.route('**/api/v1/checkout', async (route) => {
    await route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({
        error: 'Service temporarily unavailable',
        retryAfter: 30
      })
    });
  });
  
  await page.goto('/cart');
  await page.click('#checkout-button');
  
  // Assert graceful error message, not a blank screen
  await expect(page.locator('.error-message')).toContainText('temporarily unavailable');
  await expect(page.locator('.retry-button')).toBeVisible();
});
```

#### Network Errors

Simulate complete network failures (no response at all).

```typescript
test('handles network complete failure', async ({ page }) => {
  await page.route('**/api/v1/user/profile', async (route) => {
    // Abort the request entirely — simulates network cable cut
    await route.abort('failed');
  });
  
  await page.goto('/dashboard');
  // Should show cached profile data or fallback UI
  await expect(page.locator('.profile-fallback')).toBeVisible();
});
```

### Partial Response Injection

Return truncated or malformed responses to test parsing resilience.

```typescript
test('handles truncated JSON response', async ({ page }) => {
  await page.route('**/api/v1/products', async (route) => {
    // Return partial JSON — only first few bytes before cutoff
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ products: [{ id: 1, name: 'Item' }, { id: 2  // truncated!
    });
  });
  
  await page.goto('/products');
  // Should not crash — should show partial data or graceful error
  await expect(page.locator('.products-list')).toBeVisible();
});
```

### Timeout Simulation

Simulate requests that hang indefinitely, testing client-side timeout handling.

```typescript
test('login times out after threshold', async ({ page }) => {
  await page.route('**/api/v1/auth/login', async (route) => {
    // Never respond — simulating a completely hung backend
    // The client should eventually time out and show an error
    await new Promise(() => {});  // Never resolves
  });
  
  await page.goto('/login');
  await page.fill('#username', 'test@example.com');
  await page.fill('#password', 'password123');
  await page.click('#login-button');
  
  // Assert timeout error after client-side timeout threshold
  await expect(page.locator('.timeout-error')).toBeVisible({ timeout: 35000 });
  await expect(page.locator('.timeout-error')).toContainText('timed out');
});
```

---

## 4. Toxiproxy Primer: Network-Level Chaos

### What Toxiproxy Adds Over `page.route()`

`page.route()` operates at the browser request level. It intercepts requests after the browser has already resolved DNS and established any HTTP connection. Toxiproxy operates at the TCP level, giving you control over:

- **Actual network latency** (not just response delay — affects TCP handshake time, TLS negotiation)
- **Connection bandwidth limits** (throttle to 56kbps, 1Mbps, etc.)
- **Network partitions** (silently drop packets, create one-way connectivity loss)
- **TCP-level corruption** (bit flips in transit)

Use `page.route()` when you want to control the response. Use Toxiproxy when you want to control the network itself.

### Toxiproxy Architecture

Toxiproxy consists of a proxy server (`toxiproxy`) and a client library that communicates with it via a REST API. You route traffic through the proxy, then use the client to inject chaos.

```
Browser → Toxiproxy (port 8474) → Upstream Service
```

### Installation and Setup

```bash
# Install Toxiproxy
# macOS
brew install toxiproxy

# Docker (alternative)
docker run -d --name toxiproxy -p 8474:8474 -p 8475:8475 shopify/toxiproxy

# Verify installation
toxiproxy --version
```

### Basic Toxiproxy Configuration

```bash
# Create a proxy for localhost:8080 (your application under test)
toxiproxy-cli create myapp -l 127.0.0.1:18100 -r 127.0.0.1:8080

# Add latency toxic (5 second delay on all traffic)
toxiproxy-cli toxic add myapp --type latency --attribute latency=5000 --toxicName login-latency

# List all toxics on a proxy
toxiproxy-cli toxic list myapp

# Remove a toxic (rollback the chaos)
toxiproxy-cli toxic remove myapp --toxicName login-latency
```

### Network Latency with Toxiproxy

```typescript
// Playwright test using Toxiproxy for real network latency
import { test, expect } from '@playwright/test';
import { ToxiproxyClient } from 'toxiproxy';

test('network latency affects full request lifecycle', async ({ page }) => {
  const proxy = new ToxiproxyClient('http://localhost:8474');
  
  // Ensure proxy exists and is clean
  await proxy.createProxy('login-proxy', '127.0.0.1:18101', '127.0.0.1:8080');
  
  // Inject 3 second latency
  await proxy.addToxic('login-proxy', 'latency', 'downstream', 3000, {
    latency: 3000
  });
  
  try {
    // Point Playwright to the proxied URL
    await page.goto('http://localhost:18101/login');
    const start = Date.now();
    await page.click('#login-button');
    await expect(page.locator('.dashboard')).toBeVisible();
    const elapsed = Date.now() - start;
    
    // Login should take at least 3 seconds due to network latency
    expect(elapsed).toBeGreaterThan(2900);
  } finally {
    // CRITICAL: Remove the toxic after the test
    await proxy.removeToxic('login-proxy', 'login-latency');
  }
});
```

### Bandwidth Limiting

Simulate slow network connections (2G, 3G, satellite links).

```bash
# Limit bandwidth to 1 Mbps (125 KB/s)
toxiproxy-cli toxic add myapp --type bandwidth --attribute rate=125 --toxicName slow-link

# Limit bandwidth to 56kbps (dial-up simulation)
toxiproxy-cli toxic add myapp --type bandwidth --attribute rate=7 --toxicName dial-up
```

```typescript
test('page remains usable on 2G connection', async ({ page }) => {
  const proxy = new ToxiproxyClient('http://localhost:8474');
  await proxy.createProxy('slow-proxy', '127.0.0.1:18102', '127.0.0.1:8080');
  
  // 2G-like bandwidth: ~50kbps = ~6KB/s
  await proxy.addToxic('slow-proxy', 'bandwidth', 'downstream', 0, {
    rate: 6
  });
  
  try {
    // Page should render critical content first
    await page.goto('http://localhost:18102/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.critical-content')).toBeVisible({ timeout: 10000 });
  } finally {
    await proxy.removeToxic('slow-proxy', 'bandwidth-downstream');
  }
});
```

### Network Partition Simulation

Create one-way network partitions where traffic flows in one direction but not the other.

```bash
# Block downstream (server → client) traffic only
toxiproxy-cli toxic add myapp --type bandwidth --attribute rate=0 --toxicName no-downstream
```

```typescript
test('graceful handling of asymmetric network partition', async ({ page }) => {
  const proxy = new ToxiproxyClient('http://localhost:8474');
  await proxy.createProxy('partition-proxy', '127.0.0.1:18103', '127.0.0.1:8080');
  
  // Block server responses only — client requests reach server but responses never return
  await proxy.addToxic('partition-proxy', 'bandwidth', 'upstream', 0, {
    rate: 0
  });
  
  try {
    await page.goto('http://localhost:18103/api/health');
    // Should detect that server is unreachable and show appropriate message
    await expect(page.locator('.connection-lost')).toBeVisible({ timeout: 15000 });
  } finally {
    await proxy.removeToxic('partition-proxy', 'bandwidth-upstream');
  }
});
```

---

## 5. Retry-Policy Validation

### Why Retry Policies Need Testing

Retry policies are one of the most common resilience patterns, yet they are rarely tested explicitly. A typical retry policy looks like:

- Attempt a request
- If it fails with a transient error (5xx, timeout, network error), wait N milliseconds and retry
- If it fails again, wait 2N milliseconds and retry again
- After M attempts, give up and surface an error to the user

Testing this requires injecting transient failures—failures that fail the first few attempts but eventually succeed—and asserting that the client correctly implements the retry logic.

### Injecting Transient Failures

```typescript
test('client retries on transient 503 errors', async ({ page }) => {
  let attemptCount = 0;
  
  await page.route('**/api/v1/orders', async (route) => {
    attemptCount++;
    if (attemptCount < 3) {
      // First 2 attempts: 503 Service Unavailable
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Service overloaded', retryAfter: 1 })
      });
    } else {
      // 3rd attempt: success
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ orderId: 'ORD-12345', status: 'confirmed' })
      });
    }
  });
  
  await page.goto('/checkout');
  await page.click('#place-order');
  
  // Should eventually succeed after retrying
  await expect(page.locator('.order-confirmation')).toContainText('ORD-12345');
  expect(attemptCount).toBe(3);  // Verify 3 attempts were made
});
```

### Validating Exponential Backoff

Exponential backoff means the wait time between retries grows: 1s, 2s, 4s, 8s. Verify the timing.

```typescript
test('client implements exponential backoff', async ({ page }) => {
  const requestTimes: number[] = [];
  
  await page.route('**/api/v1/payments', async (route) => {
    requestTimes.push(Date.now());
    if (requestTimes.length < 3) {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Payment gateway overloaded' })
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ transactionId: 'TXN-789' })
      });
    }
  });
  
  const startTime = Date.now();
  await page.goto('/payment');
  await page.click('#pay-now');
  await expect(page.locator('.payment-success')).toBeVisible({ timeout: 30000 });
  
  // Calculate delays between retry attempts
  const delays = [
    requestTimes[1] - requestTimes[0],
    requestTimes[2] - requestTimes[1]
  ];
  
  // Delays should roughly double (exponential backoff)
  // Allow some tolerance for processing overhead: ~1s, ~2s
  expect(delays[0]).toBeGreaterThan(800);
  expect(delays[0]).toBeLessThan(1500);
  expect(delays[1]).toBeGreaterThan(1800);
  expect(delays[1]).toBeLessThan(2800);
});
```

### Testing Retry Exhaustion

When retries are exhausted, the UI should show a meaningful error, not a generic spinner.

```typescript
test('shows meaningful error after retry exhaustion', async ({ page }) => {
  await page.route('**/api/v1/cart', async (route) => {
    // Always fail — 10 attempts of 1 second each = 10 seconds total
    await route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Service unavailable' })
    });
  });
  
  await page.goto('/cart');
  await page.click('#refresh-cart');
  
  // Should fail after all retries are exhausted
  await expect(page.locator('.error-banner')).toBeVisible({ timeout: 20000 });
  await expect(page.locator('.error-banner')).toContainText('Unable to load cart');
  await expect(page.locator('.retry-button')).toBeVisible();
});
```

---

## 6. Circuit-Breaker Testing

### What Is a Circuit Breaker?

A circuit breaker is a pattern that stops making requests to a failing service after a threshold is reached. The pattern has three states:

1. **Closed**: Normal operation. Requests pass through.
2. **Open**: Service is considered failed. Requests fail immediately without trying.
3. **Half-Open**: After a cooldown period, allow one test request through. If it succeeds, close the circuit.

Circuit breakers protect systems from cascading failures. If the payment service is down, you do not want 1000 users clicking "Pay" and all getting errors. You want the circuit to open and show a graceful "Payment temporarily unavailable" message.

### Testing Circuit Breaker Open State

```typescript
test('circuit breaker opens after threshold failures', async ({ page }) => {
  let attemptCount = 0;
  
  await page.route('**/api/v1/inventory', async (route) => {
    attemptCount++;
    // Every request fails
    await route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Inventory service unavailable' })
    });
  });
  
  await page.goto('/product/ABC');
  await page.click('#check-availability');
  
  // After ~5 failures, the circuit breaker should open
  // Fast-forward requests (no actual retries in this test — simulate circuit open state)
  await page.waitForTimeout(1000);
  
  // Attempt another request — should fail immediately (circuit is open)
  const startTime = Date.now();
  await page.click('#check-availability');
  
  // Should fail immediately, not hang waiting for network
  await expect(page.locator('.circuit-open-warning')).toBeVisible({ timeout: 3000 });
  
  // Should be fast (< 500ms) since circuit is open and no actual request was made
  expect(Date.now() - startTime).toBeLessThan(500);
});
```

### Testing Circuit Breaker With Cached Fallback Data

```typescript
test('circuit breaker shows cached data while service is down', async ({ page }) => {
  // First, seed the cache with valid data
  await page.goto('/product/ABC');
  await page.waitForSelector('.price');
  const cachedPrice = await page.locator('.price').textContent();
  
  // Now simulate service failure
  await page.route('**/api/v1/inventory', async (route) => {
    await route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Service unavailable' })
    });
  });
  
  // Navigate back to the page — should show cached price
  await page.goto('/product/ABC');
  
  // Should show cached data with a staleness indicator
  await expect(page.locator('.price')).toContainText(cachedPrice || '');
  await expect(page.locator('.data-stale-indicator')).toBeVisible();
  await expect(page.locator('.data-stale-indicator')).toContainText('cached');
});
```

### Testing Circuit Breaker Recovery

```typescript
test('circuit breaker recovers when service comes back', async ({ page }) => {
  let failuresInjected = 0;
  
  await page.route('**/api/v1/inventory', async (route) => {
    if (failuresInjected < 5) {
      failuresInjected++;
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Service unavailable' })
      });
    } else {
      // After 5 failures, service recovers
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ available: true, quantity: 42 })
      });
    }
  });
  
  await page.goto('/product/ABC');
  
  // Trigger enough failures to open the circuit
  for (let i = 0; i < 5; i++) {
    await page.click('#check-availability');
    await page.waitForTimeout(100);
  }
  
  // Wait for circuit breaker cooldown (typically 30-60 seconds in real apps)
  // For test purposes, simulate the cooldown passing
  await page.evaluate(() => {
    // In a real app, you'd wait for the actual cooldown timer
    // Here, we trigger the circuit breaker reset manually for testing
    window.__test_helpers__?.resetCircuitBreaker('inventory');
  });
  
  // Now the next request should succeed
  await page.click('#check-availability');
  await expect(page.locator('.availability-result')).toContainText('In Stock');
});
```

---

## 7. Graceful Degradation Patterns

### Skeleton Screens

Skeleton screens show a placeholder UI while content is loading. They reduce perceived latency by giving users immediate feedback that content is coming.

```typescript
test('shows skeleton while recommendations load', async ({ page }) => {
  // Delay recommendations API response
  await page.route('**/api/v1/recommendations', async (route) => {
    await new Promise(resolve => setTimeout(resolve, 5000));
    await route.continue();
  });
  
  await page.goto('/homepage');
  
  // Skeleton should appear immediately
  await expect(page.locator('.recommendations-skeleton')).toBeVisible();
  
  // After data loads, skeleton is replaced with actual content
  await expect(page.locator('.recommendation-card')).toBeVisible({ timeout: 8000 });
  await expect(page.locator('.recommendations-skeleton')).not.toBeVisible();
});
```

### Stale-While-Revalidate

Stale-while-revalidate shows cached data immediately while fetching fresh data in the background.

```typescript
test('shows stale data while revalidating', async ({ page }) => {
  // First visit: load fresh data and cache it
  await page.goto('/dashboard');
  await page.waitForSelector('.user-greeting');
  const originalGreeting = await page.locator('.user-greeting').textContent();
  
  // Simulate stale data scenario
  await page.route('**/api/v1/user', async (route) => {
    // Delayed response simulates revalidation
    await new Promise(resolve => setTimeout(resolve, 2000));
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ name: 'Updated User' })
    });
  });
  
  // Trigger revalidation (e.g., refresh action)
  await page.click('.refresh-user-data');
  
  // Should show old (stale) data immediately
  await expect(page.locator('.user-greeting')).toContainText(originalGreeting || '');
  
  // Then update to new data
  await expect(page.locator('.user-greeting')).toContainText('Updated User', { timeout: 5000 });
});
```

### Cached User Data

When user-specific data fails to load, show previously cached data with a staleness indicator.

```typescript
test('displays cached user profile on API failure', async ({ page }) => {
  // First, load and cache the user profile
  await page.goto('/settings');
  await page.waitForSelector('.profile-name');
  const cachedName = await page.locator('.profile-name').textContent();
  
  // Now simulate API failure
  await page.route('**/api/v1/user/profile', async (route) => {
    await route.abort('failed');
  });
  
  // Navigate away and back (forces re-fetch)
  await page.goto('/dashboard');
  await page.goto('/settings');
  
  // Should show cached profile with staleness indicator
  await expect(page.locator('.profile-name')).toContainText(cachedName || '');
  await expect(page.locator('.stale-data-banner')).toBeVisible();
  await expect(page.locator('.stale-data-banner')).toContainText('offline');
});
```

### Offline Indicators

When the application detects it is offline, show a clear indicator that prevents user confusion.

```typescript
test('shows offline indicator when network fails', async ({ page }) => {
  await page.route('**/api/**', async (route) => {
    await route.abort('failed');
  });
  
  await page.goto('/dashboard');
  
  await expect(page.locator('.offline-banner')).toBeVisible();
  await expect(page.locator('.offline-banner')).toContainText('You are offline');
  
  // Actions that require network should show appropriate feedback
  await page.click('#save-changes');
  await expect(page.locator('.offline-error')).toBeVisible();
});
```

---

## 8. Anti-Patterns

### 1. Chaos in Production Without Safeguards

Injecting failures directly into production without rollback procedures, monitoring, or a designated on-call engineer is not chaos engineering—it is causing incidents. Every production chaos experiment must have:

- Pre-approved rollback runbook
- Active monitoring dashboard open
- On-call engineer on standby
- Executive approval for user-facing impact

### 2. Not Defining Steady-State Metrics

Running a chaos experiment without measuring the steady-state baseline means you have no way to compare before vs. after. You are guessing, not measuring. Every experiment needs defined metrics with measured baseline values.

### 3. Injecting Failure Without a Rollback Plan

Chaos experiments that cannot be stopped are dangerous. Every experiment must have an automatic kill switch that reverts all injection if metrics breach thresholds. "We will figure out how to stop it" is not a rollback plan.

### 4. Testing Only Complete Failures, Not Partial Degradation

Testing only "service completely down" misses the most common real-world failure mode: partial degradation. Users experience slow responses, partial data, intermittent errors—not binary on/off. Tests should cover:

- Latency increases
- Partial data returns
- Intermittent failures
- Timeout without complete failure

### 5. Ignoring User-Visible Impact

If a chaos experiment causes no user-visible degradation (everything is degraded but the UI hides it), that is actually a success story, not a failure. But if the degradation causes user-visible problems you did not anticipate, you have found a gap. Every chaos test should assert specific user-visible behaviors, not just backend metrics.

### 6. Not Involving the SRE Team

Chaos engineering intersects with reliability engineering. SREs own the service-level SLOs and the on-call rotation. They need to be partners in chaos experiment design, not surprised bystanders. Chaos experiments that SREs do not know about can trigger real alerts and page the on-call for a test, not an incident.

### 7. No Runbook for Chaos Experiments

A chaos experiment without a runbook is an experiment without a hypothesis and a success criteria. Every experiment should document:

- Hypothesis: "We believe that when the payment API fails, users will see a graceful error message within 3 seconds"
- Steady state: Baseline metrics before injection
- Experiment steps: What to inject and for how long
- Rollback procedure: How to stop the experiment
- Success criteria: How to know if the experiment validated the hypothesis

### 8. Treating Chaos as a One-Off Demo

Running chaos experiments once at a kickoff meeting and never again provides no ongoing reliability assurance. Chaos engineering is a continuous practice, not a theatrical demonstration. Experiments should be:

- Automated in CI/CD
- Scheduled for regular cadence (weekly game days minimum)
- Tracked over time to detect reliability regression

---

## 9. Decision Matrix: When to Use Chaos Testing

| Condition | Recommended Approach |
|-----------|---------------------|
| Application has 3+ external API dependencies | Full chaos suite: all API degradation scenarios |
| Application is a monolith with no external calls | Minimal chaos: focus on infrastructure (disk, memory) |
| User-facing resilience is a stated SLO | Automated chaos in CI for all SLO-bearing paths |
| Application is in early development (no users) | Skip chaos engineering — focus on functional testing |
| Application has security-critical auth flows | Chaos testing must include auth service degradation |
| Application is stateless and horizontally scaled | Infrastructure chaos (killing pods, network partitions) takes priority |
| Application uses third-party iframe widgets | Focus on widget degradation and fallback UI |
| Application has no monitoring/observability | Build observability first, then chaos to validate alerts |

---

## 10. Senior/Principal Perspective: Chaos as Empathy

### The Empathy Equation

Chaos engineering is, at its core, an empathy practice. It forces engineers to step outside the comfortable mental model of "the happy path" and into the experience of a user whose payment fails mid-checkout, whose session mysteriously expires, or whose product images never load.

When you inject 5 seconds of latency into the login API and watch a user stare at a spinning button, you gain a visceral understanding that "loading" is not a technical concept—it is a human experience. The user does not know the API is slow. They only know the button did not respond.

This understanding directly informs design decisions:

- A team that has run chaos experiments understands why skeleton screens matter
- An engineer who has watched the circuit breaker open understands why the fallback UI cannot say "internal error"
- A product manager who has seen the chaos test results understands why "eventual consistency" is not an acceptable user-facing message

### Chaos as a Communication Bridge

One of the most valuable outputs of a chaos engineering program is not the tests themselves—it is the shared vocabulary it creates between engineering, product, and business stakeholders.

When a product manager says "we cannot have checkout fail for more than 5 seconds," that is an SLO. When the SDET translates that into a chaos experiment that injects API failure and asserts a graceful error within 5 seconds, the SLO becomes executable. The chaos test IS the specification of the reliability requirement.

This is the SDET's unique value: bridging the gap between business requirements ("the app must be resilient") and technical implementation ("here is the automated test that validates this requirement").

### Scaling Chaos Engineering Across Teams

For principal-level SDETs, the mandate extends beyond writing chaos tests—it includes building the infrastructure and culture for chaos engineering to flourish across multiple teams.

Key considerations:

- **Centralized chaos tooling**: A shared library that teams can import, reducing per-team duplication
- **Chaos experiment registry**: A catalog of experiments with owners, schedules, and last-run results
- **Cross-team game days**: Quarterly events where multiple teams run coordinated chaos experiments against shared infrastructure
- **Chaos SLOs**: Including chaos experiment pass/fail rate as a reliability metric in engineering dashboards

---

## 11. DevSecOps: Chaos for Security

### DDoS Simulation

Simulate distributed denial-of-service conditions to verify rate limiting and graceful degradation.

```typescript
test('rate limiting activates under DDoS-like conditions', async ({ page }) => {
  // Rapid-fire requests to exhaust rate limit
  const requests: Promise<Response>[] = [];
  for (let i = 0; i < 150; i++) {
    requests.push(
      fetch('/api/v1/search', {
        method: 'POST',
        body: JSON.stringify({ query: `item-${i}` }),
        headers: { 'Content-Type': 'application/json' }
      })
    );
  }
  
  await Promise.all(requests);
  
  // 151st request should be rate-limited
  const response = await fetch('/api/v1/search', {
    method: 'POST',
    body: JSON.stringify({ query: 'test' }),
    headers: { 'Content-Type': 'application/json' }
  });
  
  expect(response.status).toBe(429);
  const body = await response.json();
  expect(body.error).toContain('rate limit');
});
```

### Auth Service Failure

Simulate complete failure of the authentication service and assert that the application falls back correctly.

```typescript
test('auth service failure triggers appropriate fallback', async ({ page }) => {
  await page.route('**/auth/**', async (route) => {
    await route.abort('failed');
  });
  
  await page.goto('/protected-dashboard');
  
  // Should redirect to login or show auth error, not expose protected content
  await expect(page).toHaveURL(/\/login/);
  await expect(page.locator('.auth-error-message')).toBeVisible();
});
```

### Certificate Expiry Simulation

Test how the application handles expired or invalid TLS certificates.

```typescript
test('handles expired certificate gracefully', async ({ page, context }) => {
  // Create a context with a custom certificate handler
  // that simulates certificate expiry
  const contextWithBadCert = await browser.newContext({
    ignoreHTTPSErrors: false
  });
  
  // Note: In a real test, you would need a test certificate
  // that is actually expired. This is a structural example.
  const pageWithBadCert = await contextWithBadCert.newPage();
  
  await pageWithBadCert.goto('https://localhost:8443/secure-page');
  
  // Browser should show security warning — verify app does not bypass it
  // or leak sensitive data before the warning is shown
  await expect(pageWithBadCert.locator('.security-warning')).toBeVisible();
});
```

---

## 12. Exercise: Latency Injection Test

### Objective

Write a Playwright test that injects 5-second latency on the login API endpoint and asserts that:
1. The UI displays a loading spinner immediately when the login button is clicked
2. The page eventually succeeds and navigates to the dashboard after the latency resolves
3. The total time measured is at least 4.5 seconds (accounting for test variance)

### Starting Context

You are testing a login flow at `/login`. The API endpoint is `**/api/v1/auth/login`. The page has a button with id `#login-submit`, a spinner with class `.login-spinner`, and a dashboard with class `.dashboard-content`.

### Requirements

1. Use `page.route()` to intercept the login API
2. Inject exactly 5000ms of latency before calling `route.continue()`
3. Assert `.login-spinner` is visible immediately after clicking `#login-submit`
4. Assert `.dashboard-content` is visible within 10 seconds
5. Measure elapsed time and assert it is greater than 4500ms

### Self-Grading Rubric

| Criterion | Points | How to Verify |
|-----------|--------|---------------|
| Uses `page.route()` correctly | 20 | Code intercepts `**/api/v1/auth/login` |
| Injects 5000ms latency | 15 | `setTimeout(resolve, 5000)` is present |
| Asserts spinner visibility | 15 | `await expect(page.locator('.login-spinner')).toBeVisible()` |
| Asserts dashboard load | 15 | `await expect(page.locator('.dashboard-content')).toBeVisible()` with timeout |
| Measures and asserts elapsed time | 20 | `Date.now()` before and after, assert > 4500ms |
| Handles page navigation (`page.goto`) | 10 | Login page is loaded before interaction |
| No hardcoded waits (`waitForTimeout` abuse) | 5 | Uses `toBeVisible()` with timeout, not `waitForTimeout(5000)` |
| **Total** | **100** | |

### Bonus Challenge

Extend the test to inject latency only on the **second** login attempt (simulating a transient failure that the client retried). Assert that the first attempt fails with a timeout-like error and the second attempt succeeds.

---

[← 67. Test Impact Analysis](./67_Test_Impact_Analysis.md) | [Index](../00_INDEX.md) | [→ 69. Observability for Tests](./69_Observability_For_Tests.md)