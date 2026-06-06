# Day 05 - Sorting and Intervals (MIT/KTH Style)

## Daily Problem Set
1. LeetCode Premium: 252 - Meeting Rooms
2. LeetCode Medium: 56 - Merge Intervals
3. Codeforces: 1208B - Uniqueness
4. Codeforces: 1490A - Dense Array

## Problem Links
- LC 252 (Premium): Locked on LeetCode (no public official statement page)
- LC 56: https://leetcode.com/problems/merge-intervals/
- CF 1208B: https://codeforces.com/problemset/problem/1208/B
- CF 1490A: https://codeforces.com/problemset/problem/1490/A

## Problem 1 - LC 252 (Premium): Meeting Rooms

### Problem Restatement
Given meeting intervals `[start, end]`, determine if one person can attend all meetings.

### Constraints
- `1 <= n <= 10000`
- `0 <= start < end <= 10^6`

### Sample
Input: `[[0,30],[5,10],[15,20]]`  
Output: `false`

### Approach A - Brute Force (O(n^2), O(1))
Compare all pairs for overlap.

```java
static boolean canAttendBrute(int[][] a) {
    for (int i = 0; i < a.length; i++) {
        for (int j = i + 1; j < a.length; j++) {
            if (Math.max(a[i][0], a[j][0]) < Math.min(a[i][1], a[j][1])) return false;
        }
    }
    return true;
}
```

### Approach B - Better (Sort by Start) (O(n log n), O(1))
Only adjacent intervals in sorted order can conflict.

```java
static boolean canAttendBetter(int[][] a) {
    Arrays.sort(a, Comparator.comparingInt(x -> x[0]));
    for (int i = 1; i < a.length; i++) {
        if (a[i][0] < a[i - 1][1]) return false;
    }
    return true;
}
```

### Approach C - Optimal (Sweep Events) (O(n log n), O(n))
Generalizes to "how many rooms needed".

```java
static boolean canAttendOptimal(int[][] a) {
    int n = a.length;
    int[][] ev = new int[2 * n][2];
    int p = 0;
    for (int[] it : a) {
        ev[p++] = new int[]{it[0], +1};
        ev[p++] = new int[]{it[1], -1};
    }
    Arrays.sort(ev, (x, y) -> x[0] == y[0] ? Integer.compare(x[1], y[1]) : Integer.compare(x[0], y[0]));

    int active = 0;
    for (int[] e : ev) {
        active += e[1];
        if (active > 1) return false;
    }
    return true;
}
```

---

## Problem 2 - LC 56: Merge Intervals

### Problem Restatement
Merge all overlapping intervals and return disjoint merged intervals.

### Constraints
- `1 <= n <= 10000`

### Sample
Input: `[[1,3],[2,6],[8,10],[15,18]]`  
Output: `[[1,6],[8,10],[15,18]]`

### Approach A - Brute Force Merge-Until-Stable (O(n^2), O(n))
Repeatedly find and merge any overlap pair.

```java
static int[][] mergeBrute(int[][] in) {
    List<int[]> list = new ArrayList<>(Arrays.asList(in));
    boolean changed = true;
    while (changed) {
        changed = false;
        outer:
        for (int i = 0; i < list.size(); i++) {
            for (int j = i + 1; j < list.size(); j++) {
                int[] a = list.get(i), b = list.get(j);
                if (Math.max(a[0], b[0]) <= Math.min(a[1], b[1])) {
                    int[] m = new int[]{Math.min(a[0], b[0]), Math.max(a[1], b[1])};
                    list.remove(j); list.remove(i); list.add(m);
                    changed = true;
                    break outer;
                }
            }
        }
    }
    return list.toArray(new int[0][]);
}
```

### Approach B - Better (Sort + Build Answer) (O(n log n), O(n))

```java
static int[][] mergeBetter(int[][] a) {
    Arrays.sort(a, Comparator.comparingInt(x -> x[0]));
    List<int[]> out = new ArrayList<>();
    for (int[] cur : a) {
        if (out.isEmpty() || out.get(out.size() - 1)[1] < cur[0]) out.add(cur.clone());
        else out.get(out.size() - 1)[1] = Math.max(out.get(out.size() - 1)[1], cur[1]);
    }
    return out.toArray(new int[0][]);
}
```

### Approach C - Optimal (In-place Write Pointer) (O(n log n), O(1) extra besides output)

```java
static int[][] mergeOptimal(int[][] a) {
    Arrays.sort(a, Comparator.comparingInt(x -> x[0]));
    int w = 0;
    for (int i = 1; i < a.length; i++) {
        if (a[w][1] < a[i][0]) a[++w] = a[i];
        else a[w][1] = Math.max(a[w][1], a[i][1]);
    }
    return Arrays.copyOf(a, w + 1);
}
```

