// challenge-18-graphql-mocking.ts

/**
 * Quiz 02 — Challenge 18: GraphQL Mocking by Operation Name
 * Curriculum: Ch10 — API Testing & Mocking
 * Difficulty: MEDIUM
 *
 * Problem: GraphQL endpoints use a SINGLE URL (e.g., /graphql) for ALL queries.
 *          URL-based route matching isn't enough — you must inspect the request body
 *          to distinguish operations.
 * Solution: Intercept /graphql and route by `operationName` in the JSON body.
 */

import { test, expect, type Request, type Route } from '@playwright/test';

/* ───────────────────────────────────────────────────────────────────────────
   GraphQL request / response types
   ─────────────────────────────────────────────────────────────────────────── */

interface GraphQLRequestBody {
  operationName: string;
  query: string;
  variables?: Record<string, unknown>;
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

interface UserQueryData {
  user: { id: string; name: string; email: string };
}

interface OrdersQueryData {
  orders: Array<{ id: string; total: number }>;
}

/* ───────────────────────────────────────────────────────────────────────────
   Helper: Route GraphQL by operation name
   ─────────────────────────────────────────────────────────────────────────── */

export async function mockGraphQLOperation<T>(
  page: Parameters<typeof test>[1] extends (args: infer A) => unknown ? A['page'] : never,
  operationName: string,
  responseData: T,
  options: {
    hasErrors?: boolean;
    status?: number;
  } = {}
): Promise<void> {
  const { hasErrors = false, status = 200 } = options;

  await page.route('**/graphql', async (route: Route, request: Request) => {
    if (request.method() !== 'POST') {
      await route.continue();
      return;
    }

    const body = (await request.postDataJSON()) as GraphQLRequestBody;

    if (body.operationName !== operationName) {
      // Not our operation — let it pass through.
      await route.continue();
      return;
    }

    const response: GraphQLResponse<T> = hasErrors
      ? { errors: [{ message: 'Mocked error' }] }
      : { data: responseData };

    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });
}

/* ───────────────────────────────────────────────────────────────────────────
   Demo test: mocking two different GraphQL operations on the same endpoint
   ─────────────────────────────────────────────────────────────────────────── */

test('quiz-02-ch18: mock GetUser and GetOrders by operation name', async ({ page }) => {
  await page.goto('https://example.com');

  // Mock operation "GetUser"
  await mockGraphQLOperation<UserQueryData>(page, 'GetUser', {
    user: {
      id: 'user-123',
      name: 'Alice',
      email: 'alice@example.com',
    },
  });

  // Mock operation "GetOrders"
  await mockGraphQLOperation<OrdersQueryData>(page, 'GetOrders', {
    orders: [
      { id: 'ord-1', total: 99.99 },
      { id: 'ord-2', total: 49.5 },
    ],
  });

  // Trigger the GraphQL calls from the page.
  const userResult = await page.evaluate(async () => {
    const res = await fetch('/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operationName: 'GetUser',
        query: 'query GetUser($id: ID!) { user(id: $id) { id name email } }',
        variables: { id: 'user-123' },
      }),
    });
    return res.json() as Promise<GraphQLResponse<UserQueryData>>;
  });

  expect(userResult.data?.user.name).toBe('Alice');
  expect(userResult.errors).toBeUndefined();

  const ordersResult = await page.evaluate(async () => {
    const res = await fetch('/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operationName: 'GetOrders',
        query: 'query GetOrders { orders { id total } }',
      }),
    });
    return res.json() as Promise<GraphQLResponse<OrdersQueryData>>;
  });

  expect(ordersResult.data?.orders).toHaveLength(2);
  expect(ordersResult.data?.orders[0]?.total).toBe(99.99);
});

/* ───────────────────────────────────────────────────────────────────────────
   Advanced: mock GraphQL errors
   ─────────────────────────────────────────────────────────────────────────── */

test('quiz-02-ch18: mock GraphQL error response', async ({ page }) => {
  await page.goto('https://example.com');

  await mockGraphQLOperation<UserQueryData>(
    page,
    'GetUser',
    { user: { id: '', name: '', email: '' } }, // data ignored because hasErrors=true
    { hasErrors: true, status: 200 } // GraphQL returns 200 even with errors
  );

  const result = await page.evaluate(async () => {
    const res = await fetch('/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operationName: 'GetUser',
        query: 'query GetUser { user { id } }',
      }),
    });
    return res.json() as Promise<GraphQLResponse<UserQueryData>>;
  });

  expect(result.errors).toBeDefined();
  expect(result.errors?.[0]?.message).toBe('Mocked error');
  expect(result.data).toBeUndefined();
});

/**
 * GRAPHQL MOCKING BEST PRACTICES:
 * 1. Always match on operationName + request method (POST).
 * 2. Use `route.continue()` for operations you don't want to mock.
 * 3. GraphQL error responses still return HTTP 200 — check the `errors` field.
 * 4. Consider validating the `query` string if you want stricter matching.
 * 5. For subscriptions, use WebSocket interception (Playwright 1.48+).
 */
