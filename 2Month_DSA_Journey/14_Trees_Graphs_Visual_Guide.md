# 🌳 Tree & Graph Algorithms: Visual Guide

## From Traversals to Complex Algorithms

---

# PART 1: BINARY TREE FUNDAMENTALS

## Complete Understanding

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    TREES - COMPLETE UNDERSTANDING                             ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHAT IS A TREE DATA STRUCTURE?                                               │
├──────────────────────────────────────────────────────────────────────────────┤
│ A tree is a hierarchical data structure consisting of NODES connected by    │
│ EDGES, with these properties:                                                │
│ • ONE root node (top)                                                        │
│ • Each node has ZERO or more children                                        │
│ • Each non-root node has EXACTLY one parent                                  │
│ • NO CYCLES (can't reach a node from itself by following edges)             │
│                                                                              │
│ FORMAL: A connected acyclic graph with n nodes and n-1 edges                │
│                                                                              │
│ HISTORY: Trees were formalized by Arthur Cayley in 1857 for chemical        │
│ structures. Used in CS since early programming (file systems, parsing).     │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHAT PROBLEM DO TREES SOLVE?                                                 │
├──────────────────────────────────────────────────────────────────────────────┤
│ CORE PROBLEM: Representing HIERARCHICAL relationships efficiently            │
│                                                                              │
│ REAL-WORLD EXAMPLES:                                                         │
│ • File System: Folders contain files and subfolders (parent-child)          │
│ • Organization: CEO → Managers → Employees (reporting structure)            │
│ • DOM/HTML: <html> → <body> → <div> → <p> (nesting)                        │
│ • Family Tree: Ancestors and descendants                                     │
│ • Decision Making: Yes/No questions leading to conclusions                   │
│ • Syntax Parsing: Expression trees (how compilers work)                      │
│                                                                              │
│ WHY NOT USE ARRAY OR LIST?                                                   │
│ • Arrays: Good for linear data, but hierarchies need O(n) to find parent   │
│ • Trees: Natural for hierarchies, O(log n) operations for balanced trees   │
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
│ ┌───────────────┬─────────────┬─────────────┬─────────────┬─────────────┐   │
│ │ Operation     │ Array       │ LinkedList  │ BST (avg)   │ BST (worst) │   │
│ ├───────────────┼─────────────┼─────────────┼─────────────┼─────────────┤   │
│ │ Search        │ O(n)        │ O(n)        │ O(log n)    │ O(n)        │   │
│ │ Insert        │ O(n)        │ O(1)        │ O(log n)    │ O(n)        │   │
│ │ Delete        │ O(n)        │ O(1)        │ O(log n)    │ O(n)        │   │
│ │ Min/Max       │ O(n)        │ O(n)        │ O(log n)    │ O(n)        │   │
│ └───────────────┴─────────────┴─────────────┴─────────────┴─────────────┘   │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHEN TO USE TREES?                                                           │
├──────────────────────────────────────────────────────────────────────────────┤
│ ✅ USE TREES WHEN:                                                          │
│    • Data has natural hierarchy (files, org charts)                          │
│    • Need efficient search, insert, delete (use BST)                         │
│    • Need sorted iteration (BST inorder)                                     │
│    • Need to find min/max quickly (Heaps)                                    │
│    • Need range queries (Segment Trees)                                      │
│    • Prefix-based search (Tries)                                             │
│                                                                              │
│ ❌ DON'T USE TREES WHEN:                                                    │
│    • Data is flat/linear (use array)                                         │
│    • Relationships aren't hierarchical (use graph)                          │
│    • Simple key-value lookup (use HashMap - O(1))                           │
│    • Data changes rarely but searched often (use sorted array + binary)     │
│                                                                              │
│ TREE TYPE SELECTION:                                                         │
│ ┌────────────────────────────┬───────────────────────────────────────────┐  │
│ │ Problem Type               │ Best Tree Type                            │  │
│ ├────────────────────────────┼───────────────────────────────────────────┤  │
│ │ Maintain sorted data       │ BST, AVL, Red-Black                       │  │
│ │ Find min/max repeatedly    │ Heap                                      │  │
│ │ Range sum/min/max queries  │ Segment Tree                              │  │
│ │ Prefix search (strings)    │ Trie                                      │  │
│ │ Hierarchical data          │ N-ary Tree                                │  │
│ │ Parse expressions          │ Expression Tree                           │  │
│ └────────────────────────────┴───────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ DIFFICULTIES & COMMON PITFALLS                                               │
├──────────────────────────────────────────────────────────────────────────────┤
│ 1. NULL POINTER EXCEPTIONS:                                                  │
│    ALWAYS check if node is null before accessing .left or .right            │
│    Solution: Start every recursive function with: if (root == null) return  │
│                                                                              │
│ 2. UNBALANCED TREES:                                                         │
│    Inserting sorted data into BST → becomes a linked list → O(n)            │
│    Solution: Use self-balancing trees (AVL, Red-Black)                      │
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
│ • Preorder:  [root, left subtree, right subtree]  - useful for copying tree │
│ • Inorder:   [left subtree, root, right subtree]  - gives SORTED for BST    │
│ • Postorder: [left subtree, right subtree, root]  - useful for deleting     │
│ • Level:     [[level 0], [level 1], ...]          - useful for BFS problems │
│                                                                              │
│ TIME COMPLEXITY:                                                             │
│ • All traversals: O(n) - must visit every node                               │
│ • BST search/insert/delete: O(h) where h = height                           │
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
│ • Complete binary tree with n nodes: height = ⌊log₂(n)⌋                     │
│ • Full binary tree height h: max nodes = 2^(h+1) - 1                        │
│ • Binary tree height h: min nodes = h+1, max nodes = 2^(h+1) - 1            │
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

# PART 2: TREE TRAVERSALS

## The Three DFS Traversals

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                  TREE TRAVERSALS - WHEN & WHY TO USE EACH                    ║
╚══════════════════════════════════════════════════════════════════════════════╝

REMEMBER BY: When do you PROCESS the current node?

PREORDER:  Process → Left → Right   (Process BEFORE children)
INORDER:   Left → Process → Right   (Process BETWEEN children)
POSTORDER: Left → Right → Process   (Process AFTER children)

EXAMPLE TREE:
        [1]
       /   \
     [2]   [3]
    /  \
  [4]  [5]

PREORDER:  1 → 2 → 4 → 5 → 3  (Root first, then subtrees)
INORDER:   4 → 2 → 5 → 1 → 3  (Left, root, right - SORTED for BST!)
POSTORDER: 4 → 5 → 2 → 3 → 1  (Children first, then root)

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHEN TO USE EACH TRAVERSAL?                                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ PREORDER (Root → Left → Right):                                              │
│ ┌────────────────────────────────────────────────────────────────┐          │
│ │ USE FOR: Copying/cloning a tree                                │          │
│ │          Serializing tree to file/string                       │          │
│ │          Creating prefix expressions                            │          │
│ │          Getting directory structure (ls -R)                    │          │
│ │                                                                  │          │
│ │ WHY: You need to create parent BEFORE children                 │          │
│ │      (Can't have children without parent first!)               │          │
│ └────────────────────────────────────────────────────────────────┘          │
│                                                                              │
│ INORDER (Left → Root → Right):                                               │
│ ┌────────────────────────────────────────────────────────────────┐          │
│ │ USE FOR: Getting sorted elements from BST                      │          │
│ │          Validating if tree is BST                             │          │
│ │          Finding kth smallest/largest element                  │          │
│ │          Creating infix expressions                             │          │
│ │                                                                  │          │
│ │ WHY: For BST, left < root < right, so this gives sorted order  │          │
│ │      It's the "natural" reading order (left to right)          │          │
│ └────────────────────────────────────────────────────────────────┘          │
│                                                                              │
│ POSTORDER (Left → Right → Root):                                             │
│ ┌────────────────────────────────────────────────────────────────┐          │
│ │ USE FOR: Deleting a tree (must delete children before parent)  │          │
│ │          Calculating folder sizes (need children sizes first)  │          │
│ │          Evaluating expression trees                            │          │
│ │          Finding height of tree                                 │          │
│ │          Garbage collection algorithms                          │          │
│ │                                                                  │          │
│ │ WHY: You need children's result before you can compute parent's│          │
│ │      (Can't calculate total until you have subtotals!)         │          │
│ └────────────────────────────────────────────────────────────────┘          │
│                                                                              │
│ LEVEL ORDER (BFS):                                                           │
│ ┌────────────────────────────────────────────────────────────────┐          │
│ │ USE FOR: Finding shortest path in unweighted tree              │          │
│ │          Printing tree level by level                          │          │
│ │          Finding nodes at specific depth                        │          │
│ │          Connecting nodes at same level                         │          │
│ │          Zigzag traversal                                       │          │
│ │                                                                  │          │
│ │ WHY: Processes nodes by distance from root - perfect for       │          │
│ │      "nearest" or "level" based questions                       │          │
│ └────────────────────────────────────────────────────────────────┘          │
└──────────────────────────────────────────────────────────────────────────────┘

QUICK DECISION TABLE:
┌─────────────────────────────────────┬───────────────────┐
│ Problem Type                        │ Use Traversal     │
├─────────────────────────────────────┼───────────────────┤
│ Get sorted elements (BST)           │ INORDER           │
│ Copy/clone tree                     │ PREORDER          │
│ Delete tree safely                  │ POSTORDER         │
│ Calculate subtree values            │ POSTORDER         │
│ Find by level/depth                 │ LEVEL ORDER (BFS) │
│ Serialize tree                      │ PREORDER + marker │
│ Check if valid BST                  │ INORDER           │
│ Expression evaluation               │ POSTORDER         │
└─────────────────────────────────────┴───────────────────┘
```

## Traversal Code

```java
// PREORDER - Recursive
public void preorder(TreeNode root) {
    if (root == null) return;

    System.out.print(root.val + " ");  // Process
    preorder(root.left);                // Left
    preorder(root.right);               // Right
}

// INORDER - Recursive
public void inorder(TreeNode root) {
    if (root == null) return;

    inorder(root.left);                 // Left
    System.out.print(root.val + " ");  // Process
    inorder(root.right);                // Right
}

// POSTORDER - Recursive
public void postorder(TreeNode root) {
    if (root == null) return;

    postorder(root.left);               // Left
    postorder(root.right);              // Right
    System.out.print(root.val + " ");  // Process
}

// PREORDER - Iterative (using stack)
public List<Integer> preorderIterative(TreeNode root) {
    List<Integer> result = new ArrayList<>();
    if (root == null) return result;

    Stack<TreeNode> stack = new Stack<>();
    stack.push(root);

    while (!stack.isEmpty()) {
        TreeNode node = stack.pop();
        result.add(node.val);

        // Right first so left is processed first (LIFO)
        if (node.right != null) stack.push(node.right);
        if (node.left != null) stack.push(node.left);
    }

    return result;
}
```

## Level Order Traversal (BFS)

```
VISIT LEVEL BY LEVEL:

        [1]         Level 0: [1]
       /   \
     [2]   [3]      Level 1: [2, 3]
    /  \     \
  [4]  [5]   [6]    Level 2: [4, 5, 6]

OUTPUT: [[1], [2, 3], [4, 5, 6]]
```

```java
public List<List<Integer>> levelOrder(TreeNode root) {
    List<List<Integer>> result = new ArrayList<>();
    if (root == null) return result;

    Queue<TreeNode> queue = new LinkedList<>();
    queue.offer(root);

    while (!queue.isEmpty()) {
        int levelSize = queue.size();  // Nodes at current level
        List<Integer> currentLevel = new ArrayList<>();

        for (int i = 0; i < levelSize; i++) {
            TreeNode node = queue.poll();
            currentLevel.add(node.val);

            if (node.left != null) queue.offer(node.left);
            if (node.right != null) queue.offer(node.right);
        }

        result.add(currentLevel);
    }

    return result;
}
```

---

# PART 3: COMMON TREE PROBLEMS

## Maximum Depth

```java
public int maxDepth(TreeNode root) {
    if (root == null) return 0;

    int leftDepth = maxDepth(root.left);
    int rightDepth = maxDepth(root.right);

    return 1 + Math.max(leftDepth, rightDepth);
}

// TRACE for tree:
//     [1]
//    /   \
//  [2]   [3]
//  /
// [4]
//
// maxDepth(4) = 1 + max(0, 0) = 1
// maxDepth(2) = 1 + max(1, 0) = 2
// maxDepth(3) = 1 + max(0, 0) = 1
// maxDepth(1) = 1 + max(2, 1) = 3
```

## Check if Balanced

```java
// A tree is balanced if height difference of subtrees <= 1

public boolean isBalanced(TreeNode root) {
    return checkHeight(root) != -1;
}

private int checkHeight(TreeNode node) {
    if (node == null) return 0;

    int leftHeight = checkHeight(node.left);
    if (leftHeight == -1) return -1;  // Left subtree unbalanced

    int rightHeight = checkHeight(node.right);
    if (rightHeight == -1) return -1;  // Right subtree unbalanced

    // Check current node balance
    if (Math.abs(leftHeight - rightHeight) > 1) {
        return -1;  // Unbalanced
    }

    return 1 + Math.max(leftHeight, rightHeight);
}
```

## Lowest Common Ancestor (LCA)

```java
// Find the lowest node that has both p and q as descendants

public TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {
    if (root == null || root == p || root == q) {
        return root;
    }

    TreeNode left = lowestCommonAncestor(root.left, p, q);
    TreeNode right = lowestCommonAncestor(root.right, p, q);

    // If both sides found something, root is LCA
    if (left != null && right != null) {
        return root;
    }

    // Otherwise, return the non-null side
    return left != null ? left : right;
}

// INTUITION:
// If p and q are in different subtrees, root is LCA
// If both in same subtree, LCA is in that subtree
```

---

# PART 4: BINARY SEARCH TREE (BST)

## BST Property

```
For every node:
- All values in LEFT subtree < node value
- All values in RIGHT subtree > node value

        [8]
       /   \
     [3]   [10]
    /  \      \
  [1]  [6]   [14]
      /  \
    [4]  [7]

INORDER traversal gives SORTED order: 1, 3, 4, 6, 7, 8, 10, 14
```

## BST Operations

```java
// SEARCH - O(log n) average, O(n) worst (skewed)
public TreeNode search(TreeNode root, int val) {
    if (root == null || root.val == val) {
        return root;
    }

    if (val < root.val) {
        return search(root.left, val);
    } else {
        return search(root.right, val);
    }
}

// INSERT - O(log n) average
public TreeNode insert(TreeNode root, int val) {
    if (root == null) {
        return new TreeNode(val);
    }

    if (val < root.val) {
        root.left = insert(root.left, val);
    } else {
        root.right = insert(root.right, val);
    }

    return root;
}

// VALIDATE BST
public boolean isValidBST(TreeNode root) {
    return validate(root, Long.MIN_VALUE, Long.MAX_VALUE);
}

private boolean validate(TreeNode node, long min, long max) {
    if (node == null) return true;

    if (node.val <= min || node.val >= max) {
        return false;
    }

    return validate(node.left, min, node.val) &&
           validate(node.right, node.val, max);
}
```

---

# PART 5: GRAPH FUNDAMENTALS

## Complete Understanding of Graphs

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    GRAPHS - COMPLETE UNDERSTANDING                            ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHAT IS A GRAPH?                                                             │
├──────────────────────────────────────────────────────────────────────────────┤
│ A graph G = (V, E) consists of:                                              │
│ • V = Set of VERTICES (nodes)                                                │
│ • E = Set of EDGES (connections between vertices)                            │
│                                                                              │
│ Unlike trees, graphs can have:                                               │
│ • CYCLES (paths that return to starting point)                               │
│ • Multiple paths between any two nodes                                       │
│ • Disconnected components                                                    │
│                                                                              │
│ HISTORY: Graph theory started with Euler's "Seven Bridges of Königsberg"    │
│ problem in 1736 - can you cross all bridges exactly once?                   │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHAT PROBLEMS DO GRAPHS SOLVE?                                               │
├──────────────────────────────────────────────────────────────────────────────┤
│ CORE PROBLEM: Modeling RELATIONSHIPS between entities                        │
│                                                                              │
│ REAL-WORLD EXAMPLES:                                                         │
│ • Social Networks: People = nodes, Friendships = edges                       │
│   "Find friends of friends" = BFS from a person                              │
│                                                                              │
│ • Navigation/Maps: Intersections = nodes, Roads = edges                      │
│   "Shortest route" = Dijkstra's algorithm                                    │
│                                                                              │
│ • Internet: Routers = nodes, Connections = edges                             │
│   "Best path for data" = Routing algorithms                                  │
│                                                                              │
│ • Dependencies: Tasks = nodes, Prerequisites = edges                         │
│   "Order to complete tasks" = Topological sort                               │
│                                                                              │
│ • Games: Game states = nodes, Moves = edges                                  │
│   "Can we win?" = Graph search                                               │
│                                                                              │
│ • Molecular structures: Atoms = nodes, Bonds = edges                         │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHY GRAPHS INSTEAD OF OTHER DATA STRUCTURES?                                 │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ ┌────────────────────────┬───────────────────────────────────────────────┐  │
│ │ Structure              │ Relationship Type                             │  │
│ ├────────────────────────┼───────────────────────────────────────────────┤  │
│ │ Array                  │ Sequential, by position                       │  │
│ │ Tree                   │ Hierarchical, parent-child                    │  │
│ │ Graph                  │ ANY relationship! ⭐ Most flexible           │  │
│ └────────────────────────┴───────────────────────────────────────────────┘  │
│                                                                              │
│ Trees are actually SPECIAL CASES of graphs (connected, acyclic)!            │
│                                                                              │
│ USE GRAPH WHEN:                                                              │
│ • Relationships aren't hierarchical (peer-to-peer, many-to-many)            │
│ • Cycles are possible (road networks, social connections)                    │
│ • Need to model complex dependencies                                         │
│ • Multiple paths between entities exist                                      │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHEN TO USE WHICH REPRESENTATION?                                            │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ ADJACENCY LIST:                                                              │
│ ┌───────────────────────────────────────────────────────────────┐           │
│ │ USE WHEN: Sparse graph (E << V²)                              │           │
│ │ Space: O(V + E)                                               │           │
│ │ Check edge exists: O(degree)                                  │           │
│ │ Iterate neighbors: O(degree) ✅ FAST                          │           │
│ │ BEST FOR: Most real-world graphs (social networks, roads)     │           │
│ └───────────────────────────────────────────────────────────────┘           │
│                                                                              │
│ ADJACENCY MATRIX:                                                            │
│ ┌───────────────────────────────────────────────────────────────┐           │
│ │ USE WHEN: Dense graph (E ≈ V²) or need O(1) edge lookup       │           │
│ │ Space: O(V²)                                                  │           │
│ │ Check edge exists: O(1) ✅ FAST                               │           │
│ │ Iterate neighbors: O(V)                                       │           │
│ │ BEST FOR: Small dense graphs, weighted graphs, Floyd-Warshall │           │
│ └───────────────────────────────────────────────────────────────┘           │
│                                                                              │
│ RULE OF THUMB: Use adjacency LIST unless you have specific reason not to!   │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ DIFFICULTIES & COMMON MISTAKES                                               │
├──────────────────────────────────────────────────────────────────────────────┤
│ 1. INFINITE LOOPS (Forgetting visited check):                                │
│    Graphs have cycles! ALWAYS track visited nodes.                           │
│    Solution: boolean[] visited or Set<Integer> visited                       │
│                                                                              │
│ 2. DIRECTED VS UNDIRECTED CONFUSION:                                         │
│    Undirected: Add edge both ways (A→B AND B→A)                             │
│    Directed: Add edge one way only                                           │
│                                                                              │
│ 3. 0-INDEXED VS 1-INDEXED:                                                   │
│    Problem gives "1 to N" nodes but array is 0-indexed                       │
│    Solution: Either use size N+1 or subtract 1 from all indices              │
│                                                                              │
│ 4. DISCONNECTED COMPONENTS:                                                  │
│    Single DFS/BFS won't visit all nodes if graph disconnected!              │
│    Solution: Loop through all nodes, start new traversal if unvisited        │
│                                                                              │
│ 5. NOT HANDLING WEIGHTS:                                                     │
│    BFS gives shortest path in UNWEIGHTED graphs only                         │
│    For weighted: Use Dijkstra (non-negative) or Bellman-Ford                 │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ EXPECTED OUTPUTS & COMPLEXITY                                                │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ TRAVERSAL COMPLEXITY (V = vertices, E = edges):                              │
│ • DFS: O(V + E) time, O(V) space (visited + stack)                           │
│ • BFS: O(V + E) time, O(V) space (visited + queue)                           │
│                                                                              │
│ COMMON ALGORITHM COMPLEXITIES:                                               │
│ ┌────────────────────────────┬──────────────────────┬────────────────────┐  │
│ │ Algorithm                  │ Time                 │ Space              │  │
│ ├────────────────────────────┼──────────────────────┼────────────────────┤  │
│ │ DFS/BFS                    │ O(V + E)             │ O(V)               │  │
│ │ Dijkstra (binary heap)     │ O((V+E) log V)       │ O(V)               │  │
│ │ Bellman-Ford               │ O(V × E)             │ O(V)               │  │
│ │ Floyd-Warshall             │ O(V³)                │ O(V²)              │  │
│ │ Topological Sort           │ O(V + E)             │ O(V)               │  │
│ │ Kruskal's MST              │ O(E log E)           │ O(V)               │  │
│ │ Prim's MST                 │ O((V+E) log V)       │ O(V)               │  │
│ │ Cycle Detection            │ O(V + E)             │ O(V)               │  │
│ └────────────────────────────┴──────────────────────┴────────────────────┘  │
│                                                                              │
│ TYPICAL OUTPUTS:                                                             │
│ • Path finding: List of nodes from source to destination                     │
│ • Shortest path: Distance value or path + distance                           │
│ • Cycle detection: Boolean (exists?) or List (the cycle)                    │
│ • Topological sort: Ordered list of all vertices                             │
│ • Connected components: Number of components or list of component nodes     │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Graph Representations

```
ADJACENCY LIST (Preferred for sparse graphs):

Graph:
    0 --- 1
    |     |
    3 --- 2

List representation:
0: [1, 3]
1: [0, 2]
2: [1, 3]
3: [0, 2]

Code:
List<List<Integer>> graph = new ArrayList<>();
// Add neighbors for each node
graph.get(0).add(1);  // Edge 0-1
graph.get(0).add(3);  // Edge 0-3
...

ADJACENCY MATRIX (For dense graphs):

    0  1  2  3
0 [ 0  1  0  1 ]
1 [ 1  0  1  0 ]
2 [ 0  1  0  1 ]
3 [ 1  0  1  0 ]

1 = edge exists, 0 = no edge
```

## Graph Types

```
UNDIRECTED: Edges have no direction (friendship)
DIRECTED: Edges have direction (following on Twitter)
WEIGHTED: Edges have values (road distances)
UNWEIGHTED: All edges equal
CYCLIC: Contains cycles
ACYCLIC: No cycles (DAG = Directed Acyclic Graph)
CONNECTED: All nodes reachable from any node
```

---

# PART 6: GRAPH TRAVERSALS

## DFS vs BFS - When to Use Which

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    DFS vs BFS - COMPLETE COMPARISON                           ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────────┐
│ DFS (Depth-First Search)                                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│ STRATEGY: Go as DEEP as possible first, then backtrack                       │
│                                                                              │
│ USE DFS WHEN:                                                                │
│ • Finding ANY path (not necessarily shortest)                                │
│ • Detecting cycles                                                           │
│ • Topological sorting (DAG)                                                  │
│ • Finding connected components                                               │
│ • Solving mazes/puzzles (explore all options)                                │
│ • Problem requires backtracking                                              │
│ • Tree problems (most tree traversals are DFS)                               │
│                                                                              │
│ IMPLEMENTATION: Stack (explicit or recursion call stack)                     │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ BFS (Breadth-First Search)                                                   │
├──────────────────────────────────────────────────────────────────────────────┤
│ STRATEGY: Visit all neighbors at current level before going deeper          │
│                                                                              │
│ USE BFS WHEN:                                                                │
│ • Finding SHORTEST path in unweighted graph ⭐                              │
│ • Level-order traversal needed                                               │
│ • Finding nodes at distance k                                                │
│ • "Minimum steps/moves" problems                                             │
│ • Spreading/flooding problems (infection, fire)                              │
│ • Finding nearest X                                                          │
│                                                                              │
│ IMPLEMENTATION: Queue (FIFO)                                                 │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ QUICK DECISION TABLE                                                         │
├──────────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────┬───────────────────────────────────┐ │
│ │ Problem Type                        │ Use                               │ │
│ ├─────────────────────────────────────┼───────────────────────────────────┤ │
│ │ Shortest path (unweighted)          │ BFS                               │ │
│ │ Shortest path (weighted)            │ Dijkstra/Bellman-Ford             │ │
│ │ Any path exists?                    │ DFS (simpler) or BFS              │ │
│ │ All paths                           │ DFS with backtracking             │ │
│ │ Cycle detection                     │ DFS                               │ │
│ │ Topological sort                    │ DFS (or Kahn's BFS)               │ │
│ │ Connected components                │ DFS or BFS                        │ │
│ │ Level/distance from source          │ BFS                               │ │
│ │ Island counting                     │ DFS or BFS                        │ │
│ │ Word ladder (transformation)        │ BFS                               │ │
│ └─────────────────────────────────────┴───────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

## DFS (Depth-First Search)

```
GO DEEP first, then backtrack!

Start at node, visit neighbor, visit neighbor's neighbor...
Until dead end, then backtrack.

    0 --- 1
    |     |
    3 --- 2

DFS from 0: 0 → 1 → 2 → 3 (one possible order)

USES:
- Path finding
- Cycle detection
- Topological sort
- Connected components
```

```java
// RECURSIVE DFS
public void dfs(int node, List<List<Integer>> graph, boolean[] visited) {
    visited[node] = true;
    System.out.print(node + " ");

    for (int neighbor : graph.get(node)) {
        if (!visited[neighbor]) {
            dfs(neighbor, graph, visited);
        }
    }
}

// ITERATIVE DFS (using stack)
public void dfsIterative(int start, List<List<Integer>> graph) {
    boolean[] visited = new boolean[graph.size()];
    Stack<Integer> stack = new Stack<>();

    stack.push(start);

    while (!stack.isEmpty()) {
        int node = stack.pop();

        if (!visited[node]) {
            visited[node] = true;
            System.out.print(node + " ");

            for (int neighbor : graph.get(node)) {
                if (!visited[neighbor]) {
                    stack.push(neighbor);
                }
            }
        }
    }
}

// TIME: O(V + E) where V = vertices, E = edges
// SPACE: O(V) for visited array and stack/recursion
```

## BFS (Breadth-First Search)

```
GO WIDE first! Visit all neighbors before going deeper.

    0 --- 1
    |     |
    3 --- 2

BFS from 0:
Level 0: 0
Level 1: 1, 3
Level 2: 2

BFS order: 0 → 1 → 3 → 2

USES:
- Shortest path (unweighted)
- Level-order traversal
- Finding nearest neighbor
```

```java
public void bfs(int start, List<List<Integer>> graph) {
    boolean[] visited = new boolean[graph.size()];
    Queue<Integer> queue = new LinkedList<>();

    visited[start] = true;
    queue.offer(start);

    while (!queue.isEmpty()) {
        int node = queue.poll();
        System.out.print(node + " ");

        for (int neighbor : graph.get(node)) {
            if (!visited[neighbor]) {
                visited[neighbor] = true;
                queue.offer(neighbor);
            }
        }
    }
}

// SHORTEST PATH (unweighted graph)
public int shortestPath(int start, int end, List<List<Integer>> graph) {
    boolean[] visited = new boolean[graph.size()];
    Queue<int[]> queue = new LinkedList<>();  // [node, distance]

    visited[start] = true;
    queue.offer(new int[]{start, 0});

    while (!queue.isEmpty()) {
        int[] curr = queue.poll();
        int node = curr[0], dist = curr[1];

        if (node == end) return dist;

        for (int neighbor : graph.get(node)) {
            if (!visited[neighbor]) {
                visited[neighbor] = true;
                queue.offer(new int[]{neighbor, dist + 1});
            }
        }
    }

    return -1;  // No path found
}
```

---

# PART 7: CYCLE DETECTION

## In Undirected Graph

```java
// DFS approach
public boolean hasCycle(List<List<Integer>> graph) {
    boolean[] visited = new boolean[graph.size()];

    for (int i = 0; i < graph.size(); i++) {
        if (!visited[i]) {
            if (dfsHasCycle(i, -1, graph, visited)) {
                return true;
            }
        }
    }
    return false;
}

private boolean dfsHasCycle(int node, int parent,
                           List<List<Integer>> graph, boolean[] visited) {
    visited[node] = true;

    for (int neighbor : graph.get(node)) {
        if (!visited[neighbor]) {
            if (dfsHasCycle(neighbor, node, graph, visited)) {
                return true;
            }
        } else if (neighbor != parent) {
            // Visited neighbor that's not parent = cycle!
            return true;
        }
    }
    return false;
}
```

## In Directed Graph

```java
// Using colors: WHITE (unvisited), GRAY (in progress), BLACK (done)
public boolean hasCycleDirected(List<List<Integer>> graph) {
    int[] color = new int[graph.size()];  // 0=WHITE, 1=GRAY, 2=BLACK

    for (int i = 0; i < graph.size(); i++) {
        if (color[i] == 0) {
            if (dfsHasCycleDirected(i, graph, color)) {
                return true;
            }
        }
    }
    return false;
}

private boolean dfsHasCycleDirected(int node, List<List<Integer>> graph, int[] color) {
    color[node] = 1;  // GRAY - in progress

    for (int neighbor : graph.get(node)) {
        if (color[neighbor] == 1) {
            // Found GRAY node = back edge = cycle!
            return true;
        }
        if (color[neighbor] == 0) {
            if (dfsHasCycleDirected(neighbor, graph, color)) {
                return true;
            }
        }
    }

    color[node] = 2;  // BLACK - done
    return false;
}
```

---

# PART 8: TOPOLOGICAL SORT

```
ORDER TASKS RESPECTING DEPENDENCIES
Only for DAGs (Directed Acyclic Graphs)

Example: Course prerequisites
Course 1 → Course 2 → Course 3
       ↘    Course 4 ↗

Valid orders: [1, 2, 4, 3] or [1, 4, 2, 3]
```

```java
// Kahn's Algorithm (BFS approach)
public List<Integer> topologicalSort(int numCourses, int[][] prerequisites) {
    // Build graph and calculate in-degrees
    List<List<Integer>> graph = new ArrayList<>();
    int[] inDegree = new int[numCourses];

    for (int i = 0; i < numCourses; i++) {
        graph.add(new ArrayList<>());
    }

    for (int[] pre : prerequisites) {
        graph.get(pre[1]).add(pre[0]);  // pre[1] → pre[0]
        inDegree[pre[0]]++;
    }

    // Add nodes with in-degree 0 to queue
    Queue<Integer> queue = new LinkedList<>();
    for (int i = 0; i < numCourses; i++) {
        if (inDegree[i] == 0) {
            queue.offer(i);
        }
    }

    List<Integer> result = new ArrayList<>();

    while (!queue.isEmpty()) {
        int node = queue.poll();
        result.add(node);

        for (int neighbor : graph.get(node)) {
            inDegree[neighbor]--;
            if (inDegree[neighbor] == 0) {
                queue.offer(neighbor);
            }
        }
    }

    // If result doesn't contain all nodes, there's a cycle
    return result.size() == numCourses ? result : new ArrayList<>();
}
```

---

# PART 9: SHORTEST PATH ALGORITHMS

## Dijkstra's Algorithm

```
SHORTEST PATH from source to all nodes (weighted, non-negative)

IDEA: Greedy approach
- Start with source distance = 0, all others = infinity
- Always process the closest unvisited node
- Update distances through this node

    (0)---4---(1)
     |         |
     2         1
     |         |
    (2)---3---(3)

From node 0:
- dist[0] = 0, dist[1] = ∞, dist[2] = ∞, dist[3] = ∞
- Process 0: dist[1] = 4, dist[2] = 2
- Process 2 (closest): dist[3] = 2 + 3 = 5
- Process 1: dist[3] = min(5, 4+1) = 5
- Process 3: done

Final: dist = [0, 4, 2, 5]
```

```java
public int[] dijkstra(int n, List<int[]>[] graph, int source) {
    int[] dist = new int[n];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[source] = 0;

    // Priority queue: [distance, node]
    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] - b[0]);
    pq.offer(new int[]{0, source});

    while (!pq.isEmpty()) {
        int[] curr = pq.poll();
        int d = curr[0], node = curr[1];

        if (d > dist[node]) continue;  // Skip if outdated

        for (int[] edge : graph[node]) {
            int neighbor = edge[0], weight = edge[1];
            int newDist = dist[node] + weight;

            if (newDist < dist[neighbor]) {
                dist[neighbor] = newDist;
                pq.offer(new int[]{newDist, neighbor});
            }
        }
    }

    return dist;
}

// TIME: O((V + E) log V) with priority queue
// SPACE: O(V)
```

---

# PART 10: PRACTICE PROBLEMS

## Trees

```
EASY:
1. Maximum depth of binary tree
2. Invert binary tree
3. Same tree
4. Symmetric tree

MEDIUM:
1. Validate BST
2. Lowest common ancestor
3. Binary tree level order traversal
4. Construct binary tree from preorder/inorder

HARD:
1. Binary tree maximum path sum
2. Serialize and deserialize binary tree
```

## Graphs

```
EASY:
1. Find if path exists in graph
2. Find center of star graph

MEDIUM:
1. Number of islands (grid as graph)
2. Clone graph
3. Course schedule (topological sort)
4. Pacific Atlantic water flow

HARD:
1. Word ladder
2. Alien dictionary
3. Shortest path in binary matrix
```

---

# PART 11: Advanced Tree Algorithms

## Lowest Common Ancestor (LCA) with Binary Lifting

```
CONCEPT:
Preprocess tree to answer LCA queries in O(log n).
Uses the idea of "jumping" 2^i steps up at a time.

PREPROCESSING: O(n log n)
QUERY: O(log n)
```

```java
public class LCABinaryLifting {
    private int[][] up;  // up[node][i] = 2^i ancestor of node
    private int[] depth;
    private int LOG;

    public void preprocess(List<List<Integer>> adj, int root) {
        int n = adj.size();
        LOG = (int) Math.ceil(Math.log(n) / Math.log(2)) + 1;
        up = new int[n][LOG];
        depth = new int[n];

        // Initialize all ancestors to -1
        for (int[] row : up) Arrays.fill(row, -1);

        // DFS to fill depth and up[node][0] (direct parent)
        dfs(root, -1, 0, adj);

        // Fill the binary lifting table
        for (int j = 1; j < LOG; j++) {
            for (int i = 0; i < n; i++) {
                if (up[i][j - 1] != -1) {
                    up[i][j] = up[up[i][j - 1]][j - 1];
                }
            }
        }
    }

    private void dfs(int node, int parent, int d, List<List<Integer>> adj) {
        depth[node] = d;
        up[node][0] = parent;

        for (int child : adj.get(node)) {
            if (child != parent) {
                dfs(child, node, d + 1, adj);
            }
        }
    }

    public int lca(int a, int b) {
        // Make a the deeper node
        if (depth[a] < depth[b]) {
            int temp = a; a = b; b = temp;
        }

        // Bring a to same depth as b
        int diff = depth[a] - depth[b];
        for (int j = 0; j < LOG; j++) {
            if (((diff >> j) & 1) == 1) {
                a = up[a][j];
            }
        }

        if (a == b) return a;

        // Jump together
        for (int j = LOG - 1; j >= 0; j--) {
            if (up[a][j] != up[b][j]) {
                a = up[a][j];
                b = up[b][j];
            }
        }

        return up[a][0];
    }

    // Distance between two nodes
    public int distance(int a, int b) {
        int l = lca(a, b);
        return depth[a] + depth[b] - 2 * depth[l];
    }
}
```

## Tree Diameter

```java
// Method 1: Two BFS/DFS
public int treeDiameter(List<List<Integer>> adj) {
    int n = adj.size();

    // First BFS/DFS from any node to find farthest node
    int[] result1 = bfs(0, adj);
    int farthestNode = result1[0];

    // Second BFS/DFS from farthest to find diameter
    int[] result2 = bfs(farthestNode, adj);
    return result2[1];  // The diameter
}

private int[] bfs(int start, List<List<Integer>> adj) {
    int n = adj.size();
    int[] dist = new int[n];
    Arrays.fill(dist, -1);
    dist[start] = 0;

    Queue<Integer> queue = new LinkedList<>();
    queue.offer(start);

    int farthestNode = start, maxDist = 0;

    while (!queue.isEmpty()) {
        int node = queue.poll();
        for (int neighbor : adj.get(node)) {
            if (dist[neighbor] == -1) {
                dist[neighbor] = dist[node] + 1;
                queue.offer(neighbor);
                if (dist[neighbor] > maxDist) {
                    maxDist = dist[neighbor];
                    farthestNode = neighbor;
                }
            }
        }
    }

    return new int[]{farthestNode, maxDist};
}

// Method 2: Single DFS (return longest path through each node)
public int diameterDFS(List<List<Integer>> adj) {
    int[] diameter = {0};
    dfs(0, -1, adj, diameter);
    return diameter[0];
}

private int dfs(int node, int parent, List<List<Integer>> adj, int[] diameter) {
    int max1 = 0, max2 = 0;  // Two longest paths down

    for (int child : adj.get(node)) {
        if (child != parent) {
            int childDepth = dfs(child, node, adj, diameter) + 1;
            if (childDepth > max1) {
                max2 = max1;
                max1 = childDepth;
            } else if (childDepth > max2) {
                max2 = childDepth;
            }
        }
    }

    diameter[0] = Math.max(diameter[0], max1 + max2);
    return max1;
}
```

## Euler Tour and Tree Flattening

```
CONCEPT:
Convert tree to array to enable range queries.
Record entry and exit times during DFS.

USE CASES:
- Subtree queries (sum, count, etc.)
- Path queries with Segment Tree
```

```java
public class EulerTour {
    private int[] tin, tout;  // Entry and exit times
    private int[] euler;      // Flattened tree
    private int timer;

    public void flatten(List<List<Integer>> adj, int root) {
        int n = adj.size();
        tin = new int[n];
        tout = new int[n];
        euler = new int[2 * n];
        timer = 0;

        dfs(root, -1, adj);
    }

    private void dfs(int node, int parent, List<List<Integer>> adj) {
        tin[node] = timer;
        euler[timer++] = node;

        for (int child : adj.get(node)) {
            if (child != parent) {
                dfs(child, node, adj);
            }
        }

        tout[node] = timer;
        euler[timer++] = node;  // Record exit (for some applications)
    }

    // Check if a is ancestor of b
    public boolean isAncestor(int a, int b) {
        return tin[a] <= tin[b] && tout[a] >= tout[b];
    }

    // Subtree of node is represented by euler[tin[node]..tout[node]-1]
    // Can use Segment Tree for range queries on subtrees
}
```

---

# PART 12: Advanced Graph Algorithms

## Bellman-Ford Algorithm (Negative Weights)

```
CONCEPT:
Find shortest paths from source to all vertices.
Works with negative edge weights.
Can detect negative cycles.

TIME: O(V * E)
```

```java
public int[] bellmanFord(int n, int[][] edges, int source) {
    int[] dist = new int[n];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[source] = 0;

    // Relax all edges V-1 times
    for (int i = 0; i < n - 1; i++) {
        boolean updated = false;
        for (int[] edge : edges) {
            int u = edge[0], v = edge[1], w = edge[2];
            if (dist[u] != Integer.MAX_VALUE && dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
                updated = true;
            }
        }
        if (!updated) break;  // Early termination
    }

    // Check for negative cycles
    for (int[] edge : edges) {
        int u = edge[0], v = edge[1], w = edge[2];
        if (dist[u] != Integer.MAX_VALUE && dist[u] + w < dist[v]) {
            return null;  // Negative cycle detected
        }
    }

    return dist;
}
```

## Floyd-Warshall Algorithm (All-Pairs Shortest Path)

```
CONCEPT:
Find shortest paths between ALL pairs of vertices.
Uses dynamic programming.

TIME: O(V³)
SPACE: O(V²)
```

```java
public int[][] floydWarshall(int[][] graph) {
    int n = graph.length;
    int[][] dist = new int[n][n];

    // Initialize
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            dist[i][j] = graph[i][j];
        }
    }

    // Try each vertex as intermediate
    for (int k = 0; k < n; k++) {
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                if (dist[i][k] != Integer.MAX_VALUE &&
                    dist[k][j] != Integer.MAX_VALUE &&
                    dist[i][k] + dist[k][j] < dist[i][j]) {
                    dist[i][j] = dist[i][k] + dist[k][j];
                }
            }
        }
    }

    return dist;
}

