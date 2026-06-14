# Day 07 - Strings and Sliding Window (Reasoning-First Notes)

## Daily Problem Set

1. LeetCode Premium: 340 - Longest Substring with At Most K Distinct Characters
2. LeetCode Medium: 438 - Find All Anagrams in a String
3. Codeforces: 271A - Beautiful Year
4. Codeforces: 1535B - Array Reordering

## Problem Links

- LC 340 (Premium): Locked on LeetCode (no public official statement page)
- LC 438: https://leetcode.com/problems/find-all-anagrams-in-a-string/
- CF 271A: https://codeforces.com/problemset/problem/271/A
- CF 1535B: https://codeforces.com/problemset/problem/1535/B

## Why This Day Matters

String-window problems train one core interview skill: maintain a dynamic invariant while scanning exactly once.

---

## Problem 1 - LC 340 (Premium)

### Problem Statement

Given a string `s` and integer `k`, return the length of the longest substring containing at most `k` distinct characters.

### Constraints

- `1 <= |s| <= 50000`
- `0 <= k <= 50`

### Sample

Input: `s = "eceba", k = 2`  
Output: `3`

### Why This DS/Algo

- We need contiguous substring and dynamic validity (`distinct <= k`).
- HashMap gives current frequency by character in O(1) average.
- Two pointers maintain smallest valid left boundary for each right boundary.

### Approach A - Brute Force (O(n^2), O(alphabet))

Try every start and expand until invalid.

```java
static int kDistinctBrute(String s, int k) {
    int n = s.length(), ans = 0;
    for (int i = 0; i < n; i++) {
        int[] f = new int[256];
        int distinct = 0;
        for (int j = i; j < n; j++) {
            if (f[s.charAt(j)]++ == 0) distinct++;
            if (distinct > k) break;
            ans = Math.max(ans, j - i + 1);
        }
    }
    return ans;
}
```

### Approach B - Better (Sliding Window + HashMap) (O(n), O(k))

Invariant: window `[l..r]` is always valid after shrinking loop.

```java
static int kDistinctBetter(String s, int k) {
    if (k == 0) return 0;
    Map<Character, Integer> freq = new HashMap<>();
    int l = 0, ans = 0;

    for (int r = 0; r < s.length(); r++) {
        char c = s.charAt(r);
        freq.put(c, freq.getOrDefault(c, 0) + 1);

        while (freq.size() > k) {
            char x = s.charAt(l++);
            freq.put(x, freq.get(x) - 1);
            if (freq.get(x) == 0) freq.remove(x);
        }

        ans = Math.max(ans, r - l + 1);
    }
    return ans;
}
```

### Approach C - Optimal (Last-Index Ordered Map) (O(n log k), O(k))

Use `TreeMap` by last position to evict oldest distinct char quickly.

```java
static int kDistinctOptimal(String s, int k) {
    if (k == 0) return 0;
    Map<Character, Integer> last = new HashMap<>();
    TreeMap<Integer, Character> posToChar = new TreeMap<>();
    int l = 0, ans = 0;

    for (int r = 0; r < s.length(); r++) {
        char c = s.charAt(r);
        if (last.containsKey(c)) posToChar.remove(last.get(c));
        last.put(c, r);
        posToChar.put(r, c);

        if (last.size() > k) {
            Map.Entry<Integer, Character> first = posToChar.firstEntry();
            int cut = first.getKey();
            char rem = first.getValue();
            posToChar.remove(cut);
            last.remove(rem);
            l = cut + 1;
        }

        ans = Math.max(ans, r - l + 1);
    }
    return ans;
}
```

### Dry Run Shortcut

`eceba, k=2`: longest valid windows are `ece` and `ce` etc, answer `3`.

---

## Problem 2 - LC 438: Find All Anagrams in a String

### Problem Statement

Find all start indices of substrings in `s` that are anagrams of `p`.

### Constraints

- `1 <= |s|, |p| <= 30000`

### Sample

Input: `s = "cbaebabacd", p = "abc"`  
Output: `[0, 6]`

### Why This DS/Algo

- Window size is fixed (`|p|`), so this is fixed-size sliding window.
- Frequency arrays for 26 lowercase letters give O(1) update and O(26) comparison.

### Approach A - Brute Force (Sort each window) (O(n \* m log m), O(m))

```java
static List<Integer> anagramBrute(String s, String p) {
    List<Integer> ans = new ArrayList<>();
    int m = p.length();
    char[] cp = p.toCharArray();
    Arrays.sort(cp);
    String key = new String(cp);

    for (int i = 0; i + m <= s.length(); i++) {
        char[] w = s.substring(i, i + m).toCharArray();
        Arrays.sort(w);
        if (key.equals(new String(w))) ans.add(i);
    }
    return ans;
}
```

