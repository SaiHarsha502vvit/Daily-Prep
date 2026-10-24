# PROBLEM 13: Maximum Gap (LC 164)

> **Navigation**: [← WHY Sorting — The Foundation Every…](01_why_sorting_the_foundation_every_algorithm.md) | [Chapter overview](../20_Sorting.md)
> Page 2 of 2 in **SECTION: SORTING ALGORITHM PROBLEMS**


```
DIFFICULTY: Medium (really Hard)
PATTERN: Bucket Sort / Pigeonhole Principle

PROBLEM: Find max difference between successive elements in sorted form.
         Must be O(n) time and O(n) space.
  Input:  [3,6,9,1]  Output: 3 (sorted: [1,3,6,9], gaps: 2,3,3)

INSIGHT (Pigeonhole):
  n numbers in range [min, max]
  Average gap = (max - min) / (n - 1)
  Answer must be >= average gap
  Create n-1 buckets of size = average gap
  Track min/max in each bucket
  Answer = max(next_bucket_min - prev_bucket_max)

SOLUTION:
```

```java
public int maximumGap(int[] nums) {
    int n = nums.length;
    if (n < 2) return 0;

    int min = Integer.MAX_VALUE, max = Integer.MIN_VALUE;
    for (int num : nums) { min = Math.min(min, num); max = Math.max(max, num); }
    if (min == max) return 0;

    int bucketSize = Math.max(1, (max - min) / (n - 1));
    int bucketCount = (max - min) / bucketSize + 1;
    int[] bucketMin = new int[bucketCount];
    int[] bucketMax = new int[bucketCount];
    Arrays.fill(bucketMin, Integer.MAX_VALUE);
    Arrays.fill(bucketMax, Integer.MIN_VALUE);

    for (int num : nums) {
        int idx = (num - min) / bucketSize;
        bucketMin[idx] = Math.min(bucketMin[idx], num);
        bucketMax[idx] = Math.max(bucketMax[idx], num);
    }

    int maxGap = 0, prevMax = bucketMax[0];
    for (int i = 1; i < bucketCount; i++) {
        if (bucketMin[i] == Integer.MAX_VALUE) continue;  // Empty bucket
        maxGap = Math.max(maxGap, bucketMin[i] - prevMax);
        prevMax = bucketMax[i];
    }
    return maxGap;
}
```

```
COMPLEXITY: Time O(n) | Space O(n)
KEY INSIGHT: Max gap is BETWEEN buckets, never within a bucket.
```

---

[← WHY Sorting — The Foundation Every…](01_why_sorting_the_foundation_every_algorithm.md) | [Chapter overview](../20_Sorting.md)
