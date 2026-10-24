# Common Patterns & Templates <a name="patterns-templates"></a>

> **Navigation**: [← Bit Masking Techniques](04_bit_masking_techniques.md) | [Chapter overview](../10_Bit_Manipulation_Complete.md) | [Interview Problems with Solutions →](06_interview_problems_with_solutions.md)
> Page 5 of 6 in **Bit Manipulation Complete Guide**


## Pattern 1: Count Set Bits

```java
// ═══════════════════════════════════════════════════════════════
// COUNT SET BITS - Multiple Methods
// ═══════════════════════════════════════════════════════════════

// Method 1: Brian Kernighan's Algorithm - O(set bits)
public int countSetBits(int n) {
    int count = 0;
    while (n != 0) {
        n = n & (n - 1);  // Clear rightmost set bit
        count++;
    }
    return count;
}

// Method 2: Java built-in - O(1)
int count = Integer.bitCount(n);

// Method 3: Lookup table for large datasets
// Precompute for all bytes (0-255)
int[] bitCount = new int[256];
for (int i = 0; i < 256; i++) {
    bitCount[i] = bitCount[i >> 1] + (i & 1);
}
// Use: sum of bitCount for each byte
```

## Pattern 2: Reverse Bits

```java
// ═══════════════════════════════════════════════════════════════
// REVERSE BITS of a 32-bit integer
// ═══════════════════════════════════════════════════════════════

public int reverseBits(int n) {
    int result = 0;
    for (int i = 0; i < 32; i++) {
        // Get rightmost bit of n
        int bit = n & 1;
        // Add to result at correct position
        result = (result << 1) | bit;
        // Remove rightmost bit from n
        n >>= 1;
    }
    return result;
}

// Using Java built-in
int reversed = Integer.reverse(n);
```

## Pattern 3: Generate All Subsets (Power Set)

```java
// ═══════════════════════════════════════════════════════════════
// GENERATE ALL SUBSETS using bits
// ═══════════════════════════════════════════════════════════════

public List<List<Integer>> subsets(int[] nums) {
    List<List<Integer>> result = new ArrayList<>();
    int n = nums.length;

    // 2^n subsets (0 to 2^n - 1)
    for (int mask = 0; mask < (1 << n); mask++) {
        List<Integer> subset = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            // If bit i is set, include nums[i]
            if ((mask & (1 << i)) != 0) {
                subset.add(nums[i]);
            }
        }
        result.add(subset);
    }
    return result;
}

/*
For nums = [1, 2, 3]:
mask = 000 → []
mask = 001 → [1]
mask = 010 → [2]
mask = 011 → [1,2]
mask = 100 → [3]
mask = 101 → [1,3]
mask = 110 → [2,3]
mask = 111 → [1,2,3]
*/
```

## Pattern 4: Find Different Bits

```java
// ═══════════════════════════════════════════════════════════════
// HAMMING DISTANCE - Count differing bits between two numbers
// ═══════════════════════════════════════════════════════════════

public int hammingDistance(int x, int y) {
    return Integer.bitCount(x ^ y);
}

// XOR gives 1 where bits differ
// Count those 1s = Hamming distance
```

## Pattern 5: Check All Set Bits in Range

```java
// ═══════════════════════════════════════════════════════════════
// Check if all bits are set between two positions
// ═══════════════════════════════════════════════════════════════

// Are all bits set from position i to j?
public boolean allBitsSet(int n, int i, int j) {
    // Create mask with 1s from i to j
    int mask = ((1 << (j - i + 1)) - 1) << i;
    // Check if n has all those bits
    return (n & mask) == mask;
}
```

---

[← Bit Masking Techniques](04_bit_masking_techniques.md) | [Chapter overview](../10_Bit_Manipulation_Complete.md) | [Interview Problems with Solutions →](06_interview_problems_with_solutions.md)
