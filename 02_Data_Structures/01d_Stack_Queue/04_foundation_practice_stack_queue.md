# 🏋️ Foundation Practice — Stack & Queue

> **Navigation**: [← Production Failure Modes](03_production_failure_modes.md) | [Chapter overview](../01d_Stack_Queue.md) | [Proof Corner — Three Derivations from First… →](05_proof_corner_three_derivations_from_first.md)
> Page 4 of 5 in **Stacks & Queues**


## Stack Quick Questions

**Q1 — Balanced Parentheses** _(classic Stack application)_

```java
public boolean isBalanced(String s) {
    Deque<Character> stack = new ArrayDeque<>();
    for (char c : s.toCharArray()) {
        if (c == '(' || c == '{' || c == '[') stack.push(c);
        else {
            if (stack.isEmpty()) return false;
            char top = stack.pop();
            if (c == ')' && top != '(') return false;
            if (c == '}' && top != '{') return false;
            if (c == ']' && top != '[') return false;
        }
    }
    return stack.isEmpty();
}
// Time: O(n) | Space: O(n)  | LC 20 — Valid Parentheses
```

**Q2 — Min Stack** _(Stack with O(1) getMin)_

```java
class MinStack {
    Deque<Integer> stack = new ArrayDeque<>();
    Deque<Integer> minStack = new ArrayDeque<>();  // parallel min tracker

    public void push(int val) {
        stack.push(val);
        minStack.push(minStack.isEmpty() ? val : Math.min(minStack.peek(), val));
    }
    public void pop() { stack.pop(); minStack.pop(); }
    public int top() { return stack.peek(); }
    public int getMin() { return minStack.peek(); }
}
// Key: minStack always holds min so far → O(1) getMin | LC 155
```

## 🚀 GO LEARN — Monotonic Stack (You'll Need This)

**STOP** — For "next greater element" pattern, you need Monotonic Stack.

📖 [11_Stack_Plus_MonotonicPattern.md](../../04_Patterns_Templates/11_Stack_Plus_MonotonicPattern.md)
📖 [15_Monotonic_Stack_Queue_Complete.md](../../03_Algorithms/15_Monotonic_Stack_Queue_Complete.md)

⬅️ **RETURN CHECKPOINT** — Apply below after studying.

## ✅ Apply: Next Greater Element — Monotonic Stack O(n)

```
Brute: For each element, scan right → O(n²)
Optimal: Monotonic decreasing stack → O(n)

IDEA: Maintain stack in decreasing order.
When we find a bigger element, it's the "next greater" for everything smaller in stack.
```

```java
public int[] nextGreaterElement(int[] arr) {
    int n = arr.length;
    int[] result = new int[n];
    Arrays.fill(result, -1);
    Deque<Integer> stack = new ArrayDeque<>();   // stores indices

    for (int i = 0; i < n; i++) {
        while (!stack.isEmpty() && arr[stack.peek()] < arr[i])
            result[stack.pop()] = arr[i];        // arr[i] is next greater
        stack.push(i);
    }
    return result;
}
// LC 496 — Next Greater Element I | LC 739 — Daily Temperatures
```

## Queue Quick Questions

