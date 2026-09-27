# 40. Security Test Automation — OWASP Top 10, ZAP & Auth Testing

**Navigation**: [← Chapter 39: Accessibility Testing](./39_Accessibility_Testing_axe_core.md) | [Index](../00_INDEX.md) | [→ Chapter 41: GraphQL & WebSocket Testing](../03_Real_World_Scenarios/41_GraphQL_WebSocket_Testing.md)

**Open-Source Tools Referenced:**

- **OWASP ZAP** — https://github.com/zaproxy/zaproxy (Apache 2.0) — the world's most widely used web security scanner
- **OWASP ZAP Automation Framework** — https://www.zaproxy.org/docs/automate/automation-framework/
- **jwt-decode** — https://github.com/auth0/jwt-decode (MIT) — JWT inspection without verification

**Online References:**

- https://owasp.org/Top10/ — OWASP Top 10 2021 (the authoritative list)
- https://owasp.org/www-project-web-security-testing-guide/ — OWASP Web Security Testing Guide (WSTG)
- https://cheatsheetseries.owasp.org/ — OWASP Cheat Sheet Series
- https://portswigger.net/web-security — PortSwigger Web Security Academy (free, interactive)
- https://www.zaproxy.org/docs/ — ZAP documentation

**Cross-references (this repo):**

- [`19_Console_Scripts_Security.md`](./19_Advanced_Console_Scripts_Security.md) — Ch19 console-based security scripts
- [`31_API_Mocking_page_route.md`](../03_Real_World_Scenarios/31_API_Mocking_page_route.md) — page.route() for testing auth rejection

---

## 5W1H

