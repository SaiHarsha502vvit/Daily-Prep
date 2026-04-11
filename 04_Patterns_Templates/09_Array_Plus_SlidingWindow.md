> **Navigation**: [< Previous](08_Array_Plus_TwoPointers.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](10_HashMap_Plus_Counting.md)

# Array + Sliding Window — Combined Pattern Guide

> **WHY this combination?** When you need to find optimal **contiguous subarrays** or **substrings**, the sliding window maintains a running computation as it moves across the array. Reduces O(n²) brute force → O(n).

### 🧠 Deep Intuition — Why Sliding Window Is O(n)

The brute force for "best contiguous subarray" problems checks all O(n²) subarrays (each starting point × each ending point) and evaluates each one. Sliding window reduces this to O(n) by making a crucial observation: **you don't need to recompute the entire subarray when you shift by one position.**

#### The Amortized Analysis — Why It's Truly O(n)

Despite the nested `while (shrink)` loop inside the `for` loop, sliding window is NOT O(n²). Here's the rigorous argument:

- The `right` pointer advances from 0 to n-1: exactly **n increments**
- The `left` pointer also advances from 0 to at most n-1: at most **n increments total** (across all iterations of the outer loop, not per iteration)
- Therefore, the total work is O(n + n) = **O(n)**

Think of it this way: each element enters the window exactly once (when `right` reaches it) and leaves the window at most once (when `left` passes it). Total operations = 2n.

#### Why Sliding Window FAILS With Negative Numbers

Sliding window for sum problems relies on a **monotonicity assumption**: expanding the window (moving `right`) always increases the sum, and shrinking (moving `left`) always decreases it. With negative numbers, adding an element might *decrease* the sum, which breaks the invariant that "if the current window exceeds the target, we should shrink."

For problems with negative numbers, use **Prefix Sum + HashMap** instead: compute `prefix[i] = sum(arr[0..i])`, then `subarray_sum(i,j) = prefix[j] - prefix[i-1]`. Store prefix sums in a HashMap to find target differences in O(1).

---

## 🧠 WHEN TO RECOGNIZE THIS PATTERN

```
IF the problem says:
  ✅ "Contiguous subarray" or "substring"
  ✅ "Maximum/minimum sum of size k"
  ✅ "Longest/shortest subarray with condition"
  ✅ "Count of subarrays with property"
  ✅ "Subarray sum equals/divisible by K"
THEN → Sliding Window on Array
```

### Fixed vs Variable Window
```
Fixed Window (size k):          Variable Window:
┌─────┐                        ┌──────────────┐
│ k=3 │→ slide                 │   expand →   │
└─────┘                        └──────────────┘
                                ← shrink │
Use when: size is given         Use when: find optimal size
```

---



> 🔬 **Section Challenge — 🧠 WHEN TO RECOGNIZE THIS PATTERN**
>
> **Challenge 1 (Reasoning):** A problem says "maximum sum of subarray with sum ≤ K, where array contains negative numbers." Why does sliding window fail here, and what's the correct approach?
> <details><summary>Answer</summary>
>
> Sliding window requires **monotonicity**: expanding the window must increase (or maintain) the sum, shrinking must decrease it. With negatives, expanding by adding a negative element *decreases* the sum — breaking the invariant. The window shrink logic becomes incorrect: if `sum > K`, shrinking from left might not help if there are negatives in the middle. **Correct approach**: Prefix Sum + HashMap. Compute cumulative sums, then for each `prefix[r]`, find the largest `prefix[l]` such that `prefix[r] - prefix[l] ≤ K`. Sort prefix sums or use a TreeMap for O(N log N).
> </details>
>
> **Challenge 2 (Reasoning):** "Sliding window is O(N) because left and right each move at most N times." Prove this rigorously — the inner `while` loop looks like it could make it O(N²).
> <details><summary>Answer</summary>
>
> **Amortized argument**: Count total pointer movements. `right` starts at 0 and moves right N times total (one per outer loop iteration). `left` starts at 0 and can only move right (never left). Since `left ≤ right ≤ N-1` always, `left` moves at most N times *total* across ALL iterations of the inner while loop — not N times per outer iteration. Total operations = right moves + left moves = N + N = 2N = O(N). The inner while loop's iterations are "paid for" by previous outer loop iterations that advanced `right`.
> </details>

## 📐 CORE TEMPLATES

