**Navigation**: [< Previous Chapter](05b_Graphs_Internals.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next Chapter >](05d_Graphs_Advanced_Algos.md)
🧠 **Mental Model**: See [Graph & Tree Thinking](../14_Mental_Models/03_Graph_Tree_Thinking.md) — BFS/DFS decision framework and cycle detection

---

## 🔗 JIT Connection — When You Need This

**Arrived here from a graph or tree problem? Use this decision table:**

### Production Reality

**BFS/DFS production debugging — common failure causes:** (1) **StackOverflowError on DFS** for graphs with depth > ~10,000 on JVM default stack (~1MB) — switch to iterative BFS with an explicit `ArrayDeque` queue, or increase stack size with `-Xss2m`. (2) **Visited-set race condition in concurrent BFS** — multiple threads processing the same graph simultaneously corrupt a shared `HashMap` visited set — use `ConcurrentHashMap` or an atomic `boolean[]` bitmask for thread-safe state. (3) **O(V+E) memory pressure on large graphs** — a graph with 10M nodes and 50M edges needs ~1GB for adjacency lists in Java; process in streaming/batch mode or use graph compression for memory-constrained production environments.

**Recursion depth scalability — BFS vs DFS trade-off:** BFS with an explicit queue never overflows the call stack regardless of graph depth — use it for deep graphs (e.g., linked structure trees with 100K+ levels). DFS is elegant but trusts the JVM call stack; on graphs deeper than ~10,000 (possible in pathological input or synthetic test cases), it throws `StackOverflowError` with no useful stack trace. Production systems should default to iterative BFS for untrusted or deep graph input.

**Scalability — BFS queue size as memory signal:** BFS's queue size is bounded by the graph's maximum frontier width, not depth. For a balanced binary tree, the maximum queue size is n/2 (the bottom level). For a star graph, it is n-1 (all leaves queued at once). Monitoring queue size at runtime can detect graph structure anomalies — an unexpectedly large queue may indicate a supernode in a scale-free network (e.g., social graph with celebrity nodes having millions of edges).

---

## 🎓 University Proof Corner

> **MIT 6.006 L13–L14 / KTH DD1352 / TU Munich IN0007 layer** — Why BFS computes shortest paths and why Dijkstra is correct; both proved by induction on discovery order.

### BFS Shortest-Path Correctness (Induction on Distance d)

**Claim**: BFS assigns the correct shortest-path distance `δ(s, v)` to every reachable vertex `v`.

**Proof by induction** on `d = δ(s, v)`:
- **Base (d=0)**: `δ(s,s) = 0`. BFS sets `dist[s] = 0` at initialisation. ✓
- **Inductive step**: Assume every vertex at distance `< d` gets the correct label. A vertex `v` at distance `d` has some predecessor `u` at distance `d-1`. By hypothesis `dist[u] = d-1`. BFS processes `u` and sets `dist[v] = d-1+1 = d` — the first time `v` is reached. Any other path to `v` has length ≥ d, so BFS cannot assign a shorter label. ✓
- **Termination**: BFS visits vertices in non-decreasing distance order (FIFO queue property). Every reachable vertex is eventually dequeued. ✓

### Dijkstra Correctness (Greedy + Induction)

**Claim**: When a vertex `u` is extracted from the min-heap, `dist[u] = δ(s, u)`.

**Proof by contradiction**: Suppose `u` is the first vertex extracted with `dist[u] > δ(s, u)`. Then some shorter path `s → x → y → ... → u` exists where `x` is the last visited vertex before `y` (unvisited). At the time we extracted `u`, `dist[x] = δ(s, x)` (x was extracted correctly). Edge relaxation set `dist[y] ≤ dist[x] + w(x,y) = δ(s,y)`. Since `y` is on the shorter path to `u` and all edge weights ≥ 0, `dist[y] ≤ δ(s,u) < dist[u]` — so Dijkstra would have extracted `y` before `u`. Contradiction. ✓

**Why negative edges break Dijkstra**: A negative-weight edge can decrease a "finalised" distance, invalidating the induction hypothesis. Use Bellman-Ford (O(VE)) for negative weights.

> Full proofs with worked examples: [A1 — Algorithm Correctness](A1_Correctness_Proofs.md) (Section 7: BFS + Dijkstra)

---

