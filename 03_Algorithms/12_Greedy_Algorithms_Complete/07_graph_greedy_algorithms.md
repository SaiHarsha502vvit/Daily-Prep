# Graph Greedy Algorithms <a name="graph-greedy"></a>

> **Navigation**: [← String Greedy Problems](06_string_greedy_problems.md) | [Chapter overview](../12_Greedy_Algorithms_Complete.md)
> Page 7 of 7 in **Greedy Algorithms Complete Guide**


## Kruskal's MST (Minimum Spanning Tree)

```java
/*
Find minimum cost edges to connect all vertices.
Greedy: Sort edges by weight, add if doesn't create cycle.
Use Union-Find to detect cycles.
*/

public int kruskalMST(int n, int[][] edges) {
    // edges[i] = [u, v, weight]
    Arrays.sort(edges, (a, b) -> a[2] - b[2]);

    int[] parent = new int[n];
    for (int i = 0; i < n; i++) parent[i] = i;

    int cost = 0, edgeCount = 0;

    for (int[] edge : edges) {
        int u = edge[0], v = edge[1], w = edge[2];

        if (find(parent, u) != find(parent, v)) {
            union(parent, u, v);
            cost += w;
            edgeCount++;
            if (edgeCount == n - 1) break;  // MST complete
        }
    }
    return cost;
}

private int find(int[] parent, int x) {
    if (parent[x] != x) parent[x] = find(parent, parent[x]);
    return parent[x];
}

private void union(int[] parent, int x, int y) {
    parent[find(parent, x)] = find(parent, y);
}
```

## Prim's MST

```java
/*
Start from any vertex, always add minimum edge to unvisited vertex.
Use PriorityQueue.
*/

public int primMST(int n, int[][] edges) {
    // Build adjacency list
    List<int[]>[] graph = new List[n];
    for (int i = 0; i < n; i++) graph[i] = new ArrayList<>();

    for (int[] e : edges) {
        graph[e[0]].add(new int[]{e[1], e[2]});
        graph[e[1]].add(new int[]{e[0], e[2]});
    }

    // Min heap: [weight, vertex]
    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] - b[0]);
    boolean[] visited = new boolean[n];
    int cost = 0;

    pq.offer(new int[]{0, 0});  // Start from vertex 0

    while (!pq.isEmpty()) {
        int[] curr = pq.poll();
        int w = curr[0], u = curr[1];

        if (visited[u]) continue;
        visited[u] = true;
        cost += w;

        for (int[] neighbor : graph[u]) {
            if (!visited[neighbor[0]]) {
                pq.offer(new int[]{neighbor[1], neighbor[0]});
            }
        }
    }
    return cost;
}
```

## Dijkstra's Shortest Path

```java
/*
Shortest path from source to all vertices.
Greedy: Always process vertex with current minimum distance.
*/

public int[] dijkstra(int n, int[][] edges, int src) {
    // Build adjacency list
    List<int[]>[] graph = new List[n];
    for (int i = 0; i < n; i++) graph[i] = new ArrayList<>();

    for (int[] e : edges) {
        graph[e[0]].add(new int[]{e[1], e[2]});
        // For undirected: graph[e[1]].add(new int[]{e[0], e[2]});
    }

    int[] dist = new int[n];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[src] = 0;

    // Min heap: [distance, vertex]
    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] - b[0]);
    pq.offer(new int[]{0, src});

    while (!pq.isEmpty()) {
        int[] curr = pq.poll();
        int d = curr[0], u = curr[1];

        if (d > dist[u]) continue;  // Skip outdated

        for (int[] neighbor : graph[u]) {
            int v = neighbor[0], w = neighbor[1];
            if (dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
                pq.offer(new int[]{dist[v], v});
            }
        }
    }
    return dist;
}
```

---

🔬 **Section Challenge — Graph Greedy Algorithms <a name="graph-greedy"></a>**

**Challenge 1 (Reasoning):** BFS finds shortest path in unweighted graphs but not in weighted graphs. Why exactly?

<details><summary>Answer</summary>

BFS explores by 'hop count' (number of edges). Each level = one more edge away from source. All edges are treated as weight=1. In a weighted graph, the 'shortest by hop count' path may not be 'shortest by weight sum'. Example: A→B (weight 1, 1 hop) vs A→C→B (weight 0.1+0.1=0.2, 2 hops). BFS finds A→B (1 hop), Dijkstra finds A→C→B (lower total weight). BFS is optimal ONLY when all edges have equal weight.

</details>

**Challenge 2 (Design):** Detect if a directed graph has a cycle. Write the algorithm and explain why we need 3 states (not 2).

<details><summary>Answer</summary>

3 states: UNVISITED, IN_PROGRESS (currently in DFS path), DONE. DFS: mark node IN_PROGRESS before visiting neighbors. If we reach an IN_PROGRESS node → cycle found. Mark DONE when all neighbors processed. Why 3 states: with 2 (visited/unvisited), we'd get false positives — reaching a VISITED node that was processed in a DIFFERENT DFS subtree is not a cycle. IN_PROGRESS specifically marks nodes in the CURRENT DFS path (potential back edge).

