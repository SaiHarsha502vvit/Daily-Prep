# 🔍 Pattern 7: Binary Search Variants

> **Navigation**: [← Pattern 6: Topological Sort](03_topological_sort.md) | [Chapter overview](../04_Pattern_Recognition.md)
> Page 4 of 4 in **Pattern Recognition — Pattern Guide**


## Variant 1: Find First True (Lower Bound)

```
Condition: [F, F, F, T, T, T]
Find: First index where condition is TRUE

Use: First position >= target
```

```java
public int lowerBound(int[] arr, int target) {
    int left = 0, right = arr.length;

    while (left < right) {
        int mid = left + (right - left) / 2;
        if (arr[mid] >= target) {
            right = mid;
        } else {
            left = mid + 1;
        }
    }
    return left;
}
```

## Variant 2: Find Last True (Upper Bound)

```
Condition: [T, T, T, F, F, F]
Find: Last index where condition is TRUE

Use: Last position <= target
```

```java
public int lastLessOrEqual(int[] arr, int target) {
    int left = 0, right = arr.length - 1;

    while (left < right) {
        int mid = left + (right - left + 1) / 2;  // Note: +1 to avoid infinite loop
        if (arr[mid] <= target) {
            left = mid;
        } else {
            right = mid - 1;
        }
    }
    return arr[left] <= target ? left : -1;
}
```

## Variant 3: Search in Rotated Array

```
Array: [4, 5, 6, 7, 0, 1, 2]

Key Insight: One half is always sorted!
```

```java
public int searchRotated(int[] arr, int target) {
    int left = 0, right = arr.length - 1;

    while (left <= right) {
        int mid = left + (right - left) / 2;

        if (arr[mid] == target) return mid;

        // Check which half is sorted
        if (arr[left] <= arr[mid]) {
            // Left half is sorted
            if (arr[left] <= target && target < arr[mid]) {
                right = mid - 1;
            } else {
                left = mid + 1;
            }
        } else {
            // Right half is sorted
            if (arr[mid] < target && target <= arr[right]) {
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }
    }
    return -1;
}
```

## Variant 4: Binary Search on Answer

```
Problem: Minimum capacity to ship within D days
Key: Binary search on the capacity value itself!
```

```java
public int shipWithinDays(int[] weights, int days) {
    int left = Arrays.stream(weights).max().getAsInt();
    int right = Arrays.stream(weights).sum();

    while (left < right) {
        int mid = left + (right - left) / 2;
        if (canShip(weights, days, mid)) {
            right = mid;  // Try smaller capacity
        } else {
            left = mid + 1;  // Need more capacity
        }
    }
    return left;
}

private boolean canShip(int[] weights, int days, int capacity) {
    int daysNeeded = 1, currentLoad = 0;
    for (int w : weights) {
        if (currentLoad + w > capacity) {
            daysNeeded++;
            currentLoad = 0;
        }
        currentLoad += w;
    }
    return daysNeeded <= days;
}
```

---

## 🧩 Pattern 8: Interval Problems

### Common Operations

```
1. Merge Overlapping Intervals
2. Insert Interval
3. Find Non-overlapping Intervals to Remove
4. Meeting Rooms (Conflict Detection)
```

### Key Insight: Sort by Start Time

```
Intervals: [[1,3], [2,6], [8,10], [15,18]]
After Sort: Already sorted by start

Merge Logic:
- If current.start <= prev.end: Overlap! Merge them
- Else: No overlap, add to result
```

### Template: Merge Intervals

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
            // Overlapping - extend end time
            current[1] = Math.max(current[1], interval[1]);
        } else {
            // Non-overlapping - add new interval
            current = interval;
            result.add(current);
        }
    }

    return result.toArray(new int[result.size()][]);
}
```

### Template: Meeting Rooms II (Min Rooms Needed)

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

    int rooms = 0, maxRooms = 0;
    int i = 0, j = 0;  // Pointers for starts and ends

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
```

---

## 🕸️ Pattern 9: Graph Algorithms

### Dijkstra's Algorithm (Shortest Path with Weights)

