> **Navigation**: [⬅ Mock Interviews](09_Mock_Interview_Simulations.md) | [📚 Index](00_INDEX.md) | [Next: LinkedList, Stack, Queue, Heap ➡](11_DSA_Problems_LinkedList_Stack_Queue_Heap.md)

# File 10 — DSA Problems: Arrays, Strings & Hashing

## The 5W+H Interview Framework for Every Problem

> **Don't memorize solutions. Understand the LOGIC, then the code writes itself.**

For every problem below, we answer:
- **WHAT** is this problem really asking? (Strip away the story)
- **WHY** does this approach work? (The mathematical/logical insight)
- **WHEN** do you recognize this pattern? (The trigger signals)
- **WHERE** does this appear? (Company interviews, real systems)
- **WHO** asks this? (Difficulty level, target companies)
- **HOW** do you think through it → build logic → translate to code?

---

## ARRAYS

---

### Problem 1: Two Sum

**WHAT**: Given an array and a target, find two indices whose values add to target.

**WHY this approach works**:
- Brute force checks every pair → O(n²). But if I know I need `target - current`, I can ask: "Have I seen this complement before?"
- A HashMap stores what we've already visited. Each element is visited once → O(n).

**WHEN to recognize**: "Find two things that combine to X" → HashMap complement lookup.

**WHERE**: Every company. Often the first question to warm up.

**WHO**: Easy. Asked everywhere from startups to FAANG.

**HOW — The Logic Chain**:
```
Step 1: For each number, compute complement = target - number
Step 2: Ask: "Is complement already in my map?"
        → YES: Return [map.get(complement), currentIndex]
        → NO:  Store number → index in map
Step 3: Continue until found
```

**How to translate this logic to code**:
- "Store what we've seen" → `HashMap<Integer, Integer>` (value → index)
- "For each number" → single `for` loop
- "Check if complement exists" → `map.containsKey(complement)`
- "Store it" → `map.put(nums[i], i)`

**Interview narration**: "I want to avoid O(n²). If I know the complement for each number, I can look it up in O(1) using a HashMap. I walk through the array once — for each element, I check if its complement is already stored. If yes, I found my pair. If no, I store this element for future lookups."

**Follow-up traps**:
- "What if there are duplicates?" → HashMap handles it because we check BEFORE inserting
- "What if array is sorted?" → Two pointers is O(1) space
- "Can you do it without extra space?" → Only if sorted (two pointers)

---

### Problem 2: Best Time to Buy and Sell Stock

**WHAT**: Find the maximum difference between a later element and an earlier element.

**WHY this approach works**:
- You want max(prices[j] - prices[i]) where j > i
- Track the minimum price seen so far. At each day, the best profit is `today - min_so_far`
- This works because the minimum price can only help future days, never hurt them

**WHEN to recognize**: "Maximum difference with order constraint" → track running minimum/maximum.

**WHERE**: Amazon, Facebook, Goldman Sachs — very common warm-up.

**HOW — The Logic Chain**:
```
Step 1: Initialize minPrice = first element, maxProfit = 0
Step 2: For each price after the first:
        → profit = price - minPrice
        → maxProfit = max(maxProfit, profit)  
        → minPrice = min(minPrice, price)
Step 3: Return maxProfit
```

**How to translate to code**:
- "Track minimum so far" → one variable `minPrice`, updated with `Math.min()`
- "Track best profit" → one variable `maxProfit`, updated with `Math.max()`
- "For each price" → single loop from index 1

**The logic insight**: We never need to go backwards. At any point, the best buy is the cheapest we've seen before. So we just maintain that and calculate profit at each step.

**Follow-up**: "What about multiple transactions?" → That becomes DP (state machine: hold/not-hold on each day).

---

### Problem 3: Contains Duplicate

**WHAT**: Does any value appear more than once?

**WHY**: A HashSet stores unique values. If adding a value fails (already exists), we found a duplicate. O(n) time, O(n) space.

**WHEN**: "Find if something repeats" → HashSet.

**HOW — The Logic Chain**:
```
Step 1: Create empty set
Step 2: For each number:
        → If set already contains it → return true
        → Else add to set
Step 3: Return false (no duplicates found)
```

**Translation**: `HashSet.add()` returns false if element exists. One loop, one set.

**Variant — Contains Duplicate II**: "Within distance k" → Use a sliding window HashSet of size k. When set exceeds k elements, remove the oldest.

