# 📈 Part 7: Sorting Algorithms — All 5

> **Navigation**: [← Sub Sequences — Order Without Contiguity](04_sub_sequences_order_without_contiguity.md) | [Chapter overview](../01b_Arrays.md) | [Frequency & Duplicates →](06_frequency_duplicates.md)
> Page 5 of 7 in **Arrays**


## 💬 Study-Partner View — Sorting Algorithms

**1. The bottom line:** Sorting puts items in order; simple sorts are easy but slow (O(n²)), and good sorts split the work to reach O(n log n).

**2. The textbook core:**

- **Simple (O(n²)):** bubble, selection, insertion. Insertion sort is fast on nearly sorted data (O(n) best case).
- **Divide & conquer (O(n log n)):** merge sort (stable, O(n) extra space), quicksort (in place, average O(n log n), worst O(n²)).
- Comparison sorts cannot beat **Ω(n log n)**; counting/radix sort do by not comparing.
- **Stable** sort = equal keys keep their original order.

**3. The real-world analogy:** Sorting a **hand of playing cards**: insertion sort is picking up one card at a time and sliding it into place; merge sort is sorting two half-piles and then merging them.

**4. Walkthrough:**

1. Merge sort `[5, 2, 4, 1]`.
2. Split: `[5, 2]` and `[4, 1]`; split again into single items.
3. Merge pairs: `[2, 5]` and `[1, 4]`.
4. Merge the halves by repeatedly taking the smaller front item: `[1, 2, 4, 5]`.
5. Depth log n × work n per level = O(n log n).

> [!NOTE]
> **Quick check:** Why is quicksort's worst case O(n²)? *If the pivot is always the smallest or largest, one side is empty and the recursion depth is n.*


🔗 **Deep dive (Quick+Merge internals, TimSort, Dutch Flag):**
📖 [02a_Sorting_Fundamentals.md](../../03_Algorithms/02a_Sorting_Fundamentals.md)

## 1. Bubble Sort — O(n²) avg, O(n) best with flag

```java
public void bubbleSort(int[] arr) {
    int n = arr.length;
    for (int i = 0; i < n - 1; i++) {
        boolean swapped = false;
        for (int j = 0; j < n - i - 1; j++)
            if (arr[j] > arr[j+1]) {
                int tmp = arr[j]; arr[j] = arr[j+1]; arr[j+1] = tmp;
                swapped = true;
            }
        if (!swapped) break;    // already sorted → O(n) early exit
    }
}
```

## 2. Selection Sort — O(n²) always | Min swaps

```java
public void selectionSort(int[] arr) {
    for (int i = 0; i < arr.length - 1; i++) {
        int minIdx = i;
        for (int j = i+1; j < arr.length; j++)
            if (arr[j] < arr[minIdx]) minIdx = j;
        int tmp = arr[minIdx]; arr[minIdx] = arr[i]; arr[i] = tmp;
    }
}
// Never more than n-1 swaps — good when writes are expensive
```

## 3. Insertion Sort — O(n) best (nearly sorted), O(n²) worst

```java
public void insertionSort(int[] arr) {
    for (int i = 1; i < arr.length; i++) {
        int key = arr[i], j = i - 1;
        while (j >= 0 && arr[j] > key) { arr[j+1] = arr[j]; j--; }
        arr[j+1] = key;
    }
}
// BEST sort for small n or nearly-sorted input
```

## 4. Merge Sort — O(n log n) guaranteed, Stable, O(n) space

```java
public void mergeSort(int[] arr, int l, int r) {
    if (l >= r) return;
    int mid = l + (r - l) / 2;
    mergeSort(arr, l, mid);
    mergeSort(arr, mid+1, r);
    merge(arr, l, mid, r);
}
private void merge(int[] arr, int l, int mid, int r) {
    int[] tmp = Arrays.copyOfRange(arr, l, r + 1);
    int i = 0, j = mid - l + 1, k = l;
    while (i <= mid-l && j <= r-l)
        arr[k++] = tmp[i] <= tmp[j] ? tmp[i++] : tmp[j++];
    while (i <= mid-l) arr[k++] = tmp[i++];
    while (j <= r-l)   arr[k++] = tmp[j++];
}
```

## 5. Quick Sort — O(n log n) avg, O(n²) worst, In-place

```java
public void quickSort(int[] arr, int low, int high) {
    if (low >= high) return;
    int p = partition(arr, low, high);
    quickSort(arr, low, p - 1);
    quickSort(arr, p + 1, high);
}
private int partition(int[] arr, int low, int high) {
    int pivot = arr[high], i = low - 1;
    for (int j = low; j < high; j++)
        if (arr[j] <= pivot) { i++; int t=arr[i]; arr[i]=arr[j]; arr[j]=t; }
    int t = arr[i+1]; arr[i+1] = arr[high]; arr[high] = t;
    return i + 1;
}
```

## Comparison Table

| Sort      | Best       | Avg        | Worst      | Space    | Stable | Best For               |
| --------- | ---------- | ---------- | ---------- | -------- | ------ | ---------------------- |
| Bubble    | O(n)       | O(n²)      | O(n²)      | O(1)     | ✅     | Teaching               |
| Selection | O(n²)      | O(n²)      | O(n²)      | O(1)     | ❌     | Min writes             |
| Insertion | **O(n)**   | O(n²)      | O(n²)      | O(1)     | ✅     | Small/nearly-sorted    |
| Merge     | O(n log n) | O(n log n) | O(n log n) | O(n)     | ✅     | Need stable guaranteed |
| Quick     | O(n log n) | O(n log n) | O(n²)      | O(log n) | ❌     | General in-place       |

## 🎯 Problems

