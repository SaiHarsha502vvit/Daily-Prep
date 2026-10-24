# 7.1 Basic Stack Problems

> **Navigation**: [← SECTION 7: STACK & QUEUE PROBLEMS](01_section_7_stack_queue_problems.md) | [Chapter overview](../08_Stack_Queue.md) | [7.2 Monotonic Stack Problems →](03_monotonic_stack_problems.md)
> Page 2 of 6 in **Stack Queue**


**Pattern:** Use stack for matching (parentheses, tags) and undo operations (min stack).
**Key insight:** LIFO perfectly models "most recent unmatched" problems.

## Problem 78: Valid Parentheses

**LeetCode 20** 🔗 https://leetcode.com/problems/valid-parentheses/

### VALID PARENTHESES - Check if brackets are balanced

Input: "({[]})"

Processing with Stack:

| Char | Action | Stack State |
| --- | --- | --- |
| ( | push ) | [)] |
| { | push } | [), }] |
| [ | push ] | [), }, ]] |
| ] | pop | [), }]  ✓ |
| } | pop | [)]      ✓ |
| ) | pop | []       ✓ |

Stack empty at end → Valid! ✓

**Examples:**

- Input: `"()"` → Output: `true`
- Input: `"()[]{}"` → Output: `true`
- Input: `"(]"` → Output: `false`

**Constraints:**

- 1 <= s.length <= 10⁴
- s consists of parentheses only '()[]{}'

**Solution:**

```java
public boolean isValid(String s) {
    Stack<Character> stack = new Stack<>();

    for (char c : s.toCharArray()) {
        // Push expected closing bracket
        if (c == '(') stack.push(')');
        else if (c == '{') stack.push('}');
        else if (c == '[') stack.push(']');
        // Check closing bracket
        else if (stack.isEmpty() || stack.pop() != c) {
            return false;
        }
    }

    return stack.isEmpty();
}
```

---

## Problem 79: Min Stack

**LeetCode 155** 🔗 https://leetcode.com/problems/min-stack/

### MIN STACK - Stack that supports getMin() in O(1)

Operations: push(5), push(2), push(7), push(1)

Approach 1: Two Stacks

| Main Stack | Min Stack |  |
| --- | --- | --- |
| 1 | 1 | ← top |
| 7 | 2 |  |
| 2 | 2 |  |
| 5 | 5 |  |

getMin() → peek min stack → 1

Approach 2: Single Stack with Pairs  
Stack: [(5,5), (2,2), (7,2), (1,1)]  
(val, minSoFar)

**Operations:**

- `push(val)` - Push element onto stack
- `pop()` - Remove top element
- `top()` - Get top element
- `getMin()` - Retrieve minimum element in O(1)

**Solution:**

```java
class MinStack {
    private Stack<int[]> stack;  // [value, currentMin]

    public MinStack() {
        stack = new Stack<>();
    }

    public void push(int val) {
        int currentMin = stack.isEmpty() ? val : Math.min(val, stack.peek()[1]);
        stack.push(new int[]{val, currentMin});
    }

    public void pop() {
        stack.pop();
    }

    public int top() {
        return stack.peek()[0];
    }

    public int getMin() {
        return stack.peek()[1];
    }
}
```

---

## Problem 80: 🔒 Max Stack (LeetCode 716 - Premium)

**MAX STACK - Stack with popMax() operation**

```text
Design a max stack that supports:
- push(x): Push x onto stack
- pop(): Remove top element
- top(): Get top element
- peekMax(): Retrieve maximum element
- popMax(): Remove maximum element (topmost if tie)

Example:
MaxStack stack = new MaxStack();
stack.push(5);   // Stack: [5]
stack.push(1);   // Stack: [5, 1]
stack.push(5);   // Stack: [5, 1, 5]
stack.top();     // Returns 5
stack.popMax();  // Returns 5, Stack: [5, 1]
stack.top();     // Returns 1
stack.peekMax(); // Returns 5
stack.pop();     // Returns 1, Stack: [5]
stack.top();     // Returns 5

Constraints:
- -10^7 <= x <= 10^7
- At most 10^4 operations
- popMax and pop called only when stack not empty
```

**Solution (Using TreeMap + Doubly Linked List for O(log n)):**

```java
class MaxStack {
    private TreeMap<Integer, List<Node>> map;
    private DoublyLinkedList dll;

    class Node {
        int val;
        Node prev, next;
        Node(int val) { this.val = val; }
    }

    class DoublyLinkedList {
        Node head, tail;

        DoublyLinkedList() {
            head = new Node(0);
            tail = new Node(0);
            head.next = tail;
            tail.prev = head;
        }

        Node addLast(int val) {
            Node node = new Node(val);
            node.prev = tail.prev;
            node.next = tail;
            tail.prev.next = node;
            tail.prev = node;
            return node;
        }

        void remove(Node node) {
            node.prev.next = node.next;
            node.next.prev = node.prev;
        }

        Node getLast() {
            return tail.prev;
        }
    }

    public MaxStack() {
        map = new TreeMap<>();
        dll = new DoublyLinkedList();
    }

    public void push(int x) {
        Node node = dll.addLast(x);
        map.computeIfAbsent(x, k -> new ArrayList<>()).add(node);
    }

    public int pop() {
        Node node = dll.getLast();
        dll.remove(node);
        List<Node> list = map.get(node.val);
        list.remove(list.size() - 1);
        if (list.isEmpty()) map.remove(node.val);
        return node.val;
    }

    public int top() {
        return dll.getLast().val;
    }

    public int peekMax() {
        return map.lastKey();
    }

    public int popMax() {
        int maxVal = map.lastKey();
        List<Node> list = map.get(maxVal);
        Node node = list.remove(list.size() - 1);
        dll.remove(node);
        if (list.isEmpty()) map.remove(maxVal);
        return maxVal;
    }
}
```

