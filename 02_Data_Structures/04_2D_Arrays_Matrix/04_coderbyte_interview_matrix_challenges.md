# 🎤 Part 7.5: Coderbyte & Interview Matrix Challenges

> **Navigation**: [← Common 2d Array Problems](03_common_2d_array_problems.md) | [Chapter overview](../04_2D_Arrays_Matrix.md) | [University-Level Addendum — 2D Arrays &… →](05_university_level_addendum_2d_arrays_matrix.md)
> Page 4 of 5 in **2D Arrays & Matrix: Complete Deep Dive**


## Challenge 1: Closest Enemy with Wrap-Around (BFS)

```
Problem: Find shortest distance from '1' to nearest '2' in a matrix.
         Can wrap around edges (toroidal grid).

Example:
0 0 0 0
1 0 0 0    Answer: 2 (wrap left + move down)
0 0 0 2
0 0 0 2

Key Insight: BFS guarantees shortest path. Use modulo for wrap-around.
```

```java
public class ClosestEnemy {
    public static int findClosestEnemy(String[] strArr) {
        int rows = strArr.length;
        int cols = strArr[0].length();

        // Find position of 1
        int startRow = -1, startCol = -1;
        for (int i = 0; i < rows; i++) {
            for (int j = 0; j < cols; j++) {
                if (strArr[i].charAt(j) == '1') {
                    startRow = i;
                    startCol = j;
                    break;
                }
            }
            if (startRow != -1) break;
        }

        // BFS with wrap-around
        boolean[][] visited = new boolean[rows][cols];
        Queue<int[]> queue = new LinkedList<>();
        queue.offer(new int[]{startRow, startCol, 0}); // row, col, distance
        visited[startRow][startCol] = true;

        int[][] directions = {{-1, 0}, {1, 0}, {0, -1}, {0, 1}};

        while (!queue.isEmpty()) {
            int[] curr = queue.poll();
            int r = curr[0], c = curr[1], dist = curr[2];

            // Found enemy?
            if (strArr[r].charAt(c) == '2') {
                return dist;
            }

            // Explore neighbors with WRAP-AROUND using modulo
            for (int[] dir : directions) {
                int newR = (r + dir[0] + rows) % rows;  // Wrap vertically
                int newC = (c + dir[1] + cols) % cols;  // Wrap horizontally

                if (!visited[newR][newC]) {
                    visited[newR][newC] = true;
                    queue.offer(new int[]{newR, newC, dist + 1});
                }
            }
        }

        return 0; // No enemy found
    }

    // Test
    public static void main(String[] args) {
        String[] test1 = {"0000", "1000", "0002", "0002"};
        System.out.println(findClosestEnemy(test1)); // Output: 2

        String[] test2 = {"000", "100", "200"};
        System.out.println(findClosestEnemy(test2)); // Output: 1
    }
}

// PATTERN: BFS on Grid with Wrap-Around
// Key formula: newPos = (pos + delta + size) % size
// This handles both positive and negative deltas!
```

---

## Challenge 2: Vowel Square (2x2 Pattern Matching)

```
Problem: Find top-left position of first 2x2 square containing only vowels.
         Return "row-col" format or "not found".

Example:
a b c d
e i k r    Answer: "1-0" (the 2x2 square: ei/ou)
o u f j

Key Insight: Check every possible 2x2 starting position.
             Iterate top-left to ensure "most top-left" requirement.
```

```java
public class VowelSquare {
    public static String findVowelSquare(String[] strArr) {
        Set<Character> vowels = new HashSet<>(Arrays.asList(
            'a', 'e', 'i', 'o', 'u', 'A', 'E', 'I', 'O', 'U'));

        int rows = strArr.length;
        int cols = strArr[0].length();

        // Check each possible 2x2 starting position
        for (int i = 0; i < rows - 1; i++) {
            for (int j = 0; j < cols - 1; j++) {
                // Check all 4 cells of the 2x2 square
                if (vowels.contains(strArr[i].charAt(j)) &&
                    vowels.contains(strArr[i].charAt(j + 1)) &&
                    vowels.contains(strArr[i + 1].charAt(j)) &&
                    vowels.contains(strArr[i + 1].charAt(j + 1))) {
                    return i + "-" + j;
                }
            }
        }

        return "not found";
    }

    public static void main(String[] args) {
        String[] test1 = {"abcd", "eikr", "oufj"};
        System.out.println(findVowelSquare(test1)); // "1-0"

        String[] test2 = {"aqrst", "ukaei", "ffooo"};
        System.out.println(findVowelSquare(test2)); // "1-2"

        String[] test3 = {"gg", "ff"};
        System.out.println(findVowelSquare(test3)); // "not found"
    }
}
```

---

## Challenge 3: Find NxN Submatrix Pattern (Generalized)

```java
// Generalized: Find first MxM square matching a condition
public static String findSquare(String[] strArr, int size, Predicate<Character> condition) {
    int rows = strArr.length;
    int cols = strArr[0].length();

    for (int i = 0; i <= rows - size; i++) {
        for (int j = 0; j <= cols - size; j++) {
            if (checkSquare(strArr, i, j, size, condition)) {
                return i + "-" + j;
            }
        }
    }
    return "not found";
}

private static boolean checkSquare(String[] strArr, int startR, int startC,
                                    int size, Predicate<Character> condition) {
    for (int i = startR; i < startR + size; i++) {
        for (int j = startC; j < startC + size; j++) {
            if (!condition.test(strArr[i].charAt(j))) {
                return false;
            }
        }
    }
    return true;
}

// Usage:
// findSquare(arr, 2, c -> "aeiouAEIOU".indexOf(c) != -1);  // Vowel square
// findSquare(arr, 3, c -> Character.isDigit(c));           // 3x3 digit square
```