// Visual for k=1 (using vertex 1 as intermediate):
// dist[0][2] = min(dist[0][2], dist[0][1] + dist[1][2])
```

## Minimum Spanning Tree - Prim's Algorithm

```java
public int primMST(int n, List<int[]>[] graph) {
    boolean[] inMST = new boolean[n];
    // PQ: [weight, node]
    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] - b[0]);
    pq.offer(new int[]{0, 0});  // Start from node 0

    int totalWeight = 0;
    int edgesAdded = 0;

    while (!pq.isEmpty() && edgesAdded < n) {
        int[] curr = pq.poll();
        int weight = curr[0], node = curr[1];

        if (inMST[node]) continue;

        inMST[node] = true;
        totalWeight += weight;
        edgesAdded++;

        for (int[] edge : graph[node]) {
            int neighbor = edge[0], edgeWeight = edge[1];
            if (!inMST[neighbor]) {
                pq.offer(new int[]{edgeWeight, neighbor});
            }
        }
    }

    return edgesAdded == n ? totalWeight : -1;
}
```

## Minimum Spanning Tree - Kruskal's Algorithm

```java
public int kruskalMST(int n, int[][] edges) {
    // Sort edges by weight
    Arrays.sort(edges, (a, b) -> a[2] - b[2]);

    UnionFind uf = new UnionFind(n);
    int totalWeight = 0;
    int edgesAdded = 0;

    for (int[] edge : edges) {
        int u = edge[0], v = edge[1], w = edge[2];

        if (uf.union(u, v)) {
            totalWeight += w;
            edgesAdded++;
            if (edgesAdded == n - 1) break;
        }
    }

    return edgesAdded == n - 1 ? totalWeight : -1;
}
```

## Articulation Points and Bridges

```
CONCEPT:
Articulation Point: A vertex whose removal disconnects the graph.
Bridge: An edge whose removal disconnects the graph.

