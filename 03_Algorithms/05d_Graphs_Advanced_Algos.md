> **Navigation**: [< Previous Chapter](05c_Graphs_Fundamentals.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next Chapter >](05e_Graphs_Patterns.md)
> 🧠 **Mental Model**: See [Graph & Tree Thinking](../14_Mental_Models/03_Graph_Tree_Thinking.md) — shortest path and MST mental models

---

> **Navigation**: [< Previous Chapter](05c_Graphs_Fundamentals.md) | [Back to Index](../00_MASTER_INDEX.md)

---

# PART 12: Advanced Graph Algorithms

## Bellman-Ford Algorithm (Negative Weights)

```
CONCEPT:
Find shortest paths from source to all vertices.
Works with negative edge weights.
Can detect negative cycles.

TIME: O(V * E)
```

```java
public int[] bellmanFord(int n, int[][] edges, int source) {
    int[] dist = new int[n];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[source] = 0;

    // Relax all edges V-1 times
    for (int i = 0; i < n - 1; i++) {
        boolean updated = false;
        for (int[] edge : edges) {
            int u = edge[0], v = edge[1], w = edge[2];
            if (dist[u] != Integer.MAX_VALUE && dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
                updated = true;
            }
        }
        if (!updated) break;  // Early termination
    }

    // Check for negative cycles
    for (int[] edge : edges) {
        int u = edge[0], v = edge[1], w = edge[2];
        if (dist[u] != Integer.MAX_VALUE && dist[u] + w < dist[v]) {
            return null;  // Negative cycle detected
        }
    }

    return dist;
}
```

## Floyd-Warshall Algorithm (All-Pairs Shortest Path)

```
CONCEPT:
Find shortest paths between ALL pairs of vertices.
Uses dynamic programming.

TIME: O(V³)
SPACE: O(V²)
```

```java
public int[][] floydWarshall(int[][] graph) {
    int n = graph.length;
    int[][] dist = new int[n][n];

    // Initialize
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            dist[i][j] = graph[i][j];
        }
    }

    // Try each vertex as intermediate
    for (int k = 0; k < n; k++) {
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                if (dist[i][k] != Integer.MAX_VALUE &&
                    dist[k][j] != Integer.MAX_VALUE &&
                    dist[i][k] + dist[k][j] < dist[i][j]) {
                    dist[i][j] = dist[i][k] + dist[k][j];
                }
            }
        }
    }

    return dist;
}

// Visual for k=1 (using vertex 1 as intermediate):
// dist[0][2] = min(dist[0][2], dist[0][1] + dist[1][2])
```

## Minimum Spanning Tree - Prim's Algorithm

```java
public int primMST(int n, List<int[]>[] graph) {
    boolean[] inMST = new boolean[n];
    // PQ: [weight, node]
    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] - b[0]);
    pq.offer(new int[]{0, 0});  // Start from node 0

    int totalWeight = 0;
    int edgesAdded = 0;

    while (!pq.isEmpty() && edgesAdded < n) {
        int[] curr = pq.poll();
        int weight = curr[0], node = curr[1];

        if (inMST[node]) continue;

        inMST[node] = true;
        totalWeight += weight;
        edgesAdded++;

        for (int[] edge : graph[node]) {
            int neighbor = edge[0], edgeWeight = edge[1];
            if (!inMST[neighbor]) {
                pq.offer(new int[]{edgeWeight, neighbor});
            }
        }
    }

    return edgesAdded == n ? totalWeight : -1;
}
```

## Minimum Spanning Tree - Kruskal's Algorithm

```java
public int kruskalMST(int n, int[][] edges) {
    // Sort edges by weight
    Arrays.sort(edges, (a, b) -> a[2] - b[2]);

    UnionFind uf = new UnionFind(n);
    int totalWeight = 0;
    int edgesAdded = 0;

    for (int[] edge : edges) {
        int u = edge[0], v = edge[1], w = edge[2];

        if (uf.union(u, v)) {
            totalWeight += w;
            edgesAdded++;
            if (edgesAdded == n - 1) break;
        }
    }

    return edgesAdded == n - 1 ? totalWeight : -1;
}
```

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

# PART 13: Graph Problem Patterns

## Pattern 1: Multi-Source BFS

```java
// Find distance from any '0' cell to each cell in grid
public int[][] multiSourceBFS(int[][] grid) {
    int m = grid.length, n = grid[0].length;
    int[][] dist = new int[m][n];
    Queue<int[]> queue = new LinkedList<>();

    // Add all sources to queue initially
    for (int i = 0; i < m; i++) {
        for (int j = 0; j < n; j++) {
            if (grid[i][j] == 0) {
                queue.offer(new int[]{i, j});
                dist[i][j] = 0;
            } else {
                dist[i][j] = Integer.MAX_VALUE;
            }
        }
    }

    int[][] dirs = {{0, 1}, {0, -1}, {1, 0}, {-1, 0}};

    while (!queue.isEmpty()) {
        int[] cell = queue.poll();
        int x = cell[0], y = cell[1];

        for (int[] dir : dirs) {
            int nx = x + dir[0], ny = y + dir[1];
            if (nx >= 0 && nx < m && ny >= 0 && ny < n &&
                dist[x][y] + 1 < dist[nx][ny]) {
                dist[nx][ny] = dist[x][y] + 1;
                queue.offer(new int[]{nx, ny});
            }
        }
    }

    return dist;
}
```

