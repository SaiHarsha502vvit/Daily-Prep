# 🕸️ Graph Patterns & Specialized Algorithms

> **Navigation**: [← Graphs Advanced Algos](05d_Graphs_Advanced_Algos.md) | [Chapter index](00_INDEX.md) | [String Algorithms →](13_String_Algorithms_Complete.md)
🧠 **Mental Model**: See [Graph & Tree Thinking](../14_Mental_Models/03_Graph_Tree_Thinking.md) — graph pattern recognition

---

## 🕸️ Part 15: Graph Patterns & Specialized Algorithms

## 🔗 Bridge — Where This Chapter Fits

| Dimension | This chapter |
| --- | --- |
| **Builds on** | [Advanced Graph Algorithms](05d_Graphs_Advanced_Algos.md) |
| **You will learn** | Strongly connected components (Tarjan/Kosaraju), articulation points and bridges, Euler paths, MST patterns, A\* search, topological ordering |
| **Leads to** | [Hardness (NP)](A3_Lower_Bounds_And_NP.md), [Network flow](06e_Algorithm_Patterns.md) |
| **Abstraction level** | L4: structure-aware graph algorithms |

> [!NOTE]
> The full gap-free reading order and dependency graph are in the [Learning Path](00_LEARNING_PATH.md).

---

## 💬 Explain It Like a Study Partner — Graph Patterns & Specialised Algorithms

### 1. The bottom line

Graph "patterns" exploit special structure (directions, cut points, heuristics) to solve problems faster or answer deeper questions than plain traversal.

### 2. The textbook core

- **SCC:** maximal sets of mutually reachable nodes; O(V + E).
- **Articulation points/bridges:** nodes/edges whose removal disconnects the graph (low-link values).
- **Euler path:** uses every edge once; exists by degree conditions.
- **A\*:** Dijkstra guided by an admissible heuristic.

### 3. The real-world analogy

Finding **single points of failure** in a network: which router, if removed, splits the network?

### 4. Walkthrough

1. Tarjan SCC on 1→2, 2→3, 3→1, 3→4.
2. DFS assigns discovery and low-link values.
3. Nodes 1, 2, 3 share a low-link (a cycle) → one SCC.
4. Node 4 is its own SCC.

> [!NOTE]
> **Quick check:** What does a bridge represent in a network? *A single link whose failure disconnects it.*

---


### 5W1H: Mastering Graph Patterns

> [!NOTE]
> #### 5W1H: Mastering Graph Patterns
>
> **What:** Advanced graph algorithms and structural patterns including SCC, MST, Articulation Points, Euler Paths, and A* Pathfinding.
>
> **Why:** These represent the pinnacle of graph algorithm engineering, solving complex network topology problems and routing.
>
> **When:** Use SCC to group interdependent nodes. Use Articulation Points to find single points of failure. Use A* for heuristic search.
>
> **Where:** Applied in game AI, network routing protocols, reliability analysis, and mapping software (like Google Maps).
>
> **Who:** Senior engineers and candidates tackling hard graph problems.
>
> **How:** Combining DFS with low-link values (Tarjan), Union-Find with greedy sorting (Kruskal), and Priority Queues with heuristics.

### Historical Evolution

Strongly Connected Components algorithms emerged from the need to decompose directed graphs into maximal cycles. **Tarjan's algorithm** for SCC was published by **Robert Tarjan in 1972** in a landmark paper titled "Depth-first search and linear graph algorithms" — it discovered that a single DFS pass with a stack and low-link values could identify all SCCs in $O(V+E)$ time, surprising the community because the problem seemed to require multiple passes. The algorithm used a stack to track nodes in the current DFS path and `low[u]` values (minimum discovery time reachable from u) to identify when to pop SCCs. **Kosaraju's algorithm** (devised by S. Rao Kosaraju in 1978 but left unpublished; Micha Sharir published it in 1981) uses two DFS passes — first on the original graph, then on the transpose graph — to achieve the same $O(V+E)$ result with a simpler mental model but worse cache behavior. **Articulation points and bridges** (cut vertices and cut edges) are central to network reliability; **Hopcroft and Tarjan (1973)** gave the DFS-based linear-time algorithm for biconnected components, and Tarjan's 1972 paper introduced the low-link technique it builds on. The **A\* algorithm** was published by **Peter Hart, Nils Nilsson, and Bertram Raphael in 1968** at SRI International as an extension of Dijkstra's algorithm with heuristic guidance, originally for robot navigation. Modern practice (post-2010) applies SCC to compiler design (control flow analysis), social network analysis (identifying tightly-connected communities), and dependency management in build systems.