USE CASES:
- Network vulnerability analysis
- Finding critical connections
```

```java
public class ArticulationPointsBridges {
    private int timer = 0;
    private List<Integer> articulationPoints = new ArrayList<>();
    private List<int[]> bridges = new ArrayList<>();

    public void find(List<List<Integer>> adj) {
        int n = adj.size();
        boolean[] visited = new boolean[n];
        int[] tin = new int[n];   // Discovery time
        int[] low = new int[n];   // Lowest reachable time

        for (int i = 0; i < n; i++) {
            if (!visited[i]) {
                dfs(i, -1, adj, visited, tin, low);
            }
        }
    }

    private void dfs(int node, int parent, List<List<Integer>> adj,
                     boolean[] visited, int[] tin, int[] low) {
        visited[node] = true;
        tin[node] = low[node] = timer++;
        int children = 0;

        for (int neighbor : adj.get(node)) {
            if (neighbor == parent) continue;

            if (visited[neighbor]) {
                // Back edge
                low[node] = Math.min(low[node], tin[neighbor]);
            } else {
                // Tree edge
                children++;
                dfs(neighbor, node, adj, visited, tin, low);
                low[node] = Math.min(low[node], low[neighbor]);

                // Check for articulation point
                if (parent != -1 && low[neighbor] >= tin[node]) {
                    articulationPoints.add(node);
                }

                // Check for bridge
                if (low[neighbor] > tin[node]) {
                    bridges.add(new int[]{node, neighbor});
                }
            }
        }

        // Special case: root with multiple children is articulation point
        if (parent == -1 && children > 1) {
            articulationPoints.add(node);
        }
    }
}
```

---

# PART 13: Graph Problem Patterns

## Pattern 1: Multi-Source BFS

```java
// Find distance from any '0' cell to each cell in grid
public int[][] multiSourceBFS(int[][] grid) {
    int m = grid.length, n = grid[0].length;
    int[][] dist = new int[m][n];
    Queue<int[]> queue = new LinkedList<>();

    // Add all sources to queue initially
    for (int i = 0; i < m; i++) {
        for (int j = 0; j < n; j++) {
            if (grid[i][j] == 0) {
                queue.offer(new int[]{i, j});
                dist[i][j] = 0;
            } else {
                dist[i][j] = Integer.MAX_VALUE;
            }
        }
    }

    int[][] dirs = {{0, 1}, {0, -1}, {1, 0}, {-1, 0}};

    while (!queue.isEmpty()) {
        int[] cell = queue.poll();
        int x = cell[0], y = cell[1];

        for (int[] dir : dirs) {
            int nx = x + dir[0], ny = y + dir[1];
            if (nx >= 0 && nx < m && ny >= 0 && ny < n &&
                dist[x][y] + 1 < dist[nx][ny]) {
                dist[nx][ny] = dist[x][y] + 1;
                queue.offer(new int[]{nx, ny});
            }
        }
    }

    return dist;
}
```

## Pattern 2: Bidirectional BFS

```java
// Word Ladder: Find shortest transformation sequence
public int ladderLength(String beginWord, String endWord, List<String> wordList) {
    Set<String> dict = new HashSet<>(wordList);
    if (!dict.contains(endWord)) return 0;

    Set<String> startSet = new HashSet<>();
    Set<String> endSet = new HashSet<>();
    startSet.add(beginWord);
    endSet.add(endWord);

    int length = 1;

    while (!startSet.isEmpty() && !endSet.isEmpty()) {
        // Always expand smaller set
        if (startSet.size() > endSet.size()) {
            Set<String> temp = startSet;
            startSet = endSet;
            endSet = temp;
        }

        Set<String> nextSet = new HashSet<>();

        for (String word : startSet) {
            char[] chars = word.toCharArray();

            for (int i = 0; i < chars.length; i++) {
                char original = chars[i];

                for (char c = 'a'; c <= 'z'; c++) {
                    if (c == original) continue;
                    chars[i] = c;
                    String newWord = new String(chars);

                    if (endSet.contains(newWord)) {
                        return length + 1;
                    }

                    if (dict.contains(newWord)) {
                        nextSet.add(newWord);
                        dict.remove(newWord);
                    }
                }

                chars[i] = original;
            }
        }

        startSet = nextSet;
        length++;
    }

    return 0;
}
```

## Pattern 3: Topological Sort with Kahn's Algorithm

```java
// Course Schedule II: Return order to take courses
public int[] findOrder(int numCourses, int[][] prerequisites) {
    List<List<Integer>> adj = new ArrayList<>();
    int[] inDegree = new int[numCourses];

    for (int i = 0; i < numCourses; i++) {
        adj.add(new ArrayList<>());
    }

    for (int[] pre : prerequisites) {
        adj.get(pre[1]).add(pre[0]);
        inDegree[pre[0]]++;
    }

    Queue<Integer> queue = new LinkedList<>();
    for (int i = 0; i < numCourses; i++) {
        if (inDegree[i] == 0) {
            queue.offer(i);
        }
    }

    int[] result = new int[numCourses];
    int index = 0;

    while (!queue.isEmpty()) {
        int course = queue.poll();
        result[index++] = course;

        for (int next : adj.get(course)) {
            if (--inDegree[next] == 0) {
                queue.offer(next);
            }
        }
    }

    return index == numCourses ? result : new int[0];
}
```

## Pattern 4: Cycle Detection in Directed Graph (Three Colors)

```java
public boolean hasCycle(int n, List<List<Integer>> adj) {
    int[] color = new int[n];  // 0: white, 1: gray, 2: black

    for (int i = 0; i < n; i++) {
        if (color[i] == 0 && dfs(i, adj, color)) {
            return true;
        }
    }

    return false;
}