- **WHAT**: Automated testing that verifies your application resists common security vulnerabilities — from Playwright-based auth enforcement tests to full OWASP ZAP scanner integration.
- **WHY**: The OWASP Top 10 represents the most critical web security risks. Enterprise portals handling financial data (citations, payments) are high-value targets. A single IDOR vulnerability (accessing another customer's citation) is a GDPR breach. A missing auth check is a data leak. Automated security tests catch these at the PR level, not in a penetration test 6 months later.
- **WHO**: All SDETs — not just security specialists. 70% of security testing is methodical validation that can be automated.
- **WHEN**: Security tests run in CI on every PR (fast subset) and nightly (full ZAP scan).
- **HOW**: Three layers — (1) Playwright auth enforcement tests, (2) IDOR/privilege escalation tests, (3) OWASP ZAP for automated vulnerability scanning.

---

## 0. War Stories — Security Bugs That Automated Tests Would Have Caught

### IDOR: the citation that belonged to another customer

A CRM application displayed citation details at `/citations/{id}`. The ID was sequential: 1001, 1002, 1003. A penetration tester authenticated as customer A, then changed the URL to `/citations/1000`. They saw customer B's citation: name, address, case notes, pending fine amount.

This is **A01 Broken Access Control** — the most common OWASP vulnerability in 2021. The fix (checking that the citation belongs to the authenticated user) took 15 minutes. The bug had been in production for 14 months.

An automated IDOR test that creates two customer accounts and verifies each can only access their own citations would have caught this on day 1. The test is in Section 3 of this chapter.

### Missing rate limiting: the credential stuffing window

The login endpoint had no rate limiting. A credentialed penetration tester ran a credential stuffing attack (1000 username/password combinations from a leaked database) using an automated tool. The test lasted 4 minutes and found 7 valid credential pairs.

This is **A07 Identification and Authentication Failures**. The Playwright test for this is 12 lines: try to log in 5 times with a wrong password in quick succession, assert that the 6th attempt is rejected with a rate-limit error or CAPTCHA.

The pentest cost $8,000. The Playwright test runs in 30 seconds.

### Exposed stack trace in the error response

A QA engineer sent a malformed JSON payload to the citation creation endpoint. The API returned:

```json
{
  "error": "SyntaxError: Unexpected token } in JSON at position 42",
  "stack": "at JSON.parse (<anonymous>)\n    at /app/src/routes/citations.js:145:23\n    ..."
}
```

The stack trace revealed: the server technology (Node.js), the file structure (`/app/src/routes/`), and the exact line number. This is **A05 Security Misconfiguration** — stack traces in production API responses.

A simple Playwright API test that sends a malformed request and asserts the response does NOT contain `"stack"` or `"/app/"` would have caught this. Added to the security test suite, it takes 5 seconds to run.

---

## 1. OWASP Top 10 — What You're Testing Against

From [owasp.org/Top10](https://owasp.org/Top10/) (2021 version):

```
A01 — Broken Access Control     (was #5, now #1 — most prevalent)
  → Can user A see user B's data?
  → Can a customer access admin endpoints?
  → Test: IDOR checks, role-based access enforcement

A02 — Cryptographic Failures    (was #3)
  → Are passwords hashed? Are tokens short-lived?
  → Is sensitive data in URLs or logs?
  → Test: response body scanning, localStorage inspection

A03 — Injection                 (was #1 for decades)
  → SQL injection, XSS, template injection
  → Test: input validation with malicious payloads

A04 — Insecure Design           (new in 2021)
  → Missing rate limiting, missing MFA for sensitive operations
  → Test: brute force simulation, rate limit verification

A05 — Security Misconfiguration
  → Verbose error messages, debug endpoints exposed
  → Test: check error responses don't leak stack traces

A06 — Vulnerable Components
  → npm audit, Dependabot alerts
  → Test: dependency scanning in CI

A07 — Auth and Session Failures (was #2 Broken Auth)
  → Session tokens not invalidated after logout
  → Weak token entropy
  → Test: logout + reuse token attempt

A08 — Software and Data Integrity Failures (new)
  → Unsigned updates, insecure deserialization
  → Less directly testable at SDET level

A09 — Logging and Monitoring Failures
  → Are security events being logged?
  → Test: verify audit log entries after sensitive operations

A10 — Server-Side Request Forgery (SSRF) (new)
  → App fetches external URLs without validation
  → Test: inject internal URLs in user-supplied fields
```

### The SDET's OWASP Checklist

Not all OWASP Top 10 vulnerabilities are easily testable via automated scripts. Here is the SDET focus list:

- [x] **A01 (Access Control)**: Write IDOR tests (Customer A tries to view Customer B's data).
- [x] **A03 (Injection)**: Inject XSS and SQLi payloads into form fields and API parameters. Verify 200 OK (safe handling) or 400 Bad Request, NOT 500 Internal Error.
- [x] **A05 (Security Misconfig)**: Assert that security response headers (HSTS, CSP, X-Frame-Options) are present.
- [x] **A07 (Auth & Session)**: Verify unauthorized access redirects to login. Verify token invalidation on logout.
- [x] **A09 (Logging)**: (If applicable) Use Playwright to trigger a failed login, then query the backend audit log API to assert the event was recorded.

---

## 2. Layer 1 — Auth Enforcement Tests (Playwright)

The most impactful security tests an SDET can write: verify that unauthenticated and unauthorised users cannot access protected resources.

```typescript
// tests/specs/security/auth-enforcement.spec.ts
// These tests use NO storageState — they test what unauthenticated users see

import { test, expect } from "@playwright/test"; // NOT the custom fixtures

test.describe("Authentication Enforcement @security @auth", () => {
  // No storageState — these tests are genuinely unauthenticated

  // OWASP A07: Auth and Session Failures
  test("Unauthenticated user is redirected to login", async ({ page }) => {
    await page.goto("/citations");
    // Should redirect to login — not show the citations page
    await expect(page).toHaveURL(/\/login|\/auth|\/signin/, {
      timeout: 10_000,
    });
    // And: no citation data should be visible
    await expect(page.locator(".citation-data")).toHaveCount(0);
  });

  test("API returns 401 without Authorization header", async ({ request }) => {
    const response = await request.get(
      `${process.env.API_BASE_URL}/api/v2/citations`,
    );
    // Must return 401 — not 200, not 403, not 500
    expect(response.status()).toBe(401);
    // Must NOT leak data in the error body
    const body = await response.json();
    expect(body).not.toHaveProperty("data");
    expect(body).not.toHaveProperty("citations");
  });

  test("Expired token is rejected with 401", async ({ request }) => {
    // A known-expired JWT (generated in the past, expired)
    // Use jwt-decode to verify it's actually expired: https://github.com/auth0/jwt-decode
    const expiredToken = process.env.EXPIRED_TEST_TOKEN!;

    const response = await request.get(
      `${process.env.API_BASE_URL}/api/v2/citations`,
      {
        headers: { Authorization: `Bearer ${expiredToken}` },
      },
    );
    expect(response.status()).toBe(401);

    const body = await response.json();
    // The error must say token expired — not a generic error (helps clients handle it)
    expect(JSON.stringify(body)).toMatch(/expired|token|invalid/i);
  });

  // OWASP A07: Session invalidation after logout
  test("Token is invalid after logout", async ({ browser }) => {
    // Step 1: Login and capture the token
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto("/login");
    await page.fill("#email", process.env.TEST_CUSTOMER_EMAIL!);
    await page.fill("#password", process.env.TEST_CUSTOMER_PASSWORD!);
    await page.click("#loginBtn");
    await page.waitForURL("**/dashboard", { timeout: 15_000 });

    // Capture the token from localStorage
    const token = await page.evaluate(() =>
      localStorage.getItem("access_token"),
    );
    expect(token).toBeTruthy();

    // Step 2: Logout
    await page.click('[data-testid="logout-btn"]');
    await page.waitForURL("**/login", { timeout: 10_000 });

    // Step 3: Try using the old token — must fail.
    // Import once and reuse; `request` here is the APIRequest FACTORY from the
    // module (not the per-test `request` fixture), so it needs .newContext().
    const { request: apiRequest } = await import("@playwright/test");
    const apiContext = await apiRequest.newContext();
    const response = await apiContext.get(
      `${process.env.API_BASE_URL}/api/v2/citations`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    // After logout, the server must invalidate the token
    // Acceptable: 401 (server-side blacklist) or still valid if using short-lived stateless JWT
    // For stateless JWT — at minimum, verify the token expires soon (< 15 minutes from now)
    if (response.status() === 200) {
      // Stateless JWT — verify it will expire soon
      const { jwtDecode } = await import("jwt-decode");
      const decoded = jwtDecode<{ exp: number }>(token!);
      const expiresIn = decoded.exp * 1000 - Date.now();
      expect(
        expiresIn,
        "Token should expire within 15 minutes of issue",
      ).toBeLessThan(15 * 60 * 1000);
    } else {
      expect(response.status()).toBe(401); // server-side invalidation
    }

    await context.close();
    await apiContext.dispose();
  });

  // OWASP A01/A07: Auth Bypass via Forced Browsing
  test("Auth bypass: Forced browsing to private routes is blocked", async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // 1. Unauthenticated user navigates directly to a private dashboard route
    const response = await page.goto("/dashboard");

    // 2. The app must intercept and redirect to login, OR return 401/403
    await expect(page).toHaveURL(/.*login.*/);

    // 3. And crucially, no sensitive data should be leaked in the initial response HTML
    const content = await page.content();
    expect(content).not.toContain("Welcome, Customer");

    await context.close();
  });
});
```

---

## 3. Layer 2 — IDOR Tests (Broken Access Control)

**IDOR** (Insecure Direct Object Reference) is the #1 web vulnerability (OWASP A01). It occurs when a user can access another user's data by guessing or enumerating an ID.

```typescript
// tests/specs/security/idor.spec.ts
// These tests need TWO accounts: customer A and customer B
// Each has their own citation, and neither should see the other's

test.describe("IDOR — Broken Access Control @security @a01", () => {
  let customerAToken: string;
  let customerBToken: string;
  let customerACitationId: string;
  let customerBCitationId: string;

  test.beforeAll(async ({ request }) => {
    // Create Customer A's citation
    const respA = await authenticatedRequest(request, "CUSTOMER_A").post(
      "/api/v2/citations",
      {
        data: PayloadsCitation.pending({
          customerId: process.env.CUSTOMER_A_USER_ID,
        }),
      },
    );
    customerACitationId = (await respA.json()).citationId;

    // Create Customer B's citation
    const respB = await authenticatedRequest(request, "CUSTOMER_B").post(
      "/api/v2/citations",
      {
        data: PayloadsCitation.pending({
          customerId: process.env.CUSTOMER_B_USER_ID,
        }),
      },
    );
    customerBCitationId = (await respB.json()).citationId;
  });

  // IDOR Test: Customer B cannot read Customer A's citation
  test("IDOR: Customer B cannot read Customer A citation", async ({
    request,
  }) => {
    const response = await authenticatedRequest(request, "CUSTOMER_B").get(
      `/api/v2/citations/${customerACitationId}`,
    );
    // Must return 403 (Forbidden) or 404 (hide existence) — NOT 200
    expect(
      [403, 404],
      `Customer B should not access Customer A's citation`,
    ).toContain(response.status());
    if (response.status() === 200) {
      // Definitely a vulnerability — fail with detail
      throw new Error(
        `[CRITICAL SECURITY] IDOR: Customer B read Customer A's citation ${customerACitationId}`,
      );
    }
  });

  // IDOR Test: Customer B cannot DELETE Customer A's citation
  test("IDOR: Customer B cannot delete Customer A citation", async ({
    request,
  }) => {
    const response = await authenticatedRequest(request, "CUSTOMER_B").delete(
      `/api/v2/citations/${customerACitationId}`,
    );
    expect([403, 404]).toContain(response.status());
    // Verify it still exists (not deleted)
    const verifyResponse = await authenticatedRequest(
      request,
      "CUSTOMER_A",
    ).get(`/api/v2/citations/${customerACitationId}`);
    expect(verifyResponse.status()).toBe(200);
  });

  // Role escalation: Customer cannot access admin endpoint
  test("Privilege escalation: Customer cannot access admin endpoint", async ({
    request,
  }) => {
    const response = await authenticatedRequest(request, "CUSTOMER_A").get(
      `/api/v2/admin/users`, // admin-only endpoint
    );
    expect([401, 403]).toContain(response.status());
  });

  // Role escalation: Customer cannot PATCH another user's role
  test("Privilege escalation: Customer cannot elevate own role", async ({
    request,
  }) => {
    const response = await authenticatedRequest(request, "CUSTOMER_A").patch(
      `/api/v2/users/${process.env.CUSTOMER_A_USER_ID}`,
      { data: { role: "ADMIN" } }, // attempt to give self admin role
    );
    expect([403, 422]).toContain(response.status());

    // Verify role did NOT change
    const verify = await authenticatedRequest(request, "CUSTOMER_A").get(
      "/api/v2/users/me",
    );
    const user = await verify.json();
    expect(user.role).not.toBe("ADMIN");
  });
});
```

---

## 4. Layer 3 — Input Validation (Injection Prevention)

```typescript
// OWASP A03: Injection — test that malicious inputs are sanitised
// Reference: https://owasp.org/www-community/attacks/xss/

