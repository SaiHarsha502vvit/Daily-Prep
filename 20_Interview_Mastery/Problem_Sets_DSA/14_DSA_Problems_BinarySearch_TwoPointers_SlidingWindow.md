**Navigation**: [⬅ DP, Greedy, Backtracking](13_DSA_Problems_DP_Greedy_Backtracking.md) | [📚 Index](../00_INDEX.md) | [Next: SQL Foundations & Intermediate ➡](../Problem_Sets_SQL/15_SQL_Problems_Foundations_Intermediate.md)

# File 14 — DSA Problems: Binary Search, Two Pointers & Sliding Window

## Logic-First, Code-Second: The 5W+H Way

- Binary Search = "The answer space is sorted or monotonic — cut it in half."
- Two Pointers = "Process from both ends or at different speeds."
- Sliding Window = "Maintain a valid window, grow right, shrink left."

---

## BINARY SEARCH

---

### Problem 1: Search in Rotated Sorted Array

**WHAT**: Find target in an array that was sorted then rotated at some pivot.

**WHY modified binary search works**:

- After rotation, one half is ALWAYS sorted
- Check which half is sorted, then decide if target is in that sorted half
- This reduces the problem by half each step → O(log n)

**WHEN**: "Search in rotated/modified sorted array" → Binary search with condition checks.

**WHERE**: Amazon, Google, Facebook — extremely common.

**HOW — The Logic Chain**:

```
Step 1: lo = 0, hi = n-1
Step 2: While lo ≤ hi:
        → mid = lo + (hi - lo) / 2
        → If nums[mid] == target → return mid

        → If LEFT half is sorted (nums[lo] ≤ nums[mid]):
          → If target ≥ nums[lo] AND target < nums[mid] → search left (hi = mid-1)
          → Else → search right (lo = mid+1)

        → Else RIGHT half is sorted:
          → If target > nums[mid] AND target ≤ nums[hi] → search right (lo = mid+1)
          → Else → search left (hi = mid-1)
```

**The insight**: At least one half is ALWAYS properly sorted (rotation can only disrupt one side). Check if target falls in the sorted range.

**With duplicates**: When `nums[lo] == nums[mid] == nums[hi]`, we can't determine which side is sorted. Shrink both ends: `lo++; hi--`. Worst case becomes O(n).

---

### Problem 2: Find Minimum in Rotated Sorted Array

**WHAT**: Find the minimum element in a rotated sorted array.

**WHY binary search on the inflection point**:

- The minimum is at the rotation point — where the value drops
- If `nums[mid] > nums[hi]` → minimum is in the right half
- Otherwise → minimum is in the left half (including mid)

**HOW — The Logic Chain**:

```
lo = 0, hi = n-1
While lo < hi:
  → mid = lo + (hi - lo) / 2
  → If nums[mid] > nums[hi] → min is right: lo = mid + 1
  → Else → min is left or mid: hi = mid
Return nums[lo]
```

**Why `lo < hi` not `lo ≤ hi`**: We're converging to a single element (the minimum). When lo == hi, we've found it.

**Why `hi = mid` not `hi = mid - 1`**: mid itself could be the minimum. We can't exclude it.

---

### Problem 3: Search a 2D Matrix

**WHAT**: Search in a row-sorted, column-sorted matrix (or fully sorted if flattened).

**WHY treat as 1D sorted array**:

- If each row's first element > previous row's last element → matrix is one sorted array
- Map 1D index to 2D: `row = index / cols, col = index % cols`
- Standard binary search on virtual 1D array

**HOW — The Logic Chain**:

```
lo = 0, hi = rows * cols - 1
While lo ≤ hi:
  → mid = lo + (hi - lo) / 2
  → row = mid / cols, col = mid % cols
  → If matrix[row][col] == target → found
  → If matrix[row][col] < target → lo = mid + 1
  → Else → hi = mid - 1
```

**Variant — Search a 2D Matrix II (each row and column sorted, but not globally)**:

- Start from top-right corner (or bottom-left)
- If target < current → go left. If target > current → go down. O(m+n).

---

### Problem 4: Binary Search on Answer (Koko Eating Bananas)

**WHAT**: Koko eats bananas at speed k. Find minimum k to finish within h hours.

**WHY binary search on the answer space**:

- The answer k is in range [1, max(piles)]
- For a given k, we can CHECK in O(n) if Koko finishes in time
- The relationship is monotonic: higher k → fewer hours (always true)
- Binary search for the smallest k that works

**WHEN**: "Minimize/maximize a value" + "can verify a candidate in O(n)" + "monotonic check function" → Binary search on answer.

**HOW — The Logic Chain**:

```
lo = 1, hi = max(piles)
While lo < hi:
  → mid = lo + (hi - lo) / 2
  → hours = sum(ceil(pile/mid)) for each pile
  → If hours ≤ h → mid might work, try smaller: hi = mid
  → Else → too slow, need faster: lo = mid + 1
Return lo
```

**This pattern applies to MANY problems**:

- Split Array Largest Sum → binary search on the maximum sum
- Capacity to Ship Packages → binary search on the ship capacity
- Minimum Time to Complete → binary search on time
- Magnetic Force Between Balls → binary search on minimum distance

**Interview narration**: "I notice the answer space has a monotonic property — if speed k works, any speed > k also works. This means I can binary search on k. For each candidate, I check feasibility in O(n). Total: O(n log M) where M is the answer range."

---

### Problem 5: Find Peak Element

**WHAT**: Find any element greater than its neighbors.

**WHY binary search works on unsorted array**:

- Key insight: if `nums[mid] < nums[mid+1]` → a peak must exist to the right (values are going up)
- If `nums[mid] > nums[mid+1]` → a peak must exist to the left (including mid)
- Edges are -∞, so going uphill always leads to a peak

**HOW — The Logic Chain**:

```
lo = 0, hi = n-1
While lo < hi:
  → mid = lo + (hi - lo) / 2
  → If nums[mid] < nums[mid+1] → go right: lo = mid + 1
  → Else → go left (peak is here or left): hi = mid
Return lo
```

**Why this works on unsorted arrays**: Binary search doesn't require sorting — it requires a DECISION CRITERION that always eliminates half the search space.

---

### Problem 6: Median of Two Sorted Arrays

**WHAT**: Find median of two sorted arrays in O(log(min(m,n))).

**WHY binary search on partition position**:

- We need to split both arrays such that left half = right half in count
- Binary search on the smaller array's partition position
- The larger array's partition is determined: `(m+n+1)/2 - partition1`
- Valid partition: maxLeft1 ≤ minRight2 AND maxLeft2 ≤ minRight1

**HOW — The Logic Chain**:

```
Binary search on partition1 (0 to m) in smaller array:
  → partition2 = (m+n+1)/2 - partition1
  → maxLeft1, minRight1 from array1 around partition
  → maxLeft2, minRight2 from array2 around partition
  → If maxLeft1 ≤ minRight2 AND maxLeft2 ≤ minRight1 → valid
    → Median = avg of max(maxLeft1, maxLeft2) and min(minRight1, minRight2) for even
  → If maxLeft1 > minRight2 → partition1 too big → go left
  → Else → partition1 too small → go right
```

**Interview tip**: This is a hard problem. Draw the arrays, show the partition visually. If stuck, explain the O(m+n) merge approach first, then optimize.

---

🔬 **Section Challenge — BINARY SEARCH**

**Challenge 1 (Reasoning):** Binary search on `[1,3,5,7,9]` with `target=6`. Trace `lo`, `hi`, `mid` at each step and explain the final state.

<details><summary>Answer</summary>

lo=0,hi=4 → mid=2(val=5): 5<6 → lo=3. lo=3,hi=4 → mid=3(val=7): 7>6 → hi=2. lo(3)>hi(2): loop ends, return -1 (not found). Key insight: lo overtakes hi — this is the standard termination condition. `lo` ends at the insertion point where 6 would go.

