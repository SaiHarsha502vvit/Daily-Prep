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
│                    LCA ALGORITHMS - COMPLETE COMPARISON                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Problem: Find the lowest common ancestor of two nodes p and q in a tree        │
│                                                                                  │
│  Tree:         3                                                                 │
│              /   \                                                               │
│             5     1                                                              │
│            / \   / \                                                             │
│           6   2 0   8                                                            │
│              / \                                                                 │
│             7   4                                                                │
│                                                                                  │
│  LCA(5, 1) = 3                                                                   │
│  LCA(5, 4) = 5                                                                   │
│  LCA(6, 4) = 5                                                                   │
│                                                                                  │
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

```java
/*
 * SCC: Maximal set of vertices where every vertex is reachable from every other
 *
 *     ┌──→ 1 ──→ 2 ──┐
 *     │    ↑    ↓    │
 *     0    │    3    │
 *          │    ↓    │
 *          └─── 4 ←──┘
 *
 * SCCs: {0}, {1, 2, 3, 4}
 */

// KOSARAJU'S ALGORITHM: O(V + E)
public List<List<Integer>> findSCCs(int n, int[][] edges) {
    // Build adjacency list and reverse graph
    List<List<Integer>> adj = new ArrayList<>();
    List<List<Integer>> radj = new ArrayList<>();  // Reversed

    for (int i = 0; i < n; i++) {
        adj.add(new ArrayList<>());
        radj.add(new ArrayList<>());
    }

    for (int[] edge : edges) {
        adj.get(edge[0]).add(edge[1]);
        radj.get(edge[1]).add(edge[0]);  // Reversed
    }

    // Step 1: DFS on original graph, collect finish order
    boolean[] visited = new boolean[n];
    Deque<Integer> finishOrder = new ArrayDeque<>();

    for (int i = 0; i < n; i++) {
        if (!visited[i]) {
            dfs1(i, adj, visited, finishOrder);
        }
    }

    // Step 2: DFS on reversed graph in reverse finish order
    visited = new boolean[n];
    List<List<Integer>> sccs = new ArrayList<>();

    while (!finishOrder.isEmpty()) {
        int u = finishOrder.pop();
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
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    TREE & GRAPH ALGORITHMS - COMPLEXITY SUMMARY                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  TREE TRAVERSALS:                                                                │
│  ┌────────────────────────┬────────────┬───────────┬───────────────────────────┐│
│  │ Algorithm              │ Time       │ Space     │ Notes                     ││
│  ├────────────────────────┼────────────┼───────────┼───────────────────────────┤│
│  │ Preorder/Inorder/Post  │ O(n)       │ O(h)      │ Recursive or iterative   ││
│  │ Level Order (BFS)      │ O(n)       │ O(w)      │ w = max width            ││
│  │ Morris Traversal       │ O(n)       │ O(1)      │ Modifies tree temporarily ││
│  └────────────────────────┴────────────┴───────────┴───────────────────────────┘│
│                                                                                  │
│  BST OPERATIONS:                                                                 │
│  ┌────────────────────────┬────────────┬───────────┬───────────────────────────┐│
│  │ Operation              │ Average    │ Worst     │ Notes                     ││
│  ├────────────────────────┼────────────┼───────────┼───────────────────────────┤│
│  │ Search                 │ O(log n)   │ O(n)      │ Worst = skewed tree      ││
│  │ Insert                 │ O(log n)   │ O(n)      │ Maintain balance!        ││
│  │ Delete                 │ O(log n)   │ O(n)      │ Three cases             ││
│  │ Find min/max           │ O(log n)   │ O(n)      │ Follow left/right       ││
│  └────────────────────────┴────────────┴───────────┴───────────────────────────┘│
│                                                                                  │
│  BALANCED TREES (AVL, Red-Black):                                               │
│  ┌────────────────────────┬────────────┬───────────┬───────────────────────────┐│
│  │ Operation              │ Time       │ Space     │ Notes                     ││
│  ├────────────────────────┼────────────┼───────────┼───────────────────────────┤│
│  │ All operations         │ O(log n)   │ O(log n)  │ Guaranteed balanced      ││
│  │ Rebalancing            │ O(1)       │ O(1)      │ Max 2 rotations (AVL)   ││
│  └────────────────────────┴────────────┴───────────┴───────────────────────────┘│
│                                                                                  │
│  GRAPH TRAVERSALS:                                                               │
│  ┌────────────────────────┬────────────┬───────────┬───────────────────────────┐│
│  │ Algorithm              │ Time       │ Space     │ Notes                     ││
│  ├────────────────────────┼────────────┼───────────┼───────────────────────────┤│
│  │ BFS                    │ O(V + E)   │ O(V)      │ Level-by-level          ││
│  │ DFS                    │ O(V + E)   │ O(V)      │ Depth-first             ││
│  │ Topological Sort       │ O(V + E)   │ O(V)      │ DAG only                ││
│  └────────────────────────┴────────────┴───────────┴───────────────────────────┘│
│                                                                                  │
│  SHORTEST PATH:                                                                  │
│  ┌────────────────────────┬────────────┬───────────┬───────────────────────────┐│
│  │ Algorithm              │ Time       │ Space     │ Notes                     ││
│  ├────────────────────────┼────────────┼───────────┼───────────────────────────┤│
│  │ BFS (unweighted)       │ O(V + E)   │ O(V)      │ Best for unweighted     ││
│  │ Dijkstra (binary heap) │ O(E log V) │ O(V)      │ Non-negative weights    ││
│  │ Dijkstra (Fib heap)    │ O(E+V logV)│ O(V)      │ Rarely implemented      ││
│  │ Bellman-Ford           │ O(V × E)   │ O(V)      │ Handles negative        ││
│  │ SPFA                   │ O(V × E)   │ O(V)      │ Avg O(kE), k small     ││
│  │ Floyd-Warshall         │ O(V³)      │ O(V²)     │ All pairs              ││
│  │ Johnson                │ O(VE logV) │ O(V²)     │ All pairs, sparse      ││
│  └────────────────────────┴────────────┴───────────┴───────────────────────────┘│
│                                                                                  │
│  MST:                                                                            │
│  ┌────────────────────────┬────────────┬───────────┬───────────────────────────┐│
│  │ Algorithm              │ Time       │ Space     │ Notes                     ││
│  ├────────────────────────┼────────────┼───────────┼───────────────────────────┤│
│  │ Kruskal                │ O(E log E) │ O(V)      │ Sort + Union-Find       ││
│  │ Prim (binary heap)     │ O(E log V) │ O(V)      │ Dense: use matrix       ││
│  │ Prim (Fib heap)        │ O(E+V logV)│ O(V)      │ Better for dense        ││
│  │ Borůvka                │ O(E log V) │ O(V)      │ Parallelizable          ││
│  └────────────────────────┴────────────┴───────────┴───────────────────────────┘│
│                                                                                  │
│  ADVANCED:                                                                       │
│  ┌────────────────────────┬────────────┬───────────┬───────────────────────────┐│
│  │ Algorithm              │ Time       │ Space     │ Notes                     ││
│  ├────────────────────────┼────────────┼───────────┼───────────────────────────┤│
│  │ SCC (Tarjan/Kosaraju)  │ O(V + E)   │ O(V)      │ Directed graphs         ││
│  │ Articulation Points    │ O(V + E)   │ O(V)      │ Cut vertices            ││
│  │ Bridges                │ O(V + E)   │ O(V)      │ Cut edges               ││
│  │ LCA (preprocessing)    │ O(n log n) │ O(n log n)│ Binary lifting          ││
│  │ LCA (query)            │ O(log n)   │ -         │ After preprocessing     ││
│  │ Euler Path             │ O(E)       │ O(V + E)  │ Hierholzer              ││
│  │ Hamiltonian Path       │ O(n² 2^n)  │ O(n 2^n)  │ DP + bitmask           ││
│  └────────────────────────┴────────────┴───────────┴───────────────────────────┘│
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## INTERVIEW PROBLEM PATTERNS

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    WHEN TO USE WHICH ALGORITHM                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  "Find shortest path..."                                                        │
│  • Unweighted → BFS                                                             │
│  • Positive weights → Dijkstra                                                  │
│  • Negative weights → Bellman-Ford                                              │
│  • All pairs → Floyd-Warshall (dense) or Johnson (sparse)                      │
│                                                                                  │
│  "Find connected components..."                                                 │
│  • Undirected → BFS/DFS or Union-Find                                          │
│  • Directed (SCC) → Tarjan or Kosaraju                                         │
│                                                                                  │
│  "Detect cycle..."                                                              │
│  • Undirected → DFS with parent tracking or Union-Find                         │
│  • Directed → DFS with colors (white/gray/black)                               │
│                                                                                  │
│  "Ordering with dependencies..."                                                │
│  • Topological Sort (Kahn's BFS or DFS postorder)                              │
│                                                                                  │
│  "Minimum cost to connect all..."                                              │
│  • MST: Kruskal or Prim                                                        │
│                                                                                  │
│  "Find LCA..."                                                                  │
│  • Single query → O(n) recursive                                               │
│  • Multiple queries → Binary lifting O(log n) per query                        │
│                                                                                  │
│  "Count paths..."                                                               │
│  • DAG → Topological sort + DP                                                 │
│  • General → DFS with memoization                                              │
│                                                                                  │
│  "Network flow / max matching..."                                              │
│  • Ford-Fulkerson / Edmonds-Karp / Dinic                                       │
│                                                                                  │
│  TREE-SPECIFIC:                                                                  │
│  • Validate BST → Inorder (should be sorted) or range checking                 │
│  • Serialize/Deserialize → Preorder + null markers                             │
│  • Tree DP → Postorder traversal                                               │
│  • Path problems → LCA + path sum                                              │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

# A\* (A-STAR) ALGORITHM — COMPLETE GUIDE

---

## 🔵 WHY: Why Do We Need A\*?

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                     WHY A* EXISTS — THE MOTIVATION                               │
│                                                                                  │
│  Dijkstra explores in ALL directions equally:                                   │
│                                                                                  │
│           . . . . . . .                                                         │
│         . . . . . . . . .                                                       │
│       . . . . S . . . . . .          S = Start, G = Goal                       │
│         . . . . . . . . .            Dijkstra explores the entire circle        │
│           . . . . G . .              before finding path to G                   │
│                                                                                  │
│  A* uses a HEURISTIC to guide search TOWARD the goal:                           │
│                                                                                  │
│                 . .                                                              │
│           S . . . . G                A* explores a narrow corridor              │
│                 . .                   toward the goal — MUCH faster!            │
│                                                                                  │
│  WHEN TO USE:                                                                    │
│  • Grid pathfinding (games, robotics, GPS)                                      │
│  • Any graph where you have an estimate of distance to goal                     │
│  • When Dijkstra is too slow because graph is huge                              │
│                                                                                  │
│  REAL-WORLD:                                                                     │
│  • Google Maps route planning                                                    │
│  • Game AI (NPCs navigating around obstacles)                                   │
│  • Robot motion planning                                                         │
│  • Network routing protocols                                                     │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔵 WHAT: How A\* Works

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                     A* CORE FORMULA                                              │
│                                                                                  │
│   f(n) = g(n) + h(n)                                                           │
│                                                                                  │
│   Where:                                                                         │
│   • g(n) = ACTUAL cost from start to node n (known, exact)                      │
│   • h(n) = ESTIMATED cost from n to goal (heuristic, approximate)               │
│   • f(n) = total estimated cost of path through n                               │
│                                                                                  │
│   ┌──────────────┐         ┌──────────────┐         ┌──────────────┐           │
│   │    START     │ ─g(n)─▶ │   NODE n     │ ─h(n)─▶ │    GOAL      │           │
│   │              │  exact   │              │ estimate │              │           │
│   └──────────────┘         └──────────────┘         └──────────────┘           │
│                                                                                  │
│   KEY INSIGHT: A* always expands the node with LOWEST f(n)                      │
│   This means it prioritizes nodes that appear to be on the shortest path        │
│                                                                                  │
│   COMPARISON WITH DIJKSTRA:                                                      │
│   • Dijkstra:  priority = g(n)           (only actual cost)                     │
│   • A*:        priority = g(n) + h(n)    (actual + estimated remaining)         │
│   • If h(n) = 0 for all n → A* becomes Dijkstra                                │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Common Heuristic Functions

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                     HEURISTIC FUNCTIONS FOR GRIDS                                │
│                                                                                  │
│  1. MANHATTAN DISTANCE (4-directional movement: ↑↓←→)                          │
│     h = |x₁ - x₂| + |y₁ - y₂|                                                │
│                                                                                  │
│     From (1,1) to (4,3):  |4-1| + |3-1| = 3 + 2 = 5                          │
│                                                                                  │
│  2. EUCLIDEAN DISTANCE (any direction, diagonal allowed)                        │
│     h = √((x₁-x₂)² + (y₁-y₂)²)                                              │
│                                                                                  │
│     From (1,1) to (4,3):  √(9+4) ≈ 3.6                                       │
│                                                                                  │
│  3. CHEBYSHEV DISTANCE (8-directional: ↑↓←→↗↘↙↖)                             │
│     h = max(|x₁-x₂|, |y₁-y₂|)                                                │
│                                                                                  │
│     From (1,1) to (4,3):  max(3, 2) = 3                                       │
│                                                                                  │
│  ╔════════════════════════════════════════════════════════════════╗              │
│  ║  ADMISSIBILITY REQUIREMENT:                                     ║              │
│  ║  h(n) must NEVER overestimate the true cost to goal            ║              │
│  ║  h(n) ≤ actual_cost(n, goal)  for all n                       ║              │
│  ║                                                                 ║              │
│  ║  If admissible → A* guarantees OPTIMAL (shortest) path         ║              │
│  ║  If not admissible → faster but may find suboptimal path       ║              │
│  ╚════════════════════════════════════════════════════════════════╝              │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔵 HOW: Step-by-Step Walkthrough

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                     A* ALGORITHM STEP-BY-STEP                                    │
│                                                                                  │
│  Grid Example (0 = open, 1 = wall, S = start, G = goal):                       │
│                                                                                  │
│    0   1   2   3   4         Heuristic: Manhattan distance                      │
│  ┌───┬───┬───┬───┬───┐                                                         │
│ 0│ S │   │   │   │   │      S = (0,0), G = (2,4)                              │
│  ├───┼───┼───┼───┼───┤                                                         │
│ 1│   │ █ │ █ │   │   │      █ = wall (blocked)                                 │
│  ├───┼───┼───┼───┼───┤                                                         │
│ 2│   │   │   │   │ G │                                                          │
│  └───┴───┴───┴───┴───┘                                                         │
│                                                                                  │
│  STEP 1: Initialize                                                              │
│    openSet   = {S}   (nodes to explore, sorted by f)                            │
│    closedSet = {}    (nodes already explored)                                   │
│    g(S) = 0, h(S) = |0-2|+|0-4| = 6, f(S) = 0+6 = 6                         │
│                                                                                  │
│  STEP 2: Pop lowest f from openSet → S (0,0), f=6                              │
│    Expand neighbors: (0,1) and (1,0)                                            │
│    (0,1): g=1, h=|0-2|+|1-4|=5, f=6                                           │
│    (1,0): g=1, h=|1-2|+|0-4|=5, f=6                                           │
│    openSet = {(0,1), (1,0)}                                                     │
│                                                                                  │
│  STEP 3: Pop (0,1), f=6                                                         │
│    Neighbors: (0,2)                                                              │
│    (0,2): g=2, h=|0-2|+|2-4|=4, f=6                                           │
│                                                                                  │
│  ... continues expanding toward goal ...                                        │
│                                                                                  │
│  FINAL PATH:                                                                     │
│    S→(0,1)→(0,2)→(0,3)→(1,3)→(2,3)→G    Cost = 6                            │
│                                                                                  │
│    0   1   2   3   4                                                            │
│  ┌───┬───┬───┬───┬───┐                                                         │
│ 0│ * │ * │ * │ * │   │    * = path found by A*                                 │
│  ├───┼───┼───┼───┼───┤                                                         │
│ 1│   │ █ │ █ │ * │   │                                                          │
│  ├───┼───┼───┼───┼───┤                                                         │
│ 2│   │   │   │ * │ * │                                                          │
│  └───┴───┴───┴───┴───┘                                                         │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
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

### A\* with Weighted Graph (Non-Grid)

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

### A\* vs Dijkstra — When to Use Which

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                     A* VS DIJKSTRA COMPARISON                                    │
│                                                                                  │
│  ┌──────────────────────┬──────────────────────┬───────────────────────────┐   │
│  │ Property             │ Dijkstra             │ A*                        │   │
│  ├──────────────────────┼──────────────────────┼───────────────────────────┤   │
│  │ Time Complexity      │ O(E log V)           │ O(E log V) worst case    │   │
│  │                      │                      │ Often MUCH better        │   │
│  ├──────────────────────┼──────────────────────┼───────────────────────────┤   │
│  │ Explores             │ All reachable nodes  │ Nodes toward goal only   │   │
│  ├──────────────────────┼──────────────────────┼───────────────────────────┤   │
│  │ Needs heuristic?     │ No                   │ Yes                      │   │
│  ├──────────────────────┼──────────────────────┼───────────────────────────┤   │
│  │ Guarantees optimal?  │ Yes (non-neg weights)│ Yes (if h admissible)    │   │
│  ├──────────────────────┼──────────────────────┼───────────────────────────┤   │
│  │ Single target?       │ Finds all targets    │ Stops at single goal     │   │
│  ├──────────────────────┼──────────────────────┼───────────────────────────┤   │
│  │ Best for             │ All-to-all paths     │ Start-to-specific-goal   │   │
│  ├──────────────────────┼──────────────────────┼───────────────────────────┤   │
│  │ Negative weights?    │ No                   │ No                       │   │
│  └──────────────────────┴──────────────────────┴───────────────────────────┘   │
│                                                                                  │
│  RULE OF THUMB:                                                                  │
│  • Know the goal location? → A*                                                 │
│  • Need shortest to ALL nodes? → Dijkstra                                       │
│  • Can't define a heuristic? → Dijkstra                                         │
│  • Huge graph (million+ nodes)? → A* will be dramatically faster               │
│                                                                                  │
│  NODES EXPLORED (10000-node grid, start=top-left, goal=bottom-right):          │
│  • Dijkstra: ~10000 nodes (explores everything)                                │
│  • A*:       ~2000 nodes  (focused corridor) → 5x faster!                      │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Practice Problems (A\* / Shortest Path with Heuristic)

| #   | Problem                                  | Platform    | Difficulty | Key Insight                           |
| --- | ---------------------------------------- | ----------- | ---------- | ------------------------------------- |
| 1   | Shortest Path in Binary Matrix (LC 1091) | LeetCode    | Medium     | BFS on grid, adapt to A\*             |
| 2   | Path With Minimum Effort (LC 1631)       | LeetCode    | Medium     | Modified Dijkstra/A\* on grid         |
| 3   | Swim in Rising Water (LC 778)            | LeetCode    | Hard       | Binary search + BFS or A\*            |
| 4   | Sliding Puzzle (LC 773)                  | LeetCode    | Hard       | A\* with misplaced tile heuristic     |
| 5   | Minimum Cost Path on Grid                | HackerEarth | Medium     | Classic A\* on weighted grid          |
| 6   | 8-Puzzle solver                          | Classic     | Hard       | A\* with Manhattan distance heuristic |

---

# CURATED PRACTICE PROBLEMS — GRAPHS (Complete Collection)

> **HOW TO USE**: Work top-to-bottom within each section. Every problem teaches a specific graph technique.
> Mark each ✅ as you solve it. Revisit any problem you can't solve in 30 minutes after studying the pattern above.

---

## Section 1: BFS & DFS Fundamentals

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

## Section 2: Shortest Path (BFS / Dijkstra / Bellman-Ford)

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

## Section 3: Topological Sort

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

## Section 4: Union-Find (Disjoint Set)

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

## Section 5: Minimum Spanning Tree (MST)

| #   | Problem                                           | Platform | Difficulty | Category     | Key Technique                        |
| --- | ------------------------------------------------- | -------- | ---------- | ------------ | ------------------------------------ |
| 1   | Min Cost to Connect All Points (LC 1584)          | LeetCode | Medium     | Prim/Kruskal | Classic MST on complete graph        |
| 2   | Connecting Cities With Minimum Cost (LC 1135)     | LeetCode | Medium     | Kruskal      | Sort edges + Union-Find              |
| 3   | Optimize Water Distribution (LC 1168)             | LeetCode | Hard       | MST          | Add virtual node for wells, then MST |
| 4   | Find Critical and Pseudo-Critical Edges (LC 1489) | LeetCode | Hard       | MST          | Force include/exclude each edge      |

---

## Section 6: Advanced Graph Patterns

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

## HIDDEN GEMS — Non-Famous But Excellent Graph Problems

> These problems are less commonly seen in "Top 100" lists but teach deep graph intuition.

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