| Problem Signal                   | Algorithm to use                     | Time Complexity |
| -------------------------------- | ------------------------------------ | --------------- |
| Shortest path, unweighted        | **BFS** (level-by-level)             | O(V+E)          |
| Shortest path, weighted (+ve)    | **Dijkstra** (min-heap)              | O((V+E) log V)  |
| Detect cycle in directed graph   | **DFS** (WHITE/GRAY/BLACK)           | O(V+E)          |
| Topological sort (prerequisites) | **Kahn's BFS** or DFS postorder      | O(V+E)          |
| Find all islands / components    | **DFS or BFS** from each unvisited   | O(V+E)          |
| Minimum spanning tree            | **Kruskal** (sort edges) or **Prim** | O(E log E)      |

**BFS vs DFS in one line:**

```
BFS = "Shortest path / minimum steps"    → Queue  → O(V+E)
DFS = "Exists? / Cycles / Components"   → Stack/Recursion → O(V+E)
```

🔗 **Jump to practice:** [Graphs PS](../05_Problem_Solving/10_Graphs.md) | [Trees PS](../05_Problem_Solving/09_Trees.md)
📋 **All Patterns Hub:** [00_PATTERN_MASTER_GUIDE.md](../04_Patterns_Templates/00_PATTERN_MASTER_GUIDE.md)

---

# 🕸️ Part 5: Graph Fundamentals

