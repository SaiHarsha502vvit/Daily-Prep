# PART 15: Sorting-Based Interview Problems

> **Navigation**: [← Sorting in Practice](05_sorting_in_practice.md) | [Chapter overview](../02b_Sorting_Advanced.md)
> Page 6 of 6 in **Sorting Advanced**


## Problem 1: Merge Intervals

```java
public int[][] merge(int[][] intervals) {
    if (intervals.length <= 1) return intervals;

    // Sort by start time
    Arrays.sort(intervals, (a, b) -> a[0] - b[0]);

    List<int[]> result = new ArrayList<>();
    int[] current = intervals[0];

    for (int i = 1; i < intervals.length; i++) {
        if (intervals[i][0] <= current[1]) {
            // Overlapping, merge
            current[1] = Math.max(current[1], intervals[i][1]);
        } else {
            // Non-overlapping, add current and start new
            result.add(current);
            current = intervals[i];
        }
    }
    result.add(current);

    return result.toArray(new int[result.size()][]);
}
```

## Problem 2: Meeting Rooms II (Min Rooms Needed)

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

    int rooms = 0, endPtr = 0;
    for (int start : starts) {
        if (start < ends[endPtr]) {
            rooms++;
        } else {
            endPtr++;
        }
    }

    return rooms;
}
```

## Problem 3: Largest Number

```java
public String largestNumber(int[] nums) {
    String[] strs = new String[nums.length];
    for (int i = 0; i < nums.length; i++) {
        strs[i] = String.valueOf(nums[i]);
    }

    // Custom comparator: "30" vs "3" -> compare "303" vs "330"
    Arrays.sort(strs, (a, b) -> (b + a).compareTo(a + b));

    // Handle case where all zeros
    if (strs[0].equals("0")) return "0";

    StringBuilder sb = new StringBuilder();
    for (String s : strs) {
        sb.append(s);
    }

    return sb.toString();
}
```

## Problem 4: H-Index

```java
public int hIndex(int[] citations) {
    Arrays.sort(citations);
    int n = citations.length;

    for (int i = 0; i < n; i++) {
        int h = n - i;  // Papers with at least h citations
        if (citations[i] >= h) {
            return h;
        }
    }

    return 0;
}

// O(n) solution using counting sort
public int hIndexLinear(int[] citations) {
    int n = citations.length;
    int[] count = new int[n + 1];

    for (int c : citations) {
        count[Math.min(c, n)]++;
    }

    int papers = 0;
    for (int h = n; h >= 0; h--) {
        papers += count[h];
        if (papers >= h) return h;
    }

    return 0;
}
```

---

_Understanding sorting algorithms teaches you how to think about efficiency!_ 🔄

---

## 🔬 PART FINAL: ADVANCED SORTING DEEP DIVE

### 🔄 Radix Sort — Non — Comparison Based Sorting

**RADIX SORT - BEATING O(n log n)**

```text
CLAIM: No comparison-based sort can be faster than O(n log n)
REALITY: Radix sort achieves O(nk) where k = number of digits!

For 32-bit integers with decimal digits:
• k = 10 (maximum 10 digits in 32-bit integer)
• O(n × 10) = O(n) linear time!

ALGORITHM (LSD - Least Significant Digit first):
────────────────────────────────────────────────
Sort by each digit, starting from rightmost
Use stable counting sort for each digit position

Example: Sort [170, 45, 75, 90, 802, 24, 2, 66]

PASS 1 (ones digit):
Bucket 0: [170, 90]
Bucket 2: [802, 2]
Bucket 4: [24]
Bucket 5: [45, 75]
Bucket 6: [66]
After: [170, 90, 802, 2, 24, 45, 75, 66]

PASS 2 (tens digit):
Bucket 0: [802, 2]    (02, 02)
Bucket 2: [24]        (24)
Bucket 4: [45]        (45)
Bucket 6: [66]        (66)
Bucket 7: [170, 75]   (70, 75)
Bucket 9: [90]        (90)
After: [802, 2, 24, 45, 66, 170, 75, 90]

PASS 3 (hundreds digit):
Bucket 0: [2, 24, 45, 66, 75, 90]
Bucket 1: [170]
Bucket 8: [802]
After: [2, 24, 45, 66, 75, 90, 170, 802] ✓ SORTED!

