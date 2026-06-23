# Chapter 09 — Joint Distributions, Covariance & Correlation

> [← 08 Normal Distribution & CLT](08_Normal_Distribution_CLT.md) | [Course Index](README.md) | [Next → 10 Inequalities, LLN & Convergence](10_Inequalities_LLN_Convergence.md)

---

## The Problem: Two Variables At Once

So far: one random variable X. But real problems involve multiple quantities simultaneously:
- CPU load AND memory usage of a server
- Height AND weight of a person
- Feature vector of an email (100+ variables) for spam detection

We need a framework for multiple random variables: their joint behavior, how they relate, and how knowing one variable changes what we know about another.

---

## Joint PMF (Discrete)

For two discrete RVs X, Y:

```
p_{X,Y}(x, y) = P(X = x, Y = y)
```

Properties:
1. p_{X,Y}(x,y) ≥ 0
2. Σₓ Σᵧ p_{X,Y}(x,y) = 1

**Example:** Roll two dice. X = value of die 1, Y = value of die 2.

Since dice are independent: p_{X,Y}(i,j) = 1/36 for all i,j ∈ {1,...,6}.

**Example with dependence:** Flip a fair coin twice. X = number of heads, Y = value of 2nd flip (1 if heads, 0 if tails).

```
Joint table:
        Y=0     Y=1     (marginal X)
X=0:   1/4     0       1/4
X=1:   1/4     1/4     1/2
X=2:   0       1/4     1/4
       ───     ───     ───
(marg): 1/2    1/2     1
```

---

## Marginal Distributions

The marginal PMF of X is obtained by summing over all values of Y:

```
p_X(x) = Σᵧ p_{X,Y}(x, y)    ("marginalizing out" Y)
p_Y(y) = Σₓ p_{X,Y}(x, y)    ("marginalizing out" X)
```

**Intuition:** The marginal is what you'd observe if you only tracked one variable and ignored the other.

In the coin example above, p_X is what we already knew: X ~ Binomial(2, 0.5).

---

## Joint PDF (Continuous)

For continuous X, Y:

```
P(a ≤ X ≤ b, c ≤ Y ≤ d) = ∫_c^d ∫_a^b f_{X,Y}(x,y) dx dy
```

Properties:
1. f_{X,Y}(x,y) ≥ 0
2. ∫∫ f_{X,Y}(x,y) dx dy = 1

Marginal PDFs:
```
f_X(x) = ∫_{-∞}^{∞} f_{X,Y}(x,y) dy
f_Y(y) = ∫_{-∞}^{∞} f_{X,Y}(x,y) dx
```

**Uniform on a unit disk:** f(x,y) = 1/π for x²+y² ≤ 1.

```
Marginal f_X(x) = ∫_{-√(1-x²)}^{√(1-x²)} 1/π dy = 2√(1-x²)/π
```

This is NOT uniform in x! Even though the joint distribution is uniform over the disk, the marginal over one axis is NOT uniform.

---

## Independence of Random Variables

X and Y are independent if knowing X tells you nothing about Y:

```
p_{X,Y}(x, y) = p_X(x) · p_Y(y)     [discrete]
f_{X,Y}(x, y) = f_X(x) · f_Y(y)     [continuous]
```

**Consequence:** For independent X, Y:
- P(X ∈ A, Y ∈ B) = P(X ∈ A) × P(Y ∈ B)
- E[XY] = E[X] × E[Y]
- Var(X+Y) = Var(X) + Var(Y)

**Testing independence:** If f(x,y) can be factored as g(x)·h(y), they're independent (after checking the support doesn't create dependence).

---

## Conditional Distribution

Given Y = y, the conditional distribution of X:

```
Discrete: p_{X|Y}(x|y) = p_{X,Y}(x,y) / p_Y(y)

Continuous: f_{X|Y}(x|y) = f_{X,Y}(x,y) / f_Y(y)
```

This is a valid PMF/PDF in x for each fixed y.

**Conditional expectation:**
```
E[X | Y = y] = Σₓ x · p_{X|Y}(x|y)    [discrete]
E[X | Y = y] = ∫ x · f_{X|Y}(x|y) dx   [continuous]
```

**Law of Total Expectation (vector form):**
```
E[X] = E[E[X|Y]] = Σᵧ E[X|Y=y] · P(Y=y)
```

