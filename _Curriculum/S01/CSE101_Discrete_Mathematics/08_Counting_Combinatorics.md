# Chapter 08 — Counting & Combinatorics

> [< Previous: 07 Functions & Properties](07_Functions_Properties.md) | [Course Index](README.md) | [Next → 09 Pigeonhole Principle](09_Pigeonhole_Principle.md)

---

## The Problem Counting Solves

Your company has 10 feature flags, each either ON or OFF. QA asks: "How many configurations do we need to test to cover all combinations?"

A naive answer: "a lot." The mathematical answer: 2¹⁰ = 1,024 configurations.

Now: "How many ways can 3 of the 10 flags be ON simultaneously?" 120 ways.  
Now: "If the flags are ordered (one flag controls another), how many orderings are there?" 10! = 3,628,800 orderings.

These numbers matter. They're the difference between "this is tractable" and "this will never finish." Counting is how you reason about the SIZE of a problem space before you touch it.

---

## The Multiplication Principle

**The foundational rule: if task 1 can be done in m ways and task 2 (independent of task 1) can be done in n ways, then both together can be done in m × n ways.**

**Analogy:** A restaurant offers 3 pasta choices, 4 sauce options, and 2 bread types. Total meals: 3 × 4 × 2 = 24. You're building a menu item choice-by-choice; each choice multiplies the running total.

```
Build a 3-character code:
  First character: 26 letters
  Second character: 26 letters (independent of first)
  Third character: 26 letters

Total codes: 26 × 26 × 26 = 26³ = 17,576
```

**Extension:** If selections are NOT independent (later choices depend on earlier ones), you multiply the counts AT EACH STAGE, where each stage's count may differ based on what was chosen.

```
Build a committee of president, VP, treasurer from 10 people:
  President: 10 choices
  VP: 9 choices (president is taken)
  Treasurer: 8 choices (two people are taken)

Total ordered committees: 10 × 9 × 8 = 720
```

---

## Permutations: Ordered Arrangements

A **permutation** is an arrangement of elements where **order matters**.

If you have n distinct elements and arrange all of them:

**P(n) = n! = n × (n-1) × (n-2) × ... × 1**

```
3 people in a race: Alice, Bob, Carol.
Possible finish orders: ABC, ACB, BAC, BCA, CAB, CBA
Count: 3! = 6 ✓
```

If you choose k elements from n and arrange them (order matters, no repetition):

**P(n, k) = n! / (n-k)! = n × (n-1) × ... × (n-k+1)**

```
Gold, silver, bronze from 10 athletes:
  Gold: 10 choices
  Silver: 9 choices
  Bronze: 8 choices

P(10, 3) = 10 × 9 × 8 = 720

Formula check: 10! / (10-3)! = 10! / 7! = (10×9×8×7!) / 7! = 720 ✓
```

**Why "ordered"?** If Alice gets gold and Bob gets silver, that's different from Bob getting gold and Alice getting silver. The assignment to specific positions matters.

### Permutations With Repetition

If elements CAN repeat (you replace each drawn element):

**nᵏ**

```
4-digit PIN from {0-9} with repetition allowed: 10⁴ = 10,000 PINs
4-digit PIN without repetition: P(10,4) = 10 × 9 × 8 × 7 = 5,040 PINs
```

**Password strength:** an 8-character password from 95 printable ASCII characters (with repetition) gives 95⁸ ≈ 6.6 × 10¹⁵ possibilities. Without repetition: P(95, 8) ≈ 5.7 × 10¹⁵. Similar order — repetition barely changes the count for short passwords relative to the character set size.

### Permutations of a Multiset

If you have n objects but some are identical (k₁ of type 1, k₂ of type 2, ..., kₘ of type m):

**n! / (k₁! × k₂! × ... × kₘ!)**

```
Arrangements of "MISSISSIPPI" (11 letters: M×1, I×4, S×4, P×2):
  11! / (1! × 4! × 4! × 2!) = 39,916,800 / (1 × 24 × 24 × 2) = 34,650
```

**Why divide?** The 4! accounts for all the ways to rearrange the 4 identical I's — but those rearrangements produce the same word. Dividing removes the overcounting.

---

## Combinations: Unordered Selection

A **combination** is a selection of elements where **order does NOT matter**.

Choose k elements from n without replacement and without regard to order:

**C(n, k) = n! / (k! × (n-k)!)**

Also written as **ₙCₖ** or **\binom{n}{k}** (the binomial coefficient, read "n choose k").

