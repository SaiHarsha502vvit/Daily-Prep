# Chapter 5 — Polynomial Interpolation

> "Given n+1 data points, there's exactly one polynomial of degree ≤ n passing through all of them. The interesting question is: is that polynomial any good?"

---

## The Problem

You have data: (x₀, y₀), (x₁, y₁), ..., (xₙ, yₙ) — measured, tabulated, or sampled.

You want to:
1. Evaluate the underlying function between data points (interpolation)
2. Integrate or differentiate the function (next chapters)
3. Compress the data (fewer numbers than the full dataset)

**Why polynomials?** They're the simplest functions: easy to evaluate, differentiate, integrate. The Weierstrass theorem guarantees that any continuous function can be approximated arbitrarily well by polynomials.

**But:** High-degree polynomials have problems. This chapter derives *what* those problems are and how to avoid them.

---

## 5.1 Existence and Uniqueness

**Theorem:** Given n+1 distinct points (x₀,y₀), ..., (xₙ,yₙ), there exists a unique polynomial p(x) of degree ≤ n such that p(xᵢ) = yᵢ for all i.

**Proof (existence):** Lagrange construction (§5.2).

**Proof (uniqueness):** Suppose p and q both interpolate. Then r = p-q has degree ≤ n and vanishes at all n+1 points. A nonzero polynomial of degree ≤ n has at most n roots. So r ≡ 0, meaning p = q. □

---

## 5.2 Lagrange Interpolation

**Idea:** Build a basis of polynomials where each basis polynomial equals 1 at one node and 0 at all others.

**Lagrange basis polynomials:**
```
L_k(x) = ∏_{j≠k} (x - xⱼ)/(xₖ - xⱼ)
```

Properties:
- L_k(xₖ) = 1 (all factors are 1)
- L_k(xⱼ) = 0 for j ≠ k (one factor is 0)
- Degree exactly n

**Lagrange interpolating polynomial:**
```
p(x) = Σₖ yₖ L_k(x)
```

**Verification:** p(xᵢ) = Σₖ yₖ L_k(xᵢ) = yᵢ × 1 + Σ_{k≠i} yₖ × 0 = yᵢ ✓

### Worked Example

Points: (0,1), (1,3), (2,7).

```
L₀(x) = (x-1)(x-2)/((0-1)(0-2)) = (x-1)(x-2)/2
L₁(x) = (x-0)(x-2)/((1-0)(1-2)) = x(x-2)/(-1) = -x(x-2)
L₂(x) = (x-0)(x-1)/((2-0)(2-1)) = x(x-1)/2
```

Polynomial:
```
p(x) = 1·(x-1)(x-2)/2 + 3·(-x(x-2)) + 7·x(x-1)/2
```

Expand (x=0.5):
```
L₀(0.5) = (0.5-1)(0.5-2)/2 = (-0.5)(-1.5)/2 = 0.375
L₁(0.5) = -0.5(0.5-2) = -0.5·(-1.5) = 0.75
L₂(0.5) = 0.5(0.5-1)/2 = 0.5·(-0.5)/2 = -0.125

p(0.5) = 1·0.375 + 3·0.75 + 7·(-0.125) = 0.375 + 2.25 - 0.875 = 1.75
```

### Cost and Problems with Lagrange

**Evaluation:** Each L_k requires n multiplications. With n+1 basis polynomials, total cost is O(n²) per evaluation. Worse: adding a new point means recomputing all basis polynomials.

**Better formulations:** Barycentric Lagrange (§5.5) achieves O(n) per evaluation.

---

## 5.3 Newton's Divided Differences

More practical than Lagrange for incremental computation and recursive structure.

**Divided differences (recursive definition):**

Order 0: `f[xₖ] = yₖ`

Order 1: `f[xₖ, xₖ₊₁] = (f[xₖ₊₁] - f[xₖ]) / (xₖ₊₁ - xₖ)`

Order k: `f[x₀,...,xₖ] = (f[x₁,...,xₖ] - f[x₀,...,xₖ₋₁]) / (xₖ - x₀)`

**Newton's interpolating polynomial:**
```
p(x) = f[x₀] + f[x₀,x₁](x-x₀) + f[x₀,x₁,x₂](x-x₀)(x-x₁) + ...
     = Σₖ f[x₀,...,xₖ] · ∏_{j<k} (x-xⱼ)
```

