# 15.1 FREQUENCY COUNTING (Easy–Medium)

> **Navigation**: [← WHY HashMap — MIT/KTH STYLE](01_why_hashmap_mit_kth_style.md) | [Chapter overview](../17_HashMap_Hashing.md) | [15.2 PREFIX SUM + HASHMAP (Medium–Hard) →](03_prefix_sum_hashmap_mediumhard.md)
> Page 2 of 4 in **HashMap Hashing**


---

## #266. [Two Sum](https://leetcode.com/problems/two-sum/) (LC 1) ★ FULL SOLUTION

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

## #267. [Group Anagrams](https://leetcode.com/problems/group-anagrams/) (LC 49) ★ FULL SOLUTION

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

## #268. [Find All Duplicates in Array](https://leetcode.com/problems/find-all-duplicates-in-an-array/) (LC 442) ★ FULL SOLUTION

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

## #269. [Top K Frequent Elements](https://leetcode.com/problems/top-k-frequent-elements/) (LC 347) — Approach

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

## #270. [Missing Number](https://leetcode.com/problems/missing-number/) (LC 268) — Approach

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

## #271. [Happy Number](https://leetcode.com/problems/happy-number/) (LC 202) — Approach

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

## #272. Print All Duplicates in String (GFG) — Approach

```
APPROACH: Frequency count with int[256] or HashMap
  1. Count frequency of each character.
  2. Print characters with frequency > 1.
  Time: O(n), Space: O(1) — fixed alphabet size.
```

---

## #273. [Longest Common Prefix](https://leetcode.com/problems/longest-common-prefix/) (LC 14) — Approach

```
APPROACH: Vertical scan (no HashMap needed)
  1. Compare characters column by column across all strings.
  2. Stop at first mismatch or when any string is exhausted.
  Time: O(S) where S = sum of all string lengths. Space: O(1).

  Note: This is listed here because students often try HashMap — unnecessary.
  The vertical scan is simpler and equally optimal.
```

---

[← WHY HashMap — MIT/KTH STYLE](01_why_hashmap_mit_kth_style.md) | [Chapter overview](../17_HashMap_Hashing.md) | [15.2 PREFIX SUM + HASHMAP (Medium–Hard) →](03_prefix_sum_hashmap_mediumhard.md)
