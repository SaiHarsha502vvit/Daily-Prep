# 19. Advanced Browser Console Scripts — DevTools, Network & Security Diagnostics

**Navigation**: [← Chapter 18: Mega POM Architecture](../04_Enterprise_Architecture/18_Mega_POM_Architecture.md) | [Index](../00_INDEX.md) | [→ Chapter 20: Practice Resources](../00_Pathways/PATHWAY_01_LEARNING.md)

**Cross-links:**

- [`03_Browser_Console_Scripting.md`](../01_Foundations/03_Browser_Console_Scripting.md) — Foundation console scripting
- [`10_Dynamics365_CRM_Testing.md`](../03_D365_And_Patterns/10_Dynamics365_CRM_Testing.md) — D365 element dump scripts
- [`02_Enterprise_Locators_XPath.md`](../01_Foundations/02_Enterprise_Locators_XPath.md) — XPath patterns

> [!NOTE]
> This chapter covers **diagnostic scripts** — tools for discovering locators, inspecting network calls, and verifying security properties (cookie flags, CSP headers, token storage) in your own test environments. It is NOT a chapter on active security attack patterns. For OWASP-style attack pattern testing (IDOR, injection, auth bypasses), see [Ch 40: Security Testing](../07_Specialised_Testing/40_Security_Testing_OWASP.md). All scripts in Sections C and D are for authorized testing of YOUR OWN applications only.

---

## 5W1H

- **WHAT**: A complete, ready-to-run library of browser DevTools console scripts for element discovery, DOM monitoring, network inspection, and security verification.
- **WHY**: When Playwright can't find an element, the browser console is your second pair of eyes. When you need to verify security properties (cookie flags, headers, token storage), console scripts give you instant answers.
- **WHO**: Every SDET who has ever opened DevTools and wondered "how do I find this element?"
- **WHEN**: When writing new POM locators, debugging flaky tests, or running security sanity checks.
- **HOW**: Open Chrome DevTools → Console tab → paste script → press Enter.

---

## SECTION A — Discovery & Locator Scripts

### Script 1: Full Page Locator Dump

Dumps every useful locator on the page in Playwright-ready format:

```javascript
(function fullPageLocatorDump() {
  const results = [];

  // 1. All data-automation-key elements (D365)
  document.querySelectorAll("[data-automation-key]").forEach((el) => {
    const key = el.getAttribute("data-automation-key");
    const text = el.textContent?.trim().substring(0, 40) ?? "";
    results.push({
      type: "data-automation-key",
      playwright: `page.locator('[data-automation-key="${key}"]')`,
      tag: el.tagName,
      text,
    });
  });

  // 2. All ARIA roles (interactive elements)
  [
    "button",
    "menuitem",
    "tab",
    "option",
    "link",
    "checkbox",
    "radio",
    "textbox",
    "combobox",
  ].forEach((role) => {
    document.querySelectorAll(`[role="${role}"]`).forEach((el) => {
      const label =
        el.getAttribute("aria-label") ||
        el.textContent?.trim().substring(0, 30) ||
        "";
      results.push({
        type: `role:${role}`,
        playwright: `page.getByRole('${role}', { name: '${label.replace(/'/g, "\\'")}' })`,
        tag: el.tagName,
        text: label,
      });
    });
  });

  // 3. All IFrames
  document.querySelectorAll("iframe").forEach((f, i) => {
    results.push({
      type: "iframe",
      playwright: `page.frameLocator('iframe[name="${f.name}"]')`,
      tag: "IFRAME",
      text: `name="${f.name}" id="${f.id}" title="${f.title}"`,
    });
  });

  // 4. All form inputs (id, name, placeholder)
  document.querySelectorAll("input, textarea, select").forEach((el) => {
    const id = el.getAttribute("id");
    const name = el.getAttribute("name");
    const placeholder = el.getAttribute("placeholder") ?? "";
    const bestSelector = id
      ? `#${id}`
      : name
        ? `[name="${name}"]`
        : `[placeholder="${placeholder}"]`;
    if (bestSelector) {
      results.push({
        type: "input",
        playwright: `page.locator('${bestSelector}')`,
        tag: el.tagName,
        text: id || name || placeholder,
      });
    }
  });

  console.log(`Found ${results.length} elements:`);
  console.table(results);
  return results;
})();
```

---

### Script 2: XPath Generator

Get the XPath and CSS selector for any element you can describe:

```javascript
function getXPath(element) {
  if (element.id) return `//*[@id="${element.id}"]`;
  if (element === document.body) return "/html/body";

  const siblings = Array.from(element.parentNode?.children ?? []);
  const sameTagSiblings = siblings.filter((s) => s.tagName === element.tagName);
  const idx = sameTagSiblings.indexOf(element) + 1;
  const position = sameTagSiblings.length > 1 ? `[${idx}]` : "";

  return `${getXPath(element.parentNode)}/${element.tagName.toLowerCase()}${position}`;
}

