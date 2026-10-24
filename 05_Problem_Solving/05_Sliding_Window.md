# Sliding Window

> **Navigation**: [← Two Pointers](06_Two_Pointers.md) | [Chapter index](00_INDEX.md) | [Binary Search →](07_Binary_Search.md)

﻿**Navigation**: [< Previous](04_Arrays.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](06_Two_Pointers.md)


---

## 🔗 Bridge — Where This Chapter Fits

| Dimension | This chapter |
| --- | --- |
| **Builds on** | [Sliding Window pattern](../04_Patterns_Templates/01_Sliding_Window.md), [Arrays](04_Arrays.md) |
| **You will learn** | Fixed and variable windows, longest/shortest/count variants, character-count windows and window maximum |
| **Leads to** | [Two Pointers](06_Two_Pointers.md), [Prefix Sum problems](28_Prefix_Sum_Problems.md) |
| **Abstraction level** | Re-scan every window → **add one, remove one** |

> [!NOTE]
> The full gap-free reading order and dependency graph are in the [Learning Path](00_LEARNING_PATH.md).

---

## 💬 Explain It Like a Study Partner — Sliding Window Problems

### 1. The bottom line

Slide a window across the data, keeping a running summary updated in constant time.

### 2. The textbook core

- Fixed window: add `a[right]`, remove `a[right − k]`.
- Variable window: expand, then shrink while invalid.
- Longest vs shortest vs count differ only in *when* you record.
- Works for non-negative data or monotone conditions; use prefix sums with negatives.

### 3. The real-world analogy

A **moving spotlight** on a stage: it shows a fixed number of actors and shifts one step at a time.

### 4. Walkthrough

1. Longest substring without repeating characters in `"abcabcbb"`.
2. Expand `right`, store last positions.
3. On a repeat, move `left` past the previous occurrence.
4. Best window length is 3 (`"abc"`).

> [!NOTE]
> **Quick check:** Why does the inner `while` not make it `O(n²)`? *`left` only moves forward, so total pointer moves are at most `2n`.*


### 5. Check yourself

**Q1.** Longest substring without repeating characters in `"pwwkew"`?

<details><summary>Answer</summary>

**3** (`"wke"`).

</details>

**Q2.** Shortest subarray of `[2,3,1,2,4,3]` with sum ≥ 7?

<details><summary>Answer</summary>

**2** (`[4,3]`).

</details>

---


## 🗺️ Pattern Recognition Header — Sliding Window

**When do you use Sliding Window?** Use this decision table before every problem:

| Trigger Words                                 | Sub-Type               | Template                               |
| --------------------------------------------- | ---------------------- | -------------------------------------- |
| `fixed window of size k`                      | Fixed Window           | Add right, remove `arr[i-k]`           |
| `smallest/smallest subarray` + `sum ≥ target` | Variable Window        | Expand right, shrink left while valid  |
| `longest substring` + `at most k`             | Variable Window        | Expand right, shrink when > k distinct |
| `all windows`, `permutation in string`        | Fixed Window + HashMap | Compare freq arrays                    |

**The Core Idea:**

```
Instead of recomputing [i..j] from scratch each time → O(n²)
SLIDE: remove arr[left], add arr[right], update state → O(n)
```

- 📖 **Theory:** [01b_Arrays.md — Sub Arrays section](../02_Data_Structures/01b_Arrays.md)
- 📖 **Pattern deep dive:** [01_Sliding_Window.md](../04_Patterns_Templates/01_Sliding_Window.md)
- 📖 **Full Pattern Guide:** [00_PATTERN_MASTER_GUIDE.md](../04_Patterns_Templates/00_PATTERN_MASTER_GUIDE.md)

---

## 🎨 Section 4: Sliding Window Pattern Variants

---

## 📚 Topic Pages in This Chapter

This chapter is split into focused pages so each topic can be read on its own. Read them in order the first time; use the table to jump back later.

| # | Page | What is inside | Lines |
| --- | --- | --- | --- |
| 1 | [4.1 Fixed Size Window](05_Sliding_Window/01_fixed_size_window.md) | 4.1 Fixed Size Window | 188 |
| 2 | [4.2 Variable Size Window](05_Sliding_Window/02_variable_size_window.md) | 4.2 Variable Size Window | 252 |
| 3 | [4.3 Sliding Window — String Matching](05_Sliding_Window/03_sliding_window_string_matching.md) | 4.3 Sliding Window — String Matching · Competitive Programming — Codeforces Problems · Real-World Applications of Sliding Window | 441 |

## 🏢 Enterprise Lens — Sliding Window Problems

| Area | What top-tier engineering looks like |
| ---- | ------------------------------------ |
| **Where it runs in production** | Rate limiting, rolling metrics, streaming analytics |
| **Failure modes** | Applying it to data with negatives; recording before shrinking |
| **Testing and verification** | Brute force over all windows on random strings |

---

## Reality Check

**"This chapter repeats the pattern-template chapter"** → The template chapter teaches the MECHANISM; problem practice teaches the DISGUISES: fruit-into-baskets is at-most-2-distinct, max-consecutive-ones-III is at-most-k-zeros, substring-with-concatenation is a fixed window with word-granularity steps. The skill built here is de-costuming — mapping story nouns onto window state — which no amount of template fluency substitutes for. Different chapters, different muscles.

**"Window problems state their window explicitly"** → The hardest instances hide the window behind a TRANSFORM: min-operations-to-reduce-x-to-zero flips into longest-middle-window-summing-to-total-minus-x; count-subarrays-with-exactly-k becomes atMost(k) minus atMost(k-1); bounded-maximum counting subtracts two threshold windows. The move to train: when the direct question resists windows, ask whether its COMPLEMENT or a difference of two easier questions is a window.

**"Shrink means remove one element"** → Shrink means restore-the-invariant, and the loop shape encodes the guarantee: while-invalid-shrink gives longest-valid windows; while-VALID-shrink gives shortest-valid; and in jump-style problems the left boundary teleports. Choosing the wrong shrink policy still passes the sample (samples are friendly) and fails the extremes — the policy must be derived from which extreme the problem asks for, every single time.

**"Window state bugs come from complex state"** → They come from ASYMMETRIC updates: the add-to-window code and the remove-from-window code must be exact mirrors (increment/decrement the same counter, add/subtract the same contribution), and most bugs are a mirror term forgotten on the removal side — the distinct-count that never decrements, the matched-flag never unset. Audit technique: read only the add block and the remove block side by side; asymmetry is visible in ten seconds.

**"Practicing many window problems means learning many solutions"** → The productive practice loop is inverse: after solving, write the one-sentence INVARIANT ("window contains at most k distinct; answer is max length seen") and file the problem under that sentence. Twenty problems compress into five invariants. Practice that files by problem title produces recognition that fails on the twenty-first title; practice that files by invariant transfers.
