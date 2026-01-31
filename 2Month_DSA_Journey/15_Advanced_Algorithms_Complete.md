# 🎯 Advanced Algorithms: Complete University Guide

## From Divide & Conquer to NP-Complete

---

# UNIT 1: INTRODUCTION & DIVIDE AND CONQUER

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

```
┌─────────────────────────────────────────────────────────────────┐
│                    ASYMPTOTIC NOTATIONS                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Big-O (O):     UPPER BOUND (Worst Case)                       │
│                 f(n) = O(g(n)) means f(n) ≤ c·g(n)             │
│                 "At most this much"                             │
│                                                                 │
│  Big-Omega (Ω): LOWER BOUND (Best Case)                        │
│                 f(n) = Ω(g(n)) means f(n) ≥ c·g(n)             │
│                 "At least this much"                            │
│                                                                 │
│  Big-Theta (Θ): TIGHT BOUND (Average Case)                     │
│                 f(n) = Θ(g(n)) means c₁·g(n) ≤ f(n) ≤ c₂·g(n) │
│                 "Exactly this much"                             │
│                                                                 │
│  Little-o (o): Strictly less than (not tight)                  │
│  Little-ω (ω): Strictly greater than (not tight)               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

COMMON COMPLEXITIES (Slowest to Fastest):
O(n!) > O(2ⁿ) > O(n³) > O(n²) > O(n log n) > O(n) > O(√n) > O(log n) > O(1)

VISUAL GROWTH:
n=10:
O(1)      = 1
O(log n)  = 3.3
O(n)      = 10
O(n log n)= 33
O(n²)     = 100
O(2ⁿ)     = 1024
O(n!)     = 3,628,800
```

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
│ - Named after military strategy "divide et impera" (divide and rule)       │
│ - Formalized in computer science in 1960s                                   │
│ - Foundation for many efficient algorithms                                  │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ WHAT PROBLEM DOES IT SOLVE?                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ CORE PROBLEM: Large problems that are too complex to solve directly         │
│                                                                             │
│ EXAMPLE - Sorting 1 million numbers:                                        │
│ BRUTE FORCE: Compare all pairs → O(n²) = 10¹² comparisons 😢               │
│ D&C (Merge Sort): Split, sort halves, merge → O(n log n) = 2×10⁷ 🎉       │
│                                                                             │
│ WHY DOES D&C WORK BETTER?                                                   │
│ • Reduces problem size EXPONENTIALLY (n → n/2 → n/4 → ...)                 │
│ • Each level does O(n) work, but only log(n) levels                         │
│ • Total: O(n) × O(log n) = O(n log n)                                      │
│                                                                             │
│ REAL-WORLD ANALOGY:                                                         │
│ Organizing a library of 1000 books alphabetically:                          │
│ • One person doing everything: VERY SLOW                                    │
│ • Split books in half, give each half to a helper, merge results: FASTER   │
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
│ ✅ USE D&C WHEN:                                                            │
│    • Problem can be broken into SIMILAR subproblems                         │
│    • Subproblems are INDEPENDENT (don't share data/state)                   │
│    • Solutions can be COMBINED efficiently                                  │
│    • Problem has a NATURAL recursive structure                              │
│                                                                             │
│ ❌ DON'T USE D&C WHEN:                                                      │
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
│    Wrong: if (n == 0) → causes infinite recursion for n=1                  │
│    Right: if (n <= 1) → handles both 0 and 1                               │
│                                                                             │
│ 2. NOT REDUCING PROBLEM SIZE:                                               │
│    Wrong: mergeSort(arr, 0, n) recursively with same range                 │
│    Right: mergeSort(arr, 0, mid) and mergeSort(arr, mid+1, n)              │
│                                                                             │
│ 3. STACK OVERFLOW:                                                          │
│    Problem: Too deep recursion (n = 10^6)                                   │
│    Solution: Convert to iterative or increase stack size                    │
│                                                                             │
│ 4. INEFFICIENT COMBINE STEP:                                                │
│    If combine is O(n²), overall becomes O(n² log n) - defeats purpose!     │
│                                                                             │
│ 5. OVERLAPPING SUBPROBLEMS (misusing D&C):                                  │
│    Fibonacci with D&C → O(2ⁿ) because subproblems overlap                  │
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
│   f(n) = work done outside recursion (divide + combine)                    │
│                                                                             │
│ COMMON D&C ALGORITHMS & THEIR COMPLEXITY:                                   │
│ ┌────────────────────┬──────────┬───────────────────┬────────────────────┐  │
│ │ Algorithm          │ a  │ b  │ f(n)  │ T(n)                            │  │
│ ├────────────────────┼────┼────┼───────┼────────────────────────────────┤  │
│ │ Binary Search      │ 1  │ 2  │ O(1)  │ O(log n)                        │  │
│ │ Merge Sort         │ 2  │ 2  │ O(n)  │ O(n log n)                      │  │
│ │ Quick Sort (avg)   │ 2  │ 2  │ O(n)  │ O(n log n)                      │  │
│ │ Strassen's Matrix  │ 7  │ 2  │ O(n²) │ O(n^2.81)                       │  │
│ │ Karatsuba Multiply │ 3  │ 2  │ O(n)  │ O(n^1.58)                       │  │
│ └────────────────────┴────┴────┴───────┴────────────────────────────────┘  │
│                                                                             │
│ EXAMPLE OUTPUT (Merge Sort):                                                │
│ Input:  [38, 27, 43, 3, 9, 82, 10]                                         │
│ Divide: [38, 27, 43, 3] | [9, 82, 10]                                      │
│ Divide: [38, 27] | [43, 3] | [9, 82] | [10]                                │
│ Conquer: [27, 38] | [3, 43] | [9, 82] | [10]                               │
│ Combine: [3, 27, 38, 43] | [9, 10, 82]                                     │
│ Output: [3, 9, 10, 27, 38, 43, 82]                                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Binary Search

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    BINARY SEARCH - COMPLETE UNDERSTANDING                     ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHAT IS BINARY SEARCH?                                                       │
├──────────────────────────────────────────────────────────────────────────────┤
│ A search algorithm that finds a target value in a SORTED array by           │
│ repeatedly dividing the search interval in half.                             │
│                                                                              │
│ INVENTOR: While the concept is ancient, the first bug-free implementation   │
│ took 16 years after the algorithm was published (1946-1962)!                │
│                                                                              │
│ FUN FACT: Even experienced programmers often write buggy binary search.     │
│ Jon Bentley found that 90% of professional programmers couldn't write      │
│ a correct binary search in 2 hours!                                         │
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
│ • Binary: Up to 20 comparisons (log₂ 1,000,000 ≈ 20)                        │
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
│ • Greater than target → Target must be in LEFT half (all right are bigger)  │
│ • Less than target → Target must be in RIGHT half (all left are smaller)   │
│                                                                              │
│ Each comparison eliminates HALF of remaining elements!                       │
│ n → n/2 → n/4 → n/8 → ... → 1                                               │
│ This takes log₂(n) steps                                                     │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHEN TO USE BINARY SEARCH?                                                   │
├──────────────────────────────────────────────────────────────────────────────┤
│ ✅ USE WHEN:                                                                │
│    • Data is SORTED (or can be sorted once, searched many times)            │
│    • Random access is possible (arrays, not linked lists)                    │
│    • Finding exact match                                                     │
│    • Finding insertion point                                                 │
│    • Finding first/last occurrence of a value                                │
│    • Search space can be divided (not just arrays - see variations!)        │
│                                                                              │
│ ❌ DON'T USE WHEN:                                                          │
│    • Data is unsorted and won't be searched again                            │
│    • Data changes frequently (maintain sorted = expensive)                   │
│    • Sequential access only (linked lists)                                   │
│    • Very small arrays (linear search is fine for n < 10)                   │
│                                                                              │
│ INTERVIEW SIGNAL: "Find in sorted array" or "Search space" = BINARY SEARCH  │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ DIFFICULTIES & COMMON BUGS                                                   │
├──────────────────────────────────────────────────────────────────────────────┤
│ 1. INTEGER OVERFLOW IN MID CALCULATION:                                      │
│    WRONG: int mid = (left + right) / 2;  // Can overflow!                   │
│    RIGHT: int mid = left + (right - left) / 2;                              │
│                                                                              │
│ 2. INFINITE LOOP (Wrong termination):                                        │
│    WRONG: while (left < right)  with mid = left + (right-left)/2           │
│           If left=4, right=5: mid=4, never terminates!                       │
│    RIGHT: Match loop condition with update logic                             │
│                                                                              │
│ 3. OFF-BY-ONE ERRORS:                                                        │
│    When to use left = mid vs left = mid + 1?                                │
│    When to use right = mid vs right = mid - 1?                              │
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
│ • Not found: Return -1 OR insertion point (depends on variant)              │
│                                                                              │
│ NUMBER OF COMPARISONS:                                                       │
│ • Best case: 1 (target is at mid)                                            │
│ • Worst case: ⌈log₂(n+1)⌉                                                   │
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
//         arr[3]=7 == target ✓ FOUND at index 3!
//
// If target = 11:
// Step 1: left=0, right=6, mid=3
//         arr[3]=7 < 11, so left=4
// Step 2: left=4, right=6, mid=5
//         arr[5]=11 == target ✓ FOUND at index 5!
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
//        ↓      ↓        ↓      ↓
//     (3,5)   (1,1)   (2,8)  (9,9)
//         \    /          \    /
//        (1,5)           (2,9)
//              \        /
//              (1,9)
//
// Answer: min=1, max=9
```

### Quick Sort

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

// TIME: O(n log n) average, O(n²) worst (sorted array + bad pivot)
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

### Master Theorem

```
For recurrence: T(n) = aT(n/b) + f(n)

Let c = log_b(a)

CASE 1: If f(n) = O(n^(c-ε)) for some ε > 0
        Then T(n) = Θ(n^c)
        (Work dominated by leaves)

CASE 2: If f(n) = Θ(n^c)
        Then T(n) = Θ(n^c · log n)
        (Work evenly distributed)

CASE 3: If f(n) = Ω(n^(c+ε)) for some ε > 0
        And af(n/b) ≤ kf(n) for k < 1
        Then T(n) = Θ(f(n))
        (Work dominated by root)

EXAMPLES:
Binary Search:  T(n) = T(n/2) + O(1)
                a=1, b=2, f(n)=O(1), c=0
                Case 2: T(n) = O(log n)

Merge Sort:     T(n) = 2T(n/2) + O(n)
                a=2, b=2, f(n)=O(n), c=1
                Case 2: T(n) = O(n log n)

Strassen:       T(n) = 7T(n/2) + O(n²)
                a=7, b=2, f(n)=O(n²), c=log₂7≈2.81
                Case 1: T(n) = O(n^2.81)
```

---

# UNIT 2: THE GREEDY METHOD

## The General Method

```
GREEDY APPROACH:
Make the locally optimal choice at each step,
hoping to find a global optimum.

┌─────────────────────────────────────────┐
│           GREEDY STRATEGY               │
├─────────────────────────────────────────┤
│                                         │
│  1. FEASIBILITY: Check if choice valid  │
│  2. LOCAL OPTIMUM: Pick best option NOW │
│  3. IRREVOCABLE: Never reconsider       │
│                                         │
└─────────────────────────────────────────┘

WHEN GREEDY WORKS:
✓ Greedy Choice Property: Local optimal → Global optimal
✓ Optimal Substructure: Optimal solution contains optimal subsolutions

WHEN GREEDY FAILS:
✗ Coin change with unusual denominations
✗ 0/1 Knapsack (need DP)
✗ Problems requiring backtracking
```

### Fractional Knapsack Problem

```java
// CAN take fractions of items
// Greedy by value/weight ratio WORKS!

class Item {
    int value, weight;
    double ratio;

    Item(int v, int w) {
        value = v;
        weight = w;
        ratio = (double) v / w;
    }
}

public double fractionalKnapsack(Item[] items, int capacity) {
    // Sort by value/weight ratio (descending)
    Arrays.sort(items, (a, b) -> Double.compare(b.ratio, a.ratio));

    double totalValue = 0;
    int remainingCapacity = capacity;

    for (Item item : items) {
        if (remainingCapacity >= item.weight) {
            // Take whole item
            totalValue += item.value;
            remainingCapacity -= item.weight;
        } else {
            // Take fraction of item
            totalValue += item.ratio * remainingCapacity;
            break;
        }
    }

    return totalValue;
}

// VISUAL EXAMPLE:
// Items: [(60,10), (100,20), (120,30)]
// Capacity: 50
//
// Ratios: 60/10=6, 100/20=5, 120/30=4
// Sorted: [(60,10), (100,20), (120,30)]
//
// Take (60,10): value=60, capacity=40
// Take (100,20): value=160, capacity=20
// Take 20/30 of (120,30): value=160+80=240
//
// Answer: 240

// TIME: O(n log n) for sorting
```

### Job Sequencing with Deadlines

```java
// Jobs with deadlines and profits
// Schedule to maximize profit
// Each job takes 1 unit time

class Job {
    int id, deadline, profit;
    Job(int id, int d, int p) {
        this.id = id;
        deadline = d;
        profit = p;
    }
}

public int jobSequencing(Job[] jobs, int maxDeadline) {
    // Sort by profit (descending)
    Arrays.sort(jobs, (a, b) -> b.profit - a.profit);

    boolean[] slot = new boolean[maxDeadline + 1];
    int[] result = new int[maxDeadline + 1];
    int totalProfit = 0;

    for (Job job : jobs) {
        // Find latest free slot before deadline
        for (int j = job.deadline; j >= 1; j--) {
            if (!slot[j]) {
                slot[j] = true;
                result[j] = job.id;
                totalProfit += job.profit;
                break;
            }
        }
    }

    return totalProfit;
}

// VISUAL EXAMPLE:
// Jobs: [(1,2,100), (2,1,19), (3,2,27), (4,1,25), (5,3,15)]
// Sorted by profit: [J1(100), J3(27), J4(25), J2(19), J5(15)]
//
// J1: deadline=2, slot[2] free → assign
// J3: deadline=2, slot[2] taken, slot[1] free → assign
// J4: deadline=1, slot[1] taken → skip
// J2: deadline=1, slot[1] taken → skip
// J5: deadline=3, slot[3] free → assign
//
// Schedule: [J3, J1, J5] = slots [1, 2, 3]
// Profit: 27 + 100 + 15 = 142

// TIME: O(n² ) naive, O(n log n) with Union-Find
```

### Single Source Shortest Path (Dijkstra's Algorithm)

```java
// Find shortest path from source to all vertices
// Works only for non-negative weights

public int[] dijkstra(int[][] graph, int source, int n) {
    int[] dist = new int[n];
    boolean[] visited = new boolean[n];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[source] = 0;

    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[1] - b[1]);
    pq.offer(new int[]{source, 0});

    while (!pq.isEmpty()) {
        int[] curr = pq.poll();
        int u = curr[0];

        if (visited[u]) continue;
        visited[u] = true;

        for (int v = 0; v < n; v++) {
            if (graph[u][v] != 0 && !visited[v]) {
                int newDist = dist[u] + graph[u][v];
                if (newDist < dist[v]) {
                    dist[v] = newDist;
                    pq.offer(new int[]{v, newDist});
                }
            }
        }
    }

    return dist;
}

