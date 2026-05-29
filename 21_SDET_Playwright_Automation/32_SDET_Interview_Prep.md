# 32. SDET Interview Preparation â€” Framework Design, Technical Questions & Behavioral

**Navigation**: [â† Chapter 31: API Mocking](31_API_Mocking_page_route.md) | [Index](00_INDEX.md)

**Cross-links:**
- All chapters â€” this chapter synthesises the entire curriculum into interview-ready answers

---

## Why This Chapter Exists

SDETs are tested differently from developers. You need to answer:
- **System design questions** ("Design an automation framework for a 10-app enterprise")
- **Technical deep-dives** ("Why does `page.route()` register before the click?")
- **Behavioral questions** ("Tell me about a time you fixed a flaky test")
- **Live coding** (write a POM or a fixture on the spot)
- **Architecture reviews** (critique this existing framework)

This chapter gives you the exact answer framework for each type.

---

## SECTION 1 â€” Framework Design Questions

### "Design an automation framework for a 5-application enterprise CRM system"

This is the most common SDET system design question. Use the **LADDER** framework:

```
L â€” Layer structure
A â€” Authentication strategy
D â€” Data management
D â€” Driver / browser configuration
E â€” Error handling and reporting
R â€” Running in CI
```

**Full answer:**

```
Layer Structure:
  tests/
  â”œâ”€â”€ fixtures/         â†’ test.extend, account, clients
  â”œâ”€â”€ pages/            â†’ POM files per page, component POMs
  â”œâ”€â”€ clients/          â†’ one client class per API service
  â”œâ”€â”€ config/           â†’ environments.ts, endpoints.ts
  â”œâ”€â”€ data/
  â”‚   â”œâ”€â”€ headers/      â†’ HeadersCrm.ts, HeadersNotifications.ts
  â”‚   â”œâ”€â”€ payloads/     â†’ PayloadsCitation.ts, PayloadsUser.ts
  â”‚   â””â”€â”€ enums/        â†’ CitationStatus, UserRole
  â”œâ”€â”€ types/            â†’ API response interfaces, DB row types
  â”œâ”€â”€ utils/            â†’ TestId, DateUtils, APIUtils, TestDataManager
  â””â”€â”€ specs/            â†’ test files, organised by feature area

Authentication:
  - globalSetup runs once, logs in per role, saves storageState
  - worker-scoped `account` fixture provides token to all tests in worker
  - Token refresh: worker fixture checks expiry before use

Data Management:
  - Every test creates its own data via API (not via UI â€” faster)
  - TestDataManager tracks and cleans up in try/finally
  - Unique IDs: AUTO-timestamp-random prevents parallel collision
  - Strategy 2 (worker-scoped) for expensive reference data
  - Nightly sweeper deletes orphaned test data > 24h

Browser / Config:
  - playwright.config.ts with isCI checks
  - Projects per role (admin-chrome, customer-chrome, api-tests)
  - storageState per project
  - Workers: 100% in CI, 4 locally
  - Retries: 2 in CI, 0 locally

Error Handling:
  - APIUtils.processResponse() throws with URL, status, response body
  - Client methods don't duplicate HTTP error handling
  - Trace viewer: trace: 'on-first-retry' in CI
  - Screenshots + videos on failure

CI:
  - GitHub Actions (or Azure DevOps)
  - Smoke tests on every PR (fast gate, <15min)
  - Regression sharded across 4 agents (parallel, <30min)
  - HTML report artifact on every run, retained 30 days
  - check-env.ts validates secrets before wasting test time
```

---

### "How would you handle authentication across 3 different SSO systems?"

```
Strategy depends on whether they share a domain:

Same domain SSO (e.g., all *.company.com):
  â†’ Single storageState includes the cross-domain cookie
  â†’ Navigate to any sub-app â†’ already authenticated
  â†’ One globalSetup per role

Different domain SSO (e.g., company.com + partner.org):
  â†’ Dual browser context (Ch13)
  â†’ adminContext.newContext({ storageState: 'admin-state.json' })
  â†’ customerContext.newContext({ storageState: 'customer-state.json' })
  â†’ Each context holds its own cookie store

OAuth/SAML flows:
  â†’ globalSetup performs the full OAuth dance once
  â†’ Saves the resulting session cookies
  â†’ Tests load the saved state â€” never see the OAuth redirect
  â†’ If token expires: worker fixture detects expiry and re-runs the OAuth flow
```

