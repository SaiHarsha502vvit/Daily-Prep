# PART 10: Recursion to Iteration Conversion

> **Navigation**: [← University Proof Corner](01_university_proof_corner.md) | [Chapter overview](../03c_Recursion_Advanced.md) | [Classic Recursion Problems with Full… →](03_classic_recursion_problems_with_full_solutions.md)
> Page 2 of 5 in **Advanced Recursion Patterns**


## Technique 1: Using Explicit Stack

```java
// RECURSIVE factorial
public int factorialRecursive(int n) {
    if (n <= 1) return 1;
    return n * factorialRecursive(n - 1);
}

// ITERATIVE with stack (simulates call stack)
public int factorialStack(int n) {
    Deque<Integer> stack = new ArrayDeque<>();

    // Push all "calls" onto stack
    while (n > 1) {
        stack.push(n);
        n--;
    }

    // Process stack (return phase)
    int result = 1;
    while (!stack.isEmpty()) {
        result *= stack.pop();
    }
    return result;
}

// SIMPLE iterative (direct conversion)
public int factorialIterative(int n) {
    int result = 1;
    for (int i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
}
```

## Technique 2: Tree Traversal Conversion

```java
// RECURSIVE inorder
public void inorderRecursive(TreeNode root) {
    if (root == null) return;
    inorderRecursive(root.left);
    process(root);
    inorderRecursive(root.right);
}

// ITERATIVE inorder using stack
public void inorderIterative(TreeNode root) {
    Deque<TreeNode> stack = new ArrayDeque<>();
    TreeNode current = root;

    while (current != null || !stack.isEmpty()) {
        // Go left as far as possible
        while (current != null) {
            stack.push(current);
            current = current.left;
        }

        // Process current
        current = stack.pop();
        process(current);

        // Move to right subtree
        current = current.right;
    }
}

// MORRIS INORDER (O(1) space!)
public void morrisInorder(TreeNode root) {
    TreeNode current = root;

    while (current != null) {
        if (current.left == null) {
            process(current);
            current = current.right;
        } else {
            // Find inorder predecessor
            TreeNode predecessor = current.left;
            while (predecessor.right != null && predecessor.right != current) {
                predecessor = predecessor.right;
            }

            if (predecessor.right == null) {
                // Make current the right child of predecessor
                predecessor.right = current;
                current = current.left;
            } else {
                // Restore tree and process current
                predecessor.right = null;
                process(current);
                current = current.right;
            }
        }
    }
}
```

## Technique 3: Backtracking to Iteration

```java
// RECURSIVE subsets
public List<List<Integer>> subsetsRecursive(int[] nums) {
    List<List<Integer>> result = new ArrayList<>();
    backtrack(nums, 0, new ArrayList<>(), result);
    return result;
}

// ITERATIVE subsets using bit manipulation
public List<List<Integer>> subsetsIterative(int[] nums) {
    List<List<Integer>> result = new ArrayList<>();
    int n = nums.length;
    int totalSubsets = 1 << n;  // 2^n

    for (int mask = 0; mask < totalSubsets; mask++) {
        List<Integer> subset = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            if ((mask & (1 << i)) != 0) {
                subset.add(nums[i]);
            }
        }
        result.add(subset);
    }
    return result;
}

// ITERATIVE using cascading
public List<List<Integer>> subsetsCascade(int[] nums) {
    List<List<Integer>> result = new ArrayList<>();
    result.add(new ArrayList<>());  // Start with empty subset

    for (int num : nums) {
        int size = result.size();
        for (int i = 0; i < size; i++) {
            List<Integer> newSubset = new ArrayList<>(result.get(i));
            newSubset.add(num);
            result.add(newSubset);
        }
    }
    return result;
}
```

---

🔬 **Section Challenge — PART 10: Recursion to Iteration Conversion**

**Challenge 1 (Iterative Tree Traversal):** The section shows iterative inorder using an explicit stack. Inorder visits: Left → Node → Right. **What** changes in the stack-based algorithm to switch to PREORDER (Node → Left → Right)? **When** is Morris traversal O(1) space possible, and **who** pays the tree-modification cost?

<details><summary>Answer</summary>

**Preorder vs Inorder change:** In inorder, you push nodes going LEFT, then process on POP, then move RIGHT. For preorder: PROCESS the node BEFORE pushing left. Change: `process(current); stack.push(current.right); stack.push(current.left);` (push right first so left is processed first from stack). Or: set `current = current.left` after pushing right child. The key shift: inorder processes on POP, preorder processes on PUSH. **When Morris traversal works:** Always, for any binary tree traversal (inorder/preorder). Morris uses the tree's own `null` right-child pointers as temporary links back to ancestors (threaded binary tree). **Who pays the modification cost:** The TREE itself — Morris temporarily modifies right-child pointers, then restores them. This means: (1) Morris is NOT thread-safe (another thread reading the tree during traversal sees corrupt pointers). (2) The modification cost is O(N) total but constant per node. (3) After traversal, the tree is fully restored. Use Morris in single-threaded contexts where O(1) extra space is critical (embedded systems, memory-constrained environments).

</details>

---

[← University Proof Corner](01_university_proof_corner.md) | [Chapter overview](../03c_Recursion_Advanced.md) | [Classic Recursion Problems with Full… →](03_classic_recursion_problems_with_full_solutions.md)