---

## Covariance

**Covariance** measures how X and Y move together:

```
Cov(X, Y) = E[(X - μ_X)(Y - μ_Y)] = E[XY] - E[X]E[Y]
```

- Cov(X,Y) > 0: when X is above its mean, Y tends to be above its mean too (positive relationship).
- Cov(X,Y) < 0: when X is above its mean, Y tends to be below (negative relationship).
- Cov(X,Y) = 0: no LINEAR relationship (but could still be nonlinearly dependent!).

**Key properties:**
```
Cov(X, X) = Var(X)
Cov(X, Y) = Cov(Y, X)
Cov(aX + b, cY + d) = ac · Cov(X, Y)    (shifting doesn't change covariance)
Cov(X₁ + X₂, Y) = Cov(X₁, Y) + Cov(X₂, Y)    (bilinear)

Var(X + Y) = Var(X) + 2Cov(X,Y) + Var(Y)
Var(Σᵢ Xᵢ) = Σᵢ Var(Xᵢ) + 2Σᵢ<ⱼ Cov(Xᵢ, Xⱼ)
```

**Worked Example:** X = number of heads, Y = number of tails in 2 coin flips.

```
X + Y = 2 always (constant).  → Y = 2 - X.
E[X] = 1, E[Y] = 1.
E[XY] = E[X(2-X)] = 2E[X] - E[X²] = 2×1 - (0×1/4 + 1×1/2 + 4×1/4) = 2 - 1.5 = 0.5.
Cov(X,Y) = E[XY] - E[X]E[Y] = 0.5 - 1×1 = -0.5.

As expected: more heads → fewer tails. Negative covariance. ✓
```

---

## Correlation

