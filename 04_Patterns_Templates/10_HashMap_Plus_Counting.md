# 🧩 HashMap + Counting — Pattern Guide

**Navigation**: [< Previous](09_Array_Plus_SlidingWindow.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](11_Stack_Plus_MonotonicPattern.md)

# HashMap + Frequency Counting — Combined Pattern Guide

**WHY this combination?** HashMap gives O(1) lookup/insert. Combined with counting, grouping, or existence checks, it transforms O(n²) comparisons into O(n) lookups. The most versatile DS+Algo combination.

### 🧠 Deep Intuition — Why HashMap Transforms Quadratic to Linear

## 🔗 Bridge — Where This Chapter Fits

| Dimension | This chapter |
| --- | --- |
| **Builds on** | [Hash Maps](../02_Data_Structures/01e_HashTable.md), [Prefix Sum](26_Prefix_Sum_And_Difference_Array.md) |
| **You will learn** | Complement lookup, frequency maps, anagram keys, prefix-sum + hash map for subarray counts |
| **Leads to** | [Union-Find](27_Union_Find_Pattern.md), [Tries](29_Trie_Pattern.md), [Heap + Greedy](15_Heap_Plus_GreedySelection.md) |
| **Abstraction level** | Repeated scans → **trade memory for `O(1)` lookup** → store what you have seen |

> [!NOTE]
> The full gap-free reading order and dependency graph are in the [Learning Path](00_LEARNING_PATH.md).

---

## 💬 Explain It Like a Study Partner — HashMap + Counting

### 1. The bottom line

Remember what you have already seen in a hash map so each element is checked once.

### 2. The textbook core

- Complement lookup: for `x`, ask whether `target − x` has been seen.
- Frequency map: count occurrences, then reason about counts.
- Canonical key: sort characters (or count signature) to group anagrams.
- Prefix sum + map: `count[prefix − k]` gives the number of subarrays ending here with sum `k`.

### 3. The real-world analogy

A **guest list at the door**: instead of searching the whole party for a name, you check the list.

### 4. Walkthrough

1. Two Sum on `[2,7,11,15]`, target 9.
2. See 2 → look for 7 (not seen) → store 2.
3. See 7 → look for 2 → found at index 0.
4. Return `[0,1]` in one pass.

> [!NOTE]
> **Quick check:** What does the map store in "subarray sum equals k"? *How many times each prefix sum has occurred.*

---

### Historical Evolution

**Inventor / Originator:** Hashing was developed at IBM in the early 1950s: Hans Peter Luhn's 1953 internal memo described chaining, and Amdahl, Boehme, Rochester and Samuel used open addressing around the same time. W. W. Peterson analysed open addressing in 1957; Knuth's *TAOCP* Vol. 3 (1973) gave the classical analysis; Carter and Wegman introduced universal hashing in 1977.

**Predecessor context:** Lookups used linear scans or binary search on sorted tables.

**Evolution narrative:** Hash tables made average-case `O(1)` lookup practical. The birthday paradox (a 1939 result usually credited to Richard von Mises) explains why collisions appear much sooner than intuition suggests.

**Modern practice:** Java's `HashMap` uses chaining (with tree bins for long chains since Java 8); Python's `dict` uses open addressing. Frequency maps, anagram grouping and two-sum lookups all rely on them.

- **Luhn — 1953**: Chained hashing (IBM internal memo)
- **Peterson — 1957**: Analysis of open addressing
- **von Mises — 1939**: Birthday-problem result behind collision estimates
- **Knuth — 1973**: TAOCP Vol. 3 analysis of hashing
- **Carter & Wegman — 1977**: Universal hashing

---

### Production Reality

**Pattern Mis-Selection Debug Workflow — How to identify the wrong pattern:**

When your solution is O(N²) when you expected O(N), or fails on specific inputs, the bug is usually pattern mis-selection, not code. Use this 5-step workflow:

