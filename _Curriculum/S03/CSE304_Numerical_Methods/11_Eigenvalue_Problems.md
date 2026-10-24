# Chapter 11 — Eigenvalue Problems

> "To find the dominant direction a matrix stretches space, point in any random direction and repeatedly apply the matrix. The dominant eigenvector will emerge like a cream rising to the surface."

---

## The Problem

Given a square matrix A ∈ ℝⁿˣⁿ, find scalar λ and nonzero vector v such that:
```
Av = λv
```

λ is an **eigenvalue**, v is the corresponding **eigenvector**.

**Why eigenvalues matter:**
- **Stability analysis:** ODE y' = Ay is stable iff all eigenvalues have negative real parts.
- **Principal Component Analysis (PCA):** largest eigenvalues of covariance matrix = directions of greatest variance.
- **PageRank:** dominant eigenvector of the web link matrix = page importance.
- **Vibration modes:** eigenvalues of stiffness/mass matrix = natural frequencies². Designing a bridge to avoid resonance.
- **Quantum mechanics:** eigenvalues of the Hamiltonian = measurable energy levels.
- **Image compression:** SVD (singular values = square roots of eigenvalues of AᵀA) = best low-rank approximation.
- **Convergence of iterative solvers:** spectral radius ρ(A) = max|λᵢ| governs convergence speed.

**Direct methods:** det(A - λI) = 0 gives characteristic polynomial of degree n. Roots are eigenvalues. But computing characteristic polynomial costs O(n!) and is numerically catastrophic. Never use it for n > 3.

**Numerical methods:** iterative algorithms that converge to eigenvalues/eigenvectors without forming the characteristic polynomial.

---

## 11.1 Power Iteration: The Dominant Eigenvector

**Setup:** A has eigenvalues |λ₁| > |λ₂| ≥ ... ≥ |λₙ| (strict largest magnitude). Find λ₁ and v₁.

**Algorithm:**
```
1. Start with random unit vector v⁰
2. For k = 1, 2, 3, ...
   a. w = A·v^(k-1)
   b. v^k = w / ||w||          ← normalize to prevent overflow
   c. μₖ = (v^k)ᵀ A v^k       ← Rayleigh quotient = eigenvalue estimate
3. Converge when |μₖ - μₖ₋₁| < tolerance
```

**Why it works:**
Expand v⁰ in the eigenbasis: v⁰ = c₁v₁ + c₂v₂ + ... + cₙvₙ (assuming A diagonalizable).

After k applications:
```
Aᵏv⁰ = c₁λ₁ᵏv₁ + c₂λ₂ᵏv₂ + ... + cₙλₙᵏvₙ
      = λ₁ᵏ [c₁v₁ + c₂(λ₂/λ₁)ᵏv₂ + ... + cₙ(λₙ/λ₁)ᵏvₙ]
```

Since |λ₂/λ₁| < 1, all terms except c₁v₁ decay exponentially. After normalization: v^k → v₁.

**Convergence rate:** |λ₂/λ₁|ᵏ per iteration. If the ratio is 0.9, convergence is slow (need ~100 iterations for 4 digits). If the ratio is 0.1, fast convergence.

**Rayleigh quotient:**
```
μ = vᵀAv / vᵀv
```
If v = v₁ + δv (small perturbation), then μ = λ₁ + O(||δv||²). Second-order convergence of eigenvalue vs first-order convergence of eigenvector. Always estimate eigenvalue via Rayleigh quotient, not directly.

### Worked Trace

A = [[4, 1], [2, 3]], eigenvalues: λ₁=5, λ₂=2, eigenvectors: v₁=[1,1]/√2, v₂=[1,-2]/√5.

Start: v⁰ = [1, 0]ᵀ.

**Iteration 1:**

- w = A·[1,0] = [4, 2]. ||w|| = √(16+4) = √20 ≈ 4.472. v¹ = [0.894, 0.447].
- μ₁ = [0.894, 0.447]·[4·0.894+1·0.447, 2·0.894+3·0.447] = [0.894, 0.447]·[4.023, 3.129]
  = 0.894·4.023 + 0.447·3.129 ≈ 3.597 + 1.399 ≈ 4.996.

