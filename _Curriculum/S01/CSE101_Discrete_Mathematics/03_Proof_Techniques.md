# Chapter 03 — Proof Techniques

> **Course:** CSE101 Discrete Mathematics · **Unit:** 1 (Logic & Proof) · **Week:** 3
> **Prerequisites:** [Chapter 01 — Propositional Logic](01_Propositional_Logic.md), [Chapter 02 — Predicate Logic](02_Predicate_Logic_Quantifiers.md)
> **Reading time:** ~3 hours · **Lab time:** ~3 hours

---

## Why You're Here

In Chapters 01-02 you learned to STATE claims precisely. This chapter teaches you to **prove** them — to make a claim that withstands skeptical scrutiny.

Every algorithm correctness argument, every "this loop terminates" reasoning, every "this type-safe API can't be misused" guarantee is a proof. The technique you choose depends on the claim's shape. A senior engineer doesn't memorize proofs — they recognize patterns and reach for the right technique.

This chapter covers four core techniques: **direct proof, proof by cases, proof by contradiction, proof by contrapositive**. Plus the most important falsification technique: **counterexample**.

---

## 1. What Is a Proof?

A proof is a chain of statements where each step is JUSTIFIED by:
- A given fact (axiom, definition, or assumption)
- A previously-proved theorem
- A logical inference rule applied to earlier steps

The chain ends with the claim you wanted to establish.

**Real-world analogy: a courtroom argument.**

A prosecutor doesn't say "the defendant is guilty, trust me." They build a chain:
- Witness saw the defendant at the scene (premise)
- The defendant's fingerprints are on the weapon (premise)
- The weapon caused the death (forensic conclusion)
- Therefore the defendant caused the death (chain of reasoning)

Each step is justified by evidence or by a previous step. The skeptic can challenge any link, and the prosecutor must defend it.

A proof is structurally identical: a chain where each step is defensible.

### Standards for a valid proof

1. **Every step is justified.** No "obviously..." that hides an unargued assumption.
2. **The premises are stated.** What are you ASSUMING vs. proving?
3. **The conclusion matches the claim.** You don't accidentally prove something stronger or weaker.
4. **No circular reasoning.** The conclusion can't appear (in disguise) as a premise.

---

## 2. Direct Proof

The simplest technique. You assume the premise, apply known rules, derive the conclusion.

**Template:**
```
To prove: P → Q

Step 1: Assume P.
Step 2: ...by definition...
Step 3: ...by previously-proved theorem...
...
Step n: Therefore Q.
```

### Worked example: "If n is even, then n² is even."

**Definitions:**
- "n is even" means: there exists an integer k such that n = 2k.

**Proof:**

Assume n is even. Then by definition, there exists an integer k such that n = 2k.

Squaring both sides:
```
n² = (2k)² = 4k² = 2(2k²)
```

Let m = 2k² (which is an integer because k is an integer). Then n² = 2m, which means n² is even by definition. ∎

