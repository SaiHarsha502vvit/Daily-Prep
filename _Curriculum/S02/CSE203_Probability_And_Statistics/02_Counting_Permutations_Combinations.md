# Chapter 02 — Counting: Permutations & Combinations

> [← 01 Probability Axioms & Sample Spaces](01_Probability_Axioms_Sample_Spaces.md) | [Course Index](README.md) | [Next → 03 Conditional Probability & Independence](03_Conditional_Probability_Independence.md)

---

## The Problem: Computing P(E) = |E|/|Ω|

From Chapter 01: in a uniform probability model, P(E) = (number of outcomes in E) / (total outcomes).

Computing these counts is the whole challenge. A poker hand is 5 cards from 52 — that's a specific subset size. The number of ways to arrange 6 tasks on a schedule — that's an ordering problem. How many 8-character passwords contain at least one digit — that's a constraint-satisfaction count.

Combinatorics is the mathematics of counting WITHOUT listing everything. Listing all possible poker hands would take pages — the formula gives the answer in one line.

---

## The Fundamental Principle of Counting

**Multiplication rule:** If you make k sequential choices, with n₁ options for the first, n₂ for the second (independent of the first choice), ..., nₖ for the kth, then the total number of outcomes is:

```
n₁ × n₂ × ... × nₖ
```

**Why this is true:** The total is the number of leaves in a decision tree.

```
Choose shirt (3 colors) × Choose pants (2 colors) = 6 outfits

Tree:
  Red    → Blue pants   → (Red, Blue)
         → Black pants  → (Red, Black)
  White  → Blue pants   → (White, Blue)
         → Black pants  → (White, Black)
  Blue   → Blue pants   → (Blue, Blue)
         → Black pants  → (Blue, Black)

Total leaves: 3 × 2 = 6. ✓
```

**Worked Example:** How many 4-digit PINs are there?
```
Each digit: 10 choices (0-9).
Total: 10 × 10 × 10 × 10 = 10,000.
```

**Worked Example:** How many 4-digit PINs with no repeated digits?
```
First digit: 10 choices.
Second digit: 9 choices (can't repeat first).
Third digit: 8 choices.
Fourth digit: 7 choices.
Total: 10 × 9 × 8 × 7 = 5,040.
```

---

## Permutations: Ordered Arrangements

A **permutation** is an ordered arrangement of items. Order matters — (A, B, C) is different from (B, A, C).

**All n items in all n positions:** n! (n factorial)

```
n! = n × (n-1) × (n-2) × ... × 2 × 1
5! = 5 × 4 × 3 × 2 × 1 = 120

How many ways to arrange 5 books on a shelf?
5! = 120 ways.
```

Why n!? By the multiplication rule:
```
Position 1: n choices.
Position 2: n-1 remaining choices.
...
Position n: 1 remaining choice.
Total: n × (n-1) × ... × 1 = n!
```

**k items chosen from n (P(n,k) or nPk):** Permutations of k items chosen from n.

```
P(n, k) = n × (n-1) × ... × (n-k+1) = n! / (n-k)!
```

**Example:** How many ways can 3 students win gold, silver, bronze from a group of 10?
```
P(10, 3) = 10 × 9 × 8 = 720.
(Or: 10! / 7! = 3,628,800 / 5,040 = 720. ✓)
```

**Why n!/(n-k)!?** You're taking the full arrangement n! and dividing by the (n-k)! arrangements of the unchosen items (which don't matter to us).

---

## Combinations: Unordered Selections

A **combination** is a selection of items where order does NOT matter. {A, B, C} and {B, A, C} are the same combination.

```
C(n, k) = n! / (k! × (n-k)!)   [read: "n choose k"]

Also written: ₙCₖ, C_n^k, or the binomial coefficient (n k)
```

**Deriving C(n,k) from P(n,k):**

- P(n,k) = 720 counts all ORDERED arrangements of 3 people from 10.
- But {Alice, Bob, Charlie} is counted 3! = 6 times in P(n,k) — once for each ordering.
- To count UNORDERED sets: divide by k! = 6.

```
C(10, 3) = P(10, 3) / 3! = 720 / 6 = 120
```

The 120 three-person committees from 10 people.

**The formula explained:**
```
C(n, k) = n! / (k! (n-k)!)

n!: ways to arrange ALL n items.
÷ k!: un-order the k chosen items (they form one set, not a sequence).
÷ (n-k)!: un-order the unchosen items (they don't appear at all).
```

**Worked Examples:**

```
Poker hand (5 from 52):
C(52, 5) = 52! / (5! × 47!) = (52 × 51 × 50 × 49 × 48) / (5 × 4 × 3 × 2 × 1)
         = 311,875,200 / 120
         = 2,598,960 possible hands.

Pizza toppings (choose 3 from 12):
C(12, 3) = 12! / (3! × 9!) = (12 × 11 × 10) / 6 = 1320/6 = 220.
```

---

## Key Identities (with proofs)

