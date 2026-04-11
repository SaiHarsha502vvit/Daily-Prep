> **Navigation**: [< Previous](04_Array_String_Thinking.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](06_Implementation_Checklist.md)

# 🧭 Universal Problem-Solving Framework — 6-Step Method for ANY Problem

> **The key insight**: Every problem — DSA, SQL, system design — follows the same thinking process. Master this 6-step framework and you'll never freeze in front of a problem again.

---

## The 6 Steps

```
┌──────────────────────────────────────────────────────────────┐
│  1. READ    → Understand what's asked (not what you assume)  │
│  2. CLASSIFY → What type of problem is this?                 │
│  3. PLAN    → Choose strategy, design approach               │
│  4. CODE    → Translate plan to code                         │
│  5. TEST    → Verify with examples and edge cases            │
│  6. OPTIMIZE → Can we do better?                             │
└──────────────────────────────────────────────────────────────┘
```

**Flow:**
- 1. READ
- ↓
- Understand what's asked (not what you assume)
- ↓
- 2. CLASSIFY
- ↓
- What type of problem is this?
- ↓
- 2. CLASSIFY
- ↓
- What type of problem is this?
- ↓
- 3. PLAN
- ↓
- Choose strategy, design approach
- ↓
- 3. PLAN
- ↓
- Choose strategy, design approach
- ↓
- 4. CODE
- ↓
- Translate plan to code
- ↓
- 4. CODE
- ↓
- Translate plan to code
- ↓
- 5. TEST
- ↓
- Verify with examples and edge cases
- ↓
- 5. TEST
- ↓
- Verify with examples and edge cases
- ↓
- 6. OPTIMIZE
- ↓
- Can we do better?

```mermaid
flowchart TD
    N1["1. READ → Understand what's asked (not what you assume)"]
    N2["2. CLASSIFY → What type of problem is this?"]
    N3["3. PLAN → Choose strategy, design approach"]
    N4["4. CODE → Translate plan to code"]
    N5["5. TEST → Verify with examples and edge cases"]
    N6["6. OPTIMIZE → Can we do better?"]
    N1 --> N2
    N2 --> N3
    N3 --> N4
    N4 --> N5
    N5 --> N6
```

---

## Step 1: READ — Actually Understand the Problem

### The 5 Questions to Ask
```
1. What is the INPUT? (type, size, constraints, range)
2. What is the OUTPUT? (type, format, what exactly to return)
3. What are the CONSTRAINTS? (time limit, space limit, n ≤ ?)
4. What are the EDGE CASES? (empty, single element, all same, negative)
5. Can I REPHRASE this in my own words?
```

### Constraint-to-Complexity Mapping (CRITICAL)
```
n ≤ 10        → O(n!) or O(2ⁿ) — Brute force, backtracking OK
n ≤ 20        → O(2ⁿ) — Bitmask DP, meet-in-the-middle
n ≤ 100       → O(n³) — Floyd-Warshall, 3D DP
n ≤ 1,000     → O(n²) — Simple DP, Nested loops
n ≤ 10,000    → O(n²) — Might barely pass
n ≤ 100,000   → O(n log n) — Sorting, Binary search, Segment tree
n ≤ 1,000,000 → O(n) — Linear scan, HashMap, Two pointers
n ≤ 10⁸       → O(n) — Must be single pass
n > 10⁸       → O(log n) or O(1) — Math, Binary search on answer
```

**Flow:**
- n ≤ 10
- ↓
- O(n!) or O(2ⁿ) — Brute force, backtracking OK
- ↓
- n ≤ 20
- ↓
- O(2ⁿ) — Bitmask DP, meet-in-the-middle
- ↓
- n ≤ 100
- ↓
- O(n³) — Floyd-Warshall, 3D DP
- ↓
- n ≤ 1,000
- ↓
- O(n²) — Simple DP, Nested loops
- ↓
- n ≤ 10,000
- ↓
- O(n²) — Might barely pass
- ↓
- n ≤ 100,000
- ↓
- O(n log n) — Sorting, Binary search, Segment tree

