# 📚 SECTION 13: LINKED LIST PROBLEMS

> **Navigation**: [Chapter overview](../15_LinkedList.md) | [13.1 Basic Operations (Easy) →](02_basic_operations_easy.md)
> Page 1 of 6 in **LinkedList**


### Linked List Patterns

**Singly Linked List**:

head → [1|•] → [2|•] → [3|•] → [4|•] → null  
val next  val next  val next  val next

**Doubly Linked List**:

null ← [•|1|•] ⇄ [•|2|•] ⇄ [•|3|•] ⇄ [•|4|•] → null  
prev val next

**Circular**:


**Three Core Techniques**:

1. Runner (slow/fast)  — cycle, middle, kth from end
2. Dummy Head          — simplify head-changing operations
3. Reverse-as-you-go   — in-place O(1) space reversal

---

## PART 0: WHY Linked List — MIT/KTH Style Deep Understanding

> 🔬 **Section Challenge — PART 0: WHY Linked List — MIT/KTH Style Deep Understanding**

**Challenge 1 (Reasoning):** The complexity table shows "Insert at head: Array O(n), LinkedList O(1)." But Java's `ArrayList.add(0, elem)` is O(n) while `LinkedList.addFirst(elem)` is O(1). Despite this, why does Java documentation recommend ArrayList for almost all use cases?

<details><summary>Answer</summary>

Cache locality dominates. ArrayList stores elements in a contiguous array — CPU cache lines prefetch consecutive memory, making sequential access ~100× faster than pointer-chasing. LinkedList nodes are scattered across the heap; every `.next` dereference is a potential cache miss (~100 CPU cycles vs ~1 cycle for cached data). For n < 1000, even O(n) shifts in ArrayList are faster than O(1) LinkedList operations due to `System.arraycopy()` being a single optimized memcpy. LinkedList also has ~40 bytes overhead per node (object header + two pointers) vs 4 bytes per element in ArrayList. **Use LinkedList only when**: (1) you need O(1) removal by reference (with an iterator), (2) LRU cache pattern (HashMap + DLL), or (3) n > 10^6 with frequent mid-list insertions.

</details>

## Why These Problems Matter

LinkedList is a FUNDAMENTAL exam topic — tests pointer manipulation,
in-place algorithms, and O(1) space thinking. Unlike arrays, you cannot
randomly access elements; every algorithm must work via sequential
traversal and pointer rewiring. This forces you to think about INVARIANTS
at every step.

**Why Interviewers Love It**:

- Pointer bugs are EASY to introduce, HARD to debug → tests carefulness
- Edge cases everywhere: empty list, single node, head changes
- O(1) space constraints force elegant in-place solutions
- Reveals whether you truly understand references vs values
  REAL-WORLD LINKED LISTS:
- LRU Cache (HashMap + Doubly Linked List)
- Blockchain (each block links to previous hash)
- File systems (FAT table — each cluster points to next)
- Undo/Redo stacks in editors (doubly linked command list)
- Memory allocators (free list of available memory blocks)

## The Three Mental Models

MODEL 1: "RUNNER TECHNIQUE" (slow/fast pointers)
Two pointers traverse the list at DIFFERENT SPEEDS.
Fast moves 2 steps, slow moves 1 step per iteration.
Applications:

- Detect cycle: if fast meets slow → cycle exists
- Find middle: when fast reaches end, slow is at middle
- Find kth from end: start fast k steps ahead, then move both
  WHY IT WORKS (formal):
  Let n = list length. After t steps: slow at position t, fast at 2t.
  When fast reaches position n: t = n/2, so slow is at n/2 (middle).
  For cycle of length c: relative speed is 1 node/step,
  so fast catches slow in at most c steps after both enter cycle.
  MODEL 2: "DUMMY HEAD" (sentinel node)
  Create a fake node before the real head:
  dummy → [real head] → [node2] → ...

**Why**: Eliminates ALL special cases where head might change.
Without dummy: if you delete head, you need if-else logic.
With dummy: just process uniformly, return dummy.next.
Use dummy when:

- Merging two lists (new head unknown until comparison)
- Removing nodes (head itself might be removed)
- Partitioning (building two sub-lists, heads unknown)
  MODEL 3: "REVERSE AS YOU GO" (in-place reversal)
  Reverse pointers one-by-one during a single traversal.
  Uses three pointers: prev, curr, next.
  Before: prev → null, curr → [1] → [2] → [3] → null
  After: null ← [1] ← [2] ← [3] ← prev, curr → null
  Loop invariant: After iteration i, the first i nodes are reversed
  and prev points to the new head of the reversed portion.

## Formal Definition (Mit / Kth Style)

A singly linked list L = (v₁, v₂, ..., vₙ) is a sequence of nodes
where each node vᵢ contains:

- vᵢ.val — the stored datum
- vᵢ.next — a pointer to vᵢ₊₁ (for i < n), with vₙ.next = null
  The list is accessed via a reference head = v₁ (or head = null if empty).

**Time Complexity Invariant**:
Accessing the i-th element requires O(i) time since there is
NO random access. Every operation that depends on position i
has a lower bound of Ω(i) comparisons/pointer traversals.

| Operation | Array | LinkedList |
| --- | --- | --- |
| Access i-th element | O(1) | O(i) |
| Insert at head | O(n) | O(1) |
| Insert at position i | O(n) | O(i) |
| Delete at head | O(n) | O(1) |
| Delete at position i | O(n) | O(i) |
| Search | O(n) | O(n) |
| Merge sort | O(n log n) | O(n log n) (a linked list can merge sort in O(1) extra space) |

> 🔬 **Section Challenge — Formal Definition (Mit / Kth Style)**

**Challenge 1 (Reasoning):** The table says "Merge sort: Array O(n lg n) time, O(n) space; LinkedList O(n lg n) time, O(1) space." Why does merge sort on a LinkedList use O(1) extra space while array merge sort requires O(n)?

<details><summary>Answer</summary>

Array merge sort needs O(n) auxiliary space because merging two sorted subarrays in-place is O(n²) — you'd need to shift elements. So you copy to a temp array, merge back. LinkedList merge is O(1) extra space because merging is just **pointer rewiring**: you walk two list halves and redirect `.next` pointers. No elements are copied or moved in memory. Similarly, splitting a linked list is O(1) after finding the midpoint (just set `mid.next = null`), while splitting an array requires copying subarrays. This is why merge sort is the _natural_ sort for linked lists, while quicksort is natural for arrays (quicksort's partition needs random access, which LL lacks).

</details>

## Decision Flowchart: Which Linked List Technique

DECISION FLOWCHART
"Find middle / cycle / kth from end?" → Runner (slow/fast)
"Reverse the list or a sublist?" → Three-pointer reversal
"Merge two sorted lists?" → Dummy head + compare
"Head might change (delete/insert)?" → Dummy head sentinel
"Copy list with random pointers?" → Interleave technique
"Merge K sorted lists?" → Min-heap of heads
"Sort a linked list?" → Merge sort (natural)
"Palindrome check?" → Find mid + reverse half
"Partition around value?" → Two dummy heads

> 🔬 **Section Challenge — Decision Flowchart: Which Linked List Technique**

**Challenge 1 (Reasoning):** The flowchart says "Palindrome check → Find mid + reverse half." But this DESTROYS the original list. In an interview, when should you restore the list, and how?

<details><summary>Answer</summary>

You should **always offer to restore** in an interview — it shows you understand the side effect. After comparing the two halves, reverse the second half again. Code: (1) Find middle with slow/fast. (2) Reverse second half. (3) Compare both halves. (4) **Reverse second half again** to restore. (5) Return result. Without restoration, any other code holding a reference to the list gets corrupted data. In production, this is a **thread-safety issue** — if another thread reads the list during palindrome check, it sees a half-reversed list. Alternative: use O(n) space with a stack (push first half, pop-and-compare second half), which avoids mutation entirely. The tradeoff: O(1) space with mutation vs O(n) space without.

