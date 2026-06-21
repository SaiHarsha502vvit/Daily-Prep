**Navigation**: [< Previous Chapter](01d_Stack_Queue.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next Chapter >](01f_Trees_Heaps.md)

---

# #️⃣ Part 6: Hash Table

### 5W1H: Deep Understanding of Hash Table

```
╔══════════════════════════════════════════════════════════════════════╗
║  WHAT: A Hash Table (or HashMap) is a data structure that maps keys  ║
║        to values for highly efficient lookups, using a hash function ║
║        to compute an index into an array of buckets.                 ║
║                                                                      ║
║  WHY:  Searching an array or linked list for a specific element is   ║
║        O(N). Binary search on a sorted array is O(log N). We need a  ║
║        way to find, insert, and delete data in O(1) time.            ║
║                                                                      ║
║  WHO:  Every software engineer. Hash tables are the most frequently  ║
║        used data structure in real-world application development.    ║
║                                                                      ║
║  WHEN: Use when you need instant lookups by a unique identifier.     ║
║        ✔ Caching (LRU, Memcached, Redis)                             ║
║        ✔ Counting frequencies (word counts, duplicates)              ║
║        ✔ Fast pair finding (Two-Sum problem)                         ║
║        ✘ When you need data in sorted order (use TreeMap)            ║
║                                                                      ║
║  HOW:  Pass the key through a hash function (e.g., `hashCode()`) to  ║
║        get an integer, use modulo to find the bucket index, and      ║
║        handle collisions via chaining (linked lists) or probing.     ║
╚══════════════════════════════════════════════════════════════════════╝
```

## PART 0: COMPLETE UNDERSTANDING — The WHY Before the WHAT

### What Problem Does a Hash Table Solve?

**The Lookup Problem:** "Given a key, find its value."

| Approach                     | Time Complexity                            |
| ---------------------------- | ------------------------------------------ |
| Array lookup by index        | O(1) — but you need an integer index!      |
| Array lookup by value        | O(n) — must scan everything                |
| Sorted array + binary search | O(log n) — better, but not instant         |
| **Hash Table**               | **O(1)** — converts any key into an index! |

💡 **Hash Table Breakthrough:**
"What if we could CONVERT any key into an index?"
`hash("Alice") → 3` → `table[3] = Alice's data` → **O(1) lookup!**

Keys can be strings, objects, anything — the hash function handles it.

### Who Invented It and Why?

**1953: H.P. Luhn at IBM.** IBM's compilers had to look up variable names — with 10,000 variables, linear search meant 10,000 comparisons per lookup. Programs had thousands of lookups → **minutes to compile**.

💡 **Luhn's insight:** Use a mathematical function to _compute_ the location directly.
`hash("myVariable") → index 4271 → O(1) direct access!`

**Impact:**

- Compilers went from **minutes to seconds**
- Databases became practical (hash indexes)
- Every modern language has built-in HashMap/Dictionary
- Used in: caching, deduplication, routing, spell checkers

### When to Use (and NOT Use) Hash Tables

**✅ USE Hash Table when:**

- You need **O(1) average** lookup, insert, delete
- You're counting frequencies ("how many times does X appear?")
- You're checking for existence ("have I seen X before?")
- You're grouping by key ("group all anagrams together")
- You need two-sum style "complement finding"

**❌ DO NOT USE when:**

- You need sorted/ordered data → Use **TreeMap** instead
- You need range queries ("all keys between A and B") → **TreeMap**
- Memory is very tight → Hash tables waste ~50% space
- You need **worst-case** O(1) → Hash tables are O(1) _average_, O(n) worst
- Input is very small (< 20 elements) → Simple array might be faster

### The Big Picture: How HashMap Works in Java

```java
HashMap<String, Integer> map = new HashMap<>();
map.put("Alice", 85);
```

**Step by Step:**

1. Compute hash: `"Alice".hashCode()` → `63650081`
2. Reduce to index: `63650081 % 16` → `1` (16 = default capacity)
3. Store at `buckets[1]`: `("Alice", 85)`

**Retrieval:** `map.get("Alice")` → hash → `1` → go to `buckets[1]` → found! Return `85`. Time: **O(1)**.

⚠️ **Collision handling:**

- **Java 8+:** If chain length > 8 → convert to **Red-Black Tree** → O(log n) worst case
- **Before Java 8:** Always linked list → O(n) worst case

### Why O(1) Is True — and the Honest Conditions Under Which It's a Lie

"Hash tables are O(1)" is the most-repeated and least-understood claim in data structures. The real statement has conditions, and a senior engineer knows all of them. Let's build the truth.

**The actual cost is O(1 + α), where α = load factor = n / (number of buckets).** A lookup does two things: (1) compute the hash and jump to a bucket — genuinely O(1); (2) scan that bucket's chain for the matching key — O(chain length). So the whole cost rides on **how long the chains are**, and the average chain length is exactly α.

Why is average chain length α? If you spread n keys across m buckets and the hash function scatters them *uniformly*, each bucket holds n/m keys on average — that's the definition of α. So:

- α = 0.5 → average half an element per bucket → lookups touch ~1 element → O(1).
- α = 5 → average 5 per bucket → every lookup scans ~5 → still constant, but 5× slower.
- α = n (one bucket, everything collides) → one chain of length n → **O(n).** The hash table has degenerated into a linked list.

**This is why resizing exists and isn't optional.** Java's HashMap watches α and, when it crosses **0.75**, doubles the bucket count and rehashes every entry into the bigger table. Doubling halves α, pulling chains back down to ~1. That rehash costs O(n) — but it happens rarely (only at 0.75, 1.5×0.75, …), so amortized over all the insertions it adds only O(1) per insert. (Exact same doubling/amortization argument as the dynamic array — [memory foundations](01a_Memory_Foundations.md).) **Keeping α bounded is the whole job; lose that and O(1) evaporates.**

**Now the honest part — O(1) is a probabilistic claim, and it has enemies:**

1. **It assumes the hash function spreads keys uniformly.** That's an *assumption about the distribution of your keys vs. your hash function*, not a guarantee. A terrible `hashCode()` that returns the same value for every object dumps all n keys into one bucket → O(n), with no exception thrown, just mysterious slowness.

2. **An adversary can force the worst case (HashDoS).** If keys come from untrusted input (HTTP form fields, JSON keys) and the attacker knows your hash function, they can craft thousands of keys that *all hash to the same bucket* — turning your O(1) map into an O(n) chain and your O(n) request-processing loop into O(n²). This was a real, weaponized CVE across web frameworks around 2011. Two defenses, both shipped in production:
   - **Randomized/seeded hashing** so the attacker can't predict the bucket (used in many language runtimes).
   - **Treeify the bucket** — Java 8's fix: when a single chain exceeds 8 entries, convert that bucket from a linked list to a **red-black tree**, capping the worst case at **O(log n)** per bucket instead of O(n). So Java's true worst case is O(log n), not O(n), specifically because the designers refused to trust the uniformity assumption.

> **State it precisely, the way a staff engineer would:** hash-table operations are **O(1) _expected_, amortized over resizes, _assuming_ the hash function distributes keys uniformly across buckets.** Every word in that sentence is load-bearing. "Expected" (not guaranteed — depends on key distribution), "amortized" (individual inserts can trigger an O(n) resize), "assuming uniform" (a bad hashCode or an adversary breaks it). The interview answer "O(1)" is the *headline*; this sentence is the *article*.

### HashMap vs TreeMap vs LinkedHashMap — Decision Matrix

| Feature      | HashMap        | TreeMap          | LinkedHashMap      |
| ------------ | -------------- | ---------------- | ------------------ |
| Lookup       | O(1) avg       | O(log n)         | O(1) avg           |
| Insert       | O(1) avg       | O(log n)         | O(1) avg           |
| Ordered      | ❌ No          | ✅ Sorted by key | ✅ Insertion order |
| Null key     | ✅ 1 allowed   | ❌ No            | ✅ 1 allowed       |
| Thread-safe  | ❌ No          | ❌ No            | ❌ No              |
| **Best for** | General lookup | Range queries    | LRU cache          |

