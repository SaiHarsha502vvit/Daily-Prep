# Section 0 — When Sliding Window Goes Wrong in Production

> **Navigation**: [Chapter overview](../01_Sliding_Window.md) | [SLIDING WINDOW MASTERY - THE COMPLETE… →](02_sliding_window_mastery_the_complete_mental.md)
> Page 1 of 2 in **Sliding Window — Pattern Guide**


> These bugs stem from reaching for the right pattern but applying it wrong. Each story is a different failure mode.

---

## Story 1 — Fixed Window Used Where Variable Window Was Needed (O(n²) vs O(n))

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

## Story 2 — Forgot to Reset Window State Between Test Cases (Shared Mutable State)

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

## Story 3 — Off-By-One in Window Shrink Condition (the `<` vs `<=` Bug)

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

[Chapter overview](../01_Sliding_Window.md) | [SLIDING WINDOW MASTERY - THE COMPLETE… →](02_sliding_window_mastery_the_complete_mental.md)
