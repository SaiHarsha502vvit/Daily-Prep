# 9.2 Graph Cycle Detection

> **Navigation**: [← 9.1 Graph Traversal (BFS/DFS)](02_graph_traversal_bfs_dfs.md) | [Chapter overview](../10_Graphs.md) | [9.3 Shortest Path Problems →](04_shortest_path_problems.md)
> Page 3 of 7 in **Graphs**


**Pattern:** Detect if a directed graph has a cycle. Two approaches:

1. **DFS 3-coloring:** WHITE(unvisited) → GRAY(in-progress) → BLACK(done). If you visit a GRAY node → cycle!
2. **Kahn's Algorithm:** Remove nodes with in-degree 0 repeatedly. If nodes remain → cycle.
   **Key insight:** Course Schedule = "Can all courses be taken?" = "Does the prerequisite graph have a cycle?"

## Problem 142: Course Schedule (Cycle Detection)

**LeetCode 207** 🔗 https://leetcode.com/problems/course-schedule/

```
┌────────────────────────────────────────────────────────────────┐
│  COURSE SCHEDULE - Detect cycle in directed graph              │
├────────────────────────────────────────────────────────────────┤
│  numCourses = 4                                                │
│  prerequisites = [[1,0], [2,0], [3,1], [3,2]]                  │
│  [a,b] means: to take course a, you must first take course b   │
│                                                                │
│       0                                                        │
│      / \                                                       │
│     ↓   ↓                                                      │
│     1   2        No cycle → Can finish all courses ✓           │
│      \ /                                                       │
│       ↓                                                        │
│       3                                                        │
│                                                                │
│  With cycle: [[1,0], [0,1]]                                    │
│       0 ↔ 1      Cycle! → Cannot finish ✗                      │
└────────────────────────────────────────────────────────────────┘
```

**Solution (DFS with colors):**

```java
public boolean canFinish(int numCourses, int[][] prerequisites) {
    List<List<Integer>> graph = new ArrayList<>();
    for (int i = 0; i < numCourses; i++) {
        graph.add(new ArrayList<>());
    }

    for (int[] prereq : prerequisites) {
        graph.get(prereq[1]).add(prereq[0]);
    }

    // 0 = unvisited, 1 = visiting (in current path), 2 = visited
    int[] state = new int[numCourses];

    for (int i = 0; i < numCourses; i++) {
        if (hasCycle(graph, i, state)) {
            return false;
        }
    }

    return true;
}

private boolean hasCycle(List<List<Integer>> graph, int node, int[] state) {
    if (state[node] == 1) return true;   // Back edge = cycle
    if (state[node] == 2) return false;  // Already processed

    state[node] = 1;  // Mark as visiting

    for (int neighbor : graph.get(node)) {
        if (hasCycle(graph, neighbor, state)) {
            return true;
        }
    }

    state[node] = 2;  // Mark as visited
    return false;
}
```

---

## Problem 143: Course Schedule II (Topological Sort)

**LeetCode 210** 🔗 https://leetcode.com/problems/course-schedule-ii/

```
┌────────────────────────────────────────────────────────────────┐
│  COURSE SCHEDULE II - Return valid course order                │
├────────────────────────────────────────────────────────────────┤
│  numCourses = 4                                                │
│  prerequisites = [[1,0], [2,0], [3,1], [3,2]]                  │
│                                                                │
│  Valid orders:                                                 │
│  [0, 1, 2, 3] or [0, 2, 1, 3]                                  │
│                                                                │
│  Topological Sort: Order where all prerequisites come first    │
│                                                                │
│  Using Kahn's Algorithm (BFS):                                 │
│  1. Calculate in-degree for each node                          │
│  2. Start with nodes having in-degree 0                        │
│  3. Remove node, reduce neighbors' in-degree                   │
│  4. Add nodes with in-degree 0 to queue                        │
└────────────────────────────────────────────────────────────────┘
```