## Pattern 2: Bidirectional BFS

```java
// Word Ladder: Find shortest transformation sequence
public int ladderLength(String beginWord, String endWord, List<String> wordList) {
    Set<String> dict = new HashSet<>(wordList);
    if (!dict.contains(endWord)) return 0;

    Set<String> startSet = new HashSet<>();
    Set<String> endSet = new HashSet<>();
    startSet.add(beginWord);
    endSet.add(endWord);

    int length = 1;

    while (!startSet.isEmpty() && !endSet.isEmpty()) {
        // Always expand smaller set
        if (startSet.size() > endSet.size()) {
            Set<String> temp = startSet;
            startSet = endSet;
            endSet = temp;
        }

        Set<String> nextSet = new HashSet<>();

        for (String word : startSet) {
            char[] chars = word.toCharArray();

            for (int i = 0; i < chars.length; i++) {
                char original = chars[i];

                for (char c = 'a'; c <= 'z'; c++) {
                    if (c == original) continue;
                    chars[i] = c;
                    String newWord = new String(chars);

                    if (endSet.contains(newWord)) {
                        return length + 1;
                    }

                    if (dict.contains(newWord)) {
                        nextSet.add(newWord);
                        dict.remove(newWord);
                    }
                }

                chars[i] = original;
            }
        }

        startSet = nextSet;
        length++;
    }

    return 0;
}
```

## Pattern 3: Topological Sort with Kahn's Algorithm

```java
// Course Schedule II: Return order to take courses
public int[] findOrder(int numCourses, int[][] prerequisites) {
    List<List<Integer>> adj = new ArrayList<>();
    int[] inDegree = new int[numCourses];

    for (int i = 0; i < numCourses; i++) {
        adj.add(new ArrayList<>());
    }

    for (int[] pre : prerequisites) {
        adj.get(pre[1]).add(pre[0]);
        inDegree[pre[0]]++;
    }

    Queue<Integer> queue = new LinkedList<>();
    for (int i = 0; i < numCourses; i++) {
        if (inDegree[i] == 0) {
            queue.offer(i);
        }
    }

    int[] result = new int[numCourses];
    int index = 0;

    while (!queue.isEmpty()) {
        int course = queue.poll();
        result[index++] = course;

        for (int next : adj.get(course)) {
            if (--inDegree[next] == 0) {
                queue.offer(next);
            }
        }
    }

    return index == numCourses ? result : new int[0];
}
```

## Pattern 4: Cycle Detection in Directed Graph (Three Colors)

```java
public boolean hasCycle(int n, List<List<Integer>> adj) {
    int[] color = new int[n];  // 0: white, 1: gray, 2: black

    for (int i = 0; i < n; i++) {
        if (color[i] == 0 && dfs(i, adj, color)) {
            return true;
        }
    }

    return false;
}

private boolean dfs(int node, List<List<Integer>> adj, int[] color) {
    color[node] = 1;  // Mark as visiting (gray)

    for (int neighbor : adj.get(node)) {
        if (color[neighbor] == 1) return true;  // Back edge = cycle
        if (color[neighbor] == 0 && dfs(neighbor, adj, color)) {
            return true;
        }
    }

    color[node] = 2;  // Mark as visited (black)
    return false;
}
```

---

---

# PART 15: Complete Graph Problems with Solutions

## Problem 1: Clone Graph

```java
public Node cloneGraph(Node node) {
    if (node == null) return null;

    Map<Node, Node> visited = new HashMap<>();
    return clone(node, visited);
}

private Node clone(Node node, Map<Node, Node> visited) {
    if (visited.containsKey(node)) {
        return visited.get(node);
    }

    Node copy = new Node(node.val);
    visited.put(node, copy);

    for (Node neighbor : node.neighbors) {
        copy.neighbors.add(clone(neighbor, visited));
    }

    return copy;
}
```

## Problem 2: Pacific Atlantic Water Flow

