# Chapter 07 — Continuous Random Variables & the PDF

> [← 06 Common Discrete Distributions](06_Common_Discrete_Distributions.md) | [Course Index](README.md) | [Next → 08 Normal Distribution & CLT](08_Normal_Distribution_CLT.md)

---

## The Problem: Probabilities Over Intervals

A disk read takes between 3ms and 8ms. What's the probability it takes exactly 4.71532... ms?

Zero. In a continuous distribution, the probability of any specific single value is 0.

This isn't a contradiction — it means we ask the "wrong" question. The right question is: "What's the probability the read time falls in [4, 5]ms?" That's a positive number.

Continuous random variables require a new tool — the **probability density function (PDF)** — and integration replaces summation.

---

## From PMF to PDF

**Discrete:** P(X = k) = pₓ(k) > 0 for each value.

**Continuous:** P(X = x) = 0 for every specific x. Instead:

```
P(a ≤ X ≤ b) = ∫_a^b f(x) dx
```

where f(x) is the **probability density function (PDF)**.

**f(x) is NOT a probability.** It's a density — probability per unit length. It CAN exceed 1 (e.g., f(x) = 2 on [0, 0.5]). What must hold:

```
1. f(x) ≥ 0 for all x           (non-negative density)
2. ∫_{-∞}^{∞} f(x) dx = 1      (total probability = 1)
```

**Why integration?** Just as a PMF sums probabilities over discrete values, a PDF integrates density over an interval. The "area under the curve" IS the probability.

---

## Cumulative Distribution Function (CDF) for Continuous RVs

```
F(x) = P(X ≤ x) = ∫_{-∞}^x f(t) dt
```

**Key relationship:**
```
f(x) = F'(x)    (derivative of CDF = PDF)
P(a ≤ X ≤ b) = F(b) - F(a)
```

Properties:
- F is non-decreasing
- F(-∞) = 0, F(+∞) = 1
- F is right-continuous

For continuous RVs: P(a ≤ X ≤ b) = P(a < X < b) = P(a ≤ X < b) — endpoints don't matter (probability at any single point is 0).

---

## Expected Value and Variance

Replace summation with integration:

```
E[X] = ∫_{-∞}^{∞} x · f(x) dx

E[g(X)] = ∫_{-∞}^{∞} g(x) · f(x) dx

Var(X) = E[(X-μ)²] = ∫_{-∞}^{∞} (x-μ)² f(x) dx = E[X²] - (E[X])²
```

All properties from Chapter 05 still hold:
- E[aX + b] = aE[X] + b
- Var(aX + b) = a²Var(X)
- For independent X, Y: Var(X+Y) = Var(X) + Var(Y)

---

## Uniform Distribution

**Setup:** All values in [a, b] equally likely.

```
X ~ Uniform(a, b)

f(x) = 1/(b-a)   for a ≤ x ≤ b
f(x) = 0          otherwise

F(x) = (x-a)/(b-a)   for a ≤ x ≤ b

E[X] = (a+b)/2                    (midpoint of interval)
Var(X) = (b-a)²/12
```

**Derivations:**
```
E[X] = ∫_a^b x · 1/(b-a) dx = 1/(b-a) · [x²/2]_a^b = (b²-a²) / (2(b-a)) = (a+b)/2 ✓

E[X²] = ∫_a^b x² · 1/(b-a) dx = (a²+ab+b²)/3

Var(X) = (a²+ab+b²)/3 - ((a+b)/2)² = (b-a)²/12 ✓
```

**Application: random number generators**

`Math.random()` in Java returns X ~ Uniform(0, 1). To generate uniform values in [3, 7]:
```java
double x = 3 + Math.random() * (7 - 3);   // = 3 + 4 * Uniform(0,1) = Uniform(3, 7)
```

**Application: probability integral transform**

If X ~ Uniform(0,1) and F is any valid CDF, then Y = F⁻¹(X) has CDF F. This is how all random number distributions are generated from a uniform RNG.

---

## Exponential Distribution

**Setup:** Models time between events in a Poisson process (or time until first event). The continuous analog of the Geometric distribution.

```
X ~ Exponential(λ)    [λ > 0 is the rate parameter]

f(x) = λe^{-λx}   for x ≥ 0
F(x) = 1 - e^{-λx}

E[X] = 1/λ
Var(X) = 1/λ²
```

**Deriving f(x):**

The Poisson process has rate λ events per unit time. What's the distribution of T = time until first event?

```
P(T > t) = P(no events in [0,t]) = e^{-λt}    (Poisson with mean λt)
F(t) = P(T ≤ t) = 1 - e^{-λt}
f(t) = F'(t) = λe^{-λt} ✓
```

