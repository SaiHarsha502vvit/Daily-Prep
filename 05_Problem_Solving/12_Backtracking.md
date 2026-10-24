# Backtracking

> **Navigation**: [← SECTION: RECURSION & SUBSETS…](22_Recursion_Subsets.md) | [Chapter index](00_INDEX.md) | [Trees →](09_Trees.md)

﻿> **Navigation**: [< Previous](11_Dynamic_Programming.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](13_Greedy.md)


---

## 🔗 Bridge — Where This Chapter Fits

| Dimension | This chapter |
| --- | --- |
| **Builds on** | [Backtracking pattern](../04_Patterns_Templates/17_Backtracking_Plus_Pruning.md), [Recursion](22_Recursion_Subsets.md) |
| **You will learn** | Permutations, combinations, subsets, N-Queens, Sudoku-style constraint search and pruning |
| **Leads to** | [Dynamic Programming](11_Dynamic_Programming.md) |
| **Abstraction level** | Enumerate everything → **abandon impossible branches early** |

> [!NOTE]
> The full gap-free reading order and dependency graph are in the [Learning Path](00_LEARNING_PATH.md).

---

## 💬 Explain It Like a Study Partner — Backtracking Problems

### 1. The bottom line

Build a candidate step by step, undo each step after exploring it, and stop as soon as a constraint fails.

### 2. The textbook core

- Choose → explore → unchoose.
- Prune with bounds and constraints.
- Sort and skip equal siblings to avoid duplicates.
- Cost is output-sensitive and can be exponential.
- Memoise if subproblems repeat.

### 3. The real-world analogy

A **maze explorer with chalk marks**.

### 4. Walkthrough

1. Combination sum for `[2,3,6,7]`, target 7.
2. Pick 2 → remaining 5; pick 2 → 3; pick 3 → 0 → `[2,2,3]`.
3. Backtrack and pick 7 → 0 → `[7]`.
4. Prune when remaining < 0.

> [!NOTE]
> **Quick check:** Why sort before pruning on sums? *Once a candidate is too large, all later ones are too.*


### 5. Check yourself

**Q1.** How many permutations of `[1,2,3]`?

<details><summary>Answer</summary>

**6**.

</details>

**Q2.** Combination sum for `[2,3,6,7]`, target 7?

<details><summary>Answer</summary>

`[[2,2,3],[7]]`.

</details>

---


## 🗺️ Pattern Recognition Header — Backtracking

> **Is this a Backtracking problem?**

| Signal                             | Type           | Template                                    |
| ---------------------------------- | -------------- | ------------------------------------------- |
| `generate ALL subsets / power set` | Subsets        | start from `i+1`, always add to result      |
| `generate ALL combinations of k`   | Combinations   | start from `i+1`, add when `path.size()==k` |
| `generate ALL permutations`        | Permutations   | `boolean[] used`, start from 0              |
| `partition into valid parts`       | Partition BT   | Try every cut, check validity               |
| `N-Queens / Sudoku solver`         | Constraint Sat | isValid() + backtrack                       |

> **The 3-Step Mental Model:**
>
> ```
> 1. CHOOSE   → Add option to current path
> 2. EXPLORE  → Recurse to next decision
> 3. UNCHOOSE → Remove from path (this is the "backtrack"!)
>
> DP vs Backtracking:
>   COUNT/BEST of combos → DP
>   LIST ALL actual combos → Backtracking
> ```
>
> 📖 **Mental Model:** [01_Recursion_Tree_Thinking.md](../14_Mental_Models/01_Recursion_Tree_Thinking.md)
> 📖 **Greedy vs DP Decision:** [11_Greedy_vs_DP_Decision.md](../14_Mental_Models/11_Greedy_vs_DP_Decision.md)
> 📖 **Full Pattern Guide:** [00_PATTERN_MASTER_GUIDE.md](../04_Patterns_Templates/00_PATTERN_MASTER_GUIDE.md)

---

> 🔬 **Section Challenge — 🗺️ Pattern Recognition Header — Backtracking**

**Challenge 1 (Reasoning):** The pattern table says subsets use `start from i+1` while permutations use `boolean[] used`. Why can't permutations just use `start from 0` without a used array?

<details><summary>Answer</summary>

