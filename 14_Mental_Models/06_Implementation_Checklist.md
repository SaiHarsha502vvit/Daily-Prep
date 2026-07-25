> **Navigation**: [< Previous](05_Universal_Problem_Framework.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](07_SQL_Mental_Pipeline.md)

# ✅ Implementation Checklist — Things to Remember While Writing Code

> **The key insight**: Most bugs aren't from wrong algorithms — they're from careless implementation mistakes. This checklist prevents the 20 most common errors that cost you time in interviews and contests.

---

## Part 1: Before You Write ANY Code

```
□ Do I have a clear plan? (Can I explain my approach in 2-3 sentences?)
□ What data structures am I using? (Declared them mentally)
□ What are my key variables? (Named them meaningfully)
□ Did I handle the edge cases in my head?
  □ Empty input (null, length 0)
  □ Single element
  □ All same values
  □ Very large input (will my approach TLE?)
```

---

## Part 2: The Big 10 — Most Common Bugs

### Bug #1: Off-by-One Errors

```java
// WRONG: Accessing arr[n] (index out of bounds)
for (int i = 0; i <= arr.length; i++)  // ❌ <= should be <

// CORRECT:
for (int i = 0; i < arr.length; i++)   // ✅

// REMEMBER:
// Array index: 0 to n-1
// String index: 0 to s.length()-1
// Substring: s.substring(start, end) → end is EXCLUSIVE
// Loop n times: for (i = 0; i < n; i++)
// Loop from a to b inclusive: for (i = a; i <= b; i++)
```

### Bug #2: Integer Overflow

```java
// WRONG: Overflow when multiplying
int result = a * b;  // ❌ if a,b are large → overflow

// CORRECT: Cast to long BEFORE multiplication
long result = (long) a * b;  // ✅

// Common overflow traps:
// - Sum of array elements → use long
// - Factorial → use long (13! > Integer.MAX_VALUE)
// - mid = (left + right) / 2 → mid = left + (right - left) / 2
// - Modular arithmetic → apply mod at each step
```

### Bug #3: Null Pointer

```java
// ALWAYS check before using:
if (node != null && node.val == target)  // ✅ Short-circuit
if (str != null && !str.isEmpty())       // ✅
if (list != null && !list.isEmpty())     // ✅

// Tree traversal: ALWAYS check null first
if (root == null) return;  // Base case FIRST
```

### Bug #4: Modifying Collection While Iterating

```java
// WRONG:
for (int item : list) {
    if (condition) list.remove(item);  // ❌ ConcurrentModification
}

// CORRECT: Use Iterator or collect indices first
Iterator<Integer> it = list.iterator();
while (it.hasNext()) {
    if (condition) it.remove();  // ✅
}

// OR: Build a new list
List<Integer> result = list.stream()
    .filter(x -> !condition)
    .collect(Collectors.toList());
```

### Bug #5: Wrong HashMap Default

```java
// WRONG: Getting from map without default
int count = map.get(key);  // ❌ NullPointerException if key missing

// CORRECT:
int count = map.getOrDefault(key, 0);  // ✅

// BETTER for frequency counting:
map.merge(key, 1, Integer::sum);  // ✅ Increment or set to 1
```

### Bug #6: Comparing Objects with == Instead of .equals()

```java
// WRONG:
if (str1 == str2)        // ❌ Compares reference, not content
if (num1 == num2)        // ❌ For Integer objects > 127, this fails!

// CORRECT:
if (str1.equals(str2))   // ✅ Compares content
if (num1.equals(num2))   // ✅ For Integer objects
// Or: if (num1.intValue() == num2.intValue())  // ✅
```

### Bug #7: Forgetting to Initialize

```java
// WRONG: Using uninitialized variables
int max;                     // ❌
for (...) max = Math.max(max, val);

// CORRECT: Initialize to appropriate extreme
int max = Integer.MIN_VALUE; // ✅ For finding maximum
int min = Integer.MAX_VALUE; // ✅ For finding minimum
int sum = 0;                 // ✅ For accumulating
boolean found = false;       // ✅ For flags
```

### Bug #8: Array/String Creation Confusion

```java
// Array:
int[] arr = new int[n];           // Size n, all zeros
int[][] grid = new int[m][n];     // m rows, n cols
Arrays.fill(arr, -1);             // Fill all with -1

// String:
char[] chars = s.toCharArray();   // Convert to char array
String back = new String(chars);  // Convert back
String sub = s.substring(i, j);   // i inclusive, j EXCLUSIVE

// ArrayList:
List<List<Integer>> result = new ArrayList<>();
result.add(new ArrayList<>(current));  // Add COPY, not reference!
```

