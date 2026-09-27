/**
 * QUIZ 02 — Challenge 20 [HARD]: Dynamic Fixture Parameters (Options Pattern)
 *
 * REQUIREMENT:
 *   Design a testAccount fixture so individual tests can override accountRole.
 *   Default role: 'standard'. Override: 'admin'.
 *   Hint: Use Playwright's test.use({}) pattern with a custom option fixture.
 */

import { test as base, expect } from "@playwright/test";

// ============================================================
// Domain types
// ============================================================

type AccountRole = "standard" | "admin" | "read-only";

interface TestAccount {
  id: string;
  email: string;
  role: AccountRole;
}

// Stub — in production this calls your API or DB seeding layer
async function createTestUserInDB(role: AccountRole): Promise<TestAccount> {
  return {
    id: `test-${role}-${Date.now()}`,
    email: `test-${role}@example.com`,
    role,
  };
}

async function deleteTestUserFromDB(_id: string): Promise<void> {
  // DELETE /users/:id
}

// ============================================================
// ✅ SOLUTION — Options Pattern
// ============================================================
// The key insight: define a SEPARATE fixture for the OPTION with a default
// value AND { option: true }.  Then the setup fixture READS that option
// to decide what to create.  Per-test overrides go through test.use({}).

interface MyFixtures {
  accountRole: AccountRole; // the option
  testAccount: TestAccount; // the resulting fixture
}

export const test = base.extend<MyFixtures>({
  // ── STEP 1: Declare the option fixture with a default value ──
  // { option: true } tells Playwright: "this is a configuration knob,
  // not a setup fixture — never create side effects here".
  accountRole: ["standard", { option: true }],

  // ── STEP 2: Read the option inside the setup fixture ──
  // testAccount depends on accountRole just like any other fixture.
  testAccount: async ({ accountRole }, use) => {
    const account = await createTestUserInDB(accountRole);

    await use(account);

    await deleteTestUserFromDB(account.id);
  },
});

// ============================================================
// Usage examples
// ============================================================

// Test A — uses the default 'standard' role (no override needed)
test("standard user sees only their own data", async ({ testAccount }) => {
  expect(testAccount.role).toBe("standard");
  // Use testAccount.email / testAccount.id for login, API calls, etc.
});

// Test B — override accountRole to 'admin' for the ENTIRE FILE
// test.use({ accountRole: 'admin' }) at file scope affects every test
// in this file after this point.
test.use({ accountRole: "admin" });

test("admin user sees all records", async ({ testAccount }) => {
  expect(testAccount.role).toBe("admin");
  // testAccount was created with role: 'admin' because of test.use above
});

// ============================================================
// SCOPED OVERRIDES — only within a describe block
// ============================================================

test.describe("Admin role tests", () => {
  test.use({ accountRole: "admin" }); // applies ONLY to this describe block

  test("admin can delete records", async ({ testAccount }) => {
    expect(testAccount.role).toBe("admin");
  });

  test("admin can view audit log", async ({ testAccount }) => {
    expect(testAccount.role).toBe("admin");
  });
});

test.describe("Read-only role tests", () => {
  test.use({ accountRole: "read-only" });

  test("read-only user cannot edit", async ({ testAccount }) => {
    expect(testAccount.role).toBe("read-only");
  });
});

// ============================================================
// EXTENDED — multiple options in one fixture set
// ============================================================

interface ExtendedFixtures {
  accountRole: AccountRole;
  accountRegion: "US" | "EU" | "APAC";
  testAccount: TestAccount & { region: string };
}

async function createRegionalUser(
  role: AccountRole,
  region: string,
): Promise<TestAccount & { region: string }> {
  return {
    id: `test-${role}-${region}-${Date.now()}`,
    email: `test-${role}-${region.toLowerCase()}@example.com`,
    role,
    region,
  };
}

export const testWithRegion = base.extend<ExtendedFixtures>({
  accountRole: ["standard", { option: true }],
  accountRegion: ["US", { option: true }],

  testAccount: async ({ accountRole, accountRegion }, use) => {
    const account = await createRegionalUser(accountRole, accountRegion);
    await use(account);
    await deleteTestUserFromDB(account.id);
  },
});

testWithRegion.describe("EU admin smoke test", () => {
  testWithRegion.use({ accountRole: "admin", accountRegion: "EU" });

  testWithRegion("EU admin sees EU orders", async ({ testAccount }) => {
    expect(testAccount.role).toBe("admin");
    expect(testAccount.region).toBe("EU");
  });
});

// WHY
// { option: true } is Playwright's mechanism for "fixture-driven configuration".
// Without it you'd need to:
//   - Add a parameter to the fixture function (not possible with test.extend)
//   - Duplicate the fixture with different hard-coded roles (copy-paste hell)
//   - Use environment variables (not test-level granular)
//
// With the options pattern:
//   1. One fixture definition — no duplication.
//   2. test.use({}) provides per-file OR per-describe granularity.
//   3. The default value in [value, { option: true }] serves as documentation
//      AND as the fallback — no test.use() needed for the common case.
//   4. Multiple options can be composed cleanly (accountRole + accountRegion).
//
// This is the enterprise way to avoid N copies of the same fixture with
// slightly different payloads.  It's the Playwright equivalent of
// @ParameterizedTest in JUnit or pytest.mark.parametrize in Python.
