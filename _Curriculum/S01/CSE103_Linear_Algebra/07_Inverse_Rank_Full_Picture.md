# Chapter 07 — Matrix Inverse, Rank & The Full Picture

> [< Previous: 06 Determinants](06_Determinants.md) | [Course Index](README.md) | [Next → 08 Orthogonality & Gram-Schmidt](08_Orthogonality_Gram_Schmidt.md)

---

## The Central Question: Can We Undo a Transformation?

You rotate a photo 90° clockwise — can you get the original back? Yes: rotate 90° counter-clockwise. You scale a vector by 3 — can you recover it? Yes: scale by 1/3. These "undo" operations are **inverses**.

But what if your transformation projects everything onto a line? All vertical information is destroyed. There's no way back — you've lost information permanently.

**The central question of this chapter:** For a given matrix A, does an inverse A⁻¹ exist? And if it does, how do we find it?

---

## Definition and What It Means

A matrix A (n×n) is **invertible** if there exists a matrix A⁻¹ such that:

**AA⁻¹ = A⁻¹A = I**

Where I is the n×n identity matrix.

**Geometric reading:** A transforms ℝⁿ → ℝⁿ. A⁻¹ is the reverse journey. Together they compose to "do nothing" — the identity transformation.

**The uniqueness:** If A has an inverse, that inverse is unique. Suppose B and C are both inverses of A. Then B = BI = B(AC) = (BA)C = IC = C. So B = C.

---

## Why Inverses Fail: The Dimensional Collapse Argument

Here is a 2×2 matrix that collapses 2D space to a line:

```
A = | 1  2 |
    | 2  4 |

Notice: row 2 = 2 × row 1. The columns are (1,2) and (2,4) — parallel.
This matrix maps ℝ² onto a 1D line (the line through (1,2)).

Ax = 0 has a non-trivial solution:
  x₁ + 2x₂ = 0
  2x₁ + 4x₂ = 0  (same equation × 2)
  → x = (-2, 1) is a solution besides x = 0.

Two inputs, (-2,1) and (0,0), both map to (0,0).
IMPOSSIBLE to recover which input produced (0,0).
NO inverse can exist.
```

The inverse fails precisely when the transformation **loses information** — maps two different inputs to the same output. This is the non-injectivity argument from Chapter 07 of CSE101's function theory, now in matrix form.

---

## When Does A⁻¹ Exist? (Five Equivalent Conditions)

For an n×n matrix A:

**A is invertible ⟺ ANY of the following (all equivalent):**

| Condition | What It Means |
|-----------|---------------|
| det(A) ≠ 0 | Volume scaling factor is non-zero (Chapter 06) |
| rank(A) = n | All n columns linearly independent (Chapter 03) |
| N(A) = {0} | Only zero maps to zero — injective transformation |
| Columns form a basis of ℝⁿ | They span ℝⁿ AND are independent |
| A is row-equivalent to Iₙ | Gaussian elimination succeeds fully |

These five say the same thing in different languages. If ONE is true, ALL are true. If ONE is false, ALL are false. This is the **Invertible Matrix Theorem** — one of the most important unifying results in linear algebra.

---

## Computing the Inverse: 2×2 Formula

For the 2×2 case:

```
A = | a  b |        1       |  d  -b |
    | c  d |  →  ——————  ×  | -c   a |
                  ad - bc
```

The derivation: multiply A by the proposed inverse and verify you get I.

**Memory trick:** swap the diagonal (a↔d), negate the off-diagonal (b and c), divide by the determinant.

```
A = | 3  1 |    det = 3·4 - 1·2 = 10
    | 2  4 |

A⁻¹ = (1/10) | 4  -1 |  =  | 0.4  -0.1 |
              |-2   3 |     |-0.2   0.3 |

Check: AA⁻¹ = | 3·0.4 + 1·(-0.2)   3·(-0.1) + 1·0.3 | = | 1  0 | ✓
              | 2·0.4 + 4·(-0.2)   2·(-0.1) + 4·0.3 |   | 0  1 |
```

---

## Computing the Inverse: Augmented Row Reduction

For n×n matrices, the systematic method is:

1. Form `[A | I]` — augment A with the identity on the right.
2. Row-reduce until the left becomes I.
3. The right side is now A⁻¹: `[I | A⁻¹]`.

**Why this works:** Each row operation multiplies both sides by an elementary matrix Eᵢ. When we reach `[I | X]`, we've shown that `(E_k · ... · E_1) · A = I`, so `A⁻¹ = E_k · ... · E_1`, which is exactly the matrix X that built up on the right.

### Full 3×3 Worked Example

```
A = | 2   1   0 |
    | 1   3   1 |
    | 0   1   2 |

Start: [A | I]
| 2   1   0 | 1  0  0 |
| 1   3   1 | 0  1  0 |
| 0   1   2 | 0  0  1 |

R1 ↔ R2  (bring a clean pivot to top):
| 1   3   1 | 0  1  0 |
| 2   1   0 | 1  0  0 |
| 0   1   2 | 0  0  1 |

R2 ← R2 - 2·R1:
| 1   3   1 |  0   1  0 |
| 0  -5  -2 |  1  -2  0 |
| 0   1   2 |  0   0  1 |

R2 ← R2 / (-5)  (make pivot = 1):
| 1   3   1 |    0     1    0 |
| 0   1  2/5| -1/5   2/5   0 |
| 0   1   2 |    0     0   1 |

R1 ← R1 - 3·R2  and  R3 ← R3 - R2:
R1: (1, 0, 1-6/5 | 3/5, -1/5, 0) = (1, 0, -1/5 | 3/5, -1/5, 0)
R3: (0, 0, 2-2/5 | 1/5, -2/5, 1) = (0, 0, 8/5 | 1/5, -2/5, 1)

| 1   0  -1/5 |  3/5  -1/5   0 |
| 0   1   2/5 | -1/5   2/5   0 |
| 0   0   8/5 |  1/5  -2/5   1 |

R3 ← R3 × (5/8):
| 1   0  -1/5 |  3/5   -1/5    0   |
| 0   1   2/5 | -1/5    2/5    0   |
| 0   0    1  |  1/8   -1/4   5/8  |

R1 ← R1 + (1/5)·R3  and  R2 ← R2 - (2/5)·R3:
R1: (1,0,0 | 3/5+1/40, -1/5-1/20, 1/8) 
       = (1,0,0 | 25/40, -9/20, 1/8)
       = (1,0,0 | 5/8, -9/20, 1/8)  ← let me compute cleanly:

3/5 + (1/5)(1/8)  = 3/5 + 1/40 = 24/40 + 1/40 = 25/40 = 5/8
-1/5 + (1/5)(-1/4) = -1/5 - 1/20 = -4/20 - 1/20 = -5/20 = -1/4
0 + (1/5)(5/8) = 1/8

R1 = (1, 0, 0 | 5/8, -1/4, 1/8)

-1/5 - (2/5)(1/8) = -1/5 - 1/20 = -4/20 - 1/20 = -5/20 = -1/4
2/5 - (2/5)(-1/4) = 2/5 + 1/10 = 4/10 + 1/10 = 5/10 = 1/2
0 - (2/5)(5/8) = -1/4

R2 = (0, 1, 0 | -1/4, 1/2, -1/4)

Final:
A⁻¹ = |  5/8   -1/4   1/8 |
       | -1/4    1/2  -1/4 |
       |  1/8   -1/4   5/8 |

Verify A·A⁻¹ (check row 1 × all columns):
[2,1,0] · [5/8, -1/4, 1/8]   = 10/8 - 1/4 + 0 = 10/8 - 2/8 = 8/8 = 1 ✓
[2,1,0] · [-1/4, 1/2, -1/4]  = -2/4 + 1/2 + 0 = -1/2 + 1/2 = 0 ✓
[2,1,0] · [1/8, -1/4, 5/8]   = 2/8 - 1/4 + 0 = 1/4 - 1/4 = 0 ✓
```

---

## Properties of Inverses

**(AB)⁻¹ = B⁻¹A⁻¹** — order reverses

*Proof:* (AB)(B⁻¹A⁻¹) = A(BB⁻¹)A⁻¹ = AIA⁻¹ = AA⁻¹ = I. ✓