🎯 **Interview rule of thumb:**

- "Need lookup?" → **HashMap**
- "Need sorted keys?" → **TreeMap**
- "Need insertion order?" → **LinkedHashMap**
- "Need thread safety?" → **ConcurrentHashMap**

### Hash Table Variants & Trade-offs

Not all hash maps are created equal. Different implementations make different trade-offs across thread-safety, ordering, memory, and lookup guarantees. This table captures the key dimensions.

| Variant                  | Structure                       | Key Equality                 | Thread-Safety               | Memory Overhead           | Lookup Complexity              | Use Case                                  |
| ------------------------ | ------------------------------- | ---------------------------- | --------------------------- | ------------------------- | ------------------------------ | ----------------------------------------- |
| **HashMap** (Java)       | Array + linked list / red-black tree | `equals()`              | None                        | ~40% empty (0.75 LF)      | O(1) avg / O(log n) worst      | General-purpose lookups                   |
| **LinkedHashMap**        | HashMap + Doubly DLL            | `equals()`                   | None                        | +2 pointers per entry     | O(1) avg                       | LRU cache, insertion-order iteration      |
| **TreeMap**              | Red-Black Tree                  | `compareTo()` / `Comparator` | None                        | O(log n) per node         | O(log n)                       | Sorted keys, range queries                |
| **Hashtable** (legacy)   | Array + linked list             | `equals()`                   | Synchronized (full lock)    | High (full sync)          | O(1) avg                       | Legacy code compatibility                 |
| **ConcurrentHashMap**    | Segment array + CAS             | `equals()`                   | Lock striping (16 segments) | Moderate                  | O(1) avg (read), O(n/16) worst | High-concurrency production use           |
| **WeakHashMap**          | HashMap with `WeakReference<K>` | `equals()`                   | None                        | Low                       | O(1) avg                       | Cache entries that don't prevent GC       |
| **IdentityHashMap**      | Open-addressing array           | `==` (reference equality)    | None                        | Minimal                   | O(1) avg                       | Security managers, system-level interning |
| **EnumMap**              | Dense `Object[]` array          | Ordinal index                | None                        | Very low (no hash)        | O(1) constant                  | Enum-keyed maps (most efficient possible) |
| **ImmutableMap** (Guava) | Hash array (copied on write)    | `equals()`                   | Immutable by design         | Moderate (copy on write)  | O(1) avg                       | Config objects, DTOs, defensive copying   |
| **Caffeine**             | W-TinyLFU + LIRS + LRU          | `equals()`                   | Optional (async)            | Tunable (weigher, expiry) | O(1) amortized                 | High-performance in-memory cache          |

> **Trade-off Discussion:** Choosing a hash map variant means choosing which axis to optimize:
>
> - **Memory vs. Speed:** Open-addressing (IdentityHashMap) uses less memory than chaining but degrades faster under high load. EnumMap has the lowest memory footprint of all — no hash computation needed, just ordinal indexing.
> - **Thread-Safety vs. Performance:** `Hashtable` synchronizes every operation with a full lock — safe but slow under contention. `ConcurrentHashMap` uses lock striping (16 segments in JDK 8) so concurrent reads are lock-free and only writes that touch the same segment block each other. For single-threaded code, plain `HashMap` is always faster.
> - **Sorted vs. Unsorted:** `TreeMap` maintains keys in sorted order (O(log n) for all operations) at the cost of a more complex structure. Use `TreeMap` only when you need `subMap()`, `firstKey()`, or range queries. Never use it for simple lookups.
> - **Weak References vs. Strong:** `WeakHashMap` allows the GC to collect entries when the only remaining reference to the key is from within the map itself. This is ideal for canonicalization caches or memoization where you don't want long-lived map entries to prevent GC of the underlying objects. But beware: storing a strong reference to the key from the value (e.g., `map.put(key, new StrongRefToKey(key))`) resurrects the key and defeats the weak semantics entirely.

---

### Mental Model: Library Card Catalog

**Hash Table = Card catalog in a library**

`Book title` → `Card catalog formula` → `Drawer number` → `Exact card`

- **"Harry Potter"** → formula → Drawer 42 → Card with shelf location
- **Collision** = Two books map to same drawer → Multiple cards in Drawer 42 → search within (chaining)
- **Load Factor** = How full the drawers are → Too full (>75%) → Time to get a bigger cabinet (resize/rehash)
- **Rehashing** = Moving all cards to a bigger cabinet → Drawer numbers change → Must recompute every card's position → Expensive O(n) but rare (amortized O(1) per insert)

🎲 **Birthday Paradox — Why Collisions Are Inevitable:**
In a room of 23 people, the probability that TWO share a birthday is already 50%. HashMap collision logic is identical — with even a good hash function, collisions start happening long before the table is full. This is why you NEED a load factor threshold and chaining: not because your hash function is bad, but because mathematics guarantees collisions sooner than you'd think.

**Why 0.75 specifically?**
It's a carefully researched balance between space efficiency and lookup performance. Below 0.5: too much empty space (memory wasted). Above 0.9: collision chains grow, O(1) degrades toward O(n). At 0.75: average chain length ≈ 1-2 entries (Poisson distribution with λ=0.75 → P(chain≥8) < 0.00006%). This is also why Java uses 8 as the treeification threshold — at load factor 0.75, having ≥8 items in ONE bucket has probability < 1 in a million under random hashing.

---

### Explicit Invariants — What Must Always Be True

Understanding invariants clarifies WHY hash tables work and WHY they break.

> **Invariant 1 — HashMap Load Factor:**
> `loadFactor = size / capacity` must stay ≤ `DEFAULT_LOAD_FACTOR (0.75)`. A resize is triggered when `(size + 1) > threshold` (where `threshold = capacity × loadFactor`). This guarantees average chain length stays O(1).

> **Invariant 2 — Hash Table Collision Bound:**
> Under **uniform hashing** (all keys equally likely across all bucket indices), the expected chain length is O(1). Pathological inputs that all hash to the same bucket break this invariant — chains grow to O(n), degrading all operations.

> **Invariant 3 — Java String hashCode Determinism:**
> `s.hashCode()` is deterministic: calling it twice on the same `String s` always returns the same int. This is guaranteed by the JLS. The same string always maps to the same bucket. This is why HashMap keys must produce consistent hash codes across all operations.

> **Invariant 4 — equals() / hashCode() Contract:**
> If `a.equals(b)` is true, then `a.hashCode() == b.hashCode()` must be true. Violating this breaks HashMap's bucket-based lookup entirely — objects that are equal may land in different buckets, making `containsKey()` and `get()` unreliable.

---

## 🎓 University Proof Corner

> **MIT 6.006 L8 / RWTH Aachen Algo I layer** — Why hash tables give correct lookups, why they break down with bad hash functions, and why universal hashing makes O(1) a guarantee against any adversary.

### Correctness: `get(k)` Returns the Right Value

**Invariant**: After any sequence of `put(k, v)` and `remove(k)` operations, for every key `k'`, the chain at bucket `h(k')` contains exactly the live entries whose key equals `k'`.

**Proof by induction on operation count**:

- **Base case (empty table)**: All chains empty. Invariant holds vacuously. ✓
- **Maintenance — `put(k, v)`**: Locate bucket `h(k)`. Walk the chain to find any existing entry with key `k`. If found, replace its value. If not, prepend a new entry `(k, v)`. Either way, the chain has exactly the live entries for `k` (plus any other keys that happen to hash to this bucket). ✓
- **Maintenance — `remove(k)`**: Locate bucket `h(k)`. Walk chain; remove the entry with key `k`. The chain now has exactly the live entries (without `k`). ✓
- **Termination**: `get(k)` walks the chain at `h(k)` and returns the value of the entry with key `k`, or `null` if none. By the invariant, this is exactly the live value (or absent). ✓