If permutations used `start from 0` without tracking, the loop would revisit already-placed elements. For `[1,2,3]`: after choosing 1 at position 0, the recursive call starts from 0 again and picks 1 _again_ → `[1,1,...]`. The `used[]` array prevents this: `used[0]=true` blocks re-selection of index 0. Subsets don't need `used[]` because `start=i+1` inherently moves forward — you never revisit earlier indices. The deep insight: **subsets care about which elements are IN the set (order doesn't matter)**, so forward-only traversal avoids duplicates naturally. **Permutations care about ORDER**, so every position must consider every unused element.

</details>

## 📚 SECTION 11: BACKTRACKING PROBLEMS

## 📚 Topic Pages in This Chapter

This chapter is split into focused pages so each topic can be read on its own. Read them in order the first time; use the table to jump back later.

| # | Page | What is inside | Lines |
| --- | --- | --- | --- |
| 1 | [Backtracking Template](12_Backtracking/01_backtracking_template.md) | Backtracking Template · WHY Backtracking — The Algorithm for… · When Is Backtracking The Answer · The Mental Model: Decision Tree Exploration | 231 |
| 2 | [11.1 Subsets & Combinations](12_Backtracking/02_subsets_combinations.md) | 11.1 Subsets & Combinations · 11.2 Permutations | 346 |
| 3 | [11.3 String Backtracking](12_Backtracking/03_string_backtracking.md) | 11.3 String Backtracking | 173 |
| 4 | [11.4 Grid Backtracking](12_Backtracking/04_grid_backtracking.md) | 11.4 Grid Backtracking · Competitive Programming — Codeforces Problems · Real-World Applications of Backtracking | 318 |

## 🏢 Enterprise Lens — Backtracking Problems

| Area | What top-tier engineering looks like |
| ---- | ------------------------------------ |
| **Where it runs in production** | Constraint solvers, puzzle generators, test generation |
| **Failure modes** | Forgetting to undo; shared mutable state; no pruning |
| **Testing and verification** | Count results against known formulas |

---

## Reality Check

**"More backtracking practice means faster enumeration writing"** → The practice target is the STATE-SPACE DESIGN, not the loop: what is a partial solution, which extensions are legal, what proves a dead end. Subsets/permutations/combinations differ ONLY in those three answers (start-index discipline vs used-array vs count-bound). Candidates who can recite all three templates but cannot design the space for a NOVEL puzzle (expression-add-operators, matchsticks-to-square) practiced the wrong layer.

**"Word search and N-Queens are unrelated set pieces"** → They drill the two board-marking disciplines: word-search teaches unmark-on-exit (the same cell serves many paths), queens teaches constraint SETS (columns, two diagonal families indexed by r-c and r+c) that make legality O(1). Every board/grid backtracking problem is a combination of those two disciplines — sudoku uses both simultaneously (mark-unmark AND row/col/box sets). Two problems, two transferable mechanics, every other board puzzle a remix.

**"Palindrome partitioning is a string problem that happens to backtrack"** → It is the canonical PRECOMPUTE-THEN-BACKTRACK specimen: the O(n squared) isPalindrome table computed once turns each legality check from O(n) to O(1), changing the whole enumeration's budget. The generalizable lesson — hoist repeated validity work out of the recursion — separates solutions that pass from solutions that are architecturally identical and time out. Expression-add-operators teaches the sibling lesson (carry running values instead of re-evaluating).

**"Combination-sum variants blur together"** → They form a 2x2 the guards encode exactly: reuse-allowed vs not (recurse with i vs i+1) crossed with duplicates-in-input vs not (the skip-equal-sibling guard). Blurring them means shipping the wrong guard combination — the most common backtracking wrong-answer — and the fix ritual is stating the quadrant aloud BEFORE coding: "elements unique, reuse allowed, so i stays and no skip needed." Ten seconds, whole bug class gone.

**"If backtracking times out, add memoization"** → Backtracking and memoization mix ONLY when subproblems repeat AND the path does not matter (word-break: position suffices). When the enumeration genuinely needs every path (print all solutions), no memo can help — the output itself is exponential; the levers are stronger pruning, better ordering (most-constrained-first in sudoku), or bitmask acceleration. Reflex-memoizing an all-solutions enumeration is category error, and interviewers ask "can you memoize this?" precisely to hear NO with the reason.
