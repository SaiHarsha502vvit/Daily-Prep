# Chapter 10 — Recurrence Relations

> [< Previous: 09 Pigeonhole Principle](09_Pigeonhole_Principle.md) | [Course Index](README.md) | [Next → 11 Graph Theory Foundations](11_Graph_Theory_Foundations.md)

---

## The Problem Recurrences Solve

You're analyzing a recursive function:

```java
int mergeSort(int[] arr, int left, int right) {
    if (left >= right) return;          // base case: O(1)
    int mid = (left + right) / 2;
    mergeSort(arr, left, mid);          // recurse on left half
    mergeSort(arr, mid+1, right);       // recurse on right half
    merge(arr, left, mid, right);       // merge two halves: O(n)
}
```

"How long does this take?" You immediately know:
- It splits n into 2 halves: 2 subproblems of size n/2.
- It does O(n) work to merge.

This gives you: **T(n) = 2T(n/2) + n**

That's a **recurrence relation** — a formula that defines T(n) in terms of T at smaller inputs. To get an explicit formula (like T(n) = O(n log n)), you need to SOLVE it.

Every recursive algorithm has a recurrence. Solving recurrences is how you prove complexity bounds from first principles.

---

## Definition: Recurrence Relation

A **recurrence relation** for a sequence a₀, a₁, a₂, ... defines aₙ in terms of earlier values:

- **Base case(s):** explicit values for small n (e.g., a₀ = 1, a₁ = 1).
- **Recurrence step:** formula expressing aₙ from aₙ₋₁, aₙ₋₂, ..., a₀.

**Canonical example — Fibonacci:**
- F(0) = 0, F(1) = 1
- F(n) = F(n-1) + F(n-2) for n ≥ 2

Sequence: 0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, ...

This is simple to define but hard to evaluate without a closed-form solution or memoization.

---

## Method 1: Telescoping (Substitution / Unrolling)

**Idea:** Repeatedly substitute the recurrence into itself until you see a pattern, then sum it up.

### Example: T(n) = T(n-1) + 1, T(1) = 1

This models: "each step does 1 unit of work, reducing the problem by 1."

**Unroll:**
```
T(n) = T(n-1) + 1
     = (T(n-2) + 1) + 1  = T(n-2) + 2
     = (T(n-3) + 1) + 2  = T(n-3) + 3
     ...
     = T(n-k) + k
```

Stop when n-k = 1, i.e., k = n-1:
```
T(n) = T(1) + (n-1) = 1 + n - 1 = n
```

**T(n) = O(n)** — a linear-cost recursive algorithm.

---

### Example: T(n) = T(n-1) + n, T(1) = 1

**Unroll:**
```
T(n) = T(n-1) + n
     = T(n-2) + (n-1) + n
     = T(n-3) + (n-2) + (n-1) + n
     ...
     = T(1) + 2 + 3 + ... + n
     = 1 + (2 + 3 + ... + n)
     = 1 + (n(n+1)/2 - 1)       [sum formula from Ch04]
     = n(n+1)/2
```

**T(n) = O(n²)** — this is the worst case for quicksort (degenerate pivot).

---

### Example: Binary Search — T(n) = T(n/2) + 1, T(1) = 1

**Unroll:**
```
T(n)     = T(n/2) + 1
T(n/2)   = T(n/4) + 1
T(n/4)   = T(n/8) + 1
...
T(n/2ᵏ) = T(n/2ᵏ) + 1
```

Stop when n/2ᵏ = 1, i.e., k = log₂ n:
```
T(n) = T(1) + log₂ n = 1 + log₂ n
```

**T(n) = O(log n)** — binary search is logarithmic, confirmed.

---

## Method 2: The Master Theorem

For divide-and-conquer recurrences of the form:

**T(n) = aT(n/b) + f(n)**

where a ≥ 1 subproblems each of size n/b, plus f(n) work at each level.

Let c = log_b(a) (the "critical exponent").

| Case | Condition | Solution |
|------|-----------|----------|
| 1 (computation dominates) | f(n) = O(nᶜ⁻ᵉ) for some ε > 0 | T(n) = Θ(nᶜ) |
| 2 (work balanced) | f(n) = Θ(nᶜ logᵏ n) | T(n) = Θ(nᶜ logᵏ⁺¹ n) |
| 3 (merge dominates) | f(n) = Ω(nᶜ⁺ᵉ) and regularity | T(n) = Θ(f(n)) |

