> **Navigation**: [Back to Index](../../00_MASTER_INDEX.md) | [Next >](Day_016_Mar18_Tue.md)

# Day 015 — Monday, March 17, 2026

> **Week 03** | **Day 1** | **Theme:** Binary Tree Fundamentals + DFS Intro + SQL UNION & CASE
> [Daily Index](../00_DAILY_PRACTICE_INDEX.md) | [Prev Day](../Week_02/Day_014_Mar16_Sun.md) | [Next Day](Day_016_Mar18_Tue.md)

---

## Completion Checklist

- [ ] DS Deep Dive: Binary Tree (30 min)
- [ ] ALGO Deep Dive: DFS — Preorder, Inorder, Postorder (30 min)
- [ ] SQL Lesson: UNION, UNION ALL, CASE WHEN (40 min)
- [ ] Problem 1: LC 144 — Binary Tree Preorder Traversal (20 min)
- [ ] Problem 2: LC 94 — Binary Tree Inorder Traversal (20 min)
- [ ] Real-World Connection (10 min)
- [ ] Self-Assessment (5 min)

---

> ## 📖 CHAPTER REFERENCES — Deep Dive Links
>
> Today's topics link to detailed chapter files for deeper study:
>
> | **DS: Binary Tree** | [Trees Complete Guide](../../03_Algorithms/05_Trees.md) |
> | **ALGO: DFS (Preorder, Inorder, Postorder)** | [Graph Fundamentals](../../03_Algorithms/05c_Graphs_Fundamentals.md) |
> | **SQL: UNION, UNION ALL, CASE WHEN** | [SQL: Subqueries & CTEs](../../08_SQL/08_Subqueries_CTEs.md) |
>
> *Open the linked file for full theory, diagrams, and practice problems.*

---



## 1. DS DEEP DIVE: Binary Tree (30 min)

### WHY?
Every hierarchical structure in computing is a tree: file systems, DOM, organization charts, JSON, XML, database indexes (B-Trees). Trees are the bridge between linear structures (arrays, lists) and complex networks (graphs). If you only learn one non-linear data structure deeply, it should be the binary tree.

### 📌 What?
A **binary tree** is a tree where each node has at most **two children** (left, right).

```
              TERMINOLOGY MAP
              ===============

                  [10]  ← Root (depth 0, level 1)
                 /    \
              [5]      [15]  ← depth 1, level 2
             /   \        \
           [3]   [7]      [20]  ← depth 2, level 3 (leaves)

    Node   = { value, left, right }
    Root   = Node with no parent
    Leaf   = Node with no children
    Height = Longest root-to-leaf path = 2
    Depth  = Distance from root (root=0)
    Size   = Total nodes = 6
```


### Tree Properties

```
Property        Formula / Rule
─────────────────────────────────────────────
Max nodes       At level i: 2^(i-1)
                Total in height h: 2^(h+1) - 1
Full tree       Every node has 0 or 2 children
Complete tree   All levels full except last (filled left→right)
Perfect tree    All internal nodes have 2 children, all leaves same level
Balanced tree   |height(left) - height(right)| ≤ 1 for every node
```


### HOW — Implementation

```java
class TreeNode {
    int val;
    TreeNode left, right;
    
    TreeNode(int val) {
        this.val = val;
    }
}

class BinaryTree {
    TreeNode root;
    
    // Count total nodes
    int size(TreeNode node) {
        if (node == null) return 0;
        return 1 + size(node.left) + size(node.right);
    }
    
    // Height of tree
    int height(TreeNode node) {
        if (node == null) return -1; // convention: empty = -1
        return 1 + Math.max(height(node.left), height(node.right));
    }
    
    // Build from array (level-order, null = no node)
    // Input: [10, 5, 15, 3, 7, null, 20]
    TreeNode buildFromArray(Integer[] arr) {
        if (arr.length == 0 || arr[0] == null) return null;
        
        TreeNode root = new TreeNode(arr[0]);
        Queue<TreeNode> queue = new LinkedList<>();
        queue.add(root);
        int i = 1;
        
        while (!queue.isEmpty() && i < arr.length) {
            TreeNode current = queue.poll();
            
            if (i < arr.length && arr[i] != null) {
                current.left = new TreeNode(arr[i]);
                queue.add(current.left);
            }
            i++;
            
            if (i < arr.length && arr[i] != null) {
                current.right = new TreeNode(arr[i]);
                queue.add(current.right);
            }
            i++;
        }
        return root;
    }
}
```

