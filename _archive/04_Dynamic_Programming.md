# 🧮 Dynamic Programming & Memoization: Complete Guide

## From Recursion to Optimal Solutions

---

# 🔬 PART 0: DEEP INTERNALS - HOW DP ACTUALLY WORKS AT CPU/MEMORY LEVEL

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║       DYNAMIC PROGRAMMING AT THE HARDWARE LEVEL - THE COMPLETE PICTURE          ║
╠══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                   ║
║  Understanding what PHYSICALLY happens when you run a DP algorithm:              ║
║  • Memory layout of DP tables                                                    ║
║  • Cache behavior differences between 1D, 2D, and rolling arrays                ║
║  • Why certain DP approaches are faster despite same Big-O                      ║
║  • Memory allocation overhead                                                    ║
║  • Branch prediction in DP transitions                                           ║
║                                                                                   ║
╚══════════════════════════════════════════════════════════════════════════════════╝
```

## DP TABLE MEMORY LAYOUT

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    DP TABLE IN PHYSICAL MEMORY                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  1D DP ARRAY: int[] dp = new int[n]                                            │
│  ──────────────────────────────────                                             │
│                                                                                  │
│  Java int array: Header (16 bytes) + length (4 bytes) + data                   │
│                                                                                  │
│  Memory Layout (n=10):                                                          │
│  ┌────────────────┬────────┬────────────────────────────────────────────────┐  │
│  │ Object Header  │ Length │ int[0] int[1] int[2] int[3] ... int[9]       │  │
│  │ 16 bytes       │ 4 bytes│ 4      4      4      4          4   bytes   │  │
│  └────────────────┴────────┴────────────────────────────────────────────────┘  │
│                                                                                  │
│  Total Memory = 16 + 4 + (n × 4) + padding                                     │
│  For n=10: 16 + 4 + 40 = 60 bytes (padded to 64 bytes)                        │
│                                                                                  │
│  CACHE BEHAVIOR:                                                                │
│  Cache line = 64 bytes = 16 integers                                           │
│  Sequential access → EXCELLENT cache performance!                              │
│  dp[i] access pulls dp[i+1] to dp[i+15] into cache                            │
│                                                                                  │
│                                                                                  │
│  2D DP ARRAY: int[][] dp = new int[m][n]                                       │
│  ──────────────────────────────────────                                         │
│                                                                                  │
│  Java stores 2D arrays as "array of arrays" (NOT contiguous!)                  │
│                                                                                  │
│  Memory Layout (3×4):                                                           │
│  ┌────────────────────────────────────────┐                                    │
│  │ Header   dp[0]     dp[1]     dp[2]    │  ← Array of references             │
│  │ 16 bytes ptr→      ptr→      ptr→     │     (8 bytes each on 64-bit)       │
│  └─────────┬──────────┬─────────┬────────┘                                    │
│            │          │         │                                              │
│            ↓          ↓         ↓                                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                              │
│  │Header Length│ │Header Length│ │Header Length│                              │
│  │[0][1][2][3]│ │[0][1][2][3]│ │[0][1][2][3]│  ← Each row is separate array │
│  └─────────────┘ └─────────────┘ └─────────────┘                              │
│                                                                                  │
│  Memory for int[m][n]:                                                         │
│  Outer array: 16 + 4 + (m × 8) bytes                                          │
│  Each inner array: 16 + 4 + (n × 4) bytes                                     │
│  Total ≈ 20 + 8m + m × (20 + 4n) = 20 + 28m + 4mn bytes                      │
│                                                                                  │
│  CACHE IMPLICATIONS:                                                            │
│  • Row access (dp[i][0] to dp[i][n-1]) → GOOD (contiguous in memory)          │
│  • Column access (dp[0][j] to dp[m-1][j]) → BAD (jumps between arrays!)       │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## CACHE BEHAVIOR IN DP - CRITICAL FOR PERFORMANCE

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    DP ITERATION ORDER AND CACHE PERFORMANCE                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  EXAMPLE: Longest Common Subsequence (LCS)                                      │
│                                                                                  │
│  int lcs(String a, String b) {                                                 │
│      int m = a.length(), n = b.length();                                       │
│      int[][] dp = new int[m+1][n+1];                                          │
│                                                                                  │
│      for (int i = 1; i <= m; i++) {                                           │
│          for (int j = 1; j <= n; j++) {                                       │
│              if (a.charAt(i-1) == b.charAt(j-1)) {                            │
│                  dp[i][j] = dp[i-1][j-1] + 1;                                 │
│              } else {                                                          │
│                  dp[i][j] = Math.max(dp[i-1][j], dp[i][j-1]);                 │
│              }                                                                 │
│          }                                                                     │
│      }                                                                         │
│      return dp[m][n];                                                         │
│  }                                                                              │
│                                                                                  │
│                                                                                  │
│  ACCESS PATTERN VISUALIZATION:                                                  │
│                                                                                  │
│  GOOD ORDER (row-major):              BAD ORDER (column-major):                │
│  for (i) for (j)                      for (j) for (i)                          │
│                                                                                  │
│    j → →→ →                              j                                      │
│  ┌─────────────┐                      ┌──↓──────────┐                          │
│  │ 1  2  3  4  │ i=1                  │ 1  │  │  │  │                          │
│  │ 5  6  7  8  │ i=2                  │ 2  │  │  │  │                          │
│  │ 9 10 11 12  │ i=3                  │ 3  │  │  │  │                          │
│  └─────────────┘                      │ 4  5  6  7  │                          │
│  i                                    └─────────────┘                          │
│  ↓                                                                              │
│                                                                                  │
│  Row-major: Elements accessed are adjacent in memory                           │
│  Column-major: Each access jumps to a different array!                         │
│                                                                                  │
│                                                                                  │
│  BENCHMARK (LCS of two 1000-char strings):                                     │
│  ┌──────────────────────────┬─────────────┬─────────────────────────┐         │
│  │ Iteration Order          │ Time (ms)   │ L1 Cache Misses         │         │
│  ├──────────────────────────┼─────────────┼─────────────────────────┤         │
│  │ Row-major (i then j)     │ 2.8         │ ~62,500                 │         │
│  │ Column-major (j then i)  │ 15.3        │ ~1,000,000              │         │
│  │ Ratio                    │ 5.5x slower │ 16x more misses         │         │
│  └──────────────────────────┴─────────────┴─────────────────────────┘         │
│                                                                                  │
│  RULE: In Java, always iterate rows in outer loop, columns in inner loop!     │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## SPACE OPTIMIZATION - ROLLING ARRAY TECHNIQUE

````
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    ROLLING ARRAY - FROM O(mn) TO O(n) SPACE                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  OBSERVATION: Many 2D DP only needs previous row!                              │
│                                                                                  │
│  Full 2D DP (wasteful):                                                        │
│  ┌───────────────────────────────────────────────────────────────────────────┐│
│  │ Row 0: [0][0][0][0][0][0][0][0][0][0]  ← Never accessed after row 1      ││
│  │ Row 1: [0][1][1][1][1][1][1][1][1][1]  ← Never accessed after row 2      ││
│  │ Row 2: [0][1][1][2][2][2][2][2][2][2]  ← Never accessed after row 3      ││
│  │ Row 3: [0][1][1][2][2][3][3][3][3][3]  ← Only need THIS and row 2!       ││
│  │ ...                                                                       ││
│  └───────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  Rolling Array (2 rows):                                                       │
│  ┌───────────────────────────────────────────────────────────────────────────┐│
│  │ prev: [0][1][1][2][2][3][3][3][3][3]  ← Row i-1                          ││
│  │ curr: [0][1][1][2][2][3][3][3][3][3]  ← Row i (computing)                ││
│  └───────────────────────────────────────────────────────────────────────────┘│
│  After each row: swap prev ↔ curr                                             │
│                                                                                  │
│                                                                                  │
│  CODE TRANSFORMATION:                                                          │
│  ───────────────────                                                           │
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
````

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

## MEMOIZATION VS TABULATION - CPU PERSPECTIVE

```

┌─────────────────────────────────────────────────────────────────────────────────┐
│ TOP-DOWN VS BOTTOM-UP: HARDWARE DIFFERENCES │
├─────────────────────────────────────────────────────────────────────────────────┤
│ │
│ TOP-DOWN (MEMOIZATION): │
│ ────────────────────── │
│ │
│ int fib(int n, int[] memo) { │
│ if (n <= 1) return n; │
│ if (memo[n] != -1) return memo[n]; // Cache hit check │
│ memo[n] = fib(n-1, memo) + fib(n-2, memo); │
│ return memo[n]; │
│ } │
│ │
│ CPU Operations per call: │
│ • Function call overhead: ~15-30 cycles │
│ • Condition check (n <= 1): ~1-3 cycles │
│ • Array access memo[n]: ~3-100 cycles (cache hit vs miss) │
│ • Comparison (memo[n] != -1): ~1 cycle │
│ • Return: ~5 cycles │
│ │
│ Branch prediction: UNPREDICTABLE! │
│ • Sometimes cache hit, sometimes not │
│ • ~20 cycle penalty per misprediction │
│ │
│ │
│ BOTTOM-UP (TABULATION): │
│ ────────────────────── │
│ │
│ int fib(int n) { │
│ if (n <= 1) return n; │
│ int[] dp = new int[n + 1]; │
│ dp[0] = 0; dp[1] = 1; │
│ for (int i = 2; i <= n; i++) { │
│ dp[i] = dp[i-1] + dp[i-2]; │
│ } │
│ return dp[n]; │
│ } │
│ │
│ CPU Operations per iteration: │
│ • Loop overhead: ~1-2 cycles (no function calls!) │
│ • Array access dp[i-1], dp[i-2]: ~3-4 cycles (sequential = cache hits!) │
│ • Addition: ~1 cycle │
│ • Array store dp[i]: ~1-4 cycles │
│ │
│ Branch prediction: PERFECT! │
│ • Loop continues n-1 times, then exits once │
│ • Predictor learns pattern quickly │
│ │
│ │
│ BENCHMARK (Fibonacci n=40): │
│ ┌──────────────────────────────┬─────────────┬─────────────────────────┐ │
│ │ Method │ Time (ns) │ Cache Misses │ │
│ ├──────────────────────────────┼─────────────┼─────────────────────────┤ │
│ │ Top-down (memoization) │ 450 │ ~15 │ │
│ │ Bottom-up (tabulation) │ 120 │ ~3 │ │
│ │ Bottom-up (space optimized) │ 85 │ 0 │ │
│ └──────────────────────────────┴─────────────┴─────────────────────────┘ │
│ │
│ Bottom-up is ~4x faster due to: │
│ • No function call overhead │
│ • Better cache locality │
│ • Perfect branch prediction │
│ │
└─────────────────────────────────────────────────────────────────────────────────┘

```

## STATE REPRESENTATION - MEMORY EFFICIENCY

```

┌─────────────────────────────────────────────────────────────────────────────────┐
│ STATE REPRESENTATION TECHNIQUES │
├─────────────────────────────────────────────────────────────────────────────────┤
│ │
│ TECHNIQUE 1: BITMASK DP │
│ ───────────────────────── │
│ Instead of boolean[] visited → use int bitmask │
│ │
│ Example: Traveling Salesman (n ≤ 20 cities) │
│ │
│ // ARRAY APPROACH: Needs Map<Set<Integer>, Integer> │
│ // Very slow due to hashing and object creation │
│ │
│ // BITMASK APPROACH: │
│ int[][] dp = new int[1 << n][n]; // dp[mask][lastCity] │
│ // mask has bit i set if city i is visited │
│ │
│ Memory for n=20: │
│ • Array: 2^20 × 20 × 4 = 80 MB (fits in RAM!) │
│ • Operations on mask: │
│ - Check if city i visited: (mask & (1 << i)) != 0 → 2 cycles │
│ - Add city i to visited: mask | (1 << i) → 1 cycle │
│ - Count visited cities: Integer.bitCount(mask) → 1 cycle (CPU instr!) │
│ │
│ │
│ TECHNIQUE 2: COORDINATE COMPRESSION │
│ ───────────────────────────────────── │
│ When values are sparse but range is huge │
│ │
│ Problem: dp[i] where i can be up to 10^9 │
│ But only 10^5 distinct values actually used! │
│ │

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

