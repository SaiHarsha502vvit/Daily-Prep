> **Navigation**: [< Previous Chapter](01d_Stack_Queue.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next Chapter >](01f_Trees_Heaps.md)

---

# PART 6: HASH TABLE

## PART 0: COMPLETE UNDERSTANDING — The WHY Before the WHAT

### What Problem Does a Hash Table Solve?

```
THE FUNDAMENTAL PROBLEM:
"Given a key, find its value" — the LOOKUP problem.

Array lookup by INDEX: O(1) — but you need an integer index!
Array lookup by VALUE: O(n) — scan everything
Sorted array + binary search: O(log n) — better, but not instant

HASH TABLE BREAKTHROUGH:
  "What if we could CONVERT any key into an index?"
  
  hash("Alice") → 3  →  table[3] = Alice's data  →  O(1) lookup!
  
  This converts ANY lookup into an array index lookup.
  Keys can be strings, objects, anything — hash function handles it.
```

### Who Invented It and Why?

```
1953: H.P. Luhn at IBM
Problem: IBM's compilers had to look up variable names.
  With 10,000 variables, linear search = 10,000 comparisons per lookup.
  Programs had thousands of lookups → MINUTES to compile.

Luhn's insight: Use a mathematical function to COMPUTE the location.
  hash("myVariable") → index 4271 → O(1) direct access!

IMPACT:
  - Compilers went from minutes to seconds
  - Databases became practical (hash indexes)
  - Every modern language has built-in HashMap/Dictionary
  - Used in: caching, deduplication, routing, spell checkers
```

### When to Use (and NOT Use) Hash Tables

```
✅ USE HASH TABLE WHEN:
- You need O(1) average lookup, insert, delete
- You're counting frequencies ("how many times does X appear?")
- You're checking for existence ("have I seen X before?")
- You're grouping by key ("group all anagrams together")
- You need two-sum style "complement finding"

❌ DO NOT USE WHEN:
- You need sorted/ordered data → Use TreeMap instead
- You need range queries ("all keys between A and B") → TreeMap
- Memory is very tight → Hash tables waste ~50% space
- You need worst-case O(1) → Hash tables are O(1) AVERAGE, O(n) worst
- Input is very small (< 20 elements) → Simple array might be faster
```

### The Big Picture: How HashMap Works in Java

```
HashMap<String, Integer> map = new HashMap<>();
map.put("Alice", 85);

STEP BY STEP:
1. Compute hash: "Alice".hashCode() → 63650081
2. Reduce to index: 63650081 % 16 → 1  (16 = default capacity)
3. Store at buckets[1]: ("Alice", 85)

map.get("Alice"):
1. hash("Alice") → 63650081 % 16 → 1
2. Go to buckets[1] → found! Return 85
3. Time: O(1)

COLLISION (two keys → same index):
  Java 8+: If chain length > 8 → convert to RED-BLACK TREE → O(log n) worst case
  Before Java 8: Always linked list → O(n) worst case
```

### HashMap vs TreeMap vs LinkedHashMap — Decision Matrix

```
                  HashMap         TreeMap          LinkedHashMap
Lookup:           O(1) avg        O(log n)         O(1) avg
Insert:           O(1) avg        O(log n)         O(1) avg
Ordered:          ❌ No           ✅ Sorted by key  ✅ Insertion order
Null key:         ✅ 1 allowed    ❌ No             ✅ 1 allowed
Thread-safe:      ❌ No           ❌ No             ❌ No
Best for:         General lookup  Range queries     LRU cache

Interview rule of thumb:
  "Need lookup?" → HashMap
  "Need sorted keys?" → TreeMap  
  "Need insertion order?" → LinkedHashMap
  "Need thread safety?" → ConcurrentHashMap
```

### Mental Model: Library Card Catalog

```
HASH TABLE = Card catalog in a library

  Book title → Card catalog formula → Drawer number → Exact card

  "Harry Potter" → formula → Drawer 42 → Card with shelf location

  COLLISION = Two books map to same drawer
    → Multiple cards in drawer 42 → Search within drawer (chaining)
  
  LOAD FACTOR = How full the catalog's drawers are
    → Too full (> 75%) → Time to get a bigger cabinet (resize/rehash)

  REHASHING = Moving all cards to a bigger cabinet
    → Drawer numbers change (formula uses drawer count)
    → Must recompute every card's position
    → Expensive O(n) but rare (amortized O(1) per insert)
```

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

