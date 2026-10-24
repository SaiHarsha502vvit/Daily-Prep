# 10.2 2D Dynamic Programming

> **Navigation**: [← 10.1 1D Dynamic Programming](02_dynamic_programming.md) | [Chapter overview](../11_Dynamic_Programming.md) | [10.3 Knapsack Problems →](04_knapsack_problems.md)
> Page 3 of 5 in **Dynamic Programming**


**Pattern:** `dp[i][j]` = answer at grid cell (i,j) or matching i elements of seq1 with j elements of seq2.
**Grid problems:** `dp[i][j] = dp[i-1][j] + dp[i][j-1]` (paths) or `min(dp[i-1][j], dp[i][j-1]) + grid[i][j]` (cost).
**Two-sequence:** Build a 2D table. Diagonal = match, else take best of skipping one from each sequence.

## Problem 164: Unique Paths

**LeetCode 62** 🔗 https://leetcode.com/problems/unique-paths/

```
┌────────────────────────────────────────────────────────────────┐
│  UNIQUE PATHS - Count paths from top-left to bottom-right      │
├────────────────────────────────────────────────────────────────┤
│  m = 3, n = 7 (3 rows, 7 cols)                                 │
│                                                                │
│  ┌───┬───┬───┬───┬───┬───┬───┐                                 │
│  │ 1 │ 1 │ 1 │ 1 │ 1 │ 1 │ 1 │                                 │
│  ├───┼───┼───┼───┼───┼───┼───┤                                 │
│  │ 1 │ 2 │ 3 │ 4 │ 5 │ 6 │ 7 │                                 │
│  ├───┼───┼───┼───┼───┼───┼───┤                                 │
│  │ 1 │ 3 │ 6 │10 │15 │21 │28 │                                 │
│  └───┴───┴───┴───┴───┴───┴───┘                                 │
│                                                                │
│  dp[i][j] = dp[i-1][j] + dp[i][j-1]                            │
│  Output: 28 paths                                              │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int uniquePaths(int m, int n) {
    int[] dp = new int[n];
    Arrays.fill(dp, 1);

    for (int i = 1; i < m; i++) {
        for (int j = 1; j < n; j++) {
            dp[j] = dp[j] + dp[j - 1];
        }
    }

    return dp[n - 1];
}
```

---

## Problem 165: Unique Paths II (With Obstacles)

**LeetCode 63** 🔗 https://leetcode.com/problems/unique-paths-ii/

```
┌────────────────────────────────────────────────────────────────┐
│  UNIQUE PATHS II - Grid with obstacles                         │
├────────────────────────────────────────────────────────────────┤
│  grid = [[0,0,0],                                              │
│          [0,1,0],    1 = obstacle                              │
│          [0,0,0]]                                              │
│                                                                │
│  ┌───┬───┬───┐                                                 │
│  │ 1 │ 1 │ 1 │                                                 │
│  ├───┼───┼───┤                                                 │
│  │ 1 │ X │ 1 │    X = blocked                                  │
│  ├───┼───┼───┤                                                 │
│  │ 1 │ 1 │ 2 │                                                 │
│  └───┴───┴───┘                                                 │
│                                                                │
│  Output: 2 paths                                               │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int uniquePathsWithObstacles(int[][] grid) {
    int m = grid.length, n = grid[0].length;

    if (grid[0][0] == 1) return 0;

    int[] dp = new int[n];
    dp[0] = 1;

    for (int i = 0; i < m; i++) {
        for (int j = 0; j < n; j++) {
            if (grid[i][j] == 1) {
                dp[j] = 0;
            } else if (j > 0) {
                dp[j] = dp[j] + dp[j - 1];
            }
        }
    }

    return dp[n - 1];
}
```

---

## Problem 166: Minimum Path Sum

**LeetCode 64** 🔗 https://leetcode.com/problems/minimum-path-sum/

