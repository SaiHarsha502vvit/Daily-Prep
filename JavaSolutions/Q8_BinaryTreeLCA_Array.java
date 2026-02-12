import java.util.*;

/**
 * Q8: Binary Tree LCA from Array (Coderbyte Challenge)
 * 
 * Problem: Given a binary tree in heap-like array format (# = null),
 * find the Lowest Common Ancestor of two node values.
 * 
 * Example:
 * Array: [12, 5, 9, 6, 2, 0, 8, #, #, 7, 4]
 * 
 * Tree: 12
 * / \
 * 5 9
 * / \ / \
 * 6 2 0 8
 * / \
 * 7 4
 * 
 * LCA(6, 4) = 5 (5 is ancestor of both 6 and 4)
 * 
 * Algorithm: Build parent mapping, collect ancestors of one node,
 * walk up from other node until finding common ancestor
 * Time: O(n) where n is number of nodes
 * Space: O(n) for parent map and ancestor set
 */
public class Q8_BinaryTreeLCA_Array {

    /**
     * Find LCA from array representation
     * Input: ["[12, 5, 9, 6, 2, 0, 8, #, #, 7, 4]", "6", "4"]
     */
    public static int findLCA(String[] strArr) {
        // Step 1: Parse tree array
        String treeStr = strArr[0].replace("[", "").replace("]", "").trim();
        String[] nodes = treeStr.split(",\\s*");

        int val1 = Integer.parseInt(strArr[1].trim());
        int val2 = Integer.parseInt(strArr[2].trim());

        // Step 2: Build parent mapping using heap index formula
        // For 0-indexed array: parent of index i = (i-1)/2
        Map<Integer, Integer> parent = new HashMap<>(); // value -> parent value
        Map<Integer, Integer> indexToValue = new HashMap<>();

        for (int i = 0; i < nodes.length; i++) {
            String node = nodes[i].trim();
            if (!node.equals("#")) {
                int value = Integer.parseInt(node);
                indexToValue.put(i, value);

                // Calculate parent
                if (i > 0) {
                    int parentIdx = (i - 1) / 2;
                    if (indexToValue.containsKey(parentIdx)) {
                        parent.put(value, indexToValue.get(parentIdx));
                    }
                }
            }
        }

        // Step 3: Collect all ancestors of val1
        Set<Integer> ancestors1 = new HashSet<>();
        Integer current = val1;
        while (current != null) {
            ancestors1.add(current);
            current = parent.get(current);
        }

        // Step 4: Walk up from val2, find first common ancestor
        current = val2;
        while (current != null) {
            if (ancestors1.contains(current)) {
                return current; // Found LCA!
            }
            current = parent.get(current);
        }

        return -1; // Should not reach if valid input
    }

    /**
     * LCA with TreeNode class (standard interview version)
     */
    static class TreeNode {
        int val;
        TreeNode left, right;

        TreeNode(int val) {
            this.val = val;
        }
    }

    // Method 1: Recursive (most elegant)
    public static TreeNode lcaRecursive(TreeNode root, TreeNode p, TreeNode q) {
        if (root == null || root == p || root == q) {
            return root;
        }

        TreeNode left = lcaRecursive(root.left, p, q);
        TreeNode right = lcaRecursive(root.right, p, q);

        // If both sides found something, current root is LCA
        if (left != null && right != null) {
            return root;
        }

        // Return whichever side found something
        return left != null ? left : right;
    }

    // Method 2: Using parent pointers (iterative, useful for multiple queries)
    public static TreeNode lcaWithParentMap(TreeNode root, TreeNode p, TreeNode q) {
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

        // Find first ancestor of q in ancestors set
        while (!ancestors.contains(q)) {
            q = parent.get(q);
        }

        return q;
    }

    // Method 3: BST-specific optimization (O(h) time)
    public static TreeNode lcaBST(TreeNode root, TreeNode p, TreeNode q) {
        while (root != null) {
            if (p.val < root.val && q.val < root.val) {
                root = root.left; // Both in left subtree
            } else if (p.val > root.val && q.val > root.val) {
                root = root.right; // Both in right subtree
            } else {
                return root; // Split point = LCA
            }
        }
        return null;
    }