test.describe("Input Validation — Injection Prevention @security @a03", () => {
  // XSS payloads — source: OWASP XSS Cheat Sheet
  // https://cheatsheetseries.owasp.org/cheatsheets/XSS_Filter_Evasion_Cheat_Sheet.html
  const xssPayloads = [
    '<script>document.title="XSS"</script>',
    "<img src=x onerror=alert(1)>",
    '"><script>alert(1)</script>',
    "javascript:alert(1)",
    "<svg/onload=alert(1)>",
  ];

  for (const payload of xssPayloads) {
    test(`XSS: input "${payload.slice(0, 30)}..." is sanitised`, async ({
      page,
    }) => {
      const jsErrors: string[] = [];
      const dialogMessages: string[] = [];

      // Detect if XSS fires
      page.on("pageerror", (err) => jsErrors.push(err.message));
      page.on("dialog", async (dialog) => {
        dialogMessages.push(dialog.message());
        await dialog.dismiss();
      });

      await page.goto("/citations/new");
      await page.locator("#notes").fill(payload); // try injecting in a text field
      await page.locator("#submitBtn").click();

      await page.waitForLoadState("networkidle", { timeout: 5_000 });

      // If an alert dialog appeared → XSS succeeded → test fails
      expect(
        dialogMessages,
        `XSS payload triggered alert: ${payload}`,
      ).toHaveLength(0);

      // If document title changed → XSS succeeded
      const title = await page.title();
      expect(title, `XSS payload changed page title`).not.toBe("XSS");
    });
  }

  // SQL injection — the API must handle these without 500 errors or data leakage
  // Reference: https://owasp.org/www-community/attacks/SQL_Injection
  const sqlPayloads = [
    "' OR '1'='1",
    "'; DROP TABLE citations;--",
    "1' UNION SELECT * FROM users--",
    '" OR "1"="1',
  ];

  for (const payload of sqlPayloads) {
    test(`SQL Injection: "${payload.slice(0, 30)}..." is handled safely`, async ({
      request,
      account,
    }) => {
      const response = await request.get(
        `${process.env.API_BASE_URL}/api/v2/citations`,
        {
          headers: HeadersCrm.bearer(account.accessToken),
          params: { customerId: payload }, // inject in query param
        },
      );

      // Must NOT return 500 (internal error = possible injection)
      // 400 (bad request) or empty 200 are acceptable
      expect(
        response.status(),
        `SQL injection caused server error: ${payload}`,
      ).not.toBe(500);

      // Must NOT return rows from other customers (data leakage)
      if (response.status() === 200) {
        const body = await response.json();
        expect(
          body.data ?? [],
          "SQL injection returned unexpected data",
        ).toHaveLength(0);
      }
    });
  }

  // OWASP A01/A05: CSRF (Cross-Site Request Forgery) Verification
  // Reference: https://owasp.org/www-community/attacks/csrf
  test("CSRF: POST requests without valid anti-CSRF token are rejected", async ({
    request,
    account,
  }) => {
    // Attempt state-changing operation without CSRF token header
    const response = await request.post(
      `${process.env.APP_BASE_URL}/api/v2/citations`,
      {
        headers: {
          Cookie: `session=${account.sessionCookie}`, // Has auth cookie
          // MISSING: 'X-CSRF-Token': account.csrfToken
        },
        data: { amount: 100 },
      },
    );

    // Should be rejected by anti-CSRF middleware
    expect(
      [403, 401],
      "API must reject state changes missing CSRF tokens",
    ).toContain(response.status());
  });
});
```

---

## 5. Layer 4 — OWASP ZAP Automated Scanner

**OWASP ZAP** ([zaproxy.org](https://www.zaproxy.org/)) is the world's most popular open-source web security scanner. It runs as a proxy and actively tests for vulnerabilities.

### Docker-Based ZAP Scan (CI-Friendly)

```yaml
# .github/workflows/security.yml — nightly security scan
name: Security Scan (OWASP ZAP)