```mermaid
flowchart TD
    N1["n ≤ 10"]
    N2["O(n!) or O(2ⁿ) — Brute force, backtracking OK"]
    N3["n ≤ 20"]
    N4["O(2ⁿ) — Bitmask DP, meet-in-the-middle"]
    N5["n ≤ 100"]
    N6["O(n³) — Floyd-Warshall, 3D DP"]
    N7["n ≤ 1,000"]
    N8["O(n²) — Simple DP, Nested loops"]
    N9["n ≤ 10,000"]
    N10["O(n²) — Might barely pass"]
    N11["n ≤ 100,000"]
    N12["O(n log n) — Sorting, Binary search, Segment tree"]
    N13["n ≤ 1,000,000"]
    N14["O(n) — Linear scan, HashMap, Two pointers"]
    N15["n ≤ 10⁸"]
    N16["O(n) — Must be single pass"]
    N17["n &gt; 10⁸"]
    N18["O(log n) or O(1) — Math, Binary search on answer"]
    N1 --> N2
    N3 --> N4
    N5 --> N6
    N7 --> N8
    N9 --> N10
    N11 --> N12
    N13 --> N14
    N15 --> N16
    N17 --> N18
```

---

## Step 2: CLASSIFY — What Type of Problem Is This?

### The Classification Decision Tree
```
Does the problem ask about...

OPTIMIZATION (min/max/best)?
├── Can previous choices be reused? → Dynamic Programming
├── Does greedy choice lead to global optimum? → Greedy
└── Need to try all combinations? → Backtracking

COUNTING (how many ways/paths/subsets)?
└── → Dynamic Programming (almost always)

SEARCHING/EXISTENCE (is there a...? can we...?)?
├── Sorted data? → Binary Search
├── Graph/tree? → BFS/DFS
└── State space? → BFS (shortest) or DFS (any path)

ORDERING (sequence, schedule, dependency)?
├── Dependencies? → Topological Sort
└── Optimal order? → DP or Greedy

GROUPING (partition, cluster, components)?
├── Graph connected components? → Union-Find or DFS
└── k-groups optimization? → DP or Greedy

DATA RETRIEVAL (query, lookup)?
├── Range queries? → Segment Tree / Prefix Sum
├── Key-value? → HashMap
└── Top-K? → Heap / QuickSelect

STRING MANIPULATION?
├── Pattern matching? → KMP / Rabin-Karp
├── Palindrome? → Two pointers / DP
└── Subsequence comparison? → DP (LCS, Edit Distance)
```

**Flow:**
- Can previous choices be reused?
- ↓
- Dynamic Programming
- ↓
- Does greedy choice lead to global optimum?
- ↓
- Greedy
- ↓
- Sorted data?
- ↓
- Binary Search
- ↓
- Graph/tree?
- ↓
- BFS/DFS
- ↓
- Dependencies?
- ↓
- Topological Sort
- ↓
- Graph connected components?
- ↓
- Union-Find or DFS

```mermaid
flowchart TD
    N1["Can previous choices be reused?"]
    N2["Dynamic Programming"]
    N3["Does greedy choice lead to global optimum?"]
    N4["Greedy"]
    N5["Sorted data?"]
    N6["Binary Search"]
    N7["Graph/tree?"]
    N8["BFS/DFS"]
    N9["Dependencies?"]
    N10["Topological Sort"]
    N11["Graph connected components?"]
    N12["Union-Find or DFS"]
    N13["Range queries?"]
    N14["Segment Tree / Prefix Sum"]
    N15["Key-value?"]
    N16["HashMap"]
    N17["Pattern matching?"]
    N18["KMP / Rabin-Karp"]
    N19["Palindrome?"]
    N20["Two pointers / DP"]
    N1 --> N2
    N3 --> N4
    N5 --> N6
    N7 --> N8
    N9 --> N10
    N11 --> N12
    N13 --> N14
    N15 --> N16
    N17 --> N18
    N19 --> N20
```

---



> 🔬 **Section Challenge — Step 2: CLASSIFY — What Type of Problem Is This?**
>>

## Step 3: PLAN — Design Your Approach

### Planning Template
```
Write this down (mentally or on paper):

1. Data structure(s) I'll use: _______________
2. Algorithm/pattern: _______________
3. Key variables I need: _______________
4. Walk through Example 1 with my approach:
   Input: ___  → Step 1: ___ → Step 2: ___ → Output: ___
5. Walk through Example 2:
   Input: ___  → Step 1: ___ → Step 2: ___ → Output: ___
6. Does it handle edge cases? ___

If your plan doesn't work on examples → GO BACK to Step 2 and reclassify
```

