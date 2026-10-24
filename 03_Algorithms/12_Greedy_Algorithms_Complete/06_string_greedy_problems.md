# String Greedy Problems <a name="string-greedy"></a>

> **Navigation**: [← Array Greedy Problems](05_array_greedy_problems.md) | [Chapter overview](../12_Greedy_Algorithms_Complete.md) | [Graph Greedy Algorithms →](07_graph_greedy_algorithms.md)
> Page 6 of 7 in **Greedy Algorithms Complete Guide**


## Remove K Digits (LeetCode 402)

```java
/*
Remove k digits to get smallest number.
Greedy: Remove larger digits that come before smaller digits.
Use monotonic stack.
*/

public String removeKdigits(String num, int k) {
    Deque<Character> stack = new ArrayDeque<>();

    for (char c : num.toCharArray()) {
        // Remove larger digits
        while (!stack.isEmpty() && k > 0 && stack.peek() > c) {
            stack.pop();
            k--;
        }
        stack.push(c);
    }

    // Remove remaining from end
    while (k-- > 0) stack.pop();

    // Build result, remove leading zeros
    StringBuilder sb = new StringBuilder();
    while (!stack.isEmpty()) {
        sb.append(stack.pollLast());
    }
    while (sb.length() > 0 && sb.charAt(0) == '0') {
        sb.deleteCharAt(0);
    }

    return sb.length() == 0 ? "0" : sb.toString();
}
```

## Partition Labels (LeetCode 763)

```java
/*
Partition string so each letter appears in at most one part.
Return list of part lengths.

Greedy: For each position, extend partition to include
all occurrences of current letters.
*/

public List<Integer> partitionLabels(String s) {
    // Record last occurrence of each character
    int[] lastIndex = new int[26];
    for (int i = 0; i < s.length(); i++) {
        lastIndex[s.charAt(i) - 'a'] = i;
    }

    List<Integer> result = new ArrayList<>();
    int start = 0, end = 0;

    for (int i = 0; i < s.length(); i++) {
        // Extend partition to include all of current char
        end = Math.max(end, lastIndex[s.charAt(i) - 'a']);

        // Reached end of current partition
        if (i == end) {
            result.add(end - start + 1);
            start = end + 1;
        }
    }
    return result;
}
```

## Reorganize String (LeetCode 767)

```java
/*
Rearrange string so no adjacent characters are same.
Return "" if impossible.

Greedy: Always place the most frequent character,
alternating positions.
*/

public String reorganizeString(String s) {
    int[] count = new int[26];
    for (char c : s.toCharArray()) {
        count[c - 'a']++;
    }

    // Check if possible
    int maxCount = 0, maxChar = 0;
    for (int i = 0; i < 26; i++) {
        if (count[i] > maxCount) {
            maxCount = count[i];
            maxChar = i;
        }
    }
    if (maxCount > (s.length() + 1) / 2) return "";

    // Fill even positions with most frequent
    char[] result = new char[s.length()];
    int index = 0;

    while (count[maxChar]-- > 0) {
        result[index] = (char) ('a' + maxChar);
        index += 2;
    }

    // Fill remaining
    for (int i = 0; i < 26; i++) {
        while (count[i]-- > 0) {
            if (index >= s.length()) index = 1;
            result[index] = (char) ('a' + i);
            index += 2;
        }
    }

    return new String(result);
}
```

## Task Scheduler (LeetCode 621)

```java
/*
Tasks with cooldown n between same tasks.
Minimum time to complete all tasks.
*/

public int leastInterval(char[] tasks, int n) {
    int[] count = new int[26];
    for (char task : tasks) {
        count[task - 'A']++;
    }

    Arrays.sort(count);
    int maxCount = count[25];

    // Count tasks with max frequency
    int maxCountTasks = 0;
    for (int i = 25; i >= 0 && count[i] == maxCount; i--) {
        maxCountTasks++;
    }

    // Formula: (maxCount - 1) * (n + 1) + maxCountTasks
    // Or just total tasks if no idle needed
    return Math.max(tasks.length, (maxCount - 1) * (n + 1) + maxCountTasks);
}

/*
Visual for tasks = [A,A,A,B,B,B], n = 2:
A B _ A B _ A B
(max-1)=2 groups of (n+1)=3, plus 2 maxCount tasks at end
*/
```

---

[← Array Greedy Problems](05_array_greedy_problems.md) | [Chapter overview](../12_Greedy_Algorithms_Complete.md) | [Graph Greedy Algorithms →](07_graph_greedy_algorithms.md)