on:
  schedule:
    - cron: "0 2 * * 1-5" # Monday-Friday at 2am UTC
  workflow_dispatch: # manual trigger

jobs:
  zap-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run ZAP Baseline Scan
        uses: zaproxy/action-baseline@v0.12.0
        with:
          target: ${{ secrets.STAGING_APP_URL }}
          rules_file_name: ".zap/rules.tsv" # configure which rules to fail/warn/ignore
          cmd_options: "-a" # include ajax spider (for React/D365 apps)
          docker_name: "ghcr.io/zaproxy/zaproxy:stable"

      # For authenticated scanning:
      - name: Run ZAP Authenticated Scan
        uses: zaproxy/action-full-scan@v0.10.0
        with:
          target: ${{ secrets.STAGING_APP_URL }}
          token: ${{ secrets.GITHUB_TOKEN }}
          docker_name: "ghcr.io/zaproxy/zaproxy:stable"
          cmd_options: '-z "-config replacer.full_list(0).description=auth -config replacer.full_list(0).enabled=true -config replacer.full_list(0).matchtype=REQ_HEADER -config replacer.full_list(0).matchstr=Authorization -config replacer.full_list(0).replacement=Bearer ${{ secrets.ZAP_AUTH_TOKEN }}"'
```

### ZAP Rules Configuration (`.zap/rules.tsv`)

```
# .zap/rules.tsv — configure alert thresholds
# Format: <alertId>  <threshold>  <strength>
# Threshold: IGNORE | WARN | FAIL
# Strength:  DEFAULT | LOW | MEDIUM | HIGH | INSANE

