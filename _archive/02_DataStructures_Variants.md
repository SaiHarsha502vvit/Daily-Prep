# 📚 Data Structures: ALL VARIANTS Complete Guide

## Every Variant of Every Data Structure - Deep Theory & Implementation

---

# PART 0: DATA STRUCTURE VARIANT MAP

::: map

```
╔══════════════════════════════════════════════════════════════════════════════╗
║              COMPLETE DATA STRUCTURE VARIANT HIERARCHY                        ║
╚══════════════════════════════════════════════════════════════════════════════╝

                         DATA STRUCTURES
                              │
     ┌────────────┬──────────┼──────────┬────────────┐
     │            │          │          │            │
  LINEAR      NON-LINEAR   HASH-BASED  SPECIALIZED  PROBABILISTIC
     │            │          │          │            │
     ▼            ▼          ▼          ▼            ▼

LINEAR DATA STRUCTURES:
├── ARRAYS
│   ├── Static Array
│   ├── Dynamic Array (ArrayList)
│   ├── Circular Array
│   ├── Bit Array / BitSet
│   └── Suffix Array
│
├── LINKED LISTS
│   ├── Singly Linked List
│   ├── Doubly Linked List
│   ├── Circular Linked List
│   ├── Circular Doubly Linked List
│   ├── Skip List
│   └── XOR Linked List (Memory Efficient)
│
├── STACKS
│   ├── Array-based Stack
│   ├── Linked List Stack
│   ├── Min Stack
│   ├── Max Stack
│   └── Two-Stack Queue
│
├── QUEUES
│   ├── Simple Queue
│   ├── Circular Queue
│   ├── Deque (Double-ended Queue)
│   ├── Priority Queue
│   └── Monotonic Queue

NON-LINEAR DATA STRUCTURES:
├── TREES
│   ├── Binary Tree
│   ├── Binary Search Tree (BST)
│   ├── AVL Tree (Self-balancing)
│   ├── Red-Black Tree
│   ├── B-Tree / B+ Tree
│   ├── Segment Tree
│   ├── Fenwick Tree (BIT)
│   ├── Trie (Prefix Tree)
│   ├── Suffix Tree
│   ├── N-ary Tree
│   ├── Heap (Min/Max)
│   └── Treap
│
└── GRAPHS
    ├── Directed Graph
    ├── Undirected Graph
    ├── Weighted Graph
    ├── DAG (Directed Acyclic Graph)
    └── Bipartite Graph

HASH-BASED:
├── HashMap / HashTable
├── HashSet
├── LinkedHashMap
├── LinkedHashSet
└── ConcurrentHashMap

SPECIALIZED:
├── Disjoint Set (Union-Find)
├── LRU Cache
├── LFU Cache
└── Bloom Filter
```

:::

---

# PART 1: LINKED LIST VARIANTS (COMPLETE)

## 1.1 Singly Linked List

::: pattern

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    SINGLY LINKED LIST - COMPLETE GUIDE                        ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────────┐
│ WHAT IS IT?                                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ A linear data structure where each element (node) contains:                 │
│ 1. DATA - The actual value stored                                           │
│ 2. NEXT - Reference/pointer to the next node                                │
│                                                                             │
│ VISUAL:                                                                     │
│  ┌────┬────┐    ┌────┬────┐    ┌────┬────┐    ┌────┬────┐                  │
│  │ 10 │  ●─┼───▶│ 20 │  ●─┼───▶│ 30 │  ●─┼───▶│ 40 │null│                  │
│  └────┴────┘    └────┴────┘    └────┴────┘    └────┴────┘                  │
│   head                                          tail                        │
│                                                                             │
│ KEY PROPERTY: Can only traverse FORWARD (one direction)                     │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TIME COMPLEXITY                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ Operation              │ Time    │ Explanation                              │
│ ─────────────────────────────────────────────────────────────────────────── │
│ Access by index        │ O(n)    │ Must traverse from head                  │
│ Search                 │ O(n)    │ Must check each node                     │
│ Insert at head         │ O(1)    │ Just change head pointer                 │
│ Insert at tail         │ O(1)*   │ *If tail pointer maintained              │
│ Insert at middle       │ O(n)    │ Must find position first                 │
│ Delete at head         │ O(1)    │ Just change head pointer                 │
│ Delete at tail         │ O(n)    │ Must find second-to-last                 │
│ Delete at middle       │ O(n)    │ Must find position first                 │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ WHEN TO USE?                                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ ✅ Frequent insertions/deletions at beginning                               │
│ ✅ Don't know size in advance                                               │
│ ✅ Memory is fragmented (non-contiguous is OK)                              │
│ ✅ Implementing stack (LIFO)                                                │
│                                                                             │
│ ❌ Need random access by index                                              │
│ ❌ Need backward traversal                                                  │
│ ❌ Delete at end frequently (use doubly linked)                             │
│ ❌ Memory efficiency is critical (pointers add overhead)                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

:::

::: example

```
REAL-WORLD APPLICATIONS:

1. UNDO FUNCTIONALITY (Simple):
   Action1 → Action2 → Action3 → null
   │
   └── Pop from end to undo

2. BROWSER FORWARD HISTORY:
   Page1 → Page2 → Page3 → null
   │
   └── Click "Forward" = move to next

3. MUSIC PLAYLIST (Forward only):
   Song1 → Song2 → Song3 → null
   │
   └── "Next Track" = go to next node

4. TRAIN CARS:
   Engine → Car1 → Car2 → Caboose → null
   │
   └── Each car connects to next
```

:::

```java
// COMPLETE SINGLY LINKED LIST IMPLEMENTATION
public class SinglyLinkedList<T> {

    // Node class
    private static class Node<T> {
        T data;
        Node<T> next;

        Node(T data) {
            this.data = data;
            this.next = null;
        }
    }

    private Node<T> head;
    private Node<T> tail;
    private int size;

    public SinglyLinkedList() {
        this.head = null;
        this.tail = null;
        this.size = 0;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // INSERTION OPERATIONS
    // ═══════════════════════════════════════════════════════════════════════

    // Insert at beginning - O(1)
    public void insertAtHead(T data) {
        Node<T> newNode = new Node<>(data);
        if (head == null) {
            head = tail = newNode;
        } else {
            newNode.next = head;
            head = newNode;
        }
        size++;
    }

    // Insert at end - O(1) with tail pointer
    public void insertAtTail(T data) {
        Node<T> newNode = new Node<>(data);
        if (head == null) {
            head = tail = newNode;
        } else {
            tail.next = newNode;
            tail = newNode;
        }
        size++;
    }

    // Insert at index - O(n)
    public void insertAt(int index, T data) {
        if (index < 0 || index > size) {
            throw new IndexOutOfBoundsException("Index: " + index);
        }
        if (index == 0) {
            insertAtHead(data);
            return;
        }
        if (index == size) {
            insertAtTail(data);
            return;
        }

        Node<T> newNode = new Node<>(data);
        Node<T> current = head;

        // Traverse to node BEFORE insertion point
        for (int i = 0; i < index - 1; i++) {
            current = current.next;
        }

        newNode.next = current.next;
        current.next = newNode;
        size++;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // DELETION OPERATIONS
    // ═══════════════════════════════════════════════════════════════════════

    // Delete from beginning - O(1)
    public T deleteFromHead() {
        if (head == null) {
            throw new RuntimeException("List is empty");
        }
        T data = head.data;
        head = head.next;
        if (head == null) {
            tail = null;
        }
        size--;
        return data;
    }

    // Delete from end - O(n) - THIS IS WHY DOUBLY LINKED IS BETTER FOR THIS
    public T deleteFromTail() {
        if (head == null) {
            throw new RuntimeException("List is empty");
        }
        if (head == tail) {
            T data = head.data;
            head = tail = null;
            size--;
            return data;
        }

        // Find second-to-last node
        Node<T> current = head;
        while (current.next != tail) {
            current = current.next;
        }

        T data = tail.data;
        current.next = null;
        tail = current;
        size--;
        return data;
    }

    // Delete by value - O(n)
    public boolean delete(T data) {
        if (head == null) return false;

        if (head.data.equals(data)) {
            deleteFromHead();
            return true;
        }

        Node<T> current = head;
        while (current.next != null) {
            if (current.next.data.equals(data)) {
                if (current.next == tail) {
                    tail = current;
                }
                current.next = current.next.next;
                size--;
                return true;
            }
            current = current.next;
        }
        return false;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SEARCH OPERATIONS
    // ═══════════════════════════════════════════════════════════════════════

    // Search - O(n)
    public boolean contains(T data) {
        Node<T> current = head;
        while (current != null) {
            if (current.data.equals(data)) {
                return true;
            }
            current = current.next;
        }
        return false;
    }

    // Get by index - O(n)
    public T get(int index) {
        if (index < 0 || index >= size) {
            throw new IndexOutOfBoundsException("Index: " + index);
        }
        Node<T> current = head;
        for (int i = 0; i < index; i++) {
            current = current.next;
        }
        return current.data;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // UTILITY OPERATIONS
    // ═══════════════════════════════════════════════════════════════════════

    // Reverse - O(n) - VERY IMPORTANT FOR INTERVIEWS
    public void reverse() {
        Node<T> prev = null;
        Node<T> current = head;
        tail = head;  // Old head becomes new tail

        while (current != null) {
            Node<T> nextTemp = current.next;
            current.next = prev;
            prev = current;
            current = nextTemp;
        }
        head = prev;
    }

    // Find middle - O(n) using slow/fast pointers
    public T findMiddle() {
        if (head == null) {
            throw new RuntimeException("List is empty");
        }
        Node<T> slow = head;
        Node<T> fast = head;

        while (fast != null && fast.next != null) {
            slow = slow.next;
            fast = fast.next.next;
        }
        return slow.data;
    }

    // Detect cycle - O(n) Floyd's Algorithm
    public boolean hasCycle() {
        if (head == null) return false;

        Node<T> slow = head;
        Node<T> fast = head;

        while (fast != null && fast.next != null) {
            slow = slow.next;
            fast = fast.next.next;
            if (slow == fast) return true;
        }
        return false;
    }

    // Get Nth node from end - O(n)
    public T getNthFromEnd(int n) {
        Node<T> first = head;
        Node<T> second = head;

        // Move first n nodes ahead
        for (int i = 0; i < n; i++) {
            if (first == null) {
                throw new IndexOutOfBoundsException("n is larger than list size");
            }
            first = first.next;
        }

        // Move both until first reaches end
        while (first != null) {
            first = first.next;
            second = second.next;
        }

        return second.data;
    }

    public int size() { return size; }
    public boolean isEmpty() { return size == 0; }

    // Print list
    public void print() {
        Node<T> current = head;
        while (current != null) {
            System.out.print(current.data + " -> ");
            current = current.next;
        }
        System.out.println("null");
    }
}
```