### 5. Check yourself

**Q1.** How many components does union-find report after starting with `n` nodes and `m` successful unions?

<details><summary>Answer</summary>

`n − m`.

</details>

**Q2.** How do you test whether a graph is bipartite?

<details><summary>Answer</summary>

Two-colour it with BFS/DFS; finding an edge whose endpoints share a colour (an odd cycle) means it is not bipartite.

</details>

---

## 📚 Topic Pages in This Chapter

This chapter is split into focused pages so each topic can be read on its own. Read them in order the first time; use the table to jump back later.

| # | Page | What is inside | Lines |
| --- | --- | --- | --- |
| 1 | [Section Challenge — Advanced Graph Patterns](05e_Graphs_Patterns/01_section_challenge_advanced_graph_patterns.md) | Section Challenge — Advanced Graph Patterns · ALGORITHM COMPLEXITY COMPARISON · INTERVIEW PROBLEM PATTERNS | 528 |
| 2 | [A\* (A-STAR) ALGORITHM — COMPLETE GUIDE](05e_Graphs_Patterns/02_a_a_star_algorithm_complete_guide.md) | A\* (A-STAR) ALGORITHM — COMPLETE GUIDE | 404 |

## CURATED PRACTICE PROBLEMS — GRAPHS (Complete Collection)

**HOW TO USE**: Work top-to-bottom within each section. Every problem teaches a specific graph technique.
Mark each ✅ as you solve it. Revisit any problem you can't solve in 30 minutes after studying the pattern above.

---

### Section 1: BFS & DFS Fundamentals

| #   | Problem                                 | Platform | Difficulty | Category | Key Technique                          |
| --- | --------------------------------------- | -------- | ---------- | -------- | -------------------------------------- |
| 1   | Number of Islands (LC 200)              | LeetCode | Medium     | BFS/DFS  | Grid flood fill — the #1 graph starter |
| 2   | Flood Fill (LC 733)                     | LeetCode | Easy       | DFS      | Simple connected component on grid     |
| 3   | Max Area of Island (LC 695)             | LeetCode | Medium     | DFS      | Track component size during DFS        |
| 4   | Number of Provinces (LC 547)            | LeetCode | Medium     | DFS/UF   | Adjacency matrix, count components     |
| 5   | Clone Graph (LC 133)                    | LeetCode | Medium     | BFS/DFS  | HashMap to track visited clones        |
| 6   | Surrounded Regions (LC 130)             | LeetCode | Medium     | DFS      | Border-connected DFS, flip remaining   |
| 7   | Pacific Atlantic Water Flow (LC 417)    | LeetCode | Medium     | BFS      | Reverse BFS from both oceans           |
| 8   | Rotting Oranges (LC 994)                | LeetCode | Medium     | BFS      | Multi-source BFS, track minutes        |
| 9   | 01 Matrix (LC 542)                      | LeetCode | Medium     | BFS      | Multi-source BFS from all 0s           |
| 10  | Walls and Gates (LC 286)                | LeetCode | Medium     | BFS      | Multi-source BFS from gates            |
| 11  | Number of Connected Components (LC 323) | LeetCode | Medium     | DFS/UF   | Classic component counting             |
| 12  | Graph Valid Tree (LC 261)               | LeetCode | Medium     | DFS/UF   | Connected + no cycle = tree            |

---

### Section 2: Shortest Path (BFS / Dijkstra / Bellman-Ford)

