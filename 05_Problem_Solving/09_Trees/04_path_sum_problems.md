# 8.3 Path & Sum Problems

> **Navigation**: [← 8.2 Tree Property Problems](03_tree_property_problems.md) | [Chapter overview](../09_Trees.md) | [8.4 Binary Search Tree (BST) Problems →](05_binary_search_tree_bst_problems.md)
> Page 4 of 7 in **Trees**


**Pattern:** Top-down state passing — carry a running sum/path from root downward.
**Template:** `void dfs(node, remainingSum) { if leaf and sum==0: found! dfs(left, sum-val); dfs(right, sum-val); }`
**Key insight:** Pass the TARGET minus current value down. At a leaf, check if target reached 0.
**Hardest problem here:** #119 Max Path Sum — uses BOTH top-down and bottom-up. Global variable tracks the best "arch" path.

## Problem 116: Path Sum

**LeetCode 112** 🔗 https://leetcode.com/problems/path-sum/

**PATH SUM - Root to leaf path with target sum**

```text
targetSum = 22

       5
      / \
     4   8         Path: 5→4→11→2 = 22 ✓
    /   / \
   11  13  4
  /  \      \
 7    2      1

⚠️ Must reach a LEAF node (no children)
```

**Solution:**

```java
public boolean hasPathSum(TreeNode root, int targetSum) {
    if (root == null) return false;

    // Reached a leaf
    if (root.left == null && root.right == null) {
        return root.val == targetSum;
    }

    // Continue to children with reduced sum
    int remaining = targetSum - root.val;
    return hasPathSum(root.left, remaining) ||
           hasPathSum(root.right, remaining);
}
```

---

## Problem 117: Path Sum II

**LeetCode 113** 🔗 https://leetcode.com/problems/path-sum-ii/

**PATH SUM II - Find ALL paths with target sum**

```text
targetSum = 22

       5
      / \
     4   8
    /   / \
   11  13  4
  /  \    / \
 7    2  5   1

Output: [[5,4,11,2], [5,8,4,5]]
```

**Solution:**

```java
public List<List<Integer>> pathSum(TreeNode root, int targetSum) {
    List<List<Integer>> result = new ArrayList<>();
    backtrack(root, targetSum, new ArrayList<>(), result);
    return result;
}

private void backtrack(TreeNode node, int remaining,
                       List<Integer> path, List<List<Integer>> result) {
    if (node == null) return;

    path.add(node.val);

    // Found valid path to leaf
    if (node.left == null && node.right == null && node.val == remaining) {
        result.add(new ArrayList<>(path));
    } else {
        backtrack(node.left, remaining - node.val, path, result);
        backtrack(node.right, remaining - node.val, path, result);
    }

    // Backtrack
    path.remove(path.size() - 1);
}
```

---

## Problem 118: 🔒 Path Sum III (LeetCode 437)

💡 **Approach:** Prefix sum on a tree! Same idea as "Subarray Sum Equals K" but on tree paths.
Keep a HashMap of `prefix_sum → count` as you traverse down.
At each node: `count += map.get(currentSum - target)`.
**Critical:** BACKTRACK the map when returning up (unlike array version).
**Time:** O(n) | **Space:** O(h)

**LeetCode 437** 🔗 https://leetcode.com/problems/path-sum-iii/

**PATH SUM III - Path doesn't need to start at root or end — at leaf, but must go downwards**

```text
targetSum = 8

      10
     /  \
    5   -3
   / \    \
  3   2   11
 / \   \
3  -2   1

Paths that sum to 8:
1. 5→3 = 8
2. 5→2→1 = 8
3. -3→11 = 8
Output: 3

Use Prefix Sum technique with HashMap!
```

**Solution:**

```java
public int pathSum(TreeNode root, int targetSum) {
    Map<Long, Integer> prefixSumCount = new HashMap<>();
    prefixSumCount.put(0L, 1);  // Empty path

    return dfs(root, 0, targetSum, prefixSumCount);
}

private int dfs(TreeNode node, long currentSum, int target,
                Map<Long, Integer> prefixSumCount) {
    if (node == null) return 0;

    currentSum += node.val;

    // Check if (currentSum - target) exists as a previous prefix sum
    int count = prefixSumCount.getOrDefault(currentSum - target, 0);

    // Add current prefix sum to map
    prefixSumCount.merge(currentSum, 1, Integer::sum);

    // Recurse
    count += dfs(node.left, currentSum, target, prefixSumCount);
    count += dfs(node.right, currentSum, target, prefixSumCount);

    // Backtrack - remove current prefix sum
    prefixSumCount.merge(currentSum, -1, Integer::sum);

    return count;
}
```

---

## Problem 119: Binary Tree Maximum Path Sum

