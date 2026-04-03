# Day 03 - Sliding Window (MIT/KTH Style)

## Daily Problem Set
1. LeetCode Premium: 159 - Longest Substring with At Most Two Distinct Characters
2. LeetCode Hard: 76 - Minimum Window Substring
3. Codeforces: 279B - Books
4. Codeforces: 1133C - Balanced Team

## Problem Links
- LC 159 (Premium): Locked on LeetCode (no public official statement page)
- LC 76: https://leetcode.com/problems/minimum-window-substring/
- CF 279B: https://codeforces.com/problemset/problem/279/B
- CF 1133C: https://codeforces.com/problemset/problem/1133/C

## Problem 1 - LC 159 (Premium)

### Problem Restatement
Return the maximum length of a substring containing at most two distinct characters.

### Constraints
- `1 <= |s| <= 100000`

### Sample
Input: `s = "ccaabbb"`  
Output: `5`

### Approach A - Brute Force (O(n^2), O(1))

```java
static int atMostTwoBrute(String s) {
    int n = s.length(), ans = 0;
    for (int i = 0; i < n; i++) {
        int[] freq = new int[256];
        int distinct = 0;
        for (int j = i; j < n; j++) {
            if (freq[s.charAt(j)]++ == 0) distinct++;
            if (distinct > 2) break;
            ans = Math.max(ans, j - i + 1);
        }
    }
    return ans;
}
```

### Approach B - Better (Sliding Window + HashMap) (O(n), O(1))

```java
static int atMostTwoBetter(String s) {
    Map<Character, Integer> freq = new HashMap<>();
    int l = 0, ans = 0;
    for (int r = 0; r < s.length(); r++) {
        char c = s.charAt(r);
        freq.put(c, freq.getOrDefault(c, 0) + 1);
        while (freq.size() > 2) {
            char x = s.charAt(l++);
            freq.put(x, freq.get(x) - 1);
            if (freq.get(x) == 0) freq.remove(x);
        }
        ans = Math.max(ans, r - l + 1);
    }
    return ans;
}
```

### Approach C - Optimal (Last Position Tracking) (O(n), O(1))
Track latest positions of two chars, jump left when third appears.

```java
static int atMostTwoOptimal(String s) {
    Map<Character, Integer> last = new HashMap<>();
    int l = 0, ans = 0;
    for (int r = 0; r < s.length(); r++) {
        last.put(s.charAt(r), r);
        if (last.size() > 2) {
            int delPos = Collections.min(last.values());
            last.remove(s.charAt(delPos));
            l = delPos + 1;
        }
        ans = Math.max(ans, r - l + 1);
    }
    return ans;
}
```

---

## Problem 2 - LC 76: Minimum Window Substring

### Problem Restatement
Given strings `s` and `t`, return the smallest substring of `s` that contains every char of `t` (with multiplicity).

### Constraints
- `1 <= |s|, |t| <= 100000`

### Sample
Input: `s = "ADOBECODEBANC", t = "ABC"`  
Output: `"BANC"`

### Approach A - Brute Force (O(n^2 * alphabet), O(alphabet))

```java
static String minWindowBrute(String s, String t) {
    int n = s.length();
    int[] need = new int[128];
    for (char c : t.toCharArray()) need[c]++;
    String best = "";

    for (int i = 0; i < n; i++) {
        int[] have = new int[128];
        for (int j = i; j < n; j++) {
            have[s.charAt(j)]++;
            boolean ok = true;
            for (int c = 0; c < 128; c++) {
                if (have[c] < need[c]) { ok = false; break; }
            }
            if (ok) {
                String cur = s.substring(i, j + 1);
                if (best.isEmpty() || cur.length() < best.length()) best = cur;
                break;
            }
        }
    }
    return best;
}
```

### Approach B - Better (Classical Sliding Window) (O(n), O(alphabet))

```java
static String minWindowBetter(String s, String t) {
    int[] need = new int[128], win = new int[128];
    for (char c : t.toCharArray()) need[c]++;

    int required = 0;
    for (int c = 0; c < 128; c++) if (need[c] > 0) required++;

    int formed = 0, l = 0, bestL = 0, bestLen = Integer.MAX_VALUE;
    for (int r = 0; r < s.length(); r++) {
        char c = s.charAt(r);
        win[c]++;
        if (need[c] > 0 && win[c] == need[c]) formed++;

        while (formed == required) {
            if (r - l + 1 < bestLen) { bestLen = r - l + 1; bestL = l; }
            char x = s.charAt(l++);
            if (need[x] > 0 && win[x] == need[x]) formed--;
            win[x]--;
        }
    }
    return bestLen == Integer.MAX_VALUE ? "" : s.substring(bestL, bestL + bestLen);
}
```

### Approach C - Optimal (Filtered Characters + Sliding Window)
Only process indices in `s` whose chars appear in `t`.

