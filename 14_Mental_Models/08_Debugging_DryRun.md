**Navigation**: [< Previous](07_SQL_Mental_Pipeline.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](09_Complexity_Intuition.md)

# 🔬 Debugging & Dry Run — How to Find Bugs Systematically

**The key insight**: Debugging is NOT random. It's a systematic process: reproduce → isolate → identify → fix → verify. The best debuggers aren't smarter — they have a PROCESS.

---

## Part 1: The Dry Run Method — Trace Code Like a Computer

### How to Dry Run (Step-by-Step)

```
1. Draw a TABLE with columns for each variable
2. Execute ONE line at a time
3. Update the variable table after each line
4. For loops: write each iteration as a row
5. For recursion: draw the call stack or tree
```

### Dry Run Example: Binary Search

```java
int binarySearch(int[] arr, int target) {
    int left = 0, right = arr.length - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (arr[mid] == target) return mid;
        else if (arr[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}
```

```
Input: arr = [2, 5, 8, 12, 16, 23, 38, 56, 72], target = 23

Iteration | left | right | mid | arr[mid] | Action
----------|------|-------|-----|----------|------------------
  Init    |  0   |   8   |  -  |    -     | Start
  1       |  0   |   8   |  4  |   16     | 16 < 23 → left = 5
  2       |  5   |   8   |  6  |   38     | 38 > 23 → right = 5
  3       |  5   |   5   |  5  |   23     | 23 == 23 → return 5 ✅
```

### Dry Run for Recursion — Use Call Stack Notation

```
fibonacci(4)
├── fibonacci(3)
│   ├── fibonacci(2)
│   │   ├── fibonacci(1) → return 1
│   │   └── fibonacci(0) → return 0
│   │   return 1 + 0 = 1
│   └── fibonacci(1) → return 1
│   return 1 + 1 = 2
└── fibonacci(2)
    ├── fibonacci(1) → return 1
    └── fibonacci(0) → return 0
    return 1 + 0 = 1
return 2 + 1 = 3 ✅
```

---

## Part 2: The Debugging Process — 5 Steps

### Step 1: REPRODUCE the Bug

```
□ What input causes the bug?
□ What output do I get vs what I expect?
□ Can I create the SMALLEST input that still bugs?

Example: "My sorting fails for [3, 1, 2, 1]"
→ Try: [1, 1] — does it fail? If yes, that's simpler to debug!
→ Try: [2, 1] — does it fail? If yes, even simpler!

The smaller the failing input, the easier to trace.
```

### Step 2: ISOLATE Where the Bug Is

```
Strategy A: "Halfway check"
  → Print/check the state at HALFWAY point of your algorithm
  → Is the state correct at halfway?
  → YES → Bug is in second half
  → NO → Bug is in first half
  → Repeat (like binary search on your code!)

Strategy B: "Check invariants"
  → What should be TRUE at each step?
  → Add assertions/prints to verify

Strategy C: "Simplest failing case"
  → Reduce input until bug disappears
  → The last input that bugs = exact trigger
```

### Step 3: IDENTIFY the Root Cause

```
Common root causes (check these FIRST):
1. Off-by-one error (wrong loop bound)
2. Wrong comparison (< vs <=, > vs >=)
3. Wrong variable used (i instead of j)
4. Missing initialization
5. Not handling edge case (empty, null, single)
6. Logic error in if/else branches
7. Integer overflow
8. Using = instead of == (or vice versa in Java: .equals())
9. Modifying collection while iterating
10. Wrong base case in recursion
```

### Step 4: FIX the Bug

```
Rules for fixing:
□ Fix ONLY the identified root cause
□ Don't change other things "while you're at it"
□ Understand WHY the fix works (not just that it works)
```

### Step 5: VERIFY the Fix

```
□ Original failing input now passes
□ All previously passing inputs still pass
□ Edge cases still work
□ No new bugs introduced
```

---

## Part 3: Common Bug Patterns & How to Spot Them

### Pattern 1: "Works on examples, fails on edge cases"

