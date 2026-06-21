# Week 20 — Clean Architecture + SOLID in Flutter
### The architecture that survives team growth, tech swaps, and deadline pressure

---

> Three lenses on every concept:
> - 🧑‍💻 **Developer** — how to split code into Presentation / Domain / Data layers with clear contracts
> - 🎨 **Designer** — why separate layers mean designers can iterate on UI without touching business logic
> - 🧪 **Tester** — each layer is independently testable; domain logic tests have zero Flutter imports

---

## Why Architecture Matters

You've already seen the problem. After 18 weeks of building apps, you likely have:

```
lib/
  screens/
    home_screen.dart   ← fetches from Firestore directly
    cart_screen.dart   ← calls Dio directly
  models/
    product.dart       ← has both UI logic and JSON parsing
  main.dart
```

**Symptoms that tell you the architecture is wrong:**
- Changing the API means touching 8 screens
- Can't test business logic without running the full app
- Adding Firebase Auth requires edits in 15 files
- New developer on the team takes 2 weeks to understand what's happening

Clean Architecture solves this by separating *what your app does* (domain) from *how it does it* (data) and *how it shows it* (presentation).

---

## The Three Layers

> 📄 **Clean Architecture (Uncle Bob):**
> *"The goal of software architecture is to minimize the human resources required to build and maintain the required system."*

```
┌─────────────────────────────────────────────────────────────────┐
│  PRESENTATION LAYER                                             │
│  Widgets, Screens, BLoC/Cubit, ViewModels                      │
│  → Depends on: Domain layer only                               │
│  → Knows nothing about: Firestore, Dio, SharedPrefs            │
├─────────────────────────────────────────────────────────────────┤
│  DOMAIN LAYER  (pure Dart — no Flutter, no Firebase, no Dio)   │
│  Entities, Use Cases, Repository Interfaces                     │
│  → Depends on: nothing external                                 │
│  → The core of your app. Business rules live here.             │
├─────────────────────────────────────────────────────────────────┤
│  DATA LAYER                                                     │
│  Repository Implementations, Data Sources, Models, Mappers     │
│  → Depends on: Domain layer interfaces (implements them)        │
│  → Knows about: Firebase, Dio, SQLite, SharedPrefs             │
└─────────────────────────────────────────────────────────────────┘

Dependency Rule: dependencies only point INWARD
  Presentation → Domain ← Data
  (Data and Presentation both know about Domain, but NOT about each other)
```

---

## Folder Structure

```
lib/
  features/
    expenses/
      presentation/
        screens/
          expense_list_screen.dart
          add_expense_screen.dart
        bloc/
          expense_bloc.dart
          expense_event.dart
          expense_state.dart
        widgets/
          expense_tile.dart
          chart_widget.dart
      domain/
        entities/
          expense.dart          ← pure Dart class, no JSON
        repositories/
          expense_repository.dart   ← abstract interface
        usecases/
          get_expenses.dart
          add_expense.dart
          delete_expense.dart
          get_monthly_summary.dart
      data/
        repositories/
          expense_repository_impl.dart  ← implements domain interface
        datasources/
          expense_local_datasource.dart
          expense_remote_datasource.dart
        models/
          expense_model.dart    ← has fromJson/toJson, extends Expense
  core/
    error/
      failures.dart
      exceptions.dart
    usecases/
      usecase.dart              ← abstract UseCase<Type, Params>
    di/
      injection_container.dart  ← all get_it registrations
```

---

## 1. Domain Layer — Pure Dart

```dart
// lib/features/expenses/domain/entities/expense.dart
// This is your REAL model — no JSON, no Hive annotations, no Firestore
// It represents a business concept, not a data format

class Expense {
  final String id;
  final String title;
  final double amount;
  final DateTime date;
  final ExpenseCategory category;

  const Expense({
    required this.id,
    required this.title,
    required this.amount,
    required this.date,
    required this.category,
  });

  bool get isRecent => DateTime.now().difference(date).inDays < 7;
  bool get isLarge => amount > 1000;
  String get formattedAmount => '₹${amount.toStringAsFixed(2)}';

  Expense copyWith({
    String? id,
    String? title,
    double? amount,
    DateTime? date,
    ExpenseCategory? category,
  }) {
    return Expense(
      id: id ?? this.id,
      title: title ?? this.title,
      amount: amount ?? this.amount,
      date: date ?? this.date,
      category: category ?? this.category,
    );
  }

  @override
  bool operator ==(Object other) =>
      other is Expense && other.id == id;

  @override
  int get hashCode => id.hashCode;
}

enum ExpenseCategory { food, transport, entertainment, utilities, health, other }
```

```dart
// lib/features/expenses/domain/repositories/expense_repository.dart
// This is an INTERFACE — tells the rest of the app "what can be done"
// It says nothing about HOW (Firebase? SQLite? Memory?)

abstract interface class ExpenseRepository {
  Future<List<Expense>> getExpenses();
  Stream<List<Expense>> watchExpenses();  // real-time
  Future<void> addExpense(Expense expense);
  Future<void> updateExpense(Expense expense);
  Future<void> deleteExpense(String id);
  Future<Map<ExpenseCategory, double>> getMonthlySummary(int year, int month);
}
```

---

## 2. Use Cases — Single-Responsibility Business Rules

