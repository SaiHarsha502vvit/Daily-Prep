# PART 12: Complete DP Problem Solutions

> **Navigation**: [← Pattern 4: Tree DP](03_tree_dp.md) | [Chapter overview](../04c_DP_Advanced.md) | [Bitmask DP — Subset State Tracking →](05_bitmask_dp_subset_state_tracking.md)
> Page 4 of 7 in **Advanced DP Patterns**


## Problem 1: Longest Increasing Subsequence with Path

```java
public class LIS {
    public List<Integer> longestIncreasingSubsequence(int[] nums) {
        int n = nums.length;
        if (n == 0) return new ArrayList<>();

        int[] dp = new int[n];
        int[] parent = new int[n];
        Arrays.fill(dp, 1);
        Arrays.fill(parent, -1);

        int maxLen = 1, maxIdx = 0;

        for (int i = 1; i < n; i++) {
            for (int j = 0; j < i; j++) {
                if (nums[j] < nums[i] && dp[j] + 1 > dp[i]) {
                    dp[i] = dp[j] + 1;
                    parent[i] = j;
                }
            }
            if (dp[i] > maxLen) {
                maxLen = dp[i];
                maxIdx = i;
            }
        }

        // Reconstruct path
        List<Integer> path = new ArrayList<>();
        int idx = maxIdx;
        while (idx != -1) {
            path.add(nums[idx]);
            idx = parent[idx];
        }
        Collections.reverse(path);

        return path;
    }

    // O(n log n) solution using binary search
    public int lisOptimized(int[] nums) {
        List<Integer> tails = new ArrayList<>();

        for (int num : nums) {
            int pos = Collections.binarySearch(tails, num);
            if (pos < 0) pos = -(pos + 1);

            if (pos == tails.size()) {
                tails.add(num);
            } else {
                tails.set(pos, num);
            }
        }

        return tails.size();
    }
}
```

## Problem 2: Edit Distance with Operations

```java
public class EditDistance {
    public String[] minEditOperations(String word1, String word2) {
        int m = word1.length(), n = word2.length();
        int[][] dp = new int[m + 1][n + 1];

        // Base cases
        for (int i = 0; i <= m; i++) dp[i][0] = i;
        for (int j = 0; j <= n; j++) dp[0][j] = j;

        // Fill DP table
        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                if (word1.charAt(i - 1) == word2.charAt(j - 1)) {
                    dp[i][j] = dp[i - 1][j - 1];
                } else {
                    dp[i][j] = 1 + Math.min(dp[i - 1][j - 1],
                                   Math.min(dp[i - 1][j], dp[i][j - 1]));
                }
            }
        }

        // Backtrack to find operations
        List<String> ops = new ArrayList<>();
        int i = m, j = n;

        while (i > 0 || j > 0) {
            if (i > 0 && j > 0 &&
                word1.charAt(i - 1) == word2.charAt(j - 1)) {
                i--; j--;
            } else if (i > 0 && j > 0 &&
                       dp[i][j] == dp[i - 1][j - 1] + 1) {
                ops.add("Replace '" + word1.charAt(i - 1) +
                        "' with '" + word2.charAt(j - 1) + "' at position " + i);
                i--; j--;
            } else if (j > 0 && dp[i][j] == dp[i][j - 1] + 1) {
                ops.add("Insert '" + word2.charAt(j - 1) +
                        "' at position " + (i + 1));
                j--;
            } else {
                ops.add("Delete '" + word1.charAt(i - 1) +
                        "' at position " + i);
                i--;
            }
        }

        Collections.reverse(ops);
        return ops.toArray(new String[0]);
    }
}
```

## Problem 3: Word Break II (All Possible Sentences)