```
Typical causes:
- Empty array/string not handled
- Single element not handled
- All same elements
- Negative numbers
- Very large numbers (overflow)

Fix: Add explicit edge case handling at the START of your function
```

### Pattern 2: "Almost correct answer, off by 1"

```
Typical causes:
- Loop runs one too many or one too few times
- Array index shifted
- Substring/subarray boundary wrong
- Fence-post error (counting posts vs gaps)

Fix: Check loop bounds with smallest input (n=1, n=2)
     Draw the indices on paper: [0, 1, 2, 3, 4] for n=5
```

### Pattern 3: "Works for small input, wrong for large"

```
Typical causes:
- Integer overflow (int → long)
- Algorithm complexity too high (TLE → wrong approach, not bug)
- Floating point precision

Fix: Use long for large sums/products
     Check if n * n > Integer.MAX_VALUE
```

### Pattern 4: "Works sometimes, fails randomly"

```
Typical causes:
- Uninitialized variables
- HashMap ordering assumptions (HashMap is NOT ordered!)
- Static variables not reset between test cases
- Modifying shared state

Fix: Initialize everything explicitly
     Use LinkedHashMap if order matters
     Reset static variables in each test
```

### Pattern 5: "Infinite loop or stack overflow"

```
Typical causes:
- Loop condition never becomes false
- Recursion base case missing or unreachable
- BFS/DFS not marking visited
- Pointer not advancing in linked list

Fix: Verify loop variable changes each iteration
     Verify recursion argument gets closer to base case
     Always mark visited BEFORE exploring neighbors
```

---

## Part 4: Strategic Print Debugging

### What to Print and Where

```java
// Print LOOP STATE at start of each iteration:
for (int i = 0; i < n; i++) {
    System.out.printf("i=%d, current=%d, sum=%d%n", i, arr[i], sum);
    // ... logic ...
}

// Print FUNCTION ENTRY with arguments:
int solve(int n, int target) {
    System.out.printf("solve(n=%d, target=%d)%n", n, target);
    // ... logic ...
}

// Print DECISION POINTS:
if (arr[mid] < target) {
    System.out.printf("Going RIGHT: mid=%d, arr[mid]=%d < target=%d%n", mid, arr[mid], target);
    left = mid + 1;
} else {
    System.out.printf("Going LEFT: mid=%d, arr[mid]=%d >= target=%d%n", mid, arr[mid], target);
    right = mid - 1;
}

// Print BEFORE RETURN:
System.out.printf("Returning %d for input (%d, %d)%n", result, n, target);
return result;
```

### Print Formatting Tips

```
// For arrays:
System.out.println(Arrays.toString(arr));
// Output: [1, 3, 5, 7, 9]

// For 2D arrays:
System.out.println(Arrays.deepToString(grid));
// Output: [[1, 2], [3, 4]]

// For lists:
System.out.println(list);
// Output: [1, 2, 3]

// For maps:
System.out.println(map);
// Output: {a=1, b=2}
```

---

## Part 5: Debugging DP Problems

### Common DP Bugs

```
Bug 1: Wrong base case
→ Print dp[0], dp[1] — do they match expected base values?

Bug 2: Wrong recurrence
→ Print dp table row by row, compare with hand-calculated values

Bug 3: Wrong fill order
→ Are you accessing dp values that haven't been computed yet?
→ Bottom-up: fill smaller indices first
→ Check: when computing dp[i], are dp[j] (j < i) already filled?

Bug 4: Wrong answer extraction
→ Is the answer dp[n]? dp[n-1]? max of all dp[i]?
→ Check what dp[i] REPRESENTS
```

### DP Table Visualization

```
Problem: Climbing Stairs (ways to reach step n, can take 1 or 2 steps)

Step:  0   1   2   3   4   5
dp:   [1] [1] [2] [3] [5] [8]
       ↑   ↑   ↑
      base base dp[2] = dp[1] + dp[0] = 1 + 1 = 2
                dp[3] = dp[2] + dp[1] = 2 + 1 = 3
                dp[4] = dp[3] + dp[2] = 3 + 2 = 5
                dp[5] = dp[4] + dp[3] = 5 + 3 = 8 ✅
```

