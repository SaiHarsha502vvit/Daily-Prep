# 🌳 Part 1: Binary Tree Fundamentals

> **Navigation**: [← DEEP INTERNALS - HOW TREES & GRAPHS WORK AT…](01_deep_internals_how_trees_graphs_work.md) | [Chapter overview](../05_Trees.md) | [Tree Traversals →](03_tree_traversals.md)
> Page 2 of 6 in **TREES - Complete Guide**


## Complete Understanding

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    TREES - COMPLETE UNDERSTANDING                            ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHAT IS A TREE DATA STRUCTURE?                                               │
├──────────────────────────────────────────────────────────────────────────────┤
│ A tree is a hierarchical data structure consisting of NODES connected by     │
│ EDGES, with these properties:                                                │
│ • ONE root node (top)                                                        │
│ • Each node has ZERO or more children                                        │
│ • Each non-root node has EXACTLY one parent                                  │
│ • NO CYCLES (can't reach a node from itself by following edges)              │
│                                                                              │
│ FORMAL: A connected acyclic graph with n nodes and n-1 edges                 │
│                                                                              │
│ HISTORY: Trees were formalized by Arthur Cayley in 1857 for chemical         │
│ structures. Used in CS since early programming (file systems, parsing).      │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHAT PROBLEM DO TREES SOLVE?                                                 │
├──────────────────────────────────────────────────────────────────────────────┤
│ CORE PROBLEM: Representing HIERARCHICAL relationships efficiently            │
│                                                                              │
│ REAL-WORLD EXAMPLES:                                                         │
│ • File System: Folders contain files and subfolders (parent-child)           │
│ • Organization: CEO → Managers → Employees (reporting structure)             │
│ • DOM/HTML: <html> → <body> → <div> → <p> (nesting)                          │
│ • Family Tree: Ancestors and descendants                                     │
│ • Decision Making: Yes/No questions leading to conclusions                   │
│ • Syntax Parsing: Expression trees (how compilers work)                      │
│                                                                              │
│ WHY NOT USE ARRAY OR LIST?                                                   │
│ • Arrays: Good for linear data, but hierarchies need O(n) to find parent     │
│ • Trees: Natural for hierarchies, O(log n) operations for balanced trees     │
│                                                                              │
│ WHY NOT USE GRAPH?                                                           │
│ • Graphs allow cycles, multiple paths - more complex                         │
│ • Trees have unique paths - simpler algorithms, easier reasoning             │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHY USE TREES? (ADVANTAGES)                                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│ 1. HIERARCHICAL REPRESENTATION:                                              │
│    Perfectly models parent-child relationships                               │
│                                                                              │
│ 2. EFFICIENT OPERATIONS (when balanced):                                     │
│    Search, Insert, Delete: O(log n) instead of O(n)                          │
│                                                                              │
│ 3. SORTED DATA (BST):                                                        │
│    Inorder traversal gives sorted elements                                   │
│                                                                              │
│ 4. NATURAL RECURSION:                                                        │
│    Tree problems have elegant recursive solutions                            │
│                                                                              │
│ COMPARISON:                                                                  │
│ ┌───────────────┬─────────────┬─────────────┬─────────────┬─────────────┐    │
│ │ Operation     │ Array       │ LinkedList  │ BST (avg)   │ BST (worst) │    │
│ ├───────────────┼─────────────┼─────────────┼─────────────┼─────────────┤    │
│ │ Search        │ O(n)        │ O(n)        │ O(log n)    │ O(n)        │    │
│ │ Insert        │ O(n)        │ O(1)        │ O(log n)    │ O(n)        │    │
│ │ Delete        │ O(n)        │ O(1)        │ O(log n)    │ O(n)        │    │
│ │ Min/Max       │ O(n)        │ O(n)        │ O(log n)    │ O(n)        │    │
│ └───────────────┴─────────────┴─────────────┴─────────────┴─────────────┘    │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHEN TO USE TREES?                                                           │
├──────────────────────────────────────────────────────────────────────────────┤
│ ✅ USE TREES WHEN:                                                            │
│    • Data has natural hierarchy (files, org charts)                          │
│    • Need efficient search, insert, delete (use BST)                         │
│    • Need sorted iteration (BST inorder)                                     │
│    • Need to find min/max quickly (Heaps)                                    │
│    • Need range queries (Segment Trees)                                      │
│    • Prefix-based search (Tries)                                             │
│                                                                              │
│ ❌ DON'T USE TREES WHEN:                                                      │
│    • Data is flat/linear (use array)                                         │
│    • Relationships aren't hierarchical (use graph)                           │
│    • Simple key-value lookup (use HashMap - O(1))                            │
│    • Data changes rarely but searched often (use sorted array + binary)      │
│                                                                              │
│ TREE TYPE SELECTION:                                                         │
│ ┌────────────────────────────┬───────────────────────────────────────────┐   │
│ │ Problem Type               │ Best Tree Type                            │   │
│ ├────────────────────────────┼───────────────────────────────────────────┤   │
│ │ Maintain sorted data       │ BST, AVL, Red-Black                       │   │
│ │ Find min/max repeatedly    │ Heap                                      │   │
│ │ Range sum/min/max queries  │ Segment Tree                              │   │
│ │ Prefix search (strings)    │ Trie                                      │   │
│ │ Hierarchical data          │ N-ary Tree                                │   │
│ │ Parse expressions          │ Expression Tree                           │   │
│ └────────────────────────────┴───────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ DIFFICULTIES & COMMON PITFALLS                                               │
├──────────────────────────────────────────────────────────────────────────────┤
│ 1. NULL POINTER EXCEPTIONS:                                                  │
│    ALWAYS check if node is null before accessing .left or .right             │
│    Solution: Start every recursive function with: if (root == null) return   │
│                                                                              │
│ 2. UNBALANCED TREES:                                                         │
│    Inserting sorted data into BST → becomes a linked list → O(n)             │
│    Solution: Use self-balancing trees (AVL, Red-Black)                       │
│                                                                              │
│ 3. CONFUSING TRAVERSAL TYPES:                                                │
│    Which traversal to use for which problem?                                 │
│    Solution: See "When to use each traversal" section below                  │
│                                                                              │
│ 4. STACK OVERFLOW WITH DEEP RECURSION:                                       │
│    Very deep trees can exceed stack limit                                    │
│    Solution: Convert to iterative with explicit stack                        │
│                                                                              │
│ 5. MUTATING TREE DURING TRAVERSAL:                                           │
│    Changing tree structure while iterating causes bugs                       │
│    Solution: Collect nodes first, then modify                                │
│                                                                              │
│ 6. OFF-BY-ONE IN DEPTH/HEIGHT:                                               │
│    Is root at depth 0 or 1? Height of null is 0 or -1?                       │
│    Solution: Define clearly and be consistent                                │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ EXPECTED OUTPUTS & COMPLEXITY                                                │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ TRAVERSAL OUTPUTS:                                                           │
│ • Preorder:  [root, left subtree, right subtree]  - useful for copying tree  │
│ • Inorder:   [left subtree, root, right subtree]  - gives SORTED for BST     │
│ • Postorder: [left subtree, right subtree, root]  - useful for deleting      │
│ • Level:     [[level 0], [level 1], ...]          - useful for BFS problems  │
│                                                                              │
│ TIME COMPLEXITY:                                                             │
│ • All traversals: O(n) - must visit every node                               │
│ • BST search/insert/delete: O(h) where h = height                            │
│   - Balanced: h = log(n) → O(log n)                                          │
│   - Unbalanced: h = n → O(n)                                                 │
│                                                                              │
│ SPACE COMPLEXITY:                                                            │
│ • Recursive traversal: O(h) for call stack                                   │
│ • Iterative traversal: O(h) for explicit stack                               │
│ • Level order: O(w) where w = max width of tree                              │
│ • Storing tree: O(n) for n nodes                                             │
│                                                                              │
│ IMPORTANT FORMULAS:                                                          │
│ • Complete binary tree with n nodes: height = ⌊log₂(n)⌋                      │
│ • Full binary tree height h: max nodes = 2^(h+1) - 1                         │
│ • Binary tree height h: min nodes = h+1, max nodes = 2^(h+1) - 1             │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Tree Terminology

```
                    [1]         ← Root (level 0)
                   /   \
                [2]     [3]     ← Level 1
               /  \       \
             [4]  [5]     [6]   ← Level 2 (Leaves: 4, 5, 6)

TERMINOLOGY:
• Root: Top node (1)
• Parent: Node above (2 is parent of 4, 5)
• Child: Node below (4, 5 are children of 2)
• Siblings: Same parent (4, 5 are siblings)
• Leaf: No children (4, 5, 6)
• Height: Longest path from root to leaf (2)
• Depth: Distance from root (depth of 4 is 2)
• Subtree: Any node and its descendants
```

## Tree Node Structure

```java
class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;

    TreeNode(int val) {
        this.val = val;
    }
}

// Building a tree:
TreeNode root = new TreeNode(1);
root.left = new TreeNode(2);
root.right = new TreeNode(3);
root.left.left = new TreeNode(4);
root.left.right = new TreeNode(5);
```

---

[← DEEP INTERNALS - HOW TREES & GRAPHS WORK AT…](01_deep_internals_how_trees_graphs_work.md) | [Chapter overview](../05_Trees.md) | [Tree Traversals →](03_tree_traversals.md)
