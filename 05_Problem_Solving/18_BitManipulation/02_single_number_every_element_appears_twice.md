# Single Number — Every Element Appears Twice Except One

> **Navigation**: [← WHY Bit Manipulation — MIT/KTH Style](01_why_bit_manipulation_mit_kth_style.md) | [Chapter overview](../18_BitManipulation.md) | [16.2 Power & Counting (Easy-Medium) →](03_power_counting_easy_medium.md)
> Page 2 of 5 in **SECTION 16: BIT MANIPULATION & MATH PROBLEMS**


Input: [4, 1, 2, 1, 2]
Output: 4

**Approach**: XOR all elements together.

**Why**: XOR properties guarantee:

- a ^ a = 0 (pairs cancel)
- a ^ 0 = a (identity)
- Commutative + associative → order doesn't matter

**Trace**:
4 ^ 1 ^ 2 ^ 1 ^ 2
= 4 ^ (1 ^ 1) ^ (2 ^ 2) ← rearrange (commutative)
= 4 ^ 0 ^ 0
= 4 ← answer!

**Proof Of Correctness**:
Let S = {a₁, a₁, a₂, a₂, ..., aₖ, aₖ, x} where x is unique
XOR(S) = a₁⊕a₁ ⊕ a₂⊕a₂ ⊕ ... ⊕ aₖ⊕aₖ ⊕ x
= 0 ⊕ 0 ⊕ ... ⊕ 0 ⊕ x = x ∎
Time: O(n) Space: O(1)

**Full Solution:**

```java
public int singleNumber(int[] nums) {
    int result = 0;
    for (int num : nums) {
        result ^= num;     // pairs cancel: a ^ a = 0
    }
    return result;         // only the unique element remains
}
```

---

## Problem #287: [Missing Number](https://leetcode.com/problems/missing-number/) (LC 268)

**MISSING NUMBER — Array of [0..n] with one number missing**

```text
Input:  [3, 0, 1]   (n = 3, range [0..3])
Output: 2

APPROACH: XOR all indices [0..n] with all values.
Paired index-value cancel, missing number remains.

TRACE:
  Index: 0  1  2  (plus n=3)
  Value: 3  0  1

  XOR of indices+n: 0 ^ 1 ^ 2 ^ 3
  XOR of values:    3 ^ 0 ^ 1
  Combined: 0^1^2^3 ^ 3^0^1
          = (0^0) ^ (1^1) ^ (3^3) ^ 2
          = 0 ^ 0 ^ 0 ^ 2 = 2  ✓

PROOF: Every number except the missing one appears as both
an index and a value → cancels. The missing one appears only
as an index → remains.  ∎

Time: O(n)   Space: O(1)
```

**Full Solution:**

```java
public int missingNumber(int[] nums) {
    int xor = nums.length;           // start with n (the extra index)
    for (int i = 0; i < nums.length; i++) {
        xor ^= i ^ nums[i];         // XOR index and value together
    }
    return xor;
}
```

---

## Problem #288: [Single Number II](https://leetcode.com/problems/single-number-ii/) (LC 137)

**SINGLE NUMBER II — Every element appears 3 times except one**

```text
Input:  [2, 2, 3, 2]
Output: 3

XOR won't work (a^a^a = a, not 0)!

APPROACH: Count bits mod 3
For each bit position (0 to 31):
  Count how many numbers have that bit set.
  If count % 3 ≠ 0, the unique number has that bit set.

TRACE (bit-by-bit):
  nums = [2(10), 2(10), 3(11), 2(10)]

  Bit 0: counts = 0+0+1+0 = 1.  1 % 3 = 1 → bit 0 is SET
  Bit 1: counts = 1+1+1+1 = 4.  4 % 3 = 1 → bit 1 is SET
  Result = 11₂ = 3  ✓

PROOF: If a number appears 3 times, its contribution to each
bit position is divisible by 3 → vanishes under mod 3.
The unique number's bits remain.  ∎

Time: O(32n) = O(n)   Space: O(1)
```

**Full Solution (Bit Counting):**

```java
public int singleNumber(int[] nums) {
    int result = 0;
    for (int i = 0; i < 32; i++) {
        int bitSum = 0;
        for (int num : nums) {
            bitSum += (num >> i) & 1;    // count 1s at position i
        }
        if (bitSum % 3 != 0) {
            result |= (1 << i);          // set bit i in result
        }
    }
    return result;
}
```

**Advanced Solution (State Machine — ones/twos):**

