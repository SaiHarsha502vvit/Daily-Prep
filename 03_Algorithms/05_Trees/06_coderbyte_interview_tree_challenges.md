# 🌳 Part 10: Coderbyte & Interview Tree Challenges

> **Navigation**: [← Complete Tree Problems with Solutions](05_complete_tree_problems_with_solutions.md) | [Chapter overview](../05_Trees.md)
> Page 6 of 6 in **TREES - Complete Guide**


## Challenge 1: Binary Tree LCA from Array Representation

```
Problem: Given a binary tree in heap-like array format (# = null),
         find the Lowest Common Ancestor of two node values.

Example:
Array: [12, 5, 9, 6, 2, 0, 8, #, #, 7, 4, #, #, #, #]

Tree:        12
            /  \
           5    9
          / \  / \
         6  2 0   8
           / \
          7   4

LCA(6, 4) = 5  (5 is ancestor of both 6 and 4)
LCA(6, 9) = 12 (only 12 is ancestor of both)

Key Insight: Build parent mapping from array indices.
             Parent of index i = (i-1)/2
```

```java
import java.util.*;

public class BinaryTreeLCA {

    public static int findLCA(String[] strArr) {
        // Parse tree array: "[12, 5, 9, 6, 2, 0, 8, #, #, 7, 4]"
        String treeStr = strArr[0].replace("[", "").replace("]", "").trim();
        String[] nodes = treeStr.split(",\\s*");

        int val1 = Integer.parseInt(strArr[1].trim());
        int val2 = Integer.parseInt(strArr[2].trim());

        // Build parent mapping: value -> parent value
        Map<Integer, Integer> parent = new HashMap<>();
        Map<Integer, Integer> indexToValue = new HashMap<>();

        for (int i = 0; i < nodes.length; i++) {
            String node = nodes[i].trim();
            if (!node.equals("#")) {
                int value = Integer.parseInt(node);
                indexToValue.put(i, value);

                // Parent index formula for heap-style array
                if (i > 0) {
                    int parentIdx = (i - 1) / 2;
                    if (indexToValue.containsKey(parentIdx)) {
                        parent.put(value, indexToValue.get(parentIdx));
                    }
                }
            }
        }

        // Collect all ancestors of val1
        Set<Integer> ancestors1 = new HashSet<>();
        Integer current = val1;
        while (current != null) {
            ancestors1.add(current);
            current = parent.get(current);
        }

        // Find first common ancestor from val2's path
        current = val2;
        while (current != null) {
            if (ancestors1.contains(current)) {
                return current;
            }
            current = parent.get(current);
        }

        return -1; // Should not reach if valid input
    }

    public static void main(String[] args) {
        // Test 1
        String[] test1 = {"[5, 2, 6, 1, #, 8, #]", "2", "6"};
        System.out.println(findLCA(test1)); // Output: 5

        // Test 2
        String[] test2 = {"[12, 5, 9, 6, 2, 0, 8, #, #, 7, 4, #, #, #, #]", "6", "4"};
        System.out.println(findLCA(test2)); // Output: 5

        // Test 3
        String[] test3 = {"[5, 2, 6, 1, #, 8, 12, #, #, #, #, 3, #]", "3", "12"};
        System.out.println(findLCA(test3)); // Output: 12
    }
}
```

---

## Challenge 2: LCA with TreeNode (Standard Interview Version)

