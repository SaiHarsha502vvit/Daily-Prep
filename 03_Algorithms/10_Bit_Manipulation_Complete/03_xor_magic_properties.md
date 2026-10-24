# XOR Magic Properties <a name="xor-magic"></a>

> **Navigation**: [← Essential Bit Tricks & Formulas](02_essential_bit_tricks_formulas.md) | [Chapter overview](../10_Bit_Manipulation_Complete.md) | [Bit Masking Techniques →](04_bit_masking_techniques.md)
> Page 3 of 6 in **Bit Manipulation Complete Guide**


## The 5 XOR Properties (MEMORIZE!)

**XOR PROPERTIES**

```text
1. a ^ 0 = a       (XOR with 0 gives same number)
2. a ^ a = 0       (XOR with itself gives 0)
3. a ^ b = b ^ a   (Commutative - order doesn't matter)
4. (a^b)^c = a^(b^c) (Associative - grouping doesn't matter)
5. a ^ b ^ a = b   (Self-inverse - cancels out)
```

## Why XOR is Magic for "Find Missing/Duplicate"

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

## Classic XOR Problems

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

## The One Mental Model That Makes Every XOR Trick Obvious

Memorizing five XOR properties is the slow path. There's a single picture that makes all of them — and every XOR interview trick — feel inevitable:

> **XOR is "addition where you forget to carry." Equivalently, each bit position independently tracks _parity_: is the count of 1s here even or odd?**

That's it. `a ^ b` at each bit asks "did an *odd* number of these inputs have a 1 here?" Run a whole array through XOR and bit `k` of the result answers: *"did an odd number of array elements have bit k set?"* Every property falls out of this one idea:

- `a ^ a = 0` — two copies means every bit appears an **even** number of times → parity 0 everywhere. (This is *why* duplicates cancel — they make counts even.)
- `a ^ 0 = a` — adding zero changes no count's parity.
- commutative & associative — parity doesn't care about *order* or *grouping*, only the *total count* of 1s per column. (That's the deep reason you can XOR an array in any order and reorder the terms freely in proofs.)

So "find the single number among pairs" isn't a trick — it's forced: every paired number contributes an even count to each bit (parity 0), the lone number is the only thing left making any bit's parity odd. The survivor *is* the unpaired element. You didn't need to memorize it; parity made it the only possible answer.

## Cracking the genuinely hard one: two unique numbers (why the partition works)

Problem 2 above is where understanding usually collapses. XOR-ing everything gives `a ^ b` (all the paired numbers cancelled), but that's `a` and `b` *fused together* — how do you pull them apart? The code does `rightmostBit = xorAll & (-xorAll)` then splits the array by that bit. Here's *why* that's guaranteed to work, not just that it does:

1. **`a ^ b` has a 1 in some bit position** — because `a ≠ b`, they must differ in at least one bit, and a differing bit XORs to 1. Pick any such bit (the rightmost set bit, via the `x & (-x)` low-bit isolation you saw earlier). Call it bit `k`.

2. **Bit `k` is the magic separator: `a` and `b` are on _opposite sides_ of it.** By construction, bit `k` is 1 in `a ^ b`, which means `a` and `b` *disagree* at bit `k` — one has it set, the other doesn't. So partitioning the array into "bit `k` set" vs "bit `k` clear" puts `a` in one group and `b` in the **other**. They're guaranteed separated.

3. **Every duplicate pair stays _together_ in whichever group it lands.** A number and its twin are *identical*, so they have the same bit `k` → they fall in the *same* group. So each group contains: exactly one of {a, b}, plus a bunch of complete pairs.

4. **Now each group is just Problem 1 again.** XOR each group independently: the complete pairs cancel (even parity), leaving the lone unique number. One group yields `a`, the other yields `b`. Done.

The whole trick is: *find a bit where the two answers must differ, and use it to sort them into separate buckets where each becomes a solved single-number problem.* That "find a distinguishing bit to split a hard problem into two easy ones" move shows up again in radix sort and trie-based maximum-XOR — same idea, different costume.

> **Why this matters beyond the puzzle:** the parity mental model is why XOR is used for checksums (detect an odd number of flipped bits), RAID parity disks (reconstruct one lost drive: `lost = XOR of all surviving drives`, the exact same "find the missing one" math), and cheap in-place swaps. When you see XOR in production, it's almost always "track parity / recover the one missing thing without storing everything."

---

[← Essential Bit Tricks & Formulas](02_essential_bit_tricks_formulas.md) | [Chapter overview](../10_Bit_Manipulation_Complete.md) | [Bit Masking Techniques →](04_bit_masking_techniques.md)
