# Animation Challenges

### Companion to [Week 09: Animations](Week_09_Animations.md)

---

## How This Works

Animations are functions of time — that means you can compute their values by hand before you ever run the code. Every problem here starts with "predict the number," then verifies with an `AnimatedBuilder` printing the live value. Paste starters into [DartPad](https://dartpad.dev).

---

### W9-1 (Easy) — Compute a curve's value by hand

**Problem:** an `AnimationController` runs for 1000ms, driving a `CurvedAnimation`. At `t = 500ms` (the halfway point in *time*), predict `controller.value` for each of these curves — remember, `Curves.linear` at the halfway point in time gives exactly 0.5, but most curves don't:

- `Curves.linear`
- `Curves.easeIn` (starts slow, accelerates)
- `Curves.easeOut` (starts fast, decelerates)

Just predict **greater than 0.5**, **less than 0.5**, or **exactly 0.5** for `easeIn` and `easeOut` — you don't need the exact number.

```dart
class CurveProbe extends StatefulWidget {
  const CurveProbe({super.key});
  @override
  State<CurveProbe> createState() => _CurveProbeState();
}

class _CurveProbeState extends State<CurveProbe> with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1000),
  );
  late final Animation<double> _linear = CurvedAnimation(parent: _controller, curve: Curves.linear);
  late final Animation<double> _easeIn = CurvedAnimation(parent: _controller, curve: Curves.easeIn);
  late final Animation<double> _easeOut = CurvedAnimation(parent: _controller, curve: Curves.easeOut);

  @override
  void initState() {
    super.initState();
    _controller.addListener(() {
      debugPrint(
        't=${(_controller.value * 1000).round()}ms  '
        'linear=${_linear.value.toStringAsFixed(2)}  '
        'easeIn=${_easeIn.value.toStringAsFixed(2)}  '
        'easeOut=${_easeOut.value.toStringAsFixed(2)}',
      );
    });
    _controller.forward();
  }

  @override
  Widget build(BuildContext context) => const SizedBox();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }
}
```

**Task:** run it, watch the console around the `t=500ms` line, and check your prediction.

<details><summary>Answer & Explanation</summary>

Around `t=500ms`: `linear ≈ 0.50`, `easeIn < 0.5` (roughly 0.3), `easeOut > 0.5` (roughly 0.7).

🔴 **Explanation:** `controller.value` always moves linearly with *time* — at 50% of the duration, `controller.value` is exactly `0.5`, no matter what curve is applied. The curve is a **separate function** that remaps that linear progress: `CurvedAnimation.value = curve.transform(controller.value)`. `easeIn` is defined to start slow, so at the time-halfway point it hasn't caught up to the halfway *progress* yet — its output is still below 0.5. `easeOut` is the mirror image: it front-loads its progress, so by the time-halfway point it's already past 0.5. This is why `Curves.easeInOut` (used as the "default reasonable choice" throughout this bootcamp) is neither — it's slow at both ends and fast in the middle, which is why it reads as more natural than pure linear motion.

</details>

---

### W9-2 (Medium) — Staggered animation: predict what's visible mid-sequence

**Problem:** three widgets fade in **in sequence** using a single shared 1-second `AnimationController` and three `Interval`-based curves:

```dart
class Staggered extends StatefulWidget {
  const Staggered({super.key});
  @override
  State<Staggered> createState() => _StaggeredState();
}

class _StaggeredState extends State<Staggered> with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1000),
  )..forward();

  late final Animation<double> _fade1 = CurvedAnimation(
    parent: _controller, curve: const Interval(0.0, 0.3, curve: Curves.easeIn),
  );
  late final Animation<double> _fade2 = CurvedAnimation(
    parent: _controller, curve: const Interval(0.3, 0.6, curve: Curves.easeIn),
  );
  late final Animation<double> _fade3 = CurvedAnimation(
    parent: _controller, curve: const Interval(0.6, 1.0, curve: Curves.easeIn),
  );

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) => Row(
        children: [
          Opacity(opacity: _fade1.value, child: const _Box(Colors.red)),
          Opacity(opacity: _fade2.value, child: const _Box(Colors.green)),
          Opacity(opacity: _fade3.value, child: const _Box(Colors.blue)),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }
}

class _Box extends StatelessWidget {
  const _Box(this.color);
  final Color color;
  @override
  Widget build(BuildContext context) => Container(width: 60, height: 60, color: color, margin: const EdgeInsets.all(4));
}
```

**Task:** at `t = 400ms` into the 1000ms animation, predict the approximate opacity of each box (fully visible / fully invisible / partway). Then add a `debugPrint` inside the `builder` to check.

<details><summary>Answer & Explanation</summary>

At `t=400ms` (`controller.value = 0.4`): red box is **fully visible** (its interval `[0.0, 0.3]` completed at `t=300ms`, opacity clamped at 1.0 since then). Green box is **partway** — its interval is `[0.3, 0.6]`, and `t=400ms` is 1/3 of the way through that window. Blue box is **fully invisible** — its interval `[0.6, 1.0]` hasn't started yet.

🔴 **Explanation:** `Interval(start, end)` remaps a sub-range of the controller's `[0.0, 1.0]` progress to its own full `[0.0, 1.0]` output, and **clamps** outside that range — before `start`, output is `0.0`; after `end`, output is `1.0`. That clamping is exactly why the red box doesn't overshoot to invisible again after `t=300ms` — its `Interval` output simply freezes at `1.0` for the rest of the controller's run. All three `Opacity` widgets share **one** `AnimationController`, which is the point: staggering isn't three separate timers, it's one timer with three different "windows of interest" carved out of the same 0-to-1 progress value.

</details>

---

### W9-3 (Medium) — Reproduce and fix the Hero tag mismatch

**Problem:** `Hero` animations require a matching `tag` on both the source and destination screen. Deliberately break it, watch the error, then fix it.

```dart
class ListScreen extends StatelessWidget {
  const ListScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: GestureDetector(
        onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const DetailScreen())),
        child: Center(
          child: Hero(
            tag: 'photo-1', // <-- note this tag
            child: Container(width: 80, height: 80, color: Colors.orange),
          ),
        ),
      ),
    );
  }
}

class DetailScreen extends StatelessWidget {
  const DetailScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Hero(
          tag: 'photo_1', // <-- BUG: underscore instead of hyphen
          child: Container(width: 300, height: 300, color: Colors.orange),
        ),
      ),
    );
  }
}
```

**Task 1:** run it, tap the orange box, and read the exact assertion error in the console.

**Task 2:** fix the tag mismatch. Then, separately, try giving **two Heroes on the same screen** the identical tag and read that (different) error too.

<details><summary>Explanation</summary>

🔴 **Explanation:** `'photo-1'` vs `'photo_1'` fails with something like "A Hero widget in the destination widget subtree failed to find a matching Hero" — Flutter's Hero flight mechanism works by scanning the outgoing route for a `Hero` with a given tag, and the incoming route for a `Hero` with the *same* tag (compared with `==`, so it's a byte-for-byte string match, no fuzzy matching), then animating the outgoing one's `RenderObject` bounds and content into the incoming one's bounds over the page transition. Two Heroes on the *same* screen sharing a tag fails differently ("multiple heroes share the same tag") — because within one route, `tag` is meant to be unique; the framework can't decide which of two identical-tagged Heroes on the source screen should fly to a given destination Hero. Both errors are the framework refusing to guess on your behalf — better to fail loudly at the exact mismatch than silently animate the wrong thing.

