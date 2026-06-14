**Navigation**: [< Previous](02a_DS_Variants_Core.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](04_2D_Arrays_Matrix.md)

# 📊 Java Collections: Complete Method Reference Tables

## Your Quick-Reference Guide for Every Collection Method

---

# ☕ Part 0: Complete Understanding of Java Collections

### 5W1H: Mastering Java Collections

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  WHAT: A unified architecture (interfaces, implementations, and algorithms)  ║
║        for storing, retrieving, and manipulating groups of objects.          ║
║                                                                              ║
║  WHY:  Raw arrays have fixed sizes and lack built-in operations. The         ║
║        Collections framework provides robust, tested, high-performance       ║
║        data structures out-of-the-box, saving massive development time.      ║
║                                                                              ║
║  WHO:  Every Java developer. It is the absolute foundation of production     ║
║        Java code and 90% of Data Structure & Algorithm interviews.           ║
║                                                                              ║
║  WHEN: Use whenever you need to store variable amounts of data, guarantee    ║
║        uniqueness (Set), map keys to values (Map), or process in specific    ║
║        orders (Queue/Stack/Tree).                                            ║
║                                                                              ║
║  HOW:  By understanding the interface hierarchy (Iterable -> Collection ->   ║
║        List/Set/Queue) and choosing the implementation (ArrayList, HashMap,  ║
║        etc.) that provides optimal O(1) or O(log N) operations for your use  ║
║        case.                                                                 ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