---

## 1.2 Doubly Linked List

::: pattern

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    DOUBLY LINKED LIST - COMPLETE GUIDE                        ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────────┐
│ WHAT IS IT?                                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ A linked list where each node has TWO pointers:                             │
│ 1. DATA - The actual value                                                  │
│ 2. PREV - Reference to PREVIOUS node                                        │
│ 3. NEXT - Reference to NEXT node                                            │
│                                                                             │
│ VISUAL:                                                                     │
│     null                                                           null     │
│      ↑                                                              ↑       │
│  ┌───┴───────┐    ┌───────────┐    ┌───────────┐    ┌───────────┬──┴──┐    │
│  │prev│10│next│◄──►│prev│20│next│◄──►│prev│30│next│◄──►│prev│40│next│    │
│  └───────────┘    └───────────┘    └───────────┘    └───────────────┘      │
│     head                                                   tail             │
│                                                                             │
│ KEY PROPERTY: Can traverse BOTH directions (forward AND backward)           │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ ADVANTAGES OVER SINGLY LINKED LIST                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ 1. BIDIRECTIONAL TRAVERSAL:                                                 │
│    - Can go forward AND backward                                            │
│    - Essential for "Previous" buttons                                       │
│                                                                             │
│ 2. O(1) DELETE FROM TAIL:                                                   │
│    Singly: O(n) - must find second-to-last                                  │
│    Doubly: O(1) - just use tail.prev                                        │
│                                                                             │
│ 3. EASIER NODE DELETION:                                                    │
│    Given a node reference, can delete in O(1)                               │
│    Don't need to find previous node!                                        │
│                                                                             │
│ 4. BETTER FOR LRU CACHE:                                                    │
│    Move nodes to front/back in O(1)                                         │
│                                                                             │
│ DISADVANTAGE:                                                               │
│    - More memory (extra prev pointer)                                       │
│    - More complex insertion/deletion code                                   │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TIME COMPLEXITY COMPARISON                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ Operation              │ Singly  │ Doubly  │ Winner                        │
│ ─────────────────────────────────────────────────────────────────────────── │
│ Access by index        │ O(n)    │ O(n)    │ Tie                           │
│ Insert at head         │ O(1)    │ O(1)    │ Tie                           │
│ Insert at tail         │ O(1)*   │ O(1)    │ Tie                           │
│ Delete at head         │ O(1)    │ O(1)    │ Tie                           │
│ Delete at tail         │ O(n)    │ O(1)    │ DOUBLY 🏆                     │
│ Delete given node      │ O(n)    │ O(1)    │ DOUBLY 🏆                     │
│ Traverse backward      │ O(n²)   │ O(n)    │ DOUBLY 🏆                     │
│ Memory per node        │ Less    │ More    │ SINGLY (if memory matters)    │
└─────────────────────────────────────────────────────────────────────────────┘
```

:::

::: example

```
REAL-WORLD APPLICATIONS:

1. BROWSER HISTORY (Back & Forward):
   null ← Page1 ↔ Page2 ↔ Page3 → null
           │
           └── "Back" = go to prev
               "Forward" = go to next

2. MUSIC PLAYER (Previous & Next):
   null ← Song1 ↔ Song2 ↔ Song3 → null
           │
           └── Previous Track / Next Track

3. TEXT EDITOR UNDO/REDO:
   null ← Edit1 ↔ Edit2 ↔ Edit3 → null
           │
           └── Undo = go prev
               Redo = go next

4. LRU CACHE (Move to front):
   head ↔ Recent1 ↔ Recent2 ↔ LeastRecent → tail
   │
   └── Access item = move to head in O(1)

5. IMAGE VIEWER (Swipe left/right):
   null ← Img1 ↔ Img2 ↔ Img3 → null
```

:::

```java
// COMPLETE DOUBLY LINKED LIST IMPLEMENTATION
public class DoublyLinkedList<T> {

    // Node class with prev and next pointers
    private static class Node<T> {
        T data;
        Node<T> prev;
        Node<T> next;

        Node(T data) {
            this.data = data;
            this.prev = null;
            this.next = null;
        }
    }

    private Node<T> head;
    private Node<T> tail;
    private int size;

