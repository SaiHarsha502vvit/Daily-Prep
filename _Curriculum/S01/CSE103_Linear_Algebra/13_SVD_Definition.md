# Chapter 13 — Singular Value Decomposition (SVD): Definition

> [< Previous: 12 Spectral Theorem & PCA](12_Spectral_Theorem_PCA.md) | [Course Index](README.md) | [Next → 14 SVD Applications](14_SVD_Applications.md)

---

## The Limitation of Eigendecomposition

We've studied A = PDP⁻¹ and the special case A = QΛQᵀ for symmetric matrices. Both require:
1. A must be **square** (n×n).
2. A must have enough independent eigenvectors.

But many critical matrices are non-square:
- A dataset X of 1000 samples × 50 features: 1000×50 matrix
- An image as a matrix: 1920×1080 pixels
- A term-document matrix: 50000 words × 10000 documents

And many square matrices are non-symmetric or defective.

**Singular Value Decomposition (SVD)** is the universal decomposition. It works for ANY matrix — rectangular or square, symmetric or not, full rank or rank-deficient. It is the single most powerful matrix factorization in applied linear algebra.

---

## Building Intuition: What Does Any Matrix Do?

Every matrix A : ℝⁿ → ℝᵐ is a linear transformation. What does ANY linear transformation look like geometrically?

**Claim:** Every linear transformation is (in the right orthonormal coordinate systems):
1. A rotation/reflection in the input space
2. A scaling along each axis
3. A rotation/reflection in the output space

In other words: **A = U Σ Vᵀ** where V rotates the input, Σ scales, and U rotates the output.

This is the SVD. Let's derive it.

---

## Deriving the SVD

**Step 1:** AᵀA is a symmetric positive semidefinite n×n matrix. By the Spectral Theorem, it has orthonormal eigenvectors v₁, ..., vₙ with non-negative real eigenvalues λ₁ ≥ λ₂ ≥ ... ≥ λₙ ≥ 0.

**Step 2:** Define **singular values** σᵢ = √λᵢ ≥ 0 (square roots of eigenvalues of AᵀA).

**Step 3:** For each vᵢ with σᵢ > 0, define **uᵢ = Avᵢ/σᵢ**. Then:
- uᵢ · uⱼ = (Avᵢ/σᵢ) · (Avⱼ/σⱼ) = vᵢᵀAᵀAvⱼ/(σᵢσⱼ) = vᵢᵀ(λⱼvⱼ)/(σᵢσⱼ) = λⱼ(vᵢ·vⱼ)/(σᵢσⱼ)
  Since {v₁,...,vₙ} are orthonormal: vᵢ·vⱼ = δᵢⱼ. So uᵢ·uⱼ = δᵢⱼ. ✓

The vectors {u₁, ..., u_r} (r = rank(A)) are an orthonormal set in ℝᵐ. Extend to a full ONB of ℝᵐ by adding u_{r+1},...,u_m.

**Step 4:** Verify A = UΣVᵀ.

For each vⱼ: A vⱼ = σⱼ uⱼ (by definition of uⱼ). So AV = UΣ. Since V is orthogonal: **A = UΣVᵀ**.

---

## The SVD Theorem

**Theorem:** For any m×n real matrix A with rank r, there exist:
- **U**: m×m orthogonal matrix (left singular vectors = columns)
- **Σ**: m×n diagonal matrix with σ₁ ≥ σ₂ ≥ ... ≥ σᵣ > 0 (then zeros)
- **V**: n×n orthogonal matrix (right singular vectors = columns)

Such that: **A = UΣVᵀ**

**Dimensions:**

```
A    =   U    ·   Σ   ·  Vᵀ
(m×n)  (m×m)  (m×n)  (n×n)
```

The singular values σ₁ ≥ σ₂ ≥ ... ≥ σₙ ≥ 0 are unique (though U and V may not be).

---

## Connection to Eigenvalues

**Right singular vectors V:** Eigenvectors of AᵀA. The i-th column of V is the eigenvector for λᵢ(AᵀA) = σᵢ².

**Left singular vectors U:** Eigenvectors of AAᵀ. The i-th column of U is the eigenvector for λᵢ(AAᵀ) = σᵢ².

**Critical fact:** AᵀA and AAᵀ have the same non-zero eigenvalues (= σᵢ²).

