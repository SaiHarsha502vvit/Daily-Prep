import { test, expect } from '@playwright/test';
import { endpoints } from '../../constants/endpoints';
import type { ReqresCreateUserPayload } from '../../types/api.types';

// BROKEN — Module-level mutable state shared by ALL parallel tests.
// Curriculum Reference: Ch05 — Test Isolation, Ch07 — Parallel Execution
// Why it fails: With fullyParallel=true, tests run across multiple workers.
// Each worker overwrites `sharedUserId`, so the verification step reads a
// value written by a *different* test, leading to 404s or mismatched data.
let sharedUserId = '';

const COMMON_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

test('broken: create user writes module state', async ({ request }) => {
  const payload: ReqresCreateUserPayload = {
    name: 'ModuleStateUser',
    job: 'SDET',
  };
  const response = await request.post(`${endpoints.reqres.USERS}`, {
    headers: COMMON_HEADERS,
    data: payload,
  });
  expect(response.status()).toBe(201);
  const body = (await response.json()) as { id: string };
  sharedUserId = body.id; // RACE: another worker may overwrite this immediately
});

test('broken: verify user reads module state', async ({ request }) => {
  // BUG: By the time this test runs, `sharedUserId` may contain a value
  // from a completely different test worker, or still be the empty string.
  expect(sharedUserId).not.toBe(''); // Flaky — often fails here
  const response = await request.get(`${endpoints.reqres.USERS}/${sharedUserId}`, {
    headers: COMMON_HEADERS,
  });
  expect(response.status()).toBe(200);
});

/**
 * FIXED VERSION — Approach A: inline both operations in a single test
 * so no external state is required.
 */
test('fixed: create and verify in one test', async ({ request }) => {
  const payload: ReqresCreateUserPayload = {
    name: 'InlineUser',
    job: 'SDET',
  };
  const createResp = await request.post(`${endpoints.reqres.USERS}`, {
    headers: COMMON_HEADERS,
    data: payload,
  });
  expect(createResp.status()).toBe(201);
  const { id } = (await createResp.json()) as { id: string };

  const getResp = await request.get(`${endpoints.reqres.USERS}/${id}`, {
    headers: COMMON_HEADERS,
  });
  expect(getResp.status()).toBe(200);
});

/**
 * FIXED VERSION — Approach B: serial describe block with describe-scoped state.
 * Use only when order truly matters; prefer single-test isolation otherwise.
 */
test.describe('fixed: serial create-then-verify', () => {
  test.describe.configure({ mode: 'serial' });

  let serialUserId = '';

  test('create user', async ({ request }) => {
    const payload: ReqresCreateUserPayload = {
      name: 'SerialUser',
      job: 'SDET',
    };
    const response = await request.post(`${endpoints.reqres.USERS}`, {
      headers: COMMON_HEADERS,
      data: payload,
    });
    expect(response.status()).toBe(201);
    serialUserId = (await response.json()).id;
  });

  test('verify user', async ({ request }) => {
    expect(serialUserId).not.toBe('');
    const response = await request.get(`${endpoints.reqres.USERS}/${serialUserId}`, {
      headers: COMMON_HEADERS,
    });
    expect(response.status()).toBe(200);
  });
});