### Why a Fixed Hash Function is Vulnerable

For any fixed `h`, an adversary who knows `h` can construct `n` keys `k₁, ..., kₙ` that all hash to the same bucket. Then:

- `put` of all n keys: O(n) per insert (chain traversal) → O(n²) total
- `get` of any key: O(n) worst case

This is the **HashDoS attack** — demonstrated in 2011 against PHP, Python, Ruby, Java (pre-7u6), and ASP.NET. A single HTTP request with crafted keys consumed minutes of CPU.

### Why Universal Hashing Defeats the Adversary

**Universal family H**: For any two distinct keys `x ≠ y`: Pr_{h∈H}[h(x) = h(y)] ≤ 1/m.

**Standard construction**: `h_{a,b}(x) = ((a·x + b) mod p) mod m` for prime `p > |U|`, random `a ∈ {1, ..., p−1}`, random `b ∈ {0, ..., p−1}`.

**Expected chain length**: For n keys and m ≥ n buckets:
  E[chain at any bucket] = Σ_{y ≠ x} Pr[h(y) = h(x)] ≤ (n−1)/m ≤ 1

So expected lookup = O(1) **regardless of input** — the adversary cannot construct a worst case because they cannot predict the random `a, b`.

**In practice**: Java 7u6+, Python 3.3+, Ruby 1.9+ all randomize the hash seed per JVM/process. This is universal hashing against an external adversary — and the only reason HashDoS is no longer a single-request DoS.

> Full proofs: [A4 — Randomized Data Structures](A4_Randomized_Data_Structures.md) · [A2 — DS Complexity](A2_DS_Complexity_FirstPrinciples.md)

---

## 🧬 Nature & Behavior

### What is a Hash Table?

```
CONCEPT:
- Transform key into array index using hash function
- Store value at that index
- Retrieve in O(1) average time

EXAMPLE: Phone Book
┌────────────────────────────────────────────────────┐
│ Name "Alice" → hash("Alice") → 3                   │
│                                                    │
│ Index: 0      1      2      3      4      5        │
│      ┌──────┬──────┬──────┬──────┬──────┬──────┐   │
│      │      │ Bob  │      │Alice │      │Carol │   │
│      │      │555-  │      │555-  │      │555-  │   │
│      │      │1234  │      │5678  │      │9999  │   │
│      └──────┴──────┴──────┴──────┴──────┴──────┘   │
│                                                    │
│ get("Alice") → hash("Alice") → 3 → return 555-5678 │
│ Time: O(1)!                                        │
└────────────────────────────────────────────────────┘
```

### Collision Handling

**Problem:** `hash("Alice") = 3` and `hash("David") = 3` — two keys hash to the same index!

**Solution 1: Chaining** (LinkedList at each index)

```
Index 3: Alice → David → null
```

**Solution 2: Open Addressing** (find next empty slot)

```
Index 3: Alice
Index 4: David (probed to next)
```

### 🔴 Real-World Origin: Symbol Tables in Compilers (1953)

**Problem (IBM 701 Compiler):** Program has thousands of variable names. Need to look up variable type/value quickly. Linear search through all variables: **TOO SLOW**.

**Before Hash Tables:**

```
variables = [
    {name: "x", type: "int"},
    {name: "y", type: "float"},
    ... 10,000 more ...
]
lookup("x") → search all 10,000 → O(n)
```

**Solution by H.P. Luhn (1953):** "What if we could _calculate_ the position directly?"

```
hash("x") = some_formula("x") → index 42
variables[42] = {name: "x", type: "int"}
lookup("x") → O(1)!
```

✅ **Impact:** Compilers became **100x faster**, databases became possible, every modern language has HashMap.

## 💻 Implementation WITHOUT Collections

```java
public class MyHashMap {
    private class Entry {
        int key;
        int value;
        Entry next;  // For chaining

        Entry(int key, int value) {
            this.key = key;
            this.value = value;
        }
    }

    private Entry[] buckets;
    private int capacity;
    private int size;
    private static final double LOAD_FACTOR = 0.75;

    public MyHashMap() {
        this.capacity = 16;
        this.buckets = new Entry[capacity];
        this.size = 0;
    }

    // HASH FUNCTION
    private int hash(int key) {
        return Math.abs(key) % capacity;
    }

    // PUT - O(1) average
    public void put(int key, int value) {
        if ((double) size / capacity >= LOAD_FACTOR) {
            resize();
        }

        int index = hash(key);
        Entry current = buckets[index];

        // Check if key exists
        while (current != null) {
            if (current.key == key) {
                current.value = value;  // Update
                return;
            }
            current = current.next;
        }

        // Add new entry at head (O(1))
        Entry newEntry = new Entry(key, value);
        newEntry.next = buckets[index];
        buckets[index] = newEntry;
        size++;
    }

    // GET - O(1) average
    public int get(int key) {
        int index = hash(key);
        Entry current = buckets[index];

        while (current != null) {
            if (current.key == key) {
                return current.value;
            }
            current = current.next;
        }
        return -1;  // Not found
    }

    // REMOVE - O(1) average
    public void remove(int key) {
        int index = hash(key);
        Entry current = buckets[index];
        Entry prev = null;

        while (current != null) {
            if (current.key == key) {
                if (prev == null) {
                    buckets[index] = current.next;
                } else {
                    prev.next = current.next;
                }
                size--;
                return;
            }
            prev = current;
            current = current.next;
        }
    }

    // CONTAINS - O(1) average
    public boolean containsKey(int key) {
        return get(key) != -1;
    }

    // RESIZE - O(n) but rare
    private void resize() {
        Entry[] oldBuckets = buckets;
        capacity *= 2;
        buckets = new Entry[capacity];
        size = 0;

        for (Entry head : oldBuckets) {
            while (head != null) {
                put(head.key, head.value);
                head = head.next;
            }
        }
    }

    public int size() {
        return size;
    }
}
```

### Production Failure Modes & Debugging

Hash tables are battle-tested, but they have sharp edges in production. These failure modes have caused real outages.

#### Failure 1: Hash Collision DoS Attack (2011)

**Mechanism:** An attacker submits keys designed to produce the same hash bucket. In Java's original `HashMap`, all colliding keys land in the same chain → every `get()` degenerates to O(n). With enough crafted keys, an attacker can freeze a server by forcing it into O(n²) hash lookups per request.

**Root Cause:** Before JDK 7u6 (2012), `String.hashCode()` was deterministic with no per-JVM randomization. The same string always produced the same hash, so an attacker could pre-compute colliding keys.

**Fix:** JDK 8 switched to a randomized hash seed (`-XX:StringTableSize` or the internal `hashSeed` in `Hashtable`). Each JVM instance computes a random seed at startup, making pre-computed collisions useless.

**Debugging:** Use `-XX:+PrintStringTableStatistics` to monitor string table size; `jmap -histo:live <pid>` to spot abnormally large bucket chains. CPU spike with no obvious code cause → suspect hash collision DoS.

#### Failure 2: HashMap Resize Storm

**Mechanism:** With high-cardinality keys (e.g., user IDs, session tokens), a HashMap that starts at capacity 16 repeatedly resizes: 16 → 32 → 64 → ... Each resize is O(n) (all entries rehashed). Under high write throughput, repeated resizes cause CPU spikes and GC pressure.

**Root Cause:** Failing to pre-size the HashMap when the expected size is known. Each resize doubles capacity and re-hashes every entry — an O(n) operation that blocks the thread.

**Fix:** Pre-size: `new HashMap<>(expectedSize / 0.75 + 1)` or Guava's `Maps.newHashMapWithExpectedSize(1000)`. This allocates the correct capacity upfront, avoiding all resizes.