---

## SECTION 2 â€” Technical Deep-Dives

### "Why do Playwright locators not query the DOM when created?"

```
Locators are lazy â€” they describe WHERE to find an element, not the element itself.
page.locator('.ms-DetailsList') creates an object that says:
  "when asked, look for an element matching '.ms-DetailsList'"

The DOM is NOT queried until you call an action:
  .click()           â†’ queries DOM, waits up to expect.timeout, clicks
  .fill()            â†’ queries DOM, waits, fills
  .textContent()     â†’ queries DOM, returns text
  expect(l).toBeVisible() â†’ retries the query repeatedly until visible or timeout

Why this matters:
  1. POMs can be constructed before the page loads â€” locators are just descriptions
  2. Locators are never stale (no "stale element reference" like Selenium)
     Each action re-queries the DOM
  3. Multiple calls to .click() on the same locator each query the DOM fresh
```

### "Explain the race condition in new tab handling"

```
The race:
  Time 0ms:  await page.click('#openInNewTab')
  Time 5ms:  browser fires the 'page' event (new tab opened)
  Time 10ms: await context.waitForEvent('page')
             â† the event already fired 5ms ago â€” listener missed it
             â† waitForEvent hangs until timeout

Why it's a race:
  page.click() is async but the new tab can open before
  JavaScript registers the 'page' event listener.

Fix: Promise.all registers the listener BEFORE the click fires:
  const [newTab] = await Promise.all([
    context.waitForEvent('page'),   // listener registered FIRST (synchronously)
    page.click('#openInNewTab'),    // click fires AFTER listener is registered
  ]);
  // Because Promise.all starts both simultaneously, waitForEvent's listener
  // is always registered before the click completes.
```

### "What is `scope: 'worker'` in a Playwright fixture?"

```
Playwright runs tests in parallel across N worker processes.
By default, each test gets its OWN instance of every fixture (test scope).

With scope: 'worker':
  The fixture is created ONCE per worker â€” not once per test.
  All tests in that worker share the same fixture instance.

Example: account fixture (auth token)
  Without scope: 'worker' â€” 40 tests = 40 login API calls = ~120 seconds overhead
  With scope: 'worker'    â€” 4 workers = 4 login API calls = ~12 seconds overhead

When to use worker scope:
  âœ… Authentication tokens (expensive, safe to share if tests only read)
  âœ… Pre-created reference data (a company record all tests read from)
  âœ… HTTP client connections (reuse connection pool)

When NOT to use worker scope:
  âŒ Data that individual tests MODIFY â€” Test A modifies it, Test B reads stale data
  âŒ Page objects (page fixture is test-scoped by definition)
```

---

## SECTION 3 â€” Behavioral Questions

### "Tell me about a flaky test you fixed"

**The STAR format (Situation â†’ Task â†’ Action â†’ Result):**

```
Situation:
  "Our CI pipeline had a test called 'Citation dispute flow' that failed
   about 1 in 4 runs. Developers started calling it 'that flaky test'
   and stopped trusting our entire suite."

Task:
  "I was asked to investigate and fix it within the sprint."

Action:
  "I started by collecting evidence â€” ran it 20 times with trace enabled.
   I opened the Playwright Trace Viewer on a failing run and found that
   at exactly 08.105s, the assertion for status = 'DISPUTED' fired.
   But the PATCH request that changes the status didn't complete until 09.200s.
   A full 1.1 seconds after the assertion.

   Diagnosis: Type 1 flakiness (timing). The test was waiting for the D365 spinner
   to hide, then immediately asserting on the field value â€” but D365 hides the
   spinner when the save request FIRES, not when it COMPLETES.

   Fix: I replaced:
     await expect(spinner).toHaveCount(0)
     const status = await statusField.textContent()
   with:
     await expect(spinner).toHaveCount(0, { timeout: 45000 })
     await expect(statusField).toHaveText('DISPUTED', { timeout: 30000 })

   The second expect() retries for 30 seconds â€” the 1.1 second gap is
   well within that window."

Result:
  "After the fix, the test ran 200 times without a single failure across 3 days of CI.
   I also documented the pattern in our internal wiki â€” 'D365 two-phase render' â€”
   and a junior SDET found and fixed the same pattern in 4 other tests the same week."
```