**Iteration 2:**
w = A·[0.894, 0.447] = [4·0.894+0.447, 2·0.894+3·0.447] = [4.023, 3.129].
||w|| = √(4.023²+3.129²) = √(16.18+9.79) = √25.97 ≈ 5.096.
v² = [0.789, 0.614]. μ₂ ≈ 5.000.

Already converging: ratio λ₂/λ₁ = 2/5 = 0.4, so each iteration gains factor (0.4)² in eigenvalue accuracy.

---

## 11.2 Inverse Iteration: Arbitrary Eigenvalue

**Problem:** Power iteration finds the LARGEST eigenvalue. What about interior eigenvalues?

**Key insight:** eigenvalues of (A - σI)⁻¹ are (λᵢ - σ)⁻¹. The eigenvalue NEAREST to σ becomes the LARGEST magnitude eigenvalue of (A-σI)⁻¹.

**Algorithm (inverse iteration):**
```
1. Choose shift σ ≈ desired eigenvalue
2. Factor: A - σI = LU (once)
3. For k = 1, 2, ...
   a. Solve (A - σI)w = v^(k-1) via back-substitution (O(n²) with stored LU)
   b. v^k = w / ||w||
   c. μₖ = (v^k)ᵀ A v^k   ← note: Rayleigh quotient of ORIGINAL A
```

**Convergence:** |(λₙₑₐᵣₑₛₜ - σ)/(λₛₑcₒₙd - σ)|ᵏ. If shift is close: very fast.

**Rayleigh quotient iteration:** Update σ = μₖ (current Rayleigh quotient) at each step.

Convergence becomes CUBICALLY fast near the eigenvalue: error shrinks as ε → ε³. Extraordinarily fast in practice.

**Cost:** LU factored once O(n³). Each step: triangular solve O(n²). Total for convergence (usually < 10 steps): O(n³) + O(n²).

---

## 11.3 The QR Algorithm: All Eigenvalues at Once

**Problem:** Find ALL n eigenvalues of A.

**Orthogonal similarity:** If A = QᵀBQ for orthogonal Q, then A and B have the same eigenvalues (similar matrices share spectrum).

**Schur decomposition:** A = QᵀTQ where T is upper triangular. Eigenvalues of A are the diagonal entries of T. (Always exists for real matrices; T is quasi-upper-triangular with 2×2 real blocks for complex eigenvalue pairs.)

**QR iteration** converges to the Schur form:

```
1. A⁰ = A
2. For k = 0, 1, 2, ...
   a. QR decompose: Aᵏ = Qᵏ Rᵏ
   b. Update: Aᵏ⁺¹ = Rᵏ Qᵏ   (reverse order!)
3. Aᵏ → upper triangular (Schur form); diagonal = eigenvalues
```

**Why reversal works:** Aᵏ⁺¹ = Rᵏ Qᵏ = (Qᵏ)ᵀ Aᵏ Qᵏ (since Aᵏ = Qᵏ Rᵏ → Rᵏ = (Qᵏ)ᵀ Aᵏ).
Each step is an orthogonal similarity transformation — eigenvalues preserved throughout.

**Convergence:** Subdiagonal entries decay like the ratio of consecutive eigenvalues |λₖ₊₁/λₖ|^iteration. Convergence is linear (like power iteration), but for ALL eigenvalues simultaneously.

**Practical QR algorithm (3 speedups):**

1. **Pre-reduce to Hessenberg form:** Similar to upper-triangular but with one subdiagonal. Costs O(n³) ONCE. QR steps on Hessenberg are O(n²) instead of O(n³).

2. **Shifts:** Apply shift σ at each step: QR decompose (Aᵏ - σI). Typically σ = corner element or Wilkinson shift. Drives convergence from linear to cubic.

3. **Deflation:** When |a_{k+1,k}| < tolerance, set it to zero. Eigenvalue found. Split and work on subproblem.

**Total complexity:** O(n³) preprocessing + O(n²) per QR iteration × O(n) iterations for all eigenvalues = O(n³) overall.