```
AᵀA has n eigenvalues: σ₁² ≥ σ₂² ≥ ... ≥ σᵣ² > 0 = 0 = ... = 0
AAᵀ has m eigenvalues: σ₁² ≥ σ₂² ≥ ... ≥ σᵣ² > 0 = 0 = ... = 0
```

The non-zero eigenvalues match! The zero eigenvalues differ in count (n-r vs m-r).

For SYMMETRIC A (m=n, A=Aᵀ): AᵀA = A². Singular values = |eigenvalues|. Left and right singular vectors are the same (up to sign) as eigenvectors. SVD reduces to the spectral theorem.

---

## Full Worked Example: 2×3 Matrix

```
A = | 1  1  0 |
    | 0  1  1 |

(m=2, n=3, find SVD)

STEP 1: Compute AᵀA (3×3)

Aᵀ = | 1  0 |    AᵀA = Aᵀ·A = | 1  0 | · | 1  1  0 |
     | 1  1 |                   | 1  1 |   | 0  1  1 |
     | 0  1 |                   | 0  1 |

= | 1·1+0·0  1·1+0·1  1·0+0·1 |   | 1  1  0 |
  | 1·1+1·0  1·1+1·1  1·0+1·1 | = | 1  2  1 |
  | 0·1+1·0  0·1+1·1  0·0+1·1 |   | 0  1  1 |

STEP 2: Find eigenvalues of AᵀA

det(AᵀA - λI) = det | 1-λ   1    0 |
                     |  1   2-λ   1 |
                     |  0    1   1-λ |

Expand along row 1:
= (1-λ)·det | 2-λ  1 | - 1·det | 1   1  |
            |  1  1-λ|         | 0  1-λ |

= (1-λ)[(2-λ)(1-λ)-1] - 1[1·(1-λ)-0]
= (1-λ)[2-2λ-λ+λ²-1] - (1-λ)
= (1-λ)[1-3λ+λ²] - (1-λ)
= (1-λ)[1-3λ+λ²-1]
= (1-λ)[λ²-3λ]
= (1-λ)·λ(λ-3)
= λ(1-λ)(λ-3)

Eigenvalues: λ₁ = 3, λ₂ = 1, λ₃ = 0

Singular values: σ₁ = √3, σ₂ = 1, σ₃ = 0

STEP 3: Right singular vectors V (eigenvectors of AᵀA)

For λ₁ = 3: (AᵀA - 3I)v = 0
| -2   1   0 |   R1 → -2v₁+v₂=0 → v₂=2v₁
|  1  -1   1 |   R2 → v₁-v₂+v₃=0 → v₃=v₂-v₁=v₁
|  0   1  -2 |   R3 → v₂-2v₃=0 → 2v₁-2v₁=0 ✓
v₁ = (1, 2, 1)/√6   (normalized: 1+4+1=6)

For λ₂ = 1: (AᵀA - I)v = 0
|  0   1   0 |   → v₂=0
|  1   1   1 |   → v₁+v₃=0 → v₃=-v₁
|  0   1   0 |
v₂ = (1, 0, -1)/√2   (normalized)

For λ₃ = 0: (AᵀA)v = 0
|  1  1   0 |   RREF: |1  0  1| → v₁=-v₃
|  1  2   1 |         |0  1 -1| → v₂=v₃
|  0  1   1 |         |0  0  0|
v₃ = (-1, 1, -1)/√3... wait: (-1)²+1²+(-1)²=3. Hmm, let's use (1,-1,1)/√3.
Actually need v₁+v₃=0, v₂=v₃: if v₃=1: v₁=-1, v₂=1
v₃ = (-1, 1, 1)/√3... let me verify: [1 1 0]·(-1,1,1) = -1+1+0=0 ✓
[1 2 1]·(-1,1,1) = -1+2+1=2 ≠ 0. Recompute.

RREF of AᵀA:
| 1  1  0 |    R2←R2-R1:  | 1  1  0 |    R2←R2/1: | 1  1  0 |
| 1  2  1 |               | 0  1  1 |              | 0  1  1 |
| 0  1  1 |    R3←R3-R2:  | 0  0  0 |              | 0  0  0 |

R1←R1-R2: | 1  0  -1 |
           | 0  1   1 |
           | 0  0   0 |

Free variable v₃: v₁ = v₃, v₂ = -v₃. Set v₃=1: v = (1,-1,1).
||v|| = √3. v₃ = (1,-1,1)/√3.

STEP 4: Left singular vectors U

u₁ = Av₁/σ₁ = | 1  1  0 | (1/√6)(1,2,1)ᵀ / √3
               | 0  1  1 |

A·(1,2,1)ᵀ = (1+2+0, 0+2+1) = (3, 3)
u₁ = (3,3)ᵀ / (√6 · √3) = (3,3) / (3√2) = (1,1)/√2

u₂ = Av₂/σ₂ = | 1  1  0 | (1/√2)(1,0,-1)ᵀ / 1
               | 0  1  1 |
A·(1,0,-1)ᵀ = (1+0+0, 0+0-1) = (1,-1)
u₂ = (1,-1)/√2 / (√2 · 1) = (1,-1)/√2 ... wait
Actually u₂ = A·v₂/σ₂ = (1/√2)A(1,0,-1)ᵀ / 1 = (1,-1)/√2
||u₂|| = ||((1,-1)/√2)|| = √(1/2+1/2) = 1 ✓

STEP 5: Assemble SVD

V = | 1/√6   1/√2   1/√3 |    Σ = | √3  0   0 |    U = | 1/√2   1/√2 |
    | 2/√6    0    -1/√3 |        |  0  1   0 |        | 1/√2  -1/√2 |
    | 1/√6  -1/√2  1/√3  |

(Σ is 2×3 for a 2×3 matrix A)

Verify: A = UΣVᵀ (spot check one entry):
UΣ = | 1/√2   1/√2 | · | √3  0  0 | = | √3/√2  1/√2  0 |
     | 1/√2  -1/√2 |   |  0  1  0 |   | √3/√2 -1/√2  0 |

(UΣ)Vᵀ row 1, col 1: (√3/√2)(1/√6) + (1/√2)(1/√2) + 0
= √3/√12 + 1/2 = 1/2 + 1/2 = 1 ✓ (matches A[1][1] = 1)
```

