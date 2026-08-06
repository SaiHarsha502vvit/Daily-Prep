# Testing Challenges

### Companion to [Week 24: Testing](Week_24_Testing.md)

---

## How This Works

A flaky test is the best teacher testing has — you can't understand *why* `pumpAndSettle()` hangs until you've made it hang yourself and diagnosed why. Paste starters into [DartPad](https://dartpad.dev) or a real Flutter project's `test/` folder.

---

### W24-1 (Medium) — Mock vs Fake: write both, for the same interface

**Problem:** given `abstract class UserRepository { Future<User> getUser(String id); }`, write **both** a Mock (verifies it was called, with what arguments) and a Fake (a real, working, in-memory implementation) — then identify a test where only one of the two is actually appropriate.

```dart
abstract class UserRepository {
  Future<User> getUser(String id);
}

class User {
  User(this.id, this.name);
  final String id;
  final String name;
}

// TODO: FakeUserRepository — actually works, returns real-ish data
// TODO: MockUserRepository — records calls, lets you assert "was getUser('42') called exactly once?"
```

**Task:** implement both. Then write one sentence for each: a test scenario where the Fake is the right choice, and a different scenario where the Mock is the right choice.

<details><summary>Solution & Explanation</summary>

```dart
class FakeUserRepository implements UserRepository {
  final Map<String, User> _data = {'1': User('1', 'Alice'), '2': User('2', 'Bob')};

  @override
  Future<User> getUser(String id) async {
    final user = _data[id];
    if (user == null) throw Exception('User not found: $id');
    return user;
  }
}

class MockUserRepository implements UserRepository {
  final List<String> calledWith = [];
  User? nextResult;

  @override
  Future<User> getUser(String id) async {
    calledWith.add(id);
    return nextResult ?? User(id, 'Mocked User');
  }
}

void main() async {
  // Fake is right when: testing a UseCase's actual logic given realistic data flow
  final useCase = GetUserDisplayName(FakeUserRepository());
  print(await useCase('1')); // 'Alice' — genuinely computed through real (fake) data

  // Mock is right when: testing that a class calls its dependency correctly
  final mock = MockUserRepository();
  final anotherUseCase = GetUserDisplayName(mock);
  await anotherUseCase('42');
  assert(mock.calledWith.contains('42')); // verifying the INTERACTION, not the data
}

class GetUserDisplayName {
  GetUserDisplayName(this._repo);
  final UserRepository _repo;
  Future<String> call(String id) async => (await _repo.getUser(id)).name;
}
```

🔴 **Explanation:** the distinction that matters — a **Fake** is a real, working implementation with simplified internals (an in-memory `Map` instead of a real database); you use it when you want the code under test to behave *as if* talking to a genuine dependency, because you care about the actual data flowing through correctly. A **Mock** doesn't really "work" — it records what was called and returns whatever you told it to; you use it when the thing you're actually verifying is the *interaction itself* ("did we call `getUser` with the right ID exactly once," "did we call `deleteUser` at all when the user tapped delete"), not the resulting data. Reaching for a Mock when you actually need a Fake produces tests that pass even when the real logic is broken, because the Mock was never exercising real behavior to begin with.

</details>

---

### W24-2 (Easy) — Widget test golden path: fill, submit, verify

**Problem:** write a `testWidgets` test for a login form: enter an invalid email, tap submit, verify the exact error text appears.

```dart
testWidgets('shows validation error for invalid email', (tester) async {
  await tester.pumpWidget(const MaterialApp(home: LoginForm()));

  // TODO:
  // 1. find the email TextFormField and enter 'not-an-email'
  // 2. tap the submit button
  // 3. pump once to let validation run and rebuild
  // 4. verify find.text('Enter a valid email') finds exactly one widget
});
```

<details><summary>Solution & Explanation</summary>

```dart
testWidgets('shows validation error for invalid email', (tester) async {
  await tester.pumpWidget(const MaterialApp(home: LoginForm()));

  await tester.enterText(find.byKey(const Key('email_field')), 'not-an-email');
  await tester.tap(find.byKey(const Key('submit_button')));
  await tester.pump();

  expect(find.text('Enter a valid email'), findsOneWidget);
});
```

🔴 **Explanation:** the one easy-to-miss step is `await tester.pump()` after the tap — [Week 24's Invisible Machinery](Week_24_Testing.md) covers why: widget tests have **no automatic VSYNC**, nothing rebuilds until you explicitly trigger a frame. `tester.tap()` delivers the tap gesture and runs the `onPressed` callback, which calls `validate()` and (presumably) `setState()` internally — but the actual rebuild painting the new error text onto the widget tree doesn't happen until `pump()` runs a frame. Skip it, and `find.text('Enter a valid email')` finds nothing, even though the underlying validation logic ran correctly — a bug in the *test*, not the app, that's easy to misdiagnose as the opposite.

</details>

---

### W24-3 (Hard) — Reproduce and fix a flaky test caused by `pumpAndSettle()`

**Problem:** a widget with an infinite loading-spinner animation, tested naively.

```dart
class InfiniteSpinner extends StatefulWidget {
  const InfiniteSpinner({super.key});
  @override
  State<InfiniteSpinner> createState() => _InfiniteSpinnerState();
}

class _InfiniteSpinnerState extends State<InfiniteSpinner> with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(seconds: 1),
  )..repeat(); // infinite — never completes

  @override
  Widget build(BuildContext context) {
    return RotationTransition(turns: _controller, child: const Icon(Icons.refresh));
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }
}

testWidgets('spinner test that hangs', (tester) async {
  await tester.pumpWidget(const MaterialApp(home: InfiniteSpinner()));
  await tester.pumpAndSettle(); // BUG: this will time out
  expect(find.byType(Icon), findsOneWidget);
});
```

**Task:** run it, note the timeout error. Fix the test — not the widget (the infinite spinner is legitimate, real production behavior) — using targeted `pump(duration)` calls instead of `pumpAndSettle()`.

<details><summary>Solution & Explanation</summary>

```dart
testWidgets('spinner test that does not hang', (tester) async {
  await tester.pumpWidget(const MaterialApp(home: InfiniteSpinner()));
  await tester.pump(); // one frame — enough to build and start the animation
  expect(find.byType(Icon), findsOneWidget);
  // do NOT call pumpAndSettle() — this animation never settles, by design
});
```

🔴 **Explanation:** `pumpAndSettle()` internally loops `pump()` until no more frames are scheduled and no animations are running — from [Week 24's Invisible Machinery](Week_24_Testing.md): `while (hasPendingFrames || hasRunningAnimations) { pump(); }`. An `AnimationController..repeat()` never stops running by definition, so that loop never exits, and the test framework eventually times out (usually after 10 real seconds) with an unhelpful-looking failure. The fix isn't a hack — it's recognizing that `pumpAndSettle()` is fundamentally the wrong tool for anything with a legitimately infinite animation; a single `pump()` (or a `pump(duration)` if you need the widget tree to reflect a specific point in the animation) is the correct, deliberate choice. This is a real, common flaky-test root cause in production Flutter test suites — a loading spinner, a shimmer effect, a pulsing icon, anything with `..repeat()` will hang any test that reaches for `pumpAndSettle()` reflexively.

</details>

---

### W24-4 (Medium) — Structure a `blocTest`-shaped test manually

**Problem:** a delete-with-undo BLoC: starting from a seeded "5 items" state, a `DeleteItemEvent` should emit a state with 4 items. Using the manual stream-collection technique from [Week 20b's T20-4](../Phase_5_Advanced_Patterns/Week_20b_BLoC_Challenges.md) (not the `bloc_test` package), write the test.

```dart
sealed class ItemsState {}
class ItemsLoaded extends ItemsState {
  ItemsLoaded(this.items);
  final List<String> items;
}

sealed class ItemsEvent {}
class DeleteItemEvent extends ItemsEvent {
  DeleteItemEvent(this.item);
  final String item;
}

class ItemsBloc extends Bloc<ItemsEvent, ItemsState> {
  ItemsBloc(List<String> seed) : super(ItemsLoaded(seed)) {
    on<DeleteItemEvent>((event, emit) {
      final current = (state as ItemsLoaded).items;
      emit(ItemsLoaded([...current]..remove(event.item)));
    });
  }
}

void main() async {
  // TODO: seed with 5 items, dispatch DeleteItemEvent for one of them,
  // collect emitted states, assert the resulting list has 4 items and
  // does NOT contain the deleted one
}
```

<details><summary>Solution & Explanation</summary>

```dart
void main() async {
  final bloc = ItemsBloc(['apple', 'banana', 'cherry', 'date', 'elderberry']);
  final emitted = <ItemsState>[];
  final sub = bloc.stream.listen(emitted.add);

  bloc.add(DeleteItemEvent('cherry'));
  await Future.delayed(Duration.zero); // let the synchronous handler's emit propagate

  assert(emitted.length == 1);
  final result = (emitted.first as ItemsLoaded).items;
  assert(result.length == 4);
  assert(!result.contains('cherry'));

  await sub.cancel();
  await bloc.close();
}
```

🔴 **Explanation:** the seed (`ItemsBloc(['apple', ...])`) is passed to `super(ItemsLoaded(seed))` in the constructor — this is what `blocTest`'s `seed:` parameter automates, letting a test start from a specific state rather than the BLoC's normal initial state, so you're testing "given we're already showing 5 items, what happens on delete" in isolation from however the BLoC would normally reach that state. `await Future.delayed(Duration.zero)` deserves a second look: even though this particular event handler is synchronous (no `await` inside it), `emit()` inside a BLoC's event handler is still dispatched through the event loop's microtask queue, not applied instantly — a `Duration.zero` delay is enough to let pending microtasks flush before you inspect `emitted`. This is the exact event-loop mechanism from [Week 1b's challenges](../Phase_1_Dart_and_Foundations/Week_01b_Dart_Coding_Challenges.md) showing up in a testing context.

</details>

---

## Bonus Round — Mix It Up

Different formats, same topic. See [the full challenge-type roster](../00_CHALLENGE_TYPES.md) for what each icon means.

---

### 🐛 Bug Hunt — The Test That Fails for the Wrong Reason

```dart
testWidgets('tapping Login navigates to Home', (tester) async {
  await tester.pumpWidget(const MyApp());
  await tester.tap(find.text('Login'));
  expect(find.text('Welcome Home'), findsOneWidget);
});
```

This test fails. The developer who wrote it is confused — they tapped through the app manually and login navigation works perfectly. Before assuming the *feature* is broken, what should they check about the *test* first?

<details><summary>Diagnosis & Fix</summary>

🔴 **Explanation:** there's no `pump()` or `pumpAndSettle()` call after `tester.tap(...)` — the tap is registered, but **no frame is ever triggered to actually process its consequences**. Navigation transitions, `setState` calls, and any async work triggered by the tap all need at least one more frame (often several, for an animated page transition) to actually run and settle. Without pumping, `find.text('Welcome Home')` runs its check against the tree exactly as it stood the instant *before* the tap's effects had any chance to happen — the test isn't lying about the feature being broken, it's asking the wrong question at the wrong moment. The fix:

```dart
await tester.tap(find.text('Login'));
await tester.pumpAndSettle(); // let the navigation transition (and any async work) finish
expect(find.text('Welcome Home'), findsOneWidget);
```

The general lesson, worth internalizing before it costs debugging time on a real feature: **a failing widget test after an interaction is not automatically proof the feature is broken — check that you actually pumped a frame before concluding that.** This is precisely why [this week's core content](Week_24_Testing.md) treats `pump`/`pumpAndSettle` as foundational rather than boilerplate to memorize and forget.

</details>

---

### 🎭 Two Truths and a Lie — Mocks, Fakes, and BLoC Testing

**A.** `tester.pumpAndSettle()` will hang (loop until it hits an internal iteration limit and throws) if the widget under test contains an infinitely-repeating animation that never settles.

**B.** A `Mock` and a `Fake` are interchangeable terms for the same concept — any test double that isn't the real production implementation.

**C.** `blocTest`'s `seed:` parameter lets a test start the BLoC from a specific state directly, rather than needing to first replay whatever events would normally produce that state.

<details><summary>Which one's the lie</summary>

**B is the lie**, and getting this distinction right is genuinely worth the effort — a **Mock** is a test double you make *assertions about the interactions with* (`verify(mockRepo.deleteExpense(any)).called(1)` — did this specific call happen?), while a **Fake** is a lightweight but *genuinely working* alternative implementation (an in-memory `List`-backed repository, exactly like [Week 21's `InMemoryExpenseRepository`](../Phase_5_Advanced_Patterns/Week_21b_Clean_Architecture_Challenges.md#-boss-battle--swap-the-backend-without-touching-the-usecase)) that you use *as* the dependency, not just observe. Reaching for a heavyweight mocking framework when a 10-line Fake would do is a common over-engineering habit worth noticing in yourself.

🔴 **Explanation:** A and C are both true. A is why [this week's core content](Week_24_Testing.md) warns against blindly calling `pumpAndSettle()` on every screen — a looping "loading" spinner or a continuously-repeating animation genuinely never "settles," and `pumpAndSettle` will eventually throw a timeout-style error rather than hang forever, but the fix (use `pump(duration)` with an explicit time instead) requires knowing this failure mode exists.

</details>

---

### 👹 Boss Battle — Full-Stack Test for a Delete-With-Confirmation Flow

**The spec:** write a complete test suite (not just one test) for this feature: tapping a delete icon shows a confirmation dialog; confirming calls `repository.deleteExpense(id)` and removes the item from the displayed list; cancelling closes the dialog and leaves everything untouched. Cover it at **three** levels: (1) a `blocTest` verifying the BLoC emits the right states when a delete-confirmed event fires, (2) a widget test verifying the dialog actually appears on tap and disappears correctly on cancel, (3) one test proving the item is genuinely gone from the rendered list after a confirmed delete — not just that some state field changed.

<details><summary>One reasonable solution (structure — abbreviated bodies)</summary>

```dart
// 1. blocTest — the state machine, in isolation
blocTest<ExpenseBloc, ExpenseState>(
  'emits state without the deleted expense when DeleteConfirmed fires',
  build: () {
    when(mockRepo.deleteExpense('1')).thenAnswer((_) async => Right(unit));
    return ExpenseBloc(repository: mockRepo)..add(LoadExpenses());
  },
  seed: () => ExpenseLoaded(expenses: [expenseA, expenseB]), // start already-loaded
  act: (bloc) => bloc.add(const DeleteConfirmed(id: '1')),
  expect: () => [
    ExpenseLoaded(expenses: [expenseB]), // expenseA (id: '1') is gone
  ],
);

// 2. Widget test — the dialog itself, independent of real deletion logic
testWidgets('tapping delete icon shows confirmation dialog', (tester) async {
  await tester.pumpWidget(makeTestableWidget(const ExpenseCard(expense: expenseA)));
  await tester.tap(find.byIcon(Icons.delete));
  await tester.pumpAndSettle();
  expect(find.text('Delete this expense?'), findsOneWidget);

  await tester.tap(find.text('Cancel'));
  await tester.pumpAndSettle();
  expect(find.text('Delete this expense?'), findsNothing); // dialog closed
});

// 3. Integration-style widget test — the actual end-to-end user-visible outcome
testWidgets('confirming delete removes the item from the visible list', (tester) async {
  await tester.pumpWidget(makeTestableWidgetWithBloc(mockBlocSeededWith([expenseA, expenseB])));
  expect(find.text(expenseA.title), findsOneWidget);

  await tester.tap(find.byIcon(Icons.delete).first);
  await tester.pumpAndSettle();
  await tester.tap(find.text('Confirm'));
  await tester.pumpAndSettle();

  expect(find.text(expenseA.title), findsNothing); // genuinely gone from the RENDERED tree
});
```

🔴 **Explanation:** the three levels intentionally test **different things**, not the same thing three times — test 1 proves the state-machine logic is correct in complete isolation (using `seed:` from the Two Truths section above to skip straight to a loaded state, and a mock repository since this test cares about *interaction verification*: was `deleteExpense` called correctly). Test 2 proves the dialog UI itself behaves correctly, independent of whether deletion actually works underneath. Test 3 is the one that actually matters most to a real user and is the easiest to skip if you're not deliberate about it — it proves the **rendered widget tree** genuinely no longer shows the deleted item, which is a meaningfully stronger claim than "the state object's `expenses` list no longer contains it" (a bug in how that state gets turned into widgets could still leave the item visually present even with correct underlying state).

</details>

---

**Next → [Week 25: Performance & Profiling](Week_25_Performance_and_Profiling.md) · [Performance Challenges](Week_25b_Performance_Challenges.md)**