```java
public class WordBreak {
    public List<String> wordBreak(String s, List<String> wordDict) {
        Set<String> dict = new HashSet<>(wordDict);
        Map<Integer, List<String>> memo = new HashMap<>();
        return dfs(s, 0, dict, memo);
    }

    private List<String> dfs(String s, int start, Set<String> dict,
                             Map<Integer, List<String>> memo) {
        if (memo.containsKey(start)) {
            return memo.get(start);
        }

        List<String> result = new ArrayList<>();

        if (start == s.length()) {
            result.add("");
            return result;
        }

        for (int end = start + 1; end <= s.length(); end++) {
            String word = s.substring(start, end);
            if (dict.contains(word)) {
                List<String> sublist = dfs(s, end, dict, memo);
                for (String sub : sublist) {
                    result.add(word + (sub.isEmpty() ? "" : " " + sub));
                }
            }
        }

        memo.put(start, result);
        return result;
    }
}

// Example: s = "catsanddog", dict = ["cat", "cats", "and", "sand", "dog"]
// Output: ["cats and dog", "cat sand dog"]
```

## Problem 4: Palindrome Partitioning with Minimum Cuts

```java
public class PalindromePartition {
    public int minCut(String s) {
        int n = s.length();

        // isPalin[i][j] = true if s[i..j] is palindrome
        boolean[][] isPalin = new boolean[n][n];
        for (int i = n - 1; i >= 0; i--) {
            for (int j = i; j < n; j++) {
                if (s.charAt(i) == s.charAt(j) &&
                    (j - i <= 2 || isPalin[i + 1][j - 1])) {
                    isPalin[i][j] = true;
                }
            }
        }

        // dp[i] = min cuts needed for s[0..i-1]
        int[] dp = new int[n + 1];
        Arrays.fill(dp, Integer.MAX_VALUE);
        dp[0] = -1;  // Empty string needs -1 cuts (so first palindrome has 0 cuts)

        for (int i = 1; i <= n; i++) {
            for (int j = 0; j < i; j++) {
                if (isPalin[j][i - 1]) {
                    dp[i] = Math.min(dp[i], dp[j] + 1);
                }
            }
        }

        return dp[n];
    }

    // Get all palindrome partitions
    public List<List<String>> partition(String s) {
        List<List<String>> result = new ArrayList<>();
        backtrack(s, 0, new ArrayList<>(), result);
        return result;
    }

    private void backtrack(String s, int start, List<String> path,
                           List<List<String>> result) {
        if (start == s.length()) {
            result.add(new ArrayList<>(path));
            return;
        }

        for (int end = start + 1; end <= s.length(); end++) {
            String sub = s.substring(start, end);
            if (isPalindrome(sub)) {
                path.add(sub);
                backtrack(s, end, path, result);
                path.remove(path.size() - 1);
            }
        }
    }

    private boolean isPalindrome(String s) {
        int l = 0, r = s.length() - 1;
        while (l < r) {
            if (s.charAt(l++) != s.charAt(r--)) return false;
        }
        return true;
    }
}
```

## Problem 5: Best Time to Buy and Sell Stock (All Variants)

