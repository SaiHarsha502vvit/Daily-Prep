> **Navigation**: [< Previous](02_Code_Templates.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](04_Pattern_Recognition.md)

# 🎨 VISUAL ALGORITHM DIAGRAMS - COMPLETE REFERENCE

## This file contains VISUAL diagrams for ALL algorithm patterns

---




## 📚 TABLE OF CONTENTS

1. [Array Operations](#array-operations)
2. [String Operations](#string-operations)
3. [Sorting Algorithms](#sorting-algorithms)
4. [Searching Algorithms](#searching-algorithms)
5. [Data Structures](#data-structures)
6. [Graph Algorithms](#graph-algorithms)
7. [Dynamic Programming](#dynamic-programming)
8. [Math & Bit Manipulation](#math--bit-manipulation)

---

## 📊 ARRAY OPERATIONS

### Two Sum (Two Pointers on Sorted Array)

```
                  TWO SUM - TWO POINTERS
──────────────────────────────────────────────────

Sorted Array: [1, 2, 3, 5, 7, 10, 11]    Target: 9

Step 1:
┌───┬───┬───┬───┬───┬────┬────┐
│ 1 │ 2 │ 3 │ 5 │ 7 │ 10 │ 11 │
└───┴───┴───┴───┴───┴────┴────┘
  ↑                        ↑
 left                    right

sum = 1 + 11 = 12 > 9  → Move right LEFT

Step 2:
┌───┬───┬───┬───┬───┬────┬────┐
│ 1 │ 2 │ 3 │ 5 │ 7 │ 10 │ 11 │
└───┴───┴───┴───┴───┴────┴────┘
  ↑                  ↑
 left              right

sum = 1 + 10 = 11 > 9  → Move right LEFT

Step 3:
┌───┬───┬───┬───┬───┬────┬────┐
│ 1 │ 2 │ 3 │ 5 │ 7 │ 10 │ 11 │
└───┴───┴───┴───┴───┴────┴────┘
  ↑              ↑
 left          right

sum = 1 + 7 = 8 < 9  → Move left RIGHT

Step 4:
┌───┬───┬───┬───┬───┬────┬────┐
│ 1 │ 2 │ 3 │ 5 │ 7 │ 10 │ 11 │
└───┴───┴───┴───┴───┴────┴────┘
      ↑          ↑
     left      right

sum = 2 + 7 = 9 == 9  ✓ FOUND!
```

### Kadane's Algorithm (Maximum Subarray Sum)

```
                  KADANE'S ALGORITHM
──────────────────────────────────────────────────

Array: [-2, 1, -3, 4, -1, 2, 1, -5, 4]

KEY IDEA: At each position, decide:
"Should I start fresh here, or extend previous subarray?"

Index 0: arr[0] = -2
         current = max(-2, 0 + (-2)) = max(-2, -2) = -2
         maxSum = -2
         ├───┤
         [-2]

Index 1: arr[1] = 1
         current = max(1, -2 + 1) = max(1, -1) = 1  ← Start fresh!
         maxSum = 1
             ├───┤
             [1]

Index 2: arr[2] = -3
         current = max(-3, 1 + (-3)) = max(-3, -2) = -2  ← Extend
         maxSum = 1
             ├───────┤
             [1, -3]

Index 3: arr[3] = 4
         current = max(4, -2 + 4) = max(4, 2) = 4  ← Start fresh!
         maxSum = 4
                     ├───┤
                     [4]

Index 4: arr[4] = -1
         current = max(-1, 4 + (-1)) = max(-1, 3) = 3  ← Extend
         maxSum = 4
                     ├───────┤
                     [4, -1]

Index 5: arr[5] = 2
         current = max(2, 3 + 2) = max(2, 5) = 5  ← Extend
         maxSum = 5
                     ├───────────┤
                     [4, -1, 2]

Index 6: arr[6] = 1
         current = max(1, 5 + 1) = max(1, 6) = 6  ← Extend
         maxSum = 6 ⭐
                     ├───────────────┤
                     [4, -1, 2, 1]    ← MAXIMUM SUBARRAY

Continue... Final Answer: 6 (subarray [4, -1, 2, 1])
```

**Flow:**
- KADANE'S ALGORITHM
- ↓
- Array: [-2, 1, -3, 4, -1, 2, 1, -5, 4]
- ↓
- KEY IDEA: At each position, decide:
- ↓
- 'Should I start fresh here, or extend previous subarray
- ↓
- Index 0: arr[0] = -2
- ↓
- maxSum = -2
- ↓
- Index 1: arr[1] = 1

```mermaid
flowchart TD
    N1["KADANE'S ALGORITHM"]
    N2["Array: [-2, 1, -3, 4, -1, 2, 1, -5, 4]"]
    N3["KEY IDEA: At each position, decide:"]
    N4["'Should I start fresh here, or extend previous subarray"]
    N5["Index 0: arr[0] = -2"]
    N6["maxSum = -2"]
    N7["Index 1: arr[1] = 1"]
    N8["maxSum = 1"]
    N1 --> N2
    N2 --> N3
    N3 --> N4
    N4 --> N5
    N5 --> N6
    N6 --> N7
    N7 --> N8
```

### Dutch National Flag (Sort 0s, 1s, 2s)

```
                  DUTCH NATIONAL FLAG
──────────────────────────────────────────────────

Array: [2, 0, 2, 1, 1, 0]

Three pointers: low (0s boundary), mid (scanning), high (2s boundary)

Initial:
┌───┬───┬───┬───┬───┬───┐
│ 2 │ 0 │ 2 │ 1 │ 1 │ 0 │
└───┴───┴───┴───┴───┴───┘
  ↑                   ↑
low,mid              high

arr[mid]=2: Swap with high, high--
┌───┬───┬───┬───┬───┬───┐
│ 0 │ 0 │ 2 │ 1 │ 1 │ 2 │
└───┴───┴───┴───┴───┴───┘
  ↑               ↑   ↑
low,mid          high (2s zone)

arr[mid]=0: Swap with low, low++, mid++
┌───┬───┬───┬───┬───┬───┐
│ 0 │ 0 │ 2 │ 1 │ 1 │ 2 │
└───┴───┴───┴───┴───┴───┘
  ↑   ↑           ↑   ↑
 (0s) low,mid    high (2s)

arr[mid]=0: Swap with low, low++, mid++
┌───┬───┬───┬───┬───┬───┐
│ 0 │ 0 │ 2 │ 1 │ 1 │ 2 │
└───┴───┴───┴───┴───┴───┘
 (0s)  ↑   ↑      ↑   ↑
      low mid    high (2s)

arr[mid]=2: Swap with high, high--
┌───┬───┬───┬───┬───┬───┐
│ 0 │ 0 │ 1 │ 1 │ 2 │ 2 │
└───┴───┴───┴───┴───┴───┘
 (0s)  ↑   ↑   ↑  (2s zone)
      low mid high

arr[mid]=1: Just mid++
┌───┬───┬───┬───┬───┬───┐
│ 0 │ 0 │ 1 │ 1 │ 2 │ 2 │
└───┴───┴───┴───┴───┴───┘
 (0s)  ↑      ↑↑  (2s zone)
      low   mid,high

arr[mid]=1: mid++
mid > high → DONE! ✓

Result: [0, 0, 1, 1, 2, 2]
```

**Flow:**
- 2 0 2 1 1 0
- ↓
- 0 0 2 1 1 2
- ↓
- 0 0 1 1 2 2

```mermaid
flowchart TD
    N1["2 0 2 1 1 0"]
    N2["0 0 2 1 1 2"]
    N3["0 0 1 1 2 2"]
    N1 --> N2
    N2 --> N3
```

---

## 📝 STRING OPERATIONS

### Anagram Check

```
                  ANAGRAM CHECK VISUALIZATION
──────────────────────────────────────────────────

String 1: "listen"        String 2: "silent"

METHOD 1: Frequency Count

Count for "listen":       Count for "silent":
┌───┬───┐                 ┌───┬───┐
│ l │ 1 │                 │ s │ 1 │
│ i │ 1 │                 │ i │ 1 │
│ s │ 1 │                 │ l │ 1 │
│ t │ 1 │                 │ e │ 1 │
│ e │ 1 │                 │ n │ 1 │
│ n │ 1 │                 │ t │ 1 │
└───┴───┘                 └───┴───┘

Both have same characters with same frequencies → ANAGRAM ✓

METHOD 2: Single Frequency Array

Start: freq[26] = all zeros

Process "listen": +1 for each char
┌─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┐
│0│0│0│0│1│0│0│0│1│0│0│1│0│1│0│0│0│0│1│1│0│0│0│0│0│0│
└─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┘
 a b c d e f g h i j k l m n o p q r s t u v w x y z

Process "silent": -1 for each char
┌─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┐
│0│0│0│0│0│0│0│0│0│0│0│0│0│0│0│0│0│0│0│0│0│0│0│0│0│0│
└─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┘

All zeros → ANAGRAM ✓
```

**Flow:**
- l 1 / i 1 / s 1 / t 1 / e 1 / n 1
- ↓
- s 1 / i 1 / l 1 / e 1 / n 1 / t 1
- ↓
- 0 0 0 0 1 0 0 0 1 0 0 1 0 1 0 0 0 0 1 1 0 0 0 0 0 0
- ↓
- 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0

```mermaid
flowchart TD
    N1["l 1 / i 1 / s 1 / t 1 / e 1 / n 1"]
    N2["s 1 / i 1 / l 1 / e 1 / n 1 / t 1"]
    N3["0 0 0 0 1 0 0 0 1 0 0 1 0 1 0 0 0 0 1 1 0 0 0 0 0 0"]
    N4["0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0"]
    N1 --> N2
    N2 --> N3
    N3 --> N4
```

### KMP String Matching (Pattern Search)


> KMP STRING MATCHING
>
> Text:    "ABABDABACDABABCABAB"
> Pattern: "ABABCABAB"
>
> Step 1: Build LPS (Longest Proper Prefix which is also Suffix)
>
> Pattern: A B A B C A B A B
> Index:   0 1 2 3 4 5 6 7 8
> LPS:    [0,0,1,2,0,1,2,3,4]
>
> LPS meaning:
> - At index 3 (ABAB), LPS=2 means "AB" is both prefix and suffix
> - At index 8 (ABABCABAB), LPS=4 means "ABAB" is prefix and suffix
>
> Step 2: Search using LPS
>
> Text:    A B A B D A B A C D A B A B C A B A B
> Pattern: A B A B C
> ↑ mismatch at index 4
>
> LPS[3] = 2, so pattern can shift to reuse matched "AB":
>
> Text:    A B A B D A B A C D A B A B C A B A B
> Pattern:     A B A B C
> ↑ continue from here (saved 2 comparisons!)
>
> Without KMP: Would start from beginning each time → O(N×M)
> With KMP:    Reuse matched portion → O(N+M)


---




## 🔢 SORTING ALGORITHMS

### Heap Sort Visualization


> HEAP SORT VISUALIZATION
>
> Array: [4, 10, 3, 5, 1]
>
> PHASE 1: Build Max Heap (heapify from bottom-up)
>
> Initial tree:              After heapify:
> 4                          10
> / \                        /  \
> 10  3          →           5    3
> / \                        / \
> 5   1                      4   1
>
> Max Heap Property: Parent ≥ Children
>
> PHASE 2: Extract max repeatedly
>
> Step 1: Swap root(10) with last(1), remove 10
> 1
> / \                 Heapify →        5
> 5   3                                / \
> /                                    4   3
> 4                                    /
> 1
> Sorted: [..., 10]
>
> Step 2: Swap root(5) with last(1), remove 5
> 1
> / \                 Heapify →        4
> 4   3                                / \
> 1   3
> Sorted: [..., 5, 10]
>
> Step 3: Swap root(4) with last(3), remove 4
> 3
> /                   Heapify →        3
> 1                                    /
> 1
> Sorted: [..., 4, 5, 10]
>
> Continue... Final: [1, 3, 4, 5, 10]


### Counting Sort Visualization

```
                  COUNTING SORT VISUALIZATION
──────────────────────────────────────────────────

Array: [4, 2, 2, 8, 3, 3, 1]    (values range 0-9)

STEP 1: Count occurrences

Count array (index = value):
┌───┬───┬───┬───┬───┬───┬───┬───┬───┬───┐
│ 0 │ 1 │ 2 │ 1 │ 1 │ 0 │ 0 │ 0 │ 1 │ 0 │
└───┴───┴───┴───┴───┴───┴───┴───┴───┴───┘
  0   1   2   3   4   5   6   7   8   9
      ↑   ↑   ↑   ↑               ↑
     one two two one             one
      1   2s  3s  4               8

STEP 2: Cumulative sum (for stable sort)

┌───┬───┬───┬───┬───┬───┬───┬───┬───┬───┐
│ 0 │ 1 │ 3 │ 4 │ 5 │ 5 │ 5 │ 5 │ 6 │ 6 │
└───┴───┴───┴───┴───┴───┴───┴───┴───┴───┘
  0   1   2   3   4   5   6   7   8   9

Meaning: count[i] = number of elements ≤ i

STEP 3: Build output (right to left for stability)

Input:  [4, 2, 2, 8, 3, 3, 1]
                          ↑ Process 1 first (from right)

1 goes to position count[1]-1 = 0
Output: [1, _, _, _, _, _, _]

Continue... Final: [1, 2, 2, 3, 3, 4, 8]

Time: O(N + K) where K = range of values
Best when: K is small (like sorting ages 0-100)
```

**Flow:**
- 0 1 2 1 1 0 0 0 1 0
- ↓
- 0 1 3 4 5 5 5 5 6 6

```mermaid
flowchart TD
    N1["0 1 2 1 1 0 0 0 1 0"]
    N2["0 1 3 4 5 5 5 5 6 6"]
    N1 --> N2
```

---



> 🔬 **Section Challenge — 🔢 SORTING ALGORITHMS**
>
> **Challenge 1 (Reasoning):** QuickSort average O(N log N) but worst case O(N²). When exactly does the worst case happen and how do you prevent it?
> <details><summary>Answer</summary>
>
> Worst case: pivot always ends up at position 0 or N-1 (completely unbalanced partition). This happens when: (1) always picking first/last element as pivot on already-sorted or reverse-sorted data. (2) Pivot happens to be the minimum or maximum. Prevention: random pivot (randomized quicksort — expected O(N log N) even on adversarial input), or median-of-three (pick median of first/middle/last element as pivot). Java's dual-pivot quicksort uses careful pivot selection to avoid this.
> </details>
>

## 🔍 SEARCHING ALGORITHMS

### Binary Search Variants

```
                  BINARY SEARCH VARIANTS
──────────────────────────────────────────────────

Array: [1, 2, 2, 2, 2, 3, 5, 7]    Find: 2
Index:  0  1  2  3  4  5  6  7

═══════════════════════════════════════════════════════════════════════

VARIANT 1: Find ANY occurrence
┌───┬───┬───┬───┬───┬───┬───┬───┐
│ 1 │ 2 │ 2 │ 2 │ 2 │ 3 │ 5 │ 7 │
└───┴───┴───┴───┴───┴───┴───┴───┘
            ↑
         returns 2 or 3 (any match)

═══════════════════════════════════════════════════════════════════════

VARIANT 2: Find FIRST occurrence
┌───┬───┬───┬───┬───┬───┬───┬───┐
│ 1 │ 2 │ 2 │ 2 │ 2 │ 3 │ 5 │ 7 │
└───┴───┴───┴───┴───┴───┴───┴───┘
      ↑
   returns 1 (leftmost 2)

Logic: When found, don't return! Save and go LEFT
       if (arr[mid] == target) { result = mid; high = mid - 1; }

═══════════════════════════════════════════════════════════════════════

VARIANT 3: Find LAST occurrence
┌───┬───┬───┬───┬───┬───┬───┬───┐
│ 1 │ 2 │ 2 │ 2 │ 2 │ 3 │ 5 │ 7 │
└───┴───┴───┴───┴───┴───┴───┴───┘
                ↑
            returns 4 (rightmost 2)

Logic: When found, don't return! Save and go RIGHT
       if (arr[mid] == target) { result = mid; low = mid + 1; }

═══════════════════════════════════════════════════════════════════════

VARIANT 4: Lower Bound (first >= target)
Target: 2
┌───┬───┬───┬───┬───┬───┬───┬───┐
│ 1 │ 2 │ 2 │ 2 │ 2 │ 3 │ 5 │ 7 │
└───┴───┴───┴───┴───┴───┴───┴───┘
      ↑
   returns 1 (first element ≥ 2)

═══════════════════════════════════════════════════════════════════════

VARIANT 5: Upper Bound (first > target)
Target: 2
┌───┬───┬───┬───┬───┬───┬───┬───┐
│ 1 │ 2 │ 2 │ 2 │ 2 │ 3 │ 5 │ 7 │
└───┴───┴───┴───┴───┴───┴───┴───┘
                    ↑
                returns 5 (first element > 2)

Count of 2s = Upper Bound - Lower Bound = 5 - 1 = 4
```

---




## 📦 DATA STRUCTURES

### HashMap Internal Working

## Bucket  │ Contents

0    │ NULL
1    │ NULL
| 2    | [apple:5] → [cherry:7] → NULL          |  ← Chained! |
3    │ NULL
4    │ NULL
5    │ [banana:3] → NULL
6    │ NULL
7    │ NULL

### Stack vs Queue

```
                  STACK vs QUEUE
──────────────────────────────────────────────────

STACK (LIFO - Last In First Out)
─────────────────────────────────
Think: Stack of plates

Push 1, Push 2, Push 3:          Pop:
┌─────┐                          ┌─────┐
│  3  │ ← top                    │  3  │ ← comes out first
├─────┤                          └─────┘
│  2  │                          Then:
├─────┤                          ┌─────┐
│  1  │                          │  2  │ ← next out
└─────┘                          └─────┘

Use cases: Undo, Recursion, Balanced brackets

═══════════════════════════════════════════════════════════════════════

QUEUE (FIFO - First In First Out)
─────────────────────────────────
Think: Line at store

Enqueue 1, 2, 3:                 Dequeue:
┌───┬───┬───┐                    ┌───┬───┬───┐
│ 1 │ 2 │ 3 │                    │ 1 │ 2 │ 3 │
└───┴───┴───┘                    └───┴───┴───┘
  ↑       ↑                        ↑
front    rear                    comes out first

Use cases: BFS, Level-order traversal, Task scheduling

═══════════════════════════════════════════════════════════════════════

DEQUE (Double-Ended Queue)
─────────────────────────────
Can add/remove from BOTH ends!

┌───┬───┬───┬───┬───┐
│ A │ B │ C │ D │ E │
└───┴───┴───┴───┴───┘
  ↑               ↑
addFirst/      addLast/
removeFirst    removeLast

Use cases: Sliding window max, BFS variations
```

**Flow:**
- 3 / 2 / 1
- ↓
- 1 2 3
- ↓
- A B C D E

```mermaid
flowchart TD
    N1["3 / 2 / 1"]
    N2["1 2 3"]
    N3["A B C D E"]
    N1 --> N2
    N2 --> N3
```

---

## 🌐 GRAPH ALGORITHMS

### BFS Shortest Path


> BFS SHORTEST PATH
>
> Graph (unweighted):
>
> A ─────── B
> │ \       │
> │  \      │
> │   \     │
> C ─── D ─ E
>
> Find shortest path from A to E
>
> BFS Process:
>
> Level 0: Start at A
> Queue: [A]    Visited: {A}    Distance: {A:0}
>
> Level 1: Process A's neighbors
> Queue: [B, C, D]    Visited: {A,B,C,D}    Distance: {A:0, B:1, C:1, D:1}
>
> A(0) ──── B(1)
> │ \       │
> │  \      │
> │   \     │
> C(1)─D(1)─ E
>
> Level 2: Process B's neighbors (C,D already visited)
> Queue: [E]    Visited: {A,B,C,D,E}    Distance: {..., E:2}
>
> A(0) ──── B(1)
> │ \       │
> │  \      │
> │   \     │
> C(1)─D(1)─E(2)
>
> Shortest path A→E: 2 edges
> Possible paths: A→B→E or A→D→E
>
> KEY: BFS finds shortest path in UNWEIGHTED graphs
> For weighted graphs, use Dijkstra's algorithm


### DFS - Detecting Cycle


> DFS CYCLE DETECTION
>
> Directed Graph:
>
> A ──→ B
> ↑     │
> │     ↓
> D ←── C
> │
> ↓
> E
>
> Cycle exists: A → B → C → D → A
>
> DFS with 3 states:
> - WHITE (0): Not visited
> - GRAY (1): Currently in DFS stack (being processed)
> - BLACK (2): Completely processed
>
> DFS from A:
>
> Step 1: Visit A (GRAY)
> A(G) ──→ B
>
> Step 2: Visit B (GRAY)
> A(G) ──→ B(G)
> │
> ↓
> C
>
> Step 3: Visit C (GRAY)
> A(G) ──→ B(G)
> │
> ↓
> C(G)
>
> Step 4: Visit D (GRAY), D points to A
> A is GRAY (in current DFS path) → CYCLE DETECTED!
>
> Rule: Back edge to GRAY node = CYCLE


---



> 🔬 **Section Challenge — 🌐 GRAPH ALGORITHMS**
>
> **Challenge 1 (Reasoning):** BFS finds shortest path in unweighted graphs but not in weighted graphs. Why exactly?
> <details><summary>Answer</summary>
>
> BFS explores by 'hop count' (number of edges). Each level = one more edge away from source. All edges are treated as weight=1. In a weighted graph, the 'shortest by hop count' path may not be 'shortest by weight sum'. Example: A→B (weight 1, 1 hop) vs A→C→B (weight 0.1+0.1=0.2, 2 hops). BFS finds A→B (1 hop), Dijkstra finds A→C→B (lower total weight). BFS is optimal ONLY when all edges have equal weight.
> </details>
>
> **Challenge 2 (Design):** Detect if a directed graph has a cycle. Write the algorithm and explain why we need 3 states (not 2).
> <details><summary>Answer</summary>
>
> 3 states: UNVISITED, IN_PROGRESS (currently in DFS path), DONE. DFS: mark node IN_PROGRESS before visiting neighbors. If we reach an IN_PROGRESS node → cycle found. Mark DONE when all neighbors processed. Why 3 states: with 2 (visited/unvisited), we'd get false positives — reaching a VISITED node that was processed in a DIFFERENT DFS subtree is not a cycle. IN_PROGRESS specifically marks nodes in the CURRENT DFS path (potential back edge).
> </details>
>

## 🧮 DYNAMIC PROGRAMMING

### Fibonacci with Memoization

```
                  FIBONACCI - DP VISUALIZATION
──────────────────────────────────────────────────

WITHOUT MEMOIZATION (Exponential time):

                        fib(5)
                       /      \
                  fib(4)      fib(3)
                  /    \      /    \
             fib(3) fib(2) fib(2) fib(1)
             /    \
        fib(2) fib(1)

Notice: fib(3) calculated twice, fib(2) calculated 3 times!
Time: O(2^N) 😱

═══════════════════════════════════════════════════════════════════════

WITH MEMOIZATION (Linear time):

memo[] array:
┌───┬───┬───┬───┬───┬───┐
│ 0 │ 1 │ 1 │ 2 │ 3 │ 5 │
└───┴───┴───┴───┴───┴───┘
  0   1   2   3   4   5

fib(5) = fib(4) + fib(3)
       = memo[4] + memo[3]  ← Look up, don't recalculate!
       = 3 + 2
       = 5

Time: O(N) 😊
Space: O(N) for memo array

═══════════════════════════════════════════════════════════════════════

BOTTOM-UP (Tabulation - even better):

Only need last 2 values:
┌───┐ ┌───┐
│ a │ │ b │
└───┘ └───┘

a=0, b=1
i=2: a=1, b=0+1=1 → (1, 1)
i=3: a=1, b=1+1=2 → (1, 2)
i=4: a=2, b=1+2=3 → (2, 3)
i=5: a=3, b=2+3=5 → (3, 5)

Answer: 5
Time: O(N), Space: O(1) 🎉
```

**Flow:**
- FIBONACCI - DP VISUALIZATION
- ↓
- WITHOUT MEMOIZATION (Exponential time):
- ↓
- fib(5)
- ↓
- fib(4) fib(3)
- ↓
- fib(2) fib(1)
- ↓
- Notice: fib(3) calculated twice, fib(2) calculated 3 ti
- ↓
- Time: O(2^N) 😱

```mermaid
flowchart TD
    N1["FIBONACCI - DP VISUALIZATION"]
    N2["WITHOUT MEMOIZATION (Exponential time):"]
    N3["fib(5)"]
    N4["fib(4) fib(3)"]
    N5["fib(2) fib(1)"]
    N6["Notice: fib(3) calculated twice, fib(2) calculated 3 ti"]
    N7["Time: O(2^N) 😱"]
    N8["WITH MEMOIZATION (Linear time):"]
    N1 --> N2
    N2 --> N3
    N3 --> N4
    N4 --> N5
    N5 --> N6
    N6 --> N7
    N7 --> N8
```

### Longest Common Subsequence (LCS)

```
                  LONGEST COMMON SUBSEQUENCE
──────────────────────────────────────────────────

String X = "ABCDGH"
String Y = "AEDFHR"

DP Table: dp[i][j] = LCS length of X[0..i-1] and Y[0..j-1]

    │ "" │ A │ E │ D │ F │ H │ R │
────┼────┼───┼───┼───┼───┼───┼───┤
 "" │  0 │ 0 │ 0 │ 0 │ 0 │ 0 │ 0 │
  A │  0 │ 1 │ 1 │ 1 │ 1 │ 1 │ 1 │
  B │  0 │ 1 │ 1 │ 1 │ 1 │ 1 │ 1 │
  C │  0 │ 1 │ 1 │ 1 │ 1 │ 1 │ 1 │
  D │  0 │ 1 │ 1 │ 2 │ 2 │ 2 │ 2 │  ← D matches!
  G │  0 │ 1 │ 1 │ 2 │ 2 │ 2 │ 2 │
  H │  0 │ 1 │ 1 │ 2 │ 2 │ 3 │ 3 │  ← H matches!

Recurrence:
┌─────────────────────────────────────────────────────────────────────┐
│ If X[i-1] == Y[j-1]:                                                │
│     dp[i][j] = dp[i-1][j-1] + 1    (match, add 1)                   │
│ Else:                                                               │
│     dp[i][j] = max(dp[i-1][j], dp[i][j-1])  (take best from left/up)│
└─────────────────────────────────────────────────────────────────────┘

LCS = "ADH" (length 3)

Backtrack to find actual subsequence:
Start at dp[6][6]=3, trace back through matches
```

**Flow:**
- LONGEST COMMON SUBSEQUENCE
- ↓
- String X = 'ABCDGH'
- ↓
- String Y = 'AEDFHR'
- ↓
- DP Table: dp[i][j] = LCS length of X[0..i-1] and Y[0..j
- ↓
- D 0 1 1 2 2 2 2 ← D matches!
- ↓
- H 0 1 1 2 2 3 3 ← H matches!
- ↓
- Recurrence:

```mermaid
flowchart TD
    N1["LONGEST COMMON SUBSEQUENCE"]
    N2["String X = 'ABCDGH'"]
    N3["String Y = 'AEDFHR'"]
    N4["DP Table: dp[i][j] = LCS length of X[0..i-1] and Y[0..j"]
    N5["D 0 1 1 2 2 2 2 ← D matches!"]
    N6["H 0 1 1 2 2 3 3 ← H matches!"]
    N7["Recurrence:"]
    N8["dp[i][j] = dp[i-1][j-1] + 1 (match, add 1)"]
    N1 --> N2
    N2 --> N3
    N3 --> N4
    N4 --> N5
    N5 --> N6
    N6 --> N7
    N7 --> N8
```

---



> 🔬 **Section Challenge — 🧮 DYNAMIC PROGRAMMING**
>
> **Challenge 1 (Reasoning):** How do you identify that a problem requires DP vs Greedy? What's the key test?
> <details><summary>Answer</summary>
>
> Greedy test: does the locally optimal choice always lead to the globally optimal solution? (Prove via exchange argument.) If yes → greedy. If making a local choice requires knowing future choices → DP. Example: Coin Change with standard coins [1,5,10,25] → greedy works (always pick largest). Coin Change with coins [1,3,4] and amount 6 → greedy picks 4+1+1=3 coins, optimal is 3+3=2 coins. Greedy fails → DP.
> </details>
>
> **Challenge 2 (Design):** You need to find the number of ways to climb N stairs taking 1 or 2 steps at a time. Define the DP state and recurrence.
> <details><summary>Answer</summary>
>
> State: `dp[i]` = number of ways to reach step i. Recurrence: `dp[i] = dp[i-1] + dp[i-2]` (come from step i-1 via 1 step, or from step i-2 via 2 steps). Base: `dp[0]=1` (one way: don't move), `dp[1]=1`. This is exactly Fibonacci. Space optimization: only need last 2 values → O(1) space.
> </details>
>

## 🔢 MATH & BIT MANIPULATION

### Bit Operations Visual


> BIT MANIPULATION VISUAL
>
> CHECKING IF POWER OF 2:
> ────────────────────────
>
> n = 8:    1000  (binary)
> n-1 = 7:  0111  (binary)
> ────
> n & (n-1): 0000  ← All zeros! Power of 2 ✓
>
> n = 6:    0110  (binary)
> n-1 = 5:  0101  (binary)
> ────
> n & (n-1): 0100  ← Not zero! Not power of 2 ✗
>
> Rule: Power of 2 has exactly ONE bit set
> n & (n-1) removes rightmost set bit
> If result is 0, it was power of 2
>
> ═══════════════════════════════════════════════════════════════════════
>
> COUNTING SET BITS:
> ──────────────────
>
> n = 13:   1101  (binary)  → 3 set bits
>
> Iteration 1:
> n = 1101
> n-1 = 1100
> n & (n-1) = 1100  → count = 1 (removed rightmost 1)
>
> Iteration 2:
> n = 1100
> n-1 = 1011
> n & (n-1) = 1000  → count = 2
>
> Iteration 3:
> n = 1000
> n-1 = 0111
> n & (n-1) = 0000  → count = 3
>
> n = 0, stop. Answer: 3 set bits ✓
>
> ═══════════════════════════════════════════════════════════════════════
>
> XOR PROPERTIES:
> ───────────────
>
> a ^ a = 0        (same numbers cancel)
> a ^ 0 = a        (XOR with 0 gives same number)
> a ^ b ^ a = b    (a cancels out)
>
> Example: Find single number in [4, 1, 2, 1, 2]
>
> 4 ^ 1 ^ 2 ^ 1 ^ 2
> = 4 ^ (1 ^ 1) ^ (2 ^ 2)
> = 4 ^ 0 ^ 0
> = 4  ← The single number!


### GCD Euclidean Algorithm

```
                  GCD - EUCLIDEAN ALGORITHM
──────────────────────────────────────────────────

Find GCD(48, 18):

Step 1: 48 = 18 × 2 + 12
        a    b        remainder

        48 ÷ 18 = 2 remainder 12
        Now: GCD(48, 18) = GCD(18, 12)

Step 2: 18 = 12 × 1 + 6
        18 ÷ 12 = 1 remainder 6
        Now: GCD(18, 12) = GCD(12, 6)

Step 3: 12 = 6 × 2 + 0
        12 ÷ 6 = 2 remainder 0
        Remainder is 0 → GCD = 6 ✓

Visual:
┌──────────────────────────────────────────────────────────────────────┐
│ GCD(48, 18)                                                          │
│    ↓                                                                 │
│ GCD(18, 48 % 18) = GCD(18, 12)                                       │
│    ↓                                                                 │
│ GCD(12, 18 % 12) = GCD(12, 6)                                        │
│    ↓                                                                 │
│ GCD(6, 12 % 6) = GCD(6, 0)                                           │
│    ↓                                                                 │
│ return 6  ← When b becomes 0, a is the GCD                           │
└──────────────────────────────────────────────────────────────────────┘

Code:
int gcd(int a, int b) {
    while (b != 0) {
        int temp = b;
        b = a % b;
        a = temp;
    }
    return a;
}

Time Complexity: O(log(min(a, b)))
```

**Flow:**
- GCD - EUCLIDEAN ALGORITHM / Find GCD(48, 18): / Step 1:
- ↓
- GCD(18, 48 % 18) = GCD(18, 12)
- ↓
- GCD(12, 18 % 12) = GCD(12, 6)
- ↓
- GCD(6, 12 % 6) = GCD(6, 0)
- ↓
- return 6 ← When b becomes 0, a is the GCD / Code: / int

```mermaid
flowchart TD
    N1["GCD - EUCLIDEAN ALGORITHM / Find GCD(48, 18): / Step 1:"]
    N2["GCD(18, 48 % 18) = GCD(18, 12)"]
    N3["GCD(12, 18 % 12) = GCD(12, 6)"]
    N4["GCD(6, 12 % 6) = GCD(6, 0)"]
    N5["return 6 ← When b becomes 0, a is the GCD / Code: / int"]
    N1 --> N2
    N2 --> N3
    N3 --> N4
    N4 --> N5
```

---

## 🎯 QUICK REFERENCE TABLE

```
                  ALGORITHM QUICK REFERENCE
──────────────────────────────────────────────────

SORTING
┌──────────────────┬─────────┬─────────┬─────────┬────────────────────┐
│ Algorithm        │ Best    │ Average │ Worst   │ When to Use        │
├──────────────────┼─────────┼─────────┼─────────┼────────────────────┤
│ Quick Sort       │ O(NlogN)│ O(NlogN)│ O(N²)   │ General purpose    │
│ Merge Sort       │ O(NlogN)│ O(NlogN)│ O(NlogN)│ Stable needed      │
│ Heap Sort        │ O(NlogN)│ O(NlogN)│ O(NlogN)│ Memory constrained │
│ Counting Sort    │ O(N+K)  │ O(N+K)  │ O(N+K)  │ Small range values │
│ Insertion Sort   │ O(N)    │ O(N²)   │ O(N²)   │ Nearly sorted      │
└──────────────────┴─────────┴─────────┴─────────┴────────────────────┘

SEARCHING
┌──────────────────┬─────────┬──────────────────────────────────────────┐
│ Algorithm        │ Time    │ When to Use                              │
├──────────────────┼─────────┼──────────────────────────────────────────┤
│ Linear Search    │ O(N)    │ Unsorted data                            │
│ Binary Search    │ O(logN) │ Sorted array                             │
│ Hash Lookup      │ O(1)    │ When O(1) lookup needed                  │
│ BFS              │ O(V+E)  │ Shortest path (unweighted)               │
│ DFS              │ O(V+E)  │ Path exists, cycle detection             │
└──────────────────┴─────────┴──────────────────────────────────────────┘

DATA STRUCTURES
┌──────────────────┬─────────┬─────────┬─────────┬────────────────────┐
│ Structure        │ Access  │ Search  │ Insert  │ Delete             │
├──────────────────┼─────────┼─────────┼─────────┼────────────────────┤
│ Array            │ O(1)    │ O(N)    │ O(N)    │ O(N)               │
│ Linked List      │ O(N)    │ O(N)    │ O(1)    │ O(1)               │
│ HashMap          │ -       │ O(1)    │ O(1)    │ O(1)               │
│ Stack            │ O(N)    │ O(N)    │ O(1)    │ O(1)               │
│ Queue            │ O(N)    │ O(N)    │ O(1)    │ O(1)               │
│ Heap             │ -       │ O(N)    │ O(logN) │ O(logN)            │
│ BST (balanced)   │ O(logN) │ O(logN) │ O(logN) │ O(logN)            │
└──────────────────┴─────────┴─────────┴─────────┴────────────────────┘
```

**Flow:**
- Algorithm Best Average Worst When to Use / Quick Sort O
- ↓
- Algorithm Time When to Use / Linear Search O(N) Unsorte
- ↓
- Structure Access Search Insert Delete / Array O(1) O(N)

```mermaid
flowchart TD
    N1["Algorithm Best Average Worst When to Use / Quick Sort O"]
    N2["Algorithm Time When to Use / Linear Search O(N) Unsorte"]
    N3["Structure Access Search Insert Delete / Array O(1) O(N)"]
    N1 --> N2
    N2 --> N3
```

---

## 📝 STUDY TIP

**How to use these diagrams:**

1. **Before coding**: Draw the diagram on paper first
2. **While coding**: Keep the visual in mind, code matches diagram
3. **After coding**: Trace through your code with the diagram
4. **If stuck**: Go back to the diagram, not the code

Remember: **Visual thinking → Clearer code!**


---

> **Navigation**: [< Previous](02_Code_Templates.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](04_Pattern_Recognition.md)