# Day 12 - Trees, DFS, and BFS (Reasoning-First Notes)

## Daily Problem Set

1. LeetCode Premium: 270 - Closest Binary Search Tree Value
2. LeetCode Medium: 102 - Binary Tree Level Order Traversal
3. Codeforces: 580C - Kefa and Park
4. Codeforces: 763A - Timofey and a Tree

## Problem Links

- LC 270 (Premium): Locked on LeetCode (no public official statement page)
- LC 102: https://leetcode.com/problems/binary-tree-level-order-traversal/
- CF 580C: https://codeforces.com/problemset/problem/580/C
- CF 763A: https://codeforces.com/problemset/problem/763/A

## Why This Day Matters

Tree problems are solved by exploiting structure: BST ordering or parent-child hierarchy.

---

## Problem 1 - LC 270 (Premium)

### Problem Statement

Given BST root and target (double), return value in BST closest to target.

### Why This DS/Algo

BST order allows directional search (left/right) reducing exploration to one path.

### Approach A - Brute Force DFS all nodes (O(n), O(h))

```java
static int closestBrute(TreeNode root, double target) {
    int[] best = new int[]{root.val};
    dfsAll(root, target, best);
    return best[0];
}

static void dfsAll(TreeNode node, double t, int[] best) {
    if (node == null) return;
    if (Math.abs(node.val - t) < Math.abs(best[0] - t)) best[0] = node.val;
    dfsAll(node.left, t, best);
    dfsAll(node.right, t, best);
}
```

### Approach B - Better (Iterative BST walk) (O(h), O(1))

```java
static int closestBetter(TreeNode root, double target) {
    int best = root.val;
    TreeNode cur = root;
    while (cur != null) {
        if (Math.abs(cur.val - target) < Math.abs(best - target)) best = cur.val;
        cur = (target < cur.val) ? cur.left : cur.right;
    }
    return best;
}
```

### Approach C - Optimal

BST directed walk is optimal for BST model.

---

## Problem 2 - LC 102: Level Order Traversal

### Problem Statement

Return node values level by level.

### Why This DS/Algo

BFS queue naturally groups nodes by distance from root (levels).

### Approach A - Brute Force DFS by depth with repeated scans (inefficient)

### Approach B - Better (BFS queue) (O(n), O(width))

```java
static List<List<Integer>> levelOrderBetter(TreeNode root) {
    List<List<Integer>> ans = new ArrayList<>();
    if (root == null) return ans;

    Queue<TreeNode> q = new ArrayDeque<>();
    q.offer(root);
    while (!q.isEmpty()) {
        int sz = q.size();
        List<Integer> level = new ArrayList<>();
        for (int i = 0; i < sz; i++) {
            TreeNode x = q.poll();
            level.add(x.val);
            if (x.left != null) q.offer(x.left);
            if (x.right != null) q.offer(x.right);
        }
        ans.add(level);
    }
    return ans;
}
```

### Approach C - Optimal (DFS depth accumulation) (O(n), O(h))

```java
static List<List<Integer>> levelOrderOptimal(TreeNode root) {
    List<List<Integer>> ans = new ArrayList<>();
    dfs(root, 0, ans);
    return ans;
}

static void dfs(TreeNode node, int d, List<List<Integer>> ans) {
    if (node == null) return;
    if (ans.size() == d) ans.add(new ArrayList<>());
    ans.get(d).add(node.val);
    dfs(node.left, d + 1, ans);
    dfs(node.right, d + 1, ans);
}
```

---

## Problem 3 - CF 580C: Kefa and Park

### Problem Statement

Tree rooted at 1, each node may have cat. Count leaf restaurants reachable without more than `m` consecutive cat nodes on path.

### Why This DS/Algo

Need path constraint from root to leaf -> DFS/BFS with state (`consecutiveCats`).

### Approach A - Brute Force root-to-leaf path extraction (O(n^2))

### Approach B - Better (DFS with state) (O(n), O(h))

```java
static int kefaBetter(List<Integer>[] g, int[] cat, int m) {
    return dfsKefa(1, 0, 0, g, cat, m);
}

static int dfsKefa(int u, int p, int consec, List<Integer>[] g, int[] cat, int m) {
    consec = (cat[u] == 1) ? consec + 1 : 0;
    if (consec > m) return 0;

    boolean leaf = true;
    int ans = 0;
    for (int v : g[u]) {
        if (v == p) continue;
        leaf = false;
        ans += dfsKefa(v, u, consec, g, cat, m);
    }
    return leaf ? 1 : ans;
}
```

### Approach C - Optimal

Linear DFS/BFS is optimal since every node must be checked at least once.

---

## Problem 4 - CF 763A: Timofey and a Tree

### Problem Statement

Given tree with colors, find root such that every edge connecting different colors is incident to root.

### Why This DS/Algo

Observation-based graph analysis:

- collect all bad edges `(u,v)` with different colors
- valid root must be one endpoint of first bad edge
- verify both candidates via linear pass

### Approach A - Brute Force test each node as root (O(n^2))

### Approach B - Better (two-candidate check) (O(n))

```java
static boolean checkRoot(int root, int[][] edges, int[] color) {
    for (int[] e : edges) {
        int u = e[0], v = e[1];
        if (color[u] != color[v] && u != root && v != root) return false;
    }
    return true;
}

static int timofeyBetter(int[][] edges, int[] color) {
    int cu = -1, cv = -1;
    for (int[] e : edges) {
        if (color[e[0]] != color[e[1]]) { cu = e[0]; cv = e[1]; break; }
    }
    if (cu == -1) return 1;
    if (checkRoot(cu, edges, color)) return cu;
    if (checkRoot(cv, edges, color)) return cv;
    return -1;
}
```

### Approach C - Optimal

Two-candidate proof gives linear-time optimal solution.

### Pattern Takeaways

- Tree DP is not always needed; many tasks are solved by structural observations.
- Carry path state in DFS for root-to-leaf constraints.
