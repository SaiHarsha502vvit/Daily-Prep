> **Navigation**: [< Previous](Day_020_Mar22_Sat.md) | [Back to Index](../../00_MASTER_INDEX.md)

# Day 021 — Sunday, March 23, 2026

> **Week 03** | **Review Day** | **Theme:** Full Review + Speed Drills + Weak Spot Focus
> [Daily Index](../00_DAILY_PRACTICE_INDEX.md) | [Prev Day](Day_020_Mar22_Sat.md) | [Next Week](../Week_04/Day_022_Mar24_Mon.md)

---

## Completion Checklist

- [ ] Speed Drill 1: Code from scratch (30 min)
- [ ] Speed Drill 2: SQL from scratch (30 min)
- [ ] Re-attempt zone (30 min)
- [ ] Teach-back exercise (20 min)
- [ ] Week 4 preview (10 min)
- [ ] Bonus challenges (optional, 60 min)

---

> ## 📖 CHAPTER REFERENCES — Deep Dive Links
>
> Today's topics link to detailed chapter files for deeper study:
>
> | **Review: BST, Heap, Backtracking, Sliding Window** | [Trees Complete Guide](../../03_Algorithms/05_Trees.md) |
> | **Review: Recursion + Backtracking** | [Recursion Fundamentals](../../03_Algorithms/03b_Recursion_Fundamentals.md) |
>
> *Open the linked file for full theory, diagrams, and practice problems.*

---



## SPEED DRILL 1: Code from Scratch (30 min)

### Round 1: Trees (10 min)
```
1. Build a BST: insert, search, findMin — from memory
2. Preorder traversal (iterative with stack)
3. Level-order traversal (BFS with queue)
   Target: All 3 in under 10 minutes
```

### Round 2: Heap + Sort (10 min)
```
4. MinHeap: insert (sift up) + extractMin (sift down)
5. Heap Sort (build max-heap + extract)
   Target: Both in under 10 minutes
```

### Round 3: Patterns (10 min)
```
6. Sliding window: max sum subarray of size k
7. Backtracking: generate all subsets of [1,2,3]
8. Variable window: longest substring without repeating chars
   Target: All 3 in under 10 minutes
```

**Score:** ___ / 8 completed from memory

---

## SPEED DRILL 2: SQL from Scratch (30 min)

```sql
-- Q1: UNION two tables of customer contacts

-- Q2: CASE to classify employees as Junior/Mid/Senior by years of experience

-- Q3: Window function — rank employees by salary within department

-- Q4: LAG to show previous month's revenue beside current month

-- Q5: CTE to find departments where avg salary > company avg salary

-- Q6: Self-JOIN to find employees who earn more than their manager

-- Q7: Running total of order amounts ordered by date
```

**Score:** ___ / 7 queries correct

---

## RE-ATTEMPT ZONE (30 min)

| Day | Problem | Difficulty | Re-attempt |
|-----|---------|------------|------------|
| 015 | LC 144 Preorder Traversal | Easy | ☐ Done |
| 015 | LC 94 Inorder Traversal | Easy | ☐ Done |
| 016 | LC 700 Search in BST | Easy | ☐ Done |
| 016 | LC 102 Level Order Traversal | Med | ☐ Done |
| 017 | LC 215 Kth Largest Element | Med | ☐ Done |
| 017 | LC 347 Top K Frequent | Med | ☐ Done |
| 018 | LC 78 Subsets | Med | ☐ Done |
| 018 | LC 46 Permutations | Med | ☐ Done |
| 019 | LC 3 Longest Substring | Med | ☐ Done |
| 019 | LC 104 Max Depth | Easy | ☐ Done |
| 019 | LC 226 Invert Binary Tree | Easy | ☐ Done |

Priority: Anything you couldn't solve in < 5 minutes → solve 3 times.

---

## TEACH-BACK (20 min)

Explain as if teaching a junior:

```
1. Draw BST insertion of [5, 3, 7, 1, 4, 6, 8].
   Then explain: what makes inorder traversal give sorted order?

2. Why does a min-heap guarantee O(1) peek but O(log n) insert?
   Draw the sift-up process for inserting 1 into heap [3, 5, 7, 8].

3. Explain the backtracking template in 4 sentences.
   Draw the decision tree for subsets of [1, 2].
```

---

## 📌 Week 4 Preview

```
WHAT'S COMING:
  DS:   Trie (Prefix Tree), Graph basics (Adjacency List)
  ALGO: Dijkstra, Topological Sort, Trie operations
  SQL:  Indexes, EXPLAIN, query optimization
  Spring Boot (Sat): JPA + Hibernate + Database Integration

  Difficulty ramp: MEDIUM-HARD
  Building on trees (→ tries) and BFS (→ Dijkstra)!
```


---

## BONUS CHALLENGES (Optional)

### Bonus 1: LC 98 — Validate BST (Medium)

```
Use inorder traversal — values must be strictly increasing.
Or recursive with min/max bounds.
```

```java
boolean isValidBST(TreeNode root) {
    return validate(root, Long.MIN_VALUE, Long.MAX_VALUE);
}

boolean validate(TreeNode node, long min, long max) {
    if (node == null) return true;
    if (node.val <= min || node.val >= max) return false;
    return validate(node.left, min, node.val) 
        && validate(node.right, node.val, max);
}
```

### Bonus 2: LC 230 — Kth Smallest in BST (Medium)

```java
// Inorder traversal = sorted order → just count to k
int count = 0, result = 0;

public int kthSmallest(TreeNode root, int k) {
    inorder(root, k);
    return result;
}

void inorder(TreeNode node, int k) {
    if (node == null) return;
    inorder(node.left, k);
    if (++count == k) { result = node.val; return; }
    inorder(node.right, k);
}
```

### Bonus 3: LC 239 — Sliding Window Maximum (Hard)

```
Use a Deque (monotonic decreasing) to track max in window.
Key insight: Remove elements smaller than current from back of deque.
The front of deque is always the max.
```

### Bonus 4: SQL Challenge

```sql
-- Find the median salary per department
-- (one of the hardest SQL interview questions)
WITH ranked AS (
    SELECT department, salary,
        ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary) AS rn,
        COUNT(*) OVER (PARTITION BY department) AS cnt
    FROM employees
)
SELECT department, AVG(salary) AS median_salary
FROM ranked
WHERE rn IN (FLOOR((cnt + 1) / 2.0), CEIL((cnt + 1) / 2.0))
GROUP BY department;
```

---

## Cumulative Progress (Weeks 1-3)

```
TOPICS COVERED:
  Week 1: Array, String, Bubble/Selection/Insertion Sort, SQL basics
  Week 2: LinkedList, Stack, Queue, HashMap, HashSet, Merge/Quick Sort,
           Binary Search, Two Pointers, SQL WHERE→Subqueries, Spring DI
  Week 3: Binary Tree, BST, Heap, DFS, BFS, Heap Sort, Recursion,
           Backtracking, Sliding Window, SQL Window Functions + CTEs,
           Spring REST + Error Handling

PROBLEMS SOLVED:
  Week 1: 14 problems (Easy)
  Week 2: 13 problems (Easy → Medium)
  Week 3: 11 problems (Medium + 4 bonus)
  TOTAL:  38 problems (+ bonus challenges)

NEXT MILESTONE: 50 problems by end of Week 4!
```



---

> **Navigation**: [< Previous](Day_020_Mar22_Sat.md) | [Back to Index](../../00_MASTER_INDEX.md)