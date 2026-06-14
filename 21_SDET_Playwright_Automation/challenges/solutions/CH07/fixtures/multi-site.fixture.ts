/**
 * MultiSiteFixture — Playwright fixture that provides:
 *   1. Two independent BrowserContexts (admin + customer)
 *   2. A shared TestDataBridge for cross-context data flow
 *   3. Auth pool acquisition for parallel-safe account isolation
 *   4. Proper cleanup in finally-block (Law 5)
 */
import { test as base, type BrowserContext, type Page } from "@playwright/test";
import { AdminCustomerCreatePage } from "../websites/admin/pages/AdminCustomerCreatePage";
import { CustomerPortalPage } from "../websites/portal/pages/CustomerPortalPage";
import { OrderConfirmationPage } from "../websites/portal/pages/OrderConfirmationPage";
import { AdminClient } from "../applications/admin-service/api/AdminClient";
import { NotificationsClient } from "../applications/notifications-service/api/NotificationsClient";
import { TestDataBridge } from "../utilities/data/test-data-bridge";
import { APP } from "../constants/app.constants";

// ---------------------------------------------------------------------------
// Auth pool (copied from CH06 — same pattern, scoped to CH07)
// ---------------------------------------------------------------------------
import * as fs from "fs";
import * as path from "path";
import * as lockfile from "proper-lockfile";

const LOCK_DIR = path.resolve(__dirname, ".locks");
if (!fs.existsSync(LOCK_DIR)) {
  fs.mkdirSync(LOCK_DIR, { recursive: true });
}

interface PooledAccount {
  id: number;
  username: string;
  password: string;
  role: "ADMIN" | "CUSTOMER";
}

const ACCOUNTS: PooledAccount[] = [
  { id: 1, username: "Admin", password: "admin123", role: "ADMIN" },
  {
    id: 2,
    username: "tomsmith",
    password: "SuperSecretPassword!",
    role: "CUSTOMER",
  },
  { id: 3, username: "Admin", password: "admin123", role: "ADMIN" },
  {
    id: 4,
    username: "tomsmith",
    password: "SuperSecretPassword!",
    role: "CUSTOMER",
  },
];

const releasedFns = new Map<number, () => Promise<void>>();

function lockPath(accountId: number): string {
  const p = path.join(LOCK_DIR, `account-${accountId}.lock`);
  if (!fs.existsSync(p)) fs.writeFileSync(p, "");
  return p;
}

async function acquireAccount(): Promise<PooledAccount> {
  const workerIndex = parseInt(process.env.TEST_WORKER_INDEX ?? "0", 10);
  const startOffset = workerIndex % ACCOUNTS.length;
  const ordered = [
    ...ACCOUNTS.slice(startOffset),
    ...ACCOUNTS.slice(0, startOffset),
  ];

  const startedAt = Date.now();
  const budgetMs = 60_000;

  while (Date.now() - startedAt < budgetMs) {
    for (const account of ordered) {
      try {
        const release = await lockfile.lock(lockPath(account.id), {
          retries: 0,
          stale: 3_600_000,
          update: 10_000,
        });
        releasedFns.set(account.id, release);
        return account;
      } catch {
        continue;
      }
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(
    "[multi-site.fixture] No account available within 60s — pool exhausted.",
  );
}

async function releaseAccount(accountId: number): Promise<void> {
  const release = releasedFns.get(accountId);
  if (!release) return;
  try {
    await release();
  } finally {
    releasedFns.delete(accountId);
  }
}

// ---------------------------------------------------------------------------
// Fixture types
// ---------------------------------------------------------------------------
interface MultiSiteFixtures {
  adminContext: BrowserContext;
  customerContext: BrowserContext;
  adminPage: Page;
  customerPage: Page;
  adminClient: AdminClient;
  notificationsClient: NotificationsClient;
  bridge: TestDataBridge;
}

// ---------------------------------------------------------------------------
// Fixture definition
// ---------------------------------------------------------------------------
export const test = base.extend<MultiSiteFixtures>({
  // Two contexts — both visible in the trace (Law 6 cross-validation)
  adminContext: async ({ browser }, use) => {
    const ctx = await browser.newContext({
      baseURL: APP.orangehrm.baseUrl,
      viewport: { width: 1440, height: 900 },
    });
    await use(ctx);
    await ctx.close();
  },

  customerContext: async ({ browser }, use) => {
    const ctx = await browser.newContext({
      baseURL: APP.internet.baseUrl,
      viewport: { width: 1440, height: 900 },
    });
    await use(ctx);
    await ctx.close();
  },

  adminPage: async ({ adminContext }, use) => {
    const page = await adminContext.newPage();
    await use(page);
    await page.close();
  },

  customerPage: async ({ customerContext }, use) => {
    const page = await customerContext.newPage();
    await use(page);
    await page.close();
  },

  // API clients — one per context to allow parallel-safe request tracking
  adminClient: async ({ adminContext }, use) => {
    const client = new AdminClient(adminContext.request, APP.reqres.baseUrl);
    await use(client);
  },

  notificationsClient: async ({ customerContext }, use) => {
    const client = new NotificationsClient(
      customerContext.request,
      APP.reqres.baseUrl,
    );
    await use(client);
  },

  // Shared data bridge — carries customerId and orderId between steps
  bridge: async ({}, use) => {
    const bridge = new TestDataBridge();
    await use(bridge);
    bridge.clear();
  },
});

// Re-export expect for convenience
export { expect } from "@playwright/test";

export { AdminCustomerCreatePage } from "../websites/admin/pages/AdminCustomerCreatePage";
export { CustomerPortalPage } from "../websites/portal/pages/CustomerPortalPage";
export { OrderConfirmationPage } from "../websites/portal/pages/OrderConfirmationPage";
export { AdminClient } from "../applications/admin-service/api/AdminClient";
export { NotificationsClient } from "../applications/notifications-service/api/NotificationsClient";
export { TestDataBridge } from "../utilities/data/test-data-bridge";