**The intuition:**
- c = log_b(a) measures "how fast the number of subproblems grows relative to how much smaller they get."
- If f(n) is small compared to nᶜ: the subproblems dominate → T = Θ(nᶜ).
- If they balance: T = Θ(nᶜ log n).
- If f(n) is large: the top-level work dominates → T = Θ(f(n)).

### Applying the Master Theorem: Merge Sort

**T(n) = 2T(n/2) + n**

a = 2, b = 2, f(n) = n.

c = log_b(a) = log₂(2) = 1.

f(n) = n = n¹ = Θ(nᶜ · log⁰ n) → Case 2 (k=0).

**T(n) = Θ(n log n)** ✓

### Applying the Master Theorem: Strassen's Algorithm

**T(n) = 7T(n/2) + O(n²)**

a = 7, b = 2, f(n) = n².

c = log₂(7) ≈ 2.807.

f(n) = n² = O(n^(2.807 - 0.807)) → Case 1 (f is smaller than nᶜ).

**T(n) = Θ(n^log₂7) ≈ Θ(n^2.807)** — why Strassen beats O(n³) naive matrix multiply.

### When Master Theorem Doesn't Apply

T(n) = 2T(n/2) + n/log n: f(n) = n/log n = o(n) but nᶜ = n. f(n) is between Cases 1 and 2 — Master Theorem doesn't apply in its basic form.

T(n) = T(n-1) + n: this isn't a/T(n/b) form. Use telescoping instead.

---

## Method 3: Characteristic Equation (Linear Homogeneous Recurrences)

For recurrences of the form:

**aₙ = c₁aₙ₋₁ + c₂aₙ₋₂ + ... + cₖaₙ₋ₖ** (no "+f(n)" term → homogeneous)

**Step 1:** Guess aₙ = rⁿ (exponential solution).

**Step 2:** Substitute to get the **characteristic equation:**

rⁿ = c₁rⁿ⁻¹ + c₂rⁿ⁻² + ... + cₖrⁿ⁻ᵏ

Divide by rⁿ⁻ᵏ:

rᵏ = c₁rᵏ⁻¹ + c₂rᵏ⁻² + ... + cₖ (the characteristic polynomial)

**Step 3:** Find roots r₁, r₂, ..., rₖ.

**Step 4:** General solution: aₙ = A₁r₁ⁿ + A₂r₂ⁿ + ... + Aₖrₖⁿ

**Step 5:** Use base cases to solve for A₁, ..., Aₖ.

### Example: Fibonacci Closed Form

**F(n) = F(n-1) + F(n-2)**, F(0) = 0, F(1) = 1.

Characteristic equation: r² = r + 1 → r² - r - 1 = 0.

Roots: r = (1 ± √5) / 2.

- φ = (1 + √5) / 2 ≈ 1.618... (golden ratio)
- ψ = (1 - √5) / 2 ≈ -0.618...

General solution: F(n) = Aφⁿ + Bψⁿ

Apply base cases:
- F(0) = 0: A + B = 0 → B = -A
- F(1) = 1: Aφ + Bψ = 1 → A(φ - ψ) = 1 → A = 1/√5, B = -1/√5

**Binet's formula:** F(n) = (φⁿ - ψⁿ) / √5

```
F(10) = (φ¹⁰ - ψ¹⁰) / √5 = (122.99... - (-0.0081...)) / 2.236 ≈ 55 ✓
```

**Why this matters:** Fibonacci GROWS like φⁿ ≈ 1.618ⁿ. The naive recursive Fibonacci function is O(φⁿ) — exponential. This is why memoization (computing each Fibonacci number once) drops to O(n) — you avoid recomputing the exponential tree.

---

## Recurrences and Dynamic Programming

A recurrence is the mathematical definition of a problem with overlapping subproblems. **Dynamic programming** is just solving a recurrence efficiently:

| Approach | What it does | Cost |
|----------|-------------|------|
| Naive recursion | Solves the recurrence by re-solving subproblems | O(branches^depth) = usually exponential |
| Memoization (top-down DP) | Caches results — each subproblem solved once | O(unique subproblems × work per subproblem) |
| Tabulation (bottom-up DP) | Fills a table from base cases up, no recursion overhead | Same as memoization, usually faster constant |

**Fibonacci comparison:**

```java
// Naive recursion: T(n) = 2T(n-1) + O(1) → O(2ⁿ) — catastrophic
int fib(int n) {
    if (n <= 1) return n;
    return fib(n-1) + fib(n-2);   // recomputes fib(n-2) TWICE: in fib(n-1) and directly
}

// Bottom-up DP: T(n) = O(n) — linear
int fibDP(int n) {
    if (n <= 1) return n;
    int prev = 0, curr = 1;
    for (int i = 2; i <= n; i++) {
        int next = prev + curr;
        prev = curr;
        curr = next;         // recurrence executed left-to-right, O(1) per step
    }
    return curr;
}
```

