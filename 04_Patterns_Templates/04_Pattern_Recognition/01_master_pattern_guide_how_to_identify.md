# 🗺️ MASTER PATTERN GUIDE — How to Identify Any Pattern From a Problem

> **Navigation**: [Chapter overview](../04_Pattern_Recognition.md) | [Pattern 1: Prefix Sum →](02_prefix_sum.md)
> Page 1 of 4 in **Pattern Recognition — Pattern Guide**


**Read this FIRST. Use this every time you see a new problem.**
The fastest skill you can build is: see a problem → immediately know which pattern to use.

> Constraint override: keywords suggest patterns, but constraints confirm them. If values may be negative, updates exist, graph weights differ, or `N` is huge, switch using [Constraint-Based Pattern Selection](../25_Constraint_Based_Pattern_Selection.md).
> Rewrite method: when you only have brute force, use [Brute Force to Optimal](../../14_Mental_Models/22_Brute_Force_To_Optimal_Playbook.md) to identify which DS/Algo replaces the slow loop.

## 🔑 Step 1: Read the Problem. Look for These Keywords

| If you see...                               | First think...                         | Then verify with...                                             |
| ------------------------------------------- | -------------------------------------- | --------------------------------------------------------------- |
| `subarray`, `contiguous`, `consecutive`     | Sliding Window or Prefix Sum           | Is it max/min sum? → Kadane's. Count? → Prefix+HashMap          |
| `substring` of size constraints             | Sliding Window                         | Fixed size? Fixed window. Variable? Variable window             |
| `subsequence`, `not necessarily contiguous` | Recursion / DP                         | LIS? Binary Search. LCS? 2D DP                                  |
| `pairs`, `two numbers sum to target`        | Two Pointers (sorted) or HashMap       | Sorted input? Two Pointers. Unsorted? HashMap                   |
| `triplets / k-sum`                          | Sort + Two Pointers                    | Fix one, two-pointer the rest                                   |
| `sorted` + `find` / `search`                | Binary Search                          | On data? Classic BS. On answer? BS on answer space              |
| `rotated sorted array`                      | Modified Binary Search                 | One half always sorted                                          |
| `frequency`, `count occurrences`            | HashMap                                | Char? `int[26]`. General? `HashMap`                             |
| `group by`, `anagrams`, `bucket`            | HashMap groups                         | Key = sorted string or signature                                |
| `k-th largest / smallest`                   | Heap                                   | Min-Heap of size k O(n log k)                                   |
| `top K` elements                            | Heap + Freq                            | Freq map → Heap                                                 |
| `matching brackets / nesting`               | Stack                                  | LIFO maps nesting perfectly                                     |
| `next greater / smaller element`            | Monotonic Stack                        | Decreasing for NGE, increasing for NSE                          |
| `level by level`, `BFS`                     | Queue                                  | Level-order traversal                                           |
| `all possible`, `generate all`, `enumerate` | Recursion / Backtracking               | Include/Exclude paradigm                                        |
| `minimum cost / maximum profit` globally    | Greedy or DP                           | Greedy if local optimal = global. DP if overlapping subproblems |
| `connected components`, `path`, `graph`     | BFS/DFS                                | BFS = shortest path unweighted. DFS = explore all               |
| `cycle detection`                           | Fast/Slow Pointers (LL) or DFS (graph) | LL? Floyd's. Graph? DFS color                                   |
| `intervals`, `overlapping ranges`           | Sort by start + merge                  | Sort → scan linearly                                            |
| `prefix` / `range sum query`                | Prefix Sum                             | Build O(n), query O(1)                                          |

## 🔑 Step 2: Check the Input Type

```
Input is ARRAY?
  ├── Sorted? → Binary Search / Two Pointers
  ├── Unsorted, find pairs? → HashMap O(n) or Sort+TwoPtr O(n log n)
  ├── Window problem? → Sliding Window
  └── Max/min subarray? → Kadane's

Input is STRING?
  ├── Substring constraints? → Sliding Window
  ├── Frequency? → int[26] or HashMap
  ├── Prefix/suffix? → String DP
  └── Pattern matching? → KMP / Rolling Hash

Input is TREE?
  ├── Path problems? → DFS
  ├── Level problems? → BFS
  └── BST + ordered? → Inorder traversal

Input is GRAPH?
  ├── Shortest path (unweighted)? → BFS
  ├── All paths / connected? → DFS
  ├── Shortest path (weighted)? → Dijkstra's (Heap)
  └── No cycles guaranteed? → Topological Sort

Input is LINKED LIST?
  ├── Cycle? → Fast/Slow Pointers
  ├── Nth from end? → Gap of N (Fast/Slow)
  ├── Middle? → Fast/Slow
  └── Reverse? → 3-pointer iterative
```

## 🔑 Step 3: Check the Constraints

```
n ≤ 20        → O(2ⁿ) or O(n!) OK → Backtracking / Brute Force
n ≤ 100       → O(n³) OK           → 3 nested loops
n ≤ 1,000     → O(n²) OK           → 2 nested loops / DP
n ≤ 100,000   → O(n log n) needed  → Sort / Binary Search / Heap
n ≤ 1,000,000 → O(n) needed        → HashMap / Sliding Window / Kadane's
n ≤ 10^9      → O(log n) or O(1)   → Math / Binary Search
```

---

[Chapter overview](../04_Pattern_Recognition.md) | [Pattern 1: Prefix Sum →](02_prefix_sum.md)
