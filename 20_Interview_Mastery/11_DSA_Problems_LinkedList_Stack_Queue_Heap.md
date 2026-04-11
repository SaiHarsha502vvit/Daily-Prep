> **Navigation**: [⬅ Arrays, Strings, Hashing](10_DSA_Problems_Arrays_Strings_Hashing.md) | [📚 Index](00_INDEX.md) | [Next: Trees, Graphs, Trie, Union-Find ➡](12_DSA_Problems_Trees_Graphs_Trie_UnionFind.md)

# File 11 — DSA Problems: LinkedList, Stack, Queue & Heap

## Logic-First, Code-Second: The 5W+H Way

> Every problem: WHAT is it asking → WHY does this approach work → WHEN to recognize it → HOW to think → HOW to translate to code.

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



> 🔬 **Section Challenge — STACK**
>
> **Challenge 1 (Reasoning):** Monotonic DECREASING stack — when you push a new element, which existing elements are popped and what information do those pops tell you?
> <details><summary>Answer</summary>
>
> In a decreasing stack (top is smallest), pushing element `x`: all elements smaller than `x` are popped. For each popped element `y`: `x` is the NEXT GREATER ELEMENT of `y`. This is the key insight: the pop event = answer event. Application: Daily Temperatures (next warmer day), Largest Rectangle in Histogram (right boundary), Next Greater Element. Each element is pushed and popped exactly once → O(N) total.
> </details>
>

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

| # | Problem | Core Logic | Pattern | Key Insight |
|---|---------|------------|---------|-------------|
| 1 | Reverse LL | 3 pointers: prev/curr/next | Pointer Reversal | Save next before redirecting |
| 2 | LL Cycle | fast/slow meet in cycle | Floyd's Algorithm | After meet, reset slow to head |
| 3 | Merge 2 Sorted | compare heads, advance smaller | Merge Technique | Dummy node avoids edge cases |
| 4 | Remove Nth End | gap of n between pointers | Two Pointers | Dummy node handles head removal |
| 5 | Reorder List | find mid + reverse + merge | Decomposition | 3 known subproblems combined |
| 6 | LRU Cache | map + doubly linked list | Map + DLL | O(1) remove needs prev pointer |
| 7 | Valid Parens | push open, pop on close | Stack Matching | Stack must be empty at end |
| 8 | Min Stack | auxiliary min tracking | Two Stacks | Push min alongside each value |
| 9 | Daily Temperatures | resolve when warmer found | Monotonic Stack | Stack stores indices, not values |
| 10 | Eval RPN | push nums, pop on operator | Stack Evaluation | Pop order: b first, then a |
| 11 | Histogram Rect | extend until shorter bar | Monotonic Stack | Width = right_bound - left_bound - 1 |
| 12 | Queue w/ Stacks | two reversals = original | Two Stacks | Amortized O(1) via lazy transfer |
| 13 | Sliding Window Max | remove useless elements | Monotonic Deque | Remove from back (dominated) + front (expired) |
| 14 | Kth Largest | min-heap of size k | Heap Top-K | Root = kth largest at all times |
| 15 | Stream Median | split into two halves | Two Heaps | Max-heap small half + min-heap large half |
| 16 | Task Scheduler | fill gaps around most frequent | Greedy + Freq | Formula: (maxF-1)*(n+1) + maxCount |
| 17 | Reorganize String | place most freq, skip prev | Heap + Cooldown | hold-back trick prevents adjacent same |

---




## Interview Quick-Fire: LinkedList / Stack / Queue / Heap

**Q: "Why not use an array instead of linked list?"** → LinkedList has O(1) insert/delete at arbitrary positions (given node reference). Array has O(n) shift. But array has O(1) indexed access and better cache performance.

**Q: "When stack vs queue?"** → Stack = undo operations, DFS, bracket matching, expression eval. Queue = BFS, scheduling, order processing.

**Q: "When heap vs sorting?"** → Heap when you only need top-K (O(n log k) < O(n log n)). Heap when data is streaming. Sort when you need the entire sorted order.

**Q: "Max-heap or min-heap?"** → For kth LARGEST → min-heap of size k (root is the answer). For kth SMALLEST → max-heap of size k. Counter-intuitive but correct.

**Q: "Why doubly linked list for LRU and not singly?"** → Need O(1) removal from middle. Singly linked list requires traversal to find predecessor. Doubly linked list has prev pointer → O(1) unlink.

---


---

## 🏋️ Practice & Interview Questions — Linked Lists

### Predict / Trace
**Q1.** Trace: reverse a linked list `1→2→3→null` manually. Show prev/curr at each step.
<details><summary>Answer</summary>

Step 1: prev=null, curr=1 → 1.next=null, prev=1, curr=2
Step 2: prev=1, curr=2 → 2.next=1, prev=2, curr=3
Step 3: prev=2, curr=3 → 3.next=2, prev=3, curr=null
Result: 3→2→1→null
</details>

