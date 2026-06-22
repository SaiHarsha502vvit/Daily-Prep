# Chapter 10 — Eigenvalues & Eigenvectors

> [< Previous: 09 Projections & Least Squares](09_Projections_Least_Squares.md) | [Course Index](README.md) | [Next → 11 Diagonalization](11_Diagonalization.md)

---

## The Special Directions of a Transformation

Every linear transformation A scrambles vectors: direction changes, magnitude changes. But some special vectors survive unchanged in direction — A just stretches or shrinks them.

**Analogy: A river current.** Most leaves thrown in are swept sideways and forward in complex paths. But a leaf dropped directly in the main current's direction travels downstream without twisting — it's "in the flow." That direction is an eigenvector; the speed ratio is the eigenvalue.

**Analogy: Stock portfolio.** Imagine a matrix A that models how stock prices evolve over a week. Most portfolio vectors (combinations of stocks) rotate and distort. But certain "risk factor" combinations (like "tech vs. bonds") evolve predictably — the portfolio shifts proportionally. These are eigenvectors. Their growth rates are eigenvalues.

**Definition:** For an n×n matrix A, a non-zero vector v is an **eigenvector** with **eigenvalue** λ if:

**Av = λv**

The matrix A, when applied to v, only scales v by λ. It does NOT change direction (unless λ < 0, which flips direction).

---

## Why Eigenvalues Are Everywhere

