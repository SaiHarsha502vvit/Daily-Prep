> **Navigation**: [← Stack Queue](08_Stack_Queue.md) | [Chapter index](00_INDEX.md) | [Backtracking →](12_Backtracking.md)

**Problems 22** | [Prev](21_Design.md) | [Index](../00_MASTER_INDEX.md) | [Next](23_Edge_Cases.md)

---

# 📚 SECTION: RECURSION & SUBSETS PROBLEMS

## 🔗 Bridge — Where This Chapter Fits

| Dimension | This chapter |
| --- | --- |
| **Builds on** | [Recursion](../03_Algorithms/03b_Recursion_Fundamentals.md), [Backtracking](12_Backtracking.md) |
| **You will learn** | Subsets, permutations, combinations, divide-and-conquer recursion and base cases |
| **Leads to** | [Edge Cases](23_Edge_Cases.md) |
| **Abstraction level** | Loops → **self-similar subproblems** |

> [!NOTE]
> The full gap-free reading order and dependency graph are in the [Learning Path](00_LEARNING_PATH.md).

---

## 💬 Explain It Like a Study Partner — Recursion & Subsets Problems

### 1. The bottom line

Trust the recursive call to solve the smaller problem, and make sure the base case ends the recursion.

### 2. The textbook core

- Base case first.
- Each call must make progress.
- Subsets: include/exclude choice.
- Permutations: swap or used array.
- Depth equals stack usage.

### 3. The real-world analogy

A **set of Russian dolls**.

### 4. Walkthrough

1. Subsets of `{1,2,3}`.
2. For each element: exclude or include.
3. `2³ = 8` leaves.
4. Collect each leaf.

> [!NOTE]
> **Quick check:** How many subsets does an `n`-element set have? *`2ⁿ`.*

---


```
┌─────────────────────────────────────────────────────────────────┐
│          RECURSION & SUBSETS FUNDAMENTALS                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  WHY COMBINED? Subsets are THE classic recursion application.   │
│  Every subset problem is a recursion tree of include/exclude.   │
│                                                                 │
│  THE SUBSET UNIVERSE:                                           │
│  ┌─────────────┬────────────────────────────────────────────┐   │
│  │ Generate    │ Power Set, Combinations, Permutations      │   │
│  │ Count       │ Count subsets with sum K, Target Sum        │  │
│  │ Optimize    │ Partition Equal Subset, Min Diff Partition  │  │
│  │ Constrain   │ Subsets without duplicates, K-size subsets  │  │
│  └─────────────┴────────────────────────────────────────────┘   │
│                                                                 │
│  RECURSION → MEMOIZATION → DP PIPELINE:                         │
│  Every subset counting/optimization problem follows:            │
│  1. Write recursive solution (exponential)                      │
│  2. Identify overlapping subproblems                            │
│  3. Add memoization (top-down DP)                               │
│  4. Convert to iterative DP (bottom-up)                         │
│  5. Optimize space if possible                                  │
│                                                                 │
│  KEY FORMULA:                                                   │
│  n elements → 2^n subsets (each element: include or exclude)    │
│  Think of it as n-bit binary number: 000...0 to 111...1         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```


### 5. Check yourself

**Q1.** How many subsets does `[1,2,3]` have, and how many valid parentheses strings for `n = 3`?

<details><summary>Answer</summary>

8 subsets (`2³`) and **5** valid strings (the Catalan number `C₃`).

</details>

**Q2.** What are the two essential parts of a recursive solution?

<details><summary>Answer</summary>

A base case that stops, and a step that moves toward it.

</details>

---

## 📚 Topic Pages in This Chapter

This chapter is split into focused pages so each topic can be read on its own. Read them in order the first time; use the table to jump back later.

