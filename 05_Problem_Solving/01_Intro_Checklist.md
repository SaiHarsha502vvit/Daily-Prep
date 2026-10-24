> **Navigation**: [Chapter index](00_INDEX.md) | [Arrays →](04_Arrays.md)


---

# 🧪 PRACTICE PROBLEMS WITH SOLUTIONS

## Solve these problems to test your understanding!

---

## 🔗 Bridge — Where This Chapter Fits

| Dimension | This chapter |
| --- | --- |
| **Builds on** | [Algorithm Thinking](../03_Algorithms/01_Algorithm_Thinking.md), [Pattern Recognition](../04_Patterns_Templates/04_Pattern_Recognition.md) |
| **You will learn** | The read → brute force → bottleneck → optimise → test loop, timeboxing, and a reusable checklist of edge cases |
| **Leads to** | [Arrays](04_Arrays.md) and every topic page after it |
| **Abstraction level** | Reading a problem → **a repeatable method** → topic-specific patterns |

> [!NOTE]
> The full gap-free reading order and dependency graph are in the [Learning Path](00_LEARNING_PATH.md).

---

## 💬 Explain It Like a Study Partner — Problem-Solving Method

### 1. The bottom line

Before you code, say what is being asked, solve it the slow way, find the repeated work, and only then optimise.

### 2. The textbook core

- Read the constraints first: they set the complexity budget.
- Write the brute force; it gives a correctness oracle.
- Find the bottleneck (repeated work) and name the data structure or pattern that removes it.
- State the invariant, then code.
- Test empty, one element, duplicates, extremes.

### 3. The real-world analogy

A **mechanic diagnosing a car**: symptoms (constraints), a simple test (brute force), the faulty part (bottleneck), then the repair.

### 4. Walkthrough

1. Problem: do two numbers in an array sum to `t`?
2. Brute force: two nested loops, `O(n²)`.
3. Bottleneck: searching for the partner of each number.
4. A hash set of seen numbers makes the search `O(1)` → `O(n)` total.
5. Test: empty array, one element, duplicates like `[3,3]` with `t = 6`.

> [!NOTE]
> **Quick check:** What does the brute force give you besides a slow answer? *A correct reference to test the optimised version against.*


### 5. Check yourself

**Q1.** With `n = 2·10⁵` and a one-second limit, which complexity is acceptable?

<details><summary>Answer</summary>

`O(n log n)` or `O(n)`; `O(n²)` is about 4·10¹⁰ steps.

</details>

**Q2.** What do you write right after reading the problem?

<details><summary>Answer</summary>

The brute force: it exposes the bottleneck and gives you a reference to test against.

</details>

---


## 📚 TABLE OF CONTENTS