private boolean dfs(int node, List<List<Integer>> adj, int[] color) {
    color[node] = 1;  // Mark as visiting (gray)

    for (int neighbor : adj.get(node)) {
        if (color[neighbor] == 1) return true;  // Back edge = cycle
        if (color[neighbor] == 0 && dfs(neighbor, adj, color)) {
            return true;
        }
    }

    color[node] = 2;  // Mark as visited (black)
    return false;
}
```

---

# PART 14: Complete Tree Problems with Solutions

## Problem 1: Serialize and Deserialize Binary Tree

```java
public class Codec {
    // Encodes a tree to a single string
    public String serialize(TreeNode root) {
        if (root == null) return "null";

        StringBuilder sb = new StringBuilder();
        Queue<TreeNode> queue = new LinkedList<>();
        queue.offer(root);

        while (!queue.isEmpty()) {
            TreeNode node = queue.poll();

            if (node == null) {
                sb.append("null,");
            } else {
                sb.append(node.val).append(",");
                queue.offer(node.left);
                queue.offer(node.right);
            }
        }

        return sb.toString();
    }

    // Decodes your encoded data to tree
    public TreeNode deserialize(String data) {
        if (data.equals("null")) return null;

        String[] nodes = data.split(",");
        TreeNode root = new TreeNode(Integer.parseInt(nodes[0]));
        Queue<TreeNode> queue = new LinkedList<>();
        queue.offer(root);

        int i = 1;
        while (!queue.isEmpty() && i < nodes.length) {
            TreeNode parent = queue.poll();

            if (!nodes[i].equals("null")) {
                parent.left = new TreeNode(Integer.parseInt(nodes[i]));
                queue.offer(parent.left);
            }
            i++;

            if (i < nodes.length && !nodes[i].equals("null")) {
                parent.right = new TreeNode(Integer.parseInt(nodes[i]));
                queue.offer(parent.right);
            }
            i++;
        }

        return root;
    }
}
```

## Problem 2: Construct Binary Tree from Preorder and Inorder

```java
public TreeNode buildTree(int[] preorder, int[] inorder) {
    Map<Integer, Integer> inorderMap = new HashMap<>();
    for (int i = 0; i < inorder.length; i++) {
        inorderMap.put(inorder[i], i);
    }

    return build(preorder, 0, preorder.length - 1,
                 0, inorder.length - 1, inorderMap);
}