---

## Problem 81: Decode String

**LeetCode 394** 🔗 https://leetcode.com/problems/decode-string/

### DECODE STRING - Expand encoded string

Input: "3[a2[c]]"

Process with Stack:

| Char | Action | Stack / Result |
| --- | --- | --- |
| 3 | build num | num=3 |
| [ | push | [(3, "")] |
| a | build str | currentStr="a" |
| 2 | build num | num=2 |
| [ | push | [(3,""), (2,"a")] |
| c | build str | currentStr="c" |
| ] | pop & rep | [(3,"")] → "a" + "cc" = "acc" |
| ] | pop & rep | [] → "" + "accaccacc" |

Output: "accaccacc"

**Examples:**

- Input: `"3[a]2[bc]"` → Output: `"aaabcbc"`
- Input: `"3[a2[c]]"` → Output: `"accaccacc"`
- Input: `"2[abc]3[cd]ef"` → Output: `"abcabccdcdcdef"`

**Solution:**

```java
public String decodeString(String s) {
    Stack<Integer> countStack = new Stack<>();
    Stack<StringBuilder> stringStack = new Stack<>();
    StringBuilder current = new StringBuilder();
    int num = 0;

    for (char c : s.toCharArray()) {
        if (Character.isDigit(c)) {
            num = num * 10 + (c - '0');
        } else if (c == '[') {
            countStack.push(num);
            stringStack.push(current);
            current = new StringBuilder();
            num = 0;
        } else if (c == ']') {
            int repeatTimes = countStack.pop();
            StringBuilder prev = stringStack.pop();
            for (int i = 0; i < repeatTimes; i++) {
                prev.append(current);
            }
            current = prev;
        } else {
            current.append(c);
        }
    }

    return current.toString();
}
```

---

## Problem 82: Evaluate Reverse Polish Notation

**LeetCode 150** 🔗 https://leetcode.com/problems/evaluate-reverse-polish-notation/

### REVERSE POLISH NOTATION (Postfix Expression)

Input: ["2","1","+","3","*"]

Infix equivalent: ((2 + 1) * 3) = 9

Stack Processing:

| Token | Action | Stack |
| --- | --- | --- |
| 2 | push | [2] |
| 1 | push | [2, 1] |
| + | pop 1,2 → 2+1=3 | [3] |
| 3 | push | [3, 3] |
| * | pop 3,3 → 3*3=9 | [9] |

Result: 9

**Examples:**

- Input: `["2","1","+","3","*"]` → Output: `9` (((2+1)\*3))
- Input: `["4","13","5","/","+"]` → Output: `6` ((4+(13/5)))
- Input: `["10","6","9","3","+","-11","*","/","*","17","+","5","+"]` → Output: `22`

**Solution:**

```java
public int evalRPN(String[] tokens) {
    Stack<Integer> stack = new Stack<>();

    for (String token : tokens) {
        if ("+-*/".contains(token)) {
            int b = stack.pop();
            int a = stack.pop();

            switch (token) {
                case "+": stack.push(a + b); break;
                case "-": stack.push(a - b); break;
                case "*": stack.push(a * b); break;
                case "/": stack.push(a / b); break;
            }
        } else {
            stack.push(Integer.parseInt(token));
        }
    }

    return stack.pop();
}
```

---

## Problem 83: 🔒 Basic Calculator III (LeetCode 772 - Premium)

**BASIC CALCULATOR III - Evaluate expression with +,-,*,/,()**

```text
Implement a basic calculator to evaluate a simple expression
string. The expression string contains only non-negative
integers, +, -, *, / operators, open ( and closing )
parentheses, and empty spaces.

Examples:
Input: "1+1"              → Output: 2
Input: "6-4/2"            → Output: 4
Input: "2*(5+5*2)/3+(6/2+8)" → Output: 21
Input: "(2+6*3+5-(3*14/7+2)*5)+3" → Output: -12

Constraints:
- 1 <= s.length <= 10^4
- s consists of digits, +, -, *, /, (, ), and spaces
- s represents a valid expression
- All intermediate results in range [-2^31, 2^31 - 1]
```

**Solution:**

```java
public int calculate(String s) {
    Queue<Character> queue = new LinkedList<>();
    for (char c : s.toCharArray()) {
        if (c != ' ') queue.offer(c);
    }
    queue.offer('+');  // Sentinel
    return helper(queue);
}

private int helper(Queue<Character> queue) {
    int num = 0, prev = 0, sum = 0;
    char prevOp = '+';

    while (!queue.isEmpty()) {
        char c = queue.poll();

        if (Character.isDigit(c)) {
            num = num * 10 + (c - '0');
        } else if (c == '(') {
            num = helper(queue);  // Recursively evaluate parentheses
        } else {
            // Apply previous operator
            switch (prevOp) {
                case '+': sum += prev; prev = num; break;
                case '-': sum += prev; prev = -num; break;
                case '*': prev *= num; break;
                case '/': prev /= num; break;
            }

            if (c == ')') break;  // Return from recursion

            num = 0;
            prevOp = c;
        }
    }

    return sum + prev;
}
```

---

[← SECTION 7: STACK & QUEUE PROBLEMS](01_section_7_stack_queue_problems.md) | [Chapter overview](../08_Stack_Queue.md) | [7.2 Monotonic Stack Problems →](03_monotonic_stack_problems.md)
