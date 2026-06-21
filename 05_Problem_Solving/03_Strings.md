> **Navigation**: [< Previous](02_Math_Numbers.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](04_Arrays.md)

> **Problems 03/14** | [Prev](02_Math_Numbers.md) | [Index](../00_MASTER_INDEX.md) | [Next](04_Arrays.md)

---

# 📝 Section 2: String Problems

---

## 🎨 2.1 Isomorphic & Pattern Matching

### Problem: Isomorphic Strings

**LeetCode 205** | **Difficulty:** Easy
🔗 [https://leetcode.com/problems/isomorphic-strings/](https://leetcode.com/problems/isomorphic-strings/)

> ISOMORPHIC STRINGS
>
> Two strings are isomorphic if characters in s can be replaced to get t.
> Mapping must be one-to-one (each char maps to exactly one char).
> Order of characters must be preserved.
>
> Input: s = "egg", t = "add"
> Output: true
> Explanation: e → a, g → d
> egg → add ✓
>
> Input: s = "foo", t = "bar"
> Output: false
> Explanation: o maps to both 'a' and 'r' - not allowed
>
> Input: s = "paper", t = "title"
> Output: true
> Explanation: p→t, a→i, e→l, r→e
>
> Input: s = "badc", t = "baba"
> Output: false
> Explanation: d and c both map to 'a' - not allowed

```java
public boolean isIsomorphic(String s, String t) {
    if (s.length() != t.length()) return false;

    int[] mapST = new int[256];  // s -> t mapping
    int[] mapTS = new int[256];  // t -> s mapping
    Arrays.fill(mapST, -1);
    Arrays.fill(mapTS, -1);

    for (int i = 0; i < s.length(); i++) {
        char cs = s.charAt(i);
        char ct = t.charAt(i);

        // Check if mapping exists and is consistent
        if (mapST[cs] == -1 && mapTS[ct] == -1) {
            mapST[cs] = ct;
            mapTS[ct] = cs;
        } else if (mapST[cs] != ct || mapTS[ct] != cs) {
            return false;
        }
    }
    return true;
}

// Alternative using HashMap
public boolean isIsomorphicMap(String s, String t) {
    Map<Character, Character> mapST = new HashMap<>();
    Map<Character, Character> mapTS = new HashMap<>();

    for (int i = 0; i < s.length(); i++) {
        char cs = s.charAt(i), ct = t.charAt(i);

        if (mapST.containsKey(cs) && mapST.get(cs) != ct) return false;
        if (mapTS.containsKey(ct) && mapTS.get(ct) != cs) return false;

        mapST.put(cs, ct);
        mapTS.put(ct, cs);
    }
    return true;
}
```

---

### Problem: Word Pattern

**LeetCode 290** | **Difficulty:** Easy
🔗 [https://leetcode.com/problems/word-pattern/](https://leetcode.com/problems/word-pattern/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  WORD PATTERN                                                             ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Check if string follows same pattern as given pattern.                   ║
║  Pattern char → word must be bijective (one-to-one).                      ║
║                                                                           ║
║  Input: pattern = "abba", s = "dog cat cat dog"                           ║
║  Output: true                                                             ║
║  Explanation: a→dog, b→cat                                                ║
║                                                                           ║
║  Input: pattern = "abba", s = "dog cat cat fish"                          ║
║  Output: false                                                            ║
║  Explanation: a→dog but also a→fish (inconsistent)                        ║
║                                                                           ║
║  Input: pattern = "aaaa", s = "dog cat cat dog"                           ║
║  Output: false                                                            ║
║  Explanation: a→dog, a→cat (inconsistent)                                 ║
║                                                                           ║
║  Input: pattern = "abba", s = "dog dog dog dog"                           ║
║  Output: false                                                            ║
║  Explanation: b must map to different word than a                         ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public boolean wordPattern(String pattern, String s) {
    String[] words = s.split(" ");
    if (pattern.length() != words.length) return false;

    Map<Character, String> charToWord = new HashMap<>();
    Map<String, Character> wordToChar = new HashMap<>();

    for (int i = 0; i < pattern.length(); i++) {
        char c = pattern.charAt(i);
        String word = words[i];

        if (charToWord.containsKey(c)) {
            if (!charToWord.get(c).equals(word)) return false;
        } else {
            charToWord.put(c, word);
        }

        if (wordToChar.containsKey(word)) {
            if (wordToChar.get(word) != c) return false;
        } else {
            wordToChar.put(word, c);
        }
    }
    return true;
}
```

---

### 🔒 PREMIUM: Word Pattern II

**LeetCode 291** | **Difficulty:** Medium | **Premium Problem**

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  WORD PATTERN II                                                          ║
║  (LeetCode Premium - Full Problem Description)                            ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Given a pattern and a string s, find if s follows the same pattern.      ║
║                                                                           ║
║  Here, "follow" means a full match, such that there is a bijection        ║
║  between a letter in pattern and a non-empty substring in s.              ║
║                                                                           ║
║  NOTE: Unlike Word Pattern I, words are NOT separated by spaces!          ║
║  You must determine where words begin and end.                            ║
║                                                                           ║
║  ─────────────────────────────────────────────────────────────────────    ║
║                                                                           ║
║  Example 1:                                                               ║
║  Input: pattern = "abab", s = "redblueredblue"                            ║
║  Output: true                                                             ║
║  Explanation: a→"red", b→"blue"                                           ║
║  "redblueredblue" matches "abab"                                          ║
║                                                                           ║
║  Example 2:                                                               ║
║  Input: pattern = "aaaa", s = "asdasdasdasd"                              ║
║  Output: true                                                             ║
║  Explanation: a→"asd"                                                     ║
║                                                                           ║
║  Example 3:                                                               ║
║  Input: pattern = "aabb", s = "xyzabcxzyabc"                              ║
║  Output: false                                                            ║
║  Explanation: No valid mapping exists                                     ║
║                                                                           ║
║  Example 4:                                                               ║
║  Input: pattern = "ab", s = "aa"                                          ║
║  Output: false                                                            ║
║  Explanation: a→"a", b→"a" violates bijection (two chars map to same)     ║
║                                                                           ║
║  ─────────────────────────────────────────────────────────────────────    ║
║                                                                           ║
║  Constraints:                                                             ║
║  - 1 <= pattern.length, s.length <= 20                                    ║
║  - pattern and s consist of only lowercase English letters                ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public boolean wordPatternMatch(String pattern, String s) {
    Map<Character, String> charToWord = new HashMap<>();
    Set<String> usedWords = new HashSet<>();
    return backtrack(pattern, 0, s, 0, charToWord, usedWords);
}

private boolean backtrack(String pattern, int pIdx, String s, int sIdx,
                          Map<Character, String> map, Set<String> used) {
    // Both exhausted - success
    if (pIdx == pattern.length() && sIdx == s.length()) return true;
    // One exhausted but not other - failure
    if (pIdx == pattern.length() || sIdx == s.length()) return false;

    char c = pattern.charAt(pIdx);

    // If pattern char already mapped
    if (map.containsKey(c)) {
        String word = map.get(c);
        if (!s.startsWith(word, sIdx)) return false;
        return backtrack(pattern, pIdx + 1, s, sIdx + word.length(), map, used);
    }

    // Try all possible substrings for this pattern char
    for (int end = sIdx + 1; end <= s.length(); end++) {
        String word = s.substring(sIdx, end);

        // Word already used by another char - skip
        if (used.contains(word)) continue;

        // Try this mapping
        map.put(c, word);
        used.add(word);

        if (backtrack(pattern, pIdx + 1, s, end, map, used)) {
            return true;
        }

        // Backtrack
        map.remove(c);
        used.remove(word);
    }

    return false;
}
```

---

### 🔒 PREMIUM: Isomorphic Strings - Find All Pairs

**Custom Problem** | **Difficulty:** Medium

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  FIND ALL ISOMORPHIC PAIRS                                                ║
║  (Custom Premium-Style Problem)                                           ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Given an array of strings, group all isomorphic strings together.        ║
║                                                                           ║
║  Two strings are isomorphic if the characters in one string can be        ║
║  replaced to get the other string while preserving the order.             ║
║                                                                           ║
║  ─────────────────────────────────────────────────────────────────────    ║
║                                                                           ║
║  Example 1:                                                               ║
║  Input: ["egg", "add", "foo", "bar", "paper", "title", "abc", "xyz"]      ║
║  Output: [["egg", "add"], ["foo"], ["bar", "abc", "xyz"],                 ║
║           ["paper", "title"]]                                             ║
║                                                                           ║
║  Explanation:                                                             ║
║  - "egg" ↔ "add" (pattern: 011)                                           ║
║  - "foo" alone (pattern: 011, but different length group)                 ║
║  - "bar", "abc", "xyz" (pattern: 012)                                     ║
║  - "paper" ↔ "title" (pattern: 01023)                                     ║
║                                                                           ║
║  Example 2:                                                               ║
║  Input: ["aab", "xxy", "xyz", "abc", "def", "aba"]                        ║
║  Output: [["aab", "xxy"], ["xyz", "abc", "def"], ["aba"]]                 ║
║                                                                           ║
║  ─────────────────────────────────────────────────────────────────────    ║
║                                                                           ║
║  Constraints:                                                             ║
║  - 1 <= words.length <= 1000                                              ║
║  - 1 <= words[i].length <= 20                                             ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public List<List<String>> groupIsomorphic(String[] words) {
    Map<String, List<String>> groups = new HashMap<>();

    for (String word : words) {
        String pattern = getPattern(word);
        groups.computeIfAbsent(pattern, k -> new ArrayList<>()).add(word);
    }

    return new ArrayList<>(groups.values());
}

// Convert string to pattern like "01123" for "abbc"
private String getPattern(String s) {
    Map<Character, Integer> map = new HashMap<>();
    StringBuilder pattern = new StringBuilder();
    int id = 0;

    for (char c : s.toCharArray()) {
        if (!map.containsKey(c)) {
            map.put(c, id++);
        }
        pattern.append(map.get(c));
    }

    return pattern.toString();
}
```

---

> 🔬 **Section Challenge — 🎨 2.1 Isomorphic & Pattern Matching**

**Challenge 1 (Reasoning):** The `groupIsomorphic` solution uses `getPattern()` to map "egg" → "011". But this creates a subtle bug for inputs like `["ab", "cd", "ba"]`. Why are "ab" and "ba" NOT isomorphic to each other, yet both map to pattern "01"?

<details><summary>Answer</summary>

They ARE both isomorphic to the same abstract pattern "01" (two distinct characters in order), so they SHOULD be grouped together — and they are! The pattern "01" means "first char is class 0, second char is class 1." Both "ab" (a→0, b→1) and "ba" (b→0, a→1) produce "01." The confusion arises because people think isomorphism requires the _same mapping_ — but it only requires _a valid bijection exists_. For "ab"→"ba": map a→b, b→a. Valid! The `getPattern` approach works precisely because it abstracts away the actual characters and captures only the _structure_ of the string.

</details>

## 🧩 2.2 Anagram Problems

### Problem: Valid Anagram

**LeetCode 242** | **Difficulty:** Easy
🔗 [https://leetcode.com/problems/valid-anagram/](https://leetcode.com/problems/valid-anagram/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  VALID ANAGRAM                                                            ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Given two strings s and t, return true if t is an anagram of s.          ║
║  Anagram = same characters, same frequency, different order.              ║
║                                                                           ║
║  Input: s = "anagram", t = "nagaram"                                      ║
║  Output: true                                                             ║
║                                                                           ║
║  Input: s = "rat", t = "car"                                              ║
║  Output: false                                                            ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public boolean isAnagram(String s, String t) {
    if (s.length() != t.length()) return false;

    int[] count = new int[26];

    for (int i = 0; i < s.length(); i++) {
        count[s.charAt(i) - 'a']++;
        count[t.charAt(i) - 'a']--;
    }

    for (int c : count) {
        if (c != 0) return false;
    }
    return true;
}
```

---

### Problem: Find All Anagrams in String

**LeetCode 438** | **Difficulty:** Medium
🔗 [https://leetcode.com/problems/find-all-anagrams-in-a-string/](https://leetcode.com/problems/find-all-anagrams-in-a-string/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  FIND ALL ANAGRAMS IN A STRING                                            ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Find all start indices of p's anagrams in s.                             ║
║                                                                           ║
║  Input: s = "cbaebabacd", p = "abc"                                       ║
║  Output: [0, 6]                                                           ║
║  Explanation:                                                             ║
║  Index 0: "cba" is anagram of "abc"                                       ║
║  Index 6: "bac" is anagram of "abc"                                       ║
║                                                                           ║
║  Input: s = "abab", p = "ab"                                              ║
║  Output: [0, 1, 2]                                                        ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public List<Integer> findAnagrams(String s, String p) {
    List<Integer> result = new ArrayList<>();
    if (s.length() < p.length()) return result;

    int[] pCount = new int[26];
    int[] sCount = new int[26];

    // Initialize with first window
    for (int i = 0; i < p.length(); i++) {
        pCount[p.charAt(i) - 'a']++;
        sCount[s.charAt(i) - 'a']++;
    }

    if (Arrays.equals(pCount, sCount)) result.add(0);

    // Slide window
    for (int i = p.length(); i < s.length(); i++) {
        sCount[s.charAt(i) - 'a']++;                      // Add new char
        sCount[s.charAt(i - p.length()) - 'a']--;         // Remove old char

        if (Arrays.equals(pCount, sCount)) {
            result.add(i - p.length() + 1);
        }
    }

    return result;
}
```

---

### 🔒 PREMIUM: Strobogrammatic Number

**LeetCode 246** | **Difficulty:** Easy | **Premium Problem**

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  STROBOGRAMMATIC NUMBER                                                   ║
║  (LeetCode Premium - Full Problem Description)                            ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  A strobogrammatic number is a number that looks the same when rotated    ║
║  180 degrees (looked at upside down).                                     ║
║                                                                           ║
║  Given a string num representing an integer, return true if num is a      ║
║  strobogrammatic number.                                                  ║
║                                                                           ║
║  Valid strobogrammatic digits:                                            ║
║  - 0 rotated is 0                                                         ║
║  - 1 rotated is 1                                                         ║
║  - 6 rotated is 9                                                         ║
║  - 8 rotated is 8                                                         ║
║  - 9 rotated is 6                                                         ║
║                                                                           ║
║  ─────────────────────────────────────────────────────────────────────    ║
║                                                                           ║
║  Example 1:                                                               ║
║  Input: num = "69"                                                        ║
║  Output: true                                                             ║
║  Explanation: 69 rotated 180° is 69                                       ║
║                                                                           ║
║  Example 2:                                                               ║
║  Input: num = "88"                                                        ║
║  Output: true                                                             ║
║                                                                           ║
║  Example 3:                                                               ║
║  Input: num = "962"                                                       ║
║  Output: false                                                            ║
║  Explanation: 962 rotated is 296 ≠ 962                                    ║
║                                                                           ║
║  Example 4:                                                               ║
║  Input: num = "1"                                                         ║
║  Output: true                                                             ║
║                                                                           ║
║  ─────────────────────────────────────────────────────────────────────    ║
║                                                                           ║
║  Constraints:                                                             ║
║  - 1 <= num.length <= 50                                                  ║
║  - num consists of only digits                                            ║
║  - num does not have leading zeros except for zero itself                 ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public boolean isStrobogrammatic(String num) {
    Map<Character, Character> map = new HashMap<>();
    map.put('0', '0');
    map.put('1', '1');
    map.put('6', '9');
    map.put('8', '8');
    map.put('9', '6');

    int left = 0, right = num.length() - 1;

    while (left <= right) {
        char l = num.charAt(left);
        char r = num.charAt(right);

        if (!map.containsKey(l) || map.get(l) != r) {
            return false;
        }

        left++;
        right--;
    }

    return true;
}
```

---

### 🔒 PREMIUM: Strobogrammatic Number II

**LeetCode 247** | **Difficulty:** Medium | **Premium Problem**

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  STROBOGRAMMATIC NUMBER II                                                ║
║  (LeetCode Premium - Full Problem Description)                            ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Given an integer n, return all the strobogrammatic numbers that are of   ║
║  length n. A strobogrammatic number is a number that looks the same       ║
║  when rotated 180 degrees.                                                ║
║                                                                           ║
║  You may return the answer in any order.                                  ║
║                                                                           ║
║  ─────────────────────────────────────────────────────────────────────    ║
║                                                                           ║
║  Example 1:                                                               ║
║  Input: n = 2                                                             ║
║  Output: ["11", "69", "88", "96"]                                         ║
║                                                                           ║
║  Example 2:                                                               ║
║  Input: n = 1                                                             ║
║  Output: ["0", "1", "8"]                                                  ║
║                                                                           ║
║  Example 3:                                                               ║
║  Input: n = 3                                                             ║
║  Output: ["101", "111", "181", "609", "619", "689",                       ║
║           "808", "818", "888", "906", "916", "986"]                       ║
║                                                                           ║
║  ─────────────────────────────────────────────────────────────────────    ║
║                                                                           ║
║  Constraints:                                                             ║
║  - 1 <= n <= 14                                                           ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public List<String> findStrobogrammatic(int n) {
    return helper(n, n);
}

private List<String> helper(int n, int finalLength) {
    if (n == 0) return Arrays.asList("");
    if (n == 1) return Arrays.asList("0", "1", "8");

    List<String> middles = helper(n - 2, finalLength);
    List<String> result = new ArrayList<>();

    for (String middle : middles) {
        // Don't add "0" at the start if this is the outermost level
        if (n != finalLength) {
            result.add("0" + middle + "0");
        }
        result.add("1" + middle + "1");
        result.add("6" + middle + "9");
        result.add("8" + middle + "8");
        result.add("9" + middle + "6");
    }

    return result;
}
```

---

## 🧩 2.3 Palindrome Problems

### Problem: Valid Palindrome II

**LeetCode 680** | **Difficulty:** Easy
🔗 [https://leetcode.com/problems/valid-palindrome-ii/](https://leetcode.com/problems/valid-palindrome-ii/)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  VALID PALINDROME II                                                      ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Given string s, return true if it can become palindrome after deleting   ║
║  at most one character.                                                   ║
║                                                                           ║
║  Input: s = "abca"                                                        ║
║  Output: true                                                             ║
║  Explanation: Delete 'c' → "aba" or delete 'b' → "aca"                    ║
║                                                                           ║
║  Input: s = "abc"                                                         ║
║  Output: false                                                            ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public boolean validPalindrome(String s) {
    int left = 0, right = s.length() - 1;

    while (left < right) {
        if (s.charAt(left) != s.charAt(right)) {
            // Try skipping left or right character
            return isPalindrome(s, left + 1, right) ||
                   isPalindrome(s, left, right - 1);
        }
        left++;
        right--;
    }
    return true;
}

private boolean isPalindrome(String s, int left, int right) {
    while (left < right) {
        if (s.charAt(left++) != s.charAt(right--)) {
            return false;
        }
    }
    return true;
}
```

---

### 🔒 PREMIUM: Palindrome Permutation

**LeetCode 266** | **Difficulty:** Easy | **Premium Problem**

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  PALINDROME PERMUTATION                                                   ║
║  (LeetCode Premium - Full Problem Description)                            ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Given a string s, return true if a permutation of the string could       ║
║  form a palindrome.                                                       ║
║                                                                           ║
║  ─────────────────────────────────────────────────────────────────────    ║
║                                                                           ║
║  Example 1:                                                               ║
║  Input: s = "code"                                                        ║
║  Output: false                                                            ║
║  Explanation: No permutation of "code" is a palindrome.                   ║
║                                                                           ║
║  Example 2:                                                               ║
║  Input: s = "aab"                                                         ║
║  Output: true                                                             ║
║  Explanation: "aba" is a palindrome permutation.                          ║
║                                                                           ║
║  Example 3:                                                               ║
║  Input: s = "carerac"                                                     ║
║  Output: true                                                             ║
║  Explanation: "carerac" → "racecar" is a palindrome.                      ║
║                                                                           ║
║  ─────────────────────────────────────────────────────────────────────    ║
║                                                                           ║
║  KEY INSIGHT:                                                             ║
║  A string can form a palindrome if at most ONE character has odd count.   ║
║  - Even length: all chars must have even count                            ║
║  - Odd length: exactly one char has odd count (middle char)               ║
║                                                                           ║
║  ─────────────────────────────────────────────────────────────────────    ║
║                                                                           ║
║  Constraints:                                                             ║
║  - 1 <= s.length <= 5000                                                  ║
║  - s consists of only lowercase English letters                           ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public boolean canPermutePalindrome(String s) {
    int[] count = new int[26];

    for (char c : s.toCharArray()) {
        count[c - 'a']++;
    }

    int oddCount = 0;
    for (int c : count) {
        if (c % 2 == 1) oddCount++;
    }

    return oddCount <= 1;
}

// Alternative: Using Set (toggle)
public boolean canPermutePalindromeSet(String s) {
    Set<Character> set = new HashSet<>();

    for (char c : s.toCharArray()) {
        if (set.contains(c)) {
            set.remove(c);  // Seen twice, remove
        } else {
            set.add(c);     // First time, add
        }
    }

    // Set contains chars with odd count
    return set.size() <= 1;
}
```

---

> **Navigation**: [< Previous](02_Math_Numbers.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](04_Arrays.md)

---

### Historical Evolution

**String algorithms** originated with the Knuth-Morris-Pratt algorithm (1977, Donald Knuth, Vaughan Pratt, and James Morris) who solved the substring search problem in O(N+M) time by preprocessing a failure function that enables constant-time longest prefix-suffix matches. The technique was refined by the Rabin-Karp algorithm (1987, Richard Karp and Michael Rabin) who introduced rolling hash-based searching, enabling efficient multi-pattern matching through hash comparisons—a breakthrough for plagiarism detection systems. Gusfield's Z-algorithm (published in his 1997 book "Strings, Sequences, and Streams") provided an alternative linear-time solution by computing Z-values that measure prefix matches, while Manacher's algorithm (1975, Glenn Manacher) discovered how to find longest palindromes in O(N) time by processing palindromes centered between characters rather than at characters. Modern practice anchors this work in bioinformatics applications (DNA sequence alignment using suffix arrays and KMP variants since the Human Genome Project, 1990-2003), plagiarism detection (Turnitin and similar systems using Rabin-Karp fingerprints since 1998), and search engine indexing (inverted indices built on string processing foundations).

<details><summary>Answer</summary>

Both are O(N²) in time, but expand-around-center uses **O(1) space** while DP uses **O(N²) space** for the dp[i][j] table. In practice, the constant factor matters enormously: expand-around-center accesses contiguous memory (expanding outward from a center), giving excellent cache locality. DP fills a 2D table with non-sequential access patterns (diagonal fills), causing cache misses. For N=1000, DP allocates a 1M boolean table; expand uses two integer pointers. Both are O(N²) comparisons, but expand is ~2-3× faster in practice. **Manacher's algorithm** beats both at O(N) time, O(N) space — but is rarely expected in interviews due to its complexity.

</details>

---

### Production Reality

**String** patterns introduce several production failure modes that learners must internalize:

**Failure mode 1: Integer overflow in reverse operations.** LeetCode 7 (Reverse Integer) silently returns 0 for inputs like 1534236469 because reversing produces 9646324351, which exceeds Integer.MAX_VALUE (2147483647). In production, a payment system reversing transaction amounts could lose thousands of dollars if overflow is unchecked. Java's `Integer.parseInt` throws NumberFormatException; returning 0 silently is more dangerous. Production impact: incorrect financial calculations, regulatory compliance failures, potential legal liability.

**Failure mode 2: Quadratic time from string concatenation in loops.** Using `s += c` in a tight loop creates a new String object each iteration (Strings are immutable in Java). For n=100000 characters, this causes O(n²) memory allocations and copies, leading to 5-10 second execution times. A logging system appending characters line-by-line degrades from O(n) to O(n²), causing timeouts. Production impact: request timeouts, thread pool exhaustion, cascading failures in high-throughput systems.

**Failure mode 3: Reference equality vs value equality.** Using `==` to compare Strings compares references, not content. After `String a = new String("test")` and `String b = new String("test")`, `a == b` is false even though `a.equals(b)` is true. This causes authentication failures, cache misses, and incorrect conditional logic in production. Production impact: login failures, data mismatches, unpredictable business logic.

**Debug workflow:** 1. Pre-check overflow before multiplication: `if (x > Integer.MAX_VALUE / 10) return 0`. 2. Use `StringBuilder` for string concatenation in loops—reserve capacity with `new StringBuilder(n)`. 3. Always use `.equals()` for String comparison; use `==` only for interned Strings or when reference equality is intentional. 4. Profile hot loops with `JMH` or visualvm to catch hidden O(n²) behavior. 5. Test with maximum-length inputs (e.g., 100K chars).

**Real-world anchor:** The 2017 Cloudbleed security vulnerability in Cloudflare occurred partly due to string buffer handling issues—when buffers weren't properly managed, sensitive data leaked from memory. Improper string handling in parsing logic caused buffer over-reads, exposing encrypted traffic. This parallels the quadratic concatenation bug and string comparison failures in competitive programming.