JAVA IMPLEMENTATION:
────────────────────
public void radixSort(int[] arr) {
    int max = getMax(arr);

    // Do counting sort for every digit
    for (int exp = 1; max / exp > 0; exp *= 10) {
        countingSortByDigit(arr, exp);
    }
}

private void countingSortByDigit(int[] arr, int exp) {
    int n = arr.length;
    int[] output = new int[n];
    int[] count = new int[10];  // Digits 0-9

    // Count occurrences of each digit
    for (int i = 0; i < n; i++)
        count[(arr[i] / exp) % 10]++;

    // Convert counts to positions
    for (int i = 1; i < 10; i++)
        count[i] += count[i - 1];

    // Build output array (reverse for stability)
    for (int i = n - 1; i >= 0; i--) {
        int digit = (arr[i] / exp) % 10;
        output[count[digit] - 1] = arr[i];
        count[digit]--;
    }

    // Copy back
    System.arraycopy(output, 0, arr, 0, n);
}

WHEN TO USE RADIX SORT:
──────────────────────
✅ Integers with limited range
✅ Strings of fixed length
✅ When n is very large and k is small
❌ Floating point numbers (tricky representation)
❌ When range is huge (k becomes large)
```

🔬 **Section Challenge — 🔄 Radix Sort — Non — Comparison Based Sorting**

**Challenge 1 (Constraint Reasoning):** `N = 1e6` non-negative integers are all below `1e9`. When can radix sort beat comparison sorting, and what hidden constraints must you check first?

<details><summary>Trace, Reasoning & Debug</summary>

Comparison sorting has a lower bound of `O(N log N)`, but radix sort can run in `O(d * (N + base))`, where `d` is the number of digits/passes. It can win when keys are fixed-width integers and the digit count is small.

Check whether values are negative, whether stability is required, how much extra memory counting buckets need, and whether the constant factors beat Java's highly optimized built-in sorts for the actual input size.

</details>

## 🔄 Timsort — the Real — World Champion

**TIMSORT - USED BY JAVA, PYTHON, ANDROID**

```text
Created by Tim Peters for Python in 2002
Now used in: Java (Arrays.sort for objects), Python, Android

KEY INSIGHT: Real-world data is often partially sorted!

Examples of "natural runs":
• Log files (sorted by timestamp, new entries appended)
• Database results (often sorted by ID)
• User actions (recent activity lists)

ALGORITHM OVERVIEW:
───────────────────
1. FIND RUNS: Identify naturally sorted sequences
   [3, 5, 7, 2, 1, 4, 6, 8] has runs: [3,5,7], [1,2], [4,6,8]

2. EXTEND SMALL RUNS: If run < minrun (usually 32-64), extend with
   Insertion Sort (fast for small arrays)

3. MERGE RUNS: Use galloping merge for runs of different sizes
   Smart stack-based merging strategy

GALLOPING MODE:
───────────────
When merging [1,2,3,100,101,102] with [50,51,52,200,201,202]

Standard merge: Compare one by one
Galloping: If 7 consecutive elements come from same array,
           switch to exponential search to find merge point

This handles "one array is much smaller" case efficiently

PERFORMANCE:
────────────
• Already sorted: O(n) - just identifies one big run
• Reverse sorted: O(n) - reverses the run, still O(n)
• Random: O(n log n) - falls back to merge sort behavior
• Mostly sorted: O(n) to O(n log n) - exploits existing order

WHY JAVA USES TIMSORT FOR OBJECTS:
───────────────────────────────────
1. STABILITY: Equal objects keep their relative order
   Essential for multi-key sorting (sort by name, then by age)

2. REAL-WORLD PERFORMANCE: Most data has some order
   TimSort exploits this, often faster than pure QuickSort

3. COMPARISON COST: Object.compareTo() is expensive
   TimSort minimizes comparisons
