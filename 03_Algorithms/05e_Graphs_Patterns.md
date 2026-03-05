> **Navigation**: [< Previous Chapter](05d_Graphs_Advanced.md) | [Back to Index](../00_MASTER_INDEX.md)
> 🧠 **Mental Model**: See [Graph & Tree Thinking](../14_Mental_Models/03_Graph_Tree_Thinking.md) — graph pattern recognition

---

        if (!visited[u]) {
            List<Integer> scc = new ArrayList<>();
            dfs2(u, radj, visited, scc);
            sccs.add(scc);
        }
    }

    return sccs;
}

private void dfs1(int u, List<List<Integer>> adj,
                  boolean[] visited, Deque<Integer> stack) {
    visited[u] = true;
    for (int v : adj.get(u)) {
        if (!visited[v]) {
            dfs1(v, adj, visited, stack);
        }
    }
    stack.push(u);
}

private void dfs2(int u, List<List<Integer>> radj,
                  boolean[] visited, List<Integer> scc) {
    visited[u] = true;
    scc.add(u);
    for (int v : radj.get(u)) {
        if (!visited[v]) {
            dfs2(v, radj, visited, scc);
        }
    }
}

// TARJAN'S ALGORITHM: O(V + E), single DFS
public List<List<Integer>> tarjanSCC(int n, int[][] edges) {
    List<List<Integer>> adj = new ArrayList<>();
    for (int i = 0; i < n; i++) adj.add(new ArrayList<>());

    for (int[] edge : edges) {
        adj.get(edge[0]).add(edge[1]);
    }

    int[] ids = new int[n];      // Discovery time
    int[] low = new int[n];      // Lowest reachable id
    boolean[] onStack = new boolean[n];
    Deque<Integer> stack = new ArrayDeque<>();
    Arrays.fill(ids, -1);

    List<List<Integer>> sccs = new ArrayList<>();
    int[] time = {0};

    for (int i = 0; i < n; i++) {
        if (ids[i] == -1) {
            tarjanDFS(i, adj, ids, low, onStack, stack, sccs, time);
        }
    }

    return sccs;
}

private void tarjanDFS(int u, List<List<Integer>> adj, int[] ids, int[] low,
                       boolean[] onStack, Deque<Integer> stack,
                       List<List<Integer>> sccs, int[] time) {
    ids[u] = low[u] = time[0]++;
    stack.push(u);
    onStack[u] = true;

    for (int v : adj.get(u)) {
        if (ids[v] == -1) {
            tarjanDFS(v, adj, ids, low, onStack, stack, sccs, time);
            low[u] = Math.min(low[u], low[v]);
        } else if (onStack[v]) {
            low[u] = Math.min(low[u], ids[v]);
        }
    }

    // If u is root of SCC
    if (ids[u] == low[u]) {
        List<Integer> scc = new ArrayList<>();
        while (true) {
            int v = stack.pop();
            onStack[v] = false;
            scc.add(v);
            if (v == u) break;
        }
        sccs.add(scc);
    }
}
```

### 6. MINIMUM SPANNING TREE (MST)

```java
/*
 * MST: Tree that connects all vertices with minimum total edge weight
 *
 *        2
 *     0 --- 1
 *    1|\ 3/  |2
 *     | X    |
 *    3|/ 4\  |
 *     2 --- 3
 *        3
 *
 * MST edges: (0,2), (0,1), (1,3) = total weight 5
 */

// KRUSKAL'S ALGORITHM: O(E log E)
// Sort edges, add if no cycle (using Union-Find)
public int kruskalMST(int n, int[][] edges) {
    // Sort by weight
    Arrays.sort(edges, (a, b) -> a[2] - b[2]);

    UnionFind uf = new UnionFind(n);
    int mstWeight = 0;
    int edgeCount = 0;

    for (int[] edge : edges) {
        int u = edge[0], v = edge[1], w = edge[2];

        if (uf.union(u, v)) {
            mstWeight += w;
            edgeCount++;
            if (edgeCount == n - 1) break;  // MST complete
        }
    }

    return edgeCount == n - 1 ? mstWeight : -1;  // -1 if disconnected
}

class UnionFind {
    int[] parent, rank;

    UnionFind(int n) {
        parent = new int[n];
        rank = new int[n];
        for (int i = 0; i < n; i++) parent[i] = i;
    }

    int find(int x) {
        if (parent[x] != x) {
            parent[x] = find(parent[x]);  // Path compression
        }
        return parent[x];
    }

    boolean union(int x, int y) {
        int px = find(x), py = find(y);
        if (px == py) return false;  // Already connected

        // Union by rank
        if (rank[px] < rank[py]) { int t = px; px = py; py = t; }
        parent[py] = px;
        if (rank[px] == rank[py]) rank[px]++;
        return true;
    }
}

// PRIM'S ALGORITHM: O(E log V)
// Start from any vertex, greedily add cheapest edge
public int primMST(int n, int[][] edges) {
    List<List<int[]>> adj = new ArrayList<>();
    for (int i = 0; i < n; i++) adj.add(new ArrayList<>());

    for (int[] edge : edges) {
        adj.get(edge[0]).add(new int[]{edge[1], edge[2]});
        adj.get(edge[1]).add(new int[]{edge[0], edge[2]});
    }

    // Min-heap: [weight, vertex]
    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] - b[0]);
    boolean[] inMST = new boolean[n];
    int mstWeight = 0;
    int count = 0;

    pq.offer(new int[]{0, 0});  // Start from vertex 0

    while (!pq.isEmpty() && count < n) {
        int[] curr = pq.poll();
        int w = curr[0], u = curr[1];

        if (inMST[u]) continue;

        inMST[u] = true;
        mstWeight += w;
        count++;

        for (int[] next : adj.get(u)) {
            int v = next[0], edgeW = next[1];
            if (!inMST[v]) {
                pq.offer(new int[]{edgeW, v});
            }
        }
    }

    return count == n ? mstWeight : -1;
}
```

### 7. ARTICULATION POINTS AND BRIDGES

```java
/*
 * ARTICULATION POINT: Vertex whose removal disconnects the graph
 * BRIDGE: Edge whose removal disconnects the graph
 *
 *     1 --- 2        Articulation points: 2, 3
 *     |     |        Bridge: (2, 3)
 *     0 --- 2 --- 3 --- 4
 */

