# Chapter 04 — Mathematical Induction

> **Course:** CSE101 Discrete Mathematics · **Unit:** 1 (Logic & Proof) · **Week:** 4
> **Prerequisites:** [Chapter 03 — Proof Techniques](03_Proof_Techniques.md)
> **Reading time:** ~3 hours · **Lab time:** ~3 hours

---

## Why You're Here

Mathematical induction is the most-used proof technique in computer science. Every recursive algorithm's correctness, every loop invariant proof, every "this property is preserved by every operation" argument relies on it.

Most students learn induction as a TEMPLATE: "show base case, show inductive step, done." This works for textbook problems but FAILS in real engineering, because they don't understand WHY induction works. When the proof gets tricky (strong induction, structural induction), the template breaks and they're stuck.

This chapter teaches induction as a domino chain — a mechanism — so you can apply it to novel problems, including recursive data structures and program correctness.

---

## 1. The Domino Analogy — The Mechanism

You set up an infinite row of dominoes. To make them all fall:

1. **Base case:** Push the first domino over.
2. **Inductive step:** Ensure that if any domino k falls, it knocks over domino k+1.

If both conditions hold, ALL the dominoes fall.

**Why?** Push the first → it falls. Because domino 1 fell, domino 2 falls (by the inductive step). Because domino 2 fell, domino 3 falls. And so on, forever. Every specific domino n eventually falls because there's an unbroken chain from the first to the nth.

Mathematical induction is the mathematical formalization of this.

### The formal principle

To prove `∀n ≥ n₀. P(n)`:

1. **Base case:** Prove P(n₀).
2. **Inductive step:** Prove `∀k ≥ n₀. (P(k) → P(k+1))`.

If both hold, you've established P(n) for every n ≥ n₀.

**Why this works as a proof principle:** It's actually an AXIOM of the natural numbers (Peano axiom). The natural numbers ARE the set obtained by starting at 0 and repeatedly applying "successor." Anything provable by induction holds for every natural number because that's how the natural numbers are constructed.

---

## 2. Weak Induction — The Standard Template

"Weak" induction means the inductive step assumes P(k) — only the IMMEDIATELY PRECEDING case — to prove P(k+1).

### 2.1 Worked example: Sum of first n positive integers

**Claim:** For all n ≥ 1, 1 + 2 + ... + n = n(n+1)/2.

**Proof by induction on n.**

**Base case (n = 1):** The left side is just 1. The right side is 1(1+1)/2 = 1. Both equal 1. ✓

**Inductive step:** Assume the claim holds for some k ≥ 1 (the **inductive hypothesis**):
```
1 + 2 + ... + k = k(k+1)/2
```

Show it holds for k+1:
```
1 + 2 + ... + k + (k+1) = ?
```

Using the inductive hypothesis:
```
1 + 2 + ... + k + (k+1) = k(k+1)/2 + (k+1)
                       = (k+1) [k/2 + 1]
                       = (k+1)(k+2)/2
```

That's exactly the formula at n = k+1. ✓

By induction, the claim holds for all n ≥ 1. ∎

### 2.2 The structure to MEMORIZE (then forget)

Every weak-induction proof has this skeleton:

```
CLAIM: For all n ≥ n₀, P(n).

PROOF by induction.

BASE CASE: Verify P(n₀) directly.

INDUCTIVE STEP:
  Assume P(k) holds for arbitrary k ≥ n₀ (inductive hypothesis).
  We must show P(k+1) holds.
  [Algebra/reasoning using the inductive hypothesis.]
  Therefore P(k+1) holds.

CONCLUSION: By induction, P(n) holds for all n ≥ n₀. ∎
```

Memorize this until you don't have to think about it. Then start applying it to non-trivial problems where the algebra matters more than the structure.

### 2.3 In code: induction for loop invariants

Consider a loop:

```javascript
function sum(arr) {
  let total = 0;
  for (let i = 0; i < arr.length; i++) {
    total = total + arr[i];
  }
  return total;
}
```