10020	WARN	DEFAULT    # X-Frame-Options missing (warn — D365 sets this differently)
10021	FAIL	HIGH       # X-Content-Type-Options missing (fail — must be fixed)
10038	FAIL	HIGH       # Content Security Policy missing
10035	FAIL	HIGH       # Strict-Transport-Security missing
10016	FAIL	HIGH       # Web Browser XSS Protection missing
10023	WARN	DEFAULT    # Information Disclosure — debug error messages
40018	FAIL	HIGH       # SQL injection
40012	FAIL	HIGH       # XSS reflected
40014	FAIL	HIGH       # XSS persistent
40019	IGNORE	DEFAULT  # SQL injection — MySQL specific (not your DB)
```

### Programmatic ZAP with Node.js Client

```typescript
// scripts/run-zap-scan.ts
// Run ZAP programmatically — gives more control than the GitHub Action
// ZAP NodeJS client: https://github.com/zaproxy/zap-nodejs-api

import ZapClient from "zaproxy";

async function runZapScan(): Promise<void> {
  const zap = new ZapClient({
    apiKey: process.env.ZAP_API_KEY ?? "changeme",
    proxy: { host: "localhost", port: 8080 },
  });

  const targetUrl = process.env.APP_BASE_URL!;

  console.log("Starting ZAP scan on:", targetUrl);

  // 1. Spider (crawl the application)
  const spiderId = await zap.spider.scan({
    url: targetUrl,
    recurse: true,
    subtreeOnly: false,
  });
  await waitForZapScan(zap, "spider", spiderId.scan);

  // 2. Ajax Spider (for React/SPA apps like D365)
  await zap.ajaxSpider.scan({ url: targetUrl, inScope: true });
  await waitForAjaxSpider(zap);

  // 3. Active scan (actually probe for vulnerabilities)
  const scanId = await zap.ascan.scan({
    url: targetUrl,
    recurse: true,
    scanPolicyName: "Default Policy",
  });
  await waitForZapScan(zap, "ascan", scanId.scan);

  // 4. Get results
  const alerts = await zap.core.alerts({ baseurl: targetUrl });
  const highRisk = alerts.alerts.filter(
    (a: { risk: string }) => a.risk === "High",
  );
  const mediumRisk = alerts.alerts.filter(
    (a: { risk: string }) => a.risk === "Medium",
  );

  console.log(`\nZAP Scan Results for ${targetUrl}:`);
  console.log(`  High risk alerts: ${highRisk.length}`);
  console.log(`  Medium risk alerts: ${mediumRisk.length}`);
  console.log(`  Total alerts: ${alerts.alerts.length}`);

  // 5. Generate report
  const report = await zap.reports.generate({
    title: "Security Scan Report",
    template: "traditional-html",
    sites: [targetUrl],
  });
  require("fs").writeFileSync("security-report.html", report);
  console.log("Report: security-report.html");

  // Fail if any high-risk vulnerabilities found
  if (highRisk.length > 0) {
    console.error("\nHigh-risk vulnerabilities:");
    highRisk.forEach((a: { name: string; url: string; description: string }) =>
      console.error(`  → ${a.name} at ${a.url}: ${a.description}`),
    );
    process.exit(1);
  }
}

async function waitForZapScan(
  zap: ZapClient,
  type: "spider" | "ascan",
  scanId: string,
): Promise<void> {
  let progress = 0;
  while (progress < 100) {
    await new Promise((r) => setTimeout(r, 5000));
    const status =
      type === "spider"
        ? await zap.spider.status({ scanId })
        : await zap.ascan.status({ scanId });
    progress = parseInt(status.status);
    process.stdout.write(`\r${type} progress: ${progress}%`);
  }
  console.log(`\n${type} complete.`);
}
```

---

## 6. Security Response Headers — Automated Check

```typescript
// tests/specs/security/security-headers.spec.ts
// Reference: https://owasp.org/www-project-secure-headers/
// Also: https://securityheaders.com/ (free online scanner)

