> **Navigation**: [< Previous Chapter](01d_Stack_Queue.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next Chapter >](01f_Trees_Heaps.md)

---

# #️⃣ Part 6: Hash Table

## PART 0: COMPLETE UNDERSTANDING — The WHY Before the WHAT

### What Problem Does a Hash Table Solve?

**The Lookup Problem:** "Given a key, find its value."

| Approach | Time Complexity |
|----------|----------------|
| Array lookup by index | O(1) — but you need an integer index! |
| Array lookup by value | O(n) — must scan everything |
| Sorted array + binary search | O(log n) — better, but not instant |
| **Hash Table** | **O(1)** — converts any key into an index! |

> 💡 **Hash Table Breakthrough:**
> "What if we could CONVERT any key into an index?"
> `hash("Alice") → 3` → `table[3] = Alice's data` → **O(1) lookup!**
>
> Keys can be strings, objects, anything — the hash function handles it.

### Who Invented It and Why?

**1953: H.P. Luhn at IBM.** IBM's compilers had to look up variable names — with 10,000 variables, linear search meant 10,000 comparisons per lookup. Programs had thousands of lookups → **minutes to compile**.

> 💡 **Luhn's insight:** Use a mathematical function to *compute* the location directly.
> `hash("myVariable") → index 4271 → O(1) direct access!`

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
- You need **worst-case** O(1) → Hash tables are O(1) *average*, O(n) worst
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

> ⚠️ **Collision handling:**
> - **Java 8+:** If chain length > 8 → convert to **Red-Black Tree** → O(log n) worst case
> - **Before Java 8:** Always linked list → O(n) worst case

### HashMap vs TreeMap vs LinkedHashMap — Decision Matrix

| Feature | HashMap | TreeMap | LinkedHashMap |
|---------|---------|---------|---------------|
| Lookup | O(1) avg | O(log n) | O(1) avg |
| Insert | O(1) avg | O(log n) | O(1) avg |
| Ordered | ❌ No | ✅ Sorted by key | ✅ Insertion order |
| Null key | ✅ 1 allowed | ❌ No | ✅ 1 allowed |
| Thread-safe | ❌ No | ❌ No | ❌ No |
| **Best for** | General lookup | Range queries | LRU cache |

> 🎯 **Interview rule of thumb:**
> - "Need lookup?" → **HashMap**
> - "Need sorted keys?" → **TreeMap**
> - "Need insertion order?" → **LinkedHashMap**
> - "Need thread safety?" → **ConcurrentHashMap**

### Mental Model: Library Card Catalog

**Hash Table = Card catalog in a library**

`Book title` → `Card catalog formula` → `Drawer number` → `Exact card`

- **"Harry Potter"** → formula → Drawer 42 → Card with shelf location
- **Collision** = Two books map to same drawer → Multiple cards in Drawer 42 → search within (chaining)
- **Load Factor** = How full the drawers are → Too full (>75%) → Time to get a bigger cabinet (resize/rehash)
- **Rehashing** = Moving all cards to a bigger cabinet → Drawer numbers change → Must recompute every card's position → Expensive O(n) but rare (amortized O(1) per insert)

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

> **Flow**: CONCEPT: → - Transform key into array index using hash function | - Transform key into array index using hash function → - Store value at that index | - Store value at that index → - Retrieve in O(1) average time | - Retrieve in O(1) average time → EXAMPLE: Phone Book | EXAMPLE: Phone Book → Name 'Alice' → hash('Alice') → 3 | Name 'Alice' → hash('Alice') → 3 → Index: 0 1 2 3 4 5 | ...+1 more

```mermaid
flowchart TD
    N1["CONCEPT:"]
    N2["- Transform key into array index using hash function"]
    N3["- Store value at that index"]
    N4["- Retrieve in O(1) average time"]
    N5["EXAMPLE: Phone Book"]
    N6["Name 'Alice' → hash('Alice') → 3"]
    N7["Index: 0 1 2 3 4 5"]
    N8["Bob Alice Carol"]
    N1 --> N2
    N2 --> N3
    N3 --> N4
    N4 --> N5
    N5 --> N6
    N6 --> N7
    N7 --> N8
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

> **Flow**: lookup('x') → search all 10,000 | search all 10,000 → O(n)

```mermaid
flowchart LR
    N1["lookup('x')"]
    N2["search all 10,000"]
    N3["O(n)"]
    N1 --> N2
    N2 --> N3
