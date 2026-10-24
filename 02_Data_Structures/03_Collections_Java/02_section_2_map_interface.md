# 📌 Section 2: Map Interface

> **Navigation**: [← Complete Understanding of Java Collections](01_complete_understanding_of_java_collections.md) | [Chapter overview](../03_Collections_Java.md) | [University-Level Addendum — Java… →](03_university_level_addendum_java_collections_as.md)
> Page 2 of 3 in **Java Collections: Complete Method Reference Tables**


## 💬 Study-Partner View — Map Interface

**1. The bottom line:** `Map` stores key → value pairs so you can look up a value by its key instead of by position.

**2. The textbook core:**

- `HashMap`: average O(1), unordered. `LinkedHashMap`: O(1), keeps insertion (or access) order. `TreeMap`: O(log n), sorted by key, supports `floorKey`/`ceilingKey`/`subMap`.
- `ConcurrentHashMap` for thread-safe access.
- Common methods: `put`, `get`, `getOrDefault`, `containsKey`, `merge`, `computeIfAbsent`, `entrySet`.
- `Map` is **not** a `Collection`.

**3. The real-world analogy:** A **dictionary or contact list**: you look up a name (key) and get a number (value); two entries cannot have the same name.

**4. Walkthrough:**

1. `Map<String,Integer> count = new HashMap<>();`
2. For each word `w`: `count.merge(w, 1, Integer::sum);`
3. After "a b a": `{a=2, b=1}`.
4. Print in sorted key order by copying into `new TreeMap<>(count)`.

> [!NOTE]
> **Quick check:** When do you need `LinkedHashMap`? *For predictable iteration order, or as an LRU cache with access order.*


## HashMap Methods (CRITICAL for DSA!)

| Method            | Return Type     | Signature                        | Description                  | Time |
| ----------------- | --------------- | -------------------------------- | ---------------------------- | ---- |
| `put`             | V               | `put(K key, V value)`            | Adds/updates key-value       | O(1) |
| `get`             | V               | `get(Object key)`                | Returns value for key        | O(1) |
| `getOrDefault`    | V               | `getOrDefault(K key, V default)` | Returns value or default     | O(1) |
| `remove`          | V               | `remove(Object key)`             | Removes entry, returns value | O(1) |
| `containsKey`     | boolean         | `containsKey(Object key)`        | True if key exists           | O(1) |
| `containsValue`   | boolean         | `containsValue(Object value)`    | True if value exists         | O(n) |
| `keySet`          | Set<K>          | `keySet()`                       | Returns set of all keys      | O(1) |
| `values`          | Collection<V>   | `values()`                       | Returns collection of values | O(1) |
| `entrySet`        | Set<Entry<K,V>> | `entrySet()`                     | Returns set of entries       | O(1) |
| `size`            | int             | `size()`                         | Number of entries            | O(1) |
| `isEmpty`         | boolean         | `isEmpty()`                      | True if empty                | O(1) |
| `clear`           | void            | `clear()`                        | Removes all entries          | O(n) |
| `putIfAbsent`     | V               | `putIfAbsent(K key, V value)`    | Adds only if key absent      | O(1) |
| `computeIfAbsent` | V               | `computeIfAbsent(K, Function)`   | Computes if absent           | O(1) |
| `merge`           | V               | `merge(K, V, BiFunction)`        | Merges values                | O(1) |

### ⭐ DSA Pattern Examples

```java
HashMap<Integer, Integer> map = new HashMap<>();

// ===== TWO SUM PATTERN =====
int[] nums = {2, 7, 11, 15};
int target = 9;

for (int i = 0; i < nums.length; i++) {
    int complement = target - nums[i];
    if (map.containsKey(complement)) {
        // Found! map.get(complement) and i are the indices
    }
    map.put(nums[i], i);  // Store: number → index
}

// ===== FREQUENCY COUNT PATTERN =====
int[] arr = {1, 2, 2, 3, 3, 3};
HashMap<Integer, Integer> freq = new HashMap<>();

for (int num : arr) {
    // Method 1: Traditional
    freq.put(num, freq.getOrDefault(num, 0) + 1);

    // Method 2: Using merge
    freq.merge(num, 1, Integer::sum);

    // Method 3: Using compute
    freq.compute(num, (k, v) -> v == null ? 1 : v + 1);
}
// freq = {1=1, 2=2, 3=3}

// ===== GROUP BY PATTERN =====
String[] words = {"eat", "tea", "tan", "ate", "nat", "bat"};
HashMap<String, List<String>> groups = new HashMap<>();

for (String word : words) {
    char[] chars = word.toCharArray();
    Arrays.sort(chars);
    String key = new String(chars);

    // computeIfAbsent: Create list if not exists, then add
    groups.computeIfAbsent(key, k -> new ArrayList<>()).add(word);
}
// groups = {"aet"=["eat","tea","ate"], "ant"=["tan","nat"], "abt"=["bat"]}

// ===== ITERATING PATTERNS =====
// By keys
for (Integer key : map.keySet()) {
    System.out.println(key + " -> " + map.get(key));
}

// By entries (MOST EFFICIENT)
for (Map.Entry<Integer, Integer> entry : map.entrySet()) {
    System.out.println(entry.getKey() + " -> " + entry.getValue());
}

// Using forEach
map.forEach((key, value) -> System.out.println(key + " -> " + value));
```