## Complete Understanding of Graphs

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    GRAPHS - COMPLETE UNDERSTANDING                           ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHAT IS A GRAPH?                                                             │
├──────────────────────────────────────────────────────────────────────────────┤
│ A graph G = (V, E) consists of:                                              │
│ • V = Set of VERTICES (nodes)                                                │
│ • E = Set of EDGES (connections between vertices)                            │
│                                                                              │
│ Unlike trees, graphs can have:                                               │
│ • CYCLES (paths that return to starting point)                               │
│ • Multiple paths between any two nodes                                       │
│ • Disconnected components                                                    │
│                                                                              │
│ HISTORY: Graph theory started with Euler's "Seven Bridges of Königsberg"     │
│ problem in 1736 - can you cross all bridges exactly once?                    │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHAT PROBLEMS DO GRAPHS SOLVE?                                               │
├──────────────────────────────────────────────────────────────────────────────┤
│ CORE PROBLEM: Modeling RELATIONSHIPS between entities                        │
│                                                                              │
│ REAL-WORLD EXAMPLES:                                                         │
│ • Social Networks: People = nodes, Friendships = edges                       │
│   "Find friends of friends" = BFS from a person                              │
│                                                                              │
│ • Navigation/Maps: Intersections = nodes, Roads = edges                      │
│   "Shortest route" = Dijkstra's algorithm                                    │
│                                                                              │
│ • Internet: Routers = nodes, Connections = edges                             │
│   "Best path for data" = Routing algorithms                                  │
│                                                                              │
│ • Dependencies: Tasks = nodes, Prerequisites = edges                         │
│   "Order to complete tasks" = Topological sort                               │
│                                                                              │
│ • Games: Game states = nodes, Moves = edges                                  │
│   "Can we win?" = Graph search                                               │
│                                                                              │
│ • Molecular structures: Atoms = nodes, Bonds = edges                         │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHY GRAPHS INSTEAD OF OTHER DATA STRUCTURES?                                 │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ ┌────────────────────────┬───────────────────────────────────────────────┐   │
│ │ Structure              │ Relationship Type                             │   │
│ ├────────────────────────┼───────────────────────────────────────────────┤   │
│ │ Array                  │ Sequential, by position                       │   │
│ │ Tree                   │ Hierarchical, parent-child                    │   │
│ │ Graph                  │ ANY relationship! ⭐ Most flexible           │     │
│ └────────────────────────┴───────────────────────────────────────────────┘   │
│                                                                              │
│ Trees are actually SPECIAL CASES of graphs (connected, acyclic)!             │
│                                                                              │
│ USE GRAPH WHEN:                                                              │
│ • Relationships aren't hierarchical (peer-to-peer, many-to-many)             │
│ • Cycles are possible (road networks, social connections)                    │
│ • Need to model complex dependencies                                         │
│ • Multiple paths between entities exist                                      │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHEN TO USE WHICH REPRESENTATION?                                            │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ ADJACENCY LIST:                                                              │
│ ┌───────────────────────────────────────────────────────────────┐            │
│ │ USE WHEN: Sparse graph (E << V²)                              │            │
│ │ Space: O(V + E)                                               │            │
│ │ Check edge exists: O(degree)                                  │            │
│ │ Iterate neighbors: O(degree) ✅ FAST                          │             │
│ │ BEST FOR: Most real-world graphs (social networks, roads)     │            │
│ └───────────────────────────────────────────────────────────────┘            │
│                                                                              │
│ ADJACENCY MATRIX:                                                            │
│ ┌───────────────────────────────────────────────────────────────┐            │
│ │ USE WHEN: Dense graph (E ≈ V²) or need O(1) edge lookup       │            │
│ │ Space: O(V²)                                                  │            │
│ │ Check edge exists: O(1) ✅ FAST                               │             │
│ │ Iterate neighbors: O(V)                                       │            │
│ │ BEST FOR: Small dense graphs, weighted graphs, Floyd-Warshall │            │
│ └───────────────────────────────────────────────────────────────┘            │
│                                                                              │
│ RULE OF THUMB: Use adjacency LIST unless you have specific reason not to!    │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ DIFFICULTIES & COMMON MISTAKES                                               │
├──────────────────────────────────────────────────────────────────────────────┤
│ 1. INFINITE LOOPS (Forgetting visited check):                                │
│    Graphs have cycles! ALWAYS track visited nodes.                           │
│    Solution: boolean[] visited or Set<Integer> visited                       │
│                                                                              │
│ 2. DIRECTED VS UNDIRECTED CONFUSION:                                         │
│    Undirected: Add edge both ways (A→B AND B→A)                              │
│    Directed: Add edge one way only                                           │
│                                                                              │
│ 3. 0-INDEXED VS 1-INDEXED:                                                   │
│    Problem gives "1 to N" nodes but array is 0-indexed                       │
│    Solution: Either use size N+1 or subtract 1 from all indices              │
│                                                                              │
│ 4. DISCONNECTED COMPONENTS:                                                  │
│    Single DFS/BFS won't visit all nodes if graph disconnected!               │
│    Solution: Loop through all nodes, start new traversal if unvisited        │
│                                                                              │
│ 5. NOT HANDLING WEIGHTS:                                                     │
│    BFS gives shortest path in UNWEIGHTED graphs only                         │
│    For weighted: Use Dijkstra (non-negative) or Bellman-Ford                 │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ EXPECTED OUTPUTS & COMPLEXITY                                                │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ TRAVERSAL COMPLEXITY (V = vertices, E = edges):                              │
│ • DFS: O(V + E) time, O(V) space (visited + stack)                           │
│ • BFS: O(V + E) time, O(V) space (visited + queue)                           │
│                                                                              │
│ COMMON ALGORITHM COMPLEXITIES:                                               │
│ ┌────────────────────────────┬──────────────────────┬────────────────────┐   │
│ │ Algorithm                  │ Time                 │ Space              │   │
│ ├────────────────────────────┼──────────────────────┼────────────────────┤   │
│ │ DFS/BFS                    │ O(V + E)             │ O(V)               │   │
│ │ Dijkstra (binary heap)     │ O((V+E) log V)       │ O(V)               │   │
│ │ Bellman-Ford               │ O(V × E)             │ O(V)               │   │
│ │ Floyd-Warshall             │ O(V³)                │ O(V²)              │   │
│ │ Topological Sort           │ O(V + E)             │ O(V)               │   │
│ │ Kruskal's MST              │ O(E log E)           │ O(V)               │   │
│ │ Prim's MST                 │ O((V+E) log V)       │ O(V)               │   │
│ │ Cycle Detection            │ O(V + E)             │ O(V)               │   │
│ └────────────────────────────┴──────────────────────┴────────────────────┘   │
│                                                                              │
│ TYPICAL OUTPUTS:                                                             │
│ • Path finding: List of nodes from source to destination                     │
│ • Shortest path: Distance value or path + distance                           │
│ • Cycle detection: Boolean (exists?) or List (the cycle)                     │
│ • Topological sort: Ordered list of all vertices                             │
│ • Connected components: Number of components or list of component nodes      │
└──────────────────────────────────────────────────────────────────────────────┘
```

🔬 **Section Challenge — Complete Understanding of Graphs**

**Challenge 1 (Reasoning):** BFS finds shortest path in unweighted graphs but not in weighted graphs. Why exactly?

## Graph Representations

```
ADJACENCY LIST (Preferred for sparse graphs):

Graph:
    0 --- 1
    |     |
    3 --- 2

List representation:
0: [1, 3]
1: [0, 2]
2: [1, 3]
3: [0, 2]

Code:
List<List<Integer>> graph = new ArrayList<>();
// Add neighbors for each node
graph.get(0).add(1);  // Edge 0-1
graph.get(0).add(3);  // Edge 0-3
...

ADJACENCY MATRIX (For dense graphs):

    0  1  2  3
0 [ 0  1  0  1 ]
1 [ 1  0  1  0 ]
2 [ 0  1  0  1 ]
3 [ 1  0  1  0 ]

