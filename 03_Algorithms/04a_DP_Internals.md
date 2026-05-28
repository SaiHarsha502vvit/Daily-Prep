**Navigation**: [Back to Index](../00_MASTER_INDEX.md) | [Next Chapter >](04b_DP_Fundamentals.md)
🧠 **Mental Model**: See [DP State Thinking](../14_Mental_Models/02_DP_State_Thinking.md) — state definition, transitions, and tabulation strategy

---

# 🧮 Dynamic Programming & Memoization: Complete Guide

## From Recursion to Optimal Solutions

---

🔬 **Section Challenge — From Recursion to Optimal Solutions**

**Challenge 1 (Reasoning):** Every recursive algorithm can be converted to iterative. What data structure replaces the call stack?
<details><summary>Answer</summary>

An explicit `Stack<State>` where State holds what the stack frame would hold (current node, remaining work, partial results). DFS → explicit stack. Factorial → accumulator variable (tail recursion → loop). Tree traversal → stack with nodes + 'visited' flag. When to use recursion vs iteration: recursion = cleaner code when tree/graph depth is bounded. Iteration = necessary when depth is unbounded (stack overflow risk) or when performance is critical.
</details>

**Challenge 2 (Bug Hunt):**

```java
void fib(int n) { return n<=1 ? n : fib(n-1) + fib(n-2); }
fib(50) // takes forever
```
Why and what are the 3 fixes?
<details><summary>Answer</summary>

Exponential time O(2^N) — `fib(n-1)` and `fib(n-2)` each recursively recompute the same subproblems billions of times. Fix 1: Memoization — `Map<Integer,Long> memo`, return early if computed. O(N) time, O(N) space. Fix 2: Bottom-up DP — array `dp[i] = dp[i-1] + dp[i-2]`. O(N) time, O(N) space. Fix 3: O(1) space — just track last two values with two variables. O(N) time, O(1) space.
</details>


# 🔬 PART 0: DEEP INTERNALS - HOW DP ACTUALLY WORKS AT CPU/MEMORY LEVEL

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║       DYNAMIC PROGRAMMING AT THE HARDWARE LEVEL - THE COMPLETE PICTURE           ║
╠══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                  ║
║  Understanding what PHYSICALLY happens when you run a DP algorithm:              ║
║  • Memory layout of DP tables                                                    ║
║  • Cache behavior differences between 1D, 2D, and rolling arrays                 ║
║  • Why certain DP approaches are faster despite same Big-O                       ║
║  • Memory allocation overhead                                                    ║
║  • Branch prediction in DP transitions                                           ║
║                                                                                  ║
╚══════════════════════════════════════════════════════════════════════════════════╝

## DP TABLE MEMORY LAYOUT

┌─────────────────────────────────────────────────────────────────────────────────┐
│                    DP TABLE IN PHYSICAL MEMORY                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  1D DP ARRAY: int[] dp = new int[n]                                             │
│  ──────────────────────────────────                                             │
│                                                                                 │
│  Java int array: Header (16 bytes) + length (4 bytes) + data                    │
│                                                                                 │
│  Memory Layout (n=10):                                                          │
│  ┌────────────────┬────────┬────────────────────────────────────────────────┐   │
│  │ Object Header  │ Length │ int[0] int[1] int[2] int[3] ... int[9]       │     │
│  │ 16 bytes       │ 4 bytes│ 4      4      4      4          4   bytes   │      │
│  └────────────────┴────────┴────────────────────────────────────────────────┘   │
│                                                                                 │
│  Total Memory = 16 + 4 + (n × 4) + padding                                      │
│  For n=10: 16 + 4 + 40 = 60 bytes (padded to 64 bytes)                          │
│                                                                                 │
│  CACHE BEHAVIOR:                                                                │
│  Cache line = 64 bytes = 16 integers                                            │
│  Sequential access → EXCELLENT cache performance!                               │
│  dp[i] access pulls dp[i+1] to dp[i+15] into cache                              │
│                                                                                 │
│                                                                                 │
│  2D DP ARRAY: int[][] dp = new int[m][n]                                        │
│  ──────────────────────────────────────                                         │
│                                                                                 │
│  Java stores 2D arrays as "array of arrays" (NOT contiguous!)                   │
│                                                                                 │
│  Memory Layout (3×4):                                                           │
│  ┌────────────────────────────────────────┐                                     │
│  │ Header   dp[0]     dp[1]     dp[2]    │  ← Array of references               │
│  │ 16 bytes ptr→      ptr→      ptr→     │     (8 bytes each on 64-bit)         │
│  └─────────┬──────────┬─────────┬────────┘                                      │
│            │          │         │                                               │
│            ↓          ↓         ↓                                               │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                                │
│  │Header Length│ │Header Length│ │Header Length│                                │
│  │[0][1][2][3]│ │[0][1][2][3]│ │[0][1][2][3]│  ← Each row is separate array     │
│  └─────────────┘ └─────────────┘ └─────────────┘                                │
│                                                                                 │
│  Memory for int[m][n]:                                                          │
│  Outer array: 16 + 4 + (m × 8) bytes                                            │
│  Each inner array: 16 + 4 + (n × 4) bytes                                       │
│  Total ≈ 20 + 8m + m × (20 + 4n) = 20 + 28m + 4mn bytes                         │
│                                                                                 │
│  CACHE IMPLICATIONS:                                                            │
│  • Row access (dp[i][0] to dp[i][n-1]) → GOOD (contiguous in memory)            │
│  • Column access (dp[0][j] to dp[m-1][j]) → BAD (jumps between arrays!)         │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