| #   | Problem                                                | Platform | Difficulty | Category    | Key Technique                                 |
| --- | ------------------------------------------------------ | -------- | ---------- | ----------- | --------------------------------------------- |
| 1   | Shortest Path in Binary Matrix (LC 1091)               | LeetCode | Medium     | BFS         | 8-directional BFS on grid                     |
| 2   | Word Ladder (LC 127)                                   | LeetCode | Hard       | BFS         | Transform string BFS, O(26\*L) neighbors      |
| 3   | Network Delay Time (LC 743)                            | LeetCode | Medium     | Dijkstra    | Classic single-source shortest path           |
| 4   | Path With Minimum Effort (LC 1631)                     | LeetCode | Medium     | Dijkstra    | Min max-edge path, modified priority          |
| 5   | Cheapest Flights Within K Stops (LC 787)               | LeetCode | Medium     | BFS/BF      | Bellman-Ford with K relaxation rounds         |
| 6   | Swim in Rising Water (LC 778)                          | LeetCode | Hard       | Dijkstra    | Min bottleneck path                           |
| 7   | Minimum Cost to Make at Least One Valid Path (LC 1368) | LeetCode | Hard       | 0-1 BFS     | Deque BFS: 0-cost same dir, 1-cost change     |
| 8   | Shortest Path Visiting All Nodes (LC 847)              | LeetCode | Hard       | BFS+Bitmask | BFS with state = (node, visited_mask)         |
| 9   | Shortest Distance from All Buildings (LC 317)          | LeetCode | Hard       | BFS         | Multi BFS + sum distances                     |
| 10  | Find the City (LC 1334)                                | LeetCode | Medium     | Dijkstra/FW | Run Dijkstra from each city or Floyd-Warshall |

---

### Section 3: Topological Sort

| #   | Problem                                      | Platform | Difficulty | Category | Key Technique                          |
| --- | -------------------------------------------- | -------- | ---------- | -------- | -------------------------------------- |
| 1   | Course Schedule (LC 207)                     | LeetCode | Medium     | Topo     | Cycle detection via Kahn's BFS         |
| 2   | Course Schedule II (LC 210)                  | LeetCode | Medium     | Topo     | Return valid ordering                  |
| 3   | Alien Dictionary (LC 269)                    | LeetCode | Hard       | Topo     | Build graph from word comparisons      |
| 4   | Minimum Height Trees (LC 310)                | LeetCode | Medium     | Topo     | Peel leaves inward to find centroids   |
| 5   | Parallel Courses (LC 1136)                   | LeetCode | Medium     | Topo+BFS | Level-by-level Kahn's = min semesters  |
| 6   | Longest Increasing Path in a Matrix (LC 329) | LeetCode | Hard       | Topo+DP  | DAG on grid, topological order + memo  |
| 7   | Sort Items by Groups (LC 1203)               | LeetCode | Hard       | Topo     | Double topological sort (group + item) |
| 8   | Sequence Reconstruction (LC 444)             | LeetCode | Medium     | Topo     | Check unique topological order         |

---

### Section 4: Union-Find (Disjoint Set)

| #   | Problem                                                 | Platform | Difficulty | Category | Key Technique                             |
| --- | ------------------------------------------------------- | -------- | ---------- | -------- | ----------------------------------------- |
| 1   | Number of Islands II (LC 305)                           | LeetCode | Hard       | UF       | Online connectivity with union-find       |
| 2   | Redundant Connection (LC 684)                           | LeetCode | Medium     | UF       | Extra edge creates cycle → UF detects it  |
| 3   | Accounts Merge (LC 721)                                 | LeetCode | Medium     | UF       | Union emails, group by root               |
| 4   | Earliest Moment When Everyone Becomes Friends (LC 1101) | LeetCode | Medium     | UF       | Union until single component              |
| 5   | Satisfiability of Equality Equations (LC 990)           | LeetCode | Medium     | UF       | Union equals, check not-equals            |
| 6   | Most Stones Removed (LC 947)                            | LeetCode | Medium     | UF       | Union by row/col, answer = n - components |
| 7   | Smallest String With Swaps (LC 1202)                    | LeetCode | Medium     | UF       | Group by component, sort within group     |
| 8   | Minimize Malware Spread (LC 924)                        | LeetCode | Hard       | UF       | Component sizes, greedy removal           |

---

### Section 5: Minimum Spanning Tree (MST)

| #   | Problem                                           | Platform | Difficulty | Category     | Key Technique                        |
| --- | ------------------------------------------------- | -------- | ---------- | ------------ | ------------------------------------ |
| 1   | Min Cost to Connect All Points (LC 1584)          | LeetCode | Medium     | Prim/Kruskal | Classic MST on complete graph        |
| 2   | Connecting Cities With Minimum Cost (LC 1135)     | LeetCode | Medium     | Kruskal      | Sort edges + Union-Find              |
| 3   | Optimize Water Distribution (LC 1168)             | LeetCode | Hard       | MST          | Add virtual node for wells, then MST |
| 4   | Find Critical and Pseudo-Critical Edges (LC 1489) | LeetCode | Hard       | MST          | Force include/exclude each edge      |

