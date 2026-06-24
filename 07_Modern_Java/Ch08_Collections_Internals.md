**Navigation**: [< Previous](Ch08_Collections_Internals.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](Ch14_Maven_Gradle.md)

# 🔬 Chapter 44 — Java Collections Internals: What's Really Happening Inside

**"Anyone can call `map.put(key, value)`. But knowing that HashMap uses array + linked list + red-black tree, that it rehashes at 75% capacity, that ConcurrentHashMap uses CAS instead of synchronized — THAT's what separates juniors from seniors."**

---

## Table of Contents

1. [Collections Framework Architecture](#1-collections-framework-architecture)
2. [ArrayList Internals — Dynamic Array](#2-arraylist-internals--dynamic-array)
3. [LinkedList Internals — Doubly-Linked Nodes](#3-linkedlist-internals--doubly-linked-nodes)
4. [HashMap Internals — The Deep Dive](#4-hashmap-internals--the-deep-dive)
5. [TreeMap Internals — Red-Black Tree](#5-treemap-internals--red-black-tree)
6. [LinkedHashMap — Insertion/Access Order](#6-linkedhashmap--insertionaccess-order)
7. [HashSet — HashMap in Disguise](#7-hashset--hashmap-in-disguise)
8. [ConcurrentHashMap — Thread-Safe Without Global Locks](#8-concurrenthashmap--thread-safe-without-global-locks)
9. [PriorityQueue — Binary Heap](#9-priorityqueue--binary-heap)
10. [Fail-Fast vs Fail-Safe Iterators](#10-fail-fast-vs-fail-safe-iterators)
11. [Memory Overhead Comparison](#11-memory-overhead-comparison)
12. [Choosing the Right Collection](#12-choosing-the-right-collection)

---


### Historical Evolution

**Inventor / Originator:** Sun Microsystems (1998) — Java 2 (J2SE 1.2) introduced the Collections Framework as a unified data structure API.

**Predecessor context:** Java 1.0 had only `Vector`, `Hashtable`, `Array` — inconsistent APIs, no iterator pattern, no generics. Every collection had different method names (`addElement` vs `put` vs `add`). Data structure choice was ad-hoc.

**Evolution narrative:** The Collections Framework was introduced in Java 2 (1998) with a unified `Collection`, `List`, `Set`, `Map` hierarchy, `Iterator` interface, and consistent `add`, `remove`, `contains` methods. It was designed by Joshua Bloch and Neal Gafter (Effective Java co-author). `ConcurrentHashMap` was added in Java 5 (2004) as part of Doug Lea's JSR 166 (`java.util.concurrent`) — lock-free reads, segmented writes replacing `Collections.synchronizedMap()`. HashMap treeification (Java 8, 2014) was a security response to Hash Flooding DoS attacks (2011-2012) — when collisions exceeded a threshold, buckets converted from linked lists to red-black trees. `LinkedHashMap` with access-order LRU caching was added to support eviction algorithms. Red-Black Trees (Guibas and Sedgewick, 1979) were the chosen self-balancing tree for their O(log n) guarantees and ease of incremental rebalancing.

**Modern practice:** Modern Java 21 (LTS) adds SequencedCollection (JEP 431) for ordered collections with `getFirst()`/`getLast()`. `Map.of()`, `List.of()`, `Set.of()` (Java 9+) are immutable factory methods. `CopyOnWriteArrayList` (Java 5) is used in concurrent readers scenarios. `PriorityQueue` with `NavigableMap` (TreeMap) underpins Dijkstra's algorithm and scheduling systems.

- **Collections Framework — Java 2 (1998)**: Joshua Bloch, Neal Gafter. `List`, `Set`, `Map`. Unified API.
- **`ConcurrentHashMap` — Java 5 (2004)**: Doug Lea (JSR 166). Lock-free reads. Replaced `Collections.synchronizedMap()`.
- **HashMap treeification — Java 8 (2014)**: Security fix for Hash Flooding DoS. Linked list → Red-Black tree at threshold.
- **Red-Black Tree — Guibas & Sedgewick 1979**: Self-balancing BST. O(log n) insert/delete. Java HashMap/TreeMap structure.
- **LRU cache — Belady 1966**: Belady's algorithm. `LinkedHashMap` access-order implements O(1) LRU.
- **SequencedCollection — Java 21 (2023)**: JEP 431. Ordered collections with `getFirst()`, `getLast()`, `reversed()`.
## 1. Collections Framework Architecture

```
  ┌────────────────────────────────────────────────────────────┐
  │                    Iterable<E>                              │
  │                        │                                    │
  │                   Collection<E>                             │
  │                   /    │     \                              │
  │                  /     │      \                             │
  │            List<E>  Set<E>  Queue<E>                       │
  │            /   \     /   \      |    \                     │
  │    ArrayList  LinkedList  HashSet  TreeSet  PriorityQueue  │
  │                          LinkedHashSet                     │
  │                                                            │
  │                    Map<K,V>  (NOT Collection!)             │
  │                    /    |     \                             │
  │             HashMap  TreeMap  LinkedHashMap                 │
  │                |                                           │
  │        ConcurrentHashMap                                   │
  └────────────────────────────────────────────────────────────┘
```

---

## 2. ArrayList Internals — Dynamic Array

```
  INTERNAL STRUCTURE:
  ═══════════════════

  ArrayList wraps a plain Object[] array.

  new ArrayList<>() → Object[10]  (default capacity 10)

  ┌───┬───┬───┬───┬───┬───┬───┬───┬───┬───┐
  │ A │ B │ C │ D │ E │   │   │   │   │   │
  └───┴───┴───┴───┴───┴───┴───┴───┴───┴───┘
  size = 5, capacity = 10


  GROWTH STRATEGY:
  ════════════════

  When array is full → create new array at 1.5x size → copy elements

  Capacity 10 → 15 → 22 → 33 → 49 → 73 → ...

  Formula: newCapacity = oldCapacity + (oldCapacity >> 1)
  That's: newCapacity = oldCapacity * 1.5 (integer math)
```

```java
// What happens inside ArrayList.add():
public boolean add(E e) {
    ensureCapacityInternal(size + 1);  // Check if array is full
    elementData[size++] = e;            // Place at end, increment size
    return true;
}

private void grow(int minCapacity) {
    int oldCapacity = elementData.length;
    int newCapacity = oldCapacity + (oldCapacity >> 1);  // 1.5x
    elementData = Arrays.copyOf(elementData, newCapacity);
    // Arrays.copyOf creates NEW array, copies old data
    // Old array becomes garbage → GC collects it
}
```

```
  TIME COMPLEXITIES:
  ═══════════════════

  ┌──────────────────────┬────────────┬─────────────────────────┐
  │ Operation            │ Time       │ Why                     │
  ├──────────────────────┼────────────┼─────────────────────────┤
  │ get(index)           │ O(1)       │ Direct array access     │
  │ add(element) [end]   │ O(1)*      │ Amortized (resize rare) │
  │ add(index, element)  │ O(n)       │ Shift elements right    │
  │ remove(index)        │ O(n)       │ Shift elements left     │
  │ contains(element)    │ O(n)       │ Linear scan             │
  │ size()               │ O(1)       │ Stored as field         │
  └──────────────────────┴────────────┴─────────────────────────┘

  * Amortized O(1): usually O(1), but occasionally O(n) during resize.
    Over n operations, total cost is O(n), so average per op is O(1).


  PRO TIP: If you know the size, pre-allocate:

  List<String> list = new ArrayList<>(10000);  // No resizing needed!
```

---

🔬 **Section Challenge — 2. ArrayList Internals — Dynamic Array**

**Challenge 1 (Reasoning):** `ArrayList.remove(Object o)` vs `ArrayList.remove(int index)` — you call `list.remove(1)`. Which overload is called and why?

<details><summary>Answer</summary>

`remove(int index)` — `1` is an `int` literal, not an `Integer`. Java resolves to the exact-match primitive overload first. To call `remove(Object)`, use `list.remove(Integer.valueOf(1))` or `list.remove((Integer)1)`. This is a classic Java gotcha that changes behavior silently.

</details>

**Challenge 2 (Design):** You need to frequently add/remove from both ends of a list AND access by index. Which collection?

<details><summary>Answer</summary>

None of the standard ones do all three efficiently. Tradeoffs: `ArrayList`: O(1) index access, O(N) front insert/delete. `LinkedList`/`ArrayDeque`: O(1) front/back, O(N) index access. Real solution: if index access can be avoided, use `ArrayDeque`. If all 3 are needed constantly, consider a skip list or re-examine your design.

</details>

## 3. LinkedList Internals — Doubly-Linked Nodes

```
  INTERNAL STRUCTURE:
  ═══════════════════

  Each element is a Node with prev/next pointers:

  null ← [prev|A|next] ↔ [prev|B|next] ↔ [prev|C|next] → null
          ↑ first                           ↑ last

  private static class Node<E> {
      E item;
      Node<E> next;
      Node<E> prev;
  }


  WHEN TO USE:
  • Frequent add/remove at BEGINNING (O(1) vs ArrayList's O(n))
  • Implementing Queue or Deque
  • Almost NEVER for random access (O(n) traversal)

  WHEN NOT TO USE:
  • Random access (get(500) walks 500 nodes!)
  • Memory-sensitive apps (each node = 3 pointers + object = ~40 bytes overhead)
```

```
  ArrayList vs LinkedList — THE TRUTH:
  ════════════════════════════════════

  In practice, ArrayList wins almost always because:
  1. CPU cache locality — array elements are contiguous in memory
  2. LinkedList has massive memory overhead per element
  3. Even O(n) array shifts are fast due to System.arraycopy()

  Use LinkedList ONLY for: Queue operations (addFirst/removeLast)
```

---

🔬 **Section Challenge — 3. LinkedList Internals — Doubly-Linked Nodes**

**Challenge (Reasoning):** Java's `LinkedList` is almost never used in production Java code. `ArrayList` wins even for use cases that seem to favor LinkedList. Explain why, with concrete performance reasoning.

<details><summary>Answer</summary>

CPU cache locality: ArrayList stores elements contiguously in memory — sequential reads hit L1/L2 cache almost every time. LinkedList node pointers scatter elements across the heap (random memory locations) — virtually every node access is a cache miss (~100x slower than cache hit). Even ArrayList's O(N) shift (via `System.arraycopy`) is a single `memmove` instruction at native speed, vastly outperforming LinkedList's O(N) pointer traversal. Use `ArrayDeque` instead of `LinkedList` for queue behavior — it's a circular array with O(1) both-ends operations and cache-friendly access.

</details>

## 4. HashMap Internals — The Deep Dive

```
  THIS IS THE MOST IMPORTANT COLLECTION TO UNDERSTAND.
  Asked in 90% of Java interviews.
```

### 4.1 Basic Structure

```
  HashMap = Array of Buckets

  Each bucket starts as a Linked List.
  If a bucket gets too long (≥8 nodes), it converts to a Red-Black Tree.

  ┌────────────────────────────────────────────────────────┐
  │  index    bucket                                       │
  │  ─────    ─────────────────────────────────────────── │
  │  [0]  →   null                                        │
  │  [1]  →   [K1,V1] → [K5,V5] → null  (linked list)   │
  │  [2]  →   null                                        │
  │  [3]  →   [K3,V3] → null                             │
  │  [4]  →   null                                        │
  │  [5]  →   [K2,V2] → [K7,V7] → ... (8+ = tree!)     │
  │  ...                                                   │
  │  [15] →   null                                        │
  └────────────────────────────────────────────────────────┘

  Default: 16 buckets, load factor 0.75
  Rehash when: size > capacity × loadFactor (16 × 0.75 = 12)
```

### 4.2 How put() Works

```
  map.put("name", "Harsha")

  STEP 1: Calculate hash
  ═══════════════════════

  int hash = hash(key.hashCode())

  // HashMap's hash() spreads bits to reduce collisions:
  static final int hash(Object key) {
      int h = key.hashCode();
      return h ^ (h >>> 16);  // XOR with upper 16 bits
  }

  STEP 2: Find bucket index
  ═════════════════════════

  int index = hash & (capacity - 1);  // Same as hash % capacity
  // Works because capacity is always power of 2!
  // 16 = 10000 in binary, 15 = 01111, so & masks lower bits

  STEP 3: Check bucket
  ═════════════════════

  If bucket is empty → create new Node, place it there. Done.
  If bucket has nodes → walk the list/tree:
    - If key matches (hash equal AND equals() returns true) → REPLACE value
    - If no match → append new Node at end

  STEP 4: Check if rehash needed
  ══════════════════════════════

  if (++size > threshold) resize();  // Double capacity: 16→32→64→...
```

### 4.3 Treeification (Java 8+) — and the DoS Attack That Motivated It

🔐 **Security Context: Hash Flooding Attack (2011)**
Scott A. Crosby and Dan S. Wallach demonstrated that by crafting HTTP POST parameters whose keys all hash to the same bucket, an attacker could turn O(1) HashMap operations into O(N²) — bringing a web server to its knees with just a few requests. Java 7 and below were vulnerable. Java 8's treeification was the fix.

```
  HASH FLOODING DoS:
  ══════════════════
  Attacker sends keys that all have hash mod N == 0:
  → All 10,000 request parameters land in bucket [0]
  → Linked list of 10,000 nodes
  → Each containsKey() = O(10,000) instead of O(1)
  → Server CPU maxes out on a few requests

  Java 8 Treeification Fix:
  ══════════════════════════
  When bucket has ≥ 8 nodes AND table size ≥ 64:
    Linked List → Red-Black Tree → O(log n) worst case
    Even all-same-bucket attack → O(log N) per lookup

  When bucket shrinks to ≤ 6 nodes:
    Tree → Linked List (untreeify — save memory)

  WHY 8? (Not 5 or 16?)
  At load factor 0.75, bucket size follows Poisson distribution (λ=0.75)
  P(bucket size ≥ 8) ≈ 0.00006% under random hashing.
  Reaching 8 items in a bucket = almost certainly a DoS attack or
  a badly broken hashCode().

  THRESHOLDS:
  TREEIFY_THRESHOLD = 8    (list → tree)
  UNTREEIFY_THRESHOLD = 6  (tree → list, hysteresis to avoid oscillation)
  MIN_TREEIFY_CAPACITY = 64 (won't treeify tiny tables — just resize instead)
```

### 4.4 The hashCode/equals Contract

```java
// RULE: If a.equals(b) → a.hashCode() == b.hashCode()
// But: a.hashCode() == b.hashCode() does NOT mean a.equals(b)

// BAD — breaks HashMap:
class Employee {
    String name;
    int id;

    @Override
    public boolean equals(Object o) {
        // Compares by id
        return this.id == ((Employee) o).id;
    }
    // No hashCode() override! Uses Object.hashCode() (memory address)
    // Two equal employees get DIFFERENT buckets → duplicate keys!
}

// GOOD:
class Employee {
    String name;
    int id;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Employee other = (Employee) o;
        return id == other.id && Objects.equals(name, other.name);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, name);  // Same fields as equals()!
    }
}
```

---

🔬 **Section Challenge — 4. HashMap Internals — The Deep Dive**

**Challenge 1 (Reasoning):** You insert 1000 entries into a HashMap with default capacity 16. How many resize operations happen?

<details><summary>Answer</summary>

Resize threshold = capacity × 0.75. Resizes at: 12 (16→32), 24 (32→64), 48 (64→128), 96 (128→256), 192 (256→512), 384 (512→1024). Total: 6 resizes. Each resize copies all entries to new bucket array. Pre-sizing: `new HashMap<>(1334)` (1000/0.75 ≈ 1334 → next power of 2 = 2048) avoids all resizes.

</details>

**Challenge 2 (Bug Hunt):** Two `Person` objects with same name and age. You override `equals()` to return true but not `hashCode()`. What happens when used as `HashMap` keys?

<details><summary>Answer</summary>

Both objects land in DIFFERENT buckets (different hashCodes → different bucket index). The HashMap doesn't check `equals()` across buckets — it goes straight to one bucket. So `map.get(person2)` returns NULL even though `person1.equals(person2)`. Overriding `equals` without `hashCode` violates the contract and breaks all hash-based collections. Always override both together.

</details>

**Challenge 3 (Architecture & GOOS Testing):** Java 8 introduced Red-Black treeification for HashMap buckets exceeding 8 nodes to mitigate Hash-Flooding DoS attacks. According to the principles of _Growing Object-Oriented Software_ (GOOS), testing internal thresholds like `TREEIFY_THRESHOLD = 8` breaks encapsulation. How would you design a robust test suite for a custom HashTable to verify worst-case collision mitigation without directly inspecting the internal node types?

<details><summary>Answer</summary>

**GOOS TDD Approach (Testing Behaviors, Not State):**
You do not mock or inspect the internal `Node` vs `TreeNode` classes—that binds tests to implementation details. Instead, test the **externally observable behavior**: Time Complexity.

1. **Define the Boundary:** Create a deterministic Hash Strategy interface (a Port in Hexagonal Architecture) that forces all keys to return the same hash code (e.g., `hash = 42`).
2. **The Test:** Insert 10,000 items using this mocked hash strategy.
3. **The Assertion:** Measure the elapsed time for 1,000 random `get()` operations. If the internal structure remains a LinkedList, the time will scale quadratically `O(N²)`. If treeification correctly engages, the time scales logarithmically `O(N log N)`.
By asserting on the non-functional requirement (Performance SLA) injected via a test double, you verify the architectural mitigation without compromising encapsulation.
</details>

## 5. TreeMap Internals — Red-Black Tree

```
  STRUCTURE: Self-balancing binary search tree (Red-Black Tree)

  Keys are always SORTED (natural order or Comparator).

            ┌───[K5]───┐
         ┌──[K3]──┐  ┌──[K8]──┐
       [K1]     [K4] [K6]   [K9]

  Red-Black Rules (simplified):
  1. Every node is red or black
  2. Root is always black
  3. No two consecutive red nodes (parent-child)
  4. Every path from root to null has same number of black nodes
  → Guarantees: height ≤ 2 × log(n) → O(log n) everything


  ┌──────────────────────┬────────────┐
  │ Operation            │ Time       │
  ├──────────────────────┼────────────┤
  │ put(key, value)      │ O(log n)   │
  │ get(key)             │ O(log n)   │
  │ remove(key)          │ O(log n)   │
  │ firstKey() / lastKey │ O(log n)   │
  │ floorKey / ceilingKey│ O(log n)   │
  │ subMap(from, to)     │ O(log n)   │
  └──────────────────────┴────────────┘

  USE WHEN: You need sorted keys, range queries, floor/ceiling lookups.
  The key class must implement Comparable or you must provide a Comparator.
```

```java
TreeMap<Integer, String> map = new TreeMap<>();
map.put(5, "five"); map.put(3, "three"); map.put(8, "eight");
map.put(1, "one"); map.put(4, "four");

map.firstKey();           // 1
map.lastKey();            // 8
map.floorKey(6);          // 5 (greatest key ≤ 6)
map.ceilingKey(6);        // 8 (smallest key ≥ 6)
map.subMap(3, 8);         // {3=three, 4=four, 5=five}
map.headMap(4);           // {1=one, 3=three} (keys < 4)
map.tailMap(4);           // {4=four, 5=five, 8=eight} (keys ≥ 4)
```

---

🔬 **Section Challenge — 5. TreeMap Internals — Red-Black Tree**

**Challenge 1 (Reasoning):** When should you use `TreeMap` over `HashMap`? What's the actual performance cost?

<details><summary>Answer</summary>

`TreeMap` use cases: range queries (`subMap`, `headMap`, `tailMap`), ordered iteration, `floorKey`/`ceilingKey`. Cost: every operation is O(log N) vs O(1) avg for HashMap. For 1M entries: HashMap ~1μs, TreeMap ~20μs per operation. Use TreeMap ONLY when sorted order is required — not as a default.

</details>

**Challenge 2 (Algorithmic Diagnostics):** You insert sequentially strictly increasing elements (1, 2, 3, 4, 5, 6, 7) into a standard Unbalanced BST and a Red-Black Tree (`TreeMap`). Explain exactly how the Red-Black Tree's invariant prevents the O(N) linked-list degeneration that destroys the Unbalanced BST.

<details><summary>Answer</summary>

An unbalanced BST degrades into a right-leaning linked list `(1 -> 2 -> 3 -> 4 -> ...)` because it passively accepts node placement. A Red-Black Tree enforces maximum height limits via invariant violation checks on every insertion:

1. **Insertion:** `1` is black (root). `2` is red. `3` is inserted as red.
2. **Invariant Violation:** Node `2` and `3` are both red (Red-Black Rule: No two consecutive red nodes allowed).
3. **Restructuring (Rotations & Color Flips):** The tree recognizes the imbalance. It performs a **Left Rotation** on `1`, making `2` the new black root, and `1` and `3` its red children.
4. **Result:** The tree is perfectly balanced `(1 <- 2 -> 3)`. As `4`, `5`, etc., are added, a cascade of color flips and rotations continuously pulls the right-leaning chain back into a balanced pyramid. This active self-correction is the exact mechanism that guarantees `O(log N)` search times, underpinning both `TreeMap` and Java 8's `HashMap` treeification defense.
</details>

## 6. LinkedHashMap — Insertion/Access Order

```
  STRUCTURE: HashMap + Doubly-Linked List threading through all entries

  HashMap buckets:         Linked list overlay:
  [0] → [K3,V3]           head → [K1,V1] ↔ [K3,V3] ↔ [K5,V5] → tail
  [1] → [K1,V1] → [K5,V5]  (insertion order maintained)
  [2] → null


  ACCESS-ORDER MODE → LRU Cache!
  ════════════════════════════════

  new LinkedHashMap<>(16, 0.75f, true);
  //                                ^^^^
  //                     accessOrder = true

  Every get() moves that entry to the END of the linked list.
  Least recently used entries are at the HEAD.
```

```java
// LRU Cache with LinkedHashMap:
class LRUCache<K, V> extends LinkedHashMap<K, V> {
    private final int maxSize;

    public LRUCache(int maxSize) {
        super(maxSize, 0.75f, true);  // accessOrder = true
        this.maxSize = maxSize;
    }

    @Override
    protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
        return size() > maxSize;  // Auto-remove LRU entry when full
    }
}

// Usage:
LRUCache<String, String> cache = new LRUCache<>(3);
cache.put("a", "1");
cache.put("b", "2");
cache.put("c", "3");
cache.get("a");        // Moves "a" to end (most recently used)
cache.put("d", "4");   // Removes "b" (least recently used)
// Cache: {c=3, a=1, d=4}
```

---

🔬 **Section Challenge — 6. LinkedHashMap — Insertion/Access Order**

**Challenge 1 (Design):** Implement a simple LRU cache using `LinkedHashMap` in 5 lines.

<details><summary>Answer</summary>

```java
Map<K,V> lru = new LinkedHashMap<K,V>(capacity, 0.75f, true) { // accessOrder=true
    protected boolean removeEldestEntry(Map.Entry<K,V> eldest) {
        return size() > capacity;
    }
};
```

`accessOrder=true` makes iteration order = access order (most recently accessed last). `removeEldestEntry` evicts when over capacity. This is exactly how many simple LRU caches are implemented in production.

</details>

## 7. HashSet — HashMap in Disguise

```
  SECRET: HashSet is literally a HashMap where values are a dummy object.

  public class HashSet<E> {
      private transient HashMap<E, Object> map;
      private static final Object PRESENT = new Object();  // dummy value

      public boolean add(E e) {
          return map.put(e, PRESENT) == null;
      }

      public boolean contains(Object o) {
          return map.containsKey(o);
      }

      public boolean remove(Object o) {
          return map.remove(o) == PRESENT;
      }
  }

  Similarly:
  • TreeSet uses TreeMap internally
  • LinkedHashSet uses LinkedHashMap internally
```

---

🔬 **Section Challenge — 7. HashSet — HashMap in Disguise**

**Challenge (Reasoning):** `new HashSet<>(list)` removes duplicates. What happens if the objects in the list have a broken `hashCode()` that always returns 42?

<details><summary>Answer</summary>

All elements hash to the same bucket (42 % capacity). HashSet then uses `equals()` to check within that bucket. Duplicates ARE still removed correctly — but performance degrades from O(N) to O(N²) because every insert searches through the entire bucket chain. A always-same hashCode is legal (all duplicates removed) but destroys the performance guarantee. This is the exact hash flooding pattern that motivated Java 8 treeification.

</details>

## 8. ConcurrentHashMap — Thread-Safe Without Global Locks

```
  PROBLEM WITH synchronized HashMap:
  ════════════════════════════════════

  Collections.synchronizedMap(new HashMap<>())
  → Locks the ENTIRE map for every operation
  → Only 1 thread can read/write at a time → terrible performance


  ConcurrentHashMap (Java 8+):
  ════════════════════════════

  • Lock-free reads (volatile + CAS)
  • Fine-grained locking: locks only the BUCKET being modified
  • Multiple threads can write to DIFFERENT buckets simultaneously

  ┌─────────────────────────────────────────────────┐
  │  [0] → nodes  ← Thread A writes here (locked)  │
  │  [1] → nodes  ← Thread B writes here (locked)  │
  │  [2] → nodes  ← Thread C reads here (no lock!) │
  │  [3] → nodes  ← Thread D reads here (no lock!) │
  │  ...                                            │
  └─────────────────────────────────────────────────┘

  Key mechanisms:
  • volatile Node[] table → all threads see latest array reference
  • CAS (Compare-And-Swap) for adding first node to empty bucket
  • synchronized(firstNode) for adding to non-empty bucket
  • Reads never block (no locks for get())
```

```java
ConcurrentHashMap<String, Integer> map = new ConcurrentHashMap<>();

// Atomic operations (thread-safe without external synchronization):
map.putIfAbsent("key", 0);
map.computeIfAbsent("key", k -> expensiveCompute(k));
map.merge("key", 1, Integer::sum);  // Atomic increment
map.compute("key", (k, v) -> v == null ? 1 : v + 1);

// DON'T do this (race condition):
if (!map.containsKey("key")) {    // Thread A checks
    map.put("key", value);         // Thread B also gets here!
}

// DO this instead:
map.putIfAbsent("key", value);    // Atomic check-and-put
```

---

🔬 **Section Challenge — 8. ConcurrentHashMap — Thread-Safe Without Global Locks**

**Challenge 1 (Reasoning):** You insert 1000 entries into a HashMap with default capacity 16. How many resize operations happen?

<details><summary>Answer</summary>

Resize threshold = capacity × 0.75. Resizes at: 12 (16→32), 24 (32→64), 48 (64→128), 96 (128→256), 192 (256→512), 384 (512→1024). Total: 6 resizes. Each resize copies all entries to new bucket array. Pre-sizing: `new HashMap<>(1334)` (1000/0.75 ≈ 1334 → next power of 2 = 2048) avoids all resizes.

</details>

**Challenge 2 (Bug Hunt):** Two `Person` objects with same name and age. You override `equals()` to return true but not `hashCode()`. What happens when used as `HashMap` keys?

<details><summary>Answer</summary>

Both objects land in DIFFERENT buckets (different hashCodes → different bucket index). The HashMap doesn't check `equals()` across buckets — it goes straight to one bucket. So `map.get(person2)` returns NULL even though `person1.equals(person2)`. Overriding `equals` without `hashCode` violates the contract and breaks all hash-based collections. Always override both together.

</details>

## 9. PriorityQueue — Binary Heap

```
  STRUCTURE: Min-heap backed by an array

  Array: [1, 3, 2, 7, 5, 4, 6]

  Conceptual tree:
            1
          /   \
         3     2
        / \   / \
       7   5 4   6

  Parent of index i: (i - 1) / 2
  Left child:        2i + 1
  Right child:       2i + 2

  INVARIANT: parent ≤ both children (min-heap)

  ┌──────────────────┬────────────┐
  │ Operation        │ Time       │
  ├──────────────────┼────────────┤
  │ offer(element)   │ O(log n)   │  ← bubble up
  │ poll()           │ O(log n)   │  ← remove root, bubble down
  │ peek()           │ O(1)       │  ← just return root
  │ contains()       │ O(n)       │  ← linear scan
  │ remove(element)  │ O(n)       │  ← find + bubble
  └──────────────────┴────────────┘
```

```java
// Min-heap (default):
PriorityQueue<Integer> minHeap = new PriorityQueue<>();
minHeap.offer(5); minHeap.offer(1); minHeap.offer(3);
minHeap.poll(); // Returns 1 (smallest)

// Max-heap:
PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Comparator.reverseOrder());
maxHeap.offer(5); maxHeap.offer(1); maxHeap.offer(3);
maxHeap.poll(); // Returns 5 (largest)

// Custom objects:
PriorityQueue<Task> taskQueue = new PriorityQueue<>(
    Comparator.comparingInt(Task::getPriority)
);

// Top K pattern (keep K largest elements):
PriorityQueue<Integer> topK = new PriorityQueue<>();  // min-heap of size K
for (int num : array) {
    topK.offer(num);
    if (topK.size() > k) {
        topK.poll();  // Remove smallest → keeps K largest
    }
}
```

---

🔬 **Section Challenge — 9. PriorityQueue — Binary Heap**

**Challenge (Design):** PriorityQueue.contains() is O(N) while add/poll are O(log N). You need frequent `contains()` checks alongside priority ordering. How do you solve this?

<details><summary>Answer</summary>

Maintain a `HashSet<E>` alongside the `PriorityQueue`. Before `offer()`: check `set.contains(e)`. Override `poll()` to also remove from set. This gives you O(1) `contains()` + O(log N) `poll()`. Used in Dijkstra implementations where you need to check if a node is already in the priority queue. Alternative: use a `TreeSet` which provides O(log N) poll + O(log N) contains + sorted order but no duplicate keys.

</details>

## 10. Fail-Fast vs Fail-Safe Iterators

```
  FAIL-FAST (ArrayList, HashMap, HashSet):
  ═══════════════════════════════════════

  If collection is modified DURING iteration → ConcurrentModificationException

  Mechanism: modCount field incremented on every structural change.
  Iterator checks: if (modCount != expectedModCount) throw CME!
```

```java
// FAILS:
List<String> list = new ArrayList<>(List.of("a", "b", "c"));
for (String s : list) {
    if (s.equals("b")) {
        list.remove(s);  // ConcurrentModificationException!
    }
}

// FIX 1: Use Iterator.remove():
Iterator<String> it = list.iterator();
while (it.hasNext()) {
    if (it.next().equals("b")) {
        it.remove();  // Safe! Updates expectedModCount
    }
}

// FIX 2: Use removeIf() (Java 8+):
list.removeIf(s -> s.equals("b"));

// FIX 3: Use CopyOnWriteArrayList (fail-safe):
List<String> safeList = new CopyOnWriteArrayList<>(List.of("a", "b", "c"));
for (String s : safeList) {
    safeList.remove(s);  // No exception! Iterates over snapshot.
}
```

```
  FAIL-SAFE (ConcurrentHashMap, CopyOnWriteArrayList):
  ══════════════════════════════════════════════════════

  Iterator works on a SNAPSHOT or WEAKLY CONSISTENT view.
  Never throws ConcurrentModificationException.

  Trade-off: May not reflect latest modifications during iteration.

  ┌─────────────────┬──────────────┬────────────────────────┐
  │ Collection      │ Iterator     │ Mechanism              │
  ├─────────────────┼──────────────┼────────────────────────┤
  │ ArrayList       │ Fail-fast    │ modCount check         │
  │ HashMap         │ Fail-fast    │ modCount check         │
  │ ConcurrentHM    │ Fail-safe    │ Weakly consistent      │
  │ CopyOnWriteAL   │ Fail-safe    │ Snapshot of array      │
  │ ConcurrentSkipLM│ Fail-safe    │ Weakly consistent      │
  └─────────────────┴──────────────┴────────────────────────┘
```

---

## 11. Memory Overhead Comparison

```
  MEMORY PER ELEMENT (approximate, 64-bit JVM, compressed oops):
  ══════════════════════════════════════════════════════════════

  ┌─────────────────────┬──────────────────────────────────────┐
  │ Collection          │ Overhead per element                 │
  ├─────────────────────┼──────────────────────────────────────┤
  │ int[] (primitive)   │ 4 bytes                              │
  │ Integer[] (boxed)   │ ~20 bytes (16 object header + 4)    │
  │ ArrayList<Integer>  │ ~20 bytes + 4-8 bytes (array slot)  │
  │ LinkedList<Integer> │ ~48 bytes (Node: 3 refs + Integer)  │
  │ HashMap<K,V>        │ ~48-80 bytes per entry              │
  │ TreeMap<K,V>        │ ~64-80 bytes per entry              │
  │ HashSet<E>          │ Same as HashMap (it IS a HashMap)   │
  └─────────────────────┴──────────────────────────────────────┘

  1 million integers:
  • int[]           → ~4 MB
  • ArrayList       → ~24 MB  (6x more!)
  • LinkedList      → ~48 MB  (12x more!)
  • HashMap         → ~72 MB  (18x more!)
```

---

## 12. Choosing the Right Collection

```
  ╔════════════════════════════════════════════════════════════════╗
  ║  DECISION GUIDE:                                              ║
  ║                                                                ║
  ║  Need ordered sequence?                                       ║
  ║  ├─ Random access → ArrayList                                 ║
  ║  ├─ Frequent add/remove at ends → ArrayDeque                  ║
  ║  └─ Queue behavior → LinkedList or ArrayDeque                 ║
  ║                                                                ║
  ║  Need unique elements?                                        ║
  ║  ├─ No order needed → HashSet (fastest)                       ║
  ║  ├─ Sorted → TreeSet                                          ║
  ║  └─ Insertion order → LinkedHashSet                           ║
  ║                                                                ║
  ║  Need key-value pairs?                                        ║
  ║  ├─ No order needed → HashMap (fastest)                       ║
  ║  ├─ Sorted by key → TreeMap                                   ║
  ║  ├─ Insertion order → LinkedHashMap                           ║
  ║  └─ Thread-safe → ConcurrentHashMap                           ║
  ║                                                                ║
  ║  Need priority processing?                                    ║
  ║  └─ PriorityQueue                                             ║
  ║                                                                ║
  ║  Need thread-safe list?                                       ║
  ║  ├─ Read-heavy → CopyOnWriteArrayList                        ║
  ║  └─ Write-heavy → Collections.synchronizedList or custom      ║
  ╚════════════════════════════════════════════════════════════════╝
```

---

**Next Chapter**: [Maven & Gradle Build Internals →](Ch14_Maven_Gradle.md)

🔬 **Section Challenge — 12. Choosing the Right Collection**

**Challenge (Design Decision):** You're building a leaderboard: track top-10 players by score, fast score updates, fast top-10 retrieval. Which collection(s)?

<details><summary>Answer</summary>

Two approaches: (1) `TreeMap<Integer, Set<String>>` keyed by score — O(log N) update, O(log N) top-10 via `tailMap()`. Problem: ties (two players same score). (2) `PriorityQueue<PlayerScore>` of size 10 (min-heap) — O(log 10) = O(1) insert, O(1) top check. But no fast lookup by player name. Production solution: HashMap<playerId, score> for O(1) score lookup PLUS a sorted structure (TreeMap or heap) for ranking. Same dual-structure pattern as LRU cache (HashMap + LinkedList).

</details>


---

## Reality Check

**"TreeMap is a HashMap that keeps keys sorted"** → TreeMap and HashMap are completely different data structures. HashMap uses a hash table (O(1) average get/put, unordered). TreeMap uses a Red-Black tree (O(log n) get/put, keys in sorted order). They are not variants of each other. LinkedHashMap is a HashMap variant (adds insertion-order doubly-linked list). Know which of the three you need: fast random access (HashMap), sorted iteration (TreeMap), insertion order (LinkedHashMap).

**"PriorityQueue.poll() removes a random element"** → `poll()` always removes and returns the *head* — the minimum element (default comparator is natural ordering, min-heap). It is NOT random. For a max-heap, pass `Collections.reverseOrder()` comparator: `new PriorityQueue<>(Collections.reverseOrder())`. For custom ordering: pass a `Comparator` to the constructor.

**"Collections.synchronizedList() is all I need for thread-safe list operations"** → `Collections.synchronizedList()` synchronizes individual methods. But iteration is NOT thread-safe: you must manually synchronize the list while iterating: `synchronized(list) { for (E e : list) {...} }`. Without this, another thread can modify the list during iteration causing `ConcurrentModificationException`. Prefer `CopyOnWriteArrayList` for read-heavy, or use proper concurrent data structures.

**"Deque stands for 'Double Queue'"** → Deque stands for **Double-Ended Queue**. It supports efficient insertion and removal at BOTH ends (head and tail). Not to be confused with two queues. `ArrayDeque` implements `Deque` — use it as a stack (faster than `Stack`) or queue (faster than `LinkedList`). It does NOT allow null elements.

**"The fail-fast iterator throws immediately when collection is modified"** → Fail-fast iterators detect structural modification via a `modCount` counter and throw `ConcurrentModificationException` on the NEXT iterator call (next `hasNext()` or `next()`), not at the moment of modification. The detection is best-effort — it is NOT guaranteed to catch every concurrent modification. It should not be used for thread-safety logic, only for detecting programming bugs.
