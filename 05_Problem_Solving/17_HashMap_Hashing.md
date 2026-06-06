**Navigation**: [< Previous](16_Heap.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](18_BitManipulation.md)

**Problems 17/22** | [Prev](16_Heap.md) | [Index](../00_MASTER_INDEX.md) | [Next](18_BitManipulation.md)

---

## 🗺️ Pattern Recognition Header — HashMap & Hashing

**Which HashMap pattern should I use?**


| Signal / Problem Type | Pattern | Core Idea |
|---|---|---|
| `two numbers that sum to target` | **Two-Sum (complement)** | Store `val→idx`; look up `target-num` before inserting |
| `count occurrences / top-k frequency` | **Frequency Count** | `map.merge(key, 1, Integer::sum)` |
| `how many subarrays sum to K?` | **Prefix Sum + HashMap** | `prefixCount.get(prefixSum - k)` |
| `group items by property` | **Grouping** | `map.computeIfAbsent(key, k→new ArrayList<>()).add(val)` |
| `check if element seen before` | **HashSet visited** | `set.add(x)` → false if already present |
| `find duplicates in O(n) O(1) space` | **In-place Hashing** | Negate at index `|val|-1` as visited marker |


**The Golden Rule:**
```
"Brute force is O(n²)?  → Inner loop is a SEARCH → Replace with HashMap → O(n)"

Key reason:
  Brute Two-Sum: for i → for j (search) → O(n²)
  HashMap Two-Sum: for i → map.get(target-num) → O(n)

⚠️ Java mod pitfall: -7 % 5 = -2 in Java. Fix: ((n % k) + k) % k
⚠️ Java PQ is MIN-HEAP. Max-heap: new PriorityQueue<>(Comparator.reverseOrder())
```

📖 **Mental Model:** [04_Array_String_Thinking.md](../14_Mental_Models/04_Array_String_Thinking.md)
📖 **Space-Time Tradeoff:** [12_Space_Time_Tradeoffs.md](../14_Mental_Models/12_Space_Time_Tradeoffs.md)
📖 **Full Pattern Guide:** [00_PATTERN_MASTER_GUIDE.md](../04_Patterns_Templates/00_PATTERN_MASTER_GUIDE.md)

---




# 📚 SECTION 15: HASHMAP & HASHING PROBLEMS

---

## PART 0: WHY HashMap — MIT/KTH STYLE


WHY HASHMAP? — THE O(1) LOOKUP ENGINE

WHY: HashMap reduces "search/lookup" from O(n) to O(1) average.
The most frequently used data structure in interviews — appears in ~40%
of solutions as a helper structure. If you're stuck, ask: "Would a
HashMap give me O(1) lookup for something I'm repeatedly searching?"


FORMAL DEFINITION (MIT 6.006 / KTH DD2350):

A hash function h: U → {0, 1, ..., m-1} maps a universe U of keys
to m slots (buckets).

Under Simple Uniform Hashing Assumption (SUHA):
Expected lookup time = O(1 + α)
where α = n/m is the load factor
n = number of stored elements, m = number of slots

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
→ Count occurrences of each element. Foundation for Top-K, duplicates.

2. TWO-SUM PATTERN: Store complement, lookup in O(1)
→ "Does target - arr[i] exist?" Check map before/after inserting.

3. PREFIX SUM + HASHMAP: "How many subarrays sum to K?"
→ Store prefix sum frequencies. If prefixSum[j] - K was seen before,
a valid subarray exists. THE most important medium-level pattern.

4. GROUPING: Group elements by some computed property
→ Anagrams by sorted key, numbers by remainder, points by slope.
→ map.computeIfAbsent(key, k -> new ArrayList<>()).add(value)

5. SEEN/VISITED: Use HashSet as O(1) membership test
→ Cycle detection, duplicate detection, sequence problems.


CRITICAL INSIGHT:
"If brute force is O(n²) because of nested search, HashMap makes the
inner search O(1) → total O(n)."

Brute force Two-Sum: for each i, for each j → O(n²)
HashMap Two-Sum:     for each i, lookup complement → O(n)

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
□ Solve any "find pair/subarray" problem in O(n) using HashMap
□ Implement prefix sum + HashMap for subarray sum problems
□ Design O(1) data structures (LRU Cache, RandomizedSet)
□ Recognize when HashMap is the hidden helper in a problem
□ Handle Java HashMap edge cases in production code



---



🔬 **Section Challenge — PART 0: WHY HashMap — MIT/KTH STYLE**

**Challenge 1 (Reasoning):** You insert 1000 entries into a HashMap with default capacity 16. How many resize operations happen?
<details><summary>Answer</summary>

Resize threshold = capacity × 0.75. Resizes at: 12 (16→32), 24 (32→64), 48 (64→128), 96 (128→256), 192 (256→512), 384 (512→1024). Total: 6 resizes. Each resize copies all entries to new bucket array. Pre-sizing: `new HashMap<>(1334)` (1000/0.75 ≈ 1334 → next power of 2 = 2048) avoids all resizes.
</details>

**Challenge 2 (Bug Hunt):** Two `Person` objects with same name and age. You override `equals()` to return true but not `hashCode()`. What happens when used as `HashMap` keys?
<details><summary>Answer</summary>

