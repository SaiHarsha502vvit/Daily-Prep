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
│ 1 │ 1 │   0                               │
└───┴───┴───────────────────────────────────┘
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
│  Before: 0 0 0 0 0 1 0 1  (5)           │
│                    ↓ ↓ ↓                │
│  After:  0 0 0 0 1 0 1 0  (10)          │
│                                         │
│  Bits shift LEFT, 0s fill from right    │
└─────────────────────────────────────────┘

RIGHT SHIFT (>>) - Divide by 2^n
┌─────────────────────────────────────────┐
│  20 >> 2  =  5                          │
│                                         │
│  Before: 0 0 0 1 0 1 0 0  (20)          │
│            ↓ ↓ ↓ ↓                      │
│  After:  0 0 0 0 0 1 0 1  (5)           │
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
│  1. a ^ 0 = a       (XOR with 0 gives same number)              │
│  2. a ^ a = 0       (XOR with itself gives 0)                   │
│  3. a ^ b = b ^ a   (Commutative - order doesn't matter)        │
│  4. (a^b)^c = a^(b^c) (Associative - grouping doesn't matter)   │
│  5. a ^ b ^ a = b   (Self-inverse - cancels out)                │
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

### The One Mental Model That Makes Every XOR Trick Obvious

Memorizing five XOR properties is the slow path. There's a single picture that makes all of them — and every XOR interview trick — feel inevitable:

> **XOR is "addition where you forget to carry." Equivalently, each bit position independently tracks _parity_: is the count of 1s here even or odd?**

That's it. `a ^ b` at each bit asks "did an *odd* number of these inputs have a 1 here?" Run a whole array through XOR and bit `k` of the result answers: *"did an odd number of array elements have bit k set?"* Every property falls out of this one idea:

- `a ^ a = 0` — two copies means every bit appears an **even** number of times → parity 0 everywhere. (This is *why* duplicates cancel — they make counts even.)
- `a ^ 0 = a` — adding zero changes no count's parity.
- commutative & associative — parity doesn't care about *order* or *grouping*, only the *total count* of 1s per column. (That's the deep reason you can XOR an array in any order and reorder the terms freely in proofs.)

So "find the single number among pairs" isn't a trick — it's forced: every paired number contributes an even count to each bit (parity 0), the lone number is the only thing left making any bit's parity odd. The survivor *is* the unpaired element. You didn't need to memorize it; parity made it the only possible answer.

### Cracking the genuinely hard one: two unique numbers (why the partition works)

Problem 2 above is where understanding usually collapses. XOR-ing everything gives `a ^ b` (all the paired numbers cancelled), but that's `a` and `b` *fused together* — how do you pull them apart? The code does `rightmostBit = xorAll & (-xorAll)` then splits the array by that bit. Here's *why* that's guaranteed to work, not just that it does:

1. **`a ^ b` has a 1 in some bit position** — because `a ≠ b`, they must differ in at least one bit, and a differing bit XORs to 1. Pick any such bit (the rightmost set bit, via the `x & (-x)` low-bit isolation you saw earlier). Call it bit `k`.

2. **Bit `k` is the magic separator: `a` and `b` are on _opposite sides_ of it.** By construction, bit `k` is 1 in `a ^ b`, which means `a` and `b` *disagree* at bit `k` — one has it set, the other doesn't. So partitioning the array into "bit `k` set" vs "bit `k` clear" puts `a` in one group and `b` in the **other**. They're guaranteed separated.

3. **Every duplicate pair stays _together_ in whichever group it lands.** A number and its twin are *identical*, so they have the same bit `k` → they fall in the *same* group. So each group contains: exactly one of {a, b}, plus a bunch of complete pairs.

4. **Now each group is just Problem 1 again.** XOR each group independently: the complete pairs cancel (even parity), leaving the lone unique number. One group yields `a`, the other yields `b`. Done.

The whole trick is: *find a bit where the two answers must differ, and use it to sort them into separate buckets where each becomes a solved single-number problem.* That "find a distinguishing bit to split a hard problem into two easy ones" move shows up again in radix sort and trie-based maximum-XOR — same idea, different costume.

> **Why this matters beyond the puzzle:** the parity mental model is why XOR is used for checksums (detect an odd number of flipped bits), RAID parity disks (reconstruct one lost drive: `lost = XOR of all surviving drives`, the exact same "find the missing one" math), and cheap in-place swaps. When you see XOR in production, it's almost always "track parity / recover the one missing thing without storing everything."

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

| #   | Problem                              | Key Concept     |
| --- | ------------------------------------ | --------------- |
| 1   | Single Number                        | XOR property    |
| 2   | Number of 1 Bits                     | Brian Kernighan |
| 3   | Counting Bits                        | DP with bits    |
| 4   | Reverse Bits                         | Bit-by-bit      |
| 5   | Power of Two                         | n & (n-1)       |
| 6   | Missing Number                       | XOR all         |
| 7   | Binary Number with Alternating Bits  | Check pattern   |
| 8   | Hamming Distance                     | XOR + count     |
| 9   | Complement of Base 10 Integer        | Flip bits       |
| 10  | Convert Binary Number in Linked List | Bit building    |

### Medium Level 🟡

| #   | Problem                    | Key Concept             |
| --- | -------------------------- | ----------------------- |
| 1   | Single Number II           | Bit counting mod k      |
| 2   | Single Number III          | XOR + split             |
| 3   | Sum of Two Integers        | Carry simulation        |
| 4   | Bitwise AND of Range       | Common prefix           |
| 5   | Maximum XOR of Two Numbers | Greedy/Trie             |
| 6   | Total Hamming Distance     | Count bits per position |
| 7   | Subsets                    | Bitmask iteration       |
| 8   | Gray Code                  | Pattern generation      |
| 9   | Divide Two Integers        | Bit shifting            |
| 10  | UTF-8 Validation           | Bit masking             |

### Hard Level 🔴

| #   | Problem                               | Key Concept     |
| --- | ------------------------------------- | --------------- |
| 1   | Maximum AND Sum of Array              | Bitmask DP      |
| 2   | Find XOR Sum of All Pairs Bitwise AND | Math + bits     |
| 3   | Count Pairs With XOR in a Range       | Trie + counting |
| 4   | Maximize Score After N Operations     | Bitmask DP      |
| 5   | Smallest Sufficient Team              | Bitmask DP      |

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
│  • Empty array (XOR of nothing = 0)                             │
│  • n = 0 (special case for many operations)                     │
│  • n = Integer.MIN_VALUE (-2^31, cannot negate)                 │
│  • Shift by 32 or more (undefined behavior)                     │
│  • Java >> vs >>> (signed vs unsigned shift)                    │
└─────────────────────────────────────────────────────────────────┘
```

### Interview Tips

```
┌─────────────────────────────────────────────────────────────────┐
│                    INTERVIEW STRATEGIES                         │
├─────────────────────────────────────────────────────────────────┤
│  1. When you see "O(1) space" - think bits                      │
│  2. When elements appear k times - think XOR or bit counting    │
│  3. When dealing with subsets - think bitmask                   │
│  4. When finding unique/missing - think XOR                     │
│  5. When asked "power of 2" - think n & (n-1)                   │
│  6. When optimizing arithmetic - think shifts                   │
│  7. Always mention time/space complexity                        │
│  8. Test with examples: 0, 1, negative, MAX_VALUE               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Summary: The 3 Most Important Things

```
╔═══════════════════════════════════════════════════════════════╗
║     MASTER THESE 3 AND YOU'LL SOLVE 80% OF BIT PROBLEMS       ║
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

### Topical Breadth — Bit Operation Selection Trade-offs

Bit manipulation techniques form a trade-off spectrum between explicit bit-level control and standard arithmetic. **Bitwise AND/OR/XOR** versus **arithmetic operations**: bit ops are O(1) hardware-level instructions (execute in 1 CPU cycle) and are the preferred choice for flag operations, bitmask extraction, and setting individual bits — the trade-off is that they are NOT faster than arithmetic for actual mathematical computation (e.g., `n << 1` vs `n * 2` compile to identical machine code on most modern compilers; the perceived speed of bit shifts is a micro-optimization from the 1970s that compilers now eliminate). Use bit ops for flag/enum masking, set-bit tests, and bit-level algorithmic tricks (XOR swap, bitwise trie). Use arithmetic for actual multiplication/division. **Signed right shift (`>>`)** versus **unsigned right shift (`>>>`)**: in Java, `>>` is an arithmetic shift that replicates the sign bit (preserving sign), while `>>>` is a logical shift that always fills with zeros. This is the critical two's complement vs sign-magnitude trade-off: two's complement allows a single representation for 0 and uniform shift behavior, while sign-magnitude would require separate handling for negative numbers. The practical rule: use `>>>` for any operation that treats the number as an unsigned bit pattern (hash codes, color values, network addresses); use `>>` for signed arithmetic division by powers of 2. **Two's complement** versus **sign-magnitude**: two's complement won because it has a single zero representation (all bits 0), the range is asymmetric (e.g., -128 to +127 for 8-bit), and the same addition circuit handles both positive and negative numbers without special case logic — the trade-off is that the most negative number has no positive counterpart (e.g., `Integer.MIN_VALUE = -2147483648` cannot be negated without overflow). Use two's complement arithmetic everywhere in Java; always use `>>>` when you need the raw bit pattern of a negative number.

| Trade-off                          | Approach A        | Approach B              | Winner                     | Reason                                     |
| ---------------------------------- | ----------------- | ----------------------- | -------------------------- | ------------------------------------------ |
| Flag ops vs arithmetic             | Bitwise &, \|, ^  | Arithmetic with % and / | Bitwise                    | Direct bit access; arithmetic hides intent |
| Arithmetic vs shifts               | `n * 2`           | `n << 1`                | Equal (compiler optimizes) | Modern JIT eliminates the difference       |
| Signed vs unsigned shift           | `>>` (arithmetic) | `>>>` (logical)         | Context-dependent          | Use `>>>` for raw bit patterns             |
| Two's complement vs sign-magnitude | Two's complement  | Sign-magnitude          | Two's complement           | Single zero, uniform add circuit           |

Select **bit ops** for flag manipulation, set checking, and XOR-pattern problems. Select **arithmetic** for mathematical computation (clarity wins). Use **`>>>`** whenever treating a signed integer as an unsigned bit vector (e.g., reading the sign bit as a magnitude bit).

**Next Steps:**

1. Solve all Easy problems first (build confidence)
2. Master the XOR patterns (most interview questions)
3. Practice bitmask DP (for harder interviews)
4. Time yourself - most bit problems should take < 15 min

**Pro Tip:** When stuck on a bit problem, write out the binary representation and trace through manually. Visual understanding beats memorization!

---

## 📝 Exam-Style Problems (MIT 6.006 / KTH DD1352 style)

---

**Problem 1 (Correctness — 8 min)**: Prove that `x ^ x = 0` for any 32-bit integer x. Use this to prove the "missing number" algorithm: given an array containing every integer from 0 to n except one, XOR all indices with all values to find the missing number.

<details><summary>Model Answer</summary>

**`x ^ x = 0`**: XOR is bitwise. For any bit position i: `bit_i(x) XOR bit_i(x) = 0` (same values cancel). Applying across all 32 bits: every bit of `x ^ x` is 0. ✓

**Missing number algorithm**: Let `result = 0`. For i from 0 to n: `result ^= i`. For each value v in the array: `result ^= v`. Every integer from 0 to n that IS present is XORed twice (once as index, once as value) → cancels to 0. The missing integer appears only once (as an index) → remains in `result`. ✓

```java
int findMissing(int[] nums, int n) {
    int result = 0;
    for (int i = 0; i <= n; i++) result ^= i;
    for (int v : nums) result ^= v;
    return result;
}
```
**Time**: O(n). **Space**: O(1). No sorting, no hash set.

</details>

---

**Problem 2 (Analysis — 6 min)**: Brian Kernighan's bit-count: `int count = 0; while (n != 0) { n &= (n-1); count++; }`. Prove this runs in O(k) where k is the number of set bits, not O(32).

<details><summary>Model Answer</summary>

**Key observation**: `n & (n-1)` clears the lowest set bit of n.

**Why**: If the lowest set bit is at position p:
- n binary: `...1 0...0` (bit p=1, bits 0..p-1=0)
- (n-1) binary: `...0 1...1` (bit p=0, bits 0..p-1=1)
- `n & (n-1)`: bit p = `1 & 0` = 0; bits 0..p-1 = `0 & 1` = 0; higher bits unchanged.

Each iteration removes exactly one set bit → loop runs exactly k times → **O(k)**. For sparse integers (few set bits), vastly faster than the naïve 32-iteration approach.

</details>

---

**Problem 3 (Design — 8 min)**: An array has n elements where every element appears exactly three times, except one which appears once. Find it in O(n) time, O(1) space. State and prove the invariant.

<details><summary>Model Answer</summary>

**Invariant**: For each bit position, count how many elements have that bit set mod 3. If count ≡ 0 (mod 3) → unique element has 0 in that position. If count ≡ 1 (mod 3) → unique element has 1 in that position. This holds because every "triple" element contributes 3 ≡ 0 (mod 3), while the unique element contributes exactly 1.

```java
int singleNumber(int[] nums) {
    int ones = 0, twos = 0;
    for (int n : nums) {
        ones = (ones ^ n) & ~twos;  // bits seen 1 (mod 3) times
        twos = (twos ^ n) & ~ones;  // bits seen 2 (mod 3) times
    }
    return ones;  // bits seen exactly once after full pass
}
```

**Proof**: After processing a "triple" element, `ones` and `twos` both return to their pre-element state (bits go through 0→1→2→0). After processing the unique element once, its bits move into `ones` and stay there. ✓

</details>

---

## 📎 Reference Anchor

**OpenJDK `Integer` and `Long` bit operations (JVM intrinsics)**
- `Integer.bitCount(n)`: [Integer.java](https://github.com/openjdk/jdk/blob/master/src/java.base/share/classes/java/lang/Integer.java) — parallel popcount SWAR technique; JIT converts to a single `POPCNT` CPU instruction on x86. O(1) hardware time.
- `Integer.numberOfTrailingZeros(n)` / `Integer.highestOneBit(n)`: JVM intrinsics mapping to `BSF`/`BSR` x86 instructions.
- **Local rewrite rule**: `n & (n-1)` (Brian Kernighan) clears the lowest set bit. Use it to count set bits in O(k) where k = popcount — faster than iterating all 32 positions for sparse bit sets.
- **Constraint warning**: Java `>>` is arithmetic (sign-extends). Java `>>>` is logical (zero-fills). For unsigned bit math, always use `>>>`. Using `>> 1` on a negative number in a `while (n != 0)` loop causes an infinite loop.

---

## When Bit Manipulation Breaks

### 1. Operator Precedence — Bitwise vs Comparison
**What breaks**: `if (n & 1 == 0)` evaluates as `if (n & (1 == 0))` = `if (n & 0)` = always false. Comparison operators have HIGHER precedence than bitwise `&`, `|`, `^` in Java.
**Fix**: Always parenthesize: `if ((n & 1) == 0)`. This is the #1 silent bug in bit manipulation.

### 2. Signed Right Shift on Negative Numbers
**What breaks**: `n >>= 1` on negative n fills with 1 (arithmetic shift). `while (n != 0) { n >>= 1; }` is an infinite loop for any negative n.
**Fix**: Use `n >>>= 1` (unsigned shift) for bit-counting loops.

### 3. Integer Overflow in Left Shift
**What breaks**: `1 << 31` = `Integer.MIN_VALUE` in Java (−2147483648), not 2³¹ = 2147483648. `1 << 32` = 1 (shift amount is mod 32). Both are silent — no exception.
**Fix**: Use `1L << n` when you need bit positions beyond 30.

### 4. XOR Swap Aliasing
**What breaks**: `a ^= b; b ^= a; a ^= b;` when a and b are the SAME variable. `a ^= a` sets it to 0; all three operations produce 0.
**Fix**: Guard with `if (a != b)` or use a temp variable.

---

## Brute Force → Optimal: Count Set Bits in Range

**Brute Force — O(n log n):**
```java
int count = 0;
for (int i = 1; i <= n; i++) count += Integer.bitCount(i);  // too slow for n=10^9
```

**Optimal — O(log n) digit DP per bit position:**
```java
int total = 0;
for (int k = 0; k < 30; k++) {
    int cycle = 1 << (k+1), half = cycle >> 1;
    total += (n / cycle) * half + Math.max(0, (n % cycle) - half + 1);
}
```
**Why**: Bit k has period `2^(k+1)` and is set for exactly `2^k` consecutive numbers per period. Count full periods + remainder.

---

## Proof Corner: XOR Identities

1. **Self-cancellation**: `a ^ a = 0`. Each bit: `0 XOR 0 = 0`, `1 XOR 1 = 0`. □
2. **Self-inverse**: `a ^ b ^ b = a ^ 0 = a` (by associativity + self-cancellation). □
3. **Find unique**: XOR of array where every element appears twice except one = the unique element. *Proof*: XOR is commutative and associative; pairs cancel by (1); unique element XORs with 0 = itself. □

**Consequence**: Every XOR trick (missing number, single-non-repeating, single-in-triples) is an application of identity (3) under appropriate grouping.

> **Navigation**: [< Previous](09_Pattern_Programs_Complete.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](11_Backtracking_Complete.md)


---

## Reality Check

**"Bit manipulation is low-level optimization only"** → Bit manipulation is essential for: permission systems (Unix rwx = 3 bits per user/group/other), feature flags (each bit represents a feature toggle), network subnet masks (IP & mask extracts network address), and set operations (union = OR, intersection = AND, difference = AND NOT). These are design patterns, not optimizations.

**"Signed and unsigned integers behave the same with bit operations"** → Java has only signed integers. The >> operator performs arithmetic right shift (preserves sign bit), while >>> performs logical right shift (fills with zeros). -1 in binary is all 1s (twos complement). -1 >> 1 equals -1 (sign bit preserved), but -1 >>> 1 equals Integer.MAX_VALUE (zero-filled). Using the wrong shift on negative numbers produces completely wrong results.

**"Two's complement is an implementation detail"** → Two complement representation means: Integer.MIN_VALUE has no positive counterpart (Math.abs(Integer.MIN_VALUE) returns Integer.MIN_VALUE due to overflow), negation is bitwise complement plus one (~x + 1 == -x), and the most negative number's absolute value overflows. These properties affect: safe absolute value computation, integer division edge cases, and hash function behavior.

**"Counting bits is trivial"** → Integer.bitCount uses a parallel bit-counting algorithm (Hamming weight) that runs in O(1) with a fixed number of operations, not a loop over 32 bits. Understanding this technique (divide-and-conquer on bit groups) extends to: popcount-based distance metrics (Hamming distance = bitCount(a XOR b)), cardinality estimation in Bloom filters, and SIMD population count instructions in performance-critical code.

**"Bitmask subsets iterate 0 to 2^n-1"** → Iterating ALL subsets of a set of size n visits 2^n states. But iterating all subsets OF A SPECIFIC MASK m (submask enumeration) uses the pattern: for s = m; s > 0; s = (s-1) & m — this visits only the subsets of m, not all 2^n possibilities. This technique is critical for bitmask DP problems where you need to enumerate subsets of a partial state efficiently.