**Flow:**
- Input: ___
- ↓
- Step 1: ___
- ↓
- Step 2: ___
- ↓
- Output: ___
- ↓
- Input: ___
- ↓
- Step 1: ___
- ↓
- Step 2: ___
- ↓
- Output: ___

```mermaid
flowchart TD
    N1["Input: ___"]
    N2["Step 1: ___"]
    N3["Step 2: ___"]
    N4["Output: ___"]
    N5["If your plan doesn't work on examples"]
    N6["GO BACK to Step 2 and reclassify"]
    N1 --> N2
    N2 --> N3
    N3 --> N4
    N5 --> N6
```

### The "Brute Force First" Principle
```
ALWAYS think of brute force first:
1. What's the simplest way to solve this? (even if O(n³))
2. Where is the repeated work?
3. Can I cache/skip the repeated work? → That's your optimization!

Brute Force → Identify bottleneck → Optimize that specific part

Example: Two Sum
- Brute force: Check all pairs O(n²)
- Bottleneck: "Does complement exist?" is O(n) search each time
- Optimize: HashMap makes search O(1) → Total O(n)
```

**Flow:**
- 3. Can I cache/skip the repeated work?
- ↓
- That's your optimization!
- ↓
- Brute Force
- ↓
- Identify bottleneck
- ↓
- Optimize that specific part
- ↓
- - Optimize: HashMap makes search O(1)
- ↓
- Total O(n)

```mermaid
flowchart LR
    N1["3. Can I cache/skip the repeated work?"]
    N2["That's your optimization!"]
    N3["Brute Force"]
    N4["Identify bottleneck"]
    N5["Optimize that specific part"]
    N6["- Optimize: HashMap makes search O(1)"]
    N7["Total O(n)"]
    N1 --> N2
    N3 --> N4
    N4 --> N5
    N6 --> N7
```

---



## Step 4: CODE — Translation Rules

### Code Structure Template
```java
public ReturnType solve(InputType input) {
    // 1. HANDLE EDGE CASES (empty, null, size 0/1)
    if (input == null || input.length == 0) return defaultValue;

    // 2. INITIALIZE data structures and variables
    // (declare what you planned in Step 3)

    // 3. CORE LOGIC (the algorithm)
    // (the main loop/recursion)

    // 4. RETURN the answer
    return answer;
}
```

### Common Pitfalls While Coding
```
❌ Starting to code before having a plan → Write plan first
❌ Trying to optimize while writing → Get correct solution first
❌ Not handling edge cases → Always check empty/null/single
❌ Copy-pasting without understanding → Build from template
❌ Variables named i,j,k,x,y → Use descriptive names: left, right, count
```

**Flow:**
- ❌ Starting to code before having a plan
- ↓
- Write plan first
- ↓
- ❌ Trying to optimize while writing
- ↓
- Get correct solution first
- ↓
- ❌ Not handling edge cases
- ↓
- Always check empty/null/single
- ↓
- ❌ Copy-pasting without understanding
- ↓
- Build from template
- ↓
- ❌ Variables named i,j,k,x,y
- ↓
- Use descriptive names: left, right, count

```mermaid
flowchart TD
    N1["❌ Starting to code before having a plan"]
    N2["Write plan first"]
    N3["❌ Trying to optimize while writing"]
    N4["Get correct solution first"]
    N5["❌ Not handling edge cases"]
    N6["Always check empty/null/single"]
    N7["❌ Copy-pasting without understanding"]
    N8["Build from template"]
    N9["❌ Variables named i,j,k,x,y"]
    N10["Use descriptive names: left, right, count"]
    N1 --> N2
    N3 --> N4
    N5 --> N6
    N7 --> N8
    N9 --> N10
```

---

## Step 5: TEST — Verify Correctness

### Testing Strategy (in order)
```
1. PROVIDED examples — Must pass these first
2. MINIMAL cases — Empty input, single element
3. BOUNDARY cases — n=0, n=1, n=max_value
4. TRICKY cases — All same elements, sorted/reverse-sorted, negatives
5. LARGE cases — Mental check: will this pass within time limit?
```

### Dry Run Template
```
Input: [2, 7, 11, 15], target = 9

Step | Variable States                | Action
-----|-------------------------------|---------------------------
  0  | map={}, i=0                   | Check: 9-2=7 in map? No
  1  | map={2:0}, i=1                | Check: 9-7=2 in map? Yes!
  →  | Return [0, 1]                 | Found pair

✅ Matches expected output [0, 1]
```

