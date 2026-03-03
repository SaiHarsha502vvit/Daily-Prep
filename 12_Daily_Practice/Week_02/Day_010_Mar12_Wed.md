# Day 010 - Wednesday, March 12, 2026

> **Week 02** | **Difficulty:** MEDIUM | **Theme:** Stack + Binary Search + SQL Aggregates
> [Daily Index](../00_DAILY_PRACTICE_INDEX.md) | [Prev Day](Day_009_Mar11_Tue.md) | [Next Day](Day_011_Mar13_Thu.md)

---

## Completion Checklist

- [ ] DS: Stack — LIFO structure (30 min)
- [ ] ALGO: Binary Search mastery (30 min)
- [ ] COMBO: Stack + search hybrid (20 min)
- [ ] REAL: Undo system / expression parsing (20 min)
- [ ] SQL: COUNT, SUM, AVG, MIN, MAX, GROUP BY (40 min)
- [ ] Q1: Coding problem 1 (20 min)
- [ ] Q2: Coding problem 2 (20 min)

---


---

> ## 📖 CHAPTER REFERENCES — Deep Dive Links
>
> Today's topics link to detailed chapter files for deeper study:
>
> | **DS: Stack (LIFO)** | [Stack & Queue Complete Guide](../../02_Data_Structures/01d_Stack_Queue.md) |
> | **ALGO: Binary Search** | [Binary Search Patterns](../../04_Patterns_Templates/06_Binary_Search_Patterns.md) |
> | **SQL: Aggregate Functions & GROUP BY** | [SQL: Aggregations & GROUP BY](../../08_SQL/06_Aggregations_GroupBy.md) |
>
> *Open the linked file for full theory, diagrams, and practice problems.*

---



## BLOCK 1: DATA STRUCTURE (30 min)

### Topic: Stack — Last In, First Out

#### WHY?

```
Stacks model any situation where the MOST RECENT item matters:
  • Undo/Redo (Ctrl+Z / Ctrl+Y) — last action undone first
  • Browser back button — last page visited, go back first
  • Function call stack — last function called returns first
  • Syntax checking — matching parentheses
  • Expression evaluation — postfix/infix conversion

MEMORY INSIGHT: The program call stack IS a stack.
  main() calls foo() calls bar() → stack: [main, foo, bar]
  bar() returns → stack: [main, foo]
  foo() returns → stack: [main]
```

#### WHAT: Operations

```
OPERATION    TIME    DESCRIPTION
──────────────────────────────────────────
push(x)      O(1)    Add to top
pop()        O(1)    Remove from top
peek()       O(1)    Look at top without removing
isEmpty()    O(1)    Check if empty
size()       O(1)    Number of elements

┌─────┐
│  30 │ ← top (peek returns this, pop removes this)
├─────┤
│  20 │
├─────┤
│  10 │
└─────┘

push(40):    pop():       peek():
┌─────┐     ┌─────┐      returns 30
│  40 │     │  20 │      (stack unchanged)
├─────┤     ├─────┤
│  30 │     │  10 │
├─────┤     └─────┘
│  20 │
├─────┤
│  10 │
└─────┘
```

#### IMPLEMENT: Stack using Array

```java
public class ArrayStack {
    private int[] data;
    private int top;

    public ArrayStack(int capacity) {
        data = new int[capacity];
        top = -1;
    }

    public void push(int val) {
        if (top == data.length - 1) throw new RuntimeException("Stack overflow");
        data[++top] = val;
    }

    public int pop() {
        if (top == -1) throw new RuntimeException("Stack underflow");
        return data[top--];
    }

    public int peek() {
        if (top == -1) throw new RuntimeException("Stack empty");
        return data[top];
    }

    public boolean isEmpty() { return top == -1; }
    public int size() { return top + 1; }
}

// In practice, use: Deque<Integer> stack = new ArrayDeque<>();
// DON'T use java.util.Stack (legacy, synchronized, slow)
```

---

## BLOCK 2: ALGORITHM (30 min)

### Topic: Binary Search — O(log n) Search

