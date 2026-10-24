> **Navigation**: [← 19. Matrix / Grid — Complete…](19_Matrix.md) | [Chapter index](00_INDEX.md) | [SECTION 13: HACKEREARTH &… →](14_Mixed_Competitive.md)

**Problems 21** | [Prev](20_Sorting.md) | [Index](../00_MASTER_INDEX.md) | [Next](22_Recursion_Subsets.md)

---

# 📚 SECTION: DESIGN PROBLEMS

## 🔗 Bridge — Where This Chapter Fits

| Dimension | This chapter |
| --- | --- |
| **Builds on** | [Hash Tables](../02_Data_Structures/01e_HashTable.md), [Linked Lists](../02_Data_Structures/01c_LinkedList.md), [Heap](16_Heap.md) |
| **You will learn** | Data-structure design: LRU cache, min-stack, iterators, tweet feed, and trade-offs |
| **Leads to** | [Recursion](22_Recursion_Subsets.md) |
| **Abstraction level** | Using a structure → **composing structures to meet complexity targets** |

> [!NOTE]
> The full gap-free reading order and dependency graph are in the [Learning Path](00_LEARNING_PATH.md).

---

## 💬 Explain It Like a Study Partner — Design Problems

### 1. The bottom line

Design problems ask you to combine structures (hash map + list, stack + stack, heap + map) so every operation meets its target complexity.

### 2. The textbook core

- List the operations and their required complexity.
- Pick structures per operation.
- Keep invariants between structures.
- Think about thread safety separately.
- Test sequences of operations.

### 3. The real-world analogy

Combining **a phone book and a to-do list** so both lookups and ordering are fast.

### 4. Walkthrough

1. LRU cache with capacity 2.
2. Hash map: key → node; doubly linked list: recency order.
3. `get` moves the node to the front; `put` evicts the tail when full.
4. Both operations `O(1)`.

> [!NOTE]
> **Quick check:** What two structures give an `O(1)` LRU cache? *A hash map and a doubly linked list.*

---


```
┌─────────────────────────────────────────────────────────────────┐
│                DESIGN PROBLEMS FUNDAMENTALS                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  WHAT "DESIGN" MEANS IN INTERVIEWS:                             │
│  Not system design (that's a separate round).                   │
│  These are DATA STRUCTURE DESIGN problems:                      │
│  "Implement class X with operations A, B, C in O(?) time"       │
│                                                                 │
│  THE 5 CATEGORIES:                                              │
│  ┌──────────────┬─────────────────────────────────────────────┐ │
│  │ Cache Design  │ LRU, LFU, TTL Cache                       │  │
│  │ Stack/Queue   │ Min Stack, Max Queue, Stack using Queues   │ │
│  │ Iterator      │ Flatten 2D, Peeking Iterator, Zigzag       │ │
│  │ Trie/Search   │ Autocomplete, Word Dictionary, File System │ │
│  │ Composite     │ Twitter Feed, Browser History, Spreadsheet │ │
│  └──────────────┴─────────────────────────────────────────────┘ │
│                                                                 │
│  DECISION FRAMEWORK:                                            │
│  • Need O(1) get + O(1) put?     → HashMap + LinkedList         │
│  • Need O(1) min/max?            → Two stacks / Monotonic       │
│  • Need prefix search?           → Trie                         │
│  • Need ordered iteration?       → TreeMap / BST                │
│  • Need O(1) random access + insert? → HashMap + ArrayList      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```


### 5. Check yourself

**Q1.** LRU cache of capacity 2: `put(1,1), put(2,2), get(1), put(3,3), get(2)`. What does the last call return?

<details><summary>Answer</summary>

**−1**: `get(1)` made key 1 recent, so `put(3,3)` evicted key 2.

</details>

**Q2.** How does a min-stack return the minimum in `O(1)`?

<details><summary>Answer</summary>

Store the running minimum together with each pushed element (or keep a second stack of minima).

</details>

---

