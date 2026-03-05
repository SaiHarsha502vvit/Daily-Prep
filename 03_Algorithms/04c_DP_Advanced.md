> **Navigation**: [< Previous Chapter](04b_DP_Fundamentals.md) | [Back to Index](../00_MASTER_INDEX.md)
> 🧠 **Mental Model**: See [DP State Thinking](../14_Mental_Models/02_DP_State_Thinking.md) — advanced state design and optimization

---

# PART 11: Advanced DP Patterns

## Pattern 1: Digit DP

```
CONCEPT:
Count numbers with certain digit properties in a range [L, R].
Build numbers digit by digit, track constraints.

STATE:
- Position in the number
- Whether we're still bounded by the limit
- Any accumulated properties (sum, count, etc.)
```

```java
// Count numbers from 1 to n with digit sum = k
public class DigitDP {
    private Long[][][] memo;
    private String num;

    public long countNumbersWithDigitSum(int n, int k) {
        num = String.valueOf(n);
        memo = new Long[num.length()][k + 1][2];
        return solve(0, k, true);
    }

    private long solve(int pos, int remaining, boolean tight) {
        // Base case: processed all digits
        if (pos == num.length()) {
            return remaining == 0 ? 1 : 0;
        }

        // Check memo
        int tightIdx = tight ? 1 : 0;
        if (memo[pos][remaining][tightIdx] != null) {
            return memo[pos][remaining][tightIdx];
        }

        // Determine upper limit for this digit
        int limit = tight ? (num.charAt(pos) - '0') : 9;

        long result = 0;
        for (int digit = 0; digit <= limit; digit++) {
            if (digit <= remaining) {
                boolean newTight = tight && (digit == limit);
                result += solve(pos + 1, remaining - digit, newTight);
            }
        }

        memo[pos][remaining][tightIdx] = result;
        return result;
    }
}

// Examples:
// How many numbers in [1, 100] have digit sum = 5?
// Answer: 10 (5, 14, 23, 32, 41, 50, 104... wait, cap at 100)
// Actually: 5, 14, 23, 32, 41, 50 = 6 numbers
```

## Pattern 2: Bitmask DP

```
CONCEPT:
Use bitmask to represent which elements are "used" or "visited".
Each bit represents one element's state.

WHEN TO USE:
- Small n (typically n ≤ 20 due to 2^n states)
- Need to track subset of elements
- Traveling Salesman, Assignment problem
```

```java
// Traveling Salesman Problem (TSP)
public class TSP {
    private int[][] dist;
    private int[][] memo;
    private int n;

    public int findShortestRoute(int[][] distances) {
        this.dist = distances;
        this.n = distances.length;
        this.memo = new int[1 << n][n];

        for (int[] row : memo) Arrays.fill(row, -1);

        // Start from city 0, visit all cities, return to 0
        return solve(1, 0);  // mask=1 means city 0 is visited
    }

    private int solve(int mask, int pos) {
        // All cities visited, return to start
        if (mask == (1 << n) - 1) {
            return dist[pos][0];
        }

        if (memo[mask][pos] != -1) {
            return memo[mask][pos];
        }

        int result = Integer.MAX_VALUE;

        // Try visiting each unvisited city
        for (int next = 0; next < n; next++) {
            if ((mask & (1 << next)) == 0) {  // City not visited
                int newMask = mask | (1 << next);
                int cost = dist[pos][next] + solve(newMask, next);
                result = Math.min(result, cost);
            }
        }

        memo[mask][pos] = result;
        return result;
    }
}

// Visual:
// For 4 cities: 0, 1, 2, 3
// mask = 0101 means cities 0 and 2 are visited
// mask = 1111 means all cities visited
```