```java
public List<List<Integer>> pacificAtlantic(int[][] heights) {
    int m = heights.length, n = heights[0].length;
    boolean[][] pacific = new boolean[m][n];
    boolean[][] atlantic = new boolean[m][n];

    // Start from edges and work inward
    for (int i = 0; i < m; i++) {
        dfs(heights, pacific, i, 0);       // Pacific left edge
        dfs(heights, atlantic, i, n - 1);  // Atlantic right edge
    }
    for (int j = 0; j < n; j++) {
        dfs(heights, pacific, 0, j);       // Pacific top edge
        dfs(heights, atlantic, m - 1, j);  // Atlantic bottom edge
    }

    List<List<Integer>> result = new ArrayList<>();
    for (int i = 0; i < m; i++) {
        for (int j = 0; j < n; j++) {
            if (pacific[i][j] && atlantic[i][j]) {
                result.add(Arrays.asList(i, j));
            }
        }
    }

    return result;
}

private void dfs(int[][] heights, boolean[][] visited, int i, int j) {
    int m = heights.length, n = heights[0].length;
    visited[i][j] = true;

    int[][] dirs = {{0, 1}, {0, -1}, {1, 0}, {-1, 0}};
    for (int[] dir : dirs) {
        int ni = i + dir[0], nj = j + dir[1];
        if (ni >= 0 && ni < m && nj >= 0 && nj < n &&
            !visited[ni][nj] && heights[ni][nj] >= heights[i][j]) {
            dfs(heights, visited, ni, nj);
        }
    }
}
```

## Problem 3: Network Delay Time (Dijkstra)

```java
public int networkDelayTime(int[][] times, int n, int k) {
    // Build adjacency list
    List<int[]>[] graph = new ArrayList[n + 1];
    for (int i = 0; i <= n; i++) {
        graph[i] = new ArrayList<>();
    }
    for (int[] time : times) {
        graph[time[0]].add(new int[]{time[1], time[2]});
    }

    // Dijkstra
    int[] dist = new int[n + 1];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[k] = 0;

    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[1] - b[1]);
    pq.offer(new int[]{k, 0});

    while (!pq.isEmpty()) {
        int[] curr = pq.poll();
        int node = curr[0], time = curr[1];

        if (time > dist[node]) continue;

        for (int[] edge : graph[node]) {
            int next = edge[0], weight = edge[1];
            if (dist[node] + weight < dist[next]) {
                dist[next] = dist[node] + weight;
                pq.offer(new int[]{next, dist[next]});
            }
        }
    }

    int maxTime = 0;
    for (int i = 1; i <= n; i++) {
        if (dist[i] == Integer.MAX_VALUE) return -1;
        maxTime = Math.max(maxTime, dist[i]);
    }

    return maxTime;
}
```

## Problem 4: Cheapest Flights Within K Stops

```java
public int findCheapestPrice(int n, int[][] flights, int src, int dst, int k) {
    // BFS with level tracking (Bellman-Ford style)
    int[] dist = new int[n];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[src] = 0;

    for (int i = 0; i <= k; i++) {
        int[] temp = dist.clone();
        for (int[] flight : flights) {
            int u = flight[0], v = flight[1], price = flight[2];
            if (dist[u] != Integer.MAX_VALUE) {
                temp[v] = Math.min(temp[v], dist[u] + price);
            }
        }
        dist = temp;
    }

    return dist[dst] == Integer.MAX_VALUE ? -1 : dist[dst];
}
```

---

---

---

# 🔬 PART FINAL: ADVANCED TREE & GRAPH ALGORITHMS - DEEP DIVE

## ADVANCED TREE ALGORITHMS

### 1. LOWEST COMMON ANCESTOR (LCA) - MULTIPLE APPROACHES

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    LCA ALGORITHMS - COMPLETE COMPARISON                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Problem: Find the lowest common ancestor of two nodes p and q in a tree        │
│                                                                                 │
│  Tree:         3                                                                │
│              /   \                                                              │
│             5     1                                                             │
│            / \   / \                                                            │
│           6   2 0   8                                                           │
│              / \                                                                │
│             7   4                                                               │
│                                                                                 │
│  LCA(5, 1) = 3                                                                  │
│  LCA(5, 4) = 5                                                                  │
│  LCA(6, 4) = 5                                                                  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

