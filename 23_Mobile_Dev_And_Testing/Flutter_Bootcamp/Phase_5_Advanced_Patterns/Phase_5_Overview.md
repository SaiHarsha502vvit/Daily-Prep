# Phase 5 — Advanced Patterns
### Month 5 | Weeks 20-23

---

## What This Phase Is About

Phase 5 is what separates a Flutter developer from a Flutter engineer. You'll study patterns used in production codebases at companies like Google, Alibaba, and Nubank. Your code becomes maintainable, testable, and scalable.

The capstone: an **Expense Tracker** built with Clean Architecture and BLoC.

---

## Week Map

| File | Topic | Core Skills |
|------|-------|-------------|
| [Week_20_BLoC_Pattern.md](Week_20_BLoC_Pattern.md) | BLoC Pattern | Events, States, Cubits, BlocBuilder/BlocListener, stream mechanics |
| [Week_21_Clean_Architecture.md](Week_21_Clean_Architecture.md) | Clean Architecture | Layers, SOLID, Repository pattern, DI, platform channels |
| [Week_22_Advanced_Animations_CustomPaint.md](Week_22_Advanced_Animations_CustomPaint.md) | Advanced Animations & CustomPaint | Explicit animations, CustomPainter, Lottie, staggered sequences |
| [Week_23_Project_ExpenseTracker.md](Week_23_Project_ExpenseTracker.md) | Project: Expense Tracker | Clean Architecture + BLoC + charts, the Phase 5 capstone |

---

## Week 20 — BLoC: Business Logic Component

BLoC is an architecture pattern, not just a package. It separates business logic from UI completely.

```
UI (Widgets)
  ↓ sends Events
BLoC (Business Logic)
  ↓ emits States
UI (Widgets) rebuilds based on State
```

```dart
// Events (what the user does)
sealed class CartEvent {}
class AddItemEvent extends CartEvent { final Product product; AddItemEvent(this.product); }
class RemoveItemEvent extends CartEvent { final String productId; RemoveItemEvent(this.productId); }
class ClearCartEvent extends CartEvent {}

// States (what the UI shows)
sealed class CartState {}
class CartInitial extends CartState {}
class CartLoading extends CartState {}
class CartLoaded extends CartState {
  final List<CartItem> items;
  final double total;
  CartLoaded({required this.items, required this.total});
}
class CartError extends CartState { final String message; CartError(this.message); }

// BLoC
class CartBloc extends Bloc<CartEvent, CartState> {
  final CartRepository _repo;

  CartBloc(this._repo) : super(CartInitial()) {
    on<AddItemEvent>(_onAddItem);
    on<RemoveItemEvent>(_onRemoveItem);
    on<ClearCartEvent>(_onClear);
  }

  Future<void> _onAddItem(AddItemEvent event, Emitter<CartState> emit) async {
    try {
      emit(CartLoading());
      final updatedCart = await _repo.addItem(event.product);
      emit(CartLoaded(items: updatedCart, total: _calcTotal(updatedCart)));
    } catch (e) {
      emit(CartError(e.toString()));
    }
  }
}

// In UI
BlocBuilder<CartBloc, CartState>(
  builder: (context, state) => switch (state) {
    CartInitial() => const Text('Your cart is empty'),
    CartLoading() => const CircularProgressIndicator(),
    CartLoaded(items: final items) => CartListView(items: items),
    CartError(message: final msg) => Text('Error: $msg'),
  },
)
```

**Cubit — simpler BLoC without events:**
```dart
class ThemeCubit extends Cubit<ThemeMode> {
  ThemeCubit() : super(ThemeMode.light);

  void toggleTheme() =>
    emit(state == ThemeMode.light ? ThemeMode.dark : ThemeMode.light);
}
```
Use Cubit when there's only one trigger. Use full BLoC when multiple event types with shared logic.

**Tasks:**
1. Counter with BLoC (inc, dec, reset events)
2. Convert Weather App from Riverpod to BLoC
3. Auth flow using BLoC (login event, loading state, success state, error state)
4. Shopping cart with BLoC (add, remove, update quantity, apply coupon events)
5. BLoC testing — unit test every event handler

---

## Week 21 — Clean Architecture + SOLID + Platform Channels

**The 3 Layers:**

```
Presentation Layer (UI)
  ← depends on →
Domain Layer (Business Logic — pure Dart, no Flutter imports)
  ← depends on →
Data Layer (Firebase, HTTP, Hive — implements domain interfaces)
```

The key rule: **dependencies point inward only**. The domain layer knows nothing about Firebase or Flutter — it only deals with your business concepts.

```
lib/
  features/
    expense/
      data/
        models/         ← ExpenseModel (has fromJson, toJson)
        repositories/   ← ExpenseRepositoryImpl (implements domain interface)
        datasources/    ← ExpenseRemoteDataSource, ExpenseLocalDataSource
      domain/
        entities/       ← Expense (pure Dart class, no Firebase imports)
        repositories/   ← ExpenseRepository (abstract interface)
        usecases/       ← GetExpenses, AddExpense, DeleteExpense
      presentation/
        bloc/           ← ExpenseBloc, ExpenseCubit
        screens/
        widgets/
  core/
    error/              ← Failure, AppException classes
    usecases/           ← UseCase abstract class
    network/            ← NetworkInfo, DioClient
```

