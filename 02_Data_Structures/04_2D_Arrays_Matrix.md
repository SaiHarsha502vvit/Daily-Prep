# 🔲 2D Arrays & Matrix: Complete Deep Dive

## From Memory Layout to Complex Traversals

---

# PART 0: COMPLETE UNDERSTANDING OF 2D ARRAYS

```
╔══════════════════════════════════════════════════════════════════════════════╗
║              2D ARRAYS & MATRICES - COMPLETE UNDERSTANDING                    ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHAT IS A 2D ARRAY?                                                          │
├──────────────────────────────────────────────────────────────────────────────┤
│ A 2D array is a COLLECTION OF ARRAYS, organized in rows and columns.         │
│ Think of it as a TABLE or GRID.                                              │
│                                                                              │
│ KEY INSIGHT: In memory, it's still LINEAR!                                   │
│ The "2D" is just an abstraction for human understanding.                    │
│                                                                              │
│ ANALOGY:                                                                     │
│ • Excel Spreadsheet: Rows and columns of cells                              │
│ • Chess Board: 8x8 grid of squares                                          │
│ • Seating Chart: Rows of seats in a theater                                 │
│ • Pixel Grid: Image = matrix of color values                                │
│                                                                              │
│ HISTORICAL CONTEXT:                                                          │
│ • 1958: FORTRAN introduced multidimensional arrays                          │
│ • 1979: VisiCalc (first spreadsheet) = 2D array in action                   │
│ • 1980s: Image processing using matrices                                    │
│ • Today: Every screen you see is a 2D array of pixels!                      │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHAT PROBLEM DO 2D ARRAYS SOLVE?                                             │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ PROBLEM 1: Representing GRID-BASED data                                      │
│ • Maps: Geographic data in grid form                                        │
│ • Games: Chess, Sudoku, Tic-Tac-Toe boards                                  │
│ • Images: Pixels arranged in grid                                           │
│                                                                              │
│ PROBLEM 2: Representing RELATIONSHIPS between two sets                       │
│ • Graph adjacency matrix: connections between nodes                          │
│ • Distance matrix: distances between cities                                  │
│ • Transition matrix: state changes in systems                               │
│                                                                              │
│ PROBLEM 3: Table-structured data                                             │
│ • Spreadsheets: Rows of records, columns of fields                          │
│ • Databases: Conceptually stored as tables                                  │
│                                                                              │
│ WITHOUT 2D ARRAYS:                                                           │
│ • Would need multiple 1D arrays with manual coordination                    │
│ • Prone to index mismatch errors                                            │
│ • Harder to visualize and reason about                                      │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHY LEARN 2D ARRAYS DEEPLY?                                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ 1. INTERVIEW ESSENTIAL:                                                      │
│    30-40% of DSA interview questions involve matrices                       │
│    Spiral traversal, island counting, path finding, etc.                    │
│                                                                              │
│ 2. FOUNDATION FOR ADVANCED TOPICS:                                           │
│    • Graph algorithms use adjacency matrices                                │
│    • Dynamic Programming often uses 2D tables                               │
│    • Image processing is matrix operations                                  │
│                                                                              │
│ 3. REAL-WORLD UBIQUITY:                                                      │
│    • Every image, video frame, game board                                   │
│    • Machine learning uses matrices extensively                             │
│    • Scientific computing relies on matrix math                             │
│                                                                              │
│ 4. PATTERN RECOGNITION:                                                      │
│    Matrix problems have common patterns:                                     │
│    • Traversal patterns (row, column, diagonal, spiral)                    │
│    • Search patterns (DFS, BFS on grid)                                     │
│    • Transform patterns (rotate, flip, transpose)                          │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHEN TO USE 2D ARRAYS?                                                       │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ USE 2D ARRAY WHEN:                                                           │
│ • Data naturally has ROW and COLUMN structure                               │
│ • You need RANDOM ACCESS by two indices                                     │
│ • Problems involve NEIGHBORS (up, down, left, right)                        │
│ • You're modeling a GRID or BOARD                                           │
│                                                                              │
│ COMMON PROBLEM PATTERNS:                                                     │
│ • "Given a matrix..." → 2D array                                            │
│ • "Given a grid..." → 2D array                                              │
│ • "Given a board..." → 2D array                                             │
│ • "Find path in maze..." → 2D array + BFS/DFS                              │
│ • "Count islands..." → 2D array + flood fill                               │
│ • "Rotate image..." → 2D array transformation                              │
│                                                                              │
│ ALTERNATIVE REPRESENTATIONS:                                                 │
│ • Sparse matrix → Use HashMap of coordinates                                │
│ • Very large grid → Use coordinate compression                              │
│ • Dynamic size → Use ArrayList of ArrayLists                                │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ DIFFICULTIES IN 2D ARRAY PROBLEMS                                            │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ 1. INDEX CONFUSION:                                                          │
│    "Is it [row][col] or [col][row]?"                                        │
│    Solution: ALWAYS use [row][col] in Java. Row = y, Col = x               │
│                                                                              │
│ 2. BOUNDARY CHECKING:                                                        │
│    ArrayIndexOutOfBounds is common                                          │
│    Solution: Always check 0 <= row < rows && 0 <= col < cols               │
│                                                                              │
│ 3. TRAVERSAL ORDER:                                                          │
│    "Which direction first?"                                                 │
│    Solution: Use direction arrays: dx = {0,0,1,-1}, dy = {1,-1,0,0}        │
│                                                                              │
│ 4. MODIFYING WHILE TRAVERSING:                                               │
│    Changing values affects later iterations                                  │
│    Solution: Use visited array or mark with special value                   │
│                                                                              │
│ 5. JAGGED ARRAYS:                                                            │
│    "Rows have different lengths!"                                           │
│    Solution: Use matrix[i].length for each row's column count              │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ EXPECTED OUTPUTS OF MASTERING 2D ARRAYS                                      │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ ✅ INSTANT TRAVERSAL: Write any traversal pattern without thinking          │
│ ✅ BOUNDARY MASTERY: Never get IndexOutOfBounds again                       │
│ ✅ PATTERN LIBRARY: Know spiral, diagonal, zigzag, layer-by-layer          │
│ ✅ PROBLEM RECOGNITION: See "grid" → Know 5+ approaches instantly           │
│ ✅ TRANSFORMATION SKILLS: Rotate, flip, transpose without confusion        │
│ ✅ ADVANCED READY: Ready for graph theory and DP on grids                   │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

# PART 1: UNDERSTANDING 2D ARRAYS FROM SCRATCH

## 🧬 What is a 2D Array REALLY?

```
MENTAL MODEL - It's NOT actually "2D" in memory!

