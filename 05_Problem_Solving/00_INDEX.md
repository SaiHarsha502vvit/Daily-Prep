# 05 - Problem Solving

> **Substantive introductory chapter** — practice problems organized by topic to build pattern-recognition muscle memory. Solve these to internalize algorithms, prepare for technical interviews, and develop the constraint-first reasoning that separates senior engineers from beginners.

---

## 5W1H — What This Folder Is and Why It Exists

| Question | Answer |
|----------|--------|
| **WHAT** | 25 topic-organized problem files containing 200+ practice problems with detailed solutions, pattern recognition headers, brute-force-to-optimized reasoning, and edge case analyses. |
| **WHY** | To build **durable pattern recognition** — the ability to look at a new problem and instantly know which algorithmic pattern applies (sliding window? DP? two pointers?). Without this, every new problem feels novel. With it, you see the same 15-20 patterns recycled with cosmetic variations. |
| **WHO** | Software engineers preparing for technical interviews (FAANG, startups), competitive programmers building reflex, students in DSA courses, and practitioners who want to deepen algorithmic intuition. |
| **WHEN** | During interview prep (typically 8-12 weeks before onsite loops), daily practice rotations (1-2 problems/day), and whenever you encounter a new problem domain and want to build familiarity. |
| **WHERE** | This folder sits between `02_Data_Structures/` (which teaches DS internals) and `04_Patterns_Templates/` (which teaches pattern templates). Practice problems are the **application layer** — DS + Patterns + Problems together complete the DSA triangle. |
| **HOW** | Read a topic file's "Pattern Recognition Header" first, then solve problems in increasing difficulty. Timebox each problem to 30-45 minutes. After solving, study the brute-force-to-optimized rewrite, internalize the constraint triggers, and identify the 1-2 failure modes the problem exposes. |

---

## Reading Strategy — How to Approach Practice

### The 4-Phase Practice Loop

Every problem in this folder should be approached in 4 phases:

1. **Read & Recognize (5 min):** Skim the problem statement. Identify the **signal words** (e.g., "minimum cost", "longest substring", "in-place", "sorted array"). Match signals to pattern headers in the topic file.
2. **Brute Force First (10 min):** Before optimizing, write the obvious O(N²) or O(N·M) solution. This anchors your thinking and gives you a correctness baseline. If you can't write the brute force, you don't understand the problem yet.
3. **Optimize with Invariant (20 min):** Identify the bottleneck in the brute force. Ask "what repeated work am I doing?" The answer usually points to a data structure or algorithm pattern. State the **invariant** that makes the optimized version correct.
4. **Edge Cases & Mistakes (10 min):** Before submitting, enumerate: empty input, single element, all same values, boundary values (0, MAX_INT), duplicate handling, off-by-one. Then check the **Common Mistakes** sections in this folder.

### Timeboxing

| Phase | Time | What to do if you exceed it |
|-------|------|------------------------------|
| Recognize | 5 min | If you can't identify a pattern after 5 min, read the pattern header section |
| Brute Force | 10 min | If you can't write brute force after 10 min, look at the problem's brute force solution in the file |
| Optimize | 20 min | If you can't optimize after 20 min, study the optimized solution, then re-implement from memory |
| Edge Cases | 10 min | If you find bugs, treat each as a teaching moment (add it to your mental mistake list) |

### Mock Interview Cadence

- **Daily:** 1-2 problems with full 4-phase loop (60-90 min total)
- **Weekly:** 1 timed mock (90 min, 2-3 problems back-to-back, no peeking)
- **Bi-weekly:** 1 system-design mock (separate from this folder — see `20_Interview_Mastery/`)
- **Pre-onsite (last 2 weeks):** Increase to 3-4 problems/day, all under time pressure

### When You Get Stuck

1. **Re-read the constraints.** The n value, value range, and whether input is sorted reveal the intended algorithm. Sliding window fails on negatives; binary search requires monotonic predicate; DP needs overlapping subproblems.
2. **Walk through a small example by hand.** Trace `n=3` or `arr=[1,2,3]` on paper. Where does your intuition break?
3. **Read the brute force solution.** It's there for a reason. Understanding why the brute force is slow reveals the optimization.
4. **Check `04_Patterns_Templates/`** for the pattern's full template. The constraint-driven pattern selection table is the fastest way to identify which pattern applies.
5. **Study the failure mode** in the topic file's "Common Mistakes" section — most stuck-time comes from a single misunderstood edge case.

---

## Cross-Reference Map — How This Folder Connects

This folder is the **practice layer** of the DSA triangle. Each connected folder serves a distinct role:

| Folder | Role | When to use it |
|--------|------|----------------|
| [`02_Data_Structures/`](../02_Data_Structures/) | **Theory** — DS internals, variants, complexity | When you don't know what a hash table is, how a heap is implemented, or why trees have O(log n) operations. Read DS theory FIRST before practicing problems on it. |
| [`03_Algorithms/`](../03_Algorithms/) | **Theory** — algorithm internals, proofs, analysis | When you don't know how merge sort works, why Dijkstra fails on negative weights, or what Bellman's optimal substructure means. Algorithm theory before problem practice. |
| [`04_Patterns_Templates/`](../04_Patterns_Templates/) | **Templates** — 25 reusable code templates with visual diagrams | When you recognize a pattern but can't remember the code template. Use this as your "recipe book" while solving. |
| [`05_Problem_Solving/`](../05_Problem_Solving/) (this folder) | **Practice** — 200+ problems organized by topic | When you want to apply DS + Patterns to real problems. The application layer. |
| [`12_Daily_Practice/`](../12_Daily_Practice/) | **Schedule** — daily/weekly practice rotation | When you want a structured 8-12 week interview prep plan. Pairs with this folder for daily problem selection. |
| [`20_Interview_Mastery/`](../20_Interview_Mastery/) | **Strategy** — interview brain framework, behavioral prep, system design | When you want to understand the meta-game: how interviewers think, what they're looking for, how to communicate during interviews. |

### Recommended Study Path

```
For each topic (e.g., "Sliding Window"):
1. Read 02_Data_Structures (if DS is new, e.g., deque, hashmap)
2. Read 03_Algorithms (algorithm internals, e.g., sliding window amortized proof)
3. Read 04_Patterns_Templates (constraint lens + template + visual diagrams)
4. Practice 05_Problem_Solving (THIS folder — solve problems in 05_Sliding_Window.md)
5. Cross-reference 20_Interview_Mastery (how to communicate this in interview)
```

---

## Difficulty & Progression Guide

### Beginner (Weeks 1-4)

Build muscle memory with the foundational topics. Solve ALL problems in these files:

- `01_Intro_Checklist.md` — Setup, approach, timeboxing
- `02_Math_Numbers.md` — Sieve, GCD, modular arithmetic
- `03_Strings.md` — Reverse, palindrome, anagram
- `04_Arrays.md` — Subarray, rotation, partition
- `15_LinkedList.md` — Reverse, cycle detection, merge
- `17_HashMap_Hashing.md` — Frequency, grouping, two-sum
- `20_Sorting.md` — Custom comparators, intervals

### Intermediate (Weeks 5-8)

Add the pattern-heavy topics. Solve 70-80% of problems:

- `05_Sliding_Window.md` — Fixed + variable window patterns
- `06_Two_Pointers.md` — Opposite + same-direction pointers
- `07_Binary_Search.md` — Classic + rotated + on-answer
- `08_Stack_Queue.md` — Monotonic stack, deque patterns
- `09_Trees.md` — DFS + BFS traversals
- `18_BitManipulation.md` — XOR, masks, bitmask DP
- `23_Edge_Cases.md` — Boundary testing discipline

### Advanced (Weeks 9-12)

Master the algorithmic heavyweights:

- `10_Graphs.md` — BFS, DFS, Dijkstra, Union-Find
- `11_Dynamic_Programming.md` — 1D, 2D, knapsack, subsequence
- `12_Backtracking.md` — Permutations, N-Queens, pruning
- `13_Greedy.md` — Intervals, scheduling, exchange argument
- `16_Heap.md` — Top-K, median, Dijkstra with PQ
- `19_Matrix.md` — BFS/DFS on grids, spiral, island
- `21_Design.md` — LRU cache, stack-from-queue, Trie
- `22_Recursion_Subsets.md` — Generate, count, optimize

### Contest Mastery (Optional, Weeks 13+)

- `14_Mixed_Competitive.md` — Mixed-difficulty contest problems

### Cross-Topic References (Always)

- `24_Common_Mistakes.md` — Re-read weekly; add new mistakes you discover
- `25_Problem_Origins.md` — Connect abstract problems to real-world systems

---

## Reading Order (Quick Reference)

| #   | File                                             | Topic                    | Problems                      |
| --- | ------------------------------------------------ | ------------------------ | ----------------------------- |
| 1   | [Intro & Checklist](01_Intro_Checklist.md)       | How to approach practice | —                             |
| 2   | [Math & Numbers](02_Math_Numbers.md)             | Math-based problems      | LeetCode style                |
| 3   | [Strings](03_Strings.md)                         | String manipulation      | Reverse, palindrome, anagram  |
| 4   | [Arrays](04_Arrays.md)                           | Array problems           | Subarray, rotation, partition |
| 5   | [Sliding Window](05_Sliding_Window.md)           | Window problems          | Max sum, longest substring    |
| 6   | [Two Pointers](06_Two_Pointers.md)               | Pointer problems         | 2-sum, container, merge       |
| 7   | [Binary Search](07_Binary_Search.md)             | Search problems          | Sorted array, rotated         |
| 8   | [Stack & Queue](08_Stack_Queue.md)               | Stack/queue problems     | Valid parentheses, monotonic  |
| 9   | [Trees](09_Trees.md)                             | Tree problems            | Traversal, height, LCA        |
| 10  | [Graphs](10_Graphs.md)                           | Graph problems           | BFS/DFS, shortest path        |
| 11  | [Dynamic Programming](11_Dynamic_Programming.md) | DP problems              | Classic DP collection         |
| 12  | [Backtracking](12_Backtracking.md)               | Backtracking problems    | Permutations, N-Queens        |
| 13  | [Greedy](13_Greedy.md)                           | Greedy problems          | Intervals, scheduling         |
| 14  | [Mixed Competitive](14_Mixed_Competitive.md)     | Mixed difficulty         | Contest-style                 |
| 15  | [LinkedList](15_LinkedList.md)                   | LinkedList problems      | Reverse, cycle, merge         |
| 16  | [Heap](16_Heap.md)                               | Heap problems            | Top-K, median                 |
| 17  | [HashMap & Hashing](17_HashMap_Hashing.md)       | Hash problems            | Frequency, grouping           |
| 18  | [Bit Manipulation](18_BitManipulation.md)        | Bit problems             | XOR, masks, counting          |
| 19  | [Matrix](19_Matrix.md)                           | Matrix problems          | Spiral, search, island        |
| 20  | [Sorting](20_Sorting.md)                         | Sorting problems         | Custom sort, intervals        |
| 21  | [Design](21_Design.md)                           | Design problems          | LRU, stack from queue         |
| 22  | [Recursion & Subsets](22_Recursion_Subsets.md)   | Recursion problems       | Subsets, combinations         |

