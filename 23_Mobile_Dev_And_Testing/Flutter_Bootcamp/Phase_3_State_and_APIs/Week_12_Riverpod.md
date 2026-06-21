# Week 12 — Riverpod
### Compile-safe, testable, context-free state management — the modern standard

---

> Three lenses on every concept:
> - 🧑‍💻 **Developer** — how providers compose, the async providers, Notifier pattern
> - 🎨 **Designer** — loading/error/data states and how to design for all three
> - 🧪 **Tester** — overriding providers in tests, testing async state

---

## Why Riverpod Over Provider?

> 📄 **Flutter Docs (riverpod.dev):**
> *"Riverpod is a reactive caching and data-binding framework that is immune to the widget tree. Unlike Provider, Riverpod allows you to declare providers outside of widgets, making them accessible globally, testable, and composable without BuildContext."*

Provider has real problems that surface in production:

```dart
// Provider problem 1: ProviderNotFoundException
// If you call context.watch<CartModel>() but the Provider isn't above this widget → crash at runtime
// Not a compile error. Crashes when users run the app.

// Provider problem 2: cannot easily access providers outside of build()
// In a background service, a repository, or a utility function:
context.read<CartModel>()  // ← context not available here

// Provider problem 3: async state is manual
// You have to manage isLoading, hasError, data fields yourself in ChangeNotifier
class ProductModel extends ChangeNotifier {
  List<Product> products = [];
  bool isLoading = false;
  String? error;

  Future<void> load() async {
    isLoading = true;
    notifyListeners();
    try {
      products = await api.getProducts();
    } catch (e) {
      error = e.toString();
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }
}
```

Riverpod solves all three:
- Providers are global — no `BuildContext` needed to access them
- Compile-safe — wrong type = compile error, not runtime crash
- Async built-in — `FutureProvider` and `StreamProvider` handle loading/error/data automatically

---

## Setup

```dart
// pubspec.yaml
dependencies:
  flutter_riverpod: ^2.5.0
  riverpod_annotation: ^2.3.0  # optional: code generation for @riverpod annotation

dev_dependencies:
  riverpod_generator: ^2.4.0
  build_runner: ^2.4.0
```

```dart
// lib/main.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';

void main() {
  runApp(
    const ProviderScope(    // ← wraps the ENTIRE app, exactly once
      child: MyApp(),
    ),
  );
}
```

`ProviderScope` is the Riverpod equivalent of `MultiProvider`. It stores all provider state.

---

## 1. The Five Core Providers

### `Provider` — Read-Only, Synchronous

```dart
// A value that never changes (or is externally injected)
final appVersionProvider = Provider<String>((ref) => '2.1.0');

// Computed value that depends on another provider
final formattedVersionProvider = Provider<String>((ref) {
  final version = ref.watch(appVersionProvider);
  return 'v$version';
});

// Usage in a widget
class VersionBadge extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final version = ref.watch(formattedVersionProvider);
    return Text(version);
  }
}
```

### `StateProvider` — Simple Mutable Value

```dart
// For simple values: a counter, a selected tab index, a toggle
final counterProvider = StateProvider<int>((ref) => 0);
final selectedTabProvider = StateProvider<int>((ref) => 0);
final isDarkModeProvider = StateProvider<bool>((ref) => false);

// Usage
class CounterScreen extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final count = ref.watch(counterProvider);
    return Column(
      children: [
        Text('Count: $count'),
        ElevatedButton(
          // ref.read() inside callbacks — no rebuild subscription
          onPressed: () => ref.read(counterProvider.notifier).state++,
          child: const Text('+1'),
        ),
      ],
    );
  }
}
```

### `FutureProvider` — Async Data, Once

