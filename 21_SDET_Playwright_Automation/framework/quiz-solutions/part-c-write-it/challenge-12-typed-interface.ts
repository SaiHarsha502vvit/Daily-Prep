// challenge-12-typed-interface.ts

/**
 * Quiz 02 — Challenge 12: Typed Response Interface from JSON
 * Curriculum: Ch04 — JS & TS for Automation
 * Difficulty: MEDIUM
 *
 * Problem: API responses are typed as `any`, killing IntelliSense and
 *          allowing runtime property access errors to slip through.
 * Solution: Derive strict TypeScript interfaces from the actual JSON shape
 *          and cast responses with them.
 */

import { test, expect } from '@playwright/test';

/* ───────────────────────────────────────────────────────────────────────────
   Step 1: Define interfaces that EXACTLY match the API JSON response
   ─────────────────────────────────────────────────────────────────────────── */

/** Represents a single user in the /api/users response. */
interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  avatar: string;
}

/** The paginated list wrapper returned by the API. */
interface UsersListResponse {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  data: User[];
  support: {
    url: string;
    text: string;
  };
}

/** A single-user lookup response. */
interface SingleUserResponse {
  data: User;
  support: {
    url: string;
    text: string;
  };
}

/* ───────────────────────────────────────────────────────────────────────────
   Step 2: Type-safe API helper using those interfaces
   ─────────────────────────────────────────────────────────────────────────── */

export async function fetchTypedUsers(
  request: Parameters<Parameters<typeof test>[1]>[0]['request'],
  pageNum: number,
): Promise<UsersListResponse> {
  const response = await request.get(`https://reqres.in/api/users?page=${pageNum}`);
  expect(response.status()).toBe(200);

  // CRITICAL: Cast the response body to the typed interface.
  // Playwright's `response.json()` returns `Promise<unknown>`.
  // The type assertion tells TypeScript "I guarantee this shape".
  const body = (await response.json()) as UsersListResponse;
  return body;
}

/* ───────────────────────────────────────────────────────────────────────────
   Demo test: typed response enables IDE autocomplete and compile-time safety
   ─────────────────────────────────────────────────────────────────────────── */
test('quiz-02-ch12: typed JSON response with full type safety', async ({ request }) => {
  const data = await fetchTypedUsers(request, 1);

  // ✅ TypeScript KNOWS these properties exist. IntelliSense works.
  expect(data.page).toBe(1);
  expect(data.total_pages).toBeGreaterThan(0);
  expect(data.data.length).toBeGreaterThan(0);

  // Because `data.data` is `User[]`, we get autocomplete on each user:
  const firstUser = data.data[0];
  expect(firstUser.id).toBeGreaterThan(0);
  expect(firstUser.email).toContain('@');
  expect(firstUser.first_name).toBeDefined();
  expect(firstUser.last_name).toBeDefined();
  expect(firstUser.avatar).toMatch(/^https:\/\//);

  // ✅ TypeScript ERROR if we typo a property:
  // firstUser.firstName  // ❌ Property 'firstName' does not exist on type 'User'
  // firstUser.emial      // ❌ Property 'emial' does not exist on type 'User'
});

/* ───────────────────────────────────────────────────────────────────────────
   Step 3: Type guard for runtime validation (belt AND suspenders)
   ─────────────────────────────────────────────────────────────────────────── */

function isUser(obj: unknown): obj is User {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    typeof (obj as User).id === 'number' &&
    'email' in obj &&
    typeof (obj as User).email === 'string'
  );
}

function isUsersListResponse(obj: unknown): obj is UsersListResponse {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'page' in obj &&
    typeof (obj as UsersListResponse).page === 'number' &&
    'data' in obj &&
    Array.isArray((obj as UsersListResponse).data) &&
    (obj as UsersListResponse).data.every(isUser)
  );
}

export async function fetchValidatedUsers(
  request: Parameters<Parameters<typeof test>[1]>[0]['request'],
  pageNum: number,
): Promise<UsersListResponse> {
  const response = await request.get(`https://reqres.in/api/users?page=${pageNum}`);
  const body = await response.json();

  // Runtime validation: if the API changes shape, we fail fast with a clear message.
  if (!isUsersListResponse(body)) {
    throw new Error(
      `API response shape changed! Expected UsersListResponse, got: ${JSON.stringify(body).slice(0, 200)}`,
    );
  }

  return body;
}

test('quiz-02-ch12: runtime-validated typed response', async ({ request }) => {
  const data = await fetchValidatedUsers(request, 2);
  expect(data.page).toBe(2);
  expect(data.data.length).toBeGreaterThan(0);
});

/* ───────────────────────────────────────────────────────────────────────────
   Step 4: Generics for reusable API typing
   ─────────────────────────────────────────────────────────────────────────── */

export async function fetchTyped<T>(
  request: Parameters<Parameters<typeof test>[1]>[0]['request'],
  url: string,
  validator?: (obj: unknown) => obj is T,
): Promise<T> {
  const response = await request.get(url);
  expect(response.ok()).toBe(true);

  const body = await response.json();

  if (validator && !validator(body)) {
    throw new Error(`Response failed validation for ${url}`);
  }

  return body as T;
}

test('quiz-02-ch12: generic typed fetch', async ({ request }) => {
  const single = await fetchTyped<SingleUserResponse>(request, 'https://reqres.in/api/users/2');

  expect(single.data.id).toBe(2);
  expect(single.data.email).toContain('@');
});

/**
 * WORKFLOW FOR BUILDING TYPED INTERFACES:
 * 1. Call the API manually and capture the JSON response.
 * 2. Paste it into a TypeScript-to-JSON converter (or write by hand).
 * 3. Create interfaces matching every property and nested object.
 * 4. Cast `await response.json() as YourInterface`.
 * 5. (Optional) Add a runtime type guard for API contract enforcement.
 * 6. Profit: IntelliSense, compile-time error detection, refactor safety.
 */
