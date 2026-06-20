# Week 23 — Testing Flutter Apps
### Unit, widget, integration — write tests that actually catch bugs

---

> Three lenses on every concept:
> - 🧑‍💻 **Developer** — what to test, test doubles (mocks/fakes/stubs), test isolation
> - 🎨 **Designer** — widget tests verify your UI contract; golden tests catch visual regressions
> - 🧪 **Tester** — this is YOUR week; learn the full testing pyramid for Flutter

---

## The Testing Pyramid

> 📄 **Flutter Docs:**
> *"Flutter supports three kinds of tests: unit tests, widget tests, and integration tests. Each kind has a different cost/fidelity tradeoff."*

```
         ╔══════════════╗
         ║  Integration ║  ← Tests the full app on a real device/emulator
         ║    tests     ║    Slow (~minutes), few, catches real user flows
         ╠══════════════╣
         ║ Widget tests ║  ← Tests a single widget in isolation
         ║              ║    Fast (~seconds), medium count, catches UI contracts
         ╠══════════════╣
         ║  Unit tests  ║  ← Tests a single function/class
         ║              ║    Instant, many, catches logic bugs
         ╚══════════════╝

Rule: many unit tests → some widget tests → few integration tests
```

**Why test?**
- You refactor the donut chart calculation in `GetMonthlySummary` — unit tests catch every edge case instantly
- A designer changes `ExpenseTile`'s layout — widget tests catch that the delete button is still reachable
- QA reports the checkout flow breaks — integration test reproduces and prevents regression

---

## Setup

```yaml
dev_dependencies:
  flutter_test:              # already included — built into Flutter
    sdk: flutter
  bloc_test: ^9.1.0          # BLoC-specific test helpers
  mockito: ^5.4.0            # generate mock classes
  build_runner: ^2.4.0       # runs code generation for mockito
  integration_test:          # already included
    sdk: flutter
```

---

## Part 1 — Unit Tests

### Testing Use Cases (Pure Dart — No Flutter Import)

```dart
// test/features/expenses/domain/usecases/add_expense_test.dart

import 'package:test/test.dart';        // NOT flutter_test — no widgets needed
import 'package:mockito/mockito.dart';
import 'package:mockito/annotations.dart';

// @GenerateMocks creates MockExpenseRepository for us
// Run: dart run build_runner build
@GenerateMocks([ExpenseRepository])
import 'add_expense_test.mocks.dart';

void main() {
  late MockExpenseRepository mockRepo;
  late AddExpense addExpense;

  setUp(() {
    mockRepo = MockExpenseRepository();
    addExpense = AddExpense(mockRepo);
  });

  group('AddExpense', () {
    test('calls repo.addExpense when params are valid', () async {
      when(mockRepo.addExpense(any)).thenAnswer((_) async {});

      await addExpense(const AddExpenseParams(
        title: 'Coffee',
        amount: 80,
        date: DateTime(2026, 6, 15),
        category: ExpenseCategory.food,
      ));

      // Verify the repo was called exactly once
      verify(mockRepo.addExpense(any)).called(1);
    });

    test('throws InvalidExpenseException when amount is zero', () async {
      expect(
        () => addExpense(const AddExpenseParams(
          title: 'Coffee',
          amount: 0,
          date: DateTime(2026, 6, 15),
          category: ExpenseCategory.food,
        )),
        throwsA(isA<InvalidExpenseException>()),
      );
      verifyNever(mockRepo.addExpense(any));   // repo should NOT be called
    });

    test('throws InvalidExpenseException when amount is negative', () async {
      expect(
        () => addExpense(const AddExpenseParams(
          title: 'Coffee',
          amount: -50,
          date: DateTime(2026, 6, 15),
          category: ExpenseCategory.food,
        )),
        throwsA(isA<InvalidExpenseException>()
            .having((e) => e.message, 'message', contains('positive'))),
      );
    });

    test('throws InvalidExpenseException when title is empty', () async {
      expect(
        () => addExpense(const AddExpenseParams(
          title: '   ',  // only whitespace
          amount: 80,
          date: DateTime(2026, 6, 15),
          category: ExpenseCategory.food,
        )),
        throwsA(isA<InvalidExpenseException>()),
      );
    });

    test('trims whitespace from title before saving', () async {
      when(mockRepo.addExpense(any)).thenAnswer((_) async {});

      await addExpense(const AddExpenseParams(
        title: '  Coffee  ',
        amount: 80,
        date: DateTime(2026, 6, 15),
        category: ExpenseCategory.food,
      ));

      final captured = verify(mockRepo.addExpense(captureAny)).captured.first as Expense;
      expect(captured.title, 'Coffee');   // whitespace stripped
    });
  });

  group('GetMonthlySummary', () {
    late MockExpenseRepository mockRepo2;
    late GetMonthlySummary getMonthlySummary;

    setUp(() {
      mockRepo2 = MockExpenseRepository();
      getMonthlySummary = GetMonthlySummary(mockRepo2);
    });

    test('returns topCategory as food when food has highest total', () async {
      when(mockRepo2.getMonthlySummary(2026, 6)).thenAnswer((_) async => {
        ExpenseCategory.food: 3500.0,
        ExpenseCategory.transport: 1200.0,
        ExpenseCategory.entertainment: 800.0,
      });

      final result = await getMonthlySummary(const MonthParams(year: 2026, month: 6));

      expect(result.total, 5500.0);
      expect(result.topCategory, ExpenseCategory.food);
    });

    test('returns total of 0 when no expenses', () async {
      when(mockRepo2.getMonthlySummary(any, any)).thenAnswer((_) async => {});

      final result = await getMonthlySummary(const MonthParams(year: 2026, month: 6));
      expect(result.total, 0.0);
      expect(result.topCategory, isNull);
    });
  });
}
```

