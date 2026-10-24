# 16b. DSA × Java Collections — From Algorithms to the Standard Library

**Navigation**: [← SQL Window Functions](../Problem_Sets_SQL/16_SQL_Problems_Window_Functions_Advanced.md) | [📚 Index](../00_INDEX.md) | [SQL Analytics →](../Problem_Sets_SQL/17_SQL_Problems_Analytics_RealWorld_Design.md)

**Cross-links:**
- [`02_Data_Structures/`](../../02_Data_Structures/) — DS foundations (build intuition here first)
- [`07_Modern_Java/Ch08_Collections_Internals.md`](../../07_Modern_Java/Ch08_Collections_Internals.md) — Java Collections deep dive
- [`07_Modern_Java/Ch15_Concurrency_Core.md`](../../07_Modern_Java/Ch15_Concurrency_Core.md) — concurrent collections
- [`PATH_JAVA_BACKEND.md`](../../PATH_JAVA_BACKEND.md) — full Java path

---

> **Reading contract**: You built a linked list from scratch. You implemented a BST. You solved LeetCode with HashMaps and Heaps. This file shows exactly which Java standard library class IS each data structure you built — and explains the production choices between them (why `HashMap` vs `LinkedHashMap` vs `TreeMap`, why `ArrayDeque` vs `Stack`, when to reach for `ConcurrentHashMap`).

---

## Table of Contents