**C(n, k) = C(n, n-k)** — choosing k items is equivalent to choosing the n-k items to LEAVE OUT.

```
Proof: C(n, n-k) = n! / ((n-k)! × k!) = C(n, k). ∎

Intuition: C(52, 5) = C(52, 47). Makes sense — specifying which 5 cards are IN
your hand is the same as specifying which 47 cards are OUT.
```

**C(n, 0) = C(n, n) = 1** — there's exactly one way to choose nothing, and one way to choose everything.

```
C(n, 0) = n! / (0! × n!) = 1 / 1 = 1.   (0! = 1 by convention)
```

**Pascal's Identity: C(n, k) = C(n-1, k-1) + C(n-1, k)**

```
Proof (combinatorial): Consider a specific item X. A k-subset either:
  - Contains X: choose k-1 more from the remaining n-1 → C(n-1, k-1) ways.
  - Doesn't contain X: choose k from the remaining n-1 → C(n-1, k) ways.
  Total: C(n-1, k-1) + C(n-1, k) = C(n, k). ∎
```

This generates Pascal's Triangle:
```
n=0:               1
n=1:             1   1
n=2:           1   2   1
n=3:         1   3   3   1
n=4:       1   4   6   4   1
n=5:     1   5  10  10   5   1
```

**Binomial Theorem:** (x + y)ⁿ = Σₖ C(n,k) xᵏ yⁿ⁻ᵏ

The coefficient of xᵏyⁿ⁻ᵏ is C(n,k) — the number of ways to choose k positions for x from n factors.

```
(x+y)³ = C(3,0)y³ + C(3,1)xy² + C(3,2)x²y + C(3,3)x³
        = y³ + 3xy² + 3x²y + x³ ✓
```

---

## Inclusion-Exclusion: Counting with Overlapping Sets

For two sets:
```
|A ∪ B| = |A| + |B| - |A ∩ B|
```

For three sets:
```
|A ∪ B ∪ C| = |A| + |B| + |C| - |A∩B| - |A∩C| - |B∩C| + |A∩B∩C|
```

Pattern: add singletons, subtract pairwise intersections, add triple intersections, etc.

**Worked Example:** In a class of 100 students:
- 50 study math (M)
- 45 study CS (C)  
- 35 study physics (P)
- 20 study both math and CS
- 15 study both math and physics
- 10 study both CS and physics
- 5 study all three

How many study at least one subject?

```
|M ∪ C ∪ P| = 50 + 45 + 35 - 20 - 15 - 10 + 5
            = 130 - 45 + 5
            = 90

How many study NONE? 100 - 90 = 10.
```

---

## Permutations with Repetition

When items can be repeated:

**Arrangements of n items from k types (with repetition allowed):**
```
kⁿ total arrangements.

Example: 4-letter passwords from 26 letters (repeats allowed): 26⁴ = 456,976.
```

**Arrangements of n items where some are identical:**

If among n items, n₁ are type 1, n₂ are type 2, ..., nₖ are type k (n₁+n₂+...+nₖ = n):
```
Multinomial coefficient: n! / (n₁! × n₂! × ... × nₖ!)
```

**Example:** How many distinct arrangements of the letters MISSISSIPPI?

```
M: 1, I: 4, S: 4, P: 2.   Total: 11 letters.

If all distinct: 11!
But the 4 I's are identical (swapping them doesn't change the word) → divide by 4!
Similarly for S's → divide by 4!
And P's → divide by 2!

Count: 11! / (1! × 4! × 4! × 2!) = 39,916,800 / (1 × 24 × 24 × 2) = 39,916,800 / 1,152 = 34,650.
```

---

## Section Challenge

> ### Combinatorics for Probability
>
> **Q1:** A team of 4 is chosen from 6 men and 5 women. What is the probability the team has exactly 2 men and 2 women? Show the counting argument.
>
> **Q2:** A password must be exactly 8 characters using only lowercase letters (a-z) and digits (0-9). What is the probability a randomly generated password has at least one digit?
>
> **Q3:** In a standard deck of 52 cards, what is the probability of being dealt a "full house" (3 cards of one rank + 2 cards of another rank)?
>
> **Q4:** How many 5-digit numbers (leading zeros allowed, so 00000 to 99999) have digit sum exactly 5? (Hint: stars and bars.) What is the probability a random 5-digit string has digit sum exactly 5?
>
> **Q5 (Stretch):** In a group of n people, each pair shakes hands exactly once. For n=30, how many handshakes occur? Now extend: there are n people at a party, and the probability that any two specific people know each other is p. What is the expected number of pairs who know each other? (Express in terms of n and p.)

<details>
<summary>Full answers</summary>

