# 📌 6. Frequency Count

> **Navigation**: [← 5. Prefix Sum](04_prefix_sum.md) | [Chapter overview](../02_Code_Templates.md) | [8. Bfs/dfs →](06_bfs_dfs.md)
> Page 5 of 8 in **Code Templates — Pattern Guide**


## Visual Concept

### Frequency count patterns

**Pattern 1: array of 26 (lowercase letters only).** Use it when the input has only `a` to `z`. For the string `"hello"`, `freq[ch - 'a']` maps `'a'` → 0, `'b'` → 1, …, `'z'` → 25.

| Letter | a | b | c | d | e | f | g | h | i | j | k | l | m | n | o | p | q | r | s | t | u | v | w | x | y | z |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Count | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 1 | 0 | 0 | 0 | 2 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

The non-zero entries are `e: 1`, `h: 1`, `l: 2`, `o: 1`.

**Pattern 2: HashMap (any characters, large range).** Use it for Unicode characters, numbers or any large range.

```java
Map<Character, Integer> freq = new HashMap<>();
for (char c : str.toCharArray()) {
    freq.put(c, freq.getOrDefault(c, 0) + 1);
}
```

| Key | Value |
| --- | --- |
| `'h'` | 1 |
| `'e'` | 1 |
| `'l'` | 2 |
| `'o'` | 1 |

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

**STACK PATTERNS**

### Stack patterns

**Pattern 1: matching and balancing.** Input: `"({[]})"`.

| Character | Action | Stack after |
| --- | --- | --- |
| `(` | push | `[(]` |
| `{` | push | `[(, {]` |
| `[` | push | `[(, {, []` |
| `]` | matches `[`, pop | `[(, {]` |
| `}` | matches `{`, pop | `[(]` |
| `)` | matches `(`, pop | `[]` |

The stack is empty at the end, so the input is **balanced** ✓.

**Pattern 2: monotonic stack (next greater element).** Input: `[2, 1, 2, 4, 3]`; output: `[4, 2, 4, -1, -1]`.

| Element | Action | Stack after |
| --- | --- | --- |
| 2 | push | `[2]` |
| 1 | push (1 < 2, cannot pop) | `[2, 1]` |
| 2 | pop 1 (its next greater is 2), push | `[2, 2]` |
| 4 | pop everything (4 is greater than all): the next greater of both 2s is 4 | `[4]` |
| 3 | push (3 < 4, cannot pop) | `[4, 3]` |

The stack stays in **decreasing order** from bottom to top.

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