---

## 2. ALGO DEEP DIVE: DFS — Three Traversals (30 min)

### WHY?
DFS is the fundamental tree traversal — it goes deep before going wide. Three orderings (pre/in/post) each solve different problems: preorder for copying/serializing, inorder for BST sorted order, postorder for deletion/evaluation.

### WHAT — The Three Orders

```
              [1]
             /   \
           [2]    [3]
          /   \
        [4]   [5]

PREORDER  (Root → Left → Right):  1, 2, 4, 5, 3
  Use: Copy tree, serialize, prefix expression

INORDER   (Left → Root → Right):  4, 2, 5, 1, 3
  Use: BST gives sorted order, expression parsing

POSTORDER (Left → Right → Root):  4, 5, 2, 3, 1
  Use: Delete tree, evaluate expressions, calc directory sizes
```


### Memory Model — Call Stack Visualization

```
PREORDER of [1] → [2] → [4]:

Call Stack:
┌──────────────┐
│ preorder(4)  │  ← prints 4, left=null, right=null, returns
├──────────────┤
│ preorder(2)  │  ← printed 2, went left to 4
├──────────────┤
│ preorder(1)  │  ← printed 1, went left to 2
└──────────────┘

After returning from 4:
┌──────────────┐
│ preorder(5)  │  ← prints 5, returns
├──────────────┤
│ preorder(2)  │  ← left done, now going right to 5
├──────────────┤
│ preorder(1)  │  ← waiting for left subtree
└──────────────┘
```


### HOW — Recursive (clean) vs Iterative (interview-ready)

```java
// === RECURSIVE ===
void preorder(TreeNode node, List<Integer> result) {
    if (node == null) return;
    result.add(node.val);          // ROOT
    preorder(node.left, result);   // LEFT
    preorder(node.right, result);  // RIGHT
}

void inorder(TreeNode node, List<Integer> result) {
    if (node == null) return;
    inorder(node.left, result);    // LEFT
    result.add(node.val);          // ROOT
    inorder(node.right, result);   // RIGHT
}

void postorder(TreeNode node, List<Integer> result) {
    if (node == null) return;
    postorder(node.left, result);  // LEFT
    postorder(node.right, result); // RIGHT
    result.add(node.val);          // ROOT
}

// === ITERATIVE PREORDER (most common in interviews) ===
List<Integer> preorderIterative(TreeNode root) {
    List<Integer> result = new ArrayList<>();
    if (root == null) return result;
    
    Stack<TreeNode> stack = new Stack<>();
    stack.push(root);
    
    while (!stack.isEmpty()) {
        TreeNode node = stack.pop();
        result.add(node.val);
        
        // Push RIGHT first so LEFT is processed first (LIFO)
        if (node.right != null) stack.push(node.right);
        if (node.left != null)  stack.push(node.left);
    }
    return result;
}

// === ITERATIVE INORDER (Morris threading alternative exists) ===
List<Integer> inorderIterative(TreeNode root) {
    List<Integer> result = new ArrayList<>();
    Stack<TreeNode> stack = new Stack<>();
    TreeNode curr = root;
    
    while (curr != null || !stack.isEmpty()) {
        // Go as far left as possible
        while (curr != null) {
            stack.push(curr);
            curr = curr.left;
        }
        curr = stack.pop();
        result.add(curr.val);  // Process
        curr = curr.right;     // Try right
    }
    return result;
}
```

---

## 3. SQL LESSON: UNION, UNION ALL, CASE WHEN (40 min)

### WHY?
Real databases have related tables. UNION combines results from different queries. CASE adds conditional logic inside queries — like if/else for SQL. Together they handle reporting, data categorization, and combining data from multiple sources.

