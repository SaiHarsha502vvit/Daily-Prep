# Chapter 08 — Orthogonality & Gram-Schmidt

> [< Previous: 07 Matrix Inverse, Rank & The Full Picture](07_Inverse_Rank_Full_Picture.md) | [Course Index](README.md) | [Next → 09 Projections & Least Squares](09_Projections_Least_Squares.md)

---

## The Problem With Arbitrary Bases

In Chapter 02, we learned any basis works for expressing vectors. But "works" doesn't mean "works nicely." Suppose your basis is {b₁, b₂, b₃} and you want to express a vector v = c₁b₁ + c₂b₂ + c₃b₃. Finding c₁, c₂, c₃ requires solving a 3×3 linear system — inversion cost.

**Orthogonal bases eliminate this cost.** When the basis vectors are at right angles, the coefficients are just dot products. No system solving. No inversion. Just projections.

This is why GPS receivers, MRI machines, JPEG compression, and machine learning all operate in orthogonal coordinate systems. Orthogonality is the computational superpower of linear algebra.

---

## Dot Products and Angles: Quick Review

For vectors u, v ∈ ℝⁿ:

**u · v = u₁v₁ + u₂v₂ + ... + uₙvₙ = ||u|| · ||v|| · cos θ**

Where θ is the angle between u and v.

**Key cases:**
- u · v = 0 ↔ cos θ = 0 ↔ θ = 90° → **orthogonal**
- u · v > 0 → acute angle (vectors point "same direction")
- u · v < 0 → obtuse angle (vectors point "opposite directions")

The dot product is the fundamental tool. The entire chapter builds on it.

---

## Orthogonal Sets

A set {v₁, v₂, ..., vₖ} is **orthogonal** if vᵢ · vⱼ = 0 for every i ≠ j. (Every pair is perpendicular.)

It's **orthonormal** (ONB) if also each **||vᵢ|| = 1**. Normalizing an orthogonal set: just divide each vector by its norm.

### Why Orthogonal Sets Are Automatically Independent

**Theorem:** Any orthogonal set of non-zero vectors is linearly independent.

**Proof:** Suppose c₁v₁ + c₂v₂ + ... + cₖvₖ = 0. Take the dot product of both sides with vⱼ:

```
(c₁v₁ + ... + cₖvₖ) · vⱼ = 0 · vⱼ = 0

c₁(v₁·vⱼ) + c₂(v₂·vⱼ) + ... + cₖ(vₖ·vⱼ) = 0

Since vᵢ·vⱼ = 0 for i≠j, the only non-zero term is j:

cⱼ(vⱼ·vⱼ) = 0
cⱼ ||vⱼ||² = 0

Since vⱼ ≠ 0, we have ||vⱼ||² > 0, so cⱼ = 0.
This holds for every j. All coefficients are zero. ✓
```

Consequence: n orthonormal vectors in ℝⁿ automatically form a basis — no need to check.

---

## Coordinates in an Orthonormal Basis: The Easy Formula

Given an orthonormal basis {q₁, q₂, ..., qₙ} for ℝⁿ, any vector v can be written:

**v = (v·q₁)q₁ + (v·q₂)q₂ + ... + (v·qₙ)qₙ**

The coordinate of v along qᵢ is simply the dot product v·qᵢ.

**Why:** Take the dot product of both sides with qⱼ:

```
v · qⱼ = (v·q₁)(q₁·qⱼ) + ... + (v·qₙ)(qₙ·qⱼ)
       = (v·qⱼ)(1) + Σᵢ≠ⱼ (v·qᵢ)(0)    [orthonormality]
       = v·qⱼ  ✓
```

### Numerical Example

```
Orthonormal basis (the 45° rotated standard basis):
  q₁ = (1/√2)(1, 1) = (1/√2, 1/√2)
  q₂ = (1/√2)(1,-1) = (1/√2,-1/√2)

Vector: v = (4, 2)

Coordinates:
  v·q₁ = 4/√2 + 2/√2 = 6/√2 = 3√2
  v·q₂ = 4/√2 - 2/√2 = 2/√2 = √2

Verify: 3√2·q₁ + √2·q₂
      = 3√2·(1/√2, 1/√2) + √2·(1/√2, -1/√2)
      = (3, 3) + (1, -1)
      = (4, 2) ✓
```