```dart
// Fetches data once. Returns AsyncValue<T> with three states: loading / error / data
final userProfileProvider = FutureProvider.autoDispose<UserProfile>((ref) async {
  // autoDispose: provider is destroyed when no widget is watching it
  // Good for screen-specific data that should reload when screen reopens
  final response = await http.get(Uri.parse('/api/profile'));
  return UserProfile.fromJson(jsonDecode(response.body));
});

// Usage
class ProfileScreen extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(userProfileProvider);

    return profileAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, stack) => Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 48, color: Colors.red),
            const SizedBox(height: 16),
            Text(error.toString()),
            TextButton(
              onPressed: () => ref.refresh(userProfileProvider),  // retry
              child: const Text('Retry'),
            ),
          ],
        ),
      ),
      data: (profile) => ProfileContent(profile: profile),
    );
  }
}
```

🎨 **Designer:** `AsyncValue.when()` is your contract with the designer for three states:
- `loading` → skeleton screens, `CircularProgressIndicator`, shimmer effects — not blank white screens
- `error` → clear error message + retry action — never just a red snackbar that disappears
- `data` → the actual content

Every screen with network data has all three states. Design all three.

### `StreamProvider` — Real-Time Data

```dart
// Listens to a Stream — rebuilds every time a new event arrives
final notificationsProvider = StreamProvider.autoDispose<List<Notification>>((ref) {
  return FirebaseFirestore.instance
      .collection('notifications')
      .where('userId', isEqualTo: currentUserId)
      .snapshots()
      .map((snap) => snap.docs.map((d) => Notification.fromFirestore(d)).toList());
});

// Usage — same .when() pattern as FutureProvider
class NotificationBell extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notifications = ref.watch(notificationsProvider);
    return notifications.when(
      loading: () => const Icon(Icons.notifications),
      error: (_, __) => const Icon(Icons.notifications_off),
      data: (items) => Badge(
        label: Text('${items.where((n) => !n.isRead).length}'),
        child: const Icon(Icons.notifications),
      ),
    );
  }
}
```

---

## 2. `NotifierProvider` — The ChangeNotifier Replacement

> 📄 **Riverpod Docs:**
> *"Notifier is the replacement for ChangeNotifier in Riverpod. It is a class with state and methods to mutate that state. The big advantage over ChangeNotifier is that the state is exposed as an immutable object."*

```dart
// The Notifier — pure Dart class, no BuildContext, no widgets
class CartNotifier extends Notifier<List<CartItem>> {
  @override
  List<CartItem> build() {
    return [];    // initial state — this is called like a provider's create function
  }

  void addItem(Product product, String size) {
    final existing = state.where(
      (i) => i.product.id == product.id && i.selectedSize == size
    ).firstOrNull;

    if (existing != null) {
      // Immutable update — create a new list with the updated item
      state = state.map((item) {
        if (item.product.id == product.id && item.selectedSize == size) {
          return CartItem(product: item.product, selectedSize: item.selectedSize, quantity: item.quantity + 1);
        }
        return item;
      }).toList();
    } else {
      state = [...state, CartItem(product: product, selectedSize: size)];
    }
  }

  void removeItem(String productId, String size) {
    state = state.where(
      (i) => !(i.product.id == productId && i.selectedSize == size)
    ).toList();
  }

  void updateQuantity(String productId, String size, int delta) {
    state = state.map((item) {
      if (item.product.id == productId && item.selectedSize == size) {
        final newQty = item.quantity + delta;
        return newQty <= 0
            ? null  // mark for removal
            : CartItem(product: item.product, selectedSize: item.selectedSize, quantity: newQty);
      }
      return item;
    }).whereType<CartItem>().toList();
  }

  double get total => state.fold(0, (sum, item) => sum + item.totalPrice);
  int get itemCount => state.fold(0, (sum, item) => sum + item.quantity);
}

// The provider — declared outside of any widget or class (global)
final cartProvider = NotifierProvider<CartNotifier, List<CartItem>>(CartNotifier.new);

// Computed providers that depend on cart — no extra code in CartNotifier needed
final cartTotalProvider = Provider<double>((ref) {
  final items = ref.watch(cartProvider);
  return items.fold(0, (sum, item) => sum + item.totalPrice);
});

final cartCountProvider = Provider<int>((ref) {
  final items = ref.watch(cartProvider);
  return items.fold(0, (sum, item) => sum + item.quantity);
});
```