│ │
└─────────────────────────────────────────────────────────────────────────────────┘

```

## DP TRANSITION COST ANALYSIS

```

┌─────────────────────────────────────────────────────────────────────────────────┐
│ TRANSITION OPERATION COSTS │
├─────────────────────────────────────────────────────────────────────────────────┤
│ │
│ COMMON DP TRANSITION OPERATIONS AND THEIR COSTS: │
│ │
│ ┌──────────────────────────────────────┬─────────────┬────────────────────────┐│
│ │ Operation │ CPU Cycles │ Notes ││
│ ├──────────────────────────────────────┼─────────────┼────────────────────────┤│
│ │ dp[i] = dp[i-1] + 1 │ 3-5 │ Cache hit likely ││
│ │ dp[i][j] = dp[i-1][j-1] │ 5-10 │ Depends on cache ││
│ │ dp[i] = max(dp[i], dp[j] + val) │ 4-6 │ Comparison + maybe set ││
│ │ dp[i] = min(dp[i], dp[j] + val) │ 4-6 │ Same as max ││
│ │ dp[mask | (1<<i)] = ... │ 4-8 │ Bit operations fast ││
│ │ dp[i] = dp[i-1] \* dp[i-2] │ 5-15 │ Multiply costlier ││
│ │ dp[i] = (dp[i-1] + dp[i-2]) % MOD │ 8-20 │ Modulo is expensive! ││
│ │ dp.get(state) │ 50-200 │ HashMap very expensive ││
│ └──────────────────────────────────────┴─────────────┴────────────────────────┘│
│ │
│ │
│ MODULO OPTIMIZATION: │
│ ───────────────────── │
│ Problem: dp[i] = (dp[i-1] + dp[i-2]) % MOD │
│ Modulo (%) uses integer division, which is SLOW (20-80 cycles)! │
│ │

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

│ │
│ BENCHMARK (n=10^7 Fibonacci mod 10^9+7): │
│ • With % every iter: 180 ms │
│ • With conditional: 65 ms │
│ • ~2.8x speedup! │
│ │
└─────────────────────────────────────────────────────────────────────────────────┘

```

## MEMORY ALLOCATION PATTERNS

```

┌─────────────────────────────────────────────────────────────────────────────────┐
│ DP ARRAY ALLOCATION STRATEGIES │
├─────────────────────────────────────────────────────────────────────────────────┤
│ │
│ STRATEGY 1: PREALLOCATE ARRAYS (Best for fixed size) │
│ ──────────────────────────────────────────────────── │

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

│ │
│ ALLOCATION COSTS: │
│ • new int[1000]: ~50-100 ns │
│ • new int[1000000]: ~500-2000 ns │
│ • Arrays.fill(arr, 0): ~0.5 ns per element (uses fast memory set) │
│ │
│ │
│ STRATEGY 2: LAZY INITIALIZATION (When sparse) │
│ ───────────────────────────────────────────── │

```java
// When most values stay at default, don't fill!
int[] dp = new int[n + 1];  // Already all zeros in Java!

// Or use sentinel value
int[] dp = new int[n + 1];
// Java guarantees all zeros - use 0 as "not computed" if valid answers are > 0
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

---

# PART 1: UNDERSTANDING DP FROM SCRATCH

## What is Dynamic Programming?

```

╔══════════════════════════════════════════════════════════════════════════════╗
║ DYNAMIC PROGRAMMING - COMPLETE UNDERSTANDING ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHAT IS DYNAMIC PROGRAMMING? │
├──────────────────────────────────────────────────────────────────────────────┤
│ Dynamic Programming (DP) is a method for solving complex problems by: │
│ 1. Breaking them into simpler OVERLAPPING subproblems │
│ 2. Solving each subproblem ONLY ONCE │
│ 3. STORING the results to avoid redundant computation │
│ │
│ DP = RECURSION + MEMOIZATION (REMEMBERING) │
│ │
│ INVENTOR: Richard Bellman (1950s) at RAND Corporation │
│ NAME ORIGIN: "Dynamic" sounded impressive to government funders! │
│ (Bellman chose it to hide the mathematical nature of his work) │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHAT PROBLEM DOES DP SOLVE? │
├──────────────────────────────────────────────────────────────────────────────┤
│ CORE PROBLEM: Optimization problems where: │
│ • You need the BEST solution (max/min) │
│ • Making decisions at each step │
│ • Decisions affect future choices │
│ │
│ REAL-WORLD EXAMPLES: │
│ • Navigation: What's the shortest route? (Same intersections = subproblems) │
│ • Finance: Max profit from stock trades (Each day = decision point) │
│ • Text: How similar are two strings? (Edit distance) │
│ • Packing: Most value in limited space (Knapsack problem) │
│ • Scheduling: Best order for tasks (Job scheduling) │
│ │
│ THE INSIGHT: │
│ Instead of exploring ALL possible combinations (exponential), DP builds │
│ optimal solutions from optimal sub-solutions (polynomial)! │
│ │
│ BEFORE DP (Brute Force): O(2^n) or worse - trying all combinations │
│ AFTER DP: O(n²) or O(n×m) - building from subproblems │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHY DOES DP WORK? (THE MATHEMATICAL FOUNDATION) │
├──────────────────────────────────────────────────────────────────────────────┤
│ │
│ TWO ESSENTIAL PROPERTIES (Both MUST be true): │
│ │
│ 1. OPTIMAL SUBSTRUCTURE │
│ "Optimal solution to the whole = combination of optimal sub-solutions" │
│ │
│ Example: Shortest Path A→C │
│ If A→B→C is shortest, then: │
│ • A→B part must be the shortest A→B path │
│ • B→C part must be the shortest B→C path │
│ │
│ If this wasn't true, you could find a shorter A→C! │
│ │
│ 2. OVERLAPPING SUBPROBLEMS │
│ "Same subproblems appear multiple times during recursion" │
│ │
│ Example: Fibonacci fib(5) │
│ fib(5) = fib(4) + fib(3) │
│ fib(4) = fib(3) + fib(2) ← fib(3) needed TWICE! │
│ fib(3) = fib(2) + fib(1) ← fib(2) needed THRICE! │
│ │
│ If subproblems DON'T overlap → Use Divide & Conquer instead! │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHEN TO USE DP? (INTERVIEW RECOGNITION PATTERNS) │
├──────────────────────────────────────────────────────────────────────────────┤
│ SIGNAL 1: "Find maximum/minimum..." or "Count the number of ways..." │
│ → Optimization = DP likely │
│ │
│ SIGNAL 2: "Given choices at each step..." │
│ → Decision making with future consequences = DP │
│ │
│ SIGNAL 3: "Can you reach...?" or "Is it possible...?" │
│ → Often can be framed as DP (true/false states) │
│ │
│ SIGNAL 4: Problem involves sequences/grids │
│ → String problems, matrix traversal = Classic DP │
│ │
│ SIGNAL 5: Same question repeated with different parameters │
│ → Recursive structure with overlapping = DP │
│ │
│ ┌────────────────────────────────┬─────────────────────────────────────────┐│
│ │ USE DP WHEN │ DON'T USE DP WHEN ││
│ ├────────────────────────────────┼─────────────────────────────────────────┤│
│ │ Need optimal solution │ Just need any valid solution ││
│ │ Subproblems overlap │ Subproblems independent (use D&C) ││
│ │ Problem has optimal structure │ Local choices don't build global optimal││
│ │ Can define clear state │ State space is too large ││
│ └────────────────────────────────┴─────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ HOW DOES DP WORK? (TWO APPROACHES) │
├──────────────────────────────────────────────────────────────────────────────┤
│ │
│ APPROACH 1: TOP-DOWN (MEMOIZATION) │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 1. Start with original problem │ │
│ │ 2. Recursively break into subproblems │ │
│ │ 3. Before computing, check if answer already cached │ │
│ │ 4. If cached: return it | If not: compute and cache │ │
│ │ │ │
│ │ ANALOGY: You're asked a hard question. You think recursively │ │
│ │ but write down answers you've figured out on a notepad. │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ │
│ APPROACH 2: BOTTOM-UP (TABULATION) │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 1. Identify base cases (smallest subproblems) │ │
│ │ 2. Fill table starting from base cases │ │
│ │ 3. Build up to the answer iteratively │ │
│ │ 4. Final cell contains the answer │ │
│ │ │ │
│ │ ANALOGY: Building a pyramid brick by brick from the bottom. │ │
│ │ Each brick relies on the ones below it. │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ │
│ COMPARISON: │
│ ┌───────────────────────┬───────────────────────────────────────┐ │
│ │ Top-Down (Memo) │ Bottom-Up (Tabulation) │ │
│ ├───────────────────────┼───────────────────────────────────────┤ │
│ │ Easier to write │ Usually faster (no recursion) │ │
│ │ Only solves needed │ Solves ALL subproblems │ │
│ │ Risk of stack overflow│ No stack overflow │ │
│ │ Lazy evaluation │ Eager evaluation │ │
│ └───────────────────────┴───────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ DIFFICULTIES & COMMON PITFALLS │
├──────────────────────────────────────────────────────────────────────────────┤
│ 1. IDENTIFYING THE STATE (Hardest Part!): │
│ "What information do I need to solve a subproblem?" │
│ Wrong state definition = wrong solution │
│ Tip: Ask "What changes between recursive calls?" │
│ │
│ 2. FINDING THE RECURRENCE: │
│ "How does current state relate to previous states?" │
│ Tip: Think about the LAST decision/step │
│ │
│ 3. BASE CASE ERRORS: │
│ Missing or wrong base cases cause wrong answers │
│ Tip: What's the smallest problem you can answer directly? │
│ │
│ 4. OFF-BY-ONE ERRORS: │
│ Array indices, loop bounds - classic source of bugs │
│ Tip: Trace through small examples by hand │
│ │
│ 5. SPACE COMPLEXITY: │
│ 2D DP tables can be huge for large inputs │
│ Tip: Often can optimize to 1D by keeping only previous row │
│ │
│ 6. RECONSTRUCTION PATH: │
│ DP gives optimal VALUE, but sometimes you need the actual SOLUTION │
│ Tip: Store "choice made" at each step, then backtrack │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ EXPECTED OUTPUTS & COMPLEXITY │
├──────────────────────────────────────────────────────────────────────────────┤
│ │
│ COMPLEXITY IMPROVEMENT (Why DP is Powerful): │
│ ┌──────────────────────┬─────────────────────┬────────────────────────────┐ │
│ │ Problem │ Brute Force │ With DP │ │
│ ├──────────────────────┼─────────────────────┼────────────────────────────┤ │
│ │ Fibonacci │ O(2^n) │ O(n) │ │
│ │ Longest Common Subseq│ O(2^(m+n)) │ O(m×n) │ │
│ │ 0/1 Knapsack │ O(2^n) │ O(n×W) │ │
│ │ Edit Distance │ O(3^n) │ O(m×n) │ │
│ │ Matrix Chain │ O(n!) │ O(n³) │ │
│ │ Coin Change │ O(amount^n) │ O(n×amount) │ │
│ └──────────────────────┴─────────────────────┴────────────────────────────┘ │
│ │
│ TYPICAL DP OUTPUT: │
│ • Single number: Max profit, min cost, number of ways │
│ • Boolean: Is it possible? │
│ • Array/Table: All subproblem solutions (for path reconstruction) │
│ • The actual solution: Requires backtracking through DP table │
│ │
│ SPACE-TIME TRADEOFF: │
│ • Standard 2D DP: O(n×m) time, O(n×m) space │
│ • Space-optimized: O(n×m) time, O(min(n,m)) space (keep 2 rows) │
│ • Ultra-optimized: Sometimes O(1) space possible (like Fibonacci) │
└──────────────────────────────────────────────────────────────────────────────┘

