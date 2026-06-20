> **Navigation**: [< Previous Chapter](04b_DP_Fundamentals.md) | [Back to Index](../00_MASTER_INDEX.md)
> 🧠 **Mental Model**: See [DP State Thinking](../14_Mental_Models/02_DP_State_Thinking.md) — advanced state design and optimization

---

# 🚀 Advanced DP Patterns

### 5W1H: Mastering Advanced DP

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  WHAT: Advanced DP techniques: Digit DP, Bitmask DP, Interval DP, Tree DP,   ║
║        and Monotonic Optimization for solving complex CP/interview problems. ║
║                                                                              ║
║  WHY:  Standard 1D/2D DP fails when state spaces are subsets (Bitmask),      ║
║        when boundaries are dynamic (Interval), or when numbers are massive   ║
║        (Digit DP). Advanced states encapsulate more complex constraints.     ║
║                                                                              ║
║  WHO:  Senior engineers and competitive programmers preparing for hard       ║
║        technical interviews or optimizing complex real-world constraints.    ║
║                                                                              ║
║  WHEN: Use when N is very small (N≤20) → Bitmask DP.                         ║
║        Use when counting numbers with digit rules → Digit DP.                ║
║        Use for optimal splitting/parenthesization → Interval DP.             ║
║                                                                              ║
║  HOW:  By mastering state compression (bitmasks), specialized loop bounds    ║
║        (interval lengths), and combining subtree results (Tree DP).          ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

### Historical Evolution

Advanced DP variants emerged from the need to handle state spaces that simple 1D/2D tables cannot efficiently represent. **Digit DP** (counting numbers with digit constraints) was formalized in the context of **automatic theorem proving and formal verification** in the 1970s-80s, where counting valid encodings required traversing digit-by-digit state machines. **Bitmask DP** leverages the fact that $n \le 20$ fits within a 32-bit integer, a technique that became standard after **Cook's 1971 NP-Completeness paper** and subsequent competitive programming competitions demonstrated that TSP and other subset problems were tractable via bitmask enumeration. **Knuth Optimization**, discovered by **Donald Knuth in 1971** and formalized in his 1975 paper, exploits a quadrangle inequality property ($c[i][j-1] \le c[i][j]$) in certain Interval DP recurrences to reduce complexity from $O(n^3)$ to $O(n^2)$ — this optimization applies to optimal binary search tree construction and matrix chain multiplication. **Monotonic queue optimization** for DP on sliding windows traces its roots to **deque-based sliding window algorithms** from the 1970s. Modern practice (post-2010) applies these techniques in competitive programming (Codeforces, AtCoder) and in production systems like network routing where TSP variants appear in logistics optimization.

---

## PART 11: Advanced DP Patterns

---

🔬 **Section Challenge — Advanced DP Concepts**

**Challenge 1 (Reasoning):** Why is Bitmask DP usually constrained to $N \le 20$?

<details><summary>Answer</summary>

Bitmask DP relies on representing subsets as integers (e.g., $1 \ll N$). An integer of $N$ bits takes $2^N$ states. For $N = 20$, $2^{20} \approx 10^6$ states, which easily fits in memory and time limits (especially if the transition takes $O(N)$, leading to $O(N \cdot 2^N) \approx 2 \times 10^7$ operations). Beyond $N=20$, say $N=30$, $2^{30} \approx 10^9$, which exceeds standard time (1-2 seconds) and memory (256MB) limits.

</details>

**Challenge 2 (Pattern Recognition):** You are given a string and need to find the minimum number of cuts such that every substring is a palindrome. Which advanced DP pattern is this?

<details><summary>Answer</summary>

Interval DP. The state typically involves $dp[i][j]$, representing the optimal answer for the substring $S[i..j]$. We transition by trying all possible split points $k$ between $i$ and $j$, combining the results of $dp[i][k]$ and $dp[k+1][j]$ plus any merge cost. (This specific problem can also be optimized to 1D DP $dp[i]$ representing min cuts for prefix of length $i$, but the core reasoning is Interval DP).

</details>

---

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



## Pattern 2: Bitmask DP

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



### Why Bitmask DP Works — The State-Equals-Subset Trick and the 2^n Feasibility Rule

TSP and assignment problems are bitmask DP staples, and the code above looks like a normal DFS-with-memo — but the *mask parameter* is doing something more interesting than caching: it's encoding the full history of choices ("which cities have I visited?"). That's the bitmask DP insight: when the answer depends on *which subset of elements has been used so far*, the natural state is the subset itself, and a bitmask is just a compact representation of that subset.

**The 2^n state space is forced.** There are 2^n subsets of n elements. Each subset is one possible "what have I done so far" state. If the recurrence depends on the full subset (not just the current position), then DP needs an entry per subset — that's 2^n entries. The bitmask is just an efficient encoding: bit `i` set means "element `i` is in the subset." Operations like "add element `i` to subset" become `mask | (1 << i)`, "is element `i` in subset" becomes `(mask & (1 << i)) != 0`, and "remove element `i`" becomes `mask & ~(1 << i)`. The n-bit integer is the canonical representation.

**Why n ≤ 20.** The state space is 2^n and the transition is typically O(n) per state (try each remaining element). Total cost: O(n × 2^n). At `n = 20`, that's `20 × 2^20 ≈ 2 × 10^7` operations — fast. At `n = 25`, that's `25 × 2^25 ≈ 8 × 10^8` — borderline. At `n = 30`, that's `8 × 10^10` — impossible. So bitmask DP is the technique for the "small n" regime where brute force over subsets is feasible.

**The two flavors.**

*Flavor 1: state = "set of visited/processed elements."* The position is also part of the state, but the set is what makes the state count exponential. Example: TSP — `dp[mask][pos]` = min tour cost having visited exactly the cities in `mask` and currently at city `pos`. Without the mask, two different visit orders that end at the same city would be indistinguishable — but they have different remaining-work properties (different cities remain to visit), so they need separate states.

*Flavor 2: state = "set of chosen elements."* No position in the state; the answer is "given this subset, what value can I achieve?" Example: assignment problem — `dp[mask]` = min cost of assigning workers 0..(popcount(mask)) to jobs in `mask`. The "worker index" is implicit in the subset size.

**The subset-iteration trick — enumerate submasks of a mask.** Sometimes you need to iterate over all subsets of a given mask (e.g., "for every subset of the visited set, compute X"). The naive way is to check `(sub & mask) == sub` for every `sub` in `[0, 2^n)` — that's O(2^n × 2^n). The clever way uses the recurrence `sub = (sub - 1) & mask` to enumerate exactly the submasks in O(2^popcount(mask)) total:

```java
for (int sub = mask; sub > 0; sub = (sub - 1) & mask) {
    // sub is a non-empty subset of mask
}
// Don't forget sub = 0 (the empty subset) if needed
```

Why this works: when you subtract 1 from a bitmask, all the trailing zeros become 1s and the lowest 1-bit becomes 0. Then `& mask` clears any bits that aren't in `mask`, leaving a strictly smaller subset. Starting from `mask` and iterating reaches all subsets in reverse-lexicographic order, with O(1) work per subset. This is essential for "for every submask" DP transitions like SOS-DP (Sum over Subsets DP), where you compute `dp[mask] = sum of f[sub] for all sub ⊆ mask` in O(n × 2^n) total using this iteration.

**When bitmask DP fails or isn't worth it.**
- n > 25 → state space too large; look for a different decomposition or use approximation
- The recurrence doesn't actually depend on the full subset → use a different state (e.g., just the position), getting O(n) instead of O(n × 2^n)
- The transitions are expensive (e.g., O(2^n) per state) → total becomes O(4^n), almost never feasible

**A surprising crossover with bit tricks.** Bitmask DP rewards fluency with bit manipulation. `mask & -mask` extracts the lowest set bit (the one set). `Integer.bitCount(mask)` gives the subset size (useful for "how many workers have I assigned"). `mask ^ (1 << i)` toggles bit `i`. These become natural building blocks once you've written a few bitmask recurrences. The same bit tricks are also why the XOR-trie (chapter 18) works — same fluency, different problem.

🔬 **Section Challenge — Bitmask DP**

**Challenge 1 (State Decomposition, 5 min):** You're given an n×n grid (n ≤ 15) with cells either empty or blocked. You start at (0,0) and want to visit every empty cell exactly once, returning to (0,0) at the end. This is the "bitmask TSP" generalization. What's the state? What's the recurrence? What's the complexity?

<details><summary>Answer</summary>

State: `dp[mask][r][c]` = true if there's a Hamiltonian path starting from (0,0), visiting exactly the cells in `mask` (each cell corresponds to a bit), and ending at cell (r,c).

But that's 2^n × n × n = O(n² × 2^n) which is large. We can simplify: fix the start at (0,0) and only allow paths that *started* there (i.e., the only way to "reach" (0,0) is via the start, not via wrap-around). Then `dp[mask][r][c]` = can we reach (r,c) having visited exactly `mask` worth of cells starting from (0,0).

Recurrence:
```
dp[mask | (1<<(r*n+c))][r][c] |= dp[mask][r'][c']  for each (r',c') adjacent to (r,c)
                                where (r*n+c) wasn't in mask
                                and cell (r,c) isn't blocked
```

Complexity: O(n² × 2^n × 4) — for each state, try up to 4 neighbors. At n = 15: 15² × 2^15 × 4 ≈ 2 × 10^8. Borderline but feasible.

Note the state-space optimization: if (0,0) is the only "start" and we always end there, we can use `dp[mask][r][c]` = reachable without tracking "where did we come from" — the path is implicit in the order of bits set in `mask`. This is what makes bitmask TSP feasible.

</details>

**Challenge 2 (Subset Iteration, 5 min):** Given `mask = 0b10110` (= 22), enumerate all non-empty subsets of `mask` in the order produced by `for (int sub = mask; sub > 0; sub = (sub - 1) & mask)`. List them.

<details><summary>Answer</summary>

```
mask = 0b10110 = 22

sub = 22 = 0b10110
sub = (22-1) & 22 = 21 & 22 = 0b10101 & 0b10110 = 0b10100 = 20
sub = (20-1) & 22 = 19 & 22 = 0b10011 & 0b10110 = 0b10010 = 18
sub = (18-1) & 22 = 17 & 22 = 0b10001 & 0b10110 = 0b10000 = 16
sub = (16-1) & 22 = 15 & 22 = 0b01111 & 0b10110 = 0b00110 = 6
sub = (6-1) & 22 = 5 & 22 = 0b00101 & 0b10110 = 0b00100 = 4
sub = (4-1) & 22 = 3 & 22 = 0b00011 & 0b10110 = 0b00010 = 2
sub = (2-1) & 22 = 1 & 22 = 0b00001 & 0b10110 = 0b00010 = 2  (same as before? Let me recheck)

Wait, (2-1) & 22 = 1 & 22 = 0b00001 & 0b10110 = 0b00000 = 0. So sub=0, loop exits.

So the sequence is: 22, 20, 18, 16, 6, 4, 2. Then sub becomes 0 and the loop exits.

That's 7 subsets (= 2^popcount(22) - 1 = 2^3 - 1 = 7 non-empty subsets of a 3-bit mask, where the 3 set bits are at positions 1, 2, 4).

The pattern: each iteration visits the next-smaller subset, in decreasing order, never revisiting. Total O(2^popcount(mask)) iterations regardless of n — that's why this is efficient for sparse masks.

</details>


## Pattern 3: Interval DP

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

### Why Interval DP Works — and the Burst Balloons "Burst Last" Trick That Looks Backwards

The matrix chain code above and the burst balloons code look similar but they iterate *opposite directions* — matrix chain tries every split point `k` and combines two halves; burst balloons tries every "last burst" position and combines two halves *after* removing the last. Most people copy the templates without seeing why one says "split" and the other says "last." That asymmetry is the whole insight of interval DP, and once you see it you can re-derive both.

**Why interval DP exists as a pattern.** The trigger is: "the optimal answer for interval `[i, j]` is determined by the answers for smaller intervals, and the combining rule involves some operation that touches both halves together." Examples: matrix chain multiplication cost, palindrome partitioning, optimal BST search cost, stone game scores, remove boxes. The structural reason it works: intervals nest (a sub-interval of `[i, j]` is `[i', j']` with `i ≤ i' ≤ j' ≤ j`), so they form a partial order — you can compute answers bottom-up from length 1 to length `n`. The DP table `dp[i][j]` is just the partial order linearized by length.

**The "split" form (matrix chain).** The optimal cost to multiply `M_i, M_{i+1}, ..., M_j` is the minimum over all split points `k` of:

```
cost(i, j) = min over k in [i, j) of [ cost(i, k) + cost(k+1, j) + merge(i, k, j) ]
```

Where `merge(i, k, j)` is the cost of multiplying the two resulting matrices together. Why does this give the right answer? Because the *last operation* in any parenthesization of `M_i...M_j` is some multiplication `(M_i...M_k) * (M_{k+1}...M_j)` — there is a "last split point" `k`. Whatever the optimal parenthesization is, that `k` exists, and the sub-parenthesizations of the two halves must themselves be optimal (otherwise we could improve them and improve the whole). That's the optimal-substructure property. We try all possible `k` and take the min.

**The "burst last" form (burst balloons).** The naive split form doesn't work for burst balloons. Here's why: when you try to compute `coins(i, j)` as "max over split `k` of coins(i, k) + coins(k+1, j) + something," the "something" depends on balloons that haven't been burst yet — and you can't tell from `(i, k)` and `(k+1, j)` alone what the neighbors of the split are. The state isn't sufficient.

The fix: invert the question. Instead of "which balloon do we split the interval on," ask "which balloon do we burst *last* within this interval?" If balloon `last` is the last to be burst in `(left, right)`, then at the moment of bursting it, its neighbors are `arr[left - 1]` and `arr[right + 1]` (the boundaries, plus any balloons that survived). All balloons in `(left, last-1)` and `(last+1, right)` are already gone. So the coins earned from bursting `last` are `arr[left - 1] * arr[last] * arr[right + 1]` — known quantities — plus whatever was earned bursting `(left, last-1)` and `(last+1, right)`. That gives the recurrence:

```
dp[left][right] = max over last in [left, right] of
    [ dp[left][last - 1] + dp[last + 1][right]
      + arr[left - 1] * arr[last] * arr[right + 1] ]
