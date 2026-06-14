# CSE201 — Data Structures

**Semester:** S02 | **Hours:** ~30h | **Prerequisite:** S01 (CSE102 Programming Fundamentals)

## Description

Data Structures is a deep dive into the canonical data structures used in software engineering: arrays, dynamic arrays, linked lists (singly, doubly, circular), stacks, queues, deques, hash tables, binary search trees, AVL trees, red-black trees, B-trees, heaps (min/max, priority queues), tries, and graphs. Each structure is implemented from scratch, analyzed for time/space complexity, and evaluated for appropriate use cases.

## Learning Outcomes

- Implement ArrayList, LinkedList, HashMap, TreeMap, and HashSet from scratch in Java
- Explain and apply Big-O analysis to all CRUD operations across data structures
- Choose the right data structure for a given problem with justification
- Detect cycles in linked lists, invert binary trees, and merge sorted sequences
- Build and traverse graph representations (adjacency list, adjacency matrix)

## Syllabus Outline

- Arrays, dynamic arrays (ArrayList), 2D arrays, matrix traversal
- Linked lists: singly, doubly, circular; cycle detection (Floyd's algorithm)
- Stacks and queues; monotonic stack applications
- Hash tables: hash functions, chaining, open addressing, HashMap internals
- Trees: BST, AVL, red-black tree, B-tree properties and rotations
- Heaps: binary heap, priority queue, heap sort, top-K problems
- Tries: prefix search, autocomplete applications
- Graphs: BFS, DFS, adjacency list/matrix, shortest paths (Dijkstra, Bellman-Ford)

## Linked Content

- [02_Data_Structures — full content folder](../../02_Data_Structures/)
- [Memory Foundations — prerequisite reading](../../02_Data_Structures/01a_Memory_Foundations.md)

### University Methodology Layer (read these first for the formal foundation)

| File | Maps to syllabus topic |
|------|------------------------|
| [A1 DS — DS Correctness & Invariants](../../02_Data_Structures/A1_DS_Correctness_Invariants.md) | BST/heap/hash structural invariants, AVL rotation correctness |
| [A2 DS — DS Complexity](../../02_Data_Structures/A2_DS_Complexity_FirstPrinciples.md) | Amortized analysis for mutable structures (dynamic arrays, Union-Find) |
| [A3 DS — Lower Bounds for DS](../../02_Data_Structures/A3_DS_Lower_Bounds.md) | Cell-probe lower bounds, comparison tree bounds, information-theoretic limits |
| [A4 DS — Randomized Data Structures](../../02_Data_Structures/A4_Randomized_Data_Structures.md) | Skip lists, treaps, Bloom filters, cuckoo hashing, HyperLogLog |
