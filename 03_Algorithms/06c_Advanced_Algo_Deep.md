> **Navigation**: [< Previous Chapter](06a_Greedy_BitManip.md) | [Back to Index](../00_MASTER_INDEX.md)

---

✗ Coin change with unusual denominations
✗ 0/1 Knapsack (need DP)
✗ Problems requiring backtracking
```

### Fractional Knapsack Problem

```java
// CAN take fractions of items
// Greedy by value/weight ratio WORKS!

class Item {
    int value, weight;
    double ratio;

    Item(int v, int w) {
        value = v;
        weight = w;
        ratio = (double) v / w;
    }
}

public double fractionalKnapsack(Item[] items, int capacity) {
    // Sort by value/weight ratio (descending)
    Arrays.sort(items, (a, b) -> Double.compare(b.ratio, a.ratio));

    double totalValue = 0;
    int remainingCapacity = capacity;

    for (Item item : items) {
        if (remainingCapacity >= item.weight) {
            // Take whole item
            totalValue += item.value;
            remainingCapacity -= item.weight;
        } else {
            // Take fraction of item
            totalValue += item.ratio * remainingCapacity;
            break;
        }
    }

    return totalValue;
}

// VISUAL EXAMPLE:
// Items: [(60,10), (100,20), (120,30)]
// Capacity: 50
//
// Ratios: 60/10=6, 100/20=5, 120/30=4
// Sorted: [(60,10), (100,20), (120,30)]
//
// Take (60,10): value=60, capacity=40
// Take (100,20): value=160, capacity=20
// Take 20/30 of (120,30): value=160+80=240
//
// Answer: 240

// TIME: O(n log n) for sorting
```

### Job Sequencing with Deadlines

```java
// Jobs with deadlines and profits
// Schedule to maximize profit
// Each job takes 1 unit time

class Job {
    int id, deadline, profit;
    Job(int id, int d, int p) {
        this.id = id;
        deadline = d;
        profit = p;
    }
}

public int jobSequencing(Job[] jobs, int maxDeadline) {
    // Sort by profit (descending)
    Arrays.sort(jobs, (a, b) -> b.profit - a.profit);

    boolean[] slot = new boolean[maxDeadline + 1];
    int[] result = new int[maxDeadline + 1];
    int totalProfit = 0;

    for (Job job : jobs) {
        // Find latest free slot before deadline
        for (int j = job.deadline; j >= 1; j--) {
            if (!slot[j]) {
                slot[j] = true;
                result[j] = job.id;
                totalProfit += job.profit;
                break;
            }
        }
    }

    return totalProfit;
}

// VISUAL EXAMPLE:
// Jobs: [(1,2,100), (2,1,19), (3,2,27), (4,1,25), (5,3,15)]
// Sorted by profit: [J1(100), J3(27), J4(25), J2(19), J5(15)]
//
// J1: deadline=2, slot[2] free → assign
// J3: deadline=2, slot[2] taken, slot[1] free → assign
// J4: deadline=1, slot[1] taken → skip
// J2: deadline=1, slot[1] taken → skip
// J5: deadline=3, slot[3] free → assign
//
// Schedule: [J3, J1, J5] = slots [1, 2, 3]
// Profit: 27 + 100 + 15 = 142

// TIME: O(n² ) naive, O(n log n) with Union-Find
```

### Single Source Shortest Path (Dijkstra's Algorithm)

```java
// Find shortest path from source to all vertices
// Works only for non-negative weights

public int[] dijkstra(int[][] graph, int source, int n) {
    int[] dist = new int[n];
    boolean[] visited = new boolean[n];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[source] = 0;

    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[1] - b[1]);
    pq.offer(new int[]{source, 0});

    while (!pq.isEmpty()) {
        int[] curr = pq.poll();
        int u = curr[0];

        if (visited[u]) continue;
        visited[u] = true;

        for (int v = 0; v < n; v++) {
            if (graph[u][v] != 0 && !visited[v]) {
                int newDist = dist[u] + graph[u][v];
                if (newDist < dist[v]) {
                    dist[v] = newDist;
                    pq.offer(new int[]{v, newDist});
                }
            }
        }
    }

    return dist;
}

