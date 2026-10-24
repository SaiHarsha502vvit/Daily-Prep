# Graphs

> **Navigation**: [← Trie Problems](30_Trie_Problems.md) | [Chapter index](00_INDEX.md) | [Union-Find Problems →](27_Union_Find_Problems.md)


---

## 🔗 Bridge — Where This Chapter Fits

| Dimension | This chapter |
| --- | --- |
| **Builds on** | [Graphs](../02_Data_Structures/01g_DS_Internals.md), [Graph + Traversal](../04_Patterns_Templates/14_Graph_Plus_Traversal.md) |
| **You will learn** | BFS/DFS, components, cycle detection, topological sort, shortest paths and union-find |
| **Leads to** | [Union-Find problems](27_Union_Find_Problems.md), [Topological Sort problems](29_Topological_Sort_Problems.md), [Shortest Path problems](31_Shortest_Path_Problems.md) |
| **Abstraction level** | Trees → **trees with cycles** (visited sets) |

> [!NOTE]
> The full gap-free reading order and dependency graph are in the [Learning Path](00_LEARNING_PATH.md).

---

## 💬 Explain It Like a Study Partner — Graph Problems

### 1. The bottom line

A graph traversal is a tree traversal plus a visited set; the algorithm you pick depends on edge weights and direction.

### 2. The textbook core

- Unweighted shortest path → BFS.
- Non-negative weights → Dijkstra.
- Prerequisites → topological sort.
- Connectivity under merges → union-find.
- Mark visited on enqueue.

### 3. The real-world analogy

A **city map with one-way streets**.

### 4. Walkthrough

1. Count islands in a grid.
2. Scan cells; on an unvisited land cell start a DFS.
3. The DFS marks the entire island.
4. Each new start adds 1.

> [!NOTE]
> **Quick check:** Why mark nodes visited when enqueued in BFS? *To avoid enqueuing a node many times.*


### 5. Check yourself

**Q1.** 5 nodes with edges `(0,1),(1,2),(3,4)`: how many connected components?

<details><summary>Answer</summary>

**2**.

</details>

**Q2.** Which traversal gives shortest paths in an unweighted graph?

<details><summary>Answer</summary>

BFS.

</details>

---


## 🗺️ Pattern Recognition Header — Graphs

**Graph Algorithm Selector** — Use this before every problem:

| If it asks...                            | Algorithm                        | Time         |
| ---------------------------------------- | -------------------------------- | ------------ |
| `count islands / connected components`   | DFS/BFS flood fill               | O(V+E)       |
| `shortest path (unweighted)`             | BFS level-by-level               | O(V+E)       |
| `shortest path (weighted, non-negative)` | Dijkstra (min-heap)              | O((V+E)logV) |
| `dependency order / course schedule`     | Topological Sort (Kahn's or DFS) | O(V+E)       |
| `detect cycle in directed graph`         | DFS 3-color (WHITE/GRAY/BLACK)   | O(V+E)       |
| `union / merge components dynamically`   | Union-Find                       | O(E·α(V))    |
| `bipartite check`                        | BFS 2-coloring                   | O(V+E)       |

**First Question for Every Graph Problem:**

```
1. What are the NODES?
2. What are the EDGES? (directed or undirected?)
3. Is it weighted?
→ Then pick your algorithm from the table above.
```

- 📖 **Mental Model:** [03_Graph_Tree_Thinking.md](../14_Mental_Models/03_Graph_Tree_Thinking.md)
- 📖 **Theory:** [01f_Trees_Heaps.md](../02_Data_Structures/01f_Trees_Heaps.md)
- 📖 **Full Pattern Guide:** [00_PATTERN_MASTER_GUIDE.md](../04_Patterns_Templates/00_PATTERN_MASTER_GUIDE.md)

---

🔬 **Section Challenge — 🗺️ Pattern Recognition Header — Graphs**

**Challenge 1 (Reasoning):** BFS finds shortest path in unweighted graphs but not in weighted graphs. Why exactly?

<details><summary>Answer</summary>

BFS explores by 'hop count' (number of edges). Each level = one more edge away from source. All edges are treated as weight=1. In a weighted graph, the 'shortest by hop count' path may not be 'shortest by weight sum'. Example: A→B (weight 1, 1 hop) vs A→C→B (weight 0.1+0.1=0.2, 2 hops). BFS finds A→B (1 hop), Dijkstra finds A→C→B (lower total weight). BFS is optimal ONLY when all edges have equal weight.

</details>

**Challenge 2 (Design):** Detect if a directed graph has a cycle. Write the algorithm and explain why we need 3 states (not 2).

<details><summary>Answer</summary>

3 states: UNVISITED, IN_PROGRESS (currently in DFS path), DONE. DFS: mark node IN_PROGRESS before visiting neighbors. If we reach an IN_PROGRESS node → cycle found. Mark DONE when all neighbors processed. Why 3 states: with 2 (visited/unvisited), we'd get false positives — reaching a VISITED node that was processed in a DIFFERENT DFS subtree is not a cycle. IN_PROGRESS specifically marks nodes in the CURRENT DFS path (potential back edge).

</details>

## 📚 Topic Pages in This Chapter

This chapter is split into focused pages so each topic can be read on its own. Read them in order the first time; use the table to jump back later.

| # | Page | What is inside | Lines |
| --- | --- | --- | --- |
| 1 | [SECTION 9: GRAPH ALGORITHMS](10_Graphs/01_section_9_graph_algorithms.md) | SECTION 9: GRAPH ALGORITHMS · WHY Graph Problems & How to Think About Them | 281 |
| 2 | [9.1 Graph Traversal (BFS/DFS)](10_Graphs/02_graph_traversal_bfs_dfs.md) | 9.1 Graph Traversal (BFS/DFS) | 441 |
| 3 | [9.2 Graph Cycle Detection](10_Graphs/03_graph_cycle_detection.md) | 9.2 Graph Cycle Detection | 224 |
| 4 | [9.3 Shortest Path Problems](10_Graphs/04_shortest_path_problems.md) | 9.3 Shortest Path Problems | 287 |
| 5 | [9.4 Union-Find (Disjoint Set)](10_Graphs/05_union_find_disjoint_set.md) | 9.4 Union-Find (Disjoint Set) | 254 |
| 6 | [9.5 Advanced Graph Problems](10_Graphs/06_advanced_graph_problems.md) | 9.5 Advanced Graph Problems | 248 |
| 7 | [9.6 HackerEarth & Codeforces Graph Problems](10_Graphs/07_hackerearth_codeforces_graph_problems.md) | 9.6 HackerEarth & Codeforces Graph Problems · Competitive Programming — Codeforces Problems · Real-World Applications of Graph Algorithms | 358 |

## 🏢 Enterprise Lens — Graph Problems

| Area | What top-tier engineering looks like |
| ---- | ------------------------------------ |
| **Where it runs in production** | Dependency resolution, routing, social networks |
| **Failure modes** | Missing visited set; treating directed edges as undirected |
| **Testing and verification** | Compare with a reference reachability computation |

---

## Reality Check

**"Graph problems require graph input"** — Half the graded set hides the graph: course schedules are dependency DAGs, word ladders connect strings one edit apart, number-of-provinces reads an adjacency MATRIX as friendship edges, alien-dictionary extracts edges from word ORDER, and sliding-puzzle states connect by legal moves. The routing skill is spotting nodes-and-relations inside a story that never says graph — then the rest is standard machinery on a structure you built yourself.

**"Topological sort problems end at producing an order"** — The exam-grade variants use topo-sort as an ANALYZER: cycle detection (order impossible), counting orders (ambiguity means multiple), longest path in a DAG (relax along the order), and course-schedule-III style feasibility. Kahn's queue version additionally yields the cycle MEMBERS (nodes never dequeued) — a diagnostic no DFS-coloring version gives for free. Knowing what the sort's FAILURE tells you is worth more than the sort.

**"Union-Find and DFS answer the same connectivity questions, so learn one"** — They trade differently under DYNAMICS: DFS answers one-shot connectivity on a finished graph; union-find answers connectivity UNDER EDGE INSERTIONS (number-of-islands-II, accounts-merge, redundant-connection) in near-constant amortized time, but cannot handle deletions and gives no paths. The selector: static-and-need-paths means DFS/BFS; incremental-and-need-components means union-find. Owning only one tool means half the problem set is uphill.

**"Dijkstra applies whenever edges have weights"** — Dijkstra's proof DIES on negative edges (a settled node can be un-settled by a later negative shortcut) — Bellman-Ford or DAG-relaxation take over. And when all weights are 0-or-1, the deque trick (push-front for 0-edges) beats the heap. The professional selection table — BFS for unit, deque for 0/1, Dijkstra for non-negative, Bellman-Ford for negative, topo-relax for DAGs — is five lines that prevent the single most common advanced-graph misapplication.

**"Grid BFS and graph BFS practice interchangeably"** — Grid problems add three habits generic graphs never teach: direction-array iteration, in-grid bounds-plus-condition validity, and STATE-AUGMENTED nodes (position PLUS keys held, PLUS walls broken — shortest-path-with-obstacle-elimination). That last one is the level boundary: the node is not the cell, it is (cell, budget-left), and the visited set must key on the full state. Practicing only plain grids leaves the state-augmentation reflex unbuilt.