test.describe("Security Response Headers @security @headers", () => {
  const requiredHeaders = [
    {
      name: "Strict-Transport-Security",
      pattern: /max-age=\d+/,
      reason: "HSTS prevents downgrade attacks",
    },
    {
      name: "X-Content-Type-Options",
      pattern: /nosniff/i,
      reason: "Prevents MIME type sniffing (XSS vector)",
    },
    {
      name: "X-Frame-Options",
      pattern: /DENY|SAMEORIGIN/i,
      reason: "Prevents clickjacking (OWASP A05)",
    },
    {
      name: "Referrer-Policy",
      pattern: /.+/,
      reason: "Controls referrer information leakage",
    },
    {
      name: "Permissions-Policy",
      pattern: /.+/,
      reason: "Controls browser feature access",
    },
  ] as const;

  for (const { name, pattern, reason } of requiredHeaders) {
    test(`Security header '${name}' is present and correct`, async ({
      request,
    }) => {
      const response = await request.get(`${process.env.APP_BASE_URL}/`);
      const headers = response.headers();
      const value = headers[name.toLowerCase()];

      expect(
        value,
        `Missing security header '${name}': ${reason}`,
      ).toBeTruthy();
      expect(value, `Header '${name}' has incorrect value: ${value}`).toMatch(
        pattern,
      );
    });
  }

  test("Verbose server information is not exposed", async ({ request }) => {
    const response = await request.get(
      `${process.env.API_BASE_URL}/api/v2/citations`,
    );
    const headers = response.headers();

    // Server header should NOT reveal version information
    // Bad: 'Server: Apache/2.4.51 (Ubuntu)'
    // OK:  'Server: Apache' or absent
    if (headers["server"]) {
      expect(headers["server"]).not.toMatch(/\d+\.\d+/); // no version numbers
    }

    // X-Powered-By should be absent (reveals tech stack)
    expect(headers["x-powered-by"]).toBeUndefined();
    expect(headers["x-aspnet-version"]).toBeUndefined();
  });

  test("API error responses do not leak stack traces", async ({ request }) => {
    // Trigger a likely error with a malformed request
    const response = await request.get(
      `${process.env.API_BASE_URL}/api/v2/citations/INVALID-ID-FORMAT-${"x".repeat(1000)}`,
    );

    // Any error is acceptable — but stack trace must not leak
    if (!response.ok()) {
      const body = await response.text();
      // These strings indicate a stack trace is leaking
      expect(body).not.toMatch(/at Object\.<anonymous>/); // Node.js stack trace
      expect(body).not.toMatch(/at java\./); // Java stack trace
      expect(body).not.toMatch(/System\.Web\./); // ASP.NET stack trace
      expect(body).not.toContain("NullReferenceException");
      expect(body).not.toContain("SQLException");
    }
  });
});
```

---

## 🏋️ Practice Challenges

### Challenge 1 [Scenario] — IDOR in the Wild

A citation has `citationId: 'CIT-10042'`. A logged-in customer tries `GET /api/v2/citations/CIT-10041` (someone else's citation, sequential ID). The API returns 200 with the other customer's full details.

Write the test that catches this. What OWASP category? What is the correct HTTP response?

<details><summary>Answer</summary>

**OWASP A01 — Broken Access Control (IDOR — Insecure Direct Object Reference)**

Correct response: **403** (Forbidden — you're authenticated but not authorised) or **404** (hide existence — preferred for privacy, doesn't leak "this ID exists").

The test:

```typescript
test("IDOR: customer cannot read another customer citation via sequential ID", async ({
  request,
  account,
}) => {
  // 1. Create customer's own citation
  const myCitation = await citationsClient.create(
    PayloadsCitation.pending({ customerId: account.userId }),
  );

  // 2. Try to access the citation immediately before it (likely belongs to someone else)
  // Extract the numeric part and decrement
  const myNum = parseInt(myCitation.citationId.replace("CIT-", ""));
  const otherId = `CIT-${myNum - 1}`;

  const response = await request.get(
    `${process.env.API_BASE_URL}/api/v2/citations/${otherId}`,
    { headers: HeadersCrm.bearer(account.accessToken) },
  );

  // Must NOT return 200 with another customer's data
  if (response.status() === 200) {
    const body = await response.json();
    // If the returned data belongs to a different customer → IDOR confirmed
    if (body.customerId !== account.userId) {
      throw new Error(
        `[CRITICAL A01] IDOR: accessed citation ${otherId} belonging to ${body.customerId}`,
      );
    }
  } else {
    // 403 or 404 → correct behaviour
    expect([403, 404]).toContain(response.status());
  }
});
```

</details>

### Challenge 2 [Write It Yourself — XSS Payload Injection]

Write a Playwright test that verifies a text input field is immune to Stored XSS. The test should submit `<script>alert('xss')</script>` as a note on a citation, then view the citation and assert that the script is rendered safely as text, not executed as HTML.

<details><summary>Answer</summary>

```typescript
test("Citation notes sanitize XSS payloads", async ({ page }) => {
  const xssPayload = `<script>alert('xss-test')</script>`;

  // 1. Submit the payload
  await page.goto("/citations/new");
  await page.fill("#notes", xssPayload);
  await page.click("#saveBtn");

  // 2. Verify no unexpected dialog opens during navigation/rendering
  page.on("dialog", (dialog) => {
    expect(dialog.message(), "XSS payload executed!").not.toContain("xss-test");
    dialog.dismiss();
  });

  // 3. Navigate to the view page where the payload is rendered
  await page.waitForURL("**/citations/*");

  // 4. Assert the exact text is present in the DOM (Playwright's text engine ignores HTML tags
  // if they were rendered as actual DOM elements, but finds them if they were escaped to &lt;script&gt;)
  const noteContent = await page.locator(".citation-notes").innerText();
  expect(noteContent).toBe(xssPayload);

  // 5. Assert it's NOT in the innerHTML as an active script tag
  const innerHtml = await page.locator(".citation-notes").innerHTML();
  expect(innerHtml).toContain("&lt;script&gt;");
});
```

**SDE Principle**: Defense in depth. The SDET verifies that the frontend correctly escapes the payload (`&lt;`), preventing execution.

</details>

---

### Challenge 3 [Spot the Bug — Flawed IDOR Verification]

```typescript
test("User cannot delete another user’s citation", async ({
  request,
  accountA,
  accountB,
}) => {
  // Account A creates a citation
  const citation = await request.post("/api/citations", {
    headers: { Authorization: `Bearer ${accountA.token}` },
    data: { amount: 100 },
  });
  const id = (await citation.json()).id;

  // Account B attempts to delete it
  const deleteRes = await request.delete(`/api/citations/${id}`, {
    headers: { Authorization: `Bearer ${accountA.token}` }, // ← BUG IS HERE
  });

  expect(deleteRes.status()).toBe(403);
});
```

Why is this a false positive security test?

<details><summary>Answer</summary>

**Bug**: The deletion request accidentally uses `accountA.token` instead of `accountB.token`.

Because `accountA` created the citation, `accountA` _is_ allowed to delete it. But wait — the test expects a 403!
If the API is correctly implemented, `accountA` deleting their own citation returns `204 No Content` or `200 OK`. The test will fail (Expected 403, got 204).

However, if the API is _broken_ and prevents owners from deleting their own items (a functional bug), the API returns 403, and the security test _passes_!

**Fix**: The attacker (Account B) must use their own token to attempt the unauthorized action.

```typescript
const deleteRes = await request.delete(`/api/citations/${id}`, {
  headers: { Authorization: `Bearer ${accountB.token}` }, // Correctly testing Account B's access
});
```

</details>

---

### Challenge 4 [MCQ — SQL Injection in API]

You send `customerId: "USR-001' OR '1'='1"` to the API search endpoint. The API returns a `200 OK` and exactly ONE record belonging to USR-001. What does this mean?

A) The API is vulnerable to SQL injection — `' OR '1'='1` succeeded and bypassed the filter.
B) The API is using parameterized queries correctly — it treated the payload as a literal string.
C) The API is not vulnerable to *this* payload, but the row count rules out parameterized queries: something stripped or truncated the input before it reached the database, which is blocklist filtering — a weaker defence worth raising.
D) The test is inconclusive because SQL injection can only be tested on login forms.

<details><summary>Answer</summary>

**C** — and the reason B is wrong is the whole point of the question.

The instinct is that "one record, not all records" means safe parameterization. It doesn't,
and the row count is the tell. A parameterized query **binds the payload as a single
literal value**, so the database looks for a customer whose `customer_id` is *exactly*
the 18-character string `USR-001' OR '1'='1`. No such customer exists. It returns
**zero** rows — not one.

Run against a real SQLite database (Node's `node:sqlite`), three citations seeded for
`USR-001`, `USR-002`, `USR-003`:

```
=== 1. PARAMETERIZED (safe / prepared statement) ===
   SELECT * FROM citations WHERE customer_id = ?     [bound: "USR-001' OR '1'='1"]
   rows returned: 0

