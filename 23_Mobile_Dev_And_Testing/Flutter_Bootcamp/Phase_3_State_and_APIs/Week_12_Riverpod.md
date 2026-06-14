# Week 12 — Riverpod
### The modern, compile-safe way to manage state in Flutter

---

## Why Riverpod Over Provider?

Provider has one fundamental problem: it depends on `BuildContext` to find its providers. This means:
- You can't access a provider outside of a widget (no provider in a service class)
- Provider lookups can fail at runtime if you access the wrong context
- Testing requires wrapping everything in a widget tree

Riverpod solves all of this. Providers live globally, are compile-safe, and work anywhere in your code — in widgets, in repositories, in utility functions.

```bash
flutter pub add flutter_riverpod riverpod_annotation
flutter pub add dev:riverpod_generator dev:build_runner
```

---

## 1. Setup — ProviderScope

Wrap your entire app in `ProviderScope`. This is the container that holds all provider state.

```dart
void main() {
  runApp(
    const ProviderScope(
      child: MyApp(),
    ),
  );
}

// Widgets extend ConsumerWidget instead of StatelessWidget
// or ConsumerStatefulWidget instead of StatefulWidget
class MyApp extends ConsumerWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // ref is your access to ALL providers
    return MaterialApp(/* ... */);
  }
}
```

---

## 2. The 5 Core Providers

**`Provider` — a value that never changes:**
```dart
final appNameProvider = Provider<String>((ref) => 'My Flutter App');

// In widget:
final name = ref.watch(appNameProvider); // 'My Flutter App'
```

**`StateProvider` — a single changeable value:**
```dart
final counterProvider = StateProvider<int>((ref) => 0);
final themeProvider = StateProvider<ThemeMode>((ref) => ThemeMode.light);

// Read:
final count = ref.watch(counterProvider);

// Modify:
ref.read(counterProvider.notifier).state++;
ref.read(themeProvider.notifier).state = ThemeMode.dark;
```

**`FutureProvider` — async data, auto-handles loading/error/data:**
```dart
final userProvider = FutureProvider<User>((ref) async {
  return await UserRepository().fetchCurrentUser();
});

// In widget — the `.when()` handles all states for you:
final userAsync = ref.watch(userProvider);
return userAsync.when(
  loading: () => const CircularProgressIndicator(),
  error: (error, stack) => Text('Error: $error'),
  data: (user) => Text('Hello, ${user.name}!'),
);
```

**`StreamProvider` — real-time data from a Stream:**
```dart
final messagesProvider = StreamProvider<List<Message>>((ref) {
  return MessageRepository().watchMessages();  // returns a Stream
});

// In widget — works exactly like FutureProvider.when()
final messagesAsync = ref.watch(messagesProvider);
```

**`NotifierProvider` — complex state with multiple operations:**
```dart
// Step 1: Define the Notifier
class CounterNotifier extends Notifier<int> {
  @override
  int build() => 0;  // initial state

  void increment() => state++;
  void decrement() => state--;
  void reset() => state = 0;
  void setTo(int value) => state = value;
}

// Step 2: Create the provider
final counterNotifierProvider = NotifierProvider<CounterNotifier, int>(
  CounterNotifier.new,
);

// Step 3: Use in widget
final count = ref.watch(counterNotifierProvider);
ref.read(counterNotifierProvider.notifier).increment();
```

---

## 3. AsyncNotifierProvider — Async State with Operations

This is the one you'll use most in real apps:

```dart
class CartNotifier extends AsyncNotifier<List<CartItem>> {
  @override
  Future<List<CartItem>> build() async {
    // Called once when the provider is first used
    // Return the initial state (load from local storage, etc.)
    return await CartRepository().loadSavedCart();
  }

  Future<void> addItem(Product product) async {
    // AsyncLoading shows while this runs
    state = const AsyncLoading();

    // AsyncValue.guard catches exceptions and converts them to AsyncError
    state = await AsyncValue.guard(() async {
      final current = state.valueOrNull ?? [];
      final existing = current.indexWhere((i) => i.product.id == product.id);

      if (existing >= 0) {
        final updated = List<CartItem>.from(current);
        updated[existing] = updated[existing].copyWith(
          quantity: updated[existing].quantity + 1,
        );
        return updated;
      }

      return [...current, CartItem(product: product, quantity: 1)];
    });
  }

  Future<void> removeItem(String productId) async {
    state = await AsyncValue.guard(() async {
      final current = state.valueOrNull ?? [];
      return current.where((i) => i.product.id != productId).toList();
    });
  }

  Future<void> clear() async {
    state = const AsyncData([]);
  }
}

final cartProvider = AsyncNotifierProvider<CartNotifier, List<CartItem>>(
  CartNotifier.new,
);
```

---

## 4. `ref.watch` vs `ref.read` vs `ref.listen`

This is the most important thing to get right:

```dart
// ref.watch — use in build(). Widget rebuilds when value changes.
@override
Widget build(BuildContext context, WidgetRef ref) {
  final cart = ref.watch(cartProvider); // rebuild on change ✓
}

// ref.read — use in callbacks/methods. Does NOT subscribe. One-time read.
ElevatedButton(
  onPressed: () {
    ref.read(cartProvider.notifier).addItem(product); // in callback ✓
  },
)

// WRONG — watch() inside a callback
ElevatedButton(
  onPressed: () {
    final cart = ref.watch(cartProvider); // ❌ runtime error
  },
)

// ref.listen — react to changes without rebuilding the whole widget
@override
Widget build(BuildContext context, WidgetRef ref) {
  ref.listen<AsyncValue<List<CartItem>>>(cartProvider, (previous, next) {
    next.whenOrNull(
      error: (error, _) => ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Cart error: $error')),
      ),
    );
  });
  // ... rest of build
}
```

