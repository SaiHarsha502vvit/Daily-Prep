# Widget & Rebuild Challenges

### Companion to [Week 02: Flutter Core Concepts](Week_02_Flutter_Core_Concepts.md)

---

## How This Works

Week 1's challenges were about proving algorithmic complexity with a `Stopwatch`. These are about proving **rebuild behavior** — and the instrument is even simpler: `debugPrint('X built')` inside a `build()` method. Every problem below has you predict what prints, then run it in [DartPad](https://dartpad.dev) and check.

This single technique — sprinkling `debugPrint` in `build()` methods and counting output lines after an interaction — is the actual empirical tool professional Flutter developers use to answer "is this widget rebuilding when it shouldn't be?" before ever opening DevTools. Get fluent with it here.

---

### W2-1 (Easy) — One build() method vs three

**Setup:** this "bad" counter puts everything in one `State.build()`:

```dart
import 'package:flutter/material.dart';

void main() => runApp(const MaterialApp(home: BadCounter()));

class BadCounter extends StatefulWidget {
  const BadCounter({super.key});
  @override
  State<BadCounter> createState() => _BadCounterState();
}

class _BadCounterState extends State<BadCounter> {
  int _count = 0;

  @override
  Widget build(BuildContext context) {
    debugPrint('--- BadCounter.build() ran ---');
    return Scaffold(
      body: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          _buildHeader(),
          Text('$_count', style: const TextStyle(fontSize: 40)),
          ElevatedButton(
            onPressed: () => setState(() => _count++),
            child: const Text('+1'),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    debugPrint('  header rebuilt (expensive!)');
    return const Padding(
      padding: EdgeInsets.all(16),
      child: Text('Welcome', style: TextStyle(fontSize: 24)),
    );
  }
}
```

**Task 1:** predict — tap the button 3 times. How many times does `header rebuilt` print?

**Task 2:** refactor so tapping `+1` never reprints the header. Extract `_buildHeader()` into its own `const` widget class, and extract the counter display into its own small `StatefulWidget` (or pass `_count` down and keep only the `Text` + button inside the parent's build — try the extraction approach first).

<details><summary>Solution & Explanation</summary>

```dart
class BetterCounter extends StatefulWidget {
  const BetterCounter({super.key});
  @override
  State<BetterCounter> createState() => _BetterCounterState();
}

class _BetterCounterState extends State<BetterCounter> {
  int _count = 0;

  @override
  Widget build(BuildContext context) {
    debugPrint('--- BetterCounter.build() ran ---');
    return Scaffold(
      body: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const _Header(), // const — never rebuilds
          _CounterDisplay(count: _count),
          ElevatedButton(
            onPressed: () => setState(() => _count++),
            child: const Text('+1'),
          ),
        ],
      ),
    );
  }
}

class _Header extends StatelessWidget {
  const _Header();
  @override
  Widget build(BuildContext context) {
    debugPrint('  _Header built (should print ONCE, ever)');
    return const Padding(
      padding: EdgeInsets.all(16),
      child: Text('Welcome', style: TextStyle(fontSize: 24)),
    );
  }
}

class _CounterDisplay extends StatelessWidget {
  const _CounterDisplay({required this.count});
  final int count;
  @override
  Widget build(BuildContext context) {
    debugPrint('  _CounterDisplay built');
    return Text('$count', style: const TextStyle(fontSize: 40));
  }
}
```

🔴 **Erklärung:** `header rebuilt` printed **3 times** in the original — every `setState()` re-runs the *entire* `build()` method of the `State` it was called on, and `_buildHeader()` is just a method call inside that method, so it re-executes too. Extracting `_Header` into its own `const` widget class changes the unit of reconciliation: `const _Header()` is the same canonical object instance across every rebuild (the Dart compiler guarantees it), so Flutter's reconciler sees "identical widget, skip" and never even calls its `build()` again. This is [Week 2's](Week_02_Flutter_Core_Concepts.md) `const`-skips-reconciliation rule made visible with real print output, not just described.

</details>

---

### W2-2 (Medium) — Keys and the reordering bug

**Setup:** a list of expandable tiles, each with its own internal `_expanded` state, rendered without keys:

```dart
import 'package:flutter/material.dart';

class Tile {
  Tile(this.id, this.title);
  final String id;
  final String title;
}

class TileList extends StatefulWidget {
  const TileList({super.key});
  @override
  State<TileList> createState() => _TileListState();
}

class _TileListState extends State<TileList> {
  final List<Tile> _tiles = [
    Tile('a', 'Apple'),
    Tile('b', 'Banana'),
    Tile('c', 'Cherry'),
  ];

  void _shuffle() {
    setState(() => _tiles.shuffle());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      floatingActionButton: FloatingActionButton(
        onPressed: _shuffle,
        child: const Icon(Icons.shuffle),
      ),
      body: Column(
        children: [for (final tile in _tiles) ExpandableTile(title: tile.title)],
        // ^ NOTE: no key passed
      ),
    );
  }
}

class ExpandableTile extends StatefulWidget {
  const ExpandableTile({super.key, required this.title});
  final String title;
  @override
  State<ExpandableTile> createState() => _ExpandableTileState();
}

class _ExpandableTileState extends State<ExpandableTile> {
  bool _expanded = false;
  @override
  Widget build(BuildContext context) {
    return ListTile(
      title: Text(widget.title),
      trailing: Icon(_expanded ? Icons.expand_less : Icons.expand_more),
      onTap: () => setState(() => _expanded = !_expanded),
    );
  }
}
```

**Task 1:** tap "Apple" to expand it (icon flips). Tap the shuffle FAB. Predict — which tile's icon is now expanded?

**Task 2:** fix it. `Tile` already has an `id` — use it.

<details><summary>Solution & Explanation</summary>

```dart
Column(
  children: [
    for (final tile in _tiles)
      ExpandableTile(key: ValueKey(tile.id), title: tile.title),
  ],
)
```

🔴 **Erklärung:** without a key, Flutter matches elements to the new widget list by **type and position** — position 0 is always "the `ExpandableTile` element at index 0," regardless of which `Tile` data it's now displaying. After the shuffle, whichever tile lands at index 0 inherits the *expanded element's* `_expanded = true` state, even though it's showing completely different data. `ValueKey(tile.id)` tells Flutter to match by identity instead of position — the element carrying `_expanded = true` now follows "Apple" wherever it moves in the list. This is the exact bug covered in [Week 2's Invisible Machinery section](Week_02_Flutter_Core_Concepts.md) — now you've reproduced it yourself and watched the wrong tile stay "expanded."

</details>

---

### W2-3 (Medium) — Build InheritedWidget from scratch

**Problem:** implement a counter using a raw `InheritedWidget` — no `Provider`, no `Riverpod`. A child widget 3 levels deep must read and increment the count **without** the value being passed down through every constructor in between ("prop drilling").

```dart
class CounterScope extends InheritedWidget {
  const CounterScope({
    super.key,
    required this.count,
    required this.increment,
    required super.child,
  });

  final int count;
  final VoidCallback increment;

  static CounterScope of(BuildContext context) {
    // TODO: return the nearest CounterScope, throw if none found
  }

  @override
  bool updateShouldNotify(CounterScope oldWidget) {
    // TODO
  }
}
```

**Task 1:** complete `of()` and `updateShouldNotify()`. Wire it up so a deeply nested `DisplayCount` widget shows the live count, and a deeply nested `IncrementButton` widget calls `CounterScope.of(context).increment()`.

**Task 2 (the important one):** change `updateShouldNotify` to always `return false`. Tap increment several times. Predict what happens to the displayed count on screen — then explain *why*, referencing what you know about the reconciliation notification cascade.

<details><summary>Solution & Explanation</summary>

```dart
static CounterScope of(BuildContext context) {
  final scope = context.dependOnInheritedWidgetOfExactType<CounterScope>();
  assert(scope != null, 'No CounterScope found in context');
  return scope!;
}

@override
bool updateShouldNotify(CounterScope oldWidget) => count != oldWidget.count;
```

🔴 **Erklärung:** `dependOnInheritedWidgetOfExactType` does two things at once — it finds the nearest ancestor `CounterScope`, **and** it registers the calling element in that `InheritedElement`'s `_dependents` set. When the count changes and the widget rebuilds with a new `CounterScope` instance, Flutter calls `updateShouldNotify(oldWidget)` exactly once; only if it returns `true` does Flutter iterate `_dependents` and call `markNeedsBuild()` on each one. Force it to always return `false` and the underlying `int count` value genuinely changes (you can prove this by also printing `count` inside `increment()`) — but `DisplayCount` never rebuilds, because it was never told to. The screen freezes at whatever value it last painted. This is the notification-cascade mechanism from Week 2, and you just broke it on purpose to see what breaking it looks like.

</details>

---

### W2-4 (Hard, bonus) — Implement Flutter's own reconciliation rule