### UNION vs UNION ALL

```sql
-- UNION: Combines results, REMOVES duplicates (slower — sorts)
SELECT name FROM employees
UNION
SELECT name FROM contractors;

-- UNION ALL: Combines results, KEEPS duplicates (faster — no sort)
SELECT name FROM employees
UNION ALL
SELECT name FROM contractors;
```

```
RULE: Both SELECTs must have SAME number of columns
      and COMPATIBLE data types.

employees:        contractors:      UNION result:
┌───────┐        ┌───────┐        ┌───────┐
│ Alice │        │ Alice │        │ Alice │  (deduped)
│ Bob   │        │ Carol │        │ Bob   │
│ Carol │        │ Dave  │        │ Carol │
└───────┘        └───────┘        │ Dave  │
                                  └───────┘
```


### CASE WHEN — SQL's if/else

```sql
-- Categorize students by grade
SELECT name, grade,
    CASE
        WHEN grade >= 90 THEN 'A - Excellent'
        WHEN grade >= 80 THEN 'B - Good'
        WHEN grade >= 70 THEN 'C - Average'
        WHEN grade >= 60 THEN 'D - Below Average'
        ELSE 'F - Fail'
    END AS grade_letter
FROM students;
```

```
HOW CASE WORKS:
  Step 1: Evaluate WHEN conditions top → bottom
  Step 2: First TRUE match → return its THEN value
  Step 3: No match → return ELSE value (NULL if no ELSE)

  Like a switch statement — exits after first match!
```


### Combining CASE with Aggregates

```sql
-- Count students in each grade category
SELECT 
    COUNT(CASE WHEN grade >= 90 THEN 1 END) AS a_count,
    COUNT(CASE WHEN grade >= 80 AND grade < 90 THEN 1 END) AS b_count,
    COUNT(CASE WHEN grade < 80 THEN 1 END) AS other_count
FROM students;

-- Pivot: Turn rows into columns
SELECT department,
    SUM(CASE WHEN gender = 'M' THEN 1 ELSE 0 END) AS male_count,
    SUM(CASE WHEN gender = 'F' THEN 1 ELSE 0 END) AS female_count
FROM employees
GROUP BY department;
```

### Practice Exercises

```sql
-- Exercise 1: Combine products from two warehouse tables
-- warehouse_a(id, product, qty) and warehouse_b(id, product, qty)
SELECT product, qty, 'Warehouse A' AS source FROM warehouse_a
UNION ALL
SELECT product, qty, 'Warehouse B' AS source FROM warehouse_b;

-- Exercise 2: Label orders as Small/Medium/Large
SELECT order_id, total_amount,
    CASE
        WHEN total_amount < 100 THEN 'Small'
        WHEN total_amount < 1000 THEN 'Medium'
        ELSE 'Large'
    END AS order_size
FROM orders;

-- Exercise 3: Create departmental salary report
SELECT department,
    COUNT(*) AS emp_count,
    ROUND(AVG(salary), 2) AS avg_salary,
    CASE
        WHEN AVG(salary) > 80000 THEN 'High-paying'
        WHEN AVG(salary) > 50000 THEN 'Mid-range'
        ELSE 'Entry-level'
    END AS dept_category
FROM employees
GROUP BY department;
```

---

## 4. PROBLEM 1: LC 144 — Binary Tree Preorder Traversal

**Link:** https://leetcode.com/problems/binary-tree-preorder-traversal/

### Problem
Given root of a binary tree, return the preorder traversal of its values.

### Visual Walkthrough

```
Input: [1, null, 2, 3]

    [1]
      \
      [2]
      /
    [3]

Step-by-step (iterative):
  Stack: [1]
  Pop 1 → result=[1], push right=2 → Stack: [2]
  Pop 2 → result=[1,2], push left=3 → Stack: [3]
  Pop 3 → result=[1,2,3], no children → Stack: []

Output: [1, 2, 3]
```


### Solution

