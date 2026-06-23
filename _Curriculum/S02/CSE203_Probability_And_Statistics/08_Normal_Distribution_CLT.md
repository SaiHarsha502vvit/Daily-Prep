# Chapter 08 — The Normal Distribution & the Central Limit Theorem

> [← 07 Continuous Random Variables & PDF](07_Continuous_Random_Variables_PDF.md) | [Course Index](README.md) | [Next → 09 Joint Distributions, Covariance & Correlation](09_Joint_Distributions_Covariance.md)

---

## Why Everything Looks Gaussian

Measure the heights of 10,000 people. Plot the histogram. It's bell-shaped.
Measure ping times to a server. Bell-shaped.
Measure manufacturing error in ball bearings. Bell-shaped.
Average the face values of 100 dice rolls, repeat 10,000 times. Bell-shaped.

All these come from the same theorem: the **Central Limit Theorem (CLT)**. When you average (or sum) many independent random variables — regardless of their distribution — the result approaches a Gaussian (Normal) distribution.

This is the single most important theorem in probability. It explains why the Normal distribution appears everywhere in nature, science, and engineering.

---

## The Normal Distribution

```
X ~ Normal(μ, σ²)    [μ = mean, σ² = variance]

f(x) = (1 / (σ√(2π))) × exp(-(x-μ)² / (2σ²))

E[X] = μ
Var(X) = σ²
```

**The standard Normal:** Z ~ Normal(0, 1).

```
f(z) = (1/√(2π)) × exp(-z²/2)
```

**Standardization:** Any Normal can be converted to standard:
```
Z = (X - μ) / σ
```

If X ~ Normal(μ, σ²), then Z = (X-μ)/σ ~ Normal(0,1).

**CDF of Normal (Φ function):**
```
Φ(z) = P(Z ≤ z) = ∫_{-∞}^z (1/√(2π)) e^{-t²/2} dt
```

No closed form — computed by tables or numerical methods.

**Key values (memorize these):**
```
P(-1 ≤ Z ≤ 1) = 0.6827    (68.27% within 1σ)
P(-2 ≤ Z ≤ 2) = 0.9545    (95.45% within 2σ)
P(-3 ≤ Z ≤ 3) = 0.9973    (99.73% within 3σ)

For one-tailed:
P(Z ≤ 1.645) = 0.95    (95th percentile)
P(Z ≤ 1.960) = 0.975   (97.5th percentile) → used in 95% CI
P(Z ≤ 2.576) = 0.995   (99.5th percentile) → used in 99% CI
```

**Why e^{-x²/2}?** The Gaussian is the unique distribution that is:
1. Symmetric around 0
2. Probabilities decrease as |x| increases (tails decay)
3. Closed under addition of independent copies (additive stability)
4. The "maximum entropy" distribution for a given mean and variance (Ch10)

---

## Computing Normal Probabilities

For X ~ Normal(μ, σ²):

```
P(X ≤ x) = Φ((x - μ) / σ)

P(a ≤ X ≤ b) = Φ((b-μ)/σ) - Φ((a-μ)/σ)

P(X > x) = 1 - Φ((x-μ)/σ)
```

**Worked Example:** SAT scores are approximately Normal(μ=500, σ=100).

```
P(score ≥ 600) = P(Z ≥ (600-500)/100) = P(Z ≥ 1) = 1 - Φ(1) = 1 - 0.8413 = 0.1587

About 16% of test-takers score 600 or above.

P(400 ≤ score ≤ 700) = Φ((700-500)/100) - Φ((400-500)/100)
                      = Φ(2) - Φ(-2)
                      = 0.9772 - 0.0228 = 0.9545

The "±2σ" rule: 95.45% of scores fall within 200 points of the mean.
```

**Inverse Normal (quantile function):** Given probability p, find x such that P(X ≤ x) = p.
```
x = μ + σ × Φ⁻¹(p)

For X ~ Normal(500, 100²), find 90th percentile:
x = 500 + 100 × Φ⁻¹(0.90) = 500 + 100 × 1.282 = 628.2
```

---

## The Central Limit Theorem