</details>

**Challenge 2 (Design):** Binary search on a rotated array `[4,5,6,7,0,1,2]`. How do you determine which half is sorted?

<details><summary>Answer</summary>

Compare `nums[lo]` and `nums[mid]`. If `nums[lo] <= nums[mid]`: left half is sorted. Check if target is in `[nums[lo], nums[mid])` — if yes, search left; else search right. Otherwise right half is sorted. Check if target is in `(nums[mid], nums[hi]]` — if yes, search right; else search left. This always works because at least one half of a rotated sorted array is always sorted.

</details>

## TWO POINTERS

---

### Problem 7: 3Sum

**WHAT**: Find all unique triplets that sum to zero.

**WHY sort + two pointers after fixing one element**:

- Sort array. For each number as the fixed element, use Two Pointers to find pairs that sum to its negative
- Skip duplicates to avoid repeated triplets

**HOW — The Logic Chain**:

```
Sort array
For each i from 0 to n-3:
  → Skip if nums[i] == nums[i-1] (avoid duplicate triplets)
  → left = i+1, right = n-1, target = -nums[i]
  → While left < right:
    → sum = nums[left] + nums[right]
    → If sum == target → found! Add triplet. Skip duplicate lefts and rights.
    → If sum < target → left++
    → If sum > target → right--
```

**Why skip duplicates at both levels**: Outer skip (i) prevents same first element. Inner skip (left/right) prevents same second/third element.

**Time**: O(n²). The sort is O(n log n) and the two-pointer scan is O(n) per fixed element.

---

### Problem 8: Trapping Rain Water

**WHAT**: Given heights, compute how much water can be trapped after rain.

**WHY "water at position = min(maxLeft, maxRight) - height"**:

- At each position, water level = shorter of the tallest bar to the left and right
- Water trapped = water level - bar height (if positive)

**WHEN**: "Bounded by left and right constraints" → Two pointers from both ends.

**HOW — Two Pointer Logic Chain**:

```
left = 0, right = n-1
leftMax = 0, rightMax = 0
water = 0

While left < right:
  → If height[left] < height[right]:
    → If height[left] ≥ leftMax → update leftMax
    → Else → water += leftMax - height[left]
    → left++
  → Else:
    → If height[right] ≥ rightMax → update rightMax
    → Else → water += rightMax - height[right]
    → right--
```

**Why the comparison decides direction**: If `height[left] < height[right]`, we KNOW leftMax is the limiting factor for the left position. The right side is guaranteed to have at least `height[right]` which is taller. So we can safely calculate water at left.

**Alternative approaches**:

- Prefix max + suffix max arrays (O(n) space)
- Monotonic stack (process bars left to right)

---

### Problem 9: Container With Most Water

**WHAT**: Find two lines that form the container holding most water.

**WHY two pointers from both ends works**:

- Start with widest container (left=0, right=n-1)
- Area = min(height[left], height[right]) × (right - left)
- Move the SHORTER line inward (the shorter line limits the area — moving it might find a taller line)

**HOW — The Logic Chain**:

```
left = 0, right = n-1, maxArea = 0
While left < right:
  → area = min(height[left], height[right]) * (right - left)
  → maxArea = max(maxArea, area)
  → If height[left] < height[right] → left++
  → Else → right--
```

**Why move the shorter side**: Moving the taller side can only decrease or maintain the area (the shorter side still limits, and width decreases). Moving the shorter side CAN increase area if we find something taller.

---

### Problem 10: Valid Palindrome

**WHAT**: Is it a palindrome considering only alphanumeric characters?

**WHY two pointers from both ends**:

- Compare characters from start and end, moving inward
- Skip non-alphanumeric characters

**HOW — The Logic Chain**:

```
left = 0, right = n-1
While left < right:
  → While left < right AND !isAlphanumeric(s[left]) → left++
  → While left < right AND !isAlphanumeric(s[right]) → right--
  → If toLowerCase(s[left]) ≠ toLowerCase(s[right]) → false
  → left++, right--
Return true
```

---

### Problem 11: Sort Colors (Dutch National Flag)

**WHAT**: Sort array of 0s, 1s, 2s in-place in one pass.

**WHY three pointers partition the array**:

- lo (next position for 0), mid (current scanner), hi (next position for 2)
- Three regions: [0..lo-1] = zeros, [lo..mid-1] = ones, [hi+1..n-1] = twos

**HOW — The Logic Chain**:

```
lo = 0, mid = 0, hi = n-1
While mid ≤ hi:
  → If nums[mid] == 0 → swap(lo, mid), lo++, mid++
  → If nums[mid] == 1 → mid++
  → If nums[mid] == 2 → swap(mid, hi), hi--  (don't advance mid!)
```

**Why mid doesn't advance on swap with hi**: The swapped element from hi hasn't been examined yet. It could be 0, 1, or 2.

---

🔬 **Section Challenge — TWO POINTERS**

**Challenge 1 (Reasoning):** Two-pointer pattern reduces O(N²) brute force to O(N). What is the KEY invariant that makes this safe?

<details><summary>Answer</summary>

The invariant: all pairs we SKIP are guaranteed to not contain the answer. In 3Sum: once we fix `nums[i]` and use l/r pointers, we can safely skip because the array is sorted. If `sum > 0`: decreasing r decreases the sum (smaller right value). If `sum < 0`: increasing l increases the sum (larger left value). We never skip a valid pair because monotonicity guarantees it.

</details>

## SLIDING WINDOW

---

### Problem 12: Minimum Window Substring

**WHAT**: Find smallest window in s containing all characters of t.

**WHY variable-size sliding window with freq tracking**:

- Expand right to include more characters
- When window contains all required characters → try to shrink from left
- Track character frequencies and a "formed" counter

**WHEN**: "Smallest window containing all of X" → Shrinkable sliding window.

**HOW — The Logic Chain**:

```
Step 1: Count required frequencies from t
Step 2: left = 0, formed = 0, needed = unique chars in t
Step 3: Expand right:
        → Add s[right] to window counts
        → If windowCount[s[right]] == required[s[right]] → formed++
        → While formed == needed:  (window is valid)
          → Update minWindow if smaller
          → Remove s[left] from window counts
          → If windowCount[s[left]] < required[s[left]] → formed--
          → left++
```

**The "formed" counter insight**: Instead of comparing all frequencies each time (O(k)), track how many unique characters have met their target. When formed == needed → window is valid.

---

### Problem 13: Find All Anagrams in a String

**WHAT**: Find all start indices of t's anagrams in s.

**WHY fixed-size sliding window**:

- All anagrams of t have the same length → window size = len(t)
- Slide window of exact size, compare frequency arrays

**HOW — The Logic Chain**:

```
Step 1: Count frequencies of t
Step 2: Build initial window of size len(t)
Step 3: Slide window by 1 each step:
        → Remove leftmost character count
        → Add new rightmost character count
        → If current window freq == t freq → record start index
```

**Optimization**: Instead of comparing entire frequency arrays, maintain a "matches" counter (number of characters with correct frequency). When matches == 26 → anagram.

---

### Problem 14: Longest Repeating Character Replacement

**WHAT**: Longest substring where you can replace at most k characters to make all same.

**WHY window validity = chars to replace ≤ k**:

- In a window, chars to replace = windowSize - count of most frequent char
- If that exceeds k → window invalid → shrink
- Key trick: we don't need to decrease maxFreq when shrinking

**HOW — The Logic Chain**:

```
left = 0, maxFreq = 0, freq[26]
For each right:
  → freq[s[right]]++
  → maxFreq = max(maxFreq, freq[s[right]])
  → If (right - left + 1) - maxFreq > k:
    → freq[s[left]]--
    → left++
  → maxLen = max(maxLen, right - left + 1)
```

