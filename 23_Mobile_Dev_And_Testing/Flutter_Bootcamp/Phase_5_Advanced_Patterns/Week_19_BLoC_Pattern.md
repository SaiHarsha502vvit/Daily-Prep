# Week 19 — BLoC: Business Logic Component
### Events in, States out — the architecture that scales to any team size

---

> Three lenses on every concept:
> - 🧑‍💻 **Developer** — how BLoC separates logic from UI, the event→state pipeline, Cubit vs BLoC
> - 🎨 **Designer** — BLoC's state types map directly to UI states you need to design
> - 🧪 **Tester** — BLoC is the most testable Flutter architecture; every handler unit-testable

---

## What BLoC Is

> 📄 **flutter_bloc Docs:**
> *"The BLoC (Business Logic Component) pattern separates the presentation layer from the business logic layer. BLoC receives Events from the UI and emits States. Widgets rebuild based on states, not direct method calls."*

```
UI Widget
  │
  │  bloc.add(UserTappedLoginEvent())     ← Widget sends an event
  ↓
BLoC
  │
  │  _onUserTappedLogin(event, emit)      ← Handler runs
  │  emit(AuthLoadingState())
  │  await authRepo.signIn(...)
  │  emit(AuthSuccessState(user))         ← BLoC emits new state
  ↓
UI Widget rebuilds with new state          ← BlocBuilder sees the state change
```

BLoC is fundamentally different from Riverpod/Provider:

| | Riverpod / Provider | BLoC |
|--|--|--|
| State changes via | Method calls on Notifier | Discrete Events added to BLoC |
| Best for | Async data, caching, simple state | Complex state machines, team consistency |
| Testing | `ProviderContainer` | `blocTest` helper (cleaner) |
| Boilerplate | Less | More (but more explicit) |
| Industry use | Startups, indie | Google, Alibaba, Nubank, large teams |

Neither is better — they solve the same problem differently. BLoC's explicit Events make it easier to trace "what happened" in complex flows.

---

## Setup

```yaml
dependencies:
  flutter_bloc: ^8.1.0
  bloc: ^8.1.0
dev_dependencies:
  bloc_test: ^9.1.0
```

---

## 1. The Building Blocks — Events and States

Define all Events (user actions) and States (UI representations) first. These are the contract between your UI and your business logic.

```dart
// Events — what can happen (user actions, external triggers)
// Use sealed classes: compiler enforces exhaustive handling
sealed class CounterEvent {}
class IncrementEvent extends CounterEvent {}
class DecrementEvent extends CounterEvent {}
class ResetEvent extends CounterEvent {}
class IncrementByEvent extends CounterEvent {
  final int amount;
  const IncrementByEvent(this.amount);
}

// States — what the UI can show
sealed class CounterState {
  final int count;
  const CounterState(this.count);
}
class CounterInitial extends CounterState { const CounterInitial() : super(0); }
class CounterUpdated extends CounterState { const CounterUpdated(super.count); }
```

**Rule:** Events are verbs in past tense (things that happened). States are nouns (what the UI currently shows). Never put UI logic inside events or business logic inside states.

---

## 2. The BLoC — Event Handlers

```dart
// lib/features/counter/presentation/bloc/counter_bloc.dart

import 'package:flutter_bloc/flutter_bloc.dart';

class CounterBloc extends Bloc<CounterEvent, CounterState> {
  CounterBloc() : super(const CounterInitial()) {
    // Register a handler for each event type
    // These run sequentially — Flutter BLoC processes one event at a time by default
    on<IncrementEvent>(_onIncrement);
    on<DecrementEvent>(_onDecrement);
    on<ResetEvent>(_onReset);
    on<IncrementByEvent>(_onIncrementBy);
  }

  void _onIncrement(IncrementEvent event, Emitter<CounterState> emit) {
    emit(CounterUpdated(state.count + 1));
  }

  void _onDecrement(DecrementEvent event, Emitter<CounterState> emit) {
    if (state.count > 0) {
      emit(CounterUpdated(state.count - 1));
    }
  }

  void _onReset(ResetEvent event, Emitter<CounterState> emit) {
    emit(const CounterInitial());
  }

  void _onIncrementBy(IncrementByEvent event, Emitter<CounterState> emit) {
    emit(CounterUpdated(state.count + event.amount));
  }
}
```