The recurrence F(n) = F(n-1) + F(n-2) is the SAME for both. The cost difference comes from how you traverse the recurrence tree — naive revisits nodes, DP visits each once.

---

## Reading Algorithms by Their Recurrences

Every algorithm's recurrence tells you its structure at a glance:

| Recurrence | Algorithm pattern | Solution |
|-----------|------------------|----------|
| T(n) = T(n-1) + O(1) | Linear scan (each step costs O(1)) | O(n) |
| T(n) = T(n-1) + O(n) | Selection/insertion sort (each step scans) | O(n²) |
| T(n) = T(n/2) + O(1) | Binary search (halve, constant check) | O(log n) |
| T(n) = T(n/2) + O(n) | Quickselect average (halve, linear partition) | O(n) |
| T(n) = 2T(n/2) + O(n) | Merge sort (split, linear merge) | O(n log n) |
| T(n) = 2T(n/2) + O(1) | BST height in perfectly balanced tree | O(log n) |
| T(n) = 7T(n/2) + O(n²) | Strassen matrix multiply | O(n^2.807) |
| T(n) = T(n-1) + T(n-2) + O(1) | Naive Fibonacci (exponential branching) | O(φⁿ) |

When you see a recursive algorithm, immediately write its recurrence. The recurrence tells you whether it scales.

---

## Section Challenge

> ### Analyze These Four Recursive Functions
>
> Write the recurrence and solve it for each function. State whether the Master Theorem applies or you need telescoping.
>
> **Function A:**
> ```java
> int f(int n) {
>     if (n <= 1) return 1;
>     return f(n/3) + f(n/3) + f(n/3) + n;
> }
> ```
>
> **Function B:**
> ```java
> int g(int n) {
>     if (n <= 0) return 0;
>     int total = 0;
>     for (int i = 0; i < n; i++) total += i;  // O(n) work
>     return g(n-1) + total;
> }
> ```
>
> **Function C:**
> ```java
> int h(int n) {
>     if (n <= 1) return 1;
>     return h(n/2) + h(n/4) + n;
> }
> ```
>
> **Function D (Bonus):**  
> T(n) = 4T(n/2) + n².  
> Compare to T(n) = 4T(n/2) + n³. What changes?

<details>
<summary>Full derivation + answers</summary>

```
FUNCTION A: f(n) = 3 * f(n/3) + n
T(n) = 3T(n/3) + n

Master Theorem: a=3, b=3, f(n)=n.
c = log_b(a) = log₃(3) = 1.
f(n) = n = Θ(n¹) = Θ(nᶜ log⁰ n) → Case 2 (k=0).

T(n) = Θ(n log n)

This is the same complexity as merge sort, despite using base-3 division.
The number of subproblems (3) perfectly balances the shrinkage factor (÷3).

──────────────────────────────────────────────────────────

FUNCTION B: g(n) = g(n-1) + O(n)
T(n) = T(n-1) + n

This is NOT divide-and-conquer (no n/b) → Master Theorem does NOT apply.
Use telescoping:

T(n) = T(n-1) + n
     = T(n-2) + (n-1) + n
     = T(n-3) + (n-2) + (n-1) + n
     ...
     = T(0) + 1 + 2 + ... + n
     = 0 + n(n+1)/2

T(n) = Θ(n²)

This is selection sort's inner loop pattern: linear work per outer iteration,
n outer iterations → O(n²) total.

──────────────────────────────────────────────────────────

FUNCTION C: h(n) = h(n/2) + h(n/4) + n
T(n) = T(n/2) + T(n/4) + n

This is NOT standard Master Theorem form (two different subproblem sizes).
We need a different approach.

GUESS: T(n) = O(n)?
  If T(k) ≤ ck for all k < n, then:
  T(n) ≤ c(n/2) + c(n/4) + n = cn(1/2 + 1/4) + n = 3cn/4 + n

  For this to be ≤ cn: 3cn/4 + n ≤ cn → n ≤ cn/4 → c ≥ 4.
  So T(n) ≤ 4n → T(n) = O(n).

GUESS: T(n) = Ω(n)?
  T(n) ≥ T(n/2) + n ≥ n (obviously, since T is non-negative).
  So T(n) = Ω(n).

CONCLUSION: T(n) = Θ(n)

Intuition: the work telescopes to n + 3n/4 + 9n/16 + ... = n × 1/(1 - 3/4) = 4n.
The geometric series converges → T(n) = O(n) despite the branching.
(The shrinkage factor 3/4 < 1 keeps it linear.)

──────────────────────────────────────────────────────────

FUNCTION D BONUS:

T(n) = 4T(n/2) + n²:
  a=4, b=2, f(n)=n². c = log₂(4) = 2.
  f(n) = n² = Θ(nᶜ log⁰ n) → Case 2 (k=0).
  T(n) = Θ(n² log n)

T(n) = 4T(n/2) + n³:
  a=4, b=2, f(n)=n³. c = log₂(4) = 2.
  f(n) = n³ = Ω(n^(2+1)) → Case 3 (f(n) dominates).
  Need regularity: 4(n/2)³ = 4n³/8 = n³/2 ≤ cn³ for c = 1/2 < 1. ✓
  T(n) = Θ(n³)

THE KEY DIFFERENCE:
  When f(n) = n² (matches nᶜ): subproblems and merge work balance → extra log factor.
  When f(n) = n³ (dominates nᶜ): top-level merge work completely swamps subproblems.
  The Case 2 vs Case 3 split is exactly this balance point.

PRACTICAL TAKE:
  Naive matrix multiply: T(n) = 8T(n/2) + O(n²) → c = log₂8 = 3, f(n) = n² < n³ → Case 1 → Θ(n³).
  Strassen: T(n) = 7T(n/2) + O(n²) → c = log₂7 ≈ 2.81, f(n) = n² < n^2.81 → Case 1 → Θ(n^2.81).
  The key: using 7 recursive calls instead of 8 CHANGES the critical exponent c,
  and since f(n) = n² < n^c in both cases, the number of recursive calls alone determines T.
```

