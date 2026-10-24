# 🎓 University-Level Exam Problem Bank

> **Navigation**: [← Problem-Solving Mental Models](01_solving_mental_models.md) | [Chapter overview](../02_PROBLEM_SETS.md)
> Page 2 of 2 in **Data Structures — Problem Sets**


> **Purpose:** This addendum provides at least 2 exam-style problems per core data structure, in the format used by MIT 6.006 / ETH / KTH. Each problem has: constraints, DS choice rationale, solution sketch, edge cases, and Erklärung (common mistakes). Use these as a self-test: if you can solve a problem in < 30 minutes without looking at the solution, the corresponding chapter is internalized.

## DS-PS-A1 — Array Exam Problems

### Problem A1.1 — Kadane's Algorithm Correctness Proof

**Problem:** Prove that Kadane's algorithm (greedy local maximum) correctly computes the maximum sum of any contiguous subarray.

**Constraints:** n ≤ 10⁶, time = O(n), memory = O(1).

**DS choice:** Contiguous array; the input is already in array form. No auxiliary DS.

**Algorithm:** Walk once; maintain `currentMax` (max sum ending at index i). Reset to 0 when negative.

**Solution sketch:**
```
currentMax = arr[0]; globalMax = arr[0]
for i = 1 to n-1:
    currentMax = max(arr[i], currentMax + arr[i])
    globalMax = max(globalMax, currentMax)
return globalMax
```

**Edge cases:**
- All negative: `globalMax` = max element, not 0 (unless empty)
- Single element: `globalMax` = arr[0]
- All zeros: `globalMax` = 0
- Mix of positive/negative: standard case

**Erklärung (common mistakes):**
- ❌ Setting `globalMax = 0` for all-negative inputs — should be max element
- ❌ Forgetting to handle n = 0 (return 0 by convention or throw)
- ❌ Using `Integer.MIN_VALUE` as initial value but `currentMax + arr[i]` overflows on big inputs (use `long`)
- ❌ Confusing "max sum ending here" with "max sum so far"

**Correctness proof sketch (induction on i):**
- Base case (i = 0): `currentMax = arr[0]`, `globalMax = arr[0]`. Both correct.
- Inductive step: assume true for i-1. At i, either:
  - Start new subarray at i: `arr[i]`
  - Extend previous: `currentMax[i-1] + arr[i]`
  - The optimal choice for "max sum ending at i" is max of these two.
- `globalMax[i] = max(globalMax[i-1], currentMax[i])`. By induction, both are correct.

### Problem A1.2 — Geometric Series Amortized Cost

**Problem:** A custom array-backed list grows by adding 1 to its capacity each time it fills up (instead of doubling). Prove that append is O(n) amortized, not O(1).

**Constraints:** n elements inserted one at a time; capacity starts at 1.

**DS choice:** Array-backed list with linear growth.

**Algorithm:** Each resize copies all existing elements; cost = current size.

**Solution sketch:** Total work = 1 + 2 + 3 + ... + n = n(n+1)/2 = O(n²). Amortized per append = O(n).

**Edge cases:**
- n = 0: trivial
- n = 1: one copy; O(1)
- n large: O(n²) total

**Erklärung:**
- ❌ Assuming "copy once per resize" → O(1) amortized. WRONG — count total copies, not per-resize.
- ❌ Confusing worst-case per-op (O(n)) with amortized (O(n)). Both are O(n) for linear growth.

**Proof sketch:** The geometric-series argument requires geometric (e.g., 1.5×) growth. With linear growth, the series is arithmetic, not geometric. The 17th append copies 17 elements; the millionth append copies 10⁶ elements.

## DS-PS-L1 — Linked List Exam Problems

### Problem L1.1 — Floyd's Cycle Detection Proof

**Problem:** Prove that Floyd's tortoise-and-hare algorithm detects a cycle in a linked list in O(n) time and O(1) space.

**Constraints:** n ≤ 10⁶, time = O(n), memory = O(1).

**DS choice:** Singly linked list.

**Algorithm:** Slow pointer moves 1 step; fast moves 2 steps. If they meet, there's a cycle.

**Solution sketch:** See `01c_LinkedList.md` addendum.

**Edge cases:**
- Empty list (no cycle)
- Single node self-loop
- Cycle at tail
- Long list without cycle

**Erklärung:**
- ❌ Forgetting `fast != null && fast.next != null` check → NPE
- ❌ Confusing "they meet" with "they're at the same node" — they meet at some node in the cycle, not necessarily at the cycle's entry
- ❌ Claiming O(n) without proof — it's O(n) only when the cycle analysis is included