---

### "Tell me about a time you had to push back on a delivery deadline"

```
Situation:
  "A sprint was ending and the product owner wanted to mark a feature
   'done' â€” the manual test had passed. But our automated regression
   suite wasn't passing for this feature."

Task:
  "I needed to communicate the risk without blocking the release."

Action:
  "I showed the PO the specific test failure in the CI report and explained:
   'The manual test validates the happy path. Our automated test found
   that when the session expires mid-flow, the user loses their data.
   This happens to about 3% of users on sessions longer than 2 hours.'

   I proposed: release to 10% of users for 24 hours, monitor for
   session-loss errors in the logs, then roll out fully. This way
   we got the delivery without the risk."

Result:
  "The PO agreed. The limited release found 3 real session-loss errors
   in 24 hours. The fix was deployed before full rollout. Post-release:
   zero session-loss incidents. The PO now includes automated test results
   in every release gate."
```

---

## SECTION 4 â€” Live Coding Challenges

### Challenge: "Write a POM for this login form in 10 minutes"

```html
<!-- Given HTML -->
<form id="login-form">
  <input id="username" type="email" placeholder="Email" />
  <input id="password" type="password" placeholder="Password" />
  <button id="loginBtn" type="submit">Sign In</button>
  <div class="error-message" data-testid="login-error"></div>
  <a href="/forgot-password" id="forgotPasswordLink">Forgot password?</a>
</form>
```

**The answer they expect from a senior SDET:**

```typescript
import { type Page, type Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;

  // All locators declared as readonly â€” lazy, no DOM queries in constructor
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;
  readonly forgotPasswordLink: Locator;

  constructor(page: Page) {
    this.page = page;
    // Use stable selectors â€” ID is most stable
    this.usernameInput    = page.locator('#username');
    this.passwordInput    = page.locator('#password');
    this.loginButton      = page.locator('#loginBtn');
    // data-testid is more stable than class name for test-specific elements
    this.errorMessage     = page.locator('[data-testid="login-error"]');
    this.forgotPasswordLink = page.locator('#forgotPasswordLink');
  }

  async goto(): Promise<void> {
    await this.page.goto('/login');
    await expect(this.loginButton).toBeVisible({ timeout: 15_000 });
  }

  // Business method: loginWith handles the full flow
  async loginWith(email: string, password: string): Promise<void> {
    await this.usernameInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  // Negative test helper: login and expect failure
  async loginExpectingError(email: string, password: string): Promise<string> {
    await this.loginWith(email, password);
    await expect(this.errorMessage).toBeVisible({ timeout: 10_000 });
    return (await this.errorMessage.textContent() ?? '').trim();
  }
}

// Usage in test:
const loginPage = new LoginPage(page);
await loginPage.goto();
await loginPage.loginWith('admin@company.com', 'Admin@123!');
await expect(page).toHaveURL('/dashboard');
```

**What makes this answer score full marks:**
1. All locators in constructor (lazy eval explanation ready)
2. Returns typed string from `loginExpectingError` (testable)
3. Uses `data-testid` for the error (better than class)
4. `goto()` waits for the page to be ready (not just navigate)
5. Business-level method names (`loginWith`, not `clickLoginButton`)

---

### Challenge: "Find the bug in this fixture"

