# 🧩 Part 1: Easy Problems

> **Navigation**: [← THEORY — Grid Fundamentals (MIT/KTH Style)](01_theory_grid_fundamentals_mit_kth_style.md) | [Chapter overview](../19_Matrix.md) | [9. [Pacific Atlantic Water… →](03_pacific_atlantic_water_flow_https_leetcode.md)
> Page 2 of 5 in **19. Matrix / Grid — Complete Problem Guide**


```
╔══════════════════════════════════════════════════════════════════════════════╗
║                         EASY — 4 PROBLEMS                                    ║
║  Build intuition: basic traversals, simple transformations                   ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

## 1. [Flood Fill](https://leetcode.com/problems/flood-fill/) (LC 733) ⭐ Easy

**Companies**: Amazon, Google, Microsoft, Facebook  
**Pattern**: DFS / BFS flood fill

**Problem**: Given an image (2D array of pixel values), a starting pixel `(sr, sc)`, and a `color`, perform a flood fill: change the starting pixel and all 4-directionally connected pixels of the same original color to the new color.

```
Input:  image = [[1,1,1],    sr=1, sc=1, color=2
                 [1,1,0],
                 [1,0,1]]

Output: [[2,2,2],
         [2,2,0],
         [2,0,1]]

Starting at (1,1)=1, all connected 1's become 2.
The 1 at (2,2) is NOT connected (blocked by 0s diagonally — 4-dir only).
```

**Key Insight**: This is the most basic grid DFS/BFS. Start at the source, spread to all 4-directional neighbors that match the original color. The visited mechanism is built-in: once a cell is recolored, it no longer matches the original color.

**Approach**:

1. Record `originalColor = image[sr][sc]`
2. If `originalColor == color`, return immediately (no work needed — avoids infinite loop!)
3. DFS/BFS from `(sr, sc)`: change color, recurse on 4 neighbors with matching original color
4. WHY the base case matters: if original == new color, recoloring doesn't "mark" the cell, so DFS would revisit forever

**Solution**:

```java
class Solution {
    public int[][] floodFill(int[][] image, int sr, int sc, int color) {
        int originalColor = image[sr][sc];
        if (originalColor == color) return image; // Critical: avoid infinite loop
        dfs(image, sr, sc, originalColor, color);
        return image;
    }

    private void dfs(int[][] image, int r, int c, int orig, int newColor) {
        if (r < 0 || r >= image.length || c < 0 || c >= image[0].length) return;
        if (image[r][c] != orig) return;

        image[r][c] = newColor; // Color change acts as "visited" marker
        dfs(image, r - 1, c, orig, newColor);
        dfs(image, r + 1, c, orig, newColor);
        dfs(image, r, c - 1, orig, newColor);
        dfs(image, r, c + 1, orig, newColor);
    }
}
```

**Complexity**: Time O(m × n) — each cell visited at most once. Space O(m × n) — recursion stack in worst case (all same color).  
**Why This Works**: The recoloring itself prevents revisits. Each cell transitions from `orig` → `newColor` exactly once, and only cells with `orig` are candidates.

---

## 2. Island Perimeter (LC 463) ⭐ Easy

**Companies**: Google, Facebook, Bloomberg  
**Pattern**: Grid iteration with neighbor counting

**Problem**: Given a 2D grid where `1` = land, `0` = water, find the perimeter of the island. There is exactly one island (no lakes).

```
┌───┬───┬───┬───┐
│ 0 │ 1 │ 0 │ 0 │    Land cells: 7
├───┼───┼───┼───┤    Each land cell contributes 4 edges
│ 1 │ 1 │ 1 │ 0 │    Subtract 2 for each internal adjacency (shared edge)
├───┼───┼───┼───┤
│ 0 │ 1 │ 0 │ 0 │    Perimeter = 4 * landCells - 2 * internalEdges
├───┼───┼───┼───┤                = 4 * 7 - 2 * 6 = 28 - 12 = 16 ✓
│ 1 │ 1 │ 0 │ 0 │
└───┴───┴───┴───┘
```

**Key Insight**: No DFS/BFS needed! Every land cell starts with 4 edges. Each shared edge between two adjacent land cells removes 2 from the perimeter (one for each cell). Count land cells and right/down adjacencies.

**Approach**:

1. Iterate over every cell
2. If land: increment `islands` count
3. Check right neighbor: if also land, increment `neighbors`
4. Check bottom neighbor: if also land, increment `neighbors`
5. Result = `4 * islands - 2 * neighbors`
6. WHY only right and down? Each adjacency is counted once. Checking all 4 directions would double-count.

**Solution**:

```java
class Solution {
    public int islandPerimeter(int[][] grid) {
        int islands = 0, neighbors = 0;
        int m = grid.length, n = grid[0].length;

        for (int r = 0; r < m; r++) {
            for (int c = 0; c < n; c++) {
                if (grid[r][c] == 1) {
                    islands++;
                    if (r + 1 < m && grid[r + 1][c] == 1) neighbors++; // down
                    if (c + 1 < n && grid[r][c + 1] == 1) neighbors++; // right
                }
            }
        }
        return 4 * islands - 2 * neighbors;
    }
}
```

**Complexity**: Time O(m × n), Space O(1).  
**Why This Works**: The formula `4L − 2N` is an Euler-style counting argument. Each land cell exposes 4 sides. Each internal edge (shared between two land cells) subtracts 1 from each cell's exposed sides, hence −2 per adjacency.

---

## 3. Reshape the Matrix (LC 566) ⭐ Easy

**Companies**: Amazon, Microsoft  
**Pattern**: Index mapping (1D ↔ 2D)

**Problem**: Reshape a matrix from `m × n` to `r × c` (if valid). Fill new matrix row by row from original matrix read row by row.

```
Original (2×4):        Reshaped (4×2):
┌───┬───┬───┬───┐     ┌───┬───┐
│ 1 │ 2 │ 3 │ 4 │     │ 1 │ 2 │
├───┼───┼───┼───┤     ├───┼───┤
│ 5 │ 6 │ 7 │ 8 │     │ 3 │ 4 │
└───┴───┴───┴───┘     ├───┼───┤
                       │ 5 │ 6 │
1D view: [1,2,3,4, ├───┼───┤
          5,6,7,8]     │ 7 │ 8 │
                       └───┴───┘
Map 1D index i → 2D: (i / numCols, i % numCols)
```

**Key Insight**: Think of the matrix as a 1D array of `m*n` elements. Element at 1D index `i` maps to `(i / cols, i % cols)` in any reshaping. If `m*n != r*c`, reshape is impossible.

**Approach**:

1. Check if `m * n == r * c` — if not, return original
2. Use a single counter from 0 to `m*n - 1`
3. Map each counter to source and destination coordinates using `/` and `%`

**Solution**:

```java
class Solution {
    public int[][] matrixReshape(int[][] mat, int r, int c) {
        int m = mat.length, n = mat[0].length;
        if (m * n != r * c) return mat;

        int[][] result = new int[r][c];
        for (int i = 0; i < m * n; i++) {
            result[i / c][i % c] = mat[i / n][i % n];
        }
        return result;
    }
}
```

**Complexity**: Time O(m × n), Space O(r × c) for the result.  
**Why This Works**: The 1D↔2D bijection `i ↔ (i/cols, i%cols)` is the fundamental reshape operation. It's the same principle behind `numpy.reshape()`.

---

## 4. Transpose Matrix (LC 867) ⭐ Easy

**Companies**: Google, Amazon  
**Pattern**: Matrix transformation

**Problem**: Given a matrix, return its transpose. The transpose of a matrix swaps rows and columns: `result[j][i] = matrix[i][j]`.

```
Original (2×3):        Transposed (3×2):
┌───┬───┬───┐          ┌───┬───┐
│ 1 │ 2 │ 3 │          │ 1 │ 4 │
├───┼───┼───┤   →     ├───┼────┤
│ 4 │ 5 │ 6 │          │ 2 │ 5 │
└───┴───┴───┘          ├───┼───┤
                        │ 3 │ 6 │
                        └───┴───┘

(i,j) in original → (j,i) in transpose
```

**Key Insight**: The transpose of an `m × n` matrix is an `n × m` matrix. For non-square matrices, this cannot be done in-place.

**Approach**:

1. Create a new `n × m` matrix
2. For each `(i, j)` in the original, set `result[j][i] = matrix[i][j]`

**Solution**:

```java
class Solution {
    public int[][] transpose(int[][] matrix) {
        int m = matrix.length, n = matrix[0].length;
        int[][] result = new int[n][m];

        for (int i = 0; i < m; i++) {
            for (int j = 0; j < n; j++) {
                result[j][i] = matrix[i][j];
            }
        }
        return result;
    }
}
```

**Complexity**: Time O(m × n), Space O(m × n).  
**Why This Works**: The transpose is a linear algebra operation that reflects the matrix over its main diagonal. The mapping `(i,j) → (j,i)` is its definition.

---

## 🧩 Part 2: Medium Problems

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                        MEDIUM — 10 PROBLEMS                                  ║
║  Core grid patterns: BFS, DFS, simulation, backtracking, state encoding      ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

### 1. [Number of Islands](https://leetcode.com/problems/number-of-islands/) (LC 200) ⭐⭐ Medium

**Companies**: Amazon, Google, Microsoft, Facebook, Bloomberg, Apple, Uber  
**Pattern**: DFS flood fill to count connected components

**Problem**: Given a 2D grid of `'1'` (land) and `'0'` (water), count the number of islands. An island is surrounded by water and formed by connecting adjacent (4-directional) lands.

```
Grid:                          Islands = 3
┌───┬───┬───┬───┬───┐
│ 1 │ 1 │ 0 │ 0 │ 0 │        Island 1: top-left 1,1
├───┼───┼───┼───┼───┤        Island 2: top-right 1
│ 1 │ 1 │ 0 │ 0 │ 0 │        Island 3: bottom-right 1
├───┼───┼───┼───┼───┤
│ 0 │ 0 │ 1 │ 0 │ 0 │
├───┼───┼───┼───┼───┤
│ 0 │ 0 │ 0 │ 1 │ 1 │
└───┴───┴───┴───┴───┘
```

**Key Insight**: Each island is a connected component. When we find an unvisited land cell, that's a new island. DFS/BFS marks the entire component as visited, so it won't be counted again.

**Approach**:

1. Scan grid left-to-right, top-to-bottom
2. When we find `'1'`: increment island count, then DFS to "sink" the entire island (change all connected `'1'` to `'0'`)
3. WHY sinking works: by modifying the grid, we get O(1) extra space and don't need a visited array
4. Each cell is visited exactly once across all DFS calls combined

**Solution**:

```java
class Solution {
    public int numIslands(char[][] grid) {
        int count = 0;
        int m = grid.length, n = grid[0].length;

        for (int r = 0; r < m; r++) {
            for (int c = 0; c < n; c++) {
                if (grid[r][c] == '1') {
                    count++;
                    sink(grid, r, c); // DFS: sink entire island
                }
            }
        }
        return count;
    }

    private void sink(char[][] grid, int r, int c) {
        if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length) return;
        if (grid[r][c] != '1') return;

        grid[r][c] = '0'; // Sink this cell
        sink(grid, r - 1, c);
        sink(grid, r + 1, c);
        sink(grid, r, c - 1);
        sink(grid, r, c + 1);
    }
}
```

**Complexity**: Time O(m × n), Space O(m × n) worst case for recursion stack.  
**Why This Works**: This is a direct application of connected-component counting. Each DFS marks exactly one component. Total work across all DFS calls = O(m × n) because each cell flips from `'1'` to `'0'` at most once.

---

## 2. [Rotting Oranges](https://leetcode.com/problems/rotting-oranges/) (LC 994) ⭐⭐ Medium

**Companies**: Amazon, Google, Microsoft, Facebook, Uber  
**Pattern**: Multi-source BFS (simultaneous spread)

**Problem**: In a grid, `0` = empty, `1` = fresh orange, `2` = rotten orange. Every minute, fresh oranges adjacent (4-dir) to rotten ones become rotten. Return the minimum minutes until no fresh orange remains, or -1 if impossible.

```
Minute 0:         Minute 1:         Minute 2:         Minute 3:         Minute 4:
┌───┬───┬───┐    ┌───┬───┬───┐    ┌───┬───┬───┐    ┌───┬───┬───┐    ┌───┬───┬───┐
│ 2 │ 1 │ 1 │    │ 2 │ 2 │ 1 │    │ 2 │ 2 │ 2 │    │ 2 │ 2 │ 2 │    │ 2 │ 2 │ 2 │
├───┼───┼───┤    ├───┼───┼───┤    ├───┼───┼───┤    ├───┼───┼───┤    ├───┼───┼───┤
│ 1 │ 1 │ 0 │ →  │ 2 │ 1 │ 0 │ →  │ 2 │ 2 │ 0 │ →  │ 2 │ 2 │ 0 │ →  │ 2 │ 2 │ 0 │
├───┼───┼───┤    ├───┼───┼───┤    ├───┼───┼───┤    ├───┼───┼───┤    ├───┼───┼───┤
│ 0 │ 1 │ 1 │    │ 0 │ 1 │ 1 │    │ 0 │ 1 │ 1 │    │ 0 │ 2 │ 1 │    │ 0 │ 2 │ 2 │
└───┴───┴───┘    └───┴───┴───┘    └───┴───┴───┘    └───┴───┴───┘    └───┴───┴───┘
                                                                       Answer = 4
