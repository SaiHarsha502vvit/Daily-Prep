# Dynamic Programming

> **Navigation**: [← Interval Problems](26_Interval_Problems.md) | [Chapter index](00_INDEX.md) | [SECTION 16: BIT MANIPULATION &… →](18_BitManipulation.md)

﻿**Navigation**: [< Previous](10_Graphs.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](12_Backtracking.md)


---

## 🔗 Bridge — Where This Chapter Fits

| Dimension | This chapter |
| --- | --- |
| **Builds on** | [DP Pattern Recognition](../04_Patterns_Templates/16_DP_Pattern_Recognition.md), [DP Fundamentals](../03_Algorithms/04b_DP_Fundamentals.md) |
| **You will learn** | Linear, grid, sequence, knapsack and interval DP with state definitions and recurrences |
| **Leads to** | [Backtracking](12_Backtracking.md), [Greedy](13_Greedy.md) |
| **Abstraction level** | Recursion with repeated calls → **state + transition + order** |

> [!NOTE]
> The full gap-free reading order and dependency graph are in the [Learning Path](00_LEARNING_PATH.md).

---

## 💬 Explain It Like a Study Partner — Dynamic Programming Problems

### 1. The bottom line

Name the subproblem, write the recurrence, fill the table in dependency order.

### 2. The textbook core

- State definition first.
- Base cases and fill order.
- Memoise recursion or tabulate.
- Reduce space by keeping only needed rows.
- Reconstruct the answer from parent pointers.

### 3. The real-world analogy

A **spreadsheet** where each cell is computed from earlier cells.

### 4. Walkthrough

1. House Robber `[2,7,9,3,1]`.
2. `dp[i] = max(dp[i−1], dp[i−2] + a[i])`.
3. Values: 2, 7, 11, 11, 12.
4. Answer 12.

> [!NOTE]
> **Quick check:** What is the most important sentence in a DP solution? *The state definition.*


### 5. Check yourself

**Q1.** Ways to climb 5 stairs taking 1 or 2 steps at a time?

<details><summary>Answer</summary>

**8** (Fibonacci: 1, 2, 3, 5, 8).

</details>

**Q2.** Fewest coins for 11 with `[1,2,5]`?

<details><summary>Answer</summary>

**3** (5 + 5 + 1).

</details>

---


## 🗺️ Pattern Recognition Header — Dynamic Programming

**DP Signal Words:** `minimum cost`, `maximum profit`, `number of ways`, `longest/shortest`, `can you reach`, `partition into`, `subsequence`, `subset sum`

**Quick Identification:**

```
1. Is there a CHOICE at each step?
2. Do SUBPROBLEMS OVERLAP? (computed multiple times)
3. Do you need MINIMUM/MAXIMUM/COUNT?
→ ALL YES? → DP
```

| DP Category  | State                                      | Trigger Words                              |
| ------------ | ------------------------------------------ | ------------------------------------------ |
| 1D Linear    | `dp[i]` = answer for first i               | Climbing stairs, house robber, coin change |
| 2D Grid      | `dp[i][j]` = answer at cell                | Unique paths, min path sum                 |
| Two Sequence | `dp[i][j]` = match i of s1, j of s2        | LCS, edit distance                         |
| Knapsack     | `dp[i][w]` = best with i items, capacity w | 0/1 knapsack, partition equal subset       |
| Subsequence  | `dp[i]` = best ending at i                 | LIS, word break                            |

- 📖 **Theory:** [04b_DP_Fundamentals.md](../03_Algorithms/04b_DP_Fundamentals.md)
- 📖 **Patterns:** [16_DP_Pattern_Recognition.md](../04_Patterns_Templates/16_DP_Pattern_Recognition.md)
- 📖 **Full Pattern Guide:** [00_PATTERN_MASTER_GUIDE.md](../04_Patterns_Templates/00_PATTERN_MASTER_GUIDE.md)

---

## 📚 SECTION 10: DYNAMIC PROGRAMMING PATTERNS

**DP FUNDAMENTALS**

```text
KEY PATTERNS:
1. 1D DP: Single array/sequence
2. 2D DP: Two sequences or grid
3. Interval DP: Subarray/substring problems
4. State Machine DP: Multiple states
5. Knapsack: Selection problems

APPROACH:
1. Define state: dp[i] = ?
2. Find recurrence: dp[i] = f(dp[i-1], ...)
3. Base case: dp[0] = ?
4. Build order: Bottom-up or Top-down
5. Optimize space if possible
```

---

## PART 0: WHY DP — The Most Feared Interview Topic & How to Tame It

## 📚 Topic Pages in This Chapter

This chapter is split into focused pages so each topic can be read on its own. Read them in order the first time; use the table to jump back later.