### Approach B - Better (Freq Arrays + Full Compare) (O(26n), O(1))

```java
static List<Integer> anagramBetter(String s, String p) {
    List<Integer> ans = new ArrayList<>();
    int n = s.length(), m = p.length();
    if (m > n) return ans;

    int[] need = new int[26], win = new int[26];
    for (char c : p.toCharArray()) need[c - 'a']++;

    for (int i = 0; i < n; i++) {
        win[s.charAt(i) - 'a']++;
        if (i >= m) win[s.charAt(i - m) - 'a']--;
        if (i >= m - 1 && Arrays.equals(need, win)) ans.add(i - m + 1);
    }
    return ans;
}
```

### Approach C - Optimal (Difference Counter) (O(n), O(1))

Track number of character buckets currently mismatched.

```java
static List<Integer> anagramOptimal(String s, String p) {
    List<Integer> ans = new ArrayList<>();
    int n = s.length(), m = p.length();
    if (m > n) return ans;

    int[] diff = new int[26];
    for (char c : p.toCharArray()) diff[c - 'a']++;
    for (int i = 0; i < m; i++) diff[s.charAt(i) - 'a']--;

    int bad = 0;
    for (int x : diff) if (x != 0) bad++;
    if (bad == 0) ans.add(0);

    for (int i = m; i < n; i++) {
        int add = s.charAt(i) - 'a';
        int rem = s.charAt(i - m) - 'a';

        if (diff[add] == 0) bad++;
        diff[add]--;
        if (diff[add] == 0) bad--;

        if (diff[rem] == 0) bad++;
        diff[rem]++;
        if (diff[rem] == 0) bad--;

        if (bad == 0) ans.add(i - m + 1);
    }
    return ans;
}
```

---

## Problem 3 - CF 271A: Beautiful Year

### Problem Statement

Given year `y`, find smallest year `> y` with all distinct digits.

### Why This DS/Algo

- Small bounded search over years.
- Set/boolean-array check for distinct digits.

### Approach A - Brute Force (Iterative) (O(k \* digits), O(1))

```java
static boolean uniqueYear(int y) {
    boolean[] seen = new boolean[10];
    while (y > 0) {
        int d = y % 10;
        if (seen[d]) return false;
        seen[d] = true;
        y /= 10;
    }
    return true;
}

static int beautifulYearBrute(int y) {
    int cur = y + 1;
    while (!uniqueYear(cur)) cur++;
    return cur;
}
```

### Approach B - Better (Digit Mask) (Same asymptotic, faster constant)

```java
static boolean uniqueYearMask(int y) {
    int mask = 0;
    while (y > 0) {
        int d = y % 10;
        if ((mask & (1 << d)) != 0) return false;
        mask |= (1 << d);
        y /= 10;
    }
    return true;
}
```

### Approach C - Optimal

Brute with bitmask is already optimal for this constraint domain.

---

## Problem 4 - CF 1535B: Array Reordering

### Problem Statement

Reorder array to maximize pairs `(i, j)` with `i < j` and `gcd(a[i], 2*a[j]) > 1`.

### Why This DS/Algo

- Number theory observation: any even `a[i]` automatically works with any `a[j]` because `gcd(even, 2*x) >= 2`.
- So greedy ordering evens first maximizes valid pairs.

### Approach A - Brute Force (All permutations) (O(n!), huge)

Not feasible except very small `n`.

### Approach B - Better (Greedy + Pair Scan) (O(n^2), O(n))

```java
static int reorderBetter(int[] a) {
    List<Integer> even = new ArrayList<>(), odd = new ArrayList<>();
    for (int x : a) if ((x & 1) == 0) even.add(x); else odd.add(x);
    int[] b = new int[a.length];
    int p = 0;
    for (int x : even) b[p++] = x;
    for (int x : odd) b[p++] = x;

    int ans = 0;
    for (int i = 0; i < b.length; i++) {
        for (int j = i + 1; j < b.length; j++) {
            if (gcd(b[i], 2 * b[j]) > 1) ans++;
        }
    }
    return ans;
}

static int gcd(int a, int b) {
    while (b != 0) {
        int t = a % b;
        a = b; b = t;
    }
    return Math.abs(a);
}
```

### Approach C - Optimal

For this problem, O(n^2) pair checking after greedy order is accepted and effectively optimal for given bounds.

### Pattern Takeaways

- Sliding window = maintain local validity under expansion/shrinking.
- Number theory + greedy ordering can turn tricky pair constraints into direct counting.
