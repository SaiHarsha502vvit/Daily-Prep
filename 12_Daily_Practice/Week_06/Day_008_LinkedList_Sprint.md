# Day 08 - Linked List and Pointer Reasoning (Reasoning-First Notes)

## Daily Problem Set
1. LeetCode Premium: 708 - Insert into a Sorted Circular Linked List
2. LeetCode Medium: 142 - Linked List Cycle II
3. Codeforces: 1389C - Good String
4. Codeforces: 61A - Ultra-Fast Mathematician

## Problem Links
- LC 708 (Premium): Locked on LeetCode (no public official statement page)
- LC 142: https://leetcode.com/problems/linked-list-cycle-ii/
- CF 1389C: https://codeforces.com/problemset/problem/1389/C
- CF 61A: https://codeforces.com/problemset/problem/61/A

## Why This Day Matters
Linked-list interviews are about pointer invariants and safe case analysis, not fancy data structures.

---

## Problem 1 - LC 708 (Premium)

### Problem Statement
Given a node in a sorted circular linked list, insert value `insertVal` so list remains sorted circularly.

### Why This DS/Algo
- Data is already linked and circular; array conversion wastes memory and complexity.
- Correctness depends on identifying local insertion segment while traversing once around circle.

### Approach A - Brute Force (Extract + Sort + Rebuild) (O(n log n), O(n))
Educational only.

```java
class Node {
    public int val;
    public Node next;
    public Node() {}
    public Node(int _val) { val = _val; }
    public Node(int _val, Node _next) { val = _val; next = _next; }
}
```

### Approach B - Better (One pass with explicit cases) (O(n), O(1))
Insertion when either:
1) normal order interval `cur.val <= x <= cur.next.val`, or
2) turning point max->min where `x >= max` or `x <= min`.

```java
static Node insertBetter(Node head, int x) {
    if (head == null) {
        Node n = new Node(x);
        n.next = n;
        return n;
    }

    Node cur = head;
    while (true) {
        Node nxt = cur.next;
        boolean inOrder = cur.val <= x && x <= nxt.val;
        boolean atPivot = cur.val > nxt.val && (x >= cur.val || x <= nxt.val);

        if (inOrder || atPivot) {
            cur.next = new Node(x, nxt);
            return head;
        }

        cur = nxt;
        if (cur == head) {
            cur.next = new Node(x, cur.next);
            return head;
        }
    }
}
```

### Approach C - Optimal
Same O(n)/O(1) is asymptotically optimal; list traversal is unavoidable.

### Edge Cases
- Empty list.
- All values equal.
- Insert value smaller than min or larger than max.

---

## Problem 2 - LC 142: Linked List Cycle II

### Problem Statement
Return node where cycle begins, or `null` if no cycle.

### Why This DS/Algo
- Floyd's tortoise-hare uses pointer speed difference to detect cycle without extra memory.
- Mathematical property gives entry node by resetting one pointer to head.

### Approach A - Brute Force (HashSet visited nodes) (O(n), O(n))

```java
static ListNode detectCycleBrute(ListNode head) {
    Set<ListNode> seen = new HashSet<>();
    while (head != null) {
        if (!seen.add(head)) return head;
        head = head.next;
    }
    return null;
}

class ListNode {
    int val;
    ListNode next;
    ListNode(int x) { val = x; }
}
```

### Approach B - Better (Floyd detect + second pass) (O(n), O(1))

```java
static ListNode detectCycleBetter(ListNode head) {
    ListNode slow = head, fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
        if (slow == fast) {
            ListNode p1 = head, p2 = slow;
            while (p1 != p2) {
                p1 = p1.next;
                p2 = p2.next;
            }
            return p1;
        }
    }
    return null;
}
```

### Approach C - Optimal
Floyd is optimal in both time and space for this model.

### Reasoning Snapshot
If head->entry distance is `a`, meeting point offset gives relation that moving both pointers one step converges at entry.

---

## Problem 3 - CF 1389C: Good String

### Problem Statement
Delete minimum chars so resulting string is either all one digit or alternates between two digits.

### Why This DS/Algo
- Output pattern is very constrained: only 10 single-digit patterns + 90 alternating ordered pairs.
- Brute over pattern space is tiny and exact.

### Approach A - Brute Force (Enumerate all subsequences)
Exponential and infeasible.

### Approach B - Better (Try all digit pairs, greedy count) (O(100n), O(1))

```java
static int goodStringBetter(String s) {
    int n = s.length(), best = 0;

    for (char d = '0'; d <= '9'; d++) {
        int c = 0;
        for (char x : s.toCharArray()) if (x == d) c++;
        best = Math.max(best, c);
    }

    for (char a = '0'; a <= '9'; a++) {
        for (char b = '0'; b <= '9'; b++) {
            if (a == b) continue;
            int len = 0;
            char need = a;
            for (char x : s.toCharArray()) {
                if (x == need) {
                    len++;
                    need = (need == a) ? b : a;
                }
            }
            if ((len & 1) == 1) len--;
            best = Math.max(best, len);
        }
    }
    return n - best;
}
```

### Approach C - Optimal
The above is already optimal for fixed alphabet size 10.

---

## Problem 4 - CF 61A: Ultra-Fast Mathematician

### Problem Statement
Given two equal-length binary strings, output bitwise XOR as string.

### Why This DS/Algo
- Direct character comparison models XOR truth table.

### Approach A - Brute Force with Integer Conversion
Parse huge binary numbers, xor, convert back. Risky for large lengths.

### Approach B - Better (Char compare) (O(n), O(n))

```java
static String xorBetter(String a, String b) {
    StringBuilder sb = new StringBuilder(a.length());
    for (int i = 0; i < a.length(); i++) {
        sb.append(a.charAt(i) == b.charAt(i) ? '0' : '1');
    }
    return sb.toString();
}
```

### Approach C - Optimal
Char compare is already optimal.

### Pattern Takeaways
- Linked-list success comes from case partitioning and invariant proofs.
- For constrained pattern strings, exhaustive pattern enumeration beats generic DP.
