# 11. Cross-Website Pattern 1 — Sequential Flow (Data Carries Forward)

**Navigation**: [← Chapter 10: D365 CRM Testing](./10_Dynamics365_CRM_Testing.md) | [Index](../00_INDEX.md) | [→ Chapter 12: New Tab Shared Context](./12_CrossSite_Pattern2_NewTab_SharedContext.md)

**Cross-links:**

- [`07_test_step_E2E_Architecture.md`](../02_Core_Architecture/07_test_step_E2E_Architecture.md) — Data Accumulator DTO pattern
- [`06_Custom_Fixtures_Architecture.md`](../02_Core_Architecture/06_Custom_Fixtures_Architecture.md) — Multi-site fixtures
- [`24_Advanced_API_Testing/05_Data_From_API_To_Test.md`](../../24_Advanced_API_Testing/05_Data_From_API_To_Test.md) — Typed response interfaces

---

## 5W1H

- **WHAT**: The pattern where a single E2E test visits multiple websites in order — data created on Website A flows into Website B and is verified on Website C.
- **WHY**: Real business flows don't stay on one website. An admin creates a user in the CRM → that user logs into the customer portal → the portal calls the billing API. If you only test each website in isolation, you miss the integration failures that happen at the boundaries.
- **WHO**: SDETs whose company has 2+ linked websites (common in enterprise: admin panel + customer portal + payment portal).
- **WHEN**: Any test whose user story says "then the user goes to..." a different application.
- **HOW**: By keeping a strongly-typed Data Accumulator that carries data across website boundaries within a single test, combined with mixed wait strategies for different app types.

---

## 1. Why Cross-Website Testing Is Different

Testing one website is straightforward. Cross-website testing introduces three new problems:

**Problem 1 — Data must survive across navigation**

When you `page.goto('https://site-b.com')`, the browser navigates away from Site A. Any variable you stored from Site A's UI is still in your TypeScript `data` object (because it's just JavaScript memory), but the browser's DOM is completely new.

**Problem 2 — Different apps have different wait strategies**

Site A might be Dynamics 365 (React SPA — wait for spinner). Site B might be a JSP app (server-rendered — wait for `domcontentloaded`). You can't use the same wait strategy for both.

**Problem 3 — Session handling**

Does Site B accept Site A's authentication? If they share an SSO cookie on the same domain (`.company.com`), yes. If they're completely separate auth systems, your test needs separate credentials for each site.

---

## 2. The Sequential Flow Pattern — Full Architecture

```
                    ┌─────────────────────┐
                    │   Data Accumulator   │  ← TypeScript object scoped to the test
                    │   (lives in memory)  │
                    └────────┬────────────┘
                             │ populated by
                             ▼
┌──────────────┐     Step 1: Admin creates user
│  Admin CRM   │ ──────────────────────────────► data.userId = 'C-123'
│  (D365 App)  │     Step 2: Copy credentials   data.email = 'test@co.com'
└──────────────┘ ──────────────────────────────► data.tempPassword = 'Tmp!Pass1'
                             │
                             ▼
┌──────────────┐     Step 3: Navigate to customer portal
│  Customer    │ ──────────────────────────────► uses data.email + data.tempPassword
│  Portal      │     Step 4: Login succeeds
│  (JSP App)   │ ──────────────────────────────► data.loginSucceeded = true
└──────────────┘     Step 5: Verify onboarding banner
                             │
                             ▼
┌──────────────┐     Step 6: Cross-validate via API
│  User API    │ ──────────────────────────────► uses data.userId
│  (REST)      │ ◄─────────────────────────────  returns { status: 'onboarding' }
└──────────────┘     Step 7: Assert API agrees with UI
```

---

## 3. TypeScript Interfaces for Cross-Website Data

Define ALL data the test will collect BEFORE writing the test:

```typescript
// types/test-data.types.ts

export interface CrossSiteOnboardingData {
  // From Step 1 (Admin portal — D365)
  userId: string | null;
  email: string | null;
  tempPassword: string | null;
  fullName: string | null;
  accountCreatedAt: string | null;

  // From Steps 3-4 (Customer portal — JSP)
  loginSucceeded: boolean;
  onboardingBannerVisible: boolean | null;
  portalDisplayName: string | null;

  // From Step 6 (API cross-validation)
  apiUserStatus: string | null;
  apiOnboardingStep: number | null;
}
```

---

