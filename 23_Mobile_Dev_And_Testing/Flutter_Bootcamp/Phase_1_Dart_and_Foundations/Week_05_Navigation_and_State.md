# Week 5 — Navigation & State
### Moving between screens, passing data, and knowing where state lives

---

> Three lenses on every concept:
> - 🧑‍💻 **Developer** — how the Navigator stack works, APIs and patterns
> - 🎨 **Designer** — user flow, transition design, navigation UX decisions
> - 🧪 **Tester** — how to test navigation, how to verify data passed between screens

---

## What Is Navigation in Flutter?

### The Backstory — Three Generations of Flutter Navigation

Flutter's navigation system has gone through three distinct generations in seven years. Understanding *why* each generation replaced the previous one explains every design decision you'll encounter.

---

**Generation 1 — Navigator 1.0: The Mobile-Native Model (2018)**

Flutter launched with `Navigator.push()` and `Navigator.pop()`. This was a direct port of how mobile apps had always worked:
- iOS: `UINavigationController.push()` / `.pop()` (since 2007)
- Android: `FragmentManager.replace()` / the back stack (since 2010)

For mobile apps, this is perfect. You push screens onto a stack, the back button pops them, and state is preserved. Simple, predictable, type-safe because you pass data as constructor arguments to the next screen.

**The problem that appeared:** deep links. If someone sends you a link to a specific product page (`myapp://shop/products/shoe-123`), how does the app know to show:
- Home → Shop → Products List → Shoe 123

Navigator 1.0 had no way to construct a route stack from a URL. You could *open* a screen from a URL, but the back button went to the app's empty state, not through the logical route history. This was frustrating for users.

---

**Generation 2 — Navigator 2.0 / Router API: The Over-Engineering (2020)**

Google released Navigator 2.0 in May 2020. The idea was to make routing declarative and URL-aware — closer to how the web works with React Router.

The community's reaction was almost universally negative. Chris Sells (Flutter product manager at the time) wrote the announcement blog post. Within days, developers were posting that the new API required hundreds of lines of boilerplate to do what Navigator 1.0 did in ten. The API introduced four new abstractions (`RouterDelegate`, `RouteInformationParser`, `BackButtonDispatcher`, `RouterConfiguration`) just to replace `push()`.

It solved the deep linking problem but made everything else worse.

---

**Generation 3 — GoRouter: Community Fixes the Problem (2022)**

Brett Morgan, an independent developer, built `go_router` to solve the deep-linking problem with a simple API. Google noticed the community adopting it en masse, hired Brett, and made `go_router` an officially recommended package in 2022. Flutter then absorbed it into the `flutter/packages` monorepo.

`go_router` uses declarative URL-based routing with a simple API that any React Router user immediately understands. Under the hood it uses Navigator 2.0, but it hides all the complexity.

**The lesson:** three generations in seven years. Mobile-first (Navigator 1.0) → web-first overcorrection (Navigator 2.0) → pragmatic hybrid (GoRouter). You'll use all three in real projects because codebases don't always migrate immediately.

---

> 📄 **Flutter Docs (Navigation):**
> *"Flutter provides a complete system for navigating between screens and handling deep links. Small applications without complex deep linking can use Navigator, while apps with specific deep linking and navigation requirements should also consider using the Router to optionally integrate with the platform's navigation APIs."*

In Flutter, every screen is a **Route**. The `Navigator` manages a **stack of Routes** — pushing new screens on top, popping them off when going back. It's exactly like a stack data structure: last in, first out.

> **TypeScript/React comparison:** Flutter's `Navigator` is conceptually similar to React Router, but with a key difference — Flutter uses an **imperative stack** (push/pop), while React Router uses **declarative URLs** (`<Route path="/product/:id">`). Flutter's `go_router` package (covered later) brings declarative URL-based routing closer to React Router's model. The data-passing pattern is also different: React Router uses URL params and `useParams()`, while Flutter passes data directly through widget constructors — type-safe, no parsing needed.

```
Navigator Stack (think of it as a stack of cards)

     ┌────────────────────┐   ← TOP (currently visible)
     │  Product Detail    │
     ├────────────────────┤
     │  Category List     │
     ├────────────────────┤
     │  Home Screen       │   ← BOTTOM (first screen opened)
     └────────────────────┘
```

Pushing a route puts a new card on top. Popping removes the top card. When you press the back button, Flutter calls `Navigator.pop()`.

---

## 1. Basic Navigation — Push and Pop

> 📄 **Flutter Docs:**
> *"To navigate to a new route, use the Navigator.push() method. The push() method adds a Route to the stack of routes managed by the Navigator."*

```dart
// PUSH — go to a new screen
Navigator.of(context).push(
  MaterialPageRoute(
    builder: (context) => const ProductDetailScreen(productId: '42'),
  ),
);

// POP — go back to previous screen
Navigator.of(context).pop();

// Shorter form (context shorthand — same thing)
Navigator.push(
  context,
  MaterialPageRoute(builder: (_) => const ProductDetailScreen(productId: '42')),
);
```