// VISUAL EXAMPLE:
//
//        (1)---4---(2)
//       / |         |
//      2  1         3
//     /   |         |
//   (0)   (3)---2---(4)
//
// From source 0:
//
// Step 1: dist = [0, ∞, ∞, ∞, ∞], visit 0
//         Update: dist[1] = 2
//
// Step 2: dist = [0, 2, ∞, ∞, ∞], visit 1
//         Update: dist[2] = 2+4 = 6
//         Update: dist[3] = 2+1 = 3
//
// Step 3: dist = [0, 2, 6, 3, ∞], visit 3
//         Update: dist[4] = 3+2 = 5
//
// Step 4: dist = [0, 2, 6, 3, 5], visit 4
//         Update: dist[2] = min(6, 5+3) = 6 (no change)
//
// Final: [0, 2, 6, 3, 5]

// TIME: O((V+E) log V) with priority queue
```

### Optimal Merge Pattern (Huffman-like)

```java
// Merge n sorted files with minimum comparisons
// Greedy: Always merge two smallest files

public int optimalMerge(int[] fileSizes) {
    PriorityQueue<Integer> pq = new PriorityQueue<>();

    for (int size : fileSizes) {
        pq.offer(size);
    }

    int totalCost = 0;

    while (pq.size() > 1) {
        int first = pq.poll();
        int second = pq.poll();
        int merged = first + second;

        totalCost += merged;
        pq.offer(merged);
    }

    return totalCost;
}

// VISUAL EXAMPLE:
// Files: [2, 3, 4, 5, 6]
//
// Merge 2+3 = 5, cost = 5
// Files: [4, 5, 5, 6]
//
// Merge 4+5 = 9, cost = 5+9 = 14
// Files: [5, 6, 9]
//
// Merge 5+6 = 11, cost = 14+11 = 25
// Files: [9, 11]
//
// Merge 9+11 = 20, cost = 25+20 = 45
//
// Total cost: 45

// TIME: O(n log n)
```

---

# UNIT 3: DYNAMIC PROGRAMMING

## The General Method

```
DYNAMIC PROGRAMMING:
Solve complex problems by breaking into overlapping subproblems,
solving each subproblem once, and storing results.

DP = RECURSION + MEMOIZATION (or TABULATION)

TWO APPROACHES:
1. TOP-DOWN (Memoization):
   - Start from main problem
   - Recursively solve subproblems
   - Cache results

2. BOTTOM-UP (Tabulation):
   - Start from smallest subproblems
   - Build up to main problem
   - Fill table iteratively

WHEN TO USE DP:
✓ Optimal Substructure
✓ Overlapping Subproblems
✓ Counting problems
✓ Optimization problems (min/max)
```

### 0/1 Knapsack Problem

```java
// CANNOT take fractions - either take item or don't
// Greedy FAILS here - need DP

public int knapsack01(int[] weights, int[] values, int capacity) {
    int n = weights.length;
    int[][] dp = new int[n + 1][capacity + 1];

    for (int i = 1; i <= n; i++) {
        for (int w = 0; w <= capacity; w++) {
            // Don't take item i-1
            dp[i][w] = dp[i - 1][w];

            // Take item i-1 (if it fits)
            if (weights[i - 1] <= w) {
                dp[i][w] = Math.max(
                    dp[i][w],
                    dp[i - 1][w - weights[i - 1]] + values[i - 1]
                );
            }
        }
    }

    return dp[n][capacity];
}

// VISUAL DP TABLE:
// weights = [1, 2, 3], values = [6, 10, 12], capacity = 5
//
//        w:  0   1   2   3   4   5
// item 0:    0   0   0   0   0   0
// item 1:    0   6   6   6   6   6   (w=1, v=6)
// item 2:    0   6  10  16  16  16   (w=2, v=10)
// item 3:    0   6  10  16  18  22   (w=3, v=12)
//
// Answer: 22 (items 2 and 3: weights 2+3=5, values 10+12=22)

// TIME: O(n × capacity)
// SPACE: O(n × capacity), can optimize to O(capacity)
```

### Single Source Shortest Path (Bellman-Ford)

```java
// Works with NEGATIVE weights (unlike Dijkstra)
// Can detect negative cycles

public int[] bellmanFord(int[][] edges, int n, int source) {
    int[] dist = new int[n];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[source] = 0;

    // Relax all edges (n-1) times
    for (int i = 0; i < n - 1; i++) {
        for (int[] edge : edges) {
            int u = edge[0], v = edge[1], weight = edge[2];
            if (dist[u] != Integer.MAX_VALUE &&
                dist[u] + weight < dist[v]) {
                dist[v] = dist[u] + weight;
            }
        }
    }

    // Check for negative cycle
    for (int[] edge : edges) {
        int u = edge[0], v = edge[1], weight = edge[2];
        if (dist[u] != Integer.MAX_VALUE &&
            dist[u] + weight < dist[v]) {
            throw new RuntimeException("Negative cycle detected!");
        }
    }

    return dist;
}

