# Bit-Level Operations - Complete Guide

> **Navigation**: [← Production Failure Modes — Real Incidents…](05_production_failure_modes_real_incidents_from.md) | [Chapter overview](../01a_Memory_Foundations.md) | [University-Level Addendum — Memory… →](07_university_level_addendum_memory_foundations_as.md)
> Page 6 of 7 in **Memory Foundations — Where Data Structures Live**


**Binary Representation**:

```text
int x = 42;
42 in binary: 00000000 00000000 00000000 00101010
Position:                                 5 4 3 2 1 0
Value:        32 + 8 + 2 = 42   (bits 5, 3 and 1 are set)
```

**Bit Operations**:

| Operator | Name | Rule | Example (8-bit view) |
| -------- | ---- | ---- | -------------------- |
| `&` | AND | Both bits must be 1 | `42 & 15` → `00101010 & 00001111 = 00001010` = 10 |
| `\|` | OR | Either bit can be 1 | `42 \| 15` → `00101010 \| 00001111 = 00101111` = 47 |
| `^` | XOR | Bits must differ | `42 ^ 15` → `00101010 ^ 00001111 = 00100101` = 37 |
| `~` | NOT | Flip all bits | `~42` → `11111111 11111111 11111111 11010101` = -43 |
| `<<` | Left shift | Multiply by 2ⁿ | `42 << 2` → `10101000` = 168 (42 × 4) |
| `>>` | Right shift | Divide by 2ⁿ | `42 >> 2` → `00001010` = 10 (42 / 4, integer division) |

Two's complement note: `-43 = ~42`, i.e. `~x = -x - 1`.

**AND (`&`) — use:** masking bits, checking if a bit is set.

- Check if even: `(n & 1) == 0`
- Get last k bits: `n & ((1 << k) - 1)`

**OR (`|`) — use:** setting bits.

- Set bit i: `n | (1 << i)`

**XOR (`^`) — use:** toggle bits, find the single number, swap.

- Toggle bit i: `n ^ (1 << i)`
- Swap without temp: `a ^= b; b ^= a; a ^= b;`
- `a ^ a = 0` (cancel out)
- `a ^ 0 = a` (identity)

**Shifts — use:** fast multiplication and division by powers of two.

- `n * 2` → `n << 1`
- `n * 8` → `n << 3`
- `n * 2^k` → `n << k`
- `n / 2` → `n >> 1`
- `n / 8` → `n >> 3`

**Common Bit Tricks**:

1. **Check if power of 2:** `(n & (n-1)) == 0`

   ```text
   8: 1000
   7: 0111
   8 & 7: 0000 ✓ (power of 2)
   6: 0110
   5: 0101
   6 & 5: 0100 ✗ (not power of 2)
   ```

2. **Get lowest set bit:** `n & (-n)`

   ```text
   12:  1100
   -12: 0100 (two's complement, low bits)
   12 & -12: 0100 = 4 (lowest set bit)
   ```

3. **Clear lowest set bit:** `n & (n-1)`

   ```text
   12: 1100
   11: 1011
   12 & 11: 1000 = 8 (cleared bit at position 2)
   ```

4. **Count set bits (Brian Kernighan's):**

   ```java
   int count = 0;
   while (n != 0) {
       n = n & (n - 1);  // Clear lowest bit
       count++;
   }
   ```

5. **Check if bit i is set:** `(n & (1 << i)) != 0`
6. **Set bit i:** `n | (1 << i)`
7. **Clear bit i:** `n & ~(1 << i)`
8. **Toggle bit i:** `n ^ (1 << i)`

---

🔬 **Section Challenge — BIT MANIPULATION**

**Challenge 1 (Performance):** Why does `x >> 1` execute faster than `x / 2` at the CPU level?

<details><summary>Answer</summary>

Integer division (`DIV`) takes 20-80 clock cycles because it requires complex hardware logic (multiple shifts and subtracts). A right shift (`SHR` or `SAR`) takes 1 clock cycle because it directly shifts the binary representation in the register. Note: Modern compilers often optimize `x / 2` to a shift instruction automatically, but understanding the difference is crucial for low-level performance tuning.

</details>

**Challenge 2 (Reasoning):** Using XOR, how can you swap two integer variables `a` and `b` without using a temporary variable? Explain why it works.

<details><summary>Answer</summary>

```java
a = a ^ b;
b = a ^ b;
a = a ^ b;
```

It works due to XOR properties: `x ^ x = 0` and `x ^ 0 = x`. After step 1, `a` holds `(initial_a ^ initial_b)`. Step 2 makes `b = (initial_a ^ initial_b) ^ initial_b`, which simplifies to `initial_a`. Step 3 makes `a = (initial_a ^ initial_b) ^ initial_a`, which simplifies to `initial_b`.

</details>

---

## Challenge 3 (Cache-Line Effects in 2D Array Traversal)

**Scenario:** You have two `int[][] matrix` declarations and need to initialize every element to `0`. Both compile correctly. Which version is faster and _why_?

```java
// Version A: Row-major order (standard)
for (int row = 0; row < N; row++)
    for (int col = 0; col < M; col++)
        matrix[row][col] = 0;

// Version B: Column-major order (transposed pattern)
for (int col = 0; col < M; col++)
    for (int row = 0; row < N; row++)
        matrix[row][col] = 0;
```

**Follow-up:** In Java, `int[][]` is an array of arrays (a ragged array). Does this affect cache-line behavior at the inner loop boundary? Explain what happens at the transition from `matrix[row][M-1]` to `matrix[row+1][0]`.

<details><summary>Answer</summary>

**Version A is significantly faster.**

**Why:** `int` is 4 bytes; a cache line is 64 bytes. This means 16 consecutive `int` values fit in a single cache line. In Version A, the inner loop accesses `matrix[row][0]`, `matrix[row][1]`, ... `matrix[row][15]` consecutively — all 16 land on the same cache line. After one cold miss, the CPU prefetcher loads the entire next cache line before you ask. For a row of M=1000, only `1000/16 = 63` cache misses occur for the inner loop. Version B accesses `matrix[0][col]`, `matrix[1][col]`, ... — each access jumps to a _different_ row, which is stored in a completely different heap region. There is no spatial locality across rows, so _every access_ is a cache miss: M × N misses instead of N + M/16 misses.

**On the ragged array boundary (the follow-up):**
In Java, `int[][]` stores rows as separate heap objects. When Version A reaches the end of a row and starts the next row, `matrix[row+1]` is a new _reference_ load (the outer array's pointer to the inner row array). This reference itself is cached (outer array access), but `matrix[row+1][0]` — the actual first element of the new row — is in a different heap allocation. The CPU will load that first element from RAM (cold miss), then stream the next 15 elements from cache for free. So Version A pays M cache line transitions × 1 cold miss each (for the first element of each row), plus M × (16 inner-loop elements cached). Version B pays M × N cold misses — one per element.

**Numbers (M=1000, N=1000, 3 GHz CPU, 100ns RAM latency):**

- Version A: ~1,000 cold misses (rows) + ~63 cached inner-misses = ~100,000 ns = 0.1 ms
- Version B: 1,000,000 misses = 100,000,000 ns = 100 ms
- **Version A is approximately 1,000x faster** for this initialization.
  </details>

---

[← Production Failure Modes — Real Incidents…](05_production_failure_modes_real_incidents_from.md) | [Chapter overview](../01a_Memory_Foundations.md) | [University-Level Addendum — Memory… →](07_university_level_addendum_memory_foundations_as.md)
