> **Navigation**: [< Previous Chapter](01b_Arrays.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next Chapter >](01d_Stack_Queue.md)

---

# PART 3: LINKED LIST

## PART 0: COMPLETE UNDERSTANDING — The WHY Before the WHAT

### What Problem Does a Linked List Solve?

```
THE FUNDAMENTAL PROBLEM:
Arrays are RIGID. Once created, they sit in one contiguous memory block.
If you want to insert at the beginning → shift EVERYTHING right → O(n)
If the array is full → allocate bigger array, copy everything → O(n)

LINKED LISTS exist because sometimes you need:
  ✅ Frequent insertions/deletions (especially at front/middle)
  ✅ Unknown size that grows/shrinks dynamically
  ✅ No need for random access (i.e., you process sequentially)
  ✅ Building other structures (stacks, queues, graphs, hash chains)
```

### Who Invented It and Why?

```
1955-1956: Allen Newell, Cliff Shaw, Herbert Simon at RAND Corporation
They needed to represent "thoughts" in an AI program called Logic Theorist.
Thoughts connect to other thoughts → not a flat list → LINKED STRUCTURE.

The concept: each piece of data carries a "pointer" to the next piece.
This was revolutionary because until then, data was always stored
in contiguous arrays (like a spreadsheet row).

IMPACT: Linked lists became the foundation for:
- Stacks and Queues (implemented via linked list)
- Hash table chaining (collision handling)
- Graphs (adjacency lists)
- Memory allocation (free lists in OS)
- Undo systems, playlists, browser history
```

### When to Use (and NOT Use) Linked Lists

```
✅ USE LINKED LIST WHEN:
- You frequently insert/delete at the FRONT → O(1) vs Array's O(n)
- You implement a Stack or Queue (LIFO/FIFO)
- You don't know the size in advance
- You're building hash chains (HashMap collision resolution)
- You need to merge/split lists efficiently

❌ DO NOT USE WHEN:
- You need random access (arr[i]) → LinkedList is O(n)
- Cache performance matters → LinkedList has terrible cache locality
- You're mostly reading, rarely inserting → Array is better
- Memory is tight → Each node has pointer overhead (8-16 bytes extra)
```

### The Types at a Glance

```
SINGLY LINKED LIST:
  [10|●]→[20|●]→[30|null]
  - Each node: data + next pointer
  - Can only traverse FORWARD
  - Used in: Stack, simple queue, hash chaining

DOUBLY LINKED LIST:
  null←[●|10|●]↔[●|20|●]↔[●|30|●]→null
  - Each node: prev + data + next
  - Can traverse BOTH directions
  - Used in: LRU cache, browser history, text editors

CIRCULAR LINKED LIST:
  [10|●]→[20|●]→[30|●]→(back to 10)
  - Last node points back to first
  - No null at the end
  - Used in: Round-robin scheduling, multiplayer game turns
```

### Mental Model: Train Cars

```
ARRAY = Subway train (fixed cars, all connected rigidly)
  [Car1][Car2][Car3][Car4][Car5]
  Adding a car in the middle? Impossible without rebuilding.

LINKED LIST = Cargo train (cars coupled by hooks)
  [Car1]--hook--[Car2]--hook--[Car3]
  Adding a car? Unhook at any point, hook new car in. DONE.
  Removing a car? Unhook from both sides, reconnect neighbors.
  
  But... to find car #500, you must walk from the locomotive
  through all 499 cars. No shortcuts! That's the O(n) access cost.
```

---

## 🧬 Nature & Behavior

### What is a Linked List?

```
PHYSICAL REALITY:
┌────────────────────────────────────────────────────┐
│ Nodes scattered across memory, connected by refs   │
│                                                    │
│  ┌────┬────┐    ┌────┬────┐    ┌────┬────┐         │
│  │ 10 │ ●──┼───→│ 20 │ ●──┼───→│ 30 │null│         │
│  └────┴────┘    └────┴────┘    └────┴────┘         │
│  addr: 5000     addr: 2000     addr: 8000          │
│                                                    │
│ NOT CONTIGUOUS = Scattered in memory               │
└────────────────────────────────────────────────────┘

WHY NON-CONTIGUOUS IS USEFUL:
- No need for big continuous memory block
- Insert/Delete = just change pointers
- Size can grow infinitely (until memory full)
```

### Linked List vs Array

| Operation        | Array  | LinkedList  | Winner     |
| ---------------- | ------ | ----------- | ---------- |
| Access by index  | O(1)   | O(n)        | Array      |
| Insert at start  | O(n)   | O(1)        | LinkedList |
| Insert at end    | O(1)\* | O(n)†       | Array      |
| Insert at middle | O(n)   | O(1)‡       | LinkedList |
| Memory usage     | Less   | More (refs) | Array      |
| Cache friendly   | Yes    | No          | Array      |

