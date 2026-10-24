# Chapter 9 — ODEs: Initial Value Problems

> "Euler's method takes one step in the direction you're pointing. Runge-Kutta samples the terrain ahead, averages the slopes, and takes one better step. This preview buys two extra orders of accuracy."

---

## The Problem

An **ordinary differential equation (ODE) initial value problem (IVP)**:
```
y'(t) = f(t, y(t)),   y(t₀) = y₀
```

Find y(t) for t ∈ [t₀, T].

**Why numerical methods:** Most ODEs have no closed-form solution. The logistic equation, Lorenz system, planetary motion, neural dynamics — all require numerical integration.

**Physical interpretation:** The state y evolves at rate f(t,y). Starting from y₀, track the state forward in time.

**Examples:**
- Exponential decay: y' = -λy (analytic: y = y₀e^(-λt))  
- Pendulum: θ'' = -(g/L)sin(θ) (no closed form for large angles)
- Lorenz system: x' = σ(y-x), y' = x(ρ-z)-y, z' = xy-βz (chaotic)
- Neural network training: dθ/dt = -∇L(θ) (gradient flow)

---

## 9.1 Euler's Method: First-Order Derivation

**From Taylor expansion:**
```
y(t+h) = y(t) + h·y'(t) + (h²/2)y''(t) + ...
       ≈ y(t) + h·f(t, y(t))
```

Drop everything after h. This gives:

**Euler's method:**
```
yₙ₊₁ = yₙ + h·f(tₙ, yₙ)
```

Take steps of size h = (T - t₀)/N, updating t and y at each step.

### Worked Trace: y' = y, y(0) = 1

True solution: y(t) = eᵗ. At t=1: y=e≈2.71828.

With h = 0.25, 4 steps:

| n | tₙ | yₙ | f(tₙ,yₙ) | yₙ₊₁ |
|---|----|----|----------|-------|
| 0 | 0.00 | 1.0000 | 1.0000 | 1.2500 |
| 1 | 0.25 | 1.2500 | 1.2500 | 1.5625 |
| 2 | 0.50 | 1.5625 | 1.5625 | 1.9531 |
| 3 | 0.75 | 1.9531 | 1.9531 | 2.4414 |

y(1) ≈ 2.4414 vs true 2.7183. Error: ~10%. 

Halving h gives ~5% error — halving step halves error → first-order method.

### Euler Error Analysis

**Local truncation error (LTE):** error made in one step (assuming perfect initial data):
```
LTE = y(t+h) - [y(t) + h·f(t,y(t))] = (h²/2)y''(t) + O(h³) = O(h²)
```

**Global error:** accumulated over N = (T-t₀)/h steps:
```
Global Error = O(h)   ← first-order globally
```

Local error O(h²), but N steps = O(1/h) steps → total accumulates to O(h).

---

## 9.2 Runge-Kutta Methods: Preview the Future

**Problem with Euler:** Uses derivative only at the LEFT endpoint of each step. Poor man's estimate.

**Improved idea:** Sample the derivative at multiple points within [tₙ, tₙ₊₁], then take a weighted average.

### Explicit Midpoint Method (RK2)

Sample at midpoint:
```
k₁ = f(tₙ, yₙ)
k₂ = f(tₙ + h/2, yₙ + h/2 · k₁)   ← derivative at estimated midpoint
yₙ₊₁ = yₙ + h·k₂
```

**Order:** O(h²) local, O(h) global... actually wait:

LTE from Taylor expansion:
```
k₁ = f
k₂ = f + (h/2)(fₜ + f·fᵧ) + O(h²)
yₙ₊₁ = yₙ + h·k₂ = yₙ + h·f + (h²/2)(fₜ + f·fᵧ) + O(h³)
```

And Taylor expansion of true y(tₙ₊₁):
```
y(tₙ₊₁) = yₙ + h·y' + (h²/2)y'' + O(h³)
         = yₙ + h·f + (h²/2)(fₜ + f·fᵧ) + O(h³)
```

They match to O(h²)! LTE = O(h³), global = O(h²). Second-order method.

### Classic RK4: The Workhorse