```java
// Minimum cost to assign n workers to n jobs
public class AssignmentProblem {
    private int[][] cost;
    private int[] memo;
    private int n;

    public int minCostAssignment(int[][] cost) {
        this.cost = cost;
        this.n = cost.length;
        this.memo = new int[1 << n];
        Arrays.fill(memo, -1);

        return solve(0, 0);
    }

    // worker = which worker we're assigning
    // mask = which jobs are taken
    private int solve(int worker, int mask) {
        if (worker == n) return 0;  // All workers assigned

        if (memo[mask] != -1) return memo[mask];

        int result = Integer.MAX_VALUE;
        for (int job = 0; job < n; job++) {
            if ((mask & (1 << job)) == 0) {  // Job not taken
                int newMask = mask | (1 << job);
                int total = cost[worker][job] + solve(worker + 1, newMask);
                result = Math.min(result, total);
            }
        }

        memo[mask] = result;
        return result;
    }
}
```

## Pattern 3: Interval DP

```
CONCEPT:
Solve problems on intervals/subarrays by considering all ways
to split the interval and combining results.

RECURRENCE:
dp[i][j] = optimal value for interval [i, j]
         = combine(dp[i][k], dp[k+1][j]) for all k in [i, j)
```

```java
// Matrix Chain Multiplication
public class MatrixChainMultiplication {
    public int minMultiplications(int[] dims) {
        // dims = [d0, d1, d2, ..., dn]
        // Matrix i has dimensions dims[i-1] x dims[i]
        int n = dims.length - 1;  // Number of matrices
        int[][] dp = new int[n][n];

        // Length of chain
        for (int len = 2; len <= n; len++) {
            for (int i = 0; i <= n - len; i++) {
                int j = i + len - 1;
                dp[i][j] = Integer.MAX_VALUE;

                // Try all split points
                for (int k = i; k < j; k++) {
                    // Cost = left chain + right chain + multiplication
                    int cost = dp[i][k] + dp[k + 1][j] +
                               dims[i] * dims[k + 1] * dims[j + 1];
                    dp[i][j] = Math.min(dp[i][j], cost);
                }
            }
        }

        return dp[0][n - 1];
    }
}

// Example: dims = [10, 30, 5, 60]
// Matrices: A (10x30), B (30x5), C (5x60)
// (A*B)*C = 10*30*5 + 10*5*60 = 1500 + 3000 = 4500
// A*(B*C) = 30*5*60 + 10*30*60 = 9000 + 18000 = 27000
// Optimal: 4500
```

```java
// Burst Balloons (LeetCode 312)
public int maxCoins(int[] nums) {
    int n = nums.length;
    // Add 1 at boundaries
    int[] arr = new int[n + 2];
    arr[0] = arr[n + 1] = 1;
    for (int i = 0; i < n; i++) {
        arr[i + 1] = nums[i];
    }

    int[][] dp = new int[n + 2][n + 2];

    // len = length of interval
    for (int len = 1; len <= n; len++) {
        for (int left = 1; left <= n - len + 1; left++) {
            int right = left + len - 1;

            // Try bursting each balloon last in this interval
            for (int last = left; last <= right; last++) {
                int coins = arr[left - 1] * arr[last] * arr[right + 1];
                coins += dp[left][last - 1] + dp[last + 1][right];
                dp[left][right] = Math.max(dp[left][right], coins);
            }
        }
    }

    return dp[1][n];
}
```

## Pattern 4: Tree DP

```
CONCEPT:
DP on tree structures. Usually compute answers for subtrees
and combine at each node.

COMMON PATTERNS:
- dp[node] = something about subtree rooted at node
- dp[node][0/1] = with/without including this node
```

```java
// House Robber III - Rob houses on a tree (can't rob adjacent)
public class TreeDP {
    public int rob(TreeNode root) {
        int[] result = robSub(root);
        return Math.max(result[0], result[1]);
    }

    // Returns [max if not robbing this node, max if robbing this node]
    private int[] robSub(TreeNode node) {
        if (node == null) return new int[]{0, 0};

        int[] left = robSub(node.left);
        int[] right = robSub(node.right);

        // If not robbing this node, children can be robbed or not
        int notRob = Math.max(left[0], left[1]) + Math.max(right[0], right[1]);

        // If robbing this node, children cannot be robbed
        int rob = node.val + left[0] + right[0];

        return new int[]{notRob, rob};
    }
}

// Binary Tree Maximum Path Sum
public int maxPathSum(TreeNode root) {
    int[] maxSum = {Integer.MIN_VALUE};
    maxPath(root, maxSum);
    return maxSum[0];
}

private int maxPath(TreeNode node, int[] maxSum) {
    if (node == null) return 0;

    // Max sum of path going through left/right child
    int leftMax = Math.max(0, maxPath(node.left, maxSum));
    int rightMax = Math.max(0, maxPath(node.right, maxSum));

    // Max path passing through this node
    int pathThrough = node.val + leftMax + rightMax;
    maxSum[0] = Math.max(maxSum[0], pathThrough);

    // Return max path starting at this node and going down
    return node.val + Math.max(leftMax, rightMax);
}
```