```dart
// lib/core/usecases/usecase.dart
// Base interface for all use cases
abstract interface class UseCase<Type, Params> {
  Future<Type> call(Params params);
}

class NoParams { const NoParams(); }

// lib/features/expenses/domain/usecases/get_expenses.dart
class GetExpenses implements UseCase<List<Expense>, NoParams> {
  final ExpenseRepository _repository;
  const GetExpenses(this._repository);

  @override
  Future<List<Expense>> call(NoParams params) => _repository.getExpenses();
}

// lib/features/expenses/domain/usecases/add_expense.dart
class AddExpense implements UseCase<void, AddExpenseParams> {
  final ExpenseRepository _repository;
  const AddExpense(this._repository);

  @override
  Future<void> call(AddExpenseParams params) async {
    // Business rule: expense amount must be positive
    if (params.amount <= 0) throw const InvalidExpenseException('Amount must be positive');
    // Business rule: title must not be empty
    if (params.title.trim().isEmpty) throw const InvalidExpenseException('Title required');

    final expense = Expense(
      id: const Uuid().v4(),
      title: params.title.trim(),
      amount: params.amount,
      date: params.date,
      category: params.category,
    );
    return _repository.addExpense(expense);
  }
}

class AddExpenseParams {
  final String title;
  final double amount;
  final DateTime date;
  final ExpenseCategory category;
  const AddExpenseParams({required this.title, required this.amount, required this.date, required this.category});
}

// lib/features/expenses/domain/usecases/get_monthly_summary.dart
class GetMonthlySummary implements UseCase<MonthlySummary, MonthParams> {
  final ExpenseRepository _repository;
  const GetMonthlySummary(this._repository);

  @override
  Future<MonthlySummary> call(MonthParams params) async {
    final breakdown = await _repository.getMonthlySummary(params.year, params.month);
    final total = breakdown.values.fold(0.0, (a, b) => a + b);
    final topCategory = breakdown.entries.isEmpty
        ? null
        : breakdown.entries.reduce((a, b) => a.value > b.value ? a : b).key;

    return MonthlySummary(
      year: params.year,
      month: params.month,
      total: total,
      breakdown: breakdown,
      topCategory: topCategory,
    );
  }
}

class MonthlySummary {
  final int year, month;
  final double total;
  final Map<ExpenseCategory, double> breakdown;
  final ExpenseCategory? topCategory;
  const MonthlySummary({required this.year, required this.month, required this.total, required this.breakdown, this.topCategory});
}
```

🧑‍💻 **Developer — why Use Cases?**

Without use cases, the "add expense" validation logic lives in the BLoC. Then the "duplicate expense" screen also needs the same validation. So you copy it. Then the "import CSV" feature also needs it. You copy it again. Now the same business rule exists in 3 places and diverges.

Use Cases are the single source of truth for one business operation. The BLoC just calls `addExpense(params)` and reacts to success/failure.

---

## 3. Data Layer — Implementations

```dart
// lib/features/expenses/data/models/expense_model.dart
// Extends the domain entity — adds JSON serialization concerns

class ExpenseModel extends Expense {
  const ExpenseModel({
    required super.id,
    required super.title,
    required super.amount,
    required super.date,
    required super.category,
  });

  factory ExpenseModel.fromJson(Map<String, dynamic> json) {
    return ExpenseModel(
      id: json['id'] as String,
      title: json['title'] as String,
      amount: (json['amount'] as num).toDouble(),
      date: DateTime.parse(json['date'] as String),
      category: ExpenseCategory.values.byName(json['category'] as String),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'title': title,
    'amount': amount,
    'date': date.toIso8601String(),
    'category': category.name,
  };

  factory ExpenseModel.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data()! as Map<String, dynamic>;
    return ExpenseModel(
      id: doc.id,
      title: data['title'] as String,
      amount: (data['amount'] as num).toDouble(),
      date: (data['date'] as Timestamp).toDate(),
      category: ExpenseCategory.values.byName(data['category'] as String),
    );
  }

  Map<String, dynamic> toFirestore() => {
    'title': title,
    'amount': amount,
    'date': Timestamp.fromDate(date),
    'category': category.name,
  };

  // Convert domain entity to model (for saving)
  factory ExpenseModel.fromEntity(Expense expense) {
    return ExpenseModel(
      id: expense.id,
      title: expense.title,
      amount: expense.amount,
      date: expense.date,
      category: expense.category,
    );
  }
}
```

```dart
// lib/features/expenses/data/repositories/expense_repository_impl.dart
// IMPLEMENTS the domain interface — this is the only place Firebase is mentioned

class ExpenseRepositoryImpl implements ExpenseRepository {
  final ExpenseRemoteDatasource _remote;
  final ExpenseLocalDatasource _local;

  const ExpenseRepositoryImpl({
    required ExpenseRemoteDatasource remote,
    required ExpenseLocalDatasource local,
  }) : _remote = remote, _local = local;

  @override
  Future<List<Expense>> getExpenses() async {
    try {
      final models = await _remote.getExpenses();
      await _local.cacheExpenses(models);
      return models;
    } on NetworkException {
      // Fallback to cache on network error
      return _local.getCachedExpenses();
    }
  }

  @override
  Stream<List<Expense>> watchExpenses() {
    return _remote.watchExpenses().map((models) => models as List<Expense>);
  }

  @override
  Future<void> addExpense(Expense expense) async {
    final model = ExpenseModel.fromEntity(expense);
    await _remote.addExpense(model);
    await _local.cacheExpenses(await _remote.getExpenses());
  }

  @override
  Future<void> updateExpense(Expense expense) async {
    await _remote.updateExpense(ExpenseModel.fromEntity(expense));
  }

  @override
  Future<void> deleteExpense(String id) async {
    await _remote.deleteExpense(id);
    _local.removeFromCache(id);
  }

  @override
  Future<Map<ExpenseCategory, double>> getMonthlySummary(int year, int month) {
    return _remote.getMonthlySummary(year, month);
  }
}
```