function getCSSSelector(element) {
  if (element.id) return `#${element.id}`;
  if (element.getAttribute("data-automation-key")) {
    return `[data-automation-key="${element.getAttribute("data-automation-key")}"]`;
  }
  if (element.getAttribute("data-testid")) {
    return `[data-testid="${element.getAttribute("data-testid")}"]`;
  }
  const classes = Array.from(element.classList)
    .filter((c) => !c.startsWith("is-") && !c.startsWith("ms-") && c.length > 3)
    .join(".");
  return classes
    ? `${element.tagName.toLowerCase()}.${classes}`
    : element.tagName.toLowerCase();
}

// Use: Pass any element you get from DevTools "Inspect"
// In DevTools: right-click element → Copy → Copy JS Path → paste here
// OR use $0 (the currently inspected element):
// getXPath($0) then getCSSSelector($0)

function analyzeElement(el) {
  const xpath = getXPath(el);
  const css = getCSSSelector(el);
  console.log("=== Element Analysis ===");
  console.log("Tag:", el.tagName);
  console.log("Role:", el.getAttribute("role") ?? "(none)");
  console.log("aria-label:", el.getAttribute("aria-label") ?? "(none)");
  console.log("Text:", el.textContent?.trim().substring(0, 60));
  console.log("");
  console.log("Playwright locators (try in order):");
  console.log(
    `1. page.getByRole('${el.getAttribute("role") ?? el.tagName.toLowerCase()}', { name: '${(el.getAttribute("aria-label") || el.textContent?.trim() || "").substring(0, 30).replace(/'/g, "\\'")}' })`,
  );
  console.log(`2. page.locator('${css}')`);
  console.log(`3. page.locator('${xpath}')`);
}

// Usage: Right-click element → Inspect → then in Console:
// analyzeElement($0)
```

---

### Script 3: Find All Elements by Text

```javascript
function findByText(searchText, options = { exact: false }) {
  const allElements = document.querySelectorAll("*");
  const matches = [];

  allElements.forEach((el) => {
    if (el.children.length > 0) return; // Skip non-leaf elements
    const text = el.textContent?.trim() ?? "";
    const match = options.exact
      ? text === searchText
      : text.toLowerCase().includes(searchText.toLowerCase());

    if (match && text.length < 200) {
      const role = el.getAttribute("role") || el.tagName.toLowerCase();
      const ariaLabel = el.getAttribute("aria-label") || "";
      const dataKey = el.getAttribute("data-automation-key") || "";
      const id = el.getAttribute("id") || "";

      matches.push({
        tag: el.tagName,
        role,
        text: text.substring(0, 60),
        bestLocator: id
          ? `#${id}`
          : dataKey
            ? `[data-automation-key="${dataKey}"]`
            : ariaLabel
              ? `[aria-label="${ariaLabel}"]`
              : `${el.tagName.toLowerCase()}:has-text("${text.substring(0, 30)}")`,
      });
    }
  });

  console.log(`Found ${matches.length} elements containing "${searchText}":`);
  console.table(matches);
  return matches;
}

// Usage:
// findByText('Edit')           — all elements containing "Edit"
// findByText('Edit', { exact: true })  — only elements with exactly "Edit"
// findByText('CIT-001')        — find a specific citation ID
```

---

### Script 4: Shadow DOM Piercer

```javascript
function findInShadowDOM(searchText) {
  const results = [];

  function searchShadow(root, depth = 0) {
    root.querySelectorAll("*").forEach((el) => {
      // Check text content
      if (el.textContent?.includes(searchText) && el.children.length === 0) {
        results.push({
          depth,
          tag: el.tagName,
          text: el.textContent.trim().substring(0, 50),
          selector: el.id ? `#${el.id}` : el.className || "(no id/class)",
          note: depth > 0 ? `Inside ${depth} shadow root(s)` : "Regular DOM",
        });
      }
      // Recurse into shadow roots
      if (el.shadowRoot) {
        searchShadow(el.shadowRoot, depth + 1);
      }
    });
  }

  searchShadow(document);
  console.table(results);
  console.log(
    'For shadow DOM elements in Playwright: page.locator("host-element >> css=.inner-element")',
  );
}

// Usage: findInShadowDOM('Submit')
```

---

### Script 5: DOM Mutation Monitor (Watch Element for Changes)

```javascript
function watchElement(cssSelector, options = {}) {
  const el = document.querySelector(cssSelector);
  if (!el) {
    console.error(`Element not found: ${cssSelector}`);
    return null;
  }

  const log = [];
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((m) => {
      const entry = {
        type: m.type,
        time: new Date().toISOString(),
        target: m.target.tagName,
        change:
          m.type === "characterData"
            ? `text: "${m.target.textContent?.substring(0, 50)}"`
            : m.type === "attributes"
              ? `attr ${m.attributeName}: "${m.target.getAttribute(m.attributeName)}"`
              : `childList: added ${m.addedNodes.length}, removed ${m.removedNodes.length}`,
      };
      log.push(entry);
      console.log("DOM CHANGE:", JSON.stringify(entry));
    });
  });

  observer.observe(el, {
    attributes: true,
    attributeOldValue: true,
    childList: true,
    subtree: true,
    characterData: true,
    characterDataOldValue: true,
  });

  console.log(`Watching "${cssSelector}". Call observer.disconnect() to stop.`);
  console.log(
    'Use: const obs = watchElement(".ms-DetailsList"); // later: obs.disconnect()',
  );
  return observer;
}