### Testing the Expense Entity

```dart
// test/features/expenses/domain/entities/expense_test.dart

void main() {
  const baseExpense = Expense(
    id: '1',
    userId: 'u1',
    title: 'Coffee',
    amount: 80,
    date: DateTime(2026, 6, 15),
    category: ExpenseCategory.food,
  );

  group('Expense', () {
    test('isRecent returns true for today', () {
      final today = Expense(
        id: '2', userId: 'u1', title: 'x', amount: 1,
        date: DateTime.now(), category: ExpenseCategory.other,
      );
      expect(today.isRecent, true);
    });

    test('isRecent returns false for 8 days ago', () {
      final old = Expense(
        id: '3', userId: 'u1', title: 'x', amount: 1,
        date: DateTime.now().subtract(const Duration(days: 8)),
        category: ExpenseCategory.other,
      );
      expect(old.isRecent, false);
    });

    test('formattedAmount formats correctly', () {
      expect(baseExpense.formattedAmount, '₹80.00');
    });

    test('copyWith preserves unchanged fields', () {
      final updated = baseExpense.copyWith(amount: 100);
      expect(updated.id, baseExpense.id);
      expect(updated.title, baseExpense.title);
      expect(updated.amount, 100);
    });

    test('equality is based on id', () {
      const e1 = Expense(id: '1', userId: 'u1', title: 'Coffee', amount: 80, date: DateTime(2026, 6, 15), category: ExpenseCategory.food);
      const e2 = Expense(id: '1', userId: 'u2', title: 'Tea', amount: 40, date: DateTime(2026, 1, 1), category: ExpenseCategory.other);
      expect(e1, equals(e2));  // same id → equal
    });
  });
}
```

🧑‍💻 **Developer — Test doubles:**
- **Mock** (Mockito): records calls and returns values you configure. Use when you need to verify the call happened.
- **Fake**: a real implementation of the interface, but simplified (e.g., stores in a list). Use when you want real behavior without Firebase.
- **Stub**: an object that always returns a fixed value. Simpler than a mock.

For most use case tests: Mockito mock + `when(...).thenAnswer(...)`.
For repo tests: write a `FakeExpenseDatasource` that stores in memory.

---

## Part 2 — Widget Tests

### Testing a Single Widget