```dart
// lib/features/expenses/data/datasources/expense_remote_datasource.dart
abstract interface class ExpenseRemoteDatasource {
  Future<List<ExpenseModel>> getExpenses();
  Stream<List<ExpenseModel>> watchExpenses();
  Future<void> addExpense(ExpenseModel model);
  Future<void> updateExpense(ExpenseModel model);
  Future<void> deleteExpense(String id);
  Future<Map<ExpenseCategory, double>> getMonthlySummary(int year, int month);
}

class ExpenseFirebaseDatasource implements ExpenseRemoteDatasource {
  final FirebaseFirestore _firestore;
  final FirebaseAuth _auth;

  ExpenseFirebaseDatasource(this._firestore, this._auth);

  CollectionReference<Map<String, dynamic>> get _collection {
    final uid = _auth.currentUser?.uid;
    if (uid == null) throw const UnauthorizedException();
    return _firestore.collection('users/$uid/expenses');
  }

  @override
  Future<List<ExpenseModel>> getExpenses() async {
    final snap = await _collection.orderBy('date', descending: true).get();
    return snap.docs.map(ExpenseModel.fromFirestore).toList();
  }

  @override
  Stream<List<ExpenseModel>> watchExpenses() {
    return _collection
        .orderBy('date', descending: true)
        .snapshots()
        .map((snap) => snap.docs.map(ExpenseModel.fromFirestore).toList());
  }

  @override
  Future<void> addExpense(ExpenseModel model) {
    return _collection.doc(model.id).set(model.toFirestore());
  }

  @override
  Future<void> updateExpense(ExpenseModel model) {
    return _collection.doc(model.id).update({
      ...model.toFirestore(),
      'updatedAt': FieldValue.serverTimestamp(),
    });
  }

  @override
  Future<void> deleteExpense(String id) {
    return _collection.doc(id).delete();
  }

  @override
  Future<Map<ExpenseCategory, double>> getMonthlySummary(int year, int month) async {
    final start = DateTime(year, month, 1);
    final end = DateTime(year, month + 1, 1);
    final snap = await _collection
        .where('date', isGreaterThanOrEqualTo: Timestamp.fromDate(start))
        .where('date', isLessThan: Timestamp.fromDate(end))
        .get();

    final expenses = snap.docs.map(ExpenseModel.fromFirestore).toList();
    final summary = <ExpenseCategory, double>{};
    for (final e in expenses) {
      summary[e.category] = (summary[e.category] ?? 0) + e.amount;
    }
    return summary;
  }
}
```

---

## 4. Dependency Injection — `get_it`

> 📄 **get_it Docs:**
> *"get_it is a simple Service Locator for Dart/Flutter. It lets you register objects and retrieve them from anywhere in the app without passing them through constructors."*

```yaml
dependencies:
  get_it: ^7.6.0
  injectable: ^2.3.0  # optional: generates registration code
dev_dependencies:
  injectable_generator: ^2.4.0
```

```dart
// lib/core/di/injection_container.dart
import 'package:get_it/get_it.dart';

final sl = GetIt.instance;   // sl = service locator

Future<void> setupDI() async {
  // External dependencies
  sl.registerLazySingleton(() => FirebaseFirestore.instance);
  sl.registerLazySingleton(() => FirebaseAuth.instance);
  sl.registerLazySingleton(() => Dio());

  // Data sources
  sl.registerLazySingleton<ExpenseRemoteDatasource>(
    () => ExpenseFirebaseDatasource(sl(), sl()),  // sl() resolves by type
  );
  sl.registerLazySingleton<ExpenseLocalDatasource>(
    () => ExpenseHiveDatasource(),
  );

  // Repositories
  sl.registerLazySingleton<ExpenseRepository>(
    () => ExpenseRepositoryImpl(remote: sl(), local: sl()),
  );

  // Use cases
  sl.registerLazySingleton(() => GetExpenses(sl()));
  sl.registerLazySingleton(() => AddExpense(sl()));
  sl.registerLazySingleton(() => DeleteExpense(sl()));
  sl.registerLazySingleton(() => GetMonthlySummary(sl()));

  // BLoCs — registerFactory so each screen gets a fresh BLoC
  sl.registerFactory(() => ExpenseBloc(
    getExpenses: sl(),
    addExpense: sl(),
    deleteExpense: sl(),
    getMonthlySummary: sl(),
  ));
}

// main.dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  await setupDI();
  runApp(const App());
}
```

```dart
// In the widget tree — no longer using BlocProvider with direct instantiation
// get_it resolves the full dependency graph for you

BlocProvider(
  create: (_) => sl<ExpenseBloc>()..add(LoadExpensesEvent()),
  child: const ExpenseListScreen(),
)
```

🧑‍💻 **Developer — `registerLazySingleton` vs `registerFactory`:**
- `registerLazySingleton` — creates the instance once, returns same instance every time. Use for repos, data sources, use cases.
- `registerFactory` — creates a new instance every time. Use for BLoCs (each screen needs its own BLoC that starts fresh).
- `registerSingleton` — creates immediately (not lazy). Rare; use when you need a side effect on startup.

---

## 5. Presentation Layer — BLoC Connects to Use Cases

