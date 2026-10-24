# Binary Search

> **Navigation**: [← Sliding Window](05_Sliding_Window.md) | [Chapter index](00_INDEX.md) | [SECTION: SORTING ALGORITHM… →](20_Sorting.md)

﻿**Navigation**: [< Previous](06_Two_Pointers.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](08_Stack_Queue.md)


---

## 🔗 Bridge — Where This Chapter Fits

| Dimension | This chapter |
| --- | --- |
| **Builds on** | [Binary Search patterns](../04_Patterns_Templates/06_Binary_Search_Patterns.md), [Searching chapter](../03_Algorithms/22_Searching_And_Binary_Search_Complete.md) |
| **You will learn** | Lower/upper bound, rotated arrays, peaks, and binary search on the answer |
| **Leads to** | [Sorting](20_Sorting.md), [Heap](16_Heap.md) |
| **Abstraction level** | Searching a sorted array → **searching a monotone predicate** |

> [!NOTE]
> The full gap-free reading order and dependency graph are in the [Learning Path](00_LEARNING_PATH.md).

---

## 💬 Explain It Like a Study Partner — Binary Search Problems

### 1. The bottom line

If a yes/no question flips from no to yes once, binary search finds the flip in `O(log n)` checks.

### 2. The textbook core

- Define the predicate and the invariant first.
- `mid = lo + (hi − lo) / 2`.
- Search on the answer when feasibility is monotone.
- Check termination: the range must shrink each iteration.
- Test one element, all-true and all-false.

### 3. The real-world analogy

The **"higher or lower" guessing game**.

### 4. Walkthrough

1. Smallest capacity to ship packages within `D` days.
2. Answer range is `[max weight, total weight]`.
3. `ok(c)`: greedy simulation of days needed with capacity `c`.
4. Binary search the smallest `c` with `ok(c)` true.

> [!NOTE]
> **Quick check:** What property must a "binary search on the answer" predicate have? *Monotonicity.*


### 5. Check yourself

**Q1.** Search `0` in the rotated array `[4,5,6,7,0,1,2]`.

<details><summary>Answer</summary>

Index **4**: at each step one half is sorted; check whether the target lies in it.

</details>

**Q2.** Smallest integer `x` with `x·x ≥ 17`?

<details><summary>Answer</summary>

**5** (binary search on the answer over `[0, 17]`).

</details>

---


## 🗺️ Pattern Recognition Header — Binary Search

**When do you use Binary Search?** Use this checklist:

| Trigger                        | Sub-type     | Template                           |
| ------------------------------ | ------------ | ---------------------------------- |
| `sorted array` + `find target` | Classic BS   | `while(l<=r)`                      |
| `first/last occurrence`        | Boundary BS  | `while(l<r)` + bias                |
| `rotated sorted array`         | Rotated BS   | Check which half sorted            |
| `minimise/maximise` some value | BS on answer | `lo=MIN, hi=MAX, canAchieve(mid)?` |

**The Binary Search Mindset:**

```
1. Can I eliminate HALF the search space at each step?
2. Is there a MONOTONIC property? (F,F,F,T,T,T or T,T,F,F)
If yes to both → Binary Search applies.
```

📖 **Pattern deep dive:** [06_Binary_Search_Patterns.md](../04_Patterns_Templates/06_Binary_Search_Patterns.md)
📖 **Full Pattern Guide:** [00_PATTERN_MASTER_GUIDE.md](../04_Patterns_Templates/00_PATTERN_MASTER_GUIDE.md)

---

## 🔍 Section 6: Binary Search Patterns

---

## 📚 Topic Pages in This Chapter

This chapter is split into focused pages so each topic can be read on its own. Read them in order the first time; use the table to jump back later.

| # | Page | What is inside | Lines |
| --- | --- | --- | --- |
| 1 | [6.1 Basic Binary Search](07_Binary_Search/01_basic_binary_search.md) | 6.1 Basic Binary Search · 6.2 Find Boundaries | 251 |
| 2 | [6.3 Rotated Sorted Array](07_Binary_Search/02_rotated_sorted_array.md) | 6.3 Rotated Sorted Array | 169 |
| 3 | [6.4 Binary Search on Answer](07_Binary_Search/03_binary_search_on_answer.md) | 6.4 Binary Search on Answer | 316 |
| 4 | [SECTION 5: Additional Binary Search Problems](07_Binary_Search/04_section_5_additional_binary_search_problems.md) | SECTION 5: Additional Binary Search Problems · Real-World Applications of Binary Search | 288 |

## 🏢 Enterprise Lens — Binary Search Problems

| Area | What top-tier engineering looks like |
| ---- | ------------------------------------ |
| **Where it runs in production** | Database lookups, `git bisect`, capacity planning |
| **Failure modes** | Overflow in `mid`; infinite loops from wrong bound updates |
| **Testing and verification** | Compare with linear scan for small ranges |

---

## Reality Check

**"Binary search practice is about the template"** → Problem-level practice is about recognizing the MONOTONIC PREDICATE inside stories: ship-packages-in-D-days hides "can capacity c do it" (monotone in c); koko-bananas hides "can speed s finish in time"; split-array-largest-sum hides "can we split with max-part at most m". The template is ten lines; seeing the predicate through the story is the skill these problems drill, and it is the highest-frequency hard-interview move of the last decade.

**"Rotated-array search is a special algorithm"** → It is standard binary search plus ONE extra observation per step: at least one half of any rotated range is properly sorted, and you can test which by comparing endpoints — then check whether the target lies inside the sorted half (easy range test) and recurse accordingly. Practicing it as "one observation + vanilla search" makes the with-duplicates variant comprehensible too (the observation fails when endpoints tie; shrink and retry, degrading worst case to linear).

**"Find-peak and find-minimum need luck or scanning"** → Both are predicate searches in disguise: for peak, "is arr[mid] rising" (compare with its neighbor) always points toward SOME peak; for rotation-minimum, "is arr[mid] greater than arr[hi]" says which side the cliff is on. Neither needs global sortedness — only a locally testable direction signal. Internalizing that binary search needs a DIRECTION ORACLE, not sorted data, is the level-up these two problems exist to teach.

**"Search-in-2D-matrix problems are all the same"** → Two different structures, two different tools: fully-linearized matrices (each row continues the previous) allow one binary search over n·m with index arithmetic; row-and-column-sorted matrices (rows sorted, columns sorted, but rows do not continue) defeat single binary search and want the staircase walk from a corner — O(n+m). Applying the linearized method to the staircase matrix is a wrong-answer generator that LOOKS like a coding bug but is a structure misread.

**"Answer-space search bounds are obvious"** → The bounds ARE the correctness: lo must be a value where the predicate can be false-adjacent (max single element for splitting problems, 1 for speeds), hi a guaranteed-true value (total sum, max element). Sloppy bounds either exclude the answer (wrong result) or include impossible values the checker crashes on (divide by zero at speed 0). Every answer-space problem deserves one written line: "search space [x, y] because predicate false below x is impossible and true at y is guaranteed."
