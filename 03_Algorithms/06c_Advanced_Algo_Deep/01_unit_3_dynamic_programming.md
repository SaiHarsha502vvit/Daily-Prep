# UNIT 3: DYNAMIC PROGRAMMING

> **Navigation**: [Chapter overview](../06c_Advanced_Algo_Deep.md) | [UNIT 4: BACKTRACKING →](02_unit_4_backtracking.md)
> Page 1 of 4 in **Advanced Algo Deep**


## The General Method

```
DYNAMIC PROGRAMMING:
Solve complex problems by breaking into overlapping subproblems,
solving each subproblem once, and storing results.

DP = RECURSION + MEMOIZATION (or TABULATION)

TWO APPROACHES:
1. TOP-DOWN (Memoization):
   - Start from main problem
   - Recursively solve subproblems
   - Cache results

2. BOTTOM-UP (Tabulation):
   - Start from smallest subproblems
   - Build up to main problem
   - Fill table iteratively

WHEN TO USE DP:
✓ Optimal Substructure
✓ Overlapping Subproblems
✓ Counting problems
✓ Optimization problems (min/max)
```

### 0/1 Knapsack Problem

```java
// CANNOT take fractions - either take item or don't
// Greedy FAILS here - need DP

public int knapsack01(int[] weights, int[] values, int capacity) {
    int n = weights.length;
    int[][] dp = new int[n + 1][capacity + 1];

    for (int i = 1; i <= n; i++) {
        for (int w = 0; w <= capacity; w++) {
            // Don't take item i-1
            dp[i][w] = dp[i - 1][w];

            // Take item i-1 (if it fits)
            if (weights[i - 1] <= w) {
                dp[i][w] = Math.max(
                    dp[i][w],
                    dp[i - 1][w - weights[i - 1]] + values[i - 1]
                );
            }
        }
    }

    return dp[n][capacity];
}

// VISUAL DP TABLE:
// weights = [1, 2, 3], values = [6, 10, 12], capacity = 5
//
//        w:  0   1   2   3   4   5
// item 0:    0   0   0   0   0   0
// item 1:    0   6   6   6   6   6   (w=1, v=6)
// item 2:    0   6  10  16  16  16   (w=2, v=10)
// item 3:    0   6  10  16  18  22   (w=3, v=12)
//
// Answer: 22 (items 2 and 3: weights 2+3=5, values 10+12=22)

// TIME: O(n × capacity)
// SPACE: O(n × capacity), can optimize to O(capacity)
```

### Single Source Shortest Path (Bellman-Ford)

```java
// Works with NEGATIVE weights (unlike Dijkstra)
// Can detect negative cycles

public int[] bellmanFord(int[][] edges, int n, int source) {
    int[] dist = new int[n];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[source] = 0;

    // Relax all edges (n-1) times
    for (int i = 0; i < n - 1; i++) {
        for (int[] edge : edges) {
            int u = edge[0], v = edge[1], weight = edge[2];
            if (dist[u] != Integer.MAX_VALUE &&
                dist[u] + weight < dist[v]) {
                dist[v] = dist[u] + weight;
            }
        }
    }

    // Check for negative cycle
    for (int[] edge : edges) {
        int u = edge[0], v = edge[1], weight = edge[2];
        if (dist[u] != Integer.MAX_VALUE &&
            dist[u] + weight < dist[v]) {
            throw new RuntimeException("Negative cycle detected!");
        }
    }

    return dist;
}

// VISUAL TRACE:
// Edges: [(0,1,4), (0,2,5), (1,2,-3), (2,3,4)]
// Source: 0
//
// Initial:  dist = [0, ∞, ∞, ∞]
// Pass 1:   dist = [0, 4, 5, ∞]  → [0, 4, 1, 5]
// Pass 2:   dist = [0, 4, 1, 5]  (no change)
// Pass 3:   No change → converged

// TIME: O(V × E)
```

### All Pairs Shortest Paths (Floyd-Warshall)

```java
// Find shortest path between ALL pairs of vertices
// Works with negative weights, detects negative cycles

public int[][] floydWarshall(int[][] graph, int n) {
    int[][] dist = new int[n][n];
    int INF = Integer.MAX_VALUE / 2;

    // Initialize
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            if (i == j) dist[i][j] = 0;
            else if (graph[i][j] != 0) dist[i][j] = graph[i][j];
            else dist[i][j] = INF;
        }
    }

    // DP: Consider each vertex as intermediate
    for (int k = 0; k < n; k++) {           // Intermediate vertex
        for (int i = 0; i < n; i++) {       // Source
            for (int j = 0; j < n; j++) {   // Destination
                if (dist[i][k] + dist[k][j] < dist[i][j]) {
                    dist[i][j] = dist[i][k] + dist[k][j];
                }
            }
        }
    }

    return dist;
}

// VISUAL EXAMPLE:
//     0   1   2   3
// 0 [ 0   5   ∞   10]
// 1 [ ∞   0   3   ∞ ]
// 2 [ ∞   ∞   0   1 ]
// 3 [ ∞   ∞   ∞   0 ]
//
// After k=0: No changes (0 not useful as intermediate)
// After k=1: dist[0][2] = min(∞, 5+3) = 8
// After k=2: dist[0][3] = min(10, 8+1) = 9
//            dist[1][3] = min(∞, 3+1) = 4
// After k=3: No changes
//
// Final:
//     0   1   2   3
// 0 [ 0   5   8   9 ]
// 1 [ ∞   0   3   4 ]
// 2 [ ∞   ∞   0   1 ]
// 3 [ ∞   ∞   ∞   0 ]

// TIME: O(V³)
// SPACE: O(V²)
```

