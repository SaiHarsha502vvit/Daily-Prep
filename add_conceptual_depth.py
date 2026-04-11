#!/usr/bin/env python3
"""
PASS 2: Adds deep conceptual understanding questions — the 'WHY' layer.
Focuses on mental models, reasoning, traps, analogies, and interview depth.
Skips files that already have the conceptual section.
"""
import sys, io, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

BASE = r"e:\Dev_World\04_Practice\Daily-Prep"
MARKER = "## 🧠 Deep Conceptual Questions"

# ─────────────────────────────────────────────────────────────────────────────
# CONCEPTUAL QUESTION BANKS — per topic
# ─────────────────────────────────────────────────────────────────────────────

CONCEPTUAL_BANKS = {

"Arrays": """
## 🧠 Deep Conceptual Questions — Arrays & Memory

> These questions test your REASONING, not just recall. Think before expanding.

**C1. Why is array access O(1)?**
<details><summary>Deep Answer</summary>

Arrays store elements at **contiguous memory addresses**. Given base address B and element size S:
`address(i) = B + (i × S)` — this is a single multiplication and addition (constant time regardless of N).
The CPU can compute this directly without any traversal. This is why arrays are the fastest data structure for indexed access.
</details>

**C2. Why does cache performance matter for algorithms, and why do arrays win?**
<details><summary>Deep Answer</summary>

Modern CPUs fetch memory in **cache lines** (~64 bytes). When you access `array[i]`, the CPU also loads `array[i+1]` through `array[i+7]` into L1 cache automatically (spatial locality). Sequential array access hits cache nearly 100% of the time (~1ns). LinkedList traversal: each node is at a random heap address → each step is a potential **cache miss** (~100ns). For 1M elements: array traversal ≈ 1ms; linked list ≈ 100ms. Same O(N), 100x different in practice.
</details>

**C3. Why does `Arrays.sort()` use different algorithms for primitives vs objects?**
<details><summary>Deep Answer</summary>

**Primitives (`int[]`)**: Uses Dual-Pivot QuickSort. No stability needed (equal ints are indistinguishable). QuickSort is in-place (O(1) extra space), cache-friendly (sequential access), fastest in practice. **Objects (`Integer[]`)**: Uses TimSort (hybrid MergeSort + InsertionSort). MUST be stable — equal objects may have different fields that should preserve original order (think: sort by name, then by age — equal names must stay age-ordered). TimSort guarantees O(N log N) worst case; QuickSort can degrade to O(N²) if not careful.
</details>

**C4. Why is inserting at the beginning of an array O(N) but appending at end is O(1) amortized?**
<details><summary>Deep Answer</summary>

**Insert at index 0**: must shift every element right → N operations always.
**Append**: if capacity exists, write at `arr[size]` → O(1). If full, resize (double capacity) → copy all N elements. But resizing happens only after 1, 2, 4, 8... N elements. Total copies over N appends = N/2 + N/4 + ... = N. Average per operation = N/N = O(1) — this is **amortized analysis**. ArrayList uses this strategy.
</details>

**C5. What is the REAL cost of `ArrayList.remove(0)` in a 1M element list? Why?**
<details><summary>Deep Answer</summary>

~1 million array element shifts. Java calls `System.arraycopy()` — a native bulk memory move. Even though it's one instruction, it copies 1M references = 4MB-8MB of memory movement. At memory bandwidth ~20GB/s: ~200-400 microseconds actual cost. Not "slow" but definitely O(N) — avoid repeatedly removing from the front of a large ArrayList. Use `ArrayDeque` for front-removal O(1).
</details>

**C6. Two Sum: why does the HashMap approach work, and what's its actual space tradeoff?**
<details><summary>Deep Answer</summary>

HashMap approach: as you iterate, store `{value → index}`. For each element, check if `target - current` already seen. This is the **complement pattern**: instead of "find two that sum to target", reframe as "have I seen what I need?". Space: O(N) worst case (all elements unique, no match until last pair). But we trade space for a reduction from O(N²) to O(N) time — classic space-time tradeoff. The 1-pass variant finds the answer in one scan without a second loop.
</details>

**C7. Sliding Window: what is the INVARIANT being maintained?**
<details><summary>Deep Answer</summary>

A sliding window maintains a **window [left, right]** where some property (max sum, no duplicates, valid substring) holds. The invariant: the window always satisfies the constraint. When violated: shrink from left until valid again. This avoids re-examining elements already processed — each element enters and leaves the window exactly once → O(N). Mental model: two pointers chasing each other, never crossing, each moving forward-only.
</details>

**C8. Prefix Sum: why does it reduce range-sum queries from O(N) to O(1)?**
<details><summary>Deep Answer</summary>

`prefix[i] = arr[0] + arr[1] + ... + arr[i]`. Sum of range [l,r] = `prefix[r] - prefix[l-1]`. Precomputation: O(N). Each query: O(1) subtraction. Without prefix sum: each query scans the range = O(N) per query → O(N×Q) total for Q queries. With prefix sum: O(N) build + O(Q) queries = O(N+Q). Break-even at Q=1; better for Q>1. Classic **precomputation tradeoff**: pay once, query forever.
</details>

**C9. Why does Kadane's Algorithm work for Maximum Subarray?**
<details><summary>Deep Answer</summary>

The key insight: at each position i, the maximum subarray ending at i is either:
1. `arr[i]` alone (start fresh — previous subarray was negative, drags us down)
2. `arr[i] + best_ending_at[i-1]` (extend the previous best)

`curr = max(arr[i], curr + arr[i])` captures this exactly. If curr becomes negative, it's better to start fresh at next element. We track global max throughout. This is a 1D DP where the "state" is "maximum subarray sum ending here". The recurrence is the key reasoning step.
</details>

**C10. Binary Search: why does `mid = lo + (hi - lo) / 2` instead of `(lo + hi) / 2`?**
<details><summary>Deep Answer</summary>

**Integer overflow!** If `lo + hi` exceeds `Integer.MAX_VALUE` (2,147,483,647), the sum wraps to a negative number. For huge arrays (lo=1B, hi=2B), `lo + hi = 3B > 2.1B`. This bug brought down a famous JDK implementation of binary search in 2006 (Joshua Bloch's blog post). `lo + (hi - lo) / 2` can never overflow since `hi - lo` is always positive and smaller than either value alone.
</details>
""",

"LinkedList": """
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
""",

"Stack": """
## 🧠 Deep Conceptual Questions — Stack & Queue

**C1. Why is a monotonic stack called "monotonic" and what property does it maintain?**
<details><summary>Deep Answer</summary>

A monotonic stack maintains elements in **strictly increasing or decreasing order** from bottom to top. When a new element arrives that violates the monotonicity (e.g., a larger element in a decreasing stack), elements are popped until the property is restored, THEN the new element is pushed. The pop events are the answer events: when element X is popped because Y is larger, Y is the "next greater element" of X. This processes each element exactly once (each is pushed and popped at most once) → O(N) total.
</details>

**C2. Why use `ArrayDeque` instead of `Stack` class in Java?**
<details><summary>Deep Answer</summary>

Java's `Stack` extends `Vector` (legacy, synchronized). Every push/pop acquires a mutex lock — unnecessary for single-threaded stack use. `ArrayDeque` has zero synchronization overhead, pure array-backed, cache-friendly. Also: `Stack`'s interface allows index-based access and `insertElementAt` which shouldn't exist on a stack (breaks the abstraction). `ArrayDeque` implements `Deque` — clean stack interface (`push`, `pop`, `peek`). **Never use `Stack` in modern Java.**
</details>

**C3. BFS uses a Queue — what property of queues makes BFS work correctly?**
<details><summary>Deep Answer</summary>

BFS needs to process nodes **level by level** — explore all nodes at distance D before any node at distance D+1. Queue's FIFO property guarantees this: nodes enqueued at distance D are dequeued and processed before nodes at distance D+1 (which are enqueued during processing D). If you used a Stack (DFS): you'd go depth-first — immediately explore children of the first node before its siblings. The FIFO vs LIFO distinction is the entire algorithmic difference between BFS and DFS.
</details>

**C4. Why is the "largest rectangle in histogram" problem solved with a monotonic stack?**
<details><summary>Deep Answer</summary>

For each bar, the rectangle it forms extends left/right until a shorter bar is hit. A monotonic increasing stack maintains bars in increasing height. When a shorter bar arrives (say height 3 comes after [2,5,7]):
- Pop 7: rectangle with height 7, width determined by current index and stack top
- Pop 5: rectangle with height 5, wider width

The stack tells us: bars still in the stack haven't found their "right boundary" yet (no shorter bar has come). When they're finally popped, we know both their left and right boundaries. This is the key geometric insight: the stack holds "potential rectangles still growing."
</details>

**C5. Implement a Queue with O(1) amortized enqueue and dequeue — why is amortized important?**
<details><summary>Deep Answer</summary>

Two-stack queue: transfer from stack1 to stack2 only when stack2 is empty. Individual dequeue can be O(N) (transfer cost). But each element is transferred at most once. Over N operations: total transfer cost = N. Average = O(1). This is amortized O(1). Real-world relevance: Python's `queue.Queue` uses this pattern. Java's `ArrayDeque` achieves true O(1) with a circular array — amortized O(1) when resizing without transfer cost.
</details>

**C6. What is the call stack and how do recursive algorithms relate to it?**
<details><summary>Deep Answer</summary>

The **call stack** is a stack of stack frames. Each function call pushes a frame (local variables, return address, parameters). Return pops the frame. Recursive DFS naturally uses the call stack AS its traversal stack. Iterative DFS explicitly manages a stack in heap memory. Iterative is often preferred for: (1) avoiding stack overflow on deep recursion (JVM default: ~500-1000 frames), (2) more control over traversal order, (3) ability to pause/resume traversal.
</details>
""",

"HashTable": """
## 🧠 Deep Conceptual Questions — Hash Tables

**C1. What makes a good hash function? Why do bad hash functions destroy performance?**
<details><summary>Deep Answer</summary>

A good hash function: (1) **uniform distribution** — spreads keys across all buckets evenly, minimizing collisions, (2) **deterministic** — same key always same hash, (3) **fast to compute** — O(1), (4) **avalanche effect** — small change in key → large change in hash. Bad example: `hashCode() { return 1; }` — all keys in one bucket → O(N) list → HashMap becomes a linked list. Java's `String.hashCode()` uses polynomial rolling hash: `s[0]*31^(n-1) + s[1]*31^(n-2) + ...`. The prime 31 exploits hardware optimization: `31*x = (x << 5) - x`. Open addressing vs chaining: Java uses chaining.
</details>

**C2. Why does Java's HashMap convert a bucket's linked list to a Red-Black Tree?**
<details><summary>Deep Answer</summary>

Without the tree conversion: if many keys hash to the same bucket (hash collision attack or bad hash), the bucket becomes a long linked list. Lookup in that bucket: O(N). An attacker could craft inputs that all hash to the same bucket → O(N) per lookup → denial of service on any HashMap-based server. Java 8+ converts to Red-Black Tree when bucket size ≥ 8 (and map size ≥ 64): worst-case drops to O(log N). Converts back to list when bucket shrinks below 6 (hysteresis prevents oscillation).
</details>

**C3. Why must `hashCode()` and `equals()` be consistent?**
<details><summary>Deep Answer</summary>

HashMap workflow: (1) compute `key.hashCode()` → find bucket index, (2) in that bucket, call `key.equals(candidate)` to find exact match. **Contract**: if `a.equals(b)` then `a.hashCode() == b.hashCode()`. Violation: override `equals()` without `hashCode()`. Two "equal" objects land in different buckets. `map.get(key2)` when `key2.equals(key1)` → goes to wrong bucket → returns null even though key1 is in the map. The reverse isn't required: two unequal objects CAN have the same hashCode (collision) — just hurts performance.
</details>

**C4. ConcurrentHashMap — how does it achieve thread safety without a global lock?**
<details><summary>Deep Answer</summary>

Java 8 ConcurrentHashMap: no single lock. Instead: **CAS (Compare-And-Swap)** for empty bucket slots — a single CPU instruction that atomically reads and conditionally writes, no lock needed. **Synchronized per-bucket** for non-empty buckets — only the specific bucket is locked, not the whole map. **Volatile head node** — readers always see the latest bucket head without a lock. Reads are completely lock-free. Result: 16x+ throughput improvement over `Hashtable` under contention.
</details>

**C5. What is "open addressing" and how does it differ from chaining?**
<details><summary>Deep Answer</summary>

**Chaining** (Java HashMap): each bucket holds a linked list of all colliding entries. Handles high load factors gracefully. Pointer overhead per entry. **Open addressing**: all entries stored in the array itself. On collision: probe for the next empty slot (linear, quadratic, or double-hashing probe sequence). Better cache performance (no pointer chasing). Degraded badly at high load factors (clustering). Python's dict uses open addressing — which is why Python dicts need deletion markers ("tombstones") to maintain probe sequences.
</details>

**C6. Why does `LinkedHashMap` maintain insertion order while `HashMap` doesn't?**
<details><summary>Deep Answer</summary>

`LinkedHashMap` adds a doubly-linked list through all entries in insertion order, on top of the regular HashMap structure. Each Entry node has `before` and `after` pointers. Iteration follows the linked list (insertion order) instead of scanning buckets. The HashMap part still handles O(1) get/put. Extra cost: 2 extra pointers per entry (16 bytes per object). `TreeMap` maintains sorted order via Red-Black Tree — O(log N) for all operations but ordered. Choice: HashMap (no order needed), LinkedHashMap (insertion order), TreeMap (sorted order).
</details>

**C7. Subarray Sum Equals K — why does the prefix sum + HashMap approach work?**
<details><summary>Deep Answer</summary>

Prefix sum: `prefix[i]` = sum of elements from index 0 to i. Sum of subarray [l, r] = `prefix[r] - prefix[l-1]`. If we want sum = k: `prefix[r] - prefix[l-1] = k` → `prefix[l-1] = prefix[r] - k`. As we compute prefix sums, we look up whether `current_prefix - k` was seen before. If yes, a subarray summing to k ends here. HashMap stores {prefix_sum → count_of_occurrences} to handle duplicate prefix sums (multiple subarrays). Initialize with `{0: 1}` to handle subarrays starting at index 0.
</details>
""",

"Trees": """
## 🧠 Deep Conceptual Questions — Trees & Heaps

**C1. Why is the inorder traversal of a BST always sorted?**
<details><summary>Deep Answer</summary>

BST invariant: every node's left subtree contains ONLY values less than the node, right subtree ONLY values greater. Inorder traversal visits: left subtree (all smaller) → root → right subtree (all larger). Applied recursively at every node, this produces values in ascending order. This is the defining property that makes BST useful: O(log N) search because at each step, half the tree is eliminated. Broken BST (invariant violated) → inorder not sorted → BST operations return wrong results. That's why "Validate BST" is a fundamental problem.
</details>

**C2. Why does heap not support O(log N) arbitrary deletion (only min/max removal)?**
<details><summary>Deep Answer</summary>

Heap invariant: parent ≤ children (min-heap). When you remove the minimum (root): replace with last element, sift down — O(log N). But for an arbitrary element: you'd need to FIND it first (O(N) scan — heap has no lookup index), then restore the heap property. Without indexing, you can't efficiently locate an element. **d-ary heaps** exist, and indexed heaps (priority queues with decrease-key, like Fibonacci heap) support O(log N) arbitrary deletion — but Java's PriorityQueue doesn't. Dijkstra's with "lazy deletion" (add stale entries, skip when popped) works around this.
</details>

**C3. Why is tree height critical for BST operations?**
<details><summary>Deep Answer</summary>

BST search = walk from root to target, one comparison per level. Operations: O(height). **Balanced BST** (AVL, Red-Black): height = O(log N) → operations O(log N). **Degenerate BST** (insert sorted data: 1,2,3,4,5): each node has only right child → height = N → operations O(N) = linked list performance! This is why TreeMap uses Red-Black Tree (self-balancing): guarantees height ≤ 2*log(N) regardless of insertion order. Red-Black Tree balance condition is weaker than AVL (allows "approximately balanced") but cheaper to maintain: at most 3 rotations per insert (AVL: potentially O(log N)).
</details>

**C4. Why does BFS on a tree need a Queue but DFS needs a Stack (or recursion)?**
<details><summary>Deep Answer</summary>

BFS explores level by level: all children of current nodes must be processed before their children. Queue's FIFO ensures: nodes added to queue at level L are processed before level L+1 nodes (which are added during L's processing). DFS explores as deep as possible before backtracking. Stack's LIFO ensures: the most recently discovered (deepest) node is explored next. Recursive DFS implicitly uses the call stack — each recursive call IS a stack frame push. Iterative DFS when chosen over recursive: avoids stack overflow for very deep trees (N deep right-skewed tree → N recursion levels → StackOverflowError).
</details>

**C5. Lowest Common Ancestor — why does the recursive approach work in O(N)?**
<details><summary>Deep Answer</summary>

The recursive logic: `lca(node, p, q)` returns the LCA if it exists in the subtree of `node`, or p/q if one is found but not the other, or null if neither found. At each node: check left subtree and right subtree results. If BOTH return non-null: this node is the LCA (p is in one subtree, q in another — this is the split point). If only one: that subtree contains both (one is ancestor of the other). The algorithm visits each node once → O(N). For BST: we can do O(log N) by comparing values (if both < node: go left; both > node: go right; one each side: node is LCA).
</details>

**C6. Why is heap built in O(N) time but inserting N elements one-by-one takes O(N log N)?**
<details><summary>Deep Answer</summary>

**Bottom-up `heapify`**: Only nodes with children need sifting-down. Bottom half are leaves (no children) — zero work. Next level: height-1 sift-down each. Total work = Σ(height * nodes at that height) = O(N) (geometric series). **N individual inserts**: each can trigger O(log N) sift-up. Total = O(N log N). The bottom-up approach is 2x faster in practice. Java's `PriorityQueue(Collection)` constructor uses O(N) heapify. `Arrays.stream().forEach(pq::add)` is O(N log N). When converting an array to a heap, always prefer the constructor form.
</details>

**C7. Binary Tree Maximum Path Sum — why can a node contribute ONE branch to its parent but TWO internally?**
<details><summary>Deep Answer</summary>

A path cannot branch twice — if you go left and right from a node, the path "bends" at that node and can't continue upward (a path is a sequence of nodes with edges between them, no branching). So: **to a parent**: this node contributes max(left_gain, right_gain, 0) + node.val — choose the better single branch. **For the global answer**: the path could USE this node as the "bend" — include left_gain + node.val + right_gain. This might be the overall maximum even if it can't be passed upward. The DFS returns the single-branch value to parent but updates the global max with the bend value at each node.
</details>

**C8. Two-heap approach for median — why one max-heap and one min-heap?**
<details><summary>Deep Answer</summary>

Maintain two properties: (1) bottom half of numbers in a max-heap (quick access to max of lower half), (2) top half in a min-heap (quick access to min of upper half). Median = either the top of one heap (odd total) or average of both tops (even total). Invariant: max-heap size ≥ min-heap size, and max-heap.top ≤ min-heap.top. Adding a number: if > min-heap.top → it's in the top half → add to min-heap; else bottom half → add to max-heap. Then rebalance if sizes differ by 2. Both heaps stay O(log N) operations per insert. This pattern generalizes: ANY running statistic that needs the "boundary" between two halves uses this two-heap technique.
</details>
""",

"Algorithms": """
## 🧠 Deep Conceptual Questions — Algorithm Design & Analysis

**C1. What does O(N log N) "feel like" and why is it the complexity barrier for comparison-based sorting?**
<details><summary>Deep Answer</summary>

O(N log N) for N=1M ≈ 20M operations. O(N²) ≈ 1 trillion. The difference is 50,000x. **Comparison sort lower bound**: any comparison-based sort must distinguish between N! possible orderings. Each comparison has 2 outcomes. A decision tree with N! leaves needs ≥ log₂(N!) height ≈ N log N (Stirling's approximation). Therefore NO comparison sort can beat O(N log N) in the worst case. Non-comparison sorts (counting sort, radix sort, bucket sort) break this bound by using non-comparison operations — but require constraints on input (e.g., integer range bounded by N).
</details>

**C2. Greedy algorithms: when do they work and what must be proven?**
<details><summary>Deep Answer</summary>

A greedy algorithm makes the locally optimal choice at each step. Works when problem has: (1) **Greedy choice property**: local optimal leads to global optimal — the choice never needs to be revised. (2) **Optimal substructure**: optimal solution to the problem contains optimal solutions to subproblems. To PROVE greedy is correct: use "exchange argument" — assume optimal solution differs from greedy, show you can swap greedy's choice in without making it worse, contradiction. Greedy FAILS when: future choices depend on current choice in complex ways (use DP instead). Classic works: interval scheduling, Huffman coding, Dijkstra. Classic fails: 0-1 knapsack (use DP).
</details>

**C3. Dynamic Programming: what is "overlapping subproblems" and why does it matter?**
<details><summary>Deep Answer</summary>

Overlapping subproblems: the same sub-computation appears multiple times. Fibonacci: `fib(5)` calls `fib(4)` and `fib(3)`. `fib(4)` also calls `fib(3)`. Without memoization: `fib(3)` computed exponentially many times → O(2^N). With memoization: each sub-result computed once and stored → O(N). DP is valuable SPECIFICALLY when: (1) problem has optimal substructure AND (2) subproblems overlap. If no overlap: just use divide-and-conquer (merge sort's subproblems don't overlap → no DP needed). DP = "smart recursion" = avoid recomputing.
</details>

**C4. Top-down (memoization) vs Bottom-up (tabulation) DP — when to choose each?**
<details><summary>Deep Answer</summary>

**Top-down (memoization)**: Write natural recursion + cache results. Easy to implement, only computes needed subproblems (sparse computation). Cons: recursion overhead and stack depth risk. Use when: problem is naturally recursive, only a fraction of subproblems needed. **Bottom-up (tabulation)**: Fill DP table iteratively from base cases. No recursion overhead, better cache performance, easier space optimization. Use when: need all subproblems (or most of them), want to optimize space (can often reduce to 1D from 2D). Rule: start with top-down for correctness verification, optimize to bottom-up for performance.
</details>

**C5. Dijkstra's Algorithm: why does it fail on negative weights?**
<details><summary>Deep Answer</summary>

Dijkstra assumes: once a node is "settled" (extracted from the priority queue with its final shortest distance), that distance is optimal. With negative weights: settling node A at distance 5 might not be final — a path through B (distance 7) → C (edge -10) → A gives distance -3. But A was already settled! Dijkstra doesn't revisit settled nodes. Bellman-Ford handles negatives by relaxing ALL edges N-1 times — no "settled" assumption. For graphs with negative cycles: Bellman-Ford detects them (if distances still decrease after N-1 rounds, there's a negative cycle).
</details>

**C6. Union-Find: why is path compression + union by rank/size nearly O(1)?**
<details><summary>Deep Answer</summary>

**Path compression**: when finding the root of element x, make every node on the path point directly to the root. Flattens the tree. Future finds on those paths: O(1). **Union by rank**: always attach the smaller tree under the larger → limits tree height to O(log N). Combined: inverse Ackermann function α(N) amortized — so slow-growing it's practically constant (α(10^80) = 4). Neither alone is optimal: path compression without union by rank → O(log N) amortized. Union by rank without path compression → O(log N). Together → α(N) ≈ O(1) amortized. Used in: Kruskal's MST, cycle detection, connected components.
</details>

**C7. Binary Search on the Answer — what types of problems does it apply to?**
<details><summary>Deep Answer</summary>

When the answer space is **monotone**: "if X is achievable, then all values less extreme than X are also achievable." Problems: minimize the maximum (aggressive cows, split array), find minimum valid threshold (Koko bananas, minimum days to bloom), divide-and-conquer feasibility. Template: binary search on the answer range [lo, hi], for each mid check `isFeasible(mid)` in O(N) or O(N log N). Total: O(N log(answer_range)). Key insight: reframe "find optimal value" as "find smallest X where condition holds" → enables binary search on a non-array space.
</details>

**C8. Why does merge sort guarantee stability while quicksort doesn't?**
<details><summary>Deep Answer</summary>

**Merge sort stability**: during merge, when two elements are equal, we always take from the LEFT array first → preserves original relative order. **QuickSort instability**: the partition step swaps elements across the pivot without regard to original order. Two equal elements may be placed on opposite sides of the pivot, reversing their order. QuickSort CAN be made stable (Lomuto partition with careful implementation) but loses performance. Java uses TimSort for objects (stable), dual-pivot quicksort for primitives (stability irrelevant since primitives without fields).
</details>

**C9. Backtracking: what's the difference from plain DFS and when to use vs DP?**
<details><summary>Deep Answer</summary>

**Backtracking vs DFS**: DFS visits every path. Backtracking prunes paths early when a constraint is violated — avoids exploring infeasible branches. Same asymptotic but drastically different practical performance with good pruning. **Backtracking vs DP**: backtracking for **combinatorial/enumeration** problems (find all solutions, permutations, subsets). DP for **optimization** problems (find optimal single solution). Backtracking produces exponential solutions in worst case but is necessary when you need ALL solutions. DP finds the optimal in polynomial time when overlapping subproblems exist.
</details>

**C10. What is amortized analysis and how does it differ from average-case analysis?**
<details><summary>Deep Answer</summary>

**Amortized**: analyzes the average cost per operation over a SEQUENCE of operations — in the worst case. No probability involved. Guarantees: N operations ALWAYS take O(N·T) total, even if some individual operations are O(N·T). Example: ArrayList append is O(N) when resizing, but amortized O(1) because resizing is rare. **Average-case**: analyzes expected cost of a SINGLE operation assuming random input. QuickSort is O(N log N) average-case (random pivot). Amortized is a stronger guarantee — it holds even for adversarial input sequences.
</details>
""",

"SQL": """
## 🧠 Deep Conceptual Questions — SQL Internals & Reasoning

**C1. How does a SQL database execute a SELECT query internally?**
<details><summary>Deep Answer</summary>

1. **Parse**: SQL text → AST (syntax tree)
2. **Bind**: resolve table names, column names, types
3. **Optimize**: query planner generates candidate execution plans, estimates costs (based on statistics: row counts, column cardinality, index existence), picks cheapest
4. **Execute**: follow the plan — scan tables, apply filters, join, sort, project

The optimizer transforms: `SELECT ... WHERE ... JOIN ... ORDER BY` into an operator tree (Volcano model): TableScan → Filter → HashJoin → Sort → Project. Each operator is an iterator: `next()` pulls one row from its child. This pull-based model (lazy evaluation) avoids materializing intermediate results.
</details>

**C2. B-Tree index: why is it the default index structure in databases?**
<details><summary>Deep Answer</summary>

B-Tree (not binary tree — B stands for Balanced, not Binary): a self-balancing tree where each node can hold many keys. Properties: (1) height O(log_m N) where m=fan-out (typically 100-1000) → very short tree for millions of rows, (2) all leaf nodes at same depth → guaranteed O(log N) worst case, (3) range scans efficient — leaves linked in sequence, (4) supports equality AND range queries. Hash index: only equality (no range). Sequential scan: no index at all. B+Tree (variant): internal nodes only store keys (no values), leaves store data. All row pointers in leaves → better range scan (follow linked list of leaves).
</details>

**C3. Why does adding an index sometimes SLOW DOWN a query?**
<details><summary>Deep Answer</summary>

1. **Low cardinality**: index on a boolean column — if 50% rows have `active=true`, index gives you 50% of rows. Database may choose full table scan (cheaper: sequential I/O) over index (random I/O for 50% of rows). 
2. **Function on column**: `WHERE YEAR(created_at) = 2024` — index on `created_at` unused. Rewrite: `WHERE created_at >= '2024-01-01' AND created_at < '2025-01-01'`.
3. **Write overhead**: every INSERT/UPDATE/DELETE must update ALL indexes. 5 indexes × N rows = 5× write amplification.
4. **Index not covering**: index exists but the SELECT columns aren't in the index → each index match → separate heap fetch → many random I/O. Solution: covering index (include all needed columns in index).
</details>

**C4. EXPLAIN / query execution plan: what are the key things to look for?**
<details><summary>Deep Answer</summary>

Red flags: (1) **"Full Table Scan" / "Seq Scan"** on a large table → missing index, (2) **high "rows" estimate** in join conditions → cartesian product risk, (3) **"Using filesort"** → ORDER BY can't use index, (4) **"Using temporary"** → intermediate table materialization, (5) **nested loops on large tables** → should be hash join or merge join. Green flags: "Using index" (covering index), "ref" or "eq_ref" access type (index used). Start fixing: add or fix index on WHERE/JOIN/ORDER BY columns, rewrite function-wrapped columns.
</details>

**C5. Window functions vs GROUP BY — when must you use window functions?**
<details><summary>Deep Answer</summary>

`GROUP BY` collapses rows to one per group — individual row data is lost. Window functions compute aggregates but **keep all rows**. Use window when: (1) you need both the aggregate AND the individual row (rank each employee and show their salary), (2) running totals (each row needs sum of all prior rows — GROUP BY can't do this), (3) lag/lead access (compare each row to previous/next — GROUP BY has no row ordering concept), (4) top-N per group (ROW_NUMBER partition — classic GROUP BY can't do this cleanly). Window functions = aggregation without collapsing.
</details>

**C6. Transaction isolation levels — what anomaly does each prevent?**
<details><summary>Deep Answer</summary>

| Level | Dirty Read | Non-repeatable Read | Phantom Read |
|---|---|---|---|
| READ UNCOMMITTED | Possible | Possible | Possible |
| READ COMMITTED | ✅ Prevented | Possible | Possible |
| REPEATABLE READ | ✅ | ✅ | Possible (MySQL InnoDB: prevented!) |
| SERIALIZABLE | ✅ | ✅ | ✅ |

**Dirty read**: read uncommitted data from another transaction (which may rollback). **Non-repeatable**: same query in same transaction returns different row values (another transaction committed update). **Phantom**: same query returns different row COUNT (another transaction inserted/deleted rows). Higher isolation = fewer anomalies but more lock contention. Most production databases use READ COMMITTED or REPEATABLE READ.
</details>

**C7. N+1 query problem: what is it, why does it happen, and how to fix?**
<details><summary>Deep Answer</summary>

**What**: fetching N orders, then for each order making a separate query for the customer = 1 + N queries total. Scales terribly: 1000 orders = 1001 queries. **Why**: ORMs (Hibernate, JPA) with lazy loading — accessing a relationship triggers a new query. **Fix 1**: Eager loading — `JOIN FETCH` or `.fetch()` — load everything in one query. **Fix 2**: Batch loading — fetch all order IDs, then `WHERE customer_id IN (id1, id2, ...)` — 2 queries. **Fix 3**: Projection/DTO query — `SELECT o.id, c.name FROM orders o JOIN customers c` — 1 query. **Detection**: count DB queries in tests (Spring: `@QueryCount`), log slow query warnings.
</details>
""",

"Concurrency": """
## 🧠 Deep Conceptual Questions — Concurrency & Thread Safety

**C1. What does "happens-before" actually mean in plain terms?**
<details><summary>Deep Answer</summary>

"A happens-before B" means: all effects of A (writes to memory) are guaranteed to be visible to B. It's NOT about time ordering — A might literally execute after B in wall-clock time on a different CPU. It's about **visibility guarantees** the JMM provides through specific synchronization actions (volatile, synchronized, join, etc.). Without happens-before: the compiler and CPU are FREE to reorder operations aggressively for performance, and your threads may see stale or absent writes. The JMM doesn't promise any ordering except what's guaranteed via the HB relation.
</details>

**C2. Why does `volatile` NOT solve the `count++` problem?**
<details><summary>Deep Answer</summary>

`count++` is three operations: (1) read `count` from main memory, (2) increment in CPU register, (3) write back. `volatile` guarantees each read/write is visible (no caching). But it doesn't prevent two threads from both reading count=5 (each sees 5 via volatile), both incrementing to 6, both writing 6. Count goes 5→6 instead of 5→7. `volatile` adds visibility but no atomicity for compound operations. Solutions: `AtomicInteger.incrementAndGet()` (CAS loop — atomic at hardware level), or `synchronized` (mutual exclusion).
</details>

**C3. What is CAS (Compare-And-Swap) and why is it "lock-free"?**
<details><summary>Deep Answer</summary>

CAS: a single CPU instruction `compareAndSwap(addr, expected, newValue)`: if the value at `addr` == `expected`, atomically set it to `newValue` and return true. Otherwise return false. Lock-free: no thread is BLOCKED — if CAS fails, retry in a loop. At least ONE thread always makes progress (the one that succeeds). Contrast with locks: a failed lock acquisition blocks the thread (OS sleep: ~100μs overhead). AtomicInteger.incrementAndGet() = CAS loop: read value, compute +1, CAS. Retry if someone else changed it between read and write. Under low contention: almost always succeeds first try. Under high contention: LongAdder is better (decentralizes to per-thread cells).
</details>

**C4. Why is `synchronized` using a "monitor" — what is a monitor?**
<details><summary>Deep Answer</summary>

A monitor is a concurrency construct that combines: (1) a **mutex** (only one thread can enter at a time), (2) a **wait set** (threads can wait for a condition and be notified). In Java: every object has an intrinsic lock (monitor). `synchronized(obj)` acquires the monitor. `obj.wait()` releases the monitor and adds current thread to the wait set. `obj.notify()` picks one thread from the wait set and marks it to re-acquire the monitor. The monitor concept comes from Hoare (1974). Java's implementation: object header contains a mark word that stores the lock state (unlocked → biased locked → thin lock → fat lock with OS mutex).
</details>

**C5. What is the difference between "thread safety" and "atomicity"?**
<details><summary>Deep Answer</summary>

**Thread safety**: a class is thread-safe if it behaves correctly when accessed from multiple threads concurrently WITHOUT requiring external synchronization. **Atomicity**: an operation is atomic if it completes entirely or not at all, with no intermediate state visible to other threads. Thread safety can be achieved without per-operation atomicity — you can use locks to protect a sequence of non-atomic operations. `Vector` is thread-safe (every method synchronized) but NOT atomically composable: `if(!v.isEmpty()) v.remove(0)` is not atomic — another thread can remove between the check and the remove. Thread safety at the class level doesn't compose into thread safety at the operation sequence level.
</details>

**C6. Why is `ThreadLocal` NOT the solution for sharing context between parent and child threads?**
<details><summary>Deep Answer</summary>

`ThreadLocal` is per-thread. A new thread has NO access to its parent's ThreadLocal values. If main thread sets `requestContext.set(ctx)` then submits a task to a thread pool — the pool thread has an EMPTY ThreadLocal. Solutions: (1) `InheritableThreadLocal`: child thread inherits parent's values at creation time, but pool threads are created ONCE and reused → no re-inheritance on submission. (2) Pass context explicitly to the task constructor. (3) Use `MDCAdapter` (SLF4J's MDC): designed for this, pool-aware. (4) Project Loom's `ScopedValue` (Java 21 preview): designed to replace ThreadLocal for this exact use case.
</details>

**C7. Deadlock: what are the 4 Coffman conditions and why must ALL 4 hold simultaneously?**
<details><summary>Deep Answer</summary>

1. **Mutual Exclusion**: resource held exclusively (locks can't be shared)
2. **Hold and Wait**: thread holds resource while waiting for another
3. **No Preemption**: resources can't be forcibly taken from a thread
4. **Circular Wait**: A→B→C→A chain of waiting

These are NECESSARY conditions — ALL four must hold for deadlock to be possible (not sufficient on their own). Breaking ANY ONE prevents deadlock: eliminate mutual exclusion (lock-free algorithms), prevent hold-and-wait (acquire all locks at once), allow preemption (tryLock with timeout), prevent circular wait (global lock ordering). In practice: global lock ordering (breaking #4) is the most common and reliable prevention strategy.
</details>

**C8. What happens inside the JVM when `synchronized` is acquired?**
<details><summary>Deep Answer</summary>

JVM uses **lock escalation** based on contention: 
1. **Biased lock** (no contention): object header records the thread ID. No CAS needed — just check header. Fastest path.
2. **Thin/lightweight lock**: CAS on object header to change lock state. Stack-allocated lock record. No OS call.
3. **Heavyweight/fat lock**: when multiple threads contend. OS mutex via `pthread_mutex_lock` — expensive (~μs for context switch). Thread parked by OS.

LockSupport.park() (used by AQS and heavyweight locks) suspends the thread using OS primitives (futex on Linux). When `synchronized` is uncontested (> 95% of real-world cases): nearly free. Under contention: expensive. This is why `synchronized` in modern JVMs is much faster than pre-Java-6.
</details>
""",

"JMM": """
## 🧠 Deep Conceptual Questions — JMM, GC & JVM Internals

**C1. What is the Java Memory Model, and why does it need to exist?**
<details><summary>Deep Answer</summary>

Modern CPUs and compilers optimize aggressively: reordering instructions (both compiler and CPU), caching values in registers vs main memory (cache coherence), executing instructions out-of-order. Without rules: the same Java program could produce different results on different hardware (x86 is strongly-ordered, ARM is weakly-ordered). The JMM (JSR-133, Java 5+) defines a minimum set of **ordering guarantees** that the JVM must enforce regardless of hardware. It specifies exactly when writes from one thread become visible to another via the **happens-before** relation. Without JMM, Java would be non-portable across CPU architectures.
</details>

**C2. Why does the garbage collector need to stop your application?**
<details><summary>Deep Answer</summary>

GC must find all LIVE objects. It traces references from "roots" (stack variables, static fields). Problem: application threads are constantly changing references. If GC scans a heap while app runs: (1) app might CREATE a reference to an object GC just marked unreachable → object wrongly collected = use-after-free bug. (2) App might REMOVE the last reference to an object GC hasn't scanned yet → object missed, not collected = memory leak. Both are data races on the object graph. STW (stop-the-world) freezes all threads → consistent snapshot. ZGC's read barriers solve this differently: they intercept every object reference load and verify/update it — allows concurrent GC without freezing.
</details>

**C3. TLAB (Thread-Local Allocation Buffer) — why is heap allocation fast in Java?**
<details><summary>Deep Answer</summary>

Naive heap allocation: find free space, update free pointer (shared state) → needs synchronization → slow under concurrency. TLAB: each thread gets a private "chunk" of Eden space. Allocation = bump a local pointer (no synchronization). No contention between threads for allocation. When TLAB fills: request a new chunk from the heap (infrequent, one synchronization per chunk). Result: `new Object()` in Java ≈ 5-10 CPU instructions (pointer bump) vs C `malloc` ≈ 100-500 instructions (free list management). Java allocation is FASTER than C malloc for typical workloads.
</details>

**C4. What is escape analysis and how does it enable stack allocation and lock elision?**
<details><summary>Deep Answer</summary>

JIT compiler performs escape analysis: determines if an object "escapes" the method that creates it (is stored in a field, returned, passed to another thread). **Stack allocation**: if object doesn't escape (pure local) → allocate on the stack frame → freed automatically when method returns → zero GC pressure. **Scalar replacement**: decompose the object into individual fields on the stack. **Lock elision**: `synchronized(new Object())` — the lock object can't be shared (it's local) → the lock is provably uncontested → JIT eliminates the lock entirely. This eliminates a huge category of "defensive synchronization" patterns without sacrificing correctness.
</details>

**C5. What is a safepoint and why does JVM need one for GC?**
<details><summary>Deep Answer</summary>

A safepoint is a point in code where all threads have a consistent, well-known state — object references are unambiguous. GC needs to know exactly which memory locations hold object references (to trace the GC graph). This is only safe at safepoints. JIT-compiled code periodically inserts safepoint polls (usually at method exits and loop back-edges). When GC needs to run: JVM sets a "safepoint requested" flag → each thread checks the flag at its next poll → parks itself → when all threads reach safepoints, GC proceeds. The time for all threads to reach safepoints = "Time to Safepoint" (TTG). Long loops without safepoint polls → high TTG → delays GC → high pauses.
</details>

**C6. G1GC evacuation failure — what is it and how do you avoid it?**
<details><summary>Deep Answer</summary>

G1 works by copying live objects from "collection set" regions to free regions. **Evacuation failure**: during a collection, G1 can't find enough free regions to copy all live objects — it's out of space! G1 falls back to leaving some objects in place (mark them as "pinned"), which leaves the heap in an inconsistent state. Next step: full GC to clean up. Signs: `GC(#) To-space Exhausted` in logs. Causes: heap too full when GC triggers, allocation rate too high. Fixes: increase heap size (-Xmx), reduce allocation rate, tune G1HeapWastePercent to trigger GC earlier.
</details>

**C7. How does the JIT compiler decide to compile a method?**
<details><summary>Deep Answer</summary>

JVM starts in **interpreter mode** (executes bytecode directly, slow but avoids compilation latency). JIT compilation is **tiered**:
- **Tier 1-3** (C1): quick client compiler — basic optimization, fast startup
- **Tier 4** (C2): server compiler — aggressive deoptimization — highest performance

Compilation triggered by **invocation counters** (method call count) + **backedge counters** (loop iterations). When a method becomes "hot" (default: 10,000 invocations in C2): C2 compiles with full optimization including: inlining, escape analysis, loop unrolling, vectorization. **Deoptimization**: if assumptions made during JIT are violated (e.g., a polimorphic call site gets a new subclass), JIT reverts to interpreter. JVM dynamically profiles and re-optimizes throughout runtime — this is why JVM apps often get FASTER during a running session.
</details>
""",

"Exception": """
## 🧠 Deep Conceptual Questions — Exception Design & Error Handling

**C1. Why are checked exceptions controversial? What is the "exception tunnel" problem?**
<details><summary>Deep Answer</summary>

Checked exceptions force callers to handle or declare them — theoretically good for correctness. BUT: **exception tunnel** (aka exception leakage): a low-level `SQLException` propagates up through 5 layers of business logic, each must `throws SQLException` even if they can't handle it. Violates abstraction — business layer shouldn't know about SQL. Solution: wrap at layer boundaries: `catch(SQLException e) { throw new RepositoryException("Failed to load user", e); }`. Checked exceptions in functional interfaces (`Runnable`, `Function`, `Predicate`) don't play well together — lambdas can't throw checked exceptions. This is why most modern Java frameworks (Spring, Quarkus) use unchecked exceptions exclusively.
</details>

**C2. Whay does `catch(Exception e)` hide bugs and which exceptions does it accidentally catch?**
<details><summary>Deep Answer</summary>

`Exception` is the parent of all checked AND unchecked exceptions. Catching it can accidentally suppress: `NullPointerException` (programmer error), `ArrayIndexOutOfBoundsException` (programmer error), `ClassCastException` (programmer error), `IllegalArgumentException` (programming contract violated), `StackOverflowError` (wait, that's Error — not caught by Exception). These represent **bugs** — you should FIX them, not catch them. Catching `Exception` silently swallows real bugs, making systems appear to work while doing nothing on error. Rule: catch the most SPECIFIC exception you can handle. If you can't handle it: don't catch it at all (let it propagate).
</details>

**C3. What is the overhead of creating an exception object, and when does it matter?**
<details><summary>Deep Answer</summary>

**Stack trace capture**: when an exception is constructed (`new Exception()`), the JVM walks the call stack and captures all frames → String allocation per frame. For a 20-frame stack: ~20 String objects. Total: ~5-10μs (fast in isolation but terrible in a hot path). If you throw exceptions for **control flow** (returning null, end-of-input, validation failure in a tight loop): performance degrades severely. Mitigation: pre-created singleton exceptions for known conditions (no stack trace), or override `fillInStackTrace()` returning `this` for no-cost stack capture. Rule: exceptions are for EXCEPTIONAL conditions, not normal flow. Validation framework (returning error objects) is better than throw-for-validation.
</details>

**C4. Try-with-resources: what happens when BOTH the body AND close() throw exceptions?**
<details><summary>Deep Answer</summary>

Without try-with-resources: if body throws e1 and finally-close() throws e2, e2 propagates and e1 is **LOST** (original cause gone — debugging nightmare). Try-with-resources: the close() exception is **suppressed** — e1 propagates, e2 is attached as a `getSuppressed()` exception. Both are preserved. You can inspect: `e1.getSuppressed()` returns array of suppressed exceptions. Multiple closeable resources: closed in REVERSE order of declaration. If multiple close() calls throw: all suppressed on the first exception. This is why try-with-resources is mandatory for any `Closeable` that might throw on close (most I/O streams, DB connections, locks).
</details>

**C5. How should you handle exceptions in async/reactive code vs synchronous code?**
<details><summary>Deep Answer</summary>

**Synchronous**: exception propagates up the call stack naturally. Caller can catch. **CompletableFuture**: exception stored in the future, only surfaces on `.get()` or `.join()`. Unhandled: silently swallowed. ALWAYS add `.exceptionally()` or `.handle()`. **ExecutorService.execute()**: uncaught exception → UncaughtExceptionHandler → default: print to stderr and DIE silently. **ExecutorService.submit()**: exception stored in Future — silently swallowed unless `.get()` called. **Reactive (Reactor)**: exception is a signal on the stream — `.onErrorReturn()`, `.onErrorResume()`, `.doOnError()`. Key principle: in async code, exceptions NEVER propagate automatically — you must explicitly handle them at the async boundary.
</details>
""",

"React": """
## 🧠 Deep Conceptual Questions — React Internals & Mental Models

**C1. What is the React reconciliation algorithm and why does the `key` prop matter?**
<details><summary>Deep Answer</summary>

React maintains a virtual DOM (VNode tree). On state change: React creates a new VNode tree, diffs it against the previous tree (diffing = reconciliation), applies minimal real DOM mutations. Naive tree diff: O(N³). React's heuristics: O(N). Heuristic 1: different element types → destroy and rebuild subtree. Heuristic 2: same type → update props, recurse into children. **`key` prop**: tells React the element's identity across renders. Without keys in lists: React diffs by position — inserting at beginning is O(N) DOM mutations. With stable keys: React identifies which item moved/added/removed → O(1) per change. Keys must be stable+unique per list — using index as key breaks this when list is reordered.
</details>

**C2. Why does React use a virtual DOM? What performance problem does it solve?**
<details><summary>Deep Answer</summary>

Direct DOM manipulation is expensive: each `div.style.color = 'red'` forces layout recalculation, style recalculation, repaint — potentially 3-17ms per operation. Doing 50 direct DOM changes = 50 potential reflows. Virtual DOM batches all changes: compute the full desired state in JS (fast, ~ms), diff against current state, apply only the MINIMUM necessary DOM mutations in one batch (one reflow). Net effect: many state changes → few DOM mutations → fewer reflows. In React 18: concurrent rendering further batches setState calls across async boundaries. **Note**: React's VirtualDOM is a means to an end (batching + diffing), not inherently "fast" — SolidJS/Svelte skip it entirely with fine-grained reactivity and are faster for some use cases.
</details>

**C3. What is React's fiber architecture and how does it enable concurrent features?**
<details><summary>Deep Answer</summary>

Before Fiber (React 15): reconciliation = synchronous, non-interruptible tree walk. A complex update > 16ms → UI janks (dropped frames). **Fiber** (React 16+): reconciliation reimplemented as a linked list of "fiber nodes." Each fiber = a unit of work that can be paused, resumed, or abandoned. The render phase (building the fiber tree) is **interruptible**: React can pause after any fiber, yield to the browser for frames/user input, then resume. The commit phase (applying DOM changes) remains synchronous (can't be interrupted — DOM must be consistent). This enables: concurrent mode, `useTransition` (lower priority updates), `Suspense`, `useDeferredValue`. The fundamental shift: from "one big synchronous render" to "cooperative multitasking renderer."
</details>

**C4. useEffect dependency array: what is "stale closure" and how to fix it?**
<details><summary>Deep Answer</summary>

```jsx
const [count, setCount] = useState(0);
useEffect(() => {
  const id = setInterval(() => console.log(count), 1000); // stale closure!
  return () => clearInterval(id);
}, []); // count not in deps
```
The interval callback captures `count` from the initial render (= 0). Even after count updates, the closure still sees 0 — it's "stale." **Fix 1**: include count in deps — effect re-runs, interval recreated (wasteful). **Fix 2**: use `useRef` to store latest count. **Fix 3**: functional update `setCount(c => c + 1)` doesn't read stale count. Root cause: JavaScript closures capture variables at creation time. React's fn components close over state at render time. With stale deps, the closure never refreshes. `eslint-plugin-react-hooks` detects missing deps.
</details>

**C5. When does React batch state updates, and when does it NOT?**
<details><summary>Deep Answer</summary>

**React 17 and below**: batches only inside React event handlers. `setTimeout`, `Promise.then`, native event listeners → NOT batched (each setState triggers a re-render). **React 18**: **Automatic Batching** — batches all setState calls everywhere (timeouts, Promises, native events). Each React event handler still flushes at end. Opt-out (rare): `flushSync(() => setX(1))` → forces synchronous re-render.

Rule: in React 18, multiple setStates in ANY context = one re-render per batch. No more worrying about whether you're in a React event or not.
</details>

**C6. What is the purpose of `useReducer` and when is it better than multiple `useState`?**
<details><summary>Deep Answer</summary>

`useReducer` is `useState` for complex state transitions. Better than multiple `useState` when: (1) next state depends on multiple state values together (reducer receives full state), (2) multiple actions lead to similar state updates (consolidate logic in one place), (3) complex state objects where partial updates have side effects, (4) testing — reducer is a pure function, easily unit-testable in isolation. Think: `useState` = `useReducer(reducer, initialState)` where reducer is `(state, newValue) => newValue`. `useReducer` makes state transitions explicit and traceable (Redux-like). Redux IS just `useReducer` + Context for global sharing.
</details>
""",

"JavaScript": """
## 🧠 Deep Conceptual Questions — JavaScript Engine & Language

**C1. How does the JavaScript event loop actually work?**
<details><summary>Deep Answer</summary>

```
Call Stack → runs synchronous code
     ↓ (when empty)
Microtask Queue → Promise callbacks, queueMicrotask, MutationObserver
     ↓ (when empty)
Macrotask Queue → setTimeout, setInterval, I/O, requestAnimationFrame
```

One "tick": (1) Run all synchronous code in call stack until empty, (2) Run ALL microtasks until queue empty (even if new microtasks added!), (3) Run ONE macrotask from the macrotask queue, (4) Repeat.

Critical: microtasks drain COMPLETELY before any macrotask. A microtask that continually enqueues microtasks → infinite loop, browser freezes (no macrotasks can run). `Promise.resolve().then(...)` vs `setTimeout(fn, 0)`: Promise runs BEFORE the timeout even with a 0ms delay.
</details>

**C2. What is the prototype chain and how does `class` syntax relate to it?**
<details><summary>Deep Answer</summary>

Every JS object has an internal `[[Prototype]]` link. Property lookup: check own properties → check `[[Prototype]]` → check `[[Prototype]][[Prototype]]` → ... until null. `class` is syntactic sugar over prototype-based inheritance:
```js
class Animal { speak() {} }  // same as:
function Animal() {}
Animal.prototype.speak = function() {};
```
`class extends` sets up the prototype chain: `Dog.prototype.__proto__ = Animal.prototype`. `super` works via `[[HomeObject]]` — a hidden reference to the class where the method was defined. Key: `typeof Dog === 'function'` — classes ARE functions. `instanceof` checks the prototype chain, not the class definition.
</details>

**C3. Explain closures: why do they exist and what problems do they solve?**
<details><summary>Deep Answer</summary>

A closure = a function + references to its lexical environment (the variables in scope when the function was created). It solves: **data encapsulation without classes**. Private state in JS (pre-class): use closure.
```js
function makeCounter() {
  let count = 0; // private — inaccessible outside
  return { increment: () => ++count, get: () => count };
}
```
`count` lives on even after `makeCounter` returns because the returned object's methods close over it. Closures keep the enclosing scope alive in memory as long as any reference to them exists — the classic memory leak: `button.addEventListener('click', heavyFunction)` — even after button is removed from DOM, heavyFunction and all its closed-over variables stay in memory.
</details>

**C4. What is the difference between `==` and `===` at the engine level?**
<details><summary>Deep Answer</summary>

`===` (strict equality): checks type first — if types differ, returns false immediately. No coercion. Two objects: only true if same reference. `==` (abstract equality): if types differ, coerces using the "Abstract Equality Comparison Algorithm" (ECMAScript spec §7.2.13). Examples: `null == undefined` → true (special case). `0 == ''` → true ('' → 0). `1 == true` → true (true → 1). `[] == false` → true ([] → '' → 0, false → 0). `[] == ![]` → true (both 0). These coercions are unintuitive and context-dependent. Always use `===` unless specifically relying on null/undefined equivalence.
</details>

**C5. `this` binding: what determines `this` in JavaScript?**
<details><summary>Deep Answer</summary>

`this` is determined at CALL TIME, not at definition time (except arrow functions):
1. **new binding**: `new Foo()` — `this` = new object
2. **Explicit binding**: `foo.call(obj)` / `foo.apply(obj)` / `foo.bind(obj)` — `this` = obj
3. **Implicit binding**: `obj.foo()` — `this` = obj (the object before the dot)
4. **Default binding**: `foo()` — `this` = global (window/global) or `undefined` (strict mode)
5. **Arrow function**: no own `this` — lexically inherits from enclosing context at DEFINITION time

Priority: new > explicit > implicit > default. Arrow functions use none of these rules — they close over `this` from their lexical scope. Common trap: `obj.method` passed as callback loses its `this` binding (becomes default/undefined-in-strict-mode). Fix: `obj.method.bind(obj)` or arrow function.
</details>

**C6. What is the Temporal Dead Zone (TDZ) and why does `let` have it?**
<details><summary>Deep Answer</summary>

All declarations (`var`, `let`, `const`) are hoisted. BUT: `var` is initialized to `undefined` at hoist time. `let`/`const` are hoisted but NOT initialized — they're in the TDZ (temporal dead zone) from block start until the declaration line is reached. Accessing a `let`/`const` variable in its TDZ → `ReferenceError`. WHY it exists: `var`'s behavior (usable before declaration returns undefined) was a source of confusing bugs. TDZ makes it impossible to use a variable before you declared it — forces cleaner code. The declaration IS "seen" by the engine (hence "temporal" — it's available AFTER the declaration, just not before).
</details>

**C7. What are WeakMap and WeakSet used for, and what makes them "weak"?**
<details><summary>Deep Answer</summary>

"Weak" = the keys are weakly referenced — they don't prevent garbage collection. If the only reference to an object is a WeakMap key, the GC can collect it, and the WeakMap entry disappears automatically. Normal Map holds strong references: `map.set(node, data)` — `node` can't be GC'd as long as the map exists (memory leak if node removed from DOM). WeakMap: GC can collect `node` when it's no longer referenced elsewhere. Entry disappears. Use cases: (1) private data per instance (WeakMap as private field store), (2) caching computed data per DOM node without memory leaks, (3) tracking active objects without preventing their collection. Cannot iterate WeakMap/WeakSet (indeterminate state due to GC).
</details>
""",

"Python": """
## 🧠 Deep Conceptual Questions — Python Internals

**C1. How does Python's GIL work internally, and why hasn't it been removed?**
<details><summary>Deep Answer</summary>

GIL = a mutex in CPython's interpreter. Every Python thread must hold the GIL to execute bytecode. Released during: I/O (blocking syscalls), C extensions (NumPy, pandas release it during computation). Acquired every 100 bytecode instructions or yielded to other threads. WHY NOT REMOVED: CPython's memory management (reference counting) is not thread-safe. Without GIL: `ob_refcnt` (object reference count) must be protected by locks everywhere → massive overhead in single-threaded code. Every `del`, every function call return would need a lock. Previous removal attempts degraded single-threaded code by 30-50%. PyPy, Jython don't have GIL. CPython 3.13 enables experimental "no-GIL" mode (`python -X=nogil`) with per-object locks.
</details>

**C2. What is Python's memory model for integers and why does `is` fail for large ints?**
<details><summary>Deep Answer</summary>

CPython caches small integers (-5 to 256) as singletons. `a = 5; b = 5; a is b` → True (same object). `a = 1000; b = 1000; a is b` → False (new objects). This is CPython-specific optimization — not guaranteed by the language spec. String interning: short strings/identifiers often interned. NEVER use `is` for value comparison (use `==`). `is` tests identity (same object in memory). The integer cache exists because small ints are used everywhere; caching them saves millions of allocations in a typical program.
</details>

**C3. Generators: why are they memory-efficient and how does `yield` work internally?**
<details><summary>Deep Answer</summary>

A generator function returns a generator object. The function body doesn't execute at call time. Each `next()` call: resumes execution from the last `yield` point. Generator saves its stack frame between calls — it's a "suspended stack frame." Memory: generates values one at a time (O(1)) vs list comprehension generating all at once (O(N)). `yield from` (PEP 380): delegates to a sub-generator, chains yields through. Generators ARE the basis of `asyncio`: `async def` functions compile to coroutines which are generators under the hood. `await` ≈ `yield` to the event loop, "I'm waiting for something, run other tasks."
</details>

**C4. Decorators: what pattern underlies them and how do you preserve the wrapped function's metadata?**
<details><summary>Deep Answer</summary>

```python
@decorator
def func(): pass
# Same as: func = decorator(func)
```
Decorator = higher-order function. Problem: `@decorator` replaces `func` with wrapper — `func.__name__` becomes `"wrapper"`, `func.__doc__` is lost. Fix: `@functools.wraps(original_func)` on the wrapper copies `__name__`, `__doc__`, `__annotations__`, `__module__`. Without wraps: debugging is hell, introspection libraries break, Flask/FastAPI route registration may fail. Parameterized decorator: an outer function returning the actual decorator:
```python
def retry(n): return lambda fn: lambda *args: ... # 3 levels!
```
</details>

**C5. `asyncio`: why does `async/await` NOT use threads and how is it still concurrent?**
<details><summary>Deep Answer</summary>

`asyncio` is **cooperative multitasking** on a SINGLE thread. Event loop runs coroutines. A coroutine runs until it hits `await` — this is a VOLUNTARY yield to the event loop. Event loop picks the next ready coroutine. No preemption: if a coroutine runs CPU-bound code without awaiting, it blocks the ENTIRE event loop (other coroutines starve). Concurrency: while coroutine A awaits an HTTP response, coroutine B runs. Both "in flight" simultaneously on one thread. Why no threads: reduce context-switching overhead, simpler shared state (no locks — only one coroutine runs at a time per event loop), better for I/O-bound workloads (10,000 concurrent HTTP requests = 10,000 coroutines, not 10,000 threads).
</details>
""",

"DevOps": """
## 🧠 Deep Conceptual Questions — Networking & DevOps Internals

**C1. TCP three-way handshake: WHY three steps? Can it be done in two?**
<details><summary>Deep Answer</summary>

Two-way fails: both sides need to confirm the OTHER side can send AND receive. 
- SYN (client→server): "I want to connect, my sequence starts at X"
- SYN-ACK (server→client): "Got your SYN, my sequence starts at Y, ack=X+1"  
- ACK (client→server): "Got your SYN-ACK, ack=Y+1"

Without the third ACK: client knows server is alive, but server doesn't know the client received the SYN-ACK. If SYN-ACK lost: server has allocated resources (TCB) thinking connection established, client doesn't know. The ACK confirms the server's sequence number was received. This asymmetric confirmation requires 3 messages minimum. Four-way teardown: TCP is full-duplex — each direction closed independently, hence 4 steps.
</details>

**C2. What happens when you run `docker run`? Trace the full execution path.**
<details><summary>Deep Answer</summary>

1. **Docker CLI** parses the command, sends REST API request to Docker daemon (`/run`)
2. **Docker daemon** (dockerd) receives the request
3. If image not local: **pull from registry** (Docker Hub → HTTPS, layer downloads)
4. Daemon calls **containerd** (container runtime interface)
5. containerd calls **runc** (OCI runtime)
6. runc creates **Linux namespaces**: PID, NET, MNT, UTS, IPC, USER — isolates the process
7. runc sets up **cgroups**: limits CPU, memory, I/O
8. runc **pivot_root**: changes the filesystem root to the container's overlay filesystem
9. runc executes the entrypoint process (PID 1 in the container)
10. Container stdout/stderr connected through Docker daemon to your terminal
</details>

**C3. Why does Kubernetes use etcd and what would happen if etcd went down?**
<details><summary>Deep Answer</summary>

etcd = distributed key-value store using the Raft consensus algorithm. Stores ALL cluster state: pod specs, deployments, services, secrets, configmaps, RBAC, CRDs. Raft ensures consistency across a cluster of 3-5 etcd nodes (quorum = (N/2)+1). **If etcd goes down**: API server can't read/write state. kubectl commands fail. Scheduler can't schedule new pods. Controller manager can't reconcile state. EXISTING running pods continue running (they don't constantly check etcd — they're managed by kubelet on each node). New pods can't be scheduled. No updates possible. This is why etcd backup + restore is the most critical K8s operation.
</details>

**C4. TLS handshake: what is forward secrecy and why does it matter?**
<details><summary>Deep Answer</summary>

Without forward secrecy: if attacker records encrypted traffic now, and later compromises the server's private key, they can decrypt ALL past traffic retroactively. The server's private key decrypts the session key which decrypts the data. **Forward secrecy** (TLS 1.3 default): each session uses an **ephemeral key pair** (ECDHE). Session keys derived from ephemeral keys + DH exchange. Session key is never stored. If private key compromised later: past sessions can't be decrypted (the ephemeral keys are gone). This is why TLS 1.3 mandates forward secrecy and deprecated non-FS cipher suites. Practically: enables safer long-term data archival.
</details>

**C5. DNS propagation: why does it take "up to 48 hours"?**
<details><summary>Deep Answer</summary>

DNS uses hierarchical caching. Each DNS record has a TTL (time-to-live). When you update a DNS record, authoritative NS serves the new value immediately. But: resolvers worldwide have cached the OLD value until their cache TTL expires. TTL varies: some ISPs set their resolver cache TTL aggressively (override your TTL), some ignore TTL and cache for hours regardless. "48 hours" = worst-case TTL of most records (common: 3600s=1hr, 86400s=1day). Reduce before migration: lower TTL to 60s a week before planned change → faster propagation. After change: most resolvers pick up the new value within minutes. "48 hours" is a legacy conservative estimate.
</details>

**C6. Load balancer: what is the difference between Layer 4 and Layer 7?**
<details><summary>Deep Answer</summary>

**Layer 4 (Transport)**: routes based on TCP/UDP. Sees: IP address, port. Doesn't read HTTP content. Faster (no packet inspection, can be done in-kernel). Can't do URL-based routing, auth injection, session affinity by cookie. Examples: AWS NLB, HAProxy in TCP mode. **Layer 7 (Application)**: reads HTTP headers, URL, body. Can route `/api` to one backend, `/static` to another. Can inject headers (`X-Real-IP`), handle SSL termination, do health checks on HTTP endpoints, session affinity by cookie. More CPU-intensive (full packet inspection). Examples: NGINX, AWS ALB, Envoy. Modern microservices use L7 (Envoy/Istio) for fine-grained traffic control.
</details>
""",

"OOP": """
## 🧠 Deep Conceptual Questions — OOP, SOLID & Design Patterns

**C1. What is the difference between an interface and an abstract class — when to use each?**
<details><summary>Deep Answer</summary>

**Abstract class**: can have fields, constructors, concrete method implementations. Models IS-A with shared state and behavior. Use when: you have partial implementation to share (template method pattern). Single inheritance: if you extend an abstract class, you can't extend another. **Interface**: pure contract, no state (Java 8+: default methods allowed). Models CAN-DO / role capability. A class can implement unlimited interfaces. Use when: defining a capability across unrelated classes (`Comparable`, `Serializable`, `Runnable`). Rule: prefer interfaces for type definitions. Use abstract class when you need to share implementation code AND all subtypes share the same "IS-A" relationship. In practice: interfaces + composition > abstract class + inheritance.
</details>

**C2. Liskov Substitution Principle: what does it actually mean and how do you violate it?**
<details><summary>Deep Answer</summary>

LSP: if `S extends P`, anywhere you use `P`, you should be able to use `S` without breaking correctness. Violation example: `Square extends Rectangle`. Rectangle behavior: setWidth and setHeight are independent. Square invariant: width must equal height. `Square s = new Square(5); s.setWidth(10);` — now `s.getHeight() == 10` (Square enforced equality) but Rectangle contract says height should still be 5. Code using Rectangle is surprised. Better: Square and Rectangle as siblings under a Shape hierarchy. Another classic: override a method and throw exception for a case the parent method handled → violates LSP. Test: can you run the parent's test suite against the child and pass?
</details>

**C3. Strategy pattern vs. if-else chains: the OCP argument.**
<details><summary>Deep Answer</summary>

```java
// BAD: add new payment type = modify this method = Open for modification (violates OCP)
if(type == "credit") { } else if(type == "paypal") { } else if(type == "crypto") { }

// GOOD: add new payment = new class, zero modification of existing code
interface PaymentStrategy { void pay(int amount); }
// Add Crypto: new CryptoPayment implements PaymentStrategy — no other file touched
```
Open/Closed Principle: open for extension, closed for modification. Each `else if` = a modification to an existing method = risk of breaking existing behavior, requires re-testing the entire method. Strategy = extension by new class = old code untouched = zero regression risk. When if-else is fine: 2-3 fixed cases that never change. When strategy shines: extensible behaviors that vary at runtime.
</details>

**C4. What is the Dependency Inversion Principle and how does it enable testability?**
<details><summary>Deep Answer</summary>

DIP: high-level modules should not depend on low-level modules — both should depend on abstractions. Without DIP: `OrderService` directly creates `MySQLOrderRepository`. To test OrderService: must have MySQL running. With DIP: `OrderService` depends on `OrderRepository` interface. In production: inject `MySQLOrderRepository`. In tests: inject `MockOrderRepository`. The high-level business logic (OrderService) has zero knowledge of the database layer. This makes: unit testing trivial (mock the interface), swapping implementations easy (SQLite, PostgreSQL, in-memory), layer boundaries clear. Dependency INJECTION (DI framework like Spring) is the mechanism that enables DIP at runtime.
</details>

**C5. Observer pattern vs. Event Bus: when does one become the other?**
<details><summary>Deep Answer</summary>

**Observer**: subject holds direct references to observer objects. Subject explicitly notifies each one. Tightly coupled (subject knows about observers). Fine for: small systems, known observers at compile time. Breaks when: observers span different modules, dynamic subscription needed, observers need to be remote. **Event Bus / Message Queue**: publishers and subscribers decoupled. Publisher sends event with a TYPE to the bus. Subscribers register for event types — publisher doesn't know who's listening. De-facto standard in large systems: Spring ApplicationEventPublisher, Kafka, RabbitMQ are all event buses. Rule: Observer for in-process tightly-coupled notification. Event bus for loose coupling, cross-module, or distributed communication.
</details>
""",

"Generics": """
## 🧠 Deep Conceptual Questions — Generics & Type System

**C1. What is type erasure, what is retained at runtime, and what does it prevent?**
<details><summary>Deep Answer</summary>

At compile time: `List<String>` has full type info. At runtime: ALL generic type parameters erased → `List` (raw type). Bytecode has no `<String>`. What IS retained: annotations on type usage (via reflection with `AnnotatedType`), bounds defined in type parameters (`<T extends Comparable<T>>` — `Comparable` bound is retained as bytecode attribute). What erasure PREVENTS: (1) `new T()` (type unknown at runtime), (2) `instanceof List<String>` (compile error — can only do `instanceof List`), (3) Generic array creation `new T[10]` (array types checked at runtime, but T unknown). Reifiable types (whose complete type info is available at runtime): primitives, raw types, non-generic classes. Generic types are non-reifiable.
</details>

**C2. PECS mnemonic — derive it from first principles.**
<details><summary>Deep Answer</summary>

Why can't you `list.add(item)` to `List<? extends Number>`? The compiler doesn't know the ACTUAL type. It could be `List<Integer>`, `List<Double>`, or `List<Float>`. Adding a `Number` might violate type safety (you can't add a Double to a List<Integer>). So producer-extends = READ ONLY (safe to get as Number, unsafe to add). Why can you `list.add(item)` to `List<? super Integer>`? The actual type is guaranteed to be Integer or a supertype (Number, Object). Every Integer IS-A supertype-of-Integer → safe to add. But reading: you can only guarantee Object (could be List<Object>) → READ gives you Object. So consumer-super = WRITE ONLY (safe to add Integer, unsafe to read as anything specific). PECS: match the wildcard to what the parameter DOES with elements.
</details>

**C3. Why can't you create generic arrays? What's the workaround?**
<details><summary>Deep Answer</summary>

Generic arrays are illegal because it combines two incompatible features: (1) Array covariance: `String[] IS-A Object[]` — allowed to assign. (2) Type erasure: at runtime, `List<String>` and `List<Integer>` are both just `List`. If generic arrays were allowed: `List<String>[] array = new List<String>[10]` → at runtime it's `List[10]`. Array covariance: `Object[] obj = array` (OK). `obj[0] = new List<Integer>()` → no `ArrayStoreException` at runtime (both are List) → `array[0]` accessed as `List<String>` → ClassCastException. Workaround: `(T[]) new Object[10]` — unchecked cast warning, safe if used carefully (standard JDK approach in ArrayList, HashMap internals).
</details>
"""
}

