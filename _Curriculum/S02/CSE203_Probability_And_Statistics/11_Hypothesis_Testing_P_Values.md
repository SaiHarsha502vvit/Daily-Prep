# Chapter 11 — Hypothesis Testing & p-values

> [← 10 Inequalities, LLN & Convergence](10_Inequalities_LLN_Convergence.md) | [Course Index](README.md) | [Next → 12 Confidence Intervals & A/B Testing](12_Confidence_Intervals_AB_Testing.md)

---

## The Problem: Did This Result Happen by Chance?

A coin lands heads 60 times in 100 flips. Is it a fair coin? Or is it biased?

A new drug reduces recovery time from 14 days to 11 days on average (n=50 patients). Is the drug effective, or did we just get lucky with the sample?

Click-through rate on button B (8%) is higher than button A (6%) after 1000 impressions each. Is B genuinely better, or is this noise?

**Hypothesis testing** is the statistical framework for answering "could this be explained by randomness alone?" It doesn't prove an effect exists — it quantifies the evidence against the "nothing is happening" explanation.

---

## The Framework

**Null hypothesis H₀:** The "boring" explanation — no effect, no difference, nothing happening.
- H₀: coin is fair (p = 0.5)
- H₀: drug has no effect (mean recovery time unchanged)
- H₀: click rates are equal (p_A = p_B)

**Alternative hypothesis H₁:** What you want to detect.
- H₁: coin is biased (p ≠ 0.5) [two-tailed]
- H₁: drug reduces recovery (μ_treatment < μ_control) [one-tailed]
- H₁: button B is better (p_B > p_A) [one-tailed]

**The logic:** Assume H₀ is true. Compute the probability of observing results as extreme as what we saw. If that probability is tiny, the data provides evidence against H₀.

---

## The p-value

**p-value:** The probability, assuming H₀ is true, of observing a test statistic as extreme as the one observed (or more extreme).

```
p-value = P(result as extreme as observed | H₀ is true)
```

**Decision rule:** Choose a significance level α (typically 0.05) before seeing the data. If p-value ≤ α: reject H₀. If p-value > α: fail to reject H₀.

**What p-value IS:**
- The probability of the data (or more extreme data) under H₀.
- A measure of how surprising your result is IF H₀ were true.

