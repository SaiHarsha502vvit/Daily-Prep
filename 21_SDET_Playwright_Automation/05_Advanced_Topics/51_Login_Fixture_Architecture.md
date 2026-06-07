# 51. Login Fixture Architecture — A Taxonomy of Auth Strategies

**Navigation**: [← Previous: Real-World SPA Automation](./50_Real_World_SPA_Tabs_Menuitems_No_IDs.md) | [Index](../../00_MASTER_INDEX.md) | [Next: UI Flow Fixtures →](./52_UI_Flow_Fixtures.md)

**Cross-links:**
- [`Ch06: Custom Fixtures Architecture`](../02_Core_Architecture/06_Custom_Fixtures_Architecture.md) — `test.extend()`, `scope: 'worker'`, `yield`/`use`
- [`Ch16: StorageState Chaining`](../03_D365_And_Patterns/16_CrossSite_Pattern6_StorageState_Chaining.md) — Global state persistence, cross-domain cookies
- [`Ch28: Test Data Lifecycle`](./28_Test_Data_Lifecycle_and_Cleanup.md) — Teardown, cleanup, orphan sweeping
- [`Ch07: E2E Test Architecture`](../02_Core_Architecture/07_test_step_E2E_Architecture.md) — Data accumulator, step isolation

---

## 5W1H — Why This Chapter?

- **WHAT**: A formal taxonomy of authentication fixture patterns, from naive inline login to worker-scoped, role-based, API-first systems. Each level is evaluated on four dimensions: **security**, **performance**, **maintainability**, and **isolation**.
- **WHY**: Login is the gatekeeper of every E2E test. If your login strategy is slow, flaky, or insecure, the cost compounds across every test in the suite. The choice of auth pattern is one of the highest-leverage architectural decisions in a test framework.
- **WHO**: SDETs scaling from 5 tests to 500, or inheriting a codebase where every test begins with `await page.fill('#username', 'admin')`.
- **WHEN**: Immediately after mastering `test.extend()` (Ch06) and before writing your 20th test.
- **HOW**: By defining five levels of auth sophistication as a partially ordered lattice, each level strictly dominating its predecessor on at least one dimension without regressing on another.

---

## 0. The Auth Problem — Formalised

Let `T = {t₁, t₂, …, tₙ}` be the set of tests in a suite.
Let `L` be the login operation with latency `τ(L)`.
Let `W` be the set of workers, `|W| = w`.
Let `R` be the set of roles, `|R| = r`.

**Naïve total login time:**

$$
T_{\text{naïve}} = n \cdot \tau(L)
$$

For `n = 100`, `τ(L) = 3\text{s}`: `T_{\text{naïve}} = 300\text{s} = 5\text{min}` of login overhead alone.

**This chapter's goal:** Reduce `T_{\text{auth}}` to `O(w \cdot r \cdot \tau(L))`, where `w` is bounded by CPU cores (typically `w ≤ 8`) and `r` is the number of distinct roles (typically `r ≤ 4`).

For `w = 4`, `r = 2`: `T_{\text{auth}} = 24\text{s}` — a **12.5× reduction**.

---

## 1. Level 0 — Inline Hardcoded Auth (Anti-pattern)

### Definition (Level 0)
> Credentials embedded in test source code, login performed via UI automation inside each test body.

```typescript
// Definition 51.1 — The Naïve Login Pattern (DO NOT USE)
test('search invoice', async ({ page }) => {
  await page.goto('https://portal.acme.com/login');
  await page.locator('#username').fill('admin@acme.com');
  await page.locator('#password').fill('Password123!');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByText('Dashboard')).toBeVisible();

  // The actual test starts here...
});
```

### Evaluation Matrix

| Dimension | Score | Rationale |
|---|---|---|
| Security | F | Credentials in VCS = breach on commit |
| Performance | F | `O(n · τ(L))` |
| Maintainability | F | Rotation requires editing N test files |
| Isolation | C | New `BrowserContext` per test, but no cleanup |

**Theorem 51.1 (Level 0 Unsuitability).** *For any test suite with `n > 1`, Level 0 is Pareto-dominated by Level 1 on security, performance, and maintainability.*

*Proof.* Level 1 replaces hardcoded credentials with environment variables (security ↑), extracts login to a helper (maintainability ↑), and makes no performance regression. ∎

---

## 2. Level 1 — Environment-Variable Auth with Helper

### Definition (Level 1)
> Credentials externalised to environment variables; login logic extracted to a pure helper function invoked per test.

