# Chapter 12 — Confidence Intervals & A/B Testing

> [← 11 Hypothesis Testing & p-values](11_Hypothesis_Testing_P_Values.md) | [Course Index](README.md)

---

## The Problem: A Sample Gave Us a Number. How Wrong Could We Be?

You measure average response time for 100 servers: X̄ = 47ms. But you only sampled 100 of 10,000 servers. How far off is 47ms from the true fleet mean?

You run an A/B test. Group A converts at 6.2%, Group B at 7.8%. Is that gap real — or could the true rates be tied and you just got unlucky samples?

A **confidence interval** directly answers the first question. **A/B testing** formalizes the second. Both are built on the CLT from Chapter 08 and the hypothesis testing logic from Chapter 11.

---

## The Confidence Interval: Inverting a Hypothesis Test

**Setup:** True population mean μ is unknown. You observe sample mean X̄ from n observations with known σ (or large n so s ≈ σ).

From CLT: X̄ ~ Normal(μ, σ²/n).

Standardize: Z = (X̄ - μ) / (σ/√n) ~ Normal(0,1).

We know: P(-z_{α/2} ≤ Z ≤ z_{α/2}) = 1 - α.

Substitute and rearrange:

```
P(-z_{α/2} ≤ (X̄ - μ)/(σ/√n) ≤ z_{α/2}) = 1 - α

P(X̄ - z_{α/2}·σ/√n ≤ μ ≤ X̄ + z_{α/2}·σ/√n) = 1 - α
```

**95% Confidence Interval** (α = 0.05, z_{α/2} = z_{0.025} = 1.96):

```
CI = X̄ ± 1.96 × σ/√n
```

**This is the key formula in all of applied statistics.**

**Worked example:** Response times, X̄ = 47ms, σ = 10ms, n = 100.

```
CI = 47 ± 1.96 × 10/√100 = 47 ± 1.96 × 1 = 47 ± 1.96 = (45.04, 48.96)
```

The 95% CI for the true fleet mean is (45.0, 49.0)ms.

---

## What "95% Confidence" Actually Means

This is the most misunderstood concept in statistics. Commit this:

**The interval is random. μ is fixed (but unknown).**

Before you collect data: 95% of the intervals you WOULD construct this way contain μ.

After you collect data: your specific interval either contains μ or it doesn't. There is no probability — it's a fact you just don't know.

**The correct interpretation:**
"We used a procedure that generates intervals containing the true parameter 95% of the time."

**NOT correct:**
- "There's a 95% probability μ is in (45, 49)." ← μ is fixed, not random.
- "We're 95% sure the true mean is in this range." ← Same problem.

**Analogy:** A broken clock is either right or wrong. You can't say "it's 95% right." But if you have 100 broken clocks and 95 of them show the correct time, you can say "95% of these clocks are right."

---

## The t-Distribution: When σ is Unknown

In practice, σ is usually unknown — you use the sample standard deviation s.

Replace σ/√n with s/√n, and replace z_{α/2} with t_{α/2, n-1} (the critical value from the t-distribution with n-1 degrees of freedom):

```
CI = X̄ ± t_{α/2, n-1} × s/√n
```

The t-distribution has heavier tails than Normal because estimating σ from data adds uncertainty. As n → ∞, t_{n-1} → Normal(0,1), so t_{α/2} → z_{α/2}.

| n | t_{0.025, n-1} | vs z = 1.96 |
|---|----------------|-------------|
| 5 | 2.776 | 42% wider |
| 10 | 2.228 | 14% wider |
| 30 | 2.042 | 4% wider |
| 100 | 1.984 | 1% wider |
| ∞ | 1.960 | same |

For n ≥ 30, the normal approximation is usually good enough.

---

## Margin of Error and Sample Size Calculation

**Margin of error:** E = z_{α/2} × σ/√n

To achieve a desired margin of error E with confidence 1-α:

```
E = z_{α/2} × σ/√n

Solve for n:   n = (z_{α/2} × σ / E)²
```

**Worked example:** You want a 95% CI for response time with E = ±2ms, and σ ≈ 10ms (from historical data).

```
n = (1.96 × 10 / 2)² = (9.8)² = 96.04 → n = 97 requests.
```

To cut the margin in half, quadruple the sample size (because √n appears in the denominator).

---

## CI for Proportions

For a binary outcome (click/no-click, success/failure, conversion/not), the natural estimator is the sample proportion p̂ = X/n.

By CLT (using p̂ as the estimator):

```
SE(p̂) = √(p̂(1-p̂)/n)

95% CI for p: p̂ ± 1.96 × √(p̂(1-p̂)/n)
```

**Worked example:** 82 conversions in 1000 visitors. p̂ = 82/1000 = 0.082.

```
SE = √(0.082 × 0.918 / 1000) = √(0.0000753) ≈ 0.00867

95% CI: 0.082 ± 1.96 × 0.00867 = 0.082 ± 0.017 = (0.065, 0.099)
```

True conversion rate is between 6.5% and 9.9% (95% confidence).

---

## A/B Testing: The Full Framework

An A/B test is a two-sample hypothesis test combined with a CI on the difference.

**Setup:**
- Control (A): nA observations, conversion rate p̂_A
- Treatment (B): nB observations, conversion rate p̂_B
- We want to know: is p_B > p_A?

**Step 1 — State hypotheses:**
```
H₀: p_A = p_B (no difference)
H₁: p_B > p_A (B is better, one-tailed)
   OR
H₁: p_A ≠ p_B (either can be better, two-tailed)
```

**Step 2 — Choose α and β before seeing data:**
Typical: α = 0.05 (5% false positive rate), power = 1-β = 0.80 (80% chance of detecting a true effect).

**Step 3 — Calculate required sample size:**

```
For a two-sample proportion test:

n = (z_α + z_β)² × [p̄(1-p̄) × 2] / (p_A - p_B)²

where p̄ = (p_A + p_B)/2, z_α and z_β are critical values for the chosen α and power.
```

For α = 0.05 (one-tailed): z_α = 1.645
For β = 0.20 (80% power): z_β = 0.842

**Step 4 — Run the experiment.**
Collect exactly n observations per group. Do NOT peek at results and stop early (this inflates Type I error).

**Step 5 — Compute the test statistic:**
```
z = (p̂_B - p̂_A) / SE_diff

SE_diff = √(p̂_pooled × (1-p̂_pooled) × (1/nA + 1/nB))
         where p̂_pooled = (X_A + X_B)/(nA + nB)
```

**Step 6 — Compare to critical value or compute p-value.**

**Step 7 — Report the CI on the difference, not just "significant/not":**
```
95% CI on (p_B - p_A):
(p̂_B - p̂_A) ± 1.96 × SE_diff
```

This tells you the range of plausible true differences — both statistical significance AND practical magnitude.

---

## Full A/B Test Example

Button A (blue): 480 conversions in 8000 visitors → p̂_A = 0.060.
Button B (green): 544 conversions in 8000 visitors → p̂_B = 0.068.

**H₀:** p_A = p_B. **H₁:** p_A ≠ p_B (two-tailed).

```
p̂_pooled = (480 + 544) / (8000 + 8000) = 1024/16000 = 0.064

SE_diff = √(0.064 × 0.936 × (1/8000 + 1/8000))
        = √(0.0599 × 0.00025)
        = √(0.00001498)
        ≈ 0.00387

z = (0.068 - 0.060) / 0.00387 = 0.008 / 0.00387 ≈ 2.07

p-value (two-tailed) = 2 × (1 - Φ(2.07)) = 2 × 0.0192 = 0.0384
```

p = 0.038 < α = 0.05. Reject H₀.

