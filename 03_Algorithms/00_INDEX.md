# 03 - Algorithms

> Learn HOW to solve problems — the thinking patterns that power every solution.

## Reading Order

### 🎓 University Methodology Layer *(MIT 6.006 / KTH DD2352 / RWTH Aachen / TU Munich foundation)*

> **Read these first if you want to know *why* algorithms work, not just *what* to implement.** These four chapters build the proof-based, complexity-based, lower-bound-based, and randomized-analysis toolbox that universities teach before the algorithm catalog.

| #   | File                                                | What You'll Learn                       |
| --- | --------------------------------------------------- | --------------------------------------- |
| U1  | [Algorithm Correctness — Proving Why It Works](A1_Correctness_Proofs.md) | Loop invariants, exchange arguments, optimal substructure |
| U2  | [Complexity from First Principles](A2_Complexity_FirstPrinciples.md) | Recurrence analysis, Master Theorem, amortized analysis (3 methods) |
| U3  | [Lower Bounds & NP-Completeness](A3_Lower_Bounds_And_NP.md) | Decision-tree lower bounds, reductions, P vs NP, approximation |
| U4  | [Randomized Algorithms](A4_Randomized_Algorithms.md) | Las Vegas vs Monte Carlo, indicator variables, universal hashing, Bloom filters |
| U5  | [**Designing Your Own Algorithms**](A5_Designing_Your_Own_Algorithms.md) | The invention method: repeated-work taxonomy, paradigm decision tree, deriving recurrences, exchange arguments, deriving Boyer–Moore from scratch |

### Foundations

| #   | File                                                | What You'll Learn                   |
| --- | --------------------------------------------------- | ----------------------------------- |
| 1   | [Algorithm Thinking](01_Algorithm_Thinking.md)      | How to approach ANY problem         |
| 2   | [Sorting Fundamentals](02a_Sorting_Fundamentals.md) | Bubble, selection, insertion, merge |
| 3   | [Sorting Advanced](02b_Sorting_Advanced.md)         | Quick sort, radix, bucket, counting |
| 4   | [Divide & Conquer](02c_Divide_And_Conquer.md)       | Split-solve-merge paradigm          |

### Recursion & DP

| #   | File | What You'll Learn |
| --- | ---- | ----------------- |
| 5 | [Recursion Internals](03a_Recursion_Internals.md) | Call stack, tail recursion, JVM behavior |
| 6 | [Recursion Fundamentals](03b_Recursion_Fundamentals.md) | Base cases, recursive leap of faith |
| 7 | [Recursion Advanced](03c_Recursion_Advanced.md) | Memoization bridge, tree recursion |
| 8 | [DP Internals](04a_DP_Internals.md) | Tabulation vs memoization under the hood |
| 9 | [DP Fundamentals](04b_DP_Fundamentals.md) | Classic patterns: knapsack, LIS, LCS |
| 10 | [DP Advanced](04c_DP_Advanced.md) | Bitmask DP, digit DP, tree DP |

### Trees & Graphs

| #   | File | What You'll Learn |
| --- | ---- | ----------------- |
| 11 | [Trees](05_Trees.md) | BST, traversals, balanced trees |
| 12 | [Graphs Internals](05b_Graphs_Internals.md) | Adjacency list/matrix, graph theory |
| 13 | [Graphs Fundamentals](05c_Graphs_Fundamentals.md) | BFS, DFS, connected components |
| 14 | [Graphs Advanced](05d_Graphs_Advanced_Algos.md) | Dijkstra, Bellman-Ford, MST |
| 15 | [Graphs Patterns](05e_Graphs_Patterns.md) | Topological sort, bipartite, cycle detection |

### Specialized