private TreeNode build(int[] preorder, int preStart, int preEnd,
                       int inStart, int inEnd,
                       Map<Integer, Integer> inorderMap) {
    if (preStart > preEnd) return null;

    int rootVal = preorder[preStart];
    TreeNode root = new TreeNode(rootVal);

    int rootIndex = inorderMap.get(rootVal);
    int leftSize = rootIndex - inStart;

    root.left = build(preorder, preStart + 1, preStart + leftSize,
                      inStart, rootIndex - 1, inorderMap);
    root.right = build(preorder, preStart + leftSize + 1, preEnd,
                       rootIndex + 1, inEnd, inorderMap);

    return root;
}
```

## Problem 3: Binary Tree Maximum Path Sum

```java
public int maxPathSum(TreeNode root) {
    int[] maxSum = {Integer.MIN_VALUE};
    maxGain(root, maxSum);
    return maxSum[0];
}

private int maxGain(TreeNode node, int[] maxSum) {
    if (node == null) return 0;

    // Maximum contribution from left and right subtrees
    // Take max with 0 to ignore negative paths
    int leftGain = Math.max(0, maxGain(node.left, maxSum));
    int rightGain = Math.max(0, maxGain(node.right, maxSum));

    // Price of path passing through this node
    int pathPrice = node.val + leftGain + rightGain;
    maxSum[0] = Math.max(maxSum[0], pathPrice);

    // Return max gain if continuing path through this node
    return node.val + Math.max(leftGain, rightGain);
}
```

## Problem 4: Flatten Binary Tree to Linked List

```java
// In-place solution using Morris traversal idea
public void flatten(TreeNode root) {
    TreeNode curr = root;

    while (curr != null) {
        if (curr.left != null) {
            // Find rightmost node in left subtree
            TreeNode rightmost = curr.left;
            while (rightmost.right != null) {
                rightmost = rightmost.right;
            }

            // Connect right subtree
            rightmost.right = curr.right;

            // Move left to right
            curr.right = curr.left;
            curr.left = null;
        }

        curr = curr.right;
    }
}

