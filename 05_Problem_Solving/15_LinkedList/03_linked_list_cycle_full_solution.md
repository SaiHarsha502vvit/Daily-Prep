# Problem 219: Linked List Cycle ⭐ FULL SOLUTION

> **Navigation**: [← 13.1 Basic Operations (Easy)](02_basic_operations_easy.md) | [Chapter overview](../15_LinkedList.md) | [13.2 Pointer Manipulation (Medium) →](04_pointer_manipulation_medium.md)
> Page 3 of 6 in **LinkedList**


**LeetCode 141** 🔗 <https://leetcode.com/problems/linked-list-cycle/>

```
PROBLEM (formal):
  Given head of a singly linked list, determine if the list contains a cycle.
  A cycle exists if some node vⱼ.next = vᵢ where i ≤ j.

INPUT:  head of a singly linked list
OUTPUT: true if cycle exists, false otherwise

EXAMPLES:
  [3] → [2] → [0] → [-4] ─┐        Input: head = [3,2,0,-4], pos = 1
       ↑                     │       Output: true
       └─────────────────────┘

  [1] → [2] → null                   Input: head = [1,2], pos = -1
                                      Output: false
```

**OBSERVATION 1:** If we use two pointers at different speeds, in a cycle they MUST eventually meet (like runners on a circular track).

