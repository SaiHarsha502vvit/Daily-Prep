# PART 0: THEORY — Grid Fundamentals (MIT/KTH Style)

> **Navigation**: [Chapter overview](../19_Matrix.md) | [Easy Problems →](02_easy_problems.md)
> Page 1 of 5 in **19. Matrix / Grid — Complete Problem Guide**


> WHY MATRICES DOMINATE INTERVIEWS
> A 2D grid is the simplest spatial data structure. It models real-world
> maps, images, game boards, spreadsheets, and adjacency matrices. Nearly
> every graph algorithm can be asked as a grid problem — BFS, DFS,
> Dijkstra, Union-Find — but with the added complexity of boundary
> management and direction handling. Mastering grids = mastering spatial
> reasoning under constraint.

## Matrix as a 2D Array: Row-Major vs Column-Major

In Java (and C, Python, etc.), a 2D array `int[][] grid = new int[m][n]` stores data in **row-major order**: all elements of row 0 are contiguous in memory, then row 1, then row 2, etc.

**Logical view** (a 3 × 4 grid):

| | col 0 | col 1 | col 2 | col 3 |
| --- | --- | --- | --- | --- |
| **row 0** | 1 | 2 | 3 | 4 |
| **row 1** | 5 | 6 | 7 | 8 |
| **row 2** | 9 | 10 | 11 | 12 |

**Memory layout:**

| Layout | Order in memory |
| --- | --- |
| Row-major (Java, C, Python) | `[1][2][3][4]` `[5][6][7][8]` `[9][10][11][12]`: row 0, then row 1, then row 2 |
| Column-major (Fortran, MATLAB, Julia) | `[1][5][9]` `[2][6][10]` `[3][7][11]` `[4][8][12]`: col 0, then col 1, col 2, col 3 |

In row-major order, `grid[r][c]` lives at memory offset `r * numCols + c`.

**WHY this matters**: Iterating row-by-row (`for row... for col...`) is cache-friendly in Java. Iterating column-by-column causes cache misses. For large matrices, this can be a 10x performance difference.

> RULE: In Java, always iterate [row][col] in the inner loop unless the
> algorithm specifically requires column-first traversal.

## 4-Directional vs 8-Directional Movement

Grid problems frequently require exploring neighboring cells. We encode directions as delta arrays:

**4-directional (most common)**

| Direction | Delta `(dr, dc)` |
| --- | --- |
| Up ↑ | `(-1, 0)` |
| Down ↓ | `(+1, 0)` |
| Left ← | `(0, -1)` |
| Right → | `(0, +1)` |

**8-directional (diagonals included)** adds the four diagonals:

| | Left column | Same column | Right column |
| --- | --- | --- | --- |
| **Up row** | ↖ `(-1,-1)` | ↑ `(-1, 0)` | ↗ `(-1,+1)` |
| **Same row** | ← `(0,-1)` | ● (the cell itself) | → `(0,+1)` |
| **Down row** | ↙ `(+1,-1)` | ↓ `(+1, 0)` | ↘ `(+1,+1)` |

```java
// 4-dir
int[] dr = {-1, 1, 0, 0};
int[] dc = {0, 0, -1, 1};

// 8-dir
int[] dr = {-1,-1,-1, 0, 0, 1, 1, 1};
int[] dc = {-1, 0, 1,-1, 1,-1, 0, 1};

// Alternative 4-dir (compact)
int[][] dirs = {{-1,0},{1,0},{0,-1},{0,1}};
```

**Convention**: `(row, col)` maps to `(y, x)` in Cartesian terms. **row** increases downward (like `y` but inverted). **col** increases rightward (like `x`). This inconsistency causes countless bugs — always be explicit.

## BFS vs DFS on Grids: When to Use Each

| | Use BFS when | Use DFS when |
| --- | --- | --- |
| **Typical goals** | Shortest path (unweighted)<br>Level-by-level processing<br>Multi-source spread (rotting oranges, fire spreading)<br>Minimum distance queries | Connectivity / flood fill<br>"Does a path exist?" (yes/no)<br>Backtracking (word search, unique paths)<br>Counting connected components |
| **Why** | Guaranteed to find the shortest path in an unweighted grid | Simpler code, and less memory on a wide grid |
| **Structure** | Queue-based | Stack or recursion |
| **Time** | O(V + E) | O(V + E) |
| **Space** | O(V) for the queue | O(V) worst case (recursion depth on deep paths) |

For a grid, V = m × n and E ≈ 4 × m × n.

## Boundary Checking Patterns

Every grid traversal needs boundary checks. The canonical pattern:

```java
// Pattern 1: Check before recursive call / enqueue
for (int d = 0; d < 4; d++) {
    int nr = row + dr[d];
    int nc = col + dc[d];
    if (nr >= 0 && nr < m && nc >= 0 && nc < n && grid[nr][nc] == target) {
        // process (nr, nc)
    }
}

// Pattern 2: Check at function entry (DFS)
void dfs(int[][] grid, int r, int c) {
    if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length) return;
    if (grid[r][c] != target) return;
    grid[r][c] = visited; // mark
    dfs(grid, r - 1, c);
    dfs(grid, r + 1, c);
    dfs(grid, r, c - 1);
    dfs(grid, r, c + 1);
}
```

## In-Place Marking (Visited) Techniques

**VISITED MARKING STRATEGIES**

```text
1. Separate boolean[][] visited — safest, uses O(m*n) space
2. Modify grid in-place — set grid[r][c] = '#' or -1 or 2
   (destroys input, but O(1) extra space)
3. State encoding — use unused bits (Game of Life trick):
   grid[r][c] |= (newState << 1);  // encode both old and new state
4. Coordinate hashing — visited.add(r * cols + c) in a HashSet

CRITICAL: In BFS, mark visited WHEN ENQUEUEING, not when dequeuing.
Otherwise, the same cell gets enqueued multiple times → TLE.
```

## Spiral Traversal Logic

Spiral traversal peels the matrix layer by layer, shrinking the bounding box after each pass:

```
Layer 0 (outermost):              Layer 1 (inner):
→ → → → → ↓                      Only process what remains
↑         ↓                       inside the shrunk boundaries
↑         ↓
↑         ↓
← ← ← ← ←

Boundaries: top, bottom, left, right
  After top row:    top++
  After right col:  right--
  After bottom row: bottom--
  After left col:   left++

Terminate when top > bottom or left > right.
```

## Matrix Rotation: Transpose + Reverse = 90° Rotation

### Visual proof: 90° clockwise rotation = transpose + reverse each row

| Original | Transpose (swap `(i,j)` ↔ `(j,i)`) | Reverse each row |
| --- | --- | --- |
| `1 2 3`<br>`4 5 6`<br>`7 8 9` | `1 4 7`<br>`2 5 8`<br>`3 6 9` | `7 4 1`<br>`8 5 2`<br>`9 6 3` ← 90° clockwise |

**Why it works.** Transposing maps `(i,j)` → `(j,i)`. Reversing each row then mirrors horizontally. Together they map `(i,j)` → `(j, n-1-i)`, which is the definition of a 90° clockwise rotation.

**Variants**

| Rotation | Recipe |
| --- | --- |
| 90° clockwise | Transpose, then reverse each row |
| 90° counter-clockwise | Transpose, then reverse each column (or reverse the rows, then transpose) |
| 180° | Reverse each row and reverse each column |

## Common Mistakes (Top 7)

```text
MISTAKE #1: Off-By-One in Boundaries
───────────────────────────────────
WRONG: if (r >= 0 && r <= grid.length)    // should be < not <=
RIGHT: if (r >= 0 && r < grid.length && c >= 0 && c < grid[0].length)

MISTAKE #2: Forgetting Diagonal Movement
──────────────────────────────────────
Some problems require 8 directions (Shortest Path in Binary Matrix).
Always read the problem statement carefully for "adjacent" definitions.

MISTAKE #3: Not Marking Visited BEFORE Enqueueing in BFS
────────────────────────────────────────────────────────
WRONG: enqueue → poll → mark visited (duplicate enqueues!)
RIGHT: mark visited → enqueue → poll → process

MISTAKE #4: Confusing row/col with x/y
──────────────────────────────────────
grid[row][col] → row is the Y axis (vertical), col is X (horizontal).
When problem gives (x, y), translate: row = y, col = x.

MISTAKE #5: Modifying Grid While Iterating Over It
─────────────────────────────────────────────────
In Game of Life style problems, changing cells during iteration affects
neighbors. Use state encoding or a copy.

MISTAKE #6: Assuming Square Matrix
──────────────────────────────────
Always use m = grid.length (rows), n = grid[0].length (cols) separately.
Never assume m == n unless the problem guarantees it.

MISTAKE #7: Stack Overflow on Large Grids with Recursive DFS
───────────────────────────────────────────────────────────
A 1000×1000 grid can have DFS depth up to 1,000,000. Convert to
iterative DFS with an explicit stack, or use BFS instead.
```

---

[Chapter overview](../19_Matrix.md) | [Easy Problems →](02_easy_problems.md)