| # | Page | What is inside | Lines |
| --- | --- | --- | --- |
| 1 | [Why Is Dp The Most Feared Interview Topic](11_Dynamic_Programming/01_why_is_dp_the_most_feared.md) | Why Is Dp The Most Feared Interview Topic · The Core Insight: Overlapping Subproblems · The 4-Step Framework (Use For Every Dp… | 287 |
| 2 | [10.1 1D Dynamic Programming](11_Dynamic_Programming/02_dynamic_programming.md) | 10.1 1D Dynamic Programming | 247 |
| 3 | [10.2 2D Dynamic Programming](11_Dynamic_Programming/03_dynamic_programming.md) | 10.2 2D Dynamic Programming | 246 |
| 4 | [10.3 Knapsack Problems](11_Dynamic_Programming/04_knapsack_problems.md) | 10.3 Knapsack Problems | 146 |
| 5 | [10.4 Subsequence Problems](11_Dynamic_Programming/05_subsequence_problems.md) | 10.4 Subsequence Problems · 10.5 State Machine DP · Competitive Programming — Codeforces Problems · Real-World Applications of Dynamic Programming | 253 |

## Historical Evolution

**Dynamic Programming** was formalized by **Richard E. Bellman (1957)** while working at the **RAND Corporation** on multi-stage decision processes for military logistics and operations research. Bellman coined the term "dynamic programming" in his 1952 paper *"On the Theory of Dynamic Programming"* (Proceedings of the National Academy of Sciences) — the name was deliberately vague to disguise the work from Secretary of Defense Charles Wilson, who was hostile to mathematical research ("dynamic" sounded impressive; "programming" referred to planning, not computer code). Bellman's fundamental insight was the **Principle of Optimality**: *"An optimal policy has the property that whatever the initial state and initial decision are, the remaining decisions must constitute an optimal policy with regard to the state resulting from the first decision."* This is the formal statement of what we now call **optimal substructure** — the property that makes DP possible.

The technique was popularized through Bellman's 1957 book *"Dynamic Programming"* (Princeton University Press), which established the recurrence-table methodology now standard in DP implementations. **Robert Floyd** and **Stephen Warshall** independently discovered the **Floyd-Warshall all-pairs shortest-path algorithm in 1962** — both used DP over intermediate vertices, making it one of the earliest applications of the principle to graph problems. **Vint Cerf** (then a graduate student) is sometimes credited with independently rediscovering the technique for routing problems in **ARPANET** (1969-1971), though he didn't publish under the DP framework.

**Knuth optimization** was discovered by **Donald E. Knuth in 1971** and refined in his 1974 paper *"Optimum Binary Search Trees"* (Acta Informatica). Knuth proved that for DP recurrences satisfying the **quadrangle inequality** (also called the monotone matrix property), the optimal split point `k[i][j]` is non-decreasing in `i`, reducing the recurrence from O(n³) to O(n²). This was the first "DP optimization" — a class of techniques (Knuth, divide-and-conquer, SMAWK, convex hull, Aliens trick) that exploit structural properties of the recurrence to beat naive O(n³) bounds. The optimal binary search tree problem itself traces back to **Knuth Vol 3 "Sorting and Searching" (1973)**, which became the canonical reference for tree DP, sequence DP, and search-based DP recurrences.

**Modern practice** anchors this history: LeetCode's DP problem set (since 2015) covers the same patterns Bellman formalized — knapsack, LCS, edit distance, coin change — now used by 70%+ of FAANG candidates for interview prep. Competitive programming platforms (Codeforces, AtCoder) push the frontier into convex hull DP, profile DP, and bitmask DP, but the **Bellman optimal substructure principle** from 1957 remains the unifying theoretical foundation. Every DP you write today inherits Bellman's insight: optimal substructure + overlapping subproblems = DP. Cross-reference: see [`03_Algorithms/04a_DP_Internals.md`](../03_Algorithms/04a_DP_Internals.md) for the formal theory and [`04_Patterns_Templates/16_DP_Pattern_Recognition.md`](../04_Patterns_Templates/16_DP_Pattern_Recognition.md) for the pattern recognition framework.


---

## 🏢 Enterprise Lens — Dynamic Programming Problems

| Area | What top-tier engineering looks like |
| ---- | ------------------------------------ |
| **Where it runs in production** | Resource allocation, text diff, route planning |
| **Failure modes** | Vague state definition; wrong iteration order |
| **Testing and verification** | Compare with brute-force recursion for small inputs |

---

## Reality Check

**"DP problem practice means memorizing famous recurrences"** → The named problems (LIS, LCS, edit distance, coin change) are VOCABULARY; the practice target is the reduction step — recognizing that delete-and-earn is house-robber on values, that wiggle-subsequence collapses to two states, that stone-games reduce to interval DP with a difference trick. Interviews rarely serve a named problem straight; they serve one reduction away. Practice the reductions, index by state SHAPE (linear, two-sequence, interval, subset, digit), not by problem name.

**"If the recursion works, memoization is mechanical"** → Memoization is mechanical ONLY when the state is pure (fully determined by the memo key). The practice-level failures: keying on one variable while the recursion secretly depends on two (missed dimension — wrong answers), mutating shared structures across branches (memo poisons), and unbounded state (memoizing on a set). The debugging drill worth doing once: take a wrong memoized solution and find which hidden variable the key omitted — after two of those, you spot missing dimensions at design time.

**"LIS is an O(n squared) problem with an exotic optimization"** → The patience/tails method is not exotic — it is binary-search-on-a-maintained-invariant (tails[i] = smallest tail of any increasing subsequence of length i+1, provably sorted), and it is the required version at n = 10^5. The practice payoff is the invariant argument, which recurs in envelope-nesting (sort one axis, LIS the other with the tie-breaking DESCENDING trick) — a problem that is 80 percent sort-key design and 20 percent LIS.

**"Two-sequence DP tables are filled and that is that"** → The graded skill is reading ANSWERS OUT of the table beyond the corner cell: reconstructing the actual LCS or edit script (walk back through the argmin decisions), diffing (edit distance IS diff), and space-rolling while PRESERVING reconstructability (keep parent pointers or re-run). Production diff tools, spellcheckers, and DNA aligners are these table-walks industrialized; the interview follow-up "now print the edits" filters everyone who only filled cells.

**"State machine DP is a niche subfamily"** → Stock problems WITH cooldown/fee, paint-house, and vowels-count-in-strings are all tiny automata: a fixed set of modes, transitions with costs, DP over (position, mode). This is the most production-transferable DP shape — retry policies, UI wizards, and protocol handlers are literally automata with costs — and it is also the easiest hard-DP to explain aloud, because the states have names. When a problem mentions modes, cooldowns, or holding-vs-not, draw the automaton first; the code is a transcription.
