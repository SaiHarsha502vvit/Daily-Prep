# Advanced Patterns <a name="advanced"></a>

> **Navigation**: [← Fast & Slow Pointers](03_fast_slow_pointers.md) | [Chapter overview](../07_Two_Pointers_Complete.md) | [Interview Problems →](05_interview_problems.md)
> Page 4 of 5 in **Two Pointers — Pattern Guide**


## Trapping Rain Water (LeetCode 42)

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

## Visual: Trapping Rain Water

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

## 3Sum Closest (LeetCode 16)

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

## Partition Labels (LeetCode 763)

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

## Boats to Save People (LeetCode 881)

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

[← Fast & Slow Pointers](03_fast_slow_pointers.md) | [Chapter overview](../07_Two_Pointers_Complete.md) | [Interview Problems →](05_interview_problems.md)
