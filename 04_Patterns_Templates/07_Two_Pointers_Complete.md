# 🧩 Two Pointers — Pattern Guide

**Navigation**: [< Previous](06_Binary_Search_Patterns.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](08_Array_Plus_TwoPointers.md)

---

## 🔗 Bridge — Where This Chapter Fits

| Dimension | This chapter |
| --- | --- |
| **Builds on** | [Arrays](../02_Data_Structures/01b_Arrays.md), [Sorting Fundamentals](../03_Algorithms/02a_Sorting_Fundamentals.md) |
| **You will learn** | Opposite-direction, same-direction, fast/slow and multi-array pointers, their invariants and how they connect to sliding window |
| **Leads to** | [Array + Two Pointers](08_Array_Plus_TwoPointers.md), [Linked List + Two Pointers](12_LinkedList_Plus_TwoPointers.md) |
| **Abstraction level** | Nested loops over pairs → **two indices that never go backwards** → amortised `O(n)` |

> [!NOTE]
> The full gap-free reading order and dependency graph are in the [Learning Path](00_LEARNING_PATH.md).

---

## 💬 Explain It Like a Study Partner — Two Pointers

### 1. The bottom line

Use two indices that move monotonically so each element is visited a constant number of times.

### 2. The textbook core

- Opposite ends: sorted array, shrink from both sides (pair sum, container with most water).
- Same direction: reader/writer (remove duplicates), partitioning.
- Fast/slow: different speeds (cycle detection, middle of list).
- Correctness argument: when you move a pointer you discard candidates that cannot be part of the answer.

### 3. The real-world analogy

Two people **walking toward each other along a corridor** looking for a pair that adds up to a target: too big, the right one steps back; too small, the left one steps forward.

### 4. Walkthrough

1. Sorted `[1,2,4,7,11]`, target 9.
2. `L=1, R=11`: 12 > 9 → move `R`.
3. `1 + 7 = 8 < 9` → move `L`.
4. `2 + 7 = 9` → found.

> [!NOTE]
> **Quick check:** Why is it safe to move `R` when the sum is too large? *Any pair using `R` with a larger-or-equal left element is even larger.*

---

### Historical Evolution

**Inventor / Originator:** Two-pointer techniques have several independent roots: Hoare's partitioning (invented 1959, published in *Quicksort*, 1961), Floyd's cycle-finding algorithm (credited to Robert Floyd in the 1960s; Knuth records it), and Dijkstra's Dutch national flag problem (*A Discipline of Programming*, 1976).

**Predecessor context:** Pair-finding over a sorted array was `O(n²)`; scanning from both ends exploits the order to cut it to `O(n)`.

**Evolution narrative:** Each root contributes a different pointer pattern: opposite ends (partitioning, pair sums), same direction at different speeds (cycle detection, read/write compaction), and three-way partitions (flag problem).

**Modern practice:** Pointer patterns appear in standard-library partition routines, linked-list cycle checks and in-place array compaction.

- **Hoare — 1959/1961**: In-place partition for quicksort
- **Floyd — 1960s**: Tortoise-and-hare cycle detection (Knuth, TAOCP Vol. 2)
- **Brent — 1980**: A faster cycle-finding variant
- **Dijkstra — 1976**: Dutch national flag three-way partition

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

- **Two pointers on unsorted array produces wrong answer** — Two pointers require sorted order for correctness. If the array is unsorted and you use opposite-end pointers for pair sum, you skip valid pairs because the monotonicity assumption (moving left increases sum) only holds on sorted data. Detection: test with unsorted `[3, 1, 2]` and target 4 — two pointers may miss (1,3) if not sorted first.

- **Fast/slow pointer termination condition wrong** — Common bug: forgetting `fast.next != null` check, causing NullPointerException on `fast.next.next`. For finding middle, use `while (fast != null && fast.next != null)`. For cycle detection, the meeting condition differs. Detection: test on single-element list and empty list.

- **Floyd's cycle detection: need to RESET slow to head after first meeting** — The two-phase Floyd algorithm (phase 1: find meeting; phase 2: reset slow to head and move both at 1x to find cycle start) is commonly implemented incorrectly by omitting the reset. Detection: test on a linked list where cycle starts at index k>0; algorithm must find k, not the meeting point.