    public DoublyLinkedList() {
        this.head = null;
        this.tail = null;
        this.size = 0;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // INSERTION OPERATIONS
    // ═══════════════════════════════════════════════════════════════════════

    // Insert at beginning - O(1)
    public void insertAtHead(T data) {
        Node<T> newNode = new Node<>(data);

        if (head == null) {
            // Empty list
            head = tail = newNode;
        } else {
            // Link with current head
            newNode.next = head;
            head.prev = newNode;
            head = newNode;
        }
        size++;
    }

    // Insert at end - O(1)
    public void insertAtTail(T data) {
        Node<T> newNode = new Node<>(data);

        if (tail == null) {
            // Empty list
            head = tail = newNode;
        } else {
            // Link with current tail
            newNode.prev = tail;
            tail.next = newNode;
            tail = newNode;
        }
        size++;
    }

    // Insert after a specific node - O(1)
    // THIS IS WHERE DOUBLY LINKED SHINES!
    public void insertAfter(Node<T> node, T data) {
        if (node == null) {
            throw new IllegalArgumentException("Node cannot be null");
        }

        Node<T> newNode = new Node<>(data);

        // Link new node
        newNode.prev = node;
        newNode.next = node.next;

        // Update existing links
        if (node.next != null) {
            node.next.prev = newNode;
        } else {
            tail = newNode;  // Inserting at end
        }
        node.next = newNode;

        size++;
    }

    // Insert before a specific node - O(1)
    public void insertBefore(Node<T> node, T data) {
        if (node == null) {
            throw new IllegalArgumentException("Node cannot be null");
        }

        Node<T> newNode = new Node<>(data);

        // Link new node
        newNode.next = node;
        newNode.prev = node.prev;

        // Update existing links
        if (node.prev != null) {
            node.prev.next = newNode;
        } else {
            head = newNode;  // Inserting at beginning
        }
        node.prev = newNode;

        size++;
    }

    // Insert at index - O(n)
    public void insertAt(int index, T data) {
        if (index < 0 || index > size) {
            throw new IndexOutOfBoundsException("Index: " + index);
        }
        if (index == 0) {
            insertAtHead(data);
            return;
        }
        if (index == size) {
            insertAtTail(data);
            return;
        }

        // Find the node at index
        Node<T> current = getNodeAt(index);
        insertBefore(current, data);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // DELETION OPERATIONS
    // ═══════════════════════════════════════════════════════════════════════

    // Delete from beginning - O(1)
    public T deleteFromHead() {
        if (head == null) {
            throw new RuntimeException("List is empty");
        }

        T data = head.data;

        if (head == tail) {
            // Only one element
            head = tail = null;
        } else {
            head = head.next;
            head.prev = null;
        }

        size--;
        return data;
    }

    // Delete from end - O(1) - MUCH BETTER THAN SINGLY LINKED!
    public T deleteFromTail() {
        if (tail == null) {
            throw new RuntimeException("List is empty");
        }

        T data = tail.data;

        if (head == tail) {
            // Only one element
            head = tail = null;
        } else {
            tail = tail.prev;
            tail.next = null;
        }

        size--;
        return data;
    }

    // Delete a specific node - O(1) when you have the node reference!
    // THIS IS THE KILLER FEATURE OF DOUBLY LINKED LIST
    public T deleteNode(Node<T> node) {
        if (node == null) {
            throw new IllegalArgumentException("Node cannot be null");
        }

        T data = node.data;

        // Update prev's next
        if (node.prev != null) {
            node.prev.next = node.next;
        } else {
            head = node.next;  // Deleting head
        }

        // Update next's prev
        if (node.next != null) {
            node.next.prev = node.prev;
        } else {
            tail = node.prev;  // Deleting tail
        }

        size--;
        return data;
    }

    // Delete by value - O(n)
    public boolean delete(T data) {
        Node<T> current = head;

        while (current != null) {
            if (current.data.equals(data)) {
                deleteNode(current);
                return true;
            }
            current = current.next;
        }
        return false;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TRAVERSAL OPERATIONS
    // ═══════════════════════════════════════════════════════════════════════

    // Traverse forward
    public void traverseForward() {
        Node<T> current = head;
        System.out.print("null <- ");
        while (current != null) {
            System.out.print(current.data);
            if (current.next != null) {
                System.out.print(" <-> ");
            }
            current = current.next;
        }
        System.out.println(" -> null");
    }

    // Traverse backward
    public void traverseBackward() {
        Node<T> current = tail;
        System.out.print("null <- ");
        while (current != null) {
            System.out.print(current.data);
            if (current.prev != null) {
                System.out.print(" <-> ");
            }
            current = current.prev;
        }
        System.out.println(" -> null");
    }

    // ═══════════════════════════════════════════════════════════════════════
    // UTILITY OPERATIONS
    // ═══════════════════════════════════════════════════════════════════════

    // Get node at index - O(n) but optimized!
    // Can start from head OR tail depending on index
    private Node<T> getNodeAt(int index) {
        if (index < 0 || index >= size) {
            throw new IndexOutOfBoundsException("Index: " + index);
        }

        Node<T> current;

        // Optimization: start from closer end
        if (index < size / 2) {
            // Start from head
            current = head;
            for (int i = 0; i < index; i++) {
                current = current.next;
            }
        } else {
            // Start from tail (faster for second half)
            current = tail;
            for (int i = size - 1; i > index; i--) {
                current = current.prev;
            }
        }

        return current;
    }

    // Get by index - O(n)
    public T get(int index) {
        return getNodeAt(index).data;
    }

    // Reverse - O(n)
    public void reverse() {
        Node<T> current = head;
        Node<T> temp = null;

        // Swap prev and next for all nodes
        while (current != null) {
            temp = current.prev;
            current.prev = current.next;
            current.next = temp;
            current = current.prev;  // Move to next (which is now prev)
        }

        // Swap head and tail
        temp = head;
        head = tail;
        tail = temp;
    }

    // Move a node to front - O(1)
    // Very useful for LRU Cache!
    public void moveToFront(Node<T> node) {
        if (node == head) return;  // Already at front

        // Remove from current position
        if (node.prev != null) {
            node.prev.next = node.next;
        }
        if (node.next != null) {
            node.next.prev = node.prev;
        } else {
            tail = node.prev;  // Was at end
        }

        // Move to front
        node.prev = null;
        node.next = head;
        head.prev = node;
        head = node;
    }

    public int size() { return size; }
    public boolean isEmpty() { return size == 0; }
}
```

::: memory

```
🧠 INTERVIEW KEY POINTS - DOUBLY LINKED LIST:

1. "Why use doubly over singly?"
   → Delete at tail: O(1) vs O(n)
   → Bidirectional traversal
   → Delete given node: O(1) vs O(n)

2. "What's the main disadvantage?"
   → Extra memory for prev pointer
   → More complex code

3. "Real-world use case?"
   → LRU Cache (HashMap + Doubly Linked)
   → Browser back/forward
   → Text editor undo/redo

4. "How to delete a node in O(1)?"
   → node.prev.next = node.next
   → node.next.prev = node.prev
   → Handle edge cases (head/tail)
```

:::

---

## 1.3 Circular Linked List

::: pattern

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    CIRCULAR LINKED LIST - COMPLETE GUIDE                      ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────────┐
│ WHAT IS IT?                                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ A linked list where the LAST node points BACK to the FIRST node.            │
│ No NULL at end - forms a CIRCLE!                                            │
│                                                                             │
│ SINGLY CIRCULAR:                                                            │
│       ┌────────────────────────────────────────┐                           │
│       │                                        │                           │
│       ▼                                        │                           │
│  ┌────┬────┐  ┌────┬────┐  ┌────┬────┐  ┌────┬─┴──┐                        │
│  │ 10 │  ●─┼─▶│ 20 │  ●─┼─▶│ 30 │  ●─┼─▶│ 40 │  ● │                        │
│  └────┴────┘  └────┴────┘  └────┴────┘  └────┴────┘                        │
│     head                                  tail                              │
│                                                                             │
│ DOUBLY CIRCULAR:                                                            │
│       ┌────────────────────────────────────────┐                           │
│       │      ┌──────────────────────────────┐  │                           │
│       ▼      │                              │  ▼                           │
│  ┌───┬───┬───┴┐  ┌───┬───┬───┐  ┌───┬───┬──┴┐                             │
│  │ ● │10 │ ●──┼─▶│ ● │20 │ ●─┼─▶│ ● │30 │ ● │                             │
│  └─▲─┴───┴────┘  └─▲─┴───┴───┘  └───┴───┴─▲─┘                             │
│    │               │                       │                               │
│    └───────────────┴───────────────────────┘                               │
│                                                                             │
│ KEY PROPERTY: Can traverse the entire list starting from ANY node!         │
│               No "end" - goes round and round.                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ WHY USE CIRCULAR?                                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ 1. ROUND-ROBIN SCHEDULING:                                                  │
│    - Process1 → Process2 → Process3 → Process1 → ...                       │
│    - CPU gives time to each process in circular order                      │
│                                                                             │
│ 2. MULTIPLAYER GAME TURNS:                                                  │
│    - Player1 → Player2 → Player3 → Player1 → ...                          │
│    - No need to reset to beginning                                         │
│                                                                             │
│ 3. CIRCULAR BUFFER/QUEUE:                                                   │
│    - Audio streaming                                                        │
│    - Producer-consumer problems                                             │
│                                                                             │
│ 4. REPEATED TRAVERSAL:                                                      │
│    - Carousel/slideshow that loops                                         │
│    - Music playlist on repeat                                               │
│                                                                             │
│ KEY INSIGHT: Useful when you need to wrap around!                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

:::

::: example

```
REAL-WORLD APPLICATIONS:

1. OPERATING SYSTEM - ROUND ROBIN CPU SCHEDULING:
   ┌──────────────────────────────────────────┐
   │                                          │
   │    Process1 → Process2 → Process3 ───────┤
   │       ▲                                  │
   │       │                                  │
   │       └──────────────────────────────────┘
   │
   └── Each process gets CPU time, then goes to end

2. MULTIPLAYER GAME TURNS:
   ┌──────────────────────────────────────────┐
   │                                          │
   │    Alice → Bob → Charlie → Diana ────────┤
   │       ▲                                  │
   │       └──────────────────────────────────┘
   │
   └── After Diana's turn, it's Alice's turn again

3. MUSIC PLAYER ON REPEAT:
   ┌──────────────────────────────────────────┐
   │                                          │
   │    Song1 → Song2 → Song3 ────────────────┤
   │       ▲                                  │
   │       └──────────────────────────────────┘
   │
   └── After last song, goes back to first

4. JOSEPHUS PROBLEM (Classical):
   n people in circle, every k-th person eliminated
   Who survives? (Famous interview problem!)
```

:::

```java
// COMPLETE CIRCULAR SINGLY LINKED LIST IMPLEMENTATION
public class CircularLinkedList<T> {

    private static class Node<T> {
        T data;
        Node<T> next;

        Node(T data) {
            this.data = data;
        }
    }

    private Node<T> tail;  // We keep tail, not head! (head = tail.next)
    private int size;

    // Why keep tail instead of head?
    // - Insert at head: O(1) - create node, point to head, tail.next = new
    // - Insert at tail: O(1) - create node, point to head, update tail
    // With only head, insert at tail would be O(n)!

    public CircularLinkedList() {
        this.tail = null;
        this.size = 0;
    }

    // Insert at front - O(1)
    public void insertAtFront(T data) {
        Node<T> newNode = new Node<>(data);

        if (tail == null) {
            // First element - points to itself!
            newNode.next = newNode;
            tail = newNode;
        } else {
            // Insert between tail and head
            newNode.next = tail.next;  // New node points to old head
            tail.next = newNode;        // Tail points to new node (new head)
        }
        size++;
    }

    // Insert at end - O(1)
    public void insertAtEnd(T data) {
        insertAtFront(data);  // Insert at front
        tail = tail.next;      // Then move tail pointer
    }

    // Delete from front - O(1)
    public T deleteFromFront() {
        if (tail == null) {
            throw new RuntimeException("List is empty");
        }

        Node<T> head = tail.next;
        T data = head.data;

        if (head == tail) {
            // Only one element
            tail = null;
        } else {
            tail.next = head.next;
        }

        size--;
        return data;
    }

    // Delete from end - O(n) - must find second-to-last
    public T deleteFromEnd() {
        if (tail == null) {
            throw new RuntimeException("List is empty");
        }

        if (tail.next == tail) {
            // Only one element
            T data = tail.data;
            tail = null;
            size--;
            return data;
        }

        // Find second-to-last
        Node<T> current = tail.next;
        while (current.next != tail) {
            current = current.next;
        }

        T data = tail.data;
        current.next = tail.next;  // Point to head
        tail = current;            // New tail
        size--;
        return data;
    }

    // Traverse entire list - O(n)
    public void traverse() {
        if (tail == null) {
            System.out.println("Empty list");
            return;
        }

        Node<T> current = tail.next;  // Start from head
        do {
            System.out.print(current.data + " -> ");
            current = current.next;
        } while (current != tail.next);  // Stop when back at head

        System.out.println("(back to start)");
    }

    // JOSEPHUS PROBLEM - Classic circular list problem!
    // n people in circle, every k-th person eliminated
    // Returns the survivor's position (1-indexed)
    public static int josephus(int n, int k) {
        // Create circular list with positions 1 to n
        CircularLinkedList<Integer> circle = new CircularLinkedList<>();
        for (int i = 1; i <= n; i++) {
            circle.insertAtEnd(i);
        }

        Node<Integer> current = circle.tail;

        while (circle.size > 1) {
            // Move k-1 steps (k-th person from current)
            for (int i = 0; i < k - 1; i++) {
                current = current.next;
            }

            // Remove the k-th person (current.next)
            Node<Integer> toRemove = current.next;
            System.out.println("Eliminating person " + toRemove.data);

            current.next = toRemove.next;
            if (toRemove == circle.tail) {
                circle.tail = current;
            }
            circle.size--;
        }

        return circle.tail.data;
    }

    public int size() { return size; }
    public boolean isEmpty() { return size == 0; }
}
```

---

## 1.4 Circular Doubly Linked List

::: pattern

```
╔══════════════════════════════════════════════════════════════════════════════╗
║               CIRCULAR DOUBLY LINKED LIST - COMPLETE GUIDE                    ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────────┐
│ WHAT IS IT?                                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ Combines BOTH concepts:                                                     │
│ • Doubly: Each node has prev AND next pointers                             │
│ • Circular: Last node connects to first, first connects to last            │
│                                                                             │
│ VISUAL:                                                                     │
│     ┌───────────────────────────────────────────────────────────┐          │
│     │                                                           │          │
│     │    ┌─────────────────────────────────────────────────┐    │          │
│     │    │                                                 │    │          │
│     ▼    │                                                 ▼    │          │
│  ┌──┴──┬───┬─────┐  ┌─────┬───┬─────┐  ┌─────┬───┬──┴──┐       │          │
│  │prev │ A │ next│◄─►│prev │ B │ next│◄─►│prev │ C │next │       │          │
│  └─────┴───┴──┬──┘  └─────┴───┴─────┘  └──┬──┴───┴─────┘       │          │
│               │                           │                     │          │
│               └───────────────────────────┘                     │          │
│     ▲                                                           │          │
│     └───────────────────────────────────────────────────────────┘          │
│                                                                             │
│ KEY: A.prev = C, C.next = A (circular in BOTH directions!)                 │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ ADVANTAGES                                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ✅ O(1) insertion at both ends                                              │
│ ✅ O(1) deletion at both ends                                               │
│ ✅ O(1) deletion of any node (given reference)                              │
│ ✅ Can traverse in both directions                                          │
│ ✅ Can wrap around in both directions                                       │
│ ✅ No need to check for null at boundaries                                  │
│                                                                             │
│ ❌ More memory (two pointers per node)                                      │
│ ❌ More complex code                                                         │
│                                                                             │
│ PERFECT FOR:                                                                │
│ • Deque (double-ended queue) implementation                                │
│ • Applications needing wrap-around in both directions                      │
│ • When you frequently access both ends                                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

:::

::: example

```
REAL-WORLD APPLICATIONS:

1. FIBONACCI HEAP (Advanced Data Structure):
   - Uses circular doubly linked lists
   - O(1) amortized insert and decrease-key

2. ADVANCED CACHE IMPLEMENTATIONS:
   - Can move elements efficiently
   - Access patterns in both directions

3. IMAGE CAROUSEL WITH BOTH DIRECTIONS:
   - Swipe left OR right
   - Wrap around in either direction
```

:::

```java
// CIRCULAR DOUBLY LINKED LIST IMPLEMENTATION
public class CircularDoublyLinkedList<T> {

    private static class Node<T> {
        T data;
        Node<T> prev;
        Node<T> next;

        Node(T data) {
            this.data = data;
        }
    }

    private Node<T> head;
    private int size;

    public CircularDoublyLinkedList() {
        this.head = null;
        this.size = 0;
    }

    // Insert at front - O(1)
    public void insertAtFront(T data) {
        Node<T> newNode = new Node<>(data);

        if (head == null) {
            // First element - points to itself in both directions!
            newNode.next = newNode;
            newNode.prev = newNode;
            head = newNode;
        } else {
            Node<T> tail = head.prev;  // Last element

            // Link new node
            newNode.next = head;
            newNode.prev = tail;

            // Update existing links
            head.prev = newNode;
            tail.next = newNode;

            head = newNode;
        }
        size++;
    }

    // Insert at end - O(1)
    public void insertAtEnd(T data) {
        if (head == null) {
            insertAtFront(data);
            return;
        }

        Node<T> newNode = new Node<>(data);
        Node<T> tail = head.prev;

        // Link new node
        newNode.prev = tail;
        newNode.next = head;

        // Update existing links
        tail.next = newNode;
        head.prev = newNode;

        size++;
    }

    // Delete from front - O(1)
    public T deleteFromFront() {
        if (head == null) {
            throw new RuntimeException("List is empty");
        }

        T data = head.data;

        if (size == 1) {
            head = null;
        } else {
            Node<T> tail = head.prev;
            head = head.next;
            head.prev = tail;
            tail.next = head;
        }

        size--;
        return data;
    }

    // Delete from end - O(1)
    public T deleteFromEnd() {
        if (head == null) {
            throw new RuntimeException("List is empty");
        }

        if (size == 1) {
            return deleteFromFront();
        }

        Node<T> tail = head.prev;
        T data = tail.data;

        Node<T> newTail = tail.prev;
        newTail.next = head;
        head.prev = newTail;

        size--;
        return data;
    }

    // Traverse forward (full circle)
    public void traverseForward() {
        if (head == null) return;

        Node<T> current = head;
        do {
            System.out.print(current.data + " <-> ");
            current = current.next;
        } while (current != head);
        System.out.println("(back to " + head.data + ")");
    }

    // Traverse backward (full circle)
    public void traverseBackward() {
        if (head == null) return;

        Node<T> current = head.prev;  // Start from tail
        do {
            System.out.print(current.data + " <-> ");
            current = current.prev;
        } while (current != head.prev);
        System.out.println("(back to " + head.prev.data + ")");
    }

    public int size() { return size; }
    public boolean isEmpty() { return size == 0; }
}
```

---

## 1.5 Skip List

::: pattern

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                       SKIP LIST - COMPLETE GUIDE                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────────┐
│ WHAT IS IT?                                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ A probabilistic data structure that allows O(log n) search, insert, and    │
│ delete in a SORTED linked list. It's like a "fast lane" over the list!     │
│                                                                             │
│ INVENTED: 1989 by William Pugh                                              │
│                                                                             │
│ VISUAL - MULTIPLE LAYERS OF LINKED LISTS:                                   │
│                                                                             │
│ Level 3: HEAD ────────────────────────────────────────────> 50 ────> NIL   │
│            │                                                  │             │
│ Level 2: HEAD ──────────────> 25 ────────────────────────> 50 ────> NIL   │
│            │                   │                              │             │
│ Level 1: HEAD ───> 10 ──────> 25 ──────> 35 ──────────────> 50 ────> NIL   │
│            │       │           │          │                   │             │
│ Level 0: HEAD ─> 5 ─> 10 ─> 20 ─> 25 ─> 30 ─> 35 ─> 40 ─> 50 ─> 60 ─> NIL │
│                                                                             │
│ SEARCH FOR 35:                                                              │
│ 1. Start at Level 3: HEAD -> 50 (too big, go down)                         │
│ 2. Level 2: HEAD -> 25 -> 50 (25 < 35 < 50, go down from 25)              │
│ 3. Level 1: 25 -> 35 (FOUND!)                                              │
│                                                                             │
│ Only visited: HEAD, 50, 25, 35 = 4 nodes instead of 7!                     │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ WHY USE SKIP LIST?                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ PROBLEM: Sorted linked list has O(n) search                                │
│ SOLUTION: Add "express lanes" for faster traversal                         │
│                                                                             │
│ COMPARISON:                                                                 │
│ ┌───────────────────────┬──────────────┬──────────────┬──────────────────┐ │
│ │ Operation             │ Linked List  │ BST          │ Skip List        │ │
│ ├───────────────────────┼──────────────┼──────────────┼──────────────────┤ │
│ │ Search                │ O(n)         │ O(log n)*    │ O(log n) avg     │ │
│ │ Insert                │ O(n)         │ O(log n)*    │ O(log n) avg     │ │
│ │ Delete                │ O(n)         │ O(log n)*    │ O(log n) avg     │ │
│ │ Ordered iteration     │ O(n)         │ O(n)         │ O(n)             │ │
│ │ Implementation        │ Simple       │ Complex      │ Moderate         │ │
│ │ Concurrent access     │ Hard         │ Very hard    │ Easier!          │ │
│ └───────────────────────┴──────────────┴──────────────┴──────────────────┘ │
│ * BST worst case is O(n) if unbalanced                                     │
│                                                                             │
│ KEY ADVANTAGE: Easier to implement concurrent (thread-safe) version!       │
│ This is why Redis uses skip list for sorted sets!                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

:::

::: example

```
REAL-WORLD APPLICATIONS:

1. REDIS SORTED SETS:
   - Redis uses skip lists for ZSET
   - O(log n) range queries
   - O(log n) rank operations

2. LEVELDB / ROCKSDB:
   - Key-value databases
   - In-memory index structure

3. LUCENE (Search Engine):
   - Posting lists with skip pointers

4. CONCURRENT DATA STRUCTURES:
   - ConcurrentSkipListMap in Java
   - Easier to make thread-safe than trees

WHY REDIS CHOSE SKIP LIST OVER BALANCED TREE:
- Simpler to implement
- Easier to debug
- Better for range queries
- Easier to make concurrent
- Memory locality can be better
```

:::

```java
// SKIP LIST IMPLEMENTATION
import java.util.Random;

public class SkipList<T extends Comparable<T>> {

    private static final int MAX_LEVEL = 16;  // Max height
    private static final double P = 0.5;      // Probability for level up

    private class Node {
        T value;
        Node[] forward;  // Array of forward pointers

        @SuppressWarnings("unchecked")
        Node(T value, int level) {
            this.value = value;
            this.forward = new SkipList.Node[level + 1];
        }
    }

    private Node head;
    private int level;  // Current highest level
    private int size;
    private Random random;

    @SuppressWarnings("unchecked")
    public SkipList() {
        this.head = new Node(null, MAX_LEVEL);
        this.level = 0;
        this.size = 0;
        this.random = new Random();
    }

    // Generate random level for new node
    private int randomLevel() {
        int lvl = 0;
        while (random.nextDouble() < P && lvl < MAX_LEVEL) {
            lvl++;
        }
        return lvl;
    }

    // Search - O(log n) average
    public boolean search(T value) {
        Node current = head;

        // Start from highest level, go down
        for (int i = level; i >= 0; i--) {
            while (current.forward[i] != null &&
                   current.forward[i].value.compareTo(value) < 0) {
                current = current.forward[i];
            }
        }

        // Move to level 0
        current = current.forward[0];

        return current != null && current.value.compareTo(value) == 0;
    }

    // Insert - O(log n) average
    @SuppressWarnings("unchecked")
    public void insert(T value) {
        Node[] update = new SkipList.Node[MAX_LEVEL + 1];
        Node current = head;

        // Find position at each level
        for (int i = level; i >= 0; i--) {
            while (current.forward[i] != null &&
                   current.forward[i].value.compareTo(value) < 0) {
                current = current.forward[i];
            }
            update[i] = current;  // Save node at this level
        }

        current = current.forward[0];

        // If value doesn't exist, insert it
        if (current == null || !current.value.equals(value)) {
            int newLevel = randomLevel();

            // If new level is higher than current
            if (newLevel > level) {
                for (int i = level + 1; i <= newLevel; i++) {
                    update[i] = head;
                }
                level = newLevel;
            }

            // Create and insert new node
            Node newNode = new Node(value, newLevel);
            for (int i = 0; i <= newLevel; i++) {
                newNode.forward[i] = update[i].forward[i];
                update[i].forward[i] = newNode;
            }

            size++;
        }
    }

    // Delete - O(log n) average
    @SuppressWarnings("unchecked")
    public boolean delete(T value) {
        Node[] update = new SkipList.Node[MAX_LEVEL + 1];
        Node current = head;

        // Find position at each level
        for (int i = level; i >= 0; i--) {
            while (current.forward[i] != null &&
                   current.forward[i].value.compareTo(value) < 0) {
                current = current.forward[i];
            }
            update[i] = current;
        }

        current = current.forward[0];

        // If found, delete it
        if (current != null && current.value.equals(value)) {
            for (int i = 0; i <= level; i++) {
                if (update[i].forward[i] != current) break;
                update[i].forward[i] = current.forward[i];
            }

            // Reduce level if needed
            while (level > 0 && head.forward[level] == null) {
                level--;
            }

            size--;
            return true;
        }
        return false;
    }

    // Display the skip list
    public void display() {
        System.out.println("Skip List (level " + level + "):");
        for (int i = level; i >= 0; i--) {
            System.out.print("Level " + i + ": ");
            Node current = head.forward[i];
            while (current != null) {
                System.out.print(current.value + " -> ");
                current = current.forward[i];
            }
            System.out.println("NIL");
        }
    }

    public int size() { return size; }
}
```

---

# PART 2: STACK VARIANTS

## 2.1 Min Stack

::: pattern

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                      MIN STACK - COMPLETE GUIDE                               ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────────┐
│ WHAT IS IT?                                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ A stack that supports:                                                      │
│ • push(x)   - O(1)                                                          │
│ • pop()     - O(1)                                                          │
│ • top()     - O(1)                                                          │
│ • getMin()  - O(1)  ← THE SPECIAL OPERATION!                               │
│                                                                             │
│ CHALLENGE: How to get minimum in O(1)?                                      │
│                                                                             │
│ NAIVE: Search entire stack → O(n)                                          │
│ SMART: Track minimum at EACH state of the stack!                           │
│                                                                             │
│ APPROACH 1 - TWO STACKS:                                                    │
│   Main Stack:  [3, 5, 2, 7, 1]  top→                                       │
│   Min Stack:   [3, 3, 2, 2, 1]  top→                                       │
│                                                                             │
│   Min stack stores the minimum at each point!                              │
│   When we pop, both stacks pop.                                            │
│   getMin() = minStack.top()                                                │
│                                                                             │
│ APPROACH 2 - SINGLE STACK WITH PAIRS:                                       │
│   Stack: [(3,3), (5,3), (2,2), (7,2), (1,1)]                              │
│          (value, min_at_this_point)                                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

:::

```java
// MIN STACK - TWO STACK APPROACH
public class MinStack {
    private Stack<Integer> mainStack;
    private Stack<Integer> minStack;

    public MinStack() {
        mainStack = new Stack<>();
        minStack = new Stack<>();
    }

    public void push(int val) {
        mainStack.push(val);

        // Push to minStack: either val or current min (whichever is smaller)
        if (minStack.isEmpty()) {
            minStack.push(val);
        } else {
            minStack.push(Math.min(val, minStack.peek()));
        }
    }

    public void pop() {
        mainStack.pop();
        minStack.pop();
    }

    public int top() {
        return mainStack.peek();
    }

    public int getMin() {
        return minStack.peek();
    }
}

// MIN STACK - SPACE OPTIMIZED (SINGLE STACK)
public class MinStackOptimized {
    private Stack<Long> stack;
    private long min;

    public MinStackOptimized() {
        stack = new Stack<>();
    }

    public void push(int val) {
        if (stack.isEmpty()) {
            min = val;
            stack.push(0L);  // Difference from min
        } else {
            stack.push((long)val - min);
            if (val < min) {
                min = val;
            }
        }
    }

    public void pop() {
        long top = stack.pop();
        if (top < 0) {
            // We need to restore previous min
            min = min - top;
        }
    }

    public int top() {
        long top = stack.peek();
        if (top < 0) {
            return (int)min;
        }
        return (int)(min + top);
    }

    public int getMin() {
        return (int)min;
    }
}
```

---

## 2.2 Max Stack

::: pattern

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                      MAX STACK - COMPLETE GUIDE                               ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────────┐
│ WHAT IS IT?                                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ Similar to Min Stack but also supports:                                     │
│ • popMax() - Remove and return the maximum element                         │
│                                                                             │
│ This is HARDER than Min Stack because:                                      │
│ - popMax() might remove element from MIDDLE of stack                       │
│ - Need to maintain consistency                                             │
│                                                                             │
│ APPROACH: Use TreeMap + Doubly Linked List                                 │
│   - Doubly Linked List: Maintains stack order                              │
│   - TreeMap: Maps values to their nodes for O(log n) max finding           │
└─────────────────────────────────────────────────────────────────────────────┘
```

:::

```java
// MAX STACK - SIMPLE VERSION (O(n) popMax)
public class MaxStackSimple {
    private Stack<Integer> stack;
    private Stack<Integer> maxStack;

    public MaxStackSimple() {
        stack = new Stack<>();
        maxStack = new Stack<>();
    }

    public void push(int x) {
        stack.push(x);
        if (maxStack.isEmpty()) {
            maxStack.push(x);
        } else {
            maxStack.push(Math.max(x, maxStack.peek()));
        }
    }

    public int pop() {
        maxStack.pop();
        return stack.pop();
    }

    public int top() {
        return stack.peek();
    }

    public int peekMax() {
        return maxStack.peek();
    }

    // O(n) - Need to rebuild stack
    public int popMax() {
        int max = maxStack.peek();
        Stack<Integer> temp = new Stack<>();

        // Pop until we find max
        while (stack.peek() != max) {
            temp.push(pop());
        }

        // Pop the max
        pop();

        // Push back
        while (!temp.isEmpty()) {
            push(temp.pop());
        }

        return max;
    }
}
```

---

# PART 3: QUEUE VARIANTS

## 3.1 Circular Queue

::: pattern

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    CIRCULAR QUEUE - COMPLETE GUIDE                            ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────────┐
│ WHAT IS IT?                                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ A queue implemented using a circular array.                                 │
│ When we reach the end of the array, we wrap around to the beginning!       │
│                                                                             │
│ WHY CIRCULAR?                                                               │
│                                                                             │
│ LINEAR QUEUE PROBLEM:                                                       │
│   After many enqueue/dequeue operations:                                   │
│   [_, _, _, _, 5, 6, 7, _]                                                  │
│               ↑        ↑                                                   │
│             front    rear                                                  │
│   Wasted space at beginning!                                               │
│                                                                             │
│ CIRCULAR QUEUE SOLUTION:                                                    │
│   [8, 9, _, _, 5, 6, 7]                                                    │
│         ↑     ↑                                                            │
│       rear  front                                                          │
│   rear wraps around to use empty space!                                    │
│                                                                             │
│ VISUAL (as a circle):                                                       │
│           ┌───┐                                                            │
│          / 7   \                                                           │
│        /         \                                                         │
│      │ 6          8 │                                                      │
│        \         /                                                         │
│         \ 5   9 /                                                          │
│           └───┘                                                            │
│            front                                                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

:::

::: example

```
REAL-WORLD APPLICATIONS:

1. CPU SCHEDULING (Round Robin):
   Processes wait in circular queue
   Each gets a time slice, then goes to end

2. MEMORY MANAGEMENT:
   Buffer pools in databases
   Connection pools in web servers

3. AUDIO/VIDEO STREAMING:
   Circular buffer for smooth playback
   Producer writes, consumer reads

4. KEYBOARD BUFFER:
   Stores keystrokes
   Old keystrokes overwritten if buffer full
```

:::

```java
// CIRCULAR QUEUE IMPLEMENTATION
public class CircularQueue<T> {
    private Object[] data;
    private int front;
    private int rear;
    private int size;
    private int capacity;

    public CircularQueue(int capacity) {
        this.capacity = capacity;
        this.data = new Object[capacity];
        this.front = 0;
        this.rear = -1;
        this.size = 0;
    }

    // Enqueue - O(1)
    public boolean enqueue(T item) {
        if (isFull()) {
            return false;  // Queue is full
        }

        rear = (rear + 1) % capacity;  // Circular increment
        data[rear] = item;
        size++;
        return true;
    }

    // Dequeue - O(1)
    @SuppressWarnings("unchecked")
    public T dequeue() {
        if (isEmpty()) {
            throw new RuntimeException("Queue is empty");
        }

        T item = (T) data[front];
        front = (front + 1) % capacity;  // Circular increment
        size--;
        return item;
    }

    // Peek - O(1)
    @SuppressWarnings("unchecked")
    public T peek() {
        if (isEmpty()) {
            throw new RuntimeException("Queue is empty");
        }
        return (T) data[front];
    }

    public boolean isEmpty() {
        return size == 0;
    }

    public boolean isFull() {
        return size == capacity;
    }

    public int size() {
        return size;
    }
}
```

---

## 3.2 Deque (Double-Ended Queue)

::: pattern

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                      DEQUE - COMPLETE GUIDE                                   ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────────┐
│ WHAT IS IT?                                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ A queue where you can add/remove from BOTH ends in O(1)!                   │
│                                                                             │
│ VISUAL:                                                                     │
│   addFirst ──→ ┌───┬───┬───┬───┬───┐ ←── addLast                          │
│                │ A │ B │ C │ D │ E │                                       │
│  removeFirst ←─ └───┴───┴───┴───┴───┘ ──→ removeLast                       │
│                                                                             │
│ OPERATIONS:                                                                 │
│ • addFirst(x)    - Add to front                                            │
│ • addLast(x)     - Add to back                                             │
│ • removeFirst()  - Remove from front                                       │
│ • removeLast()   - Remove from back                                        │
│ • peekFirst()    - See front                                               │
│ • peekLast()     - See back                                                │
│                                                                             │
│ ALL OPERATIONS ARE O(1)!                                                    │
│                                                                             │
│ DEQUE = STACK + QUEUE                                                       │
│ Can use as stack (addFirst/removeFirst)                                    │
│ Can use as queue (addLast/removeFirst)                                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

:::

::: example

```
REAL-WORLD APPLICATIONS:

1. BROWSER HISTORY:
   - Add new pages to front
   - Can go back (from front)
   - Can go forward (from back)

2. UNDO/REDO WITH LIMIT:
   - Add new action to front
   - If too many, remove from back
   - Undo = remove from front

3. SLIDING WINDOW MAXIMUM:
   - Deque stores indices
   - Remove from front (out of window)
   - Remove from back (smaller elements)
   - Add to back (new elements)

4. PALINDROME CHECKING:
   - Add all characters
   - Compare front and back
   - Remove both if equal
```

:::

```java
// DEQUE IMPLEMENTATION USING CIRCULAR ARRAY
public class MyDeque<T> {
    private Object[] data;
    private int front;
    private int rear;
    private int size;
    private int capacity;

    public MyDeque(int capacity) {
        this.capacity = capacity;
        this.data = new Object[capacity];
        this.front = 0;
        this.rear = capacity - 1;
        this.size = 0;
    }

    // Add to front - O(1)
    public boolean addFirst(T item) {
        if (isFull()) return false;

        front = (front - 1 + capacity) % capacity;  // Move front back
        data[front] = item;
        size++;
        return true;
    }

    // Add to back - O(1)
    public boolean addLast(T item) {
        if (isFull()) return false;

        rear = (rear + 1) % capacity;  // Move rear forward
        data[rear] = item;
        size++;
        return true;
    }

    // Remove from front - O(1)
    @SuppressWarnings("unchecked")
    public T removeFirst() {
        if (isEmpty()) throw new RuntimeException("Deque is empty");

        T item = (T) data[front];
        front = (front + 1) % capacity;
        size--;
        return item;
    }

    // Remove from back - O(1)
    @SuppressWarnings("unchecked")
    public T removeLast() {
        if (isEmpty()) throw new RuntimeException("Deque is empty");

        T item = (T) data[rear];
        rear = (rear - 1 + capacity) % capacity;
        size--;
        return item;
    }

    @SuppressWarnings("unchecked")
    public T peekFirst() {
        if (isEmpty()) throw new RuntimeException("Deque is empty");
        return (T) data[front];
    }

    @SuppressWarnings("unchecked")
    public T peekLast() {
        if (isEmpty()) throw new RuntimeException("Deque is empty");
        return (T) data[rear];
    }

    public boolean isEmpty() { return size == 0; }
    public boolean isFull() { return size == capacity; }
    public int size() { return size; }
}
```

---

## 3.3 Monotonic Queue

::: pattern

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    MONOTONIC QUEUE - COMPLETE GUIDE                           ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────────┐
│ WHAT IS IT?                                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ A deque that maintains elements in MONOTONIC order                          │
│ (either increasing or decreasing).                                          │
│                                                                             │
│ MONOTONIC DECREASING QUEUE (for finding max):                               │
│ Elements from front to back: 8 > 6 > 5 > 3                                 │
│ Front is always the maximum!                                               │
│                                                                             │
│ MONOTONIC INCREASING QUEUE (for finding min):                               │
│ Elements from front to back: 2 < 4 < 7 < 9                                 │
│ Front is always the minimum!                                               │
│                                                                             │
│ HOW IT WORKS (Decreasing for max):                                          │
│ When adding element x:                                                      │
│ 1. Remove all elements from BACK that are smaller than x                   │
│ 2. Add x to back                                                           │
│ 3. Front is always the current maximum                                     │
│                                                                             │
│ WHY? Elements smaller than x will NEVER be the max while x exists!         │
│                                                                             │
│ KEY USE CASE: Sliding Window Maximum/Minimum in O(n)!                      │
└─────────────────────────────────────────────────────────────────────────────┘

EXAMPLE - SLIDING WINDOW MAXIMUM:
Array: [1, 3, -1, -3, 5, 3, 6, 7], Window size: 3

Window [1,3,-1]:
  Deque state: [3, -1]  (1 removed because 3 > 1)
  Max = 3

Window [3,-1,-3]:
  Deque state: [3, -1, -3]
  Max = 3

Window [-1,-3,5]:
  Deque state: [5]  (all removed because 5 > all)
  Max = 5

...and so on
```

:::

```java
// SLIDING WINDOW MAXIMUM USING MONOTONIC QUEUE
public class MonotonicQueue {

    // Returns array of maximums for each window
    public int[] maxSlidingWindow(int[] nums, int k) {
        if (nums == null || nums.length == 0) return new int[0];

        int n = nums.length;
        int[] result = new int[n - k + 1];
        Deque<Integer> deque = new LinkedList<>();  // Stores INDICES

        for (int i = 0; i < n; i++) {
            // Remove indices outside window
            while (!deque.isEmpty() && deque.peekFirst() < i - k + 1) {
                deque.pollFirst();
            }

            // Remove indices of smaller elements (they'll never be max)
            while (!deque.isEmpty() && nums[deque.peekLast()] < nums[i]) {
                deque.pollLast();
            }

            // Add current index
            deque.offerLast(i);

            // Window is complete, record max
            if (i >= k - 1) {
                result[i - k + 1] = nums[deque.peekFirst()];
            }
        }

        return result;
    }
}
```

::: memory

```
🧠 INTERVIEW KEY POINTS - MONOTONIC QUEUE:

1. "When to use Monotonic Queue?"
   → Sliding window min/max problems
   → Find next greater/smaller element
   → Stock span problems

2. "Time Complexity?"
   → O(n) overall
   → Each element added/removed at most once

3. "Why store indices instead of values?"
   → To check if element is within window
   → To know position for result array
```

:::

---

# PART 4: TREE VARIANTS

## 4.1 Binary Tree Types

::: map

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    BINARY TREE VARIANTS OVERVIEW                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

                        BINARY TREE
                            │
    ┌───────────┬───────────┼───────────┬───────────┐
    │           │           │           │           │
  FULL      COMPLETE     PERFECT    BALANCED    DEGENERATE
    │           │           │           │           │
    │           │           │           │           │
    ▼           ▼           ▼           ▼           ▼

FULL BINARY TREE:
Every node has 0 or 2 children (never 1)
        1
       / \
      2   3
     / \
    4   5

COMPLETE BINARY TREE:
All levels filled except possibly last
Last level has all nodes as far LEFT as possible
        1
       / \
      2   3
     / \  /
    4  5 6

PERFECT BINARY TREE:
All internal nodes have 2 children
All leaves at same level
        1
       / \
      2   3
     /\   /\
    4  5 6  7

BALANCED BINARY TREE:
Height of left and right subtrees differ by at most 1
(AVL tree is strictly balanced)
        4
       / \
      2   6
     /   / \
    1   5   7

DEGENERATE (Pathological):
Each parent has only one child
Essentially a linked list!
    1
     \
      2
       \
        3
```

:::

## 4.2 AVL Tree (Self-Balancing BST)

::: pattern

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                       AVL TREE - COMPLETE GUIDE                               ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────────┐
│ WHAT IS IT?                                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ A self-balancing Binary Search Tree where:                                  │
│ • For EVERY node: |height(left) - height(right)| ≤ 1                       │
│                                                                             │
│ INVENTED: 1962 by Adelson-Velsky and Landis                                │
│                                                                             │
│ WHY BALANCE MATTERS:                                                        │
│ Unbalanced BST: O(n) worst case (degenerates to linked list)               │
│ Balanced AVL:   O(log n) GUARANTEED for all operations!                    │
│                                                                             │
│ BALANCE FACTOR = height(left) - height(right)                              │
│ Valid values: -1, 0, +1                                                    │
│ If BF becomes -2 or +2, we ROTATE!                                         │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ ROTATIONS (The Key to Balance)                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ 4 CASES OF IMBALANCE:                                                       │
│                                                                             │
│ 1. LEFT-LEFT (LL) → Single Right Rotation                                  │
│        30                     20                                            │
│       /                      /  \                                           │
│      20          →         10    30                                         │
│     /                                                                       │
│    10                                                                       │
│                                                                             │
│ 2. RIGHT-RIGHT (RR) → Single Left Rotation                                 │
│    10                         20                                            │
│      \                       /  \                                           │
│       20         →         10    30                                         │
│         \                                                                   │
│          30                                                                 │
│                                                                             │
│ 3. LEFT-RIGHT (LR) → Left then Right Rotation                              │
│        30                    30                      25                     │
│       /                     /                       /  \                    │
│      20          →        25         →           20    30                   │
│        \                 /                                                  │
│         25             20                                                   │
│                                                                             │
│ 4. RIGHT-LEFT (RL) → Right then Left Rotation                              │
│    10                    10                         15                      │
│      \                     \                       /  \                     │
│       20        →           15       →           10    20                   │
│      /                        \                                             │
│     15                         20                                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

:::

```java
// AVL TREE IMPLEMENTATION
public class AVLTree {

    private class Node {
        int key, height;
        Node left, right;

        Node(int key) {
            this.key = key;
            this.height = 1;
        }
    }

    private Node root;

    // Get height of node
    private int height(Node node) {
        return node == null ? 0 : node.height;
    }

    // Get balance factor
    private int getBalance(Node node) {
        return node == null ? 0 : height(node.left) - height(node.right);
    }

    // Update height
    private void updateHeight(Node node) {
        node.height = 1 + Math.max(height(node.left), height(node.right));
    }

    // Right rotation (for LL case)
    private Node rightRotate(Node y) {
        Node x = y.left;
        Node T2 = x.right;

        // Rotate
        x.right = y;
        y.left = T2;

        // Update heights
        updateHeight(y);
        updateHeight(x);

        return x;  // New root
    }

    // Left rotation (for RR case)
    private Node leftRotate(Node x) {
        Node y = x.right;
        Node T2 = y.left;

        // Rotate
        y.left = x;
        x.right = T2;

        // Update heights
        updateHeight(x);
        updateHeight(y);

        return y;  // New root
    }

    // Insert
    public void insert(int key) {
        root = insertRec(root, key);
    }

    private Node insertRec(Node node, int key) {
        // 1. Standard BST insert
        if (node == null) return new Node(key);

        if (key < node.key) {
            node.left = insertRec(node.left, key);
        } else if (key > node.key) {
            node.right = insertRec(node.right, key);
        } else {
            return node;  // Duplicate keys not allowed
        }

        // 2. Update height
        updateHeight(node);

        // 3. Get balance factor
        int balance = getBalance(node);

        // 4. If unbalanced, there are 4 cases:

        // Left Left Case
        if (balance > 1 && key < node.left.key) {
            return rightRotate(node);
        }

        // Right Right Case
        if (balance < -1 && key > node.right.key) {
            return leftRotate(node);
        }

        // Left Right Case
        if (balance > 1 && key > node.left.key) {
            node.left = leftRotate(node.left);
            return rightRotate(node);
        }

        // Right Left Case
        if (balance < -1 && key < node.right.key) {
            node.right = rightRotate(node.right);
            return leftRotate(node);
        }

        return node;  // Balanced
    }

    // Delete
    public void delete(int key) {
        root = deleteRec(root, key);
    }

    private Node deleteRec(Node node, int key) {
        // 1. Standard BST delete
        if (node == null) return null;

        if (key < node.key) {
            node.left = deleteRec(node.left, key);
        } else if (key > node.key) {
            node.right = deleteRec(node.right, key);
        } else {
            // Node to delete found
            if (node.left == null || node.right == null) {
                node = (node.left != null) ? node.left : node.right;
            } else {
                // Find inorder successor
                Node temp = minValueNode(node.right);
                node.key = temp.key;
                node.right = deleteRec(node.right, temp.key);
            }
        }

        if (node == null) return null;

        // 2. Update height
        updateHeight(node);

        // 3. Rebalance
        int balance = getBalance(node);

        // Left Left
        if (balance > 1 && getBalance(node.left) >= 0) {
            return rightRotate(node);
        }

        // Left Right
        if (balance > 1 && getBalance(node.left) < 0) {
            node.left = leftRotate(node.left);
            return rightRotate(node);
        }

        // Right Right
        if (balance < -1 && getBalance(node.right) <= 0) {
            return leftRotate(node);
        }

        // Right Left
        if (balance < -1 && getBalance(node.right) > 0) {
            node.right = rightRotate(node.right);
            return leftRotate(node);
        }

        return node;
    }

    private Node minValueNode(Node node) {
        Node current = node;
        while (current.left != null) {
            current = current.left;
        }
        return current;
    }
}
```

---

## 4.3 Red-Black Tree

::: pattern

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    RED-BLACK TREE - COMPLETE GUIDE                            ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────────┐
│ WHAT IS IT?                                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ A self-balancing BST where each node has a COLOR (Red or Black)            │
│                                                                             │
│ INVENTED: 1972 by Rudolf Bayer (as "symmetric binary B-trees")             │
│ REFINED: 1978 by Leonidas Guibas and Robert Sedgewick                      │
│                                                                             │
│ PROPERTIES (MUST ALL BE TRUE):                                              │
│ 1. Every node is either RED or BLACK                                       │
│ 2. Root is always BLACK                                                    │
│ 3. Every leaf (NIL) is BLACK                                               │
│ 4. If node is RED, both children must be BLACK (no red-red parent-child)  │
│ 5. Every path from node to descendant NIL has same number of black nodes  │
│                                                                             │
│ VISUAL:                                                                     │
│         [13:B]                                                              │
│        /      \                                                            │
│    [8:R]      [17:R]                                                       │
│    /   \      /    \                                                       │
│ [1:B] [11:B] [15:B] [25:B]                                                 │
│        /             \                                                     │
│     [6:R]          [22:R]                                                  │
│                                                                             │
│ B = Black, R = Red                                                         │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ AVL vs RED-BLACK                                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ┌─────────────────────┬───────────────────┬────────────────────────────┐   │
│ │ Property            │ AVL Tree          │ Red-Black Tree             │   │
│ ├─────────────────────┼───────────────────┼────────────────────────────┤   │
│ │ Balance strictness  │ Strictly balanced │ Loosely balanced           │   │
│ │ Search              │ O(log n)          │ O(log n)                   │   │
│ │ Insert              │ Slower (more rot.)│ Faster (fewer rotations)   │   │
│ │ Delete              │ Slower            │ Faster                     │   │
│ │ Height              │ 1.44 * log(n)     │ 2 * log(n)                 │   │
│ │ Used in             │ Databases         │ Java TreeMap, C++ map      │   │
│ └─────────────────────┴───────────────────┴────────────────────────────┘   │
│                                                                             │
│ WHEN TO USE:                                                                │
│ • AVL: Lookup-heavy applications (more balanced = faster search)           │
│ • RB: Insert/Delete-heavy (fewer rotations = faster modifications)         │
└─────────────────────────────────────────────────────────────────────────────┘
```

:::

::: memory

```
🧠 INTERVIEW KEY POINTS - TREE VARIANTS:

1. "Difference between AVL and Red-Black?"
   → AVL: More balanced, better for lookups
   → RB: Less rotations, better for inserts/deletes
   → Both guarantee O(log n)

2. "Which does Java TreeMap use?"
   → Red-Black Tree

3. "When is BST O(n)?"
   → When degenerate (sorted insert)
   → Solution: Use self-balancing trees

4. "What's balance factor in AVL?"
   → height(left) - height(right)
   → Must be -1, 0, or 1
```

:::

---

# PART 5: HEAP VARIANTS

::: pattern

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                       HEAP VARIANTS - COMPLETE GUIDE                          ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────────┐
│ HEAP TYPES                                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ 1. MIN HEAP: Parent ≤ Children                                             │
│         1                                                                   │
│        / \                                                                  │
│       3   6                                                                 │
│      / \                                                                    │
│     5   9                                                                   │
│    Min at root!                                                            │
│                                                                             │
│ 2. MAX HEAP: Parent ≥ Children                                             │
│         9                                                                   │
│        / \                                                                  │
│       6   5                                                                 │
│      / \                                                                    │
│     3   1                                                                   │
│    Max at root!                                                            │
│                                                                             │
│ 3. BINARY HEAP: Most common, complete binary tree                          │
│                                                                             │
│ 4. D-ARY HEAP: Each node has D children (not just 2)                       │
│    - Shallower tree                                                        │
│    - Used in Dijkstra's algorithm optimization                             │
│                                                                             │
│ 5. FIBONACCI HEAP: Amortized O(1) for many operations                      │
│    - Used in advanced graph algorithms                                     │
│    - Complex implementation                                                 │
│                                                                             │
│ 6. BINOMIAL HEAP: Collection of binomial trees                             │
│    - Efficient merge: O(log n)                                             │
└─────────────────────────────────────────────────────────────────────────────┘

ARRAY REPRESENTATION OF BINARY HEAP:
For node at index i:
• Parent: (i - 1) / 2
• Left child: 2 * i + 1
• Right child: 2 * i + 2

Array: [1, 3, 6, 5, 9]
Tree:      1      (index 0)
          / \
         3   6    (index 1, 2)
        / \
       5   9      (index 3, 4)
```

:::

```java
// COMPLETE MIN HEAP IMPLEMENTATION
public class MinHeap {
    private int[] heap;
    private int size;
    private int capacity;

    public MinHeap(int capacity) {
        this.capacity = capacity;
        this.heap = new int[capacity];
        this.size = 0;
    }

    // Helper methods
    private int parent(int i) { return (i - 1) / 2; }
    private int leftChild(int i) { return 2 * i + 1; }
    private int rightChild(int i) { return 2 * i + 2; }

    private void swap(int i, int j) {
        int temp = heap[i];
        heap[i] = heap[j];
        heap[j] = temp;
    }

    // Insert - O(log n)
    public void insert(int val) {
        if (size == capacity) {
            throw new RuntimeException("Heap is full");
        }

        // Add at end
        heap[size] = val;
        int current = size;
        size++;

        // Bubble UP (heapify up)
        while (current > 0 && heap[current] < heap[parent(current)]) {
            swap(current, parent(current));
            current = parent(current);
        }
    }

    // Extract min - O(log n)
    public int extractMin() {
        if (size == 0) {
            throw new RuntimeException("Heap is empty");
        }

        int min = heap[0];

        // Move last to root
        heap[0] = heap[size - 1];
        size--;

        // Bubble DOWN (heapify down)
        heapifyDown(0);

        return min;
    }

    private void heapifyDown(int i) {
        int smallest = i;
        int left = leftChild(i);
        int right = rightChild(i);

        if (left < size && heap[left] < heap[smallest]) {
            smallest = left;
        }
        if (right < size && heap[right] < heap[smallest]) {
            smallest = right;
        }

        if (smallest != i) {
            swap(i, smallest);
            heapifyDown(smallest);
        }
    }

    // Peek min - O(1)
    public int peekMin() {
        if (size == 0) {
            throw new RuntimeException("Heap is empty");
        }
        return heap[0];
    }

    // Decrease key - O(log n)
    public void decreaseKey(int i, int newVal) {
        if (newVal > heap[i]) {
            throw new RuntimeException("New value is greater than current");
        }
        heap[i] = newVal;

        // Bubble up
        while (i > 0 && heap[i] < heap[parent(i)]) {
            swap(i, parent(i));
            i = parent(i);
        }
    }

    // Delete any element - O(log n)
    public void delete(int i) {
        decreaseKey(i, Integer.MIN_VALUE);
        extractMin();
    }

    // Build heap from array - O(n)
    public static MinHeap buildHeap(int[] arr) {
        MinHeap heap = new MinHeap(arr.length * 2);
        heap.heap = arr.clone();
        heap.size = arr.length;

        // Start from last non-leaf and heapify down
        for (int i = arr.length / 2 - 1; i >= 0; i--) {
            heap.heapifyDown(i);
        }

        return heap;
    }

    public int size() { return size; }
    public boolean isEmpty() { return size == 0; }
}
```

---

# PART 6: HASH TABLE VARIANTS

::: pattern

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    HASH TABLE VARIANTS - COMPLETE GUIDE                       ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────────┐
│ COLLISION RESOLUTION STRATEGIES                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ 1. SEPARATE CHAINING (External Chaining):                                   │
│    Each bucket contains a linked list                                       │
│                                                                             │
│    Index 0: -> null                                                         │
│    Index 1: -> [15] -> [25] -> null  (15 % 10 = 5, 25 % 10 = 5)           │
│    Index 2: -> [12] -> null                                                │
│    ...                                                                      │
│                                                                             │
│    Pros: Simple, unlimited capacity                                        │
│    Cons: Extra memory for pointers, cache unfriendly                       │
│                                                                             │
│ 2. OPEN ADDRESSING (Probing):                                               │
│    Find another slot in same array                                         │
│                                                                             │
│    a) LINEAR PROBING: Try next slot                                        │
│       h(k), h(k)+1, h(k)+2, ...                                            │
│       Problem: Clustering                                                  │
│                                                                             │
│    b) QUADRATIC PROBING: Try squared distances                             │
│       h(k), h(k)+1², h(k)+2², h(k)+3², ...                                │
│       Better distribution                                                   │
│                                                                             │
│    c) DOUBLE HASHING: Use second hash function                             │
│       h(k), h(k)+h2(k), h(k)+2*h2(k), ...                                  │
│       Best distribution                                                     │
│                                                                             │
│ 3. ROBIN HOOD HASHING:                                                      │
│    Elements with larger "probe distance" steal from shorter ones           │
│    More uniform distribution                                                │
│                                                                             │
│ 4. CUCKOO HASHING:                                                          │
│    Two hash functions, two tables                                          │
│    O(1) worst case lookup!                                                 │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ JAVA HASH MAP VARIANTS                                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ HashMap:         Basic, not thread-safe, allows null                       │
│ LinkedHashMap:   Maintains insertion order                                 │
│ TreeMap:         Sorted by keys (Red-Black Tree)                           │
│ HashTable:       Thread-safe (legacy, use ConcurrentHashMap)               │
│ ConcurrentHashMap: Thread-safe, modern                                     │
│ WeakHashMap:     Keys can be garbage collected                             │
│ IdentityHashMap: Uses == instead of equals()                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

:::

---

# PART 7: QUICK REFERENCE - ALL VARIANTS

::: memory

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    DATA STRUCTURE SELECTION GUIDE                             ║
╚══════════════════════════════════════════════════════════════════════════════╝

LINKED LIST SELECTION:
┌─────────────────────────────────────────────────────────────────────────────┐
│ Need                            │ Use                                       │
│ ────────────────────────────────────────────────────────────────────────── │
│ Simple forward traversal        │ Singly Linked List                       │
│ Delete at tail / backward       │ Doubly Linked List                       │
│ Round-robin / cycling           │ Circular Linked List                     │
│ Both directions + cycling       │ Circular Doubly Linked List              │
│ O(log n) search in sorted list  │ Skip List                                │
│ LRU Cache                       │ Doubly Linked + HashMap                  │
└─────────────────────────────────────────────────────────────────────────────┘

QUEUE SELECTION:
┌─────────────────────────────────────────────────────────────────────────────┐
│ Need                            │ Use                                       │
│ ────────────────────────────────────────────────────────────────────────── │
│ Basic FIFO                      │ Simple Queue                             │
│ Fixed size, no wasted space     │ Circular Queue                           │
│ Add/remove both ends            │ Deque                                    │
│ Priority-based access           │ Priority Queue (Heap)                    │
│ Sliding window max/min          │ Monotonic Queue                          │
└─────────────────────────────────────────────────────────────────────────────┘

TREE SELECTION:
┌─────────────────────────────────────────────────────────────────────────────┐
│ Need                            │ Use                                       │
│ ────────────────────────────────────────────────────────────────────────── │
│ Basic sorted structure          │ BST                                      │
│ Guaranteed O(log n)             │ AVL or Red-Black Tree                    │
│ Lookup-heavy                    │ AVL Tree                                 │
│ Insert/Delete-heavy             │ Red-Black Tree                           │
│ Range queries                   │ Segment Tree                             │
│ Prefix operations               │ Trie                                     │
│ Top-k / Priority                │ Heap                                     │
│ Database index                  │ B-Tree / B+ Tree                         │
└─────────────────────────────────────────────────────────────────────────────┘

HASH TABLE SELECTION:
┌─────────────────────────────────────────────────────────────────────────────┐
│ Need                            │ Use                                       │
│ ────────────────────────────────────────────────────────────────────────── │
│ Basic key-value                 │ HashMap                                  │
│ Maintain insertion order        │ LinkedHashMap                            │
│ Sorted keys                     │ TreeMap                                  │
│ Thread-safe                     │ ConcurrentHashMap                        │
│ Only keys (no values)           │ HashSet                                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

:::

---

# 🏆 PRACTICE PROBLEMS BY DATA STRUCTURE

::: example

```
LINKED LIST PROBLEMS:
1. Reverse Linked List (LC 206) - Basic
2. Detect Cycle (LC 141) - Floyd's Algorithm
3. Merge Two Sorted Lists (LC 21) - Two pointer
4. LRU Cache (LC 146) - Doubly Linked + HashMap
5. Copy List with Random Pointer (LC 138) - Deep copy
6. Reverse Nodes in k-Group (LC 25) - Hard
7. Flatten Multilevel Doubly Linked (LC 430)

STACK/QUEUE PROBLEMS:
1. Valid Parentheses (LC 20) - Basic stack
2. Min Stack (LC 155) - Track minimum
3. Implement Queue using Stacks (LC 232)
4. Sliding Window Maximum (LC 239) - Monotonic queue
5. Daily Temperatures (LC 739) - Monotonic stack

TREE PROBLEMS:
1. Validate BST (LC 98) - Inorder check
2. Lowest Common Ancestor (LC 236) - Recursion
3. Serialize/Deserialize Tree (LC 297)
4. Range Sum BST (LC 938)
5. Kth Smallest in BST (LC 230)

HEAP PROBLEMS:
1. Kth Largest Element (LC 215)
2. Merge K Sorted Lists (LC 23)
3. Find Median from Data Stream (LC 295) - Two heaps
4. Top K Frequent Elements (LC 347)
```

:::

---

**END OF COMPREHENSIVE DATA STRUCTURE VARIANTS GUIDE**

This guide covers ALL major variants of data structures with:

- Complete understanding (WHAT/WHY/WHEN/HOW)
- Visual representations
- Full implementations in Java
- Real-world applications
- Interview key points
- Practice problems

---

# CURATED PRACTICE PROBLEMS — DS VARIANTS (Trie, Heap, Segment Tree, etc.)

> **HOW TO USE**: These cover advanced data structure variants. Attempt after mastering basic DS.

---

## Section 1: Trie Problems

| #   | Problem                              | Platform | Difficulty | Key Technique                   |
| --- | ------------------------------------ | -------- | ---------- | ------------------------------- |
| 1   | Implement Trie (LC 208)              | LeetCode | Medium     | insert/search/startsWith        |
| 2   | Design Add and Search Words (LC 211) | LeetCode | Medium     | Trie + DFS for '.' wildcard     |
| 3   | Word Search II (LC 212)              | LeetCode | Hard       | Trie + backtracking on grid     |
| 4   | Replace Words (LC 648)               | LeetCode | Medium     | Trie prefix matching            |
| 5   | Map Sum Pairs (LC 677)               | LeetCode | Medium     | Trie with value at nodes        |
| 6   | Longest Word in Dictionary (LC 720)  | LeetCode | Medium     | Trie + BFS/DFS for completeness |

---

## Section 2: Heap / Priority Queue Variants

| #   | Problem                               | Platform | Difficulty | Key Technique             |
| --- | ------------------------------------- | -------- | ---------- | ------------------------- |
| 1   | Kth Largest Element (LC 215)          | LeetCode | Medium     | Min heap of size k        |
| 2   | Top K Frequent Elements (LC 347)      | LeetCode | Medium     | Min heap by frequency     |
| 3   | Find Median from Data Stream (LC 295) | LeetCode | Hard       | Two heaps: max + min      |
| 4   | Merge k Sorted Lists (LC 23)          | LeetCode | Hard       | Min heap of list heads    |
| 5   | Reorganize String (LC 767)            | LeetCode | Medium     | Max heap by frequency     |
| 6   | K Closest Points to Origin (LC 973)   | LeetCode | Medium     | Max heap of size k        |
| 7   | Sliding Window Median (LC 480)        | LeetCode | Hard       | Two heaps + lazy deletion |

---

## Section 3: Monotonic Stack / Monotonic Queue

| #   | Problem                                | Platform | Difficulty | Key Technique                         |
| --- | -------------------------------------- | -------- | ---------- | ------------------------------------- |
| 1   | Next Greater Element I (LC 496)        | LeetCode | Easy       | Classic monotonic stack               |
| 2   | Daily Temperatures (LC 739)            | LeetCode | Medium     | Stack stores indices, decreasing      |
| 3   | Largest Rectangle in Histogram (LC 84) | LeetCode | Hard       | Monotonic stack for left/right bounds |
| 4   | Trapping Rain Water (LC 42)            | LeetCode | Hard       | Stack or two-pointer approach         |
| 5   | Online Stock Span (LC 901)             | LeetCode | Medium     | Stack with (price, span) pairs        |
| 6   | Sliding Window Maximum (LC 239)        | LeetCode | Hard       | Monotonic deque                       |

---

## HIDDEN GEMS — DS Variants

| #   | Problem                                      | Platform | Why It's Valuable                          |
| --- | -------------------------------------------- | -------- | ------------------------------------------ |
| 1   | Maximum Frequency Stack (LC 895)             | LeetCode | Stack per frequency — creative DS combo    |
| 2   | Stock Price Fluctuation (LC 2034)            | LeetCode | TreeMap + HashMap design                   |
| 3   | All O`one Data Structure (LC 432)            | LeetCode | Doubly linked list + HashMap (hard design) |
| 4   | Range Sum Query - Mutable (LC 307)           | LeetCode | Segment tree or BIT                        |
| 5   | Count of Smaller Numbers After Self (LC 315) | LeetCode | Merge sort or BIT — teaches augmented DS   |

---
