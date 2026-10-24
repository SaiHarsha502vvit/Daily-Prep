# 12.1 Interval Problems

> **Navigation**: [← Greedy Fundamentals](01_greedy_fundamentals.md) | [Chapter overview](../13_Greedy.md) | [12.2 Array Greedy →](03_array_greedy.md)
> Page 2 of 4 in **Greedy**


**Pattern:** Sort by end time. Greedily pick non-overlapping intervals.
**Key insight:** Finishing earliest leaves the most room for future activities.
**Template:** Sort by `end`, keep `lastEnd`, skip if `start < lastEnd`.

## Problem 189: Meeting Rooms

**LeetCode 252 (Premium)** 🔒

```
┌────────────────────────────────────────────────────────────────┐
│  MEETING ROOMS - Can attend all meetings?                      │
├────────────────────────────────────────────────────────────────┤
│  intervals = [[0,30], [5,10], [15,20]]                         │
│                                                                │
│  Timeline:                                                     │
│  0────────────────────────────30  Meeting 1                    │
│       5────10                      Meeting 2 (overlaps!)       │
│            15────20                Meeting 3 (overlaps!)       │
│                                                                │
│  Output: false (meetings overlap)                              │
│                                                                │
│  Constraints:                                                  │
│  - 0 <= intervals.length <= 10^4                               │
│  - intervals[i].length == 2                                    │
│  - 0 <= start < end <= 10^6                                    │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public boolean canAttendMeetings(int[][] intervals) {
    // Sort by start time
    Arrays.sort(intervals, (a, b) -> a[0] - b[0]);

    for (int i = 1; i < intervals.length; i++) {
        // If current starts before previous ends → overlap
        if (intervals[i][0] < intervals[i-1][1]) {
            return false;
        }
    }

    return true;
}
```

---

## Problem 190: Meeting Rooms II

**LeetCode 253 (Premium)** 🔒

```
┌────────────────────────────────────────────────────────────────┐
│  MEETING ROOMS II - Minimum rooms needed                       │
├────────────────────────────────────────────────────────────────┤
│  intervals = [[0,30], [5,10], [15,20]]                         │
│                                                                │
│  Room 1: |═══════════════════════════════| [0,30]              │
│  Room 2:      |════|      |═════|          [5,10], [15,20]     │
│                                                                │
│  Output: 2 rooms needed                                        │
│                                                                │
│  Approach: Track concurrent meetings using min-heap            │
│  Heap stores end times of ongoing meetings                     │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int minMeetingRooms(int[][] intervals) {
    if (intervals.length == 0) return 0;

    // Sort by start time
    Arrays.sort(intervals, (a, b) -> a[0] - b[0]);

    // Min-heap to track end times
    PriorityQueue<Integer> heap = new PriorityQueue<>();
    heap.offer(intervals[0][1]);

    for (int i = 1; i < intervals.length; i++) {
        // If earliest ending meeting ends before current starts
        if (intervals[i][0] >= heap.peek()) {
            heap.poll();  // Reuse that room
        }
        heap.offer(intervals[i][1]);  // Add current meeting's end
    }

    return heap.size();
}
```

---

## Problem 191: Non-overlapping Intervals

**LeetCode 435** 🔗 https://leetcode.com/problems/non-overlapping-intervals/

```
┌────────────────────────────────────────────────────────────────┐
│  NON-OVERLAPPING INTERVALS - Min removals for no overlap       │
├────────────────────────────────────────────────────────────────┤
│  intervals = [[1,2], [2,3], [3,4], [1,3]]                      │
│                                                                │
│  1──2  2──3  3──4                                              │
│  1─────3     (overlaps with both above)                        │
│                                                                │
│  Remove [1,3] → No overlaps                                    │
│  Output: 1                                                     │
│                                                                │
│  Greedy: Sort by end time, keep non-overlapping                │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int eraseOverlapIntervals(int[][] intervals) {
    if (intervals.length == 0) return 0;

    // Sort by END time (greedy choice)
    Arrays.sort(intervals, (a, b) -> a[1] - b[1]);

    int count = 0;
    int prevEnd = intervals[0][1];

    for (int i = 1; i < intervals.length; i++) {
        if (intervals[i][0] < prevEnd) {
            // Overlap: remove current (it ends later)
            count++;
        } else {
            prevEnd = intervals[i][1];
        }
    }

    return count;
}
```

---

## Problem 192: Merge Intervals

**LeetCode 56** 🔗 https://leetcode.com/problems/merge-intervals/

```
┌────────────────────────────────────────────────────────────────┐
│  MERGE INTERVALS                                               │
├────────────────────────────────────────────────────────────────┤
│  intervals = [[1,3], [2,6], [8,10], [15,18]]                   │
│                                                                │
│  1───3                                                         │
│    2─────6                                                     │
│              8──10                                             │
│                     15──18                                     │
│  └───────┘                                                     │
│  Merged: [1,6]                                                 │
│                                                                │
│  Output: [[1,6], [8,10], [15,18]]                              │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int[][] merge(int[][] intervals) {
    if (intervals.length <= 1) return intervals;

    // Sort by start time
    Arrays.sort(intervals, (a, b) -> a[0] - b[0]);

    List<int[]> result = new ArrayList<>();
    int[] current = intervals[0];
    result.add(current);

    for (int[] interval : intervals) {
        if (interval[0] <= current[1]) {
            // Overlapping: extend current
            current[1] = Math.max(current[1], interval[1]);
        } else {
            // Non-overlapping: add new interval
            current = interval;
            result.add(current);
        }
    }

    return result.toArray(new int[result.size()][]);
}
```

---

## Problem 193: Insert Interval

**LeetCode 57** 🔗 https://leetcode.com/problems/insert-interval/

```
┌────────────────────────────────────────────────────────────────┐
│  INSERT INTERVAL                                               │
├────────────────────────────────────────────────────────────────┤
│  intervals = [[1,3], [6,9]], newInterval = [2,5]               │
│                                                                │
│  1───3    6───9                                                │
│    2─────5                                                     │
│  └─────┘                                                       │
│  Merge [1,3] and [2,5] → [1,5]                                 │
│                                                                │
│  Output: [[1,5], [6,9]]                                        │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int[][] insert(int[][] intervals, int[] newInterval) {
    List<int[]> result = new ArrayList<>();
    int i = 0;

    // Add all intervals ending before newInterval starts
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

    // Add remaining intervals
    while (i < intervals.length) {
        result.add(intervals[i++]);
    }

    return result.toArray(new int[result.size()][]);
}
```

---

[← Greedy Fundamentals](01_greedy_fundamentals.md) | [Chapter overview](../13_Greedy.md) | [12.2 Array Greedy →](03_array_greedy.md)