## 4. The POM Hierarchy for Multi-Site Tests

Organise your POMs by website, not by page:

```
tests/
├── fixtures/
│   └── index.ts
│
├── websites/
│   ├── admin-crm/
│   │   ├── pages/
│   │   │   └── AdminPortalPage.ts     ← top-level POM (orchestrator)
│   │   └── components/
│   │       ├── UserManagement.ts      ← user CRUD operations
│   │       └── AccountsGrid.ts        ← accounts table
│   │
│   ├── customer-portal/
│   │   ├── pages/
│   │   │   └── CustomerPortalPage.ts
│   │   └── components/
│   │       ├── LoginForm.ts
│   │       └── OnboardingFlow.ts
│   │
│   └── payment-portal/
│       └── pages/
│           └── PaymentPortalPage.ts
│
└── specs/
    └── cross-website/
        └── user-onboarding.spec.ts
```

### `AdminPortalPage.ts` — Orchestrator with Component Composition

```typescript
import { type Page } from "@playwright/test";
import { UserManagement } from "../components/UserManagement";

export class AdminPortalPage {
  readonly page: Page;
  readonly users: UserManagement; // composed component

  constructor(page: Page) {
    this.page = page;
    this.users = new UserManagement(page);
  }

  async goto(): Promise<void> {
    await this.page.goto(process.env.ADMIN_CRM_URL!);
    // D365-specific wait — spinner disappears + data loads
    await this.page
      .locator(".ms-Spinner")
      .waitFor({ state: "hidden", timeout: 30000 });
  }
}
```

### `UserManagement.ts` — Component POM

```typescript
import { type Page, type Locator } from "@playwright/test";

export interface NewUserData {
  firstName: string;
  lastName: string;
  email: string;
  role: "AGENT" | "SUPERVISOR" | "ADMIN";
}

export interface CreatedUser {
  userId: string;
  email: string;
  tempPassword: string;
  fullName: string;
  createdAt: string;
}

export class UserManagement {
  readonly page: Page;
  readonly newUserButton: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly roleDropdown: Locator;
  readonly saveButton: Locator;
  readonly confirmationBanner: Locator;

  constructor(page: Page) {
    this.page = page;
    // D365 CommandBar: menuitem, NOT button
    this.newUserButton = page.getByRole("menuitem", { name: "New User" });
    // D365 form fields use data-automation-key
    this.firstNameInput = page.locator(
      '[data-automation-key="firstname.fieldControl-text-box-text"]',
    );
    this.lastNameInput = page.locator(
      '[data-automation-key="lastname.fieldControl-text-box-text"]',
    );
    this.emailInput = page.locator(
      '[data-automation-key="emailaddress1.fieldControl-text-box-text"]',
    );
    this.roleDropdown = page.locator("#roleDropdown-option");
    this.saveButton = page.getByRole("menuitem", { name: "Save & Close" });
    this.confirmationBanner = page
      .locator(".ms-MessageBar")
      .filter({ hasText: "Saved" });
  }

  async createUser(userData: NewUserData): Promise<CreatedUser> {
    await this.newUserButton.click();
    await this.firstNameInput.waitFor({ state: "visible", timeout: 20000 });

    await this.firstNameInput.fill(userData.firstName);
    await this.lastNameInput.fill(userData.lastName);
    await this.emailInput.fill(userData.email);

    await this.roleDropdown.click();
    await this.page.getByRole("option", { name: userData.role }).click();

    await this.saveButton.click();
    await this.confirmationBanner.waitFor({ state: "visible", timeout: 30000 });

    const userId = await this.page
      .locator('[data-automation-key="contactid"]')
      .textContent();
    const tempPassword = await this.page
      .locator('[data-automation-key="temppassword"]')
      .textContent();
    const createdAt = await this.page
      .locator('[data-automation-key="createdon"]')
      .textContent();

    return {
      userId: userId!.trim(),
      email: userData.email,
      tempPassword: tempPassword!.trim(),
      fullName: `${userData.firstName} ${userData.lastName}`,
      createdAt: createdAt!.trim(),
    };
  }
}
```

### `CustomerPortalPage.ts` — JSP App POM