```java
public int[] dijkstra(int n, List<int[]>[] adj, int source) {
    int[] dist = new int[n];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[source] = 0;

    // Min-heap: [distance, node]
    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] - b[0]);
    pq.offer(new int[]{0, source});

    while (!pq.isEmpty()) {
        int[] curr = pq.poll();
        int d = curr[0], u = curr[1];

        if (d > dist[u]) continue;  // Already found better path

        for (int[] edge : adj[u]) {
            int v = edge[0], weight = edge[1];
            if (dist[u] + weight < dist[v]) {
                dist[v] = dist[u] + weight;
                pq.offer(new int[]{dist[v], v});
            }
        }
    }

    return dist;
}
```

### Floyd-Warshall (All Pairs Shortest Path)

```java
public int[][] floydWarshall(int[][] graph) {
    int n = graph.length;
    int[][] dist = new int[n][n];

    // Initialize
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            dist[i][j] = graph[i][j];
        }
    }

    // DP: Try each vertex as intermediate
    for (int k = 0; k < n; k++) {
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                if (dist[i][k] != Integer.MAX_VALUE &&
                    dist[k][j] != Integer.MAX_VALUE &&
                    dist[i][k] + dist[k][j] < dist[i][j]) {
                    dist[i][j] = dist[i][k] + dist[k][j];
                }
            }
        }
    }

    return dist;
}
```

---

## ⚡ Pattern 10: Bit Manipulation

### Common Operations

```java
// Check if bit is set
boolean isSet = (n & (1 << i)) != 0;

// Set bit
n = n | (1 << i);

// Clear bit
n = n & ~(1 << i);

// Toggle bit
n = n ^ (1 << i);

// Check if power of 2
boolean isPowerOf2 = (n & (n - 1)) == 0;

// Count set bits
int count = Integer.bitCount(n);

// Get rightmost set bit
int rightmost = n & (-n);

// Clear rightmost set bit
n = n & (n - 1);
```

### XOR Tricks

```java
// Swap without temp
a = a ^ b;
b = a ^ b;  // b = (a^b) ^ b = a
a = a ^ b;  // a = (a^b) ^ a = b

// Find single number (others appear twice)
int single = 0;
for (int num : arr) single ^= num;

// Find missing number in 0 to n
int missing = n;
for (int i = 0; i < arr.length; i++) {
    missing ^= i ^ arr[i];
}
```

### Generate All Subsets using Bits

```java
public List<List<Integer>> subsets(int[] nums) {
    List<List<Integer>> result = new ArrayList<>();
    int n = nums.length;

    // 2^n subsets
    for (int mask = 0; mask < (1 << n); mask++) {
        List<Integer> subset = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            if ((mask & (1 << i)) != 0) {
                subset.add(nums[i]);
            }
        }
        result.add(subset);
    }

    return result;
}
```

---

## 📖 Quick Complexity Reference

| Pattern          | Time                    | Space        |
| ---------------- | ----------------------- | ------------ |
| Two Pointers     | O(n)                    | O(1)         |
| Sliding Window   | O(n)                    | O(1) or O(k) |
| Binary Search    | O(log n)                | O(1)         |
| HashMap          | O(n)                    | O(n)         |
| DFS/BFS          | O(V+E)                  | O(V)         |
| Topological Sort | O(V+E)                  | O(V)         |
| Union-Find       | O(α(n)) ≈ O(1)          | O(n)         |
| Dijkstra         | O(E log V)              | O(V)         |
| DP               | O(states × transitions) | O(states)    |
| Backtracking     | O(branches^depth)       | O(depth)     |

---

## 🎯 WHEN TO USE WHAT

**DECISION TREE**

**Is array SORTED?**

- YES → Binary Search / Two Pointers
- NO → Continue...

**Need CONTIGUOUS subarray?**

- YES → Sliding Window / Prefix Sum
- NO → Continue...

**Need to find PAIRS/COMPLEMENTS?**

- YES → HashMap / Two Pointers (if sorted)
- NO → Continue...

**Is it a GRAPH problem?**

- YES:
  - Shortest path → BFS (unweighted) / Dijkstra
  - Connected components → DFS / Union-Find
  - Cycle detection → DFS
  - Dependency order → Topological Sort
- NO → Continue...

**Need ALL possibilities?**

- YES → Backtracking
- NO → Continue...

**Ask for OPTIMAL (min/max/count)?**

- YES → Dynamic Programming
- NO → Try brute force first, then optimize

---

[← Pattern 6: Topological Sort](03_topological_sort.md) | [Chapter overview](../04_Pattern_Recognition.md)
