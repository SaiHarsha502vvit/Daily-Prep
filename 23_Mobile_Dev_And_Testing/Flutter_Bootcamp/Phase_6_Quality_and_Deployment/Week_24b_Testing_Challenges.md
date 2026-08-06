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

**Next → [Week 25: Performance & Profiling](Week_25_Performance_and_Profiling.md) · [Performance Challenges](Week_25b_Performance_Challenges.md)**