**Invariant claim:** After iteration i, `total = arr[0] + arr[1] + ... + arr[i]`.

**Proof by induction on iteration count.**

**Base (i = 0):** Before iteration 0, total = 0 (sum of empty prefix). After iteration 0, total = 0 + arr[0] = arr[0]. ✓

**Inductive step:** Suppose after iteration k, total = arr[0] + ... + arr[k]. At iteration k+1, the code does total = total + arr[k+1] = (arr[0] + ... + arr[k]) + arr[k+1] = arr[0] + ... + arr[k+1]. ✓

**Conclusion:** After the loop terminates (i = arr.length - 1), total = arr[0] + ... + arr[arr.length - 1] = full array sum. The function is correct.

Every "this loop is correct" argument is induction over iteration count. The inductive hypothesis is your **loop invariant**.

---

## 3. Strong Induction — Assuming All Previous Cases

In some proofs, P(k+1) doesn't follow from P(k) alone. You need to assume P(j) for all j ≤ k. This is **strong induction**.

### 3.1 The mechanism

To prove `∀n ≥ n₀. P(n)`:

1. **Base case(s):** Prove P(n₀), and potentially P(n₀+1), P(n₀+2), depending on how far back the inductive step needs to reach.
2. **Inductive step:** Prove that for any k ≥ n₀, if P(n₀), P(n₀+1), ..., P(k) all hold, then P(k+1) holds.

The strong inductive hypothesis is more powerful — you can use ANY previous case, not just the one right before.

### 3.2 Worked example: every integer ≥ 12 cents can be made with 4¢ and 5¢ stamps

**Claim:** For every n ≥ 12, there exist non-negative integers a, b such that 4a + 5b = n.

**Strong induction proof.**

**Base cases:**
- n = 12: 4(3) + 5(0) = 12. ✓
- n = 13: 4(2) + 5(1) = 13. ✓
- n = 14: 4(1) + 5(2) = 14. ✓
- n = 15: 4(0) + 5(3) = 15. ✓

**Inductive step:** Assume the claim holds for all integers from 12 up to some k ≥ 15. Show it holds for k+1.

Consider k - 3 ≥ 12 (since k ≥ 15). By the inductive hypothesis, there exist a, b ≥ 0 such that k - 3 = 4a + 5b.

Then:
```
k + 1 = (k - 3) + 4 = 4a + 5b + 4 = 4(a + 1) + 5b
```

So with a+1 and b stamps, we make k+1. ✓

By strong induction, the claim holds for all n ≥ 12. ∎

### 3.3 Why we needed FOUR base cases

The inductive step reached back THREE steps (k - 3). For the step at k+1 = 16, we used the hypothesis for k - 3 + 1 = 13. For the step at k+1 = 17, we used k - 3 + 1 = 14. Etc.

If our base cases only covered n = 12, then when proving n = 13, 14, 15, the inductive step's hypothesis (k - 3 ≥ 12) wouldn't apply. We needed enough base cases to "feed" the inductive step until it could lift off on its own.

**Lesson:** strong induction often needs MULTIPLE base cases. Count how far back your inductive step reaches and prove that many bases.

### 3.4 When strong induction is essential

Strong induction is essential when:
- The inductive step naturally references different "previous" cases depending on the value (e.g., Fibonacci where F(n) = F(n-1) + F(n-2))
- Divide-and-conquer algorithms where merge-sort's correctness uses the hypothesis on n/2, not n-1
- Number-theoretic claims about prime factorization

---

## 4. Structural Induction — Induction on Recursive Data

When you have a recursively-defined structure (trees, lists, expressions), you can use induction over the **structure** itself, not over numbers.

### 4.1 The mechanism

For a recursively defined set of structures:
1. **Base case:** Prove P holds for the "atomic" (smallest) structures.
2. **Inductive step:** Prove that if P holds for the substructures, P holds for the whole.

### 4.2 Worked example: binary tree height bound

**Recursive definition of binary tree:**
- Atomic: a single leaf is a binary tree of height 0.
- Recursive: if L and R are binary trees, then `Node(L, R)` is a binary tree whose height is 1 + max(height(L), height(R)).

**Claim:** A binary tree of height h has at most 2^(h+1) - 1 nodes.

**Proof by structural induction.**

**Base case:** A leaf has height 0 and contains 1 node. 2^(0+1) - 1 = 1. ✓

**Inductive step:** Consider Node(L, R) where L has height h_L and R has height h_R. By inductive hypothesis:
- L has at most 2^(h_L + 1) - 1 nodes
- R has at most 2^(h_R + 1) - 1 nodes

The total nodes in Node(L, R):
```
1 + nodes(L) + nodes(R)
≤ 1 + (2^(h_L + 1) - 1) + (2^(h_R + 1) - 1)
= 2^(h_L + 1) + 2^(h_R + 1) - 1
```

The height of Node(L, R) is h = 1 + max(h_L, h_R), so h_L ≤ h - 1 and h_R ≤ h - 1.

Therefore:
```
2^(h_L + 1) ≤ 2^h
2^(h_R + 1) ≤ 2^h
```

So:
```
1 + nodes(L) + nodes(R) ≤ 2^h + 2^h - 1 = 2^(h+1) - 1
```

That's exactly the bound for height h. ✓

By structural induction, every binary tree of height h has at most 2^(h+1) - 1 nodes. ∎

### 4.3 Where structural induction lives in code

Every recursive function's correctness proof is structural induction:
- Tree traversal: base = leaf (or null), inductive = combine left + right subtree results
- List processing: base = empty list, inductive = head + recursive call on tail
- Expression evaluation: base = literal, inductive = combine subexpressions

When you write a recursive function and want to prove it correct, structural induction is your tool.

---

## 5. When Induction Fails — The Off-by-One Trap

Induction's mechanism is bulletproof IF you prove the base case AND the inductive step correctly. Most failures come from a subtle bug in the inductive step.

### 5.1 The classic horses fallacy

**Claim:** All horses are the same color.

**"Proof":**
- Base: 1 horse. Trivially same color as itself. ✓
- Inductive step: Suppose any group of k horses are the same color. Take a group of k+1 horses. Remove one — the remaining k are same color (hypothesis). Put it back, remove a different one — those k are same color too. Since both subgroups share horses, all k+1 horses are the same color.

The conclusion is obviously wrong (horses come in many colors), so the proof has a bug. WHERE?

**The bug:** the inductive step from k = 1 to k = 2.

When k = 1, the group has 2 horses. The "two subgroups of 1 horse" each contain a SINGLE horse, and these singletons DON'T OVERLAP (no shared horse). The argument "both subgroups share horses, so they're the same color" requires the subgroups to overlap. For k ≥ 2, the subgroups overlap in k-1 horses, so transitivity works. For k = 1, no overlap — the argument breaks at this boundary.

**Lesson:** Always verify the inductive step holds at the boundary cases. A common bug pattern: "this step works for k ≥ 2" but the base is k = 1, leaving k = 1 → k = 2 unproven.

### 5.2 The base case must MATCH

A common error: prove a base case that's not the one you need.

**Bad:** "Claim: for all n ≥ 5, 2ⁿ > n². Proof: base case n = 1: 2 = 2 > 1 = 1². ✓ Inductive step: ..."

But we only need n ≥ 5, and the base case should be at n = 5: 2⁵ = 32 > 25 = 5² ✓. Verifying at n = 1 doesn't address the actual claim range.

This bug is sneaky: the proof "looks" right because the structure is correct. Always match base cases to the actual quantifier range.

### 5.3 The inductive step must be GENERAL

The inductive step must hold for an ARBITRARY k in the range. If your proof depends on a specific k (or only a finite set), it's not general.

**Bad:** "Inductive step: for k = 3, P(3) → P(4) holds because ... [specific argument]. So P(n) holds for all n ≥ 3."

NO — you proved one specific step. You need to prove the step for ARBITRARY k ≥ 3 simultaneously. A general algebraic manipulation that works for all k, not a calculation for k = 3.

---

## 6. Induction in Algorithm Correctness

Every recursive algorithm's correctness is a structural-induction proof.

### 6.1 Binary search correctness

```javascript
function bsearch(arr, target, lo, hi) {
  if (lo > hi) return -1;
  const mid = Math.floor((lo + hi) / 2);
  if (arr[mid] === target) return mid;
  if (arr[mid] < target) return bsearch(arr, target, mid + 1, hi);
  return bsearch(arr, target, lo, mid - 1);
}
```

**Claim:** If `target` is in `arr` within range [lo, hi], `bsearch` returns an index where `arr[index] === target`. Otherwise it returns -1.

**Proof by strong induction on the range size `hi - lo + 1`.**

**Base (range size 0, i.e., lo > hi):** Empty range. Target can't be there. Return -1. ✓

**Inductive step:** Assume correctness for all range sizes smaller than n. Consider a range of size n.

Compute mid. Three cases:
1. `arr[mid] === target`: return mid. Correct.
2. `arr[mid] < target`: target (if present) must be in [mid+1, hi], a range of size n - (mid - lo + 1) < n. By IH, the recursive call is correct.
3. `arr[mid] > target`: similar reasoning for [lo, mid-1], range size < n. Correct by IH.

The cases exhaust all possibilities. ✓

By strong induction, bsearch is correct on all ranges. ∎

This proof structure is the SAME as the textbook structural induction proof. Algorithm correctness = induction.

### 6.2 Merge sort termination + correctness

For merge sort, you'd prove:
- **Termination:** The recursion always reaches the base case (array of size ≤ 1).
- **Correctness:** The result is sorted.

Both use strong induction on the array size. Termination because each recursive call is on a strictly smaller array. Correctness because merge of two sorted halves is sorted (a small lemma), combined with the inductive hypothesis on the halves.

This is why "prove your algorithm is correct" is a sensible interview question — the answer is always an induction proof on the recursive structure.

---

## Section Challenge

> **Part 1:** Prove by induction that 1³ + 2³ + 3³ + ... + n³ = (n(n+1)/2)². (Note: the right side is the SQUARE of the sum 1 + 2 + ... + n.)
>
> **Part 2:** Find the bug in this "proof" that every group of n people has the same age:
>
> "Proof: Base: 1 person is trivially the same age as themselves. Inductive step: assume any group of k people have the same age. Take a group of k+1 people. Order them by age. The first k have the same age (hypothesis). The last k also have the same age (hypothesis). Therefore all k+1 have the same age. ∎"

<details>
<summary>Answers with full derivations</summary>

```
═══════════════════════════════════════════════════════════
PART 1: Sum of cubes equals square of the sum

CLAIM: For all n ≥ 1, 1³ + 2³ + ... + n³ = (n(n+1)/2)².

PROOF by induction on n.

BASE (n = 1):
  Left:  1³ = 1
  Right: (1(1+1)/2)² = 1² = 1
  Equal. ✓

INDUCTIVE STEP:
  Assume 1³ + 2³ + ... + k³ = (k(k+1)/2)² for some k ≥ 1.
  Show 1³ + 2³ + ... + k³ + (k+1)³ = ((k+1)(k+2)/2)².

  Add (k+1)³ to both sides of the hypothesis:
    Left side of claim at k+1:
    1³ + 2³ + ... + k³ + (k+1)³ = (k(k+1)/2)² + (k+1)³

  Factor (k+1)² from the right:
    = (k+1)² · [k²/4 + (k+1)]
    = (k+1)² · [(k² + 4(k+1)) / 4]
    = (k+1)² · [(k² + 4k + 4) / 4]
    = (k+1)² · [(k+2)² / 4]
    = ((k+1)(k+2)/2)²

  That's the right-hand side of the claim at n = k+1. ✓

CONCLUSION: By induction, the formula holds for all n ≥ 1. ∎

INTUITION:
  This is a remarkable identity: the sum of the first n cubes equals
  the SQUARE of the sum of the first n positive integers. Often stated
  as:    1³ + 2³ + ... + n³ = (1 + 2 + ... + n)²

  Both sides equal (n(n+1)/2)².

═══════════════════════════════════════════════════════════
PART 2: The "all people same age" fallacy

THE STRUCTURE:
  Base: 1 person, trivially same age. ✓
  Inductive step claims: "Order the k+1 people. First k same age (hypothesis).
                          Last k same age (hypothesis). So all same age."

THE BUG: Same as the horses fallacy.

The inductive step argues that the "first k" and "last k" subgroups must
overlap, so transitivity gives "all k+1 same age." This argument WORKS
for k ≥ 2 (because then the overlap contains at least k-1 ≥ 1 people).

But for k = 1, the inductive step goes from 1 person to 2 people:
  - "First 1 person same age as themselves" — trivially true, just 1 person.
  - "Last 1 person same age as themselves" — trivially true.
  - "Both subgroups share people" — FALSE. The first 1 person and the
    last 1 person are DIFFERENT people in a group of 2.

The transitivity argument requires the subgroups to SHARE at least one
person. For k = 1 → k+1 = 2, no sharing → no transitivity → the
inductive step fails.

Since the inductive step fails at k = 1, the chain BREAKS THERE. The
proof has a gap from 1 to 2, so it doesn't establish the universal claim.

THE LIFE LESSON:
  When verifying an inductive proof:
  1. Verify the base case is the SMALLEST claim you need.
  2. Verify the inductive step at the boundary — does it actually work for k = 1?
  3. If the inductive step has any "WLOG" or "by symmetry" claim, check
     the symmetry actually holds.

THIS BUG IN PRODUCTION:
  Real algorithm correctness proofs often hide this bug:

  "The greedy choice is optimal. Proof: assume optimal at step k, then..."
  
  Did you verify the greedy choice is optimal at step 1? At step 2?
  Many "obvious" greedy proofs have a base-case gap where the greedy
  choice ISN'T optimal for tiny instances but is for large ones.

  Senior interviewers look for this gap. Sketchy proofs often fail
  at the smallest case.
```

</details>

---

## Practice Problems

1. Prove by induction: 2 + 4 + 6 + ... + 2n = n(n+1).
2. Prove by induction: for all n ≥ 1, n < 2ⁿ.
3. Prove by induction: 1 + 2 + 4 + ... + 2ⁿ = 2^(n+1) - 1.
4. Prove by strong induction: every integer n ≥ 2 has a prime factorization. (Note: this is the existence half of the Fundamental Theorem of Arithmetic.)
5. Prove the height-vs-nodes bound for a full binary tree: a full binary tree of height h has EXACTLY 2^(h+1) - 1 nodes (not just "at most").

---

## Connections

- **Chapter 09 — Pigeonhole:** existence proofs sometimes use induction; sometimes pigeonhole is cleaner.
- **Chapter 10 — Recurrences:** unwrapping a recurrence is essentially structural induction over the recursion tree.
- `03_Algorithms/A1_Correctness_Proofs.md` — loop invariants are weak induction in disguise.
- `03_Algorithms/03a_Recursion_Internals.md` — every recursive algorithm's correctness is a structural induction proof.
- `02_Data_Structures/A1_DS_Correctness_Invariants.md` — preserving DS invariants under every operation is an induction over operation sequences.

---

> [< Previous: 03 Proof Techniques](03_Proof_Techniques.md) | [Course Index](README.md) | [Next → 05 Sets & Operations](05_Sets_Operations.md)
