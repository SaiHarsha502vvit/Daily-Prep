# 📚 SECTION 7: STACK & QUEUE PROBLEMS

> **Navigation**: [Chapter overview](../08_Stack_Queue.md) | [7.1 Basic Stack Problems →](02_basic_stack_problems.md)
> Page 1 of 6 in **Stack Queue**


### Stack & Queue Patterns

| | Stack (LIFO) | Queue (FIFO) |
| --- | --- | --- |
| **Picture** | Elements `1, 2, 3` pushed in order: `3` is on top | Elements `1, 2, 3, 4` enqueued in order: `1` is at the front, `4` at the rear |
| **Operations** | `push` and `pop` at the **top** | `enqueue` at the **rear**, `dequeue` at the **front** |
| **Monotonic variant** | Monotonic stack: `[1, 3, 5]` (increasing) or `[5, 3, 1]` (decreasing) | Monotonic queue (deque, front ↔ rear): used for sliding-window max |


---

## PART 0: WHY Stack/Queue — The Two Most Interview-Tested Data Structures

**Stack & Queue Problems — Complete Understanding & Growth Mindset**

### WHY These Problems Matter

Stack/Queue appear in 20-25% of coding interviews and underpin MANY other  
patterns. If you can't instantly recognize "this needs a stack," every  
expression, matching, and monotonic problem will be out of reach.

**Real-world Stacks**:

- Browser back button: Each page pushed, back button pops
- Ctrl+Z / Undo: Every action pushed, undo pops
- Call stack: Function A calls B calls C → C returns first
- Syntax parsing: Compilers validate bracket matching with stacks
- Expression evaluation: Calculators process operators/operands via stack

**Real-world Queues**:

- Print queue: First document sent → first printed
- Web server requests: Process in arrival order
- BFS in social networks: "People you may know" (1 hop, 2 hop, 3 hop)
- Sliding window analytics: "Max CPU usage in last 5 minutes"

### The TWO Mental Models

STACK = "What's the LAST thing that matters?"

The most RECENT unmatched / unprocessed element is the one I need.

Parentheses:  Last OPEN bracket must match the next CLOSE bracket  
Monotonic:    Last element that hasn't found its Next Greater yet  
Calculator:   Last pending operator/operand in the expression  
Min Stack:    Last minimum still relevant (nothing smaller was added)

QUEUE = "What's the OLDEST thing that matters?"

Process elements in the ORDER they arrived.

BFS:          Visit level 1, then level 2, then level 3...  
Sliding win:  Track elements in window, evict the OLDEST first  
Task sched:   First task submitted → first task executed

```text
DECISION FLOWCHART

"Match brackets/tags?"              → Stack (push open, pop close)
"Next greater/smaller element?"     → Monotonic Stack
"Evaluate arithmetic expression?"   → Two Stacks (nums + ops)
"Sliding window max/min?"           → Monotonic Deque
"BFS / level-by-level?"             → Queue
"Most recently used / undo?"        → Stack
"Design a queue/stack using other?" → Tricky (2 stacks/queues)
```

### Java Code Templates

**Template 1: BRACKET MATCHING (covers 5+ problems)**

```java
Deque<Character> stack = new ArrayDeque<>();
for (char c : s.toCharArray()) {
    if (isOpening(c)) {
        stack.push(expectedClose(c));
    } else {
        if (stack.isEmpty() || stack.pop() != c) return false;
    }
}
return stack.isEmpty();
```

**Template 2: MONOTONIC STACK (Next Greater Element)**

```java
int[] nge = new int[n];
Arrays.fill(nge, -1);
Deque<Integer> stack = new ArrayDeque<>();  // stores INDICES
for (int i = 0; i < n; i++) {
    while (!stack.isEmpty() && nums[stack.peek()] < nums[i]) {
        nge[stack.pop()] = nums[i];   // i is the answer for popped
    }
    stack.push(i);
}
```

**Template 3: MONOTONIC DEQUE (Sliding Window Max)**

