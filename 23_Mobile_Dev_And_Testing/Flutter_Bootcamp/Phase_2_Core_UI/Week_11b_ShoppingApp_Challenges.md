# Shopping App — Project Challenges

### Companion to [Week 11: Project — Shopping App UI](Week_11_Project_ShoppingApp.md)

---

## How This Works

These extend and stress-test the actual Shopping App you built — the `_addToCart`/`_updateQuantity` mutation logic in `_ShopAppState`, the checkout form, the product-detail-to-cart flow. Mixed formats — see [the full challenge-type roster](../00_CHALLENGE_TYPES.md) for what each icon means.

---

### 🐛 Bug Hunt — The Decrement Button That Crashes on a Fast Double-Tap

This project's own `_updateQuantity` looks like this (from the State Architecture section):

```dart
void _updateQuantity(String productId, String size, int delta) {
  setState(() {
    final item = _cartItems.firstWhere(
      (i) => i.product.id == productId && i.selectedSize == size
    );
    item.quantity += delta;
    if (item.quantity <= 0) {
      _cartItems.remove(item);
    }
  });
}
```

A cart item sits at quantity 1. The user taps the "−" button twice, quickly, before the first tap's rebuild has fully settled. Predict what happens on the second tap's call to `_updateQuantity` — walk through `firstWhere` line by line for that second call.

<details><summary>Diagnosis & Fix</summary>

