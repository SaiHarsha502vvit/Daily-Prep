# A5. Designing Your Own Algorithms — The Invention Method

> **Navigation**: [← A4. Randomized Algorithms](A4_Randomized_Algorithms.md) | [Chapter index](00_INDEX.md)

> **MIT 6.046 Design & Analysis / KTH DD2440 Advanced Algorithms / ETH Algorithm Design level**
>
> "An algorithm is not discovered by staring at a problem. It is derived by asking, in order: what does a brute force do, what work does it repeat, and what structure of the problem lets me not repeat it?"

> The companion to [DS A5](../02_Data_Structures/A5_Designing_Your_Own_Data_Structures.md). That chapter derives *structures* from a cost contract; this one derives *procedures* from a problem's structure — and, crucially, teaches you to **prove** the result correct and to know when you have hit the wall of what is possible.

---

## 🔗 Bridge — Where This Chapter Fits

| Dimension | This chapter |
| --- | --- |
| **Builds on** | All paradigms and A1–A4 |
| **You will learn** | The invention method: spot repeated work, choose a paradigm, state invariants, derive, validate, attack with adversarial input |
| **Leads to** | Practice and real design work |
| **Abstraction level** | L8: from user of algorithms to designer |

> [!NOTE]
> The full gap-free reading order and dependency graph are in the [Learning Path](00_LEARNING_PATH.md).

---

## 💬 Explain It Like a Study Partner — Designing Your Own Algorithms

### 1. The bottom line

Inventing an algorithm is a disciplined search: find the repeated work, remove it, and prove it still works.

### 2. The textbook core

- Find the **repeated work** in the brute force (overlap → DP, repeated search → data structure, order → greedy).
- Write the invariant before the code.
- Validate with a reference solution and adversarial inputs.
- Know when not to invent: use a proven library.

### 3. The real-world analogy

An **engineer redesigning a factory line**: observe where work is repeated or idle, change the process, and measure.

### 4. Walkthrough

1. Brute force: count inversions by checking all pairs, O(n²).
2. Repeated work: comparisons already known from sorted halves.
3. Idea: merge sort and count cross inversions during the merge.
4. Result O(n log n) with a proof by induction.

> [!NOTE]
> **Quick check:** What is the first thing to look for in a brute force? *Repeated work.*

---


## Table of Contents