**Why maxFreq never decreases**: Counter-intuitive but valid. We only care about maxFreq for a LONGER window than our best so far. If maxFreq decreases, the window can't get longer anyway, so it doesn't affect the answer.

---

### Problem 15: Subarrays with K Different Integers

**WHAT**: Count subarrays with exactly k distinct integers.

**WHY "at most K" trick**:

- Exactly K = atMost(K) - atMost(K-1)
- atMost(K) is easy with sliding window + HashMap

**WHEN**: "Exactly K" constraint → Convert to "at most K" minus "at most K-1".

**HOW — The Logic Chain**:

```
atMost(K):
  left = 0, count = 0, distinct = 0, freq map
  For each right:
    → If freq[nums[right]] == 0 → distinct++
    → freq[nums[right]]++
    → While distinct > K:
      → freq[nums[left]]--
      → If freq[nums[left]] == 0 → distinct--
      → left++
    → count += right - left + 1   ← all subarrays ending at right

Return atMost(K) - atMost(K-1)
```

**Why `count += right - left + 1`**: Every subarray starting from left to right and ending at right is valid. That's (right - left + 1) subarrays.

---

🔬 **Section Challenge — SLIDING WINDOW**

**Challenge 1 (Reasoning):** Sliding window guarantees O(N). How? Each element is added and removed exactly how many times?

<details><summary>Answer</summary>

Each element enters the window exactly ONCE (right pointer advances past it) and leaves exactly ONCE (left pointer advances past it). Total operations: 2N regardless of window size changes. Compare to brute force: for each ending position, scan back to find optimal start = O(N²). The window's state (sum, freq map, etc.) is maintained INCREMENTALLY — O(1) per pointer move.

</details>

**Challenge 2 (Bug Hunt):** Minimum Window Substring: the while loop to shrink the window runs `while(valid) { shrink; }`. What's wrong with this logic?

<details><summary>Answer</summary>

Should shrink `while(valid)` to find the minimum window — this is correct! But the common bug: not updating `left++` BEFORE rechecking validity, or forgetting to update the answer BEFORE shrinking. The answer should be captured at the moment the window first becomes valid, then kept updated as we shrink to find smaller valid windows.

</details>

## INTERVALS (Bonus Section)

---

### Problem 16: Non-Overlapping Intervals (Minimum Removals)

**WHAT**: Remove minimum intervals to make rest non-overlapping.

**WHY greedy by end time**:

- Sort by END time (not start — this is the greedy insight)
- Always keep the interval that ends earliest → leaves most room
- If next interval starts before current end → conflict → remove it (count++)

**HOW — The Logic Chain**:

```
Sort by end time
prevEnd = first interval's end, removals = 0
For each subsequent interval:
  → If interval.start < prevEnd → overlap → removals++
  → Else → no overlap → prevEnd = interval.end
Return removals
```

**Why end time, not start time**: Sorting by end time is the classic greedy choice for interval scheduling. The interval that ends earliest is always the safest to keep.

---

### Problem 17: Insert Interval

**WHAT**: Insert a new interval into a sorted, non-overlapping list and merge.

**WHY three-phase scan works**:

1. Add all intervals that end BEFORE new interval starts
2. Merge all overlapping intervals with new interval
3. Add all intervals that start AFTER new interval ends

**HOW — The Logic Chain**:

```
result = []
Phase 1: While intervals[i].end < newInterval.start:
         → result.add(intervals[i])
Phase 2: While intervals[i].start ≤ newInterval.end:
         → newInterval.start = min(newInterval.start, intervals[i].start)
         → newInterval.end = max(newInterval.end, intervals[i].end)
         → result.add(newInterval)
Phase 3: Add remaining intervals
```

---

## MASTER PROBLEM MAP — Binary Search, Two Pointers, Sliding Window

