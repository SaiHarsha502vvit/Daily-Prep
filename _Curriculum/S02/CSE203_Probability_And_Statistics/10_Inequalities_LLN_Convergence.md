# Chapter 10 — Inequalities, LLN & Convergence

> [← 09 Joint Distributions, Covariance & Correlation](09_Joint_Distributions_Covariance.md) | [Course Index](README.md) | [Next → 11 Hypothesis Testing & p-values](11_Hypothesis_Testing_P_Values.md)

---

## The Problem: Making Guarantees Without Full Knowledge

You don't know the distribution of a random variable X — you only know its mean μ and variance σ². Can you still bound probabilities like P(X > 100)?

Probability inequalities answer this. They give guaranteed bounds using minimal information. This is the foundation of algorithm analysis (expected-case guarantees), machine learning theory (generalization bounds), and system reliability engineering.

---

## Markov's Inequality

**Theorem:** For a non-negative random variable X and any a > 0:

```
P(X ≥ a) ≤ E[X] / a
```

**Proof:**
```
E[X] = ∫₀^∞ x f(x) dx
     ≥ ∫_a^∞ x f(x) dx    (dropping the [0,a) portion)
     ≥ ∫_a^∞ a f(x) dx    (since x ≥ a on this region)
     = a · P(X ≥ a)

Dividing: P(X ≥ a) ≤ E[X] / a. ∎
```

**Example:** Average weekly server downtime is 2 hours. What is the maximum probability of a week with 10+ hours of downtime?

```
P(X ≥ 10) ≤ E[X] / 10 = 2/10 = 0.2

At most 20% of weeks can have 10+ hours of downtime. No distribution assumption needed.
```

**Tightness:** This bound is WEAK — it's tight only for a degenerate distribution (X = a with prob E[X]/a, X = 0 otherwise). For well-behaved distributions, the actual probability is much smaller. Markov gives a worst-case guarantee.

---

## Chebyshev's Inequality

**Theorem:** For any random variable X with mean μ and variance σ²:

```
P(|X - μ| ≥ k) ≤ σ² / k²     for any k > 0

Equivalently: P(|X - μ| ≥ kσ) ≤ 1/k²
```

**Proof:**
```
Let Y = (X - μ)² ≥ 0. Then E[Y] = Var(X) = σ².
Apply Markov with a = k²:

P((X-μ)² ≥ k²) ≤ E[(X-μ)²] / k² = σ²/k²

P(|X - μ| ≥ k) = P((X-μ)² ≥ k²) ≤ σ²/k². ∎
```

**Example:** Average request latency is 100ms, standard deviation is 20ms. Bound P(|latency - 100| ≥ 50ms):

```
k = 50, σ = 20, σ² = 400.
P(|X - 100| ≥ 50) ≤ 400 / 50² = 400/2500 = 0.16.

At most 16% of requests deviate from 100ms by 50ms or more. No distribution needed.
```

**Compared to Normal:** If latency were Normal(100, 20²), P(|X-100| ≥ 50) = P(|Z| ≥ 2.5) ≈ 0.012 — far below the 16% Chebyshev bound. Chebyshev is conservative but universal.

**Application in machine learning:** With n training examples and a Bernoulli(p) loss, the sample mean loss X̄ has variance p(1-p)/n ≤ 1/(4n). By Chebyshev:

```
P(|X̄ - p| ≥ ε) ≤ 1/(4nε²)

For ε = 0.01 and 95% confidence: 1/(4n × 0.0001) ≤ 0.05
→ n ≥ 1/(4 × 0.0001 × 0.05) = 50,000 samples.
```

CLT gives tighter bounds (≈9,604 samples), but Chebyshev works for any distribution.

---

## The Law of Large Numbers

**Weak Law of Large Numbers (WLLN):** Let X₁, X₂, ..., Xₙ be i.i.d. with mean μ. The sample mean X̄ₙ = (X₁ + ... + Xₙ)/n satisfies:

```
P(|X̄ₙ - μ| ≥ ε) → 0   as n → ∞    for any ε > 0
```

X̄ₙ converges in probability to μ.

**Proof via Chebyshev (requires finite σ²):**
```
Var(X̄ₙ) = σ²/n.

By Chebyshev:
P(|X̄ₙ - μ| ≥ ε) ≤ Var(X̄ₙ) / ε² = σ²/(nε²) → 0 as n → ∞. ✓
```

**Strong Law of Large Numbers (SLLN):** P(X̄ₙ → μ as n → ∞) = 1. (The convergence holds with probability 1, not just in probability. Harder to prove.)

**What LLN says:** As you collect more data, the sample average converges to the true mean. This justifies:
- Estimating P(heads) by flipping a coin many times
- Estimating average processing time by running many requests
- Training machine learning models on large datasets (population risk ≈ empirical risk)

**What LLN does NOT say:**
- It doesn't say each X̄ₙ IS μ — there's still randomness.
- It doesn't say "after a long streak of tails, heads are more likely" (gambler's fallacy).
- It doesn't say anything about the rate of convergence (that's CLT).

---

## Types of Convergence

There is a hierarchy of convergence for sequences of random variables:

**Convergence in distribution (→_d):** P(Xₙ ≤ x) → P(X ≤ x) for all x.
- CLT: (X̄ₙ - μ)/(σ/√n) →_d Normal(0,1).
- Weakest form — Xₙ and X can be defined on different probability spaces.

**Convergence in probability (→_p):** P(|Xₙ - X| ≥ ε) → 0 for all ε > 0.
- WLLN: X̄ₙ →_p μ.
- Stronger than convergence in distribution.

**Almost sure convergence (→_a.s.):** P(lim Xₙ = X) = 1.
- SLLN: X̄ₙ →_a.s. μ.
- Strongest practical form.

**Convergence in Lᵖ (→_Lp):** E[|Xₙ - X|ᵖ] → 0.
- Commonly L² (mean square convergence): E[(Xₙ - X)²] → 0.

```
Hierarchy: a.s. → Lᵖ → probability → distribution (each implies the ones after)
```

---

## The Chernoff Bound

**More powerful than Chebyshev** for sums of independent bounded variables:

For X = X₁ + ... + Xₙ with Xᵢ ∈ [0,1] i.i.d., μ = E[X]:

```
P(X ≥ (1+δ)μ) ≤ (eᵟ/(1+δ)^{1+δ})^μ

Simplified upper bound:
P(X ≥ (1+δ)μ) ≤ e^{-μδ²/3}     for 0 < δ ≤ 1
P(X ≤ (1-δ)μ) ≤ e^{-μδ²/2}     for 0 < δ ≤ 1
```

**Why exponential decay?** Sums of bounded independent variables have exponentially decaying tails (sub-Gaussian behavior). This is much tighter than Chebyshev's 1/k² decay.

**Example:** You run 1000 coin flips. μ = 500 heads expected. What is P(≥ 600 heads)?

```
δ = (600-500)/500 = 0.2  (20% above mean)
P(X ≥ 600) ≤ e^{-500 × 0.04/3} = e^{-6.67} ≈ 0.00127

Less than 0.13% chance. Chebyshev gives: σ² = 250, P ≤ 250/10000 = 2.5% (much weaker).
```

Chernoff bounds are used throughout algorithm analysis (randomized algorithms, hashing) and machine learning (generalization bounds via VC theory).

---

## Section Challenge