### Problem L1.2 — Reverse in Groups of K

**Problem:** Reverse every K nodes in a linked list. If the remaining nodes are < K, leave them as-is.

**Constraints:** n ≤ 10⁶, K ≤ n, time = O(n), memory = O(1) auxiliary.

**DS choice:** Singly linked list.

**Algorithm:** Walk K nodes; reverse that segment; link to next segment.

**Solution sketch:**
```
def reverseKGroup(head, k):
    dummy = Node(0, head)
    groupPrev = dummy
    while True:
        kth = getKth(groupPrev, k)
        if kth is None: break
        groupNext = kth.next
        # reverse groupPrev.next ... kth
        prev, curr = groupNext, groupPrev.next
        while curr != groupNext:
            tmp = curr.next
            curr.next = prev
            prev = curr
            curr = tmp
        tmp = groupPrev.next
        groupPrev.next = kth
        groupPrev = tmp
    return dummy.next
```

**Edge cases:**
- n = 0 (return null)
- n = K (full reverse)
- n < K (no reverse)
- K = 1 (no-op)
- K = n (full reverse)
- Remaining nodes < K (leave as-is)

**Erklärung:**
- ❌ Losing reference to `groupPrev.next` after mutation
- ❌ Forgetting to check if K nodes exist before reversing
- ❌ Off-by-one in the loop (should be `while curr != groupNext`)

## DS-PS-SQ1 — Stack/Queue Exam Problems

### Problem SQ1.1 — Valid Parentheses with Multiple Types

**Problem:** Given a string containing `()[]{}`, determine if all brackets are correctly matched and nested.

**Constraints:** |s| ≤ 10⁴, time = O(n), memory = O(n).

**DS choice:** Stack (LIFO matches the nesting structure).

**Algorithm:** Push opening brackets; for closing, pop and check match.

**Solution sketch:**
```
stack = empty
for char in s:
    if char in "([{":
        stack.push(char)
    else:
        if stack.isEmpty(): return false
        top = stack.pop()
        if (top, char) not in [("(", ")"), ("[", "]"), ("{", "}")]: return false
return stack.isEmpty()
```

**Edge cases:**
- Empty string (valid)
- Single bracket (invalid)
- All opening (invalid)
- All closing (invalid)
- Nested deeply (stack depth = n/2)

**Erklärung:**
- ❌ Forgetting to check `stack.isEmpty()` before popping
- ❌ Using a HashMap for matching instead of a switch (slower but correct)
- ❌ Returning `true` when stack is non-empty (must be empty)

### Problem SQ1.2 — Sliding Window Maximum

**Problem:** Given array of size n and window size k, find max in each window.

**Constraints:** n ≤ 10⁶, k ≤ n, time = O(n), memory = O(k).

**DS choice:** Monotonic deque (store indices of elements in decreasing value order).

**Algorithm:** For each i, remove indices < i-k from head; remove indices with smaller values from tail; add i; record head's value.

**Solution sketch:**
```
deque = empty  // stores indices
result = []
for i = 0 to n-1:
    while deque not empty and deque.first < i - k:
        deque.removeFirst()
    while deque not empty and arr[deque.last] < arr[i]:
        deque.removeLast()
    deque.addLast(i)
    if i >= k - 1:
        result.append(arr[deque.first])
return result
```

**Edge cases:**
- k = 1 (each element is its own max)
- k = n (max is overall max)
- All same values (any max works)
- Strictly decreasing (no removal from tail until window slides)

**Erklärung:**
- ❌ Using a heap → O(n log k) instead of O(n)
- ❌ Forgetting to remove indices < i-k from head
- ❌ Recording deque.first's value but deque.first is the *index*, not the value

## DS-PS-H1 — Hash Table Exam Problems

### Problem H1.1 — Two-Sum in O(n)

**Problem:** Given an array and a target, find indices of two elements summing to target.

**Constraints:** n ≤ 10⁶, time = O(n), memory = O(n).

**DS choice:** HashMap (O(1) avg lookup of complement).

**Algorithm:** Single pass; for each element, check if `target - element` is in the map.

**Solution sketch:**
```
map = HashMap<Integer, Integer>  // value → index
for i = 0 to n-1:
    complement = target - arr[i]
    if map.containsKey(complement):
        return [map.get(complement), i]
    map.put(arr[i], i)
return []  // no solution
```