YOUR BRAIN THINKS:            COMPUTER STORES:
┌───┬───┬───┬───┐            ┌───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┐
│ 1 │ 2 │ 3 │ 4 │   Row 0    │ 1 │ 2 │ 3 │ 4 │ 5 │ 6 │ 7 │ 8 │ 9 │10 │11 │12 │
├───┼───┼───┼───┤            └───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┘
│ 5 │ 6 │ 7 │ 8 │   Row 1     ↑Row0 ends↑    ↑Row1 ends↑    ↑Row2 ends↑
├───┼───┼───┼───┤
│ 9 │10 │11 │12 │   Row 2    Memory is LINEAR! Rows stored CONSECUTIVELY.
└───┴───┴───┴───┘

WHY THIS MATTERS:
- arr[i][j] = baseAddress + (i × numColumns + j) × elementSize
- arr[1][2] = base + (1 × 4 + 2) × 4 = base + 24
- This is still O(1) access!

ROW-MAJOR ORDER (Java, C, Python):
arr[0][0], arr[0][1], arr[0][2], arr[1][0], arr[1][1]...

COLUMN-MAJOR ORDER (Fortran, MATLAB):
arr[0][0], arr[1][0], arr[2][0], arr[0][1], arr[1][1]...
```

## 🔴 Real-World Origin: Spreadsheets & Images (1970s)

```
PROBLEM 1 - VisiCalc (1979, First Spreadsheet):
- Dan Bricklin needed to represent accounting tables
- Rows = Records, Columns = Fields
- Solution: 2D Array for spreadsheet cells

PROBLEM 2 - Digital Images:
- Each pixel has a position (x, y)
- Image = Grid of pixels
- Solution: 2D Array where arr[row][col] = pixel color

YOUR PHONE CAMERA:
- 12 megapixels = 4000 × 3000 array
- Each cell = RGB values (another array!)
- Photo editing = Matrix operations
```

---

# PART 2: DECLARATION & INITIALIZATION

## Different Ways to Create 2D Arrays

```java
// METHOD 1: Declare then Initialize (Most Common)
int[][] matrix = new int[3][4];  // 3 rows, 4 columns
// All values initialized to 0

