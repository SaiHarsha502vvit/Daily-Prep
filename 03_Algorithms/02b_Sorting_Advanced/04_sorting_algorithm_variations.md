# PART 13: Sorting Algorithm Variations

> **Navigation**: [← Non-Comparison Sorting Algorithms](03_non_comparison_sorting_algorithms.md) | [Chapter overview](../02b_Sorting_Advanced.md) | [Sorting in Practice →](05_sorting_in_practice.md)
> Page 4 of 6 in **Sorting Advanced**


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

[← Non-Comparison Sorting Algorithms](03_non_comparison_sorting_algorithms.md) | [Chapter overview](../02b_Sorting_Advanced.md) | [Sorting in Practice →](05_sorting_in_practice.md)