```
╔══════════════════════════════════════════════════════════════════════════════╗
║              JAVA COLLECTIONS - COMPLETE UNDERSTANDING                       ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────────┐
├──────────────────────────────────────────────────────────────────────────────┤
│ A unified architecture for representing and manipulating collections of      │
│ objects. It provides:                                                        │
│ • INTERFACES: Define behavior (List, Set, Map, Queue)                        │
│ • IMPLEMENTATIONS: Actual classes (ArrayList, HashMap, etc.)                 │
│ • ALGORITHMS: Static methods (sort, search, shuffle)                         │
│                                                                              │
│ HISTORICAL EVOLUTION:                                                        │
│ • Java 1.0 (1996): Only Vector, Hashtable, Stack                             │
│ • Java 1.2 (1998): Collections Framework introduced - Revolution!            │
│ • Java 1.4 (2002): LinkedHashMap/Set added                                   │
│ • Java 1.5 (2004): Generics! No more casting                                 │
│ • Java 1.6 (2006): NavigableSet, NavigableMap                                │
│ • Java 1.7 (2011): Diamond operator <>                                       │
│ • Java 1.8 (2014): Streams, forEach, removeIf                                │
│ • Java 9+ (2017+): Immutable factories (List.of, Set.of)                     │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHAT PROBLEM DOES IT SOLVE?                                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│ BEFORE COLLECTIONS (Java 1.0):                                               │
│ • Arrays: Fixed size, primitive operations only                              │
│ • Vector: Thread-safe but slow, inconsistent API                             │
│ • Hashtable: No null keys, synchronized (slow)                               │
│ • Every company wrote their own data structures!                             │
│                                                                              │
│ PROBLEMS:                                                                    │
│ • No standard way to group objects                                           │
│ • Code not reusable across projects                                          │
│ • Algorithms had to be rewritten for each type                               │
│ • No common interface → Hard to write generic code                           │
│                                                                              │
│ COLLECTIONS SOLUTION:                                                        │
│ • Standard interfaces (List, Set, Map) that work anywhere                    │
│ • Multiple implementations to choose from                                    │
│ • Generic algorithms that work with any implementation                       │
│ • Type safety with generics                                                  │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ THE BIG PICTURE - COLLECTIONS HIERARCHY                                      │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                    ┌─────────────┐                                           │
│                    │  Iterable   │ (for-each loops)                          │
│                    └──────┬──────┘                                           │
│                           │                                                  │
│                    ┌──────┴──────┐                                           │
│                    │ Collection  │ (add, remove, size, contains)             │
│                    └──────┬──────┘                                           │
│           ┌───────────────┼───────────────┐                                  │
│           │               │               │                                  │
│    ┌──────┴──────┐ ┌──────┴──────┐ ┌──────┴──────┐                           │
│    │    List     │ │    Set      │ │   Queue     │                           │
│    │ (ordered)   │ │ (unique)    │ │ (FIFO)      │                           │
│    └──────┬──────┘ └──────┬──────┘ └──────┬──────┘                           │
│           │               │               │                                  │
│    ArrayList        HashSet          LinkedList                              │
│    LinkedList       TreeSet          PriorityQueue                           │
│    Vector           LinkedHashSet    ArrayDeque                              │
│                                                                              │
│                    ┌─────────────┐                                           │
│                    │    Map      │ (key-value pairs)                         │
│                    └──────┬──────┘                                           │
│                           │                                                  │
│              ┌────────────┼────────────┐                                     │
│              │            │            │                                     │
│         HashMap      TreeMap    LinkedHashMap                                │
│         Hashtable                                                            │
│                                                                              │
│ KEY INSIGHT: Same interface, DIFFERENT implementations!                      │
│ List list = new ArrayList<>();  // Can swap to LinkedList easily             │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHEN TO USE WHICH COLLECTION? (Decision Guide)                               │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ QUESTION 1: Do you need KEY-VALUE pairs?                                     │
│ • YES → Use MAP (HashMap, TreeMap, LinkedHashMap)                            │
│ • NO → Continue to Question 2                                                │
│                                                                              │
│ QUESTION 2: Do you need UNIQUE elements only?                                │
│ • YES → Use SET (HashSet, TreeSet, LinkedHashSet)                            │
│ • NO → Continue to Question 3                                                │
│                                                                              │
│ QUESTION 3: Do you need FIFO/LIFO ordering?                                  │
│ • FIFO → Queue (LinkedList, ArrayDeque)                                      │
│ • LIFO → Stack (ArrayDeque preferred over Stack class)                       │
│ • Priority → PriorityQueue                                                   │
│ • NO → Use LIST                                                              │
│                                                                              │
│ QUESTION 4: (For Lists) What operations dominate?                            │
│ • Random access (get by index) → ArrayList                                   │
│ • Insert/Delete in middle → LinkedList                                       │
│                                                                              │
│ QUESTION 5: (For Sets/Maps) Do you need ordering?                            │
│ • No ordering needed → Hash variant (fastest)                                │
│ • Sorted order needed → Tree variant (O(log n))                              │
│ • Insertion order → LinkedHash variant                                       │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ DIFFICULTIES IN USING COLLECTIONS                                            │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ 1. TOO MANY CHOICES:                                                         │
│    "Should I use ArrayList or LinkedList?"                                   │
│    Solution: ArrayList for 95% of cases (better cache locality)              │
│                                                                              │
│ 2. GENERICS CONFUSION:                                                       │
│    "What's <E>, <K,V>, <?>"                                                  │
│    Solution: E = Element type, K = Key, V = Value, ? = Unknown               │
│                                                                              │
│ 3. CONCURRENT MODIFICATION:                                                  │
│    Removing while iterating throws exception                                 │
│    Solution: Use Iterator.remove() or removeIf()                             │
│                                                                              │
│ 4. EQUALS/HASHCODE:                                                          │
│    Custom objects don't work in HashSet/HashMap                              │
│    Solution: Override both equals() AND hashCode()                           │
│                                                                              │
│ 5. MUTABILITY:                                                               │
│    Arrays.asList() returns fixed-size list                                   │
│    Solution: new ArrayList<>(Arrays.asList(...))                             │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ EXPECTED OUTPUTS OF MASTERING COLLECTIONS                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ ✅ INSTANT CHOICE: See requirement → Know which collection to use             │
│ ✅ EFFICIENT CODE: Pick implementation with best time complexity              │
│ ✅ CLEAN CODE: Use streams and built-in methods                               │
│ ✅ BUG-FREE: Avoid common pitfalls (concurrent modification, etc.)            │
│ ✅ INTERVIEW READY: Explain trade-offs between implementations                │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

# 📌 Section 1: List Interface

## ArrayList Methods (Most Used for Arrays/DSA)

| Method        | Return Type | Signature                   | Description                           | Time       |
| ------------- | ----------- | --------------------------- | ------------------------------------- | ---------- |
| `add`         | boolean     | `add(E e)`                  | Appends element to end                | O(1)\*     |
| `add`         | void        | `add(int index, E e)`       | Inserts at position                   | O(n)       |
| `get`         | E           | `get(int index)`            | Returns element at index              | O(1)       |
| `set`         | E           | `set(int index, E e)`       | Replaces element, returns old         | O(1)       |
| `remove`      | E           | `remove(int index)`         | Removes at index, returns element     | O(n)       |
| `remove`      | boolean     | `remove(Object o)`          | Removes first occurrence              | O(n)       |
| `size`        | int         | `size()`                    | Returns number of elements            | O(1)       |
| `isEmpty`     | boolean     | `isEmpty()`                 | Returns true if size == 0             | O(1)       |
| `contains`    | boolean     | `contains(Object o)`        | Returns true if element exists        | O(n)       |
| `indexOf`     | int         | `indexOf(Object o)`         | Index of first occurrence, -1 if none | O(n)       |
| `lastIndexOf` | int         | `lastIndexOf(Object o)`     | Index of last occurrence              | O(n)       |
| `clear`       | void        | `clear()`                   | Removes all elements                  | O(n)       |
| `toArray`     | Object[]    | `toArray()`                 | Returns array of elements             | O(n)       |
| `subList`     | List<E>     | `subList(int from, int to)` | Returns view of portion               | O(1)       |
| `sort`        | void        | `sort(Comparator<E> c)`     | Sorts using comparator                | O(n log n) |

\*O(1) amortized, O(n) when resize needed

### Usage Examples

```java
ArrayList<Integer> list = new ArrayList<>();