🔴 **Explanation:** the first tap runs `item.quantity += -1` → quantity becomes `0` → `_cartItems.remove(item)` fires, removing it from the list. If the second tap's `_updateQuantity` call was already queued (both taps registered before either `setState` finished, which is entirely possible with a fast double-tap on a physical device), it calls `firstWhere` against a list that **no longer contains that item** — `firstWhere` with no `orElse:` throws a `StateError: No element` the instant nothing matches. This is a genuinely common real bug in cart UIs: decrement buttons that don't guard against "the item might already be gone by the time this handler runs." The fix uses `firstWhereOrNull` (from `package:collection`, or Dart 3's `firstOrNull` combined with a `where`) and treats "already gone" as a no-op rather than a crash:

```dart
void _updateQuantity(String productId, String size, int delta) {
  setState(() {
    final item = _cartItems
        .where((i) => i.product.id == productId && i.selectedSize == size)
        .firstOrNull;
    if (item == null) return; // already removed by an earlier tap — nothing to do

    item.quantity += delta;
    if (item.quantity <= 0) {
      _cartItems.remove(item);
    }
  });
}
```

The broader lesson: **any handler that looks up an item by ID inside a list the user can also remove items from needs to handle "not found" as a real, expected case — not an exceptional one.**

</details>

---

### 🔬 Diff Detective — Mutate In Place vs. Replace, Inside `setState`

Both of these correctly update the cart quantity and both correctly trigger a rebuild. They're not actually equivalent in every situation, though.

```dart
// Version A — from this project's own _addToCart
void _addToCart(Product product, String size) {
  setState(() {
    final existing = _cartItems.where(
      (item) => item.product.id == product.id && item.selectedSize == size
    ).firstOrNull;
    if (existing != null) {
      existing.quantity++; // mutate the CartItem object already in the list, IN PLACE
    } else {
      _cartItems.add(CartItem(product: product, selectedSize: size));
    }
  });
}
```

```dart
// Version B — replaces the CartItem instead of mutating it
void _addToCartImmutable(Product product, String size) {
  setState(() {
    final index = _cartItems.indexWhere(
      (item) => item.product.id == product.id && item.selectedSize == size
    );
    if (index != -1) {
      final existing = _cartItems[index];
      _cartItems[index] = existing.copyWith(quantity: existing.quantity + 1); // NEW object
    } else {
      _cartItems.add(CartItem(product: product, selectedSize: size));
    }
  });
}
```

Both work identically here. Under what circumstance would Version A's in-place mutation cause a real bug that Version B wouldn't?

<details><summary>The actual difference</summary>

🔴 **Explanation:** inside a plain `StatefulWidget` with `setState`, both work correctly, because `setState`'s job is simply "mark this element dirty and rebuild" — it doesn't care *how* the underlying data changed, only that `setState` was called at all. This is genuinely different from the Provider/Riverpod world you'll reach in Phase 3: if `_cartItems` were instead exposed through a `context.select<CartModel, CartItem>((c) => c.items.firstWhere(...))` (the pattern from [Week 12's selective-rebuild challenges](../Phase_3_State_and_APIs/Week_12b_State_Management_Challenges.md#w12-2-medium--prove-contextselect-narrows-the-rebuild-scope)), Version A's in-place mutation would be a real problem — `select`'s change-detection compares the *selected value* using `==`, and mutating a `CartItem` object in place while `select` is comparing it against **the same object reference** (`existing == existing`, trivially true even after `quantity` changed inside it) could cause a widget watching that specific item to think nothing changed, and silently fail to rebuild. Version B's "always produce a new object" approach is the pattern that survives the transition to Riverpod/Provider unscathed — worth noticing now, before Phase 3 makes it load-bearing.

</details>

---

### 🧩 Code Jumble — Reassemble the Hero Transition

This project's product-detail screen uses a `Hero` to animate the product image from the grid into the detail view (Screen 2). These lines are correct and complete, but shuffled — reassemble the two matching `Hero` widgets (one in the grid card, one in the detail screen).

```
Hero(tag: 'product-${product.id}', child: Image.network(product.imageUrl)),
// --- in HomeTab's product grid card ---
// --- in ProductDetailScreen ---
GestureDetector(onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => ProductDetailScreen(product: product))),
Hero(tag: 'product-${product.id}', child: Image.network(product.imageUrl, height: 300)),
  child: Hero(tag: 'product-${product.id}', child: Image.network(product.imageUrl)),
),
```

<details><summary>Reassembled</summary>

```dart
// --- in HomeTab's product grid card ---
GestureDetector(
  onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => ProductDetailScreen(product: product))),
  child: Hero(tag: 'product-${product.id}', child: Image.network(product.imageUrl)),
),

// --- in ProductDetailScreen ---
Hero(tag: 'product-${product.id}', child: Image.network(product.imageUrl, height: 300)),
```

🔴 **Explanation:** the structural constraint pinning this order down — same lesson as [Week 9's Hero tag-mismatch Bug Hunt](../Phase_2_Core_UI/Week_09b_Animation_Challenges.md#w9-3-medium--reproduce-and-fix-the-hero-tag-mismatch) — is that both `Hero` widgets need the **identical** `tag` string, `'product-${product.id}'`, and the `GestureDetector` wrapping the source `Hero` must live on the *grid card* screen, not the detail screen (you navigate *from* the tapped card *to* the detail screen — the causality only flows one direction). Notice the two `Hero`s don't need identical `child` sizing — the grid version is small, the detail version is `height: 300` — Flutter's Hero flight animates the transform between the two automatically, which is the entire point of using `Hero` over manually coding a custom transition for this exact case.

</details>

---

### 🏗️ Build It Blind — Swipe to Remove From Cart

No starter code. Spec only:

> Add swipe-to-remove on the Cart tab's list items — swiping a cart item left reveals a red "delete" background and removes it from `_cartItems` on full swipe, with an undo `SnackBar` (matching the pattern from this project's own `_addToCart` success snackbar). Decide: does this need a custom `GestureDetector` (like [Week 10's swipe-to-dismiss Boss Battle](../Phase_2_Core_UI/Week_10b_Gesture_Challenges.md#w10-2-hard--build-dismissibles-core-mechanic-from-raw-gestures)), or is there a built-in Flutter widget that already does exactly this?

<details><summary>One reasonable solution</summary>

```dart
Dismissible(
  key: ValueKey('${item.product.id}-${item.selectedSize}'),
  direction: DismissDirection.endToStart,
  background: Container(
    color: Colors.red,
    alignment: Alignment.centerRight,
    padding: const EdgeInsets.only(right: 20),
    child: const Icon(Icons.delete, color: Colors.white),
  ),
  onDismissed: (_) {
    final removedItem = item;
    setState(() => _cartItems.remove(item));

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('${item.product.name} removed'),
        action: SnackBarAction(
          label: 'Undo',
          onPressed: () => setState(() => _cartItems.add(removedItem)),
        ),
      ),
    );
  },
  child: CartItemTile(item: item),
)
```

🔴 **Explanation:** the design question in the spec — build it yourself or reach for `Dismissible` — has a clear answer once you've actually built the raw version in [Week 10's Boss Battle](../Phase_2_Core_UI/Week_10b_Gesture_Challenges.md#w10-2-hard--build-dismissibles-core-mechanic-from-raw-gestures): `Dismissible` **is** that mechanism, already built, tested, and handling edge cases (partial swipes, both-direction dismissal, animation) you'd otherwise have to reimplement. The `key: ValueKey(...)` is not optional here — this is [Week 2's reordering-bug lesson](../Phase_1_Dart_and_Foundations/Week_02b_Widget_Rebuild_Challenges.md#w2-2-medium--keys-and-the-reordering-bug) showing up for real: without a stable per-item key, removing an item from the middle of the list can cause Flutter to reuse the *wrong* element for the item that slides up into that position, potentially replaying the dismiss animation on the wrong tile.

</details>

---

### 👹 Boss Battle — A Promo Code That Recalculates the Cart Live

**The spec:** add a promo code field to the checkout screen (or cart tab) that, when a valid code is entered, applies a discount to `_cartTotal` — live, updating as the user types, not just on a "Submit" button. Combine this project's `_cartTotal` getter, the checkout form's validation patterns from Step 4, and a debounced lookup (codes are "validated" against a simulated async check, the same debounce shape as [Week 8's async validation Bug Hunt](../Phase_2_Core_UI/Week_08b_Forms_Challenges.md#w8-3-hard--debounced-async-validation-and-the-race-condition-it-can-hide)) so you're not re-validating on every single keystroke.

<details><summary>One reasonable solution</summary>

```dart
class _CheckoutScreenState extends State<CheckoutScreen> {
  // ...existing fields from Step 4...
  Timer? _promoDebounce;
  double _discountPercent = 0;
  String? _promoError;

  void _onPromoCodeChanged(String code) {
    _promoDebounce?.cancel();
    if (code.isEmpty) {
      setState(() { _discountPercent = 0; _promoError = null; });
      return;
    }
    _promoDebounce = Timer(const Duration(milliseconds: 500), () async {
      final discount = await _validatePromoCode(code); // simulated async lookup
      if (!mounted) return;
      setState(() {
        _discountPercent = discount ?? 0;
        _promoError = discount == null ? 'Invalid code' : null;
      });
    });
  }

  double get _finalTotal => widget.total * (1 - _discountPercent);

  @override
  void dispose() {
    _promoDebounce?.cancel();
    // ...existing FocusNode disposal from Step 4...
    super.dispose();
  }
}
```

🔴 **Explanation:** this Boss Battle deliberately forces three separate lessons from three different weeks to cooperate in one screen — the debounce-then-validate shape from Week 8 (so typing "SAVE10" doesn't fire five separate lookups for "S", "SA", "SAV"...), the `mounted` guard from Week 3 (the user could navigate away from checkout mid-lookup), and this project's own `_cartTotal`-as-a-getter pattern (here as `_finalTotal`, recomputed live from `_discountPercent` rather than cached and risking going stale the moment the discount changes). Notice `_promoDebounce` gets added to the *existing* `dispose()` method from Step 4 rather than replacing it — a real reminder that extending a project means integrating with what's already there, not just appending code alongside it.

</details>

---

**Next → [Week 12: State Management Deep Dive](../Phase_3_State_and_APIs/Week_12_State_Management_Deep_Dive.md)**
