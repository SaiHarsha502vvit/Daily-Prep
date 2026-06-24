# A2. Complexity Analysis from First Principles

**Navigation**: [← A1: Correctness Proofs](A1_Correctness_Proofs.md) | [📚 Index](00_INDEX.md) | [A3: Lower Bounds & NP →](A3_Lower_Bounds_And_NP.md)

> **MIT 6.006 L2–L4 / RWTH Aachen Algo I / TU Munich IN0007 foundation**
>
> "The purpose of complexity analysis is not just to say O(n log n). It is to *derive* that bound from first principles — from the structure of the algorithm itself — so that you understand *why* the algorithm behaves as it does, and *when* that bound breaks."

---

## Table of Contents

1. [Formal Asymptotic Notation — The Definitions That Matter](#1-formal-asymptotic-notation--the-definitions-that-matter)
2. [Recurrence Analysis — Three Methods](#2-recurrence-analysis--three-methods)
3. [The Master Theorem — Complete with All Cases](#3-the-master-theorem--complete-with-all-cases)
4. [Amortized Analysis — Three Methods](#4-amortized-analysis--three-methods)
5. [Space Complexity and the Stack](#5-space-complexity-and-the-stack)
6. [Common Pitfalls in Complexity Analysis](#6-common-pitfalls-in-complexity-analysis)

---

## 1. Formal Asymptotic Notation — The Definitions That Matter

### Five Symbols, Five Meanings

Most courses teach only O. Universities teach all five, because the distinction matters for lower bounds.

```
f(n) = O(g(n))   ─── f grows AT MOST as fast as g           ("upper bound")
                     ∃ c > 0, n₀ : ∀ n ≥ n₀, f(n) ≤ c·g(n)

f(n) = Ω(g(n))   ─── f grows AT LEAST as fast as g          ("lower bound")
                     ∃ c > 0, n₀ : ∀ n ≥ n₀, f(n) ≥ c·g(n)

f(n) = Θ(g(n))   ─── f grows EXACTLY as fast as g           ("tight bound")
                     f = O(g) AND f = Ω(g)

f(n) = o(g(n))   ─── f grows STRICTLY SLOWER than g         ("strict upper")
                     lim(n→∞) f(n)/g(n) = 0

f(n) = ω(g(n))   ─── f grows STRICTLY FASTER than g         ("strict lower")
                     lim(n→∞) f(n)/g(n) = ∞
```

### Why the Constant Factor Matters (And When It Doesn't)

```
f(n) = 1000n     g(n) = 0.001n²

For n < 1,000,000:  f(n) > g(n)   — the O(n) algorithm is SLOWER
For n > 1,000,000:  f(n) < g(n)   — the O(n) algorithm is faster

Big-O tells you about ASYMPTOTIC behavior.
For small n, the constant dominates. Always profile before assuming Big-O wins.
```

### Proving Big-O From the Definition

**Claim**: 3n² + 5n + 2 = O(n²)

**Proof**: We need c > 0 and n₀ such that for all n ≥ n₀: 3n² + 5n + 2 ≤ c·n²

For n ≥ 1: 5n ≤ 5n² and 2 ≤ 2n². So:
3n² + 5n + 2 ≤ 3n² + 5n² + 2n² = 10n²

Choose c = 10, n₀ = 1. Done. ✓

**Why this matters**: Any polynomial of degree k is Θ(nᵏ). The lower-order terms and constants vanish. This justifies dropping them in Big-O analysis.

---

### The Hierarchy You Must Know

```
O(1) ⊂ O(log n) ⊂ O(√n) ⊂ O(n) ⊂ O(n log n) ⊂ O(n²) ⊂ O(n³) ⊂ O(2ⁿ) ⊂ O(n!)

Each is strictly contained: O(log n) ⊂ O(√n) because log n = o(√n):
  lim(n→∞) (log n / √n) = 0  (by L'Hôpital: (1/n) / (1/2√n) = 2/√n → 0)
```

---

## 2. Recurrence Analysis — Three Methods

Recursive algorithms produce **recurrence relations**. There are exactly three systematic methods to solve them.

### Method 1: The Substitution Method (Guess and Verify)

**Structure**: Guess the form of the solution, then prove it by induction.

**Example**: Solve T(n) = 2T(n/2) + n, T(1) = 1.

**Step 1 — Guess**: Based on experience, guess T(n) = O(n log n). Specifically, guess T(n) ≤ cn log n.

**Step 2 — Substitute**: Assume T(k) ≤ ck log k for all k < n. Then:

```
T(n) = 2T(n/2) + n
     ≤ 2 · c(n/2)log(n/2) + n      (inductive hypothesis)
     = cn · log(n/2) + n
     = cn · (log n - log 2) + n
     = cn log n - cn + n
     = cn log n - (c-1)n
     ≤ cn log n                      (if c ≥ 1)
```

Choose c = 1 and n₀ = 1. The guess is confirmed: T(n) = O(n log n). ✓

**Step 3 — Prove lower bound**: Guess T(n) ≥ cn log n. Symmetric argument gives T(n) = Ω(n log n).

Therefore: T(n) = **Θ(n log n)**. This is merge sort's complexity — proved.

---

**Subtlety**: Guessing wrong fails gracefully. If you guess T(n) = O(n):

```
T(n) ≤ 2 · c(n/2) + n = cn + n = (c+1)n ≠ cn
```

The constant grows — the induction doesn't close. Wrong guess, try Θ(n log n).

---

### Method 2: Recursion Tree (Visualize, Then Sum)

**Structure**: Draw the recursion tree, compute work at each level, sum over all levels.

**Example**: T(n) = 3T(n/4) + n²

**Draw the tree**:
```
Level 0:  n²                                          ← n² work
         /    \   \
Level 1: (n/4)²  (n/4)²  (n/4)²                      ← 3(n/4)² = 3n²/16 work
         (3 subproblems of size n/4)
Level 2: 9 subproblems of size n/16                   ← 9(n/16)² = 9n²/256 work
...
Level i:  3ⁱ subproblems of size n/4ⁱ                ← 3ⁱ · (n/4ⁱ)² = (3/16)ⁱ · n²
```

**Sum over levels**: Total work = n² · Σᵢ₌₀^∞ (3/16)ⁱ = n² · 1/(1 - 3/16) = n² · 16/13 = Θ(n²)

**Why the sum converges**: ratio r = 3/16 < 1. The geometric series Σrⁱ = 1/(1-r) — the root dominates.

```
Rule of thumb from the recursion tree:
  r < 1 → dominated by root:  T(n) = Θ(f(n))  where f is the work per level
  r = 1 → equal work per level: T(n) = Θ(f(n) · log n)
  r > 1 → dominated by leaves: T(n) = Θ(nˡᵒᵍₐ(b)) where a = branching, b = reduction
```

---

### Method 3: Master Theorem (Pattern Match)

This is the formula version of Method 2 — it covers the common cases efficiently.

---

## 3. The Master Theorem — Complete with All Cases

### The Recurrence Form

T(n) = a·T(n/b) + f(n)     where a ≥ 1, b > 1, f asymptotically positive

- **a** = number of subproblems
- **b** = factor by which input size is reduced
- **f(n)** = work done at the current level (excluding recursive calls)
- **critical exponent** = log_b(a) = log(a)/log(b)

### Three Cases

```
Compare f(n) with nˡᵒᵍᵇ⁽ᵃ⁾:

┌──────────────────────────────────────────────────────────────────────┐
│ CASE 1: f(n) = O(nˡᵒᵍᵇ⁽ᵃ⁾ - ε) for some ε > 0                     │
│         → leaves dominate                                            │
│         T(n) = Θ(nˡᵒᵍᵇ⁽ᵃ⁾)                                         │
│                                                                      │
│ CASE 2: f(n) = Θ(nˡᵒᵍᵇ⁽ᵃ⁾ · logᵏ(n)) for some k ≥ 0              │
│         → equally distributed (add a log factor)                    │
│         T(n) = Θ(nˡᵒᵍᵇ⁽ᵃ⁾ · logᵏ⁺¹(n))                           │
│                                                                      │
│ CASE 3: f(n) = Ω(nˡᵒᵍᵇ⁽ᵃ⁾ ⁺ ε) for some ε > 0                     │
│         AND a·f(n/b) ≤ c·f(n) for some c < 1 (regularity cond.)   │
│         → root dominates                                            │
│         T(n) = Θ(f(n))                                              │
└──────────────────────────────────────────────────────────────────────┘
```

### Worked Examples (Must Memorize)

| Recurrence | a | b | log_b(a) | f(n) | Case | Result |
|-----------|---|---|----------|------|------|--------|
| T(n) = 2T(n/2) + n | 2 | 2 | 1 | n = Θ(n¹) | 2 (k=0) | **Θ(n log n)** |
| T(n) = 2T(n/2) + 1 | 2 | 2 | 1 | 1 = O(n¹⁻¹) | 1 | **Θ(n)** |
| T(n) = 4T(n/2) + n | 4 | 2 | 2 | n = O(n²⁻¹) | 1 | **Θ(n²)** |
| T(n) = 4T(n/2) + n² | 4 | 2 | 2 | n² = Θ(n²) | 2 (k=0) | **Θ(n² log n)** |
| T(n) = 4T(n/2) + n³ | 4 | 2 | 2 | n³ = Ω(n²⁺¹) | 3 | **Θ(n³)** |
| T(n) = T(n/2) + 1 | 1 | 2 | 0 | 1 = Θ(n⁰) | 2 (k=0) | **Θ(log n)** |
| T(n) = 9T(n/3) + n | 9 | 3 | 2 | n = O(n²⁻¹) | 1 | **Θ(n²)** |

### When the Master Theorem Does NOT Apply

```
T(n) = 2T(n/2) + n/log(n)
  log_b(a) = 1, f(n) = n/log(n)
  
  n/log(n) is asymptotically smaller than n = n¹ 
  BUT the gap is sub-polynomial: n/log(n) = ω(n^(1-ε)) for any ε > 0
  
  → Falls in the GAP between Case 1 and Case 2. Master Theorem fails.
  → Use substitution method: T(n) = Θ(n log log n)

Also fails for:
  T(n) = 2T(n/2) + n·sin(n)   (f not monotone)
  T(n) = T(n-1) + 1            (subtract, not divide — use n = a·k type analysis)
  T(n) = T(√n) + 1             (substitution: let m = log n, S(m) = T(2^m))
```

### Deriving T(n) = T(n-1) + 1 (Linear Search)

Not covered by Master Theorem (subtractive recurrence):

```
T(n) = T(n-1) + 1
     = T(n-2) + 1 + 1
     = T(n-3) + 1 + 1 + 1
     ...
     = T(1) + (n-1)·1
     = 1 + n - 1 = n
```

T(n) = Θ(n). (Each unrolling is straightforward since we subtract by 1.)

### Generalizations Beyond Master Theorem — Akra-Bazzi Reference

The Master Theorem handles T(n) = aT(n/b) + f(n) where all subproblems are the same size. For **unequal subproblem sizes** (e.g., Karatsuba, randomized median-of-three), use the Akra-Bazzi theorem.

**Statement:** T(x) = Σ aᵢ T(bᵢ x) + f(x) → Θ(x^p (1 + ∫₁ˣ f(u)/uᵖ⁺¹ du)) where p solves Σ aᵢ bᵢᵖ = 1.

**See** `02c_Divide_And_Conquer.md` for the full worked example (T(n) = T(2n/3) + T(n/3) + n, yielding Θ(n log n)) and a comparison table of when to use Master Theorem vs Akra-Bazzi.

**When in doubt:** Use Akra-Bazzi. It subsumes Master Theorem as a special case and handles unequal subproblems, weighted subproblems, and continuous fraction splits.

---

## 4. Amortized Analysis — Three Methods

Standard worst-case analysis can be **overly pessimistic** for data structures where expensive operations are rare and cheap operations make up for them. Amortized analysis gives a tighter bound on the average cost per operation across a sequence.

**Key distinction**: Amortized ≠ Average-case. Amortized is a worst-case bound on the average — no probability involved.

---

### Method 1: Aggregate Analysis

Sum the total cost of n operations, divide by n.

**Example: Dynamic Array Doubling**

```java
void add(T element) {
    if (size == capacity) {
        resize(2 * capacity);   // O(n) to copy
    }
    data[size++] = element;     // O(1)
}
```

*Single operation worst case*: O(n) when resizing occurs.

*Amortized analysis*: Consider n `add()` calls on an initially empty array. Resizes happen at sizes 1, 2, 4, 8, 16, ..., n (total ≈ log n resizes). Cost of each resize = copying that many elements:

```
Total resize cost = 1 + 2 + 4 + 8 + ... + n = 2n - 1 (geometric series)
Total O(1) insert cost = n
Total cost = 3n - 1 = O(n)
Amortized cost per operation = O(n) / n = O(1)
```

**Conclusion**: Each `add()` is O(1) amortized, even though individual calls can be O(n).

*Why doubling (not +1)?* If we added 1 slot each time instead of doubling: n operations → n resizes → O(n²) total cost → O(n) amortized per op. Doubling makes the total O(n).

---

### Method 2: Accounting Method (Banker's Method)

Assign a "charge" to each operation. Operations can pay for themselves AND save credit for future expensive operations.

**Rules**: 
- Actual cost ≤ amortized charge + credit used
- Credit balance must never go negative

**Example: Stack with Multipop**

Operations: `push(x)`: O(1), `pop()`: O(1), `multipop(k)`: O(min(k, size))

*Worst case for single operation*: Multipop of n elements = O(n).

*Amortized analysis with accounting*:
- Charge `push` an amortized cost of 2 (1 for the push itself, 1 saved as credit for the future pop)
- Charge `pop` an amortized cost of 0 (uses the 1 credit saved by the push)
- Charge `multipop(k)` an amortized cost of 0 (uses k credits, one per element popped)

**Verification**: Each element accumulates 1 credit when pushed. It uses exactly 1 credit when popped (or multipop'd). Credit never goes negative (can't pop more than was pushed). Each `push` amortized charge = 2. Total amortized cost for n pushes = 2n = O(n). So all operations together are O(n), O(1) amortized each.

---

### Method 3: Potential Method (Physicist's Method)

Define a **potential function** Φ that maps data structure state to a real number. Amortized cost = actual cost + ΔΦ.

```
â_i = c_i + Φ(D_i) - Φ(D_{i-1})

where:
  â_i = amortized cost of operation i
  c_i = actual cost of operation i
  Φ(D) = potential of data structure state D

Total amortized cost = Σ â_i = Σ c_i + Φ(D_n) - Φ(D_0)
If Φ(D_n) ≥ Φ(D_0), total amortized ≥ total actual → valid upper bound
```

**Example: Binary Counter (Increment)**

Count from 0 to n in binary. Flipping a 1→0 bit costs 1. How many flips total for n increments?

*Naive*: Worst case, incrementing n = 011...1 (k ones) flips k+1 bits. If this happens every time: O(n²). Too pessimistic.

*Potential function*: Φ(counter) = number of 1-bits in the counter.

Incrementing: if the rightmost k bits are all 1 (k ≥ 0), we flip k ones to zero and one zero to one.
- Actual cost: k + 1 flips
- ΔΦ = 1 - k (one new 1-bit, k 1-bits removed)
- Amortized cost: (k + 1) + (1 - k) = **2**

Every increment has amortized cost 2 regardless of k. Total cost for n increments: 2n = O(n). **O(1) amortized per increment.** ✓

---

### Union-Find Path Compression Amortized Analysis

This is the most famous amortized analysis in computer science (Tarjan, 1975).

**Structure**: Union-Find with path compression and union by rank.

**Claim**: m operations on n elements costs O(m · α(n)) where α is the inverse Ackermann function.

α(n) ≤ 4 for all practical n (even n = 2^{2^{65536}} gives α = 4). So this is essentially O(m) — nearly linear.

**Why the proof is hard**: The potential function tracks tree heights, rank distributions, and path lengths simultaneously. The proof requires 8+ pages of careful analysis (see CLRS Chapter 21 for the full derivation). The key insight: path compression does extra work upfront to reduce future costs, and the potential function must capture this "savings."

---

### The Amortized Analysis Decision Guide

```
Q1: Does the data structure have expensive operations that "resets" state?
    (resize, rehash, rebuild, compact)
    → Use aggregate analysis (sum total cost, divide by n)

Q2: Can I define a per-element "credit" that pays for future work?
    (each pushed element pays for its future pop)
    → Use accounting method (assign 2 credits per push-type operation)

Q3: Can I define a global "energy" of the structure that decreases with expensive ops?
    (few 1-bits in counter → low potential → cheap increment)
    → Use potential method (define Φ, compute â = c + ΔΦ)
```

---

## 5. Space Complexity and the Stack

### Recursion Depth = Space Complexity

Every recursive call adds a stack frame. If the recursion has depth d, space = O(d).

```
Merge sort:    depth = log n → space O(log n)     (stack frames only)
               BUT the merge step needs O(n) auxiliary space
               Total space: O(n)

Quicksort:     best case depth = log n → O(log n) space
               worst case depth = n (sorted array, naive pivot) → O(n) space
               This is a memory issue for production n > 10^6

DFS on graph:  depth = O(n) → O(n) stack in worst case
               → Stack overflow for n > ~10,000 on JVM (default stack ~512KB)
               → Iterative DFS with explicit stack uses heap (grows larger)

Fibonacci:     depth = n (naive) → O(n) space
               With memoization: O(n) space for memo table
               Iterative: O(1) space
```

### Call Stack vs Heap: The Space Tradeoff

```
Recursive DFS:          Iterative DFS:
  Stack frames: O(n)      Heap-allocated ArrayDeque: O(n)
  Each frame: ~50-100B    Each element: ~8B (reference)
  
  For n = 100,000:        For n = 100,000:
  Recursive: ~5-10 MB     Iterative: ~800 KB
  → Stack overflow!       → Fine

Lesson: "Stack overflow" is a space problem, not an algorithmic one.
Converting recursion to iteration trades call stack space for heap space —
same O(n), but heap can hold ~100x more before OS limits.
```

---

## 6. Common Pitfalls in Complexity Analysis

### Pitfall 1: Forgetting the Inner Loop's Dependence on Outer Loop Variable

```java
// What is the complexity of this?
for (int i = 0; i < n; i++) {
    for (int j = 0; j < i; j++) {  // ← j goes up to i, not n
        process(A[i][j]);
    }
}
```

Total iterations = 0 + 1 + 2 + ... + (n-1) = n(n-1)/2 = Θ(n²). Not Θ(n³).

### Pitfall 2: Log Base Doesn't Matter (Usually)

log₂(n) = log₁₀(n) / log₁₀(2) = Θ(log₁₀(n)). Change of base is a constant factor.

**Exception**: When the base appears in an exponent. 2ⁿ ≠ 10ⁿ. These differ by a factor of (10/2)ⁿ = 5ⁿ — not constant.

### Pitfall 3: Amortized ≠ Average Case

Amortized analysis gives a worst-case guarantee on average per operation across any sequence. Average-case assumes a probability distribution over inputs. A data structure can have O(1) amortized but O(n) average case (or vice versa) depending on the access pattern and input distribution.

### Pitfall 4: The "Early Return" That Doesn't Change Worst Case

```java
// Someone claims this is O(n log n) because of the early return:
boolean hasDuplicate(int[] A) {
    Arrays.sort(A);              // O(n log n)
    for (int i = 0; i < n-1; i++) {
        if (A[i] == A[i+1]) return true;   // early return
    }
    return false;
}
// Worst case: no duplicates → loop runs n-1 times → O(n) loop
// Total: O(n log n) + O(n) = O(n log n) — the sort dominates.
// The early return doesn't improve the asymptotic worst case.
```

### Pitfall 5: "This Is Constant Per Node" Isn't Always O(n)

```java
// Traversing a tree — is this O(n)?
void traverse(Node root) {
    if (root == null) return;
    traverse(root.left);    // ← how many nodes? depends on tree shape!
    traverse(root.right);
}
// For a balanced tree: Θ(n) nodes visited → O(n)
// For a degenerate (linked-list) tree: still Θ(n) — same answer
// The recurrence: T(n) = T(k) + T(n-k-1) + 1 → T(n) = Θ(n) by substitution
```

### Pitfall 6: O(n²) in a String Concatenation Loop

```python
result = ""
for i in range(n):
    result += words[i]   # ← creates NEW string each time in Python
```

Each `+=` is O(len(result)) = O(i). Total: 0 + 1 + 2 + ... + (n-1) = **O(n²)**, not O(n).

Fix: `"".join(words)` — builds the string once in O(n).

---

## Practice Problems

**Recurrence analysis:**
1. Solve T(n) = 4T(n/2) + n² using all three methods. Verify results match.
2. Solve T(n) = T(n-1) + n by unrolling (this is insertion sort's recurrence).
3. T(n) = 2T(n-1) + 1. Solve. What algorithm has this recurrence? (Hint: Tower of Hanoi)
4. Prove that the Master Theorem gives the same answer as the recursion tree for T(n) = 2T(n/2) + n.

**Amortized analysis:**
5. Analyze a stack that supports `push` (O(1)) and `popAll` (removes all elements, O(n)). What's the amortized cost per `push`?
6. Prove that a hash table with load factor ≤ 0.75 and doubling-on-resize has O(1) amortized insert.
7. Analyze the amortized cost of `splay tree` access using the potential method. (Research: access lemma.)

**Asymptotic notation:**
8. Prove that n! = ω(2ⁿ) using Stirling's approximation.
9. For which values of k is nᵏ = O(2ⁿ)?
10. Is log(n!) = Θ(n log n)? Prove or disprove.

---

## Summary

```
Tool                    │ Use when
────────────────────────┼──────────────────────────────────────────────
O / Ω / Θ              │ Describe worst/best/tight growth rates
Substitution method     │ You can guess the form; verify by induction
Recursion tree          │ Visualize multi-level work; sum geometric series
Master Theorem          │ T(n) = aT(n/b) + f(n); match one of 3 cases
Aggregate amortized     │ Total work / n operations is tight
Accounting amortized    │ Per-element credits fund future expensive ops
Potential amortized     │ Global "energy" function models work savings
Space analysis          │ Count stack depth (recursion) + heap allocations
```

---

## 🎯 Interview Proof Templates — Complexity Analysis

> Use these fill-in-the-blank templates during whiteboard or written interviews. State each step explicitly — interviewers assess reasoning, not just the answer.

### Template A2-1 — Master Theorem (for divide-and-conquer recurrences)

```
"I'll solve T(n) = [a]T(n/[b]) + [f(n)] using the Master Theorem.

Step 1 — Identify parameters:
  a = [number of subproblems]
  b = [factor by which problem size reduces]
  f(n) = [cost of divide + combine steps]

Step 2 — Compute critical exponent:
  p = log_b(a) = log_[b]([a]) = [value]

Step 3 — Compare f(n) to n^p:
  f(n) = [expression]  vs  n^p = n^[value]

Step 4 — Identify case and state result:
  [Case 1: f(n) = O(n^(p-ε)) → T(n) = Θ(n^p)]
  [Case 2: f(n) = Θ(n^p)    → T(n) = Θ(n^p · log n)]
  [Case 3: f(n) = Ω(n^(p+ε)) + regularity → T(n) = Θ(f(n))]

Conclusion: T(n) = [answer]."
```

**Worked example for merge sort** (T(n) = 2T(n/2) + n):
a=2, b=2, p=log₂2=1. f(n)=n=Θ(n¹)=Θ(n^p) → **Case 2** → T(n) = Θ(n log n).

---

### Template A2-2 — Amortized Analysis (potential method)

```
"I'll use the potential method to show the amortized cost of [operation] is O([result]).

Step 1 — Define potential function:
  Φ(state) = [expression — must be ≥ 0 always, and Φ(initial) = 0]

Step 2 — Amortized cost = actual cost + ΔΦ:
  Amortized(op) = actual(op) + Φ(after) − Φ(before)

Step 3 — Analyze the expensive case:
  When [expensive condition]: actual cost = [large value].
  ΔΦ = [large negative change that offsets it].
  Amortized = [large cost] + [large negative] = O([small]).

Step 4 — Analyze the cheap case:
  When [normal case]: actual cost = O(1).
  ΔΦ = [small positive]. Amortized = O(1) + [small] = O(1).

Conclusion: total work for n operations = n · O([result]) = O([result × n])."
```

**Worked example for dynamic array push** (Φ = 2×size − capacity):
- Normal push: actual=1, ΔΦ=+2. Amortized = 3 = O(1). ✓
- Resize push: actual=n+1 (copy n + insert 1), ΔΦ = 2(n+1) − 2n − n = 2−n. Amortized = (n+1) + (2−n) = 3 = O(1). ✓

---

### Template A2-3 — Space Complexity (for recursive algorithms)

```
"Space complexity = heap allocations + stack depth.

Stack depth: [algorithm] recurses [depth description].
  Maximum simultaneous stack frames = [value] (e.g., O(log n) for balanced recursion).
  Each frame uses O([variables per frame]) space.
  Total stack space = O([depth × frame size]).

Heap allocations: [algorithm] creates [description of heap objects].
  Total heap space = O([expression]).

Dominant term: [stack / heap], so space = O([result]).

Java note: default stack allows ~[N] frames before StackOverflowError.
  For n > [threshold], convert to iterative using an explicit stack on the heap."
```

---

## 📝 Exam-Style Problems (MIT 6.006 / RWTH Aachen Algorithm Theory style)

---

**Problem 1 (Master Theorem — 6 min)**: Solve each recurrence using the Master Theorem. State which case applies and why.

(a) T(n) = 4T(n/2) + n  
(b) T(n) = 4T(n/2) + n²  
(c) T(n) = 4T(n/2) + n³

<details><summary>Model Answer</summary>

For T(n) = aT(n/b) + f(n), critical exponent p = log_b(a).

**(a)** a=4, b=2, p = log₂4 = 2. f(n) = n = O(n^(2-1)) → Case 1 → **T(n) = Θ(n²)**.

**(b)** a=4, b=2, p=2. f(n) = n² = Θ(n²) = Θ(n^p) → Case 2 → **T(n) = Θ(n² log n)**.

**(c)** a=4, b=2, p=2. f(n) = n³ = Ω(n^(2+1)) → need regularity: 4f(n/2) = 4(n/2)³ = n³/2 ≤ cn³ for c=1/2 < 1. ✓ → Case 3 → **T(n) = Θ(n³)**.

**Intuition for the 3 cases**: (a) subproblem work dominates (root at bottom of tree); (b) work is equal at each level (sum is height × work per level); (c) top-level work dominates.

</details>

---

**Problem 2 (Amortized — 8 min)**: A stack supports push, pop, and multi-pop (pops up to k elements at once). Show that any sequence of n operations takes O(n) total time, so the amortized cost per operation is O(1).

<details><summary>Model Answer</summary>

**Aggregate method**: Count total stack operations over the entire sequence. Each element can be pushed at most once and popped at most once (whether by pop or multi-pop). Total pushes ≤ n (one push per push operation), total pops ≤ total pushes ≤ n. So total work = O(n), amortized cost = O(n)/n = **O(1) per operation**. ✓

**Accounting method alternative**: Assign 2 credits to each push (1 for the push itself, 1 saved for a future pop). Pop/multi-pop of each element uses the 1 saved credit. Balance never goes negative. Total credits charged = 2n → O(n) total → O(1) amortized.

**Key insight**: the expensive case (multi-pop k elements) can only happen if k elements were previously pushed. Those pushes already "paid" for the pop work.

</details>

---

**Problem 3 (Space Complexity — 5 min)**: An iterative merge sort uses an auxiliary array of size n. A recursive merge sort with call-stack depth log₂n. Compare the total space complexity of both implementations.

<details><summary>Model Answer</summary>

- **Iterative merge sort**: auxiliary array of size n + O(1) other variables = **O(n) space**.
- **Recursive merge sort**: auxiliary array of size n (for merging) + O(log n) stack frames (each frame stores lo, hi, mid = O(1) per frame) = **O(n + log n) = O(n) space**.

Both are O(n) asymptotically, but the recursive version has a real O(log n) stack overhead that matters in production: for n = 2^20 (≈ 1M elements), the recursive version uses ~20 additional stack frames. The iterative version avoids `StackOverflowError` risk on arrays larger than ~10M elements.

</details>

---

## Section Challenge -- Complexity First Principles (Algorithms)

**Problem 1 (Recurrence -- 8 min)**: Solve T(n) = 2T(n/2) + O(n) using the Master Theorem. State which case applies and why.

<details><summary>Model Answer</summary>

Master Theorem: T(n) = aT(n/b) + f(n). Here a=2, b=2, f(n)=O(n).

Compute n^{log_b a} = n^{log_2 2} = n^1 = n.

f(n) = O(n) = O(n^1). This matches n^{log_b a} exactly (within a constant).

**Case 2**: f(n) = Theta(n^{log_b a}) => T(n) = Theta(n^{log_b a} * log n) = Theta(n log n).

This is the merge sort recurrence. The O(n) merge work at each of log n levels sums to O(n log n).

**Intuition check**: At level k (0-indexed from top), there are 2^k subproblems each of size n/2^k, doing O(n/2^k) merge work each. Total work at level k = 2^k * O(n/2^k) = O(n). Summing over log n levels: O(n log n).

</details>

**Problem 2 (Lower Bound -- 6 min)**: Prove that any comparison-based sorting algorithm requires Omega(n log n) comparisons in the worst case.

<details><summary>Model Answer</summary>

**Decision tree argument**: Model a comparison-based sort as a binary decision tree. Each internal node is a comparison (a_i <= a_j?); each leaf is a sorted permutation. For n elements, there are n! possible permutations, so the tree needs >= n! leaves. A binary tree of height h has at most 2^h leaves. Therefore: 2^h >= n!, so h >= log_2(n!).

By Stirling: log_2(n!) = sum_{k=1}^{n} log_2(k) >= integral_1^n log_2(x)dx = n*log_2(n) - n/ln(2) = Omega(n log n).

Therefore any comparison-based sort makes Omega(n log n) comparisons in the worst case. Merge sort and heapsort achieve this bound.

</details>

---

## Reference Anchor

**OpenJDK -- complexity verification through TimSort and binary search**:
```java
// java.util.TimSort (Arrays.sort for objects) -- production merge sort
// Key property: O(n) on already-sorted input (detects natural runs)
//               O(n log n) worst case for random input
// MIN_MERGE = 32: runs shorter than 32 elements use binary insertion sort

// java.util.Arrays.binarySearch -- O(log n) search on sorted arrays
// Uses lo + (hi-lo)/2 mid formula (overflow-safe)
int idx = Arrays.binarySearch(sortedArr, key);
// Returns: index if found; -(insertionPoint)-1 if not found

// Why complexity matters in production:
// O(n^2) sort on 10k elements = 100M ops @ 10ns = 1 second
// O(n log n) sort on 10k elements = 130k ops @ 10ns = 0.001 seconds
// Difference is irrelevant for n=100; catastrophic for n=100,000
```

*[← A1: Correctness Proofs](A1_Correctness_Proofs.md) | [A3: Lower Bounds & NP →](A3_Lower_Bounds_And_NP.md)*


---

## Reality Check

**"O(n log n) is always better than O(n²)"** → Asymptotically yes. In practice: for n < 50, O(n²) insertion sort beats O(n log n) merge sort due to smaller constants (no merge buffer allocation, simple loop, good cache behavior). TimSort uses insertion sort for runs of < 64 elements precisely for this reason. The crossover point n₀ where an asymptotically better algorithm actually wins depends on the constants hidden in Big O. For practical n, constants and cache behavior often dominate.

**"O(1) means instant"** → O(1) means constant time — NOT fast. HashTable lookup is O(1) amortised but the constant includes: computing the hash function (which may be O(key_length)), checking equality on collision (O(key_length)), cache misses for separate chaining. A memory-resident red-black tree with O(log n) may be faster than a hash table with O(1) due to cache behavior (tree traversal is sequential in memory if the tree is small; hash table access is random). Measure, don't assume.

**"Space complexity doesn't include the input"** → By convention, space complexity refers to AUXILIARY space (additional space beyond the input). An algorithm that uses O(n) extra space has space complexity O(n), even if the input itself is O(n) (otherwise all algorithms would be O(n) space just for holding the input). This distinction matters: in-place algorithms (O(1) auxiliary space, like heapsort) vs algorithms that copy the input (O(n) auxiliary space, like merge sort). The convention varies by context — always clarify whether "space complexity" means total or auxiliary.

**"Amortised O(1) means every operation is O(1)"** → Amortised O(1) means the AVERAGE cost per operation over a sequence of operations is O(1). Individual operations can be expensive. ArrayList.add(): usually O(1), occasionally O(n) when resizing. The expensive resize costs are "amortised" over the cheap additions — total cost of n additions = O(n), so amortised cost per add = O(1). In real-time systems, amortised cost may be unacceptable: if one operation per 1000 takes 1ms (while others take microseconds), the system has a latency spike every 1000 operations. Prefer worst-case O(1) for real-time constraints.

**"The recurrence T(n) = T(n-1) + O(1) is always O(n)"** → T(n) = T(n-1) + O(1) unrolls to O(n). T(n) = T(n-1) + O(n) unrolls to O(n²). T(n) = 2T(n/2) + O(n) → O(n log n) by Master Theorem. T(n) = T(n/2) + O(n) → O(n) (geometric series: n + n/2 + n/4 + ... = 2n). T(n) = 2T(n-1) + O(1) → O(2ⁿ) (exponential). The shape of the recurrence (how many subproblems, what fraction of n, what extra work) determines the solution — always unfold the first few steps or apply the Master Theorem correctly.