Both objects land in DIFFERENT buckets (different hashCodes → different bucket index). The HashMap doesn't check `equals()` across buckets — it goes straight to one bucket. So `map.get(person2)` returns NULL even though `person1.equals(person2)`. Overriding `equals` without `hashCode` violates the contract and breaks all hash-based collections. Always override both together.
</details>


## 15.1 FREQUENCY COUNTING (Easy–Medium)

---

### #266. [Two Sum](https://leetcode.com/problems/two-sum/) (LC 1) ★ FULL SOLUTION

```
PROBLEM:
  Given an array of integers nums and an integer target, return indices of
  the two numbers such that they add up to target.
  Assume exactly one solution exists. May not use the same element twice.

INPUT:  nums = [2, 7, 11, 15], target = 9
OUTPUT: [0, 1]  (because nums[0] + nums[1] = 2 + 7 = 9)

KEY OBSERVATION:
  For each element nums[i], we need nums[j] = target - nums[i] (the complement).
  Brute force checks all j ≠ i → O(n²).
  HashMap stores {value → index} so complement lookup is O(1) → total O(n).

  One-pass technique: check if complement exists BEFORE inserting current element.
  This guarantees we never match an element with itself.

ALGORITHM:
  1. Create HashMap<Integer, Integer> map  (value → index)
  2. For i = 0 to n-1:
     a. complement = target - nums[i]
     b. If map.containsKey(complement):
          return [map.get(complement), i]
     c. map.put(nums[i], i)
  3. (unreachable if exactly one solution exists)

PROOF OF CORRECTNESS:
  Invariant: at iteration i, map contains {nums[0]→0, nums[1]→1, ..., nums[i-1]→i-1}.
  If the answer pair is (p, q) with p < q, then when i = q:
    • nums[p] was inserted at iteration p (since p < q)
    • complement = target - nums[q] = nums[p]
    • map.containsKey(nums[p]) = true → returns [p, q]  ✓
  We never return [i, i] because we check BEFORE inserting nums[i].

PROOF OF COMPLEXITY:
  • Each of the n elements: one HashMap lookup O(1) + one HashMap insert O(1)
  • Total: n × O(1) = O(n)

JAVA CODE:
```


```java
class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (map.containsKey(complement)) {
                return new int[] { map.get(complement), i };
            }
            map.put(nums[i], i);
        }
        throw new IllegalArgumentException("No two sum solution");
    }
}
```

```
COMPLEXITY:
  Time:  O(n) — single pass, each operation O(1) amortized
  Space: O(n) — HashMap stores at most n entries

VARIANTS:
  • Three Sum (LC 15): sort + two pointers, or fix one + Two Sum
  • Four Sum (LC 18): fix two + Two Sum
  • Two Sum II - Sorted (LC 167): two pointers O(1) space
  • Two Sum III - Data Structure Design (LC 170)
```

---

### #267. [Group Anagrams](https://leetcode.com/problems/group-anagrams/) (LC 49) ★ FULL SOLUTION

```
PROBLEM:
  Given an array of strings strs, group the anagrams together.
  An anagram is a word formed by rearranging the letters of another word,
  using all the original letters exactly once.

INPUT:  strs = ["eat","tea","tan","ate","nat","bat"]
OUTPUT: [["bat"],["nat","tan"],["ate","eat","tea"]]

KEY OBSERVATION:
  Two strings are anagrams iff they have the same characters with the same
  frequencies. Sorting both strings produces the same key.
  Alternative: encode character frequencies as a string key (avoids sort cost).

ALGORITHM (Sort-based):
  1. Create HashMap<String, List<String>> map
  2. For each word in strs:
     a. key = sort(word.toCharArray())
     b. map.computeIfAbsent(key, k -> new ArrayList<>()).add(word)
  3. Return new ArrayList<>(map.values())

ALGORITHM (Count-based — optimal):
  1. For each word, build int[26] frequency array
  2. Encode as string: "2#1#0#...#0#" (count of each letter)
  3. Use this as HashMap key → groups anagrams without O(K log K) sort

PROOF:
  Claim: Two strings s and t are anagrams ⟺ sort(s) = sort(t).
  (⟹) If s is an anagram of t, they have identical character multisets,
       so sorting both yields the same string.
  (⟸) If sort(s) = sort(t), both have the same characters with same counts,
       so s is an anagram of t.  ∎

JAVA CODE:
```


```java
class Solution {
    // Approach 1: Sort-based key — O(NK log K)
    public List<List<String>> groupAnagrams(String[] strs) {
        Map<String, List<String>> map = new HashMap<>();
        for (String s : strs) {
            char[] chars = s.toCharArray();
            Arrays.sort(chars);
            String key = new String(chars);
            map.computeIfAbsent(key, k -> new ArrayList<>()).add(s);
        }
        return new ArrayList<>(map.values());
    }

    // Approach 2: Count-based key — O(NK)
    public List<List<String>> groupAnagramsOptimal(String[] strs) {
        Map<String, List<String>> map = new HashMap<>();
        for (String s : strs) {
            int[] count = new int[26];
            for (char c : s.toCharArray()) count[c - 'a']++;
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < 26; i++) {
                sb.append(count[i]).append('#');
            }
            String key = sb.toString();
            map.computeIfAbsent(key, k -> new ArrayList<>()).add(s);
        }
        return new ArrayList<>(map.values());
    }
}
```

