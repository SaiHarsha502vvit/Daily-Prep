# 9.4 Union-Find (Disjoint Set)

> **Navigation**: [← 9.3 Shortest Path Problems](04_shortest_path_problems.md) | [Chapter overview](../10_Graphs.md) | [9.5 Advanced Graph Problems →](06_advanced_graph_problems.md)
> Page 5 of 7 in **Graphs**


**Pattern:** Dynamic connectivity — merge groups and check membership.
**When to use over BFS/DFS:** When edges arrive one-by-one (online), or when you need to count components after each merge.
**Template:** Find with path compression + Union by rank → O(α(n)) ≈ O(1) per operation.

**UNION-FIND DATA STRUCTURE**

```text
Operations:
- find(x): Find root/representative of x's set
- union(x, y): Merge sets containing x and y

Optimizations:
1. Path Compression: Flatten tree during find
2. Union by Rank: Attach smaller tree under larger

Example:
Initial: {0}, {1}, {2}, {3}, {4}

union(0,1): {0,1}, {2}, {3}, {4}
union(2,3): {0,1}, {2,3}, {4}
union(1,3): {0,1,2,3}, {4}

find(0) == find(3)? → true (same set)
find(0) == find(4)? → false (different sets)

Time: O(α(n)) ≈ O(1) amortized per operation
```

---

## Problem 149: Number of Connected Components

**LeetCode 323 (Premium)** 🔗 (Premium)

**NUMBER OF CONNECTED COMPONENTS**

```text
n = 5, edges = [[0,1], [1,2], [3,4]]

0 ─── 1 ─── 2        3 ─── 4

Component 1: {0,1,2}
Component 2: {3,4}

Output: 2

Constraints:
- 1 <= n <= 2000
- 0 <= edges.length <= 5000
- No duplicate edges
```

**Solution:**

```java
public int countComponents(int n, int[][] edges) {
    int[] parent = new int[n];
    int[] rank = new int[n];

    for (int i = 0; i < n; i++) parent[i] = i;

    int components = n;

    for (int[] edge : edges) {
        if (union(parent, rank, edge[0], edge[1])) {
            components--;
        }
    }

    return components;
}

private int find(int[] parent, int x) {
    if (parent[x] != x) {
        parent[x] = find(parent, parent[x]);  // Path compression
    }
    return parent[x];
}

private boolean union(int[] parent, int[] rank, int x, int y) {
    int px = find(parent, x);
    int py = find(parent, y);

    if (px == py) return false;  // Already same component

    // Union by rank
    if (rank[px] < rank[py]) {
        parent[px] = py;
    } else if (rank[px] > rank[py]) {
        parent[py] = px;
    } else {
        parent[py] = px;
        rank[px]++;
    }

    return true;
}
```

---

## Problem 150: Redundant Connection

**LeetCode 684** 🔗 https://leetcode.com/problems/redundant-connection/

**REDUNDANT CONNECTION - Find edge that creates cycle**

```text
edges = [[1,2], [1,3], [2,3]]

     1
    / \
   2───3   Edge [2,3] creates the cycle

Return the last edge that creates a cycle
Output: [2, 3]
```

**Solution:**

```java
public int[] findRedundantConnection(int[][] edges) {
    int n = edges.length;
    int[] parent = new int[n + 1];

    for (int i = 1; i <= n; i++) parent[i] = i;

    for (int[] edge : edges) {
        int p1 = find(parent, edge[0]);
        int p2 = find(parent, edge[1]);

        if (p1 == p2) {
            return edge;  // This edge creates cycle
        }

        parent[p1] = p2;
    }

    return new int[0];
}

private int find(int[] parent, int x) {
    if (parent[x] != x) {
        parent[x] = find(parent, parent[x]);
    }
    return parent[x];
}
```

---

## Problem 151: Accounts Merge

**LeetCode 721** 🔗 https://leetcode.com/problems/accounts-merge/

**ACCOUNTS MERGE - Merge accounts with same email**

```text
accounts = [
  ["John", "john@mail.com", "john_work@mail.com"],
  ["John", "john@mail.com", "john_home@mail.com"],
  ["Mary", "mary@mail.com"],
  ["John", "johnny@mail.com"]
]

John (account 0) and John (account 1) share "john@mail.com"
→ Merge them

Output: [
  ["John", "john@mail.com", "john_home@mail.com",
          "john_work@mail.com"],
  ["Mary", "mary@mail.com"],
  ["John", "johnny@mail.com"]
]
```

**Solution:**

```java
public List<List<String>> accountsMerge(List<List<String>> accounts) {
    Map<String, String> emailToName = new HashMap<>();
    Map<String, String> parent = new HashMap<>();

    // Initialize: each email is its own parent
    for (List<String> account : accounts) {
        String name = account.get(0);
        for (int i = 1; i < account.size(); i++) {
            String email = account.get(i);
            emailToName.put(email, name);
            parent.put(email, email);
        }
    }

    // Union emails in same account
    for (List<String> account : accounts) {
        String firstEmail = account.get(1);
        for (int i = 2; i < account.size(); i++) {
            union(parent, firstEmail, account.get(i));
        }
    }

    // Group emails by root
    Map<String, TreeSet<String>> groups = new HashMap<>();
    for (String email : parent.keySet()) {
        String root = find(parent, email);
        groups.computeIfAbsent(root, x -> new TreeSet<>()).add(email);
    }

    // Build result
    List<List<String>> result = new ArrayList<>();
    for (String root : groups.keySet()) {
        List<String> account = new ArrayList<>();
        account.add(emailToName.get(root));
        account.addAll(groups.get(root));
        result.add(account);
    }

    return result;
}

private String find(Map<String, String> parent, String x) {
    if (!parent.get(x).equals(x)) {
        parent.put(x, find(parent, parent.get(x)));
    }
    return parent.get(x);
}

private void union(Map<String, String> parent, String x, String y) {
    parent.put(find(parent, x), find(parent, y));
}
```

---

🔬 **Section Challenge — 9.4 Union-Find (Disjoint Set)**

**Challenge 1 (Trace — Who/When/What):** `find(parent, 5)` on a Union-Find with path compression. The tree is `5 → 3 → 1 → 0`. **Who** gets updated? **When** exactly? **What** is the tree shape after the call?

<details><summary>Answer</summary>

**Who gets updated?** Nodes 5 and 3 \u2014 path compression flattens them directly to the root. **When?** During the recursive unwind: `find(5)` calls `find(3)` which calls `find(1)` which calls `find(0)` which returns 0. As the call stack unwinds: `parent[1] = 0` (already there), then `parent[3] = 0`, then `parent[5] = 0`. **Tree shape after:** All four nodes (5, 3, 1) point directly to root 0. Next `find(5)` call = O(1), not O(depth). **Why this matters:** Without path compression, a degenerate Union-Find is a linked list with O(n) find. With path compression (and union by rank), amortized complexity is O(α(n)) — the inverse Ackermann function, which is effectively constant for all practical n (stays ≤ 4 for n ≤ 10^80).

</details>

---

[← 9.3 Shortest Path Problems](04_shortest_path_problems.md) | [Chapter overview](../10_Graphs.md) | [9.5 Advanced Graph Problems →](06_advanced_graph_problems.md)
