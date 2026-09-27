/**
 * QUIZ 02 — Challenge 18 [HARD]: GraphQL Mocking by Operation Name
 *
 * REQUIREMENT:
 *   Write a page.route handler for **\/graphql that fulfills the request
 *   with a mocked payload ONLY if the operation name is GetCustomerData.
 *   For all other operations, let the request continue to the real server.
 *
 *   Hint: GraphQL requests are POSTs where the body contains an operationName.
 */

import { test, expect } from "@playwright/test";

// ============================================================
// ✅ SOLUTION
// ============================================================

test("mock GetCustomerData, pass through all other GQL operations", async ({
  page,
}) => {
  await page.route("**/graphql", async (route) => {
    const request = route.request();

    // GraphQL uses POST; GETs (e.g. introspection over GET) go straight through
    if (request.method() !== "POST") {
      return route.continue();
    }

    // Parse the JSON request body
    // postDataJSON() returns the parsed JSON object or null if not JSON
    const body = request.postDataJSON() as {
      operationName?: string;
      query?: string;
      variables?: Record<string, unknown>;
    } | null;

    if (!body) {
      return route.continue(); // not JSON — pass through
    }

    // Check operationName first (preferred — explicit and reliable)
    // Fall back to checking the query string for named operations
    const isTargetOp =
      body.operationName === "GetCustomerData" ||
      (body.query?.includes("query GetCustomerData") ?? false);

    if (isTargetOp) {
      // ✅ Fulfill with mocked response — request does NOT reach the server
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            customer: {
              id: "C-001",
              name: "Mocked Customer",
              email: "mock@example.com",
              status: "ACTIVE",
            },
          },
        }),
      });
    } else {
      // ✅ All other operations reach the real GraphQL server
      await route.continue();
    }
  });

  // Trigger an action that fires GetCustomerData
  await page.goto("https://app.example.com/customers/C-001");

  // The UI will render the MOCKED customer data
  await expect(page.locator('[data-testid="customer-name"]')).toHaveText(
    "Mocked Customer",
  );
});

// ============================================================
// EXTENDED — mock multiple operations with a dispatch map
// ============================================================

type GraphQLBody = {
  operationName?: string;
  query?: string;
  variables?: Record<string, unknown>;
};

type MockMap = Record<string, unknown>; // operationName → mock data

async function setupGraphQLMocks(
  page: import("@playwright/test").Page,
  mocks: MockMap,
): Promise<void> {
  await page.route("**/graphql", async (route) => {
    if (route.request().method() !== "POST") {
      return route.continue();
    }

    const body = route.request().postDataJSON() as GraphQLBody | null;
    const opName = body?.operationName ?? "";

    if (opName && opName in mocks) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: mocks[opName] }),
      });
    } else {
      await route.continue();
    }
  });
}

test("multiple GQL mocks via dispatch map", async ({ page }) => {
  await setupGraphQLMocks(page, {
    GetCustomerData: {
      customer: { id: "C-001", name: "Alice", status: "ACTIVE" },
    },
    GetCustomerOrders: {
      orders: [
        { id: "ORD-001", amount: 99.99 },
        { id: "ORD-002", amount: 49.99 },
      ],
    },
    // GetCustomerNotes is NOT in the map → hits the real server
  });

  await page.goto("https://app.example.com/customers/C-001");

  await expect(page.locator('[data-testid="customer-name"]')).toHaveText(
    "Alice",
  );
  await expect(page.locator('[data-testid="order-count"]')).toHaveText("2");
});

// ============================================================
// Verify a captured GQL request payload
// ============================================================

test("verify GetCustomerData variables", async ({ page }) => {
  let capturedVariables: Record<string, unknown> | undefined;

  await page.route("**/graphql", async (route) => {
    const body = route.request().postDataJSON() as GraphQLBody | null;

    if (body?.operationName === "GetCustomerData") {
      capturedVariables = body.variables;
    }

    await route.continue(); // let it hit the real server
  });

  await page.goto("https://app.example.com/customers/C-001");

  expect(capturedVariables).toEqual(
    expect.objectContaining({ customerId: "C-001" }),
  );
});

// WHY
// GraphQL differs from REST in one important way: ALL operations go to the
// SAME endpoint (usually POST /graphql).  The operation name in the JSON body
// is the discriminator that tells you which query/mutation is being executed.
//
// Two ways to identify the operation:
//   1. body.operationName — present when the client sends a named operation
//      (best practice: all production GQL operations should be named)
//   2. body.query text — fallback for anonymous queries; parse with includes()
//      or a proper GQL parser if precision is needed
//
// Always call exactly ONE of route.fulfill / route.continue / route.abort
// to avoid hanging requests (see Challenge 16).
//
// postDataJSON() returns parsed JSON or null.  Always null-check before
// accessing fields — non-JSON requests (GET introspection, malformed bodies)
// will return null.
