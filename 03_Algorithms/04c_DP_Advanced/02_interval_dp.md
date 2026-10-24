# Pattern 3: Interval DP

> **Navigation**: [← Advanced DP Patterns](01_advanced_dp_patterns.md) | [Chapter overview](../04c_DP_Advanced.md) | [Pattern 4: Tree DP →](03_tree_dp.md)
> Page 2 of 7 in **Advanced DP Patterns**


```text
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

## Why Interval DP Works — and the Burst Balloons "Burst Last" Trick That Looks Backwards

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

---

[← Advanced DP Patterns](01_advanced_dp_patterns.md) | [Chapter overview](../04c_DP_Advanced.md) | [Pattern 4: Tree DP →](03_tree_dp.md)