- **Sorted requirement missed** — The two-pointer optimization requires sorting the array first (if order doesn't matter). Forgetting to sort silently produces wrong answers. Detection: add assertion that array is sorted; if unsorted, log warning before proceeding.

**Production Selection Heuristic:** Use two pointers when the array is sorted (or order doesn't matter and you can sort). Verify the monotonicity invariant holds before relying on the two-pointer reduction.

---

## 🗺️ Pattern Recognition Header — Two Pointers

**Which Two Pointer variant do I need?**

| Signal in problem                            | Variant                      | Movement direction              |
| -------------------------------------------- | ---------------------------- | ------------------------------- |
| `pair sum = target` in sorted array          | **Opposite direction**       | `left → ← right` converge       |
| `3Sum / 4Sum`, `container with most water`   | **Fix + Opposite**           | Fix one, converge the other two |
| `palindrome check`, `reverse string`         | **Opposite direction**       | Mirror inward                   |
| `remove duplicates`, `move zeroes`           | **Same dir (Reader-Writer)** | `reader` scans, `writer` places |
| `detect cycle`, `find middle` in linked list | **Fast & Slow (Floyd)**      | `fast=2x speed` of slow         |
| `merge two sorted arrays`                    | **Multi-array merge**        | Each array has own pointer      |

**Key decision:**

```
"Is array SORTED?"   Yes → Opposite direction (O(n))
                     No  → Sort first then use 2P, or use HashMap instead

"Linked list cycle?"      → Fast (2x) & Slow (1x) → meet inside cycle
"Remove in-place?"        → Reader stays ahead of writer
```

### ⚠️ Constraint Lens — Two Pointers Needs Structure

| Constraint / Signal                       | Use                                          |
| ----------------------------------------- | -------------------------------------------- |
| sorted array + pair sum                   | opposite-end two pointers                    |
| unsorted pair sum + need original indices | hashmap complement                           |
| unsorted pair sum + only values/count     | sort first if order does not matter          |
| linked list cycle/middle/kth from end     | fast/slow pointers                           |
| palindrome/string compare                 | inward pointers                              |
| values can be negative                    | still ok if sorted; issue is order, not sign |

Full map: [Constraint-Based Pattern Selection](25_Constraint_Based_Pattern_Selection.md).

🔗 **Practice problems:** [Two Pointers PS](../05_Problem_Solving/06_Two_Pointers.md)
🔗 **Related:** [Sliding Window template](01_Sliding_Window.md) — sliding window IS two pointers + window state
📋 **All Patterns Hub:** [00_PATTERN_MASTER_GUIDE.md](00_PATTERN_MASTER_GUIDE.md)

---

🔬 **Section Challenge — 🗺️ Pattern Recognition Header — Two Pointers**

**Challenge 1 (Reasoning):** Two-pointer pattern reduces O(N²) brute force to O(N). What is the KEY invariant that makes this safe?

<details><summary>Answer</summary>

The invariant: all pairs we SKIP are guaranteed to not contain the answer. In 3Sum: once we fix `nums[i]` and use l/r pointers, we can safely skip because the array is sorted. If `sum > 0`: decreasing r decreases the sum (smaller right value). If `sum < 0`: increasing l increases the sum (larger left value). We never skip a valid pair because monotonicity guarantees it.

</details>

# 👆👆 Two Pointers Pattern Complete Guide

From Simple Traversals to Complex Multi-Pointer Techniques

## Table of Contents

1. [Two Pointers Fundamentals](#fundamentals)
2. [Pattern Categories](#categories)
3. [Opposite Direction Pointers](#opposite)
4. [Same Direction Pointers](#same-direction)
5. [Fast & Slow Pointers](#fast-slow)
6. [Sliding Window Connection](#sliding-window)
7. [Multi-Array Two Pointers](#multi-array)
8. [Advanced Patterns](#advanced)
9. [Interview Problems](#interview-problems)
10. [Quick Reference](#quick-reference)

---

## Two Pointers Fundamentals <a name="fundamentals"></a>

### The Problem That Forces the Idea

You have a sorted array and need a pair whose sum equals a target. Brute force checks all n(n−1)/2 pairs — O(n²). For n = 100,000, that's 5 billion comparisons. Too slow.

But you have sorted order. Can you use it to eliminate candidates *without checking them*?

### The Elimination Argument — Why O(n) Is Possible

Place one pointer at the start (`left = 0`) and one at the end (`right = n-1`). Compute `sum = arr[left] + arr[right]`.

Three cases:
- **`sum == target`**: done.
- **`sum < target`**: you need a bigger sum. Moving `right--` makes sum *even smaller* (sorted!). The only productive move is `left++`. But you're not just skipping one pair — you're eliminating **every pair `(left, r)` for all `r ≤ right`**, because `arr[left] + arr[r] ≤ arr[left] + arr[right] < target`. One comparison kills an entire column of the pair space.
- **`sum > target`**: symmetric. `right--` eliminates an entire row.

**Each step eliminates at least one candidate that provably can't be the answer.** After at most `n` steps, the entire search space is exhausted. That's O(n) from O(n²) — not by being clever with data structures, but by proving that what you skip can't matter.

```
Pair space for arr = [1, 2, 4, 6, 8, 9], target = 10

        1   2   4   6   8   9       ← right pointer (starts at 9)
   1  [ 2   3   5   7   9  10]  ✓  sum=10 found at (1,9)
   2  [     4   6   8  10  11]      ← left pointer (starts at 1)
   4  [         8  10  12  13]
   6  [            12  14  15]      Brute force visits all 15 cells.
   8  [                16  17]      Two pointers walks the L-shaped
   9  [                    18]      border: at most 6 steps.

Each left++ eliminates a ROW (every remaining right for that left).
Each right-- eliminates a COLUMN (every remaining left for that right).
```

### The Single Principle Behind All Four Variants

The four "types" in the table above look like four different algorithms. They're not — they're four instances of one principle: **at every step, prove that the candidates you skip cannot contain the answer, then move the pointer that skips them.** Once you see the principle, you can re-derive any of them and invent new two-pointer techniques for problems you've never seen. The four types differ only in *which axis* the elimination runs along. (The full derivation for each variant is in "Why Each Pointer Move Is Safe" at the end of this chapter.)

## Pattern Categories <a name="categories"></a>

### The Four Main Types

## Two Pointer Patterns

1. OPPOSITE DIRECTION (Collision)
   left → ← right
   [....converging....]
   Use: Pair sum, palindrome, partition
2. SAME DIRECTION (Fast/Slow or Reader/Writer)
   slow →
   fast →
   Use: Remove duplicates, cycle detection, partition
3. SLIDING WINDOW (Special Same Direction)
   [left ... right]
   → →
   Use: Subarray/substring problems
4. MULTI-ARRAY (Merge Pattern)
   Array A: p1 →
   Array B: p2 →
   Use: Merge, intersection, comparison

---

## Opposite Direction Pointers <a name="opposite"></a>

### Two Sum II - Sorted Array (LeetCode 167)

```java
/*
Classic: Find pair with target sum in SORTED array.
Key: If sum too small, need larger (move left). If too big, need smaller (move right).
*/

public int[] twoSum(int[] numbers, int target) {
    int left = 0, right = numbers.length - 1;

    while (left < right) {
        int sum = numbers[left] + numbers[right];

        if (sum == target) {
            return new int[]{left + 1, right + 1};  // 1-indexed
        } else if (sum < target) {
            left++;   // Need larger sum
        } else {
            right--;  // Need smaller sum
        }
    }
    return new int[]{-1, -1};  // Not found
}
```

### Visual: Two Sum Logic

```
Array: [2, 7, 11, 15], target = 9

Step 1: left=0, right=3
        [2, 7, 11, 15]
         ↑          ↑
        sum = 2 + 15 = 17 > 9 → right--

Step 2: left=0, right=2
        [2, 7, 11, 15]
         ↑      ↑
        sum = 2 + 11 = 13 > 9 → right--

Step 3: left=0, right=1
        [2, 7, 11, 15]
         ↑  ↑
        sum = 2 + 7 = 9 = target ✓

Answer: [1, 2]
```

### 3Sum (LeetCode 15)

```java
/*
Find all unique triplets with sum = 0.
Fix one element, use two pointers for the rest.
*/

public List<List<Integer>> threeSum(int[] nums) {
    List<List<Integer>> result = new ArrayList<>();
    Arrays.sort(nums);  // Must sort!

    for (int i = 0; i < nums.length - 2; i++) {
        // Skip duplicates for first element
        if (i > 0 && nums[i] == nums[i - 1]) continue;

        // Early termination
        if (nums[i] > 0) break;  // Can't sum to 0 with positive

        int left = i + 1, right = nums.length - 1;
        int target = -nums[i];

        while (left < right) {
            int sum = nums[left] + nums[right];

            if (sum == target) {
                result.add(Arrays.asList(nums[i], nums[left], nums[right]));

                // Skip duplicates
                while (left < right && nums[left] == nums[left + 1]) left++;
                while (left < right && nums[right] == nums[right - 1]) right--;

                left++;
                right--;
            } else if (sum < target) {
                left++;
            } else {
                right--;
            }
        }
    }
    return result;
}
```

### 4Sum (LeetCode 18)

```java
/*
Generalize 3Sum: Fix two elements, two pointers for rest.
*/

public List<List<Integer>> fourSum(int[] nums, int target) {
    List<List<Integer>> result = new ArrayList<>();
    Arrays.sort(nums);
    int n = nums.length;

    for (int i = 0; i < n - 3; i++) {
        if (i > 0 && nums[i] == nums[i - 1]) continue;

        for (int j = i + 1; j < n - 2; j++) {
            if (j > i + 1 && nums[j] == nums[j - 1]) continue;

            int left = j + 1, right = n - 1;
            long remain = (long) target - nums[i] - nums[j];

            while (left < right) {
                long sum = nums[left] + nums[right];

                if (sum == remain) {
                    result.add(Arrays.asList(nums[i], nums[j], nums[left], nums[right]));
                    while (left < right && nums[left] == nums[left + 1]) left++;
                    while (left < right && nums[right] == nums[right - 1]) right--;
                    left++;
                    right--;
                } else if (sum < remain) {
                    left++;
                } else {
                    right--;
                }
            }
        }
    }
    return result;
}
```

### Container With Most Water (LeetCode 11)

```java
/*
Maximize area between two lines.
Key insight: Always move the shorter line (potential to find taller).
*/

public int maxArea(int[] height) {
    int left = 0, right = height.length - 1;
    int maxWater = 0;

    while (left < right) {
        int h = Math.min(height[left], height[right]);
        int w = right - left;
        maxWater = Math.max(maxWater, h * w);

        // Move the shorter side (greedy)
        if (height[left] < height[right]) {
            left++;
        } else {
            right--;
        }
    }
    return maxWater;
}
```

### Visual: Container With Most Water

```
height = [1,8,6,2,5,4,8,3,7]

Step 1: left=0, right=8
        |       |   |
      | |     | | | |
      | | |   | | | | |
      | | | | | | | | |
        width = 8, height = min(1,7) = 1, area = 8

Step 2: Move shorter (left=0 has height 1)
        left=1, right=8
          |       |
        | |     | | |
        | | |   | | | |
        | | | | | | | |
          width = 7, height = min(8,7) = 7, area = 49 ←── Best!
```

### Valid Palindrome (LeetCode 125)

```java
public boolean isPalindrome(String s) {
    int left = 0, right = s.length() - 1;

    while (left < right) {
        // Skip non-alphanumeric
        while (left < right && !Character.isLetterOrDigit(s.charAt(left))) {
            left++;
        }
        while (left < right && !Character.isLetterOrDigit(s.charAt(right))) {
            right--;
        }

        if (Character.toLowerCase(s.charAt(left)) !=
            Character.toLowerCase(s.charAt(right))) {
            return false;
        }
        left++;
        right--;
    }
    return true;
}
```

### Reverse String (LeetCode 344)

```java
public void reverseString(char[] s) {
    int left = 0, right = s.length - 1;

    while (left < right) {
        // Swap
        char temp = s[left];
        s[left] = s[right];
        s[right] = temp;

        left++;
        right--;
    }
}
```

### Sort Colors / Dutch National Flag (LeetCode 75)

```java
/*
Three-way partition using THREE pointers.
0s go to left, 2s go to right, 1s stay in middle.
*/

public void sortColors(int[] nums) {
    int low = 0, mid = 0, high = nums.length - 1;

    while (mid <= high) {
        if (nums[mid] == 0) {
            swap(nums, low, mid);
            low++;
            mid++;
        } else if (nums[mid] == 1) {
            mid++;
        } else {  // nums[mid] == 2
            swap(nums, mid, high);
            high--;
            // Don't increment mid! We need to check swapped element
        }
    }
}

private void swap(int[] nums, int i, int j) {
    int temp = nums[i];
    nums[i] = nums[j];
    nums[j] = temp;
}
```

---

## Same Direction Pointers <a name="same-direction"></a>

### Remove Duplicates from Sorted Array (LeetCode 26)

```java
/*
Reader-Writer pattern: Reader scans, writer places unique elements.
*/

public int removeDuplicates(int[] nums) {
    if (nums.length == 0) return 0;

    int writer = 1;  // Next position to write

    for (int reader = 1; reader < nums.length; reader++) {
        if (nums[reader] != nums[reader - 1]) {
            nums[writer] = nums[reader];
            writer++;
        }
    }
    return writer;
}
```

### Visual: Reader-Writer Pattern

```
Array: [0, 0, 1, 1, 1, 2, 2, 3, 3, 4]

Step 1: writer=1, reader=1
        [0, 0, 1, 1, 1, 2, 2, 3, 3, 4]
            W  R
        nums[1] == nums[0] → skip

Step 2: writer=1, reader=2
        [0, 0, 1, 1, 1, 2, 2, 3, 3, 4]
            W     R
        nums[2] != nums[1] → write!
        [0, 1, 1, 1, 1, 2, 2, 3, 3, 4]
               W

... continue until:
        [0, 1, 2, 3, 4, ...]
                       W
        Return 5
```

### Remove Element (LeetCode 27)

```java
public int removeElement(int[] nums, int val) {
    int writer = 0;

    for (int reader = 0; reader < nums.length; reader++) {
        if (nums[reader] != val) {
            nums[writer] = nums[reader];
            writer++;
        }
    }
    return writer;
}
```

### Move Zeroes (LeetCode 283)

```java
public void moveZeroes(int[] nums) {
    int writer = 0;

    // Move non-zeros to front
    for (int reader = 0; reader < nums.length; reader++) {
        if (nums[reader] != 0) {
            nums[writer] = nums[reader];
            writer++;
        }
    }

    // Fill rest with zeros
    while (writer < nums.length) {
        nums[writer] = 0;
        writer++;
    }
}

// Alternative: Swap approach (maintains relative order of non-zeros)
public void moveZeroes2(int[] nums) {
    int slow = 0;

    for (int fast = 0; fast < nums.length; fast++) {
        if (nums[fast] != 0) {
            int temp = nums[slow];
            nums[slow] = nums[fast];
            nums[fast] = temp;
            slow++;
        }
    }
}
```

### Remove Duplicates II - Allow 2 (LeetCode 80)

```java
/*
Allow at most 2 duplicates.
*/

public int removeDuplicates(int[] nums) {
    if (nums.length <= 2) return nums.length;

    int writer = 2;  // First two elements always kept

    for (int reader = 2; reader < nums.length; reader++) {
        // Compare with element 2 positions back
        if (nums[reader] != nums[writer - 2]) {
            nums[writer] = nums[reader];
            writer++;
        }
    }
    return writer;
}

// Generalized for k duplicates
public int removeDuplicatesK(int[] nums, int k) {
    if (nums.length <= k) return nums.length;

    int writer = k;

    for (int reader = k; reader < nums.length; reader++) {
        if (nums[reader] != nums[writer - k]) {
            nums[writer] = nums[reader];
            writer++;
        }
    }
    return writer;
}
```

---

## Fast & Slow Pointers <a name="fast-slow"></a>

### Floyd's Cycle Detection (Linked List Cycle)

```java
/*
Classic tortoise and hare algorithm.
If cycle exists, fast will eventually catch slow.
*/

public boolean hasCycle(ListNode head) {
    if (head == null) return false;

    ListNode slow = head;
    ListNode fast = head;

    while (fast != null && fast.next != null) {
        slow = slow.next;           // Move 1 step
        fast = fast.next.next;      // Move 2 steps

        if (slow == fast) {
            return true;  // Cycle detected
        }
    }
    return false;  // Fast reached end, no cycle
}
```

### Visual: Floyd's Algorithm

```
List with cycle:

1 → 2 → 3 → 4 → 5
            ↑   ↓
            8 ← 6

Step 0: S=1, F=1
Step 1: S=2, F=3
Step 2: S=3, F=5
Step 3: S=4, F=6
Step 4: S=5, F=8
Step 5: S=6, F=4
Step 6: S=8, F=6
Step 7: S=4, F=8
Step 8: S=5, F=4
Step 9: S=6, F=6 ✓ MEET!
```

### Find Cycle Start (LeetCode 142)

```java
/*
After detecting cycle, find where it starts.
Math: Distance from head to cycle start = Distance from meeting point to cycle start.
*/

public ListNode detectCycle(ListNode head) {
    if (head == null) return null;

    ListNode slow = head;
    ListNode fast = head;

    // Phase 1: Detect cycle
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;

        if (slow == fast) {
            // Phase 2: Find cycle start
            ListNode pointer = head;
            while (pointer != slow) {
                pointer = pointer.next;
                slow = slow.next;
            }
            return pointer;
        }
    }
    return null;
}
```

### Middle of Linked List (LeetCode 876)

```java
/*
When fast reaches end, slow is at middle.
*/

public ListNode middleNode(ListNode head) {
    ListNode slow = head;
    ListNode fast = head;

    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
    }
    return slow;  // For even length, returns second middle
}

// Return first middle for even length:
public ListNode firstMiddle(ListNode head) {
    ListNode slow = head;
    ListNode fast = head;

    while (fast.next != null && fast.next.next != null) {
        slow = slow.next;
        fast = fast.next.next;
    }
    return slow;
}
```

### Happy Number (LeetCode 202)

```java
/*
Detect cycle in number sequence.
*/

public boolean isHappy(int n) {
    int slow = n;
    int fast = n;

    do {
        slow = sumOfSquares(slow);
        fast = sumOfSquares(sumOfSquares(fast));
    } while (slow != fast);

    return slow == 1;
}

private int sumOfSquares(int n) {
    int sum = 0;
    while (n > 0) {
        int digit = n % 10;
        sum += digit * digit;
        n /= 10;
    }
    return sum;
}
```

### Find Duplicate Number (LeetCode 287)

```java
/*
Treat array as linked list where nums[i] points to index nums[i].
Find duplicate = find cycle start.
*/

public int findDuplicate(int[] nums) {
    // Phase 1: Find meeting point
    int slow = nums[0];
    int fast = nums[0];

    do {
        slow = nums[slow];
        fast = nums[nums[fast]];
    } while (slow != fast);

    // Phase 2: Find cycle start (duplicate)
    slow = nums[0];
    while (slow != fast) {
        slow = nums[slow];
        fast = nums[fast];
    }
    return slow;
}
```

---

## Sliding Window Connection <a name="sliding-window"></a>

### Sliding Window as Two Pointers

```
┌─────────────────────────────────────────────────────────────────┐
│           SLIDING WINDOW = TWO POINTERS + WINDOW STATE          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Sliding Window Template:                                       │
│                                                                 │
│  left = 0                                                       │
│  for right in range(n):                                         │
│      # Expand: add element at right to window                   │
│      window.add(arr[right])                                     │
│                                                                 │
│      # Shrink: while window is invalid/too large                │
│      while invalid(window):                                     │
│          window.remove(arr[left])                               │
│          left++                                                 │
│                                                                 │
│      # Update answer if needed                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Minimum Window Substring (LeetCode 76)

```java
public String minWindow(String s, String t) {
    if (s.length() < t.length()) return "";

    // Count needed characters
    Map<Character, Integer> need = new HashMap<>();
    for (char c : t.toCharArray()) {
        need.put(c, need.getOrDefault(c, 0) + 1);
    }

    int required = need.size();
    int formed = 0;
    Map<Character, Integer> window = new HashMap<>();

    int left = 0;
    int minLen = Integer.MAX_VALUE;
    int minLeft = 0;

    for (int right = 0; right < s.length(); right++) {
        // Expand
        char c = s.charAt(right);
        window.put(c, window.getOrDefault(c, 0) + 1);

        if (need.containsKey(c) && window.get(c).equals(need.get(c))) {
            formed++;
        }

        // Shrink
        while (formed == required) {
            if (right - left + 1 < minLen) {
                minLen = right - left + 1;
                minLeft = left;
            }

            char leftChar = s.charAt(left);
            window.put(leftChar, window.get(leftChar) - 1);

            if (need.containsKey(leftChar) &&
                window.get(leftChar) < need.get(leftChar)) {
                formed--;
            }
            left++;
        }
    }

    return minLen == Integer.MAX_VALUE ? "" : s.substring(minLeft, minLeft + minLen);
}
```

### Longest Substring Without Repeating Characters (LeetCode 3)

```java
public int lengthOfLongestSubstring(String s) {
    Set<Character> window = new HashSet<>();
    int left = 0;
    int maxLen = 0;

    for (int right = 0; right < s.length(); right++) {
        // Shrink while duplicate exists
        while (window.contains(s.charAt(right))) {
            window.remove(s.charAt(left));
            left++;
        }

        // Expand
        window.add(s.charAt(right));
        maxLen = Math.max(maxLen, right - left + 1);
    }
    return maxLen;
}
```

---

🔬 **Section Challenge — Sliding Window Connection <a name="sliding-window"></a>**

**Challenge 1 (Reasoning):** Sliding window guarantees O(N). How? Each element is added and removed exactly how many times?

<details><summary>Answer</summary>

Each element enters the window exactly ONCE (right pointer advances past it) and leaves exactly ONCE (left pointer advances past it). Total operations: 2N regardless of window size changes. Compare to brute force: for each ending position, scan back to find optimal start = O(N²). The window's state (sum, freq map, etc.) is maintained INCREMENTALLY — O(1) per pointer move.

</details>

**Challenge 2 (Bug Hunt):** Minimum Window Substring: the while loop to shrink the window runs `while(valid) { shrink; }`. What's wrong with this logic?

<details><summary>Answer</summary>

Should shrink `while(valid)` to find the minimum window — this is correct! But the common bug: not updating `left++` BEFORE rechecking validity, or forgetting to update the answer BEFORE shrinking. The answer should be captured at the moment the window first becomes valid, then kept updated as we shrink to find smaller valid windows.

</details>

## Multi-Array Two Pointers <a name="multi-array"></a>

### Merge Two Sorted Arrays (LeetCode 88)

```java
/*
Merge nums2 into nums1 (nums1 has space).
Key: Start from END to avoid overwriting.
*/

public void merge(int[] nums1, int m, int[] nums2, int n) {
    int p1 = m - 1;
    int p2 = n - 1;
    int write = m + n - 1;

    while (p2 >= 0) {
        if (p1 >= 0 && nums1[p1] > nums2[p2]) {
            nums1[write] = nums1[p1];
            p1--;
        } else {
            nums1[write] = nums2[p2];
            p2--;
        }
        write--;
    }
}
```

### Visual: Merge from End

```
nums1 = [1, 2, 3, 0, 0, 0], m = 3
nums2 = [2, 5, 6], n = 3

Step 1: p1=2, p2=2, write=5
        nums1[2]=3 < nums2[2]=6
        nums1[5] = 6
        [1, 2, 3, 0, 0, 6]

Step 2: p1=2, p2=1, write=4
        nums1[2]=3 < nums2[1]=5
        nums1[4] = 5
        [1, 2, 3, 0, 5, 6]

Step 3: p1=2, p2=0, write=3
        nums1[2]=3 > nums2[0]=2
        nums1[3] = 3
        [1, 2, 3, 3, 5, 6]

... continue to get:
        [1, 2, 2, 3, 5, 6]
```

### Intersection of Two Arrays II (LeetCode 350)

```java
public int[] intersect(int[] nums1, int[] nums2) {
    Arrays.sort(nums1);
    Arrays.sort(nums2);

    int p1 = 0, p2 = 0;
    List<Integer> result = new ArrayList<>();

    while (p1 < nums1.length && p2 < nums2.length) {
        if (nums1[p1] == nums2[p2]) {
            result.add(nums1[p1]);
            p1++;
            p2++;
        } else if (nums1[p1] < nums2[p2]) {
            p1++;
        } else {
            p2++;
        }
    }

    return result.stream().mapToInt(i -> i).toArray();
}
```

### Compare Version Numbers (LeetCode 165)

```java
public int compareVersion(String version1, String version2) {
    String[] v1 = version1.split("\\.");
    String[] v2 = version2.split("\\.");

    int p1 = 0, p2 = 0;

    while (p1 < v1.length || p2 < v2.length) {
        int num1 = p1 < v1.length ? Integer.parseInt(v1[p1]) : 0;
        int num2 = p2 < v2.length ? Integer.parseInt(v2[p2]) : 0;

        if (num1 < num2) return -1;
        if (num1 > num2) return 1;

        p1++;
        p2++;
    }
    return 0;
}
```

---

## Advanced Patterns <a name="advanced"></a>

### Trapping Rain Water (LeetCode 42)

```java
/*
Two pointers from both ends.
Track max height seen from each side.
Water at position = min(leftMax, rightMax) - height[i]
*/

public int trap(int[] height) {
    int left = 0, right = height.length - 1;
    int leftMax = 0, rightMax = 0;
    int water = 0;

    while (left < right) {
        if (height[left] < height[right]) {
            if (height[left] >= leftMax) {
                leftMax = height[left];
            } else {
                water += leftMax - height[left];
            }
            left++;
        } else {
            if (height[right] >= rightMax) {
                rightMax = height[right];
            } else {
                water += rightMax - height[right];
            }
            right--;
        }
    }
    return water;
}
```

### Visual: Trapping Rain Water

```
height = [0,1,0,2,1,0,1,3,2,1,2,1]

          |
    |     ||
 |  ||  | |||| |
       trapped water

Two pointer approach:
- If left bar < right bar: water depends on leftMax
- If right bar < left bar: water depends on rightMax

Move the smaller pointer because water is bounded by the smaller side.
```

### 3Sum Closest (LeetCode 16)

```java
public int threeSumClosest(int[] nums, int target) {
    Arrays.sort(nums);
    int closest = nums[0] + nums[1] + nums[2];

    for (int i = 0; i < nums.length - 2; i++) {
        int left = i + 1, right = nums.length - 1;

        while (left < right) {
            int sum = nums[i] + nums[left] + nums[right];

            if (Math.abs(sum - target) < Math.abs(closest - target)) {
                closest = sum;
            }

            if (sum < target) {
                left++;
            } else if (sum > target) {
                right--;
            } else {
                return sum;  // Exact match
            }
        }
    }
    return closest;
}
```

### Partition Labels (LeetCode 763)

```java
/*
Find partitions where each letter appears in at most one part.
*/

public List<Integer> partitionLabels(String s) {
    // Record last occurrence of each character
    int[] last = new int[26];
    for (int i = 0; i < s.length(); i++) {
        last[s.charAt(i) - 'a'] = i;
    }

    List<Integer> result = new ArrayList<>();
    int start = 0, end = 0;

    for (int i = 0; i < s.length(); i++) {
        end = Math.max(end, last[s.charAt(i) - 'a']);

        if (i == end) {
            result.add(end - start + 1);
            start = end + 1;
        }
    }
    return result;
}
```

### Boats to Save People (LeetCode 881)

```java
/*
Each boat holds 2 people with weight limit.
Greedy: Pair heaviest with lightest if possible.
*/

public int numRescueBoats(int[] people, int limit) {
    Arrays.sort(people);
    int left = 0, right = people.length - 1;
    int boats = 0;

    while (left <= right) {
        if (people[left] + people[right] <= limit) {
            left++;  // Light person fits with heavy
        }
        right--;  // Heavy person always gets on
        boats++;
    }
    return boats;
}
```

---

## Interview Problems <a name="interview-problems"></a>

### Problem Categories

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

### Squares of a Sorted Array (LeetCode 977)

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

### Valid Palindrome II (LeetCode 680)

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

### Backspace String Compare (LeetCode 844)

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

## 🏢 Enterprise Lens — Two Pointers

| Area | What top-tier engineering looks like |
| ---- | ------------------------------------ |
| **Where it runs in production** | Deduplication in pipelines, merging sorted streams, in-place compaction, partition steps in sorting |
| **Failure modes** | Applying it to unsorted data; forgetting duplicate handling; moving the wrong pointer |
| **Testing and verification** | Brute-force comparison on random arrays; test duplicates, length 0/1/2, all-equal |
| **Review checklist** | Complexity stated for time **and** space · invariant stated · edge cases listed (empty, one element, duplicates, extremes) · behaviour at 10× data understood |

---

## Reality Check

**"Two pointers is one pattern"** → It is at least four with different invariants: CONVERGING (sorted pair-sum: pointers close in, each step permanently discards candidates), PARALLEL (merge two sorted lists: pointers advance independently), FAST-SLOW (cycle detection: relative speed creates the meeting guarantee), and PARTITION (Dutch flag: pointers separate zones inside one array). Knowing "use two pointers" without knowing WHICH invariant is why implementations stall at the first edge case.

**"The proof of converging pointers is obvious"** → The proof is an exchange argument most people cannot state: when arr[lo] + arr[hi] < target, EVERY pair (lo, x) with x < hi is also < target — so lo can be advanced without losing any solution. Interviewers who ask "why does this not miss a pair?" filter out everyone who learned the movement rule without the discard rule. If you can state the discard rule, you can also re-derive the variant for products, differences, and 3-sum.

**"Fast-slow only detects cycles"** → The speed-differential trick answers several questions: middle of list (fast at 2x), kth from end (fast leads by k), cycle START (the two-phase Floyd walk after meeting), and duplicate-finding in value-as-pointer arrays (LeetCode 287 — an array problem solved by linked-list machinery). The unifying idea is that relative speed converts position questions into meeting questions.

**"Two pointers requires sorted input"** → Only the converging variant does. Fast-slow runs on unsorted lists; partition pointers CREATE order; parallel pointers need each input sorted but not the pair jointly. And when the converging variant needs sorting first, that O(n log n) dominates — worth saying aloud in an interview, because "two pointers is O(n)" is only true after someone paid for the sort.

**"When two pointers fails, add a third loop"** → When the pair logic needs history ("has this value appeared"), the escalation is a HashMap, not a third pointer; when it needs future knowledge ("next greater to the right"), it is a monotonic stack. 3-sum is the exception that proves the rule: one outer loop plus converging pointers — the third pointer is really the outer iteration, still O(n squared) not O(n cubed).
