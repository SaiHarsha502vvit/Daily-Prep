# Day 04 - Binary Search and Monotone Decisions (MIT/KTH Style)

## Daily Problem Set
1. LeetCode Premium: 702 - Search in a Sorted Array of Unknown Size
2. LeetCode Medium: 33 - Search in Rotated Sorted Array
3. Codeforces: 706B - Interesting Drink
4. Codeforces: 474B - Worms

## Problem Links
- LC 702 (Premium): Locked on LeetCode (no public official statement page)
- LC 33: https://leetcode.com/problems/search-in-rotated-sorted-array/
- CF 706B: https://codeforces.com/problemset/problem/706/B
- CF 474B: https://codeforces.com/problemset/problem/474/B

## Problem 1 - LC 702 (Premium)

### Problem Restatement
You can access elements only via `reader.get(index)`. The array is sorted ascending and out-of-range access returns a large sentinel value. Find index of target or `-1`.

### Constraints
- Length unknown
- Values sorted ascending

### Sample
Input: `[-1,0,3,5,9,12]`, target `9`  
Output: `4`

### Approach A - Brute Force (Linear Probe) (O(pos), O(1))

```java
interface ArrayReader { int get(int index); }

static int searchBrute(ArrayReader reader, int target) {
    for (int i = 0; i < 1_000_000; i++) {
        int v = reader.get(i);
        if (v == target) return i;
        if (v > target) return -1;
    }
    return -1;
}
```

### Approach B - Better (Exponential Range + Linear Scan) (O(pos), O(1))
Find an upper bound fast, then linearly scan inside bound.

```java
static int searchBetter(ArrayReader reader, int target) {
    int hi = 1;
    while (reader.get(hi) < target) hi <<= 1;
    int lo = hi >> 1;
    for (int i = lo; i <= hi; i++) {
        int v = reader.get(i);
        if (v == target) return i;
        if (v > target) break;
    }
    return -1;
}
```

### Approach C - Optimal (Exponential Range + Binary Search) (O(log pos), O(1))

```java
static int searchOptimal(ArrayReader reader, int target) {
    int lo = 0, hi = 1;
    while (reader.get(hi) < target) {
        lo = hi;
        hi <<= 1;
    }
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        int v = reader.get(mid);
        if (v == target) return mid;
        if (v < target) lo = mid + 1;
        else hi = mid - 1;
    }
    return -1;
}
```

---

## Problem 2 - LC 33: Search in Rotated Sorted Array

### Problem Restatement
Given rotated sorted array with unique values, return index of target or `-1`.

### Constraints
- `1 <= n <= 5000`

### Sample
Input: `nums=[4,5,6,7,0,1,2], target=0`  
Output: `4`

### Approach A - Brute Force (O(n), O(1))

```java
static int rotatedBrute(int[] nums, int target) {
    for (int i = 0; i < nums.length; i++) if (nums[i] == target) return i;
    return -1;
}
```

### Approach B - Better (Find Pivot + Binary Search) (O(log n), O(1))

```java
static int rotatedBetter(int[] nums, int target) {
    int n = nums.length, lo = 0, hi = n - 1;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (nums[mid] > nums[hi]) lo = mid + 1;
        else hi = mid;
    }
    int pivot = lo;

    lo = 0; hi = n - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        int real = (mid + pivot) % n;
        if (nums[real] == target) return real;
        if (nums[real] < target) lo = mid + 1;
        else hi = mid - 1;
    }
    return -1;
}
```

### Approach C - Optimal (Single Binary Search) (O(log n), O(1))

```java
static int rotatedOptimal(int[] nums, int target) {
    int lo = 0, hi = nums.length - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (nums[mid] == target) return mid;

        if (nums[lo] <= nums[mid]) {
            if (nums[lo] <= target && target < nums[mid]) hi = mid - 1;
            else lo = mid + 1;
        } else {
            if (nums[mid] < target && target <= nums[hi]) lo = mid + 1;
            else hi = mid - 1;
        }
    }
    return -1;
}
```

### Interview Notes
- Ask whether duplicates exist. Duplicate version needs modified logic.

---

## Problem 3 - CF 706B: Interesting Drink

### Problem Restatement
Given prices and many queries `x`, output how many shops have price `<= x`.

### Constraints
- `n, q <= 200000`

### Sample
Input prices: `[3,10,8]`, query `x=9`  
Output: `2`

### Approach A - Brute Force (O(nq), O(1))

```java
static int drinkBrute(int[] prices, int x) {
    int c = 0;
    for (int p : prices) if (p <= x) c++;
    return c;
}
```

### Approach B - Better (Sort + Upper Bound) (O((n+q)log n), O(1))

```java
static int drinkBetter(int[] sortedPrices, int x) {
    int lo = 0, hi = sortedPrices.length - 1, ans = -1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (sortedPrices[mid] <= x) { ans = mid; lo = mid + 1; }
        else hi = mid - 1;
    }
    return ans + 1;
}
```

### Approach C - Optimal (Frequency Prefix, bounded value) (O(maxV + q), O(maxV))
If max price bound is practical, build counting prefix.

```java
static int[] buildPricePrefix(int[] prices, int maxV) {
    int[] cnt = new int[maxV + 1];
    for (int p : prices) if (p <= maxV) cnt[p]++;
    for (int i = 1; i <= maxV; i++) cnt[i] += cnt[i - 1];
    return cnt;
}

static int drinkOptimal(int[] pref, int x) {
    if (x < 0) return 0;
    if (x >= pref.length) return pref[pref.length - 1];
    return pref[x];
}
```

---

## Problem 4 - CF 474B: Worms

### Problem Restatement
Given pile sizes, worm labels are assigned consecutively. For each query `x`, output the pile index containing worm `x`.

### Constraints
- `n, m <= 100000`

### Sample
Piles: `[2,7,3]` gives ranges `[1..2], [3..9], [10..12]`. Query `x=8` -> pile `2`.

### Approach A - Brute Force (O(nq), O(1))
For each query, scan piles cumulatively.

```java
static int wormsBrute(int[] piles, int x) {
    int sum = 0;
    for (int i = 0; i < piles.length; i++) {
        sum += piles[i];
        if (x <= sum) return i + 1;
    }
    return -1;
}
```

### Approach B - Better (Prefix + Lower Bound) (O((n+q)log n), O(n))

```java
static int wormsBetter(int[] pref, int x) {
    int lo = 0, hi = pref.length - 1, ans = pref.length - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (pref[mid] >= x) { ans = mid; hi = mid - 1; }
        else lo = mid + 1;
    }
    return ans + 1;
}
```

### Approach C - Optimal (Offline Sorted Queries) (O(n + q log q), O(q))
Sort queries by `x` and sweep prefix once.

```java
static int[] wormsOptimal(int[] piles, int[] queries) {
    int n = queries.length;
    int[][] qq = new int[n][2];
    for (int i = 0; i < n; i++) { qq[i][0] = queries[i]; qq[i][1] = i; }
    Arrays.sort(qq, Comparator.comparingInt(a -> a[0]));

    int[] ans = new int[n];
    int pile = 0, pref = piles[0];
    for (int[] q : qq) {
        while (pref < q[0]) pref += piles[++pile];
        ans[q[1]] = pile + 1;
    }
    return ans;
}
```

### Pattern Takeaways
- Exponential expansion + binary search for unknown bounds.
- Lower/upper bound binary searches are reusable templates.
