> **Navigation**: [< Previous](Day_017_Mar19_Wed.md) | [Back to Index](../../00_MASTER_INDEX.md) | [Next >](Day_019_Mar21_Fri.md)

# Day 018 — Thursday, March 20, 2026

> **Week 03** | **Day 4** | **Theme:** Recursion Deepening + Backtracking Intro + SQL HAVING & Complex JOINs
> [Daily Index](../00_DAILY_PRACTICE_INDEX.md) | [Prev Day](Day_017_Mar19_Wed.md) | [Next Day](Day_019_Mar21_Fri.md)

---

## Completion Checklist

- [ ] DS+ALGO: Recursion Patterns Deep Dive (30 min)
- [ ] ALGO Deep Dive: Backtracking Framework (30 min)
- [ ] SQL Lesson: Complex JOINs + HAVING + Self-JOINs (40 min)
- [ ] Problem 1: LC 78 — Subsets (25 min)
- [ ] Problem 2: LC 46 — Permutations (25 min)
- [ ] Real-World Connection (10 min)

---

> ## 📖 CHAPTER REFERENCES — Deep Dive Links
>
> Today's topics link to detailed chapter files for deeper study:
>
> | **ALGO: Recursion Patterns** | [Recursion Fundamentals](../../03_Algorithms/03b_Recursion_Fundamentals.md) |
> | **ALGO: Backtracking Framework** | [Recursion Advanced + Backtracking](../../03_Algorithms/03c_Recursion_Advanced.md) |
> | **SQL: HAVING + Complex JOINs + Self-JOINs** | [SQL: Aggregations & GROUP BY](../../08_SQL/06_Aggregations_GroupBy.md) |
>
> _Open the linked file for full theory, diagrams, and practice problems._

---

## 1. RECURSION PATTERNS DEEP DIVE (30 min)

### WHY?

Recursion is the engine behind backtracking, divide-and-conquer, tree traversals, and dynamic programming. Mastering recursion patterns is mastering 40%+ of interview questions.

### The Three Recursion Patterns

```
PATTERN 1: LINEAR RECURSION
  f(n) calls f(n-1) once
  Example: factorial, fibonacci, linked list traversal

  factorial(5) → 5 * factorial(4) → 4 * factorial(3) → ...

PATTERN 2: TREE RECURSION
  f(n) calls f() multiple times
  Example: fibonacci (naive), generate parentheses, subsets

  fib(4) → fib(3) + fib(2)
            ↙        ↘
       fib(2)+fib(1)  fib(1)+fib(0)

PATTERN 3: ACCUMULATOR RECURSION (Tail Recursion)
  Carry result as parameter → no work after recursive call
  Example: sum with accumulator

  // NOT tail-recursive
  int sum(int n) { return n == 0 ? 0 : n + sum(n-1); }

  // Tail-recursive (JVM doesn't optimize, but concept matters)
  int sum(int n, int acc) { return n == 0 ? acc : sum(n-1, acc+n); }
```

### How to Think About Recursion

```
THE RECURSION RECIPE:
  1. What is the BASE CASE? (when do we stop?)
  2. What is ONE STEP of work? (what does this call do?)
  3. How do we make the problem SMALLER? (what do we pass forward?)
  4. How do we COMBINE results? (what do we return?)

Example: Max depth of binary tree
  1. Base case: node == null → return 0
  2. One step: compare left vs right depth
  3. Smaller: go to left child, go to right child
  4. Combine: 1 + max(left, right)
```

### Call Stack Visualization

```
maxDepth([3])
├── maxDepth([9])
│   ├── maxDepth(null) → 0
│   └── maxDepth(null) → 0
│   return 1 + max(0,0) = 1
├── maxDepth([20])
│   ├── maxDepth([15])
│   │   ├── maxDepth(null) → 0
│   │   └── maxDepth(null) → 0
│   │   return 1
│   └── maxDepth([7])
│       ├── maxDepth(null) → 0
│       └── maxDepth(null) → 0
│       return 1
│   return 1 + max(1,1) = 2
return 1 + max(1,2) = 3
```