```java
public class StockProblems {

    // I: One transaction
    public int maxProfit1(int[] prices) {
        int minPrice = Integer.MAX_VALUE;
        int maxProfit = 0;

        for (int price : prices) {
            minPrice = Math.min(minPrice, price);
            maxProfit = Math.max(maxProfit, price - minPrice);
        }

        return maxProfit;
    }

    // II: Unlimited transactions
    public int maxProfit2(int[] prices) {
        int profit = 0;
        for (int i = 1; i < prices.length; i++) {
            if (prices[i] > prices[i - 1]) {
                profit += prices[i] - prices[i - 1];
            }
        }
        return profit;
    }

    // III: At most 2 transactions
    public int maxProfit3(int[] prices) {
        int buy1 = Integer.MIN_VALUE, sell1 = 0;
        int buy2 = Integer.MIN_VALUE, sell2 = 0;

        for (int price : prices) {
            buy1 = Math.max(buy1, -price);
            sell1 = Math.max(sell1, buy1 + price);
            buy2 = Math.max(buy2, sell1 - price);
            sell2 = Math.max(sell2, buy2 + price);
        }

        return sell2;
    }

    // IV: At most k transactions
    public int maxProfit4(int k, int[] prices) {
        int n = prices.length;
        if (n == 0) return 0;

        if (k >= n / 2) return maxProfit2(prices);

        // dp[t][d] = max profit using at most t transactions up to day d
        int[][] dp = new int[k + 1][n];

        for (int t = 1; t <= k; t++) {
            int maxDiff = -prices[0];
            for (int d = 1; d < n; d++) {
                dp[t][d] = Math.max(dp[t][d - 1], prices[d] + maxDiff);
                maxDiff = Math.max(maxDiff, dp[t - 1][d] - prices[d]);
            }
        }

        return dp[k][n - 1];
    }

    // With cooldown (must wait 1 day after selling)
    public int maxProfitCooldown(int[] prices) {
        int sold = 0, held = Integer.MIN_VALUE, rest = 0;

        for (int price : prices) {
            int prevSold = sold;
            sold = held + price;
            held = Math.max(held, rest - price);
            rest = Math.max(rest, prevSold);
        }

        return Math.max(sold, rest);
    }

    // With transaction fee
    public int maxProfitWithFee(int[] prices, int fee) {
        int cash = 0, hold = -prices[0];

        for (int i = 1; i < prices.length; i++) {
            cash = Math.max(cash, hold + prices[i] - fee);
            hold = Math.max(hold, cash - prices[i]);
        }

        return cash;
    }
}
```

---

## PART 13: DP State Design Principles

### How to Identify DP State

```
STEP 1: What are the "decisions" at each step?
        - Include/exclude an item
        - Move right/down in grid
        - Match/skip a character

STEP 2: What information do I need to make the decision?
        - Current position (index)
        - Remaining capacity (knapsack)
        - Previous state (house robber)
        - Constraints (transactions left)

STEP 3: What do I want to compute?
        - Maximum/minimum value
        - Count of ways
        - Existence (boolean)

COMBINE INTO STATE:
dp[i][remaining_capacity] = max value considering items 0..i
dp[i][j] = ways to reach cell (i,j)
dp[i][k] = max profit with at most k transactions up to day i
```

### State Reduction Techniques

```java
// TECHNIQUE 1: Remove redundant dimensions
// Bad: dp[i][j][sum] where sum = prefix sum
// Good: dp[i][j], compute sum from i and j

// TECHNIQUE 2: Rolling array (space optimization)
// If dp[i] only depends on dp[i-1], use 2 arrays
// If dp[i][j] only depends on dp[i-1][...], use 2 rows

// TECHNIQUE 3: State compression
// Instead of visited[n] array, use bitmask integer
// int mask represents which elements are used

// Example: Subset sum with bitmask
public boolean canPartition(int[] nums) {
    int sum = 0;
    for (int n : nums) sum += n;
    if (sum % 2 != 0) return false;

    int target = sum / 2;
    boolean[] dp = new boolean[target + 1];
    dp[0] = true;

    for (int num : nums) {
        // Iterate backwards to avoid using same element twice
        for (int j = target; j >= num; j--) {
            dp[j] = dp[j] || dp[j - num];
        }
    }

    return dp[target];
}
```

---

## PART 14: Common DP Mistakes and How to Avoid Them

```
MISTAKE 1: Wrong base case
- Always think: what's the answer for the smallest input?
- Empty string? 0 elements? 0 capacity?

MISTAKE 2: Wrong transition direction
- For tabulation, process in order so subproblems are solved first
- For 0/1 knapsack: iterate backwards when using 1D array

MISTAKE 3: Integer overflow
- Use long when values can exceed Integer.MAX_VALUE
- Especially in counting problems with modulo

MISTAKE 4: Off-by-one errors
- 0-indexed vs 1-indexed
- Length vs index
- Inclusive vs exclusive ranges

MISTAKE 5: Not considering all cases
- What if no solution exists? Return -1 or MAX_VALUE?
- What if multiple solutions? Need all or just one?

MISTAKE 6: Redundant states
- Check if a dimension in your state is truly necessary
- Can it be computed from other dimensions?
```