// Usage — great for debugging D365 text-loading timing:
// const obs = watchElement('[data-automation-key="statecode"]');
// Interact with the page, watch when text changes
// obs.disconnect(); // stop watching
```

---

## SECTION B — Network & Storage Scripts

### Script 6: Fetch Request Logger

```javascript
// Monkey-patch fetch to log all API calls made by the page
const _originalFetch = window.fetch;
const _fetchLog = [];

window.fetch = async function (...args) {
  const url =
    typeof args[0] === "string" ? args[0] : (args[0]?.url ?? "(unknown)");
  const method = args[1]?.method ?? "GET";
  const startTime = Date.now();

  console.log(`→ ${method} ${url.substring(0, 80)}`);
  try {
    const response = await _originalFetch.apply(this, args);
    const duration = Date.now() - startTime;
    const entry = {
      method,
      url: url.substring(0, 100),
      status: response.status,
      duration: `${duration}ms`,
    };
    _fetchLog.push(entry);
    console.log(`← ${response.status} ${url.substring(0, 60)} (${duration}ms)`);
    return response;
  } catch (err) {
    console.error(`✗ ${method} ${url.substring(0, 60)} FAILED:`, err.message);
    throw err;
  }
};

console.log(
  "Fetch logger active. View log: console.table(window._fetchLog || [])",
);
window._fetchLog = _fetchLog;

// Usage: Interact with the page, then:
// console.table(window._fetchLog)
// window.fetch = _originalFetch; // restore original
```

---

### Script 7: Storage Dump & Token Finder

```javascript
function dumpAllStorage() {
  console.log("\n=== SESSION STORAGE ===");
  const session = {};
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    session[key] = sessionStorage.getItem(key)?.substring(0, 100);
  }
  console.table(session);

  console.log("\n=== LOCAL STORAGE ===");
  const local = {};
  const sensitiveKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const value = localStorage.getItem(key) ?? "";
    local[key] = value.substring(0, 80);
    const isSensitive = [
      "token",
      "auth",
      "jwt",
      "session",
      "key",
      "secret",
      "pass",
    ].some((k) => key.toLowerCase().includes(k));
    if (isSensitive) {
      sensitiveKeys.push({
        key,
        preview: value.substring(0, 30) + "...",
        recommendation: "Consider HttpOnly cookie instead",
      });
    }
  }
  console.table(local);

  if (sensitiveKeys.length > 0) {
    console.warn("\n⚠ Potentially sensitive data in localStorage:");
    console.table(sensitiveKeys);
  }
}

dumpAllStorage();
```

---

## SECTION C — Security Testing Scripts (YOUR OWN APPS)

### Script 8: Cookie Security Audit

```javascript
function auditCookies() {
  // document.cookie only shows NON-httpOnly cookies
  // HttpOnly cookies are invisible to JavaScript BY DESIGN
  const visibleCookies = document.cookie
    .split(";")
    .map((c) => c.trim())
    .filter((c) => c.length > 0)
    .map((c) => {
      const eqIdx = c.indexOf("=");
      const name = c.substring(0, eqIdx);
      const value = c.substring(eqIdx + 1);
      const isSensitiveName = ["token", "auth", "session", "jwt"].some((k) =>
        name.toLowerCase().includes(k),
      );
      return {
        name,
        value: value.substring(0, 30) + (value.length > 30 ? "..." : ""),
        httpOnly: "NO (visible to JS) ⚠",
        recommendation: isSensitiveName
          ? "🔴 AUTH COOKIE SHOULD BE httpOnly!"
          : "✓ OK",
      };
    });

  console.log("=== VISIBLE COOKIES (JS-accessible) ===");
  if (visibleCookies.length === 0) {
    console.log(
      "✓ No JS-accessible cookies found (all may be httpOnly or no cookies set)",
    );
  } else {
    console.table(visibleCookies);
  }

  console.log("\n=== HOW TO CHECK ALL COOKIES (including httpOnly) ===");
  console.log("DevTools → Application tab → Cookies → select your domain");
  console.log("Check columns: HttpOnly ✓, Secure ✓, SameSite: Lax or Strict");
  console.log("");
  console.log("EXPECTED (secure setup):");
  console.log(
    "  Session/auth cookies: HttpOnly=true, Secure=true, SameSite=Strict/Lax",
  );
  console.log("  Non-auth cookies: at least Secure=true");
  console.log("");
  console.log("RED FLAGS:");
  console.log("  Auth cookie with HttpOnly=false → XSS can steal your session");
  console.log(
    "  Any cookie with Secure=false → sent over HTTP (man-in-middle risk)",
  );
  console.log("  SameSite=None without Secure → CSRF risk");
}

