# 02 - Data Structures

> Foundation of everything — understand how data is stored, accessed, and manipulated.

## 5W1H — Why This Section Matters

> **WHAT:** The Data Structures section of this curriculum — every core data structure, every important variant, every production use.
>
> **WHY:** Data structures are the foundation of every algorithm, every system design, and every interview. Without deep DS knowledge, you cannot reason about performance, scalability, or correctness at the system level.
>
> **WHO:** Engineers preparing for Staff/Principal roles, system design interviews, and production architecture decisions.
>
> **WHEN:** Before studying algorithms, before interviewing, before designing systems. Also revisited throughout your career.
>
> **HOW:** Read top-down (Foundations → Internals → Variants → Production). For interview prep, jump to Problem Sets first. For production work, start with `05_DS_In_Production`.

## How to Read This Section

This section supports four distinct reading paths:

| Path                             | Goal                                  | Suggested Order                                                                      |
| -------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------ |
| **Path A — Interview Prep**      | Recall, pattern matching, speed       | `01a` → `01b–f` core structures → `02_PROBLEM_SETS` → Pattern reviews                |
| **Path B — Production Engineer** | Production correctness, failure modes | `01a` → `01g` DS Internals → `05_DS_In_Production` → `03_Collections_Java`           |
| **Path C — Theoretical Depth**   | Invariants, proofs, rigor             | All files in order; focus on invariants and proofs                                   |
| **Path D — Just-in-Time Lookup** | Fast reference                        | Use `02a_DS_Variants_Core.md` and `02b_DS_Variants_Advanced.md` as living references |

## Section Challenges

**Try this before you read:**

> What's the difference between an `ArrayList` and a `LinkedList` in terms of cache-friendliness? Why does this matter for production code?

## 🎓 University Methodology Layer *(MIT 6.006 / KTH DD1352 / RWTH Aachen / TU Munich foundation)*

> **Read these first if you want to know *why* data structures work, not just *what* to implement.** These four chapters build the proof-based, complexity-based, lower-bound-based, and randomized-construction toolbox that universities teach before the data structure catalog. They parallel the four university chapters in `03_Algorithms/`.

| #   | File                                                | What You'll Learn                       |
| --- | --------------------------------------------------- | --------------------------------------- |
| U1  | [DS Correctness — Proving Invariants Hold](A1_DS_Correctness_Invariants.md) | BST/heap/hash structural invariants, AVL rotations preserve correctness |
| U2  | [DS Complexity from First Principles](A2_DS_Complexity_FirstPrinciples.md) | Amortized analysis for mutable DS (aggregate / accounting / potential) |
| U3  | [DS Lower Bounds — Proving You Cannot Do Better](A3_DS_Lower_Bounds.md) | Cell-probe, comparison, information-theoretic bounds on DS operations |
| U4  | [Randomized Data Structures](A4_Randomized_Data_Structures.md) | Skip lists, treaps, Bloom filters, cuckoo hashing, HyperLogLog, consistent hashing |
| U5  | [**Designing Your Own Data Structures**](A5_Designing_Your_Own_Data_Structures.md) | The invention method: contract tables, augmentation, invariant-first design, the three-currency dial, deriving the Fenwick tree from scratch |

## Reading Order

| #   | File                                             | What You'll Learn                             |
| --- | ------------------------------------------------ | --------------------------------------------- |
| 1   | [Memory Foundations](01a_Memory_Foundations.md)  | Stack vs heap, memory layout, references      |
| 2   | [Arrays](01b_Arrays.md)                          | Static/dynamic arrays, operations, complexity |
| 3   | [LinkedList](01c_LinkedList.md)                  | Singly/doubly/circular, pointer manipulation  |
| 4   | [Stack & Queue](01d_Stack_Queue.md)              | LIFO/FIFO, implementations, use cases         |
| 5   | [HashTable](01e_HashTable.md)                    | Hashing, collisions, load factor              |
| 6   | [Trees & Heaps](01f_Trees_Heaps.md)              | BST, AVL, heaps, traversals                   |
| 7   | [DS Internals](01g_DS_Internals.md)              | How Java implements each DS under the hood    |
| 8   | [Variants Core](02a_DS_Variants_Core.md)         | Deque, priority queue, multimap               |
| 9   | [Variants Advanced](02b_DS_Variants_Advanced.md) | Skip list, bloom filter, trie internals       |
| 10  | [Collections Framework](03_Collections_Java.md)  | Java Collections API, iterators, Comparable   |
| 11  | [2D Arrays & Matrix](04_2D_Arrays_Matrix.md)     | Matrix operations, spiral, rotation           |

## Advanced Deep Add-ons

| File                                                                                          | What You'll Learn                                                         |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| [Advanced Trees Deep Dive](../03_Algorithms/07c_Advanced_Trees_Deep.md)                       | Red-Black invariants, B+ trees, LSM trees, interval/order-statistic trees |
| [Probabilistic DS Deep Dive](../03_Algorithms/07d_Probabilistic_DS_Deep.md)                   | Bloom, Cuckoo, HyperLogLog, sketches, CRDTs, sizing formulas              |
| [Advanced Algorithm Engineering](../03_Algorithms/07e_Advanced_Algorithm_Engineering_Deep.md) | HLD, Mo's, Wavelet Tree, persistent segment tree, flow, DP optimization   |

## Roadmap

```
🎓 University Methodology (U1–U4) ← read first for rigor
    ↓
Memory → Arrays → LinkedList → Stack/Queue → HashTable → Trees/Heaps
    ↓
DS Internals → Variants → Collections → 2D Arrays → Advanced Deep Add-ons
```

## Historical Note

This section evolved from a 2018 DSA cheat sheet to the current 14-file curriculum. Major additions tracked here:

- **2026 — 5W1H methodology**: Every section now opens with a `5W1H` framing block to anchor purpose before content.
- **2026 — Production-failure-mode sections**: Each data structure now has a production context block covering real-world failure modes, sizing guidelines, and trade-offs.
- **2026 — Historical evolution timelines**: Added provenance and "why this design" notes to help engineers understand not just _what_ but _why_.

---

[← Back to Master Index](../00_MASTER_INDEX.md)