1 = edge exists, 0 = no edge
```

🔬 **Section Challenge — Graph Representations**

**Challenge 1 (Representation Tradeoff):** A social network has 10^9 users (vertices), each with average 200 friends (edges). **Who** chooses adjacency list vs. adjacency matrix? **When** would a matrix be appropriate? **What** is the exact memory cost of each for this graph?

<details><summary>Answer</summary>

**Adjacency List for this graph:** 10^9 users × 200 friends × 8 bytes (pointer) = ~1.6 TB — large but feasible with distributed storage. Each `List<Integer>` per vertex stores only EXISTING edges. **Adjacency Matrix:** 10^9 × 10^9 = 10^18 bits minimum = 125 petabytes. Completely infeasible. **When matrix is appropriate:** Dense graphs where `E ≈ V²` (almost all vertex pairs connected), or when you need O(1) edge existence checks: `matrix[u][v] == 1`. Examples: small graphs (<1000 nodes), complete graphs, routing tables in SDN. **Rule of thumb:** Sparse (E << V²) → adjacency list. Dense (E ≈ V²) or small V → adjacency matrix. **Space complexity:** List = O(V + E). Matrix = O(V²). Add/remove edge: List O(degree), Matrix O(1). Check edge existence: List O(degree), Matrix O(1).

</details>

## Graph Types

```
UNDIRECTED: Edges have no direction (friendship)
DIRECTED: Edges have direction (following on Twitter)
WEIGHTED: Edges have values (road distances)
UNWEIGHTED: All edges equal
CYCLIC: Contains cycles
ACYCLIC: No cycles (DAG = Directed Acyclic Graph)
CONNECTED: All nodes reachable from any node
```

---

🔬 **Section Challenge — Graph Types**

**Challenge 1 (DAG Cycle Detection):** You receive a directed graph that's SUPPOSED to be a DAG (dependency graph). **Who** detects the cycle? **When** does DFS detect a cycle in a directed graph differently than in an undirected graph? **What** makes a "back edge" the definitive cycle indicator?

<details><summary>Answer</summary>

**Who detects:** DFS with a 3-color marking (WHITE=unvisited, GRAY=in current DFS path, BLACK=fully processed). **When DFS detects a directed cycle:** When it encounters a GRAY node (a node already in the current DFS call stack). A GRAY node means we've found a path from that node back to itself — a cycle. **Why undirected graphs differ:** In undirected graphs, `A-B` means both `A→B` and `B→A` edges exist. Seeing `B` from `A` when `B` is already visited doesn't mean a cycle — it's just the tree edge in reverse. You must track `parent` and only flag a cycle if the neighbor is visited AND is NOT the parent. **Back edge = cycle:** In DFS traversal, a "back edge" goes from a node to one of its ancestors in the DFS tree. In directed graphs: back edge = discovered gray ancestor = cycle. **Topological sort only works on DAGs** — cycle detection is the prerequisite check before topological sort.

</details>

# 🕸️ Part 6: Graph Traversals

## DFS vs BFS - When to Use Which

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    DFS vs BFS - COMPLETE COMPARISON                          ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────────┐
│ DFS (Depth-First Search)                                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│ STRATEGY: Go as DEEP as possible first, then backtrack                       │
│                                                                              │
│ USE DFS WHEN:                                                                │
│ • Finding ANY path (not necessarily shortest)                                │
│ • Detecting cycles                                                           │
│ • Topological sorting (DAG)                                                  │
│ • Finding connected components                                               │
│ • Solving mazes/puzzles (explore all options)                                │
│ • Problem requires backtracking                                              │
│ • Tree problems (most tree traversals are DFS)                               │
│                                                                              │
│ IMPLEMENTATION: Stack (explicit or recursion call stack)                     │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ BFS (Breadth-First Search)                                                   │
├──────────────────────────────────────────────────────────────────────────────┤
│ STRATEGY: Visit all neighbors at current level before going deeper           │
│                                                                              │
│ USE BFS WHEN:                                                                │
│ • Finding SHORTEST path in unweighted graph ⭐                                │
│ • Level-order traversal needed                                               │
│ • Finding nodes at distance k                                                │
│ • "Minimum steps/moves" problems                                             │
│ • Spreading/flooding problems (infection, fire)                              │
│ • Finding nearest X                                                          │
│                                                                              │
│ IMPLEMENTATION: Queue (FIFO)                                                 │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ QUICK DECISION TABLE                                                         │
├──────────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────┬───────────────────────────────────┐  │
│ │ Problem Type                        │ Use                               │  │
│ ├─────────────────────────────────────┼───────────────────────────────────┤  │
│ │ Shortest path (unweighted)          │ BFS                               │  │
│ │ Shortest path (weighted)            │ Dijkstra/Bellman-Ford             │  │
│ │ Any path exists?                    │ DFS (simpler) or BFS              │  │
│ │ All paths                           │ DFS with backtracking             │  │
│ │ Cycle detection                     │ DFS                               │  │
│ │ Topological sort                    │ DFS (or Kahn's BFS)               │  │
│ │ Connected components                │ DFS or BFS                        │  │
│ │ Level/distance from source          │ BFS                               │  │
│ │ Island counting                     │ DFS or BFS                        │  │
│ │ Word ladder (transformation)        │ BFS                               │  │
│ └─────────────────────────────────────┴───────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

## DFS (Depth-First Search)

```
GO DEEP first, then backtrack!

