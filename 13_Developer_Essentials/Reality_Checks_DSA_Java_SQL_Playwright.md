# Reality Checks: DSA, Java, SQL, and Playwright

> Every domain has its own set of myths that feel true until you actually understand the mechanism. These are the ones that cause the most bugs, the most wasted time, and the most "why doesn't this work?" moments. No abstraction — full explanation of what actually happens.

---

## Table of Contents

**DSA Reality Checks**
1. [Big O Is Not the Full Story](#1-big-o-is-not-the-full-story)
2. [Arrays vs Linked Lists — The Cache Reality](#2-arrays-vs-linked-lists--the-cache-reality)
3. [HashMap Is NOT O(1) Guaranteed](#3-hashmap-is-not-o1-guaranteed)
4. [Recursion Is Not Inherently Slower Than Iteration](#4-recursion-is-not-inherently-slower-than-iteration)
5. [Sorting Before Searching Is Not Always Faster](#5-sorting-before-searching-is-not-always-faster)
6. [The Stack Overflow That Isn't Stack Overflow](#6-the-stack-overflow-that-isnt-stack-overflow)
7. [Greedy Doesn't Mean "Take the Biggest First"](#7-greedy-doesnt-mean-take-the-biggest-first)
8. [Dynamic Programming Is Not About Memorization Tricks](#8-dynamic-programming-is-not-about-memorization-tricks)

**Java Reality Checks**
9. [== Does Not Compare Values in Java](#9--does-not-compare-values-in-java)
10. [String Concatenation in a Loop Is Secretly O(n²)](#10-string-concatenation-in-a-loop-is-secretly-on)
11. [final Does Not Mean Immutable](#11-final-does-not-mean-immutable)
12. [Java Has Memory Leaks — Garbage Collection Is Not Perfect](#12-java-has-memory-leaks--garbage-collection-is-not-perfect)
13. [Checked Exceptions Are Controversial and Often Misused](#13-checked-exceptions-are-controversial-and-often-misused)
14. [synchronized Doesn't Make Your Code Thread-Safe](#14-synchronized-doesnt-make-your-code-thread-safe)
15. [ArrayList vs LinkedList — LinkedList Almost Never Wins](#15-arraylist-vs-linkedlist--linkedlist-almost-never-wins)
16. [Java Is Not Slow — The JIT Reality](#16-java-is-not-slow--the-jit-reality)
17. [Integer Cache: Why 127 == 127 but 128 != 128](#17-integer-cache-why-127--127-but-128--128)
18. [Interfaces Since Java 8 Are Not "Just Abstract Classes Without Bodies"](#18-interfaces-since-java-8-are-not-just-abstract-classes-without-bodies)

**SQL Reality Checks**
19. [SELECT * Is Not Fine in Production](#19-select--is-not-fine-in-production)
20. [NULL Is Not Zero or Empty — It Is Absence](#20-null-is-not-zero-or-empty--it-is-absence)
21. [Indexes Don't Only Speed Things Up](#21-indexes-dont-only-speed-things-up)
22. [LIKE '%pattern%' Cannot Use an Index](#22-like-pattern-cannot-use-an-index)
23. [COUNT(*) vs COUNT(column) — They Are Different](#23-count-vs-countcolumn--they-are-different)
24. [JOIN Order Matters for Correctness, Not Just Performance](#24-join-order-matters-for-correctness-not-just-performance)
25. [Transactions Are Not Only for Banking](#25-transactions-are-not-only-for-banking)
26. [ORM Does Not Always Generate Good SQL](#26-orm-does-not-always-generate-good-sql)
27. [The N+1 Query Problem — The Most Common ORM Trap](#27-the-n1-query-problem--the-most-common-orm-trap)

**Playwright / Testing Reality Checks**
28. [sleep() in Tests Is a Time Bomb](#28-sleep-in-tests-is-a-time-bomb)
29. [A Test That Passes Locally Can Still Be Wrong](#29-a-test-that-passes-locally-can-still-be-wrong)
30. [Screenshot Assertions Are Not Functional Assertions](#30-screenshot-assertions-are-not-functional-assertions)
31. [Testing Everything Through the UI Is a Trap](#31-testing-everything-through-the-ui-is-a-trap)
32. [Parallel Tests Without Isolated State Will Be Flaky](#32-parallel-tests-without-isolated-state-will-be-flaky)
33. [Locator Strategies: What Makes a Test Brittle vs Stable](#33-locator-strategies-what-makes-a-test-brittle-vs-stable)
34. [Why Tests Pass in CI but Fail in Another Environment](#34-why-tests-pass-in-ci-but-fail-in-another-environment)
35. [Test Coverage Percentage Is a Metric, Not a Goal](#35-test-coverage-percentage-is-a-metric-not-a-goal)

---

# DSA Reality Checks

---

## 1. Big O Is Not the Full Story

### The misconception

"Always use the algorithm with the best Big O complexity." People optimize for O(n log n) over O(n²) regardless of n or constants.

### The reality

Big O notation **hides constant factors and crossover points.**

**Example:** QuickSort average is O(n log n) with a small constant. Insertion sort is O(n²) with an extremely small constant. In practice:
- For n < 16: insertion sort is often **faster** than quicksort because its constant is so small (no recursion overhead, simple inner loop, excellent cache behavior)
- Java's `Arrays.sort()` and Python's `timsort` use **insertion sort** for small sub-arrays within their O(n log n) algorithms. This is not a mistake — it is an optimization.

**The constant factor comes from:**
- Cache efficiency: sequential memory access is 10-100× faster than random access
- Branch prediction: predictable loops run faster than complex branch-heavy code
- Function call overhead: deep recursion has stack frame allocation cost
- Memory allocation: creating objects during algorithm runs is expensive

**Crossover point principle:** For every pair of algorithms where one is O(f(n)) and the other is O(g(n)) with f(n) < g(n) asymptotically, there exists a crossover point N* such that:
- For n < N*: the "worse" algorithm may be faster
- For n > N*: the "better" algorithm wins

**Practical rule:** For n < 100, use the simplest code. For n < 10,000, benchmark before optimizing. Only for n ≥ 10,000 does asymptotic complexity almost always dominate.

**Memory hierarchy matters more than complexity at scale:**

| Access type | Speed | Times slower than L1 |
|-------------|-------|----------------------|
| L1 cache | ~0.5ns | 1× |
| L2 cache | ~5ns | 10× |
| L3 cache | ~30ns | 60× |
| RAM | ~100ns | 200× |
| SSD | ~0.1ms | 200,000× |
| HDD | ~10ms | 20,000,000× |

An O(n) algorithm with poor cache behavior can be slower than an O(n log n) algorithm with excellent cache behavior. Cache-oblivious algorithms and data structures (B-trees, cache-oblivious matrix multiplication) exist specifically to exploit this.

---

## 2. Arrays vs Linked Lists — The Cache Reality

### The misconception

"Linked lists are faster for insertions in the middle — it's O(1) to insert after a node you have, vs O(n) to shift an array."

### The reality

**Technically true asymptotically. Practically false for most real workloads.**

**The cache miss problem with linked lists:**

Each node in a linked list is a separate heap allocation. In memory, nodes are scattered across RAM. Traversing a linked list = pointer chasing = sequential cache misses.

When the CPU accesses `node.next`, it fetches a cache line (64 bytes) from wherever `node` is in RAM. Then `node.next` points somewhere completely different in RAM — another cache miss. And `node.next.next` — another miss.

**Accessing a random element in a linked list of n elements:** O(n) memory accesses, O(n) cache misses.

**Accessing element i in an array:** The array is contiguous. One cache miss loads the surrounding 8-16 elements (they fit in one cache line). Subsequent sequential accesses are free (already cached).

**Benchmark reality (from actual measurements):**

For n = 100,000 elements, iterating through:
- `ArrayList` (contiguous array): ~2ms
- `LinkedList` (pointer-chased nodes): ~30ms
- 15× slower even though both are "O(n)" traversals

For insertion at the middle (the case where linked list should win theoretically):
- `ArrayList` must shift ~50,000 elements: O(n) but all in L1/L2 cache, fast
- `LinkedList` must traverse to the middle: O(n) with cache misses, then O(1) insert
- In practice for n < 1,000,000: ArrayList wins because the CPU can shift cache-resident data faster than LinkedList can traverse scattered pointers

**When LinkedList actually wins:**
- Frequent insertion/removal at HEAD only (stack behavior)
- Very large n with many random middle insertions where traversal is not needed (i.e., you already have the node reference)
- When elements are very large objects (shifting is expensive even in cache)

**The truth about Java's LinkedList:** It is almost never the right choice. Java core library maintainers have discussed deprecating it. Use ArrayDeque instead of LinkedList for queue/deque operations (it beats LinkedList even for queue because of cache efficiency).

---

## 3. HashMap Is NOT O(1) Guaranteed

### The misconception

"HashMap lookup is O(1). Always." Developers assume this and get surprised by performance degradation.

### The reality

**Average case:** O(1). **Worst case:** O(n).

**How a HashMap works:**

```
put("key", value):
  1. Compute hash = "key".hashCode()    ← a function you can override
  2. index = hash % bucketCount         ← which bucket to use
  3. Store in bucket[index]             ← if empty: O(1)
                                        ← if collision: add to chain: O(chain_length)

get("key"):
  1. Compute hash
  2. index = hash % bucketCount
  3. Search bucket[index]               ← if single entry: O(1)
                                        ← if chain: O(chain_length)
```

**Collision:** Two different keys have the same `hash % bucketCount`. They go in the same bucket. Java uses chaining (linked list at each bucket) or tree-ification (Java 8+: switch to red-black tree when chain length > 8).

**Worst case (hash flooding attack):**

If all n keys hash to the same bucket, lookup becomes O(n) per operation. Before Java 8's tree-ification, this was a denial-of-service attack vector against Java web servers: an attacker sends a request with carefully crafted parameter names that all collide in the HashMap, causing O(n²) processing.

Java 8 fixed this by converting long chains to trees (O(log n) worst case). But O(log n) ≠ O(1).

**Load factor and rehashing:**

HashMap maintains a load factor (default 0.75 in Java). When `size / bucketCount > 0.75`, it doubles the bucket count and rehashes all entries. This rehashing is O(n) and happens periodically. Amortized across all operations: O(1). But individual put() calls that trigger rehashing are O(n).

**Bad hashCode() implementations:**

If your custom class has a terrible `hashCode()` (e.g., returns a constant), every key collides. All n entries end up in one bucket. Every get() traverses n entries. You have accidentally built a linked list.

**When HashMap degrades in practice:**

- After many deletions: `size` drops but `bucketCount` stays high. Each bucket has 0 or 1 entries but collision probability is effectively 0. Memory waste.
- With poor hash functions: String's hashCode is fine. Integer's hashCode returns the int value — fine. Problems arise with custom objects that override hashCode badly.
- Very high n with poor JVM heap config: GC pauses during rehashing.

**The realistic O(1):** For standard string/integer keys in a properly sized map: yes, effectively O(1) in practice. The guarantee is statistical average, not worst case.

---

## 4. Recursion Is Not Inherently Slower Than Iteration

### The misconception

"Recursion is slow because of function call overhead. Always use iteration."

### The reality

**It depends on the language, the compiler/runtime, and the problem.**

**Why recursion CAN be slow:**

Each recursive call creates a **stack frame** — a block of memory on the call stack containing: local variables, parameters, return address, saved registers. Creating and destroying stack frames has cost. For n recursive calls: n stack frames.

Stack size is limited. Default: 512KB-8MB per thread depending on OS and JVM settings. Deep recursion (n > ~10,000) causes `StackOverflowError`.

**Tail call optimization (TCO):**

A tail call is when the recursive call is the LAST operation in the function (the result is returned directly, not used in further computation). Some languages/compilers optimize tail calls to NOT create a new stack frame — they reuse the current one.

```javascript
// Tail call (last operation is the recursive call)
function factorial(n, acc = 1) {
    if (n <= 1) return acc;
    return factorial(n - 1, n * acc);  ← tail position, TCO possible
}
```

Languages with guaranteed TCO: Scheme, Haskell, most functional languages. Elixir/Erlang (BEAM VM) optimizes tail calls extensively.

Languages WITHOUT TCO: Java (JVM does not implement TCO despite proposals). CPython (no TCO). JavaScript spec allows it since ES6 but V8 removed TCO support in 2016 due to debugging difficulties.

**When recursion is as fast as iteration:**

- Haskell, Erlang: tail-recursive functions compile identically to loops
- C/C++ with -O2: GCC and Clang often convert tail recursion to loops automatically
- Java: the JIT occasionally converts simple recursion to loops, but it's not guaranteed

**When recursion is the RIGHT choice regardless of speed:**

Tree traversal, divide-and-conquer algorithms, parsing nested structures (JSON, AST), backtracking. Writing these iteratively requires manually maintaining a stack data structure — you replicate what the call stack does, often with more complex code.

Dijkstra famously said: "The competent programmer is fully aware of the strictly limited size of his own skull; therefore he approaches the programming task in full humility, and among other things he avoids clever tricks like the plague."

**Practical rule:**
- Recursion depth < 1,000: use recursion if it's clearer
- Recursion depth potentially large (n = 100,000+): use iteration or explicit stack
- Tail-recursive in a language with TCO: prefer recursive — same speed, often clearer

---

## 5. Sorting Before Searching Is Not Always Faster

### The misconception

"Sort the array first, then binary search. It's O(log n) vs O(n) for linear search."

### The reality

**Sorting costs O(n log n). You must amortize that cost over multiple searches.**

**Break-even analysis:**

- Sort once: O(n log n)
- Each binary search: O(log n)
- Each linear search: O(n)

Total cost:
- k linear searches: O(k·n)
- Sort + k binary searches: O(n log n + k·log n)

**When sort + binary search wins:** n log n + k log n < k·n → n log n < k(n - log n) ≈ k·n → k > log n.

For n = 1000: log₂(1000) ≈ 10. You need more than **10 searches** before sorting pays off.

For n = 1,000,000: log₂(10⁶) = 20. You need more than **20 searches** to justify the sort.

**Conclusion:** If you search ONCE: never sort first. Linear search is faster. If you search many times on the same data: sort once and binary search. If the data changes between searches: sorting may need to be repeated.

**The real world answer:** Use a data structure appropriate for your query pattern:
- Many exact lookups: HashMap (O(1) average)
- Many range queries: sorted array + binary search, or B-tree (database index)
- Frequent updates + lookups: balanced BST (TreeMap in Java), O(log n) both
- Occasional search in small data: just linear search, no sorting needed

---

## 6. The Stack Overflow That Isn't Stack Overflow

### The misconception

Stack overflow = the website. Or: stack overflow = always caused by infinite recursion.

### The reality

**What the call stack is:** Every function call allocates a stack frame (return address + local variables + parameters). The call stack is a region of memory pre-allocated per thread. On Linux: default 8MB per thread. On JVM: default 256KB-512KB per thread.

**What causes stack overflow:**
1. Infinite recursion (missing base case) — obvious
2. Deep but finite recursion (n = 100,000 frames × 1KB/frame = 100MB — exceeds stack)
3. Large local variables inside recursive functions (each frame is larger)
4. Deep call chains in frameworks (Spring AOP + reflection + interceptors can add 30-50 frames before your code even runs)

**The JVM stack specifically:**

```
Exception in thread "main" java.lang.StackOverflowError
```

This is thrown when the thread's stack space runs out. It's NOT an Error you can recover from meaningfully (though you can catch it, the stack is exhausted and unpredictable behavior follows).

**Increase JVM stack size if needed:**
```
java -Xss4m MyClass    # set stack size to 4MB (default is ~512KB on most JVMs)
```

**How Stack Overflow (the website) got its name:** Joel Spolsky and Jeff Atwood named it after this common programmer error — the most universally understood programmer problem. It launched in 2008.

---

## 7. Greedy Doesn't Mean "Take the Biggest First"

### The misconception

"Greedy algorithm = always pick the maximum/minimum value available." People apply this intuition to problems where it fails.

### The reality

**Greedy** means: make the locally optimal choice at each step, hoping this leads to a globally optimal solution. Whether it DOES lead to the global optimum requires a proof — specifically, the **greedy choice property** and **optimal substructure**.

**When greedy works:**
- Activity selection (interval scheduling): always pick the earliest-finishing activity that doesn't conflict
- Dijkstra's shortest path: always explore the lowest-cost unvisited node
- Huffman coding: always merge the two lowest-frequency trees
- Kruskal's/Prim's MST: always add the lowest-weight edge that doesn't form a cycle (Kruskal's)

**When "take the biggest first" is WRONG:**

**Coin change problem:** Make change for 30 cents using coins {25, 10, 5, 1}.
- Greedy (largest first): 25 + 5 = 30. Works for US coins.
- But with coins {1, 15, 25}: make change for 30.
  - Greedy: 25 + 1 + 1 + 1 + 1 + 1 = 30 (6 coins)
  - Optimal: 15 + 15 = 30 (2 coins)

For arbitrary coin systems, greedy fails. Dynamic programming finds the optimal solution.

**Fractional knapsack:** You can take fractions of items. Greedy by value/weight ratio is optimal.
**0/1 knapsack:** Items are indivisible. Greedy fails. Dynamic programming required.

**How to know if greedy is safe:** Prove the greedy choice property — choosing greedily at step k does not preclude an optimal solution. Usually proven by exchange argument: assume an optimal solution makes a different choice at step k; show you can swap in the greedy choice without worsening the solution.

---

## 8. Dynamic Programming Is Not About Memorization Tricks

### The misconception

"I need to memorize the DP patterns — Fibonacci, knapsack, LCS, etc. Then recognize which pattern applies."

### The reality

DP is a **mathematical framework** for problems with:
1. **Optimal substructure:** Optimal solution contains optimal solutions to subproblems
2. **Overlapping subproblems:** The same subproblems recur many times

**The actual thinking process for ANY new DP problem:**

**Step 1 — Define state:** What information do I need to represent a subproblem? This is the hardest step.

**Step 2 — Write the recurrence:** How does the optimal solution for state (i, j, ...) relate to smaller states? This is the math.

**Step 3 — Identify base cases:** What are the smallest subproblems that have known answers?

**Step 4 — Choose implementation:** Top-down (memoization: recursive + cache) or bottom-up (tabulation: iterative table filling)?

**Step 5 — Optimize space:** Can you reduce from O(n²) table to O(n) row?

**Why "pattern matching" fails on novel problems:** Interviewers and real problems modify classic problems. "LCS but some characters are wildcards." "Knapsack but items can be used unlimited times but with decreasing value." If you only memorized the pattern, the modification breaks you. If you understood the state definition process, you adapt.

**Top-down vs bottom-up — not just style:**
- Top-down: only computes needed subproblems (sparse graphs: often better)
- Bottom-up: computes all subproblems in order (cache-friendly, no recursion overhead)
- Space optimization: bottom-up with rolling array

---

# Java Reality Checks

---

## 9. == Does Not Compare Values in Java

### The misconception

Developers coming from Python or other languages expect `==` to compare content.

### The reality

**For primitives:** `==` compares values. `5 == 5` → true. `3.14 == 3.14` → true.

**For objects:** `==` compares **references** — whether both variables point to the SAME object in memory, not whether they have the same content.

```java
String a = new String("hello");
String b = new String("hello");

System.out.println(a == b);        // false — different objects in heap
System.out.println(a.equals(b));   // true — same content

// The deceptive case:
String c = "hello";
String d = "hello";
System.out.println(c == d);        // TRUE — but only because of string interning!
```

**String interning:** Java stores string literals in a "string pool" (interned). `"hello"` written as a literal is the SAME object every time (at compile time). So `"hello" == "hello"` is `true`. But `new String("hello") == new String("hello")` is `false`. This inconsistency causes subtle bugs when code switches between `new String(...)` and literals.

**The classic bug:**
```java
// User input from Scanner
String input = scanner.nextLine();  // not a literal — not interned
if (input == "yes") {               // ALWAYS FALSE — different object
    doSomething();
}
// Fix:
if (input.equals("yes")) { ... }
// Or for null-safety:
if ("yes".equals(input)) { ... }    // won't throw NullPointerException if input is null
```

**Integer == trap:**
```java
Integer x = 127;
Integer y = 127;
System.out.println(x == y);   // true — integer cache (see section 17)

Integer a = 128;
Integer b = 128;
System.out.println(a == b);   // false — outside cache range, different objects
```

**Rule:** Use `.equals()` for all object comparisons. Use `Objects.equals(a, b)` if either might be null (it handles null safely). Reserve `==` for primitives and intentional reference equality checks (`isSameObject()`).

---

## 10. String Concatenation in a Loop Is Secretly O(n²)

### The misconception

"String + is just convenient syntax. It works fine."

### The reality

Java `String` objects are **immutable**. Every `+` creates a new String object.

```java
String result = "";
for (int i = 0; i < 10000; i++) {
    result = result + "a";      // THIS IS O(n²)
}
```

**What actually happens:**

Iteration 1: creates a new String of length 1. Copies 0 + 1 chars.
Iteration 2: creates a new String of length 2. Copies 1 + 1 chars.
...
Iteration n: creates a new String of length n. Copies n-1 + 1 chars.

Total characters copied: 0 + 1 + 2 + ... + (n-1) = n(n-1)/2 = **O(n²)**.

For n = 10,000: 50 million character copies. For n = 100,000: 5 billion copies.

**What the compiler optimizes:** Java compiler converts `a + b + c` (in a single expression) to `new StringBuilder(a).append(b).append(c).toString()`. But it does NOT optimize across loop iterations. The variable `result = result + "a"` in a loop is NOT optimized.

**The fix:**
```java
StringBuilder sb = new StringBuilder();
for (int i = 0; i < 10000; i++) {
    sb.append("a");             // O(1) amortized — StringBuilder resizes internally
}
String result = sb.toString();  // ONE final copy
// Total: O(n)
```

**Java 9+ performance note:** Java 9 introduced `StringConcatFactory` using `invokedynamic` which can be faster than explicit StringBuilder for some cases — but ONLY for single expressions, not across loop iterations.

**When `+` is fine:** String literals known at compile time (`"Hello " + "world"`), computed at compile time to one constant. Simple one-line concatenations in non-hot paths.

---

## 11. final Does Not Mean Immutable

### The misconception

"I made this variable final so the value can't change." For object references, this is half-wrong.

### The reality

**For primitives:**
```java
final int x = 5;
x = 6;   // COMPILE ERROR — correct, value is truly fixed
```

**For object references:**
```java
final List<String> list = new ArrayList<>();
list = new ArrayList<>();   // COMPILE ERROR — can't reassign the reference

list.add("hello");          // WORKS — the REFERENCE is final, not the object
list.add("world");          // WORKS — the list's contents can still be mutated
list.clear();               // WORKS — still the same list object reference
```

`final` on a reference means: this variable will always point to the SAME object. It does NOT mean the object's internal state is frozen.

**Actual immutability requires:**
- Making all fields private and final
- No setters
- Defensive copies in constructor and getters for mutable fields
- Not overridable (class is `final` or all methods are `final`)

Java provides `String`, `Integer`, `LocalDate` as immutable classes. Creating your own requires discipline.

**Unmodifiable vs immutable:**
```java
List<String> mutable = new ArrayList<>(Arrays.asList("a", "b"));
List<String> view = Collections.unmodifiableList(mutable);

view.add("c");       // throws UnsupportedOperationException
mutable.add("c");    // WORKS — and now view also shows "c" because it's a VIEW
```

`Collections.unmodifiableList()` returns a VIEW — not a copy. Modifying the original still affects the "unmodifiable" list. This has caused security bugs in Java APIs.

`List.copyOf()` (Java 10+) and `List.of()` (Java 9+) return truly immutable lists (no way to modify the underlying data).

---

## 12. Java Has Memory Leaks — Garbage Collection Is Not Perfect

### The misconception

"Java has GC so I don't need to think about memory."

### The reality

**GC collects objects with no living references.** If you accidentally KEEP a reference to an object you no longer need, GC cannot collect it. This is a **memory leak**.

**Classic Java memory leak patterns:**

**1. Static collection growing without bounds:**
```java
public class Cache {
    private static final Map<String, Object> cache = new HashMap<>();

    public static void put(String key, Object value) {
        cache.put(key, value);   // Added but never removed
    }
}
```

The `static` map lives for the lifetime of the JVM. Every `put()` adds to memory. Nothing removes entries. After processing 10 million requests: 10 million entries in the map, consuming gigabytes of RAM.

**Fix:** Use a bounded cache (LRU cache with max size), `WeakHashMap` (GC can collect keys when no other references exist), or Caffeine/Guava cache with size and time-based eviction.

**2. Listeners and callbacks never unregistered:**
```java
eventBus.subscribe(this::handleEvent);   // registered
// ... object goes out of scope ...
// BUT: eventBus still holds a reference to this::handleEvent
// Which holds a reference to 'this' (the outer object)
// GC cannot collect the outer object
```

**Fix:** Always unsubscribe/unregister when done. Use `WeakReference` for listeners when appropriate.

**3. ThreadLocal not cleaned up:**
```java
private static ThreadLocal<SomeExpensiveObject> local = new ThreadLocal<>();

public void doWork() {
    local.set(new SomeExpensiveObject());
    // ... do work ...
    // forgot: local.remove()
}
```

Thread pools reuse threads. If `ThreadLocal.remove()` is not called, the next task on the same thread finds a `SomeExpensiveObject` from the previous request. Memory accumulates. In Tomcat, this is a common source of `OutOfMemoryError` and class loader leaks.

**Diagnosing Java memory leaks:**
```bash
# Take heap dump
jmap -dump:format=b,file=heapdump.hprof <pid>

# Analyze with VisualVM, Eclipse Memory Analyzer (MAT), or JDK Flight Recorder
```

---

## 13. Checked Exceptions Are Controversial and Often Misused

### The misconception

"Java's checked exceptions force good error handling. They make APIs safer."

### The reality

This is genuinely controversial and has divided the Java community for 30 years.

**What checked exceptions are:** Exceptions that the compiler forces you to either catch or declare with `throws`. `IOException`, `SQLException`, `ParseException` — all checked.

**What unchecked exceptions are:** `RuntimeException` subclasses. `NullPointerException`, `IllegalArgumentException`, `IndexOutOfBoundsException` — not required to catch or declare.

**The argument for checked exceptions (James Gosling / early Java designers):**

API users should be explicitly reminded that certain operations can fail. Forcing `throws IOException` in method signatures makes the failure visible in the type system.

**The argument against (practical experience):**

**1. Empty catch blocks — swallowing exceptions:**
```java
try {
    connection.close();
} catch (IOException e) {
    // ignore
}
```

This is the most common response to "annoying" checked exceptions. The exception is silently dropped. No logging. No recovery. Worse than no error handling at all.

**2. Exception translation hell:**
```java
// Interface method can't throw checked exceptions
public interface Repository {
    User findById(int id);  // no throws clause
}

// Implementation must catch and rethrow as unchecked
public User findById(int id) {
    try {
        return db.query("SELECT ...", id);
    } catch (SQLException e) {
        throw new RuntimeException(e);   // wrapped — loses original type
    }
}
```

**3. Major frameworks moved away:**
- Spring wraps all `SQLException` in `DataAccessException` (unchecked)
- Project Reactor, CompletableFuture: all exceptions are unchecked
- Modern Java APIs (Files.readString, etc.) use unchecked where possible
- Kotlin: checked exceptions do not exist

**Effective Java (Joshua Bloch, 3rd edition):** "Use checked exceptions for conditions from which the caller can reasonably be expected to recover. Use runtime exceptions for programming errors."

**Practical rule:** Checked exceptions: use when the caller TRULY can and should handle the failure (file not found → ask user to pick a different file). Unchecked: for programming errors (null argument to method that requires non-null) and infrastructure failures where recovery is impossible at the call site.

---

## 14. synchronized Doesn't Make Your Code Thread-Safe

### The misconception

"I put synchronized on my method, so it's thread-safe now."

### The reality

`synchronized` on a method acquires the object's intrinsic lock **for that method call**. It does NOT atomically coordinate multiple method calls.

**Example of a compound race condition:**
```java
public class Counter {
    private int count = 0;

    public synchronized int get() { return count; }
    public synchronized void increment() { count++; }
}

// Thread 1:              // Thread 2:
int v = counter.get();   // int v = counter.get();
// v = 0                  // v = 0
// ... time passes ...
counter.increment();     // counter.increment();
// count = 1              // count = 1
```

Both methods are synchronized. But the **compound operation** "read then conditionally increment" is not atomic. There is a race between `get()` and `increment()`. Both threads read 0 and both increment from 0 to 1. Count should be 2 but is 1.

**Fix:** Either use `AtomicInteger` for simple counters, or synchronize the COMPOUND operation:
```java
public synchronized void incrementIfZero() {
    if (count == 0) count++;    // get + condition + increment in one synchronized block
}
```

**Other synchronized traps:**

`synchronized` on a static method: locks the **Class object**, not instance. Synchronized on instance method: locks `this`. They are DIFFERENT locks — two threads can hold one each simultaneously.

**Lock granularity:** `synchronized(this)` blocks ALL other synchronized methods on this object. For high-concurrency code, use `ReentrantReadWriteLock` (multiple readers, exclusive writer) or `StampedLock` or ConcurrentHashMap's segment locking.

**Visibility:** `synchronized` ensures the executing thread sees all writes made before the lock was acquired. Without synchronization (and without `volatile`), threads may see stale cached values of variables.

---

## 15. ArrayList vs LinkedList — LinkedList Almost Never Wins

This is covered in section 2 (Cache Reality). The practical summary for Java specifically:

**Java's `LinkedList` implements both `List` and `Deque`.** The only case where it genuinely outperforms `ArrayList`:
- Queue operations (add to tail, remove from head) **IF AND ONLY IF** you never traverse it

For queue/deque behavior: **use `ArrayDeque` instead of `LinkedList`.**
- `ArrayDeque`: circular array buffer, O(1) add/remove at both ends, cache-friendly
- `ArrayDeque` is 2-3× faster than `LinkedList` for queue operations in practice

`LinkedList` is the Java collections library's biggest "gotcha" — it sounds like it should be useful but almost never is in modern Java.

---

## 16. Java Is Not Slow — The JIT Reality

### The misconception

"Java is slow because it runs on a virtual machine." Legacy opinion from the 1990s.

### The reality

**The first JVM (1995) was slow — but that JVM is not what exists today.**

**JVM performance evolution:**
- 1995-1999: Interpreted bytecode. Yes, slow — 10-50× slower than C.
- 1999: HotSpot JVM (Sun). JIT compilation. Fast warm-up, much better performance.
- 2011+: JVM JIT includes: escape analysis, scalar replacement, loop vectorization, inlining, deoptimization/reoptimization. Competitive with C++ for many workloads.
- 2019+: GraalVM native image — compile Java to native executable ahead of time. Near-C startup time.

**Modern Java performance reality:**

| Benchmark category | Java vs C++ |
|-------------------|-------------|
| Compute-intensive (math, algorithms) | Within 1.5-3× |
| String processing | Comparable |
| I/O-bound (web servers) | Java often wins (async IO, efficient GC) |
| Memory usage | Java uses more (object headers, GC overhead) |
| Startup time (JVM cold) | Slow (~100-500ms) vs near-instant for C |
| Startup time (GraalVM native) | Near-instant |

**Where Java still costs:**
- Object header overhead: every Java object has 16 bytes of header (mark word + class pointer). `int[]` of 1000 elements ≈ 4016 bytes. C `int[1000]` = 4000 bytes. Small but multiplies.
- GC pauses: even G1GC/ZGC have occasional pause events. Low-latency C++ code has no GC pauses.
- Warm-up time: JIT needs "warm" runs to profile and compile. The first 1000 calls to a method are slow.

**Practical rule:** For most business applications, Java's performance is more than sufficient. If you are writing a game engine, OS, database kernel, or embedded system: use C/C++/Rust. For web services, data processing, enterprise systems: Java is fast enough and offers safety/tooling advantages.

---

## 17. Integer Cache: Why 127 == 127 but 128 != 128

### The reality

Java autoboxes `int` to `Integer` objects. Java also caches `Integer` objects for values -128 to 127.

```java
Integer a = 127;
Integer b = 127;
System.out.println(a == b);    // true — same cached object!

Integer x = 128;
Integer y = 128;
System.out.println(x == y);    // false — different objects
```

**Why:** Integer values between -128 and 127 are used extremely frequently. Java's `IntegerCache` pre-creates these 256 objects when the JVM starts. All `Integer.valueOf(127)` calls return the SAME object. Values outside this range create new objects each time.

**JVM flag to change cache upper bound:**
```
-XX:AutoBoxCacheMax=1000   # cache up to 1000
```

**Why this is a trap:** Code that uses `Integer` (capitalized — boxed) instead of `int` (primitive) and relies on `==` works fine for small values in testing, then fails randomly in production when values exceed 127. This is the INTEGER version of the string interning problem.

**Always use `.equals()` for Integer, Long, Double, etc.**

---

## 18. Interfaces Since Java 8 Are Not "Just Abstract Classes Without Bodies"

### The misconception

"Interface = abstract class with no implementations, only method signatures."

### The reality since Java 8 (2014)

**Default methods:** Interfaces can have methods with bodies.
```java
public interface Drawable {
    void draw();   // abstract, must implement

    default void drawWithBorder() {   // default — concrete, can override or inherit
        draw();
        System.out.println("Border");
    }
}
```

**Static methods on interfaces:**
```java
public interface Validator<T> {
    boolean validate(T value);

    static Validator<String> nonEmpty() {   // factory method on interface
        return s -> s != null && !s.isEmpty();
    }
}
```

**Private methods (Java 9+):** For code reuse within the interface's default methods.

**Why this was added:** When Java 8 added functional streams and lambda support, they needed to add `forEach()`, `stream()`, `removeIf()` to `Collection`, `List`, etc. Adding abstract methods to an interface would break ALL existing implementations (every class implementing List would need to add the method). Default methods allow adding new methods to interfaces without breaking existing code.

**The remaining difference between interface and abstract class:**

| Property | Interface | Abstract Class |
|----------|-----------|---------------|
| Instance variables | No (only constants: `public static final`) | Yes |
| Constructors | No | Yes |
| Multiple inheritance | Yes (a class can implement multiple) | No (only one superclass) |
| State | No | Yes |
| Default methods | Yes (since Java 8) | Yes (always) |

**Design rule:** Interface = defines a CONTRACT (what you can do). Abstract class = defines a PARTIAL IMPLEMENTATION (what you are). Prefer interfaces for polymorphism. Use abstract class when you have shared implementation state (fields).

---

# SQL Reality Checks

---

## 19. SELECT * Is Not Fine in Production

### The misconception

"SELECT * is convenient. The database only returns what I need anyway."

### The reality

`SELECT *` causes several real problems:

**1. Transfers unnecessary data over the network:**

A `users` table with 50 columns: SELECT * returns all 50 columns per row. You needed 3 columns. You transferred 47 columns of data across the network, into your application, and into memory. For 100,000 rows and large text columns: gigabytes of unnecessary data.

**2. Prevents index-only scans:**

A database can answer a query using ONLY an index (no table heap access) if all requested columns are IN the index. This is called an **index-only scan** — extremely fast.

```sql
-- If there's an index on (email, status):
SELECT email, status FROM users WHERE email = 'x@x.com';
-- → Index-only scan: never touches the actual table rows

SELECT * FROM users WHERE email = 'x@x.com';
-- → Must go from index to table heap for remaining 48 columns
```

**3. Breaks code when schema changes:**

Your code does:
```python
user_data = db.execute("SELECT * FROM users WHERE id = ?", user_id)
email = user_data[2]   # assumes email is column index 2
```

A migration adds a column before `email`. Now `email` is at index 3. Code silently reads wrong data.

**4. Exposes sensitive columns accidentally:**

An API that does `SELECT * FROM users` and serializes to JSON will expose `password_hash`, `ssn`, `internal_notes` to the API caller if your serializer does not explicitly exclude them.

**Rule:** Always name your columns. `SELECT id, name, email FROM users`. In performance-critical queries, only select what you process.

---

## 20. NULL Is Not Zero or Empty — It Is Absence

### The misconception

`NULL` is like 0 for numbers or `""` for strings. You can compare it with `=`.

### The reality

`NULL` means "value is unknown" or "value does not exist." It is NOT a value — it is the absence of a value.

**NULL breaks normal comparison logic:**

```sql
SELECT * FROM orders WHERE discount_pct = NULL;    -- returns 0 rows ALWAYS
SELECT * FROM orders WHERE discount_pct != NULL;   -- returns 0 rows ALWAYS
SELECT * FROM orders WHERE NULL = NULL;            -- evaluates to NULL (not TRUE!)
```

In SQL, any comparison with NULL returns NULL (not TRUE or FALSE). NULL is a third truth value.

**Truth table with NULL:**

| Expression | Result |
|-----------|--------|
| `TRUE AND NULL` | NULL |
| `FALSE AND NULL` | FALSE (short-circuit: false AND anything = false) |
| `TRUE OR NULL` | TRUE (short-circuit) |
| `FALSE OR NULL` | NULL |
| `NOT NULL` | NULL |
| `NULL = NULL` | NULL |
| `NULL != NULL` | NULL |

**Correct NULL comparison:**
```sql
SELECT * FROM orders WHERE discount_pct IS NULL;     -- correct
SELECT * FROM orders WHERE discount_pct IS NOT NULL; -- correct
```

**NULL in aggregates:**

```sql
-- Table: scores (student_id, score)
-- Data: (1, 90), (2, NULL), (3, 80)

SELECT COUNT(*) FROM scores;          -- 3 (counts rows, including NULL)
SELECT COUNT(score) FROM scores;      -- 2 (NULL is not counted)
SELECT AVG(score) FROM scores;        -- 85 (NULL is excluded from average!)
SELECT SUM(score) FROM scores;        -- 170 (NULL treated as 0 in sum? NO — excluded)
```

`AVG` ignores NULL rows. The average of {90, NULL, 80} is 85, not 56.67. This is often not what you want — the NULL might mean "score is 0" not "score is unknown."

**NULL in JOINs:**

```sql
-- LEFT JOIN includes rows where the RIGHT side has no match
-- Those unmatched rows have NULL for all RIGHT table columns
SELECT u.name, o.total
FROM users u
LEFT JOIN orders o ON u.id = o.user_id;
-- Users with no orders: o.total is NULL
WHERE o.total > 100   -- This excludes users with no orders (NULL > 100 = NULL = not TRUE)
```

Always think about NULL behavior when filtering on LEFT JOIN results.

---

## 21. Indexes Don't Only Speed Things Up

### The misconception

"Add more indexes = faster database."

### The reality

Indexes have costs:

**1. Slower writes:**

Every `INSERT` must write to the table AND update every index on that table. Every `UPDATE` that changes an indexed column must update those indexes. Every `DELETE` removes from the table and all indexes.

A table with 10 indexes: each write operation touches 11 data structures. For write-heavy workloads, too many indexes causes significant write slowdown.

**2. Storage space:**

Each index is a separate data structure (B-tree or hash) that takes disk space. A table with 100 million rows and 10 indexes might use 10× more disk than the table alone.

**3. Query planner confusion:**

With many indexes, the query planner must choose among them. Occasionally it picks the wrong index, resulting in a slower query than no index at all (though modern planners are usually good at this).

**Index types and when they help:**

| Index type | Helps | Does NOT help |
|-----------|-------|---------------|
| B-tree (default) | `=`, `<`, `>`, `BETWEEN`, `ORDER BY`, `GROUP BY` | `LIKE '%suffix'` (leading wildcard) |
| Hash index | `=` only, faster than B-tree for exact match | Range queries |
| GIN (PostgreSQL) | Full-text search, arrays, JSONB | |
| Partial index | Queries with a constant WHERE clause | Queries without that clause |
| Composite index | Queries filtering on MULTIPLE columns (left-prefix rule applies) | Queries not using leftmost columns |

**Composite index left-prefix rule:**

Index on `(last_name, first_name, age)` — this index helps:
- `WHERE last_name = 'Smith'`
- `WHERE last_name = 'Smith' AND first_name = 'John'`
- `WHERE last_name = 'Smith' AND first_name = 'John' AND age = 30`

But does NOT help:
- `WHERE first_name = 'John'` (no left-prefix)
- `WHERE age = 30` (no left-prefix)

---

## 22. LIKE '%pattern%' Cannot Use an Index

### The misconception

"I have an index on the `name` column. My LIKE query should be fast."

### The reality

```sql
SELECT * FROM users WHERE name LIKE 'Jo%';     -- CAN use index (prefix search)
SELECT * FROM users WHERE name LIKE '%ohn';    -- CANNOT use index (leading wildcard)
SELECT * FROM users WHERE name LIKE '%oh%';    -- CANNOT use index (both sides)
```

**Why:** A B-tree index stores values in sorted order. Searching for a prefix (`'Jo%'`) is possible because all 'Jo...' names are contiguous in the sorted index. But `'%ohn'` could be anywhere — 'John', 'Dohn', 'Zohn' — no part of the sorted structure helps find these efficiently. The database must scan every row.

**For real full-text search needs:**

```sql
-- PostgreSQL: Full-text search
CREATE INDEX idx_fts ON articles USING GIN (to_tsvector('english', body));
SELECT * FROM articles WHERE to_tsvector('english', body) @@ to_tsquery('database');

-- MySQL: FULLTEXT index
ALTER TABLE articles ADD FULLTEXT(body);
SELECT * FROM articles WHERE MATCH(body) AGAINST ('database' IN BOOLEAN MODE);
```

Elasticsearch and OpenSearch are purpose-built for full-text search at scale — they beat database full-text search for large datasets.

---

## 23. COUNT(*) vs COUNT(column) — They Are Different

```sql
-- Table: orders
-- id | amount | coupon_code
--  1 | 100    | SAVE10
--  2 | 200    | NULL
--  3 | 150    | NULL

SELECT COUNT(*) FROM orders;            -- 3 (counts rows)
SELECT COUNT(coupon_code) FROM orders;  -- 1 (counts non-NULL values only)
SELECT COUNT(DISTINCT coupon_code) FROM orders;  -- 1 (unique non-NULL values)

SELECT COUNT(1) FROM orders;            -- 3 (equivalent to COUNT(*), counts rows)
```

**Use `COUNT(*)` when:** You want the number of rows.
**Use `COUNT(column)` when:** You want the number of rows where that column is NOT NULL.

This distinction matters when analyzing optional data.

---

## 24. JOIN Order Matters for Correctness, Not Just Performance

### LEFT JOIN order is not symmetric

```sql
-- These are different queries:
SELECT u.name, o.total FROM users u LEFT JOIN orders o ON u.id = o.user_id;
-- Returns ALL users, plus order data if it exists (NULLs for users with no orders)

SELECT u.name, o.total FROM orders o LEFT JOIN users u ON o.user_id = u.id;
-- Returns ALL orders, plus user data if it exists (NULLs for orders with no user)
```

The first returns users without orders (with NULL totals). The second returns orders without matching users (orphaned data). Completely different result sets.

**INNER JOIN IS symmetric in result (but not necessarily performance):**
```sql
-- These return the same rows:
SELECT * FROM users u INNER JOIN orders o ON u.id = o.user_id;
SELECT * FROM orders o INNER JOIN users u ON o.user_id = u.id;
```

For `INNER JOIN`, query optimizer can reorder tables to use the most efficient plan. For `LEFT JOIN`, the left table drives the join — order matters both semantically and for optimization.

---

## 25. Transactions Are Not Only for Banking

### The misconception

"Transactions are for financial systems where you need all-or-nothing. My blog app doesn't need them."

### The reality

Any time you need multiple database operations to succeed or fail together, you need a transaction.

**Example — creating a blog post with tags:**
```sql
-- Without transaction:
INSERT INTO posts (title, body) VALUES ('My Post', '...');    -- succeeds, post_id = 42
INSERT INTO post_tags (post_id, tag_id) VALUES (42, 5);        -- FAILS (network error)
-- Result: post exists but has no tags. Inconsistent state. Orphaned data.

-- With transaction:
BEGIN;
INSERT INTO posts (title, body) VALUES ('My Post', '...');
INSERT INTO post_tags (post_id, tag_id) VALUES (42, 5);
COMMIT;   -- both succeed together
-- OR
ROLLBACK; -- neither happens if either fails
```

**Common cases needing transactions:**
- Create a user + create their default settings + create their welcome notification
- Transfer money: debit account A + credit account B (classic example)
- Place an order: insert order row + decrement inventory + insert audit log row
- Delete a post + delete its comments + delete its tags
- Any operation that must be atomic

**ACID properties — what transactions guarantee:**
- **Atomicity:** All operations succeed or all are rolled back
- **Consistency:** Database moves from one valid state to another valid state
- **Isolation:** Concurrent transactions don't see each other's intermediate state
- **Durability:** Committed transactions survive crashes (written to disk/WAL)

---

## 26. ORM Does Not Always Generate Good SQL

### The misconception

"My ORM abstracts SQL, so I don't need to understand SQL."

### The reality

ORMs generate SQL for you — but the SQL they generate may be inefficient, and you cannot fix it without understanding SQL.

**What ORMs do poorly:**

**1. The N+1 problem (see next section)**

**2. Loading too much data:**
```java
// JPA / Hibernate — this loads ALL columns of User
User user = em.find(User.class, userId);
String email = user.getEmail();   // only needed this one field
```

For a User with 30 fields including large text columns and blobs: you loaded all 30 fields to read 1. Use projections:
```java
String email = em.createQuery(
    "SELECT u.email FROM User u WHERE u.id = :id", String.class)
    .setParameter("id", userId)
    .getSingleResult();
```

**3. Missing JOIN optimizations:**
ORMs may generate multiple queries where a single JOIN would work. Always check what SQL is being generated.

**4. Sorting and filtering in application code instead of database:**
```java
// ORM loads ALL users, Java filters them — O(n) data transfer
List<User> users = userRepo.findAll();
users.stream().filter(u -> u.getStatus() == ACTIVE).collect(toList());

// Should be:
List<User> users = userRepo.findByStatus(ACTIVE);   // filtered in SQL
```

**How to see what SQL your ORM generates:**
```properties
# Hibernate / Spring JPA:
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
logging.level.org.hibernate.SQL=DEBUG
logging.level.org.hibernate.type=TRACE
```

Always check generated SQL during development. Optimize with native queries or stored procedures when needed.

---

## 27. The N+1 Query Problem — The Most Common ORM Trap

### What it is

You make 1 query to get N records, then N more queries to get related data for each. 1 + N queries instead of 1 or 2.

**Example:**
```java
List<Order> orders = orderRepo.findAll();     // 1 query → 100 orders

for (Order order : orders) {
    System.out.println(order.getCustomer().getName());  // 100 queries!
    // Each call to getCustomer() triggers a SELECT from customers table
}
// Total: 101 queries instead of 1 or 2
```

**Why it happens:** Lazy loading — the ORM doesn't fetch related entities until you access them. Each access triggers a new query.

**The fix — eager loading / JOIN FETCH:**
```java
// JPA: fetch customers eagerly in a single query
List<Order> orders = em.createQuery(
    "SELECT o FROM Order o JOIN FETCH o.customer", Order.class)
    .getResultList();
// → 1 query with JOIN. 100 orders + their customers in one round trip.

// Spring Data JPA:
@EntityGraph(attributePaths = {"customer"})
List<Order> findAll();
```

**Detecting N+1 in production:**
- Enable SQL logging and look for repeated similar queries
- Use [Hypersistence Optimizer](https://vladmihalcea.com/hypersistence-optimizer/) for Hibernate
- Look for `SELECT ... WHERE id = ?` appearing 100+ times in logs

---

# Playwright / Testing Reality Checks

---

## 28. sleep() in Tests Is a Time Bomb

### The misconception

"The test fails because the page isn't loaded yet. Add `sleep(2000)` — that fixes it."

### The reality

`sleep()` (or `page.waitForTimeout()`) is the most common source of flaky tests:

**Problem 1 — Timing depends on environment:**
- Your laptop: SSD, 16GB RAM, no load → page loads in 800ms → sleep(2000) passes
- CI server: shared CPU, high load, throttled → page loads in 3000ms → sleep(2000) FAILS

**Problem 2 — Sleep is waste when things are fast:**
- sleep(2000) makes every test run waste 2 seconds even when the element appeared in 50ms
- 100 tests with sleep(2000) = 200 extra seconds of waiting

**Problem 3 — Timing varies between runs:**
`sleep(2000)` that passes 90% of the time becomes a flaky test that fails randomly in CI, making your test suite unreliable.

**The fix — always wait for the condition, not a duration:**

```javascript
// Bad:
await page.waitForTimeout(2000);
await page.click('#submit');

// Good: wait for the element to be ready
await page.waitForSelector('#submit', { state: 'visible' });
await page.click('#submit');

// Even better: Playwright's auto-wait
// locator.click() already waits for the element to be actionable
await page.locator('#submit').click();

// Wait for network:
await page.waitForLoadState('networkidle');

// Wait for specific response:
const [response] = await Promise.all([
    page.waitForResponse(r => r.url().includes('/api/users')),
    page.locator('#load-users').click()
]);

// Wait for DOM change:
await page.waitForSelector('.result-item', { state: 'visible' });
```

**Playwright's auto-waiting (understand it!):**

Playwright's `locator.click()`, `locator.fill()`, etc. automatically wait for the element to be:
- Attached to DOM
- Visible
- Stable (not animating)
- Enabled
- Receives pointer events (not obscured by another element)

This covers 90% of timing issues without any explicit waits. If you find yourself adding sleeps, first ask: "Am I using locators correctly?"

---

## 29. A Test That Passes Locally Can Still Be Wrong

### Common ways tests lie to you

**1. Tests share state through a real database:**
```javascript
// Test A creates user with email 'test@test.com'
// Test B also tries to create user with email 'test@test.com'
// Test B fails with UNIQUE constraint violation
// But only when run after Test A
```

**2. Tests depend on execution order:**
```javascript
// Test 1: logs in, stores auth cookie in context
// Test 2: assumes it's already logged in (re-uses context)
// Run Test 2 alone → fails because no auth cookie
// Run Test 1 then Test 2 → passes
```

**3. Tests pass because of leftover data from a previous test run:**
```javascript
// Test: "there should be 3 items in the list"
// First run: test creates the 3 items, asserts count = 3. Pass.
// Second run: items from first run still exist. Test creates 3 more. Count = 6. FAIL.
```

**4. Tests pass because the happy path only tests the obvious:**
```javascript
// Test: user can log in
// What it misses: what happens with expired password? wrong 2FA code?
//                 account locked after 5 attempts? session timeout?
```

**The fixes:**

**Isolated state:** Each test owns its own data. Before each test: create needed fixtures. After each test: clean up (or use database transactions that rollback).

**Independent tests:** No test should depend on another test having run first. Run tests in random order to detect dependencies.

**Test what matters:** Cover edge cases and error states, not just the happy path.

---

## 30. Screenshot Assertions Are Not Functional Assertions

### The misconception

"My visual regression test passes — the screenshot matches. The feature works."

### The reality

A screenshot tells you pixels match. It does NOT tell you:
- The button actually does something when clicked
- The form actually submits data
- The API call returned correct data
- The database was updated
- Error messages appear for invalid input

**Example of a "passing" screenshot test on broken functionality:**

A loading spinner is permanently showing (API call failed, spinner never hides). The screenshot captures the spinner state exactly as expected (if you set it up that way). Screenshot passes. Feature is completely broken.

**When visual regression tests are valuable:**
- Detecting unintended CSS changes ("this button was blue, now it's red")
- Cross-browser rendering differences
- Responsive layout breakage
- Font rendering changes

**When to use functional assertions instead:**

```javascript
// Bad: visual assertion for functional behavior
await expect(page).toHaveScreenshot('after-login.png');

// Good: functional assertion
await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
await expect(page.locator('[data-testid="user-name"]')).toHaveText('John');
await expect(page).toHaveURL('/dashboard');
```

**Rule:** Use visual regression for visual design correctness. Use functional assertions (text content, visibility, URL, network responses) for behavioral correctness.

---

## 31. Testing Everything Through the UI Is a Trap

### The misconception

"End-to-end tests are the most realistic — I should test everything through the browser."

### The reality

The **Test Pyramid:** Most tests should be at lower levels:

```
         /\
        /E2E\          ← few, slow, expensive, brittle
       /──────\
      /Integr.\       ← some, moderate speed
     /──────────\
    /  Unit Tests \   ← many, fast, stable
   /──────────────\
```

**The cost of E2E (Playwright) tests:**
- Slow: each test takes 5-30 seconds (browser startup, page loads, rendering)
- Brittle: depend on UI implementation details (selectors break when UI changes)
- Hard to debug: failures can be from network, DB, backend, or frontend
- Expensive to run: need a running browser, application, and database

**E2E tests are right for:**
- Critical user journeys (login, checkout, key business flows)
- Cross-browser compatibility
- Smoke tests (basic sanity: "does the site load and key pages work?")
- Testing integrations between systems

**Unit tests are right for:**
- Business logic (validation, calculations, transformations)
- Utility functions
- Service classes and repositories in isolation

**Integration tests are right for:**
- API endpoints with real database
- Service interactions
- Data access layer

**The practical ratio:** 70% unit, 20% integration, 10% E2E is a common target. You don't have to hit exact percentages — the principle is: test behavior at the cheapest level that gives you confidence.

---

## 32. Parallel Tests Without Isolated State Will Be Flaky

### The misconception

"I'll just run my tests in parallel to make them faster."

### The reality

Tests sharing state (same database, same files, same user accounts) + parallel execution = race conditions = flaky tests.

**Classic failure:**
```
Test A (worker 1): creates user with email 'test@example.com'
Test B (worker 2): creates user with email 'test@example.com'  ← UNIQUE violation
Test B FAILS... randomly, depending on timing
```

**Strategies for safe parallelism:**

**1. Each worker gets its own database:**
```javascript
// playwright.config.ts
export default {
    workers: 4,
    use: {
        baseURL: process.env.BASE_URL,
    }
}
// Each worker talks to worker-1.db, worker-2.db, etc.
// Set up at the start of each worker, torn down at the end
```

**2. Unique data per test:**
```javascript
// Generate unique identifiers for each test run
const uniqueEmail = `test-${Date.now()}-${Math.random()}@example.com`;
await page.fill('#email', uniqueEmail);
```

**3. Test isolation with database transactions:**
```javascript
// Each test wraps its DB operations in a transaction
// Rollback after the test — data never actually committed
// Not possible for all scenarios (E2E tests can't easily use this)
```

**4. Playwright's built-in isolation:**
Each Playwright test gets its own browser context by default — isolated cookies, localStorage, session. Tests don't share browser state even in parallel.

---

## 33. Locator Strategies: What Makes a Test Brittle vs Stable

### Brittle locators (avoid)

```javascript
// XPath with absolute paths — breaks if HTML structure changes
page.locator('//div[3]/table/tr[2]/td[4]/button')

// CSS with positional selectors
page.locator('.container > :nth-child(3) > button')

// Class names used for styling (change when designer refactors CSS)
page.locator('.blue-button-v2')

// Text content in a language that will be translated
page.locator('text=Submit Order')   // breaks when translated to Spanish "Enviar pedido"
```

### Stable locators (prefer)

```javascript
// data-testid: explicitly for testing, not styling
page.locator('[data-testid="submit-order-button"]')

// ARIA roles and labels: semantic, accessible, stable
page.getByRole('button', { name: 'Submit order' })
page.getByLabel('Email address')
page.getByPlaceholder('Enter your email')

// Playwright's getBy* methods:
page.getByText('Submit order')
page.getByTestId('submit-button')    // same as [data-testid]
```

**Add `data-testid` to components in your app:** It is a widely accepted convention. The test attribute is stripped in production builds (or kept — it doesn't affect users). It makes tests resilient to CSS and layout changes.

**The hierarchy:**
1. `getByRole()` — best for accessibility and semantics
2. `getByTestId()` — best for things without a natural role
3. `getByLabel()` / `getByPlaceholder()` — best for form elements
4. `getByText()` — for unique text that is stable across languages
5. CSS selectors with `data-*` attributes — acceptable
6. CSS with class/position — fragile, avoid

---

## 34. Why Tests Pass in CI but Fail in Another Environment

**Reason 1 — Different viewport/resolution:**

```javascript
// playwright.config.ts
use: {
    viewport: { width: 1280, height: 720 },  // explicit, consistent across environments
}
```

A test clicking at specific pixel coordinates breaks when viewport changes. Always use locators, not coordinates.

**Reason 2 — Different locale/timezone:**

```javascript
// Date formatting, time display depends on system locale
// Explicit locale in playwright config:
use: {
    locale: 'en-US',
    timezoneId: 'America/New_York',
}
```

**Reason 3 — Fonts and rendering:**

Visual regression screenshots look different between macOS (antialiasing) and Linux (different font renderer). Use Linux-only screenshots in CI and never compare cross-OS.

**Reason 4 — Environment variables / feature flags:**

App in development mode shows extra debug UI. App in CI has different feature flags. Test was written against development behavior.

**Reason 5 — Network conditions:**

CI servers have slower network than developer laptops. Tests that implicitly depend on fast responses fail in CI. Use `networkidle` waits and generous but deterministic timeouts.

---

## 35. Test Coverage Percentage Is a Metric, Not a Goal

### The misconception

"We have 95% code coverage. Our tests are great."

### The reality

Coverage measures which LINES were executed during tests. It does not measure:
- Whether assertions actually verify correct behavior
- Whether edge cases and error conditions are tested
- Whether the tests would catch a bug

**Example of 100% coverage with zero confidence:**

```javascript
function divide(a, b) {
    return a / b;    // line covered
}

test('divide works', () => {
    divide(10, 2);   // line is executed = covered
    // No assertion! No expect() call!
});
```

Coverage: 100%. The test catches nothing. You could change `return a / b` to `return a * b` and the test still passes.

**Coverage without assertions is meaningless.**

**What coverage IS useful for:**

Identifying code that is NEVER tested — dead code, untested paths. If a branch is at 0% coverage, that's a signal to add tests or delete dead code.

**Better metrics than line coverage:**

- **Mutation testing:** Automatically modifies your code (changes `+` to `-`, `>` to `>=`, etc.) and checks if your tests catch the change. If most mutations are "killed" (tests fail), your tests are effective.
- **Branch coverage:** Are both `if` and `else` branches executed? Better than line coverage.
- **Behavior coverage:** Are you testing observable behaviors from the user's perspective?

**The real goal:** Tests that give you confidence to deploy. Coverage is a hint toward achieving that, not the goal itself.

---

## How to Use Domain Reality Checks

These are the misconceptions that cause the most production bugs, the most debugging sessions, and the most "but why?" moments. Read a section when you start working with that technology. Reread when something behaves unexpectedly.

The pattern for every misconception:
1. What people think is true
2. What actually happens at the mechanism level
3. The specific way this causes bugs
4. The correct mental model and fix

That is all debugging is: closing the gap between what you think the system does and what it actually does.

---

*Related: [Reality_Checks_How_Tech_Actually_Works.md](Reality_Checks_How_Tech_Actually_Works.md) — infrastructure, networking, protocols, cloud*
*[02_Data_Structures/](../02_Data_Structures/) | [03_Algorithms/](../03_Algorithms/) | [07_Modern_Java/](../07_Modern_Java/) | [08_SQL/](../08_SQL/) | [21_SDET_Playwright_Automation/](../21_SDET_Playwright_Automation/)*
