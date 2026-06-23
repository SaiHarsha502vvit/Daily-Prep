# Chapter 04 — Bayes' Theorem & the Law of Total Probability

> [← 03 Conditional Probability & Independence](03_Conditional_Probability_Independence.md) | [Course Index](README.md) | [Next → 05 Discrete Random Variables & Expectation](05_Discrete_Random_Variables_Expectation.md)

---

## The Problem: Inverting Causality

A medical test for a disease returns "positive." You want to know: what is the probability you actually have the disease?

The test manufacturer gives you P(positive | disease) = 0.99 (sensitivity). But you need P(disease | positive) — the probability of disease given a positive test. These are NOT the same.

Bayes' theorem is the formula for swapping the direction of conditioning: from P(A|B) to P(B|A). It's the mathematical engine of reasoning under uncertainty and the foundation of an entire branch of statistics (Bayesian statistics).

---

## The Law of Total Probability

Before Bayes, we need the **Law of Total Probability (LOTP)**.

A collection of events B₁, B₂, ..., Bₙ is a **partition** of Ω if:
- They are mutually exclusive: Bᵢ ∩ Bⱼ = ∅ for i ≠ j
- They are exhaustive: B₁ ∪ B₂ ∪ ... ∪ Bₙ = Ω

**LOTP:** For any event A and partition {B₁, ..., Bₙ}:
```
P(A) = P(A|B₁)P(B₁) + P(A|B₂)P(B₂) + ... + P(A|Bₙ)P(Bₙ)
     = Σᵢ P(A|Bᵢ)P(Bᵢ)
```

**Why:** A = (A∩B₁) ∪ (A∩B₂) ∪ ... ∪ (A∩Bₙ). These are disjoint (since Bᵢ are disjoint). By Axiom 3:
```
P(A) = Σᵢ P(A∩Bᵢ) = Σᵢ P(A|Bᵢ)P(Bᵢ)    [using P(A∩B) = P(A|B)P(B)]
```

**Analogy:** You want P(rain today). You split by weather system type:
```
P(rain) = P(rain | front) P(front) + P(rain | no front) P(no front)
```
You know the conditional rain probabilities and the prior probability of a front → you can compute the overall probability.

### Worked Example: Widget Factory (from Ch03)

P(defective) = ?
- Machine A: 50% of widgets, 2% defect rate
- Machine B: 30% of widgets, 4% defect rate
- Machine C: 20% of widgets, 5% defect rate

{A, B, C} is a partition. By LOTP:
```
P(D) = P(D|A)P(A) + P(D|B)P(B) + P(D|C)P(C)
     = 0.02 × 0.50 + 0.04 × 0.30 + 0.05 × 0.20
     = 0.010 + 0.012 + 0.010
     = 0.032
```

---

## Bayes' Theorem

Starting from conditional probability:
```
P(Bᵢ | A) = P(A ∩ Bᵢ) / P(A) = P(A | Bᵢ) P(Bᵢ) / P(A)
```

Substituting LOTP for P(A):
```
P(Bᵢ | A) = P(A | Bᵢ) P(Bᵢ) / [Σⱼ P(A | Bⱼ) P(Bⱼ)]
```

For two hypotheses (B and Bᶜ):
```
P(B | A) = P(A | B) P(B) / [P(A|B)P(B) + P(A|Bᶜ)P(Bᶜ)]
```

**Names:**
- P(Bᵢ): **prior** probability of Bᵢ (before observing A)
- P(A|Bᵢ): **likelihood** of observing A if Bᵢ is true
- P(Bᵢ|A): **posterior** probability of Bᵢ (after observing A)
- P(A): **normalizing constant** (makes posteriors sum to 1)

**Bayesian update:** Bayes' theorem is the formula for updating your belief (prior) in light of new evidence (likelihood) to get a revised belief (posterior).

---

## The Medical Test Example: Why Base Rate Matters

Disease prevalence: P(disease) = 0.001 (1 in 1000 people has it).
Test sensitivity: P(positive | disease) = 0.99 (99% true positive rate).
Test specificity: P(negative | no disease) = 0.95 → P(positive | no disease) = 0.05.

**Question:** You test positive. What is P(disease | positive)?