```dart
// test/features/expenses/presentation/widgets/expense_tile_test.dart

import 'package:flutter_test/flutter_test.dart';

void main() {
  final testExpense = Expense(
    id: '1',
    userId: 'u1',
    title: 'Coffee at Café',
    amount: 80,
    date: DateTime(2026, 6, 15),
    category: ExpenseCategory.food,
  );

  testWidgets('ExpenseTile displays title and amount', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: ExpenseTile(expense: testExpense),
        ),
      ),
    );

    // Find by text
    expect(find.text('Coffee at Café'), findsOneWidget);
    expect(find.text('₹80.00'), findsOneWidget);

    // Find the category icon
    expect(find.byIcon(Icons.restaurant), findsOneWidget);
  });

  testWidgets('ExpenseTile calls onDelete after swipe and confirm', (tester) async {
    bool deleteCalled = false;

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: ExpenseTile(
            expense: testExpense,
            onDelete: () => deleteCalled = true,
          ),
        ),
      ),
    );

    // Swipe left to reveal delete
    await tester.drag(find.byType(ExpenseTile), const Offset(-500, 0));
    await tester.pumpAndSettle();

    // Confirm dialog appears
    expect(find.text('Delete expense?'), findsOneWidget);

    // Tap the Delete button
    await tester.tap(find.widgetWithText(FilledButton, 'Delete'));
    await tester.pumpAndSettle();

    expect(deleteCalled, true);
  });

  testWidgets('ExpenseTile cancel dismissal keeps tile visible', (tester) async {
    bool deleteCalled = false;

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: ExpenseTile(expense: testExpense, onDelete: () => deleteCalled = true),
        ),
      ),
    );

    await tester.drag(find.byType(ExpenseTile), const Offset(-500, 0));
    await tester.pumpAndSettle();

    await tester.tap(find.widgetWithText(TextButton, 'Cancel'));
    await tester.pumpAndSettle();

    expect(deleteCalled, false);
    expect(find.text('Coffee at Café'), findsOneWidget);  // still visible
  });
}
```

### Testing a BLoC-Connected Screen

```dart
// test/features/expenses/presentation/screens/add_expense_screen_test.dart

void main() {
  late MockExpenseBloc mockBloc;

  setUp(() {
    mockBloc = MockExpenseBloc();
    // BLoC requires initial state
    when(mockBloc.state).thenReturn(ExpenseInitial());
    when(mockBloc.stream).thenAnswer((_) => const Stream.empty());
  });

  testWidgets('AddExpenseScreen submits AddExpenseEvent on valid form', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: BlocProvider<ExpenseBloc>.value(
          value: mockBloc,
          child: const AddExpenseScreen(),
        ),
      ),
    );

    // Fill in the form
    await tester.enterText(find.byType(TextFormField).first, 'Coffee');
    await tester.enterText(find.byType(TextFormField).at(1), '80');

    // Submit
    await tester.tap(find.widgetWithText(FilledButton, 'Save Expense'));
    await tester.pumpAndSettle();

    // Verify the BLoC received the event
    verify(mockBloc.add(argThat(isA<AddExpenseEvent>()))).called(1);
  });

  testWidgets('AddExpenseScreen shows validation errors when form is empty', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: BlocProvider<ExpenseBloc>.value(
          value: mockBloc,
          child: const AddExpenseScreen(),
        ),
      ),
    );

    // Tap submit without filling the form
    await tester.tap(find.widgetWithText(FilledButton, 'Save Expense'));
    await tester.pump();

    expect(find.text('Required'), findsWidgets);
    verifyNever(mockBloc.add(any));
  });
}
```

### Golden Tests — Visual Regression

```dart
// test/features/expenses/presentation/widgets/expense_tile_golden_test.dart

import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('ExpenseTile matches golden', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: ThemeData(useMaterial3: true),
        home: Scaffold(
          body: ExpenseTile(
            expense: Expense(
              id: '1', userId: 'u1', title: 'Coffee', amount: 80,
              date: DateTime(2026, 6, 15), category: ExpenseCategory.food,
            ),
          ),
        ),
      ),
    );

    // First run: creates the golden file in test/goldens/
    // Subsequent runs: compares pixel-by-pixel
    await expectLater(
      find.byType(ExpenseTile),
      matchesGoldenFile('goldens/expense_tile.png'),
    );
  });
}

// Run to UPDATE goldens:   flutter test --update-goldens
// Run normally (compare): flutter test
```

