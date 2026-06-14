# 📅 Semester 1 Guide — Foundations

## Data Structures · Algorithms · Java Core · JVM Internals

> **Total estimated time:** ~130 hours (16 weeks, ~8h/week)  
> **Outcome:** You can implement any standard data structure from scratch, reason about time/space complexity, write production-quality Java, and understand what the JVM is doing under the hood.  
> **Capstone:** Build a fully-tested DSA Toolkit library in Java.

---

## 🗓️ Week-by-Week Plan

### UNIT 1 — Memory, Arrays & Complexity (Weeks 1–2)

**Learning Outcomes:**

- Explain stack vs heap memory, cache lines, and why arrays are O(1) random access
- Implement dynamic array (ArrayList equivalent) from scratch
- Calculate time/space complexity for any loop structure

**Week 1 — Memory Model & Arrays**

| Day | Topic                             | Read                                           | Do                                                                       |
| --- | --------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------ |
| 1   | Stack vs Heap, pointer arithmetic | `02_Data_Structures/01a_Memory_Foundations.md` | Trace: what happens to `int[] a = {1,2,3}` in memory?                    |
| 2   | Arrays: access, insert, delete    | `02_Data_Structures/01b_Arrays.md` §1-3        | Implement `shiftRight(int[] arr, int idx)`                               |
| 3   | Big-O: time & space analysis      | `03_Algorithms/01_Algorithm_Thinking.md` §1-2  | Classify 10 code snippets with Big-O                                     |
| 4   | 2D Arrays, matrix traversal       | `02_Data_Structures/04_2D_Arrays_Matrix.md`    | Implement matrix transpose + spiral order                                |
| 5   | Lab Session                       | —                                              | **Lab:** Implement DynamicArray from scratch (Problem Set DS-PS1 Part B) |
| 6–7 | Review + **Problem Set DS-PS1**   | —                                              | Complete Problem Set in `02_Data_Structures/02_PROBLEM_SETS.md` PS-1     |

**Week 2 — Hash Tables**

| Day | Topic                                | Read                                                | Do                                                                                            |
| --- | ------------------------------------ | --------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 1   | Hash functions, collision strategies | `02_Data_Structures/01e_HashTable.md` §1-3          | Trace: what happens during a HashMap resize?                                                  |
| 2   | Chaining vs Open Addressing          | `02_Data_Structures/01e_HashTable.md` §4-6          | Implement chaining-based HashMap                                                              |
| 3   | Java HashMap internals               | `07_Modern_Java/Ch08_Collections_Internals.md`      | Explain: why does HashMap need `equals` + `hashCode`?                                         |
| 4   | Real-world use: frequency counting   | `04_Patterns_Templates/10_HashMap_Plus_Counting.md` | Solve: Top-K frequent elements                                                                |
| 5   | Lab Session                          | —                                                   | **Mini-Project P01:** Frequency Analyzer (`00_CURRICULUM/PROJECTS/P01_Frequency_Analyzer.md`) |
| 6–7 | Review + **Problem Set DS-PS2**      | —                                                   | Complete PS-2 in `02_Data_Structures/02_PROBLEM_SETS.md`                                      |

---

### UNIT 2 — Linked Lists, Stacks & Queues (Weeks 3–4)

**Learning Outcomes:**

- Implement singly and doubly linked lists, detect cycles, reverse in-place
- Build stack and queue from linked list AND array
- Understand monotonic stack: when and why it demolishes brute force

**Week 3 — Linked Lists**

