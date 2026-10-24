# #️⃣ 15.3 Design / Advanced Hashmap

> **Navigation**: [← 15.2 PREFIX SUM + HASHMAP (Medium–Hard)](03_prefix_sum_hashmap_mediumhard.md) | [Chapter overview](../17_HashMap_Hashing.md)
> Page 4 of 4 in **HashMap Hashing**


---

## #279. Insert Delete GetRandom O(1) (LC 380/381) ★ FULL SOLUTION

```
PROBLEM:
  Design a data structure that supports:
    • insert(val): Insert val. Returns true if not already present.
    • remove(val): Remove val. Returns true if present.
    • getRandom(): Return a random element with equal probability.
  Each operation must be O(1) average.

KEY OBSERVATION:
  • HashMap alone: insert/remove O(1), but getRandom needs index access → ✗
  • ArrayList alone: insert/getRandom O(1), but remove by value is O(n) → ✗
  • COMBINE BOTH: ArrayList for O(1) random access + HashMap for O(1) lookup.

  SWAP-WITH-LAST TRICK for O(1) deletion:
  To remove element at index i:
    1. Swap arr[i] with arr[last]
    2. Update HashMap entry for the swapped element
    3. Remove last element from ArrayList (O(1))
    4. Remove val from HashMap

ALGORITHM:
  Data: List<Integer> list, Map<Integer, Integer> valToIndex

  insert(val):
    if val in map → return false
    list.add(val), map.put(val, list.size()-1) → return true

  remove(val):
    if val not in map → return false
    idx = map.get(val)
    lastVal = list.get(list.size()-1)
    list.set(idx, lastVal)         // overwrite with last
    map.put(lastVal, idx)          // update last's index
    list.remove(list.size()-1)     // remove last (O(1))
    map.remove(val)
    return true

  getRandom():
    return list.get(rand.nextInt(list.size()))

PROOF ALL OPERATIONS O(1):
  • insert: HashMap.put O(1), ArrayList.add O(1) amortized → O(1)
  • remove: HashMap.get O(1), list.set O(1), list.removeLast O(1),
    HashMap.remove O(1), HashMap.put O(1) → O(1)
  • getRandom: ArrayList.get O(1), Random.nextInt O(1) → O(1)
  • Equal probability: list has exactly the active elements with no gaps,
    uniform random index → each element equally likely.  ∎

JAVA CODE:
```

```java
class RandomizedSet {
    private List<Integer> list;
    private Map<Integer, Integer> valToIndex;
    private Random rand;

    public RandomizedSet() {
        list = new ArrayList<>();
        valToIndex = new HashMap<>();
        rand = new Random();
    }

    public boolean insert(int val) {
        if (valToIndex.containsKey(val)) return false;
        valToIndex.put(val, list.size());
        list.add(val);
        return true;
    }

    public boolean remove(int val) {
        if (!valToIndex.containsKey(val)) return false;
        int idx = valToIndex.get(val);
        int lastVal = list.get(list.size() - 1);
        list.set(idx, lastVal);
        valToIndex.put(lastVal, idx);
        list.remove(list.size() - 1);
        valToIndex.remove(val);
        return true;
    }

    public int getRandom() {
        return list.get(rand.nextInt(list.size()));
    }
}
```

```
COMPLEXITY:
  All operations: O(1) average
  Space: O(n) — list + map each store n elements

VARIANTS:
  • Insert Delete GetRandom O(1) - Duplicates (LC 381): map value → Set<Integer> of indices
  • Design a Leaderboard (LC 1244)
```

---

## #280. [LRU Cache](https://leetcode.com/problems/lru-cache/) (LC 146) ★ FULL SOLUTION

