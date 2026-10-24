# A4. Randomized Algorithms

**Navigation**: [← A3: Lower Bounds & NP](A3_Lower_Bounds_And_NP.md) | [📚 Index](00_INDEX.md) | [Sorting Fundamentals →](02a_Sorting_Fundamentals.md)

> **MIT 6.046J L9–L12 / KTH DD2352 / RWTH Aachen Randomized Algorithms foundation**
>
> "Randomization is the most powerful tool in algorithm design that most engineers have never formally studied. It is not luck — it is controlled probability used to defeat adversarial inputs and break worst-case barriers."

---

## 🔗 Bridge — Where This Chapter Fits

| Dimension | This chapter |
| --- | --- |
| **Builds on** | [A2 Complexity](A2_Complexity_FirstPrinciples.md), basic probability |
| **You will learn** | Las Vegas vs Monte Carlo, indicator random variables, expected running time, universal hashing, randomized quicksort, Bloom filters |
| **Leads to** | [Approximation](25_Online_Approximation_And_Linear_Programming.md), [Probabilistic DS](07d_Probabilistic_DS_Deep.md) |
| **Abstraction level** | L7: using randomness as a design tool |

> [!NOTE]
> The full gap-free reading order and dependency graph are in the [Learning Path](00_LEARNING_PATH.md).

---

## 💬 Explain It Like a Study Partner — Randomized Algorithms

### 1. The bottom line

Randomness lets an algorithm be simple and fast on average while no single bad input can reliably hurt it.

### 2. The textbook core

- **Las Vegas:** always correct, random running time. **Monte Carlo:** fast, may be wrong with bounded probability.
- **Linearity of expectation** (with indicator variables) computes expected costs without independence.
- Randomized quicksort has expected O(n log n) for every input.
- Amplify Monte Carlo success by repeating independent runs.

### 3. The real-world analogy

Choosing a **random pivot** is like shuffling a deck before dealing: no particular order can consistently ruin the game.

### 4. Walkthrough

1. Randomized quicksort on a sorted array.
2. A random pivot splits the array roughly evenly in expectation.
3. Expected depth is O(log n).
4. No fixed input triggers the quadratic worst case.

> [!NOTE]
> **Quick check:** How do you reduce a Monte Carlo error from 1/4 to 1/16? *Run it twice independently and take the majority/OR as appropriate.*

---


## Table of Contents

