# Clean Architecture Challenges

### Companion to [Week 21: Clean Architecture](Week_21_Clean_Architecture.md)

---

## How This Works

The proof that clean architecture "works" isn't a diagram — it's whether you can write a fast unit test with zero real dependencies. Every problem here uses "can I test this without a Firebase project" as the concrete, checkable measure of whether a refactor actually succeeded. Paste starters into [DartPad](https://dartpad.dev).

---

### W21-1 (Hard) — Refactor a fat widget, then prove it's testable

**Problem:** here's a widget doing everything itself — fetching, business logic, and rendering all tangled together.

```dart
// BEFORE: the widget IS the data layer, the business logic, and the UI
class ExpenseListScreenFat extends StatefulWidget {
  const ExpenseListScreenFat({super.key});
  @override
  State<ExpenseListScreenFat> createState() => _ExpenseListScreenFatState();
}

class _ExpenseListScreenFatState extends State<ExpenseListScreenFat> {
  List<double> _amounts = [];
  double _total = 0;

  @override
  void initState() {
    super.initState();
    _loadExpenses();
  }

  Future<void> _loadExpenses() async {
    // Directly calling Firestore from inside a widget's State
    final snapshot = await FirebaseFirestore.instance.collection('expenses').get();
    final amounts = snapshot.docs.map((d) => d['amount'] as double).toList();
    setState(() {
      _amounts = amounts;
      _total = amounts.fold(0.0, (a, b) => a + b); // business logic, buried in a widget
    });
  }

  @override
  Widget build(BuildContext context) => Text('Total: \$$_total');
}
```

**Task:** refactor into three pieces: an `ExpenseRepository` **interface** (abstract), a `GetTotalExpenses` use case (pure Dart, computes the sum — the exact logic currently buried in `setState`), and a slimmed-down widget that only calls the use case. Then write a unit test for `GetTotalExpenses` using a fake repository — **no Firebase import anywhere in the test file.**

<details><summary>Solution & Explanation</summary>

```dart
// domain/expense_repository.dart — pure Dart, no Firebase import
abstract class ExpenseRepository {
  Future<List<double>> getAmounts();
}

// domain/get_total_expenses.dart — pure Dart, no Firebase import
class GetTotalExpenses {
  GetTotalExpenses(this._repository);
  final ExpenseRepository _repository;

  Future<double> call() async {
    final amounts = await _repository.getAmounts();
    return amounts.fold(0.0, (a, b) => a + b);
  }
}

// data/firestore_expense_repository.dart — the ONLY file that imports Firestore
class FirestoreExpenseRepository implements ExpenseRepository {
  @override
  Future<List<double>> getAmounts() async {
    final snapshot = await FirebaseFirestore.instance.collection('expenses').get();
    return snapshot.docs.map((d) => d['amount'] as double).toList();
  }
}

// The test — no Firebase, no widget, no async delay, runs in milliseconds:
class FakeExpenseRepository implements ExpenseRepository {
  @override
  Future<List<double>> getAmounts() async => [10.0, 20.0, 30.0];
}

void main() async {
  final useCase = GetTotalExpenses(FakeExpenseRepository());
  final total = await useCase();
  assert(total == 60.0);
  print('Test passed: total=$total');
}
```

🔴 **Explanation:** the "before" version's business logic (`amounts.fold(0.0, (a, b) => a + b)`) can only be tested by actually running the whole widget with a real or emulated Firestore instance behind it — slow, flaky, and requires network/emulator setup just to check a sum. After the refactor, `GetTotalExpenses` is pure Dart with an injected `ExpenseRepository` abstraction — the test above runs in milliseconds, needs no Firebase SDK, no emulator, no network, and tests the *exact same logic*. This is [Week 21's Dependency Inversion Principle](Week_21_Clean_Architecture.md) proven, not just described: the use case depends on an abstract `ExpenseRepository`, and swapping in `FakeExpenseRepository` for the test costs nothing because the use case never knew which concrete implementation it was talking to.

</details>

---

### W21-2 (Medium) — Swap implementations with GetIt, no code change in the consumer

**Problem:** using the pieces from W21-1, register the real repository for production and a fake one for a "test mode," and prove `GetTotalExpenses` code is completely unchanged either way.

