# Chapter 3 — Linear Systems: Direct Methods

> "Gaussian elimination is the algorithm that runs inside every scientific software package, every finite-element solver, every deep-learning backward pass. It's as fundamental to applied computing as sorting."

---

## The Problem

Solve: **Ax = b**

where A is an n×n matrix, b is a known right-hand side, x is what we want.

**Why this matters everywhere:**
- Circuit analysis: KVL/KCL give a linear system for all node voltages
- Structure mechanics: finite element method → massive linear system
- Machine learning: linear regression solves the normal equations AᵀAx = Aᵀb
- Computer graphics: least-squares fitting, projection
- ODEs: implicit time-stepping schemes need to solve a linear system per step

Brute-force: Cramer's rule uses determinants → O(n! ) operations. For n=20, that's 10¹⁸ operations. Hopeless.

We need something smarter: **O(n³)** for general systems.

---

## 3.1 Gaussian Elimination — Deriving It

**Idea:** Transform Ax = b into an equivalent upper triangular system Ux = c, then back-substitute.

**Why triangular?** A triangular system is trivially solvable:

```
U₃₃x₃ = c₃                      → x₃ = c₃/U₃₃
U₂₂x₂ + U₂₃x₃ = c₂             → x₂ = (c₂ - U₂₃x₃)/U₂₂
U₁₁x₁ + U₁₂x₂ + U₁₃x₃ = c₁    → x₁ = (c₁ - U₁₂x₂ - U₁₃x₃)/U₁₁
```

**The elimination step:** To zero out entry A[i][k] (row i, column k) where k < i:

Multiply row k by the **multiplier** mᵢₖ = A[i][k] / A[k][k], then subtract from row i:

```
Row_i ← Row_i - mᵢₖ × Row_k
```