\*If space available  
†O(1) if tail pointer maintained  
‡O(1) if position known, O(n) to find position

### 🔴 Real-World Origin: Music Playlist (1980s)

```
PROBLEM (Early MP3 Players):
- User creates playlist of 1000 songs
- User wants to add song in middle
- User wants to remove current song

WITH ARRAY:
- Adding song at position 500
- Must shift 500 songs
- On slow hardware: 2 seconds delay!
- User experience: TERRIBLE

SOLUTION - LINKED LIST:
- Each song points to next song
- Insert = change 2 pointers
- Delete = change 1 pointer
- Time: O(1) for modifications

REAL IMPLEMENTATION:
- iTunes (2001) used LinkedList for playlists
- Spotify uses doubly-linked list
- "Previous" and "Next" buttons = prev/next pointers!
```

## 💻 Implementation WITHOUT Collections

```java
public class MyLinkedList {

    // Node class (inner)
    private class Node {
        int data;
        Node next;

        Node(int data) {
            this.data = data;
            this.next = null;
        }
    }

    private Node head;
    private Node tail;
    private int size;

    public MyLinkedList() {
        head = null;
        tail = null;
        size = 0;
    }

    // ADD at end - O(1) with tail pointer
    public void add(int value) {
        Node newNode = new Node(value);
        if (head == null) {
            head = tail = newNode;
        } else {
            tail.next = newNode;
            tail = newNode;
        }
        size++;
    }

    // ADD at beginning - O(1)
    public void addFirst(int value) {
        Node newNode = new Node(value);
        newNode.next = head;
        head = newNode;
        if (tail == null) {
            tail = newNode;
        }
        size++;
    }

    // INSERT at index - O(n) to find, O(1) to insert
    public void insert(int index, int value) {
        if (index == 0) {
            addFirst(value);
            return;
        }

        Node current = head;
        for (int i = 0; i < index - 1; i++) {
            current = current.next;
        }

        Node newNode = new Node(value);
        newNode.next = current.next;
        current.next = newNode;

        if (newNode.next == null) {
            tail = newNode;
        }
        size++;
    }

    // GET - O(n)
    public int get(int index) {
        Node current = head;
        for (int i = 0; i < index; i++) {
            current = current.next;
        }
        return current.data;
    }

    // DELETE first - O(1)
    public int deleteFirst() {
        if (head == null) throw new RuntimeException("Empty list");
        int value = head.data;
        head = head.next;
        if (head == null) tail = null;
        size--;
        return value;
    }

    // DELETE at index - O(n)
    public int delete(int index) {
        if (index == 0) return deleteFirst();

        Node current = head;
        for (int i = 0; i < index - 1; i++) {
            current = current.next;
        }

        int value = current.next.data;
        current.next = current.next.next;

        if (current.next == null) {
            tail = current;
        }
        size--;
        return value;
    }

    // REVERSE - O(n) - IMPORTANT FOR INTERVIEWS!
    public void reverse() {
        Node prev = null;
        Node current = head;
        tail = head;  // Old head becomes new tail

        while (current != null) {
            Node next = current.next;  // Save next
            current.next = prev;       // Reverse pointer
            prev = current;            // Move prev forward
            current = next;            // Move current forward
        }

        head = prev;  // New head is last node
    }

    // DETECT CYCLE - Floyd's Algorithm
    public boolean hasCycle() {
        if (head == null) return false;

        Node slow = head;
        Node fast = head;

        while (fast != null && fast.next != null) {
            slow = slow.next;
            fast = fast.next.next;
            if (slow == fast) return true;
        }
        return false;
    }

    // FIND MIDDLE - O(n)
    public int findMiddle() {
        Node slow = head;
        Node fast = head;

        while (fast != null && fast.next != null) {
            slow = slow.next;
            fast = fast.next.next;
        }
        return slow.data;
    }

    public int size() {
        return size;
    }
}
```

## 🎯 LeetCode → Real-World Connection

### Problem: Reverse Linked List

```
REAL-WORLD ORIGIN: Undo Feature in Text Editors (1970s)

PROBLEM AT XEROX PARC (1974):
- Text editor needed "Undo" feature
- Each edit stored as node in list
- Undo = go backwards through edits

INITIAL APPROACH:
- Singly linked list: Edit1 → Edit2 → Edit3
- Undo requires going backwards
- Can't go backwards in singly linked!

SOLUTION OPTIONS:
1. Use doubly linked list (more memory)
2. Reverse the list when needed
3. Store in reverse order

THINKING PROCESS:
"What if we could reverse the direction of arrows?"
    Edit1 → Edit2 → Edit3
becomes:
    Edit1 ← Edit2 ← Edit3

NOW USED IN:
- Git version control (reverse commit history)
- Browser back button
- Database transaction rollback
```

