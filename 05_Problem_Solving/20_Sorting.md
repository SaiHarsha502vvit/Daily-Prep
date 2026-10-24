> **Navigation**: [← Binary Search](07_Binary_Search.md) | [Chapter index](00_INDEX.md) | [LinkedList →](15_LinkedList.md)

**Problems 20** | [Prev](19_Matrix.md) | [Index](../00_MASTER_INDEX.md) | [Next](21_Design.md)

---

# 📚 SECTION: SORTING ALGORITHM PROBLEMS

## 🔗 Bridge — Where This Chapter Fits

| Dimension | This chapter |
| --- | --- |
| **Builds on** | [Sorting Fundamentals](../03_Algorithms/02a_Sorting_Fundamentals.md), [Sorting Advanced](../03_Algorithms/02b_Sorting_Advanced.md) |
| **You will learn** | Custom comparators, stability, counting sort, merge intervals by sorting, and top-K |
| **Leads to** | [Design](21_Design.md) |
| **Abstraction level** | Calling `sort` → **choosing the key and algorithm** |

> [!NOTE]
> The full gap-free reading order and dependency graph are in the [Learning Path](00_LEARNING_PATH.md).

---

## 💬 Explain It Like a Study Partner — Sorting Problems

### 1. The bottom line

Sorting is often the first step that turns a hard problem into a scan.

### 2. The textbook core

- Comparators must be consistent (no `a − b` overflow).
- Stable vs unstable.
- Counting sort for small ranges.
- Sort by end time for intervals.
- `O(n log n)` lower bound for comparison sorts.

### 3. The real-world analogy

Sorting **a hand of cards** before looking for runs.

### 4. Walkthrough

1. Merge `[[1,3],[2,6],[8,10]]`.
2. Sort by start.
3. Extend the current interval while the next starts inside it.
4. Result `[[1,6],[8,10]]`.

> [!NOTE]
> **Quick check:** Why use `Integer.compare` instead of `a - b`? *Subtraction can overflow.*

---


```
┌─────────────────────────────────────────────────────────────────┐
│               SORTING PROBLEMS FUNDAMENTALS                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  WHY SORTING MATTERS:                                           │
│  - Foundation for Binary Search, Two Pointers, Merge patterns   │
│  - ~30% of interview problems need sorting as a preprocessing   │
│  - Understanding sort internals = understanding divide & conquer│
│                                                                 │
│  THE 4 SORTING FAMILIES:                                        │
│  ┌──────────────┬───────────────┬────────────┬────────────────┐ │
│  │ Comparison   │ D&C           │ Non-Compare│ Hybrid         │ │
│  ├──────────────┼───────────────┼────────────┼────────────────┤ │
│  │ Bubble O(n²) │ Merge O(nlogn)│ Counting   │ TimSort        │ │
│  │ Selection    │ Quick O(nlogn)│ Radix      │ IntroSort      │ │
│  │ Insertion    │ Heap  O(nlogn)│ Bucket     │ BlockSort       ││
│  └──────────────┴───────────────┴────────────┴────────────────┘ │
│                                                                 │
│  DECISION FRAMEWORK:                                            │
│  • Nearly sorted? → Insertion Sort O(n)                         │
│  • Need stable? → Merge Sort                                    │
│  • Need in-place? → Quick Sort / Heap Sort                      │
│  • Small range integers? → Counting Sort O(n+k)                 │
│  • Linked list? → Merge Sort (no random access needed)          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```


### 5. Check yourself

**Q1.** Sort `[2,0,2,1,1,0]` in one pass without a library sort.

<details><summary>Answer</summary>

`[0,0,1,1,2,2]` with the Dutch national flag (three pointers).

</details>

**Q2.** Largest number formed from `[3,30,34,5,9]`?

<details><summary>Answer</summary>

**"9534330"** (sort with the comparator `a+b > b+a`).

</details>

---

## 📚 Topic Pages in This Chapter

This chapter is split into focused pages so each topic can be read on its own. Read them in order the first time; use the table to jump back later.