```dart
// Using CartNotifier in widgets
class CartTab extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final items = ref.watch(cartProvider);       // subscribes to entire cart list
    final total = ref.watch(cartTotalProvider);  // subscribes to just the total

    return Column(
      children: [
        Expanded(
          child: ListView.builder(
            itemCount: items.length,
            itemBuilder: (_, index) => CartItemCard(
              item: items[index],
              onIncrease: () => ref.read(cartProvider.notifier).updateQuantity(
                items[index].product.id, items[index].selectedSize, 1,
              ),
              onDecrease: () => ref.read(cartProvider.notifier).updateQuantity(
                items[index].product.id, items[index].selectedSize, -1,
              ),
            ),
          ),
        ),
        Text('Total: ₹${total.toStringAsFixed(0)}'),
      ],
    );
  }
}

// From anywhere — add to cart without BuildContext or context.read
// (in a repository, service class, or other provider)
final container = ProviderContainer();  // or pass ref from parent provider
container.read(cartProvider.notifier).addItem(product, size);
```

---

## 3. `AsyncNotifierProvider` — Async State With Full Control

```dart
// Use when you need to: fetch initially + allow refresh + mutate + handle errors
class ProductsNotifier extends AsyncNotifier<List<Product>> {
  @override
  Future<List<Product>> build() async {
    // This is called on first use and on ref.refresh()
    return _fetchProducts();
  }

  Future<List<Product>> _fetchProducts() async {
    final response = await ProductApi.getAll();
    return response.map(Product.fromJson).toList();
  }

  // Optimistic update — update UI immediately, rollback if server fails
  Future<void> toggleWishlist(String productId) async {
    final previousState = state;

    // Immediately update UI (optimistic)
    state = AsyncData(
      state.requireValue.map((p) {
        if (p.id == productId) return p.copyWith(isWishlisted: !p.isWishlisted);
        return p;
      }).toList(),
    );

    try {
      await ProductApi.toggleWishlist(productId);
    } catch (e) {
      // Rollback on failure
      state = previousState;
      // Show error (via another provider or direct snackbar)
    }
  }
}

final productsProvider = AsyncNotifierProvider<ProductsNotifier, List<Product>>(ProductsNotifier.new);
```

---

## 4. `ConsumerWidget` and `ConsumerStatefulWidget`

```dart
// StatelessWidget → ConsumerWidget
// The only change: add WidgetRef ref parameter to build()
class MyWidget extends ConsumerWidget {
  const MyWidget({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {  // ← WidgetRef
    final value = ref.watch(someProvider);
    return Text(value.toString());
  }
}

// StatefulWidget → ConsumerStatefulWidget + ConsumerState
class MyStatefulWidget extends ConsumerStatefulWidget {
  const MyStatefulWidget({super.key});

  @override
  ConsumerState<MyStatefulWidget> createState() => _MyStatefulWidgetState();
}

class _MyStatefulWidgetState extends ConsumerState<MyStatefulWidget> {
  // ref is available as a field — no parameter needed
  @override
  void initState() {
    super.initState();
    // Use ref in initState safely
    ref.listenManual(cartProvider, (prev, next) {
      // called when cartProvider changes — use for side effects in initState
      if (next.length > (prev?.length ?? 0)) {
        print('Item added to cart');
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final count = ref.watch(cartCountProvider);  // ref is a field, no parameter
    return Text('Cart: $count');
  }
}
```

---

## 5. Provider Composition — Providers Depending on Providers

```dart
// The user's ID comes from auth
final authProvider = StateProvider<AuthUser?>((ref) => null);

// The user's cart depends on their ID — auto-disposes and reloads when auth changes
final userCartProvider = StreamProvider.autoDispose<List<CartItem>>((ref) {
  final user = ref.watch(authProvider);
  if (user == null) return Stream.value([]);

  // When authProvider changes (login/logout), this provider rebuilds automatically
  return FirebaseFirestore.instance
      .collection('carts')
      .doc(user.id)
      .collection('items')
      .snapshots()
      .map((snap) => snap.docs.map((d) => CartItem.fromFirestore(d)).toList());
});

// The user's profile — auto-disposes and reloads when auth changes
final userProfileProvider = FutureProvider.autoDispose<UserProfile>((ref) async {
  final user = ref.watch(authProvider);
  if (user == null) throw const UnauthorizedException();
  return UserProfileRepository.fetch(user.id);
});
```

