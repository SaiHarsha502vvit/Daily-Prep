# Weekly Patterns — the 8 Snippets You'll Reach For Most

**Navigation**: [← Module front door](../../README.md) | [Appendix index](../README.md)

> Moved here verbatim from the module README during the 2026-09 restructure, so the front door
> could stay short. Each snippet is the one-screen version; the linked chapter teaches *why*.

---

## The patterns

### The `await` rule

```typescript
// Needs await: navigate, click, fill, type, check, hover, waitFor,
//              isVisible(), count(), textContent(), response.json()
// No await: page.locator(), getByRole(), getByText(), .nth(), .filter()
```

### New tab — listener before trigger

```typescript
const [newTab] = await Promise.all([
  page.context().waitForEvent("page"),
  page.click("#openButton"),
]);
```

### Download — same pattern, different event

```typescript
const [download] = await Promise.all([
  page.waitForEvent("download"),
  page.click("#exportBtn"),
]);
```

### D365 wait pattern

```typescript
await expect(page.locator(".ms-Spinner")).toHaveCount(0, { timeout: 30_000 });
await expect(fieldLocator).toHaveText("Expected Value", { timeout: 30_000 });
```

### `menuitem` over `button` in D365

```typescript
// ❌ page.getByRole('button',  { name: 'Edit' })
// ✅ page.getByRole('menuitem', { name: 'Edit' })
```

### Data Accumulator across `test.step()`

```typescript
interface TestData {
  citationId: string | null;
}
const data: TestData = { citationId: null };
await test.step("create", async () => {
  data.citationId = await client.create();
});
await test.step("verify", async () => {
  await client.assertPaid(data.citationId!);
});
```

### Polling — never `for + waitForTimeout`

```typescript
await expect
  .poll(async () => (await citationsClient.getById(id)).status, {
    timeout: 120_000,
    intervals: [1_000, 2_000, 5_000, 10_000],
  })
  .toBe("PAID");
```

### Enterprise composition

```typescript
// import test from your fixtures barrel — NEVER from @playwright/test directly
import { test, expect } from "../../fixtures";

test("flow", async ({ page, account, citationsClient }) => {
  const dashboard = new DashboardPage(page); // POMs at top of test
  const data = { citationId: null as string | null };

  await test.step("API: create pending citation", async () => {
    const citation = await citationsClient.create(
      PayloadsCitation.pending({ customerId: account.userId }),
    );
    data.citationId = citation.id;
  });
  // ...
});
```