```dart
final sl = GetIt.instance;

void configureProduction() {
  sl.registerSingleton<ExpenseRepository>(FirestoreExpenseRepository());
  sl.registerFactory<GetTotalExpenses>(() => GetTotalExpenses(sl<ExpenseRepository>()));
}

void configureTest() {
  // TODO: register FakeExpenseRepository instead
}

void main() {
  configureTest();
  final useCase = sl<GetTotalExpenses>();
  // useCase's own source code never mentions Firestore OR the fake —
  // it only ever calls sl<ExpenseRepository>()
}
```

**Task:** implement `configureTest()`. Then explain: what would break this swap-ability if `GetTotalExpenses`'s constructor took a `FirestoreExpenseRepository` directly (the concrete class) instead of the abstract `ExpenseRepository`?

<details><summary>Solution & Explanation</summary>

```dart
void configureTest() {
  sl.registerSingleton<ExpenseRepository>(FakeExpenseRepository());
  sl.registerFactory<GetTotalExpenses>(() => GetTotalExpenses(sl<ExpenseRepository>()));
}
```

🔴 **Explanation:** if `GetTotalExpenses` depended on the concrete `FirestoreExpenseRepository` type directly, `sl<ExpenseRepository>()` registered as `FakeExpenseRepository` couldn't be passed to it at all — Dart's type system would reject it (a `FakeExpenseRepository` isn't a `FirestoreExpenseRepository`, even if both implement the same interface). The whole swap only works because `GetTotalExpenses` was written against the **abstraction**, never the concrete type — this is the mechanical reason Dependency Inversion enables testing, not just a nice-sounding architectural principle. `GetIt`'s job here is purely bureaucratic: it's a `Map<Type, instance>` ([Week 21's Invisible Machinery](Week_21_Clean_Architecture.md)) — the actual substitutability comes entirely from the interface, not from GetIt itself.

</details>

---

### W21-3 (Medium) — Prove a Dependency Inversion violation by trying to test around it

**Problem:** here's a use case that violates Dependency Inversion — figure out exactly why it's untestable without Firebase, without being told the answer first.

```dart
class GetTotalExpensesBroken {
  Future<double> call() async {
    // Directly instantiates and depends on the CONCRETE Firestore type
    final firestore = FirebaseFirestore.instance;
    final snapshot = await firestore.collection('expenses').get();
    final amounts = snapshot.docs.map((d) => d['amount'] as double).toList();
    return amounts.fold(0.0, (a, b) => a + b);
  }
}
```

**Task:** try to write a unit test for this that doesn't touch a real or emulated Firebase project. What's the actual mechanical reason you can't — where exactly does the class commit to Firestore, and could you substitute anything at that point even if you wanted to?

<details><summary>Explanation</summary>

🔴 **Explanation:** the line `final firestore = FirebaseFirestore.instance;` **is** the violation — this class doesn't receive a dependency, it reaches out and grabs a concrete, global singleton itself. There's no constructor parameter, no injected abstraction, nothing a test could substitute at any point — the only way to make this class's `call()` method return without an exception is to have an actual (or emulated) Firestore instance available. Compare directly to W21-1's fixed version: there, `ExpenseRepository` is a constructor parameter of an abstract type, which is the one and only thing that makes substitution possible. The general test worth internalizing: **if a class instantiates its own dependencies internally (`FirebaseFirestore.instance`, `Dio()`, `http.Client()`) rather than receiving them through its constructor, it cannot be unit tested in isolation, full stop** — this is true regardless of whether you're using GetIt, Riverpod, or manual constructor injection to wire things up elsewhere.

</details>

---

### W21-4 (Medium) — Split a Single-Responsibility violation, and name the specific pain it caused

**Problem:** a real (exaggerated for teaching purposes, but the shape is genuine) violation:

```dart
class ApiHelperAndStorageAndAuthManager {
  Future<Map<String, dynamic>> fetchUserProfile(String token) async { /* network call */ throw UnimplementedError(); }
  Future<void> cacheUserProfile(Map<String, dynamic> data) async { /* Hive write */ throw UnimplementedError(); }
  Future<String?> getStoredAuthToken() async { /* SharedPreferences read */ throw UnimplementedError(); }
  Future<void> refreshAuthToken() async { /* network + storage write, both */ throw UnimplementedError(); }
}
```