// VISUAL EXAMPLE:
//
//        (1)---4---(2)
//       / |         |
//      2  1         3
//     /   |         |
//   (0)   (3)---2---(4)
//
// From source 0:
//
// Step 1: dist = [0, ∞, ∞, ∞, ∞], visit 0
//         Update: dist[1] = 2
//
// Step 2: dist = [0, 2, ∞, ∞, ∞], visit 1
//         Update: dist[2] = 2+4 = 6
//         Update: dist[3] = 2+1 = 3
//
// Step 3: dist = [0, 2, 6, 3, ∞], visit 3
//         Update: dist[4] = 3+2 = 5
//
// Step 4: dist = [0, 2, 6, 3, 5], visit 4
//         Update: dist[2] = min(6, 5+3) = 6 (no change)
//
// Final: [0, 2, 6, 3, 5]

// TIME: O((V+E) log V) with priority queue
```

### Optimal Merge Pattern (Huffman-like)

```java
// Merge n sorted files with minimum comparisons
// Greedy: Always merge two smallest files

public int optimalMerge(int[] fileSizes) {
    PriorityQueue<Integer> pq = new PriorityQueue<>();

    for (int size : fileSizes) {
        pq.offer(size);
    }

    int totalCost = 0;

    while (pq.size() > 1) {
        int first = pq.poll();
        int second = pq.poll();
        int merged = first + second;

        totalCost += merged;
        pq.offer(merged);
    }

    return totalCost;
}

// VISUAL EXAMPLE:
// Files: [2, 3, 4, 5, 6]
//
// Merge 2+3 = 5, cost = 5
// Files: [4, 5, 5, 6]
//
// Merge 4+5 = 9, cost = 5+9 = 14
// Files: [5, 6, 9]
//
// Merge 5+6 = 11, cost = 14+11 = 25
// Files: [9, 11]
//
// Merge 9+11 = 20, cost = 25+20 = 45
//
// Total cost: 45

// TIME: O(n log n)
```

---

# UNIT 3: DYNAMIC PROGRAMMING

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

# UNIT 4: BACKTRACKING

## The General Method

```
BACKTRACKING:
Systematic way to try all possible solutions.
Build solution incrementally, abandon ("backtrack") when
solution cannot possibly be completed.

┌─────────────────────────────────────────┐
│           BACKTRACKING TEMPLATE         │
├─────────────────────────────────────────┤
│                                         │
│  void backtrack(state, choices):        │
│      if (isSolution(state)):            │
│          processSolution(state)         │
│          return                         │
│                                         │
│      for each choice in choices:        │
│          if (isValid(choice)):          │
│              makeChoice(choice)         │
│              backtrack(newState)        │
│              undoChoice(choice)  ← KEY! │
│                                         │
└─────────────────────────────────────────┘

STATE SPACE TREE:
                    []
           /    /    \    \
         [1]  [2]   [3]  [4]
         /|\   |\    |
       ...     ...  ...   (pruned branches)
```

### N-Queens Problem

```java
// Place N queens on N×N board so no two attack each other

public List<List<String>> solveNQueens(int n) {
    List<List<String>> result = new ArrayList<>();
    int[] queens = new int[n];  // queens[row] = column
    Arrays.fill(queens, -1);

    backtrack(result, queens, 0, n);
    return result;
}

private void backtrack(List<List<String>> result, int[] queens,
                       int row, int n) {
    if (row == n) {
        result.add(buildBoard(queens, n));
        return;
    }

    for (int col = 0; col < n; col++) {
        if (isValid(queens, row, col)) {
            queens[row] = col;
            backtrack(result, queens, row + 1, n);
            queens[row] = -1;  // Backtrack
        }
    }
}

private boolean isValid(int[] queens, int row, int col) {
    for (int i = 0; i < row; i++) {
        // Same column
        if (queens[i] == col) return false;
        // Diagonal
        if (Math.abs(queens[i] - col) == Math.abs(i - row)) return false;
    }
    return true;
}

// VISUAL SOLUTION for N=4:
//
// Solution 1:        Solution 2:
// . Q . .            . . Q .
// . . . Q            Q . . .
// Q . . .            . . . Q
// . . Q .            . Q . .
//
// State Space Tree (partial):
//                    []
//            /    |    |    \
//          Q0    Q1   Q2   Q3  (row 0, columns 0-3)
//         / |    /\
//       ×  Q3  Q3 ×    (row 1, try each column)
//           |
//          Q0        (row 2)
//           |
//          Q2        (row 3) ✓ SOLUTION

// TIME: O(N!)
// SPACE: O(N) for recursion stack
```

### Sum of Subsets Problem

```java
// Find all subsets that sum to target

public List<List<Integer>> subsetSum(int[] nums, int target) {
    List<List<Integer>> result = new ArrayList<>();
    Arrays.sort(nums);  // For pruning
    backtrack(result, new ArrayList<>(), nums, target, 0);
    return result;
}

