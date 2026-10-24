# 📌 Part 6: Skip List

> **Navigation**: [← Disjoint Set (union — Find)](02_disjoint_set_union_find.md) | [Chapter overview](../07b_Advanced_DS_Patterns.md) | [Quadtree (Spatial Indexing) →](04_quadtree_spatial_indexing.md)
> Page 3 of 5 in **Fenwick & Segment Trees — Advanced Data Structure Patterns**


## Concept

```
SKIP LIST: Probabilistic alternative to balanced trees

Like a linked list with "express lanes" for faster traversal.

Level 3:  1 ────────────────────────────────> 9
Level 2:  1 ──────────> 4 ──────────> 7 ───> 9
Level 1:  1 ───> 3 ───> 4 ───> 6 ───> 7 ───> 9
Level 0:  1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → null

Search for 6:
- Start at top left
- Move right until would overshoot
- Drop down one level
- Repeat

Path: 1→9 (overshoot) ↓ 1→4→7 (overshoot) ↓ 4→6 ✓
```

## Implementation

```java
class SkipListNode {
    int val;
    SkipListNode[] forward;

    SkipListNode(int val, int level) {
        this.val = val;
        this.forward = new SkipListNode[level + 1];
    }
}

class SkipList {
    private static final int MAX_LEVEL = 16;
    private static final double P = 0.5;
    private SkipListNode head;
    private int level;
    private Random random;

    public SkipList() {
        head = new SkipListNode(Integer.MIN_VALUE, MAX_LEVEL);
        level = 0;
        random = new Random();
    }

    private int randomLevel() {
        int lvl = 0;
        while (random.nextDouble() < P && lvl < MAX_LEVEL) {
            lvl++;
        }
        return lvl;
    }

    // SEARCH: O(log n) average
    public boolean search(int target) {
        SkipListNode current = head;
        for (int i = level; i >= 0; i--) {
            while (current.forward[i] != null &&
                   current.forward[i].val < target) {
                current = current.forward[i];
            }
        }
        current = current.forward[0];
        return current != null && current.val == target;
    }

    // INSERT: O(log n) average
    public void insert(int val) {
        SkipListNode[] update = new SkipListNode[MAX_LEVEL + 1];
        SkipListNode current = head;

        // Find insert position at each level
        for (int i = level; i >= 0; i--) {
            while (current.forward[i] != null &&
                   current.forward[i].val < val) {
                current = current.forward[i];
            }
            update[i] = current;
        }

        int newLevel = randomLevel();
        if (newLevel > level) {
            for (int i = level + 1; i <= newLevel; i++) {
                update[i] = head;
            }
            level = newLevel;
        }

        SkipListNode newNode = new SkipListNode(val, newLevel);
        for (int i = 0; i <= newLevel; i++) {
            newNode.forward[i] = update[i].forward[i];
            update[i].forward[i] = newNode;
        }
    }

    // DELETE: O(log n) average
    public boolean delete(int val) {
        SkipListNode[] update = new SkipListNode[MAX_LEVEL + 1];
        SkipListNode current = head;

        for (int i = level; i >= 0; i--) {
            while (current.forward[i] != null &&
                   current.forward[i].val < val) {
                current = current.forward[i];
            }
            update[i] = current;
        }

        current = current.forward[0];
        if (current == null || current.val != val) {
            return false;
        }

        for (int i = 0; i <= level; i++) {
            if (update[i].forward[i] != current) break;
            update[i].forward[i] = current.forward[i];
        }

        while (level > 0 && head.forward[level] == null) {
            level--;
        }

        return true;
    }
}
```

---

## 📌 Part 7: Bloom Filter

### Concept

```
BLOOM FILTER: Space-efficient probabilistic data structure

- Tells if element is POSSIBLY IN set or DEFINITELY NOT in set
- No false negatives, possible false positives
- Cannot delete elements

USE CASE: Quick membership test before expensive operation

Example: Check if URL is malicious
1. Check Bloom Filter (fast, in memory)
2. If "possibly yes", check actual database (slow)
3. If "definitely no", skip database check

Structure: Bit array + multiple hash functions

Insert "hello":
h1("hello") = 3
h2("hello") = 7
h3("hello") = 11

Bit array: [0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0]
                ^         ^         ^
```

### Implementation