```
Choose 3 toppings from 8 pizza options:
  P(8, 3) = 336 ordered selections
  But each 3-topping combination appears 3! = 6 times (all orderings of the same 3)
  
  C(8, 3) = 336 / 6 = 56 unordered combinations

Formula check: 8! / (3! × 5!) = (8×7×6) / (3×2×1) = 336 / 6 = 56 ✓
```

**The key question to identify which formula:** 
- Does the ORDER of selection matter? → Permutation
- Does selecting {A, B, C} produce the same result as {C, A, B}? → Combination

| Scenario | Formula | Why |
|----------|---------|-----|
| 3 people assigned to named roles | P(n,3) | Role matters — Alice-as-president ≠ Alice-as-VP |
| 3 people chosen for a committee (equal roles) | C(n,3) | Only membership matters, not which member was picked first |
| Password: 4 digits in sequence | n⁴ or P(n,4) | Position matters — 1234 ≠ 4321 |
| Lottery: pick 6 from 49 | C(49,6) | You win with any ordering of those 6 numbers |

---

## Pascal's Triangle

**Pascal's triangle** organizes all binomial coefficients:

```
Row 0:         1
Row 1:        1 1
Row 2:       1 2 1
Row 3:      1 3 3 1
Row 4:     1 4 6 4 1
Row 5:    1 5 10 10 5 1
```

Row n, position k: C(n, k).

**Pascal's identity — why each entry equals the sum of the two above:**

C(n, k) = C(n-1, k-1) + C(n-1, k)

**Derivation:** you're choosing k items from n. Fix one special item x.
- If x IS selected: choose remaining k-1 from the other n-1 items → C(n-1, k-1) ways.
- If x is NOT selected: choose all k from the other n-1 items → C(n-1, k) ways.

These two cases are disjoint and exhaustive → C(n, k) = C(n-1, k-1) + C(n-1, k). ✓

**Grid paths analogy:** Pascal's triangle counts paths in a grid. To reach row n, column k in the triangle, you could come from (n-1, k-1) (right move) or (n-1, k) (left move). The number of paths is C(n, k).

This is also why binary tree paths count as combinations: the number of paths of length n with exactly k right-turns is C(n, k).

---

## Binomial Theorem

**(x + y)ⁿ = Σₖ₌₀ⁿ C(n,k) xᵏ yⁿ⁻ᵏ**

The coefficient of xᵏ yⁿ⁻ᵏ is C(n,k) because you're choosing k positions (out of n) to contribute an x; the rest contribute y.

**Important special cases:**
- x=1, y=1: 2ⁿ = Σₖ C(n,k) → sum of all entries in row n of Pascal's triangle = 2ⁿ.
  This connects to Chapter 05: |P(A)| = 2ⁿ because each subset corresponds to one term.
- x=1, y=-1: 0 = Σₖ (-1)ᵏ C(n,k) → alternating sum of binomial coefficients = 0.

---

## Inclusion-Exclusion: Counting Unions

We saw this in Chapter 05 for set sizes. Now we derive it from first principles.

**Problem:** How many integers from 1 to 100 are divisible by 2 OR 3?

**Wrong approach:** ⌊100/2⌋ + ⌊100/3⌋ = 50 + 33 = 83. But 83 overcounts multiples of 6 (divisible by both 2 AND 3), each counted twice.

**Correct approach (inclusion-exclusion):**
- |divisible by 2| = 50
- |divisible by 3| = 33
- |divisible by both 2 and 3| = |divisible by 6| = 16

|divisible by 2 OR 3| = 50 + 33 − 16 = **67**

**General principle for two sets:**
|A ∪ B| = |A| + |B| − |A ∩ B|

**For three sets:**
|A ∪ B ∪ C| = |A| + |B| + |C| − |A ∩ B| − |A ∩ C| − |B ∩ C| + |A ∩ B ∩ C|

The pattern: add individuals, subtract pairwise, add triples, subtract quadruples... (alternating signs).

---

## Combinations With Repetition: Stars and Bars

**Problem:** Choose 3 items from a menu of 5, **with repetition allowed** (you can order the same item multiple times). Order doesn't matter.

This is NOT C(5,3) — that's without repetition. With repetition, the formula is:

**C(n+k-1, k)**  — "n types, choose k items with repetition"

For n=5 types, k=3 items: C(5+3-1, 3) = C(7,3) = 35.

**Why this formula? (Stars and bars derivation)**

Represent a selection as stars (items) and bars (dividers between item types):
- 5 types → 4 bars (dividers between categories)
- 3 items → 3 stars
- Arrange 7 symbols: C(7,3) ways to choose positions for the stars (rest are bars).

