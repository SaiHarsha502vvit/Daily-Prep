# Async Patterns Challenges

### Companion to [DOC_06: Async Patterns Complete](DOC_06_Async_Patterns_Complete.md)

---

## How This Works

The Bug Hunt below targets this doc's own `Debounce` extension pattern — a real, subtle bug hiding in shared state, not a synthetic example. Mixed formats — see [the full challenge-type roster](../00_CHALLENGE_TYPES.md) for what each icon means.

---

### 🐛 Bug Hunt — Two Search Bars, One Shared Debounce Timer

This doc's own `Debounce` extension:

```dart
extension Debounce on Function {
  static final Map<Function, Timer> _timers = {};

  void call(Duration delay) {
    _timers[this]?.cancel();
    _timers[this] = Timer(delay, () {
      this();
      _timers.remove(this);
    });
  }
}
```

An app has **two** independent search screens — a product search and a contacts search — both using this exact pattern, both active at once (one in a bottom sheet over the other, say). Both call `_search.call(const Duration(milliseconds: 300))` on every keystroke, where `_search` is each screen's own bound instance method. A user types quickly in the product search, then immediately switches focus and types in the contacts search. Under what circumstance could one screen's debounce timer get cancelled by typing in the *other* screen — and does that actually happen here, or not?

<details><summary>Diagnosis & Fix</summary>

🔴 **Explanation:** `_timers` is declared `static` — there is exactly **one** `_timers` map shared across every single usage of this extension in the entire app, for the whole lifetime of the program, not one map per widget or per screen. The key is the `Function` value itself (`this` inside the extension method) — so whether two screens' debounce timers can collide depends entirely on whether their two `_search` values are considered the "same" `Function` by `Map` lookup. If each screen's `_search` is a genuinely distinct bound method on a distinct `State` object (the normal case — `_search` bound to `_ProductSearchState` vs `_search` bound to `_ContactsSearchState` are different closures over different instances), they hash and compare as different keys, and this specific scenario is actually safe. The **real** danger surfaces in a different, easy-to-hit case: two instances of the **same reusable widget** (say, a generic `SearchField` widget used in both places, where `_search` is a *static or top-level* function, or a tear-off that happens to compare equal across instances) — there, both screens' calls key into the *same* map slot, and the second screen's keystroke cancels the first screen's pending timer, silently dropping its search. Even in the safer case, this pattern is fragile: it depends on an implicit assumption (distinct bound methods hash distinctly) that isn't guaranteed by the extension's own design — nothing about `extension Debounce on Function` scopes state per-instance, it just happens to often work out. The fix removes the ambiguity entirely by making debounce state explicitly per-owner instead of implicitly keyed by function identity:

```dart
class Debouncer {
  Debouncer(this.delay);
  final Duration delay;
  Timer? _timer;

  void call(void Function() action) {
    _timer?.cancel();
    _timer = Timer(delay, action);
  }

  void dispose() => _timer?.cancel();
}

// Each screen owns its OWN Debouncer instance — no shared global Map, no key-collision risk at all:
class _ProductSearchState extends State<ProductSearch> {
  final _debouncer = Debouncer(const Duration(milliseconds: 300));

  void _onChanged(String query) {
    _debouncer.call(() => _search(query));
  }

  @override
  void dispose() {
    _debouncer.dispose(); // matching Week 3's resource-cleanup discipline
    super.dispose();
  }
}
```

The lesson generalizes past this one extension: **`static` mutable state inside a utility that's meant to be used by many independent call sites is a real hazard** — it silently couples things that should be independent, and the coupling is invisible until two of those call sites happen to be active at the same time with colliding keys.

</details>

---

### 🎭 Two Truths and a Lie — Microtask vs Event Queue

**A.** `Future.value(42).then((v) => print(v))` schedules its callback on the **microtask queue**, which always fully drains before the event loop processes the next event-queue item (a `Timer`, an I/O completion).

**B.** `Timer(Duration.zero, () => print('timer'))` and `scheduleMicrotask(() => print('microtask'))`, called in that order, print in the same order they were scheduled — "timer" first, then "microtask" — because `Duration.zero` means "run immediately."

**C.** Because `await` internally uses the microtask queue for continuation, a `for` loop containing several `await` points can still let the event loop process a pending `Timer` or UI frame *between* iterations, not just at the very end.

<details><summary>Which one's the lie</summary>

**B is the lie**, and it's a genuinely common misconception — `Duration.zero` does **not** mean "run synchronously right now"; a `Timer`, even a zero-duration one, is always scheduled on the **event queue**, which per this doc's own event-loop diagram sits at *lower* priority than the microtask queue. `scheduleMicrotask`, called after the timer is scheduled, still goes onto the higher-priority microtask queue — and since Dart fully drains the microtask queue before touching the next event-queue item, "microtask" prints **first**, then "timer" — the reverse of what B claims, regardless of the fact that the timer's delay was zero.

