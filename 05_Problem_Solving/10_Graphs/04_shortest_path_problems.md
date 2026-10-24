# 9.3 Shortest Path Problems

> **Navigation**: [← 9.2 Graph Cycle Detection](03_graph_cycle_detection.md) | [Chapter overview](../10_Graphs.md) | [9.4 Union-Find (Disjoint Set) →](05_union_find_disjoint_set.md)
> Page 4 of 7 in **Graphs**


**Pattern:** Find minimum distance/steps. Choose algorithm based on edge weights:

- **Unweighted graph** → BFS (each edge = 1 step)
- **Non-negative weights** → Dijkstra's with min-heap
- **Negative weights** → Bellman-Ford
- **K stops limit** → Modified Dijkstra or BFS with state (node, stops)
  **Key insight:** BFS naturally gives shortest path in unweighted graphs because it explores level-by-level.

## Problem 145: 01 Matrix

**LeetCode 542** 🔗 https://leetcode.com/problems/01-matrix/

```
┌────────────────────────────────────────────────────────────────┐
│  01 MATRIX - Distance to nearest 0 for each cell               │
├────────────────────────────────────────────────────────────────┤
│  Input:                  Output:                               │
│  ┌───┬───┬───┐           ┌───┬───┬───┐                         │
│  │ 0 │ 0 │ 0 │           │ 0 │ 0 │ 0 │                         │
│  ├───┼───┼───┤           ├───┼───┼───┤                         │
│  │ 0 │ 1 │ 0 │     →     │ 0 │ 1 │ 0 │                         │
│  ├───┼───┼───┤           ├───┼───┼───┤                         │
│  │ 1 │ 1 │ 1 │           │ 1 │ 2 │ 1 │                         │
│  └───┴───┴───┘           └───┴───┴───┘                         │
│                                                                │
│  Multi-source BFS from all 0s simultaneously                   │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int[][] updateMatrix(int[][] mat) {
    int rows = mat.length, cols = mat[0].length;
    Queue<int[]> queue = new LinkedList<>();

    // Add all 0s to queue, mark 1s as unvisited
    for (int i = 0; i < rows; i++) {
        for (int j = 0; j < cols; j++) {
            if (mat[i][j] == 0) {
                queue.offer(new int[]{i, j});
            } else {
                mat[i][j] = -1;  // Mark as unvisited
            }
        }
    }

    int[][] directions = {{1,0}, {-1,0}, {0,1}, {0,-1}};

    while (!queue.isEmpty()) {
        int[] cell = queue.poll();

        for (int[] dir : directions) {
            int nr = cell[0] + dir[0];
            int nc = cell[1] + dir[1];

            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols
                && mat[nr][nc] == -1) {
                mat[nr][nc] = mat[cell[0]][cell[1]] + 1;
                queue.offer(new int[]{nr, nc});
            }
        }
    }

    return mat;
}
```

---

## Problem 146: Shortest Path in Binary Matrix

**LeetCode 1091** 🔗 https://leetcode.com/problems/shortest-path-in-binary-matrix/

```
┌────────────────────────────────────────────────────────────────┐
│  SHORTEST PATH IN BINARY MATRIX                                │
├────────────────────────────────────────────────────────────────┤
│  Find shortest clear path from top-left to bottom-right        │
│  Can move in 8 directions (including diagonals)                │
│  0 = clear, 1 = blocked                                        │
│                                                                │
│  grid = [[0,0,0],                                              │
│          [1,1,0],                                              │
│          [1,1,0]]                                              │
│                                                                │
│  Path: (0,0)→(0,1)→(0,2)→(1,2)→(2,2)                           │
│  ┌───┬───┬───┐                                                 │
│  │ S │ * │ * │                                                 │
│  ├───┼───┼───┤   Length = 4                                    │
│  │ █ │ █ │ * │                                                 │
│  ├───┼───┼───┤                                                 │
│  │ █ │ █ │ E │                                                 │
│  └───┴───┴───┘                                                 │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int shortestPathBinaryMatrix(int[][] grid) {
    int n = grid.length;
    if (grid[0][0] == 1 || grid[n-1][n-1] == 1) return -1;

    int[][] directions = {
        {0,1}, {0,-1}, {1,0}, {-1,0},
        {1,1}, {1,-1}, {-1,1}, {-1,-1}
    };

    Queue<int[]> queue = new LinkedList<>();
    queue.offer(new int[]{0, 0, 1});  // row, col, distance
    grid[0][0] = 1;  // Mark visited

    while (!queue.isEmpty()) {
        int[] cell = queue.poll();
        int r = cell[0], c = cell[1], dist = cell[2];

        if (r == n-1 && c == n-1) return dist;

        for (int[] dir : directions) {
            int nr = r + dir[0];
            int nc = c + dir[1];

            if (nr >= 0 && nr < n && nc >= 0 && nc < n && grid[nr][nc] == 0) {
                queue.offer(new int[]{nr, nc, dist + 1});
                grid[nr][nc] = 1;
            }
        }
    }

    return -1;
}
```