| Problem                     | Sort Technique             |
| --------------------------- | -------------------------- |
| LC 912 — Sort an Array      | Implement merge/quick sort |
| LC 75 — Sort Colors         | Dutch National Flag        |
| LC 56 — Merge Intervals     | Sort by start, merge       |
| LC 1636 — Sort by Frequency | Custom comparator          |

---

## 🐛 Production Failure Modes & Debugging

> These are the bugs that kill arrays in production — not algorithm failures, but the silent killers: out-of-bounds, memory exhaustion, and cache collapse.

### Failure 1: ArrayIndexOutOfBoundsException in Production Loops

**Mechanism:** Three common causes in live code:

| Cause                       | Example                                                | Why It Happens                                            |
| --------------------------- | ------------------------------------------------------ | --------------------------------------------------------- |
| Off-by-one in termination   | `for (i=0; i<=arr.length; i++)`                        | `<=` instead of `<` — touches `arr[length]`               |
| Race in concurrent mutation | Thread A reads `length` while Thread B resizes         | `size` field drifts from `data.length`                    |
| Length/size confusion in 2D | `for (j=0; j<grid[0].length; j++)` when grid is jagged | Works in tests (uniform grids), fails on jagged real data |

**Debugging step — jstack investigation:**

```java
// Suspect: infinite loop or crash on specific input
// 1. Reproduce with: java -cp myapp.jar MyClass input.txt
// 2. Get live thread dump: jstack <pid> | grep -A 20 "RUNNABLE"
// 3. Look for: "java.lang.ArrayIndexOutOfBoundsException"
//    or stack frames stuck in your loop with no exit

// Safe pattern (no off-by-one):
for (int i = 0; i < arr.length; i++) { /* always safe */ }

// Safe 2D traversal (handles jagged):
for (int r = 0; r < grid.length; r++)
    for (int c = 0; c < grid[r].length; c++)  // each row independently
        process(grid[r][c]);
```

### Failure 2: Memory Pressure from Large Array Allocation

**Mechanism:** Arrays allocate the full size upfront. A seemingly small declaration can OOM a container:

| Declaration                   | Size                        | 512MB JVM limit             |
| ----------------------------- | --------------------------- | --------------------------- |
| `new int[1_000_000]`          | ~4 MB                       | OK                          |
| `new int[100_000_000]`        | ~400 MB                     | OK                          |
| `new int[1_000_000_000]`      | **~4 GB**                   | OOM crash                   |
| `new int[100_000][100_000]`   | **~40 GB**                  | OOM on first line           |
| `new byte[Integer.MAX_VALUE]` | **2 GB** (max array length) | Legal but OOM on allocation |

**The 2D trap:** `int[100000][100000]` looks like 100k × 100k = 10 billion elements → ~40 GB. It fails at declaration, not at use.

**Debugging step — heap analysis:**

```java
// BEFORE allocation, validate:
long requiredBytes = (long) rows * cols * 4;  // 4 bytes per int
if (requiredBytes > Runtime.getRuntime().maxMemory()) {
    throw new IllegalArgumentException("Array too large: " + requiredBytes + " bytes");
}
int[][] arr = new int[rows][cols];  // now safe to proceed

// In production, monitor with:
// jcmd <pid> VM.native_memory summary
// jmap -heap <pid>  // shows used vs max heap
```

### Failure 3: Cache-Unfriendly Array Traversal Patterns

**Mechanism:** Cache lines are 64 bytes. Sequential access gives 1 miss per 16 `int` elements. Strided access can cause 1 miss per element — a **16x slowdown** disguised as algorithmic slowness:

| Pattern                                | Miss Rate                                | Relative Speed  |
| -------------------------------------- | ---------------------------------------- | --------------- |
| `for (int i=0; i<n; i++) arr[i]`       | 6.25% (1/16)                             | **1x baseline** |
| `for (int i=0; i<n; i+=2) arr[i]`      | 50% (1/2) — stride-2                     | ~8x slower      |
| `for (int i=0; i<n; i+=16) arr[i]`     | ~100% — stride-16                        | ~16x slower     |
| Column-major on `int[1000][1000]` flat | 100% — each row is a cache-line boundary | ~16x slower     |

**Real production symptom:** Matrix multiply with row-major layout and column-order inner loop runs 10-20x slower than expected from Big-O. CPU profilers (async-profiler, perf) show L1/L2 miss rate spikes.

**Debugging step — cache analysis:**

```java
// Symptom: code runs correctly but 10x slower than expected for size N
// 1. Use async-profiler to sample:
//    java -XX:+UnlockDiagnosticVMOptions \
//    -agentpath:async-profiler.so=start,event=cache-misses,interval=1ms
//
// 2. Or add instrumentation:
long start = System.nanoTime();
for (int r = 0; r < rows; r++)
    for (int c = 0; c < cols; c++)
        sum += matrix[r][c];  // row-major: cache-friendly
long end = System.nanoTime();
System.out.println("Row-major: " + (end - start) / 1e6 + " ms");

// For column-major access: transpose first, or flatten and access with:
// int idx = c * rows + r;   // map col-major to flat array
```

### Quick Reference: Failure Mode → Root Cause → Fix

| Failure                 | Root Cause                               | Fix                                                        |
| ----------------------- | ---------------------------------------- | ---------------------------------------------------------- |
| AIOOBE in loop          | `i <= length` or stale index             | Always use `i < arr.length`; validate index first          |
| OOM on array allocation | Size exceeds JVM heap                    | Check `requiredBytes > maxMemory` before allocation        |
| Slow but correct code   | Strided access destroying cache locality | Match traversal order to array layout; transpose if needed |

---

---

[← Sub Sequences — Order Without Contiguity](04_sub_sequences_order_without_contiguity.md) | [Chapter overview](../01b_Arrays.md) | [Frequency & Duplicates →](06_frequency_duplicates.md)
