# Mobilewright Challenges

### Companion to [06: Mobilewright — Playwright-Powered Native Mobile Automation](06_Mobilewright_Native_Testing.md)

---

## How This Works

Mixed formats — see [the full challenge-type roster](Flutter_Bootcamp/00_CHALLENGE_TYPES.md) for what each icon means.

---

### 🎭 Two Truths and a Lie — What Mobilewright Actually Bridges

**A.** `screen.getByWebView().page()` returns an object that supports Playwright's real locator methods (`getByRole`, `getByText`, etc.) and web-first assertions — not a simplified subset.

**B.** Network interception (`page.route()`-style mocking) works identically inside a Mobilewright-bridged WebView page as it does in a normal Playwright web test.

**C.** `getByRole('textfield')` matches Android's `EditText` and iOS's `TextField` through the same call, because Mobilewright normalizes native type names before checking them against a role mapping table.

<details><summary>Which one's the lie</summary>

**B is the lie.** Per [this doc's own stated limitations](06_Mobilewright_Native_Testing.md#the-genuinely-distinctive-feature--webview-bridging-into-real-playwright), network interception is explicitly **not** supported through the bridged WebView `page` — along with screenshots, dialogs, downloads, and multiple tabs. The bridge gives you Playwright's selector/assertion engine, not the full Playwright `Page` API surface.

🔴 **Explanation:** A and C are both true and are the actual reasons this bridge is worth using at all — A is why hybrid-app WebView tests can reuse real web-testing knowledge instead of learning a separate API, and C is the cross-platform role-normalization that lets one `getByRole('textfield')` call work on both operating systems' completely different native widget classes underneath.

</details>

---

### 🐛 Bug Hunt — The Locator That Silently Never Matches

```typescript
test('tapping the custom rating stars submits a review', async ({ screen }) => {
  await screen.getByRole('button', { name: '5 stars' }).tap(); // times out — element never found
});
```

The app genuinely has a 5-star custom rating widget on screen, clearly visible, tappable by a real user. Using [this doc's locator content](06_Mobilewright_Native_Testing.md#locators--cross-platform-role-normalization), name the most likely cause.

<details><summary>Diagnosis & Fix</summary>

🔴 **Explanation:** a custom-drawn rating widget (five hand-drawn star shapes, not a standard native button/control) very likely has **no role mapping** at all — per this doc's own quoted limitation, *"Anything not listed has no role mapping — `getByRole()` won't find it."* `getByRole('button', ...)` isn't matching a slightly-wrong name here, it's searching against a role that was never assigned to this custom view in the first place. The fix falls back to one of the alternatives this doc names for exactly this case:

```typescript
// If the widget exposes a native class name:
await screen.getByType('RatingStarView').nth(4).tap(); // 0-indexed, 5th star

// Or, if the app's developers added an accessibility label or test ID (the more robust fix):
await screen.getByTestId('rating-star-5').tap();
```

The real fix, if you have any influence over the app's code: ask for a `testID`/accessibility label on custom components exactly like this one — the same "make the app testable, don't just work around it" principle behind adding `data-testid` attributes on the web.

</details>

---

### 👹 Boss Battle — Choosing the Right Tool for a Mixed Screen

**The spec:** you're testing a screen with three distinct pieces: (1) a native top app bar with a native back button, (2) a Capacitor WebView showing the main content (a checkout form), (3) a native bottom sheet that slides up with native payment-method radio buttons. Using [this doc's decision table](06_Mobilewright_Native_Testing.md#deciding-between-mobilewright-appium-and-playwright-for-web), write out which locator/action calls you'd use for each of the three pieces, and why a single tool alone (just Mobilewright's native locators, or just a raw Playwright WebView connection) couldn't cover this screen completely on its own.

<details><summary>One reasonable approach</summary>

```typescript
test('mixed native/WebView checkout screen', async ({ screen }) => {
  // Piece 1: native top app bar — genuinely native, Mobilewright's own locators
  await screen.getByRole('button', { name: 'Back' }).tap();

  // Piece 2: the WebView checkout form — bridge into real Playwright
  const checkoutPage = screen.getByWebView().page();
  await checkoutPage.getByLabel('Card number').fill('4242424242424242');
  await checkoutPage.getByRole('button', { name: 'Continue' }).click();

  // Piece 3: native bottom sheet — back to Mobilewright's native locators
  await screen.getByRole('radio', { name: 'Apple Pay' }).tap();
  await screen.getByRole('button', { name: 'Confirm Payment' }).tap();
});
```

🔴 **Explanation:** the reason no single tool covers this screen alone is architectural, not a tooling gap — pieces 1 and 3 are genuinely native views with no DOM at all, so a WebView-only connection (raw Playwright or otherwise) literally cannot see them; piece 2 is genuinely a DOM, so Mobilewright's native `getByRole`/`getByType` locators have nothing to match against inside it. Mobilewright's actual value on a screen shaped like this is being **one test file, one fixture (`screen`), switching between native locators and a bridged WebView `page` as needed** — rather than needing two entirely separate test frameworks (Appium for the native parts, a standalone Playwright suite for the WebView part) stitched together with custom glue code.

</details>

---

**→ Related:** [Flutter_Bootcamp/Reference/DOC_09_Mobile_Debugging_Toolkit.md](Flutter_Bootcamp/Reference/DOC_09_Mobile_Debugging_Toolkit.md) — the hybrid-app cross-tool diagnosis flow this Boss Battle's screen shape maps onto directly.
