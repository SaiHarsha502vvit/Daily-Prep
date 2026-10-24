# 13.3 Advanced Operations (Hard)

> **Navigation**: [← 13.2 Pointer Manipulation (Medium)](04_pointer_manipulation_medium.md) | [Chapter overview](../15_LinkedList.md) | [13.4 Hidden Gems — Advanced Linked List →](06_hidden_gems_advanced_linked_list.md)
> Page 5 of 6 in **LinkedList**


> **Pattern:** Complex multi-step operations — merge K lists, K-group reversal, sorting.
> **Key insight:** Decompose into subproblems using the basic templates from 13.1.

---

## Problem 234: Merge K Sorted Lists ⭐ FULL SOLUTION

**LeetCode 23** 🔗 <https://leetcode.com/problems/merge-k-sorted-lists/>

```
PROBLEM (formal):
  Given k sorted linked lists L₁, L₂, ..., Lₖ with total N nodes,
  merge them into a single sorted linked list.

INPUT:  array of k list heads
OUTPUT: head of merged sorted list

EXAMPLES:
  Input: [[1,4,5],[1,3,4],[2,6]]
  Output: [1,1,2,3,4,4,5,6]
```

**OBSERVATION 1:** At each step, we need the minimum among k candidates (one from each list). A min-heap of size k gives us this in O(log k) time.

**OBSERVATION 2:** Alternative — divide and conquer: recursively merge pairs, halving the number of lists each round. log k rounds, each round processes all N nodes.

**ALGORITHM (Min-Heap):**

```
Step 1: Insert head of each non-empty list into a min-heap.
Step 2: Create dummy, tail = dummy.
Step 3: While heap is non-empty:
          node = extractMin from heap
          tail.next = node
          tail = tail.next
          if node.next ≠ null: insert node.next into heap
Step 4: Return dummy.next.
```

**PROOF OF O(N log k) COMPLEXITY:**

```
The heap contains at most k elements at any time.
Each of the N total nodes is inserted and extracted exactly once.
Each insert/extract costs O(log k).
Total: N × O(log k) = O(N log k).

Space: O(k) for the heap.
```

**JAVA CODE:**

```java
// Approach 1: Min-Heap — O(N log k) time, O(k) space
public ListNode mergeKLists(ListNode[] lists) {
    PriorityQueue<ListNode> heap = new PriorityQueue<>(
        (a, b) -> a.val - b.val
    );

    for (ListNode head : lists) {
        if (head != null) heap.offer(head);
    }

    ListNode dummy = new ListNode(0);
    ListNode tail = dummy;

    while (!heap.isEmpty()) {
        ListNode node = heap.poll();
        tail.next = node;
        tail = tail.next;
        if (node.next != null) {
            heap.offer(node.next);
        }
    }

    return dummy.next;
}

// Approach 2: Divide and Conquer — O(N log k) time, O(log k) space
public ListNode mergeKListsDC(ListNode[] lists) {
    if (lists == null || lists.length == 0) return null;
    return mergeRange(lists, 0, lists.length - 1);
}

private ListNode mergeRange(ListNode[] lists, int lo, int hi) {
    if (lo == hi) return lists[lo];
    int mid = lo + (hi - lo) / 2;
    ListNode left = mergeRange(lists, lo, mid);
    ListNode right = mergeRange(lists, mid + 1, hi);
    return mergeTwoLists(left, right);  // reuse Problem #218
}
```

**COMPLEXITY COMPARISON:**

```
Approach 1 (Heap):   Time O(N log k), Space O(k)
Approach 2 (D&C):    Time O(N log k), Space O(log k) recursion stack
Brute force (merge one by one): Time O(Nk) — much worse

Both optimal approaches achieve O(N log k). Heap is simpler to implement.
```

**VARIANTS:**

- Merge K sorted arrays
- Smallest range covering elements from K lists (LC 632)

---

## Problem 235: Reverse Nodes in K-Group ⭐ FULL SOLUTION

**LeetCode 25** 🔗 <https://leetcode.com/problems/reverse-nodes-in-k-group/>

```
PROBLEM (formal):
  Given a linked list and integer k, reverse every consecutive group
  of k nodes. If remaining nodes < k, leave them as-is.

INPUT:  head, k (1 ≤ k ≤ n)
OUTPUT: head of modified list

EXAMPLES:
  Input: [1,2,3,4,5], k=2  →  Output: [2,1,4,3,5]
  Input: [1,2,3,4,5], k=3  →  Output: [3,2,1,4,5]
```

**OBSERVATION:** Process the list in chunks of k. For each chunk: check if k nodes remain, reverse them, connect to the previous group.

**ALGORITHM:**

```
Step 1: Create dummy → head, groupPrev = dummy.
Step 2: Count if at least k nodes remain from groupPrev.next.
Step 3: If yes, reverse the next k nodes.
        Connect: groupPrev → reversed group → rest.
        Update groupPrev = tail of reversed group.
Step 4: Repeat from Step 2.
```

**JAVA CODE:**