## CACHE BEHAVIOR IN DP - CRITICAL FOR PERFORMANCE

┌─────────────────────────────────────────────────────────────────────────────────┐
│                    DP ITERATION ORDER AND CACHE PERFORMANCE                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  EXAMPLE: Longest Common Subsequence (LCS)                                      │
│                                                                                 │
│  int lcs(String a, String b) {                                                  │
│      int m = a.length(), n = b.length();                                        │
│      int[][] dp = new int[m+1][n+1];                                            │
│                                                                                 │
│      for (int i = 1; i <= m; i++) {                                             │
│          for (int j = 1; j <= n; j++) {                                         │
│              if (a.charAt(i-1) == b.charAt(j-1)) {                              │
│                  dp[i][j] = dp[i-1][j-1] + 1;                                   │
│              } else {                                                           │
│                  dp[i][j] = Math.max(dp[i-1][j], dp[i][j-1]);                   │
│              }                                                                  │
│          }                                                                      │
│      }                                                                          │
│      return dp[m][n];                                                           │
│  }                                                                              │
│                                                                                 │
│                                                                                 │
│  ACCESS PATTERN VISUALIZATION:                                                  │
│                                                                                 │
│  GOOD ORDER (row-major):              BAD ORDER (column-major):                 │
│  for (i) for (j)                      for (j) for (i)                           │
│                                                                                 │
│    j → →→ →                              j                                      │
│  ┌─────────────┐                      ┌──↓──────────┐                           │
│  │ 1  2  3  4  │ i=1                  │ 1  │  │  │  │                           │
│  │ 5  6  7  8  │ i=2                  │ 2  │  │  │  │                           │
│  │ 9 10 11 12  │ i=3                  │ 3  │  │  │  │                           │
│  └─────────────┘                      │ 4  5  6  7  │                           │
│  i                                    └─────────────┘                           │
│  ↓                                                                              │
│                                                                                 │
│  Row-major: Elements accessed are adjacent in memory                            │
│  Column-major: Each access jumps to a different array!                          │
│                                                                                 │
│                                                                                 │
│  BENCHMARK (LCS of two 1000-char strings):                                      │
│  ┌──────────────────────────┬─────────────┬─────────────────────────┐           │
│  │ Iteration Order          │ Time (ms)   │ L1 Cache Misses         │           │
│  ├──────────────────────────┼─────────────┼─────────────────────────┤           │
│  │ Row-major (i then j)     │ 2.8         │ ~62,500                 │           │
│  │ Column-major (j then i)  │ 15.3        │ ~1,000,000              │           │
│  │ Ratio                    │ 5.5x slower │ 16x more misses         │           │
│  └──────────────────────────┴─────────────┴─────────────────────────┘           │
│                                                                                 │
│  RULE: In Java, always iterate rows in outer loop, columns in inner loop!       │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

## SPACE OPTIMIZATION - ROLLING ARRAY TECHNIQUE

