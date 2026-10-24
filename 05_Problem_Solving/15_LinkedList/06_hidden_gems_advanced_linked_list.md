# 13.4 Hidden Gems — Advanced Linked List

> **Navigation**: [← 13.3 Advanced Operations (Hard)](05_advanced_operations_hard.md) | [Chapter overview](../15_LinkedList.md)
> Page 6 of 6 in **LinkedList**


> **Pattern:** Uncommon but highly testable problems — circular lists, reservoir sampling, DLL tricks.

---

## Problem 239: Josephus Circle

```
APPROACH (Circular Linked List):
  N people in a circle, eliminate every k-th person.
  Build a circular linked list of N nodes.
  Traverse k-1 steps from current, delete the k-th node.
  Repeat until one person remains.

  Mathematical solution: J(n,k) = (J(n-1,k) + k) mod n, with J(1,k) = 0.

TEMPLATE: Circular LL traversal + deletion.
```

**Complexity:** Time O(nk) for simulation, O(n) for mathematical recurrence, Space O(n) for list / O(1) for math.

---

## Problem 240: Triplet from Three Linked Lists with Given Sum

```
APPROACH:
  Three sorted linked lists. Find a triplet (a, b, c) with a + b + c = target.
  Fix a from list1, then use two-pointer on list2 (forward) and list3 (backward).
  Since list3 is singly linked, sort it in reverse or use a stack for backward traversal.

  Alternative: Use hash set for list3 values. For each pair (a, b), check if
  (target - a - b) exists in the set.

TEMPLATE: Three-pointer / hash set.
```

**Complexity:** Time O(n₁ × n₂) with hash set, Space O(n₃).

---

## Problem 241: Linked List Random Node (Reservoir Sampling)

**LeetCode 382** 🔗 <https://leetcode.com/problems/linked-list-random-node/>

```
APPROACH (Reservoir Sampling):
  Without knowing the list length, select a uniformly random node:
  1. Start with result = head.val, i = 1.
  2. For each subsequent node, generate random int in [0, i).
     If rand == 0, update result = current.val.
  3. Increment i, advance to next.

  Proof: At step i, P(selecting node i) = 1/i.
  P(node i still selected at end) = (1/i) × ∏ⱼ₌ᵢ₊₁ⁿ (1 - 1/j) = 1/n.

TEMPLATE: Reservoir sampling (k=1).
```

```java
class Solution {
    ListNode head;
    Random rand;

    public Solution(ListNode head) {
        this.head = head;
        this.rand = new Random();
    }

    public int getRandom() {
        ListNode curr = head;
        int result = curr.val;
        int i = 1;
        while (curr != null) {
            if (rand.nextInt(i) == 0) {
                result = curr.val;
            }
            i++;
            curr = curr.next;
        }
        return result;
    }
}
```

**Complexity:** Time O(n) per call, Space O(1).

---

## Problem 242: Pair with Given Sum in Sorted Doubly Linked List

```
APPROACH:
  Since the DLL is sorted, use two pointers:
  left = head (smallest), right = tail (largest).

  While left != right and they haven't crossed:
    sum = left.val + right.val
    If sum == target:  found! move both (or collect and continue).
    If sum < target:   left = left.next (increase sum).
    If sum > target:   right = right.prev (decrease sum).

  This is the two-pointer technique, but using DLL's prev pointer
  instead of array indexing. Works because the DLL is sorted.

TEMPLATE: Two-pointer on sorted DLL.
```

**Complexity:** Time O(n), Space O(1).

---

> 🔬 **Section Challenge — 13.4 Hidden Gems — Advanced Linked List**

**Challenge 1 (Trace — Reservoir Sampling):** A linked list has nodes `[5, 3, 8, 1]`. Trace `getRandom()` step by step. At which step does the algorithm decide to keep `8`, and what is the mathematical probability that `8` ends up as the final result?

<details><summary>Answer</summary>

**Who executes?** A single-threaded scan from `head`. **When?** At each node `i`, `rand.nextInt(i)` is sampled. **What already exists?** `result=5, i=1` at start.

Step 1 (node=5, i=1): `nextInt(1)=0` always → `result=5`, i→2. Step 2 (node=3, i=2): if `rand=0` (prob 1/2) → `result=3`. Step 3 (node=8, i=3): if `rand=0` (prob 1/3) → `result=8`. Step 4 (node=1, i=4): if `rand=0` (prob 1/4) → `result=1`.

