**Navigation**: [Back to Index](../00_MASTER_INDEX.md) | [Next >](02_Code_Templates.md)

---

## Section 0 — When Sliding Window Goes Wrong in Production

> These bugs stem from reaching for the right pattern but applying it wrong. Each story is a different failure mode.

---

### Story 1 — Fixed Window Used Where Variable Window Was Needed (O(n²) vs O(n))

A fintech team built a real-time fraud detection service: flag any account whose transactions sum to > $10,000 in any contiguous window of time. They implemented a fixed window: divide the day into 15-minute buckets, sum each bucket. An account could transfer $9,999 across bucket boundary (last second of minute 14, first second of minute 15) and never get flagged — the fraudsters figured this out within a week.

When they switched to "any contiguous 15-minute span," an engineer implemented a naive O(n²) scan of all possible start times:

```python
# ❌ O(n²) — scans all possible windows for every transaction
def is_fraud(transactions, window_secs=900):
    n = len(transactions)
    for i in range(n):
        total = 0
        for j in range(i, n):
            total += transactions[j].amount
            span = transactions[j].time - transactions[i].time
            if span > window_secs:
                break
            if total > 10_000:
                return True
    return False
# For 10,000 transactions/day → 100M iterations
```

Variable sliding window reduces this to O(n):

```python
# ✅ Variable window — O(n)
from collections import deque

def is_fraud(transactions, window_secs=900):
    window = deque()
    window_sum = 0
    for tx in transactions:
        window.append(tx)
        window_sum += tx.amount
        # Shrink left: remove transactions outside the time window
        while window and tx.time - window[0].time > window_secs:
            window_sum -= window.popleft().amount
        if window_sum > 10_000:
            return True
    return False
# O(n) — each transaction enters and leaves the deque exactly once
```

---

### Story 2 — Forgot to Reset Window State Between Test Cases (Shared Mutable State)

A developer implemented the "longest substring without repeating characters" solution using a global `char_set` and `left` pointer. In unit tests, each test case ran correctly in isolation. In the production batch job that processed 50,000 strings sequentially, the `char_set` and `left` pointer were never reset between strings — they accumulated state across calls. Results were wrong for every string after the first.

```python
# ❌ Shared state — window data leaks between calls
char_set = set()  # global — never reset!
left = 0          # global — never reset!

def longest_unique(s):
    global left, char_set
    max_len = 0
    for right in range(len(s)):
        while s[right] in char_set:
            char_set.remove(s[left])
            left += 1
        char_set.add(s[right])
        max_len = max(max_len, right - left + 1)
    return max_len
# Second call inherits char_set and left from first call → wrong answers

# ✅ Reset state at the top of each call
def longest_unique(s):
    char_set = set()   # local — reset on every call
    left = 0           # local — reset on every call
    max_len = 0
    for right in range(len(s)):
        while s[right] in char_set:
            char_set.remove(s[left])
            left += 1
        char_set.add(s[right])
        max_len = max(max_len, right - left + 1)
    return max_len
```

**Pattern rule**: Window state (`left`, `count`, `freq_map`, `window_sum`) must always be local to the function or explicitly reset. Global/class-level window state is almost always a bug.

---

### Story 3 — Off-By-One in Window Shrink Condition (the `<` vs `<=` Bug)

An engineer implemented "minimum window substring" with the shrink condition `while count_satisfied == need`. The condition was wrong by one: it should be `>=`. When `count_satisfied` temporarily exceeded `need` (because the frequency map allowed overshoot), the shrink loop terminated early. For most test strings this worked by accident — the happy path rarely overshot. But for strings like `"AABBA"` finding `"AB"`, the result was 1 character longer than optimal. The bug was in production for 4 months before a user noticed the search highlighting was off by one character.

```python
# ❌ == allows exactly-met but not overshot — shrink loop exits too early
while count_satisfied == need:
    update_answer()
    char_out = s[left]
    window_freq[char_out] -= 1
    if char_out in t_freq and window_freq[char_out] < t_freq[char_out]:
        count_satisfied -= 1
    left += 1

# ✅ >= handles both met AND overshot cases correctly
while count_satisfied >= need:
    update_answer()
    char_out = s[left]
    window_freq[char_out] -= 1
    if char_out in t_freq and window_freq[char_out] < t_freq[char_out]:
        count_satisfied -= 1
    left += 1
```

**Rule**: Variable window shrink conditions should almost always use `>=` (not `==`) when the window can overshoot validity. Think about what happens if two target characters appear consecutively — does `==` still exit the loop at the right time?

---

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

🔬 **Section Challenge — 🗺️ Pattern Recognition Header — Sliding Window**

**Challenge 1 (Reasoning):** Sliding window guarantees O(N). How? Each element is added and removed exactly how many times?

<details><summary>Answer</summary>

Each element enters the window exactly ONCE (right pointer advances past it) and leaves exactly ONCE (left pointer advances past it). Total operations: 2N regardless of window size changes. Compare to brute force: for each ending position, scan back to find optimal start = O(N²). The window's state (sum, freq map, etc.) is maintained INCREMENTALLY — O(1) per pointer move.

