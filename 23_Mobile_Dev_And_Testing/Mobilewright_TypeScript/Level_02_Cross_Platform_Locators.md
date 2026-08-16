# Level 2 — Cross-Platform Locators

### Companion track: [Mobilewright Native Testing with TypeScript](00_ROADMAP.md) · Previous: [Level 1](Level_01_Setup_and_First_Native_Test.md)

---

## Basics — What `getByRole` Actually Normalizes

[06_Mobilewright_Native_Testing.md](../06_Mobilewright_Native_Testing.md) already stated the headline fact: one `getByRole('textfield')` call matches Android's `EditText` **and** iOS's `TextField`. This level is about the mechanism underneath that, and what happens when it doesn't apply.

```typescript
// Mobilewright strips platform prefixes before matching against a role table:
//   android.widget.EditText        -> "EditText"     -> normalized -> "textfield"
//   androidx.appcompat.widget.*    -> stripped similarly
//   XCUIElementType.TextField      -> "TextField"     -> normalized -> "textfield"
await screen.getByRole('textfield').fill('user@example.com');
await screen.getByRole('button', { name: 'Sign In' }).tap();
await screen.getByRole('checkbox').tap();
```

The practical consequence worth internalizing: **`getByRole` is not calling the native class name directly** — it's running the raw native type through a normalization step first, then matching the *result* against a role table. That's what makes the same test code portable across two completely different native widget hierarchies.

---

## Concept — The Locator Priority Hierarchy, and Why the Inspector Enforces It

[06's own locator content](../06_Mobilewright_Native_Testing.md#locators--cross-platform-role-normalization) listed four methods; [Level 10's Inspector coverage](Level_10_The_Mobilewright_Inspector.md) reveals the actual priority order Mobilewright's own tooling recommends: **testID > role > label > text**. Worth understanding *why* this specific order, not just memorizing it:

```typescript
// Priority 1 — testID: most resilient, zero ambiguity, but requires the
// app's developers to have added one deliberately
await screen.getByTestId('login-submit-button').tap();

// Priority 2 — role: semantic, survives most UI refactors, but only works
// for elements with a mapped native type
await screen.getByRole('button', { name: 'Sign In' }).tap();

// Priority 3 — label: works for anything with an accessibility label,
// but labels sometimes get changed for genuine UX/copy reasons, not
// just structural refactors — slightly less stable than role
await screen.getByLabel('Sign In Button').tap();

// Priority 4 — text (via role+name, or a raw text match): the most
// fragile — literal visible copy changes far more often than either
// a role or a deliberately-set accessibility identifier
```

**The priority order tracks *what's likely to change* for reasons that have nothing to do with the test.** A testID is deliberately, permanently assigned for testing purposes — changing it is a conscious decision. A role is structural — it changes only if the underlying widget type changes entirely (a `Button` becoming a custom-drawn view). Visible text changes constantly — a copy edit, a localization pass, an A/B test — none of which should break a test that's actually verifying behavior, not wording.

---

## Real-World Problem — The Custom Component With No Role Mapping

```typescript
test('rating widget shows current selection', async ({ screen }) => {
  // A custom-drawn 5-star rating widget — no standard role applies
  await screen.getByRole('button', { name: '5 stars' }).tap(); // fails — no role mapping exists
});
```

