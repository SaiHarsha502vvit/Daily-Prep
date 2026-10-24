# 🧩 Graph + Traversal — Pattern Guide

> **Navigation**: [← Tree + DFS/BFS](13_Tree_Plus_DFS_BFS.md) | [Chapter index](00_INDEX.md) | [Heap + Greedy Selection →](15_Heap_Plus_GreedySelection.md)

## Graph + Traversal Patterns — Combined Pattern Guide

**WHY this combination?** Graphs model relationships. BFS gives shortest unweighted path. DFS explores all reachable nodes. Dijkstra handles weighted graphs. Union-Find manages connected components. Choosing the right traversal is THE key skill.

### ⚠️ Constraint Lens

## 🔗 Bridge — Where This Chapter Fits

| Dimension | This chapter |
| --- | --- |
| **Builds on** | [Graphs](../02_Data_Structures/01g_DS_Internals.md), [Tree + DFS/BFS](13_Tree_Plus_DFS_BFS.md) |
| **You will learn** | Grid and adjacency-list DFS/BFS, visited sets, connected components, cycle detection, topological ordering |
| **Leads to** | [Topological Sort](28_Topological_Sort_Pattern.md), [Union-Find](27_Union_Find_Pattern.md), [Shortest Paths](30_Shortest_Path_Pattern.md) |
| **Abstraction level** | Tree traversal → **add a visited set** → components, cycles, ordering |

> [!NOTE]
> The full gap-free reading order and dependency graph are in the [Learning Path](00_LEARNING_PATH.md).

---

## 💬 Explain It Like a Study Partner — Graph + Traversal

### 1. The bottom line

A graph traversal is a tree traversal plus a visited set so cycles do not trap you.

### 2. The textbook core

- Adjacency list: `O(V + E)` traversal.
- BFS finds shortest paths in unweighted graphs; DFS finds components, cycles and finishing order.
- Mark nodes visited when *enqueued* (BFS) to avoid duplicates.
- Grids are implicit graphs: neighbours are the four (or eight) adjacent cells.

### 3. The real-world analogy

Exploring a **city with one-way streets**: you keep a map of visited intersections so you never loop.

### 4. Walkthrough

1. Count islands in a grid.
2. Scan cells; on an unvisited `1`, start a DFS.
3. The DFS marks the whole island visited.
4. Each new start increments the count.

> [!NOTE]
> **Quick check:** Why mark visited on enqueue in BFS? *Otherwise the same node can be queued many times.*


### 5. Check yourself

**Q1.** Count islands in `[[1,1,0],[0,1,0],[1,0,1]]`.

<details><summary>Answer</summary>

**3**: the connected group at the top-left, the single cell at (2,0) and the single cell at (2,2).

</details>

**Q2.** In BFS, when should a node be marked visited?

<details><summary>Answer</summary>

When it is enqueued, otherwise it can be queued many times.

</details>

**Q3.** What extra bookkeeping does cycle detection in a directed graph need compared with an undirected one?

<details><summary>Answer</summary>

A three-state mark (unvisited, in progress, done): reaching an in-progress node is a back edge, hence a cycle.

</details>

---

## Historical Evolution

**Inventor / Originator:** Graph theory begins with Euler's 1736 solution of the Königsberg bridge problem. Linear-time DFS algorithms are due to Tarjan (strongly connected components, 1972); Kahn (1962) gave the queue-based topological sort and Tarjan (1976) the DFS-based one.

**Predecessor context:** Dependency ordering and connectivity questions were solved by repeated scanning.

**Evolution narrative:** Once DFS and BFS were available in `O(V+E)`, component counting, cycle detection, topological ordering and SCC condensation became routine building blocks.

**Modern practice:** Build systems and package managers use topological order; compilers use SCCs; crawlers use BFS over the web graph. (PageRank is a separate iterative eigenvector computation, not a traversal.)

- **Euler — 1736**: Seven Bridges of Königsberg
- **Kahn — 1962**: Queue-based topological sorting
- **Tarjan — 1972**: Strongly connected components with one DFS
- **Tarjan — 1976**: DFS-based topological sort

