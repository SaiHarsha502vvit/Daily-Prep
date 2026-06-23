# Chapter 05 — Discrete Random Variables & Expectation

> [← 04 Bayes' Theorem](04_Bayes_Theorem_Total_Probability.md) | [Course Index](README.md) | [Next → 06 Common Discrete Distributions](06_Common_Discrete_Distributions.md)

---

## The Problem: Summarizing Randomness with Numbers

So far, events are either "happens" or "doesn't happen." But many situations produce numerical outcomes: the number of errors in a file, the time until a server crashes, the revenue from a sale.

A **random variable** maps each outcome in Ω to a number. Instead of tracking every raw outcome, we track the number it produces. This lets us ask quantitative questions: "On average, how many errors?" "What's the spread?" "What's the probability of more than 5 errors?"

---

## What Is a Random Variable?

A **random variable** X is a function X: Ω → ℝ. It assigns a real number to every outcome.

```
Example: Roll two dice. Ω = {(1,1), (1,2), ..., (6,6)}, 36 outcomes.
Define X = sum of the two dice.

X((1,1)) = 2
X((1,2)) = X((2,1)) = 3
X((3,4)) = X((4,3)) = 7
...
X((6,6)) = 12
```

The random variable X "collapses" 36 outcomes into 11 possible values (2 through 12). Instead of working with the full Ω, we work with the distribution of X.

**Notation:** Capital X is the random variable. Lowercase x is a specific value. P(X = x) is the probability X takes value x.

---

## Probability Mass Function (PMF)

For a **discrete** random variable (takes countable values), the **PMF** is:

```
pₓ(x) = P(X = x)   for each value x X can take
```

Properties (from the Kolmogorov axioms):
1. pₓ(x) ≥ 0 for all x
2. Σₓ pₓ(x) = 1 (probabilities sum to 1 over all possible values)

**Two-dice sum PMF:**

```
X = 2:  only (1,1)           → P(X=2)  = 1/36
X = 3:  (1,2), (2,1)         → P(X=3)  = 2/36
X = 4:  (1,3), (2,2), (3,1)  → P(X=4)  = 3/36
X = 5:                        → P(X=5)  = 4/36
X = 6:                        → P(X=6)  = 5/36
X = 7:  (1,6),(2,5),(3,4),(4,3),(5,2),(6,1) → P(X=7) = 6/36
X = 8:                        → P(X=8)  = 5/36
X = 9:                        → P(X=9)  = 4/36
X = 10:                       → P(X=10) = 3/36
X = 11:                       → P(X=11) = 2/36
X = 12: only (6,6)            → P(X=12) = 1/36

Sum: (1+2+3+4+5+6+5+4+3+2+1)/36 = 36/36 = 1. ✓
```

---

## Cumulative Distribution Function (CDF)

The **CDF** gives the probability X is at most x:

```
Fₓ(x) = P(X ≤ x) = Σ_{k ≤ x} pₓ(k)
```

For the two-dice sum:
```
F(5) = P(X ≤ 5) = P(X=2)+P(X=3)+P(X=4)+P(X=5) = 1/36+2/36+3/36+4/36 = 10/36 ≈ 0.278
```

The CDF is non-decreasing, starts at 0, and ends at 1. It lets you compute:
```
P(a < X ≤ b) = F(b) - F(a)
P(X > x) = 1 - F(x)
```

---

## Expected Value (Expectation)

The **expected value** E[X] (or μ) is the long-run average of X over many independent trials.

```
E[X] = Σₓ x · P(X = x)
```

Weighted average of all possible values, weighted by their probabilities.

**Two-dice sum:**
```
E[X] = 2(1/36) + 3(2/36) + 4(3/36) + 5(4/36) + 6(5/36) + 7(6/36) 
     + 8(5/36) + 9(4/36) + 10(3/36) + 11(2/36) + 12(1/36)
     = (2 + 6 + 12 + 20 + 30 + 42 + 40 + 36 + 30 + 22 + 12) / 36
     = 252 / 36
     = 7
```

The expected sum of two dice is 7. This matches intuition — 7 is the most common outcome.

**Intuition check:** If you rolled two dice 36,000 times and averaged the sums, you'd expect a result very close to 7.

---

## Linearity of Expectation

**The most powerful tool in probability:**

```
E[aX + bY] = aE[X] + bE[Y]
```

This holds even when X and Y are **dependent**. No independence required.

**Proof:**
```
E[aX + bY] = Σ_{ω∈Ω} (aX(ω) + bY(ω)) · P(ω)
           = a Σ_ω X(ω)P(ω) + b Σ_ω Y(ω)P(ω)
           = aE[X] + bE[Y]. ∎
```

**Simpler proof for two-dice sum:**

Instead of the long PMF computation, define:
- X₁ = value of die 1 → E[X₁] = (1+2+3+4+5+6)/6 = 3.5
- X₂ = value of die 2 → E[X₂] = 3.5

X = X₁ + X₂. By linearity:
```
E[X] = E[X₁] + E[X₂] = 3.5 + 3.5 = 7. ✓
```

Same answer, much easier.

**Power of linearity:** You can decompose complex random variables into simple components, compute E for each, and sum. Even if the components are dependent, linearity still works.

**Classic application — expected number of fixed points:**

Shuffle a deck of 52 cards. A "fixed point" is a card that ends up in its original position. What is E[# fixed points]?

```
Let Xᵢ = 1 if card i is in position i, 0 otherwise.
P(Xᵢ = 1) = 1/52 (by symmetry — any position is equally likely for card i).
E[Xᵢ] = P(Xᵢ = 1) × 1 + P(Xᵢ = 0) × 0 = 1/52.

X = X₁ + X₂ + ... + X₅₂ (total fixed points).
E[X] = E[X₁] + ... + E[X₅₂] = 52 × (1/52) = 1.

Expected number of fixed points in a random permutation = 1.
(This holds for any n: E = n × (1/n) = 1, regardless of deck size!)
```

The Xᵢ are NOT independent (they're highly correlated — if 51 cards are fixed, the 52nd must be too), but linearity works anyway.

---

## Variance and Standard Deviation

E[X] tells you the center. **Variance** measures the spread.

```
Var(X) = E[(X - μ)²] = E[X²] - (E[X])²
```

The second form (computing formula) is usually easier:
```
Var(X) = E[X²] - μ²
```

**Standard deviation:** σ = √Var(X). Same units as X.

**Two-dice sum variance:**
```
E[X²] = Σ x² · P(X=x) = 4(1/36) + 9(2/36) + 16(3/36) + ... + 144(1/36)
      = (4 + 18 + 48 + 80 + 150 + 294 + 320 + 324 + 300 + 242 + 144) / 36
      = 1974 / 36 = 54.833...

Var(X) = 54.833 - 7² = 54.833 - 49 = 5.833

σ = √5.833 ≈ 2.415
```

Or using linearity: Var(X₁ + X₂) = Var(X₁) + Var(X₂) [if **independent**!]

```
Var(X₁) = E[X₁²] - (E[X₁])² = (1+4+9+16+25+36)/6 - 3.5² = 91/6 - 12.25 ≈ 2.917
Var(X) = 2.917 + 2.917 = 5.833 ✓
```

**CRITICAL:** Variance adds for independent variables. Expectation adds always. This asymmetry matters.

**Useful properties:**
```
Var(aX + b) = a² Var(X)    (shifting by b doesn't change spread, scaling by a scales variance by a²)
Var(X + Y) = Var(X) + Var(Y) + 2Cov(X,Y)    (general case)
Var(X + Y) = Var(X) + Var(Y)                  (if X, Y independent → Cov = 0)
```

---

## Functions of Random Variables: E[g(X)]

If Y = g(X) for some function g:
```
E[g(X)] = Σₓ g(x) · P(X = x)
```

Note: E[g(X)] ≠ g(E[X]) in general. This is **Jensen's Inequality** (for convex g: E[g(X)] ≥ g(E[X])).

```
Example: X is uniform on {1, 2, 3}. E[X] = 2. E[X²] = (1+4+9)/3 = 14/3 ≈ 4.67.
g(E[X]) = 2² = 4 ≠ 4.67 = E[g(X)].
```

---

## Section Challenge

> ### Expected Value & Variance Analysis
>
> You're analyzing a load balancer that routes requests. Each request independently goes to Server A with probability 0.6 and Server B with probability 0.4. The processing time (in ms) for each server:
> - Server A: X_A ∈ {10, 20, 30} with P = {0.5, 0.3, 0.2}
> - Server B: X_B ∈ {5, 15, 25} with P = {0.4, 0.4, 0.2}
>
> **Q1:** Compute E[X_A] and E[X_B].
>
> **Q2:** Compute Var(X_A) and Var(X_B).
>
> **Q3:** Let T = processing time of a randomly routed request. T = X_A with prob 0.6, T = X_B with prob 0.4. Compute E[T] using the Law of Total Expectation: E[T] = E[T|A]P(A) + E[T|B]P(B).
>
> **Q4:** In 100 independent requests, let S = total processing time. What is E[S] and Var(S)? What is P(S > 1,700 ms) approximately? (Hint: use the fact that Var of sum of independent = sum of variances, then apply CLT from Ch08 — state what you'd need.)
>
> **Q5 (Stretch):** Define I = indicator of whether A processed the request (I=1 if A, I=0 if B). Compute E[I] and E[IT] (expected processing time weighted by the event it went to A). Show that E[T] = E[IT] + E[(1-I)T] = E[T|A]P(A) + E[T|B]P(B). This derives the Law of Total Expectation from linearity.

<details>
<summary>Full answers</summary>

```
Q1: E[X_A] and E[X_B]

E[X_A] = 10 × 0.5 + 20 × 0.3 + 30 × 0.2
       = 5 + 6 + 6 = 17 ms

E[X_B] = 5 × 0.4 + 15 × 0.4 + 25 × 0.2
       = 2 + 6 + 5 = 13 ms

Server A is slower on average (17 ms vs 13 ms).

──────────────────────────────────────────────────────

Q2: Var(X_A) and Var(X_B)

E[X_A²] = 100 × 0.5 + 400 × 0.3 + 900 × 0.2
        = 50 + 120 + 180 = 350

Var(X_A) = E[X_A²] - (E[X_A])² = 350 - 289 = 61 ms²
σ_A = √61 ≈ 7.81 ms

E[X_B²] = 25 × 0.4 + 225 × 0.4 + 625 × 0.2
        = 10 + 90 + 125 = 225

Var(X_B) = 225 - 169 = 56 ms²
σ_B = √56 ≈ 7.48 ms

The two servers have similar variance (both around 56-61 ms²).

──────────────────────────────────────────────────────

Q3: E[T] via Law of Total Expectation

E[T] = E[T | routed to A] × P(A) + E[T | routed to B] × P(B)
     = E[X_A] × 0.6 + E[X_B] × 0.4
     = 17 × 0.6 + 13 × 0.4
     = 10.2 + 5.2
     = 15.4 ms

Average request processing time is 15.4 ms.

──────────────────────────────────────────────────────

Q4: S = total processing time over 100 requests

Individual requests are independent, so:
E[S] = 100 × E[T] = 100 × 15.4 = 1,540 ms

For Var(S): need Var(T) first.
E[T²] = E[X_A²] × P(A) + E[X_B²] × P(B)
      = 350 × 0.6 + 225 × 0.4
      = 210 + 90 = 300

Wait — this needs care. T is NOT simply a mixture of X_A and X_B.
For a single request:
  T = X_A with prob 0.6, T = X_B with prob 0.4.
  E[T] = 15.4 (computed above)

E[T²] = E[T² | A]P(A) + E[T² | B]P(B)     [LOTE applied to T²]
      = E[X_A²] × 0.6 + E[X_B²] × 0.4
      = 350 × 0.6 + 225 × 0.4
      = 210 + 90 = 300

Var(T) = E[T²] - (E[T])² = 300 - (15.4)² = 300 - 237.16 = 62.84 ms²

For 100 independent requests:
Var(S) = 100 × Var(T) = 100 × 62.84 = 6,284 ms²
σ_S = √6,284 ≈ 79.3 ms

P(S > 1,700):
To compute this, we need the CLT (Chapter 08):
  By CLT: S ≈ Normal(μ = 1540, σ = 79.3)
  P(S > 1700) = P(Z > (1700 - 1540)/79.3) = P(Z > 2.018) ≈ 1 - 0.978 = 0.022

About 2.2% of 100-request batches will exceed 1,700 ms total.

──────────────────────────────────────────────────────

Q5: Deriving Law of Total Expectation from linearity

I = 1 if request goes to A, I = 0 if B.
E[I] = P(A) = 0.6.

E[IT] = E[I × T]
When I = 1: T = X_A.
When I = 0: IT = 0.
E[IT] = E[X_A | A] × P(A) = E[X_A] × 0.6 = 17 × 0.6 = 10.2

E[(1-I)T]:
When I = 0: (1-I) = 1 and T = X_B.
When I = 1: (1-I) = 0.
E[(1-I)T] = E[X_B | B] × P(B) = E[X_B] × 0.4 = 13 × 0.4 = 5.2

By linearity:
E[T] = E[IT + (1-I)T] = E[IT] + E[(1-I)T] = 10.2 + 5.2 = 15.4 ✓

General derivation:
E[T] = E[IT] + E[(1-I)T]
     = E[T|A]P(A) + E[T|B]P(B)

This is the Law of Total Expectation, derived directly from linearity of
expectation + the definition of conditional expectation.
E[T|B]P(B) = E[T × I_{B}] = Σ_ω T(ω)I_B(ω)P(ω) = Σ_{ω∈B} T(ω)P(ω). ∎
```

</details>

---

## Common Mistakes

**Mistake 1: E[g(X)] ≠ g(E[X])** (Jensen's inequality)
```
E[X²] ≠ (E[X])²    (this would mean Var(X) = 0 always!)
E[1/X] ≠ 1/E[X]    (concave function — E[1/X] > 1/E[X])
E[√X] ≠ √E[X]      (concave function)
```
This mistake appears constantly in financial modeling and physics.

**Mistake 2: Var(X+Y) = Var(X) + Var(Y) only when independent**
- Variance is NOT linear in general. The general formula includes 2Cov(X,Y).
- Variance of sum of independent variables = sum of variances. This is used extensively in statistics.

**Mistake 3: E[X] can be a value X never takes**
- E[fair die] = 3.5. A die never shows 3.5. E[X] is a long-run average, not a "typical" outcome.

**Mistake 4: Negative variance is impossible — if you compute it, you made an error**
- Var(X) = E[X²] - (E[X])² ≥ 0 always (because E[X²] ≥ (E[X])² by Jensen, since x² is convex). Negative variance signals arithmetic error.

---

## Connections

- **Chapter 06 — Distributions:** PMFs for Binomial, Geometric, Poisson — each is a specific formula for pₓ(k), and their E[X] and Var(X) are derived using the tools from this chapter.
- **Chapter 09 — Joint Distributions:** Extends PMF to two or more random variables simultaneously. Linearity of expectation is the key link.
- **Chapter 10 — LLN:** The sample mean (X̄ = (X₁+...+Xₙ)/n) converges to E[X] as n → ∞. The Law of Large Numbers is a theorem about random variable averages.

---

> [← 04 Bayes' Theorem](04_Bayes_Theorem_Total_Probability.md) | [Course Index](README.md) | [Next → 06 Common Discrete Distributions](06_Common_Discrete_Distributions.md)