**CLT (informal):** Let X₁, X₂, ..., Xₙ be independent, identically distributed (i.i.d.) random variables with mean μ and finite variance σ². The sample mean X̄ = (X₁+...+Xₙ)/n satisfies:

```
(X̄ - μ) / (σ/√n)  →  Normal(0, 1)   as n → ∞
```

Equivalently, the SUM Sₙ = X₁ + ... + Xₙ satisfies:

```
Sₙ ~ approximately Normal(nμ, nσ²)   for large n
```

**What "i.i.d." means:** Independent (no correlation between variables) and Identically Distributed (same distribution, same μ and σ²).

### Deriving the CLT (Moment Generating Function argument)

Let Y = (Sₙ - nμ) / (σ√n) be the standardized sum. The MGF (moment generating function) of Y:

```
M_Y(t) = E[e^{tY}]

If Xᵢ have MGF M_X(t), then by independence:
M_{Sₙ}(t) = [M_X(t)]ⁿ

After standardization (replace t by t/(σ√n), subtract nμ term):
M_Y(t) = [M_X(t/(σ√n)) × e^{-μt/σ√n}]ⁿ

Taylor expand M_X at 0:
M_X(s) = 1 + μs + (μ²+σ²)/2 × s² + O(s³)

For s = t/(σ√n):
M_X(t/(σ√n)) × e^{-μt/(σ√n)} ≈ 1 + σ²t²/(2n·σ²) + O(n^{-3/2})
                                = 1 + t²/(2n) + O(n^{-3/2})

[1 + t²/(2n)]ⁿ → e^{t²/2} as n → ∞

e^{t²/2} is the MGF of Normal(0,1). ✓
```

This derivation shows the CLT is a consequence of the unique MGF of the Gaussian — the only distribution whose square-root-scaling limit is stable.

---

## Why the CLT Works (Intuition)

**Extreme value averaging:**
```
Consider dice (Uniform{1,...,6}): E=3.5, σ²=35/12≈2.92

Average of n dice:
n=1:  values in {1,2,3,4,5,6}, clearly discrete and uniform
n=2:  triangle shape (same as two-dice sum from Ch05)
n=5:  roughly bell-shaped
n=30: very close to Normal(3.5, 2.92/30) = Normal(3.5, 0.097)
```

**Why bell-shaped?** When you average n random variables, extreme outcomes (all dice showing 6, or all showing 1) require n "lucky" events simultaneously — very unlikely. Values near the mean require only a balance of highs and lows — much more likely. The probability concentrates at the mean, creating the bell shape.

**Convergence speed:** CLT is remarkably fast for symmetric distributions (dice: n=5 looks nearly Gaussian). It's slower for heavily skewed distributions (exponential, Poisson with small λ). Rule of thumb: n ≥ 30 is usually sufficient, but verify for heavy-tailed or skewed distributions.

---

## The CLT in Practice

### Quality Control (Shewhart Control Charts)

Items from a manufacturing process have mean μ and standard deviation σ. Sample n=25 items and compute X̄.

By CLT: X̄ ~ Normal(μ, σ²/25) — the sampling distribution.

```
Control limits: [μ - 3σ/√25, μ + 3σ/√25] = [μ - 0.6σ, μ + 0.6σ]

If the process is in control, P(X̄ outside limits) = P(|Z| > 3) ≈ 0.003.
If X̄ falls outside these limits, the process is probably broken.
```

### A/B Test Sample Size

You run an A/B test. You observe click-through rates X̄_A and X̄_B from nA and nB samples respectively. By CLT:

```
X̄_A ~ Normal(μ_A, σ_A²/nA)
X̄_B ~ Normal(μ_B, σ_B²/nB)

X̄_A - X̄_B ~ Normal(μ_A - μ_B, σ_A²/nA + σ_B²/nB)
```

This lets you build a Z-test for whether μ_A = μ_B — entirely from CLT (Chapter 11).

### Error Bounds via CLT

If you estimate μ by X̄ from n samples, the estimation error is approximately:

```
P(|X̄ - μ| ≤ 1.96 σ/√n) ≈ 0.95    [95% confidence interval for μ]
```