---

## Part 6: Debugging Graph/Tree Problems

### Common Graph Bugs

```
Bug 1: Not marking visited → infinite loop
→ Symptom: Program hangs or stack overflow
→ Fix: Always use visited set/array

Bug 2: Marking visited too late (BFS) → duplicates in queue
→ Symptom: Correct answer but TLE
→ Fix: Mark visited when ENQUEUING, not dequeuing

Bug 3: Wrong adjacency list → missing or extra edges
→ Fix: Print adjacency list before running algorithm

Bug 4: Directed vs undirected confusion
→ Undirected: add edge BOTH ways (a→b AND b→a)
→ Directed: add edge ONE way only
```

### Tree Debugging: Print Traversals

```java
// Inorder (for BST, should be sorted):
void inorder(TreeNode node) {
    if (node == null) return;
    inorder(node.left);
    System.out.print(node.val + " ");
    inorder(node.right);
}

// Level-order (see tree structure):
void levelOrder(TreeNode root) {
    Queue<TreeNode> q = new LinkedList<>();
    q.offer(root);
    while (!q.isEmpty()) {
        int size = q.size();
        for (int i = 0; i < size; i++) {
            TreeNode node = q.poll();
            System.out.print(node == null ? "null " : node.val + " ");
            if (node != null) { q.offer(node.left); q.offer(node.right); }
        }
        System.out.println();  // New line per level
    }
}
```

---

🔬 **Section Challenge — Part 6: Debugging Graph/Tree Problems**

**Challenge 1 (Trace):** You are implementing BFS to find the shortest path in an unweighted grid. Your queue logic pushes a node, pops it, checks its neighbors, and pushes the valid neighbors. You mark a node as `visited = true` the moment you _pop_ it from the queue. Why will this cause `Time Limit Exceeded` (TLE) on large grids?

<details><summary>Answer</summary>

Because you are marking nodes as visited too late! If a node is added to the queue but not yet popped, it is not marked as visited. As a result, other neighboring nodes currently being processed might see it as "unvisited" and push _duplicate_ copies of the same node onto the queue. This causes the queue size to explode exponentially, leading to TLE. **Fix:** Always mark nodes as visited the exact moment you _push_ them into the queue.

</details>

**Challenge 2 (Debug):** You are dry-running a recursive DFS for a Binary Search Tree (BST). Your output array is `[10, 5, 2, 7, 15]`. Since this is a BST, you expected the output to be sorted (`[2, 5, 7, 10, 15]`). What specific debugging mistake does this output reveal about your traversal order?

<details><summary>Answer</summary>

The output `[10, 5, 2, 7, 15]` corresponds to a **Pre-order traversal** (Root → Left → Right), not an In-order traversal. To get a sorted array from a BST, you must use **In-order traversal** (Left → Root → Right). The debugging output immediately isolates the root cause: you placed the `list.add(node.val)` or `print` statement _before_ the recursive call to `node.left`, instead of _between_ the calls to `node.left` and `node.right`.

</details>

## Part 7: Debugging Checklist (Quick Reference)

```
When your code fails:
□ Read the error message carefully (line number, exception type)
□ Create the smallest failing test case
□ Dry run with that test case on paper
□ Check the Big 10 bugs (off-by-one, null, overflow, etc.)
□ Add strategic prints at decision points
□ Compare your trace with expected behavior
□ Fix ONE thing at a time
□ Verify fix with original + edge cases
□ Remove debug prints before submitting
```

---

