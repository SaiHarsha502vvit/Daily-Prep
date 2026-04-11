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






> 🔬 **Section Challenge — STRINGS**
>
> **Challenge 1 (Reasoning):** `ExecutorService.submit(task)` — the task throws a `RuntimeException`. Nobody calls `future.get()`. What happens to the exception?
> <details><summary>Answer</summary>
>
> It's silently swallowed. The exception is stored in the `Future` object. Without `future.get()` or `.whenComplete()`, no one ever sees it. The thread pool thread resets and picks up the next task as if nothing happened. This is one of the most dangerous production bugs. Fix: always attach `future.whenComplete((r,ex) -> { if(ex!=null) log.error("Task failed",ex); })` or use `execute()` + `UncaughtExceptionHandler`.
> </details>
>

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






> 🔬 **Section Challenge — HASHING (Advanced)**
>
> **Challenge 1 (Reasoning):** `ExecutorService.submit(task)` — the task throws a `RuntimeException`. Nobody calls `future.get()`. What happens to the exception?
> <details><summary>Answer</summary>
>
> It's silently swallowed. The exception is stored in the `Future` object. Without `future.get()` or `.whenComplete()`, no one ever sees it. The thread pool thread resets and picks up the next task as if nothing happened. This is one of the most dangerous production bugs. Fix: always attach `future.whenComplete((r,ex) -> { if(ex!=null) log.error("Task failed",ex); })` or use `execute()` + `UncaughtExceptionHandler`.
> </details>
>

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






> 🔬 **Section Challenge — MASTER PROBLEM MAP — Arrays, Strings, Hashing**
>
> **Challenge 1 (Reasoning):** `ExecutorService.submit(task)` — the task throws a `RuntimeException`. Nobody calls `future.get()`. What happens to the exception?
> <details><summary>Answer</summary>
>
> It's silently swallowed. The exception is stored in the `Future` object. Without `future.get()` or `.whenComplete()`, no one ever sees it. The thread pool thread resets and picks up the next task as if nothing happened. This is one of the most dangerous production bugs. Fix: always attach `future.whenComplete((r,ex) -> { if(ex!=null) log.error("Task failed",ex); })` or use `execute()` + `UncaughtExceptionHandler`.
> </details>
>

## Interview Quick-Fire: "What Would You Do If..."

**Q: "Array is sorted?"** → Binary Search or Two Pointers first. Don't use HashMap.

**Q: "Must be O(1) space?"** → In-place techniques: swap, reversal, bit manipulation, cyclic sort.

**Q: "Subarray vs subsequence?"** → Subarray = contiguous (sliding window, prefix sum). Subsequence = non-contiguous (DP, two pointers on sorted).

**Q: "Find vs Count?"** → Find = stop at first match. Count = accumulate all matches (prefix sum with HashMap for count).

**Q: "Deal with negative numbers?"** → Kadane's still works (take max of extend/restart). Prefix sum still works. But sliding window for positive-sum won't work — need prefix sum approach.

---


---

## 🏋️ Practice & Interview Questions — Arrays

> Attempt each before looking at the answer. Time yourself.

### Predict / Trace
**Q1.** What is the output? `int[] a = {1,2,3}; int[] b = a; b[0] = 99; System.out.println(a[0]);`
<details><summary>Answer</summary>

`99` — arrays are objects; `b = a` copies the **reference**, not the data. Both point to the same array.
</details>

**Q2.** What is the time complexity of inserting at index 0 of an array of size N?
<details><summary>Answer</summary>

O(N) — every element must shift right by one position.
</details>

**Q3.** Given sorted array `[1,3,5,7,9]`, binary search for 6 — trace the mid values.
<details><summary>Answer</summary>

lo=0,hi=4 → mid=2 (value=5) → lo=3,hi=4 → mid=3 (value=7) → lo=3,hi=2 → NOT FOUND
</details>

### LeetCode / Coding
**Q4.** ⭐ Two Sum — find indices of two numbers that add to target. O(N) solution.
<details><summary>Solution</summary>

```java
Map<Integer,Integer> map = new HashMap<>();
for(int i=0;i<nums.length;i++){
    int comp = target - nums[i];
    if(map.containsKey(comp)) return new int[]{map.get(comp), i};
    map.put(nums[i], i);
}
```
</details>

