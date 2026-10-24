# Shortest Path Problems

> **Navigation**: [← Heap](16_Heap.md) | [Chapter index](00_INDEX.md) | [Greedy →](13_Greedy.md)

---

## 🔗 Bridge — Where This Chapter Fits

| Dimension | This chapter |
| --- | --- |
| **Builds on** | [Shortest Paths pattern](../04_Patterns_Templates/30_Shortest_Path_Pattern.md), [Graphs](10_Graphs.md), [Heap](16_Heap.md), [Matrix](19_Matrix.md) |
| **You will learn** | Dijkstra on graphs and grids, minimax paths, bounded-hop paths with Bellman–Ford rounds, BFS on grids and word graphs, and 0-1 BFS |
| **Leads to** | [Dynamic Programming](11_Dynamic_Programming.md), [Mixed & Competitive](14_Mixed_Competitive.md) |
| **Abstraction level** | Exploring all paths → **relaxing edges in the right order** |

> [!NOTE]
> The full gap-free reading order and dependency graph are in the [Learning Path](00_LEARNING_PATH.md).

---

## 💬 Explain It Like a Study Partner — Shortest Path Problems

### 1. The bottom line

Choose the algorithm by the edge weights: equal → BFS, 0/1 → deque BFS, non-negative → Dijkstra, negative or hop-limited → Bellman–Ford rounds.

### 2. The textbook core

- Relaxation: if `d[u] + w < d[v]`, update `d[v]`.
- Dijkstra uses a min-heap and skips stale entries; weights must be non-negative.
- Minimax paths ("smallest maximum step") use the same loop with `max` instead of `+`.
- `k` stops ⇒ `k + 1` rounds of edge relaxation on a copy of the distances.
- Grids and word ladders are implicit graphs searched with BFS.

### 3. The real-world analogy

**Choosing the fastest route on a map.**

### 4. Walkthrough

1. Graph `0→1 (4)`, `0→2 (1)`, `2→1 (2)`, `1→3 (1)`.
2. Dijkstra from 0: `d[2] = 1`, `d[1] = 3` (via 2), `d[3] = 4`.
3. The stale heap entry `(4, node 1)` is skipped.
4. Answer to node 3: 4.

> [!NOTE]
> **Quick check:** Why does Dijkstra fail with negative edges? *A finalised node can later be improved through a negative edge.*


### 5. Check yourself

**Q1.** Shortest 8-directional path in `[[0,1],[1,0]]` (counted in cells)?

<details><summary>Answer</summary>

**2**: move diagonally from the top-left to the bottom-right.

</details>

**Q2.** What does network delay time return when some node is unreachable?

<details><summary>Answer</summary>

−1.

</details>

---

## 🗺️ Pattern Recognition Header

| Signal in the problem | Technique |
| --- | --- |
| "minimum time for a signal to reach all nodes" | Dijkstra from the source |
| "path with the smallest maximum difference" | Dijkstra with `max` |
| "at most k stops" | Bellman–Ford, k+1 rounds |
| "shortest path in a grid, unit steps" | BFS |
| "transform one word into another" | BFS over words |
| "minimum obstacles to remove (cost 0/1)" | 0-1 BFS |

> [!TIP]
> State the cost model first: steps, sum of weights, or maximum along the path. Each maps to a different relaxation rule.

---

## Problem 1 — Network Delay Time

**Task.** Signals travel along directed edges with travel times. How long until all nodes receive a signal sent from node `k`?

**Brute force.** Try every path: exponential.

**Better idea.** Dijkstra from `k`; the answer is the largest distance (or −1 if some node is unreachable).

```java
static long[] dijkstra(List<List<int[]>> g, int s) {
    long[] d = new long[g.size()];
    Arrays.fill(d, INF);
    d[s] = 0;
    PriorityQueue<long[]> pq = new PriorityQueue<>((a, b) -> Long.compare(a[1], b[1]));
    pq.add(new long[]{s, 0});
    while (!pq.isEmpty()) {
        long[] c = pq.poll();
        int u = (int) c[0];
        if (c[1] > d[u]) continue;
        for (int[] e : g.get(u)) if (d[u] + e[1] < d[e[0]]) {
            d[e[0]] = d[u] + e[1];
            pq.add(new long[]{e[0], d[e[0]]});
        }
    }
    return d;
}

static int networkDelay(int[][] times, int n, int k) {
    List<List<int[]>> g = new ArrayList<>();
    for (int i = 0; i <= n; i++) g.add(new ArrayList<>());
    for (int[] t : times) g.get(t[0]).add(new int[]{t[1], t[2]});
    long[] d = dijkstra(g, k);
    long m = 0;
    for (int i = 1; i <= n; i++) m = Math.max(m, d[i]);
    return m >= INF ? -1 : (int) m;
}
```

