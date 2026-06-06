> **Navigation**: [< Previous](Day_010_Mar12_Wed.md) | [Back to Index](../../00_MASTER_INDEX.md) | [Next >](Day_012_Mar14_Fri.md)

# Day 011 - Thursday, March 13, 2026

> **Week 02** | **Difficulty:** MEDIUM | **Theme:** Queue & Deque + HashMap + SQL JOINs Part 1
> [Daily Index](../00_DAILY_PRACTICE_INDEX.md) | [Prev Day](Day_010_Mar12_Wed.md) | [Next Day](Day_012_Mar14_Fri.md)

---

## Completion Checklist

- [ ] DS: Queue & Deque (30 min)
- [ ] ALGO: HashMap internals (30 min)
- [ ] COMBO: Queue + HashMap problem (20 min)
- [ ] REAL: Task scheduler / rate limiter (20 min)
- [ ] SQL: INNER JOIN & LEFT JOIN (40 min)
- [ ] Q1: Coding problem 1 (20 min)
- [ ] Q2: Coding problem 2 (20 min)

---

> ## 📖 CHAPTER REFERENCES — Deep Dive Links
>
> Today's topics link to detailed chapter files for deeper study:
>
> | **DS: Queue & Deque** | [Stack & Queue Complete Guide](../../02_Data_Structures/01d_Stack_Queue.md) |
> | **ALGO: HashMap Internals** | [Hash Table & DS Internals](../../02_Data_Structures/01g_DS_Internals.md) |
> | **SQL: JOINs (INNER, LEFT, RIGHT)** | [SQL: JOINs Complete](../../08_SQL/07_JOINs_Complete.md) |
>
> *Open the linked file for full theory, diagrams, and practice problems.*

---



## BLOCK 1: DATA STRUCTURE (30 min)

### Topic: Queue (FIFO) and Deque (Double-Ended)

#### WHY?

```
Queue = First In, First Out
  • Printer queue — first document submitted, first printed
  • CPU task scheduling — processes wait in a queue
  • BFS (Breadth-First Search) — explores level by level using queue
  • Message queues (RabbitMQ, Kafka concept)

Deque = Both ends open
  • Sliding window problems (add/remove from both ends)
  • Undo + Redo (use as two stacks)
  • Browser history (add at end, remove from both)
```

#### WHAT: Operations

```
QUEUE (FIFO):                    DEQUE (Double-Ended):
                                 
  enqueue(x) →  ┌───┬───┬───┐   addFirst(x) → ┌───┬───┬───┐ ← addLast(x)
                 │ A │ B │ C │   removeFirst()← │ A │ B │ C │ → removeLast()
  dequeue()  ←  └───┴───┴───┘   
  (returns A)                    (can add/remove from BOTH ends)

Java:
  Queue:  Queue<Integer> q = new LinkedList<>();   // or ArrayDeque
  Deque:  Deque<Integer> dq = new ArrayDeque<>();  // recommended!
  
  Queue methods:  offer(x), poll(), peek()
  Deque methods:  offerFirst(x), offerLast(x), pollFirst(), pollLast()
```


#### IMPLEMENT: Circular Queue (Array-based)

```java
public class CircularQueue {
    private int[] data;
    private int front, rear, size;

    public CircularQueue(int capacity) {
        data = new int[capacity];
        front = 0;
        rear = -1;
        size = 0;
    }

    public boolean enqueue(int val) {
        if (size == data.length) return false;  // Full
        rear = (rear + 1) % data.length;        // Wrap around!
        data[rear] = val;
        size++;
        return true;
    }

    public int dequeue() {
        if (size == 0) throw new RuntimeException("Queue empty");
        int val = data[front];
        front = (front + 1) % data.length;      // Wrap around!
        size--;
        return val;
    }

    public int peek() { return data[front]; }
    public boolean isEmpty() { return size == 0; }
}

// WHY circular? Without wrapping, front keeps moving right
// and you "waste" space at the beginning. Circular reuses it.
```

---

## BLOCK 2: ALGORITHM (30 min)

### Topic: HashMap — O(1) Lookup Magic

#### WHY?

```
Array access by INDEX is O(1). But what if key is a string?
  "apple" → price?    Can't use "apple" as array index!

HashMap converts ANY key into an array index using a hash function.
  hash("apple") → 42   → store at bucket[42]

RESULT: O(1) average for get/put/contains
```


#### HOW: Internal Mechanism

