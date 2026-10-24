# 04 — Patterns & Templates

> Reusable problem-solving patterns — recognise the pattern, apply the template, prove it fits the constraints.

**Start here:** [Learning Path](00_LEARNING_PATH.md) (reading order, dependency graph, question-shape → pattern table) · [Pattern Master Guide](00_PATTERN_MASTER_GUIDE.md) (keyword → pattern cheat sheet) · [Constraint-Based Selection](25_Constraint_Based_Pattern_Selection.md)

## How the Chapters Are Built

Every chapter has the same shape so you can find things quickly:

1. **Bridge** — what it builds on, what you will learn, where it leads, and its abstraction level.
2. **Study-partner explainer** — bottom line, textbook core, real-world analogy, worked walkthrough, quick check.
3. **Pattern content** — signals, templates (Java), walkthroughs, edge cases, complexity.
4. **Enterprise Lens** — where it runs in production, failure modes, how it is tested.
5. **Practice and reality check.**

## Reading Order

### Foundations

| #   | File | What you get |
| --- | ---- | ------------ |
| 1 | [Code Templates](02_Code_Templates.md) | Copy-ready skeletons with visual explanations |
| 2 | [Visual Diagrams](03_Visual_Diagrams.md) | See how pointers, windows, stacks and tables move |
| 3 | [Pattern Recognition](04_Pattern_Recognition.md) | Signals that point to a pattern, plus compact templates |
| 4 | [LeetCode ↔ Real World](05_LeetCode_RealWorld_Map.md) | Where each classic problem shows up in production |

### Core Patterns

| #   | File | Pattern |
| --- | ---- | ------- |
| 5 | [Sliding Window](01_Sliding_Window.md) | Fixed and variable windows |
| 6 | [Binary Search](06_Binary_Search_Patterns.md) | Search space and answer-space reduction |
| 7 | [Two Pointers](07_Two_Pointers_Complete.md) | Opposite, same-direction and fast/slow pointers |
| 8 | [Prefix Sum & Difference Array](26_Prefix_Sum_And_Difference_Array.md) 🆕 | Range queries and range updates |
| 9 | [Union-Find](27_Union_Find_Pattern.md) 🆕 | Connectivity under merges |
| 10 | [Topological Sort](28_Topological_Sort_Pattern.md) 🆕 | Ordering under prerequisites |
| 11 | [Trie](29_Trie_Pattern.md) 🆕 | Prefix queries |
| 12 | [Shortest Paths](30_Shortest_Path_Pattern.md) 🆕 | BFS, 0-1 BFS, Dijkstra, Bellman–Ford |
| 13 | [Top-K & Two Heaps](31_Top_K_And_Two_Heaps_Pattern.md) 🆕 | Bounded heaps and running medians |
| 14 | [Intervals](21_Intervals_Pattern.md) | Merge, insert, overlap |
| 15 | [Cyclic Sort](22_Cyclic_Sort_Pattern.md) | Values in `1..n` placed at their index |
| 16 | [Knapsack Family](23_Knapsack_Family.md) | 0/1, unbounded, partition, coin change |
| 17 | [Kadane & Subarray Patterns](24_Kadanes_Subarray_Patterns.md) | Maximum/minimum subarray optimisation |

### Combination Patterns (Pattern + Data Structure)

| #   | File | Pattern |
| --- | ---- | ------- |
| 18 | [Array + Two Pointers](08_Array_Plus_TwoPointers.md) | Array-specific pointer techniques |
| 19 | [Array + Sliding Window](09_Array_Plus_SlidingWindow.md) | Windows on arrays |
| 20 | [HashMap + Counting](10_HashMap_Plus_Counting.md) | Frequency maps, anagrams, prefix + map |
| 21 | [Stack + Monotonic](11_Stack_Plus_MonotonicPattern.md) | Monotonic stack patterns |
| 22 | [LinkedList + Two Pointers](12_LinkedList_Plus_TwoPointers.md) | Slow/fast pointer |
| 23 | [Tree + DFS/BFS](13_Tree_Plus_DFS_BFS.md) | Tree traversal patterns |
| 24 | [Graph + Traversal](14_Graph_Plus_Traversal.md) | Graph traversals |
| 25 | [Heap + Greedy](15_Heap_Plus_GreedySelection.md) | Top-K, merge K sorted |
| 26 | [DP Pattern Recognition](16_DP_Pattern_Recognition.md) | Identify DP families |
| 27 | [Backtracking + Pruning](17_Backtracking_Plus_Pruning.md) | Efficient backtracking |
| 28 | [String + Advanced](18_String_Plus_Advanced.md) | String patterns, tries, rolling hash |
| 29 | [Matrix + Grid](19_Matrix_Plus_Grid_Traversal.md) | 2D traversal |
| 30 | [Bit Manipulation Tricks](20_BitManipulation_Plus_Tricks.md) | Bit-level patterns |

### Capstone

| #   | File | What you get |
| --- | ---- | ------------ |
| 31 | [Constraint-Based Pattern Selection](25_Constraint_Based_Pattern_Selection.md) | Choose patterns from constraints, values, updates and weights |
| 32 | [Pattern Master Guide](00_PATTERN_MASTER_GUIDE.md) | One-page keyword → pattern → data structure → study file map |

> [!NOTE]
> The numbers in this table are a *reading order*; file names keep their original numeric prefixes so existing links keep working. The 🆕 pages were added after the folder audit and are listed in the [Learning Path](00_LEARNING_PATH.md).

---

[← Back to Master Index](../00_MASTER_INDEX.md)