**Debugging:** `jstack <pid>` during a spike will show threads in `HashMap.resize()` or `TransferData`. Add `-XX:HashMapInitCapacity=<N>` logging. Profile with `async-profiler` to find which `put()` calls dominate.

#### Failure 3: WeakHashMap Entry Resurrection

**Mechanism:** `WeakHashMap` uses `WeakReference` for keys — entries are eligible for GC when no other strong reference exists. However, if the **value** object holds a strong reference back to the key, the key is kept alive and the entry is never removed. The map appears to "leak" entries.

```java
// WRONG — value holds strong ref to key
WeakHashMap<Key, Value> map = new WeakHashMap<>();
map.put(new Key("session_1"), new Value(keyRef -> { /* captures key! */ }));
// Key is never GC'd because Value captures it in a lambda closure!
```

**Debugging:** Use `jmap -histo:live <pid>` before and after `System.gc()` to see if WeakHashMap entries persist. If they do, check value objects for hidden key references in closures, inner classes, or caches.

#### Failure 4: ConcurrentModificationException on HashMap Iteration

**Mechanism:** Modifying a `HashMap` while iterating over it (via `entrySet()`, `keySet()`, or `values()`) throws `ConcurrentModificationException`. This is fail-fast: the iterator maintains a `modCount` and detects concurrent modification.

```java
Map<Integer, String> map = new HashMap<>();
map.put(1, "one");
for (Map.Entry<Integer, String> e : map.entrySet()) {
    map.remove(e.getKey()); // throws CME!
}
```

**Fix:** Use the iterator's own `remove()`: `Iterator<Map.Entry<Integer, String>> it = map.entrySet().iterator(); while (it.hasNext()) { it.remove(); }`. Or use `ConcurrentHashMap` which supports safe concurrent iteration.

**Debugging:** `jstack <pid>` will show the `ConcurrentModificationException` stack trace pointing to the failing loop.

---

🔬 **Section Challenge — ⚡ Production Failure Modes**

**Challenge (Real-World Reasoning):** In 2011, the hash collision DoS attack forced Java (and Ruby, PHP, Python) to switch to randomized hash seeds. Explain WHY this fix works, WHY it was necessary, and what the trade-off was. What other design decisions in `HashMap` (Java 8+) help mitigate similar attacks today?

<details><summary>Answer</summary>

**Why randomized seeds work:** Before randomization, `hash("foo")` was always the same integer across all JVMs. An attacker could pre-compute 100,000 strings that all hash to the same bucket and submit them as request parameters. Each lookup degenerates to O(n) → total O(n²) per request → server freeze. With a random seed S added to the hash (`hash = S ^ stringHashCode`), the attacker cannot pre-compute collisions — each JVM has a different S, so their colliding keys scatter unpredictably across buckets on each deployment.

**Why it was necessary:** The O(n) lookup per collision means N colliding keys cause N² total work on a single request. At N=100,000, this is catastrophic even on modern hardware.

**Trade-off:** The seed makes performance non-deterministic across JVM restarts (same input → different bucket). This breaks some unit tests that rely on hash order. More importantly, it means the same hash map state cannot be replicated exactly across machines without sharing the seed (a security risk). The seed is stored in `Hashtable.hashSeed` (not `HashMap`, since `HashMap` was always vulnerable).

**Java 8+ mitigations beyond seeds:**

1. **Treeification at chain length 8:** Even if collisions occur, the worst case is O(log n) per lookup (Red-Black tree), not O(n). This limits the attack's damage — N colliding keys cause O(N log N) total work, not O(N²).
2. **Randomized seed** in `Hashtable` (JDK 6u26+) and `HashMap` (JDK 7u6+)
3. **`-Djdk.map.althashing.threshold`** to disable alternate hashing entirely for trusted input

The combination means the DoS attack surface is much smaller today — but not zero. Applications that accept arbitrary user strings as HashMap keys should still sanitize or limit input length.

</details>

## 🎯 LeetCode → Real-World Connection

### Problem: LRU Cache

```
REAL-WORLD ORIGIN: Web Browser Cache (1990s)

PROBLEM AT NETSCAPE (1994):
- Browser loads images from internet
- Loading same image again = slow
- Store recently viewed images in memory
- Memory is limited (16MB in 1994!)

QUESTIONS:
1. How to quickly check if image is cached? → HashMap
2. Which image to remove when full? → Least Recently Used
3. How to track "recently used"? → Linked List

SOLUTION - HashMap + Doubly Linked List:
┌─────────────────────────────────────────────┐
│  HashMap: url → Node                        │
│  LinkedList: Most Recent ←→ ... ←→ Least    │
│                                             │
│  Access image:                              │
│  1. O(1) lookup in HashMap                  │
│  2. O(1) move to front of list              │
│                                             │
│  Cache full? Remove tail (LRU)              │
└─────────────────────────────────────────────┘

IMPACT:
- Every browser uses this
- Every database uses this
- Every CDN (Cloudflare, Akamai) uses this
- Redis, Memcached are based on this
```

---

## 🧠 Interview Patterns — The 5 HashMap Techniques You MUST Know

### Pattern 1: Frequency Counting

**Use for:** "How many times does each element appear?", "Find most/least frequent", "Check if anagrams"

```java
// General purpose
Map<T, Integer> freq = new HashMap<>();
for (T item : collection)
    freq.merge(item, 1, Integer::sum);

// For characters (faster)
int[] freq = new int[26];
for (char c : s.toCharArray()) freq[c - 'a']++;
```

### Pattern 2: Two-Sum (Complement Lookup)

**Use for:** "Find pair that sums to target", "Find pair with difference = k"

💡 **Why HashMap works:** For each number X, you need `target - X` to exist. Instead of scanning the whole array each time **O(n²)**, store what you've seen in a HashMap → check in **O(1)**.

```java
Map<Integer, Integer> seen = new HashMap<>();  // value → index
for (int i = 0; i < nums.length; i++) {
    int complement = target - nums[i];
    if (seen.containsKey(complement))
        return new int[]{seen.get(complement), i};
    seen.put(nums[i], i);
}
```

### Pattern 3: Grouping/Bucketing

**Use for:** "Group anagrams", "Group by category", "Bucket sort"

```java
Map<String, List<String>> groups = new HashMap<>();
for (String word : words) {
    char[] sorted = word.toCharArray();
    Arrays.sort(sorted);
    String key = new String(sorted);
    groups.computeIfAbsent(key, k -> new ArrayList<>()).add(word);
}
// "eat", "tea", "ate" → all have key "aet" → grouped together
```

### Pattern 4: Prefix Sum + HashMap

**Use for:** "Subarray sum equals K", "Contiguous array"

💡 **Why:** `prefix[j] - prefix[i] = K` means subarray `[i+1..j]` sums to K. For each j, check if `(prefix[j] - K)` exists in map.

```java
Map<Integer, Integer> prefixCount = new HashMap<>();
prefixCount.put(0, 1);  // Empty prefix
int sum = 0, count = 0;
for (int num : nums) {
    sum += num;
    count += prefixCount.getOrDefault(sum - k, 0);
    prefixCount.merge(sum, 1, Integer::sum);
}
```

### Pattern 5: Sliding Window + HashMap

**Use for:** "Longest substring without repeating characters", "Minimum window substring"

Map stores element → last seen index (or frequency in window). When window is invalid, shrink from left.

---

## ⚡ Quick Problem Walkthrough: Subarray Sum Equals K

**Problem:** Given array `[1, 2, 3, -1, 1, 2]` and `K = 3`, count subarrays that sum to exactly 3.

**Brute Force:** Check all O(n²) subarrays → too slow.

**Optimal (Prefix Sum + HashMap):** For each `prefix[j]`, count how many `prefix[i] = prefix[j] - K`:

| j   | prefix | need (prefix-K) | map state                 | matches                 |
| --- | ------ | --------------- | ------------------------- | ----------------------- |
| 0   | 1      | -2              | {0:1}                     | 0                       |
| 1   | 3      | 0               | {0:1, 1:1}                | **1** → subarray [0..1] |
| 2   | 6      | 3               | {0:1, 1:1, 3:1}           | **1** → subarray [0..2] |
| 3   | 5      | 2               | {0:1, 1:1, 3:1, 6:1}      | 0                       |
| 4   | 6      | 3               | {0:1, 1:1, 3:1, 5:1, 6:1} | **1**                   |
| 5   | 8      | 5               | {0:1, 1:1, 3:1, 5:1, 6:2} | **1**                   |

✅ **Total: 4 subarrays** sum to 3: `[1,2]`, `[3]`, `[3,-1,1]`, `[1,2]`

---

---

🔬 **Section Challenge — ⚡ Quick Problem Walkthrough: Subarray Sum Equals K**

**Challenge 1 (Reasoning):** In the prefix sum approach, you initialize the map with `prefixCount.put(0, 1)`. Why is this necessary? What case does it handle that would be missed otherwise?

<details><summary>Answer</summary>

It handles subarrays that start at index 0. When `prefix[j] - K = 0`, it means the subarray `[0..j]` itself sums to K. Without the initial `(0, 1)` entry, this match wouldn't be found because the map would have no entry for prefix sum = 0. Example: array `[3]`, K = 3. After processing index 0: prefix = 3, need = 3 - 3 = 0. Without `(0,1)` in the map → count = 0 (wrong!). With `(0,1)` → count = 1 (correct — the subarray `[3]` sums to 3). This "seed" value represents the empty prefix before the array begins.

</details>

## 🎯 Full Problem Set — HashMap / HashTable

| #   | Problem                               | Platform   | Difficulty  | Pattern              |
| --- | ------------------------------------- | ---------- | ----------- | -------------------- |
| 1   | LC 1 — Two Sum                        | LeetCode   | ⭐ Easy     | Complement lookup    |
| 2   | LC 242 — Valid Anagram                | LeetCode   | ⭐ Easy     | Frequency count      |
| 3   | LC 49 — Group Anagrams                | LeetCode   | ⭐⭐ Med    | Sorted key grouping  |
| 4   | LC 560 — Subarray Sum Equals K        | LeetCode   | ⭐⭐ Med    | Prefix Sum + HashMap |
| 5   | LC 128 — Longest Consecutive Sequence | LeetCode   | ⭐⭐ Med    | HashSet O(n)         |
| 6   | LC 347 — Top K Frequent Elements      | LeetCode   | ⭐⭐ Med    | Freq + Heap          |
| 7   | LC 146 — LRU Cache                    | LeetCode   | ⭐⭐ Med    | HashMap + DLL        |
| 8   | LC 76 — Minimum Window Substring      | LeetCode   | ⭐⭐⭐ Hard | Sliding Window + Map |
| 9   | CF 4C — Registration System           | Codeforces | Div2-C      | HashMap counting     |
| 10  | CF 525A — Slavic's Exam               | Codeforces | Div2-A      | Char frequency       |

---

🔬 **Section Challenge — 🎯 Full Problem Set — HashMap / HashTable**

**Challenge 1 (Reasoning):** You insert 1000 entries into a HashMap with default capacity 16. How many resize operations happen?

<details><summary>Answer</summary>

Resize threshold = capacity × 0.75. Resizes at: 12 (16→32), 24 (32→64), 48 (64→128), 96 (128→256), 192 (256→512), 384 (512→1024). Total: 6 resizes. Each resize copies all entries to new bucket array. Pre-sizing: `new HashMap<>(1334)` (1000/0.75 ≈ 1334 → next power of 2 = 2048) avoids all resizes.

</details>

**Challenge 2 (Bug Hunt):** Two `Person` objects with same name and age. You override `equals()` to return true but not `hashCode()`. What happens when used as `HashMap` keys?

<details><summary>Answer</summary>

Both objects land in DIFFERENT buckets (different hashCodes → different bucket index). The HashMap doesn't check `equals()` across buckets — it goes straight to one bucket. So `map.get(person2)` returns NULL even though `person1.equals(person2)`. Overriding `equals` without `hashCode` violates the contract and breaks all hash-based collections. Always override both together.

</details>

## 🧠 Pattern Fingerprint — HashMap

```
SEE THESE WORDS → USE THIS:
┌──────────────────────────────────────────────────────────────┐
│ "find pair that sums to target"      → HashMap complement  │
│ "count frequency / occurrences"      → HashMap freq count  │
│ "group by key / group anagrams"      → HashMap<K, List<V>> │
│ "subarray sum equals K"              → Prefix Sum + HashMap │
│ "O(1) lookup by arbitrary key"       → HashMap             │
│ "sorted keys needed"                 → TreeMap O(log n)    │
│ "insertion order needed"             → LinkedHashMap       │
│ "LRU / eviction cache"               → LinkedHashMap / DLL │
└──────────────────────────────────────────────────────────────┘
```

### 🚀 GO LEARN — When You Need More

| Topic                       | File                                                                                   |
| --------------------------- | -------------------------------------------------------------------------------------- |
| HashMap + counting problems | 📖 [10_HashMap_Plus_Counting.md](../04_Patterns_Templates/10_HashMap_Plus_Counting.md) |
| Practice problems           | 📖 [17_HashMap_Hashing.md](../05_Problem_Solving/17_HashMap_Hashing.md)                |
| Java Collections            | 📖 [03_Collections_Java.md](03_Collections_Java.md)                                    |

### 📅 Revisit Tracker

- **Day 3:** Redo LC 1 (Two Sum) + LC 49 (Group Anagrams) from memory
- **Day 7:** Redo LC 560 (Prefix Sum + HashMap) — write without hints

---

📖 **Related Files:**

- [04_Patterns_Templates/10_HashMap_Plus_Counting.md](../04_Patterns_Templates/10_HashMap_Plus_Counting.md) — HashMap pattern problems
- [14_Mental_Models/04_Array_String_Thinking.md](../14_Mental_Models/04_Array_String_Thinking.md) — Prefix sum mental model
- [03_Collections_Java.md](03_Collections_Java.md) — Java Collections framework

---

---

## ✅ You Know Hash Tables — Now Practice! (JIT Study Path)

**Step 1 — Basic Problems (Warm Up):**

| Problem                 | LC #   | Pattern              | Key Concept                         |
| ----------------------- | ------ | -------------------- | ----------------------------------- |
| Two Sum                 | LC 1   | Complement HashMap   | Store num→index, look up target-num |
| Group Anagrams          | LC 49  | Grouping by key      | Sort chars as key, group by map     |
| Top K Frequent Elements | LC 347 | Freq Map + Heap      | Count then pick top K               |
| Valid Anagram           | LC 242 | Frequency Map        | Count chars in both strings         |
| Subarray Sum Equals K   | LC 560 | Prefix Sum + HashMap | `prefixCount.get(sum - k)`          |

**Step 2 — Hit a wall? Learn these patterns:**

- Prefix sum tracking → **[Prefix Sum Complete](../03_Algorithms/19_Prefix_Sum_Prefix_XOR_2D_Prefix_Java_Complete.md)**
- Frequency + Top-K → **[HashMap + Counting](../04_Patterns_Templates/10_HashMap_Plus_Counting.md)**

**Step 3 — Apply patterns on harder problems:**
👉 **[Go to HashMap Problem Solving File →](../05_Problem_Solving/17_HashMap_Hashing.md)**

**Step 4 — Competitive Practice:**

