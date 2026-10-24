# 📖 Part 4: Cheat Sheets and Reference

> **Navigation**: [← Hard Problems](04_hard_problems.md) | [Chapter overview](../19_Matrix.md)
> Page 5 of 5 in **19. Matrix / Grid — Complete Problem Guide**


**GRID TRAVERSAL PATTERNS — CHEAT SHEET**

| PATTERN | WHEN TO USE | KEY TEMPLATE |
| --- | --- | --- |
| DFS Flood Fill | Connected components, island counting | Recursive DFS with in-place marking |
| Multi-source BFS | Simultaneous spread, shortest from any source | Enqueue ALL sources, BFS level-by-level |
| Backtracking DFS | Path finding with constraints (word search) | Mark → recurse → unmark (restore) |
| Border DFS/BFS | Surrounded regions, ocean flow | Start from edges, work inward |
| Spiral Traversal | Matrix output ordering | 4 boundaries: top/bot/left/right |
| Layer Rotation | Rotate 90°/180°/270° | Transpose + reverse |
| State Encoding | In-place simultaneous updates (Game of Life) | Encode old+new in same cell, finalize |
| Min-Heap BFS (Dijkstra on Grid) | Minimax paths, 3D water trapping, weighted grid | Priority queue, process lowest first |
| Binary Search + BFS | "Minimum t such that path exists at time t" | BS on answer, BFS to validate |
| Union-Find on Grid | Dynamic connectivity, merging islands | Flatten 2D → 1D, union adjacent cells |

**DIRECTION ARRAYS — QUICK REFERENCE**

```text
4-DIRECTIONAL (Up, Down, Left, Right):
───────────────────────────────────────
int[] dr = {-1, 1, 0, 0};
int[] dc = {0, 0, -1, 1};

Alternative (array of pairs):
int[][] dirs = {{-1,0},{1,0},{0,-1},{0,1}};

──────────────────────────────────────────────────────────────────────

8-DIRECTIONAL (Including diagonals):
─────────────────────────────────────
int[] dr = {-1, -1, -1, 0, 0, 1, 1, 1};
int[] dc = {-1,  0,  1,-1, 1,-1, 0, 1};

Alternative (nested loop, generates all 8):
for (int di = -1; di <= 1; di++)
    for (int dj = -1; dj <= 1; dj++)
        if (di != 0 || dj != 0)  // skip (0,0) = self
            process(r + di, c + dj);

──────────────────────────────────────────────────────────────────────

KNIGHT MOVES (chess):
─────────────────────
int[] dr = {-2,-2,-1,-1, 1, 1, 2, 2};
int[] dc = {-1, 1,-2, 2,-2, 2,-1, 1};

──────────────────────────────────────────────────────────────────────

BOUNDARY CHECK (always use before accessing grid[nr][nc]):
──────────────────────────────────────────────────────────
boolean inBounds(int r, int c, int m, int n) {
    return r >= 0 && r < m && c >= 0 && c < n;
}

──────────────────────────────────────────────────────────────────────

2D → 1D INDEX MAPPING (for Union-Find, visited sets):
──────────────────────────────────────────────────────
int flatIndex = row * numCols + col;
int row = flatIndex / numCols;
int col = flatIndex % numCols;
```

**PROBLEM → PATTERN DECISION TREE**

```text
"Count connected components"          → DFS/BFS flood fill (LC 200)
"Shortest path, unweighted grid"      → BFS (LC 1091, LC 542)
"Simultaneous spread / minimum time"  → Multi-source BFS (LC 994)
"Path exists with constraint?"        → Backtracking DFS (LC 79)
"Border vs interior classification"   → Border DFS, reverse (LC 130)
"Flow from multiple sources"          → Reverse BFS from edges (LC 417)
"Output in spiral order"              → Boundary simulation (LC 54)
"Rotate matrix"                       → Transpose + Reverse (LC 48)
"Simultaneous state update"           → State encoding (LC 289)
"Set row/col to zero"                 → First row/col markers (LC 73)
"Minimax path / weighted shortest"    → Dijkstra min-heap (LC 778)
"3D water trapping"                   → Min-heap from borders (LC 407)
"Flip one cell, largest component"    → Label + merge (LC 827)
"Reshape/transpose matrix"            → Index mapping (LC 566, 867)
"Compute perimeter"                   → Neighbor counting (LC 463)
"Color connected region"              → Flood fill DFS (LC 733)
```