Per [06's own quoted limitation](../06_Mobilewright_Native_Testing.md#locators--cross-platform-role-normalization): *"Anything not listed has no role mapping — `getByRole()` won't find it."* The fallback chain, applied in the priority order this level just established:

```typescript
// Best fix: ask for a testID to be added — the PERMANENT, correct solution
await screen.getByTestId('rating-star-5').tap();

// If that's not available yet: getByLabel, if the widget has an
// accessibility label at all
await screen.getByLabel('5 stars').tap();

// Last resort: getByType, the raw native class name, zero normalization,
// zero semantic meaning, brittle if the component is ever refactored
// to a different underlying widget class
await screen.getByType('RatingStarView').nth(4).tap();
```

`getByType` sits deliberately outside the priority hierarchy — it's not "priority 5," it's an escape hatch for when nothing else applies at all, and every level of the priority hierarchy above it is meant to be attempted first, in order, before reaching for it.

---

## Solution — Locators Compose the Same Way Across Both Tracks

Nothing about `.filter()`-style scoping or chaining is unique to Mobilewright — the same compositional thinking from [Playwright_Mobile_TypeScript's Level 2](../Playwright_Mobile_TypeScript/Level_02_Locators_and_Assertions.md) applies:

```typescript
// Scope to a specific list item, THEN find the button inside it —
// avoids ambiguity when multiple "Add to Cart" buttons exist on screen
await screen
  .getByRole('listitem')
  .filter({ hasText: 'iPhone 15' })
  .getByRole('button', { name: 'Add to Cart' })
  .tap();
```

The underlying mechanics differ (native accessibility-tree traversal here, DOM traversal there), but the *reasoning* — scope broadly first, narrow to what you actually want, don't rely on positional `.nth()` when a content-based filter is available — transfers directly. This is deliberate: Mobilewright borrowed Playwright's API design specifically so this transfer would work.

---

## Challenges

### 🐛 Bug Hunt — The Locator That Works on One Platform, Not the Other

```typescript
test.use({ platform: 'android' });
test('submits the form', async ({ screen }) => {
  await screen.getByRole('textfield').fill('test@example.com'); // works
});
```

```typescript
test.use({ platform: 'ios' });
test('submits the form', async ({ screen }) => {
  await screen.getByRole('textfield').fill('test@example.com'); // times out, element not found
});
```

Same test body, same app's login screen, only the platform differs. Before assuming the iOS app is genuinely broken, what's the most likely test-side explanation, using [this level's own basics section](#basics--what-getbyrole-actually-normalizes)?

<details><summary>Diagnosis</summary>

🔴 **Explanation:** the most likely explanation isn't a bug in the app at all — it's that the iOS screen has **more than one** text field (email and password, say), and `getByRole('textfield')` with no further scoping matches ambiguously, which Mobilewright (following Playwright's own strict-mode philosophy) would refuse to resolve automatically. The Android side "working" might itself be a coincidence of there only being one text field visible at that exact moment, or the Android layout genuinely differing in a way that makes the locator unambiguous there specifically. The fix applies [this level's own priority hierarchy](#concept--the-locator-priority-hierarchy-and-why-the-inspector-enforces-it) — don't rely on an unscoped role match when multiple elements share that role:

```typescript
await screen.getByRole('textfield', { name: 'Email' }).fill('test@example.com');
// or, if labels aren't reliable yet:
await screen.getByTestId('email-input').fill('test@example.com');
```

The lesson worth taking forward: **a locator that "just works" with no scoping is often working by accident, not by design** — the moment a screen has two elements sharing a role, the accident stops holding, and it's better to scope deliberately from the start than to discover the ambiguity via a platform-specific failure.

</details>

---

### 🏗️ Build It Blind — Choose Locators for a Real Settings Screen

No code, no hints toward specific methods. For each element, using [this level's priority hierarchy](#concept--the-locator-priority-hierarchy-and-why-the-inspector-enforces-it), decide which locator method you'd reach for **first**, and what you'd fall back to if that's not available.

1. A "Log Out" button with standard native button styling and visible text "Log Out."
2. A custom-drawn toggle switch component with no accessibility label set (a real, common gap in early-stage apps).
3. A small icon-only button (no visible text) that opens account settings, with a `contentDescription`/accessibility label of "Account Settings."
4. A list of 20 dynamically-loaded notification preference rows, each needing to be individually toggleable in a test.

<details><summary>Reasoning</summary>

1. **`getByRole('button', { name: 'Log Out' })`** — a standard button with clear visible text is exactly the role-based happy path; no need to reach further down the hierarchy.
2. **`getByType(...)`, as a last resort, with a note to request a testID.** No label, no standard role (a custom-drawn toggle likely has no native mapping) — this is precisely the gap [this level's Real-World Problem section](#real-world-problem--the-custom-component-with-no-role-mapping) covers; the *correct* long-term fix is asking for a testID, but a test needs to ship today, so `getByType` is the honest interim answer.
3. **`getByLabel('Account Settings')`** — no visible text to match on, but a real accessibility label exists; this is the exact scenario `getByLabel` is for, and it's also the *correct* production choice since a real user relying on a screen reader needs that label too — testability and accessibility point at the same fix here.
4. **`getByTestId`, scoped per-row** — with 20 dynamically-loaded rows, relying on `getByRole` or `getByLabel` risks ambiguous matches across rows with similar structure; a testID incorporating each row's identifier (`getByTestId('notif-pref-marketing')`) avoids both ambiguity and positional fragility (`.nth(i)` breaking if the list ever reorders).

🔴 **Explanation:** notice that the "right" answer for #2 isn't really `getByType` — it's *flagging the gap* and requesting a testID, with `getByType` as the pragmatic stopgap. Recognizing when a locator choice reflects "the app isn't testable enough yet" rather than "I made the wrong technical choice" is itself part of this skill — sometimes the correct next action is a conversation with the app's developers, not a cleverer locator.

</details>

---

**Next → [Level 3: Actions — Locator vs Screen-Level](Level_03_Actions_Locator_vs_Screen_Level.md)**