`MaterialPageRoute` is the most common route type. It gives you the platform-appropriate transition: a slide-from-right on Android, a slide-from-bottom-right on iOS.

🎨 **Designer:** The push/pop model maps directly to how users think about navigation:
- Pushing = "going deeper into a section" → slide in from the right
- Popping = "going back" → slide out to the right

Every push should feel like opening something. Every pop should feel like closing and returning. Don't push when the action is "replace" — use `pushReplacement` instead (e.g., after login success, replace the login screen rather than stacking home on top of it).

🧪 **Tester:** Test navigation by checking that the correct screen appears after an action:

```dart
testWidgets('tapping product navigates to detail screen', (tester) async {
  await tester.pumpWidget(MaterialApp(home: ProductListScreen()));

  await tester.tap(find.text('Nike Air Max'));
  await tester.pumpAndSettle();  // wait for navigation animation to complete

  expect(find.byType(ProductDetailScreen), findsOneWidget);
  expect(find.text('Nike Air Max'), findsOneWidget);  // title visible on detail
});
```

---

## 2. Passing Data Between Screens

### Forward: Constructor Parameters (Always)

```dart
// The clean way — pass data through the constructor
// No globals, no shared state, no context magic

class ProductDetailScreen extends StatelessWidget {
  final String productId;
  final String productName;
  final double price;

  const ProductDetailScreen({
    super.key,
    required this.productId,
    required this.productName,
    required this.price,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(productName)),
      body: Center(child: Text('₹${price.toStringAsFixed(0)}')),
    );
  }
}

// At the call site
Navigator.push(
  context,
  MaterialPageRoute(
    builder: (_) => ProductDetailScreen(
      productId: product.id,
      productName: product.name,
      price: product.price,
    ),
  ),
);
```

**Rule:** Always pass data to the next screen through its constructor. Never use global variables or static fields for inter-screen data. This keeps screens independent and testable.

### Backward: Return a Value from a Screen

> 📄 **Flutter Docs:**
> *"To return data to the first route, use the Navigator.pop() method. The pop() method accepts an optional result argument. The result is returned to the Future that was awaited from push()."*

```dart
// Screen A — waits for Screen B to return a value
Future<void> _pickCategory() async {
  // push returns a Future that completes when the screen is popped
  final String? selectedCategory = await Navigator.push<String>(
    context,
    MaterialPageRoute(builder: (_) => const CategoryPickerScreen()),
  );

  // selectedCategory is null if user pressed back without selecting
  if (selectedCategory != null && mounted) {
    setState(() => _category = selectedCategory);
  }
}

// Screen B — returns a value when done
class CategoryPickerScreen extends StatelessWidget {
  const CategoryPickerScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Pick Category')),
      body: ListView(
        children: ['Electronics', 'Clothing', 'Books', 'Home']
            .map((cat) => ListTile(
                  title: Text(cat),
                  onTap: () => Navigator.pop(context, cat),  // returns 'Electronics' etc
                ))
            .toList(),
      ),
    );
  }
}
```

This pattern is clean and composable — Screen B doesn't need to know anything about Screen A. It just pops with a value. Screen A decides what to do with it.

🎨 **Designer:** This "return a result" pattern is common in real apps — a color picker that returns a color, a date picker that returns a date, a location picker that returns coordinates. The user "goes into" a selection screen and "comes back" with a choice. The back-with-result animation reinforces this metaphor.

🧪 **Tester:** Test the round-trip by simulating the selection:

```dart
testWidgets('selecting category updates the filter', (tester) async {
  await tester.pumpWidget(MaterialApp(home: FilterScreen()));

  // Tap "Category" to open picker
  await tester.tap(find.text('Category'));
  await tester.pumpAndSettle();

  // Select 'Electronics' on the picker screen
  await tester.tap(find.text('Electronics'));
  await tester.pumpAndSettle();

  // Back on FilterScreen — category should be updated
  expect(find.text('Electronics'), findsOneWidget);
});
```

---

## 3. `pushReplacement` and `pushAndRemoveUntil`

### `pushReplacement` — Replace Current Screen

```dart
// Use after login: replace login screen with home
// If user presses back from Home, they won't go back to Login
Navigator.pushReplacement(
  context,
  MaterialPageRoute(builder: (_) => const HomeScreen()),
);
```

### `pushAndRemoveUntil` — Clear the Stack

```dart
// Use after logout or completing a flow: clear EVERYTHING, start fresh
Navigator.pushAndRemoveUntil(
  context,
  MaterialPageRoute(builder: (_) => const LoginScreen()),
  (route) => false,  // (route) => false means "remove all existing routes"
);

// Or remove until you reach a specific route
Navigator.pushAndRemoveUntil(
  context,
  MaterialPageRoute(builder: (_) => const CheckoutSuccessScreen()),
  ModalRoute.withName('/home'),  // keep the home route, remove everything above
);
```