1. **Check the constraint lens**: Did the input violate the pattern's prerequisite? (e.g., sorted input for two pointers, positive numbers for sliding window sum)
2. **Trace the failure input**: For the smallest failing case, identify which invariant broke. Does the algorithm assume the invariant that wasn't true?
3. **Measure the actual complexity**: Add a counter for the inner-loop iterations. O(N²) when O(N) expected usually means a redundant scan, not a wrong algorithm.
4. **Check edge cases the pattern doesn't cover**: Empty input, single element, all-same values, maximum/minimum values. These often reveal the wrong pattern.
5. **Escalate to a different pattern family**: If 4 steps don't fix it, the pattern itself is wrong. Switch to the pattern suggested by the constraint lens.

**Pattern-Specific Failure Modes:**

- **HashMap.get() returning null vs missing key — autoboxing bug** — In Java, `map.get(null)` returns `null` for a key that exists with value `null`. But `null` can also mean the key is missing. This confusion causes NullPointerException when you try to unbox. Detection: test with explicit `null` value insertion; use `containsKey()` before `get()`.

- **ConcurrentHashMap needed for parallel streams (HashMap is not thread-safe)** — Using HashMap in parallel Java streams causes ConcurrentModificationException or data races. Detection: run with `-ea` assertions and parallel stream processing; HashMap will fail.

- **Default initial capacity 16 with high load factor 0.75 causes resize storms** — If you pre-insert millions of entries without specifying initial capacity, HashMap resizes multiple times (each resize is O(n)). Detection: profile memory allocations; frequent resize shows as GC pressure.

- **Hash collision DoS attack (use SHA-256 keyed hash, not String.hashCode)** — String.hashCode() in Java is deterministic and vulnerable to algorithmic complexity attacks. An attacker can craft inputs that all hash to the same bucket, degrading O(1) to O(n). Detection: use `HashMap` with randomized hash seed (Java 7u7+) or use `ConcurrentHashMap`.

**Production Selection Heuristic:** Use HashMap for single-threaded lookup problems; use ConcurrentHashMap for any concurrent access; specify initial capacity for large datasets to avoid resize storms.

---

### ⚠️ Constraint Lens

| Given Constraints                                    | Do This                           |
| ---------------------------------------------------- | --------------------------------- |
| unsorted lookup/complement                           | hashmap                           |
| count subarrays with exact sum and negatives allowed | prefix sum + hashmap              |
| count subarrays divisible by `K`                     | prefix remainder frequency        |
| fixed alphabet lowercase only                        | `int[26]` instead of hashmap      |
| need sorted order/rank                               | TreeMap / TreeSet, not HashMap    |
| memory too high for huge key space                   | coordinate compression or sorting |

Full map: [Constraint-Based Pattern Selection](25_Constraint_Based_Pattern_Selection.md).

### 🧠 Deep Intuition — Why HashMap Transforms Quadratic to Linear

The fundamental idea: many O(n²) algorithms are slow because for each element, they scan all other elements to find a match. **HashMap replaces scanning with constant-time lookup.** Instead of asking "let me scan everything to find X," you ask "HashMap, do you have X?" — and the answer is instant.

#### The Complement Pattern — The Most Important Application

Many problems follow this structure: "For each element A[i], does there exist A[j] such that A[i] + A[j] = target?" The brute force checks all pairs (O(n²)). The HashMap approach is:

1. As you scan each element, compute what you _need_ (the complement): `need = target - A[i]`
2. Check if the HashMap already has it — O(1) lookup
3. If not, add the current element to the HashMap for future lookups

This works because you're building the lookup table as you go. When you reach index 5, the HashMap contains indices 0-4. If the complement exists among them, you find it instantly.

#### Prefix Sum + HashMap — Why It Handles Negatives