```typescript
// Definition 51.2 — The Environment-Variable Login Pattern
async function uiLogin(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login');
  await page.locator('#username').fill(email);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByText('Dashboard')).toBeVisible();
}

// Test invocation
test('search invoice', async ({ page }) => {
  await uiLogin(page, process.env.ADMIN_EMAIL!, process.env.ADMIN_PASSWORD!);
  // ...
});
```

### Evaluation Matrix

| Dimension | Score | Rationale |
|---|---|---|
| Security | C | Credentials in env, but still on disk |
| Performance | F | Still `O(n · τ(L))` |
| Maintainability | B | One function, but still per-test call |
| Isolation | B | Tests share no state, but no explicit cleanup |

**Lemma 51.1.** *Level 1 solves the security problem up to the security boundary of the CI environment. It does NOT solve the performance problem because the asymptotic complexity remains `O(n · τ(L))`.*

---

## 3. Level 2 — Test-Scoped Fixture

### Definition (Level 2)
> A `test.extend()` fixture that creates an isolated `BrowserContext`, performs UI login, and yields the page to the test. Cleanup closes the context.

This is the first level where Playwright's fixture system is used correctly. See Ch06 for the fixture mechanism itself; this chapter extends it to the auth domain.

```typescript
// Definition 51.3 — The Test-Scoped Auth Fixture
import { test as base, expect } from '@playwright/test';

interface AuthFixtures {
  adminPage: Page;    // Pre-authenticated as admin
  viewerPage: Page;   // Pre-authenticated as viewer
}

export const test = base.extend<AuthFixtures>({
  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await uiLogin(page, process.env.ADMIN_EMAIL!, process.env.ADMIN_PASSWORD!);
    await use(page);
    await context.close();  // ← explicit cleanup (Ch28)
  },

  viewerPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await uiLogin(page, process.env.VIEWER_EMAIL!, process.env.VIEWER_PASSWORD!);
    await use(page);
    await context.close();
  },
});
```

### Evaluation Matrix

| Dimension | Score | Rationale |
|---|---|---|
| Security | B | Enforced cleanup; no credential leakage between tests |
| Performance | F | Still `O(n · τ(L))` — each test creates a new context and logs in |
| Maintainability | A | Centralised, typed, discoverable via IDE |
| Isolation | A | Each test gets its own `BrowserContext` |

**Theorem 51.2 (Level 2 Trade-off).** *Level 2 is the optimal solution for `n < 10` and `τ(L) < 1s`. For larger suites, the performance dimension dominates and mandates an upgrade to Level 3.*

---

## 4. Level 3 — Worker-Scoped Fixture with `storageState`

### Definition (Level 3)
> A fixture with `scope: 'worker'` that performs login ONCE per worker, serialises the resulting `BrowserContext` state to a JSON blob, and reuses that state for every test in the worker.

This is the **inflection point** where complexity jumps but performance dramatically improves.

```typescript
// Definition 51.4 — The Worker-Scoped Auth Fixture
export const test = base.extend<{}, { adminContext: BrowserContext }>({
  adminContext: [
    async ({ browser }, use) => {
      // Phase 1: Temporary login (expensive, happens ONCE per worker)
      const tempCtx = await browser.newContext();
      const tempPage = await tempCtx.newPage();
      await uiLogin(tempPage, process.env.ADMIN_EMAIL!, process.env.ADMIN_PASSWORD!);

      // Phase 2: Capture state
      const state = await tempCtx.storageState();
      await tempCtx.close();

      // Phase 3: Create reusable context from captured state
      const context = await browser.newContext({ storageState: state });
      await use(context);

      // Phase 4: Worker teardown
      await context.close();
    },
    { scope: 'worker' },
  ],

  // Test-scoped page derived from worker context
  adminPage: async ({ adminContext }, use) => {
    const page = await adminContext.newPage();
    await use(page);
    await page.close();
  },
});
```

### Complexity Analysis

| Metric | Level 2 | Level 3 | Ratio |
|---|---|---|---|
| Login count | `n` | `w` | `n / w` |
| Login time | `n · τ(L)` | `w · τ(L)` | `n / w` |
| Context count | `n` | `w + n` (worker + test pages) | — |

For `n = 100`, `w = 4`: login operations drop from 100 to 4. **25× reduction**.

### Why `storageState` Is Required

Worker-scoped fixtures without `storageState` fail silently:

```typescript
// ❌ WRONG: Worker context is reused, but each newPage() starts from zero cookies
adminContext: [
  async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await uiLogin(page, ...);  // Login happens
    await use(context);         // Context given to test
    // But test does context.newPage() — new page has NO cookies!
  },
  { scope: 'worker' },
],
```

The `newPage()` inside the test creates a `/page` object in the **same** `BrowserContext`. Cookies set during login ARE shared across pages in the same context. However, `storageState` is the **recommended** pattern because:

1. It makes the dependency explicit
2. It supports `globalSetup` pre-seeding (Level 4)
3. It handles `workerIndex`-based multi-role variants cleanly

**Corollary 51.1.** *In Playwright, `BrowserContext` is the unit of state isolation. `Page` is the unit of navigation. All pages within a context share cookies, localStorage, and sessionStorage.*

---

## 5. Level 4 — Role-Based Auth Factory

### Definition (Level 4)
> A worker-scoped factory fixture that caches `storageState` per role, supporting `|R|` distinct authentication profiles within a single worker.

```typescript
// Definition 51.5 — The Role-Based Auth Factory
export enum UserRole {
  ADMIN = 'admin',
  VIEWER = 'viewer',
  BILLING = 'billing',
}

const ROLE_CREDS: Record<UserRole, { email: string; password: string }> = {
  [UserRole.ADMIN]:   { email: process.env.ADMIN_EMAIL!,   password: process.env.ADMIN_PASSWORD! },
  [UserRole.VIEWER]:  { email: process.env.VIEWER_EMAIL!,  password: process.env.VIEWER_PASSWORD! },
  [UserRole.BILLING]: { email: process.env.BILLING_EMAIL!, password: process.env.BILLING_PASSWORD! },
};

// Pre-flight validation (fail fast at import time)
for (const [role, creds] of Object.entries(ROLE_CREDS)) {
  if (!creds.email || !creds.password) {
    throw new Error(`[AuthFixture] Missing credentials for role: ${role}`);
  }
}

interface RoleFixtures {
  adminPage: Page;
  viewerPage: Page;
  billingPage: Page;
}

const stateCache = new Map<UserRole, string>();  // Map<role, serializedStorageState>

export const test = base.extend<{}, RoleFixtures>({
  // ─── Internal factory (not exposed to tests) ───────────────────────────
  _getAuthPage: [
    async ({ browser }, use) => {
      const factory = async (role: UserRole): Promise<Page> => {
        if (!stateCache.has(role)) {
          const tempCtx = await browser.newContext();
          const tempPage = await tempCtx.newPage();
          await uiLogin(tempPage, ROLE_CREDS[role].email, ROLE_CREDS[role].password);
          const state = await tempCtx.storageState();
          stateCache.set(role, JSON.stringify(state));
          await tempCtx.close();
        }
        const context = await browser.newContext({
          storageState: JSON.parse(stateCache.get(role)!),
        });
        return context.newPage();
      };
      await use(factory);
    },
    { scope: 'worker' },
  ],

  // ─── Exposed fixtures ──────────────────────────────────────────────────
  adminPage:  async ({ _getAuthPage }, use) => { await use(await _getAuthPage(UserRole.ADMIN)); },
  viewerPage: async ({ _getAuthPage }, use) => { await use(await _getAuthPage(UserRole.VIEWER)); },
  billingPage: async ({ _getAuthPage }, use) => { await use(await _getAuthPage(UserRole.BILLING)); },
});
```

### Evaluation Matrix

| Dimension | Score | Rationale |
|---|---|---|
| Security | A | Enum-typed roles, pre-flight validation |
| Performance | B | `O(w · r · τ(L))` — one login per role per worker |
| Maintainability | A | Adding a role = one enum entry + one fixture line |
| Isolation | A | Each role gets its own context |

### The `Map<K, V>` Cache — A CS Pattern

The `stateCache` is a classic **Memoisation** pattern:
- **Time complexity** of role lookup: `O(1)` average case (hash map)
- **Space complexity**: `O(r · s)` where `s` is the average size of a serialised `storageState`
- Suitable because `r` is small (typically `r ≤ 4`) and `storageState` is typically < 50 KB

**Connection to Ch33 (CS Thinking):** This is exactly the HashMap pattern applied to test fixture design.

---

## 6. Level 5 — API-First Authentication

### Definition (Level 5)
> Authentication performed via REST API (not browser UI), extracting tokens and injecting them into `BrowserContext` headers or `localStorage`.