```
Example: 5 flavors of ice cream, choose 3 scoops.
Flavors: Vanilla | Chocolate | Strawberry | Mint | Cookie

★★★ | | | |     → 3 vanilla
★ | ★ | ★ | |  → 1 vanilla, 1 chocolate, 1 strawberry
| | ★★ | ★ |   → 2 strawberry, 1 mint

Total arrangements of 3 ★ and 4 |: C(7,3) = 35 ✓
```

---

## The Four Counting Formulas — When to Use Each

| Order matters? | Repetition allowed? | Formula | Use case |
|---------------|--------------------|---------|----|
| Yes | No | P(n,k) = n!/(n-k)! | Race medals, seating with assigned roles |
| Yes | Yes | nᵏ | Passwords, dice rolls, binary strings |
| No | No | C(n,k) = n!/(k!(n-k)!) | Committees, lottery, subsets |
| No | Yes | C(n+k-1,k) | Ice cream scoops, coin distributions |

**The two key questions:** (1) Does order matter? (2) Can elements repeat?

---

## Complexity Classes from Counting

Algorithm complexity is just applied counting:

| Complexity | Source | Example |
|-----------|--------|---------|
| O(n) | n elements processed once | Linear scan |
| O(n²) | All pairs from n elements = C(n,2) ≈ n²/2 | Bubble sort comparisons |
| O(n³) | All triples from n elements | Naive matrix multiplication |
| O(2ⁿ) | All subsets of n elements = \|P(A)\| | Subset enumeration |
| O(n!) | All permutations of n elements | Brute-force TSP |
| O(n^k) | k-combinations from n | k-nested loops |

**This is why exponential algorithms can't scale:** for n=50, 2⁵⁰ ≈ 10¹⁵. Even at 10⁹ operations/second, that's 11 days. For n=1000: 2¹⁰⁰⁰ — the universe's age in nanoseconds isn't close.

---

## Section Challenge

> ### Code Review Lottery — Which Formula?
>
> Your team of 12 engineers needs to set up code review processes. Answer the following counting problems, identifying the correct formula for each.
>
> **Question 1:** Each pull request needs exactly 2 reviewers chosen from the 12. How many possible reviewer pairs exist?
>
> **Question 2:** One reviewer is assigned "primary" and one is "secondary" (different responsibilities). How many possible (primary, secondary) assignments from 12 engineers?
>
> **Question 3:** You need to assign 3 engineers to DIFFERENT on-call weeks (week 1, week 2, week 3) from the 12. Multiple engineers per week are NOT allowed. How many ways?
>
> **Question 4:** You have 5 types of code review areas: security, performance, readability, tests, architecture. Each engineer selects 3 areas they'll focus on (can select the same area multiple times in terms of "depth", but in practice here: repetition NOT allowed, order does NOT matter). How many focus-area combinations are possible?
>
> **Question 5 (Hard):** A PR can have 1, 2, or 3 reviewers (not 0, not 4+). How many ways can you assign reviewers from 12 to this PR?

<details>
<summary>Full derivation + answers</summary>