</details>

---

### W9-4 (Hard) — Write a custom Tween

**Problem:** `Tween<T>` interpolates between two values of type `T`. Built-in ones exist for `double`, `Color`, `Rect`, etc. — write one for a custom `CardStyle` type combining a color and a corner radius, both of which should animate smoothly together.

```dart
class CardStyle {
  const CardStyle({required this.color, required this.radius});
  final Color color;
  final double radius;
}

class CardStyleTween extends Tween<CardStyle> {
  CardStyleTween({required CardStyle super.begin, required CardStyle super.end});

  @override
  CardStyle lerp(double t) {
    // TODO
  }
}
```

<details><summary>Solution & Explanation</summary>

```dart
@override
CardStyle lerp(double t) {
  return CardStyle(
    color: Color.lerp(begin!.color, end!.color, t)!,
    radius: begin!.radius + (end!.radius - begin!.radius) * t,
  );
}
```

🔴 **Explanation:** `Tween<T>.lerp(double t)` is the one method you must implement, and it receives `t` already in `[0.0, 1.0]` (the curve has already been applied upstream if you're using `CurvedAnimation`) — your job is purely "given how far along we are, produce the in-between value of type `T`." For `color`, Flutter already ships `Color.lerp` (interpolating each RGBA channel independently), so reuse it rather than reimplementing channel math. For `radius`, a plain `double`, linear interpolation is `begin + (end - begin) * t` — the same formula underlying every numeric `Tween` in the framework, written out explicitly instead of hidden inside `Tween<double>`. The reason a *combined* `CardStyleTween` beats two separate `ColorTween`/`Tween<double>` animated independently: it guarantees both properties are read from the exact same `t`, avoiding any risk of them drifting out of sync across frames.

</details>

---

## Bonus Round — Mix It Up

Different formats, same topic. See [the full challenge-type roster](../00_CHALLENGE_TYPES.md) for what each icon means.

---

### 🐛 Bug Hunt — The Animation That Runs Once and Never Again

```dart
class PulsingDot extends StatefulWidget {
  const PulsingDot({super.key});
  @override
  State<PulsingDot> createState() => _PulsingDotState();
}

class _PulsingDotState extends State<PulsingDot> with SingleTickerProviderStateMixin {
  @override
  Widget build(BuildContext context) {
    final controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    )..repeat(reverse: true);

    return AnimatedBuilder(
      animation: controller,
      builder: (context, child) => Opacity(
        opacity: 0.3 + (controller.value * 0.7),
        child: const CircleAvatar(radius: 8, backgroundColor: Colors.red),
      ),
    );
  }
}
```

This compiles fine and the dot *does* pulse initially. But something is quietly very wrong, and it gets worse the longer the screen stays open. Find it before opening the answer — think about what's different from every other `AnimationController` example in this bootcamp.

<details><summary>Diagnosis & Fix</summary>

🔴 **Explanation:** `AnimationController(...)` is created **inside `build()`** — which means every single time this widget rebuilds (an ancestor's `setState`, an `InheritedWidget` change, anything), a **brand new** `AnimationController` is constructed and started, while the *old* one, still ticking away from the previous build, is never disposed. Each rebuild leaks one more running `AnimationController` — a `Ticker` registered with the scheduler, animating forever with nothing on screen still pointing at it. This is [Week 3's timer-leak lesson](../Phase_1_Dart_and_Foundations/Week_03b_Lifecycle_Challenges.md#w3-3-medium--prove-a-timer-leak-with-a-counter-not-a-guess) at its most severe — Flutter will even throw an assertion error in debug mode along the lines of *"AnimationController.dispose() must be called"* well before you run out of memory, but only once the `State` itself disposes, by which point dozens of leaked controllers might already exist. The fix is to build the `AnimationController` exactly once:

```dart
class _PulsingDotState extends State<PulsingDot> with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 800),
  )..repeat(reverse: true);

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) => Opacity(
        opacity: 0.3 + (_controller.value * 0.7),
        child: const CircleAvatar(radius: 8, backgroundColor: Colors.red),
      ),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }
}
```

**Rule to internalize: `AnimationController` construction belongs in a field initializer or `initState`, never in `build()`.**

</details>

---

### 🔬 Diff Detective — Two Curve Applications

Both compile. Both animate. They don't look the same.

```dart
// Version A
Animation<double> anim = Tween<double>(begin: 0, end: 1)
    .animate(CurvedAnimation(parent: controller, curve: Curves.easeIn));
```

```dart
// Version B
Animation<double> anim = CurvedAnimation(parent: controller, curve: Curves.easeIn)
    .drive(Tween<double>(begin: 0, end: 1));
```

<details><summary>The actual difference</summary>

🔴 **Explanation:** trick question, sort of — these two produce **functionally identical** results; `.drive()` is just `Tween`'s more composable alternative spelling of the same operation `.animate(CurvedAnimation(...))` performs. The genuinely different pair worth knowing is this one instead — compare **A** above against:

```dart
// Version C — curve applied to the TWEEN'S OUTPUT, not the progress input
Animation<double> anim = controller.drive(
  CurveTween(curve: Curves.easeIn),
).drive(Tween<double>(begin: 0, end: 100));
```

Version C chains `CurveTween` (remapping `controller`'s raw `[0,1]` progress through the curve first) into a second `Tween` — mathematically this is the composition `tween(curve(t))`, same as A/B's `tween(curve.transform(t))`. So even C is equivalent here. The real trap most people actually hit is applying `Curves.easeIn` **after** a non-`[0,1]`-ranged `Tween` instead of before it — e.g., trying to curve a `ColorTween` output directly with arithmetic instead of curving the driving `t` value — which breaks because curves are defined to operate on progress values in `[0,1]`, not on arbitrary output ranges like colors or large numbers. The lesson: **always apply the curve to the `[0,1]` progress value, before it's fed into whatever `Tween` maps it to your actual output range** — chain curve-then-tween, never tween-then-curve.

</details>

---

### 🏗️ Build It Blind — A Reusable "Attention Shake"

No starter code. Spec only:

> Build something that makes any widget shake side-to-side briefly (like an incorrect-password field on iOS) when triggered externally — the trigger should be something the caller can invoke on demand (e.g., after a failed form submission), not something that runs automatically.

Decide: is this a widget with a public method the caller calls via a `GlobalKey`? A `ValueNotifier` the widget listens to? Something else? What does "shake" actually mean in terms of a `Tween` and a repeating-but-self-stopping `AnimationController`?

<details><summary>One reasonable solution</summary>

```dart
class ShakeWidget extends StatefulWidget {
  const ShakeWidget({super.key, required this.child});
  final Widget child;
  @override
  State<ShakeWidget> createState() => ShakeWidgetState();
}

class ShakeWidgetState extends State<ShakeWidget> with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 400),
  );
  late final Animation<double> _offset = TweenSequence<double>([
    TweenSequenceItem(tween: Tween(begin: 0.0, end: -8.0), weight: 1),
    TweenSequenceItem(tween: Tween(begin: -8.0, end: 8.0), weight: 2),
    TweenSequenceItem(tween: Tween(begin: 8.0, end: 0.0), weight: 1),
  ]).animate(CurvedAnimation(parent: _controller, curve: Curves.easeInOut));

  void shake() => _controller.forward(from: 0);

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _offset,
      builder: (context, child) => Transform.translate(offset: Offset(_offset.value, 0), child: child),
      child: widget.child,
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }
}

// Usage — GlobalKey exposes the public shake() method to a caller:
final shakeKey = GlobalKey<ShakeWidgetState>();
// ...
ShakeWidget(key: shakeKey, child: TextField(...));
// ...on failed validation:
shakeKey.currentState?.shake();
```

🔴 **Explanation:** the design decision worth noticing is `GlobalKey<ShakeWidgetState>()` — this is one of the few genuinely legitimate uses of `GlobalKey`: exposing an *imperative* method (`shake()`) on a widget that's otherwise built declaratively, for a caller elsewhere in the tree to invoke on demand. `TweenSequence` is the tool for "not a single smooth curve, but several distinct phases stitched together" — left-a-little, right-more, back-to-center — each `TweenSequenceItem`'s `weight` controls what fraction of the total duration that phase consumes, relative to the others (weights `1, 2, 1` here mean the middle swing takes twice as long as either end).

</details>

---

**Next → [Week 10: Gestures & Custom Widgets](Week_10_Gestures_and_Custom_Widgets.md) · [Gesture Challenges](Week_10b_Gesture_Challenges.md)**