🧑‍💻 **Developer:** This is Riverpod's superpower. When `authProvider` changes (user logs out), every provider that `ref.watch(authProvider)` is automatically invalidated and rebuilt. You don't need to manually reset anything on logout — the state clears itself.

---

## 6. `ref.listen` — Side Effects on State Change

```dart
// Side effects: navigation, showing SnackBars, analytics — triggered by state changes
class AuthScreen extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // ref.listen does NOT subscribe this widget to rebuilds
    // It only calls the callback when the value changes
    ref.listen<AuthState>(authStateProvider, (previous, next) {
      if (next == AuthState.authenticated) {
        Navigator.of(context).pushReplacementNamed('/home');
      } else if (next == AuthState.error) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Authentication failed. Please try again.')),
        );
      }
    });

    return const LoginForm();
  }
}
```

**Rule:** `ref.watch` → reactive, rebuilds. `ref.read` → one-time, no rebuild. `ref.listen` → side effects on change, no rebuild.

---

## 7. Testing With Riverpod

```dart
testWidgets('cart shows items after adding', (tester) async {
  // Override the cart provider with a pre-populated state
  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        cartProvider.overrideWith(() => CartNotifier()..addItem(testProduct, 'M')),
      ],
      child: const MaterialApp(home: CartTab()),
    ),
  );

  // Cart should show the pre-populated item
  expect(find.text(testProduct.name), findsOneWidget);
  expect(find.text('₹${testProduct.price}'), findsOneWidget);
});

// Unit testing a Notifier — no widgets needed
test('addItem increases cart count', () {
  final container = ProviderContainer();
  addTearDown(container.dispose);

  final notifier = container.read(cartProvider.notifier);
  expect(container.read(cartCountProvider), equals(0));

  notifier.addItem(testProduct, 'M');
  expect(container.read(cartCountProvider), equals(1));

  notifier.addItem(testProduct, 'M');  // same item + same size = quantity++
  expect(container.read(cartCountProvider), equals(2));
  expect(container.read(cartProvider).length, equals(1));  // still 1 cart item
});

// Testing FutureProvider with mock
test('productsProvider loads and exposes data', () async {
  final container = ProviderContainer(
    overrides: [
      // Override the HTTP client with a mock
      httpClientProvider.overrideWithValue(MockHttpClient()),
    ],
  );
  addTearDown(container.dispose);

  // Wait for the async provider to complete
  await container.read(productsProvider.future);

  final products = container.read(productsProvider).requireValue;
  expect(products, isNotEmpty);
  expect(products.first.name, equals('Test Product'));
});
```

---

## Riverpod Provider Cheat Sheet

| Provider Type | State Type | When to Use |
|--------------|-----------|-------------|
| `Provider<T>` | Synchronous, read-only | Computed values, DI |
| `StateProvider<T>` | Simple mutable (int, bool, enum) | Tabs, toggles, counters |
| `FutureProvider<T>` | Async, load once | One-time network requests |
| `StreamProvider<T>` | Real-time stream | Firebase, WebSocket |
| `NotifierProvider<N, T>` | Complex synchronous state | Cart, user, any multi-method state |
| `AsyncNotifierProvider<N, T>` | Complex async state | Products list with refresh + filter |

---

## Lab — Convert the Shopping App to Riverpod

Migrate the shopping app from Provider (Week 11 lab) to Riverpod:

**Providers to create:**
```dart
// Global declarations (outside any class)
final productsProvider = AsyncNotifierProvider<ProductsNotifier, List<Product>>(ProductsNotifier.new);
final cartProvider = NotifierProvider<CartNotifier, List<CartItem>>(CartNotifier.new);
final cartTotalProvider = Provider<double>((ref) {...});
final cartCountProvider = Provider<int>((ref) {...});
final selectedCategoryProvider = StateProvider<ProductCategory?>((ref) => null);
final filteredProductsProvider = Provider<AsyncValue<List<Product>>>((ref) {...});
```

**Convert each screen:**
- Remove ALL `BuildContext`-based provider access (`context.watch`, `context.read`)
- Replace with `ref.watch` and `ref.read`
- `HomeTab extends ConsumerWidget` (not `StatelessWidget`)
- `CartTab extends ConsumerWidget`
- `ProductDetailScreen extends ConsumerWidget`

**Test requirements:**
- Unit test `CartNotifier.addItem()` — no widgets needed
- Widget test `ProductDetailScreen` — override `productsProvider` with mock data
- Widget test `CartBadge` — starts at 0, shows 1 after add

---

## 8. `@riverpod` — Code Generation (riverpod_generator)

> 📄 **Riverpod Docs:**
> *"The @riverpod annotation generates provider declarations for you. Instead of manually writing `final myProvider = Provider<T>((ref) => ...)`, annotate a function and let build_runner generate the provider."*

Manual provider declarations are verbose and error-prone — wrong generic types, forgetting `autoDispose`, mismatching the Notifier type. Code generation eliminates all of it.

```yaml
# pubspec.yaml
dependencies:
  riverpod_annotation: ^2.3.0

dev_dependencies:
  riverpod_generator: ^2.4.0
  build_runner: ^2.4.0
```

```dart
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'providers.g.dart';  // generated file

// ──── Simple provider (replaces: final appVersionProvider = Provider<String>(...)) ────
@riverpod
String appVersion(AppVersionRef ref) => '2.1.0';
// Generated: final appVersionProvider = AutoDisposeProvider<String>(...)

// ──── FutureProvider (replaces: final userProvider = FutureProvider.autoDispose<User>(...)) ────
@riverpod
Future<UserProfile> userProfile(UserProfileRef ref) async {
  final response = await http.get(Uri.parse('/api/profile'));
  return UserProfile.fromJson(jsonDecode(response.body));
}
// Generated: final userProfileProvider = AutoDisposeFutureProvider<UserProfile>(...)

// ──── Notifier class (replaces: class + NotifierProvider declaration) ────
@riverpod
class Cart extends _$Cart {
  @override
  List<CartItem> build() => [];   // initial state

  void addItem(Product product, String size) {
    state = [...state, CartItem(product: product, selectedSize: size)];
  }

  void removeItem(String productId) {
    state = state.where((i) => i.product.id != productId).toList();
  }
}
// Generated: final cartProvider = AutoDisposeNotifierProvider<Cart, List<CartItem>>(...)

// ──── AsyncNotifier (replaces: class + AsyncNotifierProvider declaration) ────
@riverpod
class Products extends _$Products {
  @override
  Future<List<Product>> build() async {
    return ProductApi.getAll();
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() => ProductApi.getAll());
  }
}
// Generated: final productsProvider = AutoDisposeAsyncNotifierProvider<Products, List<Product>>(...)

// ──── Keep alive (disable autoDispose) ────
@Riverpod(keepAlive: true)
class Auth extends _$Auth {
  @override
  AuthState build() => const AuthState.unauthenticated();
  // This provider persists for the entire app lifecycle
}
```

```bash
# Generate the providers
dart run build_runner build --delete-conflicting-outputs

# Watch mode — regenerates on file save
dart run build_runner watch
```

**Manual vs Generated — side by side:**
```dart
// ❌ Manual — verbose, easy to get generics wrong
final cartProvider = NotifierProvider<CartNotifier, List<CartItem>>(CartNotifier.new);

class CartNotifier extends Notifier<List<CartItem>> {
  @override List<CartItem> build() => [];
}

// ✓ Generated — the annotation handles everything
@riverpod
class Cart extends _$Cart {
  @override List<CartItem> build() => [];
}
// Use as: ref.watch(cartProvider)  ← same API, less boilerplate
```

