# Level 4 — Touch & Gesture Interactions

### Companion track: [Playwright Mobile Testing with TypeScript](00_ROADMAP.md) · Previous: [Level 3](Level_03_Device_Emulation_Mastery.md)

---

## Basics — The One Real Method, Recapped and Extended

[05_Mobile_Web_And_Hybrid_Playwright.md](../05_Mobile_Web_And_Hybrid_Playwright.md) already established the load-bearing fact this whole level builds on: **`Touchscreen` has exactly one method, `tap(x, y)`.** Everything else — swipe, long-press, pinch — is built from manually dispatching raw `touchstart`/`touchmove`/`touchend` events. This level turns that one fact into a genuinely reusable TypeScript gesture toolkit, building in complexity one gesture at a time.

```typescript
// The one built-in method — works, but only for a simple tap
await page.touchscreen.tap(200, 400);

// locator.tap() is usually better for tapping a SPECIFIC element —
// it auto-waits and auto-scrolls, touchscreen.tap() needs raw coordinates
await page.getByRole('button', { name: 'Add to Cart' }).tap();
```

---

## Concept 1 — Swipe, Built as a Reusable Function

Recapping and formalizing [05's swipe pattern](../05_Mobile_Web_And_Hybrid_Playwright.md#concept-1--touch-gestures-what-touchscreen-actually-offers) as a proper typed utility, since every gesture from here on reuses this shape:

```typescript
// gestures.ts
import { Page } from '@playwright/test';

export async function swipe(
  page: Page,
  from: { x: number; y: number },
  to: { x: number; y: number },
  steps = 10,
): Promise<void> {
  await page.dispatchEvent('body', 'touchstart', {
    touches: [{ identifier: 0, clientX: from.x, clientY: from.y }],
  });

  for (let i = 1; i <= steps; i++) {
    const x = from.x + ((to.x - from.x) * i) / steps;
    const y = from.y + ((to.y - from.y) * i) / steps;
    await page.dispatchEvent('body', 'touchmove', {
      touches: [{ identifier: 0, clientX: x, clientY: y }],
    });
  }

  await page.dispatchEvent('body', 'touchend', { touches: [] });
}
```

```typescript
// usage
import { swipe } from './gestures';

test('swiping left dismisses a card', async ({ page }) => {
  await swipe(page, { x: 300, y: 400 }, { x: 50, y: 400 });
  await expect(page.getByTestId('card-1')).toBeHidden();
});
```

---

## Concept 2 — Long-Press, a Gesture With No Movement At All

A long-press is, mechanically, the *opposite* problem from a swipe: instead of needing intermediate `touchmove` points, it needs **no movement and a deliberate wait**, because most long-press detection in real apps is implemented as "if `touchstart` fires and `touchend` hasn't fired within N milliseconds, treat it as a long-press" — often via a `setTimeout` in the app's own JavaScript.

```typescript
export async function longPress(
  page: Page,
  point: { x: number; y: number },
  holdMs = 600, // most apps use 500-800ms as their long-press threshold
): Promise<void> {
  await page.dispatchEvent('body', 'touchstart', {
    touches: [{ identifier: 0, clientX: point.x, clientY: point.y }],
  });

  await page.waitForTimeout(holdMs); // deliberate hold — this IS the gesture

  await page.dispatchEvent('body', 'touchend', { touches: [] });
}
```

```typescript
test('long-pressing a message shows the reaction picker', async ({ page }) => {
  const message = page.getByTestId('message-42');
  const box = await message.boundingBox();
  if (!box) throw new Error('message not found');

  await longPress(page, { x: box.x + box.width / 2, y: box.y + box.height / 2 });
  await expect(page.getByTestId('reaction-picker')).toBeVisible();
});
```

🔴 **Why `page.waitForTimeout` is legitimate here, when it's usually an anti-pattern elsewhere:** Playwright's own philosophy strongly discourages arbitrary waits in favor of auto-retrying assertions — but a long-press gesture's *entire mechanism* is a deliberate time hold, not a network/rendering delay you're impatiently waiting out. This is one of the rare, correct uses of a fixed wait — not a workaround for flakiness, but a faithful simulation of what a real finger does.

---

## Real-World Problem — Pinch-to-Zoom, the Hardest Gesture in This Toolkit

Pinch requires **two simultaneous touch points** whose distance from each other changes over time — genuinely more complex than every gesture above, because the `touches` array now needs two entries, both moving, on every `touchmove` event.

```typescript
export async function pinch(
  page: Page,
  center: { x: number; y: number },
  startDistance: number,
  endDistance: number,
  steps = 10,
): Promise<void> {
  const angle = 0; // horizontal pinch axis — could be parameterized further

  const pointAt = (distance: number, side: 1 | -1) => ({
    identifier: side === 1 ? 0 : 1,
    clientX: center.x + side * (distance / 2) * Math.cos(angle),
    clientY: center.y + side * (distance / 2) * Math.sin(angle),
  });

  await page.dispatchEvent('body', 'touchstart', {
    touches: [pointAt(startDistance, 1), pointAt(startDistance, -1)],
  });

  for (let i = 1; i <= steps; i++) {
    const currentDistance = startDistance + ((endDistance - startDistance) * i) / steps;
    await page.dispatchEvent('body', 'touchmove', {
      touches: [pointAt(currentDistance, 1), pointAt(currentDistance, -1)],
    });
  }

  await page.dispatchEvent('body', 'touchend', { touches: [] });
}
```

```typescript
test('pinch-out zooms into the product image', async ({ page }) => {
  await page.goto('/product/789');
  const image = page.getByTestId('product-image');
  const box = await image.boundingBox();
  if (!box) throw new Error('image not found');

  const center = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  await pinch(page, center, 100, 400); // distance grows 100px -> 400px = zoom IN

  // A real zoomed image typically gets a CSS transform scale applied
  await expect(image).toHaveCSS('transform', /matrix\(2/); // roughly 2x scale
});
```

---

## Solution — Combining Everything Into One Toolkit

```typescript
// gestures.ts — the complete Level 4 toolkit, ready to import into any test
import { Page } from '@playwright/test';

export async function swipe(page: Page, from: Point, to: Point, steps = 10) { /* ...as above... */ }
export async function longPress(page: Page, point: Point, holdMs = 600) { /* ...as above... */ }
export async function pinch(page: Page, center: Point, startDistance: number, endDistance: number, steps = 10) { /* ...as above... */ }

interface Point { x: number; y: number; }
```

This is the shape [Level 6](Level_06_Page_Object_Model.md) builds on directly — a shared, tested utility module every Page Object in your suite can import, instead of every test file reimplementing its own ad hoc touch-dispatch code.

---

## Challenges

### 🐛 Bug Hunt — The Pinch That Zooms the Wrong Way

```typescript
test('pinch-in zooms out', async ({ page }) => {
  await pinch(page, center, 400, 100); // intending to zoom OUT
  await expect(image).toHaveCSS('transform', /matrix\(0\.5/); // expecting ~0.5x scale
});
```

This test fails — the image doesn't zoom out at all; the app's zoom handler never fires. Using [this level's `pinch()` implementation](#real-world-problem--pinch-to-zoom-the-hardest-gesture-in-this-toolkit), find the mismatch between what the test intends and what actually happens.

<details><summary>Diagnosis</summary>

🔴 **Explanation:** this is actually a **correct call** to `pinch()` — `startDistance: 400, endDistance: 100` genuinely produces two fingers moving *closer together* over the gesture, which is a real pinch-in. The likely bug is elsewhere: many real pinch-to-zoom implementations use a **minimum distance-change threshold** before registering the gesture at all (to avoid misfiring on small accidental finger jitter) — if the app's threshold is, say, 50px of total distance change within the first few `touchmove` events, and this test's `steps = 10` default spreads a 300px change across 10 gradual increments, each individual `touchmove` might report too small a per-step delta for the app's handler to recognize as an intentional pinch, depending on how that handler computes "did the distance change enough, fast enough." The fix worth trying first: reduce `steps` (fewer, larger jumps per `touchmove`) or add a real handler-side log to confirm whether `touchmove` is firing at all versus firing but not clearing the app's own gesture-recognition threshold — this is a genuine case where the fix depends on reading the *app's* gesture-detection code, not just the test.

</details>

---

### 🎭 Two Truths and a Lie — Touch Event Mechanics

**A.** Two simultaneous touches in a `touches` array must have different `identifier` values, or the browser can't tell them apart as separate fingers.

**B.** `page.waitForTimeout()` inside `longPress()` is a legitimate, non-flaky use of a fixed wait, because the gesture being simulated is itself defined by a time duration, not by waiting for the DOM to update.

**C.** A `touchend` event's `touches` array should always list the touch point(s) that just lifted, so the app knows exactly which finger ended the gesture.

<details><summary>Which one's the lie</summary>

**C is the lie** — same fact as [05_Mobile_Web_And_Hybrid_Playwright.md's own Bug Hunt](../05_Mobile_Web_And_Hybrid_Playwright.md#-bug-hunt--the-swipe-that-never-fires): `touchend`'s `touches` array represents touches **still currently active** — a lifted finger is, by definition, no longer touching, so it should be *absent*, not listed. Every `touchend` dispatch in this level's gesture toolkit correctly passes `touches: []` for exactly this reason (or, for a multi-touch gesture where only one of two fingers lifts, the array would contain only the *remaining* finger, not the one that just lifted).

🔴 **Explanation:** A is true and is why `pinch()`'s `pointAt` helper assigns `identifier: side === 1 ? 0 : 1` — two touch points sharing the same identifier would be indistinguishable to the browser's touch-tracking, collapsing what should be two independent fingers into ambiguous, likely-broken gesture data. B is true and is the direct callback to this level's own explanation of why `waitForTimeout` is a legitimate exception to Playwright's general anti-arbitrary-wait guidance here specifically.

</details>

---

**Tier 1 complete.** You can now set up a project, find elements the resilient way, build custom device profiles, and simulate every common touch gesture from raw events. Tier 2 starts putting these into a real, maintainable test suite shape.

**Next → [Level 5: Network Interception & Mocking](Level_05_Network_Interception_and_Mocking.md)**