**Flow:**
- Input: [2, 7, 11, 15], target = 9
- ↓
- Step
- ↓
- Variable States
- ↓
- Action
- ↓
- Step
- ↓
- Variable States
- ↓
- Action
- ↓
- Return [0, 1]
- ↓
- Found pair
- ↓
- Return [0, 1]
- ↓
- Found pair
- ↓
- ✅ Matches expected output [0, 1]

```mermaid
flowchart TD
    N1["Input: [2, 7, 11, 15], target = 9"]
    N2["Step | Variable States | Action"]
    N3["→ | Return [0, 1] | Found pair"]
    N4["✅ Matches expected output [0, 1]"]
    N1 --> N2
    N2 --> N3
    N3 --> N4
```

---

## Step 6: OPTIMIZE — Can We Do Better?

### Optimization Strategies
```
Strategy 1: REDUCE time complexity
- O(n²) → O(n log n): Sort + binary search / two pointers
- O(n²) → O(n): HashMap for O(1) lookup
- O(2ⁿ) → O(n·2^(n/2)): Meet in the middle

Strategy 2: REDUCE space complexity
- HashMap → Two pointers (if sorted)
- 2D DP table → Two rows → Two variables
- Recursion → Iteration (eliminate call stack)

Strategy 3: PRECOMPUTE
- Prefix sums for range queries
- Sort for binary search
- Build adjacency list once for multiple graph queries
```

**Flow:**
- - O(n²)
- ↓
- O(n log n): Sort + binary search / two pointers
- ↓
- - O(n²)
- ↓
- O(n): HashMap for O(1) lookup
- ↓
- - O(2ⁿ)
- ↓
- O(n·2^(n/2)): Meet in the middle
- ↓
- - HashMap
- ↓
- Two pointers (if sorted)
- ↓
- - 2D DP table
- ↓
- Two rows
- ↓
- Two variables

```mermaid
flowchart TD
    N1["- O(n²)"]
    N2["O(n log n): Sort + binary search / two pointers"]
    N3["O(n): HashMap for O(1) lookup"]
    N4["- O(2ⁿ)"]
    N5["O(n·2^(n/2)): Meet in the middle"]
    N6["- HashMap"]
    N7["Two pointers (if sorted)"]
    N8["- 2D DP table"]
    N9["Two rows"]
    N10["Two variables"]
    N11["- Recursion"]
    N12["Iteration (eliminate call stack)"]
    N1 --> N2
    N1 --> N3
    N4 --> N5
    N6 --> N7
    N8 --> N9
    N9 --> N10
    N11 --> N12
```

### The "Can We Do Better?" Checklist
```
□ Am I doing any repeated computation? → Cache it (DP, memoization)
□ Am I searching linearly? → Can I sort + binary search?
□ Am I using nested loops? → Can HashMap eliminate inner loop?
□ Am I storing more than needed? → Can I use rolling variables?
□ Am I visiting nodes multiple times? → Track visited
□ Am I sorting when I don't need full sort? → Partial sort (QuickSelect for k-th)
```

**Flow:**
- □ Am I doing any repeated computation?
- ↓
- Cache it (DP, memoization)
- ↓
- □ Am I searching linearly?
- ↓
- Can I sort + binary search?
- ↓
- □ Am I using nested loops?
- ↓
- Can HashMap eliminate inner loop?
- ↓
- □ Am I storing more than needed?
- ↓
- Can I use rolling variables?
- ↓
- □ Am I visiting nodes multiple times?
- ↓
- Track visited
- ↓
- □ Am I sorting when I don't need full sort?
- ↓
- Partial sort (QuickSelect for k-th)

```mermaid
flowchart TD
    N1["□ Am I doing any repeated computation?"]
    N2["Cache it (DP, memoization)"]
    N3["□ Am I searching linearly?"]
    N4["Can I sort + binary search?"]
    N5["□ Am I using nested loops?"]
    N6["Can HashMap eliminate inner loop?"]
    N7["□ Am I storing more than needed?"]
    N8["Can I use rolling variables?"]
    N9["□ Am I visiting nodes multiple times?"]
    N10["Track visited"]
    N11["□ Am I sorting when I don't need full sort?"]
    N12["Partial sort (QuickSelect for k-th)"]
    N1 --> N2
    N3 --> N4
    N5 --> N6
    N7 --> N8
    N9 --> N10
    N11 --> N12
```

