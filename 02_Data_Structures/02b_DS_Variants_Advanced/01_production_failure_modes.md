# Production Failure Modes

> **Navigation**: [Chapter overview](../02b_DS_Variants_Advanced.md) | [Queue Variants →](02_queue_variants.md)
> Page 1 of 5 in **Advanced Data Structure Variants: Stacks, Queues, & Trees**



## Production failure modes for advanced ds

> [!WARNING]
> The failure modes below are patterns that occur in real production systems; each lists the symptom and the fix.

### FAILURE 1: MONOTONIC QUEUE OVERFLOW (Unbounded Window Growth)

Scenario: Streaming data with variable window sizes
Problem:  If window size k grows unboundedly, deque stores O(n) elements
Symptom:  Memory exhaustion in long-running stream processors
Example:  Apache Spark job processing stock trades without watermark
timeout → deque accumulates all prices → OOM
Fix:      Implement explicit eviction policy or use time-based windows

**Failure 2:** AVL REBALANCING CASCADE (Skewed Insertions)

Scenario: Sequential insertion of sorted data (e.g., auto-increment IDs)
Problem:  Each insertion triggers balance check up to root; O(log n) per
insert, but constants are higher than Red-Black (more rotations)
Symptom:  15-20% slower than Red-Black for bulk inserts in benchmarks
Example:  Inserting 1M sequential IDs into AVL vs RB tree in Java
Fix:      Use bulk loading (balanced array build) or switch to Red-Black

**Failure 3:** MIN STACK STACK-OVERFLOW (Recursive Implementation)

Scenario: Deep stack usage (DFS on large graphs, recursive JSON parsers)
Problem:  If getMin() uses recursion to find minimum, stack depth hits
Java's default ~1024 frame limit
Symptom:  StackOverflowError in production under deep recursion
Example:  Processing JSON with nesting depth > 2000
Fix:      Use iterative two-stack approach; stack storage in heap

**Failure 4:** ROPE TREE IMBALANCE (Pathological Text Patterns)

Scenario: Concatenating strings with similar length distributions
Problem:  Naive rope implementation can create O(n) depth if concatenating
sequences of equal-sized ropes (not truly balanced)
Symptom:  O(n) traversal instead of O(log n) — silent performance death
Example:  Appending log lines of similar length to a Rope buffer
Fix:      Use weight-based rebalancing (like implicit treap) or Fibonacci
concatenation strategy

**Mitigation Checklist:**

| Failure Mode             | Mitigation                                                           |
| ------------------------ | -------------------------------------------------------------------- |
| Monotonic Queue overflow | Add max-size guard; use time-window eviction                         |
| AVL rebalancing cost     | Profile with sorted bulk inserts; switch to RB if needed             |
| Min Stack overflow       | Use heap-based stack (two Stack objects in Java)                     |
| Rope imbalance           | Implement explicit rebalancing or use existing library ( ropes-java) |


---

## 2.1 Min Stack

### 💬 Study-Partner View — Min Stack

**1. The bottom line:** A stack that always knows its smallest value, so `getMin()` is instant.

**2. The textbook core:**

- Each entry stores the value **and** the minimum so far (or use a second stack for mins).
- `push`, `pop`, `peek`, `getMin`: all **O(1)**; space O(n).
- Invariant: the min stored at the top equals the minimum of all elements currently in the stack.
- Popping automatically restores the previous minimum.

**3. The real-world analogy:** A **stack of plates with a price tag on each plate showing the cheapest plate underneath and including it**. The top plate's tag always answers "what is the cheapest?".

**4. Walkthrough:**

1. Push 3 → store `(3, min 3)`. Push 5 → `(5, min 3)`. Push 2 → `(2, min 2)`.
2. `getMin()` reads the top tag → 2.
3. `pop()` removes `(2, min 2)`; the top is `(5, min 3)`, so `getMin()` is 3 again.

> [!NOTE]
> **Quick check:** Why not just track one `min` variable? *After popping the minimum you would not know the next smallest.*


## What Is It?

A stack that supports:

- push(x) - O(1)
- pop() - O(1)
- top() - O(1)
- getMin() - O(1) ← THE SPECIAL OPERATION!

**Challenge**: How to get minimum in O(1)?

**Naive**: Search entire stack → O(n)

**Smart**: Track minimum at EACH state of the stack!

**INVARIANT (Min Stack):**

```
For any stack state S with minStack M:
  M.top() = min{ x | x is in S }
  After push(v): M pushes min(v, M.top_before_push)
  After pop():   Both stacks pop (M maintains consistency)
```

APPROACH 1 - TWO STACKS:
Main Stack: [3, 5, 2, 7, 1] top→
Min Stack: [3, 3, 2, 2, 1] top→
Min stack stores the minimum at each point!
When we pop, both stacks pop.
getMin() = minStack.top()
APPROACH 2 - SINGLE STACK WITH PAIRS:
Stack: [(3,3), (5,3), (2,2), (7,2), (1,1)]
(value, min_at_this_point)


