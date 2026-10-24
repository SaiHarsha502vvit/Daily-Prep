# 7.4 Advanced Stack Problems

> **Navigation**: [← 7.3 Queue Problems](04_queue_problems.md) | [Chapter overview](../08_Stack_Queue.md) | [7.5 HackerEarth & Codeforces Stack/Queue… →](06_hackerearth_codeforces_stack_queue_problems.md)
> Page 5 of 6 in **Stack Queue**


**Pattern:** Greedy stack operations — use stack to build optimal sequence by popping suboptimal elements.
**Remove K Digits:** Pop stack top if it's larger than current digit (greedy: smaller digits first).
**132 Pattern:** Monotonic stack tracking the "2" (third element) while scanning backwards.

## Problem 96: Remove K Digits

**LeetCode 402** 🔗 https://leetcode.com/problems/remove-k-digits/

```
┌────────────────────────────────────────────────────────────────┐
│  REMOVE K DIGITS - Make smallest number by removing k digits   │
├────────────────────────────────────────────────────────────────┤
│  num = "1432219", k = 3                                        │
│                                                                │
│  Use monotonic increasing stack:                               │
│  ┌───────┬─────────────────────────┬─────────┐                 │
│  │ Digit │ Stack                   │ k       │                 │
│  ├───────┼─────────────────────────┼─────────┤                 │
│  │   1   │ [1]                     │ 3       │                 │
│  │   4   │ [1,4]                   │ 3       │                 │
│  │   3   │ [1,3] (pop 4)           │ 2       │                 │
│  │   2   │ [1,2] (pop 3)           │ 1       │                 │
│  │   2   │ [1,2,2]                 │ 1       │                 │
│  │   1   │ [1,2,1] (pop 2)         │ 0       │                 │
│  │   9   │ [1,2,1,9]               │ 0       │                 │
│  └───────┴─────────────────────────┴─────────┘                 │
│                                                                │
│  Result: "1219"                                                │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public String removeKdigits(String num, int k) {
    if (k >= num.length()) return "0";

    Deque<Character> stack = new ArrayDeque<>();

    for (char c : num.toCharArray()) {
        while (k > 0 && !stack.isEmpty() && stack.peekLast() > c) {
            stack.pollLast();
            k--;
        }
        stack.addLast(c);
    }

    // Remove remaining k digits from end
    while (k-- > 0) {
        stack.pollLast();
    }

    // Build result, removing leading zeros
    StringBuilder result = new StringBuilder();
    boolean leadingZero = true;

    for (char c : stack) {
        if (leadingZero && c == '0') continue;
        leadingZero = false;
        result.append(c);
    }

    return result.length() == 0 ? "0" : result.toString();
}
```

---

## Problem 97: Remove Duplicate Letters

**LeetCode 316** 🔗 https://leetcode.com/problems/remove-duplicate-letters/

```
┌────────────────────────────────────────────────────────────────┐
│  REMOVE DUPLICATE LETTERS - Smallest lexicographic result      │
├────────────────────────────────────────────────────────────────┤
│  s = "cbacdcbc"                                                │
│                                                                │
│  Goal: Remove duplicates, keep smallest lex order              │
│  Each letter appears exactly once in result                    │
│                                                                │
│  Process:                                                      │
│  ┌───────┬──────────────┬──────────────────────────┐           │
│  │ Char  │ Stack        │ Reason                   │           │
│  ├───────┼──────────────┼──────────────────────────┤           │
│  │   c   │ [c]          │ push                     │           │
│  │   b   │ [b]          │ b<c, c appears later,pop │           │
│  │   a   │ [a]          │ a<b, b appears later,pop │           │
│  │   c   │ [a,c]        │ push                     │           │
│  │   d   │ [a,c,d]      │ push                     │           │
│  │   c   │ [a,c,d]      │ c already in stack, skip │           │
│  │   b   │ [a,b,c,d]    │ b<d but d last, b<c...   │           │
│  │   c   │ [a,b,c,d]    │ c already in stack, skip │           │
│  └───────┴──────────────┴──────────────────────────┘           │
│                                                                │
│  Wait... let me redo: Final = "acdb"                           │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public String removeDuplicateLetters(String s) {
    int[] lastIndex = new int[26];
    boolean[] inStack = new boolean[26];

    // Find last occurrence of each character
    for (int i = 0; i < s.length(); i++) {
        lastIndex[s.charAt(i) - 'a'] = i;
    }

    Deque<Character> stack = new ArrayDeque<>();

    for (int i = 0; i < s.length(); i++) {
        char c = s.charAt(i);
        int idx = c - 'a';

        // Skip if already in stack
        if (inStack[idx]) continue;

        // Pop larger chars that appear later
        while (!stack.isEmpty() &&
               c < stack.peekLast() &&
               lastIndex[stack.peekLast() - 'a'] > i) {
            inStack[stack.pollLast() - 'a'] = false;
        }

        stack.addLast(c);
        inStack[idx] = true;
    }

    StringBuilder result = new StringBuilder();
    for (char c : stack) {
        result.append(c);
    }

    return result.toString();
}
```

