> **Navigation**: [< Previous](09_Pattern_Programs_Complete.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](11_Backtracking_Complete.md)
> 🧠 **Mental Model**: See [Space-Time Tradeoffs](../14_Mental_Models/12_Space_Time_Tradeoffs.md) — bit tricks as O(1) space optimizations

# 🔢 Bit Manipulation Complete Guide
> Master the Art of Binary Operations for Coding Interviews

## Table of Contents
1. [Why Bit Manipulation?](#why-bit-manipulation)
2. [Binary Number System Fundamentals](#binary-fundamentals)
3. [Bitwise Operators Deep Dive](#bitwise-operators)
4. [Essential Bit Tricks & Formulas](#essential-tricks)
5. [XOR Magic Properties](#xor-magic)
6. [Bit Masking Techniques](#bit-masking)
7. [Common Patterns & Templates](#patterns-templates)
8. [Interview Problems with Solutions](#interview-problems)
9. [Practice Problems List](#practice-problems)
10. [Quick Reference Cheat Sheet](#cheat-sheet)

---

## Why Bit Manipulation? <a name="why-bit-manipulation"></a>

### Interview Reality
```
┌─────────────────────────────────────────────────────────────┐
│  WHY COMPANIES ASK BIT MANIPULATION                         │
├─────────────────────────────────────────────────────────────┤
│  1. Tests low-level understanding                           │
│  2. O(1) space solutions where others use O(n)              │
│  3. Faster than arithmetic operations                       │
│  4. Essential for systems programming                       │
│  5. Shows mathematical thinking                             │
└─────────────────────────────────────────────────────────────┘
```

### Where It's Used in Real World
- **Cryptography** - XOR operations for encryption
- **Graphics** - Color manipulation, image processing
- **Networking** - IP address, subnet masks
- **Embedded Systems** - Register manipulation
- **Game Dev** - State flags, permissions
- **Database** - Bloom filters, bitmap indexes

---

## Binary Number System Fundamentals <a name="binary-fundamentals"></a>

### How Computers Store Numbers

```
Decimal 13 in Binary:
┌────┬────┬────┬────┬────┬────┬────┬────┐
│ 128│ 64 │ 32 │ 16 │  8 │  4 │  2 │  1 │  ← Powers of 2
├────┼────┼────┼────┼────┼────┼────┼────┤
│  0 │  0 │  0 │  0 │  1 │  1 │  0 │  1 │  ← Binary: 00001101
└────┴────┴────┴────┴────┴────┴────┴────┘
                        8 + 4     + 1 = 13

Position:  7    6    5    4    3    2    1    0  (right to left, 0-indexed)
```

### Java Integer Representation (32-bit)

```
┌─────────────────────────────────────────────────────────────────┐
│ Sign │                    31 Value Bits                         │
│  Bit │                                                          │
├──────┼──────────────────────────────────────────────────────────┤
│   0  │ 0000000 00000000 00000000 00001101                       │  = +13
│   1  │ 1111111 11111111 11111111 11110011                       │  = -13
└──────┴──────────────────────────────────────────────────────────┘
         ↑
    MSB (Most Significant Bit)
    0 = positive, 1 = negative
```

### Two's Complement (How Negative Numbers Work)

```java
// To get -13 from +13:
// Step 1: Flip all bits (One's complement)
+13 = 00000000 00000000 00000000 00001101
~13 = 11111111 11111111 11111111 11110010  // Flipped

// Step 2: Add 1
-13 = 11111111 11111111 11111111 11110011  // Two's complement

// Quick formula: -n = ~n + 1
// Or: -n = ~(n - 1)
```

### Important Ranges to Remember

```
┌─────────────┬─────────────────────────────────────┐
│   Type      │           Range                     │
├─────────────┼─────────────────────────────────────┤
│   byte      │  -128 to 127                        │
│   short     │  -32,768 to 32,767                  │
│   int       │  -2^31 to 2^31 - 1                  │
│             │  ≈ -2.1 billion to 2.1 billion      │
│   long      │  -2^63 to 2^63 - 1                  │
└─────────────┴─────────────────────────────────────┘

Key Values:
Integer.MAX_VALUE = 2147483647  (0x7FFFFFFF)
Integer.MIN_VALUE = -2147483648 (0x80000000)
```

---

## Bitwise Operators Deep Dive <a name="bitwise-operators"></a>

### The 6 Bitwise Operators

```
┌──────────┬────────┬─────────────────────────────────────────┐
│ Operator │ Symbol │              Description                │
├──────────┼────────┼─────────────────────────────────────────┤
│   AND    │   &    │ Both bits must be 1                     │
│   OR     │   |    │ At least one bit must be 1              │
│   XOR    │   ^    │ Exactly one bit must be 1               │
│   NOT    │   ~    │ Flip all bits                           │
│  L-Shift │  <<    │ Shift bits left (multiply by 2)         │
│  R-Shift │  >>    │ Shift bits right (divide by 2)          │
│  UR-Shift│  >>>   │ Unsigned right shift (fill with 0s)     │
└──────────┴────────┴─────────────────────────────────────────┘
```

### Visual Truth Tables

```
AND (&) - Both must be 1        OR (|) - At least one is 1
┌───┬───┬───────┐               ┌───┬───┬───────┐
│ A │ B │ A & B │               │ A │ B │ A | B │
├───┼───┼───────┤               ├───┼───┼───────┤
│ 0 │ 0 │   0   │               │ 0 │ 0 │   0   │
│ 0 │ 1 │   0   │               │ 0 │ 1 │   1   │
│ 1 │ 0 │   0   │               │ 1 │ 0 │   1   │
│ 1 │ 1 │   1   │               │ 1 │ 1 │   1   │
└───┴───┴───────┘               └───┴───┴───────┘

XOR (^) - Exactly one is 1      NOT (~) - Flip the bit
┌───┬───┬───────┐               ┌───┬───────┐
│ A │ B │ A ^ B │               │ A │  ~A   │
├───┼───┼───────┤               ├───┼───────┤
│ 0 │ 0 │   0   │               │ 0 │   1   │
│ 0 │ 1 │   1   │               │ 1 │   0   │
│ 1 │ 0 │   1   │               └───┴───────┘
│ 1 │ 1 │   0   │
└───┴───┴───────┘
```

### Practical Examples

```java
public class BitwiseDemo {
    public static void main(String[] args) {
        int a = 12;  // Binary: 1100
        int b = 10;  // Binary: 1010
        
        // AND - Keep only common 1s
        System.out.println(a & b);  // 8 (1000)
        //   1100
        // & 1010
        // ------
        //   1000 = 8
        
        // OR - Combine all 1s
        System.out.println(a | b);  // 14 (1110)
        //   1100
        // | 1010
        // ------
        //   1110 = 14
        
        // XOR - Different bits become 1
        System.out.println(a ^ b);  // 6 (0110)
        //   1100
        // ^ 1010
        // ------
        //   0110 = 6
        
        // NOT - Flip all bits
        System.out.println(~a);     // -13
        // ~00000000...00001100 = 11111111...11110011 = -13
        
        // Left Shift - Multiply by 2^n
        System.out.println(a << 2); // 48 (1100 → 110000)
        // 12 * 2^2 = 12 * 4 = 48
        
        // Right Shift - Divide by 2^n
        System.out.println(a >> 2); // 3 (1100 → 0011)
        // 12 / 2^2 = 12 / 4 = 3
    }
}
```

### Left Shift vs Right Shift Visualization

```
LEFT SHIFT (<<) - Multiply by 2^n
┌─────────────────────────────────────────┐
│  5 << 1  =  10                          │
│                                         │
│  Before: 0 0 0 0 0 1 0 1  (5)          │
│                    ↓ ↓ ↓                │
│  After:  0 0 0 0 1 0 1 0  (10)         │
│                                         │
│  Bits shift LEFT, 0s fill from right    │
└─────────────────────────────────────────┘

RIGHT SHIFT (>>) - Divide by 2^n
┌─────────────────────────────────────────┐
│  20 >> 2  =  5                          │
│                                         │
│  Before: 0 0 0 1 0 1 0 0  (20)         │
│            ↓ ↓ ↓ ↓                      │
│  After:  0 0 0 0 0 1 0 1  (5)          │
│                                         │
│  Bits shift RIGHT, sign bit fills left  │
└─────────────────────────────────────────┘

UNSIGNED RIGHT SHIFT (>>>) - Always fills with 0s
┌─────────────────────────────────────────┐
│  Used for negative numbers              │
│  -8 >>> 2 = 1073741822                  │
│  (Treats as unsigned, fills 0s)         │
└─────────────────────────────────────────┘
```

---

## Essential Bit Tricks & Formulas <a name="essential-tricks"></a>

### 🎯 MUST MEMORIZE - Interview Gold

```java
// ═══════════════════════════════════════════════════════════════
// ║           THE 10 ESSENTIAL BIT TRICKS                       ║
// ═══════════════════════════════════════════════════════════════

// 1. Check if number is even or odd
boolean isEven = (n & 1) == 0;
boolean isOdd = (n & 1) == 1;

// 2. Check if ith bit is set (0-indexed from right)
boolean isSet = (n & (1 << i)) != 0;

// 3. Set the ith bit (turn ON)
n = n | (1 << i);

// 4. Clear the ith bit (turn OFF)
n = n & ~(1 << i);

// 5. Toggle the ith bit (flip)
n = n ^ (1 << i);

// 6. Clear rightmost set bit
n = n & (n - 1);

// 7. Get rightmost set bit (isolate)
int rightmostBit = n & (-n);

// 8. Check if power of 2
boolean isPowerOf2 = n > 0 && (n & (n - 1)) == 0;

// 9. Count set bits (Brian Kernighan)
int count = 0;
while (n != 0) {
    n = n & (n - 1);
    count++;
}

// 10. Swap two numbers without temp
a = a ^ b;
b = a ^ b;  // b = (a^b)^b = a
a = a ^ b;  // a = (a^b)^a = b
```

### Visual Explanation of Key Tricks

#### Trick: `n & (n-1)` - Clear Rightmost Set Bit

```
Why does n & (n-1) clear rightmost set bit?

n     = 12 = 1100
n-1   = 11 = 1011  (borrowing flips rightmost 1 and all 0s after it)
─────────────────
n&(n-1)    = 1000 = 8

Another example:
n     = 40 = 101000
n-1   = 39 = 100111
─────────────────
n&(n-1)    = 100000 = 32

Pattern: Subtracting 1 flips bits from rightmost 1 to end
         AND then clears that entire section
```

#### Trick: `n & (-n)` - Isolate Rightmost Set Bit

```
Why does n & (-n) isolate rightmost set bit?

Remember: -n = ~n + 1 (Two's complement)

n     = 12 = 00001100
-n    =     = 11110100  (flip + add 1)
─────────────────────
n&(-n)     = 00000100 = 4

The rightmost 1 is at position 2 (value = 4)
```

#### Trick: Power of 2 Check

```
Powers of 2 have exactly ONE bit set:
1  = 0001
2  = 0010
4  = 0100
8  = 1000
16 = 10000

For power of 2:  n & (n-1) = 0
8     = 1000
7     = 0111
8 & 7 = 0000 ✓

For non-power:   n & (n-1) ≠ 0
6     = 110
5     = 101
6 & 5 = 100 ≠ 0 ✗
```

### Multiply and Divide by Powers of 2

```java
// These are MUCH faster than *, /

// Multiply by 2^k
n << k    // n * 2^k

// Examples:
5 << 1    // 5 * 2 = 10
5 << 2    // 5 * 4 = 20
5 << 3    // 5 * 8 = 40

// Divide by 2^k
n >> k    // n / 2^k

// Examples:
20 >> 1   // 20 / 2 = 10
20 >> 2   // 20 / 4 = 5
```

---

## XOR Magic Properties <a name="xor-magic"></a>

### The 5 XOR Properties (MEMORIZE!)

```
┌─────────────────────────────────────────────────────────────────┐
│                     XOR PROPERTIES                              │
├─────────────────────────────────────────────────────────────────┤
│  1. a ^ 0 = a       (XOR with 0 gives same number)             │
│  2. a ^ a = 0       (XOR with itself gives 0)                  │
│  3. a ^ b = b ^ a   (Commutative - order doesn't matter)       │
│  4. (a^b)^c = a^(b^c) (Associative - grouping doesn't matter)  │
│  5. a ^ b ^ a = b   (Self-inverse - cancels out)               │
└─────────────────────────────────────────────────────────────────┘
```

### Why XOR is Magic for "Find Missing/Duplicate"

```
Problem: Array has n-1 numbers from 1 to n. Find missing.
Array: [1, 2, 4, 5]  Missing: 3

XOR all array elements: 1 ^ 2 ^ 4 ^ 5
XOR all 1 to n:         1 ^ 2 ^ 3 ^ 4 ^ 5

XOR both results:
(1^2^4^5) ^ (1^2^3^4^5)
= 1^1 ^ 2^2 ^ 4^4 ^ 5^5 ^ 3  (rearrange - associative)
= 0 ^ 0 ^ 0 ^ 0 ^ 3           (a^a = 0)
= 3                            (0^a = a)

All pairs cancel, only 3 remains!
```

### Classic XOR Problems

```java
// ═══════════════════════════════════════════════════════════════
// PROBLEM 1: Find the single number (all others appear twice)
// ═══════════════════════════════════════════════════════════════
public int singleNumber(int[] nums) {
    int result = 0;
    for (int num : nums) {
        result ^= num;
    }
    return result;
}
// Why it works: pairs cancel (a^a=0), single remains

// ═══════════════════════════════════════════════════════════════
// PROBLEM 2: Find two non-repeating numbers
// ═══════════════════════════════════════════════════════════════
public int[] twoNonRepeating(int[] nums) {
    // Step 1: XOR all - get a^b (the two unique numbers XORed)
    int xorAll = 0;
    for (int num : nums) xorAll ^= num;
    
    // Step 2: Find rightmost set bit (a and b differ here)
    int rightmostBit = xorAll & (-xorAll);
    
    // Step 3: Divide into two groups based on that bit
    int a = 0, b = 0;
    for (int num : nums) {
        if ((num & rightmostBit) != 0) {
            a ^= num;
        } else {
            b ^= num;
        }
    }
    return new int[]{a, b};
}

// ═══════════════════════════════════════════════════════════════
// PROBLEM 3: Find missing number (0 to n, one missing)
// ═══════════════════════════════════════════════════════════════
public int missingNumber(int[] nums) {
    int n = nums.length;
    int xor = 0;
    
    // XOR all indices and values
    for (int i = 0; i < n; i++) {
        xor ^= i ^ nums[i];
    }
    // XOR with n (since array is 0 to n)
    return xor ^ n;
}
```

---

## Bit Masking Techniques <a name="bit-masking"></a>

### What is a Bit Mask?

```
A bit mask is a number used to SELECT or MODIFY specific bits.

Example: To work with only bits 2, 3, 4
Mask = 00011100 = 28

Use cases:
- Extract specific bits
- Set multiple bits at once
- Check if certain bits match a pattern
```

### Creating Masks

```java
// ═══════════════════════════════════════════════════════════════
// MASK CREATION FORMULAS
// ═══════════════════════════════════════════════════════════════

// Mask with single bit at position i
int mask = 1 << i;
// i=3: 00001000

// Mask with k consecutive 1s from right
int mask = (1 << k) - 1;
// k=4: 00001111

// Mask with 1s from position i to j
int mask = ((1 << (j - i + 1)) - 1) << i;
// i=2, j=5: 00111100

// Mask with all 1s except position i
int mask = ~(1 << i);
// i=3: 11110111
```

### Bit Masking in DP (Subset Problems)

```java
// ═══════════════════════════════════════════════════════════════
// BITMASK DP - Represent subsets as integers
// ═══════════════════════════════════════════════════════════════

// For n elements, subset represented by n-bit number
// Set = {A, B, C, D}
// Mask 1011 = subset {A, C, D} (bits 0, 1, 3 are set)

// Iterate all subsets of n elements
int n = 4;
for (int mask = 0; mask < (1 << n); mask++) {
    // mask represents a subset
    // 0000 = empty, 0001 = {A}, 0010 = {B}, ...
}

// Check if element i is in subset
boolean contains = (mask & (1 << i)) != 0;

// Add element i to subset
int newMask = mask | (1 << i);

// Remove element i from subset
int newMask = mask & ~(1 << i);

// Count elements in subset
int count = Integer.bitCount(mask);

// Iterate all subsets of a given mask
for (int sub = mask; sub > 0; sub = (sub - 1) & mask) {
    // sub is a subset of mask
}
```

### Example: Traveling Salesman with Bitmask DP

```java
// TSP: Visit all cities exactly once, minimize distance
// mask = which cities visited, i = current city
// dp[mask][i] = min distance to reach city i having visited cities in mask

public int tsp(int[][] dist) {
    int n = dist.length;
    int[][] dp = new int[1 << n][n];
    
    // Initialize with infinity
    for (int[] row : dp) Arrays.fill(row, Integer.MAX_VALUE);
    dp[1][0] = 0;  // Start at city 0
    
    // For each subset mask
    for (int mask = 1; mask < (1 << n); mask++) {
        for (int last = 0; last < n; last++) {
            if (dp[mask][last] == Integer.MAX_VALUE) continue;
            if ((mask & (1 << last)) == 0) continue;
            
            // Try adding each unvisited city
            for (int next = 0; next < n; next++) {
                if ((mask & (1 << next)) != 0) continue;
                
                int newMask = mask | (1 << next);
                dp[newMask][next] = Math.min(
                    dp[newMask][next],
                    dp[mask][last] + dist[last][next]
                );
            }
        }
    }
    
    // Find min to return to start
    int fullMask = (1 << n) - 1;
    int ans = Integer.MAX_VALUE;
    for (int i = 0; i < n; i++) {
        if (dp[fullMask][i] != Integer.MAX_VALUE) {
            ans = Math.min(ans, dp[fullMask][i] + dist[i][0]);
        }
    }
    return ans;
}
```

---

## Common Patterns & Templates <a name="patterns-templates"></a>

### Pattern 1: Count Set Bits

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

### Pattern 2: Reverse Bits

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

### Pattern 3: Generate All Subsets (Power Set)

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

### Pattern 4: Find Different Bits

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

### Pattern 5: Check All Set Bits in Range

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

## Interview Problems with Solutions <a name="interview-problems"></a>

### Problem 1: Single Number (LeetCode 136) ⭐

```java
/*
Every element appears twice except one. Find the single one.
Time: O(n), Space: O(1)
*/
public int singleNumber(int[] nums) {
    int result = 0;
    for (int num : nums) {
        result ^= num;
    }
    return result;
}
// XOR: pairs cancel (a^a=0), single remains
```

### Problem 2: Single Number II (LeetCode 137) ⭐⭐

```java
/*
Every element appears THREE times except one. Find it.
Idea: Count bits at each position, mod 3 gives the single number's bits
*/
public int singleNumber(int[] nums) {
    int result = 0;
    
    for (int i = 0; i < 32; i++) {
        int sum = 0;
        for (int num : nums) {
            // Count bit at position i
            sum += (num >> i) & 1;
        }
        // If sum % 3 != 0, single number has bit at position i
        if (sum % 3 != 0) {
            result |= (1 << i);
        }
    }
    return result;
}

// Alternative: Using state machine (ones, twos)
public int singleNumberOptimal(int[] nums) {
    int ones = 0, twos = 0;
    for (int num : nums) {
        ones = (ones ^ num) & ~twos;
        twos = (twos ^ num) & ~ones;
    }
    return ones;
}
```

### Problem 3: Single Number III (LeetCode 260) ⭐⭐

```java
/*
Two elements appear once, rest appear twice. Find both.
*/
public int[] singleNumber(int[] nums) {
    // Step 1: XOR all to get a^b
    int xorAll = 0;
    for (int num : nums) xorAll ^= num;
    
    // Step 2: Find any bit where a and b differ
    int diffBit = xorAll & (-xorAll);  // Rightmost set bit
    
    // Step 3: Split into two groups
    int a = 0, b = 0;
    for (int num : nums) {
        if ((num & diffBit) != 0) {
            a ^= num;
        } else {
            b ^= num;
        }
    }
    return new int[]{a, b};
}
```

### Problem 4: Counting Bits (LeetCode 338) ⭐

```java
/*
Count set bits for all numbers from 0 to n
dp[i] = dp[i >> 1] + (i & 1)
*/
public int[] countBits(int n) {
    int[] dp = new int[n + 1];
    for (int i = 1; i <= n; i++) {
        dp[i] = dp[i >> 1] + (i & 1);
    }
    return dp;
}
// i >> 1: remove last bit, already computed
// i & 1: add 1 if last bit is set
```

### Problem 5: Reverse Bits (LeetCode 190) ⭐

```java
public int reverseBits(int n) {
    int result = 0;
    for (int i = 0; i < 32; i++) {
        result <<= 1;           // Make room
        result |= (n & 1);      // Add last bit of n
        n >>= 1;                // Move to next bit
    }
    return result;
}
```

### Problem 6: Number of 1 Bits (LeetCode 191) ⭐

```java
public int hammingWeight(int n) {
    int count = 0;
    while (n != 0) {
        n = n & (n - 1);  // Remove rightmost 1
        count++;
    }
    return count;
}
```

### Problem 7: Power of Two (LeetCode 231) ⭐

```java
public boolean isPowerOfTwo(int n) {
    return n > 0 && (n & (n - 1)) == 0;
}
// Power of 2 has exactly one 1 bit
// n & (n-1) clears that bit → result is 0
```

### Problem 8: Missing Number (LeetCode 268) ⭐

```java
public int missingNumber(int[] nums) {
    int xor = nums.length;  // XOR with n
    for (int i = 0; i < nums.length; i++) {
        xor ^= i ^ nums[i];
    }
    return xor;
}
```

### Problem 9: Sum of Two Integers Without + - (LeetCode 371) ⭐⭐

```java
/*
Add without arithmetic operators
XOR gives sum without carry
AND gives carry positions
Carry needs to be shifted left
*/
public int getSum(int a, int b) {
    while (b != 0) {
        int carry = (a & b) << 1;  // Carry shifted
        a = a ^ b;                  // Sum without carry
        b = carry;                  // Add carry next iteration
    }
    return a;
}
```

### Problem 10: Maximum XOR of Two Numbers (LeetCode 421) ⭐⭐⭐

```java
/*
Find maximum XOR of any two numbers in array
Use Trie (bit-level) or greedy bit-by-bit
*/
public int findMaximumXOR(int[] nums) {
    int maxResult = 0;
    int mask = 0;
    
    // Check each bit from highest to lowest
    for (int i = 31; i >= 0; i--) {
        mask |= (1 << i);
        
        Set<Integer> prefixes = new HashSet<>();
        for (int num : nums) {
            prefixes.add(num & mask);  // Keep only high bits
        }
        
        // Greedily try to set this bit
        int candidate = maxResult | (1 << i);
        for (int prefix : prefixes) {
            // If prefix ^ candidate exists, we can achieve it
            if (prefixes.contains(prefix ^ candidate)) {
                maxResult = candidate;
                break;
            }
        }
    }
    return maxResult;
}
```

### Problem 11: Bitwise AND of Numbers Range (LeetCode 201) ⭐⭐

```java
/*
AND of all numbers from left to right
Key insight: Find common prefix
*/
public int rangeBitwiseAnd(int left, int right) {
    int shift = 0;
    // Find common prefix
    while (left < right) {
        left >>= 1;
        right >>= 1;
        shift++;
    }
    return left << shift;
}
// All bits after common prefix will have both 0 and 1 somewhere in range
// AND of 0 and 1 is 0
```

### Problem 12: Decode XORed Array (LeetCode 1720) ⭐

```java
/*
encoded[i] = arr[i] XOR arr[i+1]
Given encoded and first element, find original array
*/
public int[] decode(int[] encoded, int first) {
    int[] arr = new int[encoded.length + 1];
    arr[0] = first;
    
    for (int i = 0; i < encoded.length; i++) {
        // arr[i] XOR arr[i+1] = encoded[i]
        // arr[i+1] = arr[i] XOR encoded[i]
        arr[i + 1] = arr[i] ^ encoded[i];
    }
    return arr;
}
```

---

## Practice Problems List <a name="practice-problems"></a>

### Easy Level 🟢

| # | Problem | Key Concept |
|---|---------|-------------|
| 1 | Single Number | XOR property |
| 2 | Number of 1 Bits | Brian Kernighan |
| 3 | Counting Bits | DP with bits |
| 4 | Reverse Bits | Bit-by-bit |
| 5 | Power of Two | n & (n-1) |
| 6 | Missing Number | XOR all |
| 7 | Binary Number with Alternating Bits | Check pattern |
| 8 | Hamming Distance | XOR + count |
| 9 | Complement of Base 10 Integer | Flip bits |
| 10 | Convert Binary Number in Linked List | Bit building |

### Medium Level 🟡

| # | Problem | Key Concept |
|---|---------|-------------|
| 1 | Single Number II | Bit counting mod k |
| 2 | Single Number III | XOR + split |
| 3 | Sum of Two Integers | Carry simulation |
| 4 | Bitwise AND of Range | Common prefix |
| 5 | Maximum XOR of Two Numbers | Greedy/Trie |
| 6 | Total Hamming Distance | Count bits per position |
| 7 | Subsets | Bitmask iteration |
| 8 | Gray Code | Pattern generation |
| 9 | Divide Two Integers | Bit shifting |
| 10 | UTF-8 Validation | Bit masking |

### Hard Level 🔴

| # | Problem | Key Concept |
|---|---------|-------------|
| 1 | Maximum AND Sum of Array | Bitmask DP |
| 2 | Find XOR Sum of All Pairs Bitwise AND | Math + bits |
| 3 | Count Pairs With XOR in a Range | Trie + counting |
| 4 | Maximize Score After N Operations | Bitmask DP |
| 5 | Smallest Sufficient Team | Bitmask DP |

---

## Quick Reference Cheat Sheet <a name="cheat-sheet"></a>

### 🎯 Operations Cheat Sheet

```java
// ═══════════════════════════════════════════════════════════════
//                    BIT MANIPULATION CHEAT SHEET
// ═══════════════════════════════════════════════════════════════

// ─────────────── BASIC OPERATIONS ───────────────
n & 1           // Check if odd (1) or even (0)
n & (1 << i)    // Check if bit i is set
n | (1 << i)    // Set bit i
n & ~(1 << i)   // Clear bit i
n ^ (1 << i)    // Toggle bit i

// ─────────────── POWER OF 2 ───────────────
n & (n-1) == 0  // Is power of 2? (n > 0)
n & (-n)        // Lowest set bit value
1 << k          // 2^k

// ─────────────── CLEAR BITS ───────────────
n & (n-1)       // Clear lowest set bit
n & ~((1 << i) - 1)  // Clear bits 0 to i-1 (rightmost i bits)
n & ((1 << i) - 1)   // Clear bits from i to MSB (keep rightmost i bits)

// ─────────────── MATH WITH BITS ───────────────
n << k          // n * 2^k
n >> k          // n / 2^k (signed)
n >>> k         // n / 2^k (unsigned)
(n + (1 << k) - 1) >> k  // Ceiling of n / 2^k

// ─────────────── XOR MAGIC ───────────────
a ^ 0 = a       // Identity
a ^ a = 0       // Self-inverse
a ^ b ^ a = b   // Cancellation
// Swap: a ^= b; b ^= a; a ^= b;

// ─────────────── MASKS ───────────────
(1 << n) - 1           // n ones: 0...0111...1
~((1 << n) - 1)        // n zeros at end: 1...1000...0
((1 << k) - 1) << i    // k ones starting at position i

// ─────────────── COUNTING ───────────────
Integer.bitCount(n)    // Count set bits
Integer.numberOfLeadingZeros(n)  // Leading zeros
Integer.numberOfTrailingZeros(n) // Trailing zeros
Integer.highestOneBit(n)  // Highest set bit value
Integer.lowestOneBit(n)   // Lowest set bit value

// ─────────────── COMMON PATTERNS ───────────────
// Count bits manually (Brian Kernighan)
while (n != 0) { n &= (n-1); count++; }

// Iterate all subsets of n elements
for (int mask = 0; mask < (1 << n); mask++)

// Iterate all subsets of a mask
for (int sub = mask; sub > 0; sub = (sub-1) & mask)

// Get/Set bit at position
getBit:  (n >> i) & 1
setBit:  n | (1 << i)
clearBit: n & ~(1 << i)
```

### Common Edge Cases

```
┌─────────────────────────────────────────────────────────────────┐
│                    EDGE CASES TO WATCH                          │
├─────────────────────────────────────────────────────────────────┤
│  • Negative numbers (sign bit handling)                         │
│  • Integer overflow (when shifting)                             │
│  • Empty array (XOR of nothing = 0)                            │
│  • n = 0 (special case for many operations)                    │
│  • n = Integer.MIN_VALUE (-2^31, cannot negate)                │
│  • Shift by 32 or more (undefined behavior)                    │
│  • Java >> vs >>> (signed vs unsigned shift)                   │
└─────────────────────────────────────────────────────────────────┘
```

### Interview Tips

```
┌─────────────────────────────────────────────────────────────────┐
│                    INTERVIEW STRATEGIES                         │
├─────────────────────────────────────────────────────────────────┤
│  1. When you see "O(1) space" - think bits                     │
│  2. When elements appear k times - think XOR or bit counting   │
│  3. When dealing with subsets - think bitmask                  │
│  4. When finding unique/missing - think XOR                    │
│  5. When asked "power of 2" - think n & (n-1)                  │
│  6. When optimizing arithmetic - think shifts                  │
│  7. Always mention time/space complexity                       │
│  8. Test with examples: 0, 1, negative, MAX_VALUE              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Summary: The 3 Most Important Things

```
╔═══════════════════════════════════════════════════════════════╗
║     MASTER THESE 3 AND YOU'LL SOLVE 80% OF BIT PROBLEMS      ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  1. XOR PROPERTIES                                            ║
║     a ^ a = 0, a ^ 0 = a                                      ║
║     → Find single/missing numbers                             ║
║                                                               ║
║  2. n & (n-1) TRICK                                           ║
║     Clears rightmost set bit                                  ║
║     → Count bits, check power of 2                            ║
║                                                               ║
║  3. BITMASK FOR SUBSETS                                       ║
║     n-bit number represents subset of n elements              ║
║     → Subset DP, permutations, combinations                   ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
```

---

**Next Steps:**
1. Solve all Easy problems first (build confidence)
2. Master the XOR patterns (most interview questions)
3. Practice bitmask DP (for harder interviews)
4. Time yourself - most bit problems should take < 15 min

**Pro Tip:** When stuck on a bit problem, write out the binary representation and trace through manually. Visual understanding beats memorization!