**Problem:** forget widgets entirely for a moment. Flutter's actual reconciliation rule, reduced to its essence, is: *at each position, if the new widget's runtime type matches the old widget's runtime type, the element is reused; otherwise it's destroyed and recreated.*

Implement that rule as a pure function:

```dart
/// Given the old widget-type sequence and the new one, return, for each
/// index in `newTypes`, whether the element at that position would be
/// REUSED or RECREATED under Flutter's actual algorithm.
List<String> reconcile(List<Type> oldTypes, List<Type> newTypes) {
  // TODO
}

void main() {
  print(reconcile([Icon, Text, Icon], [Icon, Text, Icon]));
  // [REUSED, REUSED, REUSED]

  print(reconcile([Icon, Text, Icon], [Icon, Container, Icon]));
  // [REUSED, RECREATED, REUSED]

  print(reconcile([Icon, Text], [Icon, Text, Icon]));
  // [REUSED, REUSED, RECREATED]  <- new position 2 has no old counterpart
}
```

<details><summary>Solution</summary>

```dart
List<String> reconcile(List<Type> oldTypes, List<Type> newTypes) {
  return [
    for (int i = 0; i < newTypes.length; i++)
      if (i < oldTypes.length && oldTypes[i] == newTypes[i])
        'REUSED'
      else
        'RECREATED',
  ];
}
```

🔴 **Erklärung:** this is deliberately almost too simple — and that's the point. The "magic" of Flutter's reconciliation is nothing more than a single-pass, index-aligned type comparison. There's no tree diffing algorithm, no virtual-DOM-style deep comparison. That simplicity is *why* it's fast (O(n), one pass) — and it's also exactly why reordering a list without keys breaks (W2-2): the algorithm has no concept of "this widget moved," only "type at this position changed or didn't."

</details>

---

## Bonus Round — Mix It Up

Different formats, same topic. See [the full challenge-type roster](../00_CHALLENGE_TYPES.md) for what each icon means.

---

### 🐛 Bug Hunt — The Counter That Updates the Wrong Widget

```dart
class ProductCard extends StatefulWidget {
  const ProductCard({required this.name});
  final String name;
  @override
  State<ProductCard> createState() => _ProductCardState();
}

class _ProductCardState extends State<ProductCard> {
  int _quantity = 1;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(widget.name),
        Text('Qty: $_quantity'),
        ElevatedButton(
          onPressed: () => setState(() => _quantity++),
          child: const Text('+'),
        ),
      ],
    );
  }
}

// Rendered as:
class ProductGrid extends StatelessWidget {
  const ProductGrid({required this.names});
  final List<String> names;
  @override
  Widget build(BuildContext context) {
    return Column(children: names.map((n) => ProductCard(name: n)).toList());
  }
}
```

This one doesn't crash and doesn't obviously misbehave for a static list. The bug shows up the moment `names` changes — say, a search filter removes the second product from a 3-product list. Predict what happens to the quantities shown for the remaining products before opening the answer.

<details><summary>Diagnosis & Fix</summary>

Remove the second product ("Banana," say) from a 3-item list `['Apple', 'Banana', 'Cherry']` where you'd bumped Banana's and Cherry's quantities to 3 and 2 respectively. After the filter, the list is `['Apple', 'Cherry']` — and the quantity that displays for Cherry is **Banana's old quantity (3)**, not Cherry's own (2).

