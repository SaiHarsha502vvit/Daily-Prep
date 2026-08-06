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

**Next → [Week 3: Widget Lifecycle](Week_03_Widget_Lifecycle.md) · [Lifecycle Challenges](Week_03b_Lifecycle_Challenges.md)**
