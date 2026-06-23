# Chapter 4 — Linear Systems: Iterative Methods

> "When the matrix has a million rows, Gaussian elimination isn't an option. Iterative methods don't solve the system — they converge toward the solution, and for many real problems, they get there much faster."

---

## Why Iterative Methods Exist

Gaussian elimination costs O(n³). For n = 10⁶ (typical in fluid simulations, weather models, structural analysis), that's 10¹⁸ operations — decades on today's hardware.

But most large systems arising from physics are **sparse** — typically O(n) nonzero entries (5-10 per row). Direct methods still cost O(n³) because fill-in (new nonzeros created during elimination) destroys sparsity.

Iterative methods maintain sparsity: each iteration costs O(nnz) — the number of nonzeros — rather than O(n²) or O(n³). For very sparse systems with good structure, a few hundred iterations at O(n) each beats O(n³) by orders of magnitude.

**The trade-off:** Iterative methods produce approximate solutions; direct methods produce (numerically) exact solutions. But for most applications, 6-8 significant digits is more than enough.

---

## 4.1 Jacobi Iteration

**Setup:** Ax = b, rewrite as x = D⁻¹(b - (L+U)x) where D = diagonal of A, L+U = off-diagonal parts.

**Iteration:**
```
x_i^(k+1) = (b_i - Σ_{j≠i} a_{ij} x_j^(k)) / a_{ii}
```

In words: to update each component xᵢ, fix all OTHER components at their current values and solve for xᵢ from row i of the system.

### Jacobi Algorithm

```python
def jacobi(A, b, x0=None, tol=1e-10, max_iter=1000):
    n = len(b)
    x = x0 if x0 else [0.0]*n
    
    for iteration in range(max_iter):
        x_new = [0.0]*n
        for i in range(n):
            s = sum(A[i][j] * x[j] for j in range(n) if j != i)
            x_new[i] = (b[i] - s) / A[i][i]
        
        if max(abs(x_new[i]-x[i]) for i in range(n)) < tol:
            return x_new, iteration
        x = x_new
    
    return x, max_iter
```

**Key:** ALL x_new values use the OLD x values. Updates happen "all at once."

### Jacobi Example

Solve:
```
 4x - y      = 7
-x  + 3y - z = 5
    -y  + 4z = 3
```

Jacobi iteration formulas:
```
x^(k+1) = (7 + y^(k)) / 4
y^(k+1) = (5 + x^(k) + z^(k)) / 3
z^(k+1) = (3 + y^(k)) / 4
```

Starting with x⁰ = y⁰ = z⁰ = 0:

| Iter | x | y | z |
|------|---|---|---|
| 0 | 0 | 0 | 0 |
| 1 | 7/4=1.75 | 5/3=1.667 | 3/4=0.75 |
| 2 | (7+1.667)/4=2.167 | (5+1.75+0.75)/3=2.5 | (3+1.667)/4=1.167 |
| 3 | (7+2.5)/4=2.375 | (5+2.167+1.167)/3=2.778 | (3+2.5)/4=1.375 |
| ... | → 2.5 | → 3 | → 1.5 |

True solution: x=2.5, y=3, z=1.5. ✓

---

## 4.2 Gauss-Seidel Iteration

**Improvement over Jacobi:** Use each updated component immediately (not waiting for next iteration).

```
x_i^(k+1) = (b_i - Σ_{j<i} a_{ij} x_j^(k+1) - Σ_{j>i} a_{ij} x_j^(k)) / a_{ii}
```

Note: for j < i, use the ALREADY UPDATED values x^(k+1). Only use old values for j > i.

```python
def gauss_seidel(A, b, x0=None, tol=1e-10, max_iter=1000):
    n = len(b)
    x = x0 if x0 else [0.0]*n
    
    for iteration in range(max_iter):
        x_prev = x[:]
        for i in range(n):
            s = sum(A[i][j] * x[j] for j in range(n) if j != i)
            x[i] = (b[i] - s) / A[i][i]  # x updated in-place!
        
        if max(abs(x[i]-x_prev[i]) for i in range(n)) < tol:
            return x, iteration
    
    return x, max_iter
```

**Same example, Gauss-Seidel:**