**Q5.** ⭐ Maximum Subarray (Kadane's Algorithm). Write the O(N) solution.
<details><summary>Solution</summary>

```java
int maxSum = nums[0], curr = nums[0];
for(int i=1;i<nums.length;i++){
    curr = Math.max(nums[i], curr + nums[i]);
    maxSum = Math.max(maxSum, curr);
}
return maxSum;
```
</details>

**Q6.** ⭐ Best Time to Buy and Sell Stock — single pass O(N).
<details><summary>Solution</summary>

```java
int minPrice = Integer.MAX_VALUE, maxProfit = 0;
for(int p : prices){
    minPrice = Math.min(minPrice, p);
    maxProfit = Math.max(maxProfit, p - minPrice);
}
return maxProfit;
```
</details>

**Q7.** ⭐ Product of Array Except Self — without division, O(N).
<details><summary>Solution</summary>

```java
int[] res = new int[n];
res[0] = 1;
for(int i=1;i<n;i++) res[i] = res[i-1] * nums[i-1];
int right = 1;
for(int i=n-1;i>=0;i--){ res[i] *= right; right *= nums[i]; }
return res;
```
</details>

**Q8.** ⭐⭐ Container With Most Water (Two Pointers).
<details><summary>Solution</summary>

```java
int l=0, r=nums.length-1, max=0;
while(l<r){
    max = Math.max(max, Math.min(height[l],height[r])*(r-l));
    if(height[l]<height[r]) l++; else r--;
}
```
</details>

**Q9.** ⭐⭐ 3Sum — find all unique triplets summing to 0. O(N²).
<details><summary>Solution</summary>

```java
Arrays.sort(nums);
for(int i=0;i<n-2;i++){
    if(i>0 && nums[i]==nums[i-1]) continue;
    int l=i+1, r=n-1;
    while(l<r){
        int s=nums[i]+nums[l]+nums[r];
        if(s==0){ result.add(List.of(nums[i],nums[l++],nums[r--])); 
            while(l<r&&nums[l]==nums[l-1])l++; while(l<r&&nums[r]==nums[r+1])r--; }
        else if(s<0) l++; else r--;
    }
}
```
</details>

**Q10.** ⭐⭐ Rotate Array by k positions in-place O(1) space.
<details><summary>Solution</summary>

```java
// Reverse full array, then reverse first k, then reverse rest
k %= n;
reverse(nums, 0, n-1);
reverse(nums, 0, k-1);
reverse(nums, k, n-1);
```
</details>

**Q11.** ⭐⭐ Find the duplicate number in array [1..n] — O(N) time, O(1) space (Floyd's cycle).
<details><summary>Solution</summary>

```java
int slow=nums[0], fast=nums[0];
do{ slow=nums[slow]; fast=nums[nums[fast]]; } while(slow!=fast);
slow=nums[0];
while(slow!=fast){ slow=nums[slow]; fast=nums[fast]; }
return slow;
```
</details>

**Q12.** ⭐⭐⭐ Trapping Rain Water — O(N) two-pointer solution.
<details><summary>Solution</summary>

```java
int l=0,r=n-1,lMax=0,rMax=0,water=0;
while(l<r){
    if(height[l]<=height[r]){
        if(height[l]>=lMax) lMax=height[l]; else water+=lMax-height[l];
        l++;
    } else {
        if(height[r]>=rMax) rMax=height[r]; else water+=rMax-height[r];
        r--;
    }
}
```
</details>

### Interview Questions
**Q13.** What's the difference between `ArrayList` and `LinkedList` for index access?
<details><summary>Answer</summary>

ArrayList: O(1) random access (array backing). LinkedList: O(N) — must traverse from head. Use ArrayList for most cases; LinkedList only when frequent insertions/deletions at head/tail.
</details>

**Q14.** When would you use `int[]` over `ArrayList<Integer>`?
<details><summary>Answer</summary>

`int[]`: primitive, no boxing overhead, fixed-size, cache-friendly. `ArrayList<Integer>`: dynamic resizing, collection API, but 4-16x memory overhead per element due to Integer boxing.
</details>

**Q15.** What is cache locality and why do arrays benefit from it?
<details><summary>Answer</summary>

CPU loads data in cache lines (~64 bytes). Arrays store elements contiguously → sequential access loads entire cache line at once → very fast. LinkedList nodes are scattered in heap → each node access = potential cache miss.
</details>

### MCQ Rapid Fire
| # | Question | Answer |
|---|---|---|
| 1 | Array access a[i] time complexity | O(1) |
| 2 | Array insertion at middle time complexity | O(N) |
| 3 | Default value of int[] in Java | 0 |
| 4 | Arrays.sort() algorithm for primitives | Dual-pivot QuickSort |
| 5 | Arrays.sort() algorithm for objects | TimSort (stable) |
| 6 | Arrays.copyOfRange(a,2,5) — how many elements? | 3 (indices 2,3,4) |
| 7 | Can arrays store null? | Yes (reference arrays only) |
| 8 | Arrays.fill(a, 7) — what does it do? | Sets every element to 7 |
| 9 | Multi-dim array a[3][4] — total elements? | 12 |
| 10 | Arrays.binarySearch requires? | Sorted array |



---

## 🧠 Deep Conceptual Questions — Arrays & Memory

> These questions test your REASONING, not just recall. Think before expanding.

**C1. Why is array access O(1)?**
<details><summary>Deep Answer</summary>

Arrays store elements at **contiguous memory addresses**. Given base address B and element size S:
`address(i) = B + (i × S)` — this is a single multiplication and addition (constant time regardless of N).
The CPU can compute this directly without any traversal. This is why arrays are the fastest data structure for indexed access.
</details>

**C2. Why does cache performance matter for algorithms, and why do arrays win?**
<details><summary>Deep Answer</summary>

Modern CPUs fetch memory in **cache lines** (~64 bytes). When you access `array[i]`, the CPU also loads `array[i+1]` through `array[i+7]` into L1 cache automatically (spatial locality). Sequential array access hits cache nearly 100% of the time (~1ns). LinkedList traversal: each node is at a random heap address → each step is a potential **cache miss** (~100ns). For 1M elements: array traversal ≈ 1ms; linked list ≈ 100ms. Same O(N), 100x different in practice.
</details>

**C3. Why does `Arrays.sort()` use different algorithms for primitives vs objects?**
<details><summary>Deep Answer</summary>

**Primitives (`int[]`)**: Uses Dual-Pivot QuickSort. No stability needed (equal ints are indistinguishable). QuickSort is in-place (O(1) extra space), cache-friendly (sequential access), fastest in practice. **Objects (`Integer[]`)**: Uses TimSort (hybrid MergeSort + InsertionSort). MUST be stable — equal objects may have different fields that should preserve original order (think: sort by name, then by age — equal names must stay age-ordered). TimSort guarantees O(N log N) worst case; QuickSort can degrade to O(N²) if not careful.
</details>

**C4. Why is inserting at the beginning of an array O(N) but appending at end is O(1) amortized?**
<details><summary>Deep Answer</summary>

**Insert at index 0**: must shift every element right → N operations always.
**Append**: if capacity exists, write at `arr[size]` → O(1). If full, resize (double capacity) → copy all N elements. But resizing happens only after 1, 2, 4, 8... N elements. Total copies over N appends = N/2 + N/4 + ... = N. Average per operation = N/N = O(1) — this is **amortized analysis**. ArrayList uses this strategy.
</details>

**C5. What is the REAL cost of `ArrayList.remove(0)` in a 1M element list? Why?**
<details><summary>Deep Answer</summary>

~1 million array element shifts. Java calls `System.arraycopy()` — a native bulk memory move. Even though it's one instruction, it copies 1M references = 4MB-8MB of memory movement. At memory bandwidth ~20GB/s: ~200-400 microseconds actual cost. Not "slow" but definitely O(N) — avoid repeatedly removing from the front of a large ArrayList. Use `ArrayDeque` for front-removal O(1).
</details>

**C6. Two Sum: why does the HashMap approach work, and what's its actual space tradeoff?**
<details><summary>Deep Answer</summary>

HashMap approach: as you iterate, store `{value → index}`. For each element, check if `target - current` already seen. This is the **complement pattern**: instead of "find two that sum to target", reframe as "have I seen what I need?". Space: O(N) worst case (all elements unique, no match until last pair). But we trade space for a reduction from O(N²) to O(N) time — classic space-time tradeoff. The 1-pass variant finds the answer in one scan without a second loop.
</details>

**C7. Sliding Window: what is the INVARIANT being maintained?**
<details><summary>Deep Answer</summary>

A sliding window maintains a **window [left, right]** where some property (max sum, no duplicates, valid substring) holds. The invariant: the window always satisfies the constraint. When violated: shrink from left until valid again. This avoids re-examining elements already processed — each element enters and leaves the window exactly once → O(N). Mental model: two pointers chasing each other, never crossing, each moving forward-only.
</details>

**C8. Prefix Sum: why does it reduce range-sum queries from O(N) to O(1)?**
<details><summary>Deep Answer</summary>

`prefix[i] = arr[0] + arr[1] + ... + arr[i]`. Sum of range [l,r] = `prefix[r] - prefix[l-1]`. Precomputation: O(N). Each query: O(1) subtraction. Without prefix sum: each query scans the range = O(N) per query → O(N×Q) total for Q queries. With prefix sum: O(N) build + O(Q) queries = O(N+Q). Break-even at Q=1; better for Q>1. Classic **precomputation tradeoff**: pay once, query forever.
</details>

**C9. Why does Kadane's Algorithm work for Maximum Subarray?**
<details><summary>Deep Answer</summary>

The key insight: at each position i, the maximum subarray ending at i is either:
1. `arr[i]` alone (start fresh — previous subarray was negative, drags us down)
2. `arr[i] + best_ending_at[i-1]` (extend the previous best)

`curr = max(arr[i], curr + arr[i])` captures this exactly. If curr becomes negative, it's better to start fresh at next element. We track global max throughout. This is a 1D DP where the "state" is "maximum subarray sum ending here". The recurrence is the key reasoning step.
</details>

**C10. Binary Search: why does `mid = lo + (hi - lo) / 2` instead of `(lo + hi) / 2`?**
<details><summary>Deep Answer</summary>

**Integer overflow!** If `lo + hi` exceeds `Integer.MAX_VALUE` (2,147,483,647), the sum wraps to a negative number. For huge arrays (lo=1B, hi=2B), `lo + hi = 3B > 2.1B`. This bug brought down a famous JDK implementation of binary search in 2006 (Joshua Bloch's blog post). `lo + (hi - lo) / 2` can never overflow since `hi - lo` is always positive and smaller than either value alone.
</details>


> **Navigation**: [⬅ Mock Interviews](09_Mock_Interview_Simulations.md) | [📚 Index](00_INDEX.md) | [Next: LinkedList, Stack, Queue, Heap ➡](11_DSA_Problems_LinkedList_Stack_Queue_Heap.md)
