# Matrix + Grid Traversal — Combined Pattern Guide

> **WHY this combination?** 2D grids are graphs where each cell connects to its 4 (or 8) neighbors. BFS/DFS on grids solve island counting, flood fill, shortest path, and rotation problems.

---

## 🧠 WHEN TO RECOGNIZE

```
IF the problem has:
  ✅ 2D grid/matrix
  ✅ "Number of islands" / "Connected regions"
  ✅ "Shortest path" in maze
  ✅ "Rotate" / "Spiral" / "Transpose"
  ✅ "Flood fill" / "Surrounded regions"
THEN → Matrix + BFS/DFS/Math
```

---

## 📐 CORE TEMPLATES

### Template 1: DFS Flood Fill (Island Counting)
```java
int[][] dirs = {{0,1},{0,-1},{1,0},{-1,0}};

int numIslands(char[][] grid) {
    int count = 0;
    for (int i = 0; i < grid.length; i++)
        for (int j = 0; j < grid[0].length; j++)
            if (grid[i][j] == '1') { dfs(grid, i, j); count++; }
    return count;
}

void dfs(char[][] grid, int r, int c) {
    if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length || grid[r][c] != '1') return;
    grid[r][c] = '0';  // mark visited
    for (int[] d : dirs) dfs(grid, r + d[0], c + d[1]);
}
```

### Template 2: BFS Shortest Path in Grid
```java
int shortestPath(int[][] grid, int[] start, int[] end) {
    Queue<int[]> queue = new LinkedList<>();
    boolean[][] visited = new boolean[m][n];
    queue.offer(start);
    visited[start[0]][start[1]] = true;
    int dist = 0;

    while (!queue.isEmpty()) {
        int size = queue.size();
        for (int i = 0; i < size; i++) {
            int[] cell = queue.poll();
            if (cell[0] == end[0] && cell[1] == end[1]) return dist;
            for (int[] d : dirs) {
                int nr = cell[0] + d[0], nc = cell[1] + d[1];
                if (nr >= 0 && nr < m && nc >= 0 && nc < n && !visited[nr][nc] && grid[nr][nc] == 0) {
                    visited[nr][nc] = true;
                    queue.offer(new int[]{nr, nc});
                }
            }
        }
        dist++;
    }
    return -1;
}
```

### Template 3: Spiral Traversal
```java
List<Integer> spiralOrder(int[][] matrix) {
    List<Integer> result = new ArrayList<>();
    int top = 0, bottom = m-1, left = 0, right = n-1;
    while (top <= bottom && left <= right) {
        for (int c = left; c <= right; c++) result.add(matrix[top][c]); top++;
        for (int r = top; r <= bottom; r++) result.add(matrix[r][right]); right--;
        if (top <= bottom) { for (int c = right; c >= left; c--) result.add(matrix[bottom][c]); bottom--; }
        if (left <= right) { for (int r = bottom; r >= top; r--) result.add(matrix[r][left]); left++; }
    }
    return result;
}
```

### Template 4: Rotate 90° Clockwise
```java
// Transpose + Reverse each row
void rotate(int[][] matrix) {
    int n = matrix.length;
    // Transpose
    for (int i = 0; i < n; i++)
        for (int j = i+1; j < n; j++)
            { int t = matrix[i][j]; matrix[i][j] = matrix[j][i]; matrix[j][i] = t; }
    // Reverse each row
    for (int[] row : matrix) {
        int l = 0, r = n-1;
        while (l < r) { int t = row[l]; row[l] = row[r]; row[r] = t; l++; r--; }
    }
}
```

---

## � FULL WALKTHROUGH: Spiral Matrix Traversal

```
Problem: Return elements of matrix in spiral order.
  Matrix:  1  2  3
           4  5  6
           7  8  9

Approach: 4 boundaries (top, bottom, left, right). Move inward.

Step-by-step:
  top=0, bottom=2, left=0, right=2

  Round 1: → top row:    1,2,3  (top++ → 1)
            ↓ right col:  6,9    (right-- → 1)
            ← bottom row: 8,7    (bottom-- → 1)
            ↑ left col:   4      (left++ → 1)

  Round 2: → top row:    5      (top=1, left=1, right=1)
            top > bottom, stop.

  Result: [1,2,3,6,9,8,7,4,5] ✅

WHY 4 boundaries? Cleaner than direction arrays + visited set.
Each boundary shrinks inward after processing that side.

Time: O(R×C) | Space: O(1) extra (output doesn't count)
```

---

## 🔬 FULL WALKTHROUGH 2: BFS Shortest Path in Grid

```
Problem: Find shortest path from (0,0) to (2,2) in grid.
  Grid:  0  0  0     (0 = open, 1 = wall)
         1  1  0
         0  0  0

Approach: BFS from (0,0). First time we reach (2,2) = shortest path.

Step-by-step:
  Queue: [(0,0)], visited: {(0,0)}, dist=0

  Level 0 (dist=0): Process (0,0)
    Neighbors: (0,1)✅ (1,0)=wall ❌
    Queue: [(0,1)]

  Level 1 (dist=1): Process (0,1)
    Neighbors: (0,2)✅ (1,1)=wall ❌
    Queue: [(0,2)]

  Level 2 (dist=2): Process (0,2)
    Neighbors: (1,2)✅
    Queue: [(1,2)]

  Level 3 (dist=3): Process (1,2)
    Neighbors: (2,2)✅ → TARGET REACHED!
    Queue: [(2,2)]

  Answer: shortest path = 4 steps ✅ (or 5 cells visited)

KEY: BFS guarantees shortest path in unweighted grids.
     Mark visited WHEN ADDING to queue, not when processing!

Time: O(R×C) | Space: O(R×C)
```

---

## 🛡️ EDGE CASES & COMMON MISTAKES

```
EDGE CASES:
┌────────────────────────────────┬──────────────────────────────────────────┐
│ Edge Case                      │ Handling                                 │
├────────────────────────────────┼──────────────────────────────────────────┤
│ 1×1 matrix                    │ Spiral = [matrix[0][0]], path = 0 steps │
│ Single row [1,2,3]            │ Spiral = [1,2,3], no up/down movement   │
│ Single column [[1],[2],[3]]   │ Spiral = [1,2,3], no left/right movement│
│ Non-square matrix (m≠n)       │ Boundaries still work, check conditions │
│ Start/end blocked             │ Return -1 (no path exists)              │
│ All walls                     │ Return -1                                │
│ 8-directional movement        │ Use 8-dir array instead of 4            │
└────────────────────────────────┴──────────────────────────────────────────┘

COMMON MISTAKES:
1. Spiral: not checking top<=bottom BEFORE bottom row traversal
   On non-square matrices, you may re-traverse already-visited rows!
2. BFS: marking visited AFTER dequeue instead of WHEN enqueueing
   Causes duplicate processing → TLE and incorrect distances
3. Rotation: using extra matrix when problem says "in-place"
   Transpose + reverse = O(1) extra space
4. Forgetting bounds check: row < 0 || row >= R || col < 0 || col >= C
5. Set Matrix Zeroes: zeroing as you scan → cascade effect
   Mark first, then zero in a second pass!
```

---

## 📊 COMPLEXITY SUMMARY

| Problem | Time | Space | Notes |
|---------|------|-------|-------|
| Spiral Traversal | O(R×C) | O(1) | 4-boundary technique |
| Rotate 90° | O(R×C) | O(1) | Transpose + reverse |
| BFS Shortest Path | O(R×C) | O(R×C) | Queue + visited |
| DFS Flood Fill | O(R×C) | O(R×C) | Stack/recursion |
| Set Matrix Zeroes | O(R×C) | O(1) | First row/col as markers |
| Binary Search in Matrix | O(log(R×C)) | O(1) | Treat as 1D sorted array |

---

## 📋 PRACTICE PROBLEMS — From Your Excel Sheet
| # | Problem | Companies | Key Insight |
|---|---------|-----------|-------------|
| 1 | [Maximum Size Rectangle of 1s](https://www.geeksforgeeks.org/maximum-size-rectangle-binary-sub-matrix-1s/) | — | Histogram per row + stack |
| 2 | [Number of Islands](https://www.geeksforgeeks.org/find-number-of-islands/) | — | DFS/BFS flood fill |
| 3 | [Surrounded Regions (O/X)](https://www.geeksforgeeks.org/given-matrix-o-x-replace-o-x-surrounded-x/) | — | DFS from borders first |
| 4 | [Spiral Matrix](https://leetcode.com/problems/spiral-matrix/) | Salesforce | Four-boundary traversal |
| 5 | [Rotate Image](https://leetcode.com/problems/rotate-image/) | Salesforce | Transpose + reverse |
| 6 | [Set Matrix Zeroes](https://leetcode.com/problems/set-matrix-zeroes/) | Microsoft | Use first row/col as markers |
| 7 | [Word Search](https://leetcode.com/problems/word-search/) | — | DFS backtracking on grid |

### From Other Sections (Grid-Based)
| # | Problem | Key Insight |
|---|---------|-------------|
| 8 | [Flood Fill](https://leetcode.com/problems/flood-fill/) | BFS/DFS from source |
| 9 | [Rotten Oranges](https://practice.geeksforgeeks.org/problems/rotten-oranges2536/1) | Multi-source BFS |
| 10 | [Distance of Nearest 1](https://practice.geeksforgeeks.org/problems/distance-of-nearest-cell-having-1-1587115620/1) | Multi-source BFS |
| 11 | [Longest Increasing Path](https://leetcode.com/problems/longest-increasing-path-in-a-matrix/) | DFS + memoization |
| 12 | [Game of Life](https://leetcode.com/problems/game-of-life/) | Encode states in bits |

---

## 🔥 GRID TRICKS

| Trick | Code | When |
|-------|------|------|
| Direction array | `int[][] dirs = {{0,1},{0,-1},{1,0},{-1,0}}` | All 4/8 neighbors |
| In-place visited | `grid[r][c] = '#'` | Avoid extra boolean array |
| Multi-source BFS | Add ALL sources to queue first | "From all 1s simultaneously" |
| Border DFS first | Process borders, then interior | Surrounded regions |
| Encode state in-place | `cell = cell + 10 * newState` | Game of Life |

---

📖 **Related Chapters:**
- [02_Data_Structures/04_2D_Arrays_Matrix.md](../02_Data_Structures/04_2D_Arrays_Matrix.md) — Matrix basics

---
[← 18 String+Advanced](18_String_Plus_Advanced.md) | [20 BitManip+Tricks →](20_BitManipulation_Plus_Tricks.md)
