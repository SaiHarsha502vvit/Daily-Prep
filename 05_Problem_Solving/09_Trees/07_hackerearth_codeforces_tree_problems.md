# 8.6 HackerEarth & Codeforces Tree Problems

> **Navigation**: [← 8.5 Tree Construction Problems](06_tree_construction_problems.md) | [Chapter overview](../09_Trees.md)
> Page 7 of 7 in **Trees**


## Problem 130: Count Leaf Nodes (HackerEarth)

```
┌────────────────────────────────────────────────────────────────┐
│  COUNT LEAF NODES                                              │
├────────────────────────────────────────────────────────────────┤
│  A leaf node has no children (both left and right are null).   │
│                                                                │
│        1                                                       │
│       / \                                                      │
│      2   3         Leaf nodes: 4, 5, 6                         │
│     / \   \        Count = 3                                   │
│    4   5   6                                                   │
│                                                                │
│  Constraints:                                                  │
│  - 1 <= n <= 10^5                                              │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int countLeaves(TreeNode root) {
    if (root == null) return 0;

    // Is a leaf
    if (root.left == null && root.right == null) return 1;

    return countLeaves(root.left) + countLeaves(root.right);
}
```

---

## Problem 131: Sum of All Nodes (HackerEarth)

```
┌────────────────────────────────────────────────────────────────┐
│  SUM OF ALL NODES                                              │
├────────────────────────────────────────────────────────────────┤
│        1                                                       │
│       / \                                                      │
│      2   3         Sum = 1 + 2 + 3 + 4 + 5 + 6 = 21            │
│     / \   \                                                    │
│    4   5   6                                                   │
│                                                                │
│  Simple DFS traversal                                          │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int sumOfNodes(TreeNode root) {
    if (root == null) return 0;

    return root.val + sumOfNodes(root.left) + sumOfNodes(root.right);
}
```

---

## Problem 132: Level with Maximum Sum (Codeforces-style)

```
┌────────────────────────────────────────────────────────────────┐
│  LEVEL WITH MAXIMUM SUM                                        │
├────────────────────────────────────────────────────────────────┤
│  Find the level (1-indexed) with the maximum sum.              │
│                                                                │
│        1          Level 1: sum = 1                             │
│       / \         Level 2: sum = 2 + 3 = 5                     │
│      2   3        Level 3: sum = 4 + 5 + 6 = 15 ← Maximum      │
│     / \   \                                                    │
│    4   5   6      Output: 3                                    │
│                                                                │
│  Constraints:                                                  │
│  - 1 <= n <= 10^4                                              │
│  - -10^5 <= node.val <= 10^5                                   │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int maxLevelSum(TreeNode root) {
    if (root == null) return 0;

    Queue<TreeNode> queue = new LinkedList<>();
    queue.offer(root);

    int maxSum = Integer.MIN_VALUE;
    int maxLevel = 1;
    int currentLevel = 0;

    while (!queue.isEmpty()) {
        currentLevel++;
        int levelSize = queue.size();
        int levelSum = 0;

        for (int i = 0; i < levelSize; i++) {
            TreeNode node = queue.poll();
            levelSum += node.val;

            if (node.left != null) queue.offer(node.left);
            if (node.right != null) queue.offer(node.right);
        }

        if (levelSum > maxSum) {
            maxSum = levelSum;
            maxLevel = currentLevel;
        }
    }

    return maxLevel;
}
```

---

## Problem 133: Print Nodes at K Distance (HackerEarth)

```
┌────────────────────────────────────────────────────────────────┐
│  NODES AT K DISTANCE FROM ROOT                                 │
├────────────────────────────────────────────────────────────────┤
│        1          k = 2                                        │
│       / \                                                      │
│      2   3        Nodes at distance 2: [4, 5, 6]               │
│     / \   \                                                    │
│    4   5   6                                                   │
│                                                                │
│  Distance from root = Level - 1                                │
│  Nodes at distance k are at level k+1                          │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public List<Integer> nodesAtKDistance(TreeNode root, int k) {
    List<Integer> result = new ArrayList<>();
    findNodes(root, k, result);
    return result;
}

private void findNodes(TreeNode node, int k, List<Integer> result) {
    if (node == null) return;

    if (k == 0) {
        result.add(node.val);
        return;
    }

    findNodes(node.left, k - 1, result);
    findNodes(node.right, k - 1, result);
}
```

