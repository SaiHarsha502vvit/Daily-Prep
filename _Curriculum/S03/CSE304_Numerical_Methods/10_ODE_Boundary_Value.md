# Chapter 10 — ODEs: Boundary Value Problems

> "IVPs are like shooting an arrow from a known position with a known velocity. BVPs are like knowing where the arrow starts AND where it must land — you have to figure out the launch angle."

---

## The Problem

A **boundary value problem (BVP)** specifies conditions at BOTH ends of an interval:

```
y'' = f(x, y, y'),   y(a) = α,   y(b) = β
```

Find y(x) on [a, b] satisfying conditions at x = a AND x = b.

**IVP vs BVP:**
- IVP: y(0) = 1, y'(0) = 2. Conditions at one end → march forward.
- BVP: y(0) = 0, y(1) = 1. Conditions at TWO ends → must globally satisfy both.

**Why BVPs arise:**
- **Structural mechanics:** beam deflection. Beam fixed at both ends: displacement = 0 at x=0 and x=L.
- **Heat conduction:** temperature in a rod. T(0) = T_left, T(L) = T_right. Steady-state.
- **Quantum mechanics:** Schrödinger equation ψ''+(2m/ℏ²)(E-V)ψ = 0 with ψ→0 as |x|→∞.
- **Fluid mechanics:** boundary layer equations with conditions at wall and far-field.
- **Eigenvalue problems:** y'' + λy = 0, y(0) = y(π) = 0. Non-trivial solutions only for λ = n².

---

## 10.1 The Shooting Method

**Idea:** Convert the BVP into an IVP by guessing y'(a). Integrate forward to x=b and check if y(b) = β. Adjust the guess.

**Algorithm:**
```
1. Guess s ≈ y'(a)
2. Solve IVP: y'' = f(x,y,y'), y(a) = α, y'(a) = s
3. Compute residual: r(s) = y(b; s) - β
4. Find s* such that r(s*) = 0 using Newton's method or secant method
```

The BVP becomes: find s such that r(s) = 0. This is a root-finding problem!

### Worked Example: y'' = y, y(0) = 0, y(1) = 1

True solution: y = sinh(x)/sinh(1) (verify: sinh(0)=0 ✓, sinh(1)/sinh(1)=1 ✓).

**Set up:** Let y₁ = y, y₂ = y'. System:
```
y₁' = y₂
y₂' = y₁
```
Initial conditions: y₁(0) = 0, y₂(0) = s (unknown).

**IVP solution:** For y'' = y with y(0) = 0, y'(0) = s:
```
y(x; s) = s·sinh(x)
```

Residual: r(s) = y(1; s) - 1 = s·sinh(1) - 1 = 0 → s* = 1/sinh(1) ≈ 0.8509.

**Shooting procedure (numerically):**

Guess s₁ = 1.0: integrate → y(1; 1.0) = 1·sinh(1) ≈ 1.1752. Residual: 0.1752.
Guess s₂ = 0.7: integrate → y(1; 0.7) = 0.7·sinh(1) ≈ 0.8226. Residual: -0.1774.

Secant step: s₃ = 1.0 - 0.1752·(0.7-1.0)/(0.8226-1.1752) = 1.0 + 0.1752·0.3/0.3526 ≈ 0.851.

One more IVP solve gives r(0.851) ≈ 0.0001. Converged.

### Failure Mode: Sensitive to Initial Conditions (Shooting Instability)

Consider: y'' = 100y, y(0) = 1, y(1) = e^(-10)/cosh(10) (some small value).

True solution: exponentially small. But for any slightly wrong guess s, the IVP solution has components like e^(10x) (growing mode) that overwhelm the small solution. Error magnified by e^(10) ≈ 22000.

**Shooting fails** when the BVP has:
1. Large growth/decay rates (stiff BVPs)
2. Long intervals [a,b]
3. Sensitive dependence on initial slope

**Remedy:** Multiple shooting (split [a,b] into subintervals, shoot on each, match at interfaces) or use finite differences.

---

## 10.2 Finite Difference Method

**Idea:** Discretize the interval [a,b] into n+1 grid points and replace the derivatives with finite difference formulas. This yields an n-1 dimensional linear (or nonlinear) system.

**Grid:** xᵢ = a + i·h, h = (b-a)/n, i = 0, 1, ..., n.
Unknowns: Y₁, Y₂, ..., Yₙ₋₁ (interior points; Y₀=α, Yₙ=β are known).