// VISUAL TRACE:
// Edges: [(0,1,4), (0,2,5), (1,2,-3), (2,3,4)]
// Source: 0
//
// Initial:  dist = [0, ∞, ∞, ∞]
// Pass 1:   dist = [0, 4, 5, ∞]  → [0, 4, 1, 5]
// Pass 2:   dist = [0, 4, 1, 5]  (no change)
// Pass 3:   No change → converged

// TIME: O(V × E)
```

### All Pairs Shortest Paths (Floyd-Warshall)

```java
// Find shortest path between ALL pairs of vertices
// Works with negative weights, detects negative cycles

public int[][] floydWarshall(int[][] graph, int n) {
    int[][] dist = new int[n][n];
    int INF = Integer.MAX_VALUE / 2;

    // Initialize
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            if (i == j) dist[i][j] = 0;
            else if (graph[i][j] != 0) dist[i][j] = graph[i][j];
            else dist[i][j] = INF;
        }
    }

    // DP: Consider each vertex as intermediate
    for (int k = 0; k < n; k++) {           // Intermediate vertex
        for (int i = 0; i < n; i++) {       // Source
            for (int j = 0; j < n; j++) {   // Destination
                if (dist[i][k] + dist[k][j] < dist[i][j]) {
                    dist[i][j] = dist[i][k] + dist[k][j];
                }
            }
        }
    }

    return dist;
}

// VISUAL EXAMPLE:
//     0   1   2   3
// 0 [ 0   5   ∞   10]
// 1 [ ∞   0   3   ∞ ]
// 2 [ ∞   ∞   0   1 ]
// 3 [ ∞   ∞   ∞   0 ]
//
// After k=0: No changes (0 not useful as intermediate)
// After k=1: dist[0][2] = min(∞, 5+3) = 8
// After k=2: dist[0][3] = min(10, 8+1) = 9
//            dist[1][3] = min(∞, 3+1) = 4
// After k=3: No changes
//
// Final:
//     0   1   2   3
// 0 [ 0   5   8   9 ]
// 1 [ ∞   0   3   4 ]
// 2 [ ∞   ∞   0   1 ]
// 3 [ ∞   ∞   ∞   0 ]

// TIME: O(V³)
// SPACE: O(V²)
```

### Traveling Salesperson Problem (DP with Bitmask)

```java
// Visit all cities exactly once and return to start
// Find minimum cost tour

public int tsp(int[][] dist, int n) {
    int VISITED_ALL = (1 << n) - 1;
    int[][] dp = new int[n][1 << n];

    for (int[] row : dp) Arrays.fill(row, Integer.MAX_VALUE / 2);
    dp[0][1] = 0;  // Start at city 0, only city 0 visited

    for (int mask = 1; mask <= VISITED_ALL; mask++) {
        for (int last = 0; last < n; last++) {
            if ((mask & (1 << last)) == 0) continue;  // last not in mask

            for (int next = 0; next < n; next++) {
                if ((mask & (1 << next)) != 0) continue;  // next already visited

                int newMask = mask | (1 << next);
                dp[next][newMask] = Math.min(
                    dp[next][newMask],
                    dp[last][mask] + dist[last][next]
                );
            }
        }
    }

    // Return to starting city
    int ans = Integer.MAX_VALUE;
    for (int last = 1; last < n; last++) {
        ans = Math.min(ans, dp[last][VISITED_ALL] + dist[last][0]);
    }
    return ans;
}

// VISUAL EXAMPLE (4 cities):
// dist = [[0,10,15,20],
//         [10,0,35,25],
//         [15,35,0,30],
//         [20,25,30,0]]
//
// Bitmask representation:
// 0001 = city 0 visited
// 0011 = cities 0,1 visited
// 1111 = all visited
//
// Optimal tour: 0→1→3→2→0
// Cost: 10 + 25 + 30 + 15 = 80

// TIME: O(n² × 2ⁿ)
// SPACE: O(n × 2ⁿ)
```

### String Editing (Edit Distance)

```java
// Minimum operations to convert string1 to string2
// Operations: Insert, Delete, Replace

public int editDistance(String s1, String s2) {
    int m = s1.length(), n = s2.length();
    int[][] dp = new int[m + 1][n + 1];

    // Base cases
    for (int i = 0; i <= m; i++) dp[i][0] = i;  // Delete all
    for (int j = 0; j <= n; j++) dp[0][j] = j;  // Insert all

    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (s1.charAt(i - 1) == s2.charAt(j - 1)) {
                dp[i][j] = dp[i - 1][j - 1];  // No operation
            } else {
                dp[i][j] = 1 + Math.min(
                    dp[i - 1][j - 1],  // Replace
                    Math.min(
                        dp[i - 1][j],  // Delete
                        dp[i][j - 1]   // Insert
                    )
                );
            }
        }
    }

    return dp[m][n];
}

// VISUAL DP TABLE:
// s1 = "SUNDAY", s2 = "SATURDAY"
//
//       ""  S  A  T  U  R  D  A  Y
//   ""   0  1  2  3  4  5  6  7  8
//   S    1  0  1  2  3  4  5  6  7
//   U    2  1  1  2  2  3  4  5  6
//   N    3  2  2  2  3  3  4  5  6
//   D    4  3  3  3  3  4  3  4  5
//   A    5  4  3  4  4  4  4  3  4
//   Y    6  5  4  4  5  5  5  4  3
//
// Answer: 3 (Insert A, T, R)

// TIME: O(m × n)
// SPACE: O(m × n), can optimize to O(min(m, n))
```

---

# UNIT 4: BACKTRACKING

## The General Method

```
BACKTRACKING:
Systematic way to try all possible solutions.
Build solution incrementally, abandon ("backtrack") when
solution cannot possibly be completed.

┌─────────────────────────────────────────┐
│           BACKTRACKING TEMPLATE         │
├─────────────────────────────────────────┤
│                                         │
│  void backtrack(state, choices):        │
│      if (isSolution(state)):            │
│          processSolution(state)         │
│          return                         │
│                                         │
│      for each choice in choices:        │
│          if (isValid(choice)):          │
│              makeChoice(choice)         │
│              backtrack(newState)        │
│              undoChoice(choice)  ← KEY! │
│                                         │
└─────────────────────────────────────────┘

STATE SPACE TREE:
                    []
           /    /    \    \
         [1]  [2]   [3]  [4]
         /|\   |\    |
       ...     ...  ...   (pruned branches)
```

### N-Queens Problem

```java
// Place N queens on N×N board so no two attack each other

public List<List<String>> solveNQueens(int n) {
    List<List<String>> result = new ArrayList<>();
    int[] queens = new int[n];  // queens[row] = column
    Arrays.fill(queens, -1);

    backtrack(result, queens, 0, n);
    return result;
}

private void backtrack(List<List<String>> result, int[] queens,
                       int row, int n) {
    if (row == n) {
        result.add(buildBoard(queens, n));
        return;
    }

    for (int col = 0; col < n; col++) {
        if (isValid(queens, row, col)) {
            queens[row] = col;
            backtrack(result, queens, row + 1, n);
            queens[row] = -1;  // Backtrack
        }
    }
}

private boolean isValid(int[] queens, int row, int col) {
    for (int i = 0; i < row; i++) {
        // Same column
        if (queens[i] == col) return false;
        // Diagonal
        if (Math.abs(queens[i] - col) == Math.abs(i - row)) return false;
    }
    return true;
}

// VISUAL SOLUTION for N=4:
//
// Solution 1:        Solution 2:
// . Q . .            . . Q .
// . . . Q            Q . . .
// Q . . .            . . . Q
// . . Q .            . Q . .
//
// State Space Tree (partial):
//                    []
//            /    |    |    \
//          Q0    Q1   Q2   Q3  (row 0, columns 0-3)
//         / |    /\
//       ×  Q3  Q3 ×    (row 1, try each column)
//           |
//          Q0        (row 2)
//           |
//          Q2        (row 3) ✓ SOLUTION

// TIME: O(N!)
// SPACE: O(N) for recursion stack
```

### Sum of Subsets Problem

```java
// Find all subsets that sum to target

public List<List<Integer>> subsetSum(int[] nums, int target) {
    List<List<Integer>> result = new ArrayList<>();
    Arrays.sort(nums);  // For pruning
    backtrack(result, new ArrayList<>(), nums, target, 0);
    return result;
}

private void backtrack(List<List<Integer>> result, List<Integer> current,
                       int[] nums, int remaining, int start) {
    if (remaining == 0) {
        result.add(new ArrayList<>(current));
        return;
    }

    for (int i = start; i < nums.length; i++) {
        // Pruning: if number too large, all following are too (sorted)
        if (nums[i] > remaining) break;

        // Skip duplicates
        if (i > start && nums[i] == nums[i - 1]) continue;

        current.add(nums[i]);
        backtrack(result, current, nums, remaining - nums[i], i + 1);
        current.remove(current.size() - 1);  // Backtrack
    }
}

// VISUAL EXAMPLE:
// nums = [2, 3, 5, 7], target = 10
//
// State Space Tree:
//                         []
//           /        |        |       \
//         [2]       [3]      [5]     [7]
//        / | \      /  \       |
//     [2,3][2,5][2,7] [3,5][3,7] [5,7]×
//      |     |
//   [2,3,5] [2,5,7]×
//     ×
//
// Solutions: [3,7], [2,3,5]

// TIME: O(2ⁿ) worst case
```

### Graph Coloring Problem

```java
// Color graph with m colors so no adjacent vertices have same color

public boolean graphColoring(int[][] graph, int m, int n) {
    int[] colors = new int[n];
    return backtrack(graph, colors, m, 0);
}