auditCookies();
```

---

### Script 9: Security Headers Checker (Playwright Test Version)

```typescript
// tests/security/security-headers.spec.ts
// Run this against your own staging environment

import { test, expect } from "@playwright/test";

const REQUIRED_HEADERS = [
  { header: "content-security-policy", description: "CSP — prevents XSS" },
  {
    header: "x-content-type-options",
    expectedValue: "nosniff",
    description: "Prevents MIME sniffing",
  },
  {
    header: "x-frame-options",
    pattern: /^(DENY|SAMEORIGIN)$/i,
    description: "Prevents clickjacking",
  },
  { header: "strict-transport-security", description: "Forces HTTPS (HSTS)" },
  { header: "referrer-policy", description: "Controls referrer info" },
] as const;

test.describe("Security Headers @security @smoke", () => {
  test("Main application page has required security headers", async ({
    page,
  }) => {
    const response = await page.goto(process.env.APP_URL!);
    expect(response, "Page must respond").not.toBeNull();

    const headers = response!.headers();

    for (const requirement of REQUIRED_HEADERS) {
      const value = headers[requirement.header];

      expect(
        value,
        `Missing header: ${requirement.header} — ${requirement.description}`,
      ).toBeDefined();

      if ("expectedValue" in requirement) {
        expect(value, `${requirement.header} wrong value`).toBe(
          requirement.expectedValue,
        );
      }
      if ("pattern" in requirement) {
        expect(value, `${requirement.header} wrong value`).toMatch(
          requirement.pattern,
        );
      }
    }
  });

  test("Auth endpoint does not expose sensitive data in error responses", async ({
    request,
  }) => {
    const response = await request.post(`${process.env.AUTH_URL}/api/login`, {
      data: { email: "nonexistent@test.com", password: "wrongpassword" },
    });

    expect(response.status()).toBe(401);

    const body = await response.json();
    // Error message must NOT reveal whether the email exists
    const errorMsg = JSON.stringify(body).toLowerCase();
    expect(errorMsg).not.toContain("user not found"); // reveals email exists/doesn't exist
    expect(errorMsg).not.toContain("invalid password"); // reveals email IS correct
    expect(errorMsg).not.toContain("stack"); // no stack traces
    expect(errorMsg).not.toContain("exception"); // no exception details
    // Expected: generic "Invalid credentials" or similar
  });
});
```

---

### Script 10: Auth Enforcement Test

```javascript
// Browser console — test if removing auth kicks you out
function testAuthEnforcement() {
  console.log("=== Auth Enforcement Test ===");

  // Find auth-related localStorage keys
  const authKeys = Object.keys(localStorage).filter((k) =>
    ["token", "auth", "jwt", "session", "user"].some((keyword) =>
      k.toLowerCase().includes(keyword),
    ),
  );

  if (authKeys.length === 0) {
    console.log(
      "No auth keys found in localStorage (may be using httpOnly cookies)",
    );
    console.log(
      "To test httpOnly cookie enforcement: manually delete the cookie in",
    );
    console.log("DevTools → Application → Cookies → right-click → Delete");
    console.log("Then reload and verify you are redirected to login");
    return;
  }

  console.log("Found auth keys:", authKeys);
  console.log("Clearing them and reloading...");
  authKeys.forEach((key) => localStorage.removeItem(key));

  // Also try to clear session storage
  sessionStorage.clear();

  console.log("Expected: redirect to login page");
  console.log(
    "If the page still shows protected content: AUTH ENFORCEMENT BUG",
  );
  window.location.reload();
}

// Run: testAuthEnforcement()
// THEN check: are you on the login page? If yes → auth works correctly.
```

**Playwright test version:**

```typescript
test("Clearing auth token redirects to login", async ({ page, context }) => {
  // Start logged in
  await page.goto(process.env.APP_URL + "/dashboard");
  await expect(page.locator(".dashboard-header")).toBeVisible({
    timeout: 15000,
  });

  // Clear auth state
  await context.clearCookies();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  // Reload — should redirect to login
  await page.reload();
  await expect(page).toHaveURL(/\/(login|signin|auth)/, { timeout: 15000 });
  // Verify protected content is NOT visible
  await expect(page.locator(".dashboard-header")).toHaveCount(0);
});
```

---

### Script 11: IDOR URL Pattern Finder

```javascript
// Finds ID patterns in the current URL that could be targets for IDOR testing
function findIDPatterns() {
  const url = window.location.href;
  console.log("Current URL:", url);

  const patterns = {
    uuid:
      url.match(
        /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
      ) ?? [],
    numeric: url.match(/\/\d{4,}/g) ?? [],
    alphaNumeric: url.match(/\/[A-Z]{2,4}-?\d{3,}/g) ?? [],
    base64Like: url.match(/\/[A-Za-z0-9+/=]{20,}/g) ?? [],
  };

  console.table(patterns);
  console.log("");
  console.log("IDOR Test Approach:");
  console.log("1. Note each ID above");
  console.log("2. Log in as a DIFFERENT test user");
  console.log(
    "3. Replace the ID in the URL with one belonging to the first user",
  );
  console.log("4. Expected: 403 Forbidden or 404 Not Found");
  console.log(
    "5. FAIL: If you can see the first user's data — that's an IDOR vulnerability",
  );
  return patterns;
}