---

### Section 6: Advanced Graph Patterns

| #   | Problem                            | Platform | Difficulty | Category | Key Technique                               |
| --- | ---------------------------------- | -------- | ---------- | -------- | ------------------------------------------- |
| 1   | Is Graph Bipartite? (LC 785)       | LeetCode | Medium     | Coloring | 2-color BFS/DFS                             |
| 2   | Possible Bipartition (LC 886)      | LeetCode | Medium     | Coloring | Can we 2-color with dislikes?               |
| 3   | Find Eventual Safe States (LC 802) | LeetCode | Medium     | Cycle    | Reverse graph + topo or DFS with states     |
| 4   | Detect Cycles in 2D Grid (LC 1559) | LeetCode | Medium     | DFS      | Track parent to detect back edges           |
| 5   | Evaluate Division (LC 399)         | LeetCode | Medium     | DFS      | Weighted graph, path multiplication         |
| 6   | Reconstruct Itinerary (LC 332)     | LeetCode | Hard       | Euler    | Hierholzer's algorithm, lexicographic order |
| 7   | Critical Connections (LC 1192)     | LeetCode | Hard       | Bridge   | Tarjan's algorithm for bridges              |
| 8   | Strongly Connected Components      | Classic  | Hard       | SCC      | Kosaraju's or Tarjan's algorithm            |

---

🔬 **Section Challenge — Section 6: Advanced Graph Patterns**

**Challenge 1 (Reasoning):** What is the core difference between an Euler Path and a Hamiltonian Path, and why does one have an efficient solution while the other is NP-Complete?

<details><summary>Answer</summary>