// Adding elements
list.add(10);                    // [10]
list.add(20);                    // [10, 20]
list.add(0, 5);                  // [5, 10, 20] - insert at index 0

// Accessing
int first = list.get(0);         // 5
int last = list.get(list.size() - 1);  // 20

// Modifying
list.set(1, 15);                 // [5, 15, 20]

// Removing
list.remove(0);                  // [15, 20] - by index
list.remove(Integer.valueOf(20)); // [15] - by value

// Checking
boolean has15 = list.contains(15);  // true
int idx = list.indexOf(15);         // 0

// Iterating - DSA Pattern!
for (int i = 0; i < list.size(); i++) {
    System.out.println(list.get(i));
}

// Enhanced for
for (int num : list) {
    System.out.println(num);
}
```

🔬 **Section Challenge — ArrayList Methods (Most Used for Arrays/DSA)**

**Challenge 1 (Reasoning):** `ArrayList.remove(Object o)` vs `ArrayList.remove(int index)` — you call `list.remove(1)`. Which overload is called and why?

<details><summary>Answer</summary>

`remove(int index)` — `1` is an `int` literal, not an `Integer`. Java resolves to the exact-match primitive overload first. To call `remove(Object)`, use `list.remove(Integer.valueOf(1))` or `list.remove((Integer)1)`. This is a classic Java gotcha that changes behavior silently.

</details>

**Challenge 2 (Design):** You need to frequently add/remove from both ends of a list AND access by index. Which collection?

<details><summary>Answer</summary>

None of the standard ones do all three efficiently. Tradeoffs: `ArrayList`: O(1) index access, O(N) front insert/delete. `LinkedList`/`ArrayDeque`: O(1) front/back, O(N) index access. Real solution: if index access can be avoided, use `ArrayDeque`. If all 3 are needed constantly, consider a skip list or re-examine your design.

</details>

## LinkedList Methods (Queue + Deque operations)

| Method        | Return Type | Signature       | Description                    | Time |
| ------------- | ----------- | --------------- | ------------------------------ | ---- |
| `addFirst`    | void        | `addFirst(E e)` | Adds to beginning              | O(1) |
| `addLast`     | void        | `addLast(E e)`  | Adds to end                    | O(1) |
| `getFirst`    | E           | `getFirst()`    | Returns first element          | O(1) |
| `getLast`     | E           | `getLast()`     | Returns last element           | O(1) |
| `removeFirst` | E           | `removeFirst()` | Removes and returns first      | O(1) |
| `removeLast`  | E           | `removeLast()`  | Removes and returns last       | O(1) |
| `offer`       | boolean     | `offer(E e)`    | Adds to end (queue)            | O(1) |
| `poll`        | E           | `poll()`        | Removes first (queue)          | O(1) |
| `peek`        | E           | `peek()`        | Returns first without removing | O(1) |
| `push`        | void        | `push(E e)`     | Adds to beginning (stack)      | O(1) |
| `pop`         | E           | `pop()`         | Removes first (stack)          | O(1) |

```java
LinkedList<Integer> list = new LinkedList<>();

