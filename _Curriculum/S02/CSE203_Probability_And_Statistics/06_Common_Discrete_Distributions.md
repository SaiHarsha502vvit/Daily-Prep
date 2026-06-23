# Chapter 06 — Common Discrete Distributions

> [← 05 Discrete Random Variables & Expectation](05_Discrete_Random_Variables_Expectation.md) | [Course Index](README.md) | [Next → 07 Continuous Random Variables & PDF](07_Continuous_Random_Variables_PDF.md)

---

## Why Named Distributions?

The same mathematical structure appears in seemingly unrelated problems:
- "Probability of k heads in n coin flips" and "probability of k defective items in a batch of n" are the same formula.
- "Time until first success in repeated trials" and "number of packets until a routing error" have the same distribution.
- "Number of typos per page" and "number of radioactive decays per second" follow the same law.

Named distributions are templates. Recognizing which template fits your problem immediately gives you E[X], Var(X), and the full PMF — without re-deriving everything from scratch.

---

## Bernoulli Distribution

The simplest case: one trial, two outcomes.

**Setup:** One experiment with P(success) = p, P(failure) = 1-p = q.

```
X ~ Bernoulli(p)

X = 1 (success) with probability p
X = 0 (failure) with probability 1-p

PMF: P(X=1) = p,  P(X=0) = 1-p

E[X] = 1·p + 0·(1-p) = p
E[X²] = 1²·p + 0²·(1-p) = p
Var(X) = E[X²] - (E[X])² = p - p² = p(1-p)
```

A Bernoulli variable is a single coin flip. Its variance is maximized at p=0.5 (maximum uncertainty) and is 0 when p=0 or p=1 (no uncertainty).

---

## Binomial Distribution

**Setup:** n independent Bernoulli(p) trials. Count the successes.

```
X ~ Binomial(n, p)

P(X = k) = C(n,k) · pᵏ · (1-p)^(n-k)    for k = 0, 1, ..., n
```

**Deriving the PMF:**
- Choose WHICH k of the n trials are successes: C(n,k) ways.
- Those k trials each succeed with probability p: pᵏ.
- The remaining n-k trials each fail with probability 1-p: (1-p)^(n-k).
- By independence: multiply. Sum over all C(n,k) arrangements: C(n,k)·pᵏ·(1-p)^(n-k). ✓

**E[X] and Var(X):**

By linearity (X = sum of n independent Bernoulli(p) variables):
```
E[X] = n·E[Bernoulli] = np
Var(X) = n·Var(Bernoulli) = np(1-p)
```

**Worked Example:** A software test suite has 20 test cases. Each test independently has a 5% chance of being flaky (failing randomly when the code is correct). What is P(exactly 2 flaky failures)?

```
X ~ Binomial(20, 0.05)
P(X=2) = C(20,2) · (0.05)² · (0.95)^18
        = 190 · 0.0025 · 0.3972
        = 190 × 0.000993
        ≈ 0.1887

About 19% chance of exactly 2 flaky failures.

E[X] = 20 × 0.05 = 1.   (Expected 1 flaky failure per run.)
```

**The Binomial Theorem link:** Σₖ C(n,k)pᵏ(1-p)^(n-k) = (p + (1-p))ⁿ = 1ⁿ = 1. Confirms the PMF sums to 1.

---

## Geometric Distribution

**Setup:** Repeat independent Bernoulli(p) trials until the FIRST success. Count the number of trials.

```
X ~ Geometric(p)

P(X = k) = (1-p)^(k-1) · p    for k = 1, 2, 3, ...
```

**Deriving the PMF:** To have first success on trial k: fail k-1 times, then succeed.
- k-1 failures: (1-p)^(k-1)
- 1 success: p
- Multiply: (1-p)^(k-1)·p ✓

**E[X] and Var(X):**
```
E[X] = 1/p
Var(X) = (1-p)/p²
```

**Derivation of E[X]:** Use the memoryless property.

Let E = E[X]. On trial 1:
- With prob p: success. We needed 1 trial. Contribution: p × 1.
- With prob (1-p): failure. We've now used 1 trial and are back to the start — we still need E more trials. Contribution: (1-p) × (1 + E).

```
E = p × 1 + (1-p)(1 + E)
E = p + (1-p) + (1-p)E
E = 1 + (1-p)E
E - (1-p)E = 1
pE = 1
E = 1/p. ✓
```

**The Memoryless Property:** P(X > m+n | X > m) = P(X > n).
Given you've already failed m times, the distribution of remaining trials is the same as starting fresh. The geometric distribution is the only memoryless discrete distribution.

