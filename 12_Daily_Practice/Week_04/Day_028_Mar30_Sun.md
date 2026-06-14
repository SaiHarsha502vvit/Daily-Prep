> **Navigation**: [< Previous](Day_027_Mar29_Sat.md) | [Back to Index](../../00_MASTER_INDEX.md)

# DAY 028 — Sunday, March 30, 2026

## WEEK 04 REVIEW — Trie + Graphs + SQL Performance + Spring JPA

> **Theme**: Consolidate everything from Week 04. Speed drills. Re-attempt failures.

---

## 📅 SCHEDULE

| Time Block | Duration | Topic                                    |
| ---------- | -------- | ---------------------------------------- |
| 0:00–0:45  | 45 min   | SPEED DRILLS: Implement from memory      |
| 0:45–1:30  | 45 min   | RE-ATTEMPT ZONE: Unsolved problems       |
| 1:30–2:15  | 45 min   | TEACH-BACK: Explain to imaginary student |
| 2:15–3:00  | 45 min   | CUMULATIVE REVIEW: Weeks 1–4             |

---

> ## 📖 CHAPTER REFERENCES — Deep Dive Links
>
> Today's topics link to detailed chapter files for deeper study:
>
> | **Review: Trie, Union-Find, Graphs** | [Advanced DS: Segment Tree, Trie & More](../../03_Algorithms/07a_Advanced_DS_Core.md) |
> | **Review: Graph Algorithms** | [Graph Advanced Algorithms](../../03_Algorithms/05d_Graphs_Advanced_Algos.md) |
> | **Review: SQL Performance** | [SQL: Transactions & ACID](../../08_SQL/13_Transactions_ACID.md) |
>
> _Open the linked file for full theory, diagrams, and practice problems._

---

## ⚡ SPEED DRILLS (45 minutes — no looking at notes!)

### Drill 1: Trie (10 min target)

Write complete Trie with insert, search, startsWith — from memory.

```java
// YOUR CODE HERE — time yourself!

```

### Drill 2: Union-Find (8 min target)

Write UnionFind with path compression + union by rank.

```java
// YOUR CODE HERE — time yourself!

```

### Drill 3: Dijkstra (10 min target)

Write Dijkstra's algorithm with PriorityQueue.

```java
// YOUR CODE HERE — time yourself!

```

### Drill 4: Topological Sort — Kahn's (8 min target)

Write Kahn's BFS topological sort.

```java
// YOUR CODE HERE — time yourself!

```

### Drill 5: SQL (9 min target)

Write from memory:

```sql
-- 1. Create a table with proper indexes
-- 2. Write a transaction (transfer money between accounts)
-- 3. Create a view with JOIN + aggregation
-- 4. Write a query with window function RANK()

-- YOUR SQL HERE:

```

---

## 🔄 RE-ATTEMPT ZONE

Problems from this week — re-solve any you struggled with:

| Day | Problem                         | Solved? | Re-attempt Notes |
| --- | ------------------------------- | ------- | ---------------- |
| 22  | LC 208 Implement Trie           | ☐       |                  |
| 22  | LC 200 Number of Islands        | ☐       |                  |
| 23  | LC 211 Add and Search Words     | ☐       |                  |
| 23  | LC 547 Number of Provinces      | ☐       |                  |
| 24  | LC 684 Redundant Connection     | ☐       |                  |
| 24  | LC 743 Network Delay Time       | ☐       |                  |
| 25  | LC 207 Course Schedule          | ☐       |                  |
| 25  | LC 1584 Min Cost Connect Points | ☐       |                  |
| 26  | LC 787 Cheapest Flights K Stops | ☐       |                  |
| 26  | LC 785 Is Graph Bipartite       | ☐       |                  |

---

## 🎓 TEACH-BACK SESSION

Explain these to an imaginary student (write 2-3 sentences each):

1. **What is a Trie and when would you use it over a HashMap?**

   Your explanation: \_\_\_

2. **Explain Union-Find path compression in plain English.**

   Your explanation: \_\_\_

3. **Why can't Dijkstra handle negative weights?**

   Your explanation: \_\_\_

4. **What's the N+1 problem in JPA and how do you fix it?**

   Your explanation: \_\_\_