```
┌────────────────────────────────────────────────────────────────┐
│  MINIMUM PATH SUM - Min cost path top-left to bottom-right     │
├────────────────────────────────────────────────────────────────┤
│  grid = [[1,3,1],                                              │
│          [1,5,1],                                              │
│          [4,2,1]]                                              │
│                                                                │
│  ┌───┬───┬───┐     ┌───┬───┬───┐                               │
│  │ 1 │ 3 │ 1 │     │ 1 │ 4 │ 5 │  dp values                    │
│  ├───┼───┼───┤  →  ├───┼───┼───┤                               │
│  │ 1 │ 5 │ 1 │     │ 2 │ 7 │ 6 │                               │
│  ├───┼───┼───┤     ├───┼───┼───┤                               │
│  │ 4 │ 2 │ 1 │     │ 6 │ 8 │ 7 │                               │
│  └───┴───┴───┘     └───┴───┴───┘                               │
│                                                                │
│  Path: 1→3→1→1→1 = 7                                           │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int minPathSum(int[][] grid) {
    int m = grid.length, n = grid[0].length;

    for (int i = 0; i < m; i++) {
        for (int j = 0; j < n; j++) {
            if (i == 0 && j == 0) continue;
            else if (i == 0) grid[i][j] += grid[i][j-1];
            else if (j == 0) grid[i][j] += grid[i-1][j];
            else grid[i][j] += Math.min(grid[i-1][j], grid[i][j-1]);
        }
    }

    return grid[m-1][n-1];
}
```

---

## Problem 167: Longest Common Subsequence

**LeetCode 1143** 🔗 https://leetcode.com/problems/longest-common-subsequence/

**LONGEST COMMON SUBSEQUENCE**

```text
text1 = "abcde", text2 = "ace"

    ""  a  c  e
""   0  0  0  0
a    0  1  1  1     If match: dp[i][j] = dp[i-1][j-1] + 1
b    0  1  1  1     Else: dp[i][j] = max(dp[i-1][j],
c    0  1  2  2                          dp[i][j-1])
d    0  1  2  2
e    0  1  2  3

LCS = "ace", length = 3
```

**Solution:**

```java
public int longestCommonSubsequence(String text1, String text2) {
    int m = text1.length(), n = text2.length();
    int[][] dp = new int[m + 1][n + 1];

    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (text1.charAt(i-1) == text2.charAt(j-1)) {
                dp[i][j] = dp[i-1][j-1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i-1][j], dp[i][j-1]);
            }
        }
    }

    return dp[m][n];
}
```

---

## Problem 168: Edit Distance

💡 **Approach:** Classic 2-sequence DP. `dp[i][j]` = min operations to convert `word1[0..i-1]` to `word2[0..j-1]`.
Three choices at each step: Insert (`dp[i][j-1]+1`), Delete (`dp[i-1][j]+1`), Replace (`dp[i-1][j-1]+1`).
If characters match: `dp[i][j] = dp[i-1][j-1]` (no operation needed).
**Why this matters:** Used in spell-check, DNA sequence alignment, diff tools.
**Time:** O(mn) | **Space:** O(mn), optimizable to O(min(m,n))

**LeetCode 72** 🔗 https://leetcode.com/problems/edit-distance/

**EDIT DISTANCE - Min operations to convert word1 to word2**

```text
word1 = "horse", word2 = "ros"
Operations: Insert, Delete, Replace

    ""  r  o  s
""   0  1  2  3
h    1  1  2  3    If match: dp[i][j] = dp[i-1][j-1]
o    2  2  1  2    Else: 1 + min(dp[i-1][j],    // delete
r    3  2  2  2                 dp[i][j-1],    // insert
s    4  3  3  2                 dp[i-1][j-1])  // replace
e    5  4  4  3

Output: 3 (horse → rorse → rose → ros)
```

**Solution:**

```java
public int minDistance(String word1, String word2) {
    int m = word1.length(), n = word2.length();
    int[][] dp = new int[m + 1][n + 1];

    // Base cases
    for (int i = 0; i <= m; i++) dp[i][0] = i;
    for (int j = 0; j <= n; j++) dp[0][j] = j;

    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (word1.charAt(i-1) == word2.charAt(j-1)) {
                dp[i][j] = dp[i-1][j-1];
            } else {
                dp[i][j] = 1 + Math.min(dp[i-1][j-1],
                               Math.min(dp[i-1][j], dp[i][j-1]));
            }
        }
    }

    return dp[m][n];
}
```

---

[← 10.1 1D Dynamic Programming](02_dynamic_programming.md) | [Chapter overview](../11_Dynamic_Programming.md) | [10.3 Knapsack Problems →](04_knapsack_problems.md)