</details>

**Challenge 2 (Bug Hunt):** Minimum Window Substring: the while loop to shrink the window runs `while(valid) { shrink; }`. What's wrong with this logic?

<details><summary>Answer</summary>

Should shrink `while(valid)` to find the minimum window — this is correct! But the common bug: not updating `left++` BEFORE rechecking validity, or forgetting to update the answer BEFORE shrinking. The answer should be captured at the moment the window first becomes valid, then kept updated as we shrink to find smaller valid windows.

</details>

### Historical Evolution

**Inventor / Originator:** The sliding window technique evolved across multiple domains — signal processing in the 1960s, TCP congestion control by Van Jacobson (1988), and algorithmic formalization in Cormen-Leiserson-Rivest-Stein (CLRS, 1990).

**Predecessor context:** Before sliding windows, engineers computed running statistics by re-scanning the entire window for each position — O(n×k) time. This was acceptable for small windows but unacceptable for real-time signal processing or network packet analysis.

**Evolution narrative:** Signal processing engineers in the 1960s needed efficient ways to compute moving averages and filters over streaming data. They realized consecutive windows overlap significantly, and that overlap could be exploited: instead of recomputing from scratch, subtract the leaving element and add the entering element. This insight migrated into networking ( Jacobson 1988 for TCP retransmission windows) and then into algorithm textbooks as a formal pattern.

**Modern practice:** Sliding window underpins TCP congestion control, real-time analytics platforms (Apache Flink, Kafka Streams), and is the go-to pattern for any problem asking for statistics over the "last K elements" of a stream.

- **Signal processing — 1960s**: Moving average filters and digital signal processing (DSP) formalized the overlap-exploitation insight that became sliding window
- **TCP Sliding Window — Jacobson 1988**: "Congestion Avoidance and Control" paper introduced TCP windowing for flow control across networks
- **CLRS — 1990**: Cormen et al. codified the technique in the canonical algorithms textbook, naming it "sliding window"
- **Modern practice**: Real-time streaming systems (Kafka Streams, Apache Flink) use sliding windows for aggregations over time-series data

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

- **Negative numbers break sum-target sliding window** — When the array contains negatives, shrinking the window no longer guarantees sum decrease. The monotonicity assumption that makes sliding window work breaks. Detection: test with `[-1, 2, 3]` and target `2` — the correct answer is 2 subarrays, but sliding window may miss them. Fix: switch to prefix sum + HashMap.

- **Window grows unbounded when condition never met** — If the validation condition is never satisfied (e.g., `at most K distinct` where K is larger than the array), the while-loop to shrink never executes, and the window expands to cover the entire array. Detection: monitor window size growth with a log; unbounded growth indicates the condition is impossible.

- **Off-by-one in window size calculation** — Confusion between `right - left + 1` (element count) and `right - left` (gap). Fixed-size windows using `k` elements require `right - left + 1 == k`. Detection: test with single-element array and `k=1`; off-by-one causes index out of bounds or infinite loop.

- **Substring vs subarray confusion** — Sliding window assumes contiguous memory. For string problems requiring character reordering (anagrams), the window slides correctly. For problems requiring any-order matching (permutations), sliding window misses valid answers because it cannot capture non-contiguous character positions.

**Production Selection Heuristic:** Use sliding window when input values are guaranteed positive and the constraint explicitly requires contiguous subarrays/substrings with a monotonic objective (maximize count, minimize length).

---

# 🎯 SLIDING WINDOW MASTERY - THE COMPLETE MENTAL MODEL

---