**Variant — Contains Duplicate III**: "Within distance k and value difference ≤ t" → Bucket sort technique. Divide values into buckets of size t+1. Check current bucket and neighbors.

---

### Problem 4: Product of Array Except Self

**WHAT**: For each index, return the product of ALL other elements.

**WHY this approach works**:
- Can't use division (what if there's a zero?)
- Key insight: product except self = (product of everything LEFT) × (product of everything RIGHT)
- Build prefix products going left→right, then suffix products going right→left

**WHEN**: "Compute something involving all OTHER elements" → prefix/suffix decomposition.

**WHERE**: Amazon, Microsoft, Google — tests array manipulation thinking.

**HOW — The Logic Chain**:
```
Step 1: Build LEFT products array
        left[0] = 1 (nothing to the left of first element)
        left[i] = left[i-1] * nums[i-1]
        
Step 2: Build RIGHT products (from right to left)
        right[n-1] = 1 (nothing to the right of last element)
        right[i] = right[i+1] * nums[i+1]
        
Step 3: Answer[i] = left[i] * right[i]
```

**Space optimization logic**: "Can I avoid the extra right array?" → Yes. Use the output array for left products, then multiply in-place going right→left with a running product variable.

**Interview narration**: "I decompose each element's answer into what's to its left times what's to its right. I build prefix products in one pass, then multiply by suffix products in a reverse pass. This avoids division entirely."

---

### Problem 5: Maximum Subarray (Kadane's Algorithm)

**WHAT**: Find the contiguous subarray with the largest sum.

**WHY Kadane's works**:
- At each position, you have a choice: either EXTEND the previous subarray, or START FRESH from here
- If the running sum becomes negative, it can only hurt future elements → reset to 0 (or current element)
- This greedy choice is locally AND globally optimal

**WHEN**: "Maximum/minimum contiguous subarray" → Kadane's algorithm.

**HOW — The Logic Chain**:
```
Decision at each element:
  currentSum = max(nums[i], currentSum + nums[i])
  
  Translation: "Is it better to include what came before, or start over?"
  
  maxSum = max(maxSum, currentSum)
```

**The deep insight**: If `currentSum` drops below `nums[i]` alone, the past is dragging us down. Cut it off. Start fresh. This greedy decision works because if a subarray has a negative prefix, removing it always improves the sum.

**Variant — Circular**: Array wraps around. Answer = max(normal Kadane result, totalSum - minSubarraySum). Because the maximum circular subarray = total minus the minimum non-circular subarray.

**Variant — 2D Maximum Submatrix**: Fix top and bottom row, collapse columns into 1D array, apply Kadane's. O(n²·m) for n rows, m columns.

---

### Problem 6: Merge Intervals

**WHAT**: Given overlapping intervals, merge them into non-overlapping ones.

**WHY sorting works**:
- After sorting by start time, overlapping intervals will be ADJACENT
- Two intervals overlap if `current.start ≤ previous.end`
- When they overlap, merge by extending end to `max(prev.end, curr.end)`

**WHEN**: "Intervals, ranges, meeting rooms, schedules" → Sort by start + greedy merge.

**HOW — The Logic Chain**:
```
Step 1: Sort intervals by start time
Step 2: Take first interval as "current"
Step 3: For each next interval:
        → If next.start ≤ current.end → they overlap
          → Merge: current.end = max(current.end, next.end)
        → Else → no overlap
          → Save current to result, move to next
Step 4: Don't forget to add the last "current" to result
```

**Translation to code**:
- "Sort by start" → `Arrays.sort(intervals, (a, b) -> a[0] - b[0])`
- "Current interval tracking" → track `start` and `end` variables or use a list and modify last element
- "Save to result" → `LinkedList<int[]>` so we can peek at the last element

**Common mistake in interviews**: Forgetting to add the last interval after the loop ends.

---

### Problem 7: Majority Element

**WHAT**: Find the element that appears more than n/2 times.

**WHY Boyer-Moore Voting works**:
- Imagine an election: the majority candidate has MORE votes than ALL others combined
- If we "cancel out" different votes, the majority will always survive
- Keep a candidate and a count. Same element → count++. Different → count--. When count = 0, switch candidate.

**WHEN**: "Element appearing more than n/2 (or n/3) times" → Boyer-Moore Voting.

