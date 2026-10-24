# TREES - Complete Guide

## 🔗 Bridge — Where This Chapter Fits

| Dimension | This chapter |
| --- | --- |
| **Builds on** | [Recursion](03c_Recursion_Advanced.md), [Stack & Queue](../02_Data_Structures/01d_Stack_Queue.md), [Trees & Heaps (DS)](../02_Data_Structures/01f_Trees_Heaps.md) |
| **You will learn** | Tree traversals (DFS orders, BFS), BST operations, LCA, tree recursion patterns, memory and call-stack behaviour |
| **Leads to** | [Graphs](05b_Graphs_Internals.md) (a tree is a connected acyclic graph), [Advanced Trees](07c_Advanced_Trees_Deep.md) |
| **Abstraction level** | L3: from linear structures to hierarchy |

> [!NOTE]
> The full gap-free reading order and dependency graph are in the [Learning Path](00_LEARNING_PATH.md).

---

## 💬 Explain It Like a Study Partner — Trees

### 1. The bottom line

Most tree problems reduce to "solve the left, solve the right, combine at the node".

### 2. The textbook core

- **Traversals:** pre-, in-, post-order (DFS) and level-order (BFS); all O(n).
- BST in-order is sorted; search/insert O(h); balanced trees keep `h = O(log n)`.
- **Tree recursion template:** base case null → combine results of children.
- LCA via recursion in O(n) or binary lifting in O(log n) per query after O(n log n) preprocessing.

### 3. The real-world analogy

A **company org chart**: to find the total salary under a manager, add the totals of each direct report plus the manager.

### 4. Walkthrough

1. Height of a tree with root 1, children 2 and 3, and 2 has child 4.
2. `height(null) = 0`.
3. `height(4) = 1`, `height(3) = 1`, `height(2) = 1 + height(4) = 2`.
4. `height(1) = 1 + max(2, 1) = 3`.

> [!NOTE]
> **Quick check:** Which traversal returns a BST in sorted order? *In-order.*

---


### 5W1H: Mastering Trees

> [!NOTE]
> **WHAT:** Tree data structures, their memory representations (heap layouts), traversals (DFS, BFS), and common algorithmic patterns.
>
> **WHY:** Trees naturally model hierarchical data (DOM, file systems, orgs). Understanding cache misses in pointer-based trees vs arrays, and the call stack in recursion is vital for production-level optimization.
>
> **WHO:** Software engineers designing scalable hierarchical models or aiming to master complex recursive traversal problems in interviews.
>
> **WHEN:** Use trees when relationships are parent-child, not flat. Use specific traversals: Postorder for deletion/bottom-up, Inorder for BST sorted access, Preorder for copying.
>
> **HOW:** By mastering recursion stacks, iterative stack conversions, and recognizing when to pass data down (parameters) vs up (returns).

### Historical Evolution

Balanced binary search trees emerged from the need to guarantee $O(\log n)$ operations in the worst case. **AVL Trees** were invented by **Georgy Adelson-Velsky and Evgenii Landis in 1962** — the paper "An algorithm for the organization of information" introduced the balance factor (left subtree height minus right subtree height must be $\{-1, 0, 1\}$) and proved that AVL trees maintain $O(\log n)$ search, insertion, and deletion. AVL trees were the first balanced BST, but their strict rebalancing requirement (single or double rotation per insert) made them less common in practice until **Red-Black trees** (Guibas and Sedgewick, 1978) offered a more relaxed balance. **B-Trees** were invented by **Rudolf Bayer and Edward McCreight in 1972** at Boeing Scientific Research Labs specifically for disk-based storage systems — the key insight was that by allowing nodes to have many children (not just 2), B-Trees minimize disk I/O operations (a disk seek costs ~10ms vs ~10ns for RAM access), making them the backbone of virtually all modern database indexes (InnoDB, PostgreSQL) and file systems (NTFS, ext4). Modern practice (post-2010) combines these insights: Java's `HashMap` switches from linked-list to Red-Black tree buckets at 8 entries (Java 8) to prevent HashDoS attacks, and B+ tree variants remain the dominant index structure in relational databases such as PostgreSQL and MySQL/InnoDB, while distributed stores such as Cassandra use LSM trees.

---

## From Binary Trees to Advanced Tree Algorithms