---

## Production Reality

> [!TIP]
> **Solution fails or is too slow?** Run the five-step [Pattern Mis-Selection Debug Workflow](00_PATTERN_MASTER_GUIDE.md#pattern-mis-selection-debug-workflow) before changing code: the bug is often the pattern, not the implementation.

**Pattern-Specific Failure Modes:**

- **DFS recursion StackOverflowError on deep graphs (e.g., 100K-deep chain)** — Recursive DFS on a graph with a 100,000-node depth-first chain exhausts JVM stack. Detection: test on a path graph of 100,000 nodes.

- **BFS visited-set needs ConcurrentHashMap in parallel traversal** — In concurrent BFS, shared visited-set access without synchronization causes race conditions (missed nodes, infinite loops). Detection: test with parallel BFS workers; verify all nodes are visited exactly once.

- **Adjacency list memory pressure on dense graphs (V² edges)** — For dense graphs (V=10,000, E=50M), adjacency list allocation causes memory exhaustion. Detection: check if E approaches V²; switch to adjacency matrix for dense graphs.

- **Topological sort Kahn's algorithm needs cycle detection for DAG validation** — Running topological sort on a graph with cycles produces empty/incomplete result with no error. Detection: verify `result.size() == V` after topological sort; if less, graph had a cycle.

**Production Selection Heuristic:** Use iterative BFS/DFS for graph traversal in production. Always check for cycles before topological sort. Choose adjacency representation based on graph density.

---

| Given Constraints                | Do This                   |
| -------------------------------- | ------------------------- |
| unweighted shortest path         | BFS                       |
| weights are 0 or 1               | 0-1 BFS                   |
| non-negative weights             | Dijkstra                  |
| negative weights                 | Bellman-Ford / potentials |
| DAG dependencies                 | topological sort + DP     |
| connectivity with edge additions | DSU                       |
| edge deletions offline           | DSU rollback              |

Full map: [Constraint-Based Pattern Selection](25_Constraint_Based_Pattern_Selection.md).

## 🧠 Deep Intuition — Choosing the Right Graph Algorithm

### Graph Representation — The First Decision

Before choosing an algorithm, you must decide how to represent the graph. This decision affects both code complexity and performance:

| Representation       | Space    | Edge Lookup | Iterate Neighbors | Best When                              |
| -------------------- | -------- | ----------- | ----------------- | -------------------------------------- |
| **Adjacency List**   | O(V + E) | O(degree)   | O(degree)         | Sparse graphs (most real-world graphs) |
| **Adjacency Matrix** | O(V²)    | O(1)        | O(V)              | Dense graphs, need fast edge queries   |

Most interview problems use adjacency lists because real-world graphs are sparse (each node has few connections relative to total nodes).

### Why BFS Guarantees Shortest Path (Unweighted)

BFS explores nodes in **order of increasing distance from the source**. All nodes at distance 1 are explored before any node at distance 2. So the **first time you reach any node, you've reached it via the shortest path**. This is why BFS is the correct algorithm for unweighted shortest paths — it's a direct consequence of the level-by-level exploration.

This does NOT work for weighted graphs — a path with more edges might have a lower total weight, and BFS doesn't account for edge weights.

### Why Dijkstra Is Correct — The Greedy Proof Sketch

Dijkstra always processes the unvisited node with the **smallest known distance**. Its correctness relies on one assumption: **all edge weights are non-negative.** When you process a node, you know its distance is final because any other path would go through an unprocessed node with a _larger_ distance, and since all edges are non-negative, that alternative path can only be _longer_.

With negative edges, this assumption breaks — a longer path through a negative edge might turn out shorter. This is why Dijkstra fails on negative-weight graphs and you must use Bellman-Ford instead.

### Union-Find — The Power of Amortized O(1) Operations

Union-Find achieves near-constant time per operation through two optimizations:

- **Path compression**: When you call `find(x)`, make every node along the path point directly to the root. Future operations on these nodes are O(1).
- **Union by rank**: Always attach the shorter tree under the taller tree, keeping the tree balanced. Without this, unions could create a long chain (O(n) per find).

Together, these give **O(α(n))** amortized time per operation, where α is the inverse Ackermann function — so slow-growing that it's effectively ≤ 4 for any practical input size. This is essentially O(1).

---

## 🧠 WHEN TO RECOGNIZE

```
Problem type → Algorithm:
├── "Shortest path" (unweighted) → BFS
├── "Shortest path" (weighted, no negative) → Dijkstra
├── "Shortest path" (negative edges) → Bellman-Ford
├── "All pairs shortest path" → Floyd-Warshall
├── "Connected components" → BFS/DFS or Union-Find
├── "Cycle detection" → DFS (directed) or Union-Find (undirected)
├── "Topological ordering" → Kahn's BFS or DFS
├── "Minimum spanning tree" → Prim's or Kruskal's
├── "Bridges/Articulation points" → Tarjan's DFS
└── "Bipartite check" → BFS/DFS with 2-coloring
```

---

## 📐 CORE TEMPLATES

### Template 1: BFS (Shortest Path Unweighted)

```java
int bfs(int[][] graph, int start, int end) {
    Queue<Integer> queue = new LinkedList<>();
    boolean[] visited = new boolean[n];
    queue.offer(start);
    visited[start] = true;
    int distance = 0;

    while (!queue.isEmpty()) {
        int size = queue.size();
        for (int i = 0; i < size; i++) {
            int node = queue.poll();
            if (node == end) return distance;
            for (int neighbor : graph[node]) {
                if (!visited[neighbor]) {
                    visited[neighbor] = true;
                    queue.offer(neighbor);
                }
            }
        }
        distance++;
    }
    return -1;
}
```

### Template 2: DFS (Cycle Detection + Topological Sort)

```java
// States: 0=unvisited, 1=in-progress, 2=completed
boolean hasCycle(int node, List<List<Integer>> adj, int[] state, List<Integer> topo) {
    state[node] = 1;  // VISITING
    for (int next : adj.get(node)) {
        if (state[next] == 1) return true;       // CYCLE! Back edge
        if (state[next] == 0 && hasCycle(next, adj, state, topo)) return true;
    }
    state[node] = 2;  // DONE
    topo.add(0, node);  // Add to beginning for topological order
    return false;
}
```

### Template 3: Dijkstra

```java
int[] dijkstra(List<int[]>[] graph, int start, int n) {
    int[] dist = new int[n];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[start] = 0;
    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[1] - b[1]);
    pq.offer(new int[]{start, 0});

    while (!pq.isEmpty()) {
        int[] curr = pq.poll();
        int u = curr[0], d = curr[1];
        if (d > dist[u]) continue;  // skip stale entries
        for (int[] edge : graph[u]) {
            int v = edge[0], w = edge[1];
            if (dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
                pq.offer(new int[]{v, dist[v]});
            }
        }
    }
    return dist;
}
```

### Template 4: Union-Find

```java
int[] parent, rank;
int find(int x) {
    if (parent[x] != x) parent[x] = find(parent[x]);  // path compression
    return parent[x];
}
boolean union(int x, int y) {
    int px = find(x), py = find(y);
    if (px == py) return false;  // already connected (cycle in undirected!)
    if (rank[px] < rank[py]) { parent[px] = py; }
    else if (rank[px] > rank[py]) { parent[py] = px; }
    else { parent[py] = px; rank[px]++; }
    return true;
}
```

---

## 🔬 FULL WALKTHROUGH: Number of Islands (Grid DFS)

```
Problem: Count number of islands in a grid.
  grid = [
    [1,1,0,0,0],
    [1,1,0,0,0],
    [0,0,1,0,0],
    [0,0,0,1,1]
  ]

Approach: Scan grid. When we find a '1', DFS to "sink" the
entire island (mark all connected 1s as 0), then increment count.

WHY DFS/sink? After sinking, we won't count the same island twice.

Step-by-step:
  (0,0)=1 → DFS! Sink (0,0),(0,1),(1,0),(1,1). count=1
  (0,1)=0 (sunk), skip.
  (2,2)=1 → DFS! Sink (2,2). count=2
  (3,3)=1 → DFS! Sink (3,3),(3,4). count=3

  Answer: 3 islands ✅

Time: O(R×C) | Space: O(R×C) recursion stack worst case
```

---

## 🔬 FULL WALKTHROUGH 2: Topological Sort (Course Schedule)

```
Problem: Can you finish all courses? Prerequisites: [[1,0],[2,0],[3,1],[3,2]]
         (0 must come before 1, 0 before 2, 1 before 3, 2 before 3)

         0 → 1 → 3
         0 → 2 → 3

Approach: Kahn's Algorithm (BFS-based topological sort using indegree).

Step-by-step:
  Compute indegree: 0→0, 1→1, 2→1, 3→2
  Queue = nodes with indegree 0 = [0]
  order = []

  Dequeue 0: order=[0]. Neighbors: 1(indegree 1→0), 2(indegree 1→0)
             Queue = [1, 2]
  Dequeue 1: order=[0,1]. Neighbors: 3(indegree 2→1)
             Queue = [2]
  Dequeue 2: order=[0,1,2]. Neighbors: 3(indegree 1→0)
             Queue = [3]
  Dequeue 3: order=[0,1,2,3]. No neighbors.
             Queue = []

  order.size() == numCourses(4) → YES, can finish! ✅
  Topological order: [0, 1, 2, 3]

  If order.size() < numCourses → there's a cycle → impossible!

Time: O(V + E) | Space: O(V + E)
```

---

## 🛡️ EDGE CASES & COMMON MISTAKES

```
EDGE CASES:
┌──────────────────────────────────┬──────────────────────────────────────┐
│ Edge Case                        │ Handling                             │
├──────────────────────────────────┼──────────────────────────────────────┤
│ Disconnected graph               │ BFS/DFS may miss components — loop!  │
│ Self-loop                        │ Cycle detection catches this         │
│ Empty graph (no edges)           │ All nodes are valid, indegree=0      │
│ Grid with all 0s                 │ 0 islands                            │
│ Grid with all 1s                 │ 1 island                             │
│ Single node, no edges            │ Trivially works                      │
│ Negative weights (Dijkstra)      │ Dijkstra FAILS! Use Bellman-Ford     │
└──────────────────────────────────┴──────────────────────────────────────┘

COMMON MISTAKES:
1. BFS: Adding to visited AFTER dequeue instead of WHEN enqueueing
   Result: same node enqueued multiple times → TLE or wrong answer
2. Directed vs undirected cycle detection — DIFFERENT algorithms!
   Undirected: parent tracking. Directed: 3-state coloring (white/gray/black)
3. Dijkstra: Not using "skip stale" pattern (if dist[u] < curr_dist: skip)
4. Topological sort: Forgetting to check order.size() vs numNodes for cycle
5. Grid DFS: Forgetting to mark visited BEFORE recursing into neighbors
```

---

## 📊 COMPLEXITY SUMMARY

| Algorithm         | Time           | Space  | When                            |
| ----------------- | -------------- | ------ | ------------------------------- |
| BFS/DFS traversal | O(V+E)         | O(V)   | Reachability, components        |
| Grid BFS/DFS      | O(R×C)         | O(R×C) | Islands, flood fill             |
| Topological Sort  | O(V+E)         | O(V+E) | DAG ordering, scheduling        |
| Dijkstra          | O(E log V)     | O(V)   | Shortest path, positive weights |
| Union-Find        | O(α(n)) ≈ O(1) | O(n)   | Connectivity, MST               |

---

## 📋 Practice Problems

> [!NOTE]
> The *Companies* column lists employers that candidates have reported asking the problem. These tags are community-reported, change over time and are **not verified** — use them as hints about relevance, not as facts.

### Easy

| #   | Problem                                                                                                      | Companies  | Key Insight                |
| --- | ------------------------------------------------------------------------------------------------------------ | ---------- | -------------------------- |
| 2   | [DFS of Graph](https://www.geeksforgeeks.org/depth-first-search-or-dfs-for-a-graph/)                         | Amazon     | Standard DFS template      |
| 3   | [Number of Islands](https://leetcode.com/problems/number-of-islands/)                                        | —          | DFS/BFS flood fill on grid |
| 4   | [Flood Fill](https://leetcode.com/problems/flood-fill/)                                                      | Salesforce | BFS/DFS from source        |
| 5   | [Rat in a Maze](https://practice.geeksforgeeks.org/problems/rat-in-a-maze-problem/1)                         | —          | Backtracking DFS           |
| 6   | [Detect Cycle Undirected](https://practice.geeksforgeeks.org/problems/detect-cycle-in-an-undirected-graph/1) | —          | BFS/DFS or Union-Find      |
| 7   | [Detect Cycle Directed](https://www.geeksforgeeks.org/detect-cycle-in-a-graph/)                              | —          | DFS with 3 states          |

### Medium

| #   | Problem                                                                                                                                  | Companies          | Key Insight                        |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | ---------------------------------- |
| 8   | [Steps by Knight](https://practice.geeksforgeeks.org/problems/steps-by-knight5927/1)                                                     | Amazon             | BFS shortest path                  |
| 9   | [Decode String](https://leetcode.com/problems/decode-string/)                                                                            | Amazon             | Stack + DFS                        |
| 10  | [Shortest Bridge](https://leetcode.com/problems/shortest-bridge/)                                                                        | Amazon             | DFS to find island + BFS to expand |
| 11  | [Network Connected](https://leetcode.com/problems/number-of-operations-to-make-network-connected/)                                       | Amazon, Salesforce | Union-Find: edges - components     |
| 12  | [Eventual Safe States](https://leetcode.com/problems/find-eventual-safe-states/)                                                         | —                  | Reverse DFS / topo sort            |
| 13  | [Kosaraju's SCC](https://practice.geeksforgeeks.org/problems/strongly-connected-components-kosarajus-algo/1)                             | —                  | Two-pass DFS                       |
| 14  | [Time to Inform Employees](https://leetcode.com/problems/time-needed-to-inform-all-employees/)                                           | Amazon             | DFS/BFS on tree                    |
| 15  | [Graph Coloring](https://www.geeksforgeeks.org/graph-coloring-applications/)                                                             | —                  | Backtracking                       |
| 16  | [Most Stones Removed](https://leetcode.com/problems/most-stones-removed-with-same-row-or-column/)                                        | —                  | Union-Find on row/col              |
| 17  | [As Far from Land](https://leetcode.com/problems/as-far-from-land-as-possible/)                                                          | —                  | Multi-source BFS                   |
| 18  | [Smallest City at Threshold](https://leetcode.com/problems/find-the-city-with-the-smallest-number-of-neighbors-at-a-threshold-distance/) | —                  | Floyd-Warshall or Dijkstra         |
| 19  | [Course Schedule](https://www.geeksforgeeks.org/find-whether-it-is-possible-to-finish-all-tasks-or-not-from-given-dependencies/)         | —                  | Topological sort cycle check       |
| 20  | [Prim's MST](https://www.geeksforgeeks.org/prims-minimum-spanning-tree-mst-greedy-algo-5/)                                               | Salesforce         | PQ-based Prim's                    |
| 21  | [Floyd-Warshall](https://practice.geeksforgeeks.org/problems/implementing-floyd-warshall2042/1)                                          | —                  | All-pairs DP                       |
| 22  | [Evaluate Division](https://leetcode.com/problems/evaluate-division/)                                                                    | —                  | Weighted graph DFS                 |
| 23  | [Snakes and Ladders](https://leetcode.com/problems/snakes-and-ladders/)                                                                  | —                  | BFS shortest path                  |
| 24  | [Topological Sort](https://practice.geeksforgeeks.org/problems/topological-sort/1)                                                       | Microsoft          | Kahn's or DFS                      |
| 25  | [Cheapest Flights K Stops](https://leetcode.com/problems/cheapest-flights-within-k-stops/description/)                                   | Amazon, Salesforce | Modified Dijkstra or Bellman-Ford  |
| 26  | [Bellman-Ford Negative Cycle](https://www.geeksforgeeks.org/detect-negative-cycle-graph-bellman-ford/)                                   | —                  | V-1 iterations + check             |
| 27  | [Bipartite Graph](https://www.geeksforgeeks.org/bipartite-graph/)                                                                        | —                  | BFS 2-coloring                     |

### Hard

| #   | Problem                                                                                                        | Companies             | Key Insight                      |
| --- | -------------------------------------------------------------------------------------------------------------- | --------------------- | -------------------------------- |
| 28  | [Longest Increasing Path in Matrix](https://leetcode.com/problems/longest-increasing-path-in-a-matrix/)        | Amazon                | DFS + memoization on grid        |
| 29  | [Making a Large Island](https://leetcode.com/problems/making-a-large-island/)                                  | —                     | Union-Find + try flipping each 0 |
| 30  | [Critical Connections](https://leetcode.com/problems/critical-connections-in-a-network/)                       | Salesforce            | Tarjan's bridge finding          |
| 31  | [Alien Dictionary](https://practice.geeksforgeeks.org/problems/alien-dictionary/1)                             | Salesforce            | Build graph + topological sort   |
| 32  | [Water Jug BFS](https://www.geeksforgeeks.org/water-jug-problem-using-bfs/)                                    | —                     | State-space BFS                  |
| 33  | [Travelling Salesman](https://www.geeksforgeeks.org/travelling-salesman-problem-set-1/)                        | Salesforce, Microsoft | DP + bitmask                     |
| 34  | [Spanning Trees Count](https://www.geeksforgeeks.org/total-number-spanning-trees-graph/)                       | —                     | Kirchhoff's theorem              |
| 35  | [Word Ladder](https://leetcode.com/problems/word-ladder/)                                                      | —                     | BFS with word transformation     |
| 36  | [Minimize Cash Flow](https://www.geeksforgeeks.org/minimize-cash-flow-among-given-set-friends-borrowed-money/) | —                     | Net amounts + greedy             |
| 37  | [Remove Boxes](https://leetcode.com/problems/remove-boxes/)                                                    | Salesforce, Microsoft | Interval DP                      |

### Additional — From Bonus Section

| #   | Problem                           | Key Insight          |
| --- | --------------------------------- | -------------------- |
| 38  | Bridge in a Graph                 | Tarjan's algorithm   |
| 39  | Seven Bridges of Königsberg       | Euler path existence |
| 40  | Minimum edges to reverse for path | 0-1 BFS              |

---

## 🎯 INTERVIEW ARTICULATION — How to Explain Graph Algorithms

**When the interviewer gives you a graph problem, say this:**

"First, I'll represent this as a graph — [adjacency list/matrix]. Then I'll choose the right traversal: BFS for shortest unweighted path, DFS for exploring all paths or detecting cycles, Dijkstra for weighted shortest path, or Union-Find for connectivity queries."

**How to justify your choice:**

- "BFS guarantees shortest path in unweighted graphs because it explores nodes in order of increasing distance from the source. The first time we reach any node IS the shortest path."
- "Dijkstra is correct because all edge weights are non-negative. When we settle a node (dequeue from priority queue), any alternative path goes through unsettled nodes with larger distances — so it can only be longer."
- "Union-Find with path compression + union by rank gives amortized O(α(n)) ≈ O(1) per operation, where α is the inverse Ackermann function — practically constant."

**Key anti-pattern:**

- ❌ "NEVER use Dijkstra with negative edge weights — it will give wrong answers because a node marked 'settled' might later be reachable via a cheaper path through a negative edge. Use Bellman-Ford O(V×E) instead."
- ❌ "For cycle detection in directed graphs, use DFS with 3-color marking (white/gray/black), not just visited/unvisited."
- ❌ "Don't forget: grids ARE graphs! Each cell is a node, each adjacent cell is an edge. Apply standard BFS/DFS."

**Real-world applications:**

- Google Maps / GPS navigation (Dijkstra for weighted shortest path)
- Social networks ("People You May Know" — BFS for degrees of separation)
- Package managers (Maven, npm — topological sort for dependency resolution)
- Network routing (BGP, OSPF — shortest path algorithms)
- Image segmentation (connected components — Union-Find)
- Web crawlers (BFS from seed URLs to discover pages)

---

📖 **Related Chapters:**

- [03_Algorithms/05c_Graphs_Fundamentals.md](../03_Algorithms/05c_Graphs_Fundamentals.md) — Graph fundamentals
- [03_Algorithms/05d_Graphs_Advanced_Algos.md](../03_Algorithms/05d_Graphs_Advanced_Algos.md) — Advanced graph algorithms
- [03_Algorithms/14_Union_Find_DSU_Complete.md](../03_Algorithms/14_Union_Find_DSU_Complete.md) — Union-Find deep dive

---

[← 13 Tree+DFS/BFS](13_Tree_Plus_DFS_BFS.md) | [15 Heap+Greedy →](15_Heap_Plus_GreedySelection.md)


---

## 🏢 Enterprise Lens — Graph + Traversal

| Area | What top-tier engineering looks like |
| ---- | ------------------------------------ |
| **Where it runs in production** | Dependency resolution, social-graph reachability, network crawling, flood-fill tools |
| **Failure modes** | Missing visited marks; recursion depth on large grids; treating directed edges as undirected |
| **Testing and verification** | Randomised graph tests against a simple reference; test empty graph, disconnected graph, self-loops |

---

## Reality Check

**"Mark visited when you pop from the queue"** → Mark at ENQUEUE time, not dequeue. Dequeue-marking lets the same node enter the queue through multiple neighbors before its first pop — on dense graphs that inflates the queue to O(E) duplicates and on shortest-path BFS it can record the wrong (longer) first-visit. The one-line discipline: the visited check and the add happen together, atomically, at the moment of discovery.

**"Grid problems need an explicit graph structure"** → The grid IS the adjacency function: neighbors are the four direction offsets, validity is bounds-plus-condition. Building node objects and edge lists for a grid is the overengineering tell interviewers note silently. The direction-array idiom (dr/dc arrays looped together) plus in-place visited marking (flip the cell value when allowed) is the entire infrastructure — fifteen lines, no classes.

**"DFS recursion is fine for graphs since it works for trees"** → Grid and graph DFS reaches depths trees never do — a snake-shaped path through a 1000x1000 grid is a million frames, far beyond the JVM's default stack. Tree height bounds recursion naturally; graph diameter does not. The professional reflexes: know your input scale, and know the iterative-with-explicit-stack conversion cold because "works on the sample, StackOverflowError on test 40" is this exact gap.

**"Multi-source BFS is an advanced variant"** → It is vanilla BFS with several nodes seeded at distance zero — nothing else changes. Rotting oranges, walls-and-gates, nearest-exit: seed all sources, run once, distances are nearest-source distances. The recognition cue is the question inversion: "for every cell, distance to the NEAREST X" means start FROM all X simultaneously, not from every cell separately (which would be the accidental O(n squared) version).

**"Cycle detection is one algorithm"** → Three graph flavors, three tools: undirected uses union-find or DFS-with-parent-exclusion (the parent edge is not a cycle); DIRECTED needs three colors (white/gray/black) because a back edge means gray-hits-gray, and touching a finished black node is fine; and functional graphs (each node one out-edge) allow Floyd. Using undirected logic on a directed graph reports false cycles at every diamond — the most common wrong-tool bug in this family.
