# Performance & Profiling Challenges

### Companion to [Week 25: Performance & Profiling](Week_25_Performance_and_Profiling.md)

---

## How This Works

Same instruments as earlier weeks, turned toward measurement instead of correctness: `debugPrint` counting rebuilds, `Stopwatch` timing real work, and a static counter proving a leak the same way [Week 3's timer exercise](../Phase_1_Dart_and_Foundations/Week_03b_Lifecycle_Challenges.md) did. Paste starters into [DartPad](https://dartpad.dev).

---

### W25-1 (Medium) — Reproduce jank from heavy work inside build(), then fix it

**Problem:** sorting a large list *inside* `build()` — a real, common mistake.

```dart
class ExpenseListScreen extends StatefulWidget {
  const ExpenseListScreen({super.key});
  @override
  State<ExpenseListScreen> createState() => _ExpenseListScreenState();
}

class _ExpenseListScreenState extends State<ExpenseListScreen> {
  final List<double> _expenses = List.generate(50000, (i) => (i * 37) % 1000 + 0.99);
  int _tick = 0;

  @override
  Widget build(BuildContext context) {
    final sw = Stopwatch()..start();
    final sorted = [...(_expenses)]..sort(); // BUG: re-sorts 50,000 items on EVERY build
    sw.stop();
    debugPrint('Sort took ${sw.elapsedMicroseconds}us this build (tick=$_tick)');

    return Scaffold(
      body: Center(child: Text('Total: ${sorted.length} items, min=${sorted.first}')),
      floatingActionButton: FloatingActionButton(
        onPressed: () => setState(() => _tick++), // triggers a full rebuild, re-sorting for no reason
        child: const Icon(Icons.refresh),
      ),
    );
  }
}
```

**Task 1:** tap the FAB a few times, watch the console — the sort time should be nontrivial (50,000 items) and repeat on every single tap, even though `_expenses` itself never changed.

**Task 2:** fix it by computing `sorted` once and caching it — either as a field computed in `initState`, or (better, since it demonstrates the general pattern) memoized and only recomputed when `_expenses` actually changes.

<details><summary>Solution & Explanation</summary>

```dart
class _ExpenseListScreenState extends State<ExpenseListScreen> {
  final List<double> _expenses = List.generate(50000, (i) => (i * 37) % 1000 + 0.99);
  late final List<double> _sorted = [..._expenses]..sort(); // computed ONCE
  int _tick = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(child: Text('Total: ${_sorted.length} items, min=${_sorted.first}, tick=$_tick')),
      floatingActionButton: FloatingActionButton(
        onPressed: () => setState(() => _tick++),
        child: const Icon(Icons.refresh),
      ),
    );
  }
}
```

🔴 **Explanation:** `build()` can run dozens of times per second during an animation or rapid interaction — it is explicitly **not** the place for anything beyond "assemble the widget tree from already-computed data." `late final _sorted = ...` computes the sort exactly once, the first time it's accessed, and caches the result for the `State` object's entire lifetime; `_tick` changing and triggering `setState()` rebuilds the widget tree but never re-touches `_sorted`. This is [Week 25's Invisible Machinery](Week_25_Performance_and_Profiling.md) "Issue 2: Heavy computation in build()" reproduced with a number attached — you watched the exact microsecond cost repeat on every tap, not just been told it's bad practice.

</details>

---

### W25-2 (Hard) — Prove a BLoC subscription leak with a counter, then fix it

**Problem:** same shape as [Week 3's `TimerCounter` exercise](../Phase_1_Dart_and_Foundations/Week_03b_Lifecycle_Challenges.md), one layer up — a screen subscribes to a BLoC's stream manually (outside `BlocBuilder`, for a reason like triggering a one-off side effect) and forgets to cancel.

```dart
class SubscriptionCounter {
  static int active = 0;
}

class LeakyScreen extends StatefulWidget {
  const LeakyScreen({super.key, required this.bloc});
  final ItemsBloc bloc; // reuse ItemsBloc from Week 24's challenges, or any Bloc<E, S>
  @override
  State<LeakyScreen> createState() => _LeakyScreenState();
}

class _LeakyScreenState extends State<LeakyScreen> {
  @override
  void initState() {
    super.initState();
    widget.bloc.stream.listen((state) {
      debugPrint('Got state: $state');
    });
    SubscriptionCounter.active++;
    // BUG: no matching StreamSubscription stored, so dispose() has nothing to cancel
  }

  @override
  Widget build(BuildContext context) => const Text('Leaky screen');

  // no dispose() override at all — nothing to release
}
```

**Task:** wrap `LeakyScreen` in a mount/unmount toggle (same pattern as Week 3's `Host` widget), cycle it 5 times, and predict what `SubscriptionCounter.active` shows. Fix it by storing and cancelling the subscription.

<details><summary>Solution & Explanation</summary>

```dart
class _FixedScreenState extends State<LeakyScreen> {
  late final StreamSubscription _sub;

  @override
  void initState() {
    super.initState();
    _sub = widget.bloc.stream.listen((state) {
      debugPrint('Got state: $state');
    });
    SubscriptionCounter.active++;
  }

  @override
  void dispose() {
    _sub.cancel();
    SubscriptionCounter.active--;
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => const Text('Fixed screen');
}
```

🔴 **Explanation:** `SubscriptionCounter.active` climbs to `5` in the buggy version and never returns to `0` — identical failure shape to Week 3's timer leak, just with a `StreamSubscription` instead of a `Timer`. The real-world consequence is worse than it looks here: each leaked subscription keeps a live reference to the `ItemsBloc`'s stream controller, which means the BLoC itself (and anything *it* holds — repositories, cached data) can't be garbage collected either, since something is still listening to it. A screen the user visits 50 times in a session (a product detail page, a chat thread) leaks 50 subscriptions and everything transitively reachable from each one — this is precisely the class of bug [Week 25's memory profiler section](Week_25_Performance_and_Profiling.md) is built to catch, and now you know exactly what to look for before ever opening DevTools.

</details>

---

### W25-3 (Medium) — Quantify `const`'s effect with real numbers, not intuition

**Problem:** build a screen with 200 list items, half `const`-eligible and half not, force an unrelated rebuild, and count exactly how many `build()` calls each group triggers.

```dart
class ConstBenchmark extends StatefulWidget {
  const ConstBenchmark({super.key});
  @override
  State<ConstBenchmark> createState() => _ConstBenchmarkState();
}

class _ConstBenchmarkState extends State<ConstBenchmark> {
  int _unrelatedCounter = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: ListView(
        children: [
          Text('Counter: $_unrelatedCounter'),
          for (int i = 0; i < 200; i++)
            i.isEven ? const _ConstItem() : _NonConstItem(index: i),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => setState(() => _unrelatedCounter++),
      ),
    );
  }
}

int constBuildCount = 0;
int nonConstBuildCount = 0;

class _ConstItem extends StatelessWidget {
  const _ConstItem();
  @override
  Widget build(BuildContext context) {
    constBuildCount++;
    return const ListTile(title: Text('Const item'));
  }
}

class _NonConstItem extends StatelessWidget {
  const _NonConstItem({required this.index});
  final int index;
  @override
  Widget build(BuildContext context) {
    nonConstBuildCount++;
    return ListTile(title: Text('Item $index'));
  }
}
```

**Task:** tap the FAB 5 times. Print `constBuildCount` and `nonConstBuildCount` after. Predict the ratio before checking — is it exactly what you'd expect from "const items never rebuild," or is there a subtlety?

<details><summary>Explanation</summary>

After 5 taps: `nonConstBuildCount` reads **500** (100 non-const items × 5 rebuilds). `constBuildCount` reads **100** — not 0.

🔴 **Explanation:** the subtlety is the *first* build — every widget, const or not, builds at least once when it first enters the tree, so `constBuildCount` starts at 100 after the initial frame. The win shows up starting from the **second** rebuild onward: each subsequent tap adds another 100 to `nonConstBuildCount` (500 total after 5 taps) but adds **zero** to `constBuildCount` (stays at 100, forever, no matter how many more taps happen) — because [Week 2's reconciliation mechanism](../Phase_1_Dart_and_Foundations/Week_02b_Widget_Rebuild_Challenges.md) means `const _ConstItem()` is the literal same object reference across every rebuild, so Flutter skips it before `build()` is ever called again. At 5 taps the gap is 500 vs 100; at 50 taps it would be 5000 vs 100 — the gap between "cost grows with every rebuild" and "cost paid exactly once" only gets more dramatic the longer the app runs.

</details>

---

### W25-4 (Easy) — Decide: isolate, plain async, or neither

**Problem:** for each task, decide whether it needs `compute()`/`Isolate.run()`, a plain `async`/`await` function, or doesn't need to be async at all:

1. Parsing a 5MB JSON API response into a list of 10,000 typed objects
2. Updating a single Firestore document with a new field value
3. Resizing a 4000×3000 photo down to a 200×200 thumbnail before upload
4. Reading a value out of `SharedPreferences`

<details><summary>Answers</summary>

1. **`compute()`/`Isolate.run()`.** JSON parsing + constructing 10,000 objects is pure CPU work with no I/O wait — it will genuinely block the main isolate's event loop for a noticeable stretch (see [Week 1's `Isolate.run()` proof](../Phase_1_Dart_and_Foundations/Week_01b_Dart_Coding_Challenges.md)), and image/JSON-parsing at this scale is exactly the canonical `compute()` use case cited throughout Flutter's own docs.
2. **Plain `async`/`await`.** This is I/O-bound (waiting on a network round trip), not CPU-bound — the actual local work Dart does is minimal; the time is spent waiting, and waiting doesn't block the event loop the way computation does.
3. **`compute()`/`Isolate.run()`.** Image resizing is CPU-intensive pixel manipulation, not I/O — same category as #1, and large enough (12 million source pixels) to definitely cause visible jank if run directly on the UI isolate.
4. **Neither, in spirit — it's technically `async` but trivially fast.** `SharedPreferences` reads are effectively synchronous in practice (reading a few bytes from a cached in-memory map after initial load) — the `Future` wrapper exists for API consistency, not because this specific operation is slow enough to matter.

🔴 **Explanation:** the actual decision rule from [Week 25's Invisible Machinery](Week_25_Performance_and_Profiling.md): **`compute()`/isolates solve CPU-bound blocking (the event loop is busy computing and can't service anything else); plain `async`/`await` solves I/O-bound waiting (the event loop is free, just waiting on an external response).** Using an isolate for #2 (a network call) would add overhead for no benefit — the bottleneck there is network latency, not CPU, and an isolate can't make a network response arrive faster. Using plain `async` for #1 or #3 doesn't help at all — the CPU-bound work still runs synchronously on the same isolate as your UI, `async`/`await` only yields *between* awaited operations, not during a long synchronous computation.

</details>

---

## Bonus Round — Mix It Up

Different formats, same topic. See [the full challenge-type roster](../00_CHALLENGE_TYPES.md) for what each icon means.

---

### 🐛 Bug Hunt — The Summary Widget That Recomputes 60 Times a Second

```dart
class ExpenseSummary extends StatelessWidget {
  const ExpenseSummary({super.key, required this.expenses});
  final List<Expense> expenses;

  @override
  Widget build(BuildContext context) {
    final sorted = [...expenses]..sort((a, b) => b.amount.compareTo(a.amount));
    final total = expenses.fold(0.0, (sum, e) => sum + e.amount);
    final topCategory = _computeTopCategory(sorted); // groups + sorts again internally

    return Column(children: [
      Text('Total: \$${total.toStringAsFixed(2)}'),
      Text('Top category: $topCategory'),
    ]);
  }
}
```

This widget sits on a dashboard screen that also has a pulsing "syncing..." indicator animating elsewhere on the same screen. `expenses` itself is static — loaded once, never mutated while this screen is open. Using what you know from [Week 22's painter Bug Hunt](../Phase_5_Advanced_Patterns/Week_22b_Advanced_Animation_Challenges.md#-bug-hunt--the-painter-that-never-stops-repainting), predict what's actually happening here before opening the answer.

<details><summary>Diagnosis & Fix</summary>

🔴 **Explanation:** this is the *widget-rebuild* version of the exact same mistake as the `CustomPainter`'s always-`true` `shouldRepaint` — the unrelated pulsing animation forces its own ancestor/sibling subtree to rebuild on every frame (an `AnimationController` driving a `setState` or `AnimatedBuilder` somewhere nearby), and if `ExpenseSummary` sits inside that rebuilding subtree without any isolation, its `build()` re-runs every single frame too — recomputing an `O(n log n)` sort and a full re-grouping of potentially thousands of expenses, 60 times a second, for data that never changed. The fix is to stop treating this as layout-time work: compute it once, outside `build()`, and only recompute when the actual input changes:

```dart
// As a Riverpod derived provider (only recomputes when `expensesProvider` changes):
final sortedExpensesProvider = Provider<List<Expense>>((ref) {
  final expenses = ref.watch(expensesProvider);
  return [...expenses]..sort((a, b) => b.amount.compareTo(a.amount));
});
```

Riverpod (or a `Provider` selector, same idea) caches the derived value and only re-runs the computation when its own `ref.watch` dependency actually changes — completely decoupled from how often the *widget* rebuilds for unrelated reasons like a nearby animation. This is the same "derive once, not on every rebuild" discipline as [Week 12's `context.select`](../Phase_3_State_and_APIs/Week_12b_State_Management_Challenges.md#w12-2-medium--prove-contextselect-narrows-the-rebuild-scope), applied to expensive computation instead of just rebuild scope.

</details>

---

### 🎭 Two Truths and a Lie — Profiling Reality

**A.** Profiling in `--debug` mode gives frame-timing numbers accurate enough to trust, because the Dart VM's JIT overhead is negligible for typical animation code.

**B.** `RepaintBoundary` isolates a subtree's paint output into its own GPU-cacheable layer, so a repaint triggered by a sibling elsewhere on screen doesn't force this subtree to redraw too.

**C.** DevTools' CPU profiler works by sampling — checking "what's executing right now" at a fixed interval — not by tracing every single function call exactly; a function called once for 200ms and a function called 1000 times for 0.2ms each can look very different in the resulting flame chart despite costing the same total time.

<details><summary>Which one's the lie</summary>

**A is the lie**, and it's the one with the most real-world consequence if you get it wrong — `--debug` mode runs on the JIT-interpreted Dart VM with bounds checking, type assertions, and other debug-only overhead all active, running measurably slower (often 2-5x) than the AOT-compiled `--profile`/`--release` builds real users experience. A layout that appears janky in `--debug` might be perfectly smooth in `--profile`, and worse, a genuine performance problem that only manifests at production speed can be invisible in `--debug` if the JIT overhead happens to mask it. **Every performance claim in this bootcamp about frame timing assumes `--profile` mode** — this is precisely why it's the very first Verify question for this week.

🔴 **Explanation:** B and C are both true and both directly practical — B is the mechanism that makes `RepaintBoundary` a real, not-just-theoretical fix for the Bug Hunt above (wrapping `ExpenseSummary` in one would prevent the nearby spinner's repaints from cascading into it, even independent of the caching fix). C is the sampling-vs-tracing distinction that explains why a profiler's flame chart can look surprising at first glance — a function that's *slow but called once* and a function that's *fast but called constantly* can cost the same wall-clock time yet appear completely differently sized in the chart.

</details>

---

### 👹 Boss Battle — Fix a Laggy List, One Diagnosis at a Time

**The spec:** you're handed this deliberately unoptimized list (a real-world-shaped mess, not a single isolated bug). Find and fix **all four** distinct performance problems, in whatever order you discover them — don't just apply "best practices" blindly, diagnose each one first (what would DevTools' Performance tab actually show for each?).

```dart
class ProductList extends StatelessWidget {
  const ProductList({super.key, required this.products});
  final List<Product> products;

  @override
  Widget build(BuildContext context) {
    return ListView(
      children: products.map((p) {
        final discountedPrice = _applyComplexDiscountLogic(p); // expensive, recalculated every rebuild
        return Container(
          padding: EdgeInsets.all(12),
          child: Row(
            children: [
              Image.network(p.imageUrl), // no cacheWidth/cacheHeight — decodes at full resolution
              Text(p.name),
              Text('\$${discountedPrice.toStringAsFixed(2)}'),
            ],
          ),
        );
      }).toList(),
    );
  }
}
```

<details><summary>The four problems and fixes</summary>

**1. `ListView` with eager `children:`, not `.builder`** — same trap as [Week 7's Refactor Duel](../Phase_2_Core_UI/Week_07b_Scrolling_Challenges.md#-refactor-duel--from-column-to-listviewbuilder-prove-the-win). Fix: `ListView.builder(itemCount: products.length, itemBuilder: (_, i) { ... })`.

**2. `_applyComplexDiscountLogic(p)` recalculated on every rebuild, for every item** — same shape as this file's own Bug Hunt above. Fix: precompute discounted prices once when `products` loads (or memoize per-product, keyed by product ID, if discount logic can change independently).

**3. `Image.network` with no size hints** — decodes the image at its full native resolution even if displayed at 40×40 logical pixels, wasting memory and decode time. Fix: `Image.network(p.imageUrl, cacheWidth: 80, cacheHeight: 80)` (roughly 2x the display size, accounting for device pixel ratio) — the decoder downsamples during decode instead of after, which is dramatically cheaper.

**4. No `const` anywhere it could apply** — `Container(padding: EdgeInsets.all(12), ...)` isn't `const` (missing the keyword, and `EdgeInsets.all(12)` could be `const EdgeInsets.all(12)`), meaning nothing here benefits from [Week 2's const-skips-reconciliation optimization](../Phase_1_Dart_and_Foundations/Week_02b_Widget_Rebuild_Challenges.md#w2-1-easy--one-build-method-vs-three) even for the parts of each row that never actually change.

🔴 **Explanation:** the point of finding all four rather than being told "here are four bugs, fix each" is that real performance debugging in DevTools rarely hands you a numbered list — you see one symptom (jank while scrolling) and have to work backward through the Performance tab's flame chart to find which of potentially several compounding causes is actually responsible, then fix, re-profile, and check whether the symptom is gone or just reduced.

</details>

---

**Next → [Week 26: CI/CD & Deployment](Week_26_CICD_and_Deployment.md) · [CI/CD Challenges](Week_26b_CICD_Challenges.md)**
