# HashMap Hashing

> **Navigation**: [← Prefix Sum Problems](28_Prefix_Sum_Problems.md) | [Chapter index](00_INDEX.md) | [Section 2: String Problems →](03_Strings.md)


---

## 🔗 Bridge — Where This Chapter Fits

| Dimension | This chapter |
| --- | --- |
| **Builds on** | [Hash Tables](../02_Data_Structures/01e_HashTable.md), [HashMap + Counting](../04_Patterns_Templates/10_HashMap_Plus_Counting.md) |
| **You will learn** | Complement lookup, frequency maps, grouping, prefix-sum maps and caching |
| **Leads to** | [Bit Manipulation](18_BitManipulation.md) |
| **Abstraction level** | Repeated scans → **trade memory for `O(1)` lookup** |

> [!NOTE]
> The full gap-free reading order and dependency graph are in the [Learning Path](00_LEARNING_PATH.md).

---

## 💬 Explain It Like a Study Partner — HashMap & Hashing Problems

### 1. The bottom line

Remember what you have seen so each element is checked once.

### 2. The textbook core

- Complement lookup for pair sums.
- Frequency map for counting.
- Canonical key for grouping.
- Prefix sum + map for subarray counts.
- Know the cost of collisions.

### 3. The real-world analogy

A **guest list at the door**.

### 4. Walkthrough

1. Two Sum `[2,7,11,15]`, target 9.
2. See 2: store `{2:0}`.
3. See 7: need 2, found at index 0.
4. Answer `[0,1]`.

> [!NOTE]
> **Quick check:** Why seed the prefix map with `{0:1}`? *To count subarrays starting at index 0.*


### 5. Check yourself

**Q1.** Longest consecutive run in `[100,4,200,1,3,2]`?

<details><summary>Answer</summary>

**4** (1,2,3,4); start counting only from numbers whose predecessor is absent.

</details>

**Q2.** Why can a bad hash function make a map slow?

<details><summary>Answer</summary>

Many keys land in one bucket, so lookups degrade toward `O(n)`.

</details>

---


## 🗺️ Pattern Recognition Header — HashMap & Hashing

**Which HashMap pattern should I use?**

| Signal / Problem Type                 | Pattern                  | Core Idea                                                |
| ------------------------------------- | ------------------------ | -------------------------------------------------------- |
| `two numbers that sum to target`      | **Two-Sum (complement)** | Store `val→idx`; look up `target-num` before inserting   |
| `count occurrences / top-k frequency` | **Frequency Count**      | `map.merge(key, 1, Integer::sum)`                        |
| `how many subarrays sum to K?`        | **Prefix Sum + HashMap** | `prefixCount.get(prefixSum - k)`                         |
| `group items by property`             | **Grouping**             | `map.computeIfAbsent(key, k→new ArrayList<>()).add(val)` |
| `check if element seen before`        | **HashSet visited**      | `set.add(x)` → false if already present                  |
| `find duplicates in O(n) O(1) space`  | **In-place Hashing**     | Negate at index `\|val\| - 1` as the visited marker |

**The Golden Rule:**

```
"Brute force is O(n²)?  → Inner loop is a SEARCH → Replace with HashMap → O(n)"

Key reason:
  Brute Two-Sum: for i → for j (search) → O(n²)
  HashMap Two-Sum: for i → map.get(target-num) → O(n)

⚠️ Java mod pitfall: -7 % 5 = -2 in Java. Fix: ((n % k) + k) % k
⚠️ Java PQ is MIN-HEAP. Max-heap: new PriorityQueue<>(Comparator.reverseOrder())
```

- 📖 **Mental Model:** [04_Array_String_Thinking.md](../14_Mental_Models/04_Array_String_Thinking.md)
- 📖 **Space-Time Tradeoff:** [12_Space_Time_Tradeoffs.md](../14_Mental_Models/12_Space_Time_Tradeoffs.md)
- 📖 **Full Pattern Guide:** [00_PATTERN_MASTER_GUIDE.md](../04_Patterns_Templates/00_PATTERN_MASTER_GUIDE.md)

---