---

## 3. Using BLoC in Widgets

```dart
// Provide the BLoC — creates it and disposes when the widget leaves the tree
BlocProvider(
  create: (context) => CounterBloc(),   // CounterBloc is created here
  child: const CounterScreen(),
)

// Or provide multiple BLoCs
MultiBlocProvider(
  providers: [
    BlocProvider(create: (_) => CounterBloc()),
    BlocProvider(create: (_) => AuthBloc(authRepo: AuthRepository())),
    BlocProvider(create: (_) => ThemeCubit()),
  ],
  child: const App(),
)

// Access in a child widget
class CounterScreen extends StatelessWidget {
  const CounterScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Counter')),
      body: BlocBuilder<CounterBloc, CounterState>(
        // builder is called every time a new state is emitted
        builder: (context, state) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  '${state.count}',
                  style: Theme.of(context).textTheme.displayLarge,
                ),
                // Pattern match on state type
                if (state is CounterInitial)
                  Text('Start counting!',
                      style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant)),
              ],
            ),
          );
        },
      ),
      floatingActionButton: Column(
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
          FloatingActionButton(
            heroTag: 'inc',
            // context.read<BLoC>() — triggers an event WITHOUT rebuilding this widget
            onPressed: () => context.read<CounterBloc>().add(IncrementEvent()),
            child: const Icon(Icons.add),
          ),
          const SizedBox(height: 8),
          FloatingActionButton.small(
            heroTag: 'dec',
            onPressed: () => context.read<CounterBloc>().add(DecrementEvent()),
            child: const Icon(Icons.remove),
          ),
          const SizedBox(height: 8),
          FloatingActionButton.small(
            heroTag: 'reset',
            onPressed: () => context.read<CounterBloc>().add(ResetEvent()),
            child: const Icon(Icons.refresh),
          ),
        ],
      ),
    );
  }
}
```

🎨 **Designer:** BLoC's sealed states map to your design states directly:
- `AuthInitial` → splash screen
- `AuthLoading` → loading spinner on login button
- `AuthSuccess` → navigate to home
- `AuthError` → show error message on login form

Every `BlocBuilder` is a direct implementation of the states you've designed. The mapping is explicit and documented in code.

---

## 4. `BlocListener` and `BlocConsumer`

```dart
// BlocListener — runs side effects without rebuilding
// Use for: navigation, SnackBars, dialogs — one-time actions
BlocListener<AuthBloc, AuthState>(
  listener: (context, state) {
    switch (state) {
      case AuthSuccess():
        Navigator.pushReplacementNamed(context, '/home');
      case AuthError(:final message):
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(message), backgroundColor: Colors.red),
        );
      default:
        break;
    }
  },
  child: const LoginForm(),   // LoginForm doesn't rebuild on state changes
)

// BlocConsumer — both listen (side effects) AND build (UI updates)
// Use when a screen needs both: update UI AND do a side effect
BlocConsumer<LoginBloc, LoginState>(
  listener: (context, state) {
    if (state is LoginSuccess) {
      Navigator.pushReplacementNamed(context, '/home');
    }
  },
  builder: (context, state) {
    return LoginFormContent(
      isLoading: state is LoginLoading,
      error: state is LoginError ? state.message : null,
    );
  },
)
```

🧑‍💻 **Developer:**
- `BlocBuilder` → UI updates only (widget rebuilds)
- `BlocListener` → side effects only (no rebuild)
- `BlocConsumer` → both (avoid when possible — cleaner to split)

