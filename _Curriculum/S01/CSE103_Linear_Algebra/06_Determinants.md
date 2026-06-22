# Chapter 06 — Determinants

> [< Previous: 05 Linear Systems & Gaussian Elimination](05_Linear_Systems_Gaussian_Elimination.md) | [Course Index](README.md) | [Next → 07 Matrix Inverse, Rank, and the Full Picture](07_Inverse_Rank_Full_Picture.md)

---

## The Geometric Question: How Much Does a Transformation Stretch Space?

Take the 2×2 matrix:

```
A = | 3  1 |
    | 0  2 |
```

This is a linear transformation. If you apply A to the unit square (the region with corners at (0,0), (1,0), (1,1), (0,1)), the corners move to:

```
(0,0) → (0,0)       ← origin stays fixed
(1,0) → (3,0)       ← A·ê₁ = (3,0)
(0,1) → (1,2)       ← A·ê₂ = (1,2)
(1,1) → (4,2)       ← A·(1,1) = (3+1, 0+2) = (4,2)
```

The unit square (area = 1) becomes a parallelogram. Its area is:

```
|  3  1 |
|  0  2 |  = 3·2 - 1·0 = 6
```

The area MULTIPLIED by 6. That number — 6 — is the **determinant** of A.

The determinant tells you: **when you apply this transformation, areas scale by |det(A)|**.

---

## Derivation: The 2×2 Formula

**Setup:** Take a 2×2 matrix A with columns c₁ = (a, c) and c₂ = (b, d):

```
A = | a  b |
    | c  d |
```

Apply A to the unit square. The transformed shape is a parallelogram with sides c₁ and c₂.

**Area of parallelogram with adjacent sides c₁ and c₂:**

Using the cross product magnitude in 2D (the 3D formula restricted to z=0):

Area = |c₁ × c₂| = |a·d - b·c|

This gives the **determinant:**

**det(A) = ad - bc**

(with sign! det > 0 means orientation preserved; det < 0 means orientation flipped.)

```
det | 3  1 | = 3·2 - 1·0 = 6    → square expands by factor 6
    | 0  2 |

det | 1  0 | = 1·(-1) - 0·0 = -1 → reflection (area preserved, orientation flipped)
    | 0 -1 |

det | 1  2 | = 1·4 - 2·2 = 0     → matrix collapses 2D to 1D (area → 0)
    | 2  4 |
```

---

## The 3×3 Formula: Cofactor Expansion

For a 3×3 matrix A, the determinant is computed by **cofactor expansion along any row or column**:

**Expanding along row 1:**

```
det | a  b  c |  =  a · det | e  f |  -  b · det | d  f |  +  c · det | d  e |
    | d  e  f |              | h  i |              | g  i |              | g  h |
    | g  h  i |

                =  a(ei - fh)  -  b(di - fg)  +  c(dh - eg)
```