### Template 1: Fixed-Size Window
```java
// Max sum of k consecutive elements
int windowSum = 0;
// Build first window
for (int i = 0; i < k; i++) windowSum += arr[i];
int maxSum = windowSum;

// Slide: add right, remove left
for (int i = k; i < arr.length; i++) {
    windowSum += arr[i] - arr[i - k];   // add new, remove old
    maxSum = Math.max(maxSum, windowSum);
}
```

### Template 2: Variable-Size Window (Expand + Shrink)
```java
// Longest subarray with sum ≤ target
int left = 0, windowSum = 0, maxLen = 0;
for (int right = 0; right < arr.length; right++) {
    windowSum += arr[right];          // EXPAND

    while (windowSum > target) {      // SHRINK until valid
        windowSum -= arr[left];
        left++;
    }

    maxLen = Math.max(maxLen, right - left + 1);  // UPDATE answer
}
```

### Template 3: Window with HashMap (Frequency)
```java
// Longest substring with at most K distinct characters
Map<Character, Integer> freq = new HashMap<>();
int left = 0, maxLen = 0;
for (int right = 0; right < s.length(); right++) {
    char c = s.charAt(right);
    freq.merge(c, 1, Integer::sum);         // EXPAND

    while (freq.size() > k) {               // SHRINK
        char leftChar = s.charAt(left);
        freq.merge(leftChar, -1, Integer::sum);
        if (freq.get(leftChar) == 0) freq.remove(leftChar);
        left++;
    }

    maxLen = Math.max(maxLen, right - left + 1);
}
```

---

## 🔬 VISUAL: Variable Window in Action

```
Array: [2, 1, 5, 1, 3, 2]   Target: max subarray sum ≤ 7

Step 1: [2] sum=2 ≤ 7 → len=1
        L,R

Step 2: [2, 1] sum=3 ≤ 7 → len=2
        L  R

Step 3: [2, 1, 5] sum=8 > 7 → SHRINK!
        L     R

Step 4: [1, 5] sum=6 ≤ 7 → len=2
           L  R

Step 5: [1, 5, 1] sum=7 ≤ 7 → len=3 ✅ best so far
           L     R

Step 6: [1, 5, 1, 3] sum=10 > 7 → SHRINK!
           L        R

Step 7: [5, 1, 3] sum=9 > 7 → SHRINK!
              L     R

Step 8: [1, 3] sum=4 ≤ 7 → len=2
                 L  R

Step 9: [1, 3, 2] sum=6 ≤ 7 → len=3 ✅ tied best
                 L     R

Answer: 3
```

---



> 🔬 **Section Challenge — 🔬 VISUAL: Variable Window**
>
> **Challenge (Design):** Count the number of subarrays with sum exactly K (array has negatives). Why can't you use sliding window? Write the correct approach.
> <details><summary>Answer</summary>
>
> Negatives break monotonicity. Correct approach: **Prefix Sum + HashMap**. `count += prefixMap.getOrDefault(prefix - k, 0)` as you build the running prefix sum. The map stores `{prefixSum → count of times seen}`. When `prefix[r] - prefix[l] == k`, we found a valid subarray `(l, r]`. Time: O(N), Space: O(N). This is LC 560 — the classic harder version after sliding window.
> </details>

## 🔬 FULL WALKTHROUGH: Longest Substring Without Repeating Characters

```
Problem: Find length of longest substring without repeating chars.
         s = "abcabcbb"

Approach: Variable-size sliding window + HashSet.
  Expand right until duplicate found. Shrink left until duplicate removed.

Step-by-step:
  Window       Set          Length  Max
  [a]bcabcbb   {a}          1       1
  [ab]cabcbb   {a,b}        2       2
  [abc]abcbb   {a,b,c}      3       3
  [abca]bcbb   'a' repeats! shrink:
   [bca]bcbb   {b,c,a}      3       3
   [bcab]cbb   'b' repeats! shrink:
    [cab]cbb   {c,a,b}      3       3
    [cabc]bb   'c' repeats! shrink:
     [abc]bb   {a,b,c}      3       3
     [abcb]b   'b' repeats! shrink:
      [cb]b    {c,b}        2       3
      [cbb]    'b' repeats! shrink:
       [b]b    shrink again:
        [b]    {b}          1       3

  Answer: 3 ✅ ("abc")

Time: O(n) | Space: O(min(n, 26))
WHY O(n)? Each char is added and removed from set at most once.
```

---

## 🔬 FULL WALKTHROUGH 2: Maximum Sum Subarray of Size K (Fixed Window)

