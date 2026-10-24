# 📌 Interval DP — Optimal Substructure on Ranges

> **Navigation**: [← Bitmask DP — Subset State Tracking](05_bitmask_dp_subset_state_tracking.md) | [Chapter overview](../04c_DP_Advanced.md) | [DP on Trees →](07_dp_on_trees.md)
> Page 6 of 7 in **Advanced DP Patterns**


```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ INTERVAL DP - THE PATTERN                                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ WHEN TO USE: Optimal solution for range [i,j] depends on smaller ranges         │
│                                                                                 │
│ CLASSIC PROBLEMS:                                                               │
│ • Matrix chain multiplication                                                   │
│ • Optimal BST                                                                   │
│ • Palindrome partitioning                                                       │
│ • Burst balloons                                                                │
│ • Stone game                                                                    │
│                                                                                 │
│                                                                                 │
│ TEMPLATE:                                                                       │
│ ───────────                                                                     │
```

```java
// dp[i][j] = optimal solution for interval [i, j]
// Process by increasing interval length!

int intervalDP(int[] arr) {
    int n = arr.length;
    int[][] dp = new int[n][n];

    // Base case: intervals of length 1
    for (int i = 0; i < n; i++) {
        dp[i][i] = /* base case value */;
    }

    // Process by increasing length
    for (int len = 2; len <= n; len++) {
        for (int i = 0; i + len - 1 < n; i++) {
            int j = i + len - 1;
            dp[i][j] = /* initialize (often infinity or -infinity) */;

            // Try all split points
            for (int k = i; k < j; k++) {
                dp[i][j] = Math.min(dp[i][j],
                    dp[i][k] + dp[k+1][j] + /* merge cost */);
            }
        }
    }

    return dp[0][n-1];
}
```

```
│ │
│ │
│ MATRIX CHAIN MULTIPLICATION: │
│ ──────────────────────────── │
```

```java
// dims[i-1] x dims[i] = dimensions of matrix i (0-indexed)
// Minimize scalar multiplications to compute M0 * M1 * ... * Mn-1
int matrixChain(int[] dims) {
    int n = dims.length - 1;  // n matrices
    int[][] dp = new int[n][n];

    // Base: single matrix, 0 multiplications
    // dp[i][i] = 0 (already initialized)

    for (int len = 2; len <= n; len++) {
        for (int i = 0; i + len - 1 < n; i++) {
            int j = i + len - 1;
            dp[i][j] = Integer.MAX_VALUE;

            for (int k = i; k < j; k++) {
                // Split at k: (M_i...M_k) * (M_k+1...M_j)
                int cost = dp[i][k] + dp[k+1][j]
                         + dims[i] * dims[k+1] * dims[j+1];
                dp[i][j] = Math.min(dp[i][j], cost);
            }
        }
    }

    return dp[0][n-1];
}
```

```
│ │
│ │
│ BURST BALLOONS (LeetCode 312): │
│ ────────────────────────────── │
```

```java
// Burst all balloons, maximize coins collected
// coins = nums[left] * nums[i] * nums[right]
int maxCoins(int[] nums) {
    int n = nums.length;
    int[] arr = new int[n + 2];
    arr[0] = arr[n + 1] = 1;  // Add boundary 1s
    for (int i = 0; i < n; i++) arr[i + 1] = nums[i];

    int[][] dp = new int[n + 2][n + 2];
    // dp[i][j] = max coins from bursting all balloons in (i, j) exclusive

    for (int len = 1; len <= n; len++) {
        for (int left = 0; left + len + 1 <= n + 1; left++) {
            int right = left + len + 1;

            // k is the LAST balloon to burst in (left, right)
            for (int k = left + 1; k < right; k++) {
                dp[left][right] = Math.max(dp[left][right],
                    dp[left][k] + dp[k][right] + arr[left] * arr[k] * arr[right]);
            }
        }
    }

    return dp[0][n + 1];
}
// Key insight: Think of k as LAST to burst, not first!
```