Covariance depends on the scale of X and Y. Height and weight have huge covariance (because they're measured in centimeters and kilograms). To get a scale-free measure:

```
Corr(X, Y) = ρ = Cov(X, Y) / (σ_X × σ_Y)
```

**Properties:**
- -1 ≤ ρ ≤ 1 always. (Cauchy-Schwarz inequality ensures this.)
- ρ = 1: perfect positive linear relationship (Y = aX + b, a > 0).
- ρ = -1: perfect negative linear relationship (Y = aX + b, a < 0).
- ρ = 0: no linear relationship. (But nonlinear dependence possible!)

**Proof that |ρ| ≤ 1 (via Cauchy-Schwarz):**
```
Var(X/σ_X + Y/σ_Y) ≥ 0
Var(X/σ_X) + 2Cov(X/σ_X, Y/σ_Y) + Var(Y/σ_Y) ≥ 0
1 + 2ρ + 1 ≥ 0  →  ρ ≥ -1

Similarly Var(X/σ_X - Y/σ_Y) ≥ 0  →  ρ ≤ 1. ∎
```

---

## Simpson's Paradox

Correlation can be completely reversed when data is pooled across subgroups.

**Classic example:** A drug treatment shows:
```
Overall data:
  Treatment group: 40/100 recover (40%)
  Control group:   50/100 recover (50%)
  → Drug seems HARMFUL

But split by disease severity:
  Mild cases:   Treatment 35/50 (70%), Control 7/10 (70%) — tie
  Severe cases: Treatment 5/50 (10%),  Control 3/90 (3.3%) — Drug HELPS!

What happened? The treatment group had more severe cases.
The severity variable "confounds" the drug-recovery relationship.
```

**Why this matters for data science:** Never interpret a correlation without checking for confounders. The observed correlation (or reversal) can be entirely explained by a third variable. Correlation in observational data does NOT imply causation.

---

## The Bivariate Normal Distribution

The most important multivariate distribution. (X, Y) jointly bivariate Normal if:

```
f(x, y) = 1/(2πσ_Xσ_Y√(1-ρ²)) × exp(-1/(2(1-ρ²)) × [(x-μ_X)²/σ_X² - 2ρ(x-μ_X)(y-μ_Y)/(σ_Xσ_Y) + (y-μ_Y)²/σ_Y²])
```

Parameters: μ_X, μ_Y, σ_X, σ_Y, ρ.

**Key property:** For bivariate Normal, ρ = 0 implies independence. (For general distributions, Cov=0 does NOT imply independence — only the bivariate Normal has this equivalence.)

**Conditional distribution:** Given Y = y:
```
X | Y=y ~ Normal(μ_X + ρ(σ_X/σ_Y)(y-μ_Y),  σ_X²(1-ρ²))
```

This is the formula behind **linear regression** — the conditional mean of X given Y is a linear function of Y.

---

## Section Challenge

> ### Joint Distribution Analysis
>
> Two software modules A and B independently fail with probabilities p_A = 0.1 and p_B = 0.2. Let X = 1 if A fails (0 otherwise), Y = 1 if B fails (0 otherwise).
>
> **Q1:** Write the joint PMF table for (X, Y). Verify they sum to 1.
>
> **Q2:** Compute Cov(X, Y) and Corr(X, Y). Interpret the sign.
>
> **Q3:** Let Z = X + Y (number of modules that fail). Write the PMF of Z and compute E[Z] and Var(Z) using the joint distribution. Verify using linearity.
>
> **Q4:** Now suppose A and B are NOT independent: P(B fails | A fails) = 0.5, and P(A fails) = 0.1 still. What is the new Cov(X, Y)?
>
> **Q5 (Stretch):** Two continuous variables X (CPU load) and Y (memory usage) have joint density:
> ```
> f(x,y) = cx²y  for 0 ≤ x ≤ 1, 0 ≤ y ≤ 1
> ```
> (a) Find c. (b) Are X and Y independent? (c) Find E[XY] and Cov(X, Y).

<details>
<summary>Full answers</summary>

```
Q1: Joint PMF table (X, Y independent)

Since A, B independent: P(X=x, Y=y) = P(X=x) × P(Y=y)
P(X=0)=0.9, P(X=1)=0.1, P(Y=0)=0.8, P(Y=1)=0.2

          Y=0      Y=1     (X marginal)
X=0:   0.72     0.18     0.90
X=1:   0.08     0.02     0.10
       ──────   ──────   ──────
(marg): 0.80    0.20     1.00 ✓

──────────────────────────────────────────────────────

Q2: Cov(X,Y) and Corr(X,Y) for independent case

Since X and Y are independent:
E[XY] = E[X]E[Y] = 0.1 × 0.2 = 0.02
Cov(X,Y) = E[XY] - E[X]E[Y] = 0.02 - 0.02 = 0.

Corr(X,Y) = 0 / (σ_X × σ_Y) = 0.

Sign: zero — independent modules have no covariance.
This confirms: independence → zero covariance (the converse fails in general).

──────────────────────────────────────────────────────

Q3: PMF of Z = X + Y

Z = X+Y can be 0, 1, or 2:
P(Z=0) = P(X=0, Y=0) = 0.72
P(Z=1) = P(X=1, Y=0) + P(X=0, Y=1) = 0.08 + 0.18 = 0.26
P(Z=2) = P(X=1, Y=1) = 0.02

Check: 0.72 + 0.26 + 0.02 = 1.00 ✓

E[Z] = 0(0.72) + 1(0.26) + 2(0.02) = 0 + 0.26 + 0.04 = 0.30
Via linearity: E[Z] = E[X] + E[Y] = 0.1 + 0.2 = 0.30 ✓

Var(Z) from PMF:
E[Z²] = 0²(0.72) + 1²(0.26) + 2²(0.02) = 0 + 0.26 + 0.08 = 0.34
Var(Z) = 0.34 - 0.30² = 0.34 - 0.09 = 0.25

Via independence: Var(Z) = Var(X) + Var(Y) + 2Cov(X,Y)
Var(X) = p_A(1-p_A) = 0.1×0.9 = 0.09
Var(Y) = p_B(1-p_B) = 0.2×0.8 = 0.16
Cov(X,Y) = 0 (independent)
Var(Z) = 0.09 + 0.16 + 0 = 0.25 ✓

──────────────────────────────────────────────────────

Q4: Cov(X,Y) when dependent: P(B fails | A fails) = 0.5

P(X=1) = p_A = 0.1
P(Y=1|X=1) = 0.5  (conditional)
P(Y=1|X=0) = ?    Need this.

P(Y=1) = P(Y=1|X=1)P(X=1) + P(Y=1|X=0)P(X=0)    [LOTP]
0.2 = 0.5×0.1 + P(Y=1|X=0)×0.9
0.2 = 0.05 + 0.9P(Y=1|X=0)
P(Y=1|X=0) = 0.15/0.9 ≈ 0.1667

Now compute E[XY]:
E[XY] = E[XY|X=1]P(X=1) + E[XY|X=0]P(X=0)
E[XY|X=1] = 1 × P(Y=1|X=1) = 0.5
E[XY|X=0] = 0 (since X=0)
E[XY] = 0.5 × 0.1 + 0 × 0.9 = 0.05

Cov(X,Y) = E[XY] - E[X]E[Y] = 0.05 - 0.1×0.2 = 0.05 - 0.02 = 0.03

Positive covariance: when A fails, B is more likely to fail too
(perhaps they share infrastructure). The joint failure probability
P(X=1,Y=1) = P(Y=1|X=1)P(X=1) = 0.5×0.1 = 0.05,
which is 0.05 vs 0.02 for independent case — 2.5× higher probability
of both failing simultaneously.

──────────────────────────────────────────────────────

Q5: Joint density f(x,y) = cx²y on [0,1]²

(a) Find c:
∫₀¹∫₀¹ cx²y dx dy = c [x³/3]₀¹ [y²/2]₀¹ = c × (1/3) × (1/2) = c/6 = 1
c = 6.

f(x,y) = 6x²y for 0 ≤ x ≤ 1, 0 ≤ y ≤ 1.

(b) Independence check:
f_X(x) = ∫₀¹ 6x²y dy = 6x² [y²/2]₀¹ = 3x²   for 0 ≤ x ≤ 1
f_Y(y) = ∫₀¹ 6x²y dx = 6y [x³/3]₀¹ = 2y     for 0 ≤ y ≤ 1

Check: f_X(x) × f_Y(y) = 3x² × 2y = 6x²y = f(x,y). ✓

YES, X and Y are INDEPENDENT. The joint density factors.

(c) E[XY] and Cov(X,Y):
Since independent: E[XY] = E[X] × E[Y].

E[X] = ∫₀¹ x × 3x² dx = ∫₀¹ 3x³ dx = 3/4
E[Y] = ∫₀¹ y × 2y dy = ∫₀¹ 2y² dy = 2/3

E[XY] = (3/4)(2/3) = 1/2

Cov(X,Y) = E[XY] - E[X]E[Y] = 1/2 - 1/2 = 0.

Zero covariance confirms independence (and in this case, independence
implies zero covariance — the factorizability of f proved independence).
```

</details>

---

## Common Mistakes

**Mistake 1: Zero covariance implies independence (FALSE)**
- Cov(X,Y) = 0 means NO LINEAR relationship. But X and Y could be nonlinearly dependent.
- Example: X ~ Uniform(-1,1), Y = X². Cov(X,Y) = E[X³] - E[X]E[X²] = 0 - 0 = 0 (since X³ is odd). But Y is completely determined by X — they are fully dependent.
- Exception: Bivariate Normal — Cov=0 iff independent.

**Mistake 2: Correlation implies causation**
- Ice cream sales and drowning deaths are positively correlated (both peak in summer). Temperature is the confounder. Always look for confounders before claiming causal relationships.

**Mistake 3: Marginalizing changes independence**
- X and Y can be dependent even if you marginalize them correctly. The marginal distribution of X says nothing about its relationship with Y.

**Mistake 4: Var(X-Y) = Var(X) - Var(Y)**
- WRONG. Var(X-Y) = Var(X) + Var(Y) - 2Cov(X,Y). Variance never subtracts — variance of a difference is a SUM of variances (for independent variables).

---

## Connections

- **Chapter 05 — Expectation:** E[XY], the key quantity in covariance, requires joint distribution. If X,Y independent: E[XY] = E[X]E[Y].
- **Chapter 08 — Normal:** The multivariate (bivariate) Normal is the most important joint distribution. Its covariance matrix encodes all pairwise relationships.
- **CSE103 Linear Algebra:** The covariance matrix Σ = E[(X-μ)(X-μ)ᵀ] for a random vector X is a symmetric positive semi-definite matrix. Its eigenvectors are the principal components of the data (PCA).

---

> [← 08 Normal Distribution & CLT](08_Normal_Distribution_CLT.md) | [Course Index](README.md) | [Next → 10 Inequalities, LLN & Convergence](10_Inequalities_LLN_Convergence.md)