---

## Problem 98: 🔒 132 Pattern

**LeetCode 456** 🔗 https://leetcode.com/problems/132-pattern/

```
┌────────────────────────────────────────────────────────────────┐
│  132 PATTERN - Find i < j < k where a[i] < a[k] < a[j]         │
├────────────────────────────────────────────────────────────────┤
│  Example: [3, 1, 4, 2]                                         │
│           a[i]=1, a[j]=4, a[k]=2 → 1 < 2 < 4 ✓                 │
│                                                                │
│  Pattern Visualization:                                        │
│       4 ┌───┐                                                  │
│         │   │                                                  │
│     3 ──┤   │                                                  │
│       2 │   └───┐                                              │
│         │       │                                              │
│     1 ──┴───────┴──                                            │
│         i   j   k                                              │
│                                                                │
│  Approach: Iterate from right, track "a[k]" candidates         │
│  using monotonic decreasing stack                              │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public boolean find132pattern(int[] nums) {
    int n = nums.length;
    if (n < 3) return false;

    Stack<Integer> stack = new Stack<>();
    int third = Integer.MIN_VALUE;  // The "2" in 132 (a[k])

    // Iterate from right to left
    for (int i = n - 1; i >= 0; i--) {
        // Current is potential a[i], check if smaller than "2"
        if (nums[i] < third) return true;

        // Current is potential a[j], pop smaller elements as "2" candidates
        while (!stack.isEmpty() && nums[i] > stack.peek()) {
            third = stack.pop();  // This becomes the "2"
        }

        stack.push(nums[i]);
    }

    return false;
}
```

---

## Problem 99: Online Stock Span

**LeetCode 901** 🔗 https://leetcode.com/problems/online-stock-span/

```
┌────────────────────────────────────────────────────────────────┐
│  ONLINE STOCK SPAN - Days before with price <= today           │
├────────────────────────────────────────────────────────────────┤
│  Prices: [100, 80, 60, 70, 60, 75, 85]                         │
│                                                                │
│  For each day, count consecutive days before (including today) │
│  where price <= today's price:                                 │
│                                                                │
│  ┌───────┬───────┬─────────────────────────────┬───────┐       │
│  │ Day   │ Price │ Explanation                 │ Span  │       │
│  ├───────┼───────┼─────────────────────────────┼───────┤       │
│  │  0    │  100  │ Just today                  │   1   │       │
│  │  1    │   80  │ Just today (100>80)         │   1   │       │
│  │  2    │   60  │ Just today (80>60)          │   1   │       │
│  │  3    │   70  │ [60,70]                     │   2   │       │
│  │  4    │   60  │ Just today (70>60)          │   1   │       │
│  │  5    │   75  │ [60,70,60,75]               │   4   │       │
│  │  6    │   85  │ [60,70,60,75,85]            │   6   │       │
│  └───────┴───────┴─────────────────────────────┴───────┘       │
│                                                                │
│  Use stack of (price, span) pairs                              │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
class StockSpanner {
    private Stack<int[]> stack;  // [price, span]

    public StockSpanner() {
        stack = new Stack<>();
    }

    public int next(int price) {
        int span = 1;

        // Pop and accumulate spans of smaller prices
        while (!stack.isEmpty() && stack.peek()[0] <= price) {
            span += stack.pop()[1];
        }

        stack.push(new int[]{price, span});
        return span;
    }
}
```

---

[← 7.3 Queue Problems](04_queue_problems.md) | [Chapter overview](../08_Stack_Queue.md) | [7.5 HackerEarth & Codeforces Stack/Queue… →](06_hackerearth_codeforces_stack_queue_problems.md)