## NEW DIAGRAM — Debugging Decision Tree (When Code Fails)

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│  DIAGRAM: Debugging Decision Tree — Follow when code produces wrong output  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ① SYMPTOM: Code produces wrong output / TLE / crash / wrong answer?        │
│     │                                                                        │
│     └── Can you REPRODUCE it consistently?                                  │
│         │                                                                    │
│         ├── YES → Minimize the failing input (see step ②)                  │
│         │                                                                    │
│         └── NO  → Heisenbug (observation changes behavior)                  │
│                   • Remove profiler/observer and try again                  │
│                   • Use continuous profiler (< 5% overhead)                │
│                   • Check for race conditions (ThreadSanitizer)            │
│                                                                              │
│  ② MINIMIZE INPUT → smallest failing case                                   │
│     │                                                                        │
│     ├── n=1 fails? → Try n=0 (empty)                                       │
│     ├── n=2 fails? → Try [first_element], [second_element] separately      │
│     ├── Try duplicates, negative numbers, max values                       │
│     └── The smaller the failing input, the easier the trace                │
│                                                                              │
│  ③ DRY RUN ON PAPER (most powerful technique)                               │
│     │                                                                        │
│     ├── Draw table with columns = all variables                            │
│     ├── Execute ONE line at a time, update table                           │
│     ├── For loops: one row per iteration                                   │
│     ├── For recursion: draw call stack / tree                              │
│     │                                                                    │
│     ├── Dry run matches expected? → Bug is NOT here, check caller/callee │
│     │                                                                    │
│     └── Dry run mismatches expected? → ROOT CAUSE FOUND at mismatch point │
│                                                                              │
│  ④ ADD PRINT / LOG STATEMENTS (if dry run inconclusive)                    │
│     │                                                                        │
│     ├── Loop: print state at start of each iteration                       │
│     ├── Function entry: print ALL args                                     │
│     ├── Decision points: print which branch + condition values             │
│     ├── Before return: print return value                                  │
│     │                                                                    │
│     └── Still not found → Go to ⑤                                         │
│                                                                              │
│  ⑤ USE DEBUGGER (step through, not prints)                                 │
│     │                                                                        │
│     ├── Set breakpoint near suspected code                                 │
│     ├── Step through line by line                                         │
│     ├── Watch variables, compare to dry-run table                          │
│     ├── Bisect: add assertion at midpoint                                  │
│     │   → "If state correct here, bug is in second half"                  │
│     │   → "If state wrong here, bug is in first half"                     │
│     │                                                                    │
│     └── Still not found → Go to ⑥                                         │
│                                                                              │
│  ⑥ BINARY SEARCH ON CODE (comment half, binary search)                     │
│     │                                                                        │
│     ├── Comment out ~50% of the function                                  │
│     │   → Bug gone?    → Bug was in the commented half                    │
│     │   → Bug present? → Bug is in the kept half                          │
│     ├── Repeat on remaining half until 1-5 lines isolated                 │
│     │                                                                    │
│     └── ROOT CAUSE ISOLATED → Go to ⑦                                     │
│                                                                              │
│  ⑦ FIX + VERIFY + REGRESS                                                   │
│     │                                                                        │
│     ├── Fix only the root cause (not surrounding code)                     │
│     ├── Verify: original failing case passes?                              │
│     ├── Verify: all previously passing cases still pass?                   │
│     ├── Verify: edge cases (empty, single, negative, max)                  │
│     └── Add regression test so it never comes back                        │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │  THE "60-SECOND" DEBUG SCAN (check these first):                       │    │
│  │                                                                      │    │
│  │  □ Off-by-one: loop bound < vs <= ?                                  │    │
│  │  □ Null check: did you check for null before accessing?              │    │
│  │  □ Return statement: is the recursive call returned?                 │    │
│  │  □ Visited marking (BFS): marked on enqueue, not dequeue?            │    │
│  │  □ Integer overflow: long for large sums?                            │    │
│  │  □ Reference vs value: deep copy in result list?                     │    │
│  │  □ = vs ==: assignment instead of comparison?                        │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Historical Evolution

> **Why this section**: mental-model pedagogy requires knowing the prior art. The frameworks below all have named predecessors — naming them prevents reinventing the wheel and connects your reasoning to decades of computer-science practice.

| Year | Predecessor | Contribution |
| --- | --- | --- |
| 1974 | Kernighan & Plauger | *Elements of Programming Style* — systematic debugging discipline |
| 1975 | Dijkstra | Self-stabilizing systems — systematic fault recovery |
| 1988 | Dijkstra | *A Discipline of Programming* — formal reasoning about programs |
| 1989 | Penrose | *The Emperor's New Mind* — computational debugging philosophy |
| 2009 | Zeller | *Why Programs Fail* — systematic debugging methodology |

