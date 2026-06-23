# Chapter 2 — Root Finding

> "A root finder doesn't solve the equation. It narrows down an interval until the answer can't hide anymore."

---

## The Problem

Find x* such that f(x*) = 0.

This is one of the oldest computational problems:
- Find where a profit model equals zero (break-even analysis)
- Find where net force is zero (equilibrium in physics)
- Find where an ODE's nullclines intersect
- Find eigenvalues (det(A - λI) = 0)

**The trap:** You almost never solve f(x) = 0 analytically. For polynomials of degree ≥ 5, there's no general formula (Abel's impossibility theorem). For transcendental equations like x = cos(x), there's no closed form at all.

Numerical root finding is the only option.

---

## 2.1 Bisection Method: Guaranteed but Slow

**Prerequisite (Intermediate Value Theorem):** If f is continuous on [a,b] and f(a) and f(b) have opposite signs, then there exists x* ∈ (a,b) with f(x*) = 0.

**Algorithm:** Binary search on the sign change.

```
1. Find [a, b] such that f(a) · f(b) < 0 (sign change)
2. Compute midpoint m = (a + b) / 2
3. If f(m) · f(a) < 0: root is in [a, m], set b = m
   Else: root is in [m, b], set a = m
4. Repeat until |b - a| < tolerance
```

**Convergence:** After n iterations, the interval has width |b-a|/2ⁿ.

To achieve error ≤ ε starting from interval of width δ:
```
n ≥ log₂(δ/ε)
```

**Example:** Find root of f(x) = x³ - 2x - 5 in [2, 3].

f(2) = 8 - 4 - 5 = -1 < 0
f(3) = 27 - 6 - 5 = 16 > 0 ← sign change confirmed

```
Iter 1: m = 2.5,  f(2.5) = 15.625 - 5 - 5 = 5.625 > 0  → root in [2, 2.5]
Iter 2: m = 2.25, f(2.25) = 11.39 - 4.5 - 5 = 1.89 > 0 → root in [2, 2.25]
Iter 3: m = 2.125, f(2.125) = 9.59 - 4.25 - 5 = 0.34 > 0 → root in [2, 2.125]
Iter 4: m = 2.0625, f(2.0625) = 8.77 - 4.125 - 5 = -0.36 < 0 → root in [2.0625, 2.125]
...
```

True root: x* ≈ 2.0946.

**Convergence rate:** Linear. Each iteration gives exactly 1 bit of precision. Slow but absolutely guaranteed — bisection never diverges.

**Failure modes:**
- f has no sign change across root (e.g., f(x) = x² touches x-axis at 0)
- Multiple roots in interval (bisection finds ONE, not all)
- f has sign change but no root (discontinuity — needs continuous f)

---

## 2.2 Newton-Raphson: Quadratic Convergence

**Idea:** Linearize f at current guess xₙ. The root of the linear approximation is the new guess.

Taylor expansion: `f(xₙ + h) ≈ f(xₙ) + f'(xₙ)·h`

Set this to 0: `h = -f(xₙ)/f'(xₙ)`

**Newton-Raphson iteration:**
```
x_{n+1} = xₙ - f(xₙ)/f'(xₙ)
```

**Geometric interpretation:** Draw the tangent line to f at (xₙ, f(xₙ)). Where it crosses the x-axis is xₙ₊₁.

### Convergence Analysis

Let x* be the true root and eₙ = xₙ - x* be the error.

Taylor expand f(xₙ) = f(x* + eₙ):
```
f(xₙ) = f(x*) + f'(x*)eₙ + (1/2)f''(x*)eₙ² + ...
       = 0 + f'(x*)eₙ + (1/2)f''(x*)eₙ² + ...
```

The update step:
```
xₙ₊₁ = xₙ - f(xₙ)/f'(xₙ)
x_{n+1} - x* = xₙ - x* - f(xₙ)/f'(xₙ)
eₙ₊₁ = eₙ - [f'(x*)eₙ + (1/2)f''(x*)eₙ²] / [f'(x*) + f''(x*)eₙ + ...]
```

When f'(x*) ≠ 0, the leading terms cancel:
```
eₙ₊₁ ≈ -[f''(x*)/(2f'(x*))] · eₙ²
```

**Quadratic convergence:** The error at step n+1 is proportional to eₙ². If eₙ = 10⁻³, then eₙ₊₁ ≈ 10⁻⁶. Digits double with each iteration.