```java
// Given actual TreeNode structure
class TreeNode {
    int val;
    TreeNode left, right;
    TreeNode(int val) { this.val = val; }
}

public class LCATreeNode {

    // Method 1: Recursive (Clean but uses call stack)
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

        // Otherwise return whichever side found something
        return left != null ? left : right;
    }

    // Method 2: Using Parent Pointers (Iterative)
    public TreeNode lcaWithParentMap(TreeNode root, TreeNode p, TreeNode q) {
        // Build parent map using BFS
        Map<TreeNode, TreeNode> parent = new HashMap<>();
        Queue<TreeNode> queue = new LinkedList<>();
        parent.put(root, null);
        queue.offer(root);

        // BFS until we find both p and q
        while (!parent.containsKey(p) || !parent.containsKey(q)) {
            TreeNode node = queue.poll();
            if (node.left != null) {
                parent.put(node.left, node);
                queue.offer(node.left);
            }
            if (node.right != null) {
                parent.put(node.right, node);
                queue.offer(node.right);
            }
        }

        // Collect ancestors of p
        Set<TreeNode> ancestors = new HashSet<>();
        while (p != null) {
            ancestors.add(p);
            p = parent.get(p);
        }

        // Find first ancestor of q that's also ancestor of p
        while (!ancestors.contains(q)) {
            q = parent.get(q);
        }

        return q;
    }

    // Method 3: For BST (Optimized)
    public TreeNode lcaBST(TreeNode root, TreeNode p, TreeNode q) {
        while (root != null) {
            if (p.val < root.val && q.val < root.val) {
                root = root.left;  // Both in left subtree
            } else if (p.val > root.val && q.val > root.val) {
                root = root.right; // Both in right subtree
            } else {
                return root; // Split point = LCA
            }
        }
        return null;
    }
}

// TIME COMPLEXITY:
// Method 1: O(n) - visit each node once
// Method 2: O(n) - BFS + ancestor traversal
// Method 3: O(h) - BST property, h = tree height
```

---

## Challenge 3: Tree from Array - Build and Query

```java
// Build tree from heap-style array and perform operations
public class TreeFromArray {

    public static TreeNode buildTree(String[] nodes) {
        if (nodes.length == 0 || nodes[0].equals("#")) return null;

        TreeNode root = new TreeNode(Integer.parseInt(nodes[0]));
        Queue<TreeNode> queue = new LinkedList<>();
        queue.offer(root);

        int i = 1;
        while (!queue.isEmpty() && i < nodes.length) {
            TreeNode current = queue.poll();

            // Left child
            if (i < nodes.length && !nodes[i].equals("#")) {
                current.left = new TreeNode(Integer.parseInt(nodes[i]));
                queue.offer(current.left);
            }
            i++;

            // Right child
            if (i < nodes.length && !nodes[i].equals("#")) {
                current.right = new TreeNode(Integer.parseInt(nodes[i]));
                queue.offer(current.right);
            }
            i++;
        }

        return root;
    }

    // Find node by value
    public static TreeNode findNode(TreeNode root, int val) {
        if (root == null) return null;
        if (root.val == val) return root;

        TreeNode left = findNode(root.left, val);
        if (left != null) return left;

        return findNode(root.right, val);
    }
}
```

---

## Challenge 4: Path Sum Between Two Nodes

```java
// Find sum of path between two nodes using LCA
public class PathSum {

    public int pathSum(TreeNode root, int node1, int node2) {
        // Find LCA
        TreeNode lca = lowestCommonAncestor(root, node1, node2);

        // Sum from LCA to node1 + Sum from LCA to node2
        return sumToNode(lca, node1, 0) + sumToNode(lca, node2, 0);
    }

    private int sumToNode(TreeNode root, int target, int sum) {
        if (root == null) return 0;
        if (root.val == target) return sum + root.val;

        int left = sumToNode(root.left, target, sum + root.val);
        if (left != 0) return left;

        return sumToNode(root.right, target, sum + root.val);
    }

    private TreeNode lowestCommonAncestor(TreeNode root, int p, int q) {
        if (root == null || root.val == p || root.val == q) return root;

        TreeNode left = lowestCommonAncestor(root.left, p, q);
        TreeNode right = lowestCommonAncestor(root.right, p, q);

        if (left != null && right != null) return root;
        return left != null ? left : right;
    }
}
```

---

## Challenge 5: Distance Between Two Nodes