To achieve ±0.01 accuracy (with 95% confidence) when σ = 0.5:
```
1.96 × 0.5/√n = 0.01
√n = 1.96 × 0.5 / 0.01 = 98
n = 98² = 9,604 samples needed.
```

---

## Normal Approximations

### Binomial → Normal (De Moivre-Laplace)

For large n: Binomial(n, p) ≈ Normal(np, np(1-p)).

Rule of thumb: use when np ≥ 5 AND n(1-p) ≥ 5.

```
X ~ Binomial(100, 0.4)
μ = 40, σ² = 24, σ = 4.899

P(X ≤ 45) ≈ Φ((45.5 - 40)/4.899)    [with continuity correction: +0.5]
           = Φ(1.122) ≈ 0.869
```

**Continuity correction:** Since Binomial is discrete and Normal is continuous, P(X ≤ 45) = P(X ≤ 45.5) in the Normal approximation. This improves accuracy.

### Poisson → Normal

For large λ: Poisson(λ) ≈ Normal(λ, λ).

Rule of thumb: use when λ ≥ 10.

---

## Section Challenge

> ### Normal Distribution and CLT Applications
>
> A server's response time is approximately Normal(μ=120ms, σ=30ms).
>
> **Q1:** What fraction of requests complete within 100ms? Within 180ms?
>
> **Q2:** The 99th percentile of response time is the value T such that 99% of requests complete in ≤ T ms. Find T.
>
> **Q3:** You monitor batches of 100 requests and compute the average response time X̄. What is the distribution of X̄? What is P(X̄ > 125ms)?
>
> **Q4:** Your SLA requires the average response time of any 100-request batch to be ≤ 130ms, 99% of the time. What must σ be for this to hold (with μ = 120ms fixed)?
>
> **Q5 (Stretch):** Request latencies are NOT normally distributed — they have a heavy right tail (occasional 10-second timeouts). You're told each request has E[X] = 120ms and Var(X) = 900ms² (σ=30ms), but the distribution is unknown. For batches of n requests:
> (a) What does the CLT guarantee about X̄ for large n?
> (b) For n=100, estimate P(X̄ > 130ms) using CLT. Is the CLT approximation reliable here? What n would make it more reliable for heavy-tailed distributions?

<details>
<summary>Full answers</summary>