---

## The Four Fundamental Subspaces via SVD

SVD directly reveals the four fundamental subspaces of A (Chapter 03):

| Subspace | Basis |
|----------|-------|
| **C(A)** (column space) | First r columns of U: {u₁, ..., uᵣ} |
| **N(Aᵀ)** (left null space) | Last m-r columns of U: {u_{r+1}, ..., u_m} |
| **C(Aᵀ)** (row space) | First r columns of V: {v₁, ..., vᵣ} |
| **N(A)** (null space) | Last n-r columns of V: {v_{r+1}, ..., v_n} |

**Geometric picture:** Aᵥᵢ = σᵢuᵢ for i ≤ r — the transformation maps the i-th right singular direction to the i-th left singular direction, scaled by σᵢ. For i > r: Avᵢ = 0 (null space directions are killed).

**SVD confirms rank-nullity:** C(Aᵀ) has dimension r (first r columns of V), N(A) has dimension n-r (last n-r columns of V). Their dimensions sum to n: r + (n-r) = n. ✓

---

## Thin SVD (Compact SVD)

For computation, the **thin SVD** (also called economy or compact SVD) is often used:

If rank(A) = r, only the first r singular vectors matter:

```
A = U_r · Σ_r · V_rᵀ

U_r: m×r (first r columns of U)
Σ_r: r×r (top-left block of Σ with σ₁,...,σᵣ)
V_r: n×r (first r columns of V)
```

The rest (columns r+1 to min(m,n)) are in the null spaces and contribute nothing to A.

```python
import numpy as np

A = np.array([[1, 1, 0], [0, 1, 1]], dtype=float)

# Full SVD
U, s, Vt = np.linalg.svd(A, full_matrices=True)
print("U:", U.shape)    # (2, 2)
print("s:", s)          # [√3, 1] (non-zero singulars; svd drops the 0)
print("Vt:", Vt.shape)  # (3, 3)

# Thin SVD (more efficient for tall matrices)
U_thin, s_thin, Vt_thin = np.linalg.svd(A, full_matrices=False)
print("U_thin:", U_thin.shape)    # (2, 2) — same here since m=2
print("s_thin:", s_thin)          # [√3, 1]
print("Vt_thin:", Vt_thin.shape)  # (2, 3) — only 2 rows, not 3

# Reconstruct
A_reconstructed = U_thin @ np.diag(s_thin) @ Vt_thin
print(np.allclose(A, A_reconstructed))  # True
```