The sliding window fails with negatives because shrinking doesn't reliably decrease the sum. Prefix sums bypass this entirely. If `prefix[j] - prefix[i] = k`, then the subarray `[i+1..j]` sums to `k`. By storing all previous prefix sums in a HashMap, you can check "has any previous prefix sum equal to `current_prefix - k`?" in O(1). This is mathematically equivalent to checking all possible subarrays but in linear time.

💡 **Critical initialization:** Always start with `map.put(0, 1)` — this accounts for subarrays starting from index 0 (where the entire prefix _is_ the subarray).

---

## 🧠 WHEN TO RECOGNIZE THIS PATTERN

```
IF the problem says:
  ✅ "Find pair/element with property" (existence check)
  ✅ "Count occurrences" or "frequency"
  ✅ "Group by" (anagrams, categories)
  ✅ "Two Sum" variants (complement lookup)
  ✅ "First non-repeating" or "duplicates"
  ✅ "Subarray sum = K" (prefix sum + map)
THEN → HashMap + Counting
```

---

## 📐 CORE TEMPLATES

### Template 1: Complement Lookup (Two Sum Pattern)

```java
// "Does complement exist?" — O(n)
Map<Integer, Integer> seen = new HashMap<>();  // value → index
for (int i = 0; i < nums.length; i++) {
    int complement = target - nums[i];
    if (seen.containsKey(complement)) {
        return new int[]{seen.get(complement), i};
    }
    seen.put(nums[i], i);
}
```

### Template 2: Frequency Count + Check

```java
// Count frequencies, then use them
Map<Character, Integer> freq = new HashMap<>();
for (char c : s.toCharArray()) {
    freq.merge(c, 1, Integer::sum);
}

// Example: first non-repeating character
for (int i = 0; i < s.length(); i++) {
    if (freq.get(s.charAt(i)) == 1) return i;
}
```

### Template 3: Group By Pattern (Anagrams)

```java
// Group strings by sorted version
Map<String, List<String>> groups = new HashMap<>();
for (String s : strs) {
    char[] arr = s.toCharArray();
    Arrays.sort(arr);
    String key = new String(arr);
    groups.computeIfAbsent(key, k -> new ArrayList<>()).add(s);
}
return new ArrayList<>(groups.values());
```

### Template 4: Prefix Sum + HashMap (Subarray Sum = K)

```java
// Count subarrays with sum = k — CRITICAL PATTERN
Map<Integer, Integer> prefixCount = new HashMap<>();
prefixCount.put(0, 1);  // empty prefix
int sum = 0, count = 0;
for (int num : nums) {
    sum += num;
    count += prefixCount.getOrDefault(sum - k, 0);
    prefixCount.merge(sum, 1, Integer::sum);
}
return count;
```

---

## 🔬 VISUAL: Prefix Sum + HashMap

```
Array: [1, 2, 3, -1, 2]   K = 4

Index:     0   1   2   3   4
Value:     1   2   3  -1   2
Prefix:    1   3   6   5   7

Map starts: {0: 1}

i=0: prefix=1, need 1-4=-3, not in map → count=0, map={0:1, 1:1}
i=1: prefix=3, need 3-4=-1, not in map → count=0, map={0:1, 1:1, 3:1}
i=2: prefix=6, need 6-4=2,  not in map → count=0, map={0:1, 1:1, 3:1, 6:1}
i=3: prefix=5, need 5-4=1,  IN MAP(1)! → count=1, map={.., 5:1}
     → subarray from index 1→3: [2,3,-1] sum=4 ✅
i=4: prefix=7, need 7-4=3,  IN MAP(1)! → count=2, map={.., 7:1}
     → subarray from index 2→4: [3,-1,2] sum=4 ✅

Answer: 2
```

---

🔬 **Section Challenge — 🔬 VISUAL: Prefix Sum + HashMap**

**Challenge 1 (Reasoning):** Prefix sum initialized as `prefix[0] = 0` — why the leading zero and not `prefix[0] = arr[0]`?

<details><summary>Answer</summary>

