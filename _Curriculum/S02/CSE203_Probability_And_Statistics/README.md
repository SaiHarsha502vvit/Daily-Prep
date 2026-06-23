# CSE203 — Probability & Statistics

**Semester:** S02 | **Hours:** ~18h | **Prerequisite:** CSE101 Discrete Mathematics, CSE103 Linear Algebra

---

## Why This Course

Every CS decision involves uncertainty. How fast is this algorithm on average? Is this drug effective or just noisy data? Will this recommendation be clicked? Should I deploy v2 or wait for more A/B test data?

Probability and statistics give you a quantitative language for uncertainty — one that machine learning, algorithm analysis, security, and system reliability all depend on. This course derives that language from scratch: not "here are the formulas" but "here is why these formulas are the only coherent way to reason under uncertainty."

---

## Course Arc

```
Unit 1: What Is Probability?
  Ch01 — Probability Axioms & Sample Spaces
  Ch02 — Counting: Permutations & Combinations
  Ch03 — Conditional Probability & Independence
  Ch04 — Bayes' Theorem & the Total Probability Law

Unit 2: Random Variables
  Ch05 — Discrete Random Variables & Expectation
  Ch06 — Common Discrete Distributions
  Ch07 — Continuous Random Variables & the PDF
  Ch08 — The Normal Distribution & the Central Limit Theorem

Unit 3: Multiple Variables & Convergence
  Ch09 — Joint Distributions, Covariance & Correlation
  Ch10 — Inequalities, LLN & Convergence

Unit 4: Statistical Inference
  Ch11 — Hypothesis Testing & p-values
  Ch12 — Confidence Intervals, CLT Applications & A/B Testing
```

---

## Chapter Index

| # | Title | Topics |
|---|-------|--------|
| [01](01_Probability_Axioms_Sample_Spaces.md) | Probability Axioms & Sample Spaces | Kolmogorov axioms, events, unions, complements |
| [02](02_Counting_Permutations_Combinations.md) | Counting: Permutations & Combinations | Multiplication rule, factorials, C(n,k), inclusion-exclusion |
| [03](03_Conditional_Probability_Independence.md) | Conditional Probability & Independence | P(A\|B), product rule, independence definition |
| [04](04_Bayes_Theorem_Total_Probability.md) | Bayes' Theorem & Total Probability | LOTP, Bayes, prior/posterior, base-rate neglect |
| [05](05_Discrete_Random_Variables_Expectation.md) | Discrete Random Variables & Expectation | PMF, CDF, E[X], linearity, variance |
| [06](06_Common_Discrete_Distributions.md) | Common Discrete Distributions | Bernoulli, Binomial, Geometric, Poisson |
| [07](07_Continuous_Random_Variables_PDF.md) | Continuous Random Variables & PDF | PDF, CDF, E[X], uniform, exponential |
| [08](08_Normal_Distribution_CLT.md) | Normal Distribution & CLT | Gaussian, Z-scores, CLT derivation, applications |
| [09](09_Joint_Distributions_Covariance.md) | Joint Distributions, Covariance & Correlation | Joint PMF/PDF, marginals, independence, Cov, Corr |
| [10](10_Inequalities_LLN_Convergence.md) | Inequalities, LLN & Convergence | Markov, Chebyshev, law of large numbers, convergence |
| [11](11_Hypothesis_Testing_P_Values.md) | Hypothesis Testing & p-values | Null/alternative, Type I/II errors, t-test, p-value meaning |
| [12](12_Confidence_Intervals_AB_Testing.md) | Confidence Intervals & A/B Testing | CI derivation, t-CI, A/B testing, statistical power |

---

## Prerequisites in Action

| Prior Course | What You'll Use |
|-------------|----------------|
| CSE101 Discrete Math | Sets and counting (sample spaces), proof by inclusion-exclusion |
| CSE103 Linear Algebra | Covariance matrix, PCA as variance maximization, multivariate Gaussian |

---

## Why This Matters for CS

| Topic | CS Application |
|-------|---------------|
| Bayes' Theorem | Spam filters, medical diagnosis, Naive Bayes classifier |
| Distributions | Algorithm average-case analysis (Quicksort pivot), network traffic modeling |
| CLT | Why averaging makes noise disappear; why large datasets become more Gaussian |
| Hypothesis testing | A/B testing for feature launches, drug trials, benchmark comparisons |
| Confidence intervals | "95% CI for latency: [42ms, 58ms]" — what this actually guarantees |
| Correlation | Feature selection in ML, Simpson's paradox |