**Task:** split this into three focused classes with clear single responsibilities (naming and grouping is your call). Then write **one concrete sentence** describing a specific testing or maintenance pain the original combined class caused that your split fixes — not a generic "it violates SRP," an actual scenario.

<details><summary>Example Solution & Explanation</summary>

```dart
class UserApiClient {
  Future<Map<String, dynamic>> fetchUserProfile(String token) async { throw UnimplementedError(); }
}

class UserLocalCache {
  Future<void> cacheUserProfile(Map<String, dynamic> data) async { throw UnimplementedError(); }
}

class AuthTokenManager {
  Future<String?> getStoredAuthToken() async { throw UnimplementedError(); }
  Future<void> refreshAuthToken() async { throw UnimplementedError(); }
}
```

**A concrete pain scenario:** you want to unit test `refreshAuthToken()`'s retry-on-401 logic. With the combined class, mocking it means providing fake implementations for *all four* methods — including `cacheUserProfile`, which has nothing to do with what you're testing — because most mocking approaches require a complete substitute for the whole class, not just the method under test. Split apart, `AuthTokenManager` can be tested (and mocked) in complete isolation from anything Hive- or network-fetch-related.

🔴 **Explanation:** the "one class, one reason to change" formulation of Single Responsibility is correct but abstract enough to be hard to apply from memory — the concrete, checkable version from [Week 21](Week_21_Clean_Architecture.md) is: **if testing or mocking one piece of a class's behavior forces you to also deal with unrelated pieces, that class has more than one responsibility.** That's the exact test W21-1 and W21-3 already applied to Firebase-dependent use cases — this problem applies the identical test to a class combining three unrelated concerns (network, local storage, auth) instead.

</details>

---

## Bonus Round — Mix It Up

Different formats, same topic — and this one leans hard into "make you think," because most Clean Architecture mistakes aren't crashes, they're rule violations that compile and run perfectly fine while quietly making the codebase worse. See [the full challenge-type roster](../00_CHALLENGE_TYPES.md) for what each icon means.

---

### 🐛 Bug Hunt — Spot the Layer Violation (Nothing Crashes Here)

This code runs. Tests pass. Nothing throws. It's still wrong, and the "bug" won't show up as a runtime error — it'll show up three months from now as "why can't I unit-test this without spinning up Firebase."

```dart
// domain/usecases/get_expenses.dart
class GetExpenses {
  Future<List<Expense>> call() async {
    final snapshot = await FirebaseFirestore.instance.collection('expenses').get();
    return snapshot.docs.map((doc) => Expense.fromFirestore(doc)).toList();
  }
}
```

Find the violation. Then explain, concretely, what breaks *because* of it — not just "it's against the rules."

<details><summary>Diagnosis & Fix</summary>