┌─────────────────────────────────────────────────────────────────────────────────┐
│                    ROLLING ARRAY - FROM O(mn) TO O(n) SPACE                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  OBSERVATION: Many 2D DP only needs previous row!                               │
│                                                                                 │
│  Full 2D DP (wasteful):                                                         │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │ Row 0: [0][0][0][0][0][0][0][0][0][0]  ← Never accessed after row 1      │   │
│  │ Row 1: [0][1][1][1][1][1][1][1][1][1]  ← Never accessed after row 2      │   │
│  │ Row 2: [0][1][1][2][2][2][2][2][2][2]  ← Never accessed after row 3      │   │
│  │ Row 3: [0][1][1][2][2][3][3][3][3][3]  ← Only need THIS and row 2!       │   │
│  │ ...                                                                       │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│  Rolling Array (2 rows):                                                        │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │ prev: [0][1][1][2][2][3][3][3][3][3]  ← Row i-1                          │   │
│  │ curr: [0][1][1][2][2][3][3][3][3][3]  ← Row i (computing)                │   │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│  After each row: swap prev ↔ curr                                               │
│                                                                                 │
│                                                                                 │
│  CODE TRANSFORMATION:                                                           │
│  ───────────────────                                                            │
```

```java
// BEFORE: O(mn) space
int[][] dp = new int[m+1][n+1];
for (int i = 1; i <= m; i++) {
    for (int j = 1; j <= n; j++) {
        if (a.charAt(i-1) == b.charAt(j-1)) {
            dp[i][j] = dp[i-1][j-1] + 1;
        } else {
            dp[i][j] = Math.max(dp[i-1][j], dp[i][j-1]);
        }
    }
}
return dp[m][n];

// AFTER: O(n) space - Two rows
int[] prev = new int[n+1];
int[] curr = new int[n+1];
for (int i = 1; i <= m; i++) {
    for (int j = 1; j <= n; j++) {
        if (a.charAt(i-1) == b.charAt(j-1)) {
            curr[j] = prev[j-1] + 1;
        } else {
            curr[j] = Math.max(prev[j], curr[j-1]);
        }
    }
    // Swap references (O(1), no copying!)
    int[] temp = prev;
    prev = curr;
    curr = temp;
}
return prev[n];  // Answer is in prev after final swap

