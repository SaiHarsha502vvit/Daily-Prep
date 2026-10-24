# 🌳 DP on Trees

> **Navigation**: [← Interval DP — Optimal Substructure on Ranges](06_interval_dp_optimal_substructure_on_ranges.md) | [Chapter overview](../04c_DP_Advanced.md)
> Page 7 of 7 in **Advanced DP Patterns**


**TREE DP - THE PATTERN**

```text
WHEN TO USE: Compute optimal values on tree structures

KEY INSIGHT: Process children first (post-order), then compute parent

BASIC TREE DP - MAXIMUM INDEPENDENT SET:
─────────────────────────────────────────
```

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

**TREE DIAMETER:**

```text
──────────────
```

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

```text
REROOTING TECHNIQUE (for all-roots DP):
─────────────────────────────────────────
```

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

```text
```

## ⚡ DP Optimizations — Convex Hull Trick

**CONVEX HULL TRICK (CHT)**

```text
WHEN TO USE: Recurrence of form dp[i] = min(dp[j] + b[j] _ a[i]) for j < i
Reduces O(n²) to O(n) or O(n log n)

CONDITIONS:
• Slopes b[j] are monotonic
• Query values a[i] are monotonic
• Want minimum (or can convert to minimum)

INTUITION:
───────────
Each j gives a line: y = b[j] _ x + dp[j]
Query for x = a[i]: find line with minimum y
Maintain lower convex hull of lines

VISUALIZATION:
y │
│ ╱ line 3 (b=4)
│ ╱
│╱ ╱ line 2 (b=2)
│ ╱
│ ╱ ╱ line 1 (b=1)
│ ╱ ╱
│ ╱ ╱
│╱──╱───────────────── x
╱╲
╱ ╲ Convex hull (only these lines can be optimal)

IMPLEMENTATION (monotonic slopes and queries):
─────────────────────────────────────────────
```

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

**COMPLEXITY:**

```text
• Amortized O(1) per addLine and query if both are monotonic
• O(log n) per query with binary search if queries not monotonic
```

## ⚡ Divide and Conquer DP Optimization

**DIVIDE AND CONQUER DP**

```text
WHEN TO USE: dp[i][j] = min(dp[i-1][k] + cost(k+1, j)) for k < j
And: optimal k for j₁ ≤ optimal k for j₂ when j₁ < j₂
(This is the "monotonicity of optimal splits" property)

Reduces O(n × m × n) to O(n × m × log n)

IMPLEMENTATION:
───────────────
```

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

```text
EXAMPLE: Partition array into k subarrays, minimize max sum
──────────────────────────────────────────────────────────
```

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

```text
```

## 📌 Broken Profile DP (plug DP)

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
```

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

```text
Time: O(m × n × 2^n)
Space: O(2^n)
Practical for n ≤ 15-20
```

## 🎨 DP Pattern Quick Reference

DP PATTERNS QUICK REFERENCE

```text
──────────────────────────────────────────────────
```

## Pattern │ Signal │ Time │ Space

```text
| Linear DP | One sequence | O(n) | O(1) to O(n) |
| Two-sequence DP | Compare two strings | O(nm) | O(m) with rolling |
| Interval DP | Range [i,j] optimal | O(n³) | O(n²) |
| Tree DP | Tree structure | O(n) | O(n) |
| Bitmask DP | n ≤ 20, subsets | O(2ⁿ × n) | O(2ⁿ) |
| Digit DP | Count in range [L,R] | O(d × s) | O(d × s) |
| Broken Profile | Grid, width ≤ 20 | O(nm × 2ᵐ)| O(2ᵐ) |
| D&C Optimization | Monotonic opt split | O(nm log n)| O(nm) |
| Convex Hull Trick| Linear transition | O(n) | O(n) |
| Knuth Optimization|Quadratic → near-linear | O(n²) | O(n²) |

---

