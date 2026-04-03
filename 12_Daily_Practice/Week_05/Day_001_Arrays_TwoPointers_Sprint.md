# Day 01 - Arrays and Two Pointers (MIT/KTH Style)

## Daily Problem Set
1. LeetCode Premium: 259 - 3Sum Smaller
2. LeetCode Medium: 11 - Container With Most Water
3. Codeforces: 489B - BerSU Ball
4. Codeforces: 580A - Kefa and First Steps

## Problem Links
- LC 259 (Premium): Locked on LeetCode (no public official statement page)
- LC 11: https://leetcode.com/problems/container-with-most-water/
- CF 489B: https://codeforces.com/problemset/problem/489/B
- CF 580A: https://codeforces.com/problemset/problem/580/A

## Problem 1 - LC 259 (Premium): 3Sum Smaller

### Problem Restatement
Given an integer array `nums` and integer `target`, count triplets `(i, j, k)` such that `0 <= i < j < k < n` and `nums[i] + nums[j] + nums[k] < target`.

### Constraints
- `0 <= n <= 3500`
- `-100 <= nums[i] <= 100`
- `-100 <= target <= 100`

### Sample
Input: `nums = [-2, 0, 1, 3], target = 2`  
Output: `2`

### Approach A - Brute Force (O(n^3), O(1))
Try all triplets.

```java
static int threeSumSmallerBrute(int[] nums, int target) {
    int n = nums.length, ans = 0;
    for (int i = 0; i < n - 2; i++) {
        for (int j = i + 1; j < n - 1; j++) {
            for (int k = j + 1; k < n; k++) {
                if (nums[i] + nums[j] + nums[k] < target) ans++;
            }
        }
    }
    return ans;
}
```

### Approach B - Better (Sort + Binary Search) (O(n^2 log n), O(1))
Fix `i` and `j`, binary search the largest valid `k`.

```java
static int threeSumSmallerBetter(int[] nums, int target) {
    Arrays.sort(nums);
    int n = nums.length, ans = 0;
    for (int i = 0; i < n - 2; i++) {
        for (int j = i + 1; j < n - 1; j++) {
            int limit = target - nums[i] - nums[j] - 1;
            int lo = j + 1, hi = n - 1, best = j;
            while (lo <= hi) {
                int mid = lo + (hi - lo) / 2;
                if (nums[mid] <= limit) {
                    best = mid;
                    lo = mid + 1;
                } else hi = mid - 1;
            }
            ans += best - j;
        }
    }
    return ans;
}
```

### Approach C - Optimal (Sort + Two Pointers) (O(n^2), O(1))
For fixed `i`, if `(i,left,right)` is valid then all pairs `(i,left,left+1..right)` are valid.

```java
static int threeSumSmallerOptimal(int[] nums, int target) {
    Arrays.sort(nums);
    int n = nums.length, ans = 0;
    for (int i = 0; i < n - 2; i++) {
        int l = i + 1, r = n - 1;
        while (l < r) {
            int sum = nums[i] + nums[l] + nums[r];
            if (sum < target) {
                ans += r - l;
                l++;
            } else {
                r--;
            }
        }
    }
    return ans;
}
```

### Dry Run Idea
For `[-2,0,1,3]` and `target=2`, fix `-2`, then `l=0`, `r=3` gives one valid band and contributes `2` directly.

### Interview Notes
- This is a counting version of 3Sum, not a dedup listing problem.
- Counting by ranges (`r-l`) is the key optimization.

---

## Problem 2 - LC 11: Container With Most Water

### Problem Restatement
Given heights, choose two indices `i < j`. Area is `min(h[i], h[j]) * (j - i)`. Return max area.

### Constraints
- `2 <= n <= 100000`
- `0 <= height[i] <= 10000`

### Sample
Input: `height = [1,8,6,2,5,4,8,3,7]`  
Output: `49`

### Approach A - Brute Force (O(n^2), O(1))

```java
static int maxAreaBrute(int[] h) {
    int ans = 0;
    for (int i = 0; i < h.length; i++) {
        for (int j = i + 1; j < h.length; j++) {
            ans = Math.max(ans, Math.min(h[i], h[j]) * (j - i));
        }
    }
    return ans;
}
```

### Approach B - Better (Sort by Height Desc) (O(n log n), O(n))
Process bars from tallest to shortest; track farthest processed indices.

```java
static int maxAreaBetter(int[] h) {
    int n = h.length;
    Integer[] idx = new Integer[n];
    for (int i = 0; i < n; i++) idx[i] = i;
    Arrays.sort(idx, (a, b) -> Integer.compare(h[b], h[a]));

    int minI = idx[0], maxI = idx[0], ans = 0;
    for (int id : idx) {
        int height = h[id];
        ans = Math.max(ans, height * Math.max(Math.abs(id - minI), Math.abs(id - maxI)));
        minI = Math.min(minI, id);
        maxI = Math.max(maxI, id);
    }
    return ans;
}
```

