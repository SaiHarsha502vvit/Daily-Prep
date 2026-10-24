# PART 11: Advanced DP Patterns

> **Navigation**: [Chapter overview](../04c_DP_Advanced.md) | [Pattern 3: Interval DP →](02_interval_dp.md)
> Page 1 of 7 in **Advanced DP Patterns**


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
```



## Pattern 2: Bitmask DP

```text
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

```text
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
```

---

[Chapter overview](../04c_DP_Advanced.md) | [Pattern 3: Interval DP →](02_interval_dp.md)
