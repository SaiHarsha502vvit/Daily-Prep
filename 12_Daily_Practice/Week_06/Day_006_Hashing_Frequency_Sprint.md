# Day 06 - Hashing and Frequency Maps (MIT/KTH Style)

## Daily Problem Set

1. LeetCode Premium: 266 - Palindrome Permutation
2. LeetCode Medium: 49 - Group Anagrams
3. Codeforces: 1520D - Same Differences
4. Codeforces: 1003A - Polycarp's Pockets

## Problem Links

- LC 266 (Premium): Locked on LeetCode (no public official statement page)
- LC 49: https://leetcode.com/problems/group-anagrams/
- CF 1520D: https://codeforces.com/problemset/problem/1520/D
- CF 1003A: https://codeforces.com/problemset/problem/1003/A

## Problem 1 - LC 266 (Premium): Palindrome Permutation

### Problem Restatement

Given string `s`, decide whether some permutation of `s` can form a palindrome.

### Constraints

- `1 <= |s| <= 5000`

### Sample

Input: `"carerac"`  
Output: `true`

### Approach A - Brute Force (Permutation Check) (O(n!))

Generate permutations and test palindrome.

```java
static boolean isPal(String t) {
    int l = 0, r = t.length() - 1;
    while (l < r) if (t.charAt(l++) != t.charAt(r--)) return false;
    return true;
}
```

### Approach B - Better (Frequency Count) (O(n), O(alphabet))

At most one char can have odd frequency.

```java
static boolean canPermuteBetter(String s) {
    int[] freq = new int[256];
    for (char c : s.toCharArray()) freq[c]++;
    int odd = 0;
    for (int f : freq) if ((f & 1) == 1) odd++;
    return odd <= 1;
}
```

### Approach C - Optimal (Parity Bitset) (O(n), O(1))

Toggle parity only, no full counts needed.

```java
static boolean canPermuteOptimal(String s) {
    BitSet odd = new BitSet(256);
    for (char c : s.toCharArray()) odd.flip(c);
    return odd.cardinality() <= 1;
}
```

---

## Problem 2 - LC 49: Group Anagrams

### Problem Restatement

Group strings where each group contains anagrams.

### Constraints

- Up to about `10^4` words

### Sample

Input: `["eat","tea","tan","ate","nat","bat"]`  
Output: `[[eat,tea,ate],[tan,nat],[bat]]`

### Approach A - Brute Force Pairing (O(n^2 \* k log k), O(n))

Compare each word with all others by sorted form.

```java
static String sigSort(String s) {
    char[] c = s.toCharArray();
    Arrays.sort(c);
    return new String(c);
}
```

### Approach B - Better (Sorted Signature HashMap) (O(n \* k log k), O(nk))

```java
static List<List<String>> groupAnagramsBetter(String[] strs) {
    Map<String, List<String>> map = new HashMap<>();
    for (String s : strs) {
        String key = sigSort(s);
        map.computeIfAbsent(key, z -> new ArrayList<>()).add(s);
    }
    return new ArrayList<>(map.values());
}
```

### Approach C - Optimal (Frequency Signature) (O(n \* k), O(nk))

Use 26-count signature to avoid sorting each word.

```java
static String sigCount(String s) {
    int[] cnt = new int[26];
    for (char c : s.toCharArray()) cnt[c - 'a']++;
    StringBuilder sb = new StringBuilder();
    for (int x : cnt) sb.append('#').append(x);
    return sb.toString();
}

static List<List<String>> groupAnagramsOptimal(String[] strs) {
    Map<String, List<String>> map = new HashMap<>();
    for (String s : strs) {
        String key = sigCount(s);
        map.computeIfAbsent(key, z -> new ArrayList<>()).add(s);
    }
    return new ArrayList<>(map.values());
}
```

### Interview Notes

- Signature design is the whole problem.
- Frequency signature is usually the best practical choice.

---

## Problem 3 - CF 1520D: Same Differences

### Problem Restatement

Count pairs `(i, j)` (`i < j`) such that `a[j] - a[i] = j - i`.
Equivalent: `a[i] - i` is equal for both indices.

### Constraints

- Total `n` across tests up to around `2e5`

### Sample

Input: `a = [1,2,3,4]`  
Output: `6`

### Approach A - Brute Force (O(n^2), O(1))

```java
static long sameDiffBrute(int[] a) {
    long ans = 0;
    for (int i = 0; i < a.length; i++) {
        for (int j = i + 1; j < a.length; j++) {
            if (a[j] - a[i] == j - i) ans++;
        }
    }
    return ans;
}
```

### Approach B - Better (Transform + Sort) (O(n log n), O(n))

Count equal values in array `b[i] = a[i] - i`.

```java
static long sameDiffBetter(int[] a) {
    long[] b = new long[a.length];
    for (int i = 0; i < a.length; i++) b[i] = (long)a[i] - i;
    Arrays.sort(b);

    long ans = 0;
    for (int i = 0, j; i < b.length; i = j) {
        j = i;
        while (j < b.length && b[j] == b[i]) j++;
        long c = j - i;
        ans += c * (c - 1) / 2;
    }
    return ans;
}
```

### Approach C - Optimal (HashMap Frequency) (O(n), O(n))

```java
static long sameDiffOptimal(int[] a) {
    Map<Long, Long> freq = new HashMap<>();
    long ans = 0;
    for (int i = 0; i < a.length; i++) {
        long key = (long)a[i] - i;
        long seen = freq.getOrDefault(key, 0L);
        ans += seen;
        freq.put(key, seen + 1);
    }
    return ans;
}
```

---

## Problem 4 - CF 1003A: Polycarp's Pockets

### Problem Restatement

Given coin types, maximum number of equal-type coins is answer.

### Constraints

- `1 <= n <= 100`
- `1 <= coin <= 100`

### Sample

Input: `[1,2,2,3,3,3]`  
Output: `3`

### Approach A - Brute Force (O(n^2), O(1))

```java
static int pocketsBrute(int[] a) {
    int ans = 0;
    for (int i = 0; i < a.length; i++) {
        int c = 0;
        for (int x : a) if (x == a[i]) c++;
        ans = Math.max(ans, c);
    }
    return ans;
}
```

### Approach B - Better (HashMap) (O(n), O(n))

```java
static int pocketsBetter(int[] a) {
    Map<Integer, Integer> f = new HashMap<>();
    int ans = 0;
    for (int x : a) {
        int v = f.getOrDefault(x, 0) + 1;
        f.put(x, v);
        ans = Math.max(ans, v);
    }
    return ans;
}
```

### Approach C - Optimal (Counting Array) (O(n), O(1))

Since value range is small.

```java
static int pocketsOptimal(int[] a) {
    int[] f = new int[101];
    int ans = 0;
    for (int x : a) {
        ans = Math.max(ans, ++f[x]);
    }
    return ans;
}
```

### Pattern Takeaways

- Algebraic transforms often reduce pair-counting to frequency counting.
- HashMap is the standard tool for `count pairs by key` problems.
