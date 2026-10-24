# 11.1 Subsets & Combinations

> **Navigation**: [← Backtracking Template](01_backtracking_template.md) | [Chapter overview](../12_Backtracking.md) | [11.3 String Backtracking →](03_string_backtracking.md)
> Page 2 of 4 in **Backtracking**


> **Pattern:** "Start index" technique — pass `start` parameter to avoid picking previous elements.
> For duplicates: sort first, then skip `nums[i] == nums[i-1]` at same recursion level.

## Problem 176: Subsets

**LeetCode 78** 🔗 https://leetcode.com/problems/subsets/

```
┌────────────────────────────────────────────────────────────────┐
│  SUBSETS - All possible subsets (power set)                    │
├────────────────────────────────────────────────────────────────┤
│  nums = [1, 2, 3]                                              │
│                                                                │
│  Decision Tree:                                                │
│                    []                                          │
│           ┌────────┴────────┐                                  │
│        include 1         skip 1                                │
│          [1]               []                                  │
│       ┌───┴───┐        ┌───┴───┐                               │
│      [1,2]   [1]      [2]     []                               │
│     ┌─┴─┐   ┌─┴─┐   ┌─┴─┐   ┌─┴─┐                              │
│  [1,2,3][1,2][1,3][1][2,3][2] [3] []                           │
│                                                                │
│  Output: [[], [1], [2], [3], [1,2], [1,3], [2,3], [1,2,3]]     │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public List<List<Integer>> subsets(int[] nums) {
    List<List<Integer>> result = new ArrayList<>();
    backtrack(nums, 0, new ArrayList<>(), result);
    return result;
}

private void backtrack(int[] nums, int start, List<Integer> path,
                       List<List<Integer>> result) {
    result.add(new ArrayList<>(path));

    for (int i = start; i < nums.length; i++) {
        path.add(nums[i]);
        backtrack(nums, i + 1, path, result);
        path.remove(path.size() - 1);
    }
}
```

---

## Problem 177: Subsets II (With Duplicates)

**LeetCode 90** 🔗 https://leetcode.com/problems/subsets-ii/

```
┌────────────────────────────────────────────────────────────────┐
│  SUBSETS II - Skip duplicates                                  │
├────────────────────────────────────────────────────────────────┤
│  nums = [1, 2, 2]                                              │
│                                                                │
│  Without skip: [1,2], [1,2] would appear twice                 │
│  Key: Skip nums[i] if nums[i] == nums[i-1] at same level       │
│                                                                │
│  Output: [[], [1], [1,2], [1,2,2], [2], [2,2]]                 │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public List<List<Integer>> subsetsWithDup(int[] nums) {
    List<List<Integer>> result = new ArrayList<>();
    Arrays.sort(nums);  // Sort to handle duplicates
    backtrack(nums, 0, new ArrayList<>(), result);
    return result;
}

private void backtrack(int[] nums, int start, List<Integer> path,
                       List<List<Integer>> result) {
    result.add(new ArrayList<>(path));

    for (int i = start; i < nums.length; i++) {
        // Skip duplicates at same level
        if (i > start && nums[i] == nums[i-1]) continue;

        path.add(nums[i]);
        backtrack(nums, i + 1, path, result);
        path.remove(path.size() - 1);
    }
}
```

---

## Problem 178: Combination Sum

**LeetCode 39** 🔗 https://leetcode.com/problems/combination-sum/

```
┌────────────────────────────────────────────────────────────────┐
│  COMBINATION SUM - Unlimited use of each number                │
├────────────────────────────────────────────────────────────────┤
│  candidates = [2, 3, 6, 7], target = 7                         │
│                                                                │
│  Can reuse same number:                                        │
│  2 + 2 + 3 = 7 ✓                                               │
│  7 = 7 ✓                                                       │
│                                                                │
│  Output: [[2,2,3], [7]]                                        │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public List<List<Integer>> combinationSum(int[] candidates, int target) {
    List<List<Integer>> result = new ArrayList<>();
    backtrack(candidates, target, 0, new ArrayList<>(), result);
    return result;
}

private void backtrack(int[] candidates, int remain, int start,
                       List<Integer> path, List<List<Integer>> result) {
    if (remain == 0) {
        result.add(new ArrayList<>(path));
        return;
    }

    for (int i = start; i < candidates.length; i++) {
        if (candidates[i] > remain) continue;

        path.add(candidates[i]);
        backtrack(candidates, remain - candidates[i], i, path, result);
        path.remove(path.size() - 1);
    }
}
```

---

## Problem 179: Combination Sum II

**LeetCode 40** 🔗 https://leetcode.com/problems/combination-sum-ii/

```
┌────────────────────────────────────────────────────────────────┐
│  COMBINATION SUM II - Each number used once                    │
├────────────────────────────────────────────────────────────────┤
│  candidates = [10,1,2,7,6,1,5], target = 8                     │
│                                                                │
│  Output: [[1,1,6], [1,2,5], [1,7], [2,6]]                      │
│                                                                │
│  Key: Sort + skip duplicates at same level                     │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public List<List<Integer>> combinationSum2(int[] candidates, int target) {
    List<List<Integer>> result = new ArrayList<>();
    Arrays.sort(candidates);
    backtrack(candidates, target, 0, new ArrayList<>(), result);
    return result;
}

private void backtrack(int[] candidates, int remain, int start,
                       List<Integer> path, List<List<Integer>> result) {
    if (remain == 0) {
        result.add(new ArrayList<>(path));
        return;
    }

    for (int i = start; i < candidates.length; i++) {
        if (candidates[i] > remain) break;
        if (i > start && candidates[i] == candidates[i-1]) continue;

        path.add(candidates[i]);
        backtrack(candidates, remain - candidates[i], i + 1, path, result);
        path.remove(path.size() - 1);
    }
}
```