### Approach C - Optimal (Two Pointers) (O(n), O(1))
Move the shorter wall, because moving the taller wall cannot improve min-height bound.

```java
static int maxAreaOptimal(int[] h) {
    int l = 0, r = h.length - 1, ans = 0;
    while (l < r) {
        ans = Math.max(ans, Math.min(h[l], h[r]) * (r - l));
        if (h[l] <= h[r]) l++;
        else r--;
    }
    return ans;
}
```

### Edge Cases
- All zeros -> answer `0`.
- Strictly increasing/decreasing arrays still handled by pointer rule.

---

## Problem 3 - CF 489B: BerSU Ball

### Problem Restatement
Two arrays represent boy and girl skill levels. Pair one boy with one girl if skill difference is at most `1`. Maximize number of pairs.

### Constraints
- `1 <= n, m <= 100`
- `1 <= skill <= 100`

### Sample
Input: boys `[1,4,6]`, girls `[2,5,8]`  
Output: `2`

### Approach A - Brute Force (Backtracking) (Exponential)
Try pair/not-pair choices recursively.

```java
static int bersuBrute(int[] b, int[] g, boolean[] used, int i) {
    if (i == b.length) return 0;
    int best = bersuBrute(b, g, used, i + 1);
    for (int j = 0; j < g.length; j++) {
        if (!used[j] && Math.abs(b[i] - g[j]) <= 1) {
            used[j] = true;
            best = Math.max(best, 1 + bersuBrute(b, g, used, i + 1));
            used[j] = false;
        }
    }
    return best;
}
```

### Approach B - Better (DP on Sorted Arrays) (O(nm), O(nm))
Classic LCS-style DP with match condition.

```java
static int bersuBetter(int[] b, int[] g) {
    Arrays.sort(b);
    Arrays.sort(g);
    int n = b.length, m = g.length;
    int[][] dp = new int[n + 1][m + 1];
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= m; j++) {
            dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            if (Math.abs(b[i - 1] - g[j - 1]) <= 1) {
                dp[i][j] = Math.max(dp[i][j], 1 + dp[i - 1][j - 1]);
            }
        }
    }
    return dp[n][m];
}
```

### Approach C - Optimal (Greedy Two Pointers) (O(n log n + m log m), O(1))
Sort both and greedily match the smallest feasible pair.

```java
static int bersuOptimal(int[] b, int[] g) {
    Arrays.sort(b);
    Arrays.sort(g);
    int i = 0, j = 0, ans = 0;
    while (i < b.length && j < g.length) {
        if (Math.abs(b[i] - g[j]) <= 1) {
            ans++; i++; j++;
        } else if (b[i] < g[j]) i++;
        else j++;
    }
    return ans;
}
```

### Interview Notes
- This is greedy matching on sorted sequences.
- Proof idea: earliest feasible match never hurts future matches.

---

## Problem 4 - CF 580A: Kefa and First Steps

### Problem Restatement
Find the length of the longest contiguous non-decreasing segment.

### Constraints
- `1 <= n <= 100000`
- `1 <= a[i] <= 1e9`

### Sample
Input: `[1,2,2,1,3,4,4]`  
Output: `4` (`[1,3,4,4]`)

### Approach A - Brute Force (O(n^2), O(1))
Check all segment starts and extend while non-decreasing.

```java
static int kefaBrute(int[] a) {
    int n = a.length, ans = 1;
    for (int i = 0; i < n; i++) {
        int len = 1;
        for (int j = i + 1; j < n && a[j] >= a[j - 1]; j++) len++;
        ans = Math.max(ans, len);
    }
    return ans;
}
```

### Approach B - Better (DP Ending at i) (O(n), O(n))
`dp[i] = longest non-decreasing subarray ending at i`.

```java
static int kefaBetter(int[] a) {
    int n = a.length;
    int[] dp = new int[n];
    dp[0] = 1;
    int ans = 1;
    for (int i = 1; i < n; i++) {
        dp[i] = (a[i] >= a[i - 1]) ? dp[i - 1] + 1 : 1;
        ans = Math.max(ans, dp[i]);
    }
    return ans;
}
```

### Approach C - Optimal (Two Pointers) (O(n), O(1))
Keep current run length; reset when order breaks.

```java
static int kefaOptimal(int[] a) {
    int ans = 1, cur = 1;
    for (int i = 1; i < a.length; i++) {
        if (a[i] >= a[i - 1]) cur++;
        else cur = 1;
        ans = Math.max(ans, cur);
    }
    return ans;
}
```

### Pattern Takeaways
- Non-decreasing contiguous segment is a linear scan invariant.
- Keep this as a baseline pattern for later sliding window problems.