💡 **Approach:** This is the HARDEST tree problem. Uses bottom-up return + global tracking.
At each node: return the best single-arm path upward (node + max(left, right)).
But also check if using BOTH arms (left + node + right) beats the global max.
**Key trick:** `Math.max(gain, 0)` — ignore negative subtrees entirely.
**Time:** O(n) | **Space:** O(h)

**LeetCode 124** 🔗 https://leetcode.com/problems/binary-tree-maximum-path-sum/

**MAXIMUM PATH SUM - Path can start and end at any node**

```text
    -10
    /  \
   9   20
      /  \
     15   7

Max path: 15→20→7 = 42

At each node, we can:
1. Include node + left path
2. Include node + right path
3. Include node + both paths (forms arch)
4. Just the node itself

⚠️ Path that goes through root can't extend further up
```

**Solution:**

```java
private int maxSum;

public int maxPathSum(TreeNode root) {
    maxSum = Integer.MIN_VALUE;
    maxGain(root);
    return maxSum;
}

private int maxGain(TreeNode node) {
    if (node == null) return 0;

    // Max sum of left/right paths (ignore negative paths)
    int leftGain = Math.max(maxGain(node.left), 0);
    int rightGain = Math.max(maxGain(node.right), 0);

    // Path through current node (arch shape)
    int pathThroughNode = node.val + leftGain + rightGain;
    maxSum = Math.max(maxSum, pathThroughNode);

    // Return max path starting from this node going down one side
    return node.val + Math.max(leftGain, rightGain);
}
```

---

## Problem 120: Diameter of Binary Tree

**LeetCode 543** 🔗 https://leetcode.com/problems/diameter-of-binary-tree/

**DIAMETER - Longest path between any two nodes (in edges)**

```text
        1
       / \
      2   3
     / \
    4   5

Longest path: 4→2→1→3 or 5→2→1→3 = 3 edges
Diameter = 3

Note: Path may NOT pass through root!
        1
       /
      2        Diameter = 4→2→5→6→7 = 4
     / \
    4   5
       / \
      6   7
```

**Solution:**

```java
private int diameter;

public int diameterOfBinaryTree(TreeNode root) {
    diameter = 0;
    depth(root);
    return diameter;
}

private int depth(TreeNode node) {
    if (node == null) return 0;

    int leftDepth = depth(node.left);
    int rightDepth = depth(node.right);

    // Diameter through this node = left depth + right depth
    diameter = Math.max(diameter, leftDepth + rightDepth);

    return 1 + Math.max(leftDepth, rightDepth);
}
```

---

🔬 **Section Challenge — 8.3 Path & Sum Problems**

**Challenge 1 (Trace):** Trace the execution of `pathSum(root, 8)` (LC 437 — Path Sum III) on the tree `[10, 5, -3, 3, 2, null, 11, 3, -2, null, 1]` using the prefix-sum HashMap approach. At the node with value `5`, what is the state of `prefixSumCount` map, and what does `map.getOrDefault(currentSum - 8, 0)` evaluate to?

<details><summary>Answer</summary>

**Who executes?** A single DFS call stack frame on node `5`. **When?** After visiting root `10` (which adds `{0:1, 10:1}`). **What already exists?** `prefixSumCount = {0:1, 10:1}`, `currentSum = 15` (10+5).

Lookup: `currentSum - target = 15 - 8 = 7`. `map.getOrDefault(7, 0) = 0` (no prefix sum of 7 exists yet). So this node contributes 0 paths _ending here_. The trick is that `currentSum - target` represents "is there a previous prefix sum such that the segment between that prefix and this node sums to target?" Since we haven't seen prefix=7, no valid path ends at node 5.

</details>

**Challenge 2 (Debug):** In `maxPathSum` (LC 124), a developer writes the recursive function to return `node.val + Math.max(leftGain, rightGain)` — but they **forget** the `Math.max(gain, 0)` clamping for negative subtrees. On the tree `[-3, -1, -2]`, what wrong answer does their code produce vs. the correct answer?

<details><summary>Answer</summary>

**Without clamping:** `leftGain = -1`, `rightGain = -2`. `pathThroughNode = -3 + (-1) + (-2) = -6`. Return value is `-3 + max(-1, -2) = -4`. Global max is set to `-6` then `-4` then `-1` then `-2` — final wrong answer: `-1` (from a leaf). Actually the root call returns `-4`, corrupting the arch check.

**With clamping:** `leftGain = max(-1, 0) = 0`, `rightGain = max(-2, 0) = 0`. `pathThroughNode = -3 + 0 + 0 = -3`. Return is `-3 + 0 = -3`. Global max candidates: `-3`, `-1`, `-2` → correct answer: **`-1`** (just the best single node). The `Math.max(gain, 0)` is the insight: _a negative subtree contribution always makes the path worse — cut it off._

</details>

---

[← 8.2 Tree Property Problems](03_tree_property_problems.md) | [Chapter overview](../09_Trees.md) | [8.4 Binary Search Tree (BST) Problems →](05_binary_search_tree_bst_problems.md)