_DP is not about memorizing solutions - it's about SEEING the substructure!_
```


---

## PRACTICE PROBLEMS — Dynamic Programming (Progressive)

### Level 1: 1D DP (Start Here)

| #   | Problem                        | Difficulty | Source | DP Type                       |
| --- | ------------------------------ | ---------- | ------ | ----------------------------- |
| 1   | Climbing Stairs                | Easy       | LC 70  | Fibonacci variant             |
| 2   | House Robber                   | Medium     | LC 198 | Take/skip                     |
| 3   | Min Cost Climbing Stairs       | Easy       | LC 746 | Forward/backward DP           |
| 4   | Maximum Subarray               | Medium     | LC 53  | Kadane's                      |
| 5   | Decode Ways                    | Medium     | LC 91  | String DP                     |
| 6   | Coin Change                    | Medium     | LC 322 | Unbounded knapsack            |
| 7   | Longest Increasing Subsequence | Medium     | LC 300 | LIS (O(n log n) optimization) |
| 8   | Word Break                     | Medium     | LC 139 | Prefix matching DP            |
| 9   | Perfect Squares                | Medium     | LC 279 | Min decomposition             |
| 10  | Jump Game                      | Medium     | LC 55  | Greedy or DP                  |

### Level 2: 2D DP

| #   | Problem                         | Difficulty | Source  | DP Type             |
| --- | ------------------------------- | ---------- | ------- | ------------------- |
| 1   | Unique Paths                    | Medium     | LC 62   | Grid DP             |
| 2   | Minimum Path Sum                | Medium     | LC 64   | Grid DP             |
| 3   | Longest Common Subsequence      | Medium     | LC 1143 | Classic LCS         |
| 4   | Edit Distance                   | Medium     | LC 72   | String to string    |
| 5   | 0/1 Knapsack                    | Medium     | Classic | Weight/value table  |
| 6   | Coin Change 2                   | Medium     | LC 518  | Count combinations  |
| 7   | Target Sum                      | Medium     | LC 494  | Subset sum variant  |
| 8   | Interleaving String             | Medium     | LC 97   | Two-string matching |
| 9   | Maximal Square                  | Medium     | LC 221  | 2D min expansion    |
| 10  | Longest Palindromic Subsequence | Medium     | LC 516  | Reverse + LCS       |

### Level 3: Advanced DP

| #   | Problem                              | Difficulty | Source  | DP Type                   |
| --- | ------------------------------------ | ---------- | ------- | ------------------------- |
| 1   | Longest Palindromic Substring        | Medium     | LC 5    | Expand center or DP       |
| 2   | Regular Expression Matching          | Hard       | LC 10   | Two-string with wildcards |
| 3   | Burst Balloons                       | Hard       | LC 312  | Interval DP               |
| 4   | Partition Equal Subset Sum           | Medium     | LC 416  | Subset sum                |
| 5   | House Robber III                     | Medium     | LC 337  | Tree DP                   |
| 6   | Stone Game                           | Medium     | LC 877  | Game theory DP            |
| 7   | Minimum Cost to Cut a Stick          | Hard       | LC 1547 | Interval DP               |
| 8   | Distinct Subsequences                | Hard       | LC 115  | Counting DP               |
| 9   | Best Time Buy Sell Stock w/ Cooldown | Medium     | LC 309  | State machine DP          |
| 10  | Palindrome Partitioning II           | Hard       | LC 132  | Min cuts DP               |

**Hidden Gems:**

| Problem                          | Source | Why It's Great                              |
| -------------------------------- | ------ | ------------------------------------------- |
| Minimum Falling Path Sum         | LC 931 | Simple 2D DP — great for building intuition |
| Delete Operation for Two Strings | LC 583 | LCS variant — easier entry to edit distance |
| Ones and Zeroes                  | LC 474 | 2D knapsack with two weight dimensions      |
| Maximum Length of Pair Chain     | LC 646 | Greedy or DP — compare both approaches      |
| Largest Divisible Subset         | LC 368 | LIS variant with divisibility               |
| Counting Bits                    | LC 338 | DP on bits — beautiful O(n) pattern         |

---

## Proof Corner — Optimal Substructure and DP Correctness

**Claim**: The 2D grid shortest-path DP `dp[i][j] = grid[i][j] + min(dp[i-1][j], dp[i][j-1])` computes the minimum-cost path from (0,0) to (i,j).

**Proof by strong induction on i+j**:

- **Base** (i+j=0): `dp[0][0] = grid[0][0]`. The only path is the cell itself. Correct.
- **Inductive step**: Assume dp is correct for all cells (r,c) with r+c < i+j. Any path to (i,j) arrives from (i-1,j) or (i,j-1). By the inductive hypothesis both `dp[i-1][j]` and `dp[i][j-1]` are the minimum-cost paths to those cells. Taking the min and adding `grid[i][j]` gives the optimal. QED.

**Why this matters**: The argument generalises to all "prefix-suffix" DP (LCS, Edit Distance, Matrix Chain): the optimal answer for a sub-range depends only on optimal answers for strictly smaller sub-ranges — the optimal-substructure property.

**Knapsack 0/1 loop-invariant**: After processing items 1..i with capacity w, `dp[i][w]` = maximum value using a subset of items {1..i} with total weight ≤ w.

- *Init*: `dp[0][w] = 0` for all w — no items, no value.
- *Maintenance*: `dp[i][w] = max(dp[i-1][w], dp[i-1][w - weight[i]] + value[i])` — either skip item i (use same previous row) or take it (reduce capacity).
- *Termination*: `dp[n][W]` holds the answer for all n items, capacity W.

**Backward inner loop correctness**: In the 1D rolling array, scanning `w` from W down to `weight[i]` ensures each item is used at most once: when we update `dp[w]`, `dp[w - weight[i]]` still reflects the state *before* item i was considered.

---

## When Advanced DP Breaks

**1. Wrong state dimensionality** — adding a state variable that depends on the *output* of the DP, not just the *input*. Example: trying to encode "which items were chosen" in the state blows up to O(2^n) states. Fix: traceback through `dp[][]` after computing the answer.

**2. Unbounded vs 0/1 loop direction** — using forward inner loop (`w = weight[i] to W`) for a 0/1 knapsack lets item i contribute multiple times, accidentally solving the unbounded variant. The subtle symptom: "I can take 3 of item 2" on a test with repeated values.

**3. HashMap with mutable/array keys** — `Map<int[], Integer>` uses reference equality in Java, so two `new int[]{1,2}` keys never match. Fix: `Arrays.toString(arr)` as key, or encode as a long (if dimensions allow).

**4. Base-case off-by-one in string DP** — LCS/Edit Distance uses 1-indexed strings over a (n+1)×(m+1) table with row/col 0 = empty string. Forgetting to initialise `dp[i][0] = i` (delete i characters) breaks the edit-distance base case.

**5. Integer overflow in counting DP** — "count the number of ways" problems easily overflow int (LC 91, LC 70). Use `long`; if mod is required, apply `% MOD` at every addition, not just at the end.

---

## Reference Anchor

**Apache Commons Text — LevenshteinDistance**:
```java
// commons-text 1.10: org.apache.commons.text.similarity.LevenshteinDistance
// Uses O(min(m,n)) rolling-array — exactly the 1D knapsack trick applied to edit distance
LevenshteinDistance ld = LevenshteinDistance.getDefaultInstance();
int dist = ld.apply("kitten", "sitting"); // 3
// Source: commons-text/src/main/java/org/apache/commons/text/similarity/LevenshteinDistance.java
// Key invariant: dp[j] at start of outer loop i = edit distance between s1[0..i-1] and s2[0..j-1]
```

**JDK — String.intern() and the LCS/Edit Distance connection**:
```java
// java.lang.String.intern() pools identical strings, so repeated substring comparisons
// in naive O(n^2*m^2) LCS variants use reference equality after interning.
// Modern approach: use dp[i][j] directly on char arrays (no String creation in inner loop).
String a = "ABCBDAB";
char[] ca = a.toCharArray();  // avoid charAt overhead in tight loops
```

**JDK — Arrays.fill for DP initialisation**:
```java
int[][] dp = new int[n+1][m+1];
// Fill entire 2D array with -1 for memoization:
for (int[] row : dp) Arrays.fill(row, -1);
```

---

## Brute Force to Optimal

| Problem | Brute Force | Why Slow | DP Solution | Complexity |
|---------|-------------|----------|-------------|------------|
| 0/1 Knapsack | Try all 2^n subsets | Exponential | 1D rolling dp[w] | O(n·W) |
| LCS | Try all 2^n subsequences of s1 | Exponential | dp[i][j] = LCS of s1[0..i], s2[0..j] | O(nm) |
| Edit Distance | Try all edit sequences (exponential) | Exponential | dp[i][j] via 3-way recurrence | O(nm) |
| Fibonacci | Naive recursion — 2^n calls | O(2^n) | Bottom-up dp[i] = dp[i-1]+dp[i-2] | O(n) |
| Matrix Chain | Try all n! orderings | O(n!) | Interval DP dp[i][j] = min over k | O(n^3) |

**The structural insight**: brute force fails when sub-problems *overlap* (same (i,j) computed many times). DP trades time for space by storing sub-problem answers. When sub-problems don't overlap, divide-and-conquer without memoization is sufficient.

---

[← Interval DP — Optimal Substructure on Ranges](06_interval_dp_optimal_substructure_on_ranges.md) | [Chapter overview](../04c_DP_Advanced.md)
