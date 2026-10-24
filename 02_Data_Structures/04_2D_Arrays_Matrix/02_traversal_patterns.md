# 🎨 Part 3: Traversal Patterns

> **Navigation**: [← Understanding 2d Arrays From Scratch](01_understanding_2d_arrays_from_scratch.md) | [Chapter overview](../04_2D_Arrays_Matrix.md) | [Common 2d Array Problems →](03_common_2d_array_problems.md)
> Page 2 of 5 in **2D Arrays & Matrix: Complete Deep Dive**


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

### 💬 Study-Partner View — Spiral Traversal

**1. The bottom line:** To walk a matrix in a spiral, keep four shrinking boundaries and peel the matrix like an onion.

**2. The textbook core:**

- Maintain `top`, `bottom`, `left`, `right`.
- Loop: traverse the top row left→right (`top++`), right column top→bottom (`right--`), bottom row right→left (`bottom--`), left column bottom→top (`left++`).
- Re-check `top <= bottom` and `left <= right` before the last two sides to avoid duplicates.
- Time O(R·C), extra space O(1) (besides output).

**3. The real-world analogy:** Peeling an **onion** or an apple in one long strip: finish the outer layer, then repeat on what is left.

**4. Walkthrough:**

1. Matrix `[[1,2,3],[4,5,6],[7,8,9]]`.
2. Top row: 1 2 3 → `top = 1`. Right column: 6 9 → `right = 1`.
3. Bottom row (right→left): 8 7 → `bottom = 1`. Left column (bottom→top): 4 → `left = 1`.
4. Now `top = bottom = left = right = 1`: top row has just 5. Result: 1 2 3 6 9 8 7 4 5.

> [!NOTE]
> **Quick check:** Why the extra boundary checks? *For a single remaining row or column, the "return trip" would visit cells twice.*


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

## 📌 Part 4: Matrix Transformations

### Rotate Matrix 90° Clockwise (⭐ AMAZON FAVORITE)

#### 💬 Study-Partner View — Rotating a Matrix 90°

**1. The bottom line:** Rotating a square matrix clockwise is just **transpose, then reverse each row**.

**2. The textbook core:**

- Transpose: swap `a[i][j]` with `a[j][i]` for `j > i` (O(n²), in place).
- Then reverse every row (O(n²)).
- Net mapping: `new[j][n-1-i] = old[i][j]`.
- Counter-clockwise: transpose then reverse each **column** (or reverse rows first, then transpose).

**3. The real-world analogy:** Turning a **photo on a table**: first flip it along its diagonal, then mirror it left-to-right; the picture ends up turned a quarter turn.

**4. Walkthrough:**

1. Matrix `[[1,2],[3,4]]`.
2. Transpose → `[[1,3],[2,4]]`.
3. Reverse each row → `[[3,1],[4,2]]`.
4. Check: the top-left `1` moved to the top-right, which is a 90° clockwise turn.

> [!NOTE]
> **Quick check:** Does this work for a non-square matrix? *Not in place; you must allocate a new `C × R` matrix.*


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

### Other Rotations

```java
// 90° COUNTER-CLOCKWISE: Transpose + Reverse each COLUMN
// 180°: Reverse each row, then reverse order of rows
// Horizontal Flip: Reverse each row
// Vertical Flip: Reverse order of rows
```

---

[← Understanding 2d Arrays From Scratch](01_understanding_2d_arrays_from_scratch.md) | [Chapter overview](../04_2D_Arrays_Matrix.md) | [Common 2d Array Problems →](03_common_2d_array_problems.md)