🔴 **Explanation:** no `key` is passed to `ProductCard` in the `.map()` call — exactly the mechanism from [W2-2](#w2-2-medium--keys-and-the-reordering-bug), but arriving via list *removal* instead of shuffling. Flutter matches elements by type-and-position: position 1 used to hold "Banana"'s element (internal `_quantity = 3`), and after removal, position 1 holds "Cherry"'s widget — but Flutter reuses the *element* at position 1, carrying over its `_quantity = 3` state, not Cherry's actual `_quantity = 2`. Fix: `ProductCard(key: ValueKey(n), name: n)` — same fix as W2-2, different trigger (filtering, not reordering) to prove the bug isn't specific to one kind of list mutation.

</details>

---

### 🎭 Two Truths and a Lie — `const` and Rebuilds

**A.** A `const` widget is guaranteed to be the exact same object instance across every rebuild where it's constructed with identical arguments.

**B.** Marking a widget `const` prevents its `State` object from ever being recreated, even if its parent's `key` changes.

**C.** Two separately-written `const Text('Hi')` expressions, in different files, still produce the same canonical object at runtime.

<details><summary>Which one's the lie</summary>

**B is the lie.** `const` has nothing to do with element/state identity across a `key` change — if the `key` on a widget changes, Flutter treats it as a fundamentally different widget regardless of whether it's `const`, tears down the old element, and creates a new one (running `initState` fresh). `const` only means "this exact widget instance is reused across rebuilds *at the same position with the same key* when the constructor arguments are identical" — it has no power to override key-based identity, which always wins.

🔴 **Explanation:** this distinction matters because it's tempting to think "`const` = never rebuilds, ever" as an absolute rule. It's a rule about *reconciliation shortcuts*, not about overriding the fundamental type-and-key matching algorithm from [W2-4](#w2-4-hard-bonus--implement-flutters-own-reconciliation-rule). A and C are both true: constant expressions are canonicalized by the Dart compiler at compile time — identical `const` expressions anywhere in your codebase really do collapse to one shared object.

</details>

---

### ⚡ Speed Round — 5 Questions, 2 Minutes

1. Does calling `setState(() {})` with an **empty** callback body still trigger a rebuild?
2. If a `StatelessWidget`'s constructor arguments never change, does Flutter still call `build()` again when its parent rebuilds?
3. Is `BuildContext` the same object across every call to a widget's `build()` method, or a new one each time?
4. Does wrapping a widget in `RepaintBoundary` change whether it *rebuilds* (widget tree), or only whether it *repaints* (paint layer)?
5. Can two different `Element`s in the tree simultaneously hold references to the exact same `const` widget instance?

<details><summary>Answers</summary>

1. **Yes.** `setState`'s job is just "mark this element dirty" — the callback body content is irrelevant to that; even an empty one triggers a rebuild.
2. **Yes, by default.** Unless that `StatelessWidget` is itself `const`, Flutter still calls its `build()` again — being a `StatelessWidget` alone doesn't skip rebuilds, only `const` (or manual `shouldRebuild`-style optimizations) does.
3. **The same object**, for as long as the element stays mounted at that position — `BuildContext` *is* the `Element`, and the element persists across rebuilds (that's the whole point of the three-tree model from this week).
4. **Only repainting**, not rebuilding. `RepaintBoundary` isolates the *paint* layer into its own GPU-cacheable layer — the widget/element tree reconciliation still happens normally above and below it.
5. **Yes** — that's exactly what "canonicalized" means; the same `const` widget object can legitimately be referenced from multiple places in the tree simultaneously (e.g., the same `const Divider()` used in ten different list separators).

</details>

---

### 🏗️ Build It Blind — A Rebuild-Scope Debugging Tool

No starter code. Spec only:

> Build something reusable that wraps any widget and, whenever that widget rebuilds, briefly flashes a colored border around it for 200ms before fading out — purely as a visual debugging aid to spot unexpected rebuilds during development, without needing to add `debugPrint` everywhere by hand.

Decide the API yourself: is it a widget wrapper? A function? What does it need to detect "a rebuild happened," given that a `StatelessWidget` has no lifecycle hook that fires specifically on rebuild? Think before you open the solution — this is the hard part of the exercise.

<details><summary>One reasonable solution</summary>

```dart
class RebuildFlash extends StatefulWidget {
  const RebuildFlash({super.key, required this.child});
  final Widget child;
  @override
  State<RebuildFlash> createState() => _RebuildFlashState();
}

class _RebuildFlashState extends State<RebuildFlash> {
  @override
  Widget build(BuildContext context) {
    // build() itself IS the rebuild signal — every call to this method
    // means Flutter decided this element needs rebuilding.
    Future.microtask(() => setState(() {})); // trivial: real version would drive an AnimationController
    return Container(
      decoration: BoxDecoration(border: Border.all(color: Colors.red, width: 2)),
      child: widget.child,
    );
  }
}
```

🔴 **Explanation:** the key design insight — the one you had to arrive at yourself — is that `build()` being **called at all** is the rebuild signal; there's no separate "onRebuild" callback because `build()` running *is* what a rebuild means. A fuller version would drive an `AnimationController` that resets to full opacity and fades out on every `build()` call, rather than the toy `Future.microtask` placeholder above (left simplified so the core insight isn't buried in animation boilerplate). If your solution reached for `didUpdateWidget` instead — reasonable instinct, but note it only fires when the widget is reused with new constructor args, not on every rebuild in general (a rebuild can also be triggered by an ancestor's `InheritedWidget` change, which doesn't call `didUpdateWidget`).

</details>

---

**Next → [Week 3: Widget Lifecycle](Week_03_Widget_Lifecycle.md) · [Lifecycle Challenges](Week_03b_Lifecycle_Challenges.md)**