```
Problem: Find the maximum sum of any contiguous subarray of size k=3.
         nums = [2, 1, 5, 1, 3, 2]

Approach: Fixed-size sliding window — add right, subtract left.

Step-by-step:
  Build initial window (first k elements):
    sum = 2 + 1 + 5 = 8, maxSum = 8

  Slide:
    i=3: sum = 8 - nums[0] + nums[3] = 8 - 2 + 1 = 7, maxSum = 8
         Window: [1, 5, 1]
    i=4: sum = 7 - nums[1] + nums[4] = 7 - 1 + 3 = 9, maxSum = 9 ✅
         Window: [5, 1, 3]
    i=5: sum = 9 - nums[2] + nums[5] = 9 - 5 + 2 = 6, maxSum = 9
         Window: [1, 3, 2]

  Answer: 9 ✅ (subarray [5, 1, 3])

Time: O(n) | Space: O(1)
WHY fixed window? Size is given (k=3), so just slide it.
```

---

## 🛡️ EDGE CASES

```
┌───────────────────────────────┬──────────────────────────────────────┐
│ Edge Case                     │ Handling                             │
├───────────────────────────────┼──────────────────────────────────────┤
│ Empty string / array          │ Return 0 immediately                 │
│ k > array length              │ Invalid — return -1 or throw         │
│ All same characters "aaaa"    │ Longest unique substring = 1         │
│ All unique "abcdef"           │ Entire string is the answer          │
│ Negative numbers in subarray  │ DON'T use sliding window for sum!    │
│                               │ Use Prefix Sum + HashMap instead     │
│ Single element                │ Window of size 1 = that element      │
└───────────────────────────────┴──────────────────────────────────────┘
```

---

## 📋 PRACTICE PROBLEMS — From Your Excel Sheet