**Challenge 2 (Bug Hunt):** Two `Person` objects with same name and age. You override `equals()` to return true but not `hashCode()`. What happens when used as `HashMap` keys?

<details><summary>Answer</summary>

Both objects land in DIFFERENT buckets (different hashCodes → different bucket index). The HashMap doesn't check `equals()` across buckets — it goes straight to one bucket. So `map.get(person2)` returns NULL even though `person1.equals(person2)`. Overriding `equals` without `hashCode` violates the contract and breaks all hash-based collections. Always override both together.

</details>

**Challenge 3 (Design):** `ConcurrentHashMap` uses lock striping on 16 segments (JDK 7) instead of a single global lock. What's the performance trade-off vs `Hashtable` and vs JDK 8's CAS-based approach?

<details><summary>Answer</summary>

**Single lock (Hashtable)**: One `synchronized` block guards all buckets. Throughput = 1 thread at a time. Simple but bottlenecks under concurrency.

**Lock striping (JDK 7 CHM, 16 segments)**: Each segment locks independently. Up to 16 threads operate in parallel if they touch different segments. `size()` and `clear()` must lock ALL segments → O(16) = O(1) but with high contention cost.

**CAS-based (JDK 8+)**: Fine-grained per-bucket locking replaced by `Unsafe.compareAndSwap`. No lock for read-heavy operations. For write-heavy: still uses synchronized on individual buckets when CAS fails (high contention → fallback). `size()` is estimated, not precise, avoiding full-lock scans.

Trade-off summary: Lock striping → more parallelism, less contention. CAS → lowest overhead for low-contention writes, but complex retry logic. Always benchmark with realistic concurrency levels before choosing.

</details>

## TreeMap Methods (Sorted Order)

| Method       | Return Type | Signature              | Description          | Time     |
| ------------ | ----------- | ---------------------- | -------------------- | -------- |
| `put`        | V           | `put(K key, V value)`  | Adds/updates         | O(log n) |
| `get`        | V           | `get(Object key)`      | Returns value        | O(log n) |
| `firstKey`   | K           | `firstKey()`           | Returns smallest key | O(log n) |
| `lastKey`    | K           | `lastKey()`            | Returns largest key  | O(log n) |
| `ceilingKey` | K           | `ceilingKey(K key)`    | Smallest key ≥ given | O(log n) |
| `floorKey`   | K           | `floorKey(K key)`      | Largest key ≤ given  | O(log n) |
| `higherKey`  | K           | `higherKey(K key)`     | Smallest key > given | O(log n) |
| `lowerKey`   | K           | `lowerKey(K key)`      | Largest key < given  | O(log n) |
| `subMap`     | SortedMap   | `subMap(K from, K to)` | View of portion      | O(1)     |
| `headMap`    | SortedMap   | `headMap(K to)`        | Keys < to            | O(1)     |
| `tailMap`    | SortedMap   | `tailMap(K from)`      | Keys ≥ from          | O(1)     |

```java
TreeMap<Integer, String> treeMap = new TreeMap<>();
treeMap.put(5, "Five");
treeMap.put(1, "One");
treeMap.put(10, "Ten");
// Automatically sorted: {1=One, 5=Five, 10=Ten}

treeMap.firstKey();       // 1
treeMap.lastKey();        // 10
treeMap.ceilingKey(3);    // 5 (smallest >= 3)
treeMap.floorKey(7);      // 5 (largest <= 7)
```

---