**Example:** f(x) = x³ - 2x - 5, x₀ = 2:

```
x₁ = 2 - f(2)/f'(2) = 2 - (-1)/(3·4-2) = 2 - (-1)/10 = 2.1
x₂ = 2.1 - f(2.1)/f'(2.1) = 2.1 - (0.061)/(11.23) ≈ 2.0946
x₃ ≈ 2.09455148 (already ~8 correct digits)
```

Bisection needed 50+ iterations for the same precision. Newton did it in 3.

### Newton-Raphson Failure Modes

**1. Division by zero:** f'(xₙ) = 0 (landed on a critical point).

**2. Divergence:** If x₀ is far from x* or f is highly curved:

```
f(x) = arctan(x), x₀ = 1.5
f'(x) = 1/(1+x²)
x₁ = 1.5 - arctan(1.5)/(1/(1+2.25)) = 1.5 - 0.9828·3.25 ≈ -1.7 ← jumped!
```

Newton can oscillate or diverge entirely.

**3. Multiple roots:** If f(x*) = f'(x*) = 0 (double root), convergence drops to linear. Fix: use modified Newton: `xₙ₊₁ = xₙ - m·f(xₙ)/f'(xₙ)` where m is the multiplicity.

**4. No derivative:** Newton requires f'. For black-box f, use the secant method (next section).

---

## 2.3 Secant Method: Newton Without the Derivative

**Idea:** Approximate f'(xₙ) using two previous iterates:

```
f'(xₙ) ≈ [f(xₙ) - f(xₙ₋₁)] / [xₙ - xₙ₋₁]
```

**Secant iteration:**
```
x_{n+1} = xₙ - f(xₙ) · (xₙ - xₙ₋₁) / (f(xₙ) - f(xₙ₋₁))
```

**Starting:** Need two initial guesses x₀, x₁ (not a bracket — no sign change required).

**Convergence:** Superlinear, order φ ≈ 1.618 (the golden ratio). Better than bisection (linear), worse than Newton (quadratic). Each iteration requires only 1 new function evaluation (Newton needs f and f').

**Example:** f(x) = x³ - 2x - 5, x₀ = 2, x₁ = 3:

```
f(2) = -1, f(3) = 16
x₂ = 3 - 16·(3-2)/(16-(-1)) = 3 - 16/17 ≈ 2.059
f(2.059) ≈ -0.35
x₃ = 2.059 - (-0.35)·(2.059-3)/(-0.35-16) ≈ 2.091
...converges to 2.09455
```

---

## 2.4 False Position (Regula Falsi)

Combination of bisection (bracketing guarantee) and secant (linear interpolation):

```
x_{n+1} = xₙ - f(xₙ) · (xₙ - xₙ₋₁) / (f(xₙ) - f(xₙ₋₁))
```

But after computing xₙ₊₁, keep the bracketing property: update a or b to maintain sign change.

**Advantage over bisection:** Faster convergence (uses function values, not just signs).

**Disadvantage:** Can stagnate if one bracket endpoint never moves. Illinois method fixes this by halving the function value at the stagnant endpoint.

---

## 2.5 Brent's Method: Best in Practice

Brent's method combines:
1. Bisection (guaranteed convergence)
2. Secant / inverse quadratic interpolation (superlinear convergence when it works)

**Strategy:** Try inverse quadratic interpolation (fit quadratic to three points, take the root). If the result is inside the bracket and better than bisection, use it. Otherwise, bisect.

This is the method used by Python's `scipy.optimize.brentq` — it's the standard "use this when you don't know what else to do" root finder.

```python
from scipy.optimize import brentq
root = brentq(lambda x: x**3 - 2*x - 5, 2, 3)
# Returns: 2.094551481698784
```

---

## 2.6 Systems of Equations: Multivariate Newton

Find x* ∈ Rⁿ such that F(x*) = 0 where F: Rⁿ → Rⁿ.

**Newton's method for systems:**
```
x_{n+1} = xₙ - J(xₙ)⁻¹ F(xₙ)
```

where J is the **Jacobian matrix**:
```
J_{ij} = ∂Fᵢ/∂xⱼ
```

In practice, never compute J⁻¹ explicitly. Instead solve the linear system:
```
J(xₙ) Δx = -F(xₙ)
x_{n+1} = xₙ + Δx
```

**Cost:** Each Newton step requires:
1. Evaluate F (n function evaluations)
2. Evaluate J (n² derivative evaluations or finite differences)
3. Solve linear system J Δx = -F: O(n³) by Gaussian elimination

For large n, the O(n³) solve dominates. This leads to **quasi-Newton methods** (Chapter 11: optimization) which approximate J to avoid expensive recomputation.

**Convergence:** Still quadratic (near solution), but each step is O(n³) expensive.

---

## 2.7 Convergence Orders — Summary

| Method | Convergence Order | Evaluations/step | Notes |
|--------|------------------|-----------------|-------|
| Bisection | 1 (linear) | 1 | Guaranteed, always works |
| False position | 1 (linear, faster c) | 1 | Can stagnate |
| Secant | 1.618 (superlinear) | 1 | No derivative needed |
| Newton-Raphson | 2 (quadratic) | 2 (f and f') | Fast, may diverge |
| Halley's method | 3 (cubic) | 3 | Rare; needs f'' |
| Brent's | 1-2 (adaptive) | 1 | Best general choice |

**Order p convergence** means: |eₙ₊₁| ≤ C|eₙ|ᵖ for some C < 1.

- Linear (p=1): gain ~constant digits per step (slow)
- Quadratic (p=2): digits double per step (fast)
- Cubic (p=3): digits triple per step (very fast but expensive)

---

## 2.8 Stopping Criteria

When do you stop iterating? Several options:

**Absolute tolerance on x:**
```
|xₙ₊₁ - xₙ| < tol_x
```
Works when you know the magnitude of x*.

**Relative tolerance on x:**
```
|xₙ₊₁ - xₙ| / |xₙ| < tol_x
```
Better for large magnitudes.

**Function value tolerance:**
```
|f(xₙ)| < tol_f
```
Stops when f is close to zero — but this can fail if f is very flat near the root (f small even far from root).

**Combined:**
```python
while abs(f(x)) > tol_f and abs(delta_x) > tol_x:
    # iterate