```java
class Solution {
    // Approach 1: Recursive (2 lines of core logic)
    public List<Integer> preorderTraversal(TreeNode root) {
        List<Integer> result = new ArrayList<>();
        dfs(root, result);
        return result;
    }
    
    private void dfs(TreeNode node, List<Integer> result) {
        if (node == null) return;
        result.add(node.val);
        dfs(node.left, result);
        dfs(node.right, result);
    }
    
    // Approach 2: Iterative with Stack
    public List<Integer> preorderTraversalIterative(TreeNode root) {
        List<Integer> result = new ArrayList<>();
        if (root == null) return result;
        
        Deque<TreeNode> stack = new ArrayDeque<>();
        stack.push(root);
        
        while (!stack.isEmpty()) {
            TreeNode node = stack.pop();
            result.add(node.val);
            if (node.right != null) stack.push(node.right);
            if (node.left != null) stack.push(node.left);
        }
        return result;
    }
}
// Time: O(n) — visit every node once
// Space: O(h) where h = height (O(log n) balanced, O(n) skewed)
```

---

## 5. PROBLEM 2: LC 94 — Binary Tree Inorder Traversal

**Link:** https://leetcode.com/problems/binary-tree-inorder-traversal/

### Problem
Given root of a binary tree, return the inorder traversal of its values.

### Visual Walkthrough

```
Input: [1, null, 2, 3]

    [1]
      \
      [2]
      /
    [3]

Inorder = Left → Root → Right

Call inorder(1):
  Call inorder(null)    → return (no left)
  Add 1 → result=[1]
  Call inorder(2):
    Call inorder(3):
      Call inorder(null) → return
      Add 3 → result=[1,3]
      Call inorder(null) → return
    Add 2 → result=[1,3,2]
    Call inorder(null)   → return

Output: [1, 3, 2]
```


### Solution — Iterative (Interview Gold)

```java
class Solution {
    public List<Integer> inorderTraversal(TreeNode root) {
        List<Integer> result = new ArrayList<>();
        Deque<TreeNode> stack = new ArrayDeque<>();
        TreeNode curr = root;
        
        while (curr != null || !stack.isEmpty()) {
            // Drill all the way left
            while (curr != null) {
                stack.push(curr);
                curr = curr.left;
            }
            // Process node
            curr = stack.pop();
            result.add(curr.val);
            // Try right subtree
            curr = curr.right;
        }
        return result;
    }
}
// Time: O(n), Space: O(h)
```

```
PATTERN TO MEMORIZE:
  "Drill left, pop & process, go right"
  This pattern appears in BST validation, kth smallest, etc.
```

---

## 📌 6. Real — World Connection

```
WHERE YOU'LL SEE TREES:

1. FILE SYSTEM
   C:\ → Users → Documents → file.txt
   = Tree traversal! "du -sh" uses postorder to calc directory sizes

2. HTML DOM
   <html> → <body> → <div> → <p>
   document.querySelector = tree search

3. JSON PARSING
   {"user": {"name": "John", "address": {"city": "NYC"}}}
   = Nested tree structure — parsed with recursive descent

4. DATABASE INDEX (B-Tree)
   SELECT * WHERE id = 42
   = Binary search down a balanced tree — O(log n) lookup

5. EXPRESSION EVALUATION
       [+]
      /   \
    [*]   [3]
   /   \
  [2]  [5]
   = (2 * 5) + 3 = 13  (postorder evaluation)
```


---

## Self-Assessment

| Concept | Confidence 1-5 |
|---------|----------------|
| TreeNode structure | ___ |
| Tree properties (height, depth, balanced) | ___ |
| Preorder traversal (recursive + iterative) | ___ |
| Inorder traversal (recursive + iterative) | ___ |
| Postorder traversal (recursive) | ___ |
| SQL UNION vs UNION ALL | ___ |
| SQL CASE WHEN | ___ |
| CASE with aggregates (pivot) | ___ |

**Target:** All 4+ before Week 3 ends.


---

> **Navigation**: [Back to Index](../../00_MASTER_INDEX.md) | [Next >](Day_016_Mar18_Tue.md)