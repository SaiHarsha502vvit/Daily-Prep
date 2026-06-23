# Chapter 01 — Probability Axioms & Sample Spaces

> [Course Index](README.md) | [Next → 02 Counting: Permutations & Combinations](02_Counting_Permutations_Combinations.md)

---

## The Problem: How Do You Quantify "Likely"?

A coin is flipped. Before it lands, you'd say "50-50." But what does "50-50" *mean*?

One answer: relative frequency. Flip it 1,000 times — heads comes up about 500 times. The probability of heads is 1/2 because in the long run, half the outcomes are heads.

But this has a problem: you can't flip a coin to estimate the probability of an asteroid hitting Earth, or the probability your software has a bug, or the probability a specific patient has cancer. Those events aren't repeatable experiments with observable frequencies.

**The mathematician's solution (Kolmogorov, 1933):** Don't define probability as frequency. Instead, define it as a **function satisfying three axioms**. Any function satisfying those axioms is a valid probability model. Frequency happens to satisfy them, but so does subjective belief (Bayesian probability) and many other interpretations.

This axiomatic approach works for every use case — dice rolls, code correctness, medical diagnosis — because it captures the *structure* of uncertainty, not any particular interpretation of it.

---

## Sample Space and Events

**Sample space Ω (Omega):** The set of all possible outcomes of an experiment.

```
Coin flip:       Ω = {H, T}
Die roll:        Ω = {1, 2, 3, 4, 5, 6}
Two coin flips:  Ω = {HH, HT, TH, TT}
Temperature:     Ω = ℝ  (any real number, since we're measuring, not counting)
```

**Event:** A subset E ⊆ Ω. Events are sets of outcomes.

```
Die roll, event "even":     E = {2, 4, 6}
Die roll, event "at most 3": E = {1, 2, 3}
Coin flip, event "heads":   E = {H}
```