| CF Problem                                                                        | Topic                                       | Difficulty  |
| --------------------------------------------------------------------------------- | ------------------------------------------- | ----------- |
| [CF 1621C — Hidden Permutation](https://codeforces.com/problemset/problem/1621/C) | HashMap queries                             | ⭐⭐ Medium |
| [CF 1360D — Buying Shovels](https://codeforces.com/problemset/problem/1360/D)     | Counting with map                           | ⭐ Easy     |
| [CF 1399C — Boats Competition](https://codeforces.com/problemset/problem/1399/C)  | Sorted + Two Pointer (compare with HashMap) | ⭐⭐ Medium |

🌍 **Real-World Connections:**

- **DNS Cache** = HashMap of domain → IP (with TTL expiry)
- **Git object store** = HashMap of SHA hash → file content (content-addressable storage)
- **Database indexes** = Hash index for exact lookups (B-Tree for range queries)
- **Java's HashMap** uses open-addressing (since Java 8: treeify at load factor 0.75)
- **Redis** is essentially a distributed HashMap — all its data structures are hash-based

---

# 🎓 University-Level Addendum — Hash Tables as Formal Theory

> **Purpose:** This addendum elevates the chapter to MIT/KTH/ETH rigor. The body already has a strong invariants section; this addendum formalizes the constraint-first decision framework, derives the O(1) average-case complexity rigorously, and enumerates collision-driven failure modes with their root causes.

## Hash Table Invariants — Full Formal Statement

The body of this chapter lists 4 invariants. The complete formal statement, with violations and consequences:

| Invariant | Statement | Violation Consequence | Common Cause |
|---|---|---|---|
| **H1 — Load factor threshold** | `size / capacity ≤ DEFAULT_LOAD_FACTOR` (Java: 0.75) | O(n) lookup instead of O(1); resize storm | Forgetting to size initial capacity |
| **H2 — Hash uniformity** | For uniform hashing, P(hash(k) = i) = 1/capacity for all buckets i | O(n) lookup in worst case | Pathological keys (e.g., strings with same hash prefix) |
| **H3 — Rehashing trigger** | When size > capacity × load_factor, grow by 2× and rehash | Inconsistent state; lost entries | Custom implementation missing the trigger |
| **H4 — Hash code contract** | `equals(k1, k2) ⟹ hashCode(k1) == hashCode(k2)` | Equal keys lookup wrong bucket; lost entries | Forgetting to override `hashCode` when overriding `equals` |
| **H5 — Key immutability** | A key's `hashCode` must not change while in the map | Lookup returns wrong bucket after mutation | Mutable keys (e.g., `StringBuilder`, custom POJOs) |
| **H6 — Bucket head integrity** | First node in bucket is reachable from bucket array | Lost entries; NPE on lookup | Direct mutation of internal arrays (impossible in Java but possible in C++) |
| **H7 — Tree threshold (Java 8+)** | When bucket length ≥ 8, convert to red-black tree | O(n) bucket traversal instead of O(log n) | Using pre-Java-8 design |

The `HashMap` class in Java enforces H1, H3, H7 automatically. H4 and H5 are programmer responsibility — the compiler does not check them.

### Formal Proof Sketch — H2 (Uniform Hashing ⟹ O(1) Average Lookup)

```
Theorem: Under uniform hashing, the expected number of probes for a successful lookup is O(1 + α) where α = load factor.

Proof:
  Let X = number of probes to find a key k.
  For each existing key k' ≠ k, P(k' hashes to same bucket as k) = 1/capacity.
  By linearity of expectation, E[X] = 1 + (size - 1) / capacity
                                          ≈ 1 + α for α ≪ capacity

For α = 0.75 (Java default), E[X] ≈ 1.75 — about 2 probes per successful lookup.
For α approaching 1 (degenerate), E[X] approaches 2.
For α → ∞ without resize, E[X] = O(α) = O(n).
```

This is why the load factor threshold (H1) is critical: keep α ≤ 0.75 and lookup is effectively O(1). Let α grow and lookup degrades to O(n).

## 🔄 Brute Force → Optimal: Hash Table Motivation

> **The university way**: before presenting a data structure, show why naive solutions fail. The hash table earns its existence by solving a real problem that O(n²) cannot.

### Problem: Two Sum (the canonical hash-table problem)

**Given**: array `nums` of n integers and a target value. Find two indices i, j such that `nums[i] + nums[j] == target`.

**Brute force — O(n²)**:
```java
// For every pair (i, j), check if they sum to target
for (int i = 0; i < n; i++)
    for (int j = i+1; j < n; j++)
        if (nums[i] + nums[j] == target) return new int[]{i, j};
```
- Time: O(n²) — checking every pair.
- Space: O(1) — no extra storage.
- **Failure at scale**: n = 10⁶ elements → 5×10¹¹ iterations → infeasible.

**The insight**: For each element x, we don't need to scan all other elements for `target - x`. We just need to know if `target - x` EXISTS. Existence queries → hash table.

**Optimal — O(n)**:
```java
Map<Integer, Integer> seen = new HashMap<>();
for (int i = 0; i < n; i++) {
    int complement = target - nums[i];
    if (seen.containsKey(complement)) return new int[]{seen.get(complement), i};
    seen.put(nums[i], i);
}
```
- Time: O(n) — one pass, O(1) lookup per element.
- Space: O(n) — at most n entries in the map.

**The O(n²) → O(n) journey**:

| Approach | Time | Space | Bottleneck removed |
|----------|------|-------|--------------------|
| Brute force (nested loop) | O(n²) | O(1) | None — checks all pairs |
| Sort + two-pointer | O(n log n) | O(1) | Comparisons, but no index preservation |
| **Hash table** | **O(n)** | O(n) | Existential lookup: O(n) → O(1) |

**Rule**: use a hash table when you're doing repeated "does X exist?" or "how many times have I seen X?" queries that would otherwise require scanning.

---

### Problem: Frequency Count / Group Anagrams

**Brute force — O(n² × L)** (L = string length):
```java
// For each string, compare with every other string to find anagram groups
for (int i = 0; i < n; i++)
    for (int j = i+1; j < n; j++)
        if (isAnagram(strs[i], strs[j])) // ... group them
```

**Optimal — O(n × L log L)**:
```java
Map<String, List<String>> map = new HashMap<>();
for (String s : strs) {
    char[] chars = s.toCharArray(); Arrays.sort(chars);
    String key = new String(chars);       // sorted chars = canonical key
    map.computeIfAbsent(key, k -> new ArrayList<>()).add(s);
}
```
**Insight**: Two strings are anagrams iff their sorted character arrays are identical. Sort each string → use it as a hash key → O(1) grouping per string.

---

## Constraint-First Decision Framework — Hash Table vs Alternatives

### Decision Tree

```
lookup by exact key equality?
  → NO → consider sorted array + binary search (O(log n))
  → YES → continue

ordering of keys required (range queries, sorted iteration)?
  → YES → TreeMap (O(log n)) or sorted array (O(log n) lookup, O(1) range)
  → NO → continue

need worst-case O(1) lookup (not amortized)?
  → YES → perfect hash (if static keys) or cuckoo hash
  → NO → HashMap (amortized O(1))

memory budget tight (each entry ≤ 16 bytes overhead)?
  → YES → open-addressing hash (e.g., `IntIntOpenHashMap` in fastutil)
  → NO → chained HashMap (Java default)

need thread-safe?
  → YES → ConcurrentHashMap
  → NO → HashMap
```

### Decision Table

| Workload | Best Choice | Why |
|---|---|---|
| Caching, deduplication, count-by-key | HashMap | O(1) avg lookup; insert-order not needed |
| Need sorted iteration, range queries | TreeMap | O(log n) ordered operations |
| LRU cache | LinkedHashMap (access-order) | HashMap + doubly-LL for eviction order |
| Multithreaded concurrent access | ConcurrentHashMap | Lock striping; safe publication |
| Primitive int/int mapping | IntIntMap (Trove, fastutil) | Avoids boxing overhead (24 bytes → 12 bytes) |
| Static immutable keys (e.g., enum) | EnumMap | O(1) array-backed, no hashing needed |
| Massive cardinality (10⁹+ keys) | Consistent hash ring | Distributed; avoids full rehash on add |

### Worked Example — Picking HashMap vs TreeMap

**Problem:** Maintain a sorted view of users by signup date; support "users who signed up in the last 7 days" queries.

- **Constraint:** Range query (last 7 days = subMap fromDate to toDate).
- **HashMap:** Supports exact lookup (`get(userId)`) but not range query (would need to iterate all entries).
- **TreeMap:** Supports `subMap(from, to)` in O(log n + k) where k is result size.
- **Choice:** TreeMap. The range query makes the O(log n) cost worthwhile.

**Common mistake:** Use HashMap + sort the entries every time you need a range. This is O(n log n) per query vs TreeMap's O(log n + k).

## When HashMap Breaks — Collision-Driven Failure Modes

### Break 1 — Pathological Key Distribution

**Condition:** Many keys hash to the same bucket (e.g., custom `hashCode` returns constant, or strings all start with same prefix).

**What breaks:** H2 violated → lookup degrades to O(n) per call. A 10⁶-element HashMap with one bucket becomes a linked list of 10⁶ nodes → each lookup is 10⁶ comparisons.

**Defense:** Use a high-quality hash function (e.g., Java's `String.hashCode()` mixes characters; for custom classes, use `Objects.hash(...)` or `Hashing.murmur3_128()` from Guava). Override `hashCode` for every class used as a key.

### Break 2 — Hash-DoS Attack

**Condition:** An attacker submits keys crafted to collide with each other (e.g., PHP CVE-2011-3414).

**What breaks:** H2 violated → lookup is O(n) per request. A 10⁴-byte request body can cause a 10⁶-bucket HashMap to degenerate to a single bucket → DOS.

**Defense:** Use a hash function the attacker cannot predict (Java's `String.hashCode` is deterministic; an attacker can craft collisions). For untrusted keys, use a randomized hash (`-XX:+UnlockExperimentalVMOptions -XX:+UseSwitchHasing` in older JVMs; modern JVMs default to murmur3 since Java 7u72).

### Break 3 — Resize Storm

**Condition:** A HashMap is created with default capacity (16) and immediately filled with millions of entries. Each resize doubles capacity and rehashes all entries.

**What breaks:** O(n) work per resize; multiple resizes during fill → O(n log n) total. For n = 10⁶, this is 20 resizes × 10⁶ entries × 2 (insert + rehash) = 40 × 10⁶ operations just for rehashing.

**Invariant violated:** H3 (rehashing trigger). Multiple triggers fire in rapid succession.

**Defense:** Pre-size the HashMap: `new HashMap<>(expectedSize / 0.75 + 1)` (Java's load-factor-correct sizing formula). For known sizes, this avoids all resizes.

### Break 4 — Mutable Key Hash Code Change

**Condition:** A key's `hashCode` changes while it is in the map (e.g., updating a field on a custom POJO used as a key).

**What breaks:** H5 violated → lookup computes new hash, looks in new bucket, doesn't find the entry → returns null. The entry is still in the map (in the old bucket), unreachable from normal operations.

**Defense:** Use immutable keys (Java records, Lombok `@Value`, or final fields). Never mutate an object while it is a key in a map.

### Break 5 — Load Factor Misconfiguration

**Condition:** Setting load factor too high (e.g., 1.0 or higher) to save memory.

**What breaks:** H1 violated → lookup degrades from O(1) to O(n). The savings in memory are paid for in latency.

**Defense:** Use the default 0.75 unless profiling shows memory is the bottleneck. If memory is critical, use a more compact data structure (e.g., `IntIntMap` from fastutil).

### Break 6 — Treeify Threshold Exceeded Without Treeify

**Condition:** A bucket grows beyond 8 entries (Java 8 threshold) but the implementation doesn't treeify.

**What breaks:** O(n) lookup for the unlucky keys that hash to that bucket. Pre-Java-8 HashMaps suffered from this; modern Java 8+ auto-trees.

**Defense:** Use Java 8+ HashMap. For custom implementations, treeify at bucket length 8 (or use cuckoo hashing from the start).

### Break 7 — Null Key Handling

**Condition:** `HashMap` allows one null key; `Hashtable` and `ConcurrentHashMap` do not. Code that worked with HashMap fails on `Hashtable.put(null, value)`.

**What breaks:** NPE on `Hashtable.put`; `ConcurrentModificationException` on iteration if null key is removed during traversal.

**Defense:** Don't use null as a key. Use `Optional` or a sentinel object.

### Break 8 — Concurrent Modification (Non-Concurrent Map)

**Condition:** One thread iterates a HashMap while another inserts or deletes.

**What breaks:** `ConcurrentModificationException` is the friendly outcome. Without it (custom impl), iteration may see stale or duplicated entries.

**Invariant violated:** Single-threaded mutation invariant. HashMap is not thread-safe.

**Defense:** Use `ConcurrentHashMap` for concurrent access. Never wrap a HashMap with `Collections.synchronizedMap` and iterate without external synchronization.

## Edge Cases — Always Check These

| # | Edge Case | What Can Break |
|---|---|---|
| 1 | **Empty HashMap** (`size == 0`) | `get()` returns null; check for null vs missing key with `containsKey` |
| 2 | **Single entry** | `get()` returns the value; iteration order not specified |
| 3 | **All same key** | Re-insertion updates value; size stays at 1 |
| 4 | **Null key** | HashMap allows; Hashtable throws NPE; ConcurrentHashMap throws NPE |
| 5 | **Null value** | `containsKey` vs `get` semantics; can store `HashMap<K, NullObject>` instead |
| 6 | **Capacity = 1** | All keys collide; lookup is O(n); useless |
| 7 | **Power-of-two capacity** | Java enforces; `(n - 1) & hash` instead of `n % hash` for speed |
| 8 | **Integer overflow on size** | At ~2³¹ entries, size overflows; use `Long` for size in custom impl |
| 9 | **Iteration during resize** | ConcurrentModificationException; do not iterate while resizing |
| 10 | **Hash collision in `hashCode`** | E.g., `"Aa".hashCode() == "BB".hashCode() == 2112`; not a bug but worth knowing |

## Formal Complexity Proofs — Hash Table Operations

### Average-Case Lookup (Successful)

```
T_lookup_avg = O(1 + α)
            ≈ 1 + 0.75 = 1.75 probes for α = 0.75

Proof:
  Average chain length = α.
  Average probes for successful lookup = 1 + α/2 (linear probing) or 1 + α (chaining).
  For Java's HashMap with treeify at 8: O(1 + α/2) for α < 8, O(log α) for α ≥ 8.
```

### Worst-Case Lookup

```
T_lookup_worst = O(n)  (pathological key distribution)
              = O(log n) (Java 8+ with treeify at bucket length 8)
```

The treeify is the key innovation: it caps the worst case at O(log n) regardless of hash distribution.

### Resize Cost

```
T_resize(capacity → 2 × capacity) = O(capacity)
  1. Allocate new array of size 2 × capacity
  2. For each existing entry: rehash and place in new bucket
  3. Total: O(capacity) operations

For geometric growth (2×), amortized cost per insert = O(1):
  Each entry is copied log₂(n) times.
  Total copies over n inserts = n × log₂(n) / n = log₂(n).
  Amortized per insert = log₂(n) / n → O(1).
```

### Memory Overhead

```
Memory per entry = 48 bytes (Java HashMap default)
  - Key reference: 4 bytes (compressed oops)
  - Value reference: 4 bytes
  - Hash: 4 bytes (cached in Node)
  - Next pointer: 4 bytes (or left/right/parent/red for tree nodes)
  - Node object header: 16 bytes (mark word + class word)
  - Bucket array overhead: amortized 16 bytes per entry at load 0.75

For 10⁶ entries: 48 MB of overhead.
For 10⁹ entries: 48 GB. Consider disk-backed or compressed alternatives.
```

### Hash Code Distribution Quality

A good hash function maps N keys to N/capacity buckets with each bucket containing ≈ α keys. Statistical tests:

- **Chi-squared test:** bucket sizes should follow Poisson with mean α
- **Avalanche criterion:** flipping one bit of the key flips each output bit with probability ≈ 0.5
- **Collision rate:** expected = α for uniform hash; measured should be within ±10%

Java's `String.hashCode()` and `Integer.hashCode()` pass these tests. Custom hash functions should be tested with `HashMap` containing 10⁶+ keys and verifying bucket size distribution.

## Cross-References

- **`01a_Memory_Foundations.md`** — cache behavior of hash table buckets; pointer-chasing on collisions.
- **`01b_Arrays.md`** — bucket array is an array of linked lists (or trees); array invariants apply.
- **`01c_LinkedList.md`** — pre-Java-8 bucket chains are linked lists; LinkedHashMap uses doubly-LL for order.
- **`01g_DS_Internals.md`** — full implementation: `hash()` spread function, treeify threshold = 8 (Poisson-derived), untreeify at 6.
- **`02_PROBLEM_SETS.md`** — exam-style two-sum problem; LRU cache design (HashMap + LinkedHashMap).
- **`A1_DS_Correctness_Invariants.md`** — formal proofs of H1-H7 invariants.
- **`A4_Randomized_Data_Structures.md`** — randomized hash families, cuckoo hashing, bloom filters (probabilistic membership).

---

## 💥 When Hash Table Breaks

> These failure modes have caused production outages. Each one maps to a specific invariant violation.

### 1. Load Factor > 0.75 → O(n) Degradation
**What breaks**: A `HashMap` with too many entries and too small a table. Chains grow long, destroying O(1) lookup.
**Trigger**: Java's default `HashMap` rehashes at 75% capacity. If you pre-fill a map with `new HashMap<>(16)` but insert 13+ entries, a rehash is triggered. More critically: if you initialise with the right final size but forget the load factor, you still trigger rehash.
**Fix**: Pre-size to the expected number of entries divided by load factor: `new HashMap<>((int)(expectedSize / 0.75) + 1)`.
**Diagnosis**: In production, monitor `bucket.size()` via reflection or JMX; a bucket with 8+ entries treeifies (Java 8+), which is a signal the table is too small.

### 2. Birthday Attack → Expected First Collision at √m Insertions
**What breaks**: A hash table with m buckets expects the first collision after approximately √(2m) insertions (birthday paradox). For m = 1024 buckets, first collision is expected after ~45 insertions — not 1024.
**Implication**: Load factor 0.75 is not "75% empty" — at 75% capacity collisions are already common. The expected chain length at LF = 0.75 is 0.75 (one comparison per lookup on average), which is acceptable. At LF = 2.0, expected chain length is 2.0 — significantly slower.

### 3. HashDoS — Non-Randomized Seeds → Adversarial O(n) Chains
**What breaks**: If the hash function has a fixed seed (no per-process randomization), an attacker can craft O(n) input strings that all hash to the same bucket.
**Historical incident**: In 2011, researchers showed that PHP, Python, Java, Ruby, and most web frameworks were vulnerable — a POST request with ~65,000 crafted form parameters could consume 100% CPU for 100+ seconds.
**Fix**: Java 5+ randomizes `String.hashCode()` at the JVM level per process. Verify with `System.identityHashCode()` behaviour. For custom key types, use `Objects.hash()` or derive from `HashCode.fromString()` in Guava.

📎 **Reference Anchor**: [OpenJDK HashMap.hash()](https://github.com/openjdk/jdk/blob/master/src/java.base/share/classes/java/util/HashMap.java#L336)
**Invariant learned**: Java's `HashMap.hash()` applies a secondary "spread" step: `(h = key.hashCode()) ^ (h >>> 16)` — XORs high bits into low bits to reduce collisions in small tables. Without this, power-of-2 table sizes cluster all keys with the same low bits.
**Constraint warning**: This spread is only applied in `HashMap`. If you implement your own table using `hashCode()` directly, you miss this correction.

### 4. Mutating a Key After Insertion → Key Becomes Unretrievable
**What breaks**: Using a mutable object as a `HashMap` key, then modifying the object.
```java
List<Integer> key = Arrays.asList(1, 2, 3);
map.put(key, "value");
key.set(0, 99);  // mutates the key
map.get(Arrays.asList(99, 2, 3));  // returns null — hash changed
map.get(Arrays.asList(1, 2, 3));   // also null — key is at wrong bucket
```
**The invariant violated**: `HashMap` stores the key's hash at insertion time. When the key's `hashCode()` changes, the key is at the wrong bucket — unreachable via `get()` and not found by `containsKey()`.
**Fix**: Only use immutable objects as keys (Strings, Integer, Long, record types, or custom immutable classes).

### 5. `ConcurrentModificationException` on Structural Modification During Iteration
**What breaks**: Adding or removing entries while iterating with a `for-each` or `Iterator`.
**Root cause**: `HashMap` maintains a `modCount` field incremented on every structural change. The iterator stores `expectedModCount`; if they differ at `next()`, it throws `CME`.
**Fix**: Collect keys to remove in a `Set<K> toRemove`, then call `map.keySet().removeAll(toRemove)` after the loop. Or use `entrySet().removeIf(...)` in Java 8+.

---

## 📝 Exam-Style Problems (MIT 6.006 / KTH DD1352 style)

---

**Problem 1 (Analysis — 8 min)**: A hash table uses chaining with m buckets and stores n keys. The load factor is α = n/m. Assume simple uniform hashing. Derive the expected time for a successful `get()`.

<details><summary>Model Answer</summary>

**Claim**: Expected time for successful search = Θ(1 + α).

**Proof**:
- Consider searching for key k. k was the i-th key inserted (i uniform in 1..n).
- At the time k was inserted, i-1 keys were already present in table.
- Expected chain length at k's bucket when k was inserted = (i-1)/m.
- We search by probing the chain; we find k after examining the elements inserted before k that hash to the same bucket.
- Expected cost = 1 + Σᵢ₌₁ⁿ (1/n) × (i-1)/m = 1 + (1/mn) × n(n-1)/2 = 1 + (n-1)/(2m) = Θ(1 + α). ✓

</details>

---

**Problem 2 (Design — 10 min)**: Design an O(1) average time LRU Cache supporting `get(key)` and `put(key, value)` for capacity c.

<details><summary>Model Answer</summary>

**Structure**: `HashMap<K, Node>` + doubly-linked list ordered by recency. Head = most recent, tail = least recent.

- `get(k)`: HashMap lookup O(1); if found, move node to head O(1) via pointer update; return value.
- `put(k, v)`: If k exists, update value and move to head. If new: create node at head, put in HashMap. If `size > c`: remove tail node and delete from HashMap.

**Invariant**: Every key in the HashMap has a corresponding node in the linked list; the list order reflects recency; the HashMap enables O(1) node access for move-to-head.

Java shortcut: `new LinkedHashMap<>(c, 0.75f, true)` with `removeEldestEntry` override gives the same semantics using standard library.

</details>

---

**Problem 3 (Proof — 6 min)**: Prove that a hash table with open addressing at load factor α < 1 finds an empty slot in at most 1/(1-α) expected probes.

<details><summary>Model Answer</summary>

**Model**: Each probe hits an occupied slot with probability α (fraction of occupied slots). Probes are independent under uniform hashing assumption.

**Geometric distribution**: The expected number of probes to find an empty slot = geometric random variable with success probability (1-α).

**Derivation**: E[probes] = Σₖ₌₁^∞ k × α^(k-1) × (1-α) = 1/(1-α). ✓

**Implication**: At α = 0.5, expected probes = 2. At α = 0.9, expected probes = 10. At α = 0.99, expected probes = 100. This is why keeping LF < 0.75 matters enormously.

</details>