```

**Maximum iterations:** Always cap iterations to prevent infinite loops:
```python
for i in range(max_iter):
    # iterate
    if converged: break
else:
    raise RuntimeError("Failed to converge")
```

---

## Section Challenge

---

**Q1.** How many bisection iterations are needed to find a root of f(x) = e^x - 3 in [0, 2] to 10 decimal places of accuracy?

<details>
<summary>Answer</summary>

Initial interval width: δ = 2 - 0 = 2.

Target accuracy: ε = 10⁻¹⁰.

Number of iterations: n ≥ log₂(δ/ε) = log₂(2/10⁻¹⁰) = log₂(2 × 10¹⁰) = 1 + log₂(10¹⁰) = 1 + 10·log₂(10) ≈ 1 + 10·3.322 = 34.22.

**n = 35 iterations.**

True root: x* = ln(3) ≈ 1.0986.

After 35 iterations, interval width ≤ 2/2³⁵ = 2/34359738368 ≈ 5.8 × 10⁻¹¹ < 10⁻¹⁰. ✓
</details>

---

**Q2.** Apply Newton-Raphson to find √2 by rewriting it as f(x) = x² - 2 = 0. Derive the iteration formula and show 3 steps from x₀ = 1.

<details>
<summary>Answer</summary>

f(x) = x² - 2, f'(x) = 2x.

Newton iteration:
```
x_{n+1} = xₙ - f(xₙ)/f'(xₙ) = xₙ - (xₙ² - 2)/(2xₙ)
         = (xₙ + 2/xₙ) / 2
```

This is the **Babylonian method** for √2, known for ~4000 years!

Steps from x₀ = 1:
```
x₁ = (1 + 2/1)/2 = 1.5
x₂ = (1.5 + 2/1.5)/2 = (1.5 + 1.333...)/2 = 1.41666...
x₃ = (1.41666... + 2/1.41666...)/2 = (1.41666... + 1.41176...)/2 = 1.41421356...
```

True √2 = 1.41421356237...

After 3 steps, we have 8 correct digits. Quadratic convergence in action — digits roughly double each step.
</details>

---

**Q3.** Newton-Raphson for f(x) = x^(1/3) (cube root) starting at x₀ = 0.1 often fails or converges slowly. Why?

<details>
<summary>Answer</summary>

f(x) = x^(1/3), root at x* = 0.

f'(x) = (1/3)x^(-2/3).

Newton step:
```
x_{n+1} = xₙ - f(xₙ)/f'(xₙ) = xₙ - x^(1/3) / ((1/3)x^(-2/3))
         = xₙ - 3xₙ^(1/3) · xₙ^(2/3) = xₙ - 3xₙ = -2xₙ