---

## 🚀 PART FINAL: ADVANCED DP PATTERNS & TECHNIQUES

> **Reader's note:** The Digit DP, Bitmask DP, Interval DP, and Tree DP
> sections below are **template-style recaps** — quick-reference code for
> contests. For the deep derivations (why bitmask DP forces 2^n states,
> the "burst last" trick, the reroot technique), see Parts 1–3 above.
>
> **Unique content in this section** (not covered above):
> - Interval DP → "Minimum Cost to Cut a Stick" example, Decision Guide table
> - **Convex Hull Trick** (optimizing linear DP transitions)
> - **Divide & Conquer DP Optimization** (when opt[i] is monotone)
> - **Broken Profile DP** (tiling/grid problems with bitmask rows)

### ADVANCED DYNAMIC PROGRAMMING - COMPETITIVE PROGRAMMING LEVEL ╠══════════════════════════════════════════════════════════════════════════════════╣  This section covers advanced DP patterns used in: • Competitive programming (Codeforces, ICPC, IOI) • Technical interviews at top companies • Real-world optimization problems

## DIGIT DP - COUNTING NUMBERS WITH PROPERTIES

### Digit dp - the pattern

**Problem type:** Count numbers in range [L, R] with some digit property Examples:

- Count numbers with digit sum = K
- Count numbers without repeated digits
- Count numbers divisible by D

**Key idea:** Build number digit by digit, tracking:

- Position (which digit we're placing)
- Tight bound (are we still bounded by limit?)
- Problem-specific state (sum, remainder, etc.)

**Template:** ───────────


```java
// Count numbers from 0 to N with digit sum = targetSum
Long[][] memo;  // [position][sum][tight]

long countDigitSum(String N, int targetSum) {
    memo = new Long[N.length()][targetSum + 1][2];
    return solve(N, 0, 0, true, targetSum);
}

long solve(String N, int pos, int sum, boolean tight, int target) {
    // Base case: processed all digits
    if (pos == N.length()) {
        return sum == target ? 1 : 0;
    }

    // Memoization check
    int t = tight ? 1 : 0;
    if (memo[pos][sum][t] != null) return memo[pos][sum][t];

    // Determine upper limit for current digit
    int limit = tight ? (N.charAt(pos) - '0') : 9;

    long result = 0;
    for (int digit = 0; digit <= limit; digit++) {
        result += solve(N, pos + 1, sum + digit,
                       tight && (digit == limit), target);
    }

    return memo[pos][sum][t] = result;
}

// For range [L, R]: answer = count(R) - count(L-1)
```

```text
EXAMPLE: Count numbers 1 to N with no repeated adjacent digits
─────────────────────────────────────────────────────────────
```

```java
Long[][][] memo;  // [pos][prevDigit][tight]

long countNoRepeated(String N) {
    memo = new Long[N.length()][10][2];
    return solve(N, 0, -1, true);  // -1 means no previous digit
}

long solve(String N, int pos, int prev, boolean tight) {
    if (pos == N.length()) return 1;  // Valid number

    int t = tight ? 1 : 0;
    int p = prev + 1;  // Shift to use as array index
    if (memo[pos][p][t] != null) return memo[pos][p][t];

    int limit = tight ? (N.charAt(pos) - '0') : 9;

    long result = 0;
    for (int digit = 0; digit <= limit; digit++) {
        if (digit != prev) {  // No adjacent repeats
            result += solve(N, pos + 1, digit, tight && (digit == limit));
        }
    }

    return memo[pos][p][t] = result;
}
```

```text
```

---

[← Pattern 4: Tree DP](03_tree_dp.md) | [Chapter overview](../04c_DP_Advanced.md) | [Bitmask DP — Subset State Tracking →](05_bitmask_dp_subset_state_tracking.md)