```java
// State machine: tracks bit counts mod 3 using two variables
// ones: bits that have appeared 1 mod 3 times
// twos: bits that have appeared 2 mod 3 times
// When count reaches 3, both reset to 0
public int singleNumberStateMachine(int[] nums) {
    int ones = 0, twos = 0;
    for (int num : nums) {
        // ones = bits seen 1 time (not yet seen 2 times)
        ones = (ones ^ num) & ~twos;
        // twos = bits seen 2 times (not yet seen 3 times)
        twos = (twos ^ num) & ~ones;
    }
    return ones;  // bits that appeared exactly once
}
// Transitions:  (ones, twos)
//   Seen 0 times → (0,0)
//   Seen 1 time  → (1,0)  ← ones captures it
//   Seen 2 times → (0,1)  ← twos captures it
//   Seen 3 times → (0,0)  ← reset! Both clear
```

---

## Problem #289: [Single Number III](https://leetcode.com/problems/single-number-iii/) (LC 260)

**SINGLE NUMBER III — TWO elements appear once, rest twice**

```text
Input:  [1, 2, 1, 3, 2, 5]
Output: [3, 5]

STEP 1: XOR all → get xorAll = 3 ^ 5 = 6 (110)
        This is XOR of the two unique numbers.

STEP 2: Find rightmost set bit of xorAll.
        6 = 110 → rightmost set bit = 010 (bit 1)
        diff = xorAll & (-xorAll) = 6 & (-6) = 2
        This bit DIFFERS between the two unique numbers.

STEP 3: Partition array into two groups based on that bit:
        Group A (bit 1 = 0): [1, 1, 3]  → XOR = 3
        Group B (bit 1 = 1): [2, 2, 5]  → XOR = 5

PROOF: The two unique numbers differ in at least one bit.
Using that bit to partition ensures they land in DIFFERENT
groups. All duplicate pairs land in the SAME group (same
bits). Each group reduces to the standard Single Number.  ∎

Time: O(n)   Space: O(1)
```

**Full Solution:**

```java
public int[] singleNumber(int[] nums) {
    // Step 1: XOR all → xor of the two unique numbers
    int xorAll = 0;
    for (int num : nums) xorAll ^= num;

    // Step 2: Find rightmost set bit (differs between the two)
    int diff = xorAll & (-xorAll);

    // Step 3: Partition into two groups and XOR each
    int[] result = new int[2];
    for (int num : nums) {
        if ((num & diff) == 0) {
            result[0] ^= num;   // group where that bit is 0
        } else {
            result[1] ^= num;   // group where that bit is 1
        }
    }
    return result;
}
```

---

> 🔬 **Section Challenge — Single Number — Every Element Appears Twice Except One**

**Challenge 1 (Trace — XOR semantics):** Given `nums=[7, 3, 5, 3, 7]`, manually trace the XOR accumulation step by step. What is the binary representation after each XOR, and what is the final answer?

<details><summary>Answer</summary>

**Who executes?** One loop, one XOR per element. **When?** Each `result ^= num` executes in order. **What already exists?** `result=0` (identity) at start.

Step 1: `0 ^ 7 = 7` (0000...0111). Step 2: `7 ^ 3 = 4` (0111 ^ 0011 = 0100). Step 3: `4 ^ 5 = 1` (0100 ^ 0101 = 0001). Step 4: `1 ^ 3 = 2` (0001 ^ 0011 = 0010). Step 5: `2 ^ 7 = 5` (0010 ^ 0111 = 0101).

**Final answer = 5.** The XOR doesn't "wait" for pairs to be adjacent — the commutative and associative properties ensure that regardless of order, `7^7=0` and `3^3=0`, leaving only `5`.

</details>

**Challenge 2 (Debug):** A developer applies the XOR-all trick to `nums=[2, 2, 2, 3]`, expecting to find the unique element. What answer do they get and why is the XOR trick fundamentally broken for this input?

<details><summary>Answer</summary>

`2^2^2^3 = 0^2^3 = 2^3 = 1`. They get `1`, which is wrong. **Why?** The XOR trick relies on `a^a=0` — it cancels elements appearing **exactly twice**. `2` appears **three times** (odd count), so `2^2^2 = 2` (not 0). The unique element here is `3`, not `1`. For elements appearing 3 times, use **bit-counting mod 3** (Single Number II pattern): count set bits at each position, apply `% 3`, reconstruct the unique number. Always verify the precondition: the XOR trick only works when every non-unique element appears an **even** number of times.

</details>

---

[← WHY Bit Manipulation — MIT/KTH Style](01_why_bit_manipulation_mit_kth_style.md) | [Chapter overview](../18_BitManipulation.md) | [16.2 Power & Counting (Easy-Medium) →](03_power_counting_easy_medium.md)