**Why this architecture?**
- You can swap Firebase for a different database without touching the UI
- You can test business logic without any Flutter or Firebase dependencies
- New features are added in one feature folder without touching others
- Teams can work on different features without merge conflicts

**SOLID in Flutter context:**
- **S** — Single Responsibility: one class per responsibility (no `ApiHelperAndStorageAndAuthManager`)
- **O** — Open/Closed: use abstract classes; add new implementations without modifying existing code
- **L** — Liskov Substitution: `MockExpenseRepository` must work wherever `ExpenseRepository` is used (critical for testing)
- **I** — Interface Segregation: `IReadRepository` and `IWriteRepository` instead of one huge interface
- **D** — Dependency Inversion: `ExpenseBloc` depends on `ExpenseRepository` (abstract), not `FirebaseExpenseRepository` (concrete)

**Tasks:**
1. Refactor your Notes App into feature-based clean architecture
2. Create a `UseCase` base class and implement 5 use cases for expenses
3. Write a fake/mock repository for testing without Firebase
4. Implement error handling with a `Failure` sealed class hierarchy
5. Dependency injection with `get_it` package

---

## Week 22 — Animations: From Basic to Custom

**Explicit Animations:**
```dart
class PulseAnimation extends StatefulWidget { /* ... */ }

class _PulseAnimationState extends State<PulseAnimation>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    )..repeat(reverse: true);

    _scaleAnimation = Tween<double>(begin: 1.0, end: 1.2).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _scaleAnimation,
      builder: (_, child) => Transform.scale(
        scale: _scaleAnimation.value,
        child: child,
      ),
      child: const Icon(Icons.favorite, color: Colors.red, size: 48),
    );
  }
}
```

**CustomPainter — draw anything:**
```dart
class ExpenseChartPainter extends CustomPainter {
  final List<double> values;
  ExpenseChartPainter(this.values);

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.deepPurple
      ..style = PaintingStyle.fill;

    final maxValue = values.reduce(max);
    final barWidth = size.width / values.length;

    for (int i = 0; i < values.length; i++) {
      final barHeight = (values[i] / maxValue) * size.height;
      canvas.drawRRect(
        RRect.fromRectAndRadius(
          Rect.fromLTWH(
            i * barWidth + barWidth * 0.1,
            size.height - barHeight,
            barWidth * 0.8,
            barHeight,
          ),
          const Radius.circular(4),
        ),
        paint,
      );
    }
  }

  @override
  bool shouldRepaint(ExpenseChartPainter oldDelegate) =>
      oldDelegate.values != values;
}
```

**Lottie animations** (JSON animations from Adobe After Effects / lottiefiles.com):
```dart
Lottie.asset('assets/lottie/success.json', width: 200, height: 200);
Lottie.network('https://lottiefiles.com/...json');
```

**Topics:**
- Staggered animations (multiple animations in sequence)
- `AnimatedList` (items animate in/out when added/removed)
- `PageRouteBuilder` (custom screen transitions)
- `FlutterAnimate` package (declarative animation syntax)
- Parallax scrolling effects

---

## Week 23 — Capstone Start: Expense Tracker

**App Concept:** Personal finance tracker. Track daily expenses, view spending by category, see monthly trends.

**Features:**
- Add/edit/delete expenses (amount, category, date, note)
- Dashboard: total this month, top categories, recent transactions
- Charts: daily spending line chart, category pie/donut chart, weekly bar chart
- Budget system: set monthly budget per category, show when approaching limit
- CSV export

**Architecture:**
```
Domain: Expense, Category, Budget entities
UseCases: AddExpense, GetMonthlyExpenses, GetCategoryBreakdown, SetBudget
Data: Hive local (offline-first), optional Firebase sync
Presentation: BLoC for expense state, Cubit for UI state (selected month, selected tab)
```

**This week:**
- Set up the architecture skeleton
- Define all entities and use cases
- Implement the domain layer (no Flutter, pure Dart — test it)
- Create the BLoC with all events and states
- Wire up the data layer with Hive

**Next phase (Week 23 continuation into Phase 6):**
- Build all screens
- Add animations to charts
- Add CSV export
- Write full test suite

---

## Phase 5 Self-Assessment

After this phase:
- You understand BLoC and can implement it from scratch
- You can structure a feature using clean architecture
- You understand platform channels (MethodChannel, EventChannel, Pigeon) and where they fit in the architecture
- You can write custom animations and CustomPainter widgets
- You can add Lottie animations
- You understand SOLID principles and can explain each with a Flutter example

**→ Start with [Week_20_BLoC_Pattern.md](Week_20_BLoC_Pattern.md)**
*(detailed file — ask to build when you reach here)*
