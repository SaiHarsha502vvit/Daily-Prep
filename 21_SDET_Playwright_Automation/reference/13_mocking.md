# Mocking & Network Interception

> The authoritative reference for intercepting network traffic in Playwright. `page.route` mechanics, `waitForResponse` patterns, GraphQL mocking, WebSocket mocking, HAR replay, request modification, response stubbing, the decision tree of "when to mock," and every production failure that's bitten teams.

---

## Table of contents

1. [The interception model](#1-the-interception-model)
2. [When to mock vs hit the real backend](#2-when-to-mock)
3. [`page.route` — exhaustive reference](#3-pageroute)
4. [Route handler disposal — the critical rule](#4-route-disposal)
5. [`route.continue`, `fulfill`, `abort`](#5-route-methods)
6. [`route.fallback` for layered routing](#6-routefallback)
7. [Pattern matching — globs vs regex vs functions](#7-pattern-matching)
8. [`page.waitForResponse` / `waitForRequest`](#8-waitforresponse)
9. [Mocking REST endpoints](#9-mocking-rest)
10. [Mocking GraphQL by operation](#10-mocking-graphql)
11. [Mocking WebSocket](#11-mocking-websocket)
12. [HAR recording and replay](#12-har)
13. [Network condition simulation](#13-network-conditions)
14. [The CDP escape hatch](#14-cdp-escape-hatch)
15. [Service Workers](#15-service-workers)
16. [Performance considerations](#16-performance)
17. [Common production failures](#17-common-production-failures)
18. [Anti-pattern catalog](#18-anti-pattern-catalog)

---

## 1. The interception model

Playwright lets tests INTERCEPT network requests before they leave the browser. The interception is:

- **Bidirectional** — see requests AND responses.
- **Modifiable** — change URL, method, headers, body before forwarding.
- **Mockable** — return a fake response without hitting the real server.
- **Blockable** — abort requests entirely.

### 1.1 The flow

```
Browser app → HTTP request
              ↓
        Playwright interceptor (if registered)
              ↓
   Decide: continue / fulfill / abort
              ↓
   - continue → forward to real server → response → browser
   - fulfill  → fake response → browser (real server NEVER hit)
   - abort    → error response → browser
```

### 1.2 What's interceptable

| Resource type | Interceptable |
|---|---|
| XHR / Fetch (API calls) | ✅ |
| Documents (HTML) | ✅ |
| Scripts (JS) | ✅ |
| Stylesheets (CSS) | ✅ |
| Images | ✅ |
| Fonts | ✅ |
| WebSockets | ✅ (separate API; see §11) |
| Service Worker fetches | ✅ |
| Server-Sent Events | ✅ |
| WebRTC | ❌ (peer-to-peer, doesn't go through browser network stack) |
| navigator.sendBeacon | ✅ |

---

## 2. When to mock

The "should I mock?" decision tree:

```
Is the dependency under your control?
├── No (third-party API, payment provider, OAuth IdP)
│   ├── Reliable in CI? → Probably hit it
│   └── Rate-limited / flaky / unavailable? → Mock
│
└── Yes
    ├── Testing the UI behaviour given specific data?
    │   └── Yes → Mock for determinism
    │
    ├── Testing the integration end-to-end?
    │   └── Yes → Hit the real backend
    │
    ├── Testing error states (500, timeout, malformed)?
    │   └── Yes → Mock — can't reliably trigger errors in real backend
    │
    └── Testing performance under specific network conditions?
        └── Mock with delays / network throttling
```

### 2.1 The general principle

**Mock everything you don't own.** Backends you control should be hit for real (in test envs) so integration is verified.

### 2.2 The exception — error-path tests

Even for owned backends, mocking is right when:
- You need a 500, 429, or timeout reliably.
- You need to test optimistic UI updates under specific server responses.
- You need to test analytics calls that you don't want to actually emit.

### 2.3 The trade-off — fidelity vs determinism

| | Real backend | Mock |
|---|---|---|
| Fidelity | High — catches integration bugs | Low — mocks can lie |
| Determinism | Variable — depends on env health | Total |
| Setup cost | Higher — must seed data | Lower |
| CI cost | Higher — backend dependency | Lower — self-contained |
| Maintenance | Real schema changes show up | Must update mocks manually |

Both have value. A healthy suite uses both: integration tests against real backend, UI/error-path tests with mocks.

---

## 3. `page.route`

The primary interception API.

### 3.1 Signature

```typescript
page.route(
  url: string | RegExp | (url: URL) => boolean,
  handler: (route: Route, request: Request) => Promise<void>,
  options?: { times?: number }
): Promise<void>
```

### 3.2 URL patterns

```typescript
// Glob — supports * (any) and ** (any path)
await page.route('**/api/citations', handler);
await page.route('**/api/citations/**', handler);

// Regex
await page.route(/\/api\/citations\/\d+/, handler);
await page.route(/.*\.png$/, handler);

// Function
await page.route(url => url.hostname === 'api.example.com', handler);
```

### 3.3 The handler

```typescript
await page.route('**/api/citations', async (route, request) => {
  console.log(request.method(), request.url());
  await route.continue();
});
```

Receives a `Route` (for disposal) and the `Request` (for inspection).

### 3.4 `times` option

```typescript
await page.route('**/api/once', handler, { times: 1 });
// Handler fires for first request, then is automatically unregistered.
```

Useful for one-shot mocks. After `times` invocations, the route is auto-removed.

### 3.5 Scoping

```typescript
// Per-page route — only THIS page's requests
await page.route('**/api/*', handler);

// Per-context route — all pages in the context
await context.route('**/api/*', handler);

// Per-browser-context route — multi-context
// (NOT supported; route is per-context)
```

For new tabs in the same context, context-level routes apply automatically.

### 3.6 Unregister

```typescript
await page.unroute('**/api/citations', handler);    // remove specific
await page.unroute('**/api/citations');             // remove all for that pattern
```

Usually not needed — routes are cleared when the page/context closes.

### 3.7 Multiple matching routes

```typescript
await page.route('**/api/**', handlerA);
await page.route('**/api/citations', handlerB);
```

If both match a request, the LAST registered wins. To layer them, use `route.fallback()` (see §6).

---

## 4. Route disposal

The single most important rule of `page.route`.

### 4.1 The rule

Every route handler MUST eventually call exactly ONE of:
- `route.continue()` — forward to real server
- `route.fulfill(...)` — return a fake response
- `route.abort(...)` — fail the request
- `route.fallback(...)` — delegate to a less-specific handler

### 4.2 What happens if you don't dispose

```typescript
await page.route('**/api/citations', async (route) => {
  console.log('Intercepted!');
  // Forgot route.continue() / fulfill / abort
});

await page.goto('/dashboard');  // hangs forever — citations request never completes
```

The request hangs indefinitely. The page never receives a response. Tests time out with mysterious errors.

This is the most common mocking bug. See Q16 in [practice solutions](../08_Practice_And_Quizzes/quiz_02_solutions/Q16_api_mocking_trap.ts).

### 4.3 What if you call two

```typescript
await route.continue();
await route.fulfill({ status: 200, body: '{}' });
// Error: Route is already handled!
```

Calling two disposal methods throws. Always call exactly ONE.

### 4.4 The defensive pattern

```typescript
await page.route('**/api/citations', async (route, request) => {
  try {
    if (request.method() === 'POST') {
      // Mock POSTs
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ id: 'new' }) });
    } else {
      // Forward GETs to real server
      await route.continue();
    }
  } catch (e) {
    // If our logic crashed, don't leave the request hanging
    console.error('Route handler error:', e);
    await route.abort('failed').catch(() => {});  // best-effort
  }
});
```

In production tests, defensive disposal prevents handler bugs from manifesting as timeout-flakes.

---

## 5. `route` methods

### 5.1 `continue`

```typescript
// Forward as-is
await route.continue();

// Forward with modifications
await route.continue({
  url: 'https://different.example.com/api/citations',     // change URL
  method: 'PUT',                                           // change method
  headers: { ...request.headers(), 'x-trace': 'true' },   // change headers
  postData: JSON.stringify({ patched: true }),             // change body
});
```

### 5.2 `fulfill`

```typescript
// Minimal — 200 with empty body
await route.fulfill();

// Full response
await route.fulfill({
  status: 200,
  contentType: 'application/json',
  headers: { 'x-cache': 'MISS', 'cache-control': 'no-store' },
  body: JSON.stringify({ id: 'mock-001', status: 'PAID' }),
});

// Response from a file
await route.fulfill({
  path: 'test-data/mock-citations.json',
});

// Response from a buffer
await route.fulfill({
  status: 200,
  contentType: 'application/pdf',
  body: fs.readFileSync('test-data/mock.pdf'),
});
```

### 5.3 `abort`

```typescript
// Default error code (failed)
await route.abort();

// Specific error
await route.abort('blockedbyclient');
await route.abort('connectionreset');
await route.abort('timedout');
await route.abort('namenotresolved');
await route.abort('failed');
await route.abort('internetdisconnected');
```

Useful for testing error-state UIs:

```typescript
await page.route('**/api/**', route => route.abort('timedout'));
await page.goto('/dashboard');
await expect(page.getByText('Network error')).toBeVisible();
```

### 5.4 `fetch` (since v1.39)

```typescript
const response = await route.fetch();
const body = await response.json();
body.amount = 999;
await route.fulfill({
  response,
  body: JSON.stringify(body),
});
```

`route.fetch()` performs the original request, lets you modify the response, then `fulfill` with the modified version. Useful for "real response with one field changed."

---

## 6. `route.fallback`

Layered routing — most-specific to least-specific.

### 6.1 The pattern

```typescript
// Generic — log everything
await page.route('**/*', async (route) => {
  console.log(route.request().url());
  await route.fallback();  // pass to next matching route
});

// Specific — mock /api/citations
await page.route('**/api/citations', async (route) => {
  if (route.request().method() === 'POST') {
    await route.fulfill({ status: 201, body: '{"id":"mock"}' });
  } else {
    await route.fallback();  // delegate to a less-specific route or real network
  }
});
```

`fallback` says "I decline to handle this; pass to the next handler." If no other handler matches, the request goes to the real network.

### 6.2 Order matters

Playwright tries handlers in REVERSE registration order (last registered = first tried). To make the generic handler run FIRST:

```typescript
await page.route('**/*', genericHandler);    // registered first → tried last
await page.route('**/api/citations', specific); // registered last → tried first
```

In practice: register specific handlers first, then generic. Specific handlers can `fallback` to the generic for non-matching cases.

### 6.3 Combining fulfill with fallback

You can fetch the real response, decide based on it, then either modify (`fulfill`) or pass through (`fallback`):

```typescript
await page.route('**/api/citations', async (route) => {
  const response = await route.fetch();
  if (response.status() === 200) {
    await route.fulfill({ response });   // forward as-is
  } else {
    // Mock the error response
    await route.fulfill({ status: 500, body: '{"error":"mocked"}' });
  }
});
```

---

## 7. Pattern matching

### 7.1 Glob patterns

```typescript
'**/api/*'              // any /api/foo  (one path segment)
'**/api/**'             // any /api/...  (multiple segments)
'**/api/citations/?'    // any /api/citations/X (one character)
'**/api/citations/{1,2}' // /api/citations/1 OR /api/citations/2
'**/*.png'              // any .png anywhere
'https://api.example.com/**'  // specific hostname
```

### 7.2 Regex patterns

```typescript
/\/api\/citations\/\d+/                  // numeric ID
/\/api\/citations\?status=(PAID|PENDING)/  // specific query param
```

Regex is more powerful but harder to read. Use globs for simple cases.

### 7.3 Function predicates

```typescript
await page.route(url => {
  return url.pathname.startsWith('/api/') &&
         url.searchParams.get('test') !== 'true';
}, handler);
```

Most flexible. Use when glob/regex can't express the condition.

### 7.4 `baseURL` interaction

```typescript
// playwright.config.ts: use.baseURL = 'https://app.example.com'

await page.route('/api/citations', handler);
// Matches https://app.example.com/api/citations? Probably no — relative URLs aren't auto-prefixed for matching.
```

Globs starting with `**/` match across origins. Use `**/api/citations` not `/api/citations`.

---

## 8. `waitForResponse` / `waitForRequest`

Observers — see traffic without intercepting.

### 8.1 `waitForResponse`

```typescript
const [response] = await Promise.all([
  page.waitForResponse(r => r.url().includes('/api/citations') && r.method() === 'POST'),
  page.locator('#save').click(),
]);

expect(response.ok()).toBeTruthy();
const body = await response.json();
expect(body.id).toBeDefined();
```

### 8.2 `waitForRequest`

```typescript
const [request] = await Promise.all([
  page.waitForRequest(r => r.url().includes('/analytics') && r.method() === 'POST'),
  page.locator('#submit').click(),
]);

const payload = request.postDataJSON();
expect(payload).toMatchObject({ event: 'submit', userId: '123' });
```

### 8.3 Observe vs intercept

| | `page.route` | `page.waitForResponse` |
|---|---|---|
| Real request goes through? | Maybe (depending on disposal) | Always |
| Can modify? | Yes | No |
| Can mock? | Yes | No |
| Side-effects on backend? | Maybe | Yes |
| Failure on missing event? | Hangs | Times out |

If you just want to see what happened — `waitForResponse`. If you want to control what the server returns — `page.route`.

### 8.4 The double-listener pattern

```typescript
// Capture every API response into an array
const responses: APIResponse[] = [];
page.on('response', r => { if (r.url().includes('/api/')) responses.push(r); });

await page.goto('/dashboard');
await page.locator('#refresh').click();
await page.waitForLoadState('networkidle');

expect(responses.map(r => r.status())).not.toContain(500);
```

Cumulative — captures everything, useful for "did anything error during the test."

### 8.5 Promise.all is essential

```typescript
// ❌ Race — listener may register too late
await page.click('#trigger');
const response = await page.waitForResponse('**/api/X');

// ✅ Listener first
const [response] = await Promise.all([
  page.waitForResponse('**/api/X'),
  page.click('#trigger'),
]);
```

Same rule as `waitForEvent` — register before triggering.

---

## 9. Mocking REST

### 9.1 Single endpoint mock

```typescript
await page.route('**/api/citations', async route => {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([
      { id: 'CIT-001', status: 'PENDING', amount: 150 },
      { id: 'CIT-002', status: 'PAID', amount: 250 },
    ]),
  });
});
```

### 9.2 Mock by method

```typescript
await page.route('**/api/citations', async (route) => {
  const method = route.request().method();
  if (method === 'GET')  await route.fulfill({ body: JSON.stringify(mockList) });
  if (method === 'POST') await route.fulfill({ status: 201, body: JSON.stringify({ id: 'new' }) });
  if (method === 'DELETE') await route.fulfill({ status: 204 });
});
```

### 9.3 Mock specific resource

```typescript
await page.route(/\/api\/citations\/(\w+)/, async (route, request) => {
  const id = request.url().split('/').pop();
  if (id === 'CIT-404') {
    await route.fulfill({ status: 404, body: '{"error":"not found"}' });
  } else {
    await route.fulfill({ body: JSON.stringify({ id, status: 'PAID' }) });
  }
});
```

### 9.4 Mock specific status code

```typescript
// Force every API call to return 500
await page.route('**/api/**', route => route.fulfill({
  status: 500,
  body: JSON.stringify({ error: 'Server error' }),
}));

await page.goto('/dashboard');
await expect(page.getByText('Something went wrong')).toBeVisible();
```

### 9.5 Mock with delays

```typescript
await page.route('**/api/slow', async route => {
  await new Promise(r => setTimeout(r, 2000));  // 2s delay
  await route.fulfill({ body: '{}' });
});
```

Useful for testing loading states.

### 9.6 Stateful mocks

```typescript
const citations: Citation[] = [];

await page.route('**/api/citations', async (route, request) => {
  if (request.method() === 'GET') {
    await route.fulfill({ body: JSON.stringify(citations) });
  } else if (request.method() === 'POST') {
    const body = request.postDataJSON();
    const newOne = { id: `CIT-${citations.length + 1}`, ...body };
    citations.push(newOne);
    await route.fulfill({ status: 201, body: JSON.stringify(newOne) });
  }
});
```

Builds an in-memory mock backend. Tests can verify create → read flows without a real server.

---

## 10. Mocking GraphQL

GraphQL has one endpoint, many operations. Differentiate by `operationName`.

### 10.1 Basic operation-based routing

```typescript
await page.route('**/graphql', async (route) => {
  if (route.request().method() !== 'POST') {
    await route.continue();
    return;
  }

  const body = route.request().postDataJSON() as { operationName?: string; query?: string; variables?: unknown };
  
  if (body.operationName === 'GetCustomer') {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: { customer: { id: 'C-001', name: 'Mocked Customer' } },
      }),
    });
    return;
  }
  
  if (body.operationName === 'UpdateCustomer') {
    await route.fulfill({
      status: 200,
      body: JSON.stringify({ data: { updateCustomer: { id: 'C-001' } } }),
    });
    return;
  }

  // Pass through unknown operations
  await route.continue();
});
```

### 10.2 The dispatch map

```typescript
type GqlMocks = Record<string, unknown | ((vars: any) => unknown)>;

async function setupGraphQLMocks(page: Page, mocks: GqlMocks): Promise<void> {
  await page.route('**/graphql', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }

    const body = route.request().postDataJSON() as { operationName?: string; variables?: unknown };
    const name = body.operationName ?? '';

    if (name in mocks) {
      const data = typeof mocks[name] === 'function'
        ? (mocks[name] as Function)(body.variables)
        : mocks[name];
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ data }),
      });
    } else {
      await route.continue();
    }
  });
}

// Usage
await setupGraphQLMocks(page, {
  GetCustomer: { customer: { id: 'C-001', name: 'Alice' } },
  GetCustomerOrders: (vars: { customerId: string }) => ({
    orders: [{ id: 'O-1', customerId: vars.customerId, amount: 100 }],
  }),
});
```

### 10.3 Mocking GraphQL errors

```typescript
await route.fulfill({
  status: 200,                                   // GraphQL errors are 200!
  body: JSON.stringify({
    data: null,
    errors: [{ message: 'Customer not found', extensions: { code: 'NOT_FOUND' } }],
  }),
});
```

GraphQL's convention: errors are reported in the response body, not via HTTP status. Most GraphQL servers return 200 even on errors.

### 10.4 Partial response (data + errors)

```typescript
await route.fulfill({
  status: 200,
  body: JSON.stringify({
    data: { customer: { id: 'C-001', name: 'Alice', orders: null } },
    errors: [{ path: ['customer', 'orders'], message: 'Permission denied' }],
  }),
});
```

GraphQL allows partial responses — some fields populated, others nulled with errors. Important to mock if your app handles this case.

---

## 11. Mocking WebSocket

WebSocket interception uses a separate API.

### 11.1 The pattern

```typescript
await page.routeWebSocket('wss://**/realtime', ws => {
  // ws is a WebSocketRoute — controls the WebSocket connection
  
  ws.onMessage(async (message) => {
    console.log('Client → Server:', message);
    
    // Echo back, or send mock
    if (message.includes('subscribe')) {
      await ws.send(JSON.stringify({ type: 'subscribed', channel: 'citations' }));
    }
  });

  // Simulate server push
  setTimeout(() => ws.send(JSON.stringify({ type: 'update', id: 'CIT-001', status: 'PAID' })), 1000);
});
```

### 11.2 Closing the connection

```typescript
await page.routeWebSocket('wss://**', ws => {
  ws.onMessage(msg => {
    if (JSON.parse(msg).type === 'auth-failed') {
      ws.close({ code: 1008, reason: 'Auth required' });
    }
  });
});
```

### 11.3 Connecting to the real server

```typescript
await page.routeWebSocket('wss://**', async ws => {
  // Connect to real server, proxy through
  await ws.connectToServer();
  ws.onMessage(msg => {
    console.log('Forwarding:', msg);
    // Messages auto-forward in both directions
  });
});
```

Useful for observing WS traffic without modifying.

### 11.4 The browser-side API

The page sees a normal `WebSocket` object. It doesn't know it's mocked. This is the same model as `page.route` for HTTP.

---

## 12. HAR

HTTP Archive — JSON format capturing all HTTP traffic.

### 12.1 Recording

```typescript
// playwright.config.ts
use: {
  recordHar: { path: 'test-results/network.har', mode: 'full' },
}
```

Or per-context:
```typescript
const context = await browser.newContext({
  recordHar: { path: 'test.har' },
});
```

Modes:
- `'minimal'` — request/response headers, no bodies
- `'full'` — everything including bodies (large files)

### 12.2 Replay

```typescript
await page.routeFromHAR('test-results/network.har', { update: false });
await page.goto('/dashboard');
// Network calls are served from the HAR — no real network hit
```

### 12.3 Use cases

| Scenario | HAR helps |
|---|---|
| Offline testing | Replay last-recorded traffic |
| Reproducing a bug | Capture HAR during bug, share for repro |
| Demo without backend | Record once, replay forever |
| Performance baseline | Compare HAR diffs across runs |

### 12.4 The `update` option

```typescript
await page.routeFromHAR('updates.har', { update: true });
// New requests: hit real server, append to HAR
// Existing requests: serve from HAR
```

Lets you incrementally build a HAR — useful for "extend coverage without losing what's already recorded."

### 12.5 Filtering during record

```typescript
recordHar: {
  path: 'api-only.har',
  urlFilter: /\/api\//,                  // only record API calls
}
```

Reduces HAR size by ignoring images, fonts, analytics.

---

## 13. Network conditions

Simulating slow networks, offline, etc.

### 13.1 Offline

```typescript
await context.setOffline(true);
await page.goto('/');
await expect(page.getByText('Offline')).toBeVisible();
await context.setOffline(false);
```

For testing PWA offline-first behaviour.

### 13.2 Slow network (via CDP)

```typescript
const client = await context.newCDPSession(page);
await client.send('Network.enable');
await client.send('Network.emulateNetworkConditions', {
  offline: false,
  downloadThroughput: (1.5 * 1024 * 1024) / 8,   // 1.5 Mbps
  uploadThroughput: (750 * 1024) / 8,             // 750 Kbps
  latency: 40,                                     // 40 ms RTT
});

await page.goto('/heavy-page');
// Page loads as if on slow 3G
```

CDP only — Chromium and Edge.

### 13.3 Per-request delay via route

```typescript
await page.route('**/api/**', async (route) => {
  await new Promise(r => setTimeout(r, 500));  // 500ms delay
  await route.continue();
});
```

Cross-browser. Less realistic than CDP throttling (doesn't simulate throughput limits).

### 13.4 Random failure injection

```typescript
await page.route('**/api/**', async (route) => {
  if (Math.random() < 0.1) {            // 10% failure rate
    await route.abort('timedout');
  } else {
    await route.continue();
  }
});
```

For chaos testing. Use rarely; can produce flaky tests.

---

## 14. CDP escape hatch

When `page.route` can't do something, drop to Chrome DevTools Protocol.

### 14.1 Getting a CDP session

```typescript
const client = await context.newCDPSession(page);
```

### 14.2 Common uses

```typescript
// Enable network instrumentation
await client.send('Network.enable');

// Set throttling
await client.send('Network.emulateNetworkConditions', { /* ... */ });

// Set custom user agent
await client.send('Network.setUserAgentOverride', { userAgent: 'TestBot/1.0' });

// Block specific URLs
await client.send('Network.setBlockedURLs', { urls: ['*.gif', 'tracker.example.com'] });

// Disable cache
await client.send('Network.setCacheDisabled', { cacheDisabled: true });

// Intercept at a lower level
await client.send('Fetch.enable', {
  patterns: [{ urlPattern: '*', requestStage: 'Request' }],
});
client.on('Fetch.requestPaused', async params => {
  // Lower-level than page.route
  await client.send('Fetch.continueRequest', { requestId: params.requestId });
});
```

### 14.3 Limitations

- CDP is Chromium-only (no Firefox, no WebKit).
- CDP APIs are not stable — minor Chrome upgrades can break.
- More complex than `page.route`.

Use CDP only when `page.route` genuinely can't do what you need.

---

## 15. Service Workers

Service Workers intercept network requests within their scope. Playwright can interact with them.

### 15.1 Registering a SW in the page

The page registers its own SW. Playwright's `page.route` runs BEFORE the SW.

```
Page → page.route (Playwright) → Service Worker → real network
```

### 15.2 Blocking SW

```typescript
use: {
  serviceWorkers: 'block',   // SW registration ignored
}
```

Useful for testing the non-SW behavior or when SW caching interferes with tests.

### 15.3 Inspecting SW

```typescript
const workers = context.serviceWorkers();
for (const sw of workers) {
  console.log('SW URL:', sw.url());
  await sw.evaluate(() => self.clients.matchAll().then(cs => cs.length));
}
```

### 15.4 Cache busting

```typescript
// Clear all SW caches
await context.serviceWorkers().forEach(async sw => {
  await sw.evaluate(async () => {
    const keys = await caches.keys();
    for (const key of keys) await caches.delete(key);
  });
});
```

Critical for tests where stale SW caches cause "old content" bugs.

---

## 16. Performance

### 16.1 Route handler overhead

Every intercepted request goes through your JS handler. Cost:

| Handler | Per-request overhead |
|---|---|
| `route.continue()` only | ~0.5 ms |
| Pattern match + continue | ~1 ms |
| `route.fulfill` | ~0.2 ms (no network) |
| `route.fetch` + modify + `fulfill` | network time + ~2 ms |

For a page with 100 requests, generic interception adds ~50–100 ms.

### 16.2 Pattern matching cost

- Glob: fast (string operations).
- Regex: fast for simple patterns, slower for complex backtracking.
- Function predicate: arbitrarily slow (it's your code).

Avoid expensive predicates that run on EVERY request.

### 16.3 Per-context routes

Registering at context level applies to all pages in that context. Cheaper than registering per-page when you have multiple tabs.

### 16.4 The `times: 1` optimisation

For one-shot mocks:

```typescript
await page.route('**/api/once', handler, { times: 1 });
```

After 1 hit, route is unregistered. Subsequent requests bypass the handler entirely.

---

## 17. Common production failures

### Failure 1 — Route handler doesn't dispose; test hangs

**Symptom:** Test times out at 30s; trace shows network request pending.

**Cause:** `page.route` handler didn't call continue/fulfill/abort.

**Fix:** Ensure every code path disposes. Use defensive try/catch.

### Failure 2 — Mocks aren't called

**Symptom:** Set up `page.route('**/api/foo', handler)` but test still hits real backend.

**Cause:** Route registered AFTER navigation. Or pattern doesn't match.

**Fix:** Register BEFORE the action that triggers the request. Log `route.request().url()` to verify the pattern matches.

### Failure 3 — Tests pass with mock but fail in production

**Symptom:** Test asserts response shape that doesn't match real API.

**Cause:** Mock data drifted from real API contract.

**Fix:** Validate mocks against real schema (Zod). Regenerate mocks from HAR captures of real traffic.

### Failure 4 — GraphQL mock matches wrong operation

**Symptom:** All operations return the same mock response.

**Cause:** Check on `operationName` is missing or wrong.

**Fix:** Log `route.request().postDataJSON()` to inspect what's actually sent.

### Failure 5 — WebSocket mock leaks across tests

**Symptom:** Test B sees test A's mocked WS messages.

**Cause:** Route registered at context level, not unregistered between tests.

**Fix:** Register at page level (cleaned up automatically), or explicit `unroute`.

### Failure 6 — HAR replay misses dynamic URLs

**Symptom:** Replaying a HAR — some requests pass through to real network.

**Cause:** Original recording had timestamped URLs (`/api/x?t=1234567`); replay request has different timestamp.

**Fix:** Strip dynamic query params before matching. Or capture and replay deterministic test scenarios.

### Failure 7 — Mock fulfill has wrong content-type

**Symptom:** App parses mock response as text, breaks because JSON expected.

**Cause:** Forgot `contentType: 'application/json'`.

**Fix:** Always set content-type explicitly.

### Failure 8 — Real backend hit during mocked test

**Symptom:** Mock should intercept, but real backend logs show traffic.

**Cause:** Pattern miss. E.g., backend uses `https://api.example.com` but test uses relative URL that doesn't match `**/api/**`.

**Fix:** Use absolute URLs in patterns, OR match by predicate function.

### Failure 9 — Stateful mock leaks across tests

**Symptom:** `citations` array in mock accumulates entries from previous tests.

**Cause:** Module-level state in the mock setup function.

**Fix:** Reset state in each test's setup, OR move state into the test/fixture.

### Failure 10 — CDP commands fail in non-Chromium browsers

**Symptom:** Code works in Chromium, throws in Firefox.

**Cause:** CDP is Chromium-specific.

**Fix:** Check `browserName === 'chromium'` before CDP calls. Use `page.route` cross-browser alternatives where possible.

---

## 18. Anti-pattern catalog

| ❌ | ✅ |
|---|---|
| `page.route` handler without disposal | Always continue/fulfill/abort exactly once |
| Mocking before the page object is created | Register routes BEFORE first navigation |
| Hardcoded full URLs in patterns | Glob with `**/` prefix for cross-environment |
| Stateful mock with module-level variables | State inside fixture/test scope |
| Mock everything (own + third-party) | Mock only what you don't control |
| Mock GraphQL by URL only | Match on `operationName` |
| GraphQL mock returns errors as 4xx | GraphQL convention is 200 with `errors` array |
| Mocks without schema validation | Validate mock shape with Zod |
| HAR with dynamic timestamps | Strip query params during replay |
| CDP-only code without browser check | Guard with `if (browserName === 'chromium')` |
| `waitForResponse` AFTER trigger | `Promise.all([waitForResponse, trigger])` |
| Mock for production-grade integration test | Real backend for integration |
| Network delay via `setTimeout(... 5000 ...)` | CDP throttling OR route delay |
| Mock data drifted from real API | Generate from OpenAPI / Zod schemas |
| Multiple route handlers without `fallback` | Use `fallback` for layering |
| Forget content-type in fulfill | Always set explicit content-type |
| Capture all responses with `page.on('response')` then assert later | Use `waitForResponse` for targeted assertions |
| Service Worker caches stale data across tests | `serviceWorkers: 'block'` or cache reset in fixture |

---

## Cross-references

- API testing fundamentals: [`./06_api_testing.md`](./06_api_testing.md)
- waitForEvent (events vs responses): [`./09_file_io.md#5-filechooser-event`](./09_file_io.md)
- Reliability — race conditions: [`./08_reliability.md#12-race-conditions`](./08_reliability.md)
- Practice problems: Q16, Q18 in [`../08_Practice_And_Quizzes/quiz_02_solutions/`](../08_Practice_And_Quizzes/quiz_02_solutions/)
