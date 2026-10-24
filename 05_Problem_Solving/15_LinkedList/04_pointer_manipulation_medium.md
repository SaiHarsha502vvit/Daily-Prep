# 13.2 Pointer Manipulation (Medium)

> **Navigation**: [← Problem 219: Linked List Cycle ⭐ FULL…](03_linked_list_cycle_full_solution.md) | [Chapter overview](../15_LinkedList.md) | [13.3 Advanced Operations (Hard) →](05_advanced_operations_hard.md)
> Page 4 of 6 in **LinkedList**


> **Pattern:** Multi-step pointer operations — sublist reversal, two-pointer gaps, interleaving.
> **Key insight:** Draw the pointer diagram. Save references before rewiring.

---

## Problem 225: Remove Nth Node From End of List ⭐ FULL SOLUTION

**LeetCode 19** 🔗 <https://leetcode.com/problems/remove-nth-node-from-end-of-list/>

```
PROBLEM (formal):
  Given a linked list L = (v₁, ..., vₙ), remove the node at position
  (n - k + 1) from the start, where k is the given parameter (1-indexed
  from end). Return the modified list head.

INPUT:  head, n (1 ≤ n ≤ size of list)
OUTPUT: head of modified list

EXAMPLES:
  Input: [1,2,3,4,5], n = 2  →  Output: [1,2,3,5]  (removed 4)
  Input: [1], n = 1           →  Output: []           (removed head)
```

**OBSERVATION 1:** Two-pointer gap technique: if fast is n steps ahead of slow, when fast reaches null, slow is at the node BEFORE the one to delete.

**OBSERVATION 2:** Use a dummy head because the head itself might be the node to remove (e.g., single-node list with n=1).

**ALGORITHM:**

```
Step 1: Create dummy → head. Set fast = dummy, slow = dummy.
Step 2: Advance fast by (n + 1) steps.
Step 3: Move both fast and slow together until fast = null.
Step 4: slow.next = slow.next.next  (skip the target node)
Step 5: Return dummy.next
```

**PROOF OF CORRECTNESS:**

```
After Step 2, fast is (n+1) positions ahead of slow (both starting from dummy).
The total positions from dummy to null is (size + 1).

When fast reaches null (after size + 1 - (n + 1) = size - n more steps),
slow is at position (size - n) from dummy, i.e., position (size - n - 1)
in the original list (0-indexed).

This is exactly the node BEFORE the (n-th from end) node.
Setting slow.next = slow.next.next removes the target. ∎
```

**JAVA CODE:**

```java
public ListNode removeNthFromEnd(ListNode head, int n) {
    ListNode dummy = new ListNode(0);
    dummy.next = head;
    ListNode fast = dummy, slow = dummy;

    // Move fast n+1 steps ahead
    for (int i = 0; i <= n; i++) {
        fast = fast.next;
    }

    // Move both until fast reaches null
    while (fast != null) {
        fast = fast.next;
        slow = slow.next;
    }

    // Remove the nth node from end
    slow.next = slow.next.next;
    return dummy.next;
}
```

**COMPLEXITY:**

```
Time:  O(L) where L = length of list — single pass
Space: O(1) — three pointers + dummy node
```

**VARIANTS:**

- Remove nth from end of doubly linked list
- Return removed node's value

---

## Problem 226: Reverse Linked List II ⭐ FULL SOLUTION

**LeetCode 92** 🔗 <https://leetcode.com/problems/reverse-linked-list-ii/>

```
PROBLEM (formal):
  Given a linked list and positions left, right (1-indexed), reverse
  only the sublist from position left to right inclusive.

INPUT:  head, left, right (1 ≤ left ≤ right ≤ n)
OUTPUT: head of modified list

EXAMPLES:
  Input: [1,2,3,4,5], left=2, right=4
  Output: [1,4,3,2,5]
       Before: 1 → 2 → 3 → 4 → 5
       After:  1 → 4 → 3 → 2 → 5
```

**OBSERVATION 1:** Navigate to position (left - 1) — the node just before the reversal zone. Then reverse exactly (right - left + 1) nodes.

**OBSERVATION 2:** Use dummy head since left=1 means the head changes.

**ALGORITHM:**

```
Step 1: Create dummy → head. Navigate prev to position (left - 1).
Step 2: curr = prev.next (first node in reversal zone).
Step 3: For i = 0 to (right - left - 1):
          Move curr.next to just after prev (front-insertion).
Step 4: Return dummy.next.
```

**JAVA CODE:**

```java
public ListNode reverseBetween(ListNode head, int left, int right) {
    ListNode dummy = new ListNode(0);
    dummy.next = head;
    ListNode prev = dummy;

    // Move prev to position just before 'left'
    for (int i = 1; i < left; i++) {
        prev = prev.next;
    }

    ListNode curr = prev.next;  // first node in reversal zone

    // Reverse by front-inserting nodes
    for (int i = 0; i < right - left; i++) {
        ListNode nodeToMove = curr.next;
        curr.next = nodeToMove.next;     // detach nodeToMove
        nodeToMove.next = prev.next;     // insert after prev
        prev.next = nodeToMove;          // update prev's link
    }

    return dummy.next;
}
```