```
┌────────────────────────────────────────────────────────────────┐
│  HashMap INTERNALS (Java 8+)                                   │
│                                                                │
│  1. Key → hashCode() → index = hash % capacity                 │
│                                                                │
│  2. Array of buckets:                                          │
│     [0] → null                                                 │
│     [1] → ("apple",5) → ("kiwi",3) → null    ← COLLISION!      │
│     [2] → ("banana",7) → null                                  │
│     [3] → null                                                 │
│     ...                                                        │
│                                                                │
│  3. COLLISION HANDLING:                                        │
│     ≤ 8 entries in bucket → Linked List (O(n) worst case)      │
│     > 8 entries in bucket → Red-Black Tree (O(log n))          │
│     This is why Java 8 HashMap is better than Java 7!          │
│                                                                │
│  4. LOAD FACTOR = 0.75                                         │
│     When 75% full → resize to 2x capacity → rehash all keys    │
│     Rehashing is O(n) but amortized over many operations       │
│                                                                │
│  COMPLEXITY:                                                   │
│    Average: O(1) for get/put/remove                            │
│    Worst:   O(log n) per bucket (tree) or O(n) (pathological)  │
│    Space:   O(n)                                               │
└────────────────────────────────────────────────────────────────┘
```


#### Common HashMap Patterns

```java
// PATTERN 1: Frequency count
Map<Character, Integer> freq = new HashMap<>();
for (char c : str.toCharArray()) {
    freq.put(c, freq.getOrDefault(c, 0) + 1);
}

// PATTERN 2: Two Sum (classic!)
Map<Integer, Integer> seen = new HashMap<>();  // value → index
for (int i = 0; i < nums.length; i++) {
    int complement = target - nums[i];
    if (seen.containsKey(complement)) {
        return new int[]{seen.get(complement), i};
    }
    seen.put(nums[i], i);
}

// PATTERN 3: Group by key
Map<String, List<String>> groups = new HashMap<>();
for (String word : words) {
    String key = sortedChars(word);  // anagram key
    groups.computeIfAbsent(key, k -> new ArrayList<>()).add(word);
}
```

---

## BLOCK 3: COMBO CHALLENGE (20 min)

### First Unique Character in String (LeetCode 387 — Easy)

Queue + HashMap combined!

```
Input:  "leetcode"    → Output: 0 (first unique = 'l')
Input:  "loveleetcode" → Output: 2 (first unique = 'v')

APPROACH: HashMap for frequency + scan for first with count==1
```


```java
public int firstUniqChar(String s) {
    Map<Character, Integer> freq = new HashMap<>();
    for (char c : s.toCharArray()) {
        freq.put(c, freq.getOrDefault(c, 0) + 1);
    }
    for (int i = 0; i < s.length(); i++) {
        if (freq.get(s.charAt(i)) == 1) return i;
    }
    return -1;
}
// Time: O(n), Space: O(26) = O(1) for lowercase English
```

---

## BLOCK 4: REAL-WORLD SCENARIO (20 min)

### Problem: API Rate Limiter (Sliding Window with Queue)

```
SCENARIO:
Your API allows max 100 requests per minute per user.

APPROACH: Queue stores timestamps of recent requests.

  User sends request at time T:
  1. Remove all timestamps older than T - 60 seconds from front of queue
  2. If queue.size() < 100: allow request, add T to queue
  3. Else: reject with HTTP 429 (Too Many Requests)

  Queue for user "john":
  [T-55, T-40, T-30, T-20, T-10, T]   ← 6 requests in last 60s → OK
  
  HashMap<String, Queue<Long>>  : userId → request timestamps

WHY Queue? Oldest timestamps naturally at front → easy to clean up.
WHY HashMap? O(1) lookup of each user's queue.
```


---

## BLOCK 5: SQL (40 min)

### Topic: JOINs — Combining Tables

#### WHY JOINs?

```
Real databases are NORMALIZED — data split across tables to avoid duplication.

employees:  id | name    | dept_id
            1  | Alice   | 10
            2  | Bob     | 20
            3  | Charlie | 10

departments: dept_id | dept_name
             10      | Engineering
             20      | Marketing
             30      | Sales          ← No employees!

To see "Alice works in Engineering" → you need a JOIN.
```