🎨 **Designer navigation patterns:**
| User Action | Navigator Operation | Reason |
|-------------|---------------------|--------|
| Open detail | `push` | User goes deeper, back returns them |
| Login success | `pushReplacement` | Don't allow back to login screen |
| Logout | `pushAndRemoveUntil` | Clear entire history, start at login |
| Checkout complete | `pushAndRemoveUntil` to home | Cart flow is done — don't let user "undo" purchase |
| Tab switch | Don't use Navigator | Use IndexedStack (preserves scroll/state) |

---

## 4. Dialogs, BottomSheets, and SnackBars — Overlays

These are not full screens — they appear over the current screen without a new route push.

### Dialog — Ask Before Acting

> 📄 **Flutter Docs:**
> *"Dialogs inform users about a task and can contain critical information, require decisions, or involve multiple tasks. A dialog disables all app functionality when they appear, and remain on screen until confirmed, dismissed, or a required action has been taken."*

```dart
// Show a confirmation dialog
Future<void> _confirmDelete() async {
  final bool? confirmed = await showDialog<bool>(
    context: context,
    barrierDismissible: false,     // user must tap a button — can't dismiss by tapping outside
    builder: (dialogContext) => AlertDialog(
      title: const Text('Delete note?'),
      content: const Text('This action cannot be undone.'),
      icon: const Icon(Icons.warning_amber, color: Colors.orange, size: 36),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(dialogContext).pop(false),  // returns false
          child: const Text('Cancel'),
        ),
        FilledButton(
          style: FilledButton.styleFrom(backgroundColor: Colors.red),
          onPressed: () => Navigator.of(dialogContext).pop(true),   // returns true
          child: const Text('Delete'),
        ),
      ],
    ),
  );

  if (confirmed == true && mounted) {
    _deleteNote();
  }
}
```

🎨 **Designer:** Dialogs interrupt the user. Use them only for:
- Destructive actions that can't be undone (delete, logout, cancel order)
- Critical decisions that block progression

Don't use dialogs for: error messages that don't need confirmation (use SnackBar), information (use a bottom sheet), selection (use a bottom sheet or navigation).

### SnackBar — Lightweight Feedback

```dart
// Show a SnackBar — brief, non-blocking feedback
ScaffoldMessenger.of(context).showSnackBar(
  SnackBar(
    content: const Text('Note saved'),
    duration: const Duration(seconds: 3),
    behavior: SnackBarBehavior.floating,   // floats above bottom nav
    margin: const EdgeInsets.all(12),
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
    action: SnackBarAction(
      label: 'Undo',
      onPressed: _undoDelete,
    ),
  ),
);

// Hide any currently showing SnackBar before showing a new one
ScaffoldMessenger.of(context)
  ..hideCurrentSnackBar()
  ..showSnackBar(SnackBar(content: Text('New message')));
```

🎨 **Designer:** SnackBars follow Material 3 guidelines:
- Duration: 4 seconds for simple messages, up to 10 seconds if there's an action to perform
- One action maximum (Undo, Retry, Dismiss)
- Don't stack multiple SnackBars — replace the current one

### Modal Bottom Sheet — Rich Selection

```dart
// Non-scrollable bottom sheet
showModalBottomSheet(
  context: context,
  shape: const RoundedRectangleBorder(
    borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
  ),
  builder: (_) => Padding(
    padding: const EdgeInsets.all(20),
    child: Column(
      mainAxisSize: MainAxisSize.min,   // ← critical, otherwise fills screen
      children: [
        Container(
          width: 40, height: 4,
          decoration: BoxDecoration(
            color: Colors.grey[300],
            borderRadius: BorderRadius.circular(2),
          ),
        ),
        const SizedBox(height: 16),
        const Text('Sort by', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        ...SortOption.values.map((option) => ListTile(
          title: Text(option.label),
          leading: Radio<SortOption>(
            value: option,
            groupValue: _currentSort,
            onChanged: (v) {
              setState(() => _currentSort = v!);
              Navigator.pop(context);
            },
          ),
        )),
      ],
    ),
  ),
);

// Scrollable bottom sheet (for longer content)
showModalBottomSheet(
  context: context,
  isScrollControlled: true,       // allows the sheet to be taller than 50% of screen
  builder: (_) => DraggableScrollableSheet(
    initialChildSize: 0.5,        // starts at 50% height
    minChildSize: 0.3,            // minimum 30% height
    maxChildSize: 0.95,           // maximum 95% height
    expand: false,
    builder: (_, scrollController) => ListView.builder(
      controller: scrollController,
      itemCount: comments.length,
      itemBuilder: (_, i) => CommentTile(comment: comments[i]),
    ),
  ),
);
```

---

## 5. Tab Navigation — Persistent Bottom Nav

> 📄 **Flutter Docs:**
> *"A bottom navigation bar that is typically used with Scaffold.bottomNavigationBar. Provides quick navigation between top-level views of an app."*

### The Wrong Way — Destroying Screen State