</details>

## Interview Problems <a name="interview-problems"></a>

### Boats to Save People (LeetCode 881)

```java
/*
People with weights, boats with limit.
Each boat holds at most 2 people.
Minimum boats needed?

Greedy: Pair heaviest with lightest if possible.
*/

public int numRescueBoats(int[] people, int limit) {
    Arrays.sort(people);
    int left = 0, right = people.length - 1;
    int boats = 0;

    while (left <= right) {
        if (people[left] + people[right] <= limit) {
            left++;  // Light person fits with heavy
        }
        right--;  // Heavy person always takes boat
        boats++;
    }
    return boats;
}
```

### Minimum Number of Arrows (LeetCode 452)

```java
/*
Balloons as intervals. Arrow at x bursts all balloons
containing x. Minimum arrows needed?

Same as max non-overlapping intervals!
*/

public int findMinArrowShots(int[][] points) {
    Arrays.sort(points, (a, b) -> Integer.compare(a[1], b[1]));

    int arrows = 1;
    int end = points[0][1];

    for (int i = 1; i < points.length; i++) {
        if (points[i][0] > end) {
            arrows++;
            end = points[i][1];
        }
    }
    return arrows;
}
```

### Queue Reconstruction by Height (LeetCode 406)

```java
/*
People: [h, k] - height h, k people in front with height >= h
Reconstruct the queue.

Greedy: Sort by height desc, then by k asc.
Insert tallest first, shorter people don't affect their count.
*/

public int[][] reconstructQueue(int[][] people) {
    // Sort: tallest first, same height by k
    Arrays.sort(people, (a, b) -> {
        if (a[0] != b[0]) return b[0] - a[0];  // Height desc
        return a[1] - b[1];  // K asc
    });

    List<int[]> result = new ArrayList<>();
    for (int[] person : people) {
        result.add(person[1], person);  // Insert at index k
    }

    return result.toArray(new int[people.length][]);
}
```

### Lemonade Change (LeetCode 860)

```java
/*
Customers pay with $5, $10, or $20.
Start with no change. Can you give correct change?
*/

public boolean lemonadeChange(int[] bills) {
    int fives = 0, tens = 0;

    for (int bill : bills) {
        if (bill == 5) {
            fives++;
        } else if (bill == 10) {
            if (fives == 0) return false;
            fives--;
            tens++;
        } else {  // $20
            // Prefer giving $10 + $5 (save $5 bills)
            if (tens > 0 && fives > 0) {
                tens--;
                fives--;
            } else if (fives >= 3) {
                fives -= 3;
            } else {
                return false;
            }
        }
    }
    return true;
}
```

---

## Greedy vs DP <a name="greedy-vs-dp"></a>

### When to Use Which?

**GREEDY vs DYNAMIC PROGRAMMING**

| GREEDY | DYNAMIC PROGRAMMING |
| --- | --- |
| Makes ONE choice at each step, never reconsiders | Considers ALL choices at each step, picks best via recursion |
| O(n) or O(n log n) usually | O(n²) or O(n³) typically |
| Doesn't always work | Always gives optimal (if correct recurrence) |
| Examples: - Activity Selection - Huffman Coding - Dijkstra's Algorithm - Fractional Knapsack | Examples: - 0/1 Knapsack - Longest Common Subsequence - Edit Distance - Matrix Chain Multiplication |

### Same Problem, Different Approaches

```java
// COIN CHANGE - Can be Greedy (sometimes) or DP (always)

// Greedy (only works for specific coin systems like US coins)
public int greedyCoinChange(int[] coins, int amount) {
    Arrays.sort(coins);
    int count = 0;
    for (int i = coins.length - 1; i >= 0 && amount > 0; i--) {
        count += amount / coins[i];
        amount %= coins[i];
    }
    return amount == 0 ? count : -1;  // Might fail!
}

// DP (always works)
public int dpCoinChange(int[] coins, int amount) {
    int[] dp = new int[amount + 1];
    Arrays.fill(dp, amount + 1);
    dp[0] = 0;

    for (int i = 1; i <= amount; i++) {
        for (int coin : coins) {
            if (coin <= i) {
                dp[i] = Math.min(dp[i], dp[i - coin] + 1);
            }
        }
    }
    return dp[amount] > amount ? -1 : dp[amount];
}
```

---

## Practice Problems <a name="practice-problems"></a>

### Easy 🟢

| Problem                        | Type       | Key Insight             |
| ------------------------------ | ---------- | ----------------------- |
| Assign Cookies                 | Matching   | Sort both, greedy match |
| Lemonade Change                | Simulation | Prefer $10 change       |
| Best Time to Buy/Sell Stock II | Array      | Capture every up        |
| Can Place Flowers              | Array      | Check neighbors         |
| Maximum Units on Truck         | Sorting    | Sort by units/box       |