```
PROBLEM:
  Design a Least Recently Used (LRU) cache with capacity.
    • get(key): Return value if key exists, else -1. Marks as recently used.
    • put(key, value): Insert/update. If capacity exceeded, evict LRU entry.
  Both operations must be O(1).

KEY OBSERVATION:
  Need O(1) lookup → HashMap.
  Need O(1) insertion/removal at both ends + O(1) move-to-front → Doubly Linked List.
  Combine: HashMap<Key, Node> + Doubly Linked List.

  Sentinel nodes (dummy head/tail) eliminate edge cases.

ALGORITHM:
  Data: HashMap<Integer, Node> map, DLL with head ↔ ... ↔ tail sentinels

  get(key):
    if key not in map → return -1
    node = map.get(key)
    moveToHead(node)    // mark as recently used
    return node.value

  put(key, value):
    if key in map:
      node = map.get(key)
      node.value = value
      moveToHead(node)
    else:
      node = new Node(key, value)
      map.put(key, node)
      addToHead(node)
      if map.size > capacity:
        lru = tail.prev
        removeNode(lru)
        map.remove(lru.key)

  Helper operations (all O(1)):
    addToHead(node): insert after head sentinel
    removeNode(node): unlink node from DLL
    moveToHead(node): removeNode(node) + addToHead(node)

PROOF O(1) FOR ALL OPERATIONS:
  • get: HashMap lookup O(1) + DLL move O(1) → O(1)
  • put: HashMap lookup/insert O(1) + DLL add/remove O(1) → O(1)
  • Eviction: tail.prev gives LRU in O(1), DLL removal O(1), HashMap removal O(1)

  The DLL maintains temporal ordering: head.next = MRU, tail.prev = LRU.
  Every access moves node to head → ordering is always correct.  ∎

JAVA CODE:
```

```java
class LRUCache {
    private class Node {
        int key, value;
        Node prev, next;
        Node(int k, int v) { key = k; value = v; }
    }

    private int capacity;
    private Map<Integer, Node> map;
    private Node head, tail; // sentinels

    public LRUCache(int capacity) {
        this.capacity = capacity;
        map = new HashMap<>();
        head = new Node(0, 0);
        tail = new Node(0, 0);
        head.next = tail;
        tail.prev = head;
    }

    public int get(int key) {
        if (!map.containsKey(key)) return -1;
        Node node = map.get(key);
        moveToHead(node);
        return node.value;
    }

    public void put(int key, int value) {
        if (map.containsKey(key)) {
            Node node = map.get(key);
            node.value = value;
            moveToHead(node);
        } else {
            Node node = new Node(key, value);
            map.put(key, node);
            addToHead(node);
            if (map.size() > capacity) {
                Node lru = tail.prev;
                removeNode(lru);
                map.remove(lru.key);
            }
        }
    }

    private void addToHead(Node node) {
        node.prev = head;
        node.next = head.next;
        head.next.prev = node;
        head.next = node;
    }

    private void removeNode(Node node) {
        node.prev.next = node.next;
        node.next.prev = node.prev;
    }

    private void moveToHead(Node node) {
        removeNode(node);
        addToHead(node);
    }
}
```

```
COMPLEXITY:
  All operations: O(1)
  Space: O(capacity) — map and DLL both hold at most capacity entries

NOTE: Java's LinkedHashMap with accessOrder=true IS an LRU cache.
  But interviewers expect you to implement from scratch.

VARIANTS:
  • LFU Cache (LC 460) — evict least frequently used (harder)
  • Design In-Memory File System (LC 588)
  • All O(1) Data Structure (LC 432)
```

---

## #281. Employees Under Every Manager (GFG) — Approach

```
APPROACH: Build tree from HashMap
  1. Map<String, String> managerOf = direct manager mapping
  2. Map<String, List<String>> subordinates = reverse mapping
  3. DFS/BFS from each manager to count all transitive reports
  4. Memoize results in a HashMap

  Time: O(n), Space: O(n) — each employee processed once with memoization.
```

---

## #282. Smallest Positive Missing Number (GFG) — Approach