private void backtrack(List<List<Integer>> result, List<Integer> current,
                       int[] nums, int remaining, int start) {
    if (remaining == 0) {
        result.add(new ArrayList<>(current));
        return;
    }

    for (int i = start; i < nums.length; i++) {
        // Pruning: if number too large, all following are too (sorted)
        if (nums[i] > remaining) break;

        // Skip duplicates
        if (i > start && nums[i] == nums[i - 1]) continue;

        current.add(nums[i]);
        backtrack(result, current, nums, remaining - nums[i], i + 1);
        current.remove(current.size() - 1);  // Backtrack
    }
}

// VISUAL EXAMPLE:
// nums = [2, 3, 5, 7], target = 10
//
// State Space Tree:
//                         []
//           /        |        |       \
//         [2]       [3]      [5]     [7]
//        / | \      /  \       |
//     [2,3][2,5][2,7] [3,5][3,7] [5,7]×
//      |     |
//   [2,3,5] [2,5,7]×
//     ×
//
// Solutions: [3,7], [2,3,5]

// TIME: O(2ⁿ) worst case
```

### Graph Coloring Problem

```java
// Color graph with m colors so no adjacent vertices have same color

public boolean graphColoring(int[][] graph, int m, int n) {
    int[] colors = new int[n];
    return backtrack(graph, colors, m, 0);
}

private boolean backtrack(int[][] graph, int[] colors, int m, int vertex) {
    if (vertex == colors.length) {
        return true;  // All vertices colored
    }

    for (int c = 1; c <= m; c++) {
        if (isSafe(graph, colors, vertex, c)) {
            colors[vertex] = c;
            if (backtrack(graph, colors, m, vertex + 1)) {
                return true;
            }
            colors[vertex] = 0;  // Backtrack
        }
    }

    return false;  // No valid coloring
}

private boolean isSafe(int[][] graph, int[] colors, int vertex, int color) {
    for (int i = 0; i < colors.length; i++) {
        if (graph[vertex][i] == 1 && colors[i] == color) {
            return false;
        }
    }
    return true;
}

// VISUAL EXAMPLE:
// Graph:     0---1
//            |\ /|
//            | X |
//            |/ \|
//            3---2
//
// m=3 colors (R=1, G=2, B=3)
//
// vertex 0: try R → colors = [R, _, _, _]
// vertex 1: try R (conflict with 0)
//           try G → colors = [R, G, _, _]
// vertex 2: try R (conflict with 0)
//           try G (conflict with 1)
//           try B → colors = [R, G, B, _]
// vertex 3: try R (conflict with 0)
//           try G → colors = [R, G, B, G]
//
// Valid coloring found!
```

### Hamiltonian Cycle Problem

```java
// Find cycle that visits every vertex exactly once

public List<Integer> hamiltonianCycle(int[][] graph, int n) {
    int[] path = new int[n];
    Arrays.fill(path, -1);
    path[0] = 0;  // Start at vertex 0

    if (backtrack(graph, path, 1)) {
        List<Integer> result = new ArrayList<>();
        for (int v : path) result.add(v);
        result.add(0);  // Complete the cycle
        return result;
    }
    return null;
}

private boolean backtrack(int[][] graph, int[] path, int pos) {
    if (pos == path.length) {
        // Check if there's edge from last vertex to first
        return graph[path[pos - 1]][path[0]] == 1;
    }

    for (int v = 1; v < path.length; v++) {
        if (isSafe(graph, path, pos, v)) {
            path[pos] = v;
            if (backtrack(graph, path, pos + 1)) {
                return true;
            }
            path[pos] = -1;  // Backtrack
        }
    }

    return false;
}

private boolean isSafe(int[][] graph, int[] path, int pos, int v) {
    // Check if v is adjacent to previously added vertex
    if (graph[path[pos - 1]][v] == 0) return false;

    // Check if v already in path
    for (int i = 0; i < pos; i++) {
        if (path[i] == v) return false;
    }

    return true;
}

// VISUAL EXAMPLE:
// Graph:
//     0---1
//    /|   |\
//   3 |   | 2
//    \|   |/
//     4---5
//
// Finding Hamiltonian Cycle starting from 0:
// 0 → 1 → 2 → 5 → 4 → 3 → 0 ✓

// TIME: O(N!) worst case
```

---

# UNIT 5: BRANCH AND BOUND

## The General Method

```
BRANCH AND BOUND:
Like backtracking, but uses BOUNDS to prune more aggressively.