**Second derivative approximation:**
```
y''(xᵢ) ≈ (Yᵢ₋₁ - 2Yᵢ + Yᵢ₊₁) / h²   ← central difference, O(h²) accurate
```

### Linear BVP: y'' + p(x)y' + q(x)y = g(x)

Substitute finite differences:
```
(Yᵢ₋₁ - 2Yᵢ + Yᵢ₊₁)/h² + p(xᵢ)(Yᵢ₊₁ - Yᵢ₋₁)/(2h) + q(xᵢ)Yᵢ = g(xᵢ)
```

Rearrange (let pᵢ = p(xᵢ), qᵢ = q(xᵢ), gᵢ = g(xᵢ)):
```
(1/h² - pᵢ/(2h))Yᵢ₋₁ + (-2/h² + qᵢ)Yᵢ + (1/h² + pᵢ/(2h))Yᵢ₊₁ = gᵢ
```

This is a **tridiagonal system** AY = b, solvable in O(n) with the Thomas algorithm.

### Worked Example: y'' = 6x, y(0) = 0, y(1) = 1

True solution: y = x³ (verify: y'' = 6x ✓, y(0)=0 ✓, y(1)=1 ✓).

Grid: h = 1/4, points x₀=0, x₁=0.25, x₂=0.5, x₃=0.75, x₄=1.
Boundary: Y₀=0, Y₄=1. Unknowns: Y₁, Y₂, Y₃.

BVP: y'' = 6x. No y or y' terms: p=0, q=0, g(x)=6x.

Equation at each interior point (1/h² = 16):
```
i=1: 16(Y₀ - 2Y₁ + Y₂) = 6(0.25) = 1.5
     16(0 - 2Y₁ + Y₂) = 1.5
     -32Y₁ + 16Y₂ = 1.5

i=2: 16(Y₁ - 2Y₂ + Y₃) = 6(0.5) = 3.0
     16Y₁ - 32Y₂ + 16Y₃ = 3.0

i=3: 16(Y₂ - 2Y₃ + Y₄) = 6(0.75) = 4.5
     16Y₂ - 32Y₃ + 16(1) = 4.5
     16Y₂ - 32Y₃ = -11.5
```

Matrix system:
```
[-32  16   0 ] [Y₁]   [ 1.5]
[ 16 -32  16 ] [Y₂] = [ 3.0]
[  0  16 -32 ] [Y₃]   [-11.5]
```

Solve (Thomas algorithm): Y₁ = 0.015625, Y₂ = 0.125, Y₃ = 0.421875.

True values: x₁³ = 0.015625 ✓, x₂³ = 0.125 ✓, x₃³ = 0.421875 ✓.

**Exact!** (Finite differences are exact for polynomials of degree ≤ 2 in the second derivative — here g=6x is linear, so its cubic integral is recovered exactly with h→0.)

### Convergence

Central difference scheme for y'' is O(h²). Global error in Y ≈ C·h². Halving mesh doubles accuracy. Use Richardson extrapolation on two grids to get O(h⁴).

---

## 10.3 Collocation and Finite Elements (Overview)

**Finite differences:** discretize at point values. Simple but only O(h²).

**Collocation:** expand y(x) in a basis {φⱼ(x)}, force the ODE to be satisfied at specific points (collocation points). Chebyshev collocation uses Chebyshev nodes and gives spectral (exponential) convergence for smooth problems.

**Finite elements:** subdivide [a,b] into elements, use piecewise polynomial basis functions, minimize a variational (weighted residual) problem. Output: piecewise polynomial approximation. Foundation of FEA in structural mechanics.

**When to use which:**
- Shooting method: simple BVPs, non-stiff, small intervals.
- Finite differences: standard BVPs, moderate accuracy needed, easy to code.
- Collocation / spectral: smooth solutions, high accuracy required, complex domains.
- Finite elements: complex geometries (2D/3D), discontinuous data, PDEs.

---

## 10.4 Nonlinear BVPs