```typescript
// Given â€” what's wrong?
export const test = base.extend({
  citationData: async ({ request }, use) => {
    const response = await request.post('/api/v2/citations', {
      data: { customerId: 'USR-001', amount: 150, status: 'PENDING' }
    });
    const citation = await response.json();
    use(citation);   // â† bug
    await request.delete(`/api/v2/citations/${citation.citationId}`);
  }
});
```

**Answer:**
```
Three bugs:

1. Missing `await` before `use(citation)`
   Without await, the fixture function returns immediately after calling use(),
   the teardown (delete) fires before the test has a chance to use the fixture.
   Fix: await use(citation)

2. No error handling on the delete â€” if the test fails and the citation
   is in a non-deleteable state, the delete throws and masks the real test failure.
   Fix: wrap delete in try/catch

3. No auth headers on the API calls â€” the request object needs the Bearer token
   from the account fixture. Without it, all calls return 401.
   Fix: inject account fixture, pass token in headers

Fixed version:
  citationData: async ({ request, account }, use) => {
    const response = await request.post('/api/v2/citations', {
      headers: { 'Authorization': `Bearer ${account.accessToken}` },
      data: { customerId: account.userId, amount: 150, status: 'PENDING' }
    });
    const citation = await response.json();
    await use(citation);   // â† awaited
    try {
      await request.delete(`/api/v2/citations/${citation.citationId}`,
        { headers: { 'Authorization': `Bearer ${account.accessToken}` } }
      );
    } catch (e) {
      console.warn('Fixture teardown: delete failed:', e);
    }
  }
```

---

## SECTION 5 â€” Questions to Ask the Interviewer

These show you think at a senior level:

```
Technical:
  "What is the current ratio of UI tests to API tests in your suite?
   How do you decide where to test something?"

  "How do you handle test data management today?
   Is there a cleanup strategy for CI-created data?"

  "What is your current flakiness rate?
   Do you have any quarantined tests?"

Process:
  "Are SDETs involved in sprint planning, or do they receive stories after dev?
   I find that involving SDET in story refinement reduces last-minute test gaps."

  "Do developers write any automated tests, or is the SDET team responsible
   for all automation?"

  "What does the release gate look like? Does CI have to pass before a PR merges?"

Team:
  "How many SDETs vs developers in the team?
   What's the ratio you're targeting?"

  "Is there a test framework documentation site, or is knowledge tribal?"
```

**Why these questions matter:** They show you've thought beyond execution to framework ownership, team process, and long-term maintenance â€” which is what separates SDET from manual QA.

---

## Summary Card â€” Print Before Any Interview

```
When asked "walk me through your framework":
  â†’ LADDER: Layer â†’ Auth â†’ Data â†’ Driver â†’ Error â†’ Running in CI

When asked "how do you handle parallel test isolation":
  â†’ TestId unique IDs + TestDataManager + worker-scoped fixtures

When asked "what is a Playwright locator":
  â†’ Lazy descriptor, queries DOM only at action/assertion time, never stale

When asked "why do POMs initialize before test.step()":
  â†’ TypeScript closure scope: steps can't access variables from other step closures

When asked "how do you fix flaky tests":
  â†’ Classify (9 types) â†’ Trace Viewer evidence â†’ type-specific fix â†’ 50 repeats

When asked "when would you mock an API":
  â†’ Error state testing (401, 500) / empty states / removing third-party flakiness
  â†’ NOT for integration tests or when backend is what's being validated

When asked "what is the biggest risk in test automation":
  â†’ False confidence â€” tests that always pass because they mock the wrong things,
    have insufficient assertions, or test the wrong layer
```

---

## SECTION 6 â€” DSA Questions SDETs Actually Get Asked

Companies that hire SDETs at SDE level expect algorithmic coding. These are the patterns that appear most frequently.

### Pattern 1 â€” Find Missing/Duplicate in Test Data

```
Problem: Given a list of citation IDs ["CIT-001","CIT-003","CIT-004"], find the missing
one from a sequence that should be ["CIT-001","CIT-002","CIT-003","CIT-004","CIT-005"].
```