KEY DIFFERENCE FROM BACKTRACKING:
- Backtracking: Prune when solution CANNOT be completed
- Branch & Bound: Prune when solution CANNOT be optimal

COMPONENTS:
1. BRANCHING: Split problem into subproblems
2. BOUNDING: Calculate bounds for each subproblem
3. PRUNING: Discard subproblems with bad bounds

┌─────────────────────────────────────────┐
│        BRANCH AND BOUND TYPES           │
├─────────────────────────────────────────┤
│                                         │
│  FIFO (BFS-like):                       │
│    - Process nodes in queue order       │
│    - Explores level by level            │
│                                         │
│  LC (Least Cost):                       │
│    - Process most promising node first  │
│    - Uses priority queue                │
│                                         │
│  LIFO (DFS-like):                       │
│    - Process most recent node first     │
│    - Memory efficient                   │
│                                         │
└─────────────────────────────────────────┘
```

### 0/1 Knapsack using Branch and Bound

```java
class Node {
    int level, profit, weight;
    double bound;
}

public int knapsackBB(int[] values, int[] weights, int capacity) {
    int n = values.length;

    // Sort by value/weight ratio
    Integer[] idx = new Integer[n];
    for (int i = 0; i < n; i++) idx[i] = i;
    Arrays.sort(idx, (a, b) ->
        Double.compare((double)values[b]/weights[b],
                      (double)values[a]/weights[a]));

    PriorityQueue<Node> pq = new PriorityQueue<>(
        (a, b) -> Double.compare(b.bound, a.bound)
    );

    Node root = new Node();
    root.level = -1;
    root.profit = 0;
    root.weight = 0;
    root.bound = calculateBound(root, values, weights, capacity, idx, n);

    pq.offer(root);
    int maxProfit = 0;

    while (!pq.isEmpty()) {
        Node node = pq.poll();

        if (node.bound <= maxProfit) continue;  // Prune!

        int i = node.level + 1;
        if (i >= n) continue;

        int itemIdx = idx[i];

        // Include item
        Node include = new Node();
        include.level = i;
        include.weight = node.weight + weights[itemIdx];
        include.profit = node.profit + values[itemIdx];

        if (include.weight <= capacity) {
            maxProfit = Math.max(maxProfit, include.profit);
            include.bound = calculateBound(include, values, weights,
                                          capacity, idx, n);
            if (include.bound > maxProfit) {
                pq.offer(include);
            }
        }

        // Exclude item
        Node exclude = new Node();
        exclude.level = i;
        exclude.weight = node.weight;
        exclude.profit = node.profit;
        exclude.bound = calculateBound(exclude, values, weights,
                                       capacity, idx, n);
        if (exclude.bound > maxProfit) {
            pq.offer(exclude);
        }
    }

    return maxProfit;
}

// Bound = current profit + fractional knapsack on remaining items
private double calculateBound(Node node, int[] values, int[] weights,
                              int capacity, Integer[] idx, int n) {
    if (node.weight >= capacity) return 0;

    double bound = node.profit;
    int w = node.weight;
    int i = node.level + 1;

    while (i < n && w + weights[idx[i]] <= capacity) {
        w += weights[idx[i]];
        bound += values[idx[i]];
        i++;
    }

    if (i < n) {
        bound += (capacity - w) * ((double)values[idx[i]] / weights[idx[i]]);
    }

    return bound;
}

// VISUAL EXAMPLE:
// values = [40, 30, 50, 10], weights = [2, 5, 10, 5], capacity = 16
// Sorted by ratio: items [0, 1, 2, 3] with ratios [20, 6, 5, 2]
//
// Root: profit=0, weight=0, bound=98
//
//                    [root, bound=98]
//                   /              \
//         [include 0]          [exclude 0]
//         p=40,w=2              p=0,w=0
//         bound=98              bound=58
//              |                     |
//         [include 1]          (explored...)
//         p=70,w=7
//         bound=80
//              |
//         [include 2]
//         p=120,w=17 > capacity (PRUNED)
//              |
//         [exclude 2]
//         p=70,w=7
//         bound=76
```

### Traveling Salesperson using Branch and Bound

```java
// Find minimum cost Hamiltonian cycle

class TSPNode {
    int level;
    int[] path;
    boolean[] visited;
    int cost;
    int bound;
}

