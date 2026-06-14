/**
 * QUIZ 02 — Challenge 17 [MEDIUM]: Fixture Dependency Scope Mismatch
 *
 * ORIGINAL BUGGY CODE:
 *   db: async ({}, use) => { ... },            // test-scoped (default)
 *   user: [async ({ db }, use) => { ... },
 *          { scope: 'worker' }],               // worker-scoped depends on test-scoped
 *
 * QUESTION: What is the Playwright error here? Why?
 */

import { test as base } from "@playwright/test";

// ============================================================
// TYPE STUBS
// ============================================================

interface User {
  id: string;
  name: string;
  role: string;
}

interface Database {
  createUser(opts: { name: string }): Promise<User>;
  deleteUser(id: string): Promise<void>;
  disconnect(): Promise<void>;
}

async function connectToDatabase(): Promise<Database> {
  return {
    async createUser(opts) {
      return { id: "u-1", name: opts.name, role: "standard" };
    },
    async deleteUser(_id) {},
    async disconnect() {},
  };
}

// ============================================================
// BUG — worker-scoped fixture depends on test-scoped fixture
// ============================================================
// Playwright Error:
//   "Fixture 'user' has worker scope, but depends on a test-scoped fixture 'db'."
//
// WHY: Worker-scoped fixtures run ONCE when the worker PROCESS starts — before
// any test in that worker begins.  Test-scoped fixtures run before EACH test.
// If 'user' (worker scope) depends on 'db' (test scope), Playwright doesn't
// know WHICH test's 'db' to inject — no test has started yet.
//
// RULE: Worker-scoped fixtures can ONLY depend on other worker-scoped fixtures.
//       Test-scoped fixtures can depend on both test-scoped AND worker-scoped fixtures.

// ❌ BUGGY — will throw at runtime
const _broken_test = base.extend<{ user: User }, { db: Database }>({
  // Test-scoped db (default)
  db: async ({}, use) => {
    const db = await connectToDatabase();
    await use(db);
    await db.disconnect();
  },

  // Worker-scoped user — DEPENDS on test-scoped db → ❌ Playwright error
  user: [
    async ({ db }, use) => {
      const user = await db.createUser({ name: "TestUser" });
      await use(user);
      await db.deleteUser(user.id);
    },
    { scope: "worker" }, // ❌ worker cannot depend on test scope
  ],
});

// ============================================================
// FIX OPTION A — promote db to worker scope
// ============================================================
// Use when: the database connection is safe to reuse across tests in
// the same worker (most connection pools are fine with this).

const testWithWorkerDb = base.extend<
  Record<string, never>,
  { db: Database; user: User }
>({
  // Worker-scoped db — created once per worker
  db: [
    async ({}, use) => {
      const db = await connectToDatabase();
      await use(db);
      await db.disconnect(); // called when the worker shuts down
    },
    { scope: "worker" },
  ],

  // Worker-scoped user — can now depend on worker-scoped db ✅
  user: [
    async ({ db }, use) => {
      const user = await db.createUser({ name: "WorkerUser" });
      await use(user);
      await db.deleteUser(user.id);
    },
    { scope: "worker" },
  ],
});

// ============================================================
// FIX OPTION B — demote user to test scope
// ============================================================
// Use when: each test needs a FRESH user (the user object is modified by tests).

const testWithTestUser = base.extend<{ db: Database; user: User }>({
  // Test-scoped db
  db: async ({}, use) => {
    const db = await connectToDatabase();
    await use(db);
    await db.disconnect();
  },

  // Test-scoped user — depends on test-scoped db ✅ (same scope = fine)
  user: async ({ db }, use) => {
    const user = await db.createUser({ name: "TestUser" });
    await use(user);
    await db.deleteUser(user.id);
    // Runs after EVERY test — fresh user each time
  },
});

// ============================================================
// SCOPE DEPENDENCY RULES (for reference)
// ============================================================
//
//   worker → worker  ✅  allowed
//   worker → test    ❌  FORBIDDEN — no test has started yet
//   test   → worker  ✅  allowed (test scope can "see" worker fixtures)
//   test   → test    ✅  allowed

// Demo usage:
testWithWorkerDb("user is available", async ({ user }) => {
  console.log("User id:", user.id);
});

testWithTestUser("fresh user per test", async ({ user, db }) => {
  const fresh = await db.createUser({ name: "AnotherUser" });
  console.log("Test user:", user.id, "Extra user:", fresh.id);
  await db.deleteUser(fresh.id);
});

export { testWithWorkerDb, testWithTestUser };

// WHY
// Playwright enforces the scope hierarchy because of how the fixture lifecycle
// is tied to the process model:
//
//   Worker startup:  worker-scoped fixtures are set up in DEPENDENCY order
//   Test start:      test-scoped fixtures are set up
//   Test body:       runs
//   Test end:        test-scoped fixtures are torn down (reverse order)
//   Worker shutdown: worker-scoped fixtures are torn down (reverse order)
//
// When a worker-scoped fixture asks for a test-scoped dependency, Playwright
// would need to create a test-scoped fixture outside of any test context —
// which breaks the lifecycle model.  So it rejects the configuration early
// with a clear error rather than letting it fail mysteriously at runtime.
