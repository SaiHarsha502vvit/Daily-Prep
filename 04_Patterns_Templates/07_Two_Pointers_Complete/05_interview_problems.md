# Interview Problems <a name="interview-problems"></a>

> **Navigation**: [← Advanced Patterns](04_advanced_patterns.md) | [Chapter overview](../07_Two_Pointers_Complete.md)
> Page 5 of 5 in **Two Pointers — Pattern Guide**


## Problem Categories

```
┌─────────────────────────────────────────────────────────────────┐
│              TWO POINTER PROBLEM MAP                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PAIR FINDING (Opposite Direction):                             │
│  • Two Sum II, 3Sum, 4Sum, 3Sum Closest                         │
│  • Container With Most Water                                    │
│                                                                 │
│  PALINDROME/REVERSE:                                            │
│  • Valid Palindrome I/II, Reverse String                        │
│                                                                 │
│  ARRAY MODIFICATION (Same Direction):                           │
│  • Remove Duplicates I/II, Remove Element                       │
│  • Move Zeroes, Sort Colors                                     │
│                                                                 │
│  LINKED LIST (Fast/Slow):                                       │
│  • Cycle Detection I/II, Middle of List                         │
│  • Find Duplicate Number, Happy Number                          │
│                                                                 │
│  MERGE OPERATIONS:                                              │
│  • Merge Sorted Arrays, Intersection                            │
│  • Compare Strings                                              │
│                                                                 │
│  ADVANCED:                                                      │
│  • Trapping Rain Water, Partition Labels                        │
│  • Boats to Save People                                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Squares of a Sorted Array (LeetCode 977)

```java
public int[] sortedSquares(int[] nums) {
    int n = nums.length;
    int[] result = new int[n];
    int left = 0, right = n - 1;
    int pos = n - 1;  // Fill from end (largest squares first)

    while (left <= right) {
        int leftSq = nums[left] * nums[left];
        int rightSq = nums[right] * nums[right];

        if (leftSq > rightSq) {
            result[pos] = leftSq;
            left++;
        } else {
            result[pos] = rightSq;
            right--;
        }
        pos--;
    }
    return result;
}
```

## Valid Palindrome II (LeetCode 680)

```java
/*
Can make palindrome by removing at most one character.
*/

public boolean validPalindrome(String s) {
    int left = 0, right = s.length() - 1;

    while (left < right) {
        if (s.charAt(left) != s.charAt(right)) {
            // Try removing left or right character
            return isPalindrome(s, left + 1, right) ||
                   isPalindrome(s, left, right - 1);
        }
        left++;
        right--;
    }
    return true;
}

private boolean isPalindrome(String s, int left, int right) {
    while (left < right) {
        if (s.charAt(left++) != s.charAt(right--)) {
            return false;
        }
    }
    return true;
}
```

## Backspace String Compare (LeetCode 844)

```java
/*
Compare strings with backspace characters (#).
Process from right to left with two pointers.
*/

public boolean backspaceCompare(String s, String t) {
    int i = s.length() - 1;
    int j = t.length() - 1;

    while (i >= 0 || j >= 0) {
        i = getNextValidIndex(s, i);
        j = getNextValidIndex(t, j);

        if (i >= 0 && j >= 0) {
            if (s.charAt(i) != t.charAt(j)) return false;
        } else if (i >= 0 || j >= 0) {
            return false;  // One string is shorter
        }
        i--;
        j--;
    }
    return true;
}

private int getNextValidIndex(String str, int index) {
    int skip = 0;
    while (index >= 0) {
        if (str.charAt(index) == '#') {
            skip++;
            index--;
        } else if (skip > 0) {
            skip--;
            index--;
        } else {
            break;
        }
    }
    return index;
}
```

---

## Quick Reference <a name="quick-reference"></a>

### Pattern Selection Guide

```
┌─────────────────────────────────────────────────────────────────┐
│              WHICH TWO POINTER PATTERN?                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  "Find pair/triplet with sum"                                   │
│    → Opposite direction (sorted array)                          │
│                                                                 │
│  "Remove/Move elements in-place"                                │
│    → Same direction (reader-writer)                             │
│                                                                 │
│  "Detect cycle" or "Find middle"                                │
│    → Fast & slow pointers                                       │
│                                                                 │
│  "Substring/Subarray with condition"                            │
│    → Sliding window (same direction)                            │
│                                                                 │
│  "Merge/Compare two arrays"                                     │
│    → Multi-array two pointers                                   │
│                                                                 │
│  "Maximize/Minimize something between two ends"                 │
│    → Opposite direction with greedy                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Two Pointer Templates

