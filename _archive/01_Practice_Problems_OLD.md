# 🧪 PRACTICE PROBLEMS WITH SOLUTIONS

## Solve these problems to test your understanding!

---

## 📚 TABLE OF CONTENTS

1. [Two Pointers Problems](#two-pointers-problems)
2. [Sliding Window Problems](#sliding-window-problems)
3. [Binary Search Problems](#binary-search-problems)
4. [Array Problems](#array-problems)
5. [String Problems](#string-problems)
6. [Math Problems](#math-problems)

---

## TWO POINTERS PROBLEMS

### Problem 1: Container With Most Water

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  PROBLEM: Container With Most Water                                       ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Given array of heights, find two lines that form container with         ║
║  maximum water.                                                          ║
║                                                                           ║
║  Visual:                                                                  ║
║            |                                                              ║
║      |     |     |                                                        ║
║      |  |  |  |  |  |                                                     ║
║   |  |  |  |  |  |  |  |                                                  ║
║   ─────────────────────                                                   ║
║   1  8  6  2  5  4  8  3  7                                              ║
║   ↑                       ↑                                               ║
║   These two lines form max area                                          ║
║   Area = min(8, 7) × distance = 7 × 7 = 49                               ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

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

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  PROBLEM: 3Sum                                                            ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Find all unique triplets that sum to zero.                              ║
║                                                                           ║
║  Input: [-1, 0, 1, 2, -1, -4]                                            ║
║  Output: [[-1, -1, 2], [-1, 0, 1]]                                       ║
║                                                                           ║
║  Approach:                                                                ║
║  1. Sort array                                                           ║
║  2. For each element, use two pointers to find pairs                     ║
║                                                                           ║
║  Sorted: [-4, -1, -1, 0, 1, 2]                                           ║
║            ↑                                                              ║
║           fix one, find pair that sums to -nums[i]                       ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
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

## SLIDING WINDOW PROBLEMS

### Problem 3: Longest Substring Without Repeating Characters

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  PROBLEM: Longest Substring Without Repeating Characters                  ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Input: "abcabcbb"                                                        ║
║  Output: 3 ("abc")                                                        ║
║                                                                           ║
║  Visual:                                                                  ║
║  a b c a b c b b                                                          ║
║  ↑─────↑                                                                  ║
║  └─────┘ "abc" length 3                                                   ║
║                                                                           ║
║    ↑───────↑                                                              ║
║    └───────┘ "bca" length 3                                               ║
║                                                                           ║
║  When we see repeat, shrink window from left                             ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
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
╔═══════════════════════════════════════════════════════════════════════════╗
║  PROBLEM: Maximum Sum Subarray of Size K                                  ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Input: arr = [2, 1, 5, 1, 3, 2], k = 3                                   ║
║  Output: 9 (subarray [5, 1, 3])                                           ║
║                                                                           ║
║  Visual:                                                                  ║
║  ┌─────────┐                                                             ║
║  2  1  5  1  3  2     sum = 8                                            ║
║  └─────────┘                                                             ║
║                                                                           ║
║     ┌─────────┐                                                          ║
║  2  1  5  1  3  2     sum = 7                                            ║
║     └─────────┘                                                          ║
║                                                                           ║
║        ┌─────────┐                                                       ║
║  2  1  5  1  3  2     sum = 9 ⭐ MAX                                      ║
║        └─────────┘                                                       ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
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

## BINARY SEARCH PROBLEMS

### Problem 5: Search in Rotated Sorted Array

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  PROBLEM: Search in Rotated Sorted Array                                  ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Array was sorted, then rotated at some pivot.                           ║
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
║  Left half [4,5,6,7] is sorted (arr[low] <= arr[mid])                    ║
║  Check if target is in sorted half, else search other half              ║
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

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  PROBLEM: Find Peak Element                                               ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Peak = element greater than its neighbors.                              ║
║  nums[-1] and nums[n] are considered -∞.                                 ║
║                                                                           ║
║  Input: [1, 2, 3, 1]                                                      ║
║  Output: 2 (index of element 3)                                           ║
║                                                                           ║
║  Visual:                                                                  ║
║         3 ← peak                                                          ║
║        /\                                                                ║
║       2  \                                                                ║
║      /    1                                                               ║
║     1                                                                     ║
║                                                                           ║
║  Binary Search approach:                                                  ║
║  - If arr[mid] < arr[mid+1], peak is on RIGHT                            ║
║  - If arr[mid] > arr[mid+1], peak is on LEFT (including mid)             ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
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

## ARRAY PROBLEMS

### Problem 7: Rotate Array

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  PROBLEM: Rotate Array                                                    ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Rotate array to the right by k steps.                                   ║
║                                                                           ║
║  Input: [1, 2, 3, 4, 5, 6, 7], k = 3                                      ║
║  Output: [5, 6, 7, 1, 2, 3, 4]                                            ║
║                                                                           ║
║  Approach: Three reverses                                                 ║
║                                                                           ║
║  Original:    [1, 2, 3, 4, 5, 6, 7]                                       ║
║  Reverse all: [7, 6, 5, 4, 3, 2, 1]                                       ║
║  Reverse [0, k-1]: [5, 6, 7, 4, 3, 2, 1]                                  ║
║  Reverse [k, n-1]: [5, 6, 7, 1, 2, 3, 4] ✓                                ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
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

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  PROBLEM: Product of Array Except Self                                    ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Return array where each element is product of all OTHER elements.        ║
║  Cannot use division.                                                     ║
║                                                                           ║
║  Input: [1, 2, 3, 4]                                                      ║
║  Output: [24, 12, 8, 6]                                                   ║
║                                                                           ║
║  output[0] = 2 * 3 * 4 = 24                                               ║
║  output[1] = 1 * 3 * 4 = 12                                               ║
║  output[2] = 1 * 2 * 4 = 8                                                ║
║  output[3] = 1 * 2 * 3 = 6                                                ║
║                                                                           ║
║  Approach: Left products × Right products                                 ║
║                                                                           ║
║  Left products:  [1, 1, 2, 6]    (product of all to the left)             ║
║  Right products: [24, 12, 4, 1]  (product of all to the right)            ║
║  Result:         [24, 12, 8, 6]  (multiply left × right)                  ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
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

## STRING PROBLEMS

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

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  PROBLEM: Group Anagrams                                                  ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Group words that are anagrams of each other.                             ║
║                                                                           ║
║  Input: ["eat", "tea", "tan", "ate", "nat", "bat"]                        ║
║  Output: [["eat","tea","ate"], ["tan","nat"], ["bat"]]                    ║
║                                                                           ║
║  Key insight: Anagrams have same SORTED form                              ║
║  eat → aet                                                                ║
║  tea → aet  (same!)                                                       ║
║  ate → aet  (same!)                                                       ║
║                                                                           ║
║  Use sorted form as HashMap key                                           ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
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

## MATH PROBLEMS

### Problem 11: Missing Number

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  PROBLEM: Missing Number                                                  ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Array contains n distinct numbers from [0, n]. Find missing one.         ║
║                                                                           ║
║  Input: [3, 0, 1]                                                         ║
║  Output: 2                                                                ║
║                                                                           ║
║  Method 1: Math (Sum formula)                                             ║
║  Expected sum = n * (n + 1) / 2                                           ║
║  Missing = Expected sum - Actual sum                                      ║
║                                                                           ║
║  Method 2: XOR                                                            ║
║  XOR all indices 0 to n, XOR all array elements                           ║
║  Missing number will remain (duplicates cancel)                           ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
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

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  PROBLEM: Single Number                                                   ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Every element appears twice except one. Find that one.                   ║
║                                                                           ║
║  Input: [4, 1, 2, 1, 2]                                                   ║
║  Output: 4                                                                ║
║                                                                           ║
║  XOR property:                                                            ║
║  a ^ a = 0  (same numbers cancel)                                         ║
║  a ^ 0 = a  (XOR with 0 gives same number)                                ║
║                                                                           ║
║  4 ^ 1 ^ 2 ^ 1 ^ 2                                                        ║
║  = 4 ^ (1 ^ 1) ^ (2 ^ 2)                                                  ║
║  = 4 ^ 0 ^ 0                                                              ║
║  = 4                                                                      ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
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

# 🔥 COMPREHENSIVE PROBLEM BANK

## From Basics to Advanced - With LeetCode Links & Premium Problems

---

# SECTION 1: BASIC MATH & NUMBER PROBLEMS

---

## 1.1 PRIME NUMBER PROBLEMS

### Problem: Check if Prime

**Difficulty:** Easy | **Category:** Basic Math

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  CHECK IF A NUMBER IS PRIME                                               ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  A prime number is a natural number greater than 1 that has no positive   ║
║  divisors other than 1 and itself.                                        ║
║                                                                           ║
║  Examples:                                                                ║
║  - 2, 3, 5, 7, 11, 13, 17, 19, 23, 29... are prime                        ║
║  - 4 (2×2), 6 (2×3), 8, 9, 10... are NOT prime                            ║
║                                                                           ║
║  Input: n = 17                                                            ║
║  Output: true                                                             ║
║                                                                           ║
║  Input: n = 15                                                            ║
║  Output: false (15 = 3 × 5)                                               ║
║                                                                           ║
║  Optimization: Only check till √n                                         ║
║  Why? If n = a × b and a ≤ √n, then b ≥ √n                                ║
║  So if no divisor exists till √n, none exists after                       ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
// SOLUTION - OPTIMAL O(√n)
public boolean isPrime(int n) {
    if (n <= 1) return false;
    if (n <= 3) return true;
    if (n % 2 == 0 || n % 3 == 0) return false;

    // Check from 5 to √n, skip multiples of 2 and 3
    for (int i = 5; i * i <= n; i += 6) {
        if (n % i == 0 || n % (i + 2) == 0) {
            return false;
        }
    }
    return true;
}
```

---

### Problem: Count Primes

**LeetCode 204** | **Difficulty:** Medium
🔗 [https://leetcode.com/problems/count-primes/](https://leetcode.com/problems/count-primes/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  COUNT PRIMES                                                             ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Count the number of prime numbers less than n.                          ║
║                                                                           ║
║  Input: n = 10                                                            ║
║  Output: 4                                                                ║
║  Explanation: Primes less than 10 are 2, 3, 5, 7                         ║
║                                                                           ║
║  Input: n = 0                                                             ║
║  Output: 0                                                                ║
║                                                                           ║
║  Use: SIEVE OF ERATOSTHENES                                               ║
║                                                                           ║
║  Visual for n=30:                                                         ║
║  2  3  4  5  6  7  8  9  10 11 12 13 14 15...                            ║
║  ✓  ✓  ✗  ✓  ✗  ✓  ✗  ✗  ✗  ✓  ✗  ✓  ✗  ✗                             ║
║     Mark all multiples of 2 as non-prime                                 ║
║     Mark all multiples of 3 as non-prime                                 ║
║     ... continue till √n                                                  ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
// SIEVE OF ERATOSTHENES - O(n log log n)
public int countPrimes(int n) {
    if (n <= 2) return 0;

    boolean[] notPrime = new boolean[n];
    int count = 0;

    for (int i = 2; i < n; i++) {
        if (!notPrime[i]) {
            count++;
            // Mark all multiples as not prime
            for (long j = (long) i * i; j < n; j += i) {
                notPrime[(int) j] = true;
            }
        }
    }
    return count;
}
```

---

### Problem: Nth Prime Number

**Difficulty:** Medium | **Category:** Basic Math

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  FIND THE NTH PRIME NUMBER                                                ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Given n, find the nth prime number.                                     ║
║                                                                           ║
║  Input: n = 1                                                             ║
║  Output: 2 (1st prime)                                                    ║
║                                                                           ║
║  Input: n = 5                                                             ║
║  Output: 11 (5th prime: 2, 3, 5, 7, 11)                                  ║
║                                                                           ║
║  Input: n = 10                                                            ║
║  Output: 29 (10th prime)                                                  ║
║                                                                           ║
║  Input: n = 100                                                           ║
║  Output: 541 (100th prime)                                                ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public int nthPrime(int n) {
    if (n == 1) return 2;

    int count = 1;  // We already counted 2
    int num = 1;    // Start checking from 3 (odd numbers)

    while (count < n) {
        num += 2;   // Check only odd numbers
        if (isPrime(num)) {
            count++;
        }
    }
    return num;
}

private boolean isPrime(int n) {
    if (n < 2) return false;
    if (n == 2) return true;
    if (n % 2 == 0) return false;
    for (int i = 3; i * i <= n; i += 2) {
        if (n % i == 0) return false;
    }
    return true;
}
```

---

### Problem: Previous and Next Prime

**Difficulty:** Easy | **Category:** Basic Math

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  FIND PREVIOUS AND NEXT PRIME                                             ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Given a number n, find the nearest prime less than n (previous prime)   ║
║  and nearest prime greater than n (next prime).                          ║
║                                                                           ║
║  Input: n = 10                                                            ║
║  Output: Previous = 7, Next = 11                                         ║
║                                                                           ║
║  Input: n = 14                                                            ║
║  Output: Previous = 13, Next = 17                                        ║
║                                                                           ║
║  Input: n = 7 (n is prime)                                                ║
║  Output: Previous = 5, Next = 11                                         ║
║                                                                           ║
║  Edge case: n = 2                                                         ║
║  Output: Previous = -1 (no prime before 2), Next = 3                     ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public int[] previousAndNextPrime(int n) {
    int[] result = new int[2];

    // Find previous prime
    result[0] = findPreviousPrime(n);

    // Find next prime
    result[1] = findNextPrime(n);

    return result;
}

private int findPreviousPrime(int n) {
    for (int i = n - 1; i >= 2; i--) {
        if (isPrime(i)) return i;
    }
    return -1;  // No prime before 2
}

private int findNextPrime(int n) {
    int candidate = n + 1;
    while (true) {
        if (isPrime(candidate)) return candidate;
        candidate++;
    }
}
```

---

### Problem: Prime Factors

**Difficulty:** Easy | **Category:** Basic Math

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  FIND ALL PRIME FACTORS                                                   ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Given a number n, find all its prime factors.                           ║
║                                                                           ║
║  Input: n = 12                                                            ║
║  Output: [2, 2, 3]                                                        ║
║  Explanation: 12 = 2 × 2 × 3                                             ║
║                                                                           ║
║  Input: n = 100                                                           ║
║  Output: [2, 2, 5, 5]                                                     ║
║  Explanation: 100 = 2 × 2 × 5 × 5                                        ║
║                                                                           ║
║  Input: n = 315                                                           ║
║  Output: [3, 3, 5, 7]                                                     ║
║  Explanation: 315 = 3 × 3 × 5 × 7                                        ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public List<Integer> primeFactors(int n) {
    List<Integer> factors = new ArrayList<>();

    // Divide by 2 until odd
    while (n % 2 == 0) {
        factors.add(2);
        n /= 2;
    }

    // Check odd numbers from 3 to √n
    for (int i = 3; i * i <= n; i += 2) {
        while (n % i == 0) {
            factors.add(i);
            n /= i;
        }
    }

    // If n is still > 1, it's a prime factor
    if (n > 1) {
        factors.add(n);
    }

    return factors;
}
```

---

### 🔒 PREMIUM: Closest Prime Numbers in Range

**LeetCode 2523** | **Difficulty:** Medium | **Premium Problem**

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  CLOSEST PRIME NUMBERS IN RANGE                                           ║
║  (LeetCode Premium - Full Problem Description)                            ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Given two positive integers left and right, find the two integers num1  ║
║  and num2 such that:                                                      ║
║  - left <= num1 < num2 <= right                                          ║
║  - Both num1 and num2 are prime numbers                                   ║
║  - num2 - num1 is the minimum amongst all other pairs                    ║
║                                                                           ║
║  Return the positive integer array [num1, num2]. If there are multiple   ║
║  pairs with the minimum gap, return the one with smallest num1. If no    ║
║  such pair exists, return [-1, -1].                                      ║
║                                                                           ║
║  ─────────────────────────────────────────────────────────────────────   ║
║                                                                           ║
║  Example 1:                                                               ║
║  Input: left = 10, right = 19                                            ║
║  Output: [11, 13]                                                         ║
║  Explanation:                                                             ║
║  Primes in range: 11, 13, 17, 19                                         ║
║  Differences: 13-11=2, 17-13=4, 19-17=2                                  ║
║  Minimum difference is 2. Pairs: (11,13) and (17,19)                     ║
║  Return (11,13) as it has smaller num1.                                  ║
║                                                                           ║
║  Example 2:                                                               ║
║  Input: left = 4, right = 6                                              ║
║  Output: [-1, -1]                                                         ║
║  Explanation: Only one prime (5) in range, need at least 2.              ║
║                                                                           ║
║  Example 3:                                                               ║
║  Input: left = 1, right = 1000000                                        ║
║  Output: [2, 3]                                                           ║
║  Explanation: Twin primes (difference = 1 only for 2,3)                  ║
║                                                                           ║
║  ─────────────────────────────────────────────────────────────────────   ║
║                                                                           ║
║  Constraints:                                                             ║
║  - 1 <= left <= right <= 10^6                                            ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public int[] closestPrimes(int left, int right) {
    // Generate all primes in range using Sieve
    List<Integer> primes = new ArrayList<>();
    boolean[] notPrime = new boolean[right + 1];

    for (int i = 2; i <= right; i++) {
        if (!notPrime[i]) {
            if (i >= left) primes.add(i);
            for (long j = (long) i * i; j <= right; j += i) {
                notPrime[(int) j] = true;
            }
        }
    }

    if (primes.size() < 2) return new int[]{-1, -1};

    int minDiff = Integer.MAX_VALUE;
    int[] result = {-1, -1};

    for (int i = 1; i < primes.size(); i++) {
        int diff = primes.get(i) - primes.get(i - 1);
        if (diff < minDiff) {
            minDiff = diff;
            result[0] = primes.get(i - 1);
            result[1] = primes.get(i);
        }
    }

    return result;
}
```

---

## 1.2 FIBONACCI PROBLEMS

### Problem: Nth Fibonacci Number

**Difficulty:** Easy | **Category:** Basic Math / DP

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  NTH FIBONACCI NUMBER                                                     ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Fibonacci Sequence: 0, 1, 1, 2, 3, 5, 8, 13, 21, 34, ...               ║
║  F(0) = 0, F(1) = 1                                                       ║
║  F(n) = F(n-1) + F(n-2) for n > 1                                        ║
║                                                                           ║
║  Input: n = 4                                                             ║
║  Output: 3                                                                ║
║  Explanation: F(4) = F(3) + F(2) = 2 + 1 = 3                             ║
║                                                                           ║
║  Input: n = 10                                                            ║
║  Output: 55                                                               ║
║                                                                           ║
║  Visual:                                                                  ║
║  Index:  0  1  2  3  4  5  6  7   8   9   10                             ║
║  Value:  0  1  1  2  3  5  8  13  21  34  55                             ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

**LeetCode 509** | 🔗 [https://leetcode.com/problems/fibonacci-number/](https://leetcode.com/problems/fibonacci-number/)

```java
// Method 1: Iterative - O(n) time, O(1) space
public int fib(int n) {
    if (n <= 1) return n;

    int prev2 = 0, prev1 = 1;
    for (int i = 2; i <= n; i++) {
        int curr = prev1 + prev2;
        prev2 = prev1;
        prev1 = curr;
    }
    return prev1;
}

// Method 2: Recursive with Memoization - O(n) time, O(n) space
public int fibMemo(int n) {
    int[] memo = new int[n + 1];
    Arrays.fill(memo, -1);
    return fibHelper(n, memo);
}

private int fibHelper(int n, int[] memo) {
    if (n <= 1) return n;
    if (memo[n] != -1) return memo[n];
    memo[n] = fibHelper(n - 1, memo) + fibHelper(n - 2, memo);
    return memo[n];
}

// Method 3: Matrix Exponentiation - O(log n) time
// For very large n
```

---

### Problem: Fibonacci Variants - Sum of First N Fibonacci

**Difficulty:** Easy | **Category:** Basic Math

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  SUM OF FIRST N FIBONACCI NUMBERS                                         ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Find the sum of first n Fibonacci numbers.                              ║
║                                                                           ║
║  Input: n = 5                                                             ║
║  Output: 7                                                                ║
║  Explanation: F(0)+F(1)+F(2)+F(3)+F(4) = 0+1+1+2+3 = 7                   ║
║                                                                           ║
║  Input: n = 10                                                            ║
║  Output: 88                                                               ║
║  Explanation: 0+1+1+2+3+5+8+13+21+34 = 88                                ║
║                                                                           ║
║  FORMULA: Sum of first n Fib = F(n+2) - 1                                ║
║  Proof: F(0) + F(1) + ... + F(n) = F(n+2) - 1                            ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
// Method 1: Iterative Sum
public int sumFibonacci(int n) {
    if (n <= 0) return 0;

    int sum = 0;
    int prev2 = 0, prev1 = 1;
    sum = prev2;  // F(0)

    for (int i = 1; i <= n; i++) {
        sum += prev1;
        int curr = prev1 + prev2;
        prev2 = prev1;
        prev1 = curr;
    }
    return sum;
}

// Method 2: Using Formula - O(n) but cleaner
public int sumFibonacciFormula(int n) {
    // Sum = F(n+2) - 1
    return fib(n + 2) - 1;
}
```

---

### Problem: Check if Fibonacci

**Difficulty:** Easy | **Category:** Basic Math

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  CHECK IF NUMBER IS A FIBONACCI NUMBER                                    ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Given a number, check if it belongs to Fibonacci sequence.              ║
║                                                                           ║
║  Input: n = 8                                                             ║
║  Output: true (8 is F(6))                                                ║
║                                                                           ║
║  Input: n = 10                                                            ║
║  Output: false                                                            ║
║                                                                           ║
║  PROPERTY: A number is Fibonacci if and only if one of                   ║
║  (5*n² + 4) or (5*n² - 4) is a perfect square.                           ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public boolean isFibonacci(int n) {
    return isPerfectSquare(5 * n * n + 4) ||
           isPerfectSquare(5 * n * n - 4);
}

private boolean isPerfectSquare(long n) {
    long sqrt = (long) Math.sqrt(n);
    return sqrt * sqrt == n;
}

// Alternative: Generate Fibonacci until we find or pass n
public boolean isFibonacciIterative(int n) {
    if (n == 0 || n == 1) return true;

    int a = 0, b = 1;
    while (b < n) {
        int temp = b;
        b = a + b;
        a = temp;
    }
    return b == n;
}
```

---

### Problem: Fibonacci - Tribonacci Number

**LeetCode 1137** | **Difficulty:** Easy
🔗 [https://leetcode.com/problems/n-th-tribonacci-number/](https://leetcode.com/problems/n-th-tribonacci-number/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  N-TH TRIBONACCI NUMBER                                                   ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Tribonacci: T(n) = T(n-1) + T(n-2) + T(n-3)                             ║
║  T(0) = 0, T(1) = 1, T(2) = 1                                            ║
║                                                                           ║
║  Sequence: 0, 1, 1, 2, 4, 7, 13, 24, 44, 81, ...                        ║
║                                                                           ║
║  Input: n = 4                                                             ║
║  Output: 4                                                                ║
║  Explanation: T(4) = T(3) + T(2) + T(1) = 2 + 1 + 1 = 4                  ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public int tribonacci(int n) {
    if (n == 0) return 0;
    if (n <= 2) return 1;

    int t0 = 0, t1 = 1, t2 = 1;
    for (int i = 3; i <= n; i++) {
        int curr = t0 + t1 + t2;
        t0 = t1;
        t1 = t2;
        t2 = curr;
    }
    return t2;
}
```

---

### Problem: Climbing Stairs (Fibonacci Application)

**LeetCode 70** | **Difficulty:** Easy
🔗 [https://leetcode.com/problems/climbing-stairs/](https://leetcode.com/problems/climbing-stairs/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  CLIMBING STAIRS                                                          ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  You can climb 1 or 2 steps at a time.                                   ║
║  How many distinct ways to climb n stairs?                               ║
║                                                                           ║
║  Input: n = 3                                                             ║
║  Output: 3                                                                ║
║  Ways: [1,1,1], [1,2], [2,1]                                             ║
║                                                                           ║
║  Input: n = 5                                                             ║
║  Output: 8                                                                ║
║                                                                           ║
║  PATTERN: ways(n) = ways(n-1) + ways(n-2) = Fibonacci!                   ║
║  n=1: 1 way                                                               ║
║  n=2: 2 ways                                                              ║
║  n=3: 3 ways                                                              ║
║  n=4: 5 ways                                                              ║
║  n=5: 8 ways                                                              ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public int climbStairs(int n) {
    if (n <= 2) return n;

    int prev2 = 1, prev1 = 2;
    for (int i = 3; i <= n; i++) {
        int curr = prev1 + prev2;
        prev2 = prev1;
        prev1 = curr;
    }
    return prev1;
}
```

---

## 1.3 DIGIT MANIPULATION PROBLEMS

### Problem: Sum of Digits

**Difficulty:** Easy | **Category:** Basic Math

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  SUM OF DIGITS                                                            ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Find the sum of all digits of a given number.                           ║
║                                                                           ║
║  Input: n = 12345                                                         ║
║  Output: 15                                                               ║
║  Explanation: 1 + 2 + 3 + 4 + 5 = 15                                     ║
║                                                                           ║
║  Input: n = 9999                                                          ║
║  Output: 36                                                               ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public int sumOfDigits(int n) {
    int sum = 0;
    n = Math.abs(n);  // Handle negative
    while (n > 0) {
        sum += n % 10;
        n /= 10;
    }
    return sum;
}

// Recursive version
public int sumOfDigitsRecursive(int n) {
    if (n == 0) return 0;
    return (n % 10) + sumOfDigitsRecursive(n / 10);
}
```

---

### Problem: Add Digits (Digital Root)

**LeetCode 258** | **Difficulty:** Easy
🔗 [https://leetcode.com/problems/add-digits/](https://leetcode.com/problems/add-digits/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  ADD DIGITS (DIGITAL ROOT)                                                ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Repeatedly add digits until single digit remains.                       ║
║                                                                           ║
║  Input: num = 38                                                          ║
║  Output: 2                                                                ║
║  Explanation: 3 + 8 = 11, 1 + 1 = 2                                      ║
║                                                                           ║
║  Input: num = 9999                                                        ║
║  Output: 9                                                                ║
║  Explanation: 36 → 9                                                      ║
║                                                                           ║
║  FORMULA: Digital Root = 1 + (num - 1) % 9  (for num > 0)                ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
// O(1) solution using formula
public int addDigits(int num) {
    if (num == 0) return 0;
    return 1 + (num - 1) % 9;
}

// Iterative solution
public int addDigitsIterative(int num) {
    while (num >= 10) {
        int sum = 0;
        while (num > 0) {
            sum += num % 10;
            num /= 10;
        }
        num = sum;
    }
    return num;
}
```

---

### Problem: Reverse Integer

**LeetCode 7** | **Difficulty:** Medium
🔗 [https://leetcode.com/problems/reverse-integer/](https://leetcode.com/problems/reverse-integer/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  REVERSE INTEGER                                                          ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Reverse digits of a 32-bit signed integer.                              ║
║  Return 0 if result overflows.                                           ║
║                                                                           ║
║  Input: x = 123                                                           ║
║  Output: 321                                                              ║
║                                                                           ║
║  Input: x = -123                                                          ║
║  Output: -321                                                             ║
║                                                                           ║
║  Input: x = 1534236469                                                    ║
║  Output: 0 (overflow when reversed)                                       ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public int reverse(int x) {
    int result = 0;

    while (x != 0) {
        int digit = x % 10;
        x /= 10;

        // Check overflow before adding
        if (result > Integer.MAX_VALUE / 10 ||
            (result == Integer.MAX_VALUE / 10 && digit > 7)) {
            return 0;
        }
        if (result < Integer.MIN_VALUE / 10 ||
            (result == Integer.MIN_VALUE / 10 && digit < -8)) {
            return 0;
        }

        result = result * 10 + digit;
    }
    return result;
}
```

---

### Problem: Palindrome Number

**LeetCode 9** | **Difficulty:** Easy
🔗 [https://leetcode.com/problems/palindrome-number/](https://leetcode.com/problems/palindrome-number/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  PALINDROME NUMBER                                                        ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Check if integer is palindrome (reads same forwards and backwards).     ║
║                                                                           ║
║  Input: x = 121                                                           ║
║  Output: true                                                             ║
║                                                                           ║
║  Input: x = -121                                                          ║
║  Output: false (reads as 121-)                                            ║
║                                                                           ║
║  Input: x = 10                                                            ║
║  Output: false (reads as 01)                                              ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public boolean isPalindrome(int x) {
    // Negative or ends with 0 (except 0 itself)
    if (x < 0 || (x % 10 == 0 && x != 0)) {
        return false;
    }

    // Reverse half the number
    int reversed = 0;
    while (x > reversed) {
        reversed = reversed * 10 + x % 10;
        x /= 10;
    }

    // For even digits: x == reversed
    // For odd digits: x == reversed / 10
    return x == reversed || x == reversed / 10;
}
```

---

### Problem: Happy Number

**LeetCode 202** | **Difficulty:** Easy
🔗 [https://leetcode.com/problems/happy-number/](https://leetcode.com/problems/happy-number/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  HAPPY NUMBER                                                             ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Starting with any positive integer, replace the number by the sum of    ║
║  the squares of its digits. Repeat until it equals 1 (happy), or loops   ║
║  endlessly in a cycle (not happy).                                       ║
║                                                                           ║
║  Input: n = 19                                                            ║
║  Output: true                                                             ║
║  Explanation:                                                             ║
║  1² + 9² = 82                                                            ║
║  8² + 2² = 68                                                            ║
║  6² + 8² = 100                                                           ║
║  1² + 0² + 0² = 1 ✓                                                      ║
║                                                                           ║
║  Input: n = 2                                                             ║
║  Output: false (enters cycle)                                             ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
// Floyd's Cycle Detection
public boolean isHappy(int n) {
    int slow = n, fast = n;

    do {
        slow = sumSquareDigits(slow);
        fast = sumSquareDigits(sumSquareDigits(fast));
    } while (slow != fast);

    return slow == 1;
}

private int sumSquareDigits(int n) {
    int sum = 0;
    while (n > 0) {
        int digit = n % 10;
        sum += digit * digit;
        n /= 10;
    }
    return sum;
}
```

---

## 1.4 GCD & LCM PROBLEMS

### Problem: GCD (Greatest Common Divisor)

**Difficulty:** Easy | **Category:** Basic Math

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  GCD - GREATEST COMMON DIVISOR                                            ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Find the largest number that divides both a and b.                      ║
║                                                                           ║
║  Input: a = 48, b = 18                                                    ║
║  Output: 6                                                                ║
║  Explanation: Divisors of 48: 1,2,3,4,6,8,12,16,24,48                    ║
║               Divisors of 18: 1,2,3,6,9,18                               ║
║               Common: 1,2,3,6 → GCD = 6                                   ║
║                                                                           ║
║  EUCLIDEAN ALGORITHM:                                                     ║
║  GCD(a, b) = GCD(b, a % b)                                               ║
║  GCD(a, 0) = a                                                           ║
║                                                                           ║
║  48, 18 → 18, 12 → 12, 6 → 6, 0 → GCD = 6                                ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
// Euclidean Algorithm - O(log(min(a,b)))
public int gcd(int a, int b) {
    while (b != 0) {
        int temp = b;
        b = a % b;
        a = temp;
    }
    return a;
}

// Recursive version
public int gcdRecursive(int a, int b) {
    if (b == 0) return a;
    return gcdRecursive(b, a % b);
}

// LCM using GCD: LCM(a,b) = (a * b) / GCD(a,b)
public int lcm(int a, int b) {
    return (a / gcd(a, b)) * b;  // Avoid overflow
}
```

---

### 🔒 PREMIUM: Find GCD of Array

**LeetCode 1979** | **Difficulty:** Easy | **Premium Problem**

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  FIND GREATEST COMMON DIVISOR OF ARRAY                                    ║
║  (LeetCode Premium - Full Problem Description)                            ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Given an integer array nums, return the greatest common divisor of the  ║
║  smallest number and largest number in nums.                              ║
║                                                                           ║
║  The GCD of two numbers is the largest positive integer that evenly      ║
║  divides both numbers.                                                    ║
║                                                                           ║
║  ─────────────────────────────────────────────────────────────────────   ║
║                                                                           ║
║  Example 1:                                                               ║
║  Input: nums = [2, 5, 6, 9, 10]                                          ║
║  Output: 2                                                                ║
║  Explanation:                                                             ║
║  Smallest = 2, Largest = 10                                              ║
║  GCD(2, 10) = 2                                                          ║
║                                                                           ║
║  Example 2:                                                               ║
║  Input: nums = [7, 5, 6, 8, 3]                                           ║
║  Output: 1                                                                ║
║  Explanation:                                                             ║
║  Smallest = 3, Largest = 8                                               ║
║  GCD(3, 8) = 1                                                           ║
║                                                                           ║
║  Example 3:                                                               ║
║  Input: nums = [3, 3]                                                     ║
║  Output: 3                                                                ║
║  Explanation:                                                             ║
║  Smallest = 3, Largest = 3                                               ║
║  GCD(3, 3) = 3                                                           ║
║                                                                           ║
║  ─────────────────────────────────────────────────────────────────────   ║
║                                                                           ║
║  Constraints:                                                             ║
║  - 2 <= nums.length <= 1000                                              ║
║  - 1 <= nums[i] <= 1000                                                  ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public int findGCD(int[] nums) {
    int min = Integer.MAX_VALUE;
    int max = Integer.MIN_VALUE;

    for (int num : nums) {
        min = Math.min(min, num);
        max = Math.max(max, num);
    }

    return gcd(min, max);
}

private int gcd(int a, int b) {
    while (b != 0) {
        int temp = b;
        b = a % b;
        a = temp;
    }
    return a;
}
```

---

# SECTION 2: STRING PROBLEMS

---

## 2.1 ISOMORPHIC & PATTERN MATCHING

### Problem: Isomorphic Strings

**LeetCode 205** | **Difficulty:** Easy
🔗 [https://leetcode.com/problems/isomorphic-strings/](https://leetcode.com/problems/isomorphic-strings/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  ISOMORPHIC STRINGS                                                       ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Two strings are isomorphic if characters in s can be replaced to get t. ║
║  Mapping must be one-to-one (each char maps to exactly one char).        ║
║  Order of characters must be preserved.                                   ║
║                                                                           ║
║  Input: s = "egg", t = "add"                                              ║
║  Output: true                                                             ║
║  Explanation: e → a, g → d                                               ║
║               egg → add ✓                                                 ║
║                                                                           ║
║  Input: s = "foo", t = "bar"                                              ║
║  Output: false                                                            ║
║  Explanation: o maps to both 'a' and 'r' - not allowed                   ║
║                                                                           ║
║  Input: s = "paper", t = "title"                                          ║
║  Output: true                                                             ║
║  Explanation: p→t, a→i, e→l, r→e                                         ║
║                                                                           ║
║  Input: s = "badc", t = "baba"                                            ║
║  Output: false                                                            ║
║  Explanation: d and c both map to 'a' - not allowed                      ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public boolean isIsomorphic(String s, String t) {
    if (s.length() != t.length()) return false;

    int[] mapST = new int[256];  // s -> t mapping
    int[] mapTS = new int[256];  // t -> s mapping
    Arrays.fill(mapST, -1);
    Arrays.fill(mapTS, -1);

    for (int i = 0; i < s.length(); i++) {
        char cs = s.charAt(i);
        char ct = t.charAt(i);

        // Check if mapping exists and is consistent
        if (mapST[cs] == -1 && mapTS[ct] == -1) {
            mapST[cs] = ct;
            mapTS[ct] = cs;
        } else if (mapST[cs] != ct || mapTS[ct] != cs) {
            return false;
        }
    }
    return true;
}

// Alternative using HashMap
public boolean isIsomorphicMap(String s, String t) {
    Map<Character, Character> mapST = new HashMap<>();
    Map<Character, Character> mapTS = new HashMap<>();

    for (int i = 0; i < s.length(); i++) {
        char cs = s.charAt(i), ct = t.charAt(i);

        if (mapST.containsKey(cs) && mapST.get(cs) != ct) return false;
        if (mapTS.containsKey(ct) && mapTS.get(ct) != cs) return false;

        mapST.put(cs, ct);
        mapTS.put(ct, cs);
    }
    return true;
}
```

---

### Problem: Word Pattern

**LeetCode 290** | **Difficulty:** Easy
🔗 [https://leetcode.com/problems/word-pattern/](https://leetcode.com/problems/word-pattern/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  WORD PATTERN                                                             ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Check if string follows same pattern as given pattern.                  ║
║  Pattern char → word must be bijective (one-to-one).                     ║
║                                                                           ║
║  Input: pattern = "abba", s = "dog cat cat dog"                          ║
║  Output: true                                                             ║
║  Explanation: a→dog, b→cat                                               ║
║                                                                           ║
║  Input: pattern = "abba", s = "dog cat cat fish"                         ║
║  Output: false                                                            ║
║  Explanation: a→dog but also a→fish (inconsistent)                       ║
║                                                                           ║
║  Input: pattern = "aaaa", s = "dog cat cat dog"                          ║
║  Output: false                                                            ║
║  Explanation: a→dog, a→cat (inconsistent)                                ║
║                                                                           ║
║  Input: pattern = "abba", s = "dog dog dog dog"                          ║
║  Output: false                                                            ║
║  Explanation: b must map to different word than a                        ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public boolean wordPattern(String pattern, String s) {
    String[] words = s.split(" ");
    if (pattern.length() != words.length) return false;

    Map<Character, String> charToWord = new HashMap<>();
    Map<String, Character> wordToChar = new HashMap<>();

    for (int i = 0; i < pattern.length(); i++) {
        char c = pattern.charAt(i);
        String word = words[i];

        if (charToWord.containsKey(c)) {
            if (!charToWord.get(c).equals(word)) return false;
        } else {
            charToWord.put(c, word);
        }

        if (wordToChar.containsKey(word)) {
            if (wordToChar.get(word) != c) return false;
        } else {
            wordToChar.put(word, c);
        }
    }
    return true;
}
```

---

### 🔒 PREMIUM: Word Pattern II

**LeetCode 291** | **Difficulty:** Medium | **Premium Problem**

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  WORD PATTERN II                                                          ║
║  (LeetCode Premium - Full Problem Description)                            ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Given a pattern and a string s, find if s follows the same pattern.     ║
║                                                                           ║
║  Here, "follow" means a full match, such that there is a bijection       ║
║  between a letter in pattern and a non-empty substring in s.             ║
║                                                                           ║
║  NOTE: Unlike Word Pattern I, words are NOT separated by spaces!         ║
║  You must determine where words begin and end.                           ║
║                                                                           ║
║  ─────────────────────────────────────────────────────────────────────   ║
║                                                                           ║
║  Example 1:                                                               ║
║  Input: pattern = "abab", s = "redblueredblue"                           ║
║  Output: true                                                             ║
║  Explanation: a→"red", b→"blue"                                          ║
║  "redblueredblue" matches "abab"                                         ║
║                                                                           ║
║  Example 2:                                                               ║
║  Input: pattern = "aaaa", s = "asdasdasdasd"                             ║
║  Output: true                                                             ║
║  Explanation: a→"asd"                                                     ║
║                                                                           ║
║  Example 3:                                                               ║
║  Input: pattern = "aabb", s = "xyzabcxzyabc"                             ║
║  Output: false                                                            ║
║  Explanation: No valid mapping exists                                     ║
║                                                                           ║
║  Example 4:                                                               ║
║  Input: pattern = "ab", s = "aa"                                          ║
║  Output: false                                                            ║
║  Explanation: a→"a", b→"a" violates bijection (two chars map to same)    ║
║                                                                           ║
║  ─────────────────────────────────────────────────────────────────────   ║
║                                                                           ║
║  Constraints:                                                             ║
║  - 1 <= pattern.length, s.length <= 20                                   ║
║  - pattern and s consist of only lowercase English letters               ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public boolean wordPatternMatch(String pattern, String s) {
    Map<Character, String> charToWord = new HashMap<>();
    Set<String> usedWords = new HashSet<>();
    return backtrack(pattern, 0, s, 0, charToWord, usedWords);
}

private boolean backtrack(String pattern, int pIdx, String s, int sIdx,
                          Map<Character, String> map, Set<String> used) {
    // Both exhausted - success
    if (pIdx == pattern.length() && sIdx == s.length()) return true;
    // One exhausted but not other - failure
    if (pIdx == pattern.length() || sIdx == s.length()) return false;

    char c = pattern.charAt(pIdx);

    // If pattern char already mapped
    if (map.containsKey(c)) {
        String word = map.get(c);
        if (!s.startsWith(word, sIdx)) return false;
        return backtrack(pattern, pIdx + 1, s, sIdx + word.length(), map, used);
    }

    // Try all possible substrings for this pattern char
    for (int end = sIdx + 1; end <= s.length(); end++) {
        String word = s.substring(sIdx, end);

        // Word already used by another char - skip
        if (used.contains(word)) continue;

        // Try this mapping
        map.put(c, word);
        used.add(word);

        if (backtrack(pattern, pIdx + 1, s, end, map, used)) {
            return true;
        }

        // Backtrack
        map.remove(c);
        used.remove(word);
    }

    return false;
}
```

---

### 🔒 PREMIUM: Isomorphic Strings - Find All Pairs

**Custom Problem** | **Difficulty:** Medium

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  FIND ALL ISOMORPHIC PAIRS                                                ║
║  (Custom Premium-Style Problem)                                           ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Given an array of strings, group all isomorphic strings together.       ║
║                                                                           ║
║  Two strings are isomorphic if the characters in one string can be       ║
║  replaced to get the other string while preserving the order.            ║
║                                                                           ║
║  ─────────────────────────────────────────────────────────────────────   ║
║                                                                           ║
║  Example 1:                                                               ║
║  Input: ["egg", "add", "foo", "bar", "paper", "title", "abc", "xyz"]     ║
║  Output: [["egg", "add"], ["foo"], ["bar", "abc", "xyz"],                ║
║           ["paper", "title"]]                                            ║
║                                                                           ║
║  Explanation:                                                             ║
║  - "egg" ↔ "add" (pattern: 011)                                          ║
║  - "foo" alone (pattern: 011, but different length group)                ║
║  - "bar", "abc", "xyz" (pattern: 012)                                    ║
║  - "paper" ↔ "title" (pattern: 01023)                                    ║
║                                                                           ║
║  Example 2:                                                               ║
║  Input: ["aab", "xxy", "xyz", "abc", "def", "aba"]                       ║
║  Output: [["aab", "xxy"], ["xyz", "abc", "def"], ["aba"]]                ║
║                                                                           ║
║  ─────────────────────────────────────────────────────────────────────   ║
║                                                                           ║
║  Constraints:                                                             ║
║  - 1 <= words.length <= 1000                                             ║
║  - 1 <= words[i].length <= 20                                            ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public List<List<String>> groupIsomorphic(String[] words) {
    Map<String, List<String>> groups = new HashMap<>();

    for (String word : words) {
        String pattern = getPattern(word);
        groups.computeIfAbsent(pattern, k -> new ArrayList<>()).add(word);
    }

    return new ArrayList<>(groups.values());
}

// Convert string to pattern like "01123" for "abbc"
private String getPattern(String s) {
    Map<Character, Integer> map = new HashMap<>();
    StringBuilder pattern = new StringBuilder();
    int id = 0;

    for (char c : s.toCharArray()) {
        if (!map.containsKey(c)) {
            map.put(c, id++);
        }
        pattern.append(map.get(c));
    }

    return pattern.toString();
}
```

---

## 2.2 ANAGRAM PROBLEMS

### Problem: Valid Anagram

**LeetCode 242** | **Difficulty:** Easy
🔗 [https://leetcode.com/problems/valid-anagram/](https://leetcode.com/problems/valid-anagram/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  VALID ANAGRAM                                                            ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Given two strings s and t, return true if t is an anagram of s.         ║
║  Anagram = same characters, same frequency, different order.             ║
║                                                                           ║
║  Input: s = "anagram", t = "nagaram"                                      ║
║  Output: true                                                             ║
║                                                                           ║
║  Input: s = "rat", t = "car"                                              ║
║  Output: false                                                            ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public boolean isAnagram(String s, String t) {
    if (s.length() != t.length()) return false;

    int[] count = new int[26];

    for (int i = 0; i < s.length(); i++) {
        count[s.charAt(i) - 'a']++;
        count[t.charAt(i) - 'a']--;
    }

    for (int c : count) {
        if (c != 0) return false;
    }
    return true;
}
```

---

### Problem: Find All Anagrams in String

**LeetCode 438** | **Difficulty:** Medium
🔗 [https://leetcode.com/problems/find-all-anagrams-in-a-string/](https://leetcode.com/problems/find-all-anagrams-in-a-string/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  FIND ALL ANAGRAMS IN A STRING                                            ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Find all start indices of p's anagrams in s.                            ║
║                                                                           ║
║  Input: s = "cbaebabacd", p = "abc"                                       ║
║  Output: [0, 6]                                                           ║
║  Explanation:                                                             ║
║  Index 0: "cba" is anagram of "abc"                                       ║
║  Index 6: "bac" is anagram of "abc"                                       ║
║                                                                           ║
║  Input: s = "abab", p = "ab"                                              ║
║  Output: [0, 1, 2]                                                        ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public List<Integer> findAnagrams(String s, String p) {
    List<Integer> result = new ArrayList<>();
    if (s.length() < p.length()) return result;

    int[] pCount = new int[26];
    int[] sCount = new int[26];

    // Initialize with first window
    for (int i = 0; i < p.length(); i++) {
        pCount[p.charAt(i) - 'a']++;
        sCount[s.charAt(i) - 'a']++;
    }

    if (Arrays.equals(pCount, sCount)) result.add(0);

    // Slide window
    for (int i = p.length(); i < s.length(); i++) {
        sCount[s.charAt(i) - 'a']++;                      // Add new char
        sCount[s.charAt(i - p.length()) - 'a']--;         // Remove old char

        if (Arrays.equals(pCount, sCount)) {
            result.add(i - p.length() + 1);
        }
    }

    return result;
}
```

---

### 🔒 PREMIUM: Strobogrammatic Number

**LeetCode 246** | **Difficulty:** Easy | **Premium Problem**

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  STROBOGRAMMATIC NUMBER                                                   ║
║  (LeetCode Premium - Full Problem Description)                            ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  A strobogrammatic number is a number that looks the same when rotated   ║
║  180 degrees (looked at upside down).                                    ║
║                                                                           ║
║  Given a string num representing an integer, return true if num is a     ║
║  strobogrammatic number.                                                  ║
║                                                                           ║
║  Valid strobogrammatic digits:                                            ║
║  - 0 rotated is 0                                                        ║
║  - 1 rotated is 1                                                        ║
║  - 6 rotated is 9                                                        ║
║  - 8 rotated is 8                                                        ║
║  - 9 rotated is 6                                                        ║
║                                                                           ║
║  ─────────────────────────────────────────────────────────────────────   ║
║                                                                           ║
║  Example 1:                                                               ║
║  Input: num = "69"                                                        ║
║  Output: true                                                             ║
║  Explanation: 69 rotated 180° is 69                                      ║
║                                                                           ║
║  Example 2:                                                               ║
║  Input: num = "88"                                                        ║
║  Output: true                                                             ║
║                                                                           ║
║  Example 3:                                                               ║
║  Input: num = "962"                                                       ║
║  Output: false                                                            ║
║  Explanation: 962 rotated is 296 ≠ 962                                   ║
║                                                                           ║
║  Example 4:                                                               ║
║  Input: num = "1"                                                         ║
║  Output: true                                                             ║
║                                                                           ║
║  ─────────────────────────────────────────────────────────────────────   ║
║                                                                           ║
║  Constraints:                                                             ║
║  - 1 <= num.length <= 50                                                 ║
║  - num consists of only digits                                           ║
║  - num does not have leading zeros except for zero itself                ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public boolean isStrobogrammatic(String num) {
    Map<Character, Character> map = new HashMap<>();
    map.put('0', '0');
    map.put('1', '1');
    map.put('6', '9');
    map.put('8', '8');
    map.put('9', '6');

    int left = 0, right = num.length() - 1;

    while (left <= right) {
        char l = num.charAt(left);
        char r = num.charAt(right);

        if (!map.containsKey(l) || map.get(l) != r) {
            return false;
        }

        left++;
        right--;
    }

    return true;
}
```

---

### 🔒 PREMIUM: Strobogrammatic Number II

**LeetCode 247** | **Difficulty:** Medium | **Premium Problem**

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  STROBOGRAMMATIC NUMBER II                                                ║
║  (LeetCode Premium - Full Problem Description)                            ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Given an integer n, return all the strobogrammatic numbers that are of  ║
║  length n. A strobogrammatic number is a number that looks the same      ║
║  when rotated 180 degrees.                                               ║
║                                                                           ║
║  You may return the answer in any order.                                 ║
║                                                                           ║
║  ─────────────────────────────────────────────────────────────────────   ║
║                                                                           ║
║  Example 1:                                                               ║
║  Input: n = 2                                                             ║
║  Output: ["11", "69", "88", "96"]                                        ║
║                                                                           ║
║  Example 2:                                                               ║
║  Input: n = 1                                                             ║
║  Output: ["0", "1", "8"]                                                 ║
║                                                                           ║
║  Example 3:                                                               ║
║  Input: n = 3                                                             ║
║  Output: ["101", "111", "181", "609", "619", "689",                       ║
║           "808", "818", "888", "906", "916", "986"]                       ║
║                                                                           ║
║  ─────────────────────────────────────────────────────────────────────   ║
║                                                                           ║
║  Constraints:                                                             ║
║  - 1 <= n <= 14                                                          ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public List<String> findStrobogrammatic(int n) {
    return helper(n, n);
}

private List<String> helper(int n, int finalLength) {
    if (n == 0) return Arrays.asList("");
    if (n == 1) return Arrays.asList("0", "1", "8");

    List<String> middles = helper(n - 2, finalLength);
    List<String> result = new ArrayList<>();

    for (String middle : middles) {
        // Don't add "0" at the start if this is the outermost level
        if (n != finalLength) {
            result.add("0" + middle + "0");
        }
        result.add("1" + middle + "1");
        result.add("6" + middle + "9");
        result.add("8" + middle + "8");
        result.add("9" + middle + "6");
    }

    return result;
}
```

---

## 2.3 PALINDROME PROBLEMS

### Problem: Valid Palindrome II

**LeetCode 680** | **Difficulty:** Easy
🔗 [https://leetcode.com/problems/valid-palindrome-ii/](https://leetcode.com/problems/valid-palindrome-ii/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  VALID PALINDROME II                                                      ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Given string s, return true if it can become palindrome after deleting  ║
║  at most one character.                                                  ║
║                                                                           ║
║  Input: s = "abca"                                                        ║
║  Output: true                                                             ║
║  Explanation: Delete 'c' → "aba" or delete 'b' → "aca"                   ║
║                                                                           ║
║  Input: s = "abc"                                                         ║
║  Output: false                                                            ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public boolean validPalindrome(String s) {
    int left = 0, right = s.length() - 1;

    while (left < right) {
        if (s.charAt(left) != s.charAt(right)) {
            // Try skipping left or right character
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

---

### 🔒 PREMIUM: Palindrome Permutation

**LeetCode 266** | **Difficulty:** Easy | **Premium Problem**

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  PALINDROME PERMUTATION                                                   ║
║  (LeetCode Premium - Full Problem Description)                            ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Given a string s, return true if a permutation of the string could      ║
║  form a palindrome.                                                       ║
║                                                                           ║
║  ─────────────────────────────────────────────────────────────────────   ║
║                                                                           ║
║  Example 1:                                                               ║
║  Input: s = "code"                                                        ║
║  Output: false                                                            ║
║  Explanation: No permutation of "code" is a palindrome.                  ║
║                                                                           ║
║  Example 2:                                                               ║
║  Input: s = "aab"                                                         ║
║  Output: true                                                             ║
║  Explanation: "aba" is a palindrome permutation.                         ║
║                                                                           ║
║  Example 3:                                                               ║
║  Input: s = "carerac"                                                     ║
║  Output: true                                                             ║
║  Explanation: "carerac" → "racecar" is a palindrome.                     ║
║                                                                           ║
║  ─────────────────────────────────────────────────────────────────────   ║
║                                                                           ║
║  KEY INSIGHT:                                                             ║
║  A string can form a palindrome if at most ONE character has odd count.  ║
║  - Even length: all chars must have even count                           ║
║  - Odd length: exactly one char has odd count (middle char)              ║
║                                                                           ║
║  ─────────────────────────────────────────────────────────────────────   ║
║                                                                           ║
║  Constraints:                                                             ║
║  - 1 <= s.length <= 5000                                                 ║
║  - s consists of only lowercase English letters                          ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public boolean canPermutePalindrome(String s) {
    int[] count = new int[26];

    for (char c : s.toCharArray()) {
        count[c - 'a']++;
    }

    int oddCount = 0;
    for (int c : count) {
        if (c % 2 == 1) oddCount++;
    }

    return oddCount <= 1;
}

// Alternative: Using Set (toggle)
public boolean canPermutePalindromeSet(String s) {
    Set<Character> set = new HashSet<>();

    for (char c : s.toCharArray()) {
        if (set.contains(c)) {
            set.remove(c);  // Seen twice, remove
        } else {
            set.add(c);     // First time, add
        }
    }

    // Set contains chars with odd count
    return set.size() <= 1;
}
```

---

# SECTION 3: ARRAY PROBLEMS

---

## 3.1 BASIC ARRAY OPERATIONS

### Problem: Two Sum

**LeetCode 1** | **Difficulty:** Easy
🔗 [https://leetcode.com/problems/two-sum/](https://leetcode.com/problems/two-sum/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  TWO SUM                                                                  ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Given array of integers and target, return indices of two numbers that  ║
║  add up to target. Each input has exactly one solution.                  ║
║                                                                           ║
║  Input: nums = [2, 7, 11, 15], target = 9                                ║
║  Output: [0, 1]                                                           ║
║  Explanation: nums[0] + nums[1] = 2 + 7 = 9                              ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public int[] twoSum(int[] nums, int target) {
    Map<Integer, Integer> map = new HashMap<>();

    for (int i = 0; i < nums.length; i++) {
        int complement = target - nums[i];
        if (map.containsKey(complement)) {
            return new int[]{map.get(complement), i};
        }
        map.put(nums[i], i);
    }

    return new int[]{-1, -1};
}
```

---

### 🔒 PREMIUM: Two Sum III - Data Structure Design

**LeetCode 170** | **Difficulty:** Easy | **Premium Problem**

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  TWO SUM III - DATA STRUCTURE DESIGN                                      ║
║  (LeetCode Premium - Full Problem Description)                            ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Design a data structure that accepts a stream of integers and checks    ║
║  if it has a pair of integers that sum up to a particular value.         ║
║                                                                           ║
║  Implement the TwoSum class:                                              ║
║  - TwoSum() Initializes the TwoSum object                                ║
║  - void add(int number) Adds number to the data structure                ║
║  - boolean find(int value) Returns true if there exists any pair of      ║
║    numbers whose sum is equal to value, otherwise returns false.         ║
║                                                                           ║
║  ─────────────────────────────────────────────────────────────────────   ║
║                                                                           ║
║  Example 1:                                                               ║
║  Input:                                                                   ║
║  ["TwoSum", "add", "add", "add", "find", "find"]                         ║
║  [[], [1], [3], [5], [4], [7]]                                           ║
║  Output: [null, null, null, null, true, false]                           ║
║                                                                           ║
║  Explanation:                                                             ║
║  TwoSum twoSum = new TwoSum();                                           ║
║  twoSum.add(1);   // [1]                                                 ║
║  twoSum.add(3);   // [1, 3]                                              ║
║  twoSum.add(5);   // [1, 3, 5]                                           ║
║  twoSum.find(4);  // 1 + 3 = 4, return true                              ║
║  twoSum.find(7);  // No pairs sum to 7, return false                     ║
║                                                                           ║
║  ─────────────────────────────────────────────────────────────────────   ║
║                                                                           ║
║  Constraints:                                                             ║
║  - -10^5 <= number <= 10^5                                               ║
║  - -2^31 <= value <= 2^31 - 1                                            ║
║  - At most 10^4 calls will be made to add and find                       ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
class TwoSum {
    private Map<Integer, Integer> numCount;

    public TwoSum() {
        numCount = new HashMap<>();
    }

    public void add(int number) {
        numCount.put(number, numCount.getOrDefault(number, 0) + 1);
    }

    public boolean find(int value) {
        for (int num : numCount.keySet()) {
            int complement = value - num;

            if (complement == num) {
                // Need two of the same number
                if (numCount.get(num) > 1) return true;
            } else {
                if (numCount.containsKey(complement)) return true;
            }
        }
        return false;
    }
}
```

---

### Problem: Contains Duplicate

**LeetCode 217** | **Difficulty:** Easy
🔗 [https://leetcode.com/problems/contains-duplicate/](https://leetcode.com/problems/contains-duplicate/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  CONTAINS DUPLICATE                                                       ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Return true if any value appears at least twice in the array.           ║
║                                                                           ║
║  Input: nums = [1, 2, 3, 1]                                               ║
║  Output: true                                                             ║
║                                                                           ║
║  Input: nums = [1, 2, 3, 4]                                               ║
║  Output: false                                                            ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public boolean containsDuplicate(int[] nums) {
    Set<Integer> seen = new HashSet<>();
    for (int num : nums) {
        if (!seen.add(num)) return true;  // add returns false if already exists
    }
    return false;
}
```

---

### 🔒 PREMIUM: Contains Duplicate III

**LeetCode 220** | **Difficulty:** Hard | **Premium-Level Problem**

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  CONTAINS DUPLICATE III                                                   ║
║  (Premium-Level Difficulty)                                               ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Given an integer array nums and two integers indexDiff and valueDiff,   ║
║  find a pair of indices (i, j) such that:                                ║
║  - i != j                                                                 ║
║  - abs(i - j) <= indexDiff                                               ║
║  - abs(nums[i] - nums[j]) <= valueDiff                                   ║
║                                                                           ║
║  Return true if such pair exists, false otherwise.                       ║
║                                                                           ║
║  ─────────────────────────────────────────────────────────────────────   ║
║                                                                           ║
║  Example 1:                                                               ║
║  Input: nums = [1,2,3,1], indexDiff = 3, valueDiff = 0                   ║
║  Output: true                                                             ║
║  Explanation: i=0, j=3, |0-3|<=3, |1-1|<=0                               ║
║                                                                           ║
║  Example 2:                                                               ║
║  Input: nums = [1,5,9,1,5,9], indexDiff = 2, valueDiff = 3               ║
║  Output: false                                                            ║
║                                                                           ║
║  ─────────────────────────────────────────────────────────────────────   ║
║                                                                           ║
║  Constraints:                                                             ║
║  - 2 <= nums.length <= 10^5                                              ║
║  - -10^9 <= nums[i] <= 10^9                                              ║
║  - 1 <= indexDiff <= nums.length                                         ║
║  - 0 <= valueDiff <= 10^9                                                ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
// Bucket Sort Approach - O(n) time, O(k) space
public boolean containsNearbyAlmostDuplicate(int[] nums, int indexDiff, int valueDiff) {
    if (valueDiff < 0) return false;

    Map<Long, Long> buckets = new HashMap<>();
    long bucketSize = (long) valueDiff + 1;

    for (int i = 0; i < nums.length; i++) {
        long bucket = getBucket(nums[i], bucketSize);

        // Check same bucket
        if (buckets.containsKey(bucket)) return true;

        // Check adjacent buckets
        if (buckets.containsKey(bucket - 1) &&
            nums[i] - buckets.get(bucket - 1) <= valueDiff) return true;
        if (buckets.containsKey(bucket + 1) &&
            buckets.get(bucket + 1) - nums[i] <= valueDiff) return true;

        buckets.put(bucket, (long) nums[i]);

        // Remove old bucket outside window
        if (i >= indexDiff) {
            buckets.remove(getBucket(nums[i - indexDiff], bucketSize));
        }
    }
    return false;
}

private long getBucket(int num, long bucketSize) {
    return num >= 0 ? num / bucketSize : (num + 1) / bucketSize - 1;
}
```

---

### Problem: Move Zeroes

**LeetCode 283** | **Difficulty:** Easy
🔗 [https://leetcode.com/problems/move-zeroes/](https://leetcode.com/problems/move-zeroes/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  MOVE ZEROES                                                              ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Move all 0's to end while maintaining relative order of non-zero        ║
║  elements. Do it in-place.                                               ║
║                                                                           ║
║  Input: nums = [0, 1, 0, 3, 12]                                           ║
║  Output: [1, 3, 12, 0, 0]                                                 ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public void moveZeroes(int[] nums) {
    int insertPos = 0;

    // Move all non-zero elements to front
    for (int num : nums) {
        if (num != 0) {
            nums[insertPos++] = num;
        }
    }

    // Fill rest with zeros
    while (insertPos < nums.length) {
        nums[insertPos++] = 0;
    }
}
```

---

### 🔒 PREMIUM: Meeting Rooms

**LeetCode 252** | **Difficulty:** Easy | **Premium Problem**

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  MEETING ROOMS                                                            ║
║  (LeetCode Premium - Full Problem Description)                            ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Given an array of meeting time intervals where intervals[i] =           ║
║  [start_i, end_i], determine if a person could attend all meetings.      ║
║                                                                           ║
║  ─────────────────────────────────────────────────────────────────────   ║
║                                                                           ║
║  Example 1:                                                               ║
║  Input: intervals = [[0,30], [5,10], [15,20]]                            ║
║  Output: false                                                            ║
║  Explanation: [0,30] overlaps with [5,10] and [15,20]                    ║
║                                                                           ║
║  Example 2:                                                               ║
║  Input: intervals = [[7,10], [2,4]]                                      ║
║  Output: true                                                             ║
║  Explanation: No overlap between meetings                                 ║
║                                                                           ║
║  ─────────────────────────────────────────────────────────────────────   ║
║                                                                           ║
║  Visual:                                                                  ║
║  Example 1:                                                               ║
║  |=============================| [0,30]                                  ║
║       |===| [5,10]                                                       ║
║                 |====| [15,20]                                           ║
║  Overlapping! Can't attend all.                                          ║
║                                                                           ║
║  Example 2:                                                               ║
║    |==| [2,4]                                                            ║
║             |===| [7,10]                                                 ║
║  No overlap! Can attend all.                                             ║
║                                                                           ║
║  ─────────────────────────────────────────────────────────────────────   ║
║                                                                           ║
║  Constraints:                                                             ║
║  - 0 <= intervals.length <= 10^4                                         ║
║  - intervals[i].length == 2                                              ║
║  - 0 <= start_i < end_i <= 10^6                                          ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public boolean canAttendMeetings(int[][] intervals) {
    // Sort by start time
    Arrays.sort(intervals, (a, b) -> a[0] - b[0]);

    // Check for overlaps
    for (int i = 1; i < intervals.length; i++) {
        if (intervals[i][0] < intervals[i-1][1]) {
            return false;  // Overlap: current starts before previous ends
        }
    }

    return true;
}
```

---

### 🔒 PREMIUM: Meeting Rooms II

**LeetCode 253** | **Difficulty:** Medium | **Premium Problem**

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  MEETING ROOMS II                                                         ║
║  (LeetCode Premium - Full Problem Description)                            ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Given an array of meeting time intervals, find the minimum number of    ║
║  conference rooms required.                                              ║
║                                                                           ║
║  ─────────────────────────────────────────────────────────────────────   ║
║                                                                           ║
║  Example 1:                                                               ║
║  Input: intervals = [[0,30], [5,10], [15,20]]                            ║
║  Output: 2                                                                ║
║  Explanation:                                                             ║
║  Room 1: [0,30]                                                          ║
║  Room 2: [5,10], then [15,20]                                            ║
║                                                                           ║
║  Example 2:                                                               ║
║  Input: intervals = [[7,10], [2,4]]                                      ║
║  Output: 1                                                                ║
║  Explanation: No overlap, one room is enough                             ║
║                                                                           ║
║  Example 3:                                                               ║
║  Input: intervals = [[1,5], [2,6], [3,7], [4,8]]                         ║
║  Output: 4                                                                ║
║  Explanation: All meetings overlap at time 4, need 4 rooms               ║
║                                                                           ║
║  ─────────────────────────────────────────────────────────────────────   ║
║                                                                           ║
║  Visual for Example 1:                                                    ║
║  Time: 0  5  10  15  20  25  30                                          ║
║  Room1: |=========================|                                      ║
║  Room2:    |==|     |====|                                               ║
║                                                                           ║
║  ─────────────────────────────────────────────────────────────────────   ║
║                                                                           ║
║  Constraints:                                                             ║
║  - 1 <= intervals.length <= 10^4                                         ║
║  - 0 <= start_i < end_i <= 10^6                                          ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
// Method 1: Min Heap - O(n log n)
public int minMeetingRooms(int[][] intervals) {
    if (intervals.length == 0) return 0;

    // Sort by start time
    Arrays.sort(intervals, (a, b) -> a[0] - b[0]);

    // Min heap to track end times
    PriorityQueue<Integer> heap = new PriorityQueue<>();
    heap.add(intervals[0][1]);

    for (int i = 1; i < intervals.length; i++) {
        // If current meeting starts after earliest ending, reuse room
        if (intervals[i][0] >= heap.peek()) {
            heap.poll();
        }
        // Add current meeting's end time
        heap.add(intervals[i][1]);
    }

    return heap.size();
}

// Method 2: Chronological Ordering - O(n log n)
public int minMeetingRoomsV2(int[][] intervals) {
    int[] starts = new int[intervals.length];
    int[] ends = new int[intervals.length];

    for (int i = 0; i < intervals.length; i++) {
        starts[i] = intervals[i][0];
        ends[i] = intervals[i][1];
    }

    Arrays.sort(starts);
    Arrays.sort(ends);

    int rooms = 0, endIdx = 0;

    for (int start : starts) {
        if (start < ends[endIdx]) {
            rooms++;  // Need new room
        } else {
            endIdx++; // Reuse room that freed up
        }
    }

    return rooms;
}
```

---

### 🔒 PREMIUM: Missing Ranges

**LeetCode 163** | **Difficulty:** Easy | **Premium Problem**

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  MISSING RANGES                                                           ║
║  (LeetCode Premium - Full Problem Description)                            ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Given a sorted unique integer array nums and two integers lower and     ║
║  upper, return the smallest sorted list of ranges that cover every       ║
║  missing number exactly. That is, no element of nums is in any range,    ║
║  and each missing number is in one of the ranges.                        ║
║                                                                           ║
║  Each range [a,b] in the list should be output as:                       ║
║  - "a->b" if a != b                                                       ║
║  - "a" if a == b                                                          ║
║                                                                           ║
║  ─────────────────────────────────────────────────────────────────────   ║
║                                                                           ║
║  Example 1:                                                               ║
║  Input: nums = [0, 1, 3, 50, 75], lower = 0, upper = 99                  ║
║  Output: ["2", "4->49", "51->74", "76->99"]                              ║
║  Explanation:                                                             ║
║  - 2 is missing                                                          ║
║  - 4 to 49 are missing                                                   ║
║  - 51 to 74 are missing                                                  ║
║  - 76 to 99 are missing                                                  ║
║                                                                           ║
║  Example 2:                                                               ║
║  Input: nums = [-1], lower = -1, upper = -1                              ║
║  Output: []                                                               ║
║  Explanation: No missing numbers in range [-1, -1]                       ║
║                                                                           ║
║  Example 3:                                                               ║
║  Input: nums = [], lower = 1, upper = 1                                  ║
║  Output: ["1"]                                                            ║
║                                                                           ║
║  Example 4:                                                               ║
║  Input: nums = [], lower = -3, upper = -1                                ║
║  Output: ["-3->-1"]                                                       ║
║                                                                           ║
║  ─────────────────────────────────────────────────────────────────────   ║
║                                                                           ║
║  Constraints:                                                             ║
║  - -10^9 <= lower <= upper <= 10^9                                       ║
║  - 0 <= nums.length <= 100                                               ║
║  - lower <= nums[i] <= upper                                             ║
║  - All values of nums are unique                                         ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public List<String> findMissingRanges(int[] nums, int lower, int upper) {
    List<String> result = new ArrayList<>();
    int prev = lower - 1;

    for (int i = 0; i <= nums.length; i++) {
        int curr = (i == nums.length) ? upper + 1 : nums[i];

        if (curr - prev > 1) {
            result.add(formatRange(prev + 1, curr - 1));
        }

        prev = curr;
    }

    return result;
}

private String formatRange(int lower, int upper) {
    if (lower == upper) {
        return String.valueOf(lower);
    }
    return lower + "->" + upper;
}
```

---

## 📋 PROBLEM TRACKING CHECKLIST

### Basic Math

- [ ] Check if Prime
- [ ] Count Primes (LeetCode 204)
- [ ] Nth Prime Number
- [ ] Previous/Next Prime
- [ ] Prime Factors
- [ ] 🔒 Closest Prime Numbers in Range

### Fibonacci

- [ ] Nth Fibonacci (LeetCode 509)
- [ ] Sum of First N Fibonacci
- [ ] Check if Fibonacci
- [ ] Tribonacci (LeetCode 1137)
- [ ] Climbing Stairs (LeetCode 70)

### Digit Manipulation

- [ ] Sum of Digits
- [ ] Add Digits (LeetCode 258)
- [ ] Reverse Integer (LeetCode 7)
- [ ] Palindrome Number (LeetCode 9)
- [ ] Happy Number (LeetCode 202)

### GCD/LCM

- [ ] GCD (Euclidean Algorithm)
- [ ] 🔒 GCD of Array (LeetCode 1979)

### Strings - Isomorphic/Pattern

- [ ] Isomorphic Strings (LeetCode 205)
- [ ] Word Pattern (LeetCode 290)
- [ ] 🔒 Word Pattern II (LeetCode 291)
- [ ] 🔒 Group Isomorphic Strings

### Strings - Anagram

- [ ] Valid Anagram (LeetCode 242)
- [ ] Find All Anagrams (LeetCode 438)
- [ ] 🔒 Strobogrammatic Number (LeetCode 246)
- [ ] 🔒 Strobogrammatic Number II (LeetCode 247)

### Strings - Palindrome

- [ ] Valid Palindrome II (LeetCode 680)
- [ ] 🔒 Palindrome Permutation (LeetCode 266)

### Arrays

- [ ] Two Sum (LeetCode 1)
- [ ] 🔒 Two Sum III (LeetCode 170)
- [ ] Contains Duplicate (LeetCode 217)
- [ ] 🔒 Contains Duplicate III (LeetCode 220)
- [ ] Move Zeroes (LeetCode 283)
- [ ] 🔒 Meeting Rooms (LeetCode 252)
- [ ] 🔒 Meeting Rooms II (LeetCode 253)
- [ ] 🔒 Missing Ranges (LeetCode 163)

---

# SECTION 4: SLIDING WINDOW PATTERN VARIANTS

---

## 4.1 FIXED SIZE WINDOW

### Problem: Maximum Sum Subarray of Size K

**Difficulty:** Easy | **Category:** Sliding Window

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  MAXIMUM SUM SUBARRAY OF SIZE K                                           ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Given array and integer k, find maximum sum of any contiguous subarray  ║
║  of size k.                                                              ║
║                                                                           ║
║  Input: arr = [2, 1, 5, 1, 3, 2], k = 3                                  ║
║  Output: 9                                                                ║
║  Explanation: Subarray [5, 1, 3] has maximum sum = 9                     ║
║                                                                           ║
║  Visual:                                                                  ║
║  [2, 1, 5, 1, 3, 2]                                                      ║
║   └──┘  sum=8                                                            ║
║      └──┘  sum=7                                                         ║
║         └──┘  sum=9 ← MAX                                                ║
║            └──┘  sum=6                                                   ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public int maxSumSubarray(int[] arr, int k) {
    int windowSum = 0, maxSum = 0;

    for (int i = 0; i < arr.length; i++) {
        windowSum += arr[i];

        if (i >= k - 1) {
            maxSum = Math.max(maxSum, windowSum);
            windowSum -= arr[i - k + 1];
        }
    }
    return maxSum;
}
```

---

### Problem: Maximum Average Subarray I

**LeetCode 643** | **Difficulty:** Easy
🔗 [https://leetcode.com/problems/maximum-average-subarray-i/](https://leetcode.com/problems/maximum-average-subarray-i/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  MAXIMUM AVERAGE SUBARRAY I                                               ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Find contiguous subarray of length k with maximum average value.        ║
║                                                                           ║
║  Input: nums = [1,12,-5,-6,50,3], k = 4                                  ║
║  Output: 12.75                                                            ║
║  Explanation: Max avg is (12-5-6+50)/4 = 51/4 = 12.75                    ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public double findMaxAverage(int[] nums, int k) {
    double sum = 0;
    for (int i = 0; i < k; i++) sum += nums[i];

    double maxSum = sum;
    for (int i = k; i < nums.length; i++) {
        sum += nums[i] - nums[i - k];
        maxSum = Math.max(maxSum, sum);
    }
    return maxSum / k;
}
```

---

### Problem: Number of Sub-arrays of Size K with Average >= Threshold

**LeetCode 1343** | **Difficulty:** Medium
🔗 [https://leetcode.com/problems/number-of-sub-arrays-of-size-k-and-average-greater-than-or-equal-to-threshold/](https://leetcode.com/problems/number-of-sub-arrays-of-size-k-and-average-greater-than-or-equal-to-threshold/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  SUBARRAYS WITH AVG >= THRESHOLD                                          ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Count subarrays of size k where average >= threshold.                   ║
║                                                                           ║
║  Input: arr = [2,2,2,2,5,5,5,8], k = 3, threshold = 4                    ║
║  Output: 3                                                                ║
║  Explanation: [2,5,5], [5,5,5], [5,5,8] have avg >= 4                    ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public int numOfSubarrays(int[] arr, int k, int threshold) {
    int sum = 0, count = 0;
    int target = k * threshold;  // Avoid division

    for (int i = 0; i < arr.length; i++) {
        sum += arr[i];
        if (i >= k - 1) {
            if (sum >= target) count++;
            sum -= arr[i - k + 1];
        }
    }
    return count;
}
```

---

### 🔒 PREMIUM: Maximum Sum of Distinct Subarrays With Length K

**LeetCode 2461** | **Difficulty:** Medium | **Premium Problem**

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  MAX SUM OF DISTINCT SUBARRAYS WITH LENGTH K                              ║
║  (LeetCode Premium - Full Problem Description)                            ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Find maximum sum among all subarrays of length k where ALL elements     ║
║  are DISTINCT (no duplicates in window).                                 ║
║                                                                           ║
║  ─────────────────────────────────────────────────────────────────────   ║
║                                                                           ║
║  Example 1:                                                               ║
║  Input: nums = [1,5,4,2,9,9,9], k = 3                                    ║
║  Output: 15                                                               ║
║  Explanation:                                                             ║
║  [1,5,4] sum=10, all distinct ✓                                          ║
║  [5,4,2] sum=11, all distinct ✓                                          ║
║  [4,2,9] sum=15, all distinct ✓ ← MAX                                    ║
║  [2,9,9] has duplicate 9, skip                                           ║
║  [9,9,9] has duplicates, skip                                            ║
║                                                                           ║
║  Example 2:                                                               ║
║  Input: nums = [4,4,4], k = 3                                            ║
║  Output: 0                                                                ║
║  Explanation: No subarray of length 3 has all distinct elements          ║
║                                                                           ║
║  ─────────────────────────────────────────────────────────────────────   ║
║                                                                           ║
║  Constraints:                                                             ║
║  - 1 <= k <= nums.length <= 10^5                                         ║
║  - 1 <= nums[i] <= 10^5                                                  ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public long maximumSubarraySum(int[] nums, int k) {
    Map<Integer, Integer> count = new HashMap<>();
    long sum = 0, maxSum = 0;
    int duplicates = 0;

    for (int i = 0; i < nums.length; i++) {
        // Add new element
        sum += nums[i];
        int freq = count.getOrDefault(nums[i], 0);
        if (freq == 1) duplicates++;
        count.put(nums[i], freq + 1);

        // Remove old element when window exceeds k
        if (i >= k) {
            int old = nums[i - k];
            sum -= old;
            int oldFreq = count.get(old);
            if (oldFreq == 2) duplicates--;
            count.put(old, oldFreq - 1);
        }

        // Check if valid window
        if (i >= k - 1 && duplicates == 0) {
            maxSum = Math.max(maxSum, sum);
        }
    }
    return maxSum;
}
```

---

## 4.2 VARIABLE SIZE WINDOW

### Problem: Minimum Size Subarray Sum

**LeetCode 209** | **Difficulty:** Medium
🔗 [https://leetcode.com/problems/minimum-size-subarray-sum/](https://leetcode.com/problems/minimum-size-subarray-sum/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  MINIMUM SIZE SUBARRAY SUM                                                ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Find minimal length of contiguous subarray with sum >= target.          ║
║                                                                           ║
║  Input: target = 7, nums = [2,3,1,2,4,3]                                 ║
║  Output: 2                                                                ║
║  Explanation: [4,3] has sum=7 with length 2                              ║
║                                                                           ║
║  Visual:                                                                  ║
║  [2,3,1,2,4,3]                                                           ║
║   └────────┘ sum=12, len=5                                               ║
║     └──────┘ sum=10, len=4                                               ║
║       └────┘ sum=7, len=3                                                ║
║           └─┘ sum=7, len=2 ← MIN                                         ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public int minSubArrayLen(int target, int[] nums) {
    int left = 0, sum = 0, minLen = Integer.MAX_VALUE;

    for (int right = 0; right < nums.length; right++) {
        sum += nums[right];

        while (sum >= target) {
            minLen = Math.min(minLen, right - left + 1);
            sum -= nums[left++];
        }
    }
    return minLen == Integer.MAX_VALUE ? 0 : minLen;
}
```

---

### Problem: Longest Substring with At Most K Distinct Characters

**LeetCode 340** | **Difficulty:** Medium | 🔒 Premium
🔗 Premium Problem

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  LONGEST SUBSTRING WITH AT MOST K DISTINCT CHARS                          ║
║  (LeetCode 340 - Premium)                                                 ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Find length of longest substring with at most k distinct characters.    ║
║                                                                           ║
║  ─────────────────────────────────────────────────────────────────────   ║
║                                                                           ║
║  Example 1:                                                               ║
║  Input: s = "eceba", k = 2                                               ║
║  Output: 3                                                                ║
║  Explanation: "ece" has 2 distinct chars (e, c)                          ║
║                                                                           ║
║  Example 2:                                                               ║
║  Input: s = "aa", k = 1                                                  ║
║  Output: 2                                                                ║
║                                                                           ║
║  Example 3:                                                               ║
║  Input: s = "aabacbebebe", k = 3                                         ║
║  Output: 7                                                                ║
║  Explanation: "cbebebe" has 3 distinct (c, b, e)                         ║
║                                                                           ║
║  ─────────────────────────────────────────────────────────────────────   ║
║                                                                           ║
║  Constraints:                                                             ║
║  - 1 <= s.length <= 5 * 10^4                                             ║
║  - 0 <= k <= 50                                                          ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public int lengthOfLongestSubstringKDistinct(String s, int k) {
    if (k == 0) return 0;

    Map<Character, Integer> map = new HashMap<>();
    int left = 0, maxLen = 0;

    for (int right = 0; right < s.length(); right++) {
        char c = s.charAt(right);
        map.put(c, map.getOrDefault(c, 0) + 1);

        while (map.size() > k) {
            char leftChar = s.charAt(left);
            map.put(leftChar, map.get(leftChar) - 1);
            if (map.get(leftChar) == 0) map.remove(leftChar);
            left++;
        }

        maxLen = Math.max(maxLen, right - left + 1);
    }
    return maxLen;
}
```

---

### Problem: Fruit Into Baskets (Longest with 2 Distinct)

**LeetCode 904** | **Difficulty:** Medium
🔗 [https://leetcode.com/problems/fruit-into-baskets/](https://leetcode.com/problems/fruit-into-baskets/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  FRUIT INTO BASKETS                                                       ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  You have 2 baskets. Each basket can hold only ONE type of fruit.        ║
║  Find maximum fruits you can collect (longest subarray with 2 types).    ║
║                                                                           ║
║  Input: fruits = [1,2,1]                                                 ║
║  Output: 3 (collect all)                                                 ║
║                                                                           ║
║  Input: fruits = [0,1,2,2]                                               ║
║  Output: 3 ([1,2,2])                                                     ║
║                                                                           ║
║  Input: fruits = [1,2,3,2,2]                                             ║
║  Output: 4 ([2,3,2,2])                                                   ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public int totalFruit(int[] fruits) {
    Map<Integer, Integer> basket = new HashMap<>();
    int left = 0, maxFruits = 0;

    for (int right = 0; right < fruits.length; right++) {
        basket.merge(fruits[right], 1, Integer::sum);

        while (basket.size() > 2) {
            int leftFruit = fruits[left];
            basket.merge(leftFruit, -1, Integer::sum);
            if (basket.get(leftFruit) == 0) basket.remove(leftFruit);
            left++;
        }

        maxFruits = Math.max(maxFruits, right - left + 1);
    }
    return maxFruits;
}
```

---

### Problem: Longest Repeating Character Replacement

**LeetCode 424** | **Difficulty:** Medium
🔗 [https://leetcode.com/problems/longest-repeating-character-replacement/](https://leetcode.com/problems/longest-repeating-character-replacement/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  LONGEST REPEATING CHARACTER REPLACEMENT                                  ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  You can replace at most k characters. Find longest substring with all   ║
║  same characters after at most k replacements.                           ║
║                                                                           ║
║  Input: s = "ABAB", k = 2                                                ║
║  Output: 4                                                                ║
║  Explanation: Replace 2 A's with B's → "BBBB" (or vice versa)            ║
║                                                                           ║
║  Input: s = "AABABBA", k = 1                                             ║
║  Output: 4                                                                ║
║  Explanation: Replace middle B → "AAAAABA" gives "AAAA"                  ║
║                                                                           ║
║  KEY INSIGHT:                                                             ║
║  Window is valid if: (windowLength - maxFreq) <= k                       ║
║  We need to replace (windowLength - maxFreq) characters                  ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public int characterReplacement(String s, int k) {
    int[] count = new int[26];
    int left = 0, maxFreq = 0, maxLen = 0;

    for (int right = 0; right < s.length(); right++) {
        count[s.charAt(right) - 'A']++;
        maxFreq = Math.max(maxFreq, count[s.charAt(right) - 'A']);

        // If replacements needed > k, shrink window
        while ((right - left + 1) - maxFreq > k) {
            count[s.charAt(left) - 'A']--;
            left++;
        }

        maxLen = Math.max(maxLen, right - left + 1);
    }
    return maxLen;
}
```

---

### Problem: Max Consecutive Ones III

**LeetCode 1004** | **Difficulty:** Medium
🔗 [https://leetcode.com/problems/max-consecutive-ones-iii/](https://leetcode.com/problems/max-consecutive-ones-iii/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  MAX CONSECUTIVE ONES III                                                 ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Binary array. Flip at most k 0's. Return max consecutive 1's.           ║
║                                                                           ║
║  Input: nums = [1,1,1,0,0,0,1,1,1,1,0], k = 2                            ║
║  Output: 6                                                                ║
║  Explanation: [1,1,1,0,0,1,1,1,1,1,1]                                    ║
║                        ↑ ↑ flipped                                       ║
║                                                                           ║
║  Visual:                                                                  ║
║  [1,1,1,0,0,0,1,1,1,1,0]                                                 ║
║           └─────────────┘ window with 2 zeros                            ║
║           flip 2 zeros = 6 ones                                          ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public int longestOnes(int[] nums, int k) {
    int left = 0, zeros = 0, maxLen = 0;

    for (int right = 0; right < nums.length; right++) {
        if (nums[right] == 0) zeros++;

        while (zeros > k) {
            if (nums[left] == 0) zeros--;
            left++;
        }

        maxLen = Math.max(maxLen, right - left + 1);
    }
    return maxLen;
}
```

---

## 4.3 SLIDING WINDOW - STRING MATCHING

### Problem: Permutation in String

**LeetCode 567** | **Difficulty:** Medium
🔗 [https://leetcode.com/problems/permutation-in-string/](https://leetcode.com/problems/permutation-in-string/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  PERMUTATION IN STRING                                                    ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Check if s2 contains any permutation of s1.                             ║
║                                                                           ║
║  Input: s1 = "ab", s2 = "eidbaooo"                                       ║
║  Output: true                                                             ║
║  Explanation: s2 contains "ba" which is permutation of "ab"              ║
║                                                                           ║
║  Input: s1 = "ab", s2 = "eidboaoo"                                       ║
║  Output: false                                                            ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public boolean checkInclusion(String s1, String s2) {
    if (s1.length() > s2.length()) return false;

    int[] s1Count = new int[26];
    int[] s2Count = new int[26];

    for (int i = 0; i < s1.length(); i++) {
        s1Count[s1.charAt(i) - 'a']++;
        s2Count[s2.charAt(i) - 'a']++;
    }

    if (Arrays.equals(s1Count, s2Count)) return true;

    for (int i = s1.length(); i < s2.length(); i++) {
        s2Count[s2.charAt(i) - 'a']++;
        s2Count[s2.charAt(i - s1.length()) - 'a']--;

        if (Arrays.equals(s1Count, s2Count)) return true;
    }
    return false;
}
```

---

### Problem: Minimum Window Substring

**LeetCode 76** | **Difficulty:** Hard
🔗 [https://leetcode.com/problems/minimum-window-substring/](https://leetcode.com/problems/minimum-window-substring/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  MINIMUM WINDOW SUBSTRING                                                 ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Find minimum window in s that contains all characters of t.             ║
║                                                                           ║
║  Input: s = "ADOBECODEBANC", t = "ABC"                                   ║
║  Output: "BANC"                                                           ║
║                                                                           ║
║  Visual:                                                                  ║
║  ADOBECODEBANC                                                           ║
║  A   ─┘    (has A, need B,C)                                             ║
║  ADOBEC    (has A,B,C - valid, len=6)                                    ║
║   DOBEC    (no A - invalid)                                              ║
║  ...                                                                     ║
║         BANC  (has A,B,C - valid, len=4) ← MIN                           ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public String minWindow(String s, String t) {
    if (s.length() < t.length()) return "";

    Map<Character, Integer> tCount = new HashMap<>();
    for (char c : t.toCharArray()) {
        tCount.merge(c, 1, Integer::sum);
    }

    int required = tCount.size();
    int formed = 0;
    Map<Character, Integer> windowCount = new HashMap<>();

    int left = 0, minLen = Integer.MAX_VALUE, minStart = 0;

    for (int right = 0; right < s.length(); right++) {
        char c = s.charAt(right);
        windowCount.merge(c, 1, Integer::sum);

        if (tCount.containsKey(c) &&
            windowCount.get(c).intValue() == tCount.get(c).intValue()) {
            formed++;
        }

        while (formed == required) {
            if (right - left + 1 < minLen) {
                minLen = right - left + 1;
                minStart = left;
            }

            char leftChar = s.charAt(left);
            windowCount.merge(leftChar, -1, Integer::sum);

            if (tCount.containsKey(leftChar) &&
                windowCount.get(leftChar) < tCount.get(leftChar)) {
                formed--;
            }
            left++;
        }
    }

    return minLen == Integer.MAX_VALUE ? "" : s.substring(minStart, minStart + minLen);
}
```

---

### 🔒 PREMIUM: Longest Substring with At Most Two Distinct Characters

**LeetCode 159** | **Difficulty:** Medium | **Premium Problem**

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  LONGEST SUBSTRING WITH AT MOST TWO DISTINCT CHARACTERS                   ║
║  (LeetCode 159 - Premium)                                                 ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Find length of longest substring with at most 2 distinct characters.    ║
║                                                                           ║
║  ─────────────────────────────────────────────────────────────────────   ║
║                                                                           ║
║  Example 1:                                                               ║
║  Input: s = "eceba"                                                       ║
║  Output: 3                                                                ║
║  Explanation: "ece" has 2 distinct characters                            ║
║                                                                           ║
║  Example 2:                                                               ║
║  Input: s = "ccaabbb"                                                    ║
║  Output: 5                                                                ║
║  Explanation: "aabbb" has 2 distinct characters                          ║
║                                                                           ║
║  ─────────────────────────────────────────────────────────────────────   ║
║                                                                           ║
║  Constraints:                                                             ║
║  - 1 <= s.length <= 10^5                                                 ║
║  - s consists of English letters                                         ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public int lengthOfLongestSubstringTwoDistinct(String s) {
    Map<Character, Integer> map = new HashMap<>();
    int left = 0, maxLen = 0;

    for (int right = 0; right < s.length(); right++) {
        map.merge(s.charAt(right), 1, Integer::sum);

        while (map.size() > 2) {
            char leftChar = s.charAt(left);
            map.merge(leftChar, -1, Integer::sum);
            if (map.get(leftChar) == 0) map.remove(leftChar);
            left++;
        }

        maxLen = Math.max(maxLen, right - left + 1);
    }
    return maxLen;
}
```

---

# SECTION 5: TWO POINTERS ADVANCED VARIANTS

---

## 5.1 OPPOSITE DIRECTION TWO POINTERS

### Problem: Two Sum II - Input Array Is Sorted

**LeetCode 167** | **Difficulty:** Medium
🔗 [https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/](https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  TWO SUM II - SORTED ARRAY                                                ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Array is SORTED. Find two numbers that add to target.                   ║
║  Return 1-indexed positions.                                             ║
║                                                                           ║
║  Input: numbers = [2, 7, 11, 15], target = 9                             ║
║  Output: [1, 2]                                                           ║
║                                                                           ║
║  Visual:                                                                  ║
║  [2,  7,  11,  15]                                                       ║
║   ↑            ↑                                                          ║
║   L            R   sum=17 > 9, move R left                               ║
║   ↑        ↑                                                              ║
║   L        R       sum=13 > 9, move R left                               ║
║   ↑    ↑                                                                  ║
║   L    R           sum=9 = target ✓                                      ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public int[] twoSum(int[] numbers, int target) {
    int left = 0, right = numbers.length - 1;

    while (left < right) {
        int sum = numbers[left] + numbers[right];
        if (sum == target) {
            return new int[]{left + 1, right + 1};  // 1-indexed
        } else if (sum < target) {
            left++;
        } else {
            right--;
        }
    }
    return new int[]{-1, -1};
}
```

---

### Problem: 3Sum

**LeetCode 15** | **Difficulty:** Medium
🔗 [https://leetcode.com/problems/3sum/](https://leetcode.com/problems/3sum/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  3SUM                                                                     ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Find all unique triplets that sum to zero.                              ║
║                                                                           ║
║  Input: nums = [-1, 0, 1, 2, -1, -4]                                     ║
║  Output: [[-1, -1, 2], [-1, 0, 1]]                                       ║
║                                                                           ║
║  Algorithm:                                                               ║
║  1. Sort the array                                                       ║
║  2. Fix one element, use two pointers for remaining                      ║
║  3. Skip duplicates to avoid duplicate triplets                          ║
║                                                                           ║
║  Sorted: [-4, -1, -1, 0, 1, 2]                                           ║
║           ↑   ↑            ↑                                              ║
║           i   L            R                                              ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public List<List<Integer>> threeSum(int[] nums) {
    List<List<Integer>> result = new ArrayList<>();
    Arrays.sort(nums);

    for (int i = 0; i < nums.length - 2; i++) {
        // Skip duplicates for i
        if (i > 0 && nums[i] == nums[i - 1]) continue;

        // Early termination: if smallest > 0, no solution possible
        if (nums[i] > 0) break;

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

---

### Problem: 3Sum Closest

**LeetCode 16** | **Difficulty:** Medium
🔗 [https://leetcode.com/problems/3sum-closest/](https://leetcode.com/problems/3sum-closest/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  3SUM CLOSEST                                                             ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Find three integers whose sum is closest to target.                     ║
║                                                                           ║
║  Input: nums = [-1, 2, 1, -4], target = 1                                ║
║  Output: 2                                                                ║
║  Explanation: (-1) + 2 + 1 = 2, closest to target 1                      ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public int threeSumClosest(int[] nums, int target) {
    Arrays.sort(nums);
    int closestSum = nums[0] + nums[1] + nums[2];

    for (int i = 0; i < nums.length - 2; i++) {
        int left = i + 1, right = nums.length - 1;

        while (left < right) {
            int sum = nums[i] + nums[left] + nums[right];

            if (Math.abs(sum - target) < Math.abs(closestSum - target)) {
                closestSum = sum;
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
    return closestSum;
}
```

---

### Problem: 4Sum

**LeetCode 18** | **Difficulty:** Medium
🔗 [https://leetcode.com/problems/4sum/](https://leetcode.com/problems/4sum/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  4SUM                                                                     ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Find all unique quadruplets that sum to target.                         ║
║                                                                           ║
║  Input: nums = [1, 0, -1, 0, -2, 2], target = 0                          ║
║  Output: [[-2,-1,1,2], [-2,0,0,2], [-1,0,0,1]]                           ║
║                                                                           ║
║  Pattern: Extend 3Sum with one more loop                                 ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public List<List<Integer>> fourSum(int[] nums, int target) {
    List<List<Integer>> result = new ArrayList<>();
    Arrays.sort(nums);
    int n = nums.length;

    for (int i = 0; i < n - 3; i++) {
        if (i > 0 && nums[i] == nums[i - 1]) continue;

        for (int j = i + 1; j < n - 2; j++) {
            if (j > i + 1 && nums[j] == nums[j - 1]) continue;

            int left = j + 1, right = n - 1;
            long targetSum = (long) target - nums[i] - nums[j];

            while (left < right) {
                int sum = nums[left] + nums[right];

                if (sum == targetSum) {
                    result.add(Arrays.asList(nums[i], nums[j], nums[left], nums[right]));

                    while (left < right && nums[left] == nums[left + 1]) left++;
                    while (left < right && nums[right] == nums[right - 1]) right--;

                    left++;
                    right--;
                } else if (sum < targetSum) {
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

---

### 🔒 PREMIUM: 3Sum Smaller

**LeetCode 259** | **Difficulty:** Medium | **Premium Problem**

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  3SUM SMALLER                                                             ║
║  (LeetCode 259 - Premium)                                                 ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Count triplets with sum LESS than target.                               ║
║                                                                           ║
║  ─────────────────────────────────────────────────────────────────────   ║
║                                                                           ║
║  Example 1:                                                               ║
║  Input: nums = [-2, 0, 1, 3], target = 2                                 ║
║  Output: 2                                                                ║
║  Explanation:                                                             ║
║  (-2) + 0 + 1 = -1 < 2 ✓                                                 ║
║  (-2) + 0 + 3 = 1 < 2 ✓                                                  ║
║  (-2) + 1 + 3 = 2, not < 2                                               ║
║  0 + 1 + 3 = 4, not < 2                                                  ║
║                                                                           ║
║  Example 2:                                                               ║
║  Input: nums = [], target = 0                                            ║
║  Output: 0                                                                ║
║                                                                           ║
║  Example 3:                                                               ║
║  Input: nums = [0], target = 0                                           ║
║  Output: 0                                                                ║
║                                                                           ║
║  ─────────────────────────────────────────────────────────────────────   ║
║                                                                           ║
║  KEY INSIGHT:                                                             ║
║  If nums[i] + nums[left] + nums[right] < target,                         ║
║  Then ALL pairs (left, left+1), (left, left+2)...(left, right) work!     ║
║  Count = right - left                                                    ║
║                                                                           ║
║  ─────────────────────────────────────────────────────────────────────   ║
║                                                                           ║
║  Constraints:                                                             ║
║  - n == nums.length                                                      ║
║  - 0 <= n <= 3500                                                        ║
║  - -100 <= nums[i] <= 100                                                ║
║  - -100 <= target <= 100                                                 ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public int threeSumSmaller(int[] nums, int target) {
    Arrays.sort(nums);
    int count = 0;

    for (int i = 0; i < nums.length - 2; i++) {
        int left = i + 1, right = nums.length - 1;

        while (left < right) {
            int sum = nums[i] + nums[left] + nums[right];

            if (sum < target) {
                // All pairs from left to right-1 also work!
                count += right - left;
                left++;
            } else {
                right--;
            }
        }
    }
    return count;
}
```

---

### Problem: Valid Triangle Number

**LeetCode 611** | **Difficulty:** Medium
🔗 [https://leetcode.com/problems/valid-triangle-number/](https://leetcode.com/problems/valid-triangle-number/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  VALID TRIANGLE NUMBER                                                    ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Count triplets that can form a valid triangle.                          ║
║  Triangle rule: sum of any two sides > third side                        ║
║                                                                           ║
║  Input: nums = [2, 2, 3, 4]                                              ║
║  Output: 3                                                                ║
║  Valid: (2,3,4), (2,3,4), (2,2,3)                                        ║
║                                                                           ║
║  KEY: After sorting, only need to check a + b > c                        ║
║  (other conditions automatically satisfied)                              ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public int triangleNumber(int[] nums) {
    Arrays.sort(nums);
    int count = 0;

    // Fix the largest side at index i
    for (int i = nums.length - 1; i >= 2; i--) {
        int left = 0, right = i - 1;

        while (left < right) {
            if (nums[left] + nums[right] > nums[i]) {
                // All pairs from left to right-1 work!
                count += right - left;
                right--;
            } else {
                left++;
            }
        }
    }
    return count;
}
```

---

## 5.2 SAME DIRECTION TWO POINTERS

### Problem: Remove Duplicates from Sorted Array

**LeetCode 26** | **Difficulty:** Easy
🔗 [https://leetcode.com/problems/remove-duplicates-from-sorted-array/](https://leetcode.com/problems/remove-duplicates-from-sorted-array/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  REMOVE DUPLICATES FROM SORTED ARRAY                                      ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Remove duplicates in-place. Return new length.                          ║
║                                                                           ║
║  Input: nums = [1, 1, 2]                                                 ║
║  Output: 2, nums = [1, 2, _]                                             ║
║                                                                           ║
║  Visual:                                                                  ║
║  [1, 1, 2]                                                               ║
║   ↑  ↑       slow=0, fast=1, same value, skip                            ║
║   ↑     ↑    slow=0, fast=2, different! copy                             ║
║      ↑  ↑    slow=1, nums[1]=2                                           ║
║  Result: [1, 2, _], length = 2                                           ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public int removeDuplicates(int[] nums) {
    if (nums.length == 0) return 0;

    int slow = 0;

    for (int fast = 1; fast < nums.length; fast++) {
        if (nums[fast] != nums[slow]) {
            slow++;
            nums[slow] = nums[fast];
        }
    }
    return slow + 1;
}
```

---

### Problem: Remove Duplicates from Sorted Array II

**LeetCode 80** | **Difficulty:** Medium
🔗 [https://leetcode.com/problems/remove-duplicates-from-sorted-array-ii/](https://leetcode.com/problems/remove-duplicates-from-sorted-array-ii/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  REMOVE DUPLICATES II (Allow at most 2 duplicates)                        ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Each element can appear at most TWICE.                                  ║
║                                                                           ║
║  Input: nums = [1, 1, 1, 2, 2, 3]                                        ║
║  Output: 5, nums = [1, 1, 2, 2, 3, _]                                    ║
║                                                                           ║
║  KEY: Compare with nums[slow - 2] instead of nums[slow - 1]              ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public int removeDuplicates(int[] nums) {
    if (nums.length <= 2) return nums.length;

    int slow = 2;  // First 2 elements are always valid

    for (int fast = 2; fast < nums.length; fast++) {
        if (nums[fast] != nums[slow - 2]) {
            nums[slow] = nums[fast];
            slow++;
        }
    }
    return slow;
}
```

---

### Problem: Remove Element

**LeetCode 27** | **Difficulty:** Easy
🔗 [https://leetcode.com/problems/remove-element/](https://leetcode.com/problems/remove-element/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  REMOVE ELEMENT                                                           ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Remove all instances of val in-place. Return new length.                ║
║                                                                           ║
║  Input: nums = [3, 2, 2, 3], val = 3                                     ║
║  Output: 2, nums = [2, 2, _, _]                                          ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public int removeElement(int[] nums, int val) {
    int slow = 0;

    for (int fast = 0; fast < nums.length; fast++) {
        if (nums[fast] != val) {
            nums[slow] = nums[fast];
            slow++;
        }
    }
    return slow;
}
```

---

### Problem: Sort Colors (Dutch National Flag)

**LeetCode 75** | **Difficulty:** Medium
🔗 [https://leetcode.com/problems/sort-colors/](https://leetcode.com/problems/sort-colors/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  SORT COLORS (Dutch National Flag Problem)                                ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Sort array with only 0s, 1s, and 2s in-place.                           ║
║  One-pass algorithm with constant space.                                 ║
║                                                                           ║
║  Input: nums = [2, 0, 2, 1, 1, 0]                                        ║
║  Output: [0, 0, 1, 1, 2, 2]                                              ║
║                                                                           ║
║  Three Pointers:                                                          ║
║  - low: boundary for 0s (everything before low is 0)                     ║
║  - mid: current element being examined                                   ║
║  - high: boundary for 2s (everything after high is 2)                    ║
║                                                                           ║
║  Visual:                                                                  ║
║  [0, 0, 0, | 1, 1, 1, | ?, ?, ? | 2, 2, 2]                               ║
║            ↑          ↑         ↑                                         ║
║           low        mid       high                                       ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
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
            // Don't increment mid! New element needs checking
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

### Problem: Partition Array According to Pivot

**LeetCode 2161** | **Difficulty:** Medium
🔗 [https://leetcode.com/problems/partition-array-according-to-given-pivot/](https://leetcode.com/problems/partition-array-according-to-given-pivot/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  PARTITION ARRAY ACCORDING TO PIVOT                                       ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Rearrange so elements < pivot come before, = pivot in middle,           ║
║  > pivot at end. Maintain relative order.                                ║
║                                                                           ║
║  Input: nums = [9, 12, 5, 10, 14, 3, 10], pivot = 10                     ║
║  Output: [9, 5, 3, 10, 10, 12, 14]                                       ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public int[] pivotArray(int[] nums, int pivot) {
    int[] result = new int[nums.length];
    int idx = 0;

    // First pass: elements < pivot
    for (int num : nums) {
        if (num < pivot) result[idx++] = num;
    }

    // Second pass: elements == pivot
    for (int num : nums) {
        if (num == pivot) result[idx++] = num;
    }

    // Third pass: elements > pivot
    for (int num : nums) {
        if (num > pivot) result[idx++] = num;
    }

    return result;
}
```

---

## 5.3 LINKED LIST TWO POINTERS

### Problem: Linked List Cycle

**LeetCode 141** | **Difficulty:** Easy
🔗 [https://leetcode.com/problems/linked-list-cycle/](https://leetcode.com/problems/linked-list-cycle/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  LINKED LIST CYCLE                                                        ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Detect if linked list has a cycle.                                      ║
║                                                                           ║
║  Visual (with cycle):                                                     ║
║  3 → 2 → 0 → -4                                                          ║
║      ↑__________|                                                         ║
║                                                                           ║
║  Floyd's Cycle Detection (Tortoise & Hare):                              ║
║  - Slow pointer moves 1 step                                             ║
║  - Fast pointer moves 2 steps                                            ║
║  - If they meet, there's a cycle                                         ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public boolean hasCycle(ListNode head) {
    if (head == null || head.next == null) return false;

    ListNode slow = head, fast = head;

    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;

        if (slow == fast) return true;
    }
    return false;
}
```

---

### Problem: Linked List Cycle II (Find Start of Cycle)

**LeetCode 142** | **Difficulty:** Medium
🔗 [https://leetcode.com/problems/linked-list-cycle-ii/](https://leetcode.com/problems/linked-list-cycle-ii/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  LINKED LIST CYCLE II - Find Start of Cycle                               ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Return the node where cycle begins. Return null if no cycle.            ║
║                                                                           ║
║  MATHEMATICAL PROOF:                                                      ║
║  Let:                                                                     ║
║  - Distance from head to cycle start = a                                 ║
║  - Distance from cycle start to meeting point = b                        ║
║  - Cycle length = c                                                      ║
║                                                                           ║
║  When they meet:                                                          ║
║  - Slow traveled: a + b                                                  ║
║  - Fast traveled: a + b + n*c (some multiple of cycle)                   ║
║  - Fast = 2 * Slow → a + b + n*c = 2(a + b)                              ║
║  - Therefore: a = n*c - b                                                ║
║                                                                           ║
║  After meeting: move one pointer to head, both move 1 step               ║
║  They'll meet at cycle start!                                            ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public ListNode detectCycle(ListNode head) {
    if (head == null || head.next == null) return null;

    ListNode slow = head, fast = head;

    // Find meeting point
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;

        if (slow == fast) {
            // Reset slow to head
            slow = head;

            // Both move 1 step until they meet at cycle start
            while (slow != fast) {
                slow = slow.next;
                fast = fast.next;
            }
            return slow;
        }
    }
    return null;
}
```

---

### Problem: Middle of the Linked List

**LeetCode 876** | **Difficulty:** Easy
🔗 [https://leetcode.com/problems/middle-of-the-linked-list/](https://leetcode.com/problems/middle-of-the-linked-list/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  MIDDLE OF LINKED LIST                                                    ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  When fast reaches end, slow is at middle.                               ║
║  For even length, return second middle.                                  ║
║                                                                           ║
║  Odd:  1 → 2 → 3 → 4 → 5    Middle = 3                                  ║
║  Even: 1 → 2 → 3 → 4 → 5 → 6    Middle = 4 (second)                      ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public ListNode middleNode(ListNode head) {
    ListNode slow = head, fast = head;

    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
    }
    return slow;
}
```

---

### Problem: Remove Nth Node From End

**LeetCode 19** | **Difficulty:** Medium
🔗 [https://leetcode.com/problems/remove-nth-node-from-end-of-list/](https://leetcode.com/problems/remove-nth-node-from-end-of-list/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  REMOVE NTH NODE FROM END                                                 ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Remove the nth node from end of list.                                   ║
║                                                                           ║
║  Input: 1 → 2 → 3 → 4 → 5, n = 2                                        ║
║  Output: 1 → 2 → 3 → 5                                                   ║
║                                                                           ║
║  Technique: Advance fast pointer n steps first                           ║
║  Then move both until fast reaches end                                   ║
║  Slow will be at (n+1)th from end                                        ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public ListNode removeNthFromEnd(ListNode head, int n) {
    ListNode dummy = new ListNode(0);
    dummy.next = head;

    ListNode fast = dummy, slow = dummy;

    // Move fast n+1 steps ahead
    for (int i = 0; i <= n; i++) {
        fast = fast.next;
    }

    // Move both until fast is null
    while (fast != null) {
        fast = fast.next;
        slow = slow.next;
    }

    // Skip the nth node
    slow.next = slow.next.next;

    return dummy.next;
}
```

---

### 🔒 PREMIUM: Plus One Linked List

**LeetCode 369** | **Difficulty:** Medium | **Premium Problem**

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  PLUS ONE LINKED LIST                                                     ║
║  (LeetCode 369 - Premium)                                                 ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Linked list represents a number. Add 1 to it.                           ║
║  Most significant digit is at head.                                      ║
║                                                                           ║
║  ─────────────────────────────────────────────────────────────────────   ║
║                                                                           ║
║  Example 1:                                                               ║
║  Input: 1 → 2 → 3                                                        ║
║  Output: 1 → 2 → 4                                                       ║
║  Explanation: 123 + 1 = 124                                              ║
║                                                                           ║
║  Example 2:                                                               ║
║  Input: 1 → 2 → 9                                                        ║
║  Output: 1 → 3 → 0                                                       ║
║  Explanation: 129 + 1 = 130                                              ║
║                                                                           ║
║  Example 3:                                                               ║
║  Input: 9 → 9 → 9                                                        ║
║  Output: 1 → 0 → 0 → 0                                                   ║
║  Explanation: 999 + 1 = 1000                                             ║
║                                                                           ║
║  ─────────────────────────────────────────────────────────────────────   ║
║                                                                           ║
║  KEY INSIGHT: Find rightmost non-9 digit                                 ║
║  - Increment it                                                          ║
║  - Set all following 9s to 0                                             ║
║                                                                           ║
║  ─────────────────────────────────────────────────────────────────────   ║
║                                                                           ║
║  Constraints:                                                             ║
║  - Number of nodes: [1, 100]                                             ║
║  - 0 <= Node.val <= 9                                                    ║
║  - Number doesn't have leading zeros except 0 itself                     ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public ListNode plusOne(ListNode head) {
    // Add sentinel node for case like 999 → 1000
    ListNode sentinel = new ListNode(0);
    sentinel.next = head;

    // Find rightmost non-9 digit
    ListNode notNine = sentinel;
    ListNode curr = head;

    while (curr != null) {
        if (curr.val != 9) {
            notNine = curr;
        }
        curr = curr.next;
    }

    // Increment rightmost non-9
    notNine.val++;

    // Set all following 9s to 0
    curr = notNine.next;
    while (curr != null) {
        curr.val = 0;
        curr = curr.next;
    }

    // Return head or sentinel if we added new digit
    return sentinel.val == 1 ? sentinel : head;
}
```

---

# SECTION 6: BINARY SEARCH PATTERNS

---

## 6.1 BASIC BINARY SEARCH

### Problem: Binary Search

**LeetCode 704** | **Difficulty:** Easy
🔗 [https://leetcode.com/problems/binary-search/](https://leetcode.com/problems/binary-search/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  BINARY SEARCH - THE FOUNDATION                                           ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Search for target in sorted array. Return index or -1.                  ║
║                                                                           ║
║  Input: nums = [-1, 0, 3, 5, 9, 12], target = 9                          ║
║  Output: 4                                                                ║
║                                                                           ║
║  Visual:                                                                  ║
║  [-1, 0, 3, 5, 9, 12]                                                    ║
║        L     M      R     mid=5 < 9, search right                        ║
║              L  M   R     mid=9 = target ✓                               ║
║                                                                           ║
║  Template:                                                                ║
║  while (left <= right)                                                   ║
║      mid = left + (right - left) / 2                                     ║
║      if target found: return mid                                         ║
║      if target > mid: left = mid + 1                                     ║
║      else: right = mid - 1                                               ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public int search(int[] nums, int target) {
    int left = 0, right = nums.length - 1;

    while (left <= right) {
        int mid = left + (right - left) / 2;  // Avoid overflow

        if (nums[mid] == target) {
            return mid;
        } else if (nums[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    return -1;
}
```

---

### Problem: Search Insert Position

**LeetCode 35** | **Difficulty:** Easy
🔗 [https://leetcode.com/problems/search-insert-position/](https://leetcode.com/problems/search-insert-position/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  SEARCH INSERT POSITION                                                   ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Find index where target should be inserted to keep array sorted.        ║
║                                                                           ║
║  Input: nums = [1, 3, 5, 6], target = 5                                  ║
║  Output: 2                                                                ║
║                                                                           ║
║  Input: nums = [1, 3, 5, 6], target = 2                                  ║
║  Output: 1                                                                ║
║                                                                           ║
║  Input: nums = [1, 3, 5, 6], target = 7                                  ║
║  Output: 4                                                                ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public int searchInsert(int[] nums, int target) {
    int left = 0, right = nums.length - 1;

    while (left <= right) {
        int mid = left + (right - left) / 2;

        if (nums[mid] == target) {
            return mid;
        } else if (nums[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    return left;  // Insert position
}
```

---

### Problem: First Bad Version

**LeetCode 278** | **Difficulty:** Easy
🔗 [https://leetcode.com/problems/first-bad-version/](https://leetcode.com/problems/first-bad-version/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  FIRST BAD VERSION                                                        ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Versions 1, 2, ..., n. One is bad. All after it are bad too.           ║
║  Find the first bad version.                                             ║
║                                                                           ║
║  Input: n = 5, bad = 4                                                   ║
║  Versions: [G, G, G, B, B]                                               ║
║             1  2  3  4  5                                                 ║
║  Output: 4                                                                ║
║                                                                           ║
║  Pattern: Find leftmost true (first bad)                                 ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public int firstBadVersion(int n) {
    int left = 1, right = n;

    while (left < right) {
        int mid = left + (right - left) / 2;

        if (isBadVersion(mid)) {
            right = mid;  // Could be answer, don't exclude
        } else {
            left = mid + 1;  // Not bad, search right
        }
    }
    return left;
}
```

---

## 6.2 FIND BOUNDARIES

### Problem: Find First and Last Position

**LeetCode 34** | **Difficulty:** Medium
🔗 [https://leetcode.com/problems/find-first-and-last-position-of-element-in-sorted-array/](https://leetcode.com/problems/find-first-and-last-position-of-element-in-sorted-array/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  FIND FIRST AND LAST POSITION                                             ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Find starting and ending position of target in sorted array.            ║
║                                                                           ║
║  Input: nums = [5, 7, 7, 8, 8, 10], target = 8                           ║
║  Output: [3, 4]                                                           ║
║                                                                           ║
║  Input: nums = [5, 7, 7, 8, 8, 10], target = 6                           ║
║  Output: [-1, -1]                                                         ║
║                                                                           ║
║  Two binary searches: Find leftmost, find rightmost                      ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public int[] searchRange(int[] nums, int target) {
    int[] result = {-1, -1};
    if (nums.length == 0) return result;

    // Find leftmost (first occurrence)
    result[0] = findFirst(nums, target);
    if (result[0] == -1) return result;

    // Find rightmost (last occurrence)
    result[1] = findLast(nums, target);

    return result;
}

private int findFirst(int[] nums, int target) {
    int left = 0, right = nums.length - 1;

    while (left < right) {
        int mid = left + (right - left) / 2;

        if (nums[mid] < target) {
            left = mid + 1;
        } else {
            right = mid;  // Keep searching left
        }
    }
    return nums[left] == target ? left : -1;
}

private int findLast(int[] nums, int target) {
    int left = 0, right = nums.length - 1;

    while (left < right) {
        int mid = left + (right - left + 1) / 2;  // Bias right

        if (nums[mid] > target) {
            right = mid - 1;
        } else {
            left = mid;  // Keep searching right
        }
    }
    return nums[left] == target ? left : -1;
}
```

---

### 🔒 PREMIUM: Find Smallest Letter Greater Than Target

**LeetCode 744** | **Difficulty:** Easy
🔗 [https://leetcode.com/problems/find-smallest-letter-greater-than-target/](https://leetcode.com/problems/find-smallest-letter-greater-than-target/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  FIND SMALLEST LETTER GREATER THAN TARGET                                 ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Sorted array of letters. Find smallest letter GREATER than target.      ║
║  Letters wrap around (if none greater, return first letter).             ║
║                                                                           ║
║  Input: letters = ["c","f","j"], target = "a"                            ║
║  Output: "c"                                                              ║
║                                                                           ║
║  Input: letters = ["c","f","j"], target = "c"                            ║
║  Output: "f"                                                              ║
║                                                                           ║
║  Input: letters = ["c","f","j"], target = "k"                            ║
║  Output: "c" (wrap around)                                               ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

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
    return letters[left % letters.length];  // Wrap around
}
```

---

## 6.3 ROTATED SORTED ARRAY

### Problem: Search in Rotated Sorted Array

**LeetCode 33** | **Difficulty:** Medium
🔗 [https://leetcode.com/problems/search-in-rotated-sorted-array/](https://leetcode.com/problems/search-in-rotated-sorted-array/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  SEARCH IN ROTATED SORTED ARRAY                                           ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Array was sorted then rotated at unknown pivot.                         ║
║  No duplicates. Search for target.                                       ║
║                                                                           ║
║  Input: nums = [4, 5, 6, 7, 0, 1, 2], target = 0                         ║
║  Output: 4                                                                ║
║                                                                           ║
║  Visual:                                                                  ║
║  Original: [0, 1, 2, 4, 5, 6, 7]                                         ║
║  Rotated:  [4, 5, 6, 7, 0, 1, 2]                                         ║
║             ↑        ↑                                                    ║
║           sorted   sorted                                                ║
║                                                                           ║
║  KEY: One half is ALWAYS sorted                                          ║
║  Check if target is in sorted half, then decide direction                ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public int search(int[] nums, int target) {
    int left = 0, right = nums.length - 1;

    while (left <= right) {
        int mid = left + (right - left) / 2;

        if (nums[mid] == target) return mid;

        // Check which half is sorted
        if (nums[left] <= nums[mid]) {
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
    return -1;
}
```

---

### Problem: Search in Rotated Sorted Array II (With Duplicates)

**LeetCode 81** | **Difficulty:** Medium
🔗 [https://leetcode.com/problems/search-in-rotated-sorted-array-ii/](https://leetcode.com/problems/search-in-rotated-sorted-array-ii/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  SEARCH IN ROTATED SORTED ARRAY II (WITH DUPLICATES)                      ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Same as above but array may have duplicates.                            ║
║                                                                           ║
║  Input: nums = [2, 5, 6, 0, 0, 1, 2], target = 0                         ║
║  Output: true                                                             ║
║                                                                           ║
║  EDGE CASE: nums[left] == nums[mid] == nums[right]                       ║
║  Example: [1, 0, 1, 1, 1] - can't determine which half is sorted         ║
║  Solution: Skip duplicates by left++, right--                            ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public boolean search(int[] nums, int target) {
    int left = 0, right = nums.length - 1;

    while (left <= right) {
        int mid = left + (right - left) / 2;

        if (nums[mid] == target) return true;

        // Handle duplicates
        if (nums[left] == nums[mid] && nums[mid] == nums[right]) {
            left++;
            right--;
        } else if (nums[left] <= nums[mid]) {
            // Left half sorted
            if (target >= nums[left] && target < nums[mid]) {
                right = mid - 1;
            } else {
                left = mid + 1;
            }
        } else {
            // Right half sorted
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

---

### Problem: Find Minimum in Rotated Sorted Array

**LeetCode 153** | **Difficulty:** Medium
🔗 [https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/](https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  FIND MINIMUM IN ROTATED SORTED ARRAY                                     ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Find minimum element in rotated sorted array (no duplicates).           ║
║                                                                           ║
║  Input: nums = [3, 4, 5, 1, 2]                                           ║
║  Output: 1                                                                ║
║                                                                           ║
║  Visual:                                                                  ║
║       5                                                                   ║
║    4     ╲                                                                ║
║ 3           ╲                                                             ║
║               2                                                           ║
║             1   ← minimum                                                 ║
║                                                                           ║
║  KEY: Compare mid with right                                             ║
║  - If mid > right: min is in right half                                  ║
║  - If mid < right: min is in left half (including mid)                   ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public int findMin(int[] nums) {
    int left = 0, right = nums.length - 1;

    while (left < right) {
        int mid = left + (right - left) / 2;

        if (nums[mid] > nums[right]) {
            // Min is in right half
            left = mid + 1;
        } else {
            // Min is in left half (including mid)
            right = mid;
        }
    }
    return nums[left];
}
```

---

## 6.4 BINARY SEARCH ON ANSWER

### Problem: Sqrt(x)

**LeetCode 69** | **Difficulty:** Easy
🔗 [https://leetcode.com/problems/sqrtx/](https://leetcode.com/problems/sqrtx/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  SQRT(X) - Binary Search on Answer                                        ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Find integer square root (truncate decimals).                           ║
║                                                                           ║
║  Input: x = 8                                                             ║
║  Output: 2 (√8 = 2.828..., truncated to 2)                               ║
║                                                                           ║
║  Binary search range: [1, x]                                             ║
║  Find largest n where n*n <= x                                           ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public int mySqrt(int x) {
    if (x < 2) return x;

    long left = 1, right = x / 2;

    while (left <= right) {
        long mid = left + (right - left) / 2;
        long square = mid * mid;

        if (square == x) {
            return (int) mid;
        } else if (square < x) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    return (int) right;
}
```

---

### Problem: Koko Eating Bananas

**LeetCode 875** | **Difficulty:** Medium
🔗 [https://leetcode.com/problems/koko-eating-bananas/](https://leetcode.com/problems/koko-eating-bananas/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  KOKO EATING BANANAS                                                      ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Koko eats k bananas/hour. Guard returns in h hours.                     ║
║  Find minimum k to eat all bananas before guard returns.                 ║
║                                                                           ║
║  Input: piles = [3, 6, 7, 11], h = 8                                     ║
║  Output: 4                                                                ║
║  Explanation: At k=4, time needed:                                       ║
║  pile 3: ceil(3/4) = 1 hour                                              ║
║  pile 6: ceil(6/4) = 2 hours                                             ║
║  pile 7: ceil(7/4) = 2 hours                                             ║
║  pile 11: ceil(11/4) = 3 hours                                           ║
║  Total: 8 hours ≤ 8 ✓                                                    ║
║                                                                           ║
║  Binary search on k: range [1, max(piles)]                               ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public int minEatingSpeed(int[] piles, int h) {
    int left = 1;
    int right = Arrays.stream(piles).max().getAsInt();

    while (left < right) {
        int mid = left + (right - left) / 2;

        if (canFinish(piles, h, mid)) {
            right = mid;  // Try slower speed
        } else {
            left = mid + 1;  // Need faster speed
        }
    }
    return left;
}

private boolean canFinish(int[] piles, int h, int k) {
    int hours = 0;
    for (int pile : piles) {
        hours += (pile + k - 1) / k;  // Ceiling division
    }
    return hours <= h;
}
```

---

### Problem: Capacity To Ship Packages Within D Days

**LeetCode 1011** | **Difficulty:** Medium
🔗 [https://leetcode.com/problems/capacity-to-ship-packages-within-d-days/](https://leetcode.com/problems/capacity-to-ship-packages-within-d-days/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  CAPACITY TO SHIP PACKAGES                                                ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Find minimum ship capacity to ship all packages in days days.           ║
║  Packages must be shipped IN ORDER.                                      ║
║                                                                           ║
║  Input: weights = [1,2,3,4,5,6,7,8,9,10], days = 5                       ║
║  Output: 15                                                               ║
║  Explanation:                                                             ║
║  Day 1: 1,2,3,4,5 (sum=15)                                               ║
║  Day 2: 6,7 (sum=13)                                                     ║
║  Day 3: 8 (sum=8)                                                        ║
║  Day 4: 9 (sum=9)                                                        ║
║  Day 5: 10 (sum=10)                                                      ║
║                                                                           ║
║  Binary search on capacity: [max(weights), sum(weights)]                 ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public int shipWithinDays(int[] weights, int days) {
    int left = Arrays.stream(weights).max().getAsInt();
    int right = Arrays.stream(weights).sum();

    while (left < right) {
        int mid = left + (right - left) / 2;

        if (canShip(weights, days, mid)) {
            right = mid;
        } else {
            left = mid + 1;
        }
    }
    return left;
}

private boolean canShip(int[] weights, int days, int capacity) {
    int daysNeeded = 1;
    int currentLoad = 0;

    for (int weight : weights) {
        if (currentLoad + weight > capacity) {
            daysNeeded++;
            currentLoad = weight;
        } else {
            currentLoad += weight;
        }
    }
    return daysNeeded <= days;
}
```

---

### Problem: Split Array Largest Sum

**LeetCode 410** | **Difficulty:** Hard
🔗 [https://leetcode.com/problems/split-array-largest-sum/](https://leetcode.com/problems/split-array-largest-sum/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  SPLIT ARRAY LARGEST SUM                                                  ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Split array into k subarrays. Minimize the largest subarray sum.        ║
║                                                                           ║
║  Input: nums = [7,2,5,10,8], k = 2                                       ║
║  Output: 18                                                               ║
║  Explanation:                                                             ║
║  Split: [7,2,5] and [10,8]                                               ║
║  Sums: 14 and 18                                                         ║
║  Largest sum = 18 (minimized)                                            ║
║                                                                           ║
║  Binary search on max sum allowed                                        ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public int splitArray(int[] nums, int k) {
    int left = Arrays.stream(nums).max().getAsInt();
    int right = Arrays.stream(nums).sum();

    while (left < right) {
        int mid = left + (right - left) / 2;

        if (canSplit(nums, k, mid)) {
            right = mid;
        } else {
            left = mid + 1;
        }
    }
    return left;
}

private boolean canSplit(int[] nums, int k, int maxSum) {
    int splits = 1;
    int currentSum = 0;

    for (int num : nums) {
        if (currentSum + num > maxSum) {
            splits++;
            currentSum = num;
        } else {
            currentSum += num;
        }
    }
    return splits <= k;
}
```

---

### 🔒 PREMIUM: Find K-th Smallest Pair Distance

**LeetCode 719** | **Difficulty:** Hard | **Premium-Level**

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  FIND K-TH SMALLEST PAIR DISTANCE                                         ║
║  (LeetCode 719 - Hard)                                                    ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Given array nums, define distance between pair (i,j) as |nums[i]-nums[j]║
║  Find the k-th smallest distance among all pairs.                        ║
║                                                                           ║
║  ─────────────────────────────────────────────────────────────────────   ║
║                                                                           ║
║  Example 1:                                                               ║
║  Input: nums = [1, 3, 1], k = 1                                          ║
║  Output: 0                                                                ║
║  Explanation:                                                             ║
║  All distances: (1,3)=2, (1,1)=0, (3,1)=2                                ║
║  Sorted: [0, 2, 2]                                                       ║
║  1st smallest = 0                                                        ║
║                                                                           ║
║  Example 2:                                                               ║
║  Input: nums = [1, 1, 1], k = 2                                          ║
║  Output: 0                                                                ║
║                                                                           ║
║  Example 3:                                                               ║
║  Input: nums = [1, 6, 1], k = 3                                          ║
║  Output: 5                                                                ║
║                                                                           ║
║  ─────────────────────────────────────────────────────────────────────   ║
║                                                                           ║
║  APPROACH: Binary search on distance + count pairs with dist <= mid      ║
║                                                                           ║
║  ─────────────────────────────────────────────────────────────────────   ║
║                                                                           ║
║  Constraints:                                                             ║
║  - n == nums.length                                                      ║
║  - 2 <= n <= 10^4                                                        ║
║  - 0 <= nums[i] <= 10^6                                                  ║
║  - 1 <= k <= n * (n - 1) / 2                                             ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public int smallestDistancePair(int[] nums, int k) {
    Arrays.sort(nums);
    int n = nums.length;

    int left = 0;
    int right = nums[n - 1] - nums[0];

    while (left < right) {
        int mid = left + (right - left) / 2;

        if (countPairs(nums, mid) >= k) {
            right = mid;
        } else {
            left = mid + 1;
        }
    }
    return left;
}

// Count pairs with distance <= maxDist
private int countPairs(int[] nums, int maxDist) {
    int count = 0;
    int left = 0;

    for (int right = 0; right < nums.length; right++) {
        while (nums[right] - nums[left] > maxDist) {
            left++;
        }
        count += right - left;
    }
    return count;
}
```

---

# 📚 SECTION 7: STACK & QUEUE PROBLEMS

```
┌─────────────────────────────────────────────────────────────────┐
│                    STACK & QUEUE PATTERNS                       │
├─────────────────────────────────────────────────────────────────┤
│  STACK (LIFO):                   QUEUE (FIFO):                  │
│  ┌───┐                           ┌───┬───┬───┬───┐              │
│  │ 3 │ ← top (push/pop)          │ 1 │ 2 │ 3 │ 4 │              │
│  ├───┤                           └───┴───┴───┴───┘              │
│  │ 2 │                             ↑           ↑                │
│  ├───┤                           front       rear               │
│  │ 1 │                         (dequeue)   (enqueue)            │
│  └───┘                                                          │
│                                                                 │
│  MONOTONIC STACK:                MONOTONIC QUEUE:               │
│  [1, 3, 5] ← Increasing          Deque: front ↔ rear            │
│  [5, 3, 1] ← Decreasing          Used for sliding window max    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7.1 Basic Stack Problems

### Problem 78: Valid Parentheses

**LeetCode 20** 🔗 https://leetcode.com/problems/valid-parentheses/

```
┌────────────────────────────────────────────────────────────────┐
│  VALID PARENTHESES - Check if brackets are balanced            │
├────────────────────────────────────────────────────────────────┤
│  Input: "({[]})"                                               │
│                                                                │
│  Processing with Stack:                                        │
│  ┌───────┬─────────┬───────────────┐                           │
│  │ Char  │ Action  │ Stack State   │                           │
│  ├───────┼─────────┼───────────────┤                           │
│  │   (   │  push ) │ [)]           │                           │
│  │   {   │  push } │ [), }]        │                           │
│  │   [   │  push ] │ [), }, ]]     │                           │
│  │   ]   │  pop    │ [), }]  ✓    │                           │
│  │   }   │  pop    │ [)]      ✓   │                           │
│  │   )   │  pop    │ []       ✓   │                           │
│  └───────┴─────────┴───────────────┘                           │
│                                                                │
│  Stack empty at end → Valid! ✓                                 │
└────────────────────────────────────────────────────────────────┘
```

**Examples:**

- Input: `"()"` → Output: `true`
- Input: `"()[]{}"` → Output: `true`
- Input: `"(]"` → Output: `false`

**Constraints:**

- 1 <= s.length <= 10⁴
- s consists of parentheses only '()[]{}'

**Solution:**

```java
public boolean isValid(String s) {
    Stack<Character> stack = new Stack<>();

    for (char c : s.toCharArray()) {
        // Push expected closing bracket
        if (c == '(') stack.push(')');
        else if (c == '{') stack.push('}');
        else if (c == '[') stack.push(']');
        // Check closing bracket
        else if (stack.isEmpty() || stack.pop() != c) {
            return false;
        }
    }

    return stack.isEmpty();
}
```

---

### Problem 79: Min Stack

**LeetCode 155** 🔗 https://leetcode.com/problems/min-stack/

```
┌────────────────────────────────────────────────────────────────┐
│  MIN STACK - Stack that supports getMin() in O(1)              │
├────────────────────────────────────────────────────────────────┤
│  Operations: push(5), push(2), push(7), push(1)                │
│                                                                │
│  Approach 1: Two Stacks                                        │
│  ┌─────────────┬──────────────┐                                │
│  │ Main Stack  │  Min Stack   │                                │
│  ├─────────────┼──────────────┤                                │
│  │     1       │      1       │ ← top                          │
│  │     7       │      2       │                                │
│  │     2       │      2       │                                │
│  │     5       │      5       │                                │
│  └─────────────┴──────────────┘                                │
│                                                                │
│  getMin() → peek min stack → 1                                 │
│                                                                │
│  Approach 2: Single Stack with Pairs                           │
│  Stack: [(5,5), (2,2), (7,2), (1,1)]                           │
│          (val, minSoFar)                                       │
└────────────────────────────────────────────────────────────────┘
```

**Operations:**

- `push(val)` - Push element onto stack
- `pop()` - Remove top element
- `top()` - Get top element
- `getMin()` - Retrieve minimum element in O(1)

**Solution:**

```java
class MinStack {
    private Stack<int[]> stack;  // [value, currentMin]

    public MinStack() {
        stack = new Stack<>();
    }

    public void push(int val) {
        int currentMin = stack.isEmpty() ? val : Math.min(val, stack.peek()[1]);
        stack.push(new int[]{val, currentMin});
    }

    public void pop() {
        stack.pop();
    }

    public int top() {
        return stack.peek()[0];
    }

    public int getMin() {
        return stack.peek()[1];
    }
}
```

---

### Problem 80: 🔒 Max Stack (LeetCode 716 - Premium)

```
┌────────────────────────────────────────────────────────────────┐
│  MAX STACK - Stack with popMax() operation                     │
├────────────────────────────────────────────────────────────────┤
│  Design a max stack that supports:                             │
│  - push(x): Push x onto stack                                  │
│  - pop(): Remove top element                                   │
│  - top(): Get top element                                      │
│  - peekMax(): Retrieve maximum element                         │
│  - popMax(): Remove maximum element (topmost if tie)           │
│                                                                │
│  Example:                                                      │
│  MaxStack stack = new MaxStack();                              │
│  stack.push(5);   // Stack: [5]                                │
│  stack.push(1);   // Stack: [5, 1]                             │
│  stack.push(5);   // Stack: [5, 1, 5]                          │
│  stack.top();     // Returns 5                                 │
│  stack.popMax();  // Returns 5, Stack: [5, 1]                  │
│  stack.top();     // Returns 1                                 │
│  stack.peekMax(); // Returns 5                                 │
│  stack.pop();     // Returns 1, Stack: [5]                     │
│  stack.top();     // Returns 5                                 │
│                                                                │
│  Constraints:                                                  │
│  - -10^7 <= x <= 10^7                                          │
│  - At most 10^4 operations                                     │
│  - popMax and pop called only when stack not empty             │
└────────────────────────────────────────────────────────────────┘
```

**Solution (Using TreeMap + Doubly Linked List for O(log n)):**

```java
class MaxStack {
    private TreeMap<Integer, List<Node>> map;
    private DoublyLinkedList dll;

    class Node {
        int val;
        Node prev, next;
        Node(int val) { this.val = val; }
    }

    class DoublyLinkedList {
        Node head, tail;

        DoublyLinkedList() {
            head = new Node(0);
            tail = new Node(0);
            head.next = tail;
            tail.prev = head;
        }

        Node addLast(int val) {
            Node node = new Node(val);
            node.prev = tail.prev;
            node.next = tail;
            tail.prev.next = node;
            tail.prev = node;
            return node;
        }

        void remove(Node node) {
            node.prev.next = node.next;
            node.next.prev = node.prev;
        }

        Node getLast() {
            return tail.prev;
        }
    }

    public MaxStack() {
        map = new TreeMap<>();
        dll = new DoublyLinkedList();
    }

    public void push(int x) {
        Node node = dll.addLast(x);
        map.computeIfAbsent(x, k -> new ArrayList<>()).add(node);
    }

    public int pop() {
        Node node = dll.getLast();
        dll.remove(node);
        List<Node> list = map.get(node.val);
        list.remove(list.size() - 1);
        if (list.isEmpty()) map.remove(node.val);
        return node.val;
    }

    public int top() {
        return dll.getLast().val;
    }

    public int peekMax() {
        return map.lastKey();
    }

    public int popMax() {
        int maxVal = map.lastKey();
        List<Node> list = map.get(maxVal);
        Node node = list.remove(list.size() - 1);
        dll.remove(node);
        if (list.isEmpty()) map.remove(maxVal);
        return maxVal;
    }
}
```

---

### Problem 81: Decode String

**LeetCode 394** 🔗 https://leetcode.com/problems/decode-string/

```
┌────────────────────────────────────────────────────────────────┐
│  DECODE STRING - Expand encoded string                         │
├────────────────────────────────────────────────────────────────┤
│  Input: "3[a2[c]]"                                             │
│                                                                │
│  Process with Stack:                                           │
│  ┌──────┬────────────┬───────────────────────────────────────┐ │
│  │ Char │  Action    │  Stack / Result                       │ │
│  ├──────┼────────────┼───────────────────────────────────────┤ │
│  │  3   │ build num  │ num=3                                 │ │
│  │  [   │ push       │ [(3, "")]                             │ │
│  │  a   │ build str  │ currentStr="a"                        │ │
│  │  2   │ build num  │ num=2                                 │ │
│  │  [   │ push       │ [(3,""), (2,"a")]                     │ │
│  │  c   │ build str  │ currentStr="c"                        │ │
│  │  ]   │ pop & rep  │ [(3,"")] → "a" + "cc" = "acc"         │ │
│  │  ]   │ pop & rep  │ [] → "" + "accaccacc"                 │ │
│  └──────┴────────────┴───────────────────────────────────────┘ │
│                                                                │
│  Output: "accaccacc"                                           │
└────────────────────────────────────────────────────────────────┘
```

**Examples:**

- Input: `"3[a]2[bc]"` → Output: `"aaabcbc"`
- Input: `"3[a2[c]]"` → Output: `"accaccacc"`
- Input: `"2[abc]3[cd]ef"` → Output: `"abcabccdcdcdef"`

**Solution:**

```java
public String decodeString(String s) {
    Stack<Integer> countStack = new Stack<>();
    Stack<StringBuilder> stringStack = new Stack<>();
    StringBuilder current = new StringBuilder();
    int num = 0;

    for (char c : s.toCharArray()) {
        if (Character.isDigit(c)) {
            num = num * 10 + (c - '0');
        } else if (c == '[') {
            countStack.push(num);
            stringStack.push(current);
            current = new StringBuilder();
            num = 0;
        } else if (c == ']') {
            int repeatTimes = countStack.pop();
            StringBuilder prev = stringStack.pop();
            for (int i = 0; i < repeatTimes; i++) {
                prev.append(current);
            }
            current = prev;
        } else {
            current.append(c);
        }
    }

    return current.toString();
}
```

---

### Problem 82: Evaluate Reverse Polish Notation

**LeetCode 150** 🔗 https://leetcode.com/problems/evaluate-reverse-polish-notation/

```
┌────────────────────────────────────────────────────────────────┐
│  REVERSE POLISH NOTATION (Postfix Expression)                  │
├────────────────────────────────────────────────────────────────┤
│  Input: ["2","1","+","3","*"]                                  │
│                                                                │
│  Infix equivalent: ((2 + 1) * 3) = 9                           │
│                                                                │
│  Stack Processing:                                             │
│  ┌────────┬──────────────────┬─────────────┐                   │
│  │ Token  │ Action           │ Stack       │                   │
│  ├────────┼──────────────────┼─────────────┤                   │
│  │   2    │ push             │ [2]         │                   │
│  │   1    │ push             │ [2, 1]      │                   │
│  │   +    │ pop 1,2 → 2+1=3  │ [3]         │                   │
│  │   3    │ push             │ [3, 3]      │                   │
│  │   *    │ pop 3,3 → 3*3=9  │ [9]         │                   │
│  └────────┴──────────────────┴─────────────┘                   │
│                                                                │
│  Result: 9                                                     │
└────────────────────────────────────────────────────────────────┘
```

**Examples:**

- Input: `["2","1","+","3","*"]` → Output: `9` (((2+1)\*3))
- Input: `["4","13","5","/","+"]` → Output: `6` ((4+(13/5)))
- Input: `["10","6","9","3","+","-11","*","/","*","17","+","5","+"]` → Output: `22`

**Solution:**

```java
public int evalRPN(String[] tokens) {
    Stack<Integer> stack = new Stack<>();

    for (String token : tokens) {
        if ("+-*/".contains(token)) {
            int b = stack.pop();
            int a = stack.pop();

            switch (token) {
                case "+": stack.push(a + b); break;
                case "-": stack.push(a - b); break;
                case "*": stack.push(a * b); break;
                case "/": stack.push(a / b); break;
            }
        } else {
            stack.push(Integer.parseInt(token));
        }
    }

    return stack.pop();
}
```

---

### Problem 83: 🔒 Basic Calculator III (LeetCode 772 - Premium)

```
┌────────────────────────────────────────────────────────────────┐
│  BASIC CALCULATOR III - Evaluate expression with +,-,*,/,()   │
├────────────────────────────────────────────────────────────────┤
│  Implement a basic calculator to evaluate a simple expression │
│  string. The expression string contains only non-negative      │
│  integers, +, -, *, / operators, open ( and closing )         │
│  parentheses, and empty spaces.                                │
│                                                                │
│  Examples:                                                     │
│  Input: "1+1"              → Output: 2                         │
│  Input: "6-4/2"            → Output: 4                         │
│  Input: "2*(5+5*2)/3+(6/2+8)" → Output: 21                     │
│  Input: "(2+6*3+5-(3*14/7+2)*5)+3" → Output: -12               │
│                                                                │
│  Constraints:                                                  │
│  - 1 <= s.length <= 10^4                                       │
│  - s consists of digits, +, -, *, /, (, ), and spaces          │
│  - s represents a valid expression                             │
│  - All intermediate results in range [-2^31, 2^31 - 1]         │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int calculate(String s) {
    Queue<Character> queue = new LinkedList<>();
    for (char c : s.toCharArray()) {
        if (c != ' ') queue.offer(c);
    }
    queue.offer('+');  // Sentinel
    return helper(queue);
}

private int helper(Queue<Character> queue) {
    int num = 0, prev = 0, sum = 0;
    char prevOp = '+';

    while (!queue.isEmpty()) {
        char c = queue.poll();

        if (Character.isDigit(c)) {
            num = num * 10 + (c - '0');
        } else if (c == '(') {
            num = helper(queue);  // Recursively evaluate parentheses
        } else {
            // Apply previous operator
            switch (prevOp) {
                case '+': sum += prev; prev = num; break;
                case '-': sum += prev; prev = -num; break;
                case '*': prev *= num; break;
                case '/': prev /= num; break;
            }

            if (c == ')') break;  // Return from recursion

            num = 0;
            prevOp = c;
        }
    }

    return sum + prev;
}
```

---

## 7.2 Monotonic Stack Problems

```
┌────────────────────────────────────────────────────────────────┐
│  MONOTONIC STACK - Elements in sorted order                    │
├────────────────────────────────────────────────────────────────┤
│  DECREASING Stack (for Next Greater Element):                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Array: [2, 1, 2, 4, 3]                                    │ │
│  │                                                           │ │
│  │ i=0: stack=[2]                                            │ │
│  │ i=1: 1 < 2, stack=[2,1]                                   │ │
│  │ i=2: 2 > 1, pop→NGE[1]=2, 2==2 push, stack=[2,2]          │ │
│  │ i=3: 4 > 2, pop→NGE[2]=4, 4>2 pop→NGE[0]=4, stack=[4]     │ │
│  │ i=4: 3 < 4, stack=[4,3]                                   │ │
│  │                                                           │ │
│  │ NGE = [4, 2, 4, -1, -1]                                   │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                │
│  INCREASING Stack (for Next Smaller Element):                  │
│  Same concept, but pop when current < stack top               │
└────────────────────────────────────────────────────────────────┘
```

---

### Problem 84: Daily Temperatures

**LeetCode 739** 🔗 https://leetcode.com/problems/daily-temperatures/

```
┌────────────────────────────────────────────────────────────────┐
│  DAILY TEMPERATURES - Days until warmer temperature            │
├────────────────────────────────────────────────────────────────┤
│  temperatures = [73, 74, 75, 71, 69, 72, 76, 73]               │
│                                                                │
│  Visual Process (Monotonic Decreasing Stack by index):         │
│  ┌─────┬──────┬─────────────────────┬─────────────┐            │
│  │  i  │ temp │ Stack (indices)     │ Result      │            │
│  ├─────┼──────┼─────────────────────┼─────────────┤            │
│  │  0  │  73  │ [0]                 │ [_,_,_,_,_,_,_,_]        │
│  │  1  │  74  │ 74>73, pop, [1]     │ [1,_,_,_,_,_,_,_]        │
│  │  2  │  75  │ 75>74, pop, [2]     │ [1,1,_,_,_,_,_,_]        │
│  │  3  │  71  │ 71<75, [2,3]        │ [1,1,_,_,_,_,_,_]        │
│  │  4  │  69  │ 69<71, [2,3,4]      │ [1,1,_,_,_,_,_,_]        │
│  │  5  │  72  │ 72>69,71 pop×2 [2,5]│ [1,1,_,2,1,_,_,_]        │
│  │  6  │  76  │ 76>72,75 pop×2 [6] │ [1,1,4,2,1,1,_,_]        │
│  │  7  │  73  │ 73<76, [6,7]        │ [1,1,4,2,1,1,_,_]        │
│  └─────┴──────┴─────────────────────┴─────────────┘            │
│                                                                │
│  Output: [1, 1, 4, 2, 1, 1, 0, 0]                               │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int[] dailyTemperatures(int[] temperatures) {
    int n = temperatures.length;
    int[] result = new int[n];
    Stack<Integer> stack = new Stack<>();  // Store indices

    for (int i = 0; i < n; i++) {
        // Pop while current temp is greater than temp at stack top
        while (!stack.isEmpty() && temperatures[i] > temperatures[stack.peek()]) {
            int prevIndex = stack.pop();
            result[prevIndex] = i - prevIndex;
        }
        stack.push(i);
    }

    return result;  // Remaining indices in stack have result 0 (no warmer day)
}
```

---

### Problem 85: Next Greater Element I

**LeetCode 496** 🔗 https://leetcode.com/problems/next-greater-element-i/

```
┌────────────────────────────────────────────────────────────────┐
│  NEXT GREATER ELEMENT I                                        │
├────────────────────────────────────────────────────────────────┤
│  nums1 = [4, 1, 2]  (subset of nums2)                          │
│  nums2 = [1, 3, 4, 2]                                          │
│                                                                │
│  Find NGE in nums2 for each element in nums1:                  │
│                                                                │
│  nums2:  [1,  3,  4,  2]                                       │
│  NGE:    [3,  4, -1, -1]                                       │
│                                                                │
│  For nums1 = [4, 1, 2]:                                        │
│  - 4 → NGE in nums2 = -1                                       │
│  - 1 → NGE in nums2 = 3                                        │
│  - 2 → NGE in nums2 = -1                                       │
│                                                                │
│  Output: [-1, 3, -1]                                           │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int[] nextGreaterElement(int[] nums1, int[] nums2) {
    Map<Integer, Integer> ngeMap = new HashMap<>();
    Stack<Integer> stack = new Stack<>();

    // Build NGE map for nums2
    for (int num : nums2) {
        while (!stack.isEmpty() && num > stack.peek()) {
            ngeMap.put(stack.pop(), num);
        }
        stack.push(num);
    }

    // Remaining elements have no NGE
    while (!stack.isEmpty()) {
        ngeMap.put(stack.pop(), -1);
    }

    // Build result for nums1
    int[] result = new int[nums1.length];
    for (int i = 0; i < nums1.length; i++) {
        result[i] = ngeMap.get(nums1[i]);
    }

    return result;
}
```

---

### Problem 86: Next Greater Element II (Circular Array)

**LeetCode 503** 🔗 https://leetcode.com/problems/next-greater-element-ii/

```
┌────────────────────────────────────────────────────────────────┐
│  NEXT GREATER ELEMENT II - Circular Array                      │
├────────────────────────────────────────────────────────────────┤
│  nums = [1, 2, 1]  (circular: ...1, 2, 1, 1, 2, 1...)          │
│                                                                │
│  For each element, search circularly:                          │
│  ┌───────┬─────────────────────┬─────────┐                     │
│  │ Index │ Element → Search    │   NGE   │                     │
│  ├───────┼─────────────────────┼─────────┤                     │
│  │   0   │ 1 → 2,1,1,2 → 2     │    2    │                     │
│  │   1   │ 2 → 1,1,2 → -1      │   -1    │                     │
│  │   2   │ 1 → 1,2 → 2         │    2    │                     │
│  └───────┴─────────────────────┴─────────┘                     │
│                                                                │
│  Trick: Iterate 2n times, use i % n                            │
│                                                                │
│  Output: [2, -1, 2]                                            │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int[] nextGreaterElements(int[] nums) {
    int n = nums.length;
    int[] result = new int[n];
    Arrays.fill(result, -1);
    Stack<Integer> stack = new Stack<>();

    // Iterate twice to simulate circular array
    for (int i = 0; i < 2 * n; i++) {
        int num = nums[i % n];

        while (!stack.isEmpty() && num > nums[stack.peek()]) {
            result[stack.pop()] = num;
        }

        // Only push indices in first iteration
        if (i < n) {
            stack.push(i);
        }
    }

    return result;
}
```

---

### Problem 87: Largest Rectangle in Histogram

**LeetCode 84** 🔗 https://leetcode.com/problems/largest-rectangle-in-histogram/

```
┌────────────────────────────────────────────────────────────────┐
│  LARGEST RECTANGLE IN HISTOGRAM                                │
├────────────────────────────────────────────────────────────────┤
│  heights = [2, 1, 5, 6, 2, 3]                                  │
│                                                                │
│       6                                                        │
│     ┌───┐                                                      │
│   5 │   │                                                      │
│  ┌──┤   │                                                      │
│  │  │   │     3                                                │
│  │  │   │   ┌───┐                                              │
│  │  │   │ 2 │   │                                              │
│  │  │   ├───┤   │                                              │
│  │1 │   │   │   │                                              │
│ ─┴──┴───┴───┴───┴───                                           │
│  2  1  5   6   2   3                                           │
│                                                                │
│  Largest rectangle = 10 (5×2 using heights 5,6)                │
│     ┌──────────┐                                               │
│     │██████████│ ← Area = 5 × 2 = 10                           │
│  ┌──┤██████████│                                               │
│  │  │██████████│                                               │
│  ...                                                           │
└────────────────────────────────────────────────────────────────┘
```

**Key Insight:** For each bar, find how far it can extend left and right.

**Solution:**

```java
public int largestRectangleArea(int[] heights) {
    int n = heights.length;
    Stack<Integer> stack = new Stack<>();
    int maxArea = 0;

    for (int i = 0; i <= n; i++) {
        int h = (i == n) ? 0 : heights[i];

        while (!stack.isEmpty() && h < heights[stack.peek()]) {
            int height = heights[stack.pop()];
            int width = stack.isEmpty() ? i : i - stack.peek() - 1;
            maxArea = Math.max(maxArea, height * width);
        }

        stack.push(i);
    }

    return maxArea;
}
```

**Visual Stack Trace:**

```
┌─────┬────────┬──────────────┬────────────────┬──────────┐
│  i  │ height │ Stack        │ Calculation    │ maxArea  │
├─────┼────────┼──────────────┼────────────────┼──────────┤
│  0  │   2    │ [0]          │ -              │    0     │
│  1  │   1    │ [1]          │ h=2,w=1,a=2    │    2     │
│  2  │   5    │ [1,2]        │ -              │    2     │
│  3  │   6    │ [1,2,3]      │ -              │    2     │
│  4  │   2    │ [1,4]        │ h=6,w=1,a=6    │    6     │
│     │        │              │ h=5,w=2,a=10   │   10     │
│  5  │   3    │ [1,4,5]      │ -              │   10     │
│  6  │   0    │ []           │ h=3,w=1,a=3    │   10     │
│     │        │              │ h=2,w=4,a=8    │   10     │
│     │        │              │ h=1,w=6,a=6    │   10     │
└─────┴────────┴──────────────┴────────────────┴──────────┘
```

---

### Problem 88: Maximal Rectangle

**LeetCode 85** 🔗 https://leetcode.com/problems/maximal-rectangle/

```
┌────────────────────────────────────────────────────────────────┐
│  MAXIMAL RECTANGLE - Largest rectangle of 1s in binary matrix │
├────────────────────────────────────────────────────────────────┤
│  matrix = [                                                    │
│    ["1","0","1","0","0"],                                      │
│    ["1","0","1","1","1"],                                      │
│    ["1","1","1","1","1"],                                      │
│    ["1","0","0","1","0"]                                       │
│  ]                                                             │
│                                                                │
│  Convert each row to histogram heights:                        │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Row 0: heights = [1, 0, 1, 0, 0] → maxRect in hist        │ │
│  │ Row 1: heights = [2, 0, 2, 1, 1] → maxRect in hist        │ │
│  │ Row 2: heights = [3, 1, 3, 2, 2] → maxRect in hist = 6    │ │
│  │ Row 3: heights = [4, 0, 0, 3, 0] → maxRect in hist        │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                │
│  The maximum rectangle of 6 comes from row 2:                  │
│  heights [3, 1, 3, 2, 2] → use [2, 2, 2] with height 2 = 6    │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int maximalRectangle(char[][] matrix) {
    if (matrix.length == 0) return 0;

    int rows = matrix.length;
    int cols = matrix[0].length;
    int[] heights = new int[cols];
    int maxArea = 0;

    for (int i = 0; i < rows; i++) {
        // Update histogram heights
        for (int j = 0; j < cols; j++) {
            heights[j] = matrix[i][j] == '1' ? heights[j] + 1 : 0;
        }

        // Calculate max rectangle for current histogram
        maxArea = Math.max(maxArea, largestRectangleArea(heights));
    }

    return maxArea;
}

// Same as Problem 87
private int largestRectangleArea(int[] heights) {
    Stack<Integer> stack = new Stack<>();
    int maxArea = 0;
    int n = heights.length;

    for (int i = 0; i <= n; i++) {
        int h = (i == n) ? 0 : heights[i];
        while (!stack.isEmpty() && h < heights[stack.peek()]) {
            int height = heights[stack.pop()];
            int width = stack.isEmpty() ? i : i - stack.peek() - 1;
            maxArea = Math.max(maxArea, height * width);
        }
        stack.push(i);
    }

    return maxArea;
}
```

---

### Problem 89: Trapping Rain Water

**LeetCode 42** 🔗 https://leetcode.com/problems/trapping-rain-water/

```
┌────────────────────────────────────────────────────────────────┐
│  TRAPPING RAIN WATER                                           │
├────────────────────────────────────────────────────────────────┤
│  height = [0,1,0,2,1,0,1,3,2,1,2,1]                            │
│                                                                │
│          3 │                 █                                 │
│          2 │         █ ░ ░ ░ █ █ ░ █                           │
│          1 │     █ ░ █ █ ░ █ █ █ █ █ █                         │
│          0 └───────────────────────────                        │
│              0 1 0 2 1 0 1 3 2 1 2 1                           │
│                                                                │
│  ░ = Trapped water = 6 units                                   │
│                                                                │
│  For each position i:                                          │
│  water[i] = min(maxLeft[i], maxRight[i]) - height[i]           │
└────────────────────────────────────────────────────────────────┘
```

**Solution 1: Two Pointers (O(n) time, O(1) space)**

```java
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

**Solution 2: Monotonic Stack**

```java
public int trapStack(int[] height) {
    Stack<Integer> stack = new Stack<>();
    int water = 0;

    for (int i = 0; i < height.length; i++) {
        while (!stack.isEmpty() && height[i] > height[stack.peek()]) {
            int bottom = stack.pop();

            if (stack.isEmpty()) break;

            int left = stack.peek();
            int width = i - left - 1;
            int h = Math.min(height[left], height[i]) - height[bottom];
            water += width * h;
        }
        stack.push(i);
    }

    return water;
}
```

---

## 7.3 Queue Problems

### Problem 90: Implement Queue using Stacks

**LeetCode 232** 🔗 https://leetcode.com/problems/implement-queue-using-stacks/

```
┌────────────────────────────────────────────────────────────────┐
│  IMPLEMENT QUEUE USING STACKS                                  │
├────────────────────────────────────────────────────────────────┤
│  Use 2 stacks: inputStack and outputStack                      │
│                                                                │
│  push(1), push(2), push(3):                                    │
│  ┌──────────────┐    ┌──────────────┐                          │
│  │ inputStack   │    │ outputStack  │                          │
│  │    [1,2,3]   │    │    []        │                          │
│  └──────────────┘    └──────────────┘                          │
│                                                                │
│  pop() → need front (1):                                       │
│  Transfer input→output:                                        │
│  ┌──────────────┐    ┌──────────────┐                          │
│  │ inputStack   │    │ outputStack  │                          │
│  │    []        │    │   [3,2,1]    │ ← pop returns 1          │
│  └──────────────┘    └──────────────┘                          │
│                                                                │
│  Now outputStack has correct order for FIFO                    │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
class MyQueue {
    private Stack<Integer> input;
    private Stack<Integer> output;

    public MyQueue() {
        input = new Stack<>();
        output = new Stack<>();
    }

    public void push(int x) {
        input.push(x);
    }

    public int pop() {
        peek();  // Ensure output has elements
        return output.pop();
    }

    public int peek() {
        if (output.isEmpty()) {
            while (!input.isEmpty()) {
                output.push(input.pop());
            }
        }
        return output.peek();
    }

    public boolean empty() {
        return input.isEmpty() && output.isEmpty();
    }
}
```

---

### Problem 91: Implement Stack using Queues

**LeetCode 225** 🔗 https://leetcode.com/problems/implement-stack-using-queues/

```
┌────────────────────────────────────────────────────────────────┐
│  IMPLEMENT STACK USING QUEUES                                  │
├────────────────────────────────────────────────────────────────┤
│  Approach: Make push O(n) to keep LIFO order                   │
│                                                                │
│  push(1): queue = [1]                                          │
│  push(2): add 2, rotate 1 time                                 │
│           [1,2] → poll 1, add 1 → [2,1]                        │
│  push(3): add 3, rotate 2 times                                │
│           [2,1,3] → [1,3,2] → [3,2,1]                          │
│                                                                │
│  Now front of queue is top of stack!                           │
│  pop() → returns 3                                             │
│  top() → returns 2                                             │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
class MyStack {
    private Queue<Integer> queue;

    public MyStack() {
        queue = new LinkedList<>();
    }

    public void push(int x) {
        queue.add(x);
        // Rotate to put x at front
        int size = queue.size();
        for (int i = 0; i < size - 1; i++) {
            queue.add(queue.poll());
        }
    }

    public int pop() {
        return queue.poll();
    }

    public int top() {
        return queue.peek();
    }

    public boolean empty() {
        return queue.isEmpty();
    }
}
```

---

### Problem 92: Sliding Window Maximum

**LeetCode 239** 🔗 https://leetcode.com/problems/sliding-window-maximum/

```
┌────────────────────────────────────────────────────────────────┐
│  SLIDING WINDOW MAXIMUM - Max in each window of size k         │
├────────────────────────────────────────────────────────────────┤
│  nums = [1, 3, -1, -3, 5, 3, 6, 7], k = 3                      │
│                                                                │
│  Use Monotonic Decreasing Deque (store indices):               │
│  ┌────────────────────────────────────────────────────────────┐│
│  │ Window      │ Deque (indices)  │ Max │                     ││
│  ├─────────────┼──────────────────┼─────┤                     ││
│  │ [1,3,-1]    │ [1,2]→vals[3,-1] │  3  │                     ││
│  │ [3,-1,-3]   │ [1,2,3]→[3,-1,-3]│  3  │                     ││
│  │ [-1,-3,5]   │ [4]→[5]          │  5  │                     ││
│  │ [-3,5,3]    │ [4,5]→[5,3]      │  5  │                     ││
│  │ [5,3,6]     │ [6]→[6]          │  6  │                     ││
│  │ [3,6,7]     │ [7]→[7]          │  7  │                     ││
│  └────────────────────────────────────────────────────────────┘│
│                                                                │
│  Output: [3, 3, 5, 5, 6, 7]                                    │
│                                                                │
│  Why Monotonic Decreasing?                                     │
│  - Front always has maximum                                    │
│  - Smaller elements behind larger can never be max             │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int[] maxSlidingWindow(int[] nums, int k) {
    int n = nums.length;
    int[] result = new int[n - k + 1];
    Deque<Integer> deque = new ArrayDeque<>();  // Store indices

    for (int i = 0; i < n; i++) {
        // Remove indices out of window
        while (!deque.isEmpty() && deque.peekFirst() < i - k + 1) {
            deque.pollFirst();
        }

        // Remove smaller elements (they'll never be max)
        while (!deque.isEmpty() && nums[deque.peekLast()] < nums[i]) {
            deque.pollLast();
        }

        deque.offerLast(i);

        // Window is complete
        if (i >= k - 1) {
            result[i - k + 1] = nums[deque.peekFirst()];
        }
    }

    return result;
}
```

---

### Problem 93: 🔒 Shortest Subarray with Sum at Least K (LeetCode 862 - Hard)

```
┌────────────────────────────────────────────────────────────────┐
│  SHORTEST SUBARRAY WITH SUM AT LEAST K                         │
├────────────────────────────────────────────────────────────────┤
│  Return the length of the shortest non-empty subarray with     │
│  sum at least k. If no such subarray exists, return -1.        │
│  Note: Array can have NEGATIVE numbers!                        │
│                                                                │
│  Examples:                                                     │
│  Input: nums = [1], k = 1        → Output: 1                   │
│  Input: nums = [1,2], k = 4      → Output: -1                  │
│  Input: nums = [2,-1,2], k = 3   → Output: 3                   │
│                                                                │
│  Constraints:                                                  │
│  - 1 <= nums.length <= 10^5                                    │
│  - -10^5 <= nums[i] <= 10^5                                    │
│  - 1 <= k <= 10^9                                              │
│                                                                │
│  Key Insight: Use prefix sum + monotonic deque                 │
│  prefix[j] - prefix[i] >= k means subarray (i,j] has sum >= k  │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int shortestSubarray(int[] nums, int k) {
    int n = nums.length;
    long[] prefix = new long[n + 1];

    // Build prefix sum
    for (int i = 0; i < n; i++) {
        prefix[i + 1] = prefix[i] + nums[i];
    }

    int minLen = Integer.MAX_VALUE;
    Deque<Integer> deque = new ArrayDeque<>();

    for (int i = 0; i <= n; i++) {
        // Check if current prefix - some earlier prefix >= k
        while (!deque.isEmpty() && prefix[i] - prefix[deque.peekFirst()] >= k) {
            minLen = Math.min(minLen, i - deque.pollFirst());
        }

        // Maintain monotonic increasing deque
        // Remove larger prefix sums (they give shorter subarrays)
        while (!deque.isEmpty() && prefix[i] <= prefix[deque.peekLast()]) {
            deque.pollLast();
        }

        deque.offerLast(i);
    }

    return minLen == Integer.MAX_VALUE ? -1 : minLen;
}
```

---

### Problem 94: 🔒 Design Circular Queue (LeetCode 622)

```
┌────────────────────────────────────────────────────────────────┐
│  DESIGN CIRCULAR QUEUE                                         │
├────────────────────────────────────────────────────────────────┤
│  Design your implementation of the circular queue.             │
│                                                                │
│  Circular Queue visualization (capacity=5):                    │
│       ┌───┬───┬───┬───┬───┐                                    │
│       │ 1 │ 2 │ 3 │   │   │                                    │
│       └───┴───┴───┴───┴───┘                                    │
│         ↑           ↑                                          │
│       front       rear                                         │
│                                                                │
│  After enQueue(4), enQueue(5):                                 │
│       ┌───┬───┬───┬───┬───┐                                    │
│       │ 1 │ 2 │ 3 │ 4 │ 5 │  (Full!)                           │
│       └───┴───┴───┴───┴───┘                                    │
│         ↑               ↑                                      │
│       front           rear                                     │
│                                                                │
│  deQueue() twice, then enQueue(6):                             │
│       ┌───┬───┬───┬───┬───┐                                    │
│       │ 6 │   │ 3 │ 4 │ 5 │  (Wraps around!)                   │
│       └───┴───┴───┴───┴───┘                                    │
│         ↑   ↑                                                  │
│       rear front                                               │
│                                                                │
│  Operations:                                                   │
│  - MyCircularQueue(k): Initialize with size k                  │
│  - enQueue(value): Insert element, return success              │
│  - deQueue(): Delete front element, return success             │
│  - Front(): Get front item                                     │
│  - Rear(): Get rear item                                       │
│  - isEmpty(): Check if empty                                   │
│  - isFull(): Check if full                                     │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
class MyCircularQueue {
    private int[] data;
    private int front, rear, size, capacity;

    public MyCircularQueue(int k) {
        data = new int[k];
        capacity = k;
        front = 0;
        rear = -1;
        size = 0;
    }

    public boolean enQueue(int value) {
        if (isFull()) return false;

        rear = (rear + 1) % capacity;
        data[rear] = value;
        size++;
        return true;
    }

    public boolean deQueue() {
        if (isEmpty()) return false;

        front = (front + 1) % capacity;
        size--;
        return true;
    }

    public int Front() {
        return isEmpty() ? -1 : data[front];
    }

    public int Rear() {
        return isEmpty() ? -1 : data[rear];
    }

    public boolean isEmpty() {
        return size == 0;
    }

    public boolean isFull() {
        return size == capacity;
    }
}
```

---

### Problem 95: 🔒 Design Circular Deque (LeetCode 641)

```
┌────────────────────────────────────────────────────────────────┐
│  DESIGN CIRCULAR DEQUE (Double-ended Queue)                    │
├────────────────────────────────────────────────────────────────┤
│  Design a circular deque with these operations:                │
│  - insertFront(): Add at front                                 │
│  - insertLast(): Add at rear                                   │
│  - deleteFront(): Remove from front                            │
│  - deleteLast(): Remove from rear                              │
│  - getFront(): Get front element                               │
│  - getRear(): Get rear element                                 │
│  - isEmpty(): Check if empty                                   │
│  - isFull(): Check if full                                     │
│                                                                │
│  Example:                                                      │
│  MyCircularDeque deque = new MyCircularDeque(3);               │
│  deque.insertLast(1);  // return true                          │
│  deque.insertLast(2);  // return true                          │
│  deque.insertFront(3); // return true                          │
│  deque.insertFront(4); // return false (full)                  │
│  deque.getRear();      // return 2                             │
│  deque.isFull();       // return true                          │
│  deque.deleteLast();   // return true                          │
│  deque.insertFront(4); // return true                          │
│  deque.getFront();     // return 4                             │
│                                                                │
│  Constraints:                                                  │
│  - 1 <= k <= 1000                                              │
│  - 0 <= value <= 1000                                          │
│  - At most 2000 calls to operations                            │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
class MyCircularDeque {
    private int[] data;
    private int front, rear, size, capacity;

    public MyCircularDeque(int k) {
        data = new int[k];
        capacity = k;
        front = 0;
        rear = k - 1;
        size = 0;
    }

    public boolean insertFront(int value) {
        if (isFull()) return false;

        front = (front - 1 + capacity) % capacity;
        data[front] = value;
        size++;
        return true;
    }

    public boolean insertLast(int value) {
        if (isFull()) return false;

        rear = (rear + 1) % capacity;
        data[rear] = value;
        size++;
        return true;
    }

    public boolean deleteFront() {
        if (isEmpty()) return false;

        front = (front + 1) % capacity;
        size--;
        return true;
    }

    public boolean deleteLast() {
        if (isEmpty()) return false;

        rear = (rear - 1 + capacity) % capacity;
        size--;
        return true;
    }

    public int getFront() {
        return isEmpty() ? -1 : data[front];
    }

    public int getRear() {
        return isEmpty() ? -1 : data[rear];
    }

    public boolean isEmpty() {
        return size == 0;
    }

    public boolean isFull() {
        return size == capacity;
    }
}
```

---

## 7.4 Advanced Stack Problems

### Problem 96: Remove K Digits

**LeetCode 402** 🔗 https://leetcode.com/problems/remove-k-digits/

```
┌────────────────────────────────────────────────────────────────┐
│  REMOVE K DIGITS - Make smallest number by removing k digits   │
├────────────────────────────────────────────────────────────────┤
│  num = "1432219", k = 3                                        │
│                                                                │
│  Use monotonic increasing stack:                               │
│  ┌───────┬─────────────────────────┬─────────┐                 │
│  │ Digit │ Stack                   │ k       │                 │
│  ├───────┼─────────────────────────┼─────────┤                 │
│  │   1   │ [1]                     │ 3       │                 │
│  │   4   │ [1,4]                   │ 3       │                 │
│  │   3   │ [1,3] (pop 4)           │ 2       │                 │
│  │   2   │ [1,2] (pop 3)           │ 1       │                 │
│  │   2   │ [1,2,2]                 │ 1       │                 │
│  │   1   │ [1,2,1] (pop 2)         │ 0       │                 │
│  │   9   │ [1,2,1,9]               │ 0       │                 │
│  └───────┴─────────────────────────┴─────────┘                 │
│                                                                │
│  Result: "1219"                                                │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public String removeKdigits(String num, int k) {
    if (k >= num.length()) return "0";

    Deque<Character> stack = new ArrayDeque<>();

    for (char c : num.toCharArray()) {
        while (k > 0 && !stack.isEmpty() && stack.peekLast() > c) {
            stack.pollLast();
            k--;
        }
        stack.addLast(c);
    }

    // Remove remaining k digits from end
    while (k-- > 0) {
        stack.pollLast();
    }

    // Build result, removing leading zeros
    StringBuilder result = new StringBuilder();
    boolean leadingZero = true;

    for (char c : stack) {
        if (leadingZero && c == '0') continue;
        leadingZero = false;
        result.append(c);
    }

    return result.length() == 0 ? "0" : result.toString();
}
```

---

### Problem 97: Remove Duplicate Letters

**LeetCode 316** 🔗 https://leetcode.com/problems/remove-duplicate-letters/

```
┌────────────────────────────────────────────────────────────────┐
│  REMOVE DUPLICATE LETTERS - Smallest lexicographic result      │
├────────────────────────────────────────────────────────────────┤
│  s = "cbacdcbc"                                                │
│                                                                │
│  Goal: Remove duplicates, keep smallest lex order              │
│  Each letter appears exactly once in result                    │
│                                                                │
│  Process:                                                      │
│  ┌───────┬──────────────┬──────────────────────────┐           │
│  │ Char  │ Stack        │ Reason                   │           │
│  ├───────┼──────────────┼──────────────────────────┤           │
│  │   c   │ [c]          │ push                     │           │
│  │   b   │ [b]          │ b<c, c appears later,pop │           │
│  │   a   │ [a]          │ a<b, b appears later,pop │           │
│  │   c   │ [a,c]        │ push                     │           │
│  │   d   │ [a,c,d]      │ push                     │           │
│  │   c   │ [a,c,d]      │ c already in stack, skip │           │
│  │   b   │ [a,b,c,d]    │ b<d but d last, b<c...   │           │
│  │   c   │ [a,b,c,d]    │ c already in stack, skip │           │
│  └───────┴──────────────┴──────────────────────────┘           │
│                                                                │
│  Wait... let me redo: Final = "acdb"                           │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public String removeDuplicateLetters(String s) {
    int[] lastIndex = new int[26];
    boolean[] inStack = new boolean[26];

    // Find last occurrence of each character
    for (int i = 0; i < s.length(); i++) {
        lastIndex[s.charAt(i) - 'a'] = i;
    }

    Deque<Character> stack = new ArrayDeque<>();

    for (int i = 0; i < s.length(); i++) {
        char c = s.charAt(i);
        int idx = c - 'a';

        // Skip if already in stack
        if (inStack[idx]) continue;

        // Pop larger chars that appear later
        while (!stack.isEmpty() &&
               c < stack.peekLast() &&
               lastIndex[stack.peekLast() - 'a'] > i) {
            inStack[stack.pollLast() - 'a'] = false;
        }

        stack.addLast(c);
        inStack[idx] = true;
    }

    StringBuilder result = new StringBuilder();
    for (char c : stack) {
        result.append(c);
    }

    return result.toString();
}
```

---

### Problem 98: 🔒 132 Pattern

**LeetCode 456** 🔗 https://leetcode.com/problems/132-pattern/

```
┌────────────────────────────────────────────────────────────────┐
│  132 PATTERN - Find i < j < k where a[i] < a[k] < a[j]        │
├────────────────────────────────────────────────────────────────┤
│  Example: [3, 1, 4, 2]                                         │
│           a[i]=1, a[j]=4, a[k]=2 → 1 < 2 < 4 ✓                 │
│                                                                │
│  Pattern Visualization:                                        │
│       4 ┌───┐                                                  │
│         │   │                                                  │
│     3 ──┤   │                                                  │
│       2 │   └───┐                                              │
│         │       │                                              │
│     1 ──┴───────┴──                                            │
│         i   j   k                                              │
│                                                                │
│  Approach: Iterate from right, track "a[k]" candidates         │
│  using monotonic decreasing stack                              │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public boolean find132pattern(int[] nums) {
    int n = nums.length;
    if (n < 3) return false;

    Stack<Integer> stack = new Stack<>();
    int third = Integer.MIN_VALUE;  // The "2" in 132 (a[k])

    // Iterate from right to left
    for (int i = n - 1; i >= 0; i--) {
        // Current is potential a[i], check if smaller than "2"
        if (nums[i] < third) return true;

        // Current is potential a[j], pop smaller elements as "2" candidates
        while (!stack.isEmpty() && nums[i] > stack.peek()) {
            third = stack.pop();  // This becomes the "2"
        }

        stack.push(nums[i]);
    }

    return false;
}
```

---

### Problem 99: Online Stock Span

**LeetCode 901** 🔗 https://leetcode.com/problems/online-stock-span/

```
┌────────────────────────────────────────────────────────────────┐
│  ONLINE STOCK SPAN - Days before with price <= today          │
├────────────────────────────────────────────────────────────────┤
│  Prices: [100, 80, 60, 70, 60, 75, 85]                         │
│                                                                │
│  For each day, count consecutive days before (including today) │
│  where price <= today's price:                                 │
│                                                                │
│  ┌───────┬───────┬─────────────────────────────┬───────┐       │
│  │ Day   │ Price │ Explanation                 │ Span  │       │
│  ├───────┼───────┼─────────────────────────────┼───────┤       │
│  │  0    │  100  │ Just today                  │   1   │       │
│  │  1    │   80  │ Just today (100>80)         │   1   │       │
│  │  2    │   60  │ Just today (80>60)          │   1   │       │
│  │  3    │   70  │ [60,70]                     │   2   │       │
│  │  4    │   60  │ Just today (70>60)          │   1   │       │
│  │  5    │   75  │ [60,70,60,75]               │   4   │       │
│  │  6    │   85  │ [60,70,60,75,85]            │   6   │       │
│  └───────┴───────┴─────────────────────────────┴───────┘       │
│                                                                │
│  Use stack of (price, span) pairs                              │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
class StockSpanner {
    private Stack<int[]> stack;  // [price, span]

    public StockSpanner() {
        stack = new Stack<>();
    }

    public int next(int price) {
        int span = 1;

        // Pop and accumulate spans of smaller prices
        while (!stack.isEmpty() && stack.peek()[0] <= price) {
            span += stack.pop()[1];
        }

        stack.push(new int[]{price, span});
        return span;
    }
}
```

---

## 7.5 HackerEarth & Codeforces Stack/Queue Problems

### Problem 100: Balanced Brackets (HackerEarth)

```
┌────────────────────────────────────────────────────────────────┐
│  BALANCED BRACKETS - Extended validation                       │
├────────────────────────────────────────────────────────────────┤
│  Given a string containing brackets and other characters,      │
│  determine if the brackets are balanced.                       │
│                                                                │
│  Valid: "{[()]}", "a{b[c(d)e]f}g", "(())()"                    │
│  Invalid: "{[}]", "(()", "a{b(c]d}e"                           │
│                                                                │
│  Examples:                                                     │
│  Input: "{[a+b]*[c-d]}"  → Output: "YES"                       │
│  Input: "({[}])"         → Output: "NO" (mismatched)           │
│  Input: "((()))"         → Output: "YES"                       │
│                                                                │
│  Constraints:                                                  │
│  - 1 <= |s| <= 10^5                                            │
│  - String contains alphanumeric and bracket characters         │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public String isBalanced(String s) {
    Stack<Character> stack = new Stack<>();

    for (char c : s.toCharArray()) {
        if (c == '(' || c == '{' || c == '[') {
            stack.push(c);
        } else if (c == ')' || c == '}' || c == ']') {
            if (stack.isEmpty()) return "NO";

            char top = stack.pop();
            if ((c == ')' && top != '(') ||
                (c == '}' && top != '{') ||
                (c == ']' && top != '[')) {
                return "NO";
            }
        }
        // Ignore other characters
    }

    return stack.isEmpty() ? "YES" : "NO";
}
```

---

### Problem 101: Maximum Element (HackerEarth/HackerRank)

```
┌────────────────────────────────────────────────────────────────┐
│  MAXIMUM ELEMENT - Stack with max queries                      │
├────────────────────────────────────────────────────────────────┤
│  Support these operations:                                     │
│  1 x : Push x onto the stack                                   │
│  2   : Pop the top element                                     │
│  3   : Print the maximum element in the stack                  │
│                                                                │
│  Example:                                                      │
│  Operations: 1 97, 2, 1 20, 2, 1 26, 1 20, 2, 3, 1 91, 3       │
│                                                                │
│  ┌────────┬────────────────┬────────────┬──────────┐           │
│  │ Query  │ Action         │ Stack      │ Output   │           │
│  ├────────┼────────────────┼────────────┼──────────┤           │
│  │ 1 97   │ push 97        │ [97]       │ -        │           │
│  │ 2      │ pop            │ []         │ -        │           │
│  │ 1 20   │ push 20        │ [20]       │ -        │           │
│  │ 2      │ pop            │ []         │ -        │           │
│  │ 1 26   │ push 26        │ [26]       │ -        │           │
│  │ 1 20   │ push 20        │ [26,20]    │ -        │           │
│  │ 2      │ pop            │ [26]       │ -        │           │
│  │ 3      │ print max      │ [26]       │ 26       │           │
│  │ 1 91   │ push 91        │ [26,91]    │ -        │           │
│  │ 3      │ print max      │ [26,91]    │ 91       │           │
│  └────────┴────────────────┴────────────┴──────────┘           │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public void processQueries(int[][] queries) {
    Stack<int[]> stack = new Stack<>();  // [value, maxSoFar]

    for (int[] query : queries) {
        int type = query[0];

        if (type == 1) {
            int x = query[1];
            int currentMax = stack.isEmpty() ? x : Math.max(x, stack.peek()[1]);
            stack.push(new int[]{x, currentMax});
        } else if (type == 2) {
            if (!stack.isEmpty()) {
                stack.pop();
            }
        } else {  // type == 3
            if (!stack.isEmpty()) {
                System.out.println(stack.peek()[1]);
            }
        }
    }
}
```

---

### Problem 102: Nearest Smaller Element (Codeforces-style)

```
┌────────────────────────────────────────────────────────────────┐
│  NEAREST SMALLER ELEMENT                                       │
├────────────────────────────────────────────────────────────────┤
│  For each element, find the nearest smaller element to its     │
│  left. If none exists, output -1.                              │
│                                                                │
│  Input: [4, 5, 2, 10, 8]                                       │
│                                                                │
│  ┌───────┬─────────┬───────────────────────┬─────────┐         │
│  │ Index │ Element │ Elements to Left      │ Answer  │         │
│  ├───────┼─────────┼───────────────────────┼─────────┤         │
│  │   0   │    4    │ none                  │   -1    │         │
│  │   1   │    5    │ 4                     │    4    │         │
│  │   2   │    2    │ 4,5 (none smaller)    │   -1    │         │
│  │   3   │   10    │ 4,5,2 → nearest is 2  │    2    │         │
│  │   4   │    8    │ 4,5,2,10 → nearest 2  │    2    │         │
│  └───────┴─────────┴───────────────────────┴─────────┘         │
│                                                                │
│  Output: [-1, 4, -1, 2, 2]                                     │
│                                                                │
│  Constraints:                                                  │
│  - 1 <= n <= 10^5                                              │
│  - 1 <= a[i] <= 10^9                                           │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int[] nearestSmallerElement(int[] arr) {
    int n = arr.length;
    int[] result = new int[n];
    Stack<Integer> stack = new Stack<>();

    for (int i = 0; i < n; i++) {
        // Pop elements >= current
        while (!stack.isEmpty() && stack.peek() >= arr[i]) {
            stack.pop();
        }

        result[i] = stack.isEmpty() ? -1 : stack.peek();
        stack.push(arr[i]);
    }

    return result;
}
```

---

### Problem 103: Prefix to Postfix Conversion (HackerEarth)

```
┌────────────────────────────────────────────────────────────────┐
│  PREFIX TO POSTFIX CONVERSION                                  │
├────────────────────────────────────────────────────────────────┤
│  Convert prefix expression to postfix using stack              │
│                                                                │
│  Prefix:  *+AB-CD   (operator before operands)                 │
│  Postfix: AB+CD-*   (operator after operands)                  │
│                                                                │
│  Algorithm: Read from RIGHT to LEFT                            │
│  ┌───────┬──────────────────────────────┬─────────────────────┐│
│  │ Char  │ Action                       │ Stack               ││
│  ├───────┼──────────────────────────────┼─────────────────────┤│
│  │   D   │ push                         │ [D]                 ││
│  │   C   │ push                         │ [D, C]              ││
│  │   -   │ pop C,D → "CD-" push         │ [D, CD-]            ││
│  │   B   │ push                         │ [D, CD-, B]         ││
│  │   A   │ push                         │ [D, CD-, B, A]      ││
│  │   +   │ pop A,B → "AB+" push         │ [D, CD-, AB+]       ││
│  │   *   │ pop AB+,CD- → "AB+CD-*"      │ [AB+CD-*]           ││
│  └───────┴──────────────────────────────┴─────────────────────┘│
│                                                                │
│  Result: "AB+CD-*"                                             │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public String prefixToPostfix(String prefix) {
    Stack<String> stack = new Stack<>();

    // Read from right to left
    for (int i = prefix.length() - 1; i >= 0; i--) {
        char c = prefix.charAt(i);

        if (Character.isLetterOrDigit(c)) {
            stack.push(String.valueOf(c));
        } else {
            // Operator: pop two operands
            String op1 = stack.pop();
            String op2 = stack.pop();
            // Postfix: operand1 + operand2 + operator
            stack.push(op1 + op2 + c);
        }
    }

    return stack.pop();
}
```

---

# 📚 SECTION 8: TREE PROBLEMS (BFS/DFS)

```
┌─────────────────────────────────────────────────────────────────┐
│                    TREE TRAVERSAL PATTERNS                      │
├─────────────────────────────────────────────────────────────────┤
│  BINARY TREE STRUCTURE:                                         │
│            ┌───┐                                                │
│            │ 1 │ ← Root                                         │
│            └─┬─┘                                                │
│         ┌───┴───┐                                               │
│       ┌─┴─┐   ┌─┴─┐                                             │
│       │ 2 │   │ 3 │                                             │
│       └─┬─┘   └─┬─┘                                             │
│      ┌──┴──┐    └──┐                                            │
│    ┌─┴─┐ ┌─┴─┐   ┌─┴─┐                                          │
│    │ 4 │ │ 5 │   │ 6 │                                          │
│    └───┘ └───┘   └───┘                                          │
│                                                                 │
│  TRAVERSAL ORDERS:                                              │
│  ┌────────────┬──────────────────┬──────────────────┐           │
│  │ Preorder   │ Root→Left→Right  │ 1,2,4,5,3,6      │           │
│  │ Inorder    │ Left→Root→Right  │ 4,2,5,1,3,6      │           │
│  │ Postorder  │ Left→Right→Root  │ 4,5,2,6,3,1      │           │
│  │ Level Order│ Level by level   │ 1,2,3,4,5,6      │           │
│  └────────────┴──────────────────┴──────────────────┘           │
│                                                                 │
│  DFS vs BFS:                                                    │
│  ┌─────────────────────┬─────────────────────────────┐          │
│  │ DFS (Stack/Recursion)│ BFS (Queue)                │          │
│  │ - Go deep first      │ - Go wide first            │          │
│  │ - Preorder/In/Post   │ - Level order traversal    │          │
│  │ - Path problems      │ - Shortest path problems   │          │
│  │ - Tree height/depth  │ - Level-wise processing    │          │
│  └─────────────────────┴─────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8.1 Tree Traversal Problems

### Problem 104: Binary Tree Inorder Traversal

**LeetCode 94** 🔗 https://leetcode.com/problems/binary-tree-inorder-traversal/

```
┌────────────────────────────────────────────────────────────────┐
│  INORDER TRAVERSAL: Left → Root → Right                        │
├────────────────────────────────────────────────────────────────┤
│        1                                                       │
│         \                                                      │
│          2        Inorder: [1, 3, 2]                           │
│         /                                                      │
│        3                                                       │
│                                                                │
│  Recursive call flow:                                          │
│  inorder(1) → inorder(null) → visit 1 → inorder(2)            │
│            → inorder(3) → visit 3 → visit 2 → inorder(null)   │
└────────────────────────────────────────────────────────────────┘
```

**Solution (Recursive):**

```java
public List<Integer> inorderTraversal(TreeNode root) {
    List<Integer> result = new ArrayList<>();
    inorder(root, result);
    return result;
}

private void inorder(TreeNode node, List<Integer> result) {
    if (node == null) return;

    inorder(node.left, result);   // Left
    result.add(node.val);          // Root
    inorder(node.right, result);  // Right
}
```

**Solution (Iterative with Stack):**

```java
public List<Integer> inorderTraversal(TreeNode root) {
    List<Integer> result = new ArrayList<>();
    Stack<TreeNode> stack = new Stack<>();
    TreeNode curr = root;

    while (curr != null || !stack.isEmpty()) {
        // Go to leftmost
        while (curr != null) {
            stack.push(curr);
            curr = curr.left;
        }

        // Process node
        curr = stack.pop();
        result.add(curr.val);

        // Move to right subtree
        curr = curr.right;
    }

    return result;
}
```

---

### Problem 105: Binary Tree Preorder Traversal

**LeetCode 144** 🔗 https://leetcode.com/problems/binary-tree-preorder-traversal/

```
┌────────────────────────────────────────────────────────────────┐
│  PREORDER TRAVERSAL: Root → Left → Right                       │
├────────────────────────────────────────────────────────────────┤
│        1                                                       │
│       / \                                                      │
│      2   3        Preorder: [1, 2, 4, 5, 3]                    │
│     / \                                                        │
│    4   5                                                       │
│                                                                │
│  Process order: 1 → 2 → 4 → 5 → 3                              │
└────────────────────────────────────────────────────────────────┘
```

**Solution (Iterative):**

```java
public List<Integer> preorderTraversal(TreeNode root) {
    List<Integer> result = new ArrayList<>();
    if (root == null) return result;

    Stack<TreeNode> stack = new Stack<>();
    stack.push(root);

    while (!stack.isEmpty()) {
        TreeNode node = stack.pop();
        result.add(node.val);  // Process root first

        // Push right first so left is processed first
        if (node.right != null) stack.push(node.right);
        if (node.left != null) stack.push(node.left);
    }

    return result;
}
```

---

### Problem 106: Binary Tree Postorder Traversal

**LeetCode 145** 🔗 https://leetcode.com/problems/binary-tree-postorder-traversal/

```
┌────────────────────────────────────────────────────────────────┐
│  POSTORDER TRAVERSAL: Left → Right → Root                      │
├────────────────────────────────────────────────────────────────┤
│        1                                                       │
│       / \                                                      │
│      2   3        Postorder: [4, 5, 2, 3, 1]                   │
│     / \                                                        │
│    4   5                                                       │
│                                                                │
│  Trick: Reverse of (Root → Right → Left)                       │
│  Modified preorder: 1→3→2→5→4 then reverse → 4,5,2,3,1        │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public List<Integer> postorderTraversal(TreeNode root) {
    LinkedList<Integer> result = new LinkedList<>();
    if (root == null) return result;

    Stack<TreeNode> stack = new Stack<>();
    stack.push(root);

    while (!stack.isEmpty()) {
        TreeNode node = stack.pop();
        result.addFirst(node.val);  // Add to front (reverse)

        // Push left first, then right
        if (node.left != null) stack.push(node.left);
        if (node.right != null) stack.push(node.right);
    }

    return result;
}
```

---

### Problem 107: Binary Tree Level Order Traversal

**LeetCode 102** 🔗 https://leetcode.com/problems/binary-tree-level-order-traversal/

```
┌────────────────────────────────────────────────────────────────┐
│  LEVEL ORDER TRAVERSAL (BFS)                                   │
├────────────────────────────────────────────────────────────────┤
│        3         Level 0: [3]                                  │
│       / \        Level 1: [9, 20]                              │
│      9  20       Level 2: [15, 7]                              │
│        /  \                                                    │
│       15   7     Output: [[3], [9,20], [15,7]]                 │
│                                                                │
│  BFS with Queue:                                               │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Step │ Queue              │ Level Output                  │ │
│  ├──────┼────────────────────┼───────────────────────────────┤ │
│  │  1   │ [3]                │ Process: [3]                  │ │
│  │  2   │ [9, 20]            │ Process: [9, 20]              │ │
│  │  3   │ [15, 7]            │ Process: [15, 7]              │ │
│  └───────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public List<List<Integer>> levelOrder(TreeNode root) {
    List<List<Integer>> result = new ArrayList<>();
    if (root == null) return result;

    Queue<TreeNode> queue = new LinkedList<>();
    queue.offer(root);

    while (!queue.isEmpty()) {
        int levelSize = queue.size();
        List<Integer> currentLevel = new ArrayList<>();

        for (int i = 0; i < levelSize; i++) {
            TreeNode node = queue.poll();
            currentLevel.add(node.val);

            if (node.left != null) queue.offer(node.left);
            if (node.right != null) queue.offer(node.right);
        }

        result.add(currentLevel);
    }

    return result;
}
```

---

### Problem 108: Binary Tree Zigzag Level Order Traversal

**LeetCode 103** 🔗 https://leetcode.com/problems/binary-tree-zigzag-level-order-traversal/

```
┌────────────────────────────────────────────────────────────────┐
│  ZIGZAG LEVEL ORDER                                            │
├────────────────────────────────────────────────────────────────┤
│        3         Level 0 (→): [3]                              │
│       / \        Level 1 (←): [20, 9]                          │
│      9  20       Level 2 (→): [15, 7]                          │
│        /  \                                                    │
│       15   7     Output: [[3], [20,9], [15,7]]                 │
│                                                                │
│  Alternate direction each level                                │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public List<List<Integer>> zigzagLevelOrder(TreeNode root) {
    List<List<Integer>> result = new ArrayList<>();
    if (root == null) return result;

    Queue<TreeNode> queue = new LinkedList<>();
    queue.offer(root);
    boolean leftToRight = true;

    while (!queue.isEmpty()) {
        int levelSize = queue.size();
        LinkedList<Integer> currentLevel = new LinkedList<>();

        for (int i = 0; i < levelSize; i++) {
            TreeNode node = queue.poll();

            if (leftToRight) {
                currentLevel.addLast(node.val);
            } else {
                currentLevel.addFirst(node.val);
            }

            if (node.left != null) queue.offer(node.left);
            if (node.right != null) queue.offer(node.right);
        }

        result.add(currentLevel);
        leftToRight = !leftToRight;
    }

    return result;
}
```

---

### Problem 109: 🔒 Binary Tree Vertical Order Traversal (LeetCode 314 - Premium)

```
┌────────────────────────────────────────────────────────────────┐
│  VERTICAL ORDER TRAVERSAL                                      │
├────────────────────────────────────────────────────────────────┤
│  Given a binary tree, return the vertical order traversal      │
│  of its nodes' values (column by column from left to right).   │
│  If nodes are in the same row and column, order left to right. │
│                                                                │
│        3 (col 0)                                               │
│       / \                                                      │
│      9   20      Column mapping:                               │
│     /   /  \     col -2: [4]                                   │
│    4   15   7    col -1: [9]                                   │
│       /          col  0: [3, 15]                               │
│      5           col  1: [20, 5]                               │
│                  col  2: [7]                                   │
│                                                                │
│  Output: [[4], [9], [3,15], [20,5], [7]]                       │
│                                                                │
│  Constraints:                                                  │
│  - Number of nodes in range [0, 100]                           │
│  - -100 <= Node.val <= 100                                     │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public List<List<Integer>> verticalOrder(TreeNode root) {
    List<List<Integer>> result = new ArrayList<>();
    if (root == null) return result;

    Map<Integer, List<Integer>> columnMap = new TreeMap<>();
    Queue<TreeNode> nodeQueue = new LinkedList<>();
    Queue<Integer> colQueue = new LinkedList<>();

    nodeQueue.offer(root);
    colQueue.offer(0);

    while (!nodeQueue.isEmpty()) {
        TreeNode node = nodeQueue.poll();
        int col = colQueue.poll();

        columnMap.computeIfAbsent(col, k -> new ArrayList<>()).add(node.val);

        if (node.left != null) {
            nodeQueue.offer(node.left);
            colQueue.offer(col - 1);
        }
        if (node.right != null) {
            nodeQueue.offer(node.right);
            colQueue.offer(col + 1);
        }
    }

    result.addAll(columnMap.values());
    return result;
}
```

---

## 8.2 Tree Property Problems

### Problem 110: Maximum Depth of Binary Tree

**LeetCode 104** 🔗 https://leetcode.com/problems/maximum-depth-of-binary-tree/

```
┌────────────────────────────────────────────────────────────────┐
│  MAXIMUM DEPTH (Height)                                        │
├────────────────────────────────────────────────────────────────┤
│        3          depth = 1 + max(depth(left), depth(right))   │
│       / \                                                      │
│      9  20        depth(3) = 1 + max(1, 2) = 3                 │
│        /  \       depth(9) = 1 + max(0, 0) = 1                 │
│       15   7      depth(20) = 1 + max(1, 1) = 2                │
│                                                                │
│  Maximum Depth = 3                                             │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int maxDepth(TreeNode root) {
    if (root == null) return 0;

    int leftDepth = maxDepth(root.left);
    int rightDepth = maxDepth(root.right);

    return 1 + Math.max(leftDepth, rightDepth);
}

// Iterative BFS approach
public int maxDepthBFS(TreeNode root) {
    if (root == null) return 0;

    Queue<TreeNode> queue = new LinkedList<>();
    queue.offer(root);
    int depth = 0;

    while (!queue.isEmpty()) {
        int levelSize = queue.size();
        depth++;

        for (int i = 0; i < levelSize; i++) {
            TreeNode node = queue.poll();
            if (node.left != null) queue.offer(node.left);
            if (node.right != null) queue.offer(node.right);
        }
    }

    return depth;
}
```

---

### Problem 111: Minimum Depth of Binary Tree

**LeetCode 111** 🔗 https://leetcode.com/problems/minimum-depth-of-binary-tree/

```
┌────────────────────────────────────────────────────────────────┐
│  MINIMUM DEPTH - Shortest path from root to leaf               │
├────────────────────────────────────────────────────────────────┤
│        3                    3                                  │
│       / \                    \                                 │
│      9  20                   20                                │
│        /  \                 /  \                               │
│       15   7               15   7                              │
│                                                                │
│  Min depth = 2           Min depth = 3 (not 1!)                │
│  (3→9 is leaf)           (3 is not a leaf)                     │
│                                                                │
│  ⚠️ TRAP: If one child is null, use the other child's depth   │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int minDepth(TreeNode root) {
    if (root == null) return 0;

    // If only one child exists, must go through that child
    if (root.left == null) return 1 + minDepth(root.right);
    if (root.right == null) return 1 + minDepth(root.left);

    return 1 + Math.min(minDepth(root.left), minDepth(root.right));
}

// BFS is more efficient - finds first leaf
public int minDepthBFS(TreeNode root) {
    if (root == null) return 0;

    Queue<TreeNode> queue = new LinkedList<>();
    queue.offer(root);
    int depth = 0;

    while (!queue.isEmpty()) {
        depth++;
        int levelSize = queue.size();

        for (int i = 0; i < levelSize; i++) {
            TreeNode node = queue.poll();

            // Found first leaf!
            if (node.left == null && node.right == null) {
                return depth;
            }

            if (node.left != null) queue.offer(node.left);
            if (node.right != null) queue.offer(node.right);
        }
    }

    return depth;
}
```

---

### Problem 112: Balanced Binary Tree

**LeetCode 110** 🔗 https://leetcode.com/problems/balanced-binary-tree/

```
┌────────────────────────────────────────────────────────────────┐
│  BALANCED BINARY TREE                                          │
├────────────────────────────────────────────────────────────────┤
│  A tree is balanced if for every node, the height difference   │
│  between left and right subtrees is at most 1.                 │
│                                                                │
│  Balanced:              Unbalanced:                            │
│        3                      1                                │
│       / \                      \                               │
│      9  20                      2                              │
│        /  \                      \                             │
│       15   7                      3                            │
│                                    \                           │
│  |h(L) - h(R)| <= 1               4 ← depth diff > 1           │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public boolean isBalanced(TreeNode root) {
    return checkHeight(root) != -1;
}

private int checkHeight(TreeNode node) {
    if (node == null) return 0;

    int leftHeight = checkHeight(node.left);
    if (leftHeight == -1) return -1;  // Left subtree unbalanced

    int rightHeight = checkHeight(node.right);
    if (rightHeight == -1) return -1;  // Right subtree unbalanced

    // Check current node balance
    if (Math.abs(leftHeight - rightHeight) > 1) return -1;

    return 1 + Math.max(leftHeight, rightHeight);
}
```

---

### Problem 113: Same Tree

**LeetCode 100** 🔗 https://leetcode.com/problems/same-tree/

```
┌────────────────────────────────────────────────────────────────┐
│  SAME TREE - Check if two trees are identical                  │
├────────────────────────────────────────────────────────────────┤
│      1         1                    1         1                │
│     / \       / \                  / \       / \               │
│    2   3     2   3                2   1     1   2              │
│                                                                │
│  Same: true                      Same: false                   │
│                                  (structure same, values diff) │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public boolean isSameTree(TreeNode p, TreeNode q) {
    // Both null
    if (p == null && q == null) return true;

    // One null, other not
    if (p == null || q == null) return false;

    // Values different
    if (p.val != q.val) return false;

    // Check both subtrees
    return isSameTree(p.left, q.left) && isSameTree(p.right, q.right);
}
```

---

### Problem 114: Symmetric Tree

**LeetCode 101** 🔗 https://leetcode.com/problems/symmetric-tree/

```
┌────────────────────────────────────────────────────────────────┐
│  SYMMETRIC TREE - Mirror image of itself                       │
├────────────────────────────────────────────────────────────────┤
│  Symmetric:                    Not Symmetric:                  │
│        1                            1                          │
│       / \                          / \                         │
│      2   2                        2   2                        │
│     / \ / \                        \   \                       │
│    3  4 4  3                        3   3                      │
│                                                                │
│  Check: left.left == right.right AND left.right == right.left │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public boolean isSymmetric(TreeNode root) {
    if (root == null) return true;
    return isMirror(root.left, root.right);
}

private boolean isMirror(TreeNode left, TreeNode right) {
    if (left == null && right == null) return true;
    if (left == null || right == null) return false;

    return (left.val == right.val) &&
           isMirror(left.left, right.right) &&
           isMirror(left.right, right.left);
}

// Iterative with Queue
public boolean isSymmetricIterative(TreeNode root) {
    if (root == null) return true;

    Queue<TreeNode> queue = new LinkedList<>();
    queue.offer(root.left);
    queue.offer(root.right);

    while (!queue.isEmpty()) {
        TreeNode left = queue.poll();
        TreeNode right = queue.poll();

        if (left == null && right == null) continue;
        if (left == null || right == null) return false;
        if (left.val != right.val) return false;

        queue.offer(left.left);
        queue.offer(right.right);
        queue.offer(left.right);
        queue.offer(right.left);
    }

    return true;
}
```

---

### Problem 115: Invert Binary Tree

**LeetCode 226** 🔗 https://leetcode.com/problems/invert-binary-tree/

```
┌────────────────────────────────────────────────────────────────┐
│  INVERT BINARY TREE - Mirror/Flip the tree                     │
├────────────────────────────────────────────────────────────────┤
│  Input:           Output:                                      │
│       4               4                                        │
│      / \             / \                                       │
│     2   7    →      7   2                                      │
│    / \ / \         / \ / \                                     │
│   1  3 6  9       9  6 3  1                                    │
│                                                                │
│  At each node: swap left and right children                    │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public TreeNode invertTree(TreeNode root) {
    if (root == null) return null;

    // Swap children
    TreeNode temp = root.left;
    root.left = root.right;
    root.right = temp;

    // Recursively invert subtrees
    invertTree(root.left);
    invertTree(root.right);

    return root;
}
```

---

## 8.3 Path & Sum Problems

### Problem 116: Path Sum

**LeetCode 112** 🔗 https://leetcode.com/problems/path-sum/

```
┌────────────────────────────────────────────────────────────────┐
│  PATH SUM - Root to leaf path with target sum                  │
├────────────────────────────────────────────────────────────────┤
│  targetSum = 22                                                │
│                                                                │
│         5                                                      │
│        / \                                                     │
│       4   8         Path: 5→4→11→2 = 22 ✓                      │
│      /   / \                                                   │
│     11  13  4                                                  │
│    /  \      \                                                 │
│   7    2      1                                                │
│                                                                │
│  ⚠️ Must reach a LEAF node (no children)                       │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public boolean hasPathSum(TreeNode root, int targetSum) {
    if (root == null) return false;

    // Reached a leaf
    if (root.left == null && root.right == null) {
        return root.val == targetSum;
    }

    // Continue to children with reduced sum
    int remaining = targetSum - root.val;
    return hasPathSum(root.left, remaining) ||
           hasPathSum(root.right, remaining);
}
```

---

### Problem 117: Path Sum II

**LeetCode 113** 🔗 https://leetcode.com/problems/path-sum-ii/

```
┌────────────────────────────────────────────────────────────────┐
│  PATH SUM II - Find ALL paths with target sum                  │
├────────────────────────────────────────────────────────────────┤
│  targetSum = 22                                                │
│                                                                │
│         5                                                      │
│        / \                                                     │
│       4   8                                                    │
│      /   / \                                                   │
│     11  13  4                                                  │
│    /  \    / \                                                 │
│   7    2  5   1                                                │
│                                                                │
│  Output: [[5,4,11,2], [5,8,4,5]]                               │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public List<List<Integer>> pathSum(TreeNode root, int targetSum) {
    List<List<Integer>> result = new ArrayList<>();
    backtrack(root, targetSum, new ArrayList<>(), result);
    return result;
}

private void backtrack(TreeNode node, int remaining,
                       List<Integer> path, List<List<Integer>> result) {
    if (node == null) return;

    path.add(node.val);

    // Found valid path to leaf
    if (node.left == null && node.right == null && node.val == remaining) {
        result.add(new ArrayList<>(path));
    } else {
        backtrack(node.left, remaining - node.val, path, result);
        backtrack(node.right, remaining - node.val, path, result);
    }

    // Backtrack
    path.remove(path.size() - 1);
}
```

---

### Problem 118: 🔒 Path Sum III (LeetCode 437)

**LeetCode 437** 🔗 https://leetcode.com/problems/path-sum-iii/

```
┌────────────────────────────────────────────────────────────────┐
│  PATH SUM III - Path doesn't need to start at root or end      │
│  at leaf, but must go downwards                                │
├────────────────────────────────────────────────────────────────┤
│  targetSum = 8                                                 │
│                                                                │
│        10                                                      │
│       /  \                                                     │
│      5   -3                                                    │
│     / \    \                                                   │
│    3   2   11                                                  │
│   / \   \                                                      │
│  3  -2   1                                                     │
│                                                                │
│  Paths that sum to 8:                                          │
│  1. 5→3 = 8                                                    │
│  2. 5→2→1 = 8                                                  │
│  3. -3→11 = 8                                                  │
│  Output: 3                                                     │
│                                                                │
│  Use Prefix Sum technique with HashMap!                        │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int pathSum(TreeNode root, int targetSum) {
    Map<Long, Integer> prefixSumCount = new HashMap<>();
    prefixSumCount.put(0L, 1);  // Empty path

    return dfs(root, 0, targetSum, prefixSumCount);
}

private int dfs(TreeNode node, long currentSum, int target,
                Map<Long, Integer> prefixSumCount) {
    if (node == null) return 0;

    currentSum += node.val;

    // Check if (currentSum - target) exists as a previous prefix sum
    int count = prefixSumCount.getOrDefault(currentSum - target, 0);

    // Add current prefix sum to map
    prefixSumCount.merge(currentSum, 1, Integer::sum);

    // Recurse
    count += dfs(node.left, currentSum, target, prefixSumCount);
    count += dfs(node.right, currentSum, target, prefixSumCount);

    // Backtrack - remove current prefix sum
    prefixSumCount.merge(currentSum, -1, Integer::sum);

    return count;
}
```

---

### Problem 119: Binary Tree Maximum Path Sum

**LeetCode 124** 🔗 https://leetcode.com/problems/binary-tree-maximum-path-sum/

```
┌────────────────────────────────────────────────────────────────┐
│  MAXIMUM PATH SUM - Path can start and end at any node         │
├────────────────────────────────────────────────────────────────┤
│      -10                                                       │
│      /  \                                                      │
│     9   20                                                     │
│        /  \                                                    │
│       15   7                                                   │
│                                                                │
│  Max path: 15→20→7 = 42                                        │
│                                                                │
│  At each node, we can:                                         │
│  1. Include node + left path                                   │
│  2. Include node + right path                                  │
│  3. Include node + both paths (forms arch)                     │
│  4. Just the node itself                                       │
│                                                                │
│  ⚠️ Path that goes through root can't extend further up        │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
private int maxSum;

public int maxPathSum(TreeNode root) {
    maxSum = Integer.MIN_VALUE;
    maxGain(root);
    return maxSum;
}

private int maxGain(TreeNode node) {
    if (node == null) return 0;

    // Max sum of left/right paths (ignore negative paths)
    int leftGain = Math.max(maxGain(node.left), 0);
    int rightGain = Math.max(maxGain(node.right), 0);

    // Path through current node (arch shape)
    int pathThroughNode = node.val + leftGain + rightGain;
    maxSum = Math.max(maxSum, pathThroughNode);

    // Return max path starting from this node going down one side
    return node.val + Math.max(leftGain, rightGain);
}
```

---

### Problem 120: Diameter of Binary Tree

**LeetCode 543** 🔗 https://leetcode.com/problems/diameter-of-binary-tree/

```
┌────────────────────────────────────────────────────────────────┐
│  DIAMETER - Longest path between any two nodes (in edges)      │
├────────────────────────────────────────────────────────────────┤
│          1                                                     │
│         / \                                                    │
│        2   3                                                   │
│       / \                                                      │
│      4   5                                                     │
│                                                                │
│  Longest path: 4→2→1→3 or 5→2→1→3 = 3 edges                    │
│  Diameter = 3                                                  │
│                                                                │
│  Note: Path may NOT pass through root!                         │
│          1                                                     │
│         /                                                      │
│        2        Diameter = 4→2→5→6→7 = 4                       │
│       / \                                                      │
│      4   5                                                     │
│         / \                                                    │
│        6   7                                                   │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
private int diameter;

public int diameterOfBinaryTree(TreeNode root) {
    diameter = 0;
    depth(root);
    return diameter;
}

private int depth(TreeNode node) {
    if (node == null) return 0;

    int leftDepth = depth(node.left);
    int rightDepth = depth(node.right);

    // Diameter through this node = left depth + right depth
    diameter = Math.max(diameter, leftDepth + rightDepth);

    return 1 + Math.max(leftDepth, rightDepth);
}
```

---

## 8.4 Binary Search Tree (BST) Problems

```
┌────────────────────────────────────────────────────────────────┐
│  BINARY SEARCH TREE PROPERTY                                   │
├────────────────────────────────────────────────────────────────┤
│  For every node:                                               │
│  - All values in LEFT subtree < node value                     │
│  - All values in RIGHT subtree > node value                    │
│                                                                │
│         8                                                      │
│        / \                                                     │
│       3   10        Valid BST:                                 │
│      / \    \       - Left of 8: {1,3,6} all < 8              │
│     1   6    14     - Right of 8: {10,14} all > 8             │
│        / \   /      - Inorder: 1,3,6,8,10,13,14 (sorted!)     │
│       4   7 13                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

### Problem 121: Validate Binary Search Tree

**LeetCode 98** 🔗 https://leetcode.com/problems/validate-binary-search-tree/

```
┌────────────────────────────────────────────────────────────────┐
│  VALIDATE BST                                                  │
├────────────────────────────────────────────────────────────────┤
│  Valid BST:           Invalid BST:                             │
│       2                    5                                   │
│      / \                  / \                                  │
│     1   3                1   4  ← 4 < 5 but 3 > right val!    │
│                             / \                                │
│  true                      3   6                               │
│                                                                │
│  ⚠️ Common mistake: Only checking immediate children           │
│  Must check against valid RANGE for each node                  │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public boolean isValidBST(TreeNode root) {
    return validate(root, Long.MIN_VALUE, Long.MAX_VALUE);
}

private boolean validate(TreeNode node, long min, long max) {
    if (node == null) return true;

    // Check if value is within valid range
    if (node.val <= min || node.val >= max) return false;

    // Left subtree: all values must be < node.val
    // Right subtree: all values must be > node.val
    return validate(node.left, min, node.val) &&
           validate(node.right, node.val, max);
}

// Alternative: Inorder traversal should be sorted
public boolean isValidBSTInorder(TreeNode root) {
    Stack<TreeNode> stack = new Stack<>();
    TreeNode prev = null;
    TreeNode curr = root;

    while (curr != null || !stack.isEmpty()) {
        while (curr != null) {
            stack.push(curr);
            curr = curr.left;
        }

        curr = stack.pop();

        // Check if inorder is sorted
        if (prev != null && curr.val <= prev.val) return false;
        prev = curr;

        curr = curr.right;
    }

    return true;
}
```

---

### Problem 122: Search in a Binary Search Tree

**LeetCode 700** 🔗 https://leetcode.com/problems/search-in-a-binary-search-tree/

```
┌────────────────────────────────────────────────────────────────┐
│  SEARCH IN BST                                                 │
├────────────────────────────────────────────────────────────────┤
│       4                  Search for 2:                         │
│      / \                 4 > 2 → go left                       │
│     2   7                2 == 2 → found!                       │
│    / \                                                         │
│   1   3                  Return subtree rooted at 2            │
│                                                                │
│  Time: O(h) where h = height (O(log n) for balanced)           │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public TreeNode searchBST(TreeNode root, int val) {
    if (root == null || root.val == val) return root;

    return val < root.val ?
           searchBST(root.left, val) :
           searchBST(root.right, val);
}

// Iterative
public TreeNode searchBSTIterative(TreeNode root, int val) {
    while (root != null && root.val != val) {
        root = val < root.val ? root.left : root.right;
    }
    return root;
}
```

---

### Problem 123: Lowest Common Ancestor of a BST

**LeetCode 235** 🔗 https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/

```
┌────────────────────────────────────────────────────────────────┐
│  LOWEST COMMON ANCESTOR (LCA) in BST                           │
├────────────────────────────────────────────────────────────────┤
│         6                                                      │
│        / \                                                     │
│       2   8                                                    │
│      / \ / \                                                   │
│     0  4 7  9         LCA(2, 8) = 6                            │
│       / \             LCA(2, 4) = 2                            │
│      3   5            LCA(3, 5) = 4                            │
│                                                                │
│  BST Property helps:                                           │
│  - If both < node → LCA is in left                             │
│  - If both > node → LCA is in right                            │
│  - Otherwise, current node is LCA (split point)                │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {
    while (root != null) {
        if (p.val < root.val && q.val < root.val) {
            root = root.left;   // Both in left subtree
        } else if (p.val > root.val && q.val > root.val) {
            root = root.right;  // Both in right subtree
        } else {
            return root;  // Split point - this is LCA
        }
    }
    return null;
}
```

---

### Problem 124: Lowest Common Ancestor of a Binary Tree

**LeetCode 236** 🔗 https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/

```
┌────────────────────────────────────────────────────────────────┐
│  LCA in General Binary Tree (not BST)                          │
├────────────────────────────────────────────────────────────────┤
│         3                                                      │
│        / \                                                     │
│       5   1                                                    │
│      / \ / \                                                   │
│     6  2 0  8        LCA(5, 1) = 3                             │
│       / \            LCA(5, 4) = 5                             │
│      7   4           LCA(6, 4) = 5                             │
│                                                                │
│  General approach (no BST property):                           │
│  - Search both subtrees for p and q                            │
│  - If found in different subtrees → current is LCA             │
│  - If both in same subtree → recurse                           │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {
    if (root == null || root == p || root == q) return root;

    TreeNode left = lowestCommonAncestor(root.left, p, q);
    TreeNode right = lowestCommonAncestor(root.right, p, q);

    // p and q found in different subtrees
    if (left != null && right != null) return root;

    // Both in same subtree
    return left != null ? left : right;
}
```

---

### Problem 125: Kth Smallest Element in a BST

**LeetCode 230** 🔗 https://leetcode.com/problems/kth-smallest-element-in-a-bst/

```
┌────────────────────────────────────────────────────────────────┐
│  Kth SMALLEST IN BST                                           │
├────────────────────────────────────────────────────────────────┤
│       3                                                        │
│      / \         Inorder: [1, 2, 3, 4]                         │
│     1   4                                                      │
│      \           k=1 → return 1                                │
│       2          k=2 → return 2                                │
│                  k=3 → return 3                                │
│                                                                │
│  Inorder traversal of BST gives sorted order!                  │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int kthSmallest(TreeNode root, int k) {
    Stack<TreeNode> stack = new Stack<>();
    TreeNode curr = root;

    while (curr != null || !stack.isEmpty()) {
        while (curr != null) {
            stack.push(curr);
            curr = curr.left;
        }

        curr = stack.pop();
        k--;

        if (k == 0) return curr.val;

        curr = curr.right;
    }

    return -1;  // k is invalid
}
```

---

### Problem 126: 🔒 Inorder Successor in BST (LeetCode 285 - Premium)

```
┌────────────────────────────────────────────────────────────────┐
│  INORDER SUCCESSOR IN BST                                      │
├────────────────────────────────────────────────────────────────┤
│  Given a BST and a node p, find the in-order successor of      │
│  that node (smallest node greater than p).                     │
│                                                                │
│       5                                                        │
│      / \                                                       │
│     3   6                                                      │
│    / \                                                         │
│   2   4           Successor(3) = 4                             │
│  /                Successor(4) = 5                             │
│ 1                 Successor(6) = null                          │
│                                                                │
│  If p has right child → leftmost in right subtree              │
│  Else → nearest ancestor where p is in left subtree            │
│                                                                │
│  Constraints:                                                  │
│  - Number of nodes: [1, 10^4]                                  │
│  - All node values unique                                      │
│  - p exists in the tree                                        │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public TreeNode inorderSuccessor(TreeNode root, TreeNode p) {
    TreeNode successor = null;

    while (root != null) {
        if (p.val < root.val) {
            successor = root;  // Current node could be successor
            root = root.left;
        } else {
            root = root.right;  // Successor must be in right
        }
    }

    return successor;
}
```

---

## 8.5 Tree Construction Problems

### Problem 127: Construct Binary Tree from Preorder and Inorder

**LeetCode 105** 🔗 https://leetcode.com/problems/construct-binary-tree-from-preorder-and-inorder-traversal/

```
┌────────────────────────────────────────────────────────────────┐
│  BUILD TREE FROM PREORDER & INORDER                            │
├────────────────────────────────────────────────────────────────┤
│  preorder = [3, 9, 20, 15, 7]  (Root, Left, Right)             │
│  inorder  = [9, 3, 15, 20, 7]  (Left, Root, Right)             │
│                                                                │
│  Step 1: First preorder element (3) is ROOT                    │
│  Step 2: Find 3 in inorder → splits left [9] and right [15,20,7]│
│  Step 3: Recursively build subtrees                            │
│                                                                │
│        3                                                       │
│       / \                                                      │
│      9  20                                                     │
│        /  \                                                    │
│       15   7                                                   │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
private int preorderIndex;
private Map<Integer, Integer> inorderIndexMap;

public TreeNode buildTree(int[] preorder, int[] inorder) {
    preorderIndex = 0;
    inorderIndexMap = new HashMap<>();

    // Store inorder indices for O(1) lookup
    for (int i = 0; i < inorder.length; i++) {
        inorderIndexMap.put(inorder[i], i);
    }

    return build(preorder, 0, inorder.length - 1);
}

private TreeNode build(int[] preorder, int left, int right) {
    if (left > right) return null;

    // Root is next element in preorder
    int rootVal = preorder[preorderIndex++];
    TreeNode root = new TreeNode(rootVal);

    // Find root position in inorder
    int inorderIndex = inorderIndexMap.get(rootVal);

    // Build left subtree (elements before root in inorder)
    root.left = build(preorder, left, inorderIndex - 1);
    // Build right subtree (elements after root in inorder)
    root.right = build(preorder, inorderIndex + 1, right);

    return root;
}
```

---

### Problem 128: Construct Binary Tree from Inorder and Postorder

**LeetCode 106** 🔗 https://leetcode.com/problems/construct-binary-tree-from-inorder-and-postorder-traversal/

```
┌────────────────────────────────────────────────────────────────┐
│  BUILD TREE FROM INORDER & POSTORDER                           │
├────────────────────────────────────────────────────────────────┤
│  inorder   = [9, 3, 15, 20, 7]  (Left, Root, Right)            │
│  postorder = [9, 15, 7, 20, 3]  (Left, Right, Root)            │
│                                                                │
│  LAST postorder element (3) is ROOT                            │
│  Process postorder from END (right to left)                    │
│  Build RIGHT subtree before LEFT (reverse of preorder)         │
│                                                                │
│        3                                                       │
│       / \                                                      │
│      9  20                                                     │
│        /  \                                                    │
│       15   7                                                   │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
private int postorderIndex;
private Map<Integer, Integer> inorderIndexMap;

public TreeNode buildTree(int[] inorder, int[] postorder) {
    postorderIndex = postorder.length - 1;
    inorderIndexMap = new HashMap<>();

    for (int i = 0; i < inorder.length; i++) {
        inorderIndexMap.put(inorder[i], i);
    }

    return build(postorder, 0, inorder.length - 1);
}

private TreeNode build(int[] postorder, int left, int right) {
    if (left > right) return null;

    int rootVal = postorder[postorderIndex--];
    TreeNode root = new TreeNode(rootVal);

    int inorderIndex = inorderIndexMap.get(rootVal);

    // Build RIGHT first (postorder processes right before left)
    root.right = build(postorder, inorderIndex + 1, right);
    root.left = build(postorder, left, inorderIndex - 1);

    return root;
}
```

---

### Problem 129: Serialize and Deserialize Binary Tree

**LeetCode 297** 🔗 https://leetcode.com/problems/serialize-and-deserialize-binary-tree/

```
┌────────────────────────────────────────────────────────────────┐
│  SERIALIZE AND DESERIALIZE BINARY TREE                         │
├────────────────────────────────────────────────────────────────┤
│       1                                                        │
│      / \         Serialize: "1,2,null,null,3,4,null,null,5"    │
│     2   3        (Preorder with null markers)                  │
│        / \                                                     │
│       4   5      Deserialize: Rebuild from string              │
│                                                                │
│  Using preorder traversal with null markers works because      │
│  null positions indicate exact tree structure                  │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public class Codec {

    // Serialize: Preorder traversal with null markers
    public String serialize(TreeNode root) {
        StringBuilder sb = new StringBuilder();
        serializeHelper(root, sb);
        return sb.toString();
    }

    private void serializeHelper(TreeNode node, StringBuilder sb) {
        if (node == null) {
            sb.append("null,");
            return;
        }

        sb.append(node.val).append(",");
        serializeHelper(node.left, sb);
        serializeHelper(node.right, sb);
    }

    // Deserialize: Rebuild from preorder string
    public TreeNode deserialize(String data) {
        Queue<String> queue = new LinkedList<>(Arrays.asList(data.split(",")));
        return deserializeHelper(queue);
    }

    private TreeNode deserializeHelper(Queue<String> queue) {
        String val = queue.poll();

        if (val.equals("null")) return null;

        TreeNode node = new TreeNode(Integer.parseInt(val));
        node.left = deserializeHelper(queue);
        node.right = deserializeHelper(queue);

        return node;
    }
}
```

---

## 8.6 HackerEarth & Codeforces Tree Problems

### Problem 130: Count Leaf Nodes (HackerEarth)

```
┌────────────────────────────────────────────────────────────────┐
│  COUNT LEAF NODES                                              │
├────────────────────────────────────────────────────────────────┤
│  A leaf node has no children (both left and right are null).   │
│                                                                │
│        1                                                       │
│       / \                                                      │
│      2   3         Leaf nodes: 4, 5, 6                         │
│     / \   \        Count = 3                                   │
│    4   5   6                                                   │
│                                                                │
│  Constraints:                                                  │
│  - 1 <= n <= 10^5                                              │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int countLeaves(TreeNode root) {
    if (root == null) return 0;

    // Is a leaf
    if (root.left == null && root.right == null) return 1;

    return countLeaves(root.left) + countLeaves(root.right);
}
```

---

### Problem 131: Sum of All Nodes (HackerEarth)

```
┌────────────────────────────────────────────────────────────────┐
│  SUM OF ALL NODES                                              │
├────────────────────────────────────────────────────────────────┤
│        1                                                       │
│       / \                                                      │
│      2   3         Sum = 1 + 2 + 3 + 4 + 5 + 6 = 21            │
│     / \   \                                                    │
│    4   5   6                                                   │
│                                                                │
│  Simple DFS traversal                                          │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int sumOfNodes(TreeNode root) {
    if (root == null) return 0;

    return root.val + sumOfNodes(root.left) + sumOfNodes(root.right);
}
```

---

### Problem 132: Level with Maximum Sum (Codeforces-style)

```
┌────────────────────────────────────────────────────────────────┐
│  LEVEL WITH MAXIMUM SUM                                        │
├────────────────────────────────────────────────────────────────┤
│  Find the level (1-indexed) with the maximum sum.              │
│                                                                │
│        1          Level 1: sum = 1                             │
│       / \         Level 2: sum = 2 + 3 = 5                     │
│      2   3        Level 3: sum = 4 + 5 + 6 = 15 ← Maximum      │
│     / \   \                                                    │
│    4   5   6      Output: 3                                    │
│                                                                │
│  Constraints:                                                  │
│  - 1 <= n <= 10^4                                              │
│  - -10^5 <= node.val <= 10^5                                   │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int maxLevelSum(TreeNode root) {
    if (root == null) return 0;

    Queue<TreeNode> queue = new LinkedList<>();
    queue.offer(root);

    int maxSum = Integer.MIN_VALUE;
    int maxLevel = 1;
    int currentLevel = 0;

    while (!queue.isEmpty()) {
        currentLevel++;
        int levelSize = queue.size();
        int levelSum = 0;

        for (int i = 0; i < levelSize; i++) {
            TreeNode node = queue.poll();
            levelSum += node.val;

            if (node.left != null) queue.offer(node.left);
            if (node.right != null) queue.offer(node.right);
        }

        if (levelSum > maxSum) {
            maxSum = levelSum;
            maxLevel = currentLevel;
        }
    }

    return maxLevel;
}
```

---

### Problem 133: Print Nodes at K Distance (HackerEarth)

```
┌────────────────────────────────────────────────────────────────┐
│  NODES AT K DISTANCE FROM ROOT                                 │
├────────────────────────────────────────────────────────────────┤
│        1          k = 2                                        │
│       / \                                                      │
│      2   3        Nodes at distance 2: [4, 5, 6]               │
│     / \   \                                                    │
│    4   5   6                                                   │
│                                                                │
│  Distance from root = Level - 1                                │
│  Nodes at distance k are at level k+1                          │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public List<Integer> nodesAtKDistance(TreeNode root, int k) {
    List<Integer> result = new ArrayList<>();
    findNodes(root, k, result);
    return result;
}

private void findNodes(TreeNode node, int k, List<Integer> result) {
    if (node == null) return;

    if (k == 0) {
        result.add(node.val);
        return;
    }

    findNodes(node.left, k - 1, result);
    findNodes(node.right, k - 1, result);
}
```

---

### Problem 134: Check if Tree is Complete (Codeforces-style)

```
┌────────────────────────────────────────────────────────────────┐
│  CHECK IF COMPLETE BINARY TREE                                 │
├────────────────────────────────────────────────────────────────┤
│  A complete binary tree has all levels filled except possibly  │
│  the last, and all nodes in last level are as left as possible.│
│                                                                │
│  Complete:              Not Complete:                          │
│       1                      1                                 │
│      / \                    / \                                │
│     2   3                  2   3                               │
│    / \                    / \   \                              │
│   4   5                  4   5   6  (gap at left of last level)│
│                                                                │
│  BFS approach: After seeing first null, no more non-null nodes │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public boolean isCompleteTree(TreeNode root) {
    if (root == null) return true;

    Queue<TreeNode> queue = new LinkedList<>();
    queue.offer(root);
    boolean seenNull = false;

    while (!queue.isEmpty()) {
        TreeNode node = queue.poll();

        if (node == null) {
            seenNull = true;
        } else {
            // If we've seen null and now see non-null, not complete
            if (seenNull) return false;

            queue.offer(node.left);
            queue.offer(node.right);
        }
    }

    return true;
}
```

---

### Problem 135: Left View of Binary Tree (HackerEarth)

```
┌────────────────────────────────────────────────────────────────┐
│  LEFT VIEW OF BINARY TREE                                      │
├────────────────────────────────────────────────────────────────┤
│  Print first node of each level (as seen from left side)       │
│                                                                │
│        1     ←                                                 │
│       / \                                                      │
│      2   3   ← (2 is leftmost at this level)                   │
│       \   \                                                    │
│        5   4 ← (5 is leftmost at this level)                   │
│                                                                │
│  Left view: [1, 2, 5]                                          │
│                                                                │
│  Right view would be: [1, 3, 4]                                │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public List<Integer> leftSideView(TreeNode root) {
    List<Integer> result = new ArrayList<>();
    if (root == null) return result;

    Queue<TreeNode> queue = new LinkedList<>();
    queue.offer(root);

    while (!queue.isEmpty()) {
        int levelSize = queue.size();

        for (int i = 0; i < levelSize; i++) {
            TreeNode node = queue.poll();

            // First node of each level
            if (i == 0) {
                result.add(node.val);
            }

            if (node.left != null) queue.offer(node.left);
            if (node.right != null) queue.offer(node.right);
        }
    }

    return result;
}

// Recursive approach
public List<Integer> leftSideViewDFS(TreeNode root) {
    List<Integer> result = new ArrayList<>();
    dfs(root, 0, result);
    return result;
}

private void dfs(TreeNode node, int level, List<Integer> result) {
    if (node == null) return;

    // First time visiting this level
    if (level == result.size()) {
        result.add(node.val);
    }

    dfs(node.left, level + 1, result);  // Visit left first for left view
    dfs(node.right, level + 1, result);
}
```

---

# 📚 SECTION 9: GRAPH ALGORITHMS

```
┌─────────────────────────────────────────────────────────────────┐
│                    GRAPH FUNDAMENTALS                           │
├─────────────────────────────────────────────────────────────────┤
│  GRAPH REPRESENTATION:                                          │
│                                                                 │
│  1. Adjacency List (Most common):                               │
│     0 → [1, 2]                     0 ─── 1                      │
│     1 → [0, 2, 3]                  │ \   │                      │
│     2 → [0, 1]                     │  \  │                      │
│     3 → [1]                        2 ─── 3                      │
│                                                                 │
│  2. Adjacency Matrix:                                           │
│       0  1  2  3                                                │
│     ┌─────────────┐                                             │
│   0 │ 0  1  1  0 │                                              │
│   1 │ 1  0  1  1 │                                              │
│   2 │ 1  1  0  0 │                                              │
│   3 │ 0  1  0  0 │                                              │
│     └─────────────┘                                             │
│                                                                 │
│  3. Edge List: [(0,1), (0,2), (1,2), (1,3)]                     │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  DFS vs BFS:                                                    │
│  ┌─────────────────────┬─────────────────────────────┐          │
│  │ DFS (Stack/Recursion)│ BFS (Queue)                │          │
│  │ - Go deep first      │ - Go level by level        │          │
│  │ - Detect cycles      │ - Shortest path (unweight) │          │
│  │ - Path finding       │ - Level order traversal    │          │
│  │ - Topological sort   │ - Min steps problems       │          │
│  │ - Connected comp     │ - Bipartite check          │          │
│  └─────────────────────┴─────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9.1 Graph Traversal (BFS/DFS)

### Problem 136: Number of Islands

**LeetCode 200** 🔗 https://leetcode.com/problems/number-of-islands/

```
┌────────────────────────────────────────────────────────────────┐
│  NUMBER OF ISLANDS - Count connected components of '1's        │
├────────────────────────────────────────────────────────────────┤
│  grid = [                                                      │
│    ["1","1","0","0","0"],                                       │
│    ["1","1","0","0","0"],   Island 1: top-left 1s              │
│    ["0","0","1","0","0"],   Island 2: middle 1                 │
│    ["0","0","0","1","1"]    Island 3: bottom-right 1s          │
│  ]                                                             │
│                                                                │
│  Visual:                                                       │
│  ┌───┬───┬───┬───┬───┐                                         │
│  │ 1 │ 1 │ 0 │ 0 │ 0 │   🏝️ Island 1                           │
│  ├───┼───┼───┼───┼───┤                                         │
│  │ 1 │ 1 │ 0 │ 0 │ 0 │                                         │
│  ├───┼───┼───┼───┼───┤                                         │
│  │ 0 │ 0 │ 1 │ 0 │ 0 │   🏝️ Island 2                           │
│  ├───┼───┼───┼───┼───┤                                         │
│  │ 0 │ 0 │ 0 │ 1 │ 1 │   🏝️ Island 3                           │
│  └───┴───┴───┴───┴───┘                                         │
│                                                                │
│  Output: 3                                                     │
└────────────────────────────────────────────────────────────────┘
```

**Solution (DFS):**

```java
public int numIslands(char[][] grid) {
    if (grid == null || grid.length == 0) return 0;

    int count = 0;
    int rows = grid.length, cols = grid[0].length;

    for (int i = 0; i < rows; i++) {
        for (int j = 0; j < cols; j++) {
            if (grid[i][j] == '1') {
                count++;
                dfs(grid, i, j);  // Sink the island
            }
        }
    }

    return count;
}

private void dfs(char[][] grid, int i, int j) {
    // Boundary check and water check
    if (i < 0 || i >= grid.length || j < 0 || j >= grid[0].length
        || grid[i][j] == '0') {
        return;
    }

    grid[i][j] = '0';  // Mark as visited (sink)

    // Explore 4 directions
    dfs(grid, i + 1, j);  // Down
    dfs(grid, i - 1, j);  // Up
    dfs(grid, i, j + 1);  // Right
    dfs(grid, i, j - 1);  // Left
}
```

**Solution (BFS):**

```java
public int numIslandsBFS(char[][] grid) {
    if (grid == null || grid.length == 0) return 0;

    int count = 0;
    int rows = grid.length, cols = grid[0].length;
    int[][] directions = {{1,0}, {-1,0}, {0,1}, {0,-1}};

    for (int i = 0; i < rows; i++) {
        for (int j = 0; j < cols; j++) {
            if (grid[i][j] == '1') {
                count++;

                Queue<int[]> queue = new LinkedList<>();
                queue.offer(new int[]{i, j});
                grid[i][j] = '0';

                while (!queue.isEmpty()) {
                    int[] cell = queue.poll();

                    for (int[] dir : directions) {
                        int ni = cell[0] + dir[0];
                        int nj = cell[1] + dir[1];

                        if (ni >= 0 && ni < rows && nj >= 0 && nj < cols
                            && grid[ni][nj] == '1') {
                            queue.offer(new int[]{ni, nj});
                            grid[ni][nj] = '0';
                        }
                    }
                }
            }
        }
    }

    return count;
}
```

---

### Problem 137: Max Area of Island

**LeetCode 695** 🔗 https://leetcode.com/problems/max-area-of-island/

```
┌────────────────────────────────────────────────────────────────┐
│  MAX AREA OF ISLAND                                            │
├────────────────────────────────────────────────────────────────┤
│  grid = [                                                      │
│    [0,0,1,0,0,0,0,1,0,0,0,0,0],                                 │
│    [0,0,0,0,0,0,0,1,1,1,0,0,0],                                 │
│    [0,1,1,0,1,0,0,0,0,0,0,0,0],                                 │
│    [0,1,0,0,1,1,0,0,1,0,1,0,0],                                 │
│    [0,1,0,0,1,1,0,0,1,1,1,0,0],                                 │
│    [0,0,0,0,0,0,0,0,0,0,1,0,0],                                 │
│    [0,0,0,0,0,0,0,1,1,1,0,0,0],                                 │
│    [0,0,0,0,0,0,0,1,1,0,0,0,0]                                  │
│  ]                                                             │
│                                                                │
│  Maximum area = 6 (the island in middle-right)                 │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int maxAreaOfIsland(int[][] grid) {
    int maxArea = 0;

    for (int i = 0; i < grid.length; i++) {
        for (int j = 0; j < grid[0].length; j++) {
            if (grid[i][j] == 1) {
                maxArea = Math.max(maxArea, dfs(grid, i, j));
            }
        }
    }

    return maxArea;
}

private int dfs(int[][] grid, int i, int j) {
    if (i < 0 || i >= grid.length || j < 0 || j >= grid[0].length
        || grid[i][j] == 0) {
        return 0;
    }

    grid[i][j] = 0;  // Mark visited

    return 1 + dfs(grid, i+1, j) + dfs(grid, i-1, j)
             + dfs(grid, i, j+1) + dfs(grid, i, j-1);
}
```

---

### Problem 138: Clone Graph

**LeetCode 133** 🔗 https://leetcode.com/problems/clone-graph/

```
┌────────────────────────────────────────────────────────────────┐
│  CLONE GRAPH - Deep copy of undirected graph                   │
├────────────────────────────────────────────────────────────────┤
│  Input:                   Output (Clone):                      │
│      1 ─── 2                  1' ─── 2'                        │
│      │     │                  │      │                         │
│      │     │                  │      │                         │
│      4 ─── 3                  4' ─── 3'                        │
│                                                                │
│  Each node has: val, List<Node> neighbors                      │
│                                                                │
│  Key: Use HashMap to track original → clone mapping            │
│  Prevents infinite loop when graph has cycles                  │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
private Map<Node, Node> visited = new HashMap<>();

public Node cloneGraph(Node node) {
    if (node == null) return null;

    // Already cloned
    if (visited.containsKey(node)) {
        return visited.get(node);
    }

    // Create clone
    Node clone = new Node(node.val, new ArrayList<>());
    visited.put(node, clone);

    // Clone neighbors
    for (Node neighbor : node.neighbors) {
        clone.neighbors.add(cloneGraph(neighbor));
    }

    return clone;
}
```

---

### Problem 139: Flood Fill

**LeetCode 733** 🔗 https://leetcode.com/problems/flood-fill/

```
┌────────────────────────────────────────────────────────────────┐
│  FLOOD FILL - Like paint bucket tool                           │
├────────────────────────────────────────────────────────────────┤
│  image = [[1,1,1],    sr=1, sc=1, color=2                      │
│           [1,1,0],                                             │
│           [1,0,1]]                                             │
│                                                                │
│  Start at (1,1), change all connected 1s to 2:                 │
│                                                                │
│  Before:          After:                                       │
│  ┌───┬───┬───┐    ┌───┬───┬───┐                                │
│  │ 1 │ 1 │ 1 │    │ 2 │ 2 │ 2 │                                │
│  ├───┼───┼───┤    ├───┼───┼───┤                                │
│  │ 1 │ 1 │ 0 │ →  │ 2 │ 2 │ 0 │                                │
│  ├───┼───┼───┤    ├───┼───┼───┤                                │
│  │ 1 │ 0 │ 1 │    │ 2 │ 0 │ 1 │                                │
│  └───┴───┴───┘    └───┴───┴───┘                                │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int[][] floodFill(int[][] image, int sr, int sc, int color) {
    int originalColor = image[sr][sc];

    // Avoid infinite loop if same color
    if (originalColor != color) {
        dfs(image, sr, sc, originalColor, color);
    }

    return image;
}

private void dfs(int[][] image, int r, int c, int original, int newColor) {
    if (r < 0 || r >= image.length || c < 0 || c >= image[0].length
        || image[r][c] != original) {
        return;
    }

    image[r][c] = newColor;

    dfs(image, r + 1, c, original, newColor);
    dfs(image, r - 1, c, original, newColor);
    dfs(image, r, c + 1, original, newColor);
    dfs(image, r, c - 1, original, newColor);
}
```

---

### Problem 140: Rotting Oranges

**LeetCode 994** 🔗 https://leetcode.com/problems/rotting-oranges/

```
┌────────────────────────────────────────────────────────────────┐
│  ROTTING ORANGES - Multi-source BFS                            │
├────────────────────────────────────────────────────────────────┤
│  0 = empty, 1 = fresh orange, 2 = rotten orange                │
│  Each minute, fresh oranges adjacent to rotten become rotten   │
│                                                                │
│  grid = [[2,1,1],                                              │
│          [1,1,0],                                              │
│          [0,1,1]]                                              │
│                                                                │
│  Minute 0:    Minute 1:    Minute 2:    Minute 3:    Minute 4: │
│  ┌───┬───┬───┐ ┌───┬───┬───┐ ┌───┬───┬───┐ ┌───┬───┬───┐ ┌───┬───┬───┐
│  │ 2 │ 1 │ 1 │ │ 2 │ 2 │ 1 │ │ 2 │ 2 │ 2 │ │ 2 │ 2 │ 2 │ │ 2 │ 2 │ 2 │
│  ├───┼───┼───┤ ├───┼───┼───┤ ├───┼───┼───┤ ├───┼───┼───┤ ├───┼───┼───┤
│  │ 1 │ 1 │ 0 │ │ 2 │ 1 │ 0 │ │ 2 │ 2 │ 0 │ │ 2 │ 2 │ 0 │ │ 2 │ 2 │ 0 │
│  ├───┼───┼───┤ ├───┼───┼───┤ ├───┼───┼───┤ ├───┼───┼───┤ ├───┼───┼───┤
│  │ 0 │ 1 │ 1 │ │ 0 │ 1 │ 1 │ │ 0 │ 1 │ 1 │ │ 0 │ 2 │ 1 │ │ 0 │ 2 │ 2 │
│  └───┴───┴───┘ └───┴───┴───┘ └───┴───┴───┘ └───┴───┴───┘ └───┴───┴───┘
│                                                                │
│  Output: 4 minutes                                             │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int orangesRotting(int[][] grid) {
    int rows = grid.length, cols = grid[0].length;
    Queue<int[]> queue = new LinkedList<>();
    int fresh = 0;

    // Find all rotten oranges and count fresh
    for (int i = 0; i < rows; i++) {
        for (int j = 0; j < cols; j++) {
            if (grid[i][j] == 2) {
                queue.offer(new int[]{i, j});
            } else if (grid[i][j] == 1) {
                fresh++;
            }
        }
    }

    if (fresh == 0) return 0;

    int[][] directions = {{1,0}, {-1,0}, {0,1}, {0,-1}};
    int minutes = 0;

    while (!queue.isEmpty()) {
        int size = queue.size();
        boolean rotted = false;

        for (int i = 0; i < size; i++) {
            int[] cell = queue.poll();

            for (int[] dir : directions) {
                int ni = cell[0] + dir[0];
                int nj = cell[1] + dir[1];

                if (ni >= 0 && ni < rows && nj >= 0 && nj < cols
                    && grid[ni][nj] == 1) {
                    grid[ni][nj] = 2;
                    fresh--;
                    queue.offer(new int[]{ni, nj});
                    rotted = true;
                }
            }
        }

        if (rotted) minutes++;
    }

    return fresh == 0 ? minutes : -1;
}
```

---

### Problem 141: 🔒 Walls and Gates (LeetCode 286 - Premium)

```
┌────────────────────────────────────────────────────────────────┐
│  WALLS AND GATES - Multi-source BFS from gates                 │
├────────────────────────────────────────────────────────────────┤
│  Given m x n grid:                                             │
│  -1 = Wall, 0 = Gate, INF = Empty room                         │
│                                                                │
│  Fill each empty room with distance to nearest gate.           │
│                                                                │
│  Input:                        Output:                         │
│  ┌─────┬─────┬─────┬─────┐    ┌─────┬─────┬─────┬─────┐        │
│  │ INF │  -1 │  0  │ INF │    │  3  │  -1 │  0  │  1  │        │
│  ├─────┼─────┼─────┼─────┤    ├─────┼─────┼─────┼─────┤        │
│  │ INF │ INF │ INF │  -1 │ →  │  2  │  2  │  1  │  -1 │        │
│  ├─────┼─────┼─────┼─────┤    ├─────┼─────┼─────┼─────┤        │
│  │ INF │  -1 │ INF │  -1 │    │  1  │  -1 │  2  │  -1 │        │
│  ├─────┼─────┼─────┼─────┤    ├─────┼─────┼─────┼─────┤        │
│  │  0  │  -1 │ INF │ INF │    │  0  │  -1 │  3  │  4  │        │
│  └─────┴─────┴─────┴─────┘    └─────┴─────┴─────┴─────┘        │
│                                                                │
│  Constraints:                                                  │
│  - m == rooms.length, n == rooms[i].length                     │
│  - 1 <= m, n <= 250                                            │
│  - rooms[i][j] is -1, 0, or 2^31 - 1                           │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public void wallsAndGates(int[][] rooms) {
    int rows = rooms.length, cols = rooms[0].length;
    int INF = Integer.MAX_VALUE;
    Queue<int[]> queue = new LinkedList<>();

    // Add all gates to queue
    for (int i = 0; i < rows; i++) {
        for (int j = 0; j < cols; j++) {
            if (rooms[i][j] == 0) {
                queue.offer(new int[]{i, j});
            }
        }
    }

    int[][] directions = {{1,0}, {-1,0}, {0,1}, {0,-1}};

    while (!queue.isEmpty()) {
        int[] cell = queue.poll();
        int r = cell[0], c = cell[1];

        for (int[] dir : directions) {
            int nr = r + dir[0];
            int nc = c + dir[1];

            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols
                && rooms[nr][nc] == INF) {
                rooms[nr][nc] = rooms[r][c] + 1;
                queue.offer(new int[]{nr, nc});
            }
        }
    }
}
```

---

## 9.2 Graph Cycle Detection

### Problem 142: Course Schedule (Cycle Detection)

**LeetCode 207** 🔗 https://leetcode.com/problems/course-schedule/

```
┌────────────────────────────────────────────────────────────────┐
│  COURSE SCHEDULE - Detect cycle in directed graph              │
├────────────────────────────────────────────────────────────────┤
│  numCourses = 4                                                │
│  prerequisites = [[1,0], [2,0], [3,1], [3,2]]                  │
│  [a,b] means: to take course a, you must first take course b   │
│                                                                │
│       0                                                        │
│      / \                                                       │
│     ↓   ↓                                                      │
│     1   2        No cycle → Can finish all courses ✓           │
│      \ /                                                       │
│       ↓                                                        │
│       3                                                        │
│                                                                │
│  With cycle: [[1,0], [0,1]]                                    │
│       0 ↔ 1      Cycle! → Cannot finish ✗                      │
└────────────────────────────────────────────────────────────────┘
```

**Solution (DFS with colors):**

```java
public boolean canFinish(int numCourses, int[][] prerequisites) {
    List<List<Integer>> graph = new ArrayList<>();
    for (int i = 0; i < numCourses; i++) {
        graph.add(new ArrayList<>());
    }

    for (int[] prereq : prerequisites) {
        graph.get(prereq[1]).add(prereq[0]);
    }

    // 0 = unvisited, 1 = visiting (in current path), 2 = visited
    int[] state = new int[numCourses];

    for (int i = 0; i < numCourses; i++) {
        if (hasCycle(graph, i, state)) {
            return false;
        }
    }

    return true;
}

private boolean hasCycle(List<List<Integer>> graph, int node, int[] state) {
    if (state[node] == 1) return true;   // Back edge = cycle
    if (state[node] == 2) return false;  // Already processed

    state[node] = 1;  // Mark as visiting

    for (int neighbor : graph.get(node)) {
        if (hasCycle(graph, neighbor, state)) {
            return true;
        }
    }

    state[node] = 2;  // Mark as visited
    return false;
}
```

---

### Problem 143: Course Schedule II (Topological Sort)

**LeetCode 210** 🔗 https://leetcode.com/problems/course-schedule-ii/

```
┌────────────────────────────────────────────────────────────────┐
│  COURSE SCHEDULE II - Return valid course order                │
├────────────────────────────────────────────────────────────────┤
│  numCourses = 4                                                │
│  prerequisites = [[1,0], [2,0], [3,1], [3,2]]                  │
│                                                                │
│  Valid orders:                                                 │
│  [0, 1, 2, 3] or [0, 2, 1, 3]                                  │
│                                                                │
│  Topological Sort: Order where all prerequisites come first    │
│                                                                │
│  Using Kahn's Algorithm (BFS):                                 │
│  1. Calculate in-degree for each node                          │
│  2. Start with nodes having in-degree 0                        │
│  3. Remove node, reduce neighbors' in-degree                   │
│  4. Add nodes with in-degree 0 to queue                        │
└────────────────────────────────────────────────────────────────┘
```

**Solution (Kahn's Algorithm - BFS):**

```java
public int[] findOrder(int numCourses, int[][] prerequisites) {
    List<List<Integer>> graph = new ArrayList<>();
    int[] inDegree = new int[numCourses];

    for (int i = 0; i < numCourses; i++) {
        graph.add(new ArrayList<>());
    }

    for (int[] prereq : prerequisites) {
        graph.get(prereq[1]).add(prereq[0]);
        inDegree[prereq[0]]++;
    }

    Queue<Integer> queue = new LinkedList<>();
    for (int i = 0; i < numCourses; i++) {
        if (inDegree[i] == 0) {
            queue.offer(i);
        }
    }

    int[] result = new int[numCourses];
    int index = 0;

    while (!queue.isEmpty()) {
        int course = queue.poll();
        result[index++] = course;

        for (int neighbor : graph.get(course)) {
            inDegree[neighbor]--;
            if (inDegree[neighbor] == 0) {
                queue.offer(neighbor);
            }
        }
    }

    return index == numCourses ? result : new int[0];
}
```

---

### Problem 144: Graph Valid Tree

**LeetCode 261 (Premium)** 🔗 (Premium)

```
┌────────────────────────────────────────────────────────────────┐
│  GRAPH VALID TREE                                              │
├────────────────────────────────────────────────────────────────┤
│  A valid tree has:                                             │
│  1. No cycles                                                  │
│  2. All nodes connected (single connected component)           │
│  3. Exactly n-1 edges for n nodes                              │
│                                                                │
│  Example 1: n=5, edges=[[0,1],[0,2],[0,3],[1,4]]               │
│       0                                                        │
│      /|\                                                       │
│     1 2 3    Valid tree ✓                                      │
│     |                                                          │
│     4                                                          │
│                                                                │
│  Example 2: n=5, edges=[[0,1],[1,2],[2,3],[1,3],[1,4]]         │
│     0─1─4                                                      │
│       │\                                                       │
│       2─3    Has cycle (1-2-3-1) ✗                             │
│                                                                │
│  Constraints:                                                  │
│  - 1 <= n <= 2000                                              │
│  - 0 <= edges.length <= 5000                                   │
└────────────────────────────────────────────────────────────────┘
```

**Solution (Union-Find):**

```java
public boolean validTree(int n, int[][] edges) {
    // Tree must have exactly n-1 edges
    if (edges.length != n - 1) return false;

    int[] parent = new int[n];
    for (int i = 0; i < n; i++) parent[i] = i;

    for (int[] edge : edges) {
        int p1 = find(parent, edge[0]);
        int p2 = find(parent, edge[1]);

        // Same parent means cycle
        if (p1 == p2) return false;

        parent[p1] = p2;  // Union
    }

    return true;
}

private int find(int[] parent, int x) {
    if (parent[x] != x) {
        parent[x] = find(parent, parent[x]);
    }
    return parent[x];
}
```

---

## 9.3 Shortest Path Problems

### Problem 145: 01 Matrix

**LeetCode 542** 🔗 https://leetcode.com/problems/01-matrix/

```
┌────────────────────────────────────────────────────────────────┐
│  01 MATRIX - Distance to nearest 0 for each cell               │
├────────────────────────────────────────────────────────────────┤
│  Input:                  Output:                               │
│  ┌───┬───┬───┐           ┌───┬───┬───┐                         │
│  │ 0 │ 0 │ 0 │           │ 0 │ 0 │ 0 │                         │
│  ├───┼───┼───┤           ├───┼───┼───┤                         │
│  │ 0 │ 1 │ 0 │     →     │ 0 │ 1 │ 0 │                         │
│  ├───┼───┼───┤           ├───┼───┼───┤                         │
│  │ 1 │ 1 │ 1 │           │ 1 │ 2 │ 1 │                         │
│  └───┴───┴───┘           └───┴───┴───┘                         │
│                                                                │
│  Multi-source BFS from all 0s simultaneously                   │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int[][] updateMatrix(int[][] mat) {
    int rows = mat.length, cols = mat[0].length;
    Queue<int[]> queue = new LinkedList<>();

    // Add all 0s to queue, mark 1s as unvisited
    for (int i = 0; i < rows; i++) {
        for (int j = 0; j < cols; j++) {
            if (mat[i][j] == 0) {
                queue.offer(new int[]{i, j});
            } else {
                mat[i][j] = -1;  // Mark as unvisited
            }
        }
    }

    int[][] directions = {{1,0}, {-1,0}, {0,1}, {0,-1}};

    while (!queue.isEmpty()) {
        int[] cell = queue.poll();

        for (int[] dir : directions) {
            int nr = cell[0] + dir[0];
            int nc = cell[1] + dir[1];

            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols
                && mat[nr][nc] == -1) {
                mat[nr][nc] = mat[cell[0]][cell[1]] + 1;
                queue.offer(new int[]{nr, nc});
            }
        }
    }

    return mat;
}
```

---

### Problem 146: Shortest Path in Binary Matrix

**LeetCode 1091** 🔗 https://leetcode.com/problems/shortest-path-in-binary-matrix/

```
┌────────────────────────────────────────────────────────────────┐
│  SHORTEST PATH IN BINARY MATRIX                                │
├────────────────────────────────────────────────────────────────┤
│  Find shortest clear path from top-left to bottom-right        │
│  Can move in 8 directions (including diagonals)                │
│  0 = clear, 1 = blocked                                        │
│                                                                │
│  grid = [[0,0,0],                                              │
│          [1,1,0],                                              │
│          [1,1,0]]                                              │
│                                                                │
│  Path: (0,0)→(0,1)→(0,2)→(1,2)→(2,2)                           │
│  ┌───┬───┬───┐                                                 │
│  │ S │ * │ * │                                                 │
│  ├───┼───┼───┤   Length = 4                                    │
│  │ █ │ █ │ * │                                                 │
│  ├───┼───┼───┤                                                 │
│  │ █ │ █ │ E │                                                 │
│  └───┴───┴───┘                                                 │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int shortestPathBinaryMatrix(int[][] grid) {
    int n = grid.length;
    if (grid[0][0] == 1 || grid[n-1][n-1] == 1) return -1;

    int[][] directions = {
        {0,1}, {0,-1}, {1,0}, {-1,0},
        {1,1}, {1,-1}, {-1,1}, {-1,-1}
    };

    Queue<int[]> queue = new LinkedList<>();
    queue.offer(new int[]{0, 0, 1});  // row, col, distance
    grid[0][0] = 1;  // Mark visited

    while (!queue.isEmpty()) {
        int[] cell = queue.poll();
        int r = cell[0], c = cell[1], dist = cell[2];

        if (r == n-1 && c == n-1) return dist;

        for (int[] dir : directions) {
            int nr = r + dir[0];
            int nc = c + dir[1];

            if (nr >= 0 && nr < n && nc >= 0 && nc < n && grid[nr][nc] == 0) {
                queue.offer(new int[]{nr, nc, dist + 1});
                grid[nr][nc] = 1;
            }
        }
    }

    return -1;
}
```

---

### Problem 147: Network Delay Time (Dijkstra's)

**LeetCode 743** 🔗 https://leetcode.com/problems/network-delay-time/

```
┌────────────────────────────────────────────────────────────────┐
│  NETWORK DELAY TIME - Dijkstra's Algorithm                     │
├────────────────────────────────────────────────────────────────┤
│  times = [[2,1,1],[2,3,1],[3,4,1]], n=4, k=2                   │
│                                                                │
│       1 ←──(1)── 2                                             │
│                  │                                             │
│                 (1)                                            │
│                  ↓                                             │
│                  3 ──(1)──→ 4                                  │
│                                                                │
│  Start from node 2:                                            │
│  - Node 2: time 0                                              │
│  - Node 1: time 1 (via 2→1)                                    │
│  - Node 3: time 1 (via 2→3)                                    │
│  - Node 4: time 2 (via 2→3→4)                                  │
│                                                                │
│  All nodes reached, max time = 2                               │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int networkDelayTime(int[][] times, int n, int k) {
    // Build adjacency list
    Map<Integer, List<int[]>> graph = new HashMap<>();
    for (int[] time : times) {
        graph.computeIfAbsent(time[0], x -> new ArrayList<>())
             .add(new int[]{time[1], time[2]});
    }

    // Min-heap: [time, node]
    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] - b[0]);
    pq.offer(new int[]{0, k});

    int[] dist = new int[n + 1];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[k] = 0;

    while (!pq.isEmpty()) {
        int[] curr = pq.poll();
        int time = curr[0], node = curr[1];

        if (time > dist[node]) continue;

        if (!graph.containsKey(node)) continue;

        for (int[] edge : graph.get(node)) {
            int neighbor = edge[0], weight = edge[1];
            int newTime = time + weight;

            if (newTime < dist[neighbor]) {
                dist[neighbor] = newTime;
                pq.offer(new int[]{newTime, neighbor});
            }
        }
    }

    int maxTime = 0;
    for (int i = 1; i <= n; i++) {
        if (dist[i] == Integer.MAX_VALUE) return -1;
        maxTime = Math.max(maxTime, dist[i]);
    }

    return maxTime;
}
```

---

### Problem 148: 🔒 Cheapest Flights Within K Stops (LeetCode 787)

**LeetCode 787** 🔗 https://leetcode.com/problems/cheapest-flights-within-k-stops/

```
┌────────────────────────────────────────────────────────────────┐
│  CHEAPEST FLIGHTS WITHIN K STOPS                               │
├────────────────────────────────────────────────────────────────┤
│  n = 4, flights = [[0,1,100],[1,2,100],[2,0,100],[1,3,600],    │
│                    [2,3,200]]                                  │
│  src = 0, dst = 3, k = 1                                       │
│                                                                │
│       ┌────(100)────┐                                          │
│       ↓             │                                          │
│       1 ──(600)──→ 3                                           │
│       │             ↑                                          │
│     (100)         (200)                                        │
│       ↓             │                                          │
│       2 ────────────┘                                          │
│       │                                                        │
│     (100)                                                      │
│       ↓                                                        │
│       0                                                        │
│                                                                │
│  With at most 1 stop:                                          │
│  - 0→1→3 = 700 (1 stop)                                        │
│  - 0→1→2→3 = 400 but has 2 stops ✗                             │
│                                                                │
│  Output: 700                                                   │
└────────────────────────────────────────────────────────────────┘
```

**Solution (Modified Dijkstra):**

```java
public int findCheapestPrice(int n, int[][] flights, int src, int dst, int k) {
    Map<Integer, List<int[]>> graph = new HashMap<>();
    for (int[] f : flights) {
        graph.computeIfAbsent(f[0], x -> new ArrayList<>())
             .add(new int[]{f[1], f[2]});
    }

    // [cost, node, stops]
    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] - b[0]);
    pq.offer(new int[]{0, src, 0});

    // Track min stops to reach each node
    int[] minStops = new int[n];
    Arrays.fill(minStops, Integer.MAX_VALUE);

    while (!pq.isEmpty()) {
        int[] curr = pq.poll();
        int cost = curr[0], node = curr[1], stops = curr[2];

        if (node == dst) return cost;
        if (stops > k) continue;
        if (stops >= minStops[node]) continue;

        minStops[node] = stops;

        if (!graph.containsKey(node)) continue;

        for (int[] next : graph.get(node)) {
            pq.offer(new int[]{cost + next[1], next[0], stops + 1});
        }
    }

    return -1;
}
```

---

## 9.4 Union-Find (Disjoint Set)

```
┌────────────────────────────────────────────────────────────────┐
│  UNION-FIND DATA STRUCTURE                                     │
├────────────────────────────────────────────────────────────────┤
│  Operations:                                                   │
│  - find(x): Find root/representative of x's set                │
│  - union(x, y): Merge sets containing x and y                  │
│                                                                │
│  Optimizations:                                                │
│  1. Path Compression: Flatten tree during find                 │
│  2. Union by Rank: Attach smaller tree under larger            │
│                                                                │
│  Example:                                                      │
│  Initial: {0}, {1}, {2}, {3}, {4}                              │
│                                                                │
│  union(0,1): {0,1}, {2}, {3}, {4}                              │
│  union(2,3): {0,1}, {2,3}, {4}                                 │
│  union(1,3): {0,1,2,3}, {4}                                    │
│                                                                │
│  find(0) == find(3)? → true (same set)                         │
│  find(0) == find(4)? → false (different sets)                  │
│                                                                │
│  Time: O(α(n)) ≈ O(1) amortized per operation                  │
└────────────────────────────────────────────────────────────────┘
```

---

### Problem 149: Number of Connected Components

**LeetCode 323 (Premium)** 🔗 (Premium)

```
┌────────────────────────────────────────────────────────────────┐
│  NUMBER OF CONNECTED COMPONENTS                                │
├────────────────────────────────────────────────────────────────┤
│  n = 5, edges = [[0,1], [1,2], [3,4]]                          │
│                                                                │
│  0 ─── 1 ─── 2        3 ─── 4                                  │
│                                                                │
│  Component 1: {0,1,2}                                          │
│  Component 2: {3,4}                                            │
│                                                                │
│  Output: 2                                                     │
│                                                                │
│  Constraints:                                                  │
│  - 1 <= n <= 2000                                              │
│  - 0 <= edges.length <= 5000                                   │
│  - No duplicate edges                                          │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int countComponents(int n, int[][] edges) {
    int[] parent = new int[n];
    int[] rank = new int[n];

    for (int i = 0; i < n; i++) parent[i] = i;

    int components = n;

    for (int[] edge : edges) {
        if (union(parent, rank, edge[0], edge[1])) {
            components--;
        }
    }

    return components;
}

private int find(int[] parent, int x) {
    if (parent[x] != x) {
        parent[x] = find(parent, parent[x]);  // Path compression
    }
    return parent[x];
}

private boolean union(int[] parent, int[] rank, int x, int y) {
    int px = find(parent, x);
    int py = find(parent, y);

    if (px == py) return false;  // Already same component

    // Union by rank
    if (rank[px] < rank[py]) {
        parent[px] = py;
    } else if (rank[px] > rank[py]) {
        parent[py] = px;
    } else {
        parent[py] = px;
        rank[px]++;
    }

    return true;
}
```

---

### Problem 150: Redundant Connection

**LeetCode 684** 🔗 https://leetcode.com/problems/redundant-connection/

```
┌────────────────────────────────────────────────────────────────┐
│  REDUNDANT CONNECTION - Find edge that creates cycle           │
├────────────────────────────────────────────────────────────────┤
│  edges = [[1,2], [1,3], [2,3]]                                 │
│                                                                │
│       1                                                        │
│      / \                                                       │
│     2───3   Edge [2,3] creates the cycle                       │
│                                                                │
│  Return the last edge that creates a cycle                     │
│  Output: [2, 3]                                                │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int[] findRedundantConnection(int[][] edges) {
    int n = edges.length;
    int[] parent = new int[n + 1];

    for (int i = 1; i <= n; i++) parent[i] = i;

    for (int[] edge : edges) {
        int p1 = find(parent, edge[0]);
        int p2 = find(parent, edge[1]);

        if (p1 == p2) {
            return edge;  // This edge creates cycle
        }

        parent[p1] = p2;
    }

    return new int[0];
}

private int find(int[] parent, int x) {
    if (parent[x] != x) {
        parent[x] = find(parent, parent[x]);
    }
    return parent[x];
}
```

---

### Problem 151: Accounts Merge

**LeetCode 721** 🔗 https://leetcode.com/problems/accounts-merge/

```
┌────────────────────────────────────────────────────────────────┐
│  ACCOUNTS MERGE - Merge accounts with same email               │
├────────────────────────────────────────────────────────────────┤
│  accounts = [                                                  │
│    ["John", "john@mail.com", "john_work@mail.com"],            │
│    ["John", "john@mail.com", "john_home@mail.com"],            │
│    ["Mary", "mary@mail.com"],                                  │
│    ["John", "johnny@mail.com"]                                 │
│  ]                                                             │
│                                                                │
│  John (account 0) and John (account 1) share "john@mail.com"   │
│  → Merge them                                                  │
│                                                                │
│  Output: [                                                     │
│    ["John", "john@mail.com", "john_home@mail.com",             │
│            "john_work@mail.com"],                              │
│    ["Mary", "mary@mail.com"],                                  │
│    ["John", "johnny@mail.com"]                                 │
│  ]                                                             │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public List<List<String>> accountsMerge(List<List<String>> accounts) {
    Map<String, String> emailToName = new HashMap<>();
    Map<String, String> parent = new HashMap<>();

    // Initialize: each email is its own parent
    for (List<String> account : accounts) {
        String name = account.get(0);
        for (int i = 1; i < account.size(); i++) {
            String email = account.get(i);
            emailToName.put(email, name);
            parent.put(email, email);
        }
    }

    // Union emails in same account
    for (List<String> account : accounts) {
        String firstEmail = account.get(1);
        for (int i = 2; i < account.size(); i++) {
            union(parent, firstEmail, account.get(i));
        }
    }

    // Group emails by root
    Map<String, TreeSet<String>> groups = new HashMap<>();
    for (String email : parent.keySet()) {
        String root = find(parent, email);
        groups.computeIfAbsent(root, x -> new TreeSet<>()).add(email);
    }

    // Build result
    List<List<String>> result = new ArrayList<>();
    for (String root : groups.keySet()) {
        List<String> account = new ArrayList<>();
        account.add(emailToName.get(root));
        account.addAll(groups.get(root));
        result.add(account);
    }

    return result;
}

private String find(Map<String, String> parent, String x) {
    if (!parent.get(x).equals(x)) {
        parent.put(x, find(parent, parent.get(x)));
    }
    return parent.get(x);
}

private void union(Map<String, String> parent, String x, String y) {
    parent.put(find(parent, x), find(parent, y));
}
```

---

## 9.5 Advanced Graph Problems

### Problem 152: Word Ladder

**LeetCode 127** 🔗 https://leetcode.com/problems/word-ladder/

```
┌────────────────────────────────────────────────────────────────┐
│  WORD LADDER - Shortest transformation sequence                │
├────────────────────────────────────────────────────────────────┤
│  beginWord = "hit", endWord = "cog"                            │
│  wordList = ["hot","dot","dog","lot","log","cog"]              │
│                                                                │
│  Transformation: Change one letter at a time                   │
│  Each intermediate word must be in wordList                    │
│                                                                │
│  hit → hot → dot → dog → cog                                   │
│   │     │     │     │                                          │
│   └─────┴─────┴─────┴──→ 5 words                               │
│                                                                │
│  Graph representation:                                         │
│  hot ─── dot ─── dog                                           │
│   │       │       │                                            │
│  lot ─── log ─── cog                                           │
│                                                                │
│  BFS finds shortest path                                       │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int ladderLength(String beginWord, String endWord, List<String> wordList) {
    Set<String> wordSet = new HashSet<>(wordList);
    if (!wordSet.contains(endWord)) return 0;

    Queue<String> queue = new LinkedList<>();
    queue.offer(beginWord);

    Set<String> visited = new HashSet<>();
    visited.add(beginWord);

    int level = 1;

    while (!queue.isEmpty()) {
        int size = queue.size();

        for (int i = 0; i < size; i++) {
            String word = queue.poll();

            if (word.equals(endWord)) return level;

            // Try changing each character
            char[] chars = word.toCharArray();
            for (int j = 0; j < chars.length; j++) {
                char original = chars[j];

                for (char c = 'a'; c <= 'z'; c++) {
                    if (c == original) continue;

                    chars[j] = c;
                    String newWord = new String(chars);

                    if (wordSet.contains(newWord) && !visited.contains(newWord)) {
                        queue.offer(newWord);
                        visited.add(newWord);
                    }
                }

                chars[j] = original;
            }
        }

        level++;
    }

    return 0;
}
```

---

### Problem 153: 🔒 Alien Dictionary (LeetCode 269 - Premium)

```
┌────────────────────────────────────────────────────────────────┐
│  ALIEN DICTIONARY - Find character order from sorted words     │
├────────────────────────────────────────────────────────────────┤
│  words = ["wrt", "wrf", "er", "ett", "rftt"]                   │
│  These words are sorted in alien language order                │
│                                                                │
│  Compare adjacent words to find relationships:                 │
│  "wrt" vs "wrf" → t comes before f (t < f)                     │
│  "wrf" vs "er"  → w comes before e (w < e)                     │
│  "er" vs "ett"  → r comes before t (r < t)                     │
│  "ett" vs "rftt"→ e comes before r (e < r)                     │
│                                                                │
│  Build graph: w→e→r→t→f                                        │
│  Topological sort gives: "wertf"                               │
│                                                                │
│  Constraints:                                                  │
│  - 1 <= words.length <= 100                                    │
│  - 1 <= words[i].length <= 100                                 │
│  - All characters are lowercase English letters                │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public String alienOrder(String[] words) {
    Map<Character, Set<Character>> graph = new HashMap<>();
    Map<Character, Integer> inDegree = new HashMap<>();

    // Initialize all characters
    for (String word : words) {
        for (char c : word.toCharArray()) {
            graph.putIfAbsent(c, new HashSet<>());
            inDegree.putIfAbsent(c, 0);
        }
    }

    // Build graph by comparing adjacent words
    for (int i = 0; i < words.length - 1; i++) {
        String w1 = words[i], w2 = words[i + 1];

        // Invalid case: prefix comes after longer word
        if (w1.length() > w2.length() && w1.startsWith(w2)) {
            return "";
        }

        for (int j = 0; j < Math.min(w1.length(), w2.length()); j++) {
            char c1 = w1.charAt(j), c2 = w2.charAt(j);
            if (c1 != c2) {
                if (!graph.get(c1).contains(c2)) {
                    graph.get(c1).add(c2);
                    inDegree.put(c2, inDegree.get(c2) + 1);
                }
                break;
            }
        }
    }

    // Topological sort
    Queue<Character> queue = new LinkedList<>();
    for (char c : inDegree.keySet()) {
        if (inDegree.get(c) == 0) queue.offer(c);
    }

    StringBuilder result = new StringBuilder();
    while (!queue.isEmpty()) {
        char c = queue.poll();
        result.append(c);

        for (char next : graph.get(c)) {
            inDegree.put(next, inDegree.get(next) - 1);
            if (inDegree.get(next) == 0) queue.offer(next);
        }
    }

    return result.length() == inDegree.size() ? result.toString() : "";
}
```

---

### Problem 154: Is Graph Bipartite?

**LeetCode 785** 🔗 https://leetcode.com/problems/is-graph-bipartite/

```
┌────────────────────────────────────────────────────────────────┐
│  IS GRAPH BIPARTITE - Can nodes be divided into 2 sets?        │
├────────────────────────────────────────────────────────────────┤
│  A graph is bipartite if we can color nodes with 2 colors      │
│  such that no two adjacent nodes have the same color.          │
│                                                                │
│  Bipartite:               Not Bipartite:                       │
│     0 ─── 1                  0 ─── 1                           │
│     │     │                  │ \   │                           │
│     │     │                  │  \  │                           │
│     3 ─── 2                  3 ─── 2                           │
│                                                                │
│  Colors: 0,2=RED, 1,3=BLUE   Triangle can't be 2-colored       │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public boolean isBipartite(int[][] graph) {
    int n = graph.length;
    int[] colors = new int[n];  // 0=uncolored, 1=red, -1=blue

    for (int i = 0; i < n; i++) {
        if (colors[i] == 0 && !bfs(graph, colors, i)) {
            return false;
        }
    }

    return true;
}

private boolean bfs(int[][] graph, int[] colors, int start) {
    Queue<Integer> queue = new LinkedList<>();
    queue.offer(start);
    colors[start] = 1;

    while (!queue.isEmpty()) {
        int node = queue.poll();

        for (int neighbor : graph[node]) {
            if (colors[neighbor] == 0) {
                colors[neighbor] = -colors[node];  // Opposite color
                queue.offer(neighbor);
            } else if (colors[neighbor] == colors[node]) {
                return false;  // Same color = not bipartite
            }
        }
    }

    return true;
}
```

---

## 9.6 HackerEarth & Codeforces Graph Problems

### Problem 155: Find the Town Judge (HackerEarth-style)

```
┌────────────────────────────────────────────────────────────────┐
│  FIND THE TOWN JUDGE                                           │
├────────────────────────────────────────────────────────────────┤
│  In a town of n people, one might be the judge.               │
│  The judge:                                                    │
│  1. Trusts nobody                                              │
│  2. Everybody else trusts the judge                            │
│                                                                │
│  trust = [[1,2], [3,2]]  (a trusts b)                          │
│  n = 3                                                         │
│                                                                │
│     1 ───→ 2 ←─── 3                                            │
│                                                                │
│  Person 2: in-degree = 2 (n-1), out-degree = 0                 │
│  Output: 2                                                     │
│                                                                │
│  Constraints:                                                  │
│  - 1 <= n <= 1000                                              │
│  - 0 <= trust.length <= 10^4                                   │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int findJudge(int n, int[][] trust) {
    int[] trustScore = new int[n + 1];

    for (int[] t : trust) {
        trustScore[t[0]]--;  // Trusts someone
        trustScore[t[1]]++;  // Is trusted
    }

    for (int i = 1; i <= n; i++) {
        if (trustScore[i] == n - 1) {
            return i;  // Trusted by everyone else, trusts no one
        }
    }

    return -1;
}
```

---

### Problem 156: Minimum Spanning Tree (Codeforces-style)

```
┌────────────────────────────────────────────────────────────────┐
│  MINIMUM SPANNING TREE - Kruskal's Algorithm                   │
├────────────────────────────────────────────────────────────────┤
│  Connect all nodes with minimum total edge weight              │
│  n = 4, edges = [[1,2,1], [1,3,4], [2,3,2], [3,4,3]]           │
│                                                                │
│       1 ──(1)── 2                                              │
│        \       /                                               │
│       (4)   (2)                                                │
│          \ /                                                   │
│           3                                                    │
│           │                                                    │
│          (3)                                                   │
│           │                                                    │
│           4                                                    │
│                                                                │
│  MST edges: [1,2,1], [2,3,2], [3,4,3]                          │
│  Total weight = 1 + 2 + 3 = 6                                  │
│                                                                │
│  Kruskal's: Sort edges, add if doesn't create cycle            │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int minSpanningTree(int n, int[][] edges) {
    // Sort edges by weight
    Arrays.sort(edges, (a, b) -> a[2] - b[2]);

    int[] parent = new int[n + 1];
    for (int i = 1; i <= n; i++) parent[i] = i;

    int totalWeight = 0;
    int edgesUsed = 0;

    for (int[] edge : edges) {
        int u = edge[0], v = edge[1], weight = edge[2];

        int pu = find(parent, u);
        int pv = find(parent, v);

        if (pu != pv) {
            parent[pu] = pv;
            totalWeight += weight;
            edgesUsed++;

            if (edgesUsed == n - 1) break;
        }
    }

    return edgesUsed == n - 1 ? totalWeight : -1;
}

private int find(int[] parent, int x) {
    if (parent[x] != x) {
        parent[x] = find(parent, parent[x]);
    }
    return parent[x];
}
```

---

### Problem 157: Detect Cycle in Undirected Graph (HackerEarth)

```
┌────────────────────────────────────────────────────────────────┐
│  DETECT CYCLE IN UNDIRECTED GRAPH                              │
├────────────────────────────────────────────────────────────────┤
│  Has Cycle:               No Cycle:                            │
│     0 ─── 1                  0 ─── 1                           │
│     │     │                  │                                 │
│     │     │                  │                                 │
│     3 ─── 2                  2 ─── 3                           │
│                                                                │
│  DFS: If we visit a node that's already visited and            │
│  it's not the parent → cycle detected                          │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public boolean hasCycle(int n, int[][] edges) {
    List<List<Integer>> graph = new ArrayList<>();
    for (int i = 0; i < n; i++) {
        graph.add(new ArrayList<>());
    }

    for (int[] edge : edges) {
        graph.get(edge[0]).add(edge[1]);
        graph.get(edge[1]).add(edge[0]);
    }

    boolean[] visited = new boolean[n];

    for (int i = 0; i < n; i++) {
        if (!visited[i]) {
            if (dfs(graph, visited, i, -1)) {
                return true;
            }
        }
    }

    return false;
}

private boolean dfs(List<List<Integer>> graph, boolean[] visited,
                    int node, int parent) {
    visited[node] = true;

    for (int neighbor : graph.get(node)) {
        if (!visited[neighbor]) {
            if (dfs(graph, visited, neighbor, node)) {
                return true;
            }
        } else if (neighbor != parent) {
            return true;  // Back edge = cycle
        }
    }

    return false;
}
```

---

### Problem 158: Strongly Connected Components (Codeforces-style)

```
┌────────────────────────────────────────────────────────────────┐
│  STRONGLY CONNECTED COMPONENTS (Kosaraju's Algorithm)          │
├────────────────────────────────────────────────────────────────┤
│  A directed graph's SCC is a maximal set of vertices where     │
│  every vertex is reachable from every other vertex.            │
│                                                                │
│       0 ───→ 1                                                 │
│       ↑     ↙                                                  │
│       │   ↙                                                    │
│       2 ←───────                                               │
│       │                                                        │
│       ↓                                                        │
│       3 ←──→ 4                                                 │
│                                                                │
│  SCC 1: {0, 1, 2}  (form a cycle)                              │
│  SCC 2: {3, 4}     (form a cycle)                              │
│                                                                │
│  Kosaraju's Algorithm:                                         │
│  1. DFS to get finish order                                    │
│  2. Transpose graph                                            │
│  3. DFS in reverse finish order on transposed graph            │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int countSCCs(int n, int[][] edges) {
    List<List<Integer>> graph = new ArrayList<>();
    List<List<Integer>> transpose = new ArrayList<>();

    for (int i = 0; i < n; i++) {
        graph.add(new ArrayList<>());
        transpose.add(new ArrayList<>());
    }

    for (int[] edge : edges) {
        graph.get(edge[0]).add(edge[1]);
        transpose.get(edge[1]).add(edge[0]);
    }

    // Step 1: Get finish order
    boolean[] visited = new boolean[n];
    Stack<Integer> stack = new Stack<>();

    for (int i = 0; i < n; i++) {
        if (!visited[i]) {
            dfs1(graph, visited, i, stack);
        }
    }

    // Step 2: DFS on transpose in reverse finish order
    Arrays.fill(visited, false);
    int sccCount = 0;

    while (!stack.isEmpty()) {
        int node = stack.pop();
        if (!visited[node]) {
            dfs2(transpose, visited, node);
            sccCount++;
        }
    }

    return sccCount;
}

private void dfs1(List<List<Integer>> graph, boolean[] visited,
                  int node, Stack<Integer> stack) {
    visited[node] = true;
    for (int neighbor : graph.get(node)) {
        if (!visited[neighbor]) {
            dfs1(graph, visited, neighbor, stack);
        }
    }
    stack.push(node);
}

private void dfs2(List<List<Integer>> graph, boolean[] visited, int node) {
    visited[node] = true;
    for (int neighbor : graph.get(node)) {
        if (!visited[neighbor]) {
            dfs2(graph, visited, neighbor);
        }
    }
}
```

---

# 📚 SECTION 10: DYNAMIC PROGRAMMING PATTERNS

```
┌─────────────────────────────────────────────────────────────────┐
│                    DP FUNDAMENTALS                              │
├─────────────────────────────────────────────────────────────────┤
│  KEY PATTERNS:                                                  │
│  1. 1D DP: Single array/sequence                                │
│  2. 2D DP: Two sequences or grid                                │
│  3. Interval DP: Subarray/substring problems                    │
│  4. State Machine DP: Multiple states                           │
│  5. Knapsack: Selection problems                                │
│                                                                 │
│  APPROACH:                                                      │
│  1. Define state: dp[i] = ?                                     │
│  2. Find recurrence: dp[i] = f(dp[i-1], ...)                    │
│  3. Base case: dp[0] = ?                                        │
│  4. Build order: Bottom-up or Top-down                          │
│  5. Optimize space if possible                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 10.1 1D Dynamic Programming

### Problem 159: Climbing Stairs

**LeetCode 70** 🔗 https://leetcode.com/problems/climbing-stairs/

```
┌────────────────────────────────────────────────────────────────┐
│  CLIMBING STAIRS - Ways to reach top (1 or 2 steps)            │
├────────────────────────────────────────────────────────────────┤
│  n = 4 stairs                                                  │
│                                                                │
│  Ways:     ┌───┐                                               │
│  1+1+1+1   │ 4 │ ← Goal                                        │
│  1+1+2     ├───┤                                               │
│  1+2+1     │ 3 │                                               │
│  2+1+1     ├───┤                                               │
│  2+2       │ 2 │                                               │
│            ├───┤                                               │
│            │ 1 │                                               │
│            ├───┤                                               │
│            │ 0 │ ← Start                                       │
│            └───┘                                               │
│                                                                │
│  dp[i] = dp[i-1] + dp[i-2] (Fibonacci!)                        │
│  Output: 5 ways                                                │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int climbStairs(int n) {
    if (n <= 2) return n;

    int prev2 = 1, prev1 = 2;

    for (int i = 3; i <= n; i++) {
        int curr = prev1 + prev2;
        prev2 = prev1;
        prev1 = curr;
    }

    return prev1;
}
```

---

### Problem 160: House Robber

**LeetCode 198** 🔗 https://leetcode.com/problems/house-robber/

```
┌────────────────────────────────────────────────────────────────┐
│  HOUSE ROBBER - Max money without robbing adjacent houses      │
├────────────────────────────────────────────────────────────────┤
│  nums = [2, 7, 9, 3, 1]                                        │
│                                                                │
│  Houses:  [2]  [7]  [9]  [3]  [1]                              │
│            │    │    │    │    │                               │
│            0    1    2    3    4                               │
│                                                                │
│  Rob house 0, 2, 4: 2 + 9 + 1 = 12 ✓                           │
│  Rob house 1, 3: 7 + 3 = 10                                    │
│                                                                │
│  dp[i] = max(dp[i-1], dp[i-2] + nums[i])                       │
│  "Skip current" or "Rob current + skip previous"               │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int rob(int[] nums) {
    if (nums.length == 1) return nums[0];

    int prev2 = 0, prev1 = nums[0];

    for (int i = 1; i < nums.length; i++) {
        int curr = Math.max(prev1, prev2 + nums[i]);
        prev2 = prev1;
        prev1 = curr;
    }

    return prev1;
}
```

---

### Problem 161: House Robber II (Circular)

**LeetCode 213** 🔗 https://leetcode.com/problems/house-robber-ii/

```
┌────────────────────────────────────────────────────────────────┐
│  HOUSE ROBBER II - Houses in circle                            │
├────────────────────────────────────────────────────────────────┤
│  nums = [2, 3, 2]                                              │
│                                                                │
│      ┌─── 2 ───┐                                               │
│      │         │                                               │
│      2    ○    3     First and last are adjacent!              │
│      │         │                                               │
│      └─────────┘                                               │
│                                                                │
│  Can't rob both first and last house.                          │
│  Solution: max(rob[0..n-2], rob[1..n-1])                       │
│                                                                │
│  Output: 3 (rob house 1 only)                                  │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int rob(int[] nums) {
    if (nums.length == 1) return nums[0];

    return Math.max(
        robRange(nums, 0, nums.length - 2),
        robRange(nums, 1, nums.length - 1)
    );
}

private int robRange(int[] nums, int start, int end) {
    int prev2 = 0, prev1 = 0;

    for (int i = start; i <= end; i++) {
        int curr = Math.max(prev1, prev2 + nums[i]);
        prev2 = prev1;
        prev1 = curr;
    }

    return prev1;
}
```

---

### Problem 162: Maximum Subarray (Kadane's)

**LeetCode 53** 🔗 https://leetcode.com/problems/maximum-subarray/

```
┌────────────────────────────────────────────────────────────────┐
│  MAXIMUM SUBARRAY - Kadane's Algorithm                         │
├────────────────────────────────────────────────────────────────┤
│  nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]                        │
│                                                                │
│  At each position, decide:                                     │
│  - Start new subarray here?                                    │
│  - Or extend previous subarray?                                │
│                                                                │
│  dp[i] = max(nums[i], dp[i-1] + nums[i])                       │
│                                                                │
│  Index:  0   1   2   3   4   5   6   7   8                     │
│  nums:  -2   1  -3   4  -1   2   1  -5   4                     │
│  dp:    -2   1  -2   4   3   5   6   1   5                     │
│                      └───────────┘                             │
│                      Max subarray: [4,-1,2,1] = 6              │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int maxSubArray(int[] nums) {
    int maxSum = nums[0];
    int currentSum = nums[0];

    for (int i = 1; i < nums.length; i++) {
        currentSum = Math.max(nums[i], currentSum + nums[i]);
        maxSum = Math.max(maxSum, currentSum);
    }

    return maxSum;
}
```

---

### Problem 163: Coin Change

**LeetCode 322** 🔗 https://leetcode.com/problems/coin-change/

```
┌────────────────────────────────────────────────────────────────┐
│  COIN CHANGE - Minimum coins to make amount                    │
├────────────────────────────────────────────────────────────────┤
│  coins = [1, 2, 5], amount = 11                                │
│                                                                │
│  dp[i] = min coins to make amount i                            │
│                                                                │
│  Amount:  0  1  2  3  4  5  6  7  8  9  10  11                 │
│  dp:      0  1  1  2  2  1  2  2  3  3   2   3                 │
│                                                                │
│  For amount 11:                                                │
│  - Use coin 5: dp[11-5] + 1 = dp[6] + 1 = 3                    │
│  - Use coin 2: dp[11-2] + 1 = dp[9] + 1 = 4                    │
│  - Use coin 1: dp[11-1] + 1 = dp[10] + 1 = 3                   │
│  Min = 3 (5 + 5 + 1)                                           │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int coinChange(int[] coins, int amount) {
    int[] dp = new int[amount + 1];
    Arrays.fill(dp, amount + 1);
    dp[0] = 0;

    for (int i = 1; i <= amount; i++) {
        for (int coin : coins) {
            if (coin <= i) {
                dp[i] = Math.min(dp[i], dp[i - coin] + 1);
            }
        }
    }

    return dp[amount] > amount ? -1 : dp[amount];
}
```

---

## 10.2 2D Dynamic Programming

### Problem 164: Unique Paths

**LeetCode 62** 🔗 https://leetcode.com/problems/unique-paths/

```
┌────────────────────────────────────────────────────────────────┐
│  UNIQUE PATHS - Count paths from top-left to bottom-right      │
├────────────────────────────────────────────────────────────────┤
│  m = 3, n = 7 (3 rows, 7 cols)                                 │
│                                                                │
│  ┌───┬───┬───┬───┬───┬───┬───┐                                 │
│  │ 1 │ 1 │ 1 │ 1 │ 1 │ 1 │ 1 │                                 │
│  ├───┼───┼───┼───┼───┼───┼───┤                                 │
│  │ 1 │ 2 │ 3 │ 4 │ 5 │ 6 │ 7 │                                 │
│  ├───┼───┼───┼───┼───┼───┼───┤                                 │
│  │ 1 │ 3 │ 6 │10 │15 │21 │28 │                                 │
│  └───┴───┴───┴───┴───┴───┴───┘                                 │
│                                                                │
│  dp[i][j] = dp[i-1][j] + dp[i][j-1]                            │
│  Output: 28 paths                                              │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int uniquePaths(int m, int n) {
    int[] dp = new int[n];
    Arrays.fill(dp, 1);

    for (int i = 1; i < m; i++) {
        for (int j = 1; j < n; j++) {
            dp[j] = dp[j] + dp[j - 1];
        }
    }

    return dp[n - 1];
}
```

---

### Problem 165: Unique Paths II (With Obstacles)

**LeetCode 63** 🔗 https://leetcode.com/problems/unique-paths-ii/

```
┌────────────────────────────────────────────────────────────────┐
│  UNIQUE PATHS II - Grid with obstacles                         │
├────────────────────────────────────────────────────────────────┤
│  grid = [[0,0,0],                                              │
│          [0,1,0],    1 = obstacle                              │
│          [0,0,0]]                                              │
│                                                                │
│  ┌───┬───┬───┐                                                 │
│  │ 1 │ 1 │ 1 │                                                 │
│  ├───┼───┼───┤                                                 │
│  │ 1 │ X │ 1 │    X = blocked                                  │
│  ├───┼───┼───┤                                                 │
│  │ 1 │ 1 │ 2 │                                                 │
│  └───┴───┴───┘                                                 │
│                                                                │
│  Output: 2 paths                                               │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int uniquePathsWithObstacles(int[][] grid) {
    int m = grid.length, n = grid[0].length;

    if (grid[0][0] == 1) return 0;

    int[] dp = new int[n];
    dp[0] = 1;

    for (int i = 0; i < m; i++) {
        for (int j = 0; j < n; j++) {
            if (grid[i][j] == 1) {
                dp[j] = 0;
            } else if (j > 0) {
                dp[j] = dp[j] + dp[j - 1];
            }
        }
    }

    return dp[n - 1];
}
```

---

### Problem 166: Minimum Path Sum

**LeetCode 64** 🔗 https://leetcode.com/problems/minimum-path-sum/

```
┌────────────────────────────────────────────────────────────────┐
│  MINIMUM PATH SUM - Min cost path top-left to bottom-right     │
├────────────────────────────────────────────────────────────────┤
│  grid = [[1,3,1],                                              │
│          [1,5,1],                                              │
│          [4,2,1]]                                              │
│                                                                │
│  ┌───┬───┬───┐     ┌───┬───┬───┐                               │
│  │ 1 │ 3 │ 1 │     │ 1 │ 4 │ 5 │  dp values                   │
│  ├───┼───┼───┤  →  ├───┼───┼───┤                               │
│  │ 1 │ 5 │ 1 │     │ 2 │ 7 │ 6 │                               │
│  ├───┼───┼───┤     ├───┼───┼───┤                               │
│  │ 4 │ 2 │ 1 │     │ 6 │ 8 │ 7 │                               │
│  └───┴───┴───┘     └───┴───┴───┘                               │
│                                                                │
│  Path: 1→3→1→1→1 = 7                                           │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int minPathSum(int[][] grid) {
    int m = grid.length, n = grid[0].length;

    for (int i = 0; i < m; i++) {
        for (int j = 0; j < n; j++) {
            if (i == 0 && j == 0) continue;
            else if (i == 0) grid[i][j] += grid[i][j-1];
            else if (j == 0) grid[i][j] += grid[i-1][j];
            else grid[i][j] += Math.min(grid[i-1][j], grid[i][j-1]);
        }
    }

    return grid[m-1][n-1];
}
```

---

### Problem 167: Longest Common Subsequence

**LeetCode 1143** 🔗 https://leetcode.com/problems/longest-common-subsequence/

```
┌────────────────────────────────────────────────────────────────┐
│  LONGEST COMMON SUBSEQUENCE                                    │
├────────────────────────────────────────────────────────────────┤
│  text1 = "abcde", text2 = "ace"                                │
│                                                                │
│      ""  a  c  e                                               │
│  ""   0  0  0  0                                               │
│  a    0  1  1  1     If match: dp[i][j] = dp[i-1][j-1] + 1     │
│  b    0  1  1  1     Else: dp[i][j] = max(dp[i-1][j],          │
│  c    0  1  2  2                          dp[i][j-1])          │
│  d    0  1  2  2                                               │
│  e    0  1  2  3                                               │
│                                                                │
│  LCS = "ace", length = 3                                       │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int longestCommonSubsequence(String text1, String text2) {
    int m = text1.length(), n = text2.length();
    int[][] dp = new int[m + 1][n + 1];

    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (text1.charAt(i-1) == text2.charAt(j-1)) {
                dp[i][j] = dp[i-1][j-1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i-1][j], dp[i][j-1]);
            }
        }
    }

    return dp[m][n];
}
```

---

### Problem 168: Edit Distance

**LeetCode 72** 🔗 https://leetcode.com/problems/edit-distance/

```
┌────────────────────────────────────────────────────────────────┐
│  EDIT DISTANCE - Min operations to convert word1 to word2      │
├────────────────────────────────────────────────────────────────┤
│  word1 = "horse", word2 = "ros"                                │
│  Operations: Insert, Delete, Replace                           │
│                                                                │
│      ""  r  o  s                                               │
│  ""   0  1  2  3                                               │
│  h    1  1  2  3    If match: dp[i][j] = dp[i-1][j-1]          │
│  o    2  2  1  2    Else: 1 + min(dp[i-1][j],    // delete     │
│  r    3  2  2  2                 dp[i][j-1],    // insert      │
│  s    4  3  3  2                 dp[i-1][j-1])  // replace     │
│  e    5  4  4  3                                               │
│                                                                │
│  Output: 3 (horse → rorse → rose → ros)                        │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int minDistance(String word1, String word2) {
    int m = word1.length(), n = word2.length();
    int[][] dp = new int[m + 1][n + 1];

    // Base cases
    for (int i = 0; i <= m; i++) dp[i][0] = i;
    for (int j = 0; j <= n; j++) dp[0][j] = j;

    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (word1.charAt(i-1) == word2.charAt(j-1)) {
                dp[i][j] = dp[i-1][j-1];
            } else {
                dp[i][j] = 1 + Math.min(dp[i-1][j-1],
                               Math.min(dp[i-1][j], dp[i][j-1]));
            }
        }
    }

    return dp[m][n];
}
```

---

## 10.3 Knapsack Problems

### Problem 169: 0/1 Knapsack

**Classic Problem**

```
┌────────────────────────────────────────────────────────────────┐
│  0/1 KNAPSACK - Max value with weight limit                    │
├────────────────────────────────────────────────────────────────┤
│  weights = [1, 2, 3], values = [6, 10, 12], capacity = 5       │
│                                                                │
│  Item 0: weight=1, value=6                                     │
│  Item 1: weight=2, value=10                                    │
│  Item 2: weight=3, value=12                                    │
│                                                                │
│  Take items 1 and 2: weight=5, value=22 ✓                      │
│                                                                │
│      Cap:  0  1  2  3  4  5                                    │
│  Item 0:   0  6  6  6  6  6                                    │
│  Item 1:   0  6 10 16 16 16                                    │
│  Item 2:   0  6 10 16 18 22                                    │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int knapsack(int[] weights, int[] values, int capacity) {
    int n = weights.length;
    int[] dp = new int[capacity + 1];

    for (int i = 0; i < n; i++) {
        // Traverse backwards to avoid using same item twice
        for (int w = capacity; w >= weights[i]; w--) {
            dp[w] = Math.max(dp[w], dp[w - weights[i]] + values[i]);
        }
    }

    return dp[capacity];
}
```

---

### Problem 170: Partition Equal Subset Sum

**LeetCode 416** 🔗 https://leetcode.com/problems/partition-equal-subset-sum/

```
┌────────────────────────────────────────────────────────────────┐
│  PARTITION EQUAL SUBSET SUM                                    │
├────────────────────────────────────────────────────────────────┤
│  nums = [1, 5, 11, 5]                                          │
│  Total = 22, Target = 11                                       │
│                                                                │
│  Can we find subset with sum = 11?                             │
│  Yes! [1, 5, 5] and [11]                                       │
│                                                                │
│  This is 0/1 Knapsack with target = sum/2                      │
│                                                                │
│  dp[i] = true if sum i is achievable                           │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public boolean canPartition(int[] nums) {
    int sum = 0;
    for (int num : nums) sum += num;

    if (sum % 2 != 0) return false;

    int target = sum / 2;
    boolean[] dp = new boolean[target + 1];
    dp[0] = true;

    for (int num : nums) {
        for (int i = target; i >= num; i--) {
            dp[i] = dp[i] || dp[i - num];
        }
    }

    return dp[target];
}
```

---

### Problem 171: Target Sum

**LeetCode 494** 🔗 https://leetcode.com/problems/target-sum/

```
┌────────────────────────────────────────────────────────────────┐
│  TARGET SUM - Assign + or - to reach target                    │
├────────────────────────────────────────────────────────────────┤
│  nums = [1, 1, 1, 1, 1], target = 3                            │
│                                                                │
│  Ways to get 3:                                                │
│  -1 +1 +1 +1 +1 = 3                                            │
│  +1 -1 +1 +1 +1 = 3                                            │
│  +1 +1 -1 +1 +1 = 3                                            │
│  +1 +1 +1 -1 +1 = 3                                            │
│  +1 +1 +1 +1 -1 = 3                                            │
│                                                                │
│  Output: 5 ways                                                │
│                                                                │
│  Let P = sum of positives, N = sum of negatives                │
│  P - N = target, P + N = sum                                   │
│  P = (target + sum) / 2                                        │
│  → Find subsets with sum P                                     │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int findTargetSumWays(int[] nums, int target) {
    int sum = 0;
    for (int num : nums) sum += num;

    if ((sum + target) % 2 != 0 || Math.abs(target) > sum) return 0;

    int subsetSum = (sum + target) / 2;
    int[] dp = new int[subsetSum + 1];
    dp[0] = 1;

    for (int num : nums) {
        for (int i = subsetSum; i >= num; i--) {
            dp[i] += dp[i - num];
        }
    }

    return dp[subsetSum];
}
```

---

## 10.4 Subsequence Problems

### Problem 172: Longest Increasing Subsequence

**LeetCode 300** 🔗 https://leetcode.com/problems/longest-increasing-subsequence/

```
┌────────────────────────────────────────────────────────────────┐
│  LONGEST INCREASING SUBSEQUENCE                                │
├────────────────────────────────────────────────────────────────┤
│  nums = [10, 9, 2, 5, 3, 7, 101, 18]                           │
│                                                                │
│  LIS: [2, 3, 7, 101] or [2, 5, 7, 101]                         │
│  Length = 4                                                    │
│                                                                │
│  O(n²) DP: dp[i] = max length ending at i                      │
│  Index:  0   1  2  3  4  5   6   7                             │
│  nums:  10   9  2  5  3  7 101  18                             │
│  dp:     1   1  1  2  2  3   4   4                             │
│                                                                │
│  O(n log n): Binary search on patience sorting                 │
└────────────────────────────────────────────────────────────────┘
```

**Solution (O(n log n)):**

```java
public int lengthOfLIS(int[] nums) {
    List<Integer> tails = new ArrayList<>();

    for (int num : nums) {
        int pos = binarySearch(tails, num);
        if (pos == tails.size()) {
            tails.add(num);
        } else {
            tails.set(pos, num);
        }
    }

    return tails.size();
}

private int binarySearch(List<Integer> tails, int target) {
    int left = 0, right = tails.size();
    while (left < right) {
        int mid = left + (right - left) / 2;
        if (tails.get(mid) < target) {
            left = mid + 1;
        } else {
            right = mid;
        }
    }
    return left;
}
```

---

### Problem 173: Word Break

**LeetCode 139** 🔗 https://leetcode.com/problems/word-break/

```
┌────────────────────────────────────────────────────────────────┐
│  WORD BREAK - Can string be segmented into dictionary words?   │
├────────────────────────────────────────────────────────────────┤
│  s = "leetcode", wordDict = ["leet", "code"]                   │
│                                                                │
│  "leetcode" = "leet" + "code" ✓                                │
│                                                                │
│  dp[i] = true if s[0..i) can be segmented                      │
│                                                                │
│  Index:  0  1  2  3  4  5  6  7  8                             │
│  s:      "" l  e  e  t  c  o  d  e                             │
│  dp:      T F  F  F  T  F  F  F  T                             │
│              "leet"↗         "code"↗                           │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public boolean wordBreak(String s, List<String> wordDict) {
    Set<String> words = new HashSet<>(wordDict);
    boolean[] dp = new boolean[s.length() + 1];
    dp[0] = true;

    for (int i = 1; i <= s.length(); i++) {
        for (int j = 0; j < i; j++) {
            if (dp[j] && words.contains(s.substring(j, i))) {
                dp[i] = true;
                break;
            }
        }
    }

    return dp[s.length()];
}
```

---

### Problem 174: Longest Palindromic Subsequence

**LeetCode 516** 🔗 https://leetcode.com/problems/longest-palindromic-subsequence/

```
┌────────────────────────────────────────────────────────────────┐
│  LONGEST PALINDROMIC SUBSEQUENCE                               │
├────────────────────────────────────────────────────────────────┤
│  s = "bbbab"                                                   │
│                                                                │
│  LPS = "bbbb", length = 4                                      │
│                                                                │
│  dp[i][j] = LPS length in s[i..j]                              │
│                                                                │
│      b  b  b  a  b                                             │
│  b   1  2  3  3  4                                             │
│  b      1  2  2  3                                             │
│  b         1  1  3                                             │
│  a            1  1                                             │
│  b               1                                             │
│                                                                │
│  If s[i]==s[j]: dp[i][j] = dp[i+1][j-1] + 2                    │
│  Else: dp[i][j] = max(dp[i+1][j], dp[i][j-1])                  │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int longestPalindromeSubseq(String s) {
    int n = s.length();
    int[][] dp = new int[n][n];

    // Base case: single characters
    for (int i = 0; i < n; i++) dp[i][i] = 1;

    // Fill diagonally
    for (int len = 2; len <= n; len++) {
        for (int i = 0; i <= n - len; i++) {
            int j = i + len - 1;

            if (s.charAt(i) == s.charAt(j)) {
                dp[i][j] = dp[i+1][j-1] + 2;
            } else {
                dp[i][j] = Math.max(dp[i+1][j], dp[i][j-1]);
            }
        }
    }

    return dp[0][n-1];
}
```

---

## 10.5 State Machine DP

### Problem 175: Best Time to Buy and Sell Stock with Cooldown

**LeetCode 309** 🔗 https://leetcode.com/problems/best-time-to-buy-and-sell-stock-with-cooldown/

```
┌────────────────────────────────────────────────────────────────┐
│  STOCK WITH COOLDOWN                                           │
├────────────────────────────────────────────────────────────────┤
│  prices = [1, 2, 3, 0, 2]                                      │
│  After sell, must wait 1 day before buying again               │
│                                                                │
│  States:                                                       │
│  ┌─────────┐    buy    ┌─────────┐                             │
│  │  REST   │ ────────→ │  HOLD   │                             │
│  └─────────┘           └─────────┘                             │
│       ↑                     │                                  │
│       │                    sell                                │
│       │                     │                                  │
│       │    ┌─────────┐      │                                  │
│       └────│ COOLDOWN│ ←────┘                                  │
│            └─────────┘                                         │
│                                                                │
│  rest[i] = max(rest[i-1], cool[i-1])                           │
│  hold[i] = max(hold[i-1], rest[i-1] - price)                   │
│  cool[i] = hold[i-1] + price                                   │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int maxProfit(int[] prices) {
    int rest = 0, hold = Integer.MIN_VALUE, cool = 0;

    for (int price : prices) {
        int prevHold = hold;
        hold = Math.max(hold, rest - price);
        rest = Math.max(rest, cool);
        cool = prevHold + price;
    }

    return Math.max(rest, cool);
}
```

---

# 📚 SECTION 11: BACKTRACKING PROBLEMS

```
┌─────────────────────────────────────────────────────────────────┐
│                    BACKTRACKING TEMPLATE                        │
├─────────────────────────────────────────────────────────────────┤
│  def backtrack(path, choices):                                  │
│      if goal_reached:                                           │
│          result.add(path.copy())                                │
│          return                                                 │
│                                                                 │
│      for choice in choices:                                     │
│          if is_valid(choice):                                   │
│              path.add(choice)         # Make choice             │
│              backtrack(path, choices) # Explore                 │
│              path.remove(choice)      # Undo choice             │
│                                                                 │
│  KEY PATTERNS:                                                  │
│  1. Subsets: Include or exclude each element                    │
│  2. Permutations: Arrange elements in different orders          │
│  3. Combinations: Select k elements from n                      │
│  4. Partition: Divide into groups                               │
│  5. Constraint satisfaction: N-Queens, Sudoku                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 11.1 Subsets & Combinations

### Problem 176: Subsets

**LeetCode 78** 🔗 https://leetcode.com/problems/subsets/

```
┌────────────────────────────────────────────────────────────────┐
│  SUBSETS - All possible subsets (power set)                    │
├────────────────────────────────────────────────────────────────┤
│  nums = [1, 2, 3]                                              │
│                                                                │
│  Decision Tree:                                                │
│                    []                                          │
│           ┌────────┴────────┐                                  │
│        include 1         skip 1                                │
│          [1]               []                                  │
│       ┌───┴───┐        ┌───┴───┐                               │
│      [1,2]   [1]      [2]     []                               │
│     ┌─┴─┐   ┌─┴─┐   ┌─┴─┐   ┌─┴─┐                              │
│  [1,2,3][1,2][1,3][1][2,3][2] [3] []                           │
│                                                                │
│  Output: [[], [1], [2], [3], [1,2], [1,3], [2,3], [1,2,3]]     │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public List<List<Integer>> subsets(int[] nums) {
    List<List<Integer>> result = new ArrayList<>();
    backtrack(nums, 0, new ArrayList<>(), result);
    return result;
}

private void backtrack(int[] nums, int start, List<Integer> path,
                       List<List<Integer>> result) {
    result.add(new ArrayList<>(path));

    for (int i = start; i < nums.length; i++) {
        path.add(nums[i]);
        backtrack(nums, i + 1, path, result);
        path.remove(path.size() - 1);
    }
}
```

---

### Problem 177: Subsets II (With Duplicates)

**LeetCode 90** 🔗 https://leetcode.com/problems/subsets-ii/

```
┌────────────────────────────────────────────────────────────────┐
│  SUBSETS II - Skip duplicates                                  │
├────────────────────────────────────────────────────────────────┤
│  nums = [1, 2, 2]                                              │
│                                                                │
│  Without skip: [1,2], [1,2] would appear twice                 │
│  Key: Skip nums[i] if nums[i] == nums[i-1] at same level       │
│                                                                │
│  Output: [[], [1], [1,2], [1,2,2], [2], [2,2]]                 │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public List<List<Integer>> subsetsWithDup(int[] nums) {
    List<List<Integer>> result = new ArrayList<>();
    Arrays.sort(nums);  // Sort to handle duplicates
    backtrack(nums, 0, new ArrayList<>(), result);
    return result;
}

private void backtrack(int[] nums, int start, List<Integer> path,
                       List<List<Integer>> result) {
    result.add(new ArrayList<>(path));

    for (int i = start; i < nums.length; i++) {
        // Skip duplicates at same level
        if (i > start && nums[i] == nums[i-1]) continue;

        path.add(nums[i]);
        backtrack(nums, i + 1, path, result);
        path.remove(path.size() - 1);
    }
}
```

---

### Problem 178: Combination Sum

**LeetCode 39** 🔗 https://leetcode.com/problems/combination-sum/

```
┌────────────────────────────────────────────────────────────────┐
│  COMBINATION SUM - Unlimited use of each number                │
├────────────────────────────────────────────────────────────────┤
│  candidates = [2, 3, 6, 7], target = 7                         │
│                                                                │
│  Can reuse same number:                                        │
│  2 + 2 + 3 = 7 ✓                                               │
│  7 = 7 ✓                                                       │
│                                                                │
│  Output: [[2,2,3], [7]]                                        │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public List<List<Integer>> combinationSum(int[] candidates, int target) {
    List<List<Integer>> result = new ArrayList<>();
    backtrack(candidates, target, 0, new ArrayList<>(), result);
    return result;
}

private void backtrack(int[] candidates, int remain, int start,
                       List<Integer> path, List<List<Integer>> result) {
    if (remain == 0) {
        result.add(new ArrayList<>(path));
        return;
    }

    for (int i = start; i < candidates.length; i++) {
        if (candidates[i] > remain) continue;

        path.add(candidates[i]);
        backtrack(candidates, remain - candidates[i], i, path, result);
        path.remove(path.size() - 1);
    }
}
```

---

### Problem 179: Combination Sum II

**LeetCode 40** 🔗 https://leetcode.com/problems/combination-sum-ii/

```
┌────────────────────────────────────────────────────────────────┐
│  COMBINATION SUM II - Each number used once                    │
├────────────────────────────────────────────────────────────────┤
│  candidates = [10,1,2,7,6,1,5], target = 8                     │
│                                                                │
│  Output: [[1,1,6], [1,2,5], [1,7], [2,6]]                      │
│                                                                │
│  Key: Sort + skip duplicates at same level                     │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public List<List<Integer>> combinationSum2(int[] candidates, int target) {
    List<List<Integer>> result = new ArrayList<>();
    Arrays.sort(candidates);
    backtrack(candidates, target, 0, new ArrayList<>(), result);
    return result;
}

private void backtrack(int[] candidates, int remain, int start,
                       List<Integer> path, List<List<Integer>> result) {
    if (remain == 0) {
        result.add(new ArrayList<>(path));
        return;
    }

    for (int i = start; i < candidates.length; i++) {
        if (candidates[i] > remain) break;
        if (i > start && candidates[i] == candidates[i-1]) continue;

        path.add(candidates[i]);
        backtrack(candidates, remain - candidates[i], i + 1, path, result);
        path.remove(path.size() - 1);
    }
}
```

---

### Problem 180: Combinations

**LeetCode 77** 🔗 https://leetcode.com/problems/combinations/

```
┌────────────────────────────────────────────────────────────────┐
│  COMBINATIONS - Choose k from n                                │
├────────────────────────────────────────────────────────────────┤
│  n = 4, k = 2                                                  │
│  Choose 2 numbers from [1, 2, 3, 4]                            │
│                                                                │
│  Output: [[1,2], [1,3], [1,4], [2,3], [2,4], [3,4]]            │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public List<List<Integer>> combine(int n, int k) {
    List<List<Integer>> result = new ArrayList<>();
    backtrack(n, k, 1, new ArrayList<>(), result);
    return result;
}

private void backtrack(int n, int k, int start, List<Integer> path,
                       List<List<Integer>> result) {
    if (path.size() == k) {
        result.add(new ArrayList<>(path));
        return;
    }

    // Pruning: need k-path.size() more elements
    for (int i = start; i <= n - (k - path.size()) + 1; i++) {
        path.add(i);
        backtrack(n, k, i + 1, path, result);
        path.remove(path.size() - 1);
    }
}
```

---

## 11.2 Permutations

### Problem 181: Permutations

**LeetCode 46** 🔗 https://leetcode.com/problems/permutations/

```
┌────────────────────────────────────────────────────────────────┐
│  PERMUTATIONS - All arrangements                               │
├────────────────────────────────────────────────────────────────┤
│  nums = [1, 2, 3]                                              │
│                                                                │
│  Tree (swap approach):                                         │
│                [1,2,3]                                         │
│        ┌─────────┼─────────┐                                   │
│     [1,2,3]   [2,1,3]   [3,2,1]                                │
│      ┌─┴─┐     ┌─┴─┐     ┌─┴─┐                                 │
│  [1,2,3][1,3,2][2,1,3][2,3,1][3,2,1][3,1,2]                    │
│                                                                │
│  Output: [[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]     │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public List<List<Integer>> permute(int[] nums) {
    List<List<Integer>> result = new ArrayList<>();
    backtrack(nums, new ArrayList<>(), new boolean[nums.length], result);
    return result;
}

private void backtrack(int[] nums, List<Integer> path, boolean[] used,
                       List<List<Integer>> result) {
    if (path.size() == nums.length) {
        result.add(new ArrayList<>(path));
        return;
    }

    for (int i = 0; i < nums.length; i++) {
        if (used[i]) continue;

        used[i] = true;
        path.add(nums[i]);
        backtrack(nums, path, used, result);
        path.remove(path.size() - 1);
        used[i] = false;
    }
}
```

---

### Problem 182: Permutations II (With Duplicates)

**LeetCode 47** 🔗 https://leetcode.com/problems/permutations-ii/

```
┌────────────────────────────────────────────────────────────────┐
│  PERMUTATIONS II - Unique permutations                         │
├────────────────────────────────────────────────────────────────┤
│  nums = [1, 1, 2]                                              │
│                                                                │
│  Output: [[1,1,2], [1,2,1], [2,1,1]]                           │
│                                                                │
│  Key: Sort + skip if same as previous AND previous not used    │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public List<List<Integer>> permuteUnique(int[] nums) {
    List<List<Integer>> result = new ArrayList<>();
    Arrays.sort(nums);
    backtrack(nums, new ArrayList<>(), new boolean[nums.length], result);
    return result;
}

private void backtrack(int[] nums, List<Integer> path, boolean[] used,
                       List<List<Integer>> result) {
    if (path.size() == nums.length) {
        result.add(new ArrayList<>(path));
        return;
    }

    for (int i = 0; i < nums.length; i++) {
        if (used[i]) continue;
        // Skip duplicate: same as previous AND previous not used
        if (i > 0 && nums[i] == nums[i-1] && !used[i-1]) continue;

        used[i] = true;
        path.add(nums[i]);
        backtrack(nums, path, used, result);
        path.remove(path.size() - 1);
        used[i] = false;
    }
}
```

---

## 11.3 String Backtracking

### Problem 183: Palindrome Partitioning

**LeetCode 131** 🔗 https://leetcode.com/problems/palindrome-partitioning/

```
┌────────────────────────────────────────────────────────────────┐
│  PALINDROME PARTITIONING                                       │
├────────────────────────────────────────────────────────────────┤
│  s = "aab"                                                     │
│                                                                │
│  Partitions where each part is palindrome:                     │
│  "a" | "a" | "b" ✓                                             │
│  "aa" | "b" ✓                                                  │
│                                                                │
│  Output: [["a","a","b"], ["aa","b"]]                           │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public List<List<String>> partition(String s) {
    List<List<String>> result = new ArrayList<>();
    backtrack(s, 0, new ArrayList<>(), result);
    return result;
}

private void backtrack(String s, int start, List<String> path,
                       List<List<String>> result) {
    if (start == s.length()) {
        result.add(new ArrayList<>(path));
        return;
    }

    for (int end = start; end < s.length(); end++) {
        if (isPalindrome(s, start, end)) {
            path.add(s.substring(start, end + 1));
            backtrack(s, end + 1, path, result);
            path.remove(path.size() - 1);
        }
    }
}

private boolean isPalindrome(String s, int left, int right) {
    while (left < right) {
        if (s.charAt(left++) != s.charAt(right--)) return false;
    }
    return true;
}
```

---

### Problem 184: Letter Combinations of Phone

**LeetCode 17** 🔗 https://leetcode.com/problems/letter-combinations-of-a-phone-number/

```
┌────────────────────────────────────────────────────────────────┐
│  LETTER COMBINATIONS OF PHONE NUMBER                           │
├────────────────────────────────────────────────────────────────┤
│  digits = "23"                                                 │
│                                                                │
│  2 → "abc", 3 → "def"                                          │
│                                                                │
│       ┌───┬───┬───┐                                            │
│       │ a │ b │ c │  ← digit 2                                 │
│       └─┬─┴─┬─┴─┬─┘                                            │
│    ┌────┴┐ ┌┴───┐ ┌┴────┐                                      │
│  d,e,f  d,e,f  d,e,f     ← digit 3                             │
│                                                                │
│  Output: ["ad","ae","af","bd","be","bf","cd","ce","cf"]        │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
private String[] mapping = {"", "", "abc", "def", "ghi", "jkl",
                            "mno", "pqrs", "tuv", "wxyz"};

public List<String> letterCombinations(String digits) {
    List<String> result = new ArrayList<>();
    if (digits.isEmpty()) return result;

    backtrack(digits, 0, new StringBuilder(), result);
    return result;
}

private void backtrack(String digits, int index, StringBuilder path,
                       List<String> result) {
    if (index == digits.length()) {
        result.add(path.toString());
        return;
    }

    String letters = mapping[digits.charAt(index) - '0'];
    for (char c : letters.toCharArray()) {
        path.append(c);
        backtrack(digits, index + 1, path, result);
        path.deleteCharAt(path.length() - 1);
    }
}
```

---

### Problem 185: Generate Parentheses

**LeetCode 22** 🔗 https://leetcode.com/problems/generate-parentheses/

```
┌────────────────────────────────────────────────────────────────┐
│  GENERATE PARENTHESES                                          │
├────────────────────────────────────────────────────────────────┤
│  n = 3 (3 pairs)                                               │
│                                                                │
│  Rules:                                                        │
│  - Can add '(' if open < n                                     │
│  - Can add ')' if close < open                                 │
│                                                                │
│  Output: ["((()))","(()())","(())()","()(())","()()()"]        │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public List<String> generateParenthesis(int n) {
    List<String> result = new ArrayList<>();
    backtrack(n, 0, 0, new StringBuilder(), result);
    return result;
}

private void backtrack(int n, int open, int close, StringBuilder path,
                       List<String> result) {
    if (path.length() == 2 * n) {
        result.add(path.toString());
        return;
    }

    if (open < n) {
        path.append('(');
        backtrack(n, open + 1, close, path, result);
        path.deleteCharAt(path.length() - 1);
    }

    if (close < open) {
        path.append(')');
        backtrack(n, open, close + 1, path, result);
        path.deleteCharAt(path.length() - 1);
    }
}
```

---

## 11.4 Grid Backtracking

### Problem 186: Word Search

**LeetCode 79** 🔗 https://leetcode.com/problems/word-search/

```
┌────────────────────────────────────────────────────────────────┐
│  WORD SEARCH - Find word in grid                               │
├────────────────────────────────────────────────────────────────┤
│  board = [["A","B","C","E"],                                   │
│           ["S","F","C","S"],                                   │
│           ["A","D","E","E"]]                                   │
│  word = "ABCCED"                                               │
│                                                                │
│  ┌───┬───┬───┬───┐                                             │
│  │ A→│ B→│ C │ E │                                             │
│  ├───┼───┼─↓─┼───┤                                             │
│  │ S │ F │ C │ S │                                             │
│  ├───┼───┼─↓─┼───┤                                             │
│  │ A │ D←│ E │ E │                                             │
│  └───┴───┴───┴───┘                                             │
│                                                                │
│  Output: true                                                  │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public boolean exist(char[][] board, String word) {
    int rows = board.length, cols = board[0].length;

    for (int i = 0; i < rows; i++) {
        for (int j = 0; j < cols; j++) {
            if (backtrack(board, word, i, j, 0)) {
                return true;
            }
        }
    }

    return false;
}

private boolean backtrack(char[][] board, String word, int r, int c, int idx) {
    if (idx == word.length()) return true;

    if (r < 0 || r >= board.length || c < 0 || c >= board[0].length
        || board[r][c] != word.charAt(idx)) {
        return false;
    }

    char temp = board[r][c];
    board[r][c] = '#';  // Mark visited

    boolean found = backtrack(board, word, r+1, c, idx+1) ||
                    backtrack(board, word, r-1, c, idx+1) ||
                    backtrack(board, word, r, c+1, idx+1) ||
                    backtrack(board, word, r, c-1, idx+1);

    board[r][c] = temp;  // Restore
    return found;
}
```

---

### Problem 187: N-Queens

**LeetCode 51** 🔗 https://leetcode.com/problems/n-queens/

```
┌────────────────────────────────────────────────────────────────┐
│  N-QUEENS - Place n queens on n×n board                        │
├────────────────────────────────────────────────────────────────┤
│  n = 4                                                         │
│                                                                │
│  Solution 1:          Solution 2:                              │
│  ┌───┬───┬───┬───┐    ┌───┬───┬───┬───┐                        │
│  │ . │ Q │ . │ . │    │ . │ . │ Q │ . │                        │
│  ├───┼───┼───┼───┤    ├───┼───┼───┼───┤                        │
│  │ . │ . │ . │ Q │    │ Q │ . │ . │ . │                        │
│  ├───┼───┼───┼───┤    ├───┼───┼───┼───┤                        │
│  │ Q │ . │ . │ . │    │ . │ . │ . │ Q │                        │
│  ├───┼───┼───┼───┤    ├───┼───┼───┼───┤                        │
│  │ . │ . │ Q │ . │    │ . │ Q │ . │ . │                        │
│  └───┴───┴───┴───┘    └───┴───┴───┴───┘                        │
│                                                                │
│  Constraints: No two queens on same row, col, or diagonal      │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public List<List<String>> solveNQueens(int n) {
    List<List<String>> result = new ArrayList<>();
    char[][] board = new char[n][n];

    for (char[] row : board) Arrays.fill(row, '.');

    backtrack(board, 0, result);
    return result;
}

private void backtrack(char[][] board, int row, List<List<String>> result) {
    if (row == board.length) {
        result.add(construct(board));
        return;
    }

    for (int col = 0; col < board.length; col++) {
        if (isValid(board, row, col)) {
            board[row][col] = 'Q';
            backtrack(board, row + 1, result);
            board[row][col] = '.';
        }
    }
}

private boolean isValid(char[][] board, int row, int col) {
    // Check column
    for (int i = 0; i < row; i++) {
        if (board[i][col] == 'Q') return false;
    }
    // Check upper-left diagonal
    for (int i = row-1, j = col-1; i >= 0 && j >= 0; i--, j--) {
        if (board[i][j] == 'Q') return false;
    }
    // Check upper-right diagonal
    for (int i = row-1, j = col+1; i >= 0 && j < board.length; i--, j++) {
        if (board[i][j] == 'Q') return false;
    }
    return true;
}

private List<String> construct(char[][] board) {
    List<String> res = new ArrayList<>();
    for (char[] row : board) res.add(new String(row));
    return res;
}
```

---

### Problem 188: Sudoku Solver

**LeetCode 37** 🔗 https://leetcode.com/problems/sudoku-solver/

```
┌────────────────────────────────────────────────────────────────┐
│  SUDOKU SOLVER                                                 │
├────────────────────────────────────────────────────────────────┤
│  Fill 9x9 grid so each row, column, and 3x3 box               │
│  contains digits 1-9 exactly once                              │
│                                                                │
│  ┌───┬───┬───╫───┬───┬───╫───┬───┬───┐                         │
│  │ 5 │ 3 │ . ║ . │ 7 │ . ║ . │ . │ . │                         │
│  │ 6 │ . │ . ║ 1 │ 9 │ 5 ║ . │ . │ . │                         │
│  │ . │ 9 │ 8 ║ . │ . │ . ║ . │ 6 │ . │                         │
│  ╠═══╬═══╬═══╬═══╬═══╬═══╬═══╬═══╬═══╣                         │
│  │ 8 │ . │ . ║ . │ 6 │ . ║ . │ . │ 3 │                         │
│  │ 4 │ . │ . ║ 8 │ . │ 3 ║ . │ . │ 1 │                         │
│  │ 7 │ . │ . ║ . │ 2 │ . ║ . │ . │ 6 │                         │
│  ╠═══╬═══╬═══╬═══╬═══╬═══╬═══╬═══╬═══╣                         │
│  │ . │ 6 │ . ║ . │ . │ . ║ 2 │ 8 │ . │                         │
│  │ . │ . │ . ║ 4 │ 1 │ 9 ║ . │ . │ 5 │                         │
│  │ . │ . │ . ║ . │ 8 │ . ║ . │ 7 │ 9 │                         │
│  └───┴───┴───╨───┴───┴───╨───┴───┴───┘                         │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public void solveSudoku(char[][] board) {
    solve(board);
}

private boolean solve(char[][] board) {
    for (int i = 0; i < 9; i++) {
        for (int j = 0; j < 9; j++) {
            if (board[i][j] == '.') {
                for (char c = '1'; c <= '9'; c++) {
                    if (isValid(board, i, j, c)) {
                        board[i][j] = c;

                        if (solve(board)) return true;

                        board[i][j] = '.';
                    }
                }
                return false;  // No valid number found
            }
        }
    }
    return true;  // Solved
}

private boolean isValid(char[][] board, int row, int col, char c) {
    for (int i = 0; i < 9; i++) {
        if (board[row][i] == c) return false;  // Check row
        if (board[i][col] == c) return false;  // Check column

        // Check 3x3 box
        int boxRow = 3 * (row / 3) + i / 3;
        int boxCol = 3 * (col / 3) + i % 3;
        if (board[boxRow][boxCol] == c) return false;
    }
    return true;
}
```

---

# 📚 SECTION 12: GREEDY ALGORITHMS

```
┌─────────────────────────────────────────────────────────────────┐
│                    GREEDY FUNDAMENTALS                          │
├─────────────────────────────────────────────────────────────────┤
│  KEY INSIGHT:                                                   │
│  Make locally optimal choice at each step → Global optimum      │
│                                                                 │
│  WHEN TO USE GREEDY:                                            │
│  1. Optimal substructure: Optimal solution contains optimal     │
│     solutions to subproblems                                    │
│  2. Greedy choice property: Local optimal leads to global       │
│                                                                 │
│  COMMON PATTERNS:                                               │
│  - Interval scheduling (meetings, activities)                   │
│  - Huffman coding                                               │
│  - Minimum spanning tree (Kruskal's, Prim's)                    │
│  - Dijkstra's shortest path                                     │
│  - Fractional knapsack                                          │
│                                                                 │
│  ⚠️ GREEDY DOESN'T ALWAYS WORK:                                 │
│  - 0/1 Knapsack → Need DP                                       │
│  - Longest path → Need DP/Backtracking                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 12.1 Interval Problems

### Problem 189: Meeting Rooms

**LeetCode 252 (Premium)** 🔒

```
┌────────────────────────────────────────────────────────────────┐
│  MEETING ROOMS - Can attend all meetings?                      │
├────────────────────────────────────────────────────────────────┤
│  intervals = [[0,30], [5,10], [15,20]]                         │
│                                                                │
│  Timeline:                                                     │
│  0────────────────────────────30  Meeting 1                    │
│       5────10                      Meeting 2 (overlaps!)       │
│            15────20                Meeting 3 (overlaps!)       │
│                                                                │
│  Output: false (meetings overlap)                              │
│                                                                │
│  Constraints:                                                  │
│  - 0 <= intervals.length <= 10^4                               │
│  - intervals[i].length == 2                                    │
│  - 0 <= start < end <= 10^6                                    │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public boolean canAttendMeetings(int[][] intervals) {
    // Sort by start time
    Arrays.sort(intervals, (a, b) -> a[0] - b[0]);

    for (int i = 1; i < intervals.length; i++) {
        // If current starts before previous ends → overlap
        if (intervals[i][0] < intervals[i-1][1]) {
            return false;
        }
    }

    return true;
}
```

---

### Problem 190: Meeting Rooms II

**LeetCode 253 (Premium)** 🔒

```
┌────────────────────────────────────────────────────────────────┐
│  MEETING ROOMS II - Minimum rooms needed                       │
├────────────────────────────────────────────────────────────────┤
│  intervals = [[0,30], [5,10], [15,20]]                         │
│                                                                │
│  Room 1: |═══════════════════════════════| [0,30]              │
│  Room 2:      |════|      |═════|          [5,10], [15,20]     │
│                                                                │
│  Output: 2 rooms needed                                        │
│                                                                │
│  Approach: Track concurrent meetings using min-heap            │
│  Heap stores end times of ongoing meetings                     │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int minMeetingRooms(int[][] intervals) {
    if (intervals.length == 0) return 0;

    // Sort by start time
    Arrays.sort(intervals, (a, b) -> a[0] - b[0]);

    // Min-heap to track end times
    PriorityQueue<Integer> heap = new PriorityQueue<>();
    heap.offer(intervals[0][1]);

    for (int i = 1; i < intervals.length; i++) {
        // If earliest ending meeting ends before current starts
        if (intervals[i][0] >= heap.peek()) {
            heap.poll();  // Reuse that room
        }
        heap.offer(intervals[i][1]);  // Add current meeting's end
    }

    return heap.size();
}
```

---

### Problem 191: Non-overlapping Intervals

**LeetCode 435** 🔗 https://leetcode.com/problems/non-overlapping-intervals/

```
┌────────────────────────────────────────────────────────────────┐
│  NON-OVERLAPPING INTERVALS - Min removals for no overlap       │
├────────────────────────────────────────────────────────────────┤
│  intervals = [[1,2], [2,3], [3,4], [1,3]]                      │
│                                                                │
│  1──2  2──3  3──4                                              │
│  1─────3     (overlaps with both above)                        │
│                                                                │
│  Remove [1,3] → No overlaps                                    │
│  Output: 1                                                     │
│                                                                │
│  Greedy: Sort by end time, keep non-overlapping                │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int eraseOverlapIntervals(int[][] intervals) {
    if (intervals.length == 0) return 0;

    // Sort by END time (greedy choice)
    Arrays.sort(intervals, (a, b) -> a[1] - b[1]);

    int count = 0;
    int prevEnd = intervals[0][1];

    for (int i = 1; i < intervals.length; i++) {
        if (intervals[i][0] < prevEnd) {
            // Overlap: remove current (it ends later)
            count++;
        } else {
            prevEnd = intervals[i][1];
        }
    }

    return count;
}
```

---

### Problem 192: Merge Intervals

**LeetCode 56** 🔗 https://leetcode.com/problems/merge-intervals/

```
┌────────────────────────────────────────────────────────────────┐
│  MERGE INTERVALS                                               │
├────────────────────────────────────────────────────────────────┤
│  intervals = [[1,3], [2,6], [8,10], [15,18]]                   │
│                                                                │
│  1───3                                                         │
│    2─────6                                                     │
│              8──10                                              │
│                     15──18                                     │
│  └───────┘                                                     │
│  Merged: [1,6]                                                 │
│                                                                │
│  Output: [[1,6], [8,10], [15,18]]                              │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int[][] merge(int[][] intervals) {
    if (intervals.length <= 1) return intervals;

    // Sort by start time
    Arrays.sort(intervals, (a, b) -> a[0] - b[0]);

    List<int[]> result = new ArrayList<>();
    int[] current = intervals[0];
    result.add(current);

    for (int[] interval : intervals) {
        if (interval[0] <= current[1]) {
            // Overlapping: extend current
            current[1] = Math.max(current[1], interval[1]);
        } else {
            // Non-overlapping: add new interval
            current = interval;
            result.add(current);
        }
    }

    return result.toArray(new int[result.size()][]);
}
```

---

### Problem 193: Insert Interval

**LeetCode 57** 🔗 https://leetcode.com/problems/insert-interval/

```
┌────────────────────────────────────────────────────────────────┐
│  INSERT INTERVAL                                               │
├────────────────────────────────────────────────────────────────┤
│  intervals = [[1,3], [6,9]], newInterval = [2,5]               │
│                                                                │
│  1───3    6───9                                                │
│    2─────5                                                     │
│  └─────┘                                                       │
│  Merge [1,3] and [2,5] → [1,5]                                 │
│                                                                │
│  Output: [[1,5], [6,9]]                                        │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int[][] insert(int[][] intervals, int[] newInterval) {
    List<int[]> result = new ArrayList<>();
    int i = 0;

    // Add all intervals ending before newInterval starts
    while (i < intervals.length && intervals[i][1] < newInterval[0]) {
        result.add(intervals[i++]);
    }

    // Merge overlapping intervals
    while (i < intervals.length && intervals[i][0] <= newInterval[1]) {
        newInterval[0] = Math.min(newInterval[0], intervals[i][0]);
        newInterval[1] = Math.max(newInterval[1], intervals[i][1]);
        i++;
    }
    result.add(newInterval);

    // Add remaining intervals
    while (i < intervals.length) {
        result.add(intervals[i++]);
    }

    return result.toArray(new int[result.size()][]);
}
```

---

## 12.2 Array Greedy

### Problem 194: Jump Game

**LeetCode 55** 🔗 https://leetcode.com/problems/jump-game/

```
┌────────────────────────────────────────────────────────────────┐
│  JUMP GAME - Can reach last index?                             │
├────────────────────────────────────────────────────────────────┤
│  nums = [2, 3, 1, 1, 4]                                        │
│                                                                │
│  Index:  0   1   2   3   4                                     │
│  Value:  2   3   1   1   4                                     │
│          └───┴───┘               From 0, can jump to 1 or 2    │
│              └───┴───┴───┘       From 1, can reach 4!          │
│                                                                │
│  Output: true                                                  │
│                                                                │
│  Greedy: Track max reachable index                             │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public boolean canJump(int[] nums) {
    int maxReach = 0;

    for (int i = 0; i < nums.length; i++) {
        if (i > maxReach) return false;  // Can't reach this index
        maxReach = Math.max(maxReach, i + nums[i]);
        if (maxReach >= nums.length - 1) return true;
    }

    return true;
}
```

---

### Problem 195: Jump Game II

**LeetCode 45** 🔗 https://leetcode.com/problems/jump-game-ii/

```
┌────────────────────────────────────────────────────────────────┐
│  JUMP GAME II - Minimum jumps to reach end                     │
├────────────────────────────────────────────────────────────────┤
│  nums = [2, 3, 1, 1, 4]                                        │
│                                                                │
│  Jump 1: 0 → 1 (jump to index 1)                               │
│  Jump 2: 1 → 4 (jump to index 4)                               │
│                                                                │
│  Output: 2 jumps                                               │
│                                                                │
│  Greedy: BFS-like level traversal                              │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int jump(int[] nums) {
    int jumps = 0;
    int currentEnd = 0;    // End of current jump range
    int farthest = 0;      // Farthest we can reach

    for (int i = 0; i < nums.length - 1; i++) {
        farthest = Math.max(farthest, i + nums[i]);

        if (i == currentEnd) {
            jumps++;
            currentEnd = farthest;
        }
    }

    return jumps;
}
```

---

### Problem 196: Gas Station

**LeetCode 134** 🔗 https://leetcode.com/problems/gas-station/

```
┌────────────────────────────────────────────────────────────────┐
│  GAS STATION - Find starting station for circular trip         │
├────────────────────────────────────────────────────────────────┤
│  gas  = [1, 2, 3, 4, 5]                                        │
│  cost = [3, 4, 5, 1, 2]                                        │
│                                                                │
│  Station: 0   1   2   3   4                                    │
│  net:    -2  -2  -2  +3  +3                                    │
│                                                                │
│  Start at station 3:                                           │
│  3→4: tank = 4-1 = 3                                           │
│  4→0: tank = 3+5-2 = 6                                         │
│  0→1: tank = 6+1-3 = 4                                         │
│  1→2: tank = 4+2-4 = 2                                         │
│  2→3: tank = 2+3-5 = 0 ✓                                       │
│                                                                │
│  Output: 3                                                     │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int canCompleteCircuit(int[] gas, int[] cost) {
    int totalTank = 0;
    int currentTank = 0;
    int startStation = 0;

    for (int i = 0; i < gas.length; i++) {
        int net = gas[i] - cost[i];
        totalTank += net;
        currentTank += net;

        if (currentTank < 0) {
            // Can't reach station i+1 from startStation
            startStation = i + 1;
            currentTank = 0;
        }
    }

    return totalTank >= 0 ? startStation : -1;
}
```

---

### Problem 197: Candy

**LeetCode 135** 🔗 https://leetcode.com/problems/candy/

```
┌────────────────────────────────────────────────────────────────┐
│  CANDY - Min candies for ratings                               │
├────────────────────────────────────────────────────────────────┤
│  ratings = [1, 0, 2]                                           │
│                                                                │
│  Rules:                                                        │
│  - Each child gets at least 1 candy                            │
│  - Higher rating than neighbor → more candies than neighbor    │
│                                                                │
│  Candies: [2, 1, 2]                                            │
│  Child 0: rating 1 > rating 0, gets 2                          │
│  Child 1: lowest rating, gets 1                                │
│  Child 2: rating 2 > rating 0, gets 2                          │
│                                                                │
│  Output: 5 total candies                                       │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int candy(int[] ratings) {
    int n = ratings.length;
    int[] candies = new int[n];
    Arrays.fill(candies, 1);

    // Left to right: handle increasing ratings
    for (int i = 1; i < n; i++) {
        if (ratings[i] > ratings[i-1]) {
            candies[i] = candies[i-1] + 1;
        }
    }

    // Right to left: handle decreasing ratings
    for (int i = n - 2; i >= 0; i--) {
        if (ratings[i] > ratings[i+1]) {
            candies[i] = Math.max(candies[i], candies[i+1] + 1);
        }
    }

    int total = 0;
    for (int c : candies) total += c;
    return total;
}
```

---

## 12.3 String Greedy

### Problem 198: Partition Labels

**LeetCode 763** 🔗 https://leetcode.com/problems/partition-labels/

```
┌────────────────────────────────────────────────────────────────┐
│  PARTITION LABELS - Max partitions with unique chars           │
├────────────────────────────────────────────────────────────────┤
│  s = "ababcbacadefegdehijhklij"                                │
│                                                                │
│  Partition such that each letter appears in at most one part:  │
│  "ababcbaca" | "defegde" | "hijhklij"                          │
│       9           7           8                                │
│                                                                │
│  Output: [9, 7, 8]                                             │
│                                                                │
│  Greedy: Track last occurrence of each char                    │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public List<Integer> partitionLabels(String s) {
    // Find last occurrence of each character
    int[] lastIndex = new int[26];
    for (int i = 0; i < s.length(); i++) {
        lastIndex[s.charAt(i) - 'a'] = i;
    }

    List<Integer> result = new ArrayList<>();
    int start = 0, end = 0;

    for (int i = 0; i < s.length(); i++) {
        end = Math.max(end, lastIndex[s.charAt(i) - 'a']);

        if (i == end) {
            result.add(end - start + 1);
            start = i + 1;
        }
    }

    return result;
}
```

---

### Problem 199: Task Scheduler

**LeetCode 621** 🔗 https://leetcode.com/problems/task-scheduler/

```
┌────────────────────────────────────────────────────────────────┐
│  TASK SCHEDULER - Min time with cooldown                       │
├────────────────────────────────────────────────────────────────┤
│  tasks = ["A","A","A","B","B","B"], n = 2                      │
│                                                                │
│  Must wait n intervals before same task again                  │
│                                                                │
│  A → _ → _ → A → _ → _ → A                                     │
│  A → B → _ → A → B → _ → A → B                                 │
│  A → B → idle → A → B → idle → A → B                           │
│                                                                │
│  Output: 8 intervals                                           │
│                                                                │
│  Formula: (maxFreq - 1) * (n + 1) + countMaxFreq               │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int leastInterval(char[] tasks, int n) {
    int[] freq = new int[26];
    for (char task : tasks) {
        freq[task - 'A']++;
    }

    int maxFreq = 0;
    int countMax = 0;

    for (int f : freq) {
        if (f > maxFreq) {
            maxFreq = f;
            countMax = 1;
        } else if (f == maxFreq) {
            countMax++;
        }
    }

    // Formula: (maxFreq - 1) * (n + 1) + countMaxFreq
    int slots = (maxFreq - 1) * (n + 1) + countMax;

    return Math.max(slots, tasks.length);
}
```

---

## 12.4 Math Greedy

### Problem 200: Maximum Subarray (Kadane's - also DP)

**LeetCode 53** 🔗 https://leetcode.com/problems/maximum-subarray/

```
┌────────────────────────────────────────────────────────────────┐
│  MAXIMUM SUBARRAY - Kadane's as Greedy                         │
├────────────────────────────────────────────────────────────────┤
│  nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]                        │
│                                                                │
│  Greedy choice: At each position, decide to:                   │
│  - Extend previous subarray, OR                                │
│  - Start fresh from current element                            │
│                                                                │
│  If previous sum is negative, start fresh!                     │
│                                                                │
│  Max subarray: [4, -1, 2, 1] = 6                               │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int maxSubArray(int[] nums) {
    int maxSum = nums[0];
    int currentSum = nums[0];

    for (int i = 1; i < nums.length; i++) {
        // Greedy: extend or start fresh
        currentSum = Math.max(nums[i], currentSum + nums[i]);
        maxSum = Math.max(maxSum, currentSum);
    }

    return maxSum;
}
```

---

### Problem 201: Best Time to Buy and Sell Stock II

**LeetCode 122** 🔗 https://leetcode.com/problems/best-time-to-buy-and-sell-stock-ii/

```
┌────────────────────────────────────────────────────────────────┐
│  STOCK II - Multiple transactions allowed                      │
├────────────────────────────────────────────────────────────────┤
│  prices = [7, 1, 5, 3, 6, 4]                                   │
│                                                                │
│      7                                                         │
│       \    5       6                                           │
│        \  /\      /\                                           │
│         1   \   /    4                                         │
│              3                                                 │
│                                                                │
│  Buy at 1, sell at 5: profit = 4                               │
│  Buy at 3, sell at 6: profit = 3                               │
│  Total: 7                                                      │
│                                                                │
│  Greedy: Collect ALL positive differences                      │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int maxProfit(int[] prices) {
    int profit = 0;

    for (int i = 1; i < prices.length; i++) {
        // Greedy: take every positive difference
        if (prices[i] > prices[i-1]) {
            profit += prices[i] - prices[i-1];
        }
    }

    return profit;
}
```

---

# 📚 SECTION 13: HACKEREARTH & CODEFORCES MIXED PROBLEMS

```
┌─────────────────────────────────────────────────────────────────┐
│              COMPETITIVE PROGRAMMING PATTERNS                   │
├─────────────────────────────────────────────────────────────────┤
│  WHY PRACTICE THESE PLATFORMS?                                  │
│  - Different problem styles than LeetCode                       │
│  - Focus on mathematical thinking                               │
│  - Time complexity matters more                                 │
│  - Better at handling edge cases                                │
│                                                                 │
│  COMMON TOPICS:                                                 │
│  • Number Theory (primes, GCD, modular arithmetic)              │
│  • Combinatorics                                                │
│  • Bit Manipulation                                             │
│  • Sorting & Searching variations                               │
│  • Implementation problems                                      │
│  • Ad-hoc problems (pattern recognition)                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 13.1 Number Theory Problems

### Problem 202: Sieve of Eratosthenes (HackerEarth Classic)

```
┌────────────────────────────────────────────────────────────────┐
│  SIEVE OF ERATOSTHENES - Find all primes up to N               │
├────────────────────────────────────────────────────────────────┤
│  n = 30                                                        │
│                                                                │
│  Initial: 2  3  4  5  6  7  8  9 10 11 12 ... 30               │
│                                                                │
│  Mark multiples of 2: ✗4 ✗6 ✗8 ✗10 ✗12...                      │
│  Mark multiples of 3: ✗9 ✗15 ✗21 ✗27...                        │
│  Mark multiples of 5: ✗25...                                   │
│                                                                │
│  Primes: 2, 3, 5, 7, 11, 13, 17, 19, 23, 29                    │
│                                                                │
│  Time: O(n log log n), Space: O(n)                             │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public List<Integer> sieveOfEratosthenes(int n) {
    boolean[] isPrime = new boolean[n + 1];
    Arrays.fill(isPrime, true);
    isPrime[0] = isPrime[1] = false;

    for (int i = 2; i * i <= n; i++) {
        if (isPrime[i]) {
            for (int j = i * i; j <= n; j += i) {
                isPrime[j] = false;
            }
        }
    }

    List<Integer> primes = new ArrayList<>();
    for (int i = 2; i <= n; i++) {
        if (isPrime[i]) primes.add(i);
    }
    return primes;
}
```

---

### Problem 203: Prime Factorization (Codeforces Style)

```
┌────────────────────────────────────────────────────────────────┐
│  PRIME FACTORIZATION - Find all prime factors                  │
├────────────────────────────────────────────────────────────────┤
│  n = 84                                                        │
│                                                                │
│  84 ÷ 2 = 42                                                   │
│  42 ÷ 2 = 21                                                   │
│  21 ÷ 3 = 7                                                    │
│  7 ÷ 7 = 1                                                     │
│                                                                │
│  84 = 2² × 3 × 7                                               │
│                                                                │
│  Output: {2: 2, 3: 1, 7: 1}                                    │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public Map<Integer, Integer> primeFactors(int n) {
    Map<Integer, Integer> factors = new HashMap<>();

    // Check for 2s
    while (n % 2 == 0) {
        factors.merge(2, 1, Integer::sum);
        n /= 2;
    }

    // Check odd factors
    for (int i = 3; i * i <= n; i += 2) {
        while (n % i == 0) {
            factors.merge(i, 1, Integer::sum);
            n /= i;
        }
    }

    // If n is still > 1, it's a prime factor
    if (n > 1) {
        factors.put(n, 1);
    }

    return factors;
}
```

---

### Problem 204: Modular Exponentiation (HackerEarth)

```
┌────────────────────────────────────────────────────────────────┐
│  MODULAR EXPONENTIATION - Calculate (base^exp) % mod           │
├────────────────────────────────────────────────────────────────┤
│  base = 2, exp = 10, mod = 1000                                │
│                                                                │
│  Naive: 2^10 = 1024 → 1024 % 1000 = 24                         │
│                                                                │
│  Fast (Binary Exponentiation):                                 │
│  2^10 = 2^8 × 2^2 = 256 × 4 = 1024                             │
│                                                                │
│  10 in binary = 1010                                           │
│  2^1 = 2 (bit 1: skip)                                         │
│  2^2 = 4 (bit 2: use) → result = 4                             │
│  2^4 = 16 (bit 3: skip)                                        │
│  2^8 = 256 (bit 4: use) → result = 4 × 256 = 1024              │
│                                                                │
│  Time: O(log exp)                                              │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public long modPow(long base, long exp, long mod) {
    long result = 1;
    base = base % mod;

    while (exp > 0) {
        // If exp is odd, multiply base with result
        if ((exp & 1) == 1) {
            result = (result * base) % mod;
        }

        // exp must be even now
        exp = exp >> 1;  // exp = exp / 2
        base = (base * base) % mod;
    }

    return result;
}
```

---

### Problem 205: GCD and LCM (Codeforces)

```
┌────────────────────────────────────────────────────────────────┐
│  GCD (Greatest Common Divisor) using Euclidean Algorithm       │
├────────────────────────────────────────────────────────────────┤
│  a = 48, b = 18                                                │
│                                                                │
│  48 = 18 × 2 + 12                                              │
│  18 = 12 × 1 + 6                                               │
│  12 = 6 × 2 + 0                                                │
│                                                                │
│  GCD(48, 18) = 6                                               │
│                                                                │
│  LCM(a, b) = (a × b) / GCD(a, b)                               │
│  LCM(48, 18) = 864 / 6 = 144                                   │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int gcd(int a, int b) {
    while (b != 0) {
        int temp = b;
        b = a % b;
        a = temp;
    }
    return a;
}

public long lcm(int a, int b) {
    return (long) a * b / gcd(a, b);
}

// GCD of array
public int gcdOfArray(int[] arr) {
    int result = arr[0];
    for (int i = 1; i < arr.length; i++) {
        result = gcd(result, arr[i]);
    }
    return result;
}
```

---

## 13.2 Bit Manipulation

### Problem 206: Count Set Bits (HackerEarth)

```
┌────────────────────────────────────────────────────────────────┐
│  COUNT SET BITS - Number of 1s in binary representation        │
├────────────────────────────────────────────────────────────────┤
│  n = 13                                                        │
│  Binary: 1101                                                  │
│  Set bits: 3                                                   │
│                                                                │
│  Brian Kernighan's Algorithm:                                  │
│  n & (n-1) removes rightmost set bit                           │
│                                                                │
│  13 = 1101                                                     │
│  12 = 1100                                                     │
│  13 & 12 = 1100 (12) → count = 1                               │
│  12 & 11 = 1000 (8)  → count = 2                               │
│  8 & 7 = 0           → count = 3                               │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int countSetBits(int n) {
    int count = 0;
    while (n != 0) {
        n = n & (n - 1);  // Remove rightmost set bit
        count++;
    }
    return count;
}

// Count set bits from 1 to n
public int countSetBitsRange(int n) {
    int count = 0;
    for (int i = 1; i <= n; i++) {
        count += countSetBits(i);
    }
    return count;
}
```

---

### Problem 207: Power of Two (Codeforces)

```
┌────────────────────────────────────────────────────────────────┐
│  POWER OF TWO - Check if n is power of 2                       │
├────────────────────────────────────────────────────────────────┤
│  Powers of 2 have exactly ONE set bit:                         │
│  1  = 0001                                                     │
│  2  = 0010                                                     │
│  4  = 0100                                                     │
│  8  = 1000                                                     │
│  16 = 10000                                                    │
│                                                                │
│  Trick: n & (n-1) == 0 for powers of 2                         │
│                                                                │
│  8 = 1000, 7 = 0111                                            │
│  8 & 7 = 0000 → True                                           │
│                                                                │
│  6 = 0110, 5 = 0101                                            │
│  6 & 5 = 0100 → False                                          │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public boolean isPowerOfTwo(int n) {
    return n > 0 && (n & (n - 1)) == 0;
}

// Find highest power of 2 <= n
public int highestPowerOf2(int n) {
    n |= n >> 1;
    n |= n >> 2;
    n |= n >> 4;
    n |= n >> 8;
    n |= n >> 16;
    return (n + 1) >> 1;
}
```

---

### Problem 208: XOR Queries (HackerEarth)

```
┌────────────────────────────────────────────────────────────────┐
│  XOR QUERIES - XOR of range [L, R]                             │
├────────────────────────────────────────────────────────────────┤
│  arr = [1, 3, 4, 8], queries = [[0,1], [1,2], [0,3]]           │
│                                                                │
│  XOR properties:                                               │
│  - a ⊕ a = 0                                                   │
│  - a ⊕ 0 = a                                                   │
│  - Associative and commutative                                 │
│                                                                │
│  Prefix XOR: [1, 1⊕3, 1⊕3⊕4, 1⊕3⊕4⊕8]                          │
│            = [1, 2, 6, 14]                                     │
│                                                                │
│  XOR[L,R] = prefix[R] ⊕ prefix[L-1]                            │
│  XOR[1,2] = prefix[2] ⊕ prefix[0] = 6 ⊕ 1 = 7                  │
│  Check: 3 ⊕ 4 = 7 ✓                                            │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int[] xorQueries(int[] arr, int[][] queries) {
    int n = arr.length;
    int[] prefix = new int[n + 1];

    // Build prefix XOR
    for (int i = 0; i < n; i++) {
        prefix[i + 1] = prefix[i] ^ arr[i];
    }

    int[] result = new int[queries.length];
    for (int i = 0; i < queries.length; i++) {
        int left = queries[i][0];
        int right = queries[i][1];
        result[i] = prefix[right + 1] ^ prefix[left];
    }

    return result;
}
```

---

## 13.3 Implementation Problems

### Problem 209: Spiral Matrix (Codeforces Style)

```
┌────────────────────────────────────────────────────────────────┐
│  SPIRAL MATRIX - Print matrix in spiral order                  │
├────────────────────────────────────────────────────────────────┤
│  matrix = [[1,2,3],                                            │
│            [4,5,6],                                            │
│            [7,8,9]]                                            │
│                                                                │
│  ┌───┬───┬───┐                                                 │
│  │ 1 → 2 → 3 │                                                 │
│  ├───┼───┼─↓─┤                                                 │
│  │ 4 → 5 │ 6 │                                                 │
│  ├─↑─┼───┼─↓─┤                                                 │
│  │ 7 ← 8 ← 9 │                                                 │
│  └───┴───┴───┘                                                 │
│                                                                │
│  Output: [1,2,3,6,9,8,7,4,5]                                   │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public List<Integer> spiralOrder(int[][] matrix) {
    List<Integer> result = new ArrayList<>();
    if (matrix.length == 0) return result;

    int top = 0, bottom = matrix.length - 1;
    int left = 0, right = matrix[0].length - 1;

    while (top <= bottom && left <= right) {
        // Right
        for (int i = left; i <= right; i++) {
            result.add(matrix[top][i]);
        }
        top++;

        // Down
        for (int i = top; i <= bottom; i++) {
            result.add(matrix[i][right]);
        }
        right--;

        // Left
        if (top <= bottom) {
            for (int i = right; i >= left; i--) {
                result.add(matrix[bottom][i]);
            }
            bottom--;
        }

        // Up
        if (left <= right) {
            for (int i = bottom; i >= top; i--) {
                result.add(matrix[i][left]);
            }
            left++;
        }
    }

    return result;
}
```

---

### Problem 210: Rotate Array (HackerEarth)

```
┌────────────────────────────────────────────────────────────────┐
│  ROTATE ARRAY - Rotate by k positions                          │
├────────────────────────────────────────────────────────────────┤
│  nums = [1,2,3,4,5,6,7], k = 3                                 │
│                                                                │
│  Method: Reverse three times                                   │
│                                                                │
│  Original:      [1,2,3,4,5,6,7]                                │
│  Reverse all:   [7,6,5,4,3,2,1]                                │
│  Reverse 0..k-1:[5,6,7,4,3,2,1]                                │
│  Reverse k..n-1:[5,6,7,1,2,3,4]                                │
│                                                                │
│  Output: [5,6,7,1,2,3,4]                                       │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public void rotate(int[] nums, int k) {
    k = k % nums.length;  // Handle k > length

    reverse(nums, 0, nums.length - 1);
    reverse(nums, 0, k - 1);
    reverse(nums, k, nums.length - 1);
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
```

---

### Problem 211: Next Permutation (Codeforces)

```
┌────────────────────────────────────────────────────────────────┐
│  NEXT PERMUTATION - Next lexicographically greater             │
├────────────────────────────────────────────────────────────────┤
│  nums = [1,2,3] → [1,3,2]                                      │
│  nums = [3,2,1] → [1,2,3] (wrap around)                        │
│  nums = [1,1,5] → [1,5,1]                                      │
│                                                                │
│  Algorithm:                                                    │
│  1. Find largest i where nums[i] < nums[i+1]                   │
│  2. Find largest j where nums[j] > nums[i]                     │
│  3. Swap nums[i] and nums[j]                                   │
│  4. Reverse from i+1 to end                                    │
│                                                                │
│  Example: [1,3,5,4,2]                                          │
│  Step 1: i = 1 (3 < 5)                                         │
│  Step 2: j = 3 (4 > 3)                                         │
│  Step 3: [1,4,5,3,2]                                           │
│  Step 4: [1,4,2,3,5]                                           │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public void nextPermutation(int[] nums) {
    int n = nums.length;
    int i = n - 2;

    // Find first decreasing element from right
    while (i >= 0 && nums[i] >= nums[i + 1]) {
        i--;
    }

    if (i >= 0) {
        // Find element just larger than nums[i]
        int j = n - 1;
        while (nums[j] <= nums[i]) {
            j--;
        }
        swap(nums, i, j);
    }

    // Reverse from i+1 to end
    reverse(nums, i + 1, n - 1);
}

private void swap(int[] nums, int i, int j) {
    int temp = nums[i];
    nums[i] = nums[j];
    nums[j] = temp;
}

private void reverse(int[] nums, int start, int end) {
    while (start < end) {
        swap(nums, start++, end--);
    }
}
```

---

## 13.4 Sorting & Searching Variations

### Problem 212: Count Inversions (HackerEarth Classic)

```
┌────────────────────────────────────────────────────────────────┐
│  COUNT INVERSIONS - Pairs where i < j but arr[i] > arr[j]      │
├────────────────────────────────────────────────────────────────┤
│  arr = [2, 4, 1, 3, 5]                                         │
│                                                                │
│  Inversions:                                                   │
│  (2, 1): 2 > 1                                                 │
│  (4, 1): 4 > 1                                                 │
│  (4, 3): 4 > 3                                                 │
│                                                                │
│  Total: 3 inversions                                           │
│                                                                │
│  Approach: Modified Merge Sort                                 │
│  During merge, count inversions when right element chosen      │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
private int inversions = 0;

public int countInversions(int[] arr) {
    inversions = 0;
    mergeSort(arr, 0, arr.length - 1);
    return inversions;
}

private void mergeSort(int[] arr, int left, int right) {
    if (left < right) {
        int mid = left + (right - left) / 2;
        mergeSort(arr, left, mid);
        mergeSort(arr, mid + 1, right);
        merge(arr, left, mid, right);
    }
}

private void merge(int[] arr, int left, int mid, int right) {
    int[] temp = new int[right - left + 1];
    int i = left, j = mid + 1, k = 0;

    while (i <= mid && j <= right) {
        if (arr[i] <= arr[j]) {
            temp[k++] = arr[i++];
        } else {
            temp[k++] = arr[j++];
            inversions += (mid - i + 1);  // Count inversions
        }
    }

    while (i <= mid) temp[k++] = arr[i++];
    while (j <= right) temp[k++] = arr[j++];

    System.arraycopy(temp, 0, arr, left, temp.length);
}
```

---

### Problem 213: Aggressive Cows (Codeforces/SPOJ Classic)

```
┌────────────────────────────────────────────────────────────────┐
│  AGGRESSIVE COWS - Max minimum distance between cows           │
├────────────────────────────────────────────────────────────────┤
│  stalls = [1, 2, 4, 8, 9], cows = 3                            │
│                                                                │
│  Place 3 cows to maximize minimum distance                     │
│                                                                │
│  Try placing at 1, 4, 9: min distance = 3                      │
│  Try placing at 1, 4, 8: min distance = 3                      │
│  Try placing at 1, 8, 9: min distance = 1                      │
│                                                                │
│  Binary search on answer:                                      │
│  - Can we place cows with min distance = mid?                  │
│                                                                │
│  Output: 3                                                     │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int aggressiveCows(int[] stalls, int cows) {
    Arrays.sort(stalls);

    int left = 1;
    int right = stalls[stalls.length - 1] - stalls[0];
    int result = 0;

    while (left <= right) {
        int mid = left + (right - left) / 2;

        if (canPlace(stalls, cows, mid)) {
            result = mid;
            left = mid + 1;  // Try for larger distance
        } else {
            right = mid - 1;
        }
    }

    return result;
}

private boolean canPlace(int[] stalls, int cows, int minDist) {
    int count = 1;
    int lastPos = stalls[0];

    for (int i = 1; i < stalls.length; i++) {
        if (stalls[i] - lastPos >= minDist) {
            count++;
            lastPos = stalls[i];

            if (count == cows) return true;
        }
    }

    return false;
}
```

---

## 13.5 Ad-hoc & Pattern Recognition

### Problem 214: Longest Consecutive Sequence (HackerEarth)

```
┌────────────────────────────────────────────────────────────────┐
│  LONGEST CONSECUTIVE SEQUENCE                                  │
├────────────────────────────────────────────────────────────────┤
│  nums = [100, 4, 200, 1, 3, 2]                                 │
│                                                                │
│  Sequences: [1,2,3,4], [100], [200]                            │
│                                                                │
│  Longest: [1,2,3,4] → length 4                                 │
│                                                                │
│  Approach: Use HashSet                                         │
│  Only start counting from sequence beginning (n-1 not in set)  │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int longestConsecutive(int[] nums) {
    Set<Integer> set = new HashSet<>();
    for (int num : nums) set.add(num);

    int longest = 0;

    for (int num : set) {
        // Only start from beginning of sequence
        if (!set.contains(num - 1)) {
            int current = num;
            int length = 1;

            while (set.contains(current + 1)) {
                current++;
                length++;
            }

            longest = Math.max(longest, length);
        }
    }

    return longest;
}
```

---

### Problem 215: Subarray Sum Equals K (Codeforces Style)

```
┌────────────────────────────────────────────────────────────────┐
│  SUBARRAY SUM EQUALS K - Count subarrays with sum k            │
├────────────────────────────────────────────────────────────────┤
│  nums = [1, 1, 1], k = 2                                       │
│                                                                │
│  Subarrays with sum 2:                                         │
│  [1,1] at index 0-1                                            │
│  [1,1] at index 1-2                                            │
│                                                                │
│  Output: 2                                                     │
│                                                                │
│  Prefix sum trick:                                             │
│  If prefix[j] - prefix[i] = k, subarray [i+1, j] has sum k     │
│  Count prefix[j] - k occurrences using HashMap                 │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int subarraySum(int[] nums, int k) {
    Map<Integer, Integer> prefixCount = new HashMap<>();
    prefixCount.put(0, 1);  // Empty prefix

    int sum = 0;
    int count = 0;

    for (int num : nums) {
        sum += num;

        // If (sum - k) exists, we found subarrays
        count += prefixCount.getOrDefault(sum - k, 0);

        prefixCount.merge(sum, 1, Integer::sum);
    }

    return count;
}
```

---

# 🎉 CONGRATULATIONS! ALL SECTIONS COMPLETE!

```
┌─────────────────────────────────────────────────────────────────┐
│              📊 PRACTICE PROBLEMS SUMMARY                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  SECTION 1-3: Basic Math, Strings, Arrays     (~30 problems)    │
│  SECTION 4: Sliding Window Patterns           (12 problems)     │
│  SECTION 5: Two Pointers Advanced             (17 problems)     │
│  SECTION 6: Binary Search Patterns            (13 problems)     │
│  SECTION 7: Stack & Queue Problems            (26 problems)     │
│  SECTION 8: Tree Problems (BFS/DFS)           (32 problems)     │
│  SECTION 9: Graph Algorithms                  (23 problems)     │
│  SECTION 10: Dynamic Programming              (17 problems)     │
│  SECTION 11: Backtracking Problems            (13 problems)     │
│  SECTION 12: Greedy Algorithms                (13 problems)     │
│  SECTION 13: HackerEarth & Codeforces         (14 problems)     │
│                                                                 │
│  ═══════════════════════════════════════════════════════════   │
│  TOTAL: ~210+ PROBLEMS WITH SOLUTIONS & VISUALIZATIONS          │
│  ═══════════════════════════════════════════════════════════   │
│                                                                 │
│  🎯 All problems include:                                       │
│  • ASCII box visualizations                                     │
│  • Step-by-step explanations                                    │
│  • Optimized Java solutions                                     │
│  • Time/Space complexity                                        │
│  • LeetCode links (free) or full descriptions (premium)         │
│                                                                 │
│  💪 Keep practicing and good luck! 💪                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📋 PROBLEM TRACKING CHECKLIST

### Basic Math

- [ ] Check if Prime
- [ ] Count Primes (LeetCode 204)
- [ ] Nth Prime Number
- [ ] Previous/Next Prime
- [ ] Prime Factors
- [ ] 🔒 Closest Prime Numbers in Range

### Fibonacci

- [ ] Nth Fibonacci (LeetCode 509)
- [ ] Sum of First N Fibonacci
- [ ] Check if Fibonacci
- [ ] Tribonacci (LeetCode 1137)
- [ ] Climbing Stairs (LeetCode 70)

### Digit Manipulation

- [ ] Sum of Digits
- [ ] Add Digits (LeetCode 258)
- [ ] Reverse Integer (LeetCode 7)
- [ ] Palindrome Number (LeetCode 9)
- [ ] Happy Number (LeetCode 202)

### GCD/LCM

- [ ] GCD (Euclidean Algorithm)
- [ ] 🔒 GCD of Array (LeetCode 1979)

### Strings - Isomorphic/Pattern

- [ ] Isomorphic Strings (LeetCode 205)
- [ ] Word Pattern (LeetCode 290)
- [ ] 🔒 Word Pattern II (LeetCode 291)
- [ ] 🔒 Group Isomorphic Strings

### Strings - Anagram

- [ ] Valid Anagram (LeetCode 242)
- [ ] Find All Anagrams (LeetCode 438)
- [ ] 🔒 Strobogrammatic Number (LeetCode 246)
- [ ] 🔒 Strobogrammatic Number II (LeetCode 247)

### Strings - Palindrome

- [ ] Valid Palindrome II (LeetCode 680)
- [ ] 🔒 Palindrome Permutation (LeetCode 266)

### Arrays

- [ ] Two Sum (LeetCode 1)
- [ ] 🔒 Two Sum III (LeetCode 170)
- [ ] Contains Duplicate (LeetCode 217)
- [ ] 🔒 Contains Duplicate III (LeetCode 220)
- [ ] Move Zeroes (LeetCode 283)
- [ ] 🔒 Meeting Rooms (LeetCode 252)
- [ ] 🔒 Meeting Rooms II (LeetCode 253)
- [ ] 🔒 Missing Ranges (LeetCode 163)

### Sliding Window - Fixed Size

- [ ] Maximum Sum Subarray of Size K
- [ ] Maximum Average Subarray I (LeetCode 643)
- [ ] Subarrays with Avg >= Threshold (LeetCode 1343)
- [ ] 🔒 Max Sum Distinct Subarrays (LeetCode 2461)

### Sliding Window - Variable Size

- [ ] Minimum Size Subarray Sum (LeetCode 209)
- [ ] 🔒 Longest Substring K Distinct (LeetCode 340)
- [ ] Fruit Into Baskets (LeetCode 904)
- [ ] Longest Repeating Char Replacement (LeetCode 424)
- [ ] Max Consecutive Ones III (LeetCode 1004)

### Sliding Window - String Matching

- [ ] Permutation in String (LeetCode 567)
- [ ] Minimum Window Substring (LeetCode 76)
- [ ] 🔒 Longest Substring 2 Distinct (LeetCode 159)

### Two Pointers - Opposite Direction

- [ ] Two Sum II Sorted (LeetCode 167)
- [ ] 3Sum (LeetCode 15)
- [ ] 3Sum Closest (LeetCode 16)
- [ ] 4Sum (LeetCode 18)
- [ ] 🔒 3Sum Smaller (LeetCode 259)
- [ ] Valid Triangle Number (LeetCode 611)

### Two Pointers - Same Direction

- [ ] Remove Duplicates (LeetCode 26)
- [ ] Remove Duplicates II (LeetCode 80)
- [ ] Remove Element (LeetCode 27)
- [ ] Sort Colors (LeetCode 75)
- [ ] Partition Array (LeetCode 2161)

### Two Pointers - Linked List

- [ ] Linked List Cycle (LeetCode 141)
- [ ] Linked List Cycle II (LeetCode 142)
- [ ] Middle of Linked List (LeetCode 876)
- [ ] Remove Nth From End (LeetCode 19)
- [ ] 🔒 Plus One Linked List (LeetCode 369)

### Binary Search - Basic

- [ ] Binary Search (LeetCode 704)
- [ ] Search Insert Position (LeetCode 35)
- [ ] First Bad Version (LeetCode 278)

### Binary Search - Find Boundaries

- [ ] Find First and Last Position (LeetCode 34)
- [ ] Find Smallest Letter Greater (LeetCode 744)

### Binary Search - Rotated Array

- [ ] Search in Rotated Array (LeetCode 33)
- [ ] Search in Rotated II (LeetCode 81)
- [ ] Find Minimum in Rotated (LeetCode 153)

### Binary Search - On Answer

- [ ] Sqrt(x) (LeetCode 69)
- [ ] Koko Eating Bananas (LeetCode 875)
- [ ] Capacity To Ship (LeetCode 1011)
- [ ] Split Array Largest Sum (LeetCode 410)
- [ ] K-th Smallest Pair Distance (LeetCode 719)

### Stack - Basic

- [ ] Valid Parentheses (LeetCode 20)
- [ ] Min Stack (LeetCode 155)
- [ ] 🔒 Max Stack (LeetCode 716)
- [ ] Decode String (LeetCode 394)
- [ ] Evaluate Reverse Polish Notation (LeetCode 150)
- [ ] 🔒 Basic Calculator III (LeetCode 772)

### Stack - Monotonic Stack

- [ ] Daily Temperatures (LeetCode 739)
- [ ] Next Greater Element I (LeetCode 496)
- [ ] Next Greater Element II (LeetCode 503)
- [ ] Largest Rectangle in Histogram (LeetCode 84)
- [ ] Maximal Rectangle (LeetCode 85)
- [ ] Trapping Rain Water (LeetCode 42)

### Queue Problems

- [ ] Implement Queue using Stacks (LeetCode 232)
- [ ] Implement Stack using Queues (LeetCode 225)
- [ ] Sliding Window Maximum (LeetCode 239)
- [ ] 🔒 Shortest Subarray Sum >= K (LeetCode 862)
- [ ] 🔒 Design Circular Queue (LeetCode 622)
- [ ] 🔒 Design Circular Deque (LeetCode 641)

### Stack - Advanced

- [ ] Remove K Digits (LeetCode 402)
- [ ] Remove Duplicate Letters (LeetCode 316)
- [ ] 132 Pattern (LeetCode 456)
- [ ] Online Stock Span (LeetCode 901)

### Stack/Queue - HackerEarth & Codeforces

- [ ] Balanced Brackets (HackerEarth)
- [ ] Maximum Element (HackerEarth)
- [ ] Nearest Smaller Element (Codeforces)
- [ ] Prefix to Postfix Conversion (HackerEarth)

### Tree Traversal

- [ ] Binary Tree Inorder Traversal (LeetCode 94)
- [ ] Binary Tree Preorder Traversal (LeetCode 144)
- [ ] Binary Tree Postorder Traversal (LeetCode 145)
- [ ] Binary Tree Level Order Traversal (LeetCode 102)
- [ ] Binary Tree Zigzag Level Order (LeetCode 103)
- [ ] 🔒 Vertical Order Traversal (LeetCode 314)

### Tree Properties

- [ ] Maximum Depth of Binary Tree (LeetCode 104)
- [ ] Minimum Depth of Binary Tree (LeetCode 111)
- [ ] Balanced Binary Tree (LeetCode 110)
- [ ] Same Tree (LeetCode 100)
- [ ] Symmetric Tree (LeetCode 101)
- [ ] Invert Binary Tree (LeetCode 226)

### Tree Path & Sum

- [ ] Path Sum (LeetCode 112)
- [ ] Path Sum II (LeetCode 113)
- [ ] Path Sum III (LeetCode 437)
- [ ] Binary Tree Maximum Path Sum (LeetCode 124)
- [ ] Diameter of Binary Tree (LeetCode 543)

### Binary Search Tree

- [ ] Validate Binary Search Tree (LeetCode 98)
- [ ] Search in a BST (LeetCode 700)
- [ ] LCA of a BST (LeetCode 235)
- [ ] LCA of a Binary Tree (LeetCode 236)
- [ ] Kth Smallest Element in BST (LeetCode 230)
- [ ] 🔒 Inorder Successor in BST (LeetCode 285)

### Tree Construction

- [ ] Construct from Preorder & Inorder (LeetCode 105)
- [ ] Construct from Inorder & Postorder (LeetCode 106)
- [ ] Serialize and Deserialize (LeetCode 297)

### Tree - HackerEarth & Codeforces

- [ ] Count Leaf Nodes (HackerEarth)
- [ ] Sum of All Nodes (HackerEarth)
- [ ] Level with Maximum Sum (Codeforces)
- [ ] Nodes at K Distance (HackerEarth)
- [ ] Check if Complete Tree (Codeforces)
- [ ] Left View of Binary Tree (HackerEarth)

### Graph Traversal (BFS/DFS)

- [ ] Number of Islands (LeetCode 200)
- [ ] Max Area of Island (LeetCode 695)
- [ ] Clone Graph (LeetCode 133)
- [ ] Flood Fill (LeetCode 733)
- [ ] Rotting Oranges (LeetCode 994)
- [ ] 🔒 Walls and Gates (LeetCode 286)

### Graph Cycle Detection

- [ ] Course Schedule (LeetCode 207)
- [ ] Course Schedule II (LeetCode 210)
- [ ] 🔒 Graph Valid Tree (LeetCode 261)

### Graph Shortest Path

- [ ] 01 Matrix (LeetCode 542)
- [ ] Shortest Path in Binary Matrix (LeetCode 1091)
- [ ] Network Delay Time (LeetCode 743)
- [ ] 🔒 Cheapest Flights Within K Stops (LeetCode 787)

### Graph Union-Find

- [ ] 🔒 Number of Connected Components (LeetCode 323)
- [ ] Redundant Connection (LeetCode 684)
- [ ] Accounts Merge (LeetCode 721)

### Graph Advanced

- [ ] Word Ladder (LeetCode 127)
- [ ] 🔒 Alien Dictionary (LeetCode 269)
- [ ] Is Graph Bipartite? (LeetCode 785)

### Graph - HackerEarth & Codeforces

- [ ] Find the Town Judge (HackerEarth-style)
- [ ] Minimum Spanning Tree (Codeforces-style)
- [ ] Detect Cycle in Undirected Graph (HackerEarth)
- [ ] Strongly Connected Components (Codeforces)

### DP - 1D Problems

- [ ] Climbing Stairs (LeetCode 70)
- [ ] House Robber (LeetCode 198)
- [ ] House Robber II (LeetCode 213)
- [ ] Maximum Subarray - Kadane's (LeetCode 53)
- [ ] Coin Change (LeetCode 322)

### DP - 2D Problems

- [ ] Unique Paths (LeetCode 62)
- [ ] Unique Paths II (LeetCode 63)
- [ ] Minimum Path Sum (LeetCode 64)
- [ ] Longest Common Subsequence (LeetCode 1143)
- [ ] Edit Distance (LeetCode 72)

### DP - Knapsack

- [ ] 0/1 Knapsack (Classic)
- [ ] Partition Equal Subset Sum (LeetCode 416)
- [ ] Target Sum (LeetCode 494)

### DP - Subsequence

- [ ] Longest Increasing Subsequence (LeetCode 300)
- [ ] Word Break (LeetCode 139)
- [ ] Longest Palindromic Subsequence (LeetCode 516)

### DP - State Machine

- [ ] Best Time to Buy and Sell Stock with Cooldown (LeetCode 309)

### Backtracking - Subsets & Combinations

- [ ] Subsets (LeetCode 78)
- [ ] Subsets II (LeetCode 90)
- [ ] Combination Sum (LeetCode 39)
- [ ] Combination Sum II (LeetCode 40)
- [ ] Combinations (LeetCode 77)

### Backtracking - Permutations

- [ ] Permutations (LeetCode 46)
- [ ] Permutations II (LeetCode 47)

### Backtracking - Strings

- [ ] Palindrome Partitioning (LeetCode 131)
- [ ] Letter Combinations of Phone (LeetCode 17)
- [ ] Generate Parentheses (LeetCode 22)

### Backtracking - Grid

- [ ] Word Search (LeetCode 79)
- [ ] N-Queens (LeetCode 51)
- [ ] Sudoku Solver (LeetCode 37)

### Greedy - Intervals

- [ ] 🔒 Meeting Rooms (LeetCode 252)
- [ ] 🔒 Meeting Rooms II (LeetCode 253)
- [ ] Non-overlapping Intervals (LeetCode 435)
- [ ] Merge Intervals (LeetCode 56)
- [ ] Insert Interval (LeetCode 57)

### Greedy - Array

- [ ] Jump Game (LeetCode 55)
- [ ] Jump Game II (LeetCode 45)
- [ ] Gas Station (LeetCode 134)
- [ ] Candy (LeetCode 135)

### Greedy - Strings & Math

- [ ] Partition Labels (LeetCode 763)
- [ ] Task Scheduler (LeetCode 621)
- [ ] Maximum Subarray - Kadane's (LeetCode 53)
- [ ] Best Time to Buy and Sell Stock II (LeetCode 122)

### HackerEarth & Codeforces - Number Theory

- [ ] Sieve of Eratosthenes (HackerEarth)
- [ ] Prime Factorization (Codeforces)
- [ ] Modular Exponentiation (HackerEarth)
- [ ] GCD and LCM (Codeforces)

### HackerEarth & Codeforces - Bit Manipulation

- [ ] Count Set Bits (HackerEarth)
- [ ] Power of Two (Codeforces)
- [ ] XOR Queries (HackerEarth)

### HackerEarth & Codeforces - Implementation

- [ ] Spiral Matrix (Codeforces)
- [ ] Rotate Array (HackerEarth)
- [ ] Next Permutation (Codeforces)

### HackerEarth & Codeforces - Sorting/Searching

- [ ] Count Inversions (HackerEarth)
- [ ] Aggressive Cows (Codeforces/SPOJ)

### HackerEarth & Codeforces - Ad-hoc

- [ ] Longest Consecutive Sequence (HackerEarth)
- [ ] Subarray Sum Equals K (Codeforces)

---

**🔒 = Premium Problem (Full description provided above)**
**📎 = Has LeetCode Link**

**🎉 ALL 210+ PROBLEMS COMPLETE! Good luck with your practice! 💪**