```dart
// lib/features/expenses/presentation/bloc/expense_bloc.dart

class ExpenseBloc extends Bloc<ExpenseEvent, ExpenseState> {
  final GetExpenses _getExpenses;
  final AddExpense _addExpense;
  final DeleteExpense _deleteExpense;
  final GetMonthlySummary _getMonthlySummary;

  ExpenseBloc({
    required GetExpenses getExpenses,
    required AddExpense addExpense,
    required DeleteExpense deleteExpense,
    required GetMonthlySummary getMonthlySummary,
  })  : _getExpenses = getExpenses,
        _addExpense = addExpense,
        _deleteExpense = deleteExpense,
        _getMonthlySummary = getMonthlySummary,
        super(ExpenseInitial()) {
    on<LoadExpensesEvent>(_onLoad);
    on<AddExpenseEvent>(_onAdd);
    on<DeleteExpenseEvent>(_onDelete);
  }

  Future<void> _onLoad(LoadExpensesEvent event, Emitter<ExpenseState> emit) async {
    emit(ExpenseLoading());
    try {
      final expenses = await _getExpenses(const NoParams());
      emit(ExpenseLoaded(expenses));
    } on Exception catch (e) {
      emit(ExpenseError(e.toString()));
    }
  }

  Future<void> _onAdd(AddExpenseEvent event, Emitter<ExpenseState> emit) async {
    try {
      await _addExpense(AddExpenseParams(
        title: event.title,
        amount: event.amount,
        date: event.date,
        category: event.category,
      ));
      // Reload after adding
      final expenses = await _getExpenses(const NoParams());
      emit(ExpenseLoaded(expenses));
    } on InvalidExpenseException catch (e) {
      // Business rule violation — don't change state, show error
      emit(state is ExpenseLoaded
          ? (state as ExpenseLoaded).copyWithError(e.message)
          : ExpenseError(e.message));
    }
  }

  Future<void> _onDelete(DeleteExpenseEvent event, Emitter<ExpenseState> emit) async {
    if (state is! ExpenseLoaded) return;
    final current = state as ExpenseLoaded;

    // Optimistic update — remove immediately, restore if fails
    final updated = current.expenses.where((e) => e.id != event.id).toList();
    emit(current.copyWith(expenses: updated));

    try {
      await _deleteExpense(DeleteExpenseParams(id: event.id));
    } catch (_) {
      emit(current);  // Restore original state
    }
  }
}
```

🎨 **Designer:** Look at how the BLoC states map to design states:
- `ExpenseInitial` → show skeleton/shimmer
- `ExpenseLoading` → full-screen loading spinner
- `ExpenseLoaded` → the real expense list
- `ExpenseError` → error state with retry button

When you design a feature, create UI designs for each of these states — not just the happy path. The code makes it hard to skip them.

---

## 6. SOLID Principles — Applied to Flutter

**S — Single Responsibility**: `AddExpense` use case has one job. `ExpenseFirebaseDatasource` has one job.

**O — Open/Closed**: Adding a new data source (SQLite) means creating `ExpenseSQLiteDatasource` and registering it in `setupDI()`. Zero changes to `ExpenseRepositoryImpl`, use cases, or BLoC.

**L — Liskov Substitution**: `ExpenseFirebaseDatasource` can be replaced with `MockExpenseDatasource` in tests. The repo doesn't know the difference — it only sees the interface.

**I — Interface Segregation**: `ExpenseRemoteDatasource` and `ExpenseLocalDatasource` are separate interfaces. The remote source doesn't implement local cache methods.

**D — Dependency Inversion**: The BLoC depends on `GetExpenses` (abstract use case). The repository depends on `ExpenseRepository` (interface). Both depend on abstractions, never on concrete implementations.

---

## 7. `Result` Type — Functional Error Handling Without Exceptions

Exceptions as control flow have a problem: they're invisible in function signatures. `Future<List<Expense>>` doesn't tell you "this might fail with a network error." A `Result` type makes errors part of the type signature — callers are forced to handle both success and failure.

```dart
// Simple Result type — no dependency required
sealed class Result<T> {}
class Success<T> extends Result<T> {
  final T data;
  const Success(this.data);
}
class Failure<T> extends Result<T> {
  final AppException error;
  const Failure(this.error);
}

// Extension methods for ergonomic use
extension ResultX<T> on Result<T> {
  bool get isSuccess => this is Success<T>;
  bool get isFailure => this is Failure<T>;
  T get data => (this as Success<T>).data;
  AppException get error => (this as Failure<T>).error;

  R when<R>({
    required R Function(T data) success,
    required R Function(AppException error) failure,
  }) => switch (this) {
    Success(:final data) => success(data),
    Failure(:final error) => failure(error),
  };
}
```

```dart
// Use Result in repository interface and implementation
abstract interface class ExpenseRepository {
  // Explicit: callers KNOW this can fail
  Future<Result<List<Expense>>> getExpenses();
  Future<Result<void>> addExpense(Expense expense);
  Future<Result<void>> deleteExpense(String id);
}

class ExpenseRepositoryImpl implements ExpenseRepository {
  @override
  Future<Result<List<Expense>>> getExpenses() async {
    try {
      final expenses = await _remote.getExpenses();
      return Success(expenses);
    } on NetworkException catch (e) {
      return Failure(NetworkError(message: e.message));
    } on ServerException catch (e) {
      return Failure(ServerError(statusCode: e.statusCode));
    } catch (e) {
      return Failure(UnknownError(message: e.toString()));
    }
  }
}
```

```dart
// Use in BLoC — clean, no try/catch needed here
Future<void> _onLoad(LoadExpensesEvent event, Emitter<ExpenseState> emit) async {
  emit(ExpenseLoading());

  final result = await _getExpenses(const NoParams());

  result.when(
    success: (expenses) => emit(ExpenseLoaded(expenses: expenses)),
    failure: (error) => emit(ExpenseError(message: error.userMessage)),
  );
}
```