**BFS TEMPLATE FOR GRIDS**

```text
int bfs(int[][] grid, int startR, int startC) {
    int m = grid.length, n = grid[0].length;
    boolean[][] visited = new boolean[m][n];
    Queue<int[]> queue = new LinkedList<>();

    queue.offer(new int[]{startR, startC});
    visited[startR][startC] = true;  // ← MARK BEFORE ENQUEUE
    int steps = 0;

    int[] dr = {-1, 1, 0, 0};
    int[] dc = {0, 0, -1, 1};

    while (!queue.isEmpty()) {
        int size = queue.size();      // Level-by-level
        for (int i = 0; i < size; i++) {
            int[] cell = queue.poll();
            int r = cell[0], c = cell[1];

            // Process cell (check if target, etc.)

            for (int d = 0; d < 4; d++) {
                int nr = r + dr[d], nc = c + dc[d];
                if (nr >= 0 && nr < m && nc >= 0 && nc < n
                    && !visited[nr][nc] && grid[nr][nc] == valid) {
                    visited[nr][nc] = true;  // MARK HERE
                    queue.offer(new int[]{nr, nc});
                }
            }
        }
        steps++;
    }
    return steps;
}
```

**DFS TEMPLATE FOR GRIDS**

```text
// Recursive DFS (flood fill style)
void dfs(int[][] grid, int r, int c) {
    if (r < 0 || r >= grid.length ||
        c < 0 || c >= grid[0].length) return;  // Out of bounds
    if (grid[r][c] != TARGET) return;           // Not valid cell

    grid[r][c] = VISITED;  // Mark (in-place)

    dfs(grid, r - 1, c);  // Up
    dfs(grid, r + 1, c);  // Down
    dfs(grid, r, c - 1);  // Left
    dfs(grid, r, c + 1);  // Right
}

// Iterative DFS (avoids stack overflow on large grids)
void dfsIterative(int[][] grid, int startR, int startC) {
    Deque<int[]> stack = new ArrayDeque<>();
    stack.push(new int[]{startR, startC});
    grid[startR][startC] = VISITED;

    int[] dr = {-1, 1, 0, 0};
    int[] dc = {0, 0, -1, 1};

    while (!stack.isEmpty()) {
        int[] cell = stack.pop();
        for (int d = 0; d < 4; d++) {
            int nr = cell[0] + dr[d], nc = cell[1] + dc[d];
            if (nr >= 0 && nr < grid.length &&
                nc >= 0 && nc < grid[0].length &&
                grid[nr][nc] == TARGET) {
                grid[nr][nc] = VISITED;
                stack.push(new int[]{nr, nc});
            }
        }
    }
}
```

**COMPLEXITY SUMMARY — ALL 18 PROBLEMS**

