# 🎯 Pattern Trigger Guide — From Problem Signal to Solution Pattern

> **Purpose:** Your brain fires a signal when it sees a pattern. This guide maps that signal to the verified correct technique.
> **Use:** Read the signal table every morning. Within 2 weeks, your gut instinct becomes algorithmic.
>
> 🔗 **Navigate back:** [Mental Models Index](00_INDEX.md) | [Pattern Master Guide](../04_Patterns_Templates/00_PATTERN_MASTER_GUIDE.md)

---

## ⚠️ Constraint Overrides

The trigger table gives your first guess. Constraints decide if that guess survives.

| Trigger Guess              | Constraint That Breaks It                    | Switch To                       |
| -------------------------- | -------------------------------------------- | ------------------------------- |
| Sliding window for sum     | negative numbers allowed                     | prefix sum + hashmap/tree/deque |
| Prefix sum for range query | online updates                               | Fenwick / segment tree          |
| BFS shortest path          | weighted edges                               | Dijkstra / 0-1 BFS              |
| Dijkstra                   | negative edges                               | Bellman-Ford / potentials       |
| Two pointers               | array unsorted and original indices required | hashmap complement              |
| Greedy                     | no exchange/stays-ahead proof                | DP/search                       |

Detailed table: [Constraint-Based Pattern Selection](../04_Patterns_Templates/25_Constraint_Based_Pattern_Selection.md).

---

## Source-Reading Loop

When a problem feels solved by brute force but you cannot choose the right DS/Algo yet, use this loop:

```text
1. Write the brute-force loop.
2. Circle the repeated operation.
3. Name the needed operation: query, update, min, max, kth, predecessor, connectivity, shortest path.
4. Match that operation to a data structure.
5. Check one strong open-source implementation to learn the invariant.
6. Rewrite a small version for the problem constraints.
```

Examples:

| Brute Force Pain                | Operation Needed            | DS/Algo Upgrade          | Reference Anchor                                                                                                             |
| ------------------------------- | --------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| recompute range sum per query   | prefix/range sum            | prefix sum or Fenwick    | [AtCoder Fenwick](https://github.com/atcoder/ac-library/blob/master/atcoder/fenwicktree.hpp)                                 |
| update ranges and query ranges  | lazy propagation            | lazy segment tree        | [AtCoder lazy segtree](https://github.com/atcoder/ac-library/blob/master/atcoder/lazysegtree.hpp)                            |
| keep top K while scanning       | min/max boundary            | heap                     | [OpenJDK PriorityQueue](https://github.com/openjdk/jdk/blob/master/src/java.base/share/classes/java/util/PriorityQueue.java) |
| shortest path with weights      | minimum distance extraction | Dijkstra + heap          | [cp-algorithms](https://github.com/cp-algorithms/cp-algorithms)                                                              |
| contest template feels too long | tested minimal snippet      | simplify state/invariant | [KACTL](https://github.com/kth-competitive-programming/kactl/tree/main/content)                                              |

Open-source code should answer: "what invariant is this implementation protecting?" If you cannot say the invariant, you are copying, not learning.

---

## 🔑 The Master Signal → Pattern Table

> For each problem, find the strongest matching signal. That's your starting pattern.

| Signal You See in Problem                                      | Your Brain Should Say                         | Verify With                                                   | Jump To                                                  |
| -------------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------- |
| `"subarray"` + `"of size k"`                                   | → **Fixed Sliding Window**                    | Is window size constant? Yes → Fixed                          | [SW PS](../05_Problem_Solving/05_Sliding_Window.md)      |
| `"longest subarray/substring"` + `"with condition"`            | → **Variable Sliding Window**                 | Does adding right & shrinking left work?                      | [SW PS](../05_Problem_Solving/05_Sliding_Window.md)      |
| `"pair that sums to target"` in sorted array                   | → **Two Pointers (opposite ends)**            | Is it sorted? Must it be?                                     | [2P PS](../05_Problem_Solving/06_Two_Pointers.md)        |
| `"three numbers sum to 0"` / `"k-sum"`                         | → **Fix one + Two Pointer**                   | Sort, fix outer loop, two-pointer inner                       | [2P PS](../05_Problem_Solving/06_Two_Pointers.md)        |
| `"remove duplicates in-place"`                                 | → **Two Pointers (same direction)**           | Slow=writer, fast=reader                                      | [2P PS](../05_Problem_Solving/06_Two_Pointers.md)        |
| `"sorted array"` + `"find target"` or `"insert position"`      | → **Binary Search**                           | Is search space monotonic?                                    | [BS PS](../05_Problem_Solving/07_Binary_Search.md)       |
| `"minimum X to achieve Y"`                                     | → **Binary Search on Answer**                 | Is "can I achieve with X?" monotonic?                         | [BS PS](../05_Problem_Solving/07_Binary_Search.md)       |
| `"find kth largest/smallest"`                                  | → **Min-Heap of size K**                      | K-size heap; root = kth largest                               | [Heap PS](../05_Problem_Solving/16_Heap.md)              |
| `"median of stream"` / `"balance two halves"`                  | → **Two Heaps (max + min)**                   | Max-heap left half, min-heap right half                       | [Heap PS](../05_Problem_Solving/16_Heap.md)              |
| `"two numbers add to target"` (unsorted, any)                  | → **HashMap complement**                      | One-pass: store seen values                                   | [HP PS](../05_Problem_Solving/17_HashMap_Hashing.md)     |
| `"how many subarrays sum to K"`                                | → **Prefix Sum + HashMap**                    | `count[prefixSum - k]`                                        | [HP PS](../05_Problem_Solving/17_HashMap_Hashing.md)     |
| `"group by property"` (anagrams, etc.)                         | → **HashMap grouping**                        | Key = sorted string / frequency tuple                         | [HP PS](../05_Problem_Solving/17_HashMap_Hashing.md)     |
| `"next greater element"`, `"span"`, `"histogram"`              | → **Monotonic Stack**                         | Decreasing stack; pop when violated                           | [SQ PS](../05_Problem_Solving/08_Stack_Queue.md)         |
| `"valid parentheses"`, `"balanced brackets"`                   | → **Stack matching**                          | Push open, pop and compare on close                           | [SQ PS](../05_Problem_Solving/08_Stack_Queue.md)         |
| `"level-order traversal"`, `"minimum hops"`                    | → **BFS (Queue)**                             | Layer-by-layer; use queue + level counter                     | [Tree PS](../05_Problem_Solving/09_Trees.md)             |
| `"all paths"`, `"path sum"`, `"leaf nodes"`                    | → **DFS (Recursion)**                         | Pre/in/post-order choices                                     | [Tree PS](../05_Problem_Solving/09_Trees.md)             |
| `"islands"`, `"connected components"`, `"flood fill"`          | → **DFS/BFS on grid**                         | Visit + mark grid cells                                       | [Graph PS](../05_Problem_Solving/10_Graphs.md)           |
| `"shortest path"` (unweighted graph/grid)                      | → **BFS**                                     | BFS guarantees shortest in unweighted                         | [Graph PS](../05_Problem_Solving/10_Graphs.md)           |
| `"shortest path"` (weighted, positive edges)                   | → **Dijkstra**                                | Min-heap on distance                                          | [Graph PS](../05_Problem_Solving/10_Graphs.md)           |
| `"prerequisites"`, `"order tasks"`, `"dependency"`             | → **Topological Sort**                        | Kahn's BFS or DFS postorder                                   | [Graph PS](../05_Problem_Solving/10_Graphs.md)           |
| `"find all combinations/subsets"`                              | → **Backtracking**                            | Choose → Explore → Unchoose                                   | [BT PS](../05_Problem_Solving/12_Backtracking.md)        |
| `"minimum cost to reach"`, `"maximize value"` with constraints | → **DP**                                      | Sub-problems overlap? DP.                                     | [DP PS](../05_Problem_Solving/11_Dynamic_Programming.md) |
| `"longest increasing subsequence"`                             | → **1D DP** or **Patience Sort (O(n log n))** | dp[i] = max of dp[j]+1 where j<i, nums[j]<nums[i]             | [DP PS](../05_Problem_Solving/11_Dynamic_Programming.md) |
| `"edit distance"`, `"LCS"`, `"wildcard matching"`              | → **2D String DP**                            | dp[i][j] = answer for s1[0..i] vs s2[0..j]                    | [DP PS](../05_Problem_Solving/11_Dynamic_Programming.md) |
| `"pick/skip items"`, `"knapsack"`, `"coin change"`             | → **Knapsack DP**                             | dp[i][w] = max value with capacity w                          | [DP PS](../05_Problem_Solving/11_Dynamic_Programming.md) |
| `"intervals"`, `"merge meetings"`, `"non-overlapping"`         | → **Sort by start + Greedy/Heap**             | Sort by start time; merge or count overlaps                   | [Greedy PS](../05_Problem_Solving/13_Greedy.md)          |
| `"minimum number of X"` (coins, jumps, platforms)              | → **Greedy first, then DP if fails**          | Greedy: always pick local best. If counterexample exists → DP | [Greedy PS](../05_Problem_Solving/13_Greedy.md)          |
| `"cycle in linked list"`                                       | → **Fast & Slow Pointers**                    | Floyd's tortoise & hare                                       | [LL PS](../05_Problem_Solving/15_LinkedList.md)          |
| `"reverse linked list"` / `"palindrome list"`                  | → **3-pointer reversal**                      | `prev=null; curr=head; save next; flip; advance`              | [LL PS](../05_Problem_Solving/15_LinkedList.md)          |

---

## 🌳 The Ambiguous Signals Decision Tree

Sometimes the problem signal is ambiguous and points to multiple potential patterns. Use this decision tree to disambiguate:

```mermaid
flowchart TD
    S1{"Signal: 'Subarray' / 'Substring'"} --> S1A{"Allowed to change order?"}
    S1A -->|Yes| S1B[Becomes 'Subsequence' problem]
    S1A -->|No| S1C{"Is condition monotonic?<br>(e.g., all positive nums)"}
    S1C -->|Yes| P1[Sliding Window O(n)]
    S1C -->|No| P2[Prefix Sum + HashMap O(n)]

    S2{"Signal: 'Kth Largest'"} --> S2A{"Data is a stream/dynamic?"}
    S2A -->|Yes| P3[Min/Max Heap O(N log K)]
    S2A -->|No| S2B{"Need exact Kth or Top K?"}
    S2B -->|Exact Kth| P4[QuickSelect O(N) avg]
    S2B -->|Top K| P5[Min/Max Heap O(N log K)]

    S3{"Signal: 'Min/Max cost to X'"} --> S3A{"Graph or Grid?"}
    S3A -->|Yes| S3B{"Weighted edges?"}
    S3B -->|No| P6[BFS O(V+E)]
    S3B -->|Yes| P7[Dijkstra O(E log V)]
    S3A -->|No| S3C{"Overlapping subproblems?"}
    S3C -->|Yes| P8[Dynamic Programming]
    S3C -->|No| P9[Greedy]
```

---

## 🧠 5-Question Quick Classifier (Use for Any Problem)

```
Before writing code, answer these 5 questions:

Q1: What's the input structure?
    Linear (array/string) → Sliding Window / Two Pointer / Binary Search
    Graph/Tree → BFS/DFS/DP
    Unknown/stream → Heap

Q2: What does "optimal" mean here?
    Min/Max → DP or Greedy
    Shortest → BFS (unweighted) / Dijkstra (weighted)
    All solutions → Backtracking

Q3: What's the repeating operation that's slow in brute force?
    Recomputing sum of same elements → Prefix Sum / Sliding Window
    Searching in sorted structure → Binary Search
    Checking if element was seen → HashMap/HashSet

Q4: What constraints hint at the algorithm?
    n ≤ 20 → Bitmask DP or Backtracking O(2^n)
    n ≤ 500 → O(n²) DP
    n ≤ 10^5 → O(n log n) — sort + BS, or O(n) sliding window
    n ≤ 10^7 → O(n) only — prefix sum, single-pass, two-pointer

Q5: Does the sub-problem repeat?
    Yes + optimal substructure → DP (add memoization to recursion)
    Yes + greedy choice property → Greedy (no need to remember all choices)
    No → Divide and Conquer or simple traversal
```

---

## ⚡ 30-Second Pattern Flash Cards

> Read these fast every morning. Don't think — just react.

```
"contiguous" + "sum/max/length"        → Sliding Window O(n)
"sorted" + "pair"                      → Two Pointers O(n)
"sorted" + "find target"               → Binary Search O(log n)
"min/max k elements"                   → Heap O(n log k)
"two numbers sum"                      → HashMap O(n)
"subarray sum = k"                     → Prefix Sum + HashMap O(n)
"next greater"                         → Monotonic Stack O(n)
"shortest path unweighted"             → BFS O(V+E)
"shortest path weighted"               → Dijkstra O(E log V)
"all combinations"                     → Backtracking O(2^n)
"overlapping subproblems"              → DP (memoization)
"prerequisites/dependencies"           → Topological Sort O(V+E)
"cycle in list"                        → Fast & Slow Pointers O(n)
```

---

## 🔄 Brute Force → Optimal: The Optimization Path

| Brute Force                          | Bottleneck                    | Optimization                 | Result         |
| ------------------------------------ | ----------------------------- | ---------------------------- | -------------- |
| Double loop on array O(n²)           | Re-scanning for each position | Sliding Window or Prefix Sum | O(n)           |
| Check all pairs for sum O(n²)        | Linear search for complement  | HashMap lookup               | O(n)           |
| Scan all n elements per query O(n·q) | Recomputing range sum         | Prefix sum array             | O(1) per query |
| Try all orderings O(n!)              | No pruning                    | Backtracking + prune         | O(2^n) avg     |
| Recursion with repeated calls O(2^n) | Recomputing same state        | Memoization / DP table       | O(n·k)         |
| Linear search in sorted array O(n)   | Not using sorted property     | Binary Search                | O(log n)       |

---

## 🎓 Pattern Recognition Confidence Tracker

> Mark off as you can recognize these within 30 seconds of reading a problem:

```
□ Sliding Window (fixed)
□ Sliding Window (variable)
□ Two Pointers (opposite ends)
□ Two Pointers (same direction)
□ Binary Search (classic)
□ Binary Search on Answer
□ HashMap Two-Sum
□ Prefix Sum + HashMap
□ Monotonic Stack
□ BFS on graph/grid
□ DFS on graph/grid
□ Dijkstra's algorithm
□ Topological Sort
□ Backtracking (generate all)
□ 1D DP
□ 2D DP (grid)
□ 2D DP (string comparison)
□ Knapsack DP
□ Greedy (exchange argument)
□ Min-Heap (top-K)
□ Two Heaps (median)
□ Fast & Slow Pointers
□ Dummy Head (linked list)
□ DFS on tree (postorder)
□ BFS on tree (level-order)
```

**Score yourself:**

- 0–8: Keep reading theory files
- 9–15: You're building the pattern library
- 16–20: Interview-ready
- 21–25: You ARE the pattern library

## NEW DIAGRAM — Signal to Pattern Trigger Map (Visual Quick Reference)

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│  DIAGRAM: Signal to Pattern Trigger Map — See X, Think Y, Verify Z           │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ARRAY / STRING SIGNALS:                                                     │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │  "subarray" + "contiguous" + positive values                          │    │
│  │     → PATTERN: Sliding Window (fixed or variable)                     │    │
│  │     → VERIFY: Does expanding right always improve (or not worsen) the │    │
│  │              condition? (monotonic) → YES: use SW  /  NO: prefix sum  │    │
│  ├──────────────────────────────────────────────────────────────────────┤    │
│  │  "pair" + "sorted array"                                              │    │
│  │     → PATTERN: Two Pointers (opposite ends)                           │    │
│  │     → VERIFY: Is array sorted? Can you sort it?                       │    │
│  ├──────────────────────────────────────────────────────────────────────┤    │
│  │  "two numbers sum" (unsorted, any position)                           │    │
│  │     → PATTERN: HashMap complement (one-pass)                          │    │
│  │     → VERIFY: O(1) lookup needed → HashMap works even with dups      │    │
│  ├──────────────────────────────────────────────────────────────────────┤    │
│  │  "subarray sum = K" + negative numbers allowed                        │    │
│  │     → PATTERN: Prefix Sum + HashMap                                   │    │
│  │     → VERIFY: dp[j] - dp[i] = K  →  dp[i] = dp[j] - K               │    │
│  ├──────────────────────────────────────────────────────────────────────┤    │
│  │  "find target in sorted" / "insert position"                          │    │
│  │     → PATTERN: Binary Search (classic or lower/upper bound)          │    │
│  │     → VERIFY: Is search space monotonic? (sorted / answer space)     │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  GRAPH / TREE SIGNALS:                                                       │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │  "shortest path" + unweighted graph/grid                              │    │
│  │     → PATTERN: BFS (level-by-level, guarantees shortest in edges)    │    │
│  │     → VERIFY: All edges weight 1? → BFS  /  Weighted → Dijkstra     │    │
│  ├──────────────────────────────────────────────────────────────────────┤    │
│  │  "shortest path" + weighted + non-negative edges                      │    │
│  │     → PATTERN: Dijkstra (priority queue, greedy vertex selection)    │    │
│  │     → VERIFY: No negative edges?  /  Negative → Bellman-Ford        │    │
│  ├──────────────────────────────────────────────────────────────────────┤    │
│  │  "all paths" / "does path exist" / "connected components"             │    │
│  │     → PATTERN: DFS (recursion/stack, explores depth before breadth)  │    │
│  │     → VERIFY: Need shortest? → BFS  /  Any path? → DFS               │    │
│  ├──────────────────────────────────────────────────────────────────────┤    │
│  │  "prerequisites" / "dependency order" / "topological"                 │    │
│  │     → PATTERN: Topological Sort (Kahn's BFS or DFS post-order)      │    │
│  │     → VERIFY: Graph is DAG (directed, acyclic)?                      │    │
│  ├──────────────────────────────────────────────────────────────────────┤    │
│  │  "level-order" / "minimum depth" / "closest nodes"                    │    │
│  │     → PATTERN: BFS on Tree (queue, level-by-level)                   │    │
│  │     → VERIFY: Binary tree?  /  Need traversal order? → BFS queue    │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  DP SIGNALS:                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │  "min/max/count ways" + overlapping subproblems                      │    │
│  │     → PATTERN: DP (memoization or tabulation)                        │    │
│  │     → VERIFY: Can you define state dp[i] meaning? Transition clear?  │    │
│  ├──────────────────────────────────────────────────────────────────────┤    │
│  │  "longest increasing subsequence" / "best arrangement"                │    │
│  │     → PATTERN: 1D DP (dp[i] = best ending at i)                      │    │
│  │     → VERIFY: dp[i] depends on dp[j] for j < i?  → O(n^2) needed   │    │
│  ├──────────────────────────────────────────────────────────────────────┤    │
│  │  "edit distance" / "LCS" / "wildcard matching"                        │    │
│  │     → PATTERN: 2D String DP (dp[i][j] = s1[0..i] vs s2[0..j])       │    │
│  │     → VERIFY: Two strings? Need to compare characters? → 2D DP      │    │
│  ├──────────────────────────────────────────────────────────────────────┤    │
│  │  "knapsack" / "pick/skip items" / "coin change"                       │    │
│  │     → PATTERN: Knapsack DP (dp[i][w] = best with i items, cap w)    │    │
│  │     → VERIFY: 0/1 (one use) → iterate capacity backward             │    │
│  │                Unbounded (unlimited) → iterate forward              │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  HEAP / PRIORITY QUEUE SIGNALS:                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │  "Kth largest/smallest" / "top K elements"                            │    │
│  │     → PATTERN: Min/Max Heap of size K                                 │    │
│  │     → VERIFY: K-size heap keeps root = Kth largest  → O(n log K)    │    │
│  ├──────────────────────────────────────────────────────────────────────┤    │
│  │  "sliding window max" / "max in every K-window"                       │    │
│  │     → PATTERN: Monotonic Deque (decreasing deque)                     │    │
│  │     → VERIFY: Need max/min over all windows? → monotonic deque      │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ⚠️  CONSTRAINT OVERRIDES — always check these:                             │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │  Signal points to SLIDING WINDOW → Check: Are there NEGATIVE values? │    │
│  │     YES (negatives break monotonicity) → Use PREFIX SUM + HASHMAP    │    │
│  │                                                                        │    │
│  │  Signal points to BFS for shortest path → Check: Are edges WEIGHTED? │    │
│  │     YES (weighted) → Use DIJKSTRA (non-neg) or BELLMAN-FORD (neg)   │    │
│  │                                                                        │    │
│  │  Signal points to GREEDY → Check: Is greedy provably optimal?        │    │
│  │     NOT SURE → Fall back to DP (always correct, slower)              │    │
│  │                                                                        │    │
│  │  Signal points to BINARY SEARCH → Check: Is predicate MONOTONIC?     │    │
│  │     NO (predicate false-true-false) → Binary search WON'T work       │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Historical Evolution

> **Why this section**: mental-model pedagogy requires knowing the prior art. The frameworks below all have named predecessors — naming them prevents reinventing the wheel and connects your reasoning to decades of computer-science practice.

| Year | Predecessor | Contribution |
| --- | --- | --- |
| 1977 | Alexander | *A Pattern Language* — signal-driven pattern matching |
| 1945 | Polya | *How to Solve It* — heuristic problem recognition |
| 1994 | Gamma et al. | *Design Patterns* — named pattern catalog for software |
| 1980 | Lakoff & Johnson | *Metaphors We Live By* — conceptual metaphor as mental trigger |
| 2004 | McConnell | *Code Complete 2e* — constraint-based pattern selection |

**Evolution narrative**: Pattern trigger thinking as a methodology traces to two converging traditions. Polya's 1945 *How to Solve It* established the heuristic approach: recognizing problem categories by their surface signals and mapping them to solution strategies. Christopher Alexander's 1977 *A Pattern Language* demonstrated that these recognitions can be captured as named, transferable templates with explicit "context → problem → solution" structures. The Gang of Four's 1994 *Design Patterns* cataloged these for software, while Lakoff and Johnson's 1980 cognitive science research explained WHY pattern recognition works: metaphor maps unfamiliar structures onto familiar ones. Steve McConnell's 2004 *Code Complete 2e* added the constraint-based layer: signal meaning depends on context (constraints) not just surface features.

**Modern practice anchor**: Today's competitive programming and interview prep (LeetCode tags, CTCI signal tables, Pramp mock interviews) use the signal-to-pattern mapping that descends directly from Polya-Alexander-McConnell: "if you see X signal and Y constraint, the correct approach is Z pattern" — making the mapping explicit, transferable, and trainable.

## Production Reality

> **Why this section**: a mental model is only useful if it predicts what breaks in production. Below are named failure modes tied to this mental model, with debug workflows and modern observability tools.

### Failure Mode 1: Sliding Window Pattern Misapplied — O(n²) Instead of O(n)

**What goes wrong**: A developer sees "subarray" and selects sliding window. But the problem has negative numbers. Expanding the window can decrease the sum, so the window condition is not monotonic — sliding window fails silently on negative inputs. The code passes in staging with non-negative test data but fails on production financial data that includes refunds (negative values).

**Cost**: Silent correctness failure in production. Wrong financial calculations. Requires audit of all affected records. MTTR of 2-3 days to identify the root cause.

**Debug workflow**:
1. Check the constraint override table: if negative numbers are allowed, sliding window is the WRONG pattern. Use prefix sum + HashMap instead.
2. Add production data shape detection: compute `min(arr)` during ingestion. If `min < 0`, flag the dataset as "requires prefix-sum pattern, not sliding window."
3. Write property-based tests with negative numbers: Hypothesis generates random arrays with negative values and verifies the output matches a reference brute-force implementation.
4. Profile the two candidate patterns on production data size: prefix sum + HashMap should be O(n) regardless of sign; sliding window with negatives can degrade to O(n^2) in the worst case.

### Failure Mode 2: HashMap Pattern — Cache Stampede Under Production Load

**What goes wrong**: A caching layer uses a HashMap for hot keys. When the cache misses and a popular key is evicted, 1,000 concurrent requests all see the same miss, all call the backend simultaneously (thundering herd). The backend is overwhelmed by 1,000 simultaneous identical requests. The HashMap cache design worked fine at 10 QPS, fails catastrophically at 10,000 QPS.

**Cost**: Backend overload. Cascading failure. Service unavailability. Lasts until the cache is repopulated or the backend recovers. At 10,000 QPS with 1-second backend latency, the backend accumulates 10,000 in-flight requests.

**Debug workflow**:
1. Implement cache locking: only one thread repopulates the cache; others wait or get stale data. `if (cache.get(key) == null) { lock(key); if (cache.get(key) == null) { populate(); } unlock(key); }`
2. Use a probabilistic cache (QDF, TinyLFU): evict based on frequency, not just recency. Prevents popular keys from being evicted by one-time large batch.
3. Add cache stampede detection: monitor `cache_miss_rate` vs `cache_hit_rate`. If miss rate spikes above 5% during high load, the stampede may be occurring.
4. Use Redis `GET with NX` (set-if-not-exists) for distributed cache: only one process repopulates; others get `nil` and wait.

### Failure Mode 3: Heap Pattern — Wrong K Causes O(n log n) at Wrong Scale

**What goes wrong**: A "Top K" implementation uses a min-heap of size K. Works perfectly for K=100 with n=1,000,000. But the production use case needs K=100,000 (displaying the top 100,000 results for analytics). A heap of size 100,000 requires O(100,000 log 100,000) ≈ 1.7 million operations per insertion — acceptable once but at n=10,000,000 items, this becomes O(n log K) = 10M * 17 ≈ 170M operations, causing a 10-second processing delay on every report generation.

**Cost**: SLA breach for analytics report generation. Users wait 10+ seconds for reports that should generate in <1 second. Engineering investigates "slow database queries" for days before identifying the heap sizing issue.

**Debug workflow**:
1. Measure `K / n` ratio: if K > n/10, heap may not be the right tool. For K > n/10, sorting the full array O(n log n) may be faster than O(n log K).
2. Use QuickSelect (O(n) average) for exact Kth retrieval: `findKthLargest(arr, K)` — linear time, not logarithmic in K.
3. Profile per operation: measure `heap.push()` time in production telemetry. If p99 push time exceeds 1ms, the heap may be oversized.
4. Document the heap-size decision: "K=100 is safe; K>1000 requires profiling; K>n/10 use QuickSelect."

### Modern Production Tools

- **Hypothesis (property-based testing)**: Automatically generate edge cases including negative numbers, boundary sizes, and monotonicity violations. Detects pattern misapplication before production.
- **Prometheus `histogram_quantile(0.99, rate(cache_operation_seconds_bucket[5m]))`**: Track p99 latency per pattern type. Sliding window should be O(1) per step; if p99 grows with input size, pattern is wrong.
- **Datadog APM span analysis**: Each pattern (heap push, hashmap lookup, sliding window step) appears as a separate span. Identify which pattern dominates runtime.
- **`-XX:+PrintCompilation` + async-profiler**: For JVM-based systems, identify which hot path methods are using wrong-pattern algorithms and contributing to CPU overhead.
- **Pattern → load-shape mapping table**: Maintain a table: "n<1K → any pattern OK; n<100K → heap/K fixed; n>1M → heap/K dynamic or QuickSelect." Review at architecture stage.

## Conceptual Depth & Topical Breadth

> **Why this section**: this mental model rests on a specific invariant, and its variants cover a spectrum of trade-offs. Knowing the invariant and the variants lets you apply the model correctly across problems.

### Invariant

**Constraint → pattern recognition is the core skill**. The invariant is that problem signals (keywords, constraints, structures) map deterministically to algorithm patterns. "Subarray sum equals k" triggers prefix sum. "Shortest path" triggers BFS. "Optimal" triggers DP or greedy. The internal mechanism is **signal extraction**: reading a problem statement and identifying salient features (input structure, constraint values, output requirements) that uniquely determine the pattern.

### Variants Comparison

| Input Signal | Problem Class | Pattern Trigger | Complexity |
| --- | --- | --- | --- |
| Sorted array | Search, pair finding | Binary search / two-pointer | O(log n) or O(n) |
| Unsorted array | Lookups, counting | HashMap | O(n) |
| Subarray / substring | Window problems | Sliding window | O(n) |
| Graph (nodes + edges) | Connectivity, paths | BFS / DFS / Dijkstra | O(V+E) |
| Tree (hierarchical) | Tree operations | DFS (recursive) | O(n) |
| Matrix / grid | 2D traversal | BFS / DFS | O(mn) |
| Intervals | Scheduling, merging | Sort + sweep | O(n log n) |
| String patterns | Matching, parsing | KMP / Trie | O(n) or O(m+n) |
| All combinations | Enumeration | Backtracking | O(2^n) or O(n!) |
| Subset sum / knapsack | Optimization | DP | O(nW) or O(n^2) |


---

## Reality Check

**"Triggers are keyword lookups"** ? Mature triggers are COMPOUND CONDITIONS, and the compounds are what distinguish them from the keyword tables beginners memorize: not "sorted ? binary search" but "sorted AND asking position/existence AND better-than-linear expected ? binary search; sorted AND pairing elements ? two pointers; sorted AND merging ? parallel pointers." Single-keyword triggers misfire constantly because problem setters plant decoy keywords; compound triggers fire on structure, which cannot be faked.

**"A trigger guide is memorized once"** ? A trigger guide is a LIVING calibration log: every practice miss is a trigger bug � either a missing trigger (never considered the pattern), a misfire (considered it wrongly), or a tie unresolved (considered two, chose wrong) � and the guide only compounds if misses update it. The maintenance ritual that works: after each failed problem, write the one-line trigger that WOULD have fired correctly, in your own words, into your own copy. A static guide read twice is worth one session; a maintained guide is worth every session it absorbs.

**"Strong triggers fire on the problem statement"** ? The strongest triggers fire on the CONSTRAINTS and the ANSWER TYPE before the story is even parsed: n = 20 fires bitmask/backtracking, n = 10^5 kills quadratic, values = 100 fires counting arrays, "count the ways" fires DP-or-math, "return any valid" fires greedy/constructive, "minimum maximum" fires binary-search-on-answer. Story-level triggers are the second wave, constraint-level the first � and reading the problem in that order (constraints, question sentence, THEN narrative) is itself the meta-trigger that guides everything downstream.

**"When two triggers fire, pick the more advanced pattern"** ? Ties break by CHEAPEST DISPROOF, not sophistication: test the simpler candidate against a hostile 5-element input first � thirty seconds either eliminates it or promotes it. The sophistication heuristic runs exactly backwards (setters bait advanced-pattern overreach; the sorted-greedy that solves the fake segment-tree problem is a genre), and the disproof habit doubles as the verification habit � the same adversarial input that breaks the wrong pattern later stress-tests the right one.

**"Perfect triggers would make solving mechanical"** ? Triggers get you to the pattern NEIGHBORHOOD; residual work � the state definition, the invariant phrasing, the seam in a composition � is where problems still resist after correct routing, and no trigger granularity eliminates it. The honest division of labor: triggers compress the search over approaches (the part that panics people under time pressure), leaving full attention for instantiation (the part that rewards it). Chasing trigger perfection past that point is cataloging, not preparing � the guide is a router, and routers do not write the payload.
