> **Navigation**: [⬅ Prefix, Prefix XOR & 2D Prefix](21_Prefix_PrefixXOR_2DPrefix_CheatSheet.md) | [📚 Index](../00_INDEX.md) | [Back to Start ➡](10_DSA_Problems_Arrays_Strings_Hashing.md)

# File 22 — DSA Patterns PDF to Workspace Map (Coverage + Revision Plan)

## Purpose

This file maps the "DSA Patterns.pdf" checklist to concrete files in this workspace.

Use it when you want:

- fast coverage audit
- targeted revision
- interview warm-up by pattern cluster

---

## 1) Coverage Snapshot

Status legend:

- Covered: dedicated chapter or repeated pattern coverage
- Strongly Covered: multiple chapters + problems + templates

| PDF Category                                                            | Status           | Primary Files                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ----------------------------------------------------------------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Arrays + Sliding Window + Kadane + Prefix                               | Strongly Covered | [04_Patterns_Templates/01_Sliding_Window.md](../../04_Patterns_Templates/01_Sliding_Window.md), [04_Patterns_Templates/09_Array_Plus_SlidingWindow.md](../../04_Patterns_Templates/09_Array_Plus_SlidingWindow.md), [20_Interview_Mastery/10_DSA_Problems_Arrays_Strings_Hashing.md](10_DSA_Problems_Arrays_Strings_Hashing.md), [20_Interview_Mastery/21_Prefix_PrefixXOR_2DPrefix_CheatSheet.md](21_Prefix_PrefixXOR_2DPrefix_CheatSheet.md)                                          |
| Two Pointers (opposite/same/dutch flag)                                 | Strongly Covered | [04_Patterns_Templates/07_Two_Pointers_Complete.md](../../04_Patterns_Templates/07_Two_Pointers_Complete.md), [04_Patterns_Templates/08_Array_Plus_TwoPointers.md](../../04_Patterns_Templates/08_Array_Plus_TwoPointers.md), [20_Interview_Mastery/14_DSA_Problems_BinarySearch_TwoPointers_SlidingWindow.md](14_DSA_Problems_BinarySearch_TwoPointers_SlidingWindow.md)                                                                                                               |
| Binary Search (index + answer space)                                    | Covered          | [04_Patterns_Templates/06_Binary_Search_Patterns.md](../../04_Patterns_Templates/06_Binary_Search_Patterns.md), [20_Interview_Mastery/14_DSA_Problems_BinarySearch_TwoPointers_SlidingWindow.md](14_DSA_Problems_BinarySearch_TwoPointers_SlidingWindow.md)                                                                                                                                                                                                                          |
| Strings (anagram, palindrome, min window, compression)                  | Strongly Covered | [04_Patterns_Templates/18_String_Plus_Advanced.md](../../04_Patterns_Templates/18_String_Plus_Advanced.md), [03_Algorithms/13_String_Algorithms_Complete.md](../../03_Algorithms/13_String_Algorithms_Complete.md), [20_Interview_Mastery/10_DSA_Problems_Arrays_Strings_Hashing.md](10_DSA_Problems_Arrays_Strings_Hashing.md)                                                                                                                                                         |
| Pattern Matching (KMP, Rabin-Karp, Z)                                   | Covered          | [03_Algorithms/06d_String_Algorithms.md](../../03_Algorithms/06d_String_Algorithms.md), [03_Algorithms/13_String_Algorithms_Complete.md](../../03_Algorithms/13_String_Algorithms_Complete.md)                                                                                                                                                                                                                                                                                          |
| HashMap Patterns                                                        | Covered          | [04_Patterns_Templates/10_HashMap_Plus_Counting.md](../../04_Patterns_Templates/10_HashMap_Plus_Counting.md), [05_Problem_Solving/17_HashMap_Hashing.md](../../05_Problem_Solving/17_HashMap_Hashing.md), [20_Interview_Mastery/10_DSA_Problems_Arrays_Strings_Hashing.md](10_DSA_Problems_Arrays_Strings_Hashing.md)                                                                                                                                                                   |
| Stack + Monotonic + Histogram                                           | Strongly Covered | [04_Patterns_Templates/11_Stack_Plus_MonotonicPattern.md](../../04_Patterns_Templates/11_Stack_Plus_MonotonicPattern.md), [03_Algorithms/15_Monotonic_Stack_Queue_Complete.md](../../03_Algorithms/15_Monotonic_Stack_Queue_Complete.md), [20_Interview_Mastery/11_DSA_Problems_LinkedList_Stack_Queue_Heap.md](11_DSA_Problems_LinkedList_Stack_Queue_Heap.md)                                                                                                                         |
| Queue/Deque/Circular Queue                                              | Covered          | [02_Data_Structures/02b_DS_Variants_Advanced.md](../../02_Data_Structures/02b_DS_Variants_Advanced.md), [05_Problem_Solving/08_Stack_Queue.md](../../05_Problem_Solving/08_Stack_Queue.md)                                                                                                                                                                                                                                                                                              |
| Linked List (reverse, k-group, merge, cycle)                            | Covered          | [02_Data_Structures/01c_LinkedList.md](../../02_Data_Structures/01c_LinkedList.md), [05_Problem_Solving/15_LinkedList.md](../../05_Problem_Solving/15_LinkedList.md), [20_Interview_Mastery/11_DSA_Problems_LinkedList_Stack_Queue_Heap.md](11_DSA_Problems_LinkedList_Stack_Queue_Heap.md)                                                                                                                                                                                             |
| Trees (DFS/BFS/path/BST)                                                | Covered          | [03_Algorithms/05_Trees.md](../../03_Algorithms/05_Trees.md), [04_Patterns_Templates/13_Tree_Plus_DFS_BFS.md](../../04_Patterns_Templates/13_Tree_Plus_DFS_BFS.md), [20_Interview_Mastery/12_DSA_Problems_Trees_Graphs_Trie_UnionFind.md](12_DSA_Problems_Trees_Graphs_Trie_UnionFind.md)                                                                                                                                                                                               |
| Recursion + Backtracking                                                | Strongly Covered | [03_Algorithms/03c_Recursion_Advanced.md](../../03_Algorithms/03c_Recursion_Advanced.md), [04_Patterns_Templates/17_Backtracking_Plus_Pruning.md](../../04_Patterns_Templates/17_Backtracking_Plus_Pruning.md), [20_Interview_Mastery/13_DSA_Problems_DP_Greedy_Backtracking.md](13_DSA_Problems_DP_Greedy_Backtracking.md), [20_Interview_Mastery/19_DSA_Permutations_Combinations_Interview_Math.md](19_DSA_Permutations_Combinations_Interview_Math.md)                              |
| Heap + TopK + K-way + Scheduler + Huffman                               | Covered          | [04_Patterns_Templates/15_Heap_Plus_GreedySelection.md](../../04_Patterns_Templates/15_Heap_Plus_GreedySelection.md), [03_Algorithms/12_Greedy_Algorithms_Complete.md](../../03_Algorithms/12_Greedy_Algorithms_Complete.md), [20_Interview_Mastery/11_DSA_Problems_LinkedList_Stack_Queue_Heap.md](11_DSA_Problems_LinkedList_Stack_Queue_Heap.md)                                                                                                                                     |
| Graphs (BFS/DFS/Cycle/Topo/SP/MST/DSU/0-1 BFS)                          | Strongly Covered | [03_Algorithms/05d_Graphs_Advanced_Algos.md](../../03_Algorithms/05d_Graphs_Advanced_Algos.md), [03_Algorithms/05e_Graphs_Patterns.md](../../03_Algorithms/05e_Graphs_Patterns.md), [04_Patterns_Templates/14_Graph_Plus_Traversal.md](../../04_Patterns_Templates/14_Graph_Plus_Traversal.md), [20_Interview_Mastery/12_DSA_Problems_Trees_Graphs_Trie_UnionFind.md](12_DSA_Problems_Trees_Graphs_Trie_UnionFind.md)                                                                      |
| Trie (prefix + word search)                                             | Covered          | [03_Algorithms/07a_Advanced_DS_Core.md](../../03_Algorithms/07a_Advanced_DS_Core.md), [20_Interview_Mastery/12_DSA_Problems_Trees_Graphs_Trie_UnionFind.md](12_DSA_Problems_Trees_Graphs_Trie_UnionFind.md)                                                                                                                                                                                                                                                                          |
| Bitwise Trie (maximum xor family)                                       | Covered          | [20_Interview_Mastery/20_Bitwise_Trie_Interview_Guide.md](20_Bitwise_Trie_Interview_Guide.md), [03_Algorithms/10_Bit_Manipulation_Complete.md](../../03_Algorithms/10_Bit_Manipulation_Complete.md)                                                                                                                                                                                                                                                                                  |
| DP Families (linear/grid/knapsack/sequence/interval/bitmask/digit/tree) | Strongly Covered | [03_Algorithms/04b_DP_Fundamentals.md](../../03_Algorithms/04b_DP_Fundamentals.md), [03_Algorithms/04c_DP_Advanced.md](../../03_Algorithms/04c_DP_Advanced.md), [04_Patterns_Templates/16_DP_Pattern_Recognition.md](../../04_Patterns_Templates/16_DP_Pattern_Recognition.md), [04_Patterns_Templates/23_Knapsack_Family.md](../../04_Patterns_Templates/23_Knapsack_Family.md), [20_Interview_Mastery/13_DSA_Problems_DP_Greedy_Backtracking.md](13_DSA_Problems_DP_Greedy_Backtracking.md) |
| Greedy Variants (interval/scheduling/resource)                          | Covered          | [03_Algorithms/12_Greedy_Algorithms_Complete.md](../../03_Algorithms/12_Greedy_Algorithms_Complete.md), [04_Patterns_Templates/21_Intervals_Pattern.md](../../04_Patterns_Templates/21_Intervals_Pattern.md), [20_Interview_Mastery/13_DSA_Problems_DP_Greedy_Backtracking.md](13_DSA_Problems_DP_Greedy_Backtracking.md)                                                                                                                                                               |
| Bit Manipulation + Prefix XOR                                           | Covered          | [03_Algorithms/10_Bit_Manipulation_Complete.md](../../03_Algorithms/10_Bit_Manipulation_Complete.md), [04_Patterns_Templates/20_BitManipulation_Plus_Tricks.md](../../04_Patterns_Templates/20_BitManipulation_Plus_Tricks.md), [20_Interview_Mastery/21_Prefix_PrefixXOR_2DPrefix_CheatSheet.md](21_Prefix_PrefixXOR_2DPrefix_CheatSheet.md)                                                                                                                                           |
| Sorting (all major variants)                                            | Covered          | [03_Algorithms/02a_Sorting_Fundamentals.md](../../03_Algorithms/02a_Sorting_Fundamentals.md), [03_Algorithms/02b_Sorting_Advanced.md](../../03_Algorithms/02b_Sorting_Advanced.md), [05_Problem_Solving/20_Sorting.md](../../05_Problem_Solving/20_Sorting.md)                                                                                                                                                                                                                             |
| Range Structures (Segment Tree/Fenwick/Lazy)                            | Covered          | [03_Algorithms/07a_Advanced_DS_Core.md](../../03_Algorithms/07a_Advanced_DS_Core.md), [03_Algorithms/07b_Advanced_DS_Patterns.md](../../03_Algorithms/07b_Advanced_DS_Patterns.md), [03_Algorithms/06c_Advanced_Algo_Deep.md](../../03_Algorithms/06c_Advanced_Algo_Deep.md)                                                                                                                                                                                                               |