findIDPatterns();
```

**Playwright test version:**

```typescript
test("Cannot access another user's record by changing URL ID (IDOR check)", async ({
  browser,
}) => {
  // User A's context
  const userAContext = await browser.newContext({
    storageState: "auth-states/customer-a-state.json",
  });
  const userAPage = await userAContext.newPage();

  // User B's context
  const userBContext = await browser.newContext({
    storageState: "auth-states/customer-b-state.json",
  });
  const userBPage = await userBContext.newPage();

  try {
    // Get User A's record URL
    await userAPage.goto(`${process.env.APP_URL}/my-account`);
    const userAUrl = userAPage.url();
    // Extract User A's ID from URL (adjust regex to your URL pattern)
    const userAId = userAUrl.match(/\/accounts\/([^/]+)/)?.[1];
    expect(userAId).toBeDefined();

    // User B tries to access User A's record
    await userBPage.goto(`${process.env.APP_URL}/accounts/${userAId}`);
    const status = await userBPage.evaluate(() => {
      const meta = document.querySelector('meta[name="http-status"]');
      return meta?.getAttribute("content") ?? "unknown";
    });

    // Should get 403, 404, or be redirected to their own profile
    await expect(userBPage).not.toHaveURL(new RegExp(`/accounts/${userAId}`));
    // OR: verify an error message is shown
    const errorVisible = await userBPage
      .locator(".access-denied-message, .error-403")
      .isVisible();
    expect(
      errorVisible,
      "User B must NOT be able to access User A's data",
    ).toBe(true);
  } finally {
    await userAContext.close();
    await userBContext.close();
  }
});
```

---

### Script 12: XSS Input Field Tester (YOUR OWN APPS ONLY)

```javascript
// Tests if an input field reflects/executes injected HTML
// Uses a HARMLESS payload that only logs to console if vulnerable
function testXSSOnInput(inputCSSSelector) {
  const input = document.querySelector(inputCSSSelector);
  if (!input) {
    console.error(`Input not found: ${inputCSSSelector}`);
    return;
  }

  // Clear any previous XSS test flag
  window._XSS_TRIGGERED = false;

  // Harmless payload: only triggers a console.log and sets a flag
  const testPayload = `<img src="x" onerror="window._XSS_TRIGGERED=true; console.warn('XSS_DETECTED_IN: ${inputCSSSelector}')">`;

  // Inject the payload
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value",
  )?.set;
  if (nativeInputValueSetter) {
    nativeInputValueSetter.call(input, testPayload);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  console.log(`Payload injected into: ${inputCSSSelector}`);

  setTimeout(() => {
    if (window._XSS_TRIGGERED) {
      console.error(
        "🔴 XSS VULNERABILITY: The input rendered HTML and executed JavaScript!",
      );
      console.error("   Report to your development team immediately.");
    } else {
      console.log(
        "✓ Input appears to sanitise the payload (no script execution detected)",
      );
      console.log("   Note: Verify the stored/reflected value in the UI too");
    }
  }, 1000);
}

// Usage: testXSSOnInput('#searchInput')
// Usage: testXSSOnInput('[data-automation-key="name.fieldControl-text-box-text"]')
```

---

### Script 13: Console Error Aggregator (Playwright Fixture)

In enterprise CI pipelines, a test might pass while the browser console throws silent JavaScript errors (e.g., React hydration failures or failed background API calls). To catch these, inject a console listener via a fixture that automatically fails the test or logs warnings if errors occur.

```typescript
// tests/fixtures/console-aggregator.ts
import { test as base, expect } from "@playwright/test";

type ConsoleMessageInfo = { type: string; text: string; location: string };

