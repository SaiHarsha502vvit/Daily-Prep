# Chapter 7 — Numerical Differentiation

> "Differentiation is exact in theory and treacherous in practice. Step too far and you lose accuracy to truncation. Step too close and catastrophic cancellation takes over. The optimal step size lives in between — and finding it is the art."

---

## The Problem

Given a black-box function f (no closed-form expression — could be output of a simulation), compute f'(x) at a specific x.

**Applications:**
- Gradient computation for optimization (machine learning, engineering design)
- Sensitivity analysis (how does output change with input?)
- Jacobian estimation for Newton's method when derivatives are unavailable
- Verifying analytical derivatives (gradient checking in neural networks)

---

## 7.1 Forward Difference: Derivation from Taylor Series

**Taylor expansion of f(x+h):**
```
f(x+h) = f(x) + hf'(x) + (h²/2)f''(x) + (h³/6)f'''(x) + ...
```

Rearrange for f'(x):
```
f'(x) = [f(x+h) - f(x)] / h - (h/2)f''(x) - (h²/6)f'''(x) - ...
```

**Forward difference formula:**
```
f'(x) ≈ [f(x+h) - f(x)] / h
```

**Truncation error:** The leading dropped term is `-(h/2)f''(ξ)` for some ξ ∈ (x, x+h).

```
E_trunc = O(h)   ← first-order method
```

This is a **first-order** approximation: halving h halves the truncation error.

---

## 7.2 Central Difference: Better Order for Same Cost

**Expand both f(x+h) and f(x-h):**

```
f(x+h) = f(x) + hf'(x) + (h²/2)f''(x) + (h³/6)f'''(x) + ...
f(x-h) = f(x) - hf'(x) + (h²/2)f''(x) - (h³/6)f'''(x) + ...
```

Subtract the second from the first:
```
f(x+h) - f(x-h) = 2hf'(x) + (h³/3)f'''(x) + ...
```

Solve:
```
f'(x) = [f(x+h) - f(x-h)] / (2h) - (h²/6)f'''(ξ)
```

**Central difference formula:**
```
f'(x) ≈ [f(x+h) - f(x-h)] / (2h)
```

**Truncation error:** O(h²) — **second-order** method!

Same number of function evaluations as forward difference (2 total), but truncation error drops quadratically with h instead of linearly. This is universally preferable when both f(x+h) and f(x-h) are available.

### Comparison

| Method | Formula | Error order | f-evals |
|--------|---------|-------------|---------|
| Forward diff | [f(x+h)-f(x)]/h | O(h) | 2 |
| Backward diff | [f(x)-f(x-h)]/h | O(h) | 2 |
| Central diff | [f(x+h)-f(x-h)]/(2h) | O(h²) | 2 |

For the same accuracy, central difference needs much smaller h — but it also starts with better order.

---

## 7.3 The Step Size Dilemma

**Both truncation error and rounding error matter:**

- **Truncation error** (mathematical): decreases as h→0.
- **Rounding error** (floating-point): increases as h→0 (catastrophic cancellation in f(x+h)-f(x-h)).

**Total error for central difference:**
```
E_total(h) ≈ (h²/6)|f'''(x)| + (2ε_mach|f(x)|)/h
```

- First term: truncation (grows with h)
- Second term: rounding (shrinks with h — but the 1/h means it grows as h→0)

**Optimal h:** Minimize E_total by differentiating with respect to h and setting to zero:

```
d/dh [(h²/6)|f'''| + 2ε_mach|f|/h] = 0
(h/3)|f'''| - 2ε_mach|f|/h² = 0
h³ = 6ε_mach|f|/|f'''|
h_opt = (6ε_mach)^(1/3) × (|f|/|f'''|)^(1/3)
```