When f(x, y, y') is nonlinear in y or y':

**Shooting + Newton:** The residual r(s) may be nonlinear → use Newton's method to find s*. Requires Jacobian dr/ds, obtained by solving a variational (linearized) IVP alongside the main IVP.

**Newton-FD combination:**
1. Start with initial guess Y⁰ (e.g., linear interpolation from α to β).
2. Linearize: solve the linear BVP for δY where J(Y⁰)δY = -F(Y⁰).
3. Update: Y¹ = Y⁰ + δY.
4. Repeat until ||F(Yᵏ)|| < tolerance.

This is Newton's method applied to the nonlinear algebraic system from finite differences.

**Convergence:** Quadratic if the initial guess is good. Poor if the problem is highly nonlinear or if bifurcations exist.

**Bifurcation:** Some BVPs have multiple solutions. Example: buckled vs unbuckled beam. The BVP y'' + λy = 0, y(0) = y(L) = 0 has solutions only for λ = (nπ/L)² (buckling loads). Newton's method finds whichever branch the initial guess is near.

---

## 10.5 Connection to PDEs: Finite Differences in 2D

BVP methods generalize to **partial differential equations** (PDEs) in 2D:

**Poisson equation in 2D:**
```
∂²u/∂x² + ∂²u/∂y² = f(x,y)  on a rectangle [a,b]×[c,d]
```
with boundary conditions on all four sides.

**2D finite differences:** grid (xᵢ, yⱼ) with hₓ and hᵧ. Laplacian:
```
(uᵢ₋₁,ⱼ - 2uᵢ,ⱼ + uᵢ₊₁,ⱼ)/hₓ² + (uᵢ,ⱼ₋₁ - 2uᵢ,ⱼ + uᵢ,ⱼ₊₁)/hᵧ² = fᵢ,ⱼ
```

With m×n interior points: system of mn equations. The matrix is **sparse** (5-point stencil) → iterative solvers (CG, multigrid) are essential.

This is why the iterative solvers from Chapter 4 (CG, GMRES) matter: 2D/3D PDE discretizations always produce large sparse systems where direct methods are too expensive.

---

## 10.6 Sturm-Liouville Problems: BVPs with Eigenvalues

**Problem form:**
```
-(p(x)y')' + q(x)y = λ·w(x)·y,   y(a) = y(b) = 0
```

Eigenvalues λ₁ < λ₂ < λ₃ < ... and eigenfunctions y₁, y₂, y₃, ...

**Example:** y'' + λy = 0, y(0) = y(π) = 0.
Eigenvalues: λₙ = n², eigenfunctions: yₙ = sin(nx), n = 1,2,3,...

**Why this matters:**
- Vibration of a string: normal modes = eigenfunctions, natural frequencies² ∝ eigenvalues.
- Heat equation separation of variables: T(t)X(x) where X satisfies a Sturm-Liouville problem.
- Fourier series: the sine functions are the eigenfunctions of y'' + λy = 0 on [0, π].

**Numerical approach:** Discretize with finite differences → matrix eigenvalue problem A v = λ v.
The eigenvalues of A approximate the BVP eigenvalues. Chapter 11 covers matrix eigenvalue methods.

---

## Section Challenge

---

**Q1.** Use the shooting method to set up the BVP y'' = -y, y(0) = 0, y(π) = 0. What IVP do you need to solve, and what are the possible "launch angles" s = y'(0)?

<details>
<summary>Answer</summary>

**IVP setup:** Guess s = y'(0). Solve:
```
y'' = -y,  y(0) = 0,  y'(0) = s
```

**IVP solution:** y(x; s) = s·sin(x). (General solution: A·sin(x) + B·cos(x). y(0)=0 → B=0. y'(0)=s → A=s.)

**Residual:** r(s) = y(π; s) - 0 = s·sin(π) = s·0 = 0.

Wait — r(s) = 0 for ALL values of s!

**Interpretation:** This BVP is a Sturm-Liouville eigenvalue problem (λ=1 IS an eigenvalue). The boundary condition y(π)=0 is satisfied by y = s·sin(x) for any s ≠ 0. The BVP has **infinitely many solutions** — the set of all scalar multiples of sin(x).

If the boundary condition were y(π) = 1 instead: r(s) = s·sin(π) = 0 ≠ 1 for all s. Now there's NO solution (the BVP is inconsistent with λ=1 being an eigenvalue). This is the BVP analog of a singular linear system: either zero or infinitely many solutions.

**Shooting method breaks down** exactly at eigenvalues — the residual function either has a zero everywhere or nowhere. This is a critical failure mode to recognize.
</details>

---

**Q2.** Set up the finite difference system for y'' = -sin(x), y(0) = 0, y(π) = 0 with n=4 subintervals (h = π/4, 3 interior points x₁=π/4, x₂=π/2, x₃=3π/4). Write out the 3×3 system.

<details>
<summary>Answer</summary>

h = π/4, 1/h² = 16/π².

BVP: y'' = -sin(x). Boundary: Y₀=0, Y₄=0.

FD equation at each interior point xᵢ:
```
(Yᵢ₋₁ - 2Yᵢ + Yᵢ₊₁)/h² = -sin(xᵢ)
```

or equivalently:
```
Yᵢ₋₁ - 2Yᵢ + Yᵢ₊₁ = -h²·sin(xᵢ)
```

Compute right-hand sides:
- i=1, x₁=π/4: -h²·sin(π/4) = -(π/4)²·(√2/2) ≈ -0.8696
- i=2, x₂=π/2: -h²·sin(π/2) = -(π/4)² ≈ -0.6169  (π²/16 ≈ 0.6169)
- i=3, x₃=3π/4: -h²·sin(3π/4) = -(π/4)²·(√2/2) ≈ -0.8696

Using Y₀=0 (contributes 0 to i=1 row) and Y₄=0 (contributes 0 to i=3 row):

```
[-2   1   0] [Y₁]   [-0.8696]
[ 1  -2   1] [Y₂] = [-0.6169]
[ 0   1  -2] [Y₃]   [-0.8696]
```

**True solution:** y = sin(x)/1² = sin(x) (from the eigenfunction expansion: Ly = -sin(x), L = d²/dx², eigenvalues λₙ=n², y = Σ(cₙ/λₙ)sin(nx), only n=1 survives: y = sin(x)).

Expected: Y₁ = sin(π/4) = √2/2 ≈ 0.7071, Y₂ = sin(π/2) = 1.0, Y₃ = sin(3π/4) = √2/2 ≈ 0.7071.

The O(h²) approximation won't be exact here (unlike the cubic example), but should be within ~0.04 of these values.
</details>

---

**Q3.** The linear BVP y'' - y = 0, y(0) = 1, y(1) = 0 can be solved exactly (y = [e·sinh(1-x) + sinh(x)·0]/sinh(1) = sinh(1-x)/sinh(1)). Why does the shooting method work well here but fail for y'' - 1000y = 0, y(0) = 1, y(1) = 0?

<details>
<summary>Answer</summary>

**y'' - y = 0:** General solution y = Ae^x + Be^(-x). With y(0) = 1 and y(1) = 0:
```
A + B = 1
Ae + B/e = 0
```
Solve: A = -1/(e²-1)·(1/e), B = 1 - A. Condition number is moderate.

**Shooting:** Guess s = y'(0). Solve IVP: y(x; s) = cosh(x) + s·sinh(x). Residual r(s) = cosh(1) + s·sinh(1) = 0 → s = -cosh(1)/sinh(1) = -coth(1) ≈ -1.313. The root-finding is well-conditioned.

**y'' - 1000y = 0:** General solution y = Ae^(√1000·x) + Be^(-√1000·x) = Ae^(31.6x) + Be^(-31.6x).

With y(0) = 1 and y(1) = 0:
```
A + B = 1
A·e^(31.6) + B·e^(-31.6) = 0
```

The coefficient A = -e^(-31.6)/(e^(31.6) - e^(-31.6)) ≈ -e^(-63.2) ≈ 10^(-27.4). Essentially zero!

**Why shooting fails:** For the IVP y(x; s) = cosh(√1000·x) + s·sinh(√1000·x), the growing mode e^(31.6x) must be almost exactly cancelled to get the small solution. At x=1, e^(31.6·1) ≈ 5×10^13. The growing component error grows by this factor.

If s has error ε (roundoff ≈ 10^(-15)), the error in y(1) is ~ε·e^(31.6) ≈ 5×10^(-2). Far larger than the tolerance.

**Numerical evidence:** The residual function r(s) is dominated by the growing mode for any computable s. Root-finding cannot converge — the function is nearly flat near s* and explosively steep everywhere else.

**Fix:** Multiple shooting (split at, say, x=0.5) or finite differences. The tridiagonal FD system is well-conditioned regardless of the growth rate.
</details>

---

**Q4.** Explain how the Sturm-Liouville problem y'' + λy = 0, y(0) = y(L) = 0 connects to Fourier series.

<details>
<summary>Answer</summary>

**The eigenvalue problem:**
Solutions: yₙ(x) = sin(nπx/L), λₙ = (nπ/L)², n = 1, 2, 3, ...

Verify: yₙ'' = -(nπ/L)²sin(nπx/L) = -λₙ·yₙ. And yₙ(0) = yₙ(L) = 0. ✓

**Orthogonality:** ∫₀ᴸ sin(mπx/L)sin(nπx/L) dx = 0 for m ≠ n; = L/2 for m = n.

This is exactly the **orthogonality of sine functions** that makes Fourier sine series work!

**Connection to Fourier series:** Any function f ∈ L²[0,L] can be expanded in the eigenfunctions:
```
f(x) = Σₙ₌₁^∞ bₙ sin(nπx/L)
```
where bₙ = (2/L)∫₀ᴸ f(x)sin(nπx/L) dx.

This IS the Fourier sine series. The coefficients bₙ exist and the series converges because {yₙ} forms a complete orthogonal basis for L²[0,L].

**The deep theorem:** Every Sturm-Liouville problem with appropriate boundary conditions generates a complete orthogonal basis of eigenfunctions. Bessel functions (for cylindrical domains), Legendre polynomials (for spherical domains), Hermite functions (for quantum harmonic oscillator) — all are eigenfunctions of specific Sturm-Liouville operators.

Fourier analysis is special not because of sine waves specifically, but because the sine/cosine functions happen to be the eigenfunctions of the simplest Sturm-Liouville operator (the second derivative) on [0, L].

**Numerical implication:** To compute Fourier-like expansions in other geometries, solve the corresponding discrete eigenvalue problem. The FD approximation to the Sturm-Liouville problem gives approximate eigenvalues and eigenvectors — effectively a discrete Fourier transform for non-rectangular domains.
</details>

---

**Q5.** A finite difference discretization of a BVP with n+1 grid points produces a tridiagonal system. The Thomas algorithm solves it in O(n) operations. Compare this to using Gaussian elimination directly — what is the speedup for n = 10,000?

<details>
<summary>Answer</summary>

**Gaussian elimination (dense matrix):** For an n×n system, ~n³/3 operations.
- n = 10,000: ~(10⁴)³/3 ≈ 3.3×10¹¹ operations.

**Thomas algorithm (tridiagonal):** 2n multiplications + 2n additions ≈ 4n operations.
- n = 10,000: ~4×10⁴ operations.

**Speedup:** 3.3×10¹¹ / 4×10⁴ ≈ **8.3 million times faster**.

At 10⁹ operations/second:
- Gaussian elimination: ~330 seconds ≈ 5.5 minutes
- Thomas algorithm: 0.00004 seconds = 40 microseconds

**Storage comparison:**
- Dense matrix: n² = 10⁸ entries. At 8 bytes each = 800 MB.
- Tridiagonal: 3n = 30,000 entries. At 8 bytes each = 240 KB.

**The lesson:** Structure matters enormously. The tridiagonal structure arises directly from the local stencil of finite differences — each equation involves only the 3 nearest grid points. The sparsity is not an accident but a consequence of the physics: each point's value depends only on its immediate neighbors (the differential operator is local).

For 2D problems (Poisson equation on n×n grid): n² unknowns, 5-diagonal banded structure. Full Gaussian = O(n⁶)! Banded Gaussian = O(n³). Iterative methods (CG, multigrid) = O(n² log n). Multigrid converges in O(1) iterations regardless of mesh size — that's why multigrid is the gold standard for PDE solvers.
</details>

---

## Chapter Summary

| Method | Setup Cost | Solve Cost | Accuracy | Handles Nonlinear |
|--------|------------|------------|----------|-------------------|
| Shooting | Low | ~10 IVP solves | High (inherits IVP order) | Yes (Newton on s) |
| Finite Differences | Medium | O(n) Thomas | O(h²) | Yes (Newton-FD) |
| Collocation/Spectral | High | O(n³) dense | Exponential (smooth) | Yes |
| Finite Elements | Highest | O(n) sparse | O(h^p) | Yes |

**When shooting fails:** Large growth rates (stiff BVP), long intervals — use FD instead.

**When FD wins:** Simple geometries, linear problems, well-understood convergence needed.

**Key structures:**
- Linear BVP → tridiagonal system → Thomas O(n)
- Nonlinear BVP → Newton iteration on tridiagonal system
- 2D PDE → sparse system → iterative solvers

---

*Previous: [09 — ODEs: Initial Value Problems](09_ODE_Initial_Value.md)*
*Next: [11 — Eigenvalue Problems](11_Eigenvalue_Problems.md)*