public class ArticulationPointsAndBridges {
    int time = 0;

    public List<Integer> findArticulationPoints(int n, int[][] edges) {
        List<List<Integer>> adj = buildGraph(n, edges);

        int[] disc = new int[n];      // Discovery time
        int[] low = new int[n];       // Lowest reachable
        int[] parent = new int[n];
        boolean[] visited = new boolean[n];
        boolean[] isAP = new boolean[n];

        Arrays.fill(parent, -1);

        for (int i = 0; i < n; i++) {
            if (!visited[i]) {
                dfsAP(i, adj, disc, low, parent, visited, isAP);
            }
        }

        List<Integer> aps = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            if (isAP[i]) aps.add(i);
        }
        return aps;
    }

    private void dfsAP(int u, List<List<Integer>> adj, int[] disc, int[] low,
                       int[] parent, boolean[] visited, boolean[] isAP) {
        int children = 0;
        visited[u] = true;
        disc[u] = low[u] = time++;

        for (int v : adj.get(u)) {
            if (!visited[v]) {
                children++;
                parent[v] = u;
                dfsAP(v, adj, disc, low, parent, visited, isAP);

                low[u] = Math.min(low[u], low[v]);

                // u is AP if:
                // 1. u is root and has 2+ children
                // 2. u is not root and low[v] >= disc[u]
                if (parent[u] == -1 && children > 1) {
                    isAP[u] = true;
                }
                if (parent[u] != -1 && low[v] >= disc[u]) {
                    isAP[u] = true;
                }
            } else if (v != parent[u]) {
                low[u] = Math.min(low[u], disc[v]);
            }
        }
    }

    public List<int[]> findBridges(int n, int[][] edges) {
        List<List<Integer>> adj = buildGraph(n, edges);
        time = 0;

        int[] disc = new int[n];
        int[] low = new int[n];
        int[] parent = new int[n];
        boolean[] visited = new boolean[n];
        List<int[]> bridges = new ArrayList<>();

        Arrays.fill(parent, -1);

        for (int i = 0; i < n; i++) {
            if (!visited[i]) {
                dfsBridge(i, adj, disc, low, parent, visited, bridges);
            }
        }

        return bridges;
    }

    private void dfsBridge(int u, List<List<Integer>> adj, int[] disc, int[] low,
                           int[] parent, boolean[] visited, List<int[]> bridges) {
        visited[u] = true;
        disc[u] = low[u] = time++;

        for (int v : adj.get(u)) {
            if (!visited[v]) {
                parent[v] = u;
                dfsBridge(v, adj, disc, low, parent, visited, bridges);

                low[u] = Math.min(low[u], low[v]);

                // Bridge if low[v] > disc[u] (no back edge from subtree)
                if (low[v] > disc[u]) {
                    bridges.add(new int[]{u, v});
                }
            } else if (v != parent[u]) {
                low[u] = Math.min(low[u], disc[v]);
            }
        }
    }
}
```

### 8. EULER PATH AND HAMILTONIAN PATH

```java
/*
 * EULER PATH: Visit every EDGE exactly once
 * EULER CIRCUIT: Euler path that starts and ends at same vertex
 *
 * Existence conditions:
 * - Undirected: Euler circuit exists iff all vertices have even degree
 *              Euler path exists iff exactly 0 or 2 vertices have odd degree
 * - Directed: Euler circuit exists iff in-degree == out-degree for all
 *             Euler path exists iff one vertex has out-degree = in-degree + 1
 *             and one has in-degree = out-degree + 1
 *
 * HAMILTONIAN PATH: Visit every VERTEX exactly once
 * HAMILTONIAN CYCLE: Hamiltonian path that returns to start
 *
 * NP-complete! No efficient algorithm known.
 */

// Hierholzer's Algorithm for Euler Path: O(E)
public List<Integer> eulerPath(int n, int[][] edges) {
    // Build adjacency list with edge indices for removal
    List<Map<Integer, Integer>> adj = new ArrayList<>();
    for (int i = 0; i < n; i++) adj.add(new HashMap<>());

    int[] degree = new int[n];
    for (int[] edge : edges) {
        adj.get(edge[0]).merge(edge[1], 1, Integer::sum);
        adj.get(edge[1]).merge(edge[0], 1, Integer::sum);
        degree[edge[0]]++;
        degree[edge[1]]++;
    }

    // Find start vertex (odd degree vertex, or any vertex)
    int start = 0;
    for (int i = 0; i < n; i++) {
        if (degree[i] % 2 == 1) {
            start = i;
            break;
        }
    }

    Deque<Integer> stack = new ArrayDeque<>();
    List<Integer> path = new ArrayList<>();
    stack.push(start);

    while (!stack.isEmpty()) {
        int u = stack.peek();
        if (adj.get(u).isEmpty()) {
            path.add(stack.pop());
        } else {
            int v = adj.get(u).keySet().iterator().next();
            stack.push(v);

            // Remove edge
            adj.get(u).merge(v, -1, Integer::sum);
            if (adj.get(u).get(v) == 0) adj.get(u).remove(v);
            adj.get(v).merge(u, -1, Integer::sum);
            if (adj.get(v).get(u) == 0) adj.get(v).remove(u);
        }
    }

    Collections.reverse(path);
    return path;
}

