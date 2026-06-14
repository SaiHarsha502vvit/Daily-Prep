# Day 15 - Dynamic Programming II (2D DP and Edit Distance) (Reasoning-First Notes)

## Daily Problem Set

1. LeetCode Premium: 265 - Paint House II
2. LeetCode Hard: 72 - Edit Distance
3. Codeforces: 431C - k-Tree
4. Codeforces: 189A - Cut Ribbon

## Problem Links

- LC 265 (Premium): Locked on LeetCode (no public official statement page)
- LC 72: https://leetcode.com/problems/edit-distance/
- CF 431C: https://codeforces.com/problemset/problem/431/C
- CF 189A: https://codeforces.com/problemset/problem/189/A

## Why This Day Matters

2D DP appears when state depends on two dimensions (position and budget, source and target prefixes, etc.).

---

## Problem 1 - LC 265 (Premium): Paint House II

### Problem Statement

There are `n` houses and `k` colors. Cost matrix `costs[i][c]` gives cost of painting house `i` color `c`. Adjacent houses cannot share the same color. Return minimum total cost.

### Why This DS/Algo

- State needs both index and chosen color.
- Transition needs minimum previous cost among all colors except current.

### Approach A - Brute Force recursion (O(k^n), O(n))

Try all color assignments with adjacency constraint.

### Approach B - Better (DP table naive transition) (O(n*k^2), O(n*k))

```java
static int paint2Better(int[][] costs) {
    int n = costs.length;
    if (n == 0) return 0;
    int k = costs[0].length;

    int[][] dp = new int[n][k];
    for (int c = 0; c < k; c++) dp[0][c] = costs[0][c];

    for (int i = 1; i < n; i++) {
        for (int c = 0; c < k; c++) {
            int bestPrev = Integer.MAX_VALUE;
            for (int pc = 0; pc < k; pc++) {
                if (pc == c) continue;
                bestPrev = Math.min(bestPrev, dp[i - 1][pc]);
            }
            dp[i][c] = costs[i][c] + bestPrev;
        }
    }

    int ans = Integer.MAX_VALUE;
    for (int c = 0; c < k; c++) ans = Math.min(ans, dp[n - 1][c]);
    return ans;
}
```

### Approach C - Optimal (track min1/min2 from previous row) (O(n\*k), O(k))

For each row, only two values matter from previous row: smallest and second smallest.

```java
static int paint2Optimal(int[][] costs) {
    int n = costs.length;
    if (n == 0) return 0;
    int k = costs[0].length;

    int[] prev = new int[k];
    System.arraycopy(costs[0], 0, prev, 0, k);

    for (int i = 1; i < n; i++) {
        int min1 = -1, min2 = -1;
        for (int c = 0; c < k; c++) {
            if (min1 == -1 || prev[c] < prev[min1]) {
                min2 = min1;
                min1 = c;
            } else if (min2 == -1 || prev[c] < prev[min2]) {
                min2 = c;
            }
        }

        int[] cur = new int[k];
        for (int c = 0; c < k; c++) {
            int bestPrev = (c == min1) ? prev[min2] : prev[min1];
            cur[c] = costs[i][c] + bestPrev;
        }
        prev = cur;
    }

    int ans = Integer.MAX_VALUE;
    for (int x : prev) ans = Math.min(ans, x);
    return ans;
}
```

### Interview Notes

- Mention the optimization from O(k^2) to O(k) transition by maintaining top-2 minima.

---

## Problem 2 - LC 72: Edit Distance

### Problem Statement

Given strings `word1` and `word2`, return minimum operations (insert, delete, replace) to convert `word1` into `word2`.

### Why This DS/Algo

- State depends on prefix of `word1` and prefix of `word2`.
- Classic 2D DP with three transitions.

### Approach A - Brute Force recursion (exponential)

### Approach B - Better (Memoized recursion) (O(mn), O(mn))

### Approach C - Optimal (Bottom-up DP) (O(mn), O(mn))

```java
static int editDistanceOptimal(String a, String b) {
    int m = a.length(), n = b.length();
    int[][] dp = new int[m + 1][n + 1];

    for (int i = 0; i <= m; i++) dp[i][0] = i;
    for (int j = 0; j <= n; j++) dp[0][j] = j;

    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (a.charAt(i - 1) == b.charAt(j - 1)) {
                dp[i][j] = dp[i - 1][j - 1];
            } else {
                int insert = dp[i][j - 1];
                int delete = dp[i - 1][j];
                int replace = dp[i - 1][j - 1];
                dp[i][j] = 1 + Math.min(insert, Math.min(delete, replace));
            }
        }
    }
    return dp[m][n];
}
```

### Space Optimization (optional)

Can optimize to O(n) using rolling rows.

---

## Problem 3 - CF 431C: k-Tree

### Problem Statement

Count ways to sum to `n` using numbers `1..k` such that at least one chosen number is `>= d`. Answer modulo `1e9+7`.

### Why This DS/Algo

Need two-state DP: whether we already used a large edge (`>= d`).

### Approach A - Brute Force recursion (exponential)

### Approach B - Better (2D DP by sum and flag) (O(n\*k), O(n))

```java
static final int MOD = 1_000_000_007;

static int kTreeBetter(int n, int k, int d) {
    int[][] dp = new int[n + 1][2];
    dp[0][0] = 1;

    for (int s = 0; s <= n; s++) {
        for (int x = 1; x <= k; x++) {
            if (s + x > n) break;
            if (x >= d) {
                dp[s + x][1] = (dp[s + x][1] + dp[s][0]) % MOD;
                dp[s + x][1] = (dp[s + x][1] + dp[s][1]) % MOD;
            } else {
                dp[s + x][0] = (dp[s + x][0] + dp[s][0]) % MOD;
                dp[s + x][1] = (dp[s + x][1] + dp[s][1]) % MOD;
            }
        }
    }
    return dp[n][1];
}
```

### Approach C - Optimal

This O(n\*k) DP is optimal for constraints and accepted in CF.

---

## Problem 4 - CF 189A: Cut Ribbon

### Problem Statement

Given ribbon length `n` and cut sizes `a,b,c`, maximize number of pieces.

### Why This DS/Algo

Unbounded cut choices and maximizing objective over total length -> 1D DP.

### Approach A - Brute Force recursion

### Approach B - Better (memoized recursion)

### Approach C - Optimal (Bottom-up DP) (O(n), O(n))

```java
static int cutRibbonOptimal(int n, int a, int b, int c) {
    int[] dp = new int[n + 1];
    Arrays.fill(dp, -1_000_000_000);
    dp[0] = 0;

    int[] cuts = {a, b, c};
    for (int i = 1; i <= n; i++) {
        for (int cut : cuts) {
            if (i - cut >= 0) dp[i] = Math.max(dp[i], dp[i - cut] + 1);
        }
    }
    return dp[n];
}
```

### Pattern Takeaways

- 2D DP state is about choosing the right dimensions, not blindly building big tables.
- Many CF counting DP problems require a boolean condition dimension (`usedBig`, `tight`, `parity`, etc.).