🔬 **Section Challenge — TreeMap Methods (Sorted Order)**

**Challenge 1 (Reasoning):** When should you use `TreeMap` over `HashMap`? What's the actual performance cost?

<details><summary>Answer</summary>

`TreeMap` use cases: range queries (`subMap`, `headMap`, `tailMap`), ordered iteration, `floorKey`/`ceilingKey`. Cost: every operation is O(log N) vs O(1) avg for HashMap. For 1M entries: HashMap ~1μs, TreeMap ~20μs per operation. Use TreeMap ONLY when sorted order is required — not as a default.

</details>

## 📌 Section 3: Set Interface

### 💬 Study-Partner View — Set Interface

**1. The bottom line:** `Set` is a collection that refuses duplicates, so "is it in there?" is its main question.

**2. The textbook core:**

- `HashSet`: O(1) average, unordered. `LinkedHashSet`: insertion order. `TreeSet`: sorted, O(log n), with `first`, `last`, `floor`, `ceiling`.
- A `HashSet` is backed by a `HashMap` (elements are keys).
- Duplicates are detected with `equals` and `hashCode`.
- Set operations: `retainAll` (intersection), `addAll` (union), `removeAll` (difference).

**3. The real-world analogy:** A **guest list at a club**: your name is either on it or not, and writing it twice makes no difference.

**4. Walkthrough:**

1. `Set<Integer> seen = new HashSet<>();`
2. `seen.add(3)` → true (new). `seen.add(3)` → false (already there).
3. `seen.contains(3)` → true in O(1).
4. Use the return value of `add` to detect duplicates in a single pass.

> [!NOTE]
> **Quick check:** Which set gives sorted iteration? *`TreeSet`.*


### HashSet Methods

| Method     | Return Type | Signature            | Description                   | Time |
| ---------- | ----------- | -------------------- | ----------------------------- | ---- |
| `add`      | boolean     | `add(E e)`           | Adds element, false if exists | O(1) |
| `remove`   | boolean     | `remove(Object o)`   | Removes element               | O(1) |
| `contains` | boolean     | `contains(Object o)` | True if element exists        | O(1) |
| `size`     | int         | `size()`             | Number of elements            | O(1) |
| `isEmpty`  | boolean     | `isEmpty()`          | True if empty                 | O(1) |
| `clear`    | void        | `clear()`            | Removes all elements          | O(n) |
| `iterator` | Iterator<E> | `iterator()`         | Returns iterator              | O(1) |
| `toArray`  | Object[]    | `toArray()`          | Returns array                 | O(n) |

#### ⭐ DSA Pattern Examples

```java
HashSet<Integer> set = new HashSet<>();

// ===== CONTAINS DUPLICATE PATTERN =====
int[] nums = {1, 2, 3, 1};
for (int num : nums) {
    if (!set.add(num)) {
        // Duplicate found! add() returns false if already exists
        System.out.println("Duplicate: " + num);
    }
}

// ===== INTERSECTION OF TWO ARRAYS =====
HashSet<Integer> set1 = new HashSet<>(Arrays.asList(1, 2, 3, 4));
HashSet<Integer> set2 = new HashSet<>(Arrays.asList(3, 4, 5, 6));

// Intersection: elements in both
HashSet<Integer> intersection = new HashSet<>(set1);
intersection.retainAll(set2);  // {3, 4}

// Union: elements in either
HashSet<Integer> union = new HashSet<>(set1);
union.addAll(set2);  // {1, 2, 3, 4, 5, 6}

// Difference: elements in set1 but not set2
HashSet<Integer> diff = new HashSet<>(set1);
diff.removeAll(set2);  // {1, 2}

// ===== UNIQUE CHARACTERS PATTERN =====
String s = "hello";
HashSet<Character> chars = new HashSet<>();
for (char c : s.toCharArray()) {
    chars.add(c);
}
// chars = {h, e, l, o}
```

### TreeSet Methods (Sorted Order)

| Method      | Return Type | Signature      | Description      | Time     |
| ----------- | ----------- | -------------- | ---------------- | -------- |
| `add`       | boolean     | `add(E e)`     | Adds element     | O(log n) |
| `first`     | E           | `first()`      | Returns smallest | O(log n) |
| `last`      | E           | `last()`       | Returns largest  | O(log n) |
| `ceiling`   | E           | `ceiling(E e)` | Smallest ≥ e     | O(log n) |
| `floor`     | E           | `floor(E e)`   | Largest ≤ e      | O(log n) |
| `higher`    | E           | `higher(E e)`  | Smallest > e     | O(log n) |
| `lower`     | E           | `lower(E e)`   | Largest < e      | O(log n) |
| `pollFirst` | E           | `pollFirst()`  | Removes smallest | O(log n) |
| `pollLast`  | E           | `pollLast()`   | Removes largest  | O(log n) |