## Pattern 5: DP with Monotonic Optimization

```
CONCEPT:
Use monotonic data structures to optimize DP transitions.
Reduces O(n²) to O(n) or O(n log n).
```

```java
// Sliding Window Maximum approach in DP
// dp[i] = max(dp[j] + cost[j]) for j in [i-k, i-1]
public int[] dpWithDeque(int[] arr, int k) {
    int n = arr.length;
    int[] dp = new int[n];
    Deque<Integer> deque = new ArrayDeque<>();

    for (int i = 0; i < n; i++) {
        // Remove elements outside window
        while (!deque.isEmpty() && deque.peekFirst() < i - k) {
            deque.pollFirst();
        }

        // Current dp value uses best in window
        if (!deque.isEmpty()) {
            dp[i] = dp[deque.peekFirst()] + arr[i];
        } else {
            dp[i] = arr[i];
        }

        // Maintain monotonic decreasing
        while (!deque.isEmpty() && dp[deque.peekLast()] <= dp[i]) {
            deque.pollLast();
        }
        deque.addLast(i);
    }

    return dp;
}
```

---

# PART 12: Complete DP Problem Solutions

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

# PART 13: DP State Design Principles

## How to Identify DP State

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

## State Reduction Techniques

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

# PART 14: Common DP Mistakes and How to Avoid Them

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

# 🚀 PART FINAL: ADVANCED DP PATTERNS & TECHNIQUES

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║          ADVANCED DYNAMIC PROGRAMMING - COMPETITIVE PROGRAMMING LEVEL            ║
╠══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                  ║
║  This section covers advanced DP patterns used in:                               ║
║  • Competitive programming (Codeforces, ICPC, IOI)                               ║
║  • Technical interviews at top companies                                         ║
║  • Real-world optimization problems                                              ║
║                                                                                  ║
╚══════════════════════════════════════════════════════════════════════════════════╝
```

## DIGIT DP - COUNTING NUMBERS WITH PROPERTIES

````
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    DIGIT DP - THE PATTERN                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  PROBLEM TYPE: Count numbers in range [L, R] with some digit property           │
│  Examples:                                                                      │
│  • Count numbers with digit sum = K                                             │
│  • Count numbers without repeated digits                                        │
│  • Count numbers divisible by D                                                 │
│                                                                                 │
│  KEY IDEA: Build number digit by digit, tracking:                               │
│  • Position (which digit we're placing)                                         │
│  • Tight bound (are we still bounded by limit?)                                 │
│  • Problem-specific state (sum, remainder, etc.)                                │
│                                                                                 │
│                                                                                 │
│  TEMPLATE:                                                                      │
│  ───────────                                                                    │
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
````

│ │
│ │
│ EXAMPLE: Count numbers 1 to N with no repeated adjacent digits │
│ ───────────────────────────────────────────────────────────── │

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

│ │
└─────────────────────────────────────────────────────────────────────────────────┘

```

## BITMASK DP - SUBSET STATE TRACKING

