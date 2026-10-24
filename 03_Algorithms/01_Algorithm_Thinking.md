> **Navigation**: [Chapter index](00_INDEX.md) | [Sorting Fundamentals →](02a_Sorting_Fundamentals.md)

# 🧠 Algorithm Thinking: How to Approach Any Problem

## Learning the LOGIC, Not Just the Code

---

## 🔗 Bridge — Where This Chapter Fits

| Dimension | This chapter |
| --- | --- |
| **Builds on** | Basic programming (loops, arrays, functions) |
| **You will learn** | A repeatable method: read constraints, brute force first, find the bottleneck, pick a structure or paradigm, state the invariant |
| **Leads to** | [A1 Proofs](A1_Correctness_Proofs.md), [A2 Complexity](A2_Complexity_FirstPrinciples.md), [Sorting](02a_Sorting_Fundamentals.md) |
| **Abstraction level** | L0–L1: from "write code" to "choose an approach with a cost model" |

> [!NOTE]
> The full gap-free reading order and dependency graph are in the [Learning Path](00_LEARNING_PATH.md).

---

## 💬 Explain It Like a Study Partner — Algorithm Thinking

### 1. The bottom line

Solve problems by reading the constraints first and letting them tell you which cost you can afford.

### 2. The textbook core

- Input size `n` and the time limit give a **complexity budget** (n ≤ 10⁵ → about O(n log n); n ≤ 20 → exponential is fine).
- The loop: **understand → brute force → bottleneck → better idea → invariant → code → test edge cases**.
- Brute force is a *baseline and a test oracle*, not a failure.
- Edge cases to try every time: empty, one element, duplicates, extremes, already sorted.

### 3. The real-world analogy

A **doctor reading symptoms first**: constraints are symptoms, algorithms are treatments, and you do not prescribe before diagnosing.

### 4. Walkthrough

1. Problem: find two numbers in an array of 10⁵ values that sum to a target.
2. Constraint check: O(n²) = 10¹⁰ steps is too slow.
3. Brute force exposes the bottleneck: searching for the partner of each number.
4. A hash map removes the search → O(n) time, O(n) space.

> [!NOTE]
> **Quick check:** What does n = 10⁵ rule out? *Anything quadratic.*


### 5. Check yourself

**Q1.** `n = 10⁵` and a one-second limit. Which complexity class is ruled out?

<details><summary>Answer</summary>

Quadratic, `O(n²)` — about 10¹⁰ steps. Aim for `O(n log n)` or `O(n)`.

</details>

**Q2.** Why write the brute force first even if you know it is too slow?

<details><summary>Answer</summary>

It exposes the bottleneck and gives you a correct oracle to test the optimised version against on random inputs.

</details>

---


## 📚 Topic Pages in This Chapter

This chapter is split into focused pages so each topic can be read on its own. Read them in order the first time; use the table to jump back later.

| # | Page | What is inside | Lines |
| --- | --- | --- | --- |
| 1 | [Section 0 — Why Algorithm Choice Is a Production Decision](01_Algorithm_Thinking/01_section_0_why_algorithm_choice_is.md) | Section 0 — Why Algorithm Choice Is a… · Complete Understanding + Growth Mindset · the Universal Problem — Solving Framework · Pattern Recognition | 337 |
| 2 | [the Thinking Process for Each Pattern](01_Algorithm_Thinking/02_the_thinking_process_for_each_pattern.md) | the Thinking Process for Each Pattern · Common Thinking Mistakes · Practice Methodology · Interview Thinking Out Loud | 675 |

## 🏢 Enterprise Lens — Algorithm Thinking

| Area | What top-tier engineering looks like |
| ---- | ------------------------------------ |
| **Where it runs in production** | Algorithm selection in code review, capacity planning ("what happens at 10× data?"), performance budgets in design documents |
| **Failure modes** | Choosing a structure before reading the constraints; skipping the brute-force oracle so correctness cannot be verified |
| **Testing and verification** | Keep a slow reference implementation and compare outputs on random inputs |

---

## Reality Check

**"Once you identify the pattern, the solution is obvious"** → Pattern recognition tells you the *category* (sliding window, BFS, DP). It doesn't hand you the recurrence, the state definition, the index logic, or the edge cases. Recognising "this is a DP problem" is like knowing "this is a chemistry problem" — you still have to do the chemistry.

**"Brute force is never acceptable in an interview"** → Brute force is always the starting point. State it first, analyse its complexity, then optimise. A correct O(n²) solution beats a buggy O(n log n) solution every time. Interviewers want to see the progression: understand → brute force → optimise → code → test.

**"Time complexity is the only thing that matters"** → Space complexity is equally important in constrained environments (mobile, embedded, GPU memory). Readability and maintainability matter in production. A 2× faster algorithm that nobody on your team can debug or modify is often the wrong choice.

**"An algorithm that works on the examples must be correct"** → Examples in problems are usually the happy path. Edge cases that kill algorithms: empty input, single element, all-same elements, sorted/reverse-sorted input, max integer values causing overflow, floating-point rounding. Always test these explicitly.

**"Big O tells you how fast an algorithm is"** → Big O tells you the *growth rate* relative to input size, not the absolute speed. An O(n) algorithm with constant C=10^8 (e.g., touching 100M bytes per element) can be slower than O(n²) with C=1 for n < 10^4. Big O hides constants, lower-order terms, and cache behaviour — all of which matter in practice.
