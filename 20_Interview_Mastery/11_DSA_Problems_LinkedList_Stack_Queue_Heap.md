**Navigation**: [⬅ Arrays, Strings, Hashing](10_DSA_Problems_Arrays_Strings_Hashing.md) | [📚 Index](00_INDEX.md) | [Next: Trees, Graphs, Trie, Union-Find ➡](12_DSA_Problems_Trees_Graphs_Trie_UnionFind.md)

# File 11 — DSA Problems: LinkedList, Stack, Queue & Heap

## Logic-First, Code-Second: The 5W+H Way

Every problem: WHAT is it asking → WHY does this approach work → WHEN to recognize it → HOW to think → HOW to translate to code.

---

## LINKED LIST

---

### Problem 1: Reverse a Linked List

**WHAT**: Reverse the direction of all pointers in a singly linked list.

**WHY iterative pointer manipulation works**:

- Each node points forward. We need it to point backward.
- At each node, we need to remember three things: previous, current, next.
- Before we change current's pointer, save next. Then point current to previous. Then advance.

**WHEN**: "Reverse", "flip", "backward traversal on singly linked list" → Three-pointer reversal.

**WHERE**: Every company. Fundamental building block.

**HOW — The Logic Chain**:

```
Step 1: prev = null, curr = head
Step 2: While curr ≠ null:
        → nextTemp = curr.next    (save what comes after)
        → curr.next = prev        (reverse the pointer)
        → prev = curr             (advance prev)
        → curr = nextTemp          (advance curr)
Step 3: Return prev (new head)
```

**Why 3 variables**: You need `nextTemp` because once you do `curr.next = prev`, you lose access to the next node. It's like cutting a chain — you must hold the broken end first.

**Recursive version logic**: "Reverse the rest, then point my next node back to me."

```
Base: if head is null or head.next is null → return head
Recursive: newHead = reverse(head.next)
           head.next.next = head    (the node after me should point to me)
           head.next = null          (I point to nothing now / I'm the new tail)
           return newHead
```

**Follow-up — Reverse in groups of k**: Same idea, but count k nodes first, reverse them, connect the previous group's tail to this group's new head. Recursive or iterative.

---

### Problem 2: Linked List Cycle Detection

**WHAT**: Determine if a linked list has a cycle.

**WHY Floyd's Tortoise & Hare works**:

- Fast pointer moves 2 steps, slow moves 1 step
- If there's a cycle, fast WILL eventually meet slow (like two runners on a track, the faster one laps the slower)
- If there's no cycle, fast reaches null

**WHEN**: "Cycle in linked list/graph" → Two pointers at different speeds.

**HOW — The Logic Chain**:

```
Step 1: slow = head, fast = head
Step 2: While fast ≠ null AND fast.next ≠ null:
        → slow = slow.next
        → fast = fast.next.next
        → If slow == fast → cycle exists
Step 3: If loop ends → no cycle
```

**Why they MUST meet**: In the cycle, the distance between slow and fast decreases by 1 each step. So they meet in at most `cycleLength` steps after both enter the cycle.

**Finding the cycle START (Follow-up)**:

```
After fast and slow meet:
→ Move slow back to head
→ Move both one step at a time
→ Where they meet = cycle start
```

**Why this finds the start**: If `a` = distance from head to cycle start, and `b` = distance from cycle start to meeting point, then at meeting point: slow traveled `a + b`, fast traveled `a + b + n·c` where c = cycle length. Since fast = 2·slow: `a + b + n·c = 2(a + b)` → `a = n·c - b`. So moving `a` steps from meeting point wraps around to cycle start.

---

### Problem 3: Merge Two Sorted Lists

**WHAT**: Merge two sorted linked lists into one sorted list.

**WHY compare-and-advance works**:

- Both lists are sorted. At each step, the smaller head is the next element.
- Take the smaller, advance that pointer, continue.

**HOW — The Logic Chain**:

```
Step 1: Create dummy head (simplifies edge cases)
Step 2: While both lists non-empty:
        → If l1.val ≤ l2.val → append l1, advance l1
        → Else → append l2, advance l2
Step 3: Append remaining non-empty list
Step 4: Return dummy.next
```

**Why use a dummy node**: Without it, you need special handling for the first element. Dummy simplifies — just return `dummy.next` at the end.

**Extension — Merge K Sorted Lists**:

- **Approach 1**: Min-Heap with k nodes. Pop minimum, push its next. O(n log k).
- **Approach 2**: Divide and conquer — merge pairs like merge sort. O(n log k).
- **Approach 3**: Merge one by one — O(nk). Too slow.

**Interview narration**: "I use a min-heap of size k holding the current head of each list. Pop the smallest, attach to result, push its next node. This gives O(n log k) where n is total elements."

---

### Problem 4: Remove Nth Node From End

**WHAT**: Remove the nth node from the end in one pass.

**WHY the gap technique works**:

- If fast is n steps ahead of slow, when fast reaches the end, slow is at the nth-from-end
- We actually need slow to be ONE BEFORE the target (to rewire), so use a dummy head

**HOW — The Logic Chain**:

```
Step 1: Create dummy → head
Step 2: Advance fast pointer n+1 steps from dummy
        (so the gap between slow and fast is exactly n+1)
Step 3: Move both until fast reaches null
Step 4: slow.next = slow.next.next (skip the target node)
Step 5: Return dummy.next
```

**Why n+1**: We want slow to point to the node BEFORE the one to remove. The dummy gives us an extra node so we can handle removing the head itself.

---

### Problem 5: Reorder List

**WHAT**: Reorder L0→L1→...→Ln to L0→Ln→L1→Ln-1→...

**WHY this decomposes into 3 sub-problems**:

1. Find the middle (fast/slow pointers)
2. Reverse the second half
3. Merge alternating from first and reversed second half

**HOW — The Logic Chain**:

```
Step 1: Find middle using slow/fast pointers
        → slow ends at middle. Cut the list: slow.next = null
Step 2: Reverse the second half (standard reversal)
Step 3: Merge by alternating:
        → Take from first, then from second, repeat
```

**Interview insight**: This tests whether you can DECOMPOSE a complex problem into known subproblems. Each piece (find middle, reverse, merge) is a standard technique.

---

### Problem 6: LRU Cache

**WHAT**: Design a data structure with O(1) get and put, evicting least recently used item.

**WHY HashMap + Doubly Linked List**:

- HashMap gives O(1) access by key
- Doubly linked list maintains usage ORDER (most recent at head, least recent at tail)
- On access: move node to head (O(1) in doubly linked list)
- On eviction: remove from tail (O(1))

**WHEN**: "Fixed capacity + eviction policy + O(1) operations" → LinkedHashMap or manual DLL + Map.

**HOW — The Logic Chain**:

```
GET(key):
  → Not in map → return -1
  → In map → move node to head (mark as recently used), return value

PUT(key, value):
  → Already in map → update value, move to head
  → Not in map:
    → Create node, add to head, add to map
    → If over capacity → remove tail node, remove from map
```

**Why doubly linked list (not singly)**:

- To remove a node from the middle, we need to access its PREVIOUS node
- Singly linked list → O(n) to find previous. Doubly linked list → O(1) via prev pointer.

**Translation hint**: Use sentinel head and tail nodes to avoid null checks.

---

## STACK

---

### Problem 7: Valid Parentheses

**WHAT**: Check if bracket sequence is valid: `()[]{}`.

**WHY stack is the natural choice**:

- Opening brackets wait for their closing match
- Most recent opening bracket must be closed FIRST → LIFO → Stack
- Push opening brackets, pop on closing brackets, check match

**WHEN**: "Matching pairs", "nesting", "most recent first" → Stack.

**HOW — The Logic Chain**:

```
Step 1: For each character:
        → Opening bracket → push
        → Closing bracket:
          → If stack empty → invalid
          → If top doesn't match → invalid
          → Else pop
Step 2: After all characters: stack must be empty
```

**Common mistakes**: Forgetting to check if stack is empty at the end. `"((("` should be invalid.

**Trick**: Push the EXPECTED closing bracket instead. When you see `(`, push `)`. Then on closing bracket, just check if it equals `stack.pop()`.

---

### Problem 8: Min Stack

**WHAT**: Stack supporting O(1) push, pop, top, AND getMin.

**WHY auxiliary stack works**:

- Main stack handles normal operations
- A second "min stack" tracks the minimum at each level
- Push: also push `min(val, currentMin)` onto min stack
- Pop: also pop from min stack
- getMin: peek min stack

**HOW — The Logic Chain**:

```
push(val):
  → mainStack.push(val)
  → minStack.push(min(val, minStack.peek()))

pop():
  → mainStack.pop()
  → minStack.pop()

getMin():
  → return minStack.peek()
```