**Edge cases:**
- Empty array (return [])
- Single element (return [])
- Two same elements summing to target (e.g., [3, 3], target = 6)
- Negative numbers
- Multiple solutions (return any)

**Erklärung:**
- ❌ Sorting first → O(n log n) but correct; the O(n) solution requires hash map
- ❌ Using `getOrDefault` to handle the same-element case incorrectly
- ❌ Returning the wrong index order (must be earlier index first)

### Problem H1.2 — LRU Cache Implementation

**Problem:** Implement an LRU cache with O(1) get and put.

**Constraints:** capacity ≤ 10⁴, time = O(1) per op, memory = O(capacity).

**DS choice:** HashMap + Doubly Linked List.

**Algorithm:** See `00_DS_PROBLEM_BRIDGES.md` Bridge 4.

**Solution sketch:** See earlier; combine HashMap<K, Node> with DLL of nodes.

**Edge cases:**
- Empty cache (first put)
- Capacity = 1 (constant eviction)
- Re-insert existing key (update value, move to tail)
- Negative capacity (throw)
- Concurrent access (use synchronized or ConcurrentHashMap)

**Erklärung:**
- ❌ Using a TreeMap → O(log n) per op, not O(1)
- ❌ Forgetting to remove from DLL when evicting
- ❌ Using a singly LL → O(n) for `remove(node)`, not O(1)

## DS-PS-T1 — Tree/Heap Exam Problems

### Problem T1.1 — Validate BST

**Problem:** Determine if a binary tree is a valid BST (left subtree keys < node key ≤ right subtree keys).

**Constraints:** n ≤ 10⁶, time = O(n), memory = O(h).

**DS choice:** BST with strict ordering invariant.

**Algorithm:** In-order traversal; track previous value; ensure strictly increasing.

**Solution sketch:**
```
def isValidBST(root):
    stack = []
    prev = -infinity
    curr = root
    while curr or stack:
        while curr:
            stack.append(curr)
            curr = curr.left
        curr = stack.pop()
        if curr.val <= prev: return False
        prev = curr.val
        curr = curr.right
    return True
```

**Edge cases:**
- Empty tree (valid)
- Single node (valid)
- Duplicate keys (depends on strict vs non-strict)
- Right-skewed tree (valid)
- Tree where left subtree has a key > root.key (invalid)

