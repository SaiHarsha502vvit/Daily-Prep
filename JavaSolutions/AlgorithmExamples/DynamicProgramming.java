/**
 * DynamicProgramming.java — 4 classic DP patterns with full proof corners.
 *
 * Compile: javac DynamicProgramming.java
 * Run:     java DynamicProgramming
 *
 * Patterns covered:
 *   1. Fibonacci (memoization vs bottom-up — the starter pattern)
 *   2. 0/1 Knapsack (choose/skip DP)
 *   3. Longest Common Subsequence (2D DP, "two strings" shape)
 *   4. Coin Change (unbounded, count minimum coins)
 *
 * Key insight (applies to all 4): DP = brute-force recursion + cache.
 *   Step 1: write the recurrence.
 *   Step 2: identify the state space.
 *   Step 3: fill bottom-up (or memoize top-down).
 *
 * Proof Corner reference: A2_Complexity_FirstPrinciples.md
 */
public class DynamicProgramming {

    // =========================================================================
    // 1. Fibonacci — two approaches, same recurrence
    // Recurrence: F(n) = F(n-1) + F(n-2),  F(0)=0, F(1)=1
    // =========================================================================

    /** Top-down (memoized). Time: O(n), Space: O(n). */
    public static long fibMemo(int n, long[] memo) {
        if (n <= 1) return n;
        if (memo[n] != -1) return memo[n];
        return memo[n] = fibMemo(n - 1, memo) + fibMemo(n - 2, memo);
    }

    /** Bottom-up (tabulation). Time: O(n), Space: O(1). */
    public static long fibBottomUp(int n) {
        if (n <= 1) return n;
        long prev2 = 0, prev1 = 1;
        for (int i = 2; i <= n; i++) {
            long cur = prev1 + prev2;
            prev2 = prev1;
            prev1 = cur;
        }
        return prev1;
    }

    // =========================================================================
    // 2. 0/1 Knapsack
    // State: dp[i][w] = max value using items 0..i-1 with weight capacity w.
    // Recurrence:
    //   dp[i][w] = max(dp[i-1][w],                     // skip item i
    //                  dp[i-1][w - weight[i]] + value[i]) // take item i (if weight[i] <= w)
    // Base: dp[0][w] = 0 for all w (no items → no value)
    // Time: O(n * W), Space: O(W) with rolling array.
    // =========================================================================
    public static int knapsack(int[] weights, int[] values, int capacity) {
        int n = weights.length;
        int[] dp = new int[capacity + 1];   // dp[w] = max value for capacity w

        for (int i = 0; i < n; i++) {
            // Iterate backwards to avoid using item i twice (0/1 constraint)
            for (int w = capacity; w >= weights[i]; w--) {
                dp[w] = Math.max(dp[w], dp[w - weights[i]] + values[i]);
            }
        }
        return dp[capacity];
    }

    // =========================================================================
    // 3. Longest Common Subsequence (LCS)
    // State: dp[i][j] = LCS length of s1[0..i-1] and s2[0..j-1].
    // Recurrence:
    //   if s1[i-1] == s2[j-1]: dp[i][j] = dp[i-1][j-1] + 1
    //   else:                   dp[i][j] = max(dp[i-1][j], dp[i][j-1])
    // Base: dp[i][0] = dp[0][j] = 0 (empty string → LCS = 0)
    // Time: O(m*n), Space: O(m*n). (Reducible to O(min(m,n)) with rolling row.)
    //
    // ASCII trace for "ABCBDAB" vs "BDCAB" (famous textbook example):
    //       ""  B  D  C  A  B
    //   ""  [0  0  0  0  0  0]
    //   A   [0  0  0  0  1  1]
    //   B   [0  1  1  1  1  2]
    //   C   [0  1  1  2  2  2]
    //   B   [0  1  1  2  2  3]
    //   D   [0  1  2  2  2  3]
    //   A   [0  1  2  2  3  3]
    //   B   [0  1  2  2  3  4]   <- LCS = 4 ("BCAB" or "BDAB")
    // =========================================================================
    public static int lcs(String s1, String s2) {
        int m = s1.length(), n = s2.length();
        int[][] dp = new int[m + 1][n + 1];

        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                if (s1.charAt(i - 1) == s2.charAt(j - 1))
                    dp[i][j] = dp[i - 1][j - 1] + 1;
                else
                    dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
        return dp[m][n];
    }