🧠 **Mental Model**: See [Graph & Tree Thinking](../14_Mental_Models/03_Graph_Tree_Thinking.md) — tree traversal patterns and parent-child reasoning
**Split from Trees_Graphs.md for better navigation**
See also: [Graphs](05b_Graphs_Internals.md) | [Index](../00_MASTER_INDEX.md)

---

## 📚 Topic Pages in This Chapter

This chapter is split into focused pages so each topic can be read on its own. Read them in order the first time; use the table to jump back later.

| # | Page | What is inside | Lines |
| --- | --- | --- | --- |
| 1 | [DEEP INTERNALS - HOW TREES & GRAPHS WORK AT CPU/MEMORY LEVEL](05_Trees/01_deep_internals_how_trees_graphs_work.md) | DEEP INTERNALS - HOW TREES & GRAPHS WORK AT… | 281 |
| 2 | [Binary Tree Fundamentals](05_Trees/02_binary_tree_fundamentals.md) | Binary Tree Fundamentals | 203 |
| 3 | [Tree Traversals](05_Trees/03_tree_traversals.md) | Tree Traversals · Common Tree Problems · Binary Search Tree (bst) | 388 |
| 4 | [Advanced Tree Algorithms](05_Trees/04_advanced_tree_algorithms.md) | Advanced Tree Algorithms | 212 |
| 5 | [Complete Tree Problems with Solutions](05_Trees/05_complete_tree_problems_with_solutions.md) | Complete Tree Problems with Solutions | 159 |
| 6 | [Coderbyte & Interview Tree Challenges](05_Trees/06_coderbyte_interview_tree_challenges.md) | Coderbyte & Interview Tree Challenges | 528 |

## 🏢 Enterprise Lens — Trees

| Area | What top-tier engineering looks like |
| ---- | ------------------------------------ |
| **Where it runs in production** | File-system walkers, DOM/AST processing, database indexes, decision trees, UI component trees |
| **Failure modes** | Stack overflow on skewed trees; null handling; confusing height (edges vs nodes); unbalanced BST degrading to O(n) |
| **Testing and verification** | Test empty, single node, skewed left/right, complete trees; compare recursive with iterative traversal |

---

## Reality Check

**"Binary trees and binary search trees are the same"** → Binary tree: each node has at most two children. No ordering requirement. Binary Search Tree: a binary tree where for every node, all values in the LEFT subtree are less, and all values in the RIGHT subtree are greater. Every BST is a binary tree, but NOT every binary tree is a BST. Common mistake: treating a binary tree problem as requiring BST ordering when the tree is just a structural binary tree (expression trees, Huffman trees, complete binary heaps).

**"Tree height and tree depth are the same"** → Height of a node: number of edges on the longest downward path to a leaf. Height of the tree: height of the root. Depth of a node: number of edges from the root to that node. Height of a leaf = 0. Depth of the root = 0. A tree with 3 levels (root + 2 more): height = 2 (from root to deepest leaf), depth of deepest leaf = 2. These are inverses: height is measured bottom-up, depth is measured top-down. Confusing them causes off-by-one errors in recursion base cases.

**"Level-order traversal requires BFS — you can't use recursion"** → Level-order (BFS) is naturally iterative using a queue. Recursive level-order is possible but unusual: maintain a list-of-lists, pass depth as a parameter — `addToLevel(node, depth, result)` appends node.val to result[depth]. The recursive approach uses the call stack, not an explicit queue, but it performs DFS internally while building the result in BFS order. Standard practice: use iterative BFS with a queue for level-order — it's clearer and avoids the DFS call stack.

**"Inorder traversal of a BST gives sorted order — same for any binary tree"** → Inorder traversal (Left → Node → Right) gives sorted order ONLY for BSTs (where the BST property holds at every node). For a general binary tree, inorder traversal gives nodes in the order they appear in the inorder traversal — which has no meaningful sorting interpretation. Preorder (Node → Left → Right) is useful for: copying a tree, serializing (root comes first, easy to reconstruct). Postorder (Left → Right → Node) is useful for: deleting a tree (delete children before parent), computing expression tree values.

**"Morris traversal is an exotic technique"** → Morris traversal enables inorder traversal of a binary tree in O(n) time and O(1) SPACE (no stack, no recursion). It temporarily modifies the tree using threaded binary tree links: sets the inorder predecessor's right pointer to the current node, then restores it when visiting. After traversal, the tree is restored to its original structure. Used when: space is critically constrained (embedded systems, very deep trees where a recursion stack would overflow). Understanding it demonstrates deep understanding of tree structure and pointer manipulation.
