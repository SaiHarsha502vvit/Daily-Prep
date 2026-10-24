# Heap

> **Navigation**: [← Topological Sort Problems](29_Topological_Sort_Problems.md) | [Chapter index](00_INDEX.md) | [Shortest Path Problems →](31_Shortest_Path_Problems.md)

﻿**Navigation**: [< Previous](15_LinkedList.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](17_HashMap_Hashing.md)

---

## 🔗 Bridge — Where This Chapter Fits

| Dimension | This chapter |
| --- | --- |
| **Builds on** | [Heap + Greedy](../04_Patterns_Templates/15_Heap_Plus_GreedySelection.md), [Top-K & Two Heaps](../04_Patterns_Templates/31_Top_K_And_Two_Heaps_Pattern.md) |
| **You will learn** | Top-K, merging sorted lists, scheduling, running medians and Dijkstra with a heap |
| **Leads to** | [HashMap](17_HashMap_Hashing.md) |
| **Abstraction level** | Repeated min/max scans → **a priority queue** |

> [!NOTE]
> The full gap-free reading order and dependency graph are in the [Learning Path](00_LEARNING_PATH.md).

---

## 💬 Explain It Like a Study Partner — Heap & Priority Queue Problems

### 1. The bottom line

When you repeatedly need the best remaining item, a heap gives it in `O(log n)`.

### 2. The textbook core

- K largest → min-heap of size K.
- Merge K lists → heap of heads.
- Median → two heaps.
- Comparator must be consistent.
- Lazy deletion for updates.

### 3. The real-world analogy

An **emergency room triage desk**.

### 4. Walkthrough

1. Kth largest of `[3,2,1,5,6,4]`, k = 2.
2. Keep a min-heap of size 2.
3. After all elements it holds `{5, 6}`.
4. Root 5 is the answer.

> [!NOTE]
> **Quick check:** Why a min-heap for the K largest? *Its root is the smallest of the K kept, the one to evict.*


### 5. Check yourself

**Q1.** 4th largest in `[3,2,3,1,2,4,5,5,6]`?

<details><summary>Answer</summary>

**4** (sorted descending: 6, 5, 5, 4).

</details>

**Q2.** Cost of merging `k` sorted lists with `n` total elements using a heap?

<details><summary>Answer</summary>

`O(n log k)`.

</details>

---


## 🗺️ Pattern Recognition Header — Heap / Priority Queue

**When do I need a Heap?** Ask: _"Do I need repeated access to the min or max of a dynamic set?"_

| Problem Signature                    | Heap Pattern                          | Implementation                                 |
| ------------------------------------ | ------------------------------------- | ---------------------------------------------- |
| `kth largest / smallest in stream`   | **Min-Heap of size K**                | Push all; if size > K, poll (evicts smallest)  |
| `top K frequent elements`            | **Min-Heap of size K** sorted by freq | Pair (freq, val); poll evicts least frequent   |
| `K closest to origin / sorted list`  | **Max-Heap of size K**                | Push all; if size > K, poll (evicts farthest)  |
| `median of data stream`              | **Two Heaps** (max + min)             | maxHeap (lower half) + minHeap (upper half)    |
| `merge K sorted lists`               | **Min-Heap of heads**                 | Push all list heads; poll and re-add next node |
| `task scheduler / reorganize string` | **Max-Heap (greedy)**                 | Always pick most frequent; cool-down cycle     |
| `sliding window min/max`             | **Monotonic Deque** O(n)              | Better than heap for fixed window              |

**Heap vs Alternatives:**

```
"Need TOP-K repeatedly?"     → Min-Heap of size K  → O(n log k)
"Need TOP-K once?"           → Sort  → O(n log n)   OR  Quickselect → O(n)
"Need sliding window max?"   → Monotonic Deque      → O(n)  ← FASTER!
"Need median continuously?"  → Two Heaps            → O(log n) per insert
```