For well-behaved f with |f| ≈ |f'''| ≈ 1:
```
h_opt ≈ (6 × 2.22×10⁻¹⁶)^(1/3) ≈ (1.33×10⁻¹⁵)^(1/3) ≈ 1.1×10⁻⁵
```

**Minimum achievable error:**
```
E_min ≈ (ε_mach)^(2/3) ≈ (2.22×10⁻¹⁶)^(2/3) ≈ 3.7×10⁻¹¹
```

So central difference gives only ~10 significant digits — not 16. You sacrifice 5-6 digits to the differentiation process.

**For forward difference:** h_opt ≈ √ε_mach ≈ 10⁻⁸, giving ~8 significant digits — even worse.

### Demo: Optimal h for f(x) = sin(x) at x=1

```python
import numpy as np

f = np.sin
x = 1.0
true_deriv = np.cos(1.0)  # ≈ 0.5403023

for h in [1e-1, 1e-3, 1e-5, 1e-7, 1e-9, 1e-11, 1e-13]:
    deriv = (f(x+h) - f(x-h)) / (2*h)
    error = abs(deriv - true_deriv)
    print(f"h={h:.0e}: error={error:.2e}")
```

```
h=1e-01: error=1.67e-03
h=1e-03: error=1.67e-07
h=1e-05: error=1.67e-11
h=1e-07: error=1.12e-11  ← rounding starts to dominate
h=1e-09: error=2.78e-09  ← getting worse
h=1e-11: error=3.47e-07  ← catastrophic cancellation
h=1e-13: error=2.78e-05  ← useless
```

The sweet spot is around h = 10⁻⁵ to 10⁻⁶ for central difference.

---

## 7.4 Higher-Order Formulas via Richardson Extrapolation

**Problem:** Central difference gives O(h²) accuracy. Can we do better?

**Richardson extrapolation:** Combine two estimates at different h values to cancel leading error terms.

Let D(h) = [f(x+h) - f(x-h)]/(2h) be the central difference approximation.

From Taylor expansion:
```
D(h) = f'(x) + (h²/6)f'''(x) + (h⁴/120)f⁽⁵⁾(x) + ...
```

Evaluate at h and h/2:
```
D(h)   = f'(x) + C₂h² + C₄h⁴ + ...
D(h/2) = f'(x) + C₂(h/2)² + C₄(h/2)⁴ + ...
       = f'(x) + C₂h²/4 + C₄h⁴/16 + ...
```

Compute 4D(h/2) - D(h):
```
4D(h/2) - D(h) = 4f'(x) - f'(x) + (C₂h²/4×4 - C₂h²) + ...
               = 3f'(x) - (3/4)C₂h² + ...
```

So [4D(h/2) - D(h)] / 3 = f'(x) + O(h⁴) ← **fourth-order accurate!**

**Richardson extrapolation table:**

Start with D values at different h, then combine to cancel error:

```
D(h)
       [4D(h/2)-D(h)]/3                   O(h⁴)
D(h/2)
       [4D(h/4)-D(h/2)]/3
D(h/4)                    [16F₂-F₁]/15   O(h⁶)
       [4D(h/8)-D(h/4)]/3