```java
static String minWindowOptimal(String s, String t) {
    int[] need = new int[128], win = new int[128];
    for (char c : t.toCharArray()) need[c]++;

    List<int[]> filtered = new ArrayList<>();
    for (int i = 0; i < s.length(); i++) {
        char c = s.charAt(i);
        if (need[c] > 0) filtered.add(new int[]{i, c});
    }

    int required = 0;
    for (int c = 0; c < 128; c++) if (need[c] > 0) required++;

    int formed = 0, l = 0, bestL = 0, bestLen = Integer.MAX_VALUE;
    for (int r = 0; r < filtered.size(); r++) {
        int idx = filtered.get(r)[0], ch = filtered.get(r)[1];
        win[ch]++;
        if (win[ch] == need[ch]) formed++;

        while (formed == required) {
            int start = filtered.get(l)[0];
            if (idx - start + 1 < bestLen) { bestLen = idx - start + 1; bestL = start; }
            int chL = filtered.get(l)[1];
            if (win[chL] == need[chL]) formed--;
            win[chL]--;
            l++;
        }
    }
    return bestLen == Integer.MAX_VALUE ? "" : s.substring(bestL, bestL + bestLen);
}
```

### Interview Notes
- `formed == required` is the core invariant.
- Optimal version is useful when `s` is very large but `t` is small.

---

## Problem 3 - CF 279B: Books

### Problem Restatement
Given reading times and total time `T`, choose longest contiguous segment with sum `<= T`.

### Constraints
- `1 <= n <= 100000`
- `1 <= a[i] <= 10000`

### Sample
Input: `a = [3,1,2,1], T = 5`  
Output: `3`

### Approach A - Brute Force (O(n^2), O(1))

```java
static int booksBrute(int[] a, int T) {
    int n = a.length, ans = 0;
    for (int i = 0; i < n; i++) {
        int sum = 0;
        for (int j = i; j < n; j++) {
            sum += a[j];
            if (sum <= T) ans = Math.max(ans, j - i + 1);
            else break;
        }
    }
    return ans;
}
```

### Approach B - Better (Prefix + Binary Search) (O(n log n), O(n))

```java
static int booksBetter(int[] a, int T) {
    int n = a.length, ans = 0;
    long[] pref = new long[n + 1];
    for (int i = 1; i <= n; i++) pref[i] = pref[i - 1] + a[i - 1];

    for (int i = 0; i < n; i++) {
        int lo = i, hi = n, best = i;
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;
            if (pref[mid] - pref[i] <= T) { best = mid; lo = mid + 1; }
            else hi = mid - 1;
        }
        ans = Math.max(ans, best - i);
    }
    return ans;
}
```

### Approach C - Optimal (Sliding Window) (O(n), O(1))

```java
static int booksOptimal(int[] a, int T) {
    int l = 0, ans = 0;
    long sum = 0;
    for (int r = 0; r < a.length; r++) {
        sum += a[r];
        while (sum > T) sum -= a[l++];
        ans = Math.max(ans, r - l + 1);
    }
    return ans;
}
```

---

## Problem 4 - CF 1133C: Balanced Team

### Problem Restatement
Choose maximum number of students such that max skill - min skill <= 5.

### Constraints
- `1 <= n <= 200000`

### Sample
Input: `[1,10,12,11,14,13]`  
Output: `4`

### Approach A - Brute Force (O(n^2), O(1))

```java
static int teamBrute(int[] a) {
    Arrays.sort(a);
    int n = a.length, ans = 1;
    for (int i = 0; i < n; i++) {
        for (int j = i; j < n; j++) {
            if (a[j] - a[i] <= 5) ans = Math.max(ans, j - i + 1);
        }
    }
    return ans;
}
```

### Approach B - Better (Sort + Binary Search) (O(n log n), O(1))

```java
static int teamBetter(int[] a) {
    Arrays.sort(a);
    int n = a.length, ans = 1;
    for (int i = 0; i < n; i++) {
        int lo = i, hi = n - 1, best = i;
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;
            if (a[mid] - a[i] <= 5) { best = mid; lo = mid + 1; }
            else hi = mid - 1;
        }
        ans = Math.max(ans, best - i + 1);
    }
    return ans;
}
```

### Approach C - Optimal (Sort + Two Pointers) (O(n log n), O(1))

```java
static int teamOptimal(int[] a) {
    Arrays.sort(a);
    int l = 0, ans = 1;
    for (int r = 0; r < a.length; r++) {
        while (a[r] - a[l] > 5) l++;
        ans = Math.max(ans, r - l + 1);
    }
    return ans;
}
```

### Pattern Takeaways
- Positive arrays + sum bound -> sliding window.
- Difference bound in sorted array -> two pointers on monotone property.
