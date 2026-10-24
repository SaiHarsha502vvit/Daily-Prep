# A3. Lower Bounds and NP-Completeness

**Navigation**: [← A2: Complexity First Principles](A2_Complexity_FirstPrinciples.md) | [📚 Index](00_INDEX.md) | [A4: Randomized Algorithms →](A4_Randomized_Algorithms.md)

> **MIT 6.046J L16–L23 / KTH DD2352 / TU Munich Theoretical CS foundation**
>
> "Proving an upper bound says your algorithm is fast. Proving a lower bound says *no algorithm can do better*. Only lower bounds tell you when to stop searching for improvements." — MIT 6.046J

---

## 🔗 Bridge — Where This Chapter Fits

| Dimension | This chapter |
| --- | --- |
| **Builds on** | [A2 Complexity](A2_Complexity_FirstPrinciples.md), [Greedy/DP/Backtracking](12_Greedy_Algorithms_Complete.md) |
| **You will learn** | Decision-tree lower bounds, reductions, P vs NP, NP-completeness proofs, approximation hooks |
| **Leads to** | [Approximation, Online & LP](25_Online_Approximation_And_Linear_Programming.md), [A4 Randomized](A4_Randomized_Algorithms.md) |
| **Abstraction level** | L7: knowing what cannot be done fast |

> [!NOTE]
> The full gap-free reading order and dependency graph are in the [Learning Path](00_LEARNING_PATH.md).

---

## 💬 Explain It Like a Study Partner — Lower Bounds & NP-Completeness

### 1. The bottom line

A lower bound or an NP-hardness proof tells you when to stop searching for a faster exact algorithm.

### 2. The textbook core

- Comparison sorting needs Ω(n log n) (decision tree with n! leaves).
- To prove problem B is NP-hard, **reduce** a known NP-hard problem A to B in polynomial time.
- NP-complete = in NP and NP-hard.
- Responses to hardness: approximation, heuristics, parameterised or exponential algorithms with pruning.

### 3. The real-world analogy

A **proof that a puzzle has no shortcut** so you stop wasting time looking for one.

### 4. Walkthrough

1. Show Vertex Cover is hard via Independent Set.
2. A set `S` is independent iff its complement is a vertex cover.
3. So a size-k independent set exists iff a size-(n−k) vertex cover exists.
4. The reduction is polynomial → Vertex Cover is NP-hard.

> [!NOTE]
> **Quick check:** What does NP-hard guarantee? *If you could solve it in polynomial time, you could solve every NP problem in polynomial time.*

---


## Table of Contents