```java
class BloomFilter {
    private BitSet bitSet;
    private int size;
    private int numHashes;

    public BloomFilter(int expectedElements, double falsePositiveRate) {
        // Optimal size: -n*ln(p) / (ln(2)^2)
        this.size = (int) Math.ceil(
            -expectedElements * Math.log(falsePositiveRate) /
            (Math.log(2) * Math.log(2))
        );
        // Optimal hash count: (m/n) * ln(2)
        this.numHashes = (int) Math.round(
            (double) size / expectedElements * Math.log(2)
        );
        this.bitSet = new BitSet(size);
    }

    // ADD element
    public void add(String element) {
        for (int i = 0; i < numHashes; i++) {
            int hash = getHash(element, i);
            bitSet.set(hash);
        }
    }

    // CHECK membership
    public boolean mightContain(String element) {
        for (int i = 0; i < numHashes; i++) {
            int hash = getHash(element, i);
            if (!bitSet.get(hash)) {
                return false;  // Definitely not present
            }
        }
        return true;  // Possibly present (could be false positive)
    }

    private int getHash(String element, int i) {
        // Double hashing: h(i) = h1 + i*h2
        int h1 = element.hashCode();
        int h2 = element.hashCode() * 31;
        return Math.abs((h1 + i * h2) % size);
    }
}

// VISUAL EXAMPLE:
// Size = 16, numHashes = 3
//
// Add "cat": positions 2, 7, 12
// Bit array: [0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0]
//
// Add "dog": positions 4, 8, 14
// Bit array: [0,0,1,0,1,0,0,1,1,0,0,0,1,0,1,0]
//
// Check "cat": positions 2, 7, 12 → all 1 → POSSIBLY PRESENT ✓
// Check "rat": positions 2, 4, 11 → 11 is 0 → DEFINITELY NOT PRESENT
// Check "bird": positions 2, 8, 12 → all 1 → FALSE POSITIVE!
```

---

## 💾 Part 8: LRU Cache

### Concept

```
LRU (Least Recently Used) CACHE:
Fixed-size cache that evicts least recently used item when full.

Operations needed:
- GET: O(1) - HashMap
- PUT: O(1) - HashMap + update order
- EVICT: O(1) - Doubly Linked List

Structure: HashMap + Doubly Linked List

        HashMap                 Doubly Linked List
    ┌─────────────┐         HEAD ←→ A ←→ B ←→ C ←→ TAIL
    │ "A" → nodeA │                 ↑           ↑
    │ "B" → nodeB │              Most         Least
    │ "C" → nodeC │             Recent       Recent
    └─────────────┘

Access B → Move B to front:
HEAD ←→ B ←→ A ←→ C ←→ TAIL
```

### Implementation

```java
class LRUCache {
    class DLinkedNode {
        int key, value;
        DLinkedNode prev, next;
    }

    private Map<Integer, DLinkedNode> cache = new HashMap<>();
    private int capacity;
    private DLinkedNode head, tail;  // Dummy nodes

    public LRUCache(int capacity) {
        this.capacity = capacity;
        head = new DLinkedNode();
        tail = new DLinkedNode();
        head.next = tail;
        tail.prev = head;
    }

    // GET: O(1)
    public int get(int key) {
        DLinkedNode node = cache.get(key);
        if (node == null) return -1;

        moveToHead(node);  // Mark as recently used
        return node.value;
    }

    // PUT: O(1)
    public void put(int key, int value) {
        DLinkedNode node = cache.get(key);

        if (node != null) {
            node.value = value;
            moveToHead(node);
        } else {
            DLinkedNode newNode = new DLinkedNode();
            newNode.key = key;
            newNode.value = value;

            cache.put(key, newNode);
            addToHead(newNode);

            if (cache.size() > capacity) {
                DLinkedNode lru = removeTail();
                cache.remove(lru.key);
            }
        }
    }

    private void addToHead(DLinkedNode node) {
        node.prev = head;
        node.next = head.next;
        head.next.prev = node;
        head.next = node;
    }

    private void removeNode(DLinkedNode node) {
        node.prev.next = node.next;
        node.next.prev = node.prev;
    }

    private void moveToHead(DLinkedNode node) {
        removeNode(node);
        addToHead(node);
    }

    private DLinkedNode removeTail() {
        DLinkedNode lru = tail.prev;
        removeNode(lru);
        return lru;
    }
}

// VISUAL TRACE:
// Capacity = 3
//
// put(1, 1):  [1]
// put(2, 2):  [2, 1]
// put(3, 3):  [3, 2, 1]
// get(1):     [1, 3, 2]  (1 moved to front)
// put(4, 4):  [4, 1, 3]  (2 evicted as LRU)
// get(2):     -1         (2 was evicted)
```

