**Navigation**: [Back to Index](../00_MASTER_INDEX.md) | [Next Chapter >](05c_Graphs_Fundamentals.md)
🧠 **Mental Model**: See [Graph & Tree Thinking](../14_Mental_Models/03_Graph_Tree_Thinking.md) — traversal intuition and pattern recognition

---

# GRAPHS - Complete Guide

## From Fundamentals to Advanced Graph Algorithms

**Split from Trees_Graphs.md for better navigation**
See also: [Trees](05_Trees.md) | [Index](../00_MASTER_INDEX.md)

---

### 5W1H: Mastering Graph Internals

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  WHAT: Memory models of graphs (Adjacency List vs Matrix), edge list storage,║
║        and internal CPU/Cache behavior during graph traversal algorithms.    ║
║                                                                              ║
║  WHY:  Incorrect graph representation leads to O(V²) memory blowouts or      ║
║        cache thrashing. Understanding memory layout defines performance.     ║
║                                                                              ║
║  WHO:  Performance-minded engineers deciding how to encode networks, paths,  ║
║        and dependencies in memory-constrained environments.                  ║
║                                                                              ║
║  WHEN: Adjacency List for sparse graphs (E < V²/2). Adj Matrix for dense     ║
║        graphs or O(1) edge lookups. Edge List for sorting edges (Kruskal's). ║
║                                                                              ║
║  HOW:  By comparing memory overhead of Object-based adjacency lists vs flat  ║
║        2D arrays, and selecting ArrayDeque over LinkedList for cache-        ║
║        friendly BFS/DFS queues.                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## 🎓 University Proof Corner

> **MIT 6.042J (Math for CS) / KTH DD1352 / TU Munich layer** — The mathematical foundations of graphs, a proof that adjacency list is space-optimal, and why graph theory began with a walk across Königsberg's bridges.

### Handshaking Lemma (the founding theorem of graph theory)

**Claim**: In any undirected graph, the sum of vertex degrees equals twice the number of edges.

$$\sum_{v \in V} \deg(v) = 2|E|$$

**Proof**: Each edge {u, v} contributes exactly 1 to deg(u) and 1 to deg(v) — contributing 2 to the total sum. Summing over all |E| edges: total = 2|E|. ✓

**Corollary**: The number of odd-degree vertices is always even (an odd-sum total is impossible with even 2|E|).

**Why it matters**: Euler (1736) proved that an Eulerian circuit (visiting every edge once, returning to start) exists **if and only if every vertex has even degree** — using exactly this handshaking argument on the Königsberg bridges. This problem — "is there a route crossing each of 7 bridges exactly once?" — is the birth of graph theory.

### Adjacency List Space Complexity Proof

For an undirected graph with V vertices and E edges:
- Array of V list headers: O(V).
- Each undirected edge {u, v} appears in two lists (u's and v's): exactly 2E entries.
- **Total: O(V + E)** — provably space-optimal for representing every edge.

Adjacency matrix: O(V²) regardless of E — wastes O(V²−E) space on sparse graphs (roads, social networks). For dense graphs (E ≈ V²), both representations are O(V²).

**Rule of thumb**: Adjacency list when E ≪ V²; matrix when you need O(1) edge-existence queries or E ≈ V².

### Historical Evolution

**Leonhard Euler (1736)**: Königsberg bridge problem → invented graph theory. Proved no Eulerian circuit exists when odd-degree vertices > 0. **Arthur Cayley (1857)**: Introduced "trees" (connected acyclic graphs); proved Vᵛ⁻² labelled spanning trees exist on V vertices (Cayley's formula). **Dénes Kőnig (1931)**: Graph Theory textbook — first systematic treatment; König's theorem (bipartite max-matching = min vertex cover). **CLRS Introduction to Algorithms (1990)**: Standardized the adjacency list representation, BFS, DFS pseudocode now universal in CS education.

> BFS/Dijkstra proofs: [05c — Graphs Fundamentals](05c_Graphs_Fundamentals.md) | Lower bound for graph problems: [A3 — Lower Bounds & NP](A3_Lower_Bounds_And_NP.md)

📎 **Reference Anchor**: [Guava ImmutableGraph / Graph API](https://github.com/google/guava/blob/master/guava/src/com/google/common/graph/Graph.java) · [JGraphT AdjacencyList impl](https://github.com/jgrapht/jgrapht/blob/master/jgrapht-core/src/main/java/org/jgrapht/graph/AbstractBaseGraph.java)
**Invariant learned**: Guava's `Graph<N>` API separates the *graph interface* (node/edge set, adjacency queries) from the *traversal algorithm* — the exact split the Handshaking Lemma makes. The API exposes `graph.edges()` returning a `Set<EndpointPair<N>>`, so |E| and ∑deg(v) can be computed directly from the contract without inspecting adjacency list internals.
**Local rewrite**: This chapter's O(V+E) space proof (V list headers + 2E entries for undirected) maps directly to JGraphT's `AbstractBaseGraph` which stores one `vertexMap` (the V headers) and one `edgeMap` (the 2E directed-edge records that represent undirected pairs).
**Constraint warning**: `HashMap`-backed adjacency lists (the default in JGraphT for `SimpleGraph`) do NOT guarantee iteration order of neighbors. If BFS/DFS results must be deterministic (e.g., in tests), use `LinkedHashMap`-backed graphs or explicitly sort the neighbor list.

---

🔬 **Section Challenge — From Fundamentals to Advanced Graph Algorithms**

**Challenge 1 (Reasoning):** BFS finds shortest path in unweighted graphs but not in weighted graphs. Why exactly?

<details><summary>Answer</summary>

BFS explores by 'hop count' (number of edges). Each level = one more edge away from source. All edges are treated as weight=1. In a weighted graph, the 'shortest by hop count' path may not be 'shortest by weight sum'. Example: A→B (weight 1, 1 hop) vs A→C→B (weight 0.1+0.1=0.2, 2 hops). BFS finds A→B (1 hop), Dijkstra finds A→C→B (lower total weight). BFS is optimal ONLY when all edges have equal weight.

</details>

**Challenge 2 (Design):** Detect if a directed graph has a cycle. Write the algorithm and explain why we need 3 states (not 2).

<details><summary>Answer</summary>

3 states: UNVISITED, IN_PROGRESS (currently in DFS path), DONE. DFS: mark node IN_PROGRESS before visiting neighbors. If we reach an IN_PROGRESS node → cycle found. Mark DONE when all neighbors processed. Why 3 states: with 2 (visited/unvisited), we'd get false positives — reaching a VISITED node that was processed in a DIFFERENT DFS subtree is not a cycle. IN_PROGRESS specifically marks nodes in the CURRENT DFS path (potential back edge).

</details>

### Historical Evolution

Graph theory as a mathematical discipline traces its formal origin to **Leonhard Euler's 1736 paper on the Seven Bridges of Königsberg** — Euler proved it impossible to cross all seven bridges exactly once by introducing the concept of vertices and edges as abstract graph elements, founding the entire field of topology. The adjacency list and adjacency matrix representations emerged from early computer implementations: **Warshall (1962)** and **Floyd** popularized matrix-based graph algorithms, while **adjacency lists** became the standard for sparse graphs in the 1970s as researchers like **Tarjan** (1972) developed depth-first search and its applications. The memory tradeoff between these representations (list: $O(V+E)$, matrix: $O(V^2)$) was first quantified in **Knuth's 1968 analysis of graph algorithms**, and remains the fundamental decision point in production graph systems. Modern practice (post-2010) extends these representations: CSR (Compressed Sparse Row) format for efficient graph processing in libraries like NetworkX and Pregel, distributed graph processing (Pregel/GraphX) that partitions adjacency lists across machines, and graph databases (Neo4j) that use adjacency list representations optimized for traversal patterns.

---

## 🧠 Graph Representation — Memory Deep Dive

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    ADJACENCY LIST VS MATRIX - MEMORY INTERNALS                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  GRAPH:  0 ─── 1                                                                │
│          │     │                                                                │
│          3 ─── 2                                                                │
│                                                                                 │
│  ADJACENCY MATRIX MEMORY LAYOUT:                                                │
│  ─────────────────────────────────                                              │
│  int[][] matrix = new int[4][4];                                                │
│                                                                                 │
│  HEAP MEMORY:                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │ int[][] object (outer array):                                           │    │
│  │ ┌────────────────────────────────────────────────────────────────────┐  │    │
│  │ │ Header (16 bytes) │ row[0] ptr │ row[1] ptr │ row[2] ptr │ row[3] │  │     │
│  │ │                   │ 0x1000     │ 0x2000     │ 0x3000     │ 0x4000 │  │     │
│  │ └────────────────────────────────────────────────────────────────────┘  │    │
│  │                                                                         │    │
│  │ int[] row[0] at 0x1000:                                                 │    │
│  │ ┌────────────────────────────────────────────────────────────────────┐  │    │
│  │ │ Header (16 bytes) │ [0,0]=0 │ [0,1]=1 │ [0,2]=0 │ [0,3]=1 │        │  │    │
│  │ └────────────────────────────────────────────────────────────────────┘  │    │
│  │                                                                         │    │
│  │ int[] row[1] at 0x2000: ...                                            │     │
│  │ int[] row[2] at 0x3000: ...                                            │     │
│  │ int[] row[3] at 0x4000: ...                                            │     │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
│  TOTAL MEMORY:                                                                  │
│  • Outer array: 16 + 4×4 = 32 bytes                                             │
│  • Each row: 16 + 4×4 = 32 bytes                                                │
│  • Total: 32 + 4×32 = 160 bytes for 4 vertices                                  │
│                                                                                 │
│  For V vertices: O(V²) space regardless of edges!                               │
│  1000 vertices: 1000 × 1000 × 4 = 4 MB                                          │
│  1,000,000 vertices: 4 TB (impossible!)                                         │
│                                                                                 │
│                                                                                 │
│  ADJACENCY LIST MEMORY LAYOUT:                                                  │
│  ────────────────────────────────                                               │
│  List<List<Integer>> adj = new ArrayList<>();                                   │
│                                                                                 │
│  HEAP MEMORY:                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │ ArrayList (outer):                                                      │    │
│  │ ┌────────────────────────────────────────────────────────────────────┐  │    │
│  │ │ Header │ Object[] elementData → [list0, list1, list2, list3]      │  │     │
│  │ └────────────────────────────────────────────────────────────────────┘  │    │
│  │                                                                         │    │
│  │ ArrayList (vertex 0): neighbors [1, 3]                                 │     │
│  │ ┌────────────────────────────────────────────────────────────────────┐  │    │
│  │ │ Header │ Object[] → [Integer(1), Integer(3), null, ...]           │  │     │
│  │ └────────────────────────────────────────────────────────────────────┘  │    │
│  │                                                                         │    │
│  │ ArrayList (vertex 1): neighbors [0, 2]  ...                            │     │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
│  TOTAL MEMORY:                                                                  │
│  • Outer ArrayList: ~32 bytes                                                   │
│  • Each inner ArrayList: ~32 bytes + edges                                      │
│  • Each Integer: 16 bytes                                                       │
│  • Total: 32 + V×32 + E×16 = O(V + E)                                           │
│                                                                                 │
│  For sparse graph (V=1000, E=5000):                                             │
│  • Matrix: 4 MB                                                                 │
│  • List:   ~112 KB (35x smaller!)                                               │
│                                                                                 │
│  For dense graph (V=1000, E=500,000):                                           │
│  • Matrix: 4 MB                                                                 │
│  • List:   ~8 MB (matrix is smaller!)                                           │
│                                                                                 │
│  RULE: Use adjacency list for sparse graphs (E < V²/2)                          │
│        Use adjacency matrix for dense graphs or when edge lookup is frequent    │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

🔬 **Section Challenge — 🧠 Graph Representation — Memory Deep Dive**

**Challenge 1 (Reasoning):** BFS finds shortest path in unweighted graphs but not in weighted graphs. Why exactly?

<details><summary>Answer</summary>

BFS explores by 'hop count' (number of edges). Each level = one more edge away from source. All edges are treated as weight=1. In a weighted graph, the 'shortest by hop count' path may not be 'shortest by weight sum'. Example: A→B (weight 1, 1 hop) vs A→C→B (weight 0.1+0.1=0.2, 2 hops). BFS finds A→B (1 hop), Dijkstra finds A→C→B (lower total weight). BFS is optimal ONLY when all edges have equal weight.

</details>

**Challenge 2 (Design):** Detect if a directed graph has a cycle. Write the algorithm and explain why we need 3 states (not 2).

<details><summary>Answer</summary>

3 states: UNVISITED, IN_PROGRESS (currently in DFS path), DONE. DFS: mark node IN_PROGRESS before visiting neighbors. If we reach an IN_PROGRESS node → cycle found. Mark DONE when all neighbors processed. Why 3 states: with 2 (visited/unvisited), we'd get false positives — reaching a VISITED node that was processed in a DIFFERENT DFS subtree is not a cycle. IN_PROGRESS specifically marks nodes in the CURRENT DFS path (potential back edge).

</details>

## 📌 Edge List Representation

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    EDGE LIST - THE SIMPLEST GRAPH REPRESENTATION                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  STRUCTURE: Just a list of edges — each edge is (src, dst, weight)              │
│                                                                                 │
│  int[][] edges = {{0,1,5}, {0,2,3}, {1,2,1}, {2,3,7}};                          │
│  // Each row: [from, to, weight]                                                │
│                                                                                 │
│  GRAPH:       5       3       7                                                 │
│         0 ------→ 1     0 ----→ 2 ----→ 3                                       │
│                    ↑    1                                                       │
│                    └────┘                                                       │
│                                                                                 │
│  MEMORY: O(E) — just the edges, nothing more                                    │
│                                                                                 │
│  ─────────────────────────────────────────────────────────────────────────────  │
│                                                                                 │
│  WHEN TO USE EDGE LIST:                                                         │
│  ✅ Bellman-Ford algorithm (iterates over ALL edges each relaxation)             │
│  ✅ Kruskal's MST (sort edges by weight, process in order)                       │
│  ✅ When you just need to store/sort edges                                       │
│  ✅ Problems that give input as edge list directly                               │
│                                                                                 │
│  WHEN NOT TO USE:                                                               │
│  ❌ Need to find neighbors of a vertex → O(E) scan each time!                    │
│  ❌ BFS/DFS (adjacency list is much better)                                      │
│  ❌ Need edge existence check (adjacency matrix is O(1))                         │
│                                                                                 │
│  ─────────────────────────────────────────────────────────────────────────────  │
│                                                                                 │
│  COMPARISON OF ALL THREE:                                                       │
│  ┌──────────────────┬──────────────┬────────────────┬──────────────────────┐    │
│  │ Operation        │ Adj Matrix   │ Adj List       │ Edge List            │    │
│  ├──────────────────┼──────────────┼────────────────┼──────────────────────┤    │
│  │ Space            │ O(V²)       │ O(V + E)       │ O(E)                 │     │
│  │ Add edge         │ O(1)         │ O(1)           │ O(1)                 │    │
│  │ Edge exists?     │ O(1)         │ O(degree)      │ O(E)                 │    │
│  │ All neighbors    │ O(V)         │ O(degree)      │ O(E)                 │    │
│  │ All edges        │ O(V²)       │ O(V + E)       │ O(E)                 │     │
│  │ Sort edges       │ O(V² log V) │ O(E log E)     │ O(E log E)           │     │
│  └──────────────────┴──────────────┴────────────────┴──────────────────────┘    │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

```java
// EDGE LIST — Java Implementation
// Simple: just an array of [src, dst, weight]

// Usage in Bellman-Ford:
int[][] edges = {{0,1,5}, {0,2,3}, {1,2,1}, {2,3,7}};
int V = 4;
int[] dist = new int[V];
Arrays.fill(dist, Integer.MAX_VALUE);
dist[0] = 0;

for (int i = 0; i < V - 1; i++) {          // V-1 relaxation rounds
    for (int[] edge : edges) {               // iterate ALL edges
        int u = edge[0], v = edge[1], w = edge[2];
        if (dist[u] != Integer.MAX_VALUE && dist[u] + w < dist[v])
            dist[v] = dist[u] + w;
    }
}

// Usage in Kruskal's MST:
Arrays.sort(edges, (a, b) -> a[2] - b[2]);  // sort by weight
// Then process with Union-Find...
```

## 🔬 BFS and DFS — Internal Operations

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    BFS VS DFS - MEMORY AND CPU BEHAVIOR                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  GRAPH:    0 ─── 1 ─── 2                                                        │
│            │     │                                                              │
│            3 ─── 4                                                              │
│                                                                                 │
│  BFS USING QUEUE:                                                               │
│  ─────────────────                                                              │
│  Queue<Integer> queue = new LinkedList<>();                                     │
│  queue.offer(0);                                                                │
│  visited[0] = true;                                                             │
│                                                                                 │
│  QUEUE EVOLUTION:                                                               │
│  Step 1: queue = [0], visit 0, add neighbors                                    │
│  Step 2: queue = [1, 3], visit 1                                                │
│  Step 3: queue = [3, 2, 4], visit 3                                             │
│  Step 4: queue = [2, 4], visit 2                                                │
│  Step 5: queue = [4], visit 4                                                   │
│  Step 6: queue = [], done!                                                      │
│                                                                                 │
│  Visit order: 0, 1, 3, 2, 4 (level by level)                                    │
│                                                                                 │
│  MEMORY: Queue holds O(V) nodes worst case (wide graph)                         │
│                                                                                 │
│                                                                                 │
│  DFS USING STACK (or recursion):                                                │
│  ───────────────────────────────                                                │
│  Stack<Integer> stack = new Stack<>();                                          │
│  stack.push(0);                                                                 │
│                                                                                 │
│  STACK EVOLUTION:                                                               │
│  Step 1: stack = [0], visit 0, push neighbors                                   │
│  Step 2: stack = [3, 1], visit 1                                                │
│  Step 3: stack = [3, 4, 2], visit 2 (deepest first!)                            │
│  Step 4: stack = [3, 4], visit 4                                                │
│  Step 5: stack = [3], visit 3                                                   │
│  Step 6: stack = [], done!                                                      │
│                                                                                 │
│  Visit order: 0, 1, 2, 4, 3 (goes deep first)                                   │
│                                                                                 │
│  MEMORY: Stack holds O(V) nodes worst case (deep graph)                         │
│                                                                                 │
│                                                                                 │
│  CPU CACHE BEHAVIOR:                                                            │
│  ────────────────────                                                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │ BFS:                                                                    │    │
│  │ • Visits nearby nodes first                                            │     │
│  │ • Better for graphs with spatial locality                              │     │
│  │ • Queue operations: offer() and poll() - O(1)                         │      │
│  │ • LinkedList queue: Poor cache locality (scattered nodes)             │      │
│  │ • ArrayDeque queue: Better cache locality (contiguous array)          │      │
│  │                                                                        │     │
│  │ DFS:                                                                    │    │
│  │ • Goes deep, may jump around in memory                                 │     │
│  │ • Recursive DFS has function call overhead                            │      │
│  │ • Iterative DFS with ArrayDeque is cache-friendlier                   │      │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
│                                                                                 │
│  RECOMMENDATION:                                                                │
│  ───────────────                                                                │
│  • Use ArrayDeque instead of LinkedList for Queue/Stack                         │
│  • ArrayDeque is 2-3x faster due to better cache locality                       │
│                                                                                 │
│  // Prefer this:                                                                │
│  Queue<Integer> queue = new ArrayDeque<>();                                     │
│  Deque<Integer> stack = new ArrayDeque<>();                                     │
│                                                                                 │
│  // Over this:                                                                  │
│  Queue<Integer> queue = new LinkedList<>();  // Slower!                         │
│  Stack<Integer> stack = new Stack<>();       // Slower + synchronized!          │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 🔬 Shortest Path Algorithms — Internal Comparison

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    DIJKSTRA VS BELLMAN-FORD VS FLOYD-WARSHALL                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  DIJKSTRA'S ALGORITHM (Single source, non-negative weights):                    │
│  ──────────────────────────────────────────────────────────                     │
│  Time: O((V + E) log V) with binary heap                                        │
│  Space: O(V) for distance array + O(V) for priority queue                       │
│                                                                                 │
│  INTERNAL WORKING:                                                              │
│  PriorityQueue<int[]> pq = new PriorityQueue<>((a,b) -> a[1] - b[1]);           │
│                                                                                 │
│  • pq.offer(): O(log V) - bubble up in heap                                     │
│  • pq.poll(): O(log V) - bubble down in heap                                    │
│  • Each edge relaxed once: E times                                              │
│  • Total: O(E log V)                                                            │
│                                                                                 │
│  WHY NEGATIVE WEIGHTS BREAK DIJKSTRA:                                           │
│  Once a node is "done" (popped from PQ), Dijkstra assumes it won't improve      │
│  Negative edge could make it shorter later → incorrect result!                  │
│                                                                                 │
│                                                                                 │
│  BELLMAN-FORD (Single source, handles negative weights):                        │
│  ─────────────────────────────────────────────────────────                      │
│  Time: O(V × E)                                                                 │
│  Space: O(V) for distance array                                                 │
│                                                                                 │
│  INTERNAL WORKING:                                                              │
│  for (int i = 0; i < V - 1; i++) {           // V-1 iterations                  │
│      for (int[] edge : edges) {              // All E edges                     │
│          int u = edge[0], v = edge[1], w = edge[2];                             │
│          if (dist[u] + w < dist[v])                                             │
│              dist[v] = dist[u] + w;          // Relax                           │
│      }                                                                          │
│  }                                                                              │
│                                                                                 │
│  WHY V-1 ITERATIONS?                                                            │
│  • Shortest path has at most V-1 edges                                          │
│  • Each iteration guarantees at least one more correct distance                 │
│  • After V-1, all shortest paths found (if no negative cycle)                   │
│                                                                                 │
│  NEGATIVE CYCLE DETECTION:                                                      │
│  Run one more iteration - if any distance improves → negative cycle exists!     │
│                                                                                 │
│                                                                                 │
│  FLOYD-WARSHALL (All pairs shortest paths):                                     │
│  ──────────────────────────────────────────                                     │
│  Time: O(V³)                                                                    │
│  Space: O(V²) for distance matrix                                               │
│                                                                                 │
│  INTERNAL WORKING:                                                              │
│  for (int k = 0; k < V; k++) {               // Intermediate vertex             │
│      for (int i = 0; i < V; i++) {           // Source                          │
│          for (int j = 0; j < V; j++) {       // Destination                     │
│              dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j]);             │
│          }                                                                      │
│      }                                                                          │
│  }                                                                              │
│                                                                                 │
│  KEY INSIGHT: After iteration k, dist[i][j] contains shortest path              │
│  from i to j using only vertices 0 to k as intermediates                        │
│                                                                                 │
│                                                                                 │
│  COMPARISON TABLE:                                                              │
│  ┌────────────────┬──────────────┬────────────┬────────────┬─────────────────┐  │
│  │ Algorithm      │ Time         │ Space      │ Neg. Edges │ Use Case        │  │
│  ├────────────────┼──────────────┼────────────┼────────────┼─────────────────┤  │
│  │ Dijkstra       │ O(E log V)   │ O(V)       │ No         │ Single source   │  │
│  │ Bellman-Ford   │ O(V × E)     │ O(V)       │ Yes        │ Neg. edges      │  │
│  │ Floyd-Warshall │ O(V³)        │ O(V²)      │ Yes        │ All pairs       │  │
│  │ BFS (unweight) │ O(V + E)     │ O(V)       │ N/A        │ Unweighted      │  │
│  └────────────────┴──────────────┴────────────┴────────────┴─────────────────┘  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📐 Modeling Problems as Graphs (Skiena's Approach)

In _The Algorithm Design Manual_, Steven Skiena emphasizes that the hardest part of graph algorithms isn't the algorithm itself (BFS/DFS/Dijkstra)—it's **recognizing that the problem is a graph problem** and defining the vertices and edges correctly.

### The 3 Core Questions to Ask:

1. **What are the Vertices?** (States, objects, configurations)
2. **What are the Edges?** (Transitions, relationships, dependencies)
3. **Are the edges Directed or Undirected? Weighted or Unweighted?**

### Classic Modeling Archetypes

#### 1. The State Space Graph (Implicit Graphs)

**Problem:** Word Ladder (transform "hit" to "cog" changing one letter at a time).
**Model:**

- **Vertices:** Every possible valid word in the dictionary.
- **Edges:** An undirected, unweighted edge connects two words if they differ by exactly one character.
- **Algorithm:** BFS to find the shortest path (minimum transitions).
- _Key Insight:_ You don't build the entire graph upfront! You generate neighbors dynamically (Implicit Graph).

#### 2. The Dependency Graph

**Problem:** Course Schedule (take courses given prerequisites).
**Model:**

- **Vertices:** The courses.
- **Edges:** A directed edge from Course A to Course B if A is a prerequisite for B.
- **Algorithm:** Topological Sort (DFS or Kahn's). Cycle detection (if cycle exists, graduation is impossible).

#### 3. The Grid Graph

**Problem:** Number of Islands, Maze Solving.
**Model:**

- **Vertices:** Each `(row, col)` cell in the 2D matrix.
- **Edges:** Implicit undirected edges connecting a cell to its Up, Down, Left, Right neighbors (if they are valid/passable).
- **Algorithm:** BFS/DFS.
- _Key Insight:_ A 2D matrix _is_ a graph. You don't need an Adjacency List to traverse it; just use a `int[][] directions = {{0,1}, {1,0}, {0,-1}, {-1,0}}` array.

#### 4. The Compatibility Graph

**Problem:** Bipartite Matching (Assigning workers to jobs, scheduling exams without conflicts).
**Model:**

- **Vertices:** Entities (e.g., Workers and Jobs).
- **Edges:** An undirected edge if Worker A can do Job B.
- **Algorithm:** Bipartite Graph checking (Coloring) or Maximum Flow.

---

## When It Breaks -- Graph Internals

### 1. HashMap Adjacency List — Non-Deterministic Traversal Order
**What breaks**: `Map<Integer, Set<Integer>> adj` with `HashSet` for neighbors. BFS/DFS iteration order is non-deterministic between JVM runs (hash seeds differ since Java 8). Tests that assert a specific traversal order pass locally and fail in CI.
**Fix**: Use `LinkedHashSet` to preserve insertion order, or `TreeSet` for sorted order. For competitive programming: use `List<Integer>` (insertion order, fastest iteration).

### 2. Directed vs Undirected — Adding Edge Only Once
**What breaks**: For an undirected graph, forgetting to add the reverse edge: `adj.get(u).add(v)` without `adj.get(v).add(u)`. Result: a directed graph masquerading as undirected. BFS from u reaches v, but BFS from v doesn't reach u.
**Debug signal**: If `|edges from A| != |edges from B|` for a "symmetric" graph, one direction is missing.

### 3. DFS Stack Overflow on Dense Graphs
**What breaks**: Recursive DFS on a path graph with 10⁵ nodes causes `StackOverflowError` (JVM default stack ~8k–15k frames). Happens specifically on star graphs, path graphs, or any graph with high depth.
**Fix**: Convert to iterative DFS with an explicit `ArrayDeque<Integer>` stack. The stack mirrors the recursion stack but lives on the heap.

### 4. Forgetting to Initialize All Nodes in the Adjacency List
**What breaks**: Calling `adj.get(node)` for an isolated node (no edges) returns `null` if you only initialized nodes that appear in edge lists. `NullPointerException` on `.size()` or `.iterator()`.
**Fix**: Always pre-initialize: `for (int i = 0; i < n; i++) adj.add(new ArrayList<>())` before adding edges.

---

## Brute Force → Optimal: Graph Traversal

### Problem: Find if Path Exists Between Two Nodes

**Brute Force — O(V! ) try all permutations:**
Enumerate every possible sequence of nodes, check if any forms a valid path. Obviously impractical.

**Naive — O(V+E) DFS, risk of infinite loop without visited set:**
```java
boolean dfs(int u, int target, boolean[] visited, List<List<Integer>> adj) {
    if (u == target) return true;
    visited[u] = true;
    for (int v : adj.get(u))
        if (!visited[v] && dfs(v, target, visited, adj)) return true;
    return false;
}
```

**Optimal for connectivity — O(α(n)) Union-Find:**
Build DSU once from all edges, then answer `connected(src, dst)` in O(1) per query after O(E·α(V)) build. For repeated queries, Union-Find dominates BFS/DFS by 10–100× on query throughput.


---

## Reality Check

**"Adjacency list and adjacency matrix give the same BFS/DFS results"** → Same traversal order with deterministic neighbor ordering. But time complexity differs: BFS/DFS with adjacency list = O(V + E). BFS/DFS with adjacency matrix = O(V²) because you always scan all V possible neighbors even if the vertex has degree 2. For sparse graphs (E << V²), adjacency list is dramatically faster. For dense graphs (E ≈ V²), adjacency matrix is equivalent and often faster due to cache-friendly sequential access.

**"'Visited' array size should be V (number of vertices)"** → Yes for dense graphs with vertices labeled 0..V-1. For graphs with string/arbitrary keys, use a HashSet as visited. For multi-state problems (coloring graph nodes 0=unvisited, 1=in-progress, 2=done to detect back edges in directed graph cycle detection), use an int array. For problems where you visit the same node multiple times with different state (e.g., 0/1 BFS — visited[node][fuel_remaining]), you need a 2D visited array or a set of (node, state) tuples.

**"Adding an edge to an undirected graph in adjacency list requires one line"** → Undirected edges require TWO insertions: `adj[u].add(v)` AND `adj[v].add(u)`. Forgetting the second insert is a common bug that creates a directed graph instead of undirected. For weighted undirected graphs: both `adj[u].add((v, w))` and `adj[v].add((u, w))`. For directed graphs: only `adj[u].add(v)`. Always check after building the graph: sum of all adjacency list sizes should equal 2E for undirected, E for directed.

**"Disconnected graphs break standard BFS/DFS"** → Standard BFS/DFS from a single source only visits the source's connected component. For disconnected graphs, wrap the BFS/DFS in a loop: `for each vertex v: if not visited[v]: BFS(v)`. This pattern processes all connected components. Problems where this matters: counting connected components, detecting cycles in the full graph (not just from one source), finding all nodes in any component. Not wrapping the outer loop is a common bug for disconnected graph problems.

**"Cycle detection in directed graphs is the same as in undirected graphs"** → Different algorithms for different properties. Undirected: BFS/DFS — mark visited, if you reach a visited node that isn't the parent → cycle. Directed: DFS with 3-color marking (white=unvisited, gray=in-progress, black=done) — if you reach a gray node → back edge → cycle. The parent-check trick for undirected graphs doesn't work for directed graphs: a directed graph with edges A→B, A→C, B has no cycle, but A→B→C and A→C→... — the directed reachability is different. Union-Find detects cycles in undirected only.
