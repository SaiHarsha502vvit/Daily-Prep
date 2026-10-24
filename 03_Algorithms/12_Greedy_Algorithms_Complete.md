> **Navigation**: [← Backtracking](11_Backtracking_Complete.md) | [Chapter index](00_INDEX.md) | [Monotonic Stack & Queue →](15_Monotonic_Stack_Queue_Complete.md)

# 🎯 Greedy Algorithms Complete Guide

## 🔗 Bridge — Where This Chapter Fits

| Dimension | This chapter |
| --- | --- |
| **Builds on** | [DP Fundamentals](04b_DP_Fundamentals.md), [A1 exchange arguments](A1_Correctness_Proofs.md) |
| **You will learn** | When locally optimal choices are globally optimal: interval scheduling, Huffman, fractional knapsack, MST, matroids |
| **Leads to** | [Union-Find](14_Union_Find_DSU_Complete.md) (Kruskal), [Approximation](25_Online_Approximation_And_Linear_Programming.md) |
| **Abstraction level** | L2: choosing the right paradigm and proving it |

> [!NOTE]
> The full gap-free reading order and dependency graph are in the [Learning Path](00_LEARNING_PATH.md).

---

## 💬 Explain It Like a Study Partner — Greedy Algorithms

### 1. The bottom line

A greedy algorithm takes the best-looking choice now, and it is correct only if you can prove that choice never hurts.

### 2. The textbook core

- **Greedy-choice property** + **optimal substructure** = greedy works.
- Proof tool: **exchange argument** (swap an optimal solution toward the greedy one).
- Matroids characterise exactly when a simple greedy is optimal for max-weight independent sets.
- If a proof fails, switch to DP.

### 3. The real-world analogy

Packing a **suitcase with the most valuable-per-weight items** when you may cut items (fractional knapsack): grab the best ratio first.

### 4. Walkthrough

1. Interval scheduling: sort meetings by **end time**.
2. Pick the earliest-ending meeting; discard overlaps.
3. Repeat with the next meeting that starts after the last chosen end.
4. Exchange argument: any optimal schedule can swap its first meeting for the earliest-ending one.

> [!NOTE]
> **Quick check:** Why does sorting by start time fail for interval scheduling? *A long early meeting can block many short ones.*

---


Make the Locally Optimal Choice at Each Step

### 5. Check yourself

**Q1.** Show that greedy coin change fails for coins `{1, 3, 4}` and amount 6.

<details><summary>Answer</summary>

Greedy takes 4 + 1 + 1 = 3 coins, but 3 + 3 = 2 coins is optimal.

</details>

**Q2.** In Huffman coding, which two nodes are merged at each step?

<details><summary>Answer</summary>

The two with the lowest frequencies.

</details>


## Table of Contents