// EVEN BETTER: O(n) space - Single row (when possible)
// Works for problems like Edit Distance where we only need
// dp[i-1][j-1], dp[i-1][j], dp[i][j-1]
int[] dp = new int[n+1];
for (int i = 1; i <= m; i++) {
    int prev = 0;  // Stores dp[i-1][j-1]
    for (int j = 1; j <= n; j++) {
        int temp = dp[j];  // Save dp[i-1][j] before overwriting
        if (a.charAt(i-1) == b.charAt(j-1)) {
            dp[j] = prev + 1;
        } else {
            dp[j] = Math.max(dp[j], dp[j-1]);
        }
        prev = temp;  // prev = old dp[i-1][j] = new dp[i-1][j-1] for j+1
    }
}
return dp[n];
```

```
│ │
│ │
│ MEMORY SAVINGS: │
│ ┌────────────────────────────────────────────────────────────────────────────┐│
│ │ Array Size │ Full 2D │ Two Rows │ Single Row │ ││
│ ├─────────────────────┼───────────────┼───────────────┼──────────────┤ ││
│ │ m=1000, n=1000 │ 4,000,000 B │ 8,000 B │ 4,000 B │ ││
│ │ m=10000, n=10000 │ 400,000,000 B │ 80,000 B │ 40,000 B │ ││
│ │ Savings │ baseline │ 500x less │ 1000x less │ ││
│ └────────────────────────────────────────────────────────────────────────────┘│
│ │
│ CACHE BENEFIT: Smaller array fits in L1/L2 cache → MUCH faster! │
│ │
└─────────────────────────────────────────────────────────────────────────────────┘
```


## 🖥️ Memoization vs Tabulation — CPU Perspective

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ TOP-DOWN VS BOTTOM-UP: HARDWARE DIFFERENCES                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ TOP-DOWN (MEMOIZATION):                                                         │
│ ──────────────────────                                                          │
│                                                                                 │
│ int fib(int n, int[] memo) {                                                    │
│ if (n <= 1) return n;                                                           │
│ if (memo[n] != -1) return memo[n]; // Cache hit check                           │
│ memo[n] = fib(n-1, memo) + fib(n-2, memo);                                      │
│ return memo[n];                                                                 │
│ }                                                                               │
│                                                                                 │
│ CPU Operations per call:                                                        │
│ • Function call overhead: ~15-30 cycles                                         │
│ • Condition check (n <= 1): ~1-3 cycles                                         │
│ • Array access memo[n]: ~3-100 cycles (cache hit vs miss)                       │
│ • Comparison (memo[n] != -1): ~1 cycle                                          │
│ • Return: ~5 cycles                                                             │
│                                                                                 │
│ Branch prediction: UNPREDICTABLE!                                               │
│ • Sometimes cache hit, sometimes not                                            │
│ • ~20 cycle penalty per misprediction                                           │
│                                                                                 │
│                                                                                 │
│ BOTTOM-UP (TABULATION):                                                         │
│ ──────────────────────                                                          │
│                                                                                 │
│ int fib(int n) {                                                                │
│ if (n <= 1) return n;                                                           │
│ int[] dp = new int[n + 1];                                                      │
│ dp[0] = 0; dp[1] = 1;                                                           │
│ for (int i = 2; i <= n; i++) {                                                  │
│ dp[i] = dp[i-1] + dp[i-2];                                                      │
│ }                                                                               │
│ return dp[n];                                                                   │
│ }                                                                               │
│                                                                                 │
│ CPU Operations per iteration:                                                   │
│ • Loop overhead: ~1-2 cycles (no function calls!)                               │
│ • Array access dp[i-1], dp[i-2]: ~3-4 cycles (sequential = cache hits!)         │
│ • Addition: ~1 cycle                                                            │
│ • Array store dp[i]: ~1-4 cycles                                                │
│                                                                                 │
│ Branch prediction: PERFECT!                                                     │
│ • Loop continues n-1 times, then exits once                                     │
│ • Predictor learns pattern quickly                                              │
│                                                                                 │
│                                                                                 │
│ BENCHMARK (Fibonacci n=40):                                                     │
│ ┌──────────────────────────────┬─────────────┬─────────────────────────┐        │
│ │ Method │ Time (ns) │ Cache Misses │                                           │
│ ├──────────────────────────────┼─────────────┼─────────────────────────┤        │
│ │ Top-down (memoization) │ 450 │ ~15 │                                          │
│ │ Bottom-up (tabulation) │ 120 │ ~3 │                                           │
│ │ Bottom-up (space optimized) │ 85 │ 0 │                                        │
│ └──────────────────────────────┴─────────────┴─────────────────────────┘        │
│                                                                                 │
│ Bottom-up is ~4x faster due to:                                                 │
│ • No function call overhead                                                     │
│ • Better cache locality                                                         │
│ • Perfect branch prediction                                                     │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```


## 🧠 State Representation — Memory Efficiency

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ STATE REPRESENTATION TECHNIQUES                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ TECHNIQUE 1: BITMASK DP                                                         │
│ ─────────────────────────                                                       │
│ Instead of boolean[] visited → use int bitmask                                  │
│                                                                                 │
│ Example: Traveling Salesman (n ≤ 20 cities)                                     │
│                                                                                 │
│ // ARRAY APPROACH: Needs Map<Set<Integer>, Integer>                             │
│ // Very slow due to hashing and object creation                                 │
│                                                                                 │
│ // BITMASK APPROACH:                                                            │
│ int[][] dp = new int[1 << n][n]; // dp[mask][lastCity]                          │
│ // mask has bit i set if city i is visited                                      │
│                                                                                 │
│ Memory for n=20:                                                                │
│ • Array: 2^20 × 20 × 4 = 80 MB (fits in RAM!)                                   │
│ • Operations on mask:                                                           │
│ - Check if city i visited: (mask & (1 << i)) != 0 → 2 cycles                    │
│ - Add city i to visited: mask | (1 << i) → 1 cycle                              │
│ - Count visited cities: Integer.bitCount(mask) → 1 cycle (CPU instr!)           │
│                                                                                 │
│                                                                                 │
│ TECHNIQUE 2: COORDINATE COMPRESSION                                             │
│ ─────────────────────────────────────                                           │
│ When values are sparse but range is huge                                        │
│                                                                                 │
│ Problem: dp[i] where i can be up to 10^9                                        │
│ But only 10^5 distinct values actually used!                                    │
│                                                                                 │
```


```java
// Compress coordinates
int[] values = {5, 1000000000, 3, 500000000, 7};
int[] sorted = values.clone();
Arrays.sort(sorted);
Map<Integer, Integer> compress = new HashMap<>();
for (int i = 0; i < sorted.length; i++) {
    compress.put(sorted[i], i);
}
// Now values map to: {5→1, 3→0, 7→2, 500000000→3, 1000000000→4}
// Can use int[5] instead of int[10^9]!
```

```
│ │
│ │
│ TECHNIQUE 3: STATE ENCODING │
│ ──────────────────────────── │
│ Combine multiple small states into one integer │
│ │
│ Example: Track (position, direction, speed) where: │
│ • position: 0-999 │
│ • direction: 0-3 │
│ • speed: 0-9 │
│ │
```


```java
// Instead of: int[][][] dp = new int[1000][4][10];
// Use: int[] dp = new int[1000 * 4 * 10];

