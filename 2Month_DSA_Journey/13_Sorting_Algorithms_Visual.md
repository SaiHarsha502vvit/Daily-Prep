# 🔄 Sorting Algorithms: Complete Visual Guide

## From Bubble to Quick - With Tracing

---

# PART 1: WHY LEARN SORTING?

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    SORTING - COMPLETE UNDERSTANDING                          ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHAT IS SORTING?                                                             │
├──────────────────────────────────────────────────────────────────────────────┤
│ Sorting is arranging elements in a specific order (ascending/descending)    │
│ based on some comparison criteria.                                           │
│                                                                              │
│ HISTORY: Sorting algorithms are among the oldest in CS (1940s-1960s)        │
│ • Bubble Sort: Analyzed 1956                                                 │
│ • Merge Sort: John von Neumann, 1945                                        │
│ • Quick Sort: Tony Hoare, 1959                                              │
│ • Heap Sort: J.W.J. Williams, 1964                                          │
│                                                                              │
│ FUN FACT: About 25-50% of all computing time is spent on sorting!           │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHAT PROBLEM DOES SORTING SOLVE?                                             │
├──────────────────────────────────────────────────────────────────────────────┤
│ CORE PROBLEM: Unordered data is SLOW to search and process                   │
│                                                                              │
│ UNSORTED: Find element → O(n) linear search                                  │
│ SORTED:   Find element → O(log n) binary search   [1000x faster for 1M items]│
│                                                                              │
│ REAL-WORLD EXAMPLES:                                                         │
│ • Dictionary: Words sorted alphabetically → easy to find                     │
│ • Contacts: Sorted by name → quick lookup                                    │
│ • Leaderboards: Sorted by score → show rankings                              │
│ • File explorer: Sorted by name/date/size → easy browsing                    │
│ • Database indexes: Sorted for fast queries                                  │
│ • E-commerce: Sort by price/rating/relevance                                 │
│                                                                              │
│ ENABLES OTHER ALGORITHMS:                                                    │
│ • Binary Search (needs sorted data)                                          │
│ • Two Pointer techniques (often need sorted)                                 │
│ • Finding duplicates efficiently                                             │
│ • Merge operations (sorted inputs merge faster)                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHY SO MANY SORTING ALGORITHMS?                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│ Because NO SINGLE ALGORITHM IS BEST FOR ALL CASES!                           │
│                                                                              │
│ TRADEOFFS BETWEEN:                                                           │
│ • Time complexity (how fast?)                                                │
│ • Space complexity (how much extra memory?)                                  │
│ • Stability (do equal elements keep their order?)                            │
│ • Cache efficiency (memory access patterns)                                  │
│ • Parallelizability (can it use multiple CPUs?)                             │
│ • Adaptivity (does it benefit from partially sorted data?)                  │
│                                                                              │
│ EXAMPLE: Why not always use QuickSort (fastest average)?                     │
│ • O(n²) worst case (bad for security-critical code)                          │
│ • Not stable (can't use for multi-key sorting)                               │
│ • Recursive (stack overflow for very large arrays)                           │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHEN TO USE WHICH SORTING ALGORITHM?                                         │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ ┌────────────────────────────────────┬─────────────────────────────────────┐│
│ │ Situation                          │ Best Algorithm                      ││
│ ├────────────────────────────────────┼─────────────────────────────────────┤│
│ │ Small array (n < 50)               │ Insertion Sort                      ││
│ │ Nearly sorted data                 │ Insertion Sort (O(n))               ││
│ │ General purpose, average case      │ Quick Sort                          ││
│ │ Guaranteed O(n log n)              │ Merge Sort or Heap Sort             ││
│ │ Need stability                     │ Merge Sort                          ││
│ │ Limited memory                     │ Heap Sort (in-place)                ││
│ │ Linked list data                   │ Merge Sort (no random access)       ││
│ │ Integers in small range            │ Counting Sort (O(n+k))              ││
│ │ Sorting by digits/characters       │ Radix Sort                          ││
│ │ Uniformly distributed data         │ Bucket Sort                         ││
│ │ External sorting (disk)            │ Merge Sort                          ││
│ │ Parallel processing                │ Merge Sort (easily parallelizable)  ││
│ └────────────────────────────────────┴─────────────────────────────────────┘│
│                                                                              │
│ JAVA'S CHOICE: Arrays.sort() uses:                                           │
│ • Dual-Pivot Quick Sort for primitives (fast)                                │
│ • TimSort for objects (stable merge+insertion hybrid)                        │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ DIFFICULTIES & COMMON MISTAKES                                               │
├──────────────────────────────────────────────────────────────────────────────┤
│ 1. CONFUSING STABLE VS UNSTABLE:                                             │
│    Stable: Equal elements keep original relative order                       │
│    [3a, 1, 3b] → [1, 3a, 3b] (stable) vs [1, 3b, 3a] (unstable)            │
│    Matters when sorting by multiple keys!                                    │
│                                                                              │
│ 2. OFF-BY-ONE ERRORS IN LOOPS:                                               │
│    for (i = 0; i < n - 1; i++)  ← Not i < n for bubble sort!               │
│                                                                              │
│ 3. WRONG PIVOT SELECTION (QuickSort):                                        │
│    Always first element + sorted input = O(n²) disaster                      │
│    Solution: Median-of-three or random pivot                                 │
│                                                                              │
│ 4. FORGETTING EDGE CASES:                                                    │
│    Empty array, single element, all same elements                            │
│                                                                              │
│ 5. STACK OVERFLOW (recursive sorts):                                         │
│    Very large arrays can crash recursive implementations                     │
│    Solution: Use iterative version or tail recursion                         │
│                                                                              │
│ 6. MODIFYING DURING ITERATION:                                               │
│    Changing indices incorrectly during swaps                                 │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ COMPLEXITY COMPARISON TABLE                                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ ┌─────────────────┬───────────┬───────────┬───────────┬───────┬───────────┐│
│ │ Algorithm       │ Best      │ Average   │ Worst     │ Space │ Stable?   ││
│ ├─────────────────┼───────────┼───────────┼───────────┼───────┼───────────┤│
│ │ Bubble Sort     │ O(n)      │ O(n²)     │ O(n²)     │ O(1)  │ Yes       ││
│ │ Selection Sort  │ O(n²)     │ O(n²)     │ O(n²)     │ O(1)  │ No        ││
│ │ Insertion Sort  │ O(n)      │ O(n²)     │ O(n²)     │ O(1)  │ Yes       ││
│ │ Merge Sort      │ O(n log n)│ O(n log n)│ O(n log n)│ O(n)  │ Yes       ││
│ │ Quick Sort      │ O(n log n)│ O(n log n)│ O(n²)     │ O(log n)│ No      ││
│ │ Heap Sort       │ O(n log n)│ O(n log n)│ O(n log n)│ O(1)  │ No        ││
│ │ Counting Sort   │ O(n+k)    │ O(n+k)    │ O(n+k)    │ O(k)  │ Yes       ││
│ │ Radix Sort      │ O(nk)     │ O(nk)     │ O(nk)     │ O(n+k)│ Yes       ││
│ │ Bucket Sort     │ O(n+k)    │ O(n+k)    │ O(n²)     │ O(n)  │ Yes       ││
│ │ Tim Sort        │ O(n)      │ O(n log n)│ O(n log n)│ O(n)  │ Yes       ││
│ └─────────────────┴───────────┴───────────┴───────────┴───────┴───────────┘│
│                                                                              │
│ n = number of elements, k = range of input (for counting/radix)             │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

# PART 2: BUBBLE SORT

## The Idea

```
Repeatedly "bubble" the largest element to the end.
Compare adjacent pairs, swap if out of order.
Like bubbles rising to surface!

PASS 1: Largest element reaches the end
PASS 2: Second largest reaches second-to-last
... continue until sorted
```

## Visual Trace

```
Array: [5, 2, 8, 1, 9]

PASS 1:
[5, 2, 8, 1, 9]  Compare 5, 2 → Swap
[2, 5, 8, 1, 9]  Compare 5, 8 → OK
[2, 5, 8, 1, 9]  Compare 8, 1 → Swap
[2, 5, 1, 8, 9]  Compare 8, 9 → OK
[2, 5, 1, 8, 9]  End of pass 1, 9 is in place ✓

PASS 2:
[2, 5, 1, 8, 9]  Compare 2, 5 → OK
[2, 5, 1, 8, 9]  Compare 5, 1 → Swap
[2, 1, 5, 8, 9]  Compare 5, 8 → OK
[2, 1, 5, 8, 9]  End of pass 2, 8 is in place ✓

PASS 3:
[2, 1, 5, 8, 9]  Compare 2, 1 → Swap
[1, 2, 5, 8, 9]  Compare 2, 5 → OK
[1, 2, 5, 8, 9]  End of pass 3, 5 is in place ✓

PASS 4:
[1, 2, 5, 8, 9]  Compare 1, 2 → OK
[1, 2, 5, 8, 9]  SORTED! ✓
```

## Code

```java
public void bubbleSort(int[] arr) {
    int n = arr.length;

    for (int i = 0; i < n - 1; i++) {
        boolean swapped = false;  // Optimization

        // Last i elements are already in place
        for (int j = 0; j < n - 1 - i; j++) {
            if (arr[j] > arr[j + 1]) {
                // Swap
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
                swapped = true;
            }
        }

        // If no swapping in this pass, array is sorted
        if (!swapped) break;
    }
}

// TIME:  O(n²) average/worst, O(n) best (already sorted)
// SPACE: O(1) - in-place
// STABLE: Yes (equal elements maintain relative order)
```

---

# PART 3: SELECTION SORT

## The Idea

```
Select the minimum element, put it in correct position.
Find smallest → put at position 0
Find second smallest → put at position 1
... continue
```

## Visual Trace

```
Array: [5, 2, 8, 1, 9]

PASS 1: Find min in [5,2,8,1,9] → min is 1 at index 3
        Swap with position 0
        [1, 2, 8, 5, 9]

PASS 2: Find min in [2,8,5,9] → min is 2 at index 1
        Already in position, no swap needed
        [1, 2, 8, 5, 9]

PASS 3: Find min in [8,5,9] → min is 5 at index 3
        Swap with position 2
        [1, 2, 5, 8, 9]

PASS 4: Find min in [8,9] → min is 8 at index 3
        Already in position
        [1, 2, 5, 8, 9] SORTED! ✓
```

## Code

```java
public void selectionSort(int[] arr) {
    int n = arr.length;

    for (int i = 0; i < n - 1; i++) {
        // Find minimum in unsorted part
        int minIdx = i;
        for (int j = i + 1; j < n; j++) {
            if (arr[j] < arr[minIdx]) {
                minIdx = j;
            }
        }

        // Swap minimum with first unsorted position
        if (minIdx != i) {
            int temp = arr[i];
            arr[i] = arr[minIdx];
            arr[minIdx] = temp;
        }
    }
}

// TIME:  O(n²) always (even if sorted!)
// SPACE: O(1) - in-place
// STABLE: No (swapping can change relative order of equals)
```

---

# PART 4: INSERTION SORT

## The Idea

```
Build sorted array one element at a time.
Like sorting cards in your hand!
Pick each card, insert into correct position in sorted part.
```

## Visual Trace

```
Array: [5, 2, 8, 1, 9]
       ↑ sorted part starts with just first element

[5 | 2, 8, 1, 9]  Insert 2: Compare with 5, shift 5 right
[2, 5 | 8, 1, 9]  2 inserted

[2, 5 | 8, 1, 9]  Insert 8: Compare with 5, 8 > 5, stay
[2, 5, 8 | 1, 9]  8 in place

[2, 5, 8 | 1, 9]  Insert 1: Compare with 8, shift 8
                            Compare with 5, shift 5
                            Compare with 2, shift 2
[1, 2, 5, 8 | 9]  1 inserted at front

[1, 2, 5, 8 | 9]  Insert 9: Compare with 8, 9 > 8, stay
[1, 2, 5, 8, 9]   SORTED! ✓
```

## Code

```java
public void insertionSort(int[] arr) {
    int n = arr.length;

    for (int i = 1; i < n; i++) {
        int key = arr[i];  // Element to insert
        int j = i - 1;

        // Shift elements greater than key to right
        while (j >= 0 && arr[j] > key) {
            arr[j + 1] = arr[j];
            j--;
        }

        // Insert key at correct position
        arr[j + 1] = key;
    }
}

// TIME:  O(n²) average/worst, O(n) best (nearly sorted)
// SPACE: O(1) - in-place
// STABLE: Yes

// BEST FOR: Small arrays, nearly sorted arrays
```

---

# PART 5: MERGE SORT

## The Idea

```
Divide and Conquer!
1. DIVIDE: Split array in half
2. CONQUER: Recursively sort each half
3. MERGE: Combine sorted halves

Like organizing papers:
Split big pile into smaller piles,
sort each small pile,
merge them back in order.
```

## Visual Trace

```
Array: [5, 2, 8, 1]

DIVIDE:
         [5, 2, 8, 1]
           /      \
      [5, 2]      [8, 1]
       /  \        /  \
     [5]  [2]    [8]  [1]

MERGE (bottom up):
     [5]  [2]    [8]  [1]
       \  /        \  /
     [2, 5]      [1, 8]    ← Merge pairs in order
        \          /
       [1, 2, 5, 8]         ← Final merge


DETAILED MERGE of [2,5] and [1,8]:
Left:  [2, 5]  pointer at 2
Right: [1, 8]  pointer at 1
Result: []

Compare 2 and 1: 1 is smaller
Left:  [2, 5]  pointer at 2
Right: [1, 8]  pointer at 8
Result: [1]

Compare 2 and 8: 2 is smaller
Left:  [2, 5]  pointer at 5
Right: [1, 8]  pointer at 8
Result: [1, 2]

Compare 5 and 8: 5 is smaller
Left:  [2, 5]  exhausted
Right: [1, 8]  pointer at 8
Result: [1, 2, 5]

Left exhausted, copy remaining from right
Result: [1, 2, 5, 8] ✓
```

## Code

```java
public void mergeSort(int[] arr, int left, int right) {
    if (left < right) {
        int mid = left + (right - left) / 2;

        // Sort left half
        mergeSort(arr, left, mid);

        // Sort right half
        mergeSort(arr, mid + 1, right);

        // Merge sorted halves
        merge(arr, left, mid, right);
    }
}

private void merge(int[] arr, int left, int mid, int right) {
    // Create temp arrays
    int n1 = mid - left + 1;
    int n2 = right - mid;
    int[] L = new int[n1];
    int[] R = new int[n2];

    // Copy data to temp arrays
    for (int i = 0; i < n1; i++) L[i] = arr[left + i];
    for (int j = 0; j < n2; j++) R[j] = arr[mid + 1 + j];

    // Merge temp arrays back
    int i = 0, j = 0, k = left;

    while (i < n1 && j < n2) {
        if (L[i] <= R[j]) {
            arr[k++] = L[i++];
        } else {
            arr[k++] = R[j++];
        }
    }

    // Copy remaining elements
    while (i < n1) arr[k++] = L[i++];
    while (j < n2) arr[k++] = R[j++];
}

// TIME:  O(n log n) always
// SPACE: O(n) - needs temp arrays
// STABLE: Yes

// BEST FOR: Large datasets, linked lists, external sorting
```

---

# PART 6: QUICK SORT

## The Idea

```
Divide and Conquer with Pivot!
1. CHOOSE: Pick a pivot element
2. PARTITION: Put smaller elements left, larger right
3. RECURSE: Sort left and right parts

Like organizing:
Pick a "reference item",
put everything cheaper on left, expensive on right,
repeat for each side.
```

## Visual Trace

```
Array: [5, 2, 8, 1, 9, 3]

STEP 1: Choose pivot (last element) = 3
        Partition around 3

        [5, 2, 8, 1, 9, 3]

        i starts at -1, j scans array

        j=0: 5 > 3, skip
        j=1: 2 < 3, i++, swap arr[0] and arr[1]
             [2, 5, 8, 1, 9, 3]
        j=2: 8 > 3, skip
        j=3: 1 < 3, i++, swap arr[1] and arr[3]
             [2, 1, 8, 5, 9, 3]
        j=4: 9 > 3, skip

        Swap pivot with arr[i+1]
        [2, 1, 3, 5, 9, 8]
              ↑ pivot in correct position!

        Elements < 3 on left: [2, 1]
        Elements > 3 on right: [5, 9, 8]

STEP 2: Recursively sort [2, 1] and [5, 9, 8]

        [2, 1]: pivot = 1
                [1, 2] done!

        [5, 9, 8]: pivot = 8
                   [5, 8, 9] done!

FINAL: [1, 2, 3, 5, 8, 9] ✓
```

## Code

```java
public void quickSort(int[] arr, int low, int high) {
    if (low < high) {
        // Partition and get pivot position
        int pivotIdx = partition(arr, low, high);

        // Sort elements before and after pivot
        quickSort(arr, low, pivotIdx - 1);
        quickSort(arr, pivotIdx + 1, high);
    }
}

private int partition(int[] arr, int low, int high) {
    int pivot = arr[high];  // Choose last element as pivot
    int i = low - 1;        // Index of smaller element

    for (int j = low; j < high; j++) {
        if (arr[j] < pivot) {
            i++;
            // Swap arr[i] and arr[j]
            int temp = arr[i];
            arr[i] = arr[j];
            arr[j] = temp;
        }
    }

    // Swap pivot to correct position
    int temp = arr[i + 1];
    arr[i + 1] = arr[high];
    arr[high] = temp;

    return i + 1;  // Return pivot position
}

// TIME:  O(n log n) average, O(n²) worst (already sorted + bad pivot)
// SPACE: O(log n) recursion stack
// STABLE: No

// BEST FOR: General purpose, in-memory sorting
```

---

# PART 7: HEAP SORT

## The Idea

```
Use a heap (max-heap) to sort!
1. Build max-heap from array
2. Repeatedly extract max (root) and place at end
3. Heapify remaining

The heap property: parent >= children
Max element always at root!
```

## Visual Trace

```
Array: [4, 10, 3, 5, 1]

STEP 1: Build max-heap

        Original:        Heapified:
            4                10
           / \              /  \
          10  3     →      5    3
         / \              / \
        5   1            4   1

        Array: [10, 5, 3, 4, 1]

STEP 2: Extract max and heapify

        Swap 10 with 1:  [1, 5, 3, 4, 10]
        Heapify:         [5, 4, 3, 1 | 10]

        Swap 5 with 1:   [1, 4, 3, 5 | 10]
        Heapify:         [4, 1, 3 | 5, 10]

        Swap 4 with 3:   [3, 1, 4 | 5, 10]
        Heapify:         [3, 1 | 4, 5, 10]

        Swap 3 with 1:   [1, 3 | 4, 5, 10]

        Done!            [1, 3, 4, 5, 10] ✓
```

## Code

```java
public void heapSort(int[] arr) {
    int n = arr.length;

    // Build max heap
    for (int i = n / 2 - 1; i >= 0; i--) {
        heapify(arr, n, i);
    }

    // Extract elements from heap
    for (int i = n - 1; i > 0; i--) {
        // Move current root to end
        int temp = arr[0];
        arr[0] = arr[i];
        arr[i] = temp;

        // Heapify reduced heap
        heapify(arr, i, 0);
    }
}

private void heapify(int[] arr, int n, int i) {
    int largest = i;
    int left = 2 * i + 1;
    int right = 2 * i + 2;

    if (left < n && arr[left] > arr[largest]) {
        largest = left;
    }

    if (right < n && arr[right] > arr[largest]) {
        largest = right;
    }

    if (largest != i) {
        int temp = arr[i];
        arr[i] = arr[largest];
        arr[largest] = temp;

        heapify(arr, n, largest);
    }
}

// TIME:  O(n log n) always
// SPACE: O(1) - in-place
// STABLE: No

// BEST FOR: When O(n log n) guaranteed needed, limited memory
```

---

# PART 8: COMPARISON TABLE

```
┌─────────────┬──────────┬───────────┬───────────┬────────┬─────────┐
│  Algorithm  │  Best    │  Average  │  Worst    │ Space  │ Stable  │
├─────────────┼──────────┼───────────┼───────────┼────────┼─────────┤
│ Bubble      │ O(n)     │ O(n²)     │ O(n²)     │ O(1)   │ Yes     │
│ Selection   │ O(n²)    │ O(n²)     │ O(n²)     │ O(1)   │ No      │
│ Insertion   │ O(n)     │ O(n²)     │ O(n²)     │ O(1)   │ Yes     │
│ Merge       │ O(n logn)│ O(n logn) │ O(n logn) │ O(n)   │ Yes     │
│ Quick       │ O(n logn)│ O(n logn) │ O(n²)     │ O(logn)│ No      │
│ Heap        │ O(n logn)│ O(n logn) │ O(n logn) │ O(1)   │ No      │
└─────────────┴──────────┴───────────┴───────────┴────────┴─────────┘
```

---

# PART 9: WHEN TO USE WHICH

```
USE INSERTION SORT WHEN:
- Array is small (n < 50)
- Array is nearly sorted
- Need stable sort with O(1) space

USE MERGE SORT WHEN:
- Need stable sort
- Sorting linked lists
- External sorting (large files)
- Worst case must be O(n log n)

USE QUICK SORT WHEN:
- General purpose sorting
- Average case performance matters
- In-place sorting preferred

USE HEAP SORT WHEN:
- Need guaranteed O(n log n)
- Memory is very limited
- Don't need stability

USE BUILT-IN SORT:
- In interviews (unless asked to implement)
- Arrays.sort() uses dual-pivot quicksort for primitives
- Arrays.sort() uses TimSort for objects (stable)
```

---

# PART 10: PRACTICE PROBLEMS

```
EASY:
1. Sort an array (implement each algorithm)
2. Sort array by parity (even then odd)
3. Sort colors (Dutch national flag)

MEDIUM:
1. Merge sorted arrays
2. Sort list (linked list merge sort)
3. Kth largest element (quick select)
4. Meeting rooms (sort by start time)

HARD:
1. Count inversions (modified merge sort)
2. Maximum gap (bucket sort concept)
3. Median of two sorted arrays
```

---

# PART 11: Non-Comparison Sorting Algorithms

## Counting Sort

```
CONCEPT:
Count occurrences of each element.
Works only for integers in a known range.

TIME: O(n + k) where k = range of input
SPACE: O(k)
STABLE: Yes (with proper implementation)
```

```java
public int[] countingSort(int[] arr) {
    if (arr.length == 0) return arr;

    // Find range
    int min = arr[0], max = arr[0];
    for (int num : arr) {
        min = Math.min(min, num);
        max = Math.max(max, num);
    }

    int range = max - min + 1;
    int[] count = new int[range];
    int[] output = new int[arr.length];

    // Count occurrences
    for (int num : arr) {
        count[num - min]++;
    }

    // Cumulative count (for stability)
    for (int i = 1; i < range; i++) {
        count[i] += count[i - 1];
    }

    // Build output (traverse backwards for stability)
    for (int i = arr.length - 1; i >= 0; i--) {
        output[count[arr[i] - min] - 1] = arr[i];
        count[arr[i] - min]--;
    }

    return output;
}

// Visual:
// Array: [4, 2, 2, 8, 3, 3, 1]
// Count: [1, 2, 2, 1, 0, 0, 0, 1] (for values 1-8)
// Cumulative: [1, 3, 5, 6, 6, 6, 6, 7]
// Output: [1, 2, 2, 3, 3, 4, 8]
```

## Radix Sort

```
CONCEPT:
Sort by individual digits, from least significant to most significant.
Uses counting sort as a subroutine.

TIME: O(d * (n + k)) where d = number of digits, k = base
SPACE: O(n + k)
STABLE: Yes
```

```java
public void radixSort(int[] arr) {
    if (arr.length == 0) return;

    int max = Arrays.stream(arr).max().getAsInt();

    // Sort by each digit (1s, 10s, 100s, ...)
    for (int exp = 1; max / exp > 0; exp *= 10) {
        countingSortByDigit(arr, exp);
    }
}

private void countingSortByDigit(int[] arr, int exp) {
    int n = arr.length;
    int[] output = new int[n];
    int[] count = new int[10];

    // Count occurrences of each digit
    for (int num : arr) {
        int digit = (num / exp) % 10;
        count[digit]++;
    }

    // Cumulative count
    for (int i = 1; i < 10; i++) {
        count[i] += count[i - 1];
    }

    // Build output
    for (int i = n - 1; i >= 0; i--) {
        int digit = (arr[i] / exp) % 10;
        output[count[digit] - 1] = arr[i];
        count[digit]--;
    }

    System.arraycopy(output, 0, arr, 0, n);
}

// Visual:
// Array: [170, 45, 75, 90, 802, 24, 2, 66]
// By 1s: [170, 90, 802, 2, 24, 45, 75, 66]
// By 10s: [802, 2, 24, 45, 66, 170, 75, 90]
// By 100s: [2, 24, 45, 66, 75, 90, 170, 802]
```

## Bucket Sort

```
CONCEPT:
Distribute elements into buckets, sort each bucket, concatenate.
Works best when input is uniformly distributed.

TIME: O(n + k) average, O(n²) worst
SPACE: O(n + k)
STABLE: Depends on bucket sorting algorithm
```

```java
public void bucketSort(float[] arr) {
    if (arr.length == 0) return;

    int n = arr.length;
    List<List<Float>> buckets = new ArrayList<>();
    for (int i = 0; i < n; i++) {
        buckets.add(new ArrayList<>());
    }

    // Distribute elements into buckets
    for (float num : arr) {
        int bucketIndex = (int) (n * num);  // Assuming 0 <= num < 1
        buckets.get(bucketIndex).add(num);
    }

    // Sort each bucket
    for (List<Float> bucket : buckets) {
        Collections.sort(bucket);
    }

    // Concatenate buckets
    int index = 0;
    for (List<Float> bucket : buckets) {
        for (float num : bucket) {
            arr[index++] = num;
        }
    }
}

// Visual:
// Array: [0.78, 0.17, 0.39, 0.26, 0.72, 0.94, 0.21, 0.12]
// Bucket 0: [0.17, 0.12]
// Bucket 1: [0.26, 0.21]
// Bucket 2: [0.39]
// Bucket 3: []
// Bucket 4: []
// Bucket 5: []
// Bucket 6: []
// Bucket 7: [0.78, 0.72]
// Bucket 8: []
// Bucket 9: [0.94]
// After sorting buckets and concatenating:
// [0.12, 0.17, 0.21, 0.26, 0.39, 0.72, 0.78, 0.94]
```

---

# PART 12: Hybrid Sorting Algorithms

## TimSort (Java's Arrays.sort for Objects)

```
CONCEPT:
Hybrid of merge sort and insertion sort.
Finds "runs" (already sorted subsequences) and merges them.

TIME: O(n log n)
SPACE: O(n)
STABLE: Yes

KEY FEATURES:
- Best case O(n) when array is already sorted
- Optimized for real-world data that often has existing patterns
- Uses insertion sort for small runs (typically 32-64 elements)
```

```java
// Simplified TimSort concept
public void timSort(int[] arr) {
    int n = arr.length;
    int RUN = 32;  // Minimum run size

    // Sort individual runs using insertion sort
    for (int i = 0; i < n; i += RUN) {
        insertionSort(arr, i, Math.min(i + RUN - 1, n - 1));
    }

    // Merge runs
    for (int size = RUN; size < n; size *= 2) {
        for (int left = 0; left < n; left += 2 * size) {
            int mid = left + size - 1;
            int right = Math.min(left + 2 * size - 1, n - 1);

            if (mid < right) {
                merge(arr, left, mid, right);
            }
        }
    }
}

private void insertionSort(int[] arr, int left, int right) {
    for (int i = left + 1; i <= right; i++) {
        int key = arr[i];
        int j = i - 1;
        while (j >= left && arr[j] > key) {
            arr[j + 1] = arr[j];
            j--;
        }
        arr[j + 1] = key;
    }
}
```

## Introsort (C++ std::sort)

```
CONCEPT:
Starts with quicksort, switches to heapsort if recursion is too deep,
uses insertion sort for small partitions.

TIME: O(n log n) guaranteed
SPACE: O(log n)
STABLE: No
```

```java
public void introsort(int[] arr) {
    int maxDepth = 2 * (int) Math.floor(Math.log(arr.length) / Math.log(2));
    introsortHelper(arr, 0, arr.length - 1, maxDepth);
}

private void introsortHelper(int[] arr, int low, int high, int depthLimit) {
    int size = high - low + 1;

    if (size < 16) {
        // Use insertion sort for small arrays
        insertionSort(arr, low, high);
        return;
    }

    if (depthLimit == 0) {
        // Switch to heapsort to avoid O(n²) worst case
        heapSort(arr, low, high);
        return;
    }

    // Use quicksort
    int pivot = partition(arr, low, high);
    introsortHelper(arr, low, pivot - 1, depthLimit - 1);
    introsortHelper(arr, pivot + 1, high, depthLimit - 1);
}
```

---

# PART 13: Sorting Algorithm Variations

## QuickSelect (Finding Kth Element)

```java
// Find kth smallest element in O(n) average time
public int quickSelect(int[] arr, int k) {
    return quickSelect(arr, 0, arr.length - 1, k - 1);
}

private int quickSelect(int[] arr, int low, int high, int k) {
    if (low == high) return arr[low];

    int pivotIndex = partition(arr, low, high);

    if (k == pivotIndex) {
        return arr[k];
    } else if (k < pivotIndex) {
        return quickSelect(arr, low, pivotIndex - 1, k);
    } else {
        return quickSelect(arr, pivotIndex + 1, high, k);
    }
}

private int partition(int[] arr, int low, int high) {
    // Random pivot for better average case
    int randomIndex = low + (int)(Math.random() * (high - low + 1));
    swap(arr, randomIndex, high);

    int pivot = arr[high];
    int i = low - 1;

    for (int j = low; j < high; j++) {
        if (arr[j] <= pivot) {
            i++;
            swap(arr, i, j);
        }
    }

    swap(arr, i + 1, high);
    return i + 1;
}

// TIME: O(n) average, O(n²) worst
// SPACE: O(1)
```

## Count Inversions (Modified Merge Sort)

```java
// An inversion is a pair (i, j) where i < j but arr[i] > arr[j]
public long countInversions(int[] arr) {
    int[] temp = new int[arr.length];
    return mergeSort(arr, temp, 0, arr.length - 1);
}

private long mergeSort(int[] arr, int[] temp, int left, int right) {
    long invCount = 0;

    if (left < right) {
        int mid = left + (right - left) / 2;

        invCount += mergeSort(arr, temp, left, mid);
        invCount += mergeSort(arr, temp, mid + 1, right);
        invCount += merge(arr, temp, left, mid, right);
    }

    return invCount;
}

private long merge(int[] arr, int[] temp, int left, int mid, int right) {
    int i = left, j = mid + 1, k = left;
    long invCount = 0;

    while (i <= mid && j <= right) {
        if (arr[i] <= arr[j]) {
            temp[k++] = arr[i++];
        } else {
            temp[k++] = arr[j++];
            // All remaining elements in left half are greater than arr[j]
            invCount += (mid - i + 1);
        }
    }

    while (i <= mid) temp[k++] = arr[i++];
    while (j <= right) temp[k++] = arr[j++];

    System.arraycopy(temp, left, arr, left, right - left + 1);
    return invCount;
}

// Example:
// Array: [8, 4, 2, 1]
// Inversions: (8,4), (8,2), (8,1), (4,2), (4,1), (2,1) = 6
```

## Dutch National Flag (3-way Partition)

```java
// Sort array containing only 0s, 1s, and 2s in O(n)
public void sortColors(int[] nums) {
    int low = 0, mid = 0, high = nums.length - 1;

    while (mid <= high) {
        if (nums[mid] == 0) {
            swap(nums, low, mid);
            low++;
            mid++;
        } else if (nums[mid] == 1) {
            mid++;
        } else {  // nums[mid] == 2
            swap(nums, mid, high);
            high--;
            // Don't increment mid, need to check swapped element
        }
    }
}

// Visual:
// [2, 0, 2, 1, 1, 0]
//  L  M           H
// [0, 0, 2, 1, 1, 2]
//     L  M     H
// [0, 0, 1, 1, 2, 2]
//        L  M  H
// [0, 0, 1, 1, 2, 2]  Done! (M > H)
```

---

# PART 14: Sorting in Practice

## Custom Comparators in Java

```java
// Sort objects by custom criteria
class Person {
    String name;
    int age;
}

// Sort by age ascending
Arrays.sort(people, (a, b) -> a.age - b.age);

// Sort by name, then by age
Arrays.sort(people, (a, b) -> {
    int nameCompare = a.name.compareTo(b.name);
    if (nameCompare != 0) return nameCompare;
    return a.age - b.age;
});

// Using Comparator chaining
Arrays.sort(people,
    Comparator.comparing(Person::getName)
              .thenComparingInt(Person::getAge)
              .reversed());

// Sort integers as strings (lexicographic)
Integer[] nums = {3, 30, 34, 5, 9};
Arrays.sort(nums, (a, b) -> (b + "" + a).compareTo(a + "" + b));
// Result: [9, 5, 34, 3, 30] -> "9534330" (largest number)

// Partial sort: sort only part of array
Arrays.sort(arr, fromIndex, toIndex);
```

## Sorting Linked Lists

```java
// Merge sort is ideal for linked lists (O(1) space if using bottom-up)
public ListNode sortList(ListNode head) {
    if (head == null || head.next == null) return head;

    // Find middle
    ListNode slow = head, fast = head, prev = null;
    while (fast != null && fast.next != null) {
        prev = slow;
        slow = slow.next;
        fast = fast.next.next;
    }
    prev.next = null;  // Split the list

    // Sort each half
    ListNode left = sortList(head);
    ListNode right = sortList(slow);

    // Merge
    return merge(left, right);
}

private ListNode merge(ListNode l1, ListNode l2) {
    ListNode dummy = new ListNode(0);
    ListNode curr = dummy;

    while (l1 != null && l2 != null) {
        if (l1.val <= l2.val) {
            curr.next = l1;
            l1 = l1.next;
        } else {
            curr.next = l2;
            l2 = l2.next;
        }
        curr = curr.next;
    }

    curr.next = (l1 != null) ? l1 : l2;
    return dummy.next;
}
```

## External Sorting (Large Files)

```
CONCEPT:
When data doesn't fit in memory, use external merge sort.

ALGORITHM:
1. Divide file into chunks that fit in memory
2. Sort each chunk in memory, write to temp files
3. Merge sorted temp files (k-way merge)

KEY CONSIDERATIONS:
- Use BufferedReader/Writer for efficient I/O
- Minimize number of disk seeks
- Use memory-mapped files for better performance
```

```java
// Simplified k-way merge concept
public void kWayMerge(List<Scanner> sortedFiles, PrintWriter output) {
    // Min-heap to track smallest element from each file
    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] - b[0]);

    // Initialize with first element from each file
    for (int i = 0; i < sortedFiles.size(); i++) {
        if (sortedFiles.get(i).hasNextInt()) {
            pq.offer(new int[]{sortedFiles.get(i).nextInt(), i});
        }
    }

    while (!pq.isEmpty()) {
        int[] min = pq.poll();
        output.println(min[0]);

        // Add next element from same file
        if (sortedFiles.get(min[1]).hasNextInt()) {
            pq.offer(new int[]{sortedFiles.get(min[1]).nextInt(), min[1]});
        }
    }
}
```

---

# PART 15: Sorting-Based Interview Problems

## Problem 1: Merge Intervals

```java
public int[][] merge(int[][] intervals) {
    if (intervals.length <= 1) return intervals;

    // Sort by start time
    Arrays.sort(intervals, (a, b) -> a[0] - b[0]);

    List<int[]> result = new ArrayList<>();
    int[] current = intervals[0];

    for (int i = 1; i < intervals.length; i++) {
        if (intervals[i][0] <= current[1]) {
            // Overlapping, merge
            current[1] = Math.max(current[1], intervals[i][1]);
        } else {
            // Non-overlapping, add current and start new
            result.add(current);
            current = intervals[i];
        }
    }
    result.add(current);

    return result.toArray(new int[result.size()][]);
}
```

## Problem 2: Meeting Rooms II (Min Rooms Needed)

```java
public int minMeetingRooms(int[][] intervals) {
    int n = intervals.length;
    int[] starts = new int[n];
    int[] ends = new int[n];

    for (int i = 0; i < n; i++) {
        starts[i] = intervals[i][0];
        ends[i] = intervals[i][1];
    }

    Arrays.sort(starts);
    Arrays.sort(ends);

    int rooms = 0, endPtr = 0;
    for (int start : starts) {
        if (start < ends[endPtr]) {
            rooms++;
        } else {
            endPtr++;
        }
    }

    return rooms;
}
```

## Problem 3: Largest Number

```java
public String largestNumber(int[] nums) {
    String[] strs = new String[nums.length];
    for (int i = 0; i < nums.length; i++) {
        strs[i] = String.valueOf(nums[i]);
    }

    // Custom comparator: "30" vs "3" -> compare "303" vs "330"
    Arrays.sort(strs, (a, b) -> (b + a).compareTo(a + b));

    // Handle case where all zeros
    if (strs[0].equals("0")) return "0";

    StringBuilder sb = new StringBuilder();
    for (String s : strs) {
        sb.append(s);
    }

    return sb.toString();
}
```

## Problem 4: H-Index

```java
public int hIndex(int[] citations) {
    Arrays.sort(citations);
    int n = citations.length;

    for (int i = 0; i < n; i++) {
        int h = n - i;  // Papers with at least h citations
        if (citations[i] >= h) {
            return h;
        }
    }

    return 0;
}

// O(n) solution using counting sort
public int hIndexLinear(int[] citations) {
    int n = citations.length;
    int[] count = new int[n + 1];

    for (int c : citations) {
        count[Math.min(c, n)]++;
    }

    int papers = 0;
    for (int h = n; h >= 0; h--) {
        papers += count[h];
        if (papers >= h) return h;
    }

    return 0;
}
```

---

_Understanding sorting algorithms teaches you how to think about efficiency!_ 🔄
