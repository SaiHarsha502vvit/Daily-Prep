# 🔄 Part 6: Quick Sort

> **Navigation**: [← Why Learn Sorting?](03_why_learn_sorting.md) | [Chapter overview](../02a_Sorting_Fundamentals.md)
> Page 4 of 4 in **Sorting Fundamentals**


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

## When Sorting Breaks

### 1. Non-Transitive Comparator → `IllegalArgumentException`

- **What breaks**: Java's `Arrays.sort()` / `Collections.sort()` use TimSort, which requires a *total order* (transitive, antisymmetric, consistent). A comparator that violates transitivity (i.e., `cmp(a,b)<0` AND `cmp(b,c)<0` BUT `cmp(a,c)>=0`) causes `IllegalArgumentException: Comparison method violates its general contract!` in Java 7+ (enabled by `-Djava.util.Arrays.useLegacyMergeSort=false`).
- **Common cause**: `return o1.score - o2.score` overflows when scores differ by more than `Integer.MAX_VALUE`. Use `Integer.compare(o1.score, o2.score)`.
- **Fix**: Always use `Integer.compare()`, `Double.compare()`, or `Comparator.comparingInt()` — never subtract.

### 2. Quicksort O(n²) on Already-Sorted Input

- **What breaks**: Naïve quicksort that always picks the last (or first) element as pivot degrades to O(n²) on sorted/reverse-sorted arrays — every partition produces one empty subarray.
- **Real incident**: Java's `Arrays.sort()` used a Bentley-McIlroy 3-way quicksort before Java 7. Pivot selection bugs caused O(n²) on pathological inputs, allowing DoS via crafted HTTP query parameters (sorted by the JVM's string sort).
- **Fix**: Java now uses DualPivotQuicksort (median-of-nine for large arrays) and TimSort for Object arrays. For custom sorts, use random pivot or median-of-three.

### 3. Stable vs Unstable Sort — Silent Ordering Bug

- **What breaks**: `Arrays.sort(int[])` is unstable (DualPivotQuicksort). If you sort an array of objects by one key and later sort by another, the relative order of ties from the first sort is NOT preserved.
- **Example**: Sort employees by department (stable), then sort by salary (unstable) → employees within the same salary band are no longer in department order.
- **Fix**: `Arrays.sort(Object[])` IS stable (TimSort). For primitives needing stable sort, box to `Integer[]` or sort indices instead.

### 4. Parallel Arrays Sort Desync

**What breaks**: Sorting `names[]` and `scores[]` as two separate arrays — after `Arrays.sort(scores)`, the name-score correspondence is destroyed.
**Fix**: Sort an array of pairs/objects; or sort an index array and apply the permutation.

---

[← Why Learn Sorting?](03_why_learn_sorting.md) | [Chapter overview](../02a_Sorting_Fundamentals.md)
