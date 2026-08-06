# Riverpod Challenges

### Companion to [Week 13: Riverpod](Week_13_Riverpod.md)

---

## How This Works

A fetch-counter incremented inside a provider body is your main instrument here — it turns "is this provider re-fetching or reusing a cached value" from a guess into a printed number. Paste starters into [DartPad](https://dartpad.dev) (add `flutter_riverpod` — DartPad supports package imports).

---

### W13-1 (Easy) — `ref.watch` vs `ref.read`, same rebuild-scope lesson as Week 12

**Problem:** build a counter with `NotifierProvider`, and prove — same as [Week 12's `context.watch`/`context.read` challenge](Week_12b_State_Management_Challenges.md), but Riverpod's version of it — that using `ref.watch` inside a button callback is wrong for the same underlying reason.

```dart
class Counter extends Notifier<int> {
  @override
  int build() => 0;
  void increment() => state++;
}

final counterProvider = NotifierProvider<Counter, int>(Counter.new);

class CounterScreen extends ConsumerWidget {
  const CounterScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final count = ref.watch(counterProvider);
    debugPrint('CounterScreen rebuilt — count=$count');
    return Scaffold(
      body: Center(child: Text('$count')),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          // TODO: which is correct here, ref.watch or ref.read?
          ref.read(counterProvider.notifier).increment();
        },
      ),
    );
  }
}
```

**Task:** the callback already uses `ref.read` — good. Now deliberately change it to `ref.watch(counterProvider.notifier).increment()` inside `onPressed` and see what actually happens (Riverpod's failure mode here is different from Provider's — it may not throw the way `context.watch` in a callback does). Explain, in your own words, why `ref.read` is still the semantically correct choice even if `ref.watch` doesn't immediately crash.

<details><summary>Explanation</summary>

🔴 **Explanation:** unlike `context.watch` (which requires an active build phase and throws outside one), `ref.watch` called inside a callback in some Riverpod versions won't necessarily throw — but it's still wrong, because `watch` means "subscribe to future changes," and a one-shot button press has no ongoing subscription to maintain. Calling it there either does nothing useful (the subscription is immediately meaningless once the callback returns) or, in some cases, produces subtle rebuild-scheduling bugs. `ref.read` is the semantically honest choice: "give me the current value/notifier right now, I'm not asking to be told about future changes." The rule from [Week 13](Week_13_Riverpod.md): **`watch` belongs in `build()`, `read` belongs in callbacks** — same rule as Provider, expressed with different method names.

</details>

---

### W13-2 (Medium) — `family` provider identity: prove the caching

**Problem:** a `family` provider fetching a user by ID. Prove, with a fetch counter, that calling `ref.watch(userProvider('1'))` from two *different* widgets only fetches once — and that `userProvider('2')` is a completely separate cache entry.

```dart
int fetchCount = 0;

final userProvider = FutureProvider.family<String, String>((ref, userId) async {
  fetchCount++;
  debugPrint('Fetching user $userId (fetch #$fetchCount total)');
  await Future.delayed(const Duration(milliseconds: 300));
  return 'User #$userId';
});

class WidgetA extends ConsumerWidget {
  const WidgetA({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(userProvider('1'));
    return Text('A: ${user.value ?? "loading"}');
  }
}

class WidgetB extends ConsumerWidget {
  const WidgetB({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(userProvider('1')); // SAME id as WidgetA
    return Text('B: ${user.value ?? "loading"}');
  }
}

class WidgetC extends ConsumerWidget {
  const WidgetC({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(userProvider('2')); // DIFFERENT id
    return Text('C: ${user.value ?? "loading"}');
  }
}
```

**Task:** mount `WidgetA`, `WidgetB`, and `WidgetC` all at once in a `Column`. Predict how many total "Fetching user..." lines print, and for which IDs, before you run it.

<details><summary>Answer & Explanation</summary>

Exactly **2** fetches print: one for `'1'` (shared by both `WidgetA` and `WidgetB`), one for `'2'` (only `WidgetC`) — never 3.

🔴 **Explanation:** this is [Week 13's Invisible Machinery](Week_13_Riverpod.md) `family` mechanism directly proven — internally, the `ProviderContainer` keys its cache by the **pair** `(userProvider, argument)`, not by which widget is asking. `WidgetA` and `WidgetB` both calling `ref.watch(userProvider('1'))` resolve to the exact same cache entry — the second call finds an existing `ProviderElement` and returns its (possibly still-loading) value rather than re-running the provider function. `userProvider('2')` has a different argument, so it's a genuinely separate cache entry with its own fetch. This is real, practical caching — not a simplification for the exercise.

</details>

---

### W13-3 (Medium) — `autoDispose` and the grace period

**Problem:** an `autoDispose` provider with a print on disposal, hosted behind a toggle so you can mount/unmount it.

```dart
final dataProvider = FutureProvider.autoDispose<String>((ref) async {
  debugPrint('Provider created / fetching...');
  ref.onDispose(() => debugPrint('Provider disposed'));
  await Future.delayed(const Duration(seconds: 1));
  return 'data';
});

// Host it behind a toggle:
class Host extends ConsumerStatefulWidget {
  const Host({super.key});
  @override
  ConsumerState<Host> createState() => _HostState();
}

class _HostState extends ConsumerState<Host> {
  bool _show = true;
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(children: [
        if (_show) Consumer(builder: (context, ref, _) {
          final data = ref.watch(dataProvider);
          return Text(data.value ?? 'loading');
        }),
        ElevatedButton(
          onPressed: () => setState(() => _show = !_show),
          child: const Text('Toggle'),
        ),
      ]),
    );
  }
}
```

**Task 1:** toggle off, then immediately toggle back on (within roughly half a second). Does "Provider disposed" print? Does the provider re-fetch, or does it appear to already have the value?

**Task 2:** toggle off, and this time wait 2+ seconds before toggling back on. Does the behavior differ?

<details><summary>Explanation</summary>

Quick toggle off-and-back-on: **no dispose, no re-fetch** — the widget appears to instantly have the value again. Toggle off and wait: "Provider disposed" prints during the wait, and toggling back on triggers a fresh "Provider created / fetching..." with a new 1-second delay.

🔴 **Explanation:** `autoDispose` providers are reference-counted, not disposed the instant their last listener unmounts — there's a brief grace period (effectively, until the end of the current frame/microtask cycle) during which a *new* listener can "claim" the still-alive provider before it's torn down. This exists specifically for navigation transitions: pushing and popping a route often briefly removes and re-adds consumers as part of the transition animation, and without the grace period, a provider would pointlessly dispose and re-fetch on every such transition. Wait long enough, and the grace period genuinely expires — real disposal happens, and the next mount is a true cold start. This is the mechanism from [Week 13's Invisible Machinery](Week_13_Riverpod.md), and the timing threshold is short enough that it's easy to miss unless you deliberately test both a fast and a slow toggle like this.

</details>

---

### W13-4 (Medium) — `AsyncValue.when` exhaustiveness vs `.maybeWhen`'s trap

**Problem:** first, try to compile this:

```dart
Widget build(BuildContext context, WidgetRef ref) {
  final data = ref.watch(dataProvider);
  return data.when(
    data: (value) => Text(value),
    loading: () => const CircularProgressIndicator(),
    // error case commented out on purpose
  );
}
```

**Task 1:** what does the analyzer say? Is this a warning or a hard compile error?

**Task 2:** now "fix" it using `.maybeWhen()` instead, with an `orElse` catch-all:

```dart
return data.maybeWhen(
  data: (value) => Text(value),
  orElse: () => const CircularProgressIndicator(),
);
```

This compiles fine and *looks* like it correctly shows a spinner for both the loading and error states. Explain the real problem with shipping this version to production — what does the user see if the fetch actually fails, versus what they'd see with proper `.when()`?

<details><summary>Answer & Explanation</summary>

Task 1: it's a **hard compile error** — `.when()`'s three parameters (`data`, `loading`, `error`) are all required, not optional.

Task 2: the `.maybeWhen()` version compiles, and a user watching a failed fetch sees a **permanently spinning loading indicator** — indistinguishable from "still loading," when the true state is "this failed and will never complete." There's no error message, no retry button, nothing telling the user (or you, debugging a support ticket) that anything went wrong.

🔴 **Explanation:** this is [Week 13's](Week_13_Riverpod.md) sealed-class design paying off exactly as intended — `AsyncValue<T>` is `sealed`, and `.when()` requires all three cases specifically so the compiler catches "you forgot to handle errors" at build time, the same way `sealed class Shape` catches a forgotten `Triangle` branch in [Week 1b's sealed-class challenge](../Phase_1_Dart_and_Foundations/Week_01b_Dart_Coding_Challenges.md). `.maybeWhen()` exists for genuinely legitimate cases (you only care about one specific state and are fine treating everything else identically) — but reaching for it here to silence the compiler error, rather than because the UI genuinely doesn't need to distinguish loading from error, is trading a caught bug for a silent one.

</details>

---

**Next → [Week 14: HTTP & REST APIs](Week_14_HTTP_and_REST_APIs.md) · [HTTP Challenges](Week_14b_HTTP_Challenges.md)**
