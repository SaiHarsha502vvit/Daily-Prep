# Chapter 03 — Conditional Probability & Independence

> [← 02 Counting](02_Counting_Permutations_Combinations.md) | [Course Index](README.md) | [Next → 04 Bayes' Theorem](04_Bayes_Theorem_Total_Probability.md)

---

## The Problem: New Information Changes Probabilities

You roll a die. Before seeing it, P(six) = 1/6.

Now someone peeks and tells you "it's even." Does P(six) change?

Of course — now you know it's in {2, 4, 6}, and among those three equally likely outcomes, exactly one is six. So P(six | even) = 1/3. New information shrinks the sample space and shifts probabilities.

**Conditional probability** is how we update probability beliefs given new information. It's the engine behind spam filters, medical diagnosis, search engines, and recommendation systems.

---

## The Definition

**Conditional probability of A given B:**

```
P(A | B) = P(A ∩ B) / P(B)      [provided P(B) > 0]
```

**Why this formula?** When we learn B occurred, we restrict our sample space from Ω to B. Within B, outcomes are still equally likely (in the uniform case), and we want to know what fraction of B belongs to A.

```
Original:  all of Ω is possible
After "B occurred": only outcomes in B are possible

P(A | B) = (outcomes in both A and B) / (outcomes in B) = |A ∩ B| / |B|

For non-uniform probability: scale by P(B) instead of |B|:
P(A | B) = P(A ∩ B) / P(B)
```

### Worked Example: Card Deck

A card is drawn from a standard 52-card deck.
- A = "card is an Ace"
- B = "card is a spade"

```
P(A) = 4/52 = 1/13
P(B) = 13/52 = 1/4
P(A ∩ B) = P(Ace of Spades) = 1/52

P(A | B) = P(A ∩ B) / P(B) = (1/52) / (13/52) = 1/13

P(B | A) = P(A ∩ B) / P(A) = (1/52) / (4/52) = 1/4
```

Given the card is a spade, probability it's an Ace = 1/13 (one Ace among 13 spades). Makes sense.

Given the card is an Ace, probability it's a spade = 1/4 (one Ace of Spades among 4 Aces). Also makes sense.

---

## The Product Rule

Rearranging P(A|B) = P(A∩B)/P(B):

```
P(A ∩ B) = P(B) × P(A | B)
         = P(A) × P(B | A)
```

Probability that BOTH A and B happen = probability B happens × probability A happens given B did.

**Extended product rule (chain rule):**
```
P(A ∩ B ∩ C) = P(A) × P(B | A) × P(C | A ∩ B)

P(A₁ ∩ A₂ ∩ ... ∩ Aₙ) = P(A₁) × P(A₂|A₁) × P(A₃|A₁∩A₂) × ... × P(Aₙ|A₁∩...∩Aₙ₋₁)
```

**Example:** Deal 3 cards without replacement. What's P(all three are aces)?

```
P(1st Ace) = 4/52
P(2nd Ace | 1st was Ace) = 3/51    (3 Aces left from 51 remaining)
P(3rd Ace | first two were Aces) = 2/50

P(three Aces) = (4/52) × (3/51) × (2/50) = 24/132,600 ≈ 0.000181
```

---

## Independence: When Information Doesn't Help

Events A and B are **independent** if knowing B occurred tells you nothing about A:

```
P(A | B) = P(A)
```

Substituting into the definition:
```
P(A | B) = P(A ∩ B) / P(B) = P(A)
→ P(A ∩ B) = P(A) × P(B)
```

**The multiplication rule for independent events:**
```
A and B are independent ⟺ P(A ∩ B) = P(A) × P(B)
```

This is the definition you use in practice (since you can't always compute P(A|B) directly).

### What Independence Is NOT

**Independence ≠ mutually exclusive:**
- Mutually exclusive: A ∩ B = ∅. If A occurs, B definitely doesn't.
  That means P(A|B) = 0 ≠ P(A) (unless P(A) = 0).
  **Mutually exclusive events are almost never independent** (unless one has probability 0).

**Independence is not obvious from the problem description:**
- Two coin flips: independent (the coin has no memory).
- Drawing two cards from a deck: NOT independent (second draw depends on first).
- Rolling two dice: independent.
- Height and weight of a person: NOT independent (correlated).

### Worked Example: Independent vs Dependent

Two coins are flipped. A = "first coin is heads", B = "second coin is heads".

```
P(A) = 1/2, P(B) = 1/2
P(A ∩ B) = P(HH) = 1/4

Check: P(A) × P(B) = 1/2 × 1/2 = 1/4 = P(A ∩ B). ✓ Independent.
```

Two cards are drawn from a deck without replacement. A = "first is Ace", B = "second is Ace".

```
P(A) = 4/52 = 1/13
P(B) = 4/52 = 1/13   (by symmetry — before ANY cards are seen, each position is uniform)

P(A ∩ B) = (4/52) × (3/51) = 12/2652 = 1/221

Check: P(A) × P(B) = (1/13) × (1/13) = 1/169 ≠ 1/221. NOT independent.
```

---

## Mutual Independence (Three or More Events)

For three events A, B, C to be mutually independent, ALL of these must hold:
```
P(A ∩ B) = P(A)P(B)
P(A ∩ C) = P(A)P(C)
P(B ∩ C) = P(B)P(C)
P(A ∩ B ∩ C) = P(A)P(B)P(C)
```

**Pairwise independence does NOT imply mutual independence.** Classic counterexample:

Roll a fair die. Let:
- A = "result is in {1, 2, 3, 4}" (P(A) = 2/3)

Actually, the cleaner example: toss two fair coins, let X₁, X₂ ∈ {0,1} be the outcomes.
Define: A = {X₁ = 1}, B = {X₂ = 1}, C = {X₁ ≠ X₂} (coins differ).

```
P(A) = 1/2, P(B) = 1/2, P(C) = 1/2.
P(A∩B) = P(H,H) = 1/4 = P(A)P(B). ✓ Pairwise independent.
P(A∩C) = P(H,T) = 1/4 = P(A)P(C). ✓
P(B∩C) = P(T,H) = 1/4 = P(B)P(C). ✓

P(A∩B∩C) = P(X₁=1, X₂=1, X₁≠X₂) = P(∅) = 0.
P(A)P(B)P(C) = (1/2)³ = 1/8 ≠ 0.

NOT mutually independent even though pairwise independent!
```

---

## Conditional Probability as a New Probability Function

Given that B occurred, the function P(· | B) satisfies all three Kolmogorov axioms on the restricted space B:
1. P(A | B) ≥ 0 (since P(A∩B) ≥ 0 and P(B) > 0)
2. P(B | B) = P(B∩B)/P(B) = P(B)/P(B) = 1
3. If A₁ ∩ A₂ = ∅: P(A₁∪A₂|B) = P((A₁∪A₂)∩B)/P(B) = [P(A₁∩B)+P(A₂∩B)]/P(B) = P(A₁|B) + P(A₂|B)

This means: all probability theorems hold for conditional probability. You can apply the addition rule, complement rule, etc., all conditioned on B.

---

## Section Challenge

> ### Conditional Probability Reasoning
>
> A factory has three machines producing widgets:
> - Machine A: produces 50% of widgets, 2% defect rate
> - Machine B: produces 30% of widgets, 4% defect rate
> - Machine C: produces 20% of widgets, 5% defect rate
>
> One widget is selected at random.
>
> **Q1:** What is P(widget is from machine A AND is defective)?
>
> **Q2:** What is the overall probability a randomly selected widget is defective? (Use the Law of Total Probability — formally defined in Chapter 04, but set it up here.)
>
> **Q3:** Given the widget is defective, what is P(it came from machine B)? (This is Bayes' Theorem territory — set up the answer, even if the formal theorem comes next chapter.)
>
> **Q4:** Are "widget is from machine A" and "widget is defective" independent? Show using the definition P(A∩B) = P(A)P(B).
>
> **Q5 (Stretch):** A software test suite has 3 independent tests. Each test independently catches a bug (if present) with probability 0.7. Given a bug IS present:
> (a) What is P(all three tests miss the bug)?
> (b) What is P(at least one test catches it)?
> (c) If the test suite is run n times (independently), what is P(bug is detected at least once in n runs)?

<details>
<summary>Full answers</summary>

```
Q1: P(machine A AND defective)

Let A = event "from machine A", D = event "defective".

P(A ∩ D) = P(A) × P(D | A) = 0.50 × 0.02 = 0.010

Similarly:
P(B ∩ D) = 0.30 × 0.04 = 0.012
P(C ∩ D) = 0.20 × 0.05 = 0.010

──────────────────────────────────────────────────────

Q2: Overall probability of defective widget

The events "from A", "from B", "from C" are mutually exclusive and exhaustive.
P(D) = P(D∩A) + P(D∩B) + P(D∩C) = 0.010 + 0.012 + 0.010 = 0.032

3.2% of widgets are defective overall.

──────────────────────────────────────────────────────

Q3: P(from B | defective)

P(B | D) = P(B ∩ D) / P(D) = 0.012 / 0.032 = 0.375

Given a defect is found, there's a 37.5% chance it came from machine B.

Sanity check: P(A|D) = 0.010/0.032 = 0.3125
              P(B|D) = 0.012/0.032 = 0.3750
              P(C|D) = 0.010/0.032 = 0.3125
              Sum = 1.0 ✓

Even though B produces only 30% of all widgets, it produces 37.5% of defects
(because its defect rate 4% is higher than the weighted average 3.2%).

──────────────────────────────────────────────────────

Q4: Independence of "from machine A" and "defective"?

Check: P(A ∩ D) = P(A) × P(D)?
0.010 vs 0.50 × 0.032 = 0.016

0.010 ≠ 0.016

NOT independent.

Intuition: knowing which machine a widget came from changes its defect probability.
P(D | from A) = 0.02, but P(D) = 0.032 — different! So "from A" and "defective"
are dependent events (negatively associated — machine A has a below-average defect rate).

──────────────────────────────────────────────────────

Q5: Three independent tests, p(catch) = 0.7 per test

(a) P(all three miss):
  P(test 1 misses) = 1 - 0.7 = 0.3
  Tests are independent, so:
  P(all miss) = 0.3 × 0.3 × 0.3 = 0.3³ = 0.027

(b) P(at least one catches) = 1 - P(all miss) = 1 - 0.027 = 0.973

(c) P(detected in at least one of n independent runs):
  One run fails to detect: probability = P(all tests miss) = 0.3³ = 0.027
  n independent runs, all fail: (0.027)ⁿ
  P(detected at least once in n runs) = 1 - (0.027)ⁿ

  For n=1: 1 - 0.027 = 0.973
  For n=2: 1 - 0.027² = 1 - 0.000729 ≈ 0.9993
  For n=3: 1 - 0.027³ ≈ 0.999980

  Two independent runs of the 3-test suite detects the bug 99.93% of the time.
```

</details>

---

## Common Mistakes

**Mistake 1: Confusing P(A|B) with P(B|A)**
- P(disease | positive test) ≠ P(positive test | disease). These are very different quantities. Confusing them is the "prosecutor's fallacy" — common in courtrooms and headlines. Chapter 04 (Bayes) addresses this precisely.

**Mistake 2: Assuming independence from intuition**
- "These two events seem unrelated, so they must be independent." Independence must be checked mathematically: P(A∩B) = P(A)P(B). Intuition fails regularly (see the pairwise-but-not-mutual independence example).

**Mistake 3: Multiplying probabilities of dependent events**
- P(two aces in a row) ≠ (4/52)². The events are dependent (without replacement). Use the chain rule: (4/52) × (3/51).

**Mistake 4: P(A|B) is undefined when P(B) = 0**
- "Given that a fair coin lands on its edge, what's P(heads next flip)?" If P(B) = 0, the conditional probability is undefined. In practice, always check that the conditioning event has positive probability.

---

## Connections

- **Chapter 04 — Bayes:** Bayes' theorem is just P(A|B) = P(B|A)P(A)/P(B). Conditional probability IS Bayes.
- **Chapter 05 — Expectation:** Independence dramatically simplifies computing E[XY] = E[X]E[Y] and Var[X+Y] = Var[X]+Var[Y].
- **Chapter 09 — Joint Distributions:** Joint distributions generalize conditional probability to multiple random variables simultaneously.

---

> [← 02 Counting](02_Counting_Permutations_Combinations.md) | [Course Index](README.md) | [Next → 04 Bayes' Theorem](04_Bayes_Theorem_Total_Probability.md)
