# What is Dynamic Programming?

> **Navigation**: [← University Proof Corner](01_university_proof_corner.md) | [Chapter overview](../04b_DP_Fundamentals.md) | [Classic DP Problems With Traces →](03_classic_dp_problems_with_traces.md)
> Page 2 of 4 in **DP Fundamentals**


## Dynamic programming - complete understanding

### What is dynamic programming

Dynamic Programming (DP) is a method for solving complex problems by:

1. Breaking them into simpler OVERLAPPING subproblems
2. Solving each subproblem ONLY ONCE
3. STORING the results to avoid redundant computation

DP = RECURSION + MEMOIZATION (REMEMBERING)

**Inventor:** Richard Bellman (1950s) at RAND Corporation

**Name origin:** "Dynamic" sounded impressive to government funders! (Bellman chose it to hide the mathematical nature of his work)

### What problem does dp solve

**Core problem:** Optimization problems where:

- You need the BEST solution (max/min)
- Making decisions at each step
- Decisions affect future choices

**Real-world examples:** 

- Navigation: What's the shortest route? (Same intersections = subproblems)
- Finance: Max profit from stock trades (Each day = decision point)
- Text: How similar are two strings? (Edit distance)
- Packing: Most value in limited space (Knapsack problem)
- Scheduling: Best order for tasks (Job scheduling)

**The insight:** Instead of exploring ALL possible combinations (exponential), DP builds optimal solutions from optimal sub-solutions (polynomial)!

BEFORE DP (Brute Force): O(2^n) or worse - trying all combinations

**After dp:** O(n²) or O(n×m) - building from subproblems

### Why does dp work? (the mathematical foundation)

TWO ESSENTIAL PROPERTIES (Both MUST be true):

1. OPTIMAL SUBSTRUCTURE

"Optimal solution to the whole = combination of optimal sub-solutions"

Example: Shortest Path A→C
If A→B→C is shortest, then:

- A→B part must be the shortest A→B path
- B→C part must be the shortest B→C path

If this wasn't true, you could find a shorter A→C!

2. OVERLAPPING SUBPROBLEMS

"Same subproblems appear multiple times during recursion"

Example: Fibonacci fib(5)

- fib(5) = fib(4) + fib(3)
- fib(4) = fib(3) + fib(2) ← fib(3) needed TWICE!
- fib(3) = fib(2) + fib(1) ← fib(2) needed THRICE!

If subproblems DON'T overlap → Use Divide & Conquer instead!

### When to use dp? (interview recognition patterns)

**Signal 1:** "Find maximum/minimum..." or "Count the number of ways..." → Optimization = DP likely

**Signal 2:** "Given choices at each step..." → Decision making with future consequences = DP

**Signal 3:** "Can you reach...?" or "Is it possible...?" → Often can be framed as DP (true/false states)

**Signal 4:** Problem involves sequences/grids → String problems, matrix traversal = Classic DP

**Signal 5:** Same question repeated with different parameters → Recursive structure with overlapping = DP

| USE DP WHEN | DON'T USE DP WHEN |
| --- | --- |
| Need optimal solution | Just need any valid solution |
| Subproblems overlap | Subproblems independent (use D&C) |
| Problem has optimal structure | Local choices don't build global optimal |
| Can define clear state | State space is too large |

### How does dp work? (two approaches)

**Approach 1:** TOP-DOWN (MEMOIZATION)

```text
1. Start with original problem
2. Recursively break into subproblems
3. Before computing, check if answer already cached
4. If cached: return it | If not: compute and cache

ANALOGY: You're asked a hard question. You think recursively
but write down answers you've figured out on a notepad.
```

**Approach 2:** BOTTOM-UP (TABULATION)

```text
1. Identify base cases (smallest subproblems)
2. Fill table starting from base cases
3. Build up to the answer iteratively
4. Final cell contains the answer

ANALOGY: Building a pyramid brick by brick from the bottom.
Each brick relies on the ones below it.
```

**Comparison:** 

| Top-Down (Memo) | Bottom-Up (Tabulation) |
| --- | --- |
| Easier to write | Usually faster (no recursion) |
| Only solves needed | Solves ALL subproblems |
| Risk of stack overflow | No stack overflow |
| Lazy evaluation | Eager evaluation |

### Difficulties & common pitfalls

1. IDENTIFYING THE STATE (Hardest Part!):

- "What information do I need to solve a subproblem?"
- Wrong state definition = wrong solution
- Tip: Ask "What changes between recursive calls?"

2. FINDING THE RECURRENCE:

"How does current state relate to previous states?"
Tip: Think about the LAST decision/step

3. BASE CASE ERRORS:

Missing or wrong base cases cause wrong answers
Tip: What's the smallest problem you can answer directly?

4. OFF-BY-ONE ERRORS:

Array indices, loop bounds - classic source of bugs
Tip: Trace through small examples by hand

5. SPACE COMPLEXITY:

2D DP tables can be huge for large inputs
Tip: Often can optimize to 1D by keeping only previous row

6. RECONSTRUCTION PATH:

DP gives optimal VALUE, but sometimes you need the actual SOLUTION
Tip: Store "choice made" at each step, then backtrack

### Expected outputs & complexity

COMPLEXITY IMPROVEMENT (Why DP is Powerful):

| Problem | Brute Force | With DP |
| --- | --- | --- |
| Fibonacci | O(2^n) | O(n) |
| Longest Common Subseq | O(2^(m+n)) | O(m×n) |
| 0/1 Knapsack | O(2^n) | O(n×W) |
| Edit Distance | O(3^n) | O(m×n) |
| Matrix Chain | O(n!) | O(n³) |
| Coin Change | O(amount^n) | O(n×amount) |

**Typical dp output:** 

- Single number: Max profit, min cost, number of ways
- Boolean: Is it possible?
- Array/Table: All subproblem solutions (for path reconstruction)
- The actual solution: Requires backtracking through DP table

**Space-time tradeoff:** 

- Standard 2D DP: O(n×m) time, O(n×m) space
- Space-optimized: O(n×m) time, O(min(n,m)) space (keep 2 rows)
- Ultra-optimized: Sometimes O(1) space possible (like Fibonacci)

## The Story Metaphor

```text
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
```


---

## 📌 Part 2: Fibonacci — the Gateway to DP

### Evolution of Solutions

#### Level 1: Pure Recursion (❌ Inefficient)

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
```

#### Level 2: Memoization - Top Down (✅ Efficient)

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

#### Level 3: Tabulation - Bottom Up (✅✅ Best)

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

#### Level 4: Space Optimized (✅✅✅ Perfect)

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

## 📌 Part 3: the DP Recipe

### 5-Step Process

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

[← University Proof Corner](01_university_proof_corner.md) | [Chapter overview](../04b_DP_Fundamentals.md) | [Classic DP Problems With Traces →](03_classic_dp_problems_with_traces.md)