0. [PART 0: Complete Understanding](#part-0)
1. [What is Greedy?](12_Greedy_Algorithms_Complete/02_greedy_template_code_the_skeleton.md#what-is-greedy)
2. [When Does Greedy Work?](12_Greedy_Algorithms_Complete/02_greedy_template_code_the_skeleton.md#when-greedy-works)
3. [Classic Greedy Patterns](12_Greedy_Algorithms_Complete/02_greedy_template_code_the_skeleton.md#classic-patterns)
4. [Scheduling Problems](12_Greedy_Algorithms_Complete/03_scheduling_problems.md#scheduling)
5. [Interval Problems](12_Greedy_Algorithms_Complete/04_interval_problems.md#intervals)
6. [Array Greedy Problems](12_Greedy_Algorithms_Complete/05_array_greedy_problems.md#array-greedy)
7. [String Greedy Problems](12_Greedy_Algorithms_Complete/06_string_greedy_problems.md#string-greedy)
8. [Graph Greedy Algorithms](12_Greedy_Algorithms_Complete/07_graph_greedy_algorithms.md#graph-greedy)
9. [Interview Problems](12_Greedy_Algorithms_Complete/07_graph_greedy_algorithms.md#interview-problems)
10. [Greedy vs DP](12_Greedy_Algorithms_Complete/07_graph_greedy_algorithms.md#greedy-vs-dp)
11. [Practice Problems](12_Greedy_Algorithms_Complete/07_graph_greedy_algorithms.md#practice-problems)

---

## 🎓 University Proof Corner

> **MIT 6.046J / KTH DD2352 / RWTH Aachen Algo II layer** — Why greedy algorithms are provably optimal, and a precise test for when they fail.

### Correctness: The Exchange Argument

The standard proof method for any greedy algorithm:

1. **Assume** the greedy solution G and some optimal solution OPT differ — i.e., OPT makes a different choice at the first point of divergence.
2. **Transform** OPT into G one step at a time by "exchanging" OPT's choice for the greedy choice at that step.
3. **Show** each exchange does not worsen the objective value.
4. **Conclude** G is at least as good as OPT — so G is optimal. ✓

### Worked Example: Activity Selection (Earliest Deadline First)

**Claim**: Selecting the activity that finishes earliest and recursing on the rest gives a maximum-size compatible subset.

**Exchange argument proof**:
- Let G = {a₁, a₂, ..., aₖ} (greedy, sorted by finish time), OPT = {b₁, b₂, ..., bₘ} (any optimal set, sorted by finish time).
- Goal: show k ≥ m (greedy is at least as large).
- **Key lemma**: For each prefix i, finish(aᵢ) ≤ finish(bᵢ). Proof by induction: a₁ has the earliest possible finish time; given aᵢ finishes ≤ bᵢ, there is at least as much room for aᵢ₊₁ as for bᵢ₊₁, so finish(aᵢ₊₁) ≤ finish(bᵢ₊₁).
- If k < m: greedy stopped early, but bₖ₊₁ starts after finish(bₖ) ≤ finish(aₖ) — so bₖ₊₁ is compatible with G's choices. Greedy would have picked it. Contradiction. So k ≥ m. ✓

### When Greedy Fails: Counterexample Pattern

Greedy fails when a locally optimal early choice **blocks a globally better future choice**. Classic example:

- **Coin change with non-standard denominations** {1, 3, 4}: making change for 6.
  - Greedy (largest first): 4 + 1 + 1 = 3 coins.
  - Optimal: 3 + 3 = 2 coins.
- The exchange argument breaks: choosing 4 blocks the pair of 3s.

**Test before assuming greedy works**: try to construct an exchange; if the exchange can worsen the objective, greedy is wrong here.

> Full proof methodology: [A1 — Algorithm Correctness](A1_Correctness_Proofs.md) (Section 5: Exchange Argument)

- 📎 **Reference Anchor**: [OpenJDK PriorityQueue](https://github.com/openjdk/jdk/blob/master/src/java.base/share/classes/java/util/PriorityQueue.java)
- **Invariant learned**: `PriorityQueue` is a min-heap (by default) with the heap invariant maintained by `siftUp` on offer and `siftDown` on poll. Greedy algorithms that always process the locally optimal element (smallest cost, earliest deadline, largest profit) typically delegate the "next best" decision to a `PriorityQueue` — this is the structural link between the greedy proof's "optimal choice" step and the concrete Java data structure.
- **Local rewrite**: Activity Selection (this chapter's Proof Corner) uses an implicit greedy choice: always pick the activity with the earliest finish time. In code, pre-sort by finish time once — no PriorityQueue needed — because the sort establishes the invariant the greedy choice relies on.
- **Constraint warning**: `PriorityQueue` does NOT guarantee iteration order; `iterator()` returns elements in "some order." Only `poll()` is guaranteed to return the minimum. Using a for-each loop to process in priority order is a common bug.

---

## PART 0: COMPLETE UNDERSTANDING — The WHY Before the WHAT <a name="part-0"></a>

## 📚 Topic Pages in This Chapter

This chapter is split into focused pages so each topic can be read on its own. Read them in order the first time; use the table to jump back later.

| # | Page | What is inside | Lines |
| --- | --- | --- | --- |
| 1 | [What Problem Does Greedy Solve](12_Greedy_Algorithms_Complete/01_what_problem_does_greedy_solve.md) | What Problem Does Greedy Solve · Real-World Origin Story · The Two Required Properties · How To Prove Greedy Works: Three Methods · Greedy Fails" — Full Worked Example · … | 337 |
| 2 | [Greedy Template Code — The Skeleton](12_Greedy_Algorithms_Complete/02_greedy_template_code_the_skeleton.md) | Greedy Template Code — The Skeleton · What is Greedy? · When Does Greedy Work? · Classic Greedy Patterns | 390 |
| 3 | [Scheduling Problems](12_Greedy_Algorithms_Complete/03_scheduling_problems.md) | Scheduling Problems | 146 |
| 4 | [Interval Problems](12_Greedy_Algorithms_Complete/04_interval_problems.md) | Interval Problems | 125 |
| 5 | [Array Greedy Problems](12_Greedy_Algorithms_Complete/05_array_greedy_problems.md) | Array Greedy Problems | 193 |
| 6 | [String Greedy Problems](12_Greedy_Algorithms_Complete/06_string_greedy_problems.md) | String Greedy Problems | 160 |
| 7 | [Graph Greedy Algorithms](12_Greedy_Algorithms_Complete/07_graph_greedy_algorithms.md) | Graph Greedy Algorithms · Interview Problems · Greedy vs DP · Practice Problems · Quick Reference · … | 465 |

## 🏢 Enterprise Lens — Greedy Algorithms

| Area | What top-tier engineering looks like |
| ---- | ------------------------------------ |
| **Where it runs in production** | Schedulers, compression (Huffman), network design (MST), load balancing heuristics |
| **Failure modes** | Using greedy where the exchange argument fails (0/1 knapsack, coin change with odd denominations) |
| **Testing and verification** | Compare against a DP/brute-force optimum on random small cases |

---

## Reality Check

**"If it optimises something, greedy works"** → Greedy only works with proof of the greedy-choice property. The classic test: can you always swap a non-greedy choice for the greedy choice without worsening the solution? If yes (exchange argument), greedy is correct. Without this proof, you are guessing — and the guess is often wrong (fractional knapsack: greedy works; 0/1 knapsack: greedy fails).

**"Greedy is always faster than DP"** → Greedy is typically O(n log n) or O(n) — yes, faster than DP's O(n²) or O(n*k). But greedy is only applicable to a subset of problems. When both apply (e.g., Dijkstra vs Bellman-Ford for shortest path with non-negative weights), greedy wins on speed. When only DP applies, greedy gives wrong answers regardless of speed.

**"Kruskal's and Prim's both build MSTs — they're the same algorithm"** → Both produce a minimum spanning tree but work differently. Kruskal's sorts all edges and adds them if they don't form a cycle (uses Union-Find). Prim's grows a tree from one vertex by always adding the minimum-weight edge connecting the tree to a non-tree vertex (uses a priority queue). Performance difference: Kruskal's O(E log E); Prim's with binary heap O(E log V) — Prim's better for dense graphs, Kruskal's for sparse.

**"Activity selection: always pick the activity with the shortest duration"** → Wrong greedy. The correct greedy for maximum number of non-overlapping activities: always pick the activity with the **earliest finish time** (not shortest duration, not earliest start). Proof: earliest-finish-time leaves the maximum remaining time for subsequent activities. Shortest duration does NOT maximise count — a 1-hour activity at midnight doesn't help if it's followed by nothing.

**"Huffman coding always produces optimal prefix codes"** → Yes — Huffman coding is provably optimal for fixed-symbol variable-length prefix-free codes. But it is NOT optimal if you allow grouping symbols into blocks first (arithmetic coding achieves closer to entropy). For practical compression, Huffman is used as one stage within larger algorithms (LZ77 + Huffman = DEFLATE used in zip/gzip/PNG).