This sets A[i][k] = 0 (it's designed to cancel) and modifies all other entries in row i.

### Full Algorithm

```python
def gaussian_eliminate(A, b):
    n = len(b)
    # Forward elimination
    for k in range(n):                        # pivot column k
        for i in range(k+1, n):              # row below pivot
            m = A[i][k] / A[k][k]           # multiplier
            for j in range(k, n):
                A[i][j] -= m * A[k][j]      # update row
            b[i] -= m * b[k]                 # update RHS
    
    # Back substitution
    x = [0.0] * n
    for i in range(n-1, -1, -1):
        x[i] = b[i]
        for j in range(i+1, n):
            x[i] -= A[i][j] * x[j]
        x[i] /= A[i][i]
    return x
```

**Operation count:** Forward elimination does ~n³/3 multiplications/additions. Back substitution does ~n²/2. Total: **O(n³/3)**.

### Worked Trace: 3×3 System

System: 
```
 2x + y - z = 8
-3x - y + 2z = -11
-2x + y + 2z = -3
```

Augmented matrix [A|b]:
```
[ 2   1  -1 |  8]
[-3  -1   2 | -11]
[-2   1   2 | -3]
```

**Step k=0** (eliminate column 0, rows 1 and 2):

m₁₀ = -3/2, m₂₀ = -2/2 = -1

Row 1 ← Row 1 - (-3/2) × Row 0 = Row 1 + 1.5 × Row 0:
```
[-3+1.5·2, -1+1.5·1, 2+1.5·(-1), -11+1.5·8] = [0, 0.5, 0.5, 1]
```

Row 2 ← Row 2 - (-1) × Row 0 = Row 2 + Row 0:
```
[-2+2, 1+1, 2-1, -3+8] = [0, 2, 1, 5]
```

After step k=0:
```
[ 2   1  -1 |  8]
[ 0  0.5  0.5 | 1]
[ 0   2   1  | 5]
```

**Step k=1** (eliminate column 1, row 2):

m₂₁ = 2/0.5 = 4

Row 2 ← Row 2 - 4 × Row 1:
```
[0-0, 2-4·0.5, 1-4·0.5, 5-4·1] = [0, 0, -1, 1]
```

After step k=1:
```
[ 2   1  -1 |  8]
[ 0  0.5  0.5 | 1]
[ 0   0  -1  | 1]
```

**Back substitution:**
```
x₃ = 1/(-1) = -1
x₂ = (1 - 0.5·(-1))/0.5 = (1 + 0.5)/0.5 = 3
x₁ = (8 - 1·3 - (-1)·(-1))/2 = (8 - 3 - 1)/2 = 2
```

**Solution: x = [2, 3, -1].** Verify: 2·2 + 3 - (-1) = 4+3+1 = 8 ✓.

---

## 3.2 Partial Pivoting — Critical for Stability

**Problem without pivoting:**

```
[ε  1] [x]   [1]
[1  1] [y] = [2]
```

With ε = 10⁻¹⁶ (tiny pivot):

m₁₀ = 1/ε = 10¹⁶

Row 1 ← Row 1 - 10¹⁶ × Row 0:
```
[0, 1 - 10¹⁶, 2 - 10¹⁶]
```

In floating point: 1 - 10¹⁶ = -10¹⁶ (the 1 is lost to cancellation).
2 - 10¹⁶ = -10¹⁶.

Back substitution: y = (-10¹⁶)/(-10¹⁶) = 1. 
Then x = (1 - 1·1)/ε = 0 ≈ wrong.

True solution: y ≈ 1, x ≈ 1. (The ε rows says x ≈ 1/ε... wait, with tiny ε, the system says εx + y = 1 and x + y = 2, so x = 1/(1-ε) ≈ 1, y = 1 - ε ≈ 1.)

**Fix: Partial pivoting.** Before each elimination step k, find the row with the largest |A[i][k]| for i ≥ k. Swap that row to row k.

```python
for k in range(n):
    # Find max element in column k below row k
    max_row = max(range(k, n), key=lambda i: abs(A[i][k]))
    # Swap
    A[k], A[max_row] = A[max_row], A[k]
    b[k], b[max_row] = b[max_row], b[k]
    # Eliminate (same as before)
```

With partial pivoting, the multipliers mᵢₖ = A[i][k]/A[k][k] are always ≤ 1 in absolute value. This bounds error growth.

**After pivoting:**

```
[1  1] [x]   [2]   ← larger pivot row moved to top
[ε  1] [y] = [1]
```

m₁₀ = ε/1 = ε (tiny multiplier, no amplification)

Row 1 ← Row 1 - ε × Row 0: [0, 1-ε, 1-2ε] ≈ [0, 1, 1]

Back substitution: y = 1, x = (2 - 1·1)/1 = 1. Correct!

**Theorem:** Gaussian elimination with partial pivoting is **backward stable** for most matrices encountered in practice. The theoretical worst case (Wilkinson's matrix) has growth factor 2^(n-1), but this is essentially never seen in practice.

---

## 3.3 LU Decomposition

**Insight:** Gaussian elimination on A actually computes a decomposition A = LU where:
- **L** = lower triangular matrix with 1's on diagonal (stores the multipliers)
- **U** = upper triangular matrix (the result of elimination)

**Why LU?** If you need to solve Ax = b for *multiple* right-hand sides b₁, b₂, ..., recomputing elimination each time is wasteful. With LU factored, solving is O(n²) per new b:

```
Ax = b  →  LUx = b  →  Ly = b (solve for y in O(n²))  →  Ux = y (solve for x in O(n²))
```

LU factorization once: **O(n³)**. Each solve after: **O(n²)**. 

**Where the multipliers go:** The multiplier mᵢₖ used to zero out A[i][k] gets stored in that position (since A[i][k] = 0 after elimination, the space is free):

```python
def lu_factorize(A):
    n = len(A)
    # A is modified in-place: upper triangle = U, lower triangle (below diagonal) = L
    pivot = list(range(n))  # track row swaps for partial pivoting
    
    for k in range(n):
        # Partial pivot
        max_row = max(range(k, n), key=lambda i: abs(A[i][k]))
        A[k], A[max_row] = A[max_row], A[k]
        pivot[k], pivot[max_row] = pivot[max_row], pivot[k]
        
        # Store multipliers in lower triangle, eliminate
        for i in range(k+1, n):
            A[i][k] /= A[k][k]          # multiplier stored here
            for j in range(k+1, n):
                A[i][j] -= A[i][k] * A[k][j]
    
    return A, pivot  # A encodes both L and U
```

**LU in action (same 3×3 example):**

Original A:
```
[ 2   1  -1]
[-3  -1   2]
[-2   1   2]
```

After LU factorization (multipliers in lower, U in upper):
```
L = [1     0    0 ]    U = [2    1   -1]
    [-3/2  1    0 ]        [0   0.5  0.5]
    [-1    4    1 ]        [0    0   -1 ]
```

Verify: LU = A:
Row 1 of LU: [2, 1, -1] ✓ (just row 1 of U)
Row 2 of LU: [-3/2·2 + 0.5, -3/2·1 + 0.5, ...] = [-3, -1, 2] ✓

---

## 3.4 Special Matrix Structures

### Symmetric Positive Definite (SPD) — Cholesky

If A is symmetric (Aᵀ = A) and positive definite (all eigenvalues > 0), then:

**Cholesky decomposition:** A = LLᵀ

- L is lower triangular with positive diagonal entries
- Requires n³/6 operations — **half** the cost of LU
- Numerically stable without pivoting (SPD ensures no zero pivots)
- Used for: normal equations (Aᵀ A), covariance matrices, FEM stiffness matrices

```python
def cholesky(A):
    n = len(A)
    L = [[0.0]*n for _ in range(n)]
    for j in range(n):
        L[j][j] = math.sqrt(A[j][j] - sum(L[j][k]**2 for k in range(j)))
        for i in range(j+1, n):
            L[i][j] = (A[i][j] - sum(L[i][k]*L[j][k] for k in range(j))) / L[j][j]
    return L
```

**Cholesky fails** iff A is not positive definite (a negative value inside the sqrt). This can be used as a test for positive definiteness.

### Tridiagonal Systems — Thomas Algorithm

Many problems (ODE finite differences, spline fitting, heat equation) produce tridiagonal systems:

```
[ b₁  c₁              ]   [x₁]   [d₁]
[ a₂  b₂  c₂          ]   [x₂]   [d₂]
[     a₃  b₃  c₃      ] × [x₃] = [d₃]
[         ...          ]   [...]   [...]
[              aₙ  bₙ] ]   [xₙ]   [dₙ]
```

**Thomas algorithm:** Gaussian elimination specialized for tridiagonals.

Forward sweep:
```
c'₁ = c₁/b₁,   d'₁ = d₁/b₁
For i = 2 to n:
    w = aᵢ / (bᵢ - aᵢ·c'ᵢ₋₁)
    c'ᵢ = cᵢ / (bᵢ - aᵢ·c'ᵢ₋₁)
    d'ᵢ = (dᵢ - aᵢ·d'ᵢ₋₁) / (bᵢ - aᵢ·c'ᵢ₋₁)
```

Back substitution:
```
xₙ = d'ₙ
For i = n-1 to 1: xᵢ = d'ᵢ - c'ᵢ·xᵢ₊₁
```

**Cost: O(n)** — linear! (vs O(n³) for general Gaussian elimination). Critical for real-time simulations.

### Sparse Systems

When most of A's entries are zero (typical for PDE discretizations with millions of unknowns), store only non-zero entries and use specialized algorithms (Chapter 4: iterative methods, or sparse direct solvers like UMFPACK).

---

## 3.5 Computing the Inverse and Determinant

**Computing A⁻¹:** Solve n systems Ax = eᵢ (one for each unit vector eᵢ). With LU pre-factored, cost = n × O(n²) = O(n³). But:

**Never compute the inverse if you just want to solve Ax = b.** Direct substitution is more accurate and cheaper. A⁻¹b has error proportional to κ(A)², while direct LU solve has error proportional to κ(A).

**Computing det(A):** After LU with pivoting:

```
det(A) = (-1)^s × U[0][0] × U[1][1] × ... × U[n-1][n-1]
```

where s = number of row swaps in pivoting. The determinant of L = 1 (ones on diagonal), and the determinant of U is the product of its diagonal entries.

**The determinant is a terrible indicator of matrix conditioning.** A matrix with det = 10⁻³⁰⁰ might be perfectly invertible, while a matrix with det = 1 might be extremely ill-conditioned. Use condition number κ(A), not det.

---

## 3.6 Matrix Condition Number and Error Bounds

If we solve Ax = b on a computer, the computed x̂ satisfies:
```
A(x + δx) = b + δb     (perturbation form)
```

**Sensitivity:** The relative error in x is bounded by:
```
||δx|| / ||x|| ≤ κ(A) · (||δb|| / ||b||)
```

where **κ(A) = ||A|| · ||A⁻¹||** is the matrix condition number.

**Intuition:** κ(A) amplifies input errors. If κ(A) = 10⁶ and you solve with 10⁻¹⁶ floating-point precision, you might only get 10 correct digits in x (losing 6 to conditioning).

**Practical test:**
```python
import numpy as np
A = np.array([[1, 1], [1, 1.0001]])
print(np.linalg.cond(A))  # condition number
```

**Near-singular matrices:** κ(A) → ∞ as A approaches a singular matrix. If κ(A) > 1/ε_mach ≈ 10¹⁶, the system is numerically singular — the solution is meaningless.

---

## Section Challenge

---

**Q1.** Perform Gaussian elimination (with partial pivoting) on:
```
[0  1  2] [x]   [3]
[1  0  3] [y] = [4]
[0  2  1] [z]   [5]
```

<details>
<summary>Answer</summary>

Augmented matrix:
```
[0  1  2 | 3]
[1  0  3 | 4]
[0  2  1 | 5]
```

**Step k=0:** Find max in column 0. |A[0][0]|=0, |A[1][0]|=1, |A[2][0]|=0. Swap row 0 and row 1:
```
[1  0  3 | 4]
[0  1  2 | 3]
[0  2  1 | 5]
```

m₁₀ = 0/1 = 0 → Row 1 unchanged.
m₂₀ = 0/1 = 0 → Row 2 unchanged.

**Step k=1:** Find max in column 1 (rows 1-2). |A[1][1]|=1, |A[2][1]|=2. Swap row 1 and row 2:
```
[1  0  3 | 4]
[0  2  1 | 5]
[0  1  2 | 3]
```

m₂₁ = 1/2 = 0.5. Row 2 ← Row 2 - 0.5 × Row 1:
```
[0-0, 1-0.5·2, 2-0.5·1, 3-0.5·5] = [0, 0, 1.5, 0.5]
```

Final upper triangular:
```
[1  0   3  | 4  ]
[0  2   1  | 5  ]
[0  0  1.5 | 0.5]
```

**Back substitution:**
```
z = 0.5/1.5 = 1/3
y = (5 - 1·(1/3))/2 = (5 - 1/3)/2 = (14/3)/2 = 7/3
x = 4 - 0·(7/3) - 3·(1/3) = 4 - 1 = 3
```

**Solution: x=3, y=7/3, z=1/3.**

Verify row 0: 3·3 + (7/3) – ... wait, original row 0 of the reordered system is row 1 originally: 1·3 + 0·(7/3) + 3·(1/3) = 3 + 1 = 4 ✓
</details>

---

**Q2.** Why is Cholesky twice as fast as LU for symmetric positive definite matrices?

<details>
<summary>Answer</summary>

LU factorization computes both L (lower) and U (upper) triangular factors separately. For a general n×n matrix, this costs ~n³/3 multiplications.

For **symmetric** A = LU, symmetry implies U = Lᵀ (with diagonal scaling). So you only need to compute ONE triangle — not two. This halves the computation.

**Formal count:**

LU: For each column k, you eliminate n-k-1 rows, each requiring n-k multiplications. Total ≈ Σₖ (n-k)² ≈ n³/3.

Cholesky: For each column k, you compute L[k][k] = √(...) and L[i][k] for i > k. Since you only compute the lower triangle, you do roughly half the work: ≈ n³/6.

**Additionally:** For SPD matrices, Cholesky is numerically stable WITHOUT pivoting (the diagonal entries remain positive throughout). LU needs pivoting for stability — the pivoting steps add some overhead. So Cholesky saves both computation and code complexity.

**Rule of thumb:** Always check if your matrix is SPD before choosing a solver. Detecting SPD: check symmetry, then try Cholesky (if it completes without a negative sqrt, it's SPD).
</details>

---

**Q3.** A matrix A has condition number κ(A) = 10⁸. You solve Ax = b in float64. How many correct digits do you expect in x?

<details>
<summary>Answer</summary>

Float64 has ε_mach ≈ 10⁻¹⁶ (about 16 decimal digits of precision).

The condition number bounds the relative error in x:
```
||δx|| / ||x|| ≤ κ(A) · ε_mach = 10⁸ × 10⁻¹⁶ = 10⁻⁸
```

So you can expect about **8 correct digits** in x.

The condition number "consumed" 8 of your 16 available digits.

**Rule:** log₁₀(κ(A)) digits are lost to conditioning. With κ = 10⁸, you lose 8 digits, leaving 16 - 8 = 8 correct.

**If κ(A) = 10¹⁶:** 16 - 16 = 0 correct digits. The matrix is effectively singular in floating-point arithmetic. Typical symptom: solution x changes drastically with tiny changes to b.
</details>

---

**Q4.** What is the Thomas algorithm's advantage over general Gaussian elimination for tridiagonal systems? Give a concrete application.

<details>
<summary>Answer</summary>

**Complexity advantage:**
- General Gaussian elimination: O(n³)
- Thomas algorithm: O(n) — linear!

**Space advantage:** Tridiagonal has only 3n-2 nonzero entries vs n². Thomas only needs three arrays (a, b, c) rather than an n×n matrix.

**Application — 1D heat equation (finite differences):**

Discretize ∂u/∂t = α ∂²u/∂x² on grid points x₁, ..., xₙ using implicit Euler (Crank-Nicolson for accuracy):

At each time step, solve:
```
-r·u[i-1] + (1+2r)·u[i] - r·u[i+1] = u_old[i]
```
where r = α·Δt/Δx².

This is EXACTLY a tridiagonal system with:
- Main diagonal: b[i] = 1+2r
- Off-diagonals: a[i] = c[i] = -r
- RHS: d[i] = u_old[i]

With n=1000 grid points and 10000 time steps:
- General GE: 10000 × 1000³ / 3 ≈ 3 × 10¹⁵ operations (impossibly slow)
- Thomas: 10000 × 1000 × 3 = 3 × 10⁷ operations (fraction of a second)

The tridiagonal structure is what makes implicit PDE solvers feasible.
</details>

---

**Q5.** Prove that if P, L, U are the matrices from LU factorization with partial pivoting (PA = LU), then det(A) = (-1)^s × det(U) where s is the number of row swaps.

<details>
<summary>Answer</summary>

**Key facts:**
1. Gaussian elimination (row reduction) doesn't change det when done as: `Row_i ← Row_i - m × Row_k`. This is an elementary row operation of type III (add multiple of one row to another), which has determinant 1 — so the matrix's determinant is preserved.

2. A row swap multiplies the determinant by -1.

3. det(L) = product of L's diagonal entries = 1 (all 1's on diagonal).

4. det(U) = product of U's diagonal entries (upper triangular).

**Derivation:**

PA = LU (from the factorization).

P corresponds to s row swaps: det(P) = (-1)^s.

Taking determinants:
```
det(PA) = det(P) · det(A) = (-1)^s · det(A)
det(LU) = det(L) · det(U) = 1 · det(U) = det(U)
```

Setting equal:
```
(-1)^s · det(A) = det(U)
det(A) = (-1)^s · det(U) = (-1)^s × U[0][0] × U[1][1] × ... × U[n-1][n-1]
```

□

**Computational use:** This is how numpy computes det(A): LU factorize, multiply diagonal of U, track sign from pivots. Cost: O(n³) for factorization, then O(n) for the product.
</details>

---

## Chapter Summary

| Algorithm | Cost | When to Use |
|-----------|------|-------------|
| Gaussian Elimination | O(n³/3) | General dense systems |
| LU Decomposition | O(n³/3) once | Multiple right-hand sides |
| Partial Pivoting | +O(n²) overhead | Always — improves stability |
| Cholesky | O(n³/6) | SPD matrices (half cost, stable) |
| Thomas Algorithm | O(n) | Tridiagonal systems (huge speedup) |
| Sparse solvers | O(nnz^(3/2)) | Large sparse systems from PDEs |

**Never compute A⁻¹ to solve Ax=b. Always use LU or Cholesky.**

---

*Previous: [02 — Root Finding](02_Root_Finding.md)*
*Next: [04 — Linear Systems: Iterative Methods](04_Linear_Systems_Iterative.md)*