🎨 **Designer:** Golden tests are your contract with developers. Once the designer approves a component's look, lock it with a golden test. Future code changes that accidentally shift the layout by 2px will fail the golden test immediately — before it ships.

---

## Part 3 — BLoC Tests

```dart
// test/features/expenses/presentation/bloc/expense_bloc_test.dart

@GenerateMocks([GetExpenses, AddExpense, DeleteExpense, UpdateExpense])
import 'expense_bloc_test.mocks.dart';

void main() {
  late MockGetExpenses mockGet;
  late MockAddExpense mockAdd;
  late MockDeleteExpense mockDelete;
  late MockUpdateExpense mockUpdate;

  final sampleExpenses = [
    Expense(id: '1', userId: 'u1', title: 'Coffee', amount: 80,
        date: DateTime(2026, 6, 1), category: ExpenseCategory.food),
    Expense(id: '2', userId: 'u1', title: 'Bus', amount: 40,
        date: DateTime(2026, 6, 2), category: ExpenseCategory.transport),
  ];

  setUp(() {
    mockGet = MockGetExpenses();
    mockAdd = MockAddExpense();
    mockDelete = MockDeleteExpense();
    mockUpdate = MockUpdateExpense();
  });

  ExpenseBloc buildBloc() => ExpenseBloc(
    getExpenses: mockGet, addExpense: mockAdd,
    updateExpense: mockUpdate, deleteExpense: mockDelete,
  );

  group('LoadExpensesEvent', () {
    blocTest<ExpenseBloc, ExpenseState>(
      'emits [Loading, Loaded] on success',
      build: () {
        when(mockGet(any)).thenAnswer((_) async => sampleExpenses);
        return buildBloc();
      },
      act: (b) => b.add(LoadExpensesEvent()),
      expect: () => [
        isA<ExpenseLoading>(),
        isA<ExpenseLoaded>().having((s) => s.all, 'expenses', sampleExpenses),
      ],
    );

    blocTest<ExpenseBloc, ExpenseState>(
      'emits [Loading, Error] when repo throws',
      build: () {
        when(mockGet(any)).thenThrow(Exception('Network error'));
        return buildBloc();
      },
      act: (b) => b.add(LoadExpensesEvent()),
      expect: () => [
        isA<ExpenseLoading>(),
        isA<ExpenseError>().having((s) => s.message, 'msg', contains('Network error')),
      ],
    );
  });

  group('DeleteExpenseEvent', () {
    blocTest<ExpenseBloc, ExpenseState>(
      'optimistically removes then confirms deletion',
      seed: () => ExpenseLoaded(all: sampleExpenses, filtered: sampleExpenses, filter: const ExpenseFilter()),
      build: () {
        when(mockDelete(any)).thenAnswer((_) async {});
        return buildBloc();
      },
      act: (b) => b.add(DeleteExpenseEvent(id: '1')),
      expect: () => [
        isA<ExpenseLoaded>().having((s) => s.all.length, 'count', 1),
      ],
      verify: (_) => verify(mockDelete(any)).called(1),
    );

    blocTest<ExpenseBloc, ExpenseState>(
      'restores original list when deletion fails',
      seed: () => ExpenseLoaded(all: sampleExpenses, filtered: sampleExpenses, filter: const ExpenseFilter()),
      build: () {
        when(mockDelete(any)).thenThrow(Exception('Network'));
        return buildBloc();
      },
      act: (b) => b.add(DeleteExpenseEvent(id: '1')),
      expect: () => [
        isA<ExpenseLoaded>().having((s) => s.all.length, 'optimistic', 1),  // optimistically removed
        isA<ExpenseLoaded>().having((s) => s.all.length, 'restored', 2),    // restored after error
      ],
    );
  });

  group('FilterChangedEvent', () {
    blocTest<ExpenseBloc, ExpenseState>(
      'filters to food category only',
      seed: () => ExpenseLoaded(all: sampleExpenses, filtered: sampleExpenses, filter: const ExpenseFilter()),
      build: buildBloc,
      act: (b) => b.add(FilterChangedEvent(filter: const ExpenseFilter(category: ExpenseCategory.food))),
      expect: () => [
        isA<ExpenseLoaded>().having((s) => s.filtered.length, 'filtered count', 1)
            .having((s) => s.filtered.first.category, 'category', ExpenseCategory.food),
      ],
    );
  });
}
```

