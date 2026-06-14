> **Navigation**: [< Previous](Day_025_Mar27_Thu.md) | [Back to Index](../../00_MASTER_INDEX.md) | [Next >](Day_027_Mar29_Sat.md)

# DAY 026 — Friday, March 28, 2026

## Bellman-Ford + Bipartite Check + SQL Normalization

> **Theme**: Negative-weight shortest path + Graph coloring + Database design theory

---

## 📅 SCHEDULE

| Time Block | Duration | Topic                                         |
| ---------- | -------- | --------------------------------------------- |
| 0:00–0:30  | 30 min   | DS: Bellman-Ford Algorithm                    |
| 0:30–1:00  | 30 min   | ALGO: Bipartite Graph Check (2-Coloring)      |
| 1:00–1:20  | 20 min   | COMBO: LC 787 + LC 785                        |
| 1:20–1:40  | 20 min   | REAL-WORLD: Currency arbitrage = Bellman-Ford |
| 1:40–2:20  | 40 min   | SQL: Database Normalization (1NF → 3NF)       |
| 2:20–3:00  | 40 min   | PROBLEMS: Q1 + Q2                             |

---

> ## 📖 CHAPTER REFERENCES — Deep Dive Links
>
> Today's topics link to detailed chapter files for deeper study:
>
> | **ALGO: Bellman-Ford** | [Graph Advanced Algorithms](../../03_Algorithms/05d_Graphs_Advanced_Algos.md) |
> | **ALGO: Bipartite Graph Check** | [Graph Patterns](../../03_Algorithms/05e_Graphs_Patterns.md) |
> | **SQL: Database Normalization (1NF-3NF)** | [SQL: Normalization](../../08_SQL/10_Normalization.md) |
>
> _Open the linked file for full theory, diagrams, and practice problems._

---

## 🧱 DS BLOCK: Bellman-Ford Algorithm

### WHY: When Dijkstra Fails

```
Dijkstra CANNOT handle negative weight edges.
Bellman-Ford CAN — and also detects negative weight cycles.

Use cases:
• Currency exchange rates (can be negative after log transform)
• Network routing (some paths reduce cost)
• Any graph where weights might be negative
```

### Implementation

```java
// Bellman-Ford: O(V * E)
// Returns shortest distances from source. dist[i] = Integer.MAX_VALUE if unreachable
int[] bellmanFord(int n, int[][] edges, int source) {
    int[] dist = new int[n];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[source] = 0;

    // Relax all edges V-1 times
    for (int i = 0; i < n - 1; i++) {
        boolean updated = false;
        for (int[] edge : edges) {
            int u = edge[0], v = edge[1], w = edge[2];
            if (dist[u] != Integer.MAX_VALUE && dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
                updated = true;
            }
        }
        if (!updated) break;  // Early termination: no changes = done
    }

    // Check for negative weight cycles (V-th relaxation)
    for (int[] edge : edges) {
        int u = edge[0], v = edge[1], w = edge[2];
        if (dist[u] != Integer.MAX_VALUE && dist[u] + w < dist[v]) {
            System.out.println("Negative weight cycle detected!");
            return null;
        }
    }

    return dist;
}
```

### Dijkstra vs Bellman-Ford

```
┌───────────────────┬──────────────────┬────────────────────┐
│ Property          │ Dijkstra         │ Bellman-Ford       │
├───────────────────┼──────────────────┼────────────────────┤
│ Time              │ O((V+E) log V)   │ O(V * E)           │
│ Negative weights  │ NO               │ YES                │
│ Negative cycles   │ Can't detect     │ CAN detect         │
│ Space             │ O(V)             │ O(V)               │
│ Use when          │ Non-neg weights  │ Neg weights or K   │
│                   │                  │ stops constraint   │
└───────────────────┴──────────────────┴────────────────────┘
```

---

## ⚡ ALGO BLOCK: Bipartite Graph Check

### WHAT: Can We 2-Color the Graph?

```
Bipartite = can split nodes into 2 sets such that
            every edge goes BETWEEN sets (never within)

        0 --- 1          Color: 0=Red, 1=Blue, 2=Red, 3=Blue
        |     |          ✓ Every edge connects Red↔Blue
        3 --- 2          → BIPARTITE

        0 --- 1
        |   / |          Try: 0=Red, 1=Blue, 2=Red
        | /   |          Edge 1-2: Blue-Red ✓
        2     3          Edge 0-2: Red-Red ✗ → NOT BIPARTITE
```

