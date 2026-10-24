# 🔍 Binary Search

> **Navigation**: [← Why Understanding Real — World Applications…](01_why_understanding_real_world_applications_matter.md) | [Chapter overview](../05_LeetCode_RealWorld_Map.md)
> Page 2 of 2 in **LeetCode ↔ Real-World Map — Pattern Guide**


## Search in Rotated Sorted Array

```
LEETCODE: https://leetcode.com/problems/search-in-rotated-sorted-array/

REAL-WORLD APPLICATIONS:

1. LOGS: Circular Buffer Search
   - Search in rotating log files
   - Used in: Log management

2. TIME SERIES: Wrap-around Search
   - Search in circular time data
   - Used in: Clock/calendar systems

3. SCHEDULING: Shift Scheduling
   - Find available slot in rotating schedule
   - Used in: Workforce management

YOUR INTERVIEW ANSWER:
"Log rotation systems use this pattern for searching.
Modified binary search: determine which half is sorted, then search."
```

## Find First and Last Position

```
LEETCODE: https://leetcode.com/problems/find-first-and-last-position-of-element-in-sorted-array/

REAL-WORLD APPLICATIONS:

1. DATABASE: Range Queries
   - Find all rows with value X
   - Used in: B-tree indexes

2. TEXT SEARCH: Word Positions
   - Find all occurrences of word
   - Used in: Document search

3. ANALYTICS: Time Range
   - Find events in time window
   - Used in: Log analysis

YOUR INTERVIEW ANSWER:
"Database range queries use lower/upper bound searches.
Two binary searches: one for first, one for last occurrence."
```

---

## 📖 Quick Reference

### Problem Category → Job Relevance

| Category       | High-Demand Roles       |
| -------------- | ----------------------- |
| Arrays/Strings | All SWE roles           |
| HashMap        | Backend, Full-stack     |
| Sliding Window | Infrastructure, Network |
| Binary Search  | Database, Search        |
| Trees          | File systems, Compilers |
| Graphs         | Social networks, Maps   |
| DP             | ML, Optimization        |
| Heaps          | Real-time systems       |

### Problems by Company

| Company   | Must-Know Problems                |
| --------- | --------------------------------- |
| Google    | Graph problems, DP                |
| Amazon    | Tree problems, System design      |
| Facebook  | Graph traversal (social networks) |
| Microsoft | String manipulation, DP           |
| Netflix   | Streaming/Window problems         |
| Uber      | Shortest path, Optimization       |

---

_Remember: Every problem you solve is used somewhere in production!_ 🌍

---


---

[← Why Understanding Real — World Applications…](01_why_understanding_real_world_applications_matter.md) | [Chapter overview](../05_LeetCode_RealWorld_Map.md)
