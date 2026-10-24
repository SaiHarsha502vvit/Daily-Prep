# 8.1 Tree Traversal Problems

> **Navigation**: [← SECTION 8: TREE PROBLEMS (BFS/DFS)](01_section_8_tree_problems_bfs_dfs.md) | [Chapter overview](../09_Trees.md) | [8.2 Tree Property Problems →](03_tree_property_problems.md)
> Page 2 of 7 in **Trees**


**Pattern:** Traverse all nodes in a specific order. These are template problems — memorize the iterative versions.
**Key insight:** Recursive is trivial. Interviewers want ITERATIVE solutions using an explicit stack (DFS) or queue (BFS).

## Problem 104: Binary Tree Inorder Traversal

**LeetCode 94** 🔗 https://leetcode.com/problems/binary-tree-inorder-traversal/

**INORDER TRAVERSAL: Left → Root → Right**

```text
      1
       \
        2        Inorder: [1, 3, 2]
       /
      3

Recursive call flow:
inorder(1) → inorder(null) → visit 1 → inorder(2)
          → inorder(3) → visit 3 → visit 2 → inorder(null)
```

**Solution (Recursive):**

```java
public List<Integer> inorderTraversal(TreeNode root) {
    List<Integer> result = new ArrayList<>();
    inorder(root, result);
    return result;
}

private void inorder(TreeNode node, List<Integer> result) {
    if (node == null) return;

    inorder(node.left, result);   // Left
    result.add(node.val);          // Root
    inorder(node.right, result);  // Right
}
```

**Solution (Iterative with Stack):**

```java
public List<Integer> inorderTraversal(TreeNode root) {
    List<Integer> result = new ArrayList<>();
    Stack<TreeNode> stack = new Stack<>();
    TreeNode curr = root;

    while (curr != null || !stack.isEmpty()) {
        // Go to leftmost
        while (curr != null) {
            stack.push(curr);
            curr = curr.left;
        }

        // Process node
        curr = stack.pop();
        result.add(curr.val);

        // Move to right subtree
        curr = curr.right;
    }

    return result;
}
```

---

## Problem 105: Binary Tree Preorder Traversal

**LeetCode 144** 🔗 https://leetcode.com/problems/binary-tree-preorder-traversal/

**PREORDER TRAVERSAL: Root → Left → Right**

```text
      1
     / \
    2   3        Preorder: [1, 2, 4, 5, 3]
   / \
  4   5

Process order: 1 → 2 → 4 → 5 → 3
```

**Solution (Iterative):**

```java
public List<Integer> preorderTraversal(TreeNode root) {
    List<Integer> result = new ArrayList<>();
    if (root == null) return result;

    Stack<TreeNode> stack = new Stack<>();
    stack.push(root);

    while (!stack.isEmpty()) {
        TreeNode node = stack.pop();
        result.add(node.val);  // Process root first

        // Push right first so left is processed first
        if (node.right != null) stack.push(node.right);
        if (node.left != null) stack.push(node.left);
    }

    return result;
}
```

---

## Problem 106: Binary Tree Postorder Traversal

**LeetCode 145** 🔗 https://leetcode.com/problems/binary-tree-postorder-traversal/

**POSTORDER TRAVERSAL: Left → Right → Root**

```text
      1
     / \
    2   3        Postorder: [4, 5, 2, 3, 1]
   / \
  4   5

Trick: Reverse of (Root → Right → Left)
Modified preorder: 1→3→2→5→4 then reverse → 4,5,2,3,1
```

**Solution:**

```java
public List<Integer> postorderTraversal(TreeNode root) {
    LinkedList<Integer> result = new LinkedList<>();
    if (root == null) return result;

    Stack<TreeNode> stack = new Stack<>();
    stack.push(root);

    while (!stack.isEmpty()) {
        TreeNode node = stack.pop();
        result.addFirst(node.val);  // Add to front (reverse)

        // Push left first, then right
        if (node.left != null) stack.push(node.left);
        if (node.right != null) stack.push(node.right);
    }

    return result;
}
```

---

## Problem 107: Binary Tree Level Order Traversal

**LeetCode 102** 🔗 https://leetcode.com/problems/binary-tree-level-order-traversal/

