# Level 3 — Actions: Locator vs Screen-Level

### Companion track: [Mobilewright Native Testing with TypeScript](00_ROADMAP.md) · Previous: [Level 2](Level_02_Cross_Platform_Locators.md)

---

## Basics — A Genuinely Richer Gesture API Than Plain Playwright

[Playwright_Mobile_TypeScript's Level 4](../Playwright_Mobile_TypeScript/Level_04_Touch_and_Gesture_Interactions.md) had to build swipe, long-press, and pinch entirely from raw `touchstart`/`touchmove`/`touchend` event dispatch, because Playwright's own `Touchscreen` class ships with exactly one method: `tap()`. Mobilewright's actions API, per its own documentation, ships all of these natively:

```typescript
// LOCATOR actions — resolve an element first, auto-wait until actionable
await screen.getByRole('button', { name: 'Submit' }).tap();
await screen.getByText('Photo').doubleTap();
await screen.getByText('Message').longPress(1_500); // duration in ms, optional
await screen.getByRole('textbox', { name: 'Email' }).fill('user@example.com');
await screen.getByRole('textbox', { name: 'Email' }).clear();
await screen.getByText('Card').swipe({ direction: 'left' });
await screen.getByText('Delete account').scrollIntoViewIfNeeded();
```

No manual event-dispatch, no `touches` array construction — this is the direct benefit of a framework purpose-built for native gesture simulation rather than adapting a browser-automation primitive to the job.

---

## Concept — Screen-Level Actions: When There's No Element to Resolve

```typescript
// SCREEN actions — coordinates or hardware, zero element resolution
await screen.tap(200, 400);
await screen.doubleTap(200, 400);
await screen.longPress(200, 400, 1_500);
await screen.swipe('up'); // whole-screen swipe, no specific element targeted
await screen.pressButton('HOME');
await screen.goBack(); // Android-specific shorthand for the BACK button
await screen.gesture(/* multi-touch paths with precise timing control */);
```

**The genuinely useful distinguishing question:** does what you're testing have a locatable element at all? A hardware volume button, the OS-level home button, a coordinate-based interaction on a canvas-drawn game or map with no accessible element structure underneath — none of these have a `Locator` that could resolve to them, because they're not part of the app's own UI hierarchy at all. Locator actions are the default for anything that *is* part of your app's UI; screen actions exist for everything that isn't.

`pressButton()`'s full set — `HOME`, `BACK`, `POWER`, `VOLUME_UP`/`VOLUME_DOWN`, `ENTER`, `DPAD_*` variants, `APP_SWITCH`, `LOCK` — covers hardware/OS-level interaction that has no equivalent concept in Playwright's browser-automation world at all; a browser tab doesn't have a physical volume rocker.

---

## Real-World Problem — Testing a Swipeable Card Stack (No Manual Event Math Required)

```typescript
test('swiping a card left rejects it, right accepts it', async ({ screen }) => {
  const firstCard = screen.getByTestId('card-stack').getByRole('listitem').first();

  await firstCard.swipe({ direction: 'left' });
  await expect(screen.getByText('Rejected')).toBeVisible();

  const nextCard = screen.getByTestId('card-stack').getByRole('listitem').first();
  await nextCard.swipe({ direction: 'right' });
  await expect(screen.getByText('Accepted')).toBeVisible();
});
```

Compare this directly against the equivalent from [Playwright_Mobile_TypeScript's Level 4](../Playwright_Mobile_TypeScript/Level_04_Touch_and_Gesture_Interactions.md#concept-1--swipe-built-as-a-reusable-function) — a ~15-line `swipe()` utility function computing intermediate touch points by hand. Here, `.swipe({ direction: 'left' })` is a single call. This isn't a criticism of the Playwright track's approach (it teaches the underlying mechanism, which matters for understanding *why* gestures work) — it's the direct payoff of a framework whose actions API was purpose-built for exactly this use case from the start.

---

## Solution — `gesture()` for What Named Methods Can't Express

Named methods (`swipe`, `longPress`, `doubleTap`) cover the common cases. A genuinely custom multi-touch interaction — a specific pinch angle, a three-finger gesture, precise per-point timing — needs the lower-level `gesture()` API:

```typescript
// A conceptual pinch-to-zoom using gesture()'s multi-touch path control —
// exact parameter shape depends on Mobilewright's current gesture() signature;
// the POINT worth internalizing is that this exists as an escape hatch,
// the same relationship raw touch-event dispatch has to Playwright's
// higher-level swipe() utility in the other track
await screen.gesture([
  { points: [{ x: 150, y: 400 }, { x: 250, y: 400 }], duration: 300 }, // two fingers converging
]);
```

This mirrors [Playwright_Mobile_TypeScript's own pinch implementation](../Playwright_Mobile_TypeScript/Level_04_Touch_and_Gesture_Interactions.md#real-world-problem--pinch-to-zoom-the-hardest-gesture-in-this-toolkit) conceptually — two simultaneous points, converging or diverging distance — just expressed through Mobilewright's native gesture primitive instead of hand-dispatched `touchmove` events. The lesson worth carrying between both tracks: **every mobile testing framework eventually needs an escape hatch for gestures too specific for named convenience methods to cover** — knowing that escape hatch exists, in whichever framework you're using, matters more than memorizing any one framework's exact syntax for it.

---

## Challenges

### 🐛 Bug Hunt — The Swipe That Swipes the Wrong Thing

```typescript
test('swiping the top card away reveals the next one', async ({ screen }) => {
  await screen.swipe('left'); // swipes here, not on the card
  await expect(screen.getByText('Card 2')).toBeVisible();
});
```

The test intends to swipe a specific card away. It sometimes works, sometimes doesn't — depending on where else on screen the "swipe" coordinates happen to land. Using [this level's own Concept section](#concept--screen-level-actions-when-theres-no-element-to-resolve), diagnose the actual mistake.

<details><summary>Diagnosis & Fix</summary>

🔴 **Explanation:** `screen.swipe('left')` is a **screen-level** action — it swipes at whatever default/center coordinates the framework picks, with no awareness of the card stack's actual position on screen. If the card stack happens to occupy most of the visible screen, this might accidentally work; if there's a header, a bottom nav bar, or the card is only part of the screen, the swipe can miss it entirely or hit a different interactive element underneath. The fix uses the **locator-scoped** version instead, exactly [this level's Real-World Problem example](#real-world-problem--testing-a-swipeable-card-stack-no-manual-event-math-required):

```typescript
await screen.getByTestId('card-stack').getByRole('listitem').first().swipe({ direction: 'left' });
```

The general rule this reinforces: **default to locator-scoped actions whenever there's a genuine element to scope to** — screen-level coordinate/direction actions should be reserved for cases with no locatable target at all, not used as a shortcut when a proper locator was available.

</details>

---

### 🎭 Two Truths and a Lie — Actions API Boundaries

**A.** `longPress()` accepts an optional duration parameter; omitting it uses a sensible default rather than requiring you to specify an exact millisecond value every time.

**B.** `pressButton('BACK')` and `goBack()` are functionally identical on Android — `goBack()` is purely a more readable alias.

**C.** `gesture()` can express any interaction the named convenience methods (`tap`, `swipe`, `longPress`) can also express — the named methods exist purely as documentation-friendly shortcuts with zero functional difference underneath.

<details><summary>Which one's the lie</summary>

**C is the lie**, or at least an overclaim worth being skeptical of — while `gesture()`'s lower-level multi-touch path API can likely express everything the named convenience methods do (since they're presumably built on the same underlying primitive), treating this as a proven, documented fact rather than a reasonable inference is the actual mistake. The named methods exist because most tests don't need `gesture()`'s full generality, and reaching for `gesture()` by default when a named method already covers your case adds unnecessary verbosity and risk of getting the raw point/timing math wrong — the same "don't reach for the escape hatch when the common-case tool already fits" discipline as [Level 2's `getByType` guidance](Level_02_Cross_Platform_Locators.md#real-world-problem--the-custom-component-with-no-role-mapping).

🔴 **Explanation:** A and B are both true and both practically useful — A means `longPress()` works correctly with zero configuration for the common case, only needing a duration override for a genuinely non-standard threshold. B is true per [this level's own actions list](#basics--a-genuinely-richer-gesture-api-than-plain-playwright) — `goBack()` is explicitly documented as an Android-specific shorthand, existing purely for readability over the equivalent `pressButton('BACK')` call.

</details>

---

**Next → [Level 4: Auto-Waiting & Assertions](Level_04_Auto_Waiting_and_Assertions.md)**
