# Widget Catalog Challenges

### Companion to [DOC_02: Widget Catalog Complete](DOC_02_Widget_Catalog_Complete.md)

---

## How This Works

A catalog isn't a mechanism doc — the skill it builds is **judgment**: reaching for the right widget without reinventing something that already exists, and not reaching for a heavier tool than the job needs. Mixed formats — see [the full challenge-type roster](../00_CHALLENGE_TYPES.md) for what each icon means.

---

### 🏗️ Build It Blind — Widget Selection From a Verbal Spec

No code, no hints toward specific widget names. For each, name the widget (or combination) you'd reach for, from this catalog's 11 categories — then check against the reasoning below.

1. A row of category chips that wraps to a second line when there are too many to fit on one row, rather than overflowing or scrolling horizontally.
2. A settings screen where tapping "Delete Account" needs a confirmation before anything happens.
3. A profile avatar that shows a shimmer placeholder while the image loads, then crossfades to the real photo once it's ready.
4. A list of exactly 4 fixed action buttons at the bottom of a screen, evenly spaced, that never scrolls.
5. A search results screen that needs to show a spinner while loading, an error message on failure, and the actual list on success — driven by a `Future`.

<details><summary>Reasoning</summary>

1. **`Wrap`**, not `Row` — `Row` overflows past screen width with no wrapping behavior; `Wrap` is specifically the layout widget (category 1) that flows children onto new lines when they don't fit, which is exactly "wraps to a second line" in the spec.
2. **`showDialog` with an `AlertDialog`** — the overlay/modal category (category 7) exists precisely for "interrupt the user, force an explicit choice before continuing" flows; a confirmation before a destructive action is the textbook use case.
3. **`Image` combined with an animation widget (category 8)** — most naturally `AnimatedSwitcher` or a fade-in wrapper around the loaded image, layered over a shimmer placeholder shown while `loading`. The "crossfades" requirement specifically points at the animation category, not just the image category alone — a plain `Image.network` with no wrapper just pops in abruptly.
4. **`Row` with `MainAxisAlignment.spaceEvenly`** (or `spaceAround`), not `ListView` — this is a **fixed, small, non-scrolling** count of items, which is exactly the layout-widget case from category 1, not the scrolling-widget case from category 4. Reaching for `ListView` here works but is over-engineered — a real instance of using a heavier tool than the job needs.
5. **`FutureBuilder`** (category 10, async/data-driven widgets) — the spec's three states (loading/error/success) driven by a single `Future` is precisely what `FutureBuilder`'s `snapshot.connectionState` and `snapshot.hasError` branches exist for, matching [DOC_06's FutureBuilder content](DOC_06_Async_Patterns_Complete.md).

🔴 **Explanation:** #1 and #4 are the pair worth remembering together — they look superficially similar ("a horizontal-ish arrangement of small items") but need opposite widgets, because the actual distinguishing question is never "how many items" but **"is this content or is this scrollable content — does it need to overflow onto a new axis, or never grow past what's visible?"**

</details>

---

### 🎭 Two Truths and a Lie — Specific Widget Behaviors

**A.** `IndexedStack` lays out and keeps mounted **all** of its children simultaneously, only painting the one at `index` — the same mechanism [Week 5's tab-switching challenge](../Phase_1_Dart_and_Foundations/Week_05b_Navigation_Challenges.md#w5-2-medium--indexedstack-vs-naive-tab-switching-lose-state-then-dont) uses to preserve state across tab switches.

**B.** `AnimatedSwitcher` requires every child it switches between to have a **unique `Key`**, or it may fail to detect that the child actually changed and skip the transition animation.

**C.** `SingleChildScrollView` wrapping a `Column` is functionally interchangeable with `ListView` for any list of items, since both ultimately produce a scrollable column of widgets.

<details><summary>Which one's the lie</summary>

**C is the lie**, and it's the single most common "works until it doesn't" widget mistake in this catalog. `SingleChildScrollView(child: Column(children: [...]))` builds **every single child eagerly**, all at once, regardless of what's actually visible — there's no lazy building at all, because `Column` isn't a viewport-aware sliver-based widget the way `ListView` is (see [Week 7's proof that `ListView.builder` is lazy](../Phase_2_Core_UI/Week_07b_Scrolling_Challenges.md#w7-1-easy--prove-listviewbuilder-is-actually-lazy)). For a handful of fixed items, this is completely fine and arguably simpler than `ListView`. For a list that could grow to hundreds or thousands of items (a chat history, a product catalog), it silently becomes the exact eager-build performance trap that file's own T7-1 challenge demonstrates.

🔴 **Explanation:** A and B are both true and both worth knowing precisely — A is the direct mechanism behind why `IndexedStack` costs more memory than a naive show/hide (every child stays alive), the trade-off already discussed in the Week 5 content this references. B matters because without distinct keys, `AnimatedSwitcher` compares old/new children by type-and-position (the same reconciliation rule from [Week 2](../Phase_1_Dart_and_Foundations/Week_02b_Widget_Rebuild_Challenges.md#w2-4-hard-bonus--implement-flutters-own-reconciliation-rule)) — two `Text` widgets in a row, even with different string content, can look like "the same widget, just updated" rather than "a genuinely new child," and the transition silently doesn't fire.

</details>

---

### 🕵️ Code Review — Is `ListView` Actually Needed Here?

```dart
class ActionBar extends StatelessWidget {
  const ActionBar({super.key});
  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 60,
      child: ListView(
        scrollDirection: Axis.horizontal,
        children: const [
          _ActionButton(icon: Icons.share, label: 'Share'),
          _ActionButton(icon: Icons.favorite, label: 'Save'),
          _ActionButton(icon: Icons.print, label: 'Print'),
        ],
      ),
      // 💬 Reviewer: "why ListView for 3 fixed buttons that always fit
      //    on screen? Is this meant to scroll, or did we just default
      //    to ListView out of habit?"
    );
  }
}
```

The reviewer's question is genuine — answer it by reasoning about the actual content, not by guessing what "feels" idiomatic.

<details><summary>What the reviewer is pointing at</summary>

🔴 **Explanation:** for exactly 3 fixed action buttons that always fit within the available width, `ListView` provides zero benefit — there's nothing to scroll, and `ListView`'s scrolling machinery (a `Scrollable`, gesture recognizers for drag, a viewport) is pure overhead here, doing work that a plain `Row` doesn't need to do at all. The honest answer to the reviewer: this was very likely defaulted to out of habit — "a horizontal strip of things" pattern-matches to `ListView` for a lot of developers regardless of whether scrolling is actually needed. The fix, matching #4 from the Build It Blind above:

```dart
Row(
  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
  children: const [
    _ActionButton(icon: Icons.share, label: 'Share'),
    _ActionButton(icon: Icons.favorite, label: 'Save'),
    _ActionButton(icon: Icons.print, label: 'Print'),
  ],
)
```

The one case where the reviewer's question would have a different answer: if this action bar needs to support an **arbitrary, possibly-larger** number of actions in the future (a plugin system, user-configurable toolbar) — then `ListView` genuinely earns its place *now*, in anticipation of content that might not always fit. The lesson isn't "`ListView` is wrong here," it's "the choice should follow from whether the content can actually overflow, not from what shape the content vaguely resembles."

</details>

---

### ⚡ Speed Round — 5 Widget Choices, 2 Minutes

For each, name the single most appropriate widget or combination from this catalog.

1. A grid of product photos, 2 per row, that needs to lazily build as the user scrolls through hundreds of products.
2. A button that shows a spinner in place of its label while an async action is in progress, and is unclickable during that time.
3. A text field that shows a red border and helper text the instant validation fails, live as the user types.
4. A floating "scroll to top" button that fades in only after scrolling past a certain point.
5. A screen transition where a tapped list-item's image visually flies into the detail screen's larger image.

<details><summary>Answers</summary>

1. **`GridView.builder`** with `SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 2)` — the scrolling-widgets category, lazy by construction, same lazy-building mechanism as `ListView.builder`.
2. **`ElevatedButton`** with `onPressed: isLoading ? null : _submit` and the child conditionally swapped for a `CircularProgressIndicator` — `onPressed: null` is what makes a Material button widget visually and functionally disabled.
3. **`TextFormField`** with a `validator:` and `autovalidateMode: AutovalidateMode.onUserInteraction` — live validation feedback as the user types, from the input-widgets category, matching [Week 8's core content](../Phase_2_Core_UI/Week_08_Forms_and_Input.md).
4. **`AnimatedOpacity`** (or `AnimatedSwitcher`) wrapping a `FloatingActionButton`, toggled by a `ScrollController` listener — the exact shape of [Week 7's scroll-to-top Bug Hunt](../Phase_2_Core_UI/Week_07b_Scrolling_Challenges.md#-bug-hunt--the-scroll-to-top-button-that-never-appears).
5. **`Hero`** — the shared-element-transition widget from the animation category, matching [Week 9's core content](../Phase_2_Core_UI/Week_09_Animations.md) and [its Hero tag-mismatch Bug Hunt](../Phase_2_Core_UI/Week_09b_Animation_Challenges.md#w9-3-medium--reproduce-and-fix-the-hero-tag-mismatch).

</details>

---

**Next → [DOC_03: Material 3 Theming](DOC_03_Material3_Theming.md) · [Theming Challenges](DOC_03b_Material3_Theming_Challenges.md)**
