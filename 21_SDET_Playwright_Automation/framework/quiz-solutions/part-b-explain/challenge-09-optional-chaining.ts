// challenge-09-optional-chaining.ts

/**
 * Quiz 02 — Challenge 9: Optional Chaining Chain Explanation
 * Curriculum: Ch04 — JS & TS for Automation
 * Difficulty: EASY
 *
 * Question: "What does `apiResponse?.data?.users?.[0]?.name` do, and why is it
 *            safer than nested dot access?"
 *
 * Answer: Optional chaining (`?.`) short-circuits and returns `undefined` if ANY
 *         property in the chain is nullish (null or undefined). It prevents
 *         the classic "Cannot read property of undefined" runtime error.
 */

import { test, expect } from '@playwright/test';

/* ───────────────────────────────────────────────────────────────────────────
   Simulating an API response that may have missing nested fields
   ─────────────────────────────────────────────────────────────────────────── */

interface User {
  id: number;
  name: string;
}

interface APIResponse {
  status: number;
  data?: {
    users?: User[];
    meta?: { total: number };
  };
}

const validResponse: APIResponse = {
  status: 200,
  data: {
    users: [{ id: 1, name: 'Alice' }],
    meta: { total: 1 },
  },
};

const emptyResponse: APIResponse = {
  status: 200,
  data: undefined,
};

const partialResponse: APIResponse = {
  status: 200,
  data: {
    users: undefined,
  },
};

/* ───────────────────────────────────────────────────────────────────────────
   ❌ BROKEN VERSION — nested dot access crashes on missing fields
   ─────────────────────────────────────────────────────────────────────────── */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getFirstUserNameBroken(response: APIResponse): string {
  // 🐛 TRAP: If response.data is undefined, this throws:
  // TypeError: Cannot read properties of undefined (reading 'users')
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  return response.data.users[0].name; // 💥 CRASH on emptyResponse
}

/* ───────────────────────────────────────────────────────────────────────────
   ✅ FIXED VERSION — optional chaining with nullish coalescing
   ─────────────────────────────────────────────────────────────────────────── */

function getFirstUserNameSafe(response: APIResponse): string {
  // FIXED: `?.` short-circuits at the first nullish value.
  // `??` provides a default if the whole chain resolves to undefined.
  return response.data?.users?.[0]?.name ?? 'Unknown User';
}

/* ───────────────────────────────────────────────────────────────────────────
   Test proving safety
   ─────────────────────────────────────────────────────────────────────────── */
test('quiz-02-ch09: optional chaining handles all edge cases', async ({ page }) => {
  await page.goto('https://example.com');

  // Valid response: navigates all the way to the name.
  expect(getFirstUserNameSafe(validResponse)).toBe('Alice');

  // Empty response: data is undefined → short-circuits → returns default.
  expect(getFirstUserNameSafe(emptyResponse)).toBe('Unknown User');

  // Partial response: data.users is undefined → short-circuits → returns default.
  expect(getFirstUserNameSafe(partialResponse)).toBe('Unknown User');
});

/* ───────────────────────────────────────────────────────────────────────────
   Playwright-specific use case: safe navigation of complex page objects
   ─────────────────────────────────────────────────────────────────────────── */

test('quiz-02-ch09: safe access in Playwright eval', async ({ page }) => {
  await page.goto('https://example.com');

  // Simulated: we evaluate a script that returns nested data from the page.
  const result = await page.evaluate(() => {
    // window.__APP_CONFIG might not exist on every page.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config = (window as Record<string, unknown>).__APP_CONFIG as
      | { api?: { baseUrl?: string } }
      | undefined;

    // Without optional chaining, this would crash if __APP_CONFIG is missing:
    // return config.api.baseUrl; // 💥 TypeError

    // FIXED: Gracefully degrade to a default value.
    return config?.api?.baseUrl ?? 'https://default.api.com';
  });

  expect(typeof result).toBe('string');
});

/* ───────────────────────────────────────────────────────────────────────────
   Bracket notation optional chaining for dynamic keys
   ─────────────────────────────────────────────────────────────────────────── */

type ResponseMap = Record<string, APIResponse | undefined>;

function getUserNameFromMap(
  map: ResponseMap,
  key: string
): string {
  // `?.[key]` is the bracket-notation form of optional chaining.
  return map[key]?.data?.users?.[0]?.name ?? 'Not Found';
}

test('quiz-02-ch09: bracket optional chaining', async ({ page }) => {
  await page.goto('https://example.com');

  const map: ResponseMap = {
    alice: validResponse,
    bob: undefined,
  };

  expect(getUserNameFromMap(map, 'alice')).toBe('Alice');
  expect(getUserNameFromMap(map, 'bob')).toBe('Not Found');
  expect(getUserNameFromMap(map, 'charlie')).toBe('Not Found');
});

/**
 * SYNTAX REFERENCE:
 * obj?.prop       → access property (undefined if obj is nullish)
 * obj?.[expr]     → access dynamic property (undefined if obj is nullish)
 * arr?.[index]    → array element access (undefined if arr is nullish)
 * func?.()        → conditional function call (undefined if func is nullish)
 *
 * COMBINE WITH:
 * expr ?? default → nullish coalescing for fallback values
 * expr?.a?.b?.c   → chained optional access
 *
 * CAVEAT:
 * Optional chaining does NOT catch errors from NON-nullish values that are wrong type.
 * e.g., `obj?.foo()` still throws if `obj.foo` is a number, because `?.` only checks
 * for null/undefined — not for "is this actually a function?"
 */