Start at node, visit neighbor, visit neighbor's neighbor...
Until dead end, then backtrack.

    0 --- 1
    |     |
    3 --- 2

DFS from 0: 0 → 1 → 2 → 3 (one possible order)

USES:
- Path finding
- Cycle detection
- Topological sort
- Connected components
```

```java
// RECURSIVE DFS
public void dfs(int node, List<List<Integer>> graph, boolean[] visited) {
    visited[node] = true;
    System.out.print(node + " ");

    for (int neighbor : graph.get(node)) {
        if (!visited[neighbor]) {
            dfs(neighbor, graph, visited);
        }
    }
}

// ITERATIVE DFS (using stack)
public void dfsIterative(int start, List<List<Integer>> graph) {
    boolean[] visited = new boolean[graph.size()];
    Stack<Integer> stack = new Stack<>();

    stack.push(start);

    while (!stack.isEmpty()) {
        int node = stack.pop();

        if (!visited[node]) {
            visited[node] = true;
            System.out.print(node + " ");

            for (int neighbor : graph.get(node)) {
                if (!visited[neighbor]) {
                    stack.push(neighbor);
                }
            }
        }
    }
}

// TIME: O(V + E) where V = vertices, E = edges
// SPACE: O(V) for visited array and stack/recursion
```

🔬 **Section Challenge — DFS (Depth-First Search)**

**Challenge 1 (DFS Stack Overflow Risk):** DFS on a linked-list-shaped graph of 10^6 nodes (each node connected to next). **Who** throws `StackOverflowError`? **When** does recursive DFS fail vs. iterative DFS? **What** stack size would Java need to not overflow?

<details><summary>Answer</summary>

**Who throws:** The JVM's recursive DFS call. A linked-list graph causes DFS to recurse 10^6 levels deep. Each Java stack frame uses ~200-500 bytes. 10^6 × 200 bytes = 200 MB of stack. Default JVM thread stack size is 512KB-1MB → `StackOverflowError` at ~5000-8000 depth. **When recursive DFS fails:** Any graph with depth > ~8000 nodes in Java's default stack. Binary trees are typically safe (log2(10^9) = 30 levels). Graphs can have arbitrary depth. **When iterative DFS succeeds:** Always. Iterative DFS uses an explicit `Deque<Node>` on the HEAP (not call stack). Heap can hold hundreds of MB. The iterative version is equivalent to recursive DFS but uses heap memory. **Java stack size:** Pass `-Xss200m` to JVM to get 200MB stack per thread. This is memory-wasteful — better to use iterative DFS. **Rule:** For graph algorithms on arbitrary graphs in production, always use iterative BFS/DFS.

</details>
<details><summary>Answer</summary>

lo=0,hi=4 → mid=2(val=5): 5<6 → lo=3. lo=3,hi=4 → mid=3(val=7): 7>6 → hi=2. lo(3)>hi(2): loop ends, return -1 (not found). Key insight: lo overtakes hi — this is the standard termination condition. `lo` ends at the insertion point where 6 would go.

</details>

**Challenge 2 (Design):** Binary search on a rotated array `[4,5,6,7,0,1,2]`. How do you determine which half is sorted?

<details><summary>Answer</summary>

Compare `nums[lo]` and `nums[mid]`. If `nums[lo] <= nums[mid]`: left half is sorted. Check if target is in `[nums[lo], nums[mid])` — if yes, search left; else search right. Otherwise right half is sorted. Check if target is in `(nums[mid], nums[hi]]` — if yes, search right; else search left. This always works because at least one half of a rotated sorted array is always sorted.

</details>

## BFS (Breadth-First Search)

```
GO WIDE first! Visit all neighbors before going deeper.

    0 --- 1
    |     |
    3 --- 2

BFS from 0:
Level 0: 0
Level 1: 1, 3
Level 2: 2

BFS order: 0 → 1 → 3 → 2