```java
TreeSet<Integer> treeSet = new TreeSet<>();
treeSet.add(5);
treeSet.add(1);
treeSet.add(10);
// Automatically sorted: [1, 5, 10]

treeSet.first();      // 1
treeSet.last();       // 10
treeSet.ceiling(3);   // 5 (smallest >= 3)
treeSet.floor(7);     // 5 (largest <= 7)
```

---

## 📬 Section 4: Queue Interface

### 💬 Study-Partner View — Queue Interface

**1. The bottom line:** `Queue` is for "process in order": add at the back, take from the front (or by priority).

**2. The textbook core:**

- Methods come in two flavours: throwing (`add`, `remove`, `element`) and safe (`offer`, `poll`, `peek` return `false`/`null`).
- `ArrayDeque`: fast FIFO/LIFO, no nulls. `LinkedList`: allows nulls, slower. `PriorityQueue`: min-heap by default, `poll` returns the smallest, O(log n).
- `BlockingQueue` implementations coordinate producer/consumer threads.
- Iterating a `PriorityQueue` is **not** in sorted order.

**3. The real-world analogy:** A **ticket line**: `offer` joins the back, `poll` serves the front; a priority queue is an **emergency room** where the most urgent patient is served first.

**4. Walkthrough:**

1. `Queue<Integer> q = new ArrayDeque<>();`
2. `q.offer(1); q.offer(2); q.offer(3);`
3. `q.poll()` → 1, `q.peek()` → 2.
4. With `PriorityQueue` and offers 5, 1, 3, `poll()` returns 1, then 3, then 5.

> [!NOTE]
> **Quick check:** Why prefer `offer`/`poll` over `add`/`remove`? *They signal failure with a return value instead of throwing exceptions.*


### Queue/Deque Methods (Using ArrayDeque)

| Method    | Return Type | Signature    | Description  | Throws?   |
| --------- | ----------- | ------------ | ------------ | --------- |
| `add`     | boolean     | `add(E e)`   | Adds to tail | Yes       |
| `offer`   | boolean     | `offer(E e)` | Adds to tail | No        |
| `remove`  | E           | `remove()`   | Removes head | Yes       |
| `poll`    | E           | `poll()`     | Removes head | No (null) |
| `element` | E           | `element()`  | Returns head | Yes       |
| `peek`    | E           | `peek()`     | Returns head | No (null) |

#### ArrayDeque as Queue

```java
// PREFER ArrayDeque over LinkedList for Queue operations!
Deque<Integer> queue = new ArrayDeque<>();

// BFS PATTERN
queue.offer(startNode);  // Add to back
while (!queue.isEmpty()) {
    int current = queue.poll();  // Remove from front
    // Process current
    for (int neighbor : getNeighbors(current)) {
        queue.offer(neighbor);  // Add neighbors to back
    }
}
```

### PriorityQueue Methods (Heap)

| Method        | Return Type | Signature          | Description        | Time     |
| ------------- | ----------- | ------------------ | ------------------ | -------- |
| `add`/`offer` | boolean     | `offer(E e)`       | Adds element       | O(log n) |
| `peek`        | E           | `peek()`           | Returns min/max    | O(1)     |
| `poll`        | E           | `poll()`           | Removes min/max    | O(log n) |
| `remove`      | boolean     | `remove(Object o)` | Removes element    | O(n)     |
| `size`        | int         | `size()`           | Number of elements | O(1)     |
| `toArray`     | Object[]    | `toArray()`        | Returns array      | O(n)     |

#### ⭐ DSA Pattern Examples