Most people guess ~99%. The actual answer shocks them.

```
Let D = "has disease", P = "tests positive".

P(P | D) = 0.99          (sensitivity)
P(P | Dᶜ) = 0.05         (1 - specificity = false positive rate)
P(D) = 0.001             (base rate / prevalence)
P(Dᶜ) = 0.999

By Bayes:
P(D | P) = P(P|D)P(D) / [P(P|D)P(D) + P(P|Dᶜ)P(Dᶜ)]
         = (0.99 × 0.001) / [(0.99 × 0.001) + (0.05 × 0.999)]
         = 0.00099 / [0.00099 + 0.04995]
         = 0.00099 / 0.05094
         ≈ 0.0194
```

**P(disease | positive) ≈ 2%!**

Despite a 99% sensitive test, a positive result only means 2% chance of disease. Why?

```
Visualize with 100,000 people:
  100 have disease (0.001 × 100,000)
  99,900 don't have disease

  Of 100 with disease:    99 test positive (0.99 × 100)
  Of 99,900 without disease: 4,995 test positive (0.05 × 99,900)

  Total positives: 99 + 4,995 = 5,094
  True positives among all positives: 99 / 5,094 ≈ 1.9%
```

The 4,995 false positives vastly outnumber the 99 true positives because the disease is rare. **Base rate (prevalence) dominates when it's extreme.**

**Base rate neglect:** Humans instinctively focus on P(positive | disease) = 99% and ignore the base rate P(disease) = 0.1%. This leads to catastrophic overestimation of disease probability — the medical profession discovered this failure repeatedly in mass screening programs.

---

## Bayesian Updating: Sequential Evidence

Bayes can be applied iteratively. The posterior from one observation becomes the prior for the next.

**Example:** Email spam filter.

Prior: P(spam) = 0.3 (30% of emails are spam based on historical data).

Email contains the word "FREE":
- P(FREE | spam) = 0.8 (80% of spam emails contain "FREE")
- P(FREE | ham) = 0.1 (10% of legitimate emails contain "FREE")

Update:
```
P(spam | FREE) = P(FREE|spam)P(spam) / [P(FREE|spam)P(spam) + P(FREE|ham)P(ham)]
              = 0.8 × 0.3 / [0.8 × 0.3 + 0.1 × 0.7]
              = 0.24 / [0.24 + 0.07]
              = 0.24 / 0.31
              ≈ 0.774
```

Now P(spam) = 0.774 (updated belief after seeing "FREE").

Email ALSO contains "OFFER":
- P(OFFER | spam) = 0.7, P(OFFER | ham) = 0.05

Use P(spam) = 0.774 as new prior:
```
P(spam | FREE, OFFER) = 0.7 × 0.774 / [0.7 × 0.774 + 0.05 × 0.226]
                      = 0.5418 / [0.5418 + 0.0113]
                      = 0.5418 / 0.5531
                      ≈ 0.980
```

After two features, P(spam) ≈ 98%. This is exactly how Naive Bayes spam filters work.

**"Naive":** The Naive Bayes classifier assumes features are conditionally independent given the class — a simplification that rarely holds exactly, but works surprisingly well in practice.

---

## The Monty Hall Problem