```dart
// buildWhen — optimization: skip rebuilds for certain state transitions
BlocBuilder<ExpenseBloc, ExpenseState>(
  buildWhen: (prev, curr) {
    // Only rebuild when the expenses list actually changed
    // Don't rebuild if only a loading spinner state changed
    return curr is ExpenseLoaded && prev != curr;
  },
  builder: (context, state) => ExpenseList(state: state),
)
```

---

## 5. Cubit — BLoC Without Events

> 📄 **flutter_bloc Docs:**
> *"A Cubit is a subset of BLoC that does not rely on events and instead uses methods to emit new states. Cubits are ideal for simple use cases."*

```dart
// Use Cubit when: simple toggles, counters, single-action state
// No events needed — just call methods directly

class ThemeCubit extends Cubit<ThemeMode> {
  ThemeCubit() : super(ThemeMode.system);

  void setLight() => emit(ThemeMode.light);
  void setDark() => emit(ThemeMode.dark);
  void setSystem() => emit(ThemeMode.system);
  void toggle() => emit(state == ThemeMode.dark ? ThemeMode.light : ThemeMode.dark);
}

// In the widget
IconButton(
  icon: const Icon(Icons.brightness_4),
  onPressed: () => context.read<ThemeCubit>().toggle(),
)
```

**Cubit vs BLoC decision:**

```
Multiple ways to trigger the same state change?     → BLoC
Complex async sequences with multiple emit()s?       → BLoC
You want to log/track every state transition?        → BLoC
Simple: one action → one state change?               → Cubit
```

---

## 6. A Real BLoC — Auth Flow

```dart
// EVENTS
sealed class AuthEvent {}
class LoginRequested extends AuthEvent {
  final String email, password;
  const LoginRequested({required this.email, required this.password});
}
class LogoutRequested extends AuthEvent {}
class AuthCheckRequested extends AuthEvent {}

// STATES
sealed class AuthState {}
class AuthInitial extends AuthState {}
class AuthLoading extends AuthState {}
class AuthAuthenticated extends AuthState {
  final User user;
  const AuthAuthenticated(this.user);
}
class AuthUnauthenticated extends AuthState {}
class AuthError extends AuthState {
  final String message;
  const AuthError(this.message);
}

// BLOC
class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final AuthRepository _repo;

  AuthBloc(this._repo) : super(AuthInitial()) {
    on<AuthCheckRequested>(_onCheckAuth);
    on<LoginRequested>(_onLogin);
    on<LogoutRequested>(_onLogout);
  }

  Future<void> _onCheckAuth(AuthCheckRequested event, Emitter<AuthState> emit) async {
    emit(AuthLoading());
    try {
      final user = await _repo.getCurrentUser();
      if (user != null) {
        emit(AuthAuthenticated(user));
      } else {
        emit(AuthUnauthenticated());
      }
    } catch (_) {
      emit(AuthUnauthenticated());
    }
  }

  Future<void> _onLogin(LoginRequested event, Emitter<AuthState> emit) async {
    emit(AuthLoading());
    try {
      final user = await _repo.signIn(email: event.email, password: event.password);
      emit(AuthAuthenticated(user));
    } on AuthException catch (e) {
      emit(AuthError(e.message));
    }
  }

  Future<void> _onLogout(LogoutRequested event, Emitter<AuthState> emit) async {
    await _repo.signOut();
    emit(AuthUnauthenticated());
  }
}
```

```dart
// Usage in app root — fire check on startup
BlocProvider(
  create: (context) => AuthBloc(AuthRepository())
    ..add(AuthCheckRequested()),  // check auth state immediately
  child: BlocListener<AuthBloc, AuthState>(
    listener: (context, state) {
      if (state is AuthAuthenticated) {
        Navigator.pushReplacementNamed(context, '/home');
      } else if (state is AuthUnauthenticated) {
        Navigator.pushReplacementNamed(context, '/login');
      }
    },
    child: const SplashScreen(),
  ),
)
```

---

## 7. Testing BLoC — `blocTest`

BLoC testing is the cleanest testing experience in Flutter. No widgets, no mocking the widget tree.

