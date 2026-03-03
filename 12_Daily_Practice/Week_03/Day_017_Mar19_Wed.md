# Day 017 — Wednesday, March 19, 2026

> **Week 03** | **Day 3** | **Theme:** Heap / Priority Queue + Heap Sort + SQL Window Functions (SUM, AVG, LAG, LEAD)
> [Daily Index](../00_DAILY_PRACTICE_INDEX.md) | [Prev Day](Day_016_Mar18_Tue.md) | [Next Day](Day_018_Mar20_Thu.md)

---

## Completion Checklist

- [ ] DS Deep Dive: Heap / PriorityQueue (30 min)
- [ ] ALGO Deep Dive: Heap Sort (30 min)
- [ ] SQL Lesson: Running totals + LAG/LEAD (40 min)
- [ ] Problem 1: LC 215 — Kth Largest Element in an Array (25 min)
- [ ] Problem 2: LC 347 — Top K Frequent Elements (25 min)
- [ ] Real-World Connection (10 min)

---


---

> ## 📖 CHAPTER REFERENCES — Deep Dive Links
>
> Today's topics link to detailed chapter files for deeper study:
>
> | **DS: Heap / PriorityQueue** | [Trees & Heaps Guide](../../02_Data_Structures/01f_Trees_Heaps.md) |
> | **ALGO: Heap Sort** | [Sorting Advanced](../../03_Algorithms/02b_Sorting_Advanced.md) |
> | **SQL: Window Functions (Running SUM, LAG, LEAD)** | [SQL: Window Functions](../../08_SQL/09_Window_Functions.md) |
>
> *Open the linked file for full theory, diagrams, and practice problems.*

---



## 1. DS DEEP DIVE: Heap / Priority Queue (30 min)

### WHY?
When you need "give me the largest/smallest element quickly" — heap is the answer. Used in task schedulers (OS), Dijkstra's algorithm, median finding, event-driven simulations. Java's `PriorityQueue` is a min-heap.

### WHAT — Heap Properties

```
HEAP = Complete Binary Tree + Heap Property

MIN-HEAP: Parent ≤ children (root = minimum)
MAX-HEAP: Parent ≥ children (root = maximum)

        MIN-HEAP              MAX-HEAP
          [1]                   [9]
         /   \                 /   \
       [3]   [2]            [7]   [8]
      /   \  /             /   \  /
    [7]  [5][4]          [3]  [5][4]

STORED AS ARRAY (level-order):
  [1, 3, 2, 7, 5, 4]    [9, 7, 8, 3, 5, 4]

PARENT/CHILD FORMULAS (0-indexed):
  parent(i)     = (i - 1) / 2
  leftChild(i)  = 2 * i + 1
  rightChild(i) = 2 * i + 2
```

### HOW — Heap Operations

```java
class MinHeap {
    int[] heap;
    int size;
    
    MinHeap(int capacity) {
        heap = new int[capacity];
        size = 0;
    }
    
    // INSERT: Add at end, bubble UP — O(log n)
    void insert(int val) {
        heap[size] = val;
        siftUp(size);
        size++;
    }
    
    private void siftUp(int i) {
        while (i > 0) {
            int parent = (i - 1) / 2;
            if (heap[i] < heap[parent]) {
                swap(i, parent);
                i = parent;
            } else break;
        }
    }
    
    // EXTRACT MIN: Remove root, move last to root, bubble DOWN — O(log n)
    int extractMin() {
        int min = heap[0];
        heap[0] = heap[--size];
        siftDown(0);
        return min;
    }
    
    private void siftDown(int i) {
        while (2 * i + 1 < size) {
            int smallest = i;
            int left = 2 * i + 1;
            int right = 2 * i + 2;
            
            if (left < size && heap[left] < heap[smallest])
                smallest = left;
            if (right < size && heap[right] < heap[smallest])
                smallest = right;
            
            if (smallest == i) break;
            swap(i, smallest);
            i = smallest;
        }
    }
    
    // PEEK: O(1)
    int peek() { return heap[0]; }
    
    private void swap(int i, int j) {
        int tmp = heap[i]; heap[i] = heap[j]; heap[j] = tmp;
    }
}
```

### Insert Visualization

```
Insert 2 into min-heap [1, 3, 5, 7]:

Step 1: Add at end
  [1, 3, 5, 7, 2]
         [1]
        /   \
      [3]   [5]
     /   \
   [7]   [2]  ← new

Step 2: Sift up — 2 < 3? Yes, swap
  [1, 2, 5, 7, 3]
         [1]
        /   \
      [2]   [5]
     /   \
   [7]   [3]

Step 3: Sift up — 2 < 1? No, stop. Done!
```

### Java PriorityQueue Usage

