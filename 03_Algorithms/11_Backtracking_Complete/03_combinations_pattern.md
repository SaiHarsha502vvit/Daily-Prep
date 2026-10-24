# Combinations Pattern <a name="combinations-pattern"></a>

> **Navigation**: [← Permutations Pattern](02_permutations_pattern.md) | [Chapter overview](../11_Backtracking_Complete.md) | [Classic Problems →](04_classic_problems.md)
> Page 3 of 4 in **Backtracking Complete Guide**


## Problem: Combinations (LeetCode 77)

```
Input: n = 4, k = 2
Output: [[1,2], [1,3], [1,4], [2,3], [2,4], [3,4]]

C(n,k) = n! / (k!(n-k)!)
```

## Solution

```java
public List<List<Integer>> combine(int n, int k) {
    List<List<Integer>> result = new ArrayList<>();
    backtrack(n, k, 1, new ArrayList<>(), result);
    return result;
}

private void backtrack(int n, int k, int start,
                       List<Integer> current,
                       List<List<Integer>> result) {
    // Base case: combination complete
    if (current.size() == k) {
        result.add(new ArrayList<>(current));
        return;
    }

    // Pruning: need (k - current.size()) more elements
    // Can't exceed: i <= n - (k - current.size()) + 1
    for (int i = start; i <= n - (k - current.size()) + 1; i++) {
        current.add(i);
        backtrack(n, k, i + 1, current, result);
        current.remove(current.size() - 1);
    }
}
```

## Combination Sum (LeetCode 39)

```java
/*
Find all combinations that sum to target (can reuse elements)
Input: candidates = [2,3,6,7], target = 7
Output: [[2,2,3], [7]]
*/

public List<List<Integer>> combinationSum(int[] candidates, int target) {
    List<List<Integer>> result = new ArrayList<>();
    backtrack(candidates, target, 0, new ArrayList<>(), result);
    return result;
}

private void backtrack(int[] candidates, int remaining, int start,
                       List<Integer> current, List<List<Integer>> result) {
    if (remaining == 0) {
        result.add(new ArrayList<>(current));
        return;
    }
    if (remaining < 0) return;  // Pruning

    for (int i = start; i < candidates.length; i++) {
        current.add(candidates[i]);
        // i (not i+1) because we can reuse same element
        backtrack(candidates, remaining - candidates[i], i, current, result);
        current.remove(current.size() - 1);
    }
}
```

## Combination Sum II - No Reuse (LeetCode 40)

```java
/*
Each number used at most once, no duplicate combinations
Input: candidates = [10,1,2,7,6,1,5], target = 8
Output: [[1,1,6], [1,2,5], [1,7], [2,6]]
*/

public List<List<Integer>> combinationSum2(int[] candidates, int target) {
    List<List<Integer>> result = new ArrayList<>();
    Arrays.sort(candidates);  // Sort for duplicate handling
    backtrack(candidates, target, 0, new ArrayList<>(), result);
    return result;
}

private void backtrack(int[] candidates, int remaining, int start,
                       List<Integer> current, List<List<Integer>> result) {
    if (remaining == 0) {
        result.add(new ArrayList<>(current));
        return;
    }

    for (int i = start; i < candidates.length; i++) {
        // Pruning: remaining elements too large
        if (candidates[i] > remaining) break;

        // Skip duplicates at same level
        if (i > start && candidates[i] == candidates[i-1]) continue;

        current.add(candidates[i]);
        // i + 1 because each element used once
        backtrack(candidates, remaining - candidates[i], i + 1, current, result);
        current.remove(current.size() - 1);
    }
}
```

## Combination Sum III (LeetCode 216)

```java
/*
Find k numbers from 1-9 that sum to n, each used once
*/

public List<List<Integer>> combinationSum3(int k, int n) {
    List<List<Integer>> result = new ArrayList<>();
    backtrack(k, n, 1, new ArrayList<>(), result);
    return result;
}

private void backtrack(int k, int remaining, int start,
                       List<Integer> current, List<List<Integer>> result) {
    if (current.size() == k && remaining == 0) {
        result.add(new ArrayList<>(current));
        return;
    }
    if (current.size() >= k || remaining < 0) return;

    for (int i = start; i <= 9; i++) {
        current.add(i);
        backtrack(k, remaining - i, i + 1, current, result);
        current.remove(current.size() - 1);
    }
}
```

---

[← Permutations Pattern](02_permutations_pattern.md) | [Chapter overview](../11_Backtracking_Complete.md) | [Classic Problems →](04_classic_problems.md)