```typescript
// Solution: Use Set for O(n) time, O(n) space
function findMissingIds(expected: string[], actual: string[]): string[] {
  const actualSet = new Set(actual);
  return expected.filter(id => !actualSet.has(id));
}

// Usage in test:
const expectedIds = ['CIT-001', 'CIT-002', 'CIT-003', 'CIT-004', 'CIT-005'];
const actualIds   = await citationsClient.getAllIds(); // from API
const missing     = findMissingIds(expectedIds, actualIds);
expect(missing, `These citations are missing from API response: ${missing.join(',')}`).toHaveLength(0);

// Time: O(n)  Space: O(n)
// Why this instead of nested loops O(nÂ²): test suites with 10,000 records
// need efficient data comparison â€” O(nÂ²) becomes 100M operations.
```

### Pattern 2 â€” Group/Aggregate Test Results

```
Problem: You have an array of test results [{status:'PASS'}, {status:'FAIL'}, {status:'PASS'}, ...]
Count by status and assert distribution.
```

```typescript
interface TestResult { status: 'PASS' | 'FAIL' | 'SKIP'; duration: number; name: string }

function groupBy<T, K extends keyof T>(items: T[], key: K): Map<T[K], T[]> {
  return items.reduce((map, item) => {
    const k = item[key];
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(item);
    return map;
  }, new Map<T[K], T[]>());
}

// Usage:
const results: TestResult[] = await getTestResults();
const grouped = groupBy(results, 'status');

const passCount = grouped.get('PASS')?.length ?? 0;
const failCount = grouped.get('FAIL')?.length ?? 0;
const passRate  = passCount / results.length;

expect(passRate, 'Pass rate must be above 95%').toBeGreaterThan(0.95);

// If interviewer asks: "what if you had to do this without reduce?"
// Iterator approach:
function groupByIterator<T, K extends keyof T>(items: T[], key: K): Record<string, T[]> {
  const result: Record<string, T[]> = {};
  for (const item of items) {
    const k = String(item[key]);
    (result[k] ??= []).push(item);
  }
  return result;
}
```

### Pattern 3 â€” Detect Duplicate Records in API Response

```
Problem: Verify that GET /api/citations returns no duplicate citation IDs.
```

```typescript
function findDuplicates<T>(items: T[]): T[] {
  const seen = new Set<T>();
  const duplicates = new Set<T>();
  for (const item of items) {
    if (seen.has(item)) duplicates.add(item);
    seen.add(item);
  }
  return [...duplicates];
}

// In test:
const response = await citationsClient.getAll({ userId: account.userId });
const ids = response.map(c => c.citationId);
const dupes = findDuplicates(ids);

expect(dupes, `API returned duplicate citation IDs: ${dupes.join(',')}`).toHaveLength(0);

// Time: O(n)  Space: O(n)
// The interviewer follow-up: "How would you find the MOST duplicate entry?"
const freq = ids.reduce((map, id) => map.set(id, (map.get(id) ?? 0) + 1), new Map<string, number>());
const maxDupe = [...freq.entries()].reduce((max, curr) => curr[1] > max[1] ? curr : max, ['', 0]);
console.log(`Most duplicated: ${maxDupe[0]} appeared ${maxDupe[1]} times`);
```

### Pattern 4 â€” Sliding Window for Performance Metrics

```
Problem: Your API tests collect response times. Find the maximum average 
response time across any consecutive window of K requests.
```

```typescript
// Sliding window â€” O(n) time, O(1) space
function maxAverageWindow(responseTimes: number[], windowSize: number): number {
  if (windowSize > responseTimes.length) throw new Error('Window too large');

  // Initialize first window sum
  let windowSum = responseTimes.slice(0, windowSize).reduce((a, b) => a + b, 0);
  let maxSum = windowSum;

  // Slide: add next element, remove first element
  for (let i = windowSize; i < responseTimes.length; i++) {
    windowSum += responseTimes[i] - responseTimes[i - windowSize];
    maxSum = Math.max(maxSum, windowSum);
  }

  return maxSum / windowSize;
}

// Usage in performance monitoring:
const times = apiResults.map(r => r.duration);
const maxAvgRt = maxAverageWindow(times, 10);  // worst 10-request window
expect(maxAvgRt, 'Worst 10-request average must be under 2000ms').toBeLessThan(2000);
```

