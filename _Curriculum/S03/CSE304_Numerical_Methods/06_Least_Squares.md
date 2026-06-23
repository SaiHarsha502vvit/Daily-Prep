# Chapter 6 — Least Squares and Curve Fitting

> "Interpolation forces the curve through every point. Least squares finds the curve that's closest to all points without passing through any of them exactly — and for noisy data, that's almost always better."

---

## The Problem with Interpolation for Noisy Data

Imagine measuring a linear relationship (say, voltage vs current) but your sensor has noise:

```
x: 0   1   2   3   4
y: 0.1 0.9 2.1 2.9 4.0
```

The true relationship is y = x, but noise adds ±0.1.

**Interpolation** with degree-4 polynomial would pass exactly through all 5 points — but that polynomial has oscillations that make it worse than just drawing a line. You're fitting the noise, not the signal.

**Least squares** finds the line y = ax + b that minimizes the total squared error:

```
min_{a,b} Σᵢ (yᵢ - (axᵢ + b))²
```

This gives the best overall fit without overfitting individual measurements.

---

## 6.1 Linear Least Squares: The Normal Equations

**Problem:** Given data (x₁,y₁), ..., (xₘ,yₙ) and basis functions φ₁(x), ..., φₙ(x), find coefficients c = [c₁,...,cₙ]ᵀ minimizing:

```
||y - Ac||²₂ = Σᵢ (yᵢ - Σⱼ cⱼ φⱼ(xᵢ))²
```

where A is the **Vandermonde-like matrix**: Aᵢⱼ = φⱼ(xᵢ).

**When m > n (overdetermined):** More equations than unknowns. No exact solution exists. Best we can do: minimize residual ||r||₂ = ||b - Ac||₂.

### Derivation via Calculus

Minimize f(c) = ||y - Ac||²₂ = (y-Ac)ᵀ(y-Ac).

Expand: f(c) = yᵀy - 2cᵀAᵀy + cᵀAᵀAc.

Take gradient: ∇ₓf = -2Aᵀy + 2AᵀAc.

Set to zero:

```
AᵀAc = Aᵀy
```

These are the **normal equations**. The solution is:
```
c = (AᵀA)⁻¹Aᵀy
```

**Geometric interpretation:** The residual r = y - Ac is orthogonal to the column space of A. "Normal" = orthogonal.

### Worked Example: Linear Fit

Data: (0, 0.1), (1, 0.9), (2, 2.1), (3, 2.9), (4, 4.0). Fit y = c₁ + c₂x.

Basis functions: φ₁(x) = 1, φ₂(x) = x.

```
A = [1  0]    y = [0.1]
    [1  1]        [0.9]
    [1  2]        [2.1]
    [1  3]        [2.9]
    [1  4]        [4.0]
```

Normal equations AᵀA c = Aᵀy:

```
AᵀA = [5   10 ]    Aᵀy = [10.0]
      [10  30 ]           [30.6]
```

Solve:
```
[5  10] [c₁]   [10.0]
[10 30] [c₂] = [30.6]
```

From row 1: 5c₁ + 10c₂ = 10 → c₁ + 2c₂ = 2.
From row 2: 10c₁ + 30c₂ = 30.6 → c₁ + 3c₂ = 3.06.

Subtracting: c₂ = 1.06 ≈ 1 (true slope). Then c₁ = 2 - 2(1.06) = -0.12 ≈ 0 (true intercept).

Least squares correctly recovers y ≈ x despite noise.

---

## 6.2 QR Decomposition: Numerically Stable Least Squares

**Problem with normal equations:** The condition number of AᵀA is κ(AᵀA) = κ(A)². If κ(A) = 1000, the normal equations have κ ≈ 10⁶ — much worse!

**Better approach:** Use QR decomposition.

**QR decomposition:** Any m×n matrix A (m ≥ n) can be written as:
```
A = QR
```
where Q is m×n with orthonormal columns (QᵀQ = I) and R is n×n upper triangular.

**Least squares via QR:**

```
||y - Ac||² = ||y - QRc||² = ||Qᵀy - Rc||²
```