USES:
- Shortest path (unweighted)
- Level-order traversal
- Finding nearest neighbor
```

```java
public void bfs(int start, List<List<Integer>> graph) {
    boolean[] visited = new boolean[graph.size()];
    Queue<Integer> queue = new LinkedList<>();

    visited[start] = true;
    queue.offer(start);

    while (!queue.isEmpty()) {
        int node = queue.poll();
        System.out.print(node + " ");

        for (int neighbor : graph.get(node)) {
            if (!visited[neighbor]) {
                visited[neighbor] = true;
                queue.offer(neighbor);
            }
        }
    }
}

// SHORTEST PATH (unweighted graph)
public int shortestPath(int start, int end, List<List<Integer>> graph) {
    boolean[] visited = new boolean[graph.size()];
    Queue<int[]> queue = new LinkedList<>();  // [node, distance]

    visited[start] = true;
    queue.offer(new int[]{start, 0});

    while (!queue.isEmpty()) {
        int[] curr = queue.poll();
        int node = curr[0], dist = curr[1];

        if (node == end) return dist;

        for (int neighbor : graph.get(node)) {
            if (!visited[neighbor]) {
                visited[neighbor] = true;
                queue.offer(new int[]{neighbor, dist + 1});
            }
        }
    }

    return -1;  // No path found
}
```

---

🔬 **Section Challenge — BFS (Breadth-First Search)**

**Challenge 1 (BFS Completeness Guarantee):** BFS visits nodes in level-order (all nodes at distance `d` before distance `d+1`). **Who** guarantees BFS finds the SHORTEST path in unweighted graphs? **When** does this guarantee NOT hold?

<details><summary>Answer</summary>

**Who guarantees it:** The FIFO queue property. When BFS dequeues node `u` (at distance `d`), it has already processed ALL nodes at distances 0 through `d-1`. Each neighbor of `u` is enqueued at distance `d+1`. This means the FIRST time BFS reaches a node is via the shortest path. **Formal proof:** By induction. At step 0: source is at distance 0. At step k: if all nodes at distance <= k are correctly labeled, neighbors of k-distance nodes are correctly labeled k+1. The first time a node is visited = shortest distance. **When this guarantee does NOT hold:** (1) **Weighted graphs:** BFS treats each edge as weight 1. A longer BFS path `A → B → C` with weights 1+1=2 beats a direct `A → C` path with weight 3. But if edges have different weights, BFS might take `A → B → C` (total cost 10) instead of `A → C` (cost 2). Use Dijkstra for weighted graphs. (2) **Negative edge weights:** Even Dijkstra fails. Use Bellman-Ford.

</details>
<details><summary>Answer</summary>

lo=0,hi=4 → mid=2(val=5): 5<6 → lo=3. lo=3,hi=4 → mid=3(val=7): 7>6 → hi=2. lo(3)>hi(2): loop ends, return -1 (not found). Key insight: lo overtakes hi — this is the standard termination condition. `lo` ends at the insertion point where 6 would go.

</details>

**Challenge 2 (Design):** Binary search on a rotated array `[4,5,6,7,0,1,2]`. How do you determine which half is sorted?

<details><summary>Answer</summary>

Compare `nums[lo]` and `nums[mid]`. If `nums[lo] <= nums[mid]`: left half is sorted. Check if target is in `[nums[lo], nums[mid])` — if yes, search left; else search right. Otherwise right half is sorted. Check if target is in `(nums[mid], nums[hi]]` — if yes, search right; else search left. This always works because at least one half of a rotated sorted array is always sorted.

</details>

# 📌 Part 7: Cycle Detection

## In Undirected Graph

```java
// DFS approach
public boolean hasCycle(List<List<Integer>> graph) {
    boolean[] visited = new boolean[graph.size()];

    for (int i = 0; i < graph.size(); i++) {
        if (!visited[i]) {
            if (dfsHasCycle(i, -1, graph, visited)) {
                return true;
            }
        }
    }
    return false;
}