// Hamiltonian Path using DP + Bitmask: O(n² * 2^n)
public boolean hasHamiltonianPath(int n, int[][] edges) {
    boolean[][] adj = new boolean[n][n];
    for (int[] edge : edges) {
        adj[edge[0]][edge[1]] = true;
        adj[edge[1]][edge[0]] = true;
    }

    // dp[mask][i] = can reach state where visited nodes = mask, ending at i
    boolean[][] dp = new boolean[1 << n][n];

    // Base case: start at each single node
    for (int i = 0; i < n; i++) {
        dp[1 << i][i] = true;
    }

    for (int mask = 1; mask < (1 << n); mask++) {
        for (int last = 0; last < n; last++) {
            if (!dp[mask][last]) continue;
            if ((mask & (1 << last)) == 0) continue;

            for (int next = 0; next < n; next++) {
                if ((mask & (1 << next)) != 0) continue;  // Already visited
                if (!adj[last][next]) continue;  // No edge

                dp[mask | (1 << next)][next] = true;
            }
        }
    }

    // Check if full path exists (all nodes visited)
    int fullMask = (1 << n) - 1;
    for (int i = 0; i < n; i++) {
        if (dp[fullMask][i]) return true;
    }
    return false;
}
```

## ALGORITHM COMPLEXITY COMPARISON

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                    TREE & GRAPH ALGORITHMS - COMPLEXITY SUMMARY                  │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  TREE TRAVERSALS:                                                                │
│  ┌────────────────────────┬────────────┬───────────┬───────────────────────────┐ │
│  │ Algorithm              │ Time       │ Space     │ Notes                     │ │
│  ├────────────────────────┼────────────┼───────────┼───────────────────────────┤ │
│  │ Preorder/Inorder/Post  │ O(n)       │ O(h)      │ Recursive or iterative   │  │
│  │ Level Order (BFS)      │ O(n)       │ O(w)      │ w = max width            │  │
│  │ Morris Traversal       │ O(n)       │ O(1)      │ Modifies tree temporarily │ │
│  └────────────────────────┴────────────┴───────────┴───────────────────────────┘ │
│                                                                                  │
│  BST OPERATIONS:                                                                 │
│  ┌────────────────────────┬────────────┬───────────┬───────────────────────────┐ │
│  │ Operation              │ Average    │ Worst     │ Notes                     │ │
│  ├────────────────────────┼────────────┼───────────┼───────────────────────────┤ │
│  │ Search                 │ O(log n)   │ O(n)      │ Worst = skewed tree      │  │
│  │ Insert                 │ O(log n)   │ O(n)      │ Maintain balance!        │  │
│  │ Delete                 │ O(log n)   │ O(n)      │ Three cases             │   │
│  │ Find min/max           │ O(log n)   │ O(n)      │ Follow left/right       │   │
│  └────────────────────────┴────────────┴───────────┴───────────────────────────┘ │
│                                                                                  │
│  BALANCED TREES (AVL, Red-Black):                                                │
│  ┌────────────────────────┬────────────┬───────────┬───────────────────────────┐ │
│  │ Operation              │ Time       │ Space     │ Notes                     │ │
│  ├────────────────────────┼────────────┼───────────┼───────────────────────────┤ │
│  │ All operations         │ O(log n)   │ O(log n)  │ Guaranteed balanced      │  │
│  │ Rebalancing            │ O(1)       │ O(1)      │ Max 2 rotations (AVL)   │   │
│  └────────────────────────┴────────────┴───────────┴───────────────────────────┘ │
│                                                                                  │
│  GRAPH TRAVERSALS:                                                               │
│  ┌────────────────────────┬────────────┬───────────┬───────────────────────────┐ │
│  │ Algorithm              │ Time       │ Space     │ Notes                     │ │
│  ├────────────────────────┼────────────┼───────────┼───────────────────────────┤ │
│  │ BFS                    │ O(V + E)   │ O(V)      │ Level-by-level          │   │
│  │ DFS                    │ O(V + E)   │ O(V)      │ Depth-first             │   │
│  │ Topological Sort       │ O(V + E)   │ O(V)      │ DAG only                │   │
│  └────────────────────────┴────────────┴───────────┴───────────────────────────┘ │
│                                                                                  │
│  SHORTEST PATH:                                                                  │
│  ┌────────────────────────┬────────────┬───────────┬───────────────────────────┐ │
│  │ Algorithm              │ Time       │ Space     │ Notes                     │ │
│  ├────────────────────────┼────────────┼───────────┼───────────────────────────┤ │
│  │ BFS (unweighted)       │ O(V + E)   │ O(V)      │ Best for unweighted     │   │
│  │ Dijkstra (binary heap) │ O(E log V) │ O(V)      │ Non-negative weights    │   │
│  │ Dijkstra (Fib heap)    │ O(E+V logV)│ O(V)      │ Rarely implemented      │   │
│  │ Bellman-Ford           │ O(V × E)   │ O(V)      │ Handles negative        │   │
│  │ SPFA                   │ O(V × E)   │ O(V)      │ Avg O(kE), k small     │    │
│  │ Floyd-Warshall         │ O(V³)      │ O(V²)     │ All pairs              │    │
│  │ Johnson                │ O(VE logV) │ O(V²)     │ All pairs, sparse      │    │
│  └────────────────────────┴────────────┴───────────┴───────────────────────────┘ │
│                                                                                  │
│  MST:                                                                            │
│  ┌────────────────────────┬────────────┬───────────┬───────────────────────────┐ │
│  │ Algorithm              │ Time       │ Space     │ Notes                     │ │
│  ├────────────────────────┼────────────┼───────────┼───────────────────────────┤ │
│  │ Kruskal                │ O(E log E) │ O(V)      │ Sort + Union-Find       │   │
│  │ Prim (binary heap)     │ O(E log V) │ O(V)      │ Dense: use matrix       │   │
│  │ Prim (Fib heap)        │ O(E+V logV)│ O(V)      │ Better for dense        │   │
│  │ Borůvka                │ O(E log V) │ O(V)      │ Parallelizable          │   │
│  └────────────────────────┴────────────┴───────────┴───────────────────────────┘ │
│                                                                                  │
│  ADVANCED:                                                                       │
│  ┌────────────────────────┬────────────┬───────────┬───────────────────────────┐ │
│  │ Algorithm              │ Time       │ Space     │ Notes                     │ │
│  ├────────────────────────┼────────────┼───────────┼───────────────────────────┤ │
│  │ SCC (Tarjan/Kosaraju)  │ O(V + E)   │ O(V)      │ Directed graphs         │   │
│  │ Articulation Points    │ O(V + E)   │ O(V)      │ Cut vertices            │   │
│  │ Bridges                │ O(V + E)   │ O(V)      │ Cut edges               │   │
│  │ LCA (preprocessing)    │ O(n log n) │ O(n log n)│ Binary lifting          │   │
│  │ LCA (query)            │ O(log n)   │ -         │ After preprocessing     │   │
│  │ Euler Path             │ O(E)       │ O(V + E)  │ Hierholzer              │   │
│  │ Hamiltonian Path       │ O(n² 2^n)  │ O(n 2^n)  │ DP + bitmask           │    │
│  └────────────────────────┴────────────┴───────────┴───────────────────────────┘ │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

## INTERVIEW PROBLEM PATTERNS

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                    WHEN TO USE WHICH ALGORITHM                                   │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  "Find shortest path..."                                                         │
│  • Unweighted → BFS                                                              │
│  • Positive weights → Dijkstra                                                   │
│  • Negative weights → Bellman-Ford                                               │
│  • All pairs → Floyd-Warshall (dense) or Johnson (sparse)                        │
│                                                                                  │
│  "Find connected components..."                                                  │
│  • Undirected → BFS/DFS or Union-Find                                            │
│  • Directed (SCC) → Tarjan or Kosaraju                                           │
│                                                                                  │
│  "Detect cycle..."                                                               │
│  • Undirected → DFS with parent tracking or Union-Find                           │
│  • Directed → DFS with colors (white/gray/black)                                 │
│                                                                                  │
│  "Ordering with dependencies..."                                                 │
│  • Topological Sort (Kahn's BFS or DFS postorder)                                │
│                                                                                  │
│  "Minimum cost to connect all..."                                                │
│  • MST: Kruskal or Prim                                                          │
│                                                                                  │
│  "Find LCA..."                                                                   │
│  • Single query → O(n) recursive                                                 │
│  • Multiple queries → Binary lifting O(log n) per query                          │
│                                                                                  │
│  "Count paths..."                                                                │
│  • DAG → Topological sort + DP                                                   │
│  • General → DFS with memoization                                                │
│                                                                                  │
│  "Network flow / max matching..."                                                │
│  • Ford-Fulkerson / Edmonds-Karp / Dinic                                         │
│                                                                                  │
│  TREE-SPECIFIC:                                                                  │
│  • Validate BST → Inorder (should be sorted) or range checking                   │
│  • Serialize/Deserialize → Preorder + null markers                               │
│  • Tree DP → Postorder traversal                                                 │
│  • Path problems → LCA + path sum                                                │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

# A* (A-STAR) ALGORITHM — COMPLETE GUIDE

---

## 🔵 WHY: Why Do We Need A*?

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                     WHY A* EXISTS — THE MOTIVATION                               │
│                                                                                  │
│  Dijkstra explores in ALL directions equally:                                    │
│                                                                                  │
│           . . . . . . .                                                          │
│         . . . . . . . . .                                                        │
│       . . . . S . . . . . .          S = Start, G = Goal                         │
│         . . . . . . . . .            Dijkstra explores the entire circle         │
│           . . . . G . .              before finding path to G                    │
│                                                                                  │
│  A* uses a HEURISTIC to guide search TOWARD the goal:                            │
│                                                                                  │
│                 . .                                                              │
│           S . . . . G                A* explores a narrow corridor               │
│                 . .                   toward the goal — MUCH faster!             │
│                                                                                  │
│  WHEN TO USE:                                                                    │
│  • Grid pathfinding (games, robotics, GPS)                                       │
│  • Any graph where you have an estimate of distance to goal                      │
│  • When Dijkstra is too slow because graph is huge                               │
│                                                                                  │
│  REAL-WORLD:                                                                     │
│  • Google Maps route planning                                                    │
│  • Game AI (NPCs navigating around obstacles)                                    │
│  • Robot motion planning                                                         │
│  • Network routing protocols                                                     │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔵 WHAT: How A* Works

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                     A* CORE FORMULA                                              │
│                                                                                  │
│   f(n) = g(n) + h(n)                                                             │
│                                                                                  │
│   Where:                                                                         │
│   • g(n) = ACTUAL cost from start to node n (known, exact)                       │
│   • h(n) = ESTIMATED cost from n to goal (heuristic, approximate)                │
│   • f(n) = total estimated cost of path through n                                │
│                                                                                  │
│   ┌──────────────┐         ┌──────────────┐         ┌──────────────┐             │
│   │    START     │ ─g(n)─▶ │   NODE n     │ ─h(n)─▶ │    GOAL      │             │
│   │              │  exact   │              │ estimate │              │           │
│   └──────────────┘         └──────────────┘         └──────────────┘             │
│                                                                                  │
│   KEY INSIGHT: A* always expands the node with LOWEST f(n)                       │
│   This means it prioritizes nodes that appear to be on the shortest path         │
│                                                                                  │
│   COMPARISON WITH DIJKSTRA:                                                      │
│   • Dijkstra:  priority = g(n)           (only actual cost)                      │
│   • A*:        priority = g(n) + h(n)    (actual + estimated remaining)          │
│   • If h(n) = 0 for all n → A* becomes Dijkstra                                  │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### Common Heuristic Functions

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│                     HEURISTIC FUNCTIONS FOR GRIDS                                 │
│                                                                                   │
│  1. MANHATTAN DISTANCE (4-directional movement: ↑↓←→)                             │
│     h = |x₁ - x₂| + |y₁ - y₂|                                                     │
│                                                                                   │
│     From (1,1) to (4,3):  |4-1| + |3-1| = 3 + 2 = 5                               │
│                                                                                   │
│  2. EUCLIDEAN DISTANCE (any direction, diagonal allowed)                          │
│     h = √((x₁-x₂)² + (y₁-y₂)²)                                                    │
│                                                                                   │
│     From (1,1) to (4,3):  √(9+4) ≈ 3.6                                            │
│                                                                                   │
│  3. CHEBYSHEV DISTANCE (8-directional: ↑↓←→↗↘↙↖)                                  │
│     h = max(|x₁-x₂|, |y₁-y₂|)                                                     │
│                                                                                   │
│     From (1,1) to (4,3):  max(3, 2) = 3                                           │
│                                                                                   │
│  ╔════════════════════════════════════════════════════════════════╗               │
│  ║  ADMISSIBILITY REQUIREMENT:                                     ║              │
│  ║  h(n) must NEVER overestimate the true cost to goal            ║               │
│  ║  h(n) ≤ actual_cost(n, goal)  for all n                       ║                │
│  ║                                                                 ║              │
│  ║  If admissible → A* guarantees OPTIMAL (shortest) path         ║               │
│  ║  If not admissible → faster but may find suboptimal path       ║               │
│  ╚════════════════════════════════════════════════════════════════╝               │
│                                                                                   │
└───────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔵 HOW: Step-by-Step Walkthrough

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                     A* ALGORITHM STEP-BY-STEP                                    │
│                                                                                  │
│  Grid Example (0 = open, 1 = wall, S = start, G = goal):                         │
│                                                                                  │
│    0   1   2   3   4         Heuristic: Manhattan distance                       │
│  ┌───┬───┬───┬───┬───┐                                                           │
│ 0│ S │   │   │   │   │      S = (0,0), G = (2,4)                                 │
│  ├───┼───┼───┼───┼───┤                                                           │
│ 1│   │ █ │ █ │   │   │      █ = wall (blocked)                                   │
│  ├───┼───┼───┼───┼───┤                                                           │
│ 2│   │   │   │   │ G │                                                           │
│  └───┴───┴───┴───┴───┘                                                           │
│                                                                                  │
│  STEP 1: Initialize                                                              │
│    openSet   = {S}   (nodes to explore, sorted by f)                             │
│    closedSet = {}    (nodes already explored)                                    │
│    g(S) = 0, h(S) = |0-2|+|0-4| = 6, f(S) = 0+6 = 6                              │
│                                                                                  │
│  STEP 2: Pop lowest f from openSet → S (0,0), f=6                                │
│    Expand neighbors: (0,1) and (1,0)                                             │
│    (0,1): g=1, h=|0-2|+|1-4|=5, f=6                                              │
│    (1,0): g=1, h=|1-2|+|0-4|=5, f=6                                              │
│    openSet = {(0,1), (1,0)}                                                      │
│                                                                                  │
│  STEP 3: Pop (0,1), f=6                                                          │
│    Neighbors: (0,2)                                                              │
│    (0,2): g=2, h=|0-2|+|2-4|=4, f=6                                              │
│                                                                                  │
│  ... continues expanding toward goal ...                                         │
│                                                                                  │
│  FINAL PATH:                                                                     │
│    S→(0,1)→(0,2)→(0,3)→(1,3)→(2,3)→G    Cost = 6                                 │
│                                                                                  │
│    0   1   2   3   4                                                             │
│  ┌───┬───┬───┬───┬───┐                                                           │
│ 0│ * │ * │ * │ * │   │    * = path found by A*                                   │
│  ├───┼───┼───┼───┼───┤                                                           │
│ 1│   │ █ │ █ │ * │   │                                                           │
│  ├───┼───┼───┼───┼───┤                                                           │
│ 2│   │   │   │ * │ * │                                                           │
│  └───┴───┴───┴───┴───┘                                                           │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔵 COMPLETE JAVA IMPLEMENTATION

```java
// ═══════════════════════════════════════════════════════════════════════════════
// A* ALGORITHM — GRID PATHFINDING (Complete Implementation)
// ═══════════════════════════════════════════════════════════════════════════════