private boolean backtrack(int[][] graph, int[] colors, int m, int vertex) {
    if (vertex == colors.length) {
        return true;  // All vertices colored
    }

    for (int c = 1; c <= m; c++) {
        if (isSafe(graph, colors, vertex, c)) {
            colors[vertex] = c;
            if (backtrack(graph, colors, m, vertex + 1)) {
                return true;
            }
            colors[vertex] = 0;  // Backtrack
        }
    }

    return false;  // No valid coloring
}

private boolean isSafe(int[][] graph, int[] colors, int vertex, int color) {
    for (int i = 0; i < colors.length; i++) {
        if (graph[vertex][i] == 1 && colors[i] == color) {
            return false;
        }
    }
    return true;
}

// VISUAL EXAMPLE:
// Graph:     0---1
//            |\ /|
//            | X |
//            |/ \|
//            3---2
//
// m=3 colors (R=1, G=2, B=3)
//
// vertex 0: try R → colors = [R, _, _, _]
// vertex 1: try R (conflict with 0)
//           try G → colors = [R, G, _, _]
// vertex 2: try R (conflict with 0)
//           try G (conflict with 1)
//           try B → colors = [R, G, B, _]
// vertex 3: try R (conflict with 0)
//           try G → colors = [R, G, B, G]
//
// Valid coloring found!
```

### Hamiltonian Cycle Problem

```java
// Find cycle that visits every vertex exactly once

public List<Integer> hamiltonianCycle(int[][] graph, int n) {
    int[] path = new int[n];
    Arrays.fill(path, -1);
    path[0] = 0;  // Start at vertex 0

    if (backtrack(graph, path, 1)) {
        List<Integer> result = new ArrayList<>();
        for (int v : path) result.add(v);
        result.add(0);  // Complete the cycle
        return result;
    }
    return null;
}

private boolean backtrack(int[][] graph, int[] path, int pos) {
    if (pos == path.length) {
        // Check if there's edge from last vertex to first
        return graph[path[pos - 1]][path[0]] == 1;
    }

    for (int v = 1; v < path.length; v++) {
        if (isSafe(graph, path, pos, v)) {
            path[pos] = v;
            if (backtrack(graph, path, pos + 1)) {
                return true;
            }
            path[pos] = -1;  // Backtrack
        }
    }

    return false;
}

private boolean isSafe(int[][] graph, int[] path, int pos, int v) {
    // Check if v is adjacent to previously added vertex
    if (graph[path[pos - 1]][v] == 0) return false;

    // Check if v already in path
    for (int i = 0; i < pos; i++) {
        if (path[i] == v) return false;
    }

    return true;
}

// VISUAL EXAMPLE:
// Graph:
//     0---1
//    /|   |\
//   3 |   | 2
//    \|   |/
//     4---5
//
// Finding Hamiltonian Cycle starting from 0:
// 0 → 1 → 2 → 5 → 4 → 3 → 0 ✓

// TIME: O(N!) worst case
```

---

# UNIT 5: BRANCH AND BOUND

## The General Method

```
BRANCH AND BOUND:
Like backtracking, but uses BOUNDS to prune more aggressively.

KEY DIFFERENCE FROM BACKTRACKING:
- Backtracking: Prune when solution CANNOT be completed
- Branch & Bound: Prune when solution CANNOT be optimal

COMPONENTS:
1. BRANCHING: Split problem into subproblems
2. BOUNDING: Calculate bounds for each subproblem
3. PRUNING: Discard subproblems with bad bounds

┌─────────────────────────────────────────┐
│        BRANCH AND BOUND TYPES           │
├─────────────────────────────────────────┤
│                                         │
│  FIFO (BFS-like):                       │
│    - Process nodes in queue order       │
│    - Explores level by level            │
│                                         │
│  LC (Least Cost):                       │
│    - Process most promising node first  │
│    - Uses priority queue                │
│                                         │
│  LIFO (DFS-like):                       │
│    - Process most recent node first     │
│    - Memory efficient                   │
│                                         │
└─────────────────────────────────────────┘
```

### 0/1 Knapsack using Branch and Bound

```java
class Node {
    int level, profit, weight;
    double bound;
}

public int knapsackBB(int[] values, int[] weights, int capacity) {
    int n = values.length;

    // Sort by value/weight ratio
    Integer[] idx = new Integer[n];
    for (int i = 0; i < n; i++) idx[i] = i;
    Arrays.sort(idx, (a, b) ->
        Double.compare((double)values[b]/weights[b],
                      (double)values[a]/weights[a]));

    PriorityQueue<Node> pq = new PriorityQueue<>(
        (a, b) -> Double.compare(b.bound, a.bound)
    );

    Node root = new Node();
    root.level = -1;
    root.profit = 0;
    root.weight = 0;
    root.bound = calculateBound(root, values, weights, capacity, idx, n);

    pq.offer(root);
    int maxProfit = 0;

    while (!pq.isEmpty()) {
        Node node = pq.poll();

        if (node.bound <= maxProfit) continue;  // Prune!

        int i = node.level + 1;
        if (i >= n) continue;

        int itemIdx = idx[i];

        // Include item
        Node include = new Node();
        include.level = i;
        include.weight = node.weight + weights[itemIdx];
        include.profit = node.profit + values[itemIdx];

        if (include.weight <= capacity) {
            maxProfit = Math.max(maxProfit, include.profit);
            include.bound = calculateBound(include, values, weights,
                                          capacity, idx, n);
            if (include.bound > maxProfit) {
                pq.offer(include);
            }
        }

        // Exclude item
        Node exclude = new Node();
        exclude.level = i;
        exclude.weight = node.weight;
        exclude.profit = node.profit;
        exclude.bound = calculateBound(exclude, values, weights,
                                       capacity, idx, n);
        if (exclude.bound > maxProfit) {
            pq.offer(exclude);
        }
    }

    return maxProfit;
}

// Bound = current profit + fractional knapsack on remaining items
private double calculateBound(Node node, int[] values, int[] weights,
                              int capacity, Integer[] idx, int n) {
    if (node.weight >= capacity) return 0;

    double bound = node.profit;
    int w = node.weight;
    int i = node.level + 1;

    while (i < n && w + weights[idx[i]] <= capacity) {
        w += weights[idx[i]];
        bound += values[idx[i]];
        i++;
    }

    if (i < n) {
        bound += (capacity - w) * ((double)values[idx[i]] / weights[idx[i]]);
    }

    return bound;
}

// VISUAL EXAMPLE:
// values = [40, 30, 50, 10], weights = [2, 5, 10, 5], capacity = 16
// Sorted by ratio: items [0, 1, 2, 3] with ratios [20, 6, 5, 2]
//
// Root: profit=0, weight=0, bound=98
//
//                    [root, bound=98]
//                   /              \
//         [include 0]          [exclude 0]
//         p=40,w=2              p=0,w=0
//         bound=98              bound=58
//              |                     |
//         [include 1]          (explored...)
//         p=70,w=7
//         bound=80
//              |
//         [include 2]
//         p=120,w=17 > capacity (PRUNED)
//              |
//         [exclude 2]
//         p=70,w=7
//         bound=76
```

### Traveling Salesperson using Branch and Bound

```java
// Find minimum cost Hamiltonian cycle

class TSPNode {
    int level;
    int[] path;
    boolean[] visited;
    int cost;
    int bound;
}

public int tspBranchBound(int[][] dist, int n) {
    PriorityQueue<TSPNode> pq = new PriorityQueue<>(
        (a, b) -> a.bound - b.bound
    );

    TSPNode root = createNode(dist, n, -1, 0);
    root.path[0] = 0;
    root.visited[0] = true;
    root.level = 0;
    root.cost = 0;
    root.bound = calculateBound(root, dist, n);

    pq.offer(root);
    int minCost = Integer.MAX_VALUE;

    while (!pq.isEmpty()) {
        TSPNode node = pq.poll();

        if (node.bound >= minCost) continue;  // Prune

        if (node.level == n - 1) {
            // Complete tour
            int lastCity = node.path[node.level];
            int tourCost = node.cost + dist[lastCity][0];
            minCost = Math.min(minCost, tourCost);
            continue;
        }

        for (int city = 0; city < n; city++) {
            if (!node.visited[city]) {
                TSPNode child = createChild(node, dist, n, city);
                if (child.bound < minCost) {
                    pq.offer(child);
                }
            }
        }
    }

    return minCost;
}

// Bound calculation: Cost so far + minimum outgoing edges from unvisited
private int calculateBound(TSPNode node, int[][] dist, int n) {
    int bound = node.cost;

    for (int i = 0; i < n; i++) {
        if (!node.visited[i] || i == node.path[node.level]) {
            int minEdge = Integer.MAX_VALUE;
            for (int j = 0; j < n; j++) {
                if (i != j && (!node.visited[j] || j == 0)) {
                    minEdge = Math.min(minEdge, dist[i][j]);
                }
            }
            bound += minEdge;
        }
    }

    return bound;
}
```

---

# NP-HARD AND NP-COMPLETE

## Basic Concepts

```
COMPLEXITY CLASSES:

P (Polynomial):
  - Problems solvable in polynomial time
  - Examples: Sorting, Searching, Shortest Path

NP (Nondeterministic Polynomial):
  - Solutions verifiable in polynomial time
  - Examples: SAT, Traveling Salesman, Graph Coloring

NP-Complete:
  - Hardest problems in NP
  - If any NP-Complete solved in P → P = NP
  - Examples: SAT, 3-SAT, Vertex Cover, Hamiltonian Cycle

NP-Hard:
  - At least as hard as NP-Complete
  - May not be in NP (not verifiable in poly time)
  - Examples: Halting Problem, TSP Optimization

┌─────────────────────────────────────────┐
│                 NP-Hard                 │
│         ┌───────────────────┐           │
│         │   NP-Complete     │           │
│    ┌────┼──────┐            │           │
│    │ P  │      │    NP      │           │
│    │    │      │            │           │
│    └────┼──────┘            │           │
│         └───────────────────┘           │
└─────────────────────────────────────────┘
        (If P ≠ NP, which is believed)
```

## Cook's Theorem

```
COOK'S THEOREM (1971):
SAT (Boolean Satisfiability) is NP-Complete.