An Euler Path visits every **edge** exactly once, whereas a Hamiltonian Path visits every **vertex** exactly once. Finding an Euler Path is solvable in $O(E)$ time (using Hierholzer's Algorithm) because it relies on local vertex degrees (an edge-centric graph property). Conversely, finding a Hamiltonian Path requires checking global visitation state and backtracking, which scales exponentially $O(n^2 2^n)$ because there is no simple local rule to guarantee global vertex coverage without exhaustive search.

</details>

**Challenge 2 (Design):** Explain why Tarjan's SCC algorithm uses a stack and how it distinguishes between a cross-edge (pointing to a different SCC) and a back-edge (pointing within the current SCC).

<details><summary>Answer</summary>

Tarjan's algorithm uses a stack to keep track of nodes currently being explored in the DFS tree. When an SCC is fully discovered, all its nodes are popped together. To distinguish edge types, Tarjan maintains an `onStack` boolean array. If we encounter an already visited node `v` via edge `u -> v`, we check if `v` is `onStack`. If it is, `v` is part of the current exploration path (a back-edge within the same SCC), so we update `low[u]`. If it is NOT `onStack`, `v` belongs to an already finalized SCC (a cross-edge), and we ignore it.

</details>

### HIDDEN GEMS — Non-Famous But Excellent Graph Problems

These problems are less commonly seen in "Top 100" lists but teach deep graph intuition.

| #   | Problem                                                      | Platform | Why It's Valuable                                            |
| --- | ------------------------------------------------------------ | -------- | ------------------------------------------------------------ |
| 1   | Bus Routes (LC 815)                                          | LeetCode | BFS on routes (not stops) — graph modeling insight           |
| 2   | Shortest Bridge (LC 934)                                     | LeetCode | DFS to find island + BFS to expand — hybrid technique        |
| 3   | Time Needed to Inform All Employees (LC 1376)                | LeetCode | Tree DFS as graph problem — max path sum                     |
| 4   | Reorder Routes to Make All Paths Lead to City Zero (LC 1466) | LeetCode | Directed graph trick — reverse edges concept                 |
| 5   | Number of Operations to Make Network Connected (LC 1319)     | LeetCode | Components - 1 = min edges needed, UF elegance               |
| 6   | All Paths From Source to Target (LC 797)                     | LeetCode | DAG backtracking — no visited set needed                     |
| 7   | Detonate the Maximum Bombs (LC 2101)                         | LeetCode | Build directed graph from geometry, then DFS from each       |
| 8   | Minimum Number of Vertices to Reach All Nodes (LC 1557)      | LeetCode | Nodes with in-degree 0 — simple but teaches reachability     |
| 9   | Path with Maximum Probability (LC 1514)                      | LeetCode | Modified Dijkstra — maximize product instead of minimize sum |
| 10  | Minimum Genetic Mutation (LC 433)                            | LeetCode | BFS string transformation — Word Ladder variant with biology |

---

#### Graph Problem-Solving Decision Tree

**Which graph problem type am I facing?**

- Need shortest/minimum path?
- Unweighted edges → BFS
- Weighted (non-negative) → Dijkstra
- Weighted (negative okay) → Bellman-Ford
- All-pairs shortest → Floyd-Warshall
- Know the target + have heuristic → A*

- Need ordering/dependencies?
- Topological Sort (Kahn's BFS or DFS)

- Need components/connectivity?
- Static graph → DFS/BFS count components
- Dynamic (add edges) → Union-Find
- Directed → Kosaraju's/Tarjan's (SCC)

- Need minimum cost to connect all?
- MST (Kruskal + UF or Prim + PQ)

- Cycle detection?
- Undirected → UF or DFS with parent
- Directed → DFS with 3 colors (white/gray/black)

- Grid problem?
  - Connected regions → Flood fill DFS/BFS
  - Shortest path on grid → BFS (or Dijkstra if weighted)
  - Multi-source → Start BFS from all sources simultaneously

---

### 📎 Reference Anchor

**Guava `Graphs` utility and OpenJDK `ArrayDeque` for graph traversal**
- `Graphs.reachableNodes(graph, node)`: [Graphs.java](https://github.com/google/guava/blob/master/guava/src/com/google/common/graph/Graphs.java) — lazy BFS. **Invariant**: Returns a live `Set<N>` — iterating it TWICE triggers two full BFS traversals. Materialize: `new HashSet<>(Graphs.reachableNodes(graph, src))`.
- `ArrayDeque` for BFS/DFS: [ArrayDeque.java](https://github.com/openjdk/jdk/blob/master/src/java.base/share/classes/java/util/ArrayDeque.java) — O(1) amortized `offerLast/pollFirst` (BFS queue) and `push/pop` (DFS stack). Never use `LinkedList` — same API but worse cache locality.
- **Local rewrite rule**: For multi-source BFS (e.g., "01 Matrix" — distances from all 0-cells), seed ALL source nodes into the queue at the start with distance 0. Single-pass O(V+E). Never run BFS from each source separately (O(k × (V+E))).
- **Constraint warning**: Bidirectional BFS reduces worst-case explored nodes from O(b^d) to O(b^(d/2)) where b = branching factor and d = depth. Use it when the graph is large but source and target are both known and the graph is undirected.

---

### When It Breaks -- Graph Patterns

#### 1. Flood Fill — Modifying Grid During BFS Causes Re-Visit
**What breaks**: Flood fill that marks cells as visited by changing their value (e.g., `grid[r][c] = 2`) but then checks `grid[r][c] != original` — if the original value was the same as the "visited" marker, all cells are skipped.
**Fix**: Use a separate `boolean[][] visited` matrix. Don't encode visited state into the grid value unless you're certain the marker value can't appear in valid input.

#### 2. Multi-Source BFS — Wrong Initial Distance
**What breaks**: Seeding all source nodes with `dist = 1` instead of `dist = 0`. All computed distances are off by 1. The source nodes themselves should have distance 0 to themselves.

#### 3. Topological Sort — Processing in Wrong Order Breaks Dependency
**What breaks**: In topological sort for course scheduling, adding a course to the result before removing its edges. Subsequent in-degree decrements use a stale queue, possibly re-adding already-added courses or missing others.
**Fix**: Kahn's algorithm: poll from queue → add to result → decrement in-degrees of neighbors → enqueue any new in-degree-0 nodes. The order is strict.

---

### Brute Force → Optimal: Graph Pattern Matching

#### Problem: Number of Islands

**Brute Force — O(n²m²) recount on every query:**
Recount islands from scratch each time. Impractical for dynamic grids.

**Optimal — O(n×m) single pass with DFS/BFS flood fill:**
```java
for each cell (r,c) if grid[r][c]=='1' and not visited:
    islands++;
    bfs/dfs to mark all connected '1' cells as visited
```
Each cell is visited exactly once across all flood fills → O(n×m) total.

**For dynamic "add land" queries — Union-Find:**
Maintain a DSU over grid cells. Each `addLand(r,c)` call: create node, union with adjacent existing land cells. `numIslands()` = `dsu.count()`. Each operation O(α(n×m)).

---

### Proof Corner: BFS Shortest Path Correctness

**Claim**: BFS finds shortest path (minimum hops) in an unweighted graph.

**Proof by induction on distance d**:
- **Base**: All nodes at distance 0 (the source) are in the queue at the start with `dist = 0`. Correct.
- **Step**: Assume all nodes at distance d have been correctly assigned `dist = d` when first dequeued. When we dequeue node u (dist=d), we examine all neighbors v. If v is unvisited, `dist[v] = d+1`. Since we process all nodes at distance d before any at distance d+1 (FIFO queue property), no shorter path to v can be discovered later — any path to v via an unprocessed node at distance d would be at least d+1+1 = d+2 > d+1. So `dist[v] = d+1` is optimal. □

**Why DFS fails**: DFS might find a d=10 path before the d=2 path, depending on traversal order. The FIFO property of BFS is essential — it enforces level-by-level exploration.


---

## 🏢 Enterprise Lens — Graph Patterns & Specialised Algorithms

| Area | What top-tier engineering looks like |
| ---- | ------------------------------------ |
| **Where it runs in production** | Dependency cycle detection, compiler optimisations, network reliability analysis, route planning with heuristics |
| **Failure modes** | Recursion depth on large graphs; mixing directed and undirected rules; inadmissible heuristics in A\* |
| **Testing and verification** | Validate SCC counts against Kosaraju; random-graph tests with brute-force connectivity checks |

---

## Reality Check

**"If a problem has paths or connections, it must need a graph algorithm"** → Not necessarily. Many "path" problems on grids are solved with DP (minimum path sum), sliding window, or prefix sums — not Dijkstra. The graph model is appropriate when: vertices have discrete state, edges have meaningful weights or existence, and the relationship is genuinely non-linear (not a simple grid DP). Before reaching for a graph algorithm, ask: does this have uniform cost? Can I model it as DP? Is the "graph" actually a DAG where DP applies?

**"BFS finds the shortest path — always use BFS first"** → BFS finds shortest path in UNWEIGHTED graphs (or unit-weight graphs). For non-unit weights: Dijkstra's (non-negative weights), Bellman-Ford (negative weights). For 0-1 BFS (edges have weight 0 or 1): use a deque — push to front for 0-weight edges, push to back for 1-weight edges. O(V+E) like BFS but handles non-unit weights. Recognising when to use 0-1 BFS vs Dijkstra saves implementing a priority queue for a problem that a deque handles.

**"Topological sort only applies to DAGs — no use for graphs with cycles"** → True that topological sort is undefined for graphs with cycles (cycle detection is the first step — if a cycle is found, no topological order exists). The pattern is: can you model your problem as dependencies where A must come before B? Build systems (Makefile targets), course prerequisites, spreadsheet recalculation order, instruction scheduling in compilers — all DAG problems. If the problem has a cycle in dependencies (circular dependency in a build system), that's the error to report.

**"Multi-source BFS is just BFS from multiple starting nodes"** → Multi-source BFS initialises the queue with ALL source nodes at distance 0 simultaneously. This finds the distance from the nearest source for every node in O(V + E) — same as single-source BFS. Without multi-source BFS, you'd run BFS once per source: O(k * (V + E)) for k sources. Applications: "nearest exit" problems, spreading fire/infection from multiple origins, 0-1 matrix distance to nearest 0, walls and gates. The key insight: add all sources to the queue at time 0 before starting BFS.

**"The shortest path in a DAG always uses Dijkstra"** → DAG shortest path doesn't need Dijkstra (which handles cycles via visited marking). For DAGs: topological sort + DP in O(V + E). Process vertices in topological order; relax outgoing edges of each vertex. This handles negative edge weights correctly (no negative cycle possible in a DAG). Single-source shortest path in a DAG: O(V + E) vs Dijkstra's O(E log V). Longest path in a DAG: negate weights and find shortest path, or directly do DP in reverse topological order. (Longest path in general graphs is NP-hard.)
