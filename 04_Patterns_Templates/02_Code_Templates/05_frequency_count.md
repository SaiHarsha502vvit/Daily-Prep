# 📌 6. Frequency Count

> **Navigation**: [← 5. Prefix Sum](04_prefix_sum.md) | [Chapter overview](../02_Code_Templates.md) | [8. Bfs/dfs →](06_bfs_dfs.md)
> Page 5 of 8 in **Code Templates — Pattern Guide**


## Visual Concept

```
                  FREQUENCY COUNT PATTERNS
──────────────────────────────────────────────────

PATTERN 1: Array of 26 (lowercase letters only)
────────────────────────────────────────────────
Use when: Only lowercase a-z characters

String: "hello"

freq[ch - 'a']  ← Maps 'a'→0, 'b'→1, ..., 'z'→25

┌─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┐
│0│0│0│0│1│0│0│1│0│0│0│2│0│0│1│0│0│0│0│0│0│0│0│0│0│0│
└─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┘
 a b c d e f g h i j k l m n o p q r s t u v w x y z
           ↑     ↑       ↑     ↑
          e:1   h:1     l:2   o:1

════════════════════════════════════════════════════════════════════

PATTERN 2: HashMap (any characters, large range)
─────────────────────────────────────────────────
Use when: Unicode characters, numbers, or large range

Map<Character, Integer> freq = new HashMap<>();
for (char c : str.toCharArray()) {
    freq.put(c, freq.getOrDefault(c, 0) + 1);
}

┌─────────────────────────────────────────────────────────────────────┐
│  Key   │  Value                                                     │
├────────┼────────────────────────────────────────────────────────────┤
│  'h'   │    1                                                       │
│  'e'   │    1                                                       │
│  'l'   │    2                                                       │
│  'o'   │    1                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

## Template: Check Anagram

```java
/**
 * VISUAL: Anagrams have same character frequencies
 *
 * "listen" and "silent"
 * Both have: e:1, i:1, l:1, n:1, s:1, t:1
 */

// Method 1: Using array (if only lowercase)
public boolean isAnagram(String s1, String s2) {
    if (s1.length() != s2.length()) return false;

    int[] freq = new int[26];

    for (int i = 0; i < s1.length(); i++) {
        freq[s1.charAt(i) - 'a']++;  // Add from s1
        freq[s2.charAt(i) - 'a']--;  // Subtract from s2
    }

    for (int count : freq) {
        if (count != 0) return false;  // All should be 0
    }
    return true;
}

// Method 2: Using HashMap (any characters)
public boolean isAnagramGeneral(String s1, String s2) {
    if (s1.length() != s2.length()) return false;

    Map<Character, Integer> freq = new HashMap<>();

    for (char c : s1.toCharArray()) {
        freq.put(c, freq.getOrDefault(c, 0) + 1);
    }

    for (char c : s2.toCharArray()) {
        if (!freq.containsKey(c)) return false;
        freq.put(c, freq.get(c) - 1);
        if (freq.get(c) == 0) freq.remove(c);
    }

    return freq.isEmpty();
}
```

## Template: Find First Non-Repeating Character

```java
/**
 * VISUAL: First character with count = 1
 *
 * "leetcode"
 * l:1, e:3, t:1, c:1, o:1, d:1
 *
 * First with count=1: 'l' at index 0
 */
public int firstUniqChar(String s) {
    int[] freq = new int[26];

    // Count frequencies
    for (char c : s.toCharArray()) {
        freq[c - 'a']++;
    }

    // Find first with count 1
    for (int i = 0; i < s.length(); i++) {
        if (freq[s.charAt(i) - 'a'] == 1) {
            return i;
        }
    }
    return -1;
}
```

---

## 📚 7. Stack Problems

### Visual Concept

```
┌───────────────────────────────────────────────────────────────────────────┐
│                    STACK PATTERNS                                         │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  PATTERN 1: Matching/Balancing                                            │
│  ─────────────────────────────                                            │
│                                                                           │
│  Input: "({[]})"                                                          │
│                                                                           │
│  Process '(':  Stack: [(]                                                 │
│  Process '{':  Stack: [(, {]                                              │
│  Process '[':  Stack: [(, {, []                                           │
│  Process ']':  Matches '[', Stack: [(, {]                                 │
│  Process '}':  Matches '{', Stack: [(]                                    │
│  Process ')':  Matches '(', Stack: []                                     │
│                                                                           │
│  Stack empty at end → BALANCED! ✓                                         │
│                                                                           │
│  ────────────────────────────────────────────────────────────────────     │
│                                                                           │
│  PATTERN 2: Monotonic Stack (Next Greater Element)                        │
│  ──────────────────────────────────────────────────                       │
│                                                                           │
│  Input: [2, 1, 2, 4, 3]                                                   │
│  Output: [4, 2, 4, -1, -1]  (next greater for each)                       │
│                                                                           │
│  Process 2: Stack: [2]                                                    │
│  Process 1: Stack: [2, 1]  (1 < 2, can't pop)                             │
│  Process 2: Pop 1 (next greater of 1 is 2), Stack: [2, 2]                 │
│  Process 4: Pop all (4 > everyone), next greater of 2,2 is 4              │
│             Stack: [4]                                                    │
│  Process 3: Stack: [4, 3]  (3 < 4, can't pop)                             │
│                                                                           │
│  Stack maintains DECREASING order from bottom to top                      │
└───────────────────────────────────────────────────────────────────────────┘
```

### Template: Valid Parentheses

```java
/**
 * Check if brackets are balanced
 * Time: O(N), Space: O(N)
 */
public boolean isValid(String s) {
    Deque<Character> stack = new ArrayDeque<>();
    Map<Character, Character> pairs = Map.of(
        ')', '(',
        '}', '{',
        ']', '['
    );

    for (char c : s.toCharArray()) {
        if (c == '(' || c == '{' || c == '[') {
            stack.push(c);  // Opening bracket: push
        } else {
            // Closing bracket: must match top of stack
            if (stack.isEmpty() || stack.pop() != pairs.get(c)) {
                return false;
            }
        }
    }
    return stack.isEmpty();  // Must be empty at end
}
```

### Template: Next Greater Element

```java
/**
 * For each element, find the next element that is greater
 * Returns -1 if no greater element exists to the right
 *
 * Time: O(N), Space: O(N)
 */
public int[] nextGreaterElement(int[] arr) {
    int n = arr.length;
    int[] result = new int[n];
    Arrays.fill(result, -1);  // Default: no greater element

    Deque<Integer> stack = new ArrayDeque<>();  // Store indices

    for (int i = 0; i < n; i++) {
        // While current element is greater than stack top
        while (!stack.isEmpty() && arr[i] > arr[stack.peek()]) {
            int idx = stack.pop();
            result[idx] = arr[i];  // arr[i] is next greater for arr[idx]
        }
        stack.push(i);
    }
    return result;
}
```

---

[← 5. Prefix Sum](04_prefix_sum.md) | [Chapter overview](../02_Code_Templates.md) | [8. Bfs/dfs →](06_bfs_dfs.md)