SIGNIFICANCE:
- First problem proven to be NP-Complete
- All other NP-Complete proofs reduce FROM SAT

SAT PROBLEM:
Given a Boolean formula, is there an assignment
of TRUE/FALSE to variables that makes it TRUE?

Example: (x₁ ∨ ¬x₂) ∧ (¬x₁ ∨ x₃) ∧ (x₂ ∨ x₃)
Solution: x₁=TRUE, x₂=FALSE, x₃=TRUE

3-SAT:
Each clause has exactly 3 literals.
Also NP-Complete.

PROVING NP-COMPLETENESS:
1. Show problem is in NP (solution verifiable in poly time)
2. Reduce known NP-Complete problem TO your problem
3. The reduction must be polynomial time
```

## Famous NP-Complete Problems

```
1. SATISFIABILITY (SAT)
   Input: Boolean formula
   Question: Is there a satisfying assignment?

2. VERTEX COVER
   Input: Graph G, integer k
   Question: Is there a set of ≤k vertices covering all edges?

3. CLIQUE
   Input: Graph G, integer k
   Question: Is there a complete subgraph of size k?

4. HAMILTONIAN CYCLE
   Input: Graph G
   Question: Is there a cycle visiting all vertices exactly once?

5. SUBSET SUM
   Input: Set of integers, target sum S
   Question: Is there a subset summing to S?

6. GRAPH COLORING
   Input: Graph G, integer k
   Question: Can vertices be colored with k colors (no adjacent same)?

REDUCTION CHAIN:
SAT → 3-SAT → CLIQUE → VERTEX COVER → HAMILTONIAN → TSP
```

---

## PART 12: Advanced Algorithm Patterns for Interviews

### Pattern 1: Meet in the Middle

```
CONCEPT:
Split problem into two halves, solve each, combine.
Reduces O(2^n) to O(2^(n/2) * log(2^(n/2)))

USE CASES:
- Subset sum with n up to 40
- 4Sum with large arrays
- Problems where n is too large for brute force but small enough for 2^(n/2)

WHEN TO USE:
- 20 ≤ n ≤ 40 (too big for 2^n, too small for DP)
- Need all possible combinations
- Can split problem naturally into two halves
```

```java
// Meet in the Middle: Subset Sum for n up to 40
public class MeetInMiddle {
    public int countSubsetSums(int[] arr, int target) {
        int n = arr.length;
        int leftHalf = n / 2;
        int rightHalf = n - leftHalf;

        // Generate all possible sums for left half
        List<Long> leftSums = new ArrayList<>();
        generateSums(arr, 0, leftHalf, 0, leftSums);

        // Generate all possible sums for right half
        List<Long> rightSums = new ArrayList<>();
        generateSums(arr, leftHalf, n, 0, rightSums);

        // Sort right sums for binary search
        Collections.sort(rightSums);

        int count = 0;
        for (long leftSum : leftSums) {
            // Find how many right sums complement this left sum
            long needed = target - leftSum;
            int lower = lowerBound(rightSums, needed);
            int upper = upperBound(rightSums, needed);
            count += (upper - lower);
        }

        return count;
    }

    private void generateSums(int[] arr, int start, int end,
                              long currentSum, List<Long> sums) {
        if (start == end) {
            sums.add(currentSum);
            return;
        }
        // Don't include current element
        generateSums(arr, start + 1, end, currentSum, sums);
        // Include current element
        generateSums(arr, start + 1, end, currentSum + arr[start], sums);
    }

    private int lowerBound(List<Long> list, long target) {
        int lo = 0, hi = list.size();
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (list.get(mid) < target) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }

    private int upperBound(List<Long> list, long target) {
        int lo = 0, hi = list.size();
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (list.get(mid) <= target) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }
}
```

### Pattern 2: Sqrt Decomposition

```
CONCEPT:
Divide array into √n blocks for efficient queries.

TIME COMPLEXITY:
- Preprocessing: O(n)
- Query: O(√n)
- Update: O(1) to O(√n)

USE CASES:
- Range sum queries with updates
- Mode queries
- Range minimum queries (simpler than Segment Tree)
```

```java
public class SqrtDecomposition {
    private int[] arr;
    private int[] blockSum;
    private int blockSize;

    public SqrtDecomposition(int[] input) {
        this.arr = input.clone();
        this.blockSize = (int) Math.ceil(Math.sqrt(input.length));
        int numBlocks = (int) Math.ceil((double) input.length / blockSize);
        this.blockSum = new int[numBlocks];

        // Build block sums
        for (int i = 0; i < input.length; i++) {
            blockSum[i / blockSize] += input[i];
        }
    }

    // Range sum query [l, r]
    public int query(int l, int r) {
        int sum = 0;

        // If l and r in same block, iterate directly
        if (l / blockSize == r / blockSize) {
            for (int i = l; i <= r; i++) {
                sum += arr[i];
            }
            return sum;
        }

        // Left partial block
        int leftBlockEnd = (l / blockSize + 1) * blockSize - 1;
        for (int i = l; i <= leftBlockEnd; i++) {
            sum += arr[i];
        }

        // Full blocks in middle
        for (int block = l / blockSize + 1; block < r / blockSize; block++) {
            sum += blockSum[block];
        }

        // Right partial block
        int rightBlockStart = (r / blockSize) * blockSize;
        for (int i = rightBlockStart; i <= r; i++) {
            sum += arr[i];
        }

        return sum;
    }

    // Point update
    public void update(int index, int value) {
        int block = index / blockSize;
        blockSum[block] += (value - arr[index]);
        arr[index] = value;
    }
}
```

### Pattern 3: Mo's Algorithm

```
CONCEPT:
Offline algorithm for range queries without updates.
Sort queries cleverly to minimize array traversal.

TIME COMPLEXITY:
O((n + q) * √n) where q = number of queries

KEY INSIGHT:
Sort queries by (left / √n, right) to minimize pointer movements.
```

```java
public class MosAlgorithm {
    private int blockSize;

    // Count distinct elements in range queries
    public int[] processQueries(int[] arr, int[][] queries) {
        int n = arr.length;
        int q = queries.length;
        blockSize = (int) Math.sqrt(n);

        // Create query objects with original indices
        int[][] indexedQueries = new int[q][3];
        for (int i = 0; i < q; i++) {
            indexedQueries[i] = new int[]{queries[i][0], queries[i][1], i};
        }

        // Sort by Mo's ordering
        Arrays.sort(indexedQueries, (a, b) -> {
            int blockA = a[0] / blockSize;
            int blockB = b[0] / blockSize;
            if (blockA != blockB) return blockA - blockB;
            // Zig-zag optimization for even/odd blocks
            return (blockA % 2 == 0) ? a[1] - b[1] : b[1] - a[1];
        });

        int[] result = new int[q];
        int[] count = new int[1000001]; // Frequency array
        int distinctCount = 0;
        int currL = 0, currR = -1;

        for (int[] query : indexedQueries) {
            int l = query[0], r = query[1], idx = query[2];

            // Expand/contract right pointer
            while (currR < r) {
                currR++;
                if (count[arr[currR]]++ == 0) distinctCount++;
            }
            while (currR > r) {
                if (--count[arr[currR]] == 0) distinctCount--;
                currR--;
            }

            // Expand/contract left pointer
            while (currL < l) {
                if (--count[arr[currL]] == 0) distinctCount--;
                currL++;
            }
            while (currL > l) {
                currL--;
                if (count[arr[currL]]++ == 0) distinctCount++;
            }

            result[idx] = distinctCount;
        }

        return result;
    }
}
```

### Pattern 4: Heavy-Light Decomposition

```
CONCEPT:
Decompose tree into heavy and light paths.
Enables efficient path queries on trees.

TIME COMPLEXITY:
- Preprocessing: O(n)
- Path Query: O(log²n) with Segment Tree
- Path Update: O(log²n)

KEY INSIGHT:
Any path from leaf to root crosses at most log(n) light edges.
```

```java
public class HeavyLightDecomposition {
    private List<List<Integer>> adj;
    private int[] parent, depth, heavy, head, pos;
    private int[] segTree;
    private int n, currPos;

    public HeavyLightDecomposition(int n) {
        this.n = n;
        adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        parent = new int[n];
        depth = new int[n];
        heavy = new int[n];
        head = new int[n];
        pos = new int[n];
        segTree = new int[4 * n];
        Arrays.fill(heavy, -1);
    }

    public void addEdge(int u, int v) {
        adj.get(u).add(v);
        adj.get(v).add(u);
    }

    // DFS to find heavy children
    private int dfs(int v, int p, int d) {
        parent[v] = p;
        depth[v] = d;
        int size = 1;
        int maxChildSize = 0;

        for (int u : adj.get(v)) {
            if (u != p) {
                int childSize = dfs(u, v, d + 1);
                size += childSize;
                if (childSize > maxChildSize) {
                    maxChildSize = childSize;
                    heavy[v] = u;
                }
            }
        }
        return size;
    }

    // Decompose into chains
    private void decompose(int v, int h) {
        head[v] = h;
        pos[v] = currPos++;

        if (heavy[v] != -1) {
            decompose(heavy[v], h);  // Continue heavy path
        }

        for (int u : adj.get(v)) {
            if (u != parent[v] && u != heavy[v]) {
                decompose(u, u);  // Start new chain
            }
        }
    }

    // Query maximum on path from u to v
    public int pathQuery(int u, int v) {
        int result = Integer.MIN_VALUE;

        while (head[u] != head[v]) {
            if (depth[head[u]] < depth[head[v]]) {
                int temp = u; u = v; v = temp;
            }
            result = Math.max(result, segQuery(1, 0, n - 1, pos[head[u]], pos[u]));
            u = parent[head[u]];
        }

        if (depth[u] > depth[v]) {
            int temp = u; u = v; v = temp;
        }
        return Math.max(result, segQuery(1, 0, n - 1, pos[u], pos[v]));
    }

