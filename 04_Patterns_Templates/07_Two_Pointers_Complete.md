# 🧩 Two Pointers — Pattern Guide

> **Navigation**: [← Binary Search Patterns](06_Binary_Search_Patterns.md) | [Chapter index](00_INDEX.md) | [Prefix Sum & Difference Array →](26_Prefix_Sum_And_Difference_Array.md)

---

## 🔗 Bridge — Where This Chapter Fits

| Dimension | This chapter |
| --- | --- |
| **Builds on** | [Arrays](../02_Data_Structures/01b_Arrays.md), [Sorting Fundamentals](../03_Algorithms/02a_Sorting_Fundamentals.md) |
| **You will learn** | Opposite-direction, same-direction, fast/slow and multi-array pointers, their invariants and how they connect to sliding window |
| **Leads to** | [Array + Two Pointers](08_Array_Plus_TwoPointers.md), [Linked List + Two Pointers](12_LinkedList_Plus_TwoPointers.md) |
| **Abstraction level** | Nested loops over pairs → **two indices that never go backwards** → amortised `O(n)` |

> [!NOTE]
> The full gap-free reading order and dependency graph are in the [Learning Path](00_LEARNING_PATH.md).

---

## 💬 Explain It Like a Study Partner — Two Pointers

### 1. The bottom line

Use two indices that move monotonically so each element is visited a constant number of times.

### 2. The textbook core

- Opposite ends: sorted array, shrink from both sides (pair sum, container with most water).
- Same direction: reader/writer (remove duplicates), partitioning.
- Fast/slow: different speeds (cycle detection, middle of list).
- Correctness argument: when you move a pointer you discard candidates that cannot be part of the answer.

### 3. The real-world analogy

Two people **walking toward each other along a corridor** looking for a pair that adds up to a target: too big, the right one steps back; too small, the left one steps forward.

### 4. Walkthrough

1. Sorted `[1,2,4,7,11]`, target 9.
2. `L=1, R=11`: 12 > 9 → move `R`.
3. `1 + 7 = 8 < 9` → move `L`.
4. `2 + 7 = 9` → found.

> [!NOTE]
> **Quick check:** Why is it safe to move `R` when the sum is too large? *Any pair using `R` with a larger-or-equal left element is even larger.*


### 5. Check yourself

**Q1.** Sorted `[2,7,11,15]`, target 9. Walk the opposite-end pointers.

<details><summary>Answer</summary>

`2 + 15 = 17 > 9` → move `R`; `2 + 11 = 13 > 9` → move `R`; `2 + 7 = 9` ✓ indices 0 and 1.

</details>

**Q2.** Why does the pair-sum two-pointer method need a sorted array?

<details><summary>Answer</summary>

The rule "too big → move the right pointer" is only safe because moving it discards candidates that are even larger; that reasoning relies on order.

</details>

**Q3.** Name the three pointer styles.

<details><summary>Answer</summary>

Opposite ends, same direction (reader/writer) and fast/slow.

</details>

---

## Historical Evolution

**Inventor / Originator:** Two-pointer techniques have several independent roots: Hoare's partitioning (invented 1959, published in *Quicksort*, 1961), Floyd's cycle-finding algorithm (credited to Robert Floyd in the 1960s; Knuth records it), and Dijkstra's Dutch national flag problem (*A Discipline of Programming*, 1976).

**Predecessor context:** Pair-finding over a sorted array was `O(n²)`; scanning from both ends exploits the order to cut it to `O(n)`.

**Evolution narrative:** Each root contributes a different pointer pattern: opposite ends (partitioning, pair sums), same direction at different speeds (cycle detection, read/write compaction), and three-way partitions (flag problem).

**Modern practice:** Pointer patterns appear in standard-library partition routines, linked-list cycle checks and in-place array compaction.

