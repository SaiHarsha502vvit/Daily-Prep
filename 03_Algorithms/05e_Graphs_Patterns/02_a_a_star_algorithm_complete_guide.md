# A\* (A-STAR) ALGORITHM — COMPLETE GUIDE

> **Navigation**: [← Section Challenge — Advanced Graph Patterns](01_section_challenge_advanced_graph_patterns.md) | [Chapter overview](../05e_Graphs_Patterns.md)
> Page 2 of 2 in **Graph Patterns & Specialized Algorithms**


---

## 🔵 WHY: Why Do We Need A\*?

```text
                   WHY A* EXISTS — THE MOTIVATION

Dijkstra explores in ALL directions equally:

         . . . . . . .
       . . . . . . . . .
     . . . . S . . . . . .          S = Start, G = Goal
       . . . . . . . . .            Dijkstra explores the entire circle
         . . . . G . .              before finding path to G

A* uses a HEURISTIC to guide search TOWARD the goal:

               . .
         S . . . . G                A* explores a narrow corridor
               . .                   toward the goal — MUCH faster!

WHEN TO USE:
• Grid pathfinding (games, robotics, GPS)
• Any graph where you have an estimate of distance to goal
• When Dijkstra is too slow because graph is huge

REAL-WORLD:
• Google Maps route planning
• Game AI (NPCs navigating around obstacles)
• Robot motion planning
• Network routing protocols
```

---

## 🔵 WHAT: How A\* Works

#### A* core formula

`f(n) = g(n) + h(n)`

- `g(n)`: the **actual** cost from the start to node `n` (known, exact).
- `h(n)`: the **estimated** cost from `n` to the goal (a heuristic, approximate).
- `f(n)`: the total estimated cost of a path through `n`.

```mermaid
flowchart LR
  S["START"] -->|"g(n): exact"| N["NODE n"]
  N -->|"h(n): estimate"| G["GOAL"]
```

**How to read this diagram.** The cost of reaching `n` from the start is known exactly (`g`). The cost from `n` to the goal is only estimated (`h`). A* adds them to rank nodes.

> [!IMPORTANT]
> **Key insight:** A* always expands the node with the **lowest** `f(n)`. That prioritizes nodes that appear to lie on the shortest path.

**Comparison with Dijkstra**

| Algorithm | Priority | Uses |
| --- | --- | --- |
| Dijkstra | `g(n)` | Only the actual cost |
| A* | `g(n) + h(n)` | Actual cost plus the estimated remaining cost |

If `h(n) = 0` for all `n`, A* becomes Dijkstra.

### Common Heuristic Functions

### Heuristic Functions for Grids

1. MANHATTAN DISTANCE (4-directional movement: ↑↓←→)
h = |x₁ - x₂| + |y₁ - y₂|

From (1,1) to (4,3):  |4-1| + |3-1| = 3 + 2 = 5

2. EUCLIDEAN DISTANCE (any direction, diagonal allowed)
h = √((x₁-x₂)² + (y₁-y₂)²)

From (1,1) to (4,3):  √(9+4) ≈ 3.6

3. CHEBYSHEV DISTANCE (8-directional: ↑↓←→↗↘↙↖)
h = max(|x₁-x₂|, |y₁-y₂|)

From (1,1) to (4,3):  max(3, 2) = 3

```text
ADMISSIBILITY REQUIREMENT:
h(n) must NEVER overestimate the true cost to goal
h(n) ≤ actual_cost(n, goal)  for all n

If admissible → A* guarantees OPTIMAL (shortest) path
If not admissible → faster but may find suboptimal path
```

---

## 🔵 HOW: Step-by-Step Walkthrough

A* ALGORITHM STEP-BY-STEP

Grid Example (0 = open, 1 = wall, S = start, G = goal):

0   1   2   3   4         Heuristic: Manhattan distance

| 0 | S |  |  |  |  | S = (0,0), G = (2,4) |
| --- | --- | --- | --- | --- | --- | --- |
| 1 |  | █ | █ |  |  | █ = wall (blocked) |
| 2 |  |  |  |  | G |  |

**Step 1: Initialize**

openSet   = {S}   (nodes to explore, sorted by f)  
closedSet = {}    (nodes already explored)  
g(S) = 0, h(S) = |0-2|+|0-4| = 6, f(S) = 0+6 = 6

**Step 2: Pop lowest f from openSet → S (0,0), f=6**

Expand neighbors: (0,1) and (1,0)  
(0,1): g=1, h=|0-2|+|1-4|=5, f=6  
(1,0): g=1, h=|1-2|+|0-4|=5, f=6  
openSet = {(0,1), (1,0)}