**Q1 — BFS Template** _(Queue's most important use)_

```java
// Standard BFS — O(V + E) for graphs, O(n) for arrays
Queue<Integer> queue = new LinkedList<>();
boolean[] visited = new boolean[n];
queue.offer(start);
visited[start] = true;

while (!queue.isEmpty()) {
    int node = queue.poll();
    // process node
    for (int neighbor : getNeighbors(node))
        if (!visited[neighbor]) {
            visited[neighbor] = true;
            queue.offer(neighbor);
        }
}
```

**Q2 — Sliding Window Maximum — Deque O(n)**

```
Brute: Max of each window → O(n*k)
Optimal: Monotonic Deque → O(n) — maintains max at front
```

```java
public int[] maxSlidingWindow(int[] arr, int k) {
    int n = arr.length;
    int[] result = new int[n - k + 1];
    Deque<Integer> deque = new ArrayDeque<>();  // stores indices, front = max

    for (int i = 0; i < n; i++) {
        if (!deque.isEmpty() && deque.peekFirst() <= i - k) deque.pollFirst(); // out of window
        while (!deque.isEmpty() && arr[deque.peekLast()] <= arr[i]) deque.pollLast(); // smaller useless
        deque.offerLast(i);
        if (i >= k - 1) result[i - k + 1] = arr[deque.peekFirst()];
    }
    return result;
}
// LC 239 — Sliding Window Maximum
```

---

## 🎯 Full Problem Set — Stack & Queue

| #   | Problem                                | Platform   | Difficulty  | Pattern          |
| --- | -------------------------------------- | ---------- | ----------- | ---------------- |
| 1   | LC 20 — Valid Parentheses              | LeetCode   | ⭐ Easy     | Stack matching   |
| 2   | LC 155 — Min Stack                     | LeetCode   | ⭐⭐ Med    | Two stacks       |
| 3   | LC 496 — Next Greater Element I        | LeetCode   | ⭐ Easy     | Monotonic stack  |
| 4   | LC 739 — Daily Temperatures            | LeetCode   | ⭐⭐ Med    | Monotonic stack  |
| 5   | LC 84 — Largest Rectangle in Histogram | LeetCode   | ⭐⭐⭐ Hard | Monotonic stack  |
| 6   | LC 239 — Sliding Window Maximum        | LeetCode   | ⭐⭐⭐ Hard | Monotonic deque  |
| 7   | LC 232 — Implement Queue using Stacks  | LeetCode   | ⭐ Easy     | Two stacks       |
| 8   | LC 102 — Binary Tree Level Order       | LeetCode   | ⭐⭐ Med    | BFS Queue        |
| 9   | CF 82A — Double Cola                   | Codeforces | Div2-A      | Queue simulation |

---

### Additional Stack & Queue Challenges

**Challenge 3 (Tracing):** Trace the call stack of `factorial(5)` — how many stack frames are pushed in total? What is the maximum depth of the stack at any point during execution? If the base case is `factorial(0) = 1`, how many frames exist on the stack at that moment?

<details><summary>Answer</summary>

`factorial(5)` pushes 6 frames total: `factorial(5)`, `factorial(4)`, `factorial(3)`, `factorial(2)`, `factorial(1)`, `factorial(0)`. The maximum depth is 6 (all frames on the stack simultaneously, before any `return` unwinds the stack). Each `factorial(n)` calls `factorial(n-1)` — the call goes deeper before unwinding. This is why the JVM stack grows linearly with recursion depth.

For comparison, `fibonacci(5)` also has max depth 6, but makes **exponentially more calls** — `fibonacci(40)` has depth ~40 but makes 331,160,281 calls! This is the key difference between depth and total work.

</details>

**Challenge 4 (Design & API):** Why does the JDK use a `Deque` for `ArrayDeque` but deprecate the `Stack` class entirely? (Hint: think about inheritance vs composition. What class does `Stack` extend, and why is that inheritance relationship a problem?)

<details><summary>Answer</summary>

`java.util.Stack` extends `java.util.Vector`. This is problematic because: (1) `Vector` is synchronized (every operation is thread-safe but slow), wasting performance for single-threaded use; (2) `Vector` allows random access via `elementAt(i)` and indexed insert/remove, which violate the Stack contract — a proper stack should only allow top access. The JDK recommends using `ArrayDeque` instead: resizable array, no sync overhead, double-ended so works as both Stack and Queue. The `Deque` interface even provides `push()`/`pop()`/`peek()` — the stack operations, without the baggage of vector inheritance. This is a classic example of the **Liskov Substitution Principle**: `Stack` cannot substitute for `Vector` cleanly (it shouldn't allow arbitrary index access), so inheritance was the wrong relationship.

</details>

## 🧠 Pattern Fingerprint — Stack & Queue

**See these words → use this technique:**

| If the problem says... | Use |
| ---------------------- | --- |
| "matching brackets / nesting" | Stack (LIFO natural) |
| "next greater / smaller element" | Monotonic Stack O(n) |
| "largest rectangle in histogram" | Monotonic Stack |
| "BFS / level-by-level traversal" | Queue |
| "sliding window maximum" | Monotonic Deque O(n) |
| "undo / redo" | Two Stacks |
| "evaluate expression" | Two Stacks (ops+vals) |

### 🚀 GO LEARN — When You Need More

| Topic                         | File                                                                                               |
| ----------------------------- | -------------------------------------------------------------------------------------------------- |
| Stack patterns deep dive      | 📖 [11_Stack_Plus_MonotonicPattern.md](../../04_Patterns_Templates/11_Stack_Plus_MonotonicPattern.md) |
| Practice problems Stack/Queue | 📖 [08_Stack_Queue.md](../../05_Problem_Solving/08_Stack_Queue.md)                                    |
| Monotonic complete guide      | 📖 [15_Monotonic_Stack_Queue_Complete.md](../../03_Algorithms/15_Monotonic_Stack_Queue_Complete.md)   |

### 📅 Revisit Tracker

- **Day 3:** Redo LC 20 (Balanced) + LC 496 (Next Greater) from memory
- **Day 7:** Redo LC 739 (Daily Temperatures) — explain the monotonic stack logic

---

---

## ✅ You Know Stack & Queue — Now Practice! (JIT Study Path)

**Step 1 — Basic Problems (Warm Up):**

| Problem                      | LC #   | Pattern         | Key Concept                               |
| ---------------------------- | ------ | --------------- | ----------------------------------------- |
| Valid Parentheses            | LC 20  | Stack matching  | Push open, pop & match close              |
| Min Stack                    | LC 155 | Auxiliary stack | Keep a parallel min-so-far stack          |
| Implement Queue using Stacks | LC 232 | Two stacks      | Input stack → output stack (lazy reverse) |
| Daily Temperatures           | LC 739 | Monotonic Stack | Decreasing stack, pop when warmer found   |
| Next Greater Element I       | LC 496 | Monotonic Stack | Stack + HashMap for O(n) answer           |

**Step 2 — Hit a wall? Learn these patterns:**

- Nearest greater/smaller → **[Monotonic Stack Guide](../../04_Patterns_Templates/11_Stack_Plus_MonotonicPattern.md)**
- BFS level-by-level → **[Graph Fundamentals](../../03_Algorithms/05c_Graphs_Fundamentals.md)**

**Step 3 — Apply patterns on harder problems:**
👉 **[Go to Stack/Queue Problem Solving File →](../../05_Problem_Solving/08_Stack_Queue.md)**

**Step 4 — Competitive Practice:**

| CF Problem                                                                                | Topic            | Difficulty  |
| ----------------------------------------------------------------------------------------- | ---------------- | ----------- |
| [CF 5C — Longest Regular Bracket Sequence](https://codeforces.com/problemset/problem/5/C) | Stack (brackets) | ⭐⭐ Medium |
| [CF 797C — Minimal String](https://codeforces.com/problemset/problem/797/C)               | Greedy + Stack   | ⭐⭐ Medium |
| [CF 1830C — Hyperflation](https://codeforces.com/problemset/problem/1830/C)               | Monotonic Stack  | ⭐⭐ Medium |

🌍 **Real-World Connections:**

- **Undo/Redo** in every editor (VS Code, Word) = two stacks: undo stack + redo stack
- **Browser history** = back button = stack of visited pages
- **Call stack in JVM/V8** = stack frame pushed per function call, popped on return
- **Message queues** (Kafka, RabbitMQ) = distributed queues at massive scale
- **CPU instruction pipeline** = queue of instructions to execute

---

## 🎓 University-Level Addendum — Stack & Queue as Formal Theory

> **Purpose:** This addendum elevates the chapter to MIT/KTH/ETH rigor. The audit identified invariants as the critical gap. Stacks and queues have the simplest data-structure invariants in computer science — yet they are the *most violated* in practice because developers assume "it's just push/pop." The content below formalizes LIFO/FIFO invariants, the constraint-first decision framework, the canonical "when breaks" scenarios (especially bounded vs unbounded), and the recursion-to-iterative conversion pitfalls.

### Stack and Queue Invariants

#### Stack Invariants

A stack's correctness rests on three invariants that **must hold after every operation**:

| Invariant | Statement | Violation Consequence |
|---|---|---|
| **S1 — LIFO order** | The element returned by `pop()` is the most recently `push()`-ed element that has not yet been popped | Wrong return value; inverting expected order |
| **S2 — Top terminator** | For an array-backed stack: `top == -1` (empty) or `top < capacity` (non-empty) | Out-of-bounds read/write; potential segfault |
| **S3 — Size consistency** | `size == top + 1` (after pushes/pops that don't grow) | Iteration terminates at wrong index; iterator returns stale elements |

These invariants must be **re-established** after every push, pop, and growth operation. The Java `Stack` class (legacy) and `ArrayDeque` (modern) preserve them via careful index arithmetic.

#### Queue Invariants

A queue is harder than a stack because it has *two* ends:

| Invariant | Statement | Violation Consequence |
|---|---|---|
| **Q1 — FIFO order** | The element returned by `dequeue()` is the element that has been `enqueue()`-ed for the longest time | Wrong return value; inverting expected order |
| **Q2 — Head/tail within bounds** | `0 ≤ head < capacity && 0 ≤ tail < capacity` (linear) or `head == tail` (empty/full in circular) | Out-of-bounds; lost elements |
| **Q3 — Size consistency** | `size == (tail - head) mod capacity` (circular) or `size == tail - head` (linear) | Iteration skips/duplicates elements |
| **Q4 — Empty/full distinction (circular)** | Use a `size` field; never compare `head == tail` to detect both | Either infinite growth (no full detection) or refusal to enqueue when not full |

The circular buffer (ring buffer) is the canonical implementation; Q4 is the invariant most often violated because developers try to use `head == tail` for both empty and full detection.

---

[← Production Failure Modes](03_production_failure_modes.md) | [Chapter overview](../01d_Stack_Queue.md) | [Proof Corner — Three Derivations from First… →](05_proof_corner_three_derivations_from_first.md)