The signs alternate: +, -, +, ... based on the position (i+j parity of the entry's row+column index).

**Example:**

```
det | 2  -1  3 |
    | 1   4  0 |
    | 0   2  1 |

= 2 · det | 4  0 |  -  (-1) · det | 1  0 |  +  3 · det | 1  4 |
          | 2  1 |                 | 0  1 |              | 0  2 |

= 2(4·1 - 0·2) + 1(1·1 - 0·0) + 3(1·2 - 4·0)

= 2(4) + 1(1) + 3(2)

= 8 + 1 + 6 = 15
```

---

## Geometric Meaning

| det(A) | Geometric interpretation |
|--------|--------------------------|
| > 0 | Transformation PRESERVES orientation, scales area by det |
| < 0 | Transformation REVERSES orientation (like a reflection), scales area by |det| |
| = 0 | Transformation COLLAPSES space to lower dimension (no inverse!) |
| = 1 | Area-preserving AND orientation-preserving (like rotation) |
| = -1 | Area-preserving, orientation-reversing (pure reflection) |

**Volume in 3D:** For 3×3 matrices, |det(A)| is the volume-scaling factor. A unit cube becomes a parallelepiped with volume |det(A)|.

---

## Properties of Determinants

These properties give shortcuts and deeper insight. They can all be proven from the geometric definition:

**P1: det(Iₙ) = 1** — identity doesn't change area.

**P2: Row swap negates det** — det(A with rows i, j swapped) = -det(A).

**P3: Scalar row multiply scales det** — det(A with row i scaled by c) = c · det(A).

**P4: Linearity in each row** — adding a scalar multiple of one row to another doesn't change the determinant.

This last property is key: **row operations used in Gaussian elimination DON'T change det** (except row swaps, which negate it). So:

det(A) = (-1)^(number of swaps) × product of diagonal of U

Where U is the upper triangular matrix from A's LU decomposition.

**P5: det(AB) = det(A) · det(B)**

"The area scaling of applying B then A = area scaling of B times area scaling of A."

Consequence: det(A⁻¹) = 1/det(A).

**P6: det(Aᵀ) = det(A)** — transpose doesn't change the determinant.

**P7: A is invertible iff det(A) ≠ 0**

---

## Why det = 0 ↔ Not Invertible

If det(A) = 0, the transformation A collapses the space to a lower dimension (area → 0). Multiple inputs map to the same output. You've lost information → no way to recover the original input → no inverse.

If det(A) ≠ 0, the transformation is a bijection on ℝⁿ → an inverse exists.

**Fast invertibility check for 2×2:**

```
A = | a  b | is invertible iff ad - bc ≠ 0
    | c  d |

If invertible:
A⁻¹ = 1/(ad-bc) · |  d  -b |
                   | -c   a |
```

---

## Computing det via Row Reduction

For large matrices, cofactor expansion is O(n!) — catastrophically slow. Instead:

1. Row-reduce A to upper triangular form U using Gaussian elimination.
2. Count row swaps (each negates det).
3. det(A) = (-1)^swaps × product of diagonal entries of U.

```python
import numpy as np

A = np.array([[2, -1, 3], [1, 4, 0], [0, 2, 1]], dtype=float)

# NumPy uses LU decomposition internally: O(n²·log n) via LAPACK
print(np.linalg.det(A))    # 15.0

# Manual via LU:
from scipy.linalg import lu
P, L, U = lu(A)
# det(A) = det(P)·det(L)·det(U)
# det(L) = 1 (unit lower triangular)
# det(P) = (-1)^(number of swaps) = ±1
# det(U) = product of diagonal
det_U = np.prod(np.diag(U))
det_P = np.linalg.det(P)   # ±1
print(det_P * det_U)        # 15.0 ✓
```

---

## Section Challenge

> ### Image Processing: Does the Transformation Invert?
>
> An image processing pipeline applies a sequence of three 2D transformations:
>
> ```
> T₁ (shear):    | 1   0.5 |
>                | 0   1   |
>
> T₂ (rotation): | 0  -1 |
>                | 1   0  |
>
> T₃ (scale):    | 2   0 |
>                | 0   0 |
> ```
>
> **Question 1:** Compute det(T₁), det(T₂), det(T₃). Interpret each geometrically.
>
> **Question 2:** The pipeline applies T₁, then T₂, then T₃. What is the total transformation matrix M = T₃ · T₂ · T₁? What is det(M)?
>
> **Question 3:** Is the combined pipeline M invertible? If not, what happens to images that pass through it?
>
> **Question 4:** A senior engineer says "we can replace T₃ with T₃' = | 2  0 | | 0  3 | to make the pipeline invertible." Verify this claim using determinants.

<details>
<summary>Full derivation + answers</summary>

```
QUESTION 1: Individual determinants

det(T₁) = 1·1 - 0.5·0 = 1
  Interpretation: shear preserves area. Any parallelogram is transformed to
  another parallelogram of the same area — shearing just "leans" the shape.

det(T₂) = 0·0 - (-1)·1 = 1
  Interpretation: rotation preserves area (and orientation).
  90° rotation maps a unit square to a unit square — area = 1.

det(T₃) = 2·0 - 0·0 = 0
  Interpretation: T₃ collapses 2D space to 1D (the x-axis).
  The y-component is destroyed. All area becomes 0. NOT invertible.

──────────────────────────────────────────────────────────

QUESTION 2: Total transformation M = T₃ · T₂ · T₁

First: T₂ · T₁:
  T₂ = | 0  -1 |    T₁ = | 1  0.5 |
       | 1   0 |          | 0   1  |

  (T₂·T₁)[row1] = (0·1 + (-1)·0, 0·0.5 + (-1)·1) = (0, -1)
  (T₂·T₁)[row2] = (1·1 + 0·0, 1·0.5 + 0·1) = (1, 0.5)
  
  T₂·T₁ = | 0  -1  |
           | 1   0.5|

Then: T₃ · (T₂·T₁):
  T₃ = | 2  0 |
       | 0  0 |

  (T₃·(T₂T₁))[row1] = (2·0 + 0·1, 2·(-1) + 0·0.5) = (0, -2)
  (T₃·(T₂T₁))[row2] = (0·0 + 0·1, 0·(-1) + 0·0.5) = (0,  0)

  M = | 0  -2 |
      | 0   0 |

det(M) = 0·0 - (-2)·0 = 0

ALTERNATIVE: det(M) = det(T₃) · det(T₂) · det(T₁) = 0 · 1 · 1 = 0 ✓

──────────────────────────────────────────────────────────

QUESTION 3: Is M invertible?

NO. det(M) = 0 → not invertible.

What happens to images:
  M maps every 2D point (x, y) to (−2y, 0).
  ALL output points lie on the x-axis (y-coordinate becomes 0).
  Two input images that are reflections of each other across the x-axis
  would produce IDENTICAL output — the transformation destroys vertical
  information.
  
  If you apply M to a photo: every horizontal strip (same y) collapses to
  a single output x-value, and the entire image collapses to a 1D line.
  (In practice: the image would appear as a single horizontal line.)

──────────────────────────────────────────────────────────

QUESTION 4: Replace T₃ with T₃' = | 2  0 |
                                    | 0  3 |

det(T₃') = 2·3 - 0·0 = 6 ≠ 0 → T₃' IS invertible ✓

New pipeline M' = T₃' · T₂ · T₁:
  det(M') = det(T₃') · det(T₂) · det(T₁) = 6 · 1 · 1 = 6 ≠ 0 ✓

M' IS invertible.

Geometric effect: scale x by 2 and y by 3 instead of destroying the y-dimension.
No information is lost → an inverse exists and can recover the original image.

Senior engineer's fix is VERIFIED. The key fix: replace the 0 in position (2,2)
of T₃ with a non-zero value. Any T₃ with both diagonal entries non-zero would work.

det(M') = 6 means the combined pipeline scales all areas by a factor of 6.
The inverse pipeline scales everything back by 1/6.
```

</details>

---

## Common Mistakes

**Mistake 1: Thinking det(A + B) = det(A) + det(B)**
- WRONG. det is NOT linear overall — only in each row separately.
- The correct multiplicative property is det(AB) = det(A)·det(B).

**Mistake 2: Computing cofactor expansion incorrectly (wrong signs)**
- Signs follow the checkerboard pattern: (+)(−)(+)(−)... row by row.
- Position (i, j) has sign (-1)^(i+j).
- A common error: using + for all terms or mixing up the minor subscripts.

**Mistake 3: Confusing "det = 0" with "det is undefined"**
- det = 0 is perfectly defined — it means the matrix is not invertible.
- "Not invertible" does NOT mean the matrix doesn't exist. It means no inverse matrix exists.

**Mistake 4: Using cofactor expansion for large matrices in code**
- Cofactor expansion is O(n!). For n=20: 20! ≈ 2.4 × 10¹⁸ operations. Never use it.
- Always use LU decomposition (O(n³)) for numerical computation.

---

## Connections

- **Chapter 04 — Transformations:** det(A) = area/volume scaling factor of the transformation A. If det = 0, the transformation is not injective (rank-deficient).
- **Chapter 05 — Gaussian Elimination:** det(A) = product of U's diagonal × (−1)^swaps. Row operations simplify det computation.
- **Chapter 07 — Inverse:** A⁻¹ exists iff det(A) ≠ 0. The 2×2 inverse formula directly uses the determinant.
- **Chapter 10-11 — Eigenvalues:** The characteristic polynomial det(A − λI) = 0 is the equation whose roots are eigenvalues. The determinant is the core tool for finding them.

---

> [< Previous: 05 Linear Systems & Gaussian Elimination](05_Linear_Systems_Gaussian_Elimination.md) | [Course Index](README.md) | [Next → 07 Matrix Inverse, Rank, and the Full Picture](07_Inverse_Rank_Full_Picture.md)
