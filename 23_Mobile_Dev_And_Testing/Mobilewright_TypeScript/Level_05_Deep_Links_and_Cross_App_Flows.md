# Level 5 — Deep Links & Cross-App Flows

### Companion track: [Mobilewright Native Testing with TypeScript](00_ROADMAP.md) · Previous: [Level 4](Level_04_Auto_Waiting_and_Assertions.md)

---

## Basics — Two `device` Methods That Have No `screen` Equivalent

[Level 1's fixture split](Level_01_Setup_and_First_Native_Test.md#concept--the-screendevice-fixture-split-restated-with-purpose) drew the line: `screen` is what's rendered, `device` is the environment the app runs in. This level is the first one where that line actually matters in practice:

```typescript
// Opens a URL — could be a deep link into YOUR app, or a URL that
// launches an entirely different app (a browser, a maps app)
await device.openUrl('myapp://reset-password?token=abc123');

// Reports which app is CURRENTLY in the foreground — not always the
// app your config's bundleId points at
const foreground = await device.getForegroundApp();
console.log(foreground.bundleId); // e.g. 'com.android.chrome', not your app
```

Neither of these has any equivalent on `screen`, because neither is about pixels currently rendered — `openUrl` is a device-level trigger that happens *before* anything is necessarily on screen yet, and `getForegroundApp` answers a question about the device's app-switching state, not about any one screen's content.

---

## Concept — Testing What Starts Outside Your App

A deep link, a push-notification tap, an OS share-sheet handoff — these all share one property: **the test scenario begins before your app is even the thing in focus.** You can't `getByRole` your way into a notification tray or an external browser's UI (and shouldn't try to — testing another app's UI in detail is out of scope for testing yours). The right question, per [06's own coverage](../06_Mobilewright_Native_Testing.md), is narrower and more honest: *does my app end up in the right state once control returns to it?*

```typescript
test('deep link opens password reset screen with token pre-filled', async ({ device, screen }) => {
  await device.openUrl('myapp://reset-password?token=abc123');

  // Assert on the RESULT inside your own app, not on anything
  // that happened in whatever system UI handled the link
  await expect(screen.getByText('Reset Your Password')).toBeVisible();
  await expect(screen.getByRole('textfield', { name: 'New Password' })).toBeVisible();
});
```

---

## Real-World Problem — Confirming an Outbound Link Actually Left Your App

```typescript
test('tapping "Visit our website" opens the external browser', async ({ device, screen }) => {
  await screen.getByText('Visit our website').tap();

  const foreground = await device.getForegroundApp();
  expect(foreground.bundleId).not.toBe('com.example.myapp');
});
```

This is the inverse case from the reset-password example: instead of confirming a deep link routed *into* your app correctly, this confirms a link correctly routed *out*. Without `getForegroundApp()`, there's no way to verify this at all — `screen` can only describe what's rendered, and once a browser takes over, nothing about that browser's UI is your app's `screen` fixture's business to inspect.

---

## Solution — Deep Links Into a Screen That Requires Prior State

```typescript
test('notification tap opens the specific order detail screen', async ({ device, screen }) => {
  // A real deep link carries an ID — the same as any URL parameter,
  // this ISN'T Mobilewright-specific, it's how deep links generally work
  await device.openUrl('myapp://orders/ORD-4471');

  await expect(screen.getByText('Order ORD-4471')).toBeVisible();
  await expect(screen.getByText('Order Details')).toBeVisible();
});
```

**The honest limitation worth stating plainly:** `device.openUrl()` simulates the deep link arriving — it does not simulate the actual notification, email, or external app that would have generated it in production. If your app's deep-link *handling* logic is correct but the thing that's supposed to generate the link (a push notification payload, a dynamic-link service) is broken, this test would still pass, because it never touches that layer at all. This is the same "know what you're actually testing" discipline as [Playwright_Mobile_TypeScript's Level 5](../Playwright_Mobile_TypeScript/Level_05_Network_Interception_and_Mocking.md) — a mocked/simulated trigger tests your app's reaction to it, not the trigger's own correctness.

---

## Challenges

### 🐛 Bug Hunt — Simulating a Deep Link the Wrong Way

```typescript
test('deep link opens order details', async ({ screen }) => {
  await screen.getByRole('textfield').fill('myapp://orders/ORD-4471'); // wrong approach
  await expect(screen.getByText('Order Details')).toBeVisible();
});
```

Using [this level's own Basics section](#basics--two-device-methods-that-have-no-screen-equivalent), what's fundamentally wrong with this test — not a syntax problem, a conceptual one?

<details><summary>Diagnosis & Fix</summary>

🔴 **Explanation:** typing a deep-link URL into a text field on screen tests something completely different from what a real deep link does — in production, nobody types `myapp://orders/ORD-4471` into a field inside the app; the OS receives the URL from an external trigger (a notification, a browser, another app) and hands it to the app directly, often launching or resuming the app in the process. This test is scoped entirely to `screen` (an in-app text field), when the actual behavior under test — the OS routing a URL to the app — is a `device`-level concern that has no on-screen element to interact with in the first place. The fix uses the real mechanism:

```typescript
test('deep link opens order details', async ({ device, screen }) => {
  await device.openUrl('myapp://orders/ORD-4471');
  await expect(screen.getByText('Order Details')).toBeVisible();
});
```

The broader lesson: when a test scenario doesn't have a natural on-screen element to interact with, that's usually a sign you're looking at the wrong fixture, not a sign to invent an artificial one (like typing a URL into an unrelated text field) just to stay within `screen`.

</details>

---

### 🎭 Two Truths and a Lie — Deep Links and Foreground State

**A.** `device.getForegroundApp()` can report a `bundleId` that doesn't match your test's configured app at all, if a deep link routed control to a completely different app.

**B.** `device.openUrl()` also verifies that the deep link's target screen rendered correctly — it won't resolve until the resulting screen finishes loading.

**C.** A test that only asserts on `screen` content after `device.openUrl()` is implicitly testing that control returned to your app, without needing a separate `getForegroundApp()` check — if the assertion finds the expected text, your app must be in the foreground.

<details><summary>Which one's the lie</summary>

**B is the lie.** `device.openUrl()` per this level's own examples is a trigger — it opens the URL and hands control to whatever app claims that URL scheme. It has no built-in awareness of "the resulting screen," because from `device`'s perspective the notion of a rendered screen doesn't exist at all — that's `screen`'s job, and it requires a separate `await expect(screen...).toBeVisible()` call afterward, with its own auto-retry timeout, to actually confirm the target screen appeared.

🔴 **Explanation:** A is true and is the entire premise of [this level's Real-World Problem](#real-world-problem--confirming-an-outbound-link-actually-left-your-app) — a link can legitimately route to a different app, and `getForegroundApp()` is the only fixture method that can observe that. C is also true, and worth noticing as a genuinely useful shortcut: if a `screen` assertion successfully finds content that only exists in your app's UI, that's already indirect proof your app is in the foreground — you only need `getForegroundApp()` explicitly when you're checking that control left your app, not when you're checking that it arrived.

</details>

---

**Next → [Level 6: Multi-Platform Project Config](Level_06_Multi_Platform_Project_Config.md)**
