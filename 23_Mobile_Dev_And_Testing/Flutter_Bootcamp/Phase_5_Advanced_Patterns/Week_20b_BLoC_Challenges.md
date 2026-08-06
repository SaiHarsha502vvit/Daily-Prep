# BLoC Pattern Challenges

### Companion to [Week 20: BLoC Pattern](Week_20_BLoC_Pattern.md)

---

## How This Works

BLoC bugs are almost always about *when* a callback fires versus when it should — a SnackBar firing on every rebuild instead of once, a double-tap firing two events instead of one. Every problem here reproduces the bug on purpose before fixing it. Paste starters into [DartPad](https://dartpad.dev) (add `flutter_bloc`).

---

### W20-1 (Easy) — Cubit from scratch, and `buildWhen` proof

**Problem:** build a `CounterCubit` and prove, with `debugPrint`, that `BlocBuilder`'s `buildWhen` genuinely controls rebuild scope — the same lesson as [Week 12's `context.select` challenge](../Phase_3_State_and_APIs/Week_12b_State_Management_Challenges.md), Cubit's version of it.

```dart
class CounterCubit extends Cubit<int> {
  CounterCubit() : super(0);
  void increment() => emit(state + 1);
  void reset() => emit(0);
}

class CounterScreen extends StatelessWidget {
  const CounterScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return BlocBuilder<CounterCubit, int>(
      buildWhen: (previous, current) {
        debugPrint('buildWhen: $previous -> $current');
        return true; // TODO: only rebuild on EVEN numbers
      },
      builder: (context, count) {
        debugPrint('builder ran — count=$count');
        return Text('$count');
      },
    );
  }
}
```

**Task:** change `buildWhen` so the UI only rebuilds when `count` is even (odd counts update the state internally but the displayed text should visibly lag by one tap). Tap increment 4 times and confirm the displayed number only changes on taps 2 and 4.

<details><summary>Solution & Explanation</summary>

```dart
buildWhen: (previous, current) => current % 2 == 0,
```