```
COMPLEXITY:
  Approach 1: Time O(N·K·log K) where N = number of strings, K = max length
              Space O(N·K) for the HashMap
  Approach 2: Time O(N·K) — no sorting, just counting
              Space O(N·K)

VARIANTS:
  • Valid Anagram (LC 242): compare two strings only
  • Find All Anagrams in String (LC 438): sliding window
  • Group Shifted Strings (LC 249)
```

---

### #268. [Find All Duplicates in Array](https://leetcode.com/problems/find-all-duplicates-in-an-array/) (LC 442) ★ FULL SOLUTION

```
PROBLEM:
  Given an integer array nums of length n where all values are in [1, n],
  each integer appears once or twice. Find all the integers that appear twice.
  Must run in O(n) time and O(1) extra space.

INPUT:  nums = [4,3,2,7,8,2,3,1]
OUTPUT: [2,3]

KEY OBSERVATION:
  Since values ∈ [1, n], each value maps to a valid index (value - 1).
  Visit index |nums[i]| - 1 and negate the element there as a "visited" marker.
  If the element at that index is already negative → we've seen this value before → duplicate!

  This is "in-place hashing" — the array IS the hash table.

ALGORITHM:
  1. result = []
  2. For i = 0 to n-1:
     a. idx = |nums[i]| - 1          // target index for this value
     b. If nums[idx] < 0:            // already visited → duplicate
          result.add(|nums[i]|)
     c. Else:
          nums[idx] = -nums[idx]      // mark as visited
  3. Return result

PROOF OF CORRECTNESS:
  Invariant: After processing elements 0..i-1, nums[v-1] < 0 iff value v
  has been encountered at least once among nums[0..i-1] (using original values).

  Base case: i = 0, no elements processed, all positive (or original). ✓
  Inductive step: At iteration i with value v = |nums[i]|:
    • If nums[v-1] < 0: v was seen before (by invariant) → v is a duplicate ✓
    • If nums[v-1] > 0: v not seen before → negate to mark → invariant maintained ✓
  Since each value appears at most twice, each duplicate is reported exactly once.  ∎

JAVA CODE:
```


```java
class Solution {
    public List<Integer> findDuplicates(int[] nums) {
        List<Integer> result = new ArrayList<>();
        for (int i = 0; i < nums.length; i++) {
            int idx = Math.abs(nums[i]) - 1;
            if (nums[idx] < 0) {
                result.add(Math.abs(nums[i]));
            } else {
                nums[idx] = -nums[idx];
            }
        }
        return result;
    }
}
```

```
COMPLEXITY:
  Time:  O(n) — single pass, constant work per element
  Space: O(1) — in-place marking, output list not counted

WHY THIS MATTERS:
  The "in-place hashing" trick (using array indices as hash slots) appears in:
  • First Missing Positive (LC 41)
  • Find the Duplicate Number (LC 287) — Floyd's cycle
  • Set Mismatch (LC 645)

VARIANTS:
  • Find All Numbers Disappeared in Array (LC 448) — same technique, collect unmarked
  • First Missing Positive (LC 41) — cyclic sort variant
```

---

### #269. [Top K Frequent Elements](https://leetcode.com/problems/top-k-frequent-elements/) (LC 347) — Approach

```
APPROACH: HashMap + Bucket Sort
  1. Count frequencies: Map<Integer, Integer> freq — O(n)
  2. Create bucket array of size n+1: List<Integer>[] buckets
     buckets[i] = list of elements with frequency i
  3. Iterate buckets from high to low, collect first K elements — O(n)

  Why bucket sort over heap?
    • Heap: O(n log k) — fine for small k
    • Bucket sort: O(n) — always optimal
    • Quickselect: O(n) average — but O(n²) worst case

  Time: O(n), Space: O(n)
```

---

### #270. [Missing Number](https://leetcode.com/problems/missing-number/) (LC 268) — Approach

```
APPROACH 1: Math (Gauss sum)
  Expected sum = n(n+1)/2. Missing = expected - actual. O(n) time, O(1) space.

APPROACH 2: XOR
  XOR all indices [0..n] with all array values. Pairs cancel → result is missing.
  a ⊕ a = 0, a ⊕ 0 = a. O(n) time, O(1) space.

APPROACH 3: HashSet
  Add all elements, check which in [0..n] is absent. O(n) time, O(n) space.
```


---

### #271. [Happy Number](https://leetcode.com/problems/happy-number/) (LC 202) — Approach

```
APPROACH: Cycle detection with HashSet
  1. Compute sum of squares of digits repeatedly.
  2. If result = 1 → happy. If result seen before → cycle → not happy.
  3. HashSet stores seen values for O(1) lookup.

  Alternative: Floyd's slow/fast pointer (O(1) space).
  Proven: the sequence either reaches 1 or enters a cycle.
  The cycle always includes 4 → can also check for 4.

  Time: O(log n) per step, finite steps. Space: O(log n) with HashSet.
```


---

### #272. Print All Duplicates in String (GFG) — Approach

```
APPROACH: Frequency count with int[256] or HashMap
  1. Count frequency of each character.
  2. Print characters with frequency > 1.
  Time: O(n), Space: O(1) — fixed alphabet size.
```

---

### #273. [Longest Common Prefix](https://leetcode.com/problems/longest-common-prefix/) (LC 14) — Approach

