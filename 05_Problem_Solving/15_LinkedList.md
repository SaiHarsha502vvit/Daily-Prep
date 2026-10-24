# LinkedList

> **Navigation**: [← SECTION: SORTING ALGORITHM…](20_Sorting.md) | [Chapter index](00_INDEX.md) | [Stack Queue →](08_Stack_Queue.md)


---

## 🔗 Bridge — Where This Chapter Fits

| Dimension | This chapter |
| --- | --- |
| **Builds on** | [Linked Lists](../02_Data_Structures/01c_LinkedList.md), [Linked List + Two Pointers](../04_Patterns_Templates/12_LinkedList_Plus_TwoPointers.md) |
| **You will learn** | Reversal, cycle detection, merging, removing nodes, and LRU-style designs |
| **Leads to** | [Heap](16_Heap.md) |
| **Abstraction level** | Arrays with indices → **pointers you must rewire carefully** |

> [!NOTE]
> The full gap-free reading order and dependency graph are in the [Learning Path](00_LEARNING_PATH.md).

---

## 💬 Explain It Like a Study Partner — Linked List Problems

### 1. The bottom line

Linked-list problems are pointer bookkeeping: use a dummy head and name every pointer before you change it.

### 2. The textbook core

- Reverse with `prev`, `cur`, `next`.
- Fast/slow for cycles and middles.
- Dummy head removes head special cases.
- Draw before coding.
- Do not lose the rest of the list.

### 3. The real-world analogy

A **treasure hunt** where each clue gives the next location; if you lose a clue, the rest is gone.

### 4. Walkthrough

1. Reverse `1→2→3`.
2. `prev = null`, `cur = 1`: save next=2, point 1→null, move.
3. Then 2→1, then 3→2.
4. New head 3.

> [!NOTE]
> **Quick check:** Why use a dummy head node? *It removes special cases for inserting or deleting at the head.*


### 5. Check yourself

**Q1.** Reverse `1→2→3→4→5`.

<details><summary>Answer</summary>

`5→4→3→2→1`.

</details>

**Q2.** Remove the 2nd node from the end of `1→2→3→4→5`.

<details><summary>Answer</summary>

`1→2→3→5` (advance a lead pointer 2 steps, then move both).

</details>

---


## 🗺️ Pattern Recognition Header — Linked List

> **Which Linked List technique should I use?**

| Problem Signature                           | Technique                       | Template                                                     |
| ------------------------------------------- | ------------------------------- | ------------------------------------------------------------ |
| `find middle / detect cycle / kth from end` | **Runner** (slow/fast pointers) | `slow=head, fast=head; fast!=null && fast.next!=null`        |
| `reverse the list / reverse k-group`        | **3-pointer reversal**          | `prev=null, curr=head; while curr: save next, flip, advance` |
| `merge two sorted lists / unknown new head` | **Dummy Head** (sentinel)       | `ListNode dummy=new ListNode(0); return dummy.next`          |
| `copy random pointer`                       | **Interleave** technique        | 3-pass: clone → link random → separate                       |
| `merge K sorted lists`                      | **Min-heap of heads**           | `PriorityQueue<ListNode>`                                    |
| `palindrome check`                          | **Find middle + Reverse half**  | Runner to mid, reverse second half, compare                  |

> **The 3 Core Mental Models:**
>
> ```
> RUNNER    → "Two speeds. When fast reaches end, slow is at the answer."
> DUMMY     → "When head might change, use a sentinel to avoid special cases."
> REVERSAL  → "Save next BEFORE flipping pointer. Three pointers: prev, curr, next."
> ```
>
> 📖 **Mental Model:** [04_Array_String_Thinking.md](../14_Mental_Models/04_Array_String_Thinking.md)
> 📖 **Theory:** [01c_LinkedList.md](../02_Data_Structures/01c_LinkedList.md)
> 📖 **Full Pattern Guide:** [00_PATTERN_MASTER_GUIDE.md](../04_Patterns_Templates/00_PATTERN_MASTER_GUIDE.md)

---

> 🔬 **Section Challenge — 🗺️ Pattern Recognition Header — Linked List**

**Challenge 1 (Reasoning):** The pattern table shows Runner (slow/fast) for cycle detection. But you could also detect cycles with a HashSet of visited nodes. When is HashSet actually BETTER than Floyd's, and why do interviewers still expect Floyd's?

<details><summary>Answer</summary>

HashSet detection is O(n) time, O(n) space. Floyd's is O(n) time, O(1) space. For the basic "does a cycle exist?" question, they're equivalent in time. But Floyd's wins in two critical ways: (1) **O(1) space** — for embedded systems or memory-constrained environments (real-world), this matters. (2) Floyd's can **find the cycle entry point** (LC 142) by resetting one pointer to head — HashSet can too, but Floyd's proof demonstrates mastery of the mathematical invariant `t = kc - a`. Interviewers expect Floyd's because it tests _algorithmic elegance_ and _proof ability_, not just problem-solving. HashSet IS better when you need to detect cycles in directed GRAPHS (not just linked lists) where the topology doesn't guarantee Floyd's convergence.

