# Graphs Advanced Algos

**Navigation**: [< Previous Chapter](05c_Graphs_Fundamentals.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next Chapter >](05e_Graphs_Patterns.md)
🧠 **Mental Model**: See [Graph & Tree Thinking](../14_Mental_Models/03_Graph_Tree_Thinking.md) — shortest path and MST mental models

---

## 📚 Topic Pages in This Chapter

This chapter is split into focused pages so each topic can be read on its own. Read them in order the first time; use the table to jump back later.

| # | Page | What is inside | Lines |
| --- | --- | --- | --- |
| 1 | [University Proof Corner](05d_Graphs_Advanced_Algos/01_university_proof_corner.md) | University Proof Corner · JIT Connection — Advanced Graph Algorithms | 105 |
| 2 | [Bellman-Ford Algorithm (Negative Weights)](05d_Graphs_Advanced_Algos/02_bellman_ford_algorithm_negative_weights.md) | Bellman-Ford Algorithm (Negative Weights) · Floyd-Warshall Algorithm (All-Pairs Shortest… · Minimum Spanning Tree — Why Greedy Even Works… · Minimum Spanning Tree - Kruskal's Algorithm | 170 |
| 3 | [Graph Problem Patterns](05d_Graphs_Advanced_Algos/03_graph_problem_patterns.md) | Graph Problem Patterns | 185 |
| 4 | [Complete Graph Problems with Solutions](05d_Graphs_Advanced_Algos/04_complete_graph_problems_with_solutions.md) | Complete Graph Problems with Solutions | 167 |
| 5 | [PART FINAL: ADVANCED TREE & GRAPH ALGORITHMS - DEEP DIVE](05d_Graphs_Advanced_Algos/05_final_advanced_tree_graph_algorithms_deep.md) | Advanced Tree Algorithms | 412 |
| 6 | [Advanced Graph Algorithms](05d_Graphs_Advanced_Algos/06_advanced_graph_algorithms.md) | Advanced Graph Algorithms · Reference Anchor · Brute Force → Optimal: Shortest Path on… | 423 |

## PART 12: Advanced Graph Algorithms

## 🔗 Bridge — Where This Chapter Fits

| Dimension | This chapter |
| --- | --- |
| **Builds on** | [Graph Fundamentals](05c_Graphs_Fundamentals.md), [Heaps](../02_Data_Structures/01f_Trees_Heaps.md), [Union-Find](14_Union_Find_DSU_Complete.md) |
| **You will learn** | Dijkstra, Bellman–Ford, Floyd–Warshall, MST (Prim, Kruskal), topological sort, shortest-path variants |
| **Leads to** | [Graph Patterns](05e_Graphs_Patterns.md), [Network flow](06e_Algorithm_Patterns.md) |
| **Abstraction level** | L4: weights change everything |

> [!NOTE]
> The full gap-free reading order and dependency graph are in the [Learning Path](00_LEARNING_PATH.md).

---

## 💬 Explain It Like a Study Partner — Advanced Graph Algorithms

### 1. The bottom line

When edges have weights, plain BFS is no longer enough, and the choice of shortest-path algorithm depends on whether weights can be negative.

### 2. The textbook core

- **Dijkstra:** non-negative weights, O((V + E) log V) with a heap.
- **Bellman–Ford:** negative weights, O(VE), detects negative cycles.
- **Floyd–Warshall:** all pairs, O(V³).
- **MST:** Kruskal O(E log E) with DSU; Prim O(E log V) with a heap.

### 3. The real-world analogy

A **GPS**: always extend the currently cheapest unexplored route (Dijkstra); if a toll could be a refund (negative), you must re-check routes repeatedly (Bellman–Ford).

### 4. Walkthrough

1. Graph: A→B (4), A→C (1), C→B (2).
2. Dijkstra from A: dist A=0, C=1, B=4 initially.
3. Pop C (1): relax C→B → 3 < 4, update B=3.
4. Pop B (3): done; shortest A→B = 3.

> [!NOTE]
> **Quick check:** Why does Dijkstra fail with negative edges? *It finalises a node when popped, assuming no later path can be cheaper.*

---


## Articulation Points and Bridges

```
CONCEPT:
Articulation Point: A vertex whose removal disconnects the graph.
Bridge: An edge whose removal disconnects the graph.

USE CASES:
- Network vulnerability analysis
- Finding critical connections
```

```java
public class ArticulationPointsBridges {
    private int timer = 0;
    private List<Integer> articulationPoints = new ArrayList<>();
    private List<int[]> bridges = new ArrayList<>();

    public void find(List<List<Integer>> adj) {
        int n = adj.size();
        boolean[] visited = new boolean[n];
        int[] tin = new int[n];   // Discovery time
        int[] low = new int[n];   // Lowest reachable time

        for (int i = 0; i < n; i++) {
            if (!visited[i]) {
                dfs(i, -1, adj, visited, tin, low);
            }
        }
    }

    private void dfs(int node, int parent, List<List<Integer>> adj,
                     boolean[] visited, int[] tin, int[] low) {
        visited[node] = true;
        tin[node] = low[node] = timer++;
        int children = 0;

        for (int neighbor : adj.get(node)) {
            if (neighbor == parent) continue;

            if (visited[neighbor]) {
                // Back edge
                low[node] = Math.min(low[node], tin[neighbor]);
            } else {
                // Tree edge
                children++;
                dfs(neighbor, node, adj, visited, tin, low);
                low[node] = Math.min(low[node], low[neighbor]);

                // Check for articulation point
                if (parent != -1 && low[neighbor] >= tin[node]) {
                    articulationPoints.add(node);
                }

                // Check for bridge
                if (low[neighbor] > tin[node]) {
                    bridges.add(new int[]{node, neighbor});
                }
            }
        }

        // Special case: root with multiple children is articulation point
        if (parent == -1 && children > 1) {
            articulationPoints.add(node);
        }
    }
}
```

---

## 🏢 Enterprise Lens — Advanced Graph Algorithms

| Area | What top-tier engineering looks like |
| ---- | ------------------------------------ |
| **Where it runs in production** | Maps and routing, network protocols (OSPF), build and task scheduling, clustering via MST, currency arbitrage detection (negative cycles) |
| **Failure modes** | Using Dijkstra with negative edges; `int` overflow when adding to infinity; stale heap entries not skipped; forgetting undirected edges |
| **Testing and verification** | Compare against Bellman–Ford on random graphs; test disconnected targets and zero-weight edges |

---

## Reality Check

**"Dijkstra's works on any weighted graph"** → Dijkstra's algorithm requires **non-negative edge weights**. With negative edges, the greedy expansion (always expand cheapest unvisited) breaks: expanding a node finalises its shortest path, but a later negative edge could provide a shorter path. Use Bellman-Ford for graphs with negative edges (O(VE)). Use SPFA (Shortest Path Faster Algorithm) as a practical optimisation. For negative cycles: Bellman-Ford detects them; Dijkstra's has undefined behaviour.

**"A* is just Dijkstra's with a heuristic — the heuristic doesn't matter"** → The heuristic must be *admissible* (never overestimates the true distance) for A* to find the optimal path. With an inadmissible heuristic, A* may find suboptimal paths. The *consistency* property (heuristic satisfies triangle inequality) is stronger and guarantees monotone decrease in f-values. Euclidean distance is a perfect heuristic for 2D grid pathfinding; Manhattan distance for 4-direction grids.

**"Prim's algorithm only works on dense graphs"** → Prim's with a binary heap: O(E log V) — good for sparse graphs. Prim's with a Fibonacci heap: O(E + V log V) — asymptotically optimal. Prim's with an adjacency matrix and linear scan: O(V²) — good for dense graphs (E ≈ V²). The algorithm works on any connected undirected weighted graph; the data structure choice optimises for graph density.

**"Bellman-Ford is always slow — just use Dijkstra's"** → Bellman-Ford is O(VE) vs Dijkstra's O(E log V). For graphs without negative edges, Dijkstra's wins. But Bellman-Ford solves problems Dijkstra's cannot: negative edges, negative cycle detection, distributed shortest-path computation (each node independently runs a version of Bellman-Ford — this IS how BGP routing protocol works on the internet).

**"Strongly Connected Components are only relevant for theoretical CS"** → SCCs solve: condensation graph computation (all nodes in an SCC are equivalent, collapse to one), finding circular dependencies in build systems and package managers, network vulnerability analysis (nodes in the same SCC can reach each other — removing one node can disconnect the whole SCC), web page ranking (SCC structure of the web link graph). Tarjan's and Kosaraju's algorithms find all SCCs in O(V + E).