```
│ │
│ │
│ MINIMUM COST TO CUT A STICK (LeetCode 1547): │
│ ──────────────────────────────────────────── │
```

```java
// Given stick of length n, cuts[] = positions to cut at.
// Cost of a cut = length of the stick piece being cut.
// Find minimum total cost to make all cuts.
int minCost(int n, int[] cuts) {
    Arrays.sort(cuts);
    int m = cuts.length;

    // Add boundaries: [0, cuts[0], cuts[1], ..., cuts[m-1], n]
    int[] c = new int[m + 2];
    c[0] = 0; c[m + 1] = n;
    for (int i = 0; i < m; i++) c[i + 1] = cuts[i];

    // dp[i][j] = min cost to cut stick from c[i] to c[j]
    int[][] dp = new int[m + 2][m + 2];

    for (int len = 2; len <= m + 1; len++) {      // Gap between endpoints
        for (int i = 0; i + len <= m + 1; i++) {
            int j = i + len;
            dp[i][j] = Integer.MAX_VALUE;

            for (int k = i + 1; k < j; k++) {     // Try each cut point
                dp[i][j] = Math.min(dp[i][j],
                    dp[i][k] + dp[k][j] + (c[j] - c[i]));
                //                       ^^^^^^^^^^^^^^^^^
                //                       cost = stick length being cut
            }
        }
    }

    return dp[0][m + 1];
}
// This is the DUAL of Burst Balloons — same template, different cost!
```

```
│ │
│ │
│ INTERVAL DP DECISION GUIDE: │
│ ──────────────────────────── │
│ │
│ ╔══════════════════════════╦═══════════════════════════════════════╗ │
│ ║ Signal                   ║ It's Interval DP                     ║ │
│ ╠══════════════════════════╬═══════════════════════════════════════╣ │
│ ║ "Merge" or "split"      ║ Matrix chain, cut a stick             ║ │
│ ║ "Remove from ends"      ║ Stone game, burst balloons            ║ │
│ ║ "Optimal over range"    ║ Any [i..j] optimization               ║ │
│ ║ Answer for [i,j] uses   ║ O(n³) — try all split points k       ║ │
│ ║   answers for sub-ranges ║                                      ║ │
│ ╠══════════════════════════╬═══════════════════════════════════════╣ │
│ ║ Trick: "LAST to remove" ║ Burst Balloons thinking               ║ │
│ ║ Trick: add boundaries   ║ +1 at ends (balloons, cut a stick)    ║ │
│ ║ Loop order              ║ ALWAYS by increasing length            ║ │
│ ╚══════════════════════════╩═══════════════════════════════════════╝ │
│ │
│ COMMON MISTAKE: Trying to process left-to-right instead of │
│ by increasing interval length. Interval DP MUST iterate by │
│ length so shorter intervals are solved before longer ones. │
│ │
│ 📝 CURATED PRACTICE: │
│ 1. Burst Balloons (LC 312) — https://leetcode.com/problems/burst-balloons/ │
│ 2. Min Cost to Cut Stick (LC 1547) — https://leetcode.com/problems/minimum-cost-to-cut-a-stick/ │
│ 3. Stone Game V (LC 1563) — https://leetcode.com/problems/stone-game-v/ │
│ 4. Minimum Score Triangulation (LC 1039) — https://leetcode.com/problems/minimum-score-triangulation-of-polygon/ │
│ 5. Palindrome Partitioning II (LC 132) — https://leetcode.com/problems/palindrome-partitioning-ii/ │
│ 6. Strange Printer (LC 664) — https://leetcode.com/problems/strange-printer/ │
│ 7. Remove Boxes (LC 546) — https://leetcode.com/problems/remove-boxes/ │
│ 8. Minimum Cost Tree From Leaf Values (LC 1130) — https://leetcode.com/problems/minimum-cost-tree-from-leaf-values/ │
│ │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

[← Bitmask DP — Subset State Tracking](05_bitmask_dp_subset_state_tracking.md) | [Chapter overview](../04c_DP_Advanced.md) | [DP on Trees →](07_dp_on_trees.md)