```java
// APPROACH 1: RECURSIVE (O(n) time, O(h) space)
// Works for general binary tree
public TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {
    // Base case: null or found p or q
    if (root == null || root == p || root == q) {
        return root;
    }

    // Search in both subtrees
    TreeNode left = lowestCommonAncestor(root.left, p, q);
    TreeNode right = lowestCommonAncestor(root.right, p, q);

    // If both sides found something, root is LCA
    if (left != null && right != null) {
        return root;
    }

    // Otherwise, LCA is on the side that found something
    return left != null ? left : right;
}

/*
 * TRACE for LCA(5, 4):
 *
 * lowestCommonAncestor(3, 5, 4)
 *   ├─ lowestCommonAncestor(5, 5, 4) = 5 (found 5!)
 *   │    └─ (short-circuits, returns immediately)
 *   └─ lowestCommonAncestor(1, 5, 4) = null
 *
 * left = 5, right = null
 * Return: 5 (the LCA!)
 */

// APPROACH 2: ITERATIVE WITH PARENT POINTERS
// O(n) time, O(n) space
public TreeNode lcaWithParents(TreeNode root, TreeNode p, TreeNode q) {
    Map<TreeNode, TreeNode> parent = new HashMap<>();
    Deque<TreeNode> stack = new ArrayDeque<>();

    parent.put(root, null);
    stack.push(root);

    // Build parent map until both p and q are found
    while (!parent.containsKey(p) || !parent.containsKey(q)) {
        TreeNode node = stack.pop();
        if (node.left != null) {
            parent.put(node.left, node);
            stack.push(node.left);
        }
        if (node.right != null) {
            parent.put(node.right, node);
            stack.push(node.right);
        }
    }

    // Collect ancestors of p
    Set<TreeNode> ancestors = new HashSet<>();
    while (p != null) {
        ancestors.add(p);
        p = parent.get(p);
    }

    // First ancestor of q that's also ancestor of p is LCA
    while (!ancestors.contains(q)) {
        q = parent.get(q);
    }

    return q;
}

// APPROACH 3: FOR BST (O(h) time, O(1) space)
public TreeNode lcaBST(TreeNode root, TreeNode p, TreeNode q) {
    while (root != null) {
        if (p.val < root.val && q.val < root.val) {
            root = root.left;   // Both in left subtree
        } else if (p.val > root.val && q.val > root.val) {
            root = root.right;  // Both in right subtree
        } else {
            return root;        // Split point = LCA
        }
    }
    return null;
}

// APPROACH 4: BINARY LIFTING (For multiple LCA queries)
// Preprocessing: O(n log n)
// Each query: O(log n)
class LCABinaryLifting {
    int[][] parent;  // parent[i][j] = 2^j-th ancestor of node i
    int[] depth;
    int LOG;

    public void preprocess(int n, int[][] edges) {
        LOG = (int)(Math.log(n) / Math.log(2)) + 1;
        parent = new int[n][LOG];
        depth = new int[n];

        // Build tree and compute depths
        List<List<Integer>> adj = buildAdjList(n, edges);
        dfs(0, -1, 0, adj);

        // Binary lifting table
        for (int j = 1; j < LOG; j++) {
            for (int i = 0; i < n; i++) {
                if (parent[i][j-1] != -1) {
                    parent[i][j] = parent[parent[i][j-1]][j-1];
                } else {
                    parent[i][j] = -1;
                }
            }
        }
    }

    private void dfs(int u, int par, int d, List<List<Integer>> adj) {
        parent[u][0] = par;
        depth[u] = d;
        for (int v : adj.get(u)) {
            if (v != par) {
                dfs(v, u, d + 1, adj);
            }
        }
    }

    public int lca(int u, int v) {
        // Make u deeper
        if (depth[u] < depth[v]) {
            int temp = u; u = v; v = temp;
        }

        // Lift u to same depth as v
        int diff = depth[u] - depth[v];
        for (int j = 0; j < LOG; j++) {
            if (((diff >> j) & 1) == 1) {
                u = parent[u][j];
            }
        }

        if (u == v) return u;

        // Lift both until they meet
        for (int j = LOG - 1; j >= 0; j--) {
            if (parent[u][j] != parent[v][j]) {
                u = parent[u][j];
                v = parent[v][j];
            }
        }

        return parent[u][0];
    }
}
```

### 2. TREE DIAMETER AND CENTER

```java
/*
 * TREE DIAMETER: Longest path between any two nodes
 *
 *           1
 *          /|\
 *         2 3 4
 *        /|   |
 *       5 6   7
 *      /
 *     8
 *
 * Diameter = path from 8 to 7 = 5 edges
 */

// APPROACH 1: Two BFS (works for general tree)
// O(n) time, O(n) space
public int treeDiameter(int n, int[][] edges) {
    List<List<Integer>> adj = buildAdjList(n, edges);

    // BFS from any node to find farthest node (one endpoint)
    int farthest = bfsGetFarthest(0, adj, n);

    // BFS from that node to find diameter
    return bfsGetMaxDist(farthest, adj, n);
}

private int bfsGetFarthest(int start, List<List<Integer>> adj, int n) {
    int[] dist = new int[n];
    Arrays.fill(dist, -1);
    Queue<Integer> queue = new ArrayDeque<>();
    queue.offer(start);
    dist[start] = 0;

    int farthest = start;
    while (!queue.isEmpty()) {
        int u = queue.poll();
        for (int v : adj.get(u)) {
            if (dist[v] == -1) {
                dist[v] = dist[u] + 1;
                queue.offer(v);
                if (dist[v] > dist[farthest]) {
                    farthest = v;
                }
            }
        }
    }
    return farthest;
}

// For Binary Tree: DFS approach
// O(n) time, O(h) space
int diameter = 0;

public int diameterOfBinaryTree(TreeNode root) {
    depth(root);
    return diameter;
}

private int depth(TreeNode node) {
    if (node == null) return 0;

    int left = depth(node.left);
    int right = depth(node.right);

    // Diameter passing through this node
    diameter = Math.max(diameter, left + right);

    // Return depth of this subtree
    return 1 + Math.max(left, right);
}

/*
 * TREE CENTER: Node(s) that minimize max distance to any other node
 *
 * For a tree, center is either:
 * - Middle node of diameter (if diameter is even)
 * - Two middle nodes (if diameter is odd)
 *
 * ALGORITHM: Remove leaves layer by layer until 1 or 2 nodes remain
 */

public List<Integer> findCenter(int n, int[][] edges) {
    if (n == 1) return Arrays.asList(0);

    List<Set<Integer>> adj = new ArrayList<>();
    for (int i = 0; i < n; i++) adj.add(new HashSet<>());

    for (int[] edge : edges) {
        adj.get(edge[0]).add(edge[1]);
        adj.get(edge[1]).add(edge[0]);
    }

    // Start with leaves
    Queue<Integer> leaves = new ArrayDeque<>();
    for (int i = 0; i < n; i++) {
        if (adj.get(i).size() == 1) {
            leaves.offer(i);
        }
    }

    int remaining = n;
    while (remaining > 2) {
        int leafCount = leaves.size();
        remaining -= leafCount;

        for (int i = 0; i < leafCount; i++) {
            int leaf = leaves.poll();
            int neighbor = adj.get(leaf).iterator().next();
            adj.get(neighbor).remove(leaf);

            if (adj.get(neighbor).size() == 1) {
                leaves.offer(neighbor);
            }
        }
    }

    return new ArrayList<>(leaves);
}
```