**E[X] derivation:**
```
E[X] = ∫_0^∞ x · λe^{-λx} dx

Integration by parts: u = x, dv = λe^{-λx}dx → du = dx, v = -e^{-λx}

= [-xe^{-λx}]_0^∞ + ∫_0^∞ e^{-λx} dx
= 0 + [-e^{-λx}/λ]_0^∞
= 0 + 1/λ = 1/λ ✓
```

**The Memoryless Property of Exponential:**

P(X > s+t | X > s) = P(X > t)

If a server has been running for s hours without failure, the probability of surviving another t hours is the same as it was at the start. The server has "no memory" of its age.

```
Proof:
P(X > s+t | X > s) = P(X > s+t) / P(X > s)
                    = e^{-λ(s+t)} / e^{-λs}
                    = e^{-λt} = P(X > t). ✓
```

This is why the exponential distribution is used for component lifetimes in reliability theory and service times in queueing theory.

**Worked Example:** A web server handles requests. Service time X ~ Exp(μ=10 per second), so average service time = 1/10 = 100ms.

```
P(request takes more than 200ms) = P(X > 0.2) = e^{-10 × 0.2} = e^{-2} ≈ 0.135

P(request takes between 50ms and 150ms):
F(0.15) - F(0.05) = (1 - e^{-1.5}) - (1 - e^{-0.5}) = e^{-0.5} - e^{-1.5}
≈ 0.607 - 0.223 = 0.384
```

---

## Comparing Discrete and Continuous Analogies

| Concept | Discrete | Continuous |
|---------|----------|------------|
| Distribution | PMF: P(X=k) | PDF: f(x) |
| Cumulative | F(x) = Σ_{k≤x} P(k) | F(x) = ∫_{-∞}^x f(t)dt |
| Mean | Σ k·P(k) | ∫ x·f(x)dx |
| Variance | Σ (k-μ)²P(k) | ∫ (x-μ)²f(x)dx |
| Total prob | Σ P(k) = 1 | ∫f(x)dx = 1 |
| P(X=k) | pₓ(k) | 0 (always!) |
| P(a≤X≤b) | Σ_{a≤k≤b} P(k) | ∫_a^b f(x)dx |
| Memoryless | Geometric(p) | Exponential(λ) |
| Counting rare events | Poisson(λ) | — |

---

## Section Challenge

> ### PDF Analysis and Derivation
>
> A PDF is proposed: f(x) = c(1-x²) for -1 ≤ x ≤ 1, and f(x) = 0 otherwise.
>
> **Q1:** Find the constant c that makes this a valid PDF.
>
> **Q2:** Find the CDF F(x) for all x.
>
> **Q3:** Compute E[X] and Var(X).
>
> **Q4:** Find P(-0.5 ≤ X ≤ 0.5).
>
> **Q5 (Stretch):** Server response times follow an Exponential(λ = 2) distribution (in seconds). Your SLA requires 99% of requests to complete within T seconds. Find T. Then: if you run 1000 independent requests, what is the expected number that violate the SLA? Use the Poisson approximation to find P(more than 15 violations).

<details>
<summary>Full answers</summary>