1. [Two Pointers Problems](#-two-pointers-problems)
2. [Sliding Window Problems](#-sliding-window-problems)
3. [Binary Search Problems](#-binary-search-problems)
4. [Array Problems](#-array-problems)
5. [String Problems](#-string-problems)
6. [Math Problems](#-math-problems)

---

## 🧩 Two Pointers Problems

### Problem 1: Container With Most Water

PROBLEM: Container With Most Water

Given array of heights, find two lines that form container with
maximum water.

Visual (heights `[1, 8, 6, 2, 5, 4, 8, 3, 7]`):

| Index | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Height | 1 | **8** | 6 | 2 | 5 | 4 | **8** | 3 | **7** |

The best container uses the lines of height 8 (index 1) and 7 (index 8): width = 8 − 1 = 7, height = min(8, 7) = 7, so area = 7 × 7 = 49.

**Try it yourself first!**

<details>
<summary>Click to see solution</summary>

```java
/**
 * Two pointers from both ends
 * Area = min(height[left], height[right]) × (right - left)
 * Move the shorter line inward (to potentially find taller one)
 */
public int maxArea(int[] height) {
    int left = 0;
    int right = height.length - 1;
    int maxWater = 0;

    while (left < right) {
        // Calculate current area
        int width = right - left;
        int h = Math.min(height[left], height[right]);
        int area = width * h;
        maxWater = Math.max(maxWater, area);

        // Move shorter line inward
        if (height[left] < height[right]) {
            left++;
        } else {
            right--;
        }
    }
    return maxWater;
}
// Time: O(N), Space: O(1)
```

</details>

---

### Problem 2: 3Sum (Find triplets that sum to zero)

**PROBLEM: 3Sum**

```text
Find all unique triplets that sum to zero.

Input: [-1, 0, 1, 2, -1, -4]
Output: [[-1, -1, 2], [-1, 0, 1]]

Approach:
1. Sort array
2. For each element, use two pointers to find pairs

Sorted: [-4, -1, -1, 0, 1, 2]
          ↑
         fix one, find pair that sums to -nums[i]
```

**Try it yourself first!**

<details>
<summary>Click to see solution</summary>

```java
public List<List<Integer>> threeSum(int[] nums) {
    List<List<Integer>> result = new ArrayList<>();
    Arrays.sort(nums);  // Sort first!

    for (int i = 0; i < nums.length - 2; i++) {
        // Skip duplicates for first number
        if (i > 0 && nums[i] == nums[i - 1]) continue;

        // Two pointers for remaining two numbers
        int left = i + 1;
        int right = nums.length - 1;
        int target = -nums[i];  // Need two numbers that sum to this

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
// Time: O(N²), Space: O(1) excluding output
```

</details>

---

🔬 **Section Challenge — 🧩 Two Pointers Problems**

**Challenge 1 (Reasoning):** Two-pointer pattern reduces O(N²) brute force to O(N). What is the KEY invariant that makes this safe?

<details><summary>Answer</summary>

The invariant: all pairs we SKIP are guaranteed to not contain the answer. In 3Sum: once we fix `nums[i]` and use l/r pointers, we can safely skip because the array is sorted. If `sum > 0`: decreasing r decreases the sum (smaller right value). If `sum < 0`: increasing l increases the sum (larger left value). We never skip a valid pair because monotonicity guarantees it.

</details>

## 🧩 Sliding Window Problems

### Problem 3: Longest Substring Without Repeating Characters

```
PROBLEM: Longest Substring Without Repeating Characters
──────────────────────────────────────────────────

Input: "abcabcbb"
Output: 3 ("abc")

Visual:
a b c a b c b b
↑─────↑
└─────┘ "abc" length 3

  ↑───────↑
  └───────┘ "bca" length 3

When we see repeat, shrink window from left

```

**Try it yourself first!**

<details>
<summary>Click to see solution</summary>

```java
public int lengthOfLongestSubstring(String s) {
    Set<Character> seen = new HashSet<>();
    int maxLength = 0;
    int left = 0;

    for (int right = 0; right < s.length(); right++) {
        char c = s.charAt(right);

        // Shrink window while we have duplicate
        while (seen.contains(c)) {
            seen.remove(s.charAt(left));
            left++;
        }

        // Add current character
        seen.add(c);

        // Update max length
        maxLength = Math.max(maxLength, right - left + 1);
    }
    return maxLength;
}
// Time: O(N), Space: O(min(N, 26))
```

</details>

---

### Problem 4: Maximum Sum of Subarray of Size K

```
PROBLEM: Maximum Sum Subarray of Size K
──────────────────────────────────────────────────

Input: arr = [2, 1, 5, 1, 3, 2], k = 3
Output: 9 (subarray [5, 1, 3])

Visual:
┌─────────┐
2  1  5  1  3  2     sum = 8
└─────────┘

   ┌─────────┐
2  1  5  1  3  2     sum = 7
   └─────────┘

      ┌─────────┐
2  1  5  1  3  2     sum = 9 ⭐ MAX
      └─────────┘

```

**Try it yourself first!**

<details>
<summary>Click to see solution</summary>

```java
public int maxSumSubarrayK(int[] arr, int k) {
    // Build first window
    int windowSum = 0;
    for (int i = 0; i < k; i++) {
        windowSum += arr[i];
    }

    int maxSum = windowSum;

    // Slide window
    for (int i = k; i < arr.length; i++) {
        windowSum = windowSum + arr[i] - arr[i - k];  // Add new, remove old
        maxSum = Math.max(maxSum, windowSum);
    }
    return maxSum;
}
// Time: O(N), Space: O(1)
```

</details>

---

🔬 **Section Challenge — 🧩 Sliding Window Problems**

**Challenge 1 (Reasoning):** Sliding window guarantees O(N). How? Each element is added and removed exactly how many times?

<details><summary>Answer</summary>

Each element enters the window exactly ONCE (right pointer advances past it) and leaves exactly ONCE (left pointer advances past it). Total operations: 2N regardless of window size changes. Compare to brute force: for each ending position, scan back to find optimal start = O(N²). The window's state (sum, freq map, etc.) is maintained INCREMENTALLY — O(1) per pointer move.

</details>

**Challenge 2 (Bug Hunt):** Minimum Window Substring: the while loop to shrink the window runs `while(valid) { shrink; }`. What's wrong with this logic?

<details><summary>Answer</summary>

Should shrink `while(valid)` to find the minimum window — this is correct! But the common bug: not updating `left++` BEFORE rechecking validity, or forgetting to update the answer BEFORE shrinking. The answer should be captured at the moment the window first becomes valid, then kept updated as we shrink to find smaller valid windows.

</details>

## 🔍 Binary Search Problems

### Problem 5: Search in Rotated Sorted Array

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  PROBLEM: Search in Rotated Sorted Array                                  ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Array was sorted, then rotated at some pivot.                            ║
║  Find target in O(log N).                                                 ║
║                                                                           ║
║  Original: [0, 1, 2, 4, 5, 6, 7]                                          ║
║  Rotated:  [4, 5, 6, 7, 0, 1, 2]  (rotated at pivot 4)                    ║
║  Target: 0                                                                ║
║  Output: 4 (index of 0)                                                   ║
║                                                                           ║
║  Key insight: One half is ALWAYS sorted!                                  ║
║                                                                           ║
║  [4, 5, 6, 7, 0, 1, 2]                                                    ║
║   ↑        ↑        ↑                                                     ║
║  low      mid     high                                                    ║
║                                                                           ║
║  Left half [4,5,6,7] is sorted (arr[low] <= arr[mid])                     ║
║  Check if target is in sorted half, else search other half                ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

**Try it yourself first!**

<details>
<summary>Click to see solution</summary>

```java
public int search(int[] nums, int target) {
    int low = 0, high = nums.length - 1;

    while (low <= high) {
        int mid = low + (high - low) / 2;

        if (nums[mid] == target) return mid;

        // Check which half is sorted
        if (nums[low] <= nums[mid]) {
            // Left half is sorted
            if (target >= nums[low] && target < nums[mid]) {
                high = mid - 1;  // Target in left half
            } else {
                low = mid + 1;   // Target in right half
            }
        } else {
            // Right half is sorted
            if (target > nums[mid] && target <= nums[high]) {
                low = mid + 1;   // Target in right half
            } else {
                high = mid - 1;  // Target in left half
            }
        }
    }
    return -1;
}
// Time: O(log N), Space: O(1)
```

</details>

---

### Problem 6: Find Peak Element

**PROBLEM: Find Peak Element**

```text
Peak = element greater than its neighbors.
nums[-1] and nums[n] are considered -∞.

Input: [1, 2, 3, 1]
Output: 2 (index of element 3)

Visual:
       3 ← peak
      /\
     2  \
    /    1
   1

Binary Search approach:
- If arr[mid] < arr[mid+1], peak is on RIGHT
- If arr[mid] > arr[mid+1], peak is on LEFT (including mid)
```

**Try it yourself first!**

<details>
<summary>Click to see solution</summary>

```java
public int findPeakElement(int[] nums) {
    int low = 0, high = nums.length - 1;

    while (low < high) {  // Note: < not <=
        int mid = low + (high - low) / 2;

        if (nums[mid] < nums[mid + 1]) {
            // Going uphill, peak is on right
            low = mid + 1;
        } else {
            // Going downhill, peak is on left (or at mid)
            high = mid;  // Note: mid, not mid - 1
        }
    }
    return low;  // low == high at this point
}
// Time: O(log N), Space: O(1)
```

</details>

---

**Challenge 2 (Design):** Binary search on a rotated array `[4,5,6,7,0,1,2]`. How do you determine which half is sorted?

<details><summary>Answer</summary>

Compare `nums[lo]` and `nums[mid]`. If `nums[lo] <= nums[mid]`: left half is sorted. Check if target is in `[nums[lo], nums[mid])` — if yes, search left; else search right. Otherwise right half is sorted. Check if target is in `(nums[mid], nums[hi]]` — if yes, search right; else search left. This always works because at least one half of a rotated sorted array is always sorted.

</details>

## 📊 Array Problems

### Problem 7: Rotate Array

**PROBLEM: Rotate Array**

```text
Rotate array to the right by k steps.

Input: [1, 2, 3, 4, 5, 6, 7], k = 3
Output: [5, 6, 7, 1, 2, 3, 4]

Approach: Three reverses

Original:    [1, 2, 3, 4, 5, 6, 7]
Reverse all: [7, 6, 5, 4, 3, 2, 1]
Reverse [0, k-1]: [5, 6, 7, 4, 3, 2, 1]
Reverse [k, n-1]: [5, 6, 7, 1, 2, 3, 4] ✓
```

**Try it yourself first!**

<details>
<summary>Click to see solution</summary>

```java
public void rotate(int[] nums, int k) {
    k = k % nums.length;  // Handle k > length

    reverse(nums, 0, nums.length - 1);  // Reverse all
    reverse(nums, 0, k - 1);            // Reverse first k
    reverse(nums, k, nums.length - 1);  // Reverse rest
}

private void reverse(int[] nums, int start, int end) {
    while (start < end) {
        int temp = nums[start];
        nums[start] = nums[end];
        nums[end] = temp;
        start++;
        end--;
    }
}
// Time: O(N), Space: O(1)
```

</details>

---

### Problem 8: Product of Array Except Self

**PROBLEM: Product of Array Except Self**

```text
Return array where each element is product of all OTHER elements.
Cannot use division.

Input: [1, 2, 3, 4]
Output: [24, 12, 8, 6]

output[0] = 2 * 3 * 4 = 24
output[1] = 1 * 3 * 4 = 12
output[2] = 1 * 2 * 4 = 8
output[3] = 1 * 2 * 3 = 6

Approach: Left products × Right products

Left products:  [1, 1, 2, 6]    (product of all to the left)
Right products: [24, 12, 4, 1]  (product of all to the right)
Result:         [24, 12, 8, 6]  (multiply left × right)
```

**Try it yourself first!**

<details>
<summary>Click to see solution</summary>

```java
public int[] productExceptSelf(int[] nums) {
    int n = nums.length;
    int[] result = new int[n];

    // First pass: left products
    result[0] = 1;
    for (int i = 1; i < n; i++) {
        result[i] = result[i - 1] * nums[i - 1];
    }

    // Second pass: multiply by right products
    int rightProduct = 1;
    for (int i = n - 1; i >= 0; i--) {
        result[i] = result[i] * rightProduct;
        rightProduct *= nums[i];
    }

    return result;
}
// Time: O(N), Space: O(1) excluding output
```

</details>

---

## 📝 String Problems

### Problem 9: Valid Palindrome

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  PROBLEM: Valid Palindrome                                                ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Check if string is palindrome (considering only alphanumeric, ignore     ║
║  case).                                                                   ║
║                                                                           ║
║  Input: "A man, a plan, a canal: Panama"                                  ║
║  Output: true                                                             ║
║                                                                           ║
║  After cleaning: "amanaplanacanalpanama"                                  ║
║                   ↑                   ↑                                   ║
║                  left              right                                  ║
║                                                                           ║
║  Two pointers from both ends, skip non-alphanumeric                       ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

**Try it yourself first!**

<details>
<summary>Click to see solution</summary>

```java
public boolean isPalindrome(String s) {
    int left = 0, right = s.length() - 1;

    while (left < right) {
        // Skip non-alphanumeric from left
        while (left < right && !Character.isLetterOrDigit(s.charAt(left))) {
            left++;
        }
        // Skip non-alphanumeric from right
        while (left < right && !Character.isLetterOrDigit(s.charAt(right))) {
            right--;
        }

        // Compare (case insensitive)
        if (Character.toLowerCase(s.charAt(left)) !=
            Character.toLowerCase(s.charAt(right))) {
            return false;
        }

        left++;
        right--;
    }
    return true;
}
// Time: O(N), Space: O(1)
```

</details>

---

### Problem 10: Group Anagrams

**PROBLEM: Group Anagrams**

```text
Group words that are anagrams of each other.

Input: ["eat", "tea", "tan", "ate", "nat", "bat"]
Output: [["eat","tea","ate"], ["tan","nat"], ["bat"]]

Key insight: Anagrams have same SORTED form
eat → aet
tea → aet  (same!)
ate → aet  (same!)

Use sorted form as HashMap key
```

**Try it yourself first!**

<details>
<summary>Click to see solution</summary>

```java
public List<List<String>> groupAnagrams(String[] strs) {
    Map<String, List<String>> map = new HashMap<>();

    for (String s : strs) {
        // Create sorted key
        char[] chars = s.toCharArray();
        Arrays.sort(chars);
        String key = new String(chars);

        // Add to group
        if (!map.containsKey(key)) {
            map.put(key, new ArrayList<>());
        }
        map.get(key).add(s);
    }

    return new ArrayList<>(map.values());
}
// Time: O(N * K log K) where K = max string length
// Space: O(N * K)

// Alternative: Use character count as key (O(N * K) time)
public List<List<String>> groupAnagramsV2(String[] strs) {
    Map<String, List<String>> map = new HashMap<>();

    for (String s : strs) {
        // Create frequency key
        int[] count = new int[26];
        for (char c : s.toCharArray()) {
            count[c - 'a']++;
        }
        String key = Arrays.toString(count);  // "[1, 0, 0, ..., 0]"

        map.computeIfAbsent(key, k -> new ArrayList<>()).add(s);
    }

    return new ArrayList<>(map.values());
}
```

</details>

---

## 🧩 Math Problems

### Problem 11: Missing Number

**PROBLEM: Missing Number**

```text
Array contains n distinct numbers from [0, n]. Find missing one.

Input: [3, 0, 1]
Output: 2

Method 1: Math (Sum formula)
Expected sum = n * (n + 1) / 2
Missing = Expected sum - Actual sum

Method 2: XOR
XOR all indices 0 to n, XOR all array elements
Missing number will remain (duplicates cancel)
```

**Try it yourself first!**

<details>
<summary>Click to see solution</summary>

```java
// Method 1: Math
public int missingNumber(int[] nums) {
    int n = nums.length;
    int expectedSum = n * (n + 1) / 2;
    int actualSum = 0;
    for (int num : nums) {
        actualSum += num;
    }
    return expectedSum - actualSum;
}

// Method 2: XOR
public int missingNumberXOR(int[] nums) {
    int xor = nums.length;  // Start with n
    for (int i = 0; i < nums.length; i++) {
        xor ^= i;        // XOR with index
        xor ^= nums[i];  // XOR with element
    }
    return xor;
}
// Time: O(N), Space: O(1)
```

</details>

---

### Problem 12: Single Number

**PROBLEM: Single Number**

```text
Every element appears twice except one. Find that one.

Input: [4, 1, 2, 1, 2]
Output: 4

XOR property:
a ^ a = 0  (same numbers cancel)
a ^ 0 = a  (XOR with 0 gives same number)

4 ^ 1 ^ 2 ^ 1 ^ 2
= 4 ^ (1 ^ 1) ^ (2 ^ 2)
= 4 ^ 0 ^ 0
= 4
```

**Try it yourself first!**

<details>
<summary>Click to see solution</summary>

```java
public int singleNumber(int[] nums) {
    int result = 0;
    for (int num : nums) {
        result ^= num;  // XOR all elements
    }
    return result;
}
// Time: O(N), Space: O(1)
```

</details>

---

## 🎯 PRACTICE CHECKLIST

After solving each problem, ask yourself:

- [ ] Did I identify the correct pattern?
- [ ] Did I handle edge cases?
- [ ] Is my solution optimal (time & space)?
- [ ] Can I explain the approach clearly?
- [ ] Can I code it without looking at the solution?

---

## 📝 MORE PROBLEMS TO PRACTICE

Here are problem names to search on LeetCode/HackerRank:

**Two Pointers:**

- Move Zeroes
- Sort Colors (Dutch National Flag)
- Trapping Rain Water
- Merge Sorted Array

**Sliding Window:**

- Minimum Size Subarray Sum
- Permutation in String
- Find All Anagrams in String
- Sliding Window Maximum

**Binary Search:**

- Find Minimum in Rotated Sorted Array
- Search a 2D Matrix
- Sqrt(x)
- Find First and Last Position

**Arrays:**

- Merge Intervals
- Insert Interval
- Meeting Rooms II
- Next Permutation

**Strings:**

- Longest Palindromic Substring
- String to Integer (atoi)
- Implement strStr()
- Reverse Words in a String

---

## 🔥 COMPREHENSIVE PROBLEM BANK

### From Basics to Advanced - With LeetCode Links & Premium Problems

---


---

#### Historical Evolution

Systematic problem solving has long roots: Euclid's algorithm for the greatest common divisor appears in the *Elements* (about 300 BC) and the sieve attributed to Eratosthenes dates to the 3rd century BC. George Pólya's *How to Solve It* (1945) taught heuristics for attacking unfamiliar problems, and Turing's 1936 paper defined what an algorithm can compute. The maximum-subarray problem was posed by Ulf Grenander and its linear-time solution credited to Jay Kadane by Bentley's 1984 column.

- **Euclid — c. 300 BC**: Gcd algorithm with a termination argument
- **Pólya — 1945**: Heuristics: understand, plan, carry out, look back
- **Turing — 1936**: Formal model of computation
- **Bentley — 1984**: Popularised maximum subarray and Kadane's scan

#### Production Reality

**Problem Solving** patterns introduce several production failure modes that learners must internalize:

**Failure mode 1: Off-by-one errors in array boundaries.** When implementing two-pointer or sliding window solutions, developers frequently miscount loop termination conditions. For example, using `i <= n` instead of `i < n` in a zero-indexed array causes an `ArrayIndexOutOfBoundsException` at n=100000 on the final iteration. In LeetCode 11 (Container With Most Water), iterating with `left <= right` instead of `left < right` reads an invalid memory location in C++ causing undefined behavior. Illustrative impact: customer-facing 500 errors, data corruption if bounds are used for write operations, security vulnerability if out-of-bounds reads leak memory.

**Failure mode 2: Integer overflow on multiplication.** Computing `width * height` for area calculations in `maxArea` exceeds 32-bit bounds when width>46340 and height>46340, silently wrapping to negative values in Java. The two-sum complement check `target - nums[i]` overflows when both values are large negatives in Java's int range. Illustrative impact: wrong business logic decisions (incorrect pricing, billing errors), algorithm silently returns wrong answer, audit failures.

**Failure mode 3: Stack overflow on deep recursion.** Recursive implementations of tree traversals or divide-and-conquer algorithms hit `StackOverflowError` for inputs exceeding ~10^4 depth in JVM default stack (1MB). LeetCode's recursive Fibonacci `fib(n) = fib(n-1) + fib(n-2)` crashes at n>10000. Illustrative impact: application crash, denial of service if uncaught, cascading failure in distributed systems.

**Debug workflow:** 1. Trace execution with n=1, n=2, and edge cases (empty input, single element, maximum values). 2. Print loop variables at each iteration to verify pointer update rule. 3. Check for `<=` vs `<` in termination conditions. 4. Verify no overflow by testing near int/long limits (Integer.MAX_VALUE - 1). 5. Add assertion guards at boundaries. 6. For recursion, either convert to iterative or set `-Xss2m` to increase stack with caution.

**Real-world anchor:** The Mars Climate Orbiter (1999) was lost because one team's software produced thrust data in pound-force seconds while another expected newton-seconds. The boundary between the two components was never checked — the same kind of unchecked assumption that edge-case lists catch.


---

## 🏢 Enterprise Lens — Problem-Solving Method

| Area | What top-tier engineering looks like |
| ---- | ------------------------------------ |
| **Where it runs in production** | Code reviews, interviews, incident analysis (reproduce small, then scale) |
| **Failure modes** | Skipping the brute force and trusting an unverified optimisation; ignoring the constraints |
| **Testing and verification** | Compare the optimised solution with the brute force on random small inputs |

---

## Reality Check

**"A solving checklist slows you down in timed settings"** → The checklist is slow the first twenty times and subconscious afterward — that is what internalization means. Skipping straight to code saves ninety seconds and routinely loses ten minutes to a misread requirement ("return the INDEX, not the value") or an unexamined edge ("what if the array is empty"). Every post-mortem of a blown interview contains a step the checklist would have forced.

**"Restating the problem is filler for the interviewer's benefit"** → Restating is a COMPREHENSION TEST you run on yourself: if you cannot restate input, output, and constraints without looking, you have not parsed the problem, and coding now means coding your guess. The highest-value restatement includes one concrete example you invent — inventing an example flushes out ambiguities (duplicates allowed? negative numbers? empty input?) faster than re-reading the prose.

**"Edge cases are checked at the end if time remains"** → Edge cases chosen AFTER coding are biased by the code — you test what you built, not what the problem allows. Enumerate them BEFORE designing (empty, single element, all-same, extreme sizes, boundary values), because half the time one of them changes the design itself: an empty-input rule decides your initialization; a duplicates rule decides your data structure.

**"Brute force first is a beginner crutch"** → Brute force is the professional's baseline: it proves you understand the problem, it is a correctness oracle to diff the clever solution against, and its inefficiency POINTS at the optimization (repeated scans mean precompute; repeated subproblems mean memoize; nested candidate checks mean sort or hash). Seniors state it in one sentence and mine it; only juniors either skip it or stop at it.

**"When stuck, stare harder at the problem"** → Staring re-runs the same failed retrieval. The productive unstick moves are mechanical: shrink the input to size 3 and solve BY HAND (watch what your brain does, then code that), change representation (array to graph, string to counts), solve the inverse question, or drop a constraint and add it back. The checklist's job when stuck is to hand you the NEXT move, not more willpower.
