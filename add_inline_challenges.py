#!/usr/bin/env python3
"""
PASS 3 — Inline Section Challenges
Injects 🔬 Section Challenge blocks AFTER each ## section throughout every content file.
Uses heading-keyword matching to inject highly relevant challenges.
"""
import sys, io, os, re
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

BASE = r"e:\Dev_World\04_Practice\Daily-Prep"
INLINE_MARKER = "🔬 **Section Challenge"

# ─────────────────────────────────────────────────────────────────────────────
# CHALLENGE LIBRARY — keyed by heading keywords
# Each entry: list of (type_label, question, answer) tuples
# ─────────────────────────────────────────────────────────────────────────────

def make_block(title, challenges):
    lines = [f"\n> 🔬 **Section Challenge — {title}**\n>"]
    for i, (qtype, question, answer) in enumerate(challenges, 1):
        lines.append(f"> **Challenge {i} ({qtype}):** {question}")
        lines.append(f"> <details><summary>Answer</summary>\n>")
        lines.append(f"> {answer}")
        lines.append(f"> </details>\n>")
    lines.append("")
    return "\n".join(lines)

# ── heading → challenges mapping ─────────────────────────────────────────────
HEADING_CHALLENGES = {

    # ── JAVA CORE ─────────────────────────────────────────────────
    "type erasure": [
        ("Reasoning", "You write `List<String> list = new ArrayList<>();`. At runtime, can you check `list instanceof List<String>`?",
         "No — `instanceof List<String>` is a compile error. After erasure, it's just `List` at runtime. Use `instanceof List<?>` for an unparameterized check. This is why you can't do `new T()`, `new T[]`, or `T.class` — T doesn't exist at runtime."),
        ("Bug Hunt", "A method returns `(T) jsonDeserialize(json)` where T is a generic type param. When does the `ClassCastException` actually occur?",
         "NOT at the cast — the unchecked cast compiles to nothing at runtime (erasure). The CCE occurs when the calling code tries to USE the returned value as a specific type. This makes debugging hard: the error appears far from the actual source. Use `Class<T> clazz` parameter to do safe `clazz.cast(...)` instead."),
    ],
    "wildcards": [
        ("Reasoning", "`void process(List<? extends Number> list)` — can you call `list.add(3.14)`? Why or why not?",
         "No. The compiler doesn't know the actual type — it could be `List<Integer>`, `List<Float>`, or `List<Double>`. Adding a `Double` to a `List<Integer>` would violate type safety. `? extends T` is read-only: you can `get()` as `Number`, but `add()` is forbidden (except null)."),
        ("Design", "Write a method that copies elements from any `List<? extends T>` into any `List<? super T>`. Why is this the correct signature?",
         "```java\n> <T> void copy(List<? extends T> src, List<? super T> dst) {\n>     for (T item : src) dst.add(item);\n> }\n> ```\n> PECS: `src` is a Producer (we read from it) → `extends`. `dst` is a Consumer (we write to it) → `super`. This is exactly how `Collections.copy()` is implemented in the JDK."),
    ],
    "pecs": [
        ("Reasoning", "Stack's `pushAll(Iterable<? extends E> src)` vs `popAll(Collection<? super E> dst)` — trace why each wildcard direction is needed.",
         "`pushAll`: we READ from `src` to push into the stack → it Produces E → `extends E`. `popAll`: we WRITE popped values INTO `dst` → `dst` Consumes E → `super E`. Applying PECS mechanically: Producer=Extends, Consumer=Super. If you used `<E>` for both, you'd lose flexibility — `pushAll(List<Integer>)` would fail for a `Stack<Number>`."),
    ],
    "exception hierarchy": [
        ("Reasoning", "Why does `Error` extend `Throwable` separately from `Exception`? When should you catch `Error`?",
         "`Error` represents JVM-level failures: `OutOfMemoryError`, `StackOverflowError`, `VirtualMachineError`. These indicate unrecoverable states. You should almost NEVER catch `Error` — the JVM state is undefined. Only exception: top-level handlers that log the error before terminating gracefully (`catch(Throwable t)` in shutdown hooks). Never catch `Error` in normal application code."),
        ("Bug Hunt", "`catch(Exception e) { log(e.getMessage()); }` — name 3 things wrong with this.",
         "1) `e.getMessage()` returns null for some exceptions (NPE, CCE) → NullPointerException in the logger! Use `log(e)` instead to print full stack. 2) Swallowing `Exception` catches runtime bugs (NPE, illegal arg) that should crash/bubble — silent failure is worse than loud failure. 3) No re-throw or meaningful handling — caller has no idea the operation failed."),
    ],
    "custom exception": [
        ("Design", "Design a custom exception hierarchy for a payment system. What should the base class extend and what fields must it have?",
         "```java\n> public class PaymentException extends RuntimeException { // unchecked!\n>     private final String errorCode;\n>     private final String transactionId;\n>     public PaymentException(String code, String txId, String msg, Throwable cause) {\n>         super(msg, cause); this.errorCode=code; this.transactionId=txId;\n>     }\n> }\n> public class InsufficientFundsException extends PaymentException { ... }\n> public class PaymentGatewayException extends PaymentException { ... }\n> ```\n> Always chain the original cause. Include domain-relevant context (errorCode, transactionId) for logging/debugging."),
    ],
    "try-with-resources": [
        ("Reasoning", "Both the `try` block and `close()` throw exceptions. Which one propagates? Where does the other go?",
         "The `try` block's exception propagates (it's the 'primary' exception). The `close()` exception is SUPPRESSED — attached via `addSuppressed()`. Retrieve it with `e.getSuppressed()`. This is the opposite of old `try/finally` where the `finally` exception would REPLACE the original (swallowing it silently). Always use try-with-resources for `Closeable` resources — never try/finally."),
        ("Bug Hunt", "```java\nInputStream in = new FileInputStream(f);\ntry { process(in); } catch(IOException e) { } finally { in.close(); }\n```\nWhat's wrong?",
         "Two bugs: 1) `in` is declared OUTSIDE try — if `new FileInputStream(f)` throws, `in` is null but we attempt `in.close()` in finally → NPE. 2) `in.close()` can also throw `IOException` — not handled in finally → swallowed silently. Fix: use try-with-resources: `try(InputStream in = new FileInputStream(f)) { process(in); }`"),
    ],
    "exception in multithreaded": [
        ("Reasoning", "`ExecutorService.submit(task)` — the task throws a `RuntimeException`. Nobody calls `future.get()`. What happens to the exception?",
         "It's silently swallowed. The exception is stored in the `Future` object. Without `future.get()` or `.whenComplete()`, no one ever sees it. The thread pool thread resets and picks up the next task as if nothing happened. This is one of the most dangerous production bugs. Fix: always attach `future.whenComplete((r,ex) -> { if(ex!=null) log.error(\"Task failed\",ex); })` or use `execute()` + `UncaughtExceptionHandler`."),
    ],

    # ── STRINGS ───────────────────────────────────────────────────
    "string pool": [
        ("Reasoning", "`String a = \"hello\"; String b = \"hello\"; a == b` — true or false? What about `new String(\"hello\") == \"hello\"`?",
         "First: `true` — string literals are interned in the string pool; same literal = same reference. Second: `false` — `new String(...)` always creates a new object on the heap, bypassing the pool. Always use `.equals()` for string comparison. `String.intern()` can explicitly add a string to the pool."),
        ("Design", "Why is `String` immutable in Java and what problems would mutable strings cause?",
         "Security: strings are used as HashMap keys, class names, file paths. If mutable, a key could change after insertion, corrupting the HashMap. Thread safety: immutable objects are inherently thread-safe (no synchronization needed). String pool: only possible because strings don't change — two vars safely share the same interned object. Caching hashCode: `String` caches its hashCode (first call computes, subsequent calls return cached) — only safe because the string never changes."),
    ],
    "stringbuilder": [
        ("Reasoning", "Why is `String str = \"\"; for(int i=0;i<1000;i++) str += i;` O(N²) and how does StringBuilder fix it?",
         "Each `+=` creates a NEW String object: copies all existing chars + appends new char. Iteration 1: copy 1 char. Iteration 2: copy 2 chars. ... Iteration N: copy N chars. Total: 1+2+...+N = N(N+1)/2 = O(N²) character copies. StringBuilder uses a resizable internal array. `append()` adds to the end: O(1) amortized. Final `toString()`: O(N) once. Total: O(N)."),
    ],

    # ── GENERICS ──────────────────────────────────────────────────
    "bounded type": [
        ("Reasoning", "`<T extends Comparable<T>>` vs `<T extends Comparable>` — what's the difference and why does the first form matter?",
         "The raw form `<T extends Comparable>` loses type safety — compares apples to oranges at runtime. `<T extends Comparable<T>>` specifies that T can compare WITH ITSELF: `Integer.compareTo(Integer)`, not `Integer.compareTo(Object)`. This is why `Collections.sort()` uses `<T extends Comparable<? super T>>` — T can be compared using its own or a supertype's compareTo."),
    ],

    # ── COLLECTIONS ──────────────────────────────────────────────
    "arraylist": [
        ("Reasoning", "`ArrayList.remove(Object o)` vs `ArrayList.remove(int index)` — you call `list.remove(1)`. Which overload is called and why?",
         "`remove(int index)` — `1` is an `int` literal, not an `Integer`. Java resolves to the exact-match primitive overload first. To call `remove(Object)`, use `list.remove(Integer.valueOf(1))` or `list.remove((Integer)1)`. This is a classic Java gotcha that changes behavior silently."),
        ("Design", "You need to frequently add/remove from both ends of a list AND access by index. Which collection?",
         "None of the standard ones do all three efficiently. Tradeoffs: `ArrayList`: O(1) index access, O(N) front insert/delete. `LinkedList`/`ArrayDeque`: O(1) front/back, O(N) index access. Real solution: if index access can be avoided, use `ArrayDeque`. If all 3 are needed constantly, consider a skip list or re-examine your design."),
    ],
    "hashmap internals": [
        ("Reasoning", "You insert 1000 entries into a HashMap with default capacity 16. How many resize operations happen?",
         "Resize threshold = capacity × 0.75. Resizes at: 12 (16→32), 24 (32→64), 48 (64→128), 96 (128→256), 192 (256→512), 384 (512→1024). Total: 6 resizes. Each resize copies all entries to new bucket array. Pre-sizing: `new HashMap<>(1334)` (1000/0.75 ≈ 1334 → next power of 2 = 2048) avoids all resizes."),
        ("Bug Hunt", "Two `Person` objects with same name and age. You override `equals()` to return true but not `hashCode()`. What happens when used as `HashMap` keys?",
         "Both objects land in DIFFERENT buckets (different hashCodes → different bucket index). The HashMap doesn't check `equals()` across buckets — it goes straight to one bucket. So `map.get(person2)` returns NULL even though `person1.equals(person2)`. Overriding `equals` without `hashCode` violates the contract and breaks all hash-based collections. Always override both together."),
    ],
    "treemap": [
        ("Reasoning", "When should you use `TreeMap` over `HashMap`? What's the actual performance cost?",
         "`TreeMap` use cases: range queries (`subMap`, `headMap`, `tailMap`), ordered iteration, `floorKey`/`ceilingKey`. Cost: every operation is O(log N) vs O(1) avg for HashMap. For 1M entries: HashMap ~1μs, TreeMap ~20μs per operation. Use TreeMap ONLY when sorted order is required — not as a default."),
    ],
    "linkedhashmap": [
        ("Design", "Implement a simple LRU cache using `LinkedHashMap` in 5 lines.",
         "```java\n> Map<K,V> lru = new LinkedHashMap<K,V>(capacity, 0.75f, true) { // accessOrder=true\n>     protected boolean removeEldestEntry(Map.Entry<K,V> eldest) {\n>         return size() > capacity;\n>     }\n> };\n> ```\n> `accessOrder=true` makes iteration order = access order (most recently accessed last). `removeEldestEntry` evicts when over capacity. This is exactly how many simple LRU caches are implemented in production."),
    ],

    # ── FUNCTIONAL ───────────────────────────────────────────────
    "lambda": [
        ("Reasoning", "A lambda captures a local variable. Why must the variable be effectively final?",
         "Lambdas are closures — they capture the variable's VALUE at creation time (not a reference to the stack slot, which would be dangerous as the stack frame may be gone). If the variable could change after capture, the lambda would see a stale value. Java enforces 'effectively final' (never reassigned) to make the semantics predictable. Workaround: use an array `int[] counter = {0};` (the array reference is final, its contents can change — though this is not thread-safe)."),
    ],
    "stream": [
        ("Reasoning", "`list.stream().filter().map().collect()` — at which point does data actually start flowing through the pipeline?",
         "Not until `collect()` (or any terminal operation). `filter()` and `map()` are LAZY — they build a pipeline description but process nothing. When the terminal operation is called, the pipeline pulls elements through lazily: one element passes through the entire pipeline before the next is processed. This means: early termination with `findFirst()` is O(1) if the first element matches, not O(N)."),
        ("Bug Hunt", "You call `stream.filter(...).collect(...)` twice on the same stream. What happens?",
         "`IllegalStateException: stream has already been operated upon or closed`. Streams are single-use. Once a terminal operation is called, the stream is consumed. Fix: create a new stream from the source each time, or collect to a `List` first and stream the list repeatedly."),
    ],
    "optional": [
        ("Reasoning", "`Optional.get()` without `isPresent()` check — what's the point of Optional then?",
         "`Optional.get()` is a code smell. The right API: `orElse(default)`, `orElseGet(supplier)`, `orElseThrow()`, `map(fn)`, `ifPresent(consumer)`. Optional's value: it makes the ABSENCE of a value explicit in the type signature — callers MUST handle the empty case. Using `get()` defeats this. Rule: never call `get()` unless you've already verified presence through the Optional API."),
    ],

    # ── OOP ───────────────────────────────────────────────────────
    "solid": [
        ("Reasoning", "Open/Closed Principle says 'closed for modification'. Does this mean code can NEVER be changed?",
         "No — it means don't modify existing, tested behavior to add new features. Add new classes/methods instead. In practice: use interfaces + plugins. Adding a new payment type = new class implementing `PaymentStrategy`. Not modifying `PaymentProcessor`. The existing processor is 'closed' (don't touch tested code). The system is 'open' (easily extend by adding new implementations)."),
        ("Design", "A class has 5 public methods but clients only use 1-2. Which SOLID principle is violated and what's the fix?",
         "Interface Segregation Principle (ISP): clients shouldn't depend on methods they don't use. Fix: split the class into smaller, focused interfaces. `Printable`, `Scannable`, `FaxMachine` instead of one `AllInOnePrinter`. Each client implements/uses only the interface it needs."),
    ],
    "design pattern": [
        ("Design", "Factory Method vs Abstract Factory — give a concrete example showing when each is appropriate.",
         "Factory Method: `DocumentParser.createParser(fileType)` returns a `PdfParser` or `DocxParser`. One product family, one creator. Abstract Factory: `UIFactory` with `createButton()` + `createTextField()` + `createDialog()`. A `WindowsUIFactory` and `MacUIFactory` each create a FAMILY of related components. Use Abstract Factory when multiple interdependent products must be created together from the same family."),
        ("Reasoning", "Singleton is often called an anti-pattern. Why?",
         "1) Hidden global state — any code can access/modify the singleton, making dependencies implicit and testing hard. 2) Tight coupling — hard to swap implementation (no interface). 3) Concurrency: lazy init needs double-checked locking. 4) Violates SRP often. Better: use dependency injection — pass the single instance as a constructor argument. The DI container manages lifecycle. You get the same 'one instance' behavior with testability and explicit dependencies."),
    ],

    # ── DSA ───────────────────────────────────────────────────────
    "binary search": [
        ("Reasoning", "Binary search on `[1,3,5,7,9]` with `target=6`. Trace `lo`, `hi`, `mid` at each step and explain the final state.",
         "lo=0,hi=4 → mid=2(val=5): 5<6 → lo=3. lo=3,hi=4 → mid=3(val=7): 7>6 → hi=2. lo(3)>hi(2): loop ends, return -1 (not found). Key insight: lo overtakes hi — this is the standard termination condition. `lo` ends at the insertion point where 6 would go."),
        ("Design", "Binary search on a rotated array `[4,5,6,7,0,1,2]`. How do you determine which half is sorted?",
         "Compare `nums[lo]` and `nums[mid]`. If `nums[lo] <= nums[mid]`: left half is sorted. Check if target is in `[nums[lo], nums[mid])` — if yes, search left; else search right. Otherwise right half is sorted. Check if target is in `(nums[mid], nums[hi]]` — if yes, search right; else search left. This always works because at least one half of a rotated sorted array is always sorted."),
    ],
    "two pointers": [
        ("Reasoning", "Two-pointer pattern reduces O(N²) brute force to O(N). What is the KEY invariant that makes this safe?",
         "The invariant: all pairs we SKIP are guaranteed to not contain the answer. In 3Sum: once we fix `nums[i]` and use l/r pointers, we can safely skip because the array is sorted. If `sum > 0`: decreasing r decreases the sum (smaller right value). If `sum < 0`: increasing l increases the sum (larger left value). We never skip a valid pair because monotonicity guarantees it."),
    ],
    "sliding window": [
        ("Reasoning", "Sliding window guarantees O(N). How? Each element is added and removed exactly how many times?",
         "Each element enters the window exactly ONCE (right pointer advances past it) and leaves exactly ONCE (left pointer advances past it). Total operations: 2N regardless of window size changes. Compare to brute force: for each ending position, scan back to find optimal start = O(N²). The window's state (sum, freq map, etc.) is maintained INCREMENTALLY — O(1) per pointer move."),
        ("Bug Hunt", "Minimum Window Substring: the while loop to shrink the window runs `while(valid) { shrink; }`. What's wrong with this logic?",
         "Should shrink `while(valid)` to find the minimum window — this is correct! But the common bug: not updating `left++` BEFORE rechecking validity, or forgetting to update the answer BEFORE shrinking. The answer should be captured at the moment the window first becomes valid, then kept updated as we shrink to find smaller valid windows."),
    ],
    "recursion": [
        ("Reasoning", "Every recursive algorithm can be converted to iterative. What data structure replaces the call stack?",
         "An explicit `Stack<State>` where State holds what the stack frame would hold (current node, remaining work, partial results). DFS → explicit stack. Factorial → accumulator variable (tail recursion → loop). Tree traversal → stack with nodes + 'visited' flag. When to use recursion vs iteration: recursion = cleaner code when tree/graph depth is bounded. Iteration = necessary when depth is unbounded (stack overflow risk) or when performance is critical."),
        ("Bug Hunt", "```java\nvoid fib(int n) { return n<=1 ? n : fib(n-1) + fib(n-2); }\nfib(50) // takes forever\n```\nWhy and what are the 3 fixes?",
         "Exponential time O(2^N) — `fib(n-1)` and `fib(n-2)` each recursively recompute the same subproblems billions of times. Fix 1: Memoization — `Map<Integer,Long> memo`, return early if computed. O(N) time, O(N) space. Fix 2: Bottom-up DP — array `dp[i] = dp[i-1] + dp[i-2]`. O(N) time, O(N) space. Fix 3: O(1) space — just track last two values with two variables. O(N) time, O(1) space."),
    ],
    "dynamic programming": [
        ("Reasoning", "How do you identify that a problem requires DP vs Greedy? What's the key test?",
         "Greedy test: does the locally optimal choice always lead to the globally optimal solution? (Prove via exchange argument.) If yes → greedy. If making a local choice requires knowing future choices → DP. Example: Coin Change with standard coins [1,5,10,25] → greedy works (always pick largest). Coin Change with coins [1,3,4] and amount 6 → greedy picks 4+1+1=3 coins, optimal is 3+3=2 coins. Greedy fails → DP."),
        ("Design", "You need to find the number of ways to climb N stairs taking 1 or 2 steps at a time. Define the DP state and recurrence.",
         "State: `dp[i]` = number of ways to reach step i. Recurrence: `dp[i] = dp[i-1] + dp[i-2]` (come from step i-1 via 1 step, or from step i-2 via 2 steps). Base: `dp[0]=1` (one way: don't move), `dp[1]=1`. This is exactly Fibonacci. Space optimization: only need last 2 values → O(1) space."),
    ],
    "graph": [
        ("Reasoning", "BFS finds shortest path in unweighted graphs but not in weighted graphs. Why exactly?",
         "BFS explores by 'hop count' (number of edges). Each level = one more edge away from source. All edges are treated as weight=1. In a weighted graph, the 'shortest by hop count' path may not be 'shortest by weight sum'. Example: A→B (weight 1, 1 hop) vs A→C→B (weight 0.1+0.1=0.2, 2 hops). BFS finds A→B (1 hop), Dijkstra finds A→C→B (lower total weight). BFS is optimal ONLY when all edges have equal weight."),
        ("Design", "Detect if a directed graph has a cycle. Write the algorithm and explain why we need 3 states (not 2).",
         "3 states: UNVISITED, IN_PROGRESS (currently in DFS path), DONE. DFS: mark node IN_PROGRESS before visiting neighbors. If we reach an IN_PROGRESS node → cycle found. Mark DONE when all neighbors processed. Why 3 states: with 2 (visited/unvisited), we'd get false positives — reaching a VISITED node that was processed in a DIFFERENT DFS subtree is not a cycle. IN_PROGRESS specifically marks nodes in the CURRENT DFS path (potential back edge)."),
    ],
    "sorting": [
        ("Reasoning", "QuickSort average O(N log N) but worst case O(N²). When exactly does the worst case happen and how do you prevent it?",
         "Worst case: pivot always ends up at position 0 or N-1 (completely unbalanced partition). This happens when: (1) always picking first/last element as pivot on already-sorted or reverse-sorted data. (2) Pivot happens to be the minimum or maximum. Prevention: random pivot (randomized quicksort — expected O(N log N) even on adversarial input), or median-of-three (pick median of first/middle/last element as pivot). Java's dual-pivot quicksort uses careful pivot selection to avoid this."),
    ],
    "greedy": [
        ("Reasoning", "Interval scheduling: select maximum number of non-overlapping intervals. Why does sorting by END time work, not by START time or duration?",
         "Sorting by end time: greedily picking the interval that ends earliest leaves maximum time for future intervals. Formal proof (exchange argument): suppose optimal solution picks interval A instead of interval B (B ends earlier). We can swap A for B without losing any other interval (B ends ≤ A ends, so anything compatible with A is also compatible with B). Sorting by start time fails: a very long interval starting early would block many shorter intervals. Sorting by duration fails: a short interval might overlap two others."),
    ],

    # ── SQL ───────────────────────────────────────────────────────
    "join": [
        ("Reasoning", "`LEFT JOIN` returns all rows from the left table. When does it return MORE rows than the left table?",
         "When the right table has MULTIPLE matching rows for one left-table row. Example: Orders LEFT JOIN OrderItems — one order with 5 items = 5 result rows for that one order. Analogy: `1 order × 5 items = 5 rows`. Always check your join multiplicity. Use `SELECT COUNT(*) vs COUNT(DISTINCT left.id)` to detect row explosion."),
        ("Bug Hunt", "`SELECT * FROM A, B WHERE A.id = B.a_id` — what join type is this and is it equivalent to `A JOIN B ON A.id = B.a_id`?",
         "It's an old-style INNER JOIN. Functionally equivalent to `A INNER JOIN B ON A.id = B.a_id` — only returns rows where both sides match. BUT: the comma syntax is dangerous. Forgetting the WHERE clause on a multi-table comma join → CROSS JOIN (cartesian product). Explicit JOIN syntax with ON makes intent clear and prevents the accidental cross join."),
    ],
    "index": [
        ("Reasoning", "Table has index on `(first_name, last_name)`. Which queries use the index and which don't?",
         "`WHERE first_name='John'` → ✅ uses index (leading column). `WHERE first_name='J' AND last_name='Smith'` → ✅ uses full index. `WHERE last_name='Smith'` → ❌ can't use index (not the leading column; B-tree is sorted by first_name first). `WHERE first_name='J' OR last_name='S'` → ❌ OR can't efficiently use a single B-tree index. Rule: composite index can be used only when the leading column(s) are in the WHERE clause."),
        ("Design", "When is a full table scan FASTER than using an index?",
         "When the query returns a large fraction of rows (>5-15% of table). Sequential full scan: reads data in large blocks (HDD: ~100MB/s, SSD: ~500MB/s). Index lookup: jumps to random positions for each row (random I/O: ~1ms/seek on HDD). 10,000 random I/Os = 10 seconds. Sequential scan of same data: < 1 second. DB query optimizer considers this — it switches to full scan when estimated rows exceed a threshold."),
    ],
    "window function": [
        ("Reasoning", "Why can't you use a window function in a WHERE clause? How do you filter on window function results?",
         "Window functions run in a logical step AFTER WHERE filtering. The WHERE clause operates on base rows; window functions are computed on the result set. Solution: wrap in a subquery/CTE. `WITH ranked AS (SELECT *, ROW_NUMBER() OVER(...) rn FROM t) SELECT * FROM ranked WHERE rn = 1`. This is 'standard' pattern for top-N-per-group."),
        ("Design", "`ROW_NUMBER()` vs `RANK()` vs `DENSE_RANK()` — show with an example where they produce different results.",
         "Scores: [100, 90, 90, 80]. ROW_NUMBER: 1,2,3,4 (always unique, arbitrary for ties). RANK: 1,2,2,4 (gives same rank to ties, SKIPS the next rank). DENSE_RANK: 1,2,2,3 (same rank to ties, NO skipping). Use: ROW_NUMBER for pagination (must be unique). RANK when you want 'no 3rd place if two tied for 2nd'. DENSE_RANK when you want consecutive ranks despite ties."),
    ],
    "transaction": [
        ("Reasoning", "Two transactions T1 and T2 both run `SELECT balance WHERE id=1; UPDATE balance=balance-100 WHERE id=1`. What anomaly occurs at READ COMMITTED and how does REPEATABLE READ fix it?",
         "READ COMMITTED: both T1 and T2 read balance=1000. Both compute 900. Both write 900. Final balance: 900 (expected: 800). Lost update! REPEATABLE READ (with locking SELECT FOR UPDATE): first SELECT acquires a read lock. T2's SELECT blocks until T1 commits. After T1 commits (balance=900), T2 reads 900, writes 800. Correct! Alternatively: use `UPDATE ... WHERE balance=1000` (optimistic locking with version check)."),
    ],

    # ── NETWORKING / DEVOPS ───────────────────────────────────────
    "tcp": [
        ("Reasoning", "A TCP connection is in TIME_WAIT state. What is it waiting for and why 2×MSL (Maximum Segment Lifetime)?",
         "TIME_WAIT: the side that sent the last ACK waits before fully closing. Why 2×MSL (~60-120 seconds): (1) Ensure the final ACK reached the other side (if it was lost, the other side will retransmit FIN — we need to still be listening to send a new ACK). (2) Allow all old segments in the network to expire (segment with old sequence number arriving for a new connection could corrupt data). Fast servers on many short connections: TIME_WAIT exhaustion → `SO_REUSEADDR`, `tcp_time_wait_reuse`, or HTTP keep-alive."),
    ],
    "http": [
        ("Reasoning", "`Connection: keep-alive` vs HTTP/2 — what does each one do differently for multiplexing?",
         "HTTP/1.1 keep-alive: reuse ONE TCP connection for sequential requests. Still head-of-line blocking — request 2 waits for response 1. HTTP/2: one TCP connection, but requests are multiplexed as frames with stream IDs. Multiple requests in-flight simultaneously. Response frames for different streams are interleaved. HTTP/2 also has header compression (HPACK) and server push. Still has TCP HOL blocking (one lost packet blocks all streams). HTTP/3 (QUIC): uses UDP, per-stream reliability, eliminates TCP HOL blocking entirely."),
    ],
    "dns": [
        ("Reasoning", "Your service's DNS TTL is 300s. You deploy to a new IP. When is traffic fully migrated?",
         "Not immediately — each DNS resolver caches the old IP for up to its remaining TTL (up to 300s). As resolvers' caches expire, they re-query and get the new IP. Some ISP resolvers ignore TTL (cap at 5-10 minutes). Full migration: typically 5-30 minutes in practice despite low TTL. Strategy: lower TTL to 60s ONE WEEK before migration. After migration confirmed, restore TTL to normal. Never start migration with a high TTL (24h)."),
    ],
    "docker": [
        ("Reasoning", "Docker image layers — if you modify a file in layer 3, what happens to layers 4 and 5?",
         "In the overlay filesystem, modifying a file in a lower layer creates a COPY in the write layer (copy-on-write). The original lower layer is unchanged. But in image BUILD: if Dockerfile instruction 3 changes, layers 4 and 5 are INVALIDATED — Docker can't reuse cached layers. Rule: put instructions that change most often LAST in Dockerfile. Dependencies (`npm install`, `mvn package`) before source code copies — this maximizes cache reuse."),
        ("Design", "What's the difference between `COPY` and `ADD` in Dockerfile? When should you use each?",
         "`COPY`: copies files/directories from build context to image. Simple and explicit. `ADD`: everything COPY does PLUS: auto-extracts tar archives (`.tar.gz`), fetches remote URLs (HTTP/HTTPS). Best practice: always use `COPY` unless you specifically need tar extraction. `ADD`'s URL feature is dangerous (no checksum validation, downloads at build time) and breaks reproducibility. Use `RUN curl | tar xz` instead for remote archives."),
    ],
    "kubernetes": [
        ("Reasoning", "Your K8s pod is stuck in `CrashLoopBackOff`. How do you diagnose it step by step?",
         "1) `kubectl describe pod <name>` — check Events section for reasons. 2) `kubectl logs <pod> --previous` — see logs from the CRASHED container (not the current restart). 3) Check: OOMKilled (out of memory → increase memory limit), exit code 1 (app error → check logs), exit code 137 (SIGKILL from OOM or liveness probe). 4) If liveness probe failing: disable temporarily to investigate live state. 5) Check startup probe vs liveness probe config — maybe app needs more init time."),
        ("Design", "Explain the difference between a liveness probe and a readiness probe. What happens when each fails?",
         "**Liveness**: is the pod healthy? Failure → K8s KILLS and restarts the pod. Use for: hung processes that are running but unresponsive. **Readiness**: is the pod ready to serve traffic? Failure → pod is REMOVED from Service endpoints (no traffic sent), but NOT restarted. Use for: app still initializing, temporarily overloaded, downstream dependency unavailable. Common mistake: using liveness for readiness scenarios → pod gets killed/restarted when it should just be temporarily excluded from load balancing."),
    ],

    # ── REACT ────────────────────────────────────────────────────
    "usestate": [
        ("Reasoning", "You call `setState(state.value + 1)` twice in the same event handler. The value increments by 1, not 2. Why?",
         "Both calls use the SAME `state` closure value captured at render time. Both compute `oldValue + 1` and schedule the same update. React batches them into one re-render. Fix: use functional update `setState(prev => prev + 1)`. Each functional update receives the most recent pending state — two calls correctly increment by 2. Always use functional update when new state depends on old state."),
        ("Bug Hunt", "You initialize state as `useState(expensiveComputation())`. The function runs on EVERY render. How do you fix it?",
         "`useState(expensiveComputation)` (pass the function, don't call it). This is 'lazy initialization' — React calls the function once during initial render only. The difference: `useState(fn())` calls `fn` every render but ignores the result after mount. `useState(fn)` calls `fn` only once. Same pattern: `useReducer(reducer, undefined, expensiveInit)`."),
    ],
    "useeffect": [
        ("Reasoning", "A useEffect with dependency `[user]` runs after every render where `user` changes. But `user` is an object. What subtle bug can occur?",
         "React uses `Object.is()` to compare dependency values (===). A new object reference is ALWAYS different from the previous one even if the content is identical: `{name:'John'} !== {name:'John'}`. If the parent creates a new `user` object each render, the effect runs on every parent render even though the data didn't change. Fix: depend on `user.id` (primitive) instead, or `useMemo` to stabilize the reference."),
        ("Design", "When does `useEffect` cleanup run? Give a concrete scenario where missing cleanup causes a bug.",
         "Cleanup runs: (1) before the effect runs again (when deps change), (2) when the component unmounts. Bug scenario: effect fetches data and updates state. User navigates away (unmounts) before fetch completes. Fetch completes → tries to `setState` on unmounted component → React warning (memory leak). Fix: `let cancelled = false; return () => { cancelled = true; }` — check `if (!cancelled) setState(data)`."),
    ],
    "context": [
        ("Reasoning", "When does React Context cause performance problems and how do you avoid them?",
         "Every context consumer re-renders when ANY context value changes. If you have `{theme, user, cart}` in one context, updating cart re-renders all theme and user consumers. Fixes: (1) Split into separate contexts: `ThemeContext`, `UserContext`, `CartContext`. (2) Memoize components with `React.memo`. (3) For complex state, use a state library (Zustand, Jotai) with selector-based subscriptions — only re-render when the specific piece of state changes."),
    ],

    # ── JAVASCRIPT ───────────────────────────────────────────────
    "promise": [
        ("Reasoning", "`Promise.all([p1,p2,p3])` — p2 rejects. What happens to p1 and p3?",
         "`Promise.all` rejects immediately when ANY promise rejects (fail-fast). p1 and p3 are still running — their promises continue executing, but their results are ignored. If they reject too, those rejections are also silently ignored (potential unhandled rejection warnings). Use `Promise.allSettled` to wait for ALL to complete regardless of success/failure, getting all results including errors."),
        ("Design", "Implement `Promise.race` from scratch.",
         "```javascript\n> function race(promises) {\n>     return new Promise((resolve, reject) => {\n>         promises.forEach(p => Promise.resolve(p).then(resolve, reject));\n>         // First to resolve OR reject wins — others are ignored\n>     });\n> }\n> ```\n> Once the first promise settles, the outer promise is settled. Other promises continue running internally but their results are discarded."),
    ],
    "async await": [
        ("Reasoning", "`await Promise.all([fetch(a), fetch(b)])` vs `await fetch(a); await fetch(b)`. What's the performance difference?",
         "`Promise.all`: both fetches START simultaneously (concurrent). Total time = max(timeA, timeB). Sequential awaits: fetch B doesn't start until fetch A completes. Total time = timeA + timeB. For independent requests, ALWAYS use `Promise.all`. Sequential await is only appropriate when B depends on A's result."),
        ("Bug Hunt", "An `async` function has `try { await doWork(); } catch(e) {}`. `doWork()` rejects. Is the rejection handled?",
         "Yes — `await` unwraps the rejected promise and throws the rejection value as a synchronous error, which is caught by the `catch` block. Without `try/catch` around `await`: unhandled rejection. Without `await` (just `doWork()`): the rejection is a separate promise — the `try/catch` CANNOT catch it (it's asynchronous). Always `await` async calls if you want to catch their rejections synchronously."),
    ],
    "closure": [
        ("Reasoning", "What is a closure and why can't garbage collection remove variables that are closed over?",
         "A closure is a function that retains a reference to its lexical environment (the scope where it was created). Variables closed over are kept alive by the closure reference — GC can't collect them because there's still a reference (the closure's internal scope). Memory leak scenario: large data object captured in a closure, closure stored in a long-lived event listener → data stays in memory for the page's lifetime. Fix: explicitly null the large variable after use, or use a WeakRef."),
    ],
    "prototype": [
        ("Reasoning", "`Object.create(proto)` vs `new Constructor()` — what's the practical difference?",
         "`new Constructor()`: runs the constructor function (initializes instance properties), sets `__proto__` to `Constructor.prototype`. `Object.create(proto)`: creates an object with `proto` as its prototype, NO constructor called. Use `Object.create(null)` to create a pure dictionary with no inherited properties (no `toString`, `hasOwnProperty`, etc.) — useful for safe maps. `Object.create(SomeClass.prototype)` creates an instance-like object without running the constructor (used in class inheritance setup)."),
    ],

    # ── PYTHON ───────────────────────────────────────────────────
    "decorator": [
        ("Reasoning", "Why does a decorator without `@functools.wraps` break Flask/FastAPI route registration?",
         "Flask uses function name (`func.__name__`) to register routes. Without `@functools.wraps`, the decorator replaces the original function with a `wrapper` function. All decorated routes have `__name__ = 'wrapper'` → duplicate view function name error. `@functools.wraps(fn)` copies `__name__`, `__doc__`, `__annotations__`  from the wrapped function. Same issue with pytest markers, Celery tasks, and any framework that inspects function attributes."),
    ],
    "generator": [
        ("Reasoning", "A generator that yields 1,000,000 numbers — what's its memory footprint vs a list?",
         "Generator: O(1) — stores only the current execution state (stack frame: local variables, instruction pointer). ~200-300 bytes total, regardless of N. List: O(N) — stores all 1M integer objects. 1M Python ints ≈ 28MB (small ints cached, but larger ints ~28 bytes each). Generators are essential for: large file processing (yield one line at a time), infinite sequences, streaming pipelines where you process and discard data."),
    ],
    "metaclass": [
        ("Reasoning", "What is a metaclass and how does Django's ORM use it?",
         "A metaclass is the 'class of a class' — it defines how class objects are created. When you define `class Model(models.Model)`, Django's metaclass intercepts class creation. It inspects all class attributes, finds `Field` instances, registers them in the ORM, creates the database schema mapping, adds manager methods, etc. — all automatically at class definition time. You rarely write metaclasses; you USE them via framework base classes. Alternative: `__init_subclass__` (simpler, Python 3.6+)."),
    ],

    # ── ML / DS ──────────────────────────────────────────────────
    "gradient descent": [
        ("Reasoning", "Learning rate too high vs too low — what exactly goes wrong in each case?",
         "Too HIGH: overshoot the minimum, oscillate or diverge. Loss increases instead of decreasing. Extreme: NaN loss (floating point overflow). Too LOW: convergence is extremely slow. May get stuck in local minima (can't jump over small bumps). Training takes 10-100x longer. Solution: learning rate scheduling — start higher, decay over time (cosine annealing, step decay). Adam optimizer: adaptive per-parameter learning rates — less sensitive to initial LR choice."),
    ],
    "overfitting": [
        ("Reasoning", "Training accuracy 99%, validation accuracy 70%. What exactly is overfitting and what are 5 ways to fix it?",
         "Overfitting: model memorized training data including noise — it doesn't generalize. Fixes: (1) More training data (more examples → harder to memorize). (2) Dropout — randomly zero neurons during training (prevents co-adaptation). (3) L1/L2 regularization — penalize large weights in loss function. (4) Reduce model complexity (fewer layers/parameters). (5) Early stopping — stop training when validation loss stops improving. (6) Data augmentation — create variant training examples."),
    ],

    # ── SPRING BOOT ──────────────────────────────────────────────
    "dependency injection": [
        ("Reasoning", "Constructor injection vs field injection (`@Autowired` on field) — which is better and why?",
         "Constructor injection is better: (1) Dependencies explicit — you can't create object without them. (2) Immutable — field can be `final`. (3) Testable — inject mocks via constructor, no Spring context needed. (4) Detects circular deps at startup, not at first use. Field injection: shorter code but: hidden dependencies, can't be `final`, requires Spring for test setup, circular deps detected late. Spring itself recommends constructor injection since v4."),
    ],
    "spring security": [
        ("Reasoning", "JWT vs session cookies — what are the tradeoffs for a distributed microservices architecture?",
         "JWT: stateless — any service can validate without a DB call (verify signature with public key). No sticky sessions needed. Downside: can't invalidate a token before expiry (no server-side state). Session cookies: stateful — easy to invalidate (delete session). But: need a shared session store (Redis) for multi-instance deployments, or sticky sessions (load balancer routing). Microservices: JWT wins for scalability. Add a token blacklist (Redis) if revocation is needed."),
    ],
    "jpa hibernate": [
        ("Reasoning", "N+1 query problem — explain with a concrete JPA example and show the fix.",
         "```java\n> // N+1: fetches all orders (1 query), then for EACH order fetches customer (N queries)\n> List<Order> orders = orderRepo.findAll(); // 1 query\n> orders.forEach(o -> System.out.println(o.getCustomer().getName())); // N queries!\n>\n> // Fix 1: JOIN FETCH\n> @Query(\"SELECT o FROM Order o JOIN FETCH o.customer\")\n> List<Order> findAllWithCustomer();\n>\n> // Fix 2: EntityGraph\n> @EntityGraph(attributePaths = \"customer\")\n> List<Order> findAll();\n> ```\n> Both load orders + customers in ONE query (JOIN). Always check Hibernate's SQL log in development."),
    ],
    "microservices": [
        ("Reasoning", "Service A calls Service B which calls Service C. C is slow. How does this cause a cascade failure?",
         "Without circuit breakers: A has a thread pool for B calls. B is slow (waiting for C) → B responses are slow → A's thread pool fills with waiting threads → A's thread pool exhausted → A becomes slow for ALL callers, not just B-related ones. Cascade: C slow → B slow → A slow → entire system degraded. Fix: Resilience4j circuit breaker — after N failures, 'open' the circuit → fail fast with fallback response instead of waiting. Timeouts + bulkhead patterns to isolate failure."),
    ],

    # ── SYSTEM DESIGN ────────────────────────────────────────────
    "caching": [
        ("Design", "Cache-aside vs write-through vs write-behind — when does each cause stale data?",
         "Cache-aside (lazy load): on cache miss, load from DB and populate cache. Stale: if DB updated externally (direct DB write bypassing cache). Write-through: write to cache AND DB simultaneously. Stale: never (cache always reflects writes). Write-behind (write-back): write to cache, async write to DB. Stale: if cache crashes before DB write → data loss. Rule: cache-aside for read-heavy. Write-through for write+read. Write-behind for write-heavy (accept loss risk)."),
    ],
    "load balancing": [
        ("Reasoning", "Round-robin load balancing sends requests to servers 1,2,3,1,2,3. Why does this fail for stateful sessions?",
         "Session data (shopping cart, auth state) is stored on ONE server. Round-robin sends the NEXT request to a different server which has NO session data → user is logged out, cart is empty. Solutions: (1) Sticky sessions (session affinity) — LB routes user to the same server based on cookie. Single point of failure risk. (2) Externalize session to Redis — all servers share one session store. (3) Stateless auth (JWT) — no server-side session needed. Modern preference: stateless design + JWT."),
    ],

    # ── PATTERNS ─────────────────────────────────────────────────
    "prefix sum": [
        ("Reasoning", "Prefix sum initialized as `prefix[0] = 0` — why the leading zero and not `prefix[0] = arr[0]`?",
         "`prefix[0] = 0` (empty prefix) makes range sum formula uniform: `sum(l,r) = prefix[r+1] - prefix[l]`. Without the 0: `sum(0,r) = prefix[r] - 0` (special case needed). With it: `sum(0,r) = prefix[r+1] - prefix[0] = prefix[r+1]`. Same formula everywhere. This is the 'sentinel' pattern — adding a dummy initial value to eliminate special cases. Same trick used in dummy linked list nodes."),
    ],
    "monotonic stack": [
        ("Reasoning", "Monotonic DECREASING stack — when you push a new element, which existing elements are popped and what information do those pops tell you?",
         "In a decreasing stack (top is smallest), pushing element `x`: all elements smaller than `x` are popped. For each popped element `y`: `x` is the NEXT GREATER ELEMENT of `y`. This is the key insight: the pop event = answer event. Application: Daily Temperatures (next warmer day), Largest Rectangle in Histogram (right boundary), Next Greater Element. Each element is pushed and popped exactly once → O(N) total."),
    ],
    "union find": [
        ("Reasoning", "Without path compression in Union-Find, what's the worst-case tree height after N unions? With path compression?",
         "Without path compression + union by rank: O(N) height possible (linear chain). With union by rank only: O(log N). With path compression only: amortized O(log N). With BOTH: amortized O(α(N)) where α is the inverse Ackermann function — practically constant (4 for any N up to 10^80). Union by rank prevents tall trees from forming. Path compression flattens existing trees. Together they're nearly optimal."),
    ],
}

