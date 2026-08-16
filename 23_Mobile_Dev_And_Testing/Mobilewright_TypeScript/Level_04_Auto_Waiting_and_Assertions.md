# Level 4 — Auto-Waiting & Assertions

### Companion track: [Mobilewright Native Testing with TypeScript](00_ROADMAP.md) · Previous: [Level 3](Level_03_Actions_Locator_vs_Screen_Level.md)

---

## Basics — The Four Checks, Restated With Numbers That Matter

[06's own coverage](../06_Mobilewright_Native_Testing.md#auto-waiting--four-checks-every-action) named the four actionability checks. This level is about actually using the timing numbers deliberately, not just knowing they exist:

| Check | What it verifies | Retry interval |
|---|---|---|
| Exists | Element is present in the view hierarchy | 100ms |
| Visible | `isVisible` is `true` | 100ms |
| Enabled | `isEnabled` is `true` | 100ms |
| Stable | Bounds unchanged between two consecutive checks | 50ms (faster — designed to catch "animation just stopped" quickly) |

Default overall timeout: **5 seconds**. Every locator action implicitly runs all four checks, in order, before actually performing the action — this is why a `tap()` on an element that's mid-animation doesn't need a manual wait; the *stable* check handles it automatically.

---

## Concept — Locator Assertions vs Value Assertions: A Real, Consequential Split

```typescript
// LOCATOR assertions — auto-retry for up to 5s (default) until true or timeout
await expect(screen.getByText('Order confirmed')).toBeVisible();
await expect(screen.getByRole('checkbox')).toBeChecked();
await expect(screen.getByTestId('cart-count')).toHaveText('3');

// VALUE assertions — check ONCE, synchronously, no retry at all
const total = 42;
expect(total).toBe(42);
expect([1, 2, 3]).toContain(2);
expect(someValue).toBeGreaterThan(10);
```

Per Mobilewright's own documentation: *"Locator assertions auto-wait and retry until the condition is met or the timeout expires... Only locator-based assertions support this — value assertions do not auto-wait."* This is the exact same split as [Playwright_Mobile_TypeScript's Level 2](../Playwright_Mobile_TypeScript/Level_02_Locators_and_Assertions.md#solution--expectlocator-vs-expectvalue-and-why-its-not-just-style) already taught for `expect(locator)` vs `expect(value)` — Mobilewright borrowed this design decision along with the general API shape, and the same real-world consequence applies: pulling a value out of the UI first (via some read method) and *then* asserting on the plain value throws away the retry entirely.

---

## Real-World Problem — Tuning Timeout for a Genuinely Slow Operation

```typescript
test('large file upload completes and shows success', async ({ screen }) => {
  await screen.getByRole('button', { name: 'Upload' }).tap();

  // A large file upload genuinely takes longer than the 5s default —
  // this ISN'T flakiness to suppress, it's an honest, longer operation
  await expect(screen.getByText('Upload complete')).toBeVisible({ timeout: 30_000 });
});
```

**The distinction worth being precise about:** raising a timeout for a genuinely slow, real operation (a large upload, a heavy data sync) is legitimate and correct. Raising a timeout to make an *already-broken* test pass — one that's actually racing a bug, not a real slow operation — is exactly the retry-count anti-pattern [Playwright_Mobile_TypeScript's Level 12](../Playwright_Mobile_TypeScript/Level_12_Debugging_Flaky_Tests.md#-bug-hunt--retries-that-hide-a-real-bug-instead-of-fixing-flakiness) warned against, just wearing a timeout instead of a retry count. Before raising a timeout, the honest question is always: *is this operation actually supposed to take this long in production, or am I compensating for something broken?*

---

## Solution — Choosing the Right Assertion for What You're Actually Verifying

```typescript
// Verifying a checkbox's CURRENT state (UI-driven, needs auto-retry
// since the check might be mid-toggle-animation)
await expect(screen.getByRole('checkbox', { name: 'Remember me' })).toBeChecked();

// Verifying something computed IN YOUR TEST CODE, not read from the UI
// (a value assertion is correct here — there's genuinely nothing to retry against)
const expectedTotal = items.reduce((sum, item) => sum + item.price, 0);
expect(expectedTotal).toBeCloseTo(42.99, 2); // 2 decimal places tolerance

// The trap: reading a UI value out, THEN asserting on it as a plain value —
// throws away auto-retry for something that WAS genuinely UI-driven
const badgeText = await screen.getByTestId('cart-badge').textContent();
expect(badgeText).toBe('3'); // fragile — no retry if the badge hasn't updated yet

// The fix — keep it as a locator assertion the whole way through
await expect(screen.getByTestId('cart-badge')).toHaveText('3');
```

The rule worth internalizing precisely: **if the thing you're checking lives in the UI, assert on the locator directly — don't extract its value first.** Value assertions are for things that were never UI state to begin with (a computation your test performed, a value from an API response you fetched directly, a length/count derived from test setup data).

---

## Challenges

### 🐛 Bug Hunt — The Assertion That Passes When It Shouldn't

```typescript
test('error message clears after retry', async ({ screen }) => {
  await screen.getByRole('button', { name: 'Retry' }).tap();
  const errorText = await screen.getByTestId('error-banner').textContent();
  expect(errorText).toBeFalsy(); // passes... but is this actually testing what it looks like?
});
```

This test passes consistently. It should be catching a real regression where the error banner sometimes doesn't clear — but it never does. Using [this level's own value-vs-locator-assertion distinction](#solution--choosing-the-right-assertion-for-what-youre-actually-verifying), explain why.

<details><summary>Diagnosis & Fix</summary>

🔴 **Explanation:** `screen.getByTestId('error-banner').textContent()` reads the element's text **once**, synchronously, at the exact moment this line executes — immediately after the tap, likely *before* the app has had any chance to actually clear the banner (no wait, no retry). If the banner hasn't cleared yet at that instant, `textContent()` might throw (element genuinely still present with text) or, depending on timing, this line could even run before the banner ever appeared in the first place, silently reading an empty/null value that happens to satisfy `toBeFalsy()` for entirely the wrong reason. The test isn't verifying "the error banner cleared after a retry" — it's accidentally verifying "something falsy was read from wherever the DOM happened to be at one specific instant," which can pass even when the real behavior is broken. The fix restores a genuine locator assertion:

```typescript
await screen.getByRole('button', { name: 'Retry' }).tap();
await expect(screen.getByTestId('error-banner')).toBeHidden(); // auto-retries until it's actually gone
```

This is a sharper version of [this level's own "the trap" example](#solution--choosing-the-right-assertion-for-what-youre-actually-verifying) — not just "less robust," but a test that can pass while the exact bug it was written to catch is actively present.

</details>

---

### 🎭 Two Truths and a Lie — Timing Mechanics

**A.** The "stable" actionability check retries every 50ms specifically because it needs to detect "animation just stopped" faster than the other three checks, which retry every 100ms.

**B.** Setting `{ timeout: 30_000 }` on one specific assertion also raises the default timeout for every other assertion in the same test file.

**C.** A value assertion like `expect(total).toBe(42)` failing produces an immediate failure with no retry, even if `total` was computed from a UI value that technically could still be "catching up."

<details><summary>Which one's the lie</summary>

**B is the lie.** Per [this level's own real-world example](#real-world-problem--tuning-timeout-for-a-genuinely-slow-operation), `{ timeout: 30_000 }` is passed as an option to one specific assertion call — it scopes to that call only, not the whole file or test. Every other assertion in the same test (or file) keeps using whatever timeout applies to it by default (the global config value, or Mobilewright's own 5-second default), completely unaffected by a per-call override elsewhere.

🔴 **Explanation:** A is true and is [this level's own basics table](#basics--the-four-checks-restated-with-numbers-that-matter) stated directly — the faster 50ms interval for stability checking is a deliberate design choice to catch "the animation has genuinely stopped" as quickly as reasonably possible, since that's usually the actionability check most directly tied to visible, time-sensitive UI motion. C is true and is exactly the point of [this level's Bug Hunt](#-bug-hunt--the-assertion-that-passes-when-it-shouldnt) — a value assertion never retries, period, regardless of where the value it's checking originally came from.

</details>

---

**Tier 1 complete.** You can set up a real project, find elements the resilient cross-platform way, choose correctly between locator-scoped and screen-level actions, and know precisely which assertions retry and which don't. Tier 2 moves past a single screen into real app flows — deep links, multi-platform config, and the honest limits of what Mobilewright's fixture system currently offers.

**Next → [Level 5: Deep Links & Cross-App Flows](Level_05_Deep_Links_and_Cross_App_Flows.md)**