```java
// MIN-HEAP (default)
PriorityQueue<Integer> minHeap = new PriorityQueue<>();
minHeap.offer(5); minHeap.offer(2); minHeap.offer(8);
minHeap.poll();  // returns 2 (smallest)

// MAX-HEAP
PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Comparator.reverseOrder());
maxHeap.offer(5); maxHeap.offer(2); maxHeap.offer(8);
maxHeap.poll();  // returns 8 (largest)

// With custom objects
PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[1] - b[1]);
// sort by second element, ascending
```

---

## 2. ALGO DEEP DIVE: Heap Sort (30 min)

### WHY?
Heap Sort gives O(n log n) worst-case without extra space (unlike Merge Sort's O(n)). Not used much in practice (cache-unfriendly), but understanding it deepens your heap knowledge.

### HOW — Two Phases

```
Phase 1: BUILD MAX-HEAP from array — O(n)
  Start from last internal node, sift down each

Phase 2: EXTRACT one by one — O(n log n)
  Swap root (max) with last, reduce size, sift down

Array: [4, 10, 3, 5, 1]

BUILD MAX-HEAP (bottom-up):
  Start at index 1 (parent of last element)
  
  [4, 10, 3, 5, 1]  → sift 10: no change (children 5,1 are smaller)
  [4, 10, 3, 5, 1]  → sift 4: swap with 10
  [10, 5, 3, 4, 1]  → Max-heap built!

EXTRACT PHASE:
  Step 1: Swap 10↔1 → [1, 5, 3, 4, | 10] → sift down 1 → [5, 4, 3, 1, | 10]
  Step 2: Swap 5↔1  → [1, 4, 3, | 5, 10] → sift down 1 → [4, 1, 3, | 5, 10]
  Step 3: Swap 4↔3  → [3, 1, | 4, 5, 10] → sift down 3 → [3, 1, | 4, 5, 10]
  Step 4: Swap 3↔1  → [1, | 3, 4, 5, 10] → done!
  
  Result: [1, 3, 4, 5, 10] ← SORTED!
```

```java
void heapSort(int[] arr) {
    int n = arr.length;
    
    // Phase 1: Build max-heap (bottom-up, O(n))
    for (int i = n / 2 - 1; i >= 0; i--) {
        siftDown(arr, n, i);
    }
    
    // Phase 2: Extract max repeatedly
    for (int i = n - 1; i > 0; i--) {
        swap(arr, 0, i);         // Move max to end
        siftDown(arr, i, 0);     // Restore heap on reduced array
    }
}

void siftDown(int[] arr, int heapSize, int i) {
    while (2 * i + 1 < heapSize) {
        int largest = i;
        int left  = 2 * i + 1;
        int right = 2 * i + 2;
        if (left < heapSize && arr[left] > arr[largest]) largest = left;
        if (right < heapSize && arr[right] > arr[largest]) largest = right;
        if (largest == i) break;
        swap(arr, i, largest);
        i = largest;
    }
}
```

---

## 3. SQL LESSON: Running Totals + LAG/LEAD (40 min)

### Running Totals with SUM() OVER

```sql
-- Running total of sales
SELECT order_date, amount,
    SUM(amount) OVER (ORDER BY order_date) AS running_total
FROM orders;
```

```
order_date | amount | running_total
───────────┼────────┼──────────────
2025-01-01 │   100  │    100
2025-01-02 │   250  │    350
2025-01-03 │    75  │    425
2025-01-04 │   300  │    725

Each row sees the SUM of all rows up to and including itself!
```

### LAG and LEAD — Access Previous/Next Row

```sql
-- Compare each sale to previous day
SELECT order_date, amount,
    LAG(amount, 1) OVER (ORDER BY order_date) AS prev_amount,
    amount - LAG(amount, 1) OVER (ORDER BY order_date) AS daily_change,
    LEAD(amount, 1) OVER (ORDER BY order_date) AS next_amount
FROM orders;
```

```
LAG(column, N)  = value from N rows BEFORE current
LEAD(column, N) = value from N rows AFTER current

order_date | amount | prev | change | next
───────────┼────────┼──────┼────────┼──────
2025-01-01 │  100   │ NULL │  NULL  │ 250
2025-01-02 │  250   │  100 │ +150   │  75
2025-01-03 │   75   │  250 │ -175   │ 300
2025-01-04 │  300   │   75 │ +225   │ NULL
                       ↑ LAG              ↑ LEAD
```

### Moving Average

```sql
-- 3-day moving average
SELECT order_date, amount,
    AVG(amount) OVER (
        ORDER BY order_date
        ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
    ) AS moving_avg_3day
FROM orders;
```

### Practice Exercises

```sql
-- Exercise 1: Running total of employee salaries ordered by hire date
SELECT name, hire_date, salary,
    SUM(salary) OVER (ORDER BY hire_date) AS cumulative_cost
FROM employees;

-- Exercise 2: Rank employees + show salary difference from previous rank
SELECT name, salary,
    RANK() OVER (ORDER BY salary DESC) AS salary_rank,
    salary - LAG(salary) OVER (ORDER BY salary DESC) AS gap_from_prev
FROM employees;

-- Exercise 3: Month-over-month sales growth percentage
SELECT month, total_sales,
    LAG(total_sales) OVER (ORDER BY month) AS prev_month,
    ROUND(
        (total_sales - LAG(total_sales) OVER (ORDER BY month)) * 100.0 
        / LAG(total_sales) OVER (ORDER BY month), 
    2) AS growth_pct
FROM monthly_sales;
```

---

## 4. PROBLEM 1: LC 215 — Kth Largest Element

**Link:** https://leetcode.com/problems/kth-largest-element-in-an-array/

### Problem
Find the kth largest element in an unsorted array.

### Approach: Min-Heap of size K

```
WHY min-heap? Keep only the K largest elements.
The root (min of those K) = kth largest overall.

Array: [3,2,1,5,6,4], k=2

Process:  3 → heap=[3]        (size < k, just add)
          2 → heap=[2,3]      (size == k, now comparing)
          1 → 1 < peek(2)? skip
          5 → 5 > peek(2)? poll 2, add 5 → heap=[3,5]
          6 → 6 > peek(3)? poll 3, add 6 → heap=[5,6]
          4 → 4 < peek(5)? skip

Answer: peek() = 5  ← 2nd largest!
```

### Solution

```java
class Solution {
    // Approach 1: Min-Heap — O(n log k) time, O(k) space
    public int findKthLargest(int[] nums, int k) {
        PriorityQueue<Integer> minHeap = new PriorityQueue<>();
        
        for (int num : nums) {
            minHeap.offer(num);
            if (minHeap.size() > k) {
                minHeap.poll();  // Remove smallest — keep only top K
            }
        }
        return minHeap.peek();  // kth largest
    }
    
    // Approach 2: QuickSelect — O(n) average, O(n²) worst
    public int findKthLargestQuickSelect(int[] nums, int k) {
        int target = nums.length - k; // kth largest = (n-k)th smallest
        return quickSelect(nums, 0, nums.length - 1, target);
    }
    
    private int quickSelect(int[] nums, int lo, int hi, int target) {
        int pivot = partition(nums, lo, hi);
        if (pivot == target) return nums[pivot];
        if (pivot < target) return quickSelect(nums, pivot + 1, hi, target);
        return quickSelect(nums, lo, pivot - 1, target);
    }
    
    private int partition(int[] nums, int lo, int hi) {
        int pivot = nums[hi], i = lo;
        for (int j = lo; j < hi; j++) {
            if (nums[j] <= pivot) {
                int tmp = nums[i]; nums[i] = nums[j]; nums[j] = tmp;
                i++;
            }
        }
        int tmp = nums[i]; nums[i] = nums[hi]; nums[hi] = tmp;
        return i;
    }
}
```

---

## 5. PROBLEM 2: LC 347 — Top K Frequent Elements

**Link:** https://leetcode.com/problems/top-k-frequent-elements/

### Visual Walkthrough

```
Input: nums = [1,1,1,2,2,3], k = 2

Step 1: Count frequencies → {1:3, 2:2, 3:1}

Step 2: Min-heap by frequency, size ≤ k
  Process (1,3): heap = [(1,3)]
  Process (2,2): heap = [(2,2), (1,3)]     size==k
  Process (3,1): 1 < peek.freq(2)? skip

Step 3: Extract from heap → [1, 2]
```

### Solution

```java
class Solution {
    public int[] topKFrequent(int[] nums, int k) {
        // Step 1: Count frequencies
        Map<Integer, Integer> freq = new HashMap<>();
        for (int n : nums) freq.merge(n, 1, Integer::sum);
        
        // Step 2: Min-heap of size k (by frequency)
        PriorityQueue<int[]> minHeap = new PriorityQueue<>((a, b) -> a[1] - b[1]);
        for (var entry : freq.entrySet()) {
            minHeap.offer(new int[]{entry.getKey(), entry.getValue()});
            if (minHeap.size() > k) minHeap.poll();
        }
        
        // Step 3: Extract results
        int[] result = new int[k];
        for (int i = 0; i < k; i++) result[i] = minHeap.poll()[0];
        return result;
    }
}
// Time: O(n log k), Space: O(n)
```

---

## 6. REAL-WORLD CONNECTION

```
HEAP IN THE REAL WORLD:
  1. OS Task Scheduler: Highest priority process runs first (max-heap)
  2. Dijkstra's Algorithm: Extract min-distance vertex (min-heap)
  3. Median Finder: Two heaps — max-heap for lower half, min-heap for upper half
  4. Merge K Sorted Lists: Min-heap of K heads → always extract smallest
  5. Event Queue: Process earliest event first (min-heap by timestamp)
```