// Visual:
//     1
//    / \
//   2   5
//  / \   \
// 3   4   6
//
// After flattening:
// 1 -> 2 -> 3 -> 4 -> 5 -> 6
```

---

# PART 15: Complete Graph Problems with Solutions

## Problem 1: Clone Graph

```java
public Node cloneGraph(Node node) {
    if (node == null) return null;

    Map<Node, Node> visited = new HashMap<>();
    return clone(node, visited);
}

private Node clone(Node node, Map<Node, Node> visited) {
    if (visited.containsKey(node)) {
        return visited.get(node);
    }

    Node copy = new Node(node.val);
    visited.put(node, copy);

    for (Node neighbor : node.neighbors) {
        copy.neighbors.add(clone(neighbor, visited));
    }

    return copy;
}
```

## Problem 2: Pacific Atlantic Water Flow

```java
public List<List<Integer>> pacificAtlantic(int[][] heights) {
    int m = heights.length, n = heights[0].length;
    boolean[][] pacific = new boolean[m][n];
    boolean[][] atlantic = new boolean[m][n];

    // Start from edges and work inward
    for (int i = 0; i < m; i++) {
        dfs(heights, pacific, i, 0);       // Pacific left edge
        dfs(heights, atlantic, i, n - 1);  // Atlantic right edge
    }
    for (int j = 0; j < n; j++) {
        dfs(heights, pacific, 0, j);       // Pacific top edge
        dfs(heights, atlantic, m - 1, j);  // Atlantic bottom edge
    }

    List<List<Integer>> result = new ArrayList<>();
    for (int i = 0; i < m; i++) {
        for (int j = 0; j < n; j++) {
            if (pacific[i][j] && atlantic[i][j]) {
                result.add(Arrays.asList(i, j));
            }
        }
    }

    return result;
}

