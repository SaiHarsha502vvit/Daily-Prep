# 🧩 Array + Sliding Window — Pattern Guide

**Navigation**: [< Previous](08_Array_Plus_TwoPointers.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](10_HashMap_Plus_Counting.md)

## Array + Sliding Window — Combined Pattern Guide

### 🧠 Deep Intuition — Why Sliding Window Is O(n)

## 🔗 Bridge — Where This Chapter Fits

| Dimension | This chapter |
| --- | --- |
| **Builds on** | [Sliding Window](01_Sliding_Window.md), [Array + Two Pointers](08_Array_Plus_TwoPointers.md) |
| **You will learn** | Four question shapes hidden under "window" problems (fixed, longest, shortest, count) and the `right − left + 1` counting formula |
| **Leads to** | [Prefix Sum](26_Prefix_Sum_And_Difference_Array.md), [Monotonic patterns](11_Stack_Plus_MonotonicPattern.md) |
| **Abstraction level** | Window mechanics → **which of four question shapes?** |

> [!NOTE]
> The full gap-free reading order and dependency graph are in the [Learning Path](00_LEARNING_PATH.md).

---

## 💬 Explain It Like a Study Partner — Array + Sliding Window

### 1. The bottom line

Decide first whether you want the longest, the shortest, a fixed size or a count; the update order follows.

### 2. The textbook core

- Longest: record after shrinking until valid.
- Shortest: record while valid, then shrink.
- Count of valid windows ending at `right`: add `right − left + 1`.
- For character windows use a fixed-size count array plus a "matched" counter.

### 3. The real-world analogy

A **zoom lens**: wide when you need to see enough, narrow when you want the tightest frame.

### 4. Walkthrough

1. Count subarrays with sum < 7 in `[2,3,1,2,4]`.
2. Move `right`, shrink while sum ≥ 7.
3. At each `right`, add `right − left + 1` windows ending there.
4. Total counts every valid subarray exactly once.

> [!NOTE]
> **Quick check:** Why does `right − left + 1` count windows ending at `right`? *Every start from `left` to `right` yields a valid window.*

---

## Historical Evolution

*Shares its roots with [Sliding Window](01_Sliding_Window.md).*