---

## 8. `Freezed` — Immutable Data Classes Without Boilerplate

> 📄 **freezed Docs:**
> *"A code generation package for data classes — immutable classes with copyWith, ==, hashCode, toString, and pattern matching support."*

Writing `copyWith`, `==`, `hashCode`, `toString` manually for every entity is tedious. Freezed generates it all.

```yaml
dev_dependencies:
  freezed: ^2.5.0
  freezed_annotation: ^2.4.0
dev_dependencies:
  build_runner: ^2.4.0
```

```dart
// expense.dart
import 'package:freezed_annotation/freezed_annotation.dart';

part 'expense.freezed.dart';
part 'expense.g.dart';  // for json_serializable

@freezed
class Expense with _$Expense {
  const factory Expense({
    required String id,
    required String userId,
    required String title,
    required double amount,
    required DateTime date,
    required ExpenseCategory category,
    String? note,
  }) = _Expense;

  // Computed properties — must use a private constructor
  const Expense._();
  bool get isRecent => DateTime.now().difference(date).inDays < 7;
  String get formattedAmount => '₹${amount.toStringAsFixed(2)}';

  factory Expense.fromJson(Map<String, dynamic> json) => _$ExpenseFromJson(json);
}

// Freezed generates automatically:
// - copyWith (type-safe, all parameters optional)
// - == and hashCode (value equality)
// - toString (human-readable)
// - fromJson/toJson (if you have part '*.g.dart')

// Generate:
// dart run build_runner build --delete-conflicting-outputs
```

```dart
// Freezed sealed classes — for BLoC states
@freezed
sealed class ExpenseState with _$ExpenseState {
  const factory ExpenseState.initial() = ExpenseInitial;
  const factory ExpenseState.loading() = ExpenseLoading;
  const factory ExpenseState.loaded({
    required List<Expense> expenses,
    required ExpenseFilter filter,
  }) = ExpenseLoaded;
  const factory ExpenseState.error(String message) = ExpenseError;
}

// Usage — pattern match with Freezed's .when()
state.when(
  initial: () => const SplashView(),
  loading: () => const ShimmerList(),
  loaded: (expenses, filter) => ExpenseList(expenses: expenses),
  error: (message) => ErrorView(message: message),
);
```

**Freezed vs manual classes:**

| | Manual | Freezed |
|--|--|--|
| `copyWith` | Write yourself | Generated |
| `==` / `hashCode` | Write yourself | Generated |
| Pattern matching | Sealed class | `.when()` / `.map()` |
| JSON | Manual or json_serializable | Integrated |
| Boilerplate | High | 3 lines |

**Rule:** Use Freezed for all domain entities and BLoC states in any app beyond a prototype. The generated code is production-quality and saves 30+ lines per class.

---

## 9. The Testing Advantage — Why Clean Architecture Exists

> 🍎 **Academy Golden Rule — Testability Is Architecture:**
> *"If you can't test a class in isolation, your architecture is wrong. Clean Architecture's entire purpose is to make every layer testable without importing the layer above or below it."*

```dart
// Domain layer — pure Dart, no Flutter, no Firebase, no packages
// Run tests in 0.1 seconds with `dart test`
test('AddExpense rejects zero amount', () {
  final useCase = AddExpense(FakeExpenseRepo());
  expect(
    () => useCase(AddExpenseParams(title: 'X', amount: 0, date: DateTime.now(), category: ExpenseCategory.other)),
    throwsA(isA<InvalidExpenseException>()),
  );
});
// No Firebase setup, no widget pumping, no mock annotations

// Data layer — test transformations, not Firebase
test('ExpenseModel.fromFirestore handles missing fields', () {
  final doc = FakeDocumentSnapshot(data: {'title': 'Coffee'});  // amount missing
  final model = ExpenseModel.fromFirestore(doc);
  expect(model.amount, 0.0);   // safe default
});

// Presentation layer — test BLoC in isolation with mocked use cases
blocTest<ExpenseBloc, ExpenseState>(
  'emits Loaded on successful GetExpenses',
  build: () {
    when(mockGetExpenses(any)).thenAnswer((_) async => [testExpense]);
    return ExpenseBloc(getExpenses: mockGetExpenses, /* ... */);
  },
  act: (bloc) => bloc.add(LoadExpensesEvent()),
  expect: () => [isA<ExpenseLoading>(), isA<ExpenseLoaded>()],
);
```

**The testability payoff by layer:**
```
Domain (entities + use cases)  → dart test      → 0.1s    → runs in CI in 2s
Data (models + repos)          → dart test      → 0.2s    → runs in CI in 3s
Presentation (BLoC)            → flutter test   → 0.5s    → runs in CI in 5s
Widgets (screens)              → flutter test   → 2s      → runs in CI in 15s
Integration (full app)         → flutter test   → 30s+    → runs in CI in 3min
```

Each layer down the pyramid is 10x faster to test. Clean Architecture pushes as much logic as possible into the fastest layers.

---

## 10. Feature Flags — Ship Dark, Release Bright

> 🏢 **Enterprise Reality:**
> *"At scale, you deploy code to production every day but don't release features to users. Feature flags decouple deployment from release. A flag lets you turn features on for 1% of users, then 10%, then 100% — and instantly kill them if metrics drop."*