The order-reversal is not optional. Think of it as "putting on socks then shoes." The inverse is "take off shoes, then take off socks" — reversed.

**(Aᵀ)⁻¹ = (A⁻¹)ᵀ** — inverse and transpose commute

**(A⁻¹)⁻¹ = A** — inverting twice returns to original

**det(A⁻¹) = 1/det(A)** — follows from det(AA⁻¹) = det(I) = 1

---

## Why Not Always Use the Inverse?

You might think: to solve Ax = b, just compute x = A⁻¹b. But in practice:

**Problem 1: Computing A⁻¹ costs O(n³) operations** — the same as Gaussian elimination. There's no shortcut. So A⁻¹ alone doesn't save work.

**Problem 2: If you need to solve Ax = bᵢ for many different right-hand sides bᵢ, then:**
- Computing A⁻¹ once: O(n³) setup, then O(n²) per solve → efficient.
- Gaussian elimination per system: O(n³) per solve → slow if many systems.
- **LU decomposition** (Chapter 05): O(n³) factoring once, then O(n²) per solve using forward/back substitution → same efficiency as inverse, but numerically more stable.

**Problem 3: Numerical stability**

Inverses can amplify errors. The condition number κ(A) = ||A|| · ||A⁻¹|| measures sensitivity: if κ(A) = 10⁶, a 1-unit error in b can produce 10⁶ error in x = A⁻¹b.

```python
import numpy as np

# Example: near-singular matrix
A = np.array([[1, 1], [1, 1.0001]])  # rows nearly identical
b = np.array([2, 2.0001])

print(np.linalg.cond(A))    # ~40000 — high condition number!

# Solve via inverse (less stable)
x_inv = np.linalg.inv(A) @ b

# Solve via LU (more stable, what np.linalg.solve uses)
x_solve = np.linalg.solve(A, b)

print(x_inv)    # may have large errors
print(x_solve)  # more accurate
```

**Rule of thumb:** Use `np.linalg.solve(A, b)` not `np.linalg.inv(A) @ b` unless you explicitly need A⁻¹ itself.

---

## The Complete Invertible Matrix Theorem

For an n×n matrix A, these 11 conditions are ALL equivalent:

| # | Condition |
|---|-----------|
| 1 | A is invertible |
| 2 | det(A) ≠ 0 |
| 3 | rank(A) = n |
| 4 | N(A) = {0} (trivial null space) |
| 5 | Columns of A are linearly independent |
| 6 | Rows of A are linearly independent |
| 7 | C(A) = ℝⁿ (column space fills all of ℝⁿ) |
| 8 | Ax = b has a unique solution for every b ∈ ℝⁿ |
| 9 | Ax = 0 has only the trivial solution x = 0 |
| 10 | A is row-equivalent to Iₙ |
| 11 | 0 is not an eigenvalue of A (Chapter 10) |

**How to use this theorem:** If you can quickly check ANY one condition, you immediately know all others. For a 2×2 matrix, checking det(A) ≠ 0 is instant. For a large sparse matrix in code, checking rank ≥ n via LU may be fastest.

---

## Connecting Rank, Null Space, and Invertibility

From Chapter 03: **rank(A) + nullity(A) = n** (Rank-Nullity Theorem).

Plugging in: if rank(A) = n, then nullity(A) = 0, meaning N(A) = {0}. That's condition #4.
If rank(A) < n, then nullity(A) ≥ 1, meaning a non-trivial kernel exists — no inverse.

```
A = | 1  2  3 |    n = 3
    | 4  5  6 |
    | 7  8  9 |

Row reduce:
R2 ← R2 - 4R1:  (0, -3, -6)
R3 ← R3 - 7R1:  (0, -6, -12)
R3 ← R3 - 2R2:  (0, 0, 0)

Rank = 2, nullity = 1.

Rank < n → NOT invertible.
N(A) ≠ {0} → ∃ non-zero x with Ax = 0 → solution: x = (1, -2, 1)
(verify: 1+(-4)+3=0, 4+(-10)+6=0, 7+(-16)+9=0 ✓)
```

---

## Left vs Right Inverses (Non-Square Matrices)

For non-square matrices, the concept generalizes:

- **A is m×n with m > n (tall/overdetermined):** A has a **left inverse** if rank(A) = n.  
  Left inverse: (AᵀA)⁻¹Aᵀ — the same matrix from least squares (Chapter 09)!  
  (AᵀA)⁻¹Aᵀ · A = I_n, but A · (AᵀA)⁻¹Aᵀ ≠ I_m (it's a projection matrix)

- **A is m×n with m < n (wide/underdetermined):** A has a **right inverse** if rank(A) = m.  
  Right inverse: Aᵀ(AAᵀ)⁻¹  
  A · Aᵀ(AAᵀ)⁻¹ = I_m, but Aᵀ(AAᵀ)⁻¹ · A ≠ I_n

- **A is square and full rank:** left inverse = right inverse = A⁻¹.

These generalizations lead to the **pseudoinverse** A⁺ (Chapter 14, SVD), which exists for ALL matrices.

---

## Applications: Why Inverses Matter

**Cryptography (Hill cipher):** Encrypt m = A·p (mod 26) where p is plaintext vector and A is a key matrix. Decrypt with A⁻¹ (mod 26). If det(A) shares a factor with 26, no modular inverse exists → broken cipher.

**Computer graphics:** Transformation matrices (rotate, scale, translate). The inverse transformation is needed for:
- Ray-object intersection (transform ray into object space)
- Hit-testing (transform mouse coordinates to world space)
- Lighting (transform normals: use (A⁻¹)ᵀ, NOT A!)

**Linear regression:** Normal equations solution x̂ = (AᵀA)⁻¹Aᵀb — explicitly requires invertibility of AᵀA (guaranteed when A has full column rank).

---

## Section Challenge

> ### Inverses in a Graphics Pipeline
>
> A 2D game engine applies three transformations to a sprite:
>
> ```
> S (scale by 2):      | 2  0 |
>                      | 0  2 |
>
> R (rotate 45°):      | cos45  -sin45 |  =  | 1/√2  -1/√2 |
>                      | sin45   cos45 |     | 1/√2   1/√2 |
>
> T (shear x by 0.5): | 1  0.5 |
>                     | 0   1  |
> ```
>
> The combined transformation is M = T · R · S (applied right-to-left).
>
> **Q1:** Compute M.
>
> **Q2:** Is M invertible? Compute det(M) to verify.
>
> **Q3:** Compute M⁻¹ using the 2×2 formula.
>
> **Q4:** A point is at screen position p = (3, 2). Where was it in the original sprite coordinates?
>
> **Q5 (Stretch):** If instead the scale step used S' = | 2  0 | / | 0  0 |, explain why the full pipeline M' = T · R · S' is not invertible. What information is lost?

<details>
<summary>Full answers</summary>

```
Q1: Compute M = T · R · S

Step 1: R · S
  R = (1/√2) | 1  -1 |    S = | 2  0 |
              | 1   1 |        | 0  2 |

  (R·S)[row1] = (1/√2)·(2, 0) + (-1/√2)·(0, 2) = (2/√2, -2/√2) = (√2, -√2)
  (R·S)[row2] = (1/√2)·(2, 0) + (1/√2)·(0, 2)  = (2/√2,  2/√2) = (√2,  √2)

  R·S = | √2  -√2 |
        | √2   √2 |

Step 2: T · (R·S)
  T = | 1  0.5 |
      | 0   1  |

  T·(R·S) row1 = 1·(√2, -√2) + 0.5·(√2, √2) = (√2 + √2/2, -√2 + √2/2)
                = (3√2/2, -√2/2)
  T·(R·S) row2 = 0·(√2, -√2) + 1·(√2, √2) = (√2, √2)

  M = | 3√2/2  -√2/2 |    ≈ | 2.121  -0.707 |
      |  √2     √2   |      | 1.414   1.414 |

──────────────────────────────────────────

Q2: Is M invertible?

det(M) = (3√2/2)(√2) - (-√2/2)(√2)
       = 3·2/2 + 2/2
       = 3 + 1
       = 4

det(M) = 4 ≠ 0 → M IS invertible. ✓

Alternative: det(M) = det(T)·det(R)·det(S) = 1 · 1 · 4 = 4. ✓
(Rotation has det=1, shear has det=1, scale-by-2 has det=4.)

──────────────────────────────────────────

Q3: M⁻¹ using the 2×2 formula

M = | a    b  |  =  | 3√2/2   -√2/2 |
    | c    d  |     |   √2      √2  |

M⁻¹ = (1/det) |  d  -b |  =  (1/4) |  √2    √2/2  |
               | -c   a |           | -√2   3√2/2  |

M⁻¹ = |  √2/4    √2/8  |    ≈ | 0.354   0.177 |
      | -√2/4   3√2/8  |      |-0.354   0.530 |

──────────────────────────────────────────

Q4: Original sprite position

p = (3, 2) is in screen space. To find original position:
x = M⁻¹ · p

x₁ = (√2/4)·3 + (√2/8)·2  = 3√2/4 + 2√2/8 = 6√2/8 + 2√2/8 = 8√2/8 = √2 ≈ 1.414
x₂ = (-√2/4)·3 + (3√2/8)·2 = -3√2/4 + 6√2/8 = -6√2/8 + 6√2/8 = 0

Original position: (√2, 0) ≈ (1.414, 0)

Verify: M · (√2, 0):
  Row 1: (3√2/2)·√2 + (-√2/2)·0 = 3·2/2 = 3 ✓
  Row 2: √2·√2 + √2·0 = 2 ✓ → outputs (3,2) as required.

──────────────────────────────────────────

Q5: Why S' = |2 0| / |0 0| makes M' non-invertible

S' collapses the y-axis to zero: any point (x, y) maps to (2x, 0).
The entire 2D plane collapses to the x-axis — ALL vertical information is lost.

det(S') = 2·0 - 0·0 = 0.
det(M') = det(T)·det(R)·det(S') = 1·1·0 = 0 → NOT invertible.

What's lost: two different original y-coordinates (say y=1 and y=5) both map
to the same output y=0 after S'. You cannot tell which y produced which output.
The pipeline cannot be inverted because information is permanently destroyed.

Geometric picture: M' maps all of ℝ² onto a 1D line (the image of the x-axis
through the subsequent R and T transformations). An entire LINE of sprite
positions (all with different y) produces the SAME screen point.
```

</details>

---

## Common Mistakes

**Mistake 1: Computing (A⁻¹)ᵀ instead of (Aᵀ)⁻¹ for transforming normals**
- These ARE equal: (A⁻¹)ᵀ = (Aᵀ)⁻¹. But in graphics, people often forget the transpose entirely and use A⁻¹ for normals — incorrect unless A is orthogonal.

**Mistake 2: Using `np.linalg.inv(A) @ b` to solve Ax = b**
- Use `np.linalg.solve(A, b)` instead — it's faster (no explicit inverse) and more numerically stable.

**Mistake 3: Assuming AB and BA are both invertible**
- If A is invertible and B is invertible, then AB is invertible. But if A is invertible and AB is invertible, that does NOT mean B is invertible — example: B could be non-square.

**Mistake 4: Forgetting the order reversal (AB)⁻¹ = B⁻¹A⁻¹**
- (AB)⁻¹ ≠ A⁻¹B⁻¹ in general (matrices don't commute).

---

## Connections

- **Chapter 03 — Rank:** rank(A) = n ↔ invertible. rank < n → no inverse.
- **Chapter 05 — Gaussian Elimination:** The [A|I]→[I|A⁻¹] method IS Gaussian elimination applied to an augmented system. LU decomposition is the efficient generalization.
- **Chapter 06 — Determinants:** det(A) ≠ 0 is the algebraic invertibility test. det(A⁻¹) = 1/det(A).
- **Chapter 09 — Least Squares:** Left inverse (AᵀA)⁻¹Aᵀ appears naturally as the least-squares projector.
- **Chapter 14 — SVD:** The pseudoinverse A⁺ = VΣ⁺Uᵀ generalizes A⁻¹ to ALL matrices, including non-square and singular ones.

---

> [< Previous: 06 Determinants](06_Determinants.md) | [Course Index](README.md) | [Next → 08 Orthogonality & Gram-Schmidt](08_Orthogonality_Gram_Schmidt.md)