```java
// Find number of edges between two nodes
public class NodeDistance {

    public int distance(TreeNode root, int node1, int node2) {
        TreeNode lca = lowestCommonAncestor(root, node1, node2);

        return distanceFromNode(lca, node1, 0) +
               distanceFromNode(lca, node2, 0);
    }

    private int distanceFromNode(TreeNode root, int target, int dist) {
        if (root == null) return -1;
        if (root.val == target) return dist;

        int left = distanceFromNode(root.left, target, dist + 1);
        if (left != -1) return left;

        return distanceFromNode(root.right, target, dist + 1);
    }

    private TreeNode lowestCommonAncestor(TreeNode root, int p, int q) {
        if (root == null || root.val == p || root.val == q) return root;
        TreeNode left = lowestCommonAncestor(root.left, p, q);
        TreeNode right = lowestCommonAncestor(root.right, p, q);
        if (left != null && right != null) return root;
        return left != null ? left : right;
    }
}
```

---

## Challenge 6: Serialize/Deserialize Binary Tree

```java
// Convert tree to string and back (common interview question)
public class TreeSerializer {

    // Serialize tree to string using preorder
    public String serialize(TreeNode root) {
        StringBuilder sb = new StringBuilder();
        serializeHelper(root, sb);
        return sb.toString();
    }

    private void serializeHelper(TreeNode node, StringBuilder sb) {
        if (node == null) {
            sb.append("#,");
            return;
        }
        sb.append(node.val).append(",");
        serializeHelper(node.left, sb);
        serializeHelper(node.right, sb);
    }

    // Deserialize string back to tree
    public TreeNode deserialize(String data) {
        Queue<String> nodes = new LinkedList<>(Arrays.asList(data.split(",")));
        return deserializeHelper(nodes);
    }

    private TreeNode deserializeHelper(Queue<String> nodes) {
        String val = nodes.poll();
        if (val.equals("#")) return null;

        TreeNode node = new TreeNode(Integer.parseInt(val));
        node.left = deserializeHelper(nodes);
        node.right = deserializeHelper(nodes);
        return node;
    }
}
```

---

## Tree Challenge Patterns Summary

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                    TREE PROBLEM RECOGNITION GUIDE                                │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  "Find common ancestor..."             → LCA algorithm                           │
│  "Tree given as array [1,2,3,#,4]..."  → Parent at (i-1)/2, children at 2i+1,2i+2│
│  "Distance between nodes..."           → LCA + distance from LCA to each node    │
│  "Path between nodes..."               → Find LCA, then paths from LCA           │
│  "Serialize tree..."                   → Preorder with null markers              │
│  "Validate BST..."                     → Inorder should be sorted                │
│                                                                                  │
│  TREE ARRAY INDEX FORMULAS (0-indexed):                                          │
│  • Parent of i:       (i - 1) / 2                                                │
│  • Left child of i:   2 * i + 1                                                  │
│  • Right child of i:  2 * i + 2                                                  │
│                                                                                  │
│  LCA APPROACHES:                                                                 │
│  • Recursive: O(n) time, O(h) space                                              │
│  • Parent map: O(n) time, O(n) space                                             │
│  • BST optimized: O(h) time, O(1) space                                          │
│  • Binary lifting: O(n log n) preprocess, O(log n) query                         │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

*Trees and graphs are everywhere - master them and unlock many problems!*

---

## PRACTICE PROBLEMS — Trees (Binary Tree, BST, Advanced)

### Binary Tree Fundamentals

| #   | Problem                      | Difficulty | Source  | Pattern                    |
| --- | ---------------------------- | ---------- | ------- | -------------------------- |
| 1   | Maximum Depth of Binary Tree | Easy       | LC 104  | Recursion — base pattern   |
| 2   | Invert Binary Tree           | Easy       | LC 226  | Swap left/right            |
| 3   | Same Tree                    | Easy       | LC 100  | Parallel recursion         |
| 4   | Symmetric Tree               | Easy       | LC 101  | Mirror check               |
| 5   | Diameter of Binary Tree      | Easy       | LC 543  | maxDepth + global variable |
| 6   | Balanced Binary Tree         | Easy       | LC 110  | Height comparison          |
| 7   | Subtree of Another Tree      | Easy       | LC 572  | isSameTree at each node    |
| 8   | Path Sum                     | Easy       | LC 112  | Target subtract            |
| 9   | Count Good Nodes             | Medium     | LC 1448 | Pass max so far            |
| 10  | Merge Two Binary Trees       | Easy       | LC 617  | Parallel build             |

### Binary Tree — Medium/Hard