The `∎` symbol marks the end of a proof (mathematicians' "QED").

**Why this proof works:**
- We started from the definition of "even" (the only thing we can use to talk about "n is even")
- Every algebra step is a known rule
- We ended with the definition of "n² is even"

There's no leap of faith. A skeptic can challenge each step, and we can defend each one.

### Worked example: "The sum of two odd numbers is even."

**Definitions:**
- "n is odd" means: there exists an integer k such that n = 2k + 1.

**Proof:**

Let a and b be odd numbers. Then there exist integers j and k such that:
- a = 2j + 1
- b = 2k + 1

Their sum:
```
a + b = (2j + 1) + (2k + 1)
      = 2j + 2k + 2
      = 2(j + k + 1)
```

Let m = j + k + 1 (an integer). Then a + b = 2m, so a + b is even by definition. ∎

---

## 3. Proof by Cases

Sometimes a single argument doesn't cover all possibilities. Split the problem into cases that EXHAUST the possibilities, and prove each case.

**Template:**
```
To prove: P → Q

Case 1: When P_1 holds, ... therefore Q.
Case 2: When P_2 holds, ... therefore Q.
...
Case k: When P_k holds, ... therefore Q.
(And P_1 ∨ P_2 ∨ ... ∨ P_k covers all of P)

Therefore Q in all cases.
```

### Worked example: "For any integer n, n² + n is even."

**Observation:** Every integer is either even or odd. So we can split into two cases.

**Case 1: n is even.**

Then n = 2k for some integer k. So:
```
n² + n = (2k)² + 2k = 4k² + 2k = 2(2k² + k)
```
Therefore n² + n is even.

**Case 2: n is odd.**

Then n = 2k + 1 for some integer k. So:
```
n² + n = (2k+1)² + (2k+1)
       = (4k² + 4k + 1) + (2k + 1)
       = 4k² + 6k + 2
       = 2(2k² + 3k + 1)
```
Therefore n² + n is even.

Both cases give even. Since every integer is even or odd, n² + n is always even. ∎

### When to use proof by cases

- When the claim is universally quantified over a domain that naturally splits (integers split into even/odd; days into weekday/weekend; users into authenticated/unauthenticated)
- When the proof requires different machinery in different scenarios
- In code: this is essentially exhaustive switch/case coverage. Each case's logic must hold; missing a case (default) means the claim is unproven for that case.

**Real-world analogy: a customer support flowchart.**

"Every customer issue gets resolved in 24 hours" — proven by:
- Case 1: Billing issue → route to billing team, resolved within 24h.
- Case 2: Technical issue → route to engineering, resolved within 24h.
- Case 3: Account access → route to security, resolved within 24h.
- Case 4: Other → escalate to general support manager, resolved within 24h.

If any case is missed, the universal claim fails. Many real-world SLAs are proven this way — by case analysis over ticket categories.

---

## 4. Proof by Contradiction (Reductio ad Absurdum)

Powerful technique: instead of proving Q directly, assume ¬Q (the opposite) and derive a contradiction. Since a contradiction can't be true, ¬Q must be false, so Q is true.

**Template:**
```
To prove: Q

Step 1: Assume ¬Q.
Step 2: Derive consequences from ¬Q...
Step k: Reach a contradiction (something both true and false, or a violation of a known fact).
Step k+1: Therefore the assumption ¬Q is false.
Step k+2: Therefore Q is true. ∎
```

**Real-world analogy: a detective's logic.**

A detective reasons: "Suppose the butler did it. Then he'd have been in the library at 9 p.m. But three witnesses saw him in the dining room at 9. Contradiction! Therefore the butler did not do it."

The detective didn't prove "the butler didn't do it" directly — they assumed the opposite, found a contradiction with established facts, and inferred the original was false.

### Worked example: "√2 is irrational."

**Background:** A number is "rational" if it can be written as p/q where p, q are integers with no common factor (other than 1) — i.e., in lowest terms.

**Proof:**

Assume for contradiction that √2 is rational. Then √2 = p/q for some integers p, q with no common factor.

Squaring both sides: 2 = p²/q², so p² = 2q².

This means p² is even. Therefore p is even (because if p were odd, p² would be odd).

So p = 2k for some integer k. Substituting back:
```
(2k)² = 2q²
4k² = 2q²
2k² = q²
```

This means q² is even, so q is even.

But we said p and q have no common factor. Yet we've just shown BOTH are even — meaning 2 is a common factor.

**Contradiction!** Our assumption that √2 is rational led to a logical impossibility. Therefore √2 is irrational. ∎

### Why proof by contradiction is so powerful

You don't need to construct the conclusion; you just need to show its opposite breaks something. For claims like "there is no X" (negative existential), contradiction is often the ONLY natural approach. You can't "directly construct" a proof that nothing exists — but you can assume something exists and derive a contradiction.

### Famous proofs by contradiction

- **There are infinitely many prime numbers** (Euclid). Assume finitely many, multiply them all and add 1, derive a new prime → contradiction.
- **The halting problem is undecidable** (Turing). Assume a halting decider exists, construct a self-referential program, contradiction.
- **Cantor's diagonal argument** showing the real numbers are uncountable.

These are foundational results in mathematics and computer science. Each uses contradiction because the claim is "there is no X" or "X cannot exist."

---

## 5. Proof by Contrapositive

A specialized version of indirect proof. To prove `P → Q`, prove the equivalent `¬Q → ¬P` instead.

Recall from Chapter 01: **the contrapositive is logically equivalent to the original implication**.

**Template:**
```
To prove: P → Q

Step 1: Assume ¬Q.
Step 2: Derive consequences...
Step k: Conclude ¬P.
Step k+1: Therefore ¬Q → ¬P, which equivalently means P → Q. ∎
```

**When to use:** When ¬Q gives you more useful information than P does. Often arises when Q is a "for all" statement (its negation gives you a concrete witness) or when P is hard to work with directly.

### Worked example: "If n² is even, then n is even."

**Direct attempt would be hard.** From "n² is even" we'd need to deduce "n is even" — but our starting fact is about n², not n.

**Contrapositive approach:** Prove "If n is NOT even (odd), then n² is NOT even (odd)."

Assume n is odd. Then n = 2k + 1 for some integer k.

```
n² = (2k + 1)² = 4k² + 4k + 1 = 2(2k² + 2k) + 1
```

Let m = 2k² + 2k (an integer). Then n² = 2m + 1, which is odd by definition.

So if n is odd, n² is odd. By contrapositive, if n² is even, n is even. ∎

The contrapositive proof was straightforward because we had algebraic machinery for "n is odd." Trying the direct version, we'd have struggled to "extract" evenness from n² without circular reasoning.

### Real-world example

Claim: "If the system reports the user is admin, then the user authenticated."

Contrapositive: "If the user did NOT authenticate, the system does NOT report admin."

Often easier to verify — you can audit the auth pipeline and confirm no unauthenticated path reaches the admin-status code.

---

## 6. Counterexample — The Falsification Technique

To DISPROVE a universal claim `∀x. P(x)`, find ONE specific x where P(x) is false. That single example is enough.

**Real-world analogy: black swans.**

For centuries, Europeans claimed "all swans are white." Then explorers reached Australia and found black swans. ONE black swan refuted the universal claim. The naturalists didn't need to find 100 — one suffices.

### Worked example: Disprove "n² > n for all positive integers n."

Test n = 1: 1² = 1, and 1 is NOT greater than 1. Counterexample found.

So the claim "n² > n for all positive integers" is FALSE. A revised true claim is "n² > n for all integers n ≥ 2."

### Counterexamples in code

When a test fails, the failing input is a counterexample. Good test reports tell you exactly which counterexample.

```javascript
expect(arr.every(x => x > 0)).toBe(true);
// FAILED: array contained -5 at index 3
// The -5 is the counterexample
```

A test framework that says "assertion failed" without identifying the counterexample is hiding the most useful information.

### Property-based testing

Property-based testing (QuickCheck, Hypothesis) systematically searches for counterexamples to universal claims:

```
Property: ∀ string s. reverse(reverse(s)) === s
```

The framework tries thousands of strings to find a counterexample. If none found, you have empirical evidence (not proof) of the property.

If a counterexample is found, the framework reports the SMALLEST one (via "shrinking"), making debugging easier.

---

## 7. What Makes a Proof Wrong?

Common failure modes (these are the ones that bite in interviews):

### 7.1 Assuming what you're trying to prove

**Bad proof:** "Claim: this loop terminates. Proof: each iteration, the loop counter decreases, and the loop exits when the counter reaches zero. The loop will reach zero because loops always terminate, so it terminates."

The premise "loops always terminate" assumes the conclusion. Circular.

### 7.2 Affirming the consequent

**Bad proof:** "If x is divisible by 6, then x is even. x is even. Therefore x is divisible by 6."

Affirming the consequent of an implication is invalid. (Counterexample: 4 is even but not divisible by 6.)

### 7.3 Insufficient case coverage

**Bad proof:** "All polygons have interior angles summing to 180°. Proof: triangles have angles summing to 180°."

Triangles are one TYPE of polygon. Squares, pentagons, hexagons exist. The proof only addresses one case but claims a universal.

### 7.4 Misusing "without loss of generality" (WLOG)

"WLOG" lets you assume a specific configuration when symmetry permits. But you have to verify the symmetry exists.

**Bad proof:** "For any triangle, WLOG the base is the longest side. ..."

NOT every triangle has a "longest side" — equilateral triangles have all sides equal. The WLOG was used to skip work that wasn't legitimately skippable.

### 7.5 Confusing necessary vs sufficient

"If X then Y" makes X a SUFFICIENT condition for Y, and Y a NECESSARY condition for X. Confusing these gives invalid arguments.

**Bad reasoning:** "A college degree is necessary to be a software engineer. Bob has a college degree. Therefore Bob is a software engineer."

Necessity doesn't imply sufficiency. The premise says you NEED a degree, not that having one MAKES you an engineer.

---

## Section Challenge

> Three claims to prove or disprove. Choose the right technique for each.
>
> 1. "For any two odd integers a and b, a · b is odd."
> 2. "For every integer n ≥ 1, n² + n + 41 is prime."
> 3. "If a positive integer n has a divisor strictly between 1 and √n, then n is composite."

<details>
<summary>Answers with the technique selection reasoning</summary>

```
═══════════════════════════════════════════════════════════
(1) "For any two odd integers a and b, a · b is odd"

TECHNIQUE: Direct proof.

WHY: We have specific structural information about a and b (oddness),
and the conclusion is structural (oddness of product). Construct directly.

PROOF:

  Assume a and b are odd. By definition of odd:
    a = 2j + 1 for some integer j
    b = 2k + 1 for some integer k

  Compute the product:
    a · b = (2j + 1)(2k + 1)
          = 4jk + 2j + 2k + 1
          = 2(2jk + j + k) + 1

  Let m = 2jk + j + k. This is an integer (sum/product of integers).
  Then a · b = 2m + 1, which is odd by definition. ∎

═══════════════════════════════════════════════════════════
(2) "For every integer n ≥ 1, n² + n + 41 is prime"

TECHNIQUE: Try small cases first. If the claim is universal, look for
a counterexample.

WHY THIS CLAIM IS SUSPICIOUS:
  It's Euler's polynomial. For n = 1, 2, 3, ..., 39, the value IS prime
  (a remarkable streak — Euler discovered it). But the polynomial isn't
  magic.

TEST n = 40:
  40² + 40 + 41 = 1600 + 40 + 41 = 1681 = 41²

  1681 = 41 × 41. NOT PRIME.

DISPROVAL:
  The claim is false. Counterexample: n = 40 gives 1681, which factors
  as 41 × 41, so it's composite. ∎

LESSON:
  Inductive evidence (39 consecutive primes!) is NOT proof. A counter-
  example refutes universal claims regardless of how many positive
  cases preceded it.

  This is exactly why mathematicians distinguish between "verified for
  many cases" and "proved." Goldbach's conjecture has been verified
  for every even integer up to 4×10^18, yet remains unproven.

═══════════════════════════════════════════════════════════
(3) "If a positive integer n has a divisor strictly between 1 and √n,
    then n is composite"

TECHNIQUE: Direct proof.

WHY: We have structural information (existence of a divisor in a
specific range), and the conclusion is structural (compositeness).

PROOF:

  Suppose n has a divisor d with 1 < d < √n.

  By definition of divisor, n = d · k for some positive integer k.

  Since d > 1, we have k = n/d ≠ n (k is strictly less than n).
  Since d < √n, we have k = n/d > n/√n = √n.

  So 1 < d < √n < k < n. Specifically, d and k are BOTH strictly
  between 1 and n.

  Therefore n = d · k is a product of two factors both strictly
  between 1 and n. By definition, n is composite. ∎

THE CONTRAPOSITIVE (useful for primality testing):

  "If n is prime, then n has no divisor strictly between 1 and √n."

  This is the basis of TRIAL DIVISION primality testing: to check if n
  is prime, test divisibility only up to √n. If no divisor exists in
  that range, n has no divisor at all (other than 1 and itself), so n
  is prime.

  This is why isPrime(n) runs in O(√n), not O(n). The contrapositive
  IS the algorithm.

═══════════════════════════════════════════════════════════

THE META-LESSON:

The technique you choose depends on:
  - The shape of the claim (universal vs existential, P → Q vs ¬P)
  - The information you have (structural definitions help direct proof)
  - The number of cases involved
  - Whether the claim looks suspicious (try to falsify before proving)

GOOD ENGINEERING INSTINCT:
  Before proving an algorithm correct, try to BREAK it with edge cases.
  If you can find ONE counterexample to the property you'd prove, you've
  saved yourself a lot of work — the property was false.

  This is exactly what property-based testing automates.
```

</details>

---

## Practice Problems

1. Prove directly: "The product of any two consecutive integers is even."
2. Prove by contradiction: "There is no smallest positive rational number."
3. Prove by contrapositive: "If 3n + 2 is odd, then n is odd."
4. Disprove: "All numbers of the form 2ⁿ - 1 are prime." (These are Mersenne candidates.)
5. Prove by cases: "For any integer n, n³ - n is divisible by 6." (Hint: split by n mod 6.)

---

## Connections

- **Chapter 04 — Induction:** the most-used proof technique in CS; deserves its own chapter.
- **Chapter 09 — Pigeonhole:** an existence-proof technique used to prove "at least one" without constructing.
- `03_Algorithms/A1_Correctness_Proofs.md` — loop invariants are direct proofs over loop iterations.
- `03_Algorithms/A3_Lower_Bounds_And_NP.md` — Cook-Levin theorem uses reduction proofs; halting problem uses contradiction.
- `02_Data_Structures/A1_DS_Correctness_Invariants.md` — preserving structural invariants is proof-by-cases (every operation must preserve the invariant).

---

> [< Previous: 02 Predicate Logic](02_Predicate_Logic_Quantifiers.md) | [Course Index](README.md) | [Next → 04 Induction Variants](04_Induction_Variants.md)
