# Feature Flag Testing

> Specialised reference for testing apps with runtime feature flags (LaunchDarkly, Unleash, OpenFeature, custom). Fixture-driven flag injection, matrix coverage, the "all flags on / all flags off" smoke pair.

---

## Table of contents

1. [Why feature flags complicate testing](#1-why)
2. [The combinatorial explosion](#2-combinatorial-explosion)
3. [Three injection strategies](#3-injection-strategies)
4. [Fixture-driven flag injection](#4-fixture-driven)
5. [LaunchDarkly integration](#5-launchdarkly)
6. [Unleash / OpenFeature](#6-unleash)
7. [Matrix testing patterns](#7-matrix)
8. [The all-on/all-off smoke](#8-all-on-all-off)
9. [Common failures](#9-common-failures)

---

## 1. Why

Feature flags let you:
- Deploy code dark.
- Roll out gradually (10% → 50% → 100%).
- A/B test variants.
- Kill features fast on incidents.

But they multiply test surface:
- 5 flags = 32 combinations.
- 10 flags = 1024.
- Real-world: 50+ flags. Combinatorial explosion.

You can't test every combination. You need a strategy.

---

## 2. The combinatorial explosion

Most flags are independent. Test them in isolation:
- Flag A on/off — 2 tests.
- Flag B on/off — 2 tests.
- Total: 4 tests, not 4 combinations.

A few flags interact. Identify those, test the specific combinations.

For most apps: 80% of flags = independent. Test independently. 20% = interaction-heavy. Test combinations.

---

## 3. Injection strategies

| Strategy | How | Pros | Cons |
|---|---|---|---|
| Real flag service (LaunchDarkly) | Tests hit real LD, manipulate flags via API | Production-like | Slow, requires LD test account |
| URL parameter overrides | App accepts `?flags=A,B` for testing | Fast, deterministic | Requires app cooperation |
| Cookie override | App reads `flags` cookie | Fast | Requires app cooperation |
| API mock | `page.route` intercepts LD SDK calls | Fastest | Couples to SDK implementation |

Best for CI: URL/cookie overrides plus periodic real-LD integration tests.

---

## 4. Fixture-driven

```typescript
interface FeatureFlags {
  newCheckoutFlow: boolean;
  betaSearchUi: boolean;
  pricingV2: boolean;
}

const test = base.extend<{ flags: FeatureFlags }>({
  flags: [{ newCheckoutFlow: false, betaSearchUi: false, pricingV2: false }, { option: true }],
  
  page: async ({ page, flags }, use) => {
    // Inject flags via cookie before navigation
    await page.context().addCookies([{
      name: 'feature-flags',
      value: JSON.stringify(flags),
      domain: process.env.APP_DOMAIN!,
      path: '/',
    }]);
    await use(page);
  },
});
```

Usage:

```typescript
test('default flags', async ({ page }) => {
  await page.goto('/');
  // newCheckoutFlow: false (default) — test old flow
});

test.describe('new checkout flow', () => {
  test.use({ flags: { newCheckoutFlow: true, betaSearchUi: false, pricingV2: false } });
  
  test('new flow renders', async ({ page }) => {
    await page.goto('/checkout');
    await expect(page.getByText('Express checkout')).toBeVisible();
  });
});
```

---

## 5. LaunchDarkly

```typescript
import * as LD from 'launchdarkly-node-server-sdk';

const client = LD.init(process.env.LD_SDK_KEY!);

test.beforeAll(async () => {
  await client.waitForInitialization();
});

test('LD-controlled flag', async ({ page }) => {
  // Update flag via LD REST API
  await fetch(`https://app.launchdarkly.com/api/v2/flags/default/${flagKey}`, {
    method: 'PATCH',
    headers: { Authorization: process.env.LD_API_KEY! },
    body: JSON.stringify({ patch: [{ op: 'replace', path: '/environments/test/on', value: true }] }),
  });

  // Wait for LD propagation
  await page.waitForTimeout(2000);

  await page.goto('/');
  // Test new behavior
});
```

⚠️ This is slow (LD propagation 1–5s) and modifies SHARED state. Don't do this in parallel CI.

Better: use LD's "test environment" feature with per-PR flag values, or use bootstrap data on init.

---

## 6. Unleash / OpenFeature

OpenFeature is the standard; multiple providers (Unleash, ConfigCat, Flagsmith).

```typescript
import { OpenFeature, type Client } from '@openfeature/server-sdk';

await OpenFeature.setProviderAndWait(new UnleashProvider({ /* ... */ }));
const client = OpenFeature.getClient();

const enabled = await client.getBooleanValue('new-checkout', false);
```

Same testing patterns as LD.

---

## 7. Matrix

For flags with interaction effects:

```typescript
const matrix = [
  { newCheckout: false, pricingV2: false, label: 'old checkout, old pricing' },
  { newCheckout: false, pricingV2: true,  label: 'old checkout, new pricing' },
  { newCheckout: true,  pricingV2: false, label: 'new checkout, old pricing' },
  { newCheckout: true,  pricingV2: true,  label: 'new checkout, new pricing' },
];

for (const variant of matrix) {
  test(`checkout works: ${variant.label}`, async ({ page }) => {
    test.use({ flags: variant });
    await runCheckoutFlow(page);
  });
}
```

4 variants × 1 test = 4 tests. Manageable.

---

## 8. All-on / all-off smoke

The most important pair:
- All flags ON — the future state. Tests catch regressions.
- All flags OFF — the rollback state. Tests verify the app still works without ANY flag.

```typescript
test.describe('all flags on', () => {
  test.use({ flags: allFlagsOn() });
  test('home page loads', async ({ page }) => { /* ... */ });
});

test.describe('all flags off', () => {
  test.use({ flags: allFlagsOff() });
  test('home page loads', async ({ page }) => { /* ... */ });
});
```

If all-on breaks: the future state has a bug — fix before merging.
If all-off breaks: you broke the rollback path — critical.

---

## 9. Common failures

### Failure 1 — Flag value doesn't propagate

**Cause:** SDK caches values. After updating via API, the in-memory value is stale.
**Fix:** Use the SDK's flush method, or restart the app between tests.

### Failure 2 — Test passes locally, fails in CI

**Cause:** Different flag values per environment.
**Fix:** Fixture-driven injection eliminates env-specific flag state.

### Failure 3 — Tests affect each other

**Cause:** Tests share an LD client; one test's flag override affects another.
**Fix:** Test scope per-test client; or use override cookies/URL params.

---

## Cross-references

- Fixture options pattern: [`../reference/04_fixtures.md §10`](../reference/04_fixtures.md#10-the-options-pattern)
- API mocking for SDK calls: [`../reference/13_mocking.md`](../reference/13_mocking.md)