### Traveling Salesperson Problem (DP with Bitmask)

```java
// Visit all cities exactly once and return to start
// Find minimum cost tour

public int tsp(int[][] dist, int n) {
    int VISITED_ALL = (1 << n) - 1;
    int[][] dp = new int[n][1 << n];

    for (int[] row : dp) Arrays.fill(row, Integer.MAX_VALUE / 2);
    dp[0][1] = 0;  // Start at city 0, only city 0 visited

    for (int mask = 1; mask <= VISITED_ALL; mask++) {
        for (int last = 0; last < n; last++) {
            if ((mask & (1 << last)) == 0) continue;  // last not in mask

            for (int next = 0; next < n; next++) {
                if ((mask & (1 << next)) != 0) continue;  // next already visited

                int newMask = mask | (1 << next);
                dp[next][newMask] = Math.min(
                    dp[next][newMask],
                    dp[last][mask] + dist[last][next]
                );
            }
        }
    }

    // Return to starting city
    int ans = Integer.MAX_VALUE;
    for (int last = 1; last < n; last++) {
        ans = Math.min(ans, dp[last][VISITED_ALL] + dist[last][0]);
    }
    return ans;
}

// VISUAL EXAMPLE (4 cities):
// dist = [[0,10,15,20],
//         [10,0,35,25],
//         [15,35,0,30],
//         [20,25,30,0]]
//
// Bitmask representation:
// 0001 = city 0 visited
// 0011 = cities 0,1 visited
// 1111 = all visited
//
// Optimal tour: 0→1→3→2→0
// Cost: 10 + 25 + 30 + 15 = 80

// TIME: O(n² × 2ⁿ)
// SPACE: O(n × 2ⁿ)
```

### String Editing (Edit Distance)

```java
// Minimum operations to convert string1 to string2
// Operations: Insert, Delete, Replace

public int editDistance(String s1, String s2) {
    int m = s1.length(), n = s2.length();
    int[][] dp = new int[m + 1][n + 1];

    // Base cases
    for (int i = 0; i <= m; i++) dp[i][0] = i;  // Delete all
    for (int j = 0; j <= n; j++) dp[0][j] = j;  // Insert all

    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (s1.charAt(i - 1) == s2.charAt(j - 1)) {
                dp[i][j] = dp[i - 1][j - 1];  // No operation
            } else {
                dp[i][j] = 1 + Math.min(
                    dp[i - 1][j - 1],  // Replace
                    Math.min(
                        dp[i - 1][j],  // Delete
                        dp[i][j - 1]   // Insert
                    )
                );
            }
        }
    }

    return dp[m][n];
}

// VISUAL DP TABLE:
// s1 = "SUNDAY", s2 = "SATURDAY"
//
//       ""  S  A  T  U  R  D  A  Y
//   ""   0  1  2  3  4  5  6  7  8
//   S    1  0  1  2  3  4  5  6  7
//   U    2  1  1  2  2  3  4  5  6
//   N    3  2  2  2  3  3  4  5  6
//   D    4  3  3  3  3  4  3  4  5
//   A    5  4  3  4  4  4  4  3  4
//   Y    6  5  4  4  5  5  5  4  3
//
// Answer: 3 (Insert A, T, R)

// TIME: O(m × n)
// SPACE: O(m × n), can optimize to O(min(m, n))
```

---

🔬 **Section Challenge — Dynamic Programming**

**Challenge 1 (State Reduction):** For Edit Distance, we allocate an $O(M \times N)$ array. How can this be optimized to $O(\min(M, N))$ space, and what is the trade-off if we need to reconstruct the actual sequence of operations (not just the minimum count)?

<details><summary>Answer</summary>

Because `dp[i][j]` only depends on `dp[i-1][j]`, `dp[i][j-1]`, and `dp[i-1][j-1]`, we only need the _current row_ and _previous row_ at any given time, reducing space to $O(\min(M, N))$. However, the trade-off is we lose the historical paths. If we need to reconstruct the actual edits (the alignment), we _must_ keep the full $O(M \times N)$ table (or use Hirschberg's algorithm, which achieves $O(M \times N)$ time and $O(M)$ space for both score and alignment via Divide & Conquer).

</details>

---

[Chapter overview](../06c_Advanced_Algo_Deep.md) | [UNIT 4: BACKTRACKING →](02_unit_4_backtracking.md)