**HOW — The Logic Chain**:
```
Step 1: candidate = first element, count = 1
Step 2: For each remaining element:
        → Same as candidate → count++
        → Different → count--
        → If count == 0 → candidate = current, count = 1
Step 3: candidate is the answer (problem guarantees majority exists)
```

**Why this is O(1) space**: No HashMap needed. The voting mechanism itself is the data structure.

**Follow-up — Majority Element II (n/3 times)**: There can be AT MOST 2 such elements. Use 2 candidates, 2 counters. Same idea. Then verify both in a second pass.

---

### Problem 8: Move Zeroes

**WHAT**: Move all zeroes to the end while maintaining order of non-zero elements.

**WHY the partition approach works**:
- Use a "write pointer" that tracks where the next non-zero should go
- Read pointer scans forward. When it finds non-zero, write it at the write position
- After the loop, fill remaining positions with zeroes

**WHEN**: "Rearrange elements by condition in-place" → Two-pointer partition.

**HOW — The Logic Chain**:
```
Step 1: writePointer = 0
Step 2: For each element (readPointer):
        → If element ≠ 0:
          → swap(nums[writePointer], nums[readPointer])
          → writePointer++
Step 3: All zeroes are naturally pushed to the end
```

**The insight**: The swap is better than "write then fill zeroes" because it handles everything in one pass and is more elegant in interviews.

---

### Problem 9: Rotate Array

**WHAT**: Rotate array to the right by k positions.

**WHY the reversal trick works**:
- Rotating right by k positions = take last k elements and put them first
- Reverse entire array → the last k are now first (but reversed internally)
- Reverse first k → they're correct now
- Reverse remaining n-k → they're correct too

**HOW — The Logic Chain**:
```
Example: [1,2,3,4,5,6,7], k=3

Step 1: k = k % n (handle k > n)        → k = 3
Step 2: Reverse entire array             → [7,6,5,4,3,2,1]
Step 3: Reverse first k elements         → [5,6,7,4,3,2,1]
Step 4: Reverse remaining n-k elements   → [5,6,7,1,2,3,4] ✓
```

**Translation**: Write a `reverse(arr, start, end)` helper, then call it 3 times. O(n) time, O(1) space.

**Alternative logic**: Use a temporary array — copy to `(i+k) % n` positions. O(n) space but clearer.

---

### Problem 10: First Missing Positive

**WHAT**: Find the smallest positive integer not in the array. Must be O(n) time, O(1) space.

**WHY index-as-hash works**:
- The answer must be in range [1, n+1] for an array of size n
- Use the array ITSELF as a hash table: place each number at index (number-1)
- After placement, the first position where `nums[i] ≠ i+1` gives the answer

**WHEN**: "Find missing number" + "O(1) space constraint" → Cyclic sort / index-as-hash.

**HOW — The Logic Chain**:
```
Step 1: For each position, while nums[i] is in range [1, n] 
        and nums[i] ≠ nums[nums[i]-1]:
        → Swap nums[i] into its correct position (nums[i]-1)
        
Step 2: Scan array: first i where nums[i] ≠ i+1 → return i+1

Step 3: If all correct → return n+1
```

**The logic insight**: We're doing cyclic sort restricted to positive integers within range. Each element is swapped at most once, so it's O(n) total despite the while loop inside the for loop.

**Interview trap**: "Won't the nested swap loop make it O(n²)?" → No. Each element moves to its final position at most once → amortized O(n).

---

## STRINGS

---

### Problem 11: Valid Anagram

**WHAT**: Are two strings anagrams (same characters, different order)?

**WHY frequency counting works**:
- Two strings are anagrams if and only if they have IDENTICAL character frequencies
- Count characters in first string, subtract for second string, check all zero

**WHEN**: "Compare character composition" → Frequency array/map.

**HOW — The Logic Chain**:
```
Step 1: If lengths differ → false immediately
Step 2: Create frequency array of size 26 (for lowercase a-z)
Step 3: For each char in s1: freq[char - 'a']++
Step 4: For each char in s2: freq[char - 'a']--
Step 5: If all frequencies are 0 → true
```

**Translation**: `int[] freq = new int[26]` is more efficient than HashMap for known character sets.

**Follow-up**: "What if inputs contain Unicode?" → Use HashMap<Character, Integer> instead of fixed array.

**Related**: Group Anagrams → sort each string as key, or use frequency signature as key.

---

### Problem 12: Longest Substring Without Repeating Characters

**WHAT**: Find length of longest substring with all unique characters.