---

## 🌳 Part 9: B — Tree and B+ Tree

### Concept

```
B-TREE: Self-balancing tree optimized for disk access
        Used in databases and file systems

Properties (order m):
- Each node has at most m children
- Each non-leaf has at least ⌈m/2⌉ children
- Root has at least 2 children (if not leaf)
- All leaves at same level
- Node with k children has k-1 keys

B-Tree (order 3):
              [10, 20]
             /   |    \
        [5,7]  [15,17] [25,30]

B+ TREE: Variant where:
- All data in leaves
- Leaves linked for range queries
- Internal nodes only have keys (guides)

B+ Tree:
              [10, 20]
             /   |    \
        [5,7]→[10,15,17]→[20,25,30]→null
         ↑                    ↑
        Data                 Data

WHY B+ TREE for DATABASES?
1. All data at leaves → consistent access time
2. Linked leaves → efficient range queries
3. More keys per node → shallower tree → fewer disk reads
```

---

## ⚖️ Part 10: Comparison Table

```
┌───────────────────┬─────────────┬─────────────┬─────────────────────┐
│ Data Structure    │ Search      │ Insert      │ Space               │
├───────────────────┼─────────────┼─────────────┼─────────────────────┤
│ Trie              │ O(m)        │ O(m)        │ O(ALPHABET × m × n) │
│ Segment Tree      │ O(log n)    │ O(log n)    │ O(4n)               │
│ Fenwick Tree      │ O(log n)    │ O(log n)    │ O(n)                │
│ Disjoint Set      │ O(α(n))≈O(1)│ O(α(n))≈O(1)│ O(n)                │
│ Skip List         │ O(log n)*   │ O(log n)*   │ O(n)*               │
│ Bloom Filter      │ O(k)        │ O(k)        │ O(m) bits           │
│ LRU Cache         │ O(1)        │ O(1)        │ O(n)                │
│ B-Tree (order m)  │ O(log n)    │ O(log n)    │ O(n)                │
└───────────────────┴─────────────┴─────────────┴─────────────────────┘

* = average case for Skip List
m = string length for Trie
k = number of hash functions for Bloom Filter
α = inverse Ackermann function (practically constant)
```

---

_These data structures are the building blocks of modern systems!_ 🏗️

---

## 🚀 Part 11: More Advanced Data Structures

### Sparse Table (Range Minimum Query)

```
SPARSE TABLE: Precompute answers for all power-of-2 ranges
              Perfect for STATIC arrays with repeated queries

IDEA: Any range can be covered by at most 2 overlapping power-of-2 ranges

Array: [3, 1, 4, 1, 5, 9, 2, 6]

Sparse Table (for MIN):
┌───────────────────────────────────────────────────────────────┐
│ k=0 (2^0=1): [3, 1, 4, 1, 5, 9, 2, 6]  (each element itself)  │
│ k=1 (2^1=2): [1, 1, 1, 1, 5, 2, 2, -]  (min of 2)             │
│ k=2 (2^2=4): [1, 1, 1, 1, 2, 2, -, -]  (min of 4)             │
│ k=3 (2^3=8): [1, -, -, -, -, -, -, -]  (min of 8)             │
└───────────────────────────────────────────────────────────────┘

Query(2, 6): min(sparse[2][2], sparse[3][2]) = min(1, 2) = 1
             Using k=2 (length 4), overlapping ranges [2-5] and [3-6]
```