```

**Why "burst last" works and "burst first" doesn't.** When `last` is burst last, its neighbors are *fixed* (the interval boundaries). When some other balloon is burst first, its neighbors keep changing as more balloons burst, and you can't write a closed-form recurrence. The "last" choice makes the neighbors time-invariant for the duration of the recurrence — which is what makes the DP work. This is the **sub-problem boundary trick**: pick the operation that *fixes the state at the moment of combination*, and you can write the recurrence. The same trick appears in:
- Palindrome partitioning: "is `s[i..j]` a palindrome?" depends on `s[i+1..j-1]`, so we expand from the center, not contract from the ends.
- Remove boxes: "max points removing boxes of color k" — the last operation involves grouping all same-colored adjacent boxes together, fixing the score boundary.
- Strange printer: the "last printed character" determines whether the next character can be merged with it.

**The bottom-up ordering — why by length and not by start.** The recurrence for `dp[i][j]` depends on `dp[i][k]` and `dp[k+1][j]` — sub-intervals strictly shorter than `[i, j]`. So if you fill the table in *increasing order of length*, every dependency is already computed. If you fill by start index alone, you'd compute `dp[0][5]` before `dp[0][3]`, and the recurrence would read uninitialized values. The "for `len` from 2 to `n`, for `i` from 0 to `n - len`" pattern is not a stylistic choice; it's the only correct order. The base case is `dp[i][i] = 0` (or whatever the length-1 interval value is), set explicitly before the loop.

**Complexity.** `O(n³)` — `n²` intervals, `O(n)` split choices per interval. This is provably necessary for the general matrix-chain problem (the answer depends on the chain structure, and there are `n³` relevant states). For specific problems you can sometimes do better: matrix chain can be `O(n²)` with Knuth's optimization if the quadrangle inequality holds; palindrome partitioning is `O(n²)` if you preprocess palindrome substrings; but the general interval DP pattern is `O(n³)`. The constraint lens: if `n > 1000`, the general form is too slow — look for the specific optimization for your problem.

🔬 **Section Challenge — Interval DP**

**Challenge 1 (Reasoning, 8 min):** For burst balloons, why do we add `arr[0] = arr[n+1] = 1` (the boundary sentinels) instead of just using `nums` directly? What goes wrong if you skip them?

<details><summary>Answer</summary>

The recurrence uses `arr[left - 1]` and `arr[right + 1]` as the neighbors of the last-burst balloon. When `left = 1` (the first real balloon) or `right = n` (the last real balloon), `left - 1 = 0` or `right + 1 = n + 1` — these indices must be valid, or you get an out-of-bounds access. The natural values to use are `1` (a balloon with 0 coins gained when burst, since `1 * x * 1 = x` — it neither helps nor hurts). Without the sentinels, you'd either special-case the boundary (ugly, error-prone) or skip valid first/last bursts (wrong answer).

The deeper reason: the sentinel values represent the *implicit* neighbors of the end balloons. If you imagine the array laid out as `[..., 1, nums[0], nums[1], ..., nums[n-1], 1, ...]`, then bursting `nums[0]` last in any interval that includes the left edge gives coins `1 * nums[0] * (right neighbor)` — correctly accounting for the fact that there's nothing to the left of `nums[0]` in the original array.

Same trick appears in longest palindromic subsequence (pad with dummy characters), word break (empty string prefix), and many DP problems where the boundary state needs a "do nothing" placeholder.

</details>

**Challenge 2 (Derivation, 10 min):** Palindrome partitioning minimum cuts: `s = "aab"`. The minimum number of cuts to partition `s` into palindromes is 1 (cut after position 1: `"aa" | "b"`). Trace the interval DP and explain why the recurrence is:

```
dp[i] = min over j in [0, i) of [ dp[j] + 1 ]   where s[j..i] is a palindrome
```

i.e., why iterating `j` backwards (not `dp[i][k]` style) works here.

<details><summary>Answer</summary>

The recurrence is 1D, not 2D. It works because palindrome partitioning has a different optimal-substructure shape than matrix chain: the *last cut* in any partition of `s[0..i]` lands at some position `j` such that `s[j..i]` is a palindrome. Everything before `j` is `s[0..j-1]`, which needs `dp[j-1]` cuts (using 0-indexed) or `dp[j]` cuts with the convention that `dp[0] = 0` (empty string needs 0 cuts).

So `dp[i] = min over j of [ dp[j] + 1 ]` where `s[j+1..i]` is a palindrome. Equivalently (and more commonly coded): `dp[i] = min over j of [ dp[j] + 1 ]` where `s[j..i]` is a palindrome, with `dp[-1] = 0` or `dp[0] = 0` as the base.

Why 1D instead of 2D: the answer for `s[0..i]` depends on the answer for `s[0..j-1]` (a *prefix*, not an arbitrary sub-interval). This makes it a linear DP, not an interval DP, even though it touches intervals. The "interval" part is just in *checking which substrings are palindromes*, not in the DP recurrence itself.

Contrast with matrix chain: there, the answer for `[i, j]` depends on `[i, k]` AND `[k+1, j]` (two independent sub-intervals), so it's 2D. For palindrome partitioning, the answer for `s[0..i]` depends on `s[0..j-1]` only — the suffix `s[j..i]` is the *cut piece*, not a sub-problem.

So the heuristic for "is this interval DP or linear DP?": if the optimal substructure splits the interval into two independent sub-intervals (matrix chain, burst balloons, optimal BST), it's interval DP with `dp[i][j]`. If the optimal substructure fixes a "last cut" and depends on a *prefix* (palindrome partitioning, word break), it's linear DP with `dp[i]`.

</details>




## Pattern 4: Tree DP

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

### Why Tree DP Works — and the Reroot Technique That Makes O(n²) Problems O(n)

The House Robber III code above computes an answer for a single root. Most tree DP problems stop there. But a huge class of problems — "for each node, compute the answer as if it were the root" — is *naively* O(n²): re-do the whole DP at every root. The reroot technique reduces this to O(n) total. It's the most useful tree DP technique after the basic post-order, and almost no textbook teaches it cleanly.

**Why tree DP works at all.** The structural reason is the same one that makes divide-and-conquer work: **subtrees are independent sub-problems**. A tree has no cycles, so the subtree rooted at any node shares no edges with the rest of the tree. This means: the optimal answer for the subtree rooted at `node` depends only on the answers for the subtrees rooted at `node`'s children — not on anything above `node`. That's the optimal-substructure property, and it lets you compute answers bottom-up (post-order DFS) just like interval DP lets you compute answers by length. The recursion is `dp[node] = f(dp[child1], dp[child2], ..., node.val)`.

**The "post-order first" rule.** Every tree DP starts with a post-order DFS that computes children's answers before the parent's. The invariant: when you're computing `dp[node]`, the values `dp[child]` for all children are already settled. This is the tree analogue of "fill the DP table in increasing order of interval length" from interval DP — same idea, different partial order (ancestor-of vs sub-interval-of).

**The two-state [0/1] pattern (House Robber III).** When the choice at a node is "include me or don't," the natural state is `dp[node][0]` (don't include) and `dp[node][1]` (include). The recurrence:
- `dp[node][1] = node.val + Σ dp[child][0]` (if I include myself, my children cannot be)
- `dp[node][0] = Σ max(dp[child][0], dp[child][1])` (if I don't include, each child can choose optimally)

This same pattern handles: independent set on trees, vertex cover, "minimum dominating set," and any problem where the constraint between adjacent nodes is "at most one can be selected." The two states encode "I'm in the answer" vs "I'm not" — the transition rules encode the constraint. Once you see the pattern, you can re-derive the recurrence for any such problem in 30 seconds: write down the two states, write the constraints, and the recurrence falls out.

**The reroot DP technique — the killer app.** Many problems ask: "for every node, compute the answer if the tree were rooted at that node." Examples:
- "For every node, sum of distances to all other nodes"
- "For every node, number of subtrees rooted at that node with some property"
- "For every node, maximum path sum starting from that node"

Naive: do a full DP at every root. That's O(n) DP per root × n roots = **O(n²)**. For `n = 10^5`, that's `10^10` — impossible.

The reroot trick: do the DP **once**, then compute "what changes when I move the root from `parent` to `child`?" in O(1). Iterate this across all edges → O(n) total.

The general form:
1. **First pass (post-order from an arbitrary root `r`):** compute `dp_down[node]` = answer for the subtree rooted at `node` going *down*. This is the "standard" tree DP.
2. **Second pass (pre-order / reroot pass):** compute `dp_all[node]` = answer for the entire tree as if rooted at `node`. Start with `dp_all[r] = dp_down[r]` (no contribution from above `r` since it doesn't exist). Then for each edge `parent → child`, compute:

```
dp_all[child] = combine(
    dp_down[child],                                    // child's subtree (already known)
    contribution from parent's side, excluding child   // the "rest of the tree"
)
```

The "contribution from parent's side excluding child" is the hard part. For the "sum of distances" problem, if moving the root from `parent` to `child` shifts every node in `parent`'s subtree (excluding child's subtree) one step further from the new root, and every node in child's subtree one step closer:

```
dp_all[child] = dp_all[parent]
              + (n - size[child])    // nodes now 1 step further
              - size[child]          // nodes now 1 step closer