```dart
// Firebase Remote Config — feature flag service
class FeatureFlagService {
  final FirebaseRemoteConfig _config = FirebaseRemoteConfig.instance;

  Future<void> initialize() async {
    await _config.setConfigSettings(RemoteConfigSettings(
      fetchTimeout: const Duration(seconds: 10),
      minimumFetchInterval: const Duration(hours: 1),  // prod: 1h, dev: 0
    ));
    await _config.setDefaults({
      'enable_dark_mode': false,
      'enable_new_checkout': false,
      'max_cart_items': 50,
      'api_version': 'v2',
      'maintenance_mode': false,
    });
    await _config.fetchAndActivate();
  }

  bool getBool(String key) => _config.getBool(key);
  int getInt(String key) => _config.getInt(key);
  String getString(String key) => _config.getString(key);
}

// Usage — gate features without if/else spaghetti
class CheckoutScreen extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final flags = ref.watch(featureFlagProvider);

    if (flags.getBool('maintenance_mode')) {
      return const MaintenanceScreen();
    }

    return flags.getBool('enable_new_checkout')
        ? const NewCheckoutFlow()    // new version for 10% of users
        : const LegacyCheckoutFlow();  // existing version
  }
}

// Riverpod integration
final featureFlagProvider = Provider<FeatureFlagService>((ref) {
  return ref.watch(featureFlagServiceProvider);
});
```

---

## 11. Multi-Module Architecture — Scaling to 20+ Developers

> 🏢 **Enterprise Reality:**
> *"When 5 teams work on the same Flutter app, merge conflicts become the #1 productivity killer. Multi-module architecture gives each team their own package with clear boundaries."*

```
my_app/
├── app/                          ← shell app (imports all features)
│   ├── lib/main.dart
│   └── pubspec.yaml              ← depends on all feature packages
│
├── packages/
│   ├── core/                     ← shared code (no feature logic)
│   │   ├── core_ui/              ← design system (buttons, colors, tokens)
│   │   ├── core_network/         ← Dio setup, interceptors, base client
│   │   ├── core_storage/         ← Hive/SecureStorage wrappers
│   │   └── core_domain/          ← shared entities, Result type
│   │
│   ├── features/
│   │   ├── feature_auth/         ← Team A owns this
│   │   │   ├── lib/
│   │   │   │   ├── domain/       ← auth entities, use cases
│   │   │   │   ├── data/         ← Firebase Auth datasource
│   │   │   │   └── presentation/ ← login/signup screens, auth BLoC
│   │   │   ├── test/
│   │   │   └── pubspec.yaml      ← depends on core_*, not other features
│   │   │
│   │   ├── feature_expenses/     ← Team B owns this
│   │   ├── feature_chat/         ← Team C owns this
│   │   └── feature_settings/     ← Team D owns this
│   │
│   └── shared/
│       ├── analytics/            ← analytics abstraction
│       └── feature_flags/        ← feature flag service
```

```yaml
# packages/features/feature_expenses/pubspec.yaml
name: feature_expenses
dependencies:
  core_ui:
    path: ../../core/core_ui
  core_network:
    path: ../../core/core_network
  core_domain:
    path: ../../core/core_domain
  # ❌ NEVER depend on feature_auth or feature_chat
  # Features communicate through core_domain interfaces
```

```dart
// Inter-feature communication — via abstract interfaces in core_domain
// core_domain/lib/auth_port.dart
abstract class AuthPort {
  Stream<String?> get userIdStream;
  String? get currentUserId;
}

// feature_auth provides the implementation
class FirebaseAuthPort implements AuthPort { /* ... */ }

// feature_expenses consumes it via DI — no import of feature_auth
class ExpenseRepository {
  final AuthPort _authPort;
  ExpenseRepository(this._authPort);

  Stream<List<Expense>> watchExpenses() {
    final userId = _authPort.currentUserId;
    if (userId == null) return Stream.value([]);
    return _datasource.watchExpenses(userId);
  }
}
```

**Rule:** Features never import other features. Communication goes through interfaces defined in `core_domain`. The shell `app/` wires everything together with DI. This means Team A can refactor auth without breaking Team B's expenses.

---

## 12. Platform Channels — Crossing the Native Bridge

> 📄 **Flutter Docs:**
> *"Platform channels allow Flutter to call platform-specific APIs on Android and iOS. They provide a simple mechanism for communicating between your Dart code and your platform-specific host code."*

Flutter gives you 95% of what you need. But some things live on the other side of the wall — battery level, biometric authentication, Bluetooth pairing, NFC, native camera controls, platform-specific encryption APIs. Platform channels are how you reach across.

**The mental model:**

```
Dart (your Flutter code)
  │
  │  MethodChannel / EventChannel
  │  (async message passing, like postMessage in web)
  │
  ▼
Native Host (Kotlin on Android, Swift on iOS)
  │
  ▼
Platform APIs (Android SDK / iOS SDK)
```

It's not a function call. It's async message passing — you send a method name + arguments as a serialized message, the native side handles it, and sends back a result. Like `postMessage` between an iframe and its parent in web development.

---

### MethodChannel — Call Native, Get a Result

**Dart side — sending the request:**

```dart
import 'package:flutter/services.dart';

class BatteryPlatformDataSource {
  static const _channel = MethodChannel('com.myapp/battery');

  Future<int> getBatteryLevel() async {
    try {
      final int level = await _channel.invokeMethod('getBatteryLevel');
      return level;
    } on PlatformException catch (e) {
      throw BatteryException('Failed to get battery: ${e.message}');
    }
  }
}
```

**Android side — Kotlin handler in `MainActivity.kt`:**