**Q2.** Floyd's cycle detection — if fast and slow both start at head, and list has no cycle, when does fast reach null?
<details><summary>Answer</summary>

Fast moves 2 steps per iteration. For odd length N: fast reaches null at step (N+1)/2. For even N: fast reaches null at step N/2.
</details>

### LeetCode / Coding
**Q3.** ⭐ Reverse a Linked List (iterative + recursive).
<details><summary>Solution</summary>

```java
// Iterative
ListNode prev=null, curr=head;
while(curr!=null){ ListNode next=curr.next; curr.next=prev; prev=curr; curr=next; }
return prev;

// Recursive
ListNode reverseList(ListNode head){
    if(head==null||head.next==null) return head;
    ListNode rest = reverseList(head.next);
    head.next.next = head; head.next = null;
    return rest;
}
```
</details>

**Q4.** ⭐ Detect cycle in LinkedList (Floyd's Algorithm).
<details><summary>Solution</summary>

```java
ListNode slow=head, fast=head;
while(fast!=null && fast.next!=null){
    slow=slow.next; fast=fast.next.next;
    if(slow==fast) return true;
}
return false;
```
</details>

**Q5.** ⭐ Find middle of LinkedList.
<details><summary>Solution</summary>

```java
ListNode slow=head, fast=head;
while(fast!=null && fast.next!=null){ slow=slow.next; fast=fast.next.next; }
return slow; // slow is at middle
```
</details>

**Q6.** ⭐ Merge two sorted linked lists.
<details><summary>Solution</summary>

```java
ListNode dummy=new ListNode(0), curr=dummy;
while(l1!=null && l2!=null){
    if(l1.val<=l2.val){ curr.next=l1; l1=l1.next; }
    else { curr.next=l2; l2=l2.next; }
    curr=curr.next;
}
curr.next = (l1!=null)?l1:l2;
return dummy.next;
```
</details>

**Q7.** ⭐⭐ Remove Nth node from end of list.
<details><summary>Solution</summary>

```java
ListNode dummy=new ListNode(0); dummy.next=head;
ListNode fast=dummy, slow=dummy;
for(int i=0;i<=n;i++) fast=fast.next;
while(fast!=null){ fast=fast.next; slow=slow.next; }
slow.next=slow.next.next;
return dummy.next;
```
</details>

**Q8.** ⭐⭐ Find the start of a cycle (Floyd's phase 2).
<details><summary>Solution</summary>

```java
// After meeting point found, reset slow to head
slow=head;
while(slow!=fast){ slow=slow.next; fast=fast.next; }
return slow; // start of cycle
```
</details>

**Q9.** ⭐⭐ LRU Cache — implement with O(1) get and put.
<details><summary>Solution</summary>

```java
// HashMap<key, Node> + Doubly Linked List
// Most recently used at tail, least recently used at head
// put: add to tail, if capacity exceeded remove head
// get: move accessed node to tail
class LRUCache {
    Map<Integer,Node> map = new HashMap<>();
    Node head, tail;
    int cap;
    // ... (standard doubly-linked list implementation)
}
```
</details>

**Q10.** ⭐⭐ Palindrome LinkedList — O(N) time, O(1) space.
<details><summary>Solution</summary>

```java
// 1. Find middle (slow/fast)
// 2. Reverse second half
// 3. Compare first and reversed second half
// 4. Restore list (optional)
```
</details>

**Q11.** ⭐⭐⭐ Merge K sorted lists — O(N log K) with PriorityQueue.
<details><summary>Solution</summary>

```java
PriorityQueue<ListNode> pq = new PriorityQueue<>((a,b)->a.val-b.val);
for(ListNode l:lists) if(l!=null) pq.offer(l);
ListNode dummy=new ListNode(0), curr=dummy;
while(!pq.isEmpty()){
    ListNode node=pq.poll(); curr.next=node; curr=curr.next;
    if(node.next!=null) pq.offer(node.next);
}
return dummy.next;
```
</details>

### Interview Questions
**Q12.** Why is deleting from the middle of a LinkedList O(1) if you have the node reference, but finding it is O(N)?
<details><summary>Answer</summary>

LinkedList nodes store next/prev pointers. Given a node reference: `prev.next = node.next` is O(1). But traversal from head to find the node is O(N) since there's no index-based access.
</details>

**Q13.** `ArrayList` vs `LinkedList` — when is LinkedList NEVER the right choice?
<details><summary>Answer</summary>

For random access (get by index), sorting, or bulk iteration — ArrayList wins due to cache locality. LinkedList's O(N) random access kills performance. In practice, ArrayList + ArrayDeque cover almost all use cases.
</details>

### MCQ Rapid Fire
| # | Question | Answer |
|---|---|---|
| 1 | Singly linked list deletion from tail | O(N) — must find second-to-last |
| 2 | Doubly linked list deletion from tail | O(1) — use tail.prev |
| 3 | Java LinkedList implements | List + Deque |
| 4 | addFirst() vs addLast() time complexity | O(1) both |
| 5 | Floyd's algorithm space complexity | O(1) |
| 6 | Reversing a linked list space complexity | O(1) iterative, O(N) recursive |
| 7 | Sentinel/dummy node purpose | Simplifies edge cases (empty list, single node) |
| 8 | Skip List uses linked lists for | O(log N) average search |



---

## 🧠 Deep Conceptual Questions — Linked Lists

**C1. Why does Java's `LinkedList` implement both `List` AND `Deque`?**
<details><summary>Deep Answer</summary>

A doubly-linked list naturally supports O(1) operations at BOTH ends: `addFirst`, `addLast`, `removeFirst`, `removeLast`. This makes it a perfect Deque (double-ended queue). Java's designers unified the implementations: one data structure, two contracts. `ArrayDeque` is usually faster for queue/stack operations due to cache locality, but LinkedList covers cases needing both List index access and queue behavior (theoretically — in practice, ArrayDeque + ArrayList cover all needs better).
</details>

**C2. Why is Floyd's cycle detection called "tortoise and hare"?**
<details><summary>Deep Answer</summary>

The slow pointer (tortoise) moves 1 step; fast pointer (hare) moves 2. If a cycle exists, the hare enters it first. The tortoise then enters. Since hare moves faster, it gradually gains on the tortoise inside the cycle. The "distance gap" between them decreases by 1 per step inside the cycle. They MUST meet within at most cycle_length steps after the tortoise enters. The meeting point is always WITHIN the cycle. Phase 2 (finding start): reset slow to head, both move 1 step → they meet at cycle start. This works due to modular arithmetic: the distance math works out to exactly the cycle start.
</details>

**C3. Why is `dummy.next = head` pattern so useful in linked list problems?**
<details><summary>Deep Answer</summary>

It eliminates the special case of modifying the head node. Without dummy: "what if I need to delete the head?" needs separate code. With dummy: the real head is just `dummy.next`. You can delete `dummy.next` using the same code as any other node (`prev.next = prev.next.next`). Same logic applies to insertion, merging. Dummy node costs O(1) extra space and saves significant code complexity and potential null-pointer bugs.
</details>

**C4. Reverse a linked list: what's the fundamental insight?**
<details><summary>Deep Answer</summary>

You need to change every `next` pointer from pointing forward to pointing backward. The problem: if you change `curr.next` to `prev`, you lose your reference to `curr.next` (the next node to process). Solution: always save `next` BEFORE changing the pointer. The 3-variable dance: `next = curr.next; curr.next = prev; prev = curr; curr = next`. The recursion version reverses from the tail backward — simpler to reason about (`head.next.next = head; head.next = null`) but uses O(N) stack space.
</details>

**C5. LRU Cache: why is a HashMap + Doubly Linked List the optimal data structure?**
<details><summary>Deep Answer</summary>

Requirements: O(1) get (by key) AND O(1) update order (move to "most recent"). HashMap alone: O(1) get but can't track recency order. LinkedList alone: O(N) get by key. Combined: HashMap maps key → node pointer in the doubly-linked list. Get: HashMap lookup = O(1) to find node, then O(1) pointer manipulation to move to tail. Evict: remove head (LRU) = O(1). Insert: add to tail = O(1). The doubly-linked nature is critical: moving a node requires updating BOTH its predecessor and successor, which requires O(1) access to both — only possible with `prev` pointer.
</details>

**C6. Why does the "find middle" technique use slow/fast instead of counting length then dividing?**
<details><summary>Deep Answer</summary>

Two reasons: (1) **Single pass**: length counting needs one full traversal, then half traversal = 1.5N operations. Slow/fast finds middle in N/2 steps — one pass. (2) **Cleaner integration**: in `palindrome check`, `sort linked list`, `split into halves` problems, you need the middle during traversal anyway. The slow/fast approach composes naturally into these algorithms without a separate counting phase.
</details>

**C7. Merge two sorted lists: why is the dummy node + two-pointer approach textbook?**
<details><summary>Deep Answer</summary>

It reduces the problem to: at each step, pick the smaller head from two lists and advance that pointer. The dummy node holds the result list start. This mirrors merge-sort's merge step exactly. The invariant: `curr` always points to the last node of the merged list, ready to accept the next smallest. Time O(M+N), space O(1) (just pointer manipulation, no new nodes). The final `curr.next = l1 != null ? l1 : l2` handles the remaining tail in O(1) — no loop needed since one list is already sorted.
</details>


> **Navigation**: [⬅ Arrays, Strings, Hashing](10_DSA_Problems_Arrays_Strings_Hashing.md) | [📚 Index](00_INDEX.md) | [Next: Trees, Graphs, Trie, Union-Find ➡](12_DSA_Problems_Trees_Graphs_Trie_UnionFind.md)