    private int segQuery(int node, int start, int end, int l, int r) {
        if (r < start || l > end) return Integer.MIN_VALUE;
        if (l <= start && end <= r) return segTree[node];
        int mid = (start + end) / 2;
        return Math.max(
            segQuery(2 * node, start, mid, l, r),
            segQuery(2 * node + 1, mid + 1, end, l, r)
        );
    }
}
```

---

## PART 13: String Algorithms Deep Dive

### Manacher's Algorithm (Longest Palindromic Substring)

```
CONCEPT:
Find longest palindromic substring in O(n).
Uses previously computed palindromes to skip comparisons.

KEY INSIGHT:
If we're at position i and we know a palindrome centered at c
extends to right boundary r, we can use mirror position.
```

```java
public class ManacherAlgorithm {
    public String longestPalindrome(String s) {
        // Transform: "abc" → "^#a#b#c#$"
        StringBuilder sb = new StringBuilder("^#");
        for (char c : s.toCharArray()) {
            sb.append(c).append('#');
        }
        sb.append('$');
        String T = sb.toString();
        int n = T.length();

        int[] P = new int[n];  // P[i] = radius of palindrome centered at i
        int C = 0, R = 0;      // Center and right boundary

        for (int i = 1; i < n - 1; i++) {
            int mirror = 2 * C - i;

            if (i < R) {
                P[i] = Math.min(R - i, P[mirror]);
            }

            // Expand around center i
            while (T.charAt(i + P[i] + 1) == T.charAt(i - P[i] - 1)) {
                P[i]++;
            }

            // Update center and right boundary
            if (i + P[i] > R) {
                C = i;
                R = i + P[i];
            }
        }

        // Find maximum
        int maxLen = 0, centerIdx = 0;
        for (int i = 1; i < n - 1; i++) {
            if (P[i] > maxLen) {
                maxLen = P[i];
                centerIdx = i;
            }
        }

        int start = (centerIdx - maxLen) / 2;
        return s.substring(start, start + maxLen);
    }
}
```

### Z-Algorithm (Pattern Matching)

```
CONCEPT:
Z[i] = length of longest substring starting at i
that matches a prefix of the string.

TIME: O(n + m) for pattern matching
SPACE: O(n + m)

USE CASES:
- Pattern matching
- Finding periods in string
- Longest common prefix queries
```

```java
public class ZAlgorithm {
    public int[] calculateZ(String s) {
        int n = s.length();
        int[] Z = new int[n];
        int L = 0, R = 0;

        for (int i = 1; i < n; i++) {
            if (i < R) {
                Z[i] = Math.min(R - i, Z[i - L]);
            }

            // Try to extend
            while (i + Z[i] < n && s.charAt(Z[i]) == s.charAt(i + Z[i])) {
                Z[i]++;
            }

            // Update window
            if (i + Z[i] > R) {
                L = i;
                R = i + Z[i];
            }
        }

        return Z;
    }

    // Find all occurrences of pattern in text
    public List<Integer> findPattern(String text, String pattern) {
        String combined = pattern + "$" + text;
        int[] Z = calculateZ(combined);

        List<Integer> matches = new ArrayList<>();
        int patLen = pattern.length();

        for (int i = patLen + 1; i < combined.length(); i++) {
            if (Z[i] == patLen) {
                matches.add(i - patLen - 1);
            }
        }

        return matches;
    }
}
```

### Suffix Array (Memory-Efficient Alternative to Suffix Tree)

```
CONCEPT:
Array of starting positions of all suffixes, sorted lexicographically.
Much more memory-efficient than Suffix Tree.

TIME: O(n log n) construction, O(m log n) search
SPACE: O(n)
```

```java
public class SuffixArray {
    private String text;
    private int[] sa;      // Suffix array
    private int[] lcp;     // LCP array

    public SuffixArray(String text) {
        this.text = text;
        int n = text.length();

        // Build suffix array using prefix doubling
        Integer[] order = new Integer[n];
        int[] rank = new int[n];
        int[] tmp = new int[n];

        // Initialize with character ranks
        for (int i = 0; i < n; i++) {
            order[i] = i;
            rank[i] = text.charAt(i);
        }

        for (int k = 1; k < n; k *= 2) {
            final int[] r = rank;
            final int kk = k;

            // Sort by (rank[i], rank[i+k])
            Arrays.sort(order, (a, b) -> {
                if (r[a] != r[b]) return r[a] - r[b];
                int ra = a + kk < n ? r[a + kk] : -1;
                int rb = b + kk < n ? r[b + kk] : -1;
                return ra - rb;
            });

            // Update ranks
            tmp[order[0]] = 0;
            for (int i = 1; i < n; i++) {
                int prev = order[i - 1], curr = order[i];
                boolean same = r[prev] == r[curr] &&
                    (prev + kk < n ? r[prev + kk] : -1) ==
                    (curr + kk < n ? r[curr + kk] : -1);
                tmp[curr] = tmp[prev] + (same ? 0 : 1);
            }
            rank = tmp.clone();
        }

        this.sa = new int[n];
        for (int i = 0; i < n; i++) {
            sa[i] = order[i];
        }

        buildLCP();
    }

    // Kasai's algorithm for LCP array
    private void buildLCP() {
        int n = text.length();
        lcp = new int[n];
        int[] rank = new int[n];

        for (int i = 0; i < n; i++) {
            rank[sa[i]] = i;
        }

        int k = 0;
        for (int i = 0; i < n; i++) {
            if (rank[i] == 0) {
                k = 0;
                continue;
            }

            int j = sa[rank[i] - 1];
            while (i + k < n && j + k < n &&
                   text.charAt(i + k) == text.charAt(j + k)) {
                k++;
            }

            lcp[rank[i]] = k;
            if (k > 0) k--;
        }
    }

    // Count distinct substrings
    public long countDistinctSubstrings() {
        int n = text.length();
        long total = (long) n * (n + 1) / 2;
        long duplicates = 0;
        for (int i = 1; i < n; i++) {
            duplicates += lcp[i];
        }
        return total - duplicates;
    }
}
```

---

## PART 14: Graph Algorithm Masterclass

### Tarjan's Algorithm (Strongly Connected Components)

```
CONCEPT:
Find all SCCs in directed graph using single DFS.
Uses discovery time and low-link values.

TIME: O(V + E)
SPACE: O(V)

USE CASES:
- 2-SAT problem
- Dead code elimination in compilers
- Social network analysis
```

```java
public class TarjanSCC {
    private List<List<Integer>> adj;
    private int[] ids, low;
    private boolean[] onStack;
    private Deque<Integer> stack;
    private int id, sccCount;
    private List<List<Integer>> sccs;

    public List<List<Integer>> findSCCs(int n, List<List<Integer>> graph) {
        adj = graph;
        ids = new int[n];
        low = new int[n];
        onStack = new boolean[n];
        stack = new ArrayDeque<>();
        sccs = new ArrayList<>();
        Arrays.fill(ids, -1);

        for (int i = 0; i < n; i++) {
            if (ids[i] == -1) {
                dfs(i);
            }
        }

        return sccs;
    }

    private void dfs(int at) {
        ids[at] = low[at] = id++;
        stack.push(at);
        onStack[at] = true;

        for (int to : adj.get(at)) {
            if (ids[to] == -1) {
                dfs(to);
                low[at] = Math.min(low[at], low[to]);
            } else if (onStack[to]) {
                low[at] = Math.min(low[at], ids[to]);
            }
        }

        // If this is root of SCC
        if (ids[at] == low[at]) {
            List<Integer> scc = new ArrayList<>();
            while (true) {
                int node = stack.pop();
                onStack[node] = false;
                scc.add(node);
                if (node == at) break;
            }
            sccs.add(scc);
            sccCount++;
        }
    }
}
```

### Kosaraju's Algorithm (Alternative SCC Algorithm)

```java
public class KosarajuSCC {
    public List<List<Integer>> findSCCs(int n, List<List<Integer>> graph) {
        // Step 1: Fill stack with finish order
        boolean[] visited = new boolean[n];
        Deque<Integer> stack = new ArrayDeque<>();

        for (int i = 0; i < n; i++) {
            if (!visited[i]) {
                fillOrder(i, graph, visited, stack);
            }
        }

        // Step 2: Create transpose graph
        List<List<Integer>> transpose = new ArrayList<>();
        for (int i = 0; i < n; i++) transpose.add(new ArrayList<>());
        for (int u = 0; u < n; u++) {
            for (int v : graph.get(u)) {
                transpose.get(v).add(u);
            }
        }

        // Step 3: Process vertices in stack order
        Arrays.fill(visited, false);
        List<List<Integer>> sccs = new ArrayList<>();

        while (!stack.isEmpty()) {
            int v = stack.pop();
            if (!visited[v]) {
                List<Integer> scc = new ArrayList<>();
                dfs(v, transpose, visited, scc);
                sccs.add(scc);
            }
        }

        return sccs;
    }

    private void fillOrder(int v, List<List<Integer>> graph,
                           boolean[] visited, Deque<Integer> stack) {
        visited[v] = true;
        for (int u : graph.get(v)) {
            if (!visited[u]) {
                fillOrder(u, graph, visited, stack);
            }
        }
        stack.push(v);
    }

    private void dfs(int v, List<List<Integer>> graph,
                     boolean[] visited, List<Integer> scc) {
        visited[v] = true;
        scc.add(v);
        for (int u : graph.get(v)) {
            if (!visited[u]) {
                dfs(u, graph, visited, scc);
            }
        }
    }
}
```

### 2-SAT Problem

```
CONCEPT:
Determine if boolean formula in CNF with 2 literals per clause is satisfiable.

KEY INSIGHT:
x OR y equivalent to (¬x → y) AND (¬y → x)
Build implication graph, find SCCs.
If x and ¬x in same SCC → unsatisfiable.
```

```java
public class TwoSAT {
    private int n;  // Number of variables
    private List<List<Integer>> adj, radj;

    public TwoSAT(int n) {
        this.n = n;
        adj = new ArrayList<>();
        radj = new ArrayList<>();
        for (int i = 0; i < 2 * n; i++) {
            adj.add(new ArrayList<>());
            radj.add(new ArrayList<>());
        }
    }