**P(8 is final result)** = P(selected at step 3) × P(NOT overridden at step 4) = (1/3) × (3/4) = **1/4 = 1/n**. Every node has exactly 1/n probability. This proves uniform distribution across unknown-length streams.

</details>

**Challenge 2 (Design — Who/When/What):** In "First Non-Repeating Character in a Stream," when a duplicate character `c` arrives — **Who** performs the DLL node removal? **When** does it happen? **What must already exist** in the HashMap for O(1) deletion to be possible, and why does a SLL break this guarantee?

<details><summary>Answer</summary>

**Who?** The current thread processing the stream event. **When?** Synchronously, immediately on receiving duplicate `c`, before the next character. **What already exists?** The HashMap MUST contain `c → direct DLL node pointer`. This direct reference is the entire pre-condition. With it: `node.prev.next = node.next; node.next.prev = node.prev` — O(1) deletion. Without it, you'd scan the DLL from head to find `c` — O(alphabet size) = O(26) = O(1) here, but conceptually O(n) in general. A SLL breaks this because `node.prev` doesn't exist — you'd need to track the predecessor separately, adding O(1) overhead per character but making the code significantly more fragile. After removal, mark `map.put(c, null)` to ignore future occurrences. DLL head = current first non-repeating answer in O(1).

</details>

