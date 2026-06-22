# Chapter 09 — Projections & Least Squares

> [< Previous: 08 Orthogonality & Gram-Schmidt](08_Orthogonality_Gram_Schmidt.md) | [Course Index](README.md) | [Next → 10 Eigenvalues & Eigenvectors](10_Eigenvalues_Eigenvectors.md)

---

## The Problem: When Exact Solutions Don't Exist

You measure the position of a satellite 1000 times. Each measurement gives a slightly different answer due to sensor noise. You model the position as a linear function of time: p(t) = a₀ + a₁t. That's 2 unknowns, 1000 equations — a system with NO exact solution.

You can't satisfy all equations simultaneously. But you can find the (a₀, a₁) that is **closest to satisfying all equations** — the least squares solution. Every GPS, every ML model, every scientific regression uses this idea.

**The core insight:** "Closest" has an elegant geometric meaning. It's a projection. Understanding projections is the key to understanding least squares.

---

## Projection onto a Line

**Setup:** Project vector b onto the line spanned by vector a.

The projection p = x̂a must satisfy: the residual e = b - p is orthogonal to a.

```
a ⊥ (b - x̂a)
a · (b - x̂a) = 0
a·b - x̂(a·a) = 0
x̂ = (a·b) / (a·a) = (a·b) / ||a||²

p = x̂a = (a·b / ||a||²) · a
```

**Projection matrix:** We can write p = Pb where P is the projection matrix:

```
p = (a·b / aᵀa) · a = a(aᵀb) / aᵀa = (aaᵀ)/(aᵀa) · b

P = aaᵀ / (aᵀa)       (rank-1 matrix)
```

### Concrete Example

```
a = (1, 2)   b = (4, 1)

x̂ = (1·4 + 2·1) / (1² + 2²) = 6/5

p = (6/5)(1, 2) = (6/5, 12/5)

e = b - p = (4 - 6/5, 1 - 12/5) = (14/5, -7/5)

Check: a·e = 1·(14/5) + 2·(-7/5) = 14/5 - 14/5 = 0 ✓ (residual ⊥ a)

P = (1/5)|1||1  2| = (1/5)| 1  2| 
         |2|           | 2  4|

P·b = (1/5)| 1  2||4| = (1/5)| 6 | = (6/5, 12/5) ✓
           | 2  4||1|         |12 |
```

---

## Projection Matrix Properties

For any projection matrix P:

**P² = P (idempotent)** — projecting twice = projecting once.
```
Proof: (aaᵀ/aᵀa)² = a(aᵀa)aᵀ/(aᵀa)² = aaᵀ/(aᵀa) = P ✓
```

**Pᵀ = P (symmetric)** — (aaᵀ/(aᵀa))ᵀ = (aᵀ)ᵀaᵀ/(aᵀa) = aaᵀ/(aᵀa) = P ✓

These two properties — **idempotent + symmetric** — completely characterize projection matrices. Any matrix with P² = P and Pᵀ = P is a projection.

