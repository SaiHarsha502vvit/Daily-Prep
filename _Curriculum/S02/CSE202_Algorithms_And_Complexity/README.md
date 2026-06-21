# CSE202 — Algorithms & Complexity

## Semester 2 · Computer Science Core

> **Total estimated time:** ~130 hours (16 weeks, ~8h/week)
> **Outcome:** You can derive algorithmic strategy from a problem's constraint structure, prove correctness with invariants, analyze tight asymptotic complexity, and recognize which algorithmic paradigm (divide-conquer, greedy, DP, graph) a problem demands.
> **Capstone:** Solve 100+ LeetCode problems organized by pattern; submit a written "algorithmic biography" explaining your strategy selection for 20 chosen problems.

---

## Navigation

| Course                                                                                  | Description |
| --------------------------------------------------------------------------------------- | ----------- |
| **[CSE201 — Data Structures](../CSE201_Data_Structures/README.md)**                    | Pairs with this course; DS provides the building blocks |
| **CSE202 — Algorithms & Complexity**                                                    | This course |
| **[CSE203 — Probability & Statistics](../CSE203_Probability_And_Statistics/README.md)** | S02 sibling; randomized algos rely on probability theory |
| **[CSE204 — Computer Architecture](../CSE204_Computer_Architecture/README.md)**         | S02 sibling; explains why constants matter despite Big-O |

| Related Modules                                | Cross-Reference                                                |
| ---------------------------------------------- | -------------------------------------------------------------- |
| `03_Algorithms/`                               | Primary source of truth — every chapter cited below            |
| `04_Patterns_Templates/`                       | Pattern triggers that map constraints to algorithm choice      |
| `05_Problem_Solving/`                          | 300+ problems organized by pattern for graded practice         |
| `02_Data_Structures/`                          | Prerequisite — DS provides operations algorithms compose       |
| `14_Mental_Models/`                            | "Reasoning ladders" for selecting strategy under unclear input |

---

## Prerequisites

- `CSE201 Data Structures` — Units 1-2 (arrays, hashmaps, linked lists, stacks, queues)
- `03_Algorithms/A2_Complexity_FirstPrinciples.md` §1-2 — Big-O from limits, not from rules
- `04_Patterns_Templates/00_PATTERN_MASTER_GUIDE.md` — constraint-first decision guide

**Constraint:** This course assumes you can already implement basic DS from scratch. If you can't write a working `HashMap` chaining implementation in 30 minutes, finish CSE201 Unit 1-2 first. Algorithm analysis built on shaky DS fluency leads to false confidence.

---

## 🗓️ Week-by-Week Plan

### UNIT 1 — Complexity, Correctness, Sorting (Weeks 1–3)

**Learning Outcomes:**

- State Big-O / Big-Θ / Big-Ω from limits, not from rules
- Prove algorithm correctness via loop invariants
- Implement merge sort, quicksort, heap sort; prove their bounds
- Reason about lower bounds for comparison-based sorting (Ω(n log n))

---

#### Week 1 — Big-O & Correctness Proofs

| Day | Topic                                          | Read                                                | Do                                                                          |
| --- | ---------------------------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------- |
| 1   | Asymptotic notation from limits                | `03_Algorithms/A2_Complexity_FirstPrinciples.md` §1 | Prove `2n² + 5n = Θ(n²)` from the definition (no shortcuts)                 |
| 2   | Recurrence relations & Master Theorem          | `03_Algorithms/A2_Complexity_FirstPrinciples.md` §2 | Solve `T(n) = 3T(n/4) + n²` three ways: tree, substitution, Master          |
| 3   | Akra-Bazzi for unequal subproblems              | `03_Algorithms/A2_Complexity_FirstPrinciples.md` §3 | Apply Akra-Bazzi to `T(n) = T(n/3) + T(2n/3) + n`                            |
| 4   | Loop invariants — correctness proofs           | `03_Algorithms/A1_Correctness_Proofs.md` §1-2       | Prove insertion sort correctness via loop invariant                          |
| 5   | Lab — Verify Big-O experimentally               | —                                                   | **Lab:** Plot runtime vs n for 3 algorithms; fit Big-O                       |
| 6–7 | Review + Problem Set ALG-PS1                    | —                                                   | `03_Algorithms/03_PROBLEM_SETS.md` PS-1                                     |

**Section Challenge (Big-O subtlety):**

> Two algorithms solve the same problem. A is O(n log n). B is O(n²). For n ≤ 100, B runs faster than A on real hardware. For n ≥ 10,000, A runs faster. Explain WHY Big-O doesn't predict which to pick — and what does.

