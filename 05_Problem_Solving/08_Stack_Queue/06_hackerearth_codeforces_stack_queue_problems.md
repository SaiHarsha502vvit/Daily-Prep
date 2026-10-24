# 7.5 HackerEarth & Codeforces Stack/Queue Problems

> **Navigation**: [← 7.4 Advanced Stack Problems](05_advanced_stack_problems.md) | [Chapter overview](../08_Stack_Queue.md)
> Page 6 of 6 in **Stack Queue**


## Problem 100: Balanced Brackets (HackerEarth)

**BALANCED BRACKETS - Extended validation**

```text
Given a string containing brackets and other characters,
determine if the brackets are balanced.

Valid: "{[()]}", "a{b[c(d)e]f}g", "(())()"
Invalid: "{[}]", "(()", "a{b(c]d}e"

Examples:
Input: "{[a+b]*[c-d]}"  → Output: "YES"
Input: "({[}])"         → Output: "NO" (mismatched)
Input: "((()))"         → Output: "YES"

Constraints:
- 1 <= |s| <= 10^5
- String contains alphanumeric and bracket characters
```

**Solution:**

```java
public String isBalanced(String s) {
    Stack<Character> stack = new Stack<>();

    for (char c : s.toCharArray()) {
        if (c == '(' || c == '{' || c == '[') {
            stack.push(c);
        } else if (c == ')' || c == '}' || c == ']') {
            if (stack.isEmpty()) return "NO";

            char top = stack.pop();
            if ((c == ')' && top != '(') ||
                (c == '}' && top != '{') ||
                (c == ']' && top != '[')) {
                return "NO";
            }
        }
        // Ignore other characters
    }

    return stack.isEmpty() ? "YES" : "NO";
}
```

---

## Problem 101: Maximum Element (HackerEarth/HackerRank)

```
┌────────────────────────────────────────────────────────────────┐
│  MAXIMUM ELEMENT - Stack with max queries                      │
├────────────────────────────────────────────────────────────────┤
│  Support these operations:                                     │
│  1 x : Push x onto the stack                                   │
│  2   : Pop the top element                                     │
│  3   : Print the maximum element in the stack                  │
│                                                                │
│  Example:                                                      │
│  Operations: 1 97, 2, 1 20, 2, 1 26, 1 20, 2, 3, 1 91, 3       │
│                                                                │
│  ┌────────┬────────────────┬────────────┬──────────┐           │
│  │ Query  │ Action         │ Stack      │ Output   │           │
│  ├────────┼────────────────┼────────────┼──────────┤           │
│  │ 1 97   │ push 97        │ [97]       │ -        │           │
│  │ 2      │ pop            │ []         │ -        │           │
│  │ 1 20   │ push 20        │ [20]       │ -        │           │
│  │ 2      │ pop            │ []         │ -        │           │
│  │ 1 26   │ push 26        │ [26]       │ -        │           │
│  │ 1 20   │ push 20        │ [26,20]    │ -        │           │
│  │ 2      │ pop            │ [26]       │ -        │           │
│  │ 3      │ print max      │ [26]       │ 26       │           │
│  │ 1 91   │ push 91        │ [26,91]    │ -        │           │
│  │ 3      │ print max      │ [26,91]    │ 91       │           │
│  └────────┴────────────────┴────────────┴──────────┘           │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public void processQueries(int[][] queries) {
    Stack<int[]> stack = new Stack<>();  // [value, maxSoFar]

    for (int[] query : queries) {
        int type = query[0];

        if (type == 1) {
            int x = query[1];
            int currentMax = stack.isEmpty() ? x : Math.max(x, stack.peek()[1]);
            stack.push(new int[]{x, currentMax});
        } else if (type == 2) {
            if (!stack.isEmpty()) {
                stack.pop();
            }
        } else {  // type == 3
            if (!stack.isEmpty()) {
                System.out.println(stack.peek()[1]);
            }
        }
    }
}
```

---

## Problem 102: Nearest Smaller Element (Codeforces-style)