```dart
// test/features/auth/bloc/auth_bloc_test.dart

import 'package:bloc_test/bloc_test.dart';
import 'package:mockito/mockito.dart';
import 'package:test/test.dart';

@GenerateMocks([AuthRepository])
void main() {
  late MockAuthRepository mockRepo;
  late AuthBloc authBloc;

  setUp(() {
    mockRepo = MockAuthRepository();
    authBloc = AuthBloc(mockRepo);
  });

  tearDown(() => authBloc.close());

  group('LoginRequested', () {
    blocTest<AuthBloc, AuthState>(
      'emits [Loading, Authenticated] when login succeeds',
      build: () {
        when(mockRepo.signIn(email: 'h@g.com', password: '123'))
            .thenAnswer((_) async => const User(id: '1', email: 'h@g.com'));
        return authBloc;
      },
      act: (bloc) => bloc.add(const LoginRequested(email: 'h@g.com', password: '123')),
      expect: () => [
        AuthLoading(),
        AuthAuthenticated(const User(id: '1', email: 'h@g.com')),
      ],
      verify: (_) {
        verify(mockRepo.signIn(email: 'h@g.com', password: '123')).called(1);
      },
    );

    blocTest<AuthBloc, AuthState>(
      'emits [Loading, Error] when login fails',
      build: () {
        when(mockRepo.signIn(email: any, password: any))
            .thenThrow(const AuthException('Wrong password'));
        return authBloc;
      },
      act: (bloc) => bloc.add(const LoginRequested(email: 'h@g.com', password: 'wrong')),
      expect: () => [
        AuthLoading(),
        const AuthError('Wrong password'),
      ],
    );
  });

  group('LogoutRequested', () {
    blocTest<AuthBloc, AuthState>(
      'emits [Unauthenticated] after logout',
      seed: () => AuthAuthenticated(const User(id: '1', email: 'h@g.com')),
      build: () {
        when(mockRepo.signOut()).thenAnswer((_) async {});
        return authBloc;
      },
      act: (bloc) => bloc.add(LogoutRequested()),
      expect: () => [AuthUnauthenticated()],
    );
  });
}
```

🧪 **Tester:** `blocTest` gives you:
- `build` — create the BLoC (with mocks injected)
- `seed` — set initial state without running events
- `act` — fire the event you're testing
- `expect` — the list of states that should be emitted, in order
- `verify` — assert repository methods were called

This is more expressive than standard `test()` + manual state tracking.

---

## BLoC vs Cubit vs Riverpod — Quick Reference

```
Simple toggle / counter / theme preference
  → Cubit (2 files: cubit.dart + state.dart)

Auth flow / checkout flow / multi-step form
  → BLoC (3 files: bloc.dart + events.dart + states.dart)

Server state / caching / derived computed values
  → Riverpod FutureProvider / AsyncNotifierProvider

App-wide simple state (tab index, search query)
  → Riverpod StateProvider or Cubit
```

---

## 8. `EventTransformer` — Debounce Search, Throttle Clicks

> 📄 **flutter_bloc Docs:**
> *"You can override the EventTransformer for a specific event handler to control how events are processed. By default events are processed concurrently."*

The most common real-world use: a search field that fires an event on every keystroke. Without debouncing, you'd call the API 10 times per word typed.

```yaml
dependencies:
  bloc_concurrency: ^0.2.0  # provides: sequential, concurrent, droppable, restartable
  stream_transform: ^2.1.0  # provides: debounceTime, throttle
```

