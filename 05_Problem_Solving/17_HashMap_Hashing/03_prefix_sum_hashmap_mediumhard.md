# 15.2 PREFIX SUM + HASHMAP (Medium–Hard)

> **Navigation**: [← 15.1 FREQUENCY COUNTING (Easy–Medium)](02_frequency_counting_easymedium.md) | [Chapter overview](../17_HashMap_Hashing.md) | [15.3 Design / Advanced Hashmap →](04_design_advanced_hashmap.md)
> Page 3 of 4 in **HashMap Hashing**


**This is the single most important pattern in this section.**
Master #274 and #275 — they appear in interviews constantly.

---

## #274. [Subarray Sum Equals K](https://leetcode.com/problems/subarray-sum-equals-k/) (LC 560) ★ FULL SOLUTION

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

## #275. [Subarray Sums Divisible by K](https://leetcode.com/problems/subarray-sums-divisible-by-k/) (LC 974) ★ FULL SOLUTION

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

## #276. Largest Subarray with 0 Sum (GFG) ★ FULL SOLUTION

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

## #277. Check Array Divisible into Pairs (sum div K) (GFG) — Approach

```
APPROACH: Remainder frequency matching
  1. Compute remainder of each element: r = ((arr[i] % k) + k) % k
  2. For remainder 0: frequency must be even (pairs among themselves)
  3. For remainder r and k-r: freq[r] must equal freq[k-r]
  4. If k is even: freq[k/2] must be even

  Time: O(n), Space: O(k)
```

---

## #278. [Longest Consecutive Sequence](https://leetcode.com/problems/longest-consecutive-sequence/) (LC 128) ★ FULL SOLUTION

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

- Index 0 (num=3): prefixSum=3. Lookup 3-3=0 → map has 1 → count=1 (subarray [3]). Map={0:1, 3:1}.
- Index 1 (num=-2): prefixSum=1. Lookup 1-3=-2 → 0. Map={0:1, 3:1, 1:1}.
- Index 2 (num=1): prefixSum=2. Lookup 2-3=-1 → 0. Map={0:1, 3:1, 1:1, 2:1}.
- Index 3 (num=3): prefixSum=5. Lookup 5-3=2 → map has 1 → count=2 (subarray [-2,1,3]). Map={0:1, 3:1, 1:1, 2:1, 5:1}.

**Final count=2.** Subarrays: `[3]` (index 0) and `[-2,1,3]` (indices 1-3).

</details>

**Challenge 2 (Debug):** A developer initializes `prefixCount` without the sentinel `{0:1}`. On `subarraySum([3], k=3)` the answer should be 1. What does their code return, and why?

<details><summary>Answer</summary>

Without `{0:1}`, at index 0: `prefixSum=3`, lookup `3-3=0` → map is empty → count stays 0. The code returns **0** instead of 1. The sentinel `{0:1}` represents the empty prefix (sum=0 before any elements). Without it, any subarray starting from index 0 that sums to `k` is invisible to the algorithm. **Rule:** Always initialize `prefixCount.put(0, 1)` — this is the #1 bug in prefix sum interviews.

</details>

---

[← 15.1 FREQUENCY COUNTING (Easy–Medium)](02_frequency_counting_easymedium.md) | [Chapter overview](../17_HashMap_Hashing.md) | [15.3 Design / Advanced Hashmap →](04_design_advanced_hashmap.md)
