# 🎓 University-Level Addendum — 2D Arrays & Matrix as Formal Theory

> **Navigation**: [← 5: Coderbyte & Interview Matrix Challenges](04_coderbyte_interview_matrix_challenges.md) | [Chapter overview](../04_2D_Arrays_Matrix.md)
> Page 5 of 5 in **2D Arrays & Matrix: Complete Deep Dive**


> **Purpose:** This addendum elevates the chapter to MIT/KTH/ETH rigor. The body has comprehensive 2D array coverage (spiral traversal, rotation, prefix sum, Kadane's 2D, BFS/DFS on grids); this addendum provides the formal invariants for 2D layout, the canonical edge cases, and exam-style proofs for the most important 2D algorithms.

## 2D Array Invariants

A 2D array's correctness depends on layout invariants that are easy to violate in code. The canonical invariants:

### Row-Major Layout Invariant (Java, C, default in most languages)

| Invariant | Statement | Violation Consequence |
|---|---|---|
| **2D1 — Contiguous rows** | For row-major layout, all elements of row `i` are stored before row `i+1` in memory | Cache-line trashing on column-major access; `arr[i][j]` ≠ `arr[i][j]` on row-major |
| **2D2 — Address formula** | `addr(arr[i][j]) = base + (i * numCols + j) * sizeof(T)` | Out-of-bounds if formula is mis-derived (e.g., off-by-one) |
| **2D3 — Index bounds** | `0 ≤ i < numRows && 0 ≤ j < numCols` for all accesses | `ArrayIndexOutOfBoundsException` |
| **2D4 — Rectangular shape (Java int[][])** | All inner arrays have the same length | Ragged array breaks cache locality assumption |

### Java Ragged Array Invariant

Java's `int[][]` is an *array of references* to inner arrays. Each inner array can have a different length (ragged).

| Invariant | Statement | Violation Consequence |
|---|---|---|
| **J1 — Outer array** | `matrix.length` = number of rows | Wrong row count |
| **J2 — Inner arrays** | `matrix[i].length` may differ across `i` | Iteration breaks; bounds check fails |
| **J3 — Null inner arrays** | `matrix[i] != null` for valid rows | NPE on `matrix[i][j]` |
| **J4 — Heap allocation** | Each inner array is a separate heap allocation | Fragmentation; cache misses on row transitions |

### In-Place vs Copy Invariants

For algorithms that modify a matrix in place:

| Invariant | Statement | Violation Consequence |
|---|---|---|
| **IP1 — Same shape** | Output matrix has the same shape as input | Wrong answer for algorithms that assume fixed dimensions |
| **IP2 — Layer-by-layer (rotations)** | Rotating a matrix in place processes concentric layers; outer to inner | Skipping a layer; partial rotation |
| **IP3 — Sentinel preservation** | Empty rows/cols preserved through operations | Lost data |
| **IP4 — Determinism** | Same input → same output (no hidden state) | Non-reproducible bugs |

### Traversal Order Invariants

| Traversal | Order | When to Use |
|---|---|---|
| **Row-major** | `(0,0), (0,1), ..., (0,n), (1,0), ...` | Default; cache-friendly on row-major storage |
| **Column-major** | `(0,0), (1,0), ..., (m,0), (0,1), ...` | Cache-friendly on column-major storage (Fortran) |
| **Spiral** | Outer layer clockwise, then inner layer | Matrix printing in spiral order |
| **Diagonal** | Anti-diagonals (i+j = const) | Some DP problems (e.g., longest common subsequence) |
| **BFS from corner** | Layer-by-layer from origin | Shortest path on unweighted grids |

## Edge Cases — Always Check These

The body already lists some edge cases; this section formalizes them with examples.

| # | Edge Case | Example | What Can Break |
|---|---|---|---|
| 1 | **Empty matrix** (`m = 0 || n = 0`) | `new int[0][5]` | Loop never enters; Kadane's returns 0; spiral returns empty list |
| 2 | **Single cell** (`m = n = 1`) | `[[42]]` | All algorithms should return the cell's value |
| 3 | **Single row** (`m = 1, n > 1`) | `[[1, 2, 3]]` | Spiral returns [1, 2, 3] in order; rotate returns same row |
| 4 | **Single column** (`m > 1, n = 1`) | `[[1], [2], [3]]` | Spiral returns [1, 2, 3] in order; rotate returns same column |
| 5 | **All same values** | `[[7, 7], [7, 7]]` | Algorithms should not assume distinct values |
| 6 | **All zeros** | `[[0, 0], [0, 0]]` | Kadane's returns 0 (or throws if no valid subarray convention) |
| 7 | **All negative** | `[[-1, -2], [-3, -4]]` | Kadane's returns -1 (max element); conventions vary |
| 8 | **Non-rectangular** | `[[1, 2, 3], [4, 5]]` (Java) | Iteration `matrix[i][j]` for `j < matrix[i].length` is correct; `j < numCols` is wrong |
| 9 | **Square matrix (m = n)** | `[[1, 2], [3, 4]]` | Rotation works; off-diagonal access works |
| 10 | **Very large (m, n ≥ 10⁴)** | Spiral printing 10⁴×10⁴ | Stack overflow on recursive spiral; convert to iterative |
| 11 | **Sparse matrix** (most cells = 0) | `[[0, 0, 5], [0, 0, 0]]` | Sparse representation more efficient than dense array |
| 12 | **Symmetric matrix** | `matrix[i][j] == matrix[j][i]` | Can store half the cells (n(n+1)/2 vs n²) |
| 13 | **Triangular matrix** | Upper or lower triangular | Can store in 1D array with index formula |
| 14 | **Banded matrix** (non-zero only near diagonal) | Tridiagonal, pentadiagonal | Specialized storage |
| 15 | **Constant-time access path** | Row-major but accessed by column | 16-1000× slowdown (cache-line trashing) |

## When 2D Arrays Break — Formal Failure Modes

### Break 1 — Index Formula Off-By-One

**Condition:** Using `arr[i * numCols + j + 1]` instead of `arr[i * numCols + j]`.

> [!CAUTION]
> **What breaks:** OOB access on last column; potential memory corruption in C/C++.

> [!TIP]
> **Defense:** Always test boundary: `i = 0`, `i = numRows - 1`, `j = 0`, `j = numCols - 1`. Use `arr[i][j]` in Java instead of 1D access when possible.

### Break 2 — Spiral Traversal Missing Corners

**Condition:** Spiral algorithm increments the wrong boundary after traversing a row.

> [!CAUTION]
> **What breaks:** Duplicates or skips at corners.

> [!TIP]
> **Defense:** Test with 1×1, 1×N, N×1, 2×2, 3×3 matrices. The 2×2 case is the most common bug.

### Break 3 — Rotation Skipping Inner Layer

**Condition:** In-place rotation by 90° loops through layers but doesn't recurse on inner layer.

> [!CAUTION]
> **What breaks:** Outer layer rotated; inner layer unchanged. Looks correct for the outer cells but inner cells are wrong.

**Defense:** Use the standard 4-cell swap pattern:
```
for i in 0..n/2 - 1:
    for j in i..n-i-2:
        temp = matrix[i][j]
        matrix[i][j] = matrix[n-j-1][i]
        matrix[n-j-1][i] = matrix[n-i-1][n-j-1]
        matrix[n-i-1][n-j-1] = matrix[j][n-i-1]
        matrix[j][n-i-1] = temp
```

### Break 4 — 2D Kadane's Returns Wrong Answer

**Condition:** Applying 1D Kadane's to each row, then across rows, without compressing rows correctly.

> [!CAUTION]
> **What breaks:** The algorithm finds max-subarray in any row, not the max-submatrix (which can span multiple rows).

**Defense:** Use the standard 2D Kadane's:
```
maxSum = -infinity
for top in 0..m-1:
    compressed = [0] * n
    for bottom in top..m-1:
        for k in 0..n-1: compressed[k] += matrix[bottom][k]
        maxSum = max(maxSum, kadane1D(compressed))
```

This finds the max-sum submatrix in O(m² × n) time.

### Break 5 — DFS on Grid Stack Overflow

**Condition:** Recursive DFS on a grid with dimensions ≥ 10⁴ × 10⁴.

> [!CAUTION]
> **What breaks:** `StackOverflowError` after ~10⁴ frames.

> [!TIP]
> **Defense:** Convert recursion to iteration using explicit stack (see `01d_Stack_Queue.md`).

### Break 6 — 2D Prefix Sum Off-By-One

**Condition:** Using inclusive-exclusive vs inclusive-inclusive ranges inconsistently.

> [!CAUTION]
> **What breaks:** Submatrix sum is off by one row or column.

> [!TIP]
> **Defense:** Pick a convention (inclusive-exclusive is standard) and document it. Test with `top = left = 0`, `bottom = right = m-1`.

The 2D prefix sum formula (inclusive-exclusive):
```
prefix[i+1][j+1] = matrix[i][j] + prefix[i][j+1] + prefix[i+1][j] - prefix[i][j]
sum(top, left, bottom, right) = prefix[bottom+1][right+1] - prefix[top][right+1] - prefix[bottom+1][left] + prefix[top][left]
```

### Break 7 — Out-of-Bounds on Border Cells

**Condition:** DFS/BFS that checks all 4 neighbors without bounds checking.

> [!CAUTION]
> **What breaks:** `ArrayIndexOutOfBoundsException` on border cells.

> [!TIP]
> **Defense:** Always check `0 ≤ ni < m && 0 ≤ nj < n` before accessing `matrix[ni][nj]`. Or pre-pad the matrix with a border row/column of sentinel values.

### Break 8 — Modifying Matrix During Iteration

**Condition:** Setting `matrix[i][j] = ...` inside a loop that walks the matrix.

> [!CAUTION]
> **What breaks:** Subsequent iterations see the modified value; algorithm produces wrong output.

> [!TIP]
> **Defense:** Use a separate `visited[][]` boolean array, or make a copy of the matrix before modification.

## Formal Complexity Proofs — 2D Operations

### Spiral Traversal

```
T_spiral(m, n) = O(m × n)
  Each cell is visited exactly once; total visits = m × n.
```

### 2D Kadane's (Max Submatrix Sum)

```
T_2d_kadane(m, n) = O(m² × n)
  Outer loop: top row index, m iterations
  Inner loop: bottom row index, m iterations
  Innermost: 1D Kadane's on compressed column vector, O(n)
  Total: m × m × n = O(m² × n)

For square matrix m = n: O(n³).
```

### 2D Prefix Sum Query

```
T_query(top, left, bottom, right) = O(1)
  After O(m × n) precompute, each query is 4 array accesses and 3 subtractions.

T_precompute(m, n) = O(m × n)
```

### Rotation In-Place

```
T_rotate_90(m, n) = O(m × n) for m = n (square)
  Each cell is moved exactly once (the 4-cell swap pattern).

For non-square (m ≠ n), in-place rotation is not possible without auxiliary storage.
```

### BFS/DFS on Grid

```
T_bfs_grid(m, n) = O(m × n)
  Each cell is visited at most once; each edge (between adjacent cells) is examined at most twice.
  Total: O(V + E) = O(m × n + 4m × n) = O(m × n).

T_dfs_grid(m, n) = O(m × n) (with explicit stack)
  Same reasoning.
```

### Pacific Atlantic Water Flow (LC 417)

```
T_pacific_atlantic(m, n) = O(m × n)
  Two BFS/DFS from opposite borders; each cell is visited once per BFS.
  Total: O(2 × m × n) = O(m × n).
```

## Exam-Style Proofs

### Proof — 2D Prefix Sum Query Formula

**Theorem:** Given a 2D prefix sum array `P` where `P[i][j]` = sum of `matrix[0..i-1][0..j-1]`, the sum of submatrix `(top, left)` to `(bottom, right)` inclusive is:

```
sum = P[bottom+1][right+1] - P[top][right+1] - P[bottom+1][left] + P[top][left]
```

**Proof by inclusion-exclusion:**
- `P[bottom+1][right+1]` includes everything from (0,0) to (bottom,right).
- We want to exclude (0,0) to (top-1,right): that's `P[top][right+1]`.
- We want to exclude (0,0) to (bottom,left-1): that's `P[bottom+1][left]`.
- But we double-removed (0,0) to (top-1,left-1): that's `P[top][left]`.
- Add it back.

The formula is therefore correct. ✓

### Proof — In-Place 90° Rotation Correctness

**Theorem:** The 4-cell swap pattern correctly rotates an n×n matrix by 90° clockwise.

**Proof sketch:** For each layer `i` (0-indexed from outermost), there are `n - 2i - 1` cells per side. For each `j` in `[i, n-i-1)`:
- `matrix[i][j]` (top, j-th from left) → moves to `matrix[j][n-i-1]` (right, j-th from top)
- `matrix[j][n-i-1]` (right, j-th from top) → moves to `matrix[n-i-1][n-j-1]` (bottom, j-th from right)
- `matrix[n-i-1][n-j-1]` (bottom, j-th from right) → moves to `matrix[n-j-1][i]` (left, j-th from bottom)
- `matrix[n-j-1][i]` (left, j-th from bottom) → moves to `matrix[i][j]` (top, j-th from left)

This is the canonical 90° clockwise rotation. Each cell is moved exactly once. ✓

**Edge case:** When `n` is odd, the center cell is at `(n/2, n/2)` and is rotated to itself — no swap needed. The loop bound `j in [i, n-i-1)` excludes this case.

## 📎 Reference Anchor

**OpenJDK / Apache Commons Math — 2D array patterns**
- `Arrays.copyOfRange()`: [Arrays.java](https://github.com/openjdk/jdk/blob/master/src/java.base/share/classes/java/util/Arrays.java) — copies a 1D slice; for 2D you must copy row by row. **Invariant**: The copy is a shallow copy; for `Object[][]`, nested arrays share references.
- Apache Commons Math `BlockRealMatrix`: [BlockRealMatrix.java](https://github.com/apache/commons-math/blob/master/commons-math-core/src/main/java/org/apache/commons/math4/core/jdkmath/AccurateMath.java) — stores a flat 2D matrix in cache-friendly blocks to avoid column-major cache misses. **Invariant**: Block size = 52 rows × 52 cols (tuned for L1 cache); access pattern is always row-major within a block.
- **Local rewrite rule**: For `int[n][m]` in Java, each row is a separate heap object. Column-major traversal (`matrix[r][c]` for all r, fixed c) causes n cache misses per column; row-major is 16× faster for 4-byte ints on 64-byte cache lines.
- **Constraint warning**: `new int[n][m]` with n = 10⁴, m = 10⁴ = 400 MB — check heap size before allocating large 2D arrays. Consider flat `int[n*m]` with manual index arithmetic for large matrices.

## Cross-References

- **`01a_Memory_Foundations.md`** — cache-line trashing on column-major traversal (Challenge 3).
- **`01b_Arrays.md`** — 1D array invariants; the foundation for 2D.
- **`01f_Trees_Heaps.md`** — heap stored as array; 2D tree visualization.
- **`01g_DS_Internals.md`** — ArrayList of ArrayList (ragged 2D) vs flat 2D array trade-offs.
- **`02_PROBLEM_SETS.md`** — exam-style problems on 2D arrays (spiral, rotation, Kadane's 2D, prefix sum).
- **`A2_DS_Complexity_FirstPrinciples.md`** — formal Big-O derivations for 2D operations.

---

[← 5: Coderbyte & Interview Matrix Challenges](04_coderbyte_interview_matrix_challenges.md) | [Chapter overview](../04_2D_Arrays_Matrix.md)