| # | Problem | Time | Space | Pattern |
| --- | --- | --- | --- | --- |
| E1<br>E2<br>E3<br>E4<br>M1<br>M2<br>M3<br>M4<br>M5<br>M6<br>M7<br>M8<br>M9<br>M10<br>H1<br>H2<br>H3<br>H4 | Flood Fill (733)<br>Island Perimeter (463)<br>Reshape Matrix (566)<br>Transpose Matrix (867)<br>Number of Islands (200)<br>Rotting Oranges (994)<br>01 Matrix (542)<br>Spiral Matrix (54)<br>Rotate Image (48)<br>Set Matrix Zeroes (73)<br>Word Search (79)<br>Surrounded Regions (130)<br>Pacific Atlantic (417)<br>Game of Life (289)<br>Shortest Path Binary (1091)<br>Large Island (827)<br>Swim Rising Water (778)<br>Trapping Rain II (407) | O(m·n)<br>O(m·n)<br>O(m·n)<br>O(m·n)<br>O(m·n)<br>O(m·n)<br>O(m·n)<br>O(m·n)<br>O(n²)<br>O(m·n)<br>O(m·n·3^L)<br>O(m·n)<br>O(m·n)<br>O(m·n)<br>O(n²)<br>O(n²)<br>O(n²·log n)<br>O(mn·log mn) | O(m·n)<br>O(1)<br>O(m·n)<br>O(m·n)<br>O(m·n)<br>O(m·n)<br>O(m·n)<br>O(1)<br>O(1)<br>O(1)<br>O(L)<br>O(m·n)<br>O(m·n)<br>O(1)<br>O(n²)<br>O(n²)<br>O(n²)<br>O(m·n) | DFS fill<br>Count<br>Index map<br>Transform<br>DFS flood<br>Multi-BFS<br>Multi-BFS<br>Boundary<br>Transpose+Rev<br>Marker trick<br>Backtrack<br>Border DFS<br>Reverse BFS<br>State encode<br>BFS 8-dir<br>Label+merge<br>Dijkstra<br>Heap border |

---

## Historical Evolution

Strassen's 1969 algorithm showed that matrix multiplication takes fewer than `n³` operations (`O(n^2.81)`). Coppersmith–Winograd (1987/1990) lowered the exponent to about 2.376, and later work has pushed it slightly below 2.372, though these methods are rarely used in practice. Grid problems such as flood fill grew out of image-processing and maze-routing work (Lee, 1961), and Conway's Game of Life (1970, popularised by Martin Gardner) is the best-known grid simulation.

- **Lee — 1961**: Grid routing by BFS
- **Strassen — 1969**: `O(n^2.81)` multiplication
- **Conway — 1970**: Game of Life
- **Coppersmith & Winograd — 1990**: Exponent about 2.376

## Production Reality

**Matrix/Grid** patterns introduce several production failure modes that learners must internalize:

**Failure mode 1: In-place visited marking corrupts input data.** Setting `grid[r][c] = -1` to mark visited destroys the original value. After finding the island, the grid is permanently modified. Illustrative impact: A map navigation service that marks visited cells in-place corrupts the underlying map data, causing incorrect shortest-path queries on subsequent requests.

**Failure mode 2: Recursive DFS stack overflow on large grids (R*C > 10^4).** A 100x100 grid with all cells connected creates DFS depth of 10,000. Java's default stack (~5000 frames) crashes at depth ~4000-5000. Illustrative impact: A pixel analysis service processing a 500x500 image with flood-fill crashes on `StackOverflowError`.

**Failure mode 3: Direction array off-by-one on boundary cells.** Using `4` directions but forgetting to check `nr >= 0 && nr < rows && nc >= 0 && nc < cols` first causes `ArrayIndexOutOfBoundsException`. Illustrative impact: A game AI navigating a board with pieces near edges crashes when the pathfinding algorithm checks outside the board array.

**Debug workflow:** Before modifying grid in-place, create a copy: `char[][] copy = Arrays.copyOf(grid, grid.length);` For recursive DFS on large grids, convert to iterative BFS: use `Queue<int[]>` instead of recursion. For boundary bugs, add a helper function `private boolean inBounds(int r, int c, int m, int n)` and call it before every grid access. Add `@SuppressWarnings("serial")` to custom exceptions and log the out-of-bounds coordinates for debugging.

**Real-world anchor:** Flood fill, image segmentation and game-map code all need explicit bounds checks at the grid border; a missing check on one edge is the classic crash, and padding the grid with a sentinel border is the standard defensive trick.

---

[← Hard Problems](04_hard_problems.md) | [Chapter overview](../19_Matrix.md)
