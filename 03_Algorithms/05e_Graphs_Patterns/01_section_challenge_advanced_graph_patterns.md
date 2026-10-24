# 🔬 Section Challenge — Advanced Graph Patterns

> **Navigation**: [Chapter overview](../05e_Graphs_Patterns.md) | [A\* (A-STAR) ALGORITHM — COMPLETE GUIDE →](02_a_a_star_algorithm_complete_guide.md)
> Page 1 of 2 in **Graph Patterns & Specialized Algorithms**


**Challenge 1 (Reasoning):** What is the core difference between an Euler Path and a Hamiltonian Path, and why does one have an efficient solution while the other is NP-Complete?

**Challenge 2 (Design):** Explain why Tarjan's SCC algorithm uses a stack and how it distinguishes between a cross-edge (pointing to a different SCC) and a back-edge (pointing within the current SCC).

---

## 5. STRONGLY CONNECTED COMPONENTS (SCC)

```java
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

## 6. MINIMUM SPANNING TREE (MST)

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

## 7. ARTICULATION POINTS AND BRIDGES

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

## 8. EULER PATH AND HAMILTONIAN PATH

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

### Tree & Graph Algorithms - Complexity Summary

**Tree Traversals**:

| Algorithm | Time | Space | Notes |
| --- | --- | --- | --- |
| Preorder/Inorder/Post | O(n) | O(h) | Recursive or iterative |
| Level Order (BFS) | O(n) | O(w) | w = max width |
| Morris Traversal | O(n) | O(1) | Modifies tree temporarily |

**BST Operations**:

| Operation | Average | Worst | Notes |
| --- | --- | --- | --- |
| Search | O(log n) | O(n) | Worst = skewed tree |
| Insert | O(log n) | O(n) | Maintain balance! |
| Delete | O(log n) | O(n) | Three cases |
| Find min/max | O(log n) | O(n) | Follow left/right |

BALANCED TREES (AVL, Red-Black):

| Operation | Time | Space | Notes |
| --- | --- | --- | --- |
| All operations | O(log n) | O(log n) | Guaranteed balanced |
| Rebalancing | O(1) | O(1) | Max 2 rotations (AVL) |

**Graph Traversals**:

| Algorithm | Time | Space | Notes |
| --- | --- | --- | --- |
| BFS | O(V + E) | O(V) | Level-by-level |
| DFS | O(V + E) | O(V) | Depth-first |
| Topological Sort | O(V + E) | O(V) | DAG only |

**Shortest Path**:

| Algorithm | Time | Space | Notes |
| --- | --- | --- | --- |
| BFS (unweighted) | O(V + E) | O(V) | Best for unweighted |
| Dijkstra (binary heap) | O(E log V) | O(V) | Non-negative weights |
| Dijkstra (Fib heap) | O(E+V logV) | O(V) | Rarely implemented |
| Bellman-Ford | O(V × E) | O(V) | Handles negative |
| SPFA | O(V × E) | O(V) | Avg O(kE), k small |
| Floyd-Warshall | O(V³) | O(V²) | All pairs |
| Johnson | O(VE logV) | O(V²) | All pairs, sparse |

**MST**:

| Algorithm | Time | Space | Notes |
| --- | --- | --- | --- |
| Kruskal | O(E log E) | O(V) | Sort + Union-Find |
| Prim (binary heap) | O(E log V) | O(V) | Dense: use matrix |
| Prim (Fib heap) | O(E+V logV) | O(V) | Better for dense |
| Borůvka | O(E log V) | O(V) | Parallelizable |

**Advanced**:

| Algorithm | Time | Space | Notes |
| --- | --- | --- | --- |
| SCC (Tarjan/Kosaraju) | O(V + E) | O(V) | Directed graphs |
| Articulation Points | O(V + E) | O(V) | Cut vertices |
| Bridges | O(V + E) | O(V) | Cut edges |
| LCA (preprocessing) | O(n log n) | O(n log n) | Binary lifting |
| LCA (query) | O(log n) | - | After preprocessing |
| Euler Path | O(E) | O(V + E) | Hierholzer |
| Hamiltonian Path | O(n² 2^n) | O(n 2^n) | DP + bitmask |

## INTERVIEW PROBLEM PATTERNS

**WHEN TO USE WHICH ALGORITHM**

```text
"Find shortest path..."
• Unweighted → BFS
• Positive weights → Dijkstra
• Negative weights → Bellman-Ford
• All pairs → Floyd-Warshall (dense) or Johnson (sparse)

"Find connected components..."
• Undirected → BFS/DFS or Union-Find
• Directed (SCC) → Tarjan or Kosaraju

"Detect cycle..."
• Undirected → DFS with parent tracking or Union-Find
• Directed → DFS with colors (white/gray/black)

"Ordering with dependencies..."
• Topological Sort (Kahn's BFS or DFS postorder)

"Minimum cost to connect all..."
• MST: Kruskal or Prim

"Find LCA..."
• Single query → O(n) recursive
• Multiple queries → Binary lifting O(log n) per query

"Count paths..."
• DAG → Topological sort + DP
• General → DFS with memoization

"Network flow / max matching..."
• Ford-Fulkerson / Edmonds-Karp / Dinic

TREE-SPECIFIC:
• Validate BST → Inorder (should be sorted) or range checking
• Serialize/Deserialize → Preorder + null markers
• Tree DP → Postorder traversal
• Path problems → LCA + path sum
```

---

[Chapter overview](../05e_Graphs_Patterns.md) | [A\* (A-STAR) ALGORITHM — COMPLETE GUIDE →](02_a_a_star_algorithm_complete_guide.md)
