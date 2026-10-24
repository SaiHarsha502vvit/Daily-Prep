# 13.1 Basic Operations (Easy)

> **Navigation**: [← SECTION 13: LINKED LIST PROBLEMS](01_section_13_linked_list_problems.md) | [Chapter overview](../15_LinkedList.md) | [Problem 219: Linked List Cycle ⭐ FULL… →](03_linked_list_cycle_full_solution.md)
> Page 2 of 6 in **LinkedList**


> **Pattern:** Fundamental pointer manipulation — reverse, find middle, merge, cycle detection.
> **Key insight:** Master the three templates above — they compose to solve 80% of LL problems.

---

## Problem 216: Reverse Linked List ⭐ FULL SOLUTION

**LeetCode 206** 🔗 <https://leetcode.com/problems/reverse-linked-list/>

```
PROBLEM (formal):
  Given a singly linked list L = (v₁, v₂, ..., vₙ), produce the
  reversed list L' = (vₙ, vₙ₋₁, ..., v₁) using O(1) extra space.

INPUT:  head of a singly linked list (0 ≤ n ≤ 5000, -5000 ≤ val ≤ 5000)
OUTPUT: head of the reversed list

EXAMPLES:
  [1] → [2] → [3] → [4] → [5] → null
  becomes:
  [5] → [4] → [3] → [2] → [1] → null

  Input: head = [1,2,3,4,5]  →  Output: [5,4,3,2,1]
  Input: head = [1,2]        →  Output: [2,1]
  Input: head = []           →  Output: []
```

**OBSERVATION 1:** We need to reverse each pointer: instead of vᵢ.next = vᵢ₊₁, set vᵢ.next = vᵢ₋₁. This can be done in a single pass left-to-right, maintaining `prev` and `curr`.

**OBSERVATION 2:** Before setting curr.next = prev, we must save curr.next (otherwise we lose access to the rest of the list).

**ALGORITHM (Iterative):**

```
Step 1: Initialize prev = null, curr = head
Step 2: While curr ≠ null:
          a) next = curr.next        // save next node
          b) curr.next = prev        // reverse the pointer
          c) prev = curr             // advance prev
          d) curr = next             // advance curr
Step 3: Return prev (new head)
```

**PROOF OF CORRECTNESS (Loop Invariant):**

```
Invariant: After iteration i, the first i nodes have their pointers reversed
           and prev points to node vᵢ (head of the reversed prefix).

Initialization (i=0): prev = null, no nodes processed. Trivially true.

Maintenance: At iteration i, curr = vᵢ₊₁.
  We set vᵢ₊₁.next = prev = vᵢ, making the first i+1 nodes reversed.
  We update prev = vᵢ₊₁ (new head of reversed prefix).

Termination: When curr = null, all n nodes have been processed.
  prev = vₙ = new head of the fully reversed list. ∎
```

**JAVA CODE:**

```java
// Approach 1: Iterative — O(n) time, O(1) space
public ListNode reverseList(ListNode head) {
    ListNode prev = null, curr = head;
    while (curr != null) {
        ListNode next = curr.next;
        curr.next = prev;
        prev = curr;
        curr = next;
    }
    return prev;
}

// Approach 2: Recursive — O(n) time, O(n) space (call stack)
public ListNode reverseListRecursive(ListNode head) {
    if (head == null || head.next == null) return head;
    ListNode newHead = reverseListRecursive(head.next);
    head.next.next = head;  // reverse the pointer
    head.next = null;       // break old forward link
    return newHead;
}

// Approach 3: Stack-based — O(n) time, O(n) space
public ListNode reverseListStack(ListNode head) {
    if (head == null) return null;
    Deque<ListNode> stack = new ArrayDeque<>();
    ListNode curr = head;
    while (curr != null) {
        stack.push(curr);
        curr = curr.next;
    }
    ListNode newHead = stack.pop();
    curr = newHead;
    while (!stack.isEmpty()) {
        curr.next = stack.pop();
        curr = curr.next;
    }
    curr.next = null;  // terminate the list
    return newHead;
}
```

**COMPLEXITY:**

```
Approach 1 (Iterative):
  Time:  O(n) — single pass through all n nodes
  Space: O(1) — only 3 pointer variables (prev, curr, next)

Approach 2 (Recursive):
  Time:  O(n) — n recursive calls
  Space: O(n) — recursion depth = n (one frame per node)

Approach 3 (Stack):
  Time:  O(n) — push all, pop all
  Space: O(n) — stack holds all n nodes

⟹ Approach 1 is optimal. ALWAYS use iterative in interviews.
```

**VARIANTS:**

- Reverse a sublist (LC 92) — Problem #226
- Reverse in K-groups (LC 25) — Problem #235
- Reverse alternating K-group — variation of #235

---

## Problem 217: Middle of Linked List ⭐ FULL SOLUTION

**LeetCode 876** 🔗 <https://leetcode.com/problems/middle-of-the-linked-list/>