#### WHY?

```
Linear search: check every element → O(n)
  Array of 1 billion elements → 1 billion comparisons

Binary search: eliminate half each step → O(log n)
  Array of 1 billion elements → ~30 comparisons!

PREREQUISITE: Array must be SORTED.

HOW IT WORKS:
  [2, 5, 8, 12, 16, 23, 38, 56, 72, 91]   target = 23
  
  Step 1: mid = arr[4] = 16.  16 < 23 → search right half
  [                      23, 38, 56, 72, 91]
  
  Step 2: mid = arr[7] = 56.  56 > 23 → search left half
  [                      23, 38]
  
  Step 3: mid = arr[5] = 23.  23 == 23 → FOUND! ✓
  
  3 steps instead of 6 (linear would need to check indices 0-5)
```

#### IMPLEMENT: Two Templates

```java
// ═══════════════════════════════════════════════════════════════
// TEMPLATE 1: Exact match
// ═══════════════════════════════════════════════════════════════
public int binarySearch(int[] arr, int target) {
    int left = 0, right = arr.length - 1;

    while (left <= right) {
        int mid = left + (right - left) / 2;  // Avoids overflow!

        if (arr[mid] == target) return mid;
        else if (arr[mid] < target) left = mid + 1;
        else right = mid - 1;
    }

    return -1;  // Not found
}

// ═══════════════════════════════════════════════════════════════
// TEMPLATE 2: Lower bound (first element >= target)
// Used in: floor/ceil, range queries, insertion point
// ═══════════════════════════════════════════════════════════════
public int lowerBound(int[] arr, int target) {
    int left = 0, right = arr.length;

    while (left < right) {          // Note: < not <=
        int mid = left + (right - left) / 2;
        if (arr[mid] < target) left = mid + 1;
        else right = mid;           // Note: mid not mid-1
    }

    return left;  // First position where arr[pos] >= target
}
```

**CRITICAL PATTERN:** Binary search isn't just for sorted arrays. It works any time you can split a problem into "yes/no" halves (monotonic predicate).

---

## BLOCK 3: COMBO CHALLENGE (20 min)

### Valid Parentheses (LeetCode 20 — Easy)

Stack + pattern matching combined.

```
Input:  "({[]})"   → true
Input:  "({[}])"   → false
Input:  "((("       → false

ALGORITHM:
  For each char:
    If opening bracket: push to stack
    If closing bracket: check if top of stack matches
    
  At end: stack must be empty
```

```java
public boolean isValid(String s) {
    Deque<Character> stack = new ArrayDeque<>();

    for (char c : s.toCharArray()) {
        if (c == '(' || c == '{' || c == '[') {
            stack.push(c);
        } else {
            if (stack.isEmpty()) return false;
            char top = stack.pop();
            if (c == ')' && top != '(') return false;
            if (c == '}' && top != '{') return false;
            if (c == ']' && top != '[') return false;
        }
    }

    return stack.isEmpty();
}
```

---

## BLOCK 4: REAL-WORLD SCENARIO (20 min)

### Problem: Undo/Redo System

```
SCENARIO: Text editor undo/redo — two stacks!

  undoStack: tracks all actions
  redoStack: tracks undone actions

  Type "Hello"    → undo: [Hello]    redo: []
  Type " World"   → undo: [Hello, World] redo: []
  Press Ctrl+Z    → undo: [Hello]    redo: [World]    ← pop undo, push redo
  Press Ctrl+Z    → undo: []         redo: [World, Hello]
  Press Ctrl+Y    → undo: [Hello]    redo: [World]    ← pop redo, push undo
  Type " Java"    → undo: [Hello, Java] redo: []      ← new action CLEARS redo!
  
  WHY clear redo on new action?
  You went back in time, then did something NEW → old future is invalid.
  (Same as git: checkout old commit + make new commit = old branch abandoned)
```

---

## BLOCK 5: SQL (40 min)

### Topic: Aggregate Functions + GROUP BY

