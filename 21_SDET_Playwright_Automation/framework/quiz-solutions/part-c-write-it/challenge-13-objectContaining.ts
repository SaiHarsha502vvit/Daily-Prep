// challenge-13-objectContaining.ts

/**
 * Quiz 02 — Challenge 13: expect.objectContaining Assertion
 * Curriculum: Ch04 — JS & TS for Automation
 * Difficulty: EASY
 *
 * Problem: Deep-equality assertions fail when the actual object has extra
 *          properties (e.g., timestamps, IDs, metadata) that the test doesn't care about.
 * Solution: Use `expect.objectContaining(partial)` to assert ONLY the fields
 *          that matter, ignoring everything else.
 */

import { test, expect } from '@playwright/test';

/* ───────────────────────────────────────────────────────────────────────────
   Interface for the object we'll partially match
   ─────────────────────────────────────────────────────────────────────────── */

interface UserRecord {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
  createdAt: string; // ISO timestamp — changes every run
  lastLogin: string; // ISO timestamp — changes every run
  metadata: {
    loginCount: number;
    avatarUrl: string;
  };
}

/* ───────────────────────────────────────────────────────────────────────────
   ❌ BROKEN VERSION — strict equality fails on dynamic fields
   ─────────────────────────────────────────────────────────────────────────── */

function getUserFromAPI(): UserRecord {
  return {
    id: 42,
    username: 'jsmith',
    email: 'jsmith@example.com',
    role: 'admin',
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    metadata: {
      loginCount: 7,
      avatarUrl: 'https://cdn.example.com/avatars/42.png',
    },
  };
}

test('quiz-02-ch13: strict equality is brittle @antiPattern', async ({ page }) => {
  await page.goto('https://example.com');

  const user = getUserFromAPI();

  // 🐛 TRAP: This fails because createdAt and lastLogin are different every run.
  // expect(user).toStrictEqual({ ... });  // ❌ Flaky!

  // Even if we exclude timestamps, strict equality demands ALL properties match.
  // We need partial matching.
  expect(true).toBe(true); // placeholder to keep test valid
});

/* ───────────────────────────────────────────────────────────────────────────
   ✅ FIXED VERSION — objectContaining for partial matching
   ─────────────────────────────────────────────────────────────────────────── */

test('quiz-02-ch13: partial match with objectContaining', async ({ page }) => {
  await page.goto('https://example.com');

  const user = getUserFromAPI();

  // FIXED: Only assert the fields we care about. Timestamps and IDs are ignored.
  expect(user).toEqual(
    expect.objectContaining({
      username: 'jsmith',
      email: 'jsmith@example.com',
      role: 'admin',
    })
  );

  // We can also assert nested objects partially using nested objectContaining.
  expect(user).toEqual(
    expect.objectContaining({
      id: expect.any(Number), // any number is fine
      metadata: expect.objectContaining({
        loginCount: expect.any(Number),
      }),
    })
  );
});

/* ───────────────────────────────────────────────────────────────────────────
   Advanced: arrayContaining + objectContaining combo for list validation
   ─────────────────────────────────────────────────────────────────────────── */

interface Product {
  sku: string;
  name: string;
  price: number;
  stock: number;
}

function getProducts(): Product[] {
  return [
    { sku: 'A001', name: 'Widget', price: 9.99, stock: 100 },
    { sku: 'B002', name: 'Gadget', price: 19.99, stock: 50 },
    { sku: 'C003', name: 'Doohickey', price: 29.99, stock: 25 },
  ];
}

test('quiz-02-ch13: array of objects with partial matching', async ({ page }) => {
  await page.goto('https://example.com');

  const products = getProducts();

  // Assert the array contains at least these items (order-independent, extras ok).
  expect(products).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ sku: 'A001', name: 'Widget' }),
      expect.objectContaining({ sku: 'B002', name: 'Gadget' }),
    ])
  );

  // Assert every product has a positive price.
  for (const product of products) {
    expect(product).toEqual(
      expect.objectContaining({
        price: expect.any(Number),
      })
    );
    expect(product.price).toBeGreaterThan(0);
  }
});

/* ───────────────────────────────────────────────────────────────────────────
   Playwright-specific: API response partial validation
   ─────────────────────────────────────────────────────────────────────────── */

test('quiz-02-ch13: partial API response validation', async ({ request }) => {
  const response = await request.get('https://reqres.in/api/users/2');
  const body = (await response.json()) as {
    data: { id: number; email: string; first_name: string; last_name: string; avatar: string };
  };

  // We only care about the user identity fields, not the avatar URL or support field.
  expect(body.data).toEqual(
    expect.objectContaining({
      id: 2,
      email: 'janet.weaver@reqres.in',
      first_name: 'Janet',
      last_name: 'Weaver',
    })
  );

  // And we can still make a targeted assertion on things we DO care about.
  expect(body.data.email).toContain('@');
});

/**
 * MATCHER CHEAT SHEET:
 * expect.objectContaining({ ... })     - partial object match
 * expect.arrayContaining([ ... ])      - partial array match (order ignored)
 * expect.stringContaining('...')       - substring match
 * expect.stringMatching(/regex/)       - regex match
 * expect.any(Number)                   - any number
 * expect.any(String)                   - any string
 * expect.any(Array)                    - any array
 * expect.closeTo(3.14, 2)              - floating-point tolerance
 *
 * COMBINING:
 * expect(obj).toEqual(expect.objectContaining({
 *   nested: expect.objectContaining({ ... }),
 *   list: expect.arrayContaining([expect.objectContaining({ ... })]),
 * }));
 */