`prefix[0] = 0` (empty prefix) makes range sum formula uniform: `sum(l,r) = prefix[r+1] - prefix[l]`. Without the 0: `sum(0,r) = prefix[r] - 0` (special case needed). With it: `sum(0,r) = prefix[r+1] - prefix[0] = prefix[r+1]`. Same formula everywhere. This is the 'sentinel' pattern — adding a dummy initial value to eliminate special cases. Same trick used in dummy linked list nodes.

</details>

## 🔥 KEY TRICKS

| Trick                      | When                       | Example                                  |
| -------------------------- | -------------------------- | ---------------------------------------- |
| Sort key for grouping      | Anagram detection          | Sort chars → same key                    |
| Frequency array vs HashMap | When values are small ints | `int[26]` for lowercase letters          |
| `prefixCount.put(0, 1)`    | Prefix sum + map           | ALWAYS initialize with empty prefix      |
| Modulo for divisibility    | "Divisible by K"           | `(prefix % k + k) % k` handles negatives |
| Two-pass counting          | Majority, first unique     | Pass 1: count, Pass 2: query             |

---

## 🔬 FULL WALKTHROUGH: Two Sum (Complement Lookup)

```
Problem: Find two indices whose values sum to target=9.
         nums = [2, 7, 11, 15]

Approach: For each number, check if (target - number) is in HashMap.

WHY HashMap? Brute force checks all pairs O(n²).
HashMap stores seen numbers, so lookup is O(1) per element → O(n) total.

Step-by-step:
  i=0, num=2: need 9-2=7. Map={}. Not found. Add {2:0}
  i=1, num=7: need 9-7=2. Map={2:0}. Found! ✅
  Return [0, 1]

The KEY pattern (use for many problems):
  1. Compute the COMPLEMENT (what you need)
  2. Check if complement EXISTS in map
  3. If not, ADD current element to map
  4. One-pass: check BEFORE adding

Time: O(n) | Space: O(n)
```

---

🔬 **Section Challenge — 🔬 FULL WALKTHROUGH: Two Sum (Complement Lookup)**

**Challenge 1 (Reasoning):** Two-pointer pattern reduces O(N²) brute force to O(N). What is the KEY invariant that makes this safe?

<details><summary>Answer</summary>

The invariant: all pairs we SKIP are guaranteed to not contain the answer. In 3Sum: once we fix `nums[i]` and use l/r pointers, we can safely skip because the array is sorted. If `sum > 0`: decreasing r decreases the sum (smaller right value). If `sum < 0`: increasing l increases the sum (larger left value). We never skip a valid pair because monotonicity guarantees it.

</details>

## 🔬 FULL WALKTHROUGH 2: Subarray Sum Equals K (Prefix Sum + HashMap)

```
Problem: Count subarrays whose sum equals k=7.
         nums = [3, 4, 7, 2, -3, 1, 4, 2]

WHY NOT sliding window? Array has NEGATIVE numbers! Shrinking window
doesn't guarantee sum decreases. Must use Prefix Sum + HashMap.

Key Insight: If prefixSum[j] - prefixSum[i] = k, then subarray [i+1..j] sums to k.
So for each j, we ask: "How many previous prefix sums equal prefixSum[j] - k?"

Step-by-step:
  map = {0: 1}  ← CRITICAL initialization (empty subarray has sum 0)
  sum = 0, count = 0

  i=0, num=3: sum=3. Need 3-7=-4. map has -4? No. map={0:1, 3:1}
  i=1, num=4: sum=7. Need 7-7=0. map has 0? YES(1)! count=1 ✅
              map={0:1, 3:1, 7:1}
  i=2, num=7: sum=14. Need 14-7=7. map has 7? YES(1)! count=2 ✅
              map={0:1, 3:1, 7:1, 14:1}
  i=3, num=2: sum=16. Need 16-7=9. No. map={..., 16:1}
  i=4, num=-3: sum=13. Need 13-7=6. No. map={..., 13:1}
  i=5, num=1: sum=14. Need 14-7=7. map has 7? YES(1)! count=3 ✅
              map={..., 14:2}  (14 now appears twice!)
  i=6, num=4: sum=18. Need 18-7=11. No.
  i=7, num=2: sum=20. Need 20-7=13. map has 13? YES(1)! count=4 ✅

  Answer: 4 subarrays ✅

The subarrays: [3,4], [7], [2,-3,1,4,2+1=?] — let me verify:
  [3,4]=7 ✅, [7]=7 ✅, [-3,1,4,2,3]=7? Actually [1,4,2]=7 ✅, [2,-3,1,4,2,1]=7? etc.

Time: O(n) | Space: O(n)
CRITICAL: Always initialize map with {0: 1}!
```