```java
// MIN STACK - TWO STACK APPROACH
public class MinStack {
    private Stack<Integer> mainStack;
    private Stack<Integer> minStack;

    public MinStack() {
        mainStack = new Stack<>();
        minStack = new Stack<>();
    }

    public void push(int val) {
        mainStack.push(val);

        // Push to minStack: either val or current min (whichever is smaller)
        if (minStack.isEmpty()) {
            minStack.push(val);
        } else {
            minStack.push(Math.min(val, minStack.peek()));
        }
    }

    public void pop() {
        mainStack.pop();
        minStack.pop();
    }

    public int top() {
        return mainStack.peek();
    }

    public int getMin() {
        return minStack.peek();
    }
}

// MIN STACK - SPACE OPTIMIZED (SINGLE STACK)
public class MinStackOptimized {
    private Stack<Long> stack;
    private long min;

    public MinStackOptimized() {
        stack = new Stack<>();
    }

    public void push(int val) {
        if (stack.isEmpty()) {
            min = val;
            stack.push(0L);  // Difference from min
        } else {
            stack.push((long)val - min);
            if (val < min) {
                min = val;
            }
        }
    }

    public void pop() {
        long top = stack.pop();
        if (top < 0) {
            // We need to restore previous min
            min = min - top;
        }
    }

    public int top() {
        long top = stack.peek();
        if (top < 0) {
            return (int)min;
        }
        return (int)(min + top);
    }

    public int getMin() {
        return (int)min;
    }
}
```

---

## 2.2 Max Stack

### 💬 Study-Partner View — Max Stack

**1. The bottom line:** The mirror image of a Min Stack: a stack that always knows its largest value.

**2. The textbook core:**

- Same design as the Min Stack but each entry stores the **maximum** so far.
- `push`, `pop`, `peek`, `getMax`: all **O(1)**.
- `popMax()` (remove the max wherever it is) needs more machinery, such as a second stack or a heap with lazy deletion.
- Common in stock-span and "largest so far" problems.

**3. The real-world analogy:** A **scoreboard that keeps the high score visible**; each new play updates it, and undoing a play restores the previous high score.

**4. Walkthrough:**

1. Push 1 → `(1, max 1)`, push 7 → `(7, max 7)`, push 4 → `(4, max 7)`.
2. `getMax()` → 7.
3. Pop 4 → still 7; pop 7 → top is `(1, max 1)`, so max is 1.

> [!NOTE]
> **Quick check:** What changes for `popMax()`? *The max may be buried; you pop elements into a buffer until you hit it, then push the buffer back.*


### Max stack - complete guide

#### What is it

Similar to Min Stack but also supports:

- popMax() - Remove and return the maximum element

This is HARDER than Min Stack because:

- popMax() might remove element from MIDDLE of stack
- Need to maintain consistency

**Approach:** Use TreeMap + Doubly Linked List

- Doubly Linked List: Maintains stack order
- TreeMap: Maps values to their nodes for O(log n) max finding


```java
// MAX STACK - SIMPLE VERSION (O(n) popMax)
public class MaxStackSimple {
    private Stack<Integer> stack;
    private Stack<Integer> maxStack;

    public MaxStackSimple() {
        stack = new Stack<>();
        maxStack = new Stack<>();
    }

    public void push(int x) {
        stack.push(x);
        if (maxStack.isEmpty()) {
            maxStack.push(x);
        } else {
            maxStack.push(Math.max(x, maxStack.peek()));
        }
    }

    public int pop() {
        maxStack.pop();
        return stack.pop();
    }

    public int top() {
        return stack.peek();
    }

    public int peekMax() {
        return maxStack.peek();
    }

    // O(n) - Need to rebuild stack
    public int popMax() {
        int max = maxStack.peek();
        Stack<Integer> temp = new Stack<>();

        // Pop until we find max
        while (stack.peek() != max) {
            temp.push(pop());
        }

        // Pop the max
        pop();

        // Push back
        while (!temp.isEmpty()) {
            push(temp.pop());
        }

        return max;
    }
}
```

---

🔬 **Section Challenge — 2.2 Max Stack**

**Challenge 1 (Reasoning):** Min Stack uses a simple auxiliary stack to track minimums. Why can't Max Stack use the same approach to support `popMax()` in O(1)? What fundamental property does `popMax()` violate?

<details><summary>Answer</summary>

`popMax()` removes an element from the MIDDLE of the stack — not the top. This violates LIFO ordering. With Min Stack, `getMin()` only reads the auxiliary stack top (O(1)), and `pop()` always removes from the top of both stacks (maintaining consistency). But `popMax()` must find and remove the maximum wherever it sits. The simple two-stack approach requires: (1) pop everything above the max into a temp stack, (2) pop the max, (3) push everything back — O(n) per `popMax()`. The O(log n) solution uses a TreeMap (sorted by value) + Doubly Linked List (maintaining stack order) + lazy deletion with unique IDs to avoid the rebuild cost.

</details>

---

[Chapter overview](../02b_DS_Variants_Advanced.md) | [Queue Variants →](02_queue_variants.md)