### 3. TREE DP - COMPREHENSIVE PATTERNS

```java
/*
 * TREE DP PATTERN: Compute answer for each subtree
 *
 * Common patterns:
 * 1. Root-to-leaf: Pass information DOWN
 * 2. Leaf-to-root: Return information UP
 * 3. Rerooting: Combine both directions
 */

// PATTERN 1: House Robber III
// Can't rob two directly connected houses
public int rob(TreeNode root) {
    int[] result = robHelper(root);
    return Math.max(result[0], result[1]);
}

// Returns [maxWithoutRoot, maxWithRoot]
private int[] robHelper(TreeNode node) {
    if (node == null) return new int[]{0, 0};

    int[] left = robHelper(node.left);
    int[] right = robHelper(node.right);

    // Without current node: take max of children (can include or exclude them)
    int without = Math.max(left[0], left[1]) + Math.max(right[0], right[1]);

    // With current node: must exclude children's values
    int with = node.val + left[0] + right[0];

    return new int[]{without, with};
}

// PATTERN 2: Binary Tree Maximum Path Sum
// Path can start and end anywhere
int maxPathSum = Integer.MIN_VALUE;

public int maxPathSum(TreeNode root) {
    maxGain(root);
    return maxPathSum;
}

private int maxGain(TreeNode node) {
    if (node == null) return 0;

    // Max gain from left and right (ignore negative)
    int leftGain = Math.max(maxGain(node.left), 0);
    int rightGain = Math.max(maxGain(node.right), 0);

    // Path through current node
    int pathSum = node.val + leftGain + rightGain;
    maxPathSum = Math.max(maxPathSum, pathSum);

    // Return max gain if continuing upward
    return node.val + Math.max(leftGain, rightGain);
}

// PATTERN 3: Rerooting DP
// Find sum of distances from each node to all other nodes
public int[] sumOfDistancesInTree(int n, int[][] edges) {
    List<List<Integer>> adj = new ArrayList<>();
    for (int i = 0; i < n; i++) adj.add(new ArrayList<>());

    for (int[] edge : edges) {
        adj.get(edge[0]).add(edge[1]);
        adj.get(edge[1]).add(edge[0]);
    }

    int[] count = new int[n];  // Subtree size
    int[] result = new int[n]; // Sum of distances

    // DFS 1: Calculate for root 0
    dfs1(0, -1, adj, count, result);

    // DFS 2: Reroot to calculate for all nodes
    dfs2(0, -1, adj, count, result, n);

    return result;
}

private void dfs1(int u, int parent, List<List<Integer>> adj,
                  int[] count, int[] result) {
    count[u] = 1;
    for (int v : adj.get(u)) {
        if (v != parent) {
            dfs1(v, u, adj, count, result);
            count[u] += count[v];
            result[u] += result[v] + count[v];
        }
    }
}

private void dfs2(int u, int parent, List<List<Integer>> adj,
                  int[] count, int[] result, int n) {
    for (int v : adj.get(u)) {
        if (v != parent) {
            // Moving root from u to v:
            // - count[v] nodes get 1 closer
            // - (n - count[v]) nodes get 1 farther
            result[v] = result[u] - count[v] + (n - count[v]);
            dfs2(v, u, adj, count, result, n);
        }
    }
}
```

## ADVANCED GRAPH ALGORITHMS

### 4. TOPOLOGICAL SORT - ALL APPROACHES