**Worked Example:** A server retries a failed network request every second. Each retry succeeds with probability 0.3. What is the expected number of attempts until first success?

```
X ~ Geometric(0.3)
E[X] = 1/0.3 ≈ 3.33 attempts
Var(X) = 0.7/0.09 ≈ 7.78
σ ≈ 2.79

P(first success on attempt 5) = (0.7)⁴ × 0.3 = 0.2401 × 0.3 ≈ 0.072
P(more than 10 attempts) = P(X > 10) = (0.7)^10 ≈ 0.028
```

---

## Poisson Distribution

**Setup:** Count of rare events in a fixed interval (time, space, area) when events occur at constant average rate λ.

```
X ~ Poisson(λ)

P(X = k) = (λᵏ · e^{-λ}) / k!    for k = 0, 1, 2, ...

E[X] = λ
Var(X) = λ
```

**Deriving Poisson from Binomial (the limiting argument):**

Divide a time interval of length 1 into n tiny sub-intervals. Each sub-interval has at most one event, occurring with probability p = λ/n (so average count = np = λ).

As n → ∞ (sub-intervals → infinitesimal):
```
P(X = k) = C(n,k) · (λ/n)^k · (1 - λ/n)^(n-k)

C(n,k) · (λ/n)^k = n(n-1)...(n-k+1)/k! · λᵏ/nᵏ → λᵏ/k!  (as n→∞)

(1 - λ/n)^(n-k) → e^{-λ}  (standard limit: (1-x/n)ⁿ → e^{-x})

Therefore: P(X=k) → λᵏe^{-λ}/k!. ✓
```

**When to use Poisson:**
- Rare events (λ small relative to n)
- Independent occurrences
- Constant rate (homogeneous Poisson process)

**Worked Examples:**

*Server errors:* A web server averages 2 errors per hour. What is P(exactly 3 errors in an hour)?
```
X ~ Poisson(2)
P(X=3) = 2³ · e^{-2} / 3! = 8 × 0.1353 / 6 ≈ 0.180

P(no errors) = P(X=0) = e^{-2} ≈ 0.135
```

*Bug density:* A codebase averages 3 bugs per 1000 lines. A 500-line module is reviewed. What is the expected number of bugs?
```
λ = 3/1000 × 500 = 1.5 bugs expected.
X ~ Poisson(1.5)
P(X=0) = e^{-1.5} ≈ 0.223  (22% chance of no bugs — not great!)
P(X ≥ 3) = 1 - P(X=0) - P(X=1) - P(X=2)
          = 1 - e^{-1.5}(1 + 1.5 + 1.125)
          = 1 - 0.223 × 3.625
          ≈ 1 - 0.809 = 0.191
```

**Poisson superposition:** If X ~ Poisson(λ₁) and Y ~ Poisson(λ₂) are independent, then X+Y ~ Poisson(λ₁+λ₂). Errors from two independent modules can be combined simply.

---

## Hypergeometric Distribution

**Setup:** Draw n items WITHOUT replacement from a population of N items containing K "successes." Count successes drawn.

```
X ~ Hypergeometric(N, K, n)

P(X = k) = C(K,k) · C(N-K, n-k) / C(N, n)

E[X] = n · K/N
Var(X) = n · (K/N) · (1 - K/N) · (N-n)/(N-1)
```

**When to use instead of Binomial:** Sampling WITHOUT replacement from a finite population. The (N-n)/(N-1) factor in variance is the "finite population correction" — draws are dependent (knowing one outcome changes the remaining probabilities).

**Example:** A box has 20 widgets, 5 are defective. You inspect 8. What is P(exactly 2 are defective)?
```
N=20, K=5, n=8.
P(X=2) = C(5,2) × C(15,6) / C(20,8)
        = 10 × 5005 / 125970
        = 50050 / 125970
        ≈ 0.397
```

---

## Section Challenge