```java
// MIN HEAP (Default)
PriorityQueue<Integer> minHeap = new PriorityQueue<>();
minHeap.offer(5);
minHeap.offer(1);
minHeap.offer(10);
minHeap.peek();   // 1 (smallest)
minHeap.poll();   // 1 (removes smallest)

// MAX HEAP
PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Collections.reverseOrder());
// OR
PriorityQueue<Integer> maxHeap = new PriorityQueue<>((a, b) -> b - a);
maxHeap.offer(5);
maxHeap.offer(1);
maxHeap.offer(10);
maxHeap.peek();   // 10 (largest)

// ===== KTH LARGEST ELEMENT PATTERN =====
// Use min heap of size k
int k = 3;
PriorityQueue<Integer> heap = new PriorityQueue<>();
for (int num : nums) {
    heap.offer(num);
    if (heap.size() > k) {
        heap.poll();  // Remove smallest, keep k largest
    }
}
// heap.peek() is kth largest!

// ===== MERGE K SORTED LISTS PATTERN =====
PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] - b[0]);
// Add first element of each list with list index
// Poll smallest, add next from same list
```

---

## 📚 Section 5: Stack Operations

### Using ArrayDeque as Stack (RECOMMENDED)

| Method    | Return Type | Signature   | Description                  |
| --------- | ----------- | ----------- | ---------------------------- |
| `push`    | void        | `push(E e)` | Adds to top                  |
| `pop`     | E           | `pop()`     | Removes and returns top      |
| `peek`    | E           | `peek()`    | Returns top without removing |
| `isEmpty` | boolean     | `isEmpty()` | True if empty                |

```java
// PREFER ArrayDeque over Stack class!
Deque<Integer> stack = new ArrayDeque<>();

// VALID PARENTHESES PATTERN
String s = "([{}])";
for (char c : s.toCharArray()) {
    if (c == '(') stack.push(')');
    else if (c == '[') stack.push(']');
    else if (c == '{') stack.push('}');
    else {
        if (stack.isEmpty() || stack.pop() != c) {
            return false;
        }
    }
}
return stack.isEmpty();

// MONOTONIC STACK PATTERN - Next Greater Element
int[] nums = {4, 5, 2, 10, 8};
int[] result = new int[nums.length];
Deque<Integer> stack = new ArrayDeque<>();  // Store indices

for (int i = 0; i < nums.length; i++) {
    while (!stack.isEmpty() && nums[stack.peek()] < nums[i]) {
        result[stack.pop()] = nums[i];  // nums[i] is next greater
    }
    stack.push(i);
}
// Remaining in stack have no next greater
while (!stack.isEmpty()) {
    result[stack.pop()] = -1;
}
```

---

## 📝 Section 6: String Builder

### StringBuilder Methods (For String Manipulation)

| Method         | Return Type   | Signature                      | Description         | Time   |
| -------------- | ------------- | ------------------------------ | ------------------- | ------ |
| `append`       | StringBuilder | `append(x)`                    | Adds to end         | O(n)\* |
| `insert`       | StringBuilder | `insert(int offset, x)`        | Inserts at position | O(n)   |
| `delete`       | StringBuilder | `delete(int start, int end)`   | Removes range       | O(n)   |
| `deleteCharAt` | StringBuilder | `deleteCharAt(int index)`      | Removes char        | O(n)   |
| `reverse`      | StringBuilder | `reverse()`                    | Reverses string     | O(n)   |
| `setCharAt`    | void          | `setCharAt(int index, char c)` | Changes char        | O(1)   |
| `charAt`       | char          | `charAt(int index)`            | Returns char        | O(1)   |
| `length`       | int           | `length()`                     | Returns length      | O(1)   |
| `toString`     | String        | `toString()`                   | Converts to String  | O(n)   |
| `substring`    | String        | `substring(int start)`         | Returns substring   | O(n)   |

\*O(1) amortized

```java
StringBuilder sb = new StringBuilder();

// BUILD STRING EFFICIENTLY
for (int i = 0; i < n; i++) {
    sb.append(i).append(",");  // Can chain
}
String result = sb.toString();

// REVERSE STRING
sb.reverse();

// CHARACTER MANIPULATION
sb.setCharAt(0, 'X');
char c = sb.charAt(0);

// DELETE LAST CHAR (Common pattern)
if (sb.length() > 0) {
    sb.deleteCharAt(sb.length() - 1);
}
```

---

🔬 **Section Challenge — StringBuilder Methods (For String Manipulation)**

**Challenge 1 (Reasoning):** Why is `String str = ""; for(int i=0;i<1000;i++) str += i;` O(N²) and how does StringBuilder fix it?

<details><summary>Answer</summary>