private boolean dfsHasCycle(int node, int parent,
                           List<List<Integer>> graph, boolean[] visited) {
    visited[node] = true;

    for (int neighbor : graph.get(node)) {
        if (!visited[neighbor]) {
            if (dfsHasCycle(neighbor, node, graph, visited)) {
                return true;
            }
        } else if (neighbor != parent) {
            // Visited neighbor that's not parent = cycle!
            return true;
        }
    }
    return false;
}
```

🔬 **Section Challenge — In Undirected Graph**

**Challenge 1 (BFS Connected Components):** An undirected graph has 5 vertices: `{0,1,2,3,4}` with edges `{0-1, 1-2, 3-4}`. **Who** counts the connected components? **When** does BFS miss a component? **What** is the correct BFS algorithm to count ALL components?

<details><summary>Answer</summary>

**Who counts:** The outer loop that starts BFS from each unvisited node. With edges `{0-1, 1-2, 3-4}`: Component 1 = `{0, 1, 2}`, Component 2 = `{3, 4}`, Component 3 = `{vertex 5 if isolated}`. Answer = 2 components. **When BFS misses a component:** If you only call BFS once from node 0, BFS visits `{0, 1, 2}` but never sees `{3, 4}` because they're disconnected. **Correct algorithm:** Outer loop over ALL vertices: `for (int i = 0; i < n; i++) { if (!visited[i]) { components++; bfs(i); } }`. Each BFS call marks all vertices in ONE component as visited. The outer loop counts how many separate BFS calls were needed = number of components. **Use cases:** LC 323 (Number of Connected Components), LC 200 (Number of Islands uses DFS/BFS grid-based connected components). Union-Find is an alternative that handles dynamic edge additions.

</details>

## In Directed Graph

```java
// Using colors: WHITE (unvisited), GRAY (in progress), BLACK (done)
public boolean hasCycleDirected(List<List<Integer>> graph) {
    int[] color = new int[graph.size()];  // 0=WHITE, 1=GRAY, 2=BLACK

    for (int i = 0; i < graph.size(); i++) {
        if (color[i] == 0) {
            if (dfsHasCycleDirected(i, graph, color)) {
                return true;
            }
        }
    }
    return false;
}

private boolean dfsHasCycleDirected(int node, List<List<Integer>> graph, int[] color) {
    color[node] = 1;  // GRAY - in progress

    for (int neighbor : graph.get(node)) {
        if (color[neighbor] == 1) {
            // Found GRAY node = back edge = cycle!
            return true;
        }
        if (color[neighbor] == 0) {
            if (dfsHasCycleDirected(neighbor, graph, color)) {
                return true;
            }
        }
    }

    color[node] = 2;  // BLACK - done
    return false;
}
```

---

🔬 **Section Challenge — In Directed Graph**

**Challenge 1 (Topological Sort Method Comparison):** A directed dependency graph has 5 courses. **Who** detects a cycle: DFS-based topological sort or Kahn's BFS algorithm? **When** does each method have an advantage? **What** does Kahn's algorithm return when a cycle exists?

<details><summary>Answer</summary>

**Both detect cycles:** DFS detects via back-edge (a GRAY neighbor = cycle). Kahn's BFS detects when the final result size < total vertices (some vertices were never added because their in-degree never reached 0). **DFS-based topological sort:** Uses 3-color marking. Post-order: when a node is fully explored, push to a stack. Stack's reverse order = topological order. Detects cycles when a gray ancestor is found. **Kahn's BFS (in-degree based):** Initialize queue with all nodes of in-degree 0. Dequeue, process, reduce neighbors' in-degrees. If a neighbor hits in-degree 0, enqueue it. **Advantage of DFS:** Naturally handles post-order traversal (dependency resolution order). **Advantage of Kahn's:** Easier to understand, naturally handles level-order processing, explicitly produces the topological order (not reversed). **What Kahn's returns on cycle:** The result list will have fewer elements than total vertices. The cycle participants never reach in-degree 0 — they're never enqueued — they're missing from the result. This is the cycle detection mechanism.

</details>

# 🔄 Part 8: Topological Sort

```
ORDER TASKS RESPECTING DEPENDENCIES
Only for DAGs (Directed Acyclic Graphs)

Example: Course prerequisites
Course 1 → Course 2 → Course 3
       ↘    Course 4 ↗

Valid orders: [1, 2, 4, 3] or [1, 4, 2, 3]
```

```java
// Kahn's Algorithm (BFS approach)
public List<Integer> topologicalSort(int numCourses, int[][] prerequisites) {
    // Build graph and calculate in-degrees
    List<List<Integer>> graph = new ArrayList<>();
    int[] inDegree = new int[numCourses];

    for (int i = 0; i < numCourses; i++) {
        graph.add(new ArrayList<>());
    }

    for (int[] pre : prerequisites) {
        graph.get(pre[1]).add(pre[0]);  // pre[1] → pre[0]
        inDegree[pre[0]]++;
    }

    // Add nodes with in-degree 0 to queue
    Queue<Integer> queue = new LinkedList<>();
    for (int i = 0; i < numCourses; i++) {
        if (inDegree[i] == 0) {
            queue.offer(i);
        }
    }

    List<Integer> result = new ArrayList<>();

    while (!queue.isEmpty()) {
        int node = queue.poll();
        result.add(node);

        for (int neighbor : graph.get(node)) {
            inDegree[neighbor]--;
            if (inDegree[neighbor] == 0) {
                queue.offer(neighbor);
            }
        }
    }

    // If result doesn't contain all nodes, there's a cycle
    return result.size() == numCourses ? result : new ArrayList<>();
}
```

---

# 📌 Part 9: Shortest Path Algorithms

## Dijkstra's Algorithm

```
SHORTEST PATH from source to all nodes (weighted, non-negative)

