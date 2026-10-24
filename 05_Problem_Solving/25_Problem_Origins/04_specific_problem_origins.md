# 🧩 Part 7: Specific Problem Origins

> **Navigation**: [← Graph Algorithms](03_graph_algorithms.md) | [Chapter overview](../25_Problem_Origins.md)
> Page 4 of 4 in **Real-World Problem Origins: Where DSA Concepts Were Born**


## Two Sum - The Classic

### 📜 Origin: Database Join Operations

```
SETTING: Early relational databases (1970s)

PROBLEM:
- Table A: Products (id, name)
- Table B: Prices (id, price)
- Find matching products by id

NAIVE JOIN:
for each product in A:
    for each price in B:
        if product.id == price.id:
            match!
Time: O(n × m) - Too slow!

HASH JOIN (Two Sum Pattern):
1. Build hash table from smaller table
2. Probe with larger table

for each price in B:
    hashMap[price.id] = price

for each product in A:
    if product.id in hashMap:
        match: product + hashMap[product.id]

Time: O(n + m) - Linear!

THIS BECAME:
- Two Sum algorithm
- Hash Join in databases
- Core of SQL engines
```

---

🔬 **Section Challenge — Two Sum - The Classic**

**Challenge 1 (Two Sum: HashMap vs Two-Pointer Tradeoff):** Two Sum can be solved with: (A) `HashMap<value, index>` in O(n) time, O(n) space, or (B) sort + two-pointer in O(n log n) time, O(1) space (if returning indices is not required). **Who** picks which approach? **When** does approach B fail? **What** is the key constraint difference?

<details><summary>Answer</summary>

**Who picks:** The interviewer's constraint or the problem variant. **Approach A (HashMap):** Add each element's value → index to map. For each element, check if `target - nums[i]` is in map. O(n) time, O(n) space. Returns actual indices. Works on any array (sorted or not). **Approach B (Two-Pointer):** Sort the array. Use `lo` and `hi` pointers. If `arr[lo] + arr[hi] == target`, found. If sum < target, `lo++`. If sum > target, `hi--`. O(n log n) sort + O(n) scan = O(n log n) total. O(1) extra space. **When approach B FAILS:** When you need to return the ORIGINAL indices (not values). Sorting destroys the original indices. You'd need to store index mappings, negating the space benefit. **When approach B is PREFERRED:** LC 167 (Two Sum II — Input Array Is Sorted): already sorted, no extra space needed. Any problem where you only need values, not indices. **Key constraint:** "Return indices" → HashMap approach. "Return values only" on sorted array → two-pointer. The two-pointer technique generalizes to 3Sum, 4Sum by adding outer loops.

</details>

<details><summary>More detail</summary>

The invariant: all pairs we SKIP are guaranteed to not contain the answer. In 3Sum: once we fix `nums[i]` and use l/r pointers, we can safely skip because the array is sorted. If `sum > 0`: decreasing r decreases the sum (smaller right value). If `sum < 0`: increasing l increases the sum (larger left value). We never skip a valid pair because monotonicity guarantees it.

</details>

## LRU Cache - The Interview Favorite

### 📜 Origin: CPU Cache Design (1960s)

```
SETTING: IBM System/360 Computer

PROBLEM:
- CPU much faster than RAM
- Add small fast memory (cache)
- Cache full - which item to remove?

OPTIONS CONSIDERED:
1. FIFO: Remove oldest
   Problem: Old item might be frequently used!

2. LFU (Least Frequently Used): Remove least used
   Problem: Item used 100 times yesterday but not today

3. LRU (Least Recently Used): Remove least recent
   Insight: "If used recently, likely to be used again"

IMPLEMENTATION CHALLENGE:
- Need O(1) access (HashMap)
- Need O(1) update order (LinkedList)
- Combine both!

SOLUTION:
HashMap: key → Node in LinkedList
LinkedList: Most Recent ←→ ... ←→ Least Recent

Access item:
1. O(1) find in HashMap
2. O(1) move to front of LinkedList

THIS IS NOW:
- In every CPU cache
- In every database cache
- In Redis, Memcached
- In your browser!
```

---

## Valid Parentheses - Compiler Design

### 📜 Origin: Programming Language Parsers (1960s)

```
SETTING: Development of ALGOL language

PROBLEM:
- Code has nested structures
- if (x > 0) { while (y) { } }
- Compiler must verify brackets match

PARSER'S CHALLENGE:
- See '(' → expect ')' later
- See '{' → expect '}' later
- Most recent open must close first
- That's LIFO - use STACK!

VALIDATION:
Code: if (x > 0) { y = (a + b); }

( → push ')' to stack    Stack: [)]
) → pop, matches         Stack: []
{ → push '}' to stack    Stack: [}]
( → push ')' to stack    Stack: [}, )]
) → pop, matches         Stack: [}]
} → pop, matches         Stack: []
End: stack empty = VALID!

THIS IS:
- How GCC validates C code
- How javac validates Java
- How browsers validate HTML
- How JSON parsers work
```

---

## 📌 Part 8: Connecting Leetcode to Your Future Job

### Problem → Job Role Mapping (a rough guide, not a rule)

| LeetCode Category | Used By                | Job Roles             |
| ----------------- | ---------------------- | --------------------- |
| Array/String      | Everyone               | All SWE roles         |
| Two Pointers      | Database engineers     | Backend, DB           |
| Sliding Window    | Network engineers      | Infrastructure        |
| HashMap           | Application developers | Full-stack            |
| Tree/Graph        | System designers       | Senior SWE, Architect |
| DP                | Optimization teams     | ML, Algorithms        |
| BFS/DFS           | Data engineers         | Big Data, Search      |

### Companies and Problem Types

Interview emphasis varies by company, team and year, and public tags on problem sites are community-reported, not official. Do not infer an employer's real systems from the topics it asks about; learn the pattern, then learn how production systems add scale, concurrency and failure handling (see [LeetCode ↔ Real-World Map](../../04_Patterns_Templates/05_LeetCode_RealWorld_Map.md)).

---

## 📌 Final Wisdom

> [!TIP]
> Many classic algorithms did begin as answers to real engineering or mathematical problems (mazes, sorting for translation, routing, lookup tables). Others were invented for teaching or contests. Knowing the story helps you remember *why* an algorithm works and *when* to use it — but the proof, not the story, is what you rely on.

---

_Reference this guide whenever you learn a new topic to understand its origin!_ 🌍

---


---

### Historical Evolution

This chapter retells the origins of well-known algorithms: binary search (Mauchly, 1946), merge sort (von Neumann, 1945), quicksort (Hoare, 1959), dynamic programming (Bellman, 1950s), BFS (Moore, 1959), depth-first maze strategies (Trémaux, described by Lucas in 1882), Dijkstra's algorithm (designed 1956, published 1959) and hashing (Luhn, 1953). The ACM collegiate programming contest began in 1970 and became international in 1977.

- **Von Neumann — 1945**: Merge sort
- **Mauchly — 1946**: Binary search lectures
- **Luhn — 1953**: Hashing
- **Dijkstra — 1956/1959**: Shortest paths
- **Hoare — 1959**: Quicksort
- **Moore — 1959**: BFS for mazes

---

[← Graph Algorithms](03_graph_algorithms.md) | [Chapter overview](../25_Problem_Origins.md)
