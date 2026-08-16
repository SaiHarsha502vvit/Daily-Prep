# InheritedWidget & Keys Challenges

### Companion to [DOC_05: InheritedWidget & Keys](DOC_05_InheritedWidget_Keys.md)

---

## How This Works

Keys look simple until you use the wrong *type* of key for the wrong reason — several of these are about picking the right key, not just using *a* key. Mixed formats — see [the full challenge-type roster](../00_CHALLENGE_TYPES.md) for what each icon means.

---

### 🐛 Bug Hunt — The ObjectKey That Doesn't Actually Key Anything

```dart
class ProductList extends StatelessWidget {
  const ProductList({super.key, required this.productNames});
  final List<String> productNames;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: productNames.map((name) {
        final product = Product(name: name); // NEW Product instance, every single build
        return ProductCard(key: ObjectKey(product), product: product);
      }).toList(),
    );
  }
}
```

`Product` doesn't override `==`. The developer read this doc's own guidance — "if your objects don't override `==`, use `ObjectKey`" — and did exactly that. Reordering `productNames` still causes the exact same state-leaking bug [Week 2's reordering challenge](../Phase_1_Dart_and_Foundations/Week_02b_Widget_Rebuild_Challenges.md#w2-2-medium--keys-and-the-reordering-bug) describes, as if there were no key at all. Why did following the doc's own advice not fix it?

<details><summary>Diagnosis & Fix</summary>

🔴 **Explanation:** `ObjectKey` uses `identical()` — reference equality — which is exactly the right tool *when the same object instance persists across rebuilds*. Here, `Product(name: name)` is constructed **fresh, inline, inside the `.map()`**, on every single `build()` call — meaning `ObjectKey(product)` wraps a **brand-new object reference every time**, even when conceptually "the same product" (same name) is still in the list. `identical(oldProduct, newProduct)` is `false` for two separately-constructed objects regardless of whether their fields match, so Flutter sees a different key on every rebuild and can't actually track identity across reorders at all — the key changes just as much as if there were no key. This isn't `ObjectKey` being the wrong *type* of key in the abstract — the doc's guidance is correct as far as it goes — it's `ObjectKey` being handed an object that was never stable to begin with. Two real fixes:

```dart
// Fix A — the object itself should already exist stably (don't reconstruct it every build)
class ProductList extends StatelessWidget {
  const ProductList({super.key, required this.products}); // List<Product>, built ONCE upstream
  final List<Product> products;
  @override
  Widget build(BuildContext context) {
    return Column(
      children: products.map((p) => ProductCard(key: ObjectKey(p), product: p)).toList(),
    );
  }
}

// Fix B — simpler: just use ValueKey on a genuinely stable field (the name/id), matching this doc's own decision chart
ProductCard(key: ValueKey(product.name), product: product)
```

The general lesson: **`ObjectKey` is only as stable as the object reference you give it** — if you're reconstructing "the same" data into a new object every build, `ObjectKey` inherits that instability instead of fixing it. `ValueKey` on a genuinely stable identifier (an ID string, a name) sidesteps the whole problem, which is why this doc's own decision chart defaults to `ValueKey(item.id)` as the first recommendation for list-reordering, not `ObjectKey`.

</details>

---

### 🎭 Two Truths and a Lie — GlobalKey and PageStorageKey

**A.** The same `GlobalKey` instance can be assigned to two different widgets simultaneously, as long as only one of them is actually mounted in the tree at any given moment.

**B.** Moving a widget carrying a `GlobalKey` from one position in the tree to a completely different position (not just reordering — an entirely different parent) preserves that widget's `State`, rather than destroying and recreating it.

**C.** `PageStorageKey` stores its value keyed to the nearest `PageStorage` ancestor — which means two `ListView`s with the *same* `PageStorageKey` string, but living under two *different* `PageStorage` ancestors, don't actually conflict with each other.

<details><summary>Which one's the lie</summary>

**A is the lie**, and it's directly contradicted by this doc's own stated caveat: "One GlobalKey can only be used in ONE location at a time." Assigning the same `GlobalKey` to two simultaneously-mounted widgets is a framework error, not a soft warning — Flutter throws an assertion in debug mode ("Duplicate GlobalKey detected in widget tree"), specifically because a `GlobalKey`'s entire purpose is being a unique, tree-wide handle to exactly one live `Element`; two widgets claiming the same handle at once makes that handle ambiguous.

🔴 **Explanation:** B is true and is genuinely one of the more surprising, powerful things a `GlobalKey` can do — this doc's own caveat list names it directly ("useful for keeping a video playing while navigating"): because Flutter tracks the `Element` by the `GlobalKey` itself rather than by tree position, relocating the *widget* to a new parent doesn't force element destruction the way a normal type-and-position mismatch would. C is also true, and worth knowing precisely — `PageStorageKey` uniqueness is scoped to its nearest `PageStorage` ancestor (which `Scaffold` provides automatically, per this doc), so the "must be unique" constraint is local to that scope, not global across the whole app the way `GlobalKey` uniqueness is.

</details>

---

### 🔬 Diff Detective — Two Reasons to Change a Key

Both of these change a widget's key on purpose. They're solving different problems, and mixing them up produces the wrong bug.

```dart
// Version A
Text(count.toString(), key: ValueKey(count))
// used inside an AnimatedSwitcher
```

```dart
// Version B
MyStatefulWidget(key: UniqueKey())
// _key reassigned inside setState(() => _key = UniqueKey())
```

<details><summary>The actual difference</summary>

🔴 **Explanation:** Version A changes key **only when the underlying value actually changes** (`count` going from 4 to 5 produces a genuinely different `ValueKey`) — this doc's own content names this exact pattern as how `AnimatedSwitcher` knows "this is conceptually a *different* child now, play the transition," while `count` staying the same (a rebuild for an unrelated reason) keeps the same key, correctly skipping the animation. Version B changes key **unconditionally, every time it's called**, regardless of any underlying value — `UniqueKey()` generates a fresh, un-equal-to-anything identity on every construction, which is precisely the "force a widget to lose all its internal state and start over" tool this doc names directly. Using B's unconditional-reset pattern where A's value-tracking pattern was needed (e.g., wrapping every rebuild in a fresh `UniqueKey()`, not just intentional resets) would destroy and recreate the widget's `State` on *every single rebuild* — silently wiping any internal state (scroll position, form input, animation progress) far more often than intended. The distinguishing question worth asking before reaching for either: **do I want this widget's identity tied to a specific value (use `ValueKey`), or do I want a one-time, deliberate "start completely over" (use `UniqueKey`, and only trigger it explicitly, not on every build)?**

</details>

---

### 👹 Boss Battle — A Correctly-Keyed Reorderable List, With a Live Total

**The spec:** build a reorderable shopping list (`ReorderableListView`) where each item is a `StatefulWidget` tracking its own "checked" state (a checkbox), **and** the list is wrapped in a minimal custom `InheritedWidget` (`CartTotalScope`, following this doc's own `AuthInherited` pattern) exposing a live running total of checked items' prices to a header widget elsewhere in the tree. Requirements: (1) reordering items must never scramble which item is checked — the exact bug from [Week 2's W2-2 challenge](../Phase_1_Dart_and_Foundations/Week_02b_Widget_Rebuild_Challenges.md#w2-2-medium--keys-and-the-reordering-bug), now with the added wrinkle of `ReorderableListView` specifically requiring keys to function at all, (2) `CartTotalScope`'s `updateShouldNotify` must correctly detect when the total changes and only rebuild the header then, not on every checkbox tap that doesn't change the total (e.g., unchecking then rechecking the same item back to its original state).

<details><summary>One reasonable solution</summary>

```dart
class CartTotalScope extends InheritedWidget {
  const CartTotalScope({super.key, required this.total, required super.child});
  final double total;

  static double of(BuildContext context) {
    final scope = context.dependOnInheritedWidgetOfExactType<CartTotalScope>();
    assert(scope != null, 'No CartTotalScope found in context');
    return scope!.total;
  }

  @override
  bool updateShouldNotify(CartTotalScope oldWidget) => total != oldWidget.total;
}

class ShoppingListScreen extends StatefulWidget {
  const ShoppingListScreen({super.key});
  @override
  State<ShoppingListScreen> createState() => _ShoppingListScreenState();
}

class _ShoppingListScreenState extends State<ShoppingListScreen> {
  List<CartItem> _items = [/* ... */];

  double get _total => _items.where((i) => i.isChecked).fold(0, (sum, i) => sum + i.price);

  void _onReorder(int oldIndex, int newIndex) {
    setState(() {
      if (newIndex > oldIndex) newIndex -= 1;
      final item = _items.removeAt(oldIndex);
      _items.insert(newIndex, item);
    });
  }

  void _onToggle(String id) {
    setState(() {
      _items = _items.map((i) => i.id == id ? i.copyWith(isChecked: !i.isChecked) : i).toList();
    });
  }

  @override
  Widget build(BuildContext context) {
    return CartTotalScope(
      total: _total,
      child: Scaffold(
        appBar: AppBar(title: const _TotalHeader()),
        body: ReorderableListView(
          onReorder: _onReorder,
          children: [
            for (final item in _items)
              CheckableRow(key: ValueKey(item.id), item: item, onToggle: () => _onToggle(item.id)),
          ],
        ),
      ),
    );
  }
}

class _TotalHeader extends StatelessWidget {
  const _TotalHeader();
  @override
  Widget build(BuildContext context) {
    final total = CartTotalScope.of(context);
    debugPrint('_TotalHeader rebuilt — total=$total');
    return Text('Total: \$${total.toStringAsFixed(2)}');
  }
}
```

🔴 **Explanation:** `ValueKey(item.id)` on `CheckableRow` is what makes `ReorderableListView` (which, per Flutter's own requirement, needs every child keyed to function at all — the same underlying mechanism, not a special exception to it) correctly follow each item's checked state to wherever it lands after a drag, rather than the position-based reuse bug from Week 2. `CartTotalScope.updateShouldNotify` comparing `total != oldWidget.total` — not just "did the widget rebuild" — is what makes requirement (2) work: toggling item A off then back on produces the same `_total` as before both taps, so the second `CartTotalScope` rebuild's `updateShouldNotify` correctly returns `false`, and `_TotalHeader`'s `debugPrint` does **not** fire for that round trip, even though `_ShoppingListScreenState.build()` itself ran twice. This is [DOC_05's own `updateShouldNotify` mechanism](DOC_05_InheritedWidget_Keys.md#how-dependoninheritedwidgetofexacttype-works-internally) doing real, observable work — not every widget rebuild propagates to every dependent, only the ones where the notify check actually says something changed.

</details>

---

**Next → [DOC_06: Async Patterns Complete](DOC_06_Async_Patterns_Complete.md) · [Async Patterns Challenges](DOC_06b_Async_Patterns_Challenges.md)**
