# Graph Problems <a name="graph-problems"></a>

> **Navigation**: [← Optimized Implementation](02_optimized_implementation.md) | [Chapter overview](../14_Union_Find_DSU_Complete.md) | [Advanced Techniques →](04_advanced_techniques.md)
> Page 3 of 5 in **Union-Find / Disjoint Set Union (DSU) Complete Guide**


## Kruskal's MST with Union-Find

```java
/*
Minimum Spanning Tree using Kruskal's algorithm.
Sort edges by weight, add if doesn't create cycle.
*/

public int minimumSpanningTree(int n, int[][] edges) {
    // edges[i] = [u, v, weight]

    // Sort by weight
    Arrays.sort(edges, (a, b) -> a[2] - b[2]);

    UnionFind uf = new UnionFind(n);
    int totalWeight = 0;
    int edgesUsed = 0;

    for (int[] edge : edges) {
        int u = edge[0], v = edge[1], weight = edge[2];

        // Only add edge if it doesn't create cycle
        if (uf.union(u, v)) {
            totalWeight += weight;
            edgesUsed++;

            // MST has n-1 edges
            if (edgesUsed == n - 1) break;
        }
    }

    // Check if we connected all nodes
    return edgesUsed == n - 1 ? totalWeight : -1;
}
```

## Accounts Merge (LeetCode 721)

```java
/*
Merge accounts with common emails.
Use email as key, union accounts that share emails.
*/

public List<List<String>> accountsMerge(List<List<String>> accounts) {
    Map<String, Integer> emailToId = new HashMap<>();
    Map<String, String> emailToName = new HashMap<>();
    int id = 0;

    // Assign ID to each unique email
    for (List<String> account : accounts) {
        String name = account.get(0);
        for (int i = 1; i < account.size(); i++) {
            String email = account.get(i);
            if (!emailToId.containsKey(email)) {
                emailToId.put(email, id++);
            }
            emailToName.put(email, name);
        }
    }

    // Union emails in same account
    UnionFind uf = new UnionFind(id);
    for (List<String> account : accounts) {
        int firstId = emailToId.get(account.get(1));
        for (int i = 2; i < account.size(); i++) {
            uf.union(firstId, emailToId.get(account.get(i)));
        }
    }

    // Group emails by root
    Map<Integer, List<String>> rootToEmails = new HashMap<>();
    for (String email : emailToId.keySet()) {
        int root = uf.find(emailToId.get(email));
        rootToEmails
            .computeIfAbsent(root, k -> new ArrayList<>())
            .add(email);
    }

    // Build result
    List<List<String>> result = new ArrayList<>();
    for (int root : rootToEmails.keySet()) {
        List<String> emails = rootToEmails.get(root);
        Collections.sort(emails);
        String name = emailToName.get(emails.get(0));
        emails.add(0, name);
        result.add(emails);
    }

    return result;
}
```

## Number of Islands II (LeetCode 305)

```java
/*
Add land cells one by one, return number of islands after each addition.
*/

public List<Integer> numIslands2(int m, int n, int[][] positions) {
    List<Integer> result = new ArrayList<>();
    UnionFind uf = new UnionFind(m * n);

    boolean[][] grid = new boolean[m][n];
    int islands = 0;
    int[][] dirs = {{0, 1}, {0, -1}, {1, 0}, {-1, 0}};

    for (int[] pos : positions) {
        int r = pos[0], c = pos[1];

        if (grid[r][c]) {
            // Already land, count unchanged
            result.add(islands);
            continue;
        }

        grid[r][c] = true;
        islands++;  // New island
        int id = r * n + c;

        // Union with adjacent land
        for (int[] dir : dirs) {
            int nr = r + dir[0], nc = c + dir[1];

            if (nr >= 0 && nr < m && nc >= 0 && nc < n && grid[nr][nc]) {
                int neighborId = nr * n + nc;
                if (uf.union(id, neighborId)) {
                    islands--;  // Merged two islands into one
                }
            }
        }

        result.add(islands);
    }

    return result;
}
```

---

[← Optimized Implementation](02_optimized_implementation.md) | [Chapter overview](../14_Union_Find_DSU_Complete.md) | [Advanced Techniques →](04_advanced_techniques.md)