D(h/8)
```

Each column uses the formula `[4^k × F_right - F_left] / (4^k - 1)` to cancel next order.

This is also called **Romberg differentiation** and produces spectacularly accurate estimates.

---

## 7.5 Second Derivative

Add the two Taylor expansions:
```
f(x+h) + f(x-h) = 2f(x) + h²f''(x) + (h⁴/12)f''''(x) + ...
```

Solve:
```
f''(x) ≈ [f(x+h) - 2f(x) + f(x-h)] / h²
```

**Truncation error:** O(h²) — same order as central difference for first derivative.

**Rounding error:** Now have three quantities in the numerator. Cancellation is even worse:

If |f| ≈ 1 and h = 10⁻⁵: numerator ≈ 10⁻¹⁰ (tiny sum of three O(1) quantities). Rounding error ≈ 3ε_mach/h² ≈ 3×10⁻¹⁶/10⁻¹⁰ = 3×10⁻⁶.

Optimal h_opt for second derivative ≈ (12ε_mach)^(1/4) ≈ 10⁻⁴. Minimum error ≈ ε_mach^(1/2) ≈ 10⁻⁸.

**Practical note:** Numerical second derivatives are inherently less accurate than first derivatives. If you need second derivatives for optimization (Hessian), prefer automatic differentiation or finite difference of the gradient.

---

## 7.6 Complex Step Differentiation

**Problem with real finite differences:** f(x+h) - f(x-h) involves cancellation.

**Brilliant fix:** Evaluate f at complex argument x + ih!

From Taylor expansion in complex arithmetic:
```
f(x + ih) = f(x) + ih·f'(x) - h²f''(x)/2 - ih³f'''(x)/6 + ...
```

Taking the imaginary part:
```
Im[f(x + ih)] = h·f'(x) - h³f'''(x)/6 + ...
```

Solve:
```
f'(x) ≈ Im[f(x + ih)] / h
```

**No cancellation!** The imaginary part of f(x+ih) directly gives h·f'(x) without subtracting two nearly-equal quantities.

**Error:** O(h²) from the h³ term — but since there's no cancellation, h can be tiny:

With h = 10⁻²⁰: error = O(h²) = O(10⁻⁴⁰) — essentially machine epsilon!

```python
def complex_step_deriv(f, x, h=1e-20):
    return f(complex(x, h)).imag / h
```

**Requirement:** f must be holomorphic (analytic in complex plane) — most mathematical functions qualify. Standard library functions (exp, log, sin, etc.) automatically extend to complex arguments.

Used in: aerospace (NASA), structural engineering, automatic differentiation implementations.

---

## 7.7 Automatic Differentiation — The Modern Answer

All finite difference methods are approximations. **Automatic differentiation (AD)** computes EXACT derivatives (up to floating-point rounding) by exploiting the chain rule mechanically.

**Forward mode AD:** Propagate derivatives alongside function values.

For each scalar variable, track (value, derivative):

```
x = (2.0, 1.0)   ← dx/dx = 1
y = x * x = (4.0, 2*2.0*1.0) = (4.0, 4.0)   ← dy/dx = 2x = 4
z = sin(y) = (sin(4), cos(4)*4.0) = (-0.757, -2.615)
```

At the end, z.deriv = dz/dx exactly (no truncation error!).

**Reverse mode AD (Backpropagation):** The mechanism behind neural network training.

Instead of propagating forward, reverse mode:
1. Forward pass: compute all intermediate values
2. Backward pass: propagate gradients backward using chain rule

Cost: O(n) backward pass for gradient of scalar output w.r.t. n inputs — same cost as evaluating the function.

Compare to n forward-mode passes (one per input) — reverse mode wins when n >> 1 outputs.

**Libraries:** PyTorch, TensorFlow, JAX all use reverse mode AD. This is why "backpropagation" is computationally feasible.

---

## Section Challenge

---

**Q1.** Derive the three-point forward difference formula for f'(x) using f(x), f(x+h), f(x+2h). What is its truncation error order?

<details>
<summary>Answer</summary>

Write Taylor expansions:
```
f(x+h)  = f + hf' + (h²/2)f'' + (h³/6)f''' + ...
f(x+2h) = f + 2hf' + (4h²/2)f'' + (8h³/6)f''' + ...
         = f + 2hf' + 2h²f'' + (4h³/3)f''' + ...
```

To eliminate f'': multiply first by 4 and subtract:
```
4f(x+h) - f(x+2h) = 4(f + hf' + h²f''/2 + ...) - (f + 2hf' + 2h²f'' + ...)
                   = 3f + 2hf' - (h²)(4/2 - 2)f'' + ...
                   = 3f + 2hf' - 0·f'' + O(h³)