**WHY sliding window works**:
- We need a CONTIGUOUS range (substring) → window
- Expand right to add characters. When duplicate found, shrink left until window is valid again
- Track characters in window using a Set or Map

**WHEN**: "Longest/shortest substring with condition" → Sliding window.

**HOW — The Logic Chain**:
```
Step 1: left = 0, maxLen = 0, Set or Map for window characters
Step 2: For each right pointer:
        → While s[right] is in the set:
          → Remove s[left] from set, left++
        → Add s[right] to set
        → maxLen = max(maxLen, right - left + 1)
```

**Optimization logic**: Instead of shrinking one by one, use a Map storing last index of each character. When duplicate found, jump `left` directly to `map.get(char) + 1`. This avoids the inner while loop.

**Interview narration**: "I use a sliding window. I expand the right boundary and track characters in a set. When I encounter a duplicate, I shrink from the left until the window is valid. The key optimization is storing the last index of each character so I can jump left directly instead of shrinking one by one."

---

### Problem 13: Longest Palindromic Substring

**WHAT**: Find the longest substring that reads the same forwards and backwards.

**WHY expand-around-center works**:
- A palindrome mirrors around its center
- There are 2n-1 possible centers (n single characters + n-1 gaps between characters for even-length palindromes)
- From each center, expand outward while characters match

**WHEN**: "Palindrome" + "substring" → Expand around center. "Palindrome" + "subsequence" → DP.

**HOW — The Logic Chain**:
```
Step 1: For each possible center (i = 0 to n-1):
        → Expand for odd-length palindrome: center = (i, i)
        → Expand for even-length palindrome: center = (i, i+1)
Step 2: expand(s, left, right):
        → While left >= 0 AND right < n AND s[left] == s[right]:
          → left--, right++
        → Return right - left - 1 (length of palindrome found)
Step 3: Track the longest and its start/end indices
```

**Why not DP?**: DP uses O(n²) space. Expand-around-center uses O(1) space with same O(n²) time. In interviews, the expand approach is preferred because it's more intuitive and space-efficient.

**Manacher's Algorithm**: O(n) solution exists but is rarely expected in interviews. Mention it to show awareness: "I know Manacher's can do this in O(n), but for interview purposes, the expand-around-center approach is clean and O(n²)."

---

### Problem 14: String to Integer (atoi)

**WHAT**: Parse a string into an integer, handling whitespace, signs, overflow.

**WHY edge-case handling is the real challenge**:
- The algorithm is trivial: digit by digit, multiply result by 10 and add
- The interview tests: can you handle ALL edge cases systematically?

**WHEN**: "Parse/convert with edge cases" → Systematic state machine thinking.

**HOW — The Logic Chain**:
```
Step 1: skip leading whitespace
Step 2: Check for +/- sign (default positive)
Step 3: Process digits one by one:
        → result = result * 10 + digit
        → BEFORE the multiply, check overflow:
          → if result > MAX_VALUE/10, or 
            result == MAX_VALUE/10 and digit > 7 → overflow
Step 4: Apply sign, return result (clamped to INT range)
```

**The overflow check logic**: You check BEFORE `result * 10 + digit` would overflow. Compare against `Integer.MAX_VALUE / 10` to predict if the next operation would exceed bounds.

**Interview tip**: Draw out the state machine on the whiteboard: START → WHITESPACE → SIGN → DIGITS → END. This impresses interviewers because it shows systematic thinking.

---

### Problem 15: Group Anagrams

**WHAT**: Group strings that are anagrams of each other.

**WHY sorted-string-as-key works**:
- All anagrams of a string produce the same sorted string
- "eat", "tea", "ate" → all sort to "aet"
- Use the sorted string as a HashMap key, group all original strings

**WHEN**: "Group by some equivalence" → Define a canonical key, HashMap grouping.

**HOW — The Logic Chain**:
```
Step 1: Create HashMap<String, List<String>>
Step 2: For each string:
        → Sort its characters → this is the key
        → Add original string to the list for this key
Step 3: Return all values from the map
```

**Alternative key (faster)**: Instead of sorting (O(k log k) per string), use a frequency count as key: `"#1#0#0#...#0#1#0..."` → character count signature in O(k) per string.

**Translation**: `char[] arr = s.toCharArray(); Arrays.sort(arr); String key = new String(arr);`

---

### Problem 16: Longest Consecutive Sequence

**WHAT**: Find the length of the longest consecutive elements sequence (O(n) required).