| #   | Problem                   | Core Logic                    | Pattern             | Key Insight                          |
| --- | ------------------------- | ----------------------------- | ------------------- | ------------------------------------ |
| 1   | Rotated Search            | one half always sorted        | Modified BS         | Check which half is sorted           |
| 2   | Rotated Min               | compare mid with hi           | BS on Inflection    | hi=mid (mid could be answer)         |
| 3   | Search 2D Matrix          | virtual 1D index              | BS + Math           | row=mid/cols, col=mid%cols           |
| 4   | Koko's Bananas            | verify candidate speed        | BS on Answer        | Monotonic check function             |
| 5   | Peak Element              | go uphill direction           | BS on Gradient      | Going up always leads to peak        |
| 6   | Median Two Arrays         | partition both arrays         | BS on Partition     | Binary search smaller array          |
| 7   | 3Sum                      | fix one + two pointers        | Sort + 2P           | Skip duplicates at both levels       |
| 8   | Trapping Rain Water       | bounded by min(maxL, maxR)    | 2P from Ends        | Shorter side decides direction       |
| 9   | Container Water           | move shorter line inward      | 2P from Ends        | Taller side can't be limiting        |
| 10  | Valid Palindrome          | compare from both ends        | 2P from Ends        | Skip non-alphanumeric                |
| 11  | Sort Colors               | 3-way partition               | Dutch National Flag | Don't advance mid on swap with hi    |
| 12  | Min Window Substring      | expand→valid→shrink           | Variable Window     | "formed" counter avoids O(k) compare |
| 13  | Find All Anagrams         | fixed window + freq compare   | Fixed Window        | "matches" counter = 26 chars         |
| 14  | Longest Repeating Replace | windowSize-maxFreq ≤ k        | Variable Window     | maxFreq never needs to decrease      |
| 15  | Exactly K Distinct        | atMost(K) - atMost(K-1)       | Window + Math       | count += right-left+1 per step       |
| 16  | Non-Overlapping Intervals | sort by end, greedy keep      | Greedy Interval     | End-time sort is optimal             |
| 17  | Insert Interval           | 3-phase: before, merge, after | Interval Merge      | Merge phase adjusts new interval     |

---

🔬 **Section Challenge — MASTER PROBLEM MAP — Binary Search, Two Pointers, Sliding Window**

**Challenge 1 (Reasoning):** Binary search on `[1,3,5,7,9]` with `target=6`. Trace `lo`, `hi`, `mid` at each step and explain the final state.

<details><summary>Answer</summary>

lo=0,hi=4 → mid=2(val=5): 5<6 → lo=3. lo=3,hi=4 → mid=3(val=7): 7>6 → hi=2. lo(3)>hi(2): loop ends, return -1 (not found). Key insight: lo overtakes hi — this is the standard termination condition. `lo` ends at the insertion point where 6 would go.

</details>

**Challenge 2 (Design):** Binary search on a rotated array `[4,5,6,7,0,1,2]`. How do you determine which half is sorted?

<details><summary>Answer</summary>

Compare `nums[lo]` and `nums[mid]`. If `nums[lo] <= nums[mid]`: left half is sorted. Check if target is in `[nums[lo], nums[mid])` — if yes, search left; else search right. Otherwise right half is sorted. Check if target is in `(nums[mid], nums[hi]]` — if yes, search right; else search left. This always works because at least one half of a rotated sorted array is always sorted.

</details>

## The Binary Search Template Zoo

**Template 1 — Standard (find exact)**:

```
while lo ≤ hi:
  mid = lo + (hi-lo)/2
  if found → return
  if less → lo = mid+1
  if more → hi = mid-1
```

**Template 2 — Left boundary (first true)**:

```
while lo < hi:
  mid = lo + (hi-lo)/2
  if condition(mid) → hi = mid
  else → lo = mid+1
return lo
```

**Template 3 — Right boundary (last true)**:

```
while lo < hi:
  mid = lo + (hi-lo+1)/2    ← round UP
  if condition(mid) → lo = mid
  else → hi = mid-1
return lo
```

**When to use which**: Template 1 for exact search. Template 2 for "first position where X is true." Template 3 for "last position where X is true."

---

---

🔬 **Section Challenge — The Binary Search Template Zoo**

**Challenge 1 (Reasoning):** Binary search on `[1,3,5,7,9]` with `target=6`. Trace `lo`, `hi`, `mid` at each step and explain the final state.

<details><summary>Answer</summary>

lo=0,hi=4 → mid=2(val=5): 5<6 → lo=3. lo=3,hi=4 → mid=3(val=7): 7>6 → hi=2. lo(3)>hi(2): loop ends, return -1 (not found). Key insight: lo overtakes hi — this is the standard termination condition. `lo` ends at the insertion point where 6 would go.

</details>

**Challenge 2 (Design):** Binary search on a rotated array `[4,5,6,7,0,1,2]`. How do you determine which half is sorted?

<details><summary>Answer</summary>

Compare `nums[lo]` and `nums[mid]`. If `nums[lo] <= nums[mid]`: left half is sorted. Check if target is in `[nums[lo], nums[mid])` — if yes, search left; else search right. Otherwise right half is sorted. Check if target is in `(nums[mid], nums[hi]]` — if yes, search right; else search left. This always works because at least one half of a rotated sorted array is always sorted.

</details>


---

## Reality Check

**"Binary search needs a sorted array"** — Binary search needs a MONOTONIC PREDICATE — a yes/no question that flips once across the space ([04_Patterns/06, 07_Binary_Search]): ship-in-D-days, koko-bananas, split-array-largest-sum hide "can value x do it," monotone in x, with nothing sorted. Binary-search-on-answer is this category's highest-leverage generalization, and array-sortedness thinking blocks it — the practice is recognizing the hidden predicate in the story.

**"Two pointers is one technique"** — It is four with different invariants ([04_Patterns/07, 06_Two_Pointers]): converging (sorted pair-sum, each step permanently discards candidates via the exchange argument), fast-slow (cycle detection, middle-finding), parallel (merge), and partition (Dutch flag, where mid does NOT advance after swapping from high). The exchange-argument (when a+b < target, every pair (lo, x<hi) is also too small, so advance lo) is what interviewers probe with "why does this not miss a pair" — the movement rule without the discard rule fails that follow-up.

**"Sliding window means maximize the window"** — Four question shapes hide here, each with a different template detail ([04_Patterns/09, 05_Problem_Solving/05]): longest-valid (shrink only when invalid), shortest-valid (shrink WHILE valid — the inversion), count-valid (add right-left+1 per step — the least intuitive line), exists-valid (early return). Applying the longest template to a shortest problem compiles, runs, and returns the wrong extreme — the shrink-policy must be derived from which extreme the problem asks, every time.

**"These three are unrelated techniques"** — They are a related family for MONOTONE properties, and the routing among them is the skill ([04_Patterns/25, 02_Constraint_to_Algorithm_Map]): sorted-and-pairing means two pointers, monotone-predicate means binary search, monotone-window-property means sliding window — and the constraint line (all-positive means window, may-contain-negative means prefix-sums instead) is the router. The problems that look like one and need another (the window that becomes a difference-of-two-thresholds, the two-pointer that needs the sort binary search assumes) test this routing.

**"Off-by-one in these is careless typing"** — It is unstated CONVENTION, not carelessness ([04_Patterns/02, 05_Problem_Solving/23]): lo<hi vs lo<=hi, hi=mid vs hi=mid-1, the window's inclusive-vs-exclusive right boundary form a consistent system where each choice forces the others, and mixing two half-remembered conventions produces the infinite loop at hi-lo==1. The discipline is picking one convention with its termination proof and never mixing — the fencepost bug in binary search and windows is a convention bug, and drilling it out is much of what this category teaches.
