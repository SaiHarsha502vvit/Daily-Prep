> **Problems 04/14** | [Prev](03_Problems_Strings.md) | [Index](../00_MASTER_INDEX.md) | [Next](05_Problems_Sliding_Window.md)

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

