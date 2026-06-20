**Navigation**: [< Previous](05_LeetCode_RealWorld_Map.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](07_Two_Pointers_Complete.md)

---

### Historical Evolution

**Inventor / Originator:** Binary search was first published by John Mauchly (1946) for numerical analysis. Donald Knuth formalized it in "The Art of Computer Programming" Vol 3 (1973). Scott Meyers popularized the STL bound/lower_bound trick (2000).

**Predecessor context:** Linear search O(n) was the default for sorted data. Finding elements required scanning from the start, regardless of how sorted the data was.

**Evolution narrative:** Mauchly recognized that sorted data enables logarithmic search by repeatedly halving the search space. Knuth's TAOCP Vol 3 provided the definitive treatment with careful handling of overflow and boundary conditions.

**Modern practice:** Binary search is built into every standard library (C++ STL, Java Collections, Python bisect). The pattern extends to monotonic predicate search, finding peaks, and searching rotated arrays.

- **Mauchly 1946**: First published description of binary search for numerical analysis
- **Knuth Vol 3 — 1973**: Definitive treatment with overflow-safe midpoint calculation
- **Meyers 2000**: "Effective STL" popularized lower_bound/upper_bound idioms
- **Modern practice**: Built into all standard libraries; core to database index lookups

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

- **Mid overflow with `(left+right)/2` for large `left, right`** — Using `(left + right) / 2` causes integer overflow in Java/Python when left and right are near Integer.MAX_VALUE. This produces a negative index causing ArrayIndexOutOfBoundsException. Detection: test with `left=2_000_000_000, right=2_100_000_000`; always use `left + (right - left) / 2`.

- **BS on answer space breaks when predicate has multiple flips** — Binary search assumes the predicate is monotonic (false...false, true...true). If the predicate flips multiple times (e.g., "can we achieve X with Y?"), binary search produces incorrect results. Detection: verify monotonicity before binary searching the answer space.

- **Off-by-one in inclusive vs exclusive bounds** — Using `left <= right` (inclusive) with `left = mid + 1` vs `left < right` (exclusive) with `left = mid + 1` produces different termination conditions. Mixing templates causes infinite loops or missed elements. Detection: test with single-element array and target present/absent.

- **Rotated array BS assumes exactly one rotation pivot** — Binary search on rotated arrays assumes one pivot point. With multiple complete rotations (effectively sorted), the algorithm may still work but wastes time. With unsorted input, it produces wrong results. Detection: verify input is a single-rotation of a sorted array before using this variant.

**Production Selection Heuristic:** Use binary search when the search space has a clear monotonic property and you can verify the predicate flips exactly once. If the predicate's monotonicity is uncertain, test with boundary cases first.

---

## 🗺️ Pattern Recognition Header — Binary Search

**How do I know this requires Binary Search?**

| Signal in problem                                          | BS Type                   | Search Space                       |
| ---------------------------------------------------------- | ------------------------- | ---------------------------------- |
| `sorted array + find value`                                | **Classic BS**            | `[0, n-1]` on data                 |
| `first/last occurrence`, `count`                           | **Lower/Upper Bound**     | `[0, n]` on data                   |
| `rotated sorted array`                                     | **BS on rotated data**    | Determine sorted half              |
| `"minimum possible maximum"` or `"minimum X to achieve Y"` | **BS on Answer**          | `[minAns, maxAns]` on answer space |
| `find peak`, `mountain array`                              | **BS on slope direction** | Move toward ascending              |
| `Kth smallest in matrix / sorted list`                     | **BS on value range**     | `[min, max]` in value space        |

**The 3 BS Templates — which to use:**

```
T1: left <= right, left = mid+1, right = mid-1   → Exact match
T2: left <  right, right = mid                    → First pos >= target (Lower Bound)
T3: left <  right, left  = mid+1                  → First pos >  target (Upper Bound)

⚠️ MID overflow: ALWAYS use left + (right - left) / 2
⚠️ BS on Answer: think "can I achieve X?" → monotonic Yes/No function
```

### ⚠️ Constraint Lens — Binary Search Needs Monotonicity

| Constraint / Signal                   | Use                            |
| ------------------------------------- | ------------------------------ |
| sorted data, find value               | classic binary search          |
| first/last valid position             | lower/upper bound              |
| `minimum X such that possible(X)`     | binary search on answer        |
| predicate flips once (`false...true`) | binary search works            |
| predicate can flip multiple times     | binary search is invalid       |
| answer range up to `1e9` / `1e18`     | binary search over value range |

Full map: [Constraint-Based Pattern Selection](25_Constraint_Based_Pattern_Selection.md).

🔗 **Practice problems:** [Binary Search PS](../05_Problem_Solving/07_Binary_Search_Patterns.md)
📋 **All Patterns Hub:** [00_PATTERN_MASTER_GUIDE.md](00_PATTERN_MASTER_GUIDE.md)

---

🔬 **Section Challenge — 🗺️ Pattern Recognition Header — Binary Search**

