# 8.2 Tree Property Problems

> **Navigation**: [← 8.1 Tree Traversal Problems](02_tree_traversal_problems.md) | [Chapter overview](../09_Trees.md) | [8.3 Path & Sum Problems →](04_path_sum_problems.md)
> Page 3 of 7 in **Trees**


- **Pattern:** Bottom-up recursion — ask children for their info, combine at parent.
- **Template:** `int helper(node) { left = helper(left); right = helper(right); return combine(left, right); }`
- **Key insight:** The answer at every node depends on the answer from BOTH children. Think: "What do I need from my children to answer for myself?"

## Problem 110: Maximum Depth of Binary Tree

**LeetCode 104** 🔗 https://leetcode.com/problems/maximum-depth-of-binary-tree/

**MAXIMUM DEPTH (Height)**

```text
      3          depth = 1 + max(depth(left), depth(right))
     / \
    9  20        depth(3) = 1 + max(1, 2) = 3
      /  \       depth(9) = 1 + max(0, 0) = 1
     15   7      depth(20) = 1 + max(1, 1) = 2

Maximum Depth = 3
```

**Solution:**

```java
public int maxDepth(TreeNode root) {
    if (root == null) return 0;

    int leftDepth = maxDepth(root.left);
    int rightDepth = maxDepth(root.right);

    return 1 + Math.max(leftDepth, rightDepth);
}

// Iterative BFS approach
public int maxDepthBFS(TreeNode root) {
    if (root == null) return 0;

    Queue<TreeNode> queue = new LinkedList<>();
    queue.offer(root);
    int depth = 0;

    while (!queue.isEmpty()) {
        int levelSize = queue.size();
        depth++;

        for (int i = 0; i < levelSize; i++) {
            TreeNode node = queue.poll();
            if (node.left != null) queue.offer(node.left);
            if (node.right != null) queue.offer(node.right);
        }
    }

    return depth;
}
```

---

## Problem 111: Minimum Depth of Binary Tree

**LeetCode 111** 🔗 https://leetcode.com/problems/minimum-depth-of-binary-tree/

**MINIMUM DEPTH - Shortest path from root to leaf**

```text
      3                    3
     / \                    \
    9  20                   20
      /  \                 /  \
     15   7               15   7

Min depth = 2           Min depth = 3 (not 1!)
(3→9 is leaf)           (3 is not a leaf)

⚠️ TRAP: If one child is null, use the other child's depth
```

**Solution:**

```java
public int minDepth(TreeNode root) {
    if (root == null) return 0;

    // If only one child exists, must go through that child
    if (root.left == null) return 1 + minDepth(root.right);
    if (root.right == null) return 1 + minDepth(root.left);

    return 1 + Math.min(minDepth(root.left), minDepth(root.right));
}

// BFS is more efficient - finds first leaf
public int minDepthBFS(TreeNode root) {
    if (root == null) return 0;

    Queue<TreeNode> queue = new LinkedList<>();
    queue.offer(root);
    int depth = 0;

    while (!queue.isEmpty()) {
        depth++;
        int levelSize = queue.size();

        for (int i = 0; i < levelSize; i++) {
            TreeNode node = queue.poll();

            // Found first leaf!
            if (node.left == null && node.right == null) {
                return depth;
            }

            if (node.left != null) queue.offer(node.left);
            if (node.right != null) queue.offer(node.right);
        }
    }

    return depth;
}
```

---

## Problem 112: Balanced Binary Tree

**LeetCode 110** 🔗 https://leetcode.com/problems/balanced-binary-tree/

**BALANCED BINARY TREE**

```text
A tree is balanced if for every node, the height difference
between left and right subtrees is at most 1.

Balanced:              Unbalanced:
      3                      1
     / \                      \
    9  20                      2
      /  \                      \
     15   7                      3
                                  \
|h(L) - h(R)| <= 1               4 ← depth diff > 1
```

**Solution:**

```java
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
    if (Math.abs(leftHeight - rightHeight) > 1) return -1;

    return 1 + Math.max(leftHeight, rightHeight);
}
```

---

## Problem 113: Same Tree

**LeetCode 100** 🔗 https://leetcode.com/problems/same-tree/

**SAME TREE - Check if two trees are identical**

```text
    1         1                    1         1
   / \       / \                  / \       / \
  2   3     2   3                2   1     1   2

Same: true                      Same: false
                                (structure same, values diff)
```

**Solution:**

```java
public boolean isSameTree(TreeNode p, TreeNode q) {
    // Both null
    if (p == null && q == null) return true;

    // One null, other not
    if (p == null || q == null) return false;

    // Values different
    if (p.val != q.val) return false;

    // Check both subtrees
    return isSameTree(p.left, q.left) && isSameTree(p.right, q.right);
}
```

---

## Problem 114: Symmetric Tree

**LeetCode 101** 🔗 https://leetcode.com/problems/symmetric-tree/

**SYMMETRIC TREE - Mirror image of itself**

```text
Symmetric:                    Not Symmetric:
      1                            1
     / \                          / \
    2   2                        2   2
   / \ / \                        \   \
  3  4 4  3                        3   3

Check: left.left == right.right AND left.right == right.left
```

**Solution:**

```java
public boolean isSymmetric(TreeNode root) {
    if (root == null) return true;
    return isMirror(root.left, root.right);
}

private boolean isMirror(TreeNode left, TreeNode right) {
    if (left == null && right == null) return true;
    if (left == null || right == null) return false;

    return (left.val == right.val) &&
           isMirror(left.left, right.right) &&
           isMirror(left.right, right.left);
}

// Iterative with Queue
public boolean isSymmetricIterative(TreeNode root) {
    if (root == null) return true;

    Queue<TreeNode> queue = new LinkedList<>();
    queue.offer(root.left);
    queue.offer(root.right);

    while (!queue.isEmpty()) {
        TreeNode left = queue.poll();
        TreeNode right = queue.poll();

        if (left == null && right == null) continue;
        if (left == null || right == null) return false;
        if (left.val != right.val) return false;

        queue.offer(left.left);
        queue.offer(right.right);
        queue.offer(left.right);
        queue.offer(right.left);
    }

    return true;
}
```

---

## Problem 115: Invert Binary Tree

**LeetCode 226** 🔗 https://leetcode.com/problems/invert-binary-tree/

**INVERT BINARY TREE - Mirror/Flip the tree**

```text
Input:           Output:
     4               4
    / \             / \
   2   7    →      7   2
  / \ / \         / \ / \
 1  3 6  9       9  6 3  1

At each node: swap left and right children
```

**Solution:**

```java
public TreeNode invertTree(TreeNode root) {
    if (root == null) return null;

    // Swap children
    TreeNode temp = root.left;
    root.left = root.right;
    root.right = temp;

    // Recursively invert subtrees
    invertTree(root.left);
    invertTree(root.right);

    return root;
}
```

---

[← 8.1 Tree Traversal Problems](02_tree_traversal_problems.md) | [Chapter overview](../09_Trees.md) | [8.3 Path & Sum Problems →](04_path_sum_problems.md)
