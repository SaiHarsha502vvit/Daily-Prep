# Week 11 — State Management Deep Dive
### Why setState breaks at scale, and how InheritedWidget, Provider, and the widget tree solve it

---

> Three lenses on every concept:
> - 🧑‍💻 **Developer** — how state propagation works under the hood, what each pattern actually does
> - 🎨 **Designer** — what state boundaries mean for screen design, consistency across screens
> - 🧪 **Tester** — testing with mocked providers, verifying state changes across the widget tree

---

## The Problem: setState at Scale

> 📄 **Flutter Docs:**
> *"If you want a simpler state management approach and the data you share doesn't change often, consider using InheritedWidget, which is what Provider is based on."*

In Phase 2 you felt prop drilling — passing `_cartItems` and `_onAddToCart` from `MainScreen` through `HomeTab` through `ProductGrid` through `ProductCard` just to reach the "Add to Cart" button. That was 4 screens with 3 pieces of shared state.

Real apps have 20+ screens and 10+ pieces of global state: the logged-in user, cart, theme preference, feature flags, notifications count... `setState` and prop drilling don't scale. You end up with:

```dart
// ❌ After 3 months this is what your MainScreen looks like
MainScreen(
  user: user,
  cartItems: cartItems,
  cartCount: cartCount,
  wishlistIds: wishlistIds,
  theme: theme,
  notifications: notifications,
  onAddToCart: onAddToCart,
  onRemoveFromCart: onRemoveFromCart,
  onToggleWishlist: onToggleWishlist,
  onMarkNotificationRead: onMarkNotificationRead,
  onThemeChange: onThemeChange,
  // ...
)
```

Every widget in the tree that needs anything has to receive it as a constructor parameter. Add a new field? Update every widget along the path.

---

## 1. `InheritedWidget` — The Root of Flutter's State System

> 📄 **Flutter Docs:**
> *"Base class for widgets that efficiently propagate information down the tree. To obtain the nearest instance of a particular type of inherited widget from a build context, use BuildContext.dependOnInheritedWidgetOfExactType."*

Every state management solution in Flutter (`Provider`, `Riverpod`, `Bloc`) is built on top of `InheritedWidget`. Understanding it means you understand why the solutions work.

```dart
// AuthState holds the logged-in user
class AuthState extends InheritedWidget {
  final User? currentUser;
  final void Function() onSignOut;

  const AuthState({
    super.key,
    required this.currentUser,
    required this.onSignOut,
    required super.child,    // the subtree that can access this data
  });

  // Static accessor — how any descendant reads this data
  // "of(context)" is the Flutter convention for InheritedWidget access
  static AuthState of(BuildContext context) {
    final result = context.dependOnInheritedWidgetOfExactType<AuthState>();
    assert(result != null, 'AuthState not found in widget tree. Wrap your app with AuthStateProvider.');
    return result!;
  }

  // Called by Flutter to decide whether to notify dependents when this widget rebuilds
  // Return true → notify all registered dependents → they rebuild
  // Return false → skip rebuild (data didn't change in a meaningful way)
  @override
  bool updateShouldNotify(AuthState old) {
    return currentUser?.id != old.currentUser?.id;
  }
}
```

```dart
// Place it high in the tree — wraps everything that needs auth
class App extends StatefulWidget { ... }

class _AppState extends State<App> {
  User? _currentUser;

  @override
  Widget build(BuildContext context) {
    return AuthState(
      currentUser: _currentUser,
      onSignOut: () => setState(() => _currentUser = null),
      child: MaterialApp(home: const HomeScreen()),
    );
  }
}

// Anywhere in the subtree — no prop drilling needed
class ProfileScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    // dependOnInheritedWidgetOfExactType walks up the tree and finds AuthState
    // It also REGISTERS this widget as a dependent — it rebuilds when AuthState changes
    final auth = AuthState.of(context);
    return Text('Logged in as: ${auth.currentUser?.name ?? "Guest"}');
  }
}
```

### What `dependOnInheritedWidgetOfExactType` Does

When you call `AuthState.of(context)`:
1. Flutter walks UP the Element tree from the current element
2. It finds the first `AuthState` element
3. It REGISTERS the current element as a dependent of that `AuthState`
4. When `_currentUser` changes in `_AppState`, `setState` rebuilds `AuthState` with new data
5. Flutter calls `updateShouldNotify(old)` → returns `true`
6. All registered dependents are marked dirty → they rebuild

This is exactly how `Theme.of(context)`, `MediaQuery.of(context)`, and `Navigator.of(context)` work.

🎨 **Designer:** The "of(context)" pattern means any widget at any nesting depth can access shared state without its parent needing to know about it. This lets you design screens without worrying about which parent holds which data — the data is "in the air" above every widget in the subtree.

---

## 2. `Provider` — InheritedWidget Made Ergonomic

> 📄 **Flutter Docs (pub.dev/packages/provider):**
> *"A mixture of dependency injection (DI) and state management, built with widgets. Provider is recommended by the Flutter team as the state management solution to start with."*

`InheritedWidget` requires significant boilerplate per type. `Provider` wraps `InheritedWidget` and removes that boilerplate.

