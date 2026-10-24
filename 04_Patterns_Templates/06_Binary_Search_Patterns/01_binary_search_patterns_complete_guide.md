# 🔍 Binary Search Patterns Complete Guide

> **Navigation**: [Chapter overview](../06_Binary_Search_Patterns.md) | [The 3 Templates (MEMORIZE!) →](02_the_3_templates_memorize.md)
> Page 1 of 4 in **Binary Search Patterns — Pattern Guide**


Master Every Variation of the Most Powerful Search Technique

## Table of Contents

1. [Binary Search Fundamentals](#fundamentals)
2. [The 3 Templates (MEMORIZE!)](02_the_3_templates_memorize.md#templates)
3. [Lower Bound & Upper Bound](02_the_3_templates_memorize.md#bounds)
4. [Search in Rotated Array](03_search_in_rotated_array.md#rotated)
5. [Peak Finding Patterns](03_search_in_rotated_array.md#peak-finding)
6. [Binary Search on Answer](04_binary_search_on_answer.md#binary-answer)
7. [2D Binary Search](04_binary_search_on_answer.md#2d-search)
8. [Advanced Patterns](04_binary_search_on_answer.md#advanced)
9. [Common Mistakes](04_binary_search_on_answer.md#mistakes)
10. [Interview Problems](04_binary_search_on_answer.md#interview-problems)
11. [Quick Reference](04_binary_search_on_answer.md#quick-reference)

---

## Binary Search Fundamentals <a name="fundamentals"></a>

### The Core Idea

BINARY SEARCH IN ONE SENTENCE

"If the search space is MONOTONIC (sorted/ordered),
eliminate HALF of it each step."

Time: O(log n) — From 1 billion → 30 comparisons

### Visual: Why Binary Search is Fast

**Linear Search on 1,000,000 elements**

```text
Worst case: 1,000,000 comparisons
Average: 500,000 comparisons
```

**Binary Search on 1,000,000 elements**

**1,000,000 → 500,000 → 250,000 → 125,000 →**

```text
62,500 → 31,250 → 15,625 → 7,812 → 3,906 →
1,953 → 976 → 488 → 244 → 122 → 61 →
30 → 15 → 7 → 3 → 1

Only ~20 comparisons! (log₂(1,000,000) ≈ 20)
```

### Prerequisites for Binary Search

**BINARY SEARCH APPLICABILITY**

```text
You need ONE of these properties:

1. SORTED ARRAY
   - Ascending or descending
   - Search for specific value or boundary

2. MONOTONIC FUNCTION
   - f(x) is always increasing or always decreasing
   - Search for value where f(x) crosses threshold

3. SEARCH SPACE WITH BINARY PROPERTY
   - Can eliminate half based on some condition
   - "Binary search on answer"
```

---

## Stop Memorizing Templates — Define the Invariant, and the Bugs Vanish

Everyone says "binary search is easy, then I spend 30 minutes fighting `lo <= hi` vs `lo < hi` and `mid` vs `mid+1`." That fight only happens because you're *guessing* at the boundary rules instead of *deriving* them. There is one discipline that makes every off-by-one decision forced rather than guessed. Learn this once and never debug a binary search again.

### The discipline: write down what `[lo, hi]` *means*, then never violate it

Before writing the loop, commit to an **invariant** — a sentence that is true at every iteration about where the answer can be. The two industrial-strength choices:

**Choice A — closed interval `[lo, hi]`: "if the answer exists, it is somewhere in `arr[lo..hi]` inclusive."**

```java
int lo = 0, hi = n - 1;           // answer could be anywhere → hi is a VALID index
while (lo <= hi) {                // [lo, hi] non-empty includes lo == hi (one candidate left)
    int mid = lo + (hi - lo) / 2;
    if (arr[mid] == target) return mid;
    else if (arr[mid] < target) lo = mid + 1;   // mid ruled out → EXCLUDE it
    else                        hi = mid - 1;    // mid ruled out → EXCLUDE it
}
return -1;                        // [lo, hi] became empty → not present
```

Now watch how the invariant *forces* every decision you used to guess:

- **Why `hi = n - 1`?** Because the invariant says hi is a valid index where the answer *could* be. Index `n` doesn't exist, so hi starts at `n-1`. If you'd written `hi = n`, you'd be claiming a nonexistent slot might hold the answer — instant out-of-bounds.
- **Why `lo <= hi` (not `<`)?** Because `[lo, hi]` with `lo == hi` still contains **one** unchecked candidate. Stopping at `lo < hi` would skip it — the classic "works except when the target is the last element standing" bug. The loop must continue while the interval is non-empty, and a closed interval is non-empty exactly when `lo <= hi`.
- **Why `mid + 1` and `mid - 1` (not `mid`)?** Because we just *checked* `arr[mid]` and it wasn't the answer. The invariant says `[lo, hi]` holds candidates that *might* be the answer — so the ruled-out `mid` must be **excluded** from the next interval. Writing `lo = mid` keeps a dead candidate in the range → the interval stops shrinking when `lo` and `hi` are adjacent → **infinite loop.** Every binary-search infinite loop traces to a `mid` that should have been `mid ± 1`.
- **Why is termination guaranteed?** Each branch strictly shrinks `[lo, hi]` (lo goes up *past* mid, or hi goes down *past* mid). A non-empty integer interval that strictly shrinks every step must hit empty in finite steps. No infinite loop is *possible* if you always exclude mid.

The point: you did not memorize "use `<=` and `mid+1`." You **derived** them from one sentence about what `[lo, hi]` means. Change the meaning and the rules change with it — consistently.

**Choice B — half-open `[lo, hi)`: "the answer, if it exists, is in `arr[lo..hi-1]`; `hi` is one-past-the-end."** This is the form that generalizes to `lowerBound`/`upperBound` and "find the boundary" problems:

```java
int lo = 0, hi = n;               // hi = n (one past end) because interval is half-open
while (lo < hi) {                 // [lo, hi) empty exactly when lo == hi → stop
    int mid = lo + (hi - lo) / 2;
    if (cond(arr[mid])) hi = mid;     // mid might still be the answer → KEEP it (don't write mid-1)
    else                lo = mid + 1; // mid ruled out → exclude
}
return lo;                        // lo == hi == the boundary / insertion point
```

Here `hi = mid` (not `mid - 1`) — because in a *half-open* interval `mid` stays a candidate on the keep-side. Same disciplined reasoning, different invariant, different (but forced) rules. **Mixing the two invariants** — half-open bounds with closed-interval `<=` — is what produces 90% of binary-search bugs. Pick one invariant per function and stay inside it.

### The two specific landmines, now explained not just warned

- **`mid = (lo + hi) / 2` overflows.** When `lo + hi > Integer.MAX_VALUE` (~2.1 billion), the sum wraps negative and `mid` becomes a negative index → `ArrayIndexOutOfBoundsException`. This was a real bug in `java.util.Arrays.binarySearch`, undetected for **9 years** until Josh Bloch wrote about it in 2006. The fix `lo + (hi - lo) / 2` computes the same midpoint without ever forming the dangerous sum, because `hi - lo` can't overflow when both are non-negative. Always write it this way; it costs nothing.
- **Infinite loop from `lo = mid`.** Covered above, but the tell is specific: it hangs *only* when `hi - lo == 1` (two candidates), because `mid = lo + (1)/2 = lo`, and `lo = mid` doesn't move. If your binary search ever hangs, look here first.

> **The mantra:** *"What does `[lo, hi]` mean, and have I kept it true?"* Answer that sentence honestly and the `<=`/`<`, `mid`/`mid±1`, and starting-bound questions all answer themselves. The three templates below are just this invariant applied to three goals (exact match, leftmost, rightmost) — read them as *instances of the discipline*, not spells to memorize.

---

[Chapter overview](../06_Binary_Search_Patterns.md) | [The 3 Templates (MEMORIZE!) →](02_the_3_templates_memorize.md)