5. **What does EXPLAIN tell you about a SQL query?**

   Your explanation: \_\_\_

---

## 📊 CUMULATIVE PROGRESS — WEEKS 1–4

### Topics Mastered

```
Week 1: Arrays, Strings, Big O, SQL basics (SELECT/WHERE/JOIN)
Week 2: LinkedList, Stack, Queue, HashMap, Sorting, SQL aggregates
Week 3: Trees (Binary, BST), Heap, Recursion, Backtracking,
         Sliding Window, SQL Window Functions + CTEs
Week 4: Trie, Graph (BFS/DFS/Dijkstra/Bellman-Ford/Topo/MST/UF),
         SQL Indexes + Transactions + Normalization + Views,
         Spring Boot JPA/Hibernate
```

### Problems Attempted (target: 3-4 per weekday)

| Week      | Mon | Tue | Wed | Thu | Fri | Total   |
| --------- | --- | --- | --- | --- | --- | ------- |
| 1         | ☐☐  | ☐☐  | ☐☐  | ☐☐  | ☐☐☐ | /11     |
| 2         | ☐☐  | ☐☐☐ | ☐☐☐ | ☐☐☐ | ☐☐☐ | /14     |
| 3         | ☐☐  | ☐☐  | ☐☐  | ☐☐  | ☐☐☐ | /11     |
| 4         | ☐☐  | ☐☐  | ☐☐  | ☐☐  | ☐☐  | /10     |
| **TOTAL** |     |     |     |     |     | **/46** |

### Data Structure Implementation Checklist

| Structure                    | Can Code from Memory? | Time       |
| ---------------------------- | --------------------- | ---------- |
| Array traversal patterns     | ☐                     | \_\_\_ min |
| LinkedList (singly + doubly) | ☐                     | \_\_\_ min |
| Stack                        | ☐                     | \_\_\_ min |
| Queue/Deque                  | ☐                     | \_\_\_ min |
| HashMap (separate chaining)  | ☐                     | \_\_\_ min |
| Binary Tree traversals       | ☐                     | \_\_\_ min |
| BST (insert/delete/search)   | ☐                     | \_\_\_ min |
| Heap / PriorityQueue         | ☐                     | \_\_\_ min |
| Trie                         | ☐                     | \_\_\_ min |
| Union-Find                   | ☐                     | \_\_\_ min |

### Algorithm Checklist

| Algorithm                    | Can Code from Memory? | Time       |
| ---------------------------- | --------------------- | ---------- |
| Binary Search                | ☐                     | \_\_\_ min |
| Merge Sort                   | ☐                     | \_\_\_ min |
| Quick Sort                   | ☐                     | \_\_\_ min |
| BFS (graph + grid)           | ☐                     | \_\_\_ min |
| DFS (graph + grid)           | ☐                     | \_\_\_ min |
| Dijkstra                     | ☐                     | \_\_\_ min |
| Bellman-Ford                 | ☐                     | \_\_\_ min |
| Topological Sort (Kahn's)    | ☐                     | \_\_\_ min |
| Kruskal's MST                | ☐                     | \_\_\_ min |
| Sliding Window (fixed + var) | ☐                     | \_\_\_ min |
| Two Pointers                 | ☐                     | \_\_\_ min |
| Backtracking template        | ☐                     | \_\_\_ min |

---

## 🎯 NEXT WEEK PREVIEW (Week 05)

```
Week 05 Focus: Dynamic Programming Deep Dive + Greedy + SQL Advanced
─────────────────────────────────────────────────────────────────────
Mon: 1D DP (Climbing Stairs, House Robber, Coin Change)
Tue: 2D DP (Unique Paths, Longest Common Subsequence)
Wed: Knapsack DP (0/1, Unbounded, Coin Change II)
Thu: Greedy Algorithms (Jump Game, Intervals)
Fri: DP + Greedy Combo + SQL Advanced JOINs
Sat: Spring Boot Security (Authentication, JWT)
Sun: Week Review
```

---

> **Navigation**: [< Previous](Day_027_Mar29_Sat.md) | [Back to Index](../../00_MASTER_INDEX.md)
