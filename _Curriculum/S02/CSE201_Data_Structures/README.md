# CSE201 — Data Structures

## Semester 2 · Computer Science Core

> **Total estimated time:** ~130 hours (16 weeks, ~8h/week)
> **Outcome:** You can implement any standard data structure from scratch, prove its time/space invariants, derive its complexity from first principles, and select the right structure for a given constraint profile.
> **Capstone:** Build a fully-tested DSA Toolkit library in Java with property-based tests for every structure (links to CAP01).

---

## Navigation

| Course                                                                       | Description |
| ---------------------------------------------------------------------------- | ----------- |
| **[CSE201 — Data Structures](CSE201_Data_Structures/README.md)**             | This course |
| **[CSE202 — Algorithms & Complexity](../CSE202_Algorithms_And_Complexity/README.md)** | S02 sibling — pairs week-by-week with this course |
| **[CSE203 — Probability & Statistics](../CSE203_Probability_And_Statistics/README.md)** | S02 sibling |
| **[CSE204 — Computer Architecture](../CSE204_Computer_Architecture/README.md)** | S02 sibling — explains the memory model DS depends on |

| Related Modules                                               | Cross-Reference                                          |
| ------------------------------------------------------------- | -------------------------------------------------------- |
| `02_Data_Structures/`                                         | Primary source of truth — every chapter cited below      |
| `03_Algorithms/`                                              | Algorithms ON these structures (sorting, searching, DP)  |
| `04_Patterns_Templates/`                                      | Pattern triggers that REVEAL which DS to use             |
| `07_Modern_Java/Ch08_Collections_Internals.md`                | Java standard library's actual implementations           |
| `14_Mental_Models/`                                           | "Constraint-first" reasoning when choosing a DS          |

---

## Prerequisites

- `02_Data_Structures/01a_Memory_Foundations.md` — stack vs heap, pointer arithmetic, cache lines
- `02_Data_Structures/A2_DS_Complexity_FirstPrinciples.md` §1-2 — amortized analysis preview
- Working knowledge of Java OR TypeScript (object references, generics, equals/hashCode)

**Constraint:** If your only language is Python or JavaScript, budget 4-6 hours extra in Week 1 to internalize that arrays-as-contiguous-memory is fundamentally different from Python lists. Cache locality only makes sense when you understand what "address +1" buys you.

---

## 🗓️ Week-by-Week Plan

### UNIT 1 — Memory, Arrays & Hash Tables (Weeks 1–3)

**Learning Outcomes:**

- Explain stack vs heap memory, cache lines, and why arrays achieve O(1) random access while linked lists don't
- Implement a dynamic array (ArrayList equivalent) with correct amortized O(1) push analysis
- Build a chaining-based hash table and prove average-case O(1) lookup
- Calculate time/space complexity for any nested loop structure

---

#### Week 1 — Memory Model & Arrays

| Day | Topic                                                    | Read                                                         | Do                                                                  |
| --- | -------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------- |
| 1   | Stack vs heap, pointer arithmetic, cache lines            | `02_Data_Structures/01a_Memory_Foundations.md` §1-3          | Trace: what happens to `int[] a = {1,2,3}` from declaration to GC   |
| 2   | Arrays: access, insert, delete; why insert-middle is O(n) | `02_Data_Structures/01b_Arrays.md` §1-3                       | Implement `shiftRight(int[] arr, int idx, int val)`                 |
| 3   | Big-O: time & space analysis from first principles        | `02_Data_Structures/A2_DS_Complexity_FirstPrinciples.md` §1-2 | Classify 10 code snippets with Big-O — justify each                 |
| 4   | 2D arrays, matrix traversal, row-major layout              | `02_Data_Structures/01b_Arrays.md` §4-6                       | Implement matrix transpose AND spiral-order traversal                |
| 5   | Lab Session — Dynamic Array                                | —                                                            | **Lab:** Implement `DynamicArray<T>` with amortized push/pop analysis (PS-1 Part B) |
| 6–7 | Review + Problem Set DS-PS1                                 | —                                                            | `02_Data_Structures/02_PROBLEM_SETS.md` PS-1                        |

**Section Challenge (cache locality):**

> An algorithm reads `arr[0], arr[1], arr[2], ..., arr[N]` sequentially. The SAME algorithm reads from `linkedList.next.next.next...` for N steps. Both are O(N) in Big-O. Why does the array version run 5-50× faster on real CPUs? What changes if N = 8 vs N = 8,000,000?