Each `+=` creates a NEW String object: copies all existing chars + appends new char. Iteration 1: copy 1 char. Iteration 2: copy 2 chars. ... Iteration N: copy N chars. Total: 1+2+...+N = N(N+1)/2 = O(N²) character copies. StringBuilder uses a resizable internal array. `append()` adds to the end: O(1) amortized. Final `toString()`: O(N) once. Total: O(N).

</details>

## 📊 Section 7: Arrays Utility Class

### Static Methods in java.util.Arrays

| Method         | Return Type | Signature                           | Description           | Time       |
| -------------- | ----------- | ----------------------------------- | --------------------- | ---------- |
| `sort`         | void        | `Arrays.sort(arr)`                  | Sorts array           | O(n log n) |
| `sort`         | void        | `Arrays.sort(arr, from, to)`        | Sorts range           | O(k log k) |
| `binarySearch` | int         | `Arrays.binarySearch(arr, key)`     | Binary search         | O(log n)   |
| `fill`         | void        | `Arrays.fill(arr, val)`             | Fills with value      | O(n)       |
| `equals`       | boolean     | `Arrays.equals(arr1, arr2)`         | Compares arrays       | O(n)       |
| `copyOf`       | T[]         | `Arrays.copyOf(arr, newLen)`        | Copies with length    | O(n)       |
| `copyOfRange`  | T[]         | `Arrays.copyOfRange(arr, from, to)` | Copies range          | O(k)       |
| `asList`       | List<T>     | `Arrays.asList(arr)`                | Converts to list      | O(1)       |
| `toString`     | String      | `Arrays.toString(arr)`              | String representation | O(n)       |
| `stream`       | Stream<T>   | `Arrays.stream(arr)`                | Creates stream        | O(1)       |

```java
int[] arr = {3, 1, 4, 1, 5, 9};

// Sorting
Arrays.sort(arr);  // [1, 1, 3, 4, 5, 9]

// Sort with custom comparator (for Integer[] only)
Integer[] arr2 = {3, 1, 4, 1, 5, 9};
Arrays.sort(arr2, (a, b) -> b - a);  // Descending: [9, 5, 4, 3, 1, 1]

// Binary Search (MUST be sorted first!)
int idx = Arrays.binarySearch(arr, 4);  // Returns index or (-insertionPoint - 1)

// Fill
int[] dp = new int[n];
Arrays.fill(dp, Integer.MAX_VALUE);

// Print array
System.out.println(Arrays.toString(arr));  // [1, 1, 3, 4, 5, 9]

// 2D array
int[][] matrix = {{1, 2}, {3, 4}};
System.out.println(Arrays.deepToString(matrix));  // [[1, 2], [3, 4]]
```

---

## 📌 Section 8: Collections Utility Class

### Static Methods in java.util.Collections

| Method         | Return Type | Signature                                | Description       |
| -------------- | ----------- | ---------------------------------------- | ----------------- |
| `sort`         | void        | `Collections.sort(list)`                 | Sorts list        |
| `reverse`      | void        | `Collections.reverse(list)`              | Reverses list     |
| `shuffle`      | void        | `Collections.shuffle(list)`              | Randomizes order  |
| `max`          | T           | `Collections.max(collection)`            | Returns maximum   |
| `min`          | T           | `Collections.min(collection)`            | Returns minimum   |
| `frequency`    | int         | `Collections.frequency(c, obj)`          | Count occurrences |
| `binarySearch` | int         | `Collections.binarySearch(list, key)`    | Binary search     |
| `swap`         | void        | `Collections.swap(list, i, j)`           | Swaps elements    |
| `rotate`       | void        | `Collections.rotate(list, distance)`     | Rotates elements  |
| `replaceAll`   | boolean     | `Collections.replaceAll(list, old, new)` | Replaces all      |

```java
List<Integer> list = new ArrayList<>(Arrays.asList(3, 1, 4, 1, 5));

Collections.sort(list);      // [1, 1, 3, 4, 5]
Collections.reverse(list);   // [5, 4, 3, 1, 1]
Collections.max(list);       // 5
Collections.min(list);       // 1
Collections.frequency(list, 1);  // 2

// Reverse order comparator
Collections.sort(list, Collections.reverseOrder());  // [5, 4, 3, 1, 1]
```

---

## 📖 Section 9: Quick Reference Tables

### When to Use Which Collection?

