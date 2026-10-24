# 🧩 Code Templates — Pattern Guide

**Navigation**: [< Previous](01_Sliding_Window.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](03_Visual_Diagrams.md)

## 🎨 COMPLETE CODE TEMPLATES WITH VISUAL EXPLANATIONS

### Ready-to-use templates with step-by-step visual diagrams

> Constraint first: before copying a template, confirm the input size, value signs, update behavior, and graph weights. Use [Constraint-Based Pattern Selection](25_Constraint_Based_Pattern_Selection.md) when a template seems tempting but the constraints feel different.

---

### 📖 TABLE OF CONTENTS

1. [Two Pointers](02_Code_Templates/01_two_pointers.md#-1-two-pointers)
2. [Sliding Window - Fixed](02_Code_Templates/01_two_pointers.md#-2-sliding-window--fixed)
3. [Sliding Window - Variable](02_Code_Templates/02_sliding_window_variable.md#-3-sliding-window--variable)
4. [Binary Search](02_Code_Templates/03_binary_search.md#-4-binary-search)
5. [Prefix Sum](02_Code_Templates/04_prefix_sum.md#-5-prefix-sum)
6. [Frequency Count](02_Code_Templates/05_frequency_count.md#-6-frequency-count)
7. [Stack Problems](02_Code_Templates/05_frequency_count.md#-7-stack-problems)
8. [BFS/DFS](02_Code_Templates/06_bfs_dfs.md#-8-bfsdfs)
9. [Recursion & Backtracking](02_Code_Templates/07_recursion_backtracking.md#-9-recursion--backtracking)
10. [Dynamic Programming](02_Code_Templates/08_dynamic_programming.md#-10-dynamic-programming)

---

## 🔗 Bridge — Where This Chapter Fits

| Dimension | This chapter |
| --- | --- |
| **Builds on** | [Sliding Window](01_Sliding_Window.md), [Binary Search](06_Binary_Search_Patterns.md), [Two Pointers](07_Two_Pointers_Complete.md) (read the concept first) |
| **You will learn** | Reusable skeletons for two pointers, windows, binary search, prefix sums, frequency counts, stacks, BFS/DFS, backtracking and DP, each with a visual walkthrough |
| **Leads to** | [Pattern Recognition](04_Pattern_Recognition.md), the per-pattern chapters 06–24 |
| **Abstraction level** | Concept → **skeleton with named invariants** → problem-specific parts you fill in |

> [!NOTE]
> The full gap-free reading order and dependency graph are in the [Learning Path](00_LEARNING_PATH.md).

---

## 💬 Explain It Like a Study Partner — Code Templates

### 1. The bottom line

A template is a pattern's invariant written as code with the problem-specific parts left blank.

### 2. The textbook core

- Every template has a **loop shape**, a **state**, and an **invariant**.
- Keep templates small: one idea each; generic ones with many parameters are harder to adapt.
- Know which lines are *fixed* (loop boundaries, update order) and which are *yours* (the condition and the answer).
- Test templates on the empty input, a single element and the maximum size.

### 3. The real-world analogy

A **recipe card**: the method (steps) stays the same, you swap the ingredients.

### 4. Walkthrough

1. Pick the binary-search template that finds the first index where `ok(mid)` is true.
2. Fix the invariant: the answer is always in `[lo, hi]`.
3. Fill in `ok`.
4. Check that the loop terminates (`mid` is rounded so the range shrinks).

> [!NOTE]
> **Quick check:** Which two lines of a binary-search template cause most bugs? *The `mid` computation and the `lo = mid + 1` / `hi = mid` updates.*

---

## Historical Evolution

**Inventor / Originator:** Reusable code libraries grew out of programming-contest culture: team "notebooks" for ACM ICPC, the open-source **KACTL** (KTH Algorithm Competition Template Library, maintained by the KTH Royal Institute of Technology in Sweden), and the **AtCoder Library (ACL)**, released by AtCoder in 2020. *Introduction to Algorithms* (CLRS, first edition 1990) established the pseudocode conventions most templates descend from.

**Predecessor context:** Before shared libraries, contestants retyped algorithms from memory or from textbooks, which was slow and error-prone under time pressure.

**Evolution narrative:** Contest rules often allow a printed reference, so teams curated short, heavily tested snippets. Open-source collections made the best of them public and peer-reviewed.

**Modern practice:** Contest libraries are read for their *invariants and edge-case handling*; in interviews and production the value lies in understanding why each line exists, not in pasting it.

- **CLRS — 1990**: Popularised a common pseudocode style for algorithms
- **Team notebooks — 1990s onward**: Printed algorithm references allowed in ICPC-style contests
- **KACTL — 2010s**: Open-source, tested C++ templates from KTH
- **AtCoder Library — 2020**: Official C++ library with documented complexity and constraints

---

## Production Reality

> [!TIP]
> **Solution fails or is too slow?** Run the five-step [Pattern Mis-Selection Debug Workflow](00_PATTERN_MASTER_GUIDE.md#pattern-mis-selection-debug-workflow) before changing code: the bug is often the pattern, not the implementation.

**Pattern-Specific Failure Modes:**

- **Fenwick tree cannot do range min/max queries** — Fenwick trees (Binary Indexed Trees) support prefix sum and point updates, but NOT min/max range queries which require segment trees. The BIT's invertible operation assumption (sum works, min/max does not). Detection: test with `query(1, n)` for minimum — BIT returns wrong value because it cannot compute range minimum from partial sums.

- **Recursion depth >10K causes StackOverflowError in JVM** — Default JVM stack is ~1MB; each recursive frame consumes 1-4KB depending on local variables. For trees with depth >10,000 (skewed BSTs, pathological inputs), recursion throws StackOverflowError with no useful stack trace. Detection: run on a chain of 50,000 nodes; the crash confirms recursion depth issue.

- **Template copied without checking constraint fit** — Templates are battle-tested for specific input constraints. Copying a BIT template for range minimum (when BIT only works for sum) produces silent wrong answers. Detection: add assertion checks that the data structure supports the operation (e.g., verify the operation is invertible before using BIT).

- **Segment tree vs BIT selection** — BIT is faster and uses less memory (O(n) vs O(4n)) but cannot handle non-invertible operations. Detection: if the problem asks for min/max over range with updates, BIT will silently produce wrong results. Always verify operation invertibility.

**Production Selection Heuristic:** Use BIT for prefix-sum problems with point updates; use segment tree for range min/max or when lazy propagation is needed. Never substitute a BIT where a segment tree is required — the savings in memory and code complexity are not worth silent correctness failures.

---

## 📚 Topic Pages in This Chapter

This chapter is split into focused pages so each topic can be read on its own. Read them in order the first time; use the table to jump back later.

| # | Page | What is inside | Lines |
| --- | --- | --- | --- |
| 1 | [1. Two Pointers](02_Code_Templates/01_two_pointers.md) | 1. Two Pointers · 2. Sliding Window — Fixed | 248 |
| 2 | [3. Sliding Window — Variable](02_Code_Templates/02_sliding_window_variable.md) | 3. Sliding Window — Variable | 162 |
| 3 | [4. Binary Search](02_Code_Templates/03_binary_search.md) | 4. Binary Search | 128 |
| 4 | [5. Prefix Sum](02_Code_Templates/04_prefix_sum.md) | 5. Prefix Sum | 133 |
| 5 | [6. Frequency Count](02_Code_Templates/05_frequency_count.md) | 6. Frequency Count · 7. Stack Problems | 223 |
| 6 | [8. Bfs/dfs](02_Code_Templates/06_bfs_dfs.md) | 8. Bfs/dfs | 142 |
| 7 | [9. Recursion & Backtracking](02_Code_Templates/07_recursion_backtracking.md) | 9. Recursion & Backtracking | 133 |
| 8 | [10. Dynamic Programming](02_Code_Templates/08_dynamic_programming.md) | 10. Dynamic Programming · MASTER CHECKLIST | 194 |

## 💪 Curated Practice Problems — Template Application Drill

**HOW TO USE**: Each problem maps to a specific template from this guide.
Practice: open the template, then adapt it to solve the problem.

---

### Template → Problem Mapping

| Template                  | Problem                                       | Platform | Difficulty | Adaptation Needed                    |
| ------------------------- | --------------------------------------------- | -------- | ---------- | ------------------------------------ |
| Binary Search             | Search in Rotated Sorted Array (LC 33)        | LeetCode | Medium     | Modified condition in while loop     |
| Binary Search             | Find Minimum in Rotated Sorted Array (LC 153) | LeetCode | Medium     | Compare mid with right               |
| Sliding Window (Fixed)    | Maximum Average Subarray I (LC 643)           | LeetCode | Easy       | Direct template application          |
| Sliding Window (Variable) | Minimum Window Substring (LC 76)              | LeetCode | Hard       | Shrink condition = all chars covered |
| Two Pointers              | 3Sum (LC 15)                                  | LeetCode | Medium     | Fix one + two-pointer template       |
| BFS Template              | Word Ladder (LC 127)                          | LeetCode | Hard       | String transformation as neighbors   |
| DFS Template              | Number of Islands (LC 200)                    | LeetCode | Medium     | Grid DFS with flood fill             |
| Backtracking              | Combination Sum (LC 39)                       | LeetCode | Medium     | Reuse allowed, target decreasing     |
| Merge Sort                | Sort an Array (LC 912)                        | LeetCode | Medium     | Direct template application          |
| Trie Template             | Implement Trie (LC 208)                       | LeetCode | Medium     | Direct template application          |
| Union-Find                | Number of Provinces (LC 547)                  | LeetCode | Medium     | Union adjacency matrix entries       |
| Topological Sort          | Course Schedule II (LC 210)                   | LeetCode | Medium     | Kahn's BFS template                  |

---

**You've got this!**

---

**Navigation**: [< Previous](01_Sliding_Window.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](03_Visual_Diagrams.md)


---

## 🏢 Enterprise Lens — Code Templates

| Area | What top-tier engineering looks like |
| ---- | ------------------------------------ |
| **Where it runs in production** | Shared utility libraries, contest notebooks, onboarding snippets for interview prep |
| **Failure modes** | Pasting a template without understanding its invariant; changing one boundary and breaking termination |
| **Testing and verification** | Run each template against brute force on random inputs; keep the tests with the template |

---

## Reality Check

**"Memorizing templates is a substitute for understanding"** — A template encodes a pattern's INVARIANT, and inputs that violate the invariant's assumptions break the template silently. The binary search template assumes a monotonic predicate; the BFS template assumes unweighted edges; the fast-slow template assumes a linked structure without teleporting pointers. Interviewers deliberately mutate one assumption to test whether you know WHY each line exists — a memorizer transcribes the template onto a problem it no longer fits.

**"Templates should be as generic as possible"** — Over-generic templates (one binary search with six parameters) are harder to adapt under pressure than three specialized ones (find-exact, find-first-true, find-last-true). The practical bar: can you rewrite the template from its invariant in 60 seconds? If a template needs its own documentation to instantiate, it is a library, not a template.

**"If the template compiles and passes the sample, it is applied correctly"** — Sample inputs rarely hit the template's edges: empty input, single element, all-duplicates, the answer at index 0 or n-1. Every template has 2-3 canonical edge cases that break naive instantiations (binary search: two elements; sliding window: window larger than array; DFS: disconnected graph). Run those mentally BEFORE the samples — they are where instantiation errors live.

**"Off-by-one choices in templates are arbitrary style"** — lo < hi vs lo <= hi, hi = mid vs hi = mid - 1, and [lo, hi) vs [lo, hi] form a CONSISTENT SYSTEM — each choice forces the others. Mixing conventions from two templates you half-remember produces the infinite loop at hi - lo == 1 that eats ten interview minutes. Pick one convention, know its termination proof, never mix.

**"Templates make code reviews unnecessary in practice"** — Production code built from algorithmic templates still needs the review questions templates cannot answer: does this handle concurrent modification, does the comparator satisfy transitivity, is the recursion depth bounded for production input sizes? A perfect quickselect template with a comparator that violates its contract throws IllegalArgumentException in production Java — the template was right and the code still broke.