```dart
// With InheritedWidget (manual):
class CartState extends InheritedWidget {
  final List<CartItem> items;
  final void Function(Product) onAdd;
  static CartState of(BuildContext context) => context.dependOnInheritedWidgetOfExactType()!;
  @override bool updateShouldNotify(CartState old) => items != old.items;
  // constructor, etc...
}

// With Provider (same thing, 3 lines):
// The "model" — plain Dart class with ChangeNotifier
class CartModel extends ChangeNotifier {
  final List<CartItem> _items = [];

  List<CartItem> get items => List.unmodifiable(_items);

  int get count => _items.fold(0, (sum, item) => sum + item.quantity);

  double get total => _items.fold(0, (sum, item) => sum + item.totalPrice);

  void addItem(Product product, String size) {
    final existing = _items.where(
      (i) => i.product.id == product.id && i.selectedSize == size
    ).firstOrNull;

    if (existing != null) {
      existing.quantity++;
    } else {
      _items.add(CartItem(product: product, selectedSize: size));
    }

    notifyListeners();    // ← tells Provider "something changed, rebuild my consumers"
  }

  void removeItem(String productId, String size) {
    _items.removeWhere((i) => i.product.id == productId && i.selectedSize == size);
    notifyListeners();
  }

  void updateQuantity(String productId, String size, int delta) {
    final item = _items.firstWhere(
      (i) => i.product.id == productId && i.selectedSize == size
    );
    item.quantity += delta;
    if (item.quantity <= 0) removeItem(productId, size);
    else notifyListeners();
  }
}
```

```dart
// Place providers at the top of the app
void main() {
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => CartModel()),
        ChangeNotifierProvider(create: (_) => AuthModel()),
        ChangeNotifierProvider(create: (_) => ThemeModel()),
      ],
      child: const App(),
    ),
  );
}

// Read data anywhere in the tree
class CartBadge extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    // context.watch<T>() — subscribes to changes, rebuilds when CartModel notifies
    final cartCount = context.watch<CartModel>().count;
    return Badge(label: Text('$cartCount'), child: const Icon(Icons.shopping_cart));
  }
}

// Trigger actions without subscribing to rebuilds
class AddToCartButton extends StatelessWidget {
  final Product product;
  final String size;

  const AddToCartButton({super.key, required this.product, required this.size});

  @override
  Widget build(BuildContext context) {
    return FilledButton(
      // context.read<T>() — does NOT subscribe to changes, just reads current value or calls method
      // Use for callbacks only — never call context.read inside build()
      onPressed: () => context.read<CartModel>().addItem(product, size),
      child: const Text('Add to Cart'),
    );
  }
}

// Select only one field — rebuilds ONLY when that field changes
class ProductPrice extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    // context.select<T, R>() — rebuilds only when the selected value changes
    final total = context.select<CartModel, double>((cart) => cart.total);
    return Text('Total: ₹${total.toStringAsFixed(0)}');
  }
}
```

### `context.watch` vs `context.read` vs `context.select`

```
context.watch<T>()
  ↳ Subscribes to CartModel
  ↳ Rebuilds this widget every time CartModel calls notifyListeners()
  ↳ Use in build() when you need live updates

context.read<T>()
  ↳ One-time read, no subscription
  ↳ Does NOT rebuild this widget when model changes
  ↳ Use in callbacks (onTap, onPressed) — NEVER in build()

context.select<T, R>((model) => model.someField)
  ↳ Subscribes to CartModel but only rebuilds when someField changes
  ↳ More efficient than watch when you only care about one property
  ↳ Use when a widget should rebuild for one field but not all changes
```

**Rule:** `context.read` in callbacks. `context.watch` or `context.select` in `build()`. Never `context.watch` in an `initState` or inside a callback.

---

## 3. `Consumer` Widget — When You Can't Use `context`

```dart
// Problem: context is above the Provider — can't use context.watch
// Solution: use Consumer<T> which uses its own context from below the Provider
class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [ChangeNotifierProvider(create: (_) => ThemeModel())],
      child: Consumer<ThemeModel>(    // Consumer has access to a context BELOW the provider
        builder: (context, themeModel, child) {
          return MaterialApp(
            theme: themeModel.lightTheme,
            darkTheme: themeModel.darkTheme,
            themeMode: themeModel.mode,
            home: child,             // child is not rebuilt when themeModel changes
          );
        },
        child: const HomeScreen(),   // passed through as the non-rebuilding subtree
      ),
    );
  }
}
```

🧪 **Tester:** Testing with Provider:

```dart
testWidgets('add to cart increases badge count', (tester) async {
  // Provide a test CartModel with known initial state
  final testCart = CartModel();

  await tester.pumpWidget(
    ChangeNotifierProvider.value(
      value: testCart,
      child: MaterialApp(home: ProductDetailScreen(product: testProduct)),
    ),
  );

  // Verify initial state
  expect(find.text('0'), findsOneWidget);   // badge count is 0

  // Tap "Add to Cart"
  await tester.tap(find.text('Add to Cart'));
  await tester.pump();

  // Badge should now show 1
  expect(find.text('1'), findsOneWidget);

  // Verify the model was updated
  expect(testCart.count, equals(1));
  expect(testCart.items.first.product.id, equals(testProduct.id));
});
```