# ─────────────────────────────────────────────────────────────────────────────
# HEADING MATCHING
# ─────────────────────────────────────────────────────────────────────────────

def find_challenges_for_heading(heading_text):
    """Match heading text to a challenge block."""
    text = heading_text.lower().strip()
    # Remove leading #, ?, emoji and numbering
    text = re.sub(r'^[#\s🔴🟡🟢🧩🔬⭐?!.0-9]+', '', text).strip()

    best_match = None
    best_score = 0

    for key, challenges in HEADING_CHALLENGES.items():
        key_words = key.lower().split()
        score = sum(1 for w in key_words if w in text)
        # Bonus for exact phrase match
        if key.lower() in text:
            score += 3
        if score > best_score and score >= 1:
            best_score = score
            best_match = (key, challenges)

    return best_match

# ─────────────────────────────────────────────────────────────────────────────
# INJECT INTO FILE
# ─────────────────────────────────────────────────────────────────────────────

def process_file(filepath):
    """Read file, inject challenges after matching ## sections."""
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()

        # Skip files already processed with inline markers
        if INLINE_MARKER in content:
            return 0  # Already has inline challenges

        # Split into lines for processing
        lines = content.splitlines(keepends=True)
        new_lines = []
        injected = 0
        i = 0

        while i < len(lines):
            line = lines[i]
            new_lines.append(line)

            # Look for ## headings (but not ### or ####)
            heading_match = re.match(r'^##\s+(.+)', line.rstrip())
            if heading_match and not re.match(r'^###', line):
                heading_text = heading_match.group(1)

                # Skip if this heading is inside a code block (check context)
                # Skip section headers that are already challenge sections
                skip_keywords = ['practice', 'interview', 'challenge', 'quick fire',
                                  'level 1', 'level 2', 'level 3', 'level 4', 'level 5',
                                  'mcq', 'checkpoint', 'conceptual', 'deep conceptual',
                                  'navigation', 'key takeaway', 'index', '5w1h', 'the 5w1h']
                if any(kw in heading_text.lower() for kw in skip_keywords):
                    i += 1
                    continue

                # Find challenges
                match = find_challenges_for_heading(heading_text)
                if match:
                    key, challenges = match
                    # Collect the section content — find where this section ends
                    # (next ## heading or end of file)
                    section_end = i + 1
                    while section_end < len(lines):
                        if re.match(r'^##\s', lines[section_end]) or re.match(r'^#\s', lines[section_end]):
                            break
                        section_end += 1

                    # Find insertion point: find last non-empty line before next ## heading
                    insert_after = section_end - 1
                    while insert_after > i and lines[insert_after].strip() in ('', '---', '```'):
                        insert_after -= 1

                    # Build challenge block
                    title = heading_text.strip().lstrip('#').strip()
                    block = make_block(title, challenges[:2])  # Max 2 challenges per section

                    # We'll track that we need to inject at section_end position
                    # Use a different approach: process line by line, inject before next heading

                    # Actually, let's add remaining lines up to section end, then inject
                    for j in range(i + 1, section_end):
                        new_lines.append(lines[j])
                    new_lines.append('\n')
                    new_lines.append(block + '\n')
                    injected += 1
                    i = section_end
                    continue

            i += 1

        if injected > 0:
            new_content = ''.join(new_lines)
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            return injected
        return 0

    except Exception as e:
        print(f"[ERR] {filepath}: {e}")
        return 0

