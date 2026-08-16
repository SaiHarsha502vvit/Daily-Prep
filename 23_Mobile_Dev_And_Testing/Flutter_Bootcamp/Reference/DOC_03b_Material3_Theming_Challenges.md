# Material 3 Theming Challenges

### Companion to [DOC_03: Material 3 Theming](DOC_03_Material3_Theming.md)

---

## How This Works

The whole point of color *roles* over hardcoded colors is invisible until dark mode is actually toggled — so several of these ask you to trace what happens in both modes, not just one. Mixed formats — see [the full challenge-type roster](../00_CHALLENGE_TYPES.md) for what each icon means.

---

### 🐛 Bug Hunt — Looks Fine in Light Mode, Wrong Everywhere Else

```dart
class PromoBanner extends StatelessWidget {
  const PromoBanner({super.key});
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      color: Colors.blue.shade50, // a soft, light blue background
      child: const Text(
        'Free shipping this week!',
        style: TextStyle(color: Colors.black87), // dark text on the light background
      ),
    );
  }
}
```

Ships, looks fine — soft blue background, readable dark text. Weeks later, dark mode support is added to the app via `MaterialApp(theme: lightTheme, darkTheme: darkTheme)`. Every other screen adapts correctly. This banner does not. Describe exactly what a user sees when they're in dark mode, and why merely "the app supports dark mode now" didn't fix it.

<details><summary>Diagnosis & Fix</summary>

🔴 **Explanation:** `Colors.blue.shade50` and `Colors.black87` are **hardcoded, absolute colors** — they have no relationship to the active `ThemeData` at all, light or dark. In dark mode, every other widget correctly picks up dark-appropriate colors because it's reading `Theme.of(context).colorScheme.*`, which genuinely resolves differently depending on which `ThemeData` is currently active. This banner never asks the theme anything — it always paints the exact same pale-blue-with-dark-text combination, which in a dark-mode context now sits as a jarring, low-contrast-with-its-surroundings light rectangle in the middle of an otherwise dark screen, exactly the anti-pattern this doc's own content already names directly. The fix routes through color roles instead:

```dart
class PromoBanner extends StatelessWidget {
  const PromoBanner({super.key});
  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.all(16),
      color: cs.secondaryContainer, // adapts: light tint in light mode, dark tint in dark mode
      child: Text(
        'Free shipping this week!',
        style: TextStyle(color: cs.onSecondaryContainer), // always correctly contrasts
      ),
    );
  }
}
```

`secondaryContainer`/`onSecondaryContainer` is a genuinely appropriate role pairing here — the doc's own color role list names `secondaryContainer` for "chip labels, toggles," and a promotional banner is the same shape of UI: a colored container with a guaranteed-readable label on top, that should look intentional in *either* mode, not just the one it was designed against.

</details>

---

### 🎭 Two Truths and a Lie — Color Role Semantics

