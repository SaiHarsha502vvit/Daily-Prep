**Navigation**: [< Previous Chapter](05b_Graphs_Internals.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next Chapter >](05d_Graphs_Advanced_Algos.md)
🧠 **Mental Model**: See [Graph & Tree Thinking](../14_Mental_Models/03_Graph_Tree_Thinking.md) — BFS/DFS decision framework and cycle detection

---

## 🔗 JIT Connection — When You Need This

**Arrived here from a graph or tree problem? Use this decision table:**


| Problem Signal | Algorithm to use | Time Complexity |
|---|---|---|
| Shortest path, unweighted | **BFS** (level-by-level) | O(V+E) |
| Shortest path, weighted (+ve) | **Dijkstra** (min-heap) | O((V+E) log V) |
| Detect cycle in directed graph | **DFS** (WHITE/GRAY/BLACK) | O(V+E) |
| Topological sort (prerequisites) | **Kahn's BFS** or DFS postorder | O(V+E) |
| Find all islands / components | **DFS or BFS** from each unvisited | O(V+E) |
| Minimum spanning tree | **Kruskal** (sort edges) or **Prim** | O(E log E) |


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
<details><summary>Answer</summary>

BFS explores by 'hop count' (number of edges). Each level = one more edge away from source. All edges are treated as weight=1. In a weighted graph, the 'shortest by hop count' path may not be 'shortest by weight sum'. Example: A→B (weight 1, 1 hop) vs A→C→B (weight 0.1+0.1=0.2, 2 hops). BFS finds A→B (1 hop), Dijkstra finds A→C→B (lower total weight). BFS is optimal ONLY when all edges have equal weight.
</details>

**Challenge 2 (Design):** Detect if a directed graph has a cycle. Write the algorithm and explain why we need 3 states (not 2).
<details><summary>Answer</summary>

3 states: UNVISITED, IN_PROGRESS (currently in DFS path), DONE. DFS: mark node IN_PROGRESS before visiting neighbors. If we reach an IN_PROGRESS node → cycle found. Mark DONE when all neighbors processed. Why 3 states: with 2 (visited/unvisited), we'd get false positives — reaching a VISITED node that was processed in a DIFFERENT DFS subtree is not a cycle. IN_PROGRESS specifically marks nodes in the CURRENT DFS path (potential back edge).
</details>


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

**Challenge 1 (Reasoning):** BFS finds shortest path in unweighted graphs but not in weighted graphs. Why exactly?
<details><summary>Answer</summary>

BFS explores by 'hop count' (number of edges). Each level = one more edge away from source. All edges are treated as weight=1. In a weighted graph, the 'shortest by hop count' path may not be 'shortest by weight sum'. Example: A→B (weight 1, 1 hop) vs A→C→B (weight 0.1+0.1=0.2, 2 hops). BFS finds A→B (1 hop), Dijkstra finds A→C→B (lower total weight). BFS is optimal ONLY when all edges have equal weight.
</details>

**Challenge 2 (Design):** Detect if a directed graph has a cycle. Write the algorithm and explain why we need 3 states (not 2).
<details><summary>Answer</summary>

3 states: UNVISITED, IN_PROGRESS (currently in DFS path), DONE. DFS: mark node IN_PROGRESS before visiting neighbors. If we reach an IN_PROGRESS node → cycle found. Mark DONE when all neighbors processed. Why 3 states: with 2 (visited/unvisited), we'd get false positives — reaching a VISITED node that was processed in a DIFFERENT DFS subtree is not a cycle. IN_PROGRESS specifically marks nodes in the CURRENT DFS path (potential back edge).
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

**Challenge 1 (Reasoning):** BFS finds shortest path in unweighted graphs but not in weighted graphs. Why exactly?
<details><summary>Answer</summary>

BFS explores by 'hop count' (number of edges). Each level = one more edge away from source. All edges are treated as weight=1. In a weighted graph, the 'shortest by hop count' path may not be 'shortest by weight sum'. Example: A→B (weight 1, 1 hop) vs A→C→B (weight 0.1+0.1=0.2, 2 hops). BFS finds A→B (1 hop), Dijkstra finds A→C→B (lower total weight). BFS is optimal ONLY when all edges have equal weight.
</details>

**Challenge 2 (Design):** Detect if a directed graph has a cycle. Write the algorithm and explain why we need 3 states (not 2).
<details><summary>Answer</summary>