**The triangle of divided differences:**

For points (0,1), (1,3), (2,7):

```
i  xᵢ  f[xᵢ]  Order 1    Order 2
0   0    1
                (3-1)/(1-0)=2
1   1    3                  (4-2)/(2-0)=1
                (7-3)/(2-1)=4
2   2    7
```

Newton coefficients: a₀=1, a₁=2, a₂=1.

```
p(x) = 1 + 2(x-0) + 1(x-0)(x-1) = 1 + 2x + x(x-1) = x² + x + 1
```

**Verify:** p(0)=1 ✓, p(1)=3 ✓, p(2)=7 ✓

**Advantage:** Adding a new point (x₃,y₃) just extends the table — only one new column needed. The previous coefficients are unchanged.

### Horner's Method for Evaluation

Evaluate nested form efficiently:
```
p(x) = a₀ + (x-x₀)(a₁ + (x-x₁)(a₂ + (x-x₂)(a₃ + ...)))
```

This requires O(n) additions and multiplications — same as evaluating any degree-n polynomial.

```python
def newton_eval(x, x_nodes, coeffs):
    """Horner's method for Newton form"""
    n = len(coeffs)
    result = coeffs[-1]
    for i in range(n-2, -1, -1):
        result = coeffs[i] + (x - x_nodes[i]) * result
    return result
```

---

## 5.4 Runge's Phenomenon: The Danger of High-Degree Polynomials

**Problem:** Take Runge's function `f(x) = 1/(1 + 25x²)` on [-1, 1].

Interpolate with equally-spaced nodes at n+1 points (n = 2, 4, 8, 16, ...).

**Expectation:** More points → better approximation.

**Reality:** The interpolating polynomial oscillates wildly near the edges:

```
n = 10: max error ≈ 0.29
n = 14: max error ≈ 1.0  (worse!)
n = 20: max error ≈ 4.4  (much worse!)
```

As n → ∞, the interpolation error grows unboundedly for equally-spaced nodes!

**Why:** The interpolation error formula is:
```
f(x) - p(x) = f^(n+1)(ξ) / (n+1)! · ∏ᵢ(x - xᵢ)
```

The term ω(x) = ∏ᵢ(x - xᵢ) is small near the center but explodes near the edges for equally-spaced nodes. The derivative f^(n+1)(ξ) also grows. Together they produce oscillation.

**The fix: Chebyshev nodes.**

---

## 5.5 Chebyshev Nodes

**Minimize the oscillation product:** Choose nodes to minimize max|ω(x)| over [-1,1].

The optimal nodes are:
```
xₖ = cos((2k+1)π / (2n+2))   for k = 0, 1, ..., n
```

These are the zeros of the Chebyshev polynomial Tₙ₊₁(x) = cos((n+1)arccos(x)).

**Key property:** With Chebyshev nodes:
```
max_{x∈[-1,1]} |ω(x)| = 1/2ⁿ
```

(The minimum possible value for any set of n+1 nodes!)

**Error bound with Chebyshev nodes:**
```
max |f(x) - p(x)| ≤ max |f^(n+1)(x)| / (2ⁿ(n+1)!)
```

This decreases with n (for smooth f), fixing Runge's phenomenon.

**Chebyshev nodes mapped to [a,b]:**
```
xₖ = (a+b)/2 + (b-a)/2 · cos((2k+1)π/(2n+2))
```

### Runge's function revisited with Chebyshev nodes:

```
n = 10: max error ≈ 0.00067  (vs 0.29 for uniform)
n = 20: max error ≈ 0.0000004 (vs 4.4 for uniform)
```

Dramatic improvement. Chebyshev nodes are almost always the right choice for polynomial interpolation.

---

## 5.6 Barycentric Lagrange Interpolation

**Standard Lagrange evaluation:** O(n²) per point — too slow for large n.

**Barycentric form:** Rewrite using weights wₖ:

```
wₖ = 1 / ∏_{j≠k}(xₖ - xⱼ)
```

The interpolant becomes:
```
p(x) = [Σₖ wₖ/(x-xₖ) · yₖ] / [Σₖ wₖ/(x-xₖ)]
```

**Cost per evaluation:** O(n) (precompute weights once in O(n²), then each evaluation is O(n)).