Note: `np.linalg.svd` returns Vᵀ, not V. Also, it only returns non-zero singular values in `s`.

---

## Section Challenge

> ### SVD of a Simple Matrix
>
> Given:
> ```
> A = | 4  0 |
>     | 3  0 |
>     | 0  2 |
> ```
>
> **Q1:** Compute AᵀA and find its eigenvalues.
>
> **Q2:** Find the singular values and right singular vectors (columns of V).
>
> **Q3:** Find the left singular vectors (columns of U) for each non-zero singular value.
>
> **Q4:** Identify the four fundamental subspaces using the SVD columns.
>
> **Q5 (Stretch):** Reconstruct A from U, Σ, Vᵀ to verify.

<details>
<summary>Full answers</summary>

```
Q1: AᵀA

Aᵀ = | 4  3  0 |    AᵀA = | 4  3  0 || 4  0 |
     | 0  0  2 |           | 0  0  2 || 3  0 |
                                       | 0  2 |

AᵀA = | 4·4+3·3+0·0   4·0+3·0+0·2 | = | 25   0 |
      | 0·4+0·3+2·0   0·0+0·0+2·2 |   |  0   4 |

AᵀA = | 25  0 |   (diagonal! Lucky break.)
      |  0  4 |

Eigenvalues of AᵀA: λ₁ = 25, λ₂ = 4 (read directly from diagonal).

────────────────────────────────────────────

Q2: Singular values and right singular vectors

σ₁ = √25 = 5,   σ₂ = √4 = 2

Eigenvectors of diagonal AᵀA are just the standard basis:
v₁ = (1, 0) for λ₁ = 25
v₂ = (0, 1) for λ₂ = 4

V = | 1  0 | = I₂ (the identity! A already acts along standard axes.)
    | 0  1 |

────────────────────────────────────────────

Q3: Left singular vectors

u₁ = Av₁/σ₁ = A(1,0)ᵀ / 5 = (4,3,0)ᵀ/5

Check: ||(4,3,0)/5|| = √(16+9+0)/5 = √25/5 = 5/5 = 1 ✓

u₂ = Av₂/σ₂ = A(0,1)ᵀ / 2 = (0,0,2)ᵀ/2 = (0,0,1)

Check: ||(0,0,1)|| = 1 ✓

u₁·u₂ = (4/5)·0 + (3/5)·0 + 0·1 = 0 ✓ (orthogonal)

U has 3 rows (m=3) but only 2 columns from non-zero singular values.
Need one more column u₃ to complete U to 3×3. Pick u₃ ⊥ u₁ and u₃ ⊥ u₂.

u₁ = (4/5, 3/5, 0),  u₂ = (0, 0, 1)
u₃ = u₁ × u₂ = | ê₁    ê₂    ê₃ |
                | 4/5  3/5    0 |
                |  0    0     1 |

ê₁: (3/5)·1 - 0·0 = 3/5
ê₂: -(4/5·1 - 0·0) = -4/5
ê₃: 4/5·0 - 3/5·0 = 0

u₃ = (3/5, -4/5, 0)  [already normalized: 9/25 + 16/25 = 1 ✓]

Full U:
U = | 4/5   0   3/5 |
    | 3/5   0  -4/5 |
    |  0    1    0  |

────────────────────────────────────────────

Q4: Four fundamental subspaces

m=3, n=2, rank=2 (both singular values non-zero)

C(A) = span of first 2 columns of U = span{(4/5,3/5,0), (0,0,1)}
  = span{(4,3,0), (0,0,1)} — this IS the column space: columns of A are
    (4,3,0) and (0,0,2), which lie in this span. ✓

N(Aᵀ) = last 1 column of U = {(3/5,-4/5,0)} = span{(3,-4,0)}
  Verify: Aᵀ(3,-4,0)ᵀ = | 4  3  0 || 3 | = | 12-12 | = | 0 | ✓
                          | 0  0  2 ||-4 |   |   0   |   | 0 |
                                     | 0 |

C(Aᵀ) = row space = first 2 columns of V = {(1,0), (0,1)} = ℝ²
  (Since rank=n=2, the row space fills all of ℝ².)

N(A) = last 0 columns of V = {} = {0}
  (Since rank=n=2, the null space is trivial — A has full column rank.)

────────────────────────────────────────────

Q5: Reconstruct A

Σ = | 5  0 |    (2×2 thin version... but Σ should be m×n = 3×2)
    | 0  2 |
    | 0  0 |

A = U · Σ · Vᵀ

= | 4/5   0   3/5 | | 5  0 | | 1  0 |
  | 3/5   0  -4/5 | | 0  2 | | 0  1 |
  |  0    1    0  | | 0  0 |

UΣ = | 4/5·5 + 0 + 0   4/5·0 + 0·2 + 3/5·0 |   | 4   0 |
     | 3/5·5 + 0 + 0   3/5·0 + 0·2 - 4/5·0 | = | 3   0 |
     |  0 + 1·0 + 0     0 + 1·2 + 0        |   | 0   2 |

Wait, UΣ = U · Σ where U is 3×3 and Σ is 3×2:

UΣ = | 4/5   0   3/5 | | 5  0 |   | 4/5·5+0+0    4/5·0+0·2+3/5·0 |   | 4  0 |
     | 3/5   0  -4/5 | | 0  2 | = | 3/5·5+0+0    3/5·0+0·2-4/5·0 | = | 3  0 |
     |  0    1    0  | | 0  0 |   | 0+1·0+0      0+1·2+0          |   | 0  2 |

(UΣ)Vᵀ = | 4  0 | | 1  0 | = | 4  0 |
          | 3  0 | | 0  1 |   | 3  0 | = A ✓
          | 0  2 |             | 0  2 |
```