---

## 🧠 Interview Patterns — The 4 LinkedList Techniques You MUST Know

### Pattern 1: Two Pointers (Slow/Fast — "Tortoise and Hare")
```
USE FOR: Find middle, detect cycle, find nth from end

WHY IT WORKS:
  Fast moves 2x speed → when fast reaches end, slow is at middle
  If there's a cycle → fast will eventually "lap" slow

             slow
              ↓
  [1] → [2] → [3] → [4] → [5] → null
                             ↑
                            fast

  After 2 steps: slow=3, fast=5 → fast at end → slow IS the middle!
```

```java
// Find Nth node from end (one-pass, O(1) space)
// WHY: advance fast by N first, then move both → when fast
//      hits null, slow is exactly N from the end
ListNode nthFromEnd(ListNode head, int n) {
    ListNode fast = head, slow = head;
    for (int i = 0; i < n; i++) fast = fast.next;  // Gap of N
    while (fast != null) {
        slow = slow.next;
        fast = fast.next;
    }
    return slow;
}
```

### Pattern 2: Reverse a Linked List (Iterative)
```
WHY THIS IS THE #1 INTERVIEW TECHNIQUE:
  - Appears in 10+ LeetCode problems directly
  - Sub-step in: palindrome check, reorder list, reverse K-group

KEY INSIGHT: Change arrow direction one by one

  BEFORE: 1 → 2 → 3 → null
  
  Step 1: null ← 1    2 → 3 → null   (reverse 1's pointer)
  Step 2: null ← 1 ← 2    3 → null   (reverse 2's pointer)
  Step 3: null ← 1 ← 2 ← 3           (reverse 3's pointer)
  
  AFTER:  null ← 1 ← 2 ← 3  →  head = 3
```

### Pattern 3: Merge Two Sorted Lists
```
WHY: Foundation for merge sort on linked lists, and appears in interviews

     L1: 1 → 3 → 5
     L2: 2 → 4 → 6
     
     Compare heads: 1 < 2 → take 1
     Compare: 3 > 2 → take 2
     Compare: 3 < 4 → take 3
     ...
     Result: 1 → 2 → 3 → 4 → 5 → 6
```

### Pattern 4: Dummy Head Node
```
WHY: Avoids special-casing "what if the head changes?"

  WITHOUT dummy:
    if (head meets condition) head = head.next;  // Special case!
    else { ... find and remove ... }

  WITH dummy:
    ListNode dummy = new ListNode(0);
    dummy.next = head;
    // ... process normally, head never needs special case ...
    return dummy.next;  // The real head

  USE WHEN: Deleting nodes, merging lists, partitioning
```

---

## ⚡ Quick Problem Walkthrough: Detect Cycle Start Point

```
PROBLEM: Given a linked list that may have a cycle, find WHERE the cycle begins.

STEP 1 — Detect if cycle exists (Floyd's algorithm):
  slow moves 1 step, fast moves 2 steps
  If they meet → cycle exists

STEP 2 — Find the start (the mathematical trick):
  Reset ONE pointer to head, keep the other at meeting point
  Both move 1 step at a time → they meet at cycle START

WHY THIS WORKS (math):
  Let distance from head to cycle start = A
  Let distance from cycle start to meeting point = B
  Let cycle length = C

  When they meet:
    slow traveled: A + B
    fast traveled: A + B + C  (fast went around the cycle once more)
    fast = 2 × slow → A + B + C = 2(A + B) → C = A + B → A = C - B
    
  So distance from head to start (A) = distance from meeting to start (C - B)
  → Move both at same speed, they meet at start!
```

```java
ListNode detectCycleStart(ListNode head) {
    ListNode slow = head, fast = head;
    
    // Phase 1: Detect cycle
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
        if (slow == fast) break;
    }
    if (fast == null || fast.next == null) return null; // No cycle
    
    // Phase 2: Find start
    slow = head;
    while (slow != fast) {
        slow = slow.next;
        fast = fast.next;
    }
    return slow; // Cycle start node
}
```

---

📖 **Related Files:**
- [14_Mental_Models/03_Graph_Tree_Thinking.md](../14_Mental_Models/03_Graph_Tree_Thinking.md) — Graph/tree mental models
- [04_Patterns_Templates/12_LinkedList_Plus_TwoPointers.md](../04_Patterns_Templates/12_LinkedList_Plus_TwoPointers.md) — LinkedList pattern problems
- [05_Problem_Solving/01_Problems_Intro_Checklist.md](../05_Problem_Solving/01_Problems_Intro_Checklist.md) — Practice problems