LAPACK's `dgeev` uses exactly this algorithm. It's the standard tool for dense eigenproblems.

---

## 11.4 Symmetric Eigenproblems: Special Structure

When A = Aᵀ (symmetric), all eigenvalues are REAL and eigenvectors are ORTHOGONAL:
```
Av₁ = λ₁v₁, Av₂ = λ₂v₂, λ₁ ≠ λ₂ → v₁ᵀv₂ = 0
```

**Proof:** λ₁·v₁ᵀv₂ = (Av₁)ᵀv₂ = v₁ᵀAᵀv₂ = v₁ᵀAv₂ = v₁ᵀλ₂v₂ = λ₂·v₁ᵀv₂. So (λ₁-λ₂)v₁ᵀv₂ = 0. Since λ₁≠λ₂: v₁ᵀv₂ = 0. □

**Symmetric QR:** For symmetric A, Hessenberg form is TRIDIAGONAL (symmetric Hessenberg = tridiagonal). The QR algorithm specialized to tridiagonals is highly efficient.

**Divide and conquer:** Modern algorithm for symmetric tridiagonal eigenproblems. Splits the tridiagonal into two halves, solves each recursively, combines using rank-1 update. O(n²) to find all eigenvectors (vs O(n³) for QR). Fast in practice for large n.

**Gershgorin circles:** Each eigenvalue λᵢ lies in at least one disk:
```
|λ - aᵢᵢ| ≤ Rᵢ = Σⱼ≠ᵢ |aᵢⱼ|
```

Useful for bounding eigenvalues before computing them.

---

## 11.5 Large Sparse Eigenproblems: Krylov Methods

**Problem:** A is n×n but sparse (most entries zero). n might be 10⁶ or larger. Full QR is out.

**Only need k << n eigenvalues** (typically k = 5 to 50, the largest or smallest).

**Arnoldi iteration:** Build a Krylov subspace Kₘ = span{v, Av, A²v, ..., Aᵐ⁻¹v} and find the best k eigenpairs within this subspace.

**Lanczos algorithm** (symmetric A): Arnoldi restricted to symmetric A. Builds tridiagonal representation in O(m·nnz(A)) work, where nnz = number of nonzeros. Eigenvalues of the m×m tridiagonal (Ritz values) approximate the extreme eigenvalues of A.

**ARPACK** (Implicitly Restarted Arnoldi): The standard library for large sparse eigenproblems. Used internally by MATLAB's `eigs`, Python's `scipy.sparse.linalg.eigsh`.

**Key property:** After m steps, the Ritz values near the spectral extremes converge. No need to run until m = n.

**Why this works:** The Krylov subspace "focuses" on the components of the starting vector in the directions of the extreme eigenvectors. Power iteration is the degenerate case m = 1 (keep only the dominant eigenvector).

---

## 11.6 Singular Value Decomposition (SVD)

**SVD:** Every A ∈ ℝᵐˣⁿ can be written:
```
A = UΣVᵀ
```
where U ∈ ℝᵐˣᵐ orthogonal, Σ = diag(σ₁,...,σₖ) with σ₁ ≥ σ₂ ≥ ... ≥ σₖ ≥ 0, V ∈ ℝⁿˣⁿ orthogonal.

**Connection to eigenvalues:**
- σᵢ = √(eigenvalues of AᵀA) = √(eigenvalues of AAᵀ)
- Columns of V = eigenvectors of AᵀA
- Columns of U = eigenvectors of AAᵀ

**SVD computes eigenvalues of AᵀA without forming AᵀA** (better numerically because κ(AᵀA) = κ(A)² — squaring condition number doubles the loss of digits).

**Applications:**

**Best rank-k approximation (Eckart-Young theorem):**
```
||A - Aₖ||₂ = σₖ₊₁
```
where Aₖ = U[:,:k] Σ[:k,:k] V[:,:k]ᵀ. The rank-k SVD is the BEST rank-k approximation in the 2-norm. Used in image compression, LSI.