```typescript
import { type Page, type Locator, expect } from "@playwright/test";

export class CustomerPortalPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly onboardingBanner: Locator;
  readonly displayNameLabel: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    // JSP: standard HTML IDs — much simpler than D365
    this.emailInput = page.locator("#username");
    this.passwordInput = page.locator("#password");
    this.loginButton = page.locator("#loginBtn");
    this.onboardingBanner = page.locator(".onboarding-welcome-banner");
    this.displayNameLabel = page.locator(".user-display-name");
    this.errorMessage = page.locator(".error-message");
  }

  async goto(): Promise<void> {
    await this.page.goto(process.env.CUSTOMER_PORTAL_URL!);
    // JSP: full server render — DOM is complete after domcontentloaded
    await this.page.waitForLoadState("domcontentloaded");
  }

  async loginWith(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
    // JSP form submit = full page reload
    await this.page.waitForLoadState("domcontentloaded");
    await expect(this.errorMessage).toHaveCount(0);
  }

  async verifyOnboardingState(): Promise<void> {
    await expect(this.onboardingBanner).toBeVisible({ timeout: 10000 });
  }

  async getDisplayName(): Promise<string> {
    await expect(this.displayNameLabel).toBeVisible();
    return ((await this.displayNameLabel.textContent()) ?? "").trim();
  }
}
```

---

## 5. The Fixtures File — What `account` Actually Is

> **This answers the comment: "where is the fixtures code?"**
>
> The test imports `{ test, expect }` from `../../fixtures` — NOT from `@playwright/test`.
> That custom `test` object is the base Playwright test **extended** with your team's fixtures.
> Here is what `fixtures/index.ts` looks like for a cross-website test:

```typescript
// tests/fixtures/index.ts
// This file is the ONLY file your tests import from.
// It wraps the Playwright base `test` and injects everything your tests need.

import { test as base, expect } from "@playwright/test";
import { UserServiceClient } from "../clients/UserServiceClient";
import { NotificationsClient } from "../clients/NotificationsClient";

// ── Step 1: Define the shape of your custom fixtures ──────────────────────────
interface AuthAccount {
  accessToken: string; // Bearer token for API calls — read from env or login
  userId: string; // The logged-in user's ID
  email: string; // The logged-in user's email
  role: "ADMIN" | "AGENT" | "SUPERVISOR";
}

interface CustomFixtures {
  // Test-scoped fixtures (created fresh for each test)
  userServiceClient: UserServiceClient;
  notificationsClient: NotificationsClient;

  // Worker-scoped fixtures (shared across all tests in this worker)
  account: AuthAccount;
}

// ── Step 2: Extend the base test with your fixtures ───────────────────────────
export const test = base.extend<
  Omit<CustomFixtures, "account">, // test-scoped
  Pick<CustomFixtures, "account"> // worker-scoped
>({
  // ── WORKER-SCOPED: runs once per worker, shared by all tests in that worker ──
  // Why worker-scoped? We don't want to log in 200 times for 200 tests.
  account: [
    async ({}, use) => {
      // In real tests, this comes from a globalSetup storageState or an API login call.
      // For illustration, we read from environment variables set by your CI/CD.
      const account: AuthAccount = {
        accessToken: process.env.ADMIN_ACCESS_TOKEN!, // ← comes from env, NOT hardcoded
        userId: process.env.ADMIN_USER_ID!,
        email: process.env.ADMIN_EMAIL!,
        role: "ADMIN",
      };

      // Provide the account to every test in this worker
      await use(account);

      // No teardown needed — we didn't create anything, just read env vars
    },
    { scope: "worker" }, // ← This is the key line
  ],

  // ── TEST-SCOPED: created fresh before each test, destroyed after ──────────────
  userServiceClient: async ({ request, account }, use) => {
    // `request` = Playwright's built-in APIRequestContext
    // `account` = the worker-scoped auth fixture we defined above
    const client = new UserServiceClient(request, account.accessToken);
    await use(client);
    // No teardown — client is stateless, HTTP connections close automatically
  },

  notificationsClient: async ({ request, account }, use) => {
    const client = new NotificationsClient(request, account.accessToken);
    await use(client);
  },
});

// Re-export expect unchanged — so tests only import from this one file
export { expect };
```

> **What `request` is:** Playwright's built-in fixture that provides an `APIRequestContext` —
> a pre-configured HTTP client that shares authentication and base URL settings with your
> `playwright.config.ts`. You do NOT define `request` — it comes free from Playwright.

> **Why import from `../../fixtures` instead of `@playwright/test`?**
> Because your custom `test` object has your fixtures baked in. The test function's
> parameter `{ page, request, account }` destructures BOTH Playwright built-ins
> (`page`, `request`) AND your custom fixtures (`account`) from the same extended `test`.