| Need                        | Use           | Reason                    |
| --------------------------- | ------------- | ------------------------- |
| Fast access by index        | ArrayList     | O(1) random access        |
| Fast insert/delete at ends  | ArrayDeque    | O(1) operations           |
| Fast insert/delete anywhere | LinkedList    | O(1) if position known    |
| Fast lookup by key          | HashMap       | O(1) average              |
| Sorted key lookup           | TreeMap       | O(log n), maintains order |
| Unique elements             | HashSet       | O(1) add/contains         |
| Sorted unique elements      | TreeSet       | O(log n), maintains order |
| FIFO queue                  | ArrayDeque    | offer/poll                |
| Priority processing         | PriorityQueue | Heap operations           |
| LIFO stack                  | ArrayDeque    | push/pop                  |

### Complexity Cheat Sheet

| Operation        | ArrayList | LinkedList | HashMap | TreeMap  | HashSet | TreeSet  |
| ---------------- | --------- | ---------- | ------- | -------- | ------- | -------- |
| Access by index  | O(1)      | O(n)       | -       | -        | -       | -        |
| Add/Remove end   | O(1)\*    | O(1)       | -       | -        | -       | -        |
| Add/Remove begin | O(n)      | O(1)       | -       | -        | -       | -        |
| Add/Contains     | -         | -          | O(1)    | O(log n) | O(1)    | O(log n) |
| Get by key       | -         | -          | O(1)    | O(log n) | -       | -        |
| Sorted order     | No        | No         | No      | Yes      | No      | Yes      |

---

## 🧩 Section 9b: Production Failure Modes

> **Real-World Incidents**: These are the bugs that bring down production systems. Know the mechanism, know the fix.

| Failure Mode                                                      | Mechanism                                                                                                                                                                                                                                                                                                                            | Debugging Step / Fix Pattern                                                                                                                                                                                                |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Vector thread-safety overhead**                                 | `Vector` synchronizes every method with `synchronized` — even reads. In a read-heavy system (e.g., config cache), threads queue up on a single intrinsic lock. Throughput collapses under concurrent reads.                                                                                                                          | Replace `Vector` with `ArrayList` + external `Collections.synchronizedList()` only if needed, or use `CopyOnWriteArrayList` for read-heavy scenarios. Better: eliminate shared state entirely.                              |
| **Hashtable null-key NPE**                                        | `Hashtable.put(null, value)` throws `NullPointerException` at runtime. `HashMap` permits one null key. If code is migrated from `Hashtable` to `HashMap` and a null-check is removed, a formerly-silent failure becomes a silent success — or vice versa.                                                                            | Add explicit null checks before insertion: `if (key == null) throw new IllegalArgumentException("null key")`. Use `Optional` to signal absent values instead of null.                                                       |
| **`ConcurrentModificationException` during iteration + mutation** | A thread iterates a collection while another thread modifies it (add/remove). The iterator maintains a `modCount`; if it changes mid-iteration, `ConcurrentModificationException` is thrown. Applies to `ArrayList`, `HashMap`, `HashSet`, etc. `synchronized` blocks or iterators do NOT protect against cross-thread modification. | Use the iterator's own `remove()`: `iterator.remove()`. Or copy before iterating: `for (String s : new ArrayList<>(list))`. For maps: `entrySet` iterator remove is safe. Never use `forEach` with side-effecting mutation. |
| **ArrayList vs LinkedList wrong choice in production**            | `LinkedList` has O(n) per-element traversal due to pointer chasing and cache misses. Under load, a "fast insert/delete" LinkedList in a hot path (e.g., event queue, sliding window) causes CPU stall spikes. `ArrayList` is cache-friendly — adjacent elements share a cache line, making iteration 5-10x faster in practice.       | Profile before choosing. Default to `ArrayList`. Use `ArrayDeque` for queue/stack. Only use `LinkedList` when pointer-anchored O(1) insert/delete at known positions is genuinely required and the data set is small.       |

### Quick Reference: Thread-Safe vs Unsafe

| Collection             | Thread-Safe?        | Null Keys             | Notes                                                         |
| ---------------------- | ------------------- | --------------------- | ------------------------------------------------------------- |
| `ArrayList`            | No                  | Yes                   | Use `Collections.synchronizedList()` for thread-safe wrapping |
| `LinkedList`           | No                  | Yes                   | Prefer `ArrayDeque` for queue/stack                           |
| `Vector`               | Yes (full)          | No                    | Deprecated for new code — use `ArrayList` + external sync     |
| `HashMap`              | No                  | One null key          | Use `ConcurrentHashMap` for concurrent access                 |
| `Hashtable`            | Yes (full)          | No null keys          | Deprecated — use `ConcurrentHashMap`                          |
| `ConcurrentHashMap`    | Yes (lock-striped)  | No null keys (JDK 8+) | Preferred concurrent map; `computeIfAbsent` is atomic         |
| `CopyOnWriteArrayList` | Yes (copy-on-write) | Yes                   | Good for read-heavy, rarely-written data                      |