IDEA: Greedy approach
- Start with source distance = 0, all others = infinity
- Always process the closest unvisited node
- Update distances through this node

    (0)---4---(1)
     |         |
     2         1
     |         |
    (2)---3---(3)

From node 0:
- dist[0] = 0, dist[1] = ∞, dist[2] = ∞, dist[3] = ∞
- Process 0: dist[1] = 4, dist[2] = 2
- Process 2 (closest): dist[3] = 2 + 3 = 5
- Process 1: dist[3] = min(5, 4+1) = 5
- Process 3: done

Final: dist = [0, 4, 2, 5]
```

```java
public int[] dijkstra(int n, List<int[]>[] graph, int source) {
    int[] dist = new int[n];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[source] = 0;

    // Priority queue: [distance, node]
    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] - b[0]);
    pq.offer(new int[]{0, source});

    while (!pq.isEmpty()) {
        int[] curr = pq.poll();
        int d = curr[0], node = curr[1];

        if (d > dist[node]) continue;  // Skip if outdated

        for (int[] edge : graph[node]) {
            int neighbor = edge[0], weight = edge[1];
            int newDist = dist[node] + weight;

            if (newDist < dist[neighbor]) {
                dist[neighbor] = newDist;
                pq.offer(new int[]{newDist, neighbor});
            }
        }
    }

    return dist;
}

// TIME: O((V + E) log V) with priority queue
// SPACE: O(V)
```

---

# 💪 Part 10: Practice Problems

## Trees

```
EASY:
1. Maximum depth of binary tree
2. Invert binary tree
3. Same tree
4. Symmetric tree

MEDIUM:
1. Validate BST
2. Lowest common ancestor
3. Binary tree level order traversal
4. Construct binary tree from preorder/inorder

HARD:
1. Binary tree maximum path sum
2. Serialize and deserialize binary tree
```

## Graphs

```
EASY:
1. Find if path exists in graph
2. Find center of star graph

MEDIUM:
1. Number of islands (grid as graph)
2. Clone graph
3. Course schedule (topological sort)
4. Pacific Atlantic water flow

HARD:
1. Word ladder
2. Alien dictionary
3. Shortest path in binary matrix
```

---

---

---

🔬 **Section Challenge — Graphs**

**Challenge 1 (Dijkstra Correctness):** Dijkstra's algorithm uses a greedy choice: always expand the unvisited node with the smallest known distance. **Who** proves this greedy choice is safe? **When** does Dijkstra give WRONG answers?

<details><summary>Answer</summary>

**Who proves it safe:** The "no shorter path" invariant. When Dijkstra dequeues node `u` with distance `d[u]`, ALL paths to `u` through unprocessed nodes have length >= `d[u]` (because edge weights are non-negative and unprocessed nodes have distance >= `d[u]`). So `d[u]` is already the shortest path — relaxing it further is impossible. This is the exchange argument: any other path to `u` must pass through a node with distance >= `d[u]` then add at least 0 weight. **When Dijkstra gives WRONG answers:** **Negative edge weights.** If edge `u→v` has weight -5, a path `source→u→v` might be shorter than `source→v` even after we've "finalized" `v`. Since negative weights can create shortcuts discovered after a node is dequeued, Dijkstra's invariant breaks. **Fix:** Bellman-Ford handles negative edges in O(VE). For negative cycles (where shortest path is `-∞`), Bellman-Ford detects them. Dijkstra is O((V+E)logV) with a binary heap — faster but requires non-negative weights.

</details>
> [!NOTE]
> **Open Source Reference: Dijkstra & PriorityQueue**
> * [cp-algorithms/dijkstra](https://cp-algorithms.com/graph/dijkstra.html) -> **Invariant:** Always expands the minimum-distance unvisited node; requires non-negative edge weights.
> * [OpenJDK PriorityQueue](https://github.com/openjdk/jdk/blob/master/src/java.base/share/classes/java/util/PriorityQueue.java) -> **Local rewrite:** Dijkstra in Java heavily relies on `PriorityQueue`. Remember that Java's `PriorityQueue.remove(Object)` is O(N), so we don't update existing nodes in the queue — we just insert the new shorter distance and ignore the old one when we pop it (lazy deletion).
> * **Constraint warning:** If the graph has negative weights, Dijkstra's greedy invariant breaks; use Bellman-Ford instead.