**Space optimization**: Only push to min stack when val ≤ current min. Pop from min stack only when popped value equals min stack top. Saves space when min rarely changes.

**Alternative** — Single stack with encoded values: push `2*val - oldMin` when val < min, decode on pop. Clever but hard to explain in interviews.

---

### Problem 9: Daily Temperatures

**WHAT**: For each day, how many days until a warmer temperature?

**WHY monotonic stack works**:

- We need "next greater element" → classic monotonic stack pattern
- Maintain a stack of INDICES where we haven't found any warmer day yet
- When current temp > stack top's temp → we found the answer for stack top

**WHEN**: "Next greater/smaller element" → Monotonic stack.

**HOW — The Logic Chain**:

```
Step 1: Stack holds indices of days waiting for a warmer day
Step 2: For each day i:
        → While stack not empty AND temp[i] > temp[stack.peek()]:
          → j = stack.pop()
          → answer[j] = i - j
        → Push i onto stack
Step 3: Remaining indices in stack get answer 0 (no warmer day)
```

**Why store indices not temperatures**: We need the DISTANCE (i - j), which requires knowing positions.

**Monotonic Stack principle**: The stack maintains a monotonically DECREASING sequence of temperatures. When a warmer day comes, it "resolves" all the cooler days waiting on the stack.

---

### Problem 10: Evaluate Reverse Polish Notation

**WHAT**: Evaluate a postfix expression like `["2","1","+","3","*"]` = 9.

**WHY stack naturally handles postfix**:

- Numbers are pushed. Operators pop two operands, compute, push result.
- This is WHY stack-based languages (Forth) and calculators work this way.

**HOW — The Logic Chain**:

```
For each token:
  → If number → push
  → If operator → pop b, pop a, push (a op b)
    (Note: a is the SECOND popped — order matters for - and /)
Return stack.pop() as final answer
```

**Trap**: Division truncates toward zero in this problem. In Java, integer division naturally truncates toward zero.

---

### Problem 11: Largest Rectangle in Histogram

**WHAT**: Find the area of the largest rectangle that fits under the histogram bars.

**WHY monotonic stack works here**:

- For each bar, we need to know: how far LEFT and how far RIGHT it can extend
- A bar can extend until it meets a SHORTER bar
- Monotonic increasing stack: when a shorter bar arrives, all taller bars on the stack get their right boundary

**WHEN**: "Largest rectangle", "max area under constraints" → Monotonic stack.

**HOW — The Logic Chain**:

```
Step 1: Stack holds indices in increasing height order
Step 2: For each bar i:
        → While stack not empty AND height[i] < height[stack.peek()]:
          → h = height[stack.pop()]  (this bar's height)
          → width = stack.empty() ? i : (i - stack.peek() - 1)
          → maxArea = max(maxArea, h * width)
        → Push i
Step 3: Process remaining bars in stack (right boundary = n)
```

**Width calculation logic**: When we pop bar j at position stack.peek()+1 to i-1:

- Left boundary = stack.peek() + 1 (or 0 if stack empty)
- Right boundary = i - 1
- Width = i - stack.peek() - 1

**Extension — Maximal Rectangle in Binary Matrix**: For each row, build a histogram of heights. Apply this algorithm to each row's histogram. O(rows × cols).

---

🔬 **Section Challenge — STACK**

**Challenge 1 (Reasoning):** Monotonic DECREASING stack — when you push a new element, which existing elements are popped and what information do those pops tell you?

<details><summary>Answer</summary>

In a decreasing stack (top is smallest), pushing element `x`: all elements smaller than `x` are popped. For each popped element `y`: `x` is the NEXT GREATER ELEMENT of `y`. This is the key insight: the pop event = answer event. Application: Daily Temperatures (next warmer day), Largest Rectangle in Histogram (right boundary), Next Greater Element. Each element is pushed and popped exactly once → O(N) total.

</details>

## QUEUE

---

### Problem 12: Implement Queue Using Stacks

**WHAT**: Build FIFO queue using only LIFO stacks.

**WHY two stacks simulate a queue**:

- Stack reverses order. Two reversals = original order
- Push stack: where new elements go
- Pop stack: where elements come out (reversed order = FIFO)
- When pop stack empty, pour push stack into pop stack

**HOW — The Logic Chain**:

```
push(x): pushStack.push(x)

pop():
  → If popStack empty → pour all from pushStack to popStack
  → Return popStack.pop()
```

**Amortized O(1)**: Each element is pushed and popped from each stack exactly once. 2 push + 2 pop operations per element total → O(1) amortized per operation.

---

### Problem 13: Sliding Window Maximum

**WHAT**: For each window of size k, find the maximum element.

**WHY monotonic deque works**:

- We need the max for each window position → brute force is O(nk)
- Deque (double-ended queue) maintains indices of useful elements in DECREASING order
- When new element is larger than deque's back → remove back (it's useless now)
- When window slides → remove front if it's outside the window

**WHEN**: "Maximum/minimum in sliding window" → Monotonic deque.

**HOW — The Logic Chain**:

```
Step 1: Deque holds indices in decreasing value order
Step 2: For each element i:
        → Remove from BACK while deque not empty AND nums[i] ≥ nums[deque.peekLast()]
        → Add i to BACK
        → Remove from FRONT if deque.peekFirst() < i - k + 1 (outside window)
        → If i ≥ k-1: deque.peekFirst() is the maximum for this window
```

**Why from the back**: A smaller older element will NEVER be the max while a larger newer element exists. It's dominated.

**Why from the front**: If the front index is outside the window, it's expired.

---

## HEAP / PRIORITY QUEUE

---

### Problem 14: Kth Largest Element in Array

**WHAT**: Find the kth largest element.

**WHY min-heap of size k**:

- Maintain a min-heap with exactly k elements
- The root is always the kth largest among elements seen so far
- For each new element: if larger than root, replace root

**WHEN**: "Kth largest/smallest" → Min-heap of size k or QuickSelect.

**HOW — The Logic Chain**:

```
Heap approach:
  Step 1: Add first k elements to min-heap
  Step 2: For each remaining element:
          → If element > heap.peek() → poll, offer element
  Step 3: Return heap.peek()

QuickSelect approach (O(n) average):
  Step 1: Pick pivot, partition array
  Step 2: If pivot position = n-k → found it
          If pivot position > n-k → recurse left
          If pivot position < n-k → recurse right
```

**Heap vs QuickSelect**:
| | Heap | QuickSelect |
|-|------|-------------|
| Time | O(n log k) | O(n) avg, O(n²) worst |
| Space | O(k) | O(1) in-place |
| When | Streaming data, guaranteed time | One-shot, average case OK |

---

### Problem 15: Find Median from Data Stream

**WHAT**: Design a structure that can add numbers and find median at any time.

**WHY two heaps split the data**:

- Max-heap holds the smaller half
- Min-heap holds the larger half
- Median = max-heap top (odd count) or average of both tops (even count)

**WHEN**: "Median" + "streaming/dynamic data" → Two heaps.

**HOW — The Logic Chain**:

```
addNum(num):
  → Always add to maxHeap first
  → Balance: move maxHeap.poll() to minHeap
  → Size rule: if minHeap.size > maxHeap.size → move minHeap.poll() to maxHeap

findMedian():
  → If maxHeap.size > minHeap.size → maxHeap.peek()
  → Else → (maxHeap.peek() + minHeap.peek()) / 2.0
```

**Why this balancing works**: Every new number goes through maxHeap → minHeap path, ensuring elements are correctly split. The size rule keeps heaps balanced (maxHeap can have at most 1 more element).

**Interview narration**: "I split numbers into two halves using two heaps. The max-heap holds the smaller half so its top is the median candidate. The min-heap holds the larger half. Balancing ensures they differ by at most one element."

---

### Problem 16: Task Scheduler

**WHAT**: Schedule tasks with cooldown period n. Minimize total time.

**WHY greedy with max-frequency works**:

- Most frequent task dictates the structure
- Arrange most frequent task with n gaps between: `A _ _ A _ _ A`
- Fill gaps with other tasks
- If tasks fill all gaps → answer = total tasks (no idle)
- If gaps remain → answer = (maxFreq - 1) × (n + 1) + countOfMaxFreqTasks

**WHEN**: "Schedule with cooldown/constraints" → Greedy by frequency.

**HOW — The Logic Chain**:

```
Step 1: Count frequencies of all tasks
Step 2: Find maxFreq and how many tasks have maxFreq (= maxCount)
Step 3: answer = max(tasks.length, (maxFreq - 1) * (n + 1) + maxCount)
```

