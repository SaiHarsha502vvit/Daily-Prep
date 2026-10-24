# 🔄 Pattern 6: Topological Sort

> **Navigation**: [← Pattern 1: Prefix Sum](02_prefix_sum.md) | [Chapter overview](../04_Pattern_Recognition.md) | [Pattern 7: Binary Search Variants →](04_binary_search_variants.md)
> Page 3 of 4 in **Pattern Recognition — Pattern Guide**


## Concept

```
Linear ordering of vertices in a DAG (Directed Acyclic Graph)
such that for every edge u→v, u comes before v

Use Case: Task scheduling, course prerequisites, build systems
```

## Visual

```
Graph:
  5 → 0 ← 4
  ↓       ↓
  2 → 3 → 1

Valid Topological Orders:
- 5, 4, 2, 3, 1, 0
- 4, 5, 2, 3, 1, 0
- 5, 4, 0, 2, 3, 1

Not valid: 3, 2, ... (2 must come before 3)
```

## Template: Kahn's Algorithm (BFS)

```java
public int[] topologicalSort(int numCourses, int[][] prerequisites) {
    // Build adjacency list and in-degree array
    List<List<Integer>> adj = new ArrayList<>();
    int[] inDegree = new int[numCourses];

    for (int i = 0; i < numCourses; i++) {
        adj.add(new ArrayList<>());
    }

    for (int[] pre : prerequisites) {
        adj.get(pre[1]).add(pre[0]);  // pre[1] → pre[0]
        inDegree[pre[0]]++;
    }

    // Start with nodes having no prerequisites
    Queue<Integer> queue = new LinkedList<>();
    for (int i = 0; i < numCourses; i++) {
        if (inDegree[i] == 0) {
            queue.offer(i);
        }
    }

    // Process in topological order
    int[] order = new int[numCourses];
    int index = 0;

    while (!queue.isEmpty()) {
        int curr = queue.poll();
        order[index++] = curr;

        for (int next : adj.get(curr)) {
            inDegree[next]--;
            if (inDegree[next] == 0) {
                queue.offer(next);
            }
        }
    }

    // Check for cycle
    if (index != numCourses) {
        return new int[0];  // Cycle detected
    }

    return order;
}
```

## Template: DFS Approach

```java
public int[] topologicalSortDFS(int n, int[][] edges) {
    List<List<Integer>> adj = new ArrayList<>();
    for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
    for (int[] e : edges) adj.get(e[1]).add(e[0]);

    int[] visited = new int[n];  // 0=unvisited, 1=visiting, 2=visited
    Stack<Integer> stack = new Stack<>();

    for (int i = 0; i < n; i++) {
        if (visited[i] == 0) {
            if (!dfs(i, adj, visited, stack)) {
                return new int[0];  // Cycle
            }
        }
    }

    int[] result = new int[n];
    for (int i = 0; i < n; i++) {
        result[i] = stack.pop();
    }
    return result;
}

private boolean dfs(int node, List<List<Integer>> adj,
                    int[] visited, Stack<Integer> stack) {
    visited[node] = 1;  // Visiting

    for (int next : adj.get(node)) {
        if (visited[next] == 1) return false;  // Cycle
        if (visited[next] == 0 && !dfs(next, adj, visited, stack)) {
            return false;
        }
    }

    visited[node] = 2;  // Visited
    stack.push(node);
    return true;
}
```

---

[← Pattern 1: Prefix Sum](02_prefix_sum.md) | [Chapter overview](../04_Pattern_Recognition.md) | [Pattern 7: Binary Search Variants →](04_binary_search_variants.md)