**Rule:** Use `@riverpod` for new projects. For existing projects, migrate gradually — both styles work together in the same app.

---

## 9. `.select()` — Fine-Grained Rebuilds

> 🍎 **Academy Golden Rule — Performance by Design:**
> *"Don't rebuild a widget for data it doesn't display. Select only the slice of state you need."*

```dart
// ❌ This widget rebuilds when ANY cart item changes (added, removed, quantity changed)
class CartBadge extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final items = ref.watch(cartProvider);     // subscribes to the entire list
    return Badge(label: Text('${items.length}'));
  }
}

// ✓ This widget ONLY rebuilds when the count changes
class CartBadge extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final count = ref.watch(cartProvider.select((items) => items.length));
    return Badge(label: Text('$count'));
  }
}
```

```dart
// Select a computed value — only rebuild when THIS specific value changes
final userName = ref.watch(
  userProfileProvider.select((profile) => profile.valueOrNull?.displayName ?? ''),
);

// Select from AsyncValue — common pattern for loading indicators
final isLoading = ref.watch(
  productsProvider.select((async) => async.isLoading),
);

// Multiple selects in one widget — each tracked independently
class OrderSummary extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final itemCount = ref.watch(cartProvider.select((c) => c.length));
    final total = ref.watch(cartTotalProvider);
    final currency = ref.watch(settingsProvider.select((s) => s.currency));
    // Rebuilds only when count, total, OR currency changes — not when
    // unrelated settings (theme, language) change
    return Text('$itemCount items · $currency${total.toStringAsFixed(2)}');
  }
}
```

**When to use `.select()`:**
- A provider holds a large object but your widget only needs one field
- You notice a widget rebuilding too often in DevTools
- The provider is shared widely and changes frequently

---

## 10. `ref.invalidate()` vs `ref.refresh()`

```dart
// ref.invalidate — marks provider as stale, rebuilds on NEXT read
ref.invalidate(productsProvider);
// If no widget is watching productsProvider, nothing happens yet
// When a widget next reads it, it rebuilds from scratch

// ref.refresh — invalidate + immediately read the new value
final freshProducts = ref.refresh(productsProvider);
// Forces rebuild NOW and returns the new value

// Common patterns:
// Pull-to-refresh
RefreshIndicator(
  onRefresh: () async {
    ref.invalidate(productsProvider);
    // Wait for the provider to complete its async rebuild
    await ref.read(productsProvider.future);
  },
  child: ProductList(),
)

// Logout — invalidate everything user-specific
void logout() {
  ref.invalidate(userProfileProvider);
  ref.invalidate(userCartProvider);
  ref.invalidate(ordersProvider);
  ref.read(authProvider.notifier).signOut();
}
```

---

## 11. Enterprise Provider Organization — Scaling to 50+ Providers

> 🏢 **Enterprise Reality:**
> *"A real app has 50-200 providers. Without organization, you end up with a single `providers.dart` file with 2000 lines. Enterprise teams organize providers by feature, with clear dependency graphs."*

```
lib/
├── features/
│   ├── expenses/
│   │   ├── domain/
│   │   ├── data/
│   │   └── presentation/
│   │       ├── providers/
│   │       │   ├── expense_providers.dart     ← all providers for this feature
│   │       │   └── expense_providers.g.dart   ← generated
│   │       ├── bloc/
│   │       └── screens/
│   │
│   ├── auth/
│   │   └── presentation/
│   │       └── providers/
│   │           └── auth_providers.dart
│   │
│   └── settings/
│       └── presentation/
│           └── providers/
│               └── settings_providers.dart
│
├── core/
│   └── providers/
│       ├── dio_providers.dart          ← HTTP client, interceptors
│       ├── storage_providers.dart      ← Hive, SecureStorage
│       └── analytics_providers.dart    ← analytics service
```

