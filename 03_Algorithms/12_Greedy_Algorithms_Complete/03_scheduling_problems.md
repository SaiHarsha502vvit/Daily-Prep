# Scheduling Problems <a name="scheduling"></a>

> **Navigation**: [← Greedy Template Code — The Skeleton](02_greedy_template_code_the_skeleton.md) | [Chapter overview](../12_Greedy_Algorithms_Complete.md) | [Interval Problems →](04_interval_problems.md)
> Page 3 of 7 in **Greedy Algorithms Complete Guide**


## Activity Selection (Maximum Non-overlapping)

```java
/*
Given activities with start/end times,
find maximum number of non-overlapping activities.

Key insight: Always pick the activity that ENDS EARLIEST
This leaves maximum room for future activities.
*/

public int maxActivities(int[][] activities) {
    // Sort by end time
    Arrays.sort(activities, (a, b) -> a[1] - b[1]);

    int count = 0;
    int lastEnd = 0;

    for (int[] activity : activities) {
        int start = activity[0], end = activity[1];
        if (start >= lastEnd) {  // Non-overlapping
            count++;
            lastEnd = end;
        }
    }
    return count;
}
```

## Visual: Why Sort by End Time?

```
Activities:
A: [1, 4]  ████
B: [3, 5]    ███
C: [0, 6]  ███████
D: [5, 7]        ███
E: [8, 9]            ██

Sorted by end time: A, B, C, D, E

Greedy picks:
A [1,4]  ✓  (first ending)
B [3,5]  ✗  (overlaps with A)
C [0,6]  ✗  (overlaps with A)
D [5,7]  ✓  (starts after A ends)
E [8,9]  ✓  (starts after D ends)

Result: 3 activities (A, D, E)
```

## Job Scheduling to Maximize Profit

```java
/*
Jobs have deadline and profit.
Each job takes 1 unit time. Maximize profit.
Schedule at latest possible time before deadline.
*/

public int maxProfit(int[][] jobs) {
    // jobs[i] = [deadline, profit]
    // Sort by profit descending
    Arrays.sort(jobs, (a, b) -> b[1] - a[1]);

    int maxDeadline = 0;
    for (int[] job : jobs) {
        maxDeadline = Math.max(maxDeadline, job[0]);
    }

    boolean[] slots = new boolean[maxDeadline + 1];
    int profit = 0;

    for (int[] job : jobs) {
        int deadline = job[0];
        // Find latest available slot before deadline
        for (int t = deadline; t > 0; t--) {
            if (!slots[t]) {
                slots[t] = true;
                profit += job[1];
                break;
            }
        }
    }
    return profit;
}
```

## Meeting Rooms II (Min Rooms Needed)

```java
/*
Given meeting intervals, find minimum rooms required.
Process as events: start = +1 room, end = -1 room
*/

public int minMeetingRooms(int[][] intervals) {
    // Create events array
    int n = intervals.length;
    int[] starts = new int[n];
    int[] ends = new int[n];

    for (int i = 0; i < n; i++) {
        starts[i] = intervals[i][0];
        ends[i] = intervals[i][1];
    }

    Arrays.sort(starts);
    Arrays.sort(ends);

    int rooms = 0, maxRooms = 0;
    int i = 0, j = 0;

    while (i < n) {
        if (starts[i] < ends[j]) {
            rooms++;  // New meeting starts
            i++;
        } else {
            rooms--;  // Meeting ends
            j++;
        }
        maxRooms = Math.max(maxRooms, rooms);
    }
    return maxRooms;
}

// Alternative using PriorityQueue
public int minMeetingRooms2(int[][] intervals) {
    Arrays.sort(intervals, (a, b) -> a[0] - b[0]);
    PriorityQueue<Integer> pq = new PriorityQueue<>();  // End times

    for (int[] interval : intervals) {
        // If room frees up before this meeting starts
        if (!pq.isEmpty() && pq.peek() <= interval[0]) {
            pq.poll();  // Reuse that room
        }
        pq.offer(interval[1]);  // Book room until end time
    }
    return pq.size();
}
```

---

[← Greedy Template Code — The Skeleton](02_greedy_template_code_the_skeleton.md) | [Chapter overview](../12_Greedy_Algorithms_Complete.md) | [Interval Problems →](04_interval_problems.md)