    // Add clause: (a OR b)
    // a, b are literals: positive for x_i, negative for NOT x_i
    public void addClause(int a, int b) {
        // (a OR b) equivalent to (NOT a → b) AND (NOT b → a)
        int notA = negate(a);
        int notB = negate(b);

        adj.get(notA).add(b);
        adj.get(notB).add(a);
        radj.get(b).add(notA);
        radj.get(a).add(notB);
    }

    private int negate(int x) {
        if (x >= 0) return x + n;  // x becomes NOT x
        return -x - 1;              // NOT x becomes x
    }

    private int toIndex(int x) {
        return x >= 0 ? x : n - x - 1;
    }

    public boolean[] solve() {
        // Use Kosaraju to find SCCs
        int[] sccId = new int[2 * n];
        Arrays.fill(sccId, -1);
        Deque<Integer> order = new ArrayDeque<>();
        boolean[] visited = new boolean[2 * n];

        // First DFS
        for (int i = 0; i < 2 * n; i++) {
            if (!visited[i]) {
                dfs1(i, visited, order);
            }
        }

        // Second DFS on reverse graph
        int sccCount = 0;
        while (!order.isEmpty()) {
            int v = order.pop();
            if (sccId[v] == -1) {
                dfs2(v, sccCount++, sccId);
            }
        }

        // Check satisfiability and extract solution
        boolean[] result = new boolean[n];
        for (int i = 0; i < n; i++) {
            if (sccId[i] == sccId[i + n]) {
                return null;  // Unsatisfiable
            }
            result[i] = sccId[i] > sccId[i + n];
        }

        return result;
    }

    private void dfs1(int v, boolean[] visited, Deque<Integer> order) {
        visited[v] = true;
        for (int u : adj.get(v)) {
            if (!visited[u]) {
                dfs1(u, visited, order);
            }
        }
        order.push(v);
    }

    private void dfs2(int v, int scc, int[] sccId) {
        sccId[v] = scc;
        for (int u : radj.get(v)) {
            if (sccId[u] == -1) {
                dfs2(u, scc, sccId);
            }
        }
    }
}
```

---

## PART 15: Competitive Programming Tricks

### Fast I/O

```java
import java.io.*;
import java.util.*;

public class FastIO {
    static BufferedReader br = new BufferedReader(
        new InputStreamReader(System.in));
    static PrintWriter out = new PrintWriter(
        new BufferedOutputStream(System.out));
    static StringTokenizer st;

    static String next() throws IOException {
        while (st == null || !st.hasMoreTokens())
            st = new StringTokenizer(br.readLine());
        return st.nextToken();
    }

    static int nextInt() throws IOException {
        return Integer.parseInt(next());
    }

    static long nextLong() throws IOException {
        return Long.parseLong(next());
    }

    static double nextDouble() throws IOException {
        return Double.parseDouble(next());
    }

    public static void main(String[] args) throws IOException {
        int n = nextInt();
        int[] arr = new int[n];
        for (int i = 0; i < n; i++) {
            arr[i] = nextInt();
        }

        // Process...

        out.println("Result");
        out.flush();
    }
}
```

### Modular Arithmetic Utilities

```java
public class ModUtils {
    static final long MOD = 1_000_000_007;

    // Modular exponentiation
    static long power(long base, long exp, long mod) {
        long result = 1;
        base %= mod;
        while (exp > 0) {
            if ((exp & 1) == 1) {
                result = (result * base) % mod;
            }
            base = (base * base) % mod;
            exp >>= 1;
        }
        return result;
    }

    // Modular inverse using Fermat's little theorem
    static long modInverse(long a, long mod) {
        return power(a, mod - 2, mod);
    }

    // nCr mod p
    static long nCr(int n, int r, long[] fact, long[] invFact) {
        if (r > n || r < 0) return 0;
        return (fact[n] * invFact[r] % MOD) * invFact[n - r] % MOD;
    }

    // Precompute factorials
    static void precomputeFactorials(int maxN, long[] fact, long[] invFact) {
        fact[0] = 1;
        for (int i = 1; i <= maxN; i++) {
            fact[i] = fact[i - 1] * i % MOD;
        }
        invFact[maxN] = modInverse(fact[maxN], MOD);
        for (int i = maxN - 1; i >= 0; i--) {
            invFact[i] = invFact[i + 1] * (i + 1) % MOD;
        }
    }

    // Lucas theorem for large n, r with small prime p
    static long lucasnCr(long n, long r, int p) {
        if (r == 0) return 1;
        return (lucasnCr(n / p, r / p, p) *
                smallnCr((int)(n % p), (int)(r % p), p)) % p;
    }

    static long smallnCr(int n, int r, int p) {
        if (r > n) return 0;
        long num = 1, den = 1;
        for (int i = 0; i < r; i++) {
            num = num * (n - i) % p;
            den = den * (i + 1) % p;
        }
        return num * power(den, p - 2, p) % p;
    }
}
```

### Coordinate Compression

```java
public class CoordinateCompression {
    public static int[] compress(int[] arr) {
        // Get unique sorted values
        Set<Integer> set = new TreeSet<>();
        for (int x : arr) set.add(x);

        // Create mapping
        Map<Integer, Integer> map = new HashMap<>();
        int idx = 0;
        for (int x : set) {
            map.put(x, idx++);
        }

        // Compress
        int[] compressed = new int[arr.length];
        for (int i = 0; i < arr.length; i++) {
            compressed[i] = map.get(arr[i]);
        }

        return compressed;
    }

    // Example: Range queries with large values
    // Original: [1000000, 1, 999999]
    // Compressed: [2, 0, 1]
}
```

### Bit Manipulation Tricks

```java
public class BitTricks {
    // Count set bits (Brian Kernighan)
    static int countBits(int n) {
        int count = 0;
        while (n != 0) {
            n &= (n - 1);
            count++;
        }
        return count;
    }

    // Check if power of 2
    static boolean isPowerOf2(int n) {
        return n > 0 && (n & (n - 1)) == 0;
    }

    // Get lowest set bit
    static int lowestSetBit(int n) {
        return n & (-n);
    }

    // Turn off lowest set bit
    static int turnOffLowest(int n) {
        return n & (n - 1);
    }

    // Check if i-th bit is set
    static boolean isBitSet(int n, int i) {
        return (n & (1 << i)) != 0;
    }

    // Set i-th bit
    static int setBit(int n, int i) {
        return n | (1 << i);
    }

    // Clear i-th bit
    static int clearBit(int n, int i) {
        return n & ~(1 << i);
    }

    // Toggle i-th bit
    static int toggleBit(int n, int i) {
        return n ^ (1 << i);
    }

    // Get highest set bit position
    static int highestSetBitPos(int n) {
        return 31 - Integer.numberOfLeadingZeros(n);
    }

    // Next permutation with same number of bits
    static int nextPermutation(int n) {
        int t = n | (n - 1);
        return (t + 1) | (((~t & -~t) - 1) >> (Integer.numberOfTrailingZeros(n) + 1));
    }

    // Iterate through all subsets of a bitmask
    static void iterateSubsets(int mask) {
        for (int subset = mask; subset > 0; subset = (subset - 1) & mask) {
            // Process subset
            System.out.println(Integer.toBinaryString(subset));
        }
    }
}
```

---

## PART 16: Algorithm Complexity Analysis Deep Dive

### Master Theorem Reference

```
MASTER THEOREM:
For T(n) = aT(n/b) + f(n) where a ≥ 1, b > 1

Case 1: f(n) = O(n^(log_b(a) - ε)) for some ε > 0
        → T(n) = Θ(n^(log_b(a)))

Case 2: f(n) = Θ(n^(log_b(a)) * log^k(n))
        → T(n) = Θ(n^(log_b(a)) * log^(k+1)(n))

Case 3: f(n) = Ω(n^(log_b(a) + ε)) for some ε > 0
        AND af(n/b) ≤ cf(n) for some c < 1
        → T(n) = Θ(f(n))

EXAMPLES:
┌───────────────────────────────────┬─────────────────┐
│ Recurrence                        │ Solution        │
├───────────────────────────────────┼─────────────────┤
│ T(n) = 2T(n/2) + n                │ O(n log n)      │
│ T(n) = 2T(n/2) + 1                │ O(n)            │
│ T(n) = 2T(n/2) + n²               │ O(n²)           │
│ T(n) = T(n/2) + 1                 │ O(log n)        │
│ T(n) = T(n/2) + n                 │ O(n)            │
│ T(n) = 4T(n/2) + n                │ O(n²)           │
│ T(n) = 4T(n/2) + n²               │ O(n² log n)     │
│ T(n) = 3T(n/2) + n                │ O(n^1.585)      │
│ T(n) = T(n-1) + n                 │ O(n²)           │
│ T(n) = T(n-1) + 1                 │ O(n)            │
│ T(n) = 2T(n-1) + 1                │ O(2^n)          │
└───────────────────────────────────┴─────────────────┘
```

### Amortized Analysis

```
AGGREGATE METHOD:
Sum all operations, divide by n.

ACCOUNTING METHOD:
Assign amortized cost to each operation.
Some pay more (save credit), some use saved credit.

POTENTIAL METHOD:
Define potential function Φ.
Amortized cost = actual cost + ΔΦ

EXAMPLE: Dynamic Array (ArrayList)
- Push when full: copy all elements + add new = O(n)
- Push when not full: add new = O(1)

Amortized Analysis:
- n pushes: 1 + 2 + 4 + 8 + ... + n copies
- Total copies ≈ 2n
- Amortized per push = O(1)