---

## Problem 134: Check if Tree is Complete (Codeforces-style)

```
┌────────────────────────────────────────────────────────────────┐
│  CHECK IF COMPLETE BINARY TREE                                 │
├────────────────────────────────────────────────────────────────┤
│  A complete binary tree has all levels filled except possibly  │
│  the last, and all nodes in last level are as left as possible.│
│                                                                │
│  Complete:              Not Complete:                          │
│       1                      1                                 │
│      / \                    / \                                │
│     2   3                  2   3                               │
│    / \                    / \   \                              │
│   4   5                  4   5   6  (gap at left of last level)│
│                                                                │
│  BFS approach: After seeing first null, no more non-null nodes │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public boolean isCompleteTree(TreeNode root) {
    if (root == null) return true;

    Queue<TreeNode> queue = new LinkedList<>();
    queue.offer(root);
    boolean seenNull = false;

    while (!queue.isEmpty()) {
        TreeNode node = queue.poll();

        if (node == null) {
            seenNull = true;
        } else {
            // If we've seen null and now see non-null, not complete
            if (seenNull) return false;

            queue.offer(node.left);
            queue.offer(node.right);
        }
    }

    return true;
}
```

---

## Problem 135: Left View of Binary Tree (HackerEarth)

```
┌────────────────────────────────────────────────────────────────┐
│  LEFT VIEW OF BINARY TREE                                      │
├────────────────────────────────────────────────────────────────┤
│  Print first node of each level (as seen from left side)       │
│                                                                │
│        1     ←                                                 │
│       / \                                                      │
│      2   3   ← (2 is leftmost at this level)                   │
│       \   \                                                    │
│        5   4 ← (5 is leftmost at this level)                   │
│                                                                │
│  Left view: [1, 2, 5]                                          │
│                                                                │
│  Right view would be: [1, 3, 4]                                │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public List<Integer> leftSideView(TreeNode root) {
    List<Integer> result = new ArrayList<>();
    if (root == null) return result;

    Queue<TreeNode> queue = new LinkedList<>();
    queue.offer(root);

    while (!queue.isEmpty()) {
        int levelSize = queue.size();

        for (int i = 0; i < levelSize; i++) {
            TreeNode node = queue.poll();

            // First node of each level
            if (i == 0) {
                result.add(node.val);
            }

            if (node.left != null) queue.offer(node.left);
            if (node.right != null) queue.offer(node.right);
        }
    }

    return result;
}

// Recursive approach
public List<Integer> leftSideViewDFS(TreeNode root) {
    List<Integer> result = new ArrayList<>();
    dfs(root, 0, result);
    return result;
}

private void dfs(TreeNode node, int level, List<Integer> result) {
    if (node == null) return;

    // First time visiting this level
    if (level == result.size()) {
        result.add(node.val);
    }

    dfs(node.left, level + 1, result);  // Visit left first for left view
    dfs(node.right, level + 1, result);
}
```

---

---

## 🏆 Competitive Programming — Codeforces Problems