```
APPROACH: Vertical scan (no HashMap needed)
  1. Compare characters column by column across all strings.
  2. Stop at first mismatch or when any string is exhausted.
  Time: O(S) where S = sum of all string lengths. Space: O(1).

  Note: This is listed here because students often try HashMap — unnecessary.
  The vertical scan is simpler and equally optimal.
```

---




## 15.2 PREFIX SUM + HASHMAP (Medium–Hard)

**This is the single most important pattern in this section.**
Master #274 and #275 — they appear in interviews constantly.

---

### #274. [Subarray Sum Equals K](https://leetcode.com/problems/subarray-sum-equals-k/) (LC 560) ★ FULL SOLUTION

```
PROBLEM:
  Given an integer array nums and an integer k, return the total number
  of subarrays whose sum equals k.

INPUT:  nums = [1, 1, 1], k = 2
OUTPUT: 2  (subarrays [1,1] at index 0-1 and 1-2)

INPUT:  nums = [1, 2, 3, -1, 1, 2], k = 3
OUTPUT: 4  (subarrays: [1,2], [3], [3,-1,1], [-1,1,2+1?] → trace carefully)

KEY OBSERVATION:
  Define prefixSum[j] = nums[0] + nums[1] + ... + nums[j-1] (with prefixSum[0] = 0).
  The sum of subarray [i+1 .. j] = prefixSum[j] - prefixSum[i].
  We want prefixSum[j] - prefixSum[i] = k, i.e., prefixSum[i] = prefixSum[j] - k.

  For each j, count how many previous prefix sums equal (prefixSum[j] - k).
  Store prefix sum frequencies in a HashMap → O(1) lookup.

  ⚠️ CRITICAL: WHY SLIDING WINDOW FAILS HERE:
  Sliding window works by: "if sum > k, shrink left; if sum < k, expand right."
  This requires MONOTONICITY: expanding always increases sum, shrinking decreases.
  With NEGATIVE NUMBERS, adding an element can decrease the sum!
  So we cannot determine which direction to move → sliding window breaks.
  Prefix sum + HashMap works regardless of sign.

ALGORITHM:
  1. prefixSum = 0, count = 0
  2. map = {0: 1}  // empty prefix (sum = 0) occurs once
  3. For each num in nums:
     a. prefixSum += num
     b. count += map.getOrDefault(prefixSum - k, 0)
     c. map.merge(prefixSum, 1, Integer::sum)
  4. Return count

STEP-BY-STEP TRACE (nums = [1, 2, 3, -1, 1, 2], k = 3):

  Initially: prefixSum = 0, map = {0: 1}, count = 0

  i=0, num=1:  prefixSum = 1
               lookup 1 - 3 = -2 → map has 0 occurrences → count = 0
               map = {0:1, 1:1}

  i=1, num=2:  prefixSum = 3
               lookup 3 - 3 = 0 → map has 1 occurrence → count = 1
               (subarray [0..1] = [1,2], sum = 3) ✓
               map = {0:1, 1:1, 3:1}

  i=2, num=3:  prefixSum = 6
               lookup 6 - 3 = 3 → map has 1 occurrence → count = 2
               (subarray [2..2] = [3], sum = 3) ✓
               map = {0:1, 1:1, 3:1, 6:1}

  i=3, num=-1: prefixSum = 5
               lookup 5 - 3 = 2 → map has 0 occurrences → count = 2
               map = {0:1, 1:1, 3:1, 6:1, 5:1}

  i=4, num=1:  prefixSum = 6
               lookup 6 - 3 = 3 → map has 1 occurrence → count = 3
               (subarray [3..4] = [-1,1,... wait, prefix[4]-prefix[2]=6-3=3
                → subarray [3..4] indices → nums[2+1..4] → [3,-1,1]? 
                Actually prefix sum indices: prefixSum at j=5 is 6, 
                prefixSum at i=2 is 3, subarray [i+1..j]=[3..4]=[−1,1]
                sum = -1+1 = 0 ≠ 3... Let me recount.)
               
               Correction — re-index carefully:
               prefixSum[0]=0, prefixSum[1]=1, prefixSum[2]=3, 
               prefixSum[3]=6, prefixSum[4]=5, prefixSum[5]=6, prefixSum[6]=8
               
               At j=5 (0-indexed i=4): prefixSum=6, look for 6-3=3
               prefixSum[2]=3 → subarray [3..5-1]=[3..4] → nums[2..4]=[3,-1,1]
               sum = 3+(-1)+1 = 3 ✓
               count = 3

  i=5, num=2:  prefixSum = 8
               lookup 8 - 3 = 5 → map has 1 occurrence → count = 4
               prefixSum[4]=5 → subarray nums[4..5]=[1,2], sum=3 ✓
               map = {0:1, 1:1, 3:1, 6:2, 5:1, 8:1}

  Final count = 4.
  Subarrays: [1,2], [3], [3,-1,1], [1,2] (different positions)  ✓

PROOF OF CORRECTNESS:
  Claim: The algorithm counts every subarray with sum k exactly once.

  A subarray nums[i..j] has sum k iff prefixSum[j+1] - prefixSum[i] = k,
  i.e., prefixSum[i] = prefixSum[j+1] - k.

  When processing index j (computing prefixSum[j+1]), the HashMap contains
  the frequencies of all prefixSum[0], prefixSum[1], ..., prefixSum[j].
  map.get(prefixSum[j+1] - k) returns exactly the count of valid start
  indices i where prefixSum[i] = prefixSum[j+1] - k.

  Each pair (i, j+1) with i < j+1 is counted exactly once (when j is processed).
  Therefore the total count is correct.  ∎

JAVA CODE:
```

