# 04. Architecture Walkthrough

> The 15-step E2E skeleton. Why tests look this way at scale. The data accumulator. The order of `test.step` vs `new POM()`. What separates a script from an enterprise test.

---

## The 15-step skeleton

```typescript
import { test, expect } from "../../fixtures"; // ← from fixtures barrel, not @playwright/test
import { CitationsClient, type Citation } from "../../clients/CitationsClient";
import { PayloadsCitation } from "../../constants/payloads.citation";
import { CrmHomePage, CitationDetailsPage } from "../../websites/crm";

test("citation paid via UI is verified at API + DB", async ({
  page, // Playwright built-in
  account, // worker-scoped — file-locked
  citationsClient, // typed API client
  db, // DB pool
}) => {
  // ── 1. Construct POMs FIRST, before any test.step ───────────
  const home = new CrmHomePage(page);
  const details = new CitationDetailsPage(page);

  // ── 2. Set up the data accumulator ──────────────────────────
  const data: {
    citationId: string | null;
    paymentId: string | null;
  } = {
    citationId: null,
    paymentId: null,
  };

  // ── 3. API: create the pending citation ─────────────────────
  await test.step("API: create PENDING citation for customer", async () => {
    const citation = await citationsClient.create(
      PayloadsCitation.pending({ customerId: account.userId }),
    );
    data.citationId = citation.id;
  });

  // ── 4. Pre-condition checks ─────────────────────────────────
  await test.step("API: verify citation starts PENDING", async () => {
    expect(data.citationId).not.toBeNull();
    const fresh = await citationsClient.getById(data.citationId!);
    expect(fresh.status).toBe("PENDING");
  });

  // ── 5. UI: navigate to the record ───────────────────────────
  await test.step("UI: navigate to citation", async () => {
    await home.goto();
    await home.openCitation(data.citationId!);
  });

  // ── 6. Wait for the page to be ready ────────────────────────
  await test.step("UI: verify page loaded with correct citation", async () => {
    await expect(details.citationIdField).toHaveText(data.citationId!);
    await expect(details.statusField).toHaveText("PENDING");
  });

  // ── 7. UI: trigger the action ───────────────────────────────
  await test.step("UI: pay the citation", async () => {
    await details.payButton.click();
    await details.amountInput.fill("150.00");
    await details.confirmPaymentButton.click();
  });

  // ── 8. UI: verify the optimistic UI response ────────────────
  await test.step("UI: payment confirmation shown", async () => {
    await expect(details.successToast).toContainText("Payment successful");
  });

  // ── 9. API: poll for backend commitment ─────────────────────
  await test.step("API: poll until citation status is PAID", async () => {
    const updated = await citationsClient.waitForStatus(
      data.citationId!,
      "PAID",
      60_000,
    );
    data.paymentId = updated.lastPaymentId ?? null;
    expect(updated.paidAt).not.toBeNull();
  });

  // ── 10. DB: verify the storage layer ────────────────────────
  await test.step("DB: verify citation table reflects payment", async () => {
    const rows = await db.query(
      "SELECT status, paid_at FROM citations WHERE id = $1",
      [data.citationId],
    );
    expect(rows.rows[0].status).toBe("PAID");
    expect(rows.rows[0].paid_at).not.toBeNull();
  });

  // ── 11. DB: verify side-effects (audit log) ─────────────────
  await test.step("DB: verify audit log entry", async () => {
    const events = await db.query(
      "SELECT event_type FROM audit_log WHERE entity_id = $1 ORDER BY created_at",
      [data.citationId],
    );
    expect(events.rows.map((r) => r.event_type)).toContain("citation.paid");
  });

  // ── 12. UI: refresh and re-verify ───────────────────────────
  await test.step("UI: refresh and assert persistent state", async () => {
    await page.reload();
    await expect(details.statusField).toHaveText("PAID");
  });

  // ── 13. Cross-system: verify notification to customer ───────
  await test.step("API: notification was sent", async () => {
    // (notification fixture, email service, etc.)
  });

  // ── 14. Negative case: verify re-pay is rejected ────────────
  await test.step("API: paying again returns 409", async () => {
    const response = await citationsClient.payRaw(data.citationId!, 150);
    expect(response.status()).toBe(409);
  });

  // ── 15. (Cleanup runs via fixture teardown) ─────────────────
  // No explicit code — fixture's `await use()` boundary handles it.
});
```