    /**
     * Build tree from heap-style array
     */
    public static TreeNode buildTree(String[] nodes) {
        if (nodes.length == 0 || nodes[0].equals("#"))
            return null;

        TreeNode root = new TreeNode(Integer.parseInt(nodes[0].trim()));
        Queue<TreeNode> queue = new LinkedList<>();
        queue.offer(root);

        int i = 1;
        while (!queue.isEmpty() && i < nodes.length) {
            TreeNode current = queue.poll();

            // Left child
            if (i < nodes.length && !nodes[i].trim().equals("#")) {
                current.left = new TreeNode(Integer.parseInt(nodes[i].trim()));
                queue.offer(current.left);
            }
            i++;

            // Right child
            if (i < nodes.length && !nodes[i].trim().equals("#")) {
                current.right = new TreeNode(Integer.parseInt(nodes[i].trim()));
                queue.offer(current.right);
            }
            i++;
        }

        return root;
    }

    /**
     * Find node by value
     */
    public static TreeNode findNode(TreeNode root, int val) {
        if (root == null)
            return null;
        if (root.val == val)
            return root;

        TreeNode left = findNode(root.left, val);
        if (left != null)
            return left;

        return findNode(root.right, val);
    }

    public static void main(String[] args) {
        System.out.println("=== Array-based LCA (Coderbyte style) ===");

        // Test Case 1
        String[] test1 = { "[5, 2, 6, 1, #, 8, #]", "2", "6" };
        System.out.println("Test 1 - LCA(2, 6): " + findLCA(test1)); // Expected: 5

        // Test Case 2
        String[] test2 = { "[12, 5, 9, 6, 2, 0, 8, #, #, 7, 4, #, #, #, #]", "6", "4" };
        System.out.println("Test 2 - LCA(6, 4): " + findLCA(test2)); // Expected: 5

        // Test Case 3
        String[] test3 = { "[5, 2, 6, 1, #, 8, 12, #, #, #, #, 3, #]", "3", "12" };
        System.out.println("Test 3 - LCA(3, 12): " + findLCA(test3)); // Expected: 12

        // Test Case 4: One node is ancestor of the other
        String[] test4 = { "[3, 5, 1, 6, 2, 0, 8, #, #, 7, 4]", "5", "4" };
        System.out.println("Test 4 - LCA(5, 4): " + findLCA(test4)); // Expected: 5

        System.out.println("\n=== TreeNode-based LCA (standard interview) ===");

        // Build tree and test TreeNode methods
        String[] treeArray = { "3", "5", "1", "6", "2", "0", "8", "#", "#", "7", "4" };
        TreeNode root = buildTree(treeArray);

        TreeNode node5 = findNode(root, 5);
        TreeNode node1 = findNode(root, 1);
        TreeNode node6 = findNode(root, 6);
        TreeNode node4 = findNode(root, 4);

        TreeNode lca = lcaRecursive(root, node5, node1);
        System.out.println("Recursive LCA(5, 1): " + (lca != null ? lca.val : "null")); // Expected: 3

        lca = lcaRecursive(root, node6, node4);
        System.out.println("Recursive LCA(6, 4): " + (lca != null ? lca.val : "null")); // Expected: 5

        lca = lcaWithParentMap(root, node5, node4);
        System.out.println("Parent Map LCA(5, 4): " + (lca != null ? lca.val : "null")); // Expected: 5
    }
}

/*
 * KEY PATTERNS TO REMEMBER:
 * 
 * 1. HEAP ARRAY INDEX FORMULAS (0-indexed):
 * - Parent of i: (i - 1) / 2
 * - Left child of i: 2 * i + 1
 * - Right child of i: 2 * i + 2
 * 
 * 2. LCA ALGORITHM CHOICES:
 * - Recursive: O(n) time, O(h) space - most elegant
 * - Parent map: O(n) time, O(n) space - good for multiple queries
 * - BST optimized: O(h) time, O(1) space - only for BST
 * - Binary lifting: O(n log n) preprocess, O(log n) query - many queries
 * 
 * 3. RECURSIVE LCA INTUITION:
 * - If root is null or equals p or q, return root
 * - Search both subtrees
 * - If both return non-null, current node is LCA (split point)
 * - Otherwise, return whichever subtree found something
 * 
 * 4. ANCESTOR SET APPROACH:
 * - Collect all ancestors of node1 in a set
 * - Walk up from node2, first match is LCA
 * - Works with any tree structure
 * 
 * 5. EDGE CASES:
 * - One node is ancestor of the other
 * - Both nodes are the same
 * - Root is one of the nodes
 * - Nodes don't exist (validate input)
 */