public int tspBranchBound(int[][] dist, int n) {
    PriorityQueue<TSPNode> pq = new PriorityQueue<>(
        (a, b) -> a.bound - b.bound
    );

    TSPNode root = createNode(dist, n, -1, 0);
    root.path[0] = 0;
    root.visited[0] = true;
    root.level = 0;
    root.cost = 0;
    root.bound = calculateBound(root, dist, n);

    pq.offer(root);
    int minCost = Integer.MAX_VALUE;

    while (!pq.isEmpty()) {
        TSPNode node = pq.poll();

        if (node.bound >= minCost) continue;  // Prune

        if (node.level == n - 1) {
            // Complete tour
            int lastCity = node.path[node.level];
            int tourCost = node.cost + dist[lastCity][0];
            minCost = Math.min(minCost, tourCost);
            continue;
        }

        for (int city = 0; city < n; city++) {
            if (!node.visited[city]) {
                TSPNode child = createChild(node, dist, n, city);
                if (child.bound < minCost) {
                    pq.offer(child);
                }
            }
        }
    }

    return minCost;
}

// Bound calculation: Cost so far + minimum outgoing edges from unvisited
private int calculateBound(TSPNode node, int[][] dist, int n) {
    int bound = node.cost;

    for (int i = 0; i < n; i++) {
        if (!node.visited[i] || i == node.path[node.level]) {
            int minEdge = Integer.MAX_VALUE;
            for (int j = 0; j < n; j++) {
                if (i != j && (!node.visited[j] || j == 0)) {
                    minEdge = Math.min(minEdge, dist[i][j]);
                }
            }
            bound += minEdge;
        }
    }

    return bound;
}
```

---

# NP-HARD AND NP-COMPLETE

## Basic Concepts

```
COMPLEXITY CLASSES:

P (Polynomial):
  - Problems solvable in polynomial time
  - Examples: Sorting, Searching, Shortest Path

NP (Nondeterministic Polynomial):
  - Solutions verifiable in polynomial time
  - Examples: SAT, Traveling Salesman, Graph Coloring

NP-Complete:
  - Hardest problems in NP
  - If any NP-Complete solved in P → P = NP
  - Examples: SAT, 3-SAT, Vertex Cover, Hamiltonian Cycle

NP-Hard:
  - At least as hard as NP-Complete
  - May not be in NP (not verifiable in poly time)
  - Examples: Halting Problem, TSP Optimization

┌─────────────────────────────────────────┐
│                 NP-Hard                 │
│         ┌───────────────────┐           │
│         │   NP-Complete     │           │
│    ┌────┼──────┐            │           │
│    │ P  │      │    NP      │           │
│    │    │      │            │           │
│    └────┼──────┘            │           │
│         └───────────────────┘           │
└─────────────────────────────────────────┘
        (If P ≠ NP, which is believed)
```

## Cook's Theorem

```
COOK'S THEOREM (1971):
SAT (Boolean Satisfiability) is NP-Complete.

SIGNIFICANCE:
- First problem proven to be NP-Complete
- All other NP-Complete proofs reduce FROM SAT

SAT PROBLEM:
Given a Boolean formula, is there an assignment
of TRUE/FALSE to variables that makes it TRUE?

Example: (x₁ ∨ ¬x₂) ∧ (¬x₁ ∨ x₃) ∧ (x₂ ∨ x₃)
Solution: x₁=TRUE, x₂=FALSE, x₃=TRUE

3-SAT:
Each clause has exactly 3 literals.
Also NP-Complete.

PROVING NP-COMPLETENESS:
1. Show problem is in NP (solution verifiable in poly time)
2. Reduce known NP-Complete problem TO your problem
3. The reduction must be polynomial time
```

## Famous NP-Complete Problems

```
1. SATISFIABILITY (SAT)
   Input: Boolean formula
   Question: Is there a satisfying assignment?

2. VERTEX COVER
   Input: Graph G, integer k
   Question: Is there a set of ≤k vertices covering all edges?

3. CLIQUE
   Input: Graph G, integer k
   Question: Is there a complete subgraph of size k?

4. HAMILTONIAN CYCLE
   Input: Graph G
   Question: Is there a cycle visiting all vertices exactly once?

5. SUBSET SUM
   Input: Set of integers, target sum S
   Question: Is there a subset summing to S?

6. GRAPH COLORING
   Input: Graph G, integer k
   Question: Can vertices be colored with k colors (no adjacent same)?

REDUCTION CHAIN:
SAT → 3-SAT → CLIQUE → VERTEX COVER → HAMILTONIAN → TSP
```

---

> **Next**: [Part B: Advanced Patterns & Competitive Programming](06e_Algorithm_Patterns.md)

---

> **Navigation**: [< Previous](06a_Greedy_BitManip.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](06d_String_Algorithms.md)