## 📚 Part 0: Complete Understanding

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    SLIDING WINDOW - COMPLETE UNDERSTANDING                   │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHAT IS SLIDING WINDOW?                                                      │
├──────────────────────────────────────────────────────────────────────────────┤
│ A technique that maintains a "window" (subarray/substring) that "slides"     │
│ across the data structure, processing elements as the window moves.          │
│                                                                              │
│ Instead of recomputing everything for each window position, we:              │
│ • ADD the new element entering the window                                    │
│ • REMOVE the old element leaving the window                                  │
│ • UPDATE our answer                                                          │
│                                                                              │
│ This avoids redundant work!                                                  │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHAT PROBLEM DOES IT SOLVE?                                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│ CORE PROBLEM: Efficiently computing something over all contiguous subarrays  │
│                                                                              │
│ EXAMPLE: "Find maximum sum of any 3 consecutive elements"                    │
│ Array: [1, 4, 2, 10, 2, 3, 1, 0, 20]                                         │
│                                                                              │
│ BRUTE FORCE: For each starting position i, sum arr[i] to arr[i+2]            │
│ • Window 0-2: 1+4+2 = 7                                                      │
│ • Window 1-3: 4+2+10 = 16                                                    │
│ • Window 2-4: 2+10+2 = 14 ... and so on                                      │
│ Time: O(n × k) where k = window size                                         │
│                                                                              │
│ SLIDING WINDOW: Reuse previous sum!                                          │
│ • Window 0-2: sum = 1+4+2 = 7                                                │
│ • Window 1-3: sum = 7 - arr[0] + arr[3] = 7 - 1 + 10 = 16                    │
│ • Window 2-4: sum = 16 - arr[1] + arr[4] = 16 - 4 + 2 = 14                   │
│ Time: O(n) - each element added and removed exactly ONCE!                    │
│                                                                              │
│ REAL-WORLD APPLICATIONS:                                                     │
│ • Network: "Average packets per second over last 5 seconds"                  │
│ • Finance: "Moving average of stock price over 20 days"                      │
│ • DNA: "Find all substrings of length 10 with pattern X"                     │
│ • Streaming: "Process data chunks efficiently"                               │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHY IS SLIDING WINDOW EFFICIENT?                                             │
├──────────────────────────────────────────────────────────────────────────────┤
│ THE KEY INSIGHT: Consecutive windows OVERLAP!                                │
│                                                                              │
│ Window 1: [a, b, c] d, e, f                                                  │
│ Window 2:  a [b, c, d] e, f                                                  │
│               ↑  ↑                                                           │
│          SHARED! Don't recompute!                                            │
│                                                                              │
│ BRUTE FORCE WASTE:                                                           │
│ Window 1: compute(a) + compute(b) + compute(c)                               │
│ Window 2: compute(b) + compute(c) + compute(d)  ← b,c computed AGAIN!        │
│                                                                              │
│ SLIDING WINDOW EFFICIENCY:                                                   │
│ Window 1: result = f(a) + f(b) + f(c)                                        │
│ Window 2: result = result - f(a) + f(d)   ← Only compute what's NEW!         │
│                                                                              │
│ n elements, k window size:                                                   │
│ • Brute force: O(n×k) - recompute k elements for each of n windows           │
│ • Sliding window: O(n) - each element processed exactly twice (add+remove)   │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHEN TO USE SLIDING WINDOW?                                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│ ✅ USE SLIDING WINDOW WHEN (Signals in problem):                             │
│    • "Contiguous subarray/substring"                                         │
│    • "Of size k" or "at most k"                                              │
│    • "Maximum/minimum sum/length"                                            │
│    • "Contains all/distinct/at most k unique"                                │
│    • Data structure is linear (array, string)                                │
│    • Window moves in ONE direction (left to right)                           │
│                                                                              │
│ TWO TYPES:                                                                   │
│ 1. FIXED SIZE WINDOW: "subarray of size k"                                   │
│    → Window always has exactly k elements                                    │
│    → Simpler: just slide both pointers together                              │
│                                                                              │
│ 2. VARIABLE SIZE WINDOW: "longest/shortest subarray with condition"          │
│    → Window size changes based on condition                                  │
│    → Expand right pointer, shrink left pointer when condition violated       │
│                                                                              │
│ ❌ DON'T USE SLIDING WINDOW WHEN:                                             │
│    • Problem asks about non-contiguous elements                              │
│    • Order doesn't matter (use sorting/hashmap)                              │
│    • Need to find subarrays that aren't consecutive                          │
│    • Problem involves negative numbers with sum conditions (can be tricky)   │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ HOW DOES SLIDING WINDOW WORK?                                                │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ FIXED SIZE WINDOW TEMPLATE:                                                  │
│ ┌────────────────────────────────────────────────────────────────┐           │
│ │ 1. Initialize: Process first k elements (build first window)  │            │
│ │ 2. Slide: For each new position:                               │           │
│ │    a. Add new element (entering from right)                    │           │
│ │    b. Remove old element (leaving from left)                   │           │
│ │    c. Update answer                                            │           │
│ │ 3. Return answer                                               │           │
│ └────────────────────────────────────────────────────────────────┘           │
│                                                                              │
│ VARIABLE SIZE WINDOW TEMPLATE:                                               │
│ ┌────────────────────────────────────────────────────────────────┐           │
│ │ 1. left = 0, right = 0                                         │           │
│ │ 2. Expand right until condition met or window too big          │           │
│ │ 3. While condition violated:                                    │          │
│ │    a. Remove arr[left] from window                             │           │
│ │    b. Move left++                                              │           │
│ │ 4. Update answer if valid window                               │           │
│ │ 5. Move right++                                                │           │
│ │ 6. Repeat until right reaches end                              │           │
│ └────────────────────────────────────────────────────────────────┘           │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ DIFFICULTIES & COMMON MISTAKES                                               │
├──────────────────────────────────────────────────────────────────────────────┤
│ 1. OFF-BY-ONE ERRORS (Most Common!):                                         │
│    "Window has k elements" = j - i + 1 == k (NOT j - i == k!)                │
│    Solution: Count = rightIndex - leftIndex + 1                              │
│                                                                              │
│ 2. FORGETTING TO REMOVE WHEN SHRINKING:                                      │
│    Must undo the effect of element leaving window                            │
│    Sum window: sum -= arr[left]                                              │
│    Freq map: map[arr[left]]-- and remove if 0                                │
│                                                                              │
│ 3. VARIABLE WINDOW TERMINATION:                                              │
│    When to shrink? When to stop expanding?                                   │
│    Solution: Clear condition check before/after each operation               │
│                                                                              │
│ 4. NEGATIVE NUMBERS:                                                         │
│    "Max sum subarray" with negatives - sliding window doesn't work directly  │
│    Solution: Use Kadane's algorithm for that specific problem                │
│                                                                              │
│ 5. EDGE CASES:                                                               │
│    Empty array, k > array length, single element                             │
│    Solution: Always validate input first                                     │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ EXPECTED OUTPUTS & COMPLEXITY                                                │
├──────────────────────────────────────────────────────────────────────────────┤
│ TIME COMPLEXITY: O(n)                                                        │
│ • Each element is added to window exactly ONCE                               │
│ • Each element is removed from window at most ONCE                           │
│ • Total operations ≤ 2n → O(n)                                               │
│                                                                              │
│ SPACE COMPLEXITY:                                                            │
│ • Basic sliding window: O(1) - just pointers and running total               │
│ • With frequency map: O(k) or O(alphabet) for character problems             │
│                                                                              │
│ TYPICAL OUTPUT TYPES:                                                        │
│ • Single value: max/min sum, max/min length                                  │
│ • All windows: list of valid windows or their properties                     │
│ • Count: number of valid subarrays                                           │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## The Two Things Everyone Gets Wrong — Both Explained, Not Just Warned