| # | Problem | Companies | Key Insight |
|---|---------|-----------|-------------|
| 1 | [Best Time to Buy and Sell Stock](https://leetcode.com/problems/best-time-to-buy-and-sell-stock/) | Amazon | Track min price, expand window |
| 2 | [Best Time to Buy and Sell Stock II](https://leetcode.com/problems/best-time-to-buy-and-sell-stock-ii/) | Salesforce | Greedy: take every uphill |

### Medium
| # | Problem | Companies | Key Insight |
|---|---------|-----------|-------------|
| 3 | [Subarray Sums Divisible by K](https://leetcode.com/problems/subarray-sums-divisible-by-k/) | — | Prefix sum + modulo HashMap |
| 4 | [Subarray Sum Equals K](https://leetcode.com/problems/subarray-sum-equals-k/) | Microsoft | Prefix sum + HashMap (NOT sliding window — has negatives!) |
| 5 | [Maximum Points from Cards](https://leetcode.com/problems/maximum-points-you-can-obtain-from-cards/) | Walmart | Reverse: minimize middle window |
| 6 | [Longest Repeating Character Replacement](https://leetcode.com/problems/longest-repeating-character-replacement/) | — | Window with max freq char tracking |

### Hard
| # | Problem | Companies | Key Insight |
|---|---------|-----------|-------------|
| 7 | [Sliding Window Maximum](https://leetcode.com/problems/sliding-window-maximum/) | — | Monotonic deque |
| 8 | [Minimum Window Substring](https://leetcode.com/problems/minimum-window-substring/) | Salesforce | HashMap + variable window, shrink to minimum |
| 9 | [Max Value of Equation](https://leetcode.com/problems/max-value-of-equation/) | Salesforce, Walmart | Sliding window + deque |

---

## ⚠️ COMMON MISTAKES

1. **Using sliding window with negatives** — Shrinking doesn't help! Use Prefix Sum + HashMap instead
2. **Not checking window validity** — Always verify `left <= right` after shrinking
3. **Forgetting to update answer** — Update AFTER shrinking, not before
4. **Fixed vs variable confusion** — If problem gives size → fixed. If asks "longest/shortest" → variable

---

## 📊 COMPLEXITY

| Pattern | Time | Space |
|---------|------|-------|
| Fixed window | O(n) | O(1) |
| Variable window | O(n) | O(1) |
| Window + HashMap | O(n) | O(k) where k = distinct elements |
| Window + Deque | O(n) | O(k) |

---

## 🎯 INTERVIEW ARTICULATION — How to Explain Sliding Window

**When the interviewer gives you a Sliding Window problem, say this:**

> "The brute force checks all O(n²) subarrays. Sliding window reduces to O(n) because instead of recomputing from scratch, we add the new right element and remove the old left element — maintaining a running result. Each element enters the window once and leaves once, so total operations are 2n = O(n). This is amortized O(1) per element."

**Key mathematical justification:**
- "The inner while-loop looks O(n²), but each element is pushed at most once and popped at most once across ALL iterations. Total work = 2n."
- "This only works when expanding the window monotonically changes the constraint (e.g., sum increases). With negative numbers, this invariant breaks — use prefix sums + HashMap instead."

**Common mistakes to proactively mention:**
- ❌ "Don't use sliding window for sum problems with negative numbers — the monotonicity assumption breaks."
- ❌ "Fixed window vs variable window: if the problem gives you K, it's fixed. If it says 'longest' or 'shortest,' it's variable."
- ❌ "Update your answer AFTER shrinking, not before — otherwise you report an invalid window state."

**Real-world applications:**
- Network throughput monitoring (requests per rolling time window)
- Rate limiting (max N requests per T seconds — sliding window counter)
- Stream processing (rolling averages in real-time analytics, e.g., stock price moving average)
- Log analysis (error rate in the last 5 minutes)

---

📖 **Related Chapters:**
- [04_Patterns_Templates/01_Sliding_Window.md](01_Sliding_Window.md) — Sliding Window deep dive
- [05_Problem_Solving/05_Sliding_Window.md](../05_Problem_Solving/05_Sliding_Window.md) — More window problems

---

## 🏋️ Practice & Interview Questions — Sliding Window

> Attempt each before looking at the answer. Time yourself.

### Predict / Trace
**Q1.** `arr = [2,1,5,1,3,2]`, k=3. Trace the fixed window — what's the max sum?
<details><summary>Answer</summary>

Initial: 2+1+5=8. Slide i=3: 8-2+1=7. Slide i=4: 7-1+3=9 ✅. Slide i=5: 9-5+2=6. Max = **9**.
</details>

**Q2.** `s = "aab"`. Longest substring without repeating characters?
<details><summary>Answer</summary>

2 — either "ab" (indices 1,2). The first 'a' at index 0 gets evicted when we hit the second 'a' at index 1. Window: "ab".
</details>

**Q3.** Sliding window with `[1, -1, 5]`, target sum = 3. Does variable window work?
<details><summary>Answer</summary>

No — negative numbers. When window sum > 3 (e.g. [1,-1,5]=5), shrink removes 1 → [-1,5]=4, still > 3, shrink removes -1 → [5]=5 > 3. We never find [1,-1,5] has elements summing to 3... but it does! Sliding window would miss [1,-1,5... no] actually this subarray sums to 5. But what about `[-1,5]`=4 or `[1,-1]`=0? Sliding window would fail on subarray sum = k type problems here.
</details>

### LeetCode / Coding
**Q4.** ⭐ Maximum Average Subarray of Length K.
<details><summary>Solution</summary>

```java
double sum = 0;
for (int i = 0; i < k; i++) sum += nums[i];
double max = sum;
for (int i = k; i < nums.length; i++) {
    sum += nums[i] - nums[i - k];
    max = Math.max(max, sum);
}
return max / k;
```
</details>

**Q5.** ⭐⭐ Longest Substring Without Repeating Characters.
<details><summary>Solution</summary>

```java
Set<Character> set = new HashSet<>();
int left = 0, max = 0;
for (int right = 0; right < s.length(); right++) {
    while (set.contains(s.charAt(right)))
        set.remove(s.charAt(left++));
    set.add(s.charAt(right));
    max = Math.max(max, right - left + 1);
}
return max;
```
</details>

**Q6.** ⭐⭐ Subarray Sum Equals K (has negatives — use prefix sum!).
<details><summary>Solution</summary>

```java
Map<Integer, Integer> map = new HashMap<>();
map.put(0, 1);
int prefix = 0, count = 0;
for (int num : nums) {
    prefix += num;
    count += map.getOrDefault(prefix - k, 0);
    map.merge(prefix, 1, Integer::sum);
}
return count;
```
</details>

**Q7.** ⭐⭐ Minimum Window Substring — find smallest window in s containing all chars of t.
<details><summary>Solution</summary>

```java
Map<Character,Integer> need = new HashMap<>(), window = new HashMap<>();
for (char c : t.toCharArray()) need.merge(c, 1, Integer::sum);
int l=0, valid=0, start=0, minLen=Integer.MAX_VALUE;
for (int r=0; r<s.length(); r++) {
    char c = s.charAt(r);
    if (need.containsKey(c)) {
        window.merge(c, 1, Integer::sum);
        if (window.get(c).equals(need.get(c))) valid++;
    }
    while (valid == need.size()) {
        if (r - l + 1 < minLen) { minLen = r - l + 1; start = l; }
        char d = s.charAt(l++);
        if (need.containsKey(d)) {
            if (window.get(d).equals(need.get(d))) valid--;
            window.merge(d, -1, Integer::sum);
        }
    }
}
return minLen == Integer.MAX_VALUE ? "" : s.substring(start, start + minLen);
```
</details>

**Q8.** ⭐⭐⭐ Sliding Window Maximum — max of each window of size k.
<details><summary>Solution</summary>

```java
// Monotonic deque stores indices of useful elements (in decreasing order of value)
Deque<Integer> dq = new ArrayDeque<>();
int[] res = new int[nums.length - k + 1];
for (int i = 0; i < nums.length; i++) {
    while (!dq.isEmpty() && dq.peekFirst() < i - k + 1) dq.pollFirst(); // remove out-of-window
    while (!dq.isEmpty() && nums[dq.peekLast()] < nums[i]) dq.pollLast(); // remove smaller
    dq.addLast(i);
    if (i >= k - 1) res[i - k + 1] = nums[dq.peekFirst()];
}
return res;
```
</details>

### Interview Questions
**Q9.** "At most K distinct" vs "exactly K distinct" — how do you convert between them?
<details><summary>Answer</summary>

`exact(K) = atMost(K) - atMost(K-1)`. The "at most K" version is easier (variable window is valid). By computing "at most K" minus "at most K-1", you isolate "exactly K". This trick converts many exact-count problems into two easier at-most problems. LC 992 uses this pattern.
</details>

**Q10.** When should you use a deque inside a sliding window?
<details><summary>Answer</summary>

When you need the **minimum or maximum** of the current window efficiently. A monotonic deque maintains elements in decreasing (for max) or increasing (for min) order. Adding new element: pop from back while back < new (for max-deque). Removing old element: pop from front if it equals the element leaving the window. Result: front of deque = window max. O(1) amortized per element. Used in: Sliding Window Maximum (LC 239), Longest Subarray with Limit (LC 1438).
</details>

### MCQ Rapid Fire — Sliding Window
| # | Question | Answer |
|---|---|---|
| 1 | Sliding window time complexity | O(N) |
| 2 | Sliding window works with negatives for sum? | No — use prefix sum |
| 3 | Fixed window — when to use? | When k (window size) is given |
| 4 | Variable window — when to use? | "Longest/shortest with condition" |
| 5 | Window + deque — what for? | Window min/max in O(1) |
| 6 | "Subarray sum = K with negatives" — correct approach | Prefix Sum + HashMap |
| 7 | Both left and right move forward only — true? | Yes — each moves at most N times |
| 8 | Update answer before or after shrinking? | After shrinking |

### 🧠 Deep Conceptual Questions — Sliding Window

**C1. Why does the "at most K distinct" trick work for counting exact subarrays?**
<details><summary>Deep Answer</summary>

`atMost(K)` counts all subarrays with AT MOST K distinct characters. `atMost(K) - atMost(K-1)` = subarrays with exactly K. This works because: let A = {subarrays with ≤ K distinct}, B = {subarrays with ≤ K-1 distinct}. A - B = {subarrays with exactly K distinct}. The "at most" version is solvable with standard variable window (monotonic constraint), while "exactly K" is not directly solvable with single window. This is a **counting by complementary sets** technique.
</details>

**C2. What is the fundamental difference between "shrink while invalid" and "shrink while can improve"?**
<details><summary>Deep Answer</summary>

**"Shrink while invalid"** (standard): shrink until the window satisfies the constraint again. Used for finding LONGEST valid window — we maximize by expanding and only shrinking when forced. **"Shrink while can improve"** (minimum window): shrink as long as the window is still valid, to find the SHORTEST valid window. The direction matters: longest = expand aggressively, shrink only when violated. Shortest = expand until valid, then shrink as much as possible before recording answer.
</details>

**C3. Sliding Window Maximum uses a deque. What makes it monotonic, and what invariant does it maintain?**
<details><summary>Deep Answer</summary>

The deque is **monotonically decreasing** (front = max). Invariant: all elements in the deque are potential future maximums. An element can never be the window max if there's a newer (more right) element that is ≥ it — because the larger element will still be in the window when the smaller one has expired. So we pop from the back whenever we add an element larger than the back. This maintains: `deque[0] ≥ deque[1] ≥ ... ≥ deque[last]`. Elements in the deque are always within the current window (front is evicted when it goes out of range).
</details>

> **Navigation**: [< Previous](08_Array_Plus_TwoPointers.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](10_HashMap_Plus_Counting.md)