1. [5W1H](#5w1h)
2. [What Forces a New Algorithm Into Existence](#1-what-forces-a-new-algorithm-into-existence)
3. [The Algorithm Design Loop](#2-the-algorithm-design-loop)
4. [The Paradigm Decision Tree — Choosing, Not Guessing](#3-the-paradigm-decision-tree--choosing-not-guessing)
5. [Deriving the Recurrence](#4-deriving-the-recurrence-the-step-everyone-skips)
6. [The Three Proof Techniques You Must Own](#5-the-three-proof-techniques-you-must-own)
7. [Knowing When You Are Done — Lower Bounds as a Design Tool](#6-knowing-when-you-are-done--lower-bounds-as-a-design-tool)
8. [How New Algorithms Get Created *Today*](#7-how-new-algorithms-get-created-today)
9. [Case Studies: Real Algorithm Invention](#8-case-studies-real-algorithm-invention)
10. [Worked Invention: Deriving Boyer–Moore Majority Vote](#9-worked-invention-deriving-boyermoore-majority-vote-from-nothing)
11. [The Validation Protocol](#10-the-validation-protocol)
12. [When NOT To Design Your Own](#11-when-not-to-design-your-own)
13. [Practice Challenges](#-practice-challenges)
14. [Reality Check](#reality-check)

---

## 5W1H

- **WHAT**: The repeatable method for deriving a *new* algorithm from a problem's structure, proving it correct, bounding its cost, and knowing whether a better one can exist.
- **WHY**: Because pattern-matching a problem to a known algorithm covers the problems someone has already solved. Production and research both hand you problems that are *one twist* away from a textbook case — and that twist is exactly where the pattern-matcher stalls and the deriver continues.
- **WHO**: Anyone who can apply DP but has never *derived* a recurrence from scratch; anyone who can state that greedy "works here" but cannot prove it.
- **WHEN**: When no known algorithm fits, when a known one fits but violates your constraints, or when you must justify to yourself that your solution is optimal.
- **WHERE**: In the gap between the problem you were handed and the problem some textbook solved.
- **HOW**: Brute force → find the repeated work → identify the structural property that permits eliminating it → choose the paradigm that exploits that property → prove correctness → prove the bound → check it against the lower bound.

---

## 1. What Forces a New Algorithm Into Existence

The trigger is different from the data-structure trigger ([DS A5 §1](../02_Data_Structures/A5_Designing_Your_Own_Data_Structures.md)). There, the trigger was *an operation contract nothing satisfies*. Here it is:

> **A brute force exists (it always does), but its cost exceeds your budget — and the problem has structure that the brute force is ignoring.**

Both halves matter. Without excess cost there is nothing to fix; without exploitable structure, no algorithm can help you (§6).

### 1.1 Brute force is not the enemy — it is the specification

The brute force is the most useful artifact in algorithm design, for four reasons:

1. It **proves you understand the problem** (you cannot brute-force what you have not defined).
2. It is a **correctness oracle** — differential-test the clever version against it (§10).
3. Its inefficiency **points at the optimization**: the *kind* of repeated work names the tool.
4. It is a **banked working solution** — in an interview and in production, having something correct before optimizing is the professional order of operations.

### 1.2 The repeated-work taxonomy

Write the brute force, then ask: *what work does it repeat?* The answer routes you to a paradigm.

| The brute force repeats… | Meaning | Tool |
| --- | --- | --- |
| Identical subproblems | Overlapping subproblems | **Memoize / DP** (§3) |
| Scans over the same range | Recomputing aggregates | **Prefix sums / sliding window** |
| Comparisons already implied | Ignoring known order | **Sort first, then two-pointer / binary search** |
| Searches over the same set | No index | **Hash map / precomputed structure** |
| Exploration of doomed branches | No pruning | **Backtracking with constraint propagation / branch-and-bound** |
| Full recomputation after a small change | Ignoring incrementality | **Incremental / online algorithm** |

This table is the single most practical page in this chapter. Almost every "how did they think of that?" optimization is one of these six rows.

---

## 2. The Algorithm Design Loop

```
┌─ 1. SPECIFY ─────────────────────────────────────────────┐
│  Inputs, outputs, constraints, and the COST BUDGET       │
│  implied by the input bounds (n ≤ 10⁵ ⇒ O(n log n)).     │
└──────────────────────┬───────────────────────────────────┘
                       ▼
┌─ 2. BRUTE FORCE ─────────────────────────────────────────┐
│  Write it (or state it precisely). Get its complexity.   │
└──────────────────────┬───────────────────────────────────┘
                       ▼
┌─ 3. FIND THE REPEATED WORK ──────────────────────────────┐
│  Use the §1.2 taxonomy. Name the row.                    │
└──────────────────────┬───────────────────────────────────┘
                       ▼
┌─ 4. NAME THE STRUCTURAL PROPERTY ────────────────────────┐
│  WHY may that work be skipped? (optimal substructure,    │
│  monotonicity, exchange property, triangle inequality…)  │
│  ← this is the creative step, and the one that proves    │
└──────────────────────┬───────────────────────────────────┘
                       ▼
┌─ 5. CHOOSE THE PARADIGM ─────────────────────────────────┐
│  The property from step 4 selects it (§3).               │
└──────────────────────┬───────────────────────────────────┘
                       ▼
┌─ 6. PROVE CORRECTNESS ───────────────────────────────────┐
│  Invariant / exchange argument / induction (§5)          │
└──────────────────────┬───────────────────────────────────┘
                       ▼
┌─ 7. BOUND THE COST, THEN CHECK THE FLOOR ────────────────┐
│  Recurrence → Master Theorem. Compare vs lower bound(§6).│
│  Equal ⇒ you are DONE. Gap ⇒ keep going, or prove the    │
│  gap is inherent.                                        │
└──────────────────────────────────────────────────────────┘
```

**Step 4 is the whole game.** "I can skip that work" is a *claim about the problem*, and stating it precisely is simultaneously the design insight and the seed of the proof. If you cannot name the property, you have a hunch, not an algorithm — and hunches are exactly where wrong-greedy solutions come from.

---

## 3. The Paradigm Decision Tree — Choosing, Not Guessing

Most courses present the paradigms as a list. A list makes you try them in sequence. What you want is a **decision procedure keyed on the structural property from step 4.**

```
Does the problem have OPTIMAL SUBSTRUCTURE?
(an optimal solution contains optimal solutions to subproblems)
│
├─ NO ──► Is it a search over a space with prunable branches?
│         ├─ YES ──► BACKTRACKING / BRANCH-AND-BOUND
│         └─ NO  ──► Is it NP-hard? ──► APPROXIMATION / HEURISTIC (§7)
│
└─ YES ─► Do the subproblems OVERLAP?
          │
          ├─ NO ──► DIVIDE & CONQUER
          │         (merge sort, quickselect, FFT, Karatsuba)
          │
          └─ YES ─► Does a LOCAL choice provably lead to a global optimum?
                    (test: does an exchange argument close? §5.2)
                    │
                    ├─ YES ──► GREEDY   ← cheapest, always test for this
                    └─ NO  ──► DYNAMIC PROGRAMMING
```

**Read the tree in that order deliberately.** Greedy is tested before DP because greedy is strictly cheaper when it applies (O(n log n) with O(1) state versus a table). The failure mode of skipping the test is a correct-but-oversized DP; the failure mode of *assuming* greedy without the exchange argument is a wrong answer that passes your examples (§5.2).

### 3.1 Orthogonal paradigms — usable *with* the above, not instead

| Paradigm | Structural trigger | Signature |
| --- | --- | --- |
| **Binary search on the answer** | The predicate "is value x feasible?" is *monotonic* in x | "minimum maximum", "maximum minimum", "smallest x such that…" |
| **Two pointers / sliding window** | Extending the window moves a tracked property monotonically | contiguous subarray/substring with a constraint |
| **Transformation / reduction** | Problem B is your problem in disguise | "this scheduling problem is interval graph colouring" |
| **Preprocessing** | Many queries over static data | build an index once, answer in O(1)/O(log n) |
| **Incremental / online** | Input arrives over time; recomputation is wasteful | streaming, real-time updates |

The most under-used entry is **transformation**. A large share of hard problems are easy problems wearing a costume; recognizing the reduction is the whole solution ([05_LeetCode ↔ Real World map](../04_Patterns_Templates/05_LeetCode_RealWorld_Map.md), [13_Pattern_Composition](../14_Mental_Models/13_Pattern_Composition.md)).

---

## 4. Deriving the Recurrence (The Step Everyone Skips)

For divide-and-conquer and DP, the algorithm *is* the recurrence. People memorize recurrences; you should derive them. The procedure is mechanical.

### 4.1 The four questions

1. **What is the subproblem?** Write it as a function with explicit arguments — `f(i)` = "the answer for the prefix ending at i" — and say precisely what it returns.
2. **What decision does the last step make?** Enumerate the *complete* menu of choices at that step.
3. **How does each choice reduce to smaller subproblems?**
4. **What are the base cases?** (What does the *empty* instance mean? — this is where wrong answers originate: `dp[0] = 1` for counting, `0` for min-cost, `−∞` for max-with-mandatory-selection.)

### 4.2 Worked derivation: longest increasing subsequence

**Q1 — subproblem.** The naive `f(i)` = "LIS within the prefix 0..i" fails immediately at Q3: knowing the *length* of the best LIS in a prefix does not tell you whether the next element may extend it — you also need to know what it *ended with*. So strengthen the definition:

> `f(i)` = length of the longest increasing subsequence **that ends exactly at index i**.

That redefinition is the entire insight, and it is Q1 done properly. (It is also [DP state design](../14_Mental_Models/02_DP_State_Thinking.md) in miniature: the state must carry everything the future needs.)

**Q2 — the decision.** Element `i` extends some earlier subsequence ending at `j < i`, or starts fresh.

**Q3 — reduction.** It may extend the one ending at `j` only if `a[j] < a[i]`:

```
f(i) = 1 + max{ f(j) : j < i and a[j] < a[i] }        (or 1 if no such j)
```

**Q4 — base case.** `f(0) = 1`. The answer is `max f(i)` over all i — *not* `f(n−1)`, because the LIS need not end at the last element. (That is a classic off-by-one-in-semantics bug.)

Cost: O(n²). **Now check against the budget (loop step 7).** If n ≤ 10⁵, O(n²) fails, so continue: replace the inner `max` scan with a structure. Maintaining `tails[k]` = smallest possible tail of any increasing subsequence of length k+1 (an array that is *provably sorted* — prove it) lets binary search replace the scan → **O(n log n)**. That final step is [DS A5](../02_Data_Structures/A5_Designing_Your_Own_Data_Structures.md) thinking applied inside an algorithm: the bottleneck was a query, so you introduced a structure that answers it faster.

### 4.3 Solving the recurrence

Once you have `T(n)`, use the **Master Theorem** for `T(n) = a·T(n/b) + f(n)`:

| Case | Condition | Result | Example |
| --- | --- | --- | --- |
| 1 | f(n) = O(n^(log_b a − ε)) | Θ(n^(log_b a)) | Karatsuba: T(n)=3T(n/2)+O(n) → Θ(n^1.585) |
| 2 | f(n) = Θ(n^(log_b a)) | Θ(n^(log_b a) · log n) | Merge sort: T(n)=2T(n/2)+O(n) → Θ(n log n) |
| 3 | f(n) = Ω(n^(log_b a + ε)), regularity holds | Θ(f(n)) | T(n)=2T(n/2)+O(n²) → Θ(n²) |

**What the three cases actually mean** (do not memorize the algebra — understand the shape): the comparison is between the work done *at the leaves* (n^(log_b a) of them) and the work done *at the root* (f(n)). Case 1: leaves dominate. Case 3: root dominates. Case 2: every level costs the same, so multiply by the number of levels, log n. Recursion-tree sketching gets you the same answer and generalizes to recurrences the Master Theorem does not cover.

---

## 5. The Three Proof Techniques You Must Own

An algorithm without a correctness argument is a conjecture with syntax highlighting.

### 5.1 Loop invariant (for iterative algorithms)

State a property true before the loop, preserved by each iteration, and strong enough at termination to give the result.

```java
// INVARIANT: after processing a[0..i], `best` holds the maximum
// subarray sum ending at or before i, and `cur` holds the maximum
// subarray sum ending exactly at i.
int kadane(int[] a) {
    int best = a[0], cur = a[0];
    for (int i = 1; i < a.length; i++) {
        cur  = Math.max(a[i], cur + a[i]);   // extend, or restart at i
        best = Math.max(best, cur);          // invariant restored
    }
    return best;   // at termination i = n−1, so `best` is the global answer
}
```

The three obligations: **initialization** (invariant holds before the first iteration — `best = cur = a[0]` covers the prefix of length 1), **maintenance** (the two updates restore it — argue each), **termination** (the invariant at i = n−1 *is* the required postcondition). A loop you cannot annotate this way is a loop you cannot yet claim is correct.

### 5.2 Exchange argument (for greedy algorithms)

**This is the technique that separates a provable greedy from a lucky one.** The shape:

> Take any optimal solution O. Show that O can be transformed, one swap at a time, toward the greedy solution G **without ever getting worse**. Therefore G is optimal.

**Worked: interval scheduling** (maximum number of non-overlapping intervals). Greedy rule: repeatedly take the interval with the **earliest finish time**.

*Proof.* Let G = g₁, g₂, … (in greedy order) and let O = o₁, o₂, … be any optimal solution, both sorted by finish time. Suppose they agree on the first k−1 choices and differ at k. By the greedy rule, `finish(g_k) ≤ finish(o_k)`. Replace `o_k` with `g_k` in O: the result is still feasible, because `g_k` starts after `o_{k−1}` finishes (greedy only considers compatible intervals) and ends no later than `o_k`, so it cannot conflict with `o_{k+1}`. The exchange preserved the solution's size. Repeating drives O to G without loss, so |G| = |O| and G is optimal. ∎

**Now the essential counter-drill.** Try the same proof with the greedy rule "earliest *start* time" and watch it fail — then construct the 2-interval counterexample it fails on. Doing this once teaches more than reading ten correct proofs, because it shows that the proof is *load-bearing*: the rule is right only because the exchange closes, and a different rule breaks it.

> **Discipline:** before trusting any greedy, spend two minutes either closing the exchange argument or constructing a ≤5-element counterexample. One of the two will happen. ([11_Greedy_vs_DP_Decision](../14_Mental_Models/11_Greedy_vs_DP_Decision.md))

### 5.3 Induction on subproblem size (for D&C and DP)

- **Base:** the smallest instances are correct by inspection.
- **Step:** assume the recursive calls return correct answers for smaller instances; show the combine step produces a correct answer for the current one.

This is the "leap of faith" of [recursion thinking](../14_Mental_Models/01_Recursion_Tree_Thinking.md) formalized: you verify *one* frame's combine logic, not the whole tree.

---

## 6. Knowing When You Are Done — Lower Bounds as a Design Tool

A lower bound is not academic trivia. It is **the stopping condition of the design loop.**

- Your algorithm is Θ(n log n) and the problem's lower bound is Ω(n log n) → **stop, you are optimal.**
- There is a gap → either keep designing, or prove the gap is inherent.

### 6.1 The three arguments that give you a floor

| Argument | Idea | Classic result |
| --- | --- | --- |
| **Information-theoretic** | The output must distinguish N cases; each operation yields limited information | Comparison sorting: log₂(n!) = Ω(n log n) |
| **Adversary** | An adversary answers queries to maximize your work while staying consistent | Finding max needs n−1 comparisons |
| **Reduction** | If solving A cheaply would solve known-hard B cheaply, A is at least as hard | 3SUM-hardness, NP-hardness |

### 6.2 The move that beats a lower bound: change the model

Every lower bound holds **within a model of computation**. When the floor blocks you, attack the model rather than the algorithm:

- Comparison sorting is Ω(n log n) → **radix/counting sort achieve O(n)** by not comparing (they use the values as addresses).
- Single-threaded lower bounds → parallel algorithms have different bounds.
- Exact answers are expensive → approximation changes the problem (§7).

> **The senior-level sentence:** *"That lower bound assumes a comparison model. If I may use the key values as array indices, it does not apply — and here is the O(n) counting-sort argument."* Knowing the assumptions in a lower bound is what lets you legitimately break it.

---

## 7. How New Algorithms Get Created *Today*

Classical algorithm design (exact, deterministic, sequential, offline) is a largely mature field. Active invention happens in five directions, each defined by *which classical assumption it drops*.

| Direction | Assumption dropped | Example results |
| --- | --- | --- |
| **Approximation** | Exact optimum | 2-approx for vertex cover; PTAS families; the reason NP-hardness is not the end of the story |
| **Randomization** | Determinism | Randomized quicksort, Karger's min-cut, primality testing |
| **Streaming / sublinear** | Full access to input | HyperLogLog, Count-Min, reservoir sampling — *decide with one pass and no memory* |
| **Parameterized** | Complexity measured only in n | FPT: hardness isolated in a parameter k, giving O(f(k)·n^c) |
| **Learning-augmented** | Worst-case-only analysis | Algorithms taking an ML prediction as a hint, with guarantees when it is wrong |

**Why this matters to you and not just to researchers:** these are exactly the moves available when your production problem is NP-hard or your data does not fit in memory. "This is NP-hard" is not a stopping point — it is a redirect to the approximation column. "The data is 40 TB" is a redirect to the streaming column. Recognizing which column your constraint sends you to is applied algorithm design.

---

## 8. Case Studies: Real Algorithm Invention

### 8.1 Dijkstra (1956) — the greedy insight

Dijkstra reportedly designed it in about twenty minutes at a café, without paper. The insight (step 4 of the loop): **among all unvisited nodes, the one with the smallest tentative distance already has its final distance**, because every alternative route would have to pass through another unvisited node whose distance is already ≥ it — and edges are non-negative.

That last clause is the structural property, and its violation is precisely why Dijkstra breaks on negative edges (a later negative edge can un-settle a settled node). **Knowing the property tells you the failure condition for free** — that is the payoff of naming it.

### 8.2 Quicksort (Hoare, 1959) — and the fix that took 40 years

Hoare's insight: partitioning around a pivot places one element permanently and splits the rest into independent subproblems (optimal substructure without overlap → divide & conquer, per §3).

The famous flaw — Θ(n²) on already-sorted input with a naive pivot — is a *design* flaw, not a bug, and the fixes trace the paradigm ladder: randomized pivot (randomization, §7), median-of-three (heuristic), then **introsort** (switch to heapsort past a depth limit — a hybrid that keeps quicksort's constants while capping the worst case). Modern languages ship the hybrid, and the history is a case study in adversarial thinking (§10 stage 4) arriving decades late.

### 8.3 PageRank (Page & Brin, 1996) — reduction as the whole idea

**Problem:** rank web pages by importance. **The reduction:** model importance as the stationary distribution of a random surfer — i.e. the principal eigenvector of the link matrix. Once phrased that way, the algorithm is *power iteration*, which was already a century old.

The invention was not a new procedure; it was **recognizing that a ranking problem is an eigenvector problem** (§3.1, transformation). This is the single highest-leverage design move in the chapter, and it is why breadth across mathematics pays.

### 8.4 Timsort (Tim Peters, 2002) — designed against real data

**Insight:** real-world arrays are rarely random; they contain pre-sorted *runs*. Merge sort ignores that structure entirely.

Timsort finds natural runs, extends short ones with insertion sort (which is genuinely faster below ~32–64 elements — better constants, cache-friendly, no allocation), then merges with a stack discipline. Result: **O(n) on already-sorted input**, Θ(n log n) worst case, stable.

Two lessons: (1) the "structure the brute force ignores" (§1) can be a property of your *data distribution*, not of the problem statement; (2) an invariant in a shipped algorithm was later found **incorrect by formal verification** (the 2015 merge-stack proof), which is a sobering endorsement of §10.

---

## 9. Worked Invention: Deriving Boyer–Moore Majority Vote From Nothing

**Do not read ahead.** This algorithm looks like a magic trick when presented finished; derived, it is forced.

### Step 1: Specify
Given an array of n elements where **some element appears more than n/2 times**, find it. Constraint: **O(n) time and O(1) extra space.**

### Step 2: Brute force
For each candidate, count its occurrences: O(n²). Or sort and take the middle: O(n log n) time, and sorting mutates or copies. Or a hash map of counts: O(n) time but **O(n) space** — violates the budget.

### Step 3: Repeated work / blocked row
The hash-map solution fails only on *space*. So the question sharpens: **what is the minimum information we must carry to identify the majority?** We clearly cannot store all counts. Can one candidate plus one counter suffice?

### Step 4: The structural property — this is the invention
The majority element appears **more than n/2** times. Therefore:

> If we repeatedly **remove a pair of two different elements**, the majority element remains the majority of what is left.

*Why:* removing two distinct elements removes at most one occurrence of the majority M. If M had count `c > n/2` in a set of size n, after removal it has ≥ `c−1` in size `n−2`, and `c−1 > (n−2)/2` follows directly from `c > n/2`. So the invariant "M is still a strict majority" survives every pairing-off. ∎

**That property is the algorithm.** Everything below implements it.

### Step 5: Implement the pairing without storing anything
We do not need to *physically* remove pairs — we only need to count how many unpaired copies of the current candidate remain.

```java
int majorityElement(int[] a) {
    int candidate = a[0];
    int count = 0;

    for (int x : a) {
        if (count == 0) {
            candidate = x;      // no unpaired copies left — adopt a new candidate
            count = 1;
        } else if (x == candidate) {
            count++;            // one more unpaired copy of the candidate
        } else {
            count--;            // pair x off against one copy of the candidate
        }
    }
    return candidate;           // guaranteed correct IF a majority exists
}
```

**Invariant (state it, per §5.1):** at every point, `count` equals the number of copies of `candidate` that remain unpaired after cancelling all the distinct-pairs seen so far. When `count` reaches 0, every element seen so far has been fully paired off — so the majority of the *remaining* suffix is still the majority of the whole (by step 4's property applied repeatedly), and we may restart cleanly.

**Cost:** one pass, two variables → **O(n) time, O(1) space.** ✅ Meets a contract that the hash-map approach could not.

### Step 6: Attack it (§10 stage 4)
What if **no** majority exists? The function still returns something — garbage. The precondition was load-bearing. The production-correct version adds a **verification pass**:

```java
// O(n) time, O(1) space, and now honest about its precondition.
Optional<Integer> majorityElement(int[] a) {
    int candidate = findCandidate(a);       // the loop above
    int occurrences = 0;
    for (int x : a) if (x == candidate) occurrences++;
    return occurrences > a.length / 2 ? Optional.of(candidate) : Optional.empty();
}
```

**This second pass is the part interviews probe and tutorials omit.** An algorithm with an unstated precondition is a landmine; naming and checking it is the difference between a puzzle answer and shippable code.

> **Extension (try it):** generalize to "find all elements appearing more than n/3 times." How many candidates and counters do you need, and *why* that number? The answer falls straight out of the step-4 property — which is the proof that you derived the algorithm rather than memorized it.

---

## 10. The Validation Protocol

| Stage | Question | Method |
| --- | --- | --- |
| **1. Correctness** | Does it always produce the right answer? | Invariant / exchange / induction (§5) |
| **2. Complexity** | What does it cost, in which case? | Recurrence + Master Theorem; state worst vs average vs amortized |
| **3. Optimality** | Can anything do better? | Compare against the lower bound (§6) |
| **4. Adversarial** | What input destroys it? | Construct it deliberately — see table below |
| **5. Differential** | Does it match a stupid-but-correct reference? | Random-input testing against brute force |

**Stage 4 targets by paradigm:**

| Your algorithm uses… | Build this input |
| --- | --- |
| Greedy | The case where the local choice is globally wrong |
| Randomization | A predictable seed / adversary-chosen input |
| Hashing | Colliding keys |
| A recursion | Depth that overflows the stack |
| An unstated precondition | An input violating it (§9 step 6) |
| Amortization | The sequence maximizing expensive-step frequency |

**Stage 5 is the highest-yield test you can write**, and it is the same discipline as [DS A5 §11](../02_Data_Structures/A5_Designing_Your_Own_Data_Structures.md):

```java
for (int t = 0; t < 1_000_000; t++) {
    int[] input = randomArray(rnd.nextInt(12));      // SMALL inputs find bugs faster
    assertEquals(bruteForce(input), myClever(input)); // brute force is the oracle
}
```

Small random inputs beat large ones: they hit edge cases at high density and produce counterexamples you can actually read.

---

## 11. When NOT To Design Your Own

| Situation | Do instead |
| --- | --- |
| A standard algorithm solves it | Use it. Its edge cases cost other people years. |
| A library implements it | Use the library — `Arrays.sort` is a tuned hybrid you will not beat |
| It is a known problem in disguise | **Reduce** to it (§3.1) — the strongest move available |
| It is NP-hard | Do not hunt for an exact polynomial algorithm; go to §7's approximation column |
| Only the constant factor hurts | Profile first ([14_Optimization_Pipeline](../14_Mental_Models/14_Optimization_Pipeline.md)) — the cost is usually memory access, not the algorithm |

**Legitimate triggers:** your constraints exclude every known algorithm; your data has an exploitable property the general algorithm ignores (Timsort's case); or you are learning — which is a complete justification, and is what the challenges below are for.

---

## 🏋️ Practice Challenges

**Challenge 1 — Derive, do not recall (§4).** Derive the recurrence for edit distance from the four questions. State the decision menu at the last step *explicitly* (there are three operations plus the match case) and the base cases with their meaning. Then reduce the space to O(min(m,n)) and say exactly which cell-read the reduction depends on.

**Challenge 2 — The exchange drill (§5.2).** For the fractional knapsack, prove the greedy (highest value/weight ratio first) optimal with an exchange argument. Then attempt the same proof for the **0/1** knapsack, watch precisely where it fails, and construct the 3-item counterexample. Write one sentence naming the property 0/1 lacks.

**Challenge 3 — Lower bound as a stop signal (§6).** You must find the two largest elements of an array. Design an algorithm using fewer than 2n comparisons. Then prove a lower bound of n + ⌈log₂n⌉ − 2 using a tournament/adversary argument, and check whether your algorithm meets it.

**Challenge 4 — Full loop (§2), hardest.** Given a stream of numbers of unknown length, sample k of them uniformly at random using O(k) space, with each element equally likely. Run all seven loop steps, prove uniformity by induction on stream length, then validate with a 1,000,000-trial frequency test.

<details>
<summary><strong>Challenge 4 — the derivation (attempt first)</strong></summary>

**Specify:** one pass, unknown n, O(k) space, exact uniformity.

**Brute force:** store everything, then sample → O(n) space. Fails the budget on space, not time — the §1.2 row is *"full recomputation / full retention ignoring incrementality"* → an **online/incremental** algorithm (§3.1).

**Structural property (step 4):** we cannot know n in advance, but we *can* maintain the invariant "the reservoir currently holds a uniform sample of everything seen so far." If each new element repairs that invariant, we never need n.

**Design — reservoir sampling (Vitter, 1985):**
```java
// Keep the first k. For element i (0-indexed, i ≥ k), keep it with
// probability k/(i+1), evicting a uniformly random current member.
T[] reservoir = new T[k];
int i = 0;
for (T item : stream) {
    if (i < k) {
        reservoir[i] = item;
    } else {
        int j = rnd.nextInt(i + 1);      // 0..i inclusive
        if (j < k) reservoir[j] = item;  // probability exactly k/(i+1)
    }
    i++;
}
```

**Proof by induction on stream length n:**
- *Base:* n = k — every element is in the reservoir with probability 1 = k/k. ✅
- *Step:* assume after n−1 elements each has probability k/(n−1). Element n is admitted with probability k/n by construction. An older element survives if either the new element is rejected (prob 1 − k/n) **or** it is admitted but evicts one of the other k−1 slots (prob (k/n)·((k−1)/k)). Total survival = (1 − k/n) + (k/n)((k−1)/k) = 1 − 1/n. So its final probability is (k/(n−1))·(1 − 1/n) = (k/(n−1))·((n−1)/n) = **k/n**. ✅ Uniform.

**Adversarial (stage 4):** a weak or predictable RNG destroys uniformity; and the `rnd.nextInt(i+1)` must be inclusive of i or the newest element can never be selected — an off-by-one that biases the sample subtly enough to pass casual testing. This is exactly why stage 5 (frequency testing over a million trials) exists.

</details>

---

## 📎 Cross-References

- [DS A5: Designing Your Own Data Structures](../02_Data_Structures/A5_Designing_Your_Own_Data_Structures.md) — the companion; algorithms and structures are designed together
- [A1: Correctness Proofs](A1_Correctness_Proofs.md) — the proof machinery of §5 in full
- [A2: Complexity From First Principles](A2_Complexity_FirstPrinciples.md) — recurrences and amortization
- [A3: Lower Bounds and NP](A3_Lower_Bounds_And_NP.md) — the floor that stops the design loop
- [A4: Randomized Algorithms](A4_Randomized_Algorithms.md) — the probabilistic paradigm of §7
- [01_Algorithm_Thinking](01_Algorithm_Thinking.md) — applying paradigms (this chapter creates them)
- [22_Brute_Force_To_Optimal](../14_Mental_Models/22_Brute_Force_To_Optimal_Playbook.md) — the optimization ladder §1.2 formalizes
- [00_ALGORITHM_TIMELINE](00_ALGORITHM_TIMELINE.md) — who invented what, and what forced it

---

**Navigation**: [← A4: Randomized Algorithms](A4_Randomized_Algorithms.md) | [📚 Algorithms Index](00_INDEX.md) | [← DS A5: Designing Your Own Data Structures](../02_Data_Structures/A5_Designing_Your_Own_Data_Structures.md)

---

## 🏢 Enterprise Lens — Designing Your Own Algorithms

| Area | What top-tier engineering looks like |
| ---- | ------------------------------------ |
| **Where it runs in production** | Library and system design, optimisation of hot paths, research prototypes |
| **Failure modes** | Over-engineering; skipping the reference test; ignoring adversarial inputs |
| **Testing and verification** | Property-based tests and fuzzing against the reference |

---

## Reality Check

**"Algorithm design starts with knowing many algorithms"** → It starts with the brute force and the question "what work does this repeat?" (§1.2). Knowing many algorithms helps you *recognize* a fit, and recognition alone stalls the moment the problem is one twist from anything you have seen. The derivation skill — brute force, find the repetition, name the property that permits skipping it — keeps working on problems nobody has catalogued, which is where production problems live.

**"If my greedy passes the examples, it is correct"** → Greedy failures hide in configurations that examples never contain, which is why the exchange argument (§5.2) is not optional ceremony. Two minutes spent either closing the argument or constructing a ≤5-element counterexample resolves it definitively; passing the provided examples resolves nothing. This is the single most common way a confident, clean, wrong solution reaches a judge or a code review.

**"The recurrence is the hard part of DP"** → The *state definition* is the hard part; the recurrence usually falls out mechanically once the state is right (§4.2 — the LIS state had to be redefined to "ending exactly at i" before anything worked). When a DP resists, the fault is almost always an under-specified state that omits something the future depends on — not the algebra of the transition.

**"Lower bounds are theory with no practical use"** → A lower bound is the stopping condition of the design loop (§6). Matching it means stop optimizing and ship; a gap means keep going. And knowing a bound's *model assumptions* is what lets you legitimately beat it — comparison sorting's Ω(n log n) is why radix sort's O(n) is not a contradiction but a change of model. Without lower bounds you cannot tell "I am done" from "I have not thought hard enough."

**"NP-hard means the problem is unsolvable, so stop"** → NP-hard means no known *exact polynomial* algorithm — which is a redirect, not a wall (§7). Real systems route to approximation with proven ratios, heuristics with empirical quality, exact solvers on the parameter that is actually small (FPT), or ILP/SAT solvers that are brutally effective on real instances despite the worst case. The professional response to NP-hardness is naming which of those four columns your constraints allow, not abandoning the problem.