```

Where `size[child]` is the size of child's subtree (computed in pass 1). This is the classic "reroot to compute all distances in O(n)" technique that solves LeetCode 834 (Sum of Distances in Tree) and many tree-CF problems.

**The invariant for reroot DP.** After pass 1: `dp_down[node]` is correct for the subtree at `node`. After pass 2: `dp_all[node]` is correct for the whole tree rooted at `node`. The transition from `dp_all[parent]` to `dp_all[child]` uses only values that are already computed (post-order ensures `size[]` and `dp_down[]` are known; pre-order ensures `dp_all[parent]` is known before its children). So the entire algorithm runs in O(n) — one DFS for each pass.

**When tree DP fails.** Trees are acyclic, so:
- If your structure has cycles (graph, not tree), tree DP doesn't directly apply. You need to either pick a spanning tree and handle back-edges, or use a different DP (e.g., on DAGs).
- If your "tree" is actually a forest (multiple components), root each tree separately and combine.
- If the answer depends on the global structure in a way that's not decomposable by subtree (rare), reroot won't help.

🔬 **Section Challenge — Tree DP**

**Challenge 1 (Pattern Recognition, 5 min):** Which tree DP pattern applies to "minimum vertex cover on a tree"? The state, the recurrence, and the base case. (Vertex cover = smallest set of vertices such that every edge has at least one endpoint in the set.)

<details><summary>Answer</summary>

The two-state [0/1] pattern applies directly:
- `dp[node][1]` = minimum vertex cover of subtree at `node` when `node` IS in the cover
- `dp[node][0]` = minimum vertex cover of subtree at `node` when `node` is NOT in the cover

Recurrence:
- `dp[node][1] = 1 + Σ dp[child][0]` (if `node` is in the cover, every edge `(node, child)` is already covered, so children are free to be excluded — but children still need their *other* edges covered, which means each child's subtree must be covered *as if* the child is excluded. So children must contribute `dp[child][0]`.)
- `dp[node][0] = Σ min(dp[child][0], dp[child][1])` (if `node` is NOT in the cover, every edge `(node, child)` must be covered by the child, so each child must be in the cover OR have all its own edges covered by its descendants. Either way, the child's subtree needs an optimal cover, which is `min(dp[child][0], dp[child][1])`.)

Base case: leaf node, `dp[leaf][0] = 0`, `dp[leaf][1] = 1`.

Final answer: `min(dp[root][0], dp[root][1])`.

This is a textbook problem and the pattern generalizes: any "binary choice per node with adjacency constraint" maps to this two-state form. The constraint you encode determines the recurrence — the structure is the same.

</details>

**Challenge 2 (Reroot Reasoning, 8 min):** For the "sum of distances to all other nodes" problem on a tree (LeetCode 834), the reroot transition is:

```
dp_all[child] = dp_all[parent] + (n - size[child]) - size[child]
```

where `size[child]` is the size of child's subtree when rooted at `parent`. Explain the two terms `(n - size[child])` and `-size[child]` — what does each represent, and why is one added and one subtracted?

<details><summary>Answer</summary>

Imagine we move the root from `parent` to `child`. Every node's distance to the new root changes by +1 or -1:
- Nodes in `child`'s subtree (size `size[child]`): their distance to `child` is 1 less than their distance to `parent` (because the path to `child` goes through one fewer edge — the edge from `parent` to `child` is now "down" instead of "up"). So each of these `size[child]` nodes contributes `-1` to the total distance sum.
- Nodes *outside* `child`'s subtree (i.e., everywhere else in the tree, count = `n - size[child]`): their distance to `child` is 1 more than their distance to `parent` (because the path now goes through `parent → child`, adding one edge). So each of these `n - size[child]` nodes contributes `+1` to the total.

Total change in distance sum = `(+1) × (n - size[child]) + (-1) × size[child]` = `(n - size[child]) - size[child]`.

So `dp_all[child] = dp_all[parent] + (n - size[child]) - size[child]`.

This works because the *tree structure* (set of edges, parent-child relationships) doesn't change when you reroot — only the "direction" of each edge flips if you cross the new root. The size of each subtree is well-defined given the original arbitrary root. The transition is O(1) because it only needs `size[child]` (already computed in pass 1) and `dp_all[parent]` (already computed in pass 2 by the time we process this edge).

This is why the reroot trick is O(n) total: O(n) for pass 1 (sizes + `dp_down`), O(n) for pass 2 (one O(1) transition per edge). Compare to the naive O(n²) of recomputing at every root.

</details>


## Pattern 5: DP with Monotonic Optimization

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

> **Reader's note:** The Digit DP, Bitmask DP, Interval DP, and Tree DP
> sections below are **template-style recaps** — quick-reference code for
> contests. For the deep derivations (why bitmask DP forces 2^n states,
> the "burst last" trick, the reroot technique), see Parts 1–3 above.
>
> **Unique content in this section** (not covered above):
> - Interval DP → "Minimum Cost to Cut a Stick" example, Decision Guide table
> - **Convex Hull Trick** (optimizing linear DP transitions)
> - **Divide & Conquer DP Optimization** (when opt[i] is monotone)
> - **Broken Profile DP** (tiling/grid problems with bitmask rows)

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║          ADVANCED DYNAMIC PROGRAMMING - COMPETITIVE PROGRAMMING LEVEL            ║
╠══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                  ║
║  This section covers advanced DP patterns used in:                               ║
║  • Competitive programming (Codeforces, ICPC, IOI)                               ║
║  • Technical interviews at top companies                                         ║
║  • Real-world optimization problems                                              ║
║                                                                                  ║
╚══════════════════════════════════════════════════════════════════════════════════╝

## DIGIT DP - COUNTING NUMBERS WITH PROPERTIES

┌─────────────────────────────────────────────────────────────────────────────────┐
│                    DIGIT DP - THE PATTERN                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  PROBLEM TYPE: Count numbers in range [L, R] with some digit property           │
│  Examples:                                                                      │
│  • Count numbers with digit sum = K                                             │
│  • Count numbers without repeated digits                                        │
│  • Count numbers divisible by D                                                 │
│                                                                                 │
│  KEY IDEA: Build number digit by digit, tracking:                               │
│  • Position (which digit we're placing)                                         │
│  • Tight bound (are we still bounded by limit?)                                 │
│  • Problem-specific state (sum, remainder, etc.)                                │
│                                                                                 │
│                                                                                 │
│  TEMPLATE:                                                                      │
│  ───────────                                                                    │
```

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
```

```
│ │
│ │
│ EXAMPLE: Count numbers 1 to N with no repeated adjacent digits │
│ ───────────────────────────────────────────────────────────── │
```

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

```
│ │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## ⚡ Bitmask DP — Subset State Tracking

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ BITMASK DP - COMPLETE GUIDE                                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ WHEN TO USE: Small n (≤ 20), need to track which elements are "used"            │
│                                                                                 │
│ BITMASK OPERATIONS:                                                             │
│ ┌──────────────────────────────────────────────────────────────────────────┐    │
│ │ Operation │ Code │ Example │                                                  │
│ ├────────────────────────────┼─────────────────────┼───────────────────────┤    │
│ │ Check if bit i is set │ (mask >> i) & 1 │ mask=5: bit 0,2 set │               │
│ │ Set bit i │ mask | (1 << i) │ 5|2=7 (set bit 1) │                             │
│ │ Clear bit i │ mask & ~(1 << i) │ 7&~2=5 (clear bit 1) │                       │
│ │ Toggle bit i │ mask ^ (1 << i) │ 5^4=1 (toggle bit 2) │                       │
│ │ Count set bits │ Integer.bitCount() │ bitCount(5)=2 │                         │
│ │ Lowest set bit │ mask & (-mask) │ 12&(-12)=4 │                                │
│ │ Clear lowest set bit │ mask & (mask-1) │ 12&11=8 │                            │
│ │ Check if power of 2 │ (mask & (mask-1))==0│ isPow2(8)=true │                  │
│ │ Iterate all subsets of mask│ See code below │ │                               │
│ └──────────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
│                                                                                 │
│ TRAVELING SALESMAN PROBLEM (TSP):                                               │
│ ──────────────────────────────────                                              │
```

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

```
│ │
│ │
│ ITERATING OVER ALL SUBSETS OF A MASK: │
│ ───────────────────────────────────── │
```

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

```
│ │
│ │
│ ASSIGNMENT PROBLEM (HUNGARIAN ALTERNATIVE): │
│ ─────────────────────────────────────────── │
```

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

```
│ │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 📌 Interval DP — Optimal Substructure on Ranges

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ INTERVAL DP - THE PATTERN                                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ WHEN TO USE: Optimal solution for range [i,j] depends on smaller ranges         │
│                                                                                 │
│ CLASSIC PROBLEMS:                                                               │
│ • Matrix chain multiplication                                                   │
│ • Optimal BST                                                                   │
│ • Palindrome partitioning                                                       │
│ • Burst balloons                                                                │
│ • Stone game                                                                    │
│                                                                                 │
│                                                                                 │
│ TEMPLATE:                                                                       │
│ ───────────                                                                     │
```

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

```
│ │
│ │
│ MATRIX CHAIN MULTIPLICATION: │
│ ──────────────────────────── │
```

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

```
│ │
│ │
│ BURST BALLOONS (LeetCode 312): │
│ ────────────────────────────── │
```

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

```
│ │
│ │
│ MINIMUM COST TO CUT A STICK (LeetCode 1547): │
│ ──────────────────────────────────────────── │
```

```java
// Given stick of length n, cuts[] = positions to cut at.
// Cost of a cut = length of the stick piece being cut.
// Find minimum total cost to make all cuts.
int minCost(int n, int[] cuts) {
    Arrays.sort(cuts);
    int m = cuts.length;

    // Add boundaries: [0, cuts[0], cuts[1], ..., cuts[m-1], n]
    int[] c = new int[m + 2];
    c[0] = 0; c[m + 1] = n;
    for (int i = 0; i < m; i++) c[i + 1] = cuts[i];

    // dp[i][j] = min cost to cut stick from c[i] to c[j]
    int[][] dp = new int[m + 2][m + 2];

    for (int len = 2; len <= m + 1; len++) {      // Gap between endpoints
        for (int i = 0; i + len <= m + 1; i++) {
            int j = i + len;
            dp[i][j] = Integer.MAX_VALUE;

            for (int k = i + 1; k < j; k++) {     // Try each cut point
                dp[i][j] = Math.min(dp[i][j],
                    dp[i][k] + dp[k][j] + (c[j] - c[i]));
                //                       ^^^^^^^^^^^^^^^^^
                //                       cost = stick length being cut
            }
        }
    }

    return dp[0][m + 1];
}
// This is the DUAL of Burst Balloons — same template, different cost!
```

```
│ │
│ │
│ INTERVAL DP DECISION GUIDE: │
│ ──────────────────────────── │
│ │
│ ╔══════════════════════════╦═══════════════════════════════════════╗ │
│ ║ Signal                   ║ It's Interval DP                     ║ │
│ ╠══════════════════════════╬═══════════════════════════════════════╣ │
│ ║ "Merge" or "split"      ║ Matrix chain, cut a stick             ║ │
│ ║ "Remove from ends"      ║ Stone game, burst balloons            ║ │
│ ║ "Optimal over range"    ║ Any [i..j] optimization               ║ │
│ ║ Answer for [i,j] uses   ║ O(n³) — try all split points k       ║ │
│ ║   answers for sub-ranges ║                                      ║ │
│ ╠══════════════════════════╬═══════════════════════════════════════╣ │
│ ║ Trick: "LAST to remove" ║ Burst Balloons thinking               ║ │
│ ║ Trick: add boundaries   ║ +1 at ends (balloons, cut a stick)    ║ │
│ ║ Loop order              ║ ALWAYS by increasing length            ║ │
│ ╚══════════════════════════╩═══════════════════════════════════════╝ │
│ │
│ COMMON MISTAKE: Trying to process left-to-right instead of │
│ by increasing interval length. Interval DP MUST iterate by │
│ length so shorter intervals are solved before longer ones. │
│ │
│ 📝 CURATED PRACTICE: │
│ 1. Burst Balloons (LC 312) — https://leetcode.com/problems/burst-balloons/ │
│ 2. Min Cost to Cut Stick (LC 1547) — https://leetcode.com/problems/minimum-cost-to-cut-a-stick/ │
│ 3. Stone Game V (LC 1563) — https://leetcode.com/problems/stone-game-v/ │
│ 4. Minimum Score Triangulation (LC 1039) — https://leetcode.com/problems/minimum-score-triangulation-of-polygon/ │
│ 5. Palindrome Partitioning II (LC 132) — https://leetcode.com/problems/palindrome-partitioning-ii/ │
│ 6. Strange Printer (LC 664) — https://leetcode.com/problems/strange-printer/ │
│ 7. Remove Boxes (LC 546) — https://leetcode.com/problems/remove-boxes/ │
│ 8. Minimum Cost Tree From Leaf Values (LC 1130) — https://leetcode.com/problems/minimum-cost-tree-from-leaf-values/ │
│ │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 🌳 DP on Trees

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ TREE DP - THE PATTERN                                                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ WHEN TO USE: Compute optimal values on tree structures                          │
│                                                                                 │
│ KEY INSIGHT: Process children first (post-order), then compute parent           │
│                                                                                 │
│                                                                                 │
│ BASIC TREE DP - MAXIMUM INDEPENDENT SET:                                        │
│ ─────────────────────────────────────────                                       │
```

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

```
│ │
│ │
│ TREE DIAMETER: │
│ ────────────── │
```

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

```
│ │
│ │
│ REROOTING TECHNIQUE (for all-roots DP): │
│ ───────────────────────────────────────── │
```

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

```
│ │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## ⚡ DP Optimizations — Convex Hull Trick

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ CONVEX HULL TRICK (CHT)                                                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ WHEN TO USE: Recurrence of form dp[i] = min(dp[j] + b[j] _ a[i]) for j < i      │
│ Reduces O(n²) to O(n) or O(n log n)                                             │
│                                                                                 │
│ CONDITIONS:                                                                     │
│ • Slopes b[j] are monotonic                                                     │
│ • Query values a[i] are monotonic                                               │
│ • Want minimum (or can convert to minimum)                                      │
│                                                                                 │
│                                                                                 │
│ INTUITION:                                                                      │
│ ───────────                                                                     │
│ Each j gives a line: y = b[j] _ x + dp[j]                                       │
│ Query for x = a[i]: find line with minimum y                                    │
│ Maintain lower convex hull of lines                                             │
│                                                                                 │
│ VISUALIZATION:                                                                  │
│ y │                                                                             │
│ │ ╱ line 3 (b=4)                                                                │
│ │ ╱                                                                             │
│ │╱ ╱ line 2 (b=2)                                                               │
│ │ ╱                                                                             │
│ │ ╱ ╱ line 1 (b=1)                                                              │
│ │ ╱ ╱                                                                           │
│ │ ╱ ╱                                                                           │
│ │╱──╱───────────────── x                                                        │
│ ╱╲                                                                              │
│ ╱ ╲ Convex hull (only these lines can be optimal)                               │
│                                                                                 │
│                                                                                 │
│ IMPLEMENTATION (monotonic slopes and queries):                                  │
│ ─────────────────────────────────────────────                                   │
```

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

```
│ │
│ COMPLEXITY: │
│ • Amortized O(1) per addLine and query if both are monotonic │
│ • O(log n) per query with binary search if queries not monotonic │
│ │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## ⚡ Divide and Conquer DP Optimization

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ DIVIDE AND CONQUER DP                                                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ WHEN TO USE: dp[i][j] = min(dp[i-1][k] + cost(k+1, j)) for k < j                │
│ And: optimal k for j₁ ≤ optimal k for j₂ when j₁ < j₂                           │
│ (This is the "monotonicity of optimal splits" property)                         │
│                                                                                 │
│ Reduces O(n × m × n) to O(n × m × log n)                                        │
│                                                                                 │
│                                                                                 │
│ IMPLEMENTATION:                                                                 │
│ ───────────────                                                                 │
```

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

```
│ │
│ │
│ EXAMPLE: Partition array into k subarrays, minimize max sum │
│ ────────────────────────────────────────────────────────── │
```

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

```
│ │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 📌 Broken Profile DP (plug DP)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ BROKEN PROFILE DP - GRID TILING                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ WHEN TO USE: Tiling problems on small grids (width ≤ 20)                        │
│ • Count ways to tile grid with dominoes                                         │
│ • Place non-attacking pieces                                                    │
│ • Grid coloring with adjacent constraints                                       │
│                                                                                 │
│                                                                                 │
│ CONCEPT: Track "profile" (pattern of filled cells at boundary)                  │
│ ─────────────────────────────────────────────────────────────                   │
│                                                                                 │
│ Grid (3×4): Profile after processing cell (1,2):                                │
│ ┌───┬───┬───┬───┐ ┌───┬───┬───┬───┐                                             │
│ │ ✓ │ ✓ │ ✓ │ │ │ ✓ │ ✓ │ ✓ │ │                                                 │
│ ├───┼───┼───┼───┤ ├───┼───╔═══╗───┤                                             │
│ │ ✓ │ ✓ │▐▌ │ │ ← here │ ✓ │ ✓ ║ ? ║ │ ← profile = mask of '?'                  │
│ ├───┼───┼───┼───┤ ├───┼───╚═══╝───┤ cells just below boundary                   │
│ │ │ │ │ │ │ │ │ │ │                                                             │
│ └───┴───┴───┴───┘ └───┴───┴───┴───┘                                             │
│                                                                                 │
│ Profile = bitmask of m bits (grid width)                                        │
│ Bit i set = cell above current in column i is filled                            │
│                                                                                 │
│                                                                                 │
│ DOMINO TILING (count ways to tile n×m grid with 1×2 dominoes):                  │
│ ──────────────────────────────────────────────────────────────                  │
```

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

```
│ │
│ Time: O(m × n × 2^n) │
│ Space: O(2^n) │
│ Practical for n ≤ 15-20 │
│ │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 🎨 DP Pattern Quick Reference