**Evolution narrative**: Systematic debugging methodology evolved from two traditions: theoretical program correctness and practical programming discipline. Dijkstra's 1975 paper on self-stabilizing systems introduced the concept that a system can recover from any arbitrary initial state — the theoretical foundation for systematic fault isolation. His 1988 *A Discipline of Programming* extended formal reasoning to the debugging process itself. Kernighan and Plauger's 1974 *Elements of Programming Style* represented the practical side: the systematic use of print statements, test cases, and code inspection. Roger Penrose's 1989 *The Emperor's New Mind* contributed the philosophical framework for understanding that bugs are not random accidents but consequences of logical limitations — that systematic approaches (like dry running) address the fundamental problem of human reasoning about formal systems. Andreas Zeller's 2009 *Why Programs Fail* synthesized these traditions into a modern systematic debugging methodology with trace analysis, delta debugging, and automated test generation.

**Modern practice anchor**: Today's debugging practice (IDE debuggers, logging frameworks, observability tools like Datadog, Sentry) descends from the Kernighan/Zeller lineage of systematic debugging, while Dijkstra's self-stabilization principles inform modern resilience patterns like circuit breakers and graceful degradation.

## Production Reality

> **Why this section**: a mental model is only useful if it predicts what breaks in production. Below are named failure modes tied to this mental model, with debug workflows and modern observability tools.

### Failure Mode 1: Heisenbug — Bug Disappears When Profiler Is Attached

**What goes wrong**: A production latency spike appears in metrics. You attach a profiler (async-profiler, py-spy, `perf`). The spike vanishes. This is a Heisenbug: the act of observation changes the system's behavior. Profiler overhead slows down execution, changing thread timing, which changes cache coherence patterns, which can mask race conditions and timing-dependent logic.

**Cost**: MTTR spikes from hours to days. Engineers waste days trying to reproduce a bug that only manifests under production load conditions.

**Debug workflow**:
1. Use always-on lightweight profiling (Continues Profiling): Pyroscope, Datadog APM Continuous Profiler, or Parca. These have <5% overhead and are safe in production.
2. If you must attach an interactive profiler, reproduce the issue with production-like load first (not synthetic benchmarks), then profile the same live system.
3. Add structured logging with correlation IDs at decision points before instrumenting: verify the bug exists in logs, then attach the profiler.
4. For timing bugs, use `perf stat` (low overhead) or flame graphs from eBPF (`bpftrace`) — both are production-safe without full instrumentation.

### Failure Mode 2: Instrumentation-Specific Failure — Debug Logging Breaks the System

**What goes wrong**: Adding debug logging to a hot path (e.g., inside a lock or in a 100K ops/sec loop) increases latency enough to trigger timeouts. The logging itself causes cascading failures: requests back up behind the slow log call, connection pools exhaust, and the system crashes. This is the instrumentation-specific failure.

**Cost**: Systematic degradation. Adding observability made the system worse than having no observability. Production incident worsens during investigation.

