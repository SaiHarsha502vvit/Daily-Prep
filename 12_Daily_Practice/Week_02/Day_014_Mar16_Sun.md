> **Navigation**: [< Previous](Day_013_Mar15_Sat.md) | [Back to Index](../../00_MASTER_INDEX.md)

# Day 014 - Sunday, March 16, 2026

> **Week 02** | **Review Day** | **Theme:** Full Review + Speed Drills + Weak Spot Focus
> [Daily Index](../00_DAILY_PRACTICE_INDEX.md) | [Prev Day](Day_013_Mar15_Sat.md) | [Next Week](../Week_03/Day_015_Mar17_Mon.md)

---

## Completion Checklist

- [ ] Speed Drill 1: Code from scratch — no notes (30 min)
- [ ] Speed Drill 2: SQL from scratch — no notes (30 min)
- [ ] Re-attempt: Any problems you struggled with (30 min)
- [ ] Teach-back: Explain 3 concepts aloud (20 min)
- [ ] Plan: Review next week's topics (10 min)
- [ ] Bonus: Extra challenge problems (optional, 60 min)

---

> ## 📖 CHAPTER REFERENCES — Deep Dive Links
>
> Today's topics link to detailed chapter files for deeper study:
>
> | **Review: Stack, Queue, LinkedList** | [Stack & Queue Complete Guide](../../02_Data_Structures/01d_Stack_Queue.md) |
> | **Review: Sorting Algorithms** | [Sorting Fundamentals](../../03_Algorithms/02a_Sorting_Fundamentals.md) |
> | **Review: Binary Search** | [Binary Search Patterns](../../04_Patterns_Templates/06_Binary_Search_Patterns.md) |
>
> _Open the linked file for full theory, diagrams, and practice problems._

---

## SPEED DRILL 1: Code from Scratch (30 min)

**Rules:** Close all notes. Set a timer. Write these from memory.

### Round 1: Data Structures (10 min)

```
1. Implement a Stack using array (push, pop, peek, isEmpty)
2. Implement Singly LinkedList (insertAtHead, delete, contains)
   Target: < 5 minutes total for both
```

### Round 2: Algorithms (10 min)

```
3. Write Merge Sort (mergeSort + merge helper)
4. Write Binary Search (exact match template)
   Target: < 5 minutes total for both
```

### Round 3: Problem Solving (10 min)

```
5. Reverse a Linked List (iterative)
6. Two Sum using HashMap
7. Valid Parentheses using Stack
   Target: < 3 minutes each
```

**Score yourself:** \_\_\_ / 7 completed from memory without errors

---

## SPEED DRILL 2: SQL from Scratch (30 min)

Write these queries from memory:

```sql
-- Q1: Create a table 'students' with id, name, grade, department
--     (try to remember data types and constraints)

-- Q2: Insert 3 rows into students

-- Q3: Select students with grade > 80, ordered by grade DESC, top 5

-- Q4: Count students per department, show only depts with > 10 students

-- Q5: Find students scoring above their department average
--     (correlated subquery)

-- Q6: JOIN students with a 'courses' table to show student name + course name

-- Q7: Find departments where NO student scored below 50
--     (use NOT EXISTS)
```

**Score yourself:** \_\_\_ / 7 queries correct

---

## RE-ATTEMPT ZONE (30 min)

Go back to any problems from this week you struggled with:

| Day | Problem                           | Status        | Re-attempt |
| --- | --------------------------------- | ------------- | ---------- |
| 008 | Merge Two Sorted Lists (LC 21)    | ☐ Easy ☐ Hard | ☐ Done     |
| 008 | Middle of LinkedList (LC 876)     | ☐ Easy ☐ Hard | ☐ Done     |
| 009 | Sort Colors (LC 75)               | ☐ Easy ☐ Hard | ☐ Done     |
| 009 | Linked List Cycle (LC 141)        | ☐ Easy ☐ Hard | ☐ Done     |
| 010 | Valid Parentheses (LC 20)         | ☐ Easy ☐ Hard | ☐ Done     |
| 010 | Min Stack (LC 155)                | ☐ Easy ☐ Hard | ☐ Done     |
| 011 | Two Sum (LC 1)                    | ☐ Easy ☐ Hard | ☐ Done     |
| 011 | Queue using Stacks (LC 232)       | ☐ Easy ☐ Hard | ☐ Done     |
| 012 | Container with Most Water (LC 11) | ☐ Easy ☐ Hard | ☐ Done     |
| 012 | Contains Duplicate (LC 217)       | ☐ Easy ☐ Hard | ☐ Done     |

Focus on anything marked "Hard" — solve it 3 times until it's automatic.

---

## TEACH-BACK (20 min)

Explain these concepts aloud (or write) as if teaching a junior:

```
1. WHY does HashMap give O(1) lookup? What happens during a collision?
   Your explanation: ___

2. WHY does Binary Search require sorted input? What if it's not sorted?
   Your explanation: ___

3. HOW does the two-pointer technique reduce O(n²) to O(n)?
   Your explanation: ___
```

**Feynman Technique:** If you can't explain it simply, you don't understand it.

---

## 📌 Week 3 Preview

```
WHAT'S COMING:
  DS:   Binary Tree, BST, Heap/PriorityQueue
  ALGO: DFS, BFS, Heap Sort
  SQL:  UNION, CASE, Window Functions intro
  Spring Boot (Sat): REST Controllers + Error Handling

  Difficulty ramp: MEDIUM → MEDIUM-HARD
  You'll build on everything from Week 1-2!
```

---

## BONUS CHALLENGES (Optional, 60 min)

### Bonus 1: LRU Cache (LeetCode 146 — Medium)

```
Combine HashMap + Doubly LinkedList!
This is the #1 asked design question at FAANG.

Operations: get(key), put(key, value) — both O(1)
If capacity exceeded, evict Least Recently Used (tail of list).
```

### Bonus 2: Group Anagrams (LeetCode 49 — Medium)

```
Input:  ["eat","tea","tan","ate","nat","bat"]
Output: [["bat"],["nat","tan"],["ate","eat","tea"]]

HINT: HashMap where key = sorted characters
```

### Bonus 3: SQL Challenge

```sql
-- Find the 3rd highest salary without using LIMIT/OFFSET
-- (Classic interview question — use subquery approach)

SELECT DISTINCT salary FROM employees e1
WHERE 3 = (
    SELECT COUNT(DISTINCT salary) FROM employees e2
    WHERE e2.salary >= e1.salary
);
```

---

## Week 2 Final Assessment

```
MASTERY CHECKLIST:
                          Know it  Can code it  Can teach it
LinkedList (Singly)       [ ]      [ ]          [ ]
LinkedList (Doubly)       [ ]      [ ]          [ ]
Stack                     [ ]      [ ]          [ ]
Queue / Deque             [ ]      [ ]          [ ]
HashMap                   [ ]      [ ]          [ ]
HashSet                   [ ]      [ ]          [ ]
Merge Sort                [ ]      [ ]          [ ]
Quick Sort                [ ]      [ ]          [ ]
Binary Search             [ ]      [ ]          [ ]
Two Pointers              [ ]      [ ]          [ ]
SQL JOINs                 [ ]      [ ]          [ ]
SQL Aggregates + GROUP BY [ ]      [ ]          [ ]
SQL Subqueries            [ ]      [ ]          [ ]
Spring Boot DI            [ ]      [ ]          [ ]

SCORE: ___ / 42 (14 topics × 3 levels)
TARGET: 28+ (at least "can code it" for everything)
```

---

> **Navigation**: [< Previous](Day_013_Mar15_Sat.md) | [Back to Index](../../00_MASTER_INDEX.md)