---

## Part 4 — Integration Tests

```dart
// integration_test/app_test.dart
// Runs on a real device/emulator

import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('Expense flow', () {
    testWidgets('user can add and see an expense', (tester) async {
      // Start the full app
      await tester.pumpWidget(const App());
      await tester.pumpAndSettle();

      // If not logged in, this would need to handle auth
      // For integration tests, use a test Firebase project

      // Navigate to add expense
      await tester.tap(find.byType(FloatingActionButton));
      await tester.pumpAndSettle();

      // Fill in the form
      await tester.enterText(
        find.widgetWithText(TextFormField, 'What did you spend on?'),
        'Test Coffee',
      );
      await tester.enterText(
        find.widgetWithText(TextFormField, 'Amount (₹)'),
        '99',
      );

      // Save
      await tester.tap(find.widgetWithText(FilledButton, 'Save Expense'));
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // Should see the expense in the list
      expect(find.text('Test Coffee'), findsOneWidget);
      expect(find.text('₹99.00'), findsOneWidget);
    });
  });
}

// Run: flutter test integration_test/app_test.dart
```

🧪 **Tester:** Integration tests are slow but catch things unit/widget tests can't:
- Real Firebase latency
- Navigation transitions
- Keyboard closing on submit
- Scroll behavior in real list
- System dialog interactions (date picker, permissions)

Keep integration tests focused on **critical user flows** only: add expense, delete expense, view dashboard.

---

## Running Tests

```bash
# Unit and widget tests
flutter test

# Specific file
flutter test test/features/expenses/domain/usecases/add_expense_test.dart

# With coverage report
flutter test --coverage
# Then: lcov --summary coverage/lcov.info

# Watch mode (re-runs on file change)
flutter test --watch

# Integration tests on connected device
flutter test integration_test/

# Update golden files
flutter test --update-goldens
```

---

## What to Test — Decision Guide

```
Entity / model properties and methods?        → unit test
Use case business rules?                      → unit test (mock repo)
Repository data transformation?               → unit test (mock datasource)
BLoC event → state transitions?               → blocTest
Widget shows correct text/icons?              → widget test
Widget responds to user interaction?          → widget test
Screen submits correct BLoC event?            → widget test (mock BLoC)
Component matches approved design?            → golden test
Full user flow end-to-end?                    → integration test (sparingly)
```

---

## Part 5 — Test Data Builders

> 🍎 **Academy Golden Rule — Test Readability:**
> *"A test should read like a specification. If someone reads only your test file and never sees the production code, they should understand what the feature does."*

Raw constructors inside tests are brittle — when you add a field to `Expense`, every test that constructs one breaks. Test data builders solve this.

```dart
// test/helpers/builders.dart

class ExpenseBuilder {
  String _id = 'test-id';
  String _userId = 'test-user';
  String _title = 'Test Expense';
  double _amount = 100;
  DateTime _date = DateTime(2026, 6, 15);
  ExpenseCategory _category = ExpenseCategory.food;

  ExpenseBuilder withId(String id) { _id = id; return this; }
  ExpenseBuilder withTitle(String title) { _title = title; return this; }
  ExpenseBuilder withAmount(double amount) { _amount = amount; return this; }
  ExpenseBuilder withDate(DateTime date) { _date = date; return this; }
  ExpenseBuilder withCategory(ExpenseCategory cat) { _category = cat; return this; }
  ExpenseBuilder forUser(String userId) { _userId = userId; return this; }

  Expense build() => Expense(
    id: _id, userId: _userId, title: _title,
    amount: _amount, date: _date, category: _category,
  );
}

// Usage in tests — readable, resilient, only specify what matters
test('isLarge returns true for amount > 1000', () {
  final expense = ExpenseBuilder()
      .withAmount(1500)    // only the field that matters for THIS test
      .build();
  expect(expense.isLarge, true);
});

test('food expenses show restaurant icon', () {
  final expense = ExpenseBuilder()
      .withCategory(ExpenseCategory.food)
      .build();
  expect(expense.icon, Icons.restaurant);
});

// Batch creation for list tests
List<Expense> buildExpenseList(int count, {ExpenseCategory? category}) {
  return List.generate(count, (i) => ExpenseBuilder()
      .withId('id-$i')
      .withTitle('Expense $i')
      .withAmount((i + 1) * 50.0)
      .withCategory(category ?? ExpenseCategory.values[i % ExpenseCategory.values.length])
      .build(),
  );
}
```