The chapter above tells you sliding window is O(n) and that negatives are "tricky." Both deserve the *why*, because they're the two questions an interviewer uses to separate pattern-memorizers from people who understand.

### "Isn't it O(n²)? There's a `while` loop inside the `for` loop!"

This is the single most common doubt, and the answer is the most important amortization argument in all of pattern-based interviewing. Look at the variable-window skeleton:

```java
int left = 0;
for (int right = 0; right < n; right++) {   // outer: right moves n times
    add(arr[right]);
    while (windowInvalid()) {                // inner: looks like it could run n times each → O(n²)?
        remove(arr[left]);
        left++;
    }
    updateAnswer();
}
```

The naive fear: "for each of n `right` positions, the inner `while` could run up to n times → n × n = O(n²)." **Wrong, and here's the precise reason.** Don't count the inner loop *per outer iteration* — count `left`'s **total** movement across the *entire* run. `left` starts at 0, only ever **increases**, and can never exceed `n` (it can't pass `right`, which stops at n). So across the *whole algorithm*, the inner `while` body executes **at most n times total — not n times per outer step.**

```
right moves forward:  n times total      (the for loop)
left  moves forward:  ≤ n times total    (left only goes up, capped at n)
                      ─────────────
total pointer moves:  ≤ 2n  →  O(n)
```

The key shift in thinking: **amortized accounting charges the work to the pointer, not to the iteration.** Each element is added once (by `right`) and removed at most once (by `left`) — so each element is touched ≤ 2 times over the algorithm's *lifetime*, regardless of how the inner-loop bursts are distributed. Some `right` steps trigger a long shrink burst; most trigger none; but the bursts *sum* to ≤ n because there are only n elements `left` can ever march past. This is the exact same amortization that makes the monotonic stack/queue O(n) (each element pushed once, popped once) — recognize the pattern and you'll never miscount a two-pointer complexity again.

### Why negatives break it — and the precise property sliding window *requires*

The chapter says "negative numbers are tricky → use Kadane's." But *why*? Understanding this tells you, for any new problem, whether sliding window is even **legal** before you write a line.

Sliding window works only when the window has a **monotonic relationship with the constraint** — formally:

> **The validity precondition:** *growing* the window must move the quantity monotonically in one direction, so that once the window becomes invalid, the *only* way to fix it is to **shrink from the left** — and shrinking can *only* help, never hurt.

Concretely, "longest subarray with sum ≤ K, all numbers positive":
- Adding an element on the right → sum **only goes up** (positives). So if the window overshoots K, it's *definitely* too big, and removing from the left → sum **only goes down**. Shrinking is guaranteed to make progress toward valid. **Monotonic → sliding window is correct.**