| # | Page | What is inside | Lines |
| --- | --- | --- | --- |
| 1 | [WHY Sorting — The Foundation Every Algorithm Stands On](20_Sorting/01_why_sorting_the_foundation_every_algorithm.md) | WHY Sorting — The Foundation Every Algorithm… · PROBLEM 1: Sort an Array (LC 912) — Implement… · PROBLEM 2: Sort an Array — Quick Sort with… · PROBLEM 3: Kth Largest Element in Array (LC… · PROBLEM 4: Merge Intervals (LC 56) · … | 800 |
| 2 | [PROBLEM 13: Maximum Gap (LC 164)](20_Sorting/02_maximum_gap_lc_164.md) | PROBLEM 13: Maximum Gap (LC 164) | 60 |

## 📋 CURATED PRACTICE PROBLEMS

### Easy

| #   | Problem                                                                                       | LC# | Pattern             | Company        |
| --- | --------------------------------------------------------------------------------------------- | --- | ------------------- | -------------- |
| 1   | [Valid Anagram](https://leetcode.com/problems/valid-anagram/)                                 | 242 | Counting            | Amazon, Google |
| 2   | [Merge Sorted Array](https://leetcode.com/problems/merge-sorted-array/)                       | 88  | Two Pointers Merge  | Facebook       |
| 3   | [Intersection of Two Arrays II](https://leetcode.com/problems/intersection-of-two-arrays-ii/) | 350 | Sort + Two Pointers | Facebook       |
| 4   | [Contains Duplicate](https://leetcode.com/problems/contains-duplicate/)                       | 217 | Sort / HashSet      | Amazon         |
| 5   | [Majority Element](https://leetcode.com/problems/majority-element/)                           | 169 | Boyer-Moore / Sort  | Amazon, Google |
| 6   | [Missing Number](https://leetcode.com/problems/missing-number/)                               | 268 | Sort / XOR / Math   | Microsoft      |
| 7   | [Squares of a Sorted Array](https://leetcode.com/problems/squares-of-a-sorted-array/)         | 977 | Two Pointer Merge   | Facebook       |

### Medium

| #   | Problem                                                                                         | LC# | Pattern               | Company           |
| --- | ----------------------------------------------------------------------------------------------- | --- | --------------------- | ----------------- |
| 1   | [Sort Colors](https://leetcode.com/problems/sort-colors/)                                       | 75  | Dutch Flag 3-Way      | Microsoft, Amazon |
| 2   | [Kth Largest Element](https://leetcode.com/problems/kth-largest-element-in-an-array/)           | 215 | QuickSelect           | Facebook, Google  |
| 3   | [Top K Frequent Elements](https://leetcode.com/problems/top-k-frequent-elements/)               | 347 | Bucket Sort           | Amazon, Facebook  |
| 4   | [Merge Intervals](https://leetcode.com/problems/merge-intervals/)                               | 56  | Sort + Merge          | Google, Facebook  |
| 5   | [Sort List](https://leetcode.com/problems/sort-list/)                                           | 148 | Merge Sort LL         | Amazon            |
| 6   | [Largest Number](https://leetcode.com/problems/largest-number/)                                 | 179 | Custom Comparator     | Amazon            |
| 7   | [Sort Characters By Frequency](https://leetcode.com/problems/sort-characters-by-frequency/)     | 451 | Bucket Sort           | Amazon            |
| 8   | [H-Index](https://leetcode.com/problems/h-index/)                                               | 274 | Counting Sort         | Google            |
| 9   | [Wiggle Sort II](https://leetcode.com/problems/wiggle-sort-ii/)                                 | 324 | QuickSelect + Virtual | Google            |
| 10  | [Queue Reconstruction by Height](https://leetcode.com/problems/queue-reconstruction-by-height/) | 406 | Custom Sort + Insert  | Google            |
| 11  | [Custom Sort String](https://leetcode.com/problems/custom-sort-string/)                         | 791 | Custom Comparator     | Facebook          |
| 12  | [Pancake Sorting](https://leetcode.com/problems/pancake-sorting/)                               | 969 | Selection Sort        | Microsoft         |

### Hard

| #   | Problem                                                                                                   | LC# | Pattern            | Company        |
| --- | --------------------------------------------------------------------------------------------------------- | --- | ------------------ | -------------- |
| 1   | [Maximum Gap](https://leetcode.com/problems/maximum-gap/)                                                 | 164 | Bucket Sort        | Google         |
| 2   | [Count of Smaller Numbers After Self](https://leetcode.com/problems/count-of-smaller-numbers-after-self/) | 315 | Merge Sort + Count | Google         |
| 3   | [Reverse Pairs](https://leetcode.com/problems/reverse-pairs/)                                             | 493 | Merge Sort + Count | Google         |
| 4   | [Count of Range Sum](https://leetcode.com/problems/count-of-range-sum/)                                   | 327 | Merge Sort         | Google         |
| 5   | [Median of Two Sorted Arrays](https://leetcode.com/problems/median-of-two-sorted-arrays/)                 | 4   | Binary Search      | Google, Amazon |

---

### Historical Evolution

Merge sort was programmed by John von Neumann for the EDVAC in 1945. C. A. R. Hoare devised quicksort in 1959 as a visiting student in Moscow, working on machine translation (published 1961). Shell sort appeared in 1959, heapsort in 1964, Musser's introsort in 1997 and Tim Peters' Timsort for Python in 2002 (later used by Java for objects). Counting and radix sort ideas go back to punched-card sorters (Hollerith, 1880s) and Seward (1954).

- **von Neumann — 1945**: Merge sort on the EDVAC
- **Hoare — 1959/1961**: Quicksort
- **Williams — 1964**: Heapsort
- **Musser — 1997**: Introsort
- **Peters — 2002**: Timsort

## 🏢 Enterprise Lens — Sorting Problems

| Area | What top-tier engineering looks like |
| ---- | ------------------------------------ |
| **Where it runs in production** | Reports, batch pipelines, database engines |
| **Failure modes** | Inconsistent comparators; unstable sort when stability is needed |
| **Testing and verification** | Compare with `Arrays.sort` |

---

## Reality Check

**"Sorting practice means implementing quicksort again"** → The practice set is really COMPARATOR DESIGN and sort-as-preprocessing: largest-number (compare a+b vs b+a as strings — with the all-zeros edge), meeting-candidates, custom-order strings, and the ubiquitous sort-then-sweep openings. Comparator bugs are contract bugs: non-transitive comparators throw IllegalArgumentException from Java's TimSort at RUNTIME on large inputs only — a production incident pattern, not a style nit. The a+b-vs-b+a comparator PASSES the contract; sloppier custom ones do not.

**"Stability is a textbook footnote"** → Stability is the difference between correct and wrong whenever you sort TWICE or sort objects with meaningful prior order: sort by secondary key then stably by primary equals multi-key sort; Java sorts objects stably (TimSort) but primitives via dual-pivot quicksort (no stability concept — and historically, adversarial quadratic inputs); Arrays.sort on an int[] versus Integer[] therefore behaves differently in both stability and worst case. The practical reflex: multi-key ordering means one comparator chain OR reversed-order stable passes — never an unstable sort of pre-ordered data.

**"O(n log n) is the floor, always"** → The floor applies to COMPARISON sorts; the practice set's counting problems walk through it: sort-colors in one pass (three-way partition), counting sort for bounded values (relative-sort-array), bucket sort for top-k-frequent and the uniform-ish maximum-gap problem (where pigeonhole guarantees the answer lies between buckets). The routing cue is a BOUNDED VALUE RANGE in the constraints — 0..100 ages, 26 letters — which converts n log n habits into linear passes.

**"Merge-sorted-arrays is a warmup with nothing to teach"** → Its lesson is DIRECTION SELECTION: merging into A's spare tail from the BACK avoids overwriting unread elements — the same back-to-front reflex as sorted-squares and every in-place merge. The count-inversions and count-smaller-after-self problems then reveal merge sort's second identity: the merge step COUNTS crossings as a free byproduct — the standard bridge from sorting practice to divide-and-conquer counting, and a genuine hard-interview staple.

**"Quickselect is quicksort trivia"** → Quickselect is the O(n)-average selection tool the kth-element family expects you to weigh aloud — and its honest caveats are the content: worst case quadratic without random pivots, input mutation, no stability, and the heap alternative winning for streaming or adversarial settings. Wiggle-sort-II is the capstone: quickselect the median, then three-way partition INTO the interleaved index mapping — selection, partitioning, and index arithmetic composing in one problem. If that composition is comfortable, the sorting chapter has done its job.