1. [Lower Bounds — Proving Algorithms Are Optimal](#1-lower-bounds--proving-algorithms-are-optimal)
2. [The Comparison Sort Lower Bound — Ω(n log n)](#2-the-comparison-sort-lower-bound--n-log-n)
3. [Information-Theoretic Lower Bounds](#3-information-theoretic-lower-bounds)
4. [The Reduction Framework](#4-the-reduction-framework)
5. [P, NP, and the Complexity Hierarchy](#5-p-np-and-the-complexity-hierarchy)
6. [NP-Completeness Proofs — The Methodology](#6-np-completeness-proofs--the-methodology)
7. [Approximation Algorithms](#7-approximation-algorithms)
8. [When to Stop Searching for a Polynomial Algorithm](#8-when-to-stop-searching-for-a-polynomial-algorithm)

---

## 1. Lower Bounds — Proving Algorithms Are Optimal

An upper bound says "there exists an algorithm that solves this in T(n)."
A lower bound says "every algorithm that solves this needs at least T(n)."

Together they prove **optimality**: your algorithm is the best possible.

### Why Lower Bounds Are Hard

Proving an upper bound: just exhibit the algorithm and analyze it.
Proving a lower bound: must reason about **all possible algorithms** — even ones not yet invented.

### Methods for Proving Lower Bounds

| Method | When to Use | Example |
|--------|-------------|---------|
| Decision tree | Comparison-based algorithms | Sorting, searching |
| Information theory | Problems that must "distinguish" outputs | Sorting, hashing |
| Adversary argument | Online algorithms, search | Binary search lower bound |
| Reduction | "This problem is at least as hard as..." | NP-completeness |

---

## 2. The Comparison Sort Lower Bound — Ω(n log n)

### Setup

A **comparison sort** sorts a sequence using only pairwise comparisons: "is A[i] < A[j]?"

**Examples**: Merge sort, heap sort, quicksort, insertion sort — all comparison-based.
**Non-examples**: Counting sort, radix sort, bucket sort — use properties of values, not just comparisons.

### The Decision Tree Model

Model any comparison sort as a **binary decision tree** where:
- Each **internal node** represents a comparison: "A[i] ≤ A[j]?"
- Each **left branch** = YES, **right branch** = NO
- Each **leaf** represents one possible sorted output permutation

```
                     A[1] ≤ A[2]?
                    /              \
              A[2] ≤ A[3]?      A[1] ≤ A[3]?
             /        \          /         \
         [1,2,3]   A[1]≤A[3]? [1,3,2]  A[2]≤A[3]?
                   /    \               /    \
               [1,3,2] [3,1,2]       [2,1,3] [3,2,1]

(Simplified decision tree for sorting 3 elements; full tree has 6 leaves)
```

### The Proof

**Step 1**: The decision tree must have **at least n! leaves** — one per possible sorted output of n distinct elements.

Any algorithm that correctly sorts any permutation must have a distinct leaf for each of the n! permutations. (If two different permutations led to the same leaf, the algorithm can't distinguish between them — it can't correctly sort both.)

**Step 2**: A binary tree of height h has **at most 2^h leaves**.

**Step 3**: Combining:

```
2^h ≥ n!
h ≥ log₂(n!)
```

**Step 4**: Estimate log₂(n!) using Stirling's approximation (n! ≈ √(2πn) · (n/e)ⁿ):

```
log₂(n!) = Σᵢ₌₁ⁿ log₂(i)
          ≥ Σᵢ₌n/2ⁿ log₂(i)        (drop first half of terms)
          ≥ (n/2) · log₂(n/2)       (each of n/2 terms ≥ log₂(n/2))
          = (n/2)(log₂ n - 1)
          = Ω(n log n)
```

**Conclusion**: Every comparison sort algorithm must make at least Ω(n log n) comparisons in the worst case. The height of any valid decision tree is Ω(n log n).

Since merge sort and heap sort both achieve Θ(n log n) comparisons in the worst case, they are **asymptotically optimal comparison sorts**.

### What This Lower Bound Tells Us

1. **No comparison sort can be faster than Θ(n log n) in the worst case.** You can stop trying.
2. **Merge sort and heap sort are optimal** — you cannot improve their asymptotic complexity.
3. **Quicksort's Θ(n log n) average case is optimal on average** too.
4. **BUT**: Counting sort, radix sort can be O(n) because they **don't use comparisons** — they exploit the domain of values. They sidestep the lower bound by not being in the comparison model.

---

## 3. Information-Theoretic Lower Bounds

### The Entropy Argument

If an algorithm must "distinguish" among N possible outcomes, it needs at least log₂(N) bits of information — and therefore at least log₂(N) questions (comparisons, probes, queries).

**Binary search lower bound**: To find an element in a sorted array of n elements (or prove it absent), the answer is one of n+1 possible locations. Therefore any search algorithm needs at least ⌊log₂(n+1)⌋ comparisons. Binary search achieves exactly this — it's **optimal**.

**Adversary argument for binary search**: An adversary answers comparisons to force the maximum number of steps. For any deterministic algorithm, the adversary can always leave at least half the elements as candidates after each comparison. After k comparisons, at least n/2ᵏ candidates remain. The algorithm must continue until 1 candidate remains: n/2ᵏ = 1 → k = log₂(n). Every algorithm takes ≥ log₂(n) comparisons on some input.

### Hashing Lower Bound

Any comparison-based dictionary (BST variants) needs Ω(log n) per operation. Hash tables bypass this lower bound by using arithmetic on keys rather than comparisons — they're outside the comparison model.

But hash tables have a cost: they require keys to have a hash function, and they lose ordering information (no floor, ceiling, predecessor queries).

---

## 4. The Reduction Framework

### What Reduction Means

**A reduces to B** (written A ≤_p B): "A is no harder than B."

More precisely: if I can solve B efficiently, I can solve A efficiently — by transforming A into B, solving B, and transforming the answer back.

```
Reduction:  A  ──transform──→  B  ──solve──→  answer-for-B  ──convert──→  answer-for-A

If B can be solved in polynomial time, and the transformation is polynomial time,
then A can also be solved in polynomial time.
```

### Using Reductions to Design Algorithms

**Example**: Sorting using only a max-heap.

```
Finding min in unsorted array  ≤_p  min-extraction from a min-heap

Reduction:
  1. Build a min-heap from the array: O(n)
  2. Extract the minimum: O(log n)
  3. Answer is the extracted minimum

Since min-heap is solvable in O(n) build + O(log n) extract,
minimum-finding in unsorted array is solvable in O(n).
(Which matches the obvious linear scan — reduction gives same bound.)
```

### Using Reductions to Prove Hardness

**Example**: Prove that the Hamiltonian Path problem is at least as hard as Hamiltonian Cycle.

```
Hamiltonian Cycle ≤_p Hamiltonian Path:
  Given graph G and query "does G have a Hamiltonian Cycle?":
  1. For each edge (u, v) in G:
     a. Remove (u, v) from G to get G'
     b. Ask "does G' have a Hamiltonian Path from u to v?"
     c. If yes: G has a Hamiltonian Cycle (close the path with (u,v))
  2. If no such edge gives yes: G has no Hamiltonian Cycle.

Transformation: O(|E|) invocations of Hamiltonian Path solver.
Consequence: if Hamiltonian Path is solvable in P, so is Hamiltonian Cycle.
Equivalently: if Hamiltonian Cycle is hard (NP-complete), so is Hamiltonian Path.
```

---

## 5. P, NP, and the Complexity Hierarchy

### Formal Definitions

**Decision problem**: A problem whose answer is YES or NO.
(Any optimization problem can be converted: "Is there a solution with value ≤ k?")

```
P    = problems solvable in polynomial time by a deterministic algorithm
       { L : ∃ algorithm A, ∃ polynomial p : A solves L in O(p(n)) time }

NP   = problems where a YES answer can be VERIFIED in polynomial time
       { L : ∃ polynomial-time verifier V : x ∈ L ↔ ∃ certificate c : V(x,c) = YES }
       
       Equivalently: solvable in polynomial time on a nondeterministic machine.

NP-hard  = at least as hard as every problem in NP
            ∀ L ∈ NP: L ≤_p NP-hard-problem

NP-complete = in NP AND NP-hard
```

### The Fundamental Question: P = NP?

The most important open problem in mathematics and computer science (Millennium Prize, $1M):

```
If P = NP:  Every problem whose solution can be quickly verified
            can also be quickly solved. Cryptography breaks down.
            Protein folding, drug design become easy.
            
If P ≠ NP:  (widely believed) There are problems easy to verify
            but hard to solve. Cryptography is secure.
            NP-complete problems have no polynomial algorithm.
```

### The Complexity Hierarchy

```
┌─────────────────────────────────────────────────────┐
│  PSPACE (problems solvable in polynomial SPACE)      │
│  ┌─────────────────────────────────────────────┐    │
│  │  NP-hard (at least as hard as everything)    │    │
│  │  ┌─────────────────────────────────────┐   │    │
│  │  │  NP-complete (NP ∩ NP-hard)         │   │    │
│  │  │  ┌───────────────────────────┐     │   │    │
│  │  │  │  NP (verifiable in poly) │     │   │    │
│  │  │  │  ┌─────────────────┐    │     │   │    │
│  │  │  │  │  P (solvable)  │    │     │   │    │
│  │  │  │  └─────────────────┘    │     │   │    │
│  │  │  └───────────────────────────┘     │   │    │
│  │  └─────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

---

## 6. NP-Completeness Proofs — The Methodology

### Two Steps to Prove NP-Completeness

1. **Prove the problem is in NP**: Show that a YES solution can be verified in polynomial time. Give the certificate and the verifier.
2. **Prove the problem is NP-hard**: Reduce a known NP-complete problem to it (show the known-hard problem ≤_p your problem).

### The Chain of Reductions

```
SAT (Cook-Levin theorem — proved NP-hard directly)
 ↓ ≤_p
3-SAT (every SAT clause can be rewritten in 3-literal form)
 ↓ ≤_p              ↓ ≤_p            ↓ ≤_p
Independent Set    Vertex Cover    Hamiltonian Cycle
 ↓ ≤_p              ↓ ≤_p            ↓ ≤_p
Clique             Set Cover       Travelling Salesman
```

Once SAT is NP-hard (Cook-Levin, 1971), every problem reachable via reduction is also NP-hard.

### Example: Proving Independent Set is NP-Complete

**Problem**: Given graph G and integer k, does G have an independent set of size ≥ k? (Independent set = set of vertices with no edges between them.)

**Step 1 — In NP**: Certificate = the set S. Verifier checks |S| ≥ k and no two vertices in S share an edge. Runs in O(k²) = polynomial. ✓

**Step 2 — NP-hard**: Reduce 3-SAT to Independent Set.

*3-SAT*: Given formula φ with clauses C₁, C₂, ..., Cₘ (each a disjunction of 3 literals), is φ satisfiable?

*Reduction*: Build graph G = (V, E) where:
- For each clause Cᵢ = (l₁ ∨ l₂ ∨ l₃): add 3 vertices (one per literal)
- Add edges connecting all 3 literals in the same clause (triangle) → can only pick 1 per clause
- Add edges between a literal and its negation across clauses → can't pick x and ¬x simultaneously
- Set k = m (number of clauses)

*Claim*: φ is satisfiable ↔ G has an independent set of size k.

**Forward** (sat → IS): Given satisfying assignment, pick one TRUE literal from each clause. These m vertices form an IS: no two are in the same clause (triangle edges would connect them, but we pick only one per clause), and no two are x and ¬x (one of them is FALSE in the assignment). ✓

**Backward** (IS → sat): Given IS of size k = m, it has exactly one vertex per clause triangle. Set those literals to TRUE. No contradictions: x and ¬x can't both be in the IS (they're connected by an edge). ✓

The reduction runs in polynomial time (O(m) vertices, O(m²) edges at most). ✓ Independent Set is NP-complete. ✓

---

## 7. Approximation Algorithms

Since NP-complete problems likely have no polynomial-time exact algorithm, we settle for **approximation**: a polynomial algorithm that guarantees the answer is within a factor of the optimum.

### Approximation Ratio

An algorithm has **approximation ratio ρ(n)** if for every input of size n:
- Maximization: ALG ≥ OPT / ρ(n)
- Minimization: ALG ≤ ρ(n) · OPT

Smaller ρ = better approximation. ρ = 1 would be exact.

### Example 1: Vertex Cover — 2-Approximation

**Problem**: Find the minimum set of vertices that touches every edge.

**Algorithm**:
```
C = ∅
while there exist uncovered edges:
    pick any edge (u, v)
    add both u AND v to C
    remove all edges incident to u or v
return C
```

**Proof of 2-approximation**:

Let M = set of edges picked (one per iteration). M is a **matching** (no two share a vertex, since we remove all incident edges each round).

C = both endpoints of every matching edge → |C| = 2|M|.

Any vertex cover must include at least one endpoint of each matching edge (to cover it). These endpoints are distinct (matching property). So OPT ≥ |M|.

Therefore: |C| = 2|M| ≤ 2·OPT. **ALG ≤ 2·OPT**. ✓

### Example 2: Greedy Set Cover — O(log n) Approximation

**Problem**: Cover all elements using fewest sets from a collection. Each set has a cost.

**Algorithm**: Greedily pick the set that covers the most uncovered elements per unit cost.

**Approximation ratio**: OPT · H(n) where H(n) = 1 + 1/2 + 1/3 + ... + 1/n = Θ(log n).

**Proof (sketch)**: After covering the first n - n/OPT elements, we've made progress of 1/OPT fraction. By induction, the greedy always makes proportional progress, giving O(OPT · log n) total sets.

This is also **tight**: there exist instances where greedy uses Ω(log n) · OPT sets.

Unless P = NP, Set Cover cannot be approximated better than (1 - ε) ln n for any ε > 0 (Dinur-Steurer, 2014).

### Example 3: TSP — When Approximation is Impossible

**Metric TSP** (triangle inequality holds): Christofides' 3/2-approximation algorithm exists.

**General TSP** (no triangle inequality): Unless P = NP, there is no constant-ratio approximation algorithm. In fact, for any ρ ≥ 1, a ρ-approximation algorithm for general TSP would imply P = NP. (Proof: reduction from Hamiltonian Cycle, where an approximation would distinguish Hamiltonian from non-Hamiltonian graphs.)

### The Approximability Landscape

```
Problem            │ Best known approximation    │ Hardness (unless P=NP)
───────────────────┼─────────────────────────────┼──────────────────────
Vertex Cover       │ 2                           │ No factor < 1.36
Set Cover          │ H(n) ≈ ln n                 │ No factor < (1-ε)ln n
Metric TSP         │ 1.5 (Christofides)          │ No PTAS
General TSP        │ None!                       │ No constant factor
Knapsack           │ FPTAS (1+ε, poly in 1/ε)   │ No FPTAS for 0/1 unless P=NP
Max-3-SAT          │ 7/8 (optimal!)              │ No factor > 7/8
Independent Set    │ O(n / log² n)               │ No n^(1-ε) approx
```

---

## 8. When to Stop Searching for a Polynomial Algorithm

### The Decision Guide

```
Can you solve it in polynomial time?
  YES → Done. Implement and ship.
  
  NO → Is it in NP?
    YES → Try to prove NP-completeness (reduce from 3-SAT, Vertex Cover, etc.)
          If NP-complete: use approximation, heuristics, or exploit problem structure
          
    Possibly NO → Try PSPACE, EXP, or undecidable territory
```

### Special Structure That Makes NP-Hard Problems Tractable

1. **Small parameter** (parameterized complexity): Vertex Cover on graphs with k-cover: O(2ᵏ · n). If k is small (e.g., ≤ 20), this is fast despite NP-hardness.

2. **Special graph structure**: Many NP-hard problems become polynomial on trees, planar graphs, or bounded-treewidth graphs.

3. **FPTAS available**: Knapsack has a (1+ε)-approximation running in O(n²/ε) — for ε=0.01, this is a 1% optimal solution in polynomial time.

4. **Average case is easy**: 3-SAT with random instances is easy on average (the "easy-hard-easy" threshold phenomenon near 4.26 clauses/variable).

### The Most Common NP-Complete Problems (Know These)

| Problem | Description | Useful Reduction Source |
|---------|-------------|------------------------|
| 3-SAT | Satisfying 3-literal clauses | The "mother" of reductions |
| Independent Set | k vertices, no adjacent pairs | ← 3-SAT |
| Vertex Cover | k vertices covering all edges | ↔ Independent Set |
| Clique | k vertices, all mutually adjacent | ← Independent Set |
| Hamiltonian Cycle | Cycle visiting all vertices once | ← 3-SAT |
| TSP (general) | Shortest tour visiting all cities | ← Hamiltonian Cycle |
| Subset Sum | Subset summing to target | ← 3-SAT |
| Knapsack (0/1) | Max value under weight | ← Subset Sum |
| Graph Coloring | k colors, no adjacent same color | ← 3-SAT |
| Partition | Split set into equal-sum halves | ← Subset Sum |

---

## Summary

```
Concept                      │ Key Fact
─────────────────────────────┼─────────────────────────────────────────────
Comparison sort lower bound  │ Ω(n log n) — decision tree with n! leaves
Binary search lower bound    │ Ω(log n) — adversary halves candidates
Reduction A ≤_p B            │ "B is at least as hard as A"
P                            │ Exactly solvable in polynomial time
NP                           │ YES-certificates verifiable in polynomial time
NP-complete                  │ In NP AND NP-hard (all of NP reduces to it)
NP-hard                      │ At least as hard as everything in NP
Proving NP-completeness      │ Show ∈ NP + reduce known NP-complete ≤_p it
2-approx for Vertex Cover    │ Greedy matching + take both endpoints
ln n-approx for Set Cover    │ Greedy pick max coverage per cost
General TSP                  │ No constant approximation unless P=NP
FPTAS                        │ (1+ε)-approximation in poly(n, 1/ε) time
```

---

## 🎯 Interview Proof Templates — Lower Bounds & NP

> Use these templates when an interviewer asks you to prove hardness or lower bounds.

### Template A3-1 — Decision Tree Lower Bound

```
"I'll prove a lower bound of Ω([f(n)]) for [problem] using a decision tree argument.

Step 1 — Define the decision tree:
  Each leaf = one distinct output (correct answer for some input).
  Number of distinct outputs = [N] (e.g., n! orderings, n positions).

Step 2 — Tree height lower bound:
  A binary tree with N leaves has height ≥ log₂(N).
  So any decision tree algorithm needs ≥ log₂([N]) comparisons.

Step 3 — Simplify:
  log₂([N]) = [Θ(f(n))] by [Stirling's approximation / direct calculation].

Conclusion: any [problem type] algorithm needs Ω([f(n)]) comparisons.
This lower bound is [tight / not tight — best upper bound is O([g(n)])]."
```

**Example — comparison sort**: N = n! outputs. log₂(n!) = Ω(n log n) by Stirling. Tight (merge sort achieves it).

---

### Template A3-2 — NP-Completeness Proof (two-step)

```
"I'll prove [Problem X] is NP-complete.

Step 1 — Show X ∈ NP:
  Certificate: [describe the certificate — size O(poly(n))].
  Verifier: given certificate C and input I, check [condition] in O(poly(n)) time.
  → X ∈ NP. ✓

Step 2 — Show X is NP-hard (reduce known NP-complete problem Y ≤_p X):
  Known NP-complete problem: [Y — e.g., 3-SAT, CLIQUE, VERTEX-COVER].
  
  Reduction f: given instance of Y, construct instance f(Y) of X such that:
    - Y is a YES-instance ↔ f(Y) is a YES-instance.
    - f runs in polynomial time.
  
  Construction: [describe f(Y)].
  
  Correctness (→): if Y = YES, then [explain why f(Y) = YES].
  Correctness (←): if f(Y) = YES, then [explain why Y = YES].
  
  Polynomial time: f constructs [description] in O(poly(n)).

Conclusion: X ∈ NP and Y ≤_p X for NP-complete Y → X is NP-complete. ✓"
```

---

### Template A3-3 — Approximation Ratio Proof

```
"I'll prove algorithm A achieves a [c]-approximation for [Problem].

Step 1 — Lower bound OPT:
  OPT ≥ [bound on optimal solution — e.g., max clique size, matching size].

Step 2 — Bound A's output:
  A outputs a solution of cost ≤ [c] × [bound from Step 1].

Step 3 — Ratio:
  A's cost / OPT ≤ [c × bound] / [bound] = [c].

Conclusion: A is a [c]-approximation. ✓
The bound is tight: instance [describe tight example] achieves ratio exactly [c]."
```

## 📝 Exam-Style Problems (MIT 6.046J / KTH DD2352 style)

---

**Problem 1 (Lower bound — 8 min)**: Prove that any comparison-based algorithm for finding the minimum of n elements requires at least n-1 comparisons.

<details><summary>Model Answer</summary>

**Information-theoretic argument**: Consider an adversary that initially assigns all elements as "potentially minimum." Each comparison `a < b` can eliminate at most one element (the larger one) from "potentially minimum" status. After k comparisons, at most k elements have been eliminated. To identify the unique minimum, all n-1 non-minimum elements must be eliminated. Therefore at least **n-1 comparisons** are required. ✓

**Adversary argument alternative**: An adversary answers comparisons consistently but keeps all elements as potential minimum until forced. Before n-1 comparisons, at least one element has never "lost" a comparison → the algorithm cannot distinguish it from the true minimum. The adversary can swap it with any other element to produce a consistent input where the wrong element was returned.

**Tight bound**: SELECT (tournament tree) achieves exactly n-1 comparisons for minimum. The bound is tight.

</details>

---

**Problem 2 (NP-completeness — 10 min)**: Prove that 3-SAT is in NP. (You do not need to prove NP-hardness — just membership in NP.)

<details><summary>Model Answer</summary>

A problem is in NP if: given a proposed solution, a polynomial-time verifier can check correctness.

**Certificate**: a truth assignment — for each of the n variables, a Boolean value (True/False). The certificate has size O(n).

**Verifier**: For each of the m clauses, check if at least one literal in the clause is satisfied by the assignment. Each clause has ≤ 3 literals; checking all m clauses takes O(m) time = polynomial in input size. If all m clauses are satisfied, accept; otherwise reject.

**Conclusion**: A valid truth assignment is a polynomial-size certificate verifiable in polynomial time → 3-SAT ∈ NP. ✓

**Note**: Proving 3-SAT is NP-hard (Cook-Levin theorem) requires showing that every NP problem reduces to 3-SAT in polynomial time — a much harder argument involving Turing machine simulation.

</details>

---

**Problem 3 (Approximation — 6 min)**: The Vertex Cover problem: find the minimum set of vertices that touches every edge. The greedy "pick any uncovered edge, take both endpoints" gives a 2-approximation. Why?

<details><summary>Model Answer</summary>

**Algorithm**: while uncovered edges exist, pick any edge (u,v), add both u and v to cover, remove all edges incident to u or v.

**Let M** = set of edges picked by the algorithm. The edges in M form a **matching** (no two share an endpoint — each picked edge's endpoints are added and all incident edges removed).

**Lower bound**: Any vertex cover must include at least one endpoint of every edge in M. Since M is a matching, these edges are disjoint → any optimal cover needs at least |M| vertices. So OPT ≥ |M|.

**Algorithm output**: The algorithm adds exactly 2 vertices per edge in M → |cover| = 2|M|.

**Ratio**: |cover| / OPT ≤ 2|M| / |M| = **2**. ✓

This is a tight 2-approximation: there exist instances where OPT = |M| and the algorithm returns 2|M|.

</details>

*[← A2: Complexity First Principles](A2_Complexity_FirstPrinciples.md) | [A4: Randomized Algorithms →](A4_Randomized_Algorithms.md)*

---

## Proof Corner -- NP-Completeness and Reduction Correctness

**NP definition**: A language L is in NP if there exists a polynomial-time verifier V such that for every x in L, there exists a polynomial-size certificate c with V(x, c) = 1; and for every x not in L, no certificate satisfies V(x, c) = 1.

**NP-hardness proof template**:
1. Choose a known NP-hard problem P (e.g., 3-SAT, Clique, Vertex Cover).
2. Show a polynomial-time reduction f: P -> Q (P instances to Q instances).
3. Correctness: x is YES for P iff f(x) is YES for Q.
4. Conclusion: if Q were solvable in poly-time, so would P -- contradicting P NP-hard.

**Vertex Cover 2-approximation correctness**: Find a maximal matching M (greedily). Add both endpoints of each matching edge to the cover C. Claim: |C| <= 2*OPT.

Proof: Every edge in M must be covered; no two matching edges share an endpoint (matching property); so OPT must include at least one endpoint of each matching edge; |OPT| >= |M|. But |C| = 2|M| <= 2*OPT. QED.

---

## When It Breaks -- Lower Bounds and NP

**1. Reducing in the wrong direction** -- to prove Q NP-hard, reduce FROM a known NP-hard problem TO Q. Reducing FROM Q to a known NP-hard problem only proves Q is in NP (or nothing, if the reduction goes wrong). This is the most common error in NP-hardness proofs.

**2. Non-polynomial reduction** -- the reduction must run in polynomial time in the input size. If f(x) itself requires exponential time or produces exponential output, the hardness transfer fails.

**3. Approximation ratio direction confusion** -- for minimisation, ratio = ALG/OPT >= 1. For maximisation, ratio = OPT/ALG >= 1. Reporting "we achieve a 2-approximation" for the wrong objective gives a misleading claim.

**4. P = NP misunderstanding** -- P = NP would make NP-hard problems solvable in polynomial time, but problems outside NP (PSPACE, EXPTIME) remain hard. "P = NP solves everything" is incorrect.

---

## Reference Anchor

**Standard NP references and Java SAT solving**:
```
Garey and Johnson, "Computers and Intractability" (1979) -- canonical NP hardness catalog
Karp's 21 NP-complete problems (1972) -- foundation of practical reductions
CLRS Chapter 34 -- NP-completeness with formal proof templates

Key reductions for interviews:
  3-SAT -> Independent Set (clause gadgets -> clique; variable gadgets)
  Clique -> Vertex Cover (complement: VC of G = n - clique of complement(G))
  3-SAT -> Subset Sum (arithmetic gadget: one row per literal)
```

```java
// 2-Approximation for Vertex Cover:
Set<Integer> cover = new HashSet<>();
boolean[] inMatching = new boolean[n];
for (int[] edge : edges) {
    int u = edge[0], v = edge[1];
    if (!inMatching[u] && !inMatching[v]) {
        cover.add(u); cover.add(v);
        inMatching[u] = inMatching[v] = true;
    }
}
// |cover| <= 2 * OPT: each matching edge must be in OPT, |matching| <= OPT, |cover|=2|matching|

// 2-SAT in polynomial time (P class) via SCC:
// Build implication graph: for each clause (a OR b), add edges !a->b and !b->a
// x is satisfiable iff x and !x are in different SCCs (Kosaraju/Tarjan in O(V+E))
```

---

## Brute Force to Optimal -- NP-Hard Problem Strategies

| Strategy | When to use | Example | Guarantee |
|----------|------------|---------|-----------|
| Exact exponential | Small n < 20 | Branch-and-bound, ILP | Optimal |
| Approximation | Poly time, bounded error | Greedy VC, LP relax | rho*OPT |
| FPT algorithm | Hard but parameter k is small | Vertex Cover FPT: O(2^k * n) | Exact, fast for small k |
| Heuristic | Large n, no guarantee needed | Simulated annealing | No guarantee |
| Special case | Restricted input structure | PTAS for planar TSP | (1+eps)*OPT |

```java
// Brute-force for Vertex Cover (n <= 20): try all 2^n subsets
// O(2^n * n): check each subset if it covers all edges
for (int mask = 0; mask < (1 << n); mask++) {
    if (Integer.bitCount(mask) < bestSize && coversAll(mask, edges)) {
        bestSize = Integer.bitCount(mask);
        bestMask = mask;
    }
}
// For n=20: 2^20 = 1M subsets * 20n check = 20M ops -- feasible
// For n=40: 2^40 = 1T -- infeasible without pruning
```



---

## 🏢 Enterprise Lens — Lower Bounds & NP-Completeness

| Area | What top-tier engineering looks like |
| ---- | ------------------------------------ |
| **Where it runs in production** | Choosing exact vs heuristic solvers in logistics, scheduling and verification tools |
| **Failure modes** | Misreading NP-hard as "impossible"; reductions in the wrong direction |
| **Testing and verification** | Test reductions on small instances in both directions |
| **Review checklist** | Complexity stated for time **and** space · invariant stated · edge cases listed (empty, one element, duplicates, extremes) · behaviour at 10× data understood |

---

## Reality Check

**"The P vs NP problem just asks if NP problems can be solved faster"** → P = class of problems solvable in polynomial time. NP = class of problems where a proposed solution can be VERIFIED in polynomial time (not solved). P ⊆ NP (if you can solve it fast, you can verify fast too). The question: does P = NP? If yes, every problem whose solution can be quickly verified can also be quickly solved — which would break most modern cryptography (RSA, AES rely on NP problems being hard to solve). The consensus: P ≠ NP, but this remains unproven. A proof either way would be one of the greatest mathematical achievements in history.

**"NP-completeness means a problem is unsolvable"** → NP-completeness means no polynomial-time algorithm is KNOWN. Solutions still exist (exponential-time, exact), approximate (polynomial-time, near-optimal), heuristic (no guarantee, fast in practice). TSP: Concorde solver finds provably optimal solutions for 100,000+ cities using branch-and-bound + LP relaxation. SAT: industrial SAT solvers (Z3, MiniSat) solve instances with millions of variables in practice. NP-completeness is a theoretical classification, not an engineering death sentence.

**"The Ω notation and the O notation are the same thing"** → O (Big-Oh): upper bound — the algorithm runs in AT MOST f(n) time (up to constants). Ω (Big-Omega): lower bound — the algorithm runs in AT LEAST f(n) time. Θ (Big-Theta): tight bound — both upper and lower. When we say "comparison sorting is Ω(n log n)", we mean NO comparison-based sorting algorithm can do better — proven by the decision tree lower bound (at least n! leaves, so height ≥ log(n!) ≥ n log n - n). O is a claim about your algorithm; Ω is a claim about the PROBLEM.

**"Reduction only goes one way"** → Reduction A ≤p B means A reduces TO B: a solver for B can be used to solve A. This proves B is at least as hard as A (if B were easy, A would be easy too). But A ≤p B does NOT mean B ≤p A. For NP-completeness: first show B ∈ NP (verifiable in polynomial time), then show an NP-complete problem A ≤p B (B is at least as hard as an NP-hard problem). Both steps are required. Missing either step is an incomplete proof.

**"Time hierarchy theorem proves P ≠ NP"** → The time hierarchy theorem proves that more time enables more computation: DTIME(n) ⊊ DTIME(n² log n). It proves P ⊊ EXPTIME (problems solvable in 2^n time that cannot be solved in polynomial time). But P and NP are both within polynomial-to-exponential — the hierarchy theorem doesn't separate them. P vs NP requires a different argument. The hierarchy theorem tells you that: given a problem proved to require exponential time, it's NOT in P. But most NP problems haven't been proved to need exponential time — only that no polynomial algorithm is known.