---

## 4. When to Use Which State Management Level

| State Type | Who Needs It | Solution |
|-----------|-------------|---------|
| UI-only (expanded/collapsed, hover) | Single widget | `StatefulWidget` + `setState` |
| Screen-local (form values, tab index) | One screen | `StatefulWidget` + `setState` |
| Shared between sibling widgets | Common ancestor | Lift state + callbacks |
| Shared across multiple unrelated screens | Multiple places | `Provider` / `Riverpod` |
| Server state (loading, cached data, refetch) | Anywhere | `Riverpod` (FutureProvider, StreamProvider) |
| App-wide settings (theme, locale, auth) | App root | `Provider` at root, or `Riverpod` |

🎨 **Designer:** From a design perspective, state scope maps to navigation scope:
- Within one card → local state
- Within one screen → screen-level state
- Across tabs of a bottom navigation → lifted to `MainScreen` or Provider
- Across entire app (cart, user, theme) → root Provider or Riverpod

---

## 5. `ChangeNotifier` vs Immutable State

```dart
// ChangeNotifier (mutable) — simpler, good for straightforward use cases
class CounterModel extends ChangeNotifier {
  int _count = 0;
  int get count => _count;

  void increment() {
    _count++;
    notifyListeners();
  }
}

// Immutable state (with copyWith) — safer, easier to test, no hidden mutations
class CounterState {
  final int count;
  const CounterState({this.count = 0});
  CounterState copyWith({int? count}) => CounterState(count: count ?? this.count);
}

class CounterNotifier extends ValueNotifier<CounterState> {
  CounterNotifier() : super(const CounterState());

  void increment() {
    value = value.copyWith(count: value.count + 1);
    // notifyListeners() is called automatically by ValueNotifier when value changes
  }
}
```

`ChangeNotifier` with mutable state is easier to start with. Immutable state with `copyWith` is safer at scale — you can never accidentally mutate state without going through a proper notifier method.

---

## Lab — Convert the Shopping App to Use Provider

Take the Shopping App from Week 10 (which had all state in `_ShopAppState`) and convert it to use `Provider`:

**Models to create:**
1. `CartModel extends ChangeNotifier` — all cart operations
2. `ProductModel extends ChangeNotifier` — products list, wishlist toggle, category filter
3. `AuthModel extends ChangeNotifier` — mock user, login/logout state

**Remove from `_ShopAppState`:**
- All `_cartItems`, `_products`, `_onAddToCart`, `_onToggleWishlist` state and callbacks
- Replace with `MultiProvider` at the root

**Update each screen:**
- `HomeTab` — use `context.watch<ProductModel>()` for products and filter
- `ProductDetailScreen` — use `context.read<CartModel>().addItem(...)` in button callback
- `CartTab` — use `context.watch<CartModel>()` for items, total, count
- `MainScreen` AppBar badge — use `context.select<CartModel, int>((c) => c.count)`

**Verify:** After conversion, `MainScreen` should have NO `List<Product>`, NO `List<CartItem>`, and NO callback parameters. Every widget reads exactly what it needs from the providers.

---

## Challenge — Multi-Model Interaction

Build a "Notifications" screen where:
- `NotificationModel extends ChangeNotifier` — holds `List<AppNotification>`, tracks unread count
- Marking a notification as read decrements the unread badge in the AppBar
- Clearing all notifications is confirmed via a dialog, then updates the model
- The notification badge in the `BottomNavigationBar` uses `context.select<NotificationModel, int>((n) => n.unreadCount)` so ONLY the badge rebuilds when count changes — not the entire bottom bar

---

## Week 11 Verify

1. What is `InheritedWidget`? How does `dependOnInheritedWidgetOfExactType` register a widget as a dependent?
2. What does `notifyListeners()` do in a `ChangeNotifier`? What happens in the widget tree when it's called?
3. What is the difference between `context.watch<T>()` and `context.read<T>()`? When is using `context.read()` inside `build()` wrong?
4. You have `context.watch<CartModel>()` in a widget that only shows the cart total. Every time ANY item is added/removed, the whole widget rebuilds. How do you fix this with `context.select`?
5. Why does `Consumer<T>` exist? In what situation can't you use `context.watch` directly?
6. The `CartModel` has a `List<CartItem> _items` field. You expose it as `List<CartItem> get items => List.unmodifiable(_items)`. Why return `unmodifiable`?
7. Explain the difference between lifting state up (Phase 1–2 approach) and Provider. What specific problem does Provider solve that lifting state cannot?
8. In a 50-screen app, every `ChangeNotifier.notifyListeners()` call triggers rebuilds in all listening widgets. How does `context.select<CartModel, int>((c) => c.count)` prevent unnecessary rebuilds? What happens internally when a selected value hasn't changed?
9. A new developer puts `context.watch<AuthModel>()` inside a button's `onPressed` callback. What exception is thrown? Why does Provider enforce this rule?

---

**Next → [Week 12: Riverpod](Week_12_Riverpod.md)**
