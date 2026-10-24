# Stack Queue

> **Navigation**: [← LinkedList](15_LinkedList.md) | [Chapter index](00_INDEX.md) | [SECTION: RECURSION & SUBSETS… →](22_Recursion_Subsets.md)

﻿**Navigation**: [< Previous](07_Binary_Search.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](09_Trees.md)


---

## 🔗 Bridge — Where This Chapter Fits

| Dimension | This chapter |
| --- | --- |
| **Builds on** | [Stack & Queue](../02_Data_Structures/01d_Stack_Queue.md), [Monotonic patterns](../04_Patterns_Templates/11_Stack_Plus_MonotonicPattern.md) |
| **You will learn** | Bracket matching, expression evaluation, monotonic stacks, queues with stacks, and sliding-window maximum |
| **Leads to** | [Trees](09_Trees.md), [Recursion](22_Recursion_Subsets.md) |
| **Abstraction level** | Nested scans → **LIFO/FIFO state** |

> [!NOTE]
> The full gap-free reading order and dependency graph are in the [Learning Path](00_LEARNING_PATH.md).

---

## 💬 Explain It Like a Study Partner — Stack & Queue Problems

### 1. The bottom line

A stack remembers unfinished work in reverse order; a queue processes things in arrival order.

### 2. The textbook core

- Brackets: push openers, pop on closers.
- Monotonic stack: keep candidates in order; pop what the new element beats.
- Queue via two stacks: amortised `O(1)`.
- Deque: sliding-window maximum in `O(n)`.
- Store indices to compute distances.

### 3. The real-world analogy

A **stack of plates** and a **queue at a shop**.

### 4. Walkthrough

1. Daily temperatures `[73,74,75,71,69,72,76,73]`.
2. Stack holds indices of unresolved days.
3. A warmer day pops and resolves colder days.
4. Answers `[1,1,4,2,1,1,0,0]`.

> [!NOTE]
> **Quick check:** Why does the monotonic stack run in `O(n)`? *Each index is pushed and popped once.*


### 5. Check yourself

**Q1.** Is `"([)]"` a valid bracket string?

<details><summary>Answer</summary>

No: the `)` meets `[` on top of the stack.

</details>

**Q2.** Evaluate the reverse-Polish expression `["2","1","+","3","*"]`.

<details><summary>Answer</summary>

**9**: `(2 + 1) * 3`.

</details>

---


## 🗺️ Pattern Recognition Header — Stack & Queue

**When to use Stack vs Queue?**

| Trigger Words                           | Structure        | Sub-type             |
| --------------------------------------- | ---------------- | -------------------- |
| `match brackets / valid expression`     | Stack            | Push open, pop close |
| `next greater / next smaller element`   | Monotonic Stack  | Decreasing stack     |
| `largest rectangle / area in histogram` | Monotonic Stack  | Ascending stack      |
| `evaluate arithmetic expression`        | Two Stacks       | Nums + operators     |
| `BFS / level-by-level traversal`        | Queue            | Standard BFS         |
| `sliding window max / min`              | Monotonic Deque  | Decreasing deque     |
| `design min/max stack`                  | Stack + tracking | Pair (val, minSoFar) |

**The Core Mental Models:**

```
STACK → "What's the LAST (most recent) unresolved thing?"
QUEUE → "What's the OLDEST (arrived first) thing that I need to process?"
```

- 📖 **Mental Model:** [04_Array_String_Thinking.md](../14_Mental_Models/04_Array_String_Thinking.md)
- 📖 **Complexity Analysis:** [09_Complexity_Intuition.md](../14_Mental_Models/09_Complexity_Intuition.md)
- 📖 **Full Pattern Guide:** [00_PATTERN_MASTER_GUIDE.md](../04_Patterns_Templates/00_PATTERN_MASTER_GUIDE.md)

---

## 📚 Topic Pages in This Chapter

This chapter is split into focused pages so each topic can be read on its own. Read them in order the first time; use the table to jump back later.

| # | Page | What is inside | Lines |
| --- | --- | --- | --- |
| 1 | [SECTION 7: STACK & QUEUE PROBLEMS](08_Stack_Queue/01_section_7_stack_queue_problems.md) | SECTION 7: STACK & QUEUE PROBLEMS · WHY Stack/Queue — The Two Most… | 218 |
| 2 | [7.1 Basic Stack Problems](08_Stack_Queue/02_basic_stack_problems.md) | 7.1 Basic Stack Problems | 445 |
| 3 | [7.2 Monotonic Stack Problems](08_Stack_Queue/03_monotonic_stack_problems.md) | 7.2 Monotonic Stack Problems | 434 |
| 4 | [7.3 Queue Problems](08_Stack_Queue/04_queue_problems.md) | 7.3 Queue Problems | 447 |
| 5 | [7.4 Advanced Stack Problems](08_Stack_Queue/05_advanced_stack_problems.md) | 7.4 Advanced Stack Problems | 253 |
| 6 | [7.5 HackerEarth & Codeforces Stack/Queue Problems](08_Stack_Queue/06_hackerearth_codeforces_stack_queue_problems.md) | 7.5 HackerEarth & Codeforces Stack/Queue… · Competitive Programming — Codeforces Problems · Real-World Applications of Stack & Queue | 284 |

## 🏢 Enterprise Lens — Stack & Queue Problems

| Area | What top-tier engineering looks like |
| ---- | ------------------------------------ |
| **Where it runs in production** | Expression parsing, undo/redo, task queues |
| **Failure modes** | Wrong monotone direction; popping an empty stack |
| **Testing and verification** | Brute force `O(n²)` next-greater scan |

---

## Reality Check

**"Stack problems announce themselves with the word stack"** → The trigger is NESTING or MOST-RECENT-FIRST semantics hiding in the story: valid parentheses, collapsing adjacent duplicates, evaluating expressions, undo semantics, directory path simplification, asteroid collisions. None say stack; all are "the newest unresolved thing resolves first." Training the trigger phrase — newest-unresolved-first — routes these instantly, where keyword-matching routes none of them.

**"Queue-via-stacks and stack-via-queues are textbook filler"** → The two-stack queue teaches AMORTIZED reasoning in its purest form: each element moves between stacks at most once, so occasional expensive flips average to O(1) — the same argument shape as dynamic arrays and cyclic sort. It is also production-real: persistent functional queues and some job-buffer designs use exactly this structure. The exercise is the proof technique, not the container.

**"Min-stack needs clever encoding"** → The auxiliary-stack version (push the running min alongside) is honest, simple, and interview-sufficient; the O(1)-extra encoded version (store deltas against the min) is a follow-up curiosity with overflow hazards. Knowing WHICH version to lead with is judgment practice: lead simple, mention the exotic upgrade exists, produce it only on request. Candidates who lead with the delta encoding and fumble its negative-value cases lose to candidates who shipped the plain version in two minutes.

**"Expression evaluation is a solved parser problem, skip it"** → Basic-calculator problems are the standard vehicle for two-stack (values and operators) reasoning with precedence — and the specific bugs they drill are perennial: unary minus versus binary minus, multi-digit number assembly, whitespace, and parenthesis-as-recursive-reset. These same seams appear in every real tokenizer or filter-expression feature you will ever ship; the interview problem is a compressed rehearsal.

**"Deque problems are rare enough to skip"** → The deque earns its slot through one heavyweight application — sliding-window maximum in O(n) — plus its role as THE iterative-DFS/BFS container (ArrayDeque outperforms both Stack and LinkedList in Java, and Stack-the-class is a synchronized legacy type you should never write in new code). One structure, two must-know facts; skipping deques means hand-rolling worse versions of both.