| Day | Topic                              | Read                                                      | Do                                                        |
| --- | ---------------------------------- | --------------------------------------------------------- | --------------------------------------------------------- |
| 1   | Node structure, head/tail pointers | `02_Data_Structures/01c_LinkedList.md` §1-2               | Draw memory diagram of a 3-node singly linked list        |
| 2   | Insertion, deletion, reversal      | `02_Data_Structures/01c_LinkedList.md` §3-4               | Implement `reverse(Node head)` iteratively + recursively  |
| 3   | Cycle detection (Floyd's)          | `04_Patterns_Templates/12_LinkedList_Plus_TwoPointers.md` | Trace Floyd's through a cyclic list                       |
| 4   | Merge two sorted lists             | `05_Problem_Solving/15_LinkedList.md`                     | Implement `mergeSorted(Node a, Node b)`                   |
| 5   | Lab Session                        | —                                                         | LRU Cache implementation using HashMap + DoublyLinkedList |
| 6–7 | Review + **Problem Set DS-PS3**    | —                                                         | Complete PS-3 in `02_Data_Structures/02_PROBLEM_SETS.md`  |

**Week 4 — Stacks, Queues & Monotonic Stack**

| Day | Topic                                   | Read                                                      | Do                                                        |
| --- | --------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------- |
| 1   | Stack ADT — push/pop/peek, LIFO         | `02_Data_Structures/01d_Stack_Queue.md` §1-3              | Implement using both array and linked list                |
| 2   | Queue & Deque — FIFO, sliding window    | `02_Data_Structures/01d_Stack_Queue.md` §4-6              | Implement Deque using circular array                      |
| 3   | Monotonic Stack — intuition & invariant | `03_Algorithms/15_Monotonic_Stack_Queue_Complete.md`      | Trace Next Greater Element manually                       |
| 4   | Monotonic Stack — problems              | `04_Patterns_Templates/11_Stack_Plus_MonotonicPattern.md` | Solve: Daily Temperatures, Largest Rectangle in Histogram |
| 5   | Lab + Review                            | —                                                         | Implement an `ExpressionEvaluator` using two stacks       |
| 6–7 | Review + **Problem Set DS-PS4**         | —                                                         | Complete PS-4 in `02_Data_Structures/02_PROBLEM_SETS.md`  |

---

### UNIT 3 — Trees & Heaps (Weeks 5–7)

**Learning Outcomes:**

- Implement BST with insert, delete, search, and all traversals
- Build MinHeap from scratch; understand heap sort
- Apply DFS/BFS to trees; know when each is correct

**Week 5 — Binary Trees & BST**

| Day | Topic                                       | Read                                         | Do                                                          |
| --- | ------------------------------------------- | -------------------------------------------- | ----------------------------------------------------------- |
| 1   | Tree vocabulary, properties                 | `02_Data_Structures/01f_Trees_Heaps.md` §1-2 | Draw the memory layout of a 5-node BST                      |
| 2   | Tree traversals (in/pre/post, BFS)          | `02_Data_Structures/01f_Trees_Heaps.md` §3   | Implement all 4 traversals iteratively                      |
| 3   | BST: insert, delete, search                 | `03_Algorithms/05_Trees.md` §1-3             | Implement full BST class with all operations                |
| 4   | BST validation + height balancing intuition | `03_Algorithms/05_Trees.md` §4-5             | Implement `isValidBST()` using inorder invariant            |
| 5   | Lab                                         | —                                            | Build a word frequency BST (store words, count occurrences) |
| 6–7 | Problem Set ALGO-PS1                        | —                                            | `03_Algorithms/03_PROBLEM_SETS.md` PS-1 (Trees)             |

**Week 6 — Heaps & Priority Queues**

| Day | Topic                                | Read                                                    | Do                                                 |
| --- | ------------------------------------ | ------------------------------------------------------- | -------------------------------------------------- |
| 1   | Heap property, array representation  | `02_Data_Structures/01f_Trees_Heaps.md` §5-6            | Draw heap array from tree and vice versa           |
| 2   | MinHeap: insert, extractMin, heapify | `02_Data_Structures/01f_Trees_Heaps.md` §7              | Implement MinHeap from scratch                     |
| 3   | Heap sort                            | `03_Algorithms/02b_Sorting_Advanced.md` §Heap Sort      | Trace heap sort on `[5,3,8,1,9,2]` step by step    |
| 4   | Top-K patterns with heap             | `04_Patterns_Templates/15_Heap_Plus_GreedySelection.md` | Solve: K closest points to origin                  |
| 5   | Lab                                  | —                                                       | Implement a `MedianFinder` (two heaps — min + max) |
| 6–7 | Problem Set ALGO-PS2                 | —                                                       | `03_Algorithms/03_PROBLEM_SETS.md` PS-2 (Heaps)    |

**Week 7 — Advanced Trees (AVL, Tries, Segment Trees intro)**

| Day | Topic                               | Read                                                      | Do                                                       |
| --- | ----------------------------------- | --------------------------------------------------------- | -------------------------------------------------------- |
| 1   | AVL rotations — why balance matters | `03_Algorithms/07c_Advanced_Trees_Deep.md` §AVL           | Trace left-left and left-right rotations                 |
| 2   | Trie: insert, search, prefix search | `03_Algorithms/18_Bitwise_Trie_Java_Complete.md` §1-3     | Implement Trie in Java                                   |
| 3   | Segment Tree: range queries         | `03_Algorithms/07b_Advanced_DS_Patterns.md` §Segment Tree | Implement range sum query with segment tree              |
| 4   | Fenwick Tree (BIT): prefix sums     | `03_Algorithms/07b_Advanced_DS_Patterns.md` §Fenwick      | Implement BIT for range sum                              |
| 5   | Lab                                 | —                                                         | Implement autocomplete system using Trie                 |
| 6–7 | Problem Set ALGO-PS3                | —                                                         | `03_Algorithms/03_PROBLEM_SETS.md` PS-3 (Advanced Trees) |

---

### UNIT 4 — Sorting, Searching & Greedy (Weeks 8–9)

**Learning Outcomes:**

- Know which sorting algorithm to use and when (stability, in-place, cache behavior)
- Apply binary search correctly to monotone predicates — not just sorted arrays
- Design greedy algorithms with proof of optimality

**Week 8 — Sorting Algorithms**

| Day | Topic                          | Read                                                   | Do                                                                   |
| --- | ------------------------------ | ------------------------------------------------------ | -------------------------------------------------------------------- |
| 1   | Selection, Insertion, Bubble   | `03_Algorithms/02a_Sorting_Fundamentals.md` §1-3       | Implement all three + trace on `[3,1,4,1,5,9,2,6]`                   |
| 2   | Merge Sort — divide & conquer  | `03_Algorithms/02c_Divide_And_Conquer.md` §Merge Sort  | Implement merge sort + count inversions                              |
| 3   | Quick Sort — pivot + partition | `03_Algorithms/02a_Sorting_Fundamentals.md` §QuickSort | Implement 3-way partition QuickSort                                  |
| 4   | Radix/Counting/Bucket Sort     | `03_Algorithms/02b_Sorting_Advanced.md`                | When does O(n) sorting apply? Implement counting sort                |
| 5   | Lab                            | —                                                      | Sort a list of `Task(id, priority, deadline)` with custom comparator |
| 6–7 | Problem Set ALGO-PS4           | —                                                      | `03_Algorithms/03_PROBLEM_SETS.md` PS-4 (Sorting)                    |

**Week 9 — Binary Search & Greedy**

| Day | Topic                                        | Read                                                      | Do                                                         |
| --- | -------------------------------------------- | --------------------------------------------------------- | ---------------------------------------------------------- |
| 1   | Binary search — left/right boundary variants | `04_Patterns_Templates/06_Binary_Search_Patterns.md` §1-3 | Implement `lowerBound`, `upperBound`, `searchRotatedArray` |
| 2   | Binary search on answer (parametric search)  | `04_Patterns_Templates/06_Binary_Search_Patterns.md` §4   | Solve: Koko Eating Bananas, Ship Packages                  |
| 3   | Greedy — exchange argument proof             | `03_Algorithms/06a_Greedy_BitManip.md` §1-2               | Prove interval scheduling greedy is optimal                |
| 4   | Greedy — classic problems                    | `03_Algorithms/12_Greedy_Algorithms_Complete.md`          | Solve: Jump Game II, Task Scheduler                        |
| 5   | Lab                                          | —                                                         | Design a greedy meeting room scheduler                     |
| 6–7 | Problem Set ALGO-PS5                         | —                                                         | `03_Algorithms/03_PROBLEM_SETS.md` PS-5 (Search + Greedy)  |

---

### UNIT 5 — Recursion, Backtracking & Dynamic Programming (Weeks 10–12)

**Learning Outcomes:**

- Trace any recursive call stack; convert recursion to iteration
- Prune a backtracking search space correctly
- Recognize DP subproblems; convert top-down to bottom-up

**Week 10 — Recursion & Divide & Conquer**

| Day | Topic                                | Read                                                    | Do                                                     |
| --- | ------------------------------------ | ------------------------------------------------------- | ------------------------------------------------------ |
| 1   | Recursion mental model + call stack  | `03_Algorithms/03a_Recursion_Internals.md`              | Trace `fib(5)` call stack by hand                      |
| 2   | Recursion tree analysis              | `03_Algorithms/03b_Recursion_Fundamentals.md`           | Derive T(n) = 2T(n/2)+n → O(n log n)                   |
| 3   | Backtracking — permutations, subsets | `03_Algorithms/11_Backtracking_Complete.md` §1-3        | Implement permutations + subsets generators            |
| 4   | Backtracking — pruning strategies    | `04_Patterns_Templates/17_Backtracking_Plus_Pruning.md` | Solve: N-Queens, Sudoku Solver                         |
| 5   | Lab                                  | —                                                       | Word Search II using Trie + Backtracking               |
| 6–7 | Problem Set ALGO-PS6                 | —                                                       | `03_Algorithms/03_PROBLEM_SETS.md` PS-6 (Backtracking) |

**Weeks 11–12 — Dynamic Programming**

| Day  | Topic                                                      | Read                                          | Do                                                      |
| ---- | ---------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------- |
| 1    | DP mindset: overlapping subproblems + optimal substructure | `03_Algorithms/04a_DP_Internals.md`           | Memoize naive Fibonacci; trace cache hits               |
| 2    | 1D DP — climbing stairs, house robber                      | `03_Algorithms/04b_DP_Fundamentals.md` §1-2   | Implement both top-down and bottom-up                   |
| 3    | 2D DP — LCS, edit distance                                 | `03_Algorithms/04b_DP_Fundamentals.md` §3-4   | Fill DP table by hand for `ABCDE` vs `ACE`              |
| 4    | Knapsack family (0/1, unbounded, multi-dimensional)        | `04_Patterns_Templates/23_Knapsack_Family.md` | Implement all 3 variants                                |
| 5    | DP on intervals + trees                                    | `03_Algorithms/04c_DP_Advanced.md` §1-2       | Solve: Burst Balloons, Matrix Chain Multiplication      |
| 6    | DP on strings — palindrome DP                              | `03_Algorithms/04c_DP_Advanced.md` §3         | Solve: Longest Palindromic Subsequence                  |
| 7–8  | Lab                                                        | —                                             | Build a `StringSimilarityEngine` using Edit Distance DP |
| 9–14 | Problem Set ALGO-PS7                                       | —                                             | `03_Algorithms/03_PROBLEM_SETS.md` PS-7 (DP)            |

---

### UNIT 6 — Graph Algorithms (Weeks 13–14)

**Learning Outcomes:**

- Implement BFS and DFS correctly; know their failure modes
- Apply Dijkstra, Bellman-Ford, and Floyd-Warshall appropriately by constraint
- Model real-world problems as graphs (not just topology problems)

| Day  | Topic                                           | Read                                                   | Do                                                    |
| ---- | ----------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------- |
| 1    | Graph representations: adjacency list vs matrix | `03_Algorithms/05b_Graphs_Internals.md` §1-2           | Implement both representations                        |
| 2    | BFS: shortest path in unweighted graph          | `03_Algorithms/05c_Graphs_Fundamentals.md` §BFS        | Implement BFS + level-order distance map              |
| 3    | DFS: cycle detection, topological sort          | `03_Algorithms/05c_Graphs_Fundamentals.md` §DFS        | Implement Kahn's algo + DFS-based topo sort           |
| 4    | Dijkstra's algorithm                            | `03_Algorithms/05d_Graphs_Advanced_Algos.md` §Dijkstra | Implement Dijkstra with PriorityQueue; trace on grid  |
| 5    | Bellman-Ford (negative edges)                   | `03_Algorithms/05d_Graphs_Advanced_Algos.md` §BF       | When does Dijkstra fail? Implement BF                 |
| 6    | Union-Find / DSU for MST                        | `03_Algorithms/14_Union_Find_DSU_Complete.md`          | Implement Kruskal's with Union-Find                   |
| 7    | Lab                                             | —                                                      | **Mini-Project:** Social Network shortest-path finder |
| 8–14 | Problem Set ALGO-PS8                            | —                                                      | `03_Algorithms/03_PROBLEM_SETS.md` PS-8 (Graphs)      |

---

### UNIT 7 — Java Core & JVM Internals (Weeks 15–16)

**Learning Outcomes:**

- Explain the JVM memory model (heap, metaspace, stack frames)
- Use generics, functional interfaces, and streams correctly
- Reason about GC pressure and object lifecycle

| Day  | Topic                                           | Read                                                   | Do                                                       |
| ---- | ----------------------------------------------- | ------------------------------------------------------ | -------------------------------------------------------- |
| 1    | Java type system, primitives vs objects         | `07_Modern_Java/Ch01b_Java_Type_System.md`             | Trace autoboxing pitfalls                                |
| 2    | Generics — wildcards, bounds                    | `07_Modern_Java/Ch04_Generics_Exceptions.md` §Generics | Implement `Pair<A,B>` with bounds                        |
| 3    | Functional programming — lambdas, streams       | `07_Modern_Java/Ch06_Functional_Programming.md`        | Rewrite imperative to stream pipeline                    |
| 4    | JVM object model, GC basics                     | `07_Modern_Java/Ch19_JVM_Object_Model.md`              | Explain: what triggers a young gen GC?                   |
| 5    | Java Memory Model: volatile, happens-before     | `07_Modern_Java/Ch18_JMM_GC_Deep.md`                   | Trace visibility bug fixed by `volatile`                 |
| 6    | Modern Java (records, sealed, pattern matching) | `07_Modern_Java/Ch07_Modern_Java_9to21.md`             | Rewrite a class hierarchy using sealed classes           |
| 7    | Lab                                             | —                                                      | JVM profiling lab — find which method causes GC pressure |
| 8–14 | Problem Set JAVA-PS1                            | —                                                      | `07_Modern_Java/07_PROBLEM_SETS.md` PS-1 (Core Java)     |

---

## 🏆 Semester 1 Capstone — DSA Toolkit

**Estimated time:** 20 hours  
**Due:** End of Week 16  
→ **Full spec:** `00_CURRICULUM/PROJECTS/CAP01_DSA_Toolkit.md`

Build a fully-tested Java library with:

- Custom `DynamicArray<T>`, `LinkedList<T>`, `Stack<T>`, `Queue<T>`
- Custom `HashMap<K,V>` with chaining
- `MinHeap<T>`, `BST<T>`, `Graph<T>` with all standard algorithms
- Every class: documented Big-O per method in Javadoc
- Every class: full JUnit 5 test suite (>90% line coverage)

---

[← Back to Curriculum Overview](CURRICULUM_OVERVIEW.md) | [Semester 2 →](SEMESTER_2_GUIDE.md)