```java
// TEMPLATE 1: Opposite Direction
int left = 0, right = n - 1;
while (left < right) {
    // Check condition
    if (condition matches) return result;
    else if (need larger) left++;
    else right--;
}

// TEMPLATE 2: Same Direction (Reader-Writer)
int writer = 0;
for (int reader = 0; reader < n; reader++) {
    if (shouldKeep(nums[reader])) {
        nums[writer++] = nums[reader];
    }
}
return writer;

// TEMPLATE 3: Fast & Slow
ListNode slow = head, fast = head;
while (fast != null && fast.next != null) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow == fast) return true;  // Cycle
}

// TEMPLATE 4: Multi-Array Merge
int p1 = 0, p2 = 0;
while (p1 < m && p2 < n) {
    if (arr1[p1] < arr2[p2]) process(arr1[p1++]);
    else process(arr2[p2++]);
}
// Handle remaining elements
```

### Complexity Summary

```
┌─────────────────────────────────────────────────────────────────┐
│              TWO POINTER COMPLEXITIES                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Two Sum II (sorted):        O(n) time, O(1) space              │
│  3Sum:                       O(n²) time, O(1) space             │
│  4Sum:                       O(n³) time, O(1) space             │
│  Container With Most Water:  O(n) time, O(1) space              │
│  Trapping Rain Water:        O(n) time, O(1) space              │
│  Remove Duplicates:          O(n) time, O(1) space              │
│  Linked List Cycle:          O(n) time, O(1) space              │
│  Merge Sorted Arrays:        O(m+n) time, O(1) space            │
│                                                                 │
│  Note: Two pointers often reduces O(n²) brute force to O(n)     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Summary

```
┌───────────────────────────────────────────────────────────────┐
│            TWO POINTERS - MASTER CHECKLIST                    │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  1. IDENTIFY THE PATTERN                                      │
│     - Pair with sum → Opposite direction                      │
│     - In-place modify → Same direction (reader-writer)        │
│     - Cycle/Middle → Fast & slow                              │
│     - Merge/Compare → Multi-array                             │
│                                                               │
│  2. KEY INSIGHTS                                              │
│     - SORTED array often enables two pointers                 │
│     - Move pointer based on current state                     │
│     - Think: "Can I eliminate options by moving pointer?"     │
│                                                               │
│  3. COMMON OPTIMIZATIONS                                      │
│     - Skip duplicates after finding match                     │
│     - Early termination when impossible                       │
│     - Process from END when merging in-place                  │
│                                                               │
│  4. EDGE CASES                                                │
│     - Empty array                                             │
│     - Single element                                          │
│     - All same elements                                       │
│     - No valid answer exists                                  │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

**Pro Tip:** When you see a problem asking about pairs, subarrays, or in-place operations on sorted/sequential data, think two pointers first!

### Why Each Pointer Move Is Safe — The Elimination Argument

The four "types" above look like four different algorithms. They aren't — they're four instances of one principle: **at every step, prove that the candidates you skip cannot contain the answer, then move the pointer that skips them.** Once you see the principle, you can re-derive any of them and even invent new two-pointer techniques for problems you've never seen. The four types differ only in *which axis* the elimination runs along.

**Opposite direction (collision) on sorted data.** Sum is too small? Move `left++` — every pair `(left', right)` with `left' < left` is provably too small too (because array is sorted, smaller index → smaller value → even smaller sum). Sum is too big? Move `right--` — symmetric. The proof that no answer is lost: any pair not yet visited has at least one index in `(left, right)`, and the monotonicity of sorted order means the next-best sum is always strictly closer to the target. Total work: each pointer moves at most `n` times → `O(n)`.

**Same direction (reader-writer) for in-place.** The reader scans every element (so it never misses anything), the writer only advances on "keep" decisions (so it builds the prefix). Proof of safety: at any moment, the writer marks exactly the prefix of "kept" elements, and the reader is always strictly ahead of the writer — so the writer never overwrites a not-yet-kept element. The invariant: `nums[0..writer)` is always the kept prefix; `nums[writer..reader)` is junk; `nums[reader..n)` is unprocessed.

**Fast & slow (Floyd).** Why does `fast = 2× speed` find a cycle? Imagine the loop as a circular track. If `slow` enters at speed 1 and `fast` enters at speed 2, after `k` steps fast has gained exactly `k` steps on slow. If the cycle has length `L`, then `fast` catches up to slow the first time `k` is a multiple of `L` — guaranteed because both are running in the same cycle. The "why they meet inside the cycle (not before)" part: before entering the cycle, fast gains on slow but never laps because the path is a tree (no loop). Once inside, fast laps slow exactly. Why does resetting slow to head find the cycle start? Because at the meeting point, slow has traveled `k` steps and fast has traveled `2k`; the difference `k` is a multiple of `L`; the entry point is exactly `L - (k mod L)` from the meeting point, which equals the distance from head to entry. Walking both at speed 1 from head and meeting point lands them on the entry. This is the part everyone memorizes; the *why* is "the meeting encodes the loop length."

**Multi-array merge.** Each pointer advances past the smaller (or consumed) element. Proof: once an element of array A has been written, it's irrelevant — any future comparison is between the next unwritten element of A and B's current pointer. So neither pointer ever needs to go backwards. Total work: `m + n`.