// METHOD 2: Inline Initialization
int[][] matrix = {
    {1, 2, 3, 4},
    {5, 6, 7, 8},
    {9, 10, 11, 12}
};

// METHOD 3: Jagged Array (Different column sizes!)
int[][] jagged = new int[3][];
jagged[0] = new int[2];  // Row 0 has 2 columns
jagged[1] = new int[4];  // Row 1 has 4 columns
jagged[2] = new int[3];  // Row 2 has 3 columns

// VISUAL OF JAGGED:
// Row 0: [_, _]
// Row 1: [_, _, _, _]
// Row 2: [_, _, _]

// METHOD 4: Dynamic Size
int rows = 5, cols = 10;
int[][] dynamic = new int[rows][cols];
```

## ⚠️ EDGE CASES TO ALWAYS CHECK

```java
// EDGE CASE 1: Empty Matrix
int[][] empty = new int[0][0];
// empty.length = 0
// empty[0] → ArrayIndexOutOfBoundsException!

// EDGE CASE 2: Single Row
int[][] singleRow = {{1, 2, 3}};
// singleRow.length = 1
// singleRow[0].length = 3

// EDGE CASE 3: Single Column
int[][] singleCol = {{1}, {2}, {3}};
// singleCol.length = 3
// singleCol[0].length = 1

// EDGE CASE 4: Single Element
int[][] single = {{42}};

// ALWAYS CHECK BEFORE ACCESSING:
if (matrix == null || matrix.length == 0 || matrix[0].length == 0) {
    return; // Handle empty case
}

int rows = matrix.length;
int cols = matrix[0].length;  // ⚠️ Only safe after checking matrix.length > 0
```

---

# PART 3: TRAVERSAL PATTERNS

## Pattern 1: Row-by-Row (Standard)

```java
// LEFT TO RIGHT, TOP TO BOTTOM
for (int i = 0; i < rows; i++) {
    for (int j = 0; j < cols; j++) {
        System.out.print(matrix[i][j] + " ");
    }
    System.out.println();
}

// TRACING:
// matrix = {{1,2,3}, {4,5,6}, {7,8,9}}
// i=0: j=0→1, j=1→2, j=2→3  Output: 1 2 3
// i=1: j=0→4, j=1→5, j=2→6  Output: 4 5 6
// i=2: j=0→7, j=1→8, j=2→9  Output: 7 8 9
```

## Pattern 2: Column-by-Column

```java
// TOP TO BOTTOM, LEFT TO RIGHT
for (int j = 0; j < cols; j++) {
    for (int i = 0; i < rows; i++) {
        System.out.print(matrix[i][j] + " ");
    }
    System.out.println();
}

// TRACING:
// matrix = {{1,2,3}, {4,5,6}, {7,8,9}}
// j=0: i=0→1, i=1→4, i=2→7  Output: 1 4 7
// j=1: i=0→2, i=1→5, i=2→8  Output: 2 5 8
// j=2: i=0→3, i=1→6, i=2→9  Output: 3 6 9
```

## Pattern 3: Diagonal Traversal

```java
// MAIN DIAGONAL (Top-left to Bottom-right)
// Only works for square matrix!
for (int i = 0; i < n; i++) {
    System.out.print(matrix[i][i] + " ");
}
// For {{1,2,3}, {4,5,6}, {7,8,9}} → 1 5 9

// ANTI-DIAGONAL (Top-right to Bottom-left)
for (int i = 0; i < n; i++) {
    System.out.print(matrix[i][n-1-i] + " ");
}
// For {{1,2,3}, {4,5,6}, {7,8,9}} → 3 5 7

// ALL DIAGONALS (Diagonal Traverse Problem)
// Complex pattern - see below
```

## Pattern 4: Spiral Traversal (⭐ COMMON INTERVIEW QUESTION)

```java
public List<Integer> spiralOrder(int[][] matrix) {
    List<Integer> result = new ArrayList<>();
    if (matrix.length == 0) return result;

    int top = 0, bottom = matrix.length - 1;
    int left = 0, right = matrix[0].length - 1;

    while (top <= bottom && left <= right) {
        // RIGHT: traverse top row
        for (int j = left; j <= right; j++) {
            result.add(matrix[top][j]);
        }
        top++;

        // DOWN: traverse right column
        for (int i = top; i <= bottom; i++) {
            result.add(matrix[i][right]);
        }
        right--;

        // LEFT: traverse bottom row (if exists)
        if (top <= bottom) {
            for (int j = right; j >= left; j--) {
                result.add(matrix[bottom][j]);
            }
            bottom--;
        }

        // UP: traverse left column (if exists)
        if (left <= right) {
            for (int i = bottom; i >= top; i--) {
                result.add(matrix[i][left]);
            }
            left++;
        }
    }
    return result;
}