<details>
<summary>Answer</summary>

```
BIG-O HIDES CONSTANTS AND LOWER-ORDER TERMS.
  Reality:  A runs in c_A · n log n + d_A
            B runs in c_B · n² + d_B

WHEN B WINS:
  If c_B << c_A (e.g., B is insertion sort: tight loop, no branching,
  predictable cache), and n is small enough that n² < n log n × (c_A/c_B):
  → B's constant advantage dominates.

  Example: insertion sort vs merge sort.
  Insertion: simple swap, 2 ops/iteration. Merge: allocate temp array,
  copy halves, merge. ~10× constant overhead.
  For n < ~30, insertion wins. This is why Java's Timsort SWITCHES to
  insertion sort for runs < 32.

WHAT DOES PREDICT THE WINNER:
  1. Asymptotic complexity (Big-O) tells you what happens for large n
  2. Hidden constants tell you what happens for small n
  3. Cache behavior tells you what happens for "real" n
  4. Branch prediction tells you what happens on real CPUs

INTERVIEW IMPLICATION:
  "Use insertion sort for n < 32" is not a hack — it's the explicit
  recognition that asymptotic analysis lies for small inputs.
  Production sort algorithms (Timsort, IntroSort, PDQSort) all
  implement hybrid strategies for this exact reason.
```

</details>

---

#### Week 2 — Sorting Algorithms

| Day | Topic                                  | Read                                                   | Do                                                                  |
| --- | -------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------- |
| 1   | Merge sort — divide-conquer template   | `03_Algorithms/02a_Sorting_Fundamentals.md` §1-2       | Implement merge sort iteratively; prove O(n log n) via recurrence    |
| 2   | Quicksort — partition; worst case      | `03_Algorithms/02a_Sorting_Fundamentals.md` §3         | Why is naive pivot O(n²)? Implement median-of-three                  |
| 3   | Heap sort — in-place O(n log n)        | `03_Algorithms/02b_Sorting_Internals.md` §1            | Trace heap-sort on [5,2,8,1,9,3] step by step                        |
| 4   | Lower bound Ω(n log n) for comparison sort | `03_Algorithms/A3_Lower_Bounds_And_NP.md` §1        | Prove via decision tree argument                                     |
| 5   | Non-comparison sorts — counting, radix | `03_Algorithms/02b_Sorting_Internals.md` §2-3          | When does radix beat O(n log n)? (small key range)                   |
| 6–7 | Review + Problem Set ALG-PS2           | —                                                      | `03_Algorithms/03_PROBLEM_SETS.md` PS-2                              |

---

#### Week 3 — Searching & Two Pointers

| Day | Topic                                | Read                                              | Do                                                       |
| --- | ------------------------------------ | ------------------------------------------------- | -------------------------------------------------------- |
| 1   | Binary search invariant              | `03_Algorithms/06_Binary_Search_Pattern.md` §1-3  | Prove correctness via loop invariant on [lo, hi)         |
| 2   | Binary search on answer space        | `04_Patterns_Templates/06_BinarySearch_OnAnswer.md` | Solve: minimum capacity to ship within D days            |
| 3   | Two pointers — when applicable       | `04_Patterns_Templates/01_TwoPointer_Symmetric.md` | Trace: container with most water                         |
| 4   | Sliding window — fixed and variable  | `04_Patterns_Templates/02_SlidingWindow_Counting.md` | Solve: longest substring without repeating               |
| 5   | Lab + Review                         | —                                                 | Lab: search in rotated sorted array                      |
| 6–7 | Review + Problem Set ALG-PS3         | —                                                 | `03_Algorithms/03_PROBLEM_SETS.md` PS-3                  |

---

### UNIT 2 — Recursion, Backtracking, Divide & Conquer (Weeks 4–6)

**Learning Outcomes:**

- Convert iterative algorithms to recursive form and back
- Recognize when recursion is essential (tree structure) vs ornamental (loop equivalent)
- Implement backtracking with state restoration; prune the search space
- Apply divide & conquer beyond sorting: closest pair, fast multiplication

---

#### Week 4 — Recursion Internals