**Challenge 1 (Reasoning):** Binary search on `[1,3,5,7,9]` with `target=6`. Trace `lo`, `hi`, `mid` at each step and explain the final state.

<details><summary>Answer</summary>

lo=0,hi=4 → mid=2(val=5): 5<6 → lo=3. lo=3,hi=4 → mid=3(val=7): 7>6 → hi=2. lo(3)>hi(2): loop ends, return -1 (not found). Key insight: lo overtakes hi — this is the standard termination condition. `lo` ends at the insertion point where 6 would go.

</details>

**Challenge 2 (Design):** Binary search on a rotated array `[4,5,6,7,0,1,2]`. How do you determine which half is sorted?

<details><summary>Answer</summary>

Compare `nums[lo]` and `nums[mid]`. If `nums[lo] <= nums[mid]`: left half is sorted. Check if target is in `[nums[lo], nums[mid])` — if yes, search left; else search right. Otherwise right half is sorted. Check if target is in `(nums[mid], nums[hi]]` — if yes, search right; else search left. This always works because at least one half of a rotated sorted array is always sorted.

</details>

# 🔍 Binary Search Patterns Complete Guide

Master Every Variation of the Most Powerful Search Technique

## Table of Contents

1. [Binary Search Fundamentals](#fundamentals)
2. [The 3 Templates (MEMORIZE!)](#templates)
3. [Lower Bound & Upper Bound](#bounds)
4. [Search in Rotated Array](#rotated)
5. [Peak Finding Patterns](#peak-finding)
6. [Binary Search on Answer](#binary-answer)
7. [2D Binary Search](#2d-search)
8. [Advanced Patterns](#advanced)
9. [Common Mistakes](#mistakes)
10. [Interview Problems](#interview-problems)
11. [Quick Reference](#quick-reference)

---

## Binary Search Fundamentals <a name="fundamentals"></a>

### The Core Idea

BINARY SEARCH IN ONE SENTENCE

"If the search space is MONOTONIC (sorted/ordered),
eliminate HALF of it each step."

Time: O(log n) — From 1 billion → 30 comparisons

### Visual: Why Binary Search is Fast

```
Linear Search on 1,000,000 elements:
┌────────────────────────────────────────────────────┐
│ Worst case: 1,000,000 comparisons                  │
│ Average: 500,000 comparisons                       │
└────────────────────────────────────────────────────┘

Binary Search on 1,000,000 elements:
┌────────────────────────────────────────────────────┐
│ 1,000,000 → 500,000 → 250,000 → 125,000 →          │
│ 62,500 → 31,250 → 15,625 → 7,812 → 3,906 →         │
│ 1,953 → 976 → 488 → 244 → 122 → 61 →               │
│ 30 → 15 → 7 → 3 → 1                                │
│                                                    │
│ Only ~20 comparisons! (log₂(1,000,000) ≈ 20)       │
└────────────────────────────────────────────────────┘
```

### Prerequisites for Binary Search

```
┌─────────────────────────────────────────────────────────────────┐
│           BINARY SEARCH APPLICABILITY                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  You need ONE of these properties:                              │
│                                                                 │
│  1. SORTED ARRAY                                                │
│     - Ascending or descending                                   │
│     - Search for specific value or boundary                     │
│                                                                 │
│  2. MONOTONIC FUNCTION                                          │
│     - f(x) is always increasing or always decreasing            │
│     - Search for value where f(x) crosses threshold             │
│                                                                 │
│  3. SEARCH SPACE WITH BINARY PROPERTY                           │
│     - Can eliminate half based on some condition                │
│     - "Binary search on answer"                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

🔬 **Section Challenge — Binary Search Fundamentals <a name="fundamentals"></a>**

**Challenge 1 (Reasoning):** Binary search on `[1,3,5,7,9]` with `target=6`. Trace `lo`, `hi`, `mid` at each step and explain the final state.

<details><summary>Answer</summary>

lo=0,hi=4 → mid=2(val=5): 5<6 → lo=3. lo=3,hi=4 → mid=3(val=7): 7>6 → hi=2. lo(3)>hi(2): loop ends, return -1 (not found). Key insight: lo overtakes hi — this is the standard termination condition. `lo` ends at the insertion point where 6 would go.

</details>

**Challenge 2 (Design):** Binary search on a rotated array `[4,5,6,7,0,1,2]`. How do you determine which half is sorted?

<details><summary>Answer</summary>

Compare `nums[lo]` and `nums[mid]`. If `nums[lo] <= nums[mid]`: left half is sorted. Check if target is in `[nums[lo], nums[mid])` — if yes, search left; else search right. Otherwise right half is sorted. Check if target is in `(nums[mid], nums[hi]]` — if yes, search right; else search left. This always works because at least one half of a rotated sorted array is always sorted.

</details>

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

## The 3 Templates (MEMORIZE!) <a name="templates"></a>

### Template 1: Basic Binary Search (Exact Match)

```java
/*
Find exact element. Returns index or -1.
Use when: Looking for EXACT match in sorted array.
*/

public int binarySearch(int[] nums, int target) {
    int left = 0, right = nums.length - 1;

    while (left <= right) {  // Note: <=
        int mid = left + (right - left) / 2;  // Avoid overflow

        if (nums[mid] == target) {
            return mid;  // Found!
        } else if (nums[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    return -1;  // Not found
}
```

### Template 2: Lower Bound (First Position ≥ target)

```java
/*
Find first element >= target. Returns insert position if not found.
Use when: Finding leftmost position, insertion point.
*/

public int lowerBound(int[] nums, int target) {
    int left = 0, right = nums.length;  // Note: right = length (not length-1)

    while (left < right) {  // Note: <
        int mid = left + (right - left) / 2;

        if (nums[mid] < target) {
            left = mid + 1;
        } else {
            right = mid;  // Note: mid (not mid-1)
        }
    }
    return left;  // First position where nums[i] >= target
}
```

### Template 3: Upper Bound (First Position > target)

```java
/*
Find first element > target.
Use when: Finding rightmost occurrence (upperBound - 1).
*/

public int upperBound(int[] nums, int target) {
    int left = 0, right = nums.length;

    while (left < right) {
        int mid = left + (right - left) / 2;

        if (nums[mid] <= target) {  // Note: <=
            left = mid + 1;
        } else {
            right = mid;
        }
    }
    return left;  // First position where nums[i] > target
}
```

### Visual: Template Differences

```
Array: [1, 2, 2, 2, 3, 4, 5], target = 2

Template 1 (Exact): Returns any 2 → index 1, 2, or 3
Template 2 (Lower): First >= 2 → index 1
Template 3 (Upper): First > 2  → index 4

Uses:
- First occurrence of 2: lowerBound(2) → 1
- Last occurrence of 2:  upperBound(2) - 1 → 3
- Count of 2s: upperBound(2) - lowerBound(2) → 3
- Insert position for 2.5: lowerBound(2.5) → 4
```

### Template Cheat Sheet

```
┌─────────────────────────────────────────────────────────────────┐
│              TEMPLATE QUICK REFERENCE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  TEMPLATE 1: left <= right, left/right = mid ± 1                │
│  Use for: Exact match                                           │
│  Returns: Index of element or -1                                │
│                                                                 │
│  TEMPLATE 2: left < right, right = mid                          │
│  Use for: First position >= target                              │
│  Returns: Insert position (0 to n)                              │
│                                                                 │
│  TEMPLATE 3: left < right, left = mid + 1                       │
│  Use for: First position > target                               │
│  Returns: Insert position (0 to n)                              │
│                                                                 │
│  KEY DIFFERENCES:                                               │
│  • while condition: <= for T1, < for T2/T3                      │
│  • right init: length-1 for T1, length for T2/T3                │
│  • mid assignment: right = mid for T2, left = mid+1 for T3      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Lower Bound & Upper Bound <a name="bounds"></a>

### Find First and Last Position (LeetCode 34)

```java
public int[] searchRange(int[] nums, int target) {
    int first = lowerBound(nums, target);

    // Check if target exists
    if (first == nums.length || nums[first] != target) {
        return new int[]{-1, -1};
    }

    int last = upperBound(nums, target) - 1;
    return new int[]{first, last};
}

// Count occurrences
public int countOccurrences(int[] nums, int target) {
    return upperBound(nums, target) - lowerBound(nums, target);
}
```

### Visual: Finding Range

```
Array: [5, 7, 7, 8, 8, 8, 10], target = 8

lowerBound(8): First >= 8
Index: 0  1  2  3  4  5  6
Value: 5  7  7  8  8  8  10
                ↑
           Returns 3

upperBound(8): First > 8
Index: 0  1  2  3  4  5  6
Value: 5  7  7  8  8  8  10
                         ↑
                    Returns 6

Range: [3, 6-1] = [3, 5]
Count: 6 - 3 = 3 occurrences
```

### Find Insert Position (LeetCode 35)

```java
public int searchInsert(int[] nums, int target) {
    return lowerBound(nums, target);
}

// Equivalent manual implementation:
public int searchInsert(int[] nums, int target) {
    int left = 0, right = nums.length;

    while (left < right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] < target) {
            left = mid + 1;
        } else {
            right = mid;
        }
    }
    return left;
}
```

---

## Search in Rotated Array <a name="rotated"></a>

### Understanding Rotated Arrays

```
Original Sorted: [0, 1, 2, 4, 5, 6, 7]

Rotated by 3:    [4, 5, 6, 7, 0, 1, 2]
                        ↑
                   Pivot point

Key insight: One half is ALWAYS sorted!

[4, 5, 6, 7, 0, 1, 2], mid = 3 (value 7)
 ↑        ↑        ↑
left     mid     right

Left half [4,5,6,7] is sorted (nums[left] <= nums[mid])
Right half [0,1,2] is NOT sorted in normal order
```

### Search in Rotated Sorted Array (LeetCode 33)

```java
/*
No duplicates. Find target index or -1.
Key: Determine which half is sorted, then decide where to search.
*/

public int search(int[] nums, int target) {
    int left = 0, right = nums.length - 1;

    while (left <= right) {
        int mid = left + (right - left) / 2;

        if (nums[mid] == target) {
            return mid;
        }

        // Determine which half is sorted
        if (nums[left] <= nums[mid]) {
            // Left half is sorted
            if (target >= nums[left] && target < nums[mid]) {
                right = mid - 1;  // Target in left half
            } else {
                left = mid + 1;   // Target in right half
            }
        } else {
            // Right half is sorted
            if (target > nums[mid] && target <= nums[right]) {
                left = mid + 1;   // Target in right half
            } else {
                right = mid - 1;  // Target in left half
            }
        }
    }
    return -1;
}
```

### Rotated Array WITH Duplicates (LeetCode 81)

```java
/*
With duplicates, we might not know which half is sorted.
Worst case O(n), but usually still O(log n).
*/

public boolean search(int[] nums, int target) {
    int left = 0, right = nums.length - 1;

    while (left <= right) {
        int mid = left + (right - left) / 2;

        if (nums[mid] == target) {
            return true;
        }

        // Handle duplicates: nums[left] == nums[mid] == nums[right]
        if (nums[left] == nums[mid] && nums[mid] == nums[right]) {
            left++;
            right--;
        } else if (nums[left] <= nums[mid]) {
            // Left half is sorted
            if (target >= nums[left] && target < nums[mid]) {
                right = mid - 1;
            } else {
                left = mid + 1;
            }
        } else {
            // Right half is sorted
            if (target > nums[mid] && target <= nums[right]) {
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }
    }
    return false;
}
```

### Find Minimum in Rotated Array (LeetCode 153)

```java
/*
Find the minimum element (pivot point).
The minimum is where the rotation happened.
*/

public int findMin(int[] nums) {
    int left = 0, right = nums.length - 1;

    while (left < right) {
        int mid = left + (right - left) / 2;

        if (nums[mid] > nums[right]) {
            // Minimum is in right half (after mid)
            left = mid + 1;
        } else {
            // Minimum is in left half (including mid)
            right = mid;
        }
    }
    return nums[left];
}

// With duplicates (LeetCode 154)
public int findMinWithDup(int[] nums) {
    int left = 0, right = nums.length - 1;

    while (left < right) {
        int mid = left + (right - left) / 2;

        if (nums[mid] > nums[right]) {
            left = mid + 1;
        } else if (nums[mid] < nums[right]) {
            right = mid;
        } else {
            // nums[mid] == nums[right], can't decide
            right--;  // Safe to shrink
        }
    }
    return nums[left];
}
```

---

## Peak Finding Patterns <a name="peak-finding"></a>

### Find Peak Element (LeetCode 162)

```java
/*
A peak is greater than its neighbors.
nums[-1] = nums[n] = -∞
Find ANY peak in O(log n).
*/

public int findPeakElement(int[] nums) {
    int left = 0, right = nums.length - 1;

    while (left < right) {
        int mid = left + (right - left) / 2;

        if (nums[mid] > nums[mid + 1]) {
            // Descending: peak is at mid or left
            right = mid;
        } else {
            // Ascending: peak is on right
            left = mid + 1;
        }
    }
    return left;
}
```

### Visual: Peak Finding Logic

```
Array: [1, 2, 3, 1]
        ↑     ↑
       asc  desc

mid = 1, nums[1]=2, nums[2]=3
2 < 3: Ascending → move right

mid = 2, nums[2]=3, nums[3]=1
3 > 1: Descending → peak at mid or left

Result: index 2 (value 3)

---

Array: [1, 2, 1, 3, 5, 6, 4]

Multiple peaks exist: index 1 (value 2) and index 5 (value 6)
Binary search finds ONE of them.
```

### Peak Index in Mountain Array (LeetCode 852)

```java
/*
Mountain: strictly increasing then strictly decreasing.
Exactly one peak. Find it.
*/

public int peakIndexInMountainArray(int[] arr) {
    int left = 0, right = arr.length - 1;

    while (left < right) {
        int mid = left + (right - left) / 2;

        if (arr[mid] < arr[mid + 1]) {
            left = mid + 1;  // Peak is on right
        } else {
            right = mid;     // Peak is at mid or left
        }
    }
    return left;
}
```

---

## Binary Search on Answer <a name="binary-answer"></a>

### The Concept

```
┌─────────────────────────────────────────────────────────────────┐
│           BINARY SEARCH ON ANSWER PATTERN                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  When: You're not searching IN an array, but searching FOR      │
│        an optimal value in a range.                             │
│                                                                 │
│  Pattern:                                                       │
│  1. Define search space: [min_possible, max_possible]           │
│  2. Define feasibility function: canAchieve(answer)             │
│  3. Binary search for boundary where answer becomes feasible    │
│                                                                 │
│  Examples:                                                      │
│  • Minimum capacity to ship packages in D days                  │
│  • Maximum minimum distance between elements                    │
│  • Kth smallest element in sorted matrix                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Template: Binary Search on Answer

```java
public int binarySearchOnAnswer(int[] data, int constraint) {
    int left = minPossibleAnswer;
    int right = maxPossibleAnswer;

    while (left < right) {
        int mid = left + (right - left) / 2;

        if (canAchieve(data, mid, constraint)) {
            right = mid;      // Try smaller answer
        } else {
            left = mid + 1;   // Need larger answer
        }
    }
    return left;
}

// If maximizing instead of minimizing:
public int binarySearchMax(int[] data, int constraint) {
    int left = minPossibleAnswer;
    int right = maxPossibleAnswer;

    while (left < right) {
        int mid = left + (right - left + 1) / 2;  // Note: +1 for upper mid

        if (canAchieve(data, mid, constraint)) {
            left = mid;       // Try larger answer
        } else {
            right = mid - 1;  // Need smaller answer
        }
    }
    return left;
}
```

### Problem: Ship Packages in D Days (LeetCode 1011)

```java
/*
Weights must be shipped in order, within D days.
Find minimum ship capacity.
*/

public int shipWithinDays(int[] weights, int days) {
    // Min capacity = max single weight (or can't ship it)
    // Max capacity = sum of all weights (ship all in 1 day)
    int left = 0, right = 0;
    for (int w : weights) {
        left = Math.max(left, w);
        right += w;
    }

    while (left < right) {
        int mid = left + (right - left) / 2;

        if (canShip(weights, mid, days)) {
            right = mid;      // Try smaller capacity
        } else {
            left = mid + 1;   // Need more capacity
        }
    }
    return left;
}

private boolean canShip(int[] weights, int capacity, int days) {
    int daysNeeded = 1;
    int currentLoad = 0;

    for (int w : weights) {
        if (currentLoad + w > capacity) {
            daysNeeded++;
            currentLoad = 0;
        }
        currentLoad += w;
    }
    return daysNeeded <= days;
}
```

### Problem: Koko Eating Bananas (LeetCode 875)

```java
/*
Koko eats at speed k bananas/hour.
Find minimum k to finish all piles in h hours.
*/

public int minEatingSpeed(int[] piles, int h) {
    int left = 1;
    int right = 0;
    for (int p : piles) right = Math.max(right, p);

    while (left < right) {
        int mid = left + (right - left) / 2;

        if (canFinish(piles, mid, h)) {
            right = mid;
        } else {
            left = mid + 1;
        }
    }
    return left;
}

private boolean canFinish(int[] piles, int speed, int hours) {
    int hoursNeeded = 0;
    for (int pile : piles) {
        hoursNeeded += (pile + speed - 1) / speed;  // Ceiling division
    }
    return hoursNeeded <= hours;
}
```

### Problem: Split Array Largest Sum (LeetCode 410)

```java
/*
Split array into m subarrays.
Minimize the maximum sum among subarrays.
*/

public int splitArray(int[] nums, int m) {
    int left = 0, right = 0;
    for (int num : nums) {
        left = Math.max(left, num);
        right += num;
    }

    while (left < right) {
        int mid = left + (right - left) / 2;

        if (canSplit(nums, mid, m)) {
            right = mid;      // Try smaller max sum
        } else {
            left = mid + 1;   // Need larger max sum
        }
    }
    return left;
}

private boolean canSplit(int[] nums, int maxSum, int m) {
    int count = 1;
    int currentSum = 0;

    for (int num : nums) {
        if (currentSum + num > maxSum) {
            count++;
            currentSum = num;
        } else {
            currentSum += num;
        }
    }
    return count <= m;
}
```

### Problem: Magnetic Force Between Balls (LeetCode 1552)

```java
/*
Place m balls in positions to MAXIMIZE minimum distance.
Classic "maximize the minimum" problem.
*/

public int maxDistance(int[] positions, int m) {
    Arrays.sort(positions);
    int n = positions.length;

    int left = 1;  // Min possible distance
    int right = positions[n-1] - positions[0];  // Max possible

    while (left < right) {
        int mid = left + (right - left + 1) / 2;  // Upper mid for maximize

        if (canPlace(positions, mid, m)) {
            left = mid;       // Try larger distance
        } else {
            right = mid - 1;  // Need smaller distance
        }
    }
    return left;
}

private boolean canPlace(int[] positions, int minDist, int m) {
    int count = 1;
    int lastPos = positions[0];

    for (int i = 1; i < positions.length; i++) {
        if (positions[i] - lastPos >= minDist) {
            count++;
            lastPos = positions[i];
        }
    }
    return count >= m;
}
```

---

🔬 **Section Challenge — Binary Search on Answer <a name="binary-answer"></a>**

**Challenge 1 (Reasoning):** Binary search on `[1,3,5,7,9]` with `target=6`. Trace `lo`, `hi`, `mid` at each step and explain the final state.

<details><summary>Answer</summary>

lo=0,hi=4 → mid=2(val=5): 5<6 → lo=3. lo=3,hi=4 → mid=3(val=7): 7>6 → hi=2. lo(3)>hi(2): loop ends, return -1 (not found). Key insight: lo overtakes hi — this is the standard termination condition. `lo` ends at the insertion point where 6 would go.

</details>

**Challenge 2 (Design):** Binary search on a rotated array `[4,5,6,7,0,1,2]`. How do you determine which half is sorted?

<details><summary>Answer</summary>

Compare `nums[lo]` and `nums[mid]`. If `nums[lo] <= nums[mid]`: left half is sorted. Check if target is in `[nums[lo], nums[mid])` — if yes, search left; else search right. Otherwise right half is sorted. Check if target is in `(nums[mid], nums[hi]]` — if yes, search right; else search left. This always works because at least one half of a rotated sorted array is always sorted.

</details>

## 2D Binary Search <a name="2d-search"></a>

### Search 2D Matrix (LeetCode 74)

```java
/*
Matrix: each row sorted, first element > last of previous row.
Treat as 1D sorted array.
*/

public boolean searchMatrix(int[][] matrix, int target) {
    int m = matrix.length, n = matrix[0].length;
    int left = 0, right = m * n - 1;

    while (left <= right) {
        int mid = left + (right - left) / 2;
        int value = matrix[mid / n][mid % n];  // Convert to 2D indices

        if (value == target) {
            return true;
        } else if (value < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    return false;
}
```

### Search 2D Matrix II (LeetCode 240)

```java
/*
Matrix: rows sorted, columns sorted, but NOT like matrix I.
Use staircase search: start from top-right or bottom-left.
*/

public boolean searchMatrix(int[][] matrix, int target) {
    int m = matrix.length, n = matrix[0].length;
    int row = 0, col = n - 1;  // Start top-right

    while (row < m && col >= 0) {
        if (matrix[row][col] == target) {
            return true;
        } else if (matrix[row][col] > target) {
            col--;  // Eliminate column
        } else {
            row++;  // Eliminate row
        }
    }
    return false;
}
// Time: O(m + n)
```

### Kth Smallest in Sorted Matrix (LeetCode 378)

```java
/*
Matrix with sorted rows and columns.
Find kth smallest element.
Binary search on VALUE, count elements <= mid.
*/

public int kthSmallest(int[][] matrix, int k) {
    int n = matrix.length;
    int left = matrix[0][0];
    int right = matrix[n-1][n-1];

    while (left < right) {
        int mid = left + (right - left) / 2;

        if (countLessOrEqual(matrix, mid) >= k) {
            right = mid;
        } else {
            left = mid + 1;
        }
    }
    return left;
}

private int countLessOrEqual(int[][] matrix, int target) {
    int n = matrix.length;
    int count = 0;
    int row = n - 1, col = 0;  // Start bottom-left

    while (row >= 0 && col < n) {
        if (matrix[row][col] <= target) {
            count += row + 1;  // All elements in this column up to row
            col++;
        } else {
            row--;
        }
    }
    return count;
}
```

---

🔬 **Section Challenge — 2D Binary Search <a name="2d-search"></a>**

**Challenge 1 (Reasoning):** Binary search on `[1,3,5,7,9]` with `target=6`. Trace `lo`, `hi`, `mid` at each step and explain the final state.

<details><summary>Answer</summary>

lo=0,hi=4 → mid=2(val=5): 5<6 → lo=3. lo=3,hi=4 → mid=3(val=7): 7>6 → hi=2. lo(3)>hi(2): loop ends, return -1 (not found). Key insight: lo overtakes hi — this is the standard termination condition. `lo` ends at the insertion point where 6 would go.

</details>

**Challenge 2 (Design):** Binary search on a rotated array `[4,5,6,7,0,1,2]`. How do you determine which half is sorted?

<details><summary>Answer</summary>

Compare `nums[lo]` and `nums[mid]`. If `nums[lo] <= nums[mid]`: left half is sorted. Check if target is in `[nums[lo], nums[mid])` — if yes, search left; else search right. Otherwise right half is sorted. Check if target is in `(nums[mid], nums[hi]]` — if yes, search right; else search left. This always works because at least one half of a rotated sorted array is always sorted.

</details>

## Advanced Patterns <a name="advanced"></a>

### Find Median of Two Sorted Arrays (LeetCode 4)

```java
/*
O(log(min(m,n))) solution using binary search partition.
*/

public double findMedianSortedArrays(int[] nums1, int[] nums2) {
    // Ensure nums1 is smaller
    if (nums1.length > nums2.length) {
        return findMedianSortedArrays(nums2, nums1);
    }

    int m = nums1.length, n = nums2.length;
    int left = 0, right = m;

    while (left <= right) {
        int partition1 = (left + right) / 2;
        int partition2 = (m + n + 1) / 2 - partition1;

        int maxLeft1 = (partition1 == 0) ? Integer.MIN_VALUE : nums1[partition1 - 1];
        int minRight1 = (partition1 == m) ? Integer.MAX_VALUE : nums1[partition1];

        int maxLeft2 = (partition2 == 0) ? Integer.MIN_VALUE : nums2[partition2 - 1];
        int minRight2 = (partition2 == n) ? Integer.MAX_VALUE : nums2[partition2];

        if (maxLeft1 <= minRight2 && maxLeft2 <= minRight1) {
            // Found correct partition
            if ((m + n) % 2 == 0) {
                return (Math.max(maxLeft1, maxLeft2) +
                        Math.min(minRight1, minRight2)) / 2.0;
            } else {
                return Math.max(maxLeft1, maxLeft2);
            }
        } else if (maxLeft1 > minRight2) {
            right = partition1 - 1;
        } else {
            left = partition1 + 1;
        }
    }
    throw new IllegalArgumentException("Input arrays not sorted");
}
```

### Find Kth Element of Two Sorted Arrays

```java
/*
Generalization of median problem.
*/

public int findKth(int[] nums1, int[] nums2, int k) {
    return findKth(nums1, 0, nums2, 0, k);
}

private int findKth(int[] a, int aStart, int[] b, int bStart, int k) {
    if (aStart >= a.length) return b[bStart + k - 1];
    if (bStart >= b.length) return a[aStart + k - 1];
    if (k == 1) return Math.min(a[aStart], b[bStart]);

    int aMid = aStart + k/2 - 1 < a.length ? a[aStart + k/2 - 1] : Integer.MAX_VALUE;
    int bMid = bStart + k/2 - 1 < b.length ? b[bStart + k/2 - 1] : Integer.MAX_VALUE;

    if (aMid < bMid) {
        return findKth(a, aStart + k/2, b, bStart, k - k/2);
    } else {
        return findKth(a, aStart, b, bStart + k/2, k - k/2);
    }
}
```

### Binary Search with Floating Point

```java
/*
When answer can be floating point, use precision-based termination.
*/

public double squareRoot(double x) {
    double left = 0, right = Math.max(1, x);
    double eps = 1e-10;  // Precision

    while (right - left > eps) {
        double mid = left + (right - left) / 2;
        if (mid * mid <= x) {
            left = mid;
        } else {
            right = mid;
        }
    }
    return left;
}

// Alternative: fixed iterations (100 iterations ≈ 2^100 precision)
public double squareRootFixed(double x) {
    double left = 0, right = Math.max(1, x);

    for (int i = 0; i < 100; i++) {
        double mid = left + (right - left) / 2;
        if (mid * mid <= x) {
            left = mid;
        } else {
            right = mid;
        }
    }
    return left;
}
```

---

## Common Mistakes <a name="mistakes"></a>

### Mistake 1: Infinite Loop

```java
// WRONG: Can cause infinite loop
while (left < right) {
    int mid = (left + right) / 2;
    if (condition) {
        left = mid;      // ❌ If left = mid = right - 1, loops forever
    } else {
        right = mid;
    }
}

// FIX 1: Use mid + 1 when assigning to left
while (left < right) {
    int mid = (left + right) / 2;
    if (condition) {
        left = mid + 1;  // ✓
    } else {
        right = mid;
    }
}

// FIX 2: Or use upper mid when moving left
while (left < right) {
    int mid = (left + right + 1) / 2;  // Upper mid
    if (condition) {
        left = mid;      // ✓ Now safe
    } else {
        right = mid - 1;
    }
}
```

### Mistake 2: Integer Overflow

```java
// WRONG: Can overflow if left + right > Integer.MAX_VALUE
int mid = (left + right) / 2;

// CORRECT: Subtract first
int mid = left + (right - left) / 2;
```

### Mistake 3: Off-by-One in Right Boundary

```java
// Template 1: right = length - 1
int right = nums.length - 1;
while (left <= right) { ... }

// Template 2/3: right = length
int right = nums.length;
while (left < right) { ... }

// Common bug: mixing them up
```

### Mistake 4: Wrong Condition in Rotated Array

```java
// WRONG: Using < instead of <= for sorted check
if (nums[left] < nums[mid])  // ❌ Misses case where left == mid

// CORRECT
if (nums[left] <= nums[mid])  // ✓
```

---

## Interview Problems <a name="interview-problems"></a>

### Quick Problem Classification

```
┌─────────────────────────────────────────────────────────────────┐
│              BINARY SEARCH PROBLEM TYPES                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  BASIC (Template 1):                                            │
│  - Binary Search, Search Insert Position                        │
│                                                                 │
│  BOUNDARY FINDING (Template 2/3):                               │
│  - First/Last Position of Element                               │
│  - First Bad Version, Find Smallest Letter                      │
│                                                                 │
│  ROTATED ARRAY:                                                 │
│  - Search in Rotated Array I/II                                 │
│  - Find Minimum in Rotated Array I/II                           │
│                                                                 │
│  PEAK FINDING:                                                  │
│  - Find Peak Element, Mountain Array                            │
│                                                                 │
│  BINARY SEARCH ON ANSWER:                                       │
│  - Ship Packages, Koko Bananas, Split Array                     │
│  - Magnetic Force, Capacity to Ship                             │
│                                                                 │
│  2D MATRIX:                                                     │
│  - Search 2D Matrix I/II                                        │
│  - Kth Smallest in Sorted Matrix                                │
│                                                                 │
│  ADVANCED:                                                      │
│  - Median of Two Sorted Arrays                                  │
│  - Longest Increasing Subsequence (with BS)                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### First Bad Version (LeetCode 278)

```java
public int firstBadVersion(int n) {
    int left = 1, right = n;

    while (left < right) {
        int mid = left + (right - left) / 2;

        if (isBadVersion(mid)) {
            right = mid;      // First bad is at mid or left
        } else {
            left = mid + 1;   // First bad is on right
        }
    }
    return left;
}
```

### Sqrt(x) (LeetCode 69)

```java
public int mySqrt(int x) {
    if (x < 2) return x;

    long left = 1, right = x / 2;

    while (left < right) {
        long mid = left + (right - left + 1) / 2;  // Upper mid for maximize

        if (mid * mid <= x) {
            left = mid;
        } else {
            right = mid - 1;
        }
    }
    return (int) left;
}
```

### Find Smallest Letter Greater Than Target (LeetCode 744)

```java
public char nextGreatestLetter(char[] letters, char target) {
    int left = 0, right = letters.length;

    while (left < right) {
        int mid = left + (right - left) / 2;

        if (letters[mid] <= target) {
            left = mid + 1;
        } else {
            right = mid;
        }
    }
    // Wrap around if needed
    return letters[left % letters.length];
}
```

---

## Quick Reference <a name="quick-reference"></a>

### Template Selection Guide

```
┌─────────────────────────────────────────────────────────────────┐
│              WHICH TEMPLATE TO USE?                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  "Find exact element"                                           │
│    → Template 1: left <= right                                  │
│                                                                 │
│  "Find first position where condition is true"                  │
│    → Template 2: left < right, right = mid                      │
│                                                                 │
│  "Find last position where condition is true"                   │
│    → Template 3: left < right, left = mid, upper mid            │
│                                                                 │
│  "Minimize answer" (find smallest valid)                        │
│    → Template 2 style                                           │
│                                                                 │
│  "Maximize answer" (find largest valid)                         │
│    → Template 3 style (use upper mid)                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Binary Search Checklist

```
Before coding:
□ Is the search space monotonic/sorted?
□ What are the boundaries? (inclusive/exclusive?)
□ What should be returned if not found?

While coding:
□ Use left + (right - left) / 2 to avoid overflow
□ Match while condition with boundary updates
□ Handle the mid boundary case (mid or mid ± 1?)

After coding:
□ Test with empty input
□ Test with single element
□ Test with target at boundaries
□ Test with target not present
□ Test with duplicates (if applicable)
```

### Complexity Summary

```
┌─────────────────────────────────────────────────────────────────┐
│              BINARY SEARCH COMPLEXITIES                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Basic Binary Search:        O(log n) time, O(1) space          │
│  Rotated Array Search:       O(log n) time, O(1) space          │
│  Rotated Array w/ Dups:      O(n) worst, O(log n) average       │
│  Binary Search on Answer:    O(log R × f(n)) where R = range    │
│  2D Matrix (sorted):         O(log(m×n))                        │
│  2D Matrix (row/col sorted): O(m + n)                           │
│  Median of Two Arrays:       O(log min(m, n))                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Summary

```
┌───────────────────────────────────────────────────────────────┐
│            BINARY SEARCH - MASTER CHECKLIST                   │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  1. MEMORIZE THE 3 TEMPLATES                                  │
│     - T1: Exact match (left <= right)                         │
│     - T2: First true (left < right, right = mid)              │
│     - T3: Last true (left < right, left = mid, upper mid)     │
│                                                               │
│  2. BINARY SEARCH ON ANSWER                                   │
│     - Define search space [min, max]                          │
│     - Define feasibility check                                │
│     - Binary search for optimal boundary                      │
│                                                               │
│  3. ROTATED ARRAY                                             │
│     - One half is always sorted                               │
│     - Check which half, then decide direction                 │
│                                                               │
│  4. AVOID COMMON BUGS                                         │
│     - Overflow: Use left + (right - left) / 2                 │
│     - Infinite loop: Match update with while condition        │
│     - Off-by-one: right = length vs length - 1                │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

**Pro Tip:** When stuck, ask yourself: "At each step, can I eliminate half of the remaining possibilities?" If yes, binary search applies!

---

---

🔬 **Section Challenge — Summary**

**Challenge 1 (Reasoning):** Prefix sum initialized as `prefix[0] = 0` — why the leading zero and not `prefix[0] = arr[0]`?

<details><summary>Answer</summary>

`prefix[0] = 0` (empty prefix) makes range sum formula uniform: `sum(l,r) = prefix[r+1] - prefix[l]`. Without the 0: `sum(0,r) = prefix[r] - 0` (special case needed). With it: `sum(0,r) = prefix[r+1] - prefix[0] = prefix[r+1]`. Same formula everywhere. This is the 'sentinel' pattern — adding a dummy initial value to eliminate special cases. Same trick used in dummy linked list nodes.

</details>