```

Wait, let me redo: coefficient of h²f'' in 4f(x+h): 4·(1/2) = 2. In f(x+2h): 2·1 = 2. They cancel!

```
4f(x+h) - f(x+2h) = 3f(x) + 2hf'(x) + (h³)(4/6·1 - 8/6)f'''(ξ) + ...
```

Solve for f'(x):
```
f'(x) = [-3f(x) + 4f(x+h) - f(x+2h)] / (2h)
```

**Truncation error:** The next term is O(h²), giving **second-order accuracy** — same as central difference, but using only right-hand evaluations. Useful when x-h is not available (boundary of domain).

(Note: 3-point central difference: [-f(x+2h) + 4f(x+h) - 3f(x)]/(2h) is also O(h²) but biased to the right, useful at left boundaries.)
</details>

---

**Q2.** Apply Richardson extrapolation to improve central difference. Compute f'(1) for f(x) = eˣ using h=0.1 and h=0.05, then combine.

<details>
<summary>Answer</summary>

True value: f'(1) = e¹ ≈ 2.718281828.

**Central difference at h=0.1:**
```
D(0.1) = [e^1.1 - e^0.9] / (2×0.1)
e^1.1 ≈ 3.00416602, e^0.9 ≈ 2.45960311
D(0.1) = (3.00416602 - 2.45960311) / 0.2 = 0.54456291 / 0.2 = 2.72281455
```

**Central difference at h=0.05:**
```
D(0.05) = [e^1.05 - e^0.95] / 0.1
e^1.05 ≈ 2.85765018, e^0.95 ≈ 2.58570831
D(0.05) = (2.85765018 - 2.58570831) / 0.1 = 0.27194187 / 0.1 = 2.71941870
```

**Richardson extrapolation:**
```
D_rich = [4 × D(h/2) - D(h)] / 3 = [4 × 2.71941870 - 2.72281455] / 3
       = [10.87767480 - 2.72281455] / 3
       = 8.15486025 / 3
       = 2.71828675
```

- True value: 2.71828183.
- Error of D(0.1): |2.72281455 - 2.71828183| ≈ 4.5×10⁻³.
- Error of D(0.05): |2.71941870 - 2.71828183| ≈ 1.1×10⁻³.
- Error of Richardson: |2.71828675 - 2.71828183| ≈ 4.9×10⁻⁶.

Richardson improved accuracy by ~1000× using the same two evaluations. ✓
</details>

---

**Q3.** Why does numerical differentiation of noisy data require regularization (smoothing)?

<details>
<summary>Answer</summary>

**The problem:** Suppose f(x) = g(x) + noise(x) where noise has amplitude ε.

Central difference:
```
f'(x) ≈ [f(x+h) - f(x-h)] / (2h) = [g(x+h)+ε₁ - g(x-h)-ε₂] / (2h)
       ≈ g'(x) + (ε₁-ε₂)/(2h)
