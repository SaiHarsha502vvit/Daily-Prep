> **Navigation**: [← Sorting Advanced](02b_Sorting_Advanced.md) | [Back to Index](../00_MASTER_INDEX.md) | [Recursion Internals →](03a_Recursion_Internals.md)

---

# 🔪 Divide and Conquer — Complete Guide

## Algorithm Analysis Fundamentals + D&C + Binary Search + Master Theorem

> *Extracted from 06a for discoverability — this is a core technique, not an appendix.*

---

## Algorithm Analysis Fundamentals

### What is an Algorithm?

```
ALGORITHM = Finite sequence of well-defined instructions
            to solve a problem or perform a computation

PROPERTIES:
1. INPUT:      Zero or more inputs
2. OUTPUT:     At least one output
3. DEFINITENESS: Each step clearly defined
4. FINITENESS:   Terminates after finite steps
5. EFFECTIVENESS: Each step is basic enough to be done
```

### Asymptotic Notations

## Asymptotic Notations

Big-O (O):     UPPER BOUND (Worst Case)
f(n) = O(g(n)) means f(n) ≤ c·g(n)
"At most this much"
Big-Omega (Ω): LOWER BOUND (Best Case)
f(n) = Ω(g(n)) means f(n) ≥ c·g(n)
"At least this much"
Big-Theta (Θ): TIGHT BOUND (Average Case)
f(n) = Θ(g(n)) means c₁·g(n) ≤ f(n) ≤ c₂·g(n)
"Exactly this much"
Little-o (o): Strictly less than (not tight)
Little-ω (ω): Strictly greater than (not tight)

### Performance Measurement

```java
// TIME COMPLEXITY: Count operations as function of input size

// Example: Finding sum of array
int sum = 0;           // 1 operation
for (int i = 0; i < n; i++) {  // n iterations
    sum += arr[i];     // 1 operation per iteration
}
// Total: 1 + n = O(n)

// Example: Nested loops
for (int i = 0; i < n; i++) {      // n times
    for (int j = 0; j < n; j++) {  // n times each
        // operation              // n × n = n²
    }
}
// Total: O(n²)

// SPACE COMPLEXITY: Memory used as function of input size
int[] arr = new int[n];    // O(n) space
int[][] matrix = new int[n][n];  // O(n²) space
```

---

## Divide and Conquer