```

## 🧠 External Sorting — When Data Doesn't Fit in Memory

### External Merge Sort - Sorting 1TB of Data

PROBLEM: Need to sort 1 TB of data, but only have 8 GB RAM

SOLUTION: External Merge Sort

**Phase 1: Create Sorted Runs**

1. Read 8 GB chunk from disk
2. Sort in memory (QuickSort)
3. Write sorted chunk to temp file
4. Repeat until all data processed

Result: 128 sorted files of 8 GB each

**Phase 2: K-way Merge**

Can't merge all 128 files at once (need buffer for each)

With 8 GB RAM and 64 MB buffers:
- Can merge ~120 files at once
- But 128 > 120, so need multiple passes

**Merge Strategy**:

```text
Pass 1: Merge files 1-120 → temp1
        Merge files 121-128 → temp2

Pass 2: Merge temp1 + temp2 → final output
```

**K-way Merge with Min-heap**:

1. Put first element from each file in min-heap
2. Extract min, write to output
3. Read next element from same file, add to heap
4. Repeat until all files exhausted

Time per element: O(log k) where k = number of files  
Total: O(n log k)

**Real-world Example: Google Mapreduce Sorting**

- 2008 record: Sorted 1 PB (1000 TB) in 6 hours
- Used 4000 machines
- Each machine sorted ~250 GB locally
- Then merged across network

🔬 **Section Challenge — 🧠 External Sorting — When Data Doesn't Fit in Memory**

**Challenge 1 (Systems Reasoning):** During k-way merge, you create 50,000 sorted temp files and the program fails before sorting finishes. What constraint did you ignore?

<details><summary>Trace, Reasoning & Debug</summary>

External sorting is limited by RAM, disk bandwidth, and OS file descriptors. A k-way merge that opens every run at once can exceed the file descriptor limit even if the algorithm is correct on paper.

Fix it with multi-pass merging: merge a safe fan-in like 128 or 512 runs at a time, write larger intermediate runs, and repeat. Keep buffered readers small but effective, close files promptly, and delete temp files after each pass.

</details>

## 🔄 Parallel Sorting — Using Multiple CPU Cores

### Parallel Sorting - Multi-core Performance

JAVA 8+: Arrays.parallelSort()  
Uses Fork/Join framework to parallelize merge sort

int[] arr = new int[10_000_000];  
// Fill with random numbers  
Arrays.parallelSort(arr);  // Uses all CPU cores!

**HOW IT Works**:

1. Split array into chunks (one per core)
2. Sort each chunk in parallel (using QuickSort)
3. Merge sorted chunks (can also be parallelized)

```text
Original Array: [##############################]

Split:    [########] [########] [########] [########]
           Core 1     Core 2     Core 3     Core 4
              ↓          ↓          ↓          ↓
Sort:     [sorted]   [sorted]   [sorted]   [sorted]
              ↘          ↙          ↘          ↙
Merge L1:      [merged]              [merged]
                   ↘                    ↙
Merge L2:              [FINAL SORTED]
```

**Speedup**:

- 4 cores: ~3.5x faster (not 4x due to merge overhead)
- 8 cores: ~6x faster
- 16 cores: ~10x faster (diminishing returns)

THRESHOLD: parallelSort only kicks in for arrays > 8192 elements  
Below that, sequential sort is faster (no parallel overhead)

BENCHMARK (10 million integers, 8-core CPU):

| Method | Time | Speedup |
| --- | --- | --- |
| Arrays.sort() | 950 ms | 1x (baseline) |
| parallelSort() | 180 ms | 5.3x |
| Custom parallel | 160 ms | 5.9x (optimized) |

🔬 **Section Challenge — 🔄 Parallel Sorting — Using Multiple CPU Cores**

**Challenge 1 (Performance Reasoning):** Should you always replace `Arrays.sort()` with `Arrays.parallelSort()` for large inputs?

<details><summary>Trace, Reasoning & Debug</summary>

No. Parallel sorting adds split/merge overhead, uses the common ForkJoinPool, and can become memory-bandwidth bound. It may help on very large primitive arrays with available CPU cores, but it can hurt small arrays or busy servers.

The selection rule is benchmark under production-like load. Use parallel sort when input size is large enough, the machine has idle cores, comparator cost is not the bottleneck, and sharing the common pool will not starve other work.

</details>

## 🔄 Sorting Stability — Deep Explanation

**STABILITY - WHY IT MATTERS IN REAL APPLICATIONS**

```text
DEFINITION: Stable sort preserves relative order of equal elements

EXAMPLE:
Input:  [(Alice, 25), (Bob, 30), (Charlie, 25)]
Sort by age:

STABLE:   [(Alice, 25), (Charlie, 25), (Bob, 30)]
          Alice still before Charlie (original order preserved)

UNSTABLE: [(Charlie, 25), (Alice, 25), (Bob, 30)]
          Order of Alice and Charlie might change

WHY STABILITY MATTERS:
──────────────────────

SCENARIO: E-commerce product listing
1. First sort by rating (highest first)
2. Then sort by price (lowest first)

WITH STABLE SORT:
After step 1: Products ordered by rating
After step 2: Products ordered by price, but WITHIN same price,
              higher-rated products come first!

This is called "multi-key sorting" or "sort then sort again"

STABLE ALGORITHMS:
─────────────────
• Insertion Sort (elements only move past smaller elements)
• Merge Sort (equal elements taken from left half first)
• Counting Sort (preserves input order in each bucket)
• Radix Sort (uses stable counting sort per digit)
• TimSort (designed to be stable)

UNSTABLE ALGORITHMS:
───────────────────
• QuickSort (swap can exchange equal elements)
• HeapSort (heap structure doesn't preserve order)
• Selection Sort (swap can disturb equal elements)

MAKING UNSTABLE SORTS STABLE:
─────────────────────────────
Add index as secondary key:

Original: [3a, 1, 3b, 2]
With index: [(3,0), (1,1), (3,2), (2,3)]

Sort by: first element, then by index if equal
Result: [(1,1), (2,3), (3,0), (3,2)]
Final: [1, 2, 3a, 3b] - STABLE!

Cost: O(n) extra space for indices
```

🔬 **Section Challenge — 🔄 Sorting Stability — Deep Explanation**

**Challenge 1 (Trace Reasoning):** You sort employees by `name`, then sort again by `department`. When does this produce employees grouped by department while still alphabetized inside each department?

<details><summary>Trace, Reasoning & Debug</summary>

This works only if the second sort is stable. A stable sort preserves the relative order of equal keys, so employees with the same department keep the name order established by the first sort.

If the second sort is unstable, equal-department rows may be rearranged. The safer Java approach is either use a stable object sort or express the full ordering in one comparator: `comparing(Employee::department).thenComparing(Employee::name)`.

</details>

## 🔄 Sorting in Competitive Programming

**COMPETITIVE PROGRAMMING SORTING TRICKS**

```text
TRICK 1: COORDINATE COMPRESSION
────────────────────────────────
Problem: Values are huge (up to 10^9) but only n values (n ≤ 10^5)
Solution: Map values to 0 to n-1

int[] arr = {1000000000, 1, 50000};
// Create sorted copy with indices
int[][] sorted = new int[n][2];
for (int i = 0; i < n; i++)
    sorted[i] = new int[]{arr[i], i};
Arrays.sort(sorted, (a, b) -> a[0] - b[0]);

// Assign compressed values
int[] compressed = new int[n];
for (int i = 0; i < n; i++)
    compressed[sorted[i][1]] = i;
// Result: [2, 0, 1] (maps to 0-based ranks)

TRICK 2: CUSTOM COMPARATOR FOR COMPLEX SORTING
──────────────────────────────────────────────
// Sort intervals by end point, then by start point
Arrays.sort(intervals, (a, b) -> {
    if (a[1] != b[1]) return a[1] - b[1];  // By end
    return a[0] - b[0];                     // Then by start
});

// Sort strings by length, then lexicographically
Arrays.sort(strings, (a, b) -> {
    if (a.length() != b.length())
        return a.length() - b.length();
    return a.compareTo(b);
});

TRICK 3: PARTIAL SORTING WITH QUICKSELECT
──────────────────────────────────────────
Problem: Find kth smallest element (don't need full sort)
Solution: QuickSelect - O(n) average

// Java's partial sort workaround
PriorityQueue<Integer> maxHeap = new PriorityQueue<>((a,b) -> b - a);
for (int num : arr) {
    maxHeap.offer(num);
    if (maxHeap.size() > k)
        maxHeap.poll();
}
// maxHeap.peek() is kth smallest - O(n log k)

TRICK 4: SORTING + TWO POINTERS
────────────────────────────────
Many problems become easier after sorting:
• Two Sum variants
• Container With Most Water
• 3Sum, 4Sum
• Merge intervals

Pattern:
1. Sort the input
2. Use two pointers from both ends
3. Move pointers based on comparison

// Example: Find pair with sum closest to target
Arrays.sort(arr);
int left = 0, right = arr.length - 1;
int closestSum = Integer.MAX_VALUE;
while (left < right) {
    int sum = arr[left] + arr[right];
    if (Math.abs(sum - target) < Math.abs(closestSum - target))
        closestSum = sum;
    if (sum < target) left++;
    else right--;
}
```

---

_Master sorting and you master a huge portion of algorithm problems!_

---

🔬 **Section Challenge — 🔄 Sorting in Competitive Programming**

**Challenge 1 (Constraint Pattern):** Values are up to `1e9`, `N <= 2e5`, and queries ask for ranks/counts of values less than `x`. Why is a raw frequency array impossible, and what sorting-based rewrite works?

<details><summary>Trace, Reasoning & Debug</summary>

A raw array indexed by value would need size `1e9`, which is too large. But only `N` distinct input values can appear, so the real coordinate space is small after compression.

Sort the unique values, map each value to its compressed rank, and answer counts/ranks with binary search or a Fenwick tree if updates are involved. The mental move is: huge value range plus limited item count means coordinate compression.

</details>

## PRACTICE PROBLEMS — Sorting & Searching

### Sorting Problems

| #   | Problem              | Difficulty | Source | Which Sort / Technique      |
| --- | -------------------- | ---------- | ------ | --------------------------- |
| 1   | Sort an Array        | Medium     | LC 912 | Implement merge/quick sort  |
| 2   | Sort Colors          | Medium     | LC 75  | Dutch National Flag (3-way) |
| 3   | Kth Largest Element  | Medium     | LC 215 | QuickSelect or heap         |
| 4   | Merge Intervals      | Medium     | LC 56  | Sort by start + merge       |
| 5   | Meeting Rooms II     | Medium     | LC 253 | Sort events + count         |
| 6   | Largest Number       | Medium     | LC 179 | Custom comparator           |
| 7   | Sort List            | Medium     | LC 148 | Merge sort on linked list   |
| 8   | Wiggle Sort II       | Medium     | LC 324 | Median + 3-way partition    |
| 9   | H-Index              | Medium     | LC 274 | Counting sort               |
| 10  | Maximum Gap          | Medium     | LC 164 | Bucket sort — O(n)!         |
| 11  | Pancake Sorting      | Medium     | LC 969 | Selection sort variant      |
| 12  | Top K Frequent Words | Medium     | LC 692 | Sort + tiebreak             |

### Binary Search Problems

| #   | Problem                        | Difficulty | Source  | BS Variant              |
| --- | ------------------------------ | ---------- | ------- | ----------------------- |
| 1   | Binary Search                  | Easy       | LC 704  | Standard template       |
| 2   | Search Insert Position         | Easy       | LC 35   | Lower bound             |
| 3   | First Bad Version              | Easy       | LC 278  | Left boundary           |
| 4   | Search in Rotated Sorted Array | Medium     | LC 33   | Modified BS             |
| 5   | Find Minimum in Rotated Array  | Medium     | LC 153  | Inflection point        |
| 6   | Search a 2D Matrix             | Medium     | LC 74   | Flatten + BS            |
| 7   | Find Peak Element              | Medium     | LC 162  | Gradient BS             |
| 8   | Koko Eating Bananas            | Medium     | LC 875  | BS on answer            |
| 9   | Capacity to Ship Packages      | Medium     | LC 1011 | BS on answer            |
| 10  | Split Array Largest Sum        | Hard       | LC 410  | BS + greedy check       |
| 11  | Median of Two Sorted Arrays    | Hard       | LC 4    | BS on partition         |
| 12  | Aggressive Cows (SPOJ)         | Medium     | SPOJ    | BS on answer (classic!) |

**Hidden Gems:**

| Problem                             | Source         | Why It's Great                                   |
| ----------------------------------- | -------------- | ------------------------------------------------ |
| Custom Sort String                  | LC 791         | Custom ordering — tests comparator understanding |
| Relative Sort Array                 | LC 1122        | Counting sort with custom order                  |
| Minimum Number of Arrows            | LC 452         | Sort intervals + greedy                          |
| Count of Smaller Numbers After Self | Hard LC 315    | Merge sort + counting inversions                 |
| Magnetic Force Between Two Balls    | Medium LC 1552 | Binary search on answer (like Aggressive Cows)   |

---

## 📎 Reference Anchor

**OpenJDK — TimSort and DualPivotQuicksort source**
- `TimSort`: [TimSort.java](https://github.com/openjdk/jdk/blob/master/src/java.base/share/classes/java/util/TimSort.java) — used by `Arrays.sort(Object[])` and `Collections.sort()`. **Invariant**: Merges only runs of length ≥ MIN_MERGE (32 by default); maintains a run stack where consecutive runs satisfy the Timsort merge invariants (`run[n-2].len > run[n-1].len + run[n].len` and `run[n-1].len > run[n].len`). This ensures O(n log n) worst case and O(n) on already-sorted input.
- `DualPivotQuicksort`: [DualPivotQuicksort.java](https://github.com/openjdk/jdk/blob/master/src/java.base/share/classes/java/util/DualPivotQuicksort.java) — used by `Arrays.sort(int[])` and other primitives. **Invariant**: Selects two pivots p1 < p2; partitions into 3 regions `[< p1]`, `[p1..p2]`, `[> p2]`. Falls back to insertion sort for n < 47; uses merge sort for "nearly sorted" sections.
- **Constraint warning**: `Arrays.sort(int[])` is NOT stable. `Arrays.sort(Integer[])` IS stable (uses TimSort). If you sort primitive arrays and need to preserve equal-key order, box to `Integer[]` first — but accept the boxing overhead.

---

## When Advanced Sorting Breaks

### 1. Radix Sort — Incorrect Number of Passes or Base

**What breaks**: LSD Radix Sort on numbers with d digits in base B requires exactly d passes. Miscounting d (e.g., using `Math.log10(max)` which returns `log10(0) = -Infinity` for max=0) causes either too few passes (wrong result) or too many (wasted time).
**Fix**: `int d = max == 0 ? 1 : (int) Math.log10(max) + 1`. Handle max=0 explicitly.

### 2. Counting Sort — Array Size Proportional to Max Value

**What breaks**: `int[] count = new int[max+1]` with max = 10⁹ allocates 4 GB — an OOM crash. Counting sort is only practical when max ≤ ~10⁶.
**Signal**: If the value range >> n, use comparison sort (O(n log n)) not counting sort (O(n + max)).

### 3. External Sort — Wrong Chunk Size / Missing Merge Pass

**What breaks**: K-way external merge of sorted chunks with a heap: if chunks are larger than available RAM, the initial sort pass itself OOMs. Or if the chunk count k is too large, the k-way merge heap is still too large for memory.
**Fix**: Chunk size = available RAM / 2 (leave room for the merge buffer). If k chunks don't fit in one merge pass, do multi-level merging: merge groups of sqrt(k) chunks first.

---

## Brute Force → Optimal: Counting Inversions

**Problem**: Count pairs (i, j) with i < j and arr[i] > arr[j].

**Brute Force — O(n²) nested loop:**
```java
int count = 0;
for (int i = 0; i < n; i++)
    for (int j = i+1; j < n; j++)
        if (arr[i] > arr[j]) count++;
```

**Optimal — O(n log n) merge sort:**
During the merge step, when we take an element from the RIGHT half before the LEFT half is exhausted, all remaining left-half elements form inversions with this right element. Add `leftRemaining = mid - i + 1` to the count at each such event.

**Why this works**: Merge sort naturally processes pairs (left[i], right[j]) in sorted order of j. The "right element chosen first" event is exactly the inversion condition for all remaining left elements.

---

[← Sorting in Practice](05_sorting_in_practice.md) | [Chapter overview](../02b_Sorting_Advanced.md)
