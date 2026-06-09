import { test, expect } from '@playwright/test';
import { endpoints } from '../../constants/endpoints';
import type { ReqresUserListResponse, ReqresUser } from '../../types/api.types';

const COMMON_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

/**
 * BROKEN TEST — Anti-Pattern: Asserting HTTP status only
 * Curriculum Reference: Ch05 — API Contracts, Ch03 — Assertion Depth
 * Why it fails: Status 200 tells us the server responded, but says nothing
 * about the *shape* or *correctness* of the payload. A broken deployment
 * that returns `{ "error": "unexpected" }` with HTTP 200 will pass this
 * test while silently corrupting downstream consumers.
 */
test('broken: only assert status code on GET /users', async ({ request }) => {
  const response = await request.get(`${endpoints.reqres.USERS}?page=2`, {
    headers: COMMON_HEADERS,
  });

  // BUG: The only assertion is the status code. If the body is empty,
  // malformed, or contains wrong data, we will never catch it.
  expect(response.status()).toBe(200);
});

/**
 * FIXED VERSION
 * Fix: Assert the response structure (content-type, body schema) and at
 * least one business-meaningful field. This catches silent regressions
 * where the server returns 200 but the wrong data.
 */
test('fixed: assert status + body shape + data fields', async ({ request }) => {
  const response = await request.get(`${endpoints.reqres.USERS}?page=2`, {
    headers: COMMON_HEADERS,
  });

  expect(response.status()).toBe(200);

  // Assert content-type to guard against HTML error pages masquerading
  // as JSON with an incorrect status code.
  expect(response.headers()['content-type']).toContain('application/json');

  const body = (await response.json()) as ReqresUserListResponse;

  // Schema-level assertions: did the server return the expected envelope?
  expect(body.page).toBe(2);
  expect(body.per_page).toBeGreaterThan(0);
  expect(body.data.length).toBeGreaterThan(0);

  // Data-layer assertion: is the first user actually a valid user object?
  const first: ReqresUser | undefined = body.data[0];
  expect(first).toBeDefined();
  expect(first?.id).toBeGreaterThan(0);
  expect(first?.email).toContain('@');
  expect(first?.avatar).toContain('https://');
});