**Stability:** The barycentric form is numerically stable — the division by the sum acts as automatic normalization.

**Adding a point:** Update weights: wₖ^new = wₖ^old/(xₖ - xₙ₊₁) and wₙ₊₁ = 1/∏_{j}(xₙ₊₁ - xⱼ). O(n).

**Chebyshev weights have a simple form:**
```
wₖ = (-1)ᵏ sin((2k+1)π/(2n+2))
```

This makes barycentric Chebyshev interpolation extremely fast and stable.

---

## 5.7 Cubic Splines — Piecewise Polynomial Interpolation

**Problem with single high-degree polynomial:** Oscillation (Runge). Solution: use low-degree polynomials on each subinterval, patched together smoothly.

**Cubic spline:** On each interval [xᵢ, xᵢ₊₁], use a cubic polynomial sᵢ(x). Require:
1. **Interpolation:** sᵢ(xᵢ) = yᵢ and sᵢ(xᵢ₊₁) = yᵢ₊₁
2. **Continuity:** sᵢ(xᵢ₊₁) = sᵢ₊₁(xᵢ₊₁)
3. **Smooth first derivative:** s'ᵢ(xᵢ₊₁) = s'ᵢ₊₁(xᵢ₊₁)
4. **Smooth second derivative:** s''ᵢ(xᵢ₊₁) = s''ᵢ₊₁(xᵢ₊₁)

Count: n intervals × 4 coefficients = 4n unknowns. Conditions: 2n (interpolation) + (n-1) (C¹) + (n-1) (C²) = 4n-2 conditions. Two free — specify at endpoints.

**Natural spline:** s''(x₀) = s''(xₙ) = 0 (zero curvature at endpoints).

**Clamped spline:** s'(x₀) = f'(x₀), s'(xₙ) = f'(xₙ) (specify derivative at endpoints — better if you know them).

### Computing the Spline

Let Mᵢ = s''ᵢ(xᵢ) (second derivative at nodes). The spline coefficients express in terms of M values.

The M values satisfy a **tridiagonal linear system** (from C² condition):

```
hᵢ₋₁Mᵢ₋₁ + 2(hᵢ₋₁+hᵢ)Mᵢ + hᵢMᵢ₊₁ = 6[(yᵢ₊₁-yᵢ)/hᵢ - (yᵢ-yᵢ₋₁)/hᵢ₋₁]
```

where hᵢ = xᵢ₊₁ - xᵢ.

This is solved in O(n) by the Thomas algorithm! Then each spline piece:

```
sᵢ(x) = Mᵢ(xᵢ₊₁-x)³/(6hᵢ) + Mᵢ₊₁(x-xᵢ)³/(6hᵢ)
       + (yᵢ/hᵢ - Mᵢhᵢ/6)(xᵢ₊₁-x) + (yᵢ₊₁/hᵢ - Mᵢ₊₁hᵢ/6)(x-xᵢ)
```

**Error for smooth f:** The cubic spline error is O(h⁴) where h = max spacing. Compare to linear interpolation O(h²) — cubic wins with same number of points.

### Real-World Use: Font Rendering

Fonts (TrueType, PostScript) store character outlines as cubic splines (Bezier curves). The `S` in a font is not a bitmap but a parametric cubic spline, allowing scalability to any size without pixelation.

---

## 5.8 Interpolation vs. Approximation

**Interpolation:** polynomial passes through ALL data points exactly. Good for exact data (mathematical tables, Chebyshev coefficients).

**Approximation (Chapter 6):** find the best-fit polynomial that minimizes error but doesn't necessarily pass through all points. Better for noisy data.

**Rule:** Use interpolation when you trust your data exactly. Use approximation (least squares) when your data has noise.

---

## Section Challenge

---

**Q1.** Compute the Newton divided difference table for (0,2), (1,4), (3,10), (4,14) and write the interpolating polynomial.

<details>
<summary>Answer</summary>

Build the triangle:

```
i  xᵢ  f[xᵢ]   1st order             2nd order      3rd order
0   0    2
               (4-2)/(1-0)=2
1   1    4                     (2-2)/(3-0)=0
               (10-4)/(3-1)=3             (2/3-0)/(4-0)=1/6
2   3   10                     (4/1-3)/(4-1)=? 
```