---

## 6. The Full Test — All Steps Across 3 Systems

```typescript
// tests/specs/cross-website/user-onboarding.spec.ts

// ✅ Import from YOUR fixtures file — NOT from @playwright/test
import { test, expect } from "../../fixtures";
import { AdminPortalPage } from "../../websites/admin-crm/pages/AdminPortalPage";
import { CustomerPortalPage } from "../../websites/customer-portal/pages/CustomerPortalPage";
import { UserServiceClient } from "../../clients/UserServiceClient";
import type { CrossSiteOnboardingData } from "../../types/test-data.types";

const newUserTemplate = {
  firstName: `Test-${Date.now()}`,
  lastName: "Automation",
  email: `test-${Date.now()}@company-test.com`,
  role: "AGENT" as const,
};

test.describe("User Onboarding — Cross-Website E2E @cross-site @regression", () => {
  test("Admin creates user in CRM → User logs into customer portal → API confirms onboarding", async ({
    page,
    request,
    account,
  }) => {
    const data: CrossSiteOnboardingData = {
      userId: null,
      email: null,
      tempPassword: null,
      fullName: null,
      accountCreatedAt: null,
      loginSucceeded: false,
      onboardingBannerVisible: null,
      portalDisplayName: null,
      apiUserStatus: null,
      apiOnboardingStep: null,
    };

    const adminPortal = new AdminPortalPage(page);

    // ── SITE A: ADMIN CRM (D365) ──────────────────────────────────────────
    await test.step("Navigate to Admin CRM portal", async () => {
      await adminPortal.goto();
    });

    await test.step("Create new user account in CRM", async () => {
      const createdUser = await adminPortal.users.createUser(newUserTemplate);
      data.userId = createdUser.userId;
      data.email = createdUser.email;
      data.tempPassword = createdUser.tempPassword;
      data.fullName = createdUser.fullName;
      data.accountCreatedAt = createdUser.createdAt;
      expect(
        data.userId,
        "User ID must be returned after creation",
      ).not.toBeNull();
      expect(
        data.tempPassword,
        "Temp password must be returned",
      ).not.toBeNull();
    });

    await test.step("CRM shows user in Active state", async () => {
      const statusField = page.locator('[data-automation-key="statecode"]');
      await expect(statusField).toHaveText("Active", { timeout: 10000 });
    });

    // ── SITE B: CUSTOMER PORTAL (JSP) ─────────────────────────────────────
    // Note: page.goto() navigates away from D365. Browser context cookies are
    // still active — if same-domain SSO is configured, authentication carries over.
    const customerPortal = new CustomerPortalPage(page);

    await test.step("Navigate to Customer Portal (JSP app)", async () => {
      await customerPortal.goto();
      // Wait strategy switches: no more D365 spinner, just domcontentloaded
    });

    await test.step(`Login to customer portal as new user: ${data.email}`, async () => {
      await customerPortal.loginWith(data.email!, data.tempPassword!);
      data.loginSucceeded = true;
    });

    await test.step("Customer portal shows onboarding welcome banner", async () => {
      await customerPortal.verifyOnboardingState();
      data.onboardingBannerVisible = true;
    });

    await test.step("Customer portal shows correct display name", async () => {
      data.portalDisplayName = await customerPortal.getDisplayName();
      expect(data.portalDisplayName).toContain(newUserTemplate.firstName);
    });

    // ── SITE C: API CROSS-VALIDATION ──────────────────────────────────────
    await test.step('API: Confirm user status is "onboarding" on backend', async () => {
      const userService = new UserServiceClient(request, account.accessToken);
      const apiUser = await userService.getById(data.userId!);
      data.apiUserStatus = apiUser.status;
      data.apiOnboardingStep = apiUser.onboardingStep;
      expect(data.apiUserStatus).toBe("onboarding");
      expect(data.apiOnboardingStep).toBe(1);
    });

    await test.step("Cross-verify: portal name matches CRM full name", async () => {
      expect(data.portalDisplayName).toContain(data.fullName!.split(" ")[0]);
    });
  });
});
```

---

## 6. Mixed Wait Strategies Reference

