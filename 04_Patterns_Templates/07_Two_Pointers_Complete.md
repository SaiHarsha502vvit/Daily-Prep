**Navigation**: [< Previous](06_Binary_Search_Patterns.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](08_Array_Plus_TwoPointers.md)

---

### Historical Evolution

**Inventor / Originator:** Two pointers evolved from cycle detection (Robert Floyd 1967), the Dutch National Flag problem (Edsger Dijkstra 1976), and Hoare's quicksort partitioning (1959).

**Predecessor context:** Pair-finding problems required O(n²) brute force — checking all combinations. Sorting first then using two pointers reduced this to O(n log n) + O(n).

**Evolution narrative:** Floyd's tortoise-and-hare algorithm (1967) introduced the fast/slow pointer concept. Dijkstra's Dutch National Flag (1976) formalized the three-way partitioning that maps to three-pointer problems. Hoare's partitioning scheme (1959) enabled in-place quicksort.

**Modern practice:** Two pointers are fundamental to LeetCode's "Two Pointers" category (hundreds of problems). Floyd's cycle detection runs in every linked list's containsCycle implementation.

- **Hoare quicksort partition — 1959**: In-place partitioning scheme; foundation of two-pointer partitioning
- **Floyd cycle detection — 1967**: "Tortoise and Hare" algorithm for O(n) cycle detection
- **Dijkstra Dutch National Flag — 1976**: Three-way partitioning for elements with discrete values
- **Modern practice**: Floyd's algorithm in every language's linked list library

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

🔗 **Practice problems:** [Two Pointers PS](../05_Problem_Solving/03_TwoPointers.md)
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

### The Core Concept

TWO POINTERS IN ONE SENTENCE

"Use two references to traverse data structure
efficiently, reducing O(n²) to O(n)."

Why it works:

- Avoids nested loops by moving pointers intelligently
- Makes decisions based on current state
- Exploits sorted/structured properties of data

### Visual: The Power of Two Pointers

```
Problem: Find pair with target sum in SORTED array

Brute Force O(n²):                  Two Pointers O(n):
┌────────────────────┐              ┌────────────────────────┐
│ for i = 0 to n:    │              │ left → ... ... ← right │
│   for j = i+1 to n:│              │                        │
│     check(i,j)     │              │ Move based on sum:     │
│                    │              │ sum < target: left++   │
│                    │              │ sum > target: right--  │
└────────────────────┘              └────────────────────────┘

Array [1, 2, 4, 6, 8, 9], target = 10

Brute: Check all 15 pairs
Two Pointers: At most 6 moves
```

---

🔬 **Section Challenge — Two Pointers Fundamentals <a name="fundamentals"></a>**

**Challenge 1 (Reasoning):** Two-pointer pattern reduces O(N²) brute force to O(N). What is the KEY invariant that makes this safe?

<details><summary>Answer</summary>

The invariant: all pairs we SKIP are guaranteed to not contain the answer. In 3Sum: once we fix `nums[i]` and use l/r pointers, we can safely skip because the array is sorted. If `sum > 0`: decreasing r decreases the sum (smaller right value). If `sum < 0`: increasing l increases the sum (larger left value). We never skip a valid pair because monotonicity guarantees it.

</details>

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

🔬 **Section Challenge — Multi-Array Two Pointers <a name="multi-array"></a>**

**Challenge 1 (Reasoning):** Two-pointer pattern reduces O(N²) brute force to O(N). What is the KEY invariant that makes this safe?

<details><summary>Answer</summary>

The invariant: all pairs we SKIP are guaranteed to not contain the answer. In 3Sum: once we fix `nums[i]` and use l/r pointers, we can safely skip because the array is sorted. If `sum > 0`: decreasing r decreases the sum (smaller right value). If `sum < 0`: increasing l increases the sum (larger left value). We never skip a valid pair because monotonicity guarantees it.

</details>

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

---

**Navigation**: [< Previous](06_Binary_Search_Patterns.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](08_Array_Plus_TwoPointers.md)

🔬 **Section Challenge — Summary**

**Challenge 1 (Reasoning):** Prefix sum initialized as `prefix[0] = 0` — why the leading zero and not `prefix[0] = arr[0]`?

<details><summary>Answer</summary>

`prefix[0] = 0` (empty prefix) makes range sum formula uniform: `sum(l,r) = prefix[r+1] - prefix[l]`. Without the 0: `sum(0,r) = prefix[r] - 0` (special case needed). With it: `sum(0,r) = prefix[r+1] - prefix[0] = prefix[r+1]`. Same formula everywhere. This is the 'sentinel' pattern — adding a dummy initial value to eliminate special cases. Same trick used in dummy linked list nodes.

</details>