```

┌─────────────────────────────────────────────────────────────────────────────────┐
│ BITMASK DP - COMPLETE GUIDE                                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ WHEN TO USE: Small n (≤ 20), need to track which elements are "used"            │
│                                                                                 │
│ BITMASK OPERATIONS:                                                             │
│ ┌──────────────────────────────────────────────────────────────────────────┐    │
│ │ Operation │ Code │ Example │                                                  │
│ ├────────────────────────────┼─────────────────────┼───────────────────────┤    │
│ │ Check if bit i is set │ (mask >> i) & 1 │ mask=5: bit 0,2 set │               │
│ │ Set bit i │ mask | (1 << i) │ 5|2=7 (set bit 1) │                             │
│ │ Clear bit i │ mask & ~(1 << i) │ 7&~2=5 (clear bit 1) │                       │
│ │ Toggle bit i │ mask ^ (1 << i) │ 5^4=1 (toggle bit 2) │                       │
│ │ Count set bits │ Integer.bitCount() │ bitCount(5)=2 │                         │
│ │ Lowest set bit │ mask & (-mask) │ 12&(-12)=4 │                                │
│ │ Clear lowest set bit │ mask & (mask-1) │ 12&11=8 │                            │
│ │ Check if power of 2 │ (mask & (mask-1))==0│ isPow2(8)=true │                  │
│ │ Iterate all subsets of mask│ See code below │ │                               │
│ └──────────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
│                                                                                 │
│ TRAVELING SALESMAN PROBLEM (TSP):                                               │
│ ──────────────────────────────────                                              │

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

│ │
│ │
│ ITERATING OVER ALL SUBSETS OF A MASK: │
│ ───────────────────────────────────── │

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

│ │
│ │
│ ASSIGNMENT PROBLEM (HUNGARIAN ALTERNATIVE): │
│ ─────────────────────────────────────────── │

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

│ │
└─────────────────────────────────────────────────────────────────────────────────┘

```

## INTERVAL DP - OPTIMAL SUBSTRUCTURE ON RANGES

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

│ │
│ │
│ MATRIX CHAIN MULTIPLICATION: │
│ ──────────────────────────── │

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

│ │
│ │
│ BURST BALLOONS (LeetCode 312): │
│ ────────────────────────────── │

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

│ │
│ │
│ MINIMUM COST TO CUT A STICK (LeetCode 1547): │
│ ──────────────────────────────────────────── │

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

## DP ON TREES

```

┌─────────────────────────────────────────────────────────────────────────────────┐
│ TREE DP - THE PATTERN                                                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ WHEN TO USE: Compute optimal values on tree structures                          │
│                                                                                 │
│ KEY INSIGHT: Process children first (post-order), then compute parent           │
│                                                                                 │
│                                                                                 │
│ BASIC TREE DP - MAXIMUM INDEPENDENT SET:                                        │
│ ─────────────────────────────────────────                                       │

```java
// Select maximum weight of non-adjacent nodes
// dp[v][0] = max weight not including v
// dp[v][1] = max weight including v

int[][] dp;
List<List<Integer>> adj;

void dfs(int v, int parent) {
    dp[v][0] = 0;
    dp[v][1] = weight[v];

    for (int u : adj.get(v)) {
        if (u == parent) continue;
        dfs(u, v);

        // If v not included, children can be included or not
        dp[v][0] += Math.max(dp[u][0], dp[u][1]);
        // If v included, children cannot be included
        dp[v][1] += dp[u][0];
    }
}

// Answer: Math.max(dp[root][0], dp[root][1])
```

│ │
│ │
│ TREE DIAMETER: │
│ ────────────── │

```java
// Longest path in tree
int diameter = 0;

int dfs(int v, int parent) {
    int max1 = 0, max2 = 0;  // Two longest paths through children

    for (int u : adj.get(v)) {
        if (u == parent) continue;
        int childDepth = dfs(u, v) + 1;

        if (childDepth > max1) {
            max2 = max1;
            max1 = childDepth;
        } else if (childDepth > max2) {
            max2 = childDepth;
        }
    }

    // Diameter through v = max1 + max2
    diameter = Math.max(diameter, max1 + max2);

    return max1;  // Return longest path going down from v
}
```

│ │
│ │
│ REROOTING TECHNIQUE (for all-roots DP): │
│ ───────────────────────────────────────── │

```java
// Compute answer for all possible roots in O(n)
// Example: Sum of distances from each node to all others

long[] dp;      // dp[v] = sum of distances from v (rooted at v)
long[] answer;  // answer[v] = sum of distances from v (any root)
int[] subtree;  // subtree[v] = size of subtree rooted at v