<details>
<summary>Answer</summary>

```
BIG-O HIDES THE CONSTANT.
Both walks are O(N) in operation count. But operation cost differs:

ARRAY WALK:
  arr[i] is at address base + i × sizeof(int).
  CPU prefetcher detects the linear pattern and pulls 64-byte cache
  lines ahead of time (typically 16 ints per line). For N=16, you
  pay ONE cache miss (~100ns) then 15 hits (~1ns each).

LINKED LIST WALK:
  next.next.next chases pointers to ARBITRARY heap addresses.
  Each node could be anywhere in memory. Prefetcher can't predict
  where next.next is — it has to wait for next.next to load to
  know its address. Result: cache miss EVERY hop = ~100ns × N.

FOR N=8:
  Array: ~7 cache hits + 1 miss = ~107ns
  List:  ~8 cache misses = ~800ns
  Ratio: ~7×

FOR N=8,000,000:
  Array: ~500,000 cache misses (one per line) + 7.5M hits ≈ 50ms
  List:  ~8M cache misses ≈ 800ms
  Ratio: ~16× (LL gets slower as N grows because TLB misses kick in)

WHY THIS MATTERS:
  Big-O guides algorithm choice between O(N) and O(N²).
  Cache effects determine which O(N) implementation wins.
  This is why Java's ArrayList is preferred over LinkedList
  for almost every use case — even when the API would suggest otherwise.
```

</details>

---

#### Week 2 — Hash Tables

| Day | Topic                                | Read                                                | Do                                                                                            |
| --- | ------------------------------------ | --------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 1   | Hash functions, collision strategies | `02_Data_Structures/01e_HashTable.md` §1-3          | Trace: what happens during a Java HashMap resize at load factor 0.75?                         |
| 2   | Chaining vs Open Addressing          | `02_Data_Structures/01e_HashTable.md` §4-6          | Implement chaining-based HashMap with `equals`/`hashCode`                                     |
| 3   | Java HashMap internals               | `07_Modern_Java/Ch08_Collections_Internals.md`      | Explain: why does HashMap need BOTH `equals` + `hashCode`?                                    |
| 4   | Real-world: frequency counting        | `04_Patterns_Templates/10_HashMap_Plus_Counting.md` | Solve: Top-K frequent elements with HashMap + heap                                            |
| 5   | Lab Session — Mini-Project P01        | —                                                   | **Mini-Project:** Frequency Analyzer (`00_CURRICULUM/PROJECTS/P01_Frequency_Analyzer.md`)     |
| 6–7 | Review + Problem Set DS-PS2           | —                                                   | `02_Data_Structures/02_PROBLEM_SETS.md` PS-2                                                  |

---

#### Week 3 — Amortized Analysis & Invariants

| Day | Topic                                 | Read                                                       | Do                                                                |
| --- | ------------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------- |
| 1   | Aggregate, accounting, potential methods | `02_Data_Structures/A2_DS_Complexity_FirstPrinciples.md` §3 | Prove dynamic-array push is amortized O(1) using accounting method |
| 2   | Structural invariants for hash tables  | `02_Data_Structures/A1_DS_Correctness_Invariants.md` §2     | Define invariants for chaining HashMap; show resize preserves them |
| 3   | Lower bounds for DS operations          | `02_Data_Structures/A3_DS_Lower_Bounds.md` §1               | Explain why comparison-based search has Ω(log n) lower bound       |
| 4   | Review                                  | —                                                          | Re-solve DS-PS1 and DS-PS2 challenge problems                      |
| 5   | UNIT 1 Quiz                             | —                                                          | Self-quiz (closed book): 10 questions from §1-2 of each chapter    |

---

### UNIT 2 — Linked Lists, Stacks & Queues (Weeks 4–6)

**Learning Outcomes:**

- Implement singly, doubly, and circular linked lists; detect cycles using Floyd's algorithm
- Build stack and queue from BOTH linked list and array; analyze trade-offs
- Recognize when monotonic stack/queue collapses brute-force O(n²) to O(n)

---

#### Week 4 — Linked Lists