```dart
// ❌ This destroys and recreates each screen every time you switch tabs
// Scroll position resets, data reloads, form input disappears
int _currentIndex = 0;
final _screens = [HomeScreen(), SearchScreen(), ProfileScreen()];

@override
Widget build(BuildContext context) {
  return Scaffold(
    body: _screens[_currentIndex],  // ← creates new widget on every switch
    bottomNavigationBar: BottomNavigationBar(
      currentIndex: _currentIndex,
      onTap: (i) => setState(() => _currentIndex = i),
      items: [...],
    ),
  );
}
```

### The Right Way — `IndexedStack` Preserves State

```dart
// ✓ IndexedStack keeps ALL screens alive — only shows one at a time
// Scroll position, loaded data, form input — all preserved across tab switches
class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: const [
          HomeTab(),      // created once, kept alive even when not visible
          SearchTab(),
          CartTab(),
          ProfileTab(),
        ],
      ),
      bottomNavigationBar: NavigationBar(  // Material 3 bottom nav
        selectedIndex: _currentIndex,
        onDestinationSelected: (i) => setState(() => _currentIndex = i),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Home'),
          NavigationDestination(icon: Icon(Icons.search), label: 'Search'),
          NavigationDestination(icon: Icon(Icons.shopping_cart_outlined), selectedIcon: Icon(Icons.shopping_cart), label: 'Cart'),
          NavigationDestination(icon: Icon(Icons.person_outline), selectedIcon: Icon(Icons.person), label: 'Profile'),
        ],
      ),
    );
  }
}
```

🎨 **Designer:** Tab navigation should feel instant. If switching tabs takes 300ms to load, users notice. `IndexedStack` makes it instant because the screen is already built and just hidden. The design convention: active tab icon is filled, inactive is outlined — the `selectedIcon` parameter handles this.

🧪 **Tester:** Verify tab state is preserved:

```dart
testWidgets('scroll position preserved on tab switch', (tester) async {
  await tester.pumpWidget(MaterialApp(home: MainScreen()));

  // Scroll down on Home tab
  await tester.drag(find.byType(ListView).first, const Offset(0, -500));
  await tester.pump();

  // Switch to Search tab
  await tester.tap(find.byIcon(Icons.search));
  await tester.pump();

  // Switch back to Home tab
  await tester.tap(find.byIcon(Icons.home));
  await tester.pump();

  // Scroll position should still be at the bottom (IndexedStack preserved it)
  // (verify via scroll controller offset, not visible text)
});
```

---

## 6. Understanding Where State Lives — Lifting State Up

> 📄 **Flutter Docs:**
> *"For widgets that only need to change the UI, keep the state as local as possible — usually in the stateful widget itself. For state that multiple parts of your app need access to, lift the state up to the lowest common ancestor."*

This is one of the most important architectural decisions in Flutter.

### Local State — Stays in the Widget

```dart
// ExpandableCard's open/closed state belongs to itself
// No other widget cares about it → keep it local
class ExpandableCard extends StatefulWidget { ... }

class _ExpandableCardState extends State<ExpandableCard> {
  bool _isExpanded = false;  // ← local state — no other widget needs this

  // ...
}
```

### Lifted State — Moved to the Parent

```dart
// ❌ PROBLEM: CartBadge (in AppBar) needs the count
//             AddToCartButton (in ProductCard) updates the count
//             They're in completely different parts of the tree
//             Neither is the parent of the other

// ✓ SOLUTION: Lift state to the common ancestor that contains both
class ShopScreen extends StatefulWidget { ... }

class _ShopScreenState extends State<ShopScreen> {
  int _cartCount = 0;   // ← lifted up because BOTH AppBar and ProductCard need it

  void _addToCart() {
    setState(() => _cartCount++);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        actions: [
          CartBadge(count: _cartCount),  // receives count via constructor
        ],
      ),
      body: ProductGrid(
        onAddToCart: _addToCart,  // receives callback via constructor
      ),
    );
  }
}
```

**The flow is always:**
- Data flows **DOWN** via constructors (parent → child)
- Events flow **UP** via callbacks (child → parent)

### Prop Drilling — When Lifting State Gets Painful

```dart
// ❌ Classic prop drilling problem
// CartCount needs to reach a deeply nested button
// Every widget in between has to pass it down even though it doesn't use it

ShopScreen(_cartCount, _addToCart)
  └─ ProductSection(cartCount, onAddToCart)      // doesn't use it, just passes
       └─ ProductList(cartCount, onAddToCart)     // doesn't use it, just passes
            └─ ProductCard(cartCount, onAddToCart) // doesn't use it, just passes
                 └─ AddToCartButton(onAddToCart)   // finally uses it!
```

This is "prop drilling" — passing data through 4 layers of widgets that don't need it. It's messy, fragile, and hard to maintain.

**The solution is state management** — covered in Phase 3. `Provider`, `Riverpod`, and `InheritedWidget` all exist to solve this exact problem. For now, know that prop drilling is the pain you're feeling, and state management is the cure.

**Rule:** Keep state as local as possible. If only one widget uses it, it lives there. If two widgets need it, lift to their lowest common ancestor. If it's needed app-wide, it's time for state management.

---

## 7. The `mounted` Check in Navigation