```

**Key Insight**: This is multi-source BFS. All rotten oranges at time 0 spread simultaneously — exactly like BFS level-by-level, where each level = one minute. We start BFS from ALL rotten oranges at once.

**Approach**:

1. Scan grid: enqueue all rotten oranges, count fresh oranges
2. BFS level-by-level: for each rotten orange, rot its fresh neighbors
3. Each level processes = one minute
4. After BFS: if `fresh == 0`, return minutes; else return -1
5. WHY multi-source BFS: each BFS level corresponds to exactly one tick of the clock

**Solution**:

```java
class Solution {
    public int orangesRotting(int[][] grid) {
        int m = grid.length, n = grid[0].length;
        Queue<int[]> queue = new LinkedList<>();
        int fresh = 0;

        // Step 1: Find all rotten oranges and count fresh ones
        for (int r = 0; r < m; r++) {
            for (int c = 0; c < n; c++) {
                if (grid[r][c] == 2) queue.offer(new int[]{r, c});
                else if (grid[r][c] == 1) fresh++;
            }
        }

        if (fresh == 0) return 0; // No fresh oranges — already done

        int[] dr = {-1, 1, 0, 0};
        int[] dc = {0, 0, -1, 1};
        int minutes = 0;

        // Step 2: Multi-source BFS
        while (!queue.isEmpty() && fresh > 0) {
            int size = queue.size();
            minutes++;
            for (int i = 0; i < size; i++) {
                int[] cell = queue.poll();
                for (int d = 0; d < 4; d++) {
                    int nr = cell[0] + dr[d];
                    int nc = cell[1] + dc[d];
                    if (nr >= 0 && nr < m && nc >= 0 && nc < n && grid[nr][nc] == 1) {
                        grid[nr][nc] = 2; // Mark rotten BEFORE enqueueing
                        fresh--;
                        queue.offer(new int[]{nr, nc});
                    }
                }
            }
        }

        return fresh == 0 ? minutes : -1;
    }
}
```

**Complexity**: Time O(m × n), Space O(m × n).  
**Why This Works**: Multi-source BFS processes all sources simultaneously. Each level corresponds to one unit of time. The BFS guarantee: every cell is reached in the minimum possible time from any source.

---

## 3. [01 Matrix](https://leetcode.com/problems/zero-one-matrix/) (LC 542) ⭐⭐ Medium

**Companies**: Google, Amazon, Microsoft, Facebook  
**Pattern**: Multi-source BFS from all 0s

**Problem**: Given a binary matrix, find the distance of the nearest 0 for each cell. Distance = 4-directional steps.

```
Input:           Output:
┌───┬───┬───┐   ┌───┬───┬───┐
│ 0 │ 0 │ 0 │   │ 0 │ 0 │ 0 │
├───┼───┼───┤   ├───┼───┼───┤
│ 0 │ 1 │ 0 │   │ 0 │ 1 │ 0 │
├───┼───┼───┤   ├───┼───┼───┤
│ 1 │ 1 │ 1 │   │ 1 │ 2 │ 1 │
└───┴───┴───┘   └───┴───┴───┘
```

**Key Insight**: Instead of BFS from each 1 to find the nearest 0 (O(m²n²)), reverse the problem: BFS from ALL 0s simultaneously. Each BFS level marks cells at distance 1, then 2, then 3, etc.

**Approach**:

1. Initialize result matrix: 0 for 0-cells, `Integer.MAX_VALUE` for 1-cells
2. Enqueue all 0-cells into BFS queue
3. BFS: for each cell, check 4 neighbors. If neighbor's current distance > current + 1, update and enqueue
4. WHY: BFS guarantees first-visit = shortest distance. Starting from all 0s ensures every cell's nearest 0 is found optimally.

**Solution**:

```java
class Solution {
    public int[][] updateMatrix(int[][] mat) {
        int m = mat.length, n = mat[0].length;
        int[][] dist = new int[m][n];
        Queue<int[]> queue = new LinkedList<>();

        // Initialize: 0-cells have distance 0, others MAX
        for (int r = 0; r < m; r++) {
            for (int c = 0; c < n; c++) {
                if (mat[r][c] == 0) {
                    queue.offer(new int[]{r, c});
                } else {
                    dist[r][c] = Integer.MAX_VALUE;
                }
            }
        }

        int[] dr = {-1, 1, 0, 0};
        int[] dc = {0, 0, -1, 1};

        while (!queue.isEmpty()) {
            int[] cell = queue.poll();
            for (int d = 0; d < 4; d++) {
                int nr = cell[0] + dr[d];
                int nc = cell[1] + dc[d];
                if (nr >= 0 && nr < m && nc >= 0 && nc < n
                    && dist[nr][nc] > dist[cell[0]][cell[1]] + 1) {
                    dist[nr][nc] = dist[cell[0]][cell[1]] + 1;
                    queue.offer(new int[]{nr, nc});
                }
            }
        }
        return dist;
    }
}
```

**Complexity**: Time O(m × n), Space O(m × n).  
**Why This Works**: This is the textbook multi-source BFS for shortest distance. By starting from all 0s, BFS radiates outward in concentric layers, and the first time any cell is reached, it's guaranteed to be at minimum distance.

---

## 4. [Spiral Matrix](https://leetcode.com/problems/spiral-matrix/) (LC 54) ⭐⭐ Medium

**Companies**: Amazon, Google, Microsoft, Apple, Facebook, Uber  
**Pattern**: Boundary simulation (layer peeling)

**Problem**: Given an `m × n` matrix, return all elements in spiral order.

```
┌───┬───┬───┬───┐
│ 1 │ 2 │ 3 │ 4 │  →  Output: [1,2,3,4,8,12,11,10,9,5,6,7]
├───┼───┼───┼───┤
│ 5 │ 6 │ 7 │ 8 │      → → → ↓
├───┼───┼───┼───┤      ↑ → → ↓
│ 9 │10 │11 │12 │      ↑ ← ← ←
└───┴───┴───┴───┘
```

**Key Insight**: Maintain four boundaries: `top`, `bottom`, `left`, `right`. Traverse top row → right column → bottom row → left column, shrinking boundaries after each pass. Stop when boundaries cross.

**Approach**:

1. Initialize `top = 0, bottom = m-1, left = 0, right = n-1`
2. Loop while `top <= bottom && left <= right`:
   - Traverse right: `col` from `left` to `right` at row `top`, then `top++`
   - Traverse down: `row` from `top` to `bottom` at col `right`, then `right--`
   - Traverse left: if `top <= bottom`, `col` from `right` to `left` at row `bottom`, then `bottom--`
   - Traverse up: if `left <= right`, `row` from `bottom` to `top` at col `left`, then `left++`
3. WHY the extra checks for left and up: single-row or single-column matrices can cause double-traversal

**Solution**:

```java
class Solution {
    public List<Integer> spiralOrder(int[][] matrix) {
        List<Integer> result = new ArrayList<>();
        if (matrix.length == 0) return result;

        int top = 0, bottom = matrix.length - 1;
        int left = 0, right = matrix[0].length - 1;

        while (top <= bottom && left <= right) {
            // Traverse right along top row
            for (int c = left; c <= right; c++)
                result.add(matrix[top][c]);
            top++;

            // Traverse down along right column
            for (int r = top; r <= bottom; r++)
                result.add(matrix[r][right]);
            right--;

            // Traverse left along bottom row (if rows remain)
            if (top <= bottom) {
                for (int c = right; c >= left; c--)
                    result.add(matrix[bottom][c]);
                bottom--;
            }

            // Traverse up along left column (if cols remain)
            if (left <= right) {
                for (int r = bottom; r >= top; r--)
                    result.add(matrix[r][left]);
                left++;
            }
        }
        return result;
    }
}
```

**Complexity**: Time O(m × n), Space O(1) extra (output doesn't count).  
**Why This Works**: Each boundary shrinks exactly once per direction traversal. The `top <= bottom` and `left <= right` guards prevent re-traversal in degenerate (single-row/col) cases. Total elements visited = m × n exactly.

---

## 5. [Rotate Image](https://leetcode.com/problems/rotate-image/) (LC 48) ⭐⭐ Medium

**Companies**: Amazon, Google, Microsoft, Apple, Facebook  
**Pattern**: Transpose + Reverse (in-place rotation)

**Problem**: Rotate an `n × n` matrix 90 degrees clockwise **in-place**.

```
Original:        Step 1 - Transpose:   Step 2 - Reverse rows:
┌───┬───┬───┐   ┌───┬───┬───┐        ┌───┬───┬───┐
│ 1 │ 2 │ 3 │   │ 1 │ 4 │ 7 │        │ 7 │ 4 │ 1 │
├───┼───┼───┤ → ├───┼───┼───┤   →   ├───┼───┼────┤
│ 4 │ 5 │ 6 │   │ 2 │ 5 │ 8 │        │ 8 │ 5 │ 2 │
├───┼───┼───┤   ├───┼───┼───┤        ├───┼───┼───┤
│ 7 │ 8 │ 9 │   │ 3 │ 6 │ 9 │        │ 9 │ 6 │ 3 │
└───┴───┴───┘   └───┴───┴───┘        └───┴───┴───┘
                                       90° CW ✓