| # | Page | What is inside | Lines |
| --- | --- | --- | --- |
| 1 | [WHY Recursion & Subsets — The Heart of Combinatorial Thinking](22_Recursion_Subsets/01_why_recursion_subsets_the_heart_of.md) | WHY Recursion & Subsets — The Heart of… · The Real-World Origin · The Mental Model: "Include Or Exclude… · The Recursion → Dp Pipeline (Mit 6.006… · Difficulties & Common Mistakes · … | 763 |
| 2 | [PROBLEM 11: Word Search (LC 79)](22_Recursion_Subsets/02_word_search_lc_79.md) | PROBLEM 11: Word Search (LC 79) · PROBLEM 12: Generate Parentheses (LC 22) | 281 |

## 📋 CURATED PRACTICE PROBLEMS

### Easy

| #   | Problem                                                             | LC# | Pattern         | Company |
| --- | ------------------------------------------------------------------- | --- | --------------- | ------- |
| 1   | [Power of Two](https://leetcode.com/problems/power-of-two/)         | 231 | Recursion / Bit | Google  |
| 2   | [Fibonacci Number](https://leetcode.com/problems/fibonacci-number/) | 509 | Recursion → DP  | Amazon  |
| 3   | [Climbing Stairs](https://leetcode.com/problems/climbing-stairs/)   | 70  | Recursion → DP  | Amazon  |

### Medium

| #   | Problem                                                                                              | LC#  | Pattern                | Company          |
| --- | ---------------------------------------------------------------------------------------------------- | ---- | ---------------------- | ---------------- |
| 1   | [Subsets](https://leetcode.com/problems/subsets/)                                                    | 78   | Backtracking           | Amazon, Facebook |
| 2   | [Subsets II](https://leetcode.com/problems/subsets-ii/)                                              | 90   | Backtracking + Dedup   | Facebook         |
| 3   | [Combination Sum](https://leetcode.com/problems/combination-sum/)                                    | 39   | Backtracking Unbounded | Amazon           |
| 4   | [Combination Sum II](https://leetcode.com/problems/combination-sum-ii/)                              | 40   | Backtracking Once      | Facebook         |
| 5   | [Combinations](https://leetcode.com/problems/combinations/)                                          | 77   | Backtracking           | Microsoft        |
| 6   | [Permutations](https://leetcode.com/problems/permutations/)                                          | 46   | Backtracking + visited | Amazon           |
| 7   | [Permutations II](https://leetcode.com/problems/permutations-ii/)                                    | 47   | Backtracking + Dedup   | Amazon           |
| 8   | [Letter Combinations of Phone](https://leetcode.com/problems/letter-combinations-of-a-phone-number/) | 17   | Backtracking           | Amazon, Google   |
| 9   | [Generate Parentheses](https://leetcode.com/problems/generate-parentheses/)                          | 22   | Constrained Backtrack  | Amazon, Google   |
| 10  | [Partition Equal Subset Sum](https://leetcode.com/problems/partition-equal-subset-sum/)              | 416  | 0/1 Knapsack           | Facebook         |
| 11  | [Target Sum](https://leetcode.com/problems/target-sum/)                                              | 494  | Subset Sum Count       | Facebook         |
| 12  | [Word Search](https://leetcode.com/problems/word-search/)                                            | 79   | Grid Backtracking      | Amazon           |
| 13  | [Palindrome Partitioning](https://leetcode.com/problems/palindrome-partitioning/)                    | 131  | Backtracking           | Amazon           |
| 14  | [Beautiful Arrangement](https://leetcode.com/problems/beautiful-arrangement/)                        | 526  | Permutation Backtrack  | Google           |
| 15  | [Count Number of Nice Subarrays](https://leetcode.com/problems/count-number-of-nice-subarrays/)      | 1248 | Sliding Window Count   | Amazon           |

### Hard

| #   | Problem                                                                                     | LC# | Pattern              | Company        |
| --- | ------------------------------------------------------------------------------------------- | --- | -------------------- | -------------- |
| 1   | [N-Queens](https://leetcode.com/problems/n-queens/)                                         | 51  | Constraint Backtrack | Amazon, Google |
| 2   | [Sudoku Solver](https://leetcode.com/problems/sudoku-solver/)                               | 37  | Constraint Backtrack | Google         |
| 3   | [Stickers to Spell Word](https://leetcode.com/problems/stickers-to-spell-word/)             | 691 | Bitmask DP           | —              |
| 4   | [Partition to K Equal Sum](https://leetcode.com/problems/partition-to-k-equal-sum-subsets/) | 698 | Backtrack + Prune    | LinkedIn       |
| 5   | [Word Search II](https://leetcode.com/problems/word-search-ii/)                             | 212 | Trie + Backtrack     | Amazon, Google |

---


---

### Historical Evolution

Recursive definitions were formalised in the 1930s (Gödel, Kleene, Church). LISP (McCarthy, 1958) and ALGOL 60 made recursion practical in programming languages. Generating subsets and combinations systematically is treated in Knuth's *TAOCP* Vol. 4A (2011), and Frank Gray's reflected binary code (1953) gives a one-bit-change order for subsets.

- **Gödel / Kleene — 1930s**: Recursive functions
- **McCarthy — 1958**: LISP
- **ALGOL 60 — 1960**: Recursive procedures in a mainstream language
- **Knuth — 2011**: Combinatorial generation in TAOCP 4A

## 🏢 Enterprise Lens — Recursion & Subsets Problems

| Area | What top-tier engineering looks like |
| ---- | ------------------------------------ |
| **Where it runs in production** | Combinatorial generation, tree walks |
| **Failure modes** | Missing base case; shared mutable list not copied |
| **Testing and verification** | Compare counts with formulas |

---

## Reality Check

**"Subsets are generated one way"** — Three generators, three use-profiles: include/exclude recursion (the binary decision tree — clearest for teaching and for add-a-constraint variants), iterative doubling (append each element to copies of all existing subsets — shortest code), and bitmask counting (0 to 2^n-1 — best when subsets feed further bit logic). Owning all three means picking by what the SURROUNDING problem needs; owning one means contorting every variant through it.

**"The recursion tree for subsets and permutations is the same tree"** — Different trees, different bookkeeping, and the difference IS the understanding: subsets branch on include-this-or-not (depth n, binary), permutations branch on what-goes-NEXT (depth n, fan-out shrinking, needs used-tracking), combinations are subsets with a size gate and a start-index to kill orderings. Drawing the first two levels of the correct tree before coding prevents the wrong-bookkeeping hybrid that generates duplicates or misses arrangements.

**"Letter-case and parentheses generation are separate puzzles"** — Both are CONSTRAINED subset/sequence generation: letter-case branches only at letters (digits pass through), valid-parentheses branches under the open-count and close-less-than-open invariants — pruning during generation rather than filtering after. The pair teaches the chapter's central economy: constraints pushed INTO the generator shrink the tree; constraints applied after the generator only shrink the output. Gray-code then shows generation by STRUCTURE (reflect-and-prefix) rather than by decision — three generation philosophies across three toy problems.

**"Recursion depth is a JVM footnote for these problems"** — Subset recursion depth is n — safe — but the OUTPUT is 2^n: at n=20, a million subsets, and copying the path list into results at every leaf dominates runtime (the new ArrayList per add is the hidden cost people miss when their exponential solution is inexplicably slow even for legal n). The habit: know whether your cost is tree-size or output-size, because only the first responds to pruning.

**"Power-set problems have no production analog"** — Feature-flag combination testing, SQL grouping sets and cube operations, configuration-space exploration, and finding minimal failing subsets (delta debugging) are all subset enumeration with pruning budgets. The production lesson mirrors the interview one: full enumeration is a last resort — real systems enumerate lazily, prune by dominance, or sample — and knowing the exact size arithmetic (2^n, times copy cost) is what tells you when enumeration is even on the table.