- **Hoare — 1959/1961**: In-place partition for quicksort
- **Floyd — 1960s**: Tortoise-and-hare cycle detection (Knuth, TAOCP Vol. 2)
- **Brent — 1980**: A faster cycle-finding variant
- **Dijkstra — 1976**: Dutch national flag three-way partition

---

## Production Reality

> [!TIP]
> **Solution fails or is too slow?** Run the five-step [Pattern Mis-Selection Debug Workflow](00_PATTERN_MASTER_GUIDE.md#pattern-mis-selection-debug-workflow) before changing code: the bug is often the pattern, not the implementation.

**Pattern-Specific Failure Modes:**

- **Two pointers on unsorted array produces wrong answer** — Two pointers require sorted order for correctness. If the array is unsorted and you use opposite-end pointers for pair sum, you skip valid pairs because the monotonicity assumption (moving left increases sum) only holds on sorted data. Detection: test with unsorted `[3, 1, 2]` and target 4 — two pointers may miss (1,3) if not sorted first.

- **Fast/slow pointer termination condition wrong** — Common bug: forgetting `fast.next != null` check, causing NullPointerException on `fast.next.next`. For finding middle, use `while (fast != null && fast.next != null)`. For cycle detection, the meeting condition differs. Detection: test on single-element list and empty list.

- **Floyd's cycle detection: need to RESET slow to head after first meeting** — The two-phase Floyd algorithm (phase 1: find meeting; phase 2: reset slow to head and move both at 1x to find cycle start) is commonly implemented incorrectly by omitting the reset. Detection: test on a linked list where cycle starts at index k>0; algorithm must find k, not the meeting point.

- **Sorted requirement missed** — The two-pointer optimization requires sorting the array first (if order doesn't matter). Forgetting to sort silently produces wrong answers. Detection: add assertion that array is sorted; if unsorted, log warning before proceeding.

**Production Selection Heuristic:** Use two pointers when the array is sorted (or order doesn't matter and you can sort). Verify the monotonicity invariant holds before relying on the two-pointer reduction.

---

## 🗺️ Pattern Recognition Header — Two Pointers

**Which Two Pointer variant do I need?**

| Signal in problem                            | Variant                      | Movement direction              |
| -------------------------------------------- | ---------------------------- | ------------------------------- |
| `pair sum = target` in sorted array          | **Opposite direction**       | `left → ← right` converge       |
| `3Sum / 4Sum`, `container with most water`   | **Fix + Opposite**           | Fix one, converge the other two |
| `palindrome check`, `reverse string`         | **Opposite direction**       | Mirror inward                   |
| `remove duplicates`, `move zeroes`           | **Same dir (Reader-Writer)** | `reader` scans, `writer` places |
| `detect cycle`, `find middle` in linked list | **Fast & Slow (Floyd)**      | `fast=2x speed` of slow         |
| `merge two sorted arrays`                    | **Multi-array merge**        | Each array has own pointer      |

**Key decision:**

```
"Is array SORTED?"   Yes → Opposite direction (O(n))
                     No  → Sort first then use 2P, or use HashMap instead

"Linked list cycle?"      → Fast (2x) & Slow (1x) → meet inside cycle
"Remove in-place?"        → Reader stays ahead of writer
```

### ⚠️ Constraint Lens — Two Pointers Needs Structure

| Constraint / Signal                       | Use                                          |
| ----------------------------------------- | -------------------------------------------- |
| sorted array + pair sum                   | opposite-end two pointers                    |
| unsorted pair sum + need original indices | hashmap complement                           |
| unsorted pair sum + only values/count     | sort first if order does not matter          |
| linked list cycle/middle/kth from end     | fast/slow pointers                           |
| palindrome/string compare                 | inward pointers                              |
| values can be negative                    | still ok if sorted; issue is order, not sign |

Full map: [Constraint-Based Pattern Selection](25_Constraint_Based_Pattern_Selection.md).

- 🔗 **Practice problems:** [Two Pointers PS](../05_Problem_Solving/06_Two_Pointers.md)
- 🔗 **Related:** [Sliding Window template](01_Sliding_Window.md) — sliding window IS two pointers + window state
- 📋 **All Patterns Hub:** [00_PATTERN_MASTER_GUIDE.md](00_PATTERN_MASTER_GUIDE.md)

---

## 📚 Topic Pages in This Chapter

This chapter is split into focused pages so each topic can be read on its own. Read them in order the first time; use the table to jump back later.

| # | Page | What is inside | Lines |
| --- | --- | --- | --- |
| 1 | [Two Pointers Pattern Complete Guide](07_Two_Pointers_Complete/01_two_pointers_pattern_complete_guide.md) | Table of Contents · Two Pointers Fundamentals · Pattern Categories · Two Pointer Patterns · Opposite Direction Pointers | 348 |
| 2 | [Same Direction Pointers](07_Two_Pointers_Complete/02_same_direction_pointers.md) | Same Direction Pointers | 139 |
| 3 | [Fast & Slow Pointers](07_Two_Pointers_Complete/03_fast_slow_pointers.md) | Fast & Slow Pointers · Sliding Window Connection · Multi-Array Two Pointers | 379 |
| 4 | [Advanced Patterns](07_Two_Pointers_Complete/04_advanced_patterns.md) | Advanced Patterns | 139 |
| 5 | [Interview Problems](07_Two_Pointers_Complete/05_interview_problems.md) | Interview Problems · Quick Reference · Summary | 319 |

## 🏢 Enterprise Lens — Two Pointers

| Area | What top-tier engineering looks like |
| ---- | ------------------------------------ |
| **Where it runs in production** | Deduplication in pipelines, merging sorted streams, in-place compaction, partition steps in sorting |
| **Failure modes** | Applying it to unsorted data; forgetting duplicate handling; moving the wrong pointer |
| **Testing and verification** | Brute-force comparison on random arrays; test duplicates, length 0/1/2, all-equal |

---

## Reality Check

**"Two pointers is one pattern"** → It is at least four with different invariants: CONVERGING (sorted pair-sum: pointers close in, each step permanently discards candidates), PARALLEL (merge two sorted lists: pointers advance independently), FAST-SLOW (cycle detection: relative speed creates the meeting guarantee), and PARTITION (Dutch flag: pointers separate zones inside one array). Knowing "use two pointers" without knowing WHICH invariant is why implementations stall at the first edge case.

**"The proof of converging pointers is obvious"** → The proof is an exchange argument most people cannot state: when arr[lo] + arr[hi] < target, EVERY pair (lo, x) with x < hi is also < target — so lo can be advanced without losing any solution. Interviewers who ask "why does this not miss a pair?" filter out everyone who learned the movement rule without the discard rule. If you can state the discard rule, you can also re-derive the variant for products, differences, and 3-sum.

**"Fast-slow only detects cycles"** → The speed-differential trick answers several questions: middle of list (fast at 2x), kth from end (fast leads by k), cycle START (the two-phase Floyd walk after meeting), and duplicate-finding in value-as-pointer arrays (LeetCode 287 — an array problem solved by linked-list machinery). The unifying idea is that relative speed converts position questions into meeting questions.

**"Two pointers requires sorted input"** → Only the converging variant does. Fast-slow runs on unsorted lists; partition pointers CREATE order; parallel pointers need each input sorted but not the pair jointly. And when the converging variant needs sorting first, that O(n log n) dominates — worth saying aloud in an interview, because "two pointers is O(n)" is only true after someone paid for the sort.

**"When two pointers fails, add a third loop"** → When the pair logic needs history ("has this value appeared"), the escalation is a HashMap, not a third pointer; when it needs future knowledge ("next greater to the right"), it is a monotonic stack. 3-sum is the exception that proves the rule: one outer loop plus converging pointers — the third pointer is really the outer iteration, still O(n squared) not O(n cubed).