**Solution (Kahn's Algorithm - BFS):**

```java
public int[] findOrder(int numCourses, int[][] prerequisites) {
    List<List<Integer>> graph = new ArrayList<>();
    int[] inDegree = new int[numCourses];

    for (int i = 0; i < numCourses; i++) {
        graph.add(new ArrayList<>());
    }

    for (int[] prereq : prerequisites) {
        graph.get(prereq[1]).add(prereq[0]);
        inDegree[prereq[0]]++;
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

        for (int neighbor : graph.get(course)) {
            inDegree[neighbor]--;
            if (inDegree[neighbor] == 0) {
                queue.offer(neighbor);
            }
        }
    }

    return index == numCourses ? result : new int[0];
}
```

---

## Problem 144: Graph Valid Tree

**LeetCode 261 (Premium)** 🔗 (Premium)

```
┌────────────────────────────────────────────────────────────────┐
│  GRAPH VALID TREE                                              │
├────────────────────────────────────────────────────────────────┤
│  A valid tree has:                                             │
│  1. No cycles                                                  │
│  2. All nodes connected (single connected component)           │
│  3. Exactly n-1 edges for n nodes                              │
│                                                                │
│  Example 1: n=5, edges=[[0,1],[0,2],[0,3],[1,4]]               │
│       0                                                        │
│      /|\                                                       │
│     1 2 3    Valid tree ✓                                      │
│     |                                                          │
│     4                                                          │
│                                                                │
│  Example 2: n=5, edges=[[0,1],[1,2],[2,3],[1,3],[1,4]]         │
│     0─1─4                                                      │
│       │\                                                       │
│       2─3    Has cycle (1-2-3-1) ✗                             │
│                                                                │
│  Constraints:                                                  │
│  - 1 <= n <= 2000                                              │
│  - 0 <= edges.length <= 5000                                   │
└────────────────────────────────────────────────────────────────┘
```

**Solution (Union-Find):**

```java
public boolean validTree(int n, int[][] edges) {
    // Tree must have exactly n-1 edges
    if (edges.length != n - 1) return false;

    int[] parent = new int[n];
    for (int i = 0; i < n; i++) parent[i] = i;

    for (int[] edge : edges) {
        int p1 = find(parent, edge[0]);
        int p2 = find(parent, edge[1]);

        // Same parent means cycle
        if (p1 == p2) return false;

        parent[p1] = p2;  // Union
    }

    return true;
}

private int find(int[] parent, int x) {
    if (parent[x] != x) {
        parent[x] = find(parent, parent[x]);
    }
    return parent[x];
}
```

---

🔬 **Section Challenge — 9.2 Graph Cycle Detection**

**Challenge 1 (Undirected vs Directed Cycle Detection):** `isCyclic(graph)` for undirected graph uses visited + parent tracking. For directed graph, it uses 3-color (WHITE/GRAY/BLACK). **Who** uses which method? **When** does the undirected method give a FALSE POSITIVE on a directed graph?

<details><summary>Answer</summary>

**Who uses parent tracking (undirected):** DFS with `dfs(node, parent)`. A cycle exists if a neighbor is VISITED AND is NOT the parent. The parent check prevents treating the edge you came from as a "back edge." **Who uses 3-color (directed):** DFS with `state[node] = 0/1/2`. A cycle exists if we reach a GRAY (state=1) node — a node currently on the DFS path. **False positive on directed graph:** Consider `A→B` and `C→B` (two separate directed paths to B). If you apply the undirected algorithm (with parent tracking) to this as if it's undirected, you'd see B visited from both A and C, and might flag it as a cycle (B already visited, C is not A's parent). But there is NO directed cycle. Directed graphs require the GRAY-node check to detect back edges (true directed cycles). **A directed graph's back edge:** An edge from a node to one of its current DFS ancestors. NOT all "already visited" edges are cycles in directed graphs — cross edges and forward edges don't create cycles. Only back edges do. This is why gray (currently on stack) is the cycle indicator, not black (fully processed).

</details>
<details><summary>Answer</summary>

BFS explores by 'hop count' (number of edges). Each level = one more edge away from source. All edges are treated as weight=1. In a weighted graph, the 'shortest by hop count' path may not be 'shortest by weight sum'. Example: A→B (weight 1, 1 hop) vs A→C→B (weight 0.1+0.1=0.2, 2 hops). BFS finds A→B (1 hop), Dijkstra finds A→C→B (lower total weight). BFS is optimal ONLY when all edges have equal weight.

</details>

---

[← 9.1 Graph Traversal (BFS/DFS)](02_graph_traversal_bfs_dfs.md) | [Chapter overview](../10_Graphs.md) | [9.3 Shortest Path Problems →](04_shortest_path_problems.md)
