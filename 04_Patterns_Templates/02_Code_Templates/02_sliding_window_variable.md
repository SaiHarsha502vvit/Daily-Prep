# 📌 3. Sliding Window — Variable

> **Navigation**: [← 1. Two Pointers](01_two_pointers.md) | [Chapter overview](../02_Code_Templates.md) | [4. Binary Search →](03_binary_search.md)
> Page 2 of 8 in **Code Templates — Pattern Guide**


## Visual Concept

**Variable sliding window**

Problem: Find longest substring with at most K=2 distinct characters

String: "eceba"

Step 1: Expand while valid (≤2 distinct)

```text
e │ c │ e │ b │ a │  distinct: {e}=1 ≤2 ✓
```

Step 2: Keep expanding

```text
e │ c │ e │ b │ a │  distinct: {e,c}=2 ≤2 ✓
```

Step 3: Keep expanding

```text
e │ c │ e │ b │ a │  distinct: {e,c}=2 ≤2 ✓  maxLen=3
```

Step 4: Expand - becomes invalid

```text
e │ c │ e │ b │ a │  distinct: {e,c,b}=3 >2 ✗
```

Step 5: SHRINK from left until valid

```text
e │ c │ e │ b │ a │  distinct: {c,e,b}=3 >2 ✗ (shrink more)
```

```text
e │ c │ e │ b │ a │  distinct: {e,b}=2 ≤2 ✓
```

Answer: Maximum length = 3 ("ece")

## Template: Longest Substring with At Most K Distinct

```java
/**
 * VARIABLE WINDOW TEMPLATE
 * Time: O(N), Space: O(K)
 *
 * Pattern:
 * 1. Expand right pointer
 * 2. While invalid, shrink left pointer
 * 3. Update answer when valid
 */
public int longestSubstringKDistinct(String s, int k) {
    if (s == null || s.length() == 0 || k == 0) return 0;

    Map<Character, Integer> charCount = new HashMap<>();
    int maxLength = 0;
    int left = 0;

    for (int right = 0; right < s.length(); right++) {
        // Expand: Add right character to window
        char rightChar = s.charAt(right);
        charCount.put(rightChar, charCount.getOrDefault(rightChar, 0) + 1);

        // Shrink: While window is invalid (more than K distinct)
        while (charCount.size() > k) {
            char leftChar = s.charAt(left);
            charCount.put(leftChar, charCount.get(leftChar) - 1);
            if (charCount.get(leftChar) == 0) {
                charCount.remove(leftChar);  // Remove when count hits 0
            }
            left++;  // Shrink window
        }

        // Update: Window is now valid
        int windowSize = right - left + 1;
        maxLength = Math.max(maxLength, windowSize);
    }
    return maxLength;
}
```

## Template: Minimum Window Substring

```java
/**
 * VISUAL: Find smallest window containing all target characters
 *
 * s = "ADOBECODEBANC", t = "ABC"
 *
 * Need: A=1, B=1, C=1
 *
 *  A D O B E C O D E B A  N  C
 *  0 1 2 3 4 5 6 7 8 9 10 11 12
 *
 *  Window [0,5] "ADOBEC" contains ABC → valid, length=6
 *  Window [9,12] "BANC" contains ABC → valid, length=4 ⭐
 */
public String minWindow(String s, String t) {
    if (s.length() < t.length()) return "";

    // Count characters needed
    Map<Character, Integer> need = new HashMap<>();
    for (char c : t.toCharArray()) {
        need.put(c, need.getOrDefault(c, 0) + 1);
    }

    Map<Character, Integer> window = new HashMap<>();
    int have = 0;          // How many unique chars we have enough of
    int required = need.size();  // How many unique chars we need

    int[] result = {-1, 0, 0};  // length, left, right
    int left = 0;

    for (int right = 0; right < s.length(); right++) {
        // Expand: Add right character
        char c = s.charAt(right);
        window.put(c, window.getOrDefault(c, 0) + 1);

        // Check if this char now satisfies requirement
        if (need.containsKey(c) && window.get(c).equals(need.get(c))) {
            have++;
        }

        // Shrink: While we have all required characters
        while (have == required) {
            // Update result if smaller
            int windowLen = right - left + 1;
            if (result[0] == -1 || windowLen < result[0]) {
                result[0] = windowLen;
                result[1] = left;
                result[2] = right;
            }

            // Shrink from left
            char leftChar = s.charAt(left);
            window.put(leftChar, window.get(leftChar) - 1);
            if (need.containsKey(leftChar) && window.get(leftChar) < need.get(leftChar)) {
                have--;  // No longer satisfy this character
            }
            left++;
        }
    }
    return result[0] == -1 ? "" : s.substring(result[1], result[2] + 1);
}
```

---

🔬 **Section Challenge — 📌 3. Sliding Window — Variable**

**Challenge 1 (Variable Window Shrink Condition):** Variable sliding window shrinks the window when a CONSTRAINT is violated. **Who** decides when to shrink? **When** does a `while` loop work better than an `if` for the shrink step? **What** is the minimum window substring shrink logic for LC 76?\n\n<details><summary>Answer</summary>\n\n**Who decides when to shrink:** The constraint check. For LC 76 (Minimum Window Substring): shrink when the window contains all required characters (constraint satisfied = window is valid but possibly too big). For LC 3 (Longest Substring Without Repeating): shrink when `charCount[right] > 1` (constraint violated = duplicate found). **`while` vs `if` for shrink:** Use `while` when you need to shrink UNTIL the constraint is satisfied (e.g., remove all duplicates: `while (freq[s[left]] > 1) { freq[s[left]]--; left++; }`). Use `if` when at most one element needs removal per step. In practice, `while` is safer — it handles multiple violations in one expansion step. **LC 76 Minimum Window Substring shrink logic:** (1) Expand `right`: add `s[right]` to window frequency. (2) Check if all required chars are present (use `formed == required` counter). (3) While window is valid: update `minLen`, shrink from `left` (remove `s[left]` from freq, decrement `formed` if needed, increment `left`). (4) Continue expanding. **Key insight:** Variable window achieves O(n) because each character is added to the window exactly once (right pointer advances) and removed at most once (left pointer advances). Total pointer moves = 2n.\n\n</details>

<details><summary>Answer</summary>

Each element enters the window exactly ONCE (right pointer advances past it) and leaves exactly ONCE (left pointer advances past it). Total operations: 2N regardless of window size changes. Compare to brute force: for each ending position, scan back to find optimal start = O(N²). The window's state (sum, freq map, etc.) is maintained INCREMENTALLY — O(1) per pointer move.

</details>

---

[← 1. Two Pointers](01_two_pointers.md) | [Chapter overview](../02_Code_Templates.md) | [4. Binary Search →](03_binary_search.md)