// Step 1: Root at node 0, compute dp[0] and subtree sizes
void dfs1(int v, int parent) {
    subtree[v] = 1;
    dp[v] = 0;

    for (int u : adj.get(v)) {
        if (u == parent) continue;
        dfs1(u, v);
        subtree[v] += subtree[u];
        dp[v] += dp[u] + subtree[u];  // Add distance to all nodes in subtree
    }
}

// Step 2: Reroot - compute answer for all nodes
void dfs2(int v, int parent) {
    answer[v] = dp[v];

    for (int u : adj.get(v)) {
        if (u == parent) continue;

        // Temporarily reroot from v to u
        // Nodes in u's subtree get closer by 1
        // Nodes outside u's subtree get farther by 1
        dp[v] -= dp[u] + subtree[u];
        dp[u] += dp[v] + (n - subtree[u]);

        int oldSubtreeV = subtree[v];
        subtree[v] -= subtree[u];
        subtree[u] = n;

        dfs2(u, v);

        // Restore
        subtree[u] = n - oldSubtreeV + subtree[v];
        subtree[v] = oldSubtreeV;
        dp[u] -= dp[v] + (n - subtree[u]);
        dp[v] += dp[u] + subtree[u];
    }
}
```

│ │
└─────────────────────────────────────────────────────────────────────────────────┘

```

## DP OPTIMIZATIONS - CONVEX HULL TRICK

```

┌─────────────────────────────────────────────────────────────────────────────────┐
│ CONVEX HULL TRICK (CHT)                                                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ WHEN TO USE: Recurrence of form dp[i] = min(dp[j] + b[j] _ a[i]) for j < i      │
│ Reduces O(n²) to O(n) or O(n log n)                                             │
│                                                                                 │
│ CONDITIONS:                                                                     │
│ • Slopes b[j] are monotonic                                                     │
│ • Query values a[i] are monotonic                                               │
│ • Want minimum (or can convert to minimum)                                      │
│                                                                                 │
│                                                                                 │
│ INTUITION:                                                                      │
│ ───────────                                                                     │
│ Each j gives a line: y = b[j] _ x + dp[j]                                       │
│ Query for x = a[i]: find line with minimum y                                    │
│ Maintain lower convex hull of lines                                             │
│                                                                                 │
│ VISUALIZATION:                                                                  │
│ y │                                                                             │
│ │ ╱ line 3 (b=4)                                                                │
│ │ ╱                                                                             │
│ │╱ ╱ line 2 (b=2)                                                               │
│ │ ╱                                                                             │
│ │ ╱ ╱ line 1 (b=1)                                                              │
│ │ ╱ ╱                                                                           │
│ │ ╱ ╱                                                                           │
│ │╱──╱───────────────── x                                                        │
│ ╱╲                                                                              │
│ ╱ ╲ Convex hull (only these lines can be optimal)                               │
│                                                                                 │
│                                                                                 │
│ IMPLEMENTATION (monotonic slopes and queries):                                  │
│ ─────────────────────────────────────────────                                   │

```java
class ConvexHullTrick {
    Deque<long[]> hull = new ArrayDeque<>();  // [slope, intercept]

    // Is line c always worse than a and b?
    boolean bad(long[] a, long[] b, long[] c) {
        // Check if intersection of (a,c) is left of (a,b)
        return (c[1] - a[1]) * (a[0] - b[0]) <= (b[1] - a[1]) * (a[0] - c[0]);
    }

    void addLine(long slope, long intercept) {
        long[] line = {slope, intercept};
        while (hull.size() >= 2 && bad(hull.get(hull.size()-2), hull.getLast(), line)) {
            hull.removeLast();
        }
        hull.addLast(line);
    }

    long query(long x) {
        // Remove lines that are no longer optimal (for increasing x)
        while (hull.size() >= 2 &&
               eval(hull.getFirst(), x) >= eval(hull.get(1), x)) {
            hull.removeFirst();
        }
        return eval(hull.getFirst(), x);
    }

    long eval(long[] line, long x) {
        return line[0] * x + line[1];
    }
}

// Usage Example: dp[i] = min(dp[j] + b[j] * a[i])
ConvexHullTrick cht = new ConvexHullTrick();
cht.addLine(b[0], dp[0]);