> ### Distribution Identification and Calculation
>
> For each scenario, identify the distribution family, state its parameters, and compute the requested probabilities.
>
> **Q1 (Binomial):** An A/B test shows a new button design has a 12% click-through rate (vs 10% old design). You show the new button to 50 users independently. What is:
> (a) P(exactly 8 users click)?
> (b) E[clicks] and Var(clicks)?
> (c) P(at least 5 clicks)? (Express as 1 − P(≤4), set up the terms.)
>
> **Q2 (Geometric):** A penetration tester tries random passwords until finding the correct one. Assume 1 in 10,000 random attempts succeeds (p = 10⁻⁴). What is:
> (a) E[number of attempts until first success]?
> (b) P(success within 10,000 attempts)?
> (c) P(more than 20,000 attempts needed)?
>
> **Q3 (Poisson):** A database receives queries at an average rate of 500 per minute. In a 0.1-second interval, what is:
> (a) The expected number of queries?
> (b) P(zero queries in 0.1 seconds)?
> (c) P(more than 2 queries in 0.1 seconds)?
>
> **Q4:** Why does Poisson(λ) have E[X] = Var(X) = λ? Give an intuitive explanation, then derive E[X] = λ from the PMF definition.
>
> **Q5 (Stretch):** A randomized quicksort picks a uniform random pivot. The probability the pivot is a "good" pivot (splits the array to between 25% and 75% on each side) is 1/2. Model the number of pivots tried until finding a good one as a Geometric(1/2). How does this relate to the O(n log n) average-case analysis of quicksort? (Hint: E[levels until good pivot] and what happens at each level.)

<details>
<summary>Full answers</summary>

```
Q1: Binomial(50, 0.12)

(a) P(X = 8):
P(X=8) = C(50,8) × (0.12)⁸ × (0.88)^42

C(50,8) = 50!/(8!×42!) = 536,878,650
(0.12)⁸ = 4.299 × 10⁻⁸
(0.88)^42 ≈ e^(42 × ln(0.88)) = e^(42 × -0.1278) ≈ e^{-5.368} ≈ 0.00466

P(X=8) ≈ 536,878,650 × 4.299×10⁻⁸ × 0.00466
        ≈ 536,878,650 × 2.00×10⁻¹⁰ ≈ 0.1075

About 10.8% chance of exactly 8 clicks.

(b) E[X] = 50 × 0.12 = 6 clicks
    Var(X) = 50 × 0.12 × 0.88 = 5.28
    σ = √5.28 ≈ 2.30 clicks

(c) P(X ≥ 5) = 1 - P(X ≤ 4) = 1 - [P(0) + P(1) + P(2) + P(3) + P(4)]

P(X=k) = C(50,k)(0.12)^k(0.88)^(50-k) for each k.

P(X=0) = (0.88)^50 ≈ e^{50×(-0.1278)} ≈ e^{-6.39} ≈ 0.00167
P(X=1) = 50 × 0.12 × (0.88)^49 ≈ 50 × 0.12 × 0.00190 ≈ 0.01138
P(X=2) = C(50,2)(0.12)²(0.88)^48 ≈ 1225 × 0.0144 × 0.00215 ≈ 0.03793
P(X=3) = C(50,3)(0.12)³(0.88)^47 ≈ 19600 × 0.001728 × 0.00245 ≈ 0.08291
P(X=4) ≈ C(50,4)(0.12)⁴(0.88)^46 ≈ 0.13326

P(X ≤ 4) ≈ 0.00167 + 0.01138 + 0.03793 + 0.08291 + 0.13326 ≈ 0.267

P(X ≥ 5) ≈ 1 - 0.267 = 0.733

About 73% chance of 5 or more clicks.

──────────────────────────────────────────────────────

Q2: Geometric(p = 10⁻⁴)

(a) E[X] = 1/p = 1/10⁻⁴ = 10,000 attempts.

(b) P(success within 10,000 attempts):
P(X ≤ 10,000) = 1 - P(X > 10,000) = 1 - (1-p)^{10,000}
= 1 - (0.9999)^{10,000}
≈ 1 - e^{-1}  [since (1-1/n)^n → e^{-1}]
≈ 1 - 0.368 ≈ 0.632

About 63.2% chance of success within 10,000 attempts.
(This is the famous "1 - 1/e" result from the coupon collector problem.)

(c) P(more than 20,000 attempts):
P(X > 20,000) = (0.9999)^{20,000} ≈ e^{-2} ≈ 0.135

About 13.5% chance of needing more than 20,000 attempts.

──────────────────────────────────────────────────────

Q3: Poisson

Rate: 500 queries/minute = 500/60 queries/second ≈ 8.333 queries/second.
In 0.1 seconds: λ = 8.333 × 0.1 = 0.8333 queries.

X ~ Poisson(λ = 5/6 ≈ 0.8333)

(a) E[X] = λ ≈ 0.8333 queries per 0.1-second interval.

(b) P(X = 0) = e^{-λ} = e^{-5/6} ≈ e^{-0.8333} ≈ 0.4346

About 43% of 0.1-second intervals have zero queries.

(c) P(X > 2) = 1 - P(X=0) - P(X=1) - P(X=2)
P(X=0) = e^{-5/6} ≈ 0.4346
P(X=1) = (5/6)e^{-5/6} ≈ 0.3622
P(X=2) = (5/6)²e^{-5/6}/2 ≈ 0.1509

P(X > 2) = 1 - 0.4346 - 0.3622 - 0.1509 = 0.0523

About 5.2% chance of more than 2 queries in 0.1 seconds.

──────────────────────────────────────────────────────

Q4: Why E[X] = Var(X) = λ for Poisson

Intuition: Poisson(λ) is the limit of Binomial(n, λ/n) as n→∞.
  E[Binomial(n, p)] = np = λ. ✓
  Var[Binomial(n, p)] = np(1-p) = λ(1-λ/n) → λ as n→∞. ✓
  
So the Poisson distribution "inherits" equal mean and variance from the
large-n limit of the binomial.

Intuitively: for rare events (small p), the binomial variance np(1-p) ≈ np = λ
because (1-p) ≈ 1. The mean and variance are both determined by the rate λ.

Formal derivation of E[X] = λ:
E[X] = Σ_{k=0}^∞ k × λᵏe^{-λ}/k!
     = Σ_{k=1}^∞ k × λᵏe^{-λ}/k!    (k=0 term is 0)
     = λe^{-λ} Σ_{k=1}^∞ λ^{k-1}/(k-1)!    (cancel k with k!)
     = λe^{-λ} Σ_{j=0}^∞ λʲ/j!             (let j = k-1)
     = λe^{-λ} × e^λ                         (Taylor series: e^λ = Σ λʲ/j!)
     = λ. ∎

──────────────────────────────────────────────────────

Q5: Quicksort pivot and Geometric distribution

Each pivot selection: probability 1/2 of being "good" (25-75% split).
Let G ~ Geometric(1/2). E[G] = 2 pivots expected until a good one.

Quicksort analysis:
  Level 0: 1 subproblem of size n.
  Each level: we pick pivots until finding a good one.
    E[pivots at this level] = 2 (by Geometric mean).
    Each pivot requires O(n) work (partition scan).
    E[total work at this level] = O(n) per level.

  After a good pivot: the larger sub-problem has size at most 3n/4.
  Number of levels until subproblems are size 1:
    (3/4)^L × n = 1 → L = log_{4/3}(n) = O(log n) levels.

  Total work = O(n) per level × O(log n) levels = O(n log n). ✓

The Geometric(1/2) distribution captures the randomness of pivot selection:
in expectation, we waste only 1 extra pivot per level (2 total instead of 1),
and each level requires exactly O(n) total work.
```

