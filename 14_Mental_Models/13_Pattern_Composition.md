> **Navigation**: [< Previous](12_Space_Time_Tradeoffs.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](14_Optimization_Pipeline.md)

> **Mental Model 13** | [Index](../00_MASTER_INDEX.md)

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
## The Top 15 Pattern Compositions

#  COMPOSITION              EXAMPLE PROBLEM              LC#
══ ═══════════════════════  ═══════════════════════════  ═══
1  Binary Search + Greedy   Split Array Largest Sum      410
2  BFS + Bitmask DP         Shortest Path Visit All      847
3  Trie + Backtracking      Word Search II               212
4  Sorting + Two Pointers   3Sum                         15
5  Binary Search + Sliding  Min Size Subarray Sum        209
6  Graph + DP               Cheapest Flight K Stops      787
7  Heap + Greedy            Task Scheduler               621
8  Union-Find + Sort        Accounts Merge               721
9  Monotonic Stack + DP     Largest Rectangle Histogram  84
10 Prefix Sum + HashMap     Subarray Sum Equals K        560
11 Binary Search + Matrix   Search 2D Matrix II          240
12 DFS + Memoization        Longest Inc Path in Matrix   329
13 Topological Sort + DP    Course Schedule + min time   —
14 Segment Tree + Sweep     Count Smaller After Self     315
15 Trie + DP                Word Break                   139

---

## COMPOSITION 1: Binary Search + Greedy

## Pattern: "Binary Search On The Answer"


**Trigger**: "Minimize the maximum" or "Maximize the minimum"

**How It Works**:
1. Binary search on the ANSWER space (lo=min possible, hi=max possible)
2. For each candidate answer, GREEDILY check: "is this feasible?"
3. Narrow the search based on feasibility

**Visual**:
Answer space: [lo ─────────── mid ─────────── hi]
feasible(mid)?
YES → search lower (minimize max)
NO  → search higher

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

| # | Problem | LC# | Composition | Why Both Needed |
|---|---------|-----|-------------|-----------------|
| 1 | [Split Array Largest Sum](https://leetcode.com/problems/split-array-largest-sum/) | 410 | BinSearch + Greedy | Minimize the maximum |
| 2 | [Word Search II](https://leetcode.com/problems/word-search-ii/) | 212 | Trie + Backtracking | Multi-word grid search |
| 3 | [Subarray Sum Equals K](https://leetcode.com/problems/subarray-sum-equals-k/) | 560 | Prefix Sum + HashMap | Subarray target count |
| 4 | [Longest Inc Path in Matrix](https://leetcode.com/problems/longest-increasing-path-in-a-matrix/) | 329 | DFS + Memo | Grid DP with directions |
| 5 | [Shortest Path All Nodes](https://leetcode.com/problems/shortest-path-visiting-all-nodes/) | 847 | BFS + Bitmask | Visit all, shortest |
| 6 | [Koko Eating Bananas](https://leetcode.com/problems/koko-eating-bananas/) | 875 | BinSearch + Greedy | Min speed feasibility |
| 7 | [3Sum](https://leetcode.com/problems/3sum/) | 15 | Sort + Two Pointers | Reduce N³ to N² |
| 8 | [Task Scheduler](https://leetcode.com/problems/task-scheduler/) | 621 | Heap + Greedy | Frequency scheduling |
| 9 | [Cheapest Flights K Stops](https://leetcode.com/problems/cheapest-flights-within-k-stops/) | 787 | Graph + DP | BFS with cost+stops |
| 10 | [Word Break](https://leetcode.com/problems/word-break/) | 139 | Trie + DP | Dictionary segmentation |

---

> **Navigation**: [Back to Index](../00_MASTER_INDEX.md)