**A.** `primary` and `primaryContainer` are meant for different *emphasis levels* of the same brand color — `primary` for the loudest, most attention-grabbing elements (a filled button), `primaryContainer` for a visually quieter version (a selected chip's background).

**B.** `surface` and `surfaceVariant` are two names for the same value — Material 3 just provides both for convenience, and it doesn't matter which one you pick.

**C.** Any `onX` role (`onPrimary`, `onSurface`, `onErrorContainer`, etc.) is guaranteed by Material 3's color system to have sufficient contrast against its corresponding `X` role, specifically so you never have to manually check "is this text readable on this background."

<details><summary>Which one's the lie</summary>

**B is the lie.** `surface` and `surfaceVariant` (or the newer `surfaceContainer*` roles this doc lists) are **distinct values**, deliberately — `surface` is the doc's own "main screen background," while `surfaceVariant`/`surfaceContainer*` roles exist specifically to create *visual separation* between stacked surfaces at different elevations (a card sitting on top of a screen background needs a subtly different tone than the screen itself, or it visually merges into it with no boundary at all). Treating them as interchangeable defeats the entire purpose of having more than one surface role — you'd lose the visual layering Material 3's elevation system depends on.

🔴 **Explanation:** A and C are both true and both worth internalizing as a mental model, not just a naming convention — A is the actual design intent behind every `X`/`XContainer` pair in this doc's color role list (not just primary — secondary, tertiary, and error all follow the identical loud/quiet pattern). C is the entire reason the `onX` naming convention exists at all: it turns "will white text be readable on this shade of blue" from a manual judgment call into "just always pair `X` with `onX`," which is precisely why the doc's own "Correct" examples always set both a background color role and its matching `onX` foreground role together, never one without the other.

</details>

---

### 🔬 Diff Detective — Two Ways to Read a Theme

Both compile. Both display *a* button style. They don't always agree with each other.

```dart
// Version A
Widget build(BuildContext context) {
  final cs = Theme.of(context).colorScheme;
  return ElevatedButton(
    style: ElevatedButton.styleFrom(backgroundColor: cs.primary),
    onPressed: () {},
    child: const Text('Confirm'),
  );
}
```

```dart
// Version B
Widget build(BuildContext context) {
  return Theme(
    data: Theme.of(context).copyWith(
      colorScheme: Theme.of(context).colorScheme.copyWith(primary: Colors.deepOrange),
    ),
    child: Builder(
      builder: (innerContext) {
        final cs = Theme.of(innerContext).colorScheme;
        return ElevatedButton(
          style: ElevatedButton.styleFrom(backgroundColor: cs.primary),
          onPressed: () {},
          child: const Text('Confirm'),
        );
      },
    ),
  );
}
```

Both buttons read `colorScheme.primary`. They render different colors. Why — and specifically, why does Version B need that inner `Builder` at all?

<details><summary>The actual difference</summary>

🔴 **Explanation:** `Theme.of(context)` doesn't read "the app's theme" as some global singleton — it walks up from `context` (per [DOC_04's walk-up algorithm](DOC_04_BuildContext_Deep_Dive.md)) to find the **nearest** `Theme` widget in the tree above that specific context. Version A's `context` sits above any local override, so it resolves to the app-level `ThemeData`. Version B wraps a **local** `Theme` widget with `primary: Colors.deepOrange` overriding just that one role — but the outer `context` (the parameter to the enclosing `build` method) is positioned *above* this new `Theme` widget, not below it, so calling `Theme.of(context)` with the *outer* context would still find the app-level theme, missing the override entirely. The inner `Builder` provides a genuinely new context positioned *inside* the local `Theme` override — [DOC_04's own content on `Builder` as a context anchor](DOC_04_BuildContext_Deep_Dive.md#builder-widget--the-context-injector) — and only `Theme.of(innerContext)` correctly picks up `deepOrange`. This is a real, common source of "I overrode the theme locally and it's not taking effect" confusion — the override widget itself was placed correctly, but the code reading it afterward used a context positioned on the wrong side of it.

</details>

---

### 👹 Boss Battle — A Fully Token-Driven Alert Banner Component

**The spec:** build a reusable `AlertBanner` widget with three variants — `info`, `warning`, `error` — where every color, text style, and spacing value comes from the theme (color roles + typography scale + this doc's spacing-constants pattern), with **zero** hardcoded values anywhere in the widget. Each variant should look visually distinct and semantically correct in *both* light and dark mode without you writing any mode-specific branching — the color roles should do that work automatically.

<details><summary>One reasonable solution</summary>

```dart
enum AlertVariant { info, warning, error }

class AlertBanner extends StatelessWidget {
  const AlertBanner({super.key, required this.message, required this.variant});
  final String message;
  final AlertVariant variant;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    final (background, foreground) = switch (variant) {
      AlertVariant.info => (cs.secondaryContainer, cs.onSecondaryContainer),
      AlertVariant.warning => (cs.tertiaryContainer, cs.onTertiaryContainer),
      AlertVariant.error => (cs.errorContainer, cs.onErrorContainer),
    };

    return Container(
      padding: const EdgeInsets.all(AppSpacing.md), // this doc's spacing-token pattern
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(message, style: textTheme.bodyMedium?.copyWith(color: foreground)),
    );
  }
}
```

🔴 **Explanation:** the record-returning `switch` expression — `(Color, Color)` per variant — is [T3-2's records lesson](../Phase_1_Dart_and_Foundations/Week_01b_Dart_Coding_Challenges.md#t3-2-easy--records-for-multi-value-return) doing real work here: each `AlertVariant` needs exactly one background/foreground *pair*, and a record keeps that pairing atomic rather than risking a background from one role accidentally combined with a foreground from another (a real, easy-to-introduce bug with two separate `switch` statements instead of one). Every single color comes from `colorScheme`, so light/dark adaptation is automatic — this widget never once asks "is dark mode on," it only asks "which semantic role," and the active `ThemeData` answers the mode question on its behalf. Notice `error` deliberately doesn't reuse `warning`'s tertiary role or vice versa — Material 3 gives `error` its own dedicated color group specifically so destructive/failure states are never visually confusable with a merely-cautionary one.

</details>

---

**Next → [DOC_04: BuildContext Deep Dive](DOC_04_BuildContext_Deep_Dive.md) · [BuildContext Challenges](DOC_04b_BuildContext_Challenges.md)**