Events are sets, so all set operations apply:
- **Complement** Eᶜ = "E doesn't happen" = Ω \ E
- **Union** E ∪ F = "at least one of E, F happens"
- **Intersection** E ∩ F = "both E and F happen"
- **Mutually exclusive:** E ∩ F = ∅ (they can't both happen)

---

## The Three Kolmogorov Axioms

A **probability function** P assigns a number to every event E ⊆ Ω. It must satisfy:

**Axiom 1 (Non-negativity):** P(E) ≥ 0 for every event E.

**Axiom 2 (Normalization):** P(Ω) = 1. The probability that *something* happens is 1.

**Axiom 3 (Countable additivity):** If E₁, E₂, E₃, ... are mutually exclusive events (Eᵢ ∩ Eⱼ = ∅ for i ≠ j), then:
```
P(E₁ ∪ E₂ ∪ ...) = P(E₁) + P(E₂) + ...
```

That's it. Three axioms. Everything else in probability theory is a **theorem** derived from these three.

### Deriving Consequences from the Axioms

**Theorem: P(Eᶜ) = 1 - P(E)**

Proof:
```
E and Eᶜ are mutually exclusive (E ∩ Eᶜ = ∅).
E ∪ Eᶜ = Ω.
By Axiom 3: P(E ∪ Eᶜ) = P(E) + P(Eᶜ).
By Axiom 2: P(Ω) = 1.
Therefore: P(E) + P(Eᶜ) = 1 → P(Eᶜ) = 1 - P(E). ∎
```

**Theorem: P(∅) = 0**

Proof:
```
∅ = Ωᶜ.
P(∅) = P(Ωᶜ) = 1 - P(Ω) = 1 - 1 = 0. ∎
```

**Theorem: Monotonicity — if E ⊆ F then P(E) ≤ P(F)**

Proof:
```
F = E ∪ (F ∩ Eᶜ) and E ∩ (F ∩ Eᶜ) = ∅.
By Axiom 3: P(F) = P(E) + P(F ∩ Eᶜ).
By Axiom 1: P(F ∩ Eᶜ) ≥ 0.
Therefore: P(F) ≥ P(E). ∎
```

**Theorem: 0 ≤ P(E) ≤ 1**

Proof:
```
∅ ⊆ E ⊆ Ω for any event E.
By monotonicity: P(∅) ≤ P(E) ≤ P(Ω).
0 ≤ P(E) ≤ 1. ∎
```

---

## The Addition Rule (Inclusion-Exclusion)

**Theorem: P(E ∪ F) = P(E) + P(F) - P(E ∩ F)**

Why subtract P(E ∩ F)? Because outcomes in E ∩ F are counted twice when we add P(E) + P(F).

```
Venn diagram:
       E         F
    [  [  E∩F  ]  ]
    
P(E) counts: E-only + E∩F
P(F) counts: F-only + E∩F
P(E) + P(F) counts: E-only + 2×(E∩F) + F-only  ← overcounts E∩F

Subtract P(E∩F) to fix: E-only + E∩F + F-only = P(E ∪ F). ✓
```

**Worked Example:** A die is rolled. E = "even" = {2,4,6}. F = "at most 3" = {1,2,3}.

```
P(E) = 3/6 = 1/2
P(F) = 3/6 = 1/2
E ∩ F = {2}  → P(E ∩ F) = 1/6

P(E ∪ F) = 1/2 + 1/2 - 1/6 = 5/6

Check: E ∪ F = {1,2,3,4,6} (all except 5). That's 5 outcomes = 5/6. ✓
```

---

## Equally Likely Outcomes

For a finite sample space where all outcomes are equally likely:

```
P(E) = |E| / |Ω|

Number of outcomes in E
─────────────────────────────
Total number of outcomes
```

This is the classical "counting" model. Computing P(E) reduces to counting.

```
A standard deck: 52 cards.
P(Ace) = 4/52 = 1/13.
P(Heart) = 13/52 = 1/4.
P(Ace of Hearts) = 1/52.
P(Ace OR Heart) = (4 + 13 - 1) / 52 = 16/52 = 4/13.
```

**When equally likely applies:** Symmetric experiments (fair coins, fair dice, shuffled decks, uniform random number generators). NOT for biased coins, loaded dice, real-world events.

---

## Probability Over Continuous Spaces

When Ω = [0,1] (a continuous interval), we can't assign positive probability to every individual point — there are uncountably many, and probabilities would have to sum to more than 1.

Instead, probabilities are assigned to **intervals** (or regions in higher dimensions):

```
P([0.3, 0.7]) = 0.4    ← "uniform probability" = length of interval

Formally: P(E) = ∫_E f(x) dx  where f(x) is the "probability density function"
```

We'll see this properly in Chapter 07. For now: probabilities over continuous spaces are integrals, not sums.

---

## Section Challenge

> ### Probability Derivation
>
> A bag contains 4 red, 3 blue, and 2 green marbles (9 total). One marble is drawn at random.
>
> **Q1:** Define the sample space Ω and list the events R (red), B (blue), G (green). Verify using the axioms that P(R) + P(B) + P(G) = 1.
>
> **Q2:** Let E = "not blue" and F = "not green". Find P(E ∪ F) using the inclusion-exclusion formula. Verify by direct counting.
>
> **Q3:** Using ONLY the three axioms (no specific probabilities), prove that for any three mutually exclusive events A, B, C: P(A ∪ B ∪ C) = P(A) + P(B) + P(C).
>
> **Q4:** A system has three independent sensors. Each sensor correctly detects a hazard with probability 0.9, and fails (misses a hazard) with probability 0.1. The system triggers an alarm if ANY sensor detects the hazard. Write the sample space for the three sensors, define the event "alarm fires," and compute its probability using the complement rule.
>
> **Q5 (Stretch):** Two events A and B satisfy P(A) = 0.6, P(B) = 0.5, P(A ∩ B) = 0.2. Are A and B mutually exclusive? Are they exhaustive (A ∪ B = Ω)? Find P(Aᶜ ∩ Bᶜ).

<details>
<summary>Full answers</summary>

```
Q1: Sample space and probabilities

Ω = {r₁, r₂, r₃, r₄, b₁, b₂, b₃, g₁, g₂}  (9 equally likely outcomes)

Alternatively (since marbles of same color are identical): treat as labeled.

Events:
  R = {r₁, r₂, r₃, r₄}  → P(R) = 4/9
  B = {b₁, b₂, b₃}      → P(B) = 3/9 = 1/3
  G = {g₁, g₂}          → P(G) = 2/9

Axiom check:
  R, B, G are mutually exclusive (disjoint color classes).
  R ∪ B ∪ G = Ω.
  By Axiom 3: P(R ∪ B ∪ G) = P(R) + P(B) + P(G) = 4/9 + 3/9 + 2/9 = 9/9 = 1. ✓
  Consistent with Axiom 2: P(Ω) = 1. ✓

──────────────────────────────────────────────────────

Q2: P(E ∪ F) via inclusion-exclusion

E = "not blue" = Rᶜ ∩ Bᶜ... wait, let me restate.
E = "not blue" = R ∪ G  → P(E) = P(R) + P(G) = 4/9 + 2/9 = 6/9
F = "not green" = R ∪ B → P(F) = P(R) + P(B) = 4/9 + 3/9 = 7/9

E ∩ F = (R ∪ G) ∩ (R ∪ B) = R ∪ (G ∩ B) = R ∪ ∅ = R
P(E ∩ F) = P(R) = 4/9

Inclusion-exclusion:
P(E ∪ F) = P(E) + P(F) - P(E ∩ F) = 6/9 + 7/9 - 4/9 = 9/9 = 1

Direct count:
E ∪ F = "not blue OR not green" = "at least one of: not blue, not green"
     = "not (blue AND green)" = Ω \ (B ∩ G) = Ω \ ∅ = Ω
Every marble is either not-blue or not-green (no marble is both blue and green).
P(E ∪ F) = P(Ω) = 1. ✓

──────────────────────────────────────────────────────

Q3: Axiom-only proof for 3 mutually exclusive events

Given: A, B, C mutually exclusive (A∩B = A∩C = B∩C = ∅).

Step 1: A ∩ (B ∪ C) = (A∩B) ∪ (A∩C) = ∅ ∪ ∅ = ∅
  So A and (B ∪ C) are mutually exclusive.

Step 2: By Axiom 3 (two events):
  P(A ∪ (B ∪ C)) = P(A) + P(B ∪ C)

Step 3: B and C are mutually exclusive (B∩C = ∅).
  By Axiom 3: P(B ∪ C) = P(B) + P(C)

Step 4: A ∪ (B ∪ C) = A ∪ B ∪ C (set union is associative).

Combining: P(A ∪ B ∪ C) = P(A) + P(B) + P(C). ∎

Note: Axiom 3 states this for COUNTABLY INFINITE sequences.
For finite collections, we apply it repeatedly (2 events at a time).

──────────────────────────────────────────────────────

Q4: Three sensors, alarm = any sensor detects

Ω: {(d₁, d₂, d₃) where dᵢ ∈ {detect, miss}}
|Ω| = 2³ = 8 outcomes.

With probabilities: let D = detect (p=0.9), M = miss (p=0.1).

Event "alarm fires" = A = "at least one sensor detects".
Complement A = "no sensor detects" = all three miss.

P(Aᶜ) = P(miss, miss, miss) 

Since sensors are independent:
P(Aᶜ) = P(miss₁) × P(miss₂) × P(miss₃) = 0.1 × 0.1 × 0.1 = 0.001

P(A) = 1 - P(Aᶜ) = 1 - 0.001 = 0.999

The three-sensor system has 99.9% detection probability vs 90% for a single sensor.
Redundant systems dramatically improve reliability using the complement rule.

──────────────────────────────────────────────────────

Q5: P(A) = 0.6, P(B) = 0.5, P(A∩B) = 0.2

Mutually exclusive? If so, P(A∩B) = 0.
But P(A∩B) = 0.2 ≠ 0.
→ A and B are NOT mutually exclusive. They can both occur.

Exhaustive (A∪B = Ω, i.e. P(A∪B) = 1)?
P(A∪B) = P(A) + P(B) - P(A∩B) = 0.6 + 0.5 - 0.2 = 0.9 ≠ 1.
→ A and B are NOT exhaustive. P((A∪B)ᶜ) = 0.1.

P(Aᶜ ∩ Bᶜ):
By De Morgan's law: Aᶜ ∩ Bᶜ = (A∪B)ᶜ
P(Aᶜ ∩ Bᶜ) = P((A∪B)ᶜ) = 1 - P(A∪B) = 1 - 0.9 = 0.1.

Interpretation: The probability that NEITHER A nor B occurs is 0.1.
This is the "gap" that prevents A∪B from covering all of Ω.
```

</details>

---

## Common Mistakes

**Mistake 1: Treating P as a property of the outcome, not the experiment**
- P(heads) = 1/2 is not a fact about the physical coin — it's a fact about the *model* (fair coin, symmetric flip). A bent coin might have P(heads) = 0.7. The probability function is a human choice of model.

**Mistake 2: Forgetting P(E ∪ F) ≠ P(E) + P(F) when E and F overlap**
- This is the most common beginner error. ALWAYS check if the events are mutually exclusive before adding. If they overlap, subtract the intersection.

**Mistake 3: P(Eᶜ) and P(not E in a sequence) confusion**
- P(Eᶜ) = 1 - P(E) is about one trial.
- "P(no E in 10 trials)" is a different calculation: (1 - P(E))¹⁰ (see Chapter 03 for independence).

**Mistake 4: "Impossible" doesn't mean probability 0; "Certain" doesn't mean probability 1 in continuous spaces**
- In continuous probability, a specific point value (like X = π exactly) has probability 0, but is not "impossible" — it can happen. Probability 0 ≠ impossible in continuous models.

---

## Connections

- **Chapter 02 — Counting:** Computing P(E) = |E|/|Ω| requires counting |E| and |Ω|. Combinatorics is the toolkit for this.
- **Chapter 03 — Conditional Probability:** P(A|B) = P(A∩B) / P(B). The intersection operation from this chapter is central.
- **CSE101 Ch05 — Sets:** Sample spaces and events ARE sets. All set theorems apply directly.

---

> [Course Index](README.md) | [Next → 02 Counting: Permutations & Combinations](02_Counting_Permutations_Combinations.md)