Let me redo more carefully:

```
f[0]=2, f[1]=4, f[3]=10, f[4]=14

f[0,1] = (4-2)/(1-0) = 2
f[1,3] = (10-4)/(3-1) = 3
f[3,4] = (14-10)/(4-3) = 4

f[0,1,3] = (3-2)/(3-0) = 1/3
f[1,3,4] = (4-3)/(4-1) = 1/3

f[0,1,3,4] = (1/3-1/3)/(4-0) = 0
```

Newton polynomial:
```
p(x) = 2 + 2(x-0) + (1/3)(x-0)(x-1) + 0·(x-0)(x-1)(x-3)
     = 2 + 2x + (x²-x)/3
     = x²/3 + 5x/3 + 2
```

Verify: p(0)=2 ✓, p(1)=1/3+5/3+2=4 ✓, p(3)=3+5+2=10 ✓, p(4)=16/3+20/3+2=12+2=14 ✓
</details>

---

**Q2.** For Runge's function f(x) = 1/(1+25x²) on [-1,1] with n=4 (5 points), compare the interpolation error at x=0.9 using uniform nodes vs Chebyshev nodes (just compute the nodes and evaluate — approximation is fine).

<details>
<summary>Answer</summary>

**Uniform nodes:** x = -1, -0.5, 0, 0.5, 1.

**Chebyshev nodes (n=4, 5 nodes):**
```
xₖ = cos((2k+1)π/10) for k=0,1,2,3,4
x₀ = cos(π/10) ≈ 0.951
x₁ = cos(3π/10) ≈ 0.588
x₂ = cos(5π/10) = 0
x₃ = cos(7π/10) ≈ -0.588
x₄ = cos(9π/10) ≈ -0.951
```

True value: f(0.9) = 1/(1+25·0.81) = 1/21.25 ≈ 0.04706.

**Uniform nodes result (rough):** The interpolating polynomial through 5 uniform points oscillates. At x=0.9 (near edge), the error is relatively large — the uniform-node polynomial tends to overshoot near ±1. Error ≈ 0.1-0.2.

**Chebyshev nodes result:** The Chebyshev nodes cluster near ±1, reducing the error there. The interpolation error at x=0.9 is dramatically smaller — typically 10× better than uniform spacing.