```
Q1: 4-person team, exactly 2 men + 2 women

Total ways to choose 4 from 11: C(11, 4) = 330.

Ways to choose exactly 2 men from 6: C(6, 2) = 15.
Ways to choose exactly 2 women from 5: C(5, 2) = 10.

Ways with exactly 2 men + 2 women: C(6,2) × C(5,2) = 15 × 10 = 150.

P(exactly 2 men, 2 women) = 150 / 330 = 5/11 ≈ 0.455.

──────────────────────────────────────────────────────

Q2: 8-char password, at least one digit

Alphabet size: 26 letters + 10 digits = 36 characters.
Total 8-character strings: 36⁸ = 2,821,109,907,456.

Strings with NO digits (all letters): 26⁸ = 208,827,064,576.

P(at least one digit) = 1 - P(no digits)
= 1 - 26⁸/36⁸
= 1 - (26/36)⁸
= 1 - (13/18)⁸
= 1 - 0.0741...
≈ 0.9259

Numerically: 1 - 208,827,064,576 / 2,821,109,907,456 ≈ 0.926.

About 92.6% of random 8-character passwords contain at least one digit.

──────────────────────────────────────────────────────

Q3: Full house probability

Total 5-card hands: C(52, 5) = 2,598,960.

Count full houses:
  Choose the rank for the 3-of-a-kind: 13 ways.
  Choose 3 suits from 4 for that rank: C(4, 3) = 4 ways.
  Choose the rank for the pair: 12 ways (any rank except the 3-of-a-kind rank).
  Choose 2 suits from 4 for that rank: C(4, 2) = 6 ways.

Count = 13 × 4 × 12 × 6 = 3,744 full houses.

P(full house) = 3,744 / 2,598,960 ≈ 0.001441 ≈ 0.144%.

──────────────────────────────────────────────────────

Q4: 5-digit strings with digit sum = 5

We need non-negative integer solutions to d₁ + d₂ + d₃ + d₄ + d₅ = 5
with 0 ≤ dᵢ ≤ 9.

Stars and bars (without upper bound constraint):
  Solutions to x₁ + x₂ + ... + x₅ = 5, xᵢ ≥ 0:
  C(5+5-1, 5-1) = C(9, 4) = 126.

Check upper bound (dᵢ ≤ 9): Since the sum is 5, no digit can exceed 5 ≤ 9.
The upper bound constraint is automatically satisfied!
So count = 126.

Total 5-digit strings: 10⁵ = 100,000.

P(digit sum = 5) = 126 / 100,000 = 0.00126 = 0.126%.

──────────────────────────────────────────────────────

Q5: Handshakes + expected pairs

Number of handshakes among n=30 people:
  Each pair shakes hands once.
  Number of pairs: C(30, 2) = 30 × 29 / 2 = 435 handshakes.

Expected number of pairs who know each other:
  Each pair knows each other with probability p (independently).
  There are C(n, 2) = n(n-1)/2 pairs.
  
  Let Xᵢⱼ = 1 if persons i and j know each other, 0 otherwise.
  Total known pairs: X = Σᵢ<ⱼ Xᵢⱼ
  
  E[X] = Σᵢ<ⱼ E[Xᵢⱼ] = Σᵢ<ⱼ P(Xᵢⱼ = 1) = C(n,2) × p = n(n-1)/2 × p.

This uses LINEARITY OF EXPECTATION (Chapter 05) — we sum expected values
without worrying about whether the pairs are independent.

For n=30, p=0.5: expected pairs = 435 × 0.5 = 217.5.
```

</details>

---

## Common Mistakes

**Mistake 1: Using permutations when combinations are needed (or vice versa)**
- If order matters → permutation. "In how many ways can 3 runners finish in 1st/2nd/3rd?" Order matters → P(n,k).
- If order doesn't matter → combination. "In how many ways can 3 people be on a committee?" Same people, any order → C(n,k).
- Test: "Is (Alice, Bob) the same as (Bob, Alice) for this problem?" Yes → combination. No → permutation.

**Mistake 2: Forgetting division for identical items**
- Arrangements of AABBC: NOT 5! — must divide by 2!×2!×1! for the repeats.

**Mistake 3: Off-by-one in the multiplication rule**
- "How many numbers from 1 to 100 are divisible by 3?" Answer: ⌊100/3⌋ = 33. NOT 100/3 = 33.33.

**Mistake 4: Assuming independence when applying the multiplication rule**
- "P(A and B happen)" = P(A) × P(B) ONLY if A and B are independent. See Chapter 03 for the general rule.

---

## Connections

- **Chapter 01:** P(E) = |E|/|Ω| for uniform models. Counting is the computational content of Chapter 01's framework.
- **Chapter 06 — Binomial Distribution:** C(n,k) appears as the number of ways to get exactly k successes in n trials. The binomial distribution is built entirely on the combinatorics of this chapter.
- **CSE101 Ch08 — Combinatorics:** Deep dive into these same counting techniques in the discrete math context. Cross-reference for proof-level detail.

---

> [← 01 Probability Axioms & Sample Spaces](01_Probability_Axioms_Sample_Spaces.md) | [Course Index](README.md) | [Next → 03 Conditional Probability & Independence](03_Conditional_Probability_Independence.md)