```

**Key Insight**: 90° clockwise = transpose (swap `(i,j)` ↔ `(j,i)`) + reverse each row. Both operations are in-place with O(1) extra space.

**Approach**:

1. **Transpose**: iterate upper triangle, swap `matrix[i][j]` with `matrix[j][i]`
2. **Reverse each row**: two-pointer swap from ends toward center
3. WHY: Transpose maps (i,j)→(j,i). Reversing row j maps column index c→(n-1-c). Composition: (i,j)→(j,i)→(j,n-1-i), which is 90° CW.

**Solution**:

```java
class Solution {
    public void rotate(int[][] matrix) {
        int n = matrix.length;

        // Step 1: Transpose — swap across main diagonal
        for (int i = 0; i < n; i++) {
            for (int j = i + 1; j < n; j++) { // j starts at i+1 (upper triangle only)
                int temp = matrix[i][j];
                matrix[i][j] = matrix[j][i];
                matrix[j][i] = temp;
            }
        }

        // Step 2: Reverse each row
        for (int i = 0; i < n; i++) {
            int lo = 0, hi = n - 1;
            while (lo < hi) {
                int temp = matrix[i][lo];
                matrix[i][lo] = matrix[i][hi];
                matrix[i][hi] = temp;
                lo++;
                hi--;
            }
        }
    }
}
```

**Complexity**: Time O(n²), Space O(1).  
**Why This Works**: The mathematical proof: for any element at position `(r, c)` in the original, after 90° CW rotation it should be at `(c, n-1-r)`. Transpose sends `(r,c)→(c,r)`. Row reversal sends `(c,r)→(c,n-1-r)`. Composed: `(r,c)→(c,n-1-r)`. QED.

---

## 6. [Set Matrix Zeroes](https://leetcode.com/problems/set-matrix-zeroes/) (LC 73) ⭐⭐ Medium

**Companies**: Amazon, Microsoft, Facebook, Apple, Bloomberg  
**Pattern**: Space optimization with first row/col as markers

**Problem**: Given an `m × n` matrix, if any element is 0, set its entire row and column to 0. Do it **in-place**.

```
Input:           Output:
┌───┬───┬───┐   ┌───┬───┬───┐
│ 1 │ 1 │ 1 │   │ 1 │ 0 │ 1 │   The 0 at (1,1) zeroes all of row 1
├───┼───┼───┤   ├───┼───┼───┤   and all of column 1.
│ 1 │ 0 │ 1 │   │ 0 │ 0 │ 0 │
├───┼───┼───┤   ├───┼───┼───┤
│ 1 │ 1 │ 1 │   │ 1 │ 0 │ 1 │
└───┴───┴───┘   └───┴───┴───┘
```

**Key Insight**: O(m+n) approach: use separate arrays to track which rows/cols to zero. O(1) approach: use the **first row and first column** of the matrix itself as markers! A special flag tracks whether the first row/col themselves need zeroing.

**Approach (O(1) space)**:

1. Check if first row has any 0 → `rowFlag`. Check if first col has any 0 → `colFlag`
2. For all cells `(i,j)` where `i>0, j>0`: if `matrix[i][j] == 0`, set `matrix[i][0] = 0` and `matrix[0][j] = 0`
3. Use these markers to zero the inner cells
4. Finally, zero first row if `rowFlag`, first col if `colFlag`
5. WHY order matters: we zero inner cells first, then first row/col, so markers aren't corrupted prematurely

**Solution**:

```java
class Solution {
    public void setZeroes(int[][] matrix) {
        int m = matrix.length, n = matrix[0].length;
        boolean firstRowZero = false, firstColZero = false;

        // Step 1: Check if first row/col have zeros
        for (int c = 0; c < n; c++)
            if (matrix[0][c] == 0) firstRowZero = true;
        for (int r = 0; r < m; r++)
            if (matrix[r][0] == 0) firstColZero = true;

        // Step 2: Use first row/col as markers for inner matrix
        for (int r = 1; r < m; r++) {
            for (int c = 1; c < n; c++) {
                if (matrix[r][c] == 0) {
                    matrix[r][0] = 0; // Mark row
                    matrix[0][c] = 0; // Mark col
                }
            }
        }

        // Step 3: Zero inner cells based on markers
        for (int r = 1; r < m; r++) {
            for (int c = 1; c < n; c++) {
                if (matrix[r][0] == 0 || matrix[0][c] == 0) {
                    matrix[r][c] = 0;
                }
            }
        }

        // Step 4: Zero first row and column if needed
        if (firstRowZero)
            for (int c = 0; c < n; c++) matrix[0][c] = 0;
        if (firstColZero)
            for (int r = 0; r < m; r++) matrix[r][0] = 0;
    }
}
```

**Complexity**: Time O(m × n), Space O(1).  
**Why This Works**: By storing "this row/col should be zeroed" in the matrix's own border, we avoid extra space. The careful ordering (inner first, borders last) ensures we don't corrupt our markers before using them.

---

## 7. [Word Search](https://leetcode.com/problems/word-search/) (LC 79) ⭐⭐ Medium

**Companies**: Amazon, Google, Microsoft, Facebook, Bloomberg, Apple  
**Pattern**: Backtracking DFS on grid

**Problem**: Given an `m × n` board of characters and a `word`, return `true` if the word exists in the grid. The word can be constructed from 4-directionally adjacent cells. Each cell may be used at most once per word.

```
Board:                  word = "ABCCED" → true
┌───┬───┬───┬───┐      A → B → C
│ A │ B │ C │ E │            │
├───┼───┼───┼───┤            C ← E → D (nope, "ABCCED"):
│ S │ F │ C │ S │            actually: A→B→C→C→E→D
├───┼───┼───┼───┤                          ↓
│ A │ D │ E │ E │            path: (0,0)→(0,1)→(0,2)→(1,2)→(1,3)... wait
└───┴───┴───┴───┘            (0,0)A→(0,1)B→(0,2)C→(1,2)C→(2,2)E→(2,1)D ✓
```

**Key Insight**: This is a constrained DFS with backtracking. For each starting cell that matches `word[0]`, attempt to extend the path. Mark cells as visited along the path, but **unmark on backtrack** (this is the backtracking part).

**Approach**:

1. For each cell matching `word[0]`, start DFS
2. DFS(r, c, index): if `index == word.length`, return true (found!)
3. Check bounds, check `board[r][c] == word[index]`
4. Mark cell (e.g., `board[r][c] = '#'`), recurse on 4 neighbors with `index + 1`
5. **Unmark cell** after recursion (backtrack)
6. WHY backtrack: the same cell might be needed for a different path starting from a different position

**Solution**:

```java
class Solution {
    public boolean exist(char[][] board, String word) {
        int m = board.length, n = board[0].length;

        for (int r = 0; r < m; r++) {
            for (int c = 0; c < n; c++) {
                if (dfs(board, word, r, c, 0)) return true;
            }
        }
        return false;
    }