---

## 2. ALGO DEEP DIVE: Backtracking Framework (30 min)

### WHY?

Backtracking = recursion + "undo choices." It generates all valid combinations/permutations/subsets. Many interview problems are backtracking in disguise.

### 📐 The Universal Backtracking Template

```java
void backtrack(List<List<Integer>> result, List<Integer> current,
               int[] input, int start) {
    // 1. Decision: Add current state to result (if valid)
    if (isGoal(current)) {
        result.add(new ArrayList<>(current));  // COPY!
        return; // or don't return if collecting all
    }

    // 2. Explore: Try each choice
    for (int i = start; i < input.length; i++) {
        // 3. Choose
        current.add(input[i]);

        // 4. Recurse (make problem smaller)
        backtrack(result, current, input, i + 1);

        // 5. UN-choose (backtrack!)
        current.remove(current.size() - 1);
    }
}
```

### Backtracking Decision Tree — Subsets

```
Input: [1, 2, 3]

                        []
                 /       |       \
              [1]       [2]      [3]
             /   \       |
          [1,2] [1,3]  [2,3]
           |
        [1,2,3]

Result: [], [1], [1,2], [1,2,3], [1,3], [2], [2,3], [3]

At each node:
  → Add current to result
  → Try adding each remaining element
  → Undo (backtrack) after exploring
```

### Backtracking Decision Tree — Permutations

```
Input: [1, 2, 3]

                         []
                /         |         \
             [1]         [2]        [3]
            /   \       /   \      /   \
        [1,2] [1,3] [2,1] [2,3] [3,1] [3,2]
          |     |     |     |     |     |
      [1,2,3][1,3,2][2,1,3][2,3,1][3,1,2][3,2,1]

KEY DIFFERENCE from subsets:
  Subsets: start = i+1 (no reuse, order doesn't matter)
  Permutations: use "used" array (order matters, use all)
```

---

## 3. SQL LESSON: Complex JOINs + HAVING + Self-JOINs (40 min)

### Self-JOIN — Join a Table to Itself

```sql
-- Find employees who earn more than their manager
SELECT e.name AS employee, e.salary AS emp_salary,
       m.name AS manager, m.salary AS mgr_salary
FROM employees e
JOIN employees m ON e.manager_id = m.id
WHERE e.salary > m.salary;
```

```
SELF-JOIN MENTAL MODEL:
  Imagine two COPIES of the same table side by side.

  employees e:              employees m:
  ┌────┬───────┬────────┐   ┌────┬───────┬────────┐
  │ id │ name  │ mgr_id │   │ id │ name  │ salary │
  ├────┼───────┼────────┤   ├────┼───────┼────────┤
  │ 1  │ Alice │  NULL  │   │ 1  │ Alice │  90k   │
  │ 2  │ Bob   │   1    │──→│ 1  │ Alice │  90k   │  (Bob's manager)
  │ 3  │ Carol │   1    │──→│ 1  │ Alice │  90k   │  (Carol's manager)
  └────┴───────┴────────┘   └────┴───────┴────────┘
```

### HAVING vs WHERE

```sql
-- WHERE filters ROWS before grouping
-- HAVING filters GROUPS after grouping

SELECT department, AVG(salary) AS avg_sal
FROM employees
WHERE hire_date > '2020-01-01'     -- filter rows FIRST
GROUP BY department
HAVING AVG(salary) > 60000;        -- then filter groups
```

```
EXECUTION ORDER:
  FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY
                      ↑                  ↑
              rows are grouped     groups are filtered
```

### Multi-Table JOINs

```sql
-- Three-table JOIN: employees + departments + projects
SELECT e.name, d.department_name, p.project_name
FROM employees e
JOIN departments d ON e.dept_id = d.id
JOIN project_assignments pa ON e.id = pa.employee_id
JOIN projects p ON pa.project_id = p.id
WHERE p.status = 'Active';
```

### Practice Exercises