DP PATTERNS QUICK REFERENCE

```
──────────────────────────────────────────────────


## Pattern │ Signal │ Time │ Space

| Linear DP | One sequence | O(n) | O(1) to O(n) |
| Two-sequence DP | Compare two strings | O(nm) | O(m) with rolling |
| Interval DP | Range [i,j] optimal | O(n³) | O(n²) |
| Tree DP | Tree structure | O(n) | O(n) |
| Bitmask DP | n ≤ 20, subsets | O(2ⁿ × n) | O(2ⁿ) |
| Digit DP | Count in range [L,R] | O(d × s) | O(d × s) |
| Broken Profile | Grid, width ≤ 20 | O(nm × 2ᵐ)| O(2ᵐ) |
| D&C Optimization | Monotonic opt split | O(nm log n)| O(nm) |
| Convex Hull Trick| Linear transition | O(n) | O(n) |
| Knuth Optimization|Quadratic → near-linear | O(n²) | O(n²) |

---

_DP is not about memorizing solutions - it's about SEEING the substructure!_
```

---

## PRACTICE PROBLEMS — Dynamic Programming (Progressive)

### Level 1: 1D DP (Start Here)

| #   | Problem                        | Difficulty | Source | DP Type                       |
| --- | ------------------------------ | ---------- | ------ | ----------------------------- |
| 1   | Climbing Stairs                | Easy       | LC 70  | Fibonacci variant             |
| 2   | House Robber                   | Medium     | LC 198 | Take/skip                     |
| 3   | Min Cost Climbing Stairs       | Easy       | LC 746 | Forward/backward DP           |
| 4   | Maximum Subarray               | Medium     | LC 53  | Kadane's                      |
| 5   | Decode Ways                    | Medium     | LC 91  | String DP                     |
| 6   | Coin Change                    | Medium     | LC 322 | Unbounded knapsack            |
| 7   | Longest Increasing Subsequence | Medium     | LC 300 | LIS (O(n log n) optimization) |
| 8   | Word Break                     | Medium     | LC 139 | Prefix matching DP            |
| 9   | Perfect Squares                | Medium     | LC 279 | Min decomposition             |
| 10  | Jump Game                      | Medium     | LC 55  | Greedy or DP                  |