```

The noise amplification factor is **1/(2h)**. For h = 0.001: factor = 500. For h = 0.0001: factor = 5000.

Small h → catastrophic noise amplification. But large h → large truncation error from true function.

**There's no good h.** Unlike smooth functions where optimal h balances rounding and truncation, noisy data has uncontrolled high-frequency components that any derivative formula amplifies without bound as h→0.

**Fix — Regularization approaches:**

1. **Smooth first, then differentiate:** Fit a smooth model (spline, polynomial, kernel regression) to the noisy data. Differentiate the smooth model analytically.

2. **Tikhonov regularization on the derivative:** Find derivative d(x) that minimizes:
   ```
   Σ(fᵢ - integral of d)² + λ∫(d'(x))² dx
   ```
   The λ term penalizes rapidly-changing derivatives.

3. **Savitzky-Golay filter:** Fit local polynomials with least squares, then compute derivative of the polynomial. Popular in chemistry/spectroscopy.

**Rule:** Never differentiate raw noisy data. Always smooth first.
</details>

---

**Q4.** The complex-step method requires h to be purely imaginary. What happens if you try it on f(x) = |x| near x=0?

<details>
<summary>Answer</summary>

f(x) = |x| = √(x²) in real arithmetic. Extension to complex: f(z) = √(z²)? But |z| for complex z is the complex modulus, which is NOT the same as the real absolute value.

**The issue:** |x| is NOT holomorphic (analytic complex function). It has a corner at x=0 (non-differentiable). In the complex plane, f(z) = |z| is not analytic anywhere — its Cauchy-Riemann equations are never satisfied.

When you try complex step with f(x) = |x|:

At x = 0.5:
```python
f = lambda x: abs(x)
h = 1e-20
result = (f(0.5 + 1j*h)).imag / h
```

Python's `abs` returns the modulus for complex numbers: `abs(0.5 + 1e-20j) = √(0.25 + 1e-40) ≈ 0.5` — a real number. Its imaginary part is 0. Result: 0/h = 0.

But the true derivative of |x| at x=0.5 is +1. The complex step gives 0. Wrong!

**Root cause:** The complex step formula works because `Im[f(x+ih)] = h·Re[f'(x)]` for analytic functions. For non-analytic functions, this equality breaks down.

**Fix:** For f = |x|, use real finite differences OR analytical derivative: f'(x) = sign(x) for x ≠ 0.
</details>

---

**Q5.** Neural network gradient checking: you have analytical gradient g_a and numerical gradient g_n. What relative difference is acceptable? What might cause it to fail?

<details>
<summary>Answer</summary>

**Acceptable relative difference:**

Standard rule of thumb for gradient checking:
```
relative_difference = ||g_a - g_n|| / (||g_a|| + ||g_n||)
```

- < 10⁻⁷: excellent (analytical gradient is almost certainly correct)
- 10⁻⁷ to 10⁻⁵: acceptable (might be numerical precision issues)
- > 10⁻⁵: likely a bug in analytical gradient

Using central differences with h = 10⁻⁵ gives ~10 digits of accuracy. With float32 (ε_mach ≈ 10⁻⁷), use h ≈ 10⁻³ and expect ~5 digits — so 10⁻⁵ relative tolerance is generous.

**Common failure causes:**

1. **ReLU / non-smooth activations:** At x=0, ReLU has no derivative. Central difference straddles the discontinuity → numerical gradient = 0.5, analytical = 0 or 1. Need to avoid checking exactly at kink points.

2. **Batch normalization:** Gradient depends on the batch statistics (mean, variance), which change when you perturb one input. Numerical perturbation affects both the input AND the batch statistics — numerical and analytical gradients measure different things.

3. **Dropout:** Stochastic. Fix the random seed when computing both g_a and g_n, or disable dropout during gradient checking.

4. **Too-large h:** If h = 0.01 and the loss landscape has significant curvature, truncation error dominates → false failure.

5. **Near-zero gradients:** Relative tolerance meaningless when both are near zero. Use absolute tolerance instead.

**Recommendation:** Always use double precision (float64) for gradient checking, even if training in float32.
</details>

---

## Chapter Summary

| Method | Formula | Error | Optimal h | Min error |
|--------|---------|-------|-----------|-----------|
| Forward diff | [f(x+h)-f(x)]/h | O(h) | √ε_mach ≈ 10⁻⁸ | ~10⁻⁸ |
| Central diff | [f(x+h)-f(x-h)]/(2h) | O(h²) | ε_mach^(1/3) ≈ 10⁻⁵ | ~10⁻¹¹ |
| Second deriv | [f(x+h)-2f(x)+f(x-h)]/h² | O(h²) | ε_mach^(1/4) ≈ 10⁻⁴ | ~10⁻⁸ |
| Richardson | 4D(h/2)-D(h)]/3 | O(h⁴) | Same h, better E | ~10⁻¹³ |
| Complex step | Im[f(x+ih)]/h | O(h²) no cancel | h=10⁻²⁰ | ~ε_mach |
| Auto-diff | Exact chain rule | 0 | N/A | ε_mach |

**Rule:** Prefer automatic differentiation (PyTorch/JAX) when available. Use complex step when AD isn't. Use central differences as a fallback. Never differentiate raw noisy data.

---

*Previous: [06 — Least Squares](06_Least_Squares.md)*
*Next: [08 — Numerical Integration](08_Numerical_Integration.md)*