```typescript
// ─── D365 (React SPA) ─────────────────────────────────────────────────────
await page.goto(process.env.ADMIN_CRM_URL!);
await expect(page.locator(".ms-Spinner")).toHaveCount(0, { timeout: 30000 });
await expect(page.locator(".ms-DetailsList-row")).toHaveCount({ minimum: 1 });

// ─── JSP / Servlet (server-rendered) ──────────────────────────────────────
await page.goto(process.env.CUSTOMER_PORTAL_URL!);
await page.waitForLoadState("domcontentloaded"); // DOM is complete here

// ─── ASPX / WebForms (with UpdatePanel) ────────────────────────────────────
await page.goto(process.env.ASPX_URL!);
await page.waitForLoadState("load");
// UpdatePanel partial refresh: wait for its loading indicator to disappear
await expect(page.locator("#UpdateProgress1")).toBeHidden({ timeout: 20000 });

// ─── After any JSP form submit ─────────────────────────────────────────────
await Promise.all([
  page.waitForLoadState("domcontentloaded"),
  submitButton.click(),
]);
```

---

## 7. Error Recovery Patterns in Sequential Flows

In a long cross-website sequential flow, if Step 2 (Admin CRM) fails, Step 3 (Customer Portal) will also fail because the data (e.g., `data.userId`) was never created. Without proper error recovery, the test runner will still attempt Step 3, leading to confusing timeout errors.

### Pattern 1: Fail Fast with `expect` on Critical Data

Explicitly assert that the data accumulator has the necessary data before navigating.

```typescript
// Inside the test, immediately after collecting the data:
expect(
  data.email,
  "CRITICAL: User email was not generated in CRM",
).not.toBeNull();
expect(
  data.tempPassword,
  "CRITICAL: Temp password was not generated",
).not.toBeNull();

// Now the test fails HERE with a clear message, rather than timing out 30 seconds later on the JSP login page.
await customerPortal.loginWith(data.email!, data.tempPassword!);
```

### Pattern 2: Soft Assertions for Non-Critical Steps

Use `expect.soft()` for verifications that shouldn't stop the flow. For example, if checking an analytics pixel fired, don't stop the multi-step business transaction.

```typescript
await test.step("Verify analytics pixel", async () => {
  // Use soft so the test continues even if the analytics pixel fails
  expect.soft(data.pixelFired).toBe(true);
});
```

### Pattern 3: Conditional Teardown via Fixture

If Step 2 creates a record, and Step 3 fails, you need to clean up the record created in Step 2. Use a fixture with a `use()` block to guarantee cleanup:

```typescript
// Fixture implementation:
crossSiteData: async ({ request }, use) => {
  const data: CrossSiteOnboardingData = { userId: null /* ... */ };

  await use(data); // Test runs here

  // Teardown ALWAYS runs, even if the test fails mid-flow
  if (data.userId) {
    await request.delete(`/api/users/${data.userId}`);
  }
};
```

## 🏋️ Practice Challenges

### Challenge 1 [MCQ] — Data Transport

In a cross-website test, `data.userId` is set in Step 3 and needed in Step 9. What is the correct storage approach?

A) Module-level `let` variable — accessible to all test steps  
B) Typed `data` accumulator object declared inside the test function  
C) `localStorage` via `page.evaluate()`  
D) URL query parameter passed to Site B

<details><summary>Answer</summary>

**B** — The typed `data` accumulator object inside the test function.

Module-level variables (A) are shared across parallel workers — Worker 2's test can overwrite Worker 1's `userId`. `localStorage` (C) is browser-storage, not available after navigating to a different domain or after context destruction. URL parameters (D) expose IDs in URLs and are fragile. The `data` object is just a JavaScript variable in Node.js memory — it's isolated per test, typed, and survives any page navigation.

</details>

---

### Challenge 2 [Spot the Bug]

```typescript
test("cross-site test", async ({ page }) => {
  let userId: string;
  let tempPassword: string;

  await test.step("Create user", async () => {
    const result = await adminPortal.users.createUser(testData);
    userId = result.userId;
    tempPassword = result.tempPassword;
  });

  await customerPortal.goto();

  await test.step("Login", async () => {
    await customerPortal.loginWith(userId, tempPassword);
    //                               ↑ TypeScript: Variable used before assignment
  });
});
```

<details><summary>Answer</summary>

TypeScript flags `userId` and `tempPassword` as potentially unassigned — the compiler cannot statically confirm that the `test.step()` callback ran before the `loginWith()` call. The fix is the Data Accumulator pattern:

```typescript
const data = {
  userId: null as string | null,
  tempPassword: null as string | null,
};
// Inside step:
data.userId = result.userId;
data.tempPassword = result.tempPassword;
// Usage:
await customerPortal.loginWith(data.userId!, data.tempPassword!);
// The ! asserts non-null — safe because the previous step already asserted not-null
```

</details>

---

### Challenge 3 [Write It Yourself]

Write a `CustomerPortalPage` method `completeOnboarding()` that clicks "Complete Setup", waits for the JSP page to reload, and returns `{ displayName: string, setupComplete: boolean }`.

<details><summary>Answer</summary>

```typescript
async completeOnboarding(): Promise<{ displayName: string; setupComplete: boolean }> {
  // Get name before clicking (it's shown on the onboarding banner)
  const displayName = await this.getDisplayName();

  const completeSetupButton = this.page.locator('#completeSetupBtn');
  await expect(completeSetupButton).toBeVisible();

  // JSP: button submits a form → full page reload
  await Promise.all([
    this.page.waitForLoadState('domcontentloaded'),
    completeSetupButton.click(),
  ]);

  // Verify setup completed
  const successBanner = this.page.locator('.setup-complete-message');
  const setupComplete = await successBanner.isVisible();

  return { displayName, setupComplete };
}
```

</details>

---

## 7. Cross-Domain Cookie Scoping — The Silent Failure

The most common surprise in sequential cross-site tests: **Site A's auth cookies don't carry over to Site B when they're on different domains.**

```
Site A: https://crm.company.com    → D365 Azure AD cookies (domain: .company.com)
Site B: https://portal.company.com → same-domain SSO works ✅ (subdomain of .company.com)

Site A: https://crm.dynamics.com   → Microsoft cookies (domain: .microsoft.com)
Site B: https://portal.company.com → different domain ❌ Microsoft cookies NOT sent
```

```typescript
// ── How to detect if auth carried over ─────────────────────────────────────
// After navigating to Site B, check the browser's cookies and localStorage:
const allCookies = await page.context().cookies();
const siteBCookies = allCookies.filter((c) =>
  c.domain.includes("portal.company.com"),
);
console.log("Site B cookies:", siteBCookies);

// If siteBCookies is empty → auth did NOT carry over.
// You need to authenticate separately for Site B.
```

```typescript
// ── Fix 1: API token hand-off (no UI login for Site B) ─────────────────────
// If Site B accepts the same Bearer token as Site A:

await test.step("Inject auth token into Site B context", async () => {
  // Set the token as a cookie that Site B will accept
  await page.context().addCookies([
    {
      name: "auth_token",
      value: account.accessToken, // from the account fixture
      domain: new URL(process.env.CUSTOMER_PORTAL_URL!).hostname, // portal.company.com
      path: "/",
      secure: true,
      httpOnly: false, // false if JavaScript reads it; true if only HTTP headers
    },
  ]);
  // Now navigate — Site B reads the cookie and grants access
  await page.goto(process.env.CUSTOMER_PORTAL_URL!);
});
```

```typescript
// ── Fix 2: Separate UI login per site (when tokens are incompatible) ─────────
// Site B uses a completely different auth system (e.g., a legacy system with its own login)

const customerPortal = new CustomerPortalPage(page);

await test.step("Navigate and log in to Customer Portal separately", async () => {
  await customerPortal.goto();
  // Site B has its own login — use the credentials from the data accumulator:
  await customerPortal.loginWith(data.email!, data.tempPassword!);
  data.loginSucceeded = true;
});

// ── Fix 3: storageState injection at runtime (when you have a saved auth file)
await page.context().addInitScript(() => {
  // Inject localStorage items BEFORE the page loads
  localStorage.setItem("portal_token", "your-portal-specific-token");
});
await page.goto(process.env.CUSTOMER_PORTAL_URL!);
```

```typescript
// ── Decision tree: which fix to use? ────────────────────────────────────────
//
// Same domain?         (crm.company.com → portal.company.com)
//   → Cookies carry automatically. No fix needed.
//
// Different domain, same auth system (same Bearer token)?
//   → Fix 1: addCookies() or setExtraHTTPHeaders() before goto()
//
// Different domain, different auth system?
//   → Fix 2: separate loginWith() for Site B
//
// Different domain, session-based (not Bearer token)?
//   → Fix 3: globalSetup creates storageState per site
//       playwright.config.ts: use separate projects with different storageState
```

---