### BFS 2-Coloring

```java
boolean isBipartite(int[][] graph) {
    int n = graph.length;
    int[] color = new int[n];
    Arrays.fill(color, -1);  // -1 = uncolored

    for (int i = 0; i < n; i++) {
        if (color[i] != -1) continue;

        // BFS from node i
        Queue<Integer> queue = new LinkedList<>();
        queue.offer(i);
        color[i] = 0;

        while (!queue.isEmpty()) {
            int node = queue.poll();
            for (int neighbor : graph[node]) {
                if (color[neighbor] == -1) {
                    color[neighbor] = 1 - color[node];  // opposite color
                    queue.offer(neighbor);
                } else if (color[neighbor] == color[node]) {
                    return false;  // Same color = NOT bipartite
                }
            }
        }
    }
    return true;
}
```

---

## 🗃️ SQL BLOCK: Database Normalization

### WHY Normalize?

```
UNNORMALIZED (one table):
┌────┬────────┬───────────┬────────────┬─────────────┐
│ ID │ Name   │ Dept      │ DeptPhone  │ Skills      │
├────┼────────┼───────────┼────────────┼─────────────┤
│ 1  │ Alice  │ Eng       │ 555-0100   │ Java,SQL    │
│ 2  │ Bob    │ Eng       │ 555-0100   │ Python      │
│ 3  │ Carol  │ HR        │ 555-0200   │ Java,React  │
└────┴────────┴───────────┴────────────┴─────────────┘

Problems:
• "Eng" phone changes → update EVERY row (Update Anomaly)
• Delete Alice → lose that she knows Java+SQL (Delete Anomaly)
• Skills in one column → can't easily query "who knows Java?"
```

### The Normal Forms

```
1NF (First Normal Form):
  ✓ Each column has atomic (single) values
  ✓ No repeating groups
  → Split "Java,SQL" into separate rows

2NF (Second Normal Form):
  ✓ Is in 1NF
  ✓ No partial dependencies (every non-key column depends on WHOLE primary key)
  → If composite key (emp_id, skill), dept depends only on emp_id → move to separate table

3NF (Third Normal Form):
  ✓ Is in 2NF
  ✓ No transitive dependencies (non-key → non-key)
  → DeptPhone depends on Dept, not on emp_id → move to departments table
```

### Normalized Design

```sql
-- Employees table (3NF)
CREATE TABLE employees (
    id INT PRIMARY KEY,
    name VARCHAR(100),
    dept_id INT REFERENCES departments(id)
);

-- Departments table
CREATE TABLE departments (
    id INT PRIMARY KEY,
    dept_name VARCHAR(100),
    phone VARCHAR(20)
);

-- Skills (many-to-many through junction table)
CREATE TABLE skills (
    id INT PRIMARY KEY,
    skill_name VARCHAR(50)
);

CREATE TABLE employee_skills (
    employee_id INT REFERENCES employees(id),
    skill_id INT REFERENCES skills(id),
    PRIMARY KEY (employee_id, skill_id)
);
```

---

## 🎯 PROBLEMS

### Q1: Cheapest Flights Within K Stops (LC 787) — Medium

```
n cities, flights[i] = [from, to, price].
Find cheapest price from src to dst with at most k stops.

Input: n=4, flights=[[0,1,100],[1,2,100],[2,0,100],[1,3,600],[2,3,200]],
       src=0, dst=3, k=1
Output: 700 (0→1→3)
```

**Pattern**: Bellman-Ford with K+1 iterations (or BFS with level = stops).

### Q2: Is Graph Bipartite? (LC 785) — Medium

```
Graph given as adjacency list. Determine if bipartite.

Input: graph = [[1,2,3],[0,2],[0,1,3],[0,2]]
Output: false (odd cycle exists)
```

**Pattern**: BFS 2-coloring.

---

## ✅ CHECKLIST

- [ ] Bellman-Ford: relax V-1 times, detect negative cycles
- [ ] When to use Bellman-Ford vs Dijkstra
- [ ] Bipartite check with BFS 2-coloring
- [ ] SQL: 1NF → 2NF → 3NF with examples
- [ ] SQL: Junction table for many-to-many relationships
- [ ] Solved LC 787 (Cheapest Flights)
- [ ] Solved LC 785 (Is Graph Bipartite)

---

> **Navigation**: [< Previous](Day_025_Mar27_Thu.md) | [Back to Index](../../00_MASTER_INDEX.md) | [Next >](Day_027_Mar29_Sat.md)
