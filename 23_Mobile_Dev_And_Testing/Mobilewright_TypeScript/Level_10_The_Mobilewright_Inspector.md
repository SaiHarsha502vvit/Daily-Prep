# Level 10 — The Mobilewright Inspector

### Companion track: [Mobilewright Native Testing with TypeScript](00_ROADMAP.md) · Previous: [Level 9](Level_09_Screenshots_and_Missing_Visual_Regression.md)

---

## Basics — What `npx mobilewright inspect` Actually Shows You

```bash
npx mobilewright inspect
# starts a local server on port 4621, opens a live view of the
# connected device's current screen with its accessibility/view tree overlaid
```

This is the tool that makes [Level 2's locator priority hierarchy](Level_02_Cross_Platform_Locators.md#concept--the-locator-priority-hierarchy-and-why-the-inspector-enforces-it) something you can *verify* rather than just apply from memory — for any element tapped in the Inspector's live view, it shows the actual `testID`, `role`, `label`, and `text` values Mobilewright would use to locate it, in the same **testID > role > label > text** priority order this track has followed since Level 2.

---

## Concept — The "dup" Badge: Catching Ambiguity Before It Becomes Flakiness

The single most practically useful Inspector feature: when a locator you're inspecting would match **more than one element** on the current screen, the Inspector flags it with a duplicate ("dup") indicator — surfacing the exact ambiguity [Level 2's own Bug Hunt](Level_02_Cross_Platform_Locators.md#-bug-hunt--the-locator-that-works-on-one-platform-not-the-other) had to be diagnosed after the fact, *before* it ever reaches a test run at all.

```
Inspector view for a tapped element:
  role:  textfield
  label: (none)
  text:  (none)
  ⚠ dup — 2 elements on this screen match role="textfield"
```

Seeing this warning at authoring time changes the whole workflow: instead of writing `getByRole('textfield')`, running the test, watching it fail or behave ambiguously, then debugging backward to find out why — the Inspector tells you upfront that this exact locator won't be unique, before a single line of test code is written.

---

## Real-World Problem — Choosing a Locator for an Element With No Obvious Testid

Working through a real, unfamiliar screen with the Inspector open:

1. Tap the target element in the Inspector's live view.
2. Read the reported `testID` first — if present, that's the answer, full stop, per [Level 2's priority hierarchy](Level_02_Cross_Platform_Locators.md#concept--the-locator-priority-hierarchy-and-why-the-inspector-enforces-it).
3. If no `testID`, check the `role`/`name` combination — and check the "dup" badge specifically for that combination, not just the bare role.
4. If `role` alone is ambiguous, check whether adding `{ name: '...' }` (matching against the label or visible text) resolves the ambiguity — the Inspector's live matching updates as you refine, showing whether the dup warning clears.
5. Only fall back toward `getByLabel` or `getByType` if nothing above resolves cleanly — exactly [Level 2's fallback chain](Level_02_Cross_Platform_Locators.md#real-world-problem--the-custom-component-with-no-role-mapping), now confirmed empirically instead of assumed.

---

## Solution — Inspector-Driven Locator Choice, End to End

```typescript
// Before: guessed from reading the screen visually
await screen.getByRole('button').tap(); // Inspector shows: ⚠ dup — 3 buttons match

// After: Inspector confirms name-scoping resolves the ambiguity completely
await screen.getByRole('button', { name: 'Add to Cart' }).tap(); // Inspector: no dup, unique match
```

The Inspector doesn't replace understanding the priority hierarchy — it verifies your application of it against the *actual current screen*, which is strictly more reliable than reasoning about a screen's structure from a screenshot or from reading source code alone, since the Inspector reflects exactly what the platform's real accessibility tree reports at runtime, including any auto-generated or dynamic attributes that wouldn't be obvious from static source.

---

## Challenges

### 🐛 Bug Hunt — Ignoring a Dup Warning

A developer building a test sees this in the Inspector while picking a locator for a "Remove" button inside a shopping cart's list of items:

```
role:  button
name:  Remove
⚠ dup — 4 elements on this screen match role="button", name="Remove"
```

They write `screen.getByRole('button', { name: 'Remove' }).tap()` anyway, reasoning "it'll just hit the first one, that's probably fine." The test passes locally, then fails intermittently once the cart has items in a different order in CI. Using [this level's own Concept section](#concept--the-dup-badge-catching-ambiguity-before-it-becomes-flakiness), explain the actual failure mode.

<details><summary>Diagnosis & Fix</summary>

🔴 **Explanation:** an ambiguous locator matching multiple elements doesn't reliably resolve to "the first one" in a way a test author can depend on — depending on the underlying strict-mode behavior (following [Level 2's own note](Level_02_Cross_Platform_Locators.md#-bug-hunt--the-locator-that-works-on-one-platform-not-the-other) that Mobilewright follows Playwright's strict-mode philosophy), an ambiguous match may throw outright, or may resolve inconsistently based on rendering/DOM-order timing that varies between runs — exactly the kind of thing that "passes locally, fails intermittently in CI" describes. The dup badge was a direct, pre-emptive warning of this exact failure mode, dismissed as "probably fine" instead of acted on. The fix scopes to the specific cart item, the same list-scoping pattern from [Level 2's Solution section](Level_02_Cross_Platform_Locators.md#solution--locators-compose-the-same-way-across-both-tracks):

```typescript
await screen
  .getByRole('listitem')
  .filter({ hasText: 'iPhone 15' })
  .getByRole('button', { name: 'Remove' })
  .tap();
```

The general lesson: **a dup warning in the Inspector is a test-flakiness bug report arriving before the test exists** — treating it as advisory rather than actionable defeats the entire point of the tool.

</details>

---

### 🎭 Two Truths and a Lie — Inspector Mechanics

**A.** The Inspector reflects the actual live accessibility/view tree of the connected device — not a static analysis of the app's source code.

**B.** The Inspector's dup warning disappears automatically once a locator is scoped with `{ name: '...' }`, regardless of whether that name value actually resolves the ambiguity.

**C.** Running `npx mobilewright inspect` requires an already-connected device or running emulator/simulator — it can't operate against source code alone.

<details><summary>Which one's the lie</summary>

**B is the lie.** The dup warning tracks actual match count against the live screen — adding `{ name: '...' }` only clears the warning if that specific name value genuinely narrows the match down to one element; scoping with a name that still matches multiple elements (say, two buttons that coincidentally share the same accessible name) would keep the dup warning showing, exactly as it should, since the ambiguity would still be real.

🔴 **Explanation:** A is true and is the entire reason the Inspector is more reliable than reasoning from source or a screenshot — it's reporting the platform's actual runtime accessibility tree, which can include dynamically-generated content, computed labels, or platform-injected accessibility metadata that wouldn't be visible any other way. C is true and follows directly from A — there's no live tree to inspect without a live, connected device to query.

</details>

---

**Next → [Level 11: The WebView Bridge, Full Depth](Level_11_The_WebView_Bridge_Full_Depth.md)**
