# Week 11 — State Management Deep Dive
### Why setState() breaks at scale, and the pattern that fixes it

---

## 1. The Problem — Prop Drilling

You felt this in Phase 2 when you had to lift cart state to `MainScreen` and thread it through 3 levels of widgets. That was with 4 screens. Imagine 20.

```
MainScreen (_cartItems, _addToCart)
  └── HomeTab(onAddToCart: _addToCart)
        └── RestaurantListing(onAddToCart: onAddToCart)
              └── MenuItem(onAddToCart: onAddToCart)
                    └── AddButton(onTap: () => onAddToCart(item))
```

Every layer that doesn't use the data still has to pass it down. This is **prop drilling** — it creates tight coupling, makes refactoring painful, and fills constructors with parameters only needed 3 levels deeper.

The real problem isn't `setState()`. It's that state lives in the wrong place.

---

## 2. How Flutter Actually Passes Data — InheritedWidget

Before Riverpod, Provider, or BLoC existed, Flutter shipped with `InheritedWidget`. Everything else is built on top of it. Understanding it makes everything else click.

```dart
// A widget that holds data and makes it available to all descendants
class ThemeData extends InheritedWidget {
  final Color primaryColor;
  final double fontSize;

  const ThemeData({
    super.key,
    required this.primaryColor,
    required this.fontSize,
    required super.child,
  });

  // The static method descendants call to access this data
  static ThemeData of(BuildContext context) {
    final data = context.dependOnInheritedWidgetOfExactType<ThemeData>();
    assert(data != null, 'No ThemeData found in widget tree');
    return data!;
  }

  // Return true if the data changed and descendants should rebuild
  @override
  bool updateShouldNotify(ThemeData oldWidget) {
    return oldWidget.primaryColor != primaryColor ||
           oldWidget.fontSize != fontSize;
  }
}
```

Place it high in the tree:
```dart
ThemeData(
  primaryColor: Colors.deepPurple,
  fontSize: 16,
  child: MaterialApp(/* ... */),
)
```

Access it from anywhere below:
```dart
// No prop drilling — any widget anywhere in the tree can call this
final theme = ThemeData.of(context);
```

This is exactly how `Theme.of(context)`, `MediaQuery.of(context)`, and `Navigator.of(context)` work internally. You've been using `InheritedWidget` all along.

**The downside of raw `InheritedWidget`:** it's immutable. To update the data, you have to wrap it in a `StatefulWidget` that rebuilds the `InheritedWidget` with new data. It works, but it's verbose. This is why `ChangeNotifier` + `Provider` exists.

---

## 3. ChangeNotifier — Mutable State That Notifies

`ChangeNotifier` is a class that holds mutable state and announces when it changes. Any widget listening to it rebuilds automatically.

```dart
class CartModel extends ChangeNotifier {
  final List<CartItem> _items = [];

  List<CartItem> get items => List.unmodifiable(_items);

  int get totalItems => _items.fold(0, (sum, item) => sum + item.quantity);

  double get totalPrice => _items.fold(
    0.0, (sum, item) => sum + item.price * item.quantity,
  );

  void addItem(MenuItem menuItem) {
    final existing = _items.indexWhere((i) => i.id == menuItem.id);
    if (existing >= 0) {
      _items[existing].quantity++;
    } else {
      _items.add(CartItem(menuItem: menuItem, quantity: 1));
    }
    notifyListeners();  // tells all listeners: "something changed, rebuild"
  }

  void removeItem(String itemId) {
    _items.removeWhere((i) => i.id == itemId);
    notifyListeners();
  }

  void updateQuantity(String itemId, int quantity) {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }
    final index = _items.indexWhere((i) => i.id == itemId);
    if (index >= 0) {
      _items[index].quantity = quantity;
      notifyListeners();
    }
  }

  void clear() {
    _items.clear();
    notifyListeners();
  }
}
```

`notifyListeners()` is the key. Every widget that's "listening" to this `ChangeNotifier` will rebuild when this is called.

---

## 4. ListenableBuilder — React to ChangeNotifier

Without any package, you can connect a `ChangeNotifier` to your UI using `ListenableBuilder`:

```dart
class CartIconBadge extends StatelessWidget {
  final CartModel cart;
  const CartIconBadge({super.key, required this.cart});

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: cart,         // rebuilds this widget when cart.notifyListeners() fires
      builder: (context, _) {
        return Stack(
          children: [
            const Icon(Icons.shopping_cart),
            if (cart.totalItems > 0)
              Positioned(
                right: 0,
                top: 0,
                child: CircleAvatar(
                  radius: 8,
                  backgroundColor: Colors.red,
                  child: Text(
                    '${cart.totalItems}',
                    style: const TextStyle(fontSize: 10, color: Colors.white),
                  ),
                ),
              ),
          ],
        );
      },
    );
  }
}
```

But you still need a way to put `CartModel` somewhere accessible to all widgets. That's where `Provider` comes in.

---

## 5. Provider Package — The Practical Solution

`Provider` wraps `InheritedWidget` and makes `ChangeNotifier` easy to place and access:

```bash
flutter pub add provider
```

**Place state at the top of the tree:**
```dart
void main() {
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => CartModel()),
        ChangeNotifierProvider(create: (_) => UserModel()),
        ChangeNotifierProvider(create: (_) => ThemeModel()),
      ],
      child: const MyApp(),
    ),
  );
}
```

