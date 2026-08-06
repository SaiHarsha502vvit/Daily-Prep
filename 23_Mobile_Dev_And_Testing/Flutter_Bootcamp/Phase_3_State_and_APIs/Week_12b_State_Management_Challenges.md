# State Management Challenges

### Companion to [Week 12: State Management Deep Dive](Week_12_State_Management_Deep_Dive.md)

---

## How This Works

Same `debugPrint`-in-`build()` instrument as [Week 2's challenges](../Phase_1_Dart_and_Foundations/Week_02b_Widget_Rebuild_Challenges.md), applied one level up — to `ChangeNotifier`-based app state instead of raw widget state. Paste starters into [DartPad](https://dartpad.dev).

---

### W12-1 (Medium) — ChangeNotifier + ListenableBuilder, no package

**Problem:** build a working counter using raw `ChangeNotifier` and `ListenableBuilder` — no `provider` package, no `Riverpod`. This proves the mechanism those packages are built on top of.

```dart
class CounterModel extends ChangeNotifier {
  int _count = 0;
  int get count => _count;

  void increment() {
    _count++;
    notifyListeners();
  }
}

class CounterScreen extends StatelessWidget {
  CounterScreen({super.key});
  final CounterModel _model = CounterModel();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: ListenableBuilder(
          listenable: _model,
          builder: (context, child) {
            debugPrint('Rebuilding — count is now ${_model.count}');
            return Text('${_model.count}', style: const TextStyle(fontSize: 40));
          },
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _model.increment,
        child: const Icon(Icons.add),
      ),
    );
  }
}
```

**Task:** run it, tap the FAB a few times, confirm the print fires and the count updates. Then **remove** the `notifyListeners()` call from `increment()` and predict — does `_count` still increase internally? Does the screen still show the new value?

<details><summary>Explanation</summary>

With `notifyListeners()` removed: `_count` genuinely does increase (tap the FAB, check with a separate `debugPrint(_model.count)` inside `increment()` itself) — but the screen shows `0` forever, no rebuild print ever fires again.

🔴 **Explanation:** `ListenableBuilder` (and everything built on top of it — `Provider`'s `Consumer`, `ChangeNotifierProvider` + `context.watch`) works by subscribing a listener callback to the `ChangeNotifier` via `addListener()`. `notifyListeners()` is the **only** thing that invokes those callbacks — it's a plain method call iterating an internal `List<VoidCallback>`, nothing magical. The underlying `_count` field changing is completely invisible to Flutter's widget tree unless something explicitly announces the change. This is the entire mechanism behind every "why isn't my Provider updating the UI" bug: somewhere, a mutation happened without a paired `notifyListeners()`.

</details>

---

### W12-2 (Medium) — Prove `context.select` narrows the rebuild scope

**Problem:** a `CartModel` tracks both `items` (with a computed `total`) and an unrelated `lastViewedProductId`. Build two widgets: one using `context.watch<CartModel>()` (rebuilds on *any* change), one using `context.select<CartModel, double>((c) => c.total)` (should rebuild only when `total` changes).

```dart
class CartModel extends ChangeNotifier {
  final List<double> _prices = [];
  String? lastViewedProductId;

  double get total => _prices.fold(0, (a, b) => a + b);

  void addItem(double price) {
    _prices.add(price);
    notifyListeners();
  }

  void viewProduct(String id) {
    lastViewedProductId = id; // changes something UNRELATED to total
    notifyListeners();
  }
}

class WatchTotal extends StatelessWidget {
  const WatchTotal({super.key});
  @override
  Widget build(BuildContext context) {
    final total = context.watch<CartModel>().total;
    debugPrint('WatchTotal rebuilt — total=$total');
    return Text('Watch: \$$total');
  }
}

class SelectTotal extends StatelessWidget {
  const SelectTotal({super.key});
  @override
  Widget build(BuildContext context) {
    final total = context.select<CartModel, double>((c) => c.total);
    debugPrint('SelectTotal rebuilt — total=$total');
    return Text('Select: \$$total');
  }
}
```

**Task:** wire both widgets under a `ChangeNotifierProvider<CartModel>`, and add a button calling `viewProduct('some-id')` (which changes something the `total` getter doesn't depend on). Tap it. Predict — does `WatchTotal` print? Does `SelectTotal`?

<details><summary>Answer & Explanation</summary>

`WatchTotal` prints on every `viewProduct()` call, even though `total` never changed. `SelectTotal` does **not** print on `viewProduct()` calls — only when a call actually changes what `total` evaluates to (i.e., `addItem()`).

🔴 **Explanation:** `context.watch<CartModel>()` registers the widget as a dependent on the *entire* `CartModel` — any `notifyListeners()` call, for any reason, triggers a rebuild. `context.select<CartModel, double>((c) => c.total)` registers with a **selector function** attached; on every `notifyListeners()`, it re-runs `(c) => c.total` and compares the new result to the previous one, only scheduling a rebuild if that specific derived value actually changed. This is the exact mechanism from [Week 12's Invisible Machinery](Week_12_State_Management_Deep_Dive.md) — a real, measurable difference in a large app where dozens of widgets watch one big model but each only cares about a slice of it.

</details>

---

### W12-3 (Easy) — Reproduce the `watch`-in-a-callback crash

**Problem:**

```dart
ElevatedButton(
  onPressed: () {
    context.watch<CartModel>().addItem(9.99); // BUG
  },
  child: const Text('Add item'),
)
```

**Task:** run this inside a widget under a `ChangeNotifierProvider`, tap the button, and read the **exact** exception message. Then fix it with the correct method for use inside a callback.

<details><summary>Solution & Explanation</summary>

```dart
onPressed: () {
  context.read<CartModel>().addItem(9.99);
},
```

The exception reads roughly: *"Tried to listen to a value exposed with provider, from outside of the widget tree... This can happen if you used context.watch on a widget event handler..."*

🔴 **Explanation:** `context.watch<T>()` calls `dependOnInheritedWidgetOfExactType` under the hood ([Week 2's mechanism](../Phase_1_Dart_and_Foundations/Week_02b_Widget_Rebuild_Challenges.md)), which requires the calling element to currently be *building* — it registers "this element, which is mid-`build()`, depends on this value." A button's `onPressed` callback runs completely outside the build phase, potentially long after the widget last built, so there's no valid element-in-the-middle-of-building to register. `context.read<T>()` skips that registration entirely — it just fetches the current value once, which is exactly what a callback needs (fire an action, don't subscribe to future changes).

</details>

---

### W12-4 (Medium) — Ephemeral vs app state: classify and justify

**Problem:** for each of these, decide: does it belong in local `setState` (ephemeral — this widget and only this widget cares), or in a `ChangeNotifier`/shared provider (app state — other, possibly distant, parts of the tree need it too)? Write one sentence of justification for each before checking the answer.

1. Whether a password field's text is currently obscured or visible
2. The list of items in a shopping cart
3. Which tab is currently selected in a `BottomNavigationBar`
4. The currently logged-in user
5. The scroll position of one specific list, used only to show/hide a "scroll to top" button on that same screen
6. Whether dark mode is enabled

<details><summary>Answers</summary>

1. **Ephemeral.** Only the password field widget itself needs to know this; no other part of the app could possibly care.
2. **App state.** The cart badge in a bottom nav bar, the checkout screen, and the cart screen all need the same data simultaneously — that's the textbook case for a shared provider.
3. **It depends — usually ephemeral, but reason about it explicitly.** If nothing outside the tab bar's own screen needs to know the current index, it's ephemeral. If, say, a deep link needs to programmatically switch tabs, or an analytics service logs tab changes from elsewhere, it becomes app state.
4. **App state.** Nearly every screen in the app potentially needs to know who's logged in — the canonical example of state that must be shared widely.
5. **Ephemeral.** Scoped entirely to one screen's own scroll behavior; nothing else in the app needs this number.
6. **App state.** Every screen's `Theme` needs to reflect this — it's global by definition.

🔴 **Explanation:** the actual test isn't "is this simple" or "is this just a boolean" — plenty of ephemeral state (password visibility) is a boolean, and plenty of app state (cart contents) is complex. The test from [Week 12](Week_12_State_Management_Deep_Dive.md) is: **does any widget outside this one's own subtree need to read or react to this value?** If the honest answer is no, `setState` is not just acceptable, it's *correct* — reaching for a `ChangeNotifier`/`Provider` for state nothing else needs adds indirection with zero benefit. #3 is deliberately ambiguous because that judgment call is the actual skill being tested, not a fact to memorize.

</details>

---

## Bonus Round — Mix It Up

Different formats, same topic. See [the full challenge-type roster](../00_CHALLENGE_TYPES.md) for what each icon means.

---

### 🕵️ Code Review — Three Comments on One Provider Setup

```dart
class AppState extends ChangeNotifier {
  List<String> favorites = [];
  int themeIndex = 0;

  void toggleFavorite(String id) {
    // 💬 Reviewer: "this mutates favorites in place — is that actually safe here?"
    if (favorites.contains(id)) {
      favorites.remove(id);
    } else {
      favorites.add(id);
    }
  }
}

// main.dart
void main() {
  runApp(
    ChangeNotifierProvider(
      // 💬 Reviewer: "won't this get recreated every time MyApp rebuilds?"
      create: (_) => AppState(),
      child: const MyApp(),
    ),
  );
}

class FavoritesBadge extends StatelessWidget {
  const FavoritesBadge({super.key});
  @override
  Widget build(BuildContext context) {
    // 💬 Reviewer: "this rebuilds on EVERY AppState change, not just favorites — intentional?"
    final state = context.watch<AppState>();
    return Text('${state.favorites.length}');
  }
}
```

<details><summary>What each comment means, and the fixes</summary>

**Comment 1 (in-place mutation safety):** this one is actually **fine as written**, and the useful lesson is recognizing *why*: `notifyListeners()` doesn't care whether the underlying data structure was mutated in place or replaced with a new instance — it's a plain method call, not something that diffs old vs. new state. `favorites.add(id)` followed by `notifyListeners()` correctly triggers all listening widgets to rebuild and read the now-updated list. Where in-place mutation *does* bite you is if some other part of your code cached a reference to the old list expecting it to stay unchanged (e.g., passed it to something doing `oldList != newList` comparison) — not the case here.

**Comment 2 (recreated every rebuild):** legitimate concern in general, but the reviewer is looking at the wrong layer — `ChangeNotifierProvider`'s `create` callback is only invoked **once**, lazily, the first time the provider is actually needed, regardless of how many times `MyApp` (a *descendant* of the provider, not an ancestor) rebuilds. The `create:` callback isn't re-run on every rebuild of things below it in the tree — it would only be a problem if `ChangeNotifierProvider` itself were nested somewhere that rebuilds frequently (e.g., inside a list item), which it isn't here, sitting at the app root.

**Comment 3 (over-broad rebuild) — this one's real:**

```dart
final count = context.select<AppState, int>((s) => s.favorites.length);
return Text('$count');
```

🔴 **Explanation:** the pattern worth internalizing from this Code Review — not every reviewer comment points at an actual bug (1 and 2 here are false alarms, and recognizing *why* they're false alarms is as valuable as fixing the real one), but comment 3 is the exact [W12-2 lesson](#w12-2-medium--prove-contextselect-narrows-the-rebuild-scope) showing up in a realistic setting: `themeIndex` changing anywhere in the app would rebuild `FavoritesBadge` under `context.watch`, even though it displays nothing related to the theme.

</details>

---

### 🧩 Code Jumble — Reassemble the InheritedWidget `of()` Pattern

Correct, complete, shuffled. This is the canonical `of(context)` static method pattern used by nearly every Flutter-provided InheritedWidget-based API.

```
    return result;
  static CartScope of(BuildContext context) {
    assert(result != null, 'No CartScope found in context');
class CartScope extends InheritedWidget {
    final result = context.dependOnInheritedWidgetOfExactType<CartScope>();
  }
```

<details><summary>Reassembled</summary>

```dart
class CartScope extends InheritedWidget {
  static CartScope of(BuildContext context) {
    final result = context.dependOnInheritedWidgetOfExactType<CartScope>();
    assert(result != null, 'No CartScope found in context');
    return result!;
  }
}
```

🔴 **Explanation:** the ordering constraint that pins this down: you can't `assert` on `result` before it's been assigned, and you can't `return` it before either the lookup or the assertion — three lines with exactly one valid relative order (lookup, then check, then return). This is the identical shape used by `Theme.of`, `MediaQuery.of`, `Provider.of`, and the `CounterScope.of` you hand-built back in [Week 2's InheritedWidget challenge](../Phase_1_Dart_and_Foundations/Week_02b_Widget_Rebuild_Challenges.md#w2-3-medium--build-inheritedwidget-from-scratch) — recognizing this exact three-line skeleton is worth more than memorizing any single example of it.

</details>

---

### 👹 Boss Battle — A Selective-Rebuild Shopping Cart

**The spec:** build a `CartModel extends ChangeNotifier` tracking a `List<CartItem>` (each with `name`, `price`, `quantity`) plus an unrelated `String? promoCode`. Then build a screen with: (1) a cart-total display that must **only** rebuild when the total price changes, (2) an item-count badge that must **only** rebuild when the number of distinct items changes, (3) a promo-code banner that must **only** rebuild when `promoCode` changes. All three widgets sit on screen simultaneously, watching the same `CartModel`. Prove with `debugPrint` that changing `promoCode` alone doesn't rebuild either of the other two.

<details><summary>Solution</summary>

```dart
class CartItem {
  CartItem({required this.name, required this.price, required this.quantity});
  final String name;
  final double price;
  final int quantity;
}

class CartModel extends ChangeNotifier {
  final List<CartItem> items = [];
  String? promoCode;

  double get total => items.fold(0, (sum, i) => sum + i.price * i.quantity);

  void addItem(CartItem item) {
    items.add(item);
    notifyListeners();
  }

  void setPromoCode(String? code) {
    promoCode = code;
    notifyListeners();
  }
}

class TotalDisplay extends StatelessWidget {
  const TotalDisplay({super.key});
  @override
  Widget build(BuildContext context) {
    final total = context.select<CartModel, double>((c) => c.total);
    debugPrint('TotalDisplay rebuilt: \$$total');
    return Text('Total: \$$total');
  }
}

class ItemCountBadge extends StatelessWidget {
  const ItemCountBadge({super.key});
  @override
  Widget build(BuildContext context) {
    final count = context.select<CartModel, int>((c) => c.items.length);
    debugPrint('ItemCountBadge rebuilt: $count items');
    return Text('$count items');
  }
}

class PromoBanner extends StatelessWidget {
  const PromoBanner({super.key});
  @override
  Widget build(BuildContext context) {
    final code = context.select<CartModel, String?>((c) => c.promoCode);
    debugPrint('PromoBanner rebuilt: $code');
    return code != null ? Text('Code applied: $code') : const SizedBox();
  }
}
```

🔴 **Explanation:** this is [W12-2's](#w12-2-medium--prove-contextselect-narrows-the-rebuild-scope) single-selector proof scaled up to three independent selectors watching **the same underlying model simultaneously** — each widget's `context.select` runs its own selector function on every `notifyListeners()` call, and each independently decides whether *its* derived value changed. Calling `setPromoCode('SAVE10')` fires `notifyListeners()` once, all three selectors re-evaluate, but only `PromoBanner`'s selector result actually changed — so only its `debugPrint` fires. This is precisely how a real production app's cart screen avoids the naive "one `context.watch` at the top, everything rebuilds on every change" trap at scale, with dozens of pieces of UI all watching one shared model.

</details>

---

**Next → [Week 13: Riverpod](Week_13_Riverpod.md) · [Riverpod Challenges](Week_13b_Riverpod_Challenges.md)**