**95% CI on the difference:**
```
0.008 ± 1.96 × 0.00387 = 0.008 ± 0.0076 = (0.0004, 0.0156)
```

The true difference is between +0.04% and +1.56%. Button B is better, but the effect could be as small as 0.04 percentage points — is that practically meaningful? Use effect size to decide.

---

## Common A/B Testing Pitfalls

**Pitfall 1: Peeking (early stopping)**
Checking results every day and stopping when p < 0.05 inflates Type I error. If you run 10 looks, your effective α is ~0.40, not 0.05.

Fix: Decide sample size upfront using a power calculation. Run until you hit it. Or use sequential testing methods (e.g., SPRT, always-valid p-values).

**Pitfall 2: Multiple variants (A/B/C/D testing)**
Running 4 variants and declaring the winner inflates Type I error via multiple comparisons. Use Bonferroni or False Discovery Rate correction when comparing more than 2 groups.

**Pitfall 3: Long-run vs short-run effects**
A/B tests measure the effect during the test period. Users adapt — a "novelty effect" can make B look good initially but fade over time. Consider holdout experiments over longer periods for meaningful changes.

**Pitfall 4: Segment effects**
Button B may be better for mobile users and worse for desktop users. The overall effect masks the interaction. Always segment your analysis (mobile vs desktop, new vs returning user, etc.).

**Pitfall 5: Survivor bias in selection**
Only running A/B tests on features you expect to win biases the portfolio. Always include a set of "null" experiments to calibrate your testing infrastructure — they should show ~5% false positives at α = 0.05.

---

## The CI-Hypothesis Test Duality

This is one of the deep unifying results of frequentist statistics:

```
Reject H₀: μ = μ₀  (two-tailed at level α)
⟺
μ₀ is NOT in the 100(1-α)% confidence interval for μ
```

They're equivalent. The confidence interval is the "set of all null hypotheses you would NOT reject." This duality means:
- If 0 is NOT in the 95% CI for (p_B - p_A), the two-tailed test rejects H₀ at α=0.05.
- If 0 IS in the CI, you fail to reject H₀.

A CI gives you strictly more information than a yes/no hypothesis test: it gives you both significance AND magnitude.

---

## Section Challenge

> ### A/B Test Power and Confidence Intervals
>
> Your e-commerce site has a baseline checkout conversion rate of p_A = 0.04 (4%). You believe a new checkout flow (B) will improve this to p_B = 0.05 (5%) — a 1 percentage-point lift.
>
> **Q1:** Compute the required sample size per group to detect this difference with α = 0.05 (two-tailed) and 80% power. Use the formula:
> n = (z_{α/2} + z_β)² × 2 × p̄(1-p̄) / (p_B - p_A)², where p̄ = (p_A+p_B)/2 = 0.045.
>
> **Q2:** You run the experiment. Results: Group A: 400 conversions in 10,000. Group B: 510 conversions in 10,000. Compute p̂_A and p̂_B. Compute the pooled proportion. Compute the test statistic z and p-value (two-tailed).
>
> **Q3:** Compute the 95% CI on the difference (p_B - p_A). Does it contain 0? Is the result practically meaningful for a business that wants at least 0.5pp improvement to justify the rollout?
>
> **Q4:** Your colleague says "p = 0.023 is very significant, so p_B - p_A is at least 1.5pp." Identify the error and explain what the correct interpretation is.
>
> **Q5 (Stretch):** You run 3 variants (A, B, C) simultaneously. All three are pairwise-compared at α = 0.05. What is the family-wise error rate under H₀ (all variants equal)? Propose a Bonferroni correction. What if you used the Benjamini-Hochberg procedure to control FDR at 5% — how does that differ from Bonferroni?

<details>
<summary>Full answers</summary>

