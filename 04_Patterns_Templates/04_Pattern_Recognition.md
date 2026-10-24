# 🧩 Pattern Recognition — Pattern Guide

**Navigation**: [< Previous](03_Visual_Diagrams.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](05_LeetCode_RealWorld_Map.md)

---

## 🔗 Bridge — Where This Chapter Fits

| Dimension | This chapter |
| --- | --- |
| **Builds on** | [Code Templates](02_Code_Templates.md), [Visual Diagrams](03_Visual_Diagrams.md) |
| **You will learn** | Signals in a problem statement that point to a pattern, plus ten compact templates (prefix sum, Kadane, monotonic stack, union-find, trie, topological sort, binary search, intervals, graphs, bits) |
| **Leads to** | [Constraint-Based Selection](25_Constraint_Based_Pattern_Selection.md), the dedicated pattern chapters |
| **Abstraction level** | Keywords → **question shape** → pattern → constraints that confirm it |

> [!NOTE]
> The full gap-free reading order and dependency graph are in the [Learning Path](00_LEARNING_PATH.md).

---

## 💬 Explain It Like a Study Partner — Pattern Recognition

### 1. The bottom line

Read the *question* (what is being asked, over what structure, under which limits) and the pattern usually follows.

### 2. The textbook core

- Signals: "contiguous" → window/prefix sum; "sorted + pair" → two pointers; "minimum such that" → binary search on answer; "next greater" → monotonic stack; "connected" → union-find / graph search.
- A pattern is confirmed only by the **constraints** (sizes, sortedness, sign of values).
- Shortlist two or three patterns, test each against a small example, then commit.

### 3. The real-world analogy

A **doctor's triage**: symptoms (keywords) suggest candidates, tests (constraints) confirm the diagnosis.

### 4. Walkthrough

1. Problem: "number of subarrays with sum k" (values may be negative).
2. "Subarray" suggests window or prefix sum; negatives rule out the window.
3. Prefix sum + hash map counting earlier prefixes.
4. Verify on `[1,1,1], k=2` → 2 subarrays.

> [!NOTE]
> **Quick check:** Why is "subarray" alone not enough to choose a sliding window? *Without a monotone condition (non-negatives), windows fail.*

---

## Historical Evolution

**Inventor / Originator:** George Pólya's *How to Solve It* (1945) taught problem solving through heuristics such as "have you seen a related problem?". Robert Floyd's 1978 Turing Award lecture, *The Paradigms of Programming*, argued that programmers should learn named paradigms. Chase and Simon's 1973 studies of chess experts showed that expertise rests on recognising stored patterns ("chunks").

**Predecessor context:** Beginners treated each problem as new and relied on trial and error.

**Evolution narrative:** Algorithm textbooks organised material by technique (divide and conquer, greedy, dynamic programming); interview preparation later reorganised it by *recognisable problem shape*, which is what this folder does.

**Modern practice:** Pattern lists are a study aid: the skill is matching **constraints and question shape** to a technique, then proving it applies.

- **Pólya — 1945**: *How to Solve It*: heuristics for attacking unfamiliar problems
- **Chase & Simon — 1973**: Expert performance comes from recognising familiar configurations
- **Alexander — 1977 / Gamma et al. — 1994**: Pattern languages in architecture and software design
- **Floyd — 1978**: *The Paradigms of Programming* (Turing Award lecture)

---

## Production Reality