for (int i = 1; i < n; i++) {
    dp[i] = cht.query(a[i]) + /* other terms */;
    cht.addLine(b[i], dp[i]);
}
```

│ │
│ COMPLEXITY: │
│ • Amortized O(1) per addLine and query if both are monotonic │
│ • O(log n) per query with binary search if queries not monotonic │
│ │
└─────────────────────────────────────────────────────────────────────────────────┘

```

## DIVIDE AND CONQUER DP OPTIMIZATION

```

┌─────────────────────────────────────────────────────────────────────────────────┐
│ DIVIDE AND CONQUER DP                                                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ WHEN TO USE: dp[i][j] = min(dp[i-1][k] + cost(k+1, j)) for k < j                │
│ And: optimal k for j₁ ≤ optimal k for j₂ when j₁ < j₂                           │
│ (This is the "monotonicity of optimal splits" property)                         │
│                                                                                 │
│ Reduces O(n × m × n) to O(n × m × log n)                                        │
│                                                                                 │
│                                                                                 │
│ IMPLEMENTATION:                                                                 │
│ ───────────────                                                                 │

```java
// dp[i][j] = optimal value using exactly i partitions ending at j
long[][] dp;
int[][] opt;  // opt[i][j] = optimal split point k for dp[i][j]

void compute(int level, int lo, int hi, int optLo, int optHi) {
    if (lo > hi) return;

    int mid = (lo + hi) / 2;
    int optMid = optLo;
    dp[level][mid] = Long.MAX_VALUE;

    // Find optimal k for mid in range [optLo, min(optHi, mid-1)]
    for (int k = optLo; k <= Math.min(optHi, mid - 1); k++) {
        long val = dp[level - 1][k] + cost(k + 1, mid);
        if (val < dp[level][mid]) {
            dp[level][mid] = val;
            optMid = k;
        }
    }

    // Divide: left half uses optLo..optMid, right half uses optMid..optHi
    compute(level, lo, mid - 1, optLo, optMid);
    compute(level, mid + 1, hi, optMid, optHi);
}

// Call: compute(i, 1, n, 0, n) for each level i
```

│ │
│ │
│ EXAMPLE: Partition array into k subarrays, minimize max sum │
│ ────────────────────────────────────────────────────────── │

```java
long solve(int[] arr, int k) {
    int n = arr.length;
    long[] prefix = new long[n + 1];
    for (int i = 0; i < n; i++) prefix[i + 1] = prefix[i] + arr[i];

    dp = new long[k + 1][n + 1];
    Arrays.fill(dp[0], Long.MAX_VALUE / 2);
    dp[0][0] = 0;

    for (int level = 1; level <= k; level++) {
        compute(level, 1, n, 0, n - 1);
    }

    return dp[k][n];
}

long cost(int l, int r) {
    return prefix[r] - prefix[l - 1];  // Sum of arr[l-1..r-1]
}
```

│ │
└─────────────────────────────────────────────────────────────────────────────────┘

```

## BROKEN PROFILE DP (PLUG DP)