```java
class Solution {
    public int subarraySum(int[] nums, int k) {
        Map<Integer, Integer> prefixCount = new HashMap<>();
        prefixCount.put(0, 1); // empty prefix
        int prefixSum = 0, count = 0;

        for (int num : nums) {
            prefixSum += num;
            count += prefixCount.getOrDefault(prefixSum - k, 0);
            prefixCount.merge(prefixSum, 1, Integer::sum);
        }
        return count;
    }
}
```

```
COMPLEXITY:
  Time:  O(n) — single pass, each HashMap operation O(1) amortized
  Space: O(n) — HashMap stores at most n+1 distinct prefix sums

VARIANTS:
  • Binary Subarrays With Sum (LC 930) — same technique (0/1 array)
  • Count Nice Subarrays (LC 1248) — transform to prefix sum
  • Path Sum III (LC 437) — prefix sum on tree paths (DFS + HashMap)
```

---

### #275. [Subarray Sums Divisible by K](https://leetcode.com/problems/subarray-sums-divisible-by-k/) (LC 974) ★ FULL SOLUTION

```
PROBLEM:
  Given an integer array nums and an integer k, return the number of
  non-empty subarrays that have a sum divisible by k.

INPUT:  nums = [4,5,0,-2,-3,1], k = 5
OUTPUT: 7

KEY OBSERVATION:
  prefixSum[j] - prefixSum[i] ≡ 0 (mod k)
  ⟺ prefixSum[j] ≡ prefixSum[i] (mod k)

  So we group prefix sums by their remainder mod k.
  If r prefix sums share the same remainder, they form C(r, 2) = r(r-1)/2 pairs.

  ⚠️ JAVA MOD PITFALL: In Java, -7 % 5 = -2 (not 3).
  Fix: ((prefixSum % k) + k) % k  to ensure non-negative remainder.

PROOF:
  Lemma: sum(nums[i+1..j]) = prefixSum[j] - prefixSum[i].
  sum divisible by k ⟺ (prefixSum[j] - prefixSum[i]) mod k = 0
                      ⟺ prefixSum[j] mod k = prefixSum[i] mod k.
  
  Therefore, for each remainder r ∈ {0, 1, ..., k-1}, if freq[r] prefix sums
  have remainder r, the number of valid pairs = C(freq[r], 2).
  Total = Σ C(freq[r], 2) for r = 0..k-1.  ∎

JAVA CODE:
```

```java
class Solution {
    public int subarraysDivByK(int[] nums, int k) {
        Map<Integer, Integer> remainderCount = new HashMap<>();
        remainderCount.put(0, 1); // empty prefix has sum 0, remainder 0
        int prefixSum = 0, count = 0;

        for (int num : nums) {
            prefixSum += num;
            int remainder = ((prefixSum % k) + k) % k; // handle negative
            count += remainderCount.getOrDefault(remainder, 0);
            remainderCount.merge(remainder, 1, Integer::sum);
        }
        return count;
    }
}
```

```
COMPLEXITY:
  Time:  O(n), Space: O(min(n, k)) — at most k distinct remainders

VARIANTS:
  • Continuous Subarray Sum (LC 523) — sum divisible by k, length ≥ 2
  • Subarray Sum Equals K (LC 560) — exact sum, not divisible
  • Make Sum Divisible by P (LC 1590)
```

---

### #276. Largest Subarray with 0 Sum (GFG) ★ FULL SOLUTION

```
PROBLEM:
  Given an array of integers, find the length of the longest subarray
  with sum 0.

INPUT:  arr = [15, -2, 2, -8, 1, 7, 10, 23]
OUTPUT: 5  (subarray [-2, 2, -8, 1, 7] has sum 0)

KEY OBSERVATION:
  If prefixSum[j] = prefixSum[i] for i < j, then sum(arr[i+1..j]) = 0.
  To maximize length j - i, store the FIRST occurrence of each prefix sum.
  Answer = max(j - firstOccurrence[prefixSum[j]]) over all j.

ALGORITHM:
  1. map = {0: -1}  // prefix sum 0 first occurs at "index -1"
  2. prefixSum = 0, maxLen = 0
  3. For j = 0 to n-1:
     a. prefixSum += arr[j]
     b. If map.containsKey(prefixSum):
          maxLen = max(maxLen, j - map.get(prefixSum))
     c. Else:
          map.put(prefixSum, j)   // store FIRST occurrence only
  4. Return maxLen

PROOF:
  If prefixSum[j] = prefixSum[i], sum of subarray [i+1..j] = 0.
  By storing only the first occurrence of each prefix sum, j - map.get(prefixSum)
  gives the maximum possible length for this particular prefix sum value.
  Taking the max over all j gives the global maximum.  ∎

JAVA CODE:
```

```java
class Solution {
    int maxLen(int arr[], int n) {
        Map<Integer, Integer> firstOccurrence = new HashMap<>();
        firstOccurrence.put(0, -1);
        int prefixSum = 0, maxLen = 0;

        for (int j = 0; j < n; j++) {
            prefixSum += arr[j];
            if (firstOccurrence.containsKey(prefixSum)) {
                maxLen = Math.max(maxLen, j - firstOccurrence.get(prefixSum));
            } else {
                firstOccurrence.put(prefixSum, j);
            }
        }
        return maxLen;
    }
}
```