**Erklärung:**
- ❌ Just checking `node.left.val < node.val && node.val < node.right.val` — fails on cross-subtree violations (e.g., left subtree's right child > root)
- ❌ Using recursion on a deep tree → stack overflow
- ❌ Not handling duplicates consistently

### Problem T1.2 — Top-K Frequent Elements

**Problem:** Given an array, return the K most frequent elements.

**Constraints:** n ≤ 10⁶, K ≤ unique count, time = O(n log K), memory = O(n).

**DS choice:** HashMap (counting) + Min-Heap of size K (selection).

**Algorithm:** Count with HashMap; maintain min-heap of size K by frequency.

**Solution sketch:**
```
count = HashMap<Integer, Integer>
for x in arr: count.merge(x, 1, Integer::sum)

heap = PriorityQueue<Map.Entry<Integer, Integer>>(
    Comparator.comparingInt(Map.Entry::getValue))
for entry in count.entrySet():
    heap.offer(entry)
    if heap.size() > K: heap.poll()

return heap.stream().map(Map.Entry::getKey).collect(toList())
```

**Edge cases:**
- n = 0 (return [])
- K = 0 (return [])
- All elements equal (return [theElement])
- K > unique count (return all unique)

**Erklärung:**
- ❌ Using a max-heap → O(n log n), not O(n log K)
- ❌ Using sort → O(n log n), not O(n log K)
- ❌ Forgetting to handle K > unique count

## DS-PS-M1 — Miscellaneous Exam Problems (Mixed DS)

### Problem M1.1 — Design a Tweet Timeline

**Problem:** Design a function that returns the 10 most recent tweets for a user, given 10⁹ tweets total.

**Constraints:** users ≤ 10⁶, tweets per user ≤ 10⁶, query latency ≤ 100 ms.

**DS choice:** Max-heap (per user) or sorted index (global).

**Algorithm:** Maintain a per-user heap of tweets (by timestamp); for query, extract top 10.

**Solution sketch:**
```
class TimelineService:
    Map<UserId, PriorityQueue<Tweet>> userTimelines  // max-heap by timestamp
    
    postTweet(userId, tweet):
        if !userTimelines.containsKey(userId):
            userTimelines.put(userId, new PriorityQueue<>(...))
        userTimelines.get(userId).offer(tweet)
    
    getNewsFeed(userId):
        heap = userTimelines.get(userId)  // assume follows self
        for followee in userId.getFollowees():
            heap = mergeHeap(heap, userTimelines.get(followee))
        return top 10 from heap
```

**Trade-offs:**
- Memory: O(tweets) per user × users
- Query latency: O(log tweets) per extract × 10
- Alternative: pre-computed materialized view (faster query, slower write)

**Erklärung:**
- ❌ Loading all tweets and sorting → O(n log n), too slow for 10⁹
- ❌ Using SQL `ORDER BY timestamp DESC LIMIT 10` without index → O(n log n)
- ❌ Forgetting to merge timelines of followees

### Problem M1.2 — Implement a Rate Limiter

**Problem:** Limit a user to N requests per second.

**Constraints:** users ≤ 10⁶, requests/sec/user ≤ N ≤ 100, decision latency ≤ 1 ms.

**DS choice:** Sliding window with deque of timestamps OR token bucket.

**Algorithm (sliding window):**
```
class RateLimiter:
    Map<UserId, Deque<Long>> userTimestamps  // long = ms since epoch
    
    allow(userId):
        now = System.currentTimeMillis()
        window = userTimestamps.computeIfAbsent(userId, k -> new ArrayDeque<>())
        while !window.isEmpty() and window.peekFirst() < now - 1000:
            window.pollFirst()
        if window.size() >= N: return false
        window.offerLast(now)
        return true
```

**Edge cases:**
- New user (first request allowed)
- Burst at boundary (requests spanning 2 windows)
- Clock skew across servers (use monotonic clock)
- Distributed deployment (use Redis sorted set)

**Erklärung:**
- ❌ Using fixed window → burst at window boundaries
- ❌ Forgetting to evict old timestamps → memory leak
- ❌ Using wall-clock time instead of monotonic time → clock jumps break the algorithm

---

## When Problem-Solving Breaks (Anti-Pattern Wall)

### Anti-Pattern 1: Skipping the Invariant — Jumping Straight to Code

**What breaks**: Writing code for "find the median of a stream" without first identifying the invariant: "max-heap of lower half, min-heap of upper half; sizes differ by at most 1." Without the invariant, the code diverges at edge cases (odd/even size, duplicate values, first element).
**Fix**: State the invariant first, prove it holds at init/every step/termination, then write code that enforces it.

### Anti-Pattern 2: Ignoring the Amortized vs Worst-Case Distinction

**What breaks**: Claiming `ArrayList.add()` is O(1) and then failing the follow-up: "what's the worst case for a single add?" The answer is O(n) for the resize case. Interviewers at top companies specifically probe this distinction.
**Fix**: Always state BOTH. "O(1) amortized, O(n) worst case for a single operation." Then justify: n appends total cost O(n) (geometric series argument).

### Anti-Pattern 3: Choosing HashMap When Order Matters

**What breaks**: Using `HashMap` to count character frequencies, then iterating to reconstruct the string in frequency order — `HashMap` iteration order is not defined (and changes between JDK versions / load factors). The test passes locally and fails in CI with a different seed.
**Fix**: When insertion order matters → `LinkedHashMap`. When sorted order matters → `TreeMap`. When order truly doesn't matter → `HashMap`.

### Anti-Pattern 4: Recursive DFS Without Cycle Guard on a Graph

**What breaks**: DFS on a directed graph without a `visited` set causes infinite recursion on cycles. Every graph problem must begin with: "Is this a tree (no cycles) or a general graph (may have cycles)?" The answer determines whether you need a `visited` set.
**Fix**: Always pass a `Set<Integer> visited` into DFS for general graphs. For trees, the parent-tracking trick suffices (`if (v == parent) continue`).

## Cross-References

- **`02_PROBLEM_SETS.md`** Part A and Part B (in body above) — original MIT 6.006 problem sets.
- **`00_DS_PROBLEM_BRIDGES.md`** — constraint-first bridge template applied to each DS.
- **`01a_Memory_Foundations.md`** through **`01f_Trees_Heaps.md`** — chapter-by-chapter problems and proofs.
- **`02_PROBLEM_SETS.md`** Model 1 / 2 / 3 (Constraint-First, Invariant Reasoning, Edge-Case Enumeration) — the three reasoning models applied throughout.

---

[← Problem-Solving Mental Models](01_solving_mental_models.md) | [Chapter overview](../02_PROBLEM_SETS.md)