| Problem           | Link                                                         | Technique                   | Difficulty  |
| ----------------- | ------------------------------------------------------------ | --------------------------- | ----------- |
| Xenia and Tree    | [CF 339D](https://codeforces.com/problemset/problem/339/D)   | Tree centroid + LCA         | ⭐⭐⭐ Hard |
| Kefa and Park     | [CF 580C](https://codeforces.com/problemset/problem/580/C)   | DFS with condition          | ⭐ Easy     |
| New Year Tree     | [CF 620E](https://codeforces.com/problemset/problem/620/E)   | Euler tour + segment tree   | ⭐⭐⭐ Hard |
| Anya and Cubes    | [CF 558C](https://codeforces.com/problemset/problem/558/C)   | DFS-like recursion          | ⭐ Easy     |
| Tree with Coprime | [CF 1017E](https://codeforces.com/problemset/problem/1017/E) | DFS on tree + number theory | ⭐⭐⭐ Hard |
| Pashmak and Trees | [CF 459C](https://codeforces.com/problemset/problem/459/C)   | Tree DP                     | ⭐⭐ Medium |

---

## 🌍 Real-World Applications of Tree Algorithms

| Technique                        | Real-World System                 | How It's Used                                               |
| -------------------------------- | --------------------------------- | ----------------------------------------------------------- |
| **DFS preorder**                 | XML/JSON parsers                  | Serialize tree structure: visit node, then recurse children |
| **DFS postorder**                | Compiler AST evaluation           | Evaluate expressions: compute children before parent        |
| **BFS level-order**              | Social network friend suggestions | BFS from user → friends of friends = level 2                |
| **Binary Search Tree**           | Database engine indexes           | B-Tree search = multi-way BST for sorted disk access        |
| **Trie (prefix tree)**           | Google Search autocomplete        | Each node = character; O(L) prefix search                   |
| **Segment Tree**                 | Game leaderboards                 | Range max/min queries + point updates in O(log n)           |
| **LCA (Lowest Common Ancestor)** | Version control (Git)             | "Common ancestor of two commits" = LCA on the commit DAG    |

```
🔥 THE TRIE IN GOOGLE SEARCH:
   You type "algo" → Trie traverse: root→a→l→g→o
   At 'o' node: all children = all completions starting with "algo"

   interview follow-up: "How does autocorrect work?"
   → Edit distance DP on Trie nodes (BFS through trie with distance budget)
```

---

### Historical Evolution

Binary search trees were developed independently around 1960 (Windley; Booth and Colin) and analysed by Hibbard (1962). Self-balancing followed: AVL trees (Adelson-Velsky and Landis, 1962), B-trees (Bayer and McCreight, 1970–72), red-black trees (Guibas and Sedgewick, 1978, from Bayer's 1972 symmetric binary B-trees). Tree traversal names (pre-, in-, post-order) come from Knuth's *TAOCP* Vol. 1 (1968); offline lowest common ancestor is due to Tarjan (1979).

- **AVL — 1962**: First self-balancing BST
- **B-trees — 1970–72**: Balanced multiway trees for disk
- **Knuth — 1968**: Traversal terminology
- **Guibas & Sedgewick — 1978**: Red-black trees
- **Tarjan — 1979**: Offline LCA

### Production Reality

**Trees** patterns introduce several production failure modes that learners must internalize:

**Failure mode 1: Stack overflow on recursive DFS for deep/degenerate trees.** A binary tree with 100,000 nodes in a straight line (skewed) creates a recursion depth of 100,000. With a default thread stack, Java typically overflows after roughly 10,000–20,000 simple frames (it depends on frame size and `-Xss`). Illustrative impact: The LeetCode "Maximum Depth" solution passes all balanced tests but crashes silently on adversarial inputs in production. A product-category tree with 50,000 categories nested in a degenerate chain will crash a naive recursive traversal.

**Failure mode 2: BFS memory exhaustion on wide trees.** A perfect binary tree with height 17 has 2^17 = 131,072 leaf nodes. BFS with a queue stores all nodes at the widest level simultaneously — up to O(n) space. For n=1,000,000, this means 500,000 nodes in a single queue level. Illustrative impact: `OutOfMemoryError` in memory-constrained environments (Lambda functions, mobile apps).

**Failure mode 3: Null pointer on empty tree root.** Code like `root.val` without checking `root == null` first crashes with `NullPointerException`. Illustrative impact: API endpoint that returns a tree (e.g., org chart, file system) with no data returns null, and downstream consumers crash.

**Debug workflow:** Convert recursive DFS to iterative with explicit stack: `Deque<TreeNode> stack = new ArrayDeque<>();` push root, pop, push children. For BFS memory issues, profile queue size on worst-case inputs (generate a perfect tree programmatically). For null root bugs, add `if (root == null) return` as the first line of every tree method.

**Real-world anchor:** Recursive parsers can overflow the stack on deeply nested JSON or XML, so libraries add explicit depth limits (for example, Jackson limits nesting depth to 1,000 by default since version 2.15).

---

[← 8.5 Tree Construction Problems](06_tree_construction_problems.md) | [Chapter overview](../09_Trees.md)