```dart
import 'package:bloc_concurrency/bloc_concurrency.dart';
import 'package:stream_transform/stream_transform.dart';

// Custom debounce transformer — composable with bloc_concurrency
EventTransformer<E> debounce<E>(Duration duration) {
  return (events, mapper) => events.debounceTime(duration).switchMap(mapper);
}

class SearchBloc extends Bloc<SearchEvent, SearchState> {
  final SearchRepository _repo;

  SearchBloc(this._repo) : super(SearchInitial()) {
    // DEBOUNCE — waits 400ms after the last event before calling _onQueryChanged
    // User types "flutter" fast: fires 7 events, only ONE API call happens
    on<SearchQueryChanged>(
      _onQueryChanged,
      transformer: debounce(const Duration(milliseconds: 400)),
    );

    // SEQUENTIAL — events queue; each waits for previous to finish
    // Good for form submission — prevents double submit
    on<SubmitFormEvent>(_onSubmit, transformer: sequential());

    // DROPPABLE — ignores new events while one is already in progress
    // Good for: refresh button, prevents spam
    on<RefreshEvent>(_onRefresh, transformer: droppable());

    // RESTARTABLE — cancels in-flight handler when new event arrives
    // Alternative to debounce when you want instant cancel (not delay)
    on<FilterChangedEvent>(_onFilter, transformer: restartable());
  }

  Future<void> _onQueryChanged(SearchQueryChanged event, Emitter<SearchState> emit) async {
    if (event.query.trim().isEmpty) { emit(SearchInitial()); return; }
    emit(SearchLoading());
    try {
      final results = await _repo.search(event.query);
      emit(SearchLoaded(results: results, query: event.query));
    } catch (e) {
      emit(SearchError(e.toString()));
    }
  }
}
```

**EventTransformer decision table:**

| Transformer | Behavior | Use case |
|--|--|--|
| `concurrent` (default) | All run simultaneously | Independent events |
| `sequential` | Queue — wait for each | Form submission, ordering matters |
| `droppable` | Ignore new while one runs | Refresh button, prevent double-tap |
| `restartable` | Cancel previous, start new | Live filters, search with instant cancel |
| `debounce(400ms)` | Wait N ms after last event | Search field → API calls |

---

## 9. BLoC-to-BLoC Communication

```dart
// When CartBloc needs to react when AuthBloc state changes (e.g., logout → clear cart)
// Pattern: Subscribe to the other BLoC's stream inside this BLoC

class CartBloc extends Bloc<CartEvent, CartState> {
  final CartRepository _repo;
  final AuthBloc _authBloc;
  late final StreamSubscription<AuthState> _authSub;

  CartBloc(this._repo, this._authBloc) : super(CartEmpty()) {
    on<LoadCartEvent>(_onLoad);
    on<ClearCartEvent>(_onClear);
    on<AddToCartEvent>(_onAdd);

    // Listen to auth state and react
    _authSub = _authBloc.stream.listen((authState) {
      switch (authState) {
        case AuthAuthenticated(:final user):
          add(LoadCartEvent(userId: user.id));     // load cart on login
        case AuthUnauthenticated():
          add(ClearCartEvent());                   // clear cart on logout
        default:
          break;
      }
    });
  }

  @override
  Future<void> close() {
    _authSub.cancel();  // CRITICAL: cancel subscription when this BLoC closes
    return super.close();
  }
}

// Register with the auth BLoC injected
sl.registerFactory(() => CartBloc(sl<CartRepository>(), sl<AuthBloc>()));
// Note: AuthBloc must be a singleton (registerLazySingleton) not a factory
// Otherwise CartBloc would get a different AuthBloc instance
```

---

## 10. BLoC Testing Philosophy

> 🍎 **Academy Golden Rule — If You Can't Test It, You Can't Ship It:**
> *"BLoC's entire value proposition is testability. Every event-to-state transition is deterministic and testable without a widget, without a device, without Firebase. If your BLoC tests require pumpWidget, your architecture is wrong."*