When navigating, always check `mounted` before using `context` after any `await`:

```dart
Future<void> _submitForm() async {
  setState(() => _isLoading = true);

  try {
    await _authService.signIn(_email, _password);

    if (!mounted) return;  // user might have backed out during the await
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(builder: (_) => const HomeScreen()),
    );
  } catch (e) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(e.toString())),
    );
  } finally {
    if (mounted) setState(() => _isLoading = false);
  }
}
```

---

## 6. `go_router` — Declarative Navigation (The Modern Standard)

> 📄 **flutter.dev/go_router:**
> *"A declarative routing package for Flutter that uses the Router API to provide a convenient, url-based API for navigating between different screens. It supports deep links, redirects, nested routes, and typed parameters."*

> **Why does this package exist?** Navigator 1.0's `push`/`pop` is simple and works perfectly for 80% of apps. But it has three problems it can never fix:
>
> 1. **Deep links:** If a user taps a push notification that says "You have a new message in conversation #42", Navigator 1.0 can open the chat screen — but the back button goes to a blank app state, not to the conversations list. GoRouter builds the full route stack from a URL, so back works correctly.
>
> 2. **Auth redirects:** In Navigator 1.0, you write auth guards in every `initState()`. If the user's session expires mid-session, catching it means checking in every screen. GoRouter's `redirect` callback runs before every navigation — one place, catches everything.
>
> 3. **Flutter Web:** Browser URLs must match routes. A web app with Navigator 1.0 has the same URL on every page (`http://myapp.com/`). GoRouter creates proper `/home`, `/shop/product/123` URLs — essential for web SEO and sharing links.
>
> **When to keep using Navigator 1.0:** If your app has no deep links, no web target, and fewer than ~10 screens, Navigator 1.0 is fine. GoRouter has a setup cost; don't pay it if you don't need the features.

Navigator 1.0 (`push`/`pop`) works for simple apps. `go_router` is what production apps use because it supports deep links, typed route parameters, and redirect-based auth guards.

```yaml
dependencies:
  go_router: ^14.0.0
```

```dart
// lib/core/router/app_router.dart

import 'package:go_router/go_router.dart';

final goRouter = GoRouter(
  initialLocation: '/home',
  debugLogDiagnostics: true,  // prints route changes to console during dev

  // Redirect — runs before every navigation
  // Use for auth guards: redirect unauthenticated users to /login
  redirect: (context, state) {
    final authState = ProviderScope.containerOf(context).read(authStateProvider);
    final isLoggedIn = authState is AuthAuthenticated;
    final isLoginRoute = state.matchedLocation == '/login';

    if (!isLoggedIn && !isLoginRoute) return '/login';
    if (isLoggedIn && isLoginRoute) return '/home';
    return null;  // null = no redirect, continue navigation
  },

  routes: [
    GoRoute(
      path: '/login',
      name: 'login',
      builder: (context, state) => const LoginScreen(),
    ),

    GoRoute(
      path: '/home',
      name: 'home',
      builder: (context, state) => const HomeScreen(),

      // Nested routes — appear in route hierarchy
      routes: [
        GoRoute(
          path: 'expense/:id',   // :id is a path parameter
          name: 'expense-detail',
          builder: (context, state) {
            final id = state.pathParameters['id']!;
            return ExpenseDetailScreen(expenseId: id);
          },
        ),
        GoRoute(
          path: 'add-expense',
          name: 'add-expense',
          // fullscreenDialog: appears as modal, not slide
          pageBuilder: (context, state) => MaterialPage(
            fullscreenDialog: true,
            child: const AddExpenseScreen(),
          ),
        ),
      ],
    ),

    // Shell route — wraps child routes in a persistent shell (e.g., bottom nav)
    StatefulShellRoute.indexedStack(
      builder: (context, state, navigationShell) => MainShell(
        navigationShell: navigationShell,
      ),
      branches: [
        StatefulShellBranch(routes: [
          GoRoute(path: '/dashboard', builder: (_, __) => const DashboardScreen()),
        ]),
        StatefulShellBranch(routes: [
          GoRoute(path: '/expenses', builder: (_, __) => const ExpenseListScreen()),
        ]),
        StatefulShellBranch(routes: [
          GoRoute(path: '/settings', builder: (_, __) => const SettingsScreen()),
        ]),
      ],
    ),
  ],
);

// Provide the router in MaterialApp
class App extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      routerConfig: goRouter,    // replaces 'home:' with 'routerConfig:'
      title: 'Expense Tracker',
      theme: _buildTheme(),
    );
  }
}
```

```dart
// Navigation with go_router — in any widget

// Push (go to route, can go back)
context.push('/home/expense/42');
context.pushNamed('expense-detail', pathParameters: {'id': '42'});

// Replace (replace current route, can't go back to it)
context.go('/home');
context.goNamed('home');

// With query parameters
context.go('/expenses?category=food&month=6');

// Access query parameters in route builder
GoRoute(
  path: '/expenses',
  builder: (context, state) {
    final category = state.uri.queryParameters['category'];
    final month = state.uri.queryParameters['month'];
    return ExpenseListScreen(category: category, month: int.tryParse(month ?? ''));
  },
),

// Go back
context.pop();
context.pop(result);  // pop with a return value
```