```
APPROACH: In-place hashing (cyclic sort variant)
  1. Place each value v in [1..n] at index v-1 (swap until correct or out of range)
  2. Scan array: first index i where arr[i] ≠ i+1 → answer is i+1
  3. If all correct → answer is n+1

  This is the SAME in-place hashing principle as #268.
  Time: O(n) — each element swapped at most once. Space: O(1).
```

---

## 📌 15.4 Hidden Gems

---

### #283. [Valid Parentheses](https://leetcode.com/problems/valid-parentheses/) (LC 20) — Approach

```
APPROACH: Stack + HashMap for bracket matching
  1. map = { ')' → '(', '}' → '{', ']' → '[' }
  2. For each char: if opening → push. If closing → pop and check match.
  3. Valid iff stack empty at end.

  HashMap makes the matching check clean: map.get(c) == stack.pop().
  Time: O(n), Space: O(n).
```

---

### #284. [Isomorphic Strings](https://leetcode.com/problems/isomorphic-strings/) (LC 205) — Approach

```
APPROACH: Two HashMaps for bijection
  1. map1: s[i] → t[i] (forward mapping)
  2. map2: t[i] → s[i] (reverse mapping)
  3. At each position, verify both mappings are consistent.
  4. If any conflict → not isomorphic.

  Why TWO maps? "ab" → "aa" should be false.
  map1 alone would accept it (a→a, b→a), but map2 catches it (a→a, a→b conflict).
  Time: O(n), Space: O(|alphabet|).
```

---

### #285. First Non-Repeating Character in Stream (GFG) — Approach

```
APPROACH: DLL + HashMap
  1. HashMap<Character, Node> maps char to its DLL node (or null if repeated)
  2. DLL maintains order of non-repeating characters
  3. On new char:
     • If not seen: create node, add to DLL tail, put in map
     • If in DLL (first repeat): remove from DLL, mark in map as repeated
     • If already repeated: ignore
  4. First non-repeating = DLL head

  Time: O(1) per character, Space: O(|alphabet|).

  Simpler alternative: int[26] frequency + queue (lazy deletion).
```

---

## #️⃣ Hashmap Complexity Cheat Sheet

**HASHMAP COMPLEXITY REFERENCE**

| Operation | Average | Worst | Notes |
| --- | --- | --- | --- |
| HashMap.get(key)<br>HashMap.put(key, val)<br>HashMap.remove(key)<br>HashMap.containsKey(key)<br>HashMap.containsValue(val)<br>HashSet.add/remove/contains<br>TreeMap.get/put/remove<br>LinkedHashMap.get/put | O(1)<br>O(1)*<br>O(1)<br>O(1)<br>O(n)<br>O(1)<br>O(log n)<br>O(1) | O(log n)<br>O(n)<br>O(log n)<br>O(log n)<br>O(n)<br>O(log n)<br>O(log n)<br>O(log n) | Tree buckets in Java8<br>*amortized (rehash)<br>Tree buckets<br>Full scan!<br>Same as HashMap<br>Red-Black Tree + insertion order |
| PATTERN → COMPLEXITY:<br>Frequency Count:       O(n) time, O(n) space<br>Two-Sum (one-pass):    O(n) time, O(n) space<br>Prefix Sum + HashMap:  O(n) time, O(n) space<br>Group Anagrams:        O(NK) time, O(NK) space (count-key approach)<br>Longest Consecutive:   O(n) time, O(n) space<br>LRU Cache:             O(1) per operation, O(capacity) space<br>RandomizedSet:         O(1) per operation, O(n) space |  |  |  |
| WHEN TO USE WHAT:<br>HashMap      → unordered, O(1) average, allows null key<br>TreeMap      → sorted keys, O(log n), NavigableMap (floor/ceiling)<br>LinkedHashMap→ insertion-order iteration, basis for LRU<br>HashSet      → membership test only (no values)<br>ConcurrentHM → thread-safe, no null keys/values |  |  |  |

