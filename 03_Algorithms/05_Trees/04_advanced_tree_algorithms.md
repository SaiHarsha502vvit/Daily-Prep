# PART 11: Advanced Tree Algorithms

> **Navigation**: [← Tree Traversals](03_tree_traversals.md) | [Chapter overview](../05_Trees.md) | [Complete Tree Problems with Solutions →](05_complete_tree_problems_with_solutions.md)
> Page 4 of 6 in **TREES - Complete Guide**


## Lowest Common Ancestor (LCA) with Binary Lifting

```
CONCEPT:
Preprocess tree to answer LCA queries in O(log n).
Uses the idea of "jumping" 2^i steps up at a time.

PREPROCESSING: O(n log n)
QUERY: O(log n)
```

```java
public class LCABinaryLifting {
    private int[][] up;  // up[node][i] = 2^i ancestor of node
    private int[] depth;
    private int LOG;

    public void preprocess(List<List<Integer>> adj, int root) {
        int n = adj.size();
        LOG = (int) Math.ceil(Math.log(n) / Math.log(2)) + 1;
        up = new int[n][LOG];
        depth = new int[n];

        // Initialize all ancestors to -1
        for (int[] row : up) Arrays.fill(row, -1);

        // DFS to fill depth and up[node][0] (direct parent)
        dfs(root, -1, 0, adj);

        // Fill the binary lifting table
        for (int j = 1; j < LOG; j++) {
            for (int i = 0; i < n; i++) {
                if (up[i][j - 1] != -1) {
                    up[i][j] = up[up[i][j - 1]][j - 1];
                }
            }
        }
    }

    private void dfs(int node, int parent, int d, List<List<Integer>> adj) {
        depth[node] = d;
        up[node][0] = parent;

        for (int child : adj.get(node)) {
            if (child != parent) {
                dfs(child, node, d + 1, adj);
            }
        }
    }

    public int lca(int a, int b) {
        // Make a the deeper node
        if (depth[a] < depth[b]) {
            int temp = a; a = b; b = temp;
        }

        // Bring a to same depth as b
        int diff = depth[a] - depth[b];
        for (int j = 0; j < LOG; j++) {
            if (((diff >> j) & 1) == 1) {
                a = up[a][j];
            }
        }

        if (a == b) return a;

        // Jump together
        for (int j = LOG - 1; j >= 0; j--) {
            if (up[a][j] != up[b][j]) {
                a = up[a][j];
                b = up[b][j];
            }
        }

        return up[a][0];
    }

    // Distance between two nodes
    public int distance(int a, int b) {
        int l = lca(a, b);
        return depth[a] + depth[b] - 2 * depth[l];
    }
}
```

## Tree Diameter

```java
// Method 1: Two BFS/DFS
public int treeDiameter(List<List<Integer>> adj) {
    int n = adj.size();

    // First BFS/DFS from any node to find farthest node
    int[] result1 = bfs(0, adj);
    int farthestNode = result1[0];

    // Second BFS/DFS from farthest to find diameter
    int[] result2 = bfs(farthestNode, adj);
    return result2[1];  // The diameter
}

private int[] bfs(int start, List<List<Integer>> adj) {
    int n = adj.size();
    int[] dist = new int[n];
    Arrays.fill(dist, -1);
    dist[start] = 0;

    Queue<Integer> queue = new LinkedList<>();
    queue.offer(start);

    int farthestNode = start, maxDist = 0;

    while (!queue.isEmpty()) {
        int node = queue.poll();
        for (int neighbor : adj.get(node)) {
            if (dist[neighbor] == -1) {
                dist[neighbor] = dist[node] + 1;
                queue.offer(neighbor);
                if (dist[neighbor] > maxDist) {
                    maxDist = dist[neighbor];
                    farthestNode = neighbor;
                }
            }
        }
    }

    return new int[]{farthestNode, maxDist};
}

// Method 2: Single DFS (return longest path through each node)
public int diameterDFS(List<List<Integer>> adj) {
    int[] diameter = {0};
    dfs(0, -1, adj, diameter);
    return diameter[0];
}

private int dfs(int node, int parent, List<List<Integer>> adj, int[] diameter) {
    int max1 = 0, max2 = 0;  // Two longest paths down

    for (int child : adj.get(node)) {
        if (child != parent) {
            int childDepth = dfs(child, node, adj, diameter) + 1;
            if (childDepth > max1) {
                max2 = max1;
                max1 = childDepth;
            } else if (childDepth > max2) {
                max2 = childDepth;
            }
        }
    }

    diameter[0] = Math.max(diameter[0], max1 + max2);
    return max1;
}
```

## Euler Tour and Tree Flattening

```
CONCEPT:
Convert tree to array to enable range queries.
Record entry and exit times during DFS.

USE CASES:
- Subtree queries (sum, count, etc.)
- Path queries with Segment Tree
```

```java
public class EulerTour {
    private int[] tin, tout;  // Entry and exit times
    private int[] euler;      // Flattened tree
    private int timer;

    public void flatten(List<List<Integer>> adj, int root) {
        int n = adj.size();
        tin = new int[n];
        tout = new int[n];
        euler = new int[2 * n];
        timer = 0;

        dfs(root, -1, adj);
    }

    private void dfs(int node, int parent, List<List<Integer>> adj) {
        tin[node] = timer;
        euler[timer++] = node;

        for (int child : adj.get(node)) {
            if (child != parent) {
                dfs(child, node, adj);
            }
        }

        tout[node] = timer;
        euler[timer++] = node;  // Record exit (for some applications)
    }

    // Check if a is ancestor of b
    public boolean isAncestor(int a, int b) {
        return tin[a] <= tin[b] && tout[a] >= tout[b];
    }

    // Subtree of node is represented by euler[tin[node]..tout[node]-1]
    // Can use Segment Tree for range queries on subtrees
}
```

---

[← Tree Traversals](03_tree_traversals.md) | [Chapter overview](../05_Trees.md) | [Complete Tree Problems with Solutions →](05_complete_tree_problems_with_solutions.md)