**Example.** `times = [[2,1,1],[2,3,1],[3,4,1]]`, `n = 4`, `k = 2` → `2`.

**Complexity.** `O((V + E) log V)`.


## Problem 2 — Path With Minimum Effort

**Task.** Move through a height grid; the effort of a path is the largest height difference between consecutive cells. Minimise it.

**Brute force.** Enumerate all paths: exponential.

**Better idea.** Dijkstra where the cost of reaching a cell is the maximum edge so far.

```java
static int minEffort(int[][] h) {
    int R = h.length, C = h[0].length;
    int[][] eff = new int[R][C];
    for (int[] r : eff) Arrays.fill(r, Integer.MAX_VALUE);
    eff[0][0] = 0;
    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> Integer.compare(a[2], b[2]));
    pq.add(new int[]{0, 0, 0});
    int[] dr = {1, -1, 0, 0}, dc = {0, 0, 1, -1};
    while (!pq.isEmpty()) {
        int[] c = pq.poll();
        if (c[2] > eff[c[0]][c[1]]) continue;
        if (c[0] == R - 1 && c[1] == C - 1) return c[2];
        for (int k = 0; k < 4; k++) {
            int r = c[0] + dr[k], cc = c[1] + dc[k];
            if (r < 0 || cc < 0 || r >= R || cc >= C) continue;
            int e = Math.max(c[2], Math.abs(h[r][cc] - h[c[0]][c[1]]));
            if (e < eff[r][cc]) {
                eff[r][cc] = e;
                pq.add(new int[]{r, cc, e});
            }
        }
    }
    return 0;
}
```

**Example.** `[[1,2,2],[3,8,2],[5,3,5]]` → `2`.

**Complexity.** `O(rc log rc)`.


## Problem 3 — Cheapest Flights Within K Stops

**Task.** Find the cheapest price from `src` to `dst` with at most `k` stops.

**Brute force.** DFS over all routes: exponential.

**Better idea.** Relax all edges `k + 1` times, each round reading from a copy of the previous distances.

```java
static int cheapestWithinK(int n, int[][] flights, int src, int dst, int k) {
    long[] d = new long[n];
    Arrays.fill(d, INF);
    d[src] = 0;
    for (int i = 0; i <= k; i++) {
        long[] nd = d.clone();
        for (int[] f : flights) if (d[f[0]] < INF && d[f[0]] + f[2] < nd[f[1]]) nd[f[1]] = d[f[0]] + f[2];
        d = nd;
    }
    return d[dst] >= INF ? -1 : (int) d[dst];
}
```

**Example.** 4 cities, `k = 1` → `700`.

**Complexity.** `O(k · E)`.


## Problem 4 — Shortest Path in a Binary Matrix

**Task.** Find the length of the shortest clear path from the top-left to the bottom-right of a 0/1 grid using 8-directional moves.

**Brute force.** DFS over all paths: exponential.

**Better idea.** BFS from the start; the first time the goal is dequeued gives the minimum length.

```java
static int shortestBinaryMatrix(int[][] g) {
    int n = g.length;
    if (g[0][0] == 1 || g[n - 1][n - 1] == 1) return -1;
    int[][] dist = new int[n][n];
    for (int[] r : dist) Arrays.fill(r, -1);
    ArrayDeque<int[]> q = new ArrayDeque<>();
    q.add(new int[]{0, 0});
    dist[0][0] = 1;
    while (!q.isEmpty()) {
        int[] c = q.poll();
        if (c[0] == n - 1 && c[1] == n - 1) return dist[c[0]][c[1]];
        for (int dr = -1; dr <= 1; dr++) for (int dc = -1; dc <= 1; dc++) {
            int r = c[0] + dr, cc = c[1] + dc;
            if ((dr | dc) != 0 && r >= 0 && cc >= 0 && r < n && cc < n && g[r][cc] == 0 && dist[r][cc] < 0) {
                dist[r][cc] = dist[c[0]][c[1]] + 1;
                q.add(new int[]{r, cc});
            }
        }
    }
    return -1;
}
```