### Bug #9: BFS Visited Timing

```java
// WRONG: Mark visited when DEQUEUING
while (!queue.isEmpty()) {
    int node = queue.poll();
    visited[node] = true;  // ❌ TOO LATE — may already be in queue again!
    for (int neighbor : adj[node]) {
        if (!visited[neighbor]) queue.offer(neighbor);
    }
}

// CORRECT: Mark visited when ENQUEUING
queue.offer(start);
visited[start] = true;  // ✅ Mark immediately
while (!queue.isEmpty()) {
    int node = queue.poll();
    for (int neighbor : adj[node]) {
        if (!visited[neighbor]) {
            visited[neighbor] = true;  // ✅ Mark when adding
            queue.offer(neighbor);
        }
    }
}
```

### Bug #10: Forgetting Deep Copy

```java
// WRONG: Adding reference to result (will change later!)
List<Integer> path = new ArrayList<>();
result.add(path);      // ❌ path is a reference — future changes affect result!

// CORRECT: Add a COPY
result.add(new ArrayList<>(path));  // ✅ Independent copy

// This is critical in backtracking!
// After unchoose, the original path changes — but the copy in result stays correct
```

---

## Part 3: Language-Specific Java Gotchas

### Priority Queue (Min-Heap vs Max-Heap)

```java
PriorityQueue<Integer> minHeap = new PriorityQueue<>();           // Default: min
PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Comparator.reverseOrder());

// For custom objects:
PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] - b[0]);
// ⚠️ WARNING: a - b can overflow! For safety:
PriorityQueue<int[]> pq = new PriorityQueue<>(Comparator.comparingInt(a -> a[0]));
```

### Sorting Gotchas

```java
// Primitive array — ascending:
Arrays.sort(arr);

// Object array — custom:
Arrays.sort(arr, (a, b) -> a[0] - b[0]);  // ⚠️ overflow risk
Arrays.sort(arr, Comparator.comparingInt(a -> a[0]));  // ✅ safer

// List — sort:
list.sort(Comparator.naturalOrder());

// Sort descending (objects only):
Arrays.sort(arr, Comparator.reverseOrder());  // Only for Integer[], not int[]
```

### String Operations Cheat Sheet

```java
s.charAt(i)          // char at index i
s.length()           // length (note: PARENTHESES — it's a method)
arr.length           // array length (note: NO parentheses — it's a field)
list.size()          // list size

s.substring(i, j)    // from i (inclusive) to j (EXCLUSIVE)
s.indexOf("abc")     // first occurrence, -1 if not found
s.contains("abc")    // boolean
s.toCharArray()      // char[]
String.valueOf(num)  // int → String
Integer.parseInt(s)  // String → int
```

---

## Part 4: Complexity Verification Checklist

After writing code, verify:

```
□ What's my time complexity? _____
  → Is it within constraint? (n ≤ 10⁵ needs O(n log n) or better)
□ What's my space complexity? _____
  → Am I using unnecessary extra space?
□ Am I creating objects in a loop?
  → Can I reuse them? (StringBuilder, arrays)
□ Am I using recursion?
  → Max stack depth? (Java default ~10,000 frames)
  → Should I convert to iterative?
```

---

## Part 5: Quick Pre-Submission Checklist

```
□ Return type matches what's asked (int vs long vs int[] vs List)
□ Variable names won't confuse me
□ No leftover debug print statements
□ Edge cases handled (empty, null, single, negative)
□ Correct loop bounds (< vs <=)
□ Used long where overflow is possible
□ HashMap: used getOrDefault
□ ArrayList: added copies in backtracking
□ BFS: marked visited on enqueue
□ Binary search: used left + (right - left) / 2
```

---