=== 2. STRING-CONCATENATED (vulnerable) ===
   SELECT * FROM citations WHERE customer_id = 'USR-001' OR '1'='1'
   rows returned: 3        ← every row in the table; injection succeeded

=== 3. TRUNCATED-AT-QUOTE (blocklist "sanitization") ===
   sanitized value: "USR-001"
   rows returned: 1        ← matches the question's premise

=== 4. Baseline: the clean value "USR-001" ===
   rows returned: 1
```

So the three outcomes are diagnostic, and each means something different:

| Rows returned | What the backend actually did                            | Verdict                                |
| ------------- | -------------------------------------------------------- | -------------------------------------- |
| **3** (all)   | Concatenated the payload into the SQL string             | ❌ Vulnerable — injection succeeded     |
| **0**         | Bound the payload as one literal value (parameterized)   | ✅ Correct defence                      |
| **1**         | Stripped/truncated the payload, *then* queried           | ⚠️ Not exploited here, but fragile      |

**Why the "1 row" case deserves a ticket rather than a green tick.** It proves the input
never reached the database intact, which means some layer is *rewriting user input* —
truncating at the quote, stripping characters, or matching against a blocklist.
Blocklist filtering is a defence that has to be right about every possible payload,
forever, across every encoding; parameterization is right by construction because the
value is never parsed as SQL at all. Filters get bypassed routinely by payloads that
avoid the filtered characters, and there is a second-order hazard: silently truncating
`customerId` means a *legitimate* ID containing an apostrophe is also silently mangled,
turning a security control into a correctness bug.

**What this means for how you write the assertion.** §4's SQL-injection test asserts
`not.toBe(500)` and `toHaveLength(0)` on the returned data — both correct, and the
`toHaveLength(0)` is exactly right precisely *because* parameterized queries return zero
rows for this payload. But a test that only checked "didn't return everything" would pass
on all three rows above, including the fragile case. When an injection probe comes back
with a *plausible-looking* result instead of nothing, that is the signal to go read the
query, not to move on:

```typescript
// A probe that distinguishes the three outcomes rather than just ruling out the worst:
const rows = (await response.json()).data ?? [];
expect(response.status(), "injection must not cause a server error").not.toBe(500);
expect(
  rows,
  `Injection payload returned ${rows.length} row(s). Expected 0 — a parameterized ` +
    `query cannot match this literal. A non-zero count means input is being rewritten ` +
    `before it reaches the DB (blocklist filtering), which is worth investigating.`,
).toHaveLength(0);
```

A is wrong because the payload demonstrably did not return all rows. D is wrong because
any endpoint that puts user input into a query is testable — §4 probes a query parameter,
not a login form.

</details>

---

### Challenge 5 [Architecture Decision — Shift-Left Security]

Your team has a suite of 50 security tests (XSS, IDOR, SQLi) using Playwright API requests. Where should these run in the CI/CD pipeline?

A) On every PR before merging, alongside unit tests.
B) In a nightly cron job against the production environment.
C) After merging to `main`, deployed to a Staging environment, run as a blocking gate before Production.
D) Manually triggered by the security team once a month.

<details><summary>Answer</summary>

**C** — Run in a Staging/Integration environment before production deployment.

Why not A? Security tests often require complex state setup (multiple users interacting) and a real database (to test SQLi properly). Running them on every PR can be too slow and flaky if developers are using mocked local environments.
Why not B? Nightly production runs are good for monitoring, but injecting SQLi and XSS payloads into a Production database is extremely dangerous and pollutes live data.
Why not D? Manual is too slow; the goal of DevSecOps is automation.

By running as a blocking gate in Staging, you catch vulnerabilities _before_ they reach production, in a safe environment that accurately reflects the production database architecture.

</details>

---

**Key References:**

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Playwright Network Interception](https://playwright.dev/docs/network)
- [PortSwigger Web Security Academy](https://portswigger.net/web-security)

---

**Navigation**: [← Chapter 39: Accessibility Testing](./39_Accessibility_Testing_axe_core.md) | [Index](../00_INDEX.md) | [→ Chapter 41: GraphQL & WebSocket Testing](../03_Real_World_Scenarios/41_GraphQL_WebSocket_Testing.md)


---

## Reality Check

**"Security testing in Playwright means testing login forms"** → Security testing includes: authentication bypass (can you access protected pages without login?), authorization bypass (can user A see user B's data?), injection testing (does the app handle SQL injection/XSS payloads safely?), CSRF (does the app validate CSRF tokens?), sensitive data exposure (are passwords/tokens visible in page source, network requests, localStorage?), and broken access control (can a regular user call admin API endpoints?). Login form testing is one small part. Playwright enables much of this — direct API calls, localStorage inspection, network interception for header checking.

**"OWASP ZAP is the only tool for security testing"** → OWASP ZAP is a DAST (Dynamic Application Security Testing) proxy scanner — it passively observes and actively probes your running application. Complementary tools: SAST (Static Application Security Testing — `semgrep`, `SonarQube` analyzes source code), IAST (Interactive — instruments the running app, triggered by tests running through it), SCA (Software Composition Analysis — `npm audit`, `snyk` checks dependency vulnerabilities), and infrastructure scanning (Trivy for Docker images, checkov for IaC). A complete security testing program uses multiple layers; Playwright-based tests can drive the application while ZAP proxies the traffic.

**"XSS attacks only happen through form inputs"** → XSS injection points include: URL parameters (reflected XSS in search results), stored data (stored XSS in user profile names, comments), DOM manipulation (DOM-based XSS — JavaScript reads from `location.hash` or `document.referrer` and writes to DOM), JSON responses rendered without escaping, SVG uploads that are served with `Content-Type: image/svg+xml` (SVG can execute JavaScript), and HTTP headers reflected in error pages (e.g., the `User-Agent` header displayed in an error message). Test all untrusted data sources, not just form inputs.

**"HTTPS guarantees the content is safe"** → HTTPS (TLS) provides: confidentiality (third parties can't read the traffic), integrity (traffic can't be modified in transit), and authentication (you're talking to the real server). It does NOT guarantee: the server's content is not malicious (phishing sites use HTTPS), the application code is secure (SQL injection works over HTTPS), or that the response isn't poisoned at the server. A malicious application or compromised server can serve malicious content over a valid HTTPS connection. HTTPS = secure channel; secure application = separate concern.

**"Playwright can't test WebSockets for security issues"** → Playwright's WebSocket interception: `page.on('websocket', ws => ...)` captures all WebSocket frames. Security tests: does the WebSocket connection authenticate before accepting messages? (`ws.on('framesent', frame => checkAuthFrame(frame))`), does the server reject malformed messages? (intercept and modify frames), does the connection enforce message size limits? (send oversized frames), does the app leak sensitive data via WebSocket? (capture all `framereceived` events and check for token/PII exposure). WebSocket security is often overlooked — Playwright makes it testable.
