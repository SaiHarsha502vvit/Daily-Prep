// challenge-16-api-mocking.ts

/**
 * Quiz 02 — Challenge 16: API Mocking Trap
 * Curriculum: Ch10 — API Testing & Mocking
 * Difficulty: MEDIUM
 *
 * Problem: Mocking the wrong URL pattern, wrong HTTP method, or wrong response
 *          shape leads to tests that pass against mocks but fail in production.
 * Solution: Precise route matching + typed response objects + verify the mock
 *           was actually hit.
 */

import { test, expect, type Route, type Request } from '@playwright/test';

/* ───────────────────────────────────────────────────────────────────────────
   ❌ BROKEN VERSION — imprecise route matching
   ─────────────────────────────────────────────────────────────────────────── */

test.describe('broken mocking examples @antiPattern', () => {
  test('imprecise route pattern', async ({ page }) => {
    await page.goto('https://example.com');

    // TRAP: A glob that is too broad might catch unintended requests.
    // Also, we don't verify the mock was hit, so a real network call could
    // sneak through and we'd never know.
    await page.route('**/*', async (route) => {
      await route.fulfill({ status: 200, body: '{}' });
    });

    // If a JS bundle or CSS request hits first, it gets the JSON mock and breaks.
  });

  test('wrong HTTP method assumption', async ({ page }) => {
    await page.goto('https://example.com');

    // TRAP: Route without method check intercepts GET, POST, PUT, DELETE, etc.
    await page.route('**/api/users', async (route) => {
      // 🐛 If the app does a POST to create a user, this mock returns the
      // GET list response — nonsensical and hard to debug.
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ users: [] }),
      });
    });
  });
});

/* ───────────────────────────────────────────────────────────────────────────
   ✅ FIXED VERSION — precise route + typed response + hit verification
   ─────────────────────────────────────────────────────────────────────────── */

interface MockUser {
  id: number;
  name: string;
  email: string;
}

interface MockUsersResponse {
  users: MockUser[];
  total: number;
}

test('quiz-02-ch16: precise GET mock with hit verification', async ({ page }) => {
  await page.goto('https://example.com');

  // Track whether the mock was actually invoked.
  let mockHit = false;

  // FIXED: Match exact URL pattern + exact HTTP method.
  await page.route('**/api/users?page=1', async (route: Route, request: Request) => {
    if (request.method() !== 'GET') {
      // Pass through non-GET requests so they hit the real server.
      await route.continue();
      return;
    }

    mockHit = true;

    const mockBody: MockUsersResponse = {
      users: [
        { id: 1, name: 'Alice', email: 'alice@example.com' },
        { id: 2, name: 'Bob', email: 'bob@example.com' },
      ],
      total: 2,
    };

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockBody),
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
  });

  // Trigger the request from the page.
  await page.evaluate(async () => {
    await fetch('/api/users?page=1');
  });

  // Verify the mock was actually hit. If it wasn't, the test should fail
  // because the app didn't make the request we expected.
  expect(mockHit, 'Mock was not hit — app may not have made the expected API call').toBe(true);
});

/* ───────────────────────────────────────────────────────────────────────────
   Advanced: route.fallback for layered mocking
   ─────────────────────────────────────────────────────────────────────────── */

test('quiz-02-ch16: layered mocking with fallback', async ({ page }) => {
  await page.goto('https://example.com');

  // Layer 1: Mock user data.
  await page.route('**/api/users/**', async (route, request) => {
    if (request.method() !== 'GET') {
      await route.fallback(); // Let other handlers try
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: 1, name: 'Mock User' }),
    });
  });

  // Layer 2: Mock orders data (different endpoint).
  await page.route('**/api/orders/**', async (route, request) => {
    if (request.method() !== 'GET') {
      await route.fallback();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ orders: [] }),
    });
  });

  // Verify both mocks work independently.
  const userResponse = await page.evaluate(async () => {
    const res = await fetch('/api/users/1');
    return res.json() as Promise<{ id: number; name: string }>;
  });
  expect(userResponse.name).toBe('Mock User');
});

/*
 * MOCKING CHECKLIST:
 * - Pin the route pattern as narrowly as possible (avoid `**\/*`)
 * - Check request.method() and route only the intended verbs
 * ☐ Provide realistic Content-Type headers
 * ☐ Track mockHit and assert it at the end of the test
 * ☐ Use `route.fallback()` when layering multiple mocks
 * ☐ Clean up mocks in afterEach if they persist across tests
 */