---

## 📐 Section 9c: Invariant Statements

> **Invariant**: A condition that is always true for a correctly functioning object. Knowing invariants explains WHY operations are O(1) or O(log N) and helps you detect corruption.

### ArrayList Invariant

```
elementData[0..size-1]  → valid, non-null elements (in insertion order)
elementData[size..capacity-1]  → null slots (always null after constructor)
size ≥ 0
capacity ≥ size + 1
Resize triggers when: size == elementData.length
```

**Why O(1) amortized add**: Capacity doubles on resize. N insertions cost 1+2+4+...+N = 2N = O(N). Amortized per insert = O(N)/N = O(1). The null-slot invariant guarantees no bounds-check on append path.

### HashMap Invariant

```
0.75  ≤  load factor  ≤  1.0          (default: 0.75)
threshold = capacity × loadFactor
Resize when: size  >  threshold
Average chain length: O(1)       (hash function distributes keys uniformly)
No bucket contains a reference to null unless size == 0
```

**Why O(1) average get**: Good hash → bucket index = O(1). Hash collision (worst case) → all keys in one bucket → O(n). Load factor 0.75 keeps chains short. The `size > threshold` invariant guarantees the table never grows beyond O(N) entries.

### TreeMap Invariant (Red-Black Tree)

```
Red-Black properties:
  1. Every node is either RED or BLACK
  2. Root is BLACK
  3. Every leaf (NIL) is BLACK
  4. Red node: both children are BLACK (no red-red edges)
  5. For every node: all simple paths to descendant leaves
     have the same BLACK height
Height bound: h ≤ 2 × log₂(n+1)
Therefore: get/put/remove = O(log n) guaranteed
```

**Why O(log N) guaranteed**: Unlike a plain BST which can degrade to O(N) with sorted input, the RB-tree re-balances on every insertion/deletion, keeping height proportional to log₂(N). This is why `TreeMap.ceilingKey()` and range queries (`subMap`) are always O(log N).

### ConcurrentHashMap Invariant (JDK 7 / lock-striped design)

```
16 segments by default (concurrencyLevel = 16)
Each segment behaves like a mini HashMap with its own lock
Segment[i] owns bucket range: i to i+capacity-1 (mod 16)
Operations targeting different segments: no contention — parallel
Operations targeting same segment: serialized by segment lock
Resize per-segment: independent of other segments
```

**Why lock striping beats one lock**: Full synchronization (Hashtable) makes all operations sequential → 1 thread at a time. Lock striping allows up to 16 concurrent operations on different segments. Trade-off: operations spanning multiple segments (e.g., `size()`) require acquiring all segment locks (expensive). JDK 8 replaced this with CAS-based approach for finer granularity.

---

## 🧩 Section 10: DSA Problem → Collection Mapping

| Problem Type       | Primary Collection      | Why                      |
| ------------------ | ----------------------- | ------------------------ |
| Two Sum            | HashMap                 | Store complement → index |
| Frequency Count    | HashMap                 | Key → count              |
| Contains Duplicate | HashSet                 | O(1) duplicate check     |
| Anagram Grouping   | HashMap                 | Sorted key → list        |
| Valid Parentheses  | Stack (ArrayDeque)      | Match pairs              |
| BFS                | Queue (ArrayDeque)      | Level-order processing   |
| DFS                | Stack or Recursion      | Depth-first processing   |
| Kth Largest        | PriorityQueue           | Min heap of size k       |
| Merge K Lists      | PriorityQueue           | Always get minimum       |
| LRU Cache          | HashMap + LinkedList    | O(1) access + order      |
| Sliding Window Max | ArrayDeque              | Monotonic deque          |
| Top K Frequent     | HashMap + PriorityQueue | Count then sort          |
| Interval Problems  | TreeMap                 | Sorted by start          |

---

[← Complete Understanding of Java Collections](01_complete_understanding_of_java_collections.md) | [Chapter overview](../03_Collections_Java.md) | [University-Level Addendum — Java… →](03_university_level_addendum_java_collections_as.md)
