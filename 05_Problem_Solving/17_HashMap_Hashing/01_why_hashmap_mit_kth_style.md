# PART 0: WHY HashMap — MIT/KTH STYLE

> **Navigation**: [Chapter overview](../17_HashMap_Hashing.md) | [15.1 FREQUENCY COUNTING (Easy–Medium) →](02_frequency_counting_easymedium.md)
> Page 1 of 4 in **HashMap Hashing**


WHY HASHMAP? — THE O(1) LOOKUP ENGINE

WHY: HashMap reduces "search/lookup" from O(n) to O(1) average.
The most frequently used data structure in interviews — appears in ~40%
of solutions as a helper structure. If you're stuck, ask: "Would a
HashMap give me O(1) lookup for something I'm repeatedly searching?"

FORMAL DEFINITION (MIT 6.006 / KTH DD2350):

A hash function h: U → {0, 1, ..., m-1} maps a universe U of keys
to m slots (buckets).

Under Simple Uniform Hashing Assumption (SUHA):

- Expected lookup time = O(1 + α)
- where α = n/m is the load factor
- n = number of stored elements, m = number of slots

Collision resolution:

- Chaining: each slot holds a linked list → E[search] = O(1 + α)
- Open addressing (linear/quadratic probing, double hashing)
- Cuckoo hashing: worst-case O(1) lookup, amortized O(1) insert

Amortized analysis of dynamic resizing:
When α exceeds threshold, double table size and rehash all elements.
By aggregate method: n insertions cost O(n) + O(n/2) + O(n/4) + ...
= O(2n) total → O(1) amortized per insertion.

FIVE CORE PATTERNS:

1. FREQUENCY COUNT: map.merge(key, 1, Integer::sum)
   - Count occurrences of each element. Foundation for Top-K, duplicates.

2. TWO-SUM PATTERN: Store complement, lookup in O(1)
   - "Does target - arr[i] exist?" Check map before/after inserting.

3. PREFIX SUM + HASHMAP: "How many subarrays sum to K?"
   - Store prefix sum frequencies. If prefixSum[j] - K was seen before,
     a valid subarray exists. THE most important medium-level pattern.

4. GROUPING: Group elements by some computed property
   - Anagrams by sorted key, numbers by remainder, points by slope.
   - map.computeIfAbsent(key, k -> new ArrayList<>()).add(value)

5. SEEN/VISITED: Use HashSet as O(1) membership test
   - Cycle detection, duplicate detection, sequence problems.

**CRITICAL INSIGHT:**

> "If brute force is O(n²) because of nested search, HashMap makes the
> inner search O(1) → total O(n)."

- Brute force Two-Sum: for each i, for each j → O(n²)
- HashMap Two-Sum: for each i, lookup complement → O(n)

This is THE fundamental optimization principle for HashMap problems.

WHY NOT HashMap for sliding window with negative numbers?

Sliding window assumes: expanding window increases sum, shrinking
decreases it (monotonicity). With negative numbers, this breaks —
adding an element can decrease the sum. Therefore:

- Subarray sum = K with positives only → sliding window O(n)
- Subarray sum = K with negatives → prefix sum + HashMap O(n)

JAVA HashMap INTERNALS:

- Bucket array of Node<K,V> (linked list nodes)
- When chain length > 8 AND table size ≥ 64 → treeify to Red-Black Tree
- When chain length < 6 → untreeify back to linked list
- Default capacity: 16, load factor: 0.75
- Rehash: doubles capacity when size > capacity × loadFactor
- Hash perturbation: h = key.hashCode() ^ (h >>> 16)
  Spreads higher bits into lower bits (power-of-2 table uses low bits)

COMMON MISTAKES (memorize these):

1. hashCode/equals CONTRACT: If a.equals(b), then
   a.hashCode() == b.hashCode(). Override BOTH or NEITHER.
   Violating this → HashMap silently loses entries.

2. ConcurrentModificationException: Never modify a HashMap while
   iterating with for-each. Use Iterator.remove() or collect keys first.

3. null key/value: HashMap allows ONE null key and multiple null values.
   Hashtable/ConcurrentHashMap do NOT allow null. NPE surprises!

4. Integer cache: Integer.valueOf caches -128 to 127. Outside this range,
   new Integer(200) == new Integer(200) is FALSE. Use .equals() always.

5. getOrDefault vs putIfAbsent:

- getOrDefault(key, 0): returns default but does NOT insert
- putIfAbsent(key, val): inserts only if key absent
- merge(key, 1, Integer::sum): best for frequency counting

6. HashMap vs TreeMap: Need ordering? Use TreeMap O(log n).
   Need O(1)? Use HashMap. Need insertion order? Use LinkedHashMap.

EXPECTED OUTPUTS:

After this section you should be able to:

- [ ] Solve any "find pair/subarray" problem in O(n) using HashMap
- [ ] Implement prefix sum + HashMap for subarray sum problems
- [ ] Design O(1) data structures (LRU Cache, RandomizedSet)
- [ ] Recognize when HashMap is the hidden helper in a problem
- [ ] Handle Java HashMap edge cases in production code

---

🔬 **Section Challenge — PART 0: WHY HashMap — MIT/KTH STYLE**

**Challenge 1 (Reasoning):** You insert 1000 entries into a HashMap with default capacity 16. How many resize operations happen?

<details><summary>Answer</summary>

Resize threshold = capacity × 0.75. Resizes at: 12 (16→32), 24 (32→64), 48 (64→128), 96 (128→256), 192 (256→512), 384 (512→1024). Total: 6 resizes. Each resize copies all entries to new bucket array. Pre-sizing: `new HashMap<>(1334)` (1000/0.75 ≈ 1334 → next power of 2 = 2048) avoids all resizes.

</details>

---

[Chapter overview](../17_HashMap_Hashing.md) | [15.1 FREQUENCY COUNTING (Easy–Medium) →](02_frequency_counting_easymedium.md)
