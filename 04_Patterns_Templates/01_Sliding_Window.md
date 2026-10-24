# 🧩 Sliding Window — Pattern Guide

> **Navigation**: [← LeetCode ↔ Real-World Map](05_LeetCode_RealWorld_Map.md) | [Chapter index](00_INDEX.md) | [Binary Search Patterns →](06_Binary_Search_Patterns.md)

---

## 📚 Topic Pages in This Chapter

This chapter is split into focused pages so each topic can be read on its own. Read them in order the first time; use the table to jump back later.

| # | Page | What is inside | Lines |
| --- | --- | --- | --- |
| 1 | [Section 0 — When Sliding Window Goes Wrong in Production](01_Sliding_Window/01_section_0_when_sliding_window_goes.md) | Section 0 — When Sliding Window Goes Wrong in… | 119 |
| 2 | [SLIDING WINDOW MASTERY - THE COMPLETE MENTAL MODEL](01_Sliding_Window/02_sliding_window_mastery_the_complete_mental.md) | Complete Understanding · The Two Things Everyone Gets Wrong — Both… · THE CRITICAL CONFUSION (And How To Never Have… · THE WRONG WAY (How You Were Thinking Before) · THE RIGHT WAY (How You Think Now) · … | 779 |

## 🗺️ Pattern Recognition Header — Sliding Window

**How do I know this is a Sliding Window problem?**

| Signal in problem                            | Sub-pattern               | Template                                    |
| -------------------------------------------- | ------------------------- | ------------------------------------------- |
| `"subarray/substring of size k"`             | **Fixed Window**          | `if (j-i+1 == k) { process; i++; }`         |
| `"longest/shortest subarray with condition"` | **Variable Window**       | `expand right; while invalid: shrink left`  |
| `"at most K distinct / at most K condition"` | **Variable + Freq Map**   | `HashMap + shrink when freq violates`       |
| `"sum equals K"` (positive only)             | **Variable Window**       | `sum>target → shrink; sum==target → answer` |
| `"minimum window substring"`                 | **Variable + 2 counters** | `have/need counters + HashMap`              |

**The rule that never fails:**

```
"contiguous" + "optimize length or value" = Sliding Window
Each element enters window ONCE and leaves ONCE → O(n)

Fixed window:    j - i + 1 == k        ← count elements, not indices!
Variable window: expand right, shrink left while invalid
```

### ⚠️ Constraint Lens — When Sliding Window Is NOT Correct

| Constraint / Condition                                         | Sliding Window? | Better Pattern               |
| -------------------------------------------------------------- | --------------- | ---------------------------- |
| fixed window size `k`                                          | yes             | fixed window                 |
| all numbers positive and condition is `sum <= K` or `sum >= K` | yes             | variable window              |
| negative numbers allowed and target is exact sum               | no              | prefix sum + hashmap         |
| negative numbers allowed and shortest sum `>= K`               | no              | prefix sum + monotonic deque |
| exact `K` distinct chars/items                                 | indirect        | `atMost(K) - atMost(K-1)`    |
| online range updates/queries                                   | no              | Fenwick / segment tree       |

Full map: [Constraint-Based Pattern Selection](25_Constraint_Based_Pattern_Selection.md).

🔗 **Practice problems here:** [Sliding Window PS](../05_Problem_Solving/05_Sliding_Window.md)
📖 **Algo connection:** [Sorting (why arrays must be structured)](../03_Algorithms/02a_Sorting_Fundamentals.md)
📋 **All Patterns Hub:** [00_PATTERN_MASTER_GUIDE.md](00_PATTERN_MASTER_GUIDE.md)

---

**Challenge 2 (Bug Hunt):** Minimum Window Substring: the while loop to shrink the window runs `while(valid) { shrink; }`. What's wrong with this logic?

<details><summary>Answer</summary>

Should shrink `while(valid)` to find the minimum window — this is correct! But the common bug: not updating `left++` BEFORE rechecking validity, or forgetting to update the answer BEFORE shrinking. The answer should be captured at the moment the window first becomes valid, then kept updated as we shrink to find smaller valid windows.

</details>

## 🔗 Bridge — Where This Chapter Fits

| Dimension | This chapter |
| --- | --- |
| **Builds on** | [Arrays](../02_Data_Structures/01b_Arrays.md), loops, [Algorithm Thinking](../03_Algorithms/01_Algorithm_Thinking.md) |
| **You will learn** | Fixed and variable windows, the add-check-shrink-record cycle, why the inner `while` is still `O(n)`, and when negatives break the pattern |
| **Leads to** | [Array + Sliding Window](09_Array_Plus_SlidingWindow.md), [Prefix Sum](26_Prefix_Sum_And_Difference_Array.md), [Monotonic Stack/Queue](11_Stack_Plus_MonotonicPattern.md) |
| **Abstraction level** | Brute-force re-scan of every window → **reuse the overlap** (add one, remove one) → a window invariant |

> [!NOTE]
> The full gap-free reading order and dependency graph are in the [Learning Path](00_LEARNING_PATH.md).

---

## 💬 Explain It Like a Study Partner — Sliding Window

### 1. The bottom line

Instead of re-reading every window from scratch, slide it: add the new element, drop the old one, and keep a running answer.

### 2. The textbook core

- A **window** is a contiguous range `[left, right]` over an array or string.
- **Fixed window** of size `k`: add `a[right]`, remove `a[right-k]`.
- **Variable window:** expand `right`; while the window violates the condition, advance `left`; record the best window.
- Each index enters and leaves the window at most once, so the total work is `O(n)` even with a nested `while`.
- Requires a **monotone condition**: shrinking never makes an invalid window valid. Negative numbers break "sum ≥ target" windows.

### 3. The real-world analogy

A **train carriage of fixed length** rolling along a platform: each step one passenger boards and one leaves, so you never recount everyone.

### 4. Walkthrough

1. Array `[2, 1, 5, 1, 3, 2]`, `k = 3`, find the maximum window sum.
2. First window `[2,1,5]` = 8.
3. Slide: add 1, remove 2 → 7; add 3, remove 1 → 9; add 2, remove 5 → 6.
4. Best = 9, found with `n − k + 1` constant-time updates.

> [!NOTE]
> **Quick check:** Why can you not use a variable window for "longest subarray with sum = k" when values can be negative? *Shrinking can make the sum go up, so the monotone property fails — use prefix sums + a hash map.*


### 5. Check yourself

**Q1.** Array `[4,2,1,7,8,1,2,8,1,0]`, `k = 3`: what is the maximum window sum, and which windows reach it?

<details><summary>Answer</summary>

**16** — the windows `[1,7,8]` and `[7,8,1]`. Sums in order: 7, 10, 16, 16, 11, 11, 11, 9.

</details>

**Q2.** The variable-window template has a `while` inside a `for`. Why is it still `O(n)`?

<details><summary>Answer</summary>

`left` only moves forward and never exceeds `right`, so across the whole run both pointers move at most `n` steps: about `2n` operations in total.

</details>

**Q3.** Longest substring without repeating characters in `"abcabcbb"`?

<details><summary>Answer</summary>

**3** (`"abc"`). When the second `a` arrives, shrink from the left until the duplicate is gone; the best length seen stays 3.

</details>

---

## Historical Evolution

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

- **Negative numbers break sum-target sliding window** — When the array contains negatives, shrinking the window no longer guarantees sum decrease. The monotonicity assumption that makes sliding window work breaks. Detection: test with `[-1, 2, 3]` and target `2` — the correct answer is 2 subarrays, but sliding window may miss them. Fix: switch to prefix sum + HashMap.

- **Window grows unbounded when condition never met** — If the validation condition is never satisfied (e.g., `at most K distinct` where K is larger than the array), the while-loop to shrink never executes, and the window expands to cover the entire array. Detection: monitor window size growth with a log; unbounded growth indicates the condition is impossible.

- **Off-by-one in window size calculation** — Confusion between `right - left + 1` (element count) and `right - left` (gap). Fixed-size windows using `k` elements require `right - left + 1 == k`. Detection: test with single-element array and `k=1`; off-by-one causes index out of bounds or infinite loop.

- **Substring vs subarray confusion** — Sliding window assumes contiguous memory. For string problems requiring character reordering (anagrams), the window slides correctly. For problems requiring any-order matching (permutations), sliding window misses valid answers because it cannot capture non-contiguous character positions.

**Production Selection Heuristic:** Use sliding window when input values are guaranteed positive and the constraint explicitly requires contiguous subarrays/substrings with a monotonic objective (maximize count, minimize length).

---

## 💪 Curated Practice Problems — Sliding Window & Two Pointers

**HOW TO USE**: Section 1 = fixed window (easiest). Section 2 = variable window. Section 3 = two pointers.
Master each section before moving to the next.

---

### Section 1: Fixed-Size Sliding Window

| #   | Problem                                | Platform | Difficulty | Key Technique            |
| --- | -------------------------------------- | -------- | ---------- | ------------------------ |
| 1   | Maximum Average Subarray I (LC 643)    | LeetCode | Easy       | Sum of window k, slide   |
| 2   | Find All Anagrams in a String (LC 438) | LeetCode | Medium     | Frequency map window = k |
| 3   | Permutation in String (LC 567)         | LeetCode | Medium     | Fixed window = len(s1)   |
| 4   | Maximum of All Subarrays of Size K     | GFG      | Medium     | Deque for sliding max    |
| 5   | Sliding Window Maximum (LC 239)        | LeetCode | Hard       | Monotonic deque          |

---

### Section 2: Variable-Size Sliding Window

| #   | Problem                                            | Platform | Difficulty | Key Technique                 |
| --- | -------------------------------------------------- | -------- | ---------- | ----------------------------- |
| 1   | Longest Substring Without Repeating (LC 3)         | LeetCode | Medium     | HashSet + shrink on duplicate |
| 2   | Minimum Size Subarray Sum (LC 209)                 | LeetCode | Medium     | Shrink while sum >= target    |
| 3   | Longest Repeating Character Replacement (LC 424)   | LeetCode | Medium     | Window - maxFreq <= k         |
| 4   | Max Consecutive Ones III (LC 1004)                 | LeetCode | Medium     | Flip at most k zeros          |
| 5   | Fruit Into Baskets (LC 904)                        | LeetCode | Medium     | At most 2 distinct fruits     |
| 6   | Minimum Window Substring (LC 76)                   | LeetCode | Hard       | Shrink to find minimum valid  |
| 7   | Subarrays with K Different Integers (LC 992)       | LeetCode | Hard       | atMost(k) - atMost(k-1) trick |
| 8   | Longest Substring with At Most K Distinct (LC 340) | LeetCode | Medium     | HashMap count distinct        |

---

### Section 3: Two Pointers

| #   | Problem                                     | Platform | Difficulty | Key Technique                     |
| --- | ------------------------------------------- | -------- | ---------- | --------------------------------- |
| 1   | Two Sum II - Sorted (LC 167)                | LeetCode | Medium     | Left+right converge               |
| 2   | 3Sum (LC 15)                                | LeetCode | Medium     | Fix one + two-pointer on rest     |
| 3   | Container With Most Water (LC 11)           | LeetCode | Medium     | Move shorter pointer inward       |
| 4   | Trapping Rain Water (LC 42)                 | LeetCode | Hard       | Two pointer with leftMax/rightMax |
| 5   | Sort Colors (LC 75)                         | LeetCode | Medium     | Dutch National Flag 3-way         |
| 6   | Remove Duplicates from Sorted Array (LC 26) | LeetCode | Easy       | Slow/fast pointer                 |
| 7   | Move Zeroes (LC 283)                        | LeetCode | Easy       | Partition pointer                 |
| 8   | Squares of a Sorted Array (LC 977)          | LeetCode | Easy       | Two pointers from both ends       |

---

### HIDDEN GEMS — Sliding Window & Two Pointers

| #   | Problem                                             | Platform | Why It's Valuable                    |
| --- | --------------------------------------------------- | -------- | ------------------------------------ |
| 1   | Count Number of Nice Subarrays (LC 1248)            | LeetCode | atMost trick with odd numbers        |
| 2   | Replace the Substring for Balanced String (LC 1234) | LeetCode | Min window where outside is balanced |
| 3   | Grumpy Bookstore Owner (LC 1052)                    | LeetCode | Fixed window on top of prefix sum    |
| 4   | Longest Turbulent Subarray (LC 978)                 | LeetCode | Alternating comparison window        |
| 5   | Maximum Points You Can Obtain from Cards (LC 1423)  | LeetCode | Min subarray trick (complement)      |
| 6   | Get Equal Substrings Within Budget (LC 1208)        | LeetCode | Variable window with cost constraint |

---

_Created: January 24, 2026_  
_Based on your breakthrough understanding_

#### 🔗 Cross-References — Navigate the Ecosystem

| Topic                             | Related Content                                                                |
| --------------------------------- | ------------------------------------------------------------------------------ |
| Sliding window practice           | [Problem Solving — Sliding Window](../05_Problem_Solving/05_Sliding_Window.md) |
| Arrays (underlying DS)            | [Arrays](../02_Data_Structures/01b_Arrays.md)                                  |
| Two Pointers (related)            | [Two Pointers Patterns](07_Two_Pointers_Complete.md)            |
| HashMaps in variable window       | [HashTable](../02_Data_Structures/01e_HashTable.md)                            |
| Sliding window in ML (mini-batch) | [ML Fundamentals](../25_Python_ML_DL_NLP/05_ML_Fundamentals.md)                |

---

**Navigation**: [Back to Index](../00_MASTER_INDEX.md) | [Next >](02_Code_Templates.md)

🔬 **Section Challenge — HIDDEN GEMS — Sliding Window & Two Pointers**

**Challenge 1 (Reasoning):** Two-pointer pattern reduces O(N²) brute force to O(N). What is the KEY invariant that makes this safe?

<details><summary>Answer</summary>

The invariant: all pairs we SKIP are guaranteed to not contain the answer. In 3Sum: once we fix `nums[i]` and use l/r pointers, we can safely skip because the array is sorted. If `sum > 0`: decreasing r decreases the sum (smaller right value). If `sum < 0`: increasing l increases the sum (larger left value). We never skip a valid pair because monotonicity guarantees it.

</details>


---

## 🏢 Enterprise Lens — Sliding Window

| Area | What top-tier engineering looks like |
| ---- | ------------------------------------ |
| **Where it runs in production** | Rolling metrics (error rate over the last 5 minutes), rate limiters, stream aggregations, log analysis |
| **Failure modes** | Using a window when negatives or non-monotone conditions exist; forgetting to reset state between calls; off-by-one in the shrink condition (`<` vs `<=`) |
| **Testing and verification** | Compare against the `O(n·k)` brute force on random arrays; test `k = 1`, `k = n`, empty input, all-equal values, negatives |

---

## Reality Check

**"Sliding window works on any subarray problem"** → Sliding window requires MONOTONICITY: extending the window must move the tracked property in one predictable direction (sum grows, distinct count grows or stays). "Subarray sum equals k" with NEGATIVE numbers breaks this — extending can shrink the sum — which is why that problem needs prefix sums + HashMap instead. Before reaching for a window, ask: does growing the window ever help AND hurt? If both, the window pattern silently produces wrong answers.

**"The window always moves one element at a time"** → The LEFT pointer can jump. In the classic no-repeat-substring problem, when you hit a duplicate of a character at index j, left jumps directly to j+1 via the stored index — not one step per loop. Implementations that shrink one-by-one still work but degrade to more iterations; implementations that jump need the max(left, lastSeen+1) guard or they move left BACKWARD, silently re-expanding the window.

**"Fixed-size and variable-size windows are the same template"** → Fixed-size windows have no inner while loop — you add one element, remove one element, record. Variable-size windows have an inner while that shrinks until the invariant is restored. Mixing the templates is the most common bug: adding an inner while to a fixed-size problem overcounts removals; forgetting it in a variable-size problem lets an invalid window report an answer.

**"Window state can always be a running sum"** → The state must support O(1) REMOVAL of the leaving element. Sums and counts do; max and min do NOT (removing the current max requires knowing the second max). That is exactly why sliding-window-maximum needs a monotonic deque as its state, not a variable. The pattern question is always: when arr[left] leaves, can I update the state without rescanning?

**"Two nested loops means it is O(n squared)"** → The sliding-window while-inside-for LOOKS quadratic but is O(n): left only moves forward, so across the entire run the inner loop executes at most n total iterations. This amortized argument is the one interviewers probe ("why is this linear?") — the answer is "each element enters the window once and leaves at most once," not anything about the loop structure.