```
┌────────────────────────────────────────────────────────────────┐
│  NEAREST SMALLER ELEMENT                                       │
├────────────────────────────────────────────────────────────────┤
│  For each element, find the nearest smaller element to its     │
│  left. If none exists, output -1.                              │
│                                                                │
│  Input: [4, 5, 2, 10, 8]                                       │
│                                                                │
│  ┌───────┬─────────┬───────────────────────┬─────────┐         │
│  │ Index │ Element │ Elements to Left      │ Answer  │         │
│  ├───────┼─────────┼───────────────────────┼─────────┤         │
│  │   0   │    4    │ none                  │   -1    │         │
│  │   1   │    5    │ 4                     │    4    │         │
│  │   2   │    2    │ 4,5 (none smaller)    │   -1    │         │
│  │   3   │   10    │ 4,5,2 → nearest is 2  │    2    │         │
│  │   4   │    8    │ 4,5,2,10 → nearest 2  │    2    │         │
│  └───────┴─────────┴───────────────────────┴─────────┘         │
│                                                                │
│  Output: [-1, 4, -1, 2, 2]                                     │
│                                                                │
│  Constraints:                                                  │
│  - 1 <= n <= 10^5                                              │
│  - 1 <= a[i] <= 10^9                                           │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int[] nearestSmallerElement(int[] arr) {
    int n = arr.length;
    int[] result = new int[n];
    Stack<Integer> stack = new Stack<>();

    for (int i = 0; i < n; i++) {
        // Pop elements >= current
        while (!stack.isEmpty() && stack.peek() >= arr[i]) {
            stack.pop();
        }

        result[i] = stack.isEmpty() ? -1 : stack.peek();
        stack.push(arr[i]);
    }

    return result;
}
```

---

## Problem 103: Prefix to Postfix Conversion (HackerEarth)

```
┌────────────────────────────────────────────────────────────────┐
│  PREFIX TO POSTFIX CONVERSION                                  │
├────────────────────────────────────────────────────────────────┤
│  Convert prefix expression to postfix using stack              │
│                                                                │
│  Prefix:  *+AB-CD   (operator before operands)                 │
│  Postfix: AB+CD-*   (operator after operands)                  │
│                                                                │
│  Algorithm: Read from RIGHT to LEFT                            │
│  ┌───────┬──────────────────────────────┬─────────────────────┐│
│  │ Char  │ Action                       │ Stack               ││
│  ├───────┼──────────────────────────────┼─────────────────────┤│
│  │   D   │ push                         │ [D]                 ││
│  │   C   │ push                         │ [D, C]              ││
│  │   -   │ pop C,D → "CD-" push         │ [D, CD-]            ││
│  │   B   │ push                         │ [D, CD-, B]         ││
│  │   A   │ push                         │ [D, CD-, B, A]      ││
│  │   +   │ pop A,B → "AB+" push         │ [D, CD-, AB+]       ││
│  │   *   │ pop AB+,CD- → "AB+CD-*"      │ [AB+CD-*]           ││
│  └───────┴──────────────────────────────┴─────────────────────┘│
│                                                                │
│  Result: "AB+CD-*"                                             │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public String prefixToPostfix(String prefix) {
    Stack<String> stack = new Stack<>();

    // Read from right to left
    for (int i = prefix.length() - 1; i >= 0; i--) {
        char c = prefix.charAt(i);

        if (Character.isLetterOrDigit(c)) {
            stack.push(String.valueOf(c));
        } else {
            // Operator: pop two operands
            String op1 = stack.pop();
            String op2 = stack.pop();
            // Postfix: operand1 + operand2 + operator
            stack.push(op1 + op2 + c);
        }
    }

    return stack.pop();
}
```

---

---

## 🏆 Competitive Programming — Codeforces Problems

