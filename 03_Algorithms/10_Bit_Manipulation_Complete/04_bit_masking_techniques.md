# Bit Masking Techniques <a name="bit-masking"></a>

> **Navigation**: [← XOR Magic Properties](03_xor_magic_properties.md) | [Chapter overview](../10_Bit_Manipulation_Complete.md) | [Common Patterns & Templates →](05_common_patterns_templates.md)
> Page 4 of 6 in **Bit Manipulation Complete Guide**


## What is a Bit Mask?

```
A bit mask is a number used to SELECT or MODIFY specific bits.

Example: To work with only bits 2, 3, 4
Mask = 00011100 = 28

Use cases:
- Extract specific bits
- Set multiple bits at once
- Check if certain bits match a pattern
```

## Creating Masks

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

## Bit Masking in DP (Subset Problems)

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

## Example: Traveling Salesman with Bitmask DP

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

[← XOR Magic Properties](03_xor_magic_properties.md) | [Chapter overview](../10_Bit_Manipulation_Complete.md) | [Common Patterns & Templates →](05_common_patterns_templates.md)
