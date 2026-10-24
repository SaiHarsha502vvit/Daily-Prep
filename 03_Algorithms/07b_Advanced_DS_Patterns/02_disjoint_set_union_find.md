# 🔗 Part 5: Disjoint Set (union — Find)

> **Navigation**: [← Concept](01_concept.md) | [Chapter overview](../07b_Advanced_DS_Patterns.md) | [Skip List →](03_skip_list.md)
> Page 2 of 5 in **Fenwick & Segment Trees — Advanced Data Structure Patterns**


## Concept

```
DISJOINT SET: Manage collection of non-overlapping sets

Operations:
- FIND: Which set does element belong to?
- UNION: Merge two sets

OPTIMIZATIONS:
1. Path Compression: Flatten tree during FIND
2. Union by Rank: Attach smaller tree under larger

          Before Compression    After Compression
               1                      1
              /|\                   / | \ \
             2 3 4                2  3  4  5
             |
             5
```

## Implementation

```java
class DisjointSet {
    int[] parent;
    int[] rank;

    public DisjointSet(int n) {
        parent = new int[n];
        rank = new int[n];
        for (int i = 0; i < n; i++) {
            parent[i] = i;  // Each element is its own parent
            rank[i] = 0;
        }
    }

    // FIND with Path Compression: O(α(n)) ≈ O(1) amortized
    public int find(int x) {
        if (parent[x] != x) {
            parent[x] = find(parent[x]);  // Path compression
        }
        return parent[x];
    }

    // UNION by Rank: O(α(n)) ≈ O(1) amortized
    public void union(int x, int y) {
        int rootX = find(x);
        int rootY = find(y);

        if (rootX == rootY) return;  // Already in same set

        // Union by rank
        if (rank[rootX] < rank[rootY]) {
            parent[rootX] = rootY;
        } else if (rank[rootX] > rank[rootY]) {
            parent[rootY] = rootX;
        } else {
            parent[rootY] = rootX;
            rank[rootX]++;
        }
    }

    // Check if same set
    public boolean connected(int x, int y) {
        return find(x) == find(y);
    }

    // Count number of disjoint sets
    public int countSets() {
        int count = 0;
        for (int i = 0; i < parent.length; i++) {
            if (parent[i] == i) count++;
        }
        return count;
    }
}

// VISUAL TRACE:
// Initial: {0}, {1}, {2}, {3}, {4}
// parent: [0, 1, 2, 3, 4]
//
// union(0, 1):
// parent: [0, 0, 2, 3, 4]
//    0
//    |
//    1
//
// union(2, 3):
// parent: [0, 0, 2, 2, 4]
//    0       2
//    |       |
//    1       3
//
// union(0, 2):
// parent: [0, 0, 0, 2, 4]
//        0
//      / |
//     1  2
//        |
//        3
//
// After path compression on find(3):
// parent: [0, 0, 0, 0, 4]
//        0
//      / | \
//     1  2  3
```

## Application: Kruskal's MST

```java
public int kruskalMST(int n, int[][] edges) {
    // Sort edges by weight
    Arrays.sort(edges, (a, b) -> a[2] - b[2]);

    DisjointSet ds = new DisjointSet(n);
    int mstWeight = 0;
    int edgesUsed = 0;

    for (int[] edge : edges) {
        int u = edge[0], v = edge[1], weight = edge[2];

        if (!ds.connected(u, v)) {
            ds.union(u, v);
            mstWeight += weight;
            edgesUsed++;

            if (edgesUsed == n - 1) break;  // MST complete
        }
    }

    return mstWeight;
}
```

---

[← Concept](01_concept.md) | [Chapter overview](../07b_Advanced_DS_Patterns.md) | [Skip List →](03_skip_list.md)