| Iter | x | y | z |
|------|---|---|---|
| 0 | 0 | 0 | 0 |
| 1 | 1.75 | (5+1.75+0)/3=2.25 | (3+2.25)/4=1.3125 |
| 2 | (7+2.25)/4=2.3125 | (5+2.3125+1.3125)/3=2.875 | (3+2.875)/4=1.46875 |
| 3 | 2.469 | 2.979 | 1.495 |
| 4 | 2.495 | 2.997 | 1.499 |

Converges in ~half the iterations of Jacobi. Gauss-Seidel generally converges about twice as fast and uses the same memory.

---

## 4.3 Convergence Analysis

Both methods can be written as: **x^(k+1) = Cx^(k) + d** (linear iteration).

- Jacobi: C_J = -D⁻¹(L+U), d_J = D⁻¹b
- Gauss-Seidel: C_GS = -(D+L)⁻¹U, d_GS = (D+L)⁻¹b

**Convergence criterion:** The iteration converges from any starting point iff the **spectral radius** ρ(C) < 1.

ρ(C) = max{|λ| : λ eigenvalue of C}

If ρ(C) < 1: converge. The smaller ρ(C), the faster the convergence.

**Error after k iterations:** ||eₖ|| ≤ ρ(C)ᵏ ||e₀||

If ρ = 0.5: error halves each iteration. If ρ = 0.99: error decreases 1% each iteration (slow).

### Sufficient Conditions for Convergence

**Diagonal dominance:** If |a_{ii}| > Σ_{j≠i} |a_{ij}| for all i, then both Jacobi and Gauss-Seidel converge.

**Why:** Diagonal dominance ensures ||C_J||_∞ < 1, which bounds ρ(C_J) < 1.

**Gauss-Seidel theorem:** If A is symmetric positive definite (SPD), Gauss-Seidel always converges.

**Note:** Diagonal dominance is sufficient but not necessary. Many physically-arising systems converge without diagonal dominance.

---

## 4.4 Successive Over-Relaxation (SOR)

**Idea:** Gauss-Seidel takes a step; what if we "overshoot" to accelerate convergence?

```
x_i^(k+1) = (1-ω)x_i^(k) + ω × (Gauss-Seidel update)
```

where ω is the **relaxation parameter**:
- ω = 1: Gauss-Seidel (no change)
- ω < 1: under-relaxation (slower, more stable)
- ω > 1: over-relaxation (can be much faster)

**Optimal ω for 1D Poisson:** ω_opt = 2/(1 + √(1-ρ²(C_J)))

For typical PDE problems, optimal ω ≈ 1.9-1.99. Using ω_opt instead of ω=1 can reduce iteration count by a factor of n (for an n×n grid!).

**Why this works:** Gauss-Seidel is moving in the right direction but with too-small steps. Overshooting by factor ω gets closer to the solution in fewer steps.

**SOR convergence:** For SPD matrices, SOR converges for all 0 < ω < 2.

---

## 4.5 Conjugate Gradient (CG): The Power Method for Solving

All the methods above (Jacobi, Gauss-Seidel, SOR) are **stationary** — the iteration matrix C doesn't change. Conjugate Gradient is **non-stationary**: it adapts at each step.

**For:** SPD systems Ax = b.

**Derivation from minimization:** Solving Ax = b for SPD A is equivalent to minimizing:

```
φ(x) = (1/2)xᵀAx - bᵀx
```

(The gradient of φ is Ax - b, which is 0 at the solution.)

**CG minimizes φ over a sequence of subspaces** (Krylov subspaces K_k = span{r₀, Ar₀, A²r₀, ..., A^(k-1)r₀}) taking **A-conjugate** (perpendicular under the A-inner product) search directions.

### CG Algorithm

```
r₀ = b - Ax₀  (initial residual)
p₀ = r₀        (initial search direction)

For k = 0, 1, 2, ...:
    αₖ = rₖᵀrₖ / (pₖᵀApₖ)      (step size along direction pₖ)
    xₖ₊₁ = xₖ + αₖpₖ            (update solution)
    rₖ₊₁ = rₖ - αₖApₖ           (update residual)
    βₖ = rₖ₊₁ᵀrₖ₊₁ / (rₖᵀrₖ)  (Gram-Schmidt coefficient)
    pₖ₊₁ = rₖ₊₁ + βₖpₖ         (update search direction)
```

**Convergence:** CG converges in at most n steps (exact arithmetic). In practice, converges much faster.

**Error bound:**
```
||xₖ - x*||_A ≤ 2 · ((√κ-1)/(√κ+1))^k · ||x₀-x*||_A
```