```sql
-- ═══════════════════════════════════════════════════════════════
-- INNER JOIN — Only matching rows from both tables
-- ═══════════════════════════════════════════════════════════════

SELECT e.name, d.dept_name
FROM employees e
INNER JOIN departments d ON e.dept_id = d.dept_id;

-- Result:
-- Alice   | Engineering
-- Bob     | Marketing
-- Charlie | Engineering
-- (Sales dept NOT shown — no matching employees)

-- ═══════════════════════════════════════════════════════════════
-- LEFT JOIN — All from left table + matching from right
-- ═══════════════════════════════════════════════════════════════

SELECT e.name, d.dept_name
FROM employees e
LEFT JOIN departments d ON e.dept_id = d.dept_id;

-- Same result here (all employees have valid dept_id)
-- But if an employee had dept_id = 99 (no such dept):
-- Dave | NULL

-- ═══════════════════════════════════════════════════════════════
-- RIGHT JOIN — All from right table + matching from left
-- ═══════════════════════════════════════════════════════════════

SELECT e.name, d.dept_name
FROM employees e
RIGHT JOIN departments d ON e.dept_id = d.dept_id;

-- Result:
-- Alice   | Engineering
-- Bob     | Marketing
-- Charlie | Engineering
-- NULL    | Sales          ← Sales shows, no employee match

-- ═══════════════════════════════════════════════════════════════
-- VISUAL GUIDE TO JOINS
-- ═══════════════════════════════════════════════════════════════
--
--  INNER JOIN:    Only intersection (A ∩ B)
--  LEFT JOIN:     All of A + matching B
--  RIGHT JOIN:    All of B + matching A
--  FULL OUTER:    Everything (A ∪ B)
```

#### SQL Practice

```sql
-- Exercise 1: Show all orders with customer name (INNER JOIN orders + customers)
-- Exercise 2: Show ALL customers, even those with no orders (LEFT JOIN)
-- Exercise 3: Show products with their category name, sorted by price DESC
-- Exercise 4: Find departments that have no employees (LEFT JOIN + IS NULL trick)
```

---

## BLOCK 6: CODING PROBLEMS (40 min)

### Q1: Two Sum (LeetCode 1 — Easy)

```
The most famous LeetCode problem. Uses HashMap!

Input:  nums = [2, 7, 11, 15], target = 9
Output: [0, 1]  (because nums[0] + nums[1] = 2 + 7 = 9)
```

```java
public int[] twoSum(int[] nums, int target) {
    Map<Integer, Integer> map = new HashMap<>();

    for (int i = 0; i < nums.length; i++) {
        int complement = target - nums[i];
        if (map.containsKey(complement)) {
            return new int[]{map.get(complement), i};
        }
        map.put(nums[i], i);
    }

    return new int[]{};
}
// Time: O(n), Space: O(n) — one pass!
```

### Q2: Implement Queue using Stacks (LeetCode 232 — Easy)

```
Use TWO stacks to simulate a queue (FIFO from LIFO).

push(1), push(2), push(3)
  inStack: [1, 2, 3]  outStack: []

peek() → need to return 1 (first in)
  Transfer: inStack → outStack: [3, 2, 1]
  outStack.peek() = 1 ✓

pop() → returns 1
  outStack: [3, 2]
```


```java
class MyQueue {
    Deque<Integer> inStack = new ArrayDeque<>();
    Deque<Integer> outStack = new ArrayDeque<>();

    public void push(int x) { inStack.push(x); }

    public int pop() {
        if (outStack.isEmpty()) transfer();
        return outStack.pop();
    }

    public int peek() {
        if (outStack.isEmpty()) transfer();
        return outStack.peek();
    }

    public boolean empty() { return inStack.isEmpty() && outStack.isEmpty(); }

    private void transfer() {
        while (!inStack.isEmpty()) {
            outStack.push(inStack.pop());
        }
    }
}
// Amortized O(1) per operation!
```

---

## End of Day Reflection

```
WHAT I LEARNED TODAY:
- [ ] Queue: FIFO, circular queue, Deque for both ends
- [ ] HashMap: O(1) lookup, hash function, collision handling
- [ ] SQL JOINs: INNER, LEFT, RIGHT — visual understanding
- [ ] Two Sum is the quintessential HashMap problem

CONFIDENCE LEVEL: 😟 | 😐 | 😊 | 🔥

TOMORROW'S PREVIEW: HashSet + Two Pointers technique + SQL Subqueries
```


---

> **Navigation**: [< Previous](Day_010_Mar12_Wed.md) | [Back to Index](../../00_MASTER_INDEX.md) | [Next >](Day_012_Mar14_Fri.md)