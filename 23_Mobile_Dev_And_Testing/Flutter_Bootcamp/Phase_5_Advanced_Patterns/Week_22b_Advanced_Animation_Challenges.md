# Advanced Animation & CustomPaint Challenges

### Companion to [Week 22: Advanced Animations & CustomPaint](Week_22_Advanced_Animations_CustomPaint.md)

---

## How This Works

`CustomPainter` bugs are almost always about `shouldRepaint` — data changes, but nothing redraws, and it looks like a mystery until you check that one method. Paste starters into [DartPad](https://dartpad.dev).

---

### W22-1 (Medium) — Reproduce the "data changed but nothing redraws" bug

**Problem:** a bar chart that should update when new data arrives — but doesn't.

```dart
class BarChartPainter extends CustomPainter {
  BarChartPainter(this.values);
  final List<double> values;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = Colors.blue;
    final barWidth = size.width / values.length;
    final maxVal = values.reduce((a, b) => a > b ? a : b);
    for (int i = 0; i < values.length; i++) {
      final barHeight = (values[i] / maxVal) * size.height;
      canvas.drawRect(
        Rect.fromLTWH(i * barWidth, size.height - barHeight, barWidth * 0.8, barHeight),
        paint,
      );
    }
  }

  @override
  bool shouldRepaint(BarChartPainter oldDelegate) => false; // BUG
}

class ChartScreen extends StatefulWidget {
  const ChartScreen({super.key});
  @override
  State<ChartScreen> createState() => _ChartScreenState();
}

class _ChartScreenState extends State<ChartScreen> {
  List<double> _values = [3, 7, 2, 9, 4];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: CustomPaint(size: const Size(300, 200), painter: BarChartPainter(_values)),
      floatingActionButton: FloatingActionButton(
        onPressed: () => setState(() => _values = [for (final v in _values) v + 1]),
        child: const Icon(Icons.refresh),
      ),
    );
  }
}
```

**Task:** tap the FAB a few times. Does the chart visually update at all? Fix `shouldRepaint`.

<details><summary>Solution & Explanation</summary>

```dart
@override
bool shouldRepaint(BarChartPainter oldDelegate) => oldDelegate.values != values;
```

🔴 **Explanation:** `CustomPaint` creates a **new** `BarChartPainter` instance on every `setState`-triggered rebuild (since `_ChartScreenState.build()` constructs `BarChartPainter(_values)` fresh each time) — but Flutter doesn't blindly repaint just because a new painter object exists. It calls `shouldRepaint(oldPainter)` on the new instance and only re-runs `paint()` if that returns `true`. Hardcoding `false` tells Flutter "never repaint, regardless of what changed" — the chart is frozen at whatever it drew the very first frame, even though `_values` genuinely updates on every tap (verify this yourself with a `debugPrint(_values)` inside `build()`). Note `oldDelegate.values != values` is a **list identity/element comparison** — since `_values = [for (final v in _values) v + 1]` creates a brand new `List` object every time (rather than mutating in place), this comparison correctly detects the change. If you instead mutated the same list in place, this exact check would fail to detect it — another reason immutable-update patterns matter beyond just Provider/BLoC.

</details>

---

### W22-2 (Medium) — Compute bar positions by hand before drawing them

**Problem:** given `values = [3, 7, 2, 9, 4]` drawn into a canvas of `size = Size(300, 200)`, compute **by hand** the exact `Rect` (left, top, width, height) for the bar representing `9` (the max value) and the bar representing `2`, using the same formula as W22-1's painter. Then verify by adding `debugPrint` inside `paint()`.

<details><summary>Answer & Explanation</summary>

`barWidth = 300 / 5 = 60`. `maxVal = 9`.

**Bar for `9`** (index 3): `barHeight = (9/9) * 200 = 200`. `Rect.fromLTWH(3*60, 200-200, 60*0.8, 200)` = `Rect.fromLTWH(180, 0, 48, 200)` — full height, top at `y=0`.

**Bar for `2`** (index 2): `barHeight = (2/9) * 200 ≈ 44.4`. `Rect.fromLTWH(2*60, 200-44.4, 60*0.8, 44.4)` = `Rect.fromLTWH(120, 155.6, 48, 44.4)`.

🔴 **Explanation:** the reason to compute this by hand before running it: `CustomPainter` code has no compiler-level check that your math is right — a sign error or a swapped `width`/`height` produces a chart that *looks* plausible but is subtly wrong, and eyeballing pixels rarely catches a 10% error. `size.height - barHeight` as the `top` coordinate is worth internalizing specifically: canvas `y` coordinates grow **downward**, so a bar's top edge is `size.height` minus its height, not `0` — draw from the bottom up, the same mental model as a normal bar chart, just inverted from how you might first guess canvas coordinates work.

</details>

---

### W22-3 (Medium) — Prove RepaintBoundary isolates a CustomPainter

**Problem:** a screen with an expensive-looking `CustomPainter` (standing in for a real complex chart) sitting next to unrelated content that rebuilds frequently (a ticking counter). Prove that wrapping the painter in `RepaintBoundary` stops it from repainting when only the counter changes.

```dart
class ExpensivePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    debugPrint('ExpensivePainter.paint() ran');
    canvas.drawCircle(size.center(Offset.zero), 50, Paint()..color = Colors.purple);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false; // static content, never needs repaint
}

class MixedScreen extends StatefulWidget {
  const MixedScreen({super.key});
  @override
  State<MixedScreen> createState() => _MixedScreenState();
}

class _MixedScreenState extends State<MixedScreen> {
  int _tick = 0;

  @override
  void initState() {
    super.initState();
    Timer.periodic(const Duration(seconds: 1), (_) => setState(() => _tick++));
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text('Tick: $_tick'), // changes every second, triggers this State's rebuild
        CustomPaint(size: const Size(200, 200), painter: ExpensivePainter()),
        // TODO: does wrapping the line above in RepaintBoundary change the print frequency?
      ],
    );
  }
}
```

**Task:** run it as-is, watch how often "ExpensivePainter.paint() ran" prints relative to the tick counter. Then wrap the `CustomPaint` in a `RepaintBoundary` and compare.

<details><summary>Explanation</summary>

🔴 **Explanation:** interestingly, in this exact example, `shouldRepaint` returning `false` already prevents re-painting regardless of `RepaintBoundary` — but that's only true because this painter has no data dependency on anything that changes. Add `RepaintBoundary` anyway and the practical benefit shows up differently: it isolates this subtree onto its **own GPU-composited layer** ([Week 9's Invisible Machinery](../Phase_2_Core_UI/Week_09_Animations.md) — the layer tree, not the widget tree). Without it, even though `paint()` itself is skipped, the *raster thread* still has to consider this region as part of the same compositing pass as the rest of the screen on every frame; with it, the painted output is cached as its own texture and reused across frames untouched by whatever's changing elsewhere. In a real chart with `shouldRepaint` correctly wired to actual data changes, `RepaintBoundary` is what keeps an expensive chart's paint cost from being paid again every time an unrelated ticking counter nearby forces a rebuild.