export const test = base.extend<{ consoleErrors: ConsoleMessageInfo[] }>({
  consoleErrors: async ({ page }, use) => {
    const errors: ConsoleMessageInfo[] = [];

    // Listen for console events
    page.on("console", (msg) => {
      if (msg.type() === "error" || msg.type() === "warning") {
        errors.push({
          type: msg.type(),
          text: msg.text(),
          location: msg.location().url || "inline",
        });
      }
    });

    // Listen for uncaught page errors
    page.on("pageerror", (exception) => {
      errors.push({
        type: "uncaught_exception",
        text: exception.message,
        location: exception.stack?.split("\n")[1] || "unknown",
      });
    });

    await use(errors);

    // Teardown: Evaluate aggregated errors
    if (errors.length > 0) {
      console.warn(
        `\n[Console Aggregator] Detected ${errors.length} console issues:`,
      );
      console.table(errors);

      // Optional: Fail the test if strict mode is enabled
      // if (process.env.FAIL_ON_CONSOLE_ERROR === 'true') {
      //   const severeErrors = errors.filter(e => e.type === 'uncaught_exception' || e.type === 'error');
      //   expect(severeErrors.length, 'Page must not have severe console errors').toBe(0);
      // }
    }
  },
});
```

To use it, just include the `consoleErrors` fixture in any test to activate the silent monitoring:

```typescript
test("Dashboard loads without JS errors", async ({ page, consoleErrors }) => {
  await page.goto("/dashboard");
  // consoleErrors fixture monitors the background automatically!
});
```

---

## 🏋️ Practice Challenges

### Challenge 1 [MCQ] — Cookie Security

Your app's session cookie is visible via `document.cookie` in the browser console. What does this tell you?

A) The cookie is definitely not secure and should be fixed  
B) The cookie is missing the `HttpOnly` flag — it can be stolen via XSS  
C) The cookie is working correctly — all cookies should be JavaScript-readable  
D) The browser is misconfigured

<details><summary>Answer</summary>

**B** — If a session cookie appears in `document.cookie`, it lacks the `HttpOnly` flag. `HttpOnly` cookies are hidden from JavaScript and cannot be stolen by XSS attacks. A session/auth cookie that is JavaScript-readable means a successful XSS attack could steal the user's session. This should be reported to the dev team as a security finding.

</details>

---

### Challenge 2 [Spot the Bug — Security Test]

```typescript
test("Auth enforcement", async ({ page, context }) => {
  await page.goto("/dashboard");
  await page.evaluate(() => localStorage.clear());
  // Reload and check
  await page.reload();
  await expect(page).toHaveURL("/login");
});
```

<details><summary>Answer</summary>

Only `localStorage` is cleared. If the app uses:

- `sessionStorage` — still present, might keep the session alive
- `HttpOnly` cookies — not clearable via JS, still sent to server → user stays logged in
- Regular cookies — not cleared

Fix:

```typescript
await context.clearCookies(); // clears all cookies in the context
await page.evaluate(() => {
  localStorage.clear();
  sessionStorage.clear();
});
await page.reload();
await expect(page).toHaveURL(/\/(login|signin)/);
```

</details>

---

### Challenge 3 [Write It Yourself]

Write a Playwright test that verifies the login endpoint returns a 401 with a GENERIC error message (not revealing whether the email exists or the password is wrong).

<details><summary>Answer</summary>

```typescript
test.describe("Login security", () => {
  test("Wrong email: returns generic 401 message", async ({ request }) => {
    const response = await request.post(`${process.env.AUTH_URL}/api/login`, {
      data: { email: "doesnotexist@test.com", password: "AnyPassword1!" },
    });
    expect(response.status()).toBe(401);
    const body = await response.json();
    const errorText = JSON.stringify(body).toLowerCase();
    // Must NOT reveal the email doesn't exist
    expect(errorText).not.toContain("user not found");
    expect(errorText).not.toContain("email not found");
    expect(errorText).not.toContain("no account");
  });

  test("Correct email, wrong password: returns SAME generic 401 message", async ({
    request,
  }) => {
    const response = await request.post(`${process.env.AUTH_URL}/api/login`, {
      data: {
        email: process.env.EXISTING_TEST_EMAIL!,
        password: "WrongPassword999!",
      },
    });
    expect(response.status()).toBe(401);
    const body = await response.json();
    const errorText = JSON.stringify(body).toLowerCase();
    // Must NOT reveal the email IS correct
    expect(errorText).not.toContain("invalid password");
    expect(errorText).not.toContain("wrong password");
    expect(errorText).not.toContain("password incorrect");
    // Both cases should return the same generic message:
    expect(body.message).toMatch(
      /invalid credentials|login failed|authentication failed/i,
    );
  });
});
```

</details>

---

## SECTION D — CDP-Based Security Verification (CI-Grade)

### Script 14: HttpOnly Cookie Audit via CDP

`document.cookie` only shows cookies WITHOUT the `HttpOnly` flag. To verify that auth cookies DO have `HttpOnly` set (the correct security posture), you need Chrome DevTools Protocol (CDP). This is the ONLY way to programmatically assert `HttpOnly` in CI:

```typescript
// tests/security/cookie-security.spec.ts

import { test, expect, chromium } from "@playwright/test";