    private boolean dfs(char[][] board, String word, int r, int c, int idx) {
        if (idx == word.length()) return true; // All characters matched
        if (r < 0 || r >= board.length || c < 0 || c >= board[0].length) return false;
        if (board[r][c] != word.charAt(idx)) return false;

        char saved = board[r][c];
        board[r][c] = '#'; // Mark visited

        boolean found = dfs(board, word, r - 1, c, idx + 1)
                      || dfs(board, word, r + 1, c, idx + 1)
                      || dfs(board, word, r, c - 1, idx + 1)
                      || dfs(board, word, r, c + 1, idx + 1);

        board[r][c] = saved; // Backtrack: unmark
        return found;
    }
}
```

**Complexity**: Time O(m × n × 3^L) where L = word length (3 branches because we don't go back). Space O(L) recursion depth.  
**Why This Works**: Backtracking explores all possible paths. The short-circuit `||` stops as soon as one path matches. The 3^L factor (not 4^L) comes from the fact that we never revisit the cell we just came from.

---

## 8. [Surrounded Regions](https://leetcode.com/problems/surrounded-regions/) (LC 130) ⭐⭐ Medium

**Companies**: Amazon, Google, Microsoft, Facebook  
**Pattern**: Border-connected DFS (reverse thinking)

**Problem**: Given a board with `'X'` and `'O'`, capture all regions of `'O'` that are **completely surrounded** by `'X'`. A region is NOT captured if any of its `'O'` cells is on the border.

```
Input:                   Output:
┌───┬───┬───┬───┐      ┌───┬───┬───┬───┐
│ X │ X │ X │ X │      │ X │ X │ X │ X │
├───┼───┼───┼───┤      ├───┼───┼───┼───┤
│ X │ O │ O │ X │  →   │ X │ X │ X │ X │  ← Inner O's captured
├───┼───┼───┼───┤      ├───┼───┼───┼───┤
│ X │ X │ O │ X │      │ X │ X │ X │ X │
├───┼───┼───┼───┤      ├───┼───┼───┼───┤
│ X │ O │ X │ X │      │ X │ O │ X │ X │  ← Border O survives
└───┴───┴───┴───┘      └───┴───┴───┴───┘
```

**Key Insight**: Instead of finding surrounded regions (hard), find **unsurrounded** regions (connected to border). Mark them safe. Everything else gets captured. This is the "reverse thinking" pattern.

**Approach**:

1. DFS/BFS from every `'O'` on the border → mark these as `'S'` (safe)
2. Scan the entire board:
   - `'O'` → `'X'` (was surrounded, capture it)
   - `'S'` → `'O'` (was safe, restore it)
3. WHY: border-connected O's cannot be surrounded (they touch the edge). Any O NOT reachable from the border IS fully surrounded.

**Solution**:

```java
class Solution {
    public void solve(char[][] board) {
        int m = board.length, n = board[0].length;

        // Step 1: Mark border-connected O's as safe ('S')
        for (int r = 0; r < m; r++) {
            if (board[r][0] == 'O') markSafe(board, r, 0);
            if (board[r][n - 1] == 'O') markSafe(board, r, n - 1);
        }
        for (int c = 0; c < n; c++) {
            if (board[0][c] == 'O') markSafe(board, 0, c);
            if (board[m - 1][c] == 'O') markSafe(board, m - 1, c);
        }

        // Step 2: Capture surrounded O's, restore safe ones
        for (int r = 0; r < m; r++) {
            for (int c = 0; c < n; c++) {
                if (board[r][c] == 'O') board[r][c] = 'X';      // Captured
                else if (board[r][c] == 'S') board[r][c] = 'O';  // Restored
            }
        }
    }

    private void markSafe(char[][] board, int r, int c) {
        if (r < 0 || r >= board.length || c < 0 || c >= board[0].length) return;
        if (board[r][c] != 'O') return;

        board[r][c] = 'S'; // Mark safe
        markSafe(board, r - 1, c);
        markSafe(board, r + 1, c);
        markSafe(board, r, c - 1);
        markSafe(board, r, c + 1);
    }
}
```

**Complexity**: Time O(m × n), Space O(m × n) recursion stack worst case.  
**Why This Works**: We solve the complement problem. "Which O's are NOT surrounded?" = "Which O's can reach the border?" DFS from borders finds exactly these. Everything else is surrounded and gets captured.

---

[← THEORY — Grid Fundamentals (MIT/KTH Style)](01_theory_grid_fundamentals_mit_kth_style.md) | [Chapter overview](../19_Matrix.md) | [9. [Pacific Atlantic Water… →](03_pacific_atlantic_water_flow_https_leetcode.md)