---

## 📌 Mastery Checklist

**HASHMAP MASTERY CHECKLIST**

```text
FUNDAMENTALS:
□ Can explain hash function, collision resolution, load factor
□ Can derive O(1) expected time under SUHA
□ Know Java HashMap internals (buckets, treeify, rehash)
□ Understand hashCode/equals contract

FREQUENCY COUNTING:
□ Two Sum — one-pass complement lookup
□ Group Anagrams — sort-key and count-key approaches
□ Find All Duplicates — in-place negation trick
□ Top K Frequent — bucket sort approach

PREFIX SUM + HASHMAP:
□ Subarray Sum Equals K — can trace through example
□ Subarrays Divisible by K — remainder grouping + Java mod fix
□ Largest 0-Sum Subarray — first occurrence technique
□ Understand WHY sliding window fails with negative numbers

DESIGN:
□ RandomizedSet — ArrayList + HashMap, swap-with-last trick
□ LRU Cache — HashMap + Doubly Linked List from scratch
□ Can prove O(1) for all operations in both designs

PATTERN RECOGNITION:
□ "O(n²) brute force with inner search" → HashMap makes it O(n)
□ "Count subarrays with property X" → prefix sum + HashMap
□ "Group things by property" → HashMap with computed key
□ "Need O(1) membership test" → HashSet
□ "Design O(1) everything" → combine HashMap with another structure

EDGE CASES:
□ Handle null keys, empty arrays, single-element arrays
□ Java negative modulo: ((x % k) + k) % k
□ Integer overflow in prefix sums → use long if needed
□ Duplicate values in input (distinguish value vs. index)

SCORE: ___/20 items checked
TARGET: 18+ before moving to next section
```

---

**End of Section 15** | Problems #266–#285 (20 problems)
[Prev: Heap & Priority Queue](../16_Heap.md) | [Index](../../00_MASTER_INDEX.md) | [Next: Bit Manipulation](../18_BitManipulation.md)

---

---

## 🏆 Competitive Programming — Codeforces Problems