---

## SECTION 7 â€” More Live Coding Challenges

### Challenge: "Write a custom `expect.extend` matcher"

```typescript
// Scenario: You want to assert that an API response looks like a valid citation.
// You write this assertion in 20+ tests. Extract it as a custom matcher.

// âŒ Duplicated in every test:
const citation = await response.json();
expect(citation.citationId).toMatch(/^CIT-/);
expect(citation.status).toBeOneOf(['PENDING', 'PAID', 'OVERDUE', 'DISPUTED']);
expect(citation.amount).toBeGreaterThan(0);
expect(citation.customerId).toBeTruthy();

// âœ… Custom matcher:
// utils/matchers.ts
import { expect as baseExpect } from '@playwright/test';

export function createExpect() {
  return baseExpect.extend({
    toBeValidCitation(received: unknown) {
      const citation = received as Record<string, unknown>;
      const errors: string[] = [];

      if (typeof citation?.citationId !== 'string' || !citation.citationId.startsWith('CIT-')) {
        errors.push(`citationId must start with 'CIT-', got: ${JSON.stringify(citation?.citationId)}`);
      }
      const validStatuses = ['PENDING', 'PAID', 'OVERDUE', 'DISPUTED', 'CANCELLED'];
      if (!validStatuses.includes(citation?.status as string)) {
        errors.push(`status must be one of ${validStatuses.join('|')}, got: ${JSON.stringify(citation?.status)}`);
      }
      if (typeof citation?.amount !== 'number' || citation.amount <= 0) {
        errors.push(`amount must be a positive number, got: ${JSON.stringify(citation?.amount)}`);
      }
      if (!citation?.customerId) {
        errors.push('customerId must be present');
      }

      return {
        message: () => `Citation validation failed:\n${errors.map(e => `  â€¢ ${e}`).join('\n')}`,
        pass: errors.length === 0,
      };
    },
  });
}

export const expect = createExpect();

// Usage in tests â€” re-export expect from your matchers file:
import { expect } from '../utils/matchers';

test('Citation API returns valid citation shape', async ({ citationsClient }) => {
  const citation = await citationsClient.getById('CIT-001');
  expect(citation).toBeValidCitation();  // single line, full validation
});
```

**What makes this answer excellent:**
1. Returns `{ message, pass }` â€” required by Playwright's matcher contract
2. Collects ALL errors (not just the first one) â€” better failure messages
3. `message` formats errors clearly â€” instantly debuggable
4. Exportable and reusable across the entire test suite

---

### Challenge: "Design a rate-limiting retry wrapper for flaky API endpoints"

```typescript
// Scenario: The notification service API is occasionally slow and returns 503.
// Write a helper that retries with exponential backoff.

interface RetryOptions {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  retryOn: (response: { status: number }) => boolean;
}

async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {
    maxAttempts: 3,
    initialDelayMs: 500,
    maxDelayMs: 5000,
    retryOn: (r) => r.status === 503 || r.status === 429,
  }
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    try {
      const result = await operation();

      // Check if result is an API response with a retryable status
      if (
        result &&
        typeof result === 'object' &&
        'status' in result &&
        typeof (result as any).status === 'number' &&
        options.retryOn(result as { status: number })
      ) {
        const delay = Math.min(
          options.initialDelayMs * Math.pow(2, attempt - 1),  // exponential backoff
          options.maxDelayMs
        );
        console.log(`Attempt ${attempt}/${options.maxAttempts}: retryable status, retrying in ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < options.maxAttempts) {
        const delay = Math.min(options.initialDelayMs * Math.pow(2, attempt - 1), options.maxDelayMs);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError ?? new Error(`Operation failed after ${options.maxAttempts} attempts`);
}