**Pseudoinverse:** A⁺ = V Σ⁺ Uᵀ where Σ⁺ = diag(1/σᵢ for σᵢ > tol, 0 otherwise). Computes the least-squares minimum-norm solution.

**Condition number:** κ₂(A) = σ₁/σₙ. If σₙ ≈ 0 (nearly singular matrix), κ → ∞ → ill-conditioned.

**Numerical rank:** Number of singular values above σ₁·ε_mach. Tells you the effective rank of a numerically computed matrix.

---

## 11.7 Generalized Eigenvalue Problems

Many applications require:
```
Av = λBv   (B ≠ I)
```

**Structural dynamics:** (K - λM)v = 0, K = stiffness, M = mass.
**Buckling analysis:** (K - λKG)v = 0, KG = geometric stiffness.

**Algorithm:**
If B is symmetric positive definite: Cholesky B = LLᵀ, transform to standard: (L⁻¹A L⁻ᵀ)(Lᵀv) = λ(Lᵀv). Solve standard eigenproblem, transform back.

For sparse B, shift-and-invert works directly: (A - σB)⁻¹B·v = μv where μ = 1/(λ-σ). Use Lanczos on the transformed system.

---

## Section Challenge

---

**Q1.** Apply three iterations of power iteration to find the dominant eigenvalue of A = [[3, 1], [0, 2]] starting from v⁰ = [1, 1]ᵀ. Explain why it converges faster than you'd expect.

<details>
<summary>Answer</summary>

Eigenvalues of A (upper triangular) are λ₁=3, λ₂=2. Ratio: 2/3 ≈ 0.667.

**Iteration 1:**

- w = A[1,1] = [3+1, 0+2] = [4, 2]. ||w|| = √20 ≈ 4.472. v¹ = [0.894, 0.447].
- μ₁ = [0.894, 0.447]·A·[0.894, 0.447]ᵀ = [0.894, 0.447]·[3·0.894+0.447, 2·0.447]
  = [0.894, 0.447]·[3.129, 0.894] = 2.797+0.400 ≈ 3.197.

**Iteration 2:**

- w = A[0.894, 0.447] = [2.682+0.447, 0.894] = [3.129, 0.894]. ||w|| = √(9.79+0.80) = √10.59 ≈ 3.254.
- v² = [0.961, 0.275]. μ₂ ≈ [0.961, 0.275]·[3·0.961+0.275, 2·0.275] = [0.961, 0.275]·[3.158, 0.550] ≈ 3.035.

**Iteration 3:**

- w = A[0.961, 0.275] = [2.883+0.275, 0.550] = [3.158, 0.550]. ||w|| ≈ √(9.973+0.303) ≈ 3.207.
- v³ = [0.985, 0.172]. μ₃ ≈ 3.003.

**Faster convergence:** Eigenvector of λ₁=3 is [1, 0] (since A is upper triangular). Initial v⁰=[1,1] has components c₁=1, c₂=1. After k steps, the second component ≈ (2/3)^k → decays as (2/3)^k ≈ 0.296ᵏ.

But eigenvalue estimate μ converges as (2/3)^(2k) (Rayleigh quotient is second-order in eigenvector error). After 3 steps: error ≈ (2/3)^6 ≈ 0.088. Observed: |3.003-3|/3 ≈ 0.001 — actually much better! Rayleigh quotient iterations compound the gain.
</details>

---

**Q2.** Why is it numerically dangerous to find eigenvalues by computing det(A - λI) = 0? Give a concrete 3×3 example.

<details>
<summary>Answer</summary>

**Three dangers:**

**1. Coefficient magnification:** For n×n matrix with entries of size M, coefficients of the characteristic polynomial can be O(Mⁿ). For n=100, M=10: coefficients up to 10^200. Catastrophic cancellation when summing these.