**Read it anywhere in the tree:**
```dart
// Watch — widget rebuilds when CartModel changes (use in build())
final cart = context.watch<CartModel>();

// Read — one-time read, doesn't subscribe to changes (use in callbacks)
final cart = context.read<CartModel>();
context.read<CartModel>().addItem(item);  // common pattern in onPressed

// Select — rebuild ONLY when a specific part of the model changes
final total = context.select<CartModel, double>((cart) => cart.totalPrice);
// This widget only rebuilds when totalPrice changes, not on every cart update
```

**Full example — a widget that shows cart info and adds items:**
```dart
class ProductCard extends StatelessWidget {
  final MenuItem item;
  const ProductCard({super.key, required this.item});

  @override
  Widget build(BuildContext context) {
    // context.select rebuilds ONLY when this item's count changes
    final itemCount = context.select<CartModel, int>(
      (cart) => cart.items
        .where((i) => i.id == item.id)
        .fold(0, (sum, i) => sum + i.quantity),
    );

    return Card(
      child: Row(
        children: [
          // ... item info ...
          if (itemCount == 0)
            ElevatedButton(
              onPressed: () => context.read<CartModel>().addItem(item),
              child: const Text('Add'),
            )
          else
            Row(
              children: [
                IconButton(
                  onPressed: () => context.read<CartModel>().updateQuantity(item.id, itemCount - 1),
                  icon: const Icon(Icons.remove),
                ),
                Text('$itemCount'),
                IconButton(
                  onPressed: () => context.read<CartModel>().updateQuantity(item.id, itemCount + 1),
                  icon: const Icon(Icons.add),
                ),
              ],
            ),
        ],
      ),
    );
  }
}
```

**→ Try this:** Refactor your Phase 2 Shopping App cart to use Provider + ChangeNotifier. Remove all cart callbacks from constructors. The `CartModel` should live in `main()` via `ChangeNotifierProvider`. Verify that adding an item from the listing updates the cart badge in the bottom nav bar.

---

## 6. Ephemeral State vs App State

Not all state needs Provider. This distinction matters.

**Ephemeral state** — belongs to ONE widget, no one else cares:
- Is this accordion expanded?
- Which tab is selected in THIS widget?
- Is this password field obscured?
- Current value of a text field

Use `setState()` for ephemeral state.

**App state** — multiple widgets need it, persists across screens:
- Is the user logged in?
- What's in the cart?
- What theme is selected?
- What data did the API return?

Use Provider / Riverpod for app state.

**The rule:** Start with `setState()`. When you find yourself lifting state two or more levels up — move it to a `ChangeNotifier`.

---

## 7. Common Mistakes

**Mistake 1: Using `context.watch()` inside a callback**
```dart
// WRONG — watch() in a callback, not in build()
ElevatedButton(
  onPressed: () {
    final cart = context.watch<CartModel>(); // error at runtime
    cart.clear();
  },
)

// RIGHT — read() in callbacks, watch() in build()
ElevatedButton(
  onPressed: () => context.read<CartModel>().clear(),
)
```

**Mistake 2: Calling `notifyListeners()` inside `build()`**
```dart
// WRONG — causes infinite rebuild loop
class BrokenModel extends ChangeNotifier {
  @override
  Widget build(context) {
    notifyListeners(); // DON'T
  }
}
```

**Mistake 3: Putting everything in one giant ChangeNotifier**
```dart
// WRONG — one notifier for everything
class AppState extends ChangeNotifier {
  User? user;
  List<Product> products;
  List<CartItem> cart;
  Theme theme;
  // ... every widget rebuilds when ANY of this changes
}

// RIGHT — separate models for separate concerns
class UserModel extends ChangeNotifier { ... }
class CartModel extends ChangeNotifier { ... }
class ProductModel extends ChangeNotifier { ... }
```

---

## Lab — Shared Wishlist App

Build a 3-tab app with shared wishlist state using Provider.

**Data model:**
```dart
class Product {
  final String id, name, category;
  final double price;
  final String imageUrl;
}

class WishlistModel extends ChangeNotifier {
  final Set<String> _wishedIds = {};
  bool isWished(String id) => _wishedIds.contains(id);
  void toggle(String id) {
    _wishedIds.contains(id) ? _wishedIds.remove(id) : _wishedIds.add(id);
    notifyListeners();
  }
  int get count => _wishedIds.length;
}
```

**Tabs:**

Tab 1 — Product Grid: 12 products in a 2-col grid. Each card has a heart icon (filled/outline based on wishlist state). Tapping the heart toggles the wishlist.

Tab 2 — Wishlist: Shows all wishlisted products. Swipe to remove. Empty state illustration. The tab badge shows the count.

Tab 3 — Categories: Group products by category. Each category is an expandable panel showing its products with wishlist toggles.

**Requirements:**
- Wishlist state updates INSTANTLY across all 3 tabs with no prop drilling
- Tab 2 badge updates when wishlist count changes
- Removing from Tab 2 also reflects in Tab 1's heart icon

---

## Challenge

Extend the app with a `CompareModel`:
- User can "compare" up to 3 products
- A persistent bottom bar appears when at least 1 product is in the compare list
- Bottom bar shows product thumbnails and a "Compare Now" button
- Tapping "Compare Now" pushes a comparison screen showing all selected products' attributes side by side

The compare state must be accessible from the product grid AND the wishlist tab.

---

## Before Week 12 — Verify

1. What is `InheritedWidget`? How does `Theme.of(context)` use it?
2. What does `notifyListeners()` do? Who listens to it?
3. What is the difference between `context.watch()` and `context.read()`?
4. When should you use `setState()` vs Provider?
5. What does `context.select()` do that `context.watch()` doesn't?

---

**Next → [Week 12: Riverpod — Modern State Management](Week_12_Riverpod.md)**
