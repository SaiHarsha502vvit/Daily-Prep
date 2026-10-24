# 13.4 Sorting & Searching Variations

> **Navigation**: [← 13.3 Implementation Problems](03_implementation_problems.md) | [Chapter overview](../14_Mixed_Competitive.md) | [CONGRATULATIONS! ALL SECTIONS COMPLETE! →](05_congratulations_all_sections_complete.md)
> Page 4 of 5 in **SECTION 13: HACKEREARTH & CODEFORCES MIXED PROBLEMS**


## Problem 212: Count Inversions (HackerEarth Classic)

**COUNT INVERSIONS - Pairs where i < j but arr[i] > arr[j]**

```text
arr = [2, 4, 1, 3, 5]

Inversions:
(2, 1): 2 > 1
(4, 1): 4 > 1
(4, 3): 4 > 3

Total: 3 inversions

Approach: Modified Merge Sort
During merge, count inversions when right element chosen
```

**Solution:**

```java
private int inversions = 0;

public int countInversions(int[] arr) {
    inversions = 0;
    mergeSort(arr, 0, arr.length - 1);
    return inversions;
}

private void mergeSort(int[] arr, int left, int right) {
    if (left < right) {
        int mid = left + (right - left) / 2;
        mergeSort(arr, left, mid);
        mergeSort(arr, mid + 1, right);
        merge(arr, left, mid, right);
    }
}

private void merge(int[] arr, int left, int mid, int right) {
    int[] temp = new int[right - left + 1];
    int i = left, j = mid + 1, k = 0;

    while (i <= mid && j <= right) {
        if (arr[i] <= arr[j]) {
            temp[k++] = arr[i++];
        } else {
            temp[k++] = arr[j++];
            inversions += (mid - i + 1);  // Count inversions
        }
    }

    while (i <= mid) temp[k++] = arr[i++];
    while (j <= right) temp[k++] = arr[j++];

    System.arraycopy(temp, 0, arr, left, temp.length);
}
```

---

## Problem 213: Aggressive Cows (Codeforces/SPOJ Classic)

**AGGRESSIVE COWS - Max minimum distance between cows**

```text
stalls = [1, 2, 4, 8, 9], cows = 3

Place 3 cows to maximize minimum distance

Try placing at 1, 4, 9: min distance = 3
Try placing at 1, 4, 8: min distance = 3
Try placing at 1, 8, 9: min distance = 1

Binary search on answer:
- Can we place cows with min distance = mid?

Output: 3
```

**Solution:**

```java
public int aggressiveCows(int[] stalls, int cows) {
    Arrays.sort(stalls);

    int left = 1;
    int right = stalls[stalls.length - 1] - stalls[0];
    int result = 0;

    while (left <= right) {
        int mid = left + (right - left) / 2;

        if (canPlace(stalls, cows, mid)) {
            result = mid;
            left = mid + 1;  // Try for larger distance
        } else {
            right = mid - 1;
        }
    }

    return result;
}

private boolean canPlace(int[] stalls, int cows, int minDist) {
    int count = 1;
    int lastPos = stalls[0];

    for (int i = 1; i < stalls.length; i++) {
        if (stalls[i] - lastPos >= minDist) {
            count++;
            lastPos = stalls[i];

            if (count == cows) return true;
        }
    }

    return false;
}
```

---

## 13.5 Ad-hoc & Pattern Recognition

### Problem 214: Longest Consecutive Sequence (HackerEarth)

**LONGEST CONSECUTIVE SEQUENCE**

```text
nums = [100, 4, 200, 1, 3, 2]

Sequences: [1,2,3,4], [100], [200]

Longest: [1,2,3,4] → length 4

Approach: Use HashSet
Only start counting from sequence beginning (n-1 not in set)
```

**Solution:**

```java
public int longestConsecutive(int[] nums) {
    Set<Integer> set = new HashSet<>();
    for (int num : nums) set.add(num);

    int longest = 0;

    for (int num : set) {
        // Only start from beginning of sequence
        if (!set.contains(num - 1)) {
            int current = num;
            int length = 1;

            while (set.contains(current + 1)) {
                current++;
                length++;
            }

            longest = Math.max(longest, length);
        }
    }

    return longest;
}
```

---

### Problem 215: Subarray Sum Equals K (Codeforces Style)

**SUBARRAY SUM EQUALS K - Count subarrays with sum k**

```text
nums = [1, 1, 1], k = 2

Subarrays with sum 2:
[1,1] at index 0-1
[1,1] at index 1-2

Output: 2

Prefix sum trick:
If prefix[j] - prefix[i] = k, subarray [i+1, j] has sum k
Count prefix[j] - k occurrences using HashMap
```

**Solution:**

```java
public int subarraySum(int[] nums, int k) {
    Map<Integer, Integer> prefixCount = new HashMap<>();
    prefixCount.put(0, 1);  // Empty prefix

    int sum = 0;
    int count = 0;

    for (int num : nums) {
        sum += num;

        // If (sum - k) exists, we found subarrays
        count += prefixCount.getOrDefault(sum - k, 0);

        prefixCount.merge(sum, 1, Integer::sum);
    }

    return count;
}
```

---

[← 13.3 Implementation Problems](03_implementation_problems.md) | [Chapter overview](../14_Mixed_Competitive.md) | [CONGRATULATIONS! ALL SECTIONS COMPLETE! →](05_congratulations_all_sections_complete.md)