---

## Problem 3 - CF 1208B: Uniqueness

### Problem Restatement
Remove one contiguous subarray of minimum length so that remaining elements are all distinct.

### Constraints
- `1 <= n <= 2000`

### Sample
Input: `[1,2,3,1,2]`  
Output: `2`

### Approach A - Brute Force (O(n^3), O(n))
Try every removed segment `[l..r]` and validate uniqueness.

```java
static int uniquenessBrute(int[] a) {
    int n = a.length, ans = n;
    for (int l = 0; l < n; l++) {
        for (int r = l; r < n; r++) {
            Set<Integer> s = new HashSet<>();
            boolean ok = true;
            for (int i = 0; i < n; i++) {
                if (i >= l && i <= r) continue;
                if (!s.add(a[i])) { ok = false; break; }
            }
            if (ok) ans = Math.min(ans, r - l + 1);
        }
    }
    return ans;
}
```

### Approach B - Better (Prefix + Suffix Sets) (O(n^2), O(n))
Fix left kept part, grow right kept part while maintaining disjoint uniqueness.

```java
static int uniquenessBetter(int[] a) {
    int n = a.length, ans = n;
    for (int l = 0; l <= n; l++) {
        Set<Integer> left = new HashSet<>();
        boolean okLeft = true;
        for (int i = 0; i < l; i++) if (!left.add(a[i])) okLeft = false;
        if (!okLeft) break;

        Set<Integer> right = new HashSet<>();
        for (int r = n; r >= l; r--) {
            if (r < n && !right.add(a[r])) break;
            boolean disjoint = true;
            for (int x : right) if (left.contains(x)) { disjoint = false; break; }
            if (disjoint) ans = Math.min(ans, r - l);
        }
    }
    return ans;
}
```

### Approach C - Optimal (Two Pointers + Frequency Invariant) (O(n), O(n))
Maintain unique suffix and unique prefix; shrink middle greedily.

```java
static int uniquenessOptimal(int[] a) {
    int n = a.length;
    Map<Integer, Integer> suf = new HashMap<>();
    int r = n;
    while (r > 0 && suf.getOrDefault(a[r - 1], 0) == 0) {
        suf.put(a[r - 1], 1);
        r--;
    }

    int ans = r;
    Set<Integer> pref = new HashSet<>();
    for (int l = 0; l < n; l++) {
        if (!pref.add(a[l])) break;
        while (r < n && suf.containsKey(a[l])) {
            int x = a[r++];
            suf.remove(x);
        }
        ans = Math.min(ans, r - l - 1);
    }
    return ans;
}
```

### Interview Notes
- This is an excellent invariant design problem.
- Always reason in terms of "kept prefix + kept suffix".

---

## Problem 4 - CF 1490A: Dense Array

### Problem Restatement
Insert minimum numbers so each adjacent pair satisfies `max(a,b) <= 2 * min(a,b)`.

### Constraints
- Total `n` over tests up to about `2e5`

### Sample
Input pair: `4 19`  
Output insertions for this pair: `2` (`4,8,16,19`)

### Approach A - Brute Force Simulation (O(insertions), O(1))
Repeatedly insert middle-like values.

```java
static int denseBrutePair(int x, int y) {
    int a = Math.min(x, y), b = Math.max(x, y), add = 0;
    while (b > 2L * a) {
        a *= 2;
        add++;
    }
    return add;
}
```

### Approach B - Better (Apply per Adjacent Pair) (O(n + total insertions), O(1))

```java
static int denseBetter(int[] arr) {
    int ans = 0;
    for (int i = 1; i < arr.length; i++) ans += denseBrutePair(arr[i - 1], arr[i]);
    return ans;
}
```

### Approach C - Optimal (Formula with log2) (O(n), O(1))
For pair `(a,b)` with `a<=b`, additions are `ceil(log2(b/a)) - 1`.

```java
static int denseOptimal(int[] arr) {
    int ans = 0;
    for (int i = 1; i < arr.length; i++) {
        double a = Math.min(arr[i - 1], arr[i]);
        double b = Math.max(arr[i - 1], arr[i]);
        if (b > 2 * a) {
            int need = (int)Math.ceil(Math.log(b / a) / Math.log(2.0)) - 1;
            ans += need;
        }
    }
    return ans;
}
```

### Pattern Takeaways
- Sorting converts overlap problems to local adjacency checks.
- Many CF greedy problems become simple after ratio/invariant reformulation.