```java
/*
 * TOPOLOGICAL SORT: Linear ordering where for every edge (u,v), u comes before v
 * Only works for DAG (Directed Acyclic Graph)
 *
 *     5 → 2 → 3
 *     ↓   ↓   ↓
 *     0 ← 4 → 1
 *
 * Valid orderings: [5, 4, 2, 3, 1, 0], [5, 4, 0, 2, 3, 1], etc.
 */

// APPROACH 1: Kahn's Algorithm (BFS, uses in-degree)
public int[] topologicalSortKahn(int n, int[][] edges) {
    List<List<Integer>> adj = new ArrayList<>();
    int[] inDegree = new int[n];

    for (int i = 0; i < n; i++) adj.add(new ArrayList<>());

    for (int[] edge : edges) {
        adj.get(edge[0]).add(edge[1]);
        inDegree[edge[1]]++;
    }

    Queue<Integer> queue = new ArrayDeque<>();
    for (int i = 0; i < n; i++) {
        if (inDegree[i] == 0) queue.offer(i);
    }

    int[] result = new int[n];
    int index = 0;

    while (!queue.isEmpty()) {
        int u = queue.poll();
        result[index++] = u;

        for (int v : adj.get(u)) {
            if (--inDegree[v] == 0) {
                queue.offer(v);
            }
        }
    }

    // If not all nodes included, cycle exists
    return index == n ? result : new int[0];
}

// APPROACH 2: DFS with reverse postorder
public int[] topologicalSortDFS(int n, int[][] edges) {
    List<List<Integer>> adj = new ArrayList<>();
    for (int i = 0; i < n; i++) adj.add(new ArrayList<>());

    for (int[] edge : edges) {
        adj.get(edge[0]).add(edge[1]);
    }

    int[] visited = new int[n];  // 0=unvisited, 1=visiting, 2=visited
    Deque<Integer> stack = new ArrayDeque<>();

    for (int i = 0; i < n; i++) {
        if (visited[i] == 0) {
            if (!dfs(i, adj, visited, stack)) {
                return new int[0];  // Cycle detected
            }
        }
    }

    int[] result = new int[n];
    int index = 0;
    while (!stack.isEmpty()) {
        result[index++] = stack.pop();
    }
    return result;
}

private boolean dfs(int u, List<List<Integer>> adj,
                   int[] visited, Deque<Integer> stack) {
    visited[u] = 1;  // Visiting

    for (int v : adj.get(u)) {
        if (visited[v] == 1) return false;  // Back edge = cycle
        if (visited[v] == 0 && !dfs(v, adj, visited, stack)) {
            return false;
        }
    }

    visited[u] = 2;  // Visited
    stack.push(u);   // Add to result in reverse postorder
    return true;
}
```

### 5. STRONGLY CONNECTED COMPONENTS (SCC)

```
SCC: Maximal set of vertices where EVERY vertex is
reachable from EVERY other vertex in the set

   ┌──→ 1 ──→ 2 ──┐        SCCs: {0}, {1, 2, 3, 4}
   │    ↑    ↓    │
   0    │    3    │        WHY IT MATTERS:
        │    ↓    │        - 2-SAT satisfiability
        └─── 4 ←──┘        - Dead code elimination
                            - Social network clusters
                            - Condensing digraph to DAG
TIME: O(V + E)   SPACE: O(V)
```

#### Kosaraju's Algorithm (Two-Pass DFS)
```
IDEA: If we reverse ALL edges, the SCCs remain the same.
1. DFS on original graph → record finish order
2. DFS on REVERSED graph in reverse finish order → each DFS tree = one SCC
```

```java
public class KosarajuSCC {
    public List<List<Integer>> findSCCs(int n, int[][] edges) {
        List<List<Integer>> adj = new ArrayList<>(), radj = new ArrayList<>();
        for (int i = 0; i < n; i++) { adj.add(new ArrayList<>()); radj.add(new ArrayList<>()); }
        for (int[] e : edges) { adj.get(e[0]).add(e[1]); radj.get(e[1]).add(e[0]); }

        // Pass 1: DFS on original → collect finish order
        boolean[] visited = new boolean[n];
        Deque<Integer> order = new ArrayDeque<>();
        for (int i = 0; i < n; i++)
            if (!visited[i]) dfs1(i, adj, visited, order);

        // Pass 2: DFS on reversed in reverse finish order
        visited = new boolean[n];
        List<List<Integer>> sccs = new ArrayList<>();
        while (!order.isEmpty()) {
            int u = order.pop();
            if (!visited[u]) {
                List<Integer> scc = new ArrayList<>();
                dfs2(u, radj, visited, scc);
                sccs.add(scc);
            }
        }
        return sccs;
    }

    private void dfs1(int u, List<List<Integer>> adj, boolean[] vis, Deque<Integer> order) {
        vis[u] = true;
        for (int v : adj.get(u)) if (!vis[v]) dfs1(v, adj, vis, order);
        order.push(u);
    }

    private void dfs2(int u, List<List<Integer>> radj, boolean[] vis, List<Integer> scc) {
        vis[u] = true;
        scc.add(u);
        for (int v : radj.get(u)) if (!vis[v]) dfs2(v, radj, vis, scc);
    }
}
```

#### Tarjan's Algorithm (Single-Pass DFS with Low-Link)
```
IDEA: Use discovery time + low-link value. A node is SCC root
when its low-link equals its own id. Pop stack to get the SCC.
```

