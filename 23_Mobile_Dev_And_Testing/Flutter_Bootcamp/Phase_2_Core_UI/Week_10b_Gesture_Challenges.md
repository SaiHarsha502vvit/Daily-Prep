# Gesture & Custom Widget Challenges

### Companion to [Week 10: Gestures & Custom Widgets](Week_10_Gestures_and_Custom_Widgets.md)

---

## How This Works

The gesture arena is invisible until you deliberately create a conflict and watch Flutter resolve it. The custom-widget problems are about API design — the difference between a widget that's pleasant to reuse and one that fights its caller. Paste starters into [DartPad](https://dartpad.dev).

---

### W10-1 (Medium) — Reproduce a gesture arena conflict

**Problem:** a horizontally-scrollable row of cards, where each card also has an `onTap`. This is a completely ordinary UI pattern — and it hides a real arena conflict.

```dart
class ConflictDemo extends StatelessWidget {
  const ConflictDemo({super.key});
  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 120,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: 10,
        itemBuilder: (context, i) => GestureDetector(
          onTap: () => debugPrint('Card $i tapped'),
          child: Container(
            width: 100,
            margin: const EdgeInsets.all(8),
            color: Colors.primaries[i % Colors.primaries.length],
            alignment: Alignment.center,
            child: Text('$i'),
          ),
        ),
      ),
    );
  }
}
```

**Task 1:** run it. Do a clean tap on a card — does `onTap` fire? Now do a *slow horizontal drag* starting on a card, intending to scroll — does that card's `onTap` also fire, or does the scroll win cleanly?

**Task 2:** now do a **vertical** drag starting on a card, inside the horizontal `ListView`. Predict what happens before you try it — does the list scroll, does the tap fire, or does nothing happen?

<details><summary>Explanation</summary>

A clean tap fires `onTap` correctly. A horizontal drag scrolls the list, and — because `GestureDetector`'s `TapGestureRecognizer` and the `ListView`'s horizontal `DragGestureRecognizer` are **both competing in the same arena** for horizontal pointer movement — the tap recognizer loses cleanly once the drag exceeds a small movement threshold (`kTouchSlop`, a few logical pixels), and no spurious `onTap` fires. A **vertical** drag does neither — the horizontal `ListView`'s recognizer doesn't claim vertical movement, and the `GestureDetector`'s tap recognizer requires the pointer to stay roughly in place, so a clear vertical drag away from the start point also causes the tap to lose. Nothing scrolls, nothing taps.

