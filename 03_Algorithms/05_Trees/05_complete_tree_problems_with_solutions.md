# PART 14: Complete Tree Problems with Solutions

> **Navigation**: [← Advanced Tree Algorithms](04_advanced_tree_algorithms.md) | [Chapter overview](../05_Trees.md) | [Coderbyte & Interview Tree Challenges →](06_coderbyte_interview_tree_challenges.md)
> Page 5 of 6 in **TREES - Complete Guide**


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

[← Advanced Tree Algorithms](04_advanced_tree_algorithms.md) | [Chapter overview](../05_Trees.md) | [Coderbyte & Interview Tree Challenges →](06_coderbyte_interview_tree_challenges.md)
