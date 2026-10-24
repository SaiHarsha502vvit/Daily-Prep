# PART 13: Graph Problem Patterns

> **Navigation**: [← Bellman-Ford Algorithm (Negative Weights)](02_bellman_ford_algorithm_negative_weights.md) | [Chapter overview](../05d_Graphs_Advanced_Algos.md) | [Complete Graph Problems with Solutions →](04_complete_graph_problems_with_solutions.md)
> Page 3 of 6 in **Graphs Advanced Algos**


## Pattern 1: Multi-Source BFS

```java
// Find distance from any '0' cell to each cell in grid
public int[][] multiSourceBFS(int[][] grid) {
    int m = grid.length, n = grid[0].length;
    int[][] dist = new int[m][n];
    Queue<int[]> queue = new LinkedList<>();

    // Add all sources to queue initially
    for (int i = 0; i < m; i++) {
        for (int j = 0; j < n; j++) {
            if (grid[i][j] == 0) {
                queue.offer(new int[]{i, j});
                dist[i][j] = 0;
            } else {
                dist[i][j] = Integer.MAX_VALUE;
            }
        }
    }

    int[][] dirs = {{0, 1}, {0, -1}, {1, 0}, {-1, 0}};

    while (!queue.isEmpty()) {
        int[] cell = queue.poll();
        int x = cell[0], y = cell[1];

        for (int[] dir : dirs) {
            int nx = x + dir[0], ny = y + dir[1];
            if (nx >= 0 && nx < m && ny >= 0 && ny < n &&
                dist[x][y] + 1 < dist[nx][ny]) {
                dist[nx][ny] = dist[x][y] + 1;
                queue.offer(new int[]{nx, ny});
            }
        }
    }

    return dist;
}
```

## Pattern 2: Bidirectional BFS

```java
// Word Ladder: Find shortest transformation sequence
public int ladderLength(String beginWord, String endWord, List<String> wordList) {
    Set<String> dict = new HashSet<>(wordList);
    if (!dict.contains(endWord)) return 0;

    Set<String> startSet = new HashSet<>();
    Set<String> endSet = new HashSet<>();
    startSet.add(beginWord);
    endSet.add(endWord);

    int length = 1;

    while (!startSet.isEmpty() && !endSet.isEmpty()) {
        // Always expand smaller set
        if (startSet.size() > endSet.size()) {
            Set<String> temp = startSet;
            startSet = endSet;
            endSet = temp;
        }

        Set<String> nextSet = new HashSet<>();

        for (String word : startSet) {
            char[] chars = word.toCharArray();

            for (int i = 0; i < chars.length; i++) {
                char original = chars[i];

                for (char c = 'a'; c <= 'z'; c++) {
                    if (c == original) continue;
                    chars[i] = c;
                    String newWord = new String(chars);

                    if (endSet.contains(newWord)) {
                        return length + 1;
                    }

                    if (dict.contains(newWord)) {
                        nextSet.add(newWord);
                        dict.remove(newWord);
                    }
                }

                chars[i] = original;
            }
        }

        startSet = nextSet;
        length++;
    }

    return 0;
}
```

## Pattern 3: Topological Sort with Kahn's Algorithm

```java
// Course Schedule II: Return order to take courses
public int[] findOrder(int numCourses, int[][] prerequisites) {
    List<List<Integer>> adj = new ArrayList<>();
    int[] inDegree = new int[numCourses];

    for (int i = 0; i < numCourses; i++) {
        adj.add(new ArrayList<>());
    }

    for (int[] pre : prerequisites) {
        adj.get(pre[1]).add(pre[0]);
        inDegree[pre[0]]++;
    }

    Queue<Integer> queue = new LinkedList<>();
    for (int i = 0; i < numCourses; i++) {
        if (inDegree[i] == 0) {
            queue.offer(i);
        }
    }

    int[] result = new int[numCourses];
    int index = 0;

    while (!queue.isEmpty()) {
        int course = queue.poll();
        result[index++] = course;

        for (int next : adj.get(course)) {
            if (--inDegree[next] == 0) {
                queue.offer(next);
            }
        }
    }

    return index == numCourses ? result : new int[0];
}
```

## Pattern 4: Cycle Detection in Directed Graph (Three Colors)

```java
public boolean hasCycle(int n, List<List<Integer>> adj) {
    int[] color = new int[n];  // 0: white, 1: gray, 2: black

    for (int i = 0; i < n; i++) {
        if (color[i] == 0 && dfs(i, adj, color)) {
            return true;
        }
    }

    return false;
}

private boolean dfs(int node, List<List<Integer>> adj, int[] color) {
    color[node] = 1;  // Mark as visiting (gray)

    for (int neighbor : adj.get(node)) {
        if (color[neighbor] == 1) return true;  // Back edge = cycle
        if (color[neighbor] == 0 && dfs(neighbor, adj, color)) {
            return true;
        }
    }

    color[node] = 2;  // Mark as visited (black)
    return false;
}
```

---

🔬 **Section Challenge — Topological Sort & Cycle Detection**

**Challenge 1 (Algorithmic Insight):** Kahn's Algorithm (BFS) and DFS both detect cycles, but how does their mechanism differ?

<details><summary>Answer</summary>

In Kahn's Algorithm, a cycle is detected if the number of processed nodes is less than the total number of nodes (nodes in the cycle never reach an in-degree of 0). In DFS (Three Colors), a cycle is detected when a node visits a neighbor that is currently marked as `IN_PROGRESS` (a back edge).

</details>

---

[← Bellman-Ford Algorithm (Negative Weights)](02_bellman_ford_algorithm_negative_weights.md) | [Chapter overview](../05d_Graphs_Advanced_Algos.md) | [Complete Graph Problems with Solutions →](04_complete_graph_problems_with_solutions.md)