> ### Inequalities in Algorithm Analysis
>
> A randomized algorithm runs with expected time μ = 100ms and Var(T) = 400ms² (σ = 20ms).
>
> **Q1:** Using Markov's inequality, bound P(T ≥ 400ms). Using Chebyshev, bound P(T ≥ 200ms). Which gives a tighter bound for P(T ≥ 200)?
>
> **Q2:** If T is actually Normal(100, 400), what is P(T ≥ 200) exactly? Compare to both bounds.
>
> **Q3:** You run the algorithm 10,000 times and average the results. By WLLN, what does T̄ converge to? By CLT, what is the distribution of T̄? Bound P(|T̄ - 100| ≥ 1ms) using both Chebyshev and CLT.
>
> **Q4:** A hash table uses 1000 independent hash functions. Each maps a key to one of 10,000 buckets uniformly. The expected number of collisions for a given key is μ_c. Use Markov's inequality to bound P(more than 0.1% of hash functions cause a collision for a given key).
>
> **Q5 (Stretch):** A load balancer routes n = 10,000 requests uniformly at random to k = 100 servers. Let X = number of requests going to the busiest server. The expected load per server is μ = n/k = 100. Using Chernoff bounds, bound the probability that any given server receives more than 130 requests. Then use a union bound to bound P(at least one server receives more than 130 requests).

<details>
<summary>Full answers</summary>

```
Q1: Markov and Chebyshev bounds

Markov: P(T ≥ 400) ≤ E[T]/400 = 100/400 = 0.25
  At most 25% chance of taking 400ms or more.

Chebyshev for P(T ≥ 200):
  T ≥ 200 means T - 100 ≥ 100, i.e., T deviates ≥ 100 from mean.
  P(|T - 100| ≥ 100) ≤ Var(T)/100² = 400/10,000 = 0.04
  This bounds P(T ≤ 0 OR T ≥ 200).
  Since T ≥ 0 (time is non-negative), P(T ≤ 0) ≈ 0.
  So P(T ≥ 200) ≤ 0.04.

Markov for P(T ≥ 200): P(T ≥ 200) ≤ 100/200 = 0.5.

Chebyshev (0.04) is tighter than Markov (0.5) for P(T ≥ 200).
Reason: Chebyshev uses variance (second moment information);
Markov uses only the mean (first moment).

──────────────────────────────────────────────────────

Q2: Exact Normal probability

T ~ Normal(100, 400), σ = 20.
P(T ≥ 200) = P(Z ≥ (200-100)/20) = P(Z ≥ 5) ≈ 2.87 × 10⁻⁷

The actual probability is astronomically small:
  Markov bound: 0.5 (5 million times larger)
  Chebyshev bound: 0.04 (140,000 times larger)
  
The bounds are extremely conservative for the Normal distribution.
They're useful BECAUSE they work without knowing the distribution —
but pay a large price in tightness.

──────────────────────────────────────────────────────

Q3: T̄ from 10,000 runs

WLLN: T̄ converges in probability to μ = 100ms.
As n → ∞, P(|T̄ - 100| ≥ ε) → 0 for any ε > 0.

By CLT: T̄ ~ approximately Normal(100, 400/10000) = Normal(100, 0.04)
σ_{T̄} = √0.04 = 0.2ms.

P(|T̄ - 100| ≥ 1ms):

Chebyshev: P ≤ Var(T̄)/1² = 0.04/1 = 0.04

CLT: P = P(|Z| ≥ 1/0.2) = P(|Z| ≥ 5) ≈ 5.7 × 10⁻⁷

The CLT gives an exponentially tighter bound than Chebyshev because
we know the distribution is approximately Normal.

──────────────────────────────────────────────────────

Q4: Hash collision bound

Each hash function maps to one of 10,000 buckets.
For a fixed key k and hash function h: P(collision with any fixed other key) = 1/10,000 for a given bucket.

More precisely: If there are m other keys, for each hash function, 
P(h maps our key to same bucket as some other key) ≤ m/10,000.

Let's interpret: 1000 hash functions, each with collision probability p per function.
μ_c = E[collisions] = 1000 × p.

P(more than 0.1% collide) = P(X > 0.001 × 1000) = P(X > 1) where X = # colliding functions.

By Markov: P(X ≥ 1) ≤ E[X]/1 = μ_c.

So P(more than 0 collisions) ≤ μ_c.
For 0.1%: P(X ≥ 1) ≤ μ_c.

The specific bound depends on the actual collision probability p per function.
For a key in a table with n = 1000 other keys:
  p ≈ n/10,000 = 0.1 per hash function.
  μ_c = 1000 × 0.1 = 100 expected collisions.
  P(X ≥ 1) ≤ μ_c = 100 — but this exceeds 1! Markov is useless when μ_c > 1.
  Need a more refined analysis or different setup.

──────────────────────────────────────────────────────

Q5: Load balancer, Chernoff + union bound

Requests: n = 10,000, servers: k = 100.
Each request goes to a uniform random server. μ = 100 requests per server.

For one specific server:
δ = (130 - 100)/100 = 0.3  (30% above expected)
μ = 100

Chernoff upper tail bound (δ = 0.3 ≤ 1):
P(one server gets ≥ 130) ≤ e^{-μδ²/3} = e^{-100 × 0.09/3} = e^{-3} ≈ 0.0498

About 5% chance any specific server gets overloaded.

Union bound: P(at least one of k = 100 servers gets ≥ 130):

  P(A₁ ∪ A₂ ∪ ... ∪ A₁₀₀) ≤ Σᵢ P(Aᵢ) = 100 × e^{-3} ≈ 100 × 0.0498 = 4.98

Wait — this exceeds 1, so the union bound is trivial here.

For a tighter bound, use δ = 0.5:
P(one server ≥ 150) ≤ e^{-100 × 0.25/3} = e^{-8.33} ≈ 0.000241

Union bound: P(any server ≥ 150) ≤ 100 × 0.000241 = 0.0241 < 2.4%.

Maximum load result: The busiest server handles at most ~150 requests 
with probability ≥ 97.6%. This is the "balls into bins" result commonly
used in load balancing analysis.

Tighter analysis (balls-into-bins classical result):
E[max load] = O(log n / log log n) × μ  for n = k.
For n = k = 100: max load ≈ 2 × μ = 200 with high probability.
```

