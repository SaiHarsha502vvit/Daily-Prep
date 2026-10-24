# Same Direction Pointers <a name="same-direction"></a>

> **Navigation**: [← Two Pointers Pattern Complete Guide](01_two_pointers_pattern_complete_guide.md) | [Chapter overview](../07_Two_Pointers_Complete.md) | [Fast & Slow Pointers →](03_fast_slow_pointers.md)
> Page 2 of 5 in **Two Pointers — Pattern Guide**


## Remove Duplicates from Sorted Array (LeetCode 26)

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

## Visual: Reader-Writer Pattern

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

## Remove Element (LeetCode 27)

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

## Move Zeroes (LeetCode 283)

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

## Remove Duplicates II - Allow 2 (LeetCode 80)

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

[← Two Pointers Pattern Complete Guide](01_two_pointers_pattern_complete_guide.md) | [Chapter overview](../07_Two_Pointers_Complete.md) | [Fast & Slow Pointers →](03_fast_slow_pointers.md)