**Why builders over raw constructors:**
```dart
// ❌ Fragile — when you add a 'receipt' field to Expense, all 47 tests break
final expense = Expense(id: '1', userId: 'u1', title: 'Coffee', amount: 80,
    date: DateTime(2026, 6, 15), category: ExpenseCategory.food);

// ✓ Builder — defaults handle the new field, only this test cares about amount
final expense = ExpenseBuilder().withAmount(80).build();
```

---

## Part 6 — WidgetTester Methods Reference

```
┌──────────────────────────────────────────────────────────────────────────┐
│                     WidgetTester Quick Reference                        │
├──────────────────────────┬───────────────────────────────────────────────┤
│ Method                   │ What it does                                 │
├──────────────────────────┼───────────────────────────────────────────────┤
│ pumpWidget(widget)       │ Renders the widget tree for the first time   │
│ pump()                   │ Triggers a single frame (one build pass)     │
│ pump(Duration(ms: 500))  │ Advances the clock by 500ms + one frame      │
│ pumpAndSettle()          │ Pumps frames until no animations are pending │
│ pumpFrames(count, dur)   │ Pumps exactly N frames with given interval   │
├──────────────────────────┼───────────────────────────────────────────────┤
│ tap(finder)              │ Simulates a tap at the center of the widget  │
│ longPress(finder)        │ Simulates a long press                       │
│ drag(finder, offset)     │ Simulates a drag from center by offset       │
│ fling(finder, offset, v) │ Drag with velocity (for scroll physics)      │
│ enterText(finder, text)  │ Types text into a TextField                  │
├──────────────────────────┼───────────────────────────────────────────────┤
│ find.text('...')         │ Finds widgets displaying this text           │
│ find.byType(Widget)      │ Finds all widgets of this type               │
│ find.byIcon(Icons.x)     │ Finds Icon widgets with this icon data       │
│ find.byKey(Key('k'))     │ Finds by ValueKey / Key                      │
│ find.widgetWithText(T,s) │ Finds type T that contains text s            │
│ find.descendant(of, m)   │ Finds matcher m inside ancestor of           │
├──────────────────────────┼───────────────────────────────────────────────┤
│ findsOneWidget           │ Matcher: exactly one widget found             │
│ findsNothing             │ Matcher: no widgets found                     │
│ findsWidgets             │ Matcher: one or more widgets found            │
│ findsNWidgets(n)         │ Matcher: exactly n widgets found              │
│ findsAtLeastNWidgets(n)  │ Matcher: at least n widgets found             │
└──────────────────────────┴───────────────────────────────────────────────┘
```

**`pump()` vs `pumpAndSettle()` — when to use each:**
```dart
// pump() — advance exactly one frame
// Use when: you need precise control, or the animation is infinite (loading spinner)
await tester.tap(find.byType(FloatingActionButton));
await tester.pump();   // process the tap
await tester.pump(const Duration(milliseconds: 300));  // advance animation

// pumpAndSettle() — pump until quiescent (no scheduled frames)
// Use when: you want all animations to complete (page transition, dialog open)
// ⚠️ Will HANG if there's an infinite animation (CircularProgressIndicator)
await tester.tap(find.text('Next'));
await tester.pumpAndSettle();  // waits for page transition to finish

// pumpAndSettle with timeout — safety net
await tester.pumpAndSettle(const Duration(seconds: 5));
```