In the standard basis, finding coordinates required inverting A. In an ONB, coordinates are free — just dot products.

---

## Orthogonal Matrices

A square matrix Q is **orthogonal** if its columns form an orthonormal set, equivalently:

**QᵀQ = I  (equivalently Q⁻¹ = Qᵀ)**

For orthogonal Q, the transpose IS the inverse. This makes orthogonal matrices computationally ideal — no matrix inversion needed.

### Properties of Orthogonal Matrices

**Length preservation:** ||Qv||² = (Qv)ᵀ(Qv) = vᵀQᵀQv = vᵀIv = ||v||². ✓

**Angle preservation:** (Qu)·(Qv) = uᵀQᵀQv = uᵀv = u·v. ✓

**Determinant:** det(Q)² = det(QᵀQ) = det(I) = 1, so det(Q) = ±1.
- det = +1: rotation (preserves orientation)
- det = -1: reflection (flips orientation)

### Examples

```
2D Rotation by θ:
R(θ) = | cos θ  -sin θ |    Rᵀ = | cos θ   sin θ |
       | sin θ   cos θ |          |-sin θ   cos θ |

R(θ)ᵀ = R(-θ) — the inverse of rotating by θ is rotating by -θ. ✓

Reflection across x-axis:
F = | 1   0 |    det(F) = -1    (orientation-reversing)
    | 0  -1 |

Check: FᵀF = | 1  0 |ᵀ| 1  0 | = | 1  0 || 1  0 | = | 1  0 | = I ✓
             | 0 -1 | | 0 -1 |   | 0 -1 || 0 -1 |   | 0  1 |
```

**QQ rows:** Note that Q orthogonal means QᵀQ = I (COLUMNS orthonormal). This also implies QQᵀ = I (ROWS orthonormal). For square matrices: columns orthonormal ↔ rows orthonormal. Not true for non-square!

---

## The Gram-Schmidt Algorithm

**Problem:** You have linearly independent vectors {v₁, v₂, ..., vₖ} that are NOT orthogonal. You want an orthonormal basis with the same span.

**Idea:** Build the orthonormal basis one vector at a time. At each step, subtract off the projection onto all previously built vectors.

```
Step 1:
  u₁ = v₁
  q₁ = u₁ / ||u₁||

Step 2:
  u₂ = v₂ - (v₂·q₁)q₁          ← subtract projection onto q₁
  q₂ = u₂ / ||u₂||

Step 3:
  u₃ = v₃ - (v₃·q₁)q₁ - (v₃·q₂)q₂    ← subtract projections onto q₁ and q₂
  q₃ = u₃ / ||u₃||

Step k:
  uₖ = vₖ - Σⱼ₌₁ᵏ⁻¹ (vₖ·qⱼ)qⱼ
  qₖ = uₖ / ||uₖ||
```

**Why it works:** uₖ is perpendicular to each previous qⱼ because:
```
uₖ · qⱼ = (vₖ - Σᵢ(vₖ·qᵢ)qᵢ) · qⱼ
         = vₖ·qⱼ - (vₖ·qⱼ)(qⱼ·qⱼ)   [others vanish: qᵢ·qⱼ = 0 for i≠j]
         = vₖ·qⱼ - vₖ·qⱼ
         = 0 ✓
```

And the span is preserved: at each step, we only subtract things already in span{q₁,...,qₖ₋₁} = span{v₁,...,vₖ₋₁}, so span{q₁,...,qₖ} = span{v₁,...,vₖ}.

---

## Gram-Schmidt: Full Worked Example

Apply Gram-Schmidt to {v₁ = (1,1,0), v₂ = (1,0,1), v₃ = (0,1,1)}:

```
STEP 1:
  u₁ = v₁ = (1, 1, 0)
  ||u₁|| = √(1+1+0) = √2
  q₁ = (1/√2, 1/√2, 0)

STEP 2:
  Projection of v₂ onto q₁:
  v₂·q₁ = 1·(1/√2) + 0·(1/√2) + 1·0 = 1/√2

  u₂ = v₂ - (v₂·q₁)q₁
     = (1, 0, 1) - (1/√2)·(1/√2, 1/√2, 0)
     = (1, 0, 1) - (1/2, 1/2, 0)
     = (1/2, -1/2, 1)

  ||u₂|| = √(1/4 + 1/4 + 1) = √(6/4) = √6/2

  q₂ = (1/2, -1/2, 1) / (√6/2)
     = (1, -1, 2) · (1/√6)
     = (1/√6, -1/√6, 2/√6)

STEP 3:
  Projection of v₃ onto q₁:
  v₃·q₁ = 0·(1/√2) + 1·(1/√2) + 1·0 = 1/√2

  Projection of v₃ onto q₂:
  v₃·q₂ = 0·(1/√6) + 1·(-1/√6) + 1·(2/√6) = -1/√6 + 2/√6 = 1/√6

  u₃ = v₃ - (v₃·q₁)q₁ - (v₃·q₂)q₂
     = (0,1,1) - (1/√2)·(1/√2, 1/√2, 0) - (1/√6)·(1/√6, -1/√6, 2/√6)
     = (0,1,1) - (1/2, 1/2, 0) - (1/6, -1/6, 2/6)

  Compute component by component:
    x: 0 - 1/2 - 1/6 = -3/6 - 1/6 = -4/6 = -2/3
    y: 1 - 1/2 + 1/6 = 6/6 - 3/6 + 1/6 = 4/6 = 2/3
    z: 1 - 0 - 2/6 = 6/6 - 2/6 = 4/6 = 2/3

  u₃ = (-2/3, 2/3, 2/3)

  ||u₃|| = √(4/9 + 4/9 + 4/9) = √(12/9) = 2√3/3 = 2/√3

  q₃ = (-2/3, 2/3, 2/3) / (2/√3)
     = (-2/3, 2/3, 2/3) · (√3/2)
     = (-1/√3, 1/√3, 1/√3)

VERIFY ORTHONORMALITY:
  q₁·q₂ = (1/√2)(1/√6) + (1/√2)(-1/√6) + 0 = 1/√12 - 1/√12 = 0 ✓
  q₁·q₃ = (1/√2)(-1/√3) + (1/√2)(1/√3) + 0 = -1/√6 + 1/√6 = 0 ✓
  q₂·q₃ = (1/√6)(-1/√3) + (-1/√6)(1/√3) + (2/√6)(1/√3)
         = -1/√18 - 1/√18 + 2/√18 = 0 ✓

  ||q₁||² = 1/2 + 1/2 + 0 = 1 ✓
  ||q₂||² = 1/6 + 1/6 + 4/6 = 6/6 = 1 ✓
  ||q₃||² = 1/3 + 1/3 + 1/3 = 1 ✓
```

---

## QR Decomposition

Gram-Schmidt produces a factorization **A = QR** where:
- Q is m×n with orthonormal columns (q₁, ..., qₙ)
- R is n×n upper triangular

**How R is built:**

At step k, we wrote: vₖ = uₖ + Σⱼ<ₖ (vₖ·qⱼ)qⱼ = ||uₖ||·qₖ + Σⱼ<ₖ (vₖ·qⱼ)qⱼ

Reorganized in matrix form, the column vₖ of A is expressed as a linear combination of q₁,...,qₖ. The coefficients form the k-th column of R:

```
R[j][k] = vₖ·qⱼ   for j < k     (off-diagonal: projection coefficients)
R[k][k] = ||uₖ||               (diagonal: length of the orthogonalized vector)
R[j][k] = 0        for j > k     (zero below diagonal — "upper triangular")
```

For our example above:
```
A = [v₁ | v₂ | v₃]   →   A = QR

Q = [q₁ | q₂ | q₃]

R:
  R[1][1] = ||u₁|| = √2
  R[1][2] = v₂·q₁ = 1/√2       R[2][2] = ||u₂|| = √6/2
  R[1][3] = v₃·q₁ = 1/√2       R[2][3] = v₃·q₂ = 1/√6       R[3][3] = ||u₃|| = 2/√3

R = | √2    1/√2   1/√2  |
    |  0    √6/2   1/√6  |
    |  0     0     2/√3  |
```