```dart
// The ideal BLoC test: zero Flutter imports, runs in < 0.1 seconds
import 'package:test/test.dart';   // NOT flutter_test
import 'package:bloc_test/bloc_test.dart';

blocTest<CartBloc, CartState>(
  'adding same item twice increments quantity instead of duplicating',
  build: () => CartBloc(FakeCartRepository()),
  act: (bloc) {
    bloc.add(AddItemEvent(product: testShoe, size: 'M'));
    bloc.add(AddItemEvent(product: testShoe, size: 'M'));
  },
  expect: () => [
    isA<CartLoaded>().having((s) => s.items.length, 'item count', 1),
    isA<CartLoaded>()
        .having((s) => s.items.length, 'item count', 1)
        .having((s) => s.items.first.quantity, 'quantity', 2),
  ],
);

// Test error recovery — optimistic delete with rollback
blocTest<CartBloc, CartState>(
  'restores item when server delete fails',
  seed: () => CartLoaded(items: [testItem]),
  build: () {
    final repo = MockCartRepository();
    when(repo.deleteItem(any)).thenThrow(Exception('Network'));
    return CartBloc(repo);
  },
  act: (bloc) => bloc.add(RemoveItemEvent(productId: 'shoe-1', size: 'M')),
  expect: () => [
    isA<CartLoaded>().having((s) => s.items, 'optimistic', isEmpty),
    isA<CartLoaded>().having((s) => s.items.length, 'rolled back', 1),
  ],
);
```

**BLoC test coverage targets:**
```
Every event type               → at least one test
Every state type               → at least one test produces it
Error paths                    → test that errors emit error states, not crash
Optimistic updates             → test rollback on failure
Event ordering                 → test two events in sequence
Initial state                  → test that Bloc starts in expected state
```

---

## 11. BLoC Observer — Enterprise Logging & Debugging

> 🏢 **Enterprise Reality:**
> *"In production, you can't attach DevTools. You need every state transition logged to Crashlytics as breadcrumbs, so when a crash report comes in, you can see the exact sequence of events that led to it."*

```dart
class AppBlocObserver extends BlocObserver {
  @override
  void onEvent(Bloc bloc, Object? event) {
    super.onEvent(bloc, event);
    logger.d('${bloc.runtimeType} ← ${event.runtimeType}');

    // Breadcrumbs for crash reporting
    Sentry.addBreadcrumb(Breadcrumb(
      message: '${bloc.runtimeType} received ${event.runtimeType}',
      category: 'bloc.event',
      data: {'bloc': bloc.runtimeType.toString(), 'event': event.toString()},
    ));
  }

  @override
  void onTransition(Bloc bloc, Transition transition) {
    super.onTransition(bloc, transition);
    logger.d('${bloc.runtimeType}: ${transition.currentState.runtimeType} → ${transition.nextState.runtimeType}');
  }

  @override
  void onError(BlocBase bloc, Object error, StackTrace stackTrace) {
    super.onError(bloc, error, stackTrace);
    logger.e('${bloc.runtimeType} error', error: error, stackTrace: stackTrace);

    Sentry.captureException(error, stackTrace: stackTrace, withScope: (scope) {
      scope.setTag('bloc', bloc.runtimeType.toString());
    });
  }
}

// Register in main.dart
void main() {
  Bloc.observer = AppBlocObserver();
  runApp(const App());
}
```

---

## 12. Multi-BLoC Coordination — Enterprise Patterns

