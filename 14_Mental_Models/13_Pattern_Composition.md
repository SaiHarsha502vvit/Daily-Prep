**Navigation**: [< Previous](12_Space_Time_Tradeoffs.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](14_Optimization_Pipeline.md)

**Mental Model 13** | [Index](../00_MASTER_INDEX.md)

---

# 🧠 PATTERN COMPOSITION — COMBINING MULTIPLE PATTERNS

## Why This Matters

Easy problems = 1 pattern. Medium = 1-2 patterns. Hard = 2-3 patterns.
At LC Hard level, the challenge isn't knowing patterns —
it's COMPOSING them. You need to recognize that a problem
requires Binary Search INSIDE DP, or BFS WITH Bit Masking,
or Trie PLUS Backtracking.
This guide maps the most common COMPOSITION PAIRS and teaches
you to recognize when a problem needs multiple patterns.

## Theory Lens: Why Composition Is the Real Skill Ceiling

Single-pattern thinking answers "which tool is this?".
Composition thinking answers "in what sequence should tools cooperate?".

Most hard problems have two distinct layers:

1. Search space strategy: how you explore possibilities (BFS, DFS, binary search, two pointers).
2. State compression or validation strategy: how you prove/check each step efficiently (DP, bitmask, trie, greedy invariant).

A strong composition workflow:

1. Define the optimization goal or decision predicate.
2. Choose the outer control pattern (search, traversal, ordering).
3. Choose the inner feasibility/state pattern.
4. Validate monotonicity or invariant correctness.
5. Estimate total complexity as outer-cost x inner-cost.

If you can articulate both outer and inner roles, you stop "trying random patterns" and start engineering solutions with predictable correctness.

## The Top 15 Pattern Compositions

# COMPOSITION EXAMPLE PROBLEM LC#

══ ═══════════════════════ ═══════════════════════════ ═══
1 Binary Search + Greedy Split Array Largest Sum 410
2 BFS + Bitmask DP Shortest Path Visit All 847
3 Trie + Backtracking Word Search II 212
4 Sorting + Two Pointers 3Sum 15
5 Binary Search + Sliding Min Size Subarray Sum 209
6 Graph + DP Cheapest Flight K Stops 787
7 Heap + Greedy Task Scheduler 621
8 Union-Find + Sort Accounts Merge 721
9 Monotonic Stack + DP Largest Rectangle Histogram 84
10 Prefix Sum + HashMap Subarray Sum Equals K 560
11 Binary Search + Matrix Search 2D Matrix II 240
12 DFS + Memoization Longest Inc Path in Matrix 329
13 Topological Sort + DP Course Schedule + min time —
14 Segment Tree + Sweep Count Smaller After Self 315
15 Trie + DP Word Break 139

---

## COMPOSITION 1: Binary Search + Greedy / "Binary Search On The Answer"

**Trigger**: "Minimize the maximum" or "Maximize the minimum"

**How It Works**:

1. Binary search on the ANSWER space (lo=min possible, hi=max possible)
2. For each candidate answer, GREEDILY check: "is this feasible?"
3. Narrow the search based on feasibility

**Visual**:
Answer space: [lo ─────────── mid ─────────── hi]
feasible(mid)?
YES → search lower (minimize max)
NO → search higher

**Example**: Split Array Largest Sum (LC 410)
"Split array into m subarrays to minimize the largest subarray sum"

- Binary search: lo=max(nums), hi=sum(nums)
- Greedy check: Can we split into ≤ m parts, each ≤ mid?
  Iterate array, greedy: start new partition when sum exceeds mid.
- If partitions ≤ m → feasible → try smaller

**Other Problems**:

- Koko Eating Bananas (LC 875): BS on speed, greedy check hours
- Ship Packages in D Days (LC 1011): BS on capacity, greedy check days
- Magnetic Force (LC 1552): BS on min distance, greedy check placement