| Day | Topic                              | Read                                                      | Do                                                        |
| --- | ---------------------------------- | --------------------------------------------------------- | --------------------------------------------------------- |
| 1   | Node structure, head/tail pointers | `02_Data_Structures/01c_LinkedList.md` §1-2               | Draw memory diagram of a 3-node singly linked list        |
| 2   | Insertion, deletion, reversal      | `02_Data_Structures/01c_LinkedList.md` §3-4               | Implement `reverse(Node head)` iteratively + recursively  |
| 3   | Cycle detection (Floyd's)          | `04_Patterns_Templates/12_LinkedList_Plus_TwoPointers.md` | Trace Floyd's through a cyclic list; prove it terminates  |
| 4   | Merge two sorted lists              | `05_Problem_Solving/04_Arrays.md` (LinkedList variants)   | Implement `mergeSorted(Node a, Node b)` without extra space |
| 5   | Lab Session                        | —                                                         | **Lab:** LRU Cache using HashMap + DoublyLinkedList       |
| 6–7 | Review + Problem Set DS-PS3        | —                                                         | `02_Data_Structures/02_PROBLEM_SETS.md` PS-3              |

---

#### Week 5 — Stacks, Queues & Monotonic Stack

| Day | Topic                                   | Read                                                      | Do                                                        |
| --- | --------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------- |
| 1   | Stack ADT — push/pop/peek, LIFO         | `02_Data_Structures/01d_Stack_Queue.md` §1-3              | Implement using both array and linked list — compare      |
| 2   | Queue & Deque — FIFO, sliding window    | `02_Data_Structures/01d_Stack_Queue.md` §4-6              | Implement Deque using circular array; handle wrap-around  |
| 3   | Monotonic Stack — intuition & invariant | `03_Algorithms/15_Monotonic_Stack_Queue_Complete.md`      | Trace Next Greater Element manually                       |
| 4   | Monotonic Stack — problems              | `04_Patterns_Templates/11_Stack_Plus_MonotonicPattern.md` | Solve: Daily Temperatures, Largest Rectangle in Histogram |
| 5   | Lab + Review                            | —                                                         | Implement `ExpressionEvaluator` (shunting-yard) using two stacks |
| 6–7 | Review + Problem Set DS-PS4             | —                                                         | `02_Data_Structures/02_PROBLEM_SETS.md` PS-4              |

**Section Challenge (monotonic stack):**

> Given an array `[2, 1, 5, 6, 2, 3]`, find the largest rectangle in a histogram in **O(n)** time. A monotonic stack solves this. Explain WHY: what invariant does the stack maintain, and how does popping in a specific direction reveal the answer?

<details>
<summary>Answer</summary>

```
INVARIANT:
  Stack stores INDICES, not heights. Heights at those indices are
  STRICTLY INCREASING from bottom to top.

WHEN TO POP:
  Process arr[i]. While stack.top has height > arr[i], pop.
  WHY: a taller bar to the LEFT (the popped one) cannot extend
  rightward past i (because arr[i] is shorter — blocks expansion).
  So the popped bar's MAXIMAL rectangle has:
    height = arr[popped]
    right boundary = i (exclusive)
    left boundary = new stack.top (exclusive) after pop

AMORTIZED ARGUMENT:
  Each index is pushed at most once, popped at most once.
  → Total operations = 2n, so the algorithm is O(n) amortized.

WHY THIS IS A "PATTERN", NOT A TRICK:
  Any problem asking "for each element, find the nearest
  smaller/greater element on the left/right" has the same
  monotonic-stack shape. Recognize the trigger:
  "for each x in array, find related-x-on-side-with-condition"
  → monotonic stack is your O(n) move.
```

</details>

---

#### Week 6 — UNIT 2 Catch-Up & Review

Buffer week for re-implementation of any structure where the lab failed. Re-solve PS-3 and PS-4 problems. Take UNIT 2 quiz (`00_CURRICULUM/EXAM_BANK.md` S02 section).

---

### UNIT 3 — Trees & Heaps (Weeks 7–10)

**Learning Outcomes:**

- Implement BST insertion/deletion; understand why naive BST degenerates to O(n)
- Reason about AVL and red-black rotations; prove balance invariants
- Build a binary heap; implement priority queue; derive heap-sort
- Master tries for prefix problems; understand the space-time tradeoff

---

#### Week 7 — Binary Search Trees

| Day | Topic                                    | Read                                                  | Do                                                         |
| --- | ---------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------- |
| 1   | BST invariant, recursive structure       | `02_Data_Structures/01f_Trees_Heaps.md` §1-2          | Implement `insert(node, val)` and `search(node, val)`      |
| 2   | BST deletion — three cases               | `02_Data_Structures/01f_Trees_Heaps.md` §3            | Trace deletion of root, leaf, and two-child node           |
| 3   | Why naive BST degenerates → AVL rotations | `02_Data_Structures/A1_DS_Correctness_Invariants.md` §3 | Trace single + double rotations; verify balance restored   |
| 4   | Red-Black Trees — relaxed invariant      | `02_Data_Structures/01f_Trees_Heaps.md` §5            | Why does Java's TreeMap use RB-trees not AVL? (write-heavy) |
| 5   | Lab — Self-balancing BST                 | —                                                     | **Lab:** Implement AVL with rotation correctness tests     |
| 6–7 | Review + Problem Set DS-PS5              | —                                                     | `02_Data_Structures/02_PROBLEM_SETS.md` PS-5               |

---

#### Week 8 — Heaps & Priority Queues

| Day | Topic                                | Read                                              | Do                                                       |
| --- | ------------------------------------ | ------------------------------------------------- | -------------------------------------------------------- |
| 1   | Binary heap invariant; array layout  | `02_Data_Structures/01f_Trees_Heaps.md` §6        | Derive parent/child index formulas; prove with induction |
| 2   | sift-up, sift-down, heapify          | `02_Data_Structures/01f_Trees_Heaps.md` §7        | Implement `MinHeap<T>`; verify O(log n) push/pop          |
| 3   | Heap sort                            | `03_Algorithms/02a_Sorting_Fundamentals.md` §5    | Trace heap sort on [5,2,8,1,9,3]; explain in-place property |
| 4   | Top-K problems — heap or quickselect? | `04_Patterns_Templates/14_Heap_Plus_TopK.md`      | Compare: k-largest with heap (O(n log k)) vs quickselect (O(n)) |
| 5   | Lab + Review                         | —                                                 | Implement event scheduler with priority queue            |
| 6–7 | Review + Problem Set DS-PS6          | —                                                 | `02_Data_Structures/02_PROBLEM_SETS.md` PS-6             |

---

#### Week 9 — Tries

| Day | Topic                                | Read                                              | Do                                                       |
| --- | ------------------------------------ | ------------------------------------------------- | -------------------------------------------------------- |
| 1   | Trie node structure; insert/search  | `02_Data_Structures/01g_Trie.md` §1-2             | Build trie from ["app", "apple", "ape"]; draw it         |
| 2   | Prefix queries vs hash lookup        | `02_Data_Structures/01g_Trie.md` §3               | Compare: prefix search with trie vs sorted array + bsearch |
| 3   | Autocomplete + ranking              | `04_Patterns_Templates/18_Trie_Plus_Wildcards.md` | Implement autocomplete returning top-5 by frequency      |
| 4   | Space optimization — radix/Patricia  | `02_Data_Structures/01g_Trie.md` §5               | Explain when radix tree beats trie (sparse alphabet)     |
| 5–7 | Review + Lab                         | —                                                 | Lab: spell-check using trie + edit distance ≤ 1          |

---

#### Week 10 — UNIT 3 Catch-Up

Buffer + integration: implement all Unit 3 structures as a single coherent library. UNIT 3 quiz.

---

### UNIT 4 — Graphs (Weeks 11–13)

**Learning Outcomes:**

- Build graphs using adjacency list AND matrix; choose between them by density
- Implement BFS and DFS iteratively (using own stack/queue) and recursively
- Reason about graph traversal invariants — visited set, parent tracking, depth tracking

---

#### Week 11 — Graph Representations & BFS

| Day | Topic                                  | Read                                              | Do                                                       |
| --- | -------------------------------------- | ------------------------------------------------- | -------------------------------------------------------- |
| 1   | Adjacency list vs matrix; sparse vs dense | `02_Data_Structures/01h_Graphs.md` §1-2        | When does V=10K, E=20M favor matrix? (memory math)       |
| 2   | BFS — queue invariant                  | `03_Algorithms/05c_Graphs_Fundamentals.md` §2     | Implement BFS with parent tracking; recover shortest path |
| 3   | BFS variants — level-order, multi-source | `04_Patterns_Templates/16_BFS_Plus_Levels.md`     | Solve: rotting oranges (multi-source BFS)                |
| 4   | Lab                                    | —                                                 | Lab: word ladder using BFS                               |
| 5–7 | Review + Problem Set DS-PS7            | —                                                 | `02_Data_Structures/02_PROBLEM_SETS.md` PS-7             |

---

#### Week 12 — DFS & Cycle Detection

| Day | Topic                                  | Read                                              | Do                                                       |
| --- | -------------------------------------- | ------------------------------------------------- | -------------------------------------------------------- |
| 1   | DFS — recursive structure; stack version | `03_Algorithms/05c_Graphs_Fundamentals.md` §3-4 | Implement DFS both ways; trace on sample graph           |
| 2   | Cycle detection (directed + undirected) | `04_Patterns_Templates/17_DFS_Plus_State.md`     | Why 3-color state for directed? Trace on sample          |
| 3   | Topological sort (Kahn's BFS + DFS)    | `03_Algorithms/05d_Graphs_Advanced_Algos.md` §1   | Solve: course schedule problem; explain DAG requirement  |
| 4–5 | Lab + Review                           | —                                                 | Lab: build-system dependency resolver                    |
| 6–7 | Problem Set DS-PS8                     | —                                                 | `02_Data_Structures/02_PROBLEM_SETS.md` PS-8             |

---

#### Week 13 — Union-Find & Connectivity

| Day | Topic                                | Read                                              | Do                                                       |
| --- | ------------------------------------ | ------------------------------------------------- | -------------------------------------------------------- |
| 1   | Union-Find structure; find + union   | `02_Data_Structures/01i_UnionFind.md` §1-2        | Implement with path compression                          |
| 2   | Union by rank + path compression → α(n) | `02_Data_Structures/01i_UnionFind.md` §3-4     | Trace amortized α(n) analysis (Ackermann-inverse)        |
| 3   | Applications — connectivity, MST     | `03_Algorithms/05d_Graphs_Advanced_Algos.md` §2   | Solve: Kruskal's MST using UF                            |
| 4–7 | Review + Final UNIT 4 Quiz           | —                                                 | UNIT 4 quiz from `00_CURRICULUM/EXAM_BANK.md`            |

---

### UNIT 5 — Capstone & Integration (Weeks 14–16)

**Learning Outcomes:**

- Integrate all data structures into a coherent library
- Write property-based tests verifying structural invariants
- Benchmark JMH measurements against Java standard library

**Capstone Project:** [CAP01 — DSA Toolkit](../../../00_CURRICULUM/PROJECTS/CAP01_DSA_Toolkit.md)

| Week | Deliverable                          | Acceptance Criteria                                            |
| ---- | ------------------------------------ | -------------------------------------------------------------- |
| 14   | Linear structures + tests             | DynamicArray, LinkedList, Stack, Queue, Deque, HashMap         |
| 15   | Trees, heaps, tries                   | BST, AVL, MinHeap, Trie with rotation/heapify correctness tests |
| 16   | Graphs + integration                  | Adjacency-list Graph with BFS/DFS/TopoSort/UnionFind + benchmarks vs JDK |

---

## Problem Sets

All problem sets live in [`02_Data_Structures/02_PROBLEM_SETS.md`](../../../02_Data_Structures/02_PROBLEM_SETS.md). Map of unit → PS:

| Unit | Problem Sets | Topic                              |
| ---- | ------------ | ---------------------------------- |
| 1    | DS-PS1, DS-PS2 | Arrays, hash tables               |
| 2    | DS-PS3, DS-PS4 | Linked lists, stacks, queues       |
| 3    | DS-PS5, DS-PS6 | Trees, heaps, tries                |
| 4    | DS-PS7, DS-PS8 | Graphs, BFS/DFS, union-find        |

---

## Exam Prep

- [`00_CURRICULUM/EXAM_BANK.md`](../../../00_CURRICULUM/EXAM_BANK.md) — S02 section
- [`02_Data_Structures/03_DSA_Deep_Reasoning.md`](../../../02_Data_Structures/03_DSA_Deep_Reasoning.md) — interview freeze moments

## University Methodology Layer

Read these IN PARALLEL with the weekly chapters for the formal foundation:

| File | Maps to syllabus topic |
|------|------------------------|
| [A1 — DS Correctness & Invariants](../../../02_Data_Structures/A1_DS_Correctness_Invariants.md) | BST/heap/hash structural invariants, AVL rotation correctness |
| [A2 — DS Complexity from First Principles](../../../02_Data_Structures/A2_DS_Complexity_FirstPrinciples.md) | Amortized analysis for mutable structures (dynamic arrays, Union-Find) |
| [A3 — Lower Bounds for DS](../../../02_Data_Structures/A3_DS_Lower_Bounds.md) | Cell-probe lower bounds, comparison tree bounds, information-theoretic limits |
| [A4 — Randomized Data Structures](../../../02_Data_Structures/A4_Randomized_Data_Structures.md) | Skip lists, treaps, Bloom filters, cuckoo hashing, HyperLogLog |