```java
class SparseTable {
    int[][] sparse;
    int[] log;
    int n;

    public SparseTable(int[] arr) {
        n = arr.length;
        int k = (int)(Math.log(n) / Math.log(2)) + 1;
        sparse = new int[n][k];
        log = new int[n + 1];

        // Precompute logs
        log[1] = 0;
        for (int i = 2; i <= n; i++) {
            log[i] = log[i / 2] + 1;
        }

        // Base case: ranges of length 1
        for (int i = 0; i < n; i++) {
            sparse[i][0] = arr[i];
        }

        // Build table: O(n log n)
        for (int j = 1; j < k; j++) {
            for (int i = 0; i + (1 << j) <= n; i++) {
                sparse[i][j] = Math.min(
                    sparse[i][j - 1],
                    sparse[i + (1 << (j - 1))][j - 1]
                );
            }
        }
    }

    // Query: O(1)
    public int query(int L, int R) {
        int j = log[R - L + 1];
        return Math.min(sparse[L][j], sparse[R - (1 << j) + 1][j]);
    }
}

// WHEN TO USE:
// ✓ Static array (no updates)
// ✓ Many queries
// ✓ Need O(1) query time
// ✗ Array changes frequently → use Segment Tree instead
```

---

## Monotonic Stack

```
MONOTONIC STACK: Stack that maintains increasing/decreasing order
                 Reveals relationships between elements

USE CASES:
├── Next Greater Element
├── Previous Greater Element
├── Next Smaller Element
├── Stock Span Problem
├── Largest Rectangle in Histogram
└── Trapping Rain Water

VISUAL EXAMPLE - Next Greater Element:
Array: [4, 5, 2, 10, 8]

Step by step (decreasing stack, process right to left):
┌────────────────────────────────────────────────────────────────┐
│ i=4: arr[4]=8   Stack=[]      → NGE=-1   Stack=[8]             │
│ i=3: arr[3]=10  Stack=[8]     → 10>8, pop → NGE=-1  Stack=[10] │
│ i=2: arr[2]=2   Stack=[10]    → 2<10 → NGE=10  Stack=[10,2]    │
│ i=1: arr[1]=5   Stack=[10,2]  → 5>2, pop → NGE=10  Stack=[10,5]│
│ i=0: arr[0]=4   Stack=[10,5]  → 4<5 → NGE=5   Stack=[10,5,4]   │
└────────────────────────────────────────────────────────────────┘

Result: [5, 10, 10, -1, -1]
```

```java
// Next Greater Element
public int[] nextGreater(int[] arr) {
    int n = arr.length;
    int[] result = new int[n];
    Stack<Integer> stack = new Stack<>();

    // Process from right to left
    for (int i = n - 1; i >= 0; i--) {
        // Pop smaller elements
        while (!stack.isEmpty() && stack.peek() <= arr[i]) {
            stack.pop();
        }

        // Stack top is next greater, or -1 if empty
        result[i] = stack.isEmpty() ? -1 : stack.peek();

        // Push current element
        stack.push(arr[i]);
    }

    return result;
}

// Largest Rectangle in Histogram
public int largestRectangleArea(int[] heights) {
    Stack<Integer> stack = new Stack<>();
    int maxArea = 0;
    int n = heights.length;

    for (int i = 0; i <= n; i++) {
        int h = (i == n) ? 0 : heights[i];

        while (!stack.isEmpty() && h < heights[stack.peek()]) {
            int height = heights[stack.pop()];
            int width = stack.isEmpty() ? i : i - stack.peek() - 1;
            maxArea = Math.max(maxArea, height * width);
        }

        stack.push(i);
    }

    return maxArea;
}

// VISUAL TRACE - Largest Rectangle:
// heights = [2, 1, 5, 6, 2, 3]
//
//        _
//       | |
//     _ | |
//    | || |_  _
//  _ | || || || |
// | || || || || |
// 0  1  2  3  4  5
//
// Largest rectangle: height=5, width=2 → area=10 (indices 2-3)
```

---

## Monotonic Deque (Sliding Window Maximum)

```
MONOTONIC DEQUE: Deque that maintains decreasing order
                 Front always has maximum of current window

PROBLEM: Find maximum in each sliding window of size k

Array: [1, 3, -1, -3, 5, 3, 6, 7], k=3

┌─────────────────────────────────────────────────────────────────┐
│ Window [1,3,-1]     Deque: [3,-1]     Max: 3                    │
│ Window [3,-1,-3]    Deque: [3,-1,-3]  Max: 3                    │
│ Window [-1,-3,5]    Deque: [5]        Max: 5                    │
│ Window [-3,5,3]     Deque: [5,3]      Max: 5                    │
│ Window [5,3,6]      Deque: [6]        Max: 6                    │
│ Window [3,6,7]      Deque: [7]        Max: 7                    │
└─────────────────────────────────────────────────────────────────┘

Result: [3, 3, 5, 5, 6, 7]
```