```java
// Template: Binary Search on Answer + Greedy Feasibility
public int splitArray(int[] nums, int m) {
    int lo = 0, hi = 0;
    for (int n : nums) { lo = Math.max(lo, n); hi += n; }

    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (canSplit(nums, m, mid)) hi = mid;     // Feasible → try smaller
        else lo = mid + 1;                          // Not feasible → go bigger
    }
    return lo;
}

private boolean canSplit(int[] nums, int m, int maxSum) {
    int parts = 1, curSum = 0;
    for (int n : nums) {
        if (curSum + n > maxSum) { parts++; curSum = n; }
        else curSum += n;
    }
    return parts <= m;  // Greedy check
}
```

---

🔬 **Section Challenge — Pattern: "Binary Search On The Answer"**

**Challenge 1 (Design):** You are tasked with determining the minimum capacity a ship needs to transport `N` packages in `D` days. You cannot change the order of the packages. Define the `lo` and `hi` boundaries for your binary search answer space.

<details><summary>Answer</summary>

- `lo`: The maximum weight of any single package in the array. (If the ship capacity is smaller than the heaviest package, you can never transport it, so the ship would be stuck).
- `hi`: The sum of all package weights in the array. (This is the capacity needed if you want to ship everything on day 1).
  The answer MUST lie in the range `[max_weight, sum_weight]`.

</details>

**Challenge 2 (Trace):** What happens if the greedy feasibility check returns exactly `D` days used for capacity `mid`? Do you stop the binary search and return `mid`?

<details><summary>Answer</summary>

No! If capacity `mid` takes `D` days, it's a _feasible_ answer, but it might not be the _minimum_ feasible capacity. A capacity of `mid - 1` might _also_ take exactly `D` days. You record `mid` as a valid answer (by setting `hi = mid`), but you continue binary searching the lower half to see if you can squeeze the capacity even further without exceeding `D` days.

</details>

## COMPOSITION 2: BFS + Bitmask DP

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ PATTERN: BFS with State = (node, visited bitmask)                            │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  TRIGGER: "Visit all nodes" / "Shortest path through all" / n ≤ 20           │
│                                                                              │
│  HOW IT WORKS:                                                               │
│  • State = (current node, set of visited nodes encoded as bitmask)           │
│  • BFS explores all states level by level (shortest path)                    │
│  • Bitmask fits in int when n ≤ 20 (2²⁰ = ~1M states)                        │
│                                                                              │
│  EXAMPLE: Shortest Path Visiting All Nodes (LC 847)                          │
│  • BFS from every node simultaneously                                        │
│  • State: (node, mask) where mask has bit i set if node i visited            │
│  • Goal: any state with mask = (1<<n)-1 (all bits set)                       │
│                                                                              │
│  OTHER: Travelling Salesman (n ≤ 20), Hamilton Path                          │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## COMPOSITION 3: Trie + Backtracking

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ PATTERN: Build Trie of words, then DFS/backtrack on grid/string              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  TRIGGER: "Find all words from dictionary in a grid/string"                  │
│                                                                              │
│  HOW IT WORKS:                                                               │
│  • Build Trie from dictionary words → O(sum of word lengths)                 │
│  • DFS/backtrack on grid, following Trie branches                            │
│  • Trie PRUNES backtracking: if no child for current char → stop             │
│                                                                              │
│  WHY COMPOSED: Backtracking alone = recheck every word start O(W×4ⁿ).        │
│  Trie = single DFS checks ALL words simultaneously.                          │
│                                                                              │
│  EXAMPLE: Word Search II (LC 212)                                            │
│  • Insert all words into Trie                                                │
│  • DFS from every cell, walk Trie simultaneously                             │
│  • When Trie node has word → found it                                        │
│  • Optimization: remove word from Trie after finding (prune)                 │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## COMPOSITION 4: Prefix Sum + HashMap

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ PATTERN: Precompute prefix sums, use HashMap for target lookup               │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  TRIGGER: "Count/find subarrays with sum = k"                                │
│                                                                              │
│  HOW IT WORKS:                                                               │
│  • prefix[j] - prefix[i] = sum(i..j)                                         │
│  • For target k: need prefix[j] - k in map                                   │
│  • HashMap stores frequency of each prefix sum seen so far                   │
│                                                                              │
│  EXAMPLE: Subarray Sum Equals K (LC 560)                                     │
│  • Walk array, maintain running prefix sum                                   │
│  • At each position, check: map.containsKey(prefix - k)?                     │
│  • Add current prefix to map                                                 │
│                                                                              │
│  OTHER: Contiguous Array (LC 525), Path Sum III (LC 437)                     │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

