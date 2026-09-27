/**
 * QUIZ 02 — Challenge 14 [HARD]: Write a Fixture That Creates and Tears Down Test Data
 *
 * REQUIREMENT: Write a test.extend fixture called testCitation that:
 *   1. Calls a (given) CitationsApiClient to create a citation with
 *      status PENDING and amount 150
 *   2. Provides the created CitationResponse to the test
 *   3. Deletes the citation after the test ends — even if the test FAILS
 *   4. Is test-scoped (not worker-scoped)
 */

import { test as base, expect } from "@playwright/test";

// ============================================================
// Supporting types (mirrors a real API client interface)
// ============================================================

interface CitationResponse {
  citationId: string;
  status: "PENDING" | "PAID" | "DISPUTED" | "DELETED";
  amount: number;
  issuedAt: string;
}

interface CreateCitationPayload {
  status: "PENDING" | "DISPUTED";
  amount: number;
  type: string;
  testFlag?: boolean; // marks record as synthetic test data
}

// A minimal stub of the real API client — in production this would wrap
// the framework's APIUtils class from utilities/api/APIUtils.ts
class CitationsApiClient {
  constructor(private readonly baseUrl: string) {}

  async createCitation(
    payload: CreateCitationPayload,
  ): Promise<CitationResponse> {
    // In a real implementation: POST /api/v1/citations
    return {
      citationId: `CIT-TEST-${Date.now()}`,
      status: payload.status,
      amount: payload.amount,
      issuedAt: new Date().toISOString(),
    };
  }

  async deleteCitation(citationId: string): Promise<void> {
    // In a real implementation: DELETE /api/v1/citations/:id
    console.log(`[fixture] Deleted citation ${citationId}`);
  }

  async getById(citationId: string): Promise<CitationResponse> {
    // In a real implementation: GET /api/v1/citations/:id
    return {
      citationId,
      status: "PAID",
      amount: 150,
      issuedAt: new Date().toISOString(),
    };
  }

  async updateStatus(
    citationId: string,
    status: CitationResponse["status"],
  ): Promise<CitationResponse> {
    // In a real implementation: PATCH /api/v1/citations/:id
    return { citationId, status, amount: 150, issuedAt: "" };
  }
}

// ============================================================
// ✅ SOLUTION — fixture definition
// ============================================================

interface TestCitationFixtures {
  citationsClient: CitationsApiClient;
  testCitation: CitationResponse;
}

export const test = base.extend<TestCitationFixtures>({
  // ── citationsClient fixture (test-scoped, stateless — no teardown) ──
  citationsClient: async ({}, use) => {
    const client = new CitationsApiClient(
      process.env.API_BASE_URL ?? "http://localhost:3000",
    );
    await use(client);
    // No teardown needed — the client itself holds no state.
  },

  // ── testCitation fixture (test-scoped — fresh citation per test) ──
  testCitation: async ({ citationsClient }, use) => {
    // ── SETUP — create the citation ──
    const citation = await citationsClient.createCitation({
      status: "PENDING",
      amount: 150,
      type: "PARKING",
      testFlag: true, // marks this as synthetic test data for cleanup scripts
    });
    console.log(`[fixture] Created citation ${citation.citationId}`);

    // ── YIELD — provide the citation to the test body ──
    await use(citation);

    // ── TEARDOWN — runs after the test, even if the test threw ──
    // The `use()` call acts like a yield; everything after it is teardown.
    // Playwright's fixture runner calls teardown even on test failure.
    try {
      await citationsClient.deleteCitation(citation.citationId);
      console.log(`[fixture] Deleted citation ${citation.citationId}`);
    } catch (error) {
      // Don't rethrow — a teardown failure must NOT mask the real test failure.
      // Log it so engineers can investigate stale test data.
      console.warn(
        `[fixture] WARNING: Failed to delete citation ${citation.citationId}:`,
        error,
      );
    }
  },
  // No { scope: 'worker' } → default is 'test' ← requirement 4
});

// ============================================================
// Usage in tests
// ============================================================

test("citation starts PENDING", async ({ testCitation }) => {
  // testCitation is freshly created, status should be PENDING
  expect(testCitation.status).toBe("PENDING");
  expect(testCitation.amount).toBe(150);
  // ← teardown: citationsClient.deleteCitation runs automatically
});

test("citation can be paid", async ({ testCitation, citationsClient }) => {
  expect(testCitation.status).toBe("PENDING");

  await citationsClient.updateStatus(testCitation.citationId, "PAID");

  const updated = await citationsClient.getById(testCitation.citationId);
  expect(updated.status).toBe("PAID");
  // ← teardown: citation deleted even though status is now PAID
});

test("citation remains deleted even if test fails", async ({
  testCitation,
  citationsClient: _c,
}) => {
  // Suppose this assertion fails:
  expect(testCitation.status).toBe("PENDING");
  // ← teardown still runs — citation is always cleaned up
});

// WHY
// The `await use(citation)` pattern divides the fixture body into two parts:
//   Before use() → setup (runs before the test body)
//   After  use() → teardown (runs after the test body, even on failure)
//
// This is structurally equivalent to @BeforeEach + @AfterEach in JUnit but
// co-located in a single function — much harder to forget the cleanup.
//
// Why wrap teardown in try/catch?
//   If the teardown throws, Playwright surfaces it as a separate error.
//   However, the original test failure is the actionable one.  Hiding teardown
//   failures with a warn + no-rethrow keeps the failure signal clean.
//   The console.warn ensures engineers can find and clean up stale data.
//
// Why testFlag: true?
//   In many teams a nightly cleanup script deletes records tagged as synthetic
//   test data.  This prevents slow/flaky teardown from accumulating orphaned
//   records in staging environments.