```
COMPLEXITY:
  Time: O(n), Space: O(n)

VARIANTS:
  • Largest subarray with equal 0s and 1s (replace 0→-1, find longest 0-sum)
  • Longest Subarray with Sum K (GFG) — first occurrence of prefixSum - K
```


---

### #277. Check Array Divisible into Pairs (sum div K) (GFG) — Approach

```
APPROACH: Remainder frequency matching
  1. Compute remainder of each element: r = ((arr[i] % k) + k) % k
  2. For remainder 0: frequency must be even (pairs among themselves)
  3. For remainder r and k-r: freq[r] must equal freq[k-r]
  4. If k is even: freq[k/2] must be even

  Time: O(n), Space: O(k)
```

---

### #278. [Longest Consecutive Sequence](https://leetcode.com/problems/longest-consecutive-sequence/) (LC 128) ★ FULL SOLUTION

```
PROBLEM:
  Given an unsorted array of integers nums, return the length of the
  longest consecutive elements sequence. Must run in O(n) time.

INPUT:  nums = [100, 4, 200, 1, 3, 2]
OUTPUT: 4  (sequence [1, 2, 3, 4])

KEY OBSERVATION:
  Put all elements in a HashSet. For each element, check if it's the START
  of a sequence (i.e., num - 1 is NOT in the set). Then count consecutive
  elements from that start.

  This avoids sorting (O(n log n)) and achieves O(n).

  KEY INSIGHT for O(n) proof: We only extend from sequence starts.
  Each element is visited at most twice: once in the main loop, once
  during a sequence extension. So total work = O(2n) = O(n).

ALGORITHM:
  1. set = new HashSet<>(nums)
  2. maxLen = 0
  3. For each num in set:
     a. If (num - 1) NOT in set:   // num is a sequence start
          length = 1
          current = num
          While (current + 1) in set:
              current++
              length++
          maxLen = max(maxLen, length)
  4. Return maxLen

PROOF OF O(n):
  Let sequences have lengths L₁, L₂, ..., Lₘ where Σ Lᵢ ≤ n.
  The outer loop iterates n times. The inner while loop runs Lᵢ times for
  the i-th sequence start, and 0 times for non-starts.
  Total inner iterations = Σ Lᵢ ≤ n.
  Total work = n (outer) + n (inner) = O(n).  ∎

JAVA CODE:
```

```java
class Solution {
    public int longestConsecutive(int[] nums) {
        Set<Integer> set = new HashSet<>();
        for (int num : nums) set.add(num);

        int maxLen = 0;
        for (int num : set) {
            if (!set.contains(num - 1)) { // start of sequence
                int current = num;
                int length = 1;
                while (set.contains(current + 1)) {
                    current++;
                    length++;
                }
                maxLen = Math.max(maxLen, length);
            }
        }
        return maxLen;
    }
}
```

```
COMPLEXITY:
  Time:  O(n) — proven above
  Space: O(n) — HashSet stores all elements

VARIANTS:
  • Binary Tree Longest Consecutive Sequence (LC 298)
  • Longest Consecutive Sequence in Matrix
```

---




🔬 **Section Challenge — 15.2 PREFIX SUM + HASHMAP (Medium–Hard)**

**Challenge 1 (Trace — Who/When/What):** In `subarraySum(nums=[3,-2,1,3], k=3)` using Prefix Sum + HashMap: trace every step — what is in `prefixCount`, what is `prefixSum`, and how many subarrays are counted at each index?

<details><summary>Answer</summary>