```java
public class TarjanSCC {
    private int id = 0, sccCount = 0;
    private int[] ids, low;
    private boolean[] onStack;
    private Deque<Integer> stack = new ArrayDeque<>();
    private List<List<Integer>> sccs = new ArrayList<>();

    public List<List<Integer>> findSCCs(int n, List<List<Integer>> adj) {
        ids = new int[n]; low = new int[n]; onStack = new boolean[n];
        Arrays.fill(ids, -1);
        for (int i = 0; i < n; i++)
            if (ids[i] == -1) dfs(i, adj);
        return sccs;
    }

    private void dfs(int at, List<List<Integer>> adj) {
        ids[at] = low[at] = id++;
        stack.push(at);
        onStack[at] = true;

        for (int to : adj.get(at)) {
            if (ids[to] == -1) {
                dfs(to, adj);
                low[at] = Math.min(low[at], low[to]);
            } else if (onStack[to]) {
                low[at] = Math.min(low[at], ids[to]);
            }
        }

        if (ids[at] == low[at]) {  // Root of SCC
            List<Integer> scc = new ArrayList<>();
            while (true) {
                int node = stack.pop();
                onStack[node] = false;
                scc.add(node);
                if (node == at) break;
            }
            sccs.add(scc);
            sccCount++;
        }
    }
}
```

#### Kosaraju vs Tarjan — When to Use Which
```
╔══════════════╦══════════════════════════════╦═══════════════════════════════╗
║              ║ Kosaraju                     ║ Tarjan                        ║
╠══════════════╬══════════════════════════════╬═══════════════════════════════╣
║ Passes       ║ 2 DFS passes                ║ 1 DFS pass                     ║
║ Extra memory ║ Reversed graph O(V+E)        ║ Stack + low-link arrays O(V)  ║
║ Simpler code ║ ✓ (two simple DFS)          ║ ✗ (low-link logic tricky)      ║
║ Better for   ║ Dense graphs, simple impl    ║ Online/streaming, less memory ║
║ 2-SAT        ║ Commonly used                ║ Also works                    ║
╚══════════════╩══════════════════════════════╩═══════════════════════════════╝
```

#### 2-SAT via SCC
```
CONCEPT: Determine if boolean formula (x₁ OR x₂) AND (¬x₃ OR x₄) ...
is satisfiable when each clause has exactly 2 literals.

KEY INSIGHT:
  (a OR b) ≡ (¬a → b) AND (¬b → a)

Build implication graph → Find SCCs
If xᵢ and ¬xᵢ are in SAME SCC → UNSATISFIABLE
Otherwise: xᵢ = true if SCC(xᵢ) has higher topological order than SCC(¬xᵢ)
```

### 6. A* SEARCH ALGORITHM

```
╔════════════════════════════════════════════════════════════════╗
║  A*: Best-first search with heuristic guidance                 ║
║                                                                ║
║  f(n) = g(n) + h(n)                                            ║
║         ↑         ↑                                            ║
║    actual cost   heuristic (estimated cost to goal)            ║
║    from start                                                  ║
║                                                                ║
║  GUARANTEE: If h(n) is admissible (never overestimates)        ║
║             AND consistent (h(a) ≤ cost(a,b) + h(b))           ║
║             → A* finds the OPTIMAL path                        ║
║                                                                ║
║  TIME: O(E) in best case, O(b^d) worst case                    ║
║  SPACE: O(V)                                                   ║
║                                                                ║
║  USE CASES:                                                    ║
║  - Grid shortest path (game AI, robotics)                      ║
║  - Navigation / GPS routing                                    ║
║  - Sliding puzzle (15-puzzle)                                  ║
╚════════════════════════════════════════════════════════════════╝
```

#### A* vs Dijkstra — The Key Difference
```
Dijkstra explores in ALL directions (expanding circle):

     . . . . .
     . . * . .    * = start, G = goal
     . . . . .    Dijkstra checks ALL dots
     . . . G .

A* uses heuristic to focus toward goal (expanding cone):

     . . . . .
     . . * → .    A* focuses toward G
     . . . ↘ .    Fewer nodes explored!
     . . . G .

Same result, fewer expansions → FASTER in practice
```

```java
public class AStar {
    // Grid-based A* (most common interview variant)
    static int[][] dirs = {{0,1},{0,-1},{1,0},{-1,0}};

    public int shortestPath(int[][] grid, int[] start, int[] goal) {
        int m = grid.length, n = grid[0].length;
        int[][] gScore = new int[m][n];
        for (int[] row : gScore) Arrays.fill(row, Integer.MAX_VALUE);
        gScore[start[0]][start[1]] = 0;

        // PQ ordered by f(n) = g(n) + h(n)
        PriorityQueue<int[]> pq = new PriorityQueue<>(
            (a, b) -> (gScore[a[0]][a[1]] + heuristic(a, goal))
                     - (gScore[b[0]][b[1]] + heuristic(b, goal))
        );
        pq.offer(start);

        while (!pq.isEmpty()) {
            int[] cur = pq.poll();
            int r = cur[0], c = cur[1];

            if (r == goal[0] && c == goal[1]) return gScore[r][c];

            for (int[] d : dirs) {
                int nr = r + d[0], nc = c + d[1];
                if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;
                if (grid[nr][nc] == 1) continue;  // Wall

                int newG = gScore[r][c] + 1;  // Edge weight = 1 for grid
                if (newG < gScore[nr][nc]) {
                    gScore[nr][nc] = newG;
                    pq.offer(new int[]{nr, nc});
                }
            }
        }
        return -1;  // No path
    }

    // Manhattan distance heuristic (admissible for 4-directional grid)
    private int heuristic(int[] a, int[] b) {
        return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
    }
}
```