// As a Queue (FIFO)
list.offer(1);    // Add to back
list.offer(2);    // [1, 2]
int first = list.poll();  // Remove from front: 1

// As a Stack (LIFO)
list.push(10);    // Add to front
list.push(20);    // [20, 10]
int top = list.pop();  // Remove from front: 20

// As a Deque (Double-ended)
list.addFirst(5);   // Add to front
list.addLast(15);   // Add to back
list.removeFirst(); // Remove from front
list.removeLast();  // Remove from back
```

---

# 📌 Section 2: Map Interface

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

🔬 **Section Challenge — HashMap Methods (CRITICAL for DSA!)**

**Challenge 1 (Reasoning):** You insert 1000 entries into a HashMap with default capacity 16. How many resize operations happen?

<details><summary>Answer</summary>

Resize threshold = capacity × 0.75. Resizes at: 12 (16→32), 24 (32→64), 48 (64→128), 96 (128→256), 192 (256→512), 384 (512→1024). Total: 6 resizes. Each resize copies all entries to new bucket array. Pre-sizing: `new HashMap<>(1334)` (1000/0.75 ≈ 1334 → next power of 2 = 2048) avoids all resizes.

</details>

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

# 📌 Section 3: Set Interface

## HashSet Methods

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

### ⭐ DSA Pattern Examples

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

## TreeSet Methods (Sorted Order)

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

# 📬 Section 4: Queue Interface

## Queue/Deque Methods (Using ArrayDeque)

| Method    | Return Type | Signature    | Description  | Throws?   |
| --------- | ----------- | ------------ | ------------ | --------- |
| `add`     | boolean     | `add(E e)`   | Adds to tail | Yes       |
| `offer`   | boolean     | `offer(E e)` | Adds to tail | No        |
| `remove`  | E           | `remove()`   | Removes head | Yes       |
| `poll`    | E           | `poll()`     | Removes head | No (null) |
| `element` | E           | `element()`  | Returns head | Yes       |
| `peek`    | E           | `peek()`     | Returns head | No (null) |

### ArrayDeque as Queue

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

## PriorityQueue Methods (Heap)

| Method        | Return Type | Signature          | Description        | Time     |
| ------------- | ----------- | ------------------ | ------------------ | -------- |
| `add`/`offer` | boolean     | `offer(E e)`       | Adds element       | O(log n) |
| `peek`        | E           | `peek()`           | Returns min/max    | O(1)     |
| `poll`        | E           | `poll()`           | Removes min/max    | O(log n) |
| `remove`      | boolean     | `remove(Object o)` | Removes element    | O(n)     |
| `size`        | int         | `size()`           | Number of elements | O(1)     |
| `toArray`     | Object[]    | `toArray()`        | Returns array      | O(n)     |

### ⭐ DSA Pattern Examples

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

# 📚 Section 5: Stack Operations

## Using ArrayDeque as Stack (RECOMMENDED)

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

# 📝 Section 6: String Builder

## StringBuilder Methods (For String Manipulation)

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

# 📊 Section 7: Arrays Utility Class

## Static Methods in java.util.Arrays

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

# 📌 Section 8: Collections Utility Class

## Static Methods in java.util.Collections

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

# 📖 Section 9: Quick Reference Tables

## When to Use Which Collection?

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

## Complexity Cheat Sheet

| Operation        | ArrayList | LinkedList | HashMap | TreeMap  | HashSet | TreeSet  |
| ---------------- | --------- | ---------- | ------- | -------- | ------- | -------- |
| Access by index  | O(1)      | O(n)       | -       | -        | -       | -        |
| Add/Remove end   | O(1)\*    | O(1)       | -       | -        | -       | -        |
| Add/Remove begin | O(n)      | O(1)       | -       | -        | -       | -        |
| Add/Contains     | -         | -          | O(1)    | O(log n) | O(1)    | O(log n) |
| Get by key       | -         | -          | O(1)    | O(log n) | -       | -        |
| Sorted order     | No        | No         | No      | Yes      | No      | Yes      |

---

# 🧩 Section 9b: Production Failure Modes

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

# 📐 Section 9c: Invariant Statements

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

# 🧩 Section 10: DSA Problem → Collection Mapping

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

# 💪 Curated Practice Problems — Java Collections in Action

**HOW TO USE**: These problems specifically test your knowledge of Java Collections API.
Focus on choosing the RIGHT collection for each problem.

---

## Collection Choice Problems

| #   | Problem                         | Platform | Difficulty | Best Collection       | Why                             |
| --- | ------------------------------- | -------- | ---------- | --------------------- | ------------------------------- |
| 1   | Two Sum (LC 1)                  | LeetCode | Easy       | HashMap               | O(1) lookup by complement       |
| 2   | Group Anagrams (LC 49)          | LeetCode | Medium     | HashMap<String, List> | Sorted key grouping             |
| 3   | Kth Largest Element (LC 215)    | LeetCode | Medium     | PriorityQueue         | Min heap of size k              |
| 4   | LRU Cache (LC 146)              | LeetCode | Medium     | LinkedHashMap         | Insertion order + removeEldest  |
| 5   | Merge Intervals (LC 56)         | LeetCode | Medium     | ArrayList + sort      | Collections.sort by start       |
| 6   | Sliding Window Max (LC 239)     | LeetCode | Hard       | ArrayDeque            | Monotonic deque                 |
| 7   | Top K Frequent Words (LC 692)   | LeetCode | Medium     | HashMap + TreeMap     | Sorted by freq then alpha       |
| 8   | Contains Duplicate III (LC 220) | LeetCode | Hard       | TreeSet               | floor/ceiling for range check   |
| 9   | My Calendar I (LC 729)          | LeetCode | Medium     | TreeMap               | floorKey/ceilingKey for overlap |
| 10  | Task Scheduler (LC 621)         | LeetCode | Medium     | PriorityQueue         | Max heap by remaining count     |

---

_This reference is your go-to guide during practice!_

---

> **Navigation**: [< Previous](02b_DS_Variants_Advanced.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](04_2D_Arrays_Matrix.md)

---

# 🎓 University-Level Addendum — Java Collections as Production-Ready Code

> **Purpose:** This addendum elevates the chapter to MIT/KTH/ETH rigor. The body has comprehensive method reference, complexity tables, invariant statements, and production failure modes (Section 9b); this addendum consolidates the canonical production failure modes with formal root-cause analysis, adds a constraint-first collection selection framework, and provides exam-style invariant proofs.

## Production Failure Modes — Canonical Set

These are the most common production failures from misuse of Java Collections. Each is presented with: trigger condition, what breaks, root cause, and defense.

### Failure 1 — ArrayList Default Capacity O(n²) Total Insert

**Trigger:** `new ArrayList<>()` then `add` 10⁶ elements.

**What breaks:** Multiple resizes (17 with default 1.5× growth from capacity 10 to ~1.3M). Each resize copies all existing elements → O(n × log n) total instead of O(n).

**Root cause:** Default capacity is 10. The user assumes ArrayList is "fast enough" without considering the resize cost.

**Defense:** Always pre-size: `new ArrayList<>(expectedSize + 1)`. For `expectedSize = 10⁶`, allocate `1,000,001` capacity to skip all resizes.

**Diagnostic:** Profile with JFR (Java Flight Recorder) and look for `jdk.internal.array.Resize` events.

**Cost in production:** For a hot-path insertion loop, this can mean 30× slowdown. Common in batch processing code.

### Failure 2 — HashMap Default Capacity 16 + Resize Storm

**Trigger:** `new HashMap<>()` then `put` 10⁶ entries.

**What breaks:** Resize at size 12 (16 × 0.75). 17 resizes total. Each resize copies all buckets and rehashes every key.

**Root cause:** Default capacity is 16, but most production maps have 10⁴-10⁶ entries.

**Defense:** Always pre-size: `new HashMap<>(expectedSize / 0.75 + 1)`. For `expectedSize = 10⁶`, allocate `1,333,334` capacity.

**Diagnostic:** JFR `java.util.HashMap` events or `HashMap.size()` checks against `HashMap.table.length()`.

**Cost in production:** Identical to Failure 1 — 30× slowdown on insert-heavy workloads.

### Failure 3 — ConcurrentModificationException Surprise

**Trigger:** Iterating a HashMap/ArrayList while another thread modifies it (or even the same thread via `Iterator.remove()` patterns).

**What breaks:** `ConcurrentModificationException` thrown mid-iteration. Worst case: data corruption without exception (custom impl).

**Root cause:** `modCount` field incremented on structural modification; iterators check `expectedModCount == modCount` and throw on mismatch.

**Defense:** Use `ConcurrentHashMap` for concurrent access. Or collect keys to modify first, then apply changes after iteration. Or use `Iterator.remove()` explicitly (which updates `expectedModCount`).

**Diagnostic:** Look for stack trace with `AbstractList$Itr.next()` or `HashMap$HashIterator.next()` — these are the throw sites.

**Cost in production:** Hard-to-reproduce bugs; common in event-driven systems where callbacks modify the event source.

### Failure 4 — Iterator Invalidation After Resize

**Trigger:** Iterating a HashMap while a `put` triggers a resize.

**What breaks:** Iterator's `expectedModCount` is set correctly, but the iteration now walks the *old* bucket array (which the iterator holds by reference). The new bucket array is invisible to the iterator. Result: iteration misses new entries or returns stale.

**Root cause:** HashMap's iterator holds a reference to the old table; resize creates a new table; iterator still walks the old.

**Defense:** Don't modify during iteration. Use `ConcurrentHashMap` for concurrent updates.

**Cost in production:** Silent data inconsistency — observed values don't match expected.

### Failure 5 — LinkedList Random Access O(n) per Get

**Trigger:** `linkedList.get(i)` in a loop.

**What breaks:** Each `get(i)` walks from head or tail (whichever is closer) → O(n) per call. Loop of n gets → O(n²) total.

**Root cause:** LinkedList has no random access; `get(i)` is implemented as `Node node(int index) { ... }`.

**Defense:** Always use `Iterator` for LinkedList. Or use ArrayList when random access is needed.

**Diagnostic:** Profile with async-profiler; look for `LinkedList.node(int)` in CPU samples.

**Cost in production:** 100-1000× slowdown vs ArrayList for the same workload.

### Failure 6 — Hashtable Null Key NPE

**Trigger:** `Hashtable.put(null, value)` or `ConcurrentHashMap.put(null, value)`.

**What breaks:** `NullPointerException` thrown.

**Root cause:** Hashtable and ConcurrentHashMap explicitly reject null keys/values to avoid ambiguity with `containsKey`. HashMap allows one null key.

**Defense:** Don't use null as a key. Use `Optional<T>` or a sentinel object.

**Cost in production:** Crash on edge-case input (e.g., user-submitted form with missing field).

### Failure 7 — TreeMap Comparator Inconsistency

**Trigger:** `Comparator.compare(a, b)` returns inconsistent results across calls (e.g., uses mutable state).

**What breaks:** TreeMap contracts broken; entries in wrong positions; `get(k)` may not find k.

**Root cause:** Comparator must be a pure function of inputs. Violating this violates the TreeMap contract.

**Defense:** Comparator should use only the inputs and stateless fields. Document this explicitly.

**Cost in production:** Silent data corruption; tree structure may violate ordering invariant.

### Failure 8 — HashMap.equals/hashCode Contract Violation

**Trigger:** Custom key class overrides `equals` but not `hashCode`.

**What breaks:** Two equal keys hash to different buckets → `get(k)` returns null even though `containsKey(k) == true` is impossible (the lookup uses `hashCode` to find the bucket, then `equals` to find the entry).

**Root cause:** Hash contract: `equals(a, b) ⟹ hashCode(a) == hashCode(b)`. Violating this breaks lookup.

**Defense:** Always override both `equals` and `hashCode`. Use `Objects.hash(field1, field2, ...)` for `hashCode`. Use `IDE` to generate.

**Cost in production:** Lost entries; size() reports correct count but `get()` returns null for some keys.

### Failure 9 — IdentityHashMap Surprise

**Trigger:** Using `IdentityHashMap` instead of `HashMap` for a typical map.

**What breaks:** Uses `==` instead of `.equals()`. Two strings `"a"` and `new String("a")` are different keys.

**Root cause:** IdentityHashMap's contract is reference equality.

**Defense:** Use HashMap unless you specifically need reference equality (e.g., object identity tracking).

**Cost in production:** Silent incorrect behavior — equal keys treated as different.

### Failure 10 — EnumMap Performance Surprise

**Trigger:** Using `EnumMap` with a non-enum key.

**What breaks:** `ClassCastException` at runtime. EnumMap is typed for enums only.

**Root cause:** EnumMap uses an array indexed by enum ordinal; non-enum keys can't be cast to enum.

**Defense:** Always declare EnumMap with an enum type: `EnumMap<MyEnum, V> map = new EnumMap<>(MyEnum.class)`.

**Cost in production:** Runtime crash on first use.

### Failure 11 — PriorityQueue Iteration Order

**Trigger:** Iterating a `PriorityQueue` and expecting sorted order.

**What breaks:** Iteration is in heap order (parent before children), NOT sorted order. The heap property only guarantees `peek()` returns the minimum.

**Root cause:** PriorityQueue is a binary heap; iteration is level-order (BFS).

**Defense:** To iterate in sorted order, repeatedly call `poll()` (drains the heap in sorted order). Or copy to a List and sort.

**Cost in production:** Silent incorrect results when user assumes iteration is sorted.

### Failure 12 — Collections.unmodifiableList Not Deep

**Trigger:** `Collections.unmodifiableList(listOfMutableObjects)` then mutating the contained objects.

**What breaks:** Mutation succeeds — `unmodifiableList` only prevents structural changes (add/remove), not element mutations.

**Root cause:** `unmodifiableList` wraps the list; it doesn't deep-copy elements.

**Defense:** Use immutable objects (Java records, Lombok `@Value`) for elements. Or use `List.copyOf(list)` which is shallow but creates a new immutable list.

**Cost in production:** Defensive immutability violated; mutations propagate unexpectedly.

## Constraint-First Collection Selection

The body has decision guidance; this section formalizes it as a decision tree for university-level reasoning.

### Decision Tree

```
need to store key-value pairs?
  → NO → List (ArrayList default, LinkedList if frequent insert/delete at known positions)
  → YES → continue