where κ = κ(A) is the condition number, ||·||_A is the A-norm.

If κ = 100: need ~(10-1)/(10+1) ≈ 0.82 factor per step. For 10⁻⁸ reduction, need ~80 steps.

**Per-step cost:** One matrix-vector multiply Ap (dominant cost for sparse A). For an n×n sparse matrix with ~5 nonzeros per row: O(5n) per step. Total for k_conv steps: O(5n × k_conv) << O(n³).

---

## 4.6 Preconditioning — The Key to Fast CG

**Problem:** CG convergence depends on κ(A). Typical PDE matrices have κ = O(h⁻²) where h is the grid spacing. For fine grids (n = 10⁶), κ = 10¹² — CG needs millions of iterations.

**Solution:** Precondition the system. Instead of solving Ax = b, solve:

```
M⁻¹Ax = M⁻¹b
```

where M ≈ A is chosen so that:
1. κ(M⁻¹A) << κ(A) (much better condition number)
2. Solving Mz = r is cheap (each CG iteration needs this)

### Common Preconditioners

**Diagonal (Jacobi) preconditioner:** M = D (diagonal of A).

Simple but effective for diagonal-dominant systems. Reduces κ by factor equal to the diagonal variation.

**Incomplete LU (ILU):** Compute LU factorization but drop fill-in (only keep entries where A has nonzeros).

Good balance: cheap to apply, significantly improves conditioning.

**Algebraic Multigrid (AMG):** The state-of-the-art preconditioner. Builds a hierarchy of coarser representations of A, uses them to smooth error at different scales. For elliptic PDEs, achieves κ ≈ O(1) — CG converges in O(1) iterations regardless of grid size!

**Preconditioned CG (PCG):**

```
r₀ = b - Ax₀
Solve Mz₀ = r₀ for z₀
p₀ = z₀

For k = 0, 1, ...:
    αₖ = rₖᵀzₖ / (pₖᵀApₖ)
    xₖ₊₁ = xₖ + αₖpₖ
    rₖ₊₁ = rₖ - αₖApₖ
    Solve Mzₖ₊₁ = rₖ₊₁ for zₖ₊₁
    βₖ = rₖ₊₁ᵀzₖ₊₁ / (rₖᵀzₖ)
    pₖ₊₁ = zₖ₊₁ + βₖpₖ
```

The preconditioner "solve" Mz=r is the core of PCG. Diagonal preconditioner: O(n). ILU: O(nnz). AMG: O(n).

---

## 4.7 GMRES for Non-Symmetric Systems

CG only works for SPD matrices. For general (asymmetric) systems, use **GMRES** (Generalized Minimal Residual):

**Idea:** Find the x in the Krylov subspace K_k = span{r₀, Ar₀, ..., A^(k-1)r₀} that minimizes ||b - Ax||₂.

**Cost:** Iteration k requires storing k vectors (Krylov basis). For large k, memory becomes an issue → **Restarted GMRES(m)**: restart after m iterations with current best x as new x₀.

**When to use:**
- Non-symmetric: fluid dynamics (convection), unsymmetric FEM
- SPD: prefer CG (cheaper, exact orthogonality guarantees)

---

## 4.8 Comparison: When to Use What

| Method | System type | Cost/iter | Convergence | Notes |
|--------|------------|-----------|-------------|-------|
| Jacobi | Diag-dominant | O(nnz) | Slow | Simple, parallelizable |
| Gauss-Seidel | SPD, diag-dom | O(nnz) | ~2× Jacobi | Sequential (hard to parallelize) |
| SOR | SPD | O(nnz) | Much better | Need to find ω_opt |
| CG | SPD | O(nnz) | Optimal for Krylov | Use with good preconditioner |
| PCG | SPD | O(nnz)+M | Excellent | Best for large SPD systems |
| GMRES | General | O(k·nnz) | Good | Non-symmetric systems |
| Direct (LU) | Any small | O(n³) | Exact | n < 10⁴ or dense |

**Decision tree:**
1. n < 5000 and dense → LU or Cholesky (direct)
2. n > 5000, SPD, sparse → PCG with ILU or AMG
3. n > 5000, non-symmetric, sparse → GMRES or BiCGSTAB with preconditioner
4. n > 5000, diagonally dominant → Jacobi or Gauss-Seidel (if cheap is fine)

---

## Section Challenge

---