```
Q1: Required sample size

p_A = 0.04, p_B = 0.05, p̄ = 0.045
α = 0.05 (two-tailed): z_{α/2} = z_{0.025} = 1.96
80% power (β = 0.20): z_β = z_{0.20} = 0.842

n = (z_{α/2} + z_β)² × 2 × p̄(1-p̄) / (p_B - p_A)²
  = (1.96 + 0.842)² × 2 × 0.045 × 0.955 / (0.05 - 0.04)²
  = (2.802)² × 2 × 0.042975 / (0.01)²
  = 7.851 × 0.08595 / 0.0001
  = 0.6747 / 0.0001
  = 6747

n ≈ 6,747 per group, or ~13,494 total.

Detecting a 1pp lift from 4% requires ~6,750 observations per group.
This is why A/B tests on low-conversion-rate features (ads, checkout) need weeks of traffic.

──────────────────────────────────────────────────────

Q2: Test statistic

p̂_A = 400/10000 = 0.04
p̂_B = 510/10000 = 0.051

p̂_pooled = (400 + 510)/(10000 + 10000) = 910/20000 = 0.0455

SE_diff = √(0.0455 × (1-0.0455) × (1/10000 + 1/10000))
        = √(0.0455 × 0.9545 × 0.0002)
        = √(0.0000869)
        ≈ 0.00932

z = (0.051 - 0.04) / 0.00932 = 0.011 / 0.00932 ≈ 1.180

p-value (two-tailed) = 2 × P(Z ≥ 1.180) = 2 × (1 - Φ(1.180))
Φ(1.18) ≈ 0.881
p-value ≈ 2 × (1 - 0.881) = 2 × 0.119 = 0.238

p = 0.238 > α = 0.05. FAIL TO REJECT H₀.

Despite 400 vs 510 conversions, the result is NOT statistically significant.
The difference (1.1pp) is within the noise at this sample size.

──────────────────────────────────────────────────────

Q3: 95% CI and practical significance

95% CI on (p̂_B - p̂_A):

Note: For the CI (unlike the test statistic), we use the unpooled SE:
SE_unpooled = √(p̂_A(1-p̂_A)/nA + p̂_B(1-p̂_B)/nB)
            = √(0.04×0.96/10000 + 0.051×0.949/10000)
            = √(0.00000384 + 0.00000484)
            = √(0.00000868)
            ≈ 0.00932   [very similar to pooled here]

95% CI: (0.051 - 0.04) ± 1.96 × 0.00932
      = 0.011 ± 0.01827
      = (-0.007, 0.029)
      = (-0.7pp, +2.9pp)

The CI CONTAINS 0, confirming we fail to reject H₀.

Practical significance: The business threshold is 0.5pp improvement.
The CI includes values below 0.5pp (in fact, it includes negative effects).
We cannot conclude that B meets the 0.5pp threshold.

Recommendation: Run the experiment longer (we're under the ~13,494 needed).

──────────────────────────────────────────────────────

Q4: Identifying the error

The claim "p = 0.023 means p_B - p_A is at least 1.5pp" is wrong.

The p-value tells us P(data as extreme | H₀ true).
A small p-value provides evidence AGAINST H₀ being true.
It says NOTHING about the magnitude of the effect.

A tiny effect (e.g., 0.01pp) could have p < 0.001 with a large enough sample.
A large effect could have p = 0.5 with a tiny sample.

The p-value IS NOT:
- The probability the effect is zero
- A measure of the effect size
- Evidence that the effect exceeds any threshold

The correct interpretation: "p = 0.023 means that, IF the two variants had equal
conversion rates, we'd observe a difference this large (or larger) about 2.3% of the time.
This is surprising enough to reject the null at α = 0.05."

To claim the effect is at least 1.5pp, look at the 95% CI lower bound.
If the CI lower bound is > 0.015, THEN you can claim the effect exceeds 1.5pp.

──────────────────────────────────────────────────────

Q5: Multiple comparisons with 3 variants

3 variants → 3 pairwise comparisons: (A vs B), (A vs C), (B vs C).

Family-wise error rate (FWER) under H₀:
P(at least one false positive) = 1 - P(no false positives)
= 1 - (1-0.05)³ = 1 - 0.857 = 0.143

14.3% chance of at least one spurious "significant" finding — not 5%.

Bonferroni correction:
α_per_test = 0.05/3 ≈ 0.0167
Only call a comparison significant if p < 0.0167.

This controls FWER ≤ 0.05 exactly (by the union bound).
Trade-off: power is reduced — each individual test is harder to pass.

Benjamini-Hochberg (BH) FDR control at 5%:
Sort the 3 p-values: p₁ ≤ p₂ ≤ p₃.
For each k = 1,2,3: check if p_k ≤ (k/3) × 0.05.
Reject all H₀ for which this holds.

BH controls the False Discovery Rate (FDR = expected fraction of rejections that are false).
Bonferroni controls FWER (probability of ANY false rejection).

BH is LESS conservative than Bonferroni:
- Bonferroni guarantees zero false positives with 95% probability (across the family)
- BH allows some false positives, but controls their PROPORTION at 5%

For A/B testing with many variants (20+ variants in an optimization suite),
BH is usually preferred — it finds more real effects at the cost of a small,
controlled false-positive rate. Bonferroni becomes overly punishing.

Example with 3 p-values {0.012, 0.024, 0.078}:
BH thresholds: k=1: 0.05×1/3 = 0.0167; k=2: 0.05×2/3 = 0.0333; k=3: 0.05×3/3 = 0.05.
p₁=0.012 < 0.0167 → reject H₀ for comparison 1 ✓
p₂=0.024 < 0.0333 → reject H₀ for comparison 2 ✓
p₃=0.078 > 0.05 → fail to reject H₀ for comparison 3
BH declares 2 significant discoveries.

Bonferroni (threshold 0.0167): only p₁=0.012 passes. 1 discovery.
```