**Who executes?** A single loop iteration per index. **When?** Count BEFORE updating the map (so we don't use the current prefix with itself). **What already exists?** `prefixCount={0:1}` at start — this is the critical sentinel representing the empty prefix.

Index 0 (num=3): prefixSum=3. Lookup 3-3=0 → map has 1 → count=1 (subarray [3]). Map={0:1, 3:1}.
Index 1 (num=-2): prefixSum=1. Lookup 1-3=-2 → 0. Map={0:1, 3:1, 1:1}.
Index 2 (num=1): prefixSum=2. Lookup 2-3=-1 → 0. Map={0:1, 3:1, 1:1, 2:1}.
Index 3 (num=3): prefixSum=5. Lookup 5-3=2 → map has 1 → count=2 (subarray [-2,1,3]). Map={0:1, 3:1, 1:1, 2:1, 5:1}.

**Final count=2.** Subarrays: `[3]` (index 0) and `[-2,1,3]` (indices 1-3).

</details>

**Challenge 2 (Debug):** A developer initializes `prefixCount` without the sentinel `{0:1}`. On `subarraySum([3], k=3)` the answer should be 1. What does their code return, and why?

<details><summary>Answer</summary>

Without `{0:1}`, at index 0: `prefixSum=3`, lookup `3-3=0` → map is empty → count stays 0. The code returns **0** instead of 1. The sentinel `{0:1}` represents the empty prefix (sum=0 before any elements). Without it, any subarray starting from index 0 that sums to `k` is invisible to the algorithm. **Rule:** Always initialize `prefixCount.put(0, 1)` — this is the #1 bug in prefix sum interviews.

</details>

## #️⃣ 15.3 Design / Advanced Hashmap


---

### #279. Insert Delete GetRandom O(1) (LC 380/381) ★ FULL SOLUTION

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

### #280. [LRU Cache](https://leetcode.com/problems/lru-cache/) (LC 146) ★ FULL SOLUTION

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

### #281. Employees Under Every Manager (GFG) — Approach

```
APPROACH: Build tree from HashMap
  1. Map<String, String> managerOf = direct manager mapping
  2. Map<String, List<String>> subordinates = reverse mapping
  3. DFS/BFS from each manager to count all transitive reports
  4. Memoize results in a HashMap

  Time: O(n), Space: O(n) — each employee processed once with memoization.
```

---

### #282. Smallest Positive Missing Number (GFG) — Approach

```
APPROACH: In-place hashing (cyclic sort variant)
  1. Place each value v in [1..n] at index v-1 (swap until correct or out of range)
  2. Scan array: first index i where arr[i] ≠ i+1 → answer is i+1
  3. If all correct → answer is n+1

  This is the SAME in-place hashing principle as #268.
  Time: O(n) — each element swapped at most once. Space: O(1).
```


---



🔬 **Section Challenge — ️⃣ 15.3 Design / Advanced Hashmap**

**Challenge 1 (Reasoning):** You insert 1000 entries into a HashMap with default capacity 16. How many resize operations happen?
<details><summary>Answer</summary>

Resize threshold = capacity × 0.75. Resizes at: 12 (16→32), 24 (32→64), 48 (64→128), 96 (128→256), 192 (256→512), 384 (512→1024). Total: 6 resizes. Each resize copies all entries to new bucket array. Pre-sizing: `new HashMap<>(1334)` (1000/0.75 ≈ 1334 → next power of 2 = 2048) avoids all resizes.
</details>

**Challenge 2 (Bug Hunt):** Two `Person` objects with same name and age. You override `equals()` to return true but not `hashCode()`. What happens when used as `HashMap` keys?
<details><summary>Answer</summary>

Both objects land in DIFFERENT buckets (different hashCodes → different bucket index). The HashMap doesn't check `equals()` across buckets — it goes straight to one bucket. So `map.get(person2)` returns NULL even though `person1.equals(person2)`. Overriding `equals` without `hashCode` violates the contract and breaks all hash-based collections. Always override both together.
</details>


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

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                     HASHMAP COMPLEXITY REFERENCE                             ║
╠═══════════════════════════════╦═══════════╦══════════╦═══════════════════════╣
║ Operation                     ║ Average   ║ Worst    ║ Notes                 ║
╠═══════════════════════════════╬═══════════╬══════════╬═══════════════════════╣
║ HashMap.get(key)              ║ O(1)      ║ O(log n) ║ Tree buckets in Java8 ║
║ HashMap.put(key, val)         ║ O(1)*     ║ O(n)     ║ *amortized (rehash)   ║
║ HashMap.remove(key)           ║ O(1)      ║ O(log n) ║ Tree buckets          ║
║ HashMap.containsKey(key)      ║ O(1)      ║ O(log n) ║                       ║
║ HashMap.containsValue(val)    ║ O(n)      ║ O(n)     ║ Full scan!            ║
║ HashSet.add/remove/contains   ║ O(1)      ║ O(log n) ║ Same as HashMap       ║
║ TreeMap.get/put/remove        ║ O(log n)  ║ O(log n) ║ Red-Black Tree        ║
║ LinkedHashMap.get/put         ║ O(1)      ║ O(log n) ║ + insertion order     ║
╠═══════════════════════════════╩═══════════╩══════════╩═══════════════════════╣
║                                                                              ║
║ PATTERN → COMPLEXITY:                                                        ║
║  Frequency Count:       O(n) time, O(n) space                                ║
║  Two-Sum (one-pass):    O(n) time, O(n) space                                ║
║  Prefix Sum + HashMap:  O(n) time, O(n) space                                ║
║  Group Anagrams:        O(NK) time, O(NK) space (count-key approach)         ║
║  Longest Consecutive:   O(n) time, O(n) space                                ║
║  LRU Cache:             O(1) per operation, O(capacity) space                ║
║  RandomizedSet:         O(1) per operation, O(n) space                       ║
║                                                                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║ WHEN TO USE WHAT:                                                            ║
║  HashMap      → unordered, O(1) average, allows null key                     ║
║  TreeMap      → sorted keys, O(log n), NavigableMap (floor/ceiling)          ║
║  LinkedHashMap→ insertion-order iteration, basis for LRU                     ║
║  HashSet      → membership test only (no values)                             ║
║  ConcurrentHM → thread-safe, no null keys/values                             ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```


---



🔬 **Section Challenge — ️⃣ Hashmap Complexity Cheat Sheet**

**Challenge 1 (Reasoning):** You insert 1000 entries into a HashMap with default capacity 16. How many resize operations happen?
<details><summary>Answer</summary>

Resize threshold = capacity × 0.75. Resizes at: 12 (16→32), 24 (32→64), 48 (64→128), 96 (128→256), 192 (256→512), 384 (512→1024). Total: 6 resizes. Each resize copies all entries to new bucket array. Pre-sizing: `new HashMap<>(1334)` (1000/0.75 ≈ 1334 → next power of 2 = 2048) avoids all resizes.
</details>

**Challenge 2 (Bug Hunt):** Two `Person` objects with same name and age. You override `equals()` to return true but not `hashCode()`. What happens when used as `HashMap` keys?
<details><summary>Answer</summary>

Both objects land in DIFFERENT buckets (different hashCodes → different bucket index). The HashMap doesn't check `equals()` across buckets — it goes straight to one bucket. So `map.get(person2)` returns NULL even though `person1.equals(person2)`. Overriding `equals` without `hashCode` violates the contract and breaks all hash-based collections. Always override both together.
</details>


## 📌 Mastery Checklist

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                     HASHMAP MASTERY CHECKLIST                                ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  FUNDAMENTALS:                                                               ║
║  □ Can explain hash function, collision resolution, load factor              ║
║  □ Can derive O(1) expected time under SUHA                                  ║
║  □ Know Java HashMap internals (buckets, treeify, rehash)                    ║
║  □ Understand hashCode/equals contract                                       ║
║                                                                              ║
║  FREQUENCY COUNTING:                                                         ║
║  □ Two Sum — one-pass complement lookup                                      ║
║  □ Group Anagrams — sort-key and count-key approaches                        ║
║  □ Find All Duplicates — in-place negation trick                             ║
║  □ Top K Frequent — bucket sort approach                                     ║
║                                                                              ║
║  PREFIX SUM + HASHMAP:                                                       ║
║  □ Subarray Sum Equals K — can trace through example                         ║
║  □ Subarrays Divisible by K — remainder grouping + Java mod fix              ║
║  □ Largest 0-Sum Subarray — first occurrence technique                       ║
║  □ Understand WHY sliding window fails with negative numbers                 ║
║                                                                              ║
║  DESIGN:                                                                     ║
║  □ RandomizedSet — ArrayList + HashMap, swap-with-last trick                 ║
║  □ LRU Cache — HashMap + Doubly Linked List from scratch                     ║
║  □ Can prove O(1) for all operations in both designs                         ║
║                                                                              ║
║  PATTERN RECOGNITION:                                                        ║
║  □ "O(n²) brute force with inner search" → HashMap makes it O(n)             ║
║  □ "Count subarrays with property X" → prefix sum + HashMap                  ║
║  □ "Group things by property" → HashMap with computed key                    ║
║  □ "Need O(1) membership test" → HashSet                                     ║
║  □ "Design O(1) everything" → combine HashMap with another structure         ║
║                                                                              ║
║  EDGE CASES:                                                                 ║
║  □ Handle null keys, empty arrays, single-element arrays                     ║
║  □ Java negative modulo: ((x % k) + k) % k                                   ║
║  □ Integer overflow in prefix sums → use long if needed                      ║
║  □ Duplicate values in input (distinguish value vs. index)                   ║
║                                                                              ║
║  SCORE: ___/20 items checked                                                 ║
║  TARGET: 18+ before moving to next section                                   ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```


---

**End of Section 15** | Problems #266–#285 (20 problems)
[Prev: Heap & Priority Queue](16_Heap.md) | [Index](../00_MASTER_INDEX.md) | [Next: Bit Manipulation](18_BitManipulation.md)


---

---

## 🏆 Competitive Programming — Codeforces Problems

| Problem | Link | Technique | Difficulty |
|---|---|---|---|
| Primes or Palindromes | [CF 551B](https://codeforces.com/problemset/problem/551/B) | HashMap + sieve | ⭐ Easy |
| Berland Sequence | [CF 1015D](https://codeforces.com/problemset/problem/1015/D) | Frequency map | ⭐⭐ Medium |
| Colorful Graph | [CF 246D](https://codeforces.com/problemset/problem/246/D) | HashMap grouping | ⭐⭐ Medium |
| New Year and Counting | [CF 750C](https://codeforces.com/problemset/problem/750/C) | HashMap + prefix sum | ⭐⭐ Medium |
| Ants | [CF 6C](https://codeforces.com/problemset/problem/6/C) | HashMap + sorting | ⭐⭐ Medium |
| Vanya and Triangles | [CF 552C](https://codeforces.com/problemset/problem/552/C) | HashMap + geometry | ⭐⭐⭐ Hard |

---




## 🌍 Real-World Applications of HashMap & Hashing

| Technique | Real-World System | How It's Used |
|---|---|---|
| **Two-Sum complement lookup** | Financial fraud detection | Quickly find if a pair of transactions sums to a laundering target |
| **Frequency map** | Log analysis (Splunk, ELK) | Count occurrences of error codes across millions of log lines |
| **Prefix sum + HashMap** | Analytics dashboards | Range sum queries on time-series data without scanning from scratch |
| **Grouping (anagram-style)** | Duplicate file finder | SHA-256 hash each file → group by hash → identical content detected |
| **HashSet visited** | Web crawler (Googlebot) | Track already-crawled URLs in O(1) to avoid loops |
| **Consistent hashing** | Distributed systems (DynamoDB, Cassandra) | Assign data to servers; add/remove servers with minimal reshuffling |

```
🔥 CONSISTENT HASHING — THE REAL DEAL:
   Regular modulo hash: server = hash(key) % N
   Problem: Add a server → 90%+ of keys relocate!

   Consistent hash ring: keys AND servers on circular ring
   Key goes to nearest server clockwise → only K/N keys move on add/remove
   "Used by: Amazon DynamoDB, Cassandra, Discord CDN, Redis Cluster"
```