---

## Why QR Matters: Applications

**Solving least squares (Chapter 09):**
Instead of forming the numerically fragile AᵀA, factor A = QR:
- AᵀA x̂ = Aᵀb becomes RᵀQᵀQR x̂ = RᵀQᵀb → Rᵀ(R x̂ - Qᵀb) = 0
- Since R is invertible: **R x̂ = Qᵀb** (solve by back-substitution, no matrix inversion!)

**The QR eigenvalue algorithm:**
Repeat: A ← RQ (reverse the factors after each QR factorization). This sequence converges to upper triangular form — eigenvalues on the diagonal. This is how LAPACK computes eigenvalues in practice.

**Signal processing:** The discrete cosine transform (DCT) used in JPEG compression is a change to an orthonormal basis. The orthonormality makes both forward and inverse transforms equally cheap (transpose = inverse).

---

## Numerical Stability: Modified Gram-Schmidt

The classical Gram-Schmidt algorithm (described above) is mathematically correct but numerically unstable. Small floating-point errors in each projection accumulate. After k steps, q₁,...,qₖ may have lost orthogonality.

**Modified Gram-Schmidt:** Instead of subtracting all projections at once, update the vector v incrementally:

```
Classical GS (unstable):
  uₖ = vₖ - (vₖ·q₁)q₁ - (vₖ·q₂)q₂ - ... - (vₖ·qₖ₋₁)qₖ₋₁

Modified GS (more stable):
  u⁽¹⁾ = vₖ - (vₖ·q₁)q₁
  u⁽²⁾ = u⁽¹⁾ - (u⁽¹⁾·q₂)q₂
  u⁽³⁾ = u⁽²⁾ - (u⁽²⁾·q₃)q₃
  ...
  uₖ = u⁽ᵏ⁻¹⁾
```

At step j, you project out the q₂ component from the ALREADY-UPDATED vector, not from the original vₖ. This propagates corrections through each step.

**Householder Reflections:** For the most stable QR, NumPy and LAPACK use Householder reflections — orthogonal matrices H = I - 2ûûᵀ that zero out sub-diagonal entries one column at a time. O(n³) like Gram-Schmidt, but numerically superior.

```python
import numpy as np

v1 = np.array([1, 1, 0], dtype=float)
v2 = np.array([1, 0, 1], dtype=float)
v3 = np.array([0, 1, 1], dtype=float)

A = np.column_stack([v1, v2, v3])
Q, R = np.linalg.qr(A)     # uses Householder reflections internally

print(Q)    # columns = orthonormal basis
print(R)    # upper triangular coefficients
print(Q.T @ Q)   # ≈ identity
```

Note: NumPy's Q may have sign flips on columns compared to Gram-Schmidt — signs are arbitrary in QR (R adjusts accordingly). Verify Q@R == A, not the individual signs.

---

## Section Challenge

> ### Build an Orthonormal Basis and Use It
>
> You are building a recommendation system and need to work in an orthogonal feature space. You're given three raw feature vectors (customer preference profiles):
>
> ```
> v₁ = (1, 1, 1)    (likes action, comedy, romance equally)
> v₂ = (2, 1, 0)    (prefers action and comedy)
> v₃ = (0, 1, 2)    (prefers comedy and romance)
> ```
>
> **Q1:** Are {v₁, v₂, v₃} linearly independent? Justify without computing a determinant.
>
> **Q2:** Apply Gram-Schmidt to produce orthonormal basis {q₁, q₂, q₃}.
>
> **Q3:** Verify ||q₁|| = ||q₂|| = ||q₃|| = 1 and q₁·q₂ = q₁·q₃ = q₂·q₃ = 0.
>
> **Q4:** A new customer has preference profile p = (3, 2, 1). Express p in the orthonormal basis (find the coordinates p·q₁, p·q₂, p·q₃). Verify by reconstruction.
>
> **Q5 (Stretch):** The first orthonormal direction q₁ represents the "average preference." The subsequent directions represent "deviation patterns." What does a customer with coordinate 0 on q₂ and q₃ (but non-zero on q₁) tell you about their preferences?