| #   | Problem                                | Difficulty | Source | Pattern                     |
| --- | -------------------------------------- | ---------- | ------ | --------------------------- |
| 1   | Binary Tree Level Order Traversal      | Medium     | LC 102 | BFS + level size            |
| 2   | Binary Tree Right Side View            | Medium     | LC 199 | BFS → last of each level    |
| 3   | Flatten Binary Tree to LL              | Medium     | LC 114 | Morris-like rewire          |
| 4   | Construct Tree from Preorder + Inorder | Medium     | LC 105 | Recursive partitioning      |
| 5   | Path Sum III                           | Medium     | LC 437 | Prefix sum on paths         |
| 6   | Lowest Common Ancestor                 | Medium     | LC 236 | Post-order check both sides |
| 7   | Serialize and Deserialize Binary Tree  | Hard       | LC 297 | BFS/DFS encoding            |
| 8   | Binary Tree Maximum Path Sum           | Hard       | LC 124 | Post-order + global max     |
| 9   | Vertical Order Traversal               | Hard       | LC 987 | BFS + column tracking       |
| 10  | Populating Next Right Pointers         | Medium     | LC 116 | BFS level connection        |

### BST Problems

| #   | Problem                     | Difficulty | Source | Pattern                    |
| --- | --------------------------- | ---------- | ------ | -------------------------- |
| 1   | Search in a BST             | Easy       | LC 700 | Go left/right              |
| 2   | Validate BST                | Medium     | LC 98  | Inorder check or bounds    |
| 3   | Kth Smallest in BST         | Medium     | LC 230 | Inorder counting           |
| 4   | Delete Node in BST          | Medium     | LC 450 | Three cases                |
| 5   | Convert Sorted Array to BST | Easy       | LC 108 | Mid-point recursion        |
| 6   | LCA of BST                  | Medium     | LC 235 | Split point                |
| 7   | BST Iterator                | Medium     | LC 173 | Controlled inorder (stack) |
| 8   | Recover Binary Search Tree  | Medium     | LC 99  | Inorder find 2 swapped     |
| 9   | Trim a BST                  | Medium     | LC 669 | Recursive prune            |
| 10  | Range Sum of BST            | Easy       | LC 938 | Pruned DFS                 |

**Hidden Gems:**

| Problem                             | Source | Why It's Great                               |
| ----------------------------------- | ------ | -------------------------------------------- |
| All Nodes Distance K in Binary Tree | LC 863 | Convert tree to graph + BFS                  |
| Binary Tree Cameras                 | LC 968 | Greedy post-order (Hard, elegant)            |
| House Robber III                    | LC 337 | DP on tree — two states per node             |
| Sum of Distances in Tree            | LC 834 | Re-rooting technique (Hard, teaches re-root) |
| Check Completeness of Binary Tree   | LC 958 | BFS — null before value = incomplete         |
| Count Complete Tree Nodes           | LC 222 | O(log²n) using height comparison             |

---

## 📎 Reference Anchor

