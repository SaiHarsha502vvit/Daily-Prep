# 🎓 University Proof Corner

> **Navigation**: [Chapter overview](../05d_Graphs_Advanced_Algos.md) | [Bellman-Ford Algorithm (Negative Weights) →](02_bellman_ford_algorithm_negative_weights.md)
> Page 1 of 6 in **Graphs Advanced Algos**


> **MIT 6.046J L17 / RWTH Aachen Algo II / TU Munich IN0007 layer** — Why Dijkstra is correct, why it fails on negative edges, and why greedy MST algorithms work.

## Dijkstra Correctness — Greedy Invariant Proof

**Invariant**: When vertex `v` is extracted from the priority queue (finalized), `dist[v]` = the true shortest path distance from `s` to `v`.

**Proof by contradiction**: Suppose `v` is the first finalized vertex with `dist[v] ≠ true_dist[v]`. Let `P` be the true shortest path from `s` to `v`. Let `u` be the last vertex on `P` that was finalized before `v`. Let `w` be `u`'s successor on `P` (not yet finalized).

```
s ─── (finalized) ─── u ─── w ─── ... ─── v
                            (not yet finalized)
```

When `u` was finalized, edge `(u, w)` was relaxed: `dist[w] ≤ dist[u] + weight(u,w) = true_dist[w]`.

Since all edge weights are non-negative: `true_dist[w] ≤ true_dist[v]`.

So: `dist[w] ≤ true_dist[v]`.

But `v` was extracted from the PQ before `w` (by assumption). So `dist[v] ≤ dist[w] ≤ true_dist[v]`.

Since relaxations can only lower `dist` (never below `true_dist`): `dist[v] = true_dist[v]` — contradiction with our assumption. ✓

**Why Dijkstra fails with negative edges**: The proof relies on `true_dist[w] ≤ true_dist[v]`. A negative edge `(x, v)` where `x` is not yet finalized could give a shorter path to `v` *after* `v` is already finalized. Production systems processing cost or financial graphs must validate for negative edges, or default to Bellman-Ford.

## MST — The Cut Property

**Theorem** (Cut Property): Let `S` be any subset of vertices, `e` be the minimum-weight edge crossing the cut `(S, V\S)`. Then `e` is in **every** minimum spanning tree.

**Proof**: Suppose the MST `T` does not contain `e`. Adding `e` to `T` creates a cycle. The cycle must contain another edge `e'` crossing the cut `(S, V\S)`. Since `e` is the minimum-weight such edge, `weight(e) ≤ weight(e')`. Replace `e'` with `e` — gives a spanning tree with weight ≤ `T`, contradicting minimality of `T`. ✓

**Consequence**: Both Kruskal's (sort edges, pick min that doesn't form a cycle) and Prim's (grow tree from a root, pick min edge to a new vertex) are MST algorithms — both implicitly apply the cut property at every step. The cut property is what makes greedy MST provably optimal.

> Full proofs: [A1 — Algorithm Correctness](../A1_Correctness_Proofs.md) (Section 5: Exchange Arguments)

---

**5W1H: Advanced Graph Algorithms**

```text
WHAT : Sophisticated techniques beyond basic BFS/DFS (e.g., Dijkstra,
       Bellman-Ford, Floyd-Warshall, Prim, Kruskal, Topo Sort).
WHY  : Basic traversals cannot efficiently solve weighted shortest
       paths, MSTs, all-pairs distances, or complex connectivity.
WHEN : Dealing with weighted networks, scheduling dependencies, routing
       packets, or analyzing network vulnerabilities/flow.
WHERE: Embedded in network routers (OSPF/BGP), GPS navigation, build
       systems (Make, Maven), and scheduling algorithms.
WHO  : Backend engineers, distributed systems designers, networking
       engineers, and competitive programmers.
HOW  : Leveraging greedy strategies (Dijkstra/Prim), DP (Bellman-Ford/
       Floyd-Warshall), Union-Find (Kruskal), and DFS (Tarjan/Kahn).
```

## Historical Evolution