```java
Deque<Integer> deque = new ArrayDeque<>();  // stores INDICES
for (int i = 0; i < n; i++) {
    // Remove elements outside window
    while (!deque.isEmpty() && deque.peekFirst() < i - k + 1)
        deque.pollFirst();
    // Maintain decreasing order
    while (!deque.isEmpty() && nums[deque.peekLast()] <= nums[i])
        deque.pollLast();
    deque.offerLast(i);
    if (i >= k - 1) result[i-k+1] = nums[deque.peekFirst()];
}
```

### 5 Problem Families at a Glance

| Family | Core Problems | Structure | Difficulty |
| --- | --- | --- | --- |
| 1. Matching | Valid Paren, Decode Str | Stack | Easy-Med |
| 2. Expression | Calculator I/II/III | 2 Stacks | Medium-Hard |
| 3. Next Greater | NGE I/II, Daily Temps | Mono Stack | Medium |
| 4. Sliding Window | Window Max, Jump Game | Mono Deque | Hard |
| 5. Design | MinStack, Queue w/Stack | Stack+extra | Easy-Med |

Master families 1 and 3 first — they cover 70% of stack interview Qs.

### Complexity Quick Reference

| Operation | Time | Space | Why |
| --- | --- | --- | --- |
| Valid Parentheses | O(n) | O(n) | 1 pass, stack |
| Min Stack (all ops) | O(1) | O(n) | 2 stacks |
| Next Greater Element | O(n) | O(n) | Each elem push/pop |
| Sliding Window Max | O(n) | O(k) | Deque stores ≤k |
| Calculator III | O(n) | O(n) | 2 stacks |
| Largest Rectangle | O(n) | O(n) | Mono stack |

KEY: Almost EVERY stack/queue problem is O(n) time.  
The trick is recognizing the PATTERN, not optimizing Big-O.

### ⚠️  Common Mistakes in Stack/queue Problems

**Mistake 1: Using java.util.Stack instead of ArrayDeque**

Stack<Integer> is legacy (synchronized, slow). Use Deque<Integer>.  
Methods: push(), pop(), peek() work on both. ArrayDeque is usually faster (no synchronisation).

**Mistake 2: Forgetting to check isEmpty() before pop/peek**

EVERY pop() and peek() needs a stack.isEmpty() guard.  
Missing this → EmptyStackException in edge cases.

**Mistake 3: Storing VALUES instead of INDICES in monotonic stack**

For NGE/Largest Rectangle: store INDICES, access values via nums[idx].  
You need the INDEX for distance calculations and result placement.

**Mistake 4: Wrong comparison for Monotonic (< vs <=)**

"Next GREATER": use < in while condition (pop when strictly less)  
"Next GREATER OR EQUAL": use <= (pop when less or equal)  
Getting this wrong → subtle bugs, some test cases pass, others fail.

**Mistake 5: Not handling empty stack at the end of monotonic pass**

Elements remaining in stack have NO Next Greater Element → default to -1  
Pre-fill result array with -1 to handle this automatically.

**Mistake 6: Circular array — forgetting to iterate 2×n**

For circular NGE: loop from 0 to 2*n-1, use index % n.  
Only process indices < n, but compare with wrapped elements.

### ⭐ Expected Outputs of Mastering Stack/queue ⭐

- ✅ See "matching" → instantly write stack push-open/pop-close pattern
- ✅ See "next greater" → monotonic stack template in 2 minutes
- ✅ See "sliding window max" → monotonic deque with index eviction
- ✅ See "evaluate expression" → two-stack approach (nums + operators)
- ✅ Always use ArrayDeque, NEVER java.util.Stack
- ✅ Always store INDICES (not values) in monotonic problems

**The Transformation**:

FROM: "I don't know when to use a stack vs queue"  
TO: "Last relevant thing? Stack. Order of arrival? Queue.  
Matching brackets, evaluating expressions, next greater — all  
stacks. BFS, sliding window analytics — all queues."

📖 **Related theory:** [03_Algorithms/15_Monotonic_Stack_Queue_Complete.md](../../03_Algorithms/15_Monotonic_Stack_Queue_Complete.md) — Full monotonic stack/queue theory

---

[Chapter overview](../08_Stack_Queue.md) | [7.1 Basic Stack Problems →](02_basic_stack_problems.md)