📖 **Mental Model:** [09_Complexity_Intuition.md](../14_Mental_Models/09_Complexity_Intuition.md)
📖 **Theory:** [01f_Trees_Heaps.md](../02_Data_Structures/01f_Trees_Heaps.md)
📖 **Full Pattern Guide:** [00_PATTERN_MASTER_GUIDE.md](../04_Patterns_Templates/00_PATTERN_MASTER_GUIDE.md)

---

## 📚 Topic Pages in This Chapter

This chapter is split into focused pages so each topic can be read on its own. Read them in order the first time; use the table to jump back later.

| # | Page | What is inside | Lines |
| --- | --- | --- | --- |
| 1 | [16. Heap / Priority Queue — Complete Problem Guide](16_Heap/01_heap_priority_queue_complete_problem_guide.md) | 16. Heap / Priority Queue — Complete Problem… · THEORY — Heap Internals (MIT/KTH Style) | 172 |
| 2 | [Easy Problems](16_Heap/02_easy_problems.md) | Easy Problems · 1. [Kth Largest Element in an… · 2. [Top K Frequent… · 3. [K Closest Points to… · 4. [Find Median from Data… · … | 774 |
| 3 | [10. [Furthest Building You Can…](16_Heap/03_furthest_building_you_can_reach_https.md) | 10. [Furthest Building You Can… · Hard Problems · Complexity Cheat Sheet & Decision Flowchart · Competitive Programming — Codeforces Problems · Real-World Applications of Heaps | 589 |

## 🏢 Enterprise Lens — Heap & Priority Queue Problems

| Area | What top-tier engineering looks like |
| ---- | ------------------------------------ |
| **Where it runs in production** | Schedulers, timers, leaderboards |
| **Failure modes** | Heap of size n; inconsistent comparators |
| **Testing and verification** | Compare with a full sort |

---

## Reality Check

**"Heap problems are top-k problems"** → Top-k is one wing; the practice set's other wings each add a distinct mechanic: k-way merging (k-sorted-lists, smallest-range-covering — heap holds one cursor per source), scheduling simulations (CPU-tasks, meeting-rooms — time advances via the heap), lazy-deletion workarounds (sliding-window median), and two-heap balance (running median). Filing every heap problem as top-k leaves four mechanics untrained — and interviews draw from all five.

**"Kth-largest means sort or heap, pick by mood"** → It is a three-way with distinct contracts: sort is O(n log n) and simplest; the size-k heap is O(n log k) and STREAMING-compatible (the follow-up is always "what if elements keep arriving?"); quickselect is O(n) average, in-place, but O(n squared) adversarial worst case and destroys input order. Interviewers walk this exact ladder — the prepared answer names all three with their one-line contracts before coding the one that fits.

**"K-closest-points is top-k with distance"** → Two upgrades hide in it: comparing SQUARED distances (dodging sqrt entirely — floating point never enters), and the max-heap-of-size-k direction flip that top-k-largest habits get backwards (keep the k best by evicting the WORST of the current elite). It is also the cleanest place to practice saying "average-case O(n) quickselect exists" and then not writing it unless asked — tool-selection narration as a skill.

**"Task-scheduler-type problems need the formula"** → The idle-slots formula answers ONE variant; the heap simulation (pop most-frequent, run cooldown queue of (task, ready-time)) answers the FAMILY — reorganize-string, distant-barcodes, any arrange-with-separation problem — and produces the actual arrangement, which formulas cannot. Practice the simulation as primary and the formula as the special-case shortcut, because follow-ups mutate constraints in ways only the simulation survives.

**"IPO/maximize-capital is an obscure hard"** → It is the cleanest TWO-HEAP HANDOFF specimen: projects sorted by capital requirement feed a max-heap of profits as they become affordable — greedy selection with a dynamically unlocked candidate set. The handoff shape (one ordering releases candidates into another ordering as a threshold moves) recurs in course-schedule-III style problems and real resource allocators; owning it converts a memorized hard into a reusable machine.