```dart
// Pattern: BLoC Facade — orchestrate multiple BLoCs for complex flows
class CheckoutFacade {
  final CartBloc _cartBloc;
  final PaymentBloc _paymentBloc;
  final OrderBloc _orderBloc;
  final AnalyticsService _analytics;

  CheckoutFacade(this._cartBloc, this._paymentBloc, this._orderBloc, this._analytics);

  Future<void> processCheckout({required PaymentMethod method}) async {
    final cartState = _cartBloc.state;
    if (cartState is! CartLoaded || cartState.items.isEmpty) return;

    // Step 1: Validate cart
    _cartBloc.add(ValidateCartEvent());

    // Step 2: Process payment
    _paymentBloc.add(ProcessPaymentEvent(
      amount: cartState.total,
      method: method,
      items: cartState.items,
    ));

    // Step 3: Create order (happens after payment succeeds via stream listener)
    // Step 4: Clear cart
    // Step 5: Track conversion

    _analytics.trackEvent(AnalyticsEvents.beginCheckout, params: {
      'item_count': cartState.items.length,
      'total': cartState.total,
      'payment_method': method.name,
    });
  }
}

// Pattern: Hydrated BLoC — persist and restore state across app restarts
// pubspec.yaml: hydrated_bloc: ^9.1.0
class SettingsBloc extends HydratedBloc<SettingsEvent, SettingsState> {
  SettingsBloc() : super(const SettingsState.defaults()) {
    on<ChangeThemeEvent>((event, emit) {
      emit(state.copyWith(themeMode: event.mode));
      // State is automatically persisted to disk by HydratedBloc
    });
    on<ChangeLocaleEvent>((event, emit) {
      emit(state.copyWith(locale: event.locale));
    });
  }

  @override
  SettingsState fromJson(Map<String, dynamic> json) => SettingsState.fromJson(json);

  @override
  Map<String, dynamic> toJson(SettingsState state) => state.toJson();
}

// Initialize HydratedBloc storage before runApp
void main() async {
  HydratedBloc.storage = await HydratedStorage.build(
    storageDirectory: await getApplicationDocumentsDirectory(),
  );
  runApp(const App());
}
```

---

## Lab — Shopping Cart With BLoC

Rebuild the shopping cart from Phase 2 using BLoC:

**Events:**
```dart
sealed class CartEvent {}
class AddItemEvent extends CartEvent { final Product product; final String size; }
class RemoveItemEvent extends CartEvent { final String productId; final String size; }
class UpdateQuantityEvent extends CartEvent { final String productId; final String size; final int delta; }
class ClearCartEvent extends CartEvent {}
class ApplyCouponEvent extends CartEvent { final String code; }
```

**States:**
```dart
sealed class CartState {}
class CartEmpty extends CartState {}
class CartLoaded extends CartState {
  final List<CartItem> items;
  final double subtotal;
  final double discount;   // from coupon
  final double total;
  final String? appliedCoupon;
}
class CartApplyingCoupon extends CartLoaded { /* inherits items from CartLoaded */ }
class CartCouponError extends CartLoaded { final String error; }
```

**Write blocTests for each event. Run `flutter test` — all must pass before building the UI.**

---

## Challenge — Auth State Machine

Draw the complete auth state machine on paper first, then implement it with BLoC:

States: Initial, Loading, Authenticated, Unauthenticated, EmailUnverified, Error

Events that need to work:
- Register → Loading → Authenticated (or EmailUnverified if email not verified)
- Login → Loading → Authenticated (or EmailUnverified)
- Logout → Unauthenticated
- VerifyEmail → polls Firebase until `emailVerified == true` → Authenticated
- ForgotPassword → sends reset email (state stays unchanged)

Write `blocTest` for every transition.

---

## Week 19 Verify

1. What is the difference between a `BlocBuilder` and a `BlocListener`? Give a concrete example of when you'd use each.
2. `context.read<CartBloc>().add(AddItemEvent(...))` — why is `read` used here instead of `watch`?
3. When should you use a `Cubit` instead of a full `BLoC`? Give an example of each.
4. In `blocTest`, what do `build`, `act`, and `expect` each represent?
5. A `BLoC` receives two events in quick succession. What happens? Are they processed simultaneously?
6. `buildWhen: (prev, curr) => curr is ExpenseLoaded` — what does this do and why is it useful?
7. You want to navigate to `/home` when auth succeeds. Should this logic go in `BlocBuilder` or `BlocListener`? Why?
8. Write a `blocTest` that verifies an optimistic delete: the item is removed immediately, but restored when the server returns an error. How many states do you expect?
9. `CartBloc` needs to react when `AuthBloc` emits `AuthUnauthenticated`. How do you wire this communication? Where do you cancel the subscription?
10. A search BLoC receives a `SearchEvent` on every keystroke. You want to debounce to 300ms. Which `EventTransformer` do you use, and how do you apply it?

---

**Next → [Week 20: Clean Architecture + SOLID](Week_20_Clean_Architecture.md)**