---

🔬 **Section Challenge — 🔬 FULL WALKTHROUGH 2: Subarray Sum Equals K (Prefix Sum + HashMap)**

**Challenge 1 (Reasoning):** Prefix sum initialized as `prefix[0] = 0` — why the leading zero and not `prefix[0] = arr[0]`?

<details><summary>Answer</summary>

`prefix[0] = 0` (empty prefix) makes range sum formula uniform: `sum(l,r) = prefix[r+1] - prefix[l]`. Without the 0: `sum(0,r) = prefix[r] - 0` (special case needed). With it: `sum(0,r) = prefix[r+1] - prefix[0] = prefix[r+1]`. Same formula everywhere. This is the 'sentinel' pattern — adding a dummy initial value to eliminate special cases. Same trick used in dummy linked list nodes.

</details>

## 🛡️ EDGE CASES

```
┌─────────────────────────────┬──────────────────────────────────────────┐
│ Edge Case                   │ Handling                                 │
├─────────────────────────────┼──────────────────────────────────────────┤
│ Duplicate values [1,1,1]    │ Two Sum: need DIFFERENT indices (check!) │
│ Single element = target     │ Subarray of length 1 is valid            │
│ Negative numbers            │ Prefix Sum + HashMap (NOT sliding window)│
│ All zeros, target=0         │ Every subarray of any length sums to 0   │
│ Empty array                 │ Return 0 / empty                         │
│ Large values (overflow)     │ Use long for prefix sums if needed       │
│ HashMap collision concern   │ Java handles internally, but int[26]     │
│                             │ is faster for lowercase-only problems    │
└─────────────────────────────┴──────────────────────────────────────────┘
```

---

## 📊 COMPLEXITY SUMMARY

| Pattern                     | Time         | Space | When                               |
| --------------------------- | ------------ | ----- | ---------------------------------- |
| Complement Lookup (Two Sum) | O(n)         | O(n)  | Find pair with target sum          |
| Frequency Count             | O(n)         | O(n)  | Count occurrences, find majority   |
| Group By (sorted key)       | O(n·k log k) | O(nk) | Group anagrams, group by property  |
| Prefix Sum + HashMap        | O(n)         | O(n)  | Subarray sum = k (with negatives!) |
| Modulo + HashMap            | O(n)         | O(k)  | Subarray sum divisible by k        |

---

🔬 **Section Challenge — 📊 COMPLEXITY SUMMARY**

**Challenge 1 (Reasoning):** Prefix sum initialized as `prefix[0] = 0` — why the leading zero and not `prefix[0] = arr[0]`?

<details><summary>Answer</summary>

`prefix[0] = 0` (empty prefix) makes range sum formula uniform: `sum(l,r) = prefix[r+1] - prefix[l]`. Without the 0: `sum(0,r) = prefix[r] - 0` (special case needed). With it: `sum(0,r) = prefix[r+1] - prefix[0] = prefix[r+1]`. Same formula everywhere. This is the 'sentinel' pattern — adding a dummy initial value to eliminate special cases. Same trick used in dummy linked list nodes.