**COMPLEXITY:**

```
Time:  O(n) — at most one full traversal
Space: O(1) — in-place pointer rewiring
```

**VARIANTS:**

- Reverse K-group (LC 25) — Problem #235
- Reverse alternating K nodes

---

## Problem 227: Add Two Numbers II ⭐ FULL SOLUTION

**LeetCode 445** 🔗 <https://leetcode.com/problems/add-two-numbers-ii/>

```
PROBLEM (formal):
  Two non-empty linked lists represent two non-negative integers.
  Most significant digit comes first. Add the two numbers and return
  the sum as a linked list.

INPUT:  heads of two lists (no leading zeros except the number 0)
OUTPUT: head of sum list

EXAMPLES:
  l1: [7] → [2] → [4] → [3]     (represents 7243)
  l2:      [5] → [6] → [4]      (represents 564)
  out: [7] → [8] → [0] → [7]    (7243 + 564 = 7807)
```

**OBSERVATION 1:** Digits are stored most-significant first, but addition starts from least-significant. Use stacks to reverse the processing order without modifying the original lists.

**OBSERVATION 2:** Process digit-by-digit with carry, building the result by prepending (to get MSB-first output).

**ALGORITHM:**

```
Step 1: Push all digits of l1 onto stack1, l2 onto stack2.
Step 2: Initialize carry = 0, head = null.
Step 3: While stack1 or stack2 non-empty or carry > 0:
          sum = carry + (pop stack1 if non-empty) + (pop stack2 if non-empty)
          carry = sum / 10
          Create node with val = sum % 10, node.next = head, head = node
Step 4: Return head.
```

**JAVA CODE:**

```java
public ListNode addTwoNumbers(ListNode l1, ListNode l2) {
    Deque<Integer> s1 = new ArrayDeque<>(), s2 = new ArrayDeque<>();

    while (l1 != null) { s1.push(l1.val); l1 = l1.next; }
    while (l2 != null) { s2.push(l2.val); l2 = l2.next; }

    int carry = 0;
    ListNode head = null;

    while (!s1.isEmpty() || !s2.isEmpty() || carry > 0) {
        int sum = carry;
        if (!s1.isEmpty()) sum += s1.pop();
        if (!s2.isEmpty()) sum += s2.pop();

        carry = sum / 10;
        ListNode node = new ListNode(sum % 10);
        node.next = head;
        head = node;  // prepend
    }

    return head;
}
```

**COMPLEXITY:**

```
Time:  O(n + m) — push all digits, then process all
Space: O(n + m) — two stacks

Alternative O(1) space: reverse both lists, add like LC 2, reverse result.
```

---

## Problem 228: Copy List with Random Pointer ⭐ FULL SOLUTION

**LeetCode 138** 🔗 <https://leetcode.com/problems/copy-list-with-random-pointer/>

```
PROBLEM (formal):
  Given a linked list where each node has a next pointer and a random
  pointer (which can point to any node or null), construct a deep copy.

INPUT:  head of list with random pointers
OUTPUT: head of deep copy (new nodes, same structure)

APPROACH: 3-pass interleaving technique (O(1) extra space, excluding output)
```

**OBSERVATION 1:** The challenge is mapping old random pointers to new nodes. HashMap works but uses O(n) space.

**OBSERVATION 2:** Interleave technique: insert clone of each node right after the original. Then random pointers can be set using clone.random = original.random.next. Finally, separate the two lists.

**ALGORITHM:**

```
Pass 1 — Interleave: For each node A, insert A' (clone) after A.
  A → B → C  becomes  A → A' → B → B' → C → C'

Pass 2 — Set random: For each original node A:
  A'.random = A.random.next  (A.random.next is the clone of A.random)

Pass 3 — Separate: Extract cloned nodes into their own list.
  Restore original list.
```

**JAVA CODE:**

```java
public Node copyRandomList(Node head) {
    if (head == null) return null;

    // Pass 1: Interleave clones
    Node curr = head;
    while (curr != null) {
        Node clone = new Node(curr.val);
        clone.next = curr.next;
        curr.next = clone;
        curr = clone.next;
    }

    // Pass 2: Set random pointers for clones
    curr = head;
    while (curr != null) {
        if (curr.random != null) {
            curr.next.random = curr.random.next;
        }
        curr = curr.next.next;
    }

    // Pass 3: Separate the two lists
    Node cloneHead = head.next;
    curr = head;
    Node cloneCurr = cloneHead;
    while (curr != null) {
        curr.next = curr.next.next;
        cloneCurr.next = (cloneCurr.next != null) ? cloneCurr.next.next : null;
        curr = curr.next;
        cloneCurr = cloneCurr.next;
    }

    return cloneHead;
}
```

**COMPLEXITY:**

```
Time:  O(n) — three passes, each O(n)
Space: O(1) extra (cloned nodes are part of the output, not extra space)

Alternative (HashMap): O(n) time, O(n) space — map original → clone
```