## NEW DIAGRAM — Debug Decision Tree (Systematic Bug Isolation)

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│  DIAGRAM: Systematic Debug Decision Tree                                     │
│           Follow this path to isolate any bug systematically                 │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ① START: Bug symptom observed?                                             │
│     │                                                                        │
│     └── Is it REPRODUCIBLE?                                                 │
│         │                                                                    │
│         ├── YES → Go to ②                                                    │
│         │                                                                    │
│         └── NO  → Heisenbug suspected                                       │
│                   ├── Is it timing-dependent? (race condition)               │
│                   │   └── Add ThreadSanitizer / stress test                 │
│                   ├── Is it under profiler? (observation changes behavior)   │
│                   │   └── Use continuous profiler (Pyroscope/async-profiler)│
│                   └── Is it memory-dependent? (use-after-free)               │
│                       └── Add Valgrind / AddressSanitizer                   │
│                                                                              │
│  ② Create MINIMAL failing test case                                          │
│     │                                                                        │
│     ├── Start with n=1 (single element)                                     │
│     ├── Then n=2, n=3                                                       │
│     ├── Try empty input, single element, all same values                    │
│     └── The SMALLER the failing input, the EASIER to dry run                │
│                                                                              │
│  ③ Dry Run on Paper (dry run table or recursion tree)                        │
│     │                                                                        │
│     ├── Does dry run reveal the bug? → FIX IT! Done.                        │
│     │                                                                    │
│     └── Dry run inconclusive → Go to ④                                    │
│                                                                              │
│  ④ Add Strategic Print / Logging                                             │
│     │                                                                        │
│     ├── Loop: print variable state at start of each iteration              │
│     ├── Recursion: print function entry with all args                      │
│     ├── Decision: print which branch taken + why                            │
│     │                                                                    │
│     └── Still not found → Go to ⑤                                         │
│                                                                              │
│  ⑤ Use Debugger or Profiler                                                 │
│     │                                                                        │
│     ├── Set breakpoint at suspected location, step through                 │
│     ├── Compare variable values to expected (from dry run table)           │
│     ├── Isolate: add midpoint assertion to bisect code (like BS)           │
│     │   → If state correct at midpoint → bug in second half               │
│     │   → If state wrong at midpoint  → bug in first half                │
│     │                                                                    │
│     └── Still not found → Go to ⑥                                         │
│                                                                              │
│  ⑥ Binary Search on Code (Bisection)                                        │
│     │                                                                        │
│     ├── Comment out HALF of the code                                       │
│     │   → If bug still present → bug is in the kept half                  │
│     │   → If bug gone       → bug was in the commented half              │
│     ├── Repeat: bisect remaining code until isolated to 1-5 lines         │
│     │                                                                    │
│     └── Root cause found → FIX + VERIFY (go to step ⑦)                   │
│                                                                              │
│  ⑦ Verify the Fix                                                             │
│     │                                                                        │
│     ├── Original failing test case passes?                                  │
│     ├── All previously passing tests still pass?                           │
│     ├── Edge cases (empty, single, boundary) handled?                     │
│     └── No NEW bugs introduced?                                             │
│         │                                                                    │
│         └── All YES → Add to regression test suite, DONE!                  │
│                                                                              │
│  FASTEST PATH SUMMARY:                                                       │
│  1. Make it repro        2. Minimize input   3. Dry run on paper           │
│     ↓                         ↓                    ↓                         │
│  4. Add prints             5. Use debugger      6. Bisect code             │
│     ↓                         ↓                    ↓                         │
│  7. Fix + verify + add regression test                                   │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Historical Evolution

> **Why this section**: mental-model pedagogy requires knowing the prior art. The frameworks below all have named predecessors — naming them prevents reinventing the wheel and connects your reasoning to decades of computer-science practice.

| Year | Predecessor | Contribution |
| --- | --- | --- |
| 1969 | Hoare | Axiomatic basis for program correctness |
| 1972 | Dijkstra, Dahl, Hoare | *Structured Programming* — program construction principles |
| 1974 | Kernighan & Plauger | *The Elements of Programming Style* — practical coding discipline |
| 1968/1973 | Knuth | *TAOCP Vol 1 & 3* — algorithm analysis, sorting/searching |
| 1993 | McConnell | *Code Complete* — comprehensive implementation practices |

**Evolution narrative**: The modern implementation checklist descends from two parallel traditions. C.A.R. Hoare's 1969 paper on the axiomatic basis for program correctness introduced the idea that programming errors could be formally prevented through preconditions and postconditions — the logical ancestor of today's "edge case checklist." The 1972 "Structured Programming" book (Dijkstra, Dahl, Hoare) extended this into practical program construction principles: verify before coding, handle base cases first, structure for readability. Meanwhile, Kernighan and Plauger's 1974 *Elements of Programming Style* shifted the focus from theoretical correctness to pragmatic quality — naming conventions, commenting discipline, avoiding premature optimization. Donald Knuth's 1973 *TAOCP Volume 3* (sorting and searching) and his 1968 *Volume 1* established the empirical tradition of benchmarking and algorithm analysis. Steve McConnell's 1993 *Code Complete* synthesized all these traditions into the comprehensive implementation checklist format still used today.

**Modern practice anchor**: Today's code quality checklists (Google Style Guides, Clean Code principles, LeetCode submission requirements) directly descend from the Hoare/Kernighan/McConnell lineage, emphasizing the specific bug categories this guide catalogs: off-by-one errors, null handling, integer overflow, and collection modification during iteration.