```
PROBLEM (formal):
  Given a singly linked list L = (v₁, ..., vₙ), return v⌈n/2⌉₊₁
  (the second middle node when n is even).

INPUT:  head (1 ≤ n ≤ 100)
OUTPUT: middle node of the linked list

EXAMPLES:
  Input: [1,2,3,4,5]   → Output: node 3
  Input: [1,2,3,4,5,6] → Output: node 4 (second middle)
```

**OBSERVATION 1:** Slow/fast runner. If fast moves 2 steps per iteration and slow moves 1 step, when fast reaches the end, slow is at the midpoint.

**OBSERVATION 2 (formal):** Let n = |L|. After t iterations, slow is at position t, fast at 2t. Fast stops when 2t ≥ n, i.e., t = ⌊n/2⌋. So slow is at position ⌊n/2⌋, which is the (second) middle.

**ALGORITHM:**

```
Step 1: slow = head, fast = head
Step 2: While fast ≠ null AND fast.next ≠ null:
          slow = slow.next
          fast = fast.next.next
Step 3: Return slow
```

**PROOF OF CORRECTNESS:**

```
Let n = length of list, positions indexed from 0.

Invariant: After t iterations, slow is at position t, fast is at position 2t.

Termination cases:
  • n odd (n = 2k+1): fast stops at position 2k (fast.next = null).
    slow at position k = ⌊n/2⌋. Correct middle.
  • n even (n = 2k): fast stops at position 2k (fast = null).
    slow at position k = n/2. Second middle per problem spec. ∎
```

**JAVA CODE:**

```java
public ListNode middleNode(ListNode head) {
    ListNode slow = head, fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
    }
    return slow;
}
```

**COMPLEXITY:**

```
Time:  O(n) — fast pointer traverses at most n nodes
Space: O(1) — two pointers only

To get FIRST middle when n is even:
  Use while (fast.next != null && fast.next.next != null)
  This stops fast one step earlier.
```

**VARIANTS:**

- Delete middle node (LC 2095)
- Split list into two halves (prerequisite for LL merge sort)

---

## Problem 218: Merge Two Sorted Lists ⭐ FULL SOLUTION

**LeetCode 21** 🔗 <https://leetcode.com/problems/merge-two-sorted-lists/>

```
PROBLEM (formal):
  Given two sorted singly linked lists L₁ and L₂, produce a single
  sorted list L containing all elements from both lists.

INPUT:  heads of two sorted lists (0 ≤ n, m ≤ 50, -100 ≤ val ≤ 100)
OUTPUT: head of merged sorted list

EXAMPLES:
  L₁: [1] → [2] → [4] → null
  L₂: [1] → [3] → [4] → null
  Out: [1] → [1] → [2] → [3] → [4] → [4] → null
```

**OBSERVATION 1:** Use a dummy head to avoid special-casing which list provides the first node.

**OBSERVATION 2:** At each step, compare the heads of both lists and append the smaller one to the result. This is the merge step of merge sort.

**ALGORITHM:**

```
Step 1: Create dummy node, tail = dummy
Step 2: While l1 ≠ null AND l2 ≠ null:
          If l1.val ≤ l2.val: tail.next = l1, l1 = l1.next
          Else:                tail.next = l2, l2 = l2.next
          tail = tail.next
Step 3: tail.next = whichever list is non-null (l1 or l2)
Step 4: Return dummy.next
```

**PROOF OF CORRECTNESS (by induction on total elements processed):**

```
Claim: After processing i elements, the merged list contains the i
smallest elements from L₁ ∪ L₂ in sorted order.

Base case (i=0): Merged list is empty. Trivially sorted.

Inductive step: Assume after i elements, merged list is sorted with
  the i smallest elements. At step i+1, we compare heads of remaining
  L₁ and L₂. Both remaining lists are sorted, so their heads are the
  smallest remaining elements. We pick the smaller head, which is
  ≥ all previously appended elements (since it wasn't picked before,
  and the lists are sorted). Appending it preserves sorted order.

Termination: When one list is exhausted, the other is already sorted.
  Appending the remainder preserves the sorted invariant. ∎
```

**JAVA CODE:**

```java
public ListNode mergeTwoLists(ListNode l1, ListNode l2) {
    ListNode dummy = new ListNode(0);
    ListNode tail = dummy;

    while (l1 != null && l2 != null) {
        if (l1.val <= l2.val) {
            tail.next = l1;
            l1 = l1.next;
        } else {
            tail.next = l2;
            l2 = l2.next;
        }
        tail = tail.next;
    }

    tail.next = (l1 != null) ? l1 : l2;
    return dummy.next;
}
```

**COMPLEXITY:**

```
Time:  O(n + m) — each node visited exactly once
Space: O(1) — only pointer rewiring, no new nodes created
       (dummy node is O(1) extra)

Note: The "≤" in (l1.val <= l2.val) ensures STABILITY —
equal elements from L₁ appear before those from L₂.
```

**VARIANTS:**

- Merge K sorted lists (LC 23) — Problem #234
- Merge sorted arrays (LC 88) — different technique (in-place from end)

---

[← SECTION 13: LINKED LIST PROBLEMS](01_section_13_linked_list_problems.md) | [Chapter overview](../15_LinkedList.md) | [Problem 219: Linked List Cycle ⭐ FULL… →](03_linked_list_cycle_full_solution.md)
