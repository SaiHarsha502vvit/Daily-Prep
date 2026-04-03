# Day 11 - Recursion and Backtracking (Reasoning-First Notes)

## Daily Problem Set
1. LeetCode Premium: 254 - Factor Combinations
2. LeetCode Medium: 39 - Combination Sum
3. Codeforces: 550B - Preparing Olympiad
4. Codeforces: 1552D - Array Differentiation

## Problem Links
- LC 254 (Premium): Locked on LeetCode (no public official statement page)
- LC 39: https://leetcode.com/problems/combination-sum/
- CF 550B: https://codeforces.com/problemset/problem/550/B
- CF 1552D: https://codeforces.com/problemset/problem/1552/D

## Why This Day Matters
Recursion is controlled search. Backtracking is recursion plus validity pruning.

---

## Problem 1 - LC 254 (Premium): Factor Combinations

### Problem Statement
Return all unique combinations of factors (excluding 1 and n) whose product is `n`.

### Why This DS/Algo
- We need all combinations, not one answer.
- Search tree over factor choices is natural with recursion.
- Non-decreasing factor constraint avoids duplicates.

### Approach A - Brute Force (Generate all multiplicative partitions)
Huge duplicate space.

### Approach B - Better (DFS with start factor) (pruned)

```java
static List<List<Integer>> factorsBetter(int n) {
    List<List<Integer>> ans = new ArrayList<>();
    dfs(n, 2, new ArrayList<>(), ans);
    return ans;
}

static void dfs(int n, int start, List<Integer> cur, List<List<Integer>> ans) {
    if (n == 1) {
        if (cur.size() > 1) ans.add(new ArrayList<>(cur));
        return;
    }
    for (int f = start; f <= n; f++) {
        if (n % f == 0) {
            cur.add(f);
            dfs(n / f, f, cur, ans);
            cur.remove(cur.size() - 1);
        }
    }
}
```

### Approach C - Optimal (sqrt pruning + add remaining quotient) (faster)
Only iterate factors up to `sqrt(n)`; treat quotient as final factor.

```java
static List<List<Integer>> factorsOptimal(int n) {
    List<List<Integer>> ans = new ArrayList<>();
    backtrack(n, 2, new ArrayList<>(), ans);
    return ans;
}

static void backtrack(int n, int start, List<Integer> cur, List<List<Integer>> ans) {
    for (int f = start; f * f <= n; f++) {
        if (n % f == 0) {
            cur.add(f);
            cur.add(n / f);
            ans.add(new ArrayList<>(cur));
            cur.remove(cur.size() - 1);

            backtrack(n / f, f, cur, ans);
            cur.remove(cur.size() - 1);
        }
    }
}
```

---

## Problem 2 - LC 39: Combination Sum

### Problem Statement
Given distinct candidates and target, return all combinations where chosen numbers sum to target. Reuse allowed.

### Why This DS/Algo
- This is unbounded combination generation.
- DFS branches by pick/skip decisions with monotone index to avoid permutation duplicates.

### Approach A - Brute Force with permutations (duplicates, exponential)

### Approach B - Better (DFS include-repeat) (standard)

```java
static List<List<Integer>> combSumBetter(int[] c, int target) {
    Arrays.sort(c);
    List<List<Integer>> ans = new ArrayList<>();
    dfsComb(c, 0, target, new ArrayList<>(), ans);
    return ans;
}

static void dfsComb(int[] c, int i, int rem, List<Integer> cur, List<List<Integer>> ans) {
    if (rem == 0) { ans.add(new ArrayList<>(cur)); return; }
    if (i == c.length || rem < 0) return;

    cur.add(c[i]);
    dfsComb(c, i, rem - c[i], cur, ans);
    cur.remove(cur.size() - 1);

    dfsComb(c, i + 1, rem, cur, ans);
}
```

### Approach C - Optimal (for-loop DFS + early break) (pruned)

```java
static List<List<Integer>> combSumOptimal(int[] c, int target) {
    Arrays.sort(c);
    List<List<Integer>> ans = new ArrayList<>();
    dfs2(c, 0, target, new ArrayList<>(), ans);
    return ans;
}

static void dfs2(int[] c, int start, int rem, List<Integer> cur, List<List<Integer>> ans) {
    if (rem == 0) { ans.add(new ArrayList<>(cur)); return; }
    for (int i = start; i < c.length; i++) {
        if (c[i] > rem) break;
        cur.add(c[i]);
        dfs2(c, i, rem - c[i], cur, ans);
        cur.remove(cur.size() - 1);
    }
}
```

### Interview Notes
Sort + break pruning is the difference between pass and TLE.

---

## Problem 3 - CF 550B: Preparing Olympiad

### Problem Statement
Count subsets with at least 2 problems, total difficulty in `[L, R]`, and max-min at least `X`.

### Why This DS/Algo
Subset counting with constraints over min/max naturally maps to bitmask/backtracking.

### Approach A - Brute Force bitmask (O(n*2^n), O(1))

```java
static int olympiadBrute(int[] a, int L, int R, int X) {
    int n = a.length, ans = 0;
    for (int mask = 0; mask < (1 << n); mask++) {
        int cnt = 0, sum = 0, mn = Integer.MAX_VALUE, mx = Integer.MIN_VALUE;
        for (int i = 0; i < n; i++) {
            if ((mask & (1 << i)) != 0) {
                cnt++; sum += a[i];
                mn = Math.min(mn, a[i]);
                mx = Math.max(mx, a[i]);
            }
        }
        if (cnt >= 2 && L <= sum && sum <= R && mx - mn >= X) ans++;
    }
    return ans;
}
```

### Approach B - Better (Backtracking with partial sums) (same asymptotic, cleaner)

### Approach C - Optimal
Bitmask/backtracking is accepted optimal for constraints (`n <= 15`).

---

## Problem 4 - CF 1552D: Array Differentiation

### Problem Statement
Can we assign each number sign `-1, 0, +1` so resulting sum is `0` using at least one number?

### Why This DS/Algo
Ternary choice per element gives recursion tree of size `3^n`; with `n <= 10`, exhaustive search is feasible.

### Approach A - Brute Force recursion (O(3^n))

```java
static boolean diffBrute(int[] a) {
    return dfsDiff(a, 0, 0, false);
}

static boolean dfsDiff(int[] a, int i, int sum, boolean used) {
    if (i == a.length) return used && sum == 0;
    if (dfsDiff(a, i + 1, sum, used)) return true;
    if (dfsDiff(a, i + 1, sum + a[i], true)) return true;
    if (dfsDiff(a, i + 1, sum - a[i], true)) return true;
    return false;
}
```

### Approach B - Better (HashSet of reachable sums) (O(n * range))

```java
static boolean diffBetter(int[] a) {
    Set<Integer> cur = new HashSet<>();
    cur.add(0);
    boolean any = false;

    for (int x : a) {
        Set<Integer> nxt = new HashSet<>(cur);
        for (int s : cur) {
            nxt.add(s + x);
            nxt.add(s - x);
        }
        cur = nxt;
        any |= (x != 0);
    }
    return any && cur.contains(0);
}
```

### Approach C - Optimal
Given tiny constraints, DFS with early return is practically optimal.

### Pattern Takeaways
- Backtracking needs an ordering rule or a state constraint to avoid duplicates.
- Feasible exponential algorithms are legitimate when `n` is small.