🔴 **Explanation:** `buildWhen` receives every state transition and returns whether *this specific* transition should trigger a rebuild — the `builder` function only runs when it returns `true`. This is functionally identical to [Week 12's `context.select`](../Phase_3_State_and_APIs/Week_12b_State_Management_Challenges.md): both are ways of narrowing "state changed" down to "state changed **in a way I care about**." Notice `state` inside the Cubit still changes on every `emit()` regardless of `buildWhen` — `buildWhen` only governs the *widget's* rebuild decision, never the underlying state itself. This distinction matters: `context.read<CounterCubit>().state` would report the true current count at any moment, even between the "laggy" UI updates.

</details>

---

### W20-2 (Medium) — BlocListener vs BlocBuilder: the SnackBar bug

**Problem:** a checkout flow should show a SnackBar exactly once when a `CheckoutError` state is emitted — not on every rebuild.

```dart
sealed class CheckoutState {}
class CheckoutIdle extends CheckoutState {}
class CheckoutError extends CheckoutState {
  CheckoutError(this.message);
  final String message;
}

// BUGGY VERSION — SnackBar inside BlocBuilder's builder
class CheckoutScreenBuggy extends StatelessWidget {
  const CheckoutScreenBuggy({super.key});
  @override
  Widget build(BuildContext context) {
    return BlocBuilder<CheckoutCubit, CheckoutState>(
      builder: (context, state) {
        if (state is CheckoutError) {
          // BUG: this runs on every rebuild while state is CheckoutError,
          // not once when it BECOMES CheckoutError
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(state.message)));
        }
        return const Text('Checkout screen');
      },
    );
  }
}
```

**Task 1:** explain what actually goes wrong with the buggy version — under what circumstance would this widget rebuild *again* while still in the `CheckoutError` state (hint: think about what else in this screen's tree could trigger a rebuild that has nothing to do with checkout).

**Task 2:** fix it using `BlocConsumer` (or a separate `BlocListener` wrapping a `BlocBuilder`) so the SnackBar fires exactly once per error, not once per rebuild.

<details><summary>Solution & Explanation</summary>

```dart
class CheckoutScreenFixed extends StatelessWidget {
  const CheckoutScreenFixed({super.key});
  @override
  Widget build(BuildContext context) {
    return BlocConsumer<CheckoutCubit, CheckoutState>(
      listener: (context, state) {
        if (state is CheckoutError) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(state.message)));
        }
      },
      builder: (context, state) => const Text('Checkout screen'),
    );
  }
}
```

🔴 **Explanation:** `builder` is meant for **pure rendering** — it can run any number of times for reasons that have nothing to do with the BLoC at all (a parent widget rebuilding, an ancestor `Theme` changing, `MediaQuery` insets updating when the keyboard opens) — anything with a side effect (showing a SnackBar, navigating, playing a sound) does not belong there, because "how many times will `builder` run" is not something you control or should reason about. `listener` (and `BlocConsumer`'s `listener` parameter) fires exactly once **per actual state transition** — it's driven by the BLoC's stream emitting a new state, not by Flutter's independent rebuild scheduling. The rule from [Week 20](Week_20_BLoC_Pattern.md): **`builder` for "what does the screen look like right now," `listener` for "something happened, react to it once."**

</details>

---

### W20-3 (Medium) — Reproduce the double-payment bug, fix with `droppable()`

**Problem:** a "Pay Now" button dispatches a `PaymentEvent`. Rapid double-tapping (a real, common user behavior — impatience, or a slightly laggy UI) should not trigger two payments.

```dart
sealed class PaymentEvent {}
class PayNowEvent extends PaymentEvent {}

sealed class PaymentState {}
class PaymentIdle extends PaymentState {}
class PaymentProcessing extends PaymentState {}
class PaymentSuccess extends PaymentState {}

class PaymentBloc extends Bloc<PaymentEvent, PaymentState> {
  PaymentBloc() : super(PaymentIdle()) {
    on<PayNowEvent>(_onPay); // BUG: no transformer — events process sequentially,
                              // but a fast enough double-tap still queues TWO
                              // separate payment attempts before the first resolves
  }

  Future<void> _onPay(PayNowEvent event, Emitter<PaymentState> emit) async {
    emit(PaymentProcessing());
    debugPrint('Charging card...');
    await Future.delayed(const Duration(seconds: 2));
    emit(PaymentSuccess());
    debugPrint('Payment complete.');
  }
}
```

**Task 1:** dispatch `PayNowEvent()` twice in quick succession (simulating a fast double-tap, before the first 2-second charge completes). Watch the console — how many times does "Charging card..." print?

**Task 2:** fix it using the `droppable()` transformer from the `bloc_concurrency` package, so a payment already in flight blocks any new `PayNowEvent` from being processed until it resolves.

<details><summary>Solution & Explanation</summary>

```dart
import 'package:bloc_concurrency/bloc_concurrency.dart';

PaymentBloc() : super(PaymentIdle()) {
  on<PayNowEvent>(_onPay, transformer: droppable());
}
```

🔴 **Explanation:** without a transformer, BLoC's default behavior is `sequential()` — events are processed *one at a time, in order*, which sounds safe but isn't the whole story: "sequential" means the *second* event's handler doesn't **start** until the first one's handler function returns, but if both `PayNowEvent`s are already sitting in the queue by the time you tap twice quickly, the second one absolutely will run once the first resolves — resulting in two full charges, just not simultaneously. `droppable()` changes the rule to "if a handler is currently running for this event type, silently discard any new events of that type until it finishes" — the second tap's event never runs at all. This is the exact scenario [Week 20's Invisible Machinery](Week_20_BLoC_Pattern.md) describes for `droppable()`, made concrete with a real financial consequence if you skip it.

</details>

---

### W20-4 (Medium) — Test a multi-emit sequence without `bloc_test`

**Problem:** a search BLoC's single event handler emits **two** states in sequence — `Loading` then `Loaded`. Write a test proving both states are emitted, in that order, using nothing but a plain `List` collecting the stream — no test package needed, so you understand what `bloc_test`'s `expect:` is actually verifying under the hood.

```dart
sealed class SearchEvent {}
class QueryChanged extends SearchEvent { QueryChanged(this.query); final String query; }

sealed class SearchState {}
class SearchLoading extends SearchState {}
class SearchLoaded extends SearchState { SearchLoaded(this.results); final List<String> results; }

class SearchBloc extends Bloc<SearchEvent, SearchState> {
  SearchBloc() : super(SearchLoading()) {
    on<QueryChanged>((event, emit) async {
      emit(SearchLoading());
      await Future.delayed(const Duration(milliseconds: 100));
      emit(SearchLoaded(['Result for ${event.query}']));
    });
  }
}

void main() async {
  final bloc = SearchBloc();
  final emittedStates = <SearchState>[];
  final subscription = bloc.stream.listen(emittedStates.add);

  bloc.add(QueryChanged('flutter'));
  await Future.delayed(const Duration(milliseconds: 200));

  // TODO: assert emittedStates has exactly 2 entries,
  // first a SearchLoading, second a SearchLoaded with the right results
  print(emittedStates.map((s) => s.runtimeType).toList());

  await subscription.cancel();
  await bloc.close();
}
```

**Task:** write the assertions. Then explain: why does the test subscribe to `bloc.stream` *before* calling `bloc.add()`, rather than after — what would you miss if you got that order backwards?

<details><summary>Solution & Explanation</summary>

```dart
assert(emittedStates.length == 2);
assert(emittedStates[0] is SearchLoading);
assert(emittedStates[1] is SearchLoaded);
assert((emittedStates[1] as SearchLoaded).results.first == 'Result for flutter');
```

🔴 **Explanation:** `bloc.stream` is a **broadcast** stream (same mechanism as [Week 1b's EventBus](../Phase_1_Dart_and_Foundations/Week_01b_Dart_Coding_Challenges.md) and [Week 16's Firestore simulation](../Phase_4_Firebase_and_Storage/Week_16b_Firestore_Challenges.md)) — it does not replay past events to a new listener. If you called `bloc.add(QueryChanged(...))` *before* subscribing, the `SearchLoading` emission (and possibly `SearchLoaded`, if it resolved fast enough) would already have happened and be gone forever by the time your `.listen()` call attaches — your `emittedStates` list would be missing entries or empty. This is exactly what `bloc_test`'s `build`/`act`/`expect` structure automates for you (subscribe first, act second, assert third) — now you know precisely why that ordering is mandatory, not just a convention.

</details>

---

**Next → [Week 21: Clean Architecture](Week_21_Clean_Architecture.md) · [Architecture Challenges](Week_21b_Clean_Architecture_Challenges.md)**