```dart
// Scoped providers — providers that only exist within a specific screen subtree
// Use ProviderScope.overrides to inject screen-specific dependencies

class ExpenseDetailScreen extends ConsumerWidget {
  final String expenseId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return ProviderScope(
      overrides: [
        // This provider is scoped to this screen only
        currentExpenseIdProvider.overrideWithValue(expenseId),
      ],
      child: const _ExpenseDetailContent(),
    );
  }
}

final currentExpenseIdProvider = Provider<String>((ref) {
  throw UnimplementedError('Must be overridden');
});

final expenseDetailProvider = FutureProvider.autoDispose<Expense>((ref) {
  final id = ref.watch(currentExpenseIdProvider);
  return ref.watch(expenseRepoProvider).getExpense(id);
});
```

```dart
// Provider observers — enterprise logging and debugging
class AppProviderObserver extends ProviderObserver {
  @override
  void didUpdateProvider(ProviderBase provider, Object? previousValue,
      Object? newValue, ProviderContainer container) {
    if (kDebugMode) {
      logger.d('[${provider.name ?? provider.runtimeType}] updated');
    }
  }

  @override
  void providerDidFail(ProviderBase provider, Object error,
      StackTrace stackTrace, ProviderContainer container) {
    logger.e('Provider failed: ${provider.name}', error: error, stackTrace: stackTrace);
    Sentry.captureException(error, stackTrace: stackTrace);
  }
}

// Register in main.dart
runApp(ProviderScope(
  observers: [AppProviderObserver()],
  child: const App(),
));
```

---

## Challenge — Search With Debounce

Build a real-time search using Riverpod + debounce (avoid API call on every keystroke):

```dart
// Search query state
final searchQueryProvider = StateProvider<String>((ref) => '');

// Debounced search — waits 400ms after last keystroke before firing
final debouncedQueryProvider = Provider<String>((ref) {
  final query = ref.watch(searchQueryProvider);
  // Hint: use ref.onDispose + Timer for debounce
  // cancelPreviousTimer, start new timer, update when timer fires
  return query;  // replace with debounced version
});

// Search results — depends on debounced query
final searchResultsProvider = FutureProvider.autoDispose<List<Product>>((ref) async {
  final query = ref.watch(debouncedQueryProvider);
  if (query.isEmpty) return [];
  return ProductApi.search(query);
});
```

Requirements:
- Search results show after 400ms of no typing
- Show loading indicator while searching
- Show "No results found" empty state
- Pressing clear resets to empty results immediately
- The search provider disposes itself when the screen is closed (`autoDispose`)

---

## Week 12 Verify

1. What does `ProviderScope` do? Where in the widget tree does it go and why?
2. What is `AsyncValue<T>`? List its three states and show the `.when()` pattern.
3. `ref.watch(cartProvider)` inside `build()` vs `ref.read(cartProvider.notifier)` inside `onPressed`. What is the rule and why?
4. `FutureProvider.autoDispose` — what does `autoDispose` do? When is this useful?
5. You want the cart to automatically reload when the user logs out. How does `ref.watch(authProvider)` inside `userCartProvider` achieve this?
6. `ref.listen<T>(provider, (prev, next) {...})` — how is this different from `ref.watch`? What is it used for?
7. In a unit test for `CartNotifier`, why do you use `ProviderContainer` instead of pumping a widget?
8. `@riverpod class Cart extends _$Cart` — what does this annotation generate? Why is `_$Cart` the base class?
9. `ref.watch(cartProvider.select((items) => items.length))` — what does `.select()` do? When would you use it over a plain `ref.watch`?
10. `ref.invalidate(productsProvider)` vs `ref.refresh(productsProvider)` — what is the difference? Which one do you use in a pull-to-refresh?
11. In a 50-provider app, you organize providers into `lib/features/auth/providers/`, `lib/features/expenses/providers/`, etc. Why is this better than a single `providers.dart` file? What does `ProviderScope.overrides` let you do per-feature?
12. `ProviderObserver.didUpdateProvider` fires on every state change. In production, what would you log here? Why is this useful for debugging crash reports?

---

**Next → [Week 13: HTTP & REST APIs](Week_13_HTTP_and_REST_APIs.md)**