```
QUESTION 1: 2 reviewers, no roles, from 12

Order matters? NO — {Alice, Bob} is the same pair as {Bob, Alice}
Repetition? NO — can't assign the same person twice

Formula: C(12, 2) = 12! / (2! × 10!) = (12 × 11) / (2 × 1) = 66 pairs

──────────────────────────────────────────────────────────

QUESTION 2: Primary AND secondary reviewer, from 12

Order matters? YES — Alice-primary + Bob-secondary ≠ Bob-primary + Alice-secondary
Repetition? NO — one person can't be both primary and secondary

Formula: P(12, 2) = 12 × 11 = 132 ordered assignments

Note: exactly double Q1's answer because each unordered pair {A, B} now
becomes 2 ordered pairs: (A,B) and (B,A). P(n,k) = C(n,k) × k! always holds.

──────────────────────────────────────────────────────────

QUESTION 3: 3 engineers assigned to 3 DISTINCT weeks, from 12

Order matters? YES — Alice assigned to week 1 ≠ Alice assigned to week 2
Repetition? NO — one engineer can't be in multiple weeks (stated)

Formula: P(12, 3) = 12 × 11 × 10 = 1,320 assignments

This is NOT C(12,3) because which engineer goes to which week matters.
Week-1 engineer has different responsibilities from week-3 engineer.

──────────────────────────────────────────────────────────

QUESTION 4: 3 focus areas from 5 types, no repetition, no order

Order matters? NO — {security, perf, readability} same as {perf, security, readability}
Repetition? NO — can't choose "security" twice as 2 of your 3 areas

Formula: C(5, 3) = 5! / (3! × 2!) = (5 × 4) / (2 × 1) = 10 combinations

These are the "feature subsets" for each engineer's review specialty.

──────────────────────────────────────────────────────────

QUESTION 5: 1, 2, or 3 reviewers from 12 (hard)

Strategy: count each case separately and add (cases are disjoint).

Case A — exactly 1 reviewer: C(12, 1) = 12
Case B — exactly 2 reviewers: C(12, 2) = 66
Case C — exactly 3 reviewers: C(12, 3) = 220

Total: 12 + 66 + 220 = 298

Alternative (complementary counting):
  Total subsets of 12: 2¹² = 4,096
  Invalid: size 0 = C(12,0) = 1
  Invalid: size 4 = C(12,4) = 495
  Invalid: size 5 = C(12,5) = 792
  ... (sizes 4 through 12)
  
  Sum of valid subsets (size 1,2,3):
  C(12,1) + C(12,2) + C(12,3) = 12 + 66 + 220 = 298 ✓

  (Faster for small k: direct sum. Faster for large k: total minus excluded sizes.)

──────────────────────────────────────────────────────────

FORMULA SELECTION SUMMARY:

  The two-question test:
  1. Does the ORDER of selection create a DIFFERENT outcome?
     Yes → Permutation (P or nᵏ). No → Combination (C).
  2. Can the SAME element appear more than once?
     Yes → With repetition. No → Without repetition.
  
  Q1: No order, no repetition → C(12,2) = 66
  Q2: Order (roles differ), no repetition → P(12,2) = 132
  Q3: Order (weeks differ), no repetition → P(12,3) = 1,320
  Q4: No order, no repetition → C(5,3) = 10
  Q5: No order, no repetition, multiple cases → Sum of C(12,k) for k=1,2,3 = 298
```

</details>

---

## Common Mistakes

**Mistake 1: Using P when you want C (or vice versa)**
- Rule: if the *same selection* in a different order is a *different outcome*, use P. If it's the same outcome, use C.
- "How many 4-person teams?" → C (the team is the same regardless of who was picked first).
- "How many ways to rank 4 people 1st through 4th?" → P (rank matters).

**Mistake 2: Forgetting to divide by k! when switching from P to C**
- C(n,k) = P(n,k) / k!. Every set of k elements has k! orderings, all counted by P but only 1 by C.

**Mistake 3: Applying multiplication when you should use addition**
- Multiplication: one task AND another (both happen).
- Addition: one task OR another (mutually exclusive alternatives).
- "How many lunch options if you choose one from menu A or menu B?" → ADD |A| + |B| (you're choosing from one menu, not both).

**Mistake 4: Forgetting to account for identical items in permutations**
- Arranging n items with repeats: divide by k! for each group of k identical items.
- Forgetting this step overcounts by the permutations of identical items.

**Mistake 5: Treating "at least 1" as "exactly 1"**
- "At least 1" = total − (none).
- C(n,0) = 1 (the empty selection), so: C(n,≥1) = 2ⁿ − 1.

---

## Connections

- **Chapter 09 — Pigeonhole:** If you have more than C(n,2) functions from n-element sets, the Pigeonhole Principle guarantees a collision. Counting IS the foundation of the Pigeonhole argument.
- **Chapter 10 — Recurrences:** Pascal's identity C(n,k) = C(n-1,k-1) + C(n-1,k) IS a recurrence. Memoizing the Pascal triangle is dynamic programming (Chapter 10 will generalize this pattern).
- **Chapter 05 — Sets:** |P(A)| = 2^|A| because each subset corresponds to a unique "include/exclude" binary sequence — equivalent to the sum over all k of C(|A|,k) = 2^|A|.
- `03_Algorithms/A2_Complexity_FirstPrinciples.md` — Every time complexity class is a counting argument: O(n!) is "permutation count," O(2ⁿ) is "power set count," O(C(n,k)) for k-nested loops.
- `21_Python_ML_DL_NLP/` — Probability of a neural network producing certain outputs requires counting valid weight configurations. Dropout randomly selects subsets C(n,k) of neurons.

---

> [< Previous: 07 Functions & Properties](07_Functions_Properties.md) | [Course Index](README.md) | [Next → 09 Pigeonhole Principle](09_Pigeonhole_Principle.md)