1. [Array → ArrayList vs ArrayDeque vs LinkedList](#1-array--arraylist-vs-arraydeque-vs-linkedlist)
2. [HashMap → HashMap vs LinkedHashMap vs TreeMap vs ConcurrentHashMap](#2-hashmap--hashmap-vs-linkedhashmap-vs-treemap-vs-concurrenthashmap)
3. [Stack → ArrayDeque (not java.util.Stack)](#3-stack--arraydeque-not-javautilstack)
4. [Queue / BFS → ArrayDeque vs PriorityQueue vs LinkedBlockingQueue](#4-queue--bfs--arraydeque-vs-priorityqueue-vs-linkedblockingqueue)
5. [Heap (Priority Queue) → PriorityQueue and Comparator patterns](#5-heap-priority-queue--priorityqueue-and-comparator-patterns)
6. [BST → TreeMap and TreeSet](#6-bst--treemap-and-treeset)
7. [HashSet → HashSet vs LinkedHashSet vs TreeSet](#7-hashset--hashset-vs-linkedhashset-vs-treeset)
8. [Graph → adjacency with HashMap<Node, List<Node>>](#8-graph--adjacency-with-hashmapnode-listnode)

---

## 1. Array → ArrayList vs ArrayDeque vs LinkedList

### 🧠 Foundation — The array you built

In algorithms, you use a plain array: contiguous memory, O(1) indexed access, O(n) insert-at-middle (shift right):

```java
int[] nums = new int[10];
nums[0] = 42;          // O(1) write
int x = nums[5];      // O(1) read
// Insert at index 2: must shift nums[2..n-1] right — O(n)
```

---

### 🔍 The Java Classes

**`ArrayList<E>`** — the resizable array. Use this as your default list.

```java
List<String> names = new ArrayList<>();
names.add("Alice");     // O(1) amortized — appends to backing array
names.add(0, "Bob");    // O(n) — shifts right
names.get(2);           // O(1) — indexed access
names.remove(1);        // O(n) — shifts left

// Capacity growth: when full, creates a new array 1.5× bigger, copies all elements
// → the "amortized O(1)" for add() averages out over many adds
```

**`LinkedList<E>`** — doubly linked list. Use only when you need O(1) add/remove at both ends.

```java
LinkedList<String> dll = new LinkedList<>();
dll.addFirst("Alice");  // O(1) — head insert
dll.addLast("Bob");     // O(1) — tail insert
dll.get(5);             // O(n) — must traverse from head! ← the critical difference
dll.removeFirst();      // O(1)
```

**`ArrayDeque<E>`** — circular array. The better choice over `LinkedList` for queue/deque operations.

```java
ArrayDeque<String> deque = new ArrayDeque<>();
deque.addFirst("Alice"); // O(1) — efficient circular array trick
deque.addLast("Bob");    // O(1)
deque.peekFirst();       // O(1)
deque.pollLast();        // O(1)
// No nulls allowed (use as stack or queue, not general list)
```

---

### The Decision Table

| Use case | Best class | Why |
|----------|-----------|-----|
| General-purpose list | `ArrayList` | O(1) indexed access, most operations |
| Queue (FIFO) | `ArrayDeque` | O(1) both ends, better than `LinkedList` |
| Stack (LIFO) | `ArrayDeque` | O(1) push/pop, don't use `Stack` (synchronized) |
| Frequent inserts at middle | `LinkedList` | O(1) insert once you have the node reference |
| LRU cache implementation | `LinkedHashMap` | (see HashMap section) |
| Need `null` in a deque | `LinkedList` | `ArrayDeque` rejects nulls |

---

### 💥 War Story — `LinkedList.get(i)` in a Loop = O(n²)

A developer processed a `LinkedList<Order>` of 10,000 orders:

```java
LinkedList<Order> orders = fetchOrders(); // 10,000 items

for (int i = 0; i < orders.size(); i++) {
  process(orders.get(i)); // ← O(n) per call — traverses from head each time
}
// Total: O(n²) = 100,000,000 operations
```

The job took 45 seconds. Switching to `ArrayList` (same code) took 80ms. `LinkedList.get(i)` traverses from the head on every call. Use an iterator or enhanced for-loop when iterating a `LinkedList`:

```java
for (Order order : orders) { // ← iterator: O(n) total, not O(n²)
  process(order);
}
```

---

### 📝 Practice Challenges

1. You need a sliding window of the last 100 events. New events push to the back; old events pop from the front. Which class? Write the method.
2. `ArrayList` vs `LinkedList` for a word processor's undo/redo stack — which is better and why?
3. When does `ArrayList.add()` become O(n) instead of O(1)?

---

## 2. HashMap → HashMap vs LinkedHashMap vs TreeMap vs ConcurrentHashMap

### 🧠 Foundation — The HashMap you built

HashMap uses a hash function to map keys to array buckets, achieving O(1) average for get/put:

```java
HashMap<String, Integer> freq = new HashMap<>();
freq.put("apple", 3);  // hash("apple") → bucket index → store
freq.get("apple");     // hash("apple") → same bucket → retrieve
// Collision: two keys hash to same bucket → linked list (or red-black tree if > 8 entries)
```

---

### 🔍 The Four HashMap Variants

**`HashMap<K,V>`** — the default. Unordered, O(1) average, not thread-safe:

```java
Map<String, Integer> map = new HashMap<>();
map.put("a", 1);
map.put("b", 2);
map.put("c", 3);
// Iteration order: unpredictable (hash-dependent)
map.forEach((k, v) -> System.out.println(k + "=" + v));
// might print: b=2, a=1, c=3 (or any order)
```

**`LinkedHashMap<K,V>`** — maintains **insertion order** (extra doubly-linked list through entries):

```java
Map<String, Integer> linked = new LinkedHashMap<>();
linked.put("a", 1); linked.put("b", 2); linked.put("c", 3);
// Always prints: a=1, b=2, c=3 — insertion order preserved

// ✅ LRU Cache in 3 lines using LinkedHashMap access-order mode:
Map<String, Integer> lru = new LinkedHashMap<>(16, 0.75f, true) {
  protected boolean removeEldestEntry(Map.Entry<String, Integer> eldest) {
    return size() > 100; // evict when over 100 entries
  }
};
```

**`TreeMap<K,V>`** — sorted by key (Red-Black BST under the hood), O(log n) for all operations:

```java
TreeMap<String, Integer> tree = new TreeMap<>();
tree.put("banana", 2); tree.put("apple", 1); tree.put("cherry", 3);
// Always sorted alphabetically: apple=1, banana=2, cherry=3

// Exclusive to TreeMap:
tree.firstKey();               // "apple"
tree.lastKey();                // "cherry"
tree.headMap("b");             // {apple=1}  (keys < "b")
tree.floorKey("bo");           // "banana"   (largest key ≤ "bo")
tree.ceilingKey("bo");         // "cherry"   (smallest key ≥ "bo")
tree.subMap("apple","cherry"); // {apple=1, banana=2} (exclusive end)
```

**`ConcurrentHashMap<K,V>`** — thread-safe, no global lock. Multiple threads read/write concurrently:

```java
// ❌ Not thread-safe — concurrent updates can corrupt HashMap
Map<String, Integer> sharedMap = new HashMap<>();

// ✅ Thread-safe — concurrent segment locking, reads without locking
Map<String, Integer> safe = new ConcurrentHashMap<>();
safe.put("key", 1);
safe.computeIfAbsent("key2", k -> expensiveCompute(k)); // atomic
safe.merge("counter", 1, Integer::sum);                  // atomic increment
```

---

### The Hierarchy at a Glance

```
java.util.Map (interface)
├── HashMap                   ← default, O(1), unordered
│   └── LinkedHashMap         ← insertion-ordered or access-ordered
├── TreeMap                   ← sorted by key, O(log n), R-B tree
└── concurrent
    └── ConcurrentHashMap     ← thread-safe, segment locking
```

---

### The Decision Table

| Need | Class |
|------|-------|
| Fast unordered map (default) | `HashMap` |
| Preserve insertion order | `LinkedHashMap` |
| Sorted by key, range queries | `TreeMap` |
| Multi-threaded shared map | `ConcurrentHashMap` |
| LRU cache | `LinkedHashMap` (access-order mode) |
| Floor/ceiling key lookups | `TreeMap` |
| Frequency counting | `HashMap` with `getOrDefault` / `merge` |

---

### 💥 War Story — `HashMap` in Multi-Threaded Context → Infinite Loop in Java 6

In Java 6 (and earlier), concurrent modification of a `HashMap` could cause an infinite loop during rehashing — two threads simultaneously triggering resize would create a circular reference in the bucket's linked list. The CPU pegged at 100% and the thread never returned.

This was a known race condition. The fix: `ConcurrentHashMap` or `Collections.synchronizedMap()`. In Java 8+, the linked list became a red-black tree when collision chains exceed 8 — this also eliminated the circular reference risk, but `ConcurrentHashMap` is still required for thread-safety.

```java
// ❌ Never share HashMap across threads
Map<String, Integer> shared = new HashMap<>();
// Thread 1: shared.put("a", 1)
// Thread 2: shared.put("b", 2)  ← can corrupt structure

// ✅ Thread-safe
Map<String, Integer> safe = new ConcurrentHashMap<>();
```

---

### 📝 Practice Challenges

1. You're building a word frequency counter on a 1M-word document. Which Map implementation? Write the counting loop using `merge()`.
2. You need to find all words whose frequency is between 10 and 100 (inclusive). Which Map lets you do this without scanning all entries? Write the code.
3. A cache stores API responses. It must: (a) be thread-safe, (b) automatically evict the least-recently-used entry when size > 500. Which implementation and how?

---

## 3. Stack → ArrayDeque (not java.util.Stack)

### 🧠 Foundation — The Stack you built

LIFO: push to top, pop from top. Used in DFS, balanced brackets, expression evaluation:

```
push(A) → [A]
push(B) → [A, B]
push(C) → [A, B, C]
pop()   → C, stack = [A, B]
peek()  → B (top without removing)
```

---

### 🔍 The Java Class

**Never use `java.util.Stack`** — it extends `Vector` which is synchronized (locked on every operation). It's a legacy class from Java 1.0.

**Always use `ArrayDeque`** for stack operations:

```java
// ✅ Modern stack usage
Deque<Integer> stack = new ArrayDeque<>();
stack.push(1);        // addFirst — O(1)
stack.push(2);        // addFirst
stack.push(3);        // addFirst
stack.peek();         // peekFirst → 3 (top)
stack.pop();          // removeFirst → 3, stack = [2, 1]

// For DFS (recursive → iterative conversion):
Deque<TreeNode> dfs = new ArrayDeque<>();
dfs.push(root);
while (!dfs.isEmpty()) {
  TreeNode node = dfs.pop();
  if (node.right != null) dfs.push(node.right); // right pushed first
  if (node.left != null)  dfs.push(node.left);  // left processed first (LIFO)
}
```

---

### The `Deque` Interface — One Interface, Two Uses

```java
Deque<T> deque = new ArrayDeque<>();

// Used as stack (LIFO):
deque.push(x);    // = addFirst
deque.pop();      // = removeFirst
deque.peek();     // = peekFirst

// Used as queue (FIFO):
deque.offer(x);   // = addLast
deque.poll();     // = removeFirst  ← same! front comes out
deque.peek();     // = peekFirst    ← same!
```

One class, two personalities. Always prefer `Deque<T>` as the reference type (the interface) not `ArrayDeque<T>` (the implementation), so you can swap implementations.

---

### 📝 Practice Challenges

1. Implement balanced bracket checking for `()[]{}` using `ArrayDeque` as a stack.
2. Convert the recursive in-order tree traversal to iterative using `ArrayDeque`.
3. Why is `Stack` class deprecated for new code? What is the exact performance problem?

---

## 4. Queue / BFS → ArrayDeque vs PriorityQueue vs LinkedBlockingQueue

### 🧠 Foundation — The Queue you built

FIFO: enqueue at tail, dequeue at head. BFS requires this:

```
offer(A) → [A]
offer(B) → [A, B]
offer(C) → [A, B, C]
poll()   → A (front), queue = [B, C]
```

---

### 🔍 The Java Classes

**`ArrayDeque<E>`** — standard FIFO queue (the right default for BFS):

```java
Queue<Integer> bfsQueue = new ArrayDeque<>();
bfsQueue.offer(root.val);   // enqueue — O(1)
while (!bfsQueue.isEmpty()) {
  int node = bfsQueue.poll(); // dequeue — O(1)
  // process node, add neighbors
}
```

**`PriorityQueue<E>`** — min-heap by default. Elements dequeued in priority order, not insertion order:

```java
// Min-heap (smallest first)
PriorityQueue<Integer> minHeap = new PriorityQueue<>();
minHeap.offer(5); minHeap.offer(1); minHeap.offer(3);
minHeap.poll(); // → 1 (smallest)
minHeap.poll(); // → 3
minHeap.poll(); // → 5

// Max-heap (largest first) — reverse the comparator
PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Collections.reverseOrder());
// or: new PriorityQueue<>((a, b) -> b - a);
```

**`LinkedBlockingQueue<E>`** — thread-safe, optionally bounded, blocking:

```java
// Bounded queue: blocks producer when full, blocks consumer when empty
BlockingQueue<Task> taskQueue = new LinkedBlockingQueue<>(100);

// Producer thread
taskQueue.put(new Task());   // blocks if queue is full

// Consumer thread  
Task t = taskQueue.take();   // blocks if queue is empty
```

Used in Java's `ThreadPoolExecutor` as the internal work queue.

---

### The Decision Table

| Need | Class |
|------|-------|
| BFS traversal | `ArrayDeque` (as Queue) |
| Process by priority | `PriorityQueue` |
| Producer-consumer (multi-thread) | `LinkedBlockingQueue` |
| Bounded task queue | `ArrayDeque`+manual or `LinkedBlockingQueue(capacity)` |
| Dijkstra's shortest path | `PriorityQueue` |
| Level-order tree traversal | `ArrayDeque` |

---

### 📝 Practice Challenges

1. Implement BFS that returns nodes level by level (each level as a separate list).
2. A task scheduler runs 10 tasks at a time. Producers add tasks; consumers process them. Write the producer and consumer threads using `LinkedBlockingQueue(10)`.
3. Dijkstra's algorithm needs a min-heap by distance. Write the `PriorityQueue` with a custom comparator for `int[] {node, distance}` pairs.

---

## 5. Heap (Priority Queue) → PriorityQueue and Comparator Patterns

### 🧠 Foundation — What you built in algorithms

A min-heap keeps the smallest element accessible in O(1), with O(log n) insert and O(log n) extract-min:

```
Insert 5, 1, 3:
Heap: [1, 5, 3]  ← min at index 0

Extract min → 1, heap = [3, 5]
Insert 2 → heap = [2, 5, 3]
```

---

### 🔍 The Java Pattern Library for PriorityQueue

**Top-K largest elements:**

```java
// Keep a min-heap of size K — the minimum of the heap = the Kth largest
PriorityQueue<Integer> topK = new PriorityQueue<>(k); // min-heap

for (int num : nums) {
  topK.offer(num);
  if (topK.size() > k) {
    topK.poll(); // remove smallest — keeps only top K
  }
}
// topK.peek() = Kth largest
```

**K smallest elements:**

```java
// Max-heap of size K
PriorityQueue<Integer> bottomK = new PriorityQueue<>(Collections.reverseOrder());

for (int num : nums) {
  bottomK.offer(num);
  if (bottomK.size() > k) {
    bottomK.poll(); // remove largest — keeps only bottom K
  }
}
```

**Custom objects — Comparator patterns:**

```java
// Task sorted by (priority DESC, then arrival time ASC)
PriorityQueue<Task> scheduler = new PriorityQueue<>(
  (a, b) -> a.priority != b.priority
    ? b.priority - a.priority   // higher priority first
    : a.arrivalTime - b.arrivalTime  // earlier arrival as tiebreak
);

// Dijkstra node-distance pair
PriorityQueue<int[]> dijkstra = new PriorityQueue<>(
  Comparator.comparingInt(edge -> edge[1]) // sort by distance (index 1)
);
```

**Median of a stream — two heaps:**

```java
// Classic two-heap median finder
PriorityQueue<Integer> lower = new PriorityQueue<>(Collections.reverseOrder()); // max-heap
PriorityQueue<Integer> upper = new PriorityQueue<>(); // min-heap

// lower holds the smaller half, upper holds the larger half
// |lower.size() - upper.size()| <= 1

void addNum(int num) {
  lower.offer(num);
  upper.offer(lower.poll());   // balance: push cross-over element
  if (lower.size() < upper.size()) {
    lower.offer(upper.poll()); // re-balance
  }
}

double findMedian() {
  if (lower.size() > upper.size()) return lower.peek();
  return (lower.peek() + upper.peek()) / 2.0;
}
```

---

### 💥 War Story — Wrong Comparator Returned 0 = Silent Heap Corruption

A developer wrote a comparator for a `PriorityQueue<Task>` that sometimes returned 0 even when tasks were different:

```java
// ❌ Overflow risk AND wrong semantics
PriorityQueue<Task> pq = new PriorityQueue<>((a, b) -> a.score - b.score);
// If a.score = Integer.MIN_VALUE and b.score = 1:
// a.score - b.score = negative overflow → positive number → wrong order
```

For `Integer` values near `MIN_VALUE` or `MAX_VALUE`, subtraction overflows and produces the wrong sign. The heap appeared to work in unit tests (small values) but produced wrong ordering in production with real scores.

Fix: use `Integer.compare()` which handles overflow correctly:

```java
// ✅ Overflow-safe
PriorityQueue<Task> pq = new PriorityQueue<>((a, b) -> Integer.compare(a.score, b.score));
// Or: Comparator.comparingInt(t -> t.score)
```

---

### 📝 Practice Challenges

1. Given a stream of integers, return the median after each insertion. Implement with two `PriorityQueue`s.
2. Given `k` sorted arrays, merge them into one sorted array. Use a `PriorityQueue<int[]>` where each entry is `{value, arrayIndex, elementIndex}`.
3. A `PriorityQueue` doesn't support `contains()` in O(log n) — it's O(n). How do you efficiently check membership while maintaining heap order? (Hint: `HashMap` + heap)

---

## 6. BST → TreeMap and TreeSet

### 🧠 Foundation — The BST you built

A Binary Search Tree: left child < parent < right child. Search, insert, delete in O(h) where h = height. Balanced BST = O(log n):

```
     50
    /  \
  30    70
 /  \  /  \
20  40 60  80

Search 40: 40 < 50 → left; 40 > 30 → right; found!
```

---

### 🔍 The Java Classes

`TreeMap` and `TreeSet` are backed by a **Red-Black Tree** (self-balancing BST). All operations are O(log n):

```java
// TreeMap — sorted by key
TreeMap<Integer, String> treeMap = new TreeMap<>();
treeMap.put(50, "fifty");
treeMap.put(30, "thirty");
treeMap.put(70, "seventy");

// BST-specific operations — no equivalent in HashMap
treeMap.firstKey();           // 30 (minimum key)
treeMap.lastKey();            // 70 (maximum key)
treeMap.floorKey(45);         // 30 (largest key ≤ 45)
treeMap.ceilingKey(45);       // 50 (smallest key ≥ 45)
treeMap.higherKey(50);        // 70 (strictly greater than 50)
treeMap.lowerKey(50);         // 30 (strictly less than 50)
treeMap.headMap(50);          // {30="thirty"} (keys < 50)
treeMap.tailMap(50);          // {50="fifty", 70="seventy"} (keys ≥ 50)
treeMap.subMap(30, true, 70, false); // {30, 50} (inclusive start, exclusive end)

// TreeSet — sorted unique values (TreeMap with null values)
TreeSet<Integer> set = new TreeSet<>();
set.add(30); set.add(50); set.add(70);
set.floor(45);    // 30
set.ceiling(45);  // 50
set.headSet(50);  // [30]  (exclusive)
set.tailSet(50);  // [50, 70]  (inclusive)
```

---

### Algorithm Problems That Become Trivial With TreeMap

```
"Find nearest value to target in a sorted stream"
→ TreeSet.floor(target) and TreeSet.ceiling(target) → O(log n)

"Find all values in range [lo, hi]"
→ TreeMap.subMap(lo, true, hi, true) → O(log n + result size)

"Sliding window maximum" (hard LeetCode)
→ TreeMap<Integer, Integer> with frequency counts → O(n log n) vs O(n) with deque

"Number of integers in a stream less than X"
→ TreeMap<Integer, Integer> with cumulative count → O(log n) per query
```

---

### 📝 Practice Challenges

1. Given a stream of prices, after each price insertion, find the floor and ceiling price relative to the current market price. Use `TreeSet`.
2. Design a leaderboard where scores can be inserted, deleted, and you can query "what rank is score X?" Use `TreeMap<Integer, Integer>` (score → count) and `tailMap`.
3. `TreeMap` vs `HashMap` — a team switches from `TreeMap` to `HashMap` for "performance." They find one feature breaks. What feature?

---

## 7. HashSet → HashSet vs LinkedHashSet vs TreeSet

### 🧠 Foundation — The HashSet you built

Set = collection of unique elements. Backed by a HashMap (key = element, value = dummy object):

```java
Set<Integer> seen = new HashSet<>();
seen.add(5);     // O(1)
seen.add(5);     // duplicate — ignored
seen.contains(5); // O(1) — O(log n) for TreeSet
```

---

### 🔍 The Three Set Variants

The same three-way choice as Map, but without values:

| Class | Order | Null | Complexity |
|-------|-------|------|-----------|
| `HashSet` | No order | 1 null allowed | O(1) avg |
| `LinkedHashSet` | Insertion order | 1 null allowed | O(1) avg |
| `TreeSet` | Sorted order | No null | O(log n) |

**`HashSet`** — the default: fast O(1) membership checks, unordered:

```java
Set<String> visited = new HashSet<>();
visited.add("nodeA");
visited.contains("nodeA"); // O(1) — use this for DFS/BFS visited tracking
```

**`LinkedHashSet`** — insertion order preserved:

```java
Set<String> ordered = new LinkedHashSet<>();
// Useful when you need deduplication AND order preservation
// e.g., collect unique tokens in the order they first appeared
```

**`TreeSet`** — sorted, supports range operations:

```java
TreeSet<Integer> sorted = new TreeSet<>();
sorted.add(5); sorted.add(2); sorted.add(8);
// Always iterates: 2, 5, 8
sorted.subSet(2, true, 7, false); // {2, 5}
```

---

### The Algorithm Pattern Library

```java
// Count unique elements
long unique = Arrays.stream(nums).distinct().count();
// Or: new HashSet<>(Arrays.asList(nums)).size()

// Two-sum: "does a complement exist in the array?"
Set<Integer> seen = new HashSet<>();
for (int num : nums) {
  if (seen.contains(target - num)) return true;
  seen.add(num);
}

// Graph cycle detection (undirected)
Set<Integer> visited = new HashSet<>();
// DFS: if current node in visited → cycle

// Remove duplicates while preserving order
List<String> deduped = new ArrayList<>(new LinkedHashSet<>(original));
```

---

### 📝 Practice Challenges

1. Given an array with duplicates, return elements that appear more than once, in the order they first appeared. Use `LinkedHashSet` and another Set.
2. Design a "recent searches" feature that keeps the 10 most recent unique searches in order. Use `LinkedHashSet` with a size check.
3. Two `HashSet`s each with 1M elements. Find the intersection. What is the time and space complexity? Write the code.

---

## 8. Graph → Adjacency with HashMap<Node, List<Node>>

### 🧠 Foundation — The graph you built

Graphs in algorithms are usually represented as:
- Adjacency matrix: `int[][] matrix = new int[n][n]` — O(n²) space
- Adjacency list: `List<List<Integer>> adj = new ArrayList<>()` — O(V+E) space

---

### 🔍 The Java Production Pattern

For graphs with non-integer nodes (strings, objects), use `HashMap<Node, List<Node>>`:

```java
// String graph (e.g., word ladder, course dependencies)
Map<String, List<String>> graph = new HashMap<>();

void addEdge(String from, String to) {
  graph.computeIfAbsent(from, k -> new ArrayList<>()).add(to);
  // computeIfAbsent: if key doesn't exist, create new ArrayList; then add 'to'
}

// BFS on the graph
void bfs(String start) {
  Set<String> visited = new HashSet<>();
  Queue<String> queue = new ArrayDeque<>();
  queue.offer(start);
  visited.add(start);

  while (!queue.isEmpty()) {
    String node = queue.poll();
    for (String neighbor : graph.getOrDefault(node, List.of())) {
      if (!visited.contains(neighbor)) {
        visited.add(neighbor);
        queue.offer(neighbor);
      }
    }
  }
}
```

**Weighted graph — `Map<String, Map<String, Integer>>`:**

```java
// Dijkstra-ready adjacency map: node → {neighbor → weight}
Map<String, Map<String, Integer>> weighted = new HashMap<>();
weighted.computeIfAbsent("A", k -> new HashMap<>()).put("B", 4);
weighted.computeIfAbsent("A", k -> new HashMap<>()).put("C", 2);

// In Dijkstra:
PriorityQueue<int[]> pq = new PriorityQueue<>(Comparator.comparingInt(e -> e[1]));
// {node_index, distance}
for (Map.Entry<String, Integer> neighbor : weighted.get(current).entrySet()) {
  int newDist = dist + neighbor.getValue();
  pq.offer(new int[]{nodeIndex(neighbor.getKey()), newDist});
}
```

---

### The `computeIfAbsent` Pattern

This is the most common pattern for building adjacency lists:

```java
// Without computeIfAbsent (verbose):
if (!graph.containsKey(node)) {
  graph.put(node, new ArrayList<>());
}
graph.get(node).add(neighbor);

// With computeIfAbsent (idiomatic):
graph.computeIfAbsent(node, k -> new ArrayList<>()).add(neighbor);
```

Also useful for grouping (equivalent to GROUP BY in SQL):

```java
// Group words by their sorted characters (anagram groups)
Map<String, List<String>> groups = new HashMap<>();
for (String word : words) {
  char[] chars = word.toCharArray();
  Arrays.sort(chars);
  String key = new String(chars);
  groups.computeIfAbsent(key, k -> new ArrayList<>()).add(word);
}
```

---

### 📝 Practice Challenges

1. Build an adjacency list for a directed weighted graph from an edge list `int[][] edges = {{from, to, weight}, ...}`. Use `Map<Integer, Map<Integer, Integer>>`.
2. Implement topological sort using DFS and a `Deque<Integer>` (to build the result in reverse finish order).
3. Clone a directed graph where each node has a `val` and a `List<Node> neighbors`. Use `Map<Node, Node>` to track already-cloned nodes.

---

## Quick Reference: DSA → Java Collections Cheat Sheet

```
DSA concept              │ Java class(es)            │ Key operations
─────────────────────────┼───────────────────────────┼────────────────────────────────
Resizable array          │ ArrayList                 │ get(i) O(1), add O(1)* 
Doubly linked list       │ LinkedList / ArrayDeque   │ addFirst/Last O(1)
Stack (LIFO)             │ ArrayDeque.push/pop/peek  │ O(1) all
Queue (FIFO)             │ ArrayDeque.offer/poll     │ O(1) all
Priority queue (min)     │ PriorityQueue             │ offer O(log n), poll O(log n)
Priority queue (max)     │ PriorityQueue(reverseOrder)│ same
HashMap (unordered)      │ HashMap                   │ put/get O(1) avg
HashMap (insertion order)│ LinkedHashMap             │ put/get O(1) avg
HashMap (sorted keys)    │ TreeMap                   │ put/get O(log n), floor/ceiling
HashMap (thread-safe)    │ ConcurrentHashMap         │ put/get O(1) avg, concurrent
HashSet (unordered)      │ HashSet                   │ add/contains O(1)
HashSet (insertion order)│ LinkedHashSet             │ add/contains O(1)
HashSet (sorted)         │ TreeSet                   │ add/contains O(log n), floor/ceiling
BST range queries        │ TreeMap / TreeSet         │ floorKey, ceilingKey, subMap
Graph adjacency list     │ HashMap<K, List<K>>       │ computeIfAbsent
Graph weighted adjacency │ HashMap<K, Map<K, Int>>   │ computeIfAbsent
LRU cache                │ LinkedHashMap (access-order)│ removeEldestEntry
Frequency map            │ HashMap + merge()         │ map.merge(key, 1, Integer::sum)
Deque (double-ended)     │ ArrayDeque                │ addFirst/Last, pollFirst/Last
```

---

*[Back to Index](../00_INDEX.md) | [Java Collections Deep Dive](../../07_Modern_Java/Ch08_Collections_Internals.md) | [Java Path](../../PATH_JAVA_BACKEND.md)*


---

## Reality Check

**"Java Collections are interchangeable implementations"** — ArrayList and LinkedList both implement List with OPPOSITE performance profiles ([03_Algorithms/17, 13_DE arrays]): ArrayList is O(1) random access and cache-friendly, LinkedList is O(1) known-position insertion and cache-hostile — and ArrayList wins almost always because pointer-chasing is 10-100x slower than contiguous access. The fusion rounds drill choosing the collection for the access pattern and the complexity, and "interchangeable" is exactly the misconception that picks LinkedList for indexed access and pays the cache penalty.

**"HashMap is always O(1)"** — O(1) is average with a good hash and low load factor ([02_Data_Structures, 03_Algorithms/17]): a poor hash degrades to O(n) chains (Java 8 treeifies long chains to O(log n) for Comparable keys), the resize is O(n) amortized, and the mutable key that changes hash after insertion is stranded forever. The fusion rounds drill the HashMap internals that matter for the DSA (the load factor, the treeification, the key contract — [16_JS] boxed-equality's Java cousin), and "always O(1)" misses the worst-case and the key-contract traps.

**"TreeMap is a sorted HashMap"** — TreeMap is O(log n) (versus HashMap's O(1) average) and offers RANGE operations HashMap cannot ([02_Data_Structures, 03_Algorithms/17]): floorKey, ceilingKey, subMap, headMap — all O(log n), for the ordered-iteration and range-query needs. The fusion rounds drill choosing TreeMap for the range/ordered operations versus HashMap for pure lookup, and "sorted HashMap" undersells the range-operation capability that is TreeMap's actual value and the reason to accept its log-n cost.

**"The right collection is obvious from the problem"** — The choice weighs the OPERATIONS you need and their frequencies ([03_Algorithms/17, 14_MM]): the PriorityQueue for repeated-min-extraction (a heap, not a sorted structure — [15_Heap]), the LinkedHashMap for insertion-or-access order (the LRU backbone — [05_Problem_Solving/21]), the ArrayDeque for stack-or-queue (never the legacy synchronized Stack), the TreeSet for ordered-unique. The fusion rounds drill matching the collection to the operation profile, and "obvious" misses the cases (the LinkedHashMap for LRU, the ArrayDeque over Stack, the PriorityQueue's min-heap default) that require knowing the collections' specific capabilities.

**"Generics are just type safety on collections"** — Generics enable type-safe generic ALGORITHMS and carry Java-specific constraints ([03_Algorithms/17, 17_TypeScript]): the single mergeSort for any Comparable, AND the type erasure that forbids new T[], instanceof on generic types, and new T() (the [17_TS] erasure, Java flavor). The fusion rounds drill the generic-collection-algorithm implementation (the bounded type parameters, the Comparable/Comparator, the erasure workarounds), and "just type safety" misses that generics shape HOW you implement generic data structures and algorithms in Java, including the erasure constraints that the implementation must work around.
