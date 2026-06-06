# Day 02 - Prefix Sum and HashMap (MIT/KTH Style)

## Daily Problem Set
1. LeetCode Premium: 325 - Maximum Size Subarray Sum Equals k
2. LeetCode Medium: 560 - Subarray Sum Equals K
3. Codeforces: 313B - Ilya and Queries
4. Codeforces: 1398C - Good Subarrays

## Problem Links
- LC 325 (Premium): Locked on LeetCode (no public official statement page)
- LC 560: https://leetcode.com/problems/subarray-sum-equals-k/
- CF 313B: https://codeforces.com/problemset/problem/313/B
- CF 1398C: https://codeforces.com/problemset/problem/1398/C

## Problem 1 - LC 325 (Premium): Maximum Size Subarray Sum Equals k

### Problem Restatement
Given integer array `nums` and integer `k`, return the maximum length of a contiguous subarray with sum exactly `k`.

### Constraints
- `1 <= n <= 200000`
- `-10000 <= nums[i] <= 10000`
- `-100000 <= k <= 100000`

### Sample
Input: `nums = [1,-1,5,-2,3], k = 3`  
Output: `4`

### Approach A - Brute Force (O(n^2), O(1))

```java
static int maxLenBrute(int[] nums, int k) {
    int n = nums.length, ans = 0;
    for (int i = 0; i < n; i++) {
        int sum = 0;
        for (int j = i; j < n; j++) {
            sum += nums[j];
            if (sum == k) ans = Math.max(ans, j - i + 1);
        }
    }
    return ans;
}
```

### Approach B - Better (Prefix + Sorting Pairs) (O(n log n), O(n))
Store `(prefix, index)` and try earliest occurrence via sorting/grouping.

```java
static int maxLenBetter(int[] nums, int k) {
    int n = nums.length;
    long[] pref = new long[n + 1];
    for (int i = 1; i <= n; i++) pref[i] = pref[i - 1] + nums[i - 1];

    Map<Long, Integer> first = new HashMap<>();
    int ans = 0;
    for (int i = 0; i <= n; i++) {
        first.putIfAbsent(pref[i], i);
        Integer l = first.get(pref[i] - k);
        if (l != null) ans = Math.max(ans, i - l);
    }
    return ans;
}
```

### Approach C - Optimal (Prefix + First Occurrence HashMap) (O(n), O(n))
Store first index for each prefix sum only once.

```java
static int maxLenOptimal(int[] nums, int k) {
    Map<Integer, Integer> first = new HashMap<>();
    first.put(0, -1);
    int pref = 0, ans = 0;

    for (int i = 0; i < nums.length; i++) {
        pref += nums[i];
        if (first.containsKey(pref - k)) {
            ans = Math.max(ans, i - first.get(pref - k));
        }
        first.putIfAbsent(pref, i);
    }
    return ans;
}
```

### Reasoning
Using first occurrence maximizes length because earlier start index gives longer segment.

---

## Problem 2 - LC 560: Subarray Sum Equals K

### Problem Restatement
Count subarrays with sum equal to `k`.

### Constraints
- `1 <= n <= 20000`
- `-1000 <= nums[i] <= 1000`

### Sample
Input: `nums = [1,1,1], k = 2`  
Output: `2`

### Approach A - Brute Force (O(n^2), O(1))

```java
static int countSubarraysBrute(int[] nums, int k) {
    int n = nums.length, ans = 0;
    for (int i = 0; i < n; i++) {
        int sum = 0;
        for (int j = i; j < n; j++) {
            sum += nums[j];
            if (sum == k) ans++;
        }
    }
    return ans;
}
```

### Approach B - Better (Prefix Array + HashMap) (O(n), O(n))

```java
static int countSubarraysBetter(int[] nums, int k) {
    int n = nums.length;
    int[] pref = new int[n + 1];
    for (int i = 1; i <= n; i++) pref[i] = pref[i - 1] + nums[i - 1];

    Map<Integer, Integer> freq = new HashMap<>();
    int ans = 0;
    for (int p : pref) {
        ans += freq.getOrDefault(p - k, 0);
        freq.put(p, freq.getOrDefault(p, 0) + 1);
    }
    return ans;
}
```

### Approach C - Optimal (Streaming Prefix + HashMap) (O(n), O(n))
One pass, no explicit prefix array.

