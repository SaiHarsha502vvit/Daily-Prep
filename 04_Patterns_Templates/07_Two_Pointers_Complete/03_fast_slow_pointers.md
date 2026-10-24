# Fast & Slow Pointers <a name="fast-slow"></a>

> **Navigation**: [← Same Direction Pointers](02_same_direction_pointers.md) | [Chapter overview](../07_Two_Pointers_Complete.md) | [Advanced Patterns →](04_advanced_patterns.md)
> Page 3 of 5 in **Two Pointers — Pattern Guide**


## Floyd's Cycle Detection (Linked List Cycle)

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

## Visual: Floyd's Algorithm

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

## Find Cycle Start (LeetCode 142)

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

## Middle of Linked List (LeetCode 876)

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

## Happy Number (LeetCode 202)

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

## Find Duplicate Number (LeetCode 287)

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

[← Same Direction Pointers](02_same_direction_pointers.md) | [Chapter overview](../07_Two_Pointers_Complete.md) | [Advanced Patterns →](04_advanced_patterns.md)