Now allow **negatives**, same problem:
- Adding a right element might *decrease* the sum (a negative). So a window that overshot K could become valid *again by extending further right* — without shrinking at all. The core assumption ("once invalid, shrink to fix") is **false**. Worse: shrinking from the left might *remove a negative*, making the sum *go up* and the situation *worse*. The greedy "shrink when invalid" logic now gives wrong answers, silently. That's why you switch to **Kadane's** (which is really a different DP recurrence) or a **prefix-sum + hashmap** approach (which doesn't rely on monotonic shrinking).

> **The reusable test — apply it to any candidate problem:** *"If I extend the window, does my tracked quantity move in one consistent direction? And if the window goes invalid, is shrinking from the left guaranteed to recover validity?"* If **yes** to both → sliding window is valid and O(n). If **no** (negatives, or a non-monotonic constraint) → you need prefix sums, DP, or a different tool. This precondition — not the template — is what you're actually being tested on.

This is also exactly why the "at most K distinct characters" family works beautifully (adding a char can only *increase* distinct count, removing can only *decrease* it → monotonic), while "subarray summing to exactly K with negatives" does not.

---

## 🔥 THE CRITICAL CONFUSION (And How To Never Have It Again)

**This is the #1 confusion that stops 90% of students from mastering sliding window.**

---

## 🧠 THE WRONG WAY (How You Were Thinking Before)

```
"Should I use j < i + k or j <= i + k?"
"What about i + k - 1?"
"Why does the boundary keep confusing me?"
```

**Problem:** You're doing **index gymnastics** — trying to remember formulas.

---

## ✅ THE RIGHT WAY (How You Think Now)

```
"How many elements are currently in my window?"
```

**Solution:** Think in **element counts**, not indices.

---

## 🎨 VISUAL PROOF (The Moment It Clicks)

```
            SLIDING WINDOW - THE COMPLETE VISUAL GUIDE
──────────────────────────────────────────────────

Array: [2, 1, 5, 1, 3, 2]    Window Size K = 3
Index:  0  1  2  3  4  5

═══════════════════════════════════════════════════════════════════════

WINDOW 1: i=0, j=2
┌───┬───┬───┬───┬───┬───┐
│ 2 │ 1 │ 5 │ 1 │ 3 │ 2 │
└───┴───┴───┴───┴───┴───┘
  ↑       ↑
  i       j
├─────────┤
 window [2,1,5]

Count = j - i + 1 = 2 - 0 + 1 = 3 ✅ (equals k, process window!)

═══════════════════════════════════════════════════════════════════════

WINDOW 2: i=1, j=3 (after sliding)
┌───┬───┬───┬───┬───┬───┐
│ 2 │ 1 │ 5 │ 1 │ 3 │ 2 │
└───┴───┴───┴───┴───┴───┘
      ↑       ↑
      i       j
    ├─────────┤
     window [1,5,1]

Count = j - i + 1 = 3 - 1 + 1 = 3 ✅

═══════════════════════════════════════════════════════════════════════

WINDOW 3: i=2, j=4
┌───┬───┬───┬───┬───┬───┐
│ 2 │ 1 │ 5 │ 1 │ 3 │ 2 │
└───┴───┴───┴───┴───┴───┘
          ↑       ↑
          i       j
        ├─────────┤
         window [5,1,3]

Count = j - i + 1 = 4 - 2 + 1 = 3 ✅

═══════════════════════════════════════════════════════════════════════

WINDOW 4: i=3, j=5 (FINAL)
┌───┬───┬───┬───┬───┬───┐
│ 2 │ 1 │ 5 │ 1 │ 3 │ 2 │
└───┴───┴───┴───┴───┴───┘
              ↑       ↑
              i       j
            ├─────────┤
             window [1,3,2]

Count = j - i + 1 = 5 - 3 + 1 = 3 ✅

═══════════════════════════════════════════════════════════════════════

KEY INSIGHT: We NEVER thought about i+k or i+k-1!
Just: "Does my window have k elements? Check j-i+1 == k"

```

### Setup:

```
Array: [2, 1, 5, 1, 3, 2]
Index:  0  1  2  3  4  5

Window Size K = 3
```

### Count Elements, Not Indices:

```
Window at i=0, j=2:
[2, 1, 5] | _, _, _
 ↑     ↑
 i     j

Count = j - i + 1 = 2 - 0 + 1 = 3 ✅

Window at i=1, j=3:
_, [1, 5, 1] | _, _
    ↑     ↑
    i     j

Count = j - i + 1 = 3 - 1 + 1 = 3 ✅

Window at i=2, j=4:
_, _, [5, 1, 3] | _
       ↑     ↑
       i     j

Count = j - i + 1 = 4 - 2 + 1 = 3 ✅
```

**Notice:** We never had to think about `i + k` or `i + k - 1`!

---

## 🔗 THE EQUIVALENCE CHAIN (Memorize This)

```
            THE EQUIVALENCE CHAIN - WHY j-i+1=k WORKS
──────────────────────────────────────────────────

These THREE expressions are MATHEMATICALLY EQUIVALENT:

┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│     j - i + 1 = k       ← "Window has K elements" ⭐ BEST!           │
│           ↕                                                         │
│     j = i + k - 1       ← "j is at last valid position"             │
│           ↕                                                         │
│     j < i + k           ← "j hasn't crossed boundary"               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

Mathematical Proof:
──────────────────

Start with:      j - i + 1 = k

Rearrange:       j - i = k - 1
                 j = i + k - 1          (second form)

For loop condition, we want j to go from i to i+k-1:
That means:      j < i + k              (third form)

WHY THE FIRST IS BEST:
─────────────────────

❌ "j < i + k" → You think: "Wait, is it < or <=?"
❌ "j = i + k - 1" → You think: "Should I subtract 1?"
✅ "j - i + 1 = k" → You think: "Do I have k elements? Simple!"

The first form is a QUESTION, not a FORMULA.
Questions are easier to remember than formulas!
```

These three expressions mean **exactly** the same thing:

```
j - i + 1 = k          ← "Window has K elements" (BEST!)
     ⇕
j = i + k - 1          ← "j is at last valid position"
     ⇕
j < i + k              ← "j hasn't crossed boundary"
```

**Why the first is best:** You're counting, not calculating indices.

---

## 🧪 WHY THE OTHER FORMS CONFUSE YOU

```
            WHY OTHER FORMS ARE CONFUSING
──────────────────────────────────────────────────

Test Case: i = 0, k = 3
We want elements at indices: 0, 1, 2 (3 elements)

┌──────────────────────────────────────────────────────────────────────┐
│ USING j < i + k:                                                     │
│                                                                      │
│   j < 0 + 3                                                          │
│   j < 3                                                              │
│                                                                      │
│   Valid j: 0, 1, 2  ✅ (3 elements — CORRECT!)                        │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ USING j <= i + k:  ❌ WRONG                                           │
│                                                                      │
│   j <= 0 + 3                                                         │
│   j <= 3                                                             │
│                                                                      │
│   Valid j: 0, 1, 2, 3  ❌ (4 elements — TOO MANY!)                    │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ USING j < k:  ❌ WRONG (after first window)                           │
│                                                                      │
│   After i moves to 1:                                                │
│   j < 3                                                              │
│                                                                      │
│   Valid j: 0, 1, 2  ❌ (We need 1, 2, 3 now!)                         │
└──────────────────────────────────────────────────────────────────────┘

CONCLUSION: Only "j < i + k" works, but it's HARD to remember!
SOLUTION: Use "j - i + 1 == k" and NEVER think about it again!
```

### Test Case: i = 0, k = 3

#### 1. Using `j < i + k`:

```
j < 0 + 3
j < 3

Valid j: 0, 1, 2  ✅ (3 elements — correct!)
```

#### 2. Using `j <= i + k`: ❌ WRONG

```
j <= 0 + 3
j <= 3

Valid j: 0, 1, 2, 3  ❌ (4 elements — too many!)
```

#### 3. Using `j < k`: ❌ WRONG after first window

```
After i moves to 1:
j < 3

Valid j: 0, 1, 2  ❌ (We need 1, 2, 3!)
```

**Lesson:** Only `j < i + k` works, but it's hard to remember.

**Better:** Use `j - i + 1 == k` and never think about it again.

---

## ✅ THE EXAM-SAFE PATTERN

EXAM-SAFE SLIDING WINDOW TEMPLATE

int i = 0; // Window start (left pointer)

for (int j = 0; j < n; j++) { // j expands window (right pointer)

// STEP 1: EXPAND - Include arr[j] in window
// (add to sum, add to hashmap, etc.)

if (j - i + 1 == k) { // STEP 2: CHECK - "Do I have K elements?"

// STEP 3: PROCESS - Window is ready, do something
// (compare max, print result, etc.)

// STEP 4: SHRINK - Remove arr[i] from window
// (subtract from sum, remove from hashmap, etc.)

i++; // STEP 5: SLIDE - Move window forward
}
}

─────────────────────────────────────────────────────────────────────

WHY THIS IS PERFECT:

✅ You count elements (j - i + 1), not indices
✅ No confusion about < vs <=
✅ Clear 5-step process: EXPAND → CHECK → PROCESS → SHRINK → SLIDE
✅ Works for ANY window problem with small modifications

### Pattern 1: Count-Based (Recommended)

```java
int i = 0;  // Window start

for (int j = 0; j < n; j++) {  // j expands window

    // Include arr[j] in window

    if (j - i + 1 == k) {  // "Do I have K elements?"
        // Window is ready — process it

        // Example: print first element
        System.out.println(arr[i]);

        // Slide window forward
        i++;
    }
}
```

**Why This Is Perfect:**

1. ✅ You count elements (`j - i + 1`), not indices
2. ✅ No confusion about `<` vs `<=`
3. ✅ Works for any K
4. ✅ Window automatically slides when size reaches K
5. ✅ Matches how you think naturally

---

## 🎨 DRY RUN (Do This On Paper)

```
Array: [10, -1, 3, -2, 5], K=2

j=0: i=0, window=[10], count=0-0+1=1 (not ready)
j=1: i=0, window=[10,-1], count=1-0+1=2 ✅ PROCESS → i becomes 1
j=2: i=1, window=[-1,3], count=2-1+1=2 ✅ PROCESS → i becomes 2
j=3: i=2, window=[3,-2], count=3-2+1=2 ✅ PROCESS → i becomes 3
j=4: i=3, window=[-2,5], count=4-3+1=2 ✅ PROCESS → i becomes 4

Total windows processed: 4 = n - k + 1 = 5 - 2 + 1 ✅
```

---

## 🔧 OTHER VALID PATTERNS (Once You Understand)

### Pattern 2: Index-Based (Works but harder)

```java
// Time: O(N × K)
for (int i = 0; i <= n - k; i++) {

    for (int j = i; j < i + k; j++) {  // Note: j < i + k
        // Process arr[j]
    }
}
```

**When to use:** When problem explicitly needs nested loops.

### Pattern 3: Pre-Calculate + Slide

```java
// Time: O(N) - Optimal for sum/product
int sum = 0;

// First window
for (int i = 0; i < k; i++) {
    sum += arr[i];
}
System.out.println(sum);

// Slide window
for (int i = k; i < n; i++) {
    sum = sum - arr[i - k] + arr[i];  // Remove left, add right
    System.out.println(sum);
}
```

**When to use:** When you can optimize by reusing previous calculation.

---

## 🎯 EXAMPLE PROBLEMS USING COUNT-BASED THINKING

### Problem 1: First Negative in Each Window

```java
public static void firstNegativeInWindow(int[] arr, int k) {
    int n = arr.length;
    int i = 0;

    for (int j = 0; j < n; j++) {

        // Window ready?
        if (j - i + 1 == k) {

            // Find first negative
            boolean found = false;
            for (int idx = i; idx <= j; idx++) {
                if (arr[idx] < 0) {
                    System.out.println(arr[idx]);
                    found = true;
                    break;
                }
            }

            if (!found) {
                System.out.println("0");
            }

            i++;  // Slide
        }
    }
}

// Test: [12, -1, -7, 8, -15, 30, 16, 28], K=3
// Output: -1, -1, -7, -15, -15, 0
```

### Problem 2: Maximum in Each Window

```java
public static void maxInWindow(int[] arr, int k) {
    int i = 0;

    for (int j = 0; j < arr.length; j++) {

        if (j - i + 1 == k) {

            int max = Integer.MIN_VALUE;
            for (int idx = i; idx <= j; idx++) {
                max = Math.max(max, arr[idx]);
            }
            System.out.println(max);

            i++;
        }
    }
}

// Test: [1, 3, -1, -3, 5, 3, 6, 7], K=3
// Output: 3, 3, 5, 5, 6, 7
```

### Problem 3: Count Positives in Each Window

```java
public static void countPositivesInWindow(int[] arr, int k) {
    int i = 0;

    for (int j = 0; j < arr.length; j++) {

        if (j - i + 1 == k) {

            int count = 0;
            for (int idx = i; idx <= j; idx++) {
                if (arr[idx] > 0) count++;
            }
            System.out.println(count);

            i++;
        }
    }
}
```

---

## 🧠 THE MENTAL MODEL (Final Summary)

### Before Your Breakthrough:

```
"Let me remember... is it j < i+k or j <= i+k?"
→ Stress, confusion, mistakes
```

### After Your Breakthrough:

```
"How many elements? j - i + 1
When it equals k, I'm ready."
→ Confidence, clarity, correctness
```

---

## 🎓 PRACTICE CHECKLIST

Do these to lock in your understanding:

### ✅ Step 1: Dry Run These Arrays

```
Array: [5, 2, -1, 0, 3], K=3
Array: [1, -2, 3, -4, 5, 6], K=2
Array: [10, 20, 30, 40, 50], K=4
```

For each:

- Track `i`, `j`, and `j - i + 1`
- Note when window becomes ready
- Verify window slides correctly

### ✅ Step 2: Solve These Problems

1. Print sum of each window
2. Print first even number in each window
3. Count zeros in each window
4. Find minimum in each window

### ✅ Step 3: Challenge Yourself

- Can you convert the nested loop pattern to count-based?
- Can you explain why `j - i + 1 = k` works to a friend?
- Can you spot the mistake in code using `j <= i + k`?

---

## 🏆 SUCCESS INDICATORS

You've truly mastered sliding window when:

✅ You automatically think "How many elements?" instead of index bounds  
✅ You can dry-run any window problem in under 2 minutes  
✅ You feel confident during exams, not stressed  
✅ You can explain the pattern to others clearly  
✅ Level 4+ problems feel natural, not intimidating

---

## 🔥 FINAL WISDOM

**The formula `j < i + k` is correct, but it makes you think wrong.**

**The pattern `j - i + 1 == k` is also correct, and makes you think right.**

**Use the one that keeps your brain calm.**

---

## 📚 WHAT'S NEXT?

Now that sliding window is mastered, move to:

1. **Variable-size sliding window** (subarray sum = K)
2. **Two pointers** (pair sum, sorted arrays)
3. **Sliding window + HashMaps** (longest substring problems)

You're ready. 🚀

---

# 💪 Curated Practice Problems — Sliding Window & Two Pointers

**HOW TO USE**: Section 1 = fixed window (easiest). Section 2 = variable window. Section 3 = two pointers.
Master each section before moving to the next.

---

## Section 1: Fixed-Size Sliding Window

| #   | Problem                                | Platform | Difficulty | Key Technique            |
| --- | -------------------------------------- | -------- | ---------- | ------------------------ |
| 1   | Maximum Average Subarray I (LC 643)    | LeetCode | Easy       | Sum of window k, slide   |
| 2   | Find All Anagrams in a String (LC 438) | LeetCode | Medium     | Frequency map window = k |
| 3   | Permutation in String (LC 567)         | LeetCode | Medium     | Fixed window = len(s1)   |
| 4   | Maximum of All Subarrays of Size K     | GFG      | Medium     | Deque for sliding max    |
| 5   | Sliding Window Maximum (LC 239)        | LeetCode | Hard       | Monotonic deque          |

---

🔬 **Section Challenge — Section 1: Fixed-Size Sliding Window**

**Challenge 1 (Reasoning):** Sliding window guarantees O(N). How? Each element is added and removed exactly how many times?

<details><summary>Answer</summary>

Each element enters the window exactly ONCE (right pointer advances past it) and leaves exactly ONCE (left pointer advances past it). Total operations: 2N regardless of window size changes. Compare to brute force: for each ending position, scan back to find optimal start = O(N²). The window's state (sum, freq map, etc.) is maintained INCREMENTALLY — O(1) per pointer move.

</details>

**Challenge 2 (Bug Hunt):** Minimum Window Substring: the while loop to shrink the window runs `while(valid) { shrink; }`. What's wrong with this logic?

<details><summary>Answer</summary>

Should shrink `while(valid)` to find the minimum window — this is correct! But the common bug: not updating `left++` BEFORE rechecking validity, or forgetting to update the answer BEFORE shrinking. The answer should be captured at the moment the window first becomes valid, then kept updated as we shrink to find smaller valid windows.

</details>

## Section 2: Variable-Size Sliding Window

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

🔬 **Section Challenge — Section 2: Variable-Size Sliding Window**

**Challenge 1 (Reasoning):** Sliding window guarantees O(N). How? Each element is added and removed exactly how many times?

<details><summary>Answer</summary>

Each element enters the window exactly ONCE (right pointer advances past it) and leaves exactly ONCE (left pointer advances past it). Total operations: 2N regardless of window size changes. Compare to brute force: for each ending position, scan back to find optimal start = O(N²). The window's state (sum, freq map, etc.) is maintained INCREMENTALLY — O(1) per pointer move.

</details>

**Challenge 2 (Bug Hunt):** Minimum Window Substring: the while loop to shrink the window runs `while(valid) { shrink; }`. What's wrong with this logic?

<details><summary>Answer</summary>

Should shrink `while(valid)` to find the minimum window — this is correct! But the common bug: not updating `left++` BEFORE rechecking validity, or forgetting to update the answer BEFORE shrinking. The answer should be captured at the moment the window first becomes valid, then kept updated as we shrink to find smaller valid windows.

</details>

## Section 3: Two Pointers

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

🔬 **Section Challenge — Section 3: Two Pointers**

**Challenge 1 (Reasoning):** Two-pointer pattern reduces O(N²) brute force to O(N). What is the KEY invariant that makes this safe?

<details><summary>Answer</summary>

The invariant: all pairs we SKIP are guaranteed to not contain the answer. In 3Sum: once we fix `nums[i]` and use l/r pointers, we can safely skip because the array is sorted. If `sum > 0`: decreasing r decreases the sum (smaller right value). If `sum < 0`: increasing l increases the sum (larger left value). We never skip a valid pair because monotonicity guarantees it.

</details>

## HIDDEN GEMS — Sliding Window & Two Pointers

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

### 🔗 Cross-References — Navigate the Ecosystem

| Topic                             | Related Content                                                                |
| --------------------------------- | ------------------------------------------------------------------------------ |
| Sliding window practice           | [Problem Solving — Sliding Window](../05_Problem_Solving/05_Sliding_Window.md) |
| Arrays (underlying DS)            | [Arrays](../02_Data_Structures/01b_Arrays.md)                                  |
| Two Pointers (related)            | [Two Pointers Patterns](../04_Patterns_Templates/07_TwoPointers.md)            |
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

## Reality Check

**"Sliding window works on any subarray problem"** → Sliding window requires MONOTONICITY: extending the window must move the tracked property in one predictable direction (sum grows, distinct count grows or stays). "Subarray sum equals k" with NEGATIVE numbers breaks this — extending can shrink the sum — which is why that problem needs prefix sums + HashMap instead. Before reaching for a window, ask: does growing the window ever help AND hurt? If both, the window pattern silently produces wrong answers.

**"The window always moves one element at a time"** → The LEFT pointer can jump. In the classic no-repeat-substring problem, when you hit a duplicate of a character at index j, left jumps directly to j+1 via the stored index — not one step per loop. Implementations that shrink one-by-one still work but degrade to more iterations; implementations that jump need the max(left, lastSeen+1) guard or they move left BACKWARD, silently re-expanding the window.

**"Fixed-size and variable-size windows are the same template"** → Fixed-size windows have no inner while loop — you add one element, remove one element, record. Variable-size windows have an inner while that shrinks until the invariant is restored. Mixing the templates is the most common bug: adding an inner while to a fixed-size problem overcounts removals; forgetting it in a variable-size problem lets an invalid window report an answer.

**"Window state can always be a running sum"** → The state must support O(1) REMOVAL of the leaving element. Sums and counts do; max and min do NOT (removing the current max requires knowing the second max). That is exactly why sliding-window-maximum needs a monotonic deque as its state, not a variable. The pattern question is always: when arr[left] leaves, can I update the state without rescanning?

**"Two nested loops means it is O(n squared)"** → The sliding-window while-inside-for LOOKS quadratic but is O(n): left only moves forward, so across the entire run the inner loop executes at most n total iterations. This amortized argument is the one interviewers probe ("why is this linear?") — the answer is "each element enters the window once and leaves at most once," not anything about the loop structure.