# ─────────────────────────────────────────────────────────────────────────────
# FILE ROUTING
# ─────────────────────────────────────────────────────────────────────────────

def get_conceptual_for_file(filepath):
    name = os.path.basename(filepath).lower()
    path = filepath.lower().replace('\\', '/')

    # Already has conceptual section?
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        if MARKER in content:
            return None
        # Only add to files that have practice section (pass 1 ran on them)
        if '## 🏋️ Practice' not in content and '# 🏋️ PART 11: PRACTICE' not in content:
            return None
    except:
        return None

    if any(k in name for k in ['array', '01b_arrays', '2d_array', 'matrix', 'sliding', 'prefix_sum']):
        return CONCEPTUAL_BANKS["Arrays"]
    if any(k in name for k in ['linked', '01c_linked', 'lru']):
        return CONCEPTUAL_BANKS["LinkedList"]
    if any(k in name for k in ['stack', 'queue', '01d_stack', 'monoton']):
        return CONCEPTUAL_BANKS["Stack"]
    if any(k in name for k in ['hash', '01e_hash', 'hashtable', 'hashmap']):
        return CONCEPTUAL_BANKS["HashTable"]
    if any(k in name for k in ['tree', 'heap', '01f_tree', '16_heap', 'binary_tree', 'bst']):
        return CONCEPTUAL_BANKS["Trees"]
    if any(k in name for k in ['algorithm', 'sort', 'dynamic', 'dp_', 'greedy', 'graph', '_dp', 'backtrack']):
        return CONCEPTUAL_BANKS["Algorithms"]
    if any(k in name for k in ['sql', 'database', 'query', 'db_']):
        return CONCEPTUAL_BANKS["SQL"]
    if any(k in name for k in ['exception', 'error_handl', 'ch04_generic']):
        return CONCEPTUAL_BANKS["Exception"]
    if any(k in name for k in ['generic', 'type_system']):
        return CONCEPTUAL_BANKS["Generics"]
    if any(k in name for k in ['ch15_concurr', 'ch16_concurr', 'ch17_concurr', 'concurr', 'thread', 'synchron']):
        return CONCEPTUAL_BANKS["Concurrency"]
    if any(k in name for k in ['jmm', 'gc_deep', 'ch18', 'memory_model', 'jvm']):
        return CONCEPTUAL_BANKS["JMM"]
    if 'react' in path and '15_react' in path:
        return CONCEPTUAL_BANKS["React"]
    if '16_javascript' in path or ('javascript' in path and 'typescript' not in path):
        return CONCEPTUAL_BANKS["JavaScript"]
    if 'typescript' in path or '17_type' in path:
        return None  # TypeScript uses JS conceptual, skip duplicate
    if 'python' in path or '21_python' in path or 'asyncio' in name:
        return CONCEPTUAL_BANKS["Python"]
    if any(k in path for k in ['devops', '22_devops', 'networking', 'docker', 'kubernetes']):
        return CONCEPTUAL_BANKS["DevOps"]
    if any(k in name for k in ['oop', 'design_pattern', 'solid', 'design', 'pattern']):
        return CONCEPTUAL_BANKS["OOP"]
    if any(k in name for k in ['binary_search', 'two_pointer', 'sliding_window', 'binarysearch', 'twopointer']):
        return CONCEPTUAL_BANKS["Algorithms"]
    if any(k in name for k in ['dsa_problem', 'interview', 'pattern_recogn', 'problem_decomp']):
        return CONCEPTUAL_BANKS["Algorithms"]
    if any(k in name for k in ['react_router', 'react_test', 'react_perform', 'react_deep', 'component_pattern', 'complex_ui']):
        return CONCEPTUAL_BANKS["React"]
    if any(k in name for k in ['js_function', 'js_object', 'js_async', 'js_dom', 'js_modern', 'js_error', 'js_deep', 'browser_intern', 'web_worker']):
        return CONCEPTUAL_BANKS["JavaScript"]

    return None

SKIP_NAME_PATTERNS = [
    '00_index', '00_master', '00_textbook', '00_daily',
    'day_0', 'day_1', 'day_2', 'day_3',
    'daily_habits', '15_day_pattern', 'sprint_index',
    'ds_problem_bridges', 'pdf_coverage', 'pdf_topic',
    'diagram-audit', 'diagram-authoring',
    'add_practice', 'add_conceptual', 'replace_ascii', 'expand_array',
]

def should_skip(filepath):
    name = os.path.basename(filepath).lower()
    for pat in SKIP_NAME_PATTERNS:
        if pat in name:
            return True
    return False

def main():
    updated = 0
    skipped = 0
    no_match = 0

    for root, dirs, files in os.walk(BASE):
        dirs[:] = [d for d in dirs if not d.startswith('.') and d != '_archive']
        for file in sorted(files):
            if not file.endswith('.md'):
                continue
            filepath = os.path.join(root, file)
            if should_skip(filepath):
                skipped += 1
                continue

            questions = get_conceptual_for_file(filepath)
            if questions is None:
                no_match += 1
                continue

            try:
                with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()

                nav_markers = ['\n> **Navigation**', '\n> **Key Takeaway**', '\n> **Next**']
                appended = False
                for pat in nav_markers:
                    idx = content.rfind(pat)
                    if idx != -1:
                        new_content = content[:idx] + '\n\n---\n' + questions + '\n' + content[idx:]
                        appended = True
                        break

                if not appended:
                    new_content = content.rstrip() + '\n\n---\n' + questions + '\n'

                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)

                print(f"[OK] {os.path.relpath(filepath, BASE)}")
                updated += 1

            except Exception as e:
                print(f"[ERR] {filepath}: {e}")

    print(f"\n{'='*60}")
    print(f"  Conceptual sections added : {updated}")
    print(f"  Skipped                   : {skipped}")
    print(f"  No match / already done   : {no_match}")
    print(f"{'='*60}")

if __name__ == '__main__':
    main()