import java.util.*;

public class AStarAlgorithm {

    // ─── Node in the search space ───
    static class Node implements Comparable<Node> {
        int row, col;
        int g;  // actual cost from start
        int f;  // g + h (total estimated cost)
        Node parent;  // for path reconstruction

        Node(int row, int col, int g, int f, Node parent) {
            this.row = row;
            this.col = col;
            this.g = g;
            this.f = f;
            this.parent = parent;
        }

        @Override
        public int compareTo(Node other) {
            return Integer.compare(this.f, other.f);
        }
    }

    // ─── Heuristic: Manhattan distance (admissible for 4-dir grid) ───
    static int heuristic(int r1, int c1, int r2, int c2) {
        return Math.abs(r1 - r2) + Math.abs(c1 - c2);
    }

    // ─── A* Search on a 2D Grid ───
    // grid[r][c] = 0 (open) or 1 (wall)
    // Returns the shortest path as list of [row, col] or empty if no path
    public static List<int[]> aStarSearch(int[][] grid, int[] start, int[] goal) {
        int rows = grid.length, cols = grid[0].length;
        int sr = start[0], sc = start[1];
        int gr = goal[0], gc = goal[1];

        // Edge case: start or goal is a wall
        if (grid[sr][sc] == 1 || grid[gr][gc] == 1) {
            return Collections.emptyList();
        }

        // 4-directional movement: up, down, left, right
        int[][] dirs = {{-1, 0}, {1, 0}, {0, -1}, {0, 1}};

        // Priority queue sorted by f = g + h
        PriorityQueue<Node> openSet = new PriorityQueue<>();
        boolean[][] closed = new boolean[rows][cols];
        int[][] gCost = new int[rows][cols];  // best g found so far

        // Initialize g costs to infinity
        for (int[] row : gCost) Arrays.fill(row, Integer.MAX_VALUE);

        // Start node
        int h = heuristic(sr, sc, gr, gc);
        openSet.offer(new Node(sr, sc, 0, h, null));
        gCost[sr][sc] = 0;

        while (!openSet.isEmpty()) {
            Node current = openSet.poll();

            // Goal reached — reconstruct path
            if (current.row == gr && current.col == gc) {
                return reconstructPath(current);
            }

            // Skip if already processed with better cost
            if (closed[current.row][current.col]) continue;
            closed[current.row][current.col] = true;

            // Expand neighbors
            for (int[] dir : dirs) {
                int nr = current.row + dir[0];
                int nc = current.col + dir[1];

                // Bounds check + wall check + already closed
                if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
                if (grid[nr][nc] == 1) continue;
                if (closed[nr][nc]) continue;

                int newG = current.g + 1;  // uniform cost (1 per step)

                // Only add if this path to neighbor is better
                if (newG < gCost[nr][nc]) {
                    gCost[nr][nc] = newG;
                    int newF = newG + heuristic(nr, nc, gr, gc);
                    openSet.offer(new Node(nr, nc, newG, newF, current));
                }
            }
        }

        return Collections.emptyList();  // No path found
    }