**WHY HashSet works**:
- Put all elements in a set for O(1) lookup
- Key insight: only START counting from the BEGINNING of a sequence
- An element is the beginning if `element - 1` is NOT in the set

**WHEN**: "Consecutive sequence" + "O(n) time" → HashSet + start-of-sequence detection.

**HOW — The Logic Chain**:
```
Step 1: Put all numbers in a HashSet
Step 2: For each number:
        → If (number - 1) NOT in set → this is a sequence start
          → Count consecutive: number, number+1, number+2... while in set
          → Update maxLength
        → If (number - 1) IS in set → skip (not a start, will be counted later)
```

**Why O(n) and not O(n²)**: The "skip" step is crucial. Each element is the start of exactly one sequence or skipped entirely. Every element is part of exactly one count chain. Total work = O(n).

**Interview narration**: "The trick is recognizing that I should only start counting from the beginning of a sequence. I detect the beginning by checking if num-1 is absent. This ensures each element participates in counting at most once."

---

## HASHING (Advanced)

---

### Problem 17: Subarray Sum Equals K

**WHAT**: Count subarrays whose elements sum to k.

**WHY prefix sum + HashMap works**:
- prefixSum[j] - prefixSum[i] = sum of subarray [i+1...j]
- We need: prefixSum[j] - k = prefixSum[i] for some earlier i
- HashMap stores how many times each prefix sum has occurred

**WHEN**: "Count/find subarrays with exact sum" → Prefix sum + HashMap of frequencies.

**HOW — The Logic Chain**:
```
Step 1: Initialize map = {0: 1} (empty prefix has sum 0, seen once)
Step 2: runningSum = 0, count = 0
Step 3: For each element:
        → runningSum += element
        → complement = runningSum - k
        → count += map.getOrDefault(complement, 0)
        → map.put(runningSum, map.getOrDefault(runningSum, 0) + 1)
```

**The critical insight**: `map = {0: 1}` initialization. Without it, you miss subarrays that start from index 0.

**Why HashSet doesn't work**: We need COUNT (multiple subarrays can have same prefix sum).

**Related problems using same technique**: 
- Subarray sum divisible by K → prefix sum mod K
- Continuous Subarray Sum (multiple of k) → if same prefix mod appears twice
- Path Sum III in a tree → same idea but on root-to-node paths

---

### Problem 18: Top K Frequent Elements

**WHAT**: Find the k most frequent elements.

**WHY bucket sort achieves O(n)**:
- Count frequencies first (HashMap) → O(n)
- Create buckets indexed by frequency: bucket[i] = elements appearing i times
- Walk buckets from high to low, collect k elements

**WHEN**: "Top K" + "frequency" → Bucket sort (O(n)) or Heap (O(n log k)).

**HOW — The Logic Chain (Bucket Sort approach)**:
```
Step 1: Count frequencies: HashMap<Integer, Integer>
Step 2: Create bucket array of size n+1
        → bucket[freq] = list of elements with that frequency
Step 3: Walk from bucket[n] down to bucket[1]:
        → Collect elements until you have k
```

**Alternative — Heap approach**:
```
Step 1: Count frequencies (HashMap)
Step 2: Use Min-Heap of size k
        → For each entry: add to heap
        → If heap size > k: remove min (least frequent so far)
Step 3: Heap contains top k elements
```

**When to use which**:
- Bucket sort: O(n) time, O(n) space — best when k is close to n
- Heap: O(n log k) time — best when k << n
- QuickSelect: O(n) average — best for exact partition

---

### Problem 19: Valid Sudoku

**WHAT**: Check if a 9×9 Sudoku board is valid (no repeats in rows, columns, 3×3 boxes).

**WHY three-set tracking works**:
- Three conditions must hold simultaneously: no repeats per row, per column, per box
- Track with 3 sets: `rows[9]`, `cols[9]`, `boxes[9]`
- For box index: `boxIndex = (row/3) * 3 + (col/3)`

**WHEN**: "Validate against multiple constraints simultaneously" → Multiple tracking sets.

**HOW — The Logic Chain**:
```
Step 1: Create 9 sets for rows, 9 for columns, 9 for boxes
Step 2: Scan each cell (i, j):
        → Skip if empty ('.')
        → Compute boxIndex = (i/3)*3 + (j/3)
        → If value in rows[i] OR cols[j] OR boxes[boxIndex] → invalid
        → Else add value to all three sets
Step 3: If we finish without conflict → valid
```