```

┌─────────────────────────────────────────────────────────────────────────────────┐
│ BROKEN PROFILE DP - GRID TILING                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ WHEN TO USE: Tiling problems on small grids (width ≤ 20)                        │
│ • Count ways to tile grid with dominoes                                         │
│ • Place non-attacking pieces                                                    │
│ • Grid coloring with adjacent constraints                                       │
│                                                                                 │
│                                                                                 │
│ CONCEPT: Track "profile" (pattern of filled cells at boundary)                  │
│ ─────────────────────────────────────────────────────────────                   │
│                                                                                 │
│ Grid (3×4): Profile after processing cell (1,2):                                │
│ ┌───┬───┬───┬───┐ ┌───┬───┬───┬───┐                                             │
│ │ ✓ │ ✓ │ ✓ │ │ │ ✓ │ ✓ │ ✓ │ │                                                 │
│ ├───┼───┼───┼───┤ ├───┼───╔═══╗───┤                                             │
│ │ ✓ │ ✓ │▐▌ │ │ ← here │ ✓ │ ✓ ║ ? ║ │ ← profile = mask of '?'                  │
│ ├───┼───┼───┼───┤ ├───┼───╚═══╝───┤ cells just below boundary                   │
│ │ │ │ │ │ │ │ │ │ │                                                             │
│ └───┴───┴───┴───┘ └───┴───┴───┴───┘                                             │
│                                                                                 │
│ Profile = bitmask of m bits (grid width)                                        │
│ Bit i set = cell above current in column i is filled                            │
│                                                                                 │
│                                                                                 │
│ DOMINO TILING (count ways to tile n×m grid with 1×2 dominoes):                  │
│ ──────────────────────────────────────────────────────────────                  │

```java
// Count ways to tile n×m grid with dominoes
long dominoTiling(int n, int m) {
    if (n > m) { int t = n; n = m; m = t; }  // Ensure m >= n for efficiency

    long[] dp = new long[1 << n];
    dp[(1 << n) - 1] = 1;  // All filled = valid starting state

    for (int col = 0; col < m; col++) {
        for (int row = 0; row < n; row++) {
            long[] newDp = new long[1 << n];

            for (int mask = 0; mask < (1 << n); mask++) {
                if (dp[mask] == 0) continue;

                int bit = 1 << row;

                if ((mask & bit) != 0) {
                    // Cell above is filled, current must get filled from left
                    // Or we can place vertical domino up (cell above filled by it)
                    // Actually, if bit set, it means above cell "extends" here
                    // So we set this cell's bit to 0 (used the extension)
                    newDp[mask ^ bit] += dp[mask];
                } else {
                    // Cell above not filled, we must fill current cell

                    // Option 1: Horizontal domino to the right
                    // (only if not last column)
                    if (col + 1 < m) {
                        // This will "extend" to next column
                        newDp[mask | bit] += dp[mask];
                    }

                    // Option 2: Vertical domino downward
                    // (only if not last row, and cell below not already claimed)
                    if (row + 1 < n && (mask & (bit << 1)) == 0) {
                        newDp[mask] += dp[mask];  // Fill both, no extension
                    }
                }
            }

            dp = newDp;
        }
    }

    return dp[0];  // Final state: nothing extends beyond grid
}
```

│ │
│ Time: O(m × n × 2^n) │
│ Space: O(2^n) │
│ Practical for n ≤ 15-20 │
│ │
└─────────────────────────────────────────────────────────────────────────────────┘

```

## DP PATTERN QUICK REFERENCE

```

 DP PATTERNS QUICK REFERENCE
──────────────────────────────────────────────────

 ┌─────────────────────────────────────────────────────────────────────────────┐
 │ Pattern │ Signal │ Time │ Space │
 ├───────────────────┼─────────────────────────┼───────────┼───────────────────┤
 │ Linear DP │ One sequence │ O(n) │ O(1) to O(n) │
 │ Two-sequence DP │ Compare two strings │ O(nm) │ O(m) with rolling│
 │ Interval DP │ Range [i,j] optimal │ O(n³) │ O(n²) │
 │ Tree DP │ Tree structure │ O(n) │ O(n) │
 │ Bitmask DP │ n ≤ 20, subsets │ O(2ⁿ × n) │ O(2ⁿ) │
 │ Digit DP │ Count in range [L,R] │ O(d × s) │ O(d × s) │
 │ Broken Profile │ Grid, width ≤ 20 │ O(nm × 2ᵐ)│ O(2ᵐ) │
 │ D&C Optimization │ Monotonic opt split │ O(nm log n)│ O(nm) │
 │ Convex Hull Trick│ Linear transition │ O(n) │ O(n) │
 │ Knuth Optimization│Quadratic → near-linear │ O(n²) │ O(n²) │
 └─────────────────────────────────────────────────────────────────────────────┘

 RECURRENCE PATTERNS:
 • dp[i] = f(dp[i-1], dp[i-2], ...) → Linear/Fibonacci type
 • dp[i][j] = f(dp[i-1][j-1], dp[i-1][j], dp[i][j-1]) → Grid DP
 • dp[i][j] = min/max(dp[i][k] + dp[k][j] + c) → Interval DP
 • dp[mask] = f(dp[mask ^ (1<<k)]) → Bitmask DP
 • dp[v] = g(dp[children]) → Tree DP

 SPACE OPTIMIZATION CHECKLIST:
 □ Can I use rolling array? (only need prev row/rows)
 □ Can I use single array with careful iteration order?
 □ Can I compress coordinates?
 □ Can I use bitmask instead of array?


```