🔬 **Section Challenge — COMPOSITION 4: Prefix Sum + HashMap**

**Challenge 1 (Trace):** In the "Subarray Sum Equals K" problem, why does the map store the _frequency_ of prefix sums rather than just a boolean `true`/`false` for existence?

<details><summary>Answer</summary>

Because array elements can be `0` or negative. If the array has negative numbers or zeros, the same prefix sum can occur at multiple different indices. For example, in `[3, 0, 0, 4]`, the prefix sum is `3` at index 0, 1, and 2. If `K = 4`, and we are at index 3 (prefix sum = 7), we need `7 - 4 = 3`. Since the prefix sum `3` appeared _three times_ previously, there are exactly three different valid subarrays ending at index 3 that sum to 4: `[4]`, `[0, 4]`, and `[0, 0, 4]`. If we only stored boolean existence, we would only count it as 1 subarray, giving the wrong answer.

</details>

## COMPOSITION 5: DFS + Memoization

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ PATTERN: Top-down DP on graph/grid structure                                 │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  TRIGGER: "Longest/count paths in grid with constraints"                     │
│                                                                              │
│  HOW IT WORKS:                                                               │
│  • DFS explores all paths from each cell                                     │
│  • Memoize result per cell to avoid recomputation                            │
│  • Without memo: exponential. With memo: O(V×E) or O(n×m).                   │
│                                                                              │
│  EXAMPLE: Longest Increasing Path in Matrix (LC 329)                         │
│  • DFS from each cell, only move to strictly larger neighbors                │
│  • memo[i][j] = longest path starting from (i,j)                             │
│  • Each cell computed once → O(m×n)                                          │
│                                                                              │
│  OTHER: Number of Increasing Paths (LC 2328), Out of Boundary Paths (576)    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## NEW DIAGRAM — Pattern Composition Map (Outer/Inner Pattern Pairings)

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│  DIAGRAM: Pattern Composition Map — Outer + Inner Pattern Pairings          │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  THE COMPOSITION PRINCIPLE:                                                  │
│  HARD problems = 2-3 patterns working TOGETHER.                              │
│  Outer pattern = SEARCH SPACE strategy (how you explore possibilities)      │
│  Inner pattern = STATE VALIDATION (how you check/prove each step)           │
│                                                                              │
│  MOST COMMON COMPOSITION PAIRS:                                              │
│  ┌─────────────────────┬───────────────────┬────────────────────────────┐   │
│  │ OUTER (search)      │ INNER (validate)  │ PROBLEM                   │   │
│  ├─────────────────────┼───────────────────┼────────────────────────────┤   │
│  │ Binary Search       │ Greedy Feas.Check │ Minimize max sum           │   │
│  │ (answer space)      │ (can we split?)   │ Split Array Largest Sum   │   │
│  ├─────────────────────┼───────────────────┼────────────────────────────┤   │
│  │ BFS                 │ Bitmask state     │ Shortest visiting all     │   │
│  │ (level expansion)   │ (visited set)     │ nodes (LC 847, n<=20)     │   │
│  ├─────────────────────┼───────────────────┼────────────────────────────┤   │
│  │ DFS/Backtracking    │ Trie lookup       │ All dictionary words      │   │
│  │ (explore grid)      │ (prune dead ends) │ in grid (Word Search II)  │   │
│  ├─────────────────────┼───────────────────┼────────────────────────────┤   │
│  │ Single Pass         │ Prefix Sum +      │ Count subarrays sum=K     │   │
│  │ (scan array)        │ HashMap           │ (LC 560, neg allowed)     │   │
│  ├─────────────────────┼───────────────────┼────────────────────────────┤   │
│  │ DFS on Grid         │ Memoization       │ Longest inc path in       │   │
│  │ (explore neighbors) │ (cache cell state) matrix (LC 329)            │   │
│  ├─────────────────────┼───────────────────┼────────────────────────────┤   │
│  │ BFS (layers)        │ DP state          │ Cheapest flights within   │   │
│  │ (expand frontier)   │ (day, k, cost)    │ K stops (LC 787)          │   │
│  ├─────────────────────┼───────────────────┼────────────────────────────┤   │
│  │ Sort + Sweep        │ Heap (top K)      │ Task Scheduler            │   │
│  │ (order events)      │ (pick next task)  │ (min intervals, LC 621)   │   │
│  ├─────────────────────┼───────────────────┼────────────────────────────┤   │
│  │ Topological Sort    │ DP (path length)  │ Course Schedule +         │   │
│  │ (dependency order)  │ (best way)        │ minimum time (weighted)   │   │
│  ├─────────────────────┼───────────────────┼────────────────────────────┤   │
│  │ Merge Sort          │ Count inversion   │ Count smaller after self  │   │
│  │ (divide + merge)    │ during merge      │ (LC 315)                  │   │
│  └─────────────────────┴───────────────────┴────────────────────────────┘   │
│                                                                              │
│  HOW TO RECOGNIZE A COMPOSITION:                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │  "Minimize the maximum" → BinSearch(answer) + Greedy(check)         │    │
│  │  "Visit all nodes (n<=20)" → BFS + Bitmask state (visited set)      │    │
│  │  "Find all dict words in grid" → DFS + Trie (prunes dead branches)  │    │
│  │  "Subarray sum = K (neg OK)" → Prefix Sum + HashMap (O(n))          │    │
│  │  "Longest path in matrix" → DFS + Memo (avoid recompute)            │    │
│  │  "Word break" → DP over positions + Trie (fast word lookup)        │    │
│  │                                                                       │    │
│  │  DIFFICULTY SCALING:                                                  │    │
│  │  Easy: 1 pattern / Medium: 1-2 obvious / Hard: 2-3 non-obvious     │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────────┘
```

## 🔍 How to Recognize Compositions

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ THE RECOGNITION CHECKLIST                                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  When you read a problem, identify:                                          │
│                                                                              │
│  1. WHAT DATA STRUCTURE is implied?                                          │
│     → Grid/graph/tree/string/array → narrows pattern space                   │
│                                                                              │
│  2. WHAT OPERATION is needed?                                                │
│     → Search / Count / Optimize / Check feasibility                          │
│                                                                              │
│  3. DOES ONE PATTERN LEAVE A GAP?                                            │
│     → "I know it's DP, but how do I check feasibility?" → + Binary Search    │
│     → "I know it's backtracking, but too slow" → + Trie/pruning              │
│     → "I know it's BFS, but state space is huge" → + Bitmask compression     │
│                                                                              │
│  COMPOSITION SIGNALS:                                                        │
│  • "Minimize the maximum" → Binary Search on Answer + Greedy                 │
│  • "Visit all (n≤20)" → BFS + Bitmask                                        │
│  • "Find all dictionary words in grid" → Trie + Backtracking                 │
│  • "Subarray sum equals k" → Prefix Sum + HashMap                            │
│  • "Longest path in DAG" → Topological Sort + DP                             │
│  • "Count inversions / smaller after self" → Merge Sort + counting           │
│  • "Optimal with constraints on path" → Dijkstra + state DP                  │
│                                                                              │
│  THE DIFFICULTY LADDER:                                                      │
│  Easy:   1 pattern                                                           │
│  Medium: 1-2 patterns, obvious composition                                   │
│  Hard:   2-3 patterns, non-obvious composition                               │
│  Expert: 3+ patterns or novel composition                                    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 COMPOSITION PRACTICE PROBLEMS

| #   | Problem                                                                                          | LC# | Composition          | Why Both Needed         |
| --- | ------------------------------------------------------------------------------------------------ | --- | -------------------- | ----------------------- |
| 1   | [Split Array Largest Sum](https://leetcode.com/problems/split-array-largest-sum/)                | 410 | BinSearch + Greedy   | Minimize the maximum    |
| 2   | [Word Search II](https://leetcode.com/problems/word-search-ii/)                                  | 212 | Trie + Backtracking  | Multi-word grid search  |
| 3   | [Subarray Sum Equals K](https://leetcode.com/problems/subarray-sum-equals-k/)                    | 560 | Prefix Sum + HashMap | Subarray target count   |
| 4   | [Longest Inc Path in Matrix](https://leetcode.com/problems/longest-increasing-path-in-a-matrix/) | 329 | DFS + Memo           | Grid DP with directions |
| 5   | [Shortest Path All Nodes](https://leetcode.com/problems/shortest-path-visiting-all-nodes/)       | 847 | BFS + Bitmask        | Visit all, shortest     |
| 6   | [Koko Eating Bananas](https://leetcode.com/problems/koko-eating-bananas/)                        | 875 | BinSearch + Greedy   | Min speed feasibility   |
| 7   | [3Sum](https://leetcode.com/problems/3sum/)                                                      | 15  | Sort + Two Pointers  | Reduce N³ to N²         |
| 8   | [Task Scheduler](https://leetcode.com/problems/task-scheduler/)                                  | 621 | Heap + Greedy        | Frequency scheduling    |
| 9   | [Cheapest Flights K Stops](https://leetcode.com/problems/cheapest-flights-within-k-stops/)       | 787 | Graph + DP           | BFS with cost+stops     |
| 10  | [Word Break](https://leetcode.com/problems/word-break/)                                          | 139 | Trie + DP            | Dictionary segmentation |

## Historical Evolution

> **Why this section**: mental-model pedagogy requires knowing the prior art. The frameworks below all have named predecessors — naming them prevents reinventing the wheel and connects your reasoning to decades of computer-science practice.

| Year | Predecessor | Contribution |
| --- | --- | --- |
| 1977 | Alexander | *A Pattern Language* — pattern as problem-solution template |
| 1994 | Gamma, Helm, Johnson, Vlissides | *Design Patterns* — composite solutions for object-oriented design |
| 1999 | Fowler | *Refactoring* — pattern composition in code improvement |
| 1957 | Bellman | Subproblem decomposition — optimal substructure for composition |
| 1968/1973 | Knuth | *TAOCP* — algorithm analysis and composition techniques |

**Evolution narrative**: The concept of pattern composition as a problem-solving technique traces to Christopher Alexander's 1977 *A Pattern Language*, which introduced the idea that architectural problems and solutions could be captured as named, reusable templates with explicit relationships between them. The Gang of Four (Gamma, Helm, Johnson, Vlissides) translated this to software engineering in their 1994 *Design Patterns* book, demonstrating that complex object-oriented designs could be understood as compositions of named patterns with defined roles. Martin Fowler's 1999 *Refactoring* extended this to the observation that code improvement itself is pattern composition: replacing one implementation pattern with a better combination. The algorithmic parallel emerged from Bellman's dynamic programming (subproblem decomposition) and Knuth's algorithm analysis (composition analysis) traditions.

**Modern practice anchor**: Today's hard-problem composition strategy (LeetCode Hard, competitive programming) uses the outer/inner pattern framework (search-space strategy + state-validation strategy) that directly descends from Alexander's pattern language theory applied to algorithmic problem-solving, enabling programmers to recognize that problems like "Split Array Largest Sum" are binary search (outer) + greedy feasibility check (inner).

## Production Reality

> **Why this section**: a mental model is only useful if it predicts what breaks in production. Below are named failure modes tied to this mental model, with debug workflows and modern observability tools.

### Failure Mode 1: Outer Pattern Wrong — Entire Solution Built on Wrong Foundation

**What goes wrong**: A developer identifies the problem as a sliding window problem (outer layer) but misses that the constraint (negative numbers) breaks sliding window monotonicity. They spend 3 days implementing an O(n) sliding window solution. It fails on negative-number test cases. The real solution was prefix sum + hashmap (O(n)), which they discover too late to implement correctly.

**Cost**: Feature delayed by days. Emergency release with rushed code. Quality debt from implementing two solutions (broken sliding window + patch). Engineering time lost.

**Debug workflow**:
1. Before choosing the outer pattern, explicitly check constraints: "Are there negative numbers? Is the window condition monotonic?" Use the constraint override table before committing to a pattern.
2. Write per-pattern test cases in CI: if sliding window is the chosen pattern, CI must run tests with negative numbers, zeros, and all-same values. Fail if any fail.
3. Trace the outer pattern's contribution in the profiler: if the outer pattern accounts for <5% of total runtime, the pattern choice is correct; if it accounts for most runtime and is O(n^2), the pattern is wrong.
4. Start with brute force: verify the pattern works on brute force before optimizing. The brute force + pattern hybrid is always correct.

### Failure Mode 2: Pattern Interaction Bug — Sliding Window + HashMap O(n^2) When Meant to Be O(n)

**What goes wrong**: A solution combines sliding window (outer) with hashmap (inner) to find "longest substring with at most K distinct chars." The inner hashmap lookup is O(1), but the sliding window expansion checks `map.get(char)` inside the loop — correct. However, a subtle bug: when shrinking the window, the code forgets to delete the character from the hashmap, causing the hashmap to accumulate stale entries. The algorithm eventually fails for long strings with many distinct characters.

**Cost**: Silent correctness degradation. The bug only manifests on long inputs (n > 10,000 with K=5 and many distinct chars). Production data eventually hits this size and the bug surfaces.

**Debug workflow**:
1. Write integration tests with production-length strings (n=100,000). Run them in CI — short strings (n=1,000) won't expose the stale-entry bug.
2. Add `assert map.size() <= K` after each window adjustment in debug mode — catches stale entries immediately.
3. Trace pattern interactions in profiler: look for hashmap `size()` growing beyond expected bounds (e.g., >K entries for K-distinct-char problem).
4. Use type-checked custom collections: a `BoundedFrequencyMap<K, V>` that throws on overflow makes stale-entry bugs fail fast.

### Failure Mode 3: Recursive + Memoization + Graph-Search Hybrid Off-by-One

**What goes wrong**: A solution for "longest path in matrix" uses DFS + memoization. The memo table is indexed by `(row, col)`. An off-by-one error in the recursive call passes `(row+1, col)` instead of `(row-1, col)` for the down neighbor, or the base case incorrectly returns 0 for cells at the boundary. The algorithm produces wrong answers for corner cells and silently passes on most inputs.

**Cost**: Wrong answers in production for specific edge cases (boundary cells). User data analysis produces incorrect results. Requires manual audit of edge case handling to find.

**Debug workflow**:
1. Add explicit boundary tests to CI: matrix with 1 row, 1 column, all same values, and snake-pattern paths that test every boundary direction.
2. Add `assert visited[i][j] == false` in the memoization cache access — catches duplicate state computation that signals off-by-one state issues.
3. Print the memo table for small inputs and verify each cell is computed the expected number of times. A cell computed twice means a state collision from off-by-one.
4. Use a debugger with recursive call stack visualization: trace the recursion tree for n=3×3 grid, verify each cell is explored in the expected direction.

### Modern Production Tools

- **pytest-benchmark / JMH**: Profile each pattern layer independently. For the outer pattern: measure scan time. For the inner pattern: measure lookup/update time. Ratio reveals whether patterns interact correctly.
- **Hypothesis (property-based testing)**: Generate random inputs including edge cases (negative numbers, boundary sizes, all-same) and verify pattern composition produces correct output against a reference brute force.
- **Datadog APM span breakdown**: For composed patterns in microservices, each pattern's contribution is visible as a separate span. If one span takes 95% of time, that's your bottleneck.
- **Integration test suites per pattern**: Maintain a test file `test_sliding_window.py`, `test_prefix_hashmap.py`, etc. Run all compositions against these suite — a failure means the composition is using a pattern incorrectly.
- **TypeScript `ReadonlySet` / Java `Collections.unmodifiableMap`**: Prevent accidental mutation of memo tables during DFS — stale entries are the signature of composition bugs in memoized DFS.

## Conceptual Depth & Topical Breadth

> **Why this section**: this mental model rests on a specific invariant, and its variants cover a spectrum of trade-offs. Knowing the invariant and the variants lets you apply the model correctly across problems.

### Invariant

Hard problems decompose into **familiar patterns + glue logic**. The invariant is that a composite problem has two parts: the outer pattern (which structures the overall computation) and the inner pattern (which handles local optimization or lookup). The outer pattern determines the asymptotic complexity; the inner pattern determines the per-step cost. For example, "outer BFS + inner Dijkstra" gives BFS on a weighted graph (using Dijkstra instead of simple queue pop). The key insight is that **the boundary between patterns must be clean**: the outer pattern iterates; the inner pattern optimizes. If the patterns bleed into each other (e.g., the inner optimization depends on the outer traversal state in a non-composable way), the composition fails.

### Variants Comparison

| Outer Pattern | Inner Pattern | Combined Use Case | Complexity |
| --- | --- | --- | --- |
| BFS | Bitmask (state visited) | Shortest path with forbidden states | O(N * 2^K) where K = forbidden set size |
| DFS | Memoization | DP over tree/graph structure | O(N) with memo vs O(2^N) brute |
| Binary Search | Greedy (feasibility check) | Search on monotone predicate | O(log N * check_time) |
| Sliding Window | HashMap frequency | Longest substring with conditions | O(N) average |
| Prefix Sum | HashMap | Subarray sum equals K | O(N) |
| Trie | DFS | Prefix matching, autocomplete | O(total_chars) |
| Topological Sort | DP | Longest path in DAG | O(V+E) |
| Divide & Conquer | Two-pointer | Merge sort variants | O(N log N) |

### Decision Table

| Problem Feature | Outer Pattern | Inner Pattern | Verify |
| --- | --- | --- | --- |
| Grid with movement constraints | BFS | State validation | All states reachable? |
| String with character removal | Two-pointer | HashSet membership | Correct window tracking |
| Tree with path optimization | DFS | DP on children | Leaf-to-leaf vs root-to-leaf |
| Interval scheduling | Greedy sort | Interval overlap check | Optimal substructure |
| Sequence with subsequence | DP | Character matching | LCS formulation |
| Multi-source shortest path | BFS | Multi-source initialization | Bidirectional BFS possible? |


---

## Reality Check

**"Composition means using two patterns in sequence"** — Sequence is the weakest of four composition shapes: NESTING (binary search whose predicate runs a greedy check — one pattern inside another's decision point), LAYERING (heap maintained during an interval sweep — two patterns sharing a loop), TRANSFORMATION (sort first so two-pointers becomes legal — one pattern creating another's precondition), and sequence (build graph, then toposort). Recognizing WHICH shape a hard problem wants is the actual skill — nesting problems look impossible until you spot the inner pattern is just a subroutine.

**"Hard problems require learning harder patterns"** — The hard-problem distribution says otherwise: most hards are two MEDIUM patterns composed, and the difficulty is the seam — which pattern owns the outer loop, what data crosses the boundary, whose invariant survives. Median-of-data-stream is two heaps plus a balance rule; minimum-window-substring is window plus counting with a matched-tracker seam; word-ladder-II is BFS plus backtracking reconstruction. Attacking hards by learning suffix automata while the seam skill is untrained optimizes the wrong axis.

**"When composing, each pattern works as it did alone"** — Composition BENDS the components: the binary search inside search-on-answer doesn't return an index but tightens a bound; the DFS inside memoized tree problems returns values UP instead of just visiting; the greedy inside a heap-regret loop commits reversibly. Each pattern keeps its skeleton but adapts its contract to the composition — using the standalone version verbatim is the standard composition bug (the inner binary search that returns -1 into arithmetic expecting a boundary).

**"Composition is recognized by trying patterns until two fit"** — It is recognized by DECOMPOSING THE QUESTION: split the problem sentence at its conjunction — "smallest X such that Y is feasible" splits into search-over-X (outer) and check-Y (inner); "best Z while maintaining W" splits into scan-for-Z plus structure-maintaining-W. The conjunctions (such that, while, after, at most) are the seams made visible in language. Trial-and-error composition is quadratic in your pattern count; sentence-splitting is constant.

**"A composed solution is verified like a simple one"** — Composed solutions need SEAM verification beyond component verification: the boundary data (does the inner check receive what the outer loop thinks it sends — off-by-one in the candidate value is classic), invariant collision (does the heap's reordering break the sweep's assumption of sorted processing), and complexity multiplication (outer log times inner n is fine; outer n times inner n log n may not be — the composed bound needs its own arithmetic). Component-only testing passes composed bugs straight through; test the seam with the smallest input that exercises BOTH patterns at once.
