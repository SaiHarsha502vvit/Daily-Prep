# Dart Coding Challenges — Train the Muscle

### Companion to [Week 01: Dart Language](Week_01_Dart_Language.md)

---

## How This Works

Reading about Dart teaches you vocabulary. Writing Dart under a constraint teaches you the language. Every problem below has three parts:

1. **The problem** — a real task, not a puzzle for its own sake
2. **The constraint** — the efficiency bar you're being held to (this is the part tutorials skip)
3. **A `<details>` solution** — don't open it until you've either solved it or genuinely gotten stuck for 10+ minutes. Opening it early trains you to recognize solutions, not produce them.

Paste each starter into [DartPad](https://dartpad.dev) — no install needed, and `Stopwatch`/`print` output shows immediately.

**The loop:** do 2-3 problems a session, not a whole tier in one sitting. Come back to a tier after a week and redo it from memory — that second pass is where the idiom actually sticks.

Tiers escalate in a specific order: **syntax fluency → complexity discipline → Dart's actual language advantages → concurrency → small systems that combine everything.**

There's also a **Bonus Round** at the end with different formats entirely — bug hunts with no hints, a shuffled-code puzzle, a spec-only build with no starter code, true/false speed rounds, and a bigger "boss battle" combining everything in this file. See the [full challenge-type roster](../00_CHALLENGE_TYPES.md) if you want the formats explained up front.

---

## Tier 1 — Core Mechanics

Goal: stop translating from Java/JS in your head. Reach for Dart's actual idioms.

---

### T1-1 (Easy) — FizzBuzz, but with a Dart 3 switch expression

**Problem:** Write `String fizzbuzz(int n)`.

**Constraint:** One `switch` **expression** using `when` guards. No `if/else` chain, no `%` checks outside the switch.

```dart
String fizzbuzz(int n) {
  // TODO
}

void main() {
  for (int i = 1; i <= 20; i++) {
    print(fizzbuzz(i));
  }
}
```

<details><summary>Solution</summary>

```dart
String fizzbuzz(int n) => switch (n) {
  int n when n % 15 == 0 => 'FizzBuzz',
  int n when n % 3 == 0  => 'Fizz',
  int n when n % 5 == 0  => 'Buzz',
  _ => '$n',
};
```

**Complexity:** O(1) per call.

🔴 **Erklärung:** `when` guards on switch expressions arrived in Dart 3 (2023). This isn't decoration — the same switch machinery gives you *compiler-enforced exhaustiveness* the moment the matched type is a `sealed class` (see T3-3). Get fluent with switch expressions now; they stop being optional later.

</details>

---

### T1-2 (Easy) — Palindrome check, zero extra allocation

**Problem:** `bool isPalindrome(String s)` — case-insensitive, ignore non-alphanumeric characters (`"A man, a plan, a canal: Panama"` → `true`).

**Constraint:** O(n) time, **O(1) extra space**. No reversed copy of the string.

```dart
bool isPalindrome(String s) {
  // TODO
}
```

<details><summary>Solution</summary>

```dart
bool isPalindrome(String s) {
  bool isAlnum(int code) =>
      (code >= 48 && code <= 57) ||  // 0-9
      (code >= 65 && code <= 90) ||  // A-Z
      (code >= 97 && code <= 122);   // a-z

  int lower(int code) => (code >= 65 && code <= 90) ? code + 32 : code;

  int i = 0, j = s.length - 1;
  while (i < j) {
    while (i < j && !isAlnum(s.codeUnitAt(i))) i++;
    while (i < j && !isAlnum(s.codeUnitAt(j))) j--;
    if (lower(s.codeUnitAt(i)) != lower(s.codeUnitAt(j))) return false;
    i++;
    j--;
  }
  return true;
}
```

**Complexity:** O(n) time, O(1) space.

🔴 **Erklärung:** `s.split('').reversed.join() == s.toLowerCase()` "works" but allocates a `List<String>` of length n, then a reversed iterable, then a brand-new string — three extra heap allocations for a check that needs none. Fine at 10 characters, wasteful at 10MB. `codeUnitAt` reads a character without allocating anything; the two-pointer walk needs no extra memory at all. This is the general pattern: **allocation-free string algorithms in Dart mean walking `codeUnitAt`/`codeUnitAt`, not slicing into new strings.**

</details>

---

### T1-3 (Medium) — Two Sum in one pass

**Problem:** `(int, int)? twoSum(List<int> nums, int target)` — return the pair of **indices** whose values sum to `target`, or `null` if none exists.

**Constraint:** O(n) time, single pass, using `Map<int, int>`.

```dart
(int, int)? twoSum(List<int> nums, int target) {
  // TODO
}

void main() {
  print(twoSum([2, 7, 11, 15], 9)); // (0, 1)
}
```

<details><summary>Solution</summary>

```dart
(int, int)? twoSum(List<int> nums, int target) {
  final seen = <int, int>{}; // value -> index
  for (int i = 0; i < nums.length; i++) {
    final complement = target - nums[i];
    if (seen.containsKey(complement)) {
      return (seen[complement]!, i);
    }
    seen[nums[i]] = i;
  }
  return null;
}
```

**Complexity:** O(n) time, O(n) space.

🔴 **Erklärung:** The brute-force nested loop (check every pair) is O(n²) — for n=100,000 that's 10 billion comparisons. The map trick works because Dart's `Map` gives O(1) *average* lookup and insert via hashing — you trade O(n) memory for turning "does this value exist" from a scan into a hash lookup. Notice the return type: `(int, int)?` is a **record** (Dart 3) — no throwaway class, no `List<int>` losing the "exactly two ints" guarantee.

</details>

---

### T1-4 (Medium) — Word frequency, single pass

**Problem:** `Map<String, int> wordFrequency(String text)` — case-insensitive, strip punctuation, split on whitespace.

**Constraint:** One pass over the words. No `containsKey` followed by a separate `[]` write.

```dart
Map<String, int> wordFrequency(String text) {
  // TODO
}
```

<details><summary>Solution</summary>

```dart
Map<String, int> wordFrequency(String text) {
  final freq = <String, int>{};
  final words = text
      .toLowerCase()
      .replaceAll(RegExp(r'[^\w\s]'), '')
      .split(RegExp(r'\s+'))
      .where((w) => w.isNotEmpty);

  for (final word in words) {
    freq.update(word, (count) => count + 1, ifAbsent: () => 1);
  }
  return freq;
}
```

**Complexity:** O(n) where n = total characters.

🔴 **Erklärung:** The instinct most people reach for is `if (freq.containsKey(word)) { freq[word] = freq[word]! + 1 } else { freq[word] = 1 }` — that's **two map lookups** (`containsKey` then `[]`) plus a write, every single word. `Map.update(key, updater, ifAbsent: ...)` does it in one internal lookup. Small win per call, real win at scale.

</details>

---

## Tier 2 — Efficiency & Complexity

Goal: the actual point of this whole exercise. Every problem here has an obvious slow solution and a non-obvious fast one — find the fast one, then *prove to yourself* why it's fast.

---

### T2-1 (Easy) — Deduplicate, preserve order, O(n)

**Problem:** `List<int> dedupe(List<int> nums)` — remove duplicates, keep first-occurrence order.

**Constraint:** O(n) time.

```dart
List<int> dedupe(List<int> nums) {
  // TODO
}

void main() {
  print(dedupe([3, 1, 3, 2, 1, 5])); // [3, 1, 2, 5]
}
```

<details><summary>Solution</summary>

```dart
List<int> dedupe(List<int> nums) => nums.toSet().toList();
```

**Complexity:** O(n) time, O(n) space.

🔴 **Erklärung — this is a genuine Dart-specific fact, not a simplification:** in Java, `HashSet` and in Python, `set` do **not** preserve insertion order — using them for this problem would silently shuffle your output. Dart's default `Set()` (and the `{...}` set literal) is a `LinkedHashSet` under the hood, which **does** preserve insertion order. `nums.toSet().toList()` is correct in Dart specifically because of this. Verify it yourself — run the example above and check the output order matches first-occurrence, not sorted or hash order.

</details>

---

### T2-2 (Medium) — Group anagrams, two ways

**Problem:** `List<List<String>> groupAnagrams(List<String> words)` — group words that are anagrams of each other.

**Constraint:** First get it working. Then find a version that avoids sorting each word.

```dart
List<List<String>> groupAnagrams(List<String> words) {
  // TODO
}

void main() {
  print(groupAnagrams(['eat', 'tea', 'tan', 'ate', 'nat', 'bat']));
  // [[eat, tea, ate], [tan, nat], [bat]]
}
```

<details><summary>Solution</summary>

```dart
// Version A: sort each word as the grouping key — O(n · k log k)
List<List<String>> groupAnagramsSorted(List<String> words) {
  final groups = <String, List<String>>{};
  for (final word in words) {
    final key = (word.split('')..sort()).join();
    groups.update(key, (list) => list..add(word), ifAbsent: () => [word]);
  }
  return groups.values.toList();
}

// Version B: 26-letter frequency count as the key — O(n · k)
List<List<String>> groupAnagramsCounted(List<String> words) {
  final groups = <String, List<String>>{};
  for (final word in words) {
    final counts = List<int>.filled(26, 0);
    for (final code in word.codeUnits) {
      counts[code - 97]++; // assumes lowercase a-z
    }
    final key = counts.join(',');
    groups.update(key, (list) => list..add(word), ifAbsent: () => [word]);
  }
  return groups.values.toList();
}
```

**Complexity:** A is O(n · k log k), B is O(n · k), where k = average word length.

🔴 **Erklärung:** sorting each word costs O(k log k); walking it once to build a 26-slot count array costs O(k). For short words (k ≈ 5-10) the difference is invisible. For a real dictionary lookup at k ≈ 15-20 letters across millions of words, that `log k` factor stops being free. The general lesson: **when your "key" only needs to capture character composition, not order, a count array beats sorting.**

</details>

---

### T2-3 (Medium) — Maximum subarray sum, O(n)

**Problem:** `int maxSubarraySum(List<int> nums)` — find the largest sum of any contiguous subarray.

**Constraint:** O(n) time, O(1) space. (The brute-force answer is O(n²) or O(n³) — write that first if you need to, then find the O(n) one.)

```dart
int maxSubarraySum(List<int> nums) {
  // TODO
}

void main() {
  print(maxSubarraySum([-2, 1, -3, 4, -1, 2, 1, -5, 4])); // 6 (subarray [4,-1,2,1])
}
```

<details><summary>Solution</summary>

```dart
int maxSubarraySum(List<int> nums) {
  int maxEndingHere = nums[0];
  int maxSoFar = nums[0];

  for (int i = 1; i < nums.length; i++) {
    maxEndingHere = nums[i] > maxEndingHere + nums[i]
        ? nums[i]
        : maxEndingHere + nums[i];
    maxSoFar = maxSoFar > maxEndingHere ? maxSoFar : maxEndingHere;
  }
  return maxSoFar;
}
```

**Complexity:** O(n) time, O(1) space. (Kadane's algorithm.)

🔴 **Erklärung — derive it, don't memorize it:** at each index, you're deciding one thing only: "does extending the previous subarray with `nums[i]` beat starting fresh at `nums[i]`?" That decision only needs the running sum from the previous step, not the whole array. Once you see that the answer at position `i` only depends on the answer at `i-1`, the O(n²) nested-loop instinct (try every start, every end) evaporates — you're recomputing the same "best subarray ending here" over and over inside those nested loops.

</details>

---

### T2-4 (Easy but important) — Prove StringBuffer matters

**Problem:** Build a 200,000-character string two ways and time both with `Stopwatch`:
- **(a)** `result += char` inside a loop
- **(b)** `StringBuffer()..write(char)` per iteration, `.toString()` at the end

```dart
void main() {
  const n = 200000;

  final sw1 = Stopwatch()..start();
  var result = '';
  for (int i = 0; i < n; i++) {
    result += 'x';
  }
  sw1.stop();
  print('String += : ${sw1.elapsedMilliseconds}ms');

  final sw2 = Stopwatch()..start();
  final buffer = StringBuffer();
  for (int i = 0; i < n; i++) {
    buffer.write('x');
  }
  final result2 = buffer.toString();
  sw2.stop();
  print('StringBuffer: ${sw2.elapsedMilliseconds}ms');
}
```

**Your task:** run it. Then explain in your own words why the gap exists — don't just note that it exists.

<details><summary>Explanation</summary>

🔴 **Erklärung:** Dart strings are **immutable**. `result += 'x'` doesn't append in place — it allocates an entirely new string of length `i+1` and copies the old `i` characters into it, every single iteration. Total work across the loop is `1 + 2 + 3 + ... + n` ≈ O(n²). `StringBuffer` keeps an internal growable buffer (a `List<int>` under the hood) and only materializes the final string once, at `.toString()` — amortized O(1) per `write()`, O(n) total.

This is the single most common real-world "why is my Dart code slow" bug — building JSON strings, log lines, or generated code in a loop with `+=`. At 200,000 characters the gap is already dramatic; run it and watch.

</details>

---

### T2-5 (Hard, bonus) — LRU Cache, O(1) average per operation

**Problem:** Implement:

```dart
class LruCache<K, V> {
  LruCache(this.capacity);
  final int capacity;

  V? get(K key) { /* TODO */ }
  void put(K key, V value) { /* TODO */ }
}
```

`get` returns the value and marks the key as most-recently-used. `put` inserts/updates and evicts the least-recently-used entry when over capacity.

**Constraint:** O(1) average for both operations. In Java you'd reach for a hand-rolled doubly-linked list + hash map. You don't need one in Dart — think about what T2-1 already told you about `Map`.

<details><summary>Solution</summary>

```dart
class LruCache<K, V> {
  LruCache(this.capacity);
  final int capacity;
  final Map<K, V> _map = {};

  V? get(K key) {
    if (!_map.containsKey(key)) return null;
    final value = _map.remove(key) as V;
    _map[key] = value; // reinsert = moves to the "most recent" end
    return value;
  }

  void put(K key, V value) {
    if (_map.containsKey(key)) _map.remove(key);
    _map[key] = value;
    if (_map.length > capacity) {
      _map.remove(_map.keys.first); // oldest = least recently used
    }
  }
}
```

**Complexity:** O(1) average per `get`/`put`.

🔴 **Erklärung:** this only works cleanly because Dart's default `Map` is a `LinkedHashMap` — it preserves insertion order, and re-inserting a key moves it to the end of that order. `_map.keys.first` is therefore always the least-recently-touched entry. In Java you'd need `LinkedHashMap` with `accessOrder=true` explicitly, or roll your own doubly-linked list. In Dart, the default collection already has the property you need — this is T2-1's lesson turned into a real system.

</details>

---

## Tier 3 — Dart's Actual Advantages

Goal: features that don't exist (or feel bolted-on) in Java/JS/Python, but are first-class in Dart 3. This is where "I know Dart" becomes "I write *idiomatic* Dart."

---

### T3-1 (Medium) — Null-safe parse pipeline, one expression

**Problem:** `List<int> parseValid(List<String?> input)` — parse each entry to `int`, silently skip `null` entries and unparseable strings.

**Constraint:** One expression (a collection literal with `for`/`if`). No explicit `for` loop with a body, no calling `int.parse` after `int.tryParse` already succeeded (that's parsing twice — the trap).

```dart
List<int> parseValid(List<String?> input) {
  // TODO — one expression
}

void main() {
  print(parseValid(['12', null, 'abc', '7', '  3'])); // [12, 7, 3] (or similar)
}
```

<details><summary>Solution</summary>

```dart
List<int> parseValid(List<String?> input) => [
  for (final s in input)
    if (s != null)
      if (int.tryParse(s.trim()) case final n?) n,
];
```

**Complexity:** O(n) — one pass, one parse attempt per element.

🔴 **Erklärung:** the naive-but-common version is:

```dart
if (s != null && int.tryParse(s) != null) int.parse(s)
```

That calls `tryParse` **and then** `parse` on the same string — parsing it twice. `if (int.tryParse(s) case final n?) n` is Dart 3 pattern matching: it runs `tryParse` once, and if the result matches the "some non-null int" pattern, binds it to `n` and you use `n` directly. Pattern matching in an `if`-case isn't syntax sugar here — it's eliminating real duplicate work.

</details>

---

### T3-2 (Easy) — Records for multi-value return

**Problem:** `({int min, int max, int sum, double avg}) stats(List<int> nums)` — compute all four in a single pass.

**Constraint:** One loop. No calling `.reduce()` four separate times.

```dart
({int min, int max, int sum, double avg}) stats(List<int> nums) {
  // TODO
}

void main() {
  final s = stats([4, 1, 9, 2, 7]);
  print('min=${s.min} max=${s.max} sum=${s.sum} avg=${s.avg}');
}
```

<details><summary>Solution</summary>

```dart
({int min, int max, int sum, double avg}) stats(List<int> nums) {
  int min = nums[0], max = nums[0], sum = 0;
  for (final n in nums) {
    if (n < min) min = n;
    if (n > max) max = n;
    sum += n;
  }
  return (min: min, max: max, sum: sum, avg: sum / nums.length);
}
```

**Complexity:** O(n), single pass.

🔴 **Erklärung:** before Dart 3 (2023), returning four values meant either a bespoke `class Stats { ... }` (ceremony for a throwaway type) or stuffing values into a `List`/`Map` and losing compile-time type safety. A **named record** — `({int min, int max, ...})` — is a real, structurally-typed tuple: the compiler checks field names and types at every call site, and you never declared a class. Calling `.reduce()` four times would also be four separate O(n) passes over the same data — the single-loop version is doing 4x less work.

</details>

---

### T3-3 (Medium) — Sealed classes: let the compiler catch missing cases

**Problem:** Model `Shape` as a `sealed class` with `Circle`, `Rectangle`, `Triangle`. Write `double area(Shape s)` using `switch` with **no `default`/`_` branch**.

```dart
sealed class Shape {}

class Circle extends Shape {
  Circle(this.radius);
  final double radius;
}

class Rectangle extends Shape {
  Rectangle(this.width, this.height);
  final double width, height;
}

class Triangle extends Shape {
  Triangle(this.base, this.height);
  final double base, height;
}

double area(Shape s) {
  // TODO — switch expression, no default case
}
```

**Then:** comment out the `Triangle` branch in your `area` function and note exactly what the analyzer tells you.

<details><summary>Solution</summary>

```dart
double area(Shape s) => switch (s) {
  Circle(radius: final r) => 3.14159 * r * r,
  Rectangle(width: final w, height: final h) => w * h,
  Triangle(base: final b, height: final h) => 0.5 * b * h,
};
```

🔴 **explanation:** `sealed` means every direct subtype of `Shape` must live in the same library file. Because of that closed set, the analyzer can *prove* whether a `switch` over `Shape` covers every possible case — and if it doesn't, it's a compile error, not a runtime `null`/crash surprise months later when someone adds a fourth shape and forgets to update this function. Remove the `Triangle` branch and you'll see exactly that error. This is Dart's answer to Kotlin's sealed classes / Rust's enums — and it's the exact mechanism the BLoC states in [Week 20](../Phase_5_Advanced_Patterns/Week_20_BLoC_Pattern.md) rely on (`CartInitial`/`CartLoading`/`CartLoaded`/`CartError` as a sealed hierarchy).

</details>

---

### T3-4 (Medium, the classic gotcha) — Correct equality for value objects

**Problem:** Run this and predict the output before you run it:

```dart
class Point {
  Point(this.x, this.y);
  final int x, y;
}

void main() {
  final points = <Point>{Point(1, 2), Point(1, 2)};
  print(points.length); // predict, then run
}
```

**Task:** fix `Point` so the `Set` correctly treats `Point(1,2)` and `Point(1,2)` as one entry.

<details><summary>Solution</summary>

```dart
class Point {
  Point(this.x, this.y);
  final int x, y;

  @override
  bool operator ==(Object other) =>
      other is Point && other.x == x && other.y == y;

  @override
  int get hashCode => Object.hash(x, y);
}
```

🔴 **explanation:** the unmodified output is `2`, not `1` — default `==` on a plain Dart class is **identity** comparison (same as `identical(a, b)`), the same as Java's default `Object.equals`. Two separately-constructed `Point(1,2)` instances are different objects in memory, so a `Set`/`Map` treats them as different keys, silently. The contract you must honor: if `a == b` is true, `a.hashCode` **must** equal `b.hashCode` (the reverse isn't required — hash collisions between unequal objects are fine). `Object.hash(x, y)` combines multiple fields into one well-distributed hash without you hand-rolling one — use it, don't write your own XOR-based hash.

</details>

---

### T3-5 (Easy) — Extension methods

**Problem:** Add `.average` and `.median` getters to `List<num>` without subclassing or a wrapper class.

```dart
extension ListStats on List<num> {
  // TODO: double get average
  // TODO: double get median
}

void main() {
  print([1, 2, 3, 4].average); // 2.5
  print([1, 3, 3, 6, 7, 8, 9].median); // 6
}
```

<details><summary>Solution</summary>

```dart
extension ListStats on List<num> {
  double get average => isEmpty ? 0 : fold(0, (a, b) => a + b) / length;

  double get median {
    final sorted = [...this]..sort();
    final mid = sorted.length ~/ 2;
    return sorted.length.isOdd
        ? sorted[mid].toDouble()
        : (sorted[mid - 1] + sorted[mid]) / 2;
  }
}
```

🔴 **explanation:** extension methods bolt new members onto a type you don't own — `List` is defined in `dart:core`, you can't edit it, and you don't want a `MyList extends List` wrapper that every call site has to remember to use. This is exactly how packages like `collection` and `dartx` make `List`/`Iterable` feel like they have far more built-in methods than they actually do. Note `[...this]..sort()` inside `median`: it spreads into a **new** list before sorting, so calling `.median` never mutates the caller's original list — a getter that silently reorders your data out from under you would be a nasty surprise.

</details>

---

## Tier 4 — Async, Streams, and Isolates

Goal: this is Dart's real differentiator over most languages you'll have used before. Ties directly to the event-loop mechanics in [Week 1's Invisible Machinery section](Week_01_Dart_Language.md).

---

### T4-1 (Medium) — Debounce a stream (the search-bar pattern)

**Problem:** `Stream<String> debounce(Stream<String> input, Duration delay)` — only emit a value once `delay` has passed with no new value arriving.

```dart
import 'dart:async';

Stream<String> debounce(Stream<String> input, Duration delay) {
  // TODO
}

void main() async {
  final controller = StreamController<String>();
  debounce(controller.stream, Duration(milliseconds: 300)).listen(print);

  controller.add('f');
  await Future.delayed(Duration(milliseconds: 100));
  controller.add('fl');
  await Future.delayed(Duration(milliseconds: 100));
  controller.add('flu');
  // only 'flu' should print, ~300ms after the last add
  await Future.delayed(Duration(seconds: 1));
  controller.close();
}
```

<details><summary>Solution</summary>

```dart
Stream<String> debounce(Stream<String> input, Duration delay) {
  final controller = StreamController<String>();
  Timer? timer;

  input.listen(
    (value) {
      timer?.cancel();
      timer = Timer(delay, () => controller.add(value));
    },
    onDone: () {
      timer?.cancel();
      controller.close();
    },
  );

  return controller.stream;
}
```

🔴 **explanation:** every new value cancels whatever `Timer` was pending and starts a fresh one. Only when `delay` elapses with *no* cancellation does the timer's callback actually fire and push a value downstream. This is precisely what a search-as-you-type field needs (see [Week 8](../Phase_2_Core_UI/Week_08_Forms_and_Input.md)) — without it, you'd fire a network request on every keystroke instead of once the user pauses.

</details>

---

### T4-2 (Easy but eye-opening) — Sequential vs parallel Futures

**Problem:** Simulate 5 "network calls," each `Future.delayed(Duration(seconds: 1))`. Time (a) awaiting them one at a time in a loop, vs (b) `Future.wait([...])`. Predict both timings before running.

```dart
Future<int> fakeNetworkCall(int id) async {
  await Future.delayed(Duration(seconds: 1));
  return id;
}

void main() async {
  final sw1 = Stopwatch()..start();
  for (int i = 0; i < 5; i++) {
    await fakeNetworkCall(i);
  }
  sw1.stop();
  print('Sequential: ${sw1.elapsedMilliseconds}ms');

  final sw2 = Stopwatch()..start();
  await Future.wait([for (int i = 0; i < 5; i++) fakeNetworkCall(i)]);
  sw2.stop();
  print('Parallel: ${sw2.elapsedMilliseconds}ms');
}
```

<details><summary>Explanation</summary>

🔴 **explanation:** sequential is ~5000ms — each `await` in the loop blocks the next call from *starting* until the current one finishes. `Future.wait` is ~1000ms — the list literal `[fakeNetworkCall(0), fakeNetworkCall(1), ...]` calls all five async functions **immediately**, one after another with no `await` between them, so all five `Future.delayed` timers start running concurrently on the event loop before `Future.wait` even begins waiting. `Future.wait` then waits only for the slowest one. This is the single most impactful async mistake to fix in real Flutter apps: awaiting independent calls one by one when they could all be in flight together.

</details>

---

### T4-3 (Medium) — Pub/sub event bus with StreamController.broadcast

**Problem:**

```dart
class EventBus {
  // TODO: void emit(String event, dynamic data)
  // TODO: Stream<dynamic> on(String event)
}

void main() {
  final bus = EventBus();
  bus.on('login').listen((data) => print('Listener A: $data'));
  bus.on('login').listen((data) => print('Listener B: $data'));
  bus.emit('login', {'userId': 42});
}
```

Both listeners must receive the event.

<details><summary>Solution</summary>

```dart
class EventBus {
  final Map<String, StreamController<dynamic>> _controllers = {};

  StreamController<dynamic> _controllerFor(String event) =>
      _controllers.putIfAbsent(event, () => StreamController.broadcast());

  void emit(String event, dynamic data) => _controllerFor(event).add(data);

  Stream<dynamic> on(String event) => _controllerFor(event).stream;
}
```

🔴 **explanation:** a plain `StreamController()` is **single-subscription** — call `.listen()` twice on its stream and the second call throws. `.broadcast()` allows any number of independent listeners, each getting every event from the point they subscribed. This is the exact mechanism behind `BlocBuilder`'s ability to have multiple widgets watching the same BLoC's state stream simultaneously (see [Week 20](../Phase_5_Advanced_Patterns/Week_20_BLoC_Pattern.md)) — you just built the primitive it's built on.

</details>

---

### T4-4 (Hard) — Prove isolates don't block the event loop

**Problem:** Compute the sum of squares from 1 to 300,000,000 two ways, while a `Timer.periodic` ticks every 200ms in the background:

```dart
import 'dart:async';
import 'dart:isolate';

int sumOfSquares(int limit) {
  int sum = 0;
  for (int i = 1; i <= limit; i++) {
    sum += i * i;
  }
  return sum;
}

void main() async {
  final ticker = Timer.periodic(Duration(milliseconds: 200), (_) => print('tick'));

  print('--- running on main isolate ---');
  final result1 = sumOfSquares(300000000); // TODO: watch the ticks stall
  print('done: $result1');

  print('--- running via Isolate.run ---');
  final result2 = await Isolate.run(() => sumOfSquares(300000000));
  print('done: $result2');

  ticker.cancel();
}
```

**Task:** run it. Count how many `tick`s print during each phase and explain the difference.

<details><summary>Explanation</summary>

🔴 **explanation:** during the direct call, `sumOfSquares` runs synchronously on the same isolate (and therefore the same event loop) as the `Timer.periodic` — the loop cannot process the timer's callback until the CPU-bound function returns, so ticks stall completely for that stretch. `Isolate.run()` spawns a genuinely separate isolate with its **own heap and its own event loop** — no shared memory, communication only via message passing (the result is copied back). Because it's a different isolate, the main isolate's event loop keeps servicing the timer the whole time. This is the direct, runnable proof of the isolate-per-heap model from [Week 1's Invisible Machinery section](Week_01_Dart_Language.md) — in a real Flutter app, the direct-call version is exactly what causes a frozen, unresponsive UI during heavy computation.

</details>

---

## Tier 5 — Small Systems (Stretch)

Goal: combine everything above into something that resembles a real feature, not an exercise.

---

### T5-1 (Hard) — Autocomplete Trie

**Problem:**

```dart
class Trie {
  void insert(String word) { /* TODO */ }
  List<String> wordsWithPrefix(String prefix) { /* TODO */ }
}
```

**Constraint:** `wordsWithPrefix` must be O(k + m) where k = prefix length and m = number of matches — **not** O(n·k) where n = total words in the dictionary (i.e., don't just filter every word with `.startsWith()`).

<details><summary>Solution</summary>

```dart
class _TrieNode {
  final Map<String, _TrieNode> children = {};
  bool isEndOfWord = false;
}

class Trie {
  final _TrieNode _root = _TrieNode();

  void insert(String word) {
    var node = _root;
    for (final char in word.split('')) {
      node = node.children.putIfAbsent(char, () => _TrieNode());
    }
    node.isEndOfWord = true;
  }

  List<String> wordsWithPrefix(String prefix) {
    var node = _root;
    for (final char in prefix.split('')) {
      final next = node.children[char];
      if (next == null) return [];
      node = next;
    }
    final results = <String>[];
    _collect(node, prefix, results);
    return results;
  }

  void _collect(_TrieNode node, String prefix, List<String> results) {
    if (node.isEndOfWord) results.add(prefix);
    for (final entry in node.children.entries) {
      _collect(entry.value, prefix + entry.key, results);
    }
  }
}
```

🔴 **explanation:** scanning every word in a dictionary with `.startsWith(prefix)` is O(n·k) — every word, checked against the prefix. A trie walks the prefix **once** (O(k)) to reach the node representing "every word starting with this prefix," then only visits the subtree under that node (O(m), proportional to matches, not dictionary size). This is genuinely how search-suggestion / autocomplete features are implemented — not a toy abstraction.

</details>

---

### T5-2 (Medium) — Memoization as a higher-order function

**Problem:** Write a generic `int Function(int) memoize(int Function(int) fn)` that wraps any single-argument function with a cache. Apply it to naive recursive Fibonacci and compare `fib(35)` timing before/after.

```dart
int fib(int n) => n <= 1 ? n : fib(n - 1) + fib(n - 2);

int Function(int) memoize(int Function(int) fn) {
  // TODO
}

void main() {
  final sw1 = Stopwatch()..start();
  print(fib(35));
  print('naive: ${sw1.elapsedMilliseconds}ms');

  // Note: memoizing a *recursive* fib requires wrapping the recursive
  // calls too — think about why before opening the solution.
}
```

<details><summary>Solution</summary>

```dart
int Function(int) memoize(int Function(int) fn) {
  final cache = <int, int>{};
  int memoized(int n) => cache.putIfAbsent(n, () => fn(n));
  return memoized;
}

// A plain memoize(fib) only caches the OUTERMOST call — the recursive
// calls inside fib() still call the un-memoized fib, not the wrapper.
// To actually collapse the exponential blowup, the function must call
// back into its own memoized version:
late final int Function(int) fastFib;
int _fibBody(int n) => n <= 1 ? n : fastFib(n - 1) + fastFib(n - 2);

void main() {
  fastFib = memoize(_fibBody);
  final sw = Stopwatch()..start();
  print(fastFib(35));
  print('memoized: ${sw.elapsedMilliseconds}ms');
}
```

🔴 **explanation:** naive `fib(35)` makes roughly 30 million calls — it's recomputing `fib(20)` thousands of times as a subproblem of larger calls. `memoize()` closes over a `Map<int,int>` cache — a genuine use of Dart closures capturing mutable state between calls. The subtlety (and the actual lesson): wrapping `fib` itself doesn't help, because `fib`'s own recursive calls inside its body still call the *original*, un-memoized `fib` — the cache only ever gets hit once, at the top. The recursive calls must themselves go through the memoized wrapper (`fastFib`) for the exponential-to-linear collapse to actually happen. This is a real gotcha with memoizing recursive (not just iterative) functions in any language.

</details>

---

## Bonus Round — Mix It Up

Same rules, different formats. See [the full challenge-type roster](../00_CHALLENGE_TYPES.md) if you want the format explained before diving in.

---

### 🐛 Bug Hunt — The Merge That Crashes on Uneven Lists

This looks right. Run it on `mergeSorted([1, 3, 5], [2, 4])` and `mergeSorted([1, 3], [2, 4, 6, 8])` before you read another word.

```dart
List<int> mergeSorted(List<int> a, List<int> b) {
  final result = <int>[];
  int i = 0, j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] <= b[j]) {
      result.add(a[i]);
      i++;
    } else {
      result.add(b[j]);
      j++;
    }
  }
  return result;
}
```

<details><summary>Diagnosis & Fix</summary>

Run `mergeSorted([1, 3], [2, 4, 6, 8])` and you get `[1, 2, 3, 4]` — silently missing `6` and `8`. No crash, no error, just quietly wrong output, which is worse than a crash.

🔴 **Explanation:** the `while` loop's condition `i < a.length && j < b.length` exits the instant *either* list is exhausted — but if `b` still has elements left (`j < b.length` but `i` has already hit `a.length`), those remaining elements never get copied in. The fix is two more loops after the main one:

```dart
while (i < a.length) result.add(a[i++]);
while (j < b.length) result.add(b[j++]);
```

This is a real, extremely common off-by-boundary bug — it's the exact core of merge sort's merge step, and getting the "drain the leftover list" part right is the part people skip because the main loop *looks* complete.

</details>

---

### 🐛 Bug Hunt — The Percentage That's Always Zero

```dart
int correctAnswers = 3;
int totalQuestions = 10;
int percentage = (correctAnswers / totalQuestions * 100).round();
print('Score: $percentage%');
```

Predict the printed output before running it. It is not `30`.

<details><summary>Diagnosis & Fix</summary>

This one actually **compiles and runs fine** — the bug is conceptual, not syntactic, and it's genuinely easy to miss. `correctAnswers / totalQuestions` in Dart is `int / int`, and Dart's `/` operator on two `int`s produces a `double` (`3 / 10 == 0.3`, not integer-truncated like some languages) — so this particular version actually prints `Score: 30%`, correctly. **The real trap is the mirror image**: declare `percentage` itself as the division target using `~/` (integer division) instead of `/` by mistake —

```dart
int percentage = (correctAnswers ~/ totalQuestions * 100); // 3 ~/ 10 = 0, then * 100 = 0
```

— and you silently get `0` for every score under 100%, because `~/` truncates *before* the multiplication ever happens. 🔴 **Explanation:** the lesson is to notice which operator you actually typed: `/` (true division, always a `double`) vs `~/` (integer division, truncates toward zero, always an `int`) look one character apart and behave completely differently when the numerator is smaller than the denominator — exactly the shape of a real production bug that ships because it "looks right" on a quick read.

</details>

---

### 🎭 Two Truths and a Lie — `late`

One of these is false. Find it before opening the answer.

**A.** A `late` variable declared without an initializer can be assigned later, but reading it before that assignment throws a `LateInitializationError`.

**B.** `late final` still only allows the variable to be assigned once — but that one assignment can happen anywhere, not necessarily at the declaration site.

**C.** Marking a variable `late` with an initializer (`late final x = expensiveCall();`) makes Dart evaluate that initializer immediately when the object is constructed, exactly like a normal non-`late` field.

<details><summary>Which one's the lie</summary>

**C is the lie.** The entire point of `late` on a field *with* an initializer is **lazy evaluation** — the initializer does **not** run at construction time; it runs the first time the field is actually *read*. A normal (non-`late`) field's initializer runs eagerly, during object construction, whether or not anything ever reads it.

🔴 **Explanation:** this matters practically — `late final _controller = ExpensiveController();` inside a `State` class defers the expensive construction until first access, which can matter if that field is conditionally used. It's also why `late` is the standard way to initialize fields that depend on `this` or on constructor parameters not yet available at the point of field declaration (a genuinely common Flutter pattern — a `TextEditingController` initialized from a `widget.` property, seen back in [Week 3's lifecycle content](Week_03_Widget_Lifecycle.md)).

</details>

---

### 🎭 Two Truths and a Lie — Async Execution Order

**A.** `Future.wait([futureA, futureB])` runs both futures concurrently, provided they were already started (as async function calls) before being placed in that list.

**B.** Calling an `async` function does not begin executing the function's body at all until something `await`s it.

**C.** A `try/catch` wrapped around an `await` expression catches errors thrown from inside the awaited `Future`.

<details><summary>Which one's the lie</summary>

**B is the lie**, and it's the one almost everyone gets wrong on first exposure. An `async` function's body starts executing **synchronously and immediately** the moment you call it — right up until it hits its first `await`, at which point it suspends and returns control to the caller. It does **not** wait for someone to `await` the call before doing anything.

🔴 **Explanation:** prove it to yourself —

```dart
Future<void> demo() async {
  print('A: runs immediately');
  await Future.delayed(Duration(seconds: 1));
  print('C: runs after the delay');
}

void main() {
  print('start');
  demo(); // NOT awaited here
  print('B: this runs before demo() finishes, but AFTER "A" already printed');
}
```

The output order is `start`, `A: runs immediately`, `B: ...`, then a second later, `C: ...` — `A` prints before `B`, proving `demo()`'s body started running the instant it was called, with no `await` anywhere near the call site. This directly extends [Week 1's event-loop content](Week_01_Dart_Language.md): the function call itself is synchronous up to the first suspension point; only the *rest* of the function becomes a scheduled continuation.