```dart
// MainShell — persistent bottom navigation bar with go_router
class MainShell extends StatelessWidget {
  final StatefulNavigationShell navigationShell;
  const MainShell({super.key, required this.navigationShell});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: navigationShell,   // renders the current branch's route
      bottomNavigationBar: NavigationBar(
        selectedIndex: navigationShell.currentIndex,
        onDestinationSelected: (index) {
          navigationShell.goBranch(
            index,
            // When re-tapping current tab: go to initial route of that branch
            initialLocation: index == navigationShell.currentIndex,
          );
        },
        destinations: const [
          NavigationDestination(icon: Icon(Icons.dashboard), label: 'Dashboard'),
          NavigationDestination(icon: Icon(Icons.receipt_long), label: 'Expenses'),
          NavigationDestination(icon: Icon(Icons.settings), label: 'Settings'),
        ],
      ),
    );
  }
}
```

🧑‍💻 **Developer — Navigator 1.0 vs go_router:**
| Feature | Navigator 1.0 | go_router |
|--|--|--|
| Deep links | Manual handling | Built-in |
| URL sync (web/desktop) | Not supported | Automatic |
| Type-safe routes | No | Yes (with path params) |
| Auth redirects | Manual guards | `redirect:` callback |
| Tabs with state preservation | IndexedStack (manual) | `StatefulShellRoute` |
| Back button | Automatic | Automatic |

Use Navigator 1.0 for small apps (< 5 screens). Use go_router for everything else.

---

## 7. `PopScope` — Intercept the Back Button

> 📄 **Flutter Docs:**
> *"Registers a callback to veto attempts by the user to dismiss the enclosing ModalRoute. For screens with unsaved data, this lets you ask the user for confirmation before navigating away."*

```dart
// PopScope replaced WillPopScope in Flutter 3.14+

class NoteEditorScreen extends StatefulWidget { ... }

class _NoteEditorState extends State<NoteEditorScreen> {
  bool _hasUnsavedChanges = false;

  @override
  Widget build(BuildContext context) {
    return PopScope(
      // canPop: false = intercept the back gesture
      canPop: !_hasUnsavedChanges,

      // onPopInvokedWithResult fires whether pop was allowed or not
      onPopInvokedWithResult: (didPop, result) async {
        if (didPop) return;  // pop already happened — do nothing

        // Pop was blocked — show confirmation dialog
        final shouldLeave = await showDialog<bool>(
          context: context,
          builder: (_) => AlertDialog(
            title: const Text('Discard changes?'),
            content: const Text('You have unsaved changes that will be lost.'),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context, false),
                child: const Text('Keep editing'),
              ),
              FilledButton(
                onPressed: () => Navigator.pop(context, true),
                child: const Text('Discard'),
              ),
            ],
          ),
        );

        if (shouldLeave == true && context.mounted) {
          Navigator.pop(context);  // manually pop after user confirms
        }
      },
      child: Scaffold(
        appBar: AppBar(title: const Text('Edit Note')),
        body: /* ... */,
      ),
    );
  }
}
```

---

## Navigator Methods Quick Reference

| Method | What it does | When to use |
|--------|-------------|-------------|
| `push(route)` | Add screen on top | Open a new screen |
| `pop([result])` | Remove top screen, optionally return data | Go back |
| `pushReplacement(route)` | Replace current with new | After login, onboarding complete |
| `pushAndRemoveUntil(route, predicate)` | Push and clear history | After logout, after checkout |
| `popUntil(predicate)` | Pop multiple screens at once | "Go home" from deep navigation |
| `canPop()` | Returns true if there's something to pop | Disable back button when stack is empty |
| `maybePop()` | Pop if possible, do nothing otherwise | Safe back button handling |

```dart
// popUntil — go all the way back to home
Navigator.popUntil(context, ModalRoute.withName('/home'));

// canPop — show back button only if there's somewhere to go back to
if (Navigator.canPop(context)) {
  Navigator.pop(context);
}
```

---

## 8. Deep Linking & Platform Navigation Conventions

> 🍎 **Academy Golden Rule — Navigation Must Feel Native:**
> *"Android users expect the back button to go to the previous screen. iOS users expect a swipe-from-left-edge gesture. Web users expect the browser back button and URL sharing to work. Your navigation architecture must handle all three without separate code paths."*

```dart
// go_router handles deep linking automatically
// This URL works in browser, shared link, and push notification tap:
// myapp://expense-tracker/expenses/abc123
GoRoute(
  path: '/expenses/:id',
  builder: (context, state) {
    final id = state.pathParameters['id']!;
    return ExpenseDetailScreen(expenseId: id);
  },
)

// Android back button behavior:
// - Navigator.pop() if there's a screen below → natural back
// - If at root screen → exit app (or confirm exit dialog)
// go_router handles this automatically with StatefulShellRoute

// iOS swipe-to-go-back:
// - Enabled by default on MaterialPageRoute and CupertinoPageRoute
// - Disable ONLY for screens where accidental back would lose data:
PopScope(
  canPop: !_hasUnsavedChanges,
  onPopInvokedWithResult: (didPop, result) {
    if (!didPop) _showDiscardDialog(context);
  },
  child: NoteEditorScreen(),
)
```