## 🏆 MASTERY CHECKLIST

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ✅ LINKED LIST MASTERY — TRACK YOUR PROGRESS                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ FUNDAMENTALS:                                                                │
│ - [ ] Can reverse a linked list in your sleep (iterative + recursive)        │
│ - [ ] Can detect and find cycle start (prove Floyd's theorem)                │
│ - [ ] Can find the middle using slow/fast runner                             │
│ - [ ] Can merge two sorted lists with dummy head                             │
│ - [ ] Can remove nth from end using two-pointer gap                          │
│                                                                              │
│ INTERMEDIATE:                                                                │
│ - [ ] Can reverse a sublist (positions left to right)                        │
│ - [ ] Can copy a list with random pointers (3-pass interleave)               │
│ - [ ] Can partition a list around a value (two dummy heads)                  │
│ - [ ] Can add two numbers represented as linked lists                        │
│                                                                              │
│ ADVANCED:                                                                    │
│ - [ ] Can merge K sorted lists using min-heap                                │
│ - [ ] Can handle K-group reversal operations                                 │
│ - [ ] Understand when LL merge sort beats array merge sort                   │
│ - [ ] Can explain reservoir sampling for random node selection               │
│                                                                              │
│ PROOF & THEORY:                                                              │
│ - [ ] Can state and prove the loop invariant for iterative reversal          │
│ - [ ] Can prove Floyd's cycle detection theorem                              │
│ - [ ] Can derive O(N log k) for merge-K-sorted-lists                         │
│ - [ ] Can explain why merge sort is natural for linked lists                 │
│                                                                              │
│ SPEED TARGETS:                                                               │
│ ┌───────────────────────────┬────────────┐                                   │
│ │ Problem                   │ Target     │                                   │
│ ├───────────────────────────┼────────────┤                                   │
│ │ Reverse LL (iterative)    │ < 2 min    │                                   │
│ │ Detect Cycle (Floyd's)    │ < 3 min    │                                   │
│ │ Merge Two Sorted          │ < 3 min    │                                   │
│ │ Remove Nth from End       │ < 4 min    │                                   │
│ │ Reverse K-Group           │ < 8 min    │                                   │
│ │ Merge K Sorted            │ < 8 min    │                                   │
│ └───────────────────────────┴────────────┘                                   │
└──────────────────────────────────────────────────────────────────────────────┘
```

---


---

---

## 🏆 Competitive Programming — Codeforces Problems

| Problem                    | Link                                                         | Technique                  | Difficulty  |
| -------------------------- | ------------------------------------------------------------ | -------------------------- | ----------- |
| Linked List & Two Pointers | [CF 817C](https://codeforces.com/problemset/problem/817/C)   | Fast & Slow on data stream | ⭐⭐ Medium |
| IQ Test                    | [CF 25A](https://codeforces.com/problemset/problem/25/A)     | Linked list traversal      | ⭐ Easy     |
| Coloring Trees             | [CF 711C](https://codeforces.com/problemset/problem/711/C)   | DP on linked sequence      | ⭐⭐ Medium |
| K-th Symbol                | [CF 1201C](https://codeforces.com/problemset/problem/1201/C) | Recursive + pointer logic  | ⭐⭐ Medium |

---

> 🔬 **Section Challenge — 🏆 Competitive Programming — Codeforces Problems**

**Challenge 1 (Reasoning):** The Codeforces table includes "DP on linked sequence." How is DP on a linked list fundamentally different from DP on an array? What changes in the state transition?

<details><summary>Answer</summary>

In array DP, you access `dp[i-1]`, `dp[i-2]`, etc. in O(1) via random access. In linked list DP, accessing node `i-2` from node `i` requires either: (1) maintaining extra pointers (e.g., `prevPrev`), or (2) converting to an array first. The state transition is the same mathematically, but the **implementation** must carry forward previous states explicitly. For example, House Robber on a linked list: you can't do `dp[i] = max(dp[i-1], dp[i-2] + val[i])` because there's no `dp[i-2]` pointer. Instead, carry two variables: `prevMax` and `prevPrevMax`, updating in O(1) space. This is why most DP-on-LL problems are solved by converting to array first — the O(n) space is worth the O(1) random access.

</details>

## 🌍 Real-World Applications of Linked Lists

| Technique                     | Real-World System                | How It's Used                                                          |
| ----------------------------- | -------------------------------- | ---------------------------------------------------------------------- |
| **Doubly Linked List**        | Browser history (Chrome/Firefox) | Back/Forward = prev/next pointers, eviction of old entries             |
| **HashMap + DLL (LRU Cache)** | Redis, OS Page Cache, CPU Cache  | Get O(1) + evict LRU entry O(1) simultaneously                         |
| **Circular Linked List**      | CPU Round-Robin Scheduling       | Each process node points to next; cycle never ends                     |
| **Skip List**                 | Redis Sorted Sets                | Multi-level linked list gives O(log n) search without tree rebalancing |
| **Singly Linked List**        | Memory allocator free list       | OS/JVM free heap blocks chained as linked list                         |

```
🔥 LRU CACHE = most common system design interview:
   HashMap + Doubly Linked List
   → get() in O(1): use HashMap to find node, move to head
   → evict() in O(1): remove tail node, delete from HashMap
   "This is what Redis does for all key eviction policies."
```

---

---

> 🔬 **Section Challenge — 🌍 Real-World Applications of Linked Lists**

**Challenge 1 (Reasoning):** The LRU Cache uses HashMap + Doubly Linked List for O(1) get and O(1) eviction. Why can't you achieve this with HashMap + Singly Linked List? What specific operation breaks?

<details><summary>Answer</summary>

Eviction requires removing the TAIL node and also updating the node BEFORE the tail to become the new tail. In a DLL, the tail's `.prev` pointer gives O(1) access to the predecessor. In a SLL, finding the predecessor of the tail requires O(n) traversal from the head — because you have no `.prev` pointer. So `evict()` becomes O(n), defeating the entire purpose. The `get()` operation also breaks: when you access a node, you need to move it to the head (most recently used). Moving requires: (1) detaching the node from its current position (need to update predecessor's `.next`), and (2) inserting at head. Step 1 is O(n) in SLL because you can't find the predecessor. DLL gives O(1) for both operations. **This is why LRU Cache is the canonical example of why DLL exists.**

</details>

---

### Historical Evolution

Linked lists were introduced by Newell, Shaw and Simon in the 1955–56 Information Processing Language (IPL) for artificial-intelligence work, and McCarthy's LISP (1958) built the language around `cons` cells. Floyd's cycle-finding algorithm (1960s, recorded by Knuth) and Brent's faster variant (1980) are the standard cycle detectors; Knuth's *TAOCP* Vol. 1 (1968) gives the classic treatment of linked allocation.

- **IPL — 1955–56**: First list-processing language
- **LISP — 1958**: `cons` cells and recursion on lists
- **Floyd — 1960s**: Tortoise and hare
- **Brent — 1980**: Faster cycle detection

---

[← 13.3 Advanced Operations (Hard)](05_advanced_operations_hard.md) | [Chapter overview](../15_LinkedList.md)