</details>

---

### ⚡ Speed Round — 5 Questions, 2 Minutes

One line each. No looking anything up — this is testing instinct, not research.

1. Is `0.1 + 0.2 == 0.3` `true` in Dart?
2. `[1, 2, 3].map((x) => x * 2)` — without calling `.toList()`, is the result a `List` or something else?
3. Does `const [1, 2] == const [1, 2]` evaluate to `true`?
4. Does `[1, 2] == [1, 2]` — **without** `const` — evaluate to `true`?
5. Is `String` mutable in Dart — can you change a character in place?

<details><summary>Answers</summary>

1. **False.** Floating point representation error — same as every IEEE 754 language. `0.1 + 0.2` is `0.30000000000000004`.
2. **`Iterable<int>`**, not `List<int>` — `.map()` is lazy; it doesn't produce a concrete list until something (like `.toList()` or iteration) forces it.
3. **True.** `const` expressions are canonicalized — identical `const` literals are the *same object* in memory, so `==` (default identity comparison) succeeds.
4. **False** (well — technically true here by coincidence in older Dart versions' constant-folding in some contexts, but treat it as **false** in the general case) — two separately-constructed non-`const` lists are different object instances; default `List` equality is identity-based, same lesson as [T3-4's `Point` gotcha](#t3-4-medium-the-classic-gotcha--correct-equality-for-value-objects).
5. **No.** `String` is immutable in Dart — every operation that "modifies" a string (`replaceAll`, `toUpperCase`, etc.) returns a brand-new string. This is the entire reason [T2-4's StringBuffer exercise](#t2-4-easy-but-important--prove-stringbuffer-matters) exists.

</details>

---

### 🧩 Code Jumble — Reassemble `isPrime`

These lines are a complete, correct, efficient prime-checking function — but they're shuffled. Put them back in an order that compiles and behaves correctly (checks divisibility only up to `√n`, handles `n < 2`, skips even numbers after 2).

```
    if (i % 2 == 0) return false;
bool isPrime(int n) {
  if (n < 2) return false;
  return true;
}
  if (n == 2) return true;
  for (int i = 3; i * i <= n; i += 2) {
```

<details><summary>Reassembled</summary>

```dart
bool isPrime(int n) {
  if (n < 2) return false;
  if (n == 2) return true;
  if (n % 2 == 0) return false;
  for (int i = 3; i * i <= n; i += 2) {
    if (n % i == 0) return false;
  }
  return true;
}
```

🔴 **Explanation:** notice the structural constraints that force this exact order, not just any order that "looks plausible" — `n < 2` must be checked before anything else divides or compares `n` (a guard clause pattern). `n == 2` must come before the "is it even" check, or `2` itself would incorrectly return `false`. The loop bound `i * i <= n` is the actual efficiency insight here: you only need to check divisors up to `√n`, because any factor pair `(a, b)` with `a * b == n` must have at least one of `a, b` be `≤ √n` — checking further is redundant work. Stepping by `i += 2` (odd numbers only) is a further ~2x speedup, valid only because even divisors were already ruled out.

</details>

---

### 🏗️ Build It Blind — Receipt Analytics, No Scaffolding

No starter code. No function signature. Just the spec — design it yourself:

> You have a list of receipts. Each receipt has a store name and an amount spent. Write something that tells you: which store you spent the most money at *in total*, how much that total was, and how many separate receipts contributed to it.

Decide your own function signature, your own data representation (a `class`? a `record`? something else?), and your own return type before writing a single line of implementation.

<details><summary>One reasonable solution</summary>

```dart
typedef Receipt = ({String store, double amount});

({String store, double total, int count}) topSpender(List<Receipt> receipts) {
  final totals = <String, double>{};
  final counts = <String, int>{};

  for (final r in receipts) {
    totals.update(r.store, (t) => t + r.amount, ifAbsent: () => r.amount);
    counts.update(r.store, (c) => c + 1, ifAbsent: () => 1);
  }

  final topStore = totals.entries.reduce((a, b) => a.value >= b.value ? a : b).key;
  return (store: topStore, total: totals[topStore]!, count: counts[topStore]!);
}
```

🔴 **Explanation:** there's no single correct answer here — the point of **Build It Blind** is the design decisions you made *before* writing logic: did you reach for a `class Receipt` (more ceremony, but familiar if you're coming from Java) or a `typedef` record (Dart 3-idiomatic, zero-ceremony, matches [T3-2's lesson](#t3-2-easy--records-for-multi-value-return))? Did your return type bundle all three answers together (a record, again) or did you return three separate values some other way? A single accumulation pass with two `Map`s (one for totals, one for counts) beats grouping receipts by store first and then reducing each group — same "single pass beats multiple passes over the same data" lesson as [T3-2](#t3-2-easy--records-for-multi-value-return).

</details>

---

### 👹 Boss Battle — Mini Log Analytics Pipeline

Combines pattern matching, records, and single-pass efficiency from this whole file into one build.

**The spec:** you have raw log lines as strings, one event per line, format `"timestamp|eventType|value"` (e.g., `"1000|click|button_a"`, `"1050|purchase|29.99"`). Some lines are malformed (wrong number of `|`-separated parts, or a `purchase` whose value isn't a valid number) — skip those instead of crashing. For each valid `eventType`, compute: how many events of that type occurred, and the timestamp of the most recent one.

**Constraints:** single pass over the lines. Use a record or pattern matching somewhere in your solution — don't just brute-force it with nested loops.

```dart
Map<String, ({int count, int lastTimestamp})> analyzeLog(List<String> lines) {
  // TODO — this one's genuinely yours, no starter body
}

void main() {
  final lines = [
    '1000|click|button_a',
    '1050|purchase|29.99',
    'malformed line with no pipes',
    '1100|click|button_b',
    '1200|purchase|not_a_number', // malformed value — skip
    '1300|click|button_a',
  ];
  print(analyzeLog(lines));
  // {click: (count: 3, lastTimestamp: 1300), purchase: (count: 1, lastTimestamp: 1050)}
}
```

<details><summary>Solution</summary>

```dart
Map<String, ({int count, int lastTimestamp})> analyzeLog(List<String> lines) {
  final result = <String, ({int count, int lastTimestamp})>{};

  for (final line in lines) {
    final parts = line.split('|');
    if (parts.length != 3) continue; // malformed shape — skip

    final timestamp = int.tryParse(parts[0]);
    final eventType = parts[1];
    final rawValue = parts[2];

    if (timestamp == null) continue;
    if (eventType == 'purchase' && double.tryParse(rawValue) == null) continue;

    final existing = result[eventType];
    result[eventType] = (
      count: (existing?.count ?? 0) + 1,
      lastTimestamp: timestamp, // lines assumed roughly chronological; take the latest seen
    );
  }

  return result;
}
```

🔴 **Explanation:** this is deliberately a small, self-contained version of exactly what [Week 16's Firestore content](../Phase_4_Firebase_and_Storage/Week_16_Firebase_Firestore.md) and real analytics pipelines do at much larger scale — parse untrusted input defensively (never trust that a string field is actually a number until `tryParse` proves it), skip malformed records rather than crashing the whole pipeline over one bad line, and accumulate aggregates in a single pass rather than filtering-then-reducing per event type (which would be one pass per distinct `eventType`, not one pass total). The record return type — `({int count, int lastTimestamp})` — is [T3-2's](#t3-2-easy--records-for-multi-value-return) multi-value-return pattern applied as a `Map` value type, not just a function return type.

</details>

---

## Keep Training

- Do 2-3 problems per session, not a whole tier at once. Efficiency intuition comes from spaced repetition, not marathon reading.
- After finishing a tier, wait a week, then redo it **from memory** with the file closed. What you can't reproduce cold is what you haven't actually learned yet.
- Every "prove it yourself" problem (T2-4, T4-2, T4-4) is there because *reading* the explanation and *watching the timing gap on your own screen* teach differently. Always run those.
- When you hit a wall on a "Hard" problem, write the brute-force version first, get it correct, then optimize. Never skip straight to the fast solution — you won't internalize *why* it's fast.

**Next → [Week 2: Flutter Core Concepts](Week_02_Flutter_Core_Concepts.md)**