```java
public int[] maxSlidingWindow(int[] nums, int k) {
    int n = nums.length;
    int[] result = new int[n - k + 1];
    Deque<Integer> deque = new ArrayDeque<>();  // Store indices

    for (int i = 0; i < n; i++) {
        // Remove indices outside window
        while (!deque.isEmpty() && deque.peekFirst() < i - k + 1) {
            deque.pollFirst();
        }

        // Remove smaller elements (they can't be max)
        while (!deque.isEmpty() && nums[deque.peekLast()] < nums[i]) {
            deque.pollLast();
        }

        // Add current index
        deque.offerLast(i);

        // Record result when window is full
        if (i >= k - 1) {
            result[i - k + 1] = nums[deque.peekFirst()];
        }
    }

    return result;
}
```

---

## Circular Buffer (Ring Buffer)

```
RING BUFFER: Fixed-size buffer that wraps around
             Used in: Audio processing, Network buffers, Logging

STRUCTURE:
┌─────────────────────────────────────────────────────────┐
│         ┌───┬───┬───┬───┬───┬───┬───┬───┐               │
│         │ A │ B │ C │ D │ E │   │   │   │               │
│         └───┴───┴───┴───┴───┴───┴───┴───┘               │
│           ↑                   ↑                         │
│         HEAD                TAIL                        │
│         (read)              (write)                     │
│                                                         │
│  After adding F, G, H, I:                               │
│         ┌───┬───┬───┬───┬───┬───┬───┬───┐               │
│         │ A │ B │ C │ D │ E │ F │ G │ H │               │
│         └───┴───┴───┴───┴───┴───┴───┴───┘               │
│           ↑                               ↑             │
│         HEAD                            TAIL            │
│                                                         │
│  After adding I (wraps around):                         │
│         ┌───┬───┬───┬───┬───┬───┬───┬───┐               │
│         │ I │ B │ C │ D │ E │ F │ G │ H │               │
│         └───┴───┴───┴───┴───┴───┴───┴───┘               │
│             ↑ ↑                                         │
│          TAIL HEAD                                      │
└─────────────────────────────────────────────────────────┘
```

```java
class CircularBuffer<T> {
    private Object[] buffer;
    private int head = 0;  // Read position
    private int tail = 0;  // Write position
    private int size = 0;
    private int capacity;

    public CircularBuffer(int capacity) {
        this.capacity = capacity;
        this.buffer = new Object[capacity];
    }

    public void enqueue(T item) {
        if (isFull()) {
            // Overwrite oldest (or throw exception)
            head = (head + 1) % capacity;
            size--;
        }
        buffer[tail] = item;
        tail = (tail + 1) % capacity;
        size++;
    }

    @SuppressWarnings("unchecked")
    public T dequeue() {
        if (isEmpty()) {
            throw new IllegalStateException("Buffer empty");
        }
        T item = (T) buffer[head];
        buffer[head] = null;
        head = (head + 1) % capacity;
        size--;
        return item;
    }

    public boolean isEmpty() { return size == 0; }
    public boolean isFull() { return size == capacity; }
    public int size() { return size; }
}

// USE CASE: Rate Limiter with time window
class SlidingWindowRateLimiter {
    private long[] timestamps;
    private int head = 0;
    private int count = 0;
    private int maxRequests;
    private long windowMs;

    public SlidingWindowRateLimiter(int maxRequests, long windowMs) {
        this.timestamps = new long[maxRequests];
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
    }

    public synchronized boolean allowRequest() {
        long now = System.currentTimeMillis();
        long windowStart = now - windowMs;

        // Remove expired timestamps
        while (count > 0 && timestamps[head] < windowStart) {
            head = (head + 1) % maxRequests;
            count--;
        }

        if (count < maxRequests) {
            int tail = (head + count) % maxRequests;
            timestamps[tail] = now;
            count++;
            return true;
        }

        return false;
    }
}
```

---

[← Disjoint Set (union — Find)](02_disjoint_set_union_find.md) | [Chapter overview](../07b_Advanced_DS_Patterns.md) | [Quadtree (Spatial Indexing) →](04_quadtree_spatial_indexing.md)