```
Q1: Fractions within time limits

X ~ Normal(120, 900)  [μ=120, σ=30]

P(X ≤ 100) = Φ((100-120)/30) = Φ(-2/3) = Φ(-0.667) ≈ 0.2525
About 25.3% of requests complete within 100ms.

P(X ≤ 180) = Φ((180-120)/30) = Φ(2) ≈ 0.9772
About 97.7% of requests complete within 180ms.

──────────────────────────────────────────────────────

Q2: 99th percentile

P(X ≤ T) = 0.99
Φ((T-120)/30) = 0.99
(T-120)/30 = Φ⁻¹(0.99) = 2.326
T = 120 + 30 × 2.326 = 120 + 69.78 ≈ 190ms

99% of requests complete within ~190ms.

──────────────────────────────────────────────────────

Q3: Distribution of X̄ for n=100

By CLT: X̄ ~ Normal(μ, σ²/n) = Normal(120, 900/100) = Normal(120, 9)
σ_{X̄} = √9 = 3ms

P(X̄ > 125) = 1 - Φ((125-120)/3) = 1 - Φ(5/3) = 1 - Φ(1.667) ≈ 1 - 0.9525 = 0.0475

About 4.75% chance the average of 100 requests exceeds 125ms.

──────────────────────────────────────────────────────

Q4: Required σ for SLA compliance

Requirement: P(X̄ ≤ 130) ≥ 0.99 when μ = 120.
Equivalently: P(X̄ > 130) ≤ 0.01.

X̄ ~ Normal(120, σ²/100).

P(X̄ > 130) = 1 - Φ((130-120)/(σ/√100)) = 1 - Φ(100/σ) ≤ 0.01

Φ(100/σ) ≥ 0.99
100/σ ≥ Φ⁻¹(0.99) = 2.326
σ ≤ 100/2.326 ≈ 43.0ms

If σ ≤ 43ms, the SLA (average ≤ 130ms 99% of the time for batches of 100)
is met with μ = 120ms.

Our current σ = 30ms < 43ms, so we're safely within the SLA. ✓

──────────────────────────────────────────────────────

Q5: CLT with heavy-tailed latencies

(a) CLT guarantee:
Regardless of the distribution of individual request times, as long as
E[X] = 120 and Var(X) = 900 are finite, the CLT guarantees:

  X̄ = (X₁ + ... + Xₙ)/n → Normal(120, 900/n) in distribution as n → ∞.

The convergence is in DISTRIBUTION — for any fixed interval [a,b]:
P(a ≤ X̄ ≤ b) → Φ((b-120)/(30/√n)) - Φ((a-120)/(30/√n)).

(b) For n=100, P(X̄ > 130) via CLT:
Same computation as Q3: P(X̄ > 130) ≈ 1 - Φ(10/3) = 1 - Φ(3.33) ≈ 0.0004.

Is the CLT approximation reliable for n=100 with heavy tails?

CAUTION: For heavy-tailed distributions, the CLT converges slowly.
  - The CLT is a statement about the LIMIT as n→∞.
  - For the tail probability P(X̄ > 130), we need X̄ to be 3.33σ away from μ.
  - Tail probabilities (far from center) converge slower than probabilities
    near the mean.
  - With occasional 10-second timeouts, the effective tail behavior of X
    dominates for small n.

For heavy-tailed distributions (like the one described), a reliable CLT
approximation for tail probabilities at the 99.96th percentile may require
n ≥ 1,000 or more. The Berry-Esseen theorem gives a bound:

  |P(X̄ ≤ x) - Φ((x-μ)/(σ/√n))| ≤ C × E[|X-μ|³] / (σ³ × √n)

where E[|X-μ|³] (the third absolute moment) is large for heavy-tailed
distributions, requiring larger n for the same approximation accuracy.

Practical advice: for heavy-tailed server latency distributions:
  - Use empirical percentiles directly (log 1M real requests)
  - Or use distribution families with heavy tails (log-normal, Pareto)
  - Don't trust CLT for tail probabilities without checking skewness/kurtosis
```

</details>

---

## Common Mistakes

**Mistake 1: CLT applies to sample means, not individual observations**
- If X is exponential, then X₁ + X₂ + ... + X₁₀₀ is approximately normal — but X₁ alone is still exponential. The CLT is about SUMS/AVERAGES of many variables.

**Mistake 2: "My sample size is 30, so CLT applies" — the magic number myth**
- n=30 is a rule of thumb for symmetric distributions. For heavily skewed data, you may need n=1000+. Always check: if your data has a huge outlier fraction, CLT convergence is slow.

**Mistake 3: Ignoring the continuity correction for discrete approximations**
- P(Binomial(100,0.4) = 40) ≈ P(39.5 ≤ Normal(40,24) ≤ 40.5). Using 40 exactly without the ±0.5 correction loses accuracy, especially for small n.

**Mistake 4: σ and σ/√n confusion**
- σ is the standard deviation of one measurement.
- σ/√n = σ_{X̄} is the standard error of the mean (standard deviation of X̄ over n samples).
- These differ by a factor of √n — a common source of off-by-√n errors in confidence interval calculations.

---

## Connections

- **Chapter 07 — Continuous RVs:** Normal is a continuous RV with a specific PDF. Its CDF (the Φ function) has no closed form — a unique property.
- **Chapter 10 — LLN:** The Law of Large Numbers says X̄ → μ. The CLT says X̄ is approximately Normal with std deviation σ/√n. LLN gives convergence; CLT gives the rate.
- **Chapter 11 — Hypothesis Testing:** The Z-test and t-test are built on CLT. Test statistics are standardized sample means, compared to Normal or t distributions.
- **Chapter 12 — Confidence Intervals:** The formula X̄ ± 1.96σ/√n for a 95% CI is a direct application of CLT and the Normal distribution quantile.

---

> [← 07 Continuous Random Variables & PDF](07_Continuous_Random_Variables_PDF.md) | [Course Index](README.md) | [Next → 09 Joint Distributions, Covariance & Correlation](09_Joint_Distributions_Covariance.md)