| Problem                          | Link                                                         | Technique                          | Difficulty  |
| -------------------------------- | ------------------------------------------------------------ | ---------------------------------- | ----------- |
| Longest Regular Bracket Sequence | [CF 5C](https://codeforces.com/problemset/problem/5/C)       | Stack → longest valid bracket span | ⭐⭐ Medium |
| Queue on Segments                | [CF 566E](https://codeforces.com/problemset/problem/566/E)   | Deque + segment tree               | ⭐⭐⭐ Hard |
| Constructing Streets             | [CF 1264C](https://codeforces.com/problemset/problem/1264/C) | Monotonic stack application        | ⭐⭐ Medium |
| Stock Market                     | [CF 865C](https://codeforces.com/problemset/problem/865/C)   | Stack-based price calculation      | ⭐⭐ Medium |
| Towers                           | [CF 37B](https://codeforces.com/problemset/problem/37/B)     | Priority queue ordering            | ⭐ Easy     |

---

## 🌍 Real-World Applications of Stack & Queue

| Technique                | Real-World System    | How It's Used                                                                             |
| ------------------------ | -------------------- | ----------------------------------------------------------------------------------------- |
| **Stack (LIFO)**         | JVM call stack       | Every method call pushes a frame; return pops it — StackOverflowError when limit exceeded |
| **Stack (undo/redo)**    | VS Code / Photoshop  | Action stack; undo = pop; redo = push to redo stack                                       |
| **Monotonic Stack**      | Financial systems    | "Next day price is higher than today?" = monotonic stack for stock span                   |
| **Queue (FIFO)**         | Kafka, RabbitMQ      | Message queue ensures FIFO delivery between microservices                                 |
| **Deque (double-ended)** | Browser back/forward | Deque for page history; can push/pop from either end                                      |
| **Priority Queue**       | OS task scheduler    | Always run highest-priority ready thread                                                  |

```
🔥 MONOTONIC STACK = MOST UNDERRATED INTERVIEW PATTERN:
   "Largest Rectangle in Histogram" (LC 84) = monotonic stack
   This exact algorithm runs in: Apache Kafka (lag monitoring),
   AWS CloudWatch (threshold breach detection)
   "When did metric exceed threshold last time?" = next greater element
```

---

---

---

### Historical Evolution

Stacks entered computing through subroutine linkage (Turing's 1945 design for the ACE used a "bury/unbury" mechanism) and stack-based hardware such as the Burroughs B5000 (1961). Edsger Dijkstra's shunting-yard algorithm for converting infix to postfix is from 1961 (Mathematisch Centrum report), building on Łukasiewicz's prefix notation (1924). The monotonic stack is folklore tied to the "all nearest smaller values" problem (Berkman, Schieber and Vishkin, 1993) and to Cartesian trees (Vuillemin, 1980). Breadth-first search, the classic queue user, is due to Moore (1959).

- **Łukasiewicz — 1924**: Parenthesis-free prefix notation
- **B5000 / Dijkstra — 1961**: Stack hardware; shunting-yard algorithm
- **Moore — 1959**: BFS with a queue for maze routing
- **Vuillemin — 1980**: Cartesian trees
- **Berkman et al. — 1993**: All nearest smaller values

### Production Reality

**Stack and Queue** patterns introduce several production failure modes that learners must internalize:

**Failure mode 1: Monotonicity assumption violated in production data.** Monotonic stack guarantees O(n) only when the predicate (next greater, next smaller) holds monotonically. Financial time-series data often has oscillating volatility or repeating values that break monotonicity, causing O(n^2) behavior. Illustrative impact: a risk calculation service at a hedge fund used monotonic stack for sliding window maximum on 1-minute price data. During high-frequency oscillation periods (common in pre-market trading), the stack never shrank, causing 100x slowdown on datasets of 10,000+ ticks and triggering SLA breaches for real-time risk reporting.

**Failure mode 2: Stack overflow from recursive expression parser.** Recursive descent parsers for arithmetic expressions (a common interview pattern) recursively descend for each parenthesis depth. Production input like deeply nested formulas from Excel spreadsheets or LISP code can exceed default stack sizes. Illustrative impact: a financial reporting tool crashed when parsing a formula with 10,000+ nested IF statements (legal in Excel), causing a stack overflow that propagated as a silent failure, producing incorrect tax calculations for 2,000 corporate clients.

**Debug workflow:** (1) Verify monotonicity holds by sampling production data: check if `strictly decreasing` holds, not just `decreasing`. (2) Use iterative stack instead of recursion for parsers: explicitly manage your own stack with while loop. (3) Set explicit stack size in containerized environments: `--thread-stack-size=2MB` in JVM. (4) Profile both worst-case (all ascending for decreasing-stack) and average-case inputs. (5) Add `maxStackDepth` instrumentation: alert if depth exceeds 90% of expected maximum.

**Real-world anchor:** Operating-system kernels have small fixed stacks (on x86-64 Linux, 16 KB per thread), so kernel code avoids deep recursion and uses explicit stacks or iteration — the same reason you convert deep recursive DFS to an explicit stack.

---

[← 7.4 Advanced Stack Problems](05_advanced_stack_problems.md) | [Chapter overview](../08_Stack_Queue.md)