<details>
<summary>Full answers</summary>

```
Q1: Linear independence check

Suppose c₁v₁ + c₂v₂ + c₃v₃ = 0:
  c₁(1)+c₂(2)+c₃(0) = 0  → c₁ + 2c₂ = 0       ... (i)
  c₁(1)+c₂(1)+c₃(1) = 0  → c₁ + c₂ + c₃ = 0   ... (ii)
  c₁(1)+c₂(0)+c₃(2) = 0  → c₁ + 2c₃ = 0       ... (iii)

From (i): c₁ = -2c₂
From (iii): c₁ = -2c₃, so c₂ = c₃
Substitute into (ii): -2c₂ + c₂ + c₂ = 0 → 0 = 0 ← Wait, this is always satisfied!

Let's check: if c₂ = c₃ = 1, c₁ = -2: check (i): -2+2 = 0 ✓, (ii): -2+1+1 = 0 ✓, (iii): -2+2 = 0 ✓

The system has non-trivial solutions! v₁, v₂, v₃ are LINEARLY DEPENDENT.
Relation: -2v₁ + v₂ + v₃ = 0, i.e., v₂ + v₃ = 2v₁.
Verify: (2,1,0) + (0,1,2) = (2,2,2) = 2(1,1,1) = 2v₁. ✓

────────────────────────────────────────────────────────
NOTE: Since {v₁, v₂, v₃} are LINEARLY DEPENDENT, they do NOT span ℝ³.
The three vectors live in a 2D subspace (rank = 2).
Gram-Schmidt on step 3 will produce u₃ = 0 — no third direction to orthogonalize!

Let's keep going and see this happen:

Q2: Gram-Schmidt (demonstrating the dependent case)

STEP 1:
  u₁ = v₁ = (1,1,1)
  ||u₁|| = √3
  q₁ = (1/√3, 1/√3, 1/√3)

STEP 2:
  v₂·q₁ = (2+1+0)/√3 = 3/√3 = √3
  u₂ = v₂ - √3·q₁ = (2,1,0) - √3·(1/√3, 1/√3, 1/√3)
              = (2,1,0) - (1,1,1) = (1, 0, -1)
  ||u₂|| = √(1+0+1) = √2
  q₂ = (1/√2, 0, -1/√2)

STEP 3:
  v₃·q₁ = (0+1+2)/√3 = 3/√3 = √3
  v₃·q₂ = 0·(1/√2) + 1·0 + 2·(-1/√2) = -2/√2 = -√2

  u₃ = v₃ - √3·q₁ - (-√2)·q₂
     = (0,1,2) - (1,1,1) + √2·(1/√2, 0, -1/√2)
     = (0,1,2) - (1,1,1) + (1, 0, -1)
     = (0-1+1, 1-1+0, 2-1-1)
     = (0, 0, 0)

u₃ = 0! This confirms linear dependence. v₃ lies entirely in span{v₁, v₂}.

So Gram-Schmidt yields only TWO orthonormal vectors: {q₁, q₂}.
They form a basis for the 2D subspace spanned by all three original vectors.

────────────────────────────────────────────────────────

To get a FULL orthonormal basis for ℝ³, we need a third vector not in span{v₁,v₂}.

Choose any q₃ ⊥ q₁ and q₃ ⊥ q₂. One such vector: q₁ × q₂ (cross product):

q₁ × q₂ = det | ê₁    ê₂    ê₃   |
               | 1/√3  1/√3  1/√3 |
               | 1/√2   0   -1/√2 |

ê₁: (1/√3)(-1/√2) - (1/√3)(0) = -1/√6
ê₂: -[(1/√3)(-1/√2) - (1/√3)(1/√2)] = -[-1/√6 - 1/√6] = 2/√6
ê₃: (1/√3)(0) - (1/√3)(1/√2) = -1/√6

q₁ × q₂ = (-1/√6, 2/√6, -1/√6)
||q₁ × q₂|| = √(1/6 + 4/6 + 1/6) = √(6/6) = 1

So q₃ = (-1/√6, 2/√6, -1/√6) is the needed third orthonormal direction.

────────────────────────────────────────────────────────

Q3: Verify orthonormality of q₁, q₂

||q₁||² = 1/3 + 1/3 + 1/3 = 1 ✓
||q₂||² = 1/2 + 0 + 1/2 = 1 ✓
q₁·q₂ = (1/√3)(1/√2) + (1/√3)(0) + (1/√3)(-1/√2)
       = 1/√6 - 1/√6 = 0 ✓

────────────────────────────────────────────────────────

Q4: Express p = (3,2,1) in the basis {q₁, q₂, q₃}

p·q₁ = (3+2+1)/√3 = 6/√3 = 2√3
p·q₂ = 3/√2 + 0 - 1/√2 = 2/√2 = √2
p·q₃ = 3·(-1/√6) + 2·(2/√6) + 1·(-1/√6)
      = (-3 + 4 - 1)/√6 = 0/√6 = 0

p = 2√3·q₁ + √2·q₂ + 0·q₃

Verify:
  2√3·(1/√3, 1/√3, 1/√3) + √2·(1/√2, 0, -1/√2) + 0
= (2, 2, 2) + (1, 0, -1) + 0
= (3, 2, 1) ✓

p has zero coordinate along q₃ — meaning p = (3,2,1) lies entirely
in span{v₁, v₂}, the same 2D subspace as our original vectors!

────────────────────────────────────────────────────────

Q5: Interpretation of zero q₂ and q₃ coordinates

q₁ = (1/√3)(1,1,1) represents "liking all genres equally" — the average direction.
q₂ = (1/√2)(1,0,-1) represents "prefers action over romance."
q₃ = (-1/√6, 2/√6, -1/√6) represents "prefers comedy over action and romance."

A customer with coordinates (α, 0, 0) in this basis:
  → Zero q₂-coordinate: no preference between action and romance
  → Zero q₃-coordinate: no preference for comedy over others
  → α·q₁ = α·(1/√3, 1/√3, 1/√3) → equal preference across all genres

This is a "genre-neutral" viewer who rates all genres the same. Their α
value (the q₁ coordinate) tells you HOW MUCH they like everything, but
their pattern is "everything equally."
```