**Debug workflow**:
1. Run always-on logging in production with log levels (ERROR/WARN/INFO/DEBUG). Benchmark the hot path with logging enabled vs disabled.
2. Use async/non-blocking loggers (Logback with `discardingThreshold`, Python's `logging.handlers.QueueHandler`) — log to an in-memory ring buffer, drain asynchronously.
3. Set maximum log rate per second per service; drop DEBUG logs if the service is under load.
4. Instrument critical path with `Histogram` metrics (Prometheus) instead of logs — metrics are lower overhead than structured logs at high throughput.

### Failure Mode 3: Race Conditions Invisible in Dry Run

**What goes wrong**: A concurrency bug manifests once in every 10,000 requests. It only occurs under specific thread timing: thread A reads state, thread B modifies it before A writes, and the result is corrupted. Dry-running the code with a single thread never reproduces it. The bug ships to production and causes rare but catastrophic data corruption.

**Cost**: Silent data corruption. User trust damage. Postmortem identifies the bug only after months of accumulated incorrect state.

**Debug workflow**:
1. Run with `ThreadSanitizer` (TSAN) enabled for C/C++/Go or `jracecheck` for Java in staging CI — they detect race conditions by monitoring memory access patterns.
2. Add `stress testing` to CI: run the service under 10x normal concurrency for 30 minutes. If it fails in CI, it will fail in production.
3. Use immutable data structures (final/const fields, copy-on-write) to eliminate shared mutable state — the root cause of most race conditions.
4. Add concurrency unit tests using `java.util.concurrent.CountDownLatch` and `Phaser` to simulate interleaving explicitly.

### Failure Mode 4: Async/Await Ordering Bugs — Invisible Without Timeline Debugging

**What goes wrong**: An async function awaits three API calls in a loop. The results are processed in completion order (not call order) because each await resolves at a different time. A downstream database write assumes the results are in the same order as the input array. When the third API returns first, the write happens in the wrong order, corrupting the database.

**Cost**: Database corruption. Requires manual data repair. The bug only manifests with variable network latency, so it disappears in local dev (fast network) but appears in production.

**Debug workflow**:
1. Use async timeline debuggers: Chrome DevTools async stack traces, Node.js `--experimental-async_context_frame` flag, or the `AsyncProfiler` flame graph with async mode.
2. Verify async order explicitly in code: if order matters, collect results in an array keyed by index and process after all promises resolve, not in `.then()` order.
3. Add integration tests with artificial latency injection (e.g., `await delay(randomMs())` before each mock response) to expose ordering assumptions.
4. Use structured concurrency primitives (`Promise.all` with indexed results, or structured concurrency libraries like `kotlinx.coroutines`) to prevent unordered interleaving.

### Modern Production Tools

- **Datadog Continuous Profiler**: Always-on, production-safe profiling with flame graphs. Identifies hot functions without Heisenbug risk (overhead ~1-5%).
- **Jaeger / Zipkin**: Distributed tracing that records the async timeline across service boundaries. Shows which span completed when, making async ordering violations visible.
- **Pyroscope + Parca**: Open-source continuous profiling. Profile production at <5% overhead without instrumenting code.
- **ThreadSanitizer (TSAN)**: Compile-time race detection for C/C++/Go. Detects data races in CI before they reach production.
- **Temporal / Conductor**: Workflow orchestration engines that make async order explicit and auditable — eliminates implicit ordering assumptions in distributed async code.

## Conceptual Depth & Topical Breadth

> **Why this section**: this mental model rests on a specific invariant, and its variants cover a spectrum of trade-offs. Knowing the invariant and the variants lets you apply the model correctly across problems.

### Invariant

State evolves **predictably when traced step-by-step**. The invariant is that a program's behavior is deterministic given the same inputs — if you know the initial state and the operation at each step, you can predict the final state. This is the basis of dry-running: manually executing code with concrete inputs to verify the expected output. The internal mechanism is that variables hold values, operations transform values, and control flow changes which operations execute. When the observed state diverges from the expected state, the divergence point identifies the bug. The power of dry-running is that it replaces the question "why is this wrong?" with "at what step does my mental model diverge from the actual execution?" — a much more tractable problem.

### Variants Comparison

| Strategy | Cost | Applicability | Output |
| --- | --- | --- | --- |
| Dry run on paper | Free | All code, especially logic | Trace of all state changes |
| Print debugging | Low | Quick verification, loops | Output at specific points |
| Structured logging | Medium | Production, async flows | Searchable event history |
| Interactive debugger | Medium-high | Complex state, step-through | Full state at each step |
| Binary search (bisect) | Low | Large codebase, unknown location | Minimal steps to isolate |
| Postmortem analysis | High | After incident, root cause | System-level understanding |
| Log replay | High | Production issues, distributed | Reconstructed timeline |
| Flame graphs | Medium-high | Performance bugs, CPU profiling | Call hierarchy with time |