> [!TIP]
> **Solution fails or is too slow?** Run the five-step [Pattern Mis-Selection Debug Workflow](00_PATTERN_MASTER_GUIDE.md#pattern-mis-selection-debug-workflow) before changing code: the bug is often the pattern, not the implementation.

**Pattern-Specific Failure Modes:**

- **Decision tree yields wrong pattern when input size is borderline** — At N=100, O(N²) is acceptable; at N=100,000, O(N²) fails. A decision tree that suggests "use brute force for N<1000" may fail on N=1000 with O(N²) if the constant factor is high. Detection: measure actual runtime on worst-case input, not just count operations.

- **Keyword match selects wrong pattern when problem is ambiguous** — "Subarray" in "longest substring without repeating characters" suggests sliding window, but the correct answer uses a different sliding window variant than "maximum sum subarray." Detection: test edge cases explicitly; if sliding window produces wrong answer, check whether you selected the right sliding window sub-variant.

- **Pattern anti-traps missed** — Problems include traps: "duplicate elements" (breaks cyclic sort), "negative numbers" (breaks sliding window), "sorted array required" (breaks two pointers). Detection: explicitly check for anti-trap conditions before choosing a pattern.

**Production Selection Heuristic:** Use the decision tree as a starting point, but always validate against constraints (input size, value ranges, edge cases). Pattern selection is constraint-driven, not keyword-driven.

---

## 📚 Topic Pages in This Chapter

This chapter is split into focused pages so each topic can be read on its own. Read them in order the first time; use the table to jump back later.

| # | Page | What is inside | Lines |
| --- | --- | --- | --- |
| 1 | [MASTER PATTERN GUIDE — How to Identify Any Pattern From a…](04_Pattern_Recognition/01_master_pattern_guide_how_to_identify.md) | MASTER PATTERN GUIDE — How to Identify Any… | 79 |
| 2 | [Pattern 1: Prefix Sum](04_Pattern_Recognition/02_prefix_sum.md) | Pattern 1: Prefix Sum · Pattern 2: Kadane's Algorithm · Pattern 3: Monotonic Stack · Pattern 4: Union — Find (disjoint Set) · Pattern 5: Trie (prefix Tree) | 381 |
| 3 | [Pattern 6: Topological Sort](04_Pattern_Recognition/03_topological_sort.md) | Pattern 6: Topological Sort | 122 |
| 4 | [Pattern 7: Binary Search Variants](04_Pattern_Recognition/04_binary_search_variants.md) | Pattern 7: Binary Search Variants · Pattern 8: Interval Problems · Pattern 9: Graph Algorithms · Pattern 10: Bit Manipulation · Quick Complexity Reference · … | 428 |

## 🔥 Advanced DSA Patterns & Templates

### Beyond the Basics - Level Up Your Problem Solving

---

## 💪 Curated Practice Problems — Pattern Recognition Drill

**HOW TO USE**: For each problem below, FIRST identify the pattern BEFORE coding.
Write down: "This is a [pattern] problem because [reason]."

---

### Pattern Identification Drill (Mixed)

| #   | Problem                                  | Platform | Difficulty | Pattern to Identify           |
| --- | ---------------------------------------- | -------- | ---------- | ----------------------------- |
| 1   | Best Time to Buy and Sell Stock (LC 121) | LeetCode | Easy       | Kadane's / Track min so far   |
| 2   | Product of Array Except Self (LC 238)    | LeetCode | Medium     | Prefix/Suffix products        |
| 3   | Longest Consecutive Sequence (LC 128)    | LeetCode | Medium     | HashSet + sequence start      |
| 4   | Find All Duplicates in Array (LC 442)    | LeetCode | Medium     | Index marking (negate trick)  |
| 5   | Subarray Sum Equals K (LC 560)           | LeetCode | Medium     | Prefix sum + HashMap          |
| 6   | Next Permutation (LC 31)                 | LeetCode | Medium     | Right-to-left scan pattern    |
| 7   | Longest Palindromic Substring (LC 5)     | LeetCode | Medium     | Expand around center          |
| 8   | Median of Two Sorted Arrays (LC 4)       | LeetCode | Hard       | Binary search on partition    |
| 9   | Coin Change (LC 322)                     | LeetCode | Medium     | Unbounded knapsack DP         |
| 10  | Word Break (LC 139)                      | LeetCode | Medium     | DP + HashSet dictionary       |
| 11  | House Robber (LC 198)                    | LeetCode | Medium     | Linear DP: take or skip       |
| 12  | Decode Ways (LC 91)                      | LeetCode | Medium     | Linear DP: 1-digit or 2-digit |

---

**Master these patterns, and you'll solve 90% of interview problems!**


---

## 🏢 Enterprise Lens — Pattern Recognition

| Area | What top-tier engineering looks like |
| ---- | ------------------------------------ |
| **Where it runs in production** | Code review and design discussions where choosing the right approach matters more than writing it |
| **Failure modes** | Matching on keywords only; ignoring constraints; forcing a favourite pattern |
| **Testing and verification** | For each recognition rule, keep one counter-example problem where it does not apply |

---

## Reality Check

**"Keywords in the problem reliably signal the pattern"** → Keyword mapping ("sorted means binary search") is the trainer-wheels version. Problem setters actively bury keyword signals: "sorted" appears in problems solved by two pointers, math, and even hash sets; "shortest" can mean BFS, Dijkstra, DP, or plain min-scan. The reliable signals are CONSTRAINTS (n up to 10^5 rules out quadratic) and the ANSWER TYPE (index vs count vs optimum vs arrangement). Keywords shortlist; constraints decide.

**"Recognition means naming the pattern"** → Naming is the cheapest step. Recognition that matters is instantiation: WHAT is the window invariant, WHAT is the DP state, WHAT do the two pointers mean when they stop. Candidates regularly say "this is DP" and then cannot define the state — which reads worse than never naming it. Train the sentence: "this is X where the state/invariant is Y."

**"If I cannot recognize it in 2 minutes, I should look at the answer"** → The productive struggle window is longer: brute force first (always available in 2 minutes), then interrogate the brute force — what work is repeated? Repetition across overlapping subproblems says DP; repetition of scans says precompute or window; repetition of comparisons says sort or heap. The brute force IS the recognition tool, not the failure state.

**"Hard problems need exotic patterns"** → Hard problems are usually common patterns with one twist: an extra dimension in the DP state, a second binary search, or a non-obvious sort key BEFORE the standard sweep. Reaching for segment trees when the problem is a sort-then-greedy costs more interviews than never having learned segment trees. Escalate exotic only after the constraint math forces it.

**"Wrong pattern attempts are wasted time in interviews"** → A falsified attempt narrows the space and shows your process — IF you falsify fast. The skill is cheap disproof: one adversarial 5-element example kills a wrong window or greedy in 30 seconds. What actually wastes time is defending a wrong pattern against your own counterexample because you spent five minutes coding it before testing the idea.