**Inventor / Originator:** No single inventor. Moving averages were used in statistics long before computers; windowed protocols appeared in early computer networking (TCP's sliding-window flow control is specified in RFC 793, 1981); Van Jacobson's 1988 paper *Congestion Avoidance and Control* added congestion control on top of it.

**Predecessor context:** Before the pattern was named, running statistics were recomputed by re-scanning the whole window at each position, `O(n·k)`.

**Evolution narrative:** The key observation is that consecutive windows share all but two elements: **add the entering element, remove the leaving one**. The same idea reappeared in image processing (van Herk 1992 and Gil–Werman 1993 give `O(n)` running min/max filters independent of window size) and in data streams (Datar, Gionis, Indyk and Motwani, 2002, analysed statistics over sliding windows). Interview collections later grouped these problems under the name *sliding window*.

**Modern practice:** Stream processors such as Apache Flink and Kafka Streams expose window aggregations; TCP uses a window to bound data in flight; analytics dashboards use rolling averages.

- **Moving averages — early 20th century**: Smoothing time series by averaging a fixed-size window
- **TCP flow control — RFC 793, 1981**: A sender window limits unacknowledged data in flight
- **Jacobson — 1988**: Slow start and congestion avoidance adapt the window size to network conditions
- **van Herk 1992 / Gil–Werman 1993**: `O(n)` sliding minimum/maximum, the ancestor of the monotonic-deque technique
- **Datar et al. — 2002**: Formal treatment of statistics over sliding windows on streams

---

## Production Reality

> [!TIP]
> **Solution fails or is too slow?** Run the five-step [Pattern Mis-Selection Debug Workflow](00_PATTERN_MASTER_GUIDE.md#pattern-mis-selection-debug-workflow) before changing code: the bug is often the pattern, not the implementation.

**Pattern-Specific Failure Modes:**

- **Negatives make window sum non-monotonic — switch to prefix sum + hashmap** — When the array contains negative numbers, shrinking the window no longer guarantees the sum decreases. The monotonicity that makes sliding window work breaks. Detection: test with `[-1, 2, -3, 1]` and target sum `= 0`; sliding window fails because the sum can increase when shrinking.

- **Sliding window over `>= target` with negatives needs prefix sum + monotonic deque** — Standard sliding window works for exact sum targets with positive numbers only. For "find shortest subarray with sum >= K" with negatives, the problem requires prefix sum + monotonic deque to achieve O(n). Detection: test with `[-2, 1, -2, 3]` and target `>= 1` — standard window fails.

- **Window condition never satisfied causes unbounded growth** — If the constraint (e.g., "at most K distinct") is impossible to satisfy given the input, the shrink condition never triggers and the window grows to include the entire array. Detection: add a max window size assertion; log window size growth rate.

**Production Selection Heuristic:** Use sliding window only when all array values are positive (or the problem explicitly states non-negativity). When negatives appear, default to prefix sum + HashMap.

---

**WHY this combination?** When you need to find optimal **contiguous subarrays** or **substrings**, the sliding window maintains a running computation as it moves across the array. Reduces O(n²) brute force → O(n).

## ⚠️ Constraint Lens

| Given Constraints                             | Do This                                   |
| --------------------------------------------- | ----------------------------------------- |
| fixed size `k`                                | fixed window                              |
| all values positive + threshold condition     | variable sliding window                   |
| negatives allowed + exact sum `K`             | prefix sum + hashmap                      |
| negatives allowed + shortest sum at least `K` | prefix sum + monotonic deque              |
| exact `K` distinct                            | compute `atMost(K) - atMost(K-1)`         |
| values are binary (`0/1`)                     | window often works by counting zeros/ones |

Full map: [Constraint-Based Pattern Selection](25_Constraint_Based_Pattern_Selection.md).

## 🧠 Deep Intuition — Why Sliding Window Is O(n)

The brute force for "best contiguous subarray" problems checks all O(n²) subarrays (each starting point × each ending point) and evaluates each one. Sliding window reduces this to O(n) by making a crucial observation: **you don't need to recompute the entire subarray when you shift by one position.**

### The Amortized Analysis — Why It's Truly O(n)

Despite the nested `while (shrink)` loop inside the `for` loop, sliding window is NOT O(n²). Here's the rigorous argument:

- The `right` pointer advances from 0 to n-1: exactly **n increments**
- The `left` pointer also advances from 0 to at most n-1: at most **n increments total** (across all iterations of the outer loop, not per iteration)
- Therefore, the total work is O(n + n) = **O(n)**

Think of it this way: each element enters the window exactly once (when `right` reaches it) and leaves the window at most once (when `left` passes it). Total operations = 2n.

### Why Sliding Window FAILS With Negative Numbers

Sliding window for sum problems relies on a **monotonicity assumption**: expanding the window (moving `right`) always increases the sum, and shrinking (moving `left`) always decreases it. With negative numbers, adding an element might _decrease_ the sum, which breaks the invariant that "if the current window exceeds the target, we should shrink."

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

🔬 **Section Challenge — 🧠 WHEN TO RECOGNIZE THIS PATTERN**

**Challenge 1 (Reasoning):** A problem says "maximum sum of subarray with sum ≤ K, where array contains negative numbers." Why does sliding window fail here, and what's the correct approach?

<details><summary>Answer</summary>

Sliding window requires **monotonicity**: expanding the window must increase (or maintain) the sum, shrinking must decrease it. With negatives, expanding by adding a negative element _decreases_ the sum — breaking the invariant. The window shrink logic becomes incorrect: if `sum > K`, shrinking from left might not help if there are negatives in the middle. **Correct approach**: Prefix Sum + HashMap. Compute cumulative sums, then for each `prefix[r]`, find the largest `prefix[l]` such that `prefix[r] - prefix[l] ≤ K`. Sort prefix sums or use a TreeMap for O(N log N).

</details>

**Challenge 2 (Reasoning):** "Sliding window is O(N) because left and right each move at most N times." Prove this rigorously — the inner `while` loop looks like it could make it O(N²).

<details><summary>Answer</summary>

**Amortized argument**: Count total pointer movements. `right` starts at 0 and moves right N times total (one per outer loop iteration). `left` starts at 0 and can only move right (never left). Since `left ≤ right ≤ N-1` always, `left` moves at most N times _total_ across ALL iterations of the inner while loop — not N times per outer iteration. Total operations = right moves + left moves = N + N = 2N = O(N). The inner while loop's iterations are "paid for" by previous outer loop iterations that advanced `right`.

</details>

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

🔬 **Section Challenge — 🔬 VISUAL: Variable Window**

**Challenge (Design):** Count the number of subarrays with sum exactly K (array has negatives). Why can't you use sliding window? Write the correct approach.

<details><summary>Answer</summary>

Negatives break monotonicity. Correct approach: **Prefix Sum + HashMap**. `count += prefixMap.getOrDefault(prefix - k, 0)` as you build the running prefix sum. The map stores `{prefixSum → count of times seen}`. When `prefix[r] - prefix[l] == k`, we found a valid subarray `(l, r]`. Time: O(N), Space: O(N). This is LC 560 — the classic harder version after sliding window.

</details>

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

## 📋 Practice Problems

> [!NOTE]
> The *Companies* column lists employers that candidates have reported asking the problem. These tags are community-reported, change over time and are **not verified** — use them as hints about relevance, not as facts.

| #   | Problem                                                                                                 | Companies  | Key Insight                    |
| --- | ------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------ |
| 1   | [Best Time to Buy and Sell Stock](https://leetcode.com/problems/best-time-to-buy-and-sell-stock/)       | Amazon     | Track min price, expand window |
| 2   | [Best Time to Buy and Sell Stock II](https://leetcode.com/problems/best-time-to-buy-and-sell-stock-ii/) | Salesforce | Greedy: take every uphill      |

### Medium

| #   | Problem                                                                                                           | Companies | Key Insight                                                |
| --- | ----------------------------------------------------------------------------------------------------------------- | --------- | ---------------------------------------------------------- |
| 3   | [Subarray Sums Divisible by K](https://leetcode.com/problems/subarray-sums-divisible-by-k/)                       | —         | Prefix sum + modulo HashMap                                |
| 4   | [Subarray Sum Equals K](https://leetcode.com/problems/subarray-sum-equals-k/)                                     | Microsoft | Prefix sum + HashMap (NOT sliding window — has negatives!) |
| 5   | [Maximum Points from Cards](https://leetcode.com/problems/maximum-points-you-can-obtain-from-cards/)              | Walmart   | Reverse: minimize middle window                            |
| 6   | [Longest Repeating Character Replacement](https://leetcode.com/problems/longest-repeating-character-replacement/) | —         | Window with max freq char tracking                         |

### Hard

| #   | Problem                                                                             | Companies           | Key Insight                                  |
| --- | ----------------------------------------------------------------------------------- | ------------------- | -------------------------------------------- |
| 7   | [Sliding Window Maximum](https://leetcode.com/problems/sliding-window-maximum/)     | —                   | Monotonic deque                              |
| 8   | [Minimum Window Substring](https://leetcode.com/problems/minimum-window-substring/) | Salesforce          | HashMap + variable window, shrink to minimum |
| 9   | [Max Value of Equation](https://leetcode.com/problems/max-value-of-equation/)       | Salesforce, Walmart | Sliding window + deque                       |

---

## ⚠️ COMMON MISTAKES

1. **Using sliding window with negatives** — Shrinking doesn't help! Use Prefix Sum + HashMap instead
2. **Not checking window validity** — Always verify `left <= right` after shrinking
3. **Forgetting to update answer** — Update AFTER shrinking, not before
4. **Fixed vs variable confusion** — If problem gives size → fixed. If asks "longest/shortest" → variable

---

## 📊 COMPLEXITY

| Pattern          | Time | Space                            |
| ---------------- | ---- | -------------------------------- |
| Fixed window     | O(n) | O(1)                             |
| Variable window  | O(n) | O(1)                             |
| Window + HashMap | O(n) | O(k) where k = distinct elements |
| Window + Deque   | O(n) | O(k)                             |

---

## 🎯 INTERVIEW ARTICULATION — How to Explain Sliding Window

**When the interviewer gives you a Sliding Window problem, say this:**

"The brute force checks all O(n²) subarrays. Sliding window reduces to O(n) because instead of recomputing from scratch, we add the new right element and remove the old left element — maintaining a running result. Each element enters the window once and leaves once, so total operations are 2n = O(n). This is amortized O(1) per element."

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

## 🏢 Enterprise Lens — Array + Sliding Window

| Area | What top-tier engineering looks like |
| ---- | ------------------------------------ |
| **Where it runs in production** | Latency percentiles over recent requests, sensor smoothing, text search with constraints |
| **Failure modes** | Mixing update order (record before shrink vs after); using it with negative numbers |
| **Testing and verification** | Brute-force counting on random inputs; verify for each of the four shapes |

---

## Reality Check

**"Array + window problems always ask for the maximum window"** — Four distinct question shapes hide under this pairing, each with a different template detail: longest valid window (shrink only when invalid), shortest valid window (shrink WHILE valid — the inversion trips people), count of valid windows (add right - left + 1 per step, the least intuitive line in the catalog), and exists-a-valid-window (early return). Applying the longest template to a shortest problem produces code that compiles, runs, and returns the wrong extreme.

**"The count-subarrays formula right - left + 1 is a memorized trick"** — It has a derivation: when the window [left, right] is valid and the property is monotone under shrinking (every suffix-window ending at right is also valid), then exactly right - left + 1 valid subarrays END at right. Summing per right counts each valid subarray exactly once — by its right endpoint. If you can reproduce that sentence, you can also spot when it does NOT apply: properties not preserved under shrinking (exactly-k problems need the atMost(k) - atMost(k-1) transform).

**"Character-count windows need a HashMap"** — For fixed alphabets, a 26-slot int array plus a matched-count integer beats a HashMap in both speed and bug surface. The matched-count refinement (track how many characters currently satisfy their required frequency) turns the per-step validity check from O(26) to O(1) — the difference between passing and TLE on anagram-search problems with 10^5-length strings.

**"Prefix sums and sliding windows are competing techniques"** — They are the two halves of one decision: windows handle monotone properties in one pass with O(1) state; prefix sums handle NON-monotone aggregates (negatives, exact-target sums) by trading a HashMap of history for the monotonicity requirement. The interview tell: all-positive constraint means window; "may contain negative" means prefix + map. Constraint lines are the router.

**"A correct window solution is insensitive to update order"** — The add-check-shrink-record cycle has exactly one correct ordering per variant, and swapping two lines produces off-by-one windows that pass half the tests. The stable discipline: expand ALWAYS first, restore the invariant SECOND, record the answer LAST — and for shortest-window variants, record INSIDE the shrink loop instead. Two orderings, two variants, zero improvisation.