## Production Reality

> **Why this section**: a mental model is only useful if it predicts what breaks in production. Below are named failure modes tied to this mental model, with debug workflows and modern observability tools.

### Failure Mode 1: Ariane 5 Flight 501 — Type Conversion Overflow

**What goes wrong**: A 64-bit floating-point value (horizontal velocity) was cast directly to a 16-bit signed integer. The value exceeded 32,767, causing integer overflow. The rocket self-destructed 37 seconds after launch, June 4, 1996. The bug was in a module copied verbatim from Ariane 4, which always passed because Ariane 4 never flew trajectories that produced values in range.

**Cost**: $370 million vehicle loss, mission failure.

**Debug workflow**:
1. Range-check every type conversion before the cast: `if (value < MIN_INT16 || value > MAX_INT16) fail_safe();`
2. Add `-Wconversion` (GCC/Clang) to CI pipeline — catches truncating assignments at compile time.
3. Mark data flows with explicit units (meters/sec vs pixels) to prevent semantic mismatches.
4. Add integration test with production-like input ranges, not just the legacy unit test suite.

### Failure Mode 2: Knight Capital Group — Deployment Flag Left in Production (2012)

**What goes wrong**: A feature flag ("Retail Electronic Client" mode) meant only for test environments was left set on one production server during a deployment. The server rapidly placed erroneous trades. $440 million lost in 45 minutes. The flag had existed for years and was never cleaned up after being replaced by a better mechanism.

**Cost**: $440 million in 45 minutes. Firm was subsequently acquired at a 75% discount.

**Debug workflow**:
1. Treat feature flags as code: add them to version control, code review, and cleanup sprints.
2. Add a CI check that flags any binary/config flag not explicitly set in the current deployment manifest.
3. Use canary deployments: route 1% of traffic to new deployment, monitor for anomaly spikes.
4. Require "flag retirement" as part of feature completion — every flag should have a scheduled removal date.

### Failure Mode 3: Pagination Off-by-One — Last Record Dropped

**What goes wrong**: Page-based pagination using `LIMIT page_size OFFSET (page-1)*page_size` silently drops the last record when total count is not evenly divisible by page size. Users believe their data is complete. In banking/financial context: the last transaction on a statement page goes missing, creating audit gaps.

**Cost**: Silent data loss. Compliance violations in regulated industries. MTTR spikes because symptoms are user-reported and intermittent.

**Debug workflow**:
1. Add `total_count % page_size` assertion in pagination — verify last page has exactly the remainder count.
2. Add cursor-based pagination for new APIs; maintain offset-based for legacy only.
3. Run pagination tests against production-like row counts in staging: verify page 1, page N-1, and page N all return expected counts.

### Failure Mode 4: null vs undefined — JSON Parse Exception in Production

**What goes wrong**: JavaScript `null` serializes to `null` in JSON. `undefined` is omitted entirely. A REST API returns `{ "field": null }`. The client checks `value === undefined` — always true because the field was dropped during serialization, not because it was deliberately null. The downstream parser crashes.

**Cost**: 500 errors on affected API responses. Users see blank or error screens. Typically discovered with real user data in production, not synthetic staging data.

**Debug workflow**:
1. Enforce JSON schema validation at API boundary (Ajv for Node.js, Jackson annotations for Java).
2. Add null-check defensive coding: `value ?? 'default'` or explicit `!== null && !== undefined` checks.
3. Add JSON serialization contract tests: verify both null and undefined are handled explicitly.
4. Use TypeScript strict null checks (`strictNullChecks: true`) to catch potential null/undefined at compile time.

### Modern Production Tools

- **SonarQube / ESLint `--no-unused-vars`**: Detects uninitialized variables and unused feature flags at CI time.
- **PagerDuty + deployment correlation**: Fire on-call alert when error rate spikes within 30 minutes of a deploy — correlate with git commit timestamp to isolate the change.
- **GitLab CI / GitHub Actions pre-deploy check**: Fail build if any legacy flag from a known-stale-flag list is detected in the binary config.
- **Datadog Synthetics**: Automated end-to-end pagination smoke tests against production — verifies page N counts match expected total.
- **JSON Schema validation**: Ajv, pydantic, or Spring `@Valid` enforce JSON contracts at API boundaries, catching null/undefined mismatches before they reach users.

## Conceptual Depth & Topical Breadth

> **Why this section**: this mental model rests on a specific invariant, and its variants cover a spectrum of trade-offs. Knowing the invariant and the variants lets you apply the model correctly across problems.

### Invariant

