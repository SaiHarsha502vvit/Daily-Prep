# 05 - Problem Solving

> **Substantive introductory chapter** — practice problems organized by topic to build pattern-recognition muscle memory. Solve these to internalize algorithms, prepare for technical interviews, and develop the constraint-first reasoning that separates senior engineers from beginners.

---

## 5W1H — What This Folder Is and Why It Exists

| Question | Answer |
|----------|--------|
| **WHAT** | 30 topic-organized problem pages containing 200+ practice problems with detailed solutions, pattern recognition headers, brute-force-to-optimized reasoning, and edge case analyses. |
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

## Reading Order

The order below builds from simple scans to the heavier algorithmic topics. The numeric prefixes in the file names are historical and do not follow this order — **follow this table**. Pages marked 🆕 were added after the folder audit.

| # | Page | Topic | Typical problems |
| --- | --- | --- | --- |
| 1 | [Method & Checklist](01_Intro_Checklist.md) | How to approach practice | The 4-phase loop, timeboxing |
| 2 | [Arrays](04_Arrays.md) | One-pass array techniques | Kadane, rotation, partition |
| 3 | [Prefix Sums](28_Prefix_Sum_Problems.md) 🆕 | Range queries and updates | Subarray sum = k, difference array |
| 4 | [HashMap & Hashing](17_HashMap_Hashing.md) | Memory for speed | Two sum, grouping, frequency |
| 5 | [Strings](03_Strings.md) | Text manipulation | Palindromes, anagrams |
| 6 | [Math & Numbers](02_Math_Numbers.md) | Arithmetic with limits | Gcd, sieve, overflow |
| 7 | [Two Pointers](06_Two_Pointers.md) | Monotone indices | Pair sums, container, merge |
| 8 | [Sliding Window](05_Sliding_Window.md) | Moving windows | Longest substring, window maximum |
| 9 | [Binary Search](07_Binary_Search.md) | Halving the search space | Rotated array, search on answer |
| 10 | [Sorting](20_Sorting.md) | Order as a first step | Comparators, counting sort |
| 11 | [Linked List](15_LinkedList.md) | Pointer rewiring | Reverse, cycle, merge |
| 12 | [Stack & Queue](08_Stack_Queue.md) | LIFO / FIFO state | Brackets, monotonic stack |
| 13 | [Recursion & Subsets](22_Recursion_Subsets.md) | Self-similar problems | Subsets, combinations |
| 14 | [Backtracking](12_Backtracking.md) | Search with pruning | Permutations, N-Queens |
| 15 | [Trees](09_Trees.md) | Hierarchies | Traversals, LCA, BST |
| 16 | [Tries](30_Trie_Problems.md) 🆕 | Shared prefixes | Replace words, max XOR |
| 17 | [Graphs](10_Graphs.md) | Networks | BFS/DFS, components |
| 18 | [Union-Find](27_Union_Find_Problems.md) 🆕 | Merging groups | Provinces, Kruskal |
| 19 | [Topological Sort](29_Topological_Sort_Problems.md) 🆕 | Dependencies | Course schedule, alien dictionary |
| 20 | [Heap & Priority Queue](16_Heap.md) | Best remaining item | Top-K, median |
| 21 | [Shortest Paths](31_Shortest_Path_Problems.md) 🆕 | Weighted routes | Dijkstra, 0-1 BFS |
| 22 | [Greedy](13_Greedy.md) | Locally best choices | Scheduling, exchange arguments |
| 23 | [Intervals](26_Interval_Problems.md) 🆕 | Ranges | Merge, rooms, arrows |
| 24 | [Dynamic Programming](11_Dynamic_Programming.md) | Overlapping subproblems | Knapsack, subsequences |
| 25 | [Bit Manipulation](18_BitManipulation.md) | Bits as flags | XOR, masks |
| 26 | [Matrix & Grid](19_Matrix.md) | 2-D structures | Spiral, islands, rotation |
| 27 | [Design](21_Design.md) | Combining structures | LRU, min-stack |
| 28 | [Mixed & Competitive](14_Mixed_Competitive.md) | Patterns composed | Contest-style |

### Reference pages (read alongside)

