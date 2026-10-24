# UNIT 5: BRANCH AND BOUND

> **Navigation**: [← UNIT 4: BACKTRACKING](02_unit_4_backtracking.md) | [Chapter overview](../06c_Advanced_Algo_Deep.md) | [NP-HARD AND NP-COMPLETE →](04_np_hard_and_np_complete.md)
> Page 3 of 4 in **Advanced Algo Deep**


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

[← UNIT 4: BACKTRACKING](02_unit_4_backtracking.md) | [Chapter overview](../06c_Advanced_Algo_Deep.md) | [NP-HARD AND NP-COMPLETE →](04_np_hard_and_np_complete.md)