```

### The Story Metaphor

```

THE STORY:
Imagine you're solving a maze. Every time you hit a dead end,
you go back to the start and try again.

BRUTE FORCE:

- Start → try path A → dead end → go back to start
- Start → try path B → dead end → go back to start
- You keep walking the same initial path!

SMART WAY (DP):

- Start → try path A → dead end → MARK IT
- Go back, but remember "path A = dead end"
- Next time, skip path A directly!

THIS IS MEMOIZATION: Remember what you've already calculated.

````

---

# PART 2: FIBONACCI - THE GATEWAY TO DP

## Evolution of Solutions

### Level 1: Pure Recursion (❌ Inefficient)

```java
public int fibRecursive(int n) {
    if (n <= 1) return n;
    return fibRecursive(n - 1) + fibRecursive(n - 2);
}

// TIME: O(2^n) - Exponential!
// SPACE: O(n) - Call stack

// CALL TREE for fib(5):
//                         fib(5)
//                        /      \
//                   fib(4)      fib(3)
//                   /    \      /    \
//               fib(3)  fib(2) fib(2) fib(1)
//               /   \
//           fib(2) fib(1)
//
// fib(3) computed 2 times
// fib(2) computed 3 times
// WASTEFUL!
````

### Level 2: Memoization - Top Down (✅ Efficient)

```java
public int fibMemo(int n, int[] memo) {
    // Base case
    if (n <= 1) return n;

    // Check if already computed
    if (memo[n] != 0) return memo[n];

    // Compute and STORE
    memo[n] = fibMemo(n - 1, memo) + fibMemo(n - 2, memo);

    return memo[n];
}

// Usage: fibMemo(n, new int[n + 1])
// TIME: O(n) - Each subproblem solved once
// SPACE: O(n) - Memo array + call stack

// CALL TREE with memoization:
//                         fib(5)
//                        /      \
//                   fib(4)      fib(3) ← CACHED! Return immediately
//                   /    \
//               fib(3)  fib(2) ← CACHED!
//               /   \
//           fib(2) fib(1)
//           /   \
//       fib(1) fib(0)
```

### Level 3: Tabulation - Bottom Up (✅✅ Best)

```java
public int fibTabulation(int n) {
    if (n <= 1) return n;

    int[] dp = new int[n + 1];
    dp[0] = 0;
    dp[1] = 1;

    // Build from smallest to largest
    for (int i = 2; i <= n; i++) {
        dp[i] = dp[i - 1] + dp[i - 2];
    }

    return dp[n];
}

// TIME: O(n)
// SPACE: O(n)

// TRACE for n = 5:
// dp[0] = 0
// dp[1] = 1
// dp[2] = dp[1] + dp[0] = 1 + 0 = 1
// dp[3] = dp[2] + dp[1] = 1 + 1 = 2
// dp[4] = dp[3] + dp[2] = 2 + 1 = 3
// dp[5] = dp[4] + dp[3] = 3 + 2 = 5
```

### Level 4: Space Optimized (✅✅✅ Perfect)

```java
public int fibOptimized(int n) {
    if (n <= 1) return n;

    int prev2 = 0;  // dp[i-2]
    int prev1 = 1;  // dp[i-1]

    for (int i = 2; i <= n; i++) {
        int current = prev1 + prev2;
        prev2 = prev1;
        prev1 = current;
    }

    return prev1;
}

// TIME: O(n)
// SPACE: O(1) - Only 2 variables!

// INSIGHT: We only need last 2 values, not entire array!
```

---

# PART 3: THE DP RECIPE

## 5-Step Process

```
STEP 1: IDENTIFY SUBPROBLEM
        "What is the last decision/action?"
        "What information do I need at each step?"

STEP 2: DEFINE STATE
        dp[i] = "answer for subproblem of size i"
        dp[i][j] = "answer considering first i items with capacity j"

STEP 3: FIND RECURRENCE RELATION
        "How does dp[i] relate to smaller subproblems?"
        dp[i] = some_function(dp[i-1], dp[i-2], ...)

STEP 4: IDENTIFY BASE CASES
        "What are the smallest subproblems I know directly?"
        dp[0] = ?, dp[1] = ?

STEP 5: DETERMINE COMPUTATION ORDER
        "In what order should I fill the table?"
        Usually: smaller to larger
```

---

# PART 4: CLASSIC DP PROBLEMS WITH TRACES

## Problem 1: Climbing Stairs

```java
// You can climb 1 or 2 stairs at a time.
// How many ways to reach step n?

// STEP 1: Last action? Either climb 1 step OR 2 steps
// STEP 2: dp[i] = number of ways to reach step i
// STEP 3: dp[i] = dp[i-1] + dp[i-2]
//         (ways to reach i = ways via i-1 + ways via i-2)
// STEP 4: dp[1] = 1, dp[2] = 2
// STEP 5: Fill from 3 to n

public int climbStairs(int n) {
    if (n <= 2) return n;

    int[] dp = new int[n + 1];
    dp[1] = 1;  // 1 way to reach step 1
    dp[2] = 2;  // 2 ways to reach step 2: (1+1) or (2)

    for (int i = 3; i <= n; i++) {
        dp[i] = dp[i - 1] + dp[i - 2];
    }

    return dp[n];
}

// TRACE for n = 5:
// dp[1] = 1    (just step 1)
// dp[2] = 2    (1+1 or 2)
// dp[3] = dp[2] + dp[1] = 2 + 1 = 3    (1+1+1, 1+2, 2+1)
// dp[4] = dp[3] + dp[2] = 3 + 2 = 5
// dp[5] = dp[4] + dp[3] = 5 + 3 = 8
//
// WHY does dp[3] = dp[2] + dp[1]?
// To reach step 3:
//   - Be at step 2, take 1 step → dp[2] ways
//   - Be at step 1, take 2 steps → dp[1] ways
//   Total = dp[2] + dp[1]
```

## Problem 2: House Robber

```java
// Can't rob adjacent houses. Maximize total.
// houses = [2, 7, 9, 3, 1]

// STEP 1: For house i, either rob it OR skip it
// STEP 2: dp[i] = max money robbing houses 0 to i
// STEP 3: dp[i] = max(dp[i-1], dp[i-2] + houses[i])
//         Either skip house i (dp[i-1]) OR rob i (dp[i-2] + houses[i])
// STEP 4: dp[0] = houses[0], dp[1] = max(houses[0], houses[1])
// STEP 5: Fill from 2 to n-1

public int rob(int[] houses) {
    if (houses.length == 0) return 0;
    if (houses.length == 1) return houses[0];

    int[] dp = new int[houses.length];
    dp[0] = houses[0];
    dp[1] = Math.max(houses[0], houses[1]);

    for (int i = 2; i < houses.length; i++) {
        dp[i] = Math.max(dp[i - 1], dp[i - 2] + houses[i]);
    }

    return dp[houses.length - 1];
}

// TRACE for houses = [2, 7, 9, 3, 1]:
// dp[0] = 2
// dp[1] = max(2, 7) = 7
// dp[2] = max(dp[1], dp[0] + 9) = max(7, 2+9) = 11  [rob houses 0, 2]
// dp[3] = max(dp[2], dp[1] + 3) = max(11, 7+3) = 11 [still best: houses 0, 2]
// dp[4] = max(dp[3], dp[2] + 1) = max(11, 11+1) = 12 [rob houses 0, 2, 4]
//
// Answer: 12 (rob houses at indices 0, 2, 4 → values 2, 9, 1)
```

## Problem 3: Coin Change

```java
// coins = [1, 2, 5], amount = 11
// Find minimum coins needed

// STEP 1: Last coin used could be any of the coins
// STEP 2: dp[i] = min coins to make amount i
// STEP 3: dp[i] = min(dp[i - coin] + 1) for each coin
// STEP 4: dp[0] = 0 (0 coins for amount 0)
// STEP 5: Fill from 1 to amount

public int coinChange(int[] coins, int amount) {
    int[] dp = new int[amount + 1];
    Arrays.fill(dp, amount + 1);  // "infinity"
    dp[0] = 0;

    for (int i = 1; i <= amount; i++) {
        for (int coin : coins) {
            if (coin <= i) {
                dp[i] = Math.min(dp[i], dp[i - coin] + 1);
            }
        }
    }

    return dp[amount] > amount ? -1 : dp[amount];
}

// TRACE for coins = [1, 2, 5], amount = 11:
// dp[0] = 0
// dp[1] = min(dp[0]+1) = 1                    [1]
// dp[2] = min(dp[1]+1, dp[0]+1) = min(2, 1) = 1    [2]
// dp[3] = min(dp[2]+1, dp[1]+1) = min(2, 2) = 2    [2,1] or [1,1,1]
// dp[4] = min(dp[3]+1, dp[2]+1) = min(3, 2) = 2    [2,2]
// dp[5] = min(dp[4]+1, dp[3]+1, dp[0]+1) = min(3, 3, 1) = 1    [5]
// dp[6] = min(dp[5]+1, dp[4]+1, dp[1]+1) = min(2, 3, 2) = 2    [5,1]
// ...
// dp[11] = 3    [5, 5, 1]
```

## Problem 4: Longest Increasing Subsequence (LIS)

```java
// nums = [10, 9, 2, 5, 3, 7, 101, 18]
// Find length of longest strictly increasing subsequence

// STEP 1: For each element, either include it or not
// STEP 2: dp[i] = length of LIS ending at index i
// STEP 3: dp[i] = max(dp[j] + 1) for all j < i where nums[j] < nums[i]
// STEP 4: dp[i] = 1 for all (each element is LIS of length 1)
// STEP 5: Fill from 0 to n-1, track maximum

public int lengthOfLIS(int[] nums) {
    int n = nums.length;
    int[] dp = new int[n];
    Arrays.fill(dp, 1);  // Each element is LIS of length 1
    int maxLen = 1;

    for (int i = 1; i < n; i++) {
        for (int j = 0; j < i; j++) {
            if (nums[j] < nums[i]) {
                dp[i] = Math.max(dp[i], dp[j] + 1);
            }
        }
        maxLen = Math.max(maxLen, dp[i]);
    }

    return maxLen;
}

// TRACE for nums = [10, 9, 2, 5, 3, 7, 101, 18]:
// Index:  0   1  2  3  4  5   6    7
// nums = [10, 9, 2, 5, 3, 7, 101, 18]
//
// dp[0] = 1 (just 10)
// dp[1] = 1 (9, can't extend from 10)
// dp[2] = 1 (2, can't extend)
// dp[3] = max(dp[2]+1) = 2 (2 < 5, so LIS: [2,5])
// dp[4] = max(dp[2]+1) = 2 (2 < 3, LIS: [2,3])
// dp[5] = max(dp[2]+1, dp[3]+1, dp[4]+1) = max(2, 3, 3) = 3
//         LIS options: [2,5,7] or [2,3,7]
// dp[6] = max(dp[0]+1, ..., dp[5]+1) = 4 (LIS: [2,5,7,101])
// dp[7] = 4 (LIS: [2,5,7,18])
//
// Answer: 4
```

---

# PART 5: 2D DYNAMIC PROGRAMMING

## Problem 5: Unique Paths

```java
// Grid of m x n. How many ways from top-left to bottom-right?
// Can only move right or down.

// STEP 2: dp[i][j] = number of ways to reach cell (i, j)
// STEP 3: dp[i][j] = dp[i-1][j] + dp[i][j-1]
// STEP 4: dp[0][j] = 1, dp[i][0] = 1 (only one way to reach first row/col)

public int uniquePaths(int m, int n) {
    int[][] dp = new int[m][n];

    // Base cases: first row and first column
    for (int j = 0; j < n; j++) dp[0][j] = 1;
    for (int i = 0; i < m; i++) dp[i][0] = 1;

    // Fill the rest
    for (int i = 1; i < m; i++) {
        for (int j = 1; j < n; j++) {
            dp[i][j] = dp[i - 1][j] + dp[i][j - 1];
        }
    }

    return dp[m - 1][n - 1];
}

// TRACE for m=3, n=3:
// dp table:
// 1  1  1
// 1  2  3
// 1  3  6
//
// dp[1][1] = dp[0][1] + dp[1][0] = 1 + 1 = 2
// dp[1][2] = dp[0][2] + dp[1][1] = 1 + 2 = 3
// dp[2][1] = dp[1][1] + dp[2][0] = 2 + 1 = 3
// dp[2][2] = dp[1][2] + dp[2][1] = 3 + 3 = 6
```

## Problem 6: Longest Common Subsequence (LCS)

```java
// text1 = "abcde", text2 = "ace"
// Find length of longest common subsequence

// STEP 2: dp[i][j] = LCS of text1[0...i-1] and text2[0...j-1]
// STEP 3: If text1[i-1] == text2[j-1]: dp[i][j] = dp[i-1][j-1] + 1
//         Else: dp[i][j] = max(dp[i-1][j], dp[i][j-1])
// STEP 4: dp[0][j] = 0, dp[i][0] = 0 (empty string)

public int longestCommonSubsequence(String text1, String text2) {
    int m = text1.length(), n = text2.length();
    int[][] dp = new int[m + 1][n + 1];

    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (text1.charAt(i - 1) == text2.charAt(j - 1)) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }

    return dp[m][n];
}

// TRACE for text1 = "abcde", text2 = "ace":
//     ""  a  c  e
// ""   0  0  0  0
// a    0  1  1  1
// b    0  1  1  1
// c    0  1  2  2
// d    0  1  2  2
// e    0  1  2  3
//
// Answer: 3 (LCS = "ace")
```

## Problem 7: 0/1 Knapsack

```java
// weights = [1, 2, 3], values = [6, 10, 12], capacity = 5
// Maximize value without exceeding capacity

// STEP 2: dp[i][w] = max value using items 0..i-1 with capacity w
// STEP 3: dp[i][w] = max(
//           dp[i-1][w],                    // Don't take item i-1
//           dp[i-1][w-weight[i-1]] + value[i-1]  // Take item i-1
//         )
// STEP 4: dp[0][w] = 0 (no items)

public int knapsack(int[] weights, int[] values, int capacity) {
    int n = weights.length;
    int[][] dp = new int[n + 1][capacity + 1];

    for (int i = 1; i <= n; i++) {
        for (int w = 0; w <= capacity; w++) {
            // Don't take item i-1
            dp[i][w] = dp[i - 1][w];

            // Take item i-1 (if it fits)
            if (weights[i - 1] <= w) {
                dp[i][w] = Math.max(
                    dp[i][w],
                    dp[i - 1][w - weights[i - 1]] + values[i - 1]
                );
            }
        }
    }

    return dp[n][capacity];
}

// TRACE for weights=[1,2,3], values=[6,10,12], capacity=5:
//       w: 0  1  2  3  4  5
// item 0:  0  0  0  0  0  0
// item 1:  0  6  6  6  6  6   (item 0: w=1, v=6)
// item 2:  0  6 10 16 16 16   (item 1: w=2, v=10)
// item 3:  0  6 10 16 18 22   (item 2: w=3, v=12)
//
// dp[3][5] = 22 (take items 1 and 2: weights 2+3=5, values 10+12=22)
```

---

# PART 6: DP PATTERNS

## Pattern 1: Linear DP

```
dp[i] depends on dp[i-1], dp[i-2], etc.
Examples: Fibonacci, House Robber, Climbing Stairs

STATE: Single index
TRANSITION: dp[i] = f(dp[i-1], dp[i-2], ...)
```

## Pattern 2: Grid DP

```
dp[i][j] depends on dp[i-1][j], dp[i][j-1], dp[i-1][j-1]
Examples: Unique Paths, Min Path Sum, Edit Distance

STATE: Two indices (row, column)
TRANSITION: dp[i][j] = f(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])
```

## Pattern 3: String DP

```
dp[i][j] for two strings s1[0..i], s2[0..j]
Examples: LCS, Edit Distance, Regex Matching

STATE: Indices into both strings
TRANSITION: Based on character match/mismatch
```

## Pattern 4: Knapsack DP

```
dp[i][w] for items 0..i with capacity w
Examples: 0/1 Knapsack, Subset Sum, Coin Change

STATE: Item index + remaining capacity
TRANSITION: Take or don't take current item
```

## Pattern 5: Interval DP

```
dp[i][j] for interval [i, j]
Examples: Matrix Chain Multiplication, Burst Balloons

STATE: Start and end of interval
TRANSITION: Try all split points k between i and j
```

---

# PART 7: MEMOIZATION VS TABULATION

```
┌─────────────────────────────────────────────────────────────────┐
│                    MEMOIZATION (Top-Down)                       │
├─────────────────────────────────────────────────────────────────┤
│ Approach:    Recursive with caching                             │
│ Direction:   Start from main problem, recurse to subproblems    │
│ When used:   Only computes needed subproblems                   │
│ Space:       Recursion stack + memo table                       │
│ Pros:        Natural, easy to write, lazy evaluation            │
│ Cons:        Recursion overhead, stack overflow risk            │
├─────────────────────────────────────────────────────────────────┤
│                    TABULATION (Bottom-Up)                       │
├─────────────────────────────────────────────────────────────────┤
│ Approach:    Iterative with table                               │
│ Direction:   Start from base cases, build up to main problem    │
│ When used:   Computes ALL subproblems                           │
│ Space:       Just the table (no stack)                          │
│ Pros:        No recursion overhead, can optimize space          │
│ Cons:        Need to think about computation order              │
└─────────────────────────────────────────────────────────────────┘

WHEN TO USE WHICH?

MEMOIZATION:
- When not all subproblems are needed
- When recursion depth is manageable
- When problem is easier to think recursively

TABULATION:
- When you need all subproblems anyway
- When recursion depth could overflow
- When you want to optimize space (sliding window)
```

---

# PART 8: SPACE OPTIMIZATION

```java
// Many DP problems can be optimized from O(n²) to O(n) space!

// EXAMPLE: LCS can be done with 2 rows instead of full table
public int lcsOptimized(String s1, String s2) {
    int m = s1.length(), n = s2.length();
    int[] prev = new int[n + 1];
    int[] curr = new int[n + 1];

    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (s1.charAt(i - 1) == s2.charAt(j - 1)) {
                curr[j] = prev[j - 1] + 1;
            } else {
                curr[j] = Math.max(prev[j], curr[j - 1]);
            }
        }
        // Swap rows
        int[] temp = prev;
        prev = curr;
        curr = temp;
        Arrays.fill(curr, 0);
    }

    return prev[n];
}

// KEY INSIGHT:
// If dp[i][j] only depends on dp[i-1][...] and dp[i][j-1]
// You only need 2 rows (or even 1 row with careful ordering)!
```

---

# PART 9: PRACTICE PROBLEMS BY PATTERN

## Linear DP

1. Climbing Stairs
2. House Robber
3. Maximum Subarray (Kadane's)
4. Best Time to Buy and Sell Stock
5. Decode Ways

## Grid DP

1. Unique Paths
2. Minimum Path Sum
3. Maximal Square
4. Dungeon Game
5. Cherry Pickup

## String DP

1. Longest Common Subsequence
2. Edit Distance
3. Longest Palindromic Subsequence
4. Regular Expression Matching
5. Wildcard Matching

## Knapsack DP

1. 0/1 Knapsack
2. Coin Change
3. Partition Equal Subset Sum
4. Target Sum
5. Ones and Zeroes

---

# PART 10: EDGE CASES CHECKLIST

```
⬜ Empty input: n = 0, empty array, empty string
⬜ Single element: n = 1, single character
⬜ All same values: [5, 5, 5, 5]
⬜ All zeros: [0, 0, 0, 0]
⬜ Negative values: [-1, -2, -3]
⬜ Large values: near Integer.MAX_VALUE (overflow!)
⬜ No solution exists: return -1 or special value
⬜ Multiple solutions: verify you want min/max/count
```

---

# PART 11: Advanced DP Patterns

## Pattern 1: Digit DP

```
CONCEPT:
Count numbers with certain digit properties in a range [L, R].
Build numbers digit by digit, track constraints.

STATE:
- Position in the number
- Whether we're still bounded by the limit
- Any accumulated properties (sum, count, etc.)
```

```java
// Count numbers from 1 to n with digit sum = k
public class DigitDP {
    private Long[][][] memo;
    private String num;

    public long countNumbersWithDigitSum(int n, int k) {
        num = String.valueOf(n);
        memo = new Long[num.length()][k + 1][2];
        return solve(0, k, true);
    }

    private long solve(int pos, int remaining, boolean tight) {
        // Base case: processed all digits
        if (pos == num.length()) {
            return remaining == 0 ? 1 : 0;
        }

        // Check memo
        int tightIdx = tight ? 1 : 0;
        if (memo[pos][remaining][tightIdx] != null) {
            return memo[pos][remaining][tightIdx];
        }

        // Determine upper limit for this digit
        int limit = tight ? (num.charAt(pos) - '0') : 9;

        long result = 0;
        for (int digit = 0; digit <= limit; digit++) {
            if (digit <= remaining) {
                boolean newTight = tight && (digit == limit);
                result += solve(pos + 1, remaining - digit, newTight);
            }
        }

        memo[pos][remaining][tightIdx] = result;
        return result;
    }
}

// Examples:
// How many numbers in [1, 100] have digit sum = 5?
// Answer: 10 (5, 14, 23, 32, 41, 50, 104... wait, cap at 100)
// Actually: 5, 14, 23, 32, 41, 50 = 6 numbers
```

## Pattern 2: Bitmask DP

```
CONCEPT:
Use bitmask to represent which elements are "used" or "visited".
Each bit represents one element's state.

WHEN TO USE:
- Small n (typically n ≤ 20 due to 2^n states)
- Need to track subset of elements
- Traveling Salesman, Assignment problem
```

```java
// Traveling Salesman Problem (TSP)
public class TSP {
    private int[][] dist;
    private int[][] memo;
    private int n;

    public int findShortestRoute(int[][] distances) {
        this.dist = distances;
        this.n = distances.length;
        this.memo = new int[1 << n][n];

        for (int[] row : memo) Arrays.fill(row, -1);

        // Start from city 0, visit all cities, return to 0
        return solve(1, 0);  // mask=1 means city 0 is visited
    }

    private int solve(int mask, int pos) {
        // All cities visited, return to start
        if (mask == (1 << n) - 1) {
            return dist[pos][0];
        }

        if (memo[mask][pos] != -1) {
            return memo[mask][pos];
        }

        int result = Integer.MAX_VALUE;

        // Try visiting each unvisited city
        for (int next = 0; next < n; next++) {
            if ((mask & (1 << next)) == 0) {  // City not visited
                int newMask = mask | (1 << next);
                int cost = dist[pos][next] + solve(newMask, next);
                result = Math.min(result, cost);
            }
        }

        memo[mask][pos] = result;
        return result;
    }
}

// Visual:
// For 4 cities: 0, 1, 2, 3
// mask = 0101 means cities 0 and 2 are visited
// mask = 1111 means all cities visited
```

```java
// Minimum cost to assign n workers to n jobs
public class AssignmentProblem {
    private int[][] cost;
    private int[] memo;
    private int n;

    public int minCostAssignment(int[][] cost) {
        this.cost = cost;
        this.n = cost.length;
        this.memo = new int[1 << n];
        Arrays.fill(memo, -1);

        return solve(0, 0);
    }

    // worker = which worker we're assigning
    // mask = which jobs are taken
    private int solve(int worker, int mask) {
        if (worker == n) return 0;  // All workers assigned

        if (memo[mask] != -1) return memo[mask];

        int result = Integer.MAX_VALUE;
        for (int job = 0; job < n; job++) {
            if ((mask & (1 << job)) == 0) {  // Job not taken
                int newMask = mask | (1 << job);
                int total = cost[worker][job] + solve(worker + 1, newMask);
                result = Math.min(result, total);
            }
        }

        memo[mask] = result;
        return result;
    }
}
```

## Pattern 3: Interval DP

```
CONCEPT:
Solve problems on intervals/subarrays by considering all ways
to split the interval and combining results.

RECURRENCE:
dp[i][j] = optimal value for interval [i, j]
         = combine(dp[i][k], dp[k+1][j]) for all k in [i, j)
```

```java
// Matrix Chain Multiplication
public class MatrixChainMultiplication {
    public int minMultiplications(int[] dims) {
        // dims = [d0, d1, d2, ..., dn]
        // Matrix i has dimensions dims[i-1] x dims[i]
        int n = dims.length - 1;  // Number of matrices
        int[][] dp = new int[n][n];

        // Length of chain
        for (int len = 2; len <= n; len++) {
            for (int i = 0; i <= n - len; i++) {
                int j = i + len - 1;
                dp[i][j] = Integer.MAX_VALUE;

                // Try all split points
                for (int k = i; k < j; k++) {
                    // Cost = left chain + right chain + multiplication
                    int cost = dp[i][k] + dp[k + 1][j] +
                               dims[i] * dims[k + 1] * dims[j + 1];
                    dp[i][j] = Math.min(dp[i][j], cost);
                }
            }
        }

        return dp[0][n - 1];
    }
}

// Example: dims = [10, 30, 5, 60]
// Matrices: A (10x30), B (30x5), C (5x60)
// (A*B)*C = 10*30*5 + 10*5*60 = 1500 + 3000 = 4500
// A*(B*C) = 30*5*60 + 10*30*60 = 9000 + 18000 = 27000
// Optimal: 4500
```

```java
// Burst Balloons (LeetCode 312)
public int maxCoins(int[] nums) {
    int n = nums.length;
    // Add 1 at boundaries
    int[] arr = new int[n + 2];
    arr[0] = arr[n + 1] = 1;
    for (int i = 0; i < n; i++) {
        arr[i + 1] = nums[i];
    }

    int[][] dp = new int[n + 2][n + 2];

    // len = length of interval
    for (int len = 1; len <= n; len++) {
        for (int left = 1; left <= n - len + 1; left++) {
            int right = left + len - 1;

            // Try bursting each balloon last in this interval
            for (int last = left; last <= right; last++) {
                int coins = arr[left - 1] * arr[last] * arr[right + 1];
                coins += dp[left][last - 1] + dp[last + 1][right];
                dp[left][right] = Math.max(dp[left][right], coins);
            }
        }
    }

    return dp[1][n];
}
```

## Pattern 4: Tree DP

```
CONCEPT:
DP on tree structures. Usually compute answers for subtrees
and combine at each node.

COMMON PATTERNS:
- dp[node] = something about subtree rooted at node
- dp[node][0/1] = with/without including this node
```

```java
// House Robber III - Rob houses on a tree (can't rob adjacent)
public class TreeDP {
    public int rob(TreeNode root) {
        int[] result = robSub(root);
        return Math.max(result[0], result[1]);
    }

    // Returns [max if not robbing this node, max if robbing this node]
    private int[] robSub(TreeNode node) {
        if (node == null) return new int[]{0, 0};

        int[] left = robSub(node.left);
        int[] right = robSub(node.right);

        // If not robbing this node, children can be robbed or not
        int notRob = Math.max(left[0], left[1]) + Math.max(right[0], right[1]);

        // If robbing this node, children cannot be robbed
        int rob = node.val + left[0] + right[0];

        return new int[]{notRob, rob};
    }
}

// Binary Tree Maximum Path Sum
public int maxPathSum(TreeNode root) {
    int[] maxSum = {Integer.MIN_VALUE};
    maxPath(root, maxSum);
    return maxSum[0];
}

private int maxPath(TreeNode node, int[] maxSum) {
    if (node == null) return 0;

    // Max sum of path going through left/right child
    int leftMax = Math.max(0, maxPath(node.left, maxSum));
    int rightMax = Math.max(0, maxPath(node.right, maxSum));

    // Max path passing through this node
    int pathThrough = node.val + leftMax + rightMax;
    maxSum[0] = Math.max(maxSum[0], pathThrough);

    // Return max path starting at this node and going down
    return node.val + Math.max(leftMax, rightMax);
}
```

## Pattern 5: DP with Monotonic Optimization

```
CONCEPT:
Use monotonic data structures to optimize DP transitions.
Reduces O(n²) to O(n) or O(n log n).
```

```java
// Sliding Window Maximum approach in DP
// dp[i] = max(dp[j] + cost[j]) for j in [i-k, i-1]
public int[] dpWithDeque(int[] arr, int k) {
    int n = arr.length;
    int[] dp = new int[n];
    Deque<Integer> deque = new ArrayDeque<>();

    for (int i = 0; i < n; i++) {
        // Remove elements outside window
        while (!deque.isEmpty() && deque.peekFirst() < i - k) {
            deque.pollFirst();
        }

        // Current dp value uses best in window
        if (!deque.isEmpty()) {
            dp[i] = dp[deque.peekFirst()] + arr[i];
        } else {
            dp[i] = arr[i];
        }

        // Maintain monotonic decreasing
        while (!deque.isEmpty() && dp[deque.peekLast()] <= dp[i]) {
            deque.pollLast();
        }
        deque.addLast(i);
    }

    return dp;
}
```

---

# PART 12: Complete DP Problem Solutions

## Problem 1: Longest Increasing Subsequence with Path

```java
public class LIS {
    public List<Integer> longestIncreasingSubsequence(int[] nums) {
        int n = nums.length;
        if (n == 0) return new ArrayList<>();

        int[] dp = new int[n];
        int[] parent = new int[n];
        Arrays.fill(dp, 1);
        Arrays.fill(parent, -1);

        int maxLen = 1, maxIdx = 0;

        for (int i = 1; i < n; i++) {
            for (int j = 0; j < i; j++) {
                if (nums[j] < nums[i] && dp[j] + 1 > dp[i]) {
                    dp[i] = dp[j] + 1;
                    parent[i] = j;
                }
            }
            if (dp[i] > maxLen) {
                maxLen = dp[i];
                maxIdx = i;
            }
        }

        // Reconstruct path
        List<Integer> path = new ArrayList<>();
        int idx = maxIdx;
        while (idx != -1) {
            path.add(nums[idx]);
            idx = parent[idx];
        }
        Collections.reverse(path);

        return path;
    }

    // O(n log n) solution using binary search
    public int lisOptimized(int[] nums) {
        List<Integer> tails = new ArrayList<>();

        for (int num : nums) {
            int pos = Collections.binarySearch(tails, num);
            if (pos < 0) pos = -(pos + 1);

            if (pos == tails.size()) {
                tails.add(num);
            } else {
                tails.set(pos, num);
            }
        }

        return tails.size();
    }
}
```

## Problem 2: Edit Distance with Operations

```java
public class EditDistance {
    public String[] minEditOperations(String word1, String word2) {
        int m = word1.length(), n = word2.length();
        int[][] dp = new int[m + 1][n + 1];

        // Base cases
        for (int i = 0; i <= m; i++) dp[i][0] = i;
        for (int j = 0; j <= n; j++) dp[0][j] = j;

        // Fill DP table
        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                if (word1.charAt(i - 1) == word2.charAt(j - 1)) {
                    dp[i][j] = dp[i - 1][j - 1];
                } else {
                    dp[i][j] = 1 + Math.min(dp[i - 1][j - 1],
                                   Math.min(dp[i - 1][j], dp[i][j - 1]));
                }
            }
        }

        // Backtrack to find operations
        List<String> ops = new ArrayList<>();
        int i = m, j = n;

        while (i > 0 || j > 0) {
            if (i > 0 && j > 0 &&
                word1.charAt(i - 1) == word2.charAt(j - 1)) {
                i--; j--;
            } else if (i > 0 && j > 0 &&
                       dp[i][j] == dp[i - 1][j - 1] + 1) {
                ops.add("Replace '" + word1.charAt(i - 1) +
                        "' with '" + word2.charAt(j - 1) + "' at position " + i);
                i--; j--;
            } else if (j > 0 && dp[i][j] == dp[i][j - 1] + 1) {
                ops.add("Insert '" + word2.charAt(j - 1) +
                        "' at position " + (i + 1));
                j--;
            } else {
                ops.add("Delete '" + word1.charAt(i - 1) +
                        "' at position " + i);
                i--;
            }
        }

        Collections.reverse(ops);
        return ops.toArray(new String[0]);
    }
}
```

## Problem 3: Word Break II (All Possible Sentences)

```java
public class WordBreak {
    public List<String> wordBreak(String s, List<String> wordDict) {
        Set<String> dict = new HashSet<>(wordDict);
        Map<Integer, List<String>> memo = new HashMap<>();
        return dfs(s, 0, dict, memo);
    }

    private List<String> dfs(String s, int start, Set<String> dict,
                             Map<Integer, List<String>> memo) {
        if (memo.containsKey(start)) {
            return memo.get(start);
        }

        List<String> result = new ArrayList<>();

        if (start == s.length()) {
            result.add("");
            return result;
        }

        for (int end = start + 1; end <= s.length(); end++) {
            String word = s.substring(start, end);
            if (dict.contains(word)) {
                List<String> sublist = dfs(s, end, dict, memo);
                for (String sub : sublist) {
                    result.add(word + (sub.isEmpty() ? "" : " " + sub));
                }
            }
        }

        memo.put(start, result);
        return result;
    }
}

// Example: s = "catsanddog", dict = ["cat", "cats", "and", "sand", "dog"]
// Output: ["cats and dog", "cat sand dog"]
```

## Problem 4: Palindrome Partitioning with Minimum Cuts

```java
public class PalindromePartition {
    public int minCut(String s) {
        int n = s.length();

        // isPalin[i][j] = true if s[i..j] is palindrome
        boolean[][] isPalin = new boolean[n][n];
        for (int i = n - 1; i >= 0; i--) {
            for (int j = i; j < n; j++) {
                if (s.charAt(i) == s.charAt(j) &&
                    (j - i <= 2 || isPalin[i + 1][j - 1])) {
                    isPalin[i][j] = true;
                }
            }
        }

        // dp[i] = min cuts needed for s[0..i-1]
        int[] dp = new int[n + 1];
        Arrays.fill(dp, Integer.MAX_VALUE);
        dp[0] = -1;  // Empty string needs -1 cuts (so first palindrome has 0 cuts)

        for (int i = 1; i <= n; i++) {
            for (int j = 0; j < i; j++) {
                if (isPalin[j][i - 1]) {
                    dp[i] = Math.min(dp[i], dp[j] + 1);
                }
            }
        }

        return dp[n];
    }

    // Get all palindrome partitions
    public List<List<String>> partition(String s) {
        List<List<String>> result = new ArrayList<>();
        backtrack(s, 0, new ArrayList<>(), result);
        return result;
    }

    private void backtrack(String s, int start, List<String> path,
                           List<List<String>> result) {
        if (start == s.length()) {
            result.add(new ArrayList<>(path));
            return;
        }

        for (int end = start + 1; end <= s.length(); end++) {
            String sub = s.substring(start, end);
            if (isPalindrome(sub)) {
                path.add(sub);
                backtrack(s, end, path, result);
                path.remove(path.size() - 1);
            }
        }
    }

    private boolean isPalindrome(String s) {
        int l = 0, r = s.length() - 1;
        while (l < r) {
            if (s.charAt(l++) != s.charAt(r--)) return false;
        }
        return true;
    }
}
```

## Problem 5: Best Time to Buy and Sell Stock (All Variants)

```java
public class StockProblems {

    // I: One transaction
    public int maxProfit1(int[] prices) {
        int minPrice = Integer.MAX_VALUE;
        int maxProfit = 0;

        for (int price : prices) {
            minPrice = Math.min(minPrice, price);
            maxProfit = Math.max(maxProfit, price - minPrice);
        }

        return maxProfit;
    }

    // II: Unlimited transactions
    public int maxProfit2(int[] prices) {
        int profit = 0;
        for (int i = 1; i < prices.length; i++) {
            if (prices[i] > prices[i - 1]) {
                profit += prices[i] - prices[i - 1];
            }
        }
        return profit;
    }

    // III: At most 2 transactions
    public int maxProfit3(int[] prices) {
        int buy1 = Integer.MIN_VALUE, sell1 = 0;
        int buy2 = Integer.MIN_VALUE, sell2 = 0;

        for (int price : prices) {
            buy1 = Math.max(buy1, -price);
            sell1 = Math.max(sell1, buy1 + price);
            buy2 = Math.max(buy2, sell1 - price);
            sell2 = Math.max(sell2, buy2 + price);
        }

        return sell2;
    }

    // IV: At most k transactions
    public int maxProfit4(int k, int[] prices) {
        int n = prices.length;
        if (n == 0) return 0;

        if (k >= n / 2) return maxProfit2(prices);

        // dp[t][d] = max profit using at most t transactions up to day d
        int[][] dp = new int[k + 1][n];

        for (int t = 1; t <= k; t++) {
            int maxDiff = -prices[0];
            for (int d = 1; d < n; d++) {
                dp[t][d] = Math.max(dp[t][d - 1], prices[d] + maxDiff);
                maxDiff = Math.max(maxDiff, dp[t - 1][d] - prices[d]);
            }
        }

        return dp[k][n - 1];
    }

    // With cooldown (must wait 1 day after selling)
    public int maxProfitCooldown(int[] prices) {
        int sold = 0, held = Integer.MIN_VALUE, rest = 0;

        for (int price : prices) {
            int prevSold = sold;
            sold = held + price;
            held = Math.max(held, rest - price);
            rest = Math.max(rest, prevSold);
        }

        return Math.max(sold, rest);
    }

    // With transaction fee
    public int maxProfitWithFee(int[] prices, int fee) {
        int cash = 0, hold = -prices[0];

        for (int i = 1; i < prices.length; i++) {
            cash = Math.max(cash, hold + prices[i] - fee);
            hold = Math.max(hold, cash - prices[i]);
        }

        return cash;
    }
}
```

---

# PART 13: DP State Design Principles

## How to Identify DP State

```
STEP 1: What are the "decisions" at each step?
        - Include/exclude an item
        - Move right/down in grid
        - Match/skip a character

STEP 2: What information do I need to make the decision?
        - Current position (index)
        - Remaining capacity (knapsack)
        - Previous state (house robber)
        - Constraints (transactions left)

STEP 3: What do I want to compute?
        - Maximum/minimum value
        - Count of ways
        - Existence (boolean)

COMBINE INTO STATE:
dp[i][remaining_capacity] = max value considering items 0..i
dp[i][j] = ways to reach cell (i,j)
dp[i][k] = max profit with at most k transactions up to day i
```

## State Reduction Techniques

```java
// TECHNIQUE 1: Remove redundant dimensions
// Bad: dp[i][j][sum] where sum = prefix sum
// Good: dp[i][j], compute sum from i and j

// TECHNIQUE 2: Rolling array (space optimization)
// If dp[i] only depends on dp[i-1], use 2 arrays
// If dp[i][j] only depends on dp[i-1][...], use 2 rows

// TECHNIQUE 3: State compression
// Instead of visited[n] array, use bitmask integer
// int mask represents which elements are used

// Example: Subset sum with bitmask
public boolean canPartition(int[] nums) {
    int sum = 0;
    for (int n : nums) sum += n;
    if (sum % 2 != 0) return false;

    int target = sum / 2;
    boolean[] dp = new boolean[target + 1];
    dp[0] = true;

    for (int num : nums) {
        // Iterate backwards to avoid using same element twice
        for (int j = target; j >= num; j--) {
            dp[j] = dp[j] || dp[j - num];
        }
    }

    return dp[target];
}
```

---

# PART 14: Common DP Mistakes and How to Avoid Them

```
MISTAKE 1: Wrong base case
- Always think: what's the answer for the smallest input?
- Empty string? 0 elements? 0 capacity?

MISTAKE 2: Wrong transition direction
- For tabulation, process in order so subproblems are solved first
- For 0/1 knapsack: iterate backwards when using 1D array

MISTAKE 3: Integer overflow
- Use long when values can exceed Integer.MAX_VALUE
- Especially in counting problems with modulo

MISTAKE 4: Off-by-one errors
- 0-indexed vs 1-indexed
- Length vs index
- Inclusive vs exclusive ranges

MISTAKE 5: Not considering all cases
- What if no solution exists? Return -1 or MAX_VALUE?
- What if multiple solutions? Need all or just one?

MISTAKE 6: Redundant states
- Check if a dimension in your state is truly necessary
- Can it be computed from other dimensions?
```

---

# 🚀 PART FINAL: ADVANCED DP PATTERNS & TECHNIQUES

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║          ADVANCED DYNAMIC PROGRAMMING - COMPETITIVE PROGRAMMING LEVEL            ║
╠══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                   ║
║  This section covers advanced DP patterns used in:                               ║
║  • Competitive programming (Codeforces, ICPC, IOI)                              ║
║  • Technical interviews at top companies                                         ║
║  • Real-world optimization problems                                              ║
║                                                                                   ║
╚══════════════════════════════════════════════════════════════════════════════════╝
```

## DIGIT DP - COUNTING NUMBERS WITH PROPERTIES

````
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    DIGIT DP - THE PATTERN                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  PROBLEM TYPE: Count numbers in range [L, R] with some digit property          │
│  Examples:                                                                       │
│  • Count numbers with digit sum = K                                             │
│  • Count numbers without repeated digits                                        │
│  • Count numbers divisible by D                                                 │
│                                                                                  │
│  KEY IDEA: Build number digit by digit, tracking:                              │
│  • Position (which digit we're placing)                                        │
│  • Tight bound (are we still bounded by limit?)                                │
│  • Problem-specific state (sum, remainder, etc.)                               │
│                                                                                  │
│                                                                                  │
│  TEMPLATE:                                                                       │
│  ───────────                                                                    │
```java
// Count numbers from 0 to N with digit sum = targetSum
Long[][] memo;  // [position][sum][tight]

long countDigitSum(String N, int targetSum) {
    memo = new Long[N.length()][targetSum + 1][2];
    return solve(N, 0, 0, true, targetSum);
}

long solve(String N, int pos, int sum, boolean tight, int target) {
    // Base case: processed all digits
    if (pos == N.length()) {
        return sum == target ? 1 : 0;
    }

    // Memoization check
    int t = tight ? 1 : 0;
    if (memo[pos][sum][t] != null) return memo[pos][sum][t];

    // Determine upper limit for current digit
    int limit = tight ? (N.charAt(pos) - '0') : 9;

    long result = 0;
    for (int digit = 0; digit <= limit; digit++) {
        result += solve(N, pos + 1, sum + digit,
                       tight && (digit == limit), target);
    }

    return memo[pos][sum][t] = result;
}

// For range [L, R]: answer = count(R) - count(L-1)
````

│ │
│ │
│ EXAMPLE: Count numbers 1 to N with no repeated adjacent digits │
│ ───────────────────────────────────────────────────────────── │

```java
Long[][][] memo;  // [pos][prevDigit][tight]

long countNoRepeated(String N) {
    memo = new Long[N.length()][10][2];
    return solve(N, 0, -1, true);  // -1 means no previous digit
}

long solve(String N, int pos, int prev, boolean tight) {
    if (pos == N.length()) return 1;  // Valid number

    int t = tight ? 1 : 0;
    int p = prev + 1;  // Shift to use as array index
    if (memo[pos][p][t] != null) return memo[pos][p][t];

    int limit = tight ? (N.charAt(pos) - '0') : 9;

    long result = 0;
    for (int digit = 0; digit <= limit; digit++) {
        if (digit != prev) {  // No adjacent repeats
            result += solve(N, pos + 1, digit, tight && (digit == limit));
        }
    }

    return memo[pos][p][t] = result;
}
```

│ │
└─────────────────────────────────────────────────────────────────────────────────┘

```

## BITMASK DP - SUBSET STATE TRACKING

```

┌─────────────────────────────────────────────────────────────────────────────────┐
│ BITMASK DP - COMPLETE GUIDE │
├─────────────────────────────────────────────────────────────────────────────────┤
│ │
│ WHEN TO USE: Small n (≤ 20), need to track which elements are "used" │
│ │
│ BITMASK OPERATIONS: │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ Operation │ Code │ Example │ │
│ ├────────────────────────────┼─────────────────────┼───────────────────────┤ │
│ │ Check if bit i is set │ (mask >> i) & 1 │ mask=5: bit 0,2 set │ │
│ │ Set bit i │ mask | (1 << i) │ 5|2=7 (set bit 1) │ │
│ │ Clear bit i │ mask & ~(1 << i) │ 7&~2=5 (clear bit 1) │ │
│ │ Toggle bit i │ mask ^ (1 << i) │ 5^4=1 (toggle bit 2) │ │
│ │ Count set bits │ Integer.bitCount() │ bitCount(5)=2 │ │
│ │ Lowest set bit │ mask & (-mask) │ 12&(-12)=4 │ │
│ │ Clear lowest set bit │ mask & (mask-1) │ 12&11=8 │ │
│ │ Check if power of 2 │ (mask & (mask-1))==0│ isPow2(8)=true │ │
│ │ Iterate all subsets of mask│ See code below │ │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│ │
│ │
│ TRAVELING SALESMAN PROBLEM (TSP): │
│ ────────────────────────────────── │

```java
// dp[mask][i] = min cost to visit cities in mask, ending at city i
// Time: O(2^n * n^2), Space: O(2^n * n)
int tsp(int[][] dist) {
    int n = dist.length;
    int[][] dp = new int[1 << n][n];

    // Initialize with infinity
    for (int[] row : dp) Arrays.fill(row, Integer.MAX_VALUE / 2);

    // Base: start at city 0
    dp[1][0] = 0;  // mask=1 means only city 0 visited

    // Process masks in increasing order of bits set
    for (int mask = 1; mask < (1 << n); mask++) {
        for (int last = 0; last < n; last++) {
            if ((mask & (1 << last)) == 0) continue;  // last must be in mask

            // Try all possible previous cities
            int prevMask = mask ^ (1 << last);  // Remove last from mask
            for (int prev = 0; prev < n; prev++) {
                if ((prevMask & (1 << prev)) == 0) continue;
                dp[mask][last] = Math.min(dp[mask][last],
                                         dp[prevMask][prev] + dist[prev][last]);
            }
        }
    }

    // Find minimum: visit all cities and return to 0
    int fullMask = (1 << n) - 1;
    int ans = Integer.MAX_VALUE;
    for (int last = 1; last < n; last++) {
        ans = Math.min(ans, dp[fullMask][last] + dist[last][0]);
    }
    return ans;
}
```

│ │
│ │
│ ITERATING OVER ALL SUBSETS OF A MASK: │
│ ───────────────────────────────────── │

```java
// Iterate all subsets of mask (including empty and mask itself)
for (int subset = mask; subset > 0; subset = (subset - 1) & mask) {
    // Process subset
}
// Don't forget to handle subset = 0 separately if needed

// Example: mask = 5 (binary 101)
// Subsets: 5 (101), 4 (100), 1 (001), 0 (000)
// Loop generates: 5 → 4 → 1 → (stops, handle 0 separately)
```

│ │
│ │
│ ASSIGNMENT PROBLEM (HUNGARIAN ALTERNATIVE): │
│ ─────────────────────────────────────────── │

```java
// Assign n workers to n tasks, minimize total cost
// dp[mask] = min cost when tasks in mask are assigned
int assignmentProblem(int[][] cost) {
    int n = cost.length;
    int[] dp = new int[1 << n];
    Arrays.fill(dp, Integer.MAX_VALUE / 2);
    dp[0] = 0;

    for (int mask = 0; mask < (1 << n); mask++) {
        int worker = Integer.bitCount(mask);  // Current worker
        if (worker >= n) continue;

        for (int task = 0; task < n; task++) {
            if ((mask & (1 << task)) != 0) continue;  // Task already assigned
            int newMask = mask | (1 << task);
            dp[newMask] = Math.min(dp[newMask], dp[mask] + cost[worker][task]);
        }
    }

    return dp[(1 << n) - 1];
}
```

│ │
└─────────────────────────────────────────────────────────────────────────────────┘

```

## INTERVAL DP - OPTIMAL SUBSTRUCTURE ON RANGES

```

┌─────────────────────────────────────────────────────────────────────────────────┐
│ INTERVAL DP - THE PATTERN │
├─────────────────────────────────────────────────────────────────────────────────┤
│ │
│ WHEN TO USE: Optimal solution for range [i,j] depends on smaller ranges │
│ │
│ CLASSIC PROBLEMS: │
│ • Matrix chain multiplication │
│ • Optimal BST │
│ • Palindrome partitioning │
│ • Burst balloons │
│ • Stone game │
│ │
│ │
│ TEMPLATE: │
│ ─────────── │

```java
// dp[i][j] = optimal solution for interval [i, j]
// Process by increasing interval length!

int intervalDP(int[] arr) {
    int n = arr.length;
    int[][] dp = new int[n][n];

    // Base case: intervals of length 1
    for (int i = 0; i < n; i++) {
        dp[i][i] = /* base case value */;
    }

    // Process by increasing length
    for (int len = 2; len <= n; len++) {
        for (int i = 0; i + len - 1 < n; i++) {
            int j = i + len - 1;
            dp[i][j] = /* initialize (often infinity or -infinity) */;

            // Try all split points
            for (int k = i; k < j; k++) {
                dp[i][j] = Math.min(dp[i][j],
                    dp[i][k] + dp[k+1][j] + /* merge cost */);
            }
        }
    }

    return dp[0][n-1];
}
```

│ │
│ │
│ MATRIX CHAIN MULTIPLICATION: │
│ ──────────────────────────── │

```java
// dims[i-1] x dims[i] = dimensions of matrix i (0-indexed)
// Minimize scalar multiplications to compute M0 * M1 * ... * Mn-1
int matrixChain(int[] dims) {
    int n = dims.length - 1;  // n matrices
    int[][] dp = new int[n][n];

    // Base: single matrix, 0 multiplications
    // dp[i][i] = 0 (already initialized)

    for (int len = 2; len <= n; len++) {
        for (int i = 0; i + len - 1 < n; i++) {
            int j = i + len - 1;
            dp[i][j] = Integer.MAX_VALUE;

            for (int k = i; k < j; k++) {
                // Split at k: (M_i...M_k) * (M_k+1...M_j)
                int cost = dp[i][k] + dp[k+1][j]
                         + dims[i] * dims[k+1] * dims[j+1];
                dp[i][j] = Math.min(dp[i][j], cost);
            }
        }
    }

    return dp[0][n-1];
}
```

│ │
│ │
│ BURST BALLOONS (LeetCode 312): │
│ ────────────────────────────── │

```java
// Burst all balloons, maximize coins collected
// coins = nums[left] * nums[i] * nums[right]
int maxCoins(int[] nums) {
    int n = nums.length;
    int[] arr = new int[n + 2];
    arr[0] = arr[n + 1] = 1;  // Add boundary 1s
    for (int i = 0; i < n; i++) arr[i + 1] = nums[i];

    int[][] dp = new int[n + 2][n + 2];
    // dp[i][j] = max coins from bursting all balloons in (i, j) exclusive

    for (int len = 1; len <= n; len++) {
        for (int left = 0; left + len + 1 <= n + 1; left++) {
            int right = left + len + 1;

            // k is the LAST balloon to burst in (left, right)
            for (int k = left + 1; k < right; k++) {
                dp[left][right] = Math.max(dp[left][right],
                    dp[left][k] + dp[k][right] + arr[left] * arr[k] * arr[right]);
            }
        }
    }

    return dp[0][n + 1];
}
// Key insight: Think of k as LAST to burst, not first!
```

│ │
└─────────────────────────────────────────────────────────────────────────────────┘

```

## DP ON TREES

```

┌─────────────────────────────────────────────────────────────────────────────────┐
│ TREE DP - THE PATTERN │
├─────────────────────────────────────────────────────────────────────────────────┤
│ │
│ WHEN TO USE: Compute optimal values on tree structures │
│ │
│ KEY INSIGHT: Process children first (post-order), then compute parent │
│ │
│ │
│ BASIC TREE DP - MAXIMUM INDEPENDENT SET: │
│ ───────────────────────────────────────── │

```java
// Select maximum weight of non-adjacent nodes
// dp[v][0] = max weight not including v
// dp[v][1] = max weight including v

int[][] dp;
List<List<Integer>> adj;

void dfs(int v, int parent) {
    dp[v][0] = 0;
    dp[v][1] = weight[v];

    for (int u : adj.get(v)) {
        if (u == parent) continue;
        dfs(u, v);

        // If v not included, children can be included or not
        dp[v][0] += Math.max(dp[u][0], dp[u][1]);
        // If v included, children cannot be included
        dp[v][1] += dp[u][0];
    }
}

// Answer: Math.max(dp[root][0], dp[root][1])
```

│ │
│ │
│ TREE DIAMETER: │
│ ────────────── │

```java
// Longest path in tree
int diameter = 0;

int dfs(int v, int parent) {
    int max1 = 0, max2 = 0;  // Two longest paths through children

    for (int u : adj.get(v)) {
        if (u == parent) continue;
        int childDepth = dfs(u, v) + 1;

        if (childDepth > max1) {
            max2 = max1;
            max1 = childDepth;
        } else if (childDepth > max2) {
            max2 = childDepth;
        }
    }

    // Diameter through v = max1 + max2
    diameter = Math.max(diameter, max1 + max2);

    return max1;  // Return longest path going down from v
}
```

│ │
│ │
│ REROOTING TECHNIQUE (for all-roots DP): │
│ ───────────────────────────────────────── │

```java
// Compute answer for all possible roots in O(n)
// Example: Sum of distances from each node to all others

long[] dp;      // dp[v] = sum of distances from v (rooted at v)
long[] answer;  // answer[v] = sum of distances from v (any root)
int[] subtree;  // subtree[v] = size of subtree rooted at v

// Step 1: Root at node 0, compute dp[0] and subtree sizes
void dfs1(int v, int parent) {
    subtree[v] = 1;
    dp[v] = 0;

    for (int u : adj.get(v)) {
        if (u == parent) continue;
        dfs1(u, v);
        subtree[v] += subtree[u];
        dp[v] += dp[u] + subtree[u];  // Add distance to all nodes in subtree
    }
}

// Step 2: Reroot - compute answer for all nodes
void dfs2(int v, int parent) {
    answer[v] = dp[v];

    for (int u : adj.get(v)) {
        if (u == parent) continue;

        // Temporarily reroot from v to u
        // Nodes in u's subtree get closer by 1
        // Nodes outside u's subtree get farther by 1
        dp[v] -= dp[u] + subtree[u];
        dp[u] += dp[v] + (n - subtree[u]);

        int oldSubtreeV = subtree[v];
        subtree[v] -= subtree[u];
        subtree[u] = n;

        dfs2(u, v);

        // Restore
        subtree[u] = n - oldSubtreeV + subtree[v];
        subtree[v] = oldSubtreeV;
        dp[u] -= dp[v] + (n - subtree[u]);
        dp[v] += dp[u] + subtree[u];
    }
}
```

│ │
└─────────────────────────────────────────────────────────────────────────────────┘

```

## DP OPTIMIZATIONS - CONVEX HULL TRICK

```

┌─────────────────────────────────────────────────────────────────────────────────┐
│ CONVEX HULL TRICK (CHT) │
├─────────────────────────────────────────────────────────────────────────────────┤
│ │
│ WHEN TO USE: Recurrence of form dp[i] = min(dp[j] + b[j] _ a[i]) for j < i │
│ Reduces O(n²) to O(n) or O(n log n) │
│ │
│ CONDITIONS: │
│ • Slopes b[j] are monotonic │
│ • Query values a[i] are monotonic │
│ • Want minimum (or can convert to minimum) │
│ │
│ │
│ INTUITION: │
│ ─────────── │
│ Each j gives a line: y = b[j] _ x + dp[j] │
│ Query for x = a[i]: find line with minimum y │
│ Maintain lower convex hull of lines │
│ │
│ VISUALIZATION: │
│ y │ │
│ │ ╱ line 3 (b=4) │
│ │ ╱ │
│ │╱ ╱ line 2 (b=2) │
│ │ ╱ │
│ │ ╱ ╱ line 1 (b=1) │
│ │ ╱ ╱ │
│ │ ╱ ╱ │
│ │╱──╱───────────────── x │
│ ╱╲ │
│ ╱ ╲ Convex hull (only these lines can be optimal) │
│ │
│ │
│ IMPLEMENTATION (monotonic slopes and queries): │
│ ───────────────────────────────────────────── │

```java
class ConvexHullTrick {
    Deque<long[]> hull = new ArrayDeque<>();  // [slope, intercept]

    // Is line c always worse than a and b?
    boolean bad(long[] a, long[] b, long[] c) {
        // Check if intersection of (a,c) is left of (a,b)
        return (c[1] - a[1]) * (a[0] - b[0]) <= (b[1] - a[1]) * (a[0] - c[0]);
    }

    void addLine(long slope, long intercept) {
        long[] line = {slope, intercept};
        while (hull.size() >= 2 && bad(hull.get(hull.size()-2), hull.getLast(), line)) {
            hull.removeLast();
        }
        hull.addLast(line);
    }

    long query(long x) {
        // Remove lines that are no longer optimal (for increasing x)
        while (hull.size() >= 2 &&
               eval(hull.getFirst(), x) >= eval(hull.get(1), x)) {
            hull.removeFirst();
        }
        return eval(hull.getFirst(), x);
    }

    long eval(long[] line, long x) {
        return line[0] * x + line[1];
    }
}

// Usage Example: dp[i] = min(dp[j] + b[j] * a[i])
ConvexHullTrick cht = new ConvexHullTrick();
cht.addLine(b[0], dp[0]);

for (int i = 1; i < n; i++) {
    dp[i] = cht.query(a[i]) + /* other terms */;
    cht.addLine(b[i], dp[i]);
}
```

│ │
│ COMPLEXITY: │
│ • Amortized O(1) per addLine and query if both are monotonic │
│ • O(log n) per query with binary search if queries not monotonic │
│ │
└─────────────────────────────────────────────────────────────────────────────────┘

```

## DIVIDE AND CONQUER DP OPTIMIZATION

```

┌─────────────────────────────────────────────────────────────────────────────────┐
│ DIVIDE AND CONQUER DP │
├─────────────────────────────────────────────────────────────────────────────────┤
│ │
│ WHEN TO USE: dp[i][j] = min(dp[i-1][k] + cost(k+1, j)) for k < j │
│ And: optimal k for j₁ ≤ optimal k for j₂ when j₁ < j₂ │
│ (This is the "monotonicity of optimal splits" property) │
│ │
│ Reduces O(n × m × n) to O(n × m × log n) │
│ │
│ │
│ IMPLEMENTATION: │
│ ─────────────── │

```java
// dp[i][j] = optimal value using exactly i partitions ending at j
long[][] dp;
int[][] opt;  // opt[i][j] = optimal split point k for dp[i][j]

void compute(int level, int lo, int hi, int optLo, int optHi) {
    if (lo > hi) return;

    int mid = (lo + hi) / 2;
    int optMid = optLo;
    dp[level][mid] = Long.MAX_VALUE;

    // Find optimal k for mid in range [optLo, min(optHi, mid-1)]
    for (int k = optLo; k <= Math.min(optHi, mid - 1); k++) {
        long val = dp[level - 1][k] + cost(k + 1, mid);
        if (val < dp[level][mid]) {
            dp[level][mid] = val;
            optMid = k;
        }
    }

    // Divide: left half uses optLo..optMid, right half uses optMid..optHi
    compute(level, lo, mid - 1, optLo, optMid);
    compute(level, mid + 1, hi, optMid, optHi);
}

// Call: compute(i, 1, n, 0, n) for each level i
```

│ │
│ │
│ EXAMPLE: Partition array into k subarrays, minimize max sum │
│ ────────────────────────────────────────────────────────── │

```java
long solve(int[] arr, int k) {
    int n = arr.length;
    long[] prefix = new long[n + 1];
    for (int i = 0; i < n; i++) prefix[i + 1] = prefix[i] + arr[i];

    dp = new long[k + 1][n + 1];
    Arrays.fill(dp[0], Long.MAX_VALUE / 2);
    dp[0][0] = 0;

    for (int level = 1; level <= k; level++) {
        compute(level, 1, n, 0, n - 1);
    }

    return dp[k][n];
}

long cost(int l, int r) {
    return prefix[r] - prefix[l - 1];  // Sum of arr[l-1..r-1]
}
```

│ │
└─────────────────────────────────────────────────────────────────────────────────┘

```

## BROKEN PROFILE DP (PLUG DP)

```

┌─────────────────────────────────────────────────────────────────────────────────┐
│ BROKEN PROFILE DP - GRID TILING │
├─────────────────────────────────────────────────────────────────────────────────┤
│ │
│ WHEN TO USE: Tiling problems on small grids (width ≤ 20) │
│ • Count ways to tile grid with dominoes │
│ • Place non-attacking pieces │
│ • Grid coloring with adjacent constraints │
│ │
│ │
│ CONCEPT: Track "profile" (pattern of filled cells at boundary) │
│ ───────────────────────────────────────────────────────────── │
│ │
│ Grid (3×4): Profile after processing cell (1,2): │
│ ┌───┬───┬───┬───┐ ┌───┬───┬───┬───┐ │
│ │ ✓ │ ✓ │ ✓ │ │ │ ✓ │ ✓ │ ✓ │ │ │
│ ├───┼───┼───┼───┤ ├───┼───╔═══╗───┤ │
│ │ ✓ │ ✓ │▐▌ │ │ ← here │ ✓ │ ✓ ║ ? ║ │ ← profile = mask of '?' │
│ ├───┼───┼───┼───┤ ├───┼───╚═══╝───┤ cells just below boundary │
│ │ │ │ │ │ │ │ │ │ │ │
│ └───┴───┴───┴───┘ └───┴───┴───┴───┘ │
│ │
│ Profile = bitmask of m bits (grid width) │
│ Bit i set = cell above current in column i is filled │
│ │
│ │
│ DOMINO TILING (count ways to tile n×m grid with 1×2 dominoes): │
│ ────────────────────────────────────────────────────────────── │

```java
// Count ways to tile n×m grid with dominoes
long dominoTiling(int n, int m) {
    if (n > m) { int t = n; n = m; m = t; }  // Ensure m >= n for efficiency

    long[] dp = new long[1 << n];
    dp[(1 << n) - 1] = 1;  // All filled = valid starting state

    for (int col = 0; col < m; col++) {
        for (int row = 0; row < n; row++) {
            long[] newDp = new long[1 << n];

            for (int mask = 0; mask < (1 << n); mask++) {
                if (dp[mask] == 0) continue;

                int bit = 1 << row;

                if ((mask & bit) != 0) {
                    // Cell above is filled, current must get filled from left
                    // Or we can place vertical domino up (cell above filled by it)
                    // Actually, if bit set, it means above cell "extends" here
                    // So we set this cell's bit to 0 (used the extension)
                    newDp[mask ^ bit] += dp[mask];
                } else {
                    // Cell above not filled, we must fill current cell

                    // Option 1: Horizontal domino to the right
                    // (only if not last column)
                    if (col + 1 < m) {
                        // This will "extend" to next column
                        newDp[mask | bit] += dp[mask];
                    }

                    // Option 2: Vertical domino downward
                    // (only if not last row, and cell below not already claimed)
                    if (row + 1 < n && (mask & (bit << 1)) == 0) {
                        newDp[mask] += dp[mask];  // Fill both, no extension
                    }
                }
            }

            dp = newDp;
        }
    }

    return dp[0];  // Final state: nothing extends beyond grid
}
```

│ │
│ Time: O(m × n × 2^n) │
│ Space: O(2^n) │
│ Practical for n ≤ 15-20 │
│ │
└─────────────────────────────────────────────────────────────────────────────────┘

```

## DP PATTERN QUICK REFERENCE

```

╔══════════════════════════════════════════════════════════════════════════════════╗
║ DP PATTERNS QUICK REFERENCE ║
╠══════════════════════════════════════════════════════════════════════════════════╣
║ ║
║ ┌─────────────────────────────────────────────────────────────────────────────┐║
║ │ Pattern │ Signal │ Time │ Space │║
║ ├───────────────────┼─────────────────────────┼───────────┼───────────────────┤║
║ │ Linear DP │ One sequence │ O(n) │ O(1) to O(n) │║
║ │ Two-sequence DP │ Compare two strings │ O(nm) │ O(m) with rolling│║
║ │ Interval DP │ Range [i,j] optimal │ O(n³) │ O(n²) │║
║ │ Tree DP │ Tree structure │ O(n) │ O(n) │║
║ │ Bitmask DP │ n ≤ 20, subsets │ O(2ⁿ × n) │ O(2ⁿ) │║
║ │ Digit DP │ Count in range [L,R] │ O(d × s) │ O(d × s) │║
║ │ Broken Profile │ Grid, width ≤ 20 │ O(nm × 2ᵐ)│ O(2ᵐ) │║
║ │ D&C Optimization │ Monotonic opt split │ O(nm log n)│ O(nm) │║
║ │ Convex Hull Trick│ Linear transition │ O(n) │ O(n) │║
║ │ Knuth Optimization│Quadratic → near-linear │ O(n²) │ O(n²) │║
║ └─────────────────────────────────────────────────────────────────────────────┘║
║ ║
║ RECURRENCE PATTERNS: ║
║ • dp[i] = f(dp[i-1], dp[i-2], ...) → Linear/Fibonacci type ║
║ • dp[i][j] = f(dp[i-1][j-1], dp[i-1][j], dp[i][j-1]) → Grid DP ║
║ • dp[i][j] = min/max(dp[i][k] + dp[k][j] + c) → Interval DP ║
║ • dp[mask] = f(dp[mask ^ (1<<k)]) → Bitmask DP ║
║ • dp[v] = g(dp[children]) → Tree DP ║
║ ║
║ SPACE OPTIMIZATION CHECKLIST: ║
║ □ Can I use rolling array? (only need prev row/rows) ║
║ □ Can I use single array with careful iteration order? ║
║ □ Can I compress coordinates? ║
║ □ Can I use bitmask instead of array? ║
║ ║
╚══════════════════════════════════════════════════════════════════════════════════╝

```

---

_DP is not about memorizing solutions - it's about SEEING the substructure!_
```

---

## PRACTICE PROBLEMS — Dynamic Programming (Progressive)

### Level 1: 1D DP (Start Here)

| # | Problem | Difficulty | Source | DP Type |
|---|---------|-----------|--------|---------|
| 1 | Climbing Stairs | Easy | LC 70 | Fibonacci variant |
| 2 | House Robber | Medium | LC 198 | Take/skip |
| 3 | Min Cost Climbing Stairs | Easy | LC 746 | Forward/backward DP |
| 4 | Maximum Subarray | Medium | LC 53 | Kadane's |
| 5 | Decode Ways | Medium | LC 91 | String DP |
| 6 | Coin Change | Medium | LC 322 | Unbounded knapsack |
| 7 | Longest Increasing Subsequence | Medium | LC 300 | LIS (O(n log n) optimization) |
| 8 | Word Break | Medium | LC 139 | Prefix matching DP |
| 9 | Perfect Squares | Medium | LC 279 | Min decomposition |
| 10 | Jump Game | Medium | LC 55 | Greedy or DP |

### Level 2: 2D DP

| # | Problem | Difficulty | Source | DP Type |
|---|---------|-----------|--------|---------|
| 1 | Unique Paths | Medium | LC 62 | Grid DP |
| 2 | Minimum Path Sum | Medium | LC 64 | Grid DP |
| 3 | Longest Common Subsequence | Medium | LC 1143 | Classic LCS |
| 4 | Edit Distance | Medium | LC 72 | String to string |
| 5 | 0/1 Knapsack | Medium | Classic | Weight/value table |
| 6 | Coin Change 2 | Medium | LC 518 | Count combinations |
| 7 | Target Sum | Medium | LC 494 | Subset sum variant |
| 8 | Interleaving String | Medium | LC 97 | Two-string matching |
| 9 | Maximal Square | Medium | LC 221 | 2D min expansion |
| 10 | Longest Palindromic Subsequence | Medium | LC 516 | Reverse + LCS |

### Level 3: Advanced DP

| # | Problem | Difficulty | Source | DP Type |
|---|---------|-----------|--------|---------|
| 1 | Longest Palindromic Substring | Medium | LC 5 | Expand center or DP |
| 2 | Regular Expression Matching | Hard | LC 10 | Two-string with wildcards |
| 3 | Burst Balloons | Hard | LC 312 | Interval DP |
| 4 | Partition Equal Subset Sum | Medium | LC 416 | Subset sum |
| 5 | House Robber III | Medium | LC 337 | Tree DP |
| 6 | Stone Game | Medium | LC 877 | Game theory DP |
| 7 | Minimum Cost to Cut a Stick | Hard | LC 1547 | Interval DP |
| 8 | Distinct Subsequences | Hard | LC 115 | Counting DP |
| 9 | Best Time Buy Sell Stock w/ Cooldown | Medium | LC 309 | State machine DP |
| 10 | Palindrome Partitioning II | Hard | LC 132 | Min cuts DP |

**Hidden Gems:**

| Problem | Source | Why It's Great |
|---------|--------|---------------|
| Minimum Falling Path Sum | LC 931 | Simple 2D DP — great for building intuition |
| Delete Operation for Two Strings | LC 583 | LCS variant — easier entry to edit distance |
| Ones and Zeroes | LC 474 | 2D knapsack with two weight dimensions |
| Maximum Length of Pair Chain | LC 646 | Greedy or DP — compare both approaches |
| Largest Divisible Subset | LC 368 | LIS variant with divisibility |
| Counting Bits | LC 338 | DP on bits — beautiful O(n) pattern |