// VISUAL TRACING:
// Matrix:
// 1  2  3  4
// 5  6  7  8
// 9  10 11 12
//
// Step 1 (RIGHT): 1→2→3→4, top becomes 1
// Step 2 (DOWN): 8→12, right becomes 2
// Step 3 (LEFT): 11→10→9, bottom becomes 1
// Step 4 (UP): 5, left becomes 1
// Step 5 (RIGHT): 6→7, top becomes 2
// Step 6 (DOWN): nothing (top > bottom)
// Result: [1,2,3,4,8,12,11,10,9,5,6,7]
```

## Pattern 5: Boundary Traversal

```java
// Print only boundary elements
public void printBoundary(int[][] matrix) {
    int rows = matrix.length, cols = matrix[0].length;

    // Top row
    for (int j = 0; j < cols; j++) {
        System.out.print(matrix[0][j] + " ");
    }

    // Right column (excluding top-right)
    for (int i = 1; i < rows; i++) {
        System.out.print(matrix[i][cols-1] + " ");
    }

    // Bottom row (excluding bottom-right)
    if (rows > 1) {
        for (int j = cols-2; j >= 0; j--) {
            System.out.print(matrix[rows-1][j] + " ");
        }
    }

    // Left column (excluding top-left and bottom-left)
    if (cols > 1) {
        for (int i = rows-2; i >= 1; i--) {
            System.out.print(matrix[i][0] + " ");
        }
    }
}
```

---

# PART 4: MATRIX TRANSFORMATIONS

## Rotate Matrix 90° Clockwise (⭐ AMAZON FAVORITE)

```java
// METHOD 1: Using Extra Space O(n²)
public int[][] rotate90(int[][] matrix) {
    int n = matrix.length;
    int[][] rotated = new int[n][n];

    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            rotated[j][n-1-i] = matrix[i][j];
        }
    }
    return rotated;
}

// METHOD 2: In-Place O(1) Space (OPTIMAL)
// TRICK: Transpose + Reverse each row
public void rotate90InPlace(int[][] matrix) {
    int n = matrix.length;

    // Step 1: Transpose (swap rows and columns)
    for (int i = 0; i < n; i++) {
        for (int j = i + 1; j < n; j++) {  // j = i+1 to avoid double swap
            int temp = matrix[i][j];
            matrix[i][j] = matrix[j][i];
            matrix[j][i] = temp;
        }
    }

    // Step 2: Reverse each row
    for (int i = 0; i < n; i++) {
        int left = 0, right = n - 1;
        while (left < right) {
            int temp = matrix[i][left];
            matrix[i][left] = matrix[i][right];
            matrix[i][right] = temp;
            left++;
            right--;
        }
    }
}

// VISUAL TRACING:
// Original:     After Transpose:   After Reverse:
// 1 2 3         1 4 7              7 4 1
// 4 5 6    →    2 5 8         →    8 5 2
// 7 8 9         3 6 9              9 6 3
```

## Other Rotations

```java
// 90° COUNTER-CLOCKWISE: Transpose + Reverse each COLUMN
// 180°: Reverse each row, then reverse order of rows
// Horizontal Flip: Reverse each row
// Vertical Flip: Reverse order of rows
```

---

# PART 5: COMMON 2D ARRAY PROBLEMS

## Problem 1: Search in Sorted Matrix

```java
// BRUTE FORCE: O(m × n)
// Check every element

// OPTIMAL: O(m + n) - Start from top-right or bottom-left
public boolean searchMatrix(int[][] matrix, int target) {
    if (matrix.length == 0) return false;

    int rows = matrix.length, cols = matrix[0].length;
    int i = 0, j = cols - 1;  // Start from top-right

    while (i < rows && j >= 0) {
        if (matrix[i][j] == target) {
            return true;
        } else if (matrix[i][j] > target) {
            j--;  // Move left (smaller values)
        } else {
            i++;  // Move down (larger values)
        }
    }
    return false;
}