</details>

---

## Common Mistakes

**Mistake 1: Applying Master Theorem to non-divide-and-conquer recurrences**
- T(n) = T(n-1) + f(n) is NOT in Master Theorem form. Use telescoping.
- Master Theorem requires T(n) = aT(n/b) + f(n) — subproblem sizes must be n/b.

**Mistake 2: Getting the critical exponent wrong**
- c = log_b(a), NOT log_a(b). With a=2, b=4: c = log₄(2) = 0.5, not log₂(4) = 2.

**Mistake 3: Forgetting the base case constraint in telescoping**
- You must stop telescoping at a known base case. If T(1) = 0 and T(n) = T(n-1) + n, the sum starts at 2 (not 1) if the problem reduces to T(1).

**Mistake 4: Treating the Master Theorem case boundaries incorrectly**
- Case 1 needs f(n) = O(n^(c-ε)) for ε > 0. f(n) = n^c / log n (polynomially equal but log-smaller) falls in a gap — neither Case 1 nor 2 applies cleanly.
- When in doubt, use the Akra-Bazzi method (generalization) or induction directly.

**Mistake 5: Confusing the recurrence with the implementation**
- The recurrence describes WHAT the algorithm does, not HOW it's implemented. Two algorithms can share a recurrence (merge sort and a tree build both satisfy T(n) = 2T(n/2) + O(n)) but have different constants and behaviors in practice.

---

## Connections

- **Chapter 04 — Induction:** Solving T(n) = T(n-1) + n by telescoping produces the sum 1+2+...+n = n(n+1)/2, which we proved by induction in Chapter 04. Telescoping and induction are the same reasoning in different notation.
- **Chapter 09 — Pigeonhole:** The Fibonacci recurrence grows as φⁿ — exponential. Pigeonhole shows that evaluating it naively visits 2ⁿ nodes, most redundantly. DP fixes this by eliminating the redundancy.
- `03_Algorithms/A2_Complexity_FirstPrinciples.md` — The Master Theorem appears in full generality there, applied to sorting and selection algorithms. Chapter 10 is the derivation foundation; that chapter is the application.
- `03_Algorithms/04a_Dynamic_Programming.md` — Every DP problem is a recurrence. The DP table is just the memoization of the recurrence. Understanding recurrences makes DP derivation mechanical: write the recurrence, identify overlapping subproblems, fill the table.
- `02_Data_Structures/` — BST height recurrence: H(n) = H(k) + H(n-k-1) + 1 where k is left subtree size. For balanced BST: H(n) = 2H(n/2) + 1 → O(log n). This is why balanced BSTs have logarithmic height.

---

> [< Previous: 09 Pigeonhole Principle](09_Pigeonhole_Principle.md) | [Course Index](README.md) | [Next → 11 Graph Theory Foundations](11_Graph_Theory_Foundations.md)