---

## Part 7 — Accessibility Testing

> 🍎 **Academy Golden Rule — Accessibility Is Not Optional:**
> *"Every app you ship must work with VoiceOver, Dynamic Type, and high contrast. Testing accessibility is testing correctness."*

```dart
testWidgets('ExpenseTile is accessible', (tester) async {
  final semantics = tester.getSemantics(find.byType(ExpenseTile));

  // Check that screen readers announce meaningful content
  expect(semantics.label, contains('Coffee'));
  expect(semantics.label, contains('₹80'));

  // Verify tappable elements have semantic labels
  expect(
    find.bySemanticsLabel('Delete expense'),
    findsOneWidget,
  );
});

// Built-in accessibility checks — run on ALL widget tests
testWidgets('dashboard meets accessibility guidelines', (tester) async {
  final handle = tester.ensureSemantics();

  await tester.pumpWidget(const MaterialApp(home: DashboardScreen()));
  await tester.pumpAndSettle();

  // Check minimum tap target sizes (48x48 per Material, 44x44 per Apple HIG)
  await expectLater(tester, meetsGuideline(androidTapTargetGuideline));
  await expectLater(tester, meetsGuideline(iOSTapTargetGuideline));

  // Check text contrast ratios
  await expectLater(tester, meetsGuideline(textContrastGuideline));

  // Check that all tappable elements have semantic labels
  await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));

  handle.dispose();
});
```

**Rule:** Add `meetsGuideline` checks to your most important screens. They catch real accessibility bugs — a tiny icon button without a label, a light-gray text on white background, a 32x32 tap target.

---

## Part 8 — Contract Tests (API Testing)

> 🏢 **Enterprise Reality:**
> *"Your mobile team and backend team deploy independently. A contract test verifies that the API response matches the exact shape your app expects — before it hits production."*

```dart
// test/contracts/expense_api_contract_test.dart
// This test hits the REAL staging API — not a mock

@Tags(['contract'])  // run separately: flutter test --tags contract
void main() {
  late Dio dio;

  setUpAll(() {
    dio = Dio(BaseOptions(
      baseUrl: 'https://staging-api.yourapp.com',
      headers: {'Authorization': 'Bearer ${Platform.environment['STAGING_TOKEN']}'},
    ));
  });

  test('GET /expenses returns valid expense list schema', () async {
    final response = await dio.get('/expenses');

    expect(response.statusCode, 200);
    expect(response.data, isList);

    if ((response.data as List).isNotEmpty) {
      final first = response.data[0] as Map<String, dynamic>;

      // Verify the shape — these fields MUST exist
      expect(first, containsPair('id', isA<String>()));
      expect(first, containsPair('title', isA<String>()));
      expect(first, containsPair('amount', isA<num>()));
      expect(first, containsPair('category', isA<String>()));
      expect(first, containsPair('date', isA<String>()));

      // Verify the model can parse it without crashing
      expect(() => Expense.fromJson(first), returnsNormally);
    }
  });

  test('POST /expenses accepts valid expense payload', () async {
    final response = await dio.post('/expenses', data: {
      'title': 'Contract Test',
      'amount': 100,
      'category': 'food',
      'date': DateTime.now().toIso8601String(),
    });

    expect(response.statusCode, anyOf(200, 201));
    expect(response.data['id'], isA<String>());

    // Cleanup — delete the test expense
    await dio.delete('/expenses/${response.data['id']}');
  });
}
```

---

## Part 9 — Patrol — Native Integration Tests

> 🏢 **Enterprise Reality:**
> *"Flutter's built-in integration tests can't interact with native OS dialogs — permission prompts, notification banners, system date pickers. Patrol can."*

```yaml
# pubspec.yaml
dev_dependencies:
  patrol: ^3.6.0
```