**Why the formula**:

- `(maxFreq - 1)` intervals between max-frequency tasks
- Each interval has `(n + 1)` slots (task + n cooldown)
- `+ maxCount` for the last group of max-frequency tasks
- If enough other tasks, the idle slots get filled → total tasks wins

---

### Problem 17: Reorganize String

**WHAT**: Rearrange string so no two adjacent characters are the same.

**WHY max-heap + greedy works**:

- Always place the most frequent character that ISN'T the previously placed one
- If any character has frequency > (n+1)/2 → impossible

**HOW — The Logic Chain**:

```
Step 1: Count frequencies
Step 2: Check feasibility: if any freq > (n+1)/2 → return ""
Step 3: Max-heap ordered by frequency
Step 4: Loop:
        → Pop top (most frequent). Place it. Decrease count.
        → If prev character still has count > 0 → push prev back
        → Update prev = current
```

**The "hold back" trick**: After placing a character, don't push it back immediately. Hold it for one round so it can't be placed again next step. Push it back when we process the next character.

---

## MASTER PROBLEM MAP — LinkedList, Stack, Queue, Heap

| #   | Problem            | Core Logic                     | Pattern           | Key Insight                                    |
| --- | ------------------ | ------------------------------ | ----------------- | ---------------------------------------------- |
| 1   | Reverse LL         | 3 pointers: prev/curr/next     | Pointer Reversal  | Save next before redirecting                   |
| 2   | LL Cycle           | fast/slow meet in cycle        | Floyd's Algorithm | After meet, reset slow to head                 |
| 3   | Merge 2 Sorted     | compare heads, advance smaller | Merge Technique   | Dummy node avoids edge cases                   |
| 4   | Remove Nth End     | gap of n between pointers      | Two Pointers      | Dummy node handles head removal                |
| 5   | Reorder List       | find mid + reverse + merge     | Decomposition     | 3 known subproblems combined                   |
| 6   | LRU Cache          | map + doubly linked list       | Map + DLL         | O(1) remove needs prev pointer                 |
| 7   | Valid Parens       | push open, pop on close        | Stack Matching    | Stack must be empty at end                     |
| 8   | Min Stack          | auxiliary min tracking         | Two Stacks        | Push min alongside each value                  |
| 9   | Daily Temperatures | resolve when warmer found      | Monotonic Stack   | Stack stores indices, not values               |
| 10  | Eval RPN           | push nums, pop on operator     | Stack Evaluation  | Pop order: b first, then a                     |
| 11  | Histogram Rect     | extend until shorter bar       | Monotonic Stack   | Width = right_bound - left_bound - 1           |
| 12  | Queue w/ Stacks    | two reversals = original       | Two Stacks        | Amortized O(1) via lazy transfer               |
| 13  | Sliding Window Max | remove useless elements        | Monotonic Deque   | Remove from back (dominated) + front (expired) |
| 14  | Kth Largest        | min-heap of size k             | Heap Top-K        | Root = kth largest at all times                |
| 15  | Stream Median      | split into two halves          | Two Heaps         | Max-heap small half + min-heap large half      |
| 16  | Task Scheduler     | fill gaps around most frequent | Greedy + Freq     | Formula: (maxF-1)\*(n+1) + maxCount            |
| 17  | Reorganize String  | place most freq, skip prev     | Heap + Cooldown   | hold-back trick prevents adjacent same         |

---

## Interview Quick-Fire: LinkedList / Stack / Queue / Heap

**Q: "Why not use an array instead of linked list?"** → LinkedList has O(1) insert/delete at arbitrary positions (given node reference). Array has O(n) shift. But array has O(1) indexed access and better cache performance.

**Q: "When stack vs queue?"** → Stack = undo operations, DFS, bracket matching, expression eval. Queue = BFS, scheduling, order processing.

**Q: "When heap vs sorting?"** → Heap when you only need top-K (O(n log k) < O(n log n)). Heap when data is streaming. Sort when you need the entire sorted order.

**Q: "Max-heap or min-heap?"** → For kth LARGEST → min-heap of size k (root is the answer). For kth SMALLEST → max-heap of size k. Counter-intuitive but correct.

**Q: "Why doubly linked list for LRU and not singly?"** → Need O(1) removal from middle. Singly linked list requires traversal to find predecessor. Doubly linked list has prev pointer → O(1) unlink.
