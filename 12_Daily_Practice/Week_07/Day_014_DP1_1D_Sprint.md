# Day 14 - Dynamic Programming I (1D DP) (Reasoning-First Notes)

## Daily Problem Set
1. LeetCode Premium: 256 - Paint House
2. LeetCode Medium: 322 - Coin Change
3. Codeforces: 455A - Boredom
4. Codeforces: 474D - Flowers

## Problem Links
- LC 256 (Premium): Locked on LeetCode (no public official statement page)
- LC 322: https://leetcode.com/problems/coin-change/
- CF 455A: https://codeforces.com/problemset/problem/455/A
- CF 474D: https://codeforces.com/problemset/problem/474/D

## Why This Day Matters
1D DP trains state design: what is the minimal memory needed to represent past decisions.

---

## Problem 1 - LC 256 (Premium): Paint House

### Problem Statement
`n` houses, 3 colors. Adjacent houses cannot share color. Minimize total cost.

### Why This DS/Algo
Local constraint depends only on previous house color -> DP over index and color.

### Approach A - Brute Force recursion (O(3^n))

### Approach B - Better (DP table) (O(n), O(n))

```java
static int paintBetter(int[][] c) {
    int n = c.length;
    int[][] dp = new int[n][3];
    for (int col = 0; col < 3; col++) dp[0][col] = c[0][col];

    for (int i = 1; i < n; i++) {
        dp[i][0] = c[i][0] + Math.min(dp[i - 1][1], dp[i - 1][2]);
        dp[i][1] = c[i][1] + Math.min(dp[i - 1][0], dp[i - 1][2]);
        dp[i][2] = c[i][2] + Math.min(dp[i - 1][0], dp[i - 1][1]);
    }
    return Math.min(dp[n - 1][0], Math.min(dp[n - 1][1], dp[n - 1][2]));
}
```

### Approach C - Optimal (Rolling variables) (O(n), O(1))

```java
static int paintOptimal(int[][] c) {
    int r = c[0][0], g = c[0][1], b = c[0][2];
    for (int i = 1; i < c.length; i++) {
        int nr = c[i][0] + Math.min(g, b);
        int ng = c[i][1] + Math.min(r, b);
        int nb = c[i][2] + Math.min(r, g);
        r = nr; g = ng; b = nb;
    }
    return Math.min(r, Math.min(g, b));
}
```

---

## Problem 2 - LC 322: Coin Change

### Problem Statement
Given coin denominations and amount, minimum coins needed to form amount or `-1`.

### Why This DS/Algo
Unbounded choice with optimal substructure: `dp[x] = 1 + min(dp[x - coin])`.

### Approach A - Brute Force recursion

### Approach B - Better (top-down memo) (O(amount * coins), O(amount))

### Approach C - Optimal (bottom-up DP) (O(amount * coins), O(amount))

```java
static int coinChangeOptimal(int[] coins, int amount) {
    int INF = amount + 1;
    int[] dp = new int[amount + 1];
    Arrays.fill(dp, INF);
    dp[0] = 0;

    for (int x = 1; x <= amount; x++) {
        for (int coin : coins) {
            if (x - coin >= 0) dp[x] = Math.min(dp[x], dp[x - coin] + 1);
        }
    }
    return dp[amount] == INF ? -1 : dp[amount];
}
```

### Interview Notes
Greedy fails for arbitrary coin systems, DP is required for correctness.

---

## Problem 3 - CF 455A: Boredom

### Problem Statement
Choose numbers to maximize points (`value * count`) but taking `x` forbids `x-1` and `x+1`.

### Why This DS/Algo
After frequency compression, this becomes House Robber on value line.

### Approach A - Brute Force subset choice on values

### Approach B - Better (DP array) (O(maxValue), O(maxValue))

```java
static long boredomBetter(int[] a) {
    int max = 0;
    for (int x : a) max = Math.max(max, x);

    long[] gain = new long[max + 1];
    for (int x : a) gain[x] += x;

    long[] dp = new long[max + 1];
    dp[1] = gain[1];
    for (int v = 2; v <= max; v++) {
        dp[v] = Math.max(dp[v - 1], dp[v - 2] + gain[v]);
    }
    return dp[max];
}
```

### Approach C - Optimal (rolling two vars) (O(maxValue), O(1))

```java
static long boredomOptimal(int[] a) {
    int max = 0;
    for (int x : a) max = Math.max(max, x);
    long[] gain = new long[max + 1];
    for (int x : a) gain[x] += x;

    long prev2 = 0, prev1 = gain[1];
    for (int v = 2; v <= max; v++) {
        long cur = Math.max(prev1, prev2 + gain[v]);
        prev2 = prev1;
        prev1 = cur;
    }
    return max == 0 ? 0 : prev1;
}
```

---

## Problem 4 - CF 474D: Flowers

### Problem Statement
Count ways to make total length `i` using red flowers length 1 and white group length `k`. Answer many range queries.

### Why This DS/Algo
- Recurrence: `dp[i] = dp[i-1] + dp[i-k]`.
- Multiple range queries require prefix sums over `dp`.

### Approach A - Brute per query recursion

### Approach B - Better (precompute dp once) (O(MAXN))

### Approach C - Optimal (dp + prefix for O(1) query) (O(MAXN + q))

```java
static final int MOD = 1_000_000_007;

static int[] flowersOptimal(int maxN, int k) {
    int[] dp = new int[maxN + 1];
    int[] pref = new int[maxN + 1];
    dp[0] = 1;

    for (int i = 1; i <= maxN; i++) {
        dp[i] = dp[i - 1];
        if (i >= k) dp[i] = (dp[i] + dp[i - k]) % MOD;
        pref[i] = (pref[i - 1] + dp[i]) % MOD;
    }
    return pref;
}

static int answerQuery(int[] pref, int a, int b) {
    int res = pref[b] - pref[a - 1];
    if (res < 0) res += MOD;
    return res;
}
```

### Pattern Takeaways
- DP + prefix sum is common for "many range queries on dp results".
- Compress the domain first (counts, max value) whenever possible.