Three doors: behind one is a car, the other two have goats. You pick door 1. The host (who knows what's behind each door) opens door 3 — it has a goat. Should you switch to door 2?

Most people say "50-50, doesn't matter." Bayes says: **always switch**.

```
Let Cᵢ = "car is behind door i".
Prior: P(C₁) = P(C₂) = P(C₃) = 1/3.

Observe: host opens door 3.
Let H₃ = "host opens door 3".

P(H₃ | C₁) = 1/2   (car behind 1 → host can open 2 or 3 equally)
P(H₃ | C₂) = 1      (car behind 2 → host MUST open 3, only goat option)
P(H₃ | C₃) = 0      (host can't open door 3 if car is there)

By LOTP:
P(H₃) = P(H₃|C₁)P(C₁) + P(H₃|C₂)P(C₂) + P(H₃|C₃)P(C₃)
       = (1/2)(1/3) + (1)(1/3) + (0)(1/3)
       = 1/6 + 1/3 + 0 = 1/2

By Bayes:
P(C₁ | H₃) = P(H₃|C₁)P(C₁) / P(H₃) = (1/6) / (1/2) = 1/3
P(C₂ | H₃) = P(H₃|C₂)P(C₂) / P(H₃) = (1/3) / (1/2) = 2/3

P(car behind door 2 | host opened door 3) = 2/3.
```

**Always switch!** Door 1 stays at 1/3. Door 2 absorbs the probability that was door 3. By switching, you win 2/3 of the time. The host's action transfers information — that's the key.

---

## Section Challenge

> ### Bayesian Reasoning
>
> A cybersecurity system detects intrusions. The false positive rate is 1% (P(alert | no intrusion) = 0.01) and the detection rate is 95% (P(alert | intrusion) = 0.95). Based on network traffic analysis, the prior probability of intrusion at any given time is P(intrusion) = 0.005.
>
> **Q1:** An alert fires. What is P(intrusion | alert)?
>
> **Q2:** The security team investigates and finds one additional signal: the connection attempted to access `/etc/shadow` (a sensitive file). Historical data says:
> - P(shadow access | intrusion) = 0.7
> - P(shadow access | no intrusion) = 0.02
>
> Update P(intrusion) using your answer from Q1 as the new prior. What is the updated posterior?
>
> **Q3:** A third independent signal: traffic volume spiked. P(spike | intrusion) = 0.8, P(spike | no intrusion) = 0.1. Apply another Bayes update from Q2's posterior.
>
> **Q4:** At what prior P(intrusion) would a single alert raise P(intrusion | alert) to 50%? Solve algebraically.
>
> **Q5 (Stretch):** The Naive Bayes classifier treats the three signals (alert, shadow access, traffic spike) as conditionally independent given intrusion status. Write the formula for P(intrusion | alert, shadow, spike) under the Naive Bayes assumption, and compute it using the original prior P(intrusion) = 0.005. Is this different from the sequential update in Q1-Q3? Why or why not?

<details>
<summary>Full answers</summary>

```
Q1: P(intrusion | alert)

Let I = "intrusion", A = "alert fires".
P(I) = 0.005, P(Iᶜ) = 0.995
P(A|I) = 0.95, P(A|Iᶜ) = 0.01

P(A) = P(A|I)P(I) + P(A|Iᶜ)P(Iᶜ)
     = 0.95 × 0.005 + 0.01 × 0.995
     = 0.00475 + 0.00995
     = 0.01470

P(I|A) = P(A|I)P(I) / P(A) = 0.00475 / 0.01470 ≈ 0.323

An alert raises intrusion probability from 0.5% to ~32%. Still a 68% chance
of false alarm — this is why single-signal security alerts have low reliability.

──────────────────────────────────────────────────────

Q2: Update with shadow access

New prior: P(I) = 0.323 (from Q1 posterior).
S = "shadow file accessed". P(S|I) = 0.7, P(S|Iᶜ) = 0.02.

P(S) = 0.7 × 0.323 + 0.02 × 0.677 = 0.2261 + 0.01354 = 0.23964

P(I|A,S) = P(S|I) × 0.323 / 0.23964
         = 0.2261 / 0.23964
         ≈ 0.943

After seeing shadow file access, P(intrusion) jumps from 32% to 94%.

──────────────────────────────────────────────────────

Q3: Update with traffic spike

New prior: P(I) = 0.943.
T = "traffic spike". P(T|I) = 0.8, P(T|Iᶜ) = 0.1.

P(T) = 0.8 × 0.943 + 0.1 × 0.057 = 0.7544 + 0.0057 = 0.7601

P(I|A,S,T) = P(T|I) × 0.943 / 0.7601
           = 0.7544 / 0.7601
           ≈ 0.9925

After three signals: 99.25% confidence in intrusion.

──────────────────────────────────────────────────────

Q4: Prior P(I) for single alert to give P(I|A) = 0.5

P(I|A) = P(A|I)P(I) / [P(A|I)P(I) + P(A|Iᶜ)(1-P(I))] = 0.5

0.5 × [P(A|I)P(I) + P(A|Iᶜ)(1-P(I))] = P(A|I)P(I)

0.5 × P(A|Iᶜ)(1-P(I)) = 0.5 × P(A|I)P(I)

P(A|Iᶜ)(1-p) = P(A|I)p      [where p = P(I)]

0.01 × (1-p) = 0.95 × p
0.01 - 0.01p = 0.95p
0.01 = 0.96p
p = 0.01 / 0.96 ≈ 0.01042

So if the prior probability of intrusion is ~1.04%, a single alert makes it 50-50.
(Our actual prior is 0.5% — half of that threshold — which is why a single alert
gives only 32%, not 50%.)

──────────────────────────────────────────────────────

Q5: Naive Bayes — simultaneous vs sequential update

Under Naive Bayes: signals A, S, T are conditionally independent given I.

P(I | A, S, T) = P(A,S,T|I)P(I) / P(A,S,T)

Numerator:
  P(A,S,T|I) × P(I) = P(A|I)P(S|I)P(T|I) × P(I)
                     = 0.95 × 0.7 × 0.8 × 0.005
                     = 0.532 × 0.005 = 0.00266

  P(A,S,T|Iᶜ) × P(Iᶜ) = P(A|Iᶜ)P(S|Iᶜ)P(T|Iᶜ) × P(Iᶜ)
                       = 0.01 × 0.02 × 0.1 × 0.995
                       = 0.00002 × 0.995 = 0.0000199

Denominator: 0.00266 + 0.0000199 = 0.0026799

P(I|A,S,T) = 0.00266 / 0.0026799 ≈ 0.9926

This matches the sequential update result of ~99.25% (small rounding differences).

WHY THE SAME? Because sequential Bayesian updating with conditionally independent
features is mathematically identical to computing the full Naive Bayes posterior
in one step.

Proof sketch: 
  Sequential: prior → update with A → update with S → update with T
  Each step: P(I | evidence so far) ∝ P(new evidence | I) × P(I | previous evidence)
  
  After all three: P(I | A,S,T) ∝ P(T|I) × P(S|I) × P(A|I) × P(I)
  (Conditional independence allows factoring at each step)
  = Naive Bayes formula. ∎

Sequential updating is computationally convenient (update incrementally as
new evidence arrives) but gives the same final answer as batch Naive Bayes.
```

</details>

---

## Common Mistakes

**Mistake 1: The Prosecutor's Fallacy — P(evidence | innocent) ≈ 0 does not mean P(innocent | evidence) ≈ 0**
- A DNA match has P(match | innocent) = 1/10,000,000. A prosecutor argues this means the defendant is almost certainly guilty. But P(innocent | match) depends critically on the prior P(innocent) — if the defendant was picked from a database of 10 million people, the expected number of innocent matches is 1. The match is not strong evidence at all.

**Mistake 2: Forgetting the base rate**
- The medical test example is the canonical case. P(positive | disease) = 0.99 is NOT P(disease | positive). Always multiply by the prior.

**Mistake 3: Updating with dependent evidence and treating it as independent**
- If two signals are correlated (e.g., shadow file access and traffic spike both happen because of the same underlying behavior), treating them as independent in Naive Bayes double-counts the evidence. Real spam filters and intrusion detectors account for feature correlations with more sophisticated models.

**Mistake 4: The Monty Hall trap — "the host's action is random"**
- The host's action is NOT random. The host knows where the car is and always opens a goat door. This informed action transfers information. If the host picked a random door that happened to be a goat, the analysis would be different (50-50 in that case).

---

## Connections

- **Chapter 03 — Conditional Probability:** Bayes = P(A|B) = P(B|A)P(A)/P(B). It's just conditional probability applied twice.
- **Chapter 06 — Distributions:** Bayesian inference uses Bayes' theorem with probability distributions (not just events) to update distribution parameters. "Conjugate priors" make the math tractable.
- **Chapter 11 — Hypothesis Testing:** Frequentist statistics (null hypothesis testing) and Bayesian statistics (Bayes factors) are two competing frameworks built on the same probability theory. Both use conditional probability; they differ in how they treat the prior.

---

> [← 03 Conditional Probability & Independence](03_Conditional_Probability_Independence.md) | [Course Index](README.md) | [Next → 05 Discrete Random Variables & Expectation](05_Discrete_Random_Variables_Expectation.md)