```java
public ListNode reverseKGroup(ListNode head, int k) {
    ListNode dummy = new ListNode(0);
    dummy.next = head;
    ListNode groupPrev = dummy;

    while (true) {
        // Check if k nodes remain
        ListNode kth = groupPrev;
        for (int i = 0; i < k; i++) {
            kth = kth.next;
            if (kth == null) return dummy.next;  // fewer than k remain
        }

        ListNode groupNext = kth.next;  // node after the group

        // Reverse k nodes: groupPrev.next ... kth
        ListNode prev = groupNext, curr = groupPrev.next;
        for (int i = 0; i < k; i++) {
            ListNode next = curr.next;
            curr.next = prev;
            prev = curr;
            curr = next;
        }

        // Connect: groupPrev → reversed group head (prev = kth)
        ListNode groupFirst = groupPrev.next;  // this was first, now last
        groupPrev.next = prev;                  // prev is new group head
        groupPrev = groupFirst;                 // advance for next group
    }
}
```

**COMPLEXITY:**

```
Time:  O(n) — each node visited at most twice (once for counting, once for reversing)
Space: O(1) — in-place pointer manipulation
```

---

## Problem 236: Merge Sort for Linked List ⭐ FULL SOLUTION

**GFG** 🔗 <https://www.geeksforgeeks.org/merge-sort-for-linked-list/>

```
PROBLEM (formal):
  Sort a singly linked list in O(n log n) time using O(1) extra space.

OBSERVATION: Merge sort is NATURAL for linked lists because:
  1. Finding the middle is O(n) via slow/fast — no index needed.
  2. Merging two sorted lists is O(n) with O(1) extra space.
  3. Unlike arrays, no O(n) auxiliary array needed for merging.

  Array merge sort: O(n log n) time, O(n) space.
  LL merge sort:    O(n log n) time, O(log n) space (recursion).
  LL bottom-up:     O(n log n) time, O(1) space.
```

**ALGORITHM:**

```
Step 1: Base case — if list is empty or has one node, return it.
Step 2: Find middle using slow/fast. Split into two halves.
Step 3: Recursively sort both halves.
Step 4: Merge two sorted halves using Problem #218's merge.
```

**PROOF THAT LL MERGE SORT USES O(1) EXTRA SPACE (bottom-up):**

```
Top-down uses O(log n) stack space for recursion.
Bottom-up avoids recursion entirely:
  • Merge sublists of size 1, then 2, then 4, ..., up to n/2.
  • Each pass merges pairs of sublists in a single scan.
  • O(log n) passes, O(n) per pass = O(n log n) total.
  • Only O(1) pointers used (no recursion stack). ∎
```

**JAVA CODE:**

```java
public ListNode sortList(ListNode head) {
    if (head == null || head.next == null) return head;

    // Step 1: Find middle and split
    ListNode slow = head, fast = head.next;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
    }
    ListNode mid = slow.next;
    slow.next = null;  // split into two halves

    // Step 2: Recursively sort both halves
    ListNode left = sortList(head);
    ListNode right = sortList(mid);

    // Step 3: Merge sorted halves
    return mergeTwoLists(left, right);
}

private ListNode mergeTwoLists(ListNode l1, ListNode l2) {
    ListNode dummy = new ListNode(0), tail = dummy;
    while (l1 != null && l2 != null) {
        if (l1.val <= l2.val) { tail.next = l1; l1 = l1.next; }
        else                   { tail.next = l2; l2 = l2.next; }
        tail = tail.next;
    }
    tail.next = (l1 != null) ? l1 : l2;
    return dummy.next;
}
```

**COMPLEXITY:**

```
Time:  O(n log n) — log n levels, O(n) work per level (split + merge)
Space: O(log n) — recursion depth (top-down). O(1) for bottom-up variant.

WHY NOT QUICKSORT?
  Quicksort on LL is O(n²) worst case and partition is awkward.
  Merge sort is the standard for sorting linked lists.
```

---

## Problem 237: Flatten a Linked List

**GFG** 🔗 <https://www.geeksforgeeks.org/flattening-a-linked-list/>

```
APPROACH:
  Each node has "next" (right) and "down" pointers. The down lists are sorted.
  Merge all down-lists using the merge-two-sorted-lists technique.

  Start from the rightmost list, merge with the second-rightmost, and so on.
  This is a fold-right using merge.

TEMPLATE: Recursive merge from right to left.
```

**Complexity:** Time O(N) where N = total nodes, Space O(1) extra (excluding stack).

---

## Problem 238: First Non-Repeating Character in a Stream

**GFG** 🔗 <https://www.geeksforgeeks.org/find-first-non-repeating-character-from-a-stream-of-characters/>

```
APPROACH (DLL + HashMap):
  Maintain a Doubly Linked List of characters that have appeared exactly once.
  HashMap maps each character to its node in the DLL (or a "repeated" marker).

  For each new character c in the stream:
    If c not seen: create node, add to DLL tail, put in map.
    If c seen once: remove its node from DLL, mark as repeated in map.
    If c repeated: ignore.

  First non-repeating = DLL head. Answer each query in O(1).

TEMPLATE: DLL as ordered unique-set + HashMap for O(1) lookup.
```

**Complexity:** Time O(1) per character, Space O(alphabet size) = O(26) = O(1).

---

[← 13.2 Pointer Manipulation (Medium)](04_pointer_manipulation_medium.md) | [Chapter overview](../15_LinkedList.md) | [13.4 Hidden Gems — Advanced Linked List →](06_hidden_gems_advanced_linked_list.md)