🔴 **Explanation:** A is true and is precisely the mechanism this doc's own diagram encodes — microtasks (which is where every `Future.then`/`await` continuation lands) are drained to empty before the event loop even looks at the event queue, which is why chaining several `.then()` calls or several `await`s in sequence can run to completion without ever yielding to a pending `Timer` or an incoming UI event in between, *unless* something in that chain itself awaits something that lands on the event queue (a real `Future.delayed`, an I/O completion). C is also true, and is the flip side of that same nuance — each `await` genuinely does return control to the event loop at that point, so a `Timer` or frame callback queued elsewhere gets a chance to run between loop iterations, which is exactly why `await`-heavy code doesn't freeze the UI, per this doc's own stated conclusion.

</details>

---

### 🧩 Code Jumble — Reassemble the Loading-State Pattern

This doc's own loading-state handler, correct and complete, but shuffled. Reassemble it — pay attention to which `mounted` checks belong in `catch` vs `finally`, and why both need one independently.

```
  Future<void> _loadItems() async {
    } on AppException catch (e) {
      if (!mounted) return;
      setState(() => _errorMessage = _formatError(e));
    try {
    } finally {
      if (mounted) setState(() => _isLoading = false);
      if (!mounted) return;
      final items = await _repository.getItems();
    setState(() {
      setState(() => _items = items);
      _isLoading = true;
      _errorMessage = null;
    });
    }
```

<details><summary>Reassembled</summary>

```dart
Future<void> _loadItems() async {
  setState(() {
    _isLoading = true;
    _errorMessage = null;
  });

  try {
    final items = await _repository.getItems();
    if (!mounted) return;
    setState(() => _items = items);
  } on AppException catch (e) {
    if (!mounted) return;
    setState(() => _errorMessage = _formatError(e));
  } finally {
    if (mounted) setState(() => _isLoading = false);
  }
}
```

🔴 **Explanation:** the ordering constraints that pin this down — the very first `setState` (loading=true) must happen **before** the `try` block, since it's not itself doing anything awaitable that could fail. Both branches inside `try`/`catch` need their **own** `mounted` guard because each one follows its own independent `await`/exception path, and the widget could have been disposed during either. The `finally` block's `mounted` check looks almost identical to the others but is subtly different in form — `if (mounted) setState(...)` rather than `if (!mounted) return; setState(...)` — because a bare `return` inside `finally` would be unusual/confusing control flow (returning from inside a finally block that's supposed to run regardless of outcome), so it's written as a positive guard instead. This three-mounted-checks structure is genuinely how much defensive plumbing a *correct* async loading pattern needs — noticing that all three exist independently, not just one shared check up top, is the actual point of reassembling this by hand rather than skimming it.

</details>

---

### 👹 Boss Battle — Debounce, Properly Scoped, With Cancellation on Dispose

**The spec:** using the fixed `Debouncer` class from this file's own Bug Hunt, build a live search field that: (1) debounces by 300ms, (2) if the widget is disposed while a debounce timer is still pending, the timer never fires at all (not just "doesn't crash" — genuinely never calls the search function after disposal), (3) rapid typing followed by a pause results in **exactly one** search call, for the final query only — not one call per keystroke, not zero calls.

<details><summary>One reasonable solution</summary>

```dart
class LiveSearchField extends StatefulWidget {
  const LiveSearchField({super.key, required this.onSearch});
  final ValueChanged<String> onSearch;
  @override
  State<LiveSearchField> createState() => _LiveSearchFieldState();
}

class _LiveSearchFieldState extends State<LiveSearchField> {
  final _debouncer = Debouncer(const Duration(milliseconds: 300));

  void _onChanged(String query) {
    _debouncer.call(() => widget.onSearch(query));
  }

  @override
  Widget build(BuildContext context) {
    return TextField(onChanged: _onChanged);
  }

  @override
  void dispose() {
    _debouncer.dispose(); // cancels any pending Timer — onSearch never fires after this
    super.dispose();
  }
}
```

🔴 **Explanation:** requirement (2) is entirely `_debouncer.dispose()`'s job — because `Debouncer` owns its own private `Timer?` field (rather than the original extension's shared static `Map`), cancelling it is a direct, unambiguous operation with no risk of accidentally cancelling some *other* widget's unrelated timer, which was the exact failure mode this file's Bug Hunt uncovered in the original shared-`Map` version. Requirement (3) works because `_debouncer.call(action)` always cancels whatever timer was previously pending before scheduling the new one — the same "last keystroke wins" mechanism as [Week 1's original debounce challenge](../Phase_1_Dart_and_Foundations/Week_01b_Dart_Coding_Challenges.md#t4-1-medium--debounce-a-stream-the-search-bar-pattern), now expressed as a small reusable class instead of a raw `StreamController` — two different implementations of the identical underlying idea, worth recognizing as the same pattern wearing different clothes.

</details>

---

**Reference library complete.** Every deep-dive doc now has a challenge companion — six files, six different angles on "does this doc's content survive contact with a real, slightly-off scenario." Come back to these the same way you'd come back to the docs themselves: not top-to-bottom, but whenever something in a real project isn't behaving the way you expected.