PROOF (Accounting Method):
- Charge 3 for each push
- 1 to insert current element
- 1 to move current element when array doubles
- 1 to move an element that was there before doubling
```

---

## PART 17: LeetCode Problem Categories Reference

```
BINARY SEARCH VARIATIONS:
┌─────────────────────────────────────────┬───────────────┐
│ Problem Type                            │ LeetCode      │
├─────────────────────────────────────────┼───────────────┤
│ Classic Binary Search                   │ 704           │
│ Search Insert Position                  │ 35            │
│ First/Last Position                     │ 34            │
│ Search in Rotated Array                 │ 33, 81        │
│ Find Minimum in Rotated Array           │ 153, 154      │
│ Search 2D Matrix                        │ 74, 240       │
│ Peak Element                            │ 162           │
│ Koko Eating Bananas (Answer BS)         │ 875           │
│ Capacity to Ship (Answer BS)            │ 1011          │
│ Split Array Largest Sum                 │ 410           │
│ Median of Two Sorted Arrays             │ 4             │
└─────────────────────────────────────────┴───────────────┘

TWO POINTERS:
┌─────────────────────────────────────────┬───────────────┐
│ Two Sum (Sorted)                        │ 167           │
│ 3Sum                                    │ 15            │
│ Container With Most Water               │ 11            │
│ Trapping Rain Water                     │ 42            │
│ Remove Duplicates                       │ 26, 80        │
│ Move Zeroes                             │ 283           │
│ Partition Labels                        │ 763           │
│ Sort Colors                             │ 75            │
│ Reverse Vowels                          │ 345           │
└─────────────────────────────────────────┴───────────────┘

SLIDING WINDOW:
┌─────────────────────────────────────────┬───────────────┐
│ Maximum Sum Subarray Size K             │ 643           │
│ Minimum Window Substring                │ 76            │
│ Longest Substring Without Repeat        │ 3             │
│ Longest Repeating Character Replacement │ 424           │
│ Permutation in String                   │ 567           │
│ Find All Anagrams                       │ 438           │
│ Minimum Size Subarray Sum               │ 209           │
│ Maximum Sliding Window                  │ 239           │
│ Fruit Into Baskets                      │ 904           │
└─────────────────────────────────────────┴───────────────┘

DYNAMIC PROGRAMMING:
┌─────────────────────────────────────────┬───────────────┐
│ Climbing Stairs                         │ 70            │
│ House Robber I, II, III                 │ 198, 213, 337 │
│ Coin Change I, II                       │ 322, 518      │
│ Longest Increasing Subsequence          │ 300           │
│ Longest Common Subsequence              │ 1143          │
│ Edit Distance                           │ 72            │
│ 0/1 Knapsack (Practice)                 │ -             │
│ Partition Equal Subset Sum              │ 416           │
│ Target Sum                              │ 494           │
│ Palindromic Substrings                  │ 647           │
│ Longest Palindromic Subsequence         │ 516           │
│ Word Break I, II                        │ 139, 140      │
│ Decode Ways                             │ 91            │
│ Unique Paths I, II                      │ 62, 63        │
│ Min Path Sum                            │ 64            │
│ Maximal Square                          │ 221           │
│ Best Time Buy Sell Stock I-IV           │ 121,122,123,188│
│ Interleaving String                     │ 97            │
│ Burst Balloons                          │ 312           │
│ Matrix Chain Multiplication             │ -             │
└─────────────────────────────────────────┴───────────────┘

GRAPH ALGORITHMS:
┌─────────────────────────────────────────┬───────────────┐
│ Number of Islands                       │ 200           │
│ Clone Graph                             │ 133           │
│ Course Schedule I, II                   │ 207, 210      │
│ Pacific Atlantic Water Flow             │ 417           │
│ Network Delay Time                      │ 743           │
│ Cheapest Flights K Stops                │ 787           │
│ Redundant Connection I, II              │ 684, 685      │
│ Graph Valid Tree                        │ 261           │
│ Number of Connected Components          │ 323           │
│ Word Ladder I, II                       │ 127, 126      │
│ Alien Dictionary                        │ 269           │
│ Minimum Spanning Tree                   │ 1584          │
│ Critical Connections                    │ 1192          │
└─────────────────────────────────────────┴───────────────┘

TREE PROBLEMS:
┌─────────────────────────────────────────┬───────────────┐
│ Traversals (In/Pre/Post/Level)          │ 94,144,145,102│
│ Maximum Depth                           │ 104           │
│ Same Tree / Subtree                     │ 100, 572      │
│ Invert Binary Tree                      │ 226           │
│ Symmetric Tree                          │ 101           │
│ Path Sum I, II, III                     │ 112, 113, 437 │
│ Lowest Common Ancestor                  │ 236, 235      │
│ Serialize/Deserialize                   │ 297           │
│ Binary Tree Maximum Path Sum            │ 124           │
│ Validate BST                            │ 98            │
│ Kth Smallest in BST                     │ 230           │
│ BST Iterator                            │ 173           │
│ Construct from Traversals               │ 105, 106      │
│ Diameter of Binary Tree                 │ 543           │
│ Count Complete Tree Nodes               │ 222           │
└─────────────────────────────────────────┴───────────────┘

HEAP / PRIORITY QUEUE:
┌─────────────────────────────────────────┬───────────────┐
│ Kth Largest Element                     │ 215           │
│ Top K Frequent Elements                 │ 347           │
│ Merge K Sorted Lists                    │ 23            │
│ Find Median from Data Stream            │ 295           │
│ Task Scheduler                          │ 621           │
│ Reorganize String                       │ 767           │
│ Meeting Rooms II                        │ 253           │
│ K Closest Points                        │ 973           │
│ Sliding Window Maximum                  │ 239           │
└─────────────────────────────────────────┴───────────────┘

BACKTRACKING:
┌─────────────────────────────────────────┬───────────────┐
│ Subsets I, II                           │ 78, 90        │
│ Permutations I, II                      │ 46, 47        │
│ Combinations                            │ 77            │
│ Combination Sum I, II, III              │ 39, 40, 216   │
│ Letter Combinations Phone               │ 17            │
│ Generate Parentheses                    │ 22            │
│ Palindrome Partitioning                 │ 131           │
│ N-Queens                                │ 51            │
│ Sudoku Solver                           │ 37            │
│ Word Search I, II                       │ 79, 212       │
└─────────────────────────────────────────┴───────────────┘
```

---

## PART 18: Essential Templates for Competitive Programming

### Union-Find with Path Compression & Union by Rank

```java
public class UnionFind {
    private int[] parent, rank;
    private int components;

    public UnionFind(int n) {
        parent = new int[n];
        rank = new int[n];
        components = n;
        for (int i = 0; i < n; i++) {
            parent[i] = i;
        }
    }

    public int find(int x) {
        if (parent[x] != x) {
            parent[x] = find(parent[x]); // Path compression
        }
        return parent[x];
    }

    public boolean union(int x, int y) {
        int px = find(x), py = find(y);
        if (px == py) return false;

        if (rank[px] < rank[py]) {
            parent[px] = py;
        } else if (rank[px] > rank[py]) {
            parent[py] = px;
        } else {
            parent[py] = px;
            rank[px]++;
        }
        components--;
        return true;
    }

    public boolean connected(int x, int y) {
        return find(x) == find(y);
    }

    public int getComponents() {
        return components;
    }
}
```

### Segment Tree with Lazy Propagation

```java
public class SegmentTreeLazy {
    private long[] tree, lazy;
    private int n;

    public SegmentTreeLazy(int[] arr) {
        this.n = arr.length;
        tree = new long[4 * n];
        lazy = new long[4 * n];
        build(arr, 1, 0, n - 1);
    }

    private void build(int[] arr, int node, int start, int end) {
        if (start == end) {
            tree[node] = arr[start];
        } else {
            int mid = (start + end) / 2;
            build(arr, 2 * node, start, mid);
            build(arr, 2 * node + 1, mid + 1, end);
            tree[node] = tree[2 * node] + tree[2 * node + 1];
        }
    }

    private void pushDown(int node, int start, int end) {
        if (lazy[node] != 0) {
            tree[node] += (end - start + 1) * lazy[node];
            if (start != end) {
                lazy[2 * node] += lazy[node];
                lazy[2 * node + 1] += lazy[node];
            }
            lazy[node] = 0;
        }
    }

    public void updateRange(int l, int r, long val) {
        updateRange(1, 0, n - 1, l, r, val);
    }

    private void updateRange(int node, int start, int end, int l, int r, long val) {
        pushDown(node, start, end);
        if (r < start || l > end) return;
        if (l <= start && end <= r) {
            lazy[node] += val;
            pushDown(node, start, end);
            return;
        }
        int mid = (start + end) / 2;
        updateRange(2 * node, start, mid, l, r, val);
        updateRange(2 * node + 1, mid + 1, end, l, r, val);
        tree[node] = tree[2 * node] + tree[2 * node + 1];
    }

    public long queryRange(int l, int r) {
        return queryRange(1, 0, n - 1, l, r);
    }

    private long queryRange(int node, int start, int end, int l, int r) {
        if (r < start || l > end) return 0;
        pushDown(node, start, end);
        if (l <= start && end <= r) return tree[node];
        int mid = (start + end) / 2;
        return queryRange(2 * node, start, mid, l, r) +
               queryRange(2 * node + 1, mid + 1, end, l, r);
    }
}
```

### Binary Indexed Tree (Fenwick Tree)

```java
public class FenwickTree {
    private long[] bit;
    private int n;

    public FenwickTree(int n) {
        this.n = n;
        this.bit = new long[n + 1];
    }

    // Add delta to index i (0-indexed)
    public void update(int i, long delta) {
        for (++i; i <= n; i += i & (-i)) {
            bit[i] += delta;
        }
    }

    // Sum of [0, i] (0-indexed)
    public long query(int i) {
        long sum = 0;
        for (++i; i > 0; i -= i & (-i)) {
            sum += bit[i];
        }
        return sum;
    }

    // Sum of [l, r] (0-indexed)
    public long rangeQuery(int l, int r) {
        return query(r) - (l > 0 ? query(l - 1) : 0);
    }

    // Build from array
    public static FenwickTree build(int[] arr) {
        FenwickTree ft = new FenwickTree(arr.length);
        for (int i = 0; i < arr.length; i++) {
            ft.update(i, arr[i]);
        }
        return ft;
    }
}
```

---

_Master these algorithms to understand the foundations of computer science!_ 🎯