**Challenge 4 [Cross-Domain Auth]:** Your sequential test visits Site A (D365 CRM at `crm.dynamics.com`) then Site B (customer portal at `portal.yourcompany.com`). After `page.goto(process.env.CUSTOMER_PORTAL_URL)`, the portal shows a blank login page instead of the expected dashboard. The test data (email, userId) was successfully collected from Site A. What is wrong and what are your two best options to fix it?

<details><summary>Answer</summary>

**Root cause**: `crm.dynamics.com` is a Microsoft-owned domain. Azure AD cookies set there are scoped to `.dynamics.com` and will not be sent to `portal.yourcompany.com` (different domain). Playwright does not automatically cross domain boundaries with cookies.

**Option 1 — API token injection (preferred):**

```typescript
// Get the Bearer token from the fixture:
await page.context().addCookies([
  {
    name: "auth_token",
    value: account.accessToken,
    domain: new URL(process.env.CUSTOMER_PORTAL_URL!).hostname,
    path: "/",
    secure: true,
  },
]);
await page.goto(process.env.CUSTOMER_PORTAL_URL!);
// Portal reads the auth_token cookie and bypasses the login page
```

Works if: the customer portal accepts the same Bearer token as D365.

**Option 2 — Separate login flow (robust fallback):**

```typescript
const customerPortal = new CustomerPortalPage(page);
await customerPortal.goto();
// Use the credentials collected from Site A (data.email, data.tempPassword):
await customerPortal.loginWith(data.email!, data.tempPassword!);
```

Works if: the portal has its own login form and the user's credentials work there.

**Key diagnosis step**: Run `await page.context().cookies()` after navigating to Site B and check which domain the cookies are scoped to. If none match `.yourcompany.com`, you need one of the above fixes.

</details>

---

## 📚 References & Further Reading

### Official Documentation

- [Playwright `test.step`](https://playwright.dev/docs/api/class-test#test-step) — Official API for organizing long sequential flows into logical, reportable chunks
- [Soft Assertions](https://playwright.dev/docs/test-assertions#soft-assertions) — Guide on using `expect.soft()` to prevent non-critical failures from terminating the sequence
- [Playwright Cookies API](https://playwright.dev/docs/api/class-browsercontext#browser-context-add-cookies) — How to manually transfer authentication between domain boundaries

### Architecture Deep Dives

- [Martin Fowler: Page Object Model](https://martinfowler.com/bliki/PageObject.html) — The definitive theory behind decoupling page structure from test logic (crucial when orchestrating multiple portals)

---

**Navigation**: [← Chapter 10: D365 CRM Testing](./10_Dynamics365_CRM_Testing.md) | [Index](../00_INDEX.md) | [→ Chapter 12: New Tab Shared Context](./12_CrossSite_Pattern2_NewTab_SharedContext.md)


---

## Reality Check

**"Sequential navigation between sites is always reliable"** ? Navigating from Site A to Site B mid-test introduces: DNS resolution time, TLS handshake, potentially different cookie domains, and page load performance variation. Each navigation is a potential timeout point. Set per-navigation timeouts rather than relying on global timeout, and add explicit waitForLoadState checks between site transitions.

**"A single browser context works for cross-site flows"** ? A single context shares cookies across all origins by default, which may cause authentication conflicts: Site A session cookie might be sent to Site B if cookie scope is misconfigured. For cross-site testing where authentication is independent, use separate browser contexts. For SSO flows where authentication is shared, a single context is correct.

**"Cross-site tests can use the same baseURL"** ? baseURL applies to all page.goto calls with relative URLs. Cross-site tests by definition involve multiple base URLs. Use absolute URLs in cross-site tests, or create separate page instances from separate contexts with different configurations. Mixing relative URLs in a multi-site test causes navigation to the wrong origin.

**"Redirect chains between sites are transparent"** ? A redirect from Site A to Site B may go through 2-5 intermediate URLs (authentication server, token exchange, consent page). Each redirect can fail independently. Playwright follows redirects automatically, but assertions on the final URL should use toHaveURL with a pattern or wait for a specific element on the final page rather than assuming the redirect chain completes instantly.

**"Sequential cross-site flows test real user behavior"** ? Real users have multiple tabs, switch between applications, and experience network interruptions between sites. Sequential automation tests the happy path through a single linear flow. Consider testing: what happens if the session expires on Site A while the user is on Site B? What if the browser back button is used mid-flow?
