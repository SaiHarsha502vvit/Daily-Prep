# 9. [Pacific Atlantic Water Flow](https://leetcode.com/problems/pacific-atlantic-water-flow/) (LC 417) ⭐⭐ Medium

> **Navigation**: [← Easy Problems](02_easy_problems.md) | [Chapter overview](../19_Matrix.md) | [Hard Problems →](04_hard_problems.md)
> Page 3 of 5 in **19. Matrix / Grid — Complete Problem Guide**


**Companies**: Google, Amazon, Microsoft, Facebook  
**Pattern**: Reverse BFS/DFS from oceans

**Problem**: Given a height map grid, water can flow from a cell to 4-directional neighbors with height ≤ current. The Pacific ocean touches the top and left edges. The Atlantic touches the bottom and right edges. Find all cells from which water can reach **both** oceans.

```
Heights:                     Pacific ocean (~)
  ~ ~ ~ ~ ~ ~
~ 1  2  2  3  5 ~           Can reach both:
~ 3  2  3  4  4 ~           (0,4), (1,3), (1,4),
~ 2  4  5  3  1 ~           (2,2), (3,0), (3,1), (4,0)
~ 6  7  1  4  5 ~
~ 5  1  1  2  4 ~
  * * * * * *
              Atlantic ocean (*)
```

**Key Insight**: Forward approach (which cells can reach both oceans?) requires DFS from every cell — expensive. Reverse approach: start from each ocean and flow **uphill** (to cells with height ≥ current). Cells reachable from both Pacific and Atlantic sets are the answer.

**Approach**:

1. Create two boolean matrices: `pacific[m][n]` and `atlantic[m][n]`
2. DFS/BFS from all Pacific border cells (top row + left col) - mark reachable
3. DFS/BFS from all Atlantic border cells (bottom row + right col) - mark reachable
4. Return cells where both are true
5. WHY reverse: instead of forward flow (go to lower neighbors), reverse flow (go to higher neighbors from ocean edge). This is equivalent but far more efficient.

**Solution**:

```java
class Solution {
    private int m, n;
    private int[] dr = {-1, 1, 0, 0};
    private int[] dc = {0, 0, -1, 1};

    public List<List<Integer>> pacificAtlantic(int[][] heights) {
        m = heights.length;
        n = heights[0].length;
        boolean[][] pacific = new boolean[m][n];
        boolean[][] atlantic = new boolean[m][n];

        // DFS from Pacific borders (top row, left col)
        for (int c = 0; c < n; c++) dfs(heights, pacific, 0, c);
        for (int r = 0; r < m; r++) dfs(heights, pacific, r, 0);

        // DFS from Atlantic borders (bottom row, right col)
        for (int c = 0; c < n; c++) dfs(heights, atlantic, m - 1, c);
        for (int r = 0; r < m; r++) dfs(heights, atlantic, r, n - 1);

        // Intersection
        List<List<Integer>> result = new ArrayList<>();
        for (int r = 0; r < m; r++) {
            for (int c = 0; c < n; c++) {
                if (pacific[r][c] && atlantic[r][c]) {
                    result.add(Arrays.asList(r, c));
                }
            }
        }
        return result;
    }

    private void dfs(int[][] heights, boolean[][] reachable, int r, int c) {
        reachable[r][c] = true;
        for (int d = 0; d < 4; d++) {
            int nr = r + dr[d], nc = c + dc[d];
            if (nr >= 0 && nr < m && nc >= 0 && nc < n
                && !reachable[nr][nc]
                && heights[nr][nc] >= heights[r][c]) { // Flow UPHILL (reverse)
                dfs(heights, reachable, nr, nc);
            }
        }
    }
}
```

**Complexity**: Time O(m × n), Space O(m × n).  
**Why This Works**: Reversing the flow direction converts "can this cell reach the ocean?" into "can the ocean reach this cell going uphill?" Both are equivalent, but the reverse direction lets us do two BFS/DFS passes instead of m×n independent searches.

---

## 10. Game of Life (LC 289) ⭐⭐ Medium

**Companies**: Google, Amazon, Microsoft, Dropbox  
**Pattern**: In-place state encoding

**Problem**: Implement Conway's Game of Life in-place. Rules:

- Live cell with 2 or 3 live neighbors → lives
- Live cell with <2 or >3 live neighbors → dies
- Dead cell with exactly 3 live neighbors → becomes alive

All updates happen **simultaneously**.

Input:           Output:

| 0 | 1 | 0 |  | 0 | 0 | 0 |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | 0 | 1 |  | 1 | 0 | 1 |
| 1 | 1 | 1 |  | 0 | 1 | 1 |
| 0 | 0 | 0 |  | 0 | 1 | 0 |

**Key Insight**: We need simultaneous update but want O(1) space. Solution: encode BOTH old and new state in the same cell using intermediate states:

- `0` → dead, stays dead
- `1` → alive (original)
- `2` → was alive, now dead
- `3` → was dead, now alive

The original state = `value % 2` (both 1 and 2 have `%2 = 1` and `0` for original alive). After computing, map 2→0, 3→1.

**Approach**:

1. First pass: for each cell, count live neighbors using `board[r][c] % 2` (considers original state even if cell was already updated)
   - Wait — since we encode: 0=dead→dead, 1=alive(unchanged yet), 2=alive→dead, 3=dead→alive.
   - Original alive state: `value == 1 || value == 2` (was alive)
2. Apply rules: if alive and survives → stays 1. If alive and dies → set to 2. If dead and born → set to 3.
3. Second pass: `board[r][c] %= 2` to finalize (2→0, 3→1)

**Solution**:

```java
class Solution {
    public void gameOfLife(int[][] board) {
        int m = board.length, n = board[0].length;
        int[] dr = {-1, -1, -1, 0, 0, 1, 1, 1};
        int[] dc = {-1, 0, 1, -1, 1, -1, 0, 1};

        // First pass: encode transitions
        for (int r = 0; r < m; r++) {
            for (int c = 0; c < n; c++) {
                int liveNeighbors = 0;
                for (int d = 0; d < 8; d++) {
                    int nr = r + dr[d], nc = c + dc[d];
                    if (nr >= 0 && nr < m && nc >= 0 && nc < n) {
                        // Original state: alive if cell is 1 or 2 (was alive)
                        if (board[nr][nc] == 1 || board[nr][nc] == 2) {
                            liveNeighbors++;
                        }
                    }
                }

                // Apply rules
                if (board[r][c] == 1) { // Currently alive
                    if (liveNeighbors < 2 || liveNeighbors > 3) {
                        board[r][c] = 2; // Alive → Dead
                    }
                    // else stays 1 (alive → alive)
                } else { // Currently dead
                    if (liveNeighbors == 3) {
                        board[r][c] = 3; // Dead → Alive
                    }
                    // else stays 0 (dead → dead)
                }
            }
        }

        // Second pass: finalize states
        for (int r = 0; r < m; r++) {
            for (int c = 0; c < n; c++) {
                board[r][c] %= 2; // 0→0, 1→1, 2→0, 3→1
            }
        }
    }
}
```

**Complexity**: Time O(m × n), Space O(1).  
**Why This Works**: The state encoding trick stores both the old and new state in a single integer. `value % 2` recovers the original state during computation, and `value % 2` at the end gives the new state. States 2 and 3 are temporary markers that carry full information.

---

[← Easy Problems](02_easy_problems.md) | [Chapter overview](../19_Matrix.md) | [Hard Problems →](04_hard_problems.md)
