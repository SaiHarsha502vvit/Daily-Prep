# Permutations Pattern <a name="permutations-pattern"></a>

> **Navigation**: [← COMPLETE UNDERSTANDING — The WHY Before the…](01_complete_understanding_the_why_before_the.md) | [Chapter overview](../11_Backtracking_Complete.md) | [Combinations Pattern →](03_combinations_pattern.md)
> Page 2 of 4 in **Backtracking Complete Guide**


## Problem: Permutations (LeetCode 46)

```
Input: [1, 2, 3]
Output: [[1,2,3], [1,3,2], [2,1,3], [2,3,1], [3,1,2], [3,2,1]]

n! permutations (3! = 6)
```

## Solution: Using Visited Array

```java
public List<List<Integer>> permute(int[] nums) {
    List<List<Integer>> result = new ArrayList<>();
    boolean[] visited = new boolean[nums.length];
    backtrack(nums, visited, new ArrayList<>(), result);
    return result;
}

private void backtrack(int[] nums, boolean[] visited,
                       List<Integer> current,
                       List<List<Integer>> result) {
    // Base case: permutation complete
    if (current.size() == nums.length) {
        result.add(new ArrayList<>(current));
        return;
    }

    // Try ALL elements (not from start!)
    for (int i = 0; i < nums.length; i++) {
        if (visited[i]) continue;  // Skip used elements

        visited[i] = true;         // Mark as used
        current.add(nums[i]);
        backtrack(nums, visited, current, result);
        current.remove(current.size() - 1);
        visited[i] = false;        // Unmark
    }
}
```

## Solution: Using Swap (Space Optimized)

```java
public List<List<Integer>> permute(int[] nums) {
    List<List<Integer>> result = new ArrayList<>();
    backtrack(nums, 0, result);
    return result;
}

private void backtrack(int[] nums, int start, List<List<Integer>> result) {
    if (start == nums.length) {
        // Convert array to list
        List<Integer> perm = new ArrayList<>();
        for (int num : nums) perm.add(num);
        result.add(perm);
        return;
    }

    for (int i = start; i < nums.length; i++) {
        swap(nums, start, i);            // Choose
        backtrack(nums, start + 1, result);  // Explore
        swap(nums, start, i);            // Unchoose
    }
}

private void swap(int[] nums, int i, int j) {
    int temp = nums[i];
    nums[i] = nums[j];
    nums[j] = temp;
}
```

## Visual: Swap Method

**Initial: [1, 2, 3], start = 0**

**Level 0: Fix position 0**

- swap(0,0): [1, 2, 3]
- Level 1: Fix position 1
  - swap(1,1): [1, 2, 3]
    - Level 2: Fix position 2
      - swap(2,2): [1, 2, 3] → Add [1,2,3]
  - swap(1,2): [1, 3, 2]
    - Level 2: [1, 3, 2] → Add [1,3,2]
    - swap(1,2) back: [1, 2, 3]
- swap(0,1): [2, 1, 3]
- Level 1: ...

**→ Add [2,1,3], [2,3,1]**

- swap(0,2): [3, 2, 1]
  - Level 1: ...

**→ Add [3,2,1], [3,1,2]**

## Permutations II - With Duplicates (LeetCode 47)

```java
/*
Input: [1, 1, 2]
Output: [[1,1,2], [1,2,1], [2,1,1]]  (3 unique, not 6)
*/

public List<List<Integer>> permuteUnique(int[] nums) {
    List<List<Integer>> result = new ArrayList<>();
    Arrays.sort(nums);  // Sort to group duplicates
    boolean[] visited = new boolean[nums.length];
    backtrack(nums, visited, new ArrayList<>(), result);
    return result;
}

private void backtrack(int[] nums, boolean[] visited,
                       List<Integer> current,
                       List<List<Integer>> result) {
    if (current.size() == nums.length) {
        result.add(new ArrayList<>(current));
        return;
    }

    for (int i = 0; i < nums.length; i++) {
        if (visited[i]) continue;

        // KEY: Skip duplicate if previous same element not used
        if (i > 0 && nums[i] == nums[i-1] && !visited[i-1]) continue;

        visited[i] = true;
        current.add(nums[i]);
        backtrack(nums, visited, current, result);
        current.remove(current.size() - 1);
        visited[i] = false;
    }
}

/*
Why !visited[i-1]?
- If we have [1a, 1b, 2] and want to pick 1 for first position
- We should only pick 1a (the first 1)
- If 1a is already used (!visited[i-1] is false), we can use 1b
- If 1a is NOT used (!visited[i-1] is true), skip 1b
- This ensures duplicates are used in order
*/
```

---

[← COMPLETE UNDERSTANDING — The WHY Before the…](01_complete_understanding_the_why_before_the.md) | [Chapter overview](../11_Backtracking_Complete.md) | [Combinations Pattern →](03_combinations_pattern.md)