```

**Solution by H.P. Luhn (1953):** "What if we could *calculate* the position directly?"
```
hash("x") = some_formula("x") → index 42
variables[42] = {name: "x", type: "int"}
lookup("x") → O(1)!
```

> **Flow**: hash('x') = some_formula('x') → index 42 | lookup('x') → O(1)!

```mermaid
flowchart LR
    N1["hash('x') = some_formula('x')"]
    N2["index 42"]
    N3["lookup('x')"]
    N4["O(1)!"]
    N1 --> N2
    N3 --> N4
```

> ✅ **Impact:** Compilers became **100x faster**, databases became possible, every modern language has HashMap.

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

> **Flow**: REAL-WORLD ORIGIN: Web Browser Cache (1990s) → PROBLEM AT NETSCAPE (1994): | PROBLEM AT NETSCAPE (1994): → - Browser loads images from internet | - Browser loads images from internet → - Loading same image again = slow | - Loading same image again = slow → - Store recently viewed images in memory | - Store recently viewed images in memory → - Memory is limited (16MB in 1994!) | - Memory is limited (16MB in 1994!) → QUESTIONS: | ...+1 more

```mermaid
flowchart TD
    N1["REAL-WORLD ORIGIN: Web Browser Cache (1990s)"]
    N2["PROBLEM AT NETSCAPE (1994):"]
    N3["- Browser loads images from internet"]
    N4["- Loading same image again = slow"]
    N5["- Store recently viewed images in memory"]
    N6["- Memory is limited (16MB in 1994!)"]
    N7["QUESTIONS:"]
    N8["1. How to quickly check if image is cached? → HashMap"]
    N1 --> N2
    N2 --> N3
    N3 --> N4
    N4 --> N5
    N5 --> N6
    N6 --> N7
    N7 --> N8
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

> 💡 **Why HashMap works:** For each number X, you need `target - X` to exist. Instead of scanning the whole array each time **O(n²)**, store what you've seen in a HashMap → check in **O(1)**.

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

> 💡 **Why:** `prefix[j] - prefix[i] = K` means subarray `[i+1..j]` sums to K. For each j, check if `(prefix[j] - K)` exists in map.

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

> Map stores element → last seen index (or frequency in window). When window is invalid, shrink from left.

---

## ⚡ Quick Problem Walkthrough: Subarray Sum Equals K

**Problem:** Given array `[1, 2, 3, -1, 1, 2]` and `K = 3`, count subarrays that sum to exactly 3.

**Brute Force:** Check all O(n²) subarrays → too slow.

**Optimal (Prefix Sum + HashMap):** For each `prefix[j]`, count how many `prefix[i] = prefix[j] - K`:

| j | prefix | need (prefix-K) | map state | matches |
|---|--------|-----------------|-----------|---------|
| 0 | 1 | -2 | {0:1} | 0 |
| 1 | 3 | 0 | {0:1, 1:1} | **1** → subarray [0..1] |
| 2 | 6 | 3 | {0:1, 1:1, 3:1} | **1** → subarray [0..2] |
| 3 | 5 | 2 | {0:1, 1:1, 3:1, 6:1} | 0 |
| 4 | 6 | 3 | {0:1, 1:1, 3:1, 5:1, 6:1} | **1** |
| 5 | 8 | 5 | {0:1, 1:1, 3:1, 5:1, 6:2} | **1** |

> ✅ **Total: 4 subarrays** sum to 3: `[1,2]`, `[3]`, `[3,-1,1]`, `[1,2]`

---

📖 **Related Files:**
- [04_Patterns_Templates/10_HashMap_Plus_Counting.md](../04_Patterns_Templates/10_HashMap_Plus_Counting.md) — HashMap pattern problems
- [14_Mental_Models/04_Array_String_Thinking.md](../14_Mental_Models/04_Array_String_Thinking.md) — Prefix sum mental model
- [03_Collections_Java.md](03_Collections_Java.md) — Java Collections framework



---

> **Navigation**: [< Previous](01d_Stack_Queue.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](01f_Trees_Heaps.md)