# Day 13 - Graphs, DFS/BFS, and Union-Find (Reasoning-First Notes)

## Daily Problem Set

1. LeetCode Premium: 323 - Number of Connected Components in an Undirected Graph
2. LeetCode Medium: 200 - Number of Islands
3. Codeforces: 510B - Fox And Two Dots
4. Codeforces: 277A - Learning Languages

## Problem Links

- LC 323 (Premium): Locked on LeetCode (no public official statement page)
- LC 200: https://leetcode.com/problems/number-of-islands/
- CF 510B: https://codeforces.com/problemset/problem/510/B
- CF 277A: https://codeforces.com/problemset/problem/277/A

## Why This Day Matters

Graph questions are often connectivity questions in disguise.

---

## Problem 1 - LC 323 (Premium)

### Problem Statement

Given `n` nodes and undirected edges, return number of connected components.

### Why This DS/Algo

Connectivity can be solved by DFS/BFS traversal or DSU union operations.

### Approach A - Brute Force adjacency matrix DFS (O(n^2), O(n^2))

### Approach B - Better (Adjacency list + DFS/BFS) (O(n+e), O(n+e))

```java
static int componentsBetter(int n, int[][] edges) {
    List<Integer>[] g = new ArrayList[n];
    for (int i = 0; i < n; i++) g[i] = new ArrayList<>();
    for (int[] e : edges) {
        g[e[0]].add(e[1]);
        g[e[1]].add(e[0]);
    }

    boolean[] vis = new boolean[n];
    int comp = 0;
    for (int i = 0; i < n; i++) {
        if (!vis[i]) {
            comp++;
            Deque<Integer> st = new ArrayDeque<>();
            st.push(i);
            vis[i] = true;
            while (!st.isEmpty()) {
                int u = st.pop();
                for (int v : g[u]) if (!vis[v]) {
                    vis[v] = true;
                    st.push(v);
                }
            }
        }
    }
    return comp;
}
```

### Approach C - Optimal (DSU) (O((n+e) alpha(n)), O(n))

```java
static class DSU {
    int[] p, sz;
    DSU(int n) {
        p = new int[n]; sz = new int[n];
        for (int i = 0; i < n; i++) { p[i] = i; sz[i] = 1; }
    }
    int find(int x) { return p[x] == x ? x : (p[x] = find(p[x])); }
    boolean union(int a, int b) {
        a = find(a); b = find(b);
        if (a == b) return false;
        if (sz[a] < sz[b]) { int t = a; a = b; b = t; }
        p[b] = a; sz[a] += sz[b];
        return true;
    }
}

static int componentsOptimal(int n, int[][] edges) {
    DSU d = new DSU(n);
    int comp = n;
    for (int[] e : edges) if (d.union(e[0], e[1])) comp--;
    return comp;
}
```

---

## Problem 2 - LC 200: Number of Islands

### Problem Statement

Count connected components of `'1'` in grid using 4-direction adjacency.

### Why This DS/Algo

Grid is an implicit graph. DFS/BFS flood fill marks each island once.

### Approach A - Brute Force repeated scans without marking (wasteful)

### Approach B - Better (DFS flood fill) (O(mn), O(mn) recursion worst-case)

```java
static int islandsBetter(char[][] g) {
    int m = g.length, n = g[0].length, ans = 0;
    for (int i = 0; i < m; i++) {
        for (int j = 0; j < n; j++) {
            if (g[i][j] == '1') {
                ans++;
                sink(g, i, j);
            }
        }
    }
    return ans;
}

static void sink(char[][] g, int i, int j) {
    if (i < 0 || j < 0 || i >= g.length || j >= g[0].length || g[i][j] != '1') return;
    g[i][j] = '0';
    sink(g, i + 1, j); sink(g, i - 1, j); sink(g, i, j + 1); sink(g, i, j - 1);
}
```

### Approach C - Optimal (Iterative BFS flood fill) (O(mn), O(min(m,n)))

Avoids recursion depth issues.

---

## Problem 3 - CF 510B: Fox And Two Dots

### Problem Statement

Detect cycle of same character in grid (cycle length >= 4).

### Why This DS/Algo

Need cycle detection in undirected grid graph with color constraint.
DFS with parent tracking is standard.

### Approach A - Brute Force start from each cell with full path memory

Expensive.

### Approach B - Better (DFS + parent check) (O(mn), O(mn))

```java
static boolean cycleBetter(char[][] a) {
    int m = a.length, n = a[0].length;
    boolean[][] vis = new boolean[m][n];
    for (int i = 0; i < m; i++) {
        for (int j = 0; j < n; j++) {
            if (!vis[i][j] && dfs(a, i, j, -1, -1, a[i][j], vis)) return true;
        }
    }
    return false;
}

static boolean dfs(char[][] a, int x, int y, int px, int py, char ch, boolean[][] vis) {
    vis[x][y] = true;
    int[] dx = {1, -1, 0, 0}, dy = {0, 0, 1, -1};
    for (int k = 0; k < 4; k++) {
        int nx = x + dx[k], ny = y + dy[k];
        if (nx < 0 || ny < 0 || nx >= a.length || ny >= a[0].length || a[nx][ny] != ch) continue;
        if (nx == px && ny == py) continue;
        if (vis[nx][ny]) return true;
        if (dfs(a, nx, ny, x, y, ch, vis)) return true;
    }
    return false;
}
```

### Approach C - Optimal

DFS parent-cycle check is asymptotically optimal.

---

## Problem 4 - CF 277A: Learning Languages

### Problem Statement

People know sets of languages. Two people are connected if they share language directly/indirectly. Minimum lessons needed so everyone can communicate.

### Why This DS/Algo

Bipartite-like connectivity between people and language groups.
DSU over people handles transitive communication quickly.

### Approach A - Brute Force repeated merging of groups (O(n^3))

### Approach B - Better (Graph DFS on people-language map) (O(total edges))

### Approach C - Optimal (DSU) (near linear)

```java
static int languagesOptimal(List<List<Integer>> knows, int maxLang) {
    int n = knows.size();
    DSU d = new DSU(n);
    int[] owner = new int[maxLang + 1];
    Arrays.fill(owner, -1);

    boolean someoneKnows = false;
    for (int i = 0; i < n; i++) {
        for (int lang : knows.get(i)) {
            someoneKnows = true;
            if (owner[lang] == -1) owner[lang] = i;
            else d.union(i, owner[lang]);
        }
    }

    if (!someoneKnows) return n;
    Set<Integer> comps = new HashSet<>();
    for (int i = 0; i < n; i++) comps.add(d.find(i));
    return comps.size() - 1;
}
```

### Pattern Takeaways

- Choose DFS/BFS when graph is explicit.
- Choose DSU when operations are repeated connectivity unions.