**2. Root sensitivity of polynomials (Wilkinson's polynomial):** The polynomial (λ-1)(λ-2)...(λ-20) = p(λ). Wilkinson showed that perturbing the coefficient of λ^19 by 2^(-23) ≈ 10^(-7) shifts eigenvalues by up to ≈ 10 (eigenvalues 16 through 23 become complex pairs!). Characteristic polynomial coefficients are exponentially sensitive to eigenvalue separation.

**3. Concrete 3×3 example:**
```
A = [[1, 0, 0],
     [0, 2, 0],
     [0, 0, 3]]
```
Eigenvalues: 1, 2, 3. Characteristic polynomial: -(λ-1)(λ-2)(λ-3) = -λ³ + 6λ² - 11λ + 6.

Now perturb: add ε = 10^(-14) to the coefficient of λ²:
Polynomial becomes -λ³ + (6 + ε)λ² - 11λ + 6.

Roots shift by approximately ε × |coefficient sensitivity|. For this polynomial the sensitivity is moderate — the eigenvalues barely move.

**Harder example:** Same polynomial but with eigenvalues 1, 2, 2.00001 (nearly repeated). Small perturbation in any coefficient creates complex conjugate eigenvalues — the two nearly-equal real roots merge and split into the complex plane. Characteristic polynomial can't tell you they're nearly-real eigenvalues; it just gives complex numbers.

**Correct approach:** Use QR iteration. It works directly on the matrix without computing the characteristic polynomial. Backward stable: computes exact eigenvalues of A + E where ||E|| ≤ n·ε_mach·||A||.
</details>

---

**Q3.** Prove that if A is symmetric, all eigenvalues are real.

<details>
<summary>Answer</summary>

Let Av = λv, v ≠ 0, v ∈ ℂⁿ. Take the conjugate transpose of both sides:

(Av)* = (λv)*
v*A* = λ̄v*

Since A is real symmetric: A* = Aᵀ = A. So:
```
v*A = λ̄v*
```

Now multiply the original equation Av = λv on the left by v*:
```
v*Av = λ·v*v = λ||v||²
```

Multiply the conjugate equation v*A = λ̄v* on the right by v:
```
v*Av = λ̄·v*v = λ̄||v||²
```

Both expressions equal v*Av, so:
```
λ||v||² = λ̄||v||²
```

Since v ≠ 0: ||v||² > 0. Dividing: λ = λ̄.

A number equals its complex conjugate if and only if it is real. Therefore λ ∈ ℝ. □

**Consequence:** We can sort eigenvalues as λ₁ ≤ λ₂ ≤ ... ≤ λₙ ∈ ℝ. And eigenvectors for distinct eigenvalues are orthogonal (shown in the text). So symmetric matrices have a complete orthogonal eigenbasis: A = VΛVᵀ where V is orthogonal and Λ = diag(λ₁,...,λₙ). This is the spectral theorem.
</details>

---

**Q4.** PageRank computes the dominant eigenvector of a web link matrix. Why might naive power iteration fail, and what fix does Google use?

<details>
<summary>Answer</summary>

**Web link matrix M:** Column j encodes links from page j. Mᵢⱼ = 1/(out-degree(j)) if j links to i. The dominant eigenvector gives the stationary distribution of a random walk on the web.

**Problems with naive power iteration:**

**1. Dangling nodes:** Pages with no outgoing links. Column j is all zeros. The probability "leaks out" — the random surfer gets stuck. Mathematically: M is not column-stochastic, no stationary distribution exists.

**2. Disconnected graph:** If the web is split into two unconnected components, there are multiple dominant eigenvectors (one per component). Power iteration converges to whichever component the starting vector emphasizes.

**3. Spider traps:** A cycle of pages with no links out. All probability drains into the cycle, inflating those pages' ranks unfairly. A closed set of pages that never releases probability.

**Google's fix: Damping factor (teleportation)**

Replace M with the Google matrix:
```
G = d·M + (1-d)·(1/n)·𝟏𝟏ᵀ
```
where d ≈ 0.85 (damping factor), n = number of pages, 𝟏 = all-ones vector.

**Interpretation:** With probability d, follow a link. With probability (1-d) = 0.15, teleport to a uniformly random page.

**Properties of G:**
- G is column-stochastic (columns sum to 1) even for dangling nodes.
- G is irreducible (positive probability to reach any page from any page via teleportation) → unique stationary distribution.
- G is aperiodic (self-loops implicit in teleportation) → power iteration converges.

**Convergence rate:** Largest eigenvalue = 1 (stationary distribution). Second eigenvalue ≤ d = 0.85. Convergence rate per iteration: ≤ d = 0.85. Need ~50-100 iterations for 6 digits of accuracy.

**Scale:** n ≈ 10^10 pages. Vector has 10^10 entries. G itself is never stored! Only the sparse link matrix M is stored. Matrix-vector product Gv = d·Mv + (1-d)·(sum of v)/n·𝟏 — only requires a sparse Mv plus a scalar update. Memory: O(nnz(M)) ≈ O(10^10 × average_links ≈ 10^11 entries).
</details>

---

**Q5.** The QR algorithm factorizes Aᵏ = QₖRₖ and updates Aᵏ⁺¹ = RₖQₖ. Show that Aᵏ⁺¹ is similar to Aᵏ.

<details>
<summary>Answer</summary>

Given: Aᵏ = QₖRₖ (QR factorization: Qₖ orthogonal, Rₖ upper triangular).

Compute Aᵏ⁺¹ = RₖQₖ.

**Claim:** Aᵏ⁺¹ = Qₖᵀ Aᵏ Qₖ.

**Proof:**
From Aᵏ = QₖRₖ: Rₖ = Qₖᵀ Aᵏ (since Qₖᵀ Qₖ = I).

Substitute:
```
Aᵏ⁺¹ = RₖQₖ = (Qₖᵀ Aᵏ)Qₖ = Qₖᵀ Aᵏ Qₖ
```

This is an **orthogonal similarity transformation**: Aᵏ⁺¹ = Qₖᵀ Aᵏ Qₖ with Qₖ orthogonal.

**Consequence:** Aᵏ and Aᵏ⁺¹ have the same eigenvalues (similar matrices share spectra). More: all Aᵏ in the QR sequence are similar to A⁰ = A.

**Combined:** A^(k+1) = (Q₀Q₁...Qₖ)ᵀ A (Q₀Q₁...Qₖ). Defining Qˆ = Q₀Q₁...Qₖ (product of orthogonal = orthogonal), we have A^(k+1) = QˆᵀAQˆ.

As k→∞: Aᵏ → upper triangular T (Schur form). The diagonal entries of T are the eigenvalues of A. They appear in order of decreasing |λᵢ| (analogous to power iteration deflating one eigenvalue at a time from the bottom right).

**Key insight:** The QR iteration is performing orthogonal similarity transformations that "squeeze" the matrix toward its Schur form. No information is lost (exact similarity at each step), but the structure becomes progressively more triangular.
</details>

---

## Chapter Summary

| Algorithm | Finds | Cost per iter | Total cost | When to use |
|-----------|-------|---------------|------------|-------------|
| Power iteration | 1 dominant λ | O(n²) | O(n² × iters) | Dominant eigenpair only |
| Inverse iteration | 1 eigenvalue near σ | O(n²) (LU stored) | O(n³) + O(n²×iters) | One interior eigenpair |
| Rayleigh quotient iter | 1 eigenvalue | O(n²) | O(n³) startup + fast | Near-known eigenpair (cubic conv) |
| QR algorithm | All λ | O(n²) after Hessenberg | O(n³) | All eigenvalues, small-medium n |
| Lanczos/Arnoldi | k extreme λ | O(nnz) per step | O(nnz × m) | Sparse, large n, few eigenvalues |
| SVD | Singular values | — | O(mn min(m,n)) | Least squares, low-rank approx |

**Dominant insights:**
- Never compute characteristic polynomial
- Rayleigh quotient converges faster (quadratic → cubic) than eigenvector
- Symmetric = real eigenvalues + orthogonal eigenvectors (spectral theorem)
- Sparse large problems → Krylov subspace (Lanczos/ARPACK)
- SVD = eigenvalues of AᵀA, computed without squaring A

---

*Previous: [10 — ODEs: Boundary Value Problems](10_ODE_Boundary_Value.md)*
*Next: [12 — FFT and Applications](12_FFT_Applications.md)*