**Q1.** Show that the Jacobi iteration for solving diagonally-dominant system with a_{ii} > Σ_{j≠i}|a_{ij}| converges. Prove it using the infinity norm of the iteration matrix.

<details>
<summary>Answer</summary>

Jacobi iteration matrix: C = -D⁻¹(L+U), where (D⁻¹(L+U))_{ij} = -a_{ij}/a_{ii} for i≠j, 0 for i=j.

**∞-norm:** ||C||_∞ = max_i Σ_j |c_{ij}| = max_i Σ_{j≠i} |a_{ij}|/|a_{ii}|

By diagonal dominance: Σ_{j≠i} |a_{ij}| < |a_{ii}| for all i.

Therefore: max_i (Σ_{j≠i} |a_{ij}|/|a_{ii}|) < 1.

So **||C||_∞ < 1**.

For any matrix norm: ρ(C) ≤ ||C||. Since ρ(C) ≤ ||C||_∞ < 1, the spectral radius is less than 1.

**Convergence:** The error after k iterations: e_k = C^k e_0. Taking norms: ||e_k||_∞ ≤ ||C||_∞^k ||e_0||_∞ → 0 as k→∞. 

The Jacobi iteration converges for any starting point. □
</details>

---

**Q2.** In the CG algorithm, prove that the search directions p₀, p₁, ..., p_{n-1} are A-conjugate: pᵢᵀApⱼ = 0 for i ≠ j (proof for 2 steps is sufficient).

<details>
<summary>Answer</summary>

**Step 0:** p₀ = r₀.

**Step 1:** p₁ = r₁ + β₀p₀.

**Claim:** p₁ᵀAp₀ = 0.

From the update: r₁ = r₀ - α₀Ap₀.

Compute p₁ᵀAp₀:
```
p₁ᵀAp₀ = (r₁ + β₀p₀)ᵀAp₀
         = r₁ᵀAp₀ + β₀p₀ᵀAp₀
```

From α₀'s definition: α₀ = r₀ᵀr₀ / (p₀ᵀAp₀), so p₀ᵀAp₀ = r₀ᵀr₀/α₀.

Also: r₁ = r₀ - α₀Ap₀ → Ap₀ = (r₀ - r₁)/α₀

So: r₁ᵀAp₀ = r₁ᵀ(r₀-r₁)/α₀ = (r₁ᵀr₀ - r₁ᵀr₁)/α₀

CG residuals are mutually orthogonal (rᵢᵀrⱼ = 0 for i ≠ j — this follows from the subspace minimization property). So r₁ᵀr₀ = 0.

Therefore: r₁ᵀAp₀ = (0 - r₁ᵀr₁)/α₀ = -r₁ᵀr₁/α₀.

And β₀ = r₁ᵀr₁/r₀ᵀr₀, so:

```
p₁ᵀAp₀ = -r₁ᵀr₁/α₀ + (r₁ᵀr₁/r₀ᵀr₀) × (r₀ᵀr₀/α₀)
         = -r₁ᵀr₁/α₀ + r₁ᵀr₁/α₀ = 0 ✓
```

The A-conjugacy holds. □ (The full inductive proof for all k follows the same structure.)
</details>

---

**Q3.** The system Ax = b has A = diag(1, 1, ..., 1, κ) — identity with last entry κ >> 1. What's the condition number? How many CG steps are needed for convergence?

<details>
<summary>Answer</summary>

**Condition number:** κ(A) = σ_max/σ_min = κ/1 = κ (since eigenvalues are 1,1,...,1,κ).

For κ = 10⁶: condition number = 10⁶.

**CG convergence:** The error bound:
```
||eₖ||_A ≤ 2 ((√κ-1)/(√κ+1))^k ||e₀||_A
```

With κ = 10⁶: √κ = 1000. Factor per step = (999/1001) ≈ 0.998. For 10⁻⁸ reduction: k ≈ 8/log₁₀(1/0.998) ≈ 8/0.00087 ≈ 9200 steps.

But wait — this diagonal matrix has a SPECIAL structure. CG on a system with only 2 distinct eigenvalues converges in at MOST 2 steps (CG converges in k steps for a matrix with k distinct eigenvalues).

With eigenvalues {1, κ}: CG finds the exact solution in 2 iterations!

**Lesson:** The eigenvalue distribution matters more than the condition number alone. A highly ill-conditioned matrix with a few clustered eigenvalues can be easy for CG. This is why preconditioning aims to cluster eigenvalues, not just reduce κ.
</details>