// Usage in tests:
const notif = await withRetry(
  () => notificationsClient.getByUserId(account.userId),
  { maxAttempts: 5, initialDelayMs: 1000, maxDelayMs: 10000, retryOn: r => r.status === 503 }
);
```

---

## SECTION 8 â€” The SDE Bridge: What SDET Interviews at SDE Level Expect

If you're targeting SDE roles or senior SDET roles at product companies (FAANG-tier, Atlassian, JetBrains, etc.), the bar is higher than "knows Playwright." These are the additional dimensions evaluated:

### System Design at Scale

```
"Design the testing infrastructure for a 50-engineer engineering team."

Expected answer components:

1. OWNERSHIP MODEL
   - Who writes unit tests? â†’ developers (TDD)
   - Who writes integration tests? â†’ developers + SDETs jointly
   - Who owns E2E tests? â†’ SDET team owns framework, features teams write tests
   - Who reviews test quality? â†’ SDET team in PRs

2. TEST DATA AT SCALE
   - Per-test synthetic data: factory functions + unique IDs
   - Reference data: shared seed data (loaded once, read-only for tests)
   - Production anonymized data: for large-scale performance testing only
   - Data governance: GDPR compliance (no real PII in test data)

3. CI/CD INTEGRATION
   - PR gate: unit + integration tests (<5 min) â€” blocks merge
   - Post-merge: E2E smoke suite (15 min) â€” alerts on failure
   - Nightly: full regression suite (60 min, sharded Ã— 8)
   - Canary deployment: smoke tests against production subset

4. OBSERVABILITY
   - Test result dashboard (Allure, or custom Grafana board)
   - Flakiness tracking (quarantine flaky tests, track MTBF)
   - Coverage metrics (which features have no tests?)
   - Time-to-feedback metrics (how long from PR to test result?)

5. SHARED INFRASTRUCTURE
   - Playwright config as a package (all teams use same base config)
   - Shared fixture library (account, authToken, httpClient)
   - Shared assertion matchers
   - Shared test data factories
```

### Code Quality at SDE Level

```
SDEs are evaluated on code quality even in test code.

What reviewers look for:
1. SOLID principles applied to POM design:
   - Single Responsibility: CitationDetailPage handles detail only (not search)
   - Open/Closed: add new methods without changing existing ones
   - Liskov Substitution: POM subclasses (if any) are substitutable
   - Interface Segregation: don't put all methods in one giant POM class
   - Dependency Inversion: tests depend on POM interfaces, not implementations

2. TypeScript generics:
   // Generic API client â€” not repetitive per resource type
   class ApiClient<TResource> {
     async getById(id: string): Promise<TResource> { ... }
     async create(data: Partial<TResource>): Promise<TResource> { ... }
   }
   class CitationsClient extends ApiClient<Citation> {}

3. Error handling:
   // Test utilities must throw descriptive errors
   if (!this.client) throw new Error(
     `DbClient.query() called before connect(). Did you await dbClient.connect()?`
   );

4. Clean abstractions:
   // Bad: test mixes concerns
   await page.locator('[data-id="citation_status"]').fill('PAID');
   // Good: POM method with clear intent
   await citationForm.setStatus('PAID');
```

---

## SECTION 9 â€” The Day-Before Checklist

Print this and run through it the evening before any SDET interview:

```
FRAMEWORK DESIGN (can you draw the folder structure from memory?):
  â–¡ tests/fixtures/ â†’ test.extend, account, apiClient fixtures
  â–¡ tests/pages/ â†’ POM hierarchy (Page â†’ Component)
  â–¡ tests/clients/ â†’ one class per API service
  â–¡ tests/data/ â†’ headers, payloads, enums, types
  â–¡ playwright.config.ts â†’ projects, retries, workers, storageState

PLAYWRIGHT INTERNALS (can you explain in 30 seconds?):
  â–¡ Locator vs Element â€” lazy, never stale, re-queries each time
  â–¡ BrowserContext â€” why it's the isolation unit
  â–¡ CDP â€” how actions reach the browser (WebSocket messages)
  â–¡ Auto-retry â€” how expect(locator).toHaveText() works
  â–¡ Promise.all â€” why it's required for race-condition-free new tabs
  â–¡ Actionability checks â€” visible + stable + enabled + receives events

