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

📖 **Related Files:**
- [03_Algorithms/04a_DP_Internals.md](../03_Algorithms/04a_DP_Internals.md) — DP theory
- [04_Patterns_Templates/16_DP_Pattern_Recognition.md](../04_Patterns_Templates/16_DP_Pattern_Recognition.md) — DP pattern families + problems

---
[← 01 Recursion](01_Recursion_Tree_Thinking.md) | [03 Graph & Tree Thinking →](03_Graph_Tree_Thinking.md)