---

## Problem 229: Partition List

**LeetCode 86** 🔗 <https://leetcode.com/problems/partition-list/>

```
APPROACH:
  Create two dummy heads: "less" and "greaterOrEqual."
  Traverse original list; append each node to the appropriate sub-list.
  Connect less.tail → greaterOrEqual.head. Set greaterOrEqual.tail.next = null.

TEMPLATE: Two dummy heads + single pass.
```

```java
public ListNode partition(ListNode head, int x) {
    ListNode lessD = new ListNode(0), greatD = new ListNode(0);
    ListNode less = lessD, great = greatD;
    while (head != null) {
        if (head.val < x) { less.next = head; less = less.next; }
        else               { great.next = head; great = great.next; }
        head = head.next;
    }
    great.next = null;         // terminate greater list
    less.next = greatD.next;   // connect less → greater
    return lessD.next;
}
```

**Complexity:** Time O(n), Space O(1).

---

## Problem 230: Flatten a Multilevel Doubly Linked List

**LeetCode 430** 🔗 <https://leetcode.com/problems/flatten-a-multilevel-doubly-linked-list/>

```
APPROACH:
  When encountering a node with a child:
  1. Save node.next as "tail."
  2. Set node.next = child, child.prev = node, node.child = null.
  3. Traverse to end of child list, connect to tail.

  Use DFS (iterative with stack, or recursion).
  Stack approach: push next, then push child → DFS order.

TEMPLATE: DFS flattening.
```

**Complexity:** Time O(n), Space O(depth) for recursion stack.

---

## Problem 231: Remove Duplicates from Sorted List II

**LeetCode 82** 🔗 <https://leetcode.com/problems/remove-duplicates-from-sorted-list-ii/>

```
APPROACH:
  Use dummy head (head might be removed).
  prev = dummy. While curr and curr.next exist:
    If curr.val == curr.next.val:
      Skip ALL nodes with that value.
      prev.next = first node with different value.
    Else:
      prev = curr, curr = curr.next.

TEMPLATE: Dummy head + skip-all-duplicates.
```

```java
public ListNode deleteDuplicates(ListNode head) {
    ListNode dummy = new ListNode(0);
    dummy.next = head;
    ListNode prev = dummy, curr = head;
    while (curr != null) {
        while (curr.next != null && curr.val == curr.next.val) {
            curr = curr.next;  // skip all duplicates
        }
        if (prev.next == curr) {
            prev = curr;       // no duplicates, advance prev
        } else {
            prev.next = curr.next;  // skip entire duplicate group
        }
        curr = curr.next;
    }
    return dummy.next;
}
```

**Complexity:** Time O(n), Space O(1).

---

## Problem 232: Segregate Even and Odd Nodes

**GFG** 🔗 <https://www.geeksforgeeks.org/segregate-even-and-odd-elements-in-a-linked-list/>

```
APPROACH:
  Same as Partition List (#229): two dummy heads for even and odd.
  Traverse and distribute, then connect even → odd.

TEMPLATE: Two dummy heads.
```

**Complexity:** Time O(n), Space O(1).

---

## Problem 233: Sort a Linked List of 0s, 1s, and 2s

**GFG** 🔗 <https://www.geeksforgeeks.org/sort-a-linked-list-of-0s-1s-and-2s/>

```
APPROACH (Dutch National Flag adaptation):
  Create three dummy heads: zeroD, oneD, twoD.
  Traverse list; append each node to the corresponding sub-list.
  Connect: zero.tail → one.head → two.head. Set two.tail.next = null.

  This is an adaptation of the Dutch National Flag algorithm for arrays,
  but adapted to linked lists with O(1) space pointer manipulation.

TEMPLATE: Three dummy heads + single pass.
```

**Complexity:** Time O(n), Space O(1).

---

> 🔬 **Section Challenge — 13.2 Pointer Manipulation (Medium)**

**Challenge 1 (Reasoning):** In "Copy List with Random Pointer" (LC 138), the interleave approach uses 3 passes and O(1) extra space, while the HashMap approach uses 1 pass and O(n) space. The interleave approach modifies the ORIGINAL list. Why is this dangerous in production code?

<details><summary>Answer</summary>

The interleave approach inserts clone nodes INTO the original list: `A → A' → B → B' → C → C'`. During pass 2 (setting random pointers) and pass 3 (separating lists), the original list is in a **corrupted state**. If another thread reads the list concurrently, or if an exception occurs mid-operation, the original list is permanently damaged. In production, the HashMap approach is safer: it never touches the original list. The O(n) space is negligible for most applications. The interleave approach is an **interview trick** that demonstrates pointer manipulation mastery, but real codebases use the HashMap version (or `clone()` with deep copy). **Use interleave only when**: O(1) space is a hard constraint AND you own exclusive access to the list.

</details>

---

[← Problem 219: Linked List Cycle ⭐ FULL…](03_linked_list_cycle_full_solution.md) | [Chapter overview](../15_LinkedList.md) | [13.3 Advanced Operations (Hard) →](05_advanced_operations_hard.md)