**Example.** `[[0,0,0],[1,1,0],[1,1,0]]` → `4`.

**Complexity.** `O(n²)`.


## Problem 5 — Word Ladder

**Task.** Transform `beginWord` into `endWord` changing one letter at a time through words in a list; return the number of words in the shortest sequence.

**Brute force.** Try all sequences: exponential.

**Better idea.** BFS where neighbours are words that differ in one position (generate by replacing each letter).

```java
static int ladderLength(String b, String e, List<String> words) {
    Set<String> dict = new HashSet<>(words);
    if (!dict.contains(e)) return 0;
    ArrayDeque<String> q = new ArrayDeque<>();
    q.add(b);
    Map<String, Integer> dist = new HashMap<>();
    dist.put(b, 1);
    while (!q.isEmpty()) {
        String w = q.poll();
        if (w.equals(e)) return dist.get(w);
        char[] cs = w.toCharArray();
        for (int i = 0; i < cs.length; i++) {
            char o = cs[i];
            for (char c = 'a'; c <= 'z'; c++) {
                cs[i] = c;
                String nw = new String(cs);
                if (dict.contains(nw) && !dist.containsKey(nw)) {
                    dist.put(nw, dist.get(w) + 1);
                    q.add(nw);
                }
            }
            cs[i] = o;
        }
    }
    return 0;
}
```

**Example.** `hit → cog` with `[hot,dot,dog,lot,log,cog]` → `5`.

**Complexity.** `O(N · L · 26)`.


## Problem 6 — Minimum Obstacle Removal

**Task.** Moving between cells costs 1 if the destination is an obstacle and 0 otherwise. Find the cheapest path from the top-left to the bottom-right.

**Brute force.** Try all paths: exponential.

**Better idea.** 0-1 BFS: push zero-cost moves to the front of a deque and one-cost moves to the back.

```java
static int minObstacleRemoval(int[][] g) {
    int R = g.length, C = g[0].length;
    int[][] d = new int[R][C];
    for (int[] r : d) Arrays.fill(r, Integer.MAX_VALUE);
    d[0][0] = 0;
    ArrayDeque<int[]> dq = new ArrayDeque<>();
    dq.add(new int[]{0, 0});
    int[] dr = {1, -1, 0, 0}, dc = {0, 0, 1, -1};
    while (!dq.isEmpty()) {
        int[] c = dq.pollFirst();
        for (int k = 0; k < 4; k++) {
            int r = c[0] + dr[k], cc = c[1] + dc[k];
            if (r < 0 || cc < 0 || r >= R || cc >= C) continue;
            int nd = d[c[0]][c[1]] + g[r][cc];
            if (nd < d[r][cc]) {
                d[r][cc] = nd;
                if (g[r][cc] == 0) dq.addFirst(new int[]{r, cc});
                else dq.addLast(new int[]{r, cc});
            }
        }
    }
    return d[R - 1][C - 1];
}
```

**Example.** `[[0,1,1],[1,1,0],[1,1,0]]` → `2`.

**Complexity.** `O(rc)`.

---

## 🏢 Enterprise Lens — Shortest Path Problems

| Area | What top-tier engineering looks like |
| ---- | ------------------------------------ |
| **Where it runs in production** | Routing, maps, network latency, game pathfinding |
| **Failure modes** | Using Dijkstra with negative weights; marking visited too early on weighted graphs; `int` overflow of infinity |
| **Testing and verification** | Dijkstra against Floyd–Warshall, flights against a layered DP, BFS/0-1 BFS against Bellman–Ford-style relaxation, min-effort against threshold + BFS (1 500 random cases here) |

---

## Reality Check

> [!CAUTION]
> "Shortest path means Dijkstra." Dijkstra is for non-negative weights; unit weights need BFS, 0/1 weights need a deque, and hop-limited paths need Bellman–Ford rounds.

---

[← Trie Problems](30_Trie_Problems.md) | [Index](00_INDEX.md) | [Problem Index →](00_INDEX.md)