```dart
// integration_test/expense_flow_test.dart
import 'package:patrol/patrol.dart';

void main() {
  patrolTest('complete expense creation flow including permission', ($) async {
    await $.pumpWidgetAndSettle(const App());

    // Patrol can interact with native dialogs
    await $.tap(find.text('Add Expense'));
    await $.pumpAndSettle();

    // Fill Flutter form
    await $.enterText(find.byType(TextFormField).first, 'Coffee');
    await $.enterText(find.byType(TextFormField).at(1), '80');

    // Tap date picker → opens native OS date picker
    await $.tap(find.byIcon(Icons.calendar_today));
    await $.pumpAndSettle();

    // Patrol can tap native widgets
    await $.native.tap(NativeSelector(text: 'OK'));

    // Take a screenshot for visual verification
    await $.takeScreenshot(name: 'expense_form_filled');

    // Submit
    await $.tap(find.text('Save Expense'));
    await $.pumpAndSettle();

    expect(find.text('Coffee'), findsOneWidget);
    expect(find.text('₹80.00'), findsOneWidget);
  });
}
```

---

## Part 10 — Test Coverage Gates in CI

```yaml
# .github/workflows/test.yml — fail CI if coverage drops
- name: Run tests with coverage
  run: flutter test --coverage

- name: Check coverage threshold
  run: |
    TOTAL=$(lcov --summary coverage/lcov.info 2>&1 | grep "lines" | awk '{print $2}' | sed 's/%//')
    echo "Coverage: $TOTAL%"
    if (( $(echo "$TOTAL < 80" | bc -l) )); then
      echo "❌ Coverage $TOTAL% is below 80% threshold"
      exit 1
    fi
    echo "✅ Coverage $TOTAL% meets threshold"

- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v3
  with:
    file: coverage/lcov.info
    fail_ci_if_error: true
```

**Enterprise test coverage targets:**
```
Layer                    Target    Rationale
──────────────────────────────────────────────
Domain (entities)        100%      Pure logic, easy to test
Domain (use cases)       100%      Business rules — the most critical code
Data (repositories)      90%+      Transformation logic
Presentation (BLoC)      95%+      Every event→state path
Widgets                  70%+      Key interactions + golden tests
Integration              Critical flows only (5-10 tests)
```

---

## Lab — Write Tests for `GetSpendingTrend`

The `GetSpendingTrend` use case from Week 22 needs tests:

1. Test: 30-day range, expenses on days 1, 15, 30 — verify correct daily totals
2. Test: no expenses in range — all daily totals are 0, average is 0
3. Test: multiple expenses on same day — totals are summed for that day
4. Test: expense on exactly the first day of range — included
5. Test: expense one day before the start — NOT included (boundary test)

---

## Challenge — 100% Coverage on Domain Layer

Run `flutter test --coverage` and view the coverage report. Reach 100% line coverage on every file inside `features/expenses/domain/`. You'll need to add tests for:
- All enum cases in `ExpenseCategory` (switch exhaustiveness)
- The `monthKey` computed property
- `isLarge` (amount > 1000)
- Edge cases in `copyWith` (every parameter)

---

## Week 23 Verify

1. What is the difference between a Mock and a Fake? Give an example of when you'd use each.
2. In `blocTest`, what does `seed:` do? Why is it needed for the delete test?
3. `verifyNever(mockRepo.addExpense(any))` — what does this assert? Why is this important?
4. Why do widget tests require `tester.pumpAndSettle()` after a tap?
5. What's the difference between `pump()` and `pumpAndSettle()`? When would `pumpAndSettle` hang, and what do you do?
6. Golden tests fail after a legitimate UI change. What's the right process?
7. You have a BLoC handler that makes a network call and then updates local storage. How do you test this with two separate mock objects?
8. Why is a test data builder better than calling the `Expense` constructor directly in every test? What happens when you add a new required field to `Expense`?
9. `meetsGuideline(androidTapTargetGuideline)` fails for a small icon. What is the minimum tap target size? How do you fix it without changing the icon's visual size?
10. You run `pumpAndSettle()` on a screen with a `CircularProgressIndicator`. What happens and why? How do you fix the test?

---

**Next → [Week 24: Performance and Profiling](Week_24_Performance_and_Profiling.md)**