need ordering (sorted iteration, range queries)?
  → YES → continue
  → NO → HashMap (or ConcurrentHashMap for thread-safety)

thread-safe required?
  → YES → ConcurrentHashMap (lock striping) or ConcurrentSkipListMap (sorted + concurrent)
  → NO → continue

key is a primitive int?
  → YES → IntIntMap (fastutil/Trove) — saves 24 bytes per entry vs Integer boxing
  → NO → HashMap<Integer, V>

frequent iteration + insertion-order preservation?
  → YES → LinkedHashMap
  → NO → HashMap

LRU cache needed?
  → YES → LinkedHashMap (access-order = true) + removeEldestEntry override
  → NO → HashMap

need min/max at head?
  → YES → PriorityQueue (binary heap)
  → NO → List/Map
```

### Decision Table

| Workload | Best Choice | Why |
|---|---|---|
| Default key-value map | HashMap | O(1) avg; memory-efficient |
| Sorted iteration | TreeMap (Red-Black) | O(log n) ops + sorted |
| Concurrent map | ConcurrentHashMap | Lock striping; safe publication |
| Sorted + concurrent | ConcurrentSkipListMap | Lock-free skip list |
| LRU cache | LinkedHashMap (access-order) | O(1) get + O(1) eviction |
| Primitive int key | IntIntMap (fastutil) | No boxing; 24 bytes/entry saved |
| Enum key | EnumMap | O(1) array-backed; 8 bytes for ≤64 enums |
| Bounded queue | ArrayBlockingQueue | Bounded + thread-safe |
| Producer-consumer | ConcurrentLinkedQueue | Lock-free; unbounded |
| Stack/queue (single-threaded) | ArrayDeque | Faster than Stack/LinkedList |
| Top-K | PriorityQueue | O(n log K) with K-size heap |
| Symbol table (interpreter) | HashMap<String, Value> | Fast lookup |
| Graph adjacency list | Map<V, List<E>> | Explicit; allows fine control |

## Exam-Style Invariant Proofs

### Proof — HashMap ModCount Preserves CM-Exception

**Theorem:** If thread A iterates a HashMap and thread B modifies it (adds/removes), thread A's iterator throws ConcurrentModificationException within at most O(1) operations after the modification.

**Proof:**
- `HashMap.modCount` is incremented on each structural modification (put, remove).
- `HashMap.HashIterator` stores `expectedModCount = modCount` at creation.
- `HashMap.HashIterator.next()` checks `if (modCount != expectedModCount) throw new ConcurrentModificationException()`.
- This check is O(1).
- The check happens before returning each element.

Therefore, the iterator throws within O(1) ops of the modification. ✓

**Limitation:** This is best-effort detection, not guaranteed. A modification that happens between the check and the `next()` call won't be caught until the next iteration. For strict consistency, use `ConcurrentHashMap`.

### Proof — ArrayList modCount Increments Are Monotonic

**Theorem:** `ArrayList.modCount` is non-decreasing across all operations on a given ArrayList.

**Proof:** By inspection of `ArrayList` source:
- `add(E)`: increments modCount.
- `add(int, E)`: increments modCount.
- `remove(int)`: increments modCount.
- `remove(Object)`: increments modCount.
- `removeAll(Collection)`: increments modCount per `BatchUpdateException`.
- `retainAll`: increments modCount.
- `clear`: increments modCount.
- `set(int, E)` and `get(int)`: do NOT increment (not structural).
- `iterator()` and `listIterator()`: read modCount (no write).

Therefore, modCount is non-decreasing. ✓

This invariant is why `ConcurrentModificationException` works: any modification between iterator creation and use will be detected.

### Proof — TreeMap Comparator Must Be Consistent with Equals

**Theorem:** If `Comparator.compare(a, b) == 0` for `a.equals(b) == false`, then TreeMap contracts are violated.

**Proof by counterexample:**
- Let `a` and `b` be two objects with `a.equals(b) == false` but `compare(a, b) == 0`.
- TreeMap.put(a, v1) inserts `a` at some position.
- TreeMap.put(b, v2) compares `b` to `a`: `compare(b, a) == 0`. TreeMap may consider `b` "equal" to `a` and replace `v1` with `v2`. Or it may add `b` as a new entry.
- Now TreeMap.containsKey(a) returns true, but `get(a)` returns `v2` (not `v1`).
- Or TreeMap has two entries with semantically equal keys, breaking uniqueness.

Therefore, the invariant `compare == 0 ⟺ equals == true` is required. Violating it produces non-deterministic behavior. ✓

**Defense:** Document this requirement. Use `Comparator.comparingInt()` which delegates to `Integer.compare` (which is consistent with `Integer.equals`).

## Performance Anti-Patterns Summary

| Anti-Pattern | Why It's Slow | Fix |
|---|---|---|
| `new ArrayList<>()` + many adds | O(n log n) total due to resizes | Pre-size: `new ArrayList<>(expectedSize + 1)` |
| `new HashMap<>()` + many puts | Same — 17 resizes for 10⁶ entries | Pre-size: `new HashMap<>(expectedSize / 0.75 + 1)` |
| `linkedList.get(i)` in loop | O(n²) — each get is O(n) | Use iterator or ArrayList |
| `list.contains(o)` on ArrayList | O(n) per call; O(n²) if in loop | Convert to HashSet for O(1) lookup |
| `hashMap.keySet().contains(k)` | O(1) — but iterating keySet is O(n) | Use `hashMap.containsKey(k)` directly |
| `priorityQueue.iterator()` + sort | Iterates in heap order, not sorted | Poll repeatedly or sort the result |
| `arrayList.toArray()` without pre-sizing | Allocates a new array each time | Reuse a single `Object[]` buffer |
| `stringConcatenationInLoop` | O(n²) — each + creates new String | Use `StringBuilder` with `ensureCapacity` |
| `subList().clear()` to remove range | Sublist view complicates iteration; better to use `removeRange` | Use direct `removeAll` with a sublist |
| `Collections.sort(list)` on nearly-sorted list | O(n log n) even when input is nearly sorted | Use insertion sort for small or nearly-sorted input |

## Cross-References

- **`01a_Memory_Foundations.md`** — escape analysis, memory layout, cache behavior.
- **`01b_Arrays.md`** — ArrayList internals; resize cost analysis.
- **`01c_LinkedList.md`** — LinkedList internals; iterator invalidation.
- **`01e_HashTable.md`** — HashMap internals; hash distribution; treeify threshold.
- **`01f_Trees_Heaps.md`** — TreeMap Red-Black; Comparator contract.
- **`01g_DS_Internals.md`** — implementation-specific invariants (AL1-AL5, HM1-HM6, TM1-TM4, LL1-LL4).
- **`02_PROBLEM_SETS.md`** — exam-style collection selection problems.
- **`05_DS_In_Production.md`** — production failure modes for storage engines and databases.
- **`13_Developer_Essentials/19_Concurrency_Models_Coroutines.md`** — concurrency patterns and backpressure.