</details>

---

## Geometric Summary

The SVD says every linear transformation A : ℝⁿ → ℝᵐ factors as three simple operations:

```
Input (ℝⁿ) →[Vᵀ: rotate]→ Intermediate (ℝⁿ) →[Σ: scale/embed]→ Intermediate (ℝᵐ) →[U: rotate]→ Output (ℝᵐ)
```

The singular values σᵢ tell you how much stretching happens in each of the r principal directions. Small singular values = near-degenerate directions. Zero singular values = directions in the null space.

The **condition number** of A = σ₁/σᵣ (ratio of largest to smallest non-zero singular value) measures numerical sensitivity. Large condition number → ill-conditioned system → small errors in b cause large errors in x = A⁻¹b.

---

## Common Mistakes

**Mistake 1: SVD of A vs SVD of AᵀA**
- SVD of A: A = UΣVᵀ (singular values = σᵢ)
- Eigendecomposition of AᵀA: AᵀA = VΛVᵀ (eigenvalues = σᵢ²)
- DON'T use eig(A.T @ A) to get singular values numerically — use scipy.linalg.svd directly, it's more stable.

**Mistake 2: `np.linalg.svd` returns Vᵀ, not V**
- `U, s, Vt = np.linalg.svd(A)` — `Vt` is V-transpose. To get V: `V = Vt.T`.

**Mistake 3: Confusing left and right singular vectors**
- Left singular vectors (columns of U) span the OUTPUT space (ℝᵐ)
- Right singular vectors (columns of V) span the INPUT space (ℝⁿ)

**Mistake 4: SVD not unique**
- If σᵢ = σⱼ (repeated singular values), the corresponding singular vectors can be any orthonormal basis for the repeated eigenspace. The singular values themselves are unique.

---

## Connections

- **Chapter 03 — Subspaces:** SVD gives orthonormal bases for all four fundamental subspaces simultaneously.
- **Chapter 09 — Least Squares:** The pseudoinverse A⁺ = VΣ⁺Uᵀ (replacing each σᵢ with 1/σᵢ) is the most general least-squares solver.
- **Chapter 10 — Eigenvalues:** Singular values of A = square roots of eigenvalues of AᵀA.
- **Chapter 12 — Spectral Theorem:** For symmetric PSD A: SVD = spectral decomposition (U = V, Σ = Λ).
- **Chapter 14 — SVD Applications:** Low-rank approximation, image compression, PCA via SVD.

---

> [< Previous: 12 Spectral Theorem & PCA](12_Spectral_Theorem_PCA.md) | [Course Index](README.md) | [Next → 14 SVD Applications](14_SVD_Applications.md)
