> **Navigation**: [< Previous](02a_DS_Variants_Core.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](04_2D_Arrays_Matrix.md)

# 📊 Java Collections: Complete Method Reference Tables

## Your Quick-Reference Guide for Every Collection Method

---

# ☕ Part 0: Complete Understanding of Java Collections

```
╔══════════════════════════════════════════════════════════════════════════════╗
║              JAVA COLLECTIONS - COMPLETE UNDERSTANDING                       ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHAT IS THE COLLECTIONS FRAMEWORK?                                           │
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



> 🔬 **Section Challenge — ArrayList Methods (Most Used for Arrays/DSA)**
>
> **Challenge 1 (Reasoning):** `ArrayList.remove(Object o)` vs `ArrayList.remove(int index)` — you call `list.remove(1)`. Which overload is called and why?
> <details><summary>Answer</summary>
>
> `remove(int index)` — `1` is an `int` literal, not an `Integer`. Java resolves to the exact-match primitive overload first. To call `remove(Object)`, use `list.remove(Integer.valueOf(1))` or `list.remove((Integer)1)`. This is a classic Java gotcha that changes behavior silently.
> </details>
>
> **Challenge 2 (Design):** You need to frequently add/remove from both ends of a list AND access by index. Which collection?
> <details><summary>Answer</summary>
>
> None of the standard ones do all three efficiently. Tradeoffs: `ArrayList`: O(1) index access, O(N) front insert/delete. `LinkedList`/`ArrayDeque`: O(1) front/back, O(N) index access. Real solution: if index access can be avoided, use `ArrayDeque`. If all 3 are needed constantly, consider a skip list or re-examine your design.
> </details>
>

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



> 🔬 **Section Challenge — HashMap Methods (CRITICAL for DSA!)**
>
> **Challenge 1 (Reasoning):** You insert 1000 entries into a HashMap with default capacity 16. How many resize operations happen?
> <details><summary>Answer</summary>
>
> Resize threshold = capacity × 0.75. Resizes at: 12 (16→32), 24 (32→64), 48 (64→128), 96 (128→256), 192 (256→512), 384 (512→1024). Total: 6 resizes. Each resize copies all entries to new bucket array. Pre-sizing: `new HashMap<>(1334)` (1000/0.75 ≈ 1334 → next power of 2 = 2048) avoids all resizes.
> </details>
>
> **Challenge 2 (Bug Hunt):** Two `Person` objects with same name and age. You override `equals()` to return true but not `hashCode()`. What happens when used as `HashMap` keys?
> <details><summary>Answer</summary>
>
> Both objects land in DIFFERENT buckets (different hashCodes → different bucket index). The HashMap doesn't check `equals()` across buckets — it goes straight to one bucket. So `map.get(person2)` returns NULL even though `person1.equals(person2)`. Overriding `equals` without `hashCode` violates the contract and breaks all hash-based collections. Always override both together.
> </details>
>

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



> 🔬 **Section Challenge — TreeMap Methods (Sorted Order)**
>
> **Challenge 1 (Reasoning):** When should you use `TreeMap` over `HashMap`? What's the actual performance cost?
> <details><summary>Answer</summary>
>
> `TreeMap` use cases: range queries (`subMap`, `headMap`, `tailMap`), ordered iteration, `floorKey`/`ceilingKey`. Cost: every operation is O(log N) vs O(1) avg for HashMap. For 1M entries: HashMap ~1μs, TreeMap ~20μs per operation. Use TreeMap ONLY when sorted order is required — not as a default.
> </details>
>

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



> 🔬 **Section Challenge — StringBuilder Methods (For String Manipulation)**
>
> **Challenge 1 (Reasoning):** Why is `String str = ""; for(int i=0;i<1000;i++) str += i;` O(N²) and how does StringBuilder fix it?
> <details><summary>Answer</summary>
>
> Each `+=` creates a NEW String object: copies all existing chars + appends new char. Iteration 1: copy 1 char. Iteration 2: copy 2 chars. ... Iteration N: copy N chars. Total: 1+2+...+N = N(N+1)/2 = O(N²) character copies. StringBuilder uses a resizable internal array. `append()` adds to the end: O(1) amortized. Final `toString()`: O(N) once. Total: O(N).
> </details>
>

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

> **HOW TO USE**: These problems specifically test your knowledge of Java Collections API.
> Focus on choosing the RIGHT collection for each problem.

---

## Collection Choice Problems

| # | Problem | Platform | Difficulty | Best Collection | Why |
|---|---------|----------|------------|-----------------|-----|
| 1 | Two Sum (LC 1) | LeetCode | Easy | HashMap | O(1) lookup by complement |
| 2 | Group Anagrams (LC 49) | LeetCode | Medium | HashMap<String, List> | Sorted key grouping |
| 3 | Kth Largest Element (LC 215) | LeetCode | Medium | PriorityQueue | Min heap of size k |
| 4 | LRU Cache (LC 146) | LeetCode | Medium | LinkedHashMap | Insertion order + removeEldest |
| 5 | Merge Intervals (LC 56) | LeetCode | Medium | ArrayList + sort | Collections.sort by start |
| 6 | Sliding Window Max (LC 239) | LeetCode | Hard | ArrayDeque | Monotonic deque |
| 7 | Top K Frequent Words (LC 692) | LeetCode | Medium | HashMap + TreeMap | Sorted by freq then alpha |
| 8 | Contains Duplicate III (LC 220) | LeetCode | Hard | TreeSet | floor/ceiling for range check |
| 9 | My Calendar I (LC 729) | LeetCode | Medium | TreeMap | floorKey/ceilingKey for overlap |
| 10 | Task Scheduler (LC 621) | LeetCode | Medium | PriorityQueue | Max heap by remaining count |

---

_This reference is your go-to guide during practice!_


---

> **Navigation**: [< Previous](02b_DS_Variants_Advanced.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](04_2D_Arrays_Matrix.md)