| Page | Use |
| --- | --- |
| [Edge Cases](23_Edge_Cases.md) | Boundary conditions to check every time |
| [Common Mistakes](24_Common_Mistakes.md) | Re-read weekly |
| [Problem Origins](25_Problem_Origins.md) | History and illustrative scenarios (documented versus illustrative is marked) |
| [Learning Path](00_LEARNING_PATH.md) | Abstraction ladder, dependency graph, coverage matrix |

### Suggested pacing

| Stage | Rows | Goal |
| --- | --- | --- |
| Foundations (weeks 1–4) | 1–11 | Muscle memory for scans, hashing and pointers |
| Patterns (weeks 5–8) | 12–19 | Recursion, trees, graphs and their building blocks |
| Heavyweights (weeks 9–12) | 20–27 | Heaps, shortest paths, greedy, DP, design |
| Contest (13+) | 28 | Compose patterns under time pressure |

> [!NOTE]
> **Chapter hubs and topic pages.** Long chapters are split: the chapter file keeps the bridge, explainer, at-a-glance material and Enterprise Lens, and lists its **topic pages** in a table. Previous/next links follow the reading order above.
>
> **Company tags** (`Companies:` lines and columns) are community-reported, change over time and are **not verified**; use them as hints about relevance, not facts.

**Review checklist for every problem:** state time **and** space complexity · state the invariant · list edge cases (empty, one element, duplicates, extremes) · say what happens at 10× data.

---

## Historical Evolution

Practice-problem culture grew out of programming contests. The ACM collegiate programming contest began in 1970 and became an international final from 1977; the International Olympiad in Informatics started in 1989; TopCoder (2001) and Codeforces (2010) added online rounds and ratings; interview-practice sites such as LeetCode appeared around 2011. The habit of "brute force first, then optimise" is old teaching practice, popularised for programmers by Jon Bentley's *Programming Pearls* columns (1983–85, book 1986) and by textbooks such as *Introduction to Algorithms* (1990).

- **ACM contest — 1970/1977**: Timed problems with judged programs
- **IOI — 1989**: Olympiad for secondary-school students
- **Bentley — 1986**: *Programming Pearls*: think, estimate, test
- **Codeforces — 2010**: Large online contests with ratings
- **LeetCode — c. 2011**: Interview-oriented problem sets with tags

## Production Reality

Practice problems are simplified versions of real production debugging. The skills transfer imperfectly — here's what to watch for:

**Failure mode 1: Pattern overgeneralization.** Solving 50 sliding window problems in LeetCode trains you to see sliding window everywhere. In production, the same problem might have a different optimal solution (e.g., a hashmap + prefix sum) that LeetCode doesn't surface. **Debug workflow:** when solving, explicitly state "this pattern works because [invariant]" — if the invariant doesn't hold in a new problem, the pattern doesn't apply.

**Failure mode 2: Brute-force-first myopia.** The 4-phase loop in this folder starts with brute force, but in production, brute force is rarely acceptable at scale. n=10⁵ is a common input; O(n²) is 10¹⁰ operations. **Debug workflow:** for every brute force, calculate the worst-case operation count and refuse the algorithm if it exceeds 10⁸. Switch to O(n log n) or better.

**Failure mode 3: Edge case amnesia.** LeetCode judges run dozens of test cases. Production code runs once, with the bug customer-facing. **Debug workflow:** before submitting any production solution, run through the **24_Common_Mistakes.md** list explicitly. Common ones: integer overflow at MAX_INT, null pointer on empty input, off-by-one on boundary iteration, language-specific issues (`==` vs `.equals()` in Java, mutable default args in Python).

**Failure mode 4: Performance cliff surprise.** LeetCode problems often have n ≤ 10⁴. Production data has n = 10⁷ to 10⁹. **Debug workflow:** always ask "what's the input size in production?" before committing an algorithm. Use `04_Patterns_Templates/25_Constraint_Based_Pattern_Selection.md` to verify the algorithm meets the production constraint budget.

**Real-world anchor:** The 2012 Knight Capital incident (about $440 million lost in roughly 45 minutes) came from a deployment that left old code active on one of eight servers and re-used a feature flag. It is a reminder that rollout states and untested edge cases are real failure modes — the habit these practice problems train.

---

[← Back to Master Index](../00_MASTER_INDEX.md)