### The General Method

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    DIVIDE AND CONQUER - COMPLETE UNDERSTANDING               ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────────┐
│ WHAT IS DIVIDE AND CONQUER?                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ A problem-solving paradigm that breaks a problem into SMALLER INDEPENDENT   │
│ subproblems of the SAME TYPE, solves them recursively, then COMBINES        │
│ their solutions.                                                            │
│                                                                             │
│ HISTORICAL CONTEXT:                                                         │
│ - Named after military strategy "divide et impera" (divide and rule)        │
│ - Formalized in computer science in 1960s                                   │
│ - Foundation for many efficient algorithms                                  │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ WHAT PROBLEM DOES IT SOLVE?                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ CORE PROBLEM: Large problems that are too complex to solve directly         │
│                                                                             │
│ EXAMPLE - Sorting 1 million numbers:                                        │
│ BRUTE FORCE: Compare all pairs → O(n²) = 10¹² comparisons                   │
│ D&C (Merge Sort): Split, sort halves, merge → O(n log n) = 2×10⁷            │
│                                                                             │
│ WHY DOES D&C WORK BETTER?                                                   │
│ • Reduces problem size EXPONENTIALLY (n → n/2 → n/4 → ...)                  │
│ • Each level does O(n) work, but only log(n) levels                         │
│ • Total: O(n) × O(log n) = O(n log n)                                       │
│                                                                             │
│ REAL-WORLD ANALOGY:                                                         │
│ Organizing a library of 1000 books alphabetically:                          │
│ • One person doing everything: VERY SLOW                                    │
│ • Split books in half, give each half to a helper, merge results: FASTER    │
│ • Keep splitting until each person has ~10 books: FASTEST                   │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ THE THREE STEPS (HOW IT WORKS)                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ 1. DIVIDE:   Break problem into smaller subproblems of SAME TYPE            │
│              Key: Subproblems must be INDEPENDENT (no overlap)              │
│                                                                             │
│ 2. CONQUER:  Solve subproblems recursively                                  │
│              Base case: Problem small enough to solve directly              │
│                                                                             │
│ 3. COMBINE:  Merge solutions to get final answer                            │
│              This is often where the "magic" happens                        │
│                                                                             │
│ ┌─────────────────────────────────────────┐                                 │
│ │              ORIGINAL PROBLEM           │                                 │
│ └───────────────────┬─────────────────────┘                                 │
│                     │ DIVIDE                                                │
│         ┌───────────┴───────────┐                                           │
│         ▼                       ▼                                           │
│ ┌───────────────┐       ┌───────────────┐                                   │
│ │  SUBPROBLEM 1 │       │  SUBPROBLEM 2 │                                   │
│ └───────┬───────┘       └───────┬───────┘                                   │
│         │ CONQUER               │ CONQUER                                   │
│         ▼                       ▼                                           │
│ ┌───────────────┐       ┌───────────────┐                                   │
│ │   SOLUTION 1  │       │   SOLUTION 2  │                                   │
│ └───────┬───────┘       └───────┬───────┘                                   │
│         │                       │                                           │
│         └───────────┬───────────┘                                           │
│                     │ COMBINE                                               │
│                     ▼                                                       │
│         ┌───────────────────────┐                                           │
│         │    FINAL SOLUTION     │                                           │
│         └───────────────────────┘                                           │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ WHEN TO USE DIVIDE AND CONQUER?                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ ✅ USE D&C WHEN:                                                             │
│    • Problem can be broken into SIMILAR subproblems                         │
│    • Subproblems are INDEPENDENT (don't share data/state)                   │
│    • Solutions can be COMBINED efficiently                                  │
│    • Problem has a NATURAL recursive structure                              │
│                                                                             │
│ ❌ DON'T USE D&C WHEN:                                                       │
│    • Subproblems OVERLAP (use Dynamic Programming instead)                  │
│    • Problem doesn't break into similar subproblems                         │
│    • Combining solutions is as expensive as solving original                │
│                                                                             │
│ D&C vs DYNAMIC PROGRAMMING:                                                 │
│ ┌───────────────────────────────────────────────────────────────────────┐   │
│ │ Divide & Conquer          │ Dynamic Programming                       │   │
│ ├───────────────────────────┼───────────────────────────────────────────┤   │
│ │ Independent subproblems   │ Overlapping subproblems                   │   │
│ │ Top-down recursive        │ Bottom-up iterative (usually)             │   │
│ │ Merge Sort, Quick Sort    │ Fibonacci, Knapsack, LCS                  │   │
│ │ No memoization needed     │ Memoization essential                     │   │
│ └───────────────────────────┴───────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ DIFFICULTIES & COMMON MISTAKES                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. CHOOSING WRONG BASE CASE:                                                │
│    Wrong: if (n == 0) → causes infinite recursion for n=1                   │
│    Right: if (n <= 1) → handles both 0 and 1                                │
│                                                                             │
│ 2. NOT REDUCING PROBLEM SIZE:                                               │
│    Wrong: mergeSort(arr, 0, n) recursively with same range                  │
│    Right: mergeSort(arr, 0, mid) and mergeSort(arr, mid+1, n)               │
│                                                                             │
│ 3. STACK OVERFLOW:                                                          │
│    Problem: Too deep recursion (n = 10^6)                                   │
│    Solution: Convert to iterative or increase stack size                    │
│                                                                             │
│ 4. INEFFICIENT COMBINE STEP:                                                │
│    If combine is O(n²), overall becomes O(n² log n) - defeats purpose!      │
│                                                                             │
│ 5. OVERLAPPING SUBPROBLEMS (misusing D&C):                                  │
│    Fibonacci with D&C → O(2ⁿ) because subproblems overlap                   │
│    Solution: Use DP with memoization instead                                │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ EXPECTED OUTPUTS & COMPLEXITY ANALYSIS                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ RECURRENCE RELATION:                                                        │
│ T(n) = aT(n/b) + f(n)                                                       │
│ where:                                                                      │
│   a = number of subproblems                                                 │
│   b = size reduction factor                                                 │
│   f(n) = work done outside recursion (divide + combine)                     │
│                                                                             │
│ COMMON D&C ALGORITHMS & THEIR COMPLEXITY:                                   │
│ ┌────────────────────┬──────────┬───────────────────┬────────────────────┐  │
│ │ Algorithm          │ a  │ b  │ f(n)  │ T(n)                            │  │
│ ├────────────────────┼────┼────┼───────┼────────────────────────────────┤   │
│ │ Binary Search      │ 1  │ 2  │ O(1)  │ O(log n)                        │  │
│ │ Merge Sort         │ 2  │ 2  │ O(n)  │ O(n log n)                      │  │
│ │ Quick Sort (avg)   │ 2  │ 2  │ O(n)  │ O(n log n)                      │  │
│ │ Strassen's Matrix  │ 7  │ 2  │ O(n²) │ O(n^2.807) [log₂7]             │   │
│ │ Karatsuba Multiply │ 3  │ 2  │ O(n)  │ O(n^1.585) [log₂3]             │   │
│ └────────────────────┴────┴────┴───────┴────────────────────────────────┘   │
│                                                                             │
│ EXAMPLE OUTPUT (Merge Sort):                                                │
│ Input:  [38, 27, 43, 3, 9, 82, 10]                                          │
│ Divide: [38, 27, 43, 3] | [9, 82, 10]                                       │
│ Divide: [38, 27] | [43, 3] | [9, 82] | [10]                                 │
│ Conquer: [27, 38] | [3, 43] | [9, 82] | [10]                                │
│ Combine: [3, 27, 38, 43] | [9, 10, 82]                                      │
│ Output: [3, 9, 10, 27, 38, 43, 82]                                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

> 🧠 **Mental Model**: See [11_Greedy_vs_DP_Decision](../14_Mental_Models/11_Greedy_vs_DP_Decision.md) — D&C vs DP decision framework

---

## Binary Search — Complete Understanding

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    BINARY SEARCH - COMPLETE UNDERSTANDING                    ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHAT IS BINARY SEARCH?                                                       │
├──────────────────────────────────────────────────────────────────────────────┤
│ A search algorithm that finds a target value in a SORTED array by            │
│ repeatedly dividing the search interval in half.                             │
│                                                                              │
│ INVENTOR: While the concept is ancient, the first bug-free implementation    │
│ took 16 years after the algorithm was published (1946-1962)!                 │
│                                                                              │
│ FUN FACT: Even experienced programmers often write buggy binary search.      │
│ Jon Bentley found that 90% of professional programmers couldn't write        │
│ a correct binary search in 2 hours!                                          │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHAT PROBLEM DOES IT SOLVE?                                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│ CORE PROBLEM: Finding an element in sorted data FAST                         │
│                                                                              │
│ LINEAR SEARCH: Check every element → O(n)                                    │
│ BINARY SEARCH: Eliminate half each step → O(log n)                           │
│                                                                              │
│ DRAMATIC DIFFERENCE:                                                         │
│ Array size 1,000,000:                                                        │
│ • Linear: Up to 1,000,000 comparisons                                        │
│ • Binary: Up to 20 comparisons (log₂ 1,000,000 ≈ 20)                         │
│                                                                              │
│ That's 50,000x fewer comparisons!                                            │
│                                                                              │
│ REAL-WORLD ANALOGY:                                                          │
│ Dictionary lookup: You don't start from page 1!                              │
│ • Open to middle                                                             │
│ • Word comes before? Check first half                                        │
│ • Word comes after? Check second half                                        │
│ • Repeat until found                                                         │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHY DOES BINARY SEARCH WORK?                                                 │
├──────────────────────────────────────────────────────────────────────────────┤
│ PREREQUISITE: Array MUST be sorted!                                          │
│                                                                              │
│ THE LOGIC:                                                                   │
│ If array is sorted and middle element is:                                    │
│ • Equal to target → FOUND!                                                   │
│ • Greater than target → Target must be in LEFT half (all right are bigger)   │
│ • Less than target → Target must be in RIGHT half (all left are smaller)     │
│                                                                              │
│ Each comparison eliminates HALF of remaining elements!                       │
│ n → n/2 → n/4 → n/8 → ... → 1                                                │
│ This takes log₂(n) steps                                                     │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHEN TO USE BINARY SEARCH?                                                   │
├──────────────────────────────────────────────────────────────────────────────┤
│ ✅ USE WHEN:                                                                  │
│    • Data is SORTED (or can be sorted once, searched many times)             │
│    • Random access is possible (arrays, not linked lists)                    │
│    • Finding exact match                                                     │
│    • Finding insertion point                                                 │
│    • Finding first/last occurrence of a value                                │
│    • Search space can be divided (not just arrays - see variations!)         │
│                                                                              │
│ ❌ DON'T USE WHEN:                                                            │
│    • Data is unsorted and won't be searched again                            │
│    • Data changes frequently (maintain sorted = expensive)                   │
│    • Sequential access only (linked lists)                                   │
│    • Very small arrays (linear search is fine for n < 10)                    │
│                                                                              │
│ INTERVIEW SIGNAL: "Find in sorted array" or "Search space" = BINARY SEARCH   │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ DIFFICULTIES & COMMON BUGS                                                   │
├──────────────────────────────────────────────────────────────────────────────┤
│ 1. INTEGER OVERFLOW IN MID CALCULATION:                                      │
│    WRONG: int mid = (left + right) / 2;  // Can overflow!                    │
│    RIGHT: int mid = left + (right - left) / 2;                               │
│                                                                              │
│ 2. INFINITE LOOP (Wrong termination):                                        │
│    WRONG: while (left < right)  with mid = left + (right-left)/2             │
│           If left=4, right=5: mid=4, never terminates!                       │
│    RIGHT: Match loop condition with update logic                             │
│                                                                              │
│ 3. OFF-BY-ONE ERRORS:                                                        │
│    When to use left = mid vs left = mid + 1?                                 │
│    When to use right = mid vs right = mid - 1?                               │
│    Solution: Think about whether mid could be the answer                     │
│                                                                              │
│ 4. EMPTY ARRAY:                                                              │
│    Always check if array is empty before searching!                          │
│                                                                              │
│ 5. DUPLICATES:                                                               │
│    Standard binary search finds ANY occurrence                               │
│    For first/last, need modified versions (see below)                        │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ EXPECTED OUTPUTS & COMPLEXITY                                                │
├──────────────────────────────────────────────────────────────────────────────┤
│ TIME COMPLEXITY:  O(log n) - halving each iteration                          │
│ SPACE COMPLEXITY: O(1) iterative, O(log n) recursive                         │
│                                                                              │
│ OUTPUTS:                                                                     │
│ • Found: Return index of target                                              │
│ • Not found: Return -1 OR insertion point (depends on variant)               │
│                                                                              │
│ NUMBER OF COMPARISONS:                                                       │
│ • Best case: 1 (target is at mid)                                            │
│ • Worst case: ⌈log₂(n+1)⌉                                                    │
│ • Average case: log₂(n) - 1                                                  │
│                                                                              │
│ ┌────────────────┬──────────────────────────────────────────────────────────┐│
│ │ Array Size     │ Max Comparisons                                          ││
│ ├────────────────┼──────────────────────────────────────────────────────────┤│
│ │ 10             │ 4                                                        ││
│ │ 100            │ 7                                                        ││
│ │ 1,000          │ 10                                                       ││
│ │ 1,000,000      │ 20                                                       ││
│ │ 1,000,000,000  │ 30                                                       ││
│ └────────────────┴──────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────────────┘
```

```java
// STANDARD BINARY SEARCH
// PROBLEM: Find target in sorted array
// DIVIDE: Look at middle, decide which half to search
// CONQUER: Search in chosen half
// COMBINE: No combining needed

public int binarySearch(int[] arr, int target) {
    int left = 0, right = arr.length - 1;

    while (left <= right) {
        int mid = left + (right - left) / 2;  // Avoid overflow

        if (arr[mid] == target) {
            return mid;
        } else if (arr[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }

    return -1;  // Not found
}

// VISUAL TRACE:
// arr = [1, 3, 5, 7, 9, 11, 13], target = 7
//
// Step 1: left=0, right=6, mid=3
//         arr[3]=7 == target -> FOUND at index 3!
//
// If target = 11:
// Step 1: left=0, right=6, mid=3
//         arr[3]=7 < 11, so left=4
// Step 2: left=4, right=6, mid=5
//         arr[5]=11 == target -> FOUND at index 5!
//
// If target = 6 (not in array):
// Step 1: left=0, right=6, mid=3, arr[3]=7 > 6, right=2
// Step 2: left=0, right=2, mid=1, arr[1]=3 < 6, left=2
// Step 3: left=2, right=2, mid=2, arr[2]=5 < 6, left=3
// Step 4: left=3, right=2 → left > right, EXIT, return -1

// TIME: O(log n) - halving each time
// SPACE: O(1) iterative, O(log n) recursive

// RECURRENCE: T(n) = T(n/2) + O(1) = O(log n)

// VARIANT: Find first occurrence (when duplicates exist)
public int findFirst(int[] arr, int target) {
    int left = 0, right = arr.length - 1;
    int result = -1;

    while (left <= right) {
        int mid = left + (right - left) / 2;

        if (arr[mid] == target) {
            result = mid;      // Found one, but keep searching left
            right = mid - 1;   // for potentially earlier occurrence
        } else if (arr[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }

    return result;
}

// VARIANT: Find last occurrence
public int findLast(int[] arr, int target) {
    int left = 0, right = arr.length - 1;
    int result = -1;

    while (left <= right) {
        int mid = left + (right - left) / 2;

        if (arr[mid] == target) {
            result = mid;     // Found one, but keep searching right
            left = mid + 1;   // for potentially later occurrence
        } else if (arr[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }

    return result;
}
```

---

## D&C Classic Algorithms

### Finding Maximum and Minimum

```java
// NAIVE: 2n-2 comparisons
// D&C: 3n/2 - 2 comparisons (25% fewer!)

class Pair {
    int min, max;
    Pair(int min, int max) {
        this.min = min;
        this.max = max;
    }
}

public Pair findMinMax(int[] arr, int low, int high) {
    // Base case: single element
    if (low == high) {
        return new Pair(arr[low], arr[low]);
    }

    // Base case: two elements
    if (high == low + 1) {
        if (arr[low] < arr[high]) {
            return new Pair(arr[low], arr[high]);
        } else {
            return new Pair(arr[high], arr[low]);
        }
    }

    // Divide
    int mid = (low + high) / 2;
    Pair left = findMinMax(arr, low, mid);
    Pair right = findMinMax(arr, mid + 1, high);

    // Combine
    return new Pair(
        Math.min(left.min, right.min),
        Math.max(left.max, right.max)
    );
}

// VISUAL TRACE:
// arr = [3, 5, 1, 8, 2, 9]
//
//              [3,5,1,8,2,9]
//              /            \
//         [3,5,1]        [8,2,9]
//         /    \          /    \
//       [3,5]  [1]     [8,2]  [9]
//        |      |        |      |
//     (3,5)   (1,1)   (2,8)  (9,9)
//         \    /          \    /
//        (1,5)           (2,9)
//              \        /
//              (1,9)
//
// Answer: min=1, max=9
```

### Quick Sort (D&C)

```java
// DIVIDE: Partition around pivot
// CONQUER: Recursively sort left and right
// COMBINE: No combining needed (in-place)

public void quickSort(int[] arr, int low, int high) {
    if (low < high) {
        int pivotIndex = partition(arr, low, high);
        quickSort(arr, low, pivotIndex - 1);
        quickSort(arr, pivotIndex + 1, high);
    }
}

private int partition(int[] arr, int low, int high) {
    int pivot = arr[high];  // Choose last element as pivot
    int i = low - 1;        // Index of smaller element

    for (int j = low; j < high; j++) {
        if (arr[j] <= pivot) {
            i++;
            swap(arr, i, j);
        }
    }

    swap(arr, i + 1, high);
    return i + 1;
}

// VISUAL TRACE:
// arr = [10, 7, 8, 9, 1, 5]
//
// Step 1: pivot = 5
//         Partition: [1] [5] [10, 7, 8, 9]
//
// Step 2: Sort left [1] - already sorted
//         Sort right [10, 7, 8, 9], pivot = 9
//         Partition: [7, 8] [9] [10]
//
// Step 3: Sort [7, 8], pivot = 8
//         Result: [7, 8]
//
// Final: [1, 5, 7, 8, 9, 10]

// TIME: O(n log n) average, O(n^2) worst (sorted array + bad pivot)
// SPACE: O(log n) stack space
// RECURRENCE: T(n) = 2T(n/2) + O(n) = O(n log n)
```

### Merge Sort (D&C)

```java
public void mergeSort(int[] arr, int left, int right) {
    if (left < right) {
        int mid = left + (right - left) / 2;

        // Divide
        mergeSort(arr, left, mid);
        mergeSort(arr, mid + 1, right);

        // Combine
        merge(arr, left, mid, right);
    }
}

// VISUAL TRACE:
// arr = [38, 27, 43, 3, 9, 82, 10]
//
//           [38, 27, 43, 3, 9, 82, 10]
//          /                          \
//    [38, 27, 43, 3]          [9, 82, 10]
//    /            \            /        \
// [38, 27]    [43, 3]      [9, 82]    [10]
//  /    \      /    \       /    \      |
// [38] [27]  [43]  [3]    [9]  [82]   [10]
//  \    /      \    /       \    /      |
// [27, 38]    [3, 43]      [9, 82]    [10]
//    \          /            \        /
//   [3, 27, 38, 43]         [9, 10, 82]
//          \                  /
//      [3, 9, 10, 27, 38, 43, 82]

// TIME: O(n log n) always
// SPACE: O(n) for temp arrays
```

---

## Master Theorem

```
For recurrence: T(n) = aT(n/b) + f(n)

Let c = log_b(a)

CASE 1: If f(n) = O(n^(c-e)) for some e > 0
        Then T(n) = Theta(n^c)
        (Work dominated by leaves)

CASE 2: If f(n) = Theta(n^c)
        Then T(n) = Theta(n^c * log n)
        (Work evenly distributed)

CASE 3: If f(n) = Omega(n^(c+e)) for some e > 0
        And af(n/b) <= kf(n) for k < 1
        Then T(n) = Theta(f(n))
        (Work dominated by root)

EXAMPLES:
Binary Search:  T(n) = T(n/2) + O(1)
                a=1, b=2, f(n)=O(1), c=0
                Case 2: T(n) = O(log n)

Merge Sort:     T(n) = 2T(n/2) + O(n)
                a=2, b=2, f(n)=O(n), c=1
                Case 2: T(n) = O(n log n)

Strassen:       T(n) = 7T(n/2) + O(n^2)
                a=7, b=2, f(n)=O(n^2), c=log_2(7)~2.81
                Case 1: T(n) = O(n^2.807)
```

---

📖 **Related Files:**
- [02a_Sorting_Fundamentals](02a_Sorting_Fundamentals.md) — Merge Sort and Quick Sort details
- [03a_Recursion_Internals](03a_Recursion_Internals.md) — How recursion works at CPU level
- [../14_Mental_Models/11_Greedy_vs_DP_Decision](../14_Mental_Models/11_Greedy_vs_DP_Decision.md) — D&C vs DP vs Greedy

---

> **Navigation**: [← Sorting Advanced](02b_Sorting_Advanced.md) | [Back to Index](../00_MASTER_INDEX.md) | [Recursion Internals →](03a_Recursion_Internals.md)