**OpenJDK `TreeMap` / `TreeSet` — Red-Black BST in production**
- `TreeMap`: [TreeMap.java](https://github.com/openjdk/jdk/blob/master/src/java.base/share/classes/java/util/TreeMap.java) — a Red-Black BST. **Invariant**: Every path from root to null leaf has the same number of Black nodes; no two consecutive Red nodes. Provides `floorKey()`, `ceilingKey()`, `subMap()` — all O(log n).
- `TreeMap.successor()` (private): used internally by iterators. Understanding it explains why `TreeMap` iteration is O(n) total even though each `next()` navigates the tree.
- **Local rewrite rule**: Never use recursive DFS for `TreeMap` traversal on a tree with depth > ~8000 — JVM default stack hits `StackOverflowError`. `TreeMap`'s own iterator is iterative (Morris/stack-based). For large trees, use `TreeMap.entrySet().iterator()` instead of your own DFS.
- **Constraint warning**: `TreeMap.get(key)` is O(log n) only if the comparator is O(1). A comparator that does string comparison on long strings is O(len_of_string × log n) total — can dominate for keys like UUIDs.

---

## When It Breaks -- Trees

### 1. Recursive DFS StackOverflow on Skewed Tree

**What breaks**: A degenerate BST (all elements inserted in sorted order) becomes a linked list of depth n. Recursive DFS causes `StackOverflowError` at n ~= 8000 (default JVM stack). This is the real-world case — most textbook BST code breaks on sorted inputs.
**Fix**: AVL/Red-Black tree (self-balancing) prevents degenerate depth. Or convert DFS to iterative with an explicit `ArrayDeque` stack.

### 2. Null Check Missing — NPE on Leaf Children

**What breaks**: `if (root.left.val == target)` throws NPE when `root.left` is null (a leaf node). Accessing `.val`, `.left`, `.right` without a null guard is the #1 tree bug.
**Fix**: Always check `root != null` before accessing any field. Better: `if (root == null) return;` as the first line of every recursive tree method.

### 3. BST Invariant Violation — Wrong Comparison in Insertion

**What breaks**: Using `<=` instead of `<` for left subtree: `if (val <= node.val) insertLeft(...)`. This makes duplicates go left, which violates the strict BST invariant that `left.val < root.val`. Some BST algorithms (e.g., rank/select) break with duplicates in wrong subtrees.
**Fix**: Define and document the invariant: does your BST allow duplicates? If yes, which side?

### 4. Modifying Tree During Iteration

**What breaks**: Iterating a tree while deleting nodes (e.g., pruning dead subtrees) without careful ordering. If you delete `node` and then try to access `node.parent`, it may be null/dangling.
**Fix**: Post-order traversal for deletion — process children before parent. For pruning, return the modified subtree: `node.left = prune(node.left); node.right = prune(node.right); return shouldDelete(node) ? null : node;`.

---

## Brute Force → Optimal: Tree Patterns

### Problem: Check if Two Trees are Identical

**Brute Force — O(n²) serialize and compare:**
Serialize both trees to strings, compare strings. Two serializations of the same tree are equal. O(n) to serialize but O(n) string comparison each time = O(n) per check, but with high constant factor.

**Optimal — O(n) structural recursion:**
```java
boolean isSame(TreeNode p, TreeNode q) {
    if (p == null && q == null) return true;
    if (p == null || q == null) return false;
    return p.val == q.val && isSame(p.left, q.left) && isSame(p.right, q.right);
}
```
Returns on first mismatch. Short-circuit evaluation skips remaining subtrees.

### Problem: Lowest Common Ancestor

**Brute Force — O(n) per query via path-to-root:**
Find path from root to p, path from root to q, find last common node. O(n) space + time per query.

**Optimal — O(n) single DFS:**
```java
TreeNode lca(TreeNode root, TreeNode p, TreeNode q) {
    if (root == null || root == p || root == q) return root;
    TreeNode left = lca(root.left, p, q);
    TreeNode right = lca(root.right, p, q);
    return left != null && right != null ? root : (left != null ? left : right);
}
```
**Why**: If p and q are in different subtrees, root IS the LCA. If both in same subtree, the recursive call returns the LCA directly.

---

## Proof Corner: Tree Height and Node Count

**Claim**: A binary tree with n nodes has height h satisfying ⌈log₂(n+1)⌉ − 1 ≤ h ≤ n−1.

**Lower bound** (complete binary tree is shortest): A complete binary tree of height h has 2^(h+1) − 1 nodes. So n ≤ 2^(h+1) − 1 → h ≥ log₂(n+1) − 1 → h ≥ ⌈log₂(n+1)⌉ − 1.

**Upper bound** (path graph is tallest): A path (linked list) with n nodes has height n−1.

**Leaves count in full binary tree**: A full binary tree (every node has 0 or 2 children) with n internal nodes has exactly n+1 leaves. *Proof by induction*: Base (n=0): 1 leaf. Step: Adding one internal node converts one leaf to an internal node and adds 2 new leaves: +1 internal, +1 leaf. Invariant: leaves = internal + 1. □

---

[← Complete Tree Problems with Solutions](05_complete_tree_problems_with_solutions.md) | [Chapter overview](../05_Trees.md)