```kotlin
// android/app/src/main/kotlin/.../MainActivity.kt
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import android.os.BatteryManager
import android.content.Context

class MainActivity : FlutterActivity() {
    private val CHANNEL = "com.myapp/battery"

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL)
            .setMethodCallHandler { call, result ->
                when (call.method) {
                    "getBatteryLevel" -> {
                        val batteryManager =
                            getSystemService(Context.BATTERY_SERVICE) as BatteryManager
                        val level = batteryManager
                            .getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)

                        if (level != -1) {
                            result.success(level)
                        } else {
                            result.error("UNAVAILABLE", "Battery level not available", null)
                        }
                    }
                    else -> result.notImplemented()
                }
            }
    }
}
```

**iOS side — Swift handler in `AppDelegate.swift`:**

```swift
// ios/Runner/AppDelegate.swift
import Flutter
import UIKit

@main
@objc class AppDelegate: FlutterAppDelegate {
    override func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
    ) -> Bool {
        let controller = window?.rootViewController as! FlutterViewController
        let batteryChannel = FlutterMethodChannel(
            name: "com.myapp/battery",
            binaryMessenger: controller.binaryMessenger
        )

        batteryChannel.setMethodCallHandler { (call, result) in
            switch call.method {
            case "getBatteryLevel":
                UIDevice.current.isBatteryMonitoringEnabled = true
                let level = Int(UIDevice.current.batteryLevel * 100)
                if level >= 0 {
                    result(level)
                } else {
                    result(FlutterError(
                        code: "UNAVAILABLE",
                        message: "Battery level not available",
                        details: nil
                    ))
                }
            default:
                result(FlutterMethodNotImplemented)
            }
        }

        GeneratedPluginRegistrant.register(with: self)
        return super.application(application, didFinishLaunchingWithOptions: launchOptions)
    }
}
```

**Critical rules:**
- The channel name (`com.myapp/battery`) must match exactly on both sides — it's a string key, not a type.
- Communication is always async. `invokeMethod` returns a `Future`.
- Only standard types cross the bridge: `null`, `bool`, `int`, `double`, `String`, `Uint8List`, `Int32List`, `Float64List`, `List`, `Map`. No custom Dart classes.
- Always handle `PlatformException` — the native side might not implement the method.

---

### EventChannel — Stream Continuous Native Events

MethodChannel is request/response. EventChannel is a persistent stream — battery level changes, GPS updates, sensor readings, Bluetooth scan results.

```dart
class BatteryStreamDataSource {
  static const _eventChannel = EventChannel('com.myapp/battery_stream');

  Stream<int> watchBatteryLevel() {
    return _eventChannel
        .receiveBroadcastStream()
        .map((event) => event as int);
  }
}
```

**Android Kotlin side:**

```kotlin
EventChannel(flutterEngine.dartExecutor.binaryMessenger, "com.myapp/battery_stream")
    .setStreamHandler(object : EventChannel.StreamHandler {
        private var receiver: BroadcastReceiver? = null

        override fun onListen(arguments: Any?, events: EventChannel.EventSink) {
            receiver = object : BroadcastReceiver() {
                override fun onReceive(context: Context, intent: Intent) {
                    val level = intent.getIntExtra(BatteryManager.EXTRA_LEVEL, -1)
                    events.success(level)
                }
            }
            registerReceiver(receiver, IntentFilter(Intent.ACTION_BATTERY_CHANGED))
        }

        override fun onCancel(arguments: Any?) {
            unregisterReceiver(receiver)
            receiver = null
        }
    })
```

**Rule:** `onCancel` is called when the Dart `StreamSubscription` is cancelled. You MUST clean up native resources there — unregister receivers, stop location updates, close connections. Failing to do so leaks native resources.

---

### Where Platform Channels Fit in Clean Architecture

This is why platform channels are in the Clean Architecture week. They are a **data source** — they belong in the data layer, behind a repository abstraction.

```
Presentation Layer
  └─ BatteryBloc
       └─ uses GetBatteryLevel (UseCase)

Domain Layer
  └─ BatteryRepository (abstract — pure Dart interface)
       └─ Stream<int> watchBatteryLevel()
       └─ Future<int> getBatteryLevel()

Data Layer
  └─ BatteryRepositoryImpl implements BatteryRepository
       └─ BatteryPlatformDataSource (wraps MethodChannel + EventChannel)
           └─ MethodChannel('com.myapp/battery')
           └─ EventChannel('com.myapp/battery_stream')
```

The domain layer doesn't know that battery data comes from a platform channel. It could come from a mock, a WebSocket, or a REST API — the domain doesn't care. This means:
- Unit tests for `GetBatteryLevel` use case need zero native code
- You can swap the platform implementation without touching business logic
- The BLoC never imports `package:flutter/services.dart`

---

### Pigeon — Type-Safe Code Generation

Hand-written channels are stringly-typed. You pass `'getBatteryLevel'` as a string, and if you misspell it, you get a runtime error, not a compile error. Pigeon fixes this.

**Define your API in Dart:**

```dart
// pigeons/battery_api.dart
import 'package:pigeon/pigeon.dart';

class BatteryInfo {
  final int level;
  final bool isCharging;
  final String? powerSource;

  BatteryInfo({
    required this.level,
    required this.isCharging,
    this.powerSource,
  });
}

@HostApi()
abstract class BatteryHostApi {
  BatteryInfo getBatteryInfo();
}
```

**Run code generation:**

```bash
dart run pigeon --input pigeons/battery_api.dart
```

This generates:
- `lib/src/battery_api.g.dart` — Dart client code (type-safe, no string method names)
- `android/app/src/main/kotlin/.../BatteryApi.g.kt` — Kotlin implementation interface
- `ios/Runner/BatteryApi.g.swift` — Swift implementation interface