    // ─── Reconstruct path by following parent pointers ───
    private static List<int[]> reconstructPath(Node goal) {
        List<int[]> path = new ArrayList<>();
        Node current = goal;
        while (current != null) {
            path.add(new int[]{current.row, current.col});
            current = current.parent;
        }
        Collections.reverse(path);
        return path;
    }

    // ─── Main: Demo ───
    public static void main(String[] args) {
        int[][] grid = {
            {0, 0, 0, 0, 0},
            {0, 1, 1, 0, 0},
            {0, 0, 0, 0, 0}
        };

        int[] start = {0, 0};
        int[] goal = {2, 4};

        List<int[]> path = aStarSearch(grid, start, goal);

        System.out.println("Path length: " + (path.size() - 1));
        for (int[] p : path) {
            System.out.println("  (" + p[0] + ", " + p[1] + ")");
        }
        // Output:
        // Path length: 6
        // (0, 0) → (0, 1) → (0, 2) → (0, 3) → (1, 3) → (2, 3) → (2, 4)
    }
}
```

---

### A* with Weighted Graph (Non-Grid)

```java
// ═══════════════════════════════════════════════════════════════════════════════
// A* on a WEIGHTED GRAPH (adjacency list)
// ═══════════════════════════════════════════════════════════════════════════════