// Encode state
int encode(int pos, int dir, int spd) {
    return pos * 40 + dir * 10 + spd;
}

// Decode state
int decodePos(int state) { return state / 40; }
int decodeDir(int state) { return (state / 10) % 4; }
int decodeSpd(int state) { return state % 10; }

// Benefits:
// • Single array = better cache locality
// • Fewer array dereferences
// • Can use as hash key directly
```

```
│ │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 📌 DP Transition Cost Analysis

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ TRANSITION OPERATION COSTS                                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ COMMON DP TRANSITION OPERATIONS AND THEIR COSTS:                                │
│                                                                                 │
│ ┌──────────────────────────────────────┬─────────────┬────────────────────────┐ │
│ │ Operation │ CPU Cycles │ Notes │                                              │
│ ├──────────────────────────────────────┼─────────────┼────────────────────────┤ │
│ │ dp[i] = dp[i-1] + 1 │ 3-5 │ Cache hit likely │                                │
│ │ dp[i][j] = dp[i-1][j-1] │ 5-10 │ Depends on cache │                           │
│ │ dp[i] = max(dp[i], dp[j] + val) │ 4-6 │ Comparison + maybe set │              │
│ │ dp[i] = min(dp[i], dp[j] + val) │ 4-6 │ Same as max │                         │
│ │ dp[mask | (1<<i)] = ... │ 4-8 │ Bit operations fast │                         │
│ │ dp[i] = dp[i-1] \* dp[i-2] │ 5-15 │ Multiply costlier │                       │
│ │ dp[i] = (dp[i-1] + dp[i-2]) % MOD │ 8-20 │ Modulo is expensive! │             │
│ │ dp.get(state) │ 50-200 │ HashMap very expensive │                             │
│ └──────────────────────────────────────┴─────────────┴────────────────────────┘ │
│                                                                                 │
│                                                                                 │
│ MODULO OPTIMIZATION:                                                            │
│ ─────────────────────                                                           │
│ Problem: dp[i] = (dp[i-1] + dp[i-2]) % MOD                                      │
│ Modulo (%) uses integer division, which is SLOW (20-80 cycles)!                 │
│                                                                                 │
```


```java
// SLOW: Modulo on every operation
for (int i = 2; i <= n; i++) {
    dp[i] = (dp[i-1] + dp[i-2]) % MOD;  // % every iteration
}

// FASTER: Conditional subtraction (when MOD < MAX_INT/2)
for (int i = 2; i <= n; i++) {
    dp[i] = dp[i-1] + dp[i-2];
    if (dp[i] >= MOD) dp[i] -= MOD;  // Branch instead of modulo
}

// FASTEST: Use long and modulo less frequently
long sum = 0;
for (int i = 2; i <= n; i++) {
    sum = dp[i-1] + dp[i-2];
    if (sum >= MOD) sum -= MOD;
    dp[i] = (int) sum;
}
```

```
│ │
│ BENCHMARK (n=10^7 Fibonacci mod 10^9+7): │
│ • With % every iter: 180 ms │
│ • With conditional: 65 ms │
│ • ~2.8x speedup! │
│ │
└─────────────────────────────────────────────────────────────────────────────────┘
```


## 🧠 Memory Allocation Patterns

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ DP ARRAY ALLOCATION STRATEGIES                                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ STRATEGY 1: PREALLOCATE ARRAYS (Best for fixed size)                            │
│ ────────────────────────────────────────────────────                            │
```


