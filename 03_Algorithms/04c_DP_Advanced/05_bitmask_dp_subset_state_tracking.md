# ⚡ Bitmask DP — Subset State Tracking

> **Navigation**: [← Complete DP Problem Solutions](04_complete_dp_problem_solutions.md) | [Chapter overview](../04c_DP_Advanced.md) | [Interval DP — Optimal Substructure on Ranges →](06_interval_dp_optimal_substructure_on_ranges.md)
> Page 5 of 7 in **Advanced DP Patterns**


## Bitmask DP: complete guide

> [!TIP]
> **When to use:** small `n` (≤ 20) where you need to track which elements are "used".

### Bitmask operations

| Operation | Code | Example |
| --- | --- | --- |
| Check if bit `i` is set | `(mask >> i) & 1` | `mask = 5`: bits 0 and 2 are set |
| Set bit `i` | `mask \| (1 << i)` | `5 \| 2 = 7` (set bit 1) |
| Clear bit `i` | `mask & ~(1 << i)` | `7 & ~2 = 5` (clear bit 1) |
| Toggle bit `i` | `mask ^ (1 << i)` | `5 ^ 4 = 1` (toggle bit 2) |
| Count set bits | `Integer.bitCount(mask)` | `bitCount(5) = 2` |
| Lowest set bit | `mask & (-mask)` | `12 & (-12) = 4` |
| Clear lowest set bit | `mask & (mask - 1)` | `12 & 11 = 8` |
| Check if power of 2 | `(mask & (mask - 1)) == 0` | `isPow2(8) = true` (for `mask > 0`) |
| Iterate all subsets of `mask` | see the loop below | |

### Traveling salesman problem (TSP)

```java
// dp[mask][i] = min cost to visit cities in mask, ending at city i
// Time: O(2^n * n^2), Space: O(2^n * n)
int tsp(int[][] dist) {
    int n = dist.length;
    int[][] dp = new int[1 << n][n];

    // Initialize with infinity
    for (int[] row : dp) Arrays.fill(row, Integer.MAX_VALUE / 2);

    // Base: start at city 0
    dp[1][0] = 0;  // mask=1 means only city 0 visited

    // Process masks in increasing order of bits set
    for (int mask = 1; mask < (1 << n); mask++) {
        for (int last = 0; last < n; last++) {
            if ((mask & (1 << last)) == 0) continue;  // last must be in mask

            // Try all possible previous cities
            int prevMask = mask ^ (1 << last);  // Remove last from mask
            for (int prev = 0; prev < n; prev++) {
                if ((prevMask & (1 << prev)) == 0) continue;
                dp[mask][last] = Math.min(dp[mask][last],
                                         dp[prevMask][prev] + dist[prev][last]);
            }
        }
    }

    // Find minimum: visit all cities and return to 0
    int fullMask = (1 << n) - 1;
    int ans = Integer.MAX_VALUE;
    for (int last = 1; last < n; last++) {
        ans = Math.min(ans, dp[fullMask][last] + dist[last][0]);
    }
    return ans;
}
```

### Iterating over all subsets of a mask

```java
// Iterate all subsets of mask (including empty and mask itself)
for (int subset = mask; subset > 0; subset = (subset - 1) & mask) {
    // Process subset
}
// Don't forget to handle subset = 0 separately if needed

// Example: mask = 5 (binary 101)
// Subsets: 5 (101), 4 (100), 1 (001), 0 (000)
// Loop generates: 5 → 4 → 1 → (stops, handle 0 separately)
```

### Assignment problem (bitmask alternative to the Hungarian algorithm)

```java
// Assign n workers to n tasks, minimize total cost
// dp[mask] = min cost when tasks in mask are assigned
int assignmentProblem(int[][] cost) {
    int n = cost.length;
    int[] dp = new int[1 << n];
    Arrays.fill(dp, Integer.MAX_VALUE / 2);
    dp[0] = 0;

    for (int mask = 0; mask < (1 << n); mask++) {
        int worker = Integer.bitCount(mask);  // Current worker
        if (worker >= n) continue;

        for (int task = 0; task < n; task++) {
            if ((mask & (1 << task)) != 0) continue;  // Task already assigned
            int newMask = mask | (1 << task);
            dp[newMask] = Math.min(dp[newMask], dp[mask] + cost[worker][task]);
        }
    }

    return dp[(1 << n) - 1];
}
```

---

[← Complete DP Problem Solutions](04_complete_dp_problem_solutions.md) | [Chapter overview](../04c_DP_Advanced.md) | [Interval DP — Optimal Substructure on Ranges →](06_interval_dp_optimal_substructure_on_ranges.md)