</details>

---

## Common Mistakes

**Mistake 1: Gambler's Fallacy — misunderstanding LLN**
- LLN says the AVERAGE converges to μ. It does NOT say individual outcomes "catch up." After 100 tails in a row, P(heads on next flip) = 1/2, NOT more. Past results don't affect future independent flips.

**Mistake 2: "Large enough sample" without specifying how large**
- "By LLN, our estimate is accurate" is incomplete. How accurate? For what ε and probability? Use CLT or Chebyshev to quantify: "Within ε of μ with probability 1-δ requires n ≥ σ²/(δε²) samples (by Chebyshev)."

**Mistake 3: Chebyshev applies to P(X - μ), not P(X)**
- P(|X - μ| ≥ k) ≤ σ²/k². To bound P(X ≥ a), first rewrite: P(X ≥ a) = P(X - μ ≥ a - μ) ≤ P(|X-μ| ≥ a-μ) ≤ σ²/(a-μ)² (only when a > μ).

**Mistake 4: Union bound for non-independent events**
- P(A₁ ∪ ... ∪ Aₙ) ≤ ΣP(Aᵢ) (union bound / Boole's inequality). This is ALWAYS valid regardless of dependence — but it can be very loose. If Aᵢ are all the same event: P(A) ≤ n×P(A), which is useless for n > 1.

---

## Connections

- **Chapter 08 — CLT:** CLT gives the rate of convergence in LLN. LLN says X̄ → μ; CLT says the standardized error (X̄-μ)/(σ/√n) → Normal(0,1), quantifying HOW FAST convergence happens.
- **Chapter 11 — Hypothesis Testing:** Chebyshev and CLT underlie the derivation of p-values and critical values. The null distribution is often derived from CLT.
- **Chapter 05 — Expectation:** E[X] appears in Markov; Var(X) appears in Chebyshev. These inequalities transform moment information into probability bounds.

---

> [← 09 Joint Distributions, Covariance & Correlation](09_Joint_Distributions_Covariance.md) | [Course Index](README.md) | [Next → 11 Hypothesis Testing & p-values](11_Hypothesis_Testing_P_Values.md)