```sql
-- ═══════════════════════════════════════════════════════════════
-- AGGREGATE FUNCTIONS — Summarize data
-- ═══════════════════════════════════════════════════════════════

-- COUNT: How many rows?
SELECT COUNT(*) FROM employees;               -- All rows
SELECT COUNT(phone) FROM employees;           -- Non-NULL phones only
SELECT COUNT(DISTINCT department) FROM employees;  -- Unique departments

-- SUM, AVG, MIN, MAX
SELECT SUM(salary) AS total_payroll FROM employees;
SELECT AVG(salary) AS avg_salary FROM employees;
SELECT MIN(salary) AS lowest, MAX(salary) AS highest FROM employees;

-- ═══════════════════════════════════════════════════════════════
-- GROUP BY — Aggregate per category
-- ═══════════════════════════════════════════════════════════════

-- Average salary PER department
SELECT department, AVG(salary) AS avg_salary
FROM employees
GROUP BY department;

-- Count employees per department, sorted by count
SELECT department, COUNT(*) AS headcount
FROM employees
GROUP BY department
ORDER BY headcount DESC;

-- ═══════════════════════════════════════════════════════════════
-- HAVING — Filter groups (WHERE filters rows, HAVING filters groups)
-- ═══════════════════════════════════════════════════════════════

-- Departments with average salary > 60000
SELECT department, AVG(salary) AS avg_sal
FROM employees
GROUP BY department
HAVING AVG(salary) > 60000;

-- ═══════════════════════════════════════════════════════════════
-- EXECUTION ORDER (memorize this!):
-- FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT
-- ═══════════════════════════════════════════════════════════════
```

#### SQL Practice

```sql
-- Exercise 1: Find total salary expense per department
-- Exercise 2: Find departments with more than 5 employees
-- Exercise 3: Find the highest-priced product in each category
-- Exercise 4: Count orders per month in 2025 (use GROUP BY with date functions)
```

---

## BLOCK 6: CODING PROBLEMS (40 min)

### Q1: Search Insert Position (LeetCode 35 — Easy)

```
Given sorted array, find index of target or where it would be inserted.

Input:  [1, 3, 5, 6], target = 5  → Output: 2 (found at index 2)
Input:  [1, 3, 5, 6], target = 2  → Output: 1 (would insert at index 1)

This is exactly the LOWER BOUND template from today!
```

```java
public int searchInsert(int[] nums, int target) {
    int left = 0, right = nums.length;
    while (left < right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] < target) left = mid + 1;
        else right = mid;
    }
    return left;
}
```

### Q2: Min Stack (LeetCode 155 — Medium)

```
Design a stack that supports push, pop, top, AND getMin in O(1).

TRICK: Maintain a second stack that tracks the minimum at each level.

push(5):  main: [5]       min: [5]
push(3):  main: [5,3]     min: [5,3]      ← new min: 3
push(7):  main: [5,3,7]   min: [5,3,3]    ← min still 3
pop():    main: [5,3]     min: [5,3]
getMin(): return min.peek() = 3 ✓
```

```java
class MinStack {
    Deque<Integer> stack = new ArrayDeque<>();
    Deque<Integer> minStack = new ArrayDeque<>();

    public void push(int val) {
        stack.push(val);
        if (minStack.isEmpty() || val <= minStack.peek()) {
            minStack.push(val);
        } else {
            minStack.push(minStack.peek());
        }
    }

    public void pop() {
        stack.pop();
        minStack.pop();
    }

    public int top() { return stack.peek(); }
    public int getMin() { return minStack.peek(); }
}
```

---

## End of Day Reflection

```
WHAT I LEARNED TODAY:
- [ ] Stack: LIFO, use ArrayDeque not Stack class
- [ ] Binary Search: two templates (exact + lower bound)
- [ ] Valid Parentheses is the classic stack problem
- [ ] SQL GROUP BY + HAVING + execution order

CONFIDENCE LEVEL: 😟 | 😐 | 😊 | 🔥

TOMORROW'S PREVIEW: Queue/Deque + HashMap intro + SQL JOINs Part 1
```