```sql
-- Exercise 1: Find departments with more than 5 employees earning > 50k
SELECT department, COUNT(*) AS high_earners
FROM employees
WHERE salary > 50000
GROUP BY department
HAVING COUNT(*) > 5;

-- Exercise 2: Find pairs of employees in the same department
--             who were hired on the same date
SELECT e1.name, e2.name, e1.department, e1.hire_date
FROM employees e1
JOIN employees e2 ON e1.department = e2.department
    AND e1.hire_date = e2.hire_date
    AND e1.id < e2.id;  -- avoid duplicates (A,B) and (B,A)

-- Exercise 3: Find customers who placed orders in every month of 2024
SELECT c.name
FROM customers c
JOIN orders o ON c.id = o.customer_id
WHERE YEAR(o.order_date) = 2024
GROUP BY c.id, c.name
HAVING COUNT(DISTINCT MONTH(o.order_date)) = 12;
```

---

## 4. PROBLEM 1: LC 78 — Subsets

**Link:** https://leetcode.com/problems/subsets/

### Problem

Given an integer array of unique elements, return all possible subsets (power set).

### Solution

```java
class Solution {
    public List<List<Integer>> subsets(int[] nums) {
        List<List<Integer>> result = new ArrayList<>();
        backtrack(result, new ArrayList<>(), nums, 0);
        return result;
    }

    private void backtrack(List<List<Integer>> result, List<Integer> current,
                           int[] nums, int start) {
        result.add(new ArrayList<>(current));  // Add every state!

        for (int i = start; i < nums.length; i++) {
            current.add(nums[i]);                    // Choose
            backtrack(result, current, nums, i + 1); // Explore
            current.remove(current.size() - 1);      // Un-choose
        }
    }
}
// Time: O(n * 2^n) — 2^n subsets, copy each takes O(n)
// Space: O(n) recursion depth
```

```
TRACE for [1,2,3]:
  backtrack([], 0) → add []
    backtrack([1], 1) → add [1]
      backtrack([1,2], 2) → add [1,2]
        backtrack([1,2,3], 3) → add [1,2,3], return
      backtrack([1,3], 3) → add [1,3], return
    backtrack([2], 2) → add [2]
      backtrack([2,3], 3) → add [2,3], return
    backtrack([3], 3) → add [3], return
```

---

## 5. PROBLEM 2: LC 46 — Permutations

**Link:** https://leetcode.com/problems/permutations/

### Solution

```java
class Solution {
    public List<List<Integer>> permute(int[] nums) {
        List<List<Integer>> result = new ArrayList<>();
        boolean[] used = new boolean[nums.length];
        backtrack(result, new ArrayList<>(), nums, used);
        return result;
    }

    private void backtrack(List<List<Integer>> result, List<Integer> current,
                           int[] nums, boolean[] used) {
        if (current.size() == nums.length) {
            result.add(new ArrayList<>(current));
            return;
        }

        for (int i = 0; i < nums.length; i++) {
            if (used[i]) continue;  // Skip already-used elements

            used[i] = true;
            current.add(nums[i]);
            backtrack(result, current, nums, used);
            current.remove(current.size() - 1);
            used[i] = false;
        }
    }
}
// Time: O(n! * n), Space: O(n)
```

```
KEY DIFFERENCE:
  Subsets:      for (i = start; ...) — no reuse, order doesn't matter
  Permutations: for (i = 0; ...)     — reuse after undo, use boolean[] used
  Combinations: for (i = start; ...) + size==k check
```

---

## 📌 6. Real — World Connection

```
BACKTRACKING IN REAL LIFE:
  1. Sudoku solver    — try digit, check valid, backtrack if conflict
  2. N-Queens         — place queen, check attacks, backtrack
  3. Auto-complete    — generate all words matching prefix (trie+backtrack)
  4. Route planning   — try paths, backtrack on dead end
  5. Compiler parsing — try grammar rules, backtrack on mismatch
```

---

> **Navigation**: [< Previous](Day_017_Mar19_Wed.md) | [Back to Index](../../00_MASTER_INDEX.md) | [Next >](Day_019_Mar21_Fri.md)