3 states: UNVISITED, IN_PROGRESS (currently in DFS path), DONE. DFS: mark node IN_PROGRESS before visiting neighbors. If we reach an IN_PROGRESS node → cycle found. Mark DONE when all neighbors processed. Why 3 states: with 2 (visited/unvisited), we'd get false positives — reaching a VISITED node that was processed in a DIFFERENT DFS subtree is not a cycle. IN_PROGRESS specifically marks nodes in the CURRENT DFS path (potential back edge).
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

**Challenge 1 (Reasoning):** Binary search on `[1,3,5,7,9]` with `target=6`. Trace `lo`, `hi`, `mid` at each step and explain the final state.
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

**Challenge 1 (Reasoning):** Binary search on `[1,3,5,7,9]` with `target=6`. Trace `lo`, `hi`, `mid` at each step and explain the final state.
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

**Challenge 1 (Reasoning):** BFS finds shortest path in unweighted graphs but not in weighted graphs. Why exactly?
<details><summary>Answer</summary>

BFS explores by 'hop count' (number of edges). Each level = one more edge away from source. All edges are treated as weight=1. In a weighted graph, the 'shortest by hop count' path may not be 'shortest by weight sum'. Example: A→B (weight 1, 1 hop) vs A→C→B (weight 0.1+0.1=0.2, 2 hops). BFS finds A→B (1 hop), Dijkstra finds A→C→B (lower total weight). BFS is optimal ONLY when all edges have equal weight.
</details>

**Challenge 2 (Design):** Detect if a directed graph has a cycle. Write the algorithm and explain why we need 3 states (not 2).
<details><summary>Answer</summary>

3 states: UNVISITED, IN_PROGRESS (currently in DFS path), DONE. DFS: mark node IN_PROGRESS before visiting neighbors. If we reach an IN_PROGRESS node → cycle found. Mark DONE when all neighbors processed. Why 3 states: with 2 (visited/unvisited), we'd get false positives — reaching a VISITED node that was processed in a DIFFERENT DFS subtree is not a cycle. IN_PROGRESS specifically marks nodes in the CURRENT DFS path (potential back edge).
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

**Challenge 1 (Reasoning):** BFS finds shortest path in unweighted graphs but not in weighted graphs. Why exactly?
<details><summary>Answer</summary>

BFS explores by 'hop count' (number of edges). Each level = one more edge away from source. All edges are treated as weight=1. In a weighted graph, the 'shortest by hop count' path may not be 'shortest by weight sum'. Example: A→B (weight 1, 1 hop) vs A→C→B (weight 0.1+0.1=0.2, 2 hops). BFS finds A→B (1 hop), Dijkstra finds A→C→B (lower total weight). BFS is optimal ONLY when all edges have equal weight.
</details>

**Challenge 2 (Design):** Detect if a directed graph has a cycle. Write the algorithm and explain why we need 3 states (not 2).
<details><summary>Answer</summary>

3 states: UNVISITED, IN_PROGRESS (currently in DFS path), DONE. DFS: mark node IN_PROGRESS before visiting neighbors. If we reach an IN_PROGRESS node → cycle found. Mark DONE when all neighbors processed. Why 3 states: with 2 (visited/unvisited), we'd get false positives — reaching a VISITED node that was processed in a DIFFERENT DFS subtree is not a cycle. IN_PROGRESS specifically marks nodes in the CURRENT DFS path (potential back edge).
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

**Challenge 1 (Reasoning):** BFS finds shortest path in unweighted graphs but not in weighted graphs. Why exactly?
<details><summary>Answer</summary>

BFS explores by 'hop count' (number of edges). Each level = one more edge away from source. All edges are treated as weight=1. In a weighted graph, the 'shortest by hop count' path may not be 'shortest by weight sum'. Example: A→B (weight 1, 1 hop) vs A→C→B (weight 0.1+0.1=0.2, 2 hops). BFS finds A→B (1 hop), Dijkstra finds A→C→B (lower total weight). BFS is optimal ONLY when all edges have equal weight.
</details>

**Challenge 2 (Design):** Detect if a directed graph has a cycle. Write the algorithm and explain why we need 3 states (not 2).
<details><summary>Answer</summary>

3 states: UNVISITED, IN_PROGRESS (currently in DFS path), DONE. DFS: mark node IN_PROGRESS before visiting neighbors. If we reach an IN_PROGRESS node → cycle found. Mark DONE when all neighbors processed. Why 3 states: with 2 (visited/unvisited), we'd get false positives — reaching a VISITED node that was processed in a DIFFERENT DFS subtree is not a cycle. IN_PROGRESS specifically marks nodes in the CURRENT DFS path (potential back edge).
</details>