Shortest path algorithms evolved from purely mathematical curiosity to production infrastructure. **Dijkstra's algorithm** was published by **Edsger W. Dijkstra in 1959** in a 3-page paper titled "A note on two problems in connexion with graphs" — remarkably, Dijkstra originally solved the problem without a priority queue (using a simple O(V²) array scan), and the min-heap optimization came later; today it is the backbone of GPS navigation, OSPF routing in the internet, and airline fare calculation. **Bellman and Ford** independently developed the dynamic programming approach to shortest paths with negative weights: **Bellman's 1957** "Dynamic Programming" paper and **Bellman-Ford 1958** publication established the V-1 relaxation rounds that detect negative cycles. **Floyd and Warshall (1962)** published the all-pairs shortest path algorithm — independently by Robert Floyd and Stephen Warshall (Warshall for transitive closure) — which computes shortest paths between all vertex pairs in $O(V^3)$, a surprisingly simple formulation that remains optimal for dense graphs. **Kruskal (1956)** and **Prim (1957)** independently developed Minimum Spanning Tree algorithms: Kruskal's edge-sorting with Union-Find approach and Prim's growing-tree approach both achieve $O(E \log V)$, and **Jarník (1930)** actually discovered Prim's algorithm first, making it one of the oldest MST algorithms (sometimes called Jarník-Prim). Modern practice (post-2010) includes contraction hierarchies and ALT (A\* landmarks) heuristics for road network shortest path in ~milliseconds on billions of edges.

---

## Production Reality

**Production failure mode — Dijkstra silently wrong with negative edges:** Dijkstra's greedy extraction guarantee assumes all edge weights are non-negative. In production data containing negative edges (e.g., financial rebates, discount edges, graph-import bugs from signed cost data), the algorithm finalizes the wrong node first and **silently produces incorrect shortest paths** with no error signal — the returned distances are simply wrong. A graph with edges `[-1, 2, 3]` causes Dijkstra to lock in the wrong path before the negative edge is ever considered. Production systems processing cost or financial graphs must validate for negative edges before running Dijkstra, or default to Bellman-Ford.

**Production failure mode — Floyd-Warshall O(V³) on large graphs:** Floyd-Warshall's $O(V^3)$ complexity makes it impractical above $n \approx 500$ vertices in production. A graph with $n = 1{,}000$ takes $\sim$1 billion operations — orders of magnitude slower than running Dijkstra $|V|$ times on sparse graphs. The `n≤500` constraint in the JIT Connection table is a real production threshold, not an abstract one. Beyond this, use Johnson\'s algorithm (reweighting + Dijkstra per node) or distributed all-pairs shortest path.

**Production debugging — Bellman-Ford V-1 rounds cost:** Bellman-Ford\'s V-1 relaxation passes mean O(VE) work — acceptable for sparse graphs but a bottleneck on dense graphs with millions of edges. A common production bug is applying Bellman-Ford to a dense graph expecting sub-second results when it actually takes minutes. Monitor the number of edges: if E ≈ V², switch to Floyd-Warshall for small V or Johnson\'s for large V.

**Scalability — MST with sparse vs dense graph:** Kruskal\'s O(E log E) and Prim\'s O((V+E) log V) both achieve $O(E \log V)$. In production, Kruskal\'s sorting step dominates for sparse graphs (E ≈ V); Prim\'s with a Fibonacci heap wins for dense graphs (E ≈ V²) where sorting E edges is expensive. Mis-selecting on a graph with 1M edges and 10K vertices means the difference between 10 seconds and 10 minutes.

---

## 🔗 JIT Connection — Advanced Graph Algorithms

**Arrived here from a problem that needs more than basic BFS/DFS?**

| When you need this algorithm  | Problem Type                        | Key Signal                                         |
| ----------------------------- | ----------------------------------- | -------------------------------------------------- |
| **Bellman-Ford**              | Shortest path with negative edges   | "negative weights", "detect negative cycle"        |
| **Floyd-Warshall**            | All-pairs shortest path             | "distances between ALL pairs", small graph (n≤500) |
| **Prim's MST**                | Minimum spanning tree, dense graph  | "connect all nodes minimum cost"                   |
| **Kruskal's MST**             | Minimum spanning tree, sparse graph | sort edges + Union-Find                            |
| **Articulation Point/Bridge** | Network vulnerability               | "critical connection", "remove vertex"             |
| **Multi-Source BFS**          | Distance from multiple sources      | "distance to nearest 0-cell", "01 matrix"          |
| **Bidirectional BFS**         | Word Ladder, fastest transformation | "minimum steps between two states"                 |

**Choose the right algorithm:**

```
Negative weights?        → Bellman-Ford  O(VE)
All-pairs shortest?      → Floyd-Warshall O(V³)
MST (dense graph)?       → Prim  O((V+E) log V) with heap
MST (sparse graph)?      → Kruskal  O(E log E)
Multiple start points?   → Multi-Source BFS
```

🔗 **Practice problems:** [Graphs PS](../../05_Problem_Solving/10_Graphs.md)
📋 **All Patterns Hub:** [00_PATTERN_MASTER_GUIDE.md](../../04_Patterns_Templates/00_PATTERN_MASTER_GUIDE.md)

---

[Chapter overview](../05d_Graphs_Advanced_Algos.md) | [Bellman-Ford Algorithm (Negative Weights) →](02_bellman_ford_algorithm_negative_weights.md)