---

## 2) Fast Revision Routes

## Route A: 90-minute final warm-up

1. [20_Interview_Mastery/02_Constraint_to_Algorithm_Map.md](../02_Constraint_to_Algorithm_Map.md)
2. [20_Interview_Mastery/03_DSA_Pattern_Recognition_Engine.md](../03_DSA_Pattern_Recognition_Engine.md)
3. [20_Interview_Mastery/20_Bitwise_Trie_Interview_Guide.md](20_Bitwise_Trie_Interview_Guide.md)
4. [20_Interview_Mastery/21_Prefix_PrefixXOR_2DPrefix_CheatSheet.md](21_Prefix_PrefixXOR_2DPrefix_CheatSheet.md)

## Route B: 3-day hardening

Day 1:

- [20_Interview_Mastery/10_DSA_Problems_Arrays_Strings_Hashing.md](10_DSA_Problems_Arrays_Strings_Hashing.md)
- [20_Interview_Mastery/11_DSA_Problems_LinkedList_Stack_Queue_Heap.md](11_DSA_Problems_LinkedList_Stack_Queue_Heap.md)

Day 2:

- [20_Interview_Mastery/12_DSA_Problems_Trees_Graphs_Trie_UnionFind.md](12_DSA_Problems_Trees_Graphs_Trie_UnionFind.md)
- [20_Interview_Mastery/13_DSA_Problems_DP_Greedy_Backtracking.md](13_DSA_Problems_DP_Greedy_Backtracking.md)