</details>

---

## Common Mistakes

**Mistake 1: Forgetting to subtract projections from the CURRENT vector (not the original)**
- Classical GS is fine on paper. But in code, Modified GS is always safer — subtract one projection at a time.

**Mistake 2: Treating QᵀQ = I as QQᵀ = I**
- For non-square Q (tall m×n, m > n): QᵀQ = Iₙ, but QQᵀ ≠ Iₘ. QQᵀ is the PROJECTION matrix onto C(Q).
- For square Q: both hold simultaneously.

**Mistake 3: Confusing orthogonal matrix with an orthogonal set**
- An "orthogonal matrix" has ORTHONORMAL columns (not just orthogonal). The terminology is confusing — "orthogonal matrix" really means "orthonormal matrix."

**Mistake 4: Assuming Gram-Schmidt always produces n vectors**
- If the input vectors are linearly dependent, Gram-Schmidt breaks down (uₖ = 0 for some k). This is a feature: it detects dependence. Add a new independent vector to extend the basis.

---

## Connections

- **Chapter 02 — Bases:** Orthonormal bases are the "nicest" bases — coordinates are free (dot products only).
- **Chapter 04 — Transformations:** Orthogonal matrices Q are the rigid transformations. QᵀQ = I means Q⁻¹ = Qᵀ — inverse is free.
- **Chapter 09 — Least Squares:** QR decomposition makes least squares numerically stable by avoiding AᵀA.
- **Chapter 12 — Spectral Theorem:** Symmetric matrices always have ORTHONORMAL eigenvectors — Gram-Schmidt is not needed, but the same orthogonality structure arises.
- **Chapter 13 — SVD:** A = UΣVᵀ, where U and V are orthogonal matrices. Gram-Schmidt is the conceptual ancestor of SVD.

---

> [< Previous: 07 Matrix Inverse, Rank & The Full Picture](07_Inverse_Rank_Full_Picture.md) | [Course Index](README.md) | [Next → 09 Projections & Least Squares](09_Projections_Least_Squares.md)
