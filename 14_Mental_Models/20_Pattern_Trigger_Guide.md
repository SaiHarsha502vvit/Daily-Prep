# 🎯 Pattern Trigger Guide — From Problem Signal to Solution Pattern

> **Purpose:** Your brain fires a signal when it sees a pattern. This guide maps that signal to the verified correct technique.
> **Use:** Read the signal table every morning. Within 2 weeks, your gut instinct becomes algorithmic.
>
> 🔗 **Navigate back:** [Mental Models Index](00_INDEX.md) | [Pattern Master Guide](../04_Patterns_Templates/00_PATTERN_MASTER_GUIDE.md)

---

## ⚠️ Constraint Overrides

The trigger table gives your first guess. Constraints decide if that guess survives.

| Trigger Guess | Constraint That Breaks It | Switch To |
|---------------|---------------------------|-----------|
| Sliding window for sum | negative numbers allowed | prefix sum + hashmap/tree/deque |
| Prefix sum for range query | online updates | Fenwick / segment tree |
| BFS shortest path | weighted edges | Dijkstra / 0-1 BFS |
| Dijkstra | negative edges | Bellman-Ford / potentials |
| Two pointers | array unsorted and original indices required | hashmap complement |
| Greedy | no exchange/stays-ahead proof | DP/search |

Detailed table: [Constraint-Based Pattern Selection](../04_Patterns_Templates/25_Constraint_Based_Pattern_Selection.md).

---

## 🔑 The Master Signal → Pattern Table

> For each problem, find the strongest matching signal. That's your starting pattern.

