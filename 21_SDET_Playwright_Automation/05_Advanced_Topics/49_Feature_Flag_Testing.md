# 49. Feature Flag Testing — When the App Has Two Behaviours and the Flag Decides

**Navigation**: [← 48. Sharding & Test Selection](./48_Sharding_And_Test_Selection.md) | [Index](../00_INDEX.md) | [→ 50. Email Service Testing](./50_Email_Service_Testing.md)

---

## 5W1H

- **WHAT**: Testing strategy for codebases gated by feature flags (LaunchDarkly, GrowthBook, Unleash, Split, or in-house).
- **WHY**: A modern app behaves differently for different users **at runtime**. A test that doesn't pin the flag state is non-deterministic by definition.
- **WHO**: Every team that uses flags — and that's now most teams.
- **WHEN**: The moment a flag enters the codebase that changes user-visible behaviour.
- **HOW**: Pin flag state explicitly per test, ideally via API or cookie, never by hoping the default ramp catches you.

---

## 1. Why this fails without intent

```
Day 1: Flag created at 0% rollout. Tests pass.
Day 5: Eng ramps to 50%. Half your tests fail randomly — by user assignment.
Day 6: Engineers add `--retries=5`. False green. Real bugs land.
```

You don't have flake. You have **uncontrolled state**. Pin it.

---

## 2. Three patterns for pinning flags

### Pattern A — API override per test

If your flag service has an admin API:

```typescript
test.beforeEach(async ({ request }) => {
  await request.put(`${envConfig.flagsService}/overrides`, {
    headers: { Authorization: `Bearer ${process.env.FLAGS_ADMIN_TOKEN}` },
    data: { user: 'test-user-1', flag: 'new_checkout', value: true },
  });
});
```

Pros: one source of truth. Cons: needs admin credentials in test env.

### Pattern B — Bootstrap cookie or local storage

Many SDKs (LaunchDarkly, GrowthBook) accept a "bootstrap" payload in localStorage:

```typescript
await page.addInitScript(() => {
  localStorage.setItem(
    'gb-features',
    JSON.stringify({ new_checkout: { defaultValue: true } })
  );
});
```

Pros: zero backend coordination. Cons: SDK-specific syntax.

### Pattern C — `page.route` interception

Intercept the SDK's poll/init call and replace the response:

```typescript
await page.route('**/sdk/features**', async (route) => {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ flags: { new_checkout: { value: true } } }),
  });
});
```

Pros: no admin access needed, works in any env. Cons: tied to a specific URL pattern.

---

## 3. Testing the *matrix*, not the flag

The real risk isn't "does the new path work." It's "do the old path AND the new path coexist correctly during ramp." So every flagged behaviour gets at least **two tests**:

```typescript
test.describe('checkout', () => {
  test('@new-flow @flag:new_checkout=true completes via new flow', async ({ page }) => {
    await pinFlag(page, 'new_checkout', true);
    // ...
  });

  test('@old-flow @flag:new_checkout=false completes via old flow', async ({ page }) => {
    await pinFlag(page, 'new_checkout', false);
    // ...
  });
});
```

A clean ramp-down later means deleting the old test, not rewriting the new one.

---

## 4. Fixture for flag pinning

```typescript
import { test as base } from '@playwright/test';

type FlagOverrides = Record<string, unknown>;

export const test = base.extend<{ pinFlags: (overrides: FlagOverrides) => Promise<void> }>({
  pinFlags: async ({ page }, use) => {
    const pin = async (overrides: FlagOverrides): Promise<void> => {
      await page.addInitScript((flags) => {
        const window = globalThis as unknown as { __FLAG_OVERRIDES__: FlagOverrides };
        window.__FLAG_OVERRIDES__ = flags;
      }, overrides);
    };
    await use(pin);
  },
});
```

Now any test gets a single function call:

```typescript
test('new checkout', async ({ page, pinFlags }) => {
  await pinFlags({ new_checkout: true, payments_v2: 'fast-path' });
  await page.goto('/checkout');
});
```

---

## 5. Anti-patterns

1. **Setting flags via UI toggles.** Eats 30 seconds per test, fragile across SDK changes.
2. **Sharing flag state across tests.** One test enables the flag, the next assumes it's off. Bug in your tests, not in the app.
3. **Hardcoding the flag value as a query param** that the app no longer reads. Silently wrong → test passes always.
4. **Not asserting the flag pin worked.** Add `expect(await page.evaluate(() => window.__FLAG_OVERRIDES__))` to be sure.

---

## 6. Senior SDET perspective

Flag testing is **process work** as much as code work. Push the team to:

- Tag every test with the flag it exercises (`@flag:new_checkout`).
- Run "old path" and "new path" as separate projects in `playwright.config.ts`.
- Delete the old-path tests within 2 sprints of the flag hitting 100% rollout — otherwise they rot.

---

## 7. DevSecOps seed

Feature flags are also **kill switches**. A test that validates "flag off → endpoint returns 503" is a security/availability test. Build at least one of these per critical flag.

---

## 8. Exercise

Add a `pinFlags` fixture to [`framework/fixtures/page.fixture.ts`](../framework/fixtures/page.fixture.ts). Write two tests against any toy site (LocalStorage-based feature flagging is fine) that prove both code paths work. Verify by deliberately breaking the flag pin — both tests should fail in different ways.