test("Auth cookies have HttpOnly and Secure flags set", async ({}) => {
  // Must use chromium directly to access CDP
  const browser = await chromium.launch();
  const context = await browser.newContext({
    storageState: "auth-states/admin-state.json",
  });
  const page = await context.newPage();

  // Open CDP session on the browser context
  const cdpSession = await context.newCDPSession(page);

  await page.goto(process.env.APP_URL!);

  // CDP: Network.getAllCookies — returns ALL cookies including HttpOnly ones
  // This is the only API that reveals HttpOnly status programmatically
  const { cookies } = (await cdpSession.send("Network.getAllCookies")) as {
    cookies: {
      name: string;
      value: string;
      domain: string;
      path: string;
      httpOnly: boolean;
      secure: boolean;
      sameSite: string;
      expires: number;
    }[];
  };

  // Known auth cookie names for YOUR application (customise these):
  const authCookieNames = [
    "sso_token",
    ".AspNet.ApplicationCookie",
    "access_token",
  ];

  const authCookies = cookies.filter((c) =>
    authCookieNames.some((name) =>
      c.name.toLowerCase().includes(name.toLowerCase()),
    ),
  );

  expect(
    authCookies.length,
    `Expected to find at least one auth cookie. Found cookies: [${cookies.map((c) => c.name).join(", ")}]`,
  ).toBeGreaterThan(0);

  for (const cookie of authCookies) {
    expect(
      cookie.httpOnly,
      `Auth cookie "${cookie.name}" must have HttpOnly=true (currently: ${cookie.httpOnly})`,
    ).toBe(true);

    expect(
      cookie.secure,
      `Auth cookie "${cookie.name}" must have Secure=true (currently: ${cookie.secure})`,
    ).toBe(true);

    expect(
      cookie.sameSite,
      `Auth cookie "${cookie.name}" must have SameSite=Lax or Strict (currently: ${cookie.sameSite})`,
    ).toMatch(/^(Lax|Strict)$/);
  }

  // Verify NO sensitive cookie is readable from JavaScript:
  const jsAccessibleCookies = await page.evaluate(() =>
    document.cookie
      .split(";")
      .map((c) => c.trim().split("=")[0])
      .filter(Boolean),
  );

  for (const authName of authCookieNames) {
    const visibleViaJS = jsAccessibleCookies.some((name) =>
      name.toLowerCase().includes(authName.toLowerCase()),
    );
    expect(
      visibleViaJS,
      `Auth cookie "${authName}" MUST NOT be readable via document.cookie (missing HttpOnly)`,
    ).toBe(false);
  }

  await cdpSession.detach();
  await browser.close();
});
```

```
// Why CDP is the only CI-grade option:
//
// Option A: document.cookie (JS) → only shows NON-httpOnly cookies
//           Cannot verify HttpOnly IS set — only that it's missing
//
// Option B: Application tab in DevTools → manual UI, cannot automate
//
// Option C: CDP Network.getAllCookies → returns full cookie metadata
//           including httpOnly, secure, sameSite — the only automatable option
//
// In your CI pipeline: run this test on every deployment to staging.
// If a cookie's HttpOnly flag is accidentally removed (common in config
// changes), this test will catch it before it reaches production.
```

---

### Script 15: Rate Limit / Brute-Force Protection Test

```typescript
// tests/security/rate-limiting.spec.ts
// Verifies the login endpoint enforces rate limiting

import { test, expect } from "@playwright/test";

const LOGIN_URL = `${process.env.AUTH_URL}/api/login`;
const WRONG_CREDENTIALS = {
  email: "test@example.com",
  password: "WrongPass123!",
};

test("Login endpoint enforces rate limiting after repeated failures", async ({
  request,
}) => {
  const responses: {
    attempt: number;
    status: number;
    retryAfter: string | null;
  }[] = [];

  // Send 15 consecutive wrong-password login attempts
  // Most production systems limit to 5-10 before rate limiting kicks in
  for (let attempt = 1; attempt <= 15; attempt++) {
    const resp = await request.post(LOGIN_URL, { data: WRONG_CREDENTIALS });
    responses.push({
      attempt,
      status: resp.status(),
      retryAfter: resp.headers()["retry-after"] ?? null,
    });

    // Stop early if we hit the rate limit
    if (resp.status() === 429) break;
  }

  console.table(responses);

  // Verify rate limiting was triggered at some point
  const rateLimitedResponse = responses.find((r) => r.status === 429);

  expect(
    rateLimitedResponse,
    [
      `Rate limiting NOT enforced after ${responses.length} failed login attempts.`,
      `All returned: ${[...new Set(responses.map((r) => r.status))].join(", ")}`,
      `SECURITY RISK: No brute-force protection on the login endpoint.`,
    ].join("\n"),
  ).toBeDefined();

  // Verify the 429 response includes a Retry-After header (tells clients when to retry)
  expect(
    rateLimitedResponse!.retryAfter,
    "Rate limit response (429) must include a Retry-After header",
  ).not.toBeNull();

  // Verify all attempts before rate limiting returned 401 (not 200, not 500)
  const preRateLimitResponses = responses.filter((r) => r.status !== 429);
  for (const r of preRateLimitResponses) {
    expect(
      r.status,
      `Login attempt ${r.attempt} returned ${r.status}; expected 401 for wrong credentials`,
    ).toBe(401);
  }
});