---

## Problem 147: Network Delay Time (Dijkstra's)

**LeetCode 743** 🔗 https://leetcode.com/problems/network-delay-time/

```
┌────────────────────────────────────────────────────────────────┐
│  NETWORK DELAY TIME - Dijkstra's Algorithm                     │
├────────────────────────────────────────────────────────────────┤
│  times = [[2,1,1],[2,3,1],[3,4,1]], n=4, k=2                   │
│                                                                │
│       1 ←──(1)── 2                                             │
│                  │                                             │
│                 (1)                                            │
│                  ↓                                             │
│                  3 ──(1)──→ 4                                  │
│                                                                │
│  Start from node 2:                                            │
│  - Node 2: time 0                                              │
│  - Node 1: time 1 (via 2→1)                                    │
│  - Node 3: time 1 (via 2→3)                                    │
│  - Node 4: time 2 (via 2→3→4)                                  │
│                                                                │
│  All nodes reached, max time = 2                               │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int networkDelayTime(int[][] times, int n, int k) {
    // Build adjacency list
    Map<Integer, List<int[]>> graph = new HashMap<>();
    for (int[] time : times) {
        graph.computeIfAbsent(time[0], x -> new ArrayList<>())
             .add(new int[]{time[1], time[2]});
    }

    // Min-heap: [time, node]
    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] - b[0]);
    pq.offer(new int[]{0, k});

    int[] dist = new int[n + 1];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[k] = 0;

    while (!pq.isEmpty()) {
        int[] curr = pq.poll();
        int time = curr[0], node = curr[1];

        if (time > dist[node]) continue;

        if (!graph.containsKey(node)) continue;

        for (int[] edge : graph.get(node)) {
            int neighbor = edge[0], weight = edge[1];
            int newTime = time + weight;

            if (newTime < dist[neighbor]) {
                dist[neighbor] = newTime;
                pq.offer(new int[]{newTime, neighbor});
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

---

## Problem 148: 🔒 Cheapest Flights Within K Stops (LeetCode 787)

**LeetCode 787** 🔗 https://leetcode.com/problems/cheapest-flights-within-k-stops/

```
┌────────────────────────────────────────────────────────────────┐
│  CHEAPEST FLIGHTS WITHIN K STOPS                               │
├────────────────────────────────────────────────────────────────┤
│  n = 4, flights = [[0,1,100],[1,2,100],[2,0,100],[1,3,600],    │
│                    [2,3,200]]                                  │
│  src = 0, dst = 3, k = 1                                       │
│                                                                │
│       ┌────(100)────┐                                          │
│       ↓             │                                          │
│       1 ──(600)──→ 3                                           │
│       │             ↑                                          │
│     (100)         (200)                                        │
│       ↓             │                                          │
│       2 ────────────┘                                          │
│       │                                                        │
│     (100)                                                      │
│       ↓                                                        │
│       0                                                        │
│                                                                │
│  With at most 1 stop:                                          │
│  - 0→1→3 = 700 (1 stop)                                        │
│  - 0→1→2→3 = 400 but has 2 stops ✗                             │
│                                                                │
│  Output: 700                                                   │
└────────────────────────────────────────────────────────────────┘
```

**Solution (Modified Dijkstra):**

```java
public int findCheapestPrice(int n, int[][] flights, int src, int dst, int k) {
    Map<Integer, List<int[]>> graph = new HashMap<>();
    for (int[] f : flights) {
        graph.computeIfAbsent(f[0], x -> new ArrayList<>())
             .add(new int[]{f[1], f[2]});
    }

    // [cost, node, stops]
    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] - b[0]);
    pq.offer(new int[]{0, src, 0});

    // Track min stops to reach each node
    int[] minStops = new int[n];
    Arrays.fill(minStops, Integer.MAX_VALUE);

    while (!pq.isEmpty()) {
        int[] curr = pq.poll();
        int cost = curr[0], node = curr[1], stops = curr[2];

        if (node == dst) return cost;
        if (stops > k) continue;
        if (stops >= minStops[node]) continue;

        minStops[node] = stops;

        if (!graph.containsKey(node)) continue;

        for (int[] next : graph.get(node)) {
            pq.offer(new int[]{cost + next[1], next[0], stops + 1});
        }
    }

    return -1;
}
```

---

[← 9.2 Graph Cycle Detection](03_graph_cycle_detection.md) | [Chapter overview](../10_Graphs.md) | [9.4 Union-Find (Disjoint Set) →](05_union_find_disjoint_set.md)
