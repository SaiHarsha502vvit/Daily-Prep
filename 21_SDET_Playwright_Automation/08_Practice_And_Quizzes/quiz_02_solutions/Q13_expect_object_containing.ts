/**
 * QUIZ 02 — Challenge 13 [MEDIUM]: Write expect.objectContaining Assertion
 *
 * GIVEN:
 *   const body = await response.json(); // Returns { citations: CitationObj[] }
 *
 * REQUIREMENT: Assert that citations array:
 *   1. Has at least 1 item
 *   2. Contains an item with citationId:'CIT-001', status:'PAID',
 *      and amount being any positive number
 *   3. Does NOT contain any item with status:'DELETED'
 */

import { test, expect } from '@playwright/test';

// ============================================================
// Type setup (mirrors the API contract)
// ============================================================

interface Citation {
  citationId: string;
  status: 'PENDING' | 'PAID' | 'DISPUTED' | 'DELETED';
  amount: number;
  issuedAt: string;
  vehicleId?: string;
}

interface CitationsResponse {
  citations: Citation[];
  total: number;
}

// ============================================================
// ✅ SOLUTION
// ============================================================

test('GET /citations — assertions with expect.objectContaining', async ({
  request,
}) => {
  const response = await request.get('/api/v1/citations');
  expect(response.ok()).toBeTruthy();

  const body = (await response.json()) as CitationsResponse;

  // 1 — Array has at least 1 item
  expect(body.citations.length).toBeGreaterThan(0);
  // Alternative: expect(body.citations).not.toHaveLength(0);

  // 2 — Contains the target citation (partial match — other fields ignored)
  expect(body.citations).toContainEqual(
    expect.objectContaining({
      citationId: 'CIT-001',
      status: 'PAID',
      amount: expect.any(Number), // any Number (including 0.01 or 99999.99)
    }),
  );

  // 3 — No DELETED items in the array
  expect(body.citations).not.toContainEqual(
    expect.objectContaining({ status: 'DELETED' }),
  );
});

// ============================================================
// BONUS — verify the matching item's amount is POSITIVE
// ============================================================

test('CIT-001 has positive amount', async ({ request }) => {
  const response = await request.get('/api/v1/citations');
  const body = (await response.json()) as CitationsResponse;

  // Find the specific citation for further assertions
  const paid = body.citations.find((c) => c.citationId === 'CIT-001');

  // First assert it was found, then assert its properties
  expect(paid).toBeDefined();
  expect(paid!.amount).toBeGreaterThan(0);
  expect(paid!.status).toBe('PAID');
});

// ============================================================
// Pattern reference — expect.objectContaining vs toEqual
// ============================================================

test('objectContaining vs toEqual comparison', async ({ request }) => {
  const response = await request.get('/api/v1/citations/CIT-001');
  const citation = (await response.json()) as Citation;

  // toEqual: EXACT match — every field must match exactly (strict)
  // Fails if the response has extra fields you didn't include.
  expect(citation).toEqual({
    citationId: 'CIT-001',
    status: 'PAID',
    amount: 150,
    issuedAt: '2026-05-01T00:00:00Z',
    // ← if 'vehicleId' exists in response but not here → TEST FAILS
  });

  // objectContaining: PARTIAL match — only the specified fields are checked.
  // Extra fields in the actual object are allowed (ignored).
  expect(citation).toEqual(
    expect.objectContaining({
      citationId: 'CIT-001',
      status: 'PAID',
      // 'amount', 'issuedAt', 'vehicleId' etc. are NOT checked → test passes
    }),
  );

  // Nesting: check a field within a partial match
  expect(citation).toEqual(
    expect.objectContaining({
      amount: expect.any(Number),
      status: expect.stringMatching(/^(PAID|PENDING)$/),
    }),
  );
});

// ============================================================
// Common expect matchers reference
// ============================================================
// expect.any(Number)        → any numeric value (including 0)
// expect.any(String)        → any string (including '')
// expect.stringContaining('foo') → string that contains 'foo'
// expect.stringMatching(/\d+/)   → string matching the regex
// expect.arrayContaining([1,2])  → array that contains at least [1,2]
// expect.objectContaining({a:1}) → object that has at least {a:1}
// expect.not.objectContaining({status:'DELETED'}) → inside toContainEqual

// WHY
// toEqual is strict: it fails if the response has ANY extra field you didn't
// list.  APIs often evolve by adding new optional fields — using toEqual
// for those responses makes tests brittle (they break when the API adds a
// field you don't care about).
//
// objectContaining lets you assert ONLY the properties you care about.
// It's the right default for API response assertions — you rarely need to
// assert every single field in a real response body.
//
// toContainEqual + objectContaining is the cleanest way to assert
// "an array contains at least one element that matches this shape" without
// having to manually find() and then assert.