```

Each step MULTIPLIES the distance from the root by 2:
```
x₀ = 0.1
x₁ = -0.2
x₂ = 0.4
x₃ = -0.8
...diverges!
```

**Root cause:** f'(0) = ∞. The tangent line at any point near x=0 has enormous slope, shooting the next iterate far away.

**Fix:** x^(1/3) has a cusp at x=0 — not differentiable there. Newton's method requires f' to behave well near the root. For roots where f'(x*) = 0 or f'(x*) = ∞, use bisection or Halley's method.
</details>

---

**Q4.** Implement Brent's stopping criterion in pseudo-code: stop when |xₙ₊₁ - xₙ| ≤ 2ε_mach|xₙ| + tol/2, where tol is user-specified.

<details>
<summary>Answer</summary>

```python
def brent_stop(x_new, x_old, tol, eps_mach=2.22e-16):
    """
    Returns True if the iteration has converged.
    Criterion: the step size is smaller than machine precision times
    the current estimate, OR smaller than the tolerance.
    """
    return abs(x_new - x_old) <= 2 * eps_mach * abs(x_new) + tol / 2
```

**Why this formula:**

- `2 * eps_mach * abs(x_new)`: accounts for the irreducible machine error in representing x_new. You can't do better than ε_mach × |x| on a float64 machine.
- `tol / 2`: the user-specified tolerance, halved to avoid false convergence from just reaching tol.
- The `+` means: stop when EITHER the machine precision limit is hit OR the tolerance is satisfied.

This prevents infinite loops when the algorithm stagnates at machine precision (requesting `tol = 0` is handled gracefully — you stop at floating-point limit).
</details>

---

**Q5.** Why is the secant method faster than bisection even though both use 1 function evaluation per step?

<details>
<summary>Answer</summary>

Convergence rate measures how *quickly* the error shrinks per step, not how many evaluations each step uses.

**Bisection:** Each step halves the interval regardless of f's shape:
```
eₙ₊₁ ≤ eₙ / 2
```
Error shrinks linearly — constant reduction factor of 1/2.

**Secant:** Uses the *values* of f, not just signs. If f is nearly linear near x*, the secant line is a good approximation of f, and the next iterate is very close to x*:
```
eₙ₊₁ ≈ C · eₙ^φ   (φ ≈ 1.618)
```

When eₙ = 10⁻³:
- Bisection: eₙ₊₁ ≈ 5 × 10⁻⁴ (halved)
- Secant: eₙ₊₁ ≈ C × (10⁻³)^1.618 ≈ C × 10⁻⁴·⁸ (much smaller)

Over many iterations, the secant method pulls ahead dramatically because its reduction improves as the solution is approached (superlinear), while bisection's constant halving is always the same rate.

**Practical comparison:** For 15 digits of accuracy:
- Bisection: ~50 iterations
- Secant: ~15-20 iterations
- Newton: ~5-8 iterations
</details>

---

## Chapter Summary

| Method | Formula | Order | Best For |
|--------|---------|-------|---------|
| Bisection | m = (a+b)/2, update bracket | 1 | Guaranteed, slow, when nothing else works |
| Newton-Raphson | xₙ₊₁ = xₙ - f/f' | 2 | When f' available, good initial guess |
| Secant | use two previous points | φ≈1.618 | When f' unavailable |
| False position | secant with bracket | 1 | When bracket needed but secant tried |
| Brent's | bisect + secant + interpolation | adaptive | General-purpose gold standard |

**Key insight:** Convergence order matters exponentially. Newton's quadratic convergence is not "twice as fast" as bisection — it's fundamentally different. After n steps, Newton has O(2ⁿ) correct digits while bisection has O(n) correct digits.

---

*Previous: [01 — Floating Point](01_Floating_Point_Error_Analysis.md)*
*Next: [03 — Linear Systems: Direct Methods](03_Linear_Systems_Direct.md)*