Day 3:

- [20_Interview_Mastery/14_DSA_Problems_BinarySearch_TwoPointers_SlidingWindow.md](14_DSA_Problems_BinarySearch_TwoPointers_SlidingWindow.md)
- [20_Interview_Mastery/19_DSA_Permutations_Combinations_Interview_Math.md](19_DSA_Permutations_Combinations_Interview_Math.md)
- [20_Interview_Mastery/20_Bitwise_Trie_Interview_Guide.md](20_Bitwise_Trie_Interview_Guide.md)

---

## 3) Interview Communication Checklist by Pattern

1. State pattern category first.
2. Give why-this-pattern in one sentence.
3. Give state/transition in plain logic.
4. Mention complexity and why lower is impossible if generating all outputs.
5. Mention one alternative and why chosen approach is better here.

---

## 4) Final Coverage Statement

Based on the DSA Patterns PDF checklist, workspace coverage is complete for all major DS/algorithm families and their listed variants, with dedicated reinforcement files now added for:

- Bitwise Trie
- Prefix Sum/XOR/2D Prefix unification

---

> **Navigation**: [⬅ Prefix, Prefix XOR & 2D Prefix](21_Prefix_PrefixXOR_2DPrefix_CheatSheet.md) | [📚 Index](../00_INDEX.md) | [Back to Start ➡](10_DSA_Problems_Arrays_Strings_Hashing.md)