test("Verify rate limit does NOT lock out after correct password", async ({
  request,
}) => {
  // Some systems lock out even correct logins after too many attempts — this is a UX bug
  // First: exhaust rate limit with wrong password
  for (let i = 0; i < 5; i++) {
    await request.post(LOGIN_URL, { data: WRONG_CREDENTIALS });
  }

  // Then: try the CORRECT credentials
  const correctResp = await request.post(LOGIN_URL, {
    data: {
      email: process.env.TEST_USER_EMAIL!,
      password: process.env.TEST_USER_PASSWORD!,
    },
  });

  // Expected: either 200 (logged in) or 429 (temporarily blocked but resettable)
  // NOT expected: 401 with wrong credentials error (would mean the account is permanently locked)
  expect(
    [200, 429],
    `Correct credentials should return 200 or temporary 429, not: ${correctResp.status()}`,
  ).toContain(correctResp.status());
});
```

---

### Challenge 4 [MCQ] — CDP vs document.cookie

You need to write a CI test that verifies your auth cookie has `HttpOnly=true`. Which approach works?

A) `document.cookie.includes('sso_token')` — if it's there, it has HttpOnly  
B) Read the Playwright `storageState()` JSON — it includes httpOnly in the cookie objects  
C) Use CDP `Network.getAllCookies` — returns full cookie metadata including httpOnly flag  
D) Use `page.evaluate(() => navigator.cookieEnabled)` — checks if cookies are enabled

<details><summary>Answer</summary>

**C** — CDP `Network.getAllCookies` is the only way to read cookie flags (`httpOnly`, `secure`, `sameSite`) programmatically.

**A is backwards**: If `document.cookie` shows the cookie, that PROVES `HttpOnly=false` — the opposite of what you want.

**B is correct but incomplete**: `storageState()` DOES include `httpOnly` in its cookie objects (it calls CDP internally). But `storageState()` only returns cookies that were present when the state was saved — not necessarily all current cookies. CDP `Network.getAllCookies` gives you the current live cookies.

**D** is unrelated — `navigator.cookieEnabled` checks if cookies are globally enabled in the browser, not any individual cookie's properties.

</details>

---

**Navigation**: [← Chapter 18: Mega POM Architecture](../04_Enterprise_Architecture/18_Mega_POM_Architecture.md) | [Index](../00_INDEX.md) | [→ Chapter 20: Practice Resources](../00_Pathways/PATHWAY_01_LEARNING.md)


---

## Reality Check

**"If `document.cookie` doesn't show the auth cookie, it's secure"** → The absence of a cookie from `document.cookie` proves only that it *might* have `HttpOnly` set — the same absence happens if the cookie was never issued, was issued for a different domain/path, or expired. `document.cookie` is a *negative* signal at best. To *positively* assert `HttpOnly=true`, `Secure=true`, and a strict `SameSite`, you have to ask the browser directly via CDP `Network.getAllCookies` (Script 14). Any CI security assertion built on `document.cookie` alone is a rubber stamp.

**"`window.fetch` monkey-patching in the console captures every API call the page makes"** → It captures every `fetch()` call made by page-authored JavaScript, after your patch runs. It misses: requests made by `XMLHttpRequest` (legacy libraries still use it), by service workers (which live in a separate execution context and have their own `fetch`), by `<img>`/`<script>`/`<iframe>` element loads, by navigation (`page.goto`), and by any fetch that fired between page load and your patch executing. For a complete picture, use DevTools Network tab or Playwright's `page.on('request')` — those hook at the browser layer, below all of these gaps.

**"The XSS input tester in Script 12 proves the app is XSS-safe when nothing fires"** → It proves only that *this specific payload*, injected into *this specific input*, did not trigger `onerror` *in the current rendering context*. Real XSS testing has to cover: stored XSS (payload persisted and rendered elsewhere), DOM XSS (payload interpreted by client-side code, not by innerHTML), context-specific payloads (attribute context, JS string context, URL context — each needs a different payload), and encoding bypasses. A green Script 12 result is a smoke test, not a verdict. For real coverage, use OWASP ZAP or a manual security review — see [Ch 40](../07_Specialised_Testing/40_Security_Testing_OWASP.md).

**"MutationObserver (Script 5) fires for every DOM change"** → It fires only for the mutation *types you subscribed to* in the `observe()` options (`attributes`, `childList`, `subtree`, `characterData`). Miss `subtree: true` and mutations inside child elements are invisible. Miss `characterData: true` and the D365 two-phase-render text fill you're trying to debug fires zero events. It also does not observe: property changes that skip attribute reflection (setting `input.value` from JS updates the property but not the attribute), style changes that resolve via CSS (a class toggle, then a computed background-color change), or reflows. When the observer is silent but the screen is clearly changing, the answer is almost always missing options — not "the code isn't running."

**"Rate limiting is enforced globally by the WAF, so a per-endpoint test is unnecessary"** → WAFs typically rate-limit by IP or by a coarse route pattern; application-level lockouts (per-account, per-email) live in the app code and are the ones users actually notice. Script 15 tests the app-level rule specifically — that `POST /login` with `{email:X, password:wrong}` starts refusing after N attempts *for that email*, and that a subsequent correct-password submission is not permanently locked out. The WAF cannot tell you either of those things because it does not know what "correct" means. Test both layers or you catch neither.
