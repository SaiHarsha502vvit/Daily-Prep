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

## Bonus Round — Mix It Up

Different formats, same topic. See [the full challenge-type roster](../00_CHALLENGE_TYPES.md) for what each icon means.

---

### 🐛 Bug Hunt — The Search That Fetches for Every Keystroke

```dart
final searchQueryProvider = StateProvider<String>((ref) => '');

final searchResultsProvider = FutureProvider<List<String>>((ref) async {
  final query = ref.watch(searchQueryProvider);
  debugPrint('Fetching results for "$query"');
  await Future.delayed(const Duration(milliseconds: 500));
  return ['Result for $query 1', 'Result for $query 2'];
});

class SearchField extends ConsumerWidget {
  const SearchField({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return TextField(
      onChanged: (value) => ref.read(searchQueryProvider.notifier).state = value,
      decoration: const InputDecoration(labelText: 'Search'),
    );
  }
}
```

Typing "flutter" (7 keystrokes) into the search field. Predict how many "Fetching results..." lines print, and for which partial queries, before checking.

<details><summary>Diagnosis & Fix</summary>

All 7 keystrokes ("f", "fl", "flu", "flut", "flutt", "flutte", "flutter") each trigger a separate fetch — 7 network calls for one search intent, most of them for queries the user never actually wanted results for.

🔴 **Explanation:** `searchResultsProvider` does `ref.watch(searchQueryProvider)` — meaning it re-runs its entire body every time `searchQueryProvider`'s value changes, and every keystroke changes it. This is the Riverpod-flavored version of the exact race/waste problem from [Week 8's async validation Bug Hunt](../Phase_2_Core_UI/Week_08b_Forms_Challenges.md#w8-3-hard--debounced-async-validation-and-the-race-condition-it-can-hide) — but here Riverpod's `family` + a manual debounce-via-`Timer` inside the provider, or (cleaner) debouncing at the `onChanged` call site before it ever touches `searchQueryProvider`, both work:

```dart
// Debounce at the source — only update the provider after the user pauses:
Timer? _debounce;
onChanged: (value) {
  _debounce?.cancel();
  _debounce = Timer(const Duration(milliseconds: 400), () {
    ref.read(searchQueryProvider.notifier).state = value;
  });
},
```

This way, `searchQueryProvider` (and therefore `searchResultsProvider`, which watches it) only updates once per pause in typing, not once per keystroke — the same [T4-1 debounce mechanism](../Phase_1_Dart_and_Foundations/Week_01b_Dart_Coding_Challenges.md#t4-1-medium--debounce-a-stream-the-search-bar-pattern) from Week 1, applied at the `TextField` callback instead of a raw `Stream`.

</details>

---

### ⚡ Speed Round — 5 Questions, 2 Minutes

1. Can you call `ref.watch()` on a provider from inside another provider's body (not from a widget)?
2. Does `ProviderScope` need to wrap your entire `MaterialApp`, or just the parts that use Riverpod?
3. If two completely unrelated `Provider`s (no `ref.watch` connection between them) both exist in the same `ProviderContainer`, does updating one ever cause the other to recompute?
4. Does `ref.invalidate(someProvider)` immediately re-run the provider synchronously, or just mark it for the next read?
5. Can a `FutureProvider` be `.autoDispose` and `.family` at the same time?

<details><summary>Answers</summary>

1. **Yes** — this is exactly how `cartTotalProvider` watching `cartItemsProvider` worked in [Week 13's core content](Week_13_Riverpod.md); providers can depend on other providers, forming a dependency graph, not just a flat list.
2. **Needs to wrap the whole app** in virtually all real setups — `ProviderScope` creates the single `ProviderContainer` instance that every `ref.watch`/`ref.read` call anywhere in the tree resolves against; wrapping only part of the tree means widgets outside it have no container to find.
3. **No** — completely independent providers with no `ref.watch` link between them never trigger each other; the dependency graph is explicit, not "everything in the same container might affect everything else."
4. **Marks it for invalidation** — the actual re-computation happens the next time something reads it (lazily), not immediately and synchronously at the moment `invalidate` is called.
5. **Yes** — `FutureProvider.autoDispose.family<T, Arg>(...)` is a completely standard combination; each distinct argument gets its own independently-cached, independently-auto-disposed entry, same mechanism as [W13-2](#w13-2-medium--family-provider-identity-prove-the-caching) but with disposal added on top.

</details>

---

### 👹 Boss Battle — Search With Debounce, Cancellation, and Loading States

**The spec:** combine everything from this week and the Bug Hunt above into one real search feature: a search field that (1) debounces input by 400ms before triggering a fetch, (2) shows a loading spinner only while actually fetching (not during the debounce wait itself — those are different states a user should be able to tell apart), (3) if the user types a new query while a fetch is still in flight, the stale in-flight result must never overwrite the newer query's eventual result, (4) uses `.autoDispose` so leaving the search screen cleans everything up.

<details><summary>One reasonable solution</summary>

```dart
final searchQueryProvider = StateProvider.autoDispose<String>((ref) => '');

final searchResultsProvider = FutureProvider.autoDispose<List<String>>((ref) async {
  final query = ref.watch(searchQueryProvider);
  if (query.isEmpty) return [];

  // ref.onDispose fires if a NEWER provider invocation supersedes this one —
  // Riverpod cancels the old Future's relevance automatically when the
  // watched dependency changes again before this one resolves.
  await Future.delayed(const Duration(milliseconds: 500)); // simulated network call
  return ['Result for "$query" #1', 'Result for "$query" #2'];
});

class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({super.key});
  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  Timer? _debounce;

  void _onChanged(String value) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 400), () {
      ref.read(searchQueryProvider.notifier).state = value;
    });
  }

  @override
  Widget build(BuildContext context) {
    final results = ref.watch(searchResultsProvider);
    return Column(
      children: [
        TextField(onChanged: _onChanged),
        results.when(
          data: (list) => Expanded(child: ListView(children: list.map(Text.new).toList())),
          loading: () => const CircularProgressIndicator(),
          error: (e, st) => Text('Error: $e'),
        ),
      ],
    );
  }

  @override
  void dispose() {
    _debounce?.cancel();
    super.dispose();
  }
}
```

🔴 **Explanation:** requirement (2)'s subtlety — the debounce `Timer` lives entirely **outside** Riverpod, in the widget's own `State`, and `searchQueryProvider` (and therefore the loading spinner tied to `searchResultsProvider`) only changes *after* the debounce settles. During the 400ms debounce wait itself, nothing is loading yet from Riverpod's perspective — a more polished version would show a distinct "typing..." indicator during the debounce window, separate from the `AsyncValue.loading()` state, precisely because they're different moments in the pipeline. Requirement (3) — stale results never winning — comes largely for free from `FutureProvider`'s own dependency-tracking: when `searchQueryProvider` changes again before the previous `searchResultsProvider` future resolves, Riverpod's internal provider-element lifecycle treats the old computation as superseded, and only the latest one's result is ever exposed through `ref.watch` — the same request-generation-counter idea from [Week 8's fix](../Phase_2_Core_UI/Week_08b_Forms_Challenges.md#w8-3-hard--debounced-async-validation-and-the-race-condition-it-can-hide), but handled by the framework instead of hand-rolled.

</details>

---

**Next → [Week 14: HTTP & REST APIs](Week_14_HTTP_and_REST_APIs.md) · [HTTP Challenges](Week_14b_HTTP_Challenges.md)**
