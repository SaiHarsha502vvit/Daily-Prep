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

**Next → [Week 22: Advanced Animations & CustomPaint](Week_22_Advanced_Animations_CustomPaint.md) · [Animation & CustomPaint Challenges](Week_22b_Advanced_Animation_Challenges.md)**