**OBSERVATION 2 (Floyd's Cycle Detection):** Slow moves 1 step, fast moves 2 steps. If no cycle, fast reaches null. If cycle exists, fast enters the cycle first and "laps" slow.

**ALGORITHM:**

```
Step 1: slow = head, fast = head
Step 2: While fast ≠ null AND fast.next ≠ null:
          slow = slow.next
          fast = fast.next.next
          If slow == fast: return true  (cycle detected)
Step 3: Return false  (fast reached end → no cycle)
```

**PROOF OF CORRECTNESS (Floyd's Theorem):**

```
Setup: Let the list have a "tail" of length t (before cycle entry)
and a cycle of length c.

Phase 1: Both pointers traverse the tail. After t steps, slow enters
the cycle. Fast is already in the cycle (entered after ⌈t/2⌉ steps
if t < c, or has been looping).

Phase 2: Once both are in the cycle, consider their positions mod c.
  • After each step, the gap (fast - slow) mod c increases by 1.
  • Initially the gap is some value g (0 ≤ g < c).
  • After (c - g) steps, the gap becomes 0 mod c → they meet.

Therefore: if a cycle of length c exists, fast catches slow in at
most c steps after slow enters the cycle.

Total time: O(t + c) = O(n). ∎

BONUS — Finding cycle start (LC 142):
After detection (slow == fast), reset one pointer to head.
Move both at speed 1. They meet at the cycle entry.

Why? When they first meet:
  slow traveled: t + a  (a = distance into cycle)
  fast traveled: t + a + kc  (k full loops)
  Since fast = 2 × slow: t + a + kc = 2(t + a) → kc = t + a → t = kc - a
  So moving t steps from meeting point = kc - a steps in cycle = cycle start.
  Moving t steps from head also reaches cycle start. They meet there. ∎
```

**JAVA CODE:**

```java
// Detect cycle — O(n) time, O(1) space
public boolean hasCycle(ListNode head) {
    ListNode slow = head, fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
        if (slow == fast) return true;
    }
    return false;
}

// Find cycle start (LC 142) — bonus
public ListNode detectCycle(ListNode head) {
    ListNode slow = head, fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
        if (slow == fast) {
            // Phase 2: find entry point
            ListNode entry = head;
            while (entry != slow) {
                entry = entry.next;
                slow = slow.next;
            }
            return entry;
        }
    }
    return null;  // no cycle
}
```

**COMPLEXITY:**

```
Time:  O(n) — slow traverses at most n nodes; fast catches slow within
       one cycle length after slow enters the cycle.
Space: O(1) — two pointers only.

Alternative (HashSet): O(n) time, O(n) space — store visited nodes.
Floyd's is strictly better in space.
```

**VARIANTS:**

- Find cycle start (LC 142) — shown above
- Find cycle length — after detection, count steps from meeting point back to meeting point

---

## Problem 220: Palindrome Linked List

**LeetCode 234** 🔗 <https://leetcode.com/problems/palindrome-linked-list/>

```
APPROACH:
  1. Find the middle using slow/fast runner (Template 2)
  2. Reverse the second half in-place (Template 1)
  3. Compare first half with reversed second half
  4. (Optional) Restore the list by reversing second half again

WHY THIS WORKS: A palindrome reads the same forwards and backwards.
  By reversing the second half, we can compare it element-by-element
  with the first half in O(1) space.

TEMPLATE: Runner (middle) + Reverse
```

```java
public boolean isPalindrome(ListNode head) {
    // Step 1: Find middle (first middle for even length)
    ListNode slow = head, fast = head;
    while (fast.next != null && fast.next.next != null) {
        slow = slow.next;
        fast = fast.next.next;
    }

    // Step 2: Reverse second half
    ListNode secondHalf = reverse(slow.next);

    // Step 3: Compare halves
    ListNode p1 = head, p2 = secondHalf;
    while (p2 != null) {
        if (p1.val != p2.val) return false;
        p1 = p1.next;
        p2 = p2.next;
    }
    return true;
}

private ListNode reverse(ListNode head) {
    ListNode prev = null, curr = head;
    while (curr != null) {
        ListNode next = curr.next;
        curr.next = prev;
        prev = curr;
        curr = next;
    }
    return prev;
}
```

**Complexity:** Time O(n), Space O(1).

---

## Problem 221: Remove Duplicates from Sorted List

**LeetCode 83** 🔗 <https://leetcode.com/problems/remove-duplicates-from-sorted-list/>

```
APPROACH:
  Since the list is SORTED, duplicates are adjacent.
  Traverse with pointer curr; if curr.val == curr.next.val,
  skip the next node: curr.next = curr.next.next.

TEMPLATE: Simple traversal with pointer skip.
```

```java
public ListNode deleteDuplicates(ListNode head) {
    ListNode curr = head;
    while (curr != null && curr.next != null) {
        if (curr.val == curr.next.val) {
            curr.next = curr.next.next;  // skip duplicate
        } else {
            curr = curr.next;            // advance only if no duplicate
        }
    }
    return head;
}
```

**Complexity:** Time O(n), Space O(1).

---

## Problem 222: Intersection of Two Linked Lists

**LeetCode 160** 🔗 <https://leetcode.com/problems/intersection-of-two-linked-lists/>

```
APPROACH (Length-Difference Technique):
  1. Compute lengths lenA, lenB.
  2. Advance the longer list by |lenA - lenB| steps.
  3. Move both pointers together until they meet (intersection) or reach null.

ALTERNATIVE (Elegant Two-Pass):
  Pointer a starts at headA, pointer b at headB.
  When a reaches null, redirect to headB. When b reaches null, redirect to headA.
  They will meet at the intersection after at most (lenA + lenB) steps.

  WHY: Both travel the same total distance (lenA + lenB), so any length
  difference is compensated by the redirect.

TEMPLATE: Two-pointer convergence.
```

```java
public ListNode getIntersectionNode(ListNode headA, ListNode headB) {
    ListNode a = headA, b = headB;
    while (a != b) {
        a = (a != null) ? a.next : headB;
        b = (b != null) ? b.next : headA;
    }
    return a;  // null if no intersection
}
```

**Complexity:** Time O(n + m), Space O(1).

---

## Problem 223: Delete Node (Pointer Only)

**GFG** 🔗 <https://www.geeksforgeeks.org/delete-a-given-node-in-linked-list-under-given-constraints/>

```
APPROACH:
  You are given only a pointer to the node to delete (NOT the head).
  Copy the next node's value into the current node, then delete the next node.

  node.val = node.next.val;
  node.next = node.next.next;

  Limitation: Cannot delete the LAST node this way (no next to copy from).

TEMPLATE: Value-copy trick.
```

**Complexity:** Time O(1), Space O(1).

---

## Problem 224: Convert Binary Number in Linked List to Integer

**LeetCode 1290** 🔗 <https://leetcode.com/problems/convert-binary-number-in-a-linked-list-to-integer/>

```
APPROACH:
  Traverse the list. At each node, shift the accumulated value left by 1
  and add the current bit: result = result * 2 + node.val.

  This is Horner's method for binary → decimal conversion.

TEMPLATE: Single-pass accumulation.
```

```java
public int getDecimalValue(ListNode head) {
    int result = 0;
    while (head != null) {
        result = result * 2 + head.val;
        head = head.next;
    }
    return result;
}
```

**Complexity:** Time O(n), Space O(1).

---

[← 13.1 Basic Operations (Easy)](02_basic_operations_easy.md) | [Chapter overview](../15_LinkedList.md) | [13.2 Pointer Manipulation (Medium) →](04_pointer_manipulation_medium.md)