```dart
// Handle incoming deep links (push notification, shared link)
// go_router's redirect handles auth-gating automatically:
GoRouter(
  redirect: (context, state) {
    final isLoggedIn = ref.read(authProvider) != null;
    final isAuthRoute = state.matchedLocation.startsWith('/login');

    if (!isLoggedIn && !isAuthRoute) return '/login';
    if (isLoggedIn && isAuthRoute) return '/';
    return null;   // no redirect needed
  },
  // User taps shared link: myapp://expenses/abc123
  // → redirect checks auth → if logged in, goes to /expenses/abc123
  // → if not logged in, goes to /login, then after login redirects to /expenses/abc123
)
```

---

## Lab — Three-Screen App With Full Navigation

Build a note-taking app with three screens and complete navigation:

**Screen 1: Notes List** (`NoteListScreen`)
- `AppBar` with title "My Notes" and a search icon (non-functional for now)
- `FloatingActionButton` with `+` icon → pushes to NoteEditorScreen
- `ListView` showing note cards (title + snippet of content)
- Tapping a card → pushes to NoteDetailScreen with the note
- Long-pressing a card → shows a dialog "Delete this note?" with Cancel and Delete
- On delete confirmation: remove from list, show SnackBar "Note deleted" with Undo

**Screen 2: Note Detail** (`NoteDetailScreen`)
- Takes a `Note` object via constructor
- Shows full title and content
- Edit button in AppBar → pushes NoteEditorScreen pre-filled with the note
- Back arrow goes back to NoteListScreen

**Screen 3: Note Editor** (`NoteEditorScreen`)
- Optional `Note?` parameter — null means new note, non-null means editing
- Two `TextFormField`s: title and content
- Save button → pops and returns the saved Note object
- Back arrow shows dialog "Discard changes?" if fields have been modified

**State lives in NoteListScreen:**
- `List<Note> _notes` — the source of truth
- Add note: `_notes.add(returnedNote)`
- Edit note: `_notes[index] = returnedNote`
- Delete note: `_notes.removeAt(index)`

---

## Challenge — Bottom Nav With Preserved State

Extend the lab by wrapping NoteListScreen inside a bottom navigation app with four tabs:

- **Notes** — the list from the lab
- **Starred** — same list but filtered to starred notes only
- **Reminders** — placeholder screen
- **Settings** — placeholder screen

Requirements:
- Use `IndexedStack` — switching tabs must NOT reset scroll position
- Each tab's Navigator stack is independent (navigating to detail on Notes tab doesn't affect Starred tab)
- Starring a note from the Notes tab shows it immediately on the Starred tab (shared state)

This requires thinking about where `_notes` lives — it must be in the parent of the `IndexedStack` so all four tabs can read from and write to the same list.

---

## The Invisible Machinery — How Navigator and Routes Actually Work

The Navigator widget is a stack of `Route` objects. That's it. But the details of how routes create overlays, preserve state, and pass data back explain every navigation behavior you'll encounter.

### The Navigator's Internal Stack

```
Navigator._history: List<Route<dynamic>>

Initial state:
  _history = [MaterialPageRoute(HomePage)]
  Overlay entries: [HomePageEntry]   ← visible on screen

Navigator.push(MaterialPageRoute(DetailPage)):
  _history = [MaterialPageRoute(HomePage), MaterialPageRoute(DetailPage)]
  Overlay entries: [HomePageEntry, DetailPageEntry]
                    ← both in the Overlay
                    ← Detail is on top → visible
                    ← Home is UNDERNEATH → hidden, but STILL IN THE TREE
                    ← Home's State object is still alive in memory
                    ← No build() is called on Home during Detail's lifetime

Navigator.pop():
  _history = [MaterialPageRoute(HomePage)]
  → Detail route calls route.didPop(result)
  → Detail's OverlayEntry is animated out, then removed
  → Detail's State.dispose() is called
  → Home was never destroyed → becomes visible instantly
```

This is why Flutter navigation feels instant when you pop back — the previous page was always in the tree. The `PageRouteBuilder` transition animates the overlay entry in/out, not the underlying widgets.

### The Overlay System

The Navigator is built on `Overlay` — Flutter's system for rendering widgets on top of everything else. `Overlay` manages a list of `OverlayEntry` objects, rendering them in Z-order.

```
Overlay (the entire screen)
  ├── OverlayEntry: HomePage        ← sits at the bottom
  ├── OverlayEntry: DetailPage      ← sits on top (visible)
  └── (OverlayEntry: Dialog)        ← if you show a dialog, it inserts here
```