---

**Q4.** Explain why Gauss-Seidel is difficult to parallelize while Jacobi is trivially parallelizable.

<details>
<summary>Answer</summary>

**Jacobi:** Each component update `x_i^(k+1) = (b_i - Σ_{j≠i} a_{ij} x_j^(k)) / a_{ii}` uses only OLD values x^(k). All n components are independent — they can all be computed simultaneously on n processors. Jacobi is "embarrassingly parallel."

**Gauss-Seidel:** Component update for x_i^(k+1) uses ALREADY UPDATED values x_j^(k+1) for j < i. Component i depends on the result of component i-1, which depends on i-2, etc. This is a **sequential dependency chain** — you can't compute x_2 until x_1 is done, can't compute x_3 until x_2 is done.

**Partial fix for Gauss-Seidel — Red-Black ordering:**

For structured grids, color nodes "red" and "black" like a checkerboard. All red nodes depend only on black neighbors (and vice versa).

- Iteration step 1: update all RED nodes in parallel (they only read BLACK values)
- Iteration step 2: update all BLACK nodes in parallel (they only read updated RED values)

This achieves ~2× parallelism per effective Gauss-Seidel step. Used in multigrid smoothers.

**Why it matters:** GPU computing and modern multi-core CPUs demand highly parallel algorithms. Jacobi's parallelism is a real advantage for GPU-based solvers, despite its slower per-step convergence.
</details>

---

**Q5.** For the 1D Poisson equation -u'' = f on [0,1] with grid spacing h = 1/n, the stiffness matrix has diagonal 2/h² and off-diagonals -1/h². What is the spectral radius of the Jacobi iteration matrix?

<details>
<summary>Answer</summary>

After scaling by h²/2 (dividing each row by 2/h²), the matrix is:
```
a_{ii} = 1, a_{i,i±1} = -1/2
```

Jacobi iteration matrix: C_{ij} = -a_{ij}/a_{ii} for i≠j, 0 for i=j.

So C has off-diagonals 1/2 (for ±1 neighbors) and zeros elsewhere. This is the adjacency matrix of a path graph (1D), scaled by 1/2.

**Eigenvalues of the path graph adjacency matrix** (n×n tridiagonal with 0 diagonal and 1 off-diagonals):
```
λₖ = 2cos(kπ/(n+1))   for k = 1, ..., n
```

So eigenvalues of C = (1/2) × path graph adjacency matrix:
```
λₖ(C) = cos(kπ/(n+1))   for k = 1, ..., n
```

**Spectral radius:** ρ(C) = max_k |cos(kπ/(n+1))| = |cos(π/(n+1))| ≈ 1 - π²/(2(n+1)²) for large n.

As n → ∞: ρ(C) → 1.

**Convergence:** The error reduction per step is ρ(C) ≈ 1 - π²/(2n²). To reduce error by 10⁻⁸, need iterations:
```
k ≈ n² × 2/π² × 8 ln 10 ≈ 3.7n²
```

For n = 100 grid points: ~37,000 iterations! This is why Jacobi/Gauss-Seidel are too slow for PDE problems without preconditioning or multigrid.

With multigrid: O(n) iterations of O(n) work each = O(n) total. This is why multigrid is the method of choice for elliptic PDEs.
</details>

---

## Chapter Summary

| Method | Update Rule | Convergence | Key Requirement |
|--------|------------|-------------|-----------------|
| Jacobi | All components simultaneously using old values | ρ(C_J) < 1 | Diagonal dominance (sufficient) |
| Gauss-Seidel | Sequential, use new values immediately | ρ(C_GS) < 1 | SPD or diag dominance |
| SOR | Gauss-Seidel + overrelaxation ω | Better than GS | 0 < ω < 2 for SPD |
| CG | Krylov subspace minimization | O(√κ) steps | SPD only |
| PCG | CG + preconditioner M⁻¹ | O(√κ(M⁻¹A)) steps | SPD + good M |
| GMRES | Krylov minimization of residual | General | Non-symmetric systems |

**Rule of thumb:** Condition number determines CG convergence speed; eigenvalue clustering determines actual performance; preconditioning clusters eigenvalues.

---

*Previous: [03 — Linear Systems: Direct Methods](03_Linear_Systems_Direct.md)*
*Next: [05 — Polynomial Interpolation](05_Polynomial_Interpolation.md)*