public class AStarWeightedGraph {

    static class Edge {
        int to, weight;
        Edge(int to, int weight) { this.to = to; this.weight = weight; }
    }

    static class Node implements Comparable<Node> {
        int id, g, f;
        Node(int id, int g, int f) { this.id = id; this.g = g; this.f = f; }
        public int compareTo(Node o) { return Integer.compare(this.f, o.f); }
    }

    // heuristic[i] = estimated cost from node i to goal
    // MUST be admissible (never overestimates)
    public static int[] astar(List<List<Edge>> graph, int start, int goal, int[] heuristic) {
        int n = graph.size();
        int[] dist = new int[n];
        int[] parent = new int[n];
        Arrays.fill(dist, Integer.MAX_VALUE);
        Arrays.fill(parent, -1);
        boolean[] closed = new boolean[n];

        dist[start] = 0;
        PriorityQueue<Node> pq = new PriorityQueue<>();
        pq.offer(new Node(start, 0, heuristic[start]));

        while (!pq.isEmpty()) {
            Node cur = pq.poll();
            if (cur.id == goal) break;    // Found optimal path
            if (closed[cur.id]) continue;
            closed[cur.id] = true;

            for (Edge e : graph.get(cur.id)) {
                if (closed[e.to]) continue;
                int newG = cur.g + e.weight;
                if (newG < dist[e.to]) {
                    dist[e.to] = newG;
                    parent[e.to] = cur.id;
                    pq.offer(new Node(e.to, newG, newG + heuristic[e.to]));
                }
            }
        }

        return dist;  // dist[goal] = shortest path cost
    }
}
```

---

### A* vs Dijkstra — When to Use Which

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                     A* VS DIJKSTRA COMPARISON                                    │
│                                                                                  │
│  ┌──────────────────────┬──────────────────────┬───────────────────────────┐     │
│  │ Property             │ Dijkstra             │ A*                        │     │
│  ├──────────────────────┼──────────────────────┼───────────────────────────┤     │
│  │ Time Complexity      │ O(E log V)           │ O(E log V) worst case    │      │
│  │                      │                      │ Often MUCH better        │      │
│  ├──────────────────────┼──────────────────────┼───────────────────────────┤     │
│  │ Explores             │ All reachable nodes  │ Nodes toward goal only   │      │
│  ├──────────────────────┼──────────────────────┼───────────────────────────┤     │
│  │ Needs heuristic?     │ No                   │ Yes                      │      │
│  ├──────────────────────┼──────────────────────┼───────────────────────────┤     │
│  │ Guarantees optimal?  │ Yes (non-neg weights)│ Yes (if h admissible)    │      │
│  ├──────────────────────┼──────────────────────┼───────────────────────────┤     │
│  │ Single target?       │ Finds all targets    │ Stops at single goal     │      │
│  ├──────────────────────┼──────────────────────┼───────────────────────────┤     │
│  │ Best for             │ All-to-all paths     │ Start-to-specific-goal   │      │
│  ├──────────────────────┼──────────────────────┼───────────────────────────┤     │
│  │ Negative weights?    │ No                   │ No                       │      │
│  └──────────────────────┴──────────────────────┴───────────────────────────┘     │
│                                                                                  │
│  RULE OF THUMB:                                                                  │
│  • Know the goal location? → A*                                                  │
│  • Need shortest to ALL nodes? → Dijkstra                                        │
│  • Can't define a heuristic? → Dijkstra                                          │
│  • Huge graph (million+ nodes)? → A* will be dramatically faster                 │
│                                                                                  │
│  NODES EXPLORED (10000-node grid, start=top-left, goal=bottom-right):            │
│  • Dijkstra: ~10000 nodes (explores everything)                                  │
│  • A*:       ~2000 nodes  (focused corridor) → 5x faster!                        │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### Practice Problems (A* / Shortest Path with Heuristic)

| # | Problem | Platform | Difficulty | Key Insight |
|---|---------|----------|------------|-------------|
| 1 | Shortest Path in Binary Matrix (LC 1091) | LeetCode | Medium | BFS on grid, adapt to A* |
| 2 | Path With Minimum Effort (LC 1631) | LeetCode | Medium | Modified Dijkstra/A* on grid |
| 3 | Swim in Rising Water (LC 778) | LeetCode | Hard | Binary search + BFS or A* |
| 4 | Sliding Puzzle (LC 773) | LeetCode | Hard | A* with misplaced tile heuristic |
| 5 | Minimum Cost Path on Grid | HackerEarth | Medium | Classic A* on weighted grid |
| 6 | 8-Puzzle solver | Classic | Hard | A* with Manhattan distance heuristic |

---

# CURATED PRACTICE PROBLEMS — GRAPHS (Complete Collection)

> **HOW TO USE**: Work top-to-bottom within each section. Every problem teaches a specific graph technique.
> Mark each ✅ as you solve it. Revisit any problem you can't solve in 30 minutes after studying the pattern above.

---

## Section 1: BFS & DFS Fundamentals

| # | Problem | Platform | Difficulty | Category | Key Technique |
|---|---------|----------|------------|----------|---------------|
| 1 | Number of Islands (LC 200) | LeetCode | Medium | BFS/DFS | Grid flood fill — the #1 graph starter |
| 2 | Flood Fill (LC 733) | LeetCode | Easy | DFS | Simple connected component on grid |
| 3 | Max Area of Island (LC 695) | LeetCode | Medium | DFS | Track component size during DFS |
| 4 | Number of Provinces (LC 547) | LeetCode | Medium | DFS/UF | Adjacency matrix, count components |
| 5 | Clone Graph (LC 133) | LeetCode | Medium | BFS/DFS | HashMap to track visited clones |
| 6 | Surrounded Regions (LC 130) | LeetCode | Medium | DFS | Border-connected DFS, flip remaining |
| 7 | Pacific Atlantic Water Flow (LC 417) | LeetCode | Medium | BFS | Reverse BFS from both oceans |
| 8 | Rotting Oranges (LC 994) | LeetCode | Medium | BFS | Multi-source BFS, track minutes |
| 9 | 01 Matrix (LC 542) | LeetCode | Medium | BFS | Multi-source BFS from all 0s |
| 10 | Walls and Gates (LC 286) | LeetCode | Medium | BFS | Multi-source BFS from gates |
| 11 | Number of Connected Components (LC 323) | LeetCode | Medium | DFS/UF | Classic component counting |
| 12 | Graph Valid Tree (LC 261) | LeetCode | Medium | DFS/UF | Connected + no cycle = tree |

---

## Section 2: Shortest Path (BFS / Dijkstra / Bellman-Ford)

| # | Problem | Platform | Difficulty | Category | Key Technique |
|---|---------|----------|------------|----------|---------------|
| 1 | Shortest Path in Binary Matrix (LC 1091) | LeetCode | Medium | BFS | 8-directional BFS on grid |
| 2 | Word Ladder (LC 127) | LeetCode | Hard | BFS | Transform string BFS, O(26*L) neighbors |
| 3 | Network Delay Time (LC 743) | LeetCode | Medium | Dijkstra | Classic single-source shortest path |
| 4 | Path With Minimum Effort (LC 1631) | LeetCode | Medium | Dijkstra | Min max-edge path, modified priority |
| 5 | Cheapest Flights Within K Stops (LC 787) | LeetCode | Medium | BFS/BF | Bellman-Ford with K relaxation rounds |
| 6 | Swim in Rising Water (LC 778) | LeetCode | Hard | Dijkstra | Min bottleneck path |
| 7 | Minimum Cost to Make at Least One Valid Path (LC 1368) | LeetCode | Hard | 0-1 BFS | Deque BFS: 0-cost same dir, 1-cost change |
| 8 | Shortest Path Visiting All Nodes (LC 847) | LeetCode | Hard | BFS+Bitmask | BFS with state = (node, visited_mask) |
| 9 | Shortest Distance from All Buildings (LC 317) | LeetCode | Hard | BFS | Multi BFS + sum distances |
| 10 | Find the City (LC 1334) | LeetCode | Medium | Dijkstra/FW | Run Dijkstra from each city or Floyd-Warshall |

---

## Section 3: Topological Sort

| # | Problem | Platform | Difficulty | Category | Key Technique |
|---|---------|----------|------------|----------|---------------|
| 1 | Course Schedule (LC 207) | LeetCode | Medium | Topo | Cycle detection via Kahn's BFS |
| 2 | Course Schedule II (LC 210) | LeetCode | Medium | Topo | Return valid ordering |
| 3 | Alien Dictionary (LC 269) | LeetCode | Hard | Topo | Build graph from word comparisons |
| 4 | Minimum Height Trees (LC 310) | LeetCode | Medium | Topo | Peel leaves inward to find centroids |
| 5 | Parallel Courses (LC 1136) | LeetCode | Medium | Topo+BFS | Level-by-level Kahn's = min semesters |
| 6 | Longest Increasing Path in a Matrix (LC 329) | LeetCode | Hard | Topo+DP | DAG on grid, topological order + memo |
| 7 | Sort Items by Groups (LC 1203) | LeetCode | Hard | Topo | Double topological sort (group + item) |
| 8 | Sequence Reconstruction (LC 444) | LeetCode | Medium | Topo | Check unique topological order |

---

## Section 4: Union-Find (Disjoint Set)

| # | Problem | Platform | Difficulty | Category | Key Technique |
|---|---------|----------|------------|----------|---------------|
| 1 | Number of Islands II (LC 305) | LeetCode | Hard | UF | Online connectivity with union-find |
| 2 | Redundant Connection (LC 684) | LeetCode | Medium | UF | Extra edge creates cycle → UF detects it |
| 3 | Accounts Merge (LC 721) | LeetCode | Medium | UF | Union emails, group by root |
| 4 | Earliest Moment When Everyone Becomes Friends (LC 1101) | LeetCode | Medium | UF | Union until single component |
| 5 | Satisfiability of Equality Equations (LC 990) | LeetCode | Medium | UF | Union equals, check not-equals |
| 6 | Most Stones Removed (LC 947) | LeetCode | Medium | UF | Union by row/col, answer = n - components |
| 7 | Smallest String With Swaps (LC 1202) | LeetCode | Medium | UF | Group by component, sort within group |
| 8 | Minimize Malware Spread (LC 924) | LeetCode | Hard | UF | Component sizes, greedy removal |

---

## Section 5: Minimum Spanning Tree (MST)

| # | Problem | Platform | Difficulty | Category | Key Technique |
|---|---------|----------|------------|----------|---------------|
| 1 | Min Cost to Connect All Points (LC 1584) | LeetCode | Medium | Prim/Kruskal | Classic MST on complete graph |
| 2 | Connecting Cities With Minimum Cost (LC 1135) | LeetCode | Medium | Kruskal | Sort edges + Union-Find |
| 3 | Optimize Water Distribution (LC 1168) | LeetCode | Hard | MST | Add virtual node for wells, then MST |
| 4 | Find Critical and Pseudo-Critical Edges (LC 1489) | LeetCode | Hard | MST | Force include/exclude each edge |

---

## Section 6: Advanced Graph Patterns

| # | Problem | Platform | Difficulty | Category | Key Technique |
|---|---------|----------|------------|----------|---------------|
| 1 | Is Graph Bipartite? (LC 785) | LeetCode | Medium | Coloring | 2-color BFS/DFS |
| 2 | Possible Bipartition (LC 886) | LeetCode | Medium | Coloring | Can we 2-color with dislikes? |
| 3 | Find Eventual Safe States (LC 802) | LeetCode | Medium | Cycle | Reverse graph + topo or DFS with states |
| 4 | Detect Cycles in 2D Grid (LC 1559) | LeetCode | Medium | DFS | Track parent to detect back edges |
| 5 | Evaluate Division (LC 399) | LeetCode | Medium | DFS | Weighted graph, path multiplication |
| 6 | Reconstruct Itinerary (LC 332) | LeetCode | Hard | Euler | Hierholzer's algorithm, lexicographic order |
| 7 | Critical Connections (LC 1192) | LeetCode | Hard | Bridge | Tarjan's algorithm for bridges |
| 8 | Strongly Connected Components | Classic | Hard | SCC | Kosaraju's or Tarjan's algorithm |

---

## HIDDEN GEMS — Non-Famous But Excellent Graph Problems

> These problems are less commonly seen in "Top 100" lists but teach deep graph intuition.

| # | Problem | Platform | Why It's Valuable |
|---|---------|----------|-------------------|
| 1 | Bus Routes (LC 815) | LeetCode | BFS on routes (not stops) — graph modeling insight |
| 2 | Shortest Bridge (LC 934) | LeetCode | DFS to find island + BFS to expand — hybrid technique |
| 3 | Time Needed to Inform All Employees (LC 1376) | LeetCode | Tree DFS as graph problem — max path sum |
| 4 | Reorder Routes to Make All Paths Lead to City Zero (LC 1466) | LeetCode | Directed graph trick — reverse edges concept |
| 5 | Number of Operations to Make Network Connected (LC 1319) | LeetCode | Components - 1 = min edges needed, UF elegance |
| 6 | All Paths From Source to Target (LC 797) | LeetCode | DAG backtracking — no visited set needed |
| 7 | Detonate the Maximum Bombs (LC 2101) | LeetCode | Build directed graph from geometry, then DFS from each |
| 8 | Minimum Number of Vertices to Reach All Nodes (LC 1557) | LeetCode | Nodes with in-degree 0 — simple but teaches reachability |
| 9 | Path with Maximum Probability (LC 1514) | LeetCode | Modified Dijkstra — maximize product instead of minimize sum |
| 10 | Minimum Genetic Mutation (LC 433) | LeetCode | BFS string transformation — Word Ladder variant with biology |

---

### Graph Problem-Solving Decision Tree

```
Which graph problem type am I facing?
│
├── Need shortest/minimum path?
│   ├── Unweighted edges → BFS
│   ├── Weighted (non-negative) → Dijkstra
│   ├── Weighted (negative okay) → Bellman-Ford
│   ├── All-pairs shortest → Floyd-Warshall
│   └── Know the target + have heuristic → A*
│
├── Need ordering/dependencies?
│   └── Topological Sort (Kahn's BFS or DFS)
│
├── Need components/connectivity?
│   ├── Static graph → DFS/BFS count components
│   ├── Dynamic (add edges) → Union-Find
│   └── Directed → Kosaraju's/Tarjan's (SCC)
│
├── Need minimum cost to connect all?
│   └── MST (Kruskal + UF or Prim + PQ)
│
├── Cycle detection?
│   ├── Undirected → UF or DFS with parent
│   └── Directed → DFS with 3 colors (white/gray/black)
│
└── Grid problem?
    ├── Connected regions → Flood fill DFS/BFS
    ├── Shortest path on grid → BFS (or Dijkstra if weighted)
    └── Multi-source → Start BFS from all sources simultaneously
```

---

> **Navigation**: [< Previous](05d_Graphs_Advanced_Algos.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](06a_Greedy_BitManip.md)