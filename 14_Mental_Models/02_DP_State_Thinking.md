> **Navigation**: [< Previous](01_Recursion_Tree_Thinking.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](03_Graph_Tree_Thinking.md)

# 🎯 DP: State & Transition Thinking — Mental Model

> **The #1 mistake in DP**: jumping straight to the recurrence relation. This guide teaches you to think about DP as **defining states**, then **defining transitions between them** — like designing a spreadsheet before filling it.

---

## Part 1: What IS a DP State?

### The Spreadsheet Analogy

```
Think of DP as filling a spreadsheet:
- Each CELL is a STATE (a unique subproblem)
- Each FORMULA is a TRANSITION (how one cell depends on others)
- The ANSWER is one specific cell

Your job:
1. Define WHAT each cell represents
2. Define HOW each cell is computed from other cells
3. Figure out the ORDER to fill cells (base cases first)
```

### Example: Longest Common Subsequence

```
         ""  A  C  E
    ""  [ 0  0  0  0 ]    ← base case: empty string
    A   [ 0  1  1  1 ]    dp[1][1] = they match! → dp[0][0] + 1
    B   [ 0  1  1  1 ]    dp[2][1] = don't match → max(left, top)
    C   [ 0  1  2  2 ]    dp[3][2] = match! → dp[2][1] + 1
    E   [ 0  1  2  3 ]    ← answer: dp[4][3] = 3
```

---

## Part 2: The 5-Step DP Process

### Step 1: Define the State (WHAT does dp[i] or dp[i][j] mean?)

```
Ask: "What's the MINIMUM information I need to describe a subproblem?"

Common state definitions:
- dp[i] = answer for first i elements
- dp[i][j] = answer for substring s[i..j]
- dp[i][w] = answer using first i items with capacity w
- dp[i][j] = answer for s1[0..i-1] and s2[0..j-1]
- dp[mask] = answer with visited set encoded as bitmask
```

**Mental trick**: "If I'm at position i, what else do I need to know to make a decision?"

- Just position? → 1D DP: `dp[i]`
- Position + remaining capacity? → 2D DP: `dp[i][w]`
- Position + last choice? → 2D DP: `dp[i][prev]`
- Position + set of visited nodes? → Bitmask DP: `dp[i][mask]`

### Step 2: Define the Transition (HOW does one state relate to others?)

```
Ask: "What CHOICES do I have at this state?"

For each choice, the state changes:
- Include item i → dp[i][w] depends on dp[i-1][w - weight[i]]
- Exclude item i → dp[i][w] depends on dp[i-1][w]
- Match chars → dp[i][j] depends on dp[i-1][j-1]
- Don't match → dp[i][j] depends on dp[i-1][j] or dp[i][j-1]
```

### Step 3: Identify Base Cases (WHERE does the spreadsheet start?)

```
Ask: "What states can I answer WITHOUT any computation?"

Common bases:
- dp[0] = ... (empty input)
- dp[0][j] = ..., dp[i][0] = ... (first row/column)
- dp[i][i] = ... (single element ranges)
```

### Step 4: Determine Fill Order (WHICH direction to fill?)

```
Ask: "Does dp[i] need dp[i-1] (fill left→right) or dp[i+1] (fill right→left)?"

Common orders:
- Linear: left to right (most problems)
- Interval: by increasing length (interval DP)
- Grid: top-left to bottom-right
- Tree: post-order (children before parent)
```

### Step 5: Extract the Answer (WHERE is the final answer?)

```
- dp[n] or dp[n-1] (last element)
- dp[n][target] (specific cell)
- max(dp[i]) for all i (scan entire array)
- dp[0][n-1] (entire range)
```

---

## Part 3: The DP Pattern Recognition Decision Tree

```
What are you optimizing?
│
├── "How many ways?" → COUNTING
│   ├── Linear choices → dp[i] = dp[i-1] + dp[i-2]     (Climbing Stairs)
│   └── 2D choices → dp[i][j] = dp[i-1][j-1] + ...     (Unique Paths)
│
├── "Min/Max cost?" → OPTIMIZATION
│   ├── Take or skip → dp[i] = max(dp[i-1], dp[i-2]+v)  (House Robber)
│   ├── With capacity → dp[i][w] = max(skip, take)       (Knapsack)
│   └── Interval → dp[i][j] = min over k of dp[i][k]+dp[k+1][j]  (MCM)
│
├── "Is it possible?" → FEASIBILITY
│   └── dp[i] = dp[i-coin1] || dp[i-coin2] || ...       (Coin change possible?)
│
├── Two sequences → TWO-SEQUENCE
│   ├── Match chars → LCS, Edit Distance
│   └── dp[i][j] uses dp[i-1][j-1], dp[i-1][j], dp[i][j-1]
│
├── Single sequence → SINGLE-SEQUENCE
│   ├── Subsequence → LIS (dp[i] = max involving j < i)
│   └── Subarray → Kadane's (dp[i] = max(arr[i], dp[i-1]+arr[i]))
│
└── Choices with states → STATE MACHINE
    └── Multiple states per position (Buy/Sell Stock with cooldown)
```

---

## Part 4: State Identification — Hard Examples

### Example 1: Egg Drop

```
"What do I need to know to make a decision?"
- How many eggs I have (e)
- How many floors to test (f)
→ State: dp[e][f] = min trials to find critical floor

Transition:
  Drop egg at floor x:
    If egg breaks → test below: dp[e-1][x-1]
    If survives → test above: dp[e][f-x]
  Worst case: max(breaks, survives)
  Best choice: min over all x

dp[e][f] = 1 + min over x of max(dp[e-1][x-1], dp[e][f-x])
```

### Example 2: Buy/Sell Stock with Cooldown

```
"What do I need to know at day i?"
- Am I holding a stock or not?
- Am I in cooldown or not?
→ THREE states at each day:

hold[i]    = max profit on day i if I'm holding stock
notHold[i] = max profit on day i if I'm NOT holding (and not in cooldown)
cool[i]    = max profit on day i if I'm in cooldown (just sold)

Transitions:
hold[i]    = max(hold[i-1], notHold[i-1] - price[i])  // keep holding or buy
notHold[i] = max(notHold[i-1], cool[i-1])              // stay or finish cooldown
cool[i]    = hold[i-1] + price[i]                       // sell today
```

### Example 3: Knapsack — Adding a Dimension

```
"I have items and a weight capacity."
State v1: dp[w] = max value with capacity w
→ But which items have I used? Can I reuse?

If each item used ONCE (0/1 Knapsack):
  dp[i][w] = max(dp[i-1][w], dp[i-1][w-wt[i]] + val[i])
  ↑ need to track which item we're considering → add dimension i

If items unlimited (Unbounded):
  dp[w] = max(dp[w], dp[w-wt[i]] + val[i])  for each item i
  ↑ no need for item dimension, just process in right order
```

---

## Part 5: Common DP Transition Patterns

### Pattern 1: Take or Skip (O(n))

```
dp[i] = max(dp[i-1], dp[i-2] + value[i])
         ↑ skip i    ↑ take i (can't take i-1)
Examples: House Robber, Sticker Collection
```

### Pattern 2: Best from All Previous (O(n²))

```
dp[i] = max/min(dp[j] + cost) for all valid j < i
Examples: LIS, Jump Game variants
```

### Pattern 3: Two Pointer into State (O(n²))

```
dp[i][j] = f(dp[i+1][j], dp[i][j-1], dp[i+1][j-1])
Examples: LCS, Edit Distance, Palindrome DP
```

### Pattern 4: Interval DP (O(n³))

```
for len 2..n:
  for i..j where j-i+1 = len:
    for k in i..j:
      dp[i][j] = best of dp[i][k] + dp[k+1][j] + merge_cost
Examples: Matrix Chain, Burst Balloons, Optimal BST
```

### Pattern 5: Bitmask DP (O(2^n × n))

```
dp[mask][i] = best answer with visited set = mask, currently at i
for each unvisited j:
  dp[mask | (1<<j)][j] = dp[mask][i] + cost[i][j]
Examples: TSP, Assignment Problem
```

---

## Part 6: Space Optimization Mental Model

### When Can You Optimize?

```
If dp[i] only depends on dp[i-1] (previous row):
   → Use two arrays: prev[] and curr[]
   → Or single array processed in right direction

If dp[i] only depends on dp[i-1] and dp[i-2]:
   → Use 2-3 variables

Direction matters:
   0/1 Knapsack: process weights RIGHT TO LEFT (avoid using same item twice)
   Unbounded Knapsack: process LEFT TO RIGHT (allow reuse)
```

### Visual: Rolling Array

```
Full table:          Optimized:
dp[0]: [...]         prev: [...]
dp[1]: [...]    →    curr: [...]   (swap after each row)
dp[2]: [...]
dp[3]: [...]
```

---

## Part 7: DP Debugging Checklist

```
□ Is my state definition correct? (Does it capture ALL needed info?)
□ Are base cases correct? (Test with smallest inputs manually)
□ Is my transition hitting the right cells? (Draw arrows on table)
□ Am I filling in the right order? (Dependencies satisfied before use?)
□ Off-by-one: dp[n] or dp[n-1]? (Check indexing)
□ Is the answer at the right cell? (dp[n][target]? max of row?)
□ Edge cases: empty input? single element? all same values?
```

---

## NEW DIAGRAM — Coin Change DP State Table (1D DP with Transitions)

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│  DIAGRAM: Coin Change DP — dp[i] = min coins for amount i                     │
│           Coins = [1, 3, 4], find min coins for amount = 6                   │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  COIN CHANGE: "Minimum coins to make amount 6, using coins [1, 3, 4]"        │
│                                                                              │
│  1. STATE DEFINITION: dp[i] = minimum coins needed to make amount i          │
│     Base case: dp[0] = 0 (0 coins to make amount 0)                          │
│                                                                              │
│  2. TRANSITIONS: dp[i] = min(dp[i-1], dp[i-3], dp[i-4]) + 1 (if coin fits)  │
│                                                                              │
│  3. FILL ORDER (left to right):                                              │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │  Amount  │ 0 │ 1 │ 2  │ 3  │ 4  │ 5  │ 6  │                       │    │
│  │  dp[i]   │ 0 │ 1 │ 2  │ 1  │ 1  │ 2  │ 2  │                       │    │
│  │  Choice  │ - │[1]│[1] │[3] │[4] │[1] │[3] │                       │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  STEP-BY-STEP COMPUTATION:                                                   │
│                                                                              │
│  ① dp[0] = 0                          (base case, no coins needed)          │
│                                                                              │
│  ② dp[1]: min(dp[0]+1)              = 0+1 = 1  (use coin 1)                │
│         dp[-2], dp[-3] are invalid, SKIP.                                    │
│                                                                              │
│  ③ dp[2]: min(dp[1]+1)              = 1+1 = 2  (1+1)                        │
│         dp[-1], dp[-2] invalid, SKIP.                                        │
│                                                                              │
│  ④ dp[3]: min(dp[2]+1, dp[0]+1)   = min(2+1, 0+1) = 1  (use coin 3)        │
│         dp[-1] invalid, SKIP.        ↑───────── coin 3: dp[0]+1 = 0+1 = 1   │
│                                                    └─ WINNER! ─┘           │
│                                                                              │
│  ⑤ dp[4]: min(dp[3]+1, dp[1]+1, dp[0]+1)                                   │
│         = min(1+1, 1+1, 0+1) = 0+1 = 1  (use coin 4, dp[0]+1)              │
│         ↑────────────────────────────  dp[0]+1 = 1 is smallest!            │
│                                                                              │
│  ⑥ dp[5]: min(dp[4]+1, dp[2]+1, dp[1]+1)                                   │
│         = min(1+1, 2+1, 1+1) = 2  (e.g., 1+1+1+1+1 or 1+4)                 │
│                                                                              │
│  ⑦ dp[6]: min(dp[5]+1, dp[3]+1, dp[2]+1)                                   │
│         = min(2+1, 1+1, 2+1) = min(3, 2, 3) = 2  (use 3+3 = 2 coins!)      │
│         ↑─────────────────────────────────────────────────────────────────  │
│         COIN 3 chosen! dp[3]+1 = 1+1 = 2  ← WINNER (not 4+1+1 = 3)         │
│                                                                              │
│  ANSWER: dp[6] = 2  (coins: 3 + 3 = 6)                                      │
│                                                                              │
│  TRANSITION ARROWS (visual):                                                 │
│                                                                              │
│     dp[6]                                                                      │
│       ↑  +1          ↑  +1          ↑  +1                                  │
│     dp[5] ─────── dp[3] ─────── dp[2]                                        │
│    (2+1=3)          (1+1=2) ←BEST (2+1=3)                                   │
│       ↑  +1                                                                    │
│     dp[4]                                                                        │
│    (1+1=2)                                                                    │
│       ↑  +1                                                                    │
│     dp[3]                                                                        │
│    (1+1=2) ← from dp[0] using coin 3, or from dp[3] using coin 1            │
│       ↑  +1                                                                    │
│     dp[2]                                                                        │
│    (1+1=2) ← from dp[1] using coin 1                                         │
│       ↑  +1                                                                    │
│     dp[1]                                                                        │
│    (0+1=1) ← from dp[0] using coin 1                                         │
│       ↑                                                                        │
│     dp[0] = 0  (BASE CASE)                                                   │
│                                                                              │
│  KEY INSIGHT: dp[i] depends ONLY on dp[i-coin] for each valid coin.         │
│  For coin change with coins [1,3,4], dp[i] = min(dp[i-1],dp[i-3],dp[i-4]) + 1│
└──────────────────────────────────────────────────────────────────────────────┘
```

## Historical Evolution

> **Why this section**: mental-model pedagogy requires knowing the prior art. The frameworks below all have named predecessors — naming them prevents reinventing the wheel and connects your reasoning to decades of computer-science practice.

| Year | Predecessor | Contribution |
| --- | --- | --- |
| 1954 | Bellman | DP theory — optimal substructure + overlapping subproblems |
| 1957 | Bellman | *Dynamic Programming* (book) — formal foundations |
| 1959 | Dijkstra | Shortest path = DP relaxation; proves DP correctness |
| 1962 | Floyd | All-pairs shortest path (O(V^3)) |
| 1962 | Warshall | Transitive closure algorithm |
| 1967 | Viterbi | Viterbi algorithm — DP over Hidden Markov Models |

**Evolution narrative**: Richard Bellman coined "Dynamic Programming" in 1954 while working at RAND, motivated by multi-stage decision processes in operations research. His 1957 book established the formal framework of optimal substructure and overlapping subproblems — the two pillars that determine whether DP applies. Simultaneously, Dijkstra's 1959 shortest-path algorithm demonstrated that DP's "relaxation" principle (the `dist[v] = min(dist[v], dist[u] + w)` update) could be specialized into greedy algorithms when edges are non-negative. Floyd's 1962 all-pairs shortest-path algorithm and Warshall's transitive closure work extended DP to 2D state spaces (node pairs), establishing the grid/string DP patterns used today. Andrew Viterbi's 1967 application of DP to Hidden Markov Models (decoding convolution codes) demonstrated DP's breadth across continuous and probabilistic domains.

**Modern practice anchor**: Modern DP teaching (LeetCode patterns, CLRS Chapter 15, MIT 6.006) uses the "state definition → transition → base case → optimization" framework that directly descends from Bellman's original formulation, with the spreadsheet visualization connecting to Dijkstra's algorithmic specialization tradition.

## Production Reality

> **Why this section**: a mental model is only useful if it predicts what breaks in production. Below are named failure modes tied to this mental model, with debug workflows and modern observability tools.

### Failure Mode 1: DP Table Explosion — OOM at Scale (n=10,000 → 10^8 Cells)

**What goes wrong**: A 2D DP table for a problem with n=10,000 has 100 million cells. At 8 bytes per long, that's 800MB just for the base table — before accounting for overhead. A production scheduler running DP over 10,000 task dependencies (each state = task pair) exhausts heap and causes OOM kill.

**Cost**: Pod OOM kill → request failures → circuit breaker opens → cascading rejection of downstream services. Recovery requires re-running the scheduler, which again OOMs. Deadlock until the code is hotfixed to use sparse representation.

**Debug workflow**:
1. Memory profile with `jcmd <pid> GC.class_histogram` or `async-profiler` heap allocation mode to see DP table size.
2. Add logging: `log.info("DP table size: {} bytes", table.length * table[0].length * 8L);` — alert if > 100MB.
3. Switch to rolling array (space optimization): instead of `dp[n][m]`, use `dp[2][m]` and alternate, reducing space from O(nm) to O(m).

### Failure Mode 2: Cache Eviction Misses for Memoized States

**What goes wrong**: Memoization caches the result of every state encountered. In a long-running service processing a stream of related but non-identical inputs, the cache grows unbounded. Eventually, LRU eviction kicks out frequently-used states, forcing recomputation on the next request.

**Cost**: Intermittent latency spikes (cache miss → recompute 10,000 states → 500ms latency spike) that don't show up in load tests with cold cache. Users experience "random" slow requests with no apparent cause.

**Debug workflow**:
1. Instrument cache hit/miss ratio: `memorandum` (Python), `caffeine` (Java) provide hit rate metrics.
2. Monitor cache size growth over time: `cache.estimatedSize()` in Java's ConcurrentHashMap, `len(lru_cache_wrapper.cache_info().currsize)` in Python.
3. Set cache size limits: `@lru_cache(maxsize=10000)` or use a bounded cache with TTL-based eviction.

### Failure Mode 3: State-Transition Misidentification = Exponential Wall-Clock in Production Scheduler

**What goes wrong**: If the state space is defined incorrectly (e.g., "task status" vs "task status AND resource ID"), the DP explores a product space that is exponentially larger. A scheduler that should be O(n log n) becomes O(2^n) when state includes the wrong dimension, making the "optimal schedule" computation run for hours instead of milliseconds.

**Cost**: SLA breach for scheduled tasks. If the scheduler is part of a batch pipeline, downstream jobs fail. At scale, a scheduler that takes 4 hours instead of 4 seconds means night-shift jobs don't finish before morning traffic arrives.

**Debug workflow**:
1. Add state-space cardinality logging at startup: `log.info("State space: {} states", stateCount); alert if stateCount > 1_000_000.`
2. Use a state-space estimation formula before running DP: multiply dimensions explicitly and compare to a threshold.
3. Profile the DP loop with async-profiler: if >90% of time is spent in one inner loop, suspect exponential state explosion.

### Modern Production Tools

- **Java `caffeine` library**: High-performance caching with eviction metrics (eviction count, load success/failure). Integrates with Micrometer for Prometheus telemetry.
- **Python `functools.lru_cache` with `cache_info()`**: Provides hit/miss statistics for diagnosing memoization efficiency.
- **JVM heap profilers (async-profiler, VisualVM)**: Heap allocation flame graphs show DP table size distribution, identifying which DP dimensions consume the most memory.

## Conceptual Depth & Topical Breadth

> **Why this section**: this mental model rests on a specific invariant, and its variants cover a spectrum of trade-offs. Knowing the invariant and the variants lets you apply the model correctly across problems.

### Invariant

DP works when subproblems **overlap** (same subproblem is solved multiple times) and the problem has **optimal substructure** (the optimal solution can be constructed from optimal solutions of subproblems). This is Bellman's Principle of Optimality: an optimal policy has the property that whatever the current state is, the remaining decisions must be optimal with respect to that state. The invariant is that these two properties together guarantee that caching subproblem results eliminates redundant computation and the optimal solution can be built bottom-up. If overlapping subproblems are absent, memoization buys nothing — each subproblem is unique anyway. If optimal substructure is absent, DP produces incorrect results — the greedy counter-example is the coin system {1, 3, 4} for amount 6 (greedy gives 4+1+1=3 coins, optimal is 3+3=2 coins). The internal mechanism is the DP table — a structured cache where each cell represents a subproblem and the table's fill order respects the dependency graph between subproblems.

### Variants Comparison

| Variant | Mechanism | Time | Space | When to Use |
| --- | --- | --- | --- | --- |
| Top-down memoization | Recursion + HashMap cache | O(n) | O(n) stack + cache | Unknown fill order, easy recursive structure |
| Bottom-up tabulation | Iterative table fill | O(n) | O(n) or O(1) | Known fill order, need control over traversal |
| Rolling array | Only keep last k rows | O(n) | O(k) | When DP[i] depends only on dp[i-k..i] |
| Sparse DP | HashMap instead of array | O(n) | O(unique states) | High-dimensional state, sparse reachable set |

### Decision Table

| Problem Property | Default Approach | When to Switch |
| --- | --- | --- |
| Known fill direction, many states | Bottom-up tabulation | Recursion depth risk → explicit stack |
| Unknown traversal order, recursive | Top-down memoization | Stack overflow → convert to tabulation |
| DP state depends on previous k rows | Rolling array (k-width) | More than 2-3 rows needed → full table |
| State is (i, j, k) — 3D | 3D array or HashMap | n > 1000 → sparse or compressed DP |
| Greedy counter-example exists | DP (not greedy) | Greedy provable (matroid) → greedy |
| Brute force exponential | DP or pruning | DP state space too large → approximate/heuristic |