1. [Las Vegas vs Monte Carlo — The Fundamental Distinction](#1-las-vegas-vs-monte-carlo--the-fundamental-distinction)
2. [Expectation and Indicator Random Variables](#2-expectation-and-indicator-random-variables)
3. [Randomized Quicksort — Expected O(n log n) Proof](#3-randomized-quicksort--expected-on-log-n-proof)
4. [Universal Hashing — Making O(1) a Guarantee](#4-universal-hashing--making-o1-a-guarantee)
5. [Skip Lists — O(log n) Expected by Probability](#5-skip-lists--olog-n-expected-by-probability)
6. [Bloom Filters — False Positives, Zero False Negatives](#6-bloom-filters--false-positives-zero-false-negatives)
7. [Randomization Against Adversarial Inputs](#7-randomization-against-adversarial-inputs)

---

## 1. Las Vegas vs Monte Carlo — The Fundamental Distinction

### Las Vegas Algorithms

A **Las Vegas** algorithm always produces the **correct answer** — only its runtime is random.

```
Property:  Pr[output is correct] = 1
Variable:  Expected running time is the random quantity

Examples:
  - Randomized quicksort (always sorts correctly, expected O(n log n))
  - Randomized selection / QuickSelect (always finds kth element)
  - Randomized primality testing with witness sets
```

### Monte Carlo Algorithms

A **Monte Carlo** algorithm runs in **bounded deterministic time** — but may produce an incorrect answer with some probability.

```
Property:  Running time is deterministic (or bounded)
Variable:  Pr[output is wrong] = some small ε > 0

Examples:
  - Miller-Rabin primality test (wrong with probability ≤ 4^(-k) after k rounds)
  - Karger's min-cut algorithm (wrong with probability ≤ 1/n)
  - Randomized approximate counting (correct to within (1±ε) factor)
```

### Converting Between Types

```
Monte Carlo → Las Vegas:  Run MC many times; verify the answer deterministically.
                          If verification is fast and failure probability is low, expected time = O(T_MC)

Las Vegas → Monte Carlo:  Run LV for T time; if not done, output best current guess.
                          Fail probability ≤ Pr[LV takes > T time] (by Markov)
```

### Markov's Inequality (The Fundamental Tool)

For any non-negative random variable X:

**Pr[X ≥ t] ≤ E[X] / t**

*Interpretation*: If E[X] = 10, then Pr[X ≥ 100] ≤ 10/100 = 1/10. The algorithm can't be slow much more often than its average.

*Use*: Convert Las Vegas expected time → Monte Carlo bounded time. If expected time is T, then Pr[algorithm takes > 100T] ≤ 1/100. Run for 100T; fail with probability ≤ 1/100.

---

## 2. Expectation and Indicator Random Variables

### Linearity of Expectation

The most used tool in randomized algorithm analysis:

**E[X + Y] = E[X] + E[Y]**

This holds even when X and Y are **correlated** or **dependent**. This is what makes indicator random variable analysis so powerful — you don't need to compute joint distributions.

### Indicator Random Variables

An **indicator random variable** I_A for event A is:

```
I_A = 1  if event A occurs
I_A = 0  otherwise

Key property:  E[I_A] = Pr[A]
```

**Why this is useful**: Instead of computing the expectation of a complex quantity X directly, define X = Σ I_{A_i} (sum of indicators for simpler events), then use linearity:

**E[X] = Σ E[I_{A_i}] = Σ Pr[A_i]**

### Example: Expected Number of Inversions After Random Shuffle

**Problem**: Randomly shuffle an array A[1..n]. How many inversions does the shuffled array have in expectation? (Inversion = pair i < j with A[i] > A[j].)

Define I_{ij} = indicator that (i, j) is an inversion in the shuffled array, for each pair i < j.

Each pair (i, j) is equally likely to be ordered either way: Pr[inversion] = 1/2.

```
E[inversions] = E[ Σᵢ<ⱼ I_{ij} ]
              = Σᵢ<ⱼ E[I_{ij}]         (linearity of expectation)
              = Σᵢ<ⱼ Pr[(i,j) inverted]
              = Σᵢ<ⱼ (1/2)
              = (1/2) · C(n,2)
              = n(n-1)/4
```

A random permutation has **n(n-1)/4 ≈ n²/4** expected inversions. Any sorting algorithm that fixes one inversion per operation (e.g., bubble sort) needs expected Θ(n²) steps on a random input.

---

## 3. Randomized Quicksort — Expected O(n log n) Proof

### The Algorithm

```java
void quicksort(int[] A, int lo, int hi) {
    if (lo >= hi) return;
    int pivot = A[lo + random(hi - lo + 1)]; // pick pivot UNIFORMLY AT RANDOM
    int p = partition(A, lo, hi, pivot);
    quicksort(A, lo, p - 1);
    quicksort(A, p + 1, hi);
}
```

### Why Randomization Helps

Deterministic quicksort (always pick first/last element) runs in O(n²) on sorted input — an adversary can always construct a worst case. By picking the pivot uniformly at random, **no adversary can create a consistently bad input**.

### The Expected O(n log n) Proof

**Key insight**: Analyze the total number of comparisons, not the recursion structure.

Let A[1] < A[2] < ... < A[n] be the elements in sorted order.

Define indicator: **Xᵢⱼ = 1 if element A[i] is ever compared to A[j]** during the algorithm (where i < j).

**Total comparisons** = Σᵢ<ⱼ Xᵢⱼ

**E[total comparisons] = Σᵢ<ⱼ Pr[Xᵢⱼ = 1]** (linearity of expectation)

**Computing Pr[Xᵢⱼ = 1]**:

Two elements A[i] and A[j] are compared if and only if one of them is chosen as the pivot BEFORE any element strictly between them (A[i+1], ..., A[j-1]) is chosen as a pivot.

Consider the set S = {A[i], A[i+1], ..., A[j]} — (j - i + 1) elements.

- If A[i] or A[j] is chosen first from S as a pivot: they are compared.
- If any A[k] (i < k < j) is chosen first: A[i] and A[j] go to different subproblems and are never compared.

Since the pivot is chosen uniformly at random, Pr[A[i] or A[j] chosen first from S] = **2 / (j - i + 1)**.

**Expected total comparisons**:

```
E[comparisons] = Σᵢ<ⱼ 2/(j - i + 1)
               = Σᵢ<ⱼ 2/(j - i + 1)

Let d = j - i (the distance between elements):

               = Σᵢ₌₁ⁿ Σⱼ₌ᵢ₊₁ⁿ 2/(j-i+1)
               = Σᵢ₌₁ⁿ Σ_{d=1}^{n-i} 2/(d+1)
               ≤ Σᵢ₌₁ⁿ Σ_{d=1}^{n} 2/d
               = n · 2 · Σ_{d=1}^{n} 1/d
               = 2n · H(n)             (H(n) = harmonic number = Θ(log n))
               = O(n log n)
```

**Randomized quicksort makes O(n log n) expected comparisons.** ✓

### Why This is a Tight Bound

The same calculation gives Ω(n log n) (the sum is exactly 2n·H(n) to leading term). So **randomized quicksort is Θ(n log n) in expectation**, matching the comparison sort lower bound.

---

### Quicksort vs Merge Sort in Practice

Both are Θ(n log n). Why does quicksort win empirically?

```
Merge sort:                       Quicksort:
  O(n) auxiliary space needed       O(log n) stack space (expected)
  Non-contiguous memory access      In-place partitioning (cache-friendly)
  Predictable O(n log n) always     O(n²) worst case (rare with randomization)
  Stable (preserves equal order)    Unstable (equal elements may reorder)

Cache behavior (dominant in practice):
  Merge sort's merge step accesses two non-contiguous arrays alternately.
  Quicksort's partition sweeps left-to-right then right-to-left — both cache-friendly.
  On modern CPUs: quicksort is ~2x faster despite same asymptotic complexity.

Java's Arrays.sort():
  Primitive arrays → dual-pivot quicksort (Yaroslavskiy, 2009)
  Object arrays → Timsort (stable, handles nearly-sorted inputs optimally)
```

---

## 4. Universal Hashing — Making O(1) a Guarantee

### The Problem with Fixed Hash Functions

A fixed hash function h allows an adversary to construct n keys that all hash to the same bucket: O(n) per lookup. Even with "good" hash functions like MD5, an adversary who knows h can always find collisions.

### Universal Hash Families

A family H of hash functions h: U → {0, ..., m-1} is **universal** if:

**For any two distinct keys x ≠ y: Pr_{h∈H}[h(x) = h(y)] ≤ 1/m**

where the probability is over a uniformly random choice of h from H.

### Construction: Matrix Hash Family (MIT 6.006)

Let keys be b-bit integers (U = {0,1}ᵇ), table size m = 2^r.

Choose a random b×r binary matrix A. Define h_A(x) = (A·x mod 2).

This maps b-bit key x to an r-bit hash (table index). Proof of universality: for any x ≠ y, x and y differ in some bit position k. The k-th row of A is uniform and independent, ensuring h_A(x) ≠ h_A(y) with probability exactly 1/m. ✓

### Consequence: O(1) Expected Lookup

With a universal hash family and table size m = n (n keys):

**Expected chain length at any position** = E[number of keys in same bucket]

= Σ_{y ≠ x} Pr[h(y) = h(x)] ≤ (n-1)/m ≤ 1

So any lookup takes O(1) expected time **against any adversary** — the randomness is in the choice of hash function, not the input.

**No adversary can make hashing slow** if h is chosen randomly from a universal family.

---

## 5. Skip Lists — O(log n) Expected by Probability

### Structure

A skip list is a probabilistic data structure that provides O(log n) expected time for search, insert, and delete — without the rebalancing complexity of AVL or red-black trees.

```
Level 3:  1 ─────────────────────────────── 9
Level 2:  1 ──────── 4 ──────── 7 ───────── 9
Level 1:  1 ── 2 ── 4 ── 5 ── 7 ── 8 ── 9
Level 0:  1 ─ 2 ─ 3 ─ 4 ─ 5 ─ 6 ─ 7 ─ 8 ─ 9  (base level, all elements)
```

Each element is promoted to the next level independently with probability p = 1/2.

### Expected Height Analysis

The expected height of a skip list with n elements:

Pr[element promoted to level k] = (1/2)ᵏ

Expected number of elements at level k = n · (1/2)ᵏ

Level k has 0 elements in expectation when n · (1/2)ᵏ < 1, i.e., k > log₂(n).

Expected height = **O(log n)**. ✓

### Expected Search Time

**Backward analysis** (a beautiful randomized analysis technique):

Trace the search path **backwards** from the found element. At each step, we either:
- Go **up** one level (probability 1/2 if we're not at the top)
- Go **left** one element (probability 1/2)

This is a random walk. Expected steps to reach level 0 starting at level h = expected steps in a random walk that goes right with p=1/2 and up with p=1/2.

By analysis of the random walk: expected steps = **O(log n)**. ✓

---

## 6. Bloom Filters — False Positives, Zero False Negatives

### Structure

A Bloom filter answers "is element x in set S?" with:
- **No false negatives**: if x ∈ S, definitely returns YES
- **False positives allowed**: if x ∉ S, returns YES with probability ≤ ε

```
Array of m bits, all initially 0.
k independent hash functions h₁, h₂, ..., hₖ, each mapping to {0, ..., m-1}.

Insert(x):  set bits h₁(x), h₂(x), ..., hₖ(x) to 1

Query(x):   return (bits h₁(x) AND h₂(x) AND ... AND hₖ(x) are all 1)
            YES if all k bits are 1; NO if any bit is 0
```

### False Positive Probability Analysis

After inserting n elements:

Pr[specific bit is still 0] = (1 - 1/m)^{kn} ≈ e^{-kn/m}

Pr[false positive for x ∉ S] = Pr[all k bits of x are 1]
                               ≈ (1 - e^{-kn/m})^k

**Optimal k** (minimizes false positive rate): k = (m/n) · ln(2)

With optimal k and m = n · log₂(e) · log₂(1/ε) bits:

**False positive rate = ε**

### Space Efficiency

Bloom filter for n elements, false positive rate ε: uses m ≈ -n · ln(ε) / (ln 2)² bits.

Compared to storing n elements directly (≈ n · 64 bits for 64-bit hashes):

For ε = 1%: m ≈ n · 9.6 bits per element (vs 64 bits)
For ε = 0.1%: m ≈ n · 14.4 bits per element

**Bloom filter uses ~5–10× less space** while allowing queries with controllable false positive rate.

### Where Bloom Filters Are Used in Production

| System | Use |
|--------|-----|
| Cassandra / HBase | Skip disk lookups for absent keys (check bloom filter first) |
| Chrome Safe Browsing | Check if URL is in a ~1M malicious URL set (in browser, ~8MB) |
| PostgreSQL / SQLite | Optimize joins (reject non-matching rows without full comparison) |
| Akamai CDN | Filter "one-hit wonders" from cache (don't cache items seen only once) |
| Bitcoin | SPV (Simplified Payment Verification) nodes filter transactions |

---

## 7. Randomization Against Adversarial Inputs

### The Core Insight

A deterministic algorithm A on input x always takes the same time. An adversary who knows A can always find the worst-case input.

A randomized algorithm A on input x takes time that depends on random coin flips internal to A. Even if the adversary knows the algorithm, they can't predict the coin flips — so they can't reliably construct worst-case inputs.

```
Deterministic quicksort + adversary with sorted array = O(n²) every time
Randomized quicksort  + adversary with sorted array = O(n log n) expected
(adversary can't make pivot choices go wrong without knowing random seed)
```

### The Yao Minimax Principle

For any randomized algorithm A and any adversary distribution over inputs:

**Best expected time of det. algorithm ≥ Best expected time of randomized algorithm**

More precisely: the expected time of the best randomized algorithm (against the worst-case input) equals the expected time of the best deterministic algorithm (against the best-distribution input).

*Use*: To prove a lower bound on randomized algorithms, design a distribution over inputs that is hard for all deterministic algorithms.

### Practical Applications

| Scenario | Deterministic risk | Randomized solution |
|----------|-------------------|---------------------|
| Sorting user data | Adversary submits sorted arrays | Randomized quicksort |
| Hash table in web server | Adversary sends keys with same hash (HashDoS) | Universal hashing |
| Partitioning problem (graph color) | Bad partition structure | Randomized graph coloring |
| Game tree search (chess engine) | Opponent exploits deterministic play | Add randomness to escape known bad lines |

### HashDoS — A Real-World Attack

In 2011, researchers demonstrated that PHP, Python, Ruby, Java (before 7u6), and ASP.NET all used non-randomized hash functions. An attacker could craft HTTP POST parameters with keys that all hash to the same bucket in the server's hash map. Parsing 100,000 such keys took minutes instead of milliseconds — effectively a single-request DoS attack.

Fix: **Randomize the hash seed per process startup.** Python 3.3+, Java 7u6+, Ruby 1.9+ all use random hash seeds by default. This is universal hashing in practice — the adversary can't know the seed, so they can't target specific buckets.

---

## Practice Problems

**Las Vegas vs Monte Carlo:**
1. QuickSelect finds the kth smallest element. Is it Las Vegas or Monte Carlo? What is its expected time?
2. The Karger-Stein algorithm finds minimum cuts with probability ≥ 1/n². How many times must you run it to get a correct answer with probability ≥ 1 - 1/n? What's the total expected time?

**Indicator random variables:**
3. A box has n cards labeled 1..n, drawn uniformly at random without replacement. What's the expected number of "records" (card k is a record if it's larger than all previous cards)? (Hint: card at position i is a record with probability 1/i.)
4. Expected number of fixed points in a random permutation of n elements? (Fixed point: position i where A[i] = i.)

**Randomized quicksort:**
5. Prove that randomized quicksort makes O(n log n) expected swaps (not just comparisons). (Hint: each comparison leads to at most one swap in Lomuto partition.)
6. What's the expected number of times the pivot is in the "best quartile" (between n/4 and 3n/4 of sorted order) in n recursive calls? Show this gives O(n log n) directly.

**Hashing:**
7. Prove that the family h_{a,b}(x) = ((ax + b) mod p) mod m for prime p and random a ∈ {1..p-1}, b ∈ {0..p-1} is universal.
8. How would you extend a Bloom filter to support deletion? What's the trade-off?

---

## Summary

```
Concept                        │ Key Fact
───────────────────────────────┼──────────────────────────────────────────────
Las Vegas                      │ Always correct, random runtime
Monte Carlo                    │ Always fast, sometimes wrong (probability ε)
Markov's inequality            │ Pr[X ≥ t] ≤ E[X]/t — LV → MC conversion
Linearity of expectation       │ E[X+Y] = E[X]+E[Y], even if dependent
Indicator random variables     │ E[Σ Iᵢ] = Σ Pr[Aᵢ] — decompose complex expectations
Randomized quicksort           │ O(n log n) expected comparisons, provably
Proof key: Pr[i,j compared]    │ 2/(j-i+1) — both elegant and exact
Universal hashing              │ Pr[h(x)=h(y)] ≤ 1/m for random h from family H
Skip list expected height      │ O(log n) — n·(1/2)ᵏ < 1 when k > log n
Bloom filter false positive    │ ≈ (1 - e^{-kn/m})^k, minimized by k=(m/n)ln2
Randomization vs adversary     │ Enemy can't predict random choices → no worst case
Yao minimax                    │ Best rand algo = best det algo on best distribution
```

---

## 🎯 Interview Proof Templates — Randomized Algorithms

> Use these templates for expected-value proofs in algorithm design interviews.

### Template A4-1 — Expected Value via Indicator Random Variables

```
"I'll compute the expected [quantity] using indicator random variables.

Step 1 — Decompose into indicator variables:
  Let Xᵢⱼ = 1 if [event Eᵢⱼ occurs], 0 otherwise.
  Total [quantity] X = Σᵢ Σⱼ Xᵢⱼ.

Step 2 — Apply linearity of expectation:
  E[X] = Σᵢ Σⱼ E[Xᵢⱼ] = Σᵢ Σⱼ Pr[Eᵢⱼ].
  (Linearity holds even if Xᵢⱼ are not independent.)

Step 3 — Compute each probability:
  Pr[Eᵢⱼ] = [compute from the problem structure].

Step 4 — Sum:
  E[X] = Σᵢ Σⱼ [Pr] = [closed-form or asymptotic result].

Conclusion: expected [quantity] = [result]."
```

**Worked example — randomized quicksort comparisons**:
Xᵢⱼ = 1 if elements i and j (in sorted order) are ever compared. Pr[Xᵢⱼ = 1] = 2/(j−i+1). E[comparisons] = Σᵢ<ⱼ 2/(j−i+1) = O(n log n).

---

### Template A4-2 — Las Vegas to Monte Carlo Conversion (Markov)

```
"I have a Las Vegas algorithm A with expected runtime E[T] = O(f(n)).
I'll show it can be converted to a Monte Carlo algorithm that runs in O(c·f(n)) and
fails with probability ≤ 1/c.

By Markov's inequality: Pr[T > c·E[T]] ≤ 1/c.

So run A for c·E[T] time. If it hasn't finished, declare failure.
Runtime = O(c·f(n)) deterministically.
Failure probability ≤ 1/c.

For constant failure probability ε: set c = 1/ε → O(f(n)/ε) time, probability ε of failure.
For polynomially-small failure probability: run k independent times, take first success.
Pr[all k fail] ≤ (1/c)^k — negligible for k = O(log n)."
```

---

### Template A4-3 — Randomized vs Adversary Argument

```
"I'll argue that randomization defeats the adversary for [algorithm].

Without randomization: the adversary can construct an input I_worst such that
the deterministic algorithm always takes Ω([bad complexity]) time.
Proof: [describe the adversarial input construction].

With randomization: the algorithm's random choices are independent of the input.
The adversary must fix the input BEFORE the algorithm makes its random choices.
For any fixed input I:
  E[runtime on I] = O([good complexity]).
Therefore the expected runtime is O([good complexity]) for ALL inputs —
the adversary cannot exploit any specific input distribution.

Conclusion: randomization reduces worst-case to expected [good complexity]."
```

## 📝 Exam-Style Problems (MIT 6.046J L9–L12 / RWTH Aachen style)

---

**Problem 1 (Expected value — 8 min)**: Randomized quicksort picks a pivot uniformly at random. Prove the expected number of comparisons is O(n log n).

<details><summary>Model Answer</summary>

**Indicator random variable**: Let X_{ij} = 1 if elements i and j (in sorted order) are compared, 0 otherwise. Two elements i < j are compared if and only if one of them is chosen as pivot before any other element in {i, i+1, ..., j} is chosen. (If any element between them is chosen first, they end up in different partitions and are never compared.)

**Probability**: Pr[X_{ij} = 1] = 2 / (j - i + 1). (There are j-i+1 elements in range; we need i or j to be the first pivot chosen.)

**Expected comparisons**: E[total] = Σ_{i<j} Pr[X_{ij}] = Σ_{i<j} 2/(j-i+1).

Let d = j-i (gap). For each gap d from 1 to n-1, there are (n-d) pairs:
= Σ_{d=1}^{n-1} (n-d) · 2/(d+1) ≤ Σ_{d=1}^{n-1} 2n/(d+1) ≤ 2n · Σ_{k=2}^{n} 1/k = 2n · (H_n - 1) = **O(n log n)**. ✓

</details>

---

**Problem 2 (Universal hashing — 6 min)**: Define a universal hash family. Show that for any two distinct keys x ≠ y, universal hashing guarantees Pr[collision] ≤ 1/m where m is the table size.

<details><summary>Model Answer</summary>

**Definition**: A family H of functions h: U → {0,...,m-1} is **universal** if for any distinct x, y ∈ U:

Pr_{h ∈ H}[h(x) = h(y)] ≤ 1/m

where the probability is over a uniformly random choice of h from H.

**Construction**: Fix prime p > |U|. For a, b ∈ {0,...,p-1} with a≠0, define h_{a,b}(x) = ((ax + b) mod p) mod m. The family {h_{a,b}} is universal.

**Why the guarantee matters**: If we hash n keys into a table of size m=n using a random h from H, the expected number of collisions for any key x is at most (n-1)/m ≤ 1. Expected lookup time = O(1). This holds for ANY set of keys (no bad-input pathology, unlike non-randomized hashing that can be attacked via HashDoS).

</details>

---

**Problem 3 (Bloom filter — 6 min)**: A Bloom filter with m bits and k hash functions has n elements inserted. Derive the false positive probability and explain the optimal k.

<details><summary>Model Answer</summary>

**After n insertions**: Each of the k hash functions sets one bit per insertion. The probability a specific bit remains 0 is (1 - 1/m)^{kn} ≈ e^{-kn/m} for large m.

**False positive**: A query element (not inserted) hashes to k positions; all must be 1 by coincidence. Probability ≈ (1 - e^{-kn/m})^k.

**Optimal k**: Set derivative w.r.t. k = 0. Solution: k = (m/n) ln 2. This minimizes false positive probability. At optimal k: Pr[FP] ≈ (1/2)^k = (1/2)^{(m/n)ln2}.

**Practical rule**: For 1% false positive rate and n elements, use m ≈ 9.6n bits and k ≈ 6-7 hash functions. Space cost is ~10 bits per element vs O(n log n) bits for a hash set.

</details>

---

## Proof Corner — Expected Complexity of Randomized QuickSort

**Claim**: Randomized QuickSort runs in expected O(n log n) comparisons, regardless of input order.

**Proof via indicator random variables** (CLRS §7.4):

Let X_{ij} = 1 if element z_i and z_j (z_i < z_j) are ever compared, 0 otherwise. Total comparisons X = sum_{i<j} X_{ij}.

**Key observation**: z_i and z_j are compared if and only if the first element chosen as pivot from the set {z_i, z_{i+1}, ..., z_j} is either z_i or z_j itself. (If any intermediate element is chosen first as pivot, z_i and z_j go into different sub-arrays and are never compared.)

**Probability**: Pr[X_{ij} = 1] = 2 / (j - i + 1) since each of the (j-i+1) elements in that range is equally likely to be the first pivot chosen.

**Expected total comparisons**:
```
E[X] = sum_{i=1}^{n} sum_{j=i+1}^{n} 2/(j-i+1)
     = sum_{i=1}^{n} sum_{k=2}^{n-i+1} 2/k
     <= 2n * sum_{k=2}^{n} 1/k
     = 2n * (H_n - 1)
     = O(n log n)
```

where H_n is the n-th harmonic number ≈ ln n. **QED.**

**Why the random pivot eliminates worst-case**: On sorted input, deterministic QuickSort (pivot = last element) always picks the min, giving O(n^2). A uniformly random pivot has only a 1/n chance of being the min, giving O(n log n) in expectation. The adversary cannot predict the pivot.

---

## When It Breaks — Randomized Algorithms

**1. PRNG seed attacks (HashDoS)** — Java's `HashMap` (pre-JDK 8) used `hashCode()` without randomization. Adversaries could craft inputs where all keys hash to the same bucket: O(n^2) lookup per query. Fix: JDK 8+ uses hash-seed randomization and treeifies long chains (to O(log n) per bucket). Lesson: randomness must be secret from the adversary.

**2. Birthday paradox undersizing** — choosing a Bloom filter with m bits without accounting for the birthday threshold. For n elements and k hash functions, the expected number of collisions starts growing rapidly once n/m > 1/(k ln 2). Rule: m ≥ 10n for k=7 gives ~1% FP rate; halving m quadruples the FP rate.

**3. Bad random number generator** — `Math.random()` (backed by `Random`) is a linear congruential generator: period 2^48, not cryptographically secure, predictable from 2 outputs. Never use it for security tokens, shuffles that must be unpredictable, or randomized algorithms where the adversary controls input. Use `SecureRandom` for security; `ThreadLocalRandom` for throughput.

**4. Rejection sampling infinite loop** — if the acceptance probability is very low (e.g., sampling a point uniformly from a hypersphere in high dimensions), rejection sampling may run for an enormous number of iterations in the worst case. Always bound iterations: retry at most MAX_ITER times, then throw or fall back.

**5. Monte Carlo confidence without enough samples** — a Monte Carlo estimate with N=100 samples has std error ~1/sqrt(100) ≈ 10%. Reporting "our algorithm is 5% faster" from a 100-sample run is noise, not signal. Rule: for 1% error at 95% confidence, need N ≥ 10,000 samples.

---

## Reference Anchor

**java.security.SecureRandom** — cryptographically strong PRNG:
```java
// For security-sensitive applications (tokens, nonces, shuffles users bet money on):
SecureRandom rng = new SecureRandom();
byte[] token = new byte[32];
rng.nextBytes(token);  // OS entropy source (urandom on Linux, CSPRNG on Windows)
// Slower than Random (~10x), but the only correct choice for security
```

**java.util.concurrent.ThreadLocalRandom** — high-throughput randomness for algorithmic use:
```java
// For randomized algorithms, simulations, random pivots — NOT security:
int pivot = ThreadLocalRandom.current().nextInt(lo, hi + 1);
// Thread-local: no contention in parallel code; faster than synchronized Random
// XorShift128+ generator — period 2^128, passes statistical tests, NOT cryptographic
```

**java.util.Collections.shuffle** — Fisher-Yates using Random:
```java
List<Integer> arr = new ArrayList<>(Arrays.asList(1,2,3,4,5));
Collections.shuffle(arr, ThreadLocalRandom.current());
// Knuth shuffle: for i from n-1 down to 1, swap arr[i] with arr[rand(0,i)]
// Produces uniform permutation in O(n). Source: OpenJDK Collections.java
```

---

## Brute Force to Optimal

| Problem | Deterministic Worst Case | Randomized Expected | Why Randomization Helps |
|---------|--------------------------|--------------------|-----------------------|
| QuickSort | O(n^2) (sorted input, bad pivot) | O(n log n) | Random pivot prevents adversarial input |
| Hashing (fixed function) | O(n) per lookup (crafted collision attack) | O(1) expected | Random hash function; adversary can't predict |
| Primality testing | Trial division O(sqrt(n)) | Miller-Rabin O(k log^2 n) | Probabilistic witness test, error < 4^{-k} |
| Minimum cut | Deterministic O(nm) | Karger's O(n^2 log n) with repetition | Random edge contractions; simpler to implement |
| Approximate counting | Exact count O(n) space | Morris counter O(log log n) space | Probabilistic increment; unbiased estimate |

**The trade-off**: Randomized algorithms trade deterministic worst-case guarantees for expected-case performance. They require a source of randomness, and the analysis assumes the randomness is independent of the input. Always document what "expected" means in your algorithm's contract.

*[← A3: Lower Bounds & NP](A3_Lower_Bounds_And_NP.md) | [Back to Index](00_INDEX.md)*


---

## 🏢 Enterprise Lens — Randomized Algorithms

| Area | What top-tier engineering looks like |
| ---- | ------------------------------------ |
| **Where it runs in production** | Hash tables, load balancing, sampling, cryptography, probabilistic data structures |
| **Failure modes** | Weak random sources; reusing seeds across runs in tests; relying on expectation for latency-critical tails |
| **Testing and verification** | Seed deterministically in tests; verify distribution and error rate empirically |

---

## Reality Check

**"Randomised algorithms give different answers every run"** → Las Vegas algorithms give the SAME correct answer every run, only the runtime varies randomly. Monte Carlo algorithms give answers that are correct with high probability — but running multiple times and taking the majority vote increases confidence. Miller-Rabin primality test: each round is a Monte Carlo test with error probability ≤ 1/4. After 40 rounds: error probability ≤ (1/4)^40 ≈ 10^-24. Essentially certain. The key design goal: make the probability of error arbitrarily small while keeping polynomial time.

**"The rand() function is random enough for cryptography"** → `Math.random()` (Java) and `rand()` (C) are pseudo-random number generators (PRNGs) — deterministic sequences that appear random. They are NOT cryptographically secure: given enough output values, an attacker can predict future values. For cryptography: use `java.security.SecureRandom` (CSPRNG — Cryptographically Secure PRNG) which uses OS entropy sources (/dev/urandom, hardware RNG). For Monte Carlo simulations: `Math.random()` is fine (statistical properties are good, predictability doesn't matter). Never use `Math.random()` for: session tokens, CSRF tokens, password resets, or any security-sensitive value.

**"Randomised quicksort and quicksort with median-of-three are equivalent"** → Both reduce the probability of hitting O(n²). Random pivot: pivot is uniformly random in the array — adversary cannot construct a worst-case without knowing the random choices. Median-of-three: pick the median of first, middle, last elements. Adversary CAN construct a worst-case for median-of-three (it's deterministic). Random pivot: no adversary-constructable worst case. Median-of-three: better practical performance for random data (avoids some pathological cases) but not adversarially robust. Production sort implementations (like Java's dual-pivot) use deterministic strategies with analysis showing good average-case.

**"Hashing with a random hash function is always uniform"** → Universal hashing: a randomly chosen hash function from a universal family guarantees that for any two distinct keys x, y: `Pr[h(x) = h(y)] ≤ 1/m` (m = table size). This is not the same as saying all keys hash to different slots — collisions still occur. Universal hashing gives a probabilistic BOUND on collisions, not a guarantee of zero collisions. The expected number of keys that collide with a given key is ≤ n/m (load factor). This bound is achievable regardless of the key distribution — including adversarial keys.

**"Random sampling requires a large sample for statistical significance"** → Sample size depends on the margin of error and confidence level you need, not just on the population size. For a binary outcome (yes/no, works/fails), 1,000 samples gives ±3% margin of error at 95% confidence, regardless of whether the population is 10,000 or 10 billion. This is why A/B tests for large-scale features can reach significance with a tiny fraction of users. The surprising result: statistical significance depends on the absolute sample size, not the fraction of the population sampled.