---

_DP is not about memorizing solutions - it's about SEEING the substructure!_
```

---

## PRACTICE PROBLEMS — Dynamic Programming (Progressive)

### Level 1: 1D DP (Start Here)

| # | Problem | Difficulty | Source | DP Type |
|---|---------|-----------|--------|---------|
| 1 | Climbing Stairs | Easy | LC 70 | Fibonacci variant |
| 2 | House Robber | Medium | LC 198 | Take/skip |
| 3 | Min Cost Climbing Stairs | Easy | LC 746 | Forward/backward DP |
| 4 | Maximum Subarray | Medium | LC 53 | Kadane's |
| 5 | Decode Ways | Medium | LC 91 | String DP |
| 6 | Coin Change | Medium | LC 322 | Unbounded knapsack |
| 7 | Longest Increasing Subsequence | Medium | LC 300 | LIS (O(n log n) optimization) |
| 8 | Word Break | Medium | LC 139 | Prefix matching DP |
| 9 | Perfect Squares | Medium | LC 279 | Min decomposition |
| 10 | Jump Game | Medium | LC 55 | Greedy or DP |

### Level 2: 2D DP

| # | Problem | Difficulty | Source | DP Type |
|---|---------|-----------|--------|---------|
| 1 | Unique Paths | Medium | LC 62 | Grid DP |
| 2 | Minimum Path Sum | Medium | LC 64 | Grid DP |
| 3 | Longest Common Subsequence | Medium | LC 1143 | Classic LCS |
| 4 | Edit Distance | Medium | LC 72 | String to string |
| 5 | 0/1 Knapsack | Medium | Classic | Weight/value table |
| 6 | Coin Change 2 | Medium | LC 518 | Count combinations |
| 7 | Target Sum | Medium | LC 494 | Subset sum variant |
| 8 | Interleaving String | Medium | LC 97 | Two-string matching |
| 9 | Maximal Square | Medium | LC 221 | 2D min expansion |
| 10 | Longest Palindromic Subsequence | Medium | LC 516 | Reverse + LCS |

### Level 3: Advanced DP

| # | Problem | Difficulty | Source | DP Type |
|---|---------|-----------|--------|---------|
| 1 | Longest Palindromic Substring | Medium | LC 5 | Expand center or DP |
| 2 | Regular Expression Matching | Hard | LC 10 | Two-string with wildcards |
| 3 | Burst Balloons | Hard | LC 312 | Interval DP |
| 4 | Partition Equal Subset Sum | Medium | LC 416 | Subset sum |
| 5 | House Robber III | Medium | LC 337 | Tree DP |
| 6 | Stone Game | Medium | LC 877 | Game theory DP |
| 7 | Minimum Cost to Cut a Stick | Hard | LC 1547 | Interval DP |
| 8 | Distinct Subsequences | Hard | LC 115 | Counting DP |
| 9 | Best Time Buy Sell Stock w/ Cooldown | Medium | LC 309 | State machine DP |
| 10 | Palindrome Partitioning II | Hard | LC 132 | Min cuts DP |

**Hidden Gems:**

| Problem | Source | Why It's Great |
|---------|--------|---------------|
| Minimum Falling Path Sum | LC 931 | Simple 2D DP — great for building intuition |
| Delete Operation for Two Strings | LC 583 | LCS variant — easier entry to edit distance |
| Ones and Zeroes | LC 474 | 2D knapsack with two weight dimensions |
| Maximum Length of Pair Chain | LC 646 | Greedy or DP — compare both approaches |
| Largest Divisible Subset | LC 368 | LIS variant with divisibility |
| Counting Bits | LC 338 | DP on bits — beautiful O(n) pattern |