## 📚 SECTION 15: HASHMAP & HASHING PROBLEMS

---

## 📚 Topic Pages in This Chapter

This chapter is split into focused pages so each topic can be read on its own. Read them in order the first time; use the table to jump back later.

| # | Page | What is inside | Lines |
| --- | --- | --- | --- |
| 1 | [WHY HashMap — MIT/KTH STYLE](17_HashMap_Hashing/01_why_hashmap_mit_kth_style.md) | WHY HashMap — MIT/KTH STYLE | 122 |
| 2 | [15.1 FREQUENCY COUNTING (Easy–Medium)](17_HashMap_Hashing/02_frequency_counting_easymedium.md) | 15.1 FREQUENCY COUNTING (Easy–Medium) | 315 |
| 3 | [15.2 PREFIX SUM + HASHMAP (Medium–Hard)](17_HashMap_Hashing/03_prefix_sum_hashmap_mediumhard.md) | 15.2 PREFIX SUM + HASHMAP (Medium–Hard) | 384 |
| 4 | [15.3 Design / Advanced Hashmap](17_HashMap_Hashing/04_design_advanced_hashmap.md) | 15.3 Design / Advanced Hashmap · 15.4 Hidden Gems · Hashmap Complexity Cheat Sheet · Mastery Checklist · Competitive Programming — Codeforces Problems · … | 483 |

## 🏢 Enterprise Lens — HashMap & Hashing Problems

| Area | What top-tier engineering looks like |
| ---- | ------------------------------------ |
| **Where it runs in production** | Caches, deduplication, indexes |
| **Failure modes** | Mutable keys; hash-collision attacks; forgetting the seed |
| **Testing and verification** | Brute force on random inputs |

---

## Reality Check

**"Hash problems drill containsKey fluency"** — The drilled skill is COMPLEMENT THINKING — storing what the future needs to find: two-sum stores needed-complements, subarray-sum stores seen-prefixes, longest-consecutive stores membership then probes only run-starts. Each classic is one sentence of what-to-key; the API calls are clerical. Practice by writing that sentence before any code — solutions whose keys were chosen wrong cannot be repaired by better loops.

**"Group-by-key problems end at anagram grouping"** — Key DESIGN escalates through the set: sorted-string or count-signature (anagrams), slope-in-lowest-terms with sign normalization (points-on-a-line — where the real content is gcd-reduction and negative-zero handling), tree-serialization strings (duplicate subtrees), and shifted-string normal forms (group-shifted-strings, with the modulo-26 wrap detail). The recurring lesson: the key must be CANONICAL — any two equivalent inputs must produce byte-identical keys — and every bug in this family is a canonicalization leak.

**"Design-a-hashmap questions test bucket arrays"** — Insert/delete/getRandom-O(1) is the design question that actually recurs, and its answer is a PAIRING: array for O(1) random access, map from value to index, deletion via swap-with-last-then-pop. The generalizable principle — composite data structures assign each operation to the member that does it best — is the whole of applied data-structure design, and this problem is its minimal complete example. The with-duplicates variant (map to a SET of indexes, careful about the swapped element's set) is the follow-up that verifies real understanding.

**"HashMap iteration order changing is a Java quirk to memorize"** — It is a portable CONTRACT lesson: hash containers trade order for speed everywhere (Java HashMap, Python pre-3.7 dicts, Go maps randomize deliberately). Tests that accidentally depend on iteration order pass locally and fail after an innocent rehash — the production version of this bug class. When order matters, say WHICH order and pay for it explicitly: insertion (LinkedHashMap), sorted (TreeMap), or recency (LinkedHashMap in access-order mode — the LRU backbone).

**"equals/hashCode contracts matter only for custom classes in production"** — They bite in PRACTICE the moment you key on composite values: keying a HashMap on an int[] uses identity (silent failure — every array is unique), fixing it means List keys, encoded strings, or Objects.hash wrappers; mutating any object AFTER using it as a key strands the entry in the wrong bucket permanently. Both failure modes appear in interview code under time pressure, both produce works-then-mysteriously-loses-entries symptoms, and both are two-second fixes when the contract is loaded in memory.