**Eigenvalues of P:** The eigenvalues of a projection matrix are 0 and 1 only.
- λ = 1: vectors in C(P) (they're fixed by P)
- λ = 0: vectors in N(P) (they're killed by P)

---

## Projection onto a Subspace

**Setup:** Subspace S = C(A) (column space of m×n matrix A). Project b onto S.

The projection p = Ax̂ must satisfy: the residual e = b - Ax̂ is orthogonal to every vector in C(A), i.e., orthogonal to every column of A.

This means Aᵀ(b - Ax̂) = 0:

```
Aᵀb - AᵀAx̂ = 0
AᵀAx̂ = Aᵀb         ← THE NORMAL EQUATIONS
```

If A has full column rank (columns linearly independent), AᵀA is invertible:

**x̂ = (AᵀA)⁻¹Aᵀb**

**p = Ax̂ = A(AᵀA)⁻¹Aᵀb = Pb**

**The projection matrix onto C(A):**
**P = A(AᵀA)⁻¹Aᵀ**

Verify: P² = A(AᵀA)⁻¹Aᵀ · A(AᵀA)⁻¹Aᵀ = A(AᵀA)⁻¹(AᵀA)(AᵀA)⁻¹Aᵀ = A(AᵀA)⁻¹Aᵀ = P ✓

---

## Geometric Picture of Least Squares

When Ax = b has no solution, b is NOT in C(A). The closest we can get is the projection Ax̂ = p ∈ C(A). The error e = b - Ax̂ is perpendicular to C(A).

```
         b
        /|
       / |
      /  | e = b - Ax̂
     /   |   (⊥ to C(A))
    /    |
   p = Ax̂  (in C(A))
```

**Why this minimizes ||e||²:**

For any other x in place of x̂, let p' = Ax. Then b - p' = (b - p) + (p - p') = e + (p - p'). Since e ⊥ C(A) and (p - p') ∈ C(A):

```
||b - p'||² = ||e + (p-p')||² = ||e||² + ||p-p'||²   (Pythagorean theorem, ⊥ vectors)
```

This is minimized when ||p-p'||² = 0, i.e., p' = p. So x̂ is the minimum. ✓

---

## Deriving the Normal Equations from Calculus

Alternative derivation: minimize f(x) = ||Ax - b||².

```
f(x) = (Ax-b)ᵀ(Ax-b) = xᵀAᵀAx - xᵀAᵀb - bᵀAx + bᵀb

∂f/∂x = 2AᵀAx - 2Aᵀb = 0

AᵀAx = Aᵀb   ← same normal equations
```

The gradient = 0 at the minimum. The matrix AᵀA is positive semidefinite (AᵀA ≥ 0 in quadratic sense) so the stationary point is indeed a minimum.

---

## Linear Regression as Least Squares

**Fit y = mx + c to data points (xᵢ, yᵢ):**

The system we wish to solve exactly:
```
m·x₁ + c = y₁
m·x₂ + c = y₂
...
m·xₙ + c = yₙ
```

In matrix form Ax = b:
```
A = | x₁  1 |    x = | m |    b = | y₁ |
    | x₂  1 |        | c |        | y₂ |
    |  .  . |                     |  . |
    | xₙ  1 |                     | yₙ |
```

Normal equations AᵀAx = Aᵀb:
```
AᵀA = | Σxᵢ²   Σxᵢ |     Aᵀb = | Σxᵢyᵢ |
      | Σxᵢ     n  |            | Σyᵢ   |
```

This is a 2×2 system! Solving gives the slope and intercept formulas from statistics.

### Full Worked Numerical Example

Data: fit y = mx + c to points (1,2), (2,4), (3,5), (4,7), (5,8).

```
A = |1  1|    b = |2|
    |2  1|        |4|
    |3  1|        |5|
    |4  1|        |7|
    |5  1|        |8|

AᵀA = | 1²+2²+3²+4²+5²   1+2+3+4+5 | = | 55  15 |
      | 1+2+3+4+5         5          |   | 15   5 |

Aᵀb = | 1·2+2·4+3·5+4·7+5·8 | = | 2+8+15+28+40 | = | 93 |
      | 2+4+5+7+8            |   |      26       |   | 26 |

Solve | 55  15 || m | = | 93 |
      | 15   5 || c |   | 26 |

From row 2: 15m + 5c = 26 → c = (26 - 15m)/5
Sub into row 1: 55m + 15·(26-15m)/5 = 93
  55m + 78 - 45m = 93
  10m = 15
  m = 1.5

c = (26 - 22.5)/5 = 3.5/5 = 0.7

Best-fit line: y = 1.5x + 0.7

Check residuals:
  x=1: ŷ = 2.2, actual = 2, residual = -0.2
  x=2: ŷ = 3.7, actual = 4, residual = +0.3
  x=3: ŷ = 5.2, actual = 5, residual = -0.2
  x=4: ŷ = 6.7, actual = 7, residual = +0.3
  x=5: ŷ = 8.2, actual = 8, residual = -0.2

Sum of squared residuals: 0.04 + 0.09 + 0.04 + 0.09 + 0.04 = 0.30 (minimized)
```

---

## Polynomial Regression

The same framework extends to fitting any polynomial:

**Fit y = a₀ + a₁x + a₂x² + ... + aₖxᵏ to n > k+1 data points:**

```
A = | 1  x₁  x₁²  ...  x₁ᵏ |     x = | a₀ |
    | 1  x₂  x₂²  ...  x₂ᵏ |         | a₁ |
    | .   .    .   ...   .  |         | .  |
    | 1  xₙ  xₙ²  ...  xₙᵏ |         | aₖ |
```

This is the **Vandermonde system**. The least squares solution x̂ = (AᵀA)⁻¹Aᵀb gives the best polynomial fit. Note: the matrix structure is the same; only A changes shape.

---

## When Does Least Squares Work? Full Column Rank

The normal equation solution x̂ = (AᵀA)⁻¹Aᵀb requires AᵀA to be invertible.

**AᵀA is invertible ⟺ A has full column rank (rank = n, columns linearly independent).**

*Proof:* AᵀAx = 0 ↔ xᵀAᵀAx = 0 ↔ ||Ax||² = 0 ↔ Ax = 0. If rank(A) = n, only x = 0 satisfies Ax = 0, so N(AᵀA) = {0} → invertible. ✓

**When columns of A are dependent:** AᵀA is singular → no unique least squares solution. This happens in statistics as **multicollinearity** — one feature is a linear combination of others. The fix: remove redundant features or use regularization (Ridge regression).

---

## Numerical Stability: QR vs Normal Equations

**The problem with normal equations in practice:**

The condition number of AᵀA = κ(A)². If A has condition number 1000, AᵀA has condition number 10⁶. Errors in b are amplified by 10⁶ in the solution. For ill-conditioned problems, the normal equations give garbage.

**Solution: QR decomposition (Chapter 08)**

Factor A = QR (Q orthonormal columns, R upper triangular). Then:

```
AᵀAx̂ = Aᵀb
RᵀQᵀQRx̂ = RᵀQᵀb
RᵀRx̂ = RᵀQᵀb          (QᵀQ = I)
Rx̂ = Qᵀb              (multiply both sides by (Rᵀ)⁻¹)
```

Solve **Rx̂ = Qᵀb** by back-substitution — no forming AᵀA, no squaring the condition number.

```python
import numpy as np

# Data from the linear regression example
x = np.array([1, 2, 3, 4, 5], dtype=float)
y = np.array([2, 4, 5, 7, 8], dtype=float)

A = np.column_stack([x, np.ones_like(x)])
b = y

# METHOD 1: Normal equations (less stable)
xhat_normal = np.linalg.solve(A.T @ A, A.T @ b)
print("Normal equations:", xhat_normal)    # [1.5, 0.7]

# METHOD 2: QR decomposition (stable)
Q, R = np.linalg.qr(A)
xhat_qr = np.linalg.solve(R, Q.T @ b)
print("QR solve:", xhat_qr)               # [1.5, 0.7]

# METHOD 3: np.linalg.lstsq (uses SVD internally, most robust)
xhat_lstsq, residuals, rank, sv = np.linalg.lstsq(A, b, rcond=None)
print("lstsq:", xhat_lstsq)              # [1.5, 0.7]
print("Sum of squared residuals:", residuals)  # [0.3]
```

**Rule:** Use `np.linalg.lstsq` for production least squares. It uses SVD (Chapter 13) — even more stable than QR, and works even when A is rank-deficient.

---

## Ridge Regression: Regularized Least Squares

What if AᵀA is singular (columns dependent) or near-singular? Standard least squares has no unique solution.

**Ridge regression** adds a regularization term to the minimization:

**Minimize ||Ax - b||² + λ||x||²** for some λ > 0

The solution:

```
∂/∂x [ ||Ax-b||² + λ||x||² ] = 0
2Aᵀ(Ax-b) + 2λx = 0
(AᵀA + λI)x̂ = Aᵀb

x̂_ridge = (AᵀA + λI)⁻¹Aᵀb
```

**AᵀA + λI is ALWAYS invertible** (since λ > 0 pushes all eigenvalues above 0). Ridge regression regularizes away the singularity at cost of bias toward small ||x||.

Geometric interpretation: instead of projecting exactly onto C(A), Ridge shrinks the solution toward zero, trading bias for variance reduction.

---

## Connections to the Four Fundamental Subspaces

The least squares residual e = b - Ax̂ has a fundamental property:

```
Aᵀe = Aᵀ(b - Ax̂) = Aᵀb - AᵀAx̂ = 0   (from normal equations)
```

So e ∈ N(Aᵀ) — the left null space.

And Ax̂ ∈ C(A) — the column space.

The decomposition b = Ax̂ + e splits b into:
- Ax̂ ∈ C(A) (the projection)
- e ∈ N(Aᵀ) (the residual, perpendicular to C(A))

This is the **fundamental theorem of linear algebra** in action: ℝᵐ = C(A) ⊕ N(Aᵀ), and the two pieces are orthogonal complements.

---

## Section Challenge

> ### Satellite Orbit Fitting
>
> A satellite's altitude h (km) is measured at 5 time points:
>
> ```
> t (hours):    0     1     2     3     4
> h (km):     400   388   380   376   380
> ```
>
> You suspect the altitude follows a quadratic: h(t) = a + bt + ct².
>
> **Q1:** Set up the 5×3 matrix A and vector b for the overdetermined system.
>
> **Q2:** Compute AᵀA and Aᵀb.
>
> **Q3:** Solve the normal equations for (a, b, c).
>
> **Q4:** What does the sign of c tell you about the orbit? At what time is the predicted altitude minimum?
>
> **Q5 (Stretch):** The sum of squared residuals ||b - Ax̂||² = ?. If you added a 4th coefficient d (cubic term), the sum of squared residuals would be 0. Explain why, and whether this is desirable.

<details>
<summary>Full answers</summary>

```
Q1: Setup

A = | 1  0  0  |    b = | 400 |
    | 1  1  1  |        | 388 |
    | 1  2  4  |        | 380 |
    | 1  3  9  |        | 376 |
    | 1  4  16 |        | 380 |

Columns of A: [1], [t], [t²]
Solution vector: x = (a, b, c)ᵀ

────────────────────────────────────────────

Q2: AᵀA and Aᵀb

AᵀA:
  [1,1,1,1,1] · each column:
  n = 5
  Σt = 0+1+2+3+4 = 10
  Σt² = 0+1+4+9+16 = 30
  Σt³ = 0+1+8+27+64 = 100
  Σt⁴ = 0+1+16+81+256 = 354

AᵀA = | n    Σt    Σt²  | = |  5   10   30  |
      | Σt   Σt²   Σt³  |   | 10   30  100  |
      | Σt²  Σt³   Σt⁴  |   | 30  100  354  |

Aᵀb:
  Σhᵢ   = 400+388+380+376+380 = 1924
  Σtᵢhᵢ = 0·400+1·388+2·380+3·376+4·380 = 0+388+760+1128+1520 = 3796
  Σtᵢ²hᵢ = 0·400+1·388+4·380+9·376+16·380 = 0+388+1520+3384+6080 = 11372

Aᵀb = | 1924  |
      | 3796  |
      | 11372 |

────────────────────────────────────────────

Q3: Solve normal equations AᵀAx = Aᵀb

System:
  5a  +  10b +  30c = 1924   ... (1)
  10a +  30b + 100c = 3796   ... (2)
  30a + 100b + 354c = 11372  ... (3)

From (1) ÷ 5:  a + 2b + 6c = 384.8  ... (1')

(2) - 2·(1): 10b + 40c = 3796 - 2·1924 = 3796 - 3848 = -52
              b + 4c = -5.2    ... (4)

(3) - 6·(1): 40b + 174c = 11372 - 6·1924 = 11372 - 11544 = -172
              40b + 174c = -172
  4·(4)×10: 40b + 160c = -208
  Subtract:        14c = 36
                    c = 36/14 = 18/7 ≈ 2.571

From (4): b = -5.2 - 4c = -5.2 - 4(18/7) = -5.2 - 72/7 = -36.4/7 - 72/7 = -108.4/7 ≈ -15.486

Hmm, let me redo this more carefully:

b + 4c = -5.2 and c = 18/7:
b = -5.2 - 4(18/7) = -5.2 - 72/7 = -36.4/7 - 72/7 = -108.4/7

Let me use decimals: c = 36/14 ≈ 2.5714
b = -5.2 - 4(2.5714) = -5.2 - 10.286 = -15.486

a = 384.8 - 2b - 6c = 384.8 - 2(-15.486) - 6(2.5714)
  = 384.8 + 30.971 - 15.429
  = 400.343

So approximately: a ≈ 400.3, b ≈ -15.5, c ≈ 2.57

Best-fit quadratic: h(t) ≈ 400.3 - 15.5t + 2.57t²

────────────────────────────────────────────

Q4: Interpretation and minimum

c ≈ 2.57 > 0 → the parabola opens UPWARD. This means the satellite's altitude
decreases initially (b ≈ -15.5 < 0 dominates early), reaches a minimum, then
increases again. This is consistent with an orbital mechanics model where the
satellite is in an elliptical orbit and the altitude oscillates.

Minimum altitude: dh/dt = b + 2ct = 0
  t* = -b/(2c) = 15.5/(2 · 2.57) ≈ 15.5/5.14 ≈ 3.0 hours

The satellite is closest to Earth at approximately t = 3 hours.
Minimum altitude: h(3) ≈ 400.3 - 15.5(3) + 2.57(9) ≈ 400.3 - 46.5 + 23.1 ≈ 376.9 km

(Compare with actual measurement h(3) = 376 km — close! The small residual
confirms a good fit.)

────────────────────────────────────────────

Q5: 4th coefficient and zero residuals

With 5 data points and a cubic h(t) = a + bt + ct² + dt³, we have 4 unknowns
and 5 equations. Still overdetermined.

With 5 data points and a QUARTIC h(t) = a + bt + ct² + dt³ + et⁴, we have
5 unknowns and 5 equations — a SQUARE system. A unique exact solution exists,
and the residual is exactly 0.

But this is OVERFITTING:
- The quartic is forced to pass through all 5 points, including noise.
- If you measure the satellite again at t=4.5, the quartic's prediction is
  likely terrible (it may wildly oscillate between data points).
- The quadratic with small residual is a BETTER MODEL because it captures
  the real physics (orbital mechanics → parabolic approximation) and is
  robust to measurement noise.

Zero residual ≠ good model. 

Principle: choose model complexity (degree) by cross-validation or
information criteria (AIC/BIC), not by forcing residual to zero.
```

</details>

---

## Common Mistakes

**Mistake 1: Solving Ax = b with `np.linalg.solve` when the system is overdetermined**
- `solve` requires a square, invertible matrix. For m > n, use `np.linalg.lstsq`.

**Mistake 2: Using normal equations in production when A is ill-conditioned**
- `(A.T @ A)` squares the condition number. For near-singular A, use `lstsq` (SVD-based).

**Mistake 3: Confusing "no exact solution" with "no least squares solution"**
- If Ax = b has no exact solution (inconsistent, b ∉ C(A)), the least squares solution x̂ always exists and is the best achievable approximation.

**Mistake 4: Treating x̂ as unique when A is rank-deficient**
- If rank(A) < n (columns linearly dependent), there are INFINITELY MANY least squares solutions. `lstsq` returns the minimum-norm solution.

---

## Connections

- **Chapter 03 — Subspaces:** The residual e ∈ N(Aᵀ). The projection Ax̂ ∈ C(A). This is the fundamental orthogonal decomposition ℝᵐ = C(A) ⊕ N(Aᵀ).
- **Chapter 07 — Inverse:** The formula (AᵀA)⁻¹Aᵀ is the "left inverse" of A — a generalization of A⁻¹ to non-square A.
- **Chapter 08 — Gram-Schmidt/QR:** QR factorization makes least squares numerically stable by avoiding AᵀA entirely.
- **Chapter 12 — Spectral Theorem:** Ridge regression eigenvalue interpretation: AᵀA + λI shifts all eigenvalues by λ, guaranteeing invertibility.
- **Chapter 13 — SVD:** The pseudoinverse A⁺ = VΣ⁺Uᵀ is the most general least squares solver — works for any A, including rank-deficient.

---

> [< Previous: 08 Orthogonality & Gram-Schmidt](08_Orthogonality_Gram_Schmidt.md) | [Course Index](README.md) | [Next → 10 Eigenvalues & Eigenvectors](10_Eigenvalues_Eigenvectors.md)
