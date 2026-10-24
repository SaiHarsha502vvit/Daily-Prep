> **Navigation**: [← Bit Manipulation](10_Bit_Manipulation_Complete.md) | [Chapter index](00_INDEX.md) | [Chapter 18 - Bitwise Trie Java →](18_Bitwise_Trie_Java_Complete.md)

# 🌲 Union-Find / Disjoint Set Union (DSU) Complete Guide

## 🔗 Bridge — Where This Chapter Fits

| Dimension | This chapter |
| --- | --- |
| **Builds on** | [Graph Fundamentals](05c_Graphs_Fundamentals.md), [Trees](05_Trees.md) |
| **You will learn** | Disjoint sets, union by rank/size, path compression, applications (Kruskal, connectivity, grid problems, offline queries) |
| **Leads to** | [Advanced Graphs](05d_Graphs_Advanced_Algos.md), [A1 invariants (DS)](../02_Data_Structures/A1_DS_Correctness_Invariants.md) |
| **Abstraction level** | L3: dynamic connectivity |

> [!NOTE]
> The full gap-free reading order and dependency graph are in the [Learning Path](00_LEARNING_PATH.md).

---

## 💬 Explain It Like a Study Partner — Union-Find (DSU)

### 1. The bottom line

Union-Find answers "are these two connected?" and merges groups in nearly constant time.

### 2. The textbook core

- `find(x)` follows parent pointers to the root; `union(a, b)` links roots.
- Union by rank + path compression → amortized O(α(n)).
- Invariant: following parents always reaches a root; two elements are in the same set iff they share a root.
- Cannot split sets (no efficient delete/undo without rollback variants).

### 3. The real-world analogy

**Teams with captains**: asking "who is your captain?" for two people tells you if they are on the same team; merging teams makes one captain report to the other.

### 4. Walkthrough

1. Union(1,2), Union(3,4), Union(2,4).
2. After the first two: sets {1,2} and {3,4}.
3. Union(2,4) links the two roots.
4. Find(1) == Find(3) → connected.

> [!NOTE]
> **Quick check:** What does path compression change? *It flattens trees so later finds are faster; the sets are unchanged.*

---


The Data Structure That Solves Connectivity Problems in Near-Constant Time

### 5. Check yourself

**Q1.** Amortised cost per operation with union by size and path compression?

<details><summary>Answer</summary>

`O(α(n))`, the inverse Ackermann function (at most 4 for any realistic `n`).

</details>

**Q2.** What does a `union` that returns `false` tell you in a graph problem?

<details><summary>Answer</summary>

The two endpoints were already connected, so the edge closes a cycle.

</details>


## Table of Contents

0. [PART 0: Complete Understanding](14_Union_Find_DSU_Complete/01_complete_understanding_the_why_before_the.md#part-0)
1. [Union-Find Fundamentals](14_Union_Find_DSU_Complete/01_complete_understanding_the_why_before_the.md#fundamentals)
2. [Basic Implementation](14_Union_Find_DSU_Complete/01_complete_understanding_the_why_before_the.md#basic-implementation)
3. [Path Compression](14_Union_Find_DSU_Complete/01_complete_understanding_the_why_before_the.md#path-compression)
4. [Union by Rank/Size](14_Union_Find_DSU_Complete/01_complete_understanding_the_why_before_the.md#union-by-rank)
5. [Optimized Implementation](14_Union_Find_DSU_Complete/02_optimized_implementation.md#optimized)
6. [Classic Applications](14_Union_Find_DSU_Complete/02_optimized_implementation.md#applications)
7. [Graph Problems](14_Union_Find_DSU_Complete/03_graph_problems.md#graph-problems)
8. [Advanced Techniques](14_Union_Find_DSU_Complete/04_advanced_techniques.md#advanced)
9. [Interview Problems](14_Union_Find_DSU_Complete/05_interview_problems.md#interview-problems)
10. [Quick Reference](14_Union_Find_DSU_Complete/05_interview_problems.md#quick-reference)

---

## 📚 Topic Pages in This Chapter

This chapter is split into focused pages so each topic can be read on its own. Read them in order the first time; use the table to jump back later.

| # | Page | What is inside | Lines |
| --- | --- | --- | --- |
| 1 | [COMPLETE UNDERSTANDING — The WHY Before the WHAT](14_Union_Find_DSU_Complete/01_complete_understanding_the_why_before_the.md) | COMPLETE UNDERSTANDING — The WHY Before the… · Union-Find Fundamentals · Basic Implementation · Path Compression · Union by Rank/Size · … | 739 |
| 2 | [Optimized Implementation](14_Union_Find_DSU_Complete/02_optimized_implementation.md) | Optimized Implementation · Classic Applications | 215 |
| 3 | [Graph Problems](14_Union_Find_DSU_Complete/03_graph_problems.md) | Graph Problems | 144 |
| 4 | [Advanced Techniques](14_Union_Find_DSU_Complete/04_advanced_techniques.md) | Advanced Techniques | 162 |
| 5 | [Interview Problems](14_Union_Find_DSU_Complete/05_interview_problems.md) | Interview Problems · Quick Reference · Summary · Reference Anchor · When Union-Find Breaks · … | 420 |

## 🏢 Enterprise Lens — Union-Find (DSU)

| Area | What top-tier engineering looks like |
| ---- | ------------------------------------ |
| **Where it runs in production** | Kruskal MST, image segmentation, network connectivity, account merging, percolation models |
| **Failure modes** | Forgetting to union by root; recursion depth in naive `find`; mixing indexes (0- vs 1-based) |
| **Testing and verification** | Compare against BFS connectivity on random edge sets |

---

## Reality Check

**"Union-Find is O(1) per operation"** → The inverse Ackermann function α(n) describes the amortized complexity per operation with both path compression AND union by rank. α(n) < 5 for all practical n (it's ≤ 4 for n < 10^600). So it is *practically* O(1) but not strictly O(1). Without union by rank (using union by size or rank): still α(n). Without path compression but with rank: O(log n). Without either: O(n) worst case.

**"Path compression changes the logical structure of the union-find"** → Path compression flattens the tree structure (makes nodes point directly to root) but does NOT change which component each node belongs to. The "which component" relationship is preserved; only the internal representation changes. This is safe because the root is the canonical representative.

**"Union-Find can detect cycles only in undirected graphs"** → Correct. In a directed graph, Union-Find doesn't model directed reachability correctly — `union(a, b)` and `union(b, a)` would create the same component, losing direction information. Use DFS with three-color marking for directed cycle detection (detecting back edges).

**"I need to re-build Union-Find from scratch for each query"** → For offline problems (all queries known upfront), you build once and answer all queries. For online problems (queries arrive dynamically), build incrementally — Union-Find supports this naturally (add elements, perform unions, check connectivity). Kruskal's MST builds Union-Find incrementally as it processes sorted edges.

**"Union-Find only works for connectivity"** → Union-Find also solves: number of connected components (count roots), minimum spanning tree (Kruskal's), checking if adding an edge creates a cycle, finding redundant connections in a graph, grouping elements by equivalence relations (same island, same account, same friend group). Any problem asking "are these two things in the same group" maps to Union-Find.