### Level 2: 2D DP

| #   | Problem                         | Difficulty | Source  | DP Type             |
| --- | ------------------------------- | ---------- | ------- | ------------------- |
| 1   | Unique Paths                    | Medium     | LC 62   | Grid DP             |
| 2   | Minimum Path Sum                | Medium     | LC 64   | Grid DP             |
| 3   | Longest Common Subsequence      | Medium     | LC 1143 | Classic LCS         |
| 4   | Edit Distance                   | Medium     | LC 72   | String to string    |
| 5   | 0/1 Knapsack                    | Medium     | Classic | Weight/value table  |
| 6   | Coin Change 2                   | Medium     | LC 518  | Count combinations  |
| 7   | Target Sum                      | Medium     | LC 494  | Subset sum variant  |
| 8   | Interleaving String             | Medium     | LC 97   | Two-string matching |
| 9   | Maximal Square                  | Medium     | LC 221  | 2D min expansion    |
| 10  | Longest Palindromic Subsequence | Medium     | LC 516  | Reverse + LCS       |

### Level 3: Advanced DP

| #   | Problem                              | Difficulty | Source  | DP Type                   |
| --- | ------------------------------------ | ---------- | ------- | ------------------------- |
| 1   | Longest Palindromic Substring        | Medium     | LC 5    | Expand center or DP       |
| 2   | Regular Expression Matching          | Hard       | LC 10   | Two-string with wildcards |
| 3   | Burst Balloons                       | Hard       | LC 312  | Interval DP               |
| 4   | Partition Equal Subset Sum           | Medium     | LC 416  | Subset sum                |
| 5   | House Robber III                     | Medium     | LC 337  | Tree DP                   |
| 6   | Stone Game                           | Medium     | LC 877  | Game theory DP            |
| 7   | Minimum Cost to Cut a Stick          | Hard       | LC 1547 | Interval DP               |
| 8   | Distinct Subsequences                | Hard       | LC 115  | Counting DP               |
| 9   | Best Time Buy Sell Stock w/ Cooldown | Medium     | LC 309  | State machine DP          |
| 10  | Palindrome Partitioning II           | Hard       | LC 132  | Min cuts DP               |