**Step 3: Pop (0,1), f=6**

Neighbors: (0,2)  
(0,2): g=2, h=|0-2|+|2-4|=4, f=6

... continues expanding toward goal ...

**Final Path**:

S→(0,1)→(0,2)→(0,3)→(1,3)→(2,3)→G    Cost = 6

0   1   2   3   4

| 0 | * | * | * | * |  | * = path found by A* |
| --- | --- | --- | --- | --- | --- | --- |
| 1 |  | █ | █ | * |  |  |
| 2 |  |  |  | * | * |  |

---

## 🔵 COMPLETE JAVA IMPLEMENTATION

```java
// ═══════════════════════════════════════════════════════════════════════════════
// A* ALGORITHM — GRID PATHFINDING (Complete Implementation)
// ═══════════════════════════════════════════════════════════════════════════════

import java.util.*;

public class AStarAlgorithm {

    // ─── Node in the search space ───
    static class Node implements Comparable<Node> {
        int row, col;
        int g;  // actual cost from start
        int f;  // g + h (total estimated cost)
        Node parent;  // for path reconstruction

        Node(int row, int col, int g, int f, Node parent) {
            this.row = row;
            this.col = col;
            this.g = g;
            this.f = f;
            this.parent = parent;
        }

        @Override
        public int compareTo(Node other) {
            return Integer.compare(this.f, other.f);
        }
    }

    // ─── Heuristic: Manhattan distance (admissible for 4-dir grid) ───
    static int heuristic(int r1, int c1, int r2, int c2) {
        return Math.abs(r1 - r2) + Math.abs(c1 - c2);
    }

    // ─── A* Search on a 2D Grid ───
    // grid[r][c] = 0 (open) or 1 (wall)
    // Returns the shortest path as list of [row, col] or empty if no path
    public static List<int[]> aStarSearch(int[][] grid, int[] start, int[] goal) {
        int rows = grid.length, cols = grid[0].length;
        int sr = start[0], sc = start[1];
        int gr = goal[0], gc = goal[1];

        // Edge case: start or goal is a wall
        if (grid[sr][sc] == 1 || grid[gr][gc] == 1) {
            return Collections.emptyList();
        }

        // 4-directional movement: up, down, left, right
        int[][] dirs = {{-1, 0}, {1, 0}, {0, -1}, {0, 1}};

        // Priority queue sorted by f = g + h
        PriorityQueue<Node> openSet = new PriorityQueue<>();
        boolean[][] closed = new boolean[rows][cols];
        int[][] gCost = new int[rows][cols];  // best g found so far

        // Initialize g costs to infinity
        for (int[] row : gCost) Arrays.fill(row, Integer.MAX_VALUE);

        // Start node
        int h = heuristic(sr, sc, gr, gc);
        openSet.offer(new Node(sr, sc, 0, h, null));
        gCost[sr][sc] = 0;

        while (!openSet.isEmpty()) {
            Node current = openSet.poll();

            // Goal reached — reconstruct path
            if (current.row == gr && current.col == gc) {
                return reconstructPath(current);
            }

            // Skip if already processed with better cost
            if (closed[current.row][current.col]) continue;
            closed[current.row][current.col] = true;

            // Expand neighbors
            for (int[] dir : dirs) {
                int nr = current.row + dir[0];
                int nc = current.col + dir[1];

                // Bounds check + wall check + already closed
                if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
                if (grid[nr][nc] == 1) continue;
                if (closed[nr][nc]) continue;

                int newG = current.g + 1;  // uniform cost (1 per step)

                // Only add if this path to neighbor is better
                if (newG < gCost[nr][nc]) {
                    gCost[nr][nc] = newG;
                    int newF = newG + heuristic(nr, nc, gr, gc);
                    openSet.offer(new Node(nr, nc, newG, newF, current));
                }
            }
        }

        return Collections.emptyList();  // No path found
    }

    // ─── Reconstruct path by following parent pointers ───
    private static List<int[]> reconstructPath(Node goal) {
        List<int[]> path = new ArrayList<>();
        Node current = goal;
        while (current != null) {
            path.add(new int[]{current.row, current.col});
            current = current.parent;
        }
        Collections.reverse(path);
        return path;
    }

    // ─── Main: Demo ───
    public static void main(String[] args) {
        int[][] grid = {
            {0, 0, 0, 0, 0},
            {0, 1, 1, 0, 0},
            {0, 0, 0, 0, 0}
        };

        int[] start = {0, 0};
        int[] goal = {2, 4};

        List<int[]> path = aStarSearch(grid, start, goal);

        System.out.println("Path length: " + (path.size() - 1));
        for (int[] p : path) {
            System.out.println("  (" + p[0] + ", " + p[1] + ")");
        }
        // Output:
        // Path length: 6
        // (0, 0) → (0, 1) → (0, 2) → (0, 3) → (1, 3) → (2, 3) → (2, 4)
    }
}
```

