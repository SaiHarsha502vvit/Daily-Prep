# 🔁 9. Recursion & Backtracking

> **Navigation**: [← 8. Bfs/dfs](06_bfs_dfs.md) | [Chapter overview](../02_Code_Templates.md) | [10. Dynamic Programming →](08_dynamic_programming.md)
> Page 7 of 8 in **Code Templates — Pattern Guide**


## Visual Concept

```
                  BACKTRACKING VISUALIZATION
──────────────────────────────────────────────────

Problem: Generate all subsets of [1, 2, 3]

Decision tree (include or exclude each element):

                          []
                         /  \
                 include 1   exclude 1
                       /       \
                    [1]        []
                   /   \      /   \
                 +2    -2   +2    -2
                /       \   /       \
             [1,2]     [1] [2]      []
            /    \     / \  / \    / \
          +3    -3  +3 -3 +3 -3 +3 -3
         /        \
    [1,2,3]    [1,2]  [1,3] [1] [2,3] [2] [3] []

Leaf nodes = all 8 subsets!

BACKTRACKING PATTERN:
┌────────────────────────────────────────────────────────────────────┐
│ 1. CHOOSE: Make a choice (add element to current path)             │
│ 2. EXPLORE: Recurse with this choice                               │
│ 3. UNCHOOSE: Remove the choice (backtrack) to try other options    │
└────────────────────────────────────────────────────────────────────┘
```

## Template: Generate All Subsets

```java
/**
 * Generate all subsets (power set)
 * Time: O(2^N * N), Space: O(N) for recursion
 */
public List<List<Integer>> subsets(int[] nums) {
    List<List<Integer>> result = new ArrayList<>();
    backtrack(nums, 0, new ArrayList<>(), result);
    return result;
}

private void backtrack(int[] nums, int start, List<Integer> current, List<List<Integer>> result) {
    // Add current subset to result
    result.add(new ArrayList<>(current));  // Make a copy!

    // Try adding each remaining element
    for (int i = start; i < nums.length; i++) {
        // CHOOSE
        current.add(nums[i]);

        // EXPLORE
        backtrack(nums, i + 1, current, result);

        // UNCHOOSE (backtrack)
        current.remove(current.size() - 1);
    }
}
```

## Template: Generate Permutations

```java
/**
 * Generate all permutations
 * Time: O(N! * N), Space: O(N)
 */
public List<List<Integer>> permute(int[] nums) {
    List<List<Integer>> result = new ArrayList<>();
    boolean[] used = new boolean[nums.length];
    backtrack(nums, new ArrayList<>(), used, result);
    return result;
}

private void backtrack(int[] nums, List<Integer> current, boolean[] used, List<List<Integer>> result) {
    // Base case: permutation complete
    if (current.size() == nums.length) {
        result.add(new ArrayList<>(current));
        return;
    }

    // Try each unused number
    for (int i = 0; i < nums.length; i++) {
        if (used[i]) continue;  // Skip if already used

        // CHOOSE
        used[i] = true;
        current.add(nums[i]);

        // EXPLORE
        backtrack(nums, current, used, result);

        // UNCHOOSE
        current.remove(current.size() - 1);
        used[i] = false;
    }
}
```

---

🔬 **Section Challenge — 🔁 9. Recursion & Backtracking**

**Challenge 1 (Reasoning):** Every recursive algorithm can be converted to iterative. What data structure replaces the call stack?

<details><summary>Answer</summary>

An explicit `Stack<State>` where State holds what the stack frame would hold (current node, remaining work, partial results). DFS → explicit stack. Factorial → accumulator variable (tail recursion → loop). Tree traversal → stack with nodes + 'visited' flag. When to use recursion vs iteration: recursion = cleaner code when tree/graph depth is bounded. Iteration = necessary when depth is unbounded (stack overflow risk) or when performance is critical.

</details>

**Challenge 2 (Bug Hunt):**

```java
void fib(int n) { return n<=1 ? n : fib(n-1) + fib(n-2); }
fib(50) // takes forever
```

Why and what are the 3 fixes?

<details><summary>Answer</summary>

Exponential time O(2^N) — `fib(n-1)` and `fib(n-2)` each recursively recompute the same subproblems billions of times. Fix 1: Memoization — `Map<Integer,Long> memo`, return early if computed. O(N) time, O(N) space. Fix 2: Bottom-up DP — array `dp[i] = dp[i-1] + dp[i-2]`. O(N) time, O(N) space. Fix 3: O(1) space — just track last two values with two variables. O(N) time, O(1) space.

</details>

---

[← 8. Bfs/dfs](06_bfs_dfs.md) | [Chapter overview](../02_Code_Templates.md) | [10. Dynamic Programming →](08_dynamic_programming.md)