---

## Challenge 4: Matrix Rotation with Queries

```java
// Rotate matrix 90° clockwise, then answer position queries
public class MatrixRotation {

    // Rotate 90° clockwise: new[j][n-1-i] = old[i][j]
    public static int[][] rotate90Clockwise(int[][] matrix) {
        int n = matrix.length;
        int[][] rotated = new int[n][n];

        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                rotated[j][n - 1 - i] = matrix[i][j];
            }
        }
        return rotated;
    }

    // After K 90° rotations, where does (r, c) end up?
    public static int[] positionAfterKRotations(int n, int r, int c, int k) {
        k = k % 4; // Only 4 unique rotations

        for (int i = 0; i < k; i++) {
            int newR = c;
            int newC = n - 1 - r;
            r = newR;
            c = newC;
        }
        return new int[]{r, c};
    }
}
```

---

## Challenge 5: Shortest Path in Grid with Obstacles

```java
// BFS to find shortest path in grid avoiding obstacles
public static int shortestPath(int[][] grid, int[] start, int[] end) {
    int rows = grid.length, cols = grid[0].length;

    if (grid[start[0]][start[1]] == 1 || grid[end[0]][end[1]] == 1) {
        return -1; // Start or end is blocked
    }

    boolean[][] visited = new boolean[rows][cols];
    Queue<int[]> queue = new LinkedList<>();
    queue.offer(new int[]{start[0], start[1], 0});
    visited[start[0]][start[1]] = true;

    int[][] dirs = {{0,1}, {0,-1}, {1,0}, {-1,0}};

    while (!queue.isEmpty()) {
        int[] curr = queue.poll();
        int r = curr[0], c = curr[1], dist = curr[2];

        if (r == end[0] && c == end[1]) return dist;

        for (int[] d : dirs) {
            int nr = r + d[0], nc = c + d[1];

            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols &&
                !visited[nr][nc] && grid[nr][nc] == 0) {
                visited[nr][nc] = true;
                queue.offer(new int[]{nr, nc, dist + 1});
            }
        }
    }

    return -1; // No path exists
}
```

---

## Challenge 6: Count Distinct Islands (DFS + Normalization)

```java
// Count distinct island shapes in a grid
public static int numDistinctIslands(int[][] grid) {
    Set<String> uniqueIslands = new HashSet<>();
    int rows = grid.length, cols = grid[0].length;

    for (int i = 0; i < rows; i++) {
        for (int j = 0; j < cols; j++) {
            if (grid[i][j] == 1) {
                StringBuilder shape = new StringBuilder();
                dfsIsland(grid, i, j, i, j, shape);
                uniqueIslands.add(shape.toString());
            }
        }
    }

    return uniqueIslands.size();
}

private static void dfsIsland(int[][] grid, int r, int c,
                               int baseR, int baseC, StringBuilder shape) {
    if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length ||
        grid[r][c] != 1) {
        return;
    }

    grid[r][c] = 0; // Mark visited

    // Store relative position from starting point
    shape.append((r - baseR) + "," + (c - baseC) + ";");

    dfsIsland(grid, r + 1, c, baseR, baseC, shape);
    dfsIsland(grid, r - 1, c, baseR, baseC, shape);
    dfsIsland(grid, r, c + 1, baseR, baseC, shape);
    dfsIsland(grid, r, c - 1, baseR, baseC, shape);
}
```

---

## Matrix Challenge Patterns Summary

### Matrix problem recognition guide

| If the problem says... | Reach for |
| ---------------------- | --------- |
| "Find shortest distance..." | BFS |
| "Can wrap around edges..." | Modulo: `(pos + delta + size) % size` |
| "Find N×N square with property..." | Nested loops, check all positions |
| "Count distinct shapes..." | DFS + normalize coordinates |
| "Path from A to B..." | BFS (shortest) or DFS (any path) |
| "Rotate matrix..." | Formula: `new[j][n-1-i] = old[i][j]` |
| "Transform based on neighbors..." | Need a copy, or process in a specific order |

**Common edge cases:**

| | | |
| --- | --- | --- |
| Empty matrix | Single cell | All cells are the same value |
| No valid path exists | Target not found | Wrap-around boundaries |

---

## 📌 Part 8: Edge Cases Checklist

```
⬜ Empty matrix: matrix.length == 0 or matrix[0].length == 0
⬜ Single element: 1×1 matrix
⬜ Single row: 1×n matrix
⬜ Single column: n×1 matrix
⬜ Square vs rectangular: n×n vs m×n
⬜ Jagged array: rows have different lengths
⬜ All same values: what if all 0s or all 1s?
⬜ Negative values: don't assume positive
⬜ Integer overflow: sum of large values
⬜ Boundary access: i-1, j-1, i+1, j+1 in bounds?
```

---

## 📌 Part 9: Real — World Applications

```
1. IMAGE PROCESSING
   - Filters use matrix convolution
   - Blur = average of neighbors
   - Edge detection = difference from neighbors

2. GAME DEVELOPMENT
   - Chess board, Sudoku grid
   - Collision detection
   - Pathfinding (A* algorithm)

3. SPREADSHEETS
   - Excel is a giant 2D array
   - Formulas reference cells by [row][col]

4. DATABASES
   - Tables can be viewed as 2D arrays
   - Rows = records, Columns = fields

5. MACHINE LEARNING
   - Neural networks use matrix multiplication
   - Images fed as pixel matrices
```

---

[← Common 2d Array Problems](03_common_2d_array_problems.md) | [Chapter overview](../04_2D_Arrays_Matrix.md) | [University-Level Addendum — 2D Arrays &… →](05_university_level_addendum_2d_arrays_matrix.md)