---

### A\* with Weighted Graph (Non-Grid)

```java
// ═══════════════════════════════════════════════════════════════════════════════
// A* on a WEIGHTED GRAPH (adjacency list)
// ═══════════════════════════════════════════════════════════════════════════════

public class AStarWeightedGraph {

    static class Edge {
        int to, weight;
        Edge(int to, int weight) { this.to = to; this.weight = weight; }
    }

    static class Node implements Comparable<Node> {
        int id, g, f;
        Node(int id, int g, int f) { this.id = id; this.g = g; this.f = f; }
        public int compareTo(Node o) { return Integer.compare(this.f, o.f); }
    }

    // heuristic[i] = estimated cost from node i to goal
    // MUST be admissible (never overestimates)
    public static int[] astar(List<List<Edge>> graph, int start, int goal, int[] heuristic) {
        int n = graph.size();
        int[] dist = new int[n];
        int[] parent = new int[n];
        Arrays.fill(dist, Integer.MAX_VALUE);
        Arrays.fill(parent, -1);
        boolean[] closed = new boolean[n];

        dist[start] = 0;
        PriorityQueue<Node> pq = new PriorityQueue<>();
        pq.offer(new Node(start, 0, heuristic[start]));

        while (!pq.isEmpty()) {
            Node cur = pq.poll();
            if (cur.id == goal) break;    // Found optimal path
            if (closed[cur.id]) continue;
            closed[cur.id] = true;

            for (Edge e : graph.get(cur.id)) {
                if (closed[e.to]) continue;
                int newG = cur.g + e.weight;
                if (newG < dist[e.to]) {
                    dist[e.to] = newG;
                    parent[e.to] = cur.id;
                    pq.offer(new Node(e.to, newG, newG + heuristic[e.to]));
                }
            }
        }

        return dist;  // dist[goal] = shortest path cost
    }
}
```

---

### A\* vs Dijkstra — When to Use Which

A* VS DIJKSTRA COMPARISON

| Property | Dijkstra | A* |
| --- | --- | --- |
| Time Complexity | O(E log V) | O(E log V) worst case<br>Often MUCH better |
| Explores | All reachable nodes | Nodes toward goal only |
| Needs heuristic? | No | Yes |
| Guarantees optimal? | Yes (non-neg weights) | Yes (if h admissible) |
| Single target? | Finds all targets | Stops at single goal |
| Best for | All-to-all paths | Start-to-specific-goal |
| Negative weights? | No | No |

**Rule of Thumb**:

- Know the goal location? → A*
- Need shortest to ALL nodes? → Dijkstra
- Can't define a heuristic? → Dijkstra
- Huge graph (million+ nodes)? → A* will be dramatically faster

NODES EXPLORED (10000-node grid, start=top-left, goal=bottom-right):
- Dijkstra: ~10000 nodes (explores everything)
- A*:       ~2000 nodes  (focused corridor) → 5x faster!

### Practice Problems (A\* / Shortest Path with Heuristic)

| #   | Problem                                  | Platform    | Difficulty | Key Insight                           |
| --- | ---------------------------------------- | ----------- | ---------- | ------------------------------------- |
| 1   | Shortest Path in Binary Matrix (LC 1091) | LeetCode    | Medium     | BFS on grid, adapt to A\*             |
| 2   | Path With Minimum Effort (LC 1631)       | LeetCode    | Medium     | Modified Dijkstra/A\* on grid         |
| 3   | Swim in Rising Water (LC 778)            | LeetCode    | Hard       | Binary search + BFS or A\*            |
| 4   | Sliding Puzzle (LC 773)                  | LeetCode    | Hard       | A\* with misplaced tile heuristic     |
| 5   | Minimum Cost Path on Grid                | HackerEarth | Medium     | Classic A\* on weighted grid          |
| 6   | 8-Puzzle solver                          | Classic     | Hard       | A\* with Manhattan distance heuristic |

---

[← Section Challenge — Advanced Graph Patterns](01_section_challenge_advanced_graph_patterns.md) | [Chapter overview](../05e_Graphs_Patterns.md)