```
PROBLEM: hash("Alice") = 3, hash("David") = 3
Two keys hash to same index!

SOLUTION 1: CHAINING (LinkedList at each index)
Index 3: Alice → David → null

SOLUTION 2: OPEN ADDRESSING (Find next empty)
Index 3: Alice
Index 4: David (probe to next)
```

### 🔴 Real-World Origin: Symbol Tables in Compilers (1953)

```
PROBLEM (IBM 701 Compiler):
- Program has thousands of variable names
- Need to look up variable type/value quickly
- Linear search through all variables: TOO SLOW

BEFORE HASH TABLES:
variables = [
    {name: "x", type: "int"},
    {name: "y", type: "float"},
    ... 10,000 more ...
]
lookup("x") → search all 10,000 → O(n)

SOLUTION BY H.P. LUHN (1953):
"What if we could calculate the position directly?"

hash("x") = some_formula("x") → index 42
variables[42] = {name: "x", type: "int"}
lookup("x") → O(1)!

IMPACT:
- Compilers became 100x faster
- Databases became possible
- Every modern language has HashMap
```

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

---

## 🧠 Interview Patterns — The 5 HashMap Techniques You MUST Know

### Pattern 1: Frequency Counting
```
USE FOR: "How many times does each element appear?"
         "Find most/least frequent element"
         "Check if two strings are anagrams"

Template:
  Map<T, Integer> freq = new HashMap<>();
  for (T item : collection)
      freq.merge(item, 1, Integer::sum);
  
  // Or for chars (faster):
  int[] freq = new int[26];
  for (char c : s.toCharArray()) freq[c - 'a']++;
```

### Pattern 2: Two-Sum (Complement Lookup)
```
USE FOR: "Find pair that sums to target"
         "Find pair with difference = k"

WHY HashMap works:
  For each number X, I need (target - X) to exist.
  Instead of scanning the whole array each time O(n²),
  store what I've seen in a HashMap → check in O(1).

  Map<Integer, Integer> seen = new HashMap<>();  // value → index
  for (int i = 0; i < nums.length; i++) {
      int complement = target - nums[i];
      if (seen.containsKey(complement))
          return new int[]{seen.get(complement), i};
      seen.put(nums[i], i);
  }
```

### Pattern 3: Grouping/Bucketing
```
USE FOR: "Group anagrams", "Group by category", "Bucket sort"

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
```
USE FOR: "Subarray sum equals K", "Contiguous array"

WHY: prefix[j] - prefix[i] = K means subarray [i+1..j] sums to K
     For each j, check if (prefix[j] - K) exists in map.

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
```
USE FOR: "Longest substring without repeating characters"
         "Minimum window substring"

  Map stores element → last seen index (or frequency in window)
  When window is invalid, shrink from left.
```

---

## ⚡ Quick Problem Walkthrough: Subarray Sum Equals K

```
PROBLEM: Given array [1, 2, 3, -1, 1, 2] and K = 3
         Count subarrays that sum to exactly 3.

BRUTE FORCE: Check all O(n²) subarrays → too slow

OPTIMAL APPROACH (Prefix Sum + HashMap):

Index:  0   1   2   3   4   5
Array:  1   2   3  -1   1   2
Prefix: 0   1   3   6   5   6   8

For each prefix[j], count how many prefix[i] = prefix[j] - K

j=0: prefix=1, need 1-3=-2, map has {0:1} → 0 matches
j=1: prefix=3, need 3-3=0, map has {0:1,1:1} → 1 match! (subarray [0..1])
j=2: prefix=6, need 6-3=3, map has {0:1,1:1,3:1} → 1 match! (subarray [0..2])
j=3: prefix=5, need 5-3=2, map has {0:1,1:1,3:1,6:1} → 0 matches
j=4: prefix=6, need 6-3=3, map has {0:1,1:1,3:1,5:1,6:1} → 1 match!
j=5: prefix=8, need 8-3=5, map has {0:1,1:1,3:1,5:1,6:2} → 1 match!

TOTAL: 4 subarrays sum to 3 ✅
  [1,2], [3], [3,-1,1], [1,2]
```

---

📖 **Related Files:**
- [04_Patterns_Templates/10_HashMap_Plus_Counting.md](../04_Patterns_Templates/10_HashMap_Plus_Counting.md) — HashMap pattern problems
- [14_Mental_Models/04_Array_String_Thinking.md](../14_Mental_Models/04_Array_String_Thinking.md) — Prefix sum mental model
- [03_Collections_Java.md](03_Collections_Java.md) — Java Collections framework