</details>

---

## The Course in Retrospect: One Big Arc

Twelve chapters, one derivation chain:

```
Axioms (Ch01)
  └─► Counting (Ch02)
        └─► Conditional Probability (Ch03)
              └─► Bayes' Theorem (Ch04)
                    └─► Random Variables / Expectation (Ch05)
                          └─► Discrete Distributions (Ch06)
                                └─► Continuous RVs / PDF (Ch07)
                                      └─► Normal / CLT (Ch08)
                                            └─► Joint Distributions (Ch09)
                                                  └─► Inequalities / LLN (Ch10)
                                                        └─► Hypothesis Testing (Ch11)
                                                              └─► Confidence Intervals / A/B Testing (Ch12)
```

Every result was derived from the Kolmogorov axioms. No formula was given without a proof or derivation. The CLT (Ch08) was the hinge — everything before built to it, everything after uses it.

The three fundamental tools you now have:

| Tool | Question | Core formula |
|------|----------|-------------|
| Confidence Interval | How uncertain is this estimate? | X̄ ± z · σ/√n |
| Hypothesis Test | Could this be noise? | p-value = P(data | H₀) |
| Power Analysis | How big does n need to be? | n = (z_α + z_β)² σ² / Δ² |

These three underlie every data-driven decision in software engineering: load testing, A/B experiments, monitoring, capacity planning, ML model evaluation.

---

## What Comes Next

This course is the foundation for:

- **Bayesian inference** (replace fixed α with prior distributions → posterior distributions)
- **Linear regression** (E[Y|X] = β₀ + β₁X, with hypothesis tests on β₁)
- **Machine learning theory** (bias-variance tradeoff, VC dimension, PAC learning)
- **Causal inference** (moving from correlation to causation: instrumental variables, DiD, RCTs)
- **Time series** (autocorrelation, ARIMA, spectral analysis)

---

> [← 11 Hypothesis Testing & p-values](11_Hypothesis_Testing_P_Values.md) | [Course Index](README.md)