🔴 **Explanation:** this is the Gesture Arena from [Week 11's Invisible Machinery](../Phase_2_Core_UI/Week_10_Gestures_and_Custom_Widgets.md) (original numbering) doing exactly what it's designed to do — every recognizer that could plausibly claim a given pointer sequence enters the same arena, and movement past a small threshold is what causes `TapGestureRecognizer` to voluntarily concede. The reason this *works* without you writing any conflict-resolution code is that `ListView` and `GestureDetector` are both built on the same underlying arena primitives — the "conflict" you might expect (scroll vs. tap both firing) essentially never happens by accident in Flutter, specifically because of this arena design.

</details>

---

### W10-2 (Hard) — Build Dismissible's core mechanic from raw gestures

**Problem:** without using the `Dismissible` widget, build a card that the user can drag horizontally, and which **removes itself** (calls an `onDismissed` callback) if released past 40% of its own width — otherwise it should snap back to center.

```dart
class SwipeToDismiss extends StatefulWidget {
  const SwipeToDismiss({super.key, required this.child, required this.onDismissed});
  final Widget child;
  final VoidCallback onDismissed;
  @override
  State<SwipeToDismiss> createState() => _SwipeToDismissState();
}

class _SwipeToDismissState extends State<SwipeToDismiss> with SingleTickerProviderStateMixin {
  double _dragOffset = 0;
  late double _cardWidth;

  void _onDragUpdate(DragUpdateDetails details) {
    setState(() => _dragOffset += details.delta.dx);
  }

  void _onDragEnd(DragEndDetails details) {
    // TODO: if |_dragOffset| > 40% of card width, call widget.onDismissed()
    // otherwise, animate/snap _dragOffset back to 0
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        _cardWidth = constraints.maxWidth;
        return GestureDetector(
          onHorizontalDragUpdate: _onDragUpdate,
          onHorizontalDragEnd: _onDragEnd,
          child: Transform.translate(
            offset: Offset(_dragOffset, 0),
            child: Opacity(
              opacity: (1 - (_dragOffset.abs() / _cardWidth)).clamp(0.0, 1.0),
              child: widget.child,
            ),
          ),
        );
      },
    );
  }
}
```

**Task:** implement `_onDragEnd`. For the "snap back" case, a simple `setState(() => _dragOffset = 0)` works but looks like a jump-cut, not a slide — for a bonus, animate it back using an `AnimationController` instead.

<details><summary>Solution & Explanation</summary>

```dart
void _onDragEnd(DragEndDetails details) {
  final threshold = _cardWidth * 0.4;
  if (_dragOffset.abs() > threshold) {
    widget.onDismissed();
  } else {
    setState(() => _dragOffset = 0); // instant snap-back
    // bonus version: drive _dragOffset from an AnimationController
    // animating from its current value back to 0 over ~200ms
  }
}
```

🔴 **Explanation:** this is what `Dismissible` does internally, minus the built-in background-reveal and animation polish — `onHorizontalDragUpdate` accumulates the raw drag delta into an offset applied via `Transform.translate` (a paint-time transform, not a layout change, which is why it's cheap per-frame), and `onHorizontalDragEnd` is where the actual decision happens: compare the final offset against a threshold and either commit to dismissal or reset. The `Opacity` tied to `_dragOffset.abs() / _cardWidth` is a nice touch worth noticing in yourself once you write it: it's the same "derive a 0-to-1 ratio from two known bounds" pattern as the sticky-header opacity math in [Week 7's challenges](../Phase_2_Core_UI/Week_07b_Scrolling_Challenges.md).

</details>

---

### W10-3 (Easy) — `child` vs `builder`: an API design decision, not a style choice

**Problem:** build a `LoadingOverlay` widget two different ways and figure out when each is actually necessary — not just "which style do I prefer."

```dart
// Version A: takes a static child
class LoadingOverlayA extends StatelessWidget {
  const LoadingOverlayA({super.key, required this.isLoading, required this.child});
  final bool isLoading;
  final Widget child;
  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        child,
        if (isLoading) Container(color: Colors.black38, child: const Center(child: CircularProgressIndicator())),
      ],
    );
  }
}

// Version B: takes a builder function
class LoadingOverlayB extends StatelessWidget {
  const LoadingOverlayB({super.key, required this.isLoading, required this.builder});
  final bool isLoading;
  final WidgetBuilder builder;
  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        builder(context),
        if (isLoading) Container(color: Colors.black38, child: const Center(child: CircularProgressIndicator())),
      ],
    );
  }
}
```

**Task:** write a scenario — a specific piece of content you'd want inside this overlay — where **Version A breaks or behaves wrong** and Version B is required. Hint: think about `Theme.of(context)` or `MediaQuery.of(context)` calls inside the content, and exactly which `BuildContext` gets passed to them in each version.

<details><summary>Explanation</summary>

**The scenario:** wrap `LoadingOverlayA` around content that calls `Theme.of(context)` where `context` is the *caller's* context — i.e., the widget calling `LoadingOverlayA(child: Builder(builder: (ctx) { ... }))`. That's actually fine, because `Builder` inside the child already gives you a fresh context. The real difference surfaces when the content needs a context **that is a descendant of something `LoadingOverlay` itself introduces** — for example, if `LoadingOverlay` wrapped its content in a new `Theme` override, or a new `MediaQuery` with adjusted padding. With **Version A**, `child` is constructed by the *caller*, using the caller's `context`, **before** `LoadingOverlayA.build()` ever runs — so it cannot see any `InheritedWidget` that `LoadingOverlayA` introduces above it. With **Version B**, `builder(context)` is called *from inside* `LoadingOverlayB.build()`, with the context at that exact point in the tree — so it correctly sees anything `LoadingOverlayB` introduced.

🔴 **Explanation:** this is precisely why widgets like `MaterialApp.builder`, `ScaffoldMessenger`, or `Overlay`-based packages take a `builder:` callback instead of a plain `child:` — they need to inject something into the tree (a theme override, an overlay context, localization) and have descendant widgets be built *after* that injection, not before. The rule to internalize: **use `child:` when the content genuinely doesn't depend on anything your widget introduces (cheaper — Flutter can reuse the same child instance across your widget's rebuilds); use `builder:` when the content needs to see something new that only exists inside your widget's subtree.**

</details>

---

### W10-4 (Hard, bonus) — Composable widget-wrapping effects

**Problem:** write a reusable "tap-to-scale" effect as a function that wraps any widget — `Widget tapScale({required Widget child, required VoidCallback onTap})` — that shrinks the child to 95% scale while pressed and springs back on release, **without** writing a new class for every widget you want this effect applied to.

```dart
Widget tapScale({required Widget child, required VoidCallback onTap}) {
  // TODO — a StatefulBuilder or a small stateful wrapper widget works here
}

// Usage — apply the SAME function to two completely different widgets:
tapScale(child: const Icon(Icons.favorite, size: 40), onTap: () {});
tapScale(child: Container(width: 100, height: 40, color: Colors.blue), onTap: () {});
```

<details><summary>Solution & Explanation</summary>

```dart
Widget tapScale({required Widget child, required VoidCallback onTap}) {
  return _TapScale(onTap: onTap, child: child);
}

class _TapScale extends StatefulWidget {
  const _TapScale({required this.child, required this.onTap});
  final Widget child;
  final VoidCallback onTap;
  @override
  State<_TapScale> createState() => _TapScaleState();
}

class _TapScaleState extends State<_TapScale> {
  bool _pressed = false;
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: widget.onTap,
      onTapDown: (_) => setState(() => _pressed = true),
      onTapUp: (_) => setState(() => _pressed = false),
      onTapCancel: () => setState(() => _pressed = false),
      child: AnimatedScale(
        scale: _pressed ? 0.95 : 1.0,
        duration: const Duration(milliseconds: 100),
        child: widget.child,
      ),
    );
  }
}
```

🔴 **Explanation:** the public function `tapScale()` is a thin wrapper over a private `_TapScale` stateful widget — this is **composition over inheritance** made concrete: instead of writing `ScalableIcon`, `ScalableContainer`, `ScalableCard` as separate subclasses (the instinct someone coming from an OOP-heavy background reaches for), you write the effect *once* as a widget that takes an arbitrary `child`, and apply it to anything. `onTapCancel` matters and is easy to forget: if the user presses down and then drags their finger off the widget before releasing (a very common real gesture), `onTapUp` never fires — only `onTapCancel` does — and without handling it, the widget would stay visually "pressed" forever after an aborted tap.

</details>

---

**Next → [Week 11: Project — Shopping App](Week_11_Project_ShoppingApp.md)**
