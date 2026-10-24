# Optimized Implementation <a name="optimized"></a>

> **Navigation**: [← COMPLETE UNDERSTANDING — The WHY Before the…](01_complete_understanding_the_why_before_the.md) | [Chapter overview](../14_Union_Find_DSU_Complete.md) | [Graph Problems →](03_graph_problems.md)
> Page 2 of 5 in **Union-Find / Disjoint Set Union (DSU) Complete Guide**


## Complete Implementation (Copy-Paste Ready!)

```java
class UnionFind {
    private int[] parent;
    private int[] rank;
    private int count;  // Number of connected components

    public UnionFind(int n) {
        parent = new int[n];
        rank = new int[n];
        count = n;

        for (int i = 0; i < n; i++) {
            parent[i] = i;
            rank[i] = 0;
        }
    }

    // Find with path compression
    public int find(int x) {
        if (parent[x] != x) {
            parent[x] = find(parent[x]);
        }
        return parent[x];
    }

    // Union by rank
    public boolean union(int x, int y) {
        int rootX = find(x);
        int rootY = find(y);

        if (rootX == rootY) {
            return false;  // Already in same component
        }

        if (rank[rootX] < rank[rootY]) {
            parent[rootX] = rootY;
        } else if (rank[rootX] > rank[rootY]) {
            parent[rootY] = rootX;
        } else {
            parent[rootY] = rootX;
            rank[rootX]++;
        }

        count--;  // Merged two components
        return true;
    }

    // Check if connected
    public boolean connected(int x, int y) {
        return find(x) == find(y);
    }

    // Get number of components
    public int getCount() {
        return count;
    }
}
```

## Alternative: Map-based for Non-Integer Keys

```java
class UnionFindMap<T> {
    private Map<T, T> parent;
    private Map<T, Integer> rank;

    public UnionFindMap() {
        parent = new HashMap<>();
        rank = new HashMap<>();
    }

    public T find(T x) {
        if (!parent.containsKey(x)) {
            parent.put(x, x);
            rank.put(x, 0);
        }

        if (!parent.get(x).equals(x)) {
            parent.put(x, find(parent.get(x)));
        }
        return parent.get(x);
    }

    public void union(T x, T y) {
        T rootX = find(x);
        T rootY = find(y);

        if (rootX.equals(rootY)) return;

        int rankX = rank.get(rootX);
        int rankY = rank.get(rootY);

        if (rankX < rankY) {
            parent.put(rootX, rootY);
        } else if (rankX > rankY) {
            parent.put(rootY, rootX);
        } else {
            parent.put(rootY, rootX);
            rank.put(rootX, rankX + 1);
        }
    }
}
```

---

## Classic Applications <a name="applications"></a>

### 1. Number of Connected Components (LeetCode 323)

```java
public int countComponents(int n, int[][] edges) {
    UnionFind uf = new UnionFind(n);

    for (int[] edge : edges) {
        uf.union(edge[0], edge[1]);
    }

    return uf.getCount();
}
```

### 2. Number of Provinces (LeetCode 547)

```java
/*
isConnected[i][j] = 1 means city i and j are connected.
*/

public int findCircleNum(int[][] isConnected) {
    int n = isConnected.length;
    UnionFind uf = new UnionFind(n);

    for (int i = 0; i < n; i++) {
        for (int j = i + 1; j < n; j++) {
            if (isConnected[i][j] == 1) {
                uf.union(i, j);
            }
        }
    }

    return uf.getCount();
}
```

### 3. Redundant Connection - Find the Edge to Remove (LeetCode 684)

```java
/*
In a tree with n nodes, there are n-1 edges.
Given n edges (one extra), find the edge that creates a cycle.
*/

public int[] findRedundantConnection(int[][] edges) {
    int n = edges.length;
    UnionFind uf = new UnionFind(n + 1);  // 1-indexed nodes

    for (int[] edge : edges) {
        if (!uf.union(edge[0], edge[1])) {
            // Union failed = already connected = this edge creates cycle
            return edge;
        }
    }
    return new int[0];
}
```

### Visual: Detecting Redundant Edge

```
Edges: [[1,2], [1,3], [2,3]]

Step 1: union(1,2) → Success
        1 — 2

Step 2: union(1,3) → Success
        1 — 2
        |
        3

Step 3: union(2,3) → FAIL! (1,2,3 already connected)
        This is the redundant edge!
```

### 4. Graph Valid Tree (LeetCode 261)

```java
/*
A valid tree has n-1 edges and is fully connected.
*/

public boolean validTree(int n, int[][] edges) {
    // Tree must have exactly n-1 edges
    if (edges.length != n - 1) return false;

    UnionFind uf = new UnionFind(n);

    for (int[] edge : edges) {
        // If union fails, there's a cycle
        if (!uf.union(edge[0], edge[1])) {
            return false;
        }
    }

    // Must be one connected component
    return uf.getCount() == 1;
}
```

---

[← COMPLETE UNDERSTANDING — The WHY Before the…](01_complete_understanding_the_why_before_the.md) | [Chapter overview](../14_Union_Find_DSU_Complete.md) | [Graph Problems →](03_graph_problems.md)