Sample at 4 points: start, two midpoints, end:

```
k₁ = f(tₙ, yₙ)
k₂ = f(tₙ + h/2, yₙ + h/2·k₁)
k₃ = f(tₙ + h/2, yₙ + h/2·k₂)
k₄ = f(tₙ + h, yₙ + h·k₃)

yₙ₊₁ = yₙ + (h/6)(k₁ + 2k₂ + 2k₃ + k₄)
```

**Weights 1:2:2:1 (Simpson's rule!)** — the step is a weighted average of slopes, and the weights come from the same "sample twice in the middle" logic as Simpson's quadrature.

**Order:** O(h⁴) local, O(h⁴) global — fourth-order!

4 function evaluations per step, but each step is worth much more than 4 Euler steps.

### Worked Trace: y' = y, y(0) = 1, h = 0.5

- k₁ = f(0, 1.0) = 1.0
- k₂ = f(0.25, 1.0 + 0.25·1.0) = f(0.25, 1.25) = 1.25
- k₃ = f(0.25, 1.0 + 0.25·1.25) = f(0.25, 1.3125) = 1.3125
- k₄ = f(0.5, 1.0 + 0.5·1.3125) = f(0.5, 1.65625) = 1.65625

yₙ₊₁ = 1.0 + (0.5/6)(1.0 + 2·1.25 + 2·1.3125 + 1.65625)
      = 1.0 + (1/12)(1.0 + 2.5 + 2.625 + 1.65625)
      = 1.0 + (1/12)(7.78125)
      = 1.0 + 0.648438 = 1.648438

True: e^0.5 = 1.648721. Error: 2.8×10⁻⁴.

Compare Euler with h=0.5: y₁ = 1.5. Error = 0.149. RK4 is 500× more accurate with the same step size.

---

## 9.3 Adaptive Step Size Control

**Problem:** With fixed h, you waste evaluations in smooth regions and get large errors in rapidly-changing regions.

**Solution:** Adapt h based on estimated local error.

**Embedded Runge-Kutta (Dormand-Prince, RK45):**

Compute two estimates of yₙ₊₁ using the SAME k evaluations:
- 4th-order estimate: ŷ (4 stages)
- 5th-order estimate: y (5 stages — 6 evaluations total via shared stages)

Error estimate: e = ||y - ŷ|| (difference between 4th and 5th order)

Step size control:
```
h_new = h × (tol / e)^(1/5) × safety_factor
```

If e > tol: reject step, retry with smaller h.
If e < tol: accept step, try larger h next.

**Dormand-Prince (scipy's `ode45` equivalent):**

```python
from scipy.integrate import solve_ivp
sol = solve_ivp(f, [t0, T], [y0], method='RK45', rtol=1e-6, atol=1e-9)
```

This is the standard adaptive ODE solver for non-stiff problems.

---

## 9.4 Stiffness — The Hidden Complication

**Stiff ODEs:** Systems where some components change on vastly different timescales.

**Example:** Chemical kinetics with fast and slow reactions:
```
y₁' = -1000 y₁ + y₂
y₂' = y₁ - y₂
```

y₁ decays on timescale 1/1000 = 0.001 while y₂ decays on timescale 1.

**The problem:** Explicit methods (Euler, RK4) have stability constraints:
```
h < 2/|eigenvalue_max| = 2/1000 = 0.002
```

To integrate to T=10, need 10/0.002 = 5000 steps — all to capture a fast transient that dies in the first 0.01 time units!

**Implicit Euler:** Evaluate f at the NEW time level:
```
yₙ₊₁ = yₙ + h·f(tₙ₊₁, yₙ₊₁)
```

This requires solving a (possibly nonlinear) system for yₙ₊₁ at each step — more expensive per step, but **unconditionally stable** (no step-size restriction from stiffness).

**Trapezoidal rule (Crank-Nicolson for ODEs):**
```
yₙ₊₁ = yₙ + (h/2)[f(tₙ, yₙ) + f(tₙ₊₁, yₙ₊₁)]
```

Second-order, unconditionally stable for linear problems. The gold standard for stiff ODEs.

### Stiffness Detection

Check the **stiffness ratio:** |λ_max / λ_min| of the Jacobian ∂f/∂y. If this is >> 1 (say, > 10³), the problem is stiff. Use an implicit method.

Modern adaptive solvers like `solve_ivp` with `method='Radau'` or `method='BDF'` handle stiff problems automatically.

---

## 9.5 Absolute and Relative Stability

**Stability test problem:** y' = λy, λ ∈ ℂ, Re(λ) < 0 (decaying solution).

Euler applied: yₙ₊₁ = (1 + hλ)yₙ = (1+hλ)ⁿ y₀.

For the numerical solution to decay: |1 + hλ| < 1.

**Stability region of Euler method:** The set of z = hλ ∈ ℂ with |1 + z| < 1.

This is a disk of radius 1 centered at -1 in the complex plane. For real negative λ: requires -2 < hλ < 0 → **h < 2/|λ|**.

**RK4 stability region:** Larger — includes a region extending to about hλ ≈ -2.8 along the negative real axis.

**Implicit Euler:** yₙ₊₁ = yₙ/(1-hλ). Stable for |1/(1-hλ)| < 1 when Re(λ) < 0, i.e., for ALL h > 0. Stability region = entire left half-plane = **A-stable**.

**A-stability** is the property of being stable for any h when Re(λ) < 0. Implicit methods are A-stable; explicit methods are not.

---

## 9.6 Error Control and Time Integration

**Total error sources:**
1. **Truncation error:** O(hᵖ) per step from approximation order p
2. **Rounding error:** accumulates over N = T/h steps, ~N × ε_mach
3. **Instability:** error growth when inside unstable region

For non-stiff problems: balance truncation (smaller h better) and rounding (larger h better).

**Optimal step for fixed-order method:** h_opt ≈ ε_mach^(1/(p+1)) × (stability factor)

For RK4 (p=4): h_opt ≈ ε_mach^(1/5) ≈ 10⁻³·²  in terms of error per unit time.

**Local vs global error:** A method of local order p+1 has global order p (one power of h lost to accumulation). Exception: if the number of steps N is fixed independent of h (not the case for most problems).

---

## 9.7 Systems of ODEs and Higher-Order ODEs

All higher-order ODEs reduce to first-order systems.

**Second-order ODE:** y'' = f(t, y, y')

**Reduction:** Let u₁ = y, u₂ = y'. Then:
```
u₁' = u₂
u₂' = f(t, u₁, u₂)
```

This is a first-order system U' = F(t, U) with U = [u₁, u₂].

**Pendulum:** θ'' = -(g/L)sin(θ) → let u₁ = θ, u₂ = θ':
```
u₁' = u₂
u₂' = -(g/L)sin(u₁)
```

All ODE solvers work on first-order systems. The vector y = [u₁, u₂, ..., uₙ] is the state.

---

## Section Challenge

---

**Q1.** Apply RK4 to y' = t·y, y(0) = 1 for one step with h = 0.1. Compute all four k values and the new y.

<details>
<summary>Answer</summary>

f(t, y) = t·y. Starting from t₀=0, y₀=1.

```
k₁ = f(0, 1) = 0·1 = 0

k₂ = f(0.05, 1 + 0.05·0) = f(0.05, 1) = 0.05·1 = 0.05

k₃ = f(0.05, 1 + 0.05·0.05) = f(0.05, 1.0025) = 0.05·1.0025 = 0.050125

k₄ = f(0.1, 1 + 0.1·0.050125) = f(0.1, 1.0050125) = 0.1·1.0050125 = 0.10050125

y₁ = 1 + (0.1/6)(0 + 2·0.05 + 2·0.050125 + 0.10050125)
   = 1 + (0.1/6)(0 + 0.1 + 0.10025 + 0.10050125)
   = 1 + (0.1/6)(0.30075125)
   = 1 + 0.00501252 = 1.00501252
```

True solution: y(t) = e^(t²/2). At t=0.1: y = e^(0.005) ≈ 1.00501252. Agrees to 8 decimal places! ✓

(This problem has the property that the solution is exactly a Gaussian exponential — and RK4 captures it almost perfectly with just one step of h=0.1.)
</details>

---

**Q2.** Show that the explicit Euler method for y' = -100y, y(0) = 1 is unstable for h = 0.025 but stable for h = 0.019.

<details>
<summary>Answer</summary>

Euler for y' = λy: yₙ₊₁ = (1 + hλ)yₙ.

Here λ = -100. Growth factor: (1 + h·(-100)) = (1 - 100h).

**h = 0.025:** 1 - 100(0.025) = 1 - 2.5 = **-1.5**.

|growth factor| = 1.5 > 1 → **UNSTABLE**. Solution oscillates and grows: 1, -1.5, 2.25, -3.375, ...

True solution decays to 0. Euler gives wildly oscillating blow-up. ✗

**h = 0.019:** 1 - 100(0.019) = 1 - 1.9 = **-0.9**.

|growth factor| = 0.9 < 1 → **STABLE**. Solution oscillates but decays: 1, -0.9, 0.81, -0.729, ...

True solution: e^(-100×0.019) = e^(-1.9) ≈ 0.1496 after one step. Euler gives -0.9 — magnitude right direction but wrong sign (oscillation). With more steps converges to 0. The stability condition is h < 2/100 = 0.02. ✓

**Note:** Even when stable, Euler introduces artificial oscillation (sign flips) for h·|λ| ∈ (1,2). An implicit method wouldn't have this issue.
</details>

---

**Q3.** Explain why ODE solving is called "time integration" and what conservation laws have to do with step size selection.

<details>
<summary>Answer</summary>

**Why "time integration":** ODEs describe how a state y evolves over time t. "Integrating" the equation y' = f means finding y(t) = y₀ + ∫₀ᵗ f(s,y(s)) ds — we literally integrate f to get y. The term "time integration" emphasizes that we march forward in time, accumulating changes.

**Conservation laws and step size:**

Many physical ODEs conserve a quantity (energy, momentum, angular momentum). For a numerical scheme to be useful, it should approximately conserve these quantities too.

**Example — Harmonic oscillator:** y'' + y = 0 (spring). Energy E = (y')² + y² is conserved (E = 1 always for y(0)=0, y'(0)=1).

Euler method doesn't conserve energy: errors accumulate and E grows (or shrinks, depending on stability).

**Symplectic methods** (like Störmer-Verlet, leapfrog) are specifically designed to approximately conserve energy:
```
y*       = yₙ + (h/2)·f(tₙ, vₙ)    ← half-step position
vₙ₊₁    = vₙ + h·g(y*)              ← full-step velocity
yₙ₊₁    = y* + (h/2)·f(tₙ₊₁, vₙ₊₁) ← half-step position finish
```

Symplectic methods don't conserve energy exactly, but the energy oscillates around the true value rather than drifting — crucial for long-time simulations (orbital mechanics, molecular dynamics).

**Step size implication:** If the problem has characteristic timescale τ (period of oscillation, decay time, etc.), need h < τ/10 or so to resolve the dynamics. Too-large h misses energy oscillations and gives wrong long-time behavior even if local steps are "stable."
</details>

---

**Q4.** The trapezoidal method for y' = f(t,y) is: yₙ₊₁ = yₙ + (h/2)[f(tₙ,yₙ) + f(tₙ₊₁,yₙ₊₁)]. For a linear ODE y'=Ay, write out the linear system to solve for yₙ₊₁ and give the amplification factor.

<details>
<summary>Answer</summary>

For y' = Ay (A is a matrix, y a vector):

Trapezoidal (Crank-Nicolson):
```
yₙ₊₁ = yₙ + (h/2)[Ayₙ + Ayₙ₊₁]
yₙ₊₁ = yₙ + (h/2)Ayₙ + (h/2)Ayₙ₊₁
yₙ₊₁ - (h/2)Ayₙ₊₁ = yₙ + (h/2)Ayₙ
(I - (h/2)A)yₙ₊₁ = (I + (h/2)A)yₙ
```

**Linear system to solve:** (I - (h/2)A)yₙ₊₁ = (I + (h/2)A)yₙ.

This requires solving an n×n system at each step — cost O(n³) if A changes, O(n²) with pre-factored LU.

**Amplification factor (scalar case A=λ):**

```
yₙ₊₁ = [(1 + hλ/2) / (1 - hλ/2)] × yₙ
```

Amplification factor: z(hλ) = (1 + hλ/2)/(1 - hλ/2).

**For Re(λ) < 0:** |z(hλ)| = |(1+hλ/2)/(1-hλ/2)| < 1 for ALL h > 0.

Proof: With hλ = a + ib, |1 + (a+ib)/2|² = (1+a/2)² + (b/2)² and |1-(a+ib)/2|² = (1-a/2)² + (b/2)². When a < 0: (1+a/2)² < (1-a/2)². So |numerator| < |denominator| → |z| < 1. ✓

Trapezoidal is **A-stable** — stable for all step sizes when eigenvalues have negative real parts.

(Note: Euler gives amplification (1+hλ), unstable for |1+hλ|>1. Backward Euler gives 1/(1-hλ), also A-stable. Trapezoidal is both second-order AND A-stable — the "best" combination for non-stiff systems.)
</details>

---

**Q5.** Convert the second-order ODE for the nonlinear pendulum θ'' + (g/L)sin(θ) = 0 to a first-order system and describe what the phase plane (θ, θ') looks like for small vs large initial conditions.

<details>
<summary>Answer</summary>

**Reduction:** Let u₁ = θ (angle), u₂ = θ' (angular velocity).

System:
```
u₁' = u₂
u₂' = -(g/L)sin(u₁)
```

**Phase plane analysis:**

Energy: E = (1/2)u₂² - (g/L)cos(u₁) (conserved).

**Small initial conditions (linear regime):** For small θ, sin(θ) ≈ θ. Equation becomes θ'' + (g/L)θ = 0 — simple harmonic oscillator. Phase plane shows **ellipses** centered at origin. Each ellipse is a periodic orbit with period T = 2π√(L/g).

**Large initial conditions (nonlinear regime):**
- If initial energy < 2g/L: pendulum oscillates but doesn't reach the top. Phase plane shows **closed curves** that are wider than ellipses (the period is longer than 2π√(L/g) for large amplitudes).
- If initial energy = 2g/L exactly: the **separatrix** — pendulum asymptotically reaches the inverted position (unstable equilibrium at θ=π). Phase plane shows an S-shaped curve connecting (±π, 0).
- If initial energy > 2g/L: pendulum rotates continuously (goes over the top). Phase plane shows **open curves** (θ increases without bound or wraps around).

**The separatrix** is the critical orbit dividing oscillation from rotation. It passes through the unstable fixed points (±π, 0). Near these, motion is extremely slow (infinite period).

**Numerical challenge:** Near the separatrix, the ODE is very sensitive to initial conditions (this is NOT chaotic — energy is still conserved — but small errors in initial conditions can flip between oscillation and rotation). Need very small step size near the separatrix.
</details>

---

## Chapter Summary

| Method | Order | Stages | Stability | When to Use |
|--------|-------|--------|-----------|-------------|
| Euler | 1 | 1 | Conditional | Teaching only |
| Midpoint (RK2) | 2 | 2 | Conditional | Simple problems |
| RK4 | 4 | 4 | Conditional | Standard non-stiff |
| Dormand-Prince (RK45) | 4/5 | 6 | Conditional | Adaptive, non-stiff |
| Implicit Euler | 1 | 1 | Unconditional | Stiff (low accuracy) |
| Trapezoidal (CN) | 2 | 2 | Unconditional (A-stable) | Stiff, oscillatory |
| Radau/BDF | 3-5 | implicit | L-stable | Stiff, high accuracy |

**Key concepts:**
- Local error = O(h^(p+1)), global error = O(hᵖ)
- Stiffness: eigenvalue ratio >> 1 → needs implicit method
- A-stability: stable for all h when Re(λ) < 0 → implicit methods only
- Adaptive step size: estimated error drives step control

---

*Previous: [08 — Numerical Integration](08_Numerical_Integration.md)*
*Next: [10 — ODEs: Boundary Value Problems](10_ODE_Boundary_Value.md)*
