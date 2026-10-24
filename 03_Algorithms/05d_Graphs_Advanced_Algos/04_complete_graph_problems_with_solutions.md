# PART 15: Complete Graph Problems with Solutions

> **Navigation**: [← Graph Problem Patterns](03_graph_problem_patterns.md) | [Chapter overview](../05d_Graphs_Advanced_Algos.md) | [PART FINAL: ADVANCED TREE & GRAPH… →](05_final_advanced_tree_graph_algorithms_deep.md)
> Page 4 of 6 in **Graphs Advanced Algos**


## Problem 1: Clone Graph

```java
public Node cloneGraph(Node node) {
    if (node == null) return null;

    Map<Node, Node> visited = new HashMap<>();
    return clone(node, visited);
}

private Node clone(Node node, Map<Node, Node> visited) {
    if (visited.containsKey(node)) {
        return visited.get(node);
    }

    Node copy = new Node(node.val);
    visited.put(node, copy);

    for (Node neighbor : node.neighbors) {
        copy.neighbors.add(clone(neighbor, visited));
    }

    return copy;
}
```

🔬 **Section Challenge — Deep Copying Graphs**

**Challenge 1 (Data Structures):** Why is a `HashMap` necessary when cloning a graph, whereas a simple `HashSet` might be enough for just traversing it?

<details><summary>Answer</summary>

A `HashSet` is sufficient for traversal because we only need to know _if_ we've visited a node to avoid infinite loops. When _cloning_, we must map the original node to its newly created clone. If we revisit an original node, we must link to its _already created clone_ rather than creating a duplicate clone. The `HashMap` stores this `OriginalNode -> ClonedNode` mapping.

</details>

## Problem 2: Pacific Atlantic Water Flow

```java
public List<List<Integer>> pacificAtlantic(int[][] heights) {
    int m = heights.length, n = heights[0].length;
    boolean[][] pacific = new boolean[m][n];
    boolean[][] atlantic = new boolean[m][n];

    // Start from edges and work inward
    for (int i = 0; i < m; i++) {
        dfs(heights, pacific, i, 0);       // Pacific left edge
        dfs(heights, atlantic, i, n - 1);  // Atlantic right edge
    }
    for (int j = 0; j < n; j++) {
        dfs(heights, pacific, 0, j);       // Pacific top edge
        dfs(heights, atlantic, m - 1, j);  // Atlantic bottom edge
    }

    List<List<Integer>> result = new ArrayList<>();
    for (int i = 0; i < m; i++) {
        for (int j = 0; j < n; j++) {
            if (pacific[i][j] && atlantic[i][j]) {
                result.add(Arrays.asList(i, j));
            }
        }
    }

    return result;
}

private void dfs(int[][] heights, boolean[][] visited, int i, int j) {
    int m = heights.length, n = heights[0].length;
    visited[i][j] = true;

    int[][] dirs = {{0, 1}, {0, -1}, {1, 0}, {-1, 0}};
    for (int[] dir : dirs) {
        int ni = i + dir[0], nj = j + dir[1];
        if (ni >= 0 && ni < m && nj >= 0 && nj < n &&
            !visited[ni][nj] && heights[ni][nj] >= heights[i][j]) {
            dfs(heights, visited, ni, nj);
        }
    }
}
```

## Problem 3: Network Delay Time (Dijkstra)

```java
public int networkDelayTime(int[][] times, int n, int k) {
    // Build adjacency list
    List<int[]>[] graph = new ArrayList[n + 1];
    for (int i = 0; i <= n; i++) {
        graph[i] = new ArrayList<>();
    }
    for (int[] time : times) {
        graph[time[0]].add(new int[]{time[1], time[2]});
    }

    // Dijkstra
    int[] dist = new int[n + 1];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[k] = 0;

    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[1] - b[1]);
    pq.offer(new int[]{k, 0});

    while (!pq.isEmpty()) {
        int[] curr = pq.poll();
        int node = curr[0], time = curr[1];

        if (time > dist[node]) continue;

        for (int[] edge : graph[node]) {
            int next = edge[0], weight = edge[1];
            if (dist[node] + weight < dist[next]) {
                dist[next] = dist[node] + weight;
                pq.offer(new int[]{next, dist[next]});
            }
        }
    }

    int maxTime = 0;
    for (int i = 1; i <= n; i++) {
        if (dist[i] == Integer.MAX_VALUE) return -1;
        maxTime = Math.max(maxTime, dist[i]);
    }

    return maxTime;
}
```

🔬 **Section Challenge — Problem 3: Network Delay Time (Dijkstra)**

**Challenge 1 (Dijkstra Internals):** Why does Dijkstra's Algorithm fail if there are negative edge weights?

<details><summary>Answer</summary>

Dijkstra's relies on a greedy property: once a node is popped from the Priority Queue, its shortest path is _finalized_. It assumes all future paths will only add non-negative weights, meaning any indirect path will be strictly longer. A negative edge breaks this assumption, as taking a longer detour might actually result in a smaller total weight, requiring a node to be re-evaluated.

</details>

## Problem 4: Cheapest Flights Within K Stops

```java
public int findCheapestPrice(int n, int[][] flights, int src, int dst, int k) {
    // BFS with level tracking (Bellman-Ford style)
    int[] dist = new int[n];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[src] = 0;

    for (int i = 0; i <= k; i++) {
        int[] temp = dist.clone();
        for (int[] flight : flights) {
            int u = flight[0], v = flight[1], price = flight[2];
            if (dist[u] != Integer.MAX_VALUE) {
                temp[v] = Math.min(temp[v], dist[u] + price);
            }
        }
        dist = temp;
    }

    return dist[dst] == Integer.MAX_VALUE ? -1 : dist[dst];
}
```

---

[← Graph Problem Patterns](03_graph_problem_patterns.md) | [Chapter overview](../05d_Graphs_Advanced_Algos.md) | [PART FINAL: ADVANCED TREE & GRAPH… →](05_final_advanced_tree_graph_algorithms_deep.md)
