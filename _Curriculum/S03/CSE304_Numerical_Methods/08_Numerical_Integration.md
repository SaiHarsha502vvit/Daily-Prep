# Chapter 8 — Numerical Integration (Quadrature)

> "Integration is forgiving where differentiation is harsh. Averaging smooths out noise; finite differences amplify it. This is why quadrature can be accurate even with modest effort."

---

## Why Numerical Integration

Many integrals have no closed form:
- `∫₀¹ e^(-x²) dx` (Gaussian, fundamental to statistics)
- `∫₀^π sin(x)/x dx` (sinc function)
- `∫₀¹ √(1-k²sin²θ) dθ` (elliptic integrals, pendulum period)

And many physics/engineering problems produce integrands from simulations — no formula exists at all.

**Quadrature** is the name for numerical integration rules. The goal: approximate ∫_a^b f(x) dx using only a finite number of function evaluations.

---

## 8.1 The Interpolation Foundation

**Key insight:** Every quadrature rule integrates an interpolating polynomial exactly.

Given n+1 nodes x₀,...,xₙ and function values f(xᵢ), build the Lagrange interpolant:
```
p(x) = Σᵢ f(xᵢ) Lᵢ(x)
```

Integrate:
```
∫_a^b f(x) dx ≈ ∫_a^b p(x) dx = Σᵢ f(xᵢ) ∫_a^b Lᵢ(x) dx = Σᵢ wᵢ f(xᵢ)
```

where `wᵢ = ∫_a^b Lᵢ(x) dx` are the **quadrature weights**.

This gives a general framework: choose nodes → derive weights by integrating basis polynomials.

---

## 8.2 Newton-Cotes Formulas (Equally-Spaced Nodes)

### Midpoint Rule (0 evaluations at endpoints)

Use one point at the midpoint m = (a+b)/2:
```
∫_a^b f(x) dx ≈ (b-a) f((a+b)/2)
```

**Error:** O(h³) per step where h = b-a. Surprisingly, this beats trapezoidal despite fewer evaluations — the midpoint is an optimal single-point rule (Gauss-Legendre with n=1 also gives the midpoint).

### Trapezoid Rule (n=1)

Use two endpoints:
```
∫_a^b f(x) dx ≈ (b-a) [f(a) + f(b)] / 2
```

**Derivation:** Interpolate with straight line through (a,f(a)) and (b,f(b)), integrate the line.

**Error:** f(x) - p₁(x) = f''(ξ)(x-a)(x-b)/2 for some ξ.

```
∫_a^b [f(x) - p₁(x)] dx = f''(ξ) ∫_a^b (x-a)(x-b)/2 dx = -f''(ξ)(b-a)³/12
```

**Error per panel:** `E = -(b-a)³/12 · f''(ξ)` — **O(h³)** per panel, **O(h²)** globally.

### Simpson's Rule (n=2)

Three points: a, (a+b)/2, b. Fit a quadratic:
```
∫_a^b f(x) dx ≈ (b-a)/6 · [f(a) + 4f((a+b)/2) + f(b)]
```

**Derivation:** Integrate the Lagrange quadratic. Note the weights 1:4:1 are not uniform — the midpoint gets 4× weight.

