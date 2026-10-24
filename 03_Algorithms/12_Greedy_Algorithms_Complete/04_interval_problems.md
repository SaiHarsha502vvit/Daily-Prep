# Interval Problems <a name="intervals"></a>

> **Navigation**: [← Scheduling Problems](03_scheduling_problems.md) | [Chapter overview](../12_Greedy_Algorithms_Complete.md) | [Array Greedy Problems →](05_array_greedy_problems.md)
> Page 4 of 7 in **Greedy Algorithms Complete Guide**


## Non-overlapping Intervals (LeetCode 435)

```java
/*
Remove minimum intervals to make rest non-overlapping.
Same as: find maximum non-overlapping, subtract from total.
*/

public int eraseOverlapIntervals(int[][] intervals) {
    if (intervals.length == 0) return 0;

    // Sort by end time
    Arrays.sort(intervals, (a, b) -> a[1] - b[1]);

    int kept = 1;
    int end = intervals[0][1];

    for (int i = 1; i < intervals.length; i++) {
        if (intervals[i][0] >= end) {  // Non-overlapping
            kept++;
            end = intervals[i][1];
        }
    }
    return intervals.length - kept;
}
```

## Merge Intervals (LeetCode 56)

```java
/*
Merge all overlapping intervals.
Sort by start, merge as we go.
*/

public int[][] merge(int[][] intervals) {
    Arrays.sort(intervals, (a, b) -> a[0] - b[0]);
    List<int[]> merged = new ArrayList<>();

    for (int[] interval : intervals) {
        // If doesn't overlap with last, add new
        if (merged.isEmpty() || merged.get(merged.size()-1)[1] < interval[0]) {
            merged.add(interval);
        } else {
            // Merge by extending end
            merged.get(merged.size()-1)[1] =
                Math.max(merged.get(merged.size()-1)[1], interval[1]);
        }
    }
    return merged.toArray(new int[merged.size()][]);
}
```

## Insert Interval (LeetCode 57)

```java
/*
Insert new interval into sorted non-overlapping list.
Merge if necessary.
*/

public int[][] insert(int[][] intervals, int[] newInterval) {
    List<int[]> result = new ArrayList<>();
    int i = 0;

    // Add all before newInterval
    while (i < intervals.length && intervals[i][1] < newInterval[0]) {
        result.add(intervals[i++]);
    }

    // Merge overlapping intervals
    while (i < intervals.length && intervals[i][0] <= newInterval[1]) {
        newInterval[0] = Math.min(newInterval[0], intervals[i][0]);
        newInterval[1] = Math.max(newInterval[1], intervals[i][1]);
        i++;
    }
    result.add(newInterval);

    // Add all after
    while (i < intervals.length) {
        result.add(intervals[i++]);
    }

    return result.toArray(new int[result.size()][]);
}
```

## Interval Covering Problem

```java
/*
Given intervals and a range [0, n], find minimum intervals
to cover the entire range.
*/

public int minIntervals(int[][] intervals, int n) {
    // Sort by start time
    Arrays.sort(intervals, (a, b) -> a[0] - b[0]);

    int count = 0;
    int covered = 0;  // Current coverage end
    int i = 0;

    while (covered < n) {
        // Find interval that starts ≤ covered and extends furthest
        int maxEnd = covered;
        while (i < intervals.length && intervals[i][0] <= covered) {
            maxEnd = Math.max(maxEnd, intervals[i][1]);
            i++;
        }

        // If can't extend coverage, impossible
        if (maxEnd == covered) return -1;

        covered = maxEnd;
        count++;
    }
    return count;
}
```

---

[← Scheduling Problems](03_scheduling_problems.md) | [Chapter overview](../12_Greedy_Algorithms_Complete.md) | [Array Greedy Problems →](05_array_greedy_problems.md)
