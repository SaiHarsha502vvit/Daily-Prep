# Level 12 — Debugging Flaky Tests

### Companion track: [Playwright Mobile Testing with TypeScript](00_ROADMAP.md) · Previous: [Level 11](Level_11_Visual_Regression_Testing.md)

---

## Basics — Recap and Extend: Trace Viewer as an Investigation Tool, Not Just a Log

[DOC_09](../Flutter_Bootcamp/Reference/DOC_09_Mobile_Debugging_Toolkit.md#playwright-debugging--the-real-toolchain) already introduced Trace Viewer's five sibling tools. This level goes one level deeper: **actually working through a trace**, not just knowing the tool exists.

```typescript
// playwright.config.ts
export default defineConfig({
  use: { trace: 'on-first-retry' }, // capture ONLY when a test fails and retries — cheap, targeted
  retries: process.env.CI ? 2 : 0,
});
```

```bash
# After a CI failure, download the trace artifact, then:
npx playwright show-trace trace.zip
```

The trace viewer opens showing a **timeline of every action** — each one clickable, each one revealing a DOM snapshot from that exact moment, the network requests in flight, and console output, all scoped to that specific action's time window.

---

## Concept — Mobile-Specific Flakiness Sources, Named Specifically

Generic test flakiness advice ("add better waits") undersells how many mobile-specific timing sources exist. Five worth checking by name, in rough order of how often they're the actual culprit:

1. **Animation timing** — [Level 11's cart-badge example](Level_11_Visual_Regression_Testing.md#real-world-problem--the-screenshot-that-fails-for-the-wrong-reason) is one instance of a broader category: any test racing a CSS transition or JS-driven animation, not just visual ones.
2. **Touch gesture completion** — [Level 4's gesture toolkit](Level_04_Touch_and_Gesture_Interactions.md) dispatches raw events; a real app's gesture handler might take a moment (debounce, a momentum-scroll calculation) to fully process what was dispatched before the resulting UI state is ready to assert against.
3. **Network variability** — even mocked (per [Level 5](Level_05_Network_Interception_and_Mocking.md)), a real backend call for anything *not* mocked can vary in latency between CI runs in ways it never does on a fast local machine.
4. **Viewport-dependent layout shifts** — a mobile layout with content that reflows as images/fonts load (a real mobile-specific issue, since mobile connections are more often throttled or variable) can shift element positions between when a locator resolves and when an action actually executes.
5. **Device/emulator resource contention** — CI runners are frequently more resource-constrained than a developer's local machine; a test that's never flaky locally can be flaky in CI purely because everything (including animations, network stack initialization) runs measurably slower under load.

---

## Real-World Problem — Diagnosing a Test That Fails Only in CI, Never Locally

```typescript
test('adding item shows confirmation toast', async ({ page }) => {
  await page.goto('/product/123');
  await page.getByRole('button', { name: 'Add to Cart' }).tap();
  await expect(page.getByText('Added to cart!')).toBeVisible(); // fails ~1 in 10 CI runs, never locally
});
```

**The investigation, step by step, using a captured trace:**

1. Open the trace for a failed run: `npx playwright show-trace trace.zip`.
2. Click the failed assertion's action in the timeline — the DOM snapshot at that exact moment shows the toast **partially rendered**, mid-fade-in, not yet at full opacity.
3. Check the **duration** column for the `.tap()` action immediately before it — on the failing run, it took noticeably longer than on a passing local run, consistent with [Concept point 5](#concept--mobile-specific-flakiness-sources-named-specifically) (CI resource contention slowing down the tap-to-toast pipeline).
4. **Conclusion:** this is an animation-timing race ([Concept point 1](#concept--mobile-specific-flakiness-sources-named-specifically)), made visible specifically under CI's slower conditions — not a logic bug, and not something that would ever surface from reading the test code alone.

```typescript
// Fix: assert on the SETTLED state, not just "visible at all"
await expect(page.getByText('Added to cart!')).toBeVisible();
await expect(page.getByText('Added to cart!')).toHaveCSS('opacity', '1'); // fully faded in, not mid-transition
```

---

## Solution — Comparing Two Traces Side by Side

When a test is flaky rather than consistently broken, a single trace often isn't enough — the genuinely diagnostic move is comparing a **passing** run's trace against a **failing** run's trace for the same test:

```bash
npx playwright show-trace passing-run-trace.zip
npx playwright show-trace failing-run-trace.zip
# open both, compare the SAME action's timing/DOM-state side by side
```

Look specifically for: **where do the two timelines first diverge** (which action took longer, or produced a different DOM snapshot), and **is the divergence in your own app's rendering, or in the test's own action timing**. A divergence that starts several actions before the actual failed assertion often points at an earlier, quieter timing issue compounding into the visible failure — not the assertion itself being wrong.

---

## Challenges

### 🐛 Bug Hunt — Retries That Hide a Real Bug Instead of Fixing Flakiness

```typescript
// playwright.config.ts
export default defineConfig({
  retries: 5, // "just in case"
});
```

A genuinely broken feature — a button that only works after the *second* tap due to a real event-handling bug — now passes CI consistently. Explain, precisely, why high retry counts are actively dangerous here, not just wasteful.

<details><summary>Diagnosis</summary>

🔴 **Explanation:** `retries: 5` means Playwright re-runs a failing test up to 5 additional times, and the run is marked as passing the moment **any** attempt succeeds. A button that genuinely requires two taps to register (a real bug — perhaps a debounce set too aggressively, or a race in the click handler's own state) fails attempt 1 (only one tap happened) but **passes on retry**, because retrying the whole test from scratch means the button gets tapped again, and this time it's effectively the "second tap" the buggy handler needed. The test suite reports green. The bug ships. This is the sharpest version of [DOC_08's anti-pattern content](../Flutter_Bootcamp/Reference/DOC_08_Patterns_and_AntiPatterns.md) applied to test infrastructure itself — retries are meant to absorb genuine *environmental* flakiness (a slow CI runner, a momentary network blip), not to paper over a test that's deterministically failing because the app has a real bug. A retry count should be small (1-2) and treated as a mitigation for infrastructure noise, never as a substitute for actually investigating why a test failed at all.

</details>

---

### 🏗️ Build It Blind — Diagnose From a Trace Description Alone

No code. You're handed a description of what a captured trace shows for a flaky test. Name the likely root cause using [this level's five flakiness sources](#concept--mobile-specific-flakiness-sources-named-specifically), and what you'd check next to confirm it.

1. "The DOM snapshot at the failed assertion shows the exact right element, in the exact right position — but the test still failed with a timeout waiting for it to be 'stable'."
2. "The network panel shows the mocked API response arrived in 5ms, same as always — but a real, unmocked font file took 800ms to load on the failing run, versus 40ms on a passing one."
3. "The gesture dispatch (a swipe) completed in the trace's timeline, but the list didn't finish scrolling to its final position until nearly a full second later."

<details><summary>Reasoning</summary>

1. **Layout shift ([Concept point 4](#concept--mobile-specific-flakiness-sources-named-specifically)).** "Right position, but failed the stability check" is close to a direct description of Mobilewright's own stability check concept (bounds unchanged between consecutive checks) — something nearby is still moving/resizing even though the element itself looks correctly placed in this one snapshot; check for a sibling element still animating or a layout recalculation still settling.
2. **Network variability, specifically an *unmocked* asset ([Concept point 3](#concept--mobile-specific-flakiness-sources-named-specifically)).** Mocking the API call doesn't help if a font file (or any other unmocked resource) is what's actually slow — check whether the failing assertion depends on text rendering with the real, loaded font (a layout that shifts once web fonts finish loading is a classic, easy-to-miss flakiness source).
3. **Touch gesture completion lag ([Concept point 2](#concept--mobile-specific-flakiness-sources-named-specifically)).** The gesture *dispatch* finishing isn't the same as the app's own momentum-scroll physics finishing — a fling gesture in a real app often continues animating well after the last `touchend` event, and an assertion checking final scroll position needs to wait for that settling, not just for the gesture events themselves to have been sent.

🔴 **Explanation:** none of these three descriptions mention a stack trace or an error message — that's deliberate, matching [DOC_09's own triage-from-symptom training](../Flutter_Bootcamp/Reference/DOC_09b_Mobile_Debugging_Toolkit_Challenges.md#-build-it-blind--triage-four-vague-bug-reports). Reading a trace's *shape* (what was captured, what timing looks unusual) and matching it to a known category of flakiness, before diving into the app's own source code, is consistently faster than guessing.

</details>

---

**Tier 3 complete.** You can now go past emulation to real devices, cross the native/WebView boundary with real running code, catch pixel-level regressions without chasing false positives, and diagnose flakiness from a trace instead of adding retries and hoping. One level left — putting all thirteen levels' worth of skills into a real, working pipeline.

**Next → [Level 13: Capstone — CI/CD Pipeline](Level_13_Capstone_CICD_Pipeline.md)**