</details>

## 📚 Topic Pages in This Chapter

This chapter is split into focused pages so each topic can be read on its own. Read them in order the first time; use the table to jump back later.

| # | Page | What is inside | Lines |
| --- | --- | --- | --- |
| 1 | [SECTION 13: LINKED LIST PROBLEMS](15_LinkedList/01_section_13_linked_list_problems.md) | SECTION 13: LINKED LIST PROBLEMS · WHY Linked List — MIT/KTH Style Deep… · Why These Problems Matter · The Three Mental Models · Formal Definition (Mit / Kth Style) · … | 256 |
| 2 | [13.1 Basic Operations (Easy)](15_LinkedList/02_basic_operations_easy.md) | Problem 216: Reverse Linked List ⭐ FULL… · Problem 217: Middle of Linked List ⭐ FULL… · Problem 218: Merge Two Sorted Lists ⭐ FULL… | 301 |
| 3 | [Problem 219: Linked List Cycle ⭐ FULL SOLUTION](15_LinkedList/03_linked_list_cycle_full_solution.md) | Problem 219: Linked List Cycle ⭐ FULL SOLUTION · Problem 220: Palindrome Linked List · Problem 221: Remove Duplicates from Sorted… · Problem 222: Intersection of Two Linked Lists · Problem 223: Delete Node (Pointer Only) · … | 293 |
| 4 | [13.2 Pointer Manipulation (Medium)](15_LinkedList/04_pointer_manipulation_medium.md) | 13.2 Pointer Manipulation (Medium) | 461 |
| 5 | [13.3 Advanced Operations (Hard)](15_LinkedList/05_advanced_operations_hard.md) | 13.3 Advanced Operations (Hard) | 314 |
| 6 | [13.4 Hidden Gems — Advanced Linked List](15_LinkedList/06_hidden_gems_advanced_linked_list.md) | 13.4 Hidden Gems — Advanced Linked List · MASTERY CHECKLIST · Competitive Programming — Codeforces Problems · Real-World Applications of Linked Lists | 252 |

## 🏢 Enterprise Lens — Linked List Problems

| Area | What top-tier engineering looks like |
| ---- | ------------------------------------ |
| **Where it runs in production** | Free lists, undo logs, LRU caches |
| **Failure modes** | Null dereference; lost references; infinite loops |
| **Testing and verification** | Convert to arrays and compare with a reference |

---

## Reality Check

**"List problem practice is pointer-shuffle repetition"** — The graded problems each add one COMPOSITION skill on top of settled primitives: reorder-list is find-middle PLUS reverse-half PLUS interleave-merge (three primitives, and the bugs live at the two seams); sort-list is merge-sort with fast-slow splitting (and the split must NULL-TERMINATE the first half — the bug everyone writes once); rotate-list is close-the-ring-then-cut (converting the problem to one clean modulo). Practicing seams, not shuffles, is the level-up.

**"Copy-list-with-random-pointer needs a HashMap"** — The map version is the honest first answer; the O(1)-space interleave version (clone woven after each original, random pointers assigned via original.random.next, then unweave) is the technique worth owning because WEAVE-PROCESS-UNWEAVE recurs wherever you need old-to-new correspondence without auxiliary memory. The unweave step must fully RESTORE the original — interviewers check, and partial restoration is the common miss.

**"Merge-k-lists is merge-2 in a loop"** — Sequential merging is O(k·N) and correct; the two ladder rungs are the size-k min-heap (O(N log k), the expected answer) and divide-and-conquer pairing (same bound, no heap). The heap version's Java subtlety: nodes need a comparator (node values, not nodes), and pushing next-after-pop is the loop invariant. This problem is the standard vehicle for "improve your own working solution" follow-ups — practice the LADDER, not just the final form.

**"Add-two-numbers is arithmetic bookkeeping"** — It is the CARRY-STATE pattern in its cleanest form — while (l1 or l2 or carry) with defaulted zeros — and the variant family tests whether you own it: numbers stored FORWARD (reverse first, or recurse with length-padding), multiply-by-digit, plus-one-on-list. The while-condition unification (three termination causes, one loop) is the transferable idiom; solutions with three sequential loops and epilogue carry handling are the tell of bookkeeping-not-pattern.

**"Doubly linked lists appear only in LRU cache"** — LRU is the headline, but the underlying contract — O(1) removal GIVEN the node, which singly lists cannot offer — powers LFU (DLL per frequency bucket), browser-history designs, text-editor buffers, and the all-O(1) data structure problems. The design reflex to build: whenever a problem says "remove this known element in O(1) while maintaining order," the answer is a hash map pointing INTO a doubly linked list — that pairing, not the LRU specifics, is what transfers.