</details>

## Java Code Templates

**Template 1: reverse a linked list (iterative, O(1) space)**

```java
ListNode prev = null, curr = head;
while (curr != null) {
    ListNode next = curr.next;   // save next
    curr.next = prev;            // reverse pointer
    prev = curr;                 // advance prev
    curr = next;                 // advance curr
}
return prev;                     // new head
```

**Template 2: find the middle (slow/fast runner)**

```java
ListNode slow = head, fast = head;
while (fast != null && fast.next != null) {
    slow = slow.next;
    fast = fast.next.next;
}
return slow;   // middle node (2nd middle if the length is even)
```

**Template 3: merge two sorted lists (dummy head)**

```java
ListNode dummy = new ListNode(0), tail = dummy;
while (l1 != null && l2 != null) {
    if (l1.val <= l2.val) { tail.next = l1; l1 = l1.next; }
    else                  { tail.next = l2; l2 = l2.next; }
    tail = tail.next;
}
tail.next = (l1 != null) ? l1 : l2;
return dummy.next;
```

**Node definition**

```java
class ListNode {
    int val;
    ListNode next;
    ListNode(int val) { this.val = val; }
}
```

## Difficulties & Common Mistakes

| # | Mistake | Why it hurts | Fix |
| --- | --- | --- | --- |
| 1 | Losing the reference to `head` | You traverse with `head` itself and can no longer return it | Use a separate pointer: `ListNode curr = head;` |
| 2 | Not handling a null or empty list | `NullPointerException` on single-node or empty input | Check `head == null` and `head.next == null` first |
| 3 | Forgetting to update `.next` (dangling pointer) | After moving a node, its old `.next` still points to the old location | Set `node.next = null` or the correct new target explicitly |
| 4 | Creating a cycle when relinking | Swapping pointers without breaking old links loops forever | Save `next` before rewiring; draw the pointer diagram |
| 5 | Off-by-one for "k-th from the end" | Counting from 1 or 0; moving `fast` k or k+1 times | Clarify with the interviewer (usually k = 1 is the last node); move `fast` exactly k steps, then move both until `fast == null` |
| 6 | Not using a dummy head when the head may change | Special-case `if/else` code when deleting or merging at the head | `ListNode dummy = new ListNode(0); dummy.next = head;` process uniformly, return `dummy.next` |

## Expected Outcomes

- ✅ See "reverse" → three-pointer template in 1 minute (iterative and recursive)
- ✅ See "cycle" → Floyd's slow/fast immediately; prove convergence
- ✅ See "merge sorted" → dummy head plus tail pointer without thinking
- ✅ See "kth from end" → two-pointer gap technique instantly
- ✅ See "head might change" → always reach for a dummy sentinel
- ✅ See "palindrome" → find middle, reverse the second half, compare

**The transformation**

**From:** "I keep getting null pointer errors and infinite loops."

**To:** "I draw the pointer diagram, identify which pointers change, save references before rewiring, and use dummy heads when the head might change. Every step maintains my loop invariant."


## Complexity Quick Reference

| Problem | Time | Space | Technique |
| --- | --- | --- | --- |
| Reverse List | O(n) | O(1) | Three pointers |
| Find Middle | O(n) | O(1) | Slow/fast |
| Detect Cycle | O(n) | O(1) | Floyd's |
| Merge Two Sorted | O(n+m) | O(1) | Dummy head |
| Remove Nth from End | O(n) | O(1) | Two-pointer gap |
| Add Two Numbers | O(max) | O(max) | Stack / reverse |
| Copy Random Pointer | O(n) | O(1) | Interleave 3-pass |
| Merge K Sorted | O(N lgk) | O(k) | Min-heap |
| Reverse K-Group | O(n) | O(1) | Iterative K-rev |
| Sort Linked List | O(n lgn) | O(1)_ | Bottom-up merge |

- O(1) extra space (excluding recursion stack or output)

---

[Chapter overview](../15_LinkedList.md) | [13.1 Basic Operations (Easy) →](02_basic_operations_easy.md)
