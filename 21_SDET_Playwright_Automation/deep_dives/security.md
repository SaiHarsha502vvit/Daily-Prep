# Security Testing

> Specialised reference for security tests an SDET can run in CI — auth enforcement, IDOR, XSS, CSRF, session security, ZAP integration, header verification. The reference covers AUTH primitives ([`reference/05_auth.md`](../reference/05_auth.md)); this covers SECURITY-ORIENTED test patterns.
>
> Scope: synthetic security tests for the dev pipeline. NOT a substitute for penetration testing or security audit.

---

## Table of contents

1. [The OWASP Top 10](#1-owasp-top-10)
2. [Auth enforcement tests](#2-auth-enforcement)
3. [IDOR (Insecure Direct Object Reference)](#3-idor)
4. [XSS](#4-xss)
5. [CSRF](#5-csrf)
6. [Session security](#6-session)
7. [Secure cookies and headers](#7-cookies-headers)
8. [Open redirect](#8-open-redirect)
9. [SSRF surface](#9-ssrf)
10. [Injection attempts](#10-injection)
11. [Rate limiting](#11-rate-limiting)
12. [Secrets in client code](#12-secrets-in-client)
13. [OWASP ZAP integration](#13-zap)
14. [What CI security testing doesn't catch](#14-not-caught)
15. [Common failures](#15-common-failures)

---

## 1. OWASP Top 10 (2021)

| Rank | Category | SDET can test? |
|---|---|---|
| A01 | Broken Access Control | ✅ Auth enforcement, IDOR |
| A02 | Cryptographic Failures | ⚠️ Partial (header / cookie checks) |
| A03 | Injection | ⚠️ Pattern-based — not exhaustive |
| A04 | Insecure Design | ❌ Architecture review |
| A05 | Security Misconfiguration | ✅ Header checks |
| A06 | Vulnerable Components | ⚠️ Use `npm audit`, Snyk |
| A07 | Identification / Auth | ✅ Session, login flow tests |
| A08 | Software / Data Integrity | ⚠️ Pact (contract), dep checks |
| A09 | Security Logging | ❌ Hard to test |
| A10 | SSRF | ⚠️ URL fuzzing |

Goal: catch low-hanging fruit early. NOT replace dedicated security testing.

---

## 2. Auth enforcement

The most important class. Verify every endpoint requires the right auth.

### 2.1 Pattern — unauthenticated rejection

```typescript
test('GET /api/admin/users without auth returns 401', async ({ request }) => {
  const response = await request.get('/api/admin/users');
  expect(response.status()).toBe(401);
});

test('GET /api/admin/users with invalid token returns 401', async ({ request }) => {
  const response = await request.get('/api/admin/users', {
    headers: { Authorization: 'Bearer invalid-token' },
  });
  expect(response.status()).toBe(401);
});

test('GET /api/admin/users with non-admin token returns 403', async ({ request, userToken }) => {
  const response = await request.get('/api/admin/users', {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  expect(response.status()).toBe(403);
});

test('GET /api/admin/users with admin token returns 200', async ({ request, adminToken }) => {
  const response = await request.get('/api/admin/users', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  expect(response.status()).toBe(200);
});
```

### 2.2 The matrix sweep

For each protected endpoint, test all four cases:
- No auth
- Invalid auth
- Authorised user lacking permission
- Authorised user with permission

For 50 endpoints × 4 cases = 200 tests. Auto-generate from an endpoint inventory.

### 2.3 Pattern — UI page protection

```typescript
test('admin page redirects unauthenticated user to login', async ({ page }) => {
  await page.goto('/admin/users');
  await page.waitForURL(/\/login/);
});

test('admin page rejects non-admin user', async ({ adminPage, userPage }) => {
  // adminPage logged in as admin — should access
  await adminPage.goto('/admin/users');
  await expect(adminPage).toHaveURL('/admin/users');

  // userPage logged in as regular user — should redirect
  await userPage.goto('/admin/users');
  await expect(userPage).toHaveURL(/\/(?:forbidden|dashboard)/);
});
```

---

## 3. IDOR

Insecure Direct Object Reference — a user can access another user's data by changing an ID.

### 3.1 The pattern

```typescript
test('user cannot access another user\'s order', async ({ request, userAToken, userBToken }) => {
  // User A creates an order
  const createResponse = await request.post('/api/orders', {
    headers: { Authorization: `Bearer ${userAToken}` },
    data: { item: 'X', quantity: 1 },
  });
  const orderId = (await createResponse.json()).id;

  // User B tries to access it
  const response = await request.get(`/api/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${userBToken}` },
  });
  expect(response.status()).toBe(404);  // OR 403 — depends on app
});
```

### 3.2 IDOR via sequential IDs

If your API uses sequential IDs (`/orders/1`, `/orders/2`, ...), it's easier to enumerate:

```typescript
test('IDOR scan on /orders/:id', async ({ request, userAToken }) => {
  // User A has order #100
  const myOrder = await request.post('/api/orders', { /* ... */ });
  const myId = (await myOrder.json()).id;

  // Try to access neighbours
  for (let i = myId - 5; i <= myId + 5; i++) {
    if (i === myId) continue;
    const response = await request.get(`/api/orders/${i}`, {
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    expect(response.status(), `Order ${i} should not be accessible`).not.toBe(200);
  }
});
```

### 3.3 UUIDs as a partial mitigation

UUIDs don't prevent IDOR — they just make enumeration harder. The CORRECT fix is server-side authorization checks.

---

## 4. XSS

### 4.1 Reflected XSS

User input echoed back into the page without escaping.

```typescript
test('reflected XSS in search', async ({ page }) => {
  await page.goto('/search?q=<script>window.__xss=true</script>');
  
  const xssExecuted = await page.evaluate(() => (window as any).__xss === true);
  expect(xssExecuted, 'XSS payload should NOT execute').toBe(false);
});
```

### 4.2 Stored XSS

Saved data executes when displayed.

```typescript
test('stored XSS in profile bio', async ({ request, page, userToken }) => {
  const payload = '<img src=x onerror="window.__xss=true">';
  await request.patch('/api/profile', {
    headers: { Authorization: `Bearer ${userToken}` },
    data: { bio: payload },
  });

  await page.goto('/profile');
  const xssExecuted = await page.evaluate(() => (window as any).__xss === true);
  expect(xssExecuted).toBe(false);
});
```

### 4.3 DOM XSS

JS reads URL fragment and writes to DOM.

```typescript
test('DOM XSS in profile fragment', async ({ page }) => {
  await page.goto('/profile#name=<img src=x onerror=window.__xss=true>');
  
  const xssExecuted = await page.evaluate(() => (window as any).__xss === true);
  expect(xssExecuted).toBe(false);
});
```

### 4.4 XSS payload sweep

Test multiple variants:

```typescript
const XSS_PAYLOADS = [
  '<script>__xss=true</script>',
  '<img src=x onerror=__xss=true>',
  '<svg onload=__xss=true>',
  'javascript:__xss=true',
  '<iframe src="javascript:__xss=true">',
  '"><script>__xss=true</script>',
];

for (const payload of XSS_PAYLOADS) {
  test(`XSS payload rejected: ${payload}`, async ({ page }) => {
    await page.goto(`/search?q=${encodeURIComponent(payload)}`);
    const xss = await page.evaluate(() => (window as any).__xss === true);
    expect(xss).toBe(false);
  });
}
```

### 4.5 Content Security Policy

Best XSS mitigation. Test:

```typescript
test('CSP header is set', async ({ request }) => {
  const response = await request.get('/');
  const csp = response.headers()['content-security-policy'];
  expect(csp).toBeDefined();
  expect(csp).toContain("default-src 'self'");
});
```

---

## 5. CSRF

Cross-Site Request Forgery — attacker tricks user into submitting requests from another origin.

### 5.1 CSRF token testing

```typescript
test('POST without CSRF token fails', async ({ request, userToken }) => {
  const response = await request.post('/api/transfer', {
    headers: { Authorization: `Bearer ${userToken}` },
    data: { amount: 100, to: 'recipient' },
  });
  expect(response.status()).toBe(403);   // CSRF check failed
});
```

### 5.2 SameSite cookie

```typescript
test('session cookie has SameSite=Lax or Strict', async ({ page }) => {
  await page.goto('/login');
  await login(page);

  const cookies = await page.context().cookies();
  const session = cookies.find(c => c.name === 'session');
  expect(session?.sameSite).toMatch(/Lax|Strict/);
});
```

---

## 6. Session

### 6.1 Session expiry

```typescript
test('session expires after inactivity', async ({ page }) => {
  await page.goto('/login');
  await login(page);

  // Simulate 30 minutes passing
  await page.clock.install({ time: new Date() });
  await page.clock.fastForward('30:00');

  await page.goto('/profile');
  await expect(page).toHaveURL(/\/login/);
});
```

### 6.2 Session fixation

```typescript
test('session ID rotates on login', async ({ page }) => {
  await page.goto('/');
  const cookiesBefore = await page.context().cookies();
  const sessionBefore = cookiesBefore.find(c => c.name === 'session')?.value;

  await page.goto('/login');
  await login(page);

  const cookiesAfter = await page.context().cookies();
  const sessionAfter = cookiesAfter.find(c => c.name === 'session')?.value;

  expect(sessionAfter).not.toBe(sessionBefore);  // rotated
});
```

### 6.3 Logout invalidates session

```typescript
test('logout invalidates session server-side', async ({ page, context }) => {
  await page.goto('/login');
  await login(page);
  const cookies = await context.cookies();
  const session = cookies.find(c => c.name === 'session')?.value;

  await page.getByRole('button', { name: 'Log out' }).click();

  // Try to use old session
  const response = await page.request.get('/api/me', {
    headers: { Cookie: `session=${session}` },
  });
  expect(response.status()).toBe(401);  // server-side invalidated
});
```

---

## 7. Cookies & headers

### 7.1 Secure cookies

```typescript
test('session cookie has Secure, HttpOnly, SameSite', async ({ page }) => {
  await page.goto('https://app.example.com/login');
  await login(page);

  const cookies = await page.context().cookies();
  const session = cookies.find(c => c.name === 'session')!;
  
  expect(session.httpOnly).toBe(true);
  expect(session.secure).toBe(true);
  expect(session.sameSite).toMatch(/Lax|Strict/);
});
```

### 7.2 Security headers

```typescript
test('responses have security headers', async ({ request }) => {
  const response = await request.get('/');
  const headers = response.headers();

  expect(headers['strict-transport-security']).toBeDefined();
  expect(headers['content-security-policy']).toBeDefined();
  expect(headers['x-frame-options']).toMatch(/DENY|SAMEORIGIN/);
  expect(headers['x-content-type-options']).toBe('nosniff');
  expect(headers['referrer-policy']).toBeDefined();
  expect(headers['permissions-policy']).toBeDefined();
});
```

### 7.3 Headers that should NOT be present

```typescript
test('no information disclosure', async ({ request }) => {
  const response = await request.get('/');
  const headers = response.headers();

  expect(headers['server']).toBeUndefined();      // server type
  expect(headers['x-powered-by']).toBeUndefined(); // tech stack
});
```

---

## 8. Open redirect

A URL parameter that, if attacker-controlled, can redirect users off-site.

```typescript
test('logout?next= is restricted to same origin', async ({ page }) => {
  await page.goto('/logout?next=https://evil.example.com/phish');
  await page.waitForLoadState('domcontentloaded');
  
  // Should land on our login, NOT on evil.example.com
  expect(page.url()).toMatch(/^https:\/\/app\.example\.com\//);
});
```

---

## 9. SSRF

Server-Side Request Forgery — server fetches a URL the attacker controls.

```typescript
test('webhook URL cannot point to internal IP', async ({ request, adminToken }) => {
  const internalUrls = [
    'http://localhost:8080/admin',
    'http://169.254.169.254/latest/meta-data/',  // AWS metadata
    'http://10.0.0.1/private',
    'file:///etc/passwd',
  ];

  for (const url of internalUrls) {
    const response = await request.post('/api/webhooks', {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { url },
    });
    expect(response.status(), `Should reject ${url}`).toBe(400);
  }
});
```

---

## 10. Injection

### 10.1 SQL injection patterns

```typescript
const SQL_PAYLOADS = [
  "' OR '1'='1",
  "'; DROP TABLE users; --",
  "1' UNION SELECT NULL--",
];

for (const payload of SQL_PAYLOADS) {
  test(`SQL injection rejected: ${payload}`, async ({ request }) => {
    const response = await request.get(`/api/search?q=${encodeURIComponent(payload)}`);
    // Should not return all data, leak schema, etc.
    expect(response.status()).not.toBe(500);  // no crash
    const body = await response.text();
    expect(body).not.toContain('SQLSTATE');
    expect(body).not.toContain('syntax error');
  });
}
```

### 10.2 Command injection

```typescript
test('shell command rejected in upload filename', async ({ page }) => {
  await page.goto('/upload');
  await page.locator('input[type="file"]').setInputFiles({
    name: 'test; rm -rf /.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('content'),
  });
  await page.getByRole('button', { name: 'Upload' }).click();
  
  // Server should reject the suspicious filename or sanitise it
  await expect(page.getByText('Invalid filename')).toBeVisible();
});
```

---

## 11. Rate limiting

```typescript
test('login endpoint has rate limit', async ({ request }) => {
  for (let i = 0; i < 20; i++) {
    const response = await request.post('/api/login', {
      data: { email: 'fake@example.com', password: 'wrong' },
    });
    if (i < 5) {
      expect(response.status()).toBe(401);  // first attempts: normal failure
    } else {
      expect(response.status()).toBe(429);  // rate-limited
      break;
    }
  }
});
```

---

## 12. Secrets in client code

```typescript
test('bundled JS does not contain secrets', async ({ page }) => {
  await page.goto('/');
  
  const scripts = await page.locator('script[src]').evaluateAll(els => 
    els.map(e => (e as HTMLScriptElement).src)
  );

  for (const src of scripts) {
    const response = await page.request.get(src);
    const content = await response.text();
    
    expect(content).not.toMatch(/sk_live_/);     // Stripe secret key
    expect(content).not.toMatch(/AKIA[0-9A-Z]{16}/);  // AWS access key
    expect(content).not.toMatch(/-----BEGIN.*PRIVATE KEY-----/);
    expect(content).not.toMatch(/password\s*[=:]\s*["'][^"']{8,}/i);
  }
});
```

For comprehensive scanning: use `gitleaks` / `trufflehog` in CI alongside.

---

## 13. ZAP

OWASP ZAP is a dedicated DAST scanner. Integrate as a CI step:

```yaml
- name: ZAP Baseline Scan
  uses: zaproxy/action-baseline@v0.9.0
  with:
    target: 'https://staging.example.com'
    rules_file_name: '.zap/rules.tsv'
    fail_action: false   # report but don't fail (avoid flake)
```

ZAP runs alongside Playwright. Playwright drives flows; ZAP scans concurrently:

```bash
# Run ZAP as a daemon
docker run -d --name zap -p 8080:8080 zaproxy/zap-stable zap.sh -daemon -port 8080

# Run Playwright with ZAP as proxy
PROXY_SERVER=http://localhost:8080 npx playwright test

# Get ZAP report
docker exec zap zap-cli report -o /tmp/report.html
```

ZAP sees all the traffic Playwright generates, scans for vulnerabilities passively. The active scan is more aggressive — only run against test environments.

---

## 14. What CI security testing doesn't catch

| | CI can catch | Need security review |
|---|---|---|
| Hard-coded credentials | ✅ (gitleaks) | — |
| Known CVEs in dependencies | ✅ (Snyk, npm audit) | — |
| Missing HSTS | ✅ (header check) | — |
| Authentication enforcement | ✅ (matrix tests) | — |
| Insecure deserialization | ❌ | ✅ |
| Race conditions in auth | ❌ | ✅ |
| Business logic flaws | ❌ | ✅ |
| Privilege escalation paths | ⚠️ Partial | ✅ |
| Social engineering | ❌ | ✅ |

CI catches the easy, automatable, and high-volume. Manual security review catches design flaws.

---

## 15. Common failures

### Failure 1 — XSS test passes even when XSS works

**Cause:** Test only checked a specific payload variant.
**Fix:** Multiple payload variants. Use a wordlist.

### Failure 2 — Rate limit test flaky

**Cause:** Rate limit window is per-IP; CI runners share IPs.
**Fix:** Use unique user/key per test; ensure rate-limit isolation.

### Failure 3 — IDOR test passes because of caching

**Cause:** Both tests hit the same cache; appears to work but doesn't actually check authorization.
**Fix:** Disable caches; assert at API layer not UI layer.

### Failure 4 — Tests against production accidentally

**Cause:** Wrong env var; tests scan production looking for vulns.
**Fix:** Strict env checks; never run security tests against production.

---

## Cross-references

- Auth tests primitives: [`../reference/05_auth.md`](../reference/05_auth.md)
- API testing (status codes, headers): [`../reference/06_api_testing.md`](../reference/06_api_testing.md)
- Mocking (header verification): [`../reference/13_mocking.md`](../reference/13_mocking.md)
- Secrets management: [`./security.md`](./security.md) (this doc)
