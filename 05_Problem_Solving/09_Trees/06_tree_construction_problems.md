# 8.5 Tree Construction Problems

> **Navigation**: [← 8.4 Binary Search Tree (BST) Problems](05_binary_search_tree_bst_problems.md) | [Chapter overview](../09_Trees.md) | [8.6 HackerEarth & Codeforces Tree Problems →](07_hackerearth_codeforces_tree_problems.md)
> Page 6 of 7 in **Trees**


**Pattern:** Divide-and-conquer using traversal properties.
**Key insight:** Preorder's first element = root. Find that root in inorder → everything left = left subtree, everything right = right subtree. Recurse.
**Optimization:** Use a HashMap to store inorder indices for O(1) root lookup instead of O(n) scan.

## Problem 127: Construct Binary Tree from Preorder and Inorder

**LeetCode 105** 🔗 https://leetcode.com/problems/construct-binary-tree-from-preorder-and-inorder-traversal/

**BUILD TREE FROM PREORDER & INORDER**

```text
preorder = [3, 9, 20, 15, 7]  (Root, Left, Right)
inorder  = [9, 3, 15, 20, 7]  (Left, Root, Right)

Step 1: First preorder element (3) is ROOT
Step 2: Find 3 in inorder → splits left [9] and right [15,20,7]
Step 3: Recursively build subtrees

      3
     / \
    9  20
      /  \
     15   7
```

**Solution:**

```java
private int preorderIndex;
private Map<Integer, Integer> inorderIndexMap;

public TreeNode buildTree(int[] preorder, int[] inorder) {
    preorderIndex = 0;
    inorderIndexMap = new HashMap<>();

    // Store inorder indices for O(1) lookup
    for (int i = 0; i < inorder.length; i++) {
        inorderIndexMap.put(inorder[i], i);
    }

    return build(preorder, 0, inorder.length - 1);
}

private TreeNode build(int[] preorder, int left, int right) {
    if (left > right) return null;

    // Root is next element in preorder
    int rootVal = preorder[preorderIndex++];
    TreeNode root = new TreeNode(rootVal);

    // Find root position in inorder
    int inorderIndex = inorderIndexMap.get(rootVal);

    // Build left subtree (elements before root in inorder)
    root.left = build(preorder, left, inorderIndex - 1);
    // Build right subtree (elements after root in inorder)
    root.right = build(preorder, inorderIndex + 1, right);

    return root;
}
```

---

## Problem 128: Construct Binary Tree from Inorder and Postorder

**LeetCode 106** 🔗 https://leetcode.com/problems/construct-binary-tree-from-inorder-and-postorder-traversal/

**BUILD TREE FROM INORDER & POSTORDER**

```text
inorder   = [9, 3, 15, 20, 7]  (Left, Root, Right)
postorder = [9, 15, 7, 20, 3]  (Left, Right, Root)

LAST postorder element (3) is ROOT
Process postorder from END (right to left)
Build RIGHT subtree before LEFT (reverse of preorder)

      3
     / \
    9  20
      /  \
     15   7
```

**Solution:**

```java
private int postorderIndex;
private Map<Integer, Integer> inorderIndexMap;

public TreeNode buildTree(int[] inorder, int[] postorder) {
    postorderIndex = postorder.length - 1;
    inorderIndexMap = new HashMap<>();

    for (int i = 0; i < inorder.length; i++) {
        inorderIndexMap.put(inorder[i], i);
    }

    return build(postorder, 0, inorder.length - 1);
}

private TreeNode build(int[] postorder, int left, int right) {
    if (left > right) return null;

    int rootVal = postorder[postorderIndex--];
    TreeNode root = new TreeNode(rootVal);

    int inorderIndex = inorderIndexMap.get(rootVal);

    // Build RIGHT first (postorder processes right before left)
    root.right = build(postorder, inorderIndex + 1, right);
    root.left = build(postorder, left, inorderIndex - 1);

    return root;
}
```

---

## Problem 129: Serialize and Deserialize Binary Tree

**LeetCode 297** 🔗 https://leetcode.com/problems/serialize-and-deserialize-binary-tree/

**SERIALIZE AND DESERIALIZE BINARY TREE**

```text
     1
    / \         Serialize: "1,2,null,null,3,4,null,null,5"
   2   3        (Preorder with null markers)
      / \
     4   5      Deserialize: Rebuild from string

Using preorder traversal with null markers works because
null positions indicate exact tree structure
```

**Solution:**

```java
public class Codec {

    // Serialize: Preorder traversal with null markers
    public String serialize(TreeNode root) {
        StringBuilder sb = new StringBuilder();
        serializeHelper(root, sb);
        return sb.toString();
    }

    private void serializeHelper(TreeNode node, StringBuilder sb) {
        if (node == null) {
            sb.append("null,");
            return;
        }

        sb.append(node.val).append(",");
        serializeHelper(node.left, sb);
        serializeHelper(node.right, sb);
    }

    // Deserialize: Rebuild from preorder string
    public TreeNode deserialize(String data) {
        Queue<String> queue = new LinkedList<>(Arrays.asList(data.split(",")));
        return deserializeHelper(queue);
    }

    private TreeNode deserializeHelper(Queue<String> queue) {
        String val = queue.poll();

        if (val.equals("null")) return null;

        TreeNode node = new TreeNode(Integer.parseInt(val));
        node.left = deserializeHelper(queue);
        node.right = deserializeHelper(queue);

        return node;
    }
}
```

---

[← 8.4 Binary Search Tree (BST) Problems](05_binary_search_tree_bst_problems.md) | [Chapter overview](../09_Trees.md) | [8.6 HackerEarth & Codeforces Tree Problems →](07_hackerearth_codeforces_tree_problems.md)
