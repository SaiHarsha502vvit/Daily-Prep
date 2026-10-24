# The Idea

> **Navigation**: [← University Proof Corner](01_university_proof_corner.md) | [Chapter overview](../02b_Sorting_Advanced.md) | [Non-Comparison Sorting Algorithms →](03_non_comparison_sorting_algorithms.md)
> Page 2 of 6 in **Sorting Advanced**


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

## ⚖️ Part 8: Comparison Table

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

## 📌 Part 9: When to Use Which

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

## 💪 Part 10: Practice Problems

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

[← University Proof Corner](01_university_proof_corner.md) | [Chapter overview](../02b_Sorting_Advanced.md) | [Non-Comparison Sorting Algorithms →](03_non_comparison_sorting_algorithms.md)