### Medium 🟡

| Problem                   | Type        | Key Insight              |
| ------------------------- | ----------- | ------------------------ |
| Jump Game I/II            | Array       | Track farthest           |
| Gas Station               | Circular    | Track running sum        |
| Non-overlapping Intervals | Intervals   | Sort by end              |
| Meeting Rooms II          | Intervals   | Event processing         |
| Partition Labels          | String      | Last occurrence          |
| Task Scheduler            | Scheduling  | Max frequency formula    |
| Boats to Save People      | Two pointer | Pair heaviest + lightest |
| Queue Reconstruction      | Sorting     | Tall first, insert at k  |
| Container With Most Water | Two pointer | Move shorter             |

### Hard 🔴

| Problem                           | Type           | Key Insight            |
| --------------------------------- | -------------- | ---------------------- |
| Candy                             | Two pass       | L→R then R→L           |
| Create Maximum Number             | Stack          | Monotonic stack        |
| IPO                               | Heap           | Max profit affordable  |
| Minimum Number of Refueling Stops | Heap           | Collect fuel options   |
| Course Schedule III               | Sorting + Heap | Replace longer courses |

---

## Quick Reference

### Greedy Choice Patterns

**COMMON GREEDY STRATEGIES**

```text
1. SORT BY END TIME
   → Max non-overlapping intervals
   → Activity selection

2. SORT BY START TIME
   → Merge intervals
   → Cover range with min intervals

3. SORT BY RATIO (value/weight)
   → Fractional knapsack

4. SORT BY ONE, SECONDARY BY ANOTHER
   → Job scheduling (profit desc, deadline)
   → Queue reconstruction (height desc, k asc)

5. TWO POINTERS (heaviest + lightest)
   → Boat problem
   → Two sum variants

6. TRACK FARTHEST/EARLIEST ENDING
   → Jump game
   → Interval covering
```

### Common Mistakes to Avoid

```
❌ Assuming greedy works without proof
   → Test with counterexamples first

❌ Wrong sorting criteria
   → End time for selection, start time for merging

❌ Not handling edge cases
   → Empty input, single element, all same elements

❌ Integer overflow in comparisons
   → Use Integer.compare(a, b) instead of a - b

❌ Forgetting to update tracking variables
   → Always update end/farthest after making choice
```

---

**Master These 3 Greedy Patterns:**

**GREEDY ESSENTIALS**

```text
1. INTERVAL SELECTION: Sort by end time, pick earliest

2. INTERVAL MERGING: Sort by start time, extend end

3. TWO POINTER: Sort both, match greedily
```

**Pro Tip:** If greedy doesn't work for a problem, try DP. If you can prove the greedy choice property (exchange argument), greedy is usually faster!

---

## When Greedy Breaks

### 1. Exchange Argument Fails — Greedy Picks a Locally Optimal but Globally Suboptimal Choice

**What breaks**: Coin change with non-canonical denominations. `{1, 3, 4}`, target = 6: greedy picks 4 → then 1 → then 1 = **3 coins**. DP finds 3 + 3 = **2 coins**. The greedy choice property fails because picking the largest coin forecloses a better partition.
**Test**: Always try the adversarial case before committing to greedy. If you can construct a counterexample in 2 minutes, use DP.

### 2. Interval Scheduling — Greedy on Wrong Attribute

**What breaks**: "Maximize number of non-overlapping intervals" — greedy by *earliest start* gives wrong answers when an early-starting interval spans the whole range. Correct attribute is *earliest finish*.
**Proof it's wrong**: `[(0,10), (1,2), (3,4)]` — earliest-start picks `(0,10)`, leaving only 0 more. Earliest-finish picks `(1,2)` then `(3,4)` = 2 intervals.
**Fix**: Always sort by *finish time* for interval scheduling; sort by *start time* for interval merging. The attributes differ and the choice is load-bearing.

### 3. Huffman Coding — Wrong Priority Queue Direction

**What breaks**: Building a Huffman tree with a *max*-heap instead of a *min*-heap. The greedy insight is to always merge the two *lowest*-frequency nodes. Using max-heap reverses this, producing a tree with higher total code length.
**Java gotcha**: `new PriorityQueue<>()` is a min-heap; `new PriorityQueue<>(Comparator.reverseOrder())` is max-heap. Confusing the two produces silently wrong trees with no exception.

### 4. Greedy Activity Selection with Weights — Must Use DP

**What breaks**: Weighted job scheduling ("maximize total value of non-overlapping intervals"). Greedy by earliest finish no longer works because a low-value early-finishing job might displace a high-value later job. This problem requires DP + binary search (O(n log n)).
**Signal**: As soon as intervals carry weights and you want maximum total weight — not maximum count — greedy fails; DP is required.

---

[← String Greedy Problems](06_string_greedy_problems.md) | [Chapter overview](../12_Greedy_Algorithms_Complete.md)