private void dfs(int[][] heights, boolean[][] visited, int i, int j) {
    int m = heights.length, n = heights[0].length;
    visited[i][j] = true;

    int[][] dirs = {{0, 1}, {0, -1}, {1, 0}, {-1, 0}};
    for (int[] dir : dirs) {
        int ni = i + dir[0], nj = j + dir[1];
        if (ni >= 0 && ni < m && nj >= 0 && nj < n &&
            !visited[ni][nj] && heights[ni][nj] >= heights[i][j]) {
            dfs(heights, visited, ni, nj);
        }
    }
}
```

## Problem 3: Network Delay Time (Dijkstra)

```java
public int networkDelayTime(int[][] times, int n, int k) {
    // Build adjacency list
    List<int[]>[] graph = new ArrayList[n + 1];
    for (int i = 0; i <= n; i++) {
        graph[i] = new ArrayList<>();
    }
    for (int[] time : times) {
        graph[time[0]].add(new int[]{time[1], time[2]});
    }

    // Dijkstra
    int[] dist = new int[n + 1];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[k] = 0;

    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[1] - b[1]);
    pq.offer(new int[]{k, 0});

    while (!pq.isEmpty()) {
        int[] curr = pq.poll();
        int node = curr[0], time = curr[1];

        if (time > dist[node]) continue;

        for (int[] edge : graph[node]) {
            int next = edge[0], weight = edge[1];
            if (dist[node] + weight < dist[next]) {
                dist[next] = dist[node] + weight;
                pq.offer(new int[]{next, dist[next]});
            }
        }
    }

    int maxTime = 0;
    for (int i = 1; i <= n; i++) {
        if (dist[i] == Integer.MAX_VALUE) return -1;
        maxTime = Math.max(maxTime, dist[i]);
    }

    return maxTime;
}
```

## Problem 4: Cheapest Flights Within K Stops

```java
public int findCheapestPrice(int n, int[][] flights, int src, int dst, int k) {
    // BFS with level tracking (Bellman-Ford style)
    int[] dist = new int[n];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[src] = 0;

    for (int i = 0; i <= k; i++) {
        int[] temp = dist.clone();
        for (int[] flight : flights) {
            int u = flight[0], v = flight[1], price = flight[2];
            if (dist[u] != Integer.MAX_VALUE) {
                temp[v] = Math.min(temp[v], dist[u] + price);
            }
        }
        dist = temp;
    }

    return dist[dst] == Integer.MAX_VALUE ? -1 : dist[dst];
}
```

---

_Trees and graphs are everywhere - master them and unlock many problems!_ 🌳