Bugs cluster at **edges, boundaries, and type conversions**. The invariant is that the most common bugs — off-by-one errors, null pointer exceptions, integer overflow, and type mismatches — all share a common source: the programmer's mental model of the code's state diverges from the actual runtime state at extreme or transition points. Edge cases (empty input, single element, maximum value) are where mental models are least tested and most likely to fail. Type conversions silently change the domain or range of values (float to int truncates, 64-bit to 16-bit overflows). The internal mechanism is **implicit behavior**: the code compiles, but the runtime semantics diverge from intent. The checklist exists precisely because these bugs are systematic — they follow predictable patterns, not random failures.

### Variants Comparison

| Bug Class | Signature | Detection Method | Fix |
| --- | --- | --- | --- |
| Off-by-one | Loop uses `<=` vs `<`, index off by 1 | Boundary test cases (n=0,1,2,max) | Use half-open intervals [start, end) consistently |
| Null/undefined | NPE, TypeError: cannot read property | Null-check before use, TypeScript strict mode | Defensive `?.` or null guard |
| Integer overflow | Value exceeds MAX_INT, wraps negative | Range test with max inputs | Use larger type (long vs int), check before op |
| Type cast | Truncated value, wrong branch taken | `-Wconversion` in CI, schema validation | Explicit cast, bounded check |
| Race condition | Intermittent, order-dependent failure | ThreadSanitizer, stress test under concurrency | Immutable data, synchronized access |
| Encoding | Wrong characters displayed | UTF-8 normalization, charset declaration | NFC normalize, explicit charset |
| Mutable default arg | Shared state across calls | ESLint `no-unsafe-assignment` | Use None sentinel, initialize inside function |
| Iterator invalidation | ConcurrentModificationException | Fail-fast iterator, snapshot copy | Iterate over copy, use index not iterator |

### Decision Table

| Context | High-Risk Location | Default Check | When to Add More |
| --- | --- | --- | --- |
| Loop over array | Loop boundary (i <= vs i <) | Test with n=0, n=1, n=2 | Max n in production stress test |
| Recursive function | Base case, return propagation | Base case logging | Stack depth profiling |
| Type conversion | Float to int, 64-bit to 16-bit | Range check before cast | Property-based testing |
| API boundary | JSON deserialization | Schema validation | Fuzz testing with invalid inputs |
| Collection iteration | Modification during loop | Fail-fast iterator | Snapshot or index-based iteration |


---

## Reality Check

**"Implementation is transcription of the solved idea"** → Implementation is where HALF the failures happen even with a correct idea: state initialization, loop boundaries, update ordering, and return-value semantics are decisions the idea never specified. The checklist exists because these decisions feel too small to think about and are exactly where wrong answers concentrate. Treating coding as transcription is why "I knew how to solve it" and "it didn't pass" coexist so often.

**"Variable naming does not matter in interview code"** → Names are your OWN debugging infrastructure under pressure: left/right versus i/j on a two-pointer, needCount versus n1, windowSum versus s — thirty seconds of naming saves the minutes lost re-deriving what s meant when the test fails. The empirical pattern in mock transcripts: candidates who rename mid-debug ("wait, what is k here?") lose the thread; candidates with semantic names debug by reading. The audience is you-in-five-minutes, not the interviewer.

**"Write it all, then test at the end"** → CHECKPOINT testing beats end testing under time pressure: after the parsing/setup block, sanity-check state on the example; after the main loop, print or trace one iteration before writing the extraction step. End-testing a 40-line solution that fails gives you 40 lines of suspects; checkpointed failure gives you 10. The interview variant is narrated checkpointing — "let me verify the window state after the first expansion" — which simultaneously debugs and demonstrates.

**"The return statement is the easy part"** → Return semantics are a top-five wrong-answer source: index versus value, count versus existence, the empty-input return (what IS max-subarray of nothing — the problem defines it or you must state a choice), the not-found sentinel (-1? null? exception?), and the accumulated-versus-final distinction (global best, not the last window). The checklist line that catches all of them: re-read the problem's output specification AFTER coding, before testing — it takes ten seconds and re-anchors the code to the actual question.

**"Clean-up passes are polish for leftover time"** → One targeted clean-up pass CATCHES BUGS by changing your reading mode: scanning specifically for unused variables (leftover from an abandoned approach — often signals incomplete refactor), duplicated conditions (one is probably wrong), and asymmetric paired operations (the add without its remove). This is not aesthetics — it is a linter run by eye, tuned to the three asymmetries that survive first-pass writing. Two minutes, distinct from testing, catches what testing on friendly examples misses.