    // =========================================================================
    // 4. Coin Change — minimum coins (unbounded knapsack variant)
    // State: dp[a] = fewest coins to make amount a.
    // Recurrence: dp[a] = min over all coin c where c <= a: dp[a-c] + 1
    // Base: dp[0] = 0 (zero coins to make amount 0)
    // Sentinel: dp[a] = Integer.MAX_VALUE / 2 means "impossible" (use MAX/2 to avoid overflow)
    // Time: O(n * amount), Space: O(amount).
    //
    // Worked example from Dimension 7 of Master Selector:
    //   coins = {1,3,4}, amount = 6:
    //   Greedy picks 4+1+1 = 3 coins.
    //   DP finds 3+3 = 2 coins (dp[6] = 2).  <- greedy fails here!
    // =========================================================================
    public static int coinChange(int[] coins, int amount) {
        int INF = Integer.MAX_VALUE / 2;
        int[] dp = new int[amount + 1];
        dp[0] = 0;
        for (int a = 1; a <= amount; a++) {
            dp[a] = INF;
            for (int c : coins) {
                if (c <= a && dp[a - c] + 1 < dp[a])
                    dp[a] = dp[a - c] + 1;
            }
        }
        return dp[amount] >= INF ? -1 : dp[amount];
    }

    // =========================================================================
    // Tests
    // =========================================================================
    public static void main(String[] args) {
        testFibonacci();
        testKnapsack();
        testLCS();
        testCoinChange();
        System.out.println("All DynamicProgramming tests PASSED ✓");
    }

    private static void testFibonacci() {
        long[] memo = new long[51];
        java.util.Arrays.fill(memo, -1);

        assert fibMemo(0, memo)      == 0   : "fib(0)=0";
        assert fibMemo(1, memo)      == 1   : "fib(1)=1";
        assert fibMemo(10, memo)     == 55  : "fib(10)=55";
        assert fibMemo(50, memo)     == 12586269025L : "fib(50)";

        assert fibBottomUp(0)  == 0  : "bottomUp fib(0)=0";
        assert fibBottomUp(1)  == 1  : "bottomUp fib(1)=1";
        assert fibBottomUp(10) == 55 : "bottomUp fib(10)=55";
        assert fibBottomUp(50) == 12586269025L : "bottomUp fib(50)";

        // Both approaches must agree
        for (int i = 0; i <= 30; i++) {
            long[] m2 = new long[i + 1];
            java.util.Arrays.fill(m2, -1);
            assert fibMemo(i, m2) == fibBottomUp(i)
                : "mismatch at fib(" + i + ")";
        }
        System.out.println("PASS: Fibonacci");
    }

    private static void testKnapsack() {
        // Classic textbook example
        int[] weights = {2, 3, 4, 5};
        int[] values  = {3, 4, 5, 6};
        assert knapsack(weights, values, 5) == 7  : "capacity=5 → 7 (items w=2,v=3 + w=3,v=4)";
        assert knapsack(weights, values, 8) == 10 : "capacity=8 → 10";

        // Edge cases
        assert knapsack(new int[]{}, new int[]{}, 10) == 0 : "no items → 0";
        assert knapsack(new int[]{5}, new int[]{100}, 4) == 0 : "item too heavy";
        assert knapsack(new int[]{5}, new int[]{100}, 5) == 100 : "exact fit";

        System.out.println("PASS: 0/1 Knapsack");
    }

    private static void testLCS() {
        // Famous textbook example
        assert lcs("ABCBDAB", "BDCAB") == 4 : "LCS(ABCBDAB, BDCAB) = 4";

        // Other cases
        assert lcs("AGGTAB", "GXTXAYB") == 4 : "LCS = 4 (GTAB)";
        assert lcs("", "ABC")           == 0 : "empty string";
        assert lcs("ABC", "")           == 0 : "empty string";
        assert lcs("ABC", "ABC")        == 3 : "identical strings";
        assert lcs("ABC", "DEF")        == 0 : "no common characters";
        assert lcs("A", "A")            == 1 : "single char match";

        System.out.println("PASS: LCS");
    }

    private static void testCoinChange() {
        // Greedy-fails case from Master Selector Dimension 7
        assert coinChange(new int[]{1, 3, 4}, 6) == 2 : "{1,3,4} amount=6 → 2 coins (3+3)";

        // Standard cases
        assert coinChange(new int[]{1, 5, 10, 25}, 30) == 2 : "standard coins, 30→2 (25+5)";
        assert coinChange(new int[]{1, 2, 5}, 11)       == 3 : "11→3 (5+5+1)";
        assert coinChange(new int[]{2}, 3)               == -1 : "impossible → -1";
        assert coinChange(new int[]{1}, 0)               == 0  : "amount=0 → 0 coins";
        assert coinChange(new int[]{186, 419, 83, 408}, 6249) == 20
            : "large case";

        System.out.println("PASS: Coin Change");
    }
}