**Hidden Gems:**

| Problem                          | Source | Why It's Great                              |
| -------------------------------- | ------ | ------------------------------------------- |
| Minimum Falling Path Sum         | LC 931 | Simple 2D DP — great for building intuition |
| Delete Operation for Two Strings | LC 583 | LCS variant — easier entry to edit distance |
| Ones and Zeroes                  | LC 474 | 2D knapsack with two weight dimensions      |
| Maximum Length of Pair Chain     | LC 646 | Greedy or DP — compare both approaches      |
| Largest Divisible Subset         | LC 368 | LIS variant with divisibility               |
| Counting Bits                    | LC 338 | DP on bits — beautiful O(n) pattern         |

---

## Proof Corner — Optimal Substructure and DP Correctness

**Claim**: The 2D grid shortest-path DP `dp[i][j] = grid[i][j] + min(dp[i-1][j], dp[i][j-1])` computes the minimum-cost path from (0,0) to (i,j).

**Proof by strong induction on i+j**:

- **Base** (i+j=0): `dp[0][0] = grid[0][0]`. The only path is the cell itself. Correct.
- **Inductive step**: Assume dp is correct for all cells (r,c) with r+c < i+j. Any path to (i,j) arrives from (i-1,j) or (i,j-1). By the inductive hypothesis both `dp[i-1][j]` and `dp[i][j-1]` are the minimum-cost paths to those cells. Taking the min and adding `grid[i][j]` gives the optimal. QED.