</details>

## 📋 PRACTICE PROBLEMS — From Your Excel Sheet

### Easy

| 3 | [Missing Number](https://leetcode.com/problems/missing-number/) | Amazon | XOR trick or math sum |
| 4 | [Happy Number](https://leetcode.com/problems/happy-number/) | Salesforce | HashSet for cycle detection |
| 5 | [Valid Parentheses](https://leetcode.com/problems/valid-parentheses/) | Salesforce | Stack + HashMap for matching |
| 6 | [Print All Duplicates in String](https://www.geeksforgeeks.org/print-all-the-duplicates-in-the-input-string/) | — | Frequency count |
| 7 | [Longest Common Prefix](https://leetcode.com/problems/longest-common-prefix/) | — | Trie or character-by-character |

### Medium

| #   | Problem                                                                                           | Companies | Key Insight                   |
| --- | ------------------------------------------------------------------------------------------------- | --------- | ----------------------------- |
| 8   | [Subarray Sum Equals K](https://leetcode.com/problems/subarray-sum-equals-k/)                     | Microsoft | Prefix Sum + HashMap          |
| 9   | [Subarray Sums Divisible by K](https://leetcode.com/problems/subarray-sums-divisible-by-k/)       | —         | Prefix modulo + HashMap       |
| 10  | [Group Anagrams](https://leetcode.com/problems/group-anagrams/)                                   | —         | Sort key grouping             |
| 11  | [Find All Duplicates in an Array](https://leetcode.com/problems/find-all-duplicates-in-an-array/) | Microsoft | Index marking or frequency    |
| 12  | [Top K Frequent Elements](https://leetcode.com/problems/top-k-frequent-elements/)                 | —         | HashMap + Heap or Bucket Sort |

### Hard

| #   | Problem                                                                                                      | Key Insight                    |
| --- | ------------------------------------------------------------------------------------------------------------ | ------------------------------ |
| 13  | [Insert Delete GetRandom O(1)](https://leetcode.com/problems/insert-delete-getrandom-o1-duplicates-allowed/) | HashMap + ArrayList swap trick |

### Additional — From Heaps & Hashing Section

| #   | Problem                                                                                                                                                               | Key Insight               |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| 14  | [Check if array divisible into pairs with sum divisible by K](https://www.geeksforgeeks.org/check-if-an-array-can-be-divided-into-pairs-whose-sum-is-divisible-by-k/) | Modulo frequency counting |
| 15  | [Find number of Employees Under every Manager](https://www.geeksforgeeks.org/find-number-of-employees-under-every-manager/)                                           | HashMap tree traversal    |
| 16  | [Smallest Positive Missing Number](https://practice.geeksforgeeks.org/problems/smallest-positive-missing-number-1587115621/1/)                                        | Index marking             |
| 17  | [Largest Subarray with 0 Sum](https://practice.geeksforgeeks.org/problems/largest-subarray-with-0-sum/1/)                                                             | Prefix Sum + HashMap      |

---

## ⚠️ COMMON MISTAKES

1. **Forgetting `prefixCount.put(0, 1)`** — Miss subarrays starting from index 0
2. **Negative modulo** — Java `%` can return negative! Use `((x % k) + k) % k`
3. **Iterator modification** — Don't modify HashMap while iterating (use `entrySet()` carefully)
4. **HashMap vs TreeMap** — Use HashMap for O(1) access; TreeMap only when you need sorted keys

---

## 🎯 INTERVIEW ARTICULATION — How to Explain HashMap Pattern

**When the interviewer gives you a HashMap/counting problem, say this:**

"The brute force uses nested loops to check every pair — O(n²). By storing elements in a HashMap as I scan, I can check 'have I seen the complement?' in O(1). The trade-off is O(n) extra space, but we reduce time from O(n²) to O(n)."

**For prefix sum problems:**

"I maintain a running prefix sum. If `prefix[j] - prefix[i] = target`, then the subarray [i+1..j] sums to target. By storing all prefix sums in a HashMap, I check 'has any previous prefix equaled `current - target`?' in O(1)."

**Common mistakes to proactively mention:**

- ❌ "Always initialize `map.put(0, 1)` for prefix sum problems — it counts subarrays starting from index 0."
- ❌ "Java's `%` can return negative! Use `((x % k) + k) % k` for modulo-based grouping."
- ❌ "Don't use HashMap for < 30 elements — a simple array or linear scan is faster due to hashing overhead."

**Real-world applications:**

- API rate limiting (IP → request count per time window)
- Session stores in web servers (sessionId → user data)
- Feature flags (flagName → enabled/disabled)
- Database indexing (hash index for equality lookups)
- Deduplication in event processing pipelines

---

📖 **Related Chapters:**

- [02_Data_Structures/01e_HashTable.md](../02_Data_Structures/01e_HashTable.md) — Hash table internals
- [04_Patterns_Templates/04_Pattern_Recognition.md](04_Pattern_Recognition.md) — Pattern Recognition (Prefix Sum)

---

[← 09 Array+SlidingWindow](09_Array_Plus_SlidingWindow.md) | [11 Stack+Monotonic →](11_Stack_Plus_MonotonicPattern.md)


---

## 🏢 Enterprise Lens — HashMap + Counting

| Area | What top-tier engineering looks like |
| ---- | ------------------------------------ |
| **Where it runs in production** | Deduplication, caching, sessionisation, join keys, inverted indexes |
| **Failure modes** | Hash-collision attacks; forgetting to seed the map with prefix `0`; mutating keys |
| **Testing and verification** | Property tests against brute force; test duplicates, negatives and the empty input |
| **Review checklist** | Complexity stated for time **and** space · invariant stated · edge cases listed (empty, one element, duplicates, extremes) · behaviour at 10× data understood |

---

## Reality Check

**"HashMap counting is the easy pattern"** → The counting is easy; the INSIGHT about what to count is the problem. Group-anagrams counts by sorted-string key; subarray-sum counts by prefix-sum key; longest-consecutive counts by set membership plus a start-of-run test. The pattern's real skill is KEY DESIGN — finding the canonical form under which "same" things collide — and that is a modeling act, not a data-structure act.

**"getOrDefault and merge are interchangeable conveniences"** → They differ under concurrency and in null semantics: merge with a remapping to null DELETES the entry (a documented-but-surprising behavior used for decrement-and-remove counting), while put(get()+1) NPEs on absent keys. The decrement side of counting is where bugs live: forgetting to remove zero-count entries makes containsKey checks lie in sliding-window-with-counts problems.

**"Counting characters needs the same tools as counting objects"** → Bounded alphabets want arrays (26/128/256 slots): faster, and comparable with Arrays.equals as a composite key. Unbounded keys want HashMap. The hybrid trick interviews love: use the 26-array AS the HashMap key by encoding it to a string — the count-signature — giving O(n·k) group-anagrams without sorting each word.

**"Frequency maps answer frequency questions only"** → The frequency map is the entry point to a second decision: top-k frequent goes to a size-k min-heap OR bucket sort by count (O(n), the answer that upgrades the interview); first-unique wants insertion-order preserved (LinkedHashMap); mode-under-updates wants count-of-counts. The map is step one of a two-step pattern; stopping at step one leaves the O(n log n) sort on the table.

**"Hash-based counting gives deterministic performance"** → Adversarial keys degrade HashMap to its collision path — Java 8+ treeifies buckets to O(log n) but only when keys are Comparable; non-comparable keys stay in linked chains at O(n). Competitive judges exploit this against predictable hash functions in other languages. If keys are attacker-controlled in production (query strings, user IDs), the counting layer inherits a DoS surface — the fix is randomized hashing or bounded maps, not hope.