```java
static int countSubarraysOptimal(int[] nums, int k) {
    Map<Integer, Integer> freq = new HashMap<>();
    freq.put(0, 1);
    int pref = 0, ans = 0;

    for (int x : nums) {
        pref += x;
        ans += freq.getOrDefault(pref - k, 0);
        freq.put(pref, freq.getOrDefault(pref, 0) + 1);
    }
    return ans;
}
```

### Interview Notes
- `freq[0] = 1` is mandatory to count subarrays starting at index `0`.
- Negative numbers break sliding window; prefix + map is the robust pattern.

---

## Problem 3 - CF 313B: Ilya and Queries

### Problem Restatement
Given string `s` and `q` queries `(l, r)` (1-indexed), answer how many positions `i` in `[l, r-1]` satisfy `s[i] == s[i+1]`.

### Constraints
- `|s|, q <= 200000`

### Sample
Input: `s = "..##.."`, query `(1,6)`  
Output: `3`

### Approach A - Brute Force (O(total range), O(1))
For each query, scan from `l` to `r-1`.

```java
static int queryBrute(String s, int l, int r) {
    int ans = 0;
    for (int i = l - 1; i < r - 1; i++) {
        if (s.charAt(i) == s.charAt(i + 1)) ans++;
    }
    return ans;
}
```

### Approach B - Better (Prefix Counts) (O(n + q), O(n))
`pref[i] = equal-adjacent count up to i`.

```java
static int[] buildAdjPrefix(String s) {
    int n = s.length();
    int[] pref = new int[n + 1];
    for (int i = 2; i <= n; i++) {
        pref[i] = pref[i - 1] + (s.charAt(i - 1) == s.charAt(i - 2) ? 1 : 0);
    }
    return pref;
}

static int queryBetter(int[] pref, int l, int r) {
    return pref[r] - pref[l];
}
```

### Approach C - Optimal (Same Formula + Fast IO) (O(n + q), O(n))
Asymptotics are already optimal; practical speed comes from buffered input/output.

### Dry Run
For `s="aabcc"`: adjacency marker is `[1,0,0,1]`, prefix makes each query O(1).

---

## Problem 4 - CF 1398C: Good Subarrays

### Problem Restatement
Given digit string `s`, count subarrays where sum of digits equals subarray length.

### Constraints
- Sum of lengths over tests up to around `2e5`

### Sample
Input: `s = "1203"`  
Output: `4`

### Core Transformation
Let `b[i] = digit[i] - 1`. Then we need subarrays with sum `0` in `b`.

### Approach A - Brute Force (O(n^2), O(1))

```java
static long goodSubarraysBrute(String s) {
    int n = s.length();
    long ans = 0;
    for (int i = 0; i < n; i++) {
        int sum = 0;
        for (int j = i; j < n; j++) {
            sum += s.charAt(j) - '0';
            if (sum == (j - i + 1)) ans++;
        }
    }
    return ans;
}
```

### Approach B - Better (Prefix + Sort Equal Values) (O(n log n), O(n))
Build transformed prefix array, sort, count equal groups.

```java
static long goodSubarraysBetter(String s) {
    int n = s.length();
    long[] pref = new long[n + 1];
    for (int i = 1; i <= n; i++) {
        pref[i] = pref[i - 1] + (s.charAt(i - 1) - '0' - 1);
    }
    Arrays.sort(pref);
    long ans = 0;
    for (int i = 0, j; i <= n; i = j) {
        j = i;
        while (j <= n && pref[j] == pref[i]) j++;
        long c = j - i;
        ans += c * (c - 1) / 2;
    }
    return ans;
}
```

### Approach C - Optimal (Prefix + HashMap Frequency) (O(n), O(n))

```java
static long goodSubarraysOptimal(String s) {
    Map<Long, Long> freq = new HashMap<>();
    long pref = 0, ans = 0;
    freq.put(0L, 1L);

    for (int i = 0; i < s.length(); i++) {
        pref += (s.charAt(i) - '0' - 1);
        long seen = freq.getOrDefault(pref, 0L);
        ans += seen;
        freq.put(pref, seen + 1);
    }
    return ans;
}
```

### Interview Notes
- This is a textbook algebraic reduction problem.
- Counting equal prefix values is the key invariant.