**When to use Pigeon vs raw MethodChannel:**

| | Raw MethodChannel | Pigeon |
|---|---|---|
| Setup | Zero — just use `MethodChannel` | Needs code gen step |
| Type safety | Stringly-typed | Compile-time checked |
| Complex types | Manual serialization | Auto-generated |
| Best for | One-off simple calls | Rich API surfaces with multiple methods and custom types |

**Rule:** If you're passing more than two arguments or returning a custom object, use Pigeon. The 10 minutes of setup saves hours of debugging serialization errors.

---

### Plugin vs Custom Channel

Before writing a custom channel, check [pub.dev](https://pub.dev):

| Need | Plugin to use | Don't write your own |
|---|---|---|
| Battery | `battery_plus` | ✓ |
| GPS/Location | `geolocator` | ✓ |
| Biometrics | `local_auth` | ✓ |
| Camera | `camera` | ✓ |
| Bluetooth | `flutter_blue_plus` | ✓ |
| Sensors | `sensors_plus` | ✓ |

**Write a custom channel when:**
- No plugin exists for your specific native API
- The existing plugin is abandoned or doesn't support your platform version
- You need very specific native behavior the plugin doesn't expose
- Your company has proprietary native SDKs you need to bridge

---

### Testing Platform Channels

You don't test the native side from Dart — you mock the channel:

```dart
void main() {
  late BatteryPlatformDataSource dataSource;

  setUp(() {
    dataSource = BatteryPlatformDataSource();

    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(
      const MethodChannel('com.myapp/battery'),
      (MethodCall methodCall) async {
        if (methodCall.method == 'getBatteryLevel') {
          return 85;
        }
        return null;
      },
    );
  });

  test('getBatteryLevel returns native value', () async {
    final level = await dataSource.getBatteryLevel();
    expect(level, 85);
  });
}
```

In Clean Architecture, you test at the repository level with a mock data source — the channel is an implementation detail that the rest of your code never sees.

---

> **🔀 Coming from TypeScript / React Native?**
>
> Platform channels are Flutter's equivalent of React Native's **Native Modules** (old architecture) or **Turbo Modules** (new architecture). The core difference: React Native uses a JSON bridge that serializes everything, while Flutter's platform channels use a binary codec (`StandardMessageCodec`) that's faster for large payloads. Pigeon is conceptually similar to React Native's **Codegen** in the new architecture — both generate type-safe native interfaces from a declaration file.
>
> In web TypeScript, the closest analogy is `postMessage` between a web page and a Web Worker or iframe — async message passing with serialization constraints.

---

## Lab — Refactor Cart to Clean Architecture

Take the shopping cart from Phase 2 and refactor it:

1. Create `CartItem` entity in `domain/entities/`
2. Create `CartRepository` abstract interface
3. Create use cases: `AddToCart`, `RemoveFromCart`, `UpdateQuantity`, `GetCartTotal`, `ClearCart`
4. Create `CartRepositoryImpl` with an in-memory datasource (no Firebase needed)
5. Register everything with `get_it`
6. Connect to `CartBloc` from Week 19
7. Write unit tests for all 5 use cases — no widget imports

---

## Challenge — Swap the Storage Backend

Your app runs with `CartRepositoryImpl` using an in-memory datasource. Now swap it to Hive storage:

1. Create `CartHiveDatasource` implementing `CartLocalDatasource`
2. Change one line in `injection_container.dart` to register the Hive version
3. All screens, BLoCs, and use cases change **zero lines**

That's dependency inversion working correctly.

---

## Week 20 Verify

1. Draw the three layers on paper. Which direction do dependencies point? Why is the domain layer "pure Dart"?
2. What is the Dependency Inversion Principle? Give an example from this week using `ExpenseRepository`.
3. Why does `get_it` use `registerFactory` for BLoCs but `registerLazySingleton` for repositories?
4. Where does JSON parsing belong — in the entity, the model, or the use case? Why?
5. The `getMonthlySummary` logic (total, topCategory calculation) is in the use case, not the repository. Why?
6. You want to switch from Firebase to Supabase. Which files change? Which files definitely don't change?
7. What is the difference between a Data Source and a Repository? Why have both?
8. Domain layer tests run in 0.1s, widget tests in 2s, integration in 30s+. How does Clean Architecture use this fact to make testing faster? What should you push into the domain layer?
9. `sealed class Result<T>` with `Success<T>` and `Failure<T>` — how does this change your BLoC's event handlers? What does it replace?
10. `FeatureFlagService` wraps Firebase Remote Config. You gate a new payment flow behind `enable_new_checkout`. How do you roll it out to 10% of users? What happens to the other 90%?
11. In a multi-module architecture with `packages/core/` and `packages/features/`, the `auth` feature needs to notify `expenses` when the user logs out. But features can't import each other. How do abstract `Port` interfaces in `core_domain` solve this?
12. Your app needs to read the device's battery level. In Clean Architecture, which layer does the `MethodChannel` call live in — domain, data, or presentation? Draw the dependency chain from BLoC to native Kotlin code. Why does the domain layer never import `package:flutter/services.dart`?
13. You're building a platform channel that sends a `User` object with 6 fields between Dart and native code. Should you use a raw `MethodChannel` with a `Map`, or Pigeon? What specific problem does Pigeon solve that raw channels don't?

---

**Next → [Week 21: Advanced Animations + CustomPainter Charts](Week_21_Advanced_Animations_CustomPaint.md)**