</details>

---

## Common Mistakes

**Mistake 1: Using Binomial when sampling without replacement (should be Hypergeometric)**
- Binomial requires independence. Without replacement, draws are dependent. For large populations (N >> n), Binomial approximates Hypergeometric well — but for small populations, use Hypergeometric.

**Mistake 2: Geometric: "number of failures before first success" vs "number of trials until first success"**
- X = number of TRIALS: P(X=k) = (1-p)^{k-1}p, E[X] = 1/p.
- Y = number of FAILURES: P(Y=k) = (1-p)^k p, E[Y] = (1-p)/p.
- Y = X - 1. Both definitions exist in textbooks. Always check which convention applies.

**Mistake 3: Poisson requires constant rate**
- Poisson(λ) assumes events occur at a constant rate λ throughout the interval. If the rate varies (rush hour vs 3am), you need a non-homogeneous Poisson process.

**Mistake 4: Binomial approximation for rare events**
- Binomial(n, p) ≈ Poisson(np) when n is large and p is small (np ≈ λ is moderate). Don't apply Binomial formulas when n is huge and p is tiny — the Poisson is much simpler and equally accurate.

---

## Connections

- **Chapter 05 — Expectation:** All E[X] and Var(X) formulas here are derived using the definition E[X] = Σ x·P(X=x). Linearity of expectation gives Binomial's E[X] = np instantly.
- **Chapter 08 — Normal/CLT:** Binomial(n,p) approaches Normal(np, np(1-p)) as n→∞. Poisson(λ) approaches Normal(λ, λ) as λ→∞. All discrete distributions become Gaussian for large parameters.
- **Chapter 11 — Hypothesis Testing:** The Binomial distribution is the test statistic for proportions. "Is the click rate really 10% or is 12% statistically significant?" → Binomial test / Z-test for proportions.

---

> [← 05 Discrete Random Variables & Expectation](05_Discrete_Random_Variables_Expectation.md) | [Course Index](README.md) | [Next → 07 Continuous Random Variables & PDF](07_Continuous_Random_Variables_PDF.md)
