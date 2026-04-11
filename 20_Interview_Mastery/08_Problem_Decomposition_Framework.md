# 🧩 Problem Decomposition Framework — Break Any Problem Into Solvable Pieces

[⬅ Design Patterns Guide](07_Design_Patterns_Interview_Guide.md) | [📚 Index](00_INDEX.md) | [Next: Mock Interview Simulations ➡](09_Mock_Interview_Simulations.md)

---

> **"You never solve the WHOLE problem. You solve small pieces. The art is knowing HOW to split."**

---

## Table of Contents
1. [The Decomposition Mindset](#1-the-decomposition-mindset)
2. [The Universal Decomposition Process](#2-universal-decomposition-process)
3. [Decomposing DSA Problems](#3-decomposing-dsa-problems)
4. [Decomposing SQL Problems](#4-decomposing-sql-problems)
5. [Decomposing System Design Problems](#5-decomposing-system-design-problems)
6. [Decomposing OOP/Design Problems](#6-decomposing-oop-problems)
7. [10 Worked Decompositions (Cross-Domain)](#7-worked-decompositions)

---

## 1. The Decomposition Mindset

### Why Decomposition Is THE Skill

```
WHAT INTERVIEWERS ACTUALLY EVALUATE:
  20% — Did you get the right answer?
  80% — HOW did you approach the problem?

The #1 sign of a senior engineer:
  "They break complex problems into clear, manageable steps
   and can explain WHY they decomposed it that way."

THE MENTAL MODEL:
  Unsolvable complex problem
       │
       ▼
  ┌─────────────┐
  │ Decompose   │ ← Break into sub-problems
  └──────┬──────┘
         ▼
  ┌──┐ ┌──┐ ┌──┐
  │A │ │B │ │C │  ← Each sub-problem is SOLVABLE
  └─┬┘ └─┬┘ └─┬┘
    ▼    ▼    ▼
  ┌─────────────┐
  │ Compose     │ ← Combine solutions
  └──────┬──────┘
         ▼
  Complete Solution
```

### The 5W+H Decomposition

```
WHAT  → What is the problem asking? (restate in own words)
WHY   → Why is it hard? Where is the complexity?
WHEN  → When have I seen something similar? (pattern match)
WHERE → Where are the boundaries? (constraints, edge cases)
WHO   → Who are the actors/entities? (identify nouns)
HOW   → How do I break this into steps? (the actual decomposition)
```

---






> 🔬 **Section Challenge — 1. The Decomposition Mindset**
>
> **Challenge 1 (Reasoning):** `ExecutorService.submit(task)` — the task throws a `RuntimeException`. Nobody calls `future.get()`. What happens to the exception?
> <details><summary>Answer</summary>
>
> It's silently swallowed. The exception is stored in the `Future` object. Without `future.get()` or `.whenComplete()`, no one ever sees it. The thread pool thread resets and picks up the next task as if nothing happened. This is one of the most dangerous production bugs. Fix: always attach `future.whenComplete((r,ex) -> { if(ex!=null) log.error("Task failed",ex); })` or use `execute()` + `UncaughtExceptionHandler`.
> </details>
>

## 2. The Universal Decomposition Process

### Step 1: Understand (Don't Rush to Code)

```
THE INPUT-OUTPUT-CONSTRAINT TRIANGLE:

  ┌────────────┐
  │   INPUT     │  ← What do I receive? Types, ranges, structure
  └──────┬─────┘
         │
   ┌─────▼─────┐
   │  PROCESS   │  ← What transformation must happen?
   └─────┬─────┘
         │
  ┌──────▼─────┐
  │   OUTPUT    │  ← What must I return? Format, ordering
  └────────────┘

  + CONSTRAINTS: Size limits, time limits, space limits

CONCRETE EXAMPLE:
  Problem: "Given an array of integers, find two numbers that sum to target"
  INPUT:   int[] nums, int target
  OUTPUT:  int[] (two indices)
  CONSTRAINTS: Exactly one solution, can't use same element twice
  PROCESS:  Find i, j where nums[i] + nums[j] == target and i != j
```

### Step 2: Simplify (Solve an Easier Version First)

```
SIMPLIFICATION LADDER:

  Can't solve the problem?
       │
       ▼
  Level 1: What if the array was sorted? (now: two pointers)
  Level 2: What if there were only 2 elements? (trivial)
  Level 3: What if there were no duplicates? (simpler logic)
  Level 4: What if n was small (n ≤ 10)? (brute force is fine)

  Then: How do I extend my simplified solution to the full problem?

EXAMPLE — Longest Palindromic Substring:
  Full: Find longest palindromic substring in s
  Simplified:
    1. Can I check if a single string is a palindrome? (Yes, O(n))
    2. Can I find palindromes centered at each character? (Expand outward)
    3. Can I do that for all centers? (Odd + even length centers)
  → Solution emerges from simplifications: Expand Around Center O(n²)
```

### Step 3: Divide (Break Into Sub-Problems)

```
DIVISION STRATEGIES:

  1. BY DATA:
     Split array in half → solve each → merge (Merge Sort approach)
     Works when: Sub-problem solutions combine to form full solution

  2. BY DECISION:
     At each step: include this element or skip it?
     Works when: Building combinations, subsets, DP

  3. BY PHASE:
     Phase 1: Sort the data
     Phase 2: Scan for answer using sorted property
     Works when: Pre-processing enables efficient query

  4. BY ENTITY:
     Process customers, then orders, then products separately
     Works when: Clear entity boundaries (SQL, System Design)

  5. BY LAYER:
     Layer 1: Parse input
     Layer 2: Core logic
     Layer 3: Format output
     Works when: Any problem (universal approach)
```

### Step 4: Solve Each Piece

```
FOR EACH SUB-PROBLEM:
  1. Is this a known pattern? (check pattern library: File 03)
  2. What data structure fits? (check constraint map: File 02)
  3. Can I code this in < 10 lines? (if not, decompose further)

COMPOSITION RULE:
  If sub-problems are INDEPENDENT → solve separately, combine results
  If sub-problems OVERLAP → Dynamic Programming (memo/tabulation)
  If sub-problems are SEQUENTIAL → pipe output of one to input of next
```

---

## 3. Decomposing DSA Problems

### The DSA Decomposition Flowchart

```
READ PROBLEM
     │
     ▼
IDENTIFY: Input type? Output type? Constraints?
     │
     ▼
CLASSIFY: Is this about...
  ├── Searching/Finding? → Binary Search, Two Pointers, HashMap
  ├── Ordering?          → Sorting, Priority Queue
  ├── Counting?          → HashMap, Math, DP
  ├── Optimizing?        → DP, Greedy, Binary Search on Answer
  ├── Traversing?        → BFS, DFS, Stack
  ├── Building?          → Backtracking, Constructive
  └── Transforming?      → Two pointers, Sliding Window
     │
     ▼
DECOMPOSE into steps:
  Step 1: Handle edge cases
  Step 2: Pre-process (sort? build graph? compute prefix?)
  Step 3: Core algorithm (pattern from library)
  Step 4: Post-process (format output)
```

### Worked Example: Merge Intervals

```
PROBLEM: Given a collection of intervals, merge overlapping ones.
  Input:  [[1,3],[2,6],[8,10],[15,18]]
  Output: [[1,6],[8,10],[15,18]]

DECOMPOSITION:
  Step 1: UNDERSTAND
    - Input: List of [start, end] pairs
    - Output: Merged list where overlapping intervals are combined
    - Key insight: When do two intervals overlap?
      → [a,b] and [c,d] overlap when a ≤ d AND c ≤ b

  Step 2: SIMPLIFY
    - What if intervals were sorted by start time?
    - Then I only need to compare each interval with the previous merged one!
    - Overlap check becomes: current.start ≤ lastMerged.end

  Step 3: DIVIDE into sub-problems
    Sub-problem A: Sort intervals by start time → O(n log n)
    Sub-problem B: Linear scan, merge when overlap → O(n)

  Step 4: SOLVE

    public int[][] merge(int[][] intervals) {
        // Sub-problem A: Sort
        Arrays.sort(intervals, (a, b) -> a[0] - b[0]);

        // Sub-problem B: Merge
        List<int[]> merged = new ArrayList<>();
        for (int[] interval : intervals) {
            if (merged.isEmpty() || merged.getLast()[1] < interval[0]) {
                merged.add(interval);                       // no overlap
            } else {
                merged.getLast()[1] = Math.max(merged.getLast()[1], interval[1]); // merge
            }
        }
        return merged.toArray(new int[0][]);
    }

  COMPLEXITY: O(n log n) time (sorting dominates), O(n) space
```

### Worked Example: LRU Cache

```
PROBLEM: Design a data structure with O(1) get and O(1) put, evicting LRU.

DECOMPOSITION:
  Step 1: UNDERSTAND
    O(1) get by key → HashMap
    O(1) update recency → need ordered structure with fast removal
    O(1) evict oldest → need quick access to oldest element

  Step 2: WHAT DATA STRUCTURES give O(1) for each?
    HashMap: O(1) lookup by key ✓
    Doubly Linked List: O(1) remove from middle, O(1) add to end ✓
    → COMBINE BOTH: HashMap<key, Node> + Doubly Linked List

  Step 3: DIVIDE into operations
    get(key):
      1. Check HashMap → miss? return -1
      2. Hit? Move node to tail (most recent)
      3. Return value

    put(key, value):
      1. Key exists? Update value, move to tail
      2. Key new? Add to HashMap + add node to tail
      3. Over capacity? Remove head (LRU), remove from HashMap

  Step 4: Each operation is now a small, codeable step.
```

---






> 🔬 **Section Challenge — 3. Decomposing DSA Problems**
>
> **Challenge 1 (Reasoning):** `ExecutorService.submit(task)` — the task throws a `RuntimeException`. Nobody calls `future.get()`. What happens to the exception?
> <details><summary>Answer</summary>
>
> It's silently swallowed. The exception is stored in the `Future` object. Without `future.get()` or `.whenComplete()`, no one ever sees it. The thread pool thread resets and picks up the next task as if nothing happened. This is one of the most dangerous production bugs. Fix: always attach `future.whenComplete((r,ex) -> { if(ex!=null) log.error("Task failed",ex); })` or use `execute()` + `UncaughtExceptionHandler`.
> </details>
>

## 4. Decomposing SQL Problems

### The SQL Decomposition Process

```
STEP 1: UNDERSTAND THE OUTPUT
  "What does one row of the result represent?"
  → This tells you the granularity (per customer? per order? per day?)
  → This determines your GROUP BY

STEP 2: IDENTIFY TABLES NEEDED
  "Which tables have the data I need?"
  → List all table names and relevant columns
  → Determine JOIN paths between them

STEP 3: BUILD INSIDE-OUT
  "Start with the innermost query, test it, then wrap it."

  Complex query with CTE:
    WITH step1 AS (
        -- First, get the base data I need
        SELECT ... FROM ... WHERE ...
    ),
    step2 AS (
        -- Then, aggregate or transform
        SELECT ... FROM step1 GROUP BY ...
    )
    -- Finally, filter and format
    SELECT ... FROM step2 WHERE ...
```

### Worked Example: Consecutive Active Days + Revenue

```
PROBLEM: "Find users who were active at least 3 consecutive days
          AND had total revenue > $1000 in those streaks."

DECOMPOSITION:

  Sub-problem 1: Find consecutive day streaks per user
    → Islands and Gaps pattern (File 05, Pattern 8)

  Sub-problem 2: Calculate revenue within each streak
    → SUM with GROUP BY on the streak identifier

  Sub-problem 3: Filter streaks ≥ 3 days AND revenue > $1000
    → HAVING clause

  COMPOSED SOLUTION:
    WITH streaks AS (
        -- Sub-problem 1: Identify streaks
        SELECT user_id, activity_date, revenue,
               activity_date - ROW_NUMBER() OVER (
                   PARTITION BY user_id ORDER BY activity_date
               ) * INTERVAL '1 day' AS streak_id
        FROM user_activity
    ),
    streak_summary AS (
        -- Sub-problem 2: Aggregate per streak
        SELECT user_id, streak_id,
               MIN(activity_date) AS start_date,
               MAX(activity_date) AS end_date,
               COUNT(*) AS days,
               SUM(revenue) AS total_revenue
        FROM streaks
        GROUP BY user_id, streak_id
    )
    -- Sub-problem 3: Filter
    SELECT user_id, start_date, end_date, days, total_revenue
    FROM streak_summary
    WHERE days >= 3 AND total_revenue > 1000
    ORDER BY total_revenue DESC;
```

---






> 🔬 **Section Challenge — 4. Decomposing SQL Problems**
>
> **Challenge 1 (Reasoning):** `ExecutorService.submit(task)` — the task throws a `RuntimeException`. Nobody calls `future.get()`. What happens to the exception?
> <details><summary>Answer</summary>
>
> It's silently swallowed. The exception is stored in the `Future` object. Without `future.get()` or `.whenComplete()`, no one ever sees it. The thread pool thread resets and picks up the next task as if nothing happened. This is one of the most dangerous production bugs. Fix: always attach `future.whenComplete((r,ex) -> { if(ex!=null) log.error("Task failed",ex); })` or use `execute()` + `UncaughtExceptionHandler`.
> </details>
>

## 5. Decomposing System Design Problems

### The System Design Decomposition

```
STEP 1: SCOPE (Functional Requirements)
  "What are the 3-5 core features?"
  → This prevents scope creep and shows prioritization

STEP 2: SCALE (Non-Functional Requirements)
  "Users, QPS, storage, latency targets?"
  → This drives technology and architecture choices

STEP 3: STRUCTURE (High-Level Architecture)
  Break into independent services/components:
  ┌─────────────────────────────┐
  │ Client Layer                │ CDN, caching
  ├─────────────────────────────┤
  │ API Layer                   │ Gateway, load balancer
  ├─────────────────────────────┤
  │ Service Layer               │ Business logic (microservices)
  ├─────────────────────────────┤
  │ Data Layer                  │ Storage, caching, queues
  └─────────────────────────────┘

STEP 4: ZOOM IN on the hardest part
  "What's the most complex or bottleneck component?"
  → Design that in detail (data model, algorithm, scale strategy)
```

### Worked Example: Design a Ride-Sharing Service

```
DECOMPOSITION:

  Feature Decomposition:
    F1: User/driver registration & profile
    F2: Ride request → match with nearby driver
    F3: Real-time location tracking
    F4: Fare calculation & payment
    F5: Rating & review system

  Each feature becomes a SERVICE:
    User Service    → PostgreSQL (ACID for profile/payment info)
    Matching Service → Redis + GeoHash (real-time proximity)
    Location Service → Kafka + TimescaleDB (high-frequency writes)
    Pricing Service  → Isolated service (surge pricing algorithm)
    Payment Service  → External API integration (Stripe)

  THE HARD PART: Real-time driver matching
    Sub-problem A: How to find drivers within 5km?
      → GeoHash: Encode lat/lng into string, nearby locations share prefix
      → Redis GEOSEARCH: O(log(N)) for radius query

    Sub-problem B: How to choose the BEST driver?
      → Scoring: distance (40%) + rating (30%) + acceptance rate (20%) + vehicle match (10%)
      → Send request to top 3, first to accept wins

    Sub-problem C: How to handle no driver available?
      → Expand radius: 2km → 5km → 10km (with timeout between each)
      → If still none → notify user "no drivers available"
```

---






> 🔬 **Section Challenge — 5. Decomposing System Design Problems**
>
> **Challenge 1 (Reasoning):** `ExecutorService.submit(task)` — the task throws a `RuntimeException`. Nobody calls `future.get()`. What happens to the exception?
> <details><summary>Answer</summary>
>
> It's silently swallowed. The exception is stored in the `Future` object. Without `future.get()` or `.whenComplete()`, no one ever sees it. The thread pool thread resets and picks up the next task as if nothing happened. This is one of the most dangerous production bugs. Fix: always attach `future.whenComplete((r,ex) -> { if(ex!=null) log.error("Task failed",ex); })` or use `execute()` + `UncaughtExceptionHandler`.
> </details>
>

## 6. Decomposing OOP/Design Problems

### The OOP Decomposition

```
STEP 1: IDENTIFY NOUNS → these become CLASSES
  "Design a library system"
  Nouns: Library, Book, Member, Librarian, Loan, Reservation, Fine

STEP 2: IDENTIFY VERBS → these become METHODS
  "Borrow a book, return a book, search catalog, pay fine"
  borrow(Book), returnBook(Book), search(String), payFine(double)

STEP 3: IDENTIFY RELATIONSHIPS
  Library HAS-MANY Books (composition)
  Member HAS-MANY Loans (one-to-many)
  Loan HAS-ONE Book (association)
  Librarian IS-A User (inheritance)
  Member IS-A User (inheritance)

STEP 4: IDENTIFY BEHAVIORS that VARY → use PATTERNS
  "Different types of members have different borrow limits"
  → Strategy pattern for borrow policy
  "Notifications via email OR SMS"
  → Strategy pattern for notification channel
```

---






> 🔬 **Section Challenge — 6. Decomposing OOP/Design Problems**
>
> **Challenge 1 (Reasoning):** `ExecutorService.submit(task)` — the task throws a `RuntimeException`. Nobody calls `future.get()`. What happens to the exception?
> <details><summary>Answer</summary>
>
> It's silently swallowed. The exception is stored in the `Future` object. Without `future.get()` or `.whenComplete()`, no one ever sees it. The thread pool thread resets and picks up the next task as if nothing happened. This is one of the most dangerous production bugs. Fix: always attach `future.whenComplete((r,ex) -> { if(ex!=null) log.error("Task failed",ex); })` or use `execute()` + `UncaughtExceptionHandler`.
> </details>
>

## 7. 10 Worked Decompositions (Cross-Domain)

### 1. Two Sum → HashMap (DSA)

```
Problem: Two numbers in array that sum to target
Decompose:
  1. For each number x, I need (target - x) to exist
  2. Need fast lookup of "does value exist?" → HashMap
  3. One pass: for each x, check map for (target-x), then add x to map
Complexity: O(n) time, O(n) space
```

### 2. Course Schedule → Topological Sort (DSA)

```
Problem: Can you finish all courses given prerequisites?
Decompose:
  1. This is about dependencies → MODEL AS GRAPH
  2. Cycle in graph → impossible to finish
  3. Detect cycle → Topological Sort (BFS with in-degree)
  4. If all courses processed → possible; else → cycle exists
```

### 3. Word Break → DP (DSA)

```
Problem: Can string s be segmented into dictionary words?
Decompose:
  1. Can I break "leetcode" into "leet" + "code"?
  2. For position i: is s[0..j] breakable AND s[j..i] in dictionary?
  3. Overlapping subproblems → DP
  4. dp[i] = true if any j where dp[j] && s[j..i] in dict
```

### 4. Revenue by Region per Quarter (SQL)

```
Output row: one per (region, quarter)
Decompose:
  1. Need: orders + customers (for region) + date (for quarter)
  2. JOIN orders → customers on customer_id
  3. EXTRACT quarter from order_date
  4. GROUP BY region, quarter
  5. SUM(amount) for revenue
```

### 5. User Retention Cohort Analysis (SQL)

```
Problem: For each signup month, what % returned in month 2, 3, etc.?
Decompose:
  1. Get signup month per user → CTE signup_month
  2. Get activity months per user → CTE activity_months
  3. Calculate months_since_signup for each activity
  4. Count distinct users per (cohort, months_since_signup)
  5. Divide by cohort size for retention %
```

### 6. Design Twitter (System Design)

```
Decompose into independent services:
  1. Tweet Service (create, delete, read)
  2. Timeline Service (home timeline = fan-out problem)
  3. Follow Service (graph of relationships)
  4. Search Service (Elasticsearch)
  5. Notification Service (push, email)
  6. Media Service (image/video upload → S3 + CDN)
Then zoom in on hardest: Timeline generation (push vs pull vs hybrid)
```

### 7. Design Elevator System (OOP)

```
Nouns → Classes: Elevator, Floor, Button, Request, Controller
Verbs → Methods: moveUp(), moveDown(), openDoor(), addRequest()
Patterns:
  Strategy: Elevator scheduling algorithm (SCAN, LOOK, SSTF)
  State: Elevator states (Moving, Idle, Maintenance)
  Observer: Floor display updates when elevator moves
  Command: Button press creates a Request object
```

### 8. Serialize/Deserialize Binary Tree (DSA)

```
Decompose:
  1. Serialize: Convert tree to string → Preorder traversal with null markers
  2. Deserialize: Convert string back to tree → Recursive reconstruction
  3. Separator handling: Use comma between values, "null" for empty nodes
  4. Each function is independent and testable
```

### 9. Real-time Analytics Dashboard (System Design)

```
Decompose by data flow:
  1. Data Ingestion: Events from application → Kafka
  2. Stream Processing: Kafka → Flink (compute aggregates in windows)
  3. Storage: Flink → Redis (real-time) + ClickHouse (historical)
  4. API: Query layer reads from Redis (last 5 min) or ClickHouse (older)
  5. Frontend: WebSocket for live updates, REST for historical queries
```

### 10. Design a Vending Machine (OOP)

```
Nouns: VendingMachine, Product, Slot, Coin, Display, Inventory
States: IDLE → COIN_INSERTED → PRODUCT_SELECTED → DISPENSING
Decompose:
  1. State management → State pattern (define transitions)
  2. Payment → Strategy (coin, card, mobile pay)
  3. Inventory → Map<Slot, Product> with count
  4. Display → Observer (updates when state changes)
```

---






> 🔬 **Section Challenge — 7. 10 Worked Decompositions (Cross-Domain)**
>
> **Challenge 1 (Reasoning):** `ExecutorService.submit(task)` — the task throws a `RuntimeException`. Nobody calls `future.get()`. What happens to the exception?
> <details><summary>Answer</summary>
>
> It's silently swallowed. The exception is stored in the `Future` object. Without `future.get()` or `.whenComplete()`, no one ever sees it. The thread pool thread resets and picks up the next task as if nothing happened. This is one of the most dangerous production bugs. Fix: always attach `future.whenComplete((r,ex) -> { if(ex!=null) log.error("Task failed",ex); })` or use `execute()` + `UncaughtExceptionHandler`.
> </details>
>

## The Meta-Rule

```
╔══════════════════════════════════════════════════════════════╗
║  IF THE PROBLEM FEELS TOO BIG:                              ║
║                                                              ║
║    1. Restate it in your own words                          ║
║    2. Ask "what's the simplest version of this?"            ║
║    3. Solve the simple version                              ║
║    4. Ask "what's missing to get to the full problem?"      ║
║    5. Add that piece                                        ║
║    6. Repeat 4-5 until done                                 ║
║                                                              ║
║  THIS WORKS FOR:                                             ║
║    DSA, SQL, System Design, OOP, Real-world engineering     ║
╚══════════════════════════════════════════════════════════════╝
```

---

## Cross-References

| Topic | Deep Dive |
|-------|-----------|
| Pattern Recognition | [03_DSA_Pattern_Recognition_Engine](03_DSA_Pattern_Recognition_Engine.md) |
| Constraint Analysis | [02_Constraint_to_Algorithm_Map](02_Constraint_to_Algorithm_Map.md) |
| SQL Patterns | [05_SQL_Interview_Thinking](05_SQL_Interview_Thinking.md) |
| System Design | [06_System_Design_Blueprint](06_System_Design_Blueprint.md) |
| The Interview Brain | [01_The_Interview_Brain](01_The_Interview_Brain.md) |

---

[⬅ Design Patterns Guide](07_Design_Patterns_Interview_Guide.md) | [📚 Index](00_INDEX.md) | [Next: Mock Interview Simulations ➡](09_Mock_Interview_Simulations.md)