**What p-value is NOT:**
- P(H₀ is true) — that would require Bayes' theorem and a prior.
- The probability you made an error.
- Evidence that H₁ is true (failing to reject H₀ doesn't prove it).

---

## The Coin Test: Worked Full Example

60 heads in 100 flips. Is p = 0.5?

**H₀:** p = 0.5 (fair coin).
**H₁:** p ≠ 0.5 (two-tailed: unfair in either direction).

**Test statistic:** Under H₀, X ~ Binomial(100, 0.5). E[X] = 50, Var(X) = 25, σ = 5.

By CLT (large n): Z = (X - 50)/5 ~ Normal(0,1) approximately.

Observed: X = 60. Z = (60 - 50)/5 = 2.0.

**p-value (two-tailed):** P(|Z| ≥ 2.0) = 2 × P(Z ≥ 2.0) = 2 × (1 - Φ(2)) = 2 × 0.0228 = 0.0456.

**Decision:** p = 0.0456 < α = 0.05. Reject H₀.

Conclusion: The coin shows statistically significant evidence of bias at the 5% significance level. (But the effect might be small — see "Statistical vs Practical Significance" below.)

---

## Type I and Type II Errors

```
                     Reality
                 H₀ true    H₁ true
Test   Reject H₀:  Type I     Correct (Power)
Result Fail to reject: Correct   Type II
```

**Type I error (false positive):** Reject H₀ when it's actually true. Probability = α (significance level). Also called the "false alarm rate."

**Type II error (false negative):** Fail to reject H₀ when H₁ is actually true. Probability = β. This is a missed detection.

**Power:** P(reject H₀ | H₁ is true) = 1 - β. Power measures how good the test is at detecting a real effect.

**The tradeoff:**
- Reduce α → fewer Type I errors → more Type II errors (harder to detect real effects).
- Reduce β → more power → need larger sample size.
- There's no free lunch: you can't simultaneously minimize both error types.

**Power depends on:**
1. Sample size n (larger n → more power)
2. Effect size (larger true difference → more power)
3. Significance level α (larger α → more power, but more Type I errors)
4. Variance σ² (larger variance → less power)

---

## The Z-Test and t-Test

### Z-Test (known σ)

For testing the mean of a population with known standard deviation σ:

```
H₀: μ = μ₀

Test statistic: Z = (X̄ - μ₀) / (σ/√n)

Under H₀: Z ~ Normal(0,1) (exactly, or approximately by CLT)

p-value:
  Two-tailed: p = 2 × P(Z ≥ |z_obs|) = 2(1 - Φ(|z_obs|))
  One-tailed (right): p = P(Z ≥ z_obs) = 1 - Φ(z_obs)
  One-tailed (left): p = P(Z ≤ z_obs) = Φ(z_obs)
```

### t-Test (unknown σ)

In practice, σ is usually unknown. Replace σ with the sample standard deviation s, and use the t-distribution:

```
Test statistic: t = (X̄ - μ₀) / (s/√n)

Under H₀: t ~ t(n-1) distribution  [t with n-1 degrees of freedom]

For large n, t(n-1) ≈ Normal(0,1).
For small n: t-distribution has heavier tails (more uncertainty about σ).
```

The t-distribution is the Normal distribution you'd get if σ were estimated from data rather than known exactly — it accounts for the extra variability introduced by estimating σ.

**Two-sample t-test:** Comparing means of two groups:

```
H₀: μ_A = μ_B  (or equivalently: μ_A - μ_B = 0)

t = (X̄_A - X̄_B) / √(s_A²/nA + s_B²/nB)

Under H₀: t ~ t(ν) where ν ≈ (Welch-Satterthwaite degrees of freedom formula)
```

---

## Statistical vs Practical Significance

**A result can be:**
- Statistically significant but practically irrelevant
- Practically important but not statistically significant

**Example:** Drug reduces blood pressure by 0.1 mmHg. With n = 1,000,000 patients, this could give p < 0.0001. It's statistically significant but clinically useless.

**Effect size:** Quantifies the magnitude of an effect, independent of sample size.

```
Cohen's d = (μ₁ - μ₂) / σ_pooled

d = 0.2: small effect
d = 0.5: medium effect
d = 0.8: large effect
```

A tiny d with large n gives p < 0.05. Always report effect size alongside p-value.

---

## Multiple Testing Problem

Run 20 independent tests, each with α = 0.05. Even if H₀ is true for all tests:

```
P(at least one false positive) = 1 - P(no false positives)
= 1 - (1-0.05)²⁰ = 1 - 0.95²⁰ ≈ 1 - 0.358 = 0.642
```

About 64% chance of at least one false positive! This is the **multiple testing problem** — a major source of false discoveries in science.

**Bonferroni correction:** To maintain family-wise error rate ≤ α when doing m tests, use threshold α/m per test.

```
20 tests at α = 0.05: each test uses threshold 0.05/20 = 0.0025.
```

Conservative (reduces power), but guaranteed Type I error control.

**Benjamini-Hochberg FDR control:** Less conservative. Controls the False Discovery Rate (expected proportion of false positives among all rejections). Widely used in genomics and modern data science.

---

## Section Challenge

> ### Hypothesis Test Design and Execution
>
> You're evaluating a new database index. Historical query times are Normal(μ=50ms, σ=10ms). You test the index on 25 queries and observe X̄ = 46ms.
>
> **Q1:** State H₀ and H₁ (one-tailed — you hypothesize the index is faster). Compute the test statistic (use Z-test since σ is known). Find the p-value.
>
> **Q2:** What is the critical value z_α for a one-tailed test at α = 0.05? At α = 0.01? Would you reject H₀ at each level?
>
> **Q3:** The true mean with the index is μ = 45ms (unknown to the tester). Compute the power of the test (probability of correctly detecting the improvement) at α = 0.05 and n = 25.
>
> **Q4:** To achieve 90% power with α = 0.05 for a true effect of μ = 45ms (5ms improvement), how large must n be?
>
> **Q5 (Stretch):** You run 50 separate A/B tests on your website, each at α = 0.05. Under the null (no effect), how many false positives do you expect? If 5 tests show p < 0.05, apply the Bonferroni correction and state which (if any) survive the correction. What Bonferroni threshold would you use?

<details>
<summary>Full answers</summary>

```
Q1: Test statistic and p-value

H₀: μ = 50ms (index has no effect)
H₁: μ < 50ms (index is faster, one-tailed)

Test statistic:
z = (X̄ - μ₀) / (σ/√n) = (46 - 50) / (10/√25) = -4 / (10/5) = -4/2 = -2.0

p-value (one-tailed, left): P(Z ≤ -2.0) = Φ(-2.0) = 1 - Φ(2.0) ≈ 1 - 0.9772 = 0.0228

p = 0.0228.

──────────────────────────────────────────────────────

Q2: Critical values and decisions

One-tailed (left) test: reject H₀ when z ≤ -z_α.

α = 0.05: z_α = Φ⁻¹(0.95) = 1.645. Critical value: -1.645.
  z_obs = -2.0 < -1.645 → REJECT H₀ at α = 0.05.

α = 0.01: z_α = Φ⁻¹(0.99) = 2.326. Critical value: -2.326.
  z_obs = -2.0 > -2.326 → FAIL TO REJECT H₀ at α = 0.01.

The result is significant at the 5% level but not at the 1% level.

──────────────────────────────────────────────────────

Q3: Power of the test

Under H₁ (true): μ = 45ms.
Under H₀: z_obs = (X̄ - 50)/2. Reject when z_obs ≤ -1.645, i.e., X̄ ≤ 50 - 1.645×2 = 46.71.

Power = P(X̄ ≤ 46.71 | μ = 45)
= P((X̄ - 45)/2 ≤ (46.71 - 45)/2) = P(Z ≤ 0.855)
= Φ(0.855) ≈ 0.804

Power ≈ 80.4%. With n=25, there's an 80% chance of detecting the 5ms improvement at α=0.05.
(The remaining 20% are Type II errors — failing to detect the real effect.)

──────────────────────────────────────────────────────

Q4: Sample size for 90% power

Power = 90% means P(reject | H₁ true) = 0.90.

The rejection region: X̄ ≤ μ₀ - z_α × σ/√n = 50 - 1.645 × 10/√n.

Under H₁ (μ = 45):
Power = P(X̄ ≤ 50 - 16.45/√n | μ = 45)
= Φ((50 - 16.45/√n - 45) / (10/√n))
= Φ(5/(10/√n) - 1.645)
= Φ(0.5√n - 1.645) = 0.90

Φ⁻¹(0.90) = 1.282

0.5√n - 1.645 = 1.282
0.5√n = 2.927
√n = 5.854
n = 34.27 → n = 35.

With n = 35 queries, the test achieves 90% power to detect a 5ms improvement at α = 0.05.

──────────────────────────────────────────────────────

Q5: Multiple testing with 50 A/B tests

Under null (no effect in all 50 tests):
Expected false positives = 50 × α = 50 × 0.05 = 2.5 false positives expected.

If 5 tests show p < 0.05: these 5 may include real effects OR false positives.
The 5 observations are suspicious given we expect 2.5 false positives by chance alone
— but not conclusive.

Bonferroni correction:
α_Bonferroni = α/m = 0.05/50 = 0.001.

Apply to the 5 tests: only tests with p < 0.001 survive.

If the 5 tests have p-values like {0.04, 0.03, 0.01, 0.001, 0.0008}:
  Tests with p = 0.0008 (< 0.001): SURVIVES Bonferroni.
  Tests with p = 0.001: borderline (equal to threshold, depends on strict/non-strict).
  All others (p = 0.04, 0.03, 0.01): Do NOT survive.

Only the most significant result (p = 0.0008) survives Bonferroni correction.
This is why large-scale testing (genomics, A/B testing with many variants) requires
proper multiple testing correction — many "significant" findings are false positives.
```

</details>

---

## Common Mistakes

**Mistake 1: "p = 0.05 means 5% chance H₀ is true"**
- p = P(data as extreme | H₀ true). It is NOT P(H₀ | data). Computing P(H₀ | data) requires a prior P(H₀) and Bayes' theorem. The p-value is a frequentist quantity.

**Mistake 2: Failing to reject H₀ = "proving" H₀**
- "No statistically significant effect found" ≠ "the null hypothesis is true." You may have insufficient power to detect a real effect. The absence of evidence is not evidence of absence.

**Mistake 3: Data dredging (p-hacking)**
- Running 20 tests and reporting only the one with p < 0.05 inflates Type I error. Decide your hypothesis, sample size, and significance level BEFORE collecting data.

**Mistake 4: Confusing statistical and practical significance**
- p < 0.001 with n = 10,000,000 says the effect is real. But is it big enough to matter? Always compute and report effect size (Cohen's d, relative risk, etc.).

---

## Connections

- **Chapter 08 — CLT:** The Z-test statistic is exactly the CLT standardization. The entire hypothesis testing framework rests on the CLT.
- **Chapter 04 — Bayes:** Frequentist (p-value) and Bayesian (posterior probability) approaches are complementary. The p-value answers "how surprising is this data?" — Bayes answers "how likely is the hypothesis given the data?"
- **Chapter 12 — Confidence Intervals:** Duality: the 95% CI exactly corresponds to the set of μ₀ values for which a two-tailed test at α = 0.05 would FAIL to reject. They encode the same information.

---

> [← 10 Inequalities, LLN & Convergence](10_Inequalities_LLN_Convergence.md) | [Course Index](README.md) | [Next → 12 Confidence Intervals & A/B Testing](12_Confidence_Intervals_AB_Testing.md)