#### Common Heuristics
```
╔════════════════════╦══════════════════════════════════════════╗
║ Heuristic          ║ When to Use                              ║
╠════════════════════╬══════════════════════════════════════════╣
║ Manhattan distance ║ 4-directional grid (up/down/left/right)  ║
║ |x₁-x₂| + |y₁-y₂|║                                            ║
╠════════════════════╬══════════════════════════════════════════╣
║ Euclidean distance ║ 8-directional or free movement           ║
║ √((x₁-x₂)²+(y₁-y₂)²)                                          ║
╠════════════════════╬══════════════════════════════════════════╣
║ Chebyshev distance ║ 8-directional grid (king moves)          ║
║ max(|x₁-x₂|,|y₁-y₂|)                                          ║
╠════════════════════╬══════════════════════════════════════════╣
║ h(n) = 0          ║ Degenerates to Dijkstra (always safe)     ║
╚════════════════════╩══════════════════════════════════════════╝
```

### Curated Practice — Advanced Graph Algorithms
```
╔════╦══════════════════════════════════════════════════════════════╦═══════════════════════════════════════════════╗
║  # ║ Problem                                                     ║ Diff.                                          ║
╠════╬══════════════════════════════════════════════════════════════╬═══════════════════════════════════════════════╣
║  1 ║ Critical Connections (LC 1192)                               ║ Hard                                          ║
║    ║ https://leetcode.com/problems/critical-connections-in-a-network/ ║                                           ║
╠════╬══════════════════════════════════════════════════════════════╬═══════════════════════════════════════════════╣
║  2 ║ Shortest Path in Binary Matrix (LC 1091)                    ║ Medium                                         ║
║    ║ https://leetcode.com/problems/shortest-path-in-binary-matrix/ ║                                              ║
╠════╬══════════════════════════════════════════════════════════════╬═══════════════════════════════════════════════╣
║  3 ║ Network Delay Time (LC 743)                                 ║ Medium                                         ║
║    ║ https://leetcode.com/problems/network-delay-time/            ║                                               ║
╠════╬══════════════════════════════════════════════════════════════╬═══════════════════════════════════════════════╣
║  4 ║ Cheapest Flights Within K Stops (LC 787)                    ║ Medium                                         ║
║    ║ https://leetcode.com/problems/cheapest-flights-within-k-stops/ ║                                             ║
╠════╬══════════════════════════════════════════════════════════════╬═══════════════════════════════════════════════╣
║  5 ║ Course Schedule II (LC 210) — Topo Sort                     ║ Medium                                         ║
║    ║ https://leetcode.com/problems/course-schedule-ii/            ║                                               ║
╠════╬══════════════════════════════════════════════════════════════╬═══════════════════════════════════════════════╣
║  6 ║ Path with Maximum Probability (LC 1514) — Max Dijkstra      ║ Medium                                         ║
║    ║ https://leetcode.com/problems/path-with-maximum-probability/ ║                                               ║
╠════╬══════════════════════════════════════════════════════════════╬═══════════════════════════════════════════════╣
║  7 ║ Minimum Cost to Make at Least One Valid Path (LC 1368)      ║ Hard                                           ║
║    ║ https://leetcode.com/problems/minimum-cost-to-make-at-least-one-valid-path-in-a-grid/ ║                      ║
╠════╬══════════════════════════════════════════════════════════════╬═══════════════════════════════════════════════╣
║  8 ║ Redundant Connection II (LC 685) — Directed graph cycle     ║ Hard                                           ║
║    ║ https://leetcode.com/problems/redundant-connection-ii/       ║                                               ║
╠════╬══════════════════════════════════════════════════════════════╬═══════════════════════════════════════════════╣
║  9 ║ Swim in Rising Water (LC 778) — Binary Search + BFS/UF     ║ Hard                                            ║
║    ║ https://leetcode.com/problems/swim-in-rising-water/          ║                                               ║
╠════╬══════════════════════════════════════════════════════════════╬═══════════════════════════════════════════════╣
║ 10 ║ Find the City (LC 1334) — Floyd-Warshall                   ║ Medium                                          ║
║    ║ https://leetcode.com/problems/find-the-city-with-the-smallest-number-of-neighbors-at-a-threshold-distance/ ║ ║
╚════╩══════════════════════════════════════════════════════════════╩═══════════════════════════════════════════════╝
```