| #   | File | What You'll Learn |
| --- | ---- | ----------------- |
| 16 | [Greedy & Bit Manipulation](06a_Greedy_BitManip.md) | Greedy proofs, bit tricks |
| 17 | [Advanced Algo Deep](06c_Advanced_Algo_Deep.md) | Segment tree, Fenwick tree |
| 18 | [String Algorithms](06d_String_Algorithms.md) | KMP, Rabin-Karp, Z-algorithm |
| 19 | [Algorithm Patterns](06e_Algorithm_Patterns.md) | Meta-patterns across all categories |
| 20 | [Advanced DS Core](07a_Advanced_DS_Core.md) | Trie, segment tree implementations |
| 21 | [Advanced DS Patterns](07b_Advanced_DS_Patterns.md) | When to use which advanced DS |
| 21.5| [Advanced Trees Deep Dive](07c_Advanced_Trees_Deep.md) | Red-Black, B-Trees, LSM, Spatial & Merkle |
| 21.6| [Probabilistic DS Deep Dive](07d_Probabilistic_DS_Deep.md) | Bloom Filters, HyperLogLog, Consistent Hashing |
| 21.7| [Advanced Algorithm Engineering Deep Dive](07e_Advanced_Algorithm_Engineering_Deep.md) | HLD, Mo's, Wavelet Tree, Flow, DP optimization |
| 22 | [Number Theory Core](08a_NumberTheory_Core.md) | GCD, primes, modular arithmetic |
| 23 | [Number Theory Advanced](08b_NumberTheory_Advanced.md) | Chinese remainder, Euler's totient |

### Complete Guides

| #   | File | What You'll Learn |
| --- | ---- | ----------------- |
| 24 | [Pattern Programs](09_Pattern_Programs_Complete.md) | Star, number, character patterns |
| 25 | [Bit Manipulation](10_Bit_Manipulation_Complete.md) | All bit tricks and problems |
| 26 | [Backtracking](11_Backtracking_Complete.md) | N-Queens, Sudoku, permutations |
| 27 | [Greedy](12_Greedy_Algorithms_Complete.md) | Activity selection, Huffman |
| 28 | [Algorithms In Production](13_Algorithms_In_Production.md) | React diffing, PageRank, Bloom filters |
| 29 | [String Algorithms](13_String_Algorithms_Complete.md) | Complete string processing |
| 30 | [Union Find / DSU](14_Union_Find_DSU_Complete.md) | Disjoint sets, path compression |
| 31 | [Monotonic Stack/Queue](15_Monotonic_Stack_Queue_Complete.md) | Next greater element patterns |
| 32 | [DSA Deep Reasoning](16_DSA_Deep_Reasoning.md) | Why algorithms work — proofs & intuition |
| 33 | [Java Implementation](17_DSA_Java_Implementation_Mastery.md) | Java-specific DSA implementation |

### Java Deep Additions

| #   | File | What You'll Learn |
| --- | ---- | ----------------- |
| 33 | [Bitwise Trie Java Complete](18_Bitwise_Trie_Java_Complete.md) | Maximum/minimum XOR, offline queries, counting variants |
| 34 | [Prefix Family Java Complete](19_Prefix_Sum_Prefix_XOR_2D_Prefix_Java_Complete.md) | Prefix sum, prefix xor, 2D prefix, difference arrays |
| 35 | [PDF Coverage Map (Java)](20_DSA_Patterns_PDF_Java_Coverage_Map.md) | DSA patterns to Java chapter mapping + revision route |
| 36 | [**Algorithm War Stories**](21_Algorithm_War_Stories.md) | 10 real production incidents traced through the design loop — the hidden quadratic, HyperLogLog, cache stampede, consistent hashing, the celebrity fan-out, rate-limit boundary bursts, Timsort, bisection, retry storms, Bloom dedup — plus the 5 cross-story patterns and what industry actually invents |
| 36 | [Competitive Coding Deep Thinking](../14_Mental_Models/21_Competitive_Coding_Deep_Thinking.md) | Constraints, formulas, proof, pattern choice under time |
| 37 | [Constraint-Based Pattern Selection](../04_Patterns_Templates/25_Constraint_Based_Pattern_Selection.md) | If constraints say X, choose Y |
| 38 | [Brute Force to Optimal Playbook](../14_Mental_Models/22_Brute_Force_To_Optimal_Playbook.md) | Naive loop to DS/Algo rewrite |

## Roadmap

```
🎓 University Methodology (U1–U4) ← read first for rigor
    ↓
Thinking → Sorting → Divide&Conquer → Recursion → DP → Trees → Graphs
    ↓
Greedy → Strings → Advanced DS → Algorithm Engineering → Number Theory → Complete Guides → Java Deep Additions → Competitive Thinking
```

---

[← Back to Master Index](../00_MASTER_INDEX.md)
