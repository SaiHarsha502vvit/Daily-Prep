> **Navigation**: [← Greedy Algorithms](12_Greedy_Algorithms_Complete.md) | [Chapter index](00_INDEX.md) | [Prefix Sum Prefix XOR 2D Prefix… →](19_Prefix_Sum_Prefix_XOR_2D_Prefix_Java_Complete.md)

# 📚 Monotonic Stack & Queue Complete Guide

## 🔗 Bridge — Where This Chapter Fits

| Dimension | This chapter |
| --- | --- |
| **Builds on** | [Stack & Queue](../02_Data_Structures/01d_Stack_Queue.md), [Greedy](12_Greedy_Algorithms_Complete.md) |
| **You will learn** | Next/previous greater-smaller elements, sliding window max/min, largest rectangle, trapping rain water |
| **Leads to** | [Prefix sums](19_Prefix_Sum_Prefix_XOR_2D_Prefix_Java_Complete.md), [Advanced DS](07b_Advanced_DS_Patterns.md) |
| **Abstraction level** | L3: O(n) amortized range techniques |

> [!NOTE]
> The full gap-free reading order and dependency graph are in the [Learning Path](00_LEARNING_PATH.md).

---

## 💬 Explain It Like a Study Partner — Monotonic Stack & Queue

### 1. The bottom line

A monotonic stack keeps only the candidates that could still be an answer, so each element is pushed and popped once.

### 2. The textbook core

- Keep the stack monotone (increasing or decreasing) by popping dominated elements.
- Amortized O(n): every element is pushed once and popped once.
- "Next greater" → decreasing stack; "next smaller" → increasing stack.
- A monotonic deque of indices answers sliding-window max in O(n).

### 3. The real-world analogy

A **queue of job candidates**: when a stronger, newer candidate arrives, the weaker earlier ones can never win and are dismissed.

### 4. Walkthrough

1. Next greater element for `[2, 1, 5, 3]`.
2. Scan left to right with a stack of waiting indices.
3. `5` arrives: pops 1 and 2 (their answer is 5).
4. End: `3` and `5` remain with no greater element → `[5, 5, -1, -1]`.

> [!NOTE]
> **Quick check:** Why O(n) despite a loop inside a loop? *Each element is popped at most once.*

---


Master the Technique for Next Greater/Smaller Element Problems

### 5. Check yourself

**Q1.** Next greater element for `[2,1,2,4,3]`?

<details><summary>Answer</summary>

`[4, 2, 4, -1, -1]`.

</details>

**Q2.** Cost of sliding-window maximum with a monotonic deque?

<details><summary>Answer</summary>

`O(n)`: each index enters and leaves the deque once.

</details>


## Table of Contents

0. [PART 0: Complete Understanding](#part-0)
1. [Fundamentals](15_Monotonic_Stack_Queue_Complete/01_what_problem_does_monotonic_stack_solve.md#fundamentals)
2. [Monotonic Stack Basics](15_Monotonic_Stack_Queue_Complete/01_what_problem_does_monotonic_stack_solve.md#monotonic-stack)
3. [Next Greater Element Pattern](15_Monotonic_Stack_Queue_Complete/01_what_problem_does_monotonic_stack_solve.md#next-greater)
4. [Next Smaller Element Pattern](15_Monotonic_Stack_Queue_Complete/01_what_problem_does_monotonic_stack_solve.md#next-smaller)
5. [Previous Greater/Smaller](15_Monotonic_Stack_Queue_Complete/01_what_problem_does_monotonic_stack_solve.md#previous)
6. [Monotonic Queue](15_Monotonic_Stack_Queue_Complete/01_what_problem_does_monotonic_stack_solve.md#monotonic-queue)
7. [Sliding Window Maximum/Minimum](15_Monotonic_Stack_Queue_Complete/02_sliding_window_maximum_minimum.md#sliding-window)
8. [Advanced Applications](15_Monotonic_Stack_Queue_Complete/02_sliding_window_maximum_minimum.md#advanced)
9. [Interview Problems](15_Monotonic_Stack_Queue_Complete/03_interview_problems.md#interview-problems)
10. [Quick Reference](15_Monotonic_Stack_Queue_Complete/03_interview_problems.md#quick-reference)

---

## PART 0: COMPLETE UNDERSTANDING — The WHY Before the WHAT <a name="part-0"></a>

## 📚 Topic Pages in This Chapter

This chapter is split into focused pages so each topic can be read on its own. Read them in order the first time; use the table to jump back later.

| # | Page | What is inside | Lines |
| --- | --- | --- | --- |
| 1 | [What Problem Does Monotonic Stack Solve](15_Monotonic_Stack_Queue_Complete/01_what_problem_does_monotonic_stack_solve.md) | What Problem Does Monotonic Stack Solve · Real-World Origin Story · The Mental Model: The Bouncer At A Nightclub · The Complete Variant Table · Fundamentals · … | 769 |
| 2 | [Sliding Window Maximum/Minimum](15_Monotonic_Stack_Queue_Complete/02_sliding_window_maximum_minimum.md) | Sliding Window Maximum/Minimum · Advanced Applications | 339 |
| 3 | [Interview Problems](15_Monotonic_Stack_Queue_Complete/03_interview_problems.md) | Interview Problems · Quick Reference · Summary · Reference Anchor · When Monotonic Stack/Queue Breaks · … | 456 |

## 🏢 Enterprise Lens — Monotonic Stack & Queue

| Area | What top-tier engineering looks like |
| ---- | ------------------------------------ |
| **Where it runs in production** | Stock span and price analytics, histogram/rectangle computations in rendering and layout, streaming window aggregates |
| **Failure modes** | Wrong monotonic direction; storing values instead of indices; stale elements outside the window |
| **Testing and verification** | Compare with an O(n²) brute force on random arrays; test equal values |

---

## Reality Check

**"Monotonic stack is a niche technique"** → Monotonic stack solves an entire family of problems in O(n): next greater element, previous smaller element, largest rectangle in histogram, maximal rectangle in binary matrix, stock span problem, and trapping rain water. These problems appear frequently in interviews and have direct applications in computational geometry and time series analysis.

**"Monotonic stack processes each element once"** → Each element is pushed onto the stack once AND popped from the stack at most once — total operations across all elements are O(n), not O(n) per element. This amortized analysis is crucial: the inner while loop that pops elements may run multiple times for a single element, but across all elements, total pops cannot exceed total pushes (n pushes total, n pops total, O(2n) = O(n)).

**"You need separate passes for next greater and previous greater"** → A single monotonic stack pass from left to right simultaneously determines: the previous greater element (what was on the stack when the current element was pushed) and the next greater element (when an element is popped, the element causing the pop is its next greater). The largest rectangle in histogram solution exploits this dual information in one pass.

**"Monotonic deque is just a deque with extra constraints"** → A monotonic deque (used in sliding window maximum/minimum) maintains elements in sorted order within the deque. It supports O(1) amortized insertion and O(1) maximum/minimum query. This makes it equivalent to a sliding window priority queue without the O(log n) overhead. The sliding window maximum of an array of size n with window size k runs in O(n) total, not O(n log k).

**"Stack-based problems always use explicit stacks"** → Recursion IS a stack (the call stack). Converting a recursive DFS to iterative DFS uses an explicit stack. Monotonic stack, expression evaluation stacks, and bracket matching stacks all use the same LIFO principle. Recognizing that a problem involves processing elements in LIFO order is the pattern — whether you use java.util.Stack, ArrayDeque, or recursion is an implementation choice.