| Day | Topic                              | Read                                              | Do                                                       |
| --- | ---------------------------------- | ------------------------------------------------- | -------------------------------------------------------- |
| 1   | Call stack mechanics; recursion as state machine | `03_Algorithms/03a_Recursion_Internals.md` §1-2 | Hand-trace recursive `fib(5)` showing the stack frames    |
| 2   | Recursion → iteration via explicit stack | `03_Algorithms/03a_Recursion_Internals.md` §3 | Convert recursive `inorder()` to iterative with `Stack<State>` |
| 3   | Tail recursion and TCO              | `03_Algorithms/03a_Recursion_Internals.md` §4    | Why does Java not do TCO? Explain JVM limitation         |
| 4   | Recursion-to-DP bridge              | `03_Algorithms/03b_Recursion_Fundamentals.md` §1 | Memoize recursive `fib`; show O(2ⁿ) → O(n)              |
| 5–7 | Review + Problem Set ALG-PS4        | —                                                 | `03_Algorithms/03_PROBLEM_SETS.md` PS-4                  |

---

#### Week 5 — Backtracking

| Day | Topic                                  | Read                                                | Do                                                       |
| --- | -------------------------------------- | --------------------------------------------------- | -------------------------------------------------------- |
| 1   | Backtracking template — choose/explore/unchoose | `03_Algorithms/11_Backtracking.md` §1-2 | Implement N-Queens                                       |
| 2   | State restoration — invariant proof    | `04_Patterns_Templates/19_Backtracking_Plus_Pruning.md` | Why must we undo the move? Prove via stack invariant     |
| 3   | Subsets, permutations, combinations    | `05_Problem_Solving/22_Recursion_Subsets.md`        | Implement all three; understand the structural difference |
| 4   | Pruning — bound + dominance + symmetry | `03_Algorithms/11_Backtracking.md` §4               | Add pruning to N-Queens; measure speedup                 |
| 5–7 | Review + Problem Set ALG-PS5           | —                                                   | `03_Algorithms/03_PROBLEM_SETS.md` PS-5                  |

---

#### Week 6 — Divide & Conquer (beyond sorting)

| Day | Topic                                  | Read                                              | Do                                                       |
| --- | -------------------------------------- | ------------------------------------------------- | -------------------------------------------------------- |
| 1   | D&C template — combine non-trivially    | `03_Algorithms/A2_Complexity_FirstPrinciples.md` §4 | Closest pair of points in O(n log n)                     |
| 2   | Strassen's matrix multiply              | `03_Algorithms/A2_Complexity_FirstPrinciples.md` §5 | Why Θ(n^2.81), not Θ(n³)?                                |
| 3–7 | Review + Problem Set ALG-PS6            | —                                                 | `03_Algorithms/03_PROBLEM_SETS.md` PS-6                  |

---

### UNIT 3 — Dynamic Programming (Weeks 7–10)

**Learning Outcomes:**

- Recognize DP triggers: optimal substructure + overlapping subproblems
- Derive a DP recurrence from a brute-force recursive solution
- Master 1D DP, 2D DP (grid), interval DP, tree DP, bitmask DP
- Implement both top-down (memoization) and bottom-up (tabulation); pick the right one

---

#### Week 7 — DP Derivation Method

| Day | Topic                                | Read                                              | Do                                                       |
| --- | ------------------------------------ | ------------------------------------------------- | -------------------------------------------------------- |
| 1   | Why DP works — optimal substructure  | `03_Algorithms/04a_DP_Internals.md` §1-2          | Why doesn't shortest-path-with-negative-cycles have OS?  |
| 2   | Brute → memo → tabulate              | `03_Algorithms/04a_DP_Internals.md` §3            | Convert recursive `fib` to iterative with O(1) space     |
| 3   | DP state design — what to remember   | `03_Algorithms/04b_DP_State_Design.md`            | Climb stairs with cost; identify state                   |
| 4   | DP on subsequences vs subarrays      | `03_Algorithms/04c_DP_Variants.md` §1             | LIS, LCS — see the state difference                      |
| 5–7 | Review + Problem Set ALG-PS7         | —                                                 | `03_Algorithms/03_PROBLEM_SETS.md` PS-7                  |

**Section Challenge (DP state design):**

> "Climb stairs taking 1 or 2 steps. How many ways to reach step N?" is famously O(n) DP. Modify the problem: "you can take 1, 2, or 3 steps BUT cannot take two 1-steps in a row." Now what is the DP state? Why does the naive state `dp[i] = ways to reach i` fail?

<details>
<summary>Answer</summary>