// WHY THIS WORKS:
// From top-right corner:
// - Everything to LEFT is smaller
// - Everything BELOW is larger
// - Each step eliminates a row or column!
//
// TRACING for target = 5:
// Matrix (sorted rows and columns):
// 1  4  7  11
// 2  5  8  12
// 3  6  9  16
//
// Start: (0,3) = 11 > 5, move left
// (0,2) = 7 > 5, move left
// (0,1) = 4 < 5, move down
// (1,1) = 5 = target, FOUND!
```

## Problem 2: Set Matrix Zeroes

```java
// If any cell is 0, set entire row and column to 0

// BRUTE: O(m×n) space - store positions of 0s
// BETTER: O(m+n) space - store which rows/cols have 0
// OPTIMAL: O(1) space - use first row/col as markers

public void setZeroes(int[][] matrix) {
    int rows = matrix.length, cols = matrix[0].length;
    boolean firstRowZero = false, firstColZero = false;

    // Check if first row has zero
    for (int j = 0; j < cols; j++) {
        if (matrix[0][j] == 0) firstRowZero = true;
    }

    // Check if first col has zero
    for (int i = 0; i < rows; i++) {
        if (matrix[i][0] == 0) firstColZero = true;
    }

    // Use first row/col as markers
    for (int i = 1; i < rows; i++) {
        for (int j = 1; j < cols; j++) {
            if (matrix[i][j] == 0) {
                matrix[i][0] = 0;  // Mark row
                matrix[0][j] = 0;  // Mark col
            }
        }
    }

    // Zero out based on markers
    for (int i = 1; i < rows; i++) {
        for (int j = 1; j < cols; j++) {
            if (matrix[i][0] == 0 || matrix[0][j] == 0) {
                matrix[i][j] = 0;
            }
        }
    }

    // Handle first row and column
    if (firstRowZero) {
        for (int j = 0; j < cols; j++) matrix[0][j] = 0;
    }
    if (firstColZero) {
        for (int i = 0; i < rows; i++) matrix[i][0] = 0;
    }
}
```

## Problem 3: Maximum Sum Rectangle (⭐ NETCRACKER LEVEL)

```java
// Find rectangle with maximum sum in 2D array
// Uses Kadane's Algorithm for 1D extended to 2D

public int maxSumRectangle(int[][] matrix) {
    int rows = matrix.length, cols = matrix[0].length;
    int maxSum = Integer.MIN_VALUE;

    // Try all possible left boundaries
    for (int left = 0; left < cols; left++) {
        int[] temp = new int[rows];  // Compress columns into 1D

        // Extend right boundary
        for (int right = left; right < cols; right++) {
            // Add current column to temp
            for (int i = 0; i < rows; i++) {
                temp[i] += matrix[i][right];
            }

            // Apply Kadane's on temp to find max sum subarray
            int currentMax = kadane(temp);
            maxSum = Math.max(maxSum, currentMax);
        }
    }
    return maxSum;
}

private int kadane(int[] arr) {
    int maxSoFar = arr[0], maxEndingHere = arr[0];
    for (int i = 1; i < arr.length; i++) {
        maxEndingHere = Math.max(arr[i], maxEndingHere + arr[i]);
        maxSoFar = Math.max(maxSoFar, maxEndingHere);
    }
    return maxSoFar;
}

// TIME: O(cols² × rows) - Much better than O(rows² × cols²) brute force
```

---

# PART 6: MATRIX IN GRAPH PROBLEMS

## Grid as Graph

```java
// 2D Grid can be treated as a GRAPH!
// Each cell is a NODE
// Adjacent cells (up, down, left, right) are EDGES

// DIRECTION ARRAYS - Memorize this!
int[] dx = {-1, 1, 0, 0};  // row changes
int[] dy = {0, 0, -1, 1};  // col changes
// dx[0],dy[0] = (-1,0) = UP
// dx[1],dy[1] = (1,0)  = DOWN
// dx[2],dy[2] = (0,-1) = LEFT
// dx[3],dy[3] = (0,1)  = RIGHT

// 8 DIRECTIONS (including diagonals):
int[] dx8 = {-1, -1, -1, 0, 0, 1, 1, 1};
int[] dy8 = {-1, 0, 1, -1, 1, -1, 0, 1};

// BOUNDARY CHECK HELPER:
boolean isValid(int i, int j, int rows, int cols) {
    return i >= 0 && i < rows && j >= 0 && j < cols;
}

