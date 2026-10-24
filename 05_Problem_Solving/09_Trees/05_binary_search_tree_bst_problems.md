# 8.4 Binary Search Tree (BST) Problems

> **Navigation**: [← 8.3 Path & Sum Problems](04_path_sum_problems.md) | [Chapter overview](../09_Trees.md) | [8.5 Tree Construction Problems →](06_tree_construction_problems.md)
> Page 5 of 7 in **Trees**


**BINARY SEARCH TREE PROPERTY**

```text
For every node:
- All values in LEFT subtree < node value
- All values in RIGHT subtree > node value

       8
      / \
     3   10        Valid BST:
    / \    \       - Left of 8: {1,3,6} all < 8
   1   6    14     - Right of 8: {10,14} all > 8
      / \   /      - Inorder: 1,3,6,8,10,13,14 (sorted!)
     4   7 13
```

---

## Problem 121: Validate Binary Search Tree

**LeetCode 98** 🔗 https://leetcode.com/problems/validate-binary-search-tree/

**VALIDATE BST**

```text
Valid BST:           Invalid BST:
     2                    5
    / \                  / \
   1   3                1   4  ← 4 < 5 but 3 > right val!
                           / \
true                      3   6

⚠️ Common mistake: Only checking immediate children
Must check against valid RANGE for each node
```

**Solution:**

```java
public boolean isValidBST(TreeNode root) {
    return validate(root, Long.MIN_VALUE, Long.MAX_VALUE);
}

private boolean validate(TreeNode node, long min, long max) {
    if (node == null) return true;

    // Check if value is within valid range
    if (node.val <= min || node.val >= max) return false;

    // Left subtree: all values must be < node.val
    // Right subtree: all values must be > node.val
    return validate(node.left, min, node.val) &&
           validate(node.right, node.val, max);
}

// Alternative: Inorder traversal should be sorted
public boolean isValidBSTInorder(TreeNode root) {
    Stack<TreeNode> stack = new Stack<>();
    TreeNode prev = null;
    TreeNode curr = root;

    while (curr != null || !stack.isEmpty()) {
        while (curr != null) {
            stack.push(curr);
            curr = curr.left;
        }

        curr = stack.pop();

        // Check if inorder is sorted
        if (prev != null && curr.val <= prev.val) return false;
        prev = curr;

        curr = curr.right;
    }

    return true;
}
```

---

## Problem 122: Search in a Binary Search Tree

**LeetCode 700** 🔗 https://leetcode.com/problems/search-in-a-binary-search-tree/

**SEARCH IN BST**

```text
     4                  Search for 2:
    / \                 4 > 2 → go left
   2   7                2 == 2 → found!
  / \
 1   3                  Return subtree rooted at 2

Time: O(h) where h = height (O(log n) for balanced)
```

**Solution:**

```java
public TreeNode searchBST(TreeNode root, int val) {
    if (root == null || root.val == val) return root;

    return val < root.val ?
           searchBST(root.left, val) :
           searchBST(root.right, val);
}

// Iterative
public TreeNode searchBSTIterative(TreeNode root, int val) {
    while (root != null && root.val != val) {
        root = val < root.val ? root.left : root.right;
    }
    return root;
}
```

---

## Problem 123: Lowest Common Ancestor of a BST

**LeetCode 235** 🔗 https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/

**LOWEST COMMON ANCESTOR (LCA) in BST**

```text
       6
      / \
     2   8
    / \ / \
   0  4 7  9         LCA(2, 8) = 6
     / \             LCA(2, 4) = 2
    3   5            LCA(3, 5) = 4

BST Property helps:
- If both < node → LCA is in left
- If both > node → LCA is in right
- Otherwise, current node is LCA (split point)
```

**Solution:**

```java
public TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {
    while (root != null) {
        if (p.val < root.val && q.val < root.val) {
            root = root.left;   // Both in left subtree
        } else if (p.val > root.val && q.val > root.val) {
            root = root.right;  // Both in right subtree
        } else {
            return root;  // Split point - this is LCA
        }
    }
    return null;
}
```

---

## Problem 124: Lowest Common Ancestor of a Binary Tree

💡 **Approach:** Classic interview question. Recursive post-order traversal.
For each node: search left subtree and right subtree for p and q.
If BOTH return non-null → this node is the LCA (p and q are in different subtrees).
If only ONE returns non-null → that result IS the LCA (both p and q are in same subtree).
**Why it works:** The FIRST node where p and q "split" into different subtrees must be their LCA.
**Time:** O(n) | **Space:** O(h)

**LeetCode 236** 🔗 https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/

**LCA in General Binary Tree (not BST)**

```text
       3
      / \
     5   1
    / \ / \
   6  2 0  8        LCA(5, 1) = 3
     / \            LCA(5, 4) = 5
    7   4           LCA(6, 4) = 5

General approach (no BST property):
- Search both subtrees for p and q
- If found in different subtrees → current is LCA
- If both in same subtree → recurse
```

**Solution:**

```java
public TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {
    if (root == null || root == p || root == q) return root;

    TreeNode left = lowestCommonAncestor(root.left, p, q);
    TreeNode right = lowestCommonAncestor(root.right, p, q);

    // p and q found in different subtrees
    if (left != null && right != null) return root;

    // Both in same subtree
    return left != null ? left : right;
}
```

---

## Problem 125: Kth Smallest Element in a BST

**LeetCode 230** 🔗 https://leetcode.com/problems/kth-smallest-element-in-a-bst/

**Kth SMALLEST IN BST**

```text
     3
    / \         Inorder: [1, 2, 3, 4]
   1   4
    \           k=1 → return 1
     2          k=2 → return 2
                k=3 → return 3

Inorder traversal of BST gives sorted order!
```

**Solution:**

```java
public int kthSmallest(TreeNode root, int k) {
    Stack<TreeNode> stack = new Stack<>();
    TreeNode curr = root;

    while (curr != null || !stack.isEmpty()) {
        while (curr != null) {
            stack.push(curr);
            curr = curr.left;
        }

        curr = stack.pop();
        k--;

        if (k == 0) return curr.val;

        curr = curr.right;
    }

    return -1;  // k is invalid
}
```

---

## Problem 126: 🔒 Inorder Successor in BST (LeetCode 285 - Premium)

**INORDER SUCCESSOR IN BST**

```text
 Given a BST and a node p, find the in-order successor of
 that node (smallest node greater than p).

      5
     / \
    3   6
   / \
  2   4           Successor(3) = 4
 /                Successor(4) = 5
1                 Successor(6) = null

 If p has right child → leftmost in right subtree
 Else → nearest ancestor where p is in left subtree

 Constraints:
 - Number of nodes: [1, 10^4]
 - All node values unique
 - p exists in the tree
```

**Solution:**

```java
public TreeNode inorderSuccessor(TreeNode root, TreeNode p) {
    TreeNode successor = null;

    while (root != null) {
        if (p.val < root.val) {
            successor = root;  // Current node could be successor
            root = root.left;
        } else {
            root = root.right;  // Successor must be in right
        }
    }

    return successor;
}
```

---

[← 8.3 Path & Sum Problems](04_path_sum_problems.md) | [Chapter overview](../09_Trees.md) | [8.5 Tree Construction Problems →](06_tree_construction_problems.md)