| Problem               | Link                                                         | Technique            | Difficulty  |
| --------------------- | ------------------------------------------------------------ | -------------------- | ----------- |
| Primes or Palindromes | [CF 551B](https://codeforces.com/problemset/problem/551/B)   | HashMap + sieve      | ⭐ Easy     |
| Berland Sequence      | [CF 1015D](https://codeforces.com/problemset/problem/1015/D) | Frequency map        | ⭐⭐ Medium |
| Colorful Graph        | [CF 246D](https://codeforces.com/problemset/problem/246/D)   | HashMap grouping     | ⭐⭐ Medium |
| New Year and Counting | [CF 750C](https://codeforces.com/problemset/problem/750/C)   | HashMap + prefix sum | ⭐⭐ Medium |
| Ants                  | [CF 6C](https://codeforces.com/problemset/problem/6/C)       | HashMap + sorting    | ⭐⭐ Medium |
| Vanya and Triangles   | [CF 552C](https://codeforces.com/problemset/problem/552/C)   | HashMap + geometry   | ⭐⭐⭐ Hard |

---

## 🌍 Real-World Applications of HashMap & Hashing

| Technique                     | Real-World System                         | How It's Used                                                       |
| ----------------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| **Two-Sum complement lookup** | Financial fraud detection                 | Quickly find if a pair of transactions sums to a laundering target  |
| **Frequency map**             | Log analysis (Splunk, ELK)                | Count occurrences of error codes across millions of log lines       |
| **Prefix sum + HashMap**      | Analytics dashboards                      | Range sum queries on time-series data without scanning from scratch |
| **Grouping (anagram-style)**  | Duplicate file finder                     | SHA-256 hash each file → group by hash → identical content detected |
| **HashSet visited**           | Web crawler (Googlebot)                   | Track already-crawled URLs in O(1) to avoid loops                   |
| **Consistent hashing**        | Distributed systems (DynamoDB, Cassandra) | Assign data to servers; add/remove servers with minimal reshuffling |

```
🔥 CONSISTENT HASHING — THE REAL DEAL:
   Regular modulo hash: server = hash(key) % N
   Problem: Add a server → 90%+ of keys relocate!

   Consistent hash ring: keys AND servers on circular ring
   Key goes to nearest server clockwise → only K/N keys move on add/remove
   "Used (in variants) by: Amazon Dynamo (paper), Apache Cassandra, memcached client libraries; Redis Cluster uses fixed hash slots instead"

---

### Historical Evolution

Hashing was developed at IBM in the early 1950s: Hans Peter Luhn's 1953 memo described chaining and Amdahl, Boehme, Rochester and Samuel used open addressing around the same time. Knuth's *TAOCP* Vol. 3 (1973) gave the classical analysis; Carter and Wegman introduced universal hashing (1977); Karger et al. introduced consistent hashing (1997), later used in systems such as Amazon's Dynamo (paper 2007). The birthday-problem estimate explains why collisions appear early.

- **Luhn — 1953**: Chained hashing
- **Knuth — 1973**: Analysis of hashing
- **Carter & Wegman — 1977**: Universal hash families
- **Karger et al. — 1997**: Consistent hashing
- **DeCandia et al. — 2007**: Dynamo paper

### Production Reality

**HashMap and Hashing** patterns introduce several production failure modes that learners must internalize:

**Failure mode 1: Hash collision denial-of-service.** When web applications use untrusted input as HashMap keys, attackers craft requests with thousands of keys sharing identical hash codes. Java's HashMap degrades from O(1) to O(n) per operation, causing CPU saturation. Illustrative impact: one crafted request carrying thousands of colliding keys can saturate a CPU. This attack class was published in 2003 and 2011 and affected several platforms (PHP, ASP.NET, Java, Ruby, Python). It remains relevant for any API that accepts untrusted string keys; mitigations are keyed hashing, tree bins (Java 8+) and limits on parameter counts.

**Failure mode 2: Resize performance cliff at capacity threshold.** HashMap with default load factor 0.75 doubles capacity when 75% full. A map that reaches 12,288 entries (75% of a 16,384-slot table) triggers a resize to 32,768 slots — a single resize operation copies all entries and temporarily doubles memory. Under high write throughput, this causes GC pressure spikes. Illustrative impact: latency spikes in request processing, visible in p99 latency graphs. Pre-size maps (`new HashMap<>(expectedSize / 0.75f + 1)`) when the size is known.

**Failure mode 3: Null key/value semantics vary by language.** Java's HashMap permits one null key and multiple null values; Guava's ImmutableMap permits neither. ConcurrentHashMap rejects null keys and values entirely. Illustrative impact: code moved from `HashMap` to `ConcurrentHashMap` throws `NullPointerException` at runtime.

**Debug workflow:** (1) Pre-size maps with `new HashMap<>(expectedSize / 0.75 + 1)` to avoid resizes; (2) For untrusted input, use `String.hashCode()` replacement or consistent hashing with randomization; (3) Verify null-handling behavior matches expectations for the specific Map implementation in use; (4) Profile with `-XX:+PrintGCDetails` to detect resize-related GC pressure.

**Real-world anchor:** Crosby and Wallach described algorithmic-complexity attacks on hash tables in 2003, and in December 2011 Klink and Wälde showed that colliding keys in request parameters could saturate the CPUs of PHP, ASP.NET, Java, Ruby and Python servers. Vendors responded with randomised or keyed hashing (for example SipHash), limits on parameter counts, and, in Java 8+, balanced-tree bins for long chains.
```

---

[← 15.2 PREFIX SUM + HASHMAP (Medium–Hard)](03_prefix_sum_hashmap_mediumhard.md) | [Chapter overview](../17_HashMap_Hashing.md)
