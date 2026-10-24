# PART 11: Non-Comparison Sorting Algorithms

> **Navigation**: [← The Idea](02_the_idea.md) | [Chapter overview](../02b_Sorting_Advanced.md) | [Sorting Algorithm Variations →](04_sorting_algorithm_variations.md)
> Page 3 of 6 in **Sorting Advanced**


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

## PART 12: Hybrid Sorting Algorithms

### TimSort (Java's Arrays.sort for Objects)

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

### Introsort (C++ std::sort)

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

[← The Idea](02_the_idea.md) | [Chapter overview](../02b_Sorting_Advanced.md) | [Sorting Algorithm Variations →](04_sorting_algorithm_variations.md)