---

## Applying This to SQL Problems

```
Step 1: READ → What tables? What columns? What's the expected output?
Step 2: CLASSIFY → Is this a JOIN/GROUP BY/SUBQUERY/WINDOW problem?
Step 3: PLAN → Build query mentally: FROM → JOIN → WHERE → GROUP → SELECT
Step 4: CODE → Write the SQL
Step 5: TEST → Run against example data mentally
Step 6: OPTIMIZE → Indexes? Avoid subqueries? Use CTEs?
```

**Flow:**
- Step 1: READ
- ↓
- What tables? What columns? What's the expected out
- ↓
- Step 2: CLASSIFY
- ↓
- Is this a JOIN/GROUP BY/SUBQUERY/WINDOW problem?
- ↓
- Step 3: PLAN
- ↓
- Build query mentally: FROM
- ↓
- JOIN
- ↓
- WHERE
- ↓
- GROUP

```mermaid
flowchart TD
    N1["Step 1: READ"]
    N2["What tables? What columns? What's the expected out"]
    N3["Step 2: CLASSIFY"]
    N4["Is this a JOIN/GROUP BY/SUBQUERY/WINDOW problem?"]
    N5["Step 3: PLAN"]
    N6["Build query mentally: FROM"]
    N7["JOIN"]
    N8["WHERE"]
    N9["GROUP"]
    N10["SELECT"]
    N11["Step 4: CODE"]
    N12["Write the SQL"]
    N13["Step 5: TEST"]
    N14["Run against example data mentally"]
    N15["Step 6: OPTIMIZE"]
    N16["Indexes? Avoid subqueries? Use CTEs?"]
    N1 --> N2
    N3 --> N4
    N5 --> N6
    N6 --> N7
    N7 --> N8
    N8 --> N9
    N9 --> N10
    N11 --> N12
    N13 --> N14
    N15 --> N16
```




## Applying This to System Design

```
Step 1: READ → What are the requirements? Functional + Non-functional
Step 2: CLASSIFY → Read-heavy? Write-heavy? Real-time? Batch?
Step 3: PLAN → High-level architecture, data model, API design
Step 4: CODE → Draw the architecture diagram
Step 5: TEST → Walk through user scenarios
Step 6: OPTIMIZE → Scaling bottlenecks, caching, CDN, sharding
```

**Flow:**
- Step 1: READ
- ↓
- What are the requirements? Functional + Non-functi
- ↓
- Step 2: CLASSIFY
- ↓
- Read-heavy? Write-heavy? Real-time? Batch?
- ↓
- Step 3: PLAN
- ↓
- High-level architecture, data model, API design
- ↓
- Step 4: CODE
- ↓
- Draw the architecture diagram
- ↓
- Step 5: TEST
- ↓
- Walk through user scenarios
- ↓
- Step 6: OPTIMIZE
- ↓
- Scaling bottlenecks, caching, CDN, sharding

```mermaid
flowchart TD
    N1["Step 1: READ"]
    N2["What are the requirements? Functional + Non-functi"]
    N3["Step 2: CLASSIFY"]
    N4["Read-heavy? Write-heavy? Real-time? Batch?"]
    N5["Step 3: PLAN"]
    N6["High-level architecture, data model, API design"]
    N7["Step 4: CODE"]
    N8["Draw the architecture diagram"]
    N9["Step 5: TEST"]
    N10["Walk through user scenarios"]
    N11["Step 6: OPTIMIZE"]
    N12["Scaling bottlenecks, caching, CDN, sharding"]
    N1 --> N2
    N3 --> N4
    N5 --> N6
    N7 --> N8
    N9 --> N10
    N11 --> N12
```

---

📖 **Related Files:**
- [06_Implementation_Checklist.md](06_Implementation_Checklist.md) — Detailed coding checklist
- [08_Debugging_DryRun.md](08_Debugging_DryRun.md) — How to trace and debug
- [10_Interview_Thinking.md](10_Interview_Thinking.md) — Interview-specific framework

---
[← 04 Array & String](04_Array_String_Thinking.md) | [06 Implementation Checklist →](06_Implementation_Checklist.md)


---

> **Navigation**: [< Previous](04_Array_String_Thinking.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](06_Implementation_Checklist.md)