```
WHY NAIVE STATE FAILS:
  dp[i] = ways to reach step i
  Transitions: dp[i] = dp[i-1] + dp[i-2] + dp[i-3]
  But dp[i-1] includes paths where the LAST step was a 1-step.
  If we then add a 1-step to reach i, we've violated "no two 1-steps in a row."
  The constraint depends on HOW we arrived at i-1, which the state doesn't track.

THE FIX — ENRICH THE STATE:
  dp[i][last] = ways to reach i where the last step was `last` (1, 2, or 3)

TRANSITIONS:
  dp[i][1] = dp[i-1][2] + dp[i-1][3]    -- can't follow a 1 with a 1
  dp[i][2] = dp[i-2][1] + dp[i-2][2] + dp[i-2][3]
  dp[i][3] = dp[i-3][1] + dp[i-3][2] + dp[i-3][3]

ANSWER:
  dp[N][1] + dp[N][2] + dp[N][3]

PRINCIPLE:
  The state must capture EVERYTHING about the past that the future depends on.
  When the constraint is "depends on the previous decision," the state must
  include the previous decision. This is the universal DP design lesson.
```

</details>

---

#### Week 8 — 2D DP & Grids

`03_Algorithms/04c_DP_Variants.md` §2-3 — unique paths, edit distance, longest common subsequence, knapsack.

#### Week 9 — Interval DP & Tree DP

`03_Algorithms/04c_DP_Variants.md` §4-5 — matrix chain, palindrome partitioning; tree DP for diameter, rerooting.

#### Week 10 — Bitmask DP & Advanced

`03_Algorithms/04c_DP_Variants.md` §6 — TSP via bitmask; profile DP.

---

### UNIT 4 — Graph Algorithms (Weeks 11–13)

**Learning Outcomes:**

- Implement Dijkstra, Bellman-Ford, Floyd-Warshall; know when to use each
- Build MST via Kruskal (UF) and Prim (heap); prove cut property
- Implement topological sort both ways (Kahn BFS + DFS post-order)
- Detect bridges, articulation points, SCCs

#### Week 11 — Shortest Paths

`03_Algorithms/05c_Graphs_Fundamentals.md` + `05d_Graphs_Advanced_Algos.md`.

#### Week 12 — MST + Network Flow Preview

`03_Algorithms/05d_Graphs_Advanced_Algos.md` §3-5.

#### Week 13 — SCC, Bridges, Articulation

`03_Algorithms/05e_Graphs_Patterns.md`.

---

### UNIT 5 — Lower Bounds, NP, Randomization (Weeks 14–16)

`03_Algorithms/A3_Lower_Bounds_And_NP.md` + `A4_Randomized_Algorithms.md`.

**Capstone Project:** [CAP01 — DSA Toolkit](../../../00_CURRICULUM/PROJECTS/CAP01_DSA_Toolkit.md) — extends the CSE201 capstone with algorithms layered on top.

---

## Problem Sets

All problem sets in [`03_Algorithms/03_PROBLEM_SETS.md`](../../../03_Algorithms/03_PROBLEM_SETS.md):

| Unit | Problem Sets   | Topic                         |
| ---- | -------------- | ----------------------------- |
| 1    | ALG-PS1, 2, 3  | Sorting, searching, two-ptrs  |
| 2    | ALG-PS4, 5, 6  | Recursion, backtracking, D&C  |
| 3    | ALG-PS7, 8, 9  | DP (1D, 2D, interval/tree)    |
| 4    | ALG-PS10, 11   | Graph algorithms              |
| 5    | ALG-PS12       | Randomized + advanced         |

## Exam Prep

- [`00_CURRICULUM/EXAM_BANK.md`](../../../00_CURRICULUM/EXAM_BANK.md) — S02 algorithm questions
- [`03_Algorithms/16_DSA_Deep_Reasoning.md`](../../../03_Algorithms/16_DSA_Deep_Reasoning.md) — interview freeze moments

## University Methodology Layer

Read these IN PARALLEL with the weekly chapters:

| File | Maps to syllabus topic |
|------|------------------------|
| [A1 — Correctness Proofs](../../../03_Algorithms/A1_Correctness_Proofs.md) | Loop invariants, induction, partial vs total correctness |
| [A2 — Complexity from First Principles](../../../03_Algorithms/A2_Complexity_FirstPrinciples.md) | Big-O from limits, Master Theorem, Akra-Bazzi |
| [A3 — Lower Bounds & NP](../../../03_Algorithms/A3_Lower_Bounds_And_NP.md) | Ω(n log n) sort, P vs NP, reductions |
| [A4 — Randomized Algorithms](../../../03_Algorithms/A4_Randomized_Algorithms.md) | Las Vegas vs Monte Carlo, random pivots, randomized rounding |