## 📚 Topic Pages in This Chapter

This chapter is split into focused pages so each topic can be read on its own. Read them in order the first time; use the table to jump back later.

| # | Page | What is inside | Lines |
| --- | --- | --- | --- |
| 1 | [WHY Design Problems — Thinking Like an Architect](21_Design/01_why_design_problems_thinking_like_an.md) | WHY Design Problems — Thinking Like an… · PROBLEM 1: LRU Cache (LC 146) — The #1 Design… · PROBLEM 2: Min Stack (LC 155) · PROBLEM 3: Implement Trie / Prefix Tree (LC… · PROBLEM 4: Design Add and Search Words (LC… · … | 752 |
| 2 | [PROBLEM 10: Serialize and Deserialize Binary Tree (LC 297)](21_Design/02_serialize_and_deserialize_binary_tree_lc.md) | PROBLEM 10: Serialize and Deserialize Binary… | 305 |

## 📋 CURATED PRACTICE PROBLEMS

### Easy

| #   | Problem                                                                                     | LC#  | Pattern          | Company        |
| --- | ------------------------------------------------------------------------------------------- | ---- | ---------------- | -------------- |
| 1   | [Design HashMap](https://leetcode.com/problems/design-hashmap/)                             | 706  | Array + Chaining | Amazon         |
| 2   | [Design HashSet](https://leetcode.com/problems/design-hashset/)                             | 705  | Array + Chaining | Amazon         |
| 3   | [Min Stack](https://leetcode.com/problems/min-stack/)                                       | 155  | Auxiliary Stack  | Amazon, Google |
| 4   | [Implement Queue using Stacks](https://leetcode.com/problems/implement-queue-using-stacks/) | 232  | Two Stacks       | Microsoft      |
| 5   | [Implement Stack using Queues](https://leetcode.com/problems/implement-stack-using-queues/) | 225  | Queue rotation   | Amazon         |
| 6   | [Design Parking System](https://leetcode.com/problems/design-parking-system/)               | 1603 | Counter          | Amazon         |

### Medium

| #   | Problem                                                                                                  | LC#  | Pattern                 | Company          |
| --- | -------------------------------------------------------------------------------------------------------- | ---- | ----------------------- | ---------------- |
| 1   | [LRU Cache](https://leetcode.com/problems/lru-cache/)                                                    | 146  | HashMap + DLL           | Amazon, Facebook |
| 2   | [Implement Trie](https://leetcode.com/problems/implement-trie-prefix-tree/)                              | 208  | Trie                    | Google, Amazon   |
| 3   | [Design Add and Search Words](https://leetcode.com/problems/design-add-and-search-words-data-structure/) | 211  | Trie + DFS              | Facebook         |
| 4   | [Insert Delete GetRandom O(1)](https://leetcode.com/problems/insert-delete-getrandom-o1/)                | 380  | HashMap + ArrayList     | Facebook         |
| 5   | [Design Browser History](https://leetcode.com/problems/design-browser-history/)                          | 1472 | DLL / ArrayList         | Amazon           |
| 6   | [Design Twitter](https://leetcode.com/problems/design-twitter/)                                          | 355  | Heap + HashMap          | Amazon, Twitter  |
| 7   | [Design Circular Queue](https://leetcode.com/problems/design-circular-queue/)                            | 622  | Array modular           | Amazon           |
| 8   | [Design Circular Deque](https://leetcode.com/problems/design-circular-deque/)                            | 641  | Array modular           | Google           |
| 9   | [Snapshot Array](https://leetcode.com/problems/snapshot-array/)                                          | 1146 | Binary Search           | Google           |
| 10  | [Time Based Key-Value Store](https://leetcode.com/problems/time-based-key-value-store/)                  | 981  | HashMap + Binary Search | Google           |
| 11  | [Design Underground System](https://leetcode.com/problems/design-underground-system/)                    | 1396 | HashMap                 | Amazon           |
| 12  | [Online Stock Span](https://leetcode.com/problems/online-stock-span/)                                    | 901  | Monotonic Stack         | Amazon           |

### Hard

| #   | Problem                                                                                                       | LC#  | Pattern            | Company          |
| --- | ------------------------------------------------------------------------------------------------------------- | ---- | ------------------ | ---------------- |
| 1   | [LFU Cache](https://leetcode.com/problems/lfu-cache/)                                                         | 460  | HashMap + Freq DLL | Amazon, Google   |
| 2   | [Serialize and Deserialize Binary Tree](https://leetcode.com/problems/serialize-and-deserialize-binary-tree/) | 297  | DFS/BFS encoding   | Amazon, Facebook |
| 3   | [Find Median from Data Stream](https://leetcode.com/problems/find-median-from-data-stream/)                   | 295  | Two Heaps          | Amazon, Google   |
| 4   | [Design Search Autocomplete](https://leetcode.com/problems/design-search-autocomplete-system/)                | 642  | Trie + Priority    | Google           |
| 5   | [All O(1) Data Structure](https://leetcode.com/problems/all-oone-data-structure/)                             | 432  | HashMap + DLL      | Amazon           |
| 6   | [Design Skiplist](https://leetcode.com/problems/design-skiplist/)                                             | 1206 | Probabilistic      | —                |


---

## 🏢 Enterprise Lens — Design Problems

| Area | What top-tier engineering looks like |
| ---- | ------------------------------------ |
| **Where it runs in production** | Caches, feeds, rate limiters |
| **Failure modes** | Desynchronised structures; forgetting eviction |
| **Testing and verification** | Randomised operation sequences against a simple reference |

---

## Reality Check

**"Design problems test data-structure recall"** — They test OPERATION-BUDGET ACCOUNTING: every design problem is a table of operations with required costs, and the solution is the minimal composite that pays each bill. LRU is get-O(1)/put-O(1)-with-eviction, answered by hashmap-into-DLL; insert-delete-getRandom adds uniform randomness, answered by array-plus-index-map; median-finder is add-O(log n)/query-O(1), answered by two heaps. Practice by writing the budget table FIRST — designs derived from budgets survive follow-ups; designs pattern-matched from memory collapse when one budget line changes.

**"LFU is LRU with a counter"** — LFU's difficulty is the two-level structure: frequency buckets each holding a recency-ordered DLL, plus a minFreq cursor — and the invariant maintenance (bump moves a node between buckets; minFreq resets to 1 on insert, increments only when its bucket empties) is where every rushed attempt breaks. The design lesson: when eviction policy depends on TWO orderings (frequency then recency), the structure is a map of ordered containers, not one container with a smarter comparator.

**"Iterator problems are API busywork"** — Iterator design drills LAZINESS and lookahead contracts: peeking-iterator caches one element and reconciles hasNext; BST-iterator amortizes inorder traversal with a stack (O(h) memory, not O(n) — the entire point); flatten-nested-lists must not pre-flatten (the input may be huge or infinite — lazy stacks of list-pointers). The shared principle — do work at next() time, hold only the frontier — is generator/stream thinking, and it is exactly how production cursors over paginated APIs behave.

**"Twitter-design and browser-history are toy system design"** — They are ALGORITHMIC design at system-design VOCABULARY: mini-Twitter is k-way merge over per-user timelines (the fan-in decision that real feed systems make at scale), browser-history is two stacks or a bounded list with a cursor (undo-model design). Practicing them builds the bridge conversation — "this in-memory structure corresponds to that distributed pattern" — which is the transition interviews at senior level actually probe.

**"Thread-safety is out of scope for design problems"** — Single-threaded is the default CONTRACT, and stating it is part of the answer: "this LRU is not thread-safe; under concurrency I would segment locks like ConcurrentHashMap or use a lock around the DLL." One sentence, no implementation — but it distinguishes candidates who know their structure has a concurrency boundary from those who never considered it. The follow-up "make it thread-safe" then has a prepared shape instead of a panic.