```typescript
// Definition 51.6 — The API-First Auth Pattern
export const test = base.extend<{ adminPage: Page }>({
  adminPage: async ({ browser, playwright }, use) => {
    // Phase 1: API login (200ms vs 3000ms for UI login)
    const apiContext = await playwright.request.newContext({
      baseURL: process.env.API_BASE_URL,
    });

    const loginResp = await apiContext.post('/api/auth/login', {
      data: {
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
      },
    });

    if (!loginResp.ok()) {
      throw new Error(`API login failed: ${await loginResp.text()}`);
    }

    const { token } = await loginResp.json();
    await apiContext.dispose();

    // Phase 2: Create browser context with token
    const context = await browser.newContext({
      extraHTTPHeaders: { Authorization: `Bearer ${token}` },
    });

    // Phase 3: Inject into localStorage if SPA reads from there
    const page = await context.newPage();
    await page.goto('/');
    await page.evaluate((t) => {
      localStorage.setItem('authToken', t);
      sessionStorage.setItem('authToken', t);
    }, token);

    await use(page);
    await context.close();
  },
});
```

### Complexity Analysis

| Level | UI Logins | API Calls | State Persistence | Time (n=100, w=4, r=2) |
|---|---|---|---|---|
| 0 | 100 | 0 | None | 300s |
| 1 | 100 | 0 | None | 300s |
| 2 | 100 | 0 | Per-test context | 300s |
| 3 | 4 | 0 | `storageState` | 12s |
| 4 | 8 | 0 | `storageState` + cache | 24s |
| 5 | 0 | 4 | `localStorage` + headers | 0.8s |

**Theorem 51.3 (Asymptotic Dominance).** *Level 5 dominates all lower levels on the performance dimension with `τ(L_{\text{api}}) \ll \tau(L_{\text{ui}})`. If the API login endpoint exists, Level 5 is the Pareto-optimal choice.*

### Precondition for Level 5

Level 5 has a strict precondition:
- The application MUST expose a programmatic login endpoint (OAuth2 password grant, test token API, or similar)
- The application MUST accept auth via `Authorization` header OR `localStorage`
- The application MUST NOT require browser-specific artefacts (e.g., anti-forgery tokens rendered in the DOM)

**If any precondition fails, Level 5 is not applicable.** Fall back to Level 4.

---

## 7. The `globalSetup` Alternative — When to Use It Instead of Fixtures

`globalSetup` (Ch16) runs once before ALL tests; fixtures run once per worker. The choice depends on `r` (number of roles):

| Situation | Use `globalSetup` | Use Worker Fixture |
|---|---|---|
| Single role, all tests need it | ✅ Pre-seed once | ❌ Wastes 3 extra logins |
| Multiple roles, different tests | ❌ Complex file management | ✅ Natural per-role isolation |
| Auth state expires during suite | ❌ All tests fail | ✅ Each worker re-auths if needed |
| Per-worker unique data ( seeded company) | ❌ Cannot vary per worker | ✅ `workerIndex` parameter available |

**Decision Rule:**
- If `r = 1` and state is long-lived → `globalSetup`
- If `r > 1` or state varies per worker → worker-scoped fixture (Level 3/4)

---

## 8. The Selection Algorithm

```
function selectAuthLevel(apiAvailable: boolean, roleCount: number, testCount: number): Level {
  if (apiAvailable) return Level.API_FIRST;           // Level 5
  if (roleCount === 1 && testCount > 20) return Level.WORKER_SCOPED;  // Level 3
  if (roleCount > 1) return Level.ROLE_FACTORY;        // Level 4
  if (testCount > 5) return Level.TEST_FIXTURE;        // Level 2
  return Level.ENV_HELPER;                             // Level 1
}
```

---

## Quick Reference

| Level | Time Complexity | Best For | Falls Back To |
|---|---|---|---|
| 0 — Inline | `O(n · τ(L))` | Never | Level 1 |
| 1 — Env Helper | `O(n · τ(L))` | < 5 tests, learning | Level 2 |
| 2 — Test Fixture | `O(n · τ(L))` | 5–20 tests, single role | Level 3 |
| 3 — Worker Scoped | `O(w · τ(L))` | 20+ tests, single role | Level 4 |
| 4 — Role Factory | `O(w · r · τ(L))` | Multiple roles | Level 5 |
| 5 — API First | `O(w · r · τ_{\text{api}})` | API available, scale | — |

---

## Navigation

**Previous:** [← Real-World SPA Automation](./50_Real_World_SPA_Tabs_Menuitems_No_IDs.md)
**Next:** [→ Index](../../00_INDEX.md)