```
┌────────────────────────────────────────────────────────────────┐
│  LEVEL ORDER TRAVERSAL (BFS)                                   │
├────────────────────────────────────────────────────────────────┤
│        3         Level 0: [3]                                  │
│       / \        Level 1: [9, 20]                              │
│      9  20       Level 2: [15, 7]                              │
│        /  \                                                    │
│       15   7     Output: [[3], [9,20], [15,7]]                 │
│                                                                │
│  BFS with Queue:                                               │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Step │ Queue              │ Level Output                  │ │
│  ├──────┼────────────────────┼───────────────────────────────┤ │
│  │  1   │ [3]                │ Process: [3]                  │ │
│  │  2   │ [9, 20]            │ Process: [9, 20]              │ │
│  │  3   │ [15, 7]            │ Process: [15, 7]              │ │
│  └───────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public List<List<Integer>> levelOrder(TreeNode root) {
    List<List<Integer>> result = new ArrayList<>();
    if (root == null) return result;

    Queue<TreeNode> queue = new LinkedList<>();
    queue.offer(root);

    while (!queue.isEmpty()) {
        int levelSize = queue.size();
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

## Problem 108: Binary Tree Zigzag Level Order Traversal

**LeetCode 103** 🔗 https://leetcode.com/problems/binary-tree-zigzag-level-order-traversal/

**ZIGZAG LEVEL ORDER**

```text
      3         Level 0 (→): [3]
     / \        Level 1 (←): [20, 9]
    9  20       Level 2 (→): [15, 7]
      /  \
     15   7     Output: [[3], [20,9], [15,7]]

Alternate direction each level
```

**Solution:**

```java
public List<List<Integer>> zigzagLevelOrder(TreeNode root) {
    List<List<Integer>> result = new ArrayList<>();
    if (root == null) return result;

    Queue<TreeNode> queue = new LinkedList<>();
    queue.offer(root);
    boolean leftToRight = true;

    while (!queue.isEmpty()) {
        int levelSize = queue.size();
        LinkedList<Integer> currentLevel = new LinkedList<>();

        for (int i = 0; i < levelSize; i++) {
            TreeNode node = queue.poll();

            if (leftToRight) {
                currentLevel.addLast(node.val);
            } else {
                currentLevel.addFirst(node.val);
            }

            if (node.left != null) queue.offer(node.left);
            if (node.right != null) queue.offer(node.right);
        }

        result.add(currentLevel);
        leftToRight = !leftToRight;
    }

    return result;
}
```

---

## Problem 109: 🔒 Binary Tree Vertical Order Traversal (LeetCode 314 - Premium)

**VERTICAL ORDER TRAVERSAL**

```text
Given a binary tree, return the vertical order traversal
of its nodes' values (column by column from left to right).
If nodes are in the same row and column, order left to right.

      3 (col 0)
     / \
    9   20      Column mapping:
   /   /  \     col -2: [4]
  4   15   7    col -1: [9]
     /          col  0: [3, 15]
    5           col  1: [20, 5]
                col  2: [7]

Output: [[4], [9], [3,15], [20,5], [7]]

Constraints:
- Number of nodes in range [0, 100]
- -100 <= Node.val <= 100
```

**Solution:**

```java
public List<List<Integer>> verticalOrder(TreeNode root) {
    List<List<Integer>> result = new ArrayList<>();
    if (root == null) return result;

    Map<Integer, List<Integer>> columnMap = new TreeMap<>();
    Queue<TreeNode> nodeQueue = new LinkedList<>();
    Queue<Integer> colQueue = new LinkedList<>();

    nodeQueue.offer(root);
    colQueue.offer(0);

    while (!nodeQueue.isEmpty()) {
        TreeNode node = nodeQueue.poll();
        int col = colQueue.poll();

        columnMap.computeIfAbsent(col, k -> new ArrayList<>()).add(node.val);

        if (node.left != null) {
            nodeQueue.offer(node.left);
            colQueue.offer(col - 1);
        }
        if (node.right != null) {
            nodeQueue.offer(node.right);
            colQueue.offer(col + 1);
        }
    }

    result.addAll(columnMap.values());
    return result;
}
```

---

[← SECTION 8: TREE PROBLEMS (BFS/DFS)](01_section_8_tree_problems_bfs_dfs.md) | [Chapter overview](../09_Trees.md) | [8.2 Tree Property Problems →](03_tree_property_problems.md)