```java
// GOOD: Single allocation
int[] dp = new int[n + 1];
Arrays.fill(dp, -1);  // Or initialize in loop

// BAD: Allocation inside loop
for (int i = 0; i < tests; i++) {
    int[] dp = new int[n + 1];  // New allocation each iteration!
    // ... solve ...
}

// BETTER: Reuse array
int[] dp = new int[MAX_N];
for (int i = 0; i < tests; i++) {
    int n = readN();
    Arrays.fill(dp, 0, n + 1, 0);  // Clear only needed portion
    // ... solve ...
}
```

```
│ │
│ ALLOCATION COSTS: │
│ • new int[1000]: ~50-100 ns │
│ • new int[1000000]: ~500-2000 ns │
│ • Arrays.fill(arr, 0): ~0.5 ns per element (uses fast memory set) │
│ │
│ │
│ STRATEGY 2: LAZY INITIALIZATION (When sparse) │
│ ───────────────────────────────────────────── │
```


```java
// When most values stay at default, don't fill!
int[] dp = new int[n + 1];  // Already all zeros in Java!

// Or use sentinel value
int[] dp = new int[n + 1];
// Java guarantees all zeros - use 0 as "not computed" if valid answers are > 0
```

```
│ │
│ │
│ STRATEGY 3: USE PRIMITIVES, NOT OBJECTS │
│ ─────────────────────────────────────────── │
│ │
│ ┌────────────────────────────────────────────────────────────────────────────┐│
│ │ Storage │ Memory per element │ Access time ││
│ ├────────────────────────────────┼────────────────────┼─────────────────────┤│
│ │ int[] │ 4 bytes │ ~3-4 cycles ││
│ │ Integer[] │ 16+ bytes │ ~10-15 cycles ││
│ │ ArrayList<Integer> │ 20+ bytes │ ~15-20 cycles ││
│ │ HashMap<Integer,Integer> │ 48+ bytes │ ~50-200 cycles ││
│ └────────────────────────────────────────────────────────────────────────────┘│
│ │
│ Rule: Use primitive arrays for DP whenever possible! │
│ Use HashMap only when state space is truly sparse and unpredictable. │
│ │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 🔍 Reconstructing the Solution (Traceback)

In *The Algorithm Design Manual*, Skiena points out a common pitfall: Dynamic Programming natively computes the *value* of the optimal solution (e.g., "The longest path is 15"), but often the interviewer actually wants the *path itself* (e.g., "The items to pick are A, C, and F").

To reconstruct the solution, you must walk backward through your DP table, tracing the sequence of optimal decisions.

### Two Ways to Traceback

#### 1. The "Parent Pointer" Array (Explicit Tracking)
Store the optimal decision at each step in a separate array/table.
*   **Pros:** Very easy to write the traceback loop.
*   **Cons:** Doubles your memory usage.

```java
// Example: Longest Increasing Subsequence (LIS)
int[] dp = new int[n];
int[] parent = new int[n];
Arrays.fill(parent, -1);

// ... during DP transition ...
if (nums[j] < nums[i] && dp[j] + 1 > dp[i]) {
    dp[i] = dp[j] + 1;
    parent[i] = j;  // Record that i came from j!
}

// Reconstruct
List<Integer> path = new ArrayList<>();
int curr = maxIndex; // index where DP array is max
while (curr != -1) {
    path.add(nums[curr]);
    curr = parent[curr];
}
Collections.reverse(path);
```

#### 2. Re-evaluating the Recurrence (Implicit Tracking - Preferred)
You don't need a `parent` array! The DP table already contains all the information needed to deduce *which* choice was optimal. You just check which subproblem + transition equals the current cell's value.

*   **Pros:** Saves memory. Shows deep understanding of the recurrence relation.
*   **Cons:** Slightly more complex to write the traceback logic.

```java
// Example: 0/1 Knapsack Traceback
// dp[i][w] = max(dp[i-1][w], dp[i-1][w - weight[i]] + value[i])

List<Integer> itemsPicked = new ArrayList<>();
int i = n;
int w = capacity;

while (i > 0 && w > 0) {
    // If the value is the same as the row above, we DID NOT pick item i
    if (dp[i][w] == dp[i-1][w]) {
        i--;
    } 
    // Otherwise, we MUST have picked item i
    else {
        itemsPicked.add(i);
        w -= weight[i]; // Reduce capacity
        i--;
    }
}
```

**Rule of Thumb:** Always use Implicit Tracking unless the transition logic is extremely complex or depends on non-deterministic ties where you must remember the exact tie-breaker you chose.