### Reference

| 23 | [Edge Cases](23_Edge_Cases.md) | Common edge cases to always check |
| 24 | [Common Mistakes](24_Common_Mistakes.md) | Bugs and pitfalls to avoid |
| 25 | [Problem Origins](25_Problem_Origins.md) | Where problems come from in real systems |

---

## Historical Evolution

The practice-problem format used in this folder evolved from **competitive programming culture**, which traces its roots to the **ACM-ICPC (Association for Computing Machinery International Collegiate Programming Contest), founded in 1970**. ICPC established the "1 problem, multiple test cases, time limit" format that defines modern competitive programming. The format was adapted for industry interview prep by **William Pugh's "CodingBat" (2008)** and popularized by **LeetCode (2015)**, which added the company-tag and difficulty-tier system now standard in interview prep.

The "brute force first, then optimize" pedagogical pattern was popularized by **Jon Bentley's "Programming Pearls" (1986)** and formalized in **Cormen-Leiserson-Rivest-Stein "Introduction to Algorithms" (1990 first edition)**, which introduced the invariant-first reasoning that this folder applies throughout. The constraint-driven pattern selection framework used in `04_Patterns_Templates/` and reinforced here was developed by **Stanford's CS161 (algorithms course)** materials in the 2010s and adopted widely after **Google's engineering interviews shifted toward pattern recognition (2014–2016)** in response to widespread candidate memorization of classic problems.

Modern practice ecosystems (LeetCode, HackerRank, Codeforces, Codewars) build on this foundation. LeetCode alone hosts 2,500+ problems as of 2024, with company-tagged sets used by 70%+ of FAANG candidates for interview prep. The signal-word pattern recognition headers in this folder are an explicit response to this evolution: when problems become commoditized, the only durable advantage is **pattern recognition reflex**, not memorization.

---

## Production Reality

Practice problems are simplified versions of real production debugging. The skills transfer imperfectly — here's what to watch for:

**Failure mode 1: Pattern overgeneralization.** Solving 50 sliding window problems in LeetCode trains you to see sliding window everywhere. In production, the same problem might have a different optimal solution (e.g., a hashmap + prefix sum) that LeetCode doesn't surface. **Debug workflow:** when solving, explicitly state "this pattern works because [invariant]" — if the invariant doesn't hold in a new problem, the pattern doesn't apply.

**Failure mode 2: Brute-force-first myopia.** The 4-phase loop in this folder starts with brute force, but in production, brute force is rarely acceptable at scale. n=10⁵ is a common input; O(n²) is 10¹⁰ operations. **Debug workflow:** for every brute force, calculate the worst-case operation count and refuse the algorithm if it exceeds 10⁸. Switch to O(n log n) or better.

**Failure mode 3: Edge case amnesia.** LeetCode judges run dozens of test cases. Production code runs once, with the bug customer-facing. **Debug workflow:** before submitting any production solution, run through the **24_Common_Mistakes.md** list explicitly. Common ones: integer overflow at MAX_INT, null pointer on empty input, off-by-one on boundary iteration, language-specific issues (`==` vs `.equals()` in Java, mutable default args in Python).

**Failure mode 4: Performance cliff surprise.** LeetCode problems often have n ≤ 10⁴. Production data has n = 10⁷ to 10⁹. **Debug workflow:** always ask "what's the input size in production?" before committing an algorithm. Use `04_Patterns_Templates/25_Constraint_Based_Pattern_Selection.md` to verify the algorithm meets the production constraint budget.

**Real-world anchor:** The 2017 Knight Capital incident ($440M loss in 45 minutes) was caused by a flag-not-set bug in a production trading system — exactly the kind of "edge case not tested" failure mode that practice problems train you to spot. The engineers had solved thousands of problems; what they missed was testing the "did you remember to initialize the flag?" case. Practice problems teach you to enumerate edges; production discipline teaches you to **always** enumerate them, not just when the prompt reminds you.

---

[← Back to Master Index](../00_MASTER_INDEX.md)