| Signal You See in Problem | Your Brain Should Say | Verify With | Jump To |
|---|---|---|---|
| `"subarray"` + `"of size k"` | → **Fixed Sliding Window** | Is window size constant? Yes → Fixed | [SW PS](../05_Problem_Solving/05_Sliding_Window.md) |
| `"longest subarray/substring"` + `"with condition"` | → **Variable Sliding Window** | Does adding right & shrinking left work? | [SW PS](../05_Problem_Solving/05_Sliding_Window.md) |
| `"pair that sums to target"` in sorted array | → **Two Pointers (opposite ends)** | Is it sorted? Must it be? | [2P PS](../05_Problem_Solving/06_Two_Pointers.md) |
| `"three numbers sum to 0"` / `"k-sum"` | → **Fix one + Two Pointer** | Sort, fix outer loop, two-pointer inner | [2P PS](../05_Problem_Solving/06_Two_Pointers.md) |
| `"remove duplicates in-place"` | → **Two Pointers (same direction)** | Slow=writer, fast=reader | [2P PS](../05_Problem_Solving/06_Two_Pointers.md) |
| `"sorted array"` + `"find target"` or `"insert position"` | → **Binary Search** | Is search space monotonic? | [BS PS](../05_Problem_Solving/07_Binary_Search.md) |
| `"minimum X to achieve Y"` | → **Binary Search on Answer** | Is "can I achieve with X?" monotonic? | [BS PS](../05_Problem_Solving/07_Binary_Search.md) |
| `"find kth largest/smallest"` | → **Min-Heap of size K** | K-size heap; root = kth largest | [Heap PS](../05_Problem_Solving/16_Heap.md) |
| `"median of stream"` / `"balance two halves"` | → **Two Heaps (max + min)** | Max-heap left half, min-heap right half | [Heap PS](../05_Problem_Solving/16_Heap.md) |
| `"two numbers add to target"` (unsorted, any) | → **HashMap complement** | One-pass: store seen values | [HP PS](../05_Problem_Solving/17_HashMap_Hashing.md) |
| `"how many subarrays sum to K"` | → **Prefix Sum + HashMap** | `count[prefixSum - k]` | [HP PS](../05_Problem_Solving/17_HashMap_Hashing.md) |
| `"group by property"` (anagrams, etc.) | → **HashMap grouping** | Key = sorted string / frequency tuple | [HP PS](../05_Problem_Solving/17_HashMap_Hashing.md) |
| `"next greater element"`, `"span"`, `"histogram"` | → **Monotonic Stack** | Decreasing stack; pop when violated | [SQ PS](../05_Problem_Solving/08_Stack_Queue.md) |
| `"valid parentheses"`, `"balanced brackets"` | → **Stack matching** | Push open, pop and compare on close | [SQ PS](../05_Problem_Solving/08_Stack_Queue.md) |
| `"level-order traversal"`, `"minimum hops"` | → **BFS (Queue)** | Layer-by-layer; use queue + level counter | [Tree PS](../05_Problem_Solving/09_Trees.md) |
| `"all paths"`, `"path sum"`, `"leaf nodes"` | → **DFS (Recursion)** | Pre/in/post-order choices | [Tree PS](../05_Problem_Solving/09_Trees.md) |
| `"islands"`, `"connected components"`, `"flood fill"` | → **DFS/BFS on grid** | Visit + mark grid cells | [Graph PS](../05_Problem_Solving/10_Graphs.md) |
| `"shortest path"` (unweighted graph/grid) | → **BFS** | BFS guarantees shortest in unweighted | [Graph PS](../05_Problem_Solving/10_Graphs.md) |
| `"shortest path"` (weighted, positive edges) | → **Dijkstra** | Min-heap on distance | [Graph PS](../05_Problem_Solving/10_Graphs.md) |
| `"prerequisites"`, `"order tasks"`, `"dependency"` | → **Topological Sort** | Kahn's BFS or DFS postorder | [Graph PS](../05_Problem_Solving/10_Graphs.md) |
| `"find all combinations/subsets"` | → **Backtracking** | Choose → Explore → Unchoose | [BT PS](../05_Problem_Solving/12_Backtracking.md) |
| `"minimum cost to reach"`, `"maximize value"` with constraints | → **DP** | Sub-problems overlap? DP. | [DP PS](../05_Problem_Solving/11_Dynamic_Programming.md) |
| `"longest increasing subsequence"` | → **1D DP** or **Patience Sort (O(n log n))** | dp[i] = max of dp[j]+1 where j<i, nums[j]<nums[i] | [DP PS](../05_Problem_Solving/11_Dynamic_Programming.md) |
| `"edit distance"`, `"LCS"`, `"wildcard matching"` | → **2D String DP** | dp[i][j] = answer for s1[0..i] vs s2[0..j] | [DP PS](../05_Problem_Solving/11_Dynamic_Programming.md) |
| `"pick/skip items"`, `"knapsack"`, `"coin change"` | → **Knapsack DP** | dp[i][w] = max value with capacity w | [DP PS](../05_Problem_Solving/11_Dynamic_Programming.md) |
| `"intervals"`, `"merge meetings"`, `"non-overlapping"` | → **Sort by start + Greedy/Heap** | Sort by start time; merge or count overlaps | [Greedy PS](../05_Problem_Solving/13_Greedy.md) |
| `"minimum number of X"` (coins, jumps, platforms) | → **Greedy first, then DP if fails** | Greedy: always pick local best. If counterexample exists → DP | [Greedy PS](../05_Problem_Solving/13_Greedy.md) |
| `"cycle in linked list"` | → **Fast & Slow Pointers** | Floyd's tortoise & hare | [LL PS](../05_Problem_Solving/15_LinkedList.md) |
| `"reverse linked list"` / `"palindrome list"` | → **3-pointer reversal** | `prev=null; curr=head; save next; flip; advance` | [LL PS](../05_Problem_Solving/15_LinkedList.md) |

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

| Brute Force | Bottleneck | Optimization | Result |
|---|---|---|---|
| Double loop on array O(n²) | Re-scanning for each position | Sliding Window or Prefix Sum | O(n) |
| Check all pairs for sum O(n²) | Linear search for complement | HashMap lookup | O(n) |
| Scan all n elements per query O(n·q) | Recomputing range sum | Prefix sum array | O(1) per query |
| Try all orderings O(n!) | No pruning | Backtracking + prune | O(2^n) avg |
| Recursion with repeated calls O(2^n) | Recomputing same state | Memoization / DP table | O(n·k) |
| Linear search in sorted array O(n) | Not using sorted property | Binary Search | O(log n) |

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
- 21–25: You ARE the pattern library 🔥