```
Q1: Find constant c

∫_{-1}^{1} c(1-x²) dx = 1

c ∫_{-1}^{1} (1-x²) dx = 1
c [x - x³/3]_{-1}^{1} = 1
c [(1 - 1/3) - (-1 + 1/3)] = 1
c [2/3 - (-2/3)] = 1
c × 4/3 = 1
c = 3/4

f(x) = (3/4)(1-x²) for -1 ≤ x ≤ 1.
Check: f(-1) = 0, f(0) = 3/4, f(1) = 0. Symmetric, non-negative. ✓

──────────────────────────────────────────────────────

Q2: CDF F(x)

For x < -1: F(x) = 0
For -1 ≤ x ≤ 1:
  F(x) = ∫_{-1}^x (3/4)(1-t²) dt
        = (3/4)[t - t³/3]_{-1}^x
        = (3/4)[(x - x³/3) - (-1 + 1/3)]
        = (3/4)[(x - x³/3) + 2/3]
        = (3/4)(x - x³/3 + 2/3)
        = (3x - x³ + 2) / 4     ← simplified: (3/4)(x - x³/3 + 2/3)

Let's verify: F(-1) = (-3 + 1 + 2)/4 = 0 ✓, F(1) = (3 - 1 + 2)/4 = 4/4 = 1 ✓

For x > 1: F(x) = 1

──────────────────────────────────────────────────────

Q3: E[X] and Var(X)

E[X] = ∫_{-1}^{1} x · (3/4)(1-x²) dx

Since f(x) = (3/4)(1-x²) is symmetric around 0 (even function) and
x is an odd function, the integrand x·f(x) is ODD.
The integral of an odd function over a symmetric interval [-1,1] is 0.
E[X] = 0. ✓ (Makes sense by symmetry — distribution is symmetric around 0.)

E[X²] = ∫_{-1}^{1} x² · (3/4)(1-x²) dx
      = (3/4) ∫_{-1}^{1} (x² - x⁴) dx
      = (3/4) [x³/3 - x⁵/5]_{-1}^{1}
      = (3/4) [(1/3 - 1/5) - (-1/3 + 1/5)]
      = (3/4) × 2 × (1/3 - 1/5)
      = (3/4) × 2 × (5-3)/15
      = (3/4) × 2 × 2/15
      = (3/4) × (4/15)
      = 1/5

Var(X) = E[X²] - (E[X])² = 1/5 - 0 = 1/5 = 0.2
σ = √(1/5) = 1/√5 ≈ 0.447

──────────────────────────────────────────────────────

Q4: P(-0.5 ≤ X ≤ 0.5)

P(-0.5 ≤ X ≤ 0.5) = F(0.5) - F(-0.5)

F(0.5) = (3(0.5) - (0.5)³ + 2) / 4
       = (1.5 - 0.125 + 2) / 4
       = 3.375 / 4 = 0.84375

F(-0.5) = (3(-0.5) - (-0.5)³ + 2) / 4
        = (-1.5 + 0.125 + 2) / 4
        = 0.625 / 4 = 0.15625

P(-0.5 ≤ X ≤ 0.5) = 0.84375 - 0.15625 = 0.6875

68.75% of the probability mass is in the middle half of the distribution.

Sanity check: by symmetry, F(0.5) - F(0) should equal F(0) - F(-0.5).
F(0) = 2/4 = 0.5 (midpoint, by symmetry). ✓
0.84375 - 0.5 = 0.34375 and 0.5 - 0.15625 = 0.34375. ✓

──────────────────────────────────────────────────────

Q5: SLA threshold T for Exp(λ=2)

P(X ≤ T) = 0.99   (99% of requests within T seconds)
1 - e^{-2T} = 0.99
e^{-2T} = 0.01
-2T = ln(0.01) = -4.6052
T = 2.303 seconds

The SLA threshold for 99% compliance is T ≈ 2.3 seconds.

Violations in 1000 requests:
P(violation per request) = 0.01
Expected violations = 1000 × 0.01 = 10

Poisson approximation: n = 1000 large, p = 0.01 small → N ~ Poisson(λ = 10)

P(N > 15) = 1 - P(N ≤ 15)

P(N = k) = 10^k × e^{-10} / k!

Computing P(N ≤ 15):
Using the incomplete gamma function / Poisson CDF table, P(N ≤ 15) ≈ 0.9513

P(N > 15) = 1 - 0.9513 = 0.0487 ≈ 4.9%

About a 5% chance of more than 15 SLA violations in 1000 requests,
even though the expected number is only 10. This illustrates how the
"tail" of the Poisson distribution extends well beyond the mean.
```

</details>

---

## Common Mistakes

**Mistake 1: Treating f(x) as a probability**
- f(x) is DENSITY, not probability. f(x) > 1 is perfectly valid (e.g., Uniform(0, 0.5) has f(x) = 2). Only integrals of f give probabilities.

**Mistake 2: P(X = c) = 0 doesn't mean c is "impossible"**
- For continuous RVs, every specific value has probability 0. The value can still occur — you just need intervals, not points, to get positive probability.

**Mistake 3: Confusing rate λ and mean 1/λ for Exponential**
- Exp(λ=2) means rate 2 per unit time → mean 1/2 time unit. High λ = fast rate = SHORT average time. Low λ = slow rate = LONG average time. The parameter convention varies by textbook — always check.

**Mistake 4: Applying memoryless property to non-exponential distributions**
- Memoryless property: P(X > s+t | X > s) = P(X > t). ONLY the exponential (continuous) and geometric (discrete) distributions satisfy this. Normal, Uniform, Weibull, etc. do NOT. Human lifetimes are NOT memoryless.

---

## Connections

- **Chapter 06 — Discrete Distributions:** Geometric → Exponential (memoryless continuous analog). Poisson counts → Exponential inter-arrival times. Each discrete distribution has a continuous counterpart.
- **Chapter 08 — Normal:** The sum of many small independent uniform/exponential variables converges to Normal (CLT). The normal distribution is the continuous limit of many operations.
- **Chapter 09 — Joint Distributions:** Two continuous RVs have a joint PDF f(x,y), and marginal PDFs are found by integrating out the other variable.

---

> [← 06 Common Discrete Distributions](06_Common_Discrete_Distributions.md) | [Course Index](README.md) | [Next → 08 Normal Distribution & CLT](08_Normal_Distribution_CLT.md)
