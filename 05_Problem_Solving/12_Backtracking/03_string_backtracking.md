# 11.3 String Backtracking

> **Navigation**: [← 11.1 Subsets & Combinations](02_subsets_combinations.md) | [Chapter overview](../12_Backtracking.md) | [11.4 Grid Backtracking →](04_grid_backtracking.md)
> Page 3 of 4 in **Backtracking**


> **Pattern:** Build strings character-by-character with validity checks.
> **Palindrome Partitioning:** Try every possible first cut, check if it's a palindrome, recurse on remainder.
> **Generate Parentheses:** Track open/close counts. Can add '(' if open < n. Can add ')' if close < open.

## Problem 183: Palindrome Partitioning

**LeetCode 131** 🔗 https://leetcode.com/problems/palindrome-partitioning/

**PALINDROME PARTITIONING**

```text
s = "aab"

Partitions where each part is palindrome:
"a" | "a" | "b" ✓
"aa" | "b" ✓

Output: [["a","a","b"], ["aa","b"]]
```

**Solution:**

```java
public List<List<String>> partition(String s) {
    List<List<String>> result = new ArrayList<>();
    backtrack(s, 0, new ArrayList<>(), result);
    return result;
}

private void backtrack(String s, int start, List<String> path,
                       List<List<String>> result) {
    if (start == s.length()) {
        result.add(new ArrayList<>(path));
        return;
    }

    for (int end = start; end < s.length(); end++) {
        if (isPalindrome(s, start, end)) {
            path.add(s.substring(start, end + 1));
            backtrack(s, end + 1, path, result);
            path.remove(path.size() - 1);
        }
    }
}

private boolean isPalindrome(String s, int left, int right) {
    while (left < right) {
        if (s.charAt(left++) != s.charAt(right--)) return false;
    }
    return true;
}
```

---

## Problem 184: Letter Combinations of Phone

**LeetCode 17** 🔗 https://leetcode.com/problems/letter-combinations-of-a-phone-number/

```
┌────────────────────────────────────────────────────────────────┐
│  LETTER COMBINATIONS OF PHONE NUMBER                           │
├────────────────────────────────────────────────────────────────┤
│  digits = "23"                                                 │
│                                                                │
│  2 → "abc", 3 → "def"                                          │
│                                                                │
│       ┌───┬───┬───┐                                            │
│       │ a │ b │ c │  ← digit 2                                 │
│       └─┬─┴─┬─┴─┬─┘                                            │
│    ┌────┴┐ ┌┴───┐ ┌┴────┐                                      │
│  d,e,f  d,e,f  d,e,f     ← digit 3                             │
│                                                                │
│  Output: ["ad","ae","af","bd","be","bf","cd","ce","cf"]        │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
private String[] mapping = {"", "", "abc", "def", "ghi", "jkl",
                            "mno", "pqrs", "tuv", "wxyz"};

public List<String> letterCombinations(String digits) {
    List<String> result = new ArrayList<>();
    if (digits.isEmpty()) return result;

    backtrack(digits, 0, new StringBuilder(), result);
    return result;
}

private void backtrack(String digits, int index, StringBuilder path,
                       List<String> result) {
    if (index == digits.length()) {
        result.add(path.toString());
        return;
    }

    String letters = mapping[digits.charAt(index) - '0'];
    for (char c : letters.toCharArray()) {
        path.append(c);
        backtrack(digits, index + 1, path, result);
        path.deleteCharAt(path.length() - 1);
    }
}
```

---

## Problem 185: Generate Parentheses

**LeetCode 22** 🔗 https://leetcode.com/problems/generate-parentheses/

**GENERATE PARENTHESES**

```text
n = 3 (3 pairs)

Rules:
- Can add '(' if open < n
- Can add ')' if close < open

Output: ["((()))","(()())","(())()","()(())","()()()"]
```

**Solution:**

```java
public List<String> generateParenthesis(int n) {
    List<String> result = new ArrayList<>();
    backtrack(n, 0, 0, new StringBuilder(), result);
    return result;
}

private void backtrack(int n, int open, int close, StringBuilder path,
                       List<String> result) {
    if (path.length() == 2 * n) {
        result.add(path.toString());
        return;
    }

    if (open < n) {
        path.append('(');
        backtrack(n, open + 1, close, path, result);
        path.deleteCharAt(path.length() - 1);
    }

    if (close < open) {
        path.append(')');
        backtrack(n, open, close + 1, path, result);
        path.deleteCharAt(path.length() - 1);
    }
}
```

---

> 🔬 **Section Challenge — 11.3 String Backtracking**

**Challenge 1 (Reasoning):** In Generate Parentheses (LC 22), the constraint is "add '(' if open < n, add ')' if close < open." Why specifically `close < open` and not `close < n`?

<details><summary>Answer</summary>

`close < n` would allow adding ')' even when there's no matching '(' yet. Example with n=2: start with `""`, add ')' → `")"` — this is already invalid! No prefix of a valid parentheses string can have more ')' than '('. The invariant is: **at every point in construction, count(')') ≤ count('(')**. `close < open` enforces this exactly — you can only close a parenthesis that was previously opened. This is actually the **Catalan number** constraint in disguise: valid parentheses = monotonic lattice paths that never cross the diagonal, and `close < open` keeps you above/on the diagonal. The total valid strings = C(n) = (2n)! / ((n+1)! × n!).

</details>

---

[← 11.1 Subsets & Combinations](02_subsets_combinations.md) | [Chapter overview](../12_Backtracking.md) | [11.4 Grid Backtracking →](04_grid_backtracking.md)