**Error:** The quadratic exactly integrates any polynomial of degree ≤ 2. Remarkably, it also integrates cubics exactly (the error term involves f''''). So:

```
E = -(b-a)⁵/2880 · f''''(ξ)   ← O(h⁵) per panel, O(h⁴) globally
```

Simpson's rule achieves 4th-order accuracy despite fitting a degree-2 polynomial. This "superconvergence" happens because the symmetric node placement cancels the cubic error term.

### Composite Rules

Apply the basic rule on each subinterval [xᵢ, xᵢ₊₁] with spacing h = (b-a)/n:

**Composite Trapezoid:**
```
∫_a^b f(x) dx ≈ h/2 [f(x₀) + 2f(x₁) + 2f(x₂) + ... + 2f(xₙ₋₁) + f(xₙ)]
```

Global error: O(h²). If we halve h, error decreases by factor 4.

**Composite Simpson's (n must be even):**
```
∫_a^b f(x) dx ≈ h/3 [f(x₀) + 4f(x₁) + 2f(x₂) + 4f(x₃) + ... + 4f(xₙ₋₁) + f(xₙ)]
```

Global error: O(h⁴). Halving h decreases error by factor 16.

### Worked Example

Compute ∫₀¹ x² dx = 1/3, using n=4 panels.

h = 0.25, nodes: 0, 0.25, 0.5, 0.75, 1.0

f values: 0, 0.0625, 0.25, 0.5625, 1.0

**Trapezoid:**
```
0.25/2 × [0 + 2(0.0625) + 2(0.25) + 2(0.5625) + 1.0]
= 0.125 × [0 + 0.125 + 0.5 + 1.125 + 1.0]
= 0.125 × 2.75 = 0.34375
```

Error: |0.34375 - 0.33333| ≈ 0.0104. O(h²) with h=0.25: ≈ 0.0026 × 4 = 0.0104 ✓

**Simpson's:**
```
0.25/3 × [0 + 4(0.0625) + 2(0.25) + 4(0.5625) + 1.0]
= (1/12) × [0 + 0.25 + 0.5 + 2.25 + 1.0]
= (1/12) × 4.0 = 0.33333...
```

Error: essentially 0 (x² is a polynomial of degree 2 — Simpson's integrates it exactly!). ✓

---

## 8.3 Romberg Integration

**Idea:** Apply Richardson extrapolation to the composite trapezoid rule.

Let T(h) denote the composite trapezoid with step size h. From the Euler-Maclaurin formula:
```
T(h) = I + c₂h² + c₄h⁴ + c₆h⁶ + ...
```

where I is the true integral and cₖ are constants independent of h.

Apply Richardson extrapolation:
```
R₁ = [4T(h/2) - T(h)] / 3 = I + O(h⁴)
R₂ = [4T(h/4) - T(h/2)] / 3 = I + O(h⁴)
```

Extrapolate again: [16R₂ - R₁] / 15 = I + O(h⁶).

**Romberg table:**

```
T(h)
       R₁₁=[4T(h/2)-T(h)]/3
T(h/2)                         R₂₁=[16R₁₂-R₁₁]/15
       R₁₂=[4T(h/4)-T(h/2)]/3
T(h/4)                                                R₃₁=[64R₂₂-R₂₁]/63
       R₁₃=[4T(h/8)-T(h/4)]/3                        ...
T(h/8)                         R₂₂=[16R₁₃-R₁₂]/15
```

Each diagonal level gives one higher order of accuracy. With k halvings and k levels of extrapolation: error is O(h^(2k)).

**Self-convergence criterion:** Stop when two adjacent diagonal entries agree to desired tolerance.

---

## 8.4 Gaussian Quadrature: Optimal Node Placement

Newton-Cotes uses equally-spaced nodes. But what if we CHOOSE the nodes optimally?

**Question:** With n points, can we integrate exactly all polynomials of degree ≤ 2n-1 (instead of ≤ n-1 for Newton-Cotes)?

**Answer: Yes!** Gauss-Legendre quadrature achieves this by choosing both the nodes AND weights optimally.

**Gauss-Legendre nodes and weights on [-1,1]:**

| n | Nodes xᵢ | Weights wᵢ |
|---|----------|-----------|
| 1 | 0 | 2 |
| 2 | ±1/√3 ≈ ±0.577 | 1, 1 |
| 3 | 0, ±√(3/5) ≈ ±0.775 | 8/9, 5/9, 5/9 |
| 4 | ±0.339, ±0.861 | 0.652, 0.348, 0.348, 0.652 |
| 5 | 0, ±0.538, ±0.906 | 0.569, 0.479, 0.237, 0.237, 0.479 |

**For arbitrary [a,b]:** Transform x ∈ [-1,1] to t ∈ [a,b]:
```
∫_a^b f(t) dt = (b-a)/2 × ∫₋₁¹ f((b-a)/2 · x + (a+b)/2) dx ≈ (b-a)/2 × Σᵢ wᵢ f(tᵢ)
```

### Derivation Sketch

The Gauss-Legendre nodes are the roots of the Legendre polynomial P_n(x). These are orthogonal polynomials satisfying ∫₋₁¹ Pₙ(x)Pₘ(x)dx = 0 for n≠m.

**Why these nodes?** A polynomial of degree 2n-1 can be written as p(x) = q(x)Pₙ(x) + r(x) where deg(q) ≤ n-1 and deg(r) ≤ n-1. Then:
```
∫₋₁¹ p(x)dx = ∫₋₁¹ q(x)Pₙ(x)dx + ∫₋₁¹ r(x)dx = 0 + ∫₋₁¹ r(x)dx
```

(First integral is zero by orthogonality of Pₙ with lower-degree polynomials.) And r(x) can be integrated exactly with n-point interpolation through the roots of Pₙ (since r has degree ≤ n-1 = one less than n nodes can handle). ✓

### Comparison

For same number of function evaluations:

| Rule | Order | n points integrates exactly |
|------|-------|---------------------------|
| Trapezoid | 2 | degree 1 |
| Simpson's | 4 | degree 3 |
| 5-point Newton-Cotes | 6 | degree 5 |
| **Gauss-Legendre n=3** | **6** | **degree 5** |
| **Gauss-Legendre n=5** | **10** | **degree 9** |

Gauss-Legendre is twice as efficient as Newton-Cotes in terms of polynomial degree vs evaluations.

---

## 8.5 Adaptive Integration

**Problem:** The integrand might be smooth in some regions and have rapid variations in others. Uniform spacing wastes evaluations where f is flat and misses features where f is spiky.

**Adaptive quadrature:** Subdivide the interval recursively, concentrating evaluations where the integrand changes rapidly.

**Algorithm (adaptive Simpson):**

```python
def adaptive_quad(f, a, b, tol=1e-8, max_depth=50):
    def recurse(a, b, fa, fm, fb, depth):
        m = (a + b) / 2
        simpson_full = (b-a)/6 * (fa + 4*fm + fb)
        
        # Divide and apply Simpson to each half
        m_left = (a + m) / 2
        m_right = (m + b) / 2
        fl, fm_l, fr = f(m_left), f((a+m)/2), f(m)  # wrong: fix
        # Actually:
        fl = f((a + m) / 2)
        fr = f((m + b) / 2)
        simpson_left  = (m-a)/6 * (fa + 4*fl + fm)
        simpson_right = (b-m)/6 * (fm + 4*fr + fb)
        combined = simpson_left + simpson_right
        
        error_est = abs(combined - simpson_full) / 15
        if error_est < tol * (b-a) / (b-a):  # local tolerance
            return combined + error_est
        elif depth >= max_depth:
            return combined
        else:
            return recurse(a, m, fa, fl, fm, depth+1) + \
                   recurse(m, b, fm, fr, fb, depth+1)
    
    fa, fm, fb = f(a), f((a+b)/2), f(b)
    return recurse(a, b, fa, fm, fb, 0)
```

**Error estimation:** The difference between the two-panel and one-panel Simpson estimates is roughly 15× the actual error (from Richardson extrapolation — the error ratio is 2⁴ = 16 for 4th order method; 15 ≈ 16-1). This gives a cheap error estimator.

**Practical adaptive integrators:**

Python `scipy.integrate.quad` uses QUADPACK (Fortran, highly optimized):
- Gauss-Kronrod rules (embedded rules for error estimation)
- Adaptive subdivision
- Handles singularities at endpoints

---

## 8.6 Improper Integrals

### Infinite Limits

`∫₀^∞ f(x) dx` — transform: x = tan(t) or x = e^t/(1-t) to map to finite interval.

Example: `∫₀^∞ e^(-x²) dx = √π/2`. 

Transform: let t = 1/(1+x), x = 1/t - 1, dx = -1/t² dt:
```
∫₀^∞ e^(-x²) dx = ∫₀¹ e^(-(1/t-1)²) / t² dt
```

Now on [0,1] — apply standard quadrature.

**Gauss-Laguerre:** Special quadrature for `∫₀^∞ e^(-x) g(x) dx`:
```
∫₀^∞ e^(-x) g(x) dx ≈ Σᵢ wᵢ g(xᵢ)
```

where xᵢ are roots of Laguerre polynomials.

### Integrable Singularities

`∫₀¹ f(x)/√x dx` — f(x)/√x has integrable singularity at 0.

Gauss-Jacobi quadrature handles `∫₋₁¹ (1-x)^α (1+x)^β g(x) dx` directly with appropriate nodes/weights.

Alternatively: change variable x = t² → dx = 2t dt → removes the √x singularity.

---

## 8.7 Multi-Dimensional Integration (Monte Carlo Preview)

For 1D: deterministic quadrature with n points gives O(n^(-4)) error (for Simpson's) or O(n^(-2k)) for k-th order methods.

For d-dimensional integrals: tensor product quadrature uses nᵈ points. For d=10 and n=10 points per dimension: 10¹⁰ = 10 billion evaluations. Hopeless.

**Monte Carlo integration:** Sample N random points in the domain, average function values:
```
∫_Ω f(x) dx ≈ |Ω| × (1/N) Σᵢ f(xᵢ)   where xᵢ ~ Uniform(Ω)
```

**Error:** O(1/√N) by CLT — independent of dimension d!

With N = 10⁶ samples: error ≈ 10⁻³ regardless of whether d = 1 or d = 100.

**Tradeoff:** Monte Carlo converges slowly (1/√N) but dimension-independently. Deterministic quadrature converges fast in 1D but exponentially costly in high d.

**Rule:** Use deterministic quadrature for d ≤ 4-5. Use Monte Carlo (or quasi-Monte Carlo) for d ≥ 6-8.

---

## Section Challenge

---

**Q1.** Apply composite Simpson's rule to ∫₀² e^x dx with n=4 panels (5 points). Compare to exact value e² - 1 ≈ 6.389056.

<details>
<summary>Answer</summary>

h = 0.5, nodes: 0, 0.5, 1.0, 1.5, 2.0

f values (eˣ): 1.0, 1.6487, 2.7183, 4.4817, 7.3891

Simpson: h/3 × [f₀ + 4f₁ + 2f₂ + 4f₃ + f₄]
= 0.5/3 × [1.0 + 4(1.6487) + 2(2.7183) + 4(4.4817) + 7.3891]
= (1/6) × [1.0 + 6.5948 + 5.4366 + 17.9268 + 7.3891]
= (1/6) × 38.3473
= 6.39122

True value: 6.38906.

Error: |6.39122 - 6.38906| ≈ 0.00216.

O(h⁴) with h=0.5: 0.5⁴/180 × max|f''''(ξ)| × (2-0) ≈ 0.0625/180 × e² × 2 ≈ 0.00495.

Actual error is within this bound ✓.

With n=8 (h=0.25): error should decrease by factor 2⁴=16 → ≈ 0.00216/16 ≈ 0.000135. O(h⁴) convergence confirmed.
</details>

---

**Q2.** Derive the weights for 2-point Gauss-Legendre quadrature on [-1,1]: show that nodes x = ±1/√3 and weights w₁=w₂=1 exactly integrate polynomials of degree ≤ 3.

<details>
<summary>Answer</summary>

**Claim:** ∫₋₁¹ f(x) dx ≈ f(-1/√3) + f(1/√3) integrates all polynomials of degree ≤ 3 exactly.

**Verify for all basis monomials (enough to check monomials by linearity):**

- **f(x) = 1:** True = 2. Approx = 1 + 1 = 2 ✓
- **f(x) = x:** True = 0. Approx = -1/√3 + 1/√3 = 0 ✓ (odd function)
- **f(x) = x²:** True = 2/3. Approx = 1/3 + 1/3 = 2/3 ✓
- **f(x) = x³:** True = 0. Approx = (-1/√3)³ + (1/√3)³ = 0 ✓ (odd function)
- **f(x) = x⁴:** True = 2/5 = 0.4. Approx = (1/√3)⁴ + (1/√3)⁴ = 2/9 ≠ 0.4 ✗

So it integrates degree ≤ 3 exactly but NOT degree 4 — consistent with "2n-1 = 3" for n=2. ✓

**Why ±1/√3?** The 2-point Gauss-Legendre nodes are roots of P₂(x) = (3x²-1)/2, giving 3x²-1=0 → x=±1/√3. ✓
</details>

---

**Q3.** Romberg integration uses Richardson extrapolation on the composite trapezoidal rule. Show that [4T(h/2) - T(h)]/3 gives the composite Simpson's rule.

<details>
<summary>Answer</summary>

Let h = (b-a)/n (n panels, n+1 nodes). Nodes xᵢ = a + i·h.

Composite trapezoidal T(h):
```
T(h) = h/2 [f(x₀) + 2f(x₁) + ... + 2f(xₙ₋₁) + f(xₙ)]
```

Composite trapezoidal T(h/2) — uses midpoints too, 2n panels, 2n+1 nodes (xᵢ and midpoints mᵢ = xᵢ + h/2):
```
T(h/2) = h/4 [f(x₀) + 2f(m₀) + 2f(x₁) + 2f(m₁) + ... + 2f(xₙ₋₁) + 2f(mₙ₋₁) + f(xₙ)]
```

Now compute 4T(h/2) - T(h):
```
4T(h/2) = h [f(x₀) + 2f(m₀) + 2f(x₁) + 2f(m₁) + ... + 2f(xₙ₋₁) + 2f(mₙ₋₁) + f(xₙ)]

T(h) = h/2 [f(x₀) + 2f(x₁) + ... + 2f(xₙ₋₁) + f(xₙ)]

4T(h/2) - T(h) = h[f(x₀) + 2f(m₀) + 2f(x₁) + ...] 
                - h/2[f(x₀) + 2f(x₁) + ...]

Coefficient of f(x₀): h - h/2 = h/2
Coefficient of f(xᵢ) for i=1,...,n-1: 2h - h = h (wait...)
```

Let me be more careful:

```
4T(h/2): h·f(x₀) + 2h·f(m₀) + 2h·f(x₁) + 2h·f(m₁) + ... + 2h·f(xₙ₋₁) + 2h·f(mₙ₋₁) + h·f(xₙ)

T(h): (h/2)f(x₀) + h·f(x₁) + h·f(x₂) + ... + h·f(xₙ₋₁) + (h/2)f(xₙ)

Subtract:
f(x₀): h - h/2 = h/2
f(xᵢ) i=1,...,n-1: 2h - h = h  
f(xₙ): h - h/2 = h/2
f(mᵢ): 2h - 0 = 2h
```

So [4T(h/2) - T(h)] / 3:

```
= (h/3)[f(x₀)/2 + 2f(m₀) + f(x₁) + 2f(m₁) + ... + f(xₙ₋₁) + 2f(mₙ₋₁) + f(xₙ)/2] × ... 
```

Hmm let me write out one interval [x₀, x₁] with midpoint m₀:

Contribution: (h/6)[f(x₀) + 4f(m₀) + f(x₁)]

This is exactly the Simpson's rule on [x₀,x₁]!

Similarly for each interval. Summing over all n intervals gives composite Simpson's. □

**Conclusion:** Richardson extrapolation applied to the trapezoidal rule gives Simpson's rule. This shows that Romberg's method automatically discovers these better quadrature rules through successive extrapolation.
</details>

---

**Q4.** Estimate how many function evaluations the composite Simpson's rule needs to achieve error < 10⁻⁸ for ∫₀¹ sin(πx) dx. (True value = 2/π.)

<details>
<summary>Answer</summary>

True value: 2/π ≈ 0.6366.

Composite Simpson's error: |E| ≤ (b-a)h⁴/180 × max|f''''(ξ)|.

f(x) = sin(πx), f''''(x) = π⁴ sin(πx). Max on [0,1]: π⁴ × 1 = π⁴ ≈ 97.41.

Error bound:
```
|E| ≤ (1)(h⁴)/180 × π⁴ = π⁴ h⁴/180
```

Want: π⁴ h⁴/180 < 10⁻⁸

```
h⁴ < 180 × 10⁻⁸ / π⁴ = 180 × 10⁻⁸ / 97.41 ≈ 1.848 × 10⁻⁸
h < (1.848 × 10⁻⁸)^(1/4) ≈ 1.167 × 10⁻²
```

Number of panels: n = 1/h > 1/0.01167 ≈ 86.

**Round up to nearest even (Simpson's requires even panels): n = 88.**

Number of function evaluations: n + 1 = **89 evaluations**.

Compare to trapezoid: need O(h²) accuracy → h < 10⁻⁴ → n = 10,000 → 10,001 evaluations. Simpson's is ~113× more efficient here.
</details>

---

**Q5.** For a 10-dimensional integral over [0,1]¹⁰, how many points does Monte Carlo need to achieve error < 0.01, and how does this compare to 10-point Gauss-Legendre tensor product?

<details>
<summary>Answer</summary>

**Monte Carlo:** Error ≈ σ/√N where σ is the standard deviation of f.

For error ε = 0.01 and σ ≈ 1: N ≈ 1/ε² = 1/0.0001 = **10,000 samples**.

**10-point Gauss-Legendre tensor product (10D):**

Total evaluations: 10¹⁰ = **10 billion** function evaluations.

Even at 10⁹ evaluations/second: 10 seconds computation.

For comparison, the equivalent 1D accuracy of 10-point GL would be error ≈ 10⁻²⁰ — absurdly accurate in 1D, but we need 10^10 points to get it in 10D.

**The curse of dimensionality:** Tensor product costs grow exponentially with dimension. Monte Carlo's O(1/√N) error is independent of dimension — the same 10,000 samples work whether d=1 or d=100.

**Practical break-even point:** For d ≥ 4-5, Monte Carlo (or quasi-Monte Carlo, which achieves O(1/N) convergence) typically beats tensor product quadrature.

For this 10D example:
- Monte Carlo with 10,000 points: 10,000 evaluations, error ≈ 0.01
- Tensor 10-point GL: 10 billion evaluations, error ≈ tiny but impractical

Monte Carlo wins by a factor of 10⁶ in evaluation count.
</details>

---

## Chapter Summary

| Method | Error (global) | Best For |
|--------|---------------|---------|
| Trapezoid | O(h²) | Simple, smooth functions |
| Simpson's | O(h⁴) | Standard choice for 1D |
| Gauss-Legendre n-pt | O(h^(2n)) | Smooth functions, minimum evaluations |
| Romberg | O(h^(2k)) | When can halve h repeatedly |
| Adaptive (QUADPACK) | User-specified | Non-smooth, singularities, production use |
| Monte Carlo | O(1/√N) | High dimensions (d ≥ 5) |

**Key insight:** Integration is forgiving (averaging) — quadrature methods converge fast. Differentiation is unforgiving (amplifying) — rounding limits accuracy. This fundamental asymmetry explains why numerical integration is much easier than numerical differentiation.

---

*Previous: [07 — Numerical Differentiation](07_Numerical_Differentiation.md)*
*Next: [09 — ODEs: Initial Value Problems](09_ODE_Initial_Value.md)*