| Field | Matrix | Eigenvectors | Eigenvalues |
|-------|--------|-------------|-------------|
| Google PageRank | Link transition matrix | Page importance ranking | Dominant = 1 |
| Quantum mechanics | Hamiltonian operator | Energy states | Energy levels |
| Structural engineering | Stiffness matrix | Vibration modes | Natural frequencies² |
| PCA / data science | Covariance matrix | Principal directions | Variance along each direction |
| Differential equations | System matrix A (y' = Ay) | Decoupled mode directions | Growth/decay rates |
| Image processing | Hessian matrix | Edge directions | Edge strengths |
| Network analysis | Graph Laplacian L | Cluster boundaries | Graph connectivity |

The eigen-structure reveals "what the transformation fundamentally does" — its natural modes, stable states, and intrinsic geometry.

---

## Finding Eigenvalues: The Characteristic Equation

Starting from Av = λv, rearrange:

```
Av = λv
Av - λv = 0
(A - λI)v = 0
```

This is a homogeneous system. For non-trivial solutions (v ≠ 0), the matrix (A - λI) must be singular:

**det(A - λI) = 0**

This is the **characteristic equation**. It's a polynomial of degree n in λ:

```
det(A - λI) = (-1)ⁿ λⁿ + (trace A) · (-λ)ⁿ⁻¹ + ... + det(A)
```

The n roots λ₁, ..., λₙ are the eigenvalues (in ℂ, counting multiplicity).

---

## Finding Eigenvalues and Eigenvectors: Full 2×2 Example

```
A = | 4   1 |
    | 2   3 |

STEP 1: Characteristic equation
det(A - λI) = det | 4-λ    1  |
                  |  2   3-λ  |

= (4-λ)(3-λ) - (1)(2)
= 12 - 4λ - 3λ + λ² - 2
= λ² - 7λ + 10
= (λ - 2)(λ - 5)

Eigenvalues: λ₁ = 2, λ₂ = 5

STEP 2: Eigenvector for λ₁ = 2
Solve (A - 2I)v = 0:
| 2   1 || v₁ |   | 0 |
| 2   1 || v₂ | = | 0 |

(Both rows give 2v₁ + v₂ = 0, so v₂ = -2v₁.)
Eigenvector: v₁ = (1, -2)

Check: Av₁ = | 4(1) + 1(-2) | = | 2  | = 2(1, -2) ✓
             | 2(1) + 3(-2) |   |-4  |

STEP 3: Eigenvector for λ₂ = 5
Solve (A - 5I)v = 0:
|-1   1 || v₁ |   | 0 |
| 2  -2 || v₂ | = | 0 |

(Both rows give -v₁ + v₂ = 0, so v₂ = v₁.)
Eigenvector: v₂ = (1, 1)

Check: Av₂ = | 4(1) + 1(1) | = | 5 | = 5(1, 1) ✓
             | 2(1) + 3(1) |   | 5 |
```

**Verification using trace and determinant:**
- Sum of eigenvalues = trace(A): 2 + 5 = 7 = 4 + 3 ✓
- Product of eigenvalues = det(A): 2 × 5 = 10 = 4·3 - 1·2 = 10 ✓

These two checks are fast sanity tests.

---

## 3×3 Example: Upper Triangular Matrix

For triangular matrices (upper or lower), the eigenvalues are the **diagonal entries**. This is one of the most useful shortcuts.

```
A = | 3   2   1 |
    | 0   5   4 |
    | 0   0   2 |

det(A - λI) = det | 3-λ   2    1  |
                  |  0   5-λ   4  |
                  |  0    0   2-λ |

Expanding along column 1 (most zeros there):
= (3-λ) · det | 5-λ   4  | - 0 + 0
              |  0   2-λ |

= (3-λ)(5-λ)(2-λ)

Eigenvalues: λ₁ = 3, λ₂ = 5, λ₃ = 2 (the diagonal entries!)
```

**For a 3×3 non-triangular matrix**, the characteristic polynomial is cubic: λ³ + (trace)λ² + (...)λ + det = 0. In practice, cubic formulas are unwieldy — numerical methods (like the QR algorithm) are used for n ≥ 3.

---

## Geometric Meaning of Each Eigenvalue

| λ | Geometric effect on eigenvector direction |
|---|------------------------------------------|
| λ > 1 | Stretched (extended away from origin) |
| λ = 1 | Fixed point — the transformation leaves this direction unchanged |
| 0 < λ < 1 | Compressed (shrunk toward origin) |
| λ = 0 | Collapsed to zero — this direction is in the null space |
| λ < 0 | Flipped AND scaled (direction reverses) |
| λ = -1 | Pure reflection in this direction |
| λ complex | Rotation component (see below) |

**λ = 0 special case:** If A has eigenvalue 0, then Av = 0 for some v ≠ 0. That means v ∈ N(A). So A is singular (det(A) = 0). Eigenvalue 0 ↔ not invertible ↔ singular.

---

## Eigenspaces

For a given eigenvalue λ, the set of all eigenvectors (plus zero) is the **eigenspace**:

**Eλ = N(A - λI) = {v : Av = λv}**

Eigenspaces are subspaces. Their dimension is the **geometric multiplicity** of λ — how many independent eigenvectors correspond to λ.

The **algebraic multiplicity** is the multiplicity of λ as a root of det(A - λI) = 0.

**Fundamental inequality:** geometric multiplicity ≤ algebraic multiplicity.

When they're equal for every eigenvalue, A is **diagonalizable** (Chapter 11). When strictly less, it's **defective** — a case requiring more advanced treatment (Jordan form).

---

## Rotation Matrices: Complex Eigenvalues

For the 2D rotation matrix R(θ), no real vector stays in the same direction after rotation — every direction rotates. So R(θ) has no real eigenvalues:

```
R(θ) = | cos θ  -sin θ |
       | sin θ   cos θ |

det(R - λI) = (cos θ - λ)² + sin²θ
            = λ² - 2(cos θ)λ + (cos²θ + sin²θ)
            = λ² - 2(cos θ)λ + 1

Discriminant: 4cos²θ - 4 = -4sin²θ

For θ ≠ 0, π: discriminant < 0 → complex roots.
λ = cos θ ± i·sin θ = e^(±iθ)    (Euler's formula)

For θ = 90°: λ = ±i.
```

**What do complex eigenvalues mean geometrically?** The real matrix rotates — and the complex eigenvalues encode that rotation as e^(iθ). The magnitude |λ| = 1 means it's a pure rotation (no scaling). In a rotation-scaling matrix (not orthogonal), |λ| ≠ 1 reflects the scaling factor.

---

## Symmetric Matrices: Real Eigenvalues Always

**Theorem (Spectral Theorem, preview):** If A is symmetric (A = Aᵀ), then:
1. All eigenvalues are REAL.
2. Eigenvectors for different eigenvalues are ORTHOGONAL.

**Proof of (1):** Suppose Av = λv with complex v. Take the conjugate: Av̄ = λ̄v̄. Then:

```
λ (v̄ᵀv) = v̄ᵀ(Av) = (Aᵀv̄)ᵀv = (Av̄)ᵀv = λ̄(v̄ᵀv)
(λ - λ̄)(v̄ᵀv) = 0

Since v ≠ 0, v̄ᵀv = ||v||² > 0, so λ = λ̄, meaning λ is real. ✓
```

**Proof of (2):** Let Av₁ = λ₁v₁ and Av₂ = λ₂v₂ with λ₁ ≠ λ₂:

```
λ₁(v₁·v₂) = (Av₁)·v₂ = v₁ᵀAᵀv₂ = v₁ᵀAv₂ = λ₂(v₁·v₂)
(λ₁ - λ₂)(v₁·v₂) = 0
Since λ₁ ≠ λ₂: v₁·v₂ = 0. ✓
```

This is why symmetric matrices are the "nicest" — covariance matrices in statistics, Hessians in optimization, Laplacians in graph theory are all symmetric, and their eigen-decompositions are guaranteed to be real and orthogonal.

---

## Trace and Determinant: Fast Eigenvalue Checks

Two invariant relationships for any n×n matrix:

**trace(A) = λ₁ + λ₂ + ... + λₙ**

**det(A) = λ₁ · λ₂ · ... · λₙ**

These don't uniquely determine the eigenvalues for n ≥ 3, but provide fast sanity checks after computing eigenvalues.

For 2×2 specifically, once you know the trace and det, you can immediately write the characteristic polynomial:

```
λ² - (trace)λ + det = 0

A = | 5  2 |    trace = 8, det = 5·3 - 2·2 = 11
    | 2  3 |

λ² - 8λ + 11 = 0
λ = (8 ± √(64-44)) / 2 = (8 ± √20) / 2 = 4 ± √5

λ₁ = 4 + √5 ≈ 6.236
λ₂ = 4 - √5 ≈ 1.764

Check: sum = 8 = trace ✓,  product = 16 - 5 = 11 = det ✓
```

---

## Numerical Eigenvalue Computation: Power Iteration

For large matrices (Google's link matrix has millions of rows), exact computation of det(A - λI) = 0 is impossible. The **power iteration** finds the dominant eigenvalue:

**Algorithm:**
```
Start with any random vector v₀.
Repeat:
  w = Av
  v = w / ||w||    (normalize to avoid overflow)

As k → ∞, v → dominant eigenvector (λ of largest |λ|).
```

**Why it works:** Expand v₀ in the eigenbasis: v₀ = c₁v₁ + c₂v₂ + ... + cₙvₙ. Then:

```
Aᵏv₀ = c₁λ₁ᵏv₁ + c₂λ₂ᵏv₂ + ... + cₙλₙᵏvₙ
      = λ₁ᵏ[c₁v₁ + c₂(λ₂/λ₁)ᵏv₂ + ... ]
```

If |λ₁| > |λ₂| ≥ ..., then (λᵢ/λ₁)ᵏ → 0 for i > 1. Only the λ₁ term survives.

**PageRank:** Google's matrix T has dominant eigenvalue λ₁ = 1 (it's a stochastic matrix). Power iteration gives the stationary distribution — the ranking of web pages. With ~10⁹ pages, direct eigenvalue computation is impossible; power iteration converges in O(100) steps.

---

## Section Challenge

> ### Eigenstructure Analysis
>
> **Q1:** Find eigenvalues and eigenvectors of:
> ```
> A = | 3   4 |
>     | 1   3 |
> ```
> Verify using trace and determinant.
>
> **Q2:** Without computing: what are the eigenvalues of the triangular matrix:
> ```
> B = | 7   3   9 |
>     | 0  -2   5 |
>     | 0   0   4 |
> ```
>
> **Q3:** A covariance matrix C = | 5  2 | models stock return variances.
>                                 | 2  2 |
> (a) Find eigenvalues. (b) Are eigenvectors orthogonal? (c) Eigenvalue meaning?
>
> **Q4 (Stretch):** Show that if Av = λv, then A²v = λ²v. What does this say about eigenvalues of A²?

<details>
<summary>Full answers</summary>

```
Q1: Eigenvalues of A = |3  4|
                       |1  3|

det(A - λI) = (3-λ)(3-λ) - 4·1 = (3-λ)² - 4

= λ² - 6λ + 9 - 4 = λ² - 6λ + 5 = (λ-1)(λ-5)

Eigenvalues: λ₁ = 1, λ₂ = 5

Check: trace = 3+3 = 6 = λ₁+λ₂ = 1+5 ✓
       det = 9-4 = 5 = λ₁·λ₂ = 1·5 ✓

Eigenvector for λ₁ = 1: (A - I)v = 0
| 2  4 |v = 0 → 2v₁ + 4v₂ = 0 → v₁ = -2v₂
| 1  2 |
Eigenvector: v₁ = (-2, 1)  [or any scalar multiple]

Check: A(-2,1)ᵀ = | 3(-2)+4(1) | = | -2 | = 1·(-2,1)ᵀ ✓
                  | 1(-2)+3(1) |   |  1 |

Eigenvector for λ₂ = 5: (A - 5I)v = 0
|-2  4 |v = 0 → -2v₁ + 4v₂ = 0 → v₁ = 2v₂
| 1 -2 |
Eigenvector: v₂ = (2, 1)

Check: A(2,1)ᵀ = | 6+4 | = | 10 | = 5·(2,1)ᵀ ✓
                 | 2+3 |   |  5 |

NOTE: A is NOT symmetric, so eigenvectors need NOT be orthogonal.
(-2,1)·(2,1) = -4 + 1 = -3 ≠ 0. Confirmed: not orthogonal.

──────────────────────────────────────────────────────

Q2: Triangular matrix eigenvalues

B is upper triangular → eigenvalues = diagonal entries.
Eigenvalues: λ₁ = 7, λ₂ = -2, λ₃ = 4.

det(B - λI) = (7-λ)(-2-λ)(4-λ) (product of diagonal terms - λ)

No computation needed beyond reading the diagonal!

──────────────────────────────────────────────────────

Q3: Covariance matrix C = |5  2|
                          |2  2|

(a) Eigenvalues

C is symmetric (C = Cᵀ) → real eigenvalues ✓

trace = 7, det = 10 - 4 = 6

λ² - 7λ + 6 = 0 → (λ-1)(λ-6) = 0
Eigenvalues: λ₁ = 1, λ₂ = 6

(b) Orthogonality of eigenvectors

YES — C is symmetric → eigenvectors for different eigenvalues are orthogonal.

For λ₁ = 1: (C - I)v = 0
| 4  2 |v = 0 → 4v₁ + 2v₂ = 0 → v₂ = -2v₁
| 2  1 |
v₁ = (1, -2)

For λ₂ = 6: (C - 6I)v = 0
|-1  2 |v = 0 → -v₁ + 2v₂ = 0 → v₁ = 2v₂
| 2 -4 |
v₂ = (2, 1)

Check: (1,-2)·(2,1) = 2 - 2 = 0 ✓  (orthogonal as guaranteed)

(c) Meaning for stock returns

The covariance matrix C models how two stock returns co-vary.
  C[1][1] = 5: variance of stock 1 (high)
  C[2][2] = 2: variance of stock 2 (lower)
  C[1][2] = 2: positive covariance (stocks move together)

Eigenvalue λ₂ = 6 with v₂ = (2,1)/√5:
  → This direction (hold mostly stock 1) has HIGHEST variance = 6.
  → It's the "risky" direction of the portfolio.

Eigenvalue λ₁ = 1 with v₁ = (1,-2)/√5:
  → This direction (buy stock 1, short stock 2) has LOWEST variance = 1.
  → It's the "hedged" direction — long one, short the other.

The eigenvectors define the "principal risk factors" — this IS PCA (Chapter 12)!

──────────────────────────────────────────────────────

Q4: Eigenvalues of A²

Proof: if Av = λv, then:
A²v = A(Av) = A(λv) = λ(Av) = λ(λv) = λ²v

So v is also an eigenvector of A², with eigenvalue λ².

By induction: Aᵏv = λᵏv.

Implication: eigenvalues of Aᵏ are the k-th powers of eigenvalues of A.
  - If |λ| > 1: iterating Aᵏ causes that mode to BLOW UP.
  - If |λ| < 1: iterating Aᵏ causes that mode to DECAY TO ZERO.
  - If |λ| = 1: iterating Aᵏ keeps that mode BOUNDED.

This is the foundation of:
  - Stability analysis (does a dynamical system y_{k+1} = Ay_k converge?)
  - Power iteration convergence (does (λ₂/λ₁)ᵏ → 0?)
  - Markov chains (does Aᵏ converge to a stationary distribution?)
```

</details>

---

## Common Mistakes

**Mistake 1: Thinking the eigenvector is unique**
- Eigenvectors are only defined up to scalar multiples. If v is an eigenvector, so is 2v, -v, 0.5v. The eigenspace (often 1D) is unique, not the specific vector.

**Mistake 2: Forgetting λ = 0 is a valid eigenvalue**
- λ = 0 means A has a non-trivial null space (det = 0, not invertible). Many algorithms fail at λ = 0 specifically — watch for singular matrices.

**Mistake 3: Computing eigenvalues of non-square matrices**
- Eigenvalues only make sense for SQUARE matrices (Av = λv requires A: ℝⁿ→ℝⁿ). For non-square A, use singular values (Chapter 13 — SVD) instead.

**Mistake 4: Confusing algebraic and geometric multiplicity**
- The characteristic polynomial (λ - 2)² = 0 has λ = 2 with algebraic multiplicity 2. But the geometric multiplicity (number of independent eigenvectors) could be 1 (defective) or 2 (diagonalizable). They're equal for symmetric matrices, not in general.

**Mistake 5: np.linalg.eig vs np.linalg.eigh**
- `np.linalg.eig`: general (non-symmetric) matrices. Returns complex eigenvalues in general. Less numerically stable.
- `np.linalg.eigh`: symmetric/Hermitian matrices. Guarantees real eigenvalues. Faster and more accurate. Use this for covariance matrices, graph Laplacians, Hessians.

```python
import numpy as np

C = np.array([[5, 2], [2, 2]], dtype=float)

# For symmetric matrices, ALWAYS use eigh
eigenvalues, eigenvectors = np.linalg.eigh(C)
print(eigenvalues)     # [1., 6.]  (real, sorted ascending)
print(eigenvectors)    # columns = eigenvectors, guaranteed orthonormal
```

---

## Connections

- **Chapter 06 — Determinants:** Characteristic equation = det(A - λI) = 0. det(A) = product of eigenvalues. A is invertible iff λ = 0 is NOT an eigenvalue.
- **Chapter 07 — Inverse:** The 11th condition in the IMT: "0 is not an eigenvalue" ↔ A is invertible.
- **Chapter 09 — Least Squares:** Ridge regression adds λI to make AᵀA + λI invertible by pushing all eigenvalues above λ > 0.
- **Chapter 11 — Diagonalization:** If A has n independent eigenvectors, A = PDP⁻¹. Eigenvalues fill the diagonal of D.
- **Chapter 12 — Spectral Theorem:** Symmetric A has A = QΛQᵀ with ORTHONORMAL Q. The basis of PCA.
- **Chapter 13 — SVD:** Singular values of A = square roots of eigenvalues of AᵀA. Generalize eigenvalues to non-square matrices.

---

> [< Previous: 09 Projections & Least Squares](09_Projections_Least_Squares.md) | [Course Index](README.md) | [Next → 11 Diagonalization](11_Diagonalization.md)