---

## Problem 180: Combinations

**LeetCode 77** 🔗 https://leetcode.com/problems/combinations/

```
┌────────────────────────────────────────────────────────────────┐
│  COMBINATIONS - Choose k from n                                │
├────────────────────────────────────────────────────────────────┤
│  n = 4, k = 2                                                  │
│  Choose 2 numbers from [1, 2, 3, 4]                            │
│                                                                │
│  Output: [[1,2], [1,3], [1,4], [2,3], [2,4], [3,4]]            │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public List<List<Integer>> combine(int n, int k) {
    List<List<Integer>> result = new ArrayList<>();
    backtrack(n, k, 1, new ArrayList<>(), result);
    return result;
}

private void backtrack(int n, int k, int start, List<Integer> path,
                       List<List<Integer>> result) {
    if (path.size() == k) {
        result.add(new ArrayList<>(path));
        return;
    }

    // Pruning: need k-path.size() more elements
    for (int i = start; i <= n - (k - path.size()) + 1; i++) {
        path.add(i);
        backtrack(n, k, i + 1, path, result);
        path.remove(path.size() - 1);
    }
}
```

---

> 🔬 **Section Challenge — 11.1 Subsets & Combinations**

**Challenge 1 (Reasoning):** In Combination Sum II (LC 40), the skip condition is `if (i > start && nums[i] == nums[i-1]) continue`. Why `i > start` and not `i > 0`? What breaks if you use `i > 0`?

<details><summary>Answer</summary>

With `i > 0`: for input `[1,1,6]` target 8, at the root level (start=0), i=1 sees `nums[1]==nums[0]` (both 1) and skips. Result: you can never pick TWO 1s, so `[1,1,6]` is missing from the output. With `i > start`: at root (start=0), i=1 is NOT `> start=0` in the skip-sense — wait, actually `1 > 0` is true but the condition is `i > start`, and start=0, so it would skip. No — the key: when we RECURSE after choosing `nums[0]=1`, the next call has `start=1`. Now at i=1, `i > start` is `1 > 1` = FALSE, so we DON'T skip — we CAN pick the second 1. `i > start` means "skip duplicates only among _siblings_ (same recursion level)," not across parent-child. `i > 0` would skip duplicates globally, preventing valid combinations like `[1,1,6]`.

</details>

## 11.2 Permutations

> **Pattern:** Use a `boolean[] used` array to track which elements are already placed.
> For duplicates: sort first, then skip `nums[i] == nums[i-1] && !used[i-1]`.
> **Key insight:** Unlike subsets, ORDER matters in permutations, so always start from index 0.

### Problem 181: Permutations

**LeetCode 46** 🔗 https://leetcode.com/problems/permutations/

```
┌────────────────────────────────────────────────────────────────┐
│  PERMUTATIONS - All arrangements                               │
├────────────────────────────────────────────────────────────────┤
│  nums = [1, 2, 3]                                              │
│                                                                │
│  Tree (swap approach):                                         │
│                [1,2,3]                                         │
│        ┌─────────┼─────────┐                                   │
│     [1,2,3]   [2,1,3]   [3,2,1]                                │
│      ┌─┴─┐     ┌─┴─┐     ┌─┴─┐                                 │
│  [1,2,3][1,3,2][2,1,3][2,3,1][3,2,1][3,1,2]                    │
│                                                                │
│  Output: [[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]     │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public List<List<Integer>> permute(int[] nums) {
    List<List<Integer>> result = new ArrayList<>();
    backtrack(nums, new ArrayList<>(), new boolean[nums.length], result);
    return result;
}

private void backtrack(int[] nums, List<Integer> path, boolean[] used,
                       List<List<Integer>> result) {
    if (path.size() == nums.length) {
        result.add(new ArrayList<>(path));
        return;
    }

    for (int i = 0; i < nums.length; i++) {
        if (used[i]) continue;

        used[i] = true;
        path.add(nums[i]);
        backtrack(nums, path, used, result);
        path.remove(path.size() - 1);
        used[i] = false;
    }
}
```

---

### Problem 182: Permutations II (With Duplicates)

**LeetCode 47** 🔗 https://leetcode.com/problems/permutations-ii/

```
┌────────────────────────────────────────────────────────────────┐
│  PERMUTATIONS II - Unique permutations                         │
├────────────────────────────────────────────────────────────────┤
│  nums = [1, 1, 2]                                              │
│                                                                │
│  Output: [[1,1,2], [1,2,1], [2,1,1]]                           │
│                                                                │
│  Key: Sort + skip if same as previous AND previous not used    │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public List<List<Integer>> permuteUnique(int[] nums) {
    List<List<Integer>> result = new ArrayList<>();
    Arrays.sort(nums);
    backtrack(nums, new ArrayList<>(), new boolean[nums.length], result);
    return result;
}

private void backtrack(int[] nums, List<Integer> path, boolean[] used,
                       List<List<Integer>> result) {
    if (path.size() == nums.length) {
        result.add(new ArrayList<>(path));
        return;
    }

    for (int i = 0; i < nums.length; i++) {
        if (used[i]) continue;
        // Skip duplicate: same as previous AND previous not used
        if (i > 0 && nums[i] == nums[i-1] && !used[i-1]) continue;

        used[i] = true;
        path.add(nums[i]);
        backtrack(nums, path, used, result);
        path.remove(path.size() - 1);
        used[i] = false;
    }
}
```

---

[← Backtracking Template](01_backtracking_template.md) | [Chapter overview](../12_Backtracking.md) | [11.3 String Backtracking →](03_string_backtracking.md)