**Key insight:** Chebyshev nodes are denser near the edges (where Runge's polynomial oscillates worst) and sparser in the middle. This exactly counteracts the source of Runge's phenomenon.
</details>

---

**Q3.** Prove that the divided difference f[x₀, x₁, ..., xₙ] is symmetric in its arguments (the order of x₀,...,xₙ doesn't matter).

<details>
<summary>Answer</summary>

**Proof by connection to leading coefficient:**

The divided difference f[x₀,...,xₙ] equals the leading coefficient of the unique interpolating polynomial p(x) of degree ≤ n through the points (x₀,f(x₀)), ..., (xₙ,f(xₙ)).

The interpolating polynomial is unique (Theorem §5.1) and depends only on the SET of points, not their order. Therefore its leading coefficient is also the same regardless of the order we list the nodes.

Since f[x₀,...,xₙ] is defined as this leading coefficient, it's symmetric. □

**Alternative proof (by induction):** For n=1: f[x₀,x₁] = (f(x₁)-f(x₀))/(x₁-x₀) = (f(x₀)-f(x₁))/(x₀-x₁) = f[x₁,x₀] ✓. For n=2: f[x₀,x₁,x₂] = (f[x₁,x₂]-f[x₀,x₁])/(x₂-x₀). One can verify by algebra that swapping any two arguments gives the same result, using the symmetry of order-1 divided differences.
</details>

---

**Q4.** You have 10 data points equally spaced in [0,1]. A colleague suggests using a degree-9 polynomial. You suggest using cubic splines. Defend your choice.

<details>
<summary>Answer</summary>

**Arguments for cubic splines:**

1. **Runge's phenomenon:** Degree-9 polynomial with equally-spaced nodes is exactly the setting where Runge's phenomenon strikes. The polynomial may oscillate wildly between data points, making interpolated values useless near the edges.

2. **Local control:** A cubic spline uses a different cubic on each subinterval. If one data point is slightly wrong (noise), only the adjacent spline pieces are affected. A degree-9 polynomial changes GLOBALLY — one bad point ruins the entire fit.

3. **Smoothness quality:** Cubic splines are C² (continuous second derivative). The degree-9 polynomial is C∞ everywhere but may have large high-order derivatives, implying large oscillations.

4. **Computational stability:** The coefficients of a degree-9 polynomial through 10 points can be ill-conditioned (Vandermonde matrix has condition number ≈ 10¹⁸ for uniform nodes). The cubic spline tridiagonal system is well-conditioned.

5. **Error rate:** Cubic spline error is O(h⁴) where h is the node spacing. A degree-9 polynomial has error O(h^10) in theory — better! But only if the function is 10-times differentiable AND you avoid Runge. Splines guarantee O(h⁴) without needing high smoothness assumptions.

**When degree-9 IS appropriate:** If you know the function is a polynomial of degree ≤ 9, or if you use Chebyshev nodes, the high-degree polynomial is appropriate. For general data, splines are safer.
</details>

---

**Q5.** The cubic natural spline for 3 points (0,0), (1,1), (2,0) has M₀=M₂=0. Find M₁ and write the two cubic pieces.

<details>
<summary>Answer</summary>

Natural spline: M₀ = M₂ = 0, h₀ = h₁ = 1.

Interior equation (i=1):
```
h₀M₀ + 2(h₀+h₁)M₁ + h₁M₂ = 6[(y₂-y₁)/h₁ - (y₁-y₀)/h₀]
1·0 + 2(2)M₁ + 1·0 = 6[(0-1)/1 - (1-0)/1]
4M₁ = 6[-1-1] = -12
M₁ = -3
```

**First piece s₀(x) on [0,1] (M₀=0, M₁=-3, h=1):**
```
s₀(x) = 0·(1-x)³/6 + (-3)(x-0)³/6 + [(0/1 - 0·1/6)(1-x) + (1/1 - (-3)·1/6)(x-0)]
       = -x³/2 + [(0)(1-x) + (1+0.5)(x)]
       = -x³/2 + 1.5x
```

- Check: s₀(0) = 0 ✓, s₀(1) = -1/2 + 3/2 = 1 ✓
- s₀'(x) = -3x²/2 + 3/2
- s₀''(x) = -3x; at x=0: M₀=0 ✓; at x=1: M₁=-3 ✓

**Second piece s₁(x) on [1,2] (M₁=-3, M₂=0, h=1):**
```
s₁(x) = (-3)(2-x)³/6 + 0·(x-1)³/6 + [(1/1 - (-3)·1/6)(2-x) + (0/1 - 0·1/6)(x-1)]
       = -3(2-x)³/6 + [1.5(2-x) + 0]
       = -(2-x)³/2 + 1.5(2-x)
```

- Check: s₁(1) = -(1)³/2 + 1.5 = -0.5+1.5 = 1 ✓, s₁(2) = 0 + 0 = 0 ✓
- s₁'(x) = 3(2-x)²/2 - 1.5
- At x=1: s₁'(1) = 3/2 - 1.5 = 0...

Compare with s₀'(1) = -3/2 + 3/2 = 0. Both derivatives = 0 at x=1. ✓ (The spline has zero slope at the middle point by symmetry — the data is symmetric about x=1, and the natural spline respects this.)
</details>

---

## Chapter Summary

| Method | Degree | Nodes | Error | Best For |
|--------|--------|-------|-------|---------|
| Lagrange | n | any | O(hⁿ⁺¹) | Small n, teaching |
| Newton DD | n | any | same | Incremental (add points cheaply) |
| Chebyshev | n | optimal | ~2⁻ⁿ | Minimize worst-case error |
| Cubic spline | 3 per piece | any | O(h⁴) | Smooth piecewise fit, practical |
| Linear interp | 1 per piece | any | O(h²) | Very fast, rough approximation |

**Key rules:**
1. Use Chebyshev nodes if you must use a high-degree polynomial
2. Prefer cubic splines for arbitrary data — smooth, local, well-conditioned
3. Avoid equally-spaced nodes with high-degree polynomials (Runge's phenomenon)

---

*Previous: [04 — Iterative Methods](04_Linear_Systems_Iterative.md)*
*Next: [06 — Least Squares and Curve Fitting](06_Least_Squares.md)*