🔴 **Explanation:** `GetExpenses` lives in `domain/usecases/` — the domain layer, which per [this week's core content](Week_21_Clean_Architecture.md) is supposed to be **pure Dart, zero Flutter/Firebase imports**. This `UseCase` imports `cloud_firestore` directly and calls it inline, completely bypassing the `IExpenseRepository` abstraction the whole architecture exists to enforce. The concrete, not-abstract cost: **you cannot unit-test `GetExpenses` without a real or emulated Firestore instance** — there's no way to substitute a fake data source, because the use case *is* the data source now, tangled together. The fix restores the boundary:

```dart
// domain/repositories/expense_repository.dart
abstract class IExpenseRepository {
  Future<List<Expense>> getExpenses();
}

// domain/usecases/get_expenses.dart — pure Dart again, zero Firebase import
class GetExpenses {
  GetExpenses(this._repository);
  final IExpenseRepository _repository;
  Future<List<Expense>> call() => _repository.getExpenses();
}

// data/repositories/firebase_expense_repository.dart — Firebase import lives HERE now
class FirebaseExpenseRepository implements IExpenseRepository {
  @override
  Future<List<Expense>> getExpenses() async {
    final snapshot = await FirebaseFirestore.instance.collection('expenses').get();
    return snapshot.docs.map((doc) => Expense.fromFirestore(doc)).toList();
  }
}
```

Now `GetExpenses` can be unit-tested by constructing it with a `MockExpenseRepository` — exactly [this week's core content](Week_21_Clean_Architecture.md) on why the dependency rule exists in the first place, seen here as a violation you had to actually spot rather than one that was told to you upfront.

</details>

---

### 🎭 Two Truths and a Lie — Dependency Rules

**A.** The domain layer should never import anything from `package:flutter/material.dart`.

**B.** A repository *implementation* class (in the data layer) is allowed to import Dio or Firestore directly; the abstract repository *interface* it implements (in the domain layer) must not.

**C.** With constructor-based dependency injection, a `UseCase` class is expected to call `GetIt.instance<T>()` directly, inside its own methods, to fetch whatever dependencies it needs.

<details><summary>Which one's the lie</summary>

**C is the lie.** The entire value of constructor injection — the pattern used throughout [this week's `GetExpensesUseCase(repository: sl<IExpenseRepository>())` example](Week_21_Clean_Architecture.md) — is that dependencies are handed to a class from the **outside**, at construction time, by whoever is wiring the object graph together (GetIt's registration code, or a test's `setUp()`). If a `UseCase` instead calls `GetIt.instance<T>()` internally, it now depends directly on the service locator itself, and you've lost the ability to simply pass a `MockExpenseRepository` into its constructor for a test — you'd have to fight with GetIt's global registration state instead, which is precisely the friction constructor injection exists to avoid.

🔴 **Explanation:** A and B are both true and are two sides of the same dependency rule — A is the "domain has zero framework imports" rule stated directly; B is the more subtle version of it, clarifying that the rule applies to the *interface* (which lives in the domain layer) and not to the *implementation* (which deliberately lives in the data layer specifically so it's allowed to import whatever external package it needs).

</details>

---

### 👹 Boss Battle — Swap the Backend Without Touching the UseCase

**The spec:** the real test of dependency inversion — build an `IExpenseRepository` interface, **two** separate implementations (`FirebaseExpenseRepository` and `InMemoryExpenseRepository`, the second one purely for tests, holding data in a `List` field), a `GetExpenses` use case depending only on the interface, and a small `main()`-style wiring function that can register **either** implementation with GetIt based on a flag — without a single line of `GetExpenses` itself ever changing.

<details><summary>One reasonable solution</summary>

```dart
abstract class IExpenseRepository {
  Future<List<Expense>> getExpenses();
  Future<void> addExpense(Expense expense);
}

class FirebaseExpenseRepository implements IExpenseRepository {
  @override
  Future<List<Expense>> getExpenses() async { /* real Firestore call */ throw UnimplementedError(); }
  @override
  Future<void> addExpense(Expense expense) async { /* real Firestore call */ }
}

class InMemoryExpenseRepository implements IExpenseRepository {
  final List<Expense> _expenses = [];
  @override
  Future<List<Expense>> getExpenses() async => List.unmodifiable(_expenses);
  @override
  Future<void> addExpense(Expense expense) async => _expenses.add(expense);
}

class GetExpenses {
  GetExpenses(this._repository);
  final IExpenseRepository _repository;
  Future<List<Expense>> call() => _repository.getExpenses();
}

final sl = GetIt.instance;

void configureDependencies({required bool useFakeBackend}) {
  if (useFakeBackend) {
    sl.registerSingleton<IExpenseRepository>(InMemoryExpenseRepository());
  } else {
    sl.registerSingleton<IExpenseRepository>(FirebaseExpenseRepository());
  }
  sl.registerFactory<GetExpenses>(() => GetExpenses(sl<IExpenseRepository>()));
}
```

🔴 **Explanation:** this is the entire architectural payoff made concrete, not asserted — `GetExpenses` was written once and never touched again while the backend underneath it flipped between a real Firestore-backed implementation and an in-memory fake, purely by changing what `configureDependencies` registers. `InMemoryExpenseRepository` isn't a mocking-library mock — it's a genuine, real implementation of the same interface, just backed by a `List` instead of a network call, which is exactly the "swap Firebase for a different database without touching the UI/business logic" claim from [this week's core content](Week_21_Clean_Architecture.md), demonstrated rather than just stated.

</details>

---

**Next → [Week 22: Advanced Animations & CustomPaint](Week_22_Advanced_Animations_CustomPaint.md) · [Animation & CustomPaint Challenges](Week_22b_Advanced_Animation_Challenges.md)**
