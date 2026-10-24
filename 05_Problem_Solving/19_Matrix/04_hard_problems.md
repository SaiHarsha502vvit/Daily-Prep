# 🧩 Part 3: Hard Problems

> **Navigation**: [← 9. [Pacific Atlantic Water…](03_pacific_atlantic_water_flow_https_leetcode.md) | [Chapter overview](../19_Matrix.md) | [Cheat Sheets and Reference →](05_cheat_sheets_and_reference.md)
> Page 4 of 5 in **19. Matrix / Grid — Complete Problem Guide**


**HARD — 4 PROBLEMS**

```text
Advanced BFS, Dijkstra on grid, Union-Find, 3D heap BFS
```

## 1. [Shortest Path in Binary Matrix](https://leetcode.com/problems/shortest-path-in-binary-matrix/) (LC 1091) ⭐⭐⭐ Hard

**Companies**: Google, Amazon, Facebook, Microsoft  
**Pattern**: BFS with 8-directional movement

**Problem**: Given an `n × n` binary grid, return the length of the shortest clear path from top-left `(0,0)` to bottom-right `(n-1,n-1)`. A clear path only uses cells with value 0 and moves 8-directionally (including diagonals). Return -1 if no path exists. Path length = number of cells visited.

| | c0 | c1 | c2 |
| --- | --- | --- | --- |
| **r0** | 0 | 0 | 0 |
| **r1** | 1 | 1 | 0 |
| **r2** | 1 | 1 | 0 |

The centre cell `(1,1)` is blocked, so the diagonal shortcut is not available. The shortest clear path is `(0,0) → (0,1) → (1,2) → (2,2)`: **4 cells** (count cells, not edges). The diagonal step from `(0,1)` to `(1,2)` saves one move compared with going around.

**Key Insight**: Shortest path in an unweighted graph = BFS. The twist: 8 directions instead of 4. BFS guarantees the first time we reach `(n-1, n-1)` is via the shortest path.

**Approach**:

1. If `grid[0][0] != 0` or `grid[n-1][n-1] != 0`, return -1
2. BFS from `(0,0)` with path length tracking
3. Use 8-directional delta arrays
4. Mark visited immediately when enqueueing (not when dequeuing!)
5. When we reach `(n-1, n-1)`, return current path length

**Solution**:

```java
class Solution {
    public int shortestPathBinaryMatrix(int[][] grid) {
        int n = grid.length;
        if (grid[0][0] != 0 || grid[n - 1][n - 1] != 0) return -1;
        if (n == 1) return 1; // Single cell

        int[] dr = {-1, -1, -1, 0, 0, 1, 1, 1};
        int[] dc = {-1, 0, 1, -1, 1, -1, 0, 1};

        Queue<int[]> queue = new LinkedList<>();
        queue.offer(new int[]{0, 0});
        grid[0][0] = 1; // Mark visited (use grid itself: 1 = visited/blocked)
        int pathLen = 1;

        while (!queue.isEmpty()) {
            int size = queue.size();
            pathLen++;

            for (int i = 0; i < size; i++) {
                int[] cell = queue.poll();

                for (int d = 0; d < 8; d++) {
                    int nr = cell[0] + dr[d];
                    int nc = cell[1] + dc[d];

                    if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;
                    if (grid[nr][nc] != 0) continue;

                    if (nr == n - 1 && nc == n - 1) return pathLen;

                    grid[nr][nc] = 1; // Mark visited BEFORE enqueueing
                    queue.offer(new int[]{nr, nc});
                }
            }
        }
        return -1;
    }
}
```

**Complexity**: Time O(n²), Space O(n²).  
**Why This Works**: BFS explores cells in order of increasing distance. The first time we reach the target, we've found the shortest path. 8 directions are handled identically to 4 — just more neighbors per cell. Marking visited on enqueue prevents duplicate processing.

---

## 2. Making A Large Island (LC 827) ⭐⭐⭐ Hard

**Companies**: Google, Amazon, Facebook  
**Pattern**: DFS component labeling + neighbor merging

**Problem**: Given an `n × n` binary grid, you may change at most one `0` to `1`. Return the size of the largest island.

| | c0 | c1 | c2 |
| --- | --- | --- | --- |
| **r0** | 1 | 0 | 1 |
| **r1** | 0 | 0 | 1 |
| **r2** | 1 | 1 | 1 |

Islands: the top-left cell is one island (size 1, id 2). The cells `(0,2)`, `(1,2)`, `(2,2)`, `(2,1)`, `(2,0)` are connected, so they form a single island (size 5, id 3).

| Flip | Neighbouring islands | New size |
| --- | --- | --- |
| `(0,1)` | id 2 (size 1) + id 3 (size 5) | 1 + 5 + 1 = **7** ← answer |
| `(1,0)` | id 2 (size 1) + id 3 (size 5) | 1 + 5 + 1 = 7 |
| `(1,1)` | id 3 only (reached twice, counted once) | 5 + 1 = 6 |

**Key Insight**: Two-pass approach:

1. **Label pass**: DFS to identify each island with a unique ID and record its size
2. **Merge pass**: For each 0-cell, check its 4 neighbors. Sum sizes of distinct neighboring islands + 1 (the flipped cell). Track the maximum.

**Approach**:

1. DFS from each unvisited 1-cell, assign island ID (starting from 2 to avoid confusion with 0/1), record size in a map
2. For each 0-cell, collect neighboring island IDs (use a Set to avoid double-counting if two neighbors belong to the same island)
3. Sum sizes of distinct neighboring islands + 1
4. Edge case: if grid is all 1s, answer = n²

**Solution**:

```java
class Solution {
    private int[] dr = {-1, 1, 0, 0};
    private int[] dc = {0, 0, -1, 1};

    public int largestIsland(int[][] grid) {
        int n = grid.length;
        Map<Integer, Integer> islandSize = new HashMap<>();
        int islandId = 2; // Start from 2 (0 and 1 are used)

        // Step 1: Label each island with unique ID and record size
        for (int r = 0; r < n; r++) {
            for (int c = 0; c < n; c++) {
                if (grid[r][c] == 1) {
                    int size = dfs(grid, r, c, islandId, n);
                    islandSize.put(islandId, size);
                    islandId++;
                }
            }
        }

        // Step 2: Try flipping each 0, merge adjacent distinct islands
        int maxSize = islandSize.values().stream()
                        .mapToInt(Integer::intValue).max().orElse(0);

        for (int r = 0; r < n; r++) {
            for (int c = 0; c < n; c++) {
                if (grid[r][c] == 0) {
                    Set<Integer> neighborIslands = new HashSet<>();
                    for (int d = 0; d < 4; d++) {
                        int nr = r + dr[d], nc = c + dc[d];
                        if (nr >= 0 && nr < n && nc >= 0 && nc < n
                            && grid[nr][nc] > 1) {
                            neighborIslands.add(grid[nr][nc]);
                        }
                    }
                    int merged = 1; // The flipped cell itself
                    for (int id : neighborIslands) {
                        merged += islandSize.get(id);
                    }
                    maxSize = Math.max(maxSize, merged);
                }
            }
        }
        return maxSize;
    }

    private int dfs(int[][] grid, int r, int c, int id, int n) {
        if (r < 0 || r >= n || c < 0 || c >= n || grid[r][c] != 1) return 0;
        grid[r][c] = id;
        int size = 1;
        for (int d = 0; d < 4; d++) {
            size += dfs(grid, r + dr[d], c + dc[d], id, n);
        }
        return size;
    }
}
```

**Complexity**: Time O(n²), Space O(n²).  
**Why This Works**: The labeling pass converts the problem from "which cells are connected?" to simple ID lookups. When we flip a 0, we just check which distinct island IDs border it (O(1) per cell) and sum their precomputed sizes. The Set prevents double-counting when a single island borders the 0-cell from multiple directions.

---

## 3. Swim in Rising Water (LC 778) ⭐⭐⭐ Hard

**Companies**: Google, Amazon  
**Pattern**: Min-heap BFS (modified Dijkstra) or Binary Search + BFS

**Problem**: An `n × n` grid where `grid[i][j]` = elevation. At time `t`, you can visit any cell with elevation ≤ `t`. You can move 4-directionally between adjacent cells if both have elevation ≤ `t`. Find the minimum `t` such that you can travel from `(0,0)` to `(n-1,n-1)`.

| | c0 | c1 | c2 |
| --- | --- | --- | --- |
| **r0** | 0 | 1 | 2 |
| **r1** | 3 | 8 | 4 |
| **r2** | 5 | 6 | 7 |

- At `t = 0` only `(0,0)` is reachable.
- Every path ends at `(2,2)`, whose elevation is 7, so the answer is at least 7. At `t = 7` the path `(0,0) → (0,1) → (0,2) → (1,2) → (2,2)` (elevations 0, 1, 2, 4, 7) is open, so the answer is **7**.
- In general the answer is the maximum elevation on the path we choose, minimised over all possible paths. That is a **minimax path problem**.

**Key Insight**: We need the path from `(0,0)` to `(n-1,n-1)` that minimizes the maximum elevation along the path. This is a **minimax path problem**, solvable with a min-heap BFS (essentially Dijkstra where "distance" = max elevation so far).

**Approach (Min-Heap / Dijkstra-like)**:

1. Priority queue ordered by elevation (min-heap)
2. Start at `(0,0)` with cost = `grid[0][0]`
3. Greedily expand the cell with lowest elevation
4. For each neighbor, the new cost = `max(currentCost, grid[nr][nc])`
5. When we reach `(n-1,n-1)`, return the cost
6. WHY: this is Dijkstra with `distance = max(path elevations)` instead of sum. The heap ensures we always expand the lowest-cost frontier.

**Solution**:

```java
class Solution {
    public int swimInWater(int[][] grid) {
        int n = grid.length;
        // {cost, row, col}, min-heap by cost
        PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] - b[0]);
        boolean[][] visited = new boolean[n][n];

        pq.offer(new int[]{grid[0][0], 0, 0});
        visited[0][0] = true;

        int[] dr = {-1, 1, 0, 0};
        int[] dc = {0, 0, -1, 1};

        while (!pq.isEmpty()) {
            int[] curr = pq.poll();
            int cost = curr[0], r = curr[1], c = curr[2];

            if (r == n - 1 && c == n - 1) return cost;

            for (int d = 0; d < 4; d++) {
                int nr = r + dr[d], nc = c + dc[d];
                if (nr >= 0 && nr < n && nc >= 0 && nc < n && !visited[nr][nc]) {
                    visited[nr][nc] = true;
                    // Cost to reach neighbor = max of path so far and neighbor's elevation
                    pq.offer(new int[]{Math.max(cost, grid[nr][nc]), nr, nc});
                }
            }
        }
        return -1; // Should never reach here for valid input
    }
}
```

**Alternative (Binary Search + BFS)**:

```java
class Solution {
    public int swimInWater(int[][] grid) {
        int n = grid.length;
        int lo = grid[0][0], hi = n * n - 1;

        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (canReach(grid, mid, n)) {
                hi = mid;
            } else {
                lo = mid + 1;
            }
        }
        return lo;
    }

    private boolean canReach(int[][] grid, int t, int n) {
        if (grid[0][0] > t) return false;
        boolean[][] visited = new boolean[n][n];
        Queue<int[]> queue = new LinkedList<>();
        queue.offer(new int[]{0, 0});
        visited[0][0] = true;
        int[] dr = {-1, 1, 0, 0};
        int[] dc = {0, 0, -1, 1};

        while (!queue.isEmpty()) {
            int[] cell = queue.poll();
            if (cell[0] == n - 1 && cell[1] == n - 1) return true;
            for (int d = 0; d < 4; d++) {
                int nr = cell[0] + dr[d], nc = cell[1] + dc[d];
                if (nr >= 0 && nr < n && nc >= 0 && nc < n
                    && !visited[nr][nc] && grid[nr][nc] <= t) {
                    visited[nr][nc] = true;
                    queue.offer(new int[]{nr, nc});
                }
            }
        }
        return false;
    }
}
```

**Complexity**: Dijkstra: Time O(n² log n), Space O(n²). Binary Search+BFS: Time O(n² log n), Space O(n²).  
**Why This Works**: The Dijkstra approach works because expanding in order of minimum max-elevation guarantees optimal substructure — similar to shortest path, but with `max` instead of `sum`. The binary search approach: "can we reach the target at time t?" is monotonic (if yes at t, then yes at t+1), so binary search applies.

---

## 4. [Trapping Rain Water II](https://leetcode.com/problems/trapping-rain-water-ii/) (LC 407) ⭐⭐⭐ Hard

**Companies**: Google, Amazon, Microsoft  
**Pattern**: Min-heap BFS from borders (3D water filling)

**Problem**: Given a 2D elevation map, compute the volume of water it can trap after raining. Water can flow 4-directionally.

| | c0 | c1 | c2 | c3 | c4 | c5 |
| --- | --- | --- | --- | --- | --- | --- |
| **r0** | 1 | 4 | 3 | 1 | 3 | 2 |
| **r1** | 3 | 2 | 1 | 3 | 2 | 4 |
| **r2** | 2 | 3 | 3 | 2 | 3 | 1 |

The border forms a wall. Water in an interior cell rises to the lowest point of the wall around it, then overflows. The interior cells are:

| Cell | Height | Water level | Water trapped |
| --- | --- | --- | --- |
| `(1,1)` | 2 | 3 | 1 |
| `(1,2)` | 1 | 3 | 2 |
| `(1,3)` | 3 | 3 | 0 |
| `(1,4)` | 2 | 3 | 1 |

Total water = 1 + 2 + 0 + 1 = **4**.

**Key Insight**: This is the 2D generalization of "Trapping Rain Water I" (which uses two-pointer on 1D). The key principle: **water at any cell is determined by the minimum height of the "wall" surrounding it.** We process from the borders inward using a min-heap, always processing the lowest wall first. This ensures we never overestimate water level.

**Approach**:

1. Add all border cells to a min-heap (sorted by height)
2. Mark border cells as visited
3. Process heap: poll the lowest cell (this is the current "wall" height)
4. For each unvisited neighbor:
   - If neighbor is lower than current wall: water = wall - neighbor height
   - Update max wall height: `max(current wall, neighbor height)`
   - Add neighbor to heap with the updated wall height
5. WHY min-heap: we process the lowest parts of the border first, which determines the bottleneck for water flow. Higher borders can hold water, lower borders let it escape.

**Solution**:

```java
class Solution {
    public int trapRainWater(int[][] heightMap) {
        int m = heightMap.length, n = heightMap[0].length;
        if (m < 3 || n < 3) return 0; // Can't trap water in tiny grid

        // Min-heap: {height, row, col}
        PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] - b[0]);
        boolean[][] visited = new boolean[m][n];

        // Step 1: Add all border cells to heap
        for (int r = 0; r < m; r++) {
            pq.offer(new int[]{heightMap[r][0], r, 0});
            pq.offer(new int[]{heightMap[r][n - 1], r, n - 1});
            visited[r][0] = true;
            visited[r][n - 1] = true;
        }
        for (int c = 1; c < n - 1; c++) {
            pq.offer(new int[]{heightMap[0][c], 0, c});
            pq.offer(new int[]{heightMap[m - 1][c], m - 1, c});
            visited[0][c] = true;
            visited[m - 1][c] = true;
        }

        int[] dr = {-1, 1, 0, 0};
        int[] dc = {0, 0, -1, 1};
        int water = 0;

        // Step 2: Process from lowest border inward
        while (!pq.isEmpty()) {
            int[] curr = pq.poll();
            int wallHeight = curr[0], r = curr[1], c = curr[2];

            for (int d = 0; d < 4; d++) {
                int nr = r + dr[d], nc = c + dc[d];
                if (nr >= 0 && nr < m && nc >= 0 && nc < n && !visited[nr][nc]) {
                    visited[nr][nc] = true;

                    // Water trapped = difference between wall and ground (if wall is higher)
                    water += Math.max(0, wallHeight - heightMap[nr][nc]);

                    // New wall height = max of current wall and neighbor's ground
                    pq.offer(new int[]{Math.max(wallHeight, heightMap[nr][nc]), nr, nc});
                }
            }
        }
        return water;
    }
}
```

**Complexity**: Time O(m × n × log(m × n)), Space O(m × n).  
**Why This Works**: The min-heap processes border cells from lowest to highest. Each cell we process represents the "wall" for its interior neighbors. If a neighbor is lower than the wall, water fills the gap. If the neighbor is higher, it becomes the new wall. This greedy process correctly computes the water level at every cell because:

- Water escapes through the lowest point of the surrounding "wall"
- Processing the lowest wall first ensures we accurately model overflow
- The min-heap guarantees we never process a cell before its constraining wall is established

---

[← 9. [Pacific Atlantic Water…](03_pacific_atlantic_water_flow_https_leetcode.md) | [Chapter overview](../19_Matrix.md) | [Cheat Sheets and Reference →](05_cheat_sheets_and_reference.md)