**Why this matters**: The argument generalises to all "prefix-suffix" DP (LCS, Edit Distance, Matrix Chain): the optimal answer for a sub-range depends only on optimal answers for strictly smaller sub-ranges — the optimal-substructure property.

**Knapsack 0/1 loop-invariant**: After processing items 1..i with capacity w, `dp[i][w]` = maximum value using a subset of items {1..i} with total weight ≤ w.

- *Init*: `dp[0][w] = 0` for all w — no items, no value.
- *Maintenance*: `dp[i][w] = max(dp[i-1][w], dp[i-1][w - weight[i]] + value[i])` — either skip item i (use same previous row) or take it (reduce capacity).
- *Termination*: `dp[n][W]` holds the answer for all n items, capacity W.

**Backward inner loop correctness**: In the 1D rolling array, scanning `w` from W down to `weight[i]` ensures each item is used at most once: when we update `dp[w]`, `dp[w - weight[i]]` still reflects the state *before* item i was considered.

---

## When Advanced DP Breaks

**1. Wrong state dimensionality** — adding a state variable that depends on the *output* of the DP, not just the *input*. Example: trying to encode "which items were chosen" in the state blows up to O(2^n) states. Fix: traceback through `dp[][]` after computing the answer.

**2. Unbounded vs 0/1 loop direction** — using forward inner loop (`w = weight[i] to W`) for a 0/1 knapsack lets item i contribute multiple times, accidentally solving the unbounded variant. The subtle symptom: "I can take 3 of item 2" on a test with repeated values.

**3. HashMap with mutable/array keys** — `Map<int[], Integer>` uses reference equality in Java, so two `new int[]{1,2}` keys never match. Fix: `Arrays.toString(arr)` as key, or encode as a long (if dimensions allow).

**4. Base-case off-by-one in string DP** — LCS/Edit Distance uses 1-indexed strings over a (n+1)×(m+1) table with row/col 0 = empty string. Forgetting to initialise `dp[i][0] = i` (delete i characters) breaks the edit-distance base case.

**5. Integer overflow in counting DP** — "count the number of ways" problems easily overflow int (LC 91, LC 70). Use `long`; if mod is required, apply `% MOD` at every addition, not just at the end.

---

## Reference Anchor

**Apache Commons Text — LevenshteinDistance**:
```java
// commons-text 1.10: org.apache.commons.text.similarity.LevenshteinDistance
// Uses O(min(m,n)) rolling-array — exactly the 1D knapsack trick applied to edit distance
LevenshteinDistance ld = LevenshteinDistance.getDefaultInstance();
int dist = ld.apply("kitten", "sitting"); // 3
// Source: commons-text/src/main/java/org/apache/commons/text/similarity/LevenshteinDistance.java
// Key invariant: dp[j] at start of outer loop i = edit distance between s1[0..i-1] and s2[0..j-1]
```

**JDK — String.intern() and the LCS/Edit Distance connection**:
```java
// java.lang.String.intern() pools identical strings, so repeated substring comparisons
// in naive O(n^2*m^2) LCS variants use reference equality after interning.
// Modern approach: use dp[i][j] directly on char arrays (no String creation in inner loop).
String a = "ABCBDAB";
char[] ca = a.toCharArray();  // avoid charAt overhead in tight loops
```

**JDK — Arrays.fill for DP initialisation**:
```java
int[][] dp = new int[n+1][m+1];
// Fill entire 2D array with -1 for memoization:
for (int[] row : dp) Arrays.fill(row, -1);
```

---

## Brute Force to Optimal

| Problem | Brute Force | Why Slow | DP Solution | Complexity |
|---------|-------------|----------|-------------|------------|
| 0/1 Knapsack | Try all 2^n subsets | Exponential | 1D rolling dp[w] | O(n·W) |
| LCS | Try all 2^n subsequences of s1 | Exponential | dp[i][j] = LCS of s1[0..i], s2[0..j] | O(nm) |
| Edit Distance | Try all edit sequences (exponential) | Exponential | dp[i][j] via 3-way recurrence | O(nm) |
| Fibonacci | Naive recursion — 2^n calls | O(2^n) | Bottom-up dp[i] = dp[i-1]+dp[i-2] | O(n) |
| Matrix Chain | Try all n! orderings | O(n!) | Interval DP dp[i][j] = min over k | O(n^3) |

**The structural insight**: brute force fails when sub-problems *overlap* (same (i,j) computed many times). DP trades time for space by storing sub-problem answers. When sub-problems don't overlap, divide-and-conquer without memoization is sufficient.