# ─────────────────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────────────────

SKIP_NAME_PATTERNS = [
    '00_index', '00_master', '00_textbook', '00_daily',
    'day_0', 'day_1', 'day_2', 'day_3',
    'daily_habits', '15_day_pattern', 'sprint_index',
    'ds_problem_bridges', 'pdf_coverage', 'pdf_topic',
    'diagram-audit', 'diagram-authoring',
    'add_practice', 'add_conceptual', 'add_inline', 'replace_ascii', 'expand_array',
]

def should_skip(filepath):
    name = os.path.basename(filepath).lower()
    return any(pat in name for pat in SKIP_NAME_PATTERNS)

def main():
    total_files = 0
    total_injections = 0

    for root, dirs, files in os.walk(BASE):
        dirs[:] = [d for d in dirs if not d.startswith('.') and d != '_archive']
        for file in sorted(files):
            if not file.endswith('.md'):
                continue
            filepath = os.path.join(root, file)
            if should_skip(filepath):
                continue

            injected = process_file(filepath)
            if injected > 0:
                total_files += 1
                total_injections += injected
                print(f"[OK] {injected:3d} challenges → {os.path.relpath(filepath, BASE)}")

    print(f"\n{'='*65}")
    print(f"  Files updated          : {total_files}")
    print(f"  Total challenge blocks : {total_injections}")
    print(f"{'='*65}")

if __name__ == '__main__':
    main()