(Using the fact that multiplying by Q doesn't change the ℓ₂ norm.)

Now: minimize ||Qᵀy - Rc||². Since R is square upper triangular, the unique minimum is:

```
Rc = Qᵀy  →  c = R⁻¹Qᵀy  (back-substitution)
```

**Stability:** κ(R) = κ(A), not κ(A)². The QR approach has half the condition number exponent.

In practice: `numpy.linalg.lstsq` uses QR internally.

### Gram-Schmidt QR

Build Q's columns by orthogonalizing A's columns:

```
q₁ = a₁ / ||a₁||

q₂ = (a₂ - (a₂ᵀq₁)q₁) / ||(a₂ - (a₂ᵀq₁)q₁)||

q₃ = (a₃ - (a₃ᵀq₁)q₁ - (a₃ᵀq₂)q₂) / ||...||
```

R is built from the projections (the coefficients removed from each aₖ).

**Modified Gram-Schmidt (MGS):** Numerically stabler variant. Update the remaining columns as you go instead of subtracting at the end. Same mathematical result, but error doesn't accumulate.

---

## 6.3 Polynomial Least Squares

**Fit a polynomial of degree d to m > d+1 data points:**

Basis: φⱼ(x) = xʲ⁻¹ for j=1,...,d+1. This gives the Vandermonde matrix:

```
A = [1  x₁  x₁²  ...  x₁ᵈ]
    [1  x₂  x₂²  ...  x₂ᵈ]
    [...]
    [1  xₘ  xₘ²  ...  xₘᵈ]
```

The normal equations give the best-fit polynomial of degree d.

**Key question: what degree d?**

**Underfitting (d too small):** Large systematic residuals. The model is too simple.

**Overfitting (d too large):** Small training residuals but poor prediction. With d = m-1, you interpolate and fit the noise.

**Model selection:** Use cross-validation (train on subset, test on held-out data) or regularization (§6.5).

### Residual Analysis

After fitting, examine residuals rᵢ = yᵢ - p(xᵢ):
- **Random scatter:** The model is appropriate (residuals = pure noise)
- **Systematic pattern:** Increase d (model is too simple)
- **Few extreme outliers:** The data has outliers (use robust regression instead of least squares)

---

## 6.4 The Pseudoinverse

The least-squares solution can be written as:
```
c = A⁺y
```

where A⁺ = (AᵀA)⁻¹Aᵀ is the **Moore-Penrose pseudoinverse** (for full-rank A).

**Via SVD:** A = UΣVᵀ. Then A⁺ = VΣ⁺Uᵀ where Σ⁺ replaces each nonzero σᵢ with 1/σᵢ.

**Handles rank-deficient A:** When AᵀA is singular (columns of A are linearly dependent), the pseudoinverse gives the **minimum-norm** least-squares solution:

```
c = A⁺y  minimizes ||c||₂ among all least-squares solutions
```

```python
import numpy as np
c, residuals, rank, sv = np.linalg.lstsq(A, y, rcond=None)
```

---

## 6.5 Ridge Regression and Regularization

**Problem with standard least squares:** When A is nearly rank-deficient, the solution c can be huge — fitting noise with large oscillating coefficients.

**Ridge regression (Tikhonov regularization):**
```
min_c ||y - Ac||² + λ||c||²
```

Add a penalty for large coefficients. The solution:
```
c_λ = (AᵀA + λI)⁻¹Aᵀy
```

**Effect of λ:**
- λ = 0: ordinary least squares
- λ → ∞: c → 0 (ignore data, pull toward zero)
- λ just right: balance fit quality and coefficient size

**Why λI helps:** Even if AᵀA is singular, AᵀA + λI has eigenvalues ≥ λ — it's always invertible. Condition number of (AᵀA + λI) is much smaller than κ(AᵀA).

**Bias-variance tradeoff:**
- Standard LS: unbiased estimator of c but high variance (sensitive to noise)
- Ridge: biased (systematic shift toward zero) but lower variance (more stable)

This is the fundamental tradeoff in statistical learning. For noisy data, accepting some bias reduces prediction error overall.

### LASSO (L1 regularization)

```
min_c ||y - Ac||² + λ||c||₁
```

L1 penalty promotes **sparsity** — many coefficients are exactly zero. Used for feature selection.

---

## 6.6 Non-Linear Least Squares

**Problem:** Fit a non-linear model y = f(x; θ) to data, minimizing:
```
min_θ Σᵢ (yᵢ - f(xᵢ; θ))²
```

**Example:** Fit exponential decay y = Ae^(bx) with parameters A, b.

**Gauss-Newton algorithm:** At each step, linearize f around current θ:
```
f(x; θ + δθ) ≈ f(x; θ) + J(x;θ)·δθ
```

where J is the Jacobian ∂f/∂θ. Then solve the linear least squares:
```
min_{δθ} ||r - Jδθ||²
```

where r = y - f(x; θ) is the current residual.

**Levenberg-Marquardt:** Combines Gauss-Newton with gradient descent:
```
(JᵀJ + μI)δθ = Jᵀr
```

μ large: gradient descent steps (safe, slow). μ small: Gauss-Newton steps (fast, can diverge). Adapts μ based on progress.

Used in every curve-fitting library (scipy.optimize.curve_fit).

---

## Section Challenge

---

**Q1.** The data (1,2), (2,3), (3,5), (4,7), (5,11) seems to grow. Fit y = c₁ + c₂x + c₃x² using normal equations. Compute AᵀA and describe the solution without solving it completely.

<details>
<summary>Answer</summary>

Basis: 1, x, x². Design matrix A:

```
A = [1  1   1 ]
    [1  2   4 ]
    [1  3   9 ]
    [1  4  16 ]
    [1  5  25 ]
```

```
AᵀA = A^T × A

[Sum(1)     Sum(xᵢ)    Sum(xᵢ²) ]   [5    15    55  ]
[Sum(xᵢ)   Sum(xᵢ²)   Sum(xᵢ³) ] = [15   55   225  ]
[Sum(xᵢ²)  Sum(xᵢ³)   Sum(xᵢ⁴) ]   [55   225  979  ]

x values: 1,2,3,4,5
Σxᵢ = 15, Σxᵢ² = 55, Σxᵢ³ = 225, Σxᵢ⁴ = 979

Aᵀy:
[Σyᵢ        ]   [2+3+5+7+11]   [28  ]
[Σxᵢyᵢ      ] = [2+6+15+28+55] = [106 ]
[Σxᵢ²yᵢ     ]   [2+12+45+112+275] [446]
```

The normal equations:
```
[5   15   55 ] [c₁]   [28 ]
[15  55  225 ] [c₂] = [106]
[55  225 979 ] [c₃]   [446]
```

Solving (or trusting scipy): c₃ ≈ 0.5 (quadratic term), c₂ ≈ 0, c₁ ≈ 1.5. 
Best-fit: y ≈ 0.5x² + 1.5 → at x=1: 2 ✓, at x=5: 13 (vs 11 — approximately right, this is the least-squares fit, not exact interpolation).
</details>

---

**Q2.** Show that the least-squares solution satisfies the geometric condition: the residual vector r = y - Ac is orthogonal to the column space of A.

<details>
<summary>Answer</summary>

**From normal equations:** AᵀAc = Aᵀy, which gives Aᵀ(y - Ac) = 0, i.e., Aᵀr = 0.

**Geometric interpretation:** Aᵀr = 0 means rᵀA = 0 (row = 0). For any column aⱼ of A:

```
(Aᵀr)ⱼ = aⱼᵀr = 0
```

So r is orthogonal to every column of A → r ⊥ col(A). ✓

**Why this is "least squares":** The projection theorem says: the closest point in the column space of A to y is the orthogonal projection. The residual from the projection is orthogonal to the subspace. The least-squares solution projects y onto col(A), and the residual is exactly this orthogonal complement. □

**Equivalence:** ||y - Ac||² is minimized iff the gradient is zero iff AᵀA c = Aᵀy iff r ⊥ col(A). All three conditions are equivalent.
</details>

---

**Q3.** Why does ridge regression shrink coefficients toward zero? Show algebraically using the SVD of A.

<details>
<summary>Answer</summary>

Ridge solution: c_λ = (AᵀA + λI)⁻¹Aᵀy.

Write A = UΣVᵀ (SVD). Then:
```
AᵀA = VΣᵀUᵀUΣVᵀ = VΣ²Vᵀ
AᵀA + λI = V(Σ² + λI)Vᵀ
(AᵀA + λI)⁻¹ = V(Σ² + λI)⁻¹Vᵀ
```

Ridge solution:
```
c_λ = V(Σ² + λI)⁻¹Vᵀ × VΣUᵀy
    = V(Σ² + λI)⁻¹ΣUᵀy
```

Compare to OLS: c = VΣ⁻¹Uᵀy = V·diag(1/σᵢ)·Uᵀy.

Ridge replaces 1/σᵢ with σᵢ/(σᵢ² + λ):

```
Ridge coefficient = σᵢ/(σᵢ² + λ) × (Uᵀy)ᵢ
OLS coefficient  = 1/σᵢ × (Uᵀy)ᵢ
```

**Shrinkage factor:** σᵢ/(σᵢ² + λ) = 1/(σᵢ + λ/σᵢ) < 1/σᵢ for all λ > 0.

So ridge multiplies every OLS component by a factor < 1 → shrinks toward zero.

**For small singular values (σᵢ small):** OLS gives huge 1/σᵢ coefficients (instability). Ridge gives σᵢ/(σᵢ² + λ) ≈ σᵢ/λ — small and bounded. This is why ridge helps with ill-conditioned problems.
</details>

---

**Q4.** Fit a sinusoidal model y = A sin(x) + B cos(x) to data. Is this a linear or non-linear least-squares problem?

<details>
<summary>Answer</summary>

**Linear least-squares problem.**

Although the model involves sin and cos (nonlinear functions of x), the parameters A and B enter **linearly**:

```
y = A · φ₁(x) + B · φ₂(x)
```

where φ₁(x) = sin(x) and φ₂(x) = cos(x) are just basis functions.

The design matrix:
```
A_matrix = [sin(x₁)  cos(x₁)]
           [sin(x₂)  cos(x₂)]
           [...]
           [sin(xₘ)  cos(xₘ)]
```

Normal equations: (A_matrix^T × A_matrix)[A;B] = A_matrix^T × y.

This is standard linear LS — solved directly with no iteration needed.

**Contrast with nonlinear:** If the model were y = A sin(Bx + φ), the unknown B inside the argument of sin makes it nonlinear in parameters — would need Gauss-Newton or Levenberg-Marquardt.

**Rule:** A problem is LINEAR least squares iff the unknowns appear linearly (even if the basis functions are nonlinear). Otherwise it's nonlinear LS.
</details>

---

**Q5.** Your data has one obvious outlier. Compare how standard least squares vs L1 regression (minimizing Σ|yᵢ - f(xᵢ)|) would handle it.

<details>
<summary>Answer</summary>

**Standard least squares (L2):** Minimizes Σ(yᵢ-ŷᵢ)². Squaring makes LARGE errors much more costly. One outlier with error 10 contributes 100 to the objective — 100× more than 10 normal points with error 1. The fitted curve is strongly pulled toward the outlier.

**L1 regression (LAD — Least Absolute Deviations):** Minimizes Σ|yᵢ-ŷᵢ|. An outlier with error 10 contributes only 10, the same as 10 normal points. The outlier has much less influence.

**Mathematical reason:** L2 loss has gradient 2(yᵢ-ŷᵢ) — grows with error. L1 loss has gradient sign(yᵢ-ŷᵢ) — constant magnitude regardless of error size. Outliers can't pull arbitrarily hard.

**Geometric intuition:**
- L2 minimizes the sum of SQUARED distances to the fitted line. One far-away point has enormous leverage.
- L1 minimizes sum of absolute distances. The fitted line must be the "median" in some sense — half the data above, half below.

**Practical note:** L1 is "robust" (resistant to outliers) but harder to solve (non-smooth, requires linear programming or iterative reweighted LS). L2 has closed-form normal equations. 

For highly contaminated data, use **Huber loss**: L2 for small residuals, L1 for large ones — combining efficiency (L2 near zero) with robustness (L1 for outliers).
</details>

---

## Chapter Summary

| Method | Formulation | Solution | When to Use |
|--------|------------|---------|-------------|
| Least squares (LS) | min‖y-Ac‖₂² | (AᵀA)⁻¹Aᵀy | Overdetermined, no noise structure |
| QR LS | same | QᵀQ decompose | More stable than normal equations |
| Pseudoinverse | same | A⁺y via SVD | Rank-deficient A |
| Ridge | LS + λ‖c‖₂² | (AᵀA+λI)⁻¹Aᵀy | Near-singular A, prevent overfit |
| LASSO | LS + λ‖c‖₁ | Iterative (ISTA) | Feature selection, sparse c |
| Gauss-Newton | Nonlinear | Iterative linearize | When f is nonlinear in params |
| L1 regression | min Σ|y-Ac| | LP or IRWLS | Robust to outliers |

**Core principle:** Least squares projects y onto the column space of A. The residual is the orthogonal complement. Everything flows from this geometric fact.

---

*Previous: [05 — Polynomial Interpolation](05_Polynomial_Interpolation.md)*
*Next: [07 — Numerical Differentiation](07_Numerical_Differentiation.md)*
