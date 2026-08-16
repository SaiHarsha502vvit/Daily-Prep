# Level 11 — The WebView Bridge, Full Depth

### Companion track: [Mobilewright Native Testing with TypeScript](00_ROADMAP.md) · Previous: [Level 10](Level_10_The_Mobilewright_Inspector.md)

---

## Basics — `getByWebView().page()`: Crossing From Native Locators to Playwright's Own API

```typescript
test('embedded checkout webview loads correctly', async ({ screen }) => {
  // Native locator, finding the WebView CONTAINER as a native element
  const webview = screen.getByWebView();

  // .page() hands back an object with PLAYWRIGHT'S OWN page API —
  // this is the actual bridge: native locators stop here, DOM
  // locators (getByRole, getByText, etc. in the DOM sense) start
  const page = await webview.page();
  await page.getByRole('button', { name: 'Pay Now' }).click(); // Playwright Page API, not Mobilewright's screen API
});
```

Two genuinely different locator systems exist in this one test: `screen.getByWebView()` uses Mobilewright's native accessibility-tree matching (from [Level 2](Level_02_Cross_Platform_Locators.md)) to find the WebView *as a native element on the screen* — a native container widget, nothing more. Everything *inside* that container, once you call `.page()`, is real DOM content, addressed through Playwright's actual `Page` API (`.click()` not `.tap()`, `.fill()` behaving like Playwright's own, not Mobilewright's).

---

## Concept — Why This Is a Genuine Capability Gap Playwright's Own Android API Doesn't Close

[06's own coverage](../06_Mobilewright_Native_Testing.md) already flagged this directly: Playwright's own experimental Android API (`playwright-android`, covered in [Playwright_Mobile_TypeScript's Level 9](../Playwright_Mobile_TypeScript/Level_09_Android_API_Real_Devices.md)) has its own `device.webView()` method — but it's **Android-only**, with no iOS equivalent, because Playwright's Android API as a whole has no iOS counterpart at all. Mobilewright's `getByWebView().page()` bridge works identically on both platforms, because Mobilewright was built cross-platform from the start rather than growing an Android-specific extension onto a browser-automation tool. This is one of the few places in this entire track where Mobilewright offers something with genuinely no equivalent anywhere in the Playwright track, rather than an alternate way to reach a comparable outcome.

---

## Real-World Problem — A Hybrid Screen: Native Header, WebView Body

```typescript
test('hybrid checkout screen: native header + webview payment form', async ({ screen }) => {
  // Native part — ordinary screen-level locators, nothing new
  await expect(screen.getByText('Checkout')).toBeVisible(); // native header title
  await expect(screen.getByRole('button', { name: 'Back' })).toBeVisible(); // native back button

  // WebView part — cross into the DOM-based API for the embedded form
  const page = await screen.getByWebView().page();
  await page.getByLabel('Card Number').fill('4242424242424242');
  await page.getByLabel('Expiry').fill('12/28');
  await page.getByRole('button', { name: 'Submit Payment' }).click();

  // Back to native — the app navigates to a native confirmation screen
  await expect(screen.getByText('Payment Successful')).toBeVisible();
});
```

This single test crosses the native/DOM boundary **twice** — into the WebView for the payment form, back out to native for the confirmation screen — and the fixture/API switch (`screen.getByX()` vs `page.getByX()`) is the explicit signal for which world each line is operating in.

---

## Solution — The Timing Trap: WebView Content Isn't Guaranteed Ready When the Container Is

```typescript
// RISKY — the WebView container being visible doesn't mean the page
// it's hosting has finished loading yet
const webview = screen.getByWebView();
await expect(webview).toBeVisible(); // only confirms the CONTAINER is on screen
const page = await webview.page();
await page.getByLabel('Card Number').fill('...'); // might fire before the form has rendered

// SAFER — wait for actual DOM content to be ready, using the Playwright-side
// page API's own auto-waiting, exactly as Playwright_Mobile_TypeScript's
// earlier levels already taught for ordinary web content
const page = await webview.page();
await page.getByLabel('Card Number').waitFor({ state: 'visible' });
await page.getByLabel('Card Number').fill('4242424242424242');
```

The container-visible check and the content-ready check are answering genuinely different questions — a native WebView widget can be fully rendered and visible on screen while the page it's loading is still mid-fetch, mid-parse, or showing a loading spinner. Auto-waiting inside the DOM/`page` API (from [`.waitFor()`](../Playwright_Mobile_TypeScript/Level_02_Locators_and_Assertions.md) and locator actions' own built-in retry) is what actually accounts for that gap — the native container's visibility never will.

---

## Challenges

### 🐛 Bug Hunt — Mixing the Two Locator Vocabularies

```typescript
test('webview form submits', async ({ screen }) => {
  const page = await screen.getByWebView().page();
  await page.getByLabel('Card Number').fill('4242424242424242');
  await page.getByRole('button', { name: 'Submit' }).tap(); // .tap() on a Playwright Page locator
});
```

This throws a runtime error on the last line. Using [this level's own Basics section](#basics--getbywebviewpage-crossing-from-native-locators-to-playwrights-own-api), explain why.

<details><summary>Diagnosis & Fix</summary>

🔴 **Explanation:** `page.getByRole(...)` here returns a **Playwright DOM locator** (from `.page()`'s bridge), not a Mobilewright native `Locator` — Playwright's own DOM locator API doesn't have a `.tap()` method; it has `.click()` (and Playwright's own separate `.tap()` exists only in a touch-specific context, not as this method's general action). Calling `.tap()` here is applying Mobilewright's native action vocabulary to an object that's actually running Playwright's DOM vocabulary underneath — the two APIs look similar (both have `getByRole`) but diverge in their action method names past that point. The fix uses the correct vocabulary for the `page`-scoped object:

```typescript
await page.getByRole('button', { name: 'Submit' }).click();
```

The general discipline worth carrying forward: **once `.page()` has been called, every subsequent locator obtained from that `page` object follows Playwright's own DOM API rules, not Mobilewright's native-screen rules** — mentally "switching contexts" at that exact line prevents this whole category of mistake.

</details>

---

### 🎭 Two Truths and a Lie — Native/WebView Boundary

**A.** `screen.getByWebView()` returns a native locator pointing at the WebView container itself — calling `.page()` on it is what actually crosses into DOM-based content.

**B.** Playwright's own Android API (`playwright-android`) has a WebView bridge equivalent to Mobilewright's, and it also works on iOS.

**C.** A native element rendered *after* a WebView-hosted form submission (like a native confirmation screen) should be located with `screen`, not with the `page` object obtained from `.page()`.

<details><summary>Which one's the lie</summary>

**B is the lie.** Per [this level's own Concept section](#concept--why-this-is-a-genuine-capability-gap-playwrights-own-android-api-doesnt-close), Playwright's Android API's WebView access is Android-only — it has no iOS equivalent, because `playwright-android` as a whole has no iOS counterpart. This is precisely the gap that makes Mobilewright's cross-platform WebView bridge a genuinely distinct capability, not a redundant alternative.

🔴 **Explanation:** A is true and is the entire mechanism this level is built around — the container is native, `.page()` is the crossing point into DOM content. C is true and is exactly [this level's own Real-World Problem example](#real-world-problem--a-hybrid-screen-native-header--webview-body) — once the app navigates back to native UI, `screen` is the correct fixture again, since the `page` object obtained earlier has no relationship to content outside the WebView it came from.

</details>

---

**Next → [Level 12: Docker, Cloud Devices & Troubleshooting](Level_12_Docker_Cloud_Devices_and_Troubleshooting.md)**