15 steps. ~80 lines of test code. Touches UI + API + DB. Verifies three layers.

---

## Why POMs construct BEFORE test.step

Inside a `test.step`, the step's name describes WHAT is happening. POM construction is setup, not behaviour.

```typescript
// ❌ Pollutes the step
await test.step("Pay the citation", async () => {
  const details = new CitationDetailsPage(page); // setup, not behaviour
  await details.payButton.click();
});

// ✅ Setup is invisible
const details = new CitationDetailsPage(page);
await test.step("Pay the citation", async () => {
  await details.payButton.click();
});
```

Reports show the step name. Cleaner narrative.

Also: POMs are reused across multiple steps. Constructing inside the first step makes them unavailable to later steps.

---

## The data accumulator — why an object, not `let`

```typescript
// ❌ Cross-step state with `let`
let citationId: string;
await test.step("Create", async () => {
  citationId = await api.create();
});
await test.step("Verify", async () => {
  /* uses citationId */
});
```

Problems:

- TypeScript types are weird (`let citationId: string` — but if step 1 fails, `citationId` is undefined at access).
- Adding fields means new `let` declarations scattered through the test.
- Multiple `let`s read worse than one structured object.

```typescript
// ✅ Object accumulator
const data: { citationId: string | null; paymentId: string | null } = {
  citationId: null,
  paymentId: null,
};

await test.step("Create", async () => {
  data.citationId = await api.create();
});
await test.step("Verify", async () => {
  if (!data.citationId) throw new Error("citationId not set");
  // ...
});
```

The interface is one place. Adding fields is one line. The guard makes step dependencies explicit.

See [`deep_dives/cross_site_patterns.md §3`](../deep_dives/cross_site_patterns.md#3-pattern-1--sequential-flow) for the full pattern.

---

## Why step names matter

In the HTML report:

```
Test: citation paid via UI is verified at API + DB
├── API: create PENDING citation for customer (1.2s) ✓
├── API: verify citation starts PENDING (0.3s) ✓
├── UI: navigate to citation (2.1s) ✓
├── UI: verify page loaded with correct citation (1.5s) ✓
├── UI: pay the citation (1.8s) ✓
├── UI: payment confirmation shown (0.2s) ✓
├── API: poll until citation status is PAID (3.2s) ✓
├── DB: verify citation table reflects payment (0.1s) ✓
├── DB: verify audit log entry (0.1s) ✓
├── UI: refresh and assert persistent state (1.4s) ✓
└── API: paying again returns 409 (0.4s) ✓
```

Each step is grep-able. A failure in "DB: verify audit log entry" tells the on-call engineer exactly where the bug is.

Compare to a test that's just 80 lines of body without `test.step` — failure message is "expected Active, got Pending" with no context for WHICH part of the workflow.

---

## The 3-layer verification

Notice steps 4 (API pre-check), 9 (API post-check), 10 (DB post-check), 12 (UI persistence check).

The same state is asserted at THREE layers: UI, API, DB. Why:

- UI alone: success theatre risk.
- UI + API: catches the "UI lies" case.
- UI + API + DB: catches the "API caches" case.

For critical money flows, all three. For non-critical UX, one is enough.

See [`deep_dives/cross_site_patterns.md §7`](../deep_dives/cross_site_patterns.md#7-pattern-5--ui--api-side-effects).

---

## What separates this from a script

A script:

```typescript
test("pay", async ({ page }) => {
  await page.goto("/citations/CIT-001");
  await page.click(".pay-button");
  await page.fill(".amount", "150");
  await page.click(".confirm");
  await expect(page.locator(".success")).toBeVisible();
});
```

5 lines. Works for one specific record in one environment. Doesn't:

- Set up data (depends on `CIT-001` existing).
- Verify the action committed (UI toast is enough).
- Handle cleanup.
- Run in parallel (data collision).
- Cross-validate.

The enterprise test does all of that, at the cost of being 80 lines instead of 5. The 80 lines pay back across thousands of CI runs.

---

## What's next

- [05. Browser internals](./05_browser_internals.md) — the model behind the waits.
- [06. Enterprise structure](./06_enterprise_structure.md) — the file layout that makes this scale.
- [`reference/07_parallelism.md`](../reference/07_parallelism.md) — running these tests in parallel safely.
- [`reference/12_data.md`](../reference/12_data.md) — the three-layer verification pattern in depth.