---

## 5. Provider Dependencies — ref.watch Inside a Provider

Providers can depend on other providers. When a dependency changes, the dependent provider rebuilds automatically.

```dart
final selectedCityProvider = StateProvider<String>((ref) => 'Hyderabad');

// This provider depends on selectedCityProvider
// When city changes, this provider is automatically invalidated and re-fetched
final weatherProvider = FutureProvider<Weather>((ref) async {
  final city = ref.watch(selectedCityProvider);  // dependency declared here
  return await WeatherApi().getWeather(city);
});

// In widget:
// Changing selectedCityProvider triggers weatherProvider to re-fetch automatically
ref.read(selectedCityProvider.notifier).state = 'Mumbai';
// ^ this causes weatherProvider to re-run its Future with the new city
```

This reactive dependency chain is one of Riverpod's most powerful features.

---

## 6. Family — Parameterised Providers

When you need the same provider logic with different parameters:

```dart
// FutureProvider.family takes a parameter
final productProvider = FutureProvider.family<Product, String>((ref, productId) async {
  return await ProductRepository().getProduct(productId);
});

// Each unique ID gets its own cached provider instance
final product = ref.watch(productProvider('product-123'));
final otherProduct = ref.watch(productProvider('product-456'));
```

---

## 7. select — Prevent Unnecessary Rebuilds

```dart
// BAD: widget rebuilds whenever ANY part of the cart changes
final cart = ref.watch(cartProvider);
Text('${cart.valueOrNull?.length ?? 0} items');

// GOOD: widget only rebuilds when the COUNT changes
final itemCount = ref.watch(
  cartProvider.select((async) => async.valueOrNull?.length ?? 0),
);
Text('$itemCount items');
```

Use `.select()` to narrow what triggers a rebuild, especially in list items.

---

## 8. ConsumerStatefulWidget — When You Need Both ref and Lifecycle

```dart
class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({super.key});

  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  final _controller = TextEditingController();

  @override
  void initState() {
    super.initState();
    // ref is available here (unlike Provider where context wasn't ready)
    final initialQuery = ref.read(searchQueryProvider);
    _controller.text = initialQuery;
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final results = ref.watch(searchResultsProvider);
    // ...
  }
}
```

---

## Lab — Rebuild the Shopping Cart with Riverpod

Take your Phase 2 Shopping App and replace all Provider + ChangeNotifier code with Riverpod.

**Providers to create:**

```dart
// 1. Product catalog (loaded once)
final productsProvider = FutureProvider<List<Product>>((ref) async {
  await Future.delayed(const Duration(seconds: 1)); // simulate load
  return hardcodedProducts;
});

// 2. Search query
final searchQueryProvider = StateProvider<String>((ref) => '');

// 3. Filtered products (depends on products + search query)
final filteredProductsProvider = Provider<List<Product>>((ref) {
  final productsAsync = ref.watch(productsProvider);
  final query = ref.watch(searchQueryProvider).toLowerCase();

  return productsAsync.whenData((products) =>
    query.isEmpty
      ? products
      : products.where((p) => p.name.toLowerCase().contains(query)).toList()
  ).valueOrNull ?? [];
});

// 4. Cart (AsyncNotifier)
final cartProvider = AsyncNotifierProvider<CartNotifier, List<CartItem>>(CartNotifier.new);

// 5. Cart total (derived from cart)
final cartTotalProvider = Provider<double>((ref) {
  final cartAsync = ref.watch(cartProvider);
  return cartAsync.valueOrNull?.fold(
    0.0, (sum, item) => sum + item.product.price * item.quantity,
  ) ?? 0.0;
});

// 6. Cart item count (for badge)
final cartCountProvider = Provider<int>((ref) {
  final cartAsync = ref.watch(cartProvider);
  return cartAsync.valueOrNull?.fold(0, (sum, item) => sum + item.quantity) ?? 0;
});
```

After the refactor:
- Products load with a real loading state (show shimmer/spinner)
- Search filters in real time as user types
- Cart badge updates instantly across all tabs
- No callbacks threading through constructors

---

## Challenge

Add a **"Recently Viewed"** feature using Riverpod:

```dart
class RecentlyViewedNotifier extends Notifier<List<Product>> {
  @override
  List<Product> build() => [];

  void add(Product product) {
    final current = state.where((p) => p.id != product.id).toList();
    state = [product, ...current].take(10).toList(); // max 10 items
  }

  void clear() => state = [];
}
```

When a user opens a product detail screen, add it to recently viewed. Show a "Recently Viewed" horizontal scroll section on the home page. The section only shows if the list is non-empty.

---

## Before Week 13 — Verify

1. What does `ProviderScope` do and where must it go?
2. What is the difference between `FutureProvider` and `AsyncNotifierProvider`?
3. Why must you use `ref.read()` in callbacks and `ref.watch()` in `build()`?
4. What does `ref.watch(provider.select(...))` do differently from `ref.watch(provider)`?
5. What does `AsyncValue.guard()` do — what problem does it solve?

---

**Next → [Week 13: HTTP & REST APIs](Week_13_HTTP_and_REST_APIs.md)**