Every `Route` creates one or more `OverlayEntry` objects. `BottomSheet`, `Dialog`, `SnackBar`, `Tooltip` all work the same way — they insert `OverlayEntry` objects into the nearest `Navigator`'s `Overlay`.

### Passing Data Back — What `await` Actually Awaits

```dart
// The navigation API:
final Color? picked = await Navigator.push<Color>(
  context,
  MaterialPageRoute(builder: (_) => ColorPickerPage()),
);

// What happens under the hood:
// 1. push() creates a Completer<Color?> stored on the Route
// 2. push() returns Future<Color?> = completer.future
// 3. Your function suspends at 'await', returns to the event loop
// 4. User picks a color and taps "Done":
//    Navigator.pop(context, pickedColor)
// 5. Route.didPop(pickedColor) runs
// 6. completer.complete(pickedColor)
// 7. The Future resolves → your function resumes with picked = pickedColor
```

If the user presses the back button (hardware or `AppBar.leading`), `Navigator.pop(context)` is called with no argument → `completer.complete(null)` → `picked == null`. Always null-check the result.

### GoRouter — URL Pattern Matching Under the Hood

GoRouter adds a URL layer on top of Navigator 2.0. When the app opens `/shop/item/42`:

```
1. Platform delivers URL string to Flutter via platform channel
   (from a notification deep link, or typed in Safari/Chrome)
   
2. GoRouter's RouteInformationParser receives the URL string

3. Pattern matching — GoRouter walks its declared routes list:
   '/'          → HomeRoute        (no match)
   '/shop'      → ShopRoute        (no match — partial)
   '/shop/item/:id' → ItemRoute    (match! ':id' is a named capture group)
   
   Captured: { 'id': '42' }

4. RouteMatchList built: [ShopRoute, ItemRoute(id:'42')]

5. RouterDelegate receives the match list
   → builds GoRouterState for each match
   → calls each route's builder:
     [ShopPage(), ItemDetailPage(id: '42')]

6. Navigator receives these pages and syncs its _history stack
   → user sees ItemDetailPage
   → pressing Back pops to ShopPage (it was in the stack)
```

This is how deep links work: the URL is parsed, a page stack is reconstructed from scratch, and the user lands on the right screen even if they've never opened the app.

### State Preservation with `IndexedStack`

Regular tab navigation destroys and recreates tabs when you switch. `IndexedStack` keeps all tabs alive simultaneously:

```
IndexedStack(index: 1)
  ├── HomeTab()    index 0 — built, in the tree, State alive, NOT rendered
  ├── SearchTab()  index 1 — built, in the tree, State alive, IS rendered (index == 1)
  └── ProfileTab() index 2 — built, in the tree, State alive, NOT rendered

Switching to index 0:
  → only 'index' changes on the IndexedStack
  → all three widgets stay in the tree (no dispose/initState)
  → SearchTab scroll position, loaded data: still there
  → HomeTab renders, other two hidden
```

Trade-off: all tabs consume memory simultaneously. Instagram, YouTube, and most tab-heavy apps use this pattern because the cost of re-fetching data on every tab switch is worse than the memory overhead.

**Decision table:**

| Situation | What's happening | Fix |
|-----------|-----------------|-----|
| State lost when navigating and popping back | Route was replaced not pushed | Use `push()` not `pushReplacement()` |
| Tab state resets on every switch | Widget is being recreated | Use `IndexedStack` or `AutomaticKeepAliveClientMixin` |
| Deep link opens wrong screen | GoRouter route pattern mismatch | Check route declaration order — GoRouter matches first-wins |
| `await Navigator.push()` returns null | User pressed back (no pop argument) | Null-check the return value before using it |
| `Navigator.of(context)` throws "no Navigator found" | Context is above the MaterialApp | Use `navigatorKey.currentState` or restructure widget tree |

---

## Week 5 Verify — Answer Without Looking

1. What is the Navigator "stack"? What happens when you push? What happens when you pop?
2. You want to pass `selectedColor` from a color picker screen back to the screen that opened it. Show the code pattern — both sides.
3. When would you use `pushReplacement` instead of `push`? Give a real example.
4. Why does `_screens[_currentIndex]` in a bottom nav destroy state on every tab switch? How does `IndexedStack` fix it?
5. You have a "liked" counter that needs to be shown in both the ProductCard and in the AppBar badge. Where should the state live?
6. What is prop drilling? Why is it a problem? What phase of this course solves it?
7. After `await authService.signIn()`, why must you check `mounted` before calling `Navigator.push()`?
8. A user shares a deep link `myapp://expenses/abc123`. The user isn't logged in. Describe the redirect flow — what screens do they see, and how do they end up at the expense detail after login?
9. `PopScope(canPop: !_hasUnsavedChanges)` — what does this do on Android back button? What about iOS swipe-to-go-back?

---

**Want to actually get fluent, not just informed?** → [Navigation Challenges](Week_05b_Navigation_Challenges.md) — typed push/pop round trips, IndexedStack vs state loss, predict the back stack, build a route matcher from scratch.

**Next → [Week 6: Project — Personal Profile App](Week_06_Project_ProfileApp.md)**