DATA MANAGEMENT (the hardest part in senior interviews):
  â–¡ Unique test data â†’ timestamp/UUID + worker index
  â–¡ Test isolation â†’ each test creates/cleans its own data
  â–¡ Worker-scoped fixtures â†’ account login (once per worker, not per test)
  â–¡ TestDataManager â†’ try/finally cleanup pattern

BEHAVIORAL STORY (STAR format â€” 2 minutes each):
  â–¡ "I fixed a flaky test" â†’ D365 two-phase render, timing diagnosis, 200 runs proof
  â–¡ "I pushed back on a deadline" â†’ automated test found real bug, proposed limited rollout
  â–¡ "I built something from scratch" â†’ describe your best framework contribution

SDE BRIDGE (if targeting SDE-level):
  â–¡ DSA patterns: Set for O(n) dedup, sliding window for metrics
  â–¡ TypeScript generics: ApiClient<T>, typed DB rows
  â–¡ SOLID applied to test code: single responsibility POM, open/closed fixture
  â–¡ Scale thinking: 50 engineers, CI at scale, flakiness tracking, ownership model

QUESTIONS TO ASK:
  â–¡ "What is your current pass rate in CI?"
  â–¡ "How do you handle test data cleanup?"
  â–¡ "Are SDETs involved in sprint planning?"
  â–¡ "What's the ratio of automated to manual tests?"
```

---
**Navigation**: [â† Chapter 31: API Mocking](31_API_Mocking_page_route.md) | [Index](00_INDEX.md)


### Challenge: "Diagnose this CI failure without running the suite locally"

The interviewer pastes a failing CI log:

```
FAIL tests/citations/create-citation.spec.ts
  ✗ Create citation and verify notification
    Error: Timeout 30000ms exceeded.
    =========================== logs ===========================
    waiting for locator('.notification-badge').toHaveText('1')
    ============================================================
    
Worker process exited with code 1
```

Walk through exactly how you would diagnose this from the log alone.

<details><summary>Answer</summary>

**Step 1 — What the error means precisely:**  
`Timeout 30000ms exceeded` on `locator('.notification-badge').toHaveText('1')` means Playwright polled the element for 30 seconds and the text never became `'1'`. The test stepped past the API call, but the UI state didn't update.

**Step 2 — Four root-cause hypotheses, ordered by likelihood:**

| # | Hypothesis | Signal |
|---|---|---|
| 1 | Notification is async; the badge updates via WebSocket/polling but the service was slow or dead in CI | Check: was the notifications service healthy in CI? Was the WS connection established? |
| 2 | Race condition — assertion fires before the badge re-renders (React batching) | Check: does the badge animate? Is there a loading spinner that hides it during update? |
| 3 | Test data isolation failure — another test left stale badge count of `0` and this test's notification didn't fire | Check: does the test create its own isolated user with a fresh account? |
| 4 | The `.notification-badge` selector changed in a recent PR | Check: last 24h commits to the frontend |

**Step 3 — What I'd ask the interviewer next:**  
"Is there a Playwright trace zip attached to this CI run? With the trace I can see the DOM state at every step including the exact millisecond the timeout occurred."

**Step 4 — What the fix looks like:**  
```typescript
// Before: fragile — no guard that badge exists before checking text
await expect(page.locator('.notification-badge')).toHaveText('1');

// After: ensure badge is visible first, THEN check text
await expect(page.locator('.notification-badge')).toBeVisible();
await expect(page.locator('.notification-badge')).toHaveText('1');
// Or, if WebSocket driven, wait for the WS frame first, then assert UI
```

**The SDE insight the interviewer is looking for:**  
You read logs systematically, isolate hypotheses by likelihood, know where to find more evidence (trace files), and can propose a targeted fix — rather than saying "I'll re-run it and see."

</details>

---
**Navigation**: [← Chapter 31: API Mocking](31_API_Mocking_page_route.md) | [Index](00_INDEX.md)