**The unifying safety criterion.** All four reduce to: **after each pointer move, the surviving search space is a strict subset that still contains the answer (if one exists).** That's the invariant. Whenever you're tempted to invent a new two-pointer technique, state this invariant for your move and you're either right or you have a bug. The "sorted requirement" for opposite-direction is *not* a magic prerequisite — it's what makes the elimination argument hold: sorted order is what guarantees that "moving left strictly increases sum" without exceptions.

**Where two pointers fail and you should switch.** Two pointers fail when the elimination argument breaks:
- *Opposite direction on unsorted pair-sum*: moving `left++` doesn't strictly increase the sum because the array has no order. Use a hashmap (O(n) time, O(n) space) or sort first (O(n log n) + O(n)).
- *Same-direction reader-writer when "kept" depends on future elements*: the writer needs the reader to be ahead, but if the decision needs info from `reader+1..`, you must look ahead. Switch to a sliding window or two-pass.
- *Fast/slow on structures without a linear next pointer*: trees, graphs. Use BFS/DFS.

The selection lens from the constraint table at the top of this chapter is doing this elimination-argument check implicitly. When you internalize the argument, you can read the table and predict the variant for a new problem without memorizing the table.

🔬 **Section Challenge — Summary**

**Challenge 1 (Two Pointers, 10 min):** You're given a sorted array and asked to find *all* pairs `(i, j)` with `i < j` and `nums[i] + nums[j] == target`. The opposite-direction two-pointer template above only finds one pair per pass. Modify it to find all pairs in O(n) total (not O(n²)). What's the key move after finding a match?

<details><summary>Answer</summary>

After finding a match `(left, right)`, instead of returning immediately, record the pair and then **advance both pointers past all duplicates**: `while (left < right && nums[left] == nums[left+1]) left++;` (and symmetrically for `right`). Then continue the main loop.

Why both pointers must move: if you only advance `left`, the next iteration pairs the new `left` with the same `right`, which either produces another match with the same `right` (duplicate work) or — if the array has duplicates at `left` — produces a pair you've already found. If you only advance `right`, you miss pairs where `left` is fixed and a different later `right` would have matched.

The deduplication invariant: after each match, you skip over *all* elements equal to `nums[left]` and *all* elements equal to `nums[right]` on the respective sides. This guarantees every pair is reported exactly once. Total work remains O(n) because each pointer still moves at most n times — duplicates just cause clusters of pointer moves, not extra work proportional to the number of pairs found (which can be O(n²), and that's fine — the algorithm is O(n) *pointer moves*, not O(n) *output*).

This is the "find all pairs" variant of two-sum and the most common interview follow-up. The principle generalizes: any time you find a match in a two-pointer scan and the answer space includes all such matches, dedup on both sides and keep scanning.

</details>

**Challenge 2 (Reasoning):** The fast/slow Floyd cycle detection finds a meeting point *inside* the cycle. Prove that the meeting point is *always* inside the cycle (and not, say, in the non-cyclic prefix before the loop entry).

<details><summary>Answer</summary>

Suppose the linked list has a non-cyclic prefix of length `k` (head to cycle entry) and a cycle of length `L`. When `slow` first reaches the cycle entry, it has traveled `k` steps. At that same moment, `fast` has traveled `2k` steps, meaning it is `k` steps into the cycle (because `fast` is `k` steps ahead of `slow` mod `L` — its position is `k mod L`).

For them to meet, `fast` must "lap" `slow`. Lapping can only happen *inside the cycle*, because before the cycle the path is a tree (each node has at most one predecessor from the prefix), so `fast` can never overtake `slow` on a non-cyclic edge — there's nothing to lap onto.

More formally: after `slow` enters the cycle, both pointers are in the cycle. Inside the cycle, `fast` gains on `slow` at rate 1 step per step. The two meet the first time `fast`'s lead over `slow` becomes a multiple of `L`. Since the initial lead when `slow` enters is some `r ∈ [0, L)`, they meet after `L - r` more steps. Meeting is therefore guaranteed and is *inside* the cycle.

This is why phase 2 of Floyd works: after the meeting inside the cycle, resetting `slow` to the head and walking both at speed 1 lands them together exactly at the cycle entry. The proof uses the same length arithmetic: when `slow` is at the meeting point after `k + (L - r)` steps total, `fast` is at the meeting point too (both are in the cycle). Walking `slow` from head and `fast` from meeting point at the same speed: after `k` more steps, `slow` is at the cycle entry; `fast` is `k` steps into the cycle from the meeting point, which (because the meeting was `L - r` steps into the cycle and `r + k` wraps around) is exactly the cycle entry too. They meet at the entry.

</details>

---

[← Advanced Patterns](04_advanced_patterns.md) | [Chapter overview](../07_Two_Pointers_Complete.md)