</details>

---

### W22-4 (Easy) — Lottie vs CustomPainter vs implicit animation: judgment calls

**Problem:** for each scenario, decide which tool fits, and justify:

1. A designer delivers a complex, hand-animated mascot character (multiple limbs, secondary motion, squash-and-stretch) as an After Effects export
2. A simple heart icon that pulses (scale 1.0 → 1.2 → 1.0) when a "like" button is tapped
3. A real-time bar chart whose bar heights must animate smoothly whenever new numeric data arrives from an API
4. A page transition where one screen's content visually morphs into the next

<details><summary>Answers</summary>

1. **Lottie.** Reproducing hand-animated character motion (secondary motion, easing curves the designer tuned by eye, multiple independently-timed parts) in `CustomPainter` or `AnimationController` code would mean manually recreating keyframe-by-keyframe animation data that already exists as a `.json` export — pure waste of engineering time for zero visual benefit.
2. **Implicit animation (`AnimatedScale` or a simple `AnimationController` + `Tween`).** This is a single, simple property change with no custom drawing involved — reaching for `CustomPainter` here is over-engineering, and Lottie would mean shipping a JSON asset and a rendering dependency for something four lines of Flutter already does.
3. **`CustomPainter`, driven by an `AnimationController`/`Tween` interpolating the numeric values themselves.** This needs to redraw based on *live, data-driven* values that change unpredictably — Lottie animations are pre-baked and can't be driven by arbitrary incoming numbers; a `CustomPainter` with a `Tween<double>` per bar (or a single `Tween` for the whole dataset) is exactly the right tool, same shape as the `CardStyleTween` from [Week 9's challenges](../Phase_2_Core_UI/Week_09b_Animation_Challenges.md).
4. **Depends on the specifics — usually `Hero` (if there's a clear shared element) or a custom `PageRouteBuilder`.** "Morphing" is vague enough to cover several real techniques; the judgment call is identifying whether there's a genuine shared visual element (→ `Hero`) or a more general cross-fade/slide (→ `PageRouteBuilder` with a custom transition builder).

🔴 **Explanation:** the actual decision rule underneath all four: **Lottie for pre-authored, designer-created motion you can't (and shouldn't) reproduce in code; implicit animations for simple, single-property, code-driven transitions; `CustomPainter` + explicit `AnimationController`/`Tween` for anything that must render based on live or complex data.** Reaching for the wrong one in either direction has a real cost — hand-coding what a Lottie file already solved wastes engineering time, and reaching for Lottie when you need to visualize live data means you're now unable to actually drive the animation from your app's real state.

</details>

---

**Next → [Week 23: Project — Expense Tracker](Week_23_Project_ExpenseTracker.md)**