**Box formula insight**: The 9 boxes are numbered 0-8. Row 0-2 contributes to boxes 0,1,2. Row 3-5 to boxes 3,4,5. The formula `(i/3)*3 + (j/3)` maps any cell to its box index.

---

### Problem 20: Encode and Decode Strings

**WHAT**: Design encode/decode that handles ANY characters in strings (including delimiters).

**WHY length-prefix encoding works**:
- You can't use a delimiter because it might appear in the strings
- Encode as: `len#string` for each string
- When decoding, read the number, then read exactly that many characters

**WHEN**: "Serialize/deserialize with arbitrary content" → Length-prefix encoding.

**HOW — The Logic Chain**:
```
Encode:
  For each string: write length + "#" + string
  "hello" → "5#hello"
  ["hello","world"] → "5#hello5#world"

Decode:
  Start at position 0
  Read digits until "#" → that's the length
  Read next 'length' characters → that's the string
  Continue until end
```

**Why this is tricky in interviews**: Most candidates try separator-based approaches (join with comma/pipe) and get stuck on edge cases. Length-prefix is bulletproof.

---

## MASTER PROBLEM MAP — Arrays, Strings, Hashing

| # | Problem | Core Logic | Pattern | Key Insight |
|---|---------|------------|---------|-------------|
| 1 | Two Sum | complement = target - num | HashMap Lookup | Check before insert |
| 2 | Buy/Sell Stock | track running min | Greedy/Running Min | Min so far is best possible buy |
| 3 | Contains Duplicate | membership check | HashSet | Set.add() returns false = duplicate |
| 4 | Product Except Self | prefix × suffix | Prefix/Suffix | Decompose into left and right products |
| 5 | Maximum Subarray | extend or restart | Kadane's | Negative prefix always hurts |
| 6 | Merge Intervals | sort + greedy merge | Sort + Scan | Overlapping iff next.start ≤ curr.end |
| 7 | Majority Element | cancel votes | Boyer-Moore | Majority survives all cancellations |
| 8 | Move Zeroes | write pointer | Partition | Swap maintains relative order |
| 9 | Rotate Array | triple reversal | Reversal Trick | Reverse all, reverse halves |
| 10 | First Missing Positive | index as hash | Cyclic Sort | Answer in [1, n+1], use array as map |
| 11 | Valid Anagram | frequency match | Freq Array | int[26] is faster than HashMap |
| 12 | Longest No-Repeat Substr | shrink when dup | Sliding Window | Jump left using last-index map |
| 13 | Longest Palindromic Substr | expand from center | Center Expansion | 2n-1 centers, O(1) space |
| 14 | String to Integer | state machine | Edge Cases | Overflow check BEFORE multiply |
| 15 | Group Anagrams | canonical key | HashMap Grouping | Sorted string = group key |
| 16 | Longest Consecutive | start detection | HashSet | Only count from sequence start |
| 17 | Subarray Sum = K | prefix sum freq | PrefixSum + Map | Initialize map with {0: 1} |
| 18 | Top K Frequent | bucket by freq | Bucket Sort | O(n) via freq-indexed buckets |
| 19 | Valid Sudoku | 3 constraint sets | Multi-Set Track | Box = (r/3)*3 + (c/3) |
| 20 | Encode/Decode Strings | length prefix | Serialization | "len#str" handles all chars |

---

## Interview Quick-Fire: "What Would You Do If..."

**Q: "Array is sorted?"** → Binary Search or Two Pointers first. Don't use HashMap.

**Q: "Must be O(1) space?"** → In-place techniques: swap, reversal, bit manipulation, cyclic sort.

**Q: "Subarray vs subsequence?"** → Subarray = contiguous (sliding window, prefix sum). Subsequence = non-contiguous (DP, two pointers on sorted).

**Q: "Find vs Count?"** → Find = stop at first match. Count = accumulate all matches (prefix sum with HashMap for count).

**Q: "Deal with negative numbers?"** → Kadane's still works (take max of extend/restart). Prefix sum still works. But sliding window for positive-sum won't work — need prefix sum approach.

---

> **Navigation**: [⬅ Mock Interviews](09_Mock_Interview_Simulations.md) | [📚 Index](00_INDEX.md) | [Next: LinkedList, Stack, Queue, Heap ➡](11_DSA_Problems_LinkedList_Stack_Queue_Heap.md)