// BFS ON GRID:
public void bfsOnGrid(int[][] grid, int startRow, int startCol) {
    int rows = grid.length, cols = grid[0].length;
    boolean[][] visited = new boolean[rows][cols];
    Queue<int[]> queue = new LinkedList<>();

    queue.offer(new int[]{startRow, startCol});
    visited[startRow][startCol] = true;

    while (!queue.isEmpty()) {
        int[] cell = queue.poll();
        int r = cell[0], c = cell[1];

        // Process current cell
        System.out.println("Visiting: (" + r + "," + c + ")");

        // Explore all 4 neighbors
        for (int d = 0; d < 4; d++) {
            int newR = r + dx[d];
            int newC = c + dy[d];

            if (isValid(newR, newC, rows, cols) && !visited[newR][newC]) {
                visited[newR][newC] = true;
                queue.offer(new int[]{newR, newC});
            }
        }
    }
}
```

## Number of Islands (Classic)

```java
public int numIslands(char[][] grid) {
    if (grid == null || grid.length == 0) return 0;

    int count = 0;
    int rows = grid.length, cols = grid[0].length;

    for (int i = 0; i < rows; i++) {
        for (int j = 0; j < cols; j++) {
            if (grid[i][j] == '1') {
                count++;
                dfs(grid, i, j);  // Sink the island
            }
        }
    }
    return count;
}

private void dfs(char[][] grid, int i, int j) {
    // Boundary check + water check
    if (i < 0 || i >= grid.length || j < 0 || j >= grid[0].length
        || grid[i][j] == '0') {
        return;
    }

    grid[i][j] = '0';  // Mark as visited (sink)

    // Explore all 4 directions
    dfs(grid, i - 1, j);  // Up
    dfs(grid, i + 1, j);  // Down
    dfs(grid, i, j - 1);  // Left
    dfs(grid, i, j + 1);  // Right
}

// TRACING:
// Grid:
// 1 1 0 0 0
// 1 1 0 0 0
// 0 0 1 0 0
// 0 0 0 1 1
//
// i=0,j=0: Found '1', count=1, DFS sinks all connected 1s
// DFS path: (0,0)→(0,1)→(1,0)→(1,1) all become '0'
// i=2,j=2: Found '1', count=2, DFS sinks (2,2)
// i=3,j=3: Found '1', count=3, DFS sinks (3,3)→(3,4)
// Final count: 3
```

---

# PART 7: PRACTICE PROBLEMS

## Difficulty Progression

| Level  | Problem               | Key Concept          |
| ------ | --------------------- | -------------------- |
| Easy   | Transpose Matrix      | Basic nested loops   |
| Easy   | Diagonal Traverse     | Index manipulation   |
| Easy   | Matrix Diagonal Sum   | Main + Anti diagonal |
| Medium | Spiral Matrix         | Boundary management  |
| Medium | Rotate Image          | In-place transform   |
| Medium | Set Matrix Zeroes     | Space optimization   |
| Medium | Search 2D Matrix      | Binary search        |
| Medium | Number of Islands     | DFS on grid          |
| Medium | Word Search           | Backtracking         |
| Hard   | Maximal Rectangle     | DP + Stack           |
| Hard   | Shortest Path in Grid | BFS with obstacles   |

## Netcracker-Style Questions

```java
// Q1: Count all paths from top-left to bottom-right
// (can only move right or down)
public int countPaths(int m, int n) {
    int[][] dp = new int[m][n];

    // First row: only 1 way to reach each cell
    for (int j = 0; j < n; j++) dp[0][j] = 1;

    // First col: only 1 way to reach each cell
    for (int i = 0; i < m; i++) dp[i][0] = 1;

    // Fill rest: ways = from top + from left
    for (int i = 1; i < m; i++) {
        for (int j = 1; j < n; j++) {
            dp[i][j] = dp[i-1][j] + dp[i][j-1];
        }
    }

    return dp[m-1][n-1];
}

// Q2: Minimum path sum from top-left to bottom-right
public int minPathSum(int[][] grid) {
    int m = grid.length, n = grid[0].length;

    // Modify first row (cumulative sum)
    for (int j = 1; j < n; j++) {
        grid[0][j] += grid[0][j-1];
    }

    // Modify first col
    for (int i = 1; i < m; i++) {
        grid[i][0] += grid[i-1][0];
    }

    // Fill rest: min of top or left + current
    for (int i = 1; i < m; i++) {
        for (int j = 1; j < n; j++) {
            grid[i][j] += Math.min(grid[i-1][j], grid[i][j-1]);
        }
    }

    return grid[m-1][n-1];
}
```

---

# PART 8: EDGE CASES CHECKLIST

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

# PART 9: REAL-WORLD APPLICATIONS

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

_Master 2D arrays = Master half of interview problems!_ 🔲
