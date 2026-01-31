# 📚 Data Structures: Deep Dive Guide

## Understanding DS from Core - Behavior, Nature & Implementation

---

# PART 0: COMPLETE UNDERSTANDING + GROWTH MINDSET

```
╔══════════════════════════════════════════════════════════════════════════════╗
║         DATA STRUCTURES - COMPLETE UNDERSTANDING & GROWTH MINDSET            ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHAT ARE DATA STRUCTURES?                                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│ A DATA STRUCTURE is a way of ORGANIZING and STORING data so that we can     │
│ perform OPERATIONS efficiently.                                              │
│                                                                              │
│ KEY INSIGHT: It's not just about STORING data - it's about making certain   │
│ OPERATIONS fast!                                                             │
│                                                                              │
│ ANALOGY:                                                                     │
│ • Library with books thrown randomly → Hard to find books                   │
│ • Library with books sorted by topic → Easy to find by topic               │
│ • Library with books sorted by author → Easy to find by author             │
│                                                                              │
│ Same books, different ORGANIZATIONS, different SPEEDS for different tasks!  │
│                                                                              │
│ HISTORICAL EVOLUTION:                                                        │
│ • 1945: First computers - data just thrown in memory                        │
│ • 1950s: Arrays invented - need for sequential data                         │
│ • 1956: Linked Lists - need for dynamic size                                │
│ • 1960s: Stacks, Queues - need for order control                           │
│ • 1962: AVL Trees - need for balanced search                                │
│ • 1972: B-Trees - need for database indexing                                │
│ • 1984: Skip Lists - probabilistic alternative to trees                     │
│ • 1990s: Hash structures everywhere - O(1) lookup need                      │
│ • Today: Specialized DS for every use case                                  │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHAT PROBLEM DO DATA STRUCTURES SOLVE?                                       │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ CORE PROBLEM: OPERATIONS ARE TOO SLOW!                                       │
│                                                                              │
│ ┌───────────────────────────────────────────────────────────────────────┐   │
│ │ SCENARIO: 1 million user accounts                                     │   │
│ │                                                                       │   │
│ │ OPERATION          │ Unsorted List │ Sorted Array │ HashMap          │   │
│ │ ─────────────────────────────────────────────────────────────────────│   │
│ │ Find user by ID    │ 1 million ops │ 20 ops       │ 1 op             │   │
│ │ Add new user       │ 1 op          │ 1 million ops│ 1 op             │   │
│ │ Delete user        │ 1 million ops │ 1 million ops│ 1 op             │   │
│ │ List all users     │ 1 million ops │ 1 million ops│ 1 million ops    │   │
│ │                                                                       │   │
│ │ WHICH IS BEST? Depends on your MOST COMMON operation!                │   │
│ └───────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│ TRADE-OFF: Every DS is GOOD at some operations and BAD at others!           │
│ There is NO PERFECT data structure - only PERFECT CHOICE for your problem!  │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHY LEARN DATA STRUCTURES?                                                   │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ 1. PERFORMANCE: Same problem can be 1000x faster with right DS              │
│    • Example: Finding a word in dictionary                                   │
│      Linear search: Check all 170,000 words                                 │
│      Binary search: Check only 18 words!                                    │
│                                                                              │
│ 2. SCALABILITY: Programs must handle growth                                  │
│    • O(n²) works for 1000 items but crashes with 1 million                 │
│    • Right DS keeps O(log n) even at scale                                  │
│                                                                              │
│ 3. PROBLEM MODELING: DS helps you THINK about problems                      │
│    • Hierarchy? → Tree                                                       │
│    • Relationships? → Graph                                                  │
│    • Fast lookup? → HashMap                                                  │
│    • Order matters? → Stack/Queue                                           │
│                                                                              │
│ 4. FOUNDATION: Advanced concepts BUILD on DS                                 │
│    • Databases use B-Trees                                                   │
│    • Networks use Graphs                                                     │
│    • Compilers use Stacks                                                    │
│    • OS uses Queues                                                          │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ ⭐ GROWTH MINDSET: CHOOSING & CREATING DATA STRUCTURES ⭐                    │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ DON'T: "I need to memorize all data structures"                             │
│ DO: "I need to understand WHAT operations each DS optimizes for"            │
│                                                                              │
│ THE SELECTION FRAMEWORK:                                                     │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ 1. List ALL operations you need                                         │ │
│ │ 2. Mark which operations are MOST FREQUENT                              │ │
│ │ 3. Find DS that makes frequent operations FAST                          │ │
│ │ 4. Accept that rare operations might be slow                            │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ QUICK SELECTION GUIDE:                                                       │
│                                                                              │
│ NEED                           → USE                                        │
│ ────────────────────────────────────────────────────────────────────────── │
│ Fast access by index           → Array                                      │
│ Fast insert/delete anywhere    → LinkedList                                 │
│ LIFO (Last In First Out)       → Stack                                      │
│ FIFO (First In First Out)      → Queue                                      │
│ Fast lookup by key             → HashMap                                    │
│ Fast lookup + sorted order     → TreeMap                                    │
│ Unique elements only           → Set                                        │
│ Hierarchical relationships     → Tree                                       │
│ Complex relationships          → Graph                                      │
│ Priority-based access          → Heap/PriorityQueue                        │
│                                                                              │
│ WHEN NO EXISTING DS FITS → CREATE YOUR OWN BY COMBINING!                    │
│                                                                              │
│ Examples:                                                                    │
│ • LRU Cache = HashMap + DoublyLinkedList                                   │
│ • MinStack = Stack + Stack (for mins)                                       │
│ • Trie = Tree with characters as edges                                      │
│ • Graph with fast lookup = Adjacency List using HashMap                     │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ DIFFICULTIES IN LEARNING DATA STRUCTURES                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ 1. OVERWHELMING NUMBER:                                                      │
│    "There are too many DS to learn!"                                        │
│    Solution: Master the 10 core DS first, rest are variations               │
│    Core: Array, List, Stack, Queue, HashMap, Set, Tree, Heap, Graph, Trie  │
│                                                                              │
│ 2. CONFUSION ABOUT WHEN TO USE:                                              │
│    "I know the DS but don't know when to use it"                            │
│    Solution: Focus on OPERATIONS each DS optimizes                          │
│                                                                              │
│ 3. IMPLEMENTATION VS CONCEPT:                                                │
│    "I understand concept but can't implement"                               │
│    Solution: Draw pictures first, code follows naturally                    │
│                                                                              │
│ 4. TRADE-OFFS CONFUSING:                                                     │
│    "Array is O(1) access, HashMap is O(1) access - what's the difference?" │
│    Solution: Understand WHAT operation is O(1) in each                      │
│    Array: O(1) by INDEX    HashMap: O(1) by KEY                            │
│                                                                              │
│ 5. NOT SEEING CONNECTIONS:                                                   │
│    "Each DS feels completely different"                                     │
│    Solution: See how DS COMBINE and BUILD on each other                     │
│    TreeMap = Tree + Map behavior                                            │
│    HashSet = HashMap with only keys                                         │
│    PriorityQueue = Heap implementation                                      │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ EXPECTED OUTPUTS OF MASTERING DATA STRUCTURES                                │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ ✅ INSTANT RECOGNITION: See problem → Know which DS fits                    │
│ ✅ TRADE-OFF ANALYSIS: Understand costs of each choice                      │
│ ✅ COMBINATION SKILLS: Combine DS to solve complex problems                 │
│ ✅ IMPLEMENTATION: Code any DS from scratch                                  │
│ ✅ DEBUGGING: Recognize DS-related bugs quickly                             │
│ ✅ OPTIMIZATION: Know when to switch DS for better performance             │
│ ✅ CREATION: Design custom DS when needed                                   │
│                                                                              │
│ THE TRANSFORMATION:                                                          │
│ FROM: "I'll try arrays for everything"                                      │
│   TO: "I'll choose the RIGHT DS for each operation"                         │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

# PART 1: WHY DATA STRUCTURES EXIST

## The Origin Story

```
1950s: Computers had LIMITED memory (few KB)
       ↓
Problem: How to organize data efficiently?
       ↓
Solution: Data Structures were born!

Every DS was created to solve a SPECIFIC problem:
- Array: Fast access by position
- LinkedList: Fast insertion/deletion
- Stack: Last-In-First-Out needed
- Queue: First-In-First-Out needed
- Tree: Hierarchical data
- Graph: Relationships between entities
- HashMap: O(1) lookup
```

---

# PART 2: ARRAYS

## 🧬 Nature & Behavior

### What is an Array?

```
PHYSICAL REALITY:
┌────────────────────────────────────────────────────┐
│ Memory is a long tape of numbered boxes            │
│                                                    │
│ Address: 1000  1004  1008  1012  1016  1020       │
│          ┌────┬────┬────┬────┬────┬────┐         │
│          │ 10 │ 20 │ 30 │ 40 │ 50 │ 60 │         │
│          └────┴────┴────┴────┴────┴────┘         │
│          arr[0] arr[1] arr[2] arr[3] arr[4] arr[5]│
│                                                    │
│ CONTIGUOUS = Next to each other in memory         │
└────────────────────────────────────────────────────┘

WHY CONTIGUOUS MATTERS:
- arr[3] = baseAddress + (3 × elementSize)
- arr[3] = 1000 + (3 × 4) = 1012
- This is O(1) random access!
```

### Array Characteristics

| Property         | Value      | Why?                       |
| ---------------- | ---------- | -------------------------- |
| Access           | O(1)       | Direct address calculation |
| Search           | O(n)       | Must check each element    |
| Insert at end    | O(1)       | If space available         |
| Insert at middle | O(n)       | Must shift elements        |
| Delete           | O(n)       | Must shift elements        |
| Memory           | Contiguous | Fixed block needed         |

### 🔴 Real-World Origin: Supermarket Inventory (1950s)

```
PROBLEM (1957 - IBM):
- Supermarket needed to track 10,000 products
- Each product has: ID, Name, Price, Quantity
- Need to look up product by ID quickly

BEFORE ARRAYS:
- Products stored in random memory locations
- Finding product #5000 required searching 5000 locations
- Time: O(n) for every lookup

SOLUTION - ARRAY:
- Store products in consecutive memory
- Product ID = Array Index
- products[5000] = instant access!

AFTER IMPLEMENTATION:
- Lookup time: O(1)
- Inventory checks: 1000x faster
- Made modern retail possible!
```

## 💻 Implementation WITHOUT Collections

```java
public class MyArray {
    private int[] data;
    private int size;
    private int capacity;

    // Constructor
    public MyArray(int capacity) {
        this.capacity = capacity;
        this.data = new int[capacity];
        this.size = 0;
    }

    // GET - O(1)
    public int get(int index) {
        if (index < 0 || index >= size) {
            throw new IndexOutOfBoundsException("Index: " + index);
        }
        return data[index];
    }

    // SET - O(1)
    public void set(int index, int value) {
        if (index < 0 || index >= size) {
            throw new IndexOutOfBoundsException("Index: " + index);
        }
        data[index] = value;
    }

    // ADD at end - O(1) amortized
    public void add(int value) {
        if (size == capacity) {
            resize();  // O(n) but rare
        }
        data[size++] = value;
    }

    // INSERT at index - O(n)
    public void insert(int index, int value) {
        if (size == capacity) {
            resize();
        }
        // Shift elements right
        for (int i = size; i > index; i--) {
            data[i] = data[i - 1];
        }
        data[index] = value;
        size++;
    }

    // DELETE at index - O(n)
    public int delete(int index) {
        int removed = data[index];
        // Shift elements left
        for (int i = index; i < size - 1; i++) {
            data[i] = data[i + 1];
        }
        size--;
        return removed;
    }

    // RESIZE - O(n)
    private void resize() {
        capacity *= 2;
        int[] newData = new int[capacity];
        for (int i = 0; i < size; i++) {
            newData[i] = data[i];
        }
        data = newData;
    }

    // SEARCH - O(n)
    public int search(int value) {
        for (int i = 0; i < size; i++) {
            if (data[i] == value) return i;
        }
        return -1;
    }

    // SIZE - O(1)
    public int size() {
        return size;
    }
}
```

## 🎯 LeetCode Problems → Real-World Connection

### Problem: Two Sum

```
REAL-WORLD ORIGIN: Financial Trading System (1990s)

PROBLEM AT GOLDMAN SACHS:
- Traders needed to find pairs of stocks
- Stock A price + Stock B price = Target budget
- Thousands of stocks, milliseconds to decide

BEFORE OPTIMIZATION:
for each stock A:
    for each stock B:
        if A + B == target: found!
Time: O(n²) = Too slow for real-time trading

SOLUTION THINKING PROCESS:
1. "We're checking same pairs multiple times"
2. "What if we remember what we've seen?"
3. "HashMap! Store value → index"
4. "For each stock, check if complement exists"

AFTER (Your Two Sum solution):
- O(n) time complexity
- Real-time trading possible
- This pattern now used in ALL trading systems
```

---

# PART 3: LINKED LIST

## 🧬 Nature & Behavior

### What is a Linked List?

```
PHYSICAL REALITY:
┌────────────────────────────────────────────────────┐
│ Nodes scattered across memory, connected by refs   │
│                                                    │
│  ┌────┬────┐    ┌────┬────┐    ┌────┬────┐       │
│  │ 10 │ ●──┼───→│ 20 │ ●──┼───→│ 30 │null│       │
│  └────┴────┘    └────┴────┘    └────┴────┘       │
│  addr: 5000     addr: 2000     addr: 8000        │
│                                                    │
│ NOT CONTIGUOUS = Scattered in memory              │
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

# PART 4: STACK

## 🧬 Nature & Behavior

### What is a Stack?

```
PHYSICAL REALITY - Like a stack of plates:
┌────────────────────────────────────────────────────┐
│                                                    │
│   TOP →  ┌─────┐                                  │
│          │  5  │  ← Last In, First Out (LIFO)     │
│          ├─────┤                                  │
│          │  4  │                                  │
│          ├─────┤                                  │
│          │  3  │                                  │
│          ├─────┤                                  │
│          │  2  │                                  │
│          ├─────┤                                  │
│          │  1  │                                  │
│          └─────┘                                  │
│                                                    │
│   PUSH: Add to top                                │
│   POP: Remove from top                            │
│   PEEK: Look at top without removing              │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Stack Operations

| Operation    | Time | Description                 |
| ------------ | ---- | --------------------------- |
| push(x)      | O(1) | Add element to top          |
| pop()        | O(1) | Remove and return top       |
| peek()/top() | O(1) | Return top without removing |
| isEmpty()    | O(1) | Check if stack is empty     |
| size()       | O(1) | Return number of elements   |

### 🔴 Real-World Origin: Function Call Management (1960s)

```
PROBLEM (Early Computers):
- Programs call functions
- Functions call other functions
- How to remember where to return?

EXAMPLE:
main() calls A()
    A() calls B()
        B() calls C()
        C() returns to B
    B() returns to A
A() returns to main

WITHOUT STACK:
- No way to track return addresses
- Programs would get lost!

SOLUTION - CALL STACK:
┌─────────────┐
│ C() addr    │ ← Top (current)
├─────────────┤
│ B() addr    │
├─────────────┤
│ A() addr    │
├─────────────┤
│ main() addr │
└─────────────┘

When C() returns → pop → go to B()
When B() returns → pop → go to A()

THIS IS WHY:
- StackOverflowError exists (too many calls)
- Recursion works (each call pushed to stack)
- Debuggers show "call stack"
```

## 💻 Implementation WITHOUT Collections

```java
public class MyStack {
    private int[] data;
    private int top;
    private int capacity;

    public MyStack(int capacity) {
        this.capacity = capacity;
        this.data = new int[capacity];
        this.top = -1;  // Empty stack
    }

    // PUSH - O(1)
    public void push(int value) {
        if (top == capacity - 1) {
            throw new RuntimeException("Stack Overflow!");
        }
        data[++top] = value;
    }

    // POP - O(1)
    public int pop() {
        if (isEmpty()) {
            throw new RuntimeException("Stack Underflow!");
        }
        return data[top--];
    }

    // PEEK - O(1)
    public int peek() {
        if (isEmpty()) {
            throw new RuntimeException("Stack is empty!");
        }
        return data[top];
    }

    // IS EMPTY - O(1)
    public boolean isEmpty() {
        return top == -1;
    }

    // SIZE - O(1)
    public int size() {
        return top + 1;
    }
}

// LINKED LIST BASED STACK (No size limit)
public class MyLinkedStack {
    private class Node {
        int data;
        Node next;
        Node(int data) { this.data = data; }
    }

    private Node top;
    private int size;

    public void push(int value) {
        Node newNode = new Node(value);
        newNode.next = top;
        top = newNode;
        size++;
    }

    public int pop() {
        if (top == null) throw new RuntimeException("Empty!");
        int value = top.data;
        top = top.next;
        size--;
        return value;
    }

    public int peek() {
        if (top == null) throw new RuntimeException("Empty!");
        return top.data;
    }

    public boolean isEmpty() {
        return top == null;
    }
}
```

## 🎯 LeetCode → Real-World Connection

### Problem: Valid Parentheses

```
REAL-WORLD ORIGIN: Compiler Design (1960s)

PROBLEM AT MIT (1962):
- Compilers need to parse code
- Code has nested structures: if { while { } }
- How to verify brackets match correctly?

BAD CODE:
if (x > 0 {    // Missing )
    while (y) }  // Wrong bracket
}

COMPILER NEEDS TO DETECT THIS!

SOLUTION THINKING:
1. "When I see '(', I expect ')' later"
2. "When I see '{', I expect '}' later"
3. "Most recent open bracket closes first"
4. "That's LIFO - use a STACK!"

ALGORITHM:
- See '(' → push ')'
- See '{' → push '}'
- See ')' → pop, check if matches
- End: stack should be empty

NOW USED IN:
- Every compiler (GCC, javac, clang)
- Every IDE (syntax highlighting)
- Every code editor (bracket matching)
- HTML validators
- JSON parsers
```

---

# PART 5: QUEUE

## 🧬 Nature & Behavior

### What is a Queue?

```
PHYSICAL REALITY - Like a line at a store:
┌────────────────────────────────────────────────────┐
│                                                    │
│  FRONT                               BACK         │
│    ↓                                  ↓           │
│  ┌───┬───┬───┬───┬───┐                           │
│  │ 1 │ 2 │ 3 │ 4 │ 5 │                           │
│  └───┴───┴───┴───┴───┘                           │
│    ↑                 ↑                            │
│  Dequeue          Enqueue                        │
│  (Remove)         (Add)                          │
│                                                    │
│  FIFO = First In, First Out                       │
│  "First come, first served"                       │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Queue Operations

| Operation           | Time | Description       |
| ------------------- | ---- | ----------------- |
| enqueue(x)/offer(x) | O(1) | Add to back       |
| dequeue()/poll()    | O(1) | Remove from front |
| peek()/front()      | O(1) | See front element |
| isEmpty()           | O(1) | Check if empty    |

### 🔴 Real-World Origin: Print Spooler (1970s)

```
PROBLEM (Office with 1 printer, 50 computers):
- Multiple users send print jobs
- Printer can only do one job at a time
- Who prints first?

WITHOUT QUEUE:
- Last person to click "Print" goes first
- People who clicked earlier wait forever
- Unfair and chaotic!

SOLUTION - PRINT QUEUE:
- Jobs added to back of queue
- Printer takes from front
- First submitted = First printed

PRINT QUEUE:
┌────────────────────────────────────────┐
│ Front                            Back  │
│ [Job1] → [Job2] → [Job3] → [Job4]     │
│   ↑                              ↑     │
│ Printing                    New jobs   │
└────────────────────────────────────────┘

NOW USED IN:
- Operating System task scheduling
- Web server request handling
- Message queues (Kafka, RabbitMQ)
- Breadth-First Search algorithm
```

## 💻 Implementation WITHOUT Collections

```java
// CIRCULAR ARRAY QUEUE (Most efficient)
public class MyQueue {
    private int[] data;
    private int front;
    private int rear;
    private int size;
    private int capacity;

    public MyQueue(int capacity) {
        this.capacity = capacity;
        this.data = new int[capacity];
        this.front = 0;
        this.rear = -1;
        this.size = 0;
    }

    // ENQUEUE - O(1)
    public void enqueue(int value) {
        if (size == capacity) {
            throw new RuntimeException("Queue is full!");
        }
        rear = (rear + 1) % capacity;  // Circular
        data[rear] = value;
        size++;
    }

    // DEQUEUE - O(1)
    public int dequeue() {
        if (isEmpty()) {
            throw new RuntimeException("Queue is empty!");
        }
        int value = data[front];
        front = (front + 1) % capacity;  // Circular
        size--;
        return value;
    }

    // PEEK - O(1)
    public int peek() {
        if (isEmpty()) {
            throw new RuntimeException("Queue is empty!");
        }
        return data[front];
    }

    public boolean isEmpty() {
        return size == 0;
    }

    public int size() {
        return size;
    }
}

// WHY CIRCULAR?
/*
Without circular, after many operations:
[_, _, _, 5, 6, 7, _, _, _]
        ↑        ↑
      front    rear

Wasted space at beginning!

With circular, rear wraps around:
[8, 9, _, 5, 6, 7]
      ↑  ↑
    rear front

No wasted space!
*/
```

## 🎯 LeetCode → Real-World Connection

### Problem: Number of Islands (BFS with Queue)

```
REAL-WORLD ORIGIN: Google Maps (2005)

PROBLEM:
- Satellite images show land and water
- Need to count distinct landmasses
- Need to identify boundaries of each island

INITIAL APPROACH:
- Manual counting by humans
- Time: Weeks for one region
- Cost: Millions of dollars

SOLUTION - BFS:
1. Find a land pixel
2. Use queue to explore all connected land
3. Mark as visited
4. Count increments by 1
5. Repeat for unexplored land

WHY BFS (Queue) NOT DFS (Stack)?
- BFS explores in "waves" from starting point
- Natural for geographic spreading
- Won't get stuck in long narrow peninsulas

IMPACT:
- Automated island counting
- Ocean mapping
- Disease spread modeling (same algorithm!)
- Network connectivity analysis
```

---

# PART 6: HASH TABLE

## 🧬 Nature & Behavior

### What is a Hash Table?

```
CONCEPT:
- Transform key into array index using hash function
- Store value at that index
- Retrieve in O(1) average time

EXAMPLE: Phone Book
┌────────────────────────────────────────────────────┐
│ Name "Alice" → hash("Alice") → 3                  │
│                                                    │
│ Index: 0      1      2      3      4      5       │
│      ┌──────┬──────┬──────┬──────┬──────┬──────┐ │
│      │      │ Bob  │      │Alice │      │Carol │ │
│      │      │555-  │      │555-  │      │555-  │ │
│      │      │1234  │      │5678  │      │9999  │ │
│      └──────┴──────┴──────┴──────┴──────┴──────┘ │
│                                                    │
│ get("Alice") → hash("Alice") → 3 → return 555-5678│
│ Time: O(1)!                                       │
└────────────────────────────────────────────────────┘
```

### Collision Handling

```
PROBLEM: hash("Alice") = 3, hash("David") = 3
Two keys hash to same index!

SOLUTION 1: CHAINING (LinkedList at each index)
Index 3: Alice → David → null

SOLUTION 2: OPEN ADDRESSING (Find next empty)
Index 3: Alice
Index 4: David (probe to next)
```

### 🔴 Real-World Origin: Symbol Tables in Compilers (1953)

```
PROBLEM (IBM 701 Compiler):
- Program has thousands of variable names
- Need to look up variable type/value quickly
- Linear search through all variables: TOO SLOW

BEFORE HASH TABLES:
variables = [
    {name: "x", type: "int"},
    {name: "y", type: "float"},
    ... 10,000 more ...
]
lookup("x") → search all 10,000 → O(n)

SOLUTION BY H.P. LUHN (1953):
"What if we could calculate the position directly?"

hash("x") = some_formula("x") → index 42
variables[42] = {name: "x", type: "int"}
lookup("x") → O(1)!

IMPACT:
- Compilers became 100x faster
- Databases became possible
- Every modern language has HashMap
```

## 💻 Implementation WITHOUT Collections

```java
public class MyHashMap {
    private class Entry {
        int key;
        int value;
        Entry next;  // For chaining

        Entry(int key, int value) {
            this.key = key;
            this.value = value;
        }
    }

    private Entry[] buckets;
    private int capacity;
    private int size;
    private static final double LOAD_FACTOR = 0.75;

    public MyHashMap() {
        this.capacity = 16;
        this.buckets = new Entry[capacity];
        this.size = 0;
    }

    // HASH FUNCTION
    private int hash(int key) {
        return Math.abs(key) % capacity;
    }

    // PUT - O(1) average
    public void put(int key, int value) {
        if ((double) size / capacity >= LOAD_FACTOR) {
            resize();
        }

        int index = hash(key);
        Entry current = buckets[index];

        // Check if key exists
        while (current != null) {
            if (current.key == key) {
                current.value = value;  // Update
                return;
            }
            current = current.next;
        }

        // Add new entry at head (O(1))
        Entry newEntry = new Entry(key, value);
        newEntry.next = buckets[index];
        buckets[index] = newEntry;
        size++;
    }

    // GET - O(1) average
    public int get(int key) {
        int index = hash(key);
        Entry current = buckets[index];

        while (current != null) {
            if (current.key == key) {
                return current.value;
            }
            current = current.next;
        }
        return -1;  // Not found
    }

    // REMOVE - O(1) average
    public void remove(int key) {
        int index = hash(key);
        Entry current = buckets[index];
        Entry prev = null;

        while (current != null) {
            if (current.key == key) {
                if (prev == null) {
                    buckets[index] = current.next;
                } else {
                    prev.next = current.next;
                }
                size--;
                return;
            }
            prev = current;
            current = current.next;
        }
    }

    // CONTAINS - O(1) average
    public boolean containsKey(int key) {
        return get(key) != -1;
    }

    // RESIZE - O(n) but rare
    private void resize() {
        Entry[] oldBuckets = buckets;
        capacity *= 2;
        buckets = new Entry[capacity];
        size = 0;

        for (Entry head : oldBuckets) {
            while (head != null) {
                put(head.key, head.value);
                head = head.next;
            }
        }
    }

    public int size() {
        return size;
    }
}
```

## 🎯 LeetCode → Real-World Connection

### Problem: LRU Cache

```
REAL-WORLD ORIGIN: Web Browser Cache (1990s)

PROBLEM AT NETSCAPE (1994):
- Browser loads images from internet
- Loading same image again = slow
- Store recently viewed images in memory
- Memory is limited (16MB in 1994!)

QUESTIONS:
1. How to quickly check if image is cached? → HashMap
2. Which image to remove when full? → Least Recently Used
3. How to track "recently used"? → Linked List

SOLUTION - HashMap + Doubly Linked List:
┌─────────────────────────────────────────────┐
│  HashMap: url → Node                        │
│  LinkedList: Most Recent ←→ ... ←→ Least   │
│                                             │
│  Access image:                              │
│  1. O(1) lookup in HashMap                  │
│  2. O(1) move to front of list              │
│                                             │
│  Cache full? Remove tail (LRU)              │
└─────────────────────────────────────────────┘

IMPACT:
- Every browser uses this
- Every database uses this
- Every CDN (Cloudflare, Akamai) uses this
- Redis, Memcached are based on this
```

---

# PART 7: TREES

## 🧬 Nature & Behavior

### What is a Tree?

```
HIERARCHICAL STRUCTURE:
┌────────────────────────────────────────────────────┐
│                                                    │
│              ┌───┐                                │
│              │ A │  ← Root                        │
│              └─┬─┘                                │
│         ┌─────┴─────┐                            │
│         ▼           ▼                            │
│      ┌───┐       ┌───┐                          │
│      │ B │       │ C │  ← Children of A         │
│      └─┬─┘       └─┬─┘                          │
│     ┌──┴──┐     ┌──┴──┐                        │
│     ▼     ▼     ▼     ▼                        │
│   ┌───┐ ┌───┐ ┌───┐ ┌───┐                     │
│   │ D │ │ E │ │ F │ │ G │  ← Leaves           │
│   └───┘ └───┘ └───┘ └───┘                     │
│                                                │
│ Properties:                                   │
│ - One root node                               │
│ - Each node has 0+ children                   │
│ - No cycles                                   │
│ - One path from root to any node              │
│                                                │
└────────────────────────────────────────────────────┘
```

### Binary Search Tree (BST)

```
BST PROPERTY:
- Left subtree: all values < node
- Right subtree: all values > node

          ┌───┐
          │ 8 │
          └─┬─┘
      ┌────┴────┐
      ▼         ▼
   ┌───┐     ┌───┐
   │ 3 │     │10 │
   └─┬─┘     └─┬─┘
  ┌──┴──┐     └──┐
  ▼     ▼        ▼
┌───┐ ┌───┐   ┌───┐
│ 1 │ │ 6 │   │14 │
└───┘ └───┘   └───┘

Search for 6:
8 → 6 < 8 → go left
3 → 6 > 3 → go right
6 → FOUND!

Time: O(log n) for balanced tree
```

### 🔴 Real-World Origin: File Systems (1965)

```
PROBLEM (UNIX, 1969):
- Computer needs to organize thousands of files
- Need hierarchical structure (folders in folders)
- Need fast file lookup

SOLUTION - TREE STRUCTURE:
/
├── home/
│   ├── alice/
│   │   ├── documents/
│   │   └── photos/
│   └── bob/
├── usr/
│   ├── bin/
│   └── lib/
└── etc/

WHY TREE?
- Natural hierarchy (parent-child)
- Path from root to any file
- Easy to navigate (cd, ls commands)

IMPACT:
- Every OS uses tree for files
- Every website URL is a tree path
- Every organization chart is a tree
- Every family tree is... a tree!
```

## 💻 Implementation WITHOUT Collections

```java
public class MyBinaryTree {

    private class TreeNode {
        int value;
        TreeNode left;
        TreeNode right;

        TreeNode(int value) {
            this.value = value;
        }
    }

    private TreeNode root;

    // INSERT (BST) - O(log n) average
    public void insert(int value) {
        root = insertRecursive(root, value);
    }

    private TreeNode insertRecursive(TreeNode node, int value) {
        if (node == null) {
            return new TreeNode(value);
        }

        if (value < node.value) {
            node.left = insertRecursive(node.left, value);
        } else if (value > node.value) {
            node.right = insertRecursive(node.right, value);
        }

        return node;
    }

    // SEARCH - O(log n) average
    public boolean search(int value) {
        return searchRecursive(root, value);
    }

    private boolean searchRecursive(TreeNode node, int value) {
        if (node == null) return false;
        if (node.value == value) return true;

        if (value < node.value) {
            return searchRecursive(node.left, value);
        } else {
            return searchRecursive(node.right, value);
        }
    }

    // INORDER TRAVERSAL (Left, Root, Right) - Gives sorted order!
    public void inorder() {
        inorderRecursive(root);
    }

    private void inorderRecursive(TreeNode node) {
        if (node == null) return;
        inorderRecursive(node.left);
        System.out.print(node.value + " ");
        inorderRecursive(node.right);
    }

    // PREORDER TRAVERSAL (Root, Left, Right)
    public void preorder() {
        preorderRecursive(root);
    }

    private void preorderRecursive(TreeNode node) {
        if (node == null) return;
        System.out.print(node.value + " ");
        preorderRecursive(node.left);
        preorderRecursive(node.right);
    }

    // POSTORDER TRAVERSAL (Left, Right, Root)
    public void postorder() {
        postorderRecursive(root);
    }

    private void postorderRecursive(TreeNode node) {
        if (node == null) return;
        postorderRecursive(node.left);
        postorderRecursive(node.right);
        System.out.print(node.value + " ");
    }

    // HEIGHT - O(n)
    public int height() {
        return heightRecursive(root);
    }

    private int heightRecursive(TreeNode node) {
        if (node == null) return 0;
        int leftHeight = heightRecursive(node.left);
        int rightHeight = heightRecursive(node.right);
        return 1 + Math.max(leftHeight, rightHeight);
    }

    // DELETE - O(log n) average
    public void delete(int value) {
        root = deleteRecursive(root, value);
    }

    private TreeNode deleteRecursive(TreeNode node, int value) {
        if (node == null) return null;

        if (value < node.value) {
            node.left = deleteRecursive(node.left, value);
        } else if (value > node.value) {
            node.right = deleteRecursive(node.right, value);
        } else {
            // Found node to delete

            // Case 1: Leaf node
            if (node.left == null && node.right == null) {
                return null;
            }

            // Case 2: One child
            if (node.left == null) return node.right;
            if (node.right == null) return node.left;

            // Case 3: Two children
            // Find inorder successor (smallest in right subtree)
            TreeNode successor = findMin(node.right);
            node.value = successor.value;
            node.right = deleteRecursive(node.right, successor.value);
        }

        return node;
    }

    private TreeNode findMin(TreeNode node) {
        while (node.left != null) {
            node = node.left;
        }
        return node;
    }
}
```

---

# PART 8: HEAPS (PRIORITY QUEUE)

## 🧬 Nature & Behavior

### What is a Heap?

```
HEAP = Complete Binary Tree with Heap Property

MAX HEAP: Parent ≥ Children
          ┌───┐
          │100│
          └─┬─┘
       ┌───┴───┐
       ▼       ▼
     ┌───┐   ┌───┐
     │ 90│   │ 80│
     └─┬─┘   └─┬─┘
    ┌──┴──┐  ┌─┘
    ▼     ▼  ▼
  ┌───┐┌───┐┌───┐
  │70 ││60 ││50 │
  └───┘└───┘└───┘

MIN HEAP: Parent ≤ Children
(Root is smallest)

STORED AS ARRAY (Level order):
[100, 90, 80, 70, 60, 50]
  0   1   2   3   4   5

Parent of i: (i-1)/2
Left child of i: 2*i + 1
Right child of i: 2*i + 2
```

### 🔴 Real-World Origin: Emergency Room Triage (1970s)

```
PROBLEM IN HOSPITALS:
- Patients arrive randomly
- Some are critical, some are minor
- Need to treat most urgent first
- NOT first-come-first-served!

WITHOUT PRIORITY QUEUE:
- Check all patients to find most urgent
- Time: O(n) for each decision
- Lives lost due to delay!

WITH HEAP (Priority Queue):
- Insert patient with priority: O(log n)
- Get most urgent: O(1)
- Remove most urgent: O(log n)

EXAMPLE:
Patient arrives: priority 5 (medium)
Patient arrives: priority 9 (critical)
Patient arrives: priority 3 (minor)

Heap: [9, 5, 3]
Next patient to treat: 9 (critical) - O(1)!

NOW USED IN:
- OS process scheduling (highest priority process)
- Network packet prioritization
- Dijkstra's shortest path algorithm
- Event-driven simulations
```

## 💻 Implementation WITHOUT Collections

```java
public class MyMinHeap {
    private int[] heap;
    private int size;
    private int capacity;

    public MyMinHeap(int capacity) {
        this.capacity = capacity;
        this.heap = new int[capacity];
        this.size = 0;
    }

    // PARENT INDEX
    private int parent(int i) { return (i - 1) / 2; }

    // LEFT CHILD INDEX
    private int leftChild(int i) { return 2 * i + 1; }

    // RIGHT CHILD INDEX
    private int rightChild(int i) { return 2 * i + 2; }

    // SWAP
    private void swap(int i, int j) {
        int temp = heap[i];
        heap[i] = heap[j];
        heap[j] = temp;
    }

    // INSERT - O(log n)
    public void insert(int value) {
        if (size == capacity) {
            throw new RuntimeException("Heap is full!");
        }

        // Add at end
        heap[size] = value;
        int current = size;
        size++;

        // Bubble up
        while (current > 0 && heap[current] < heap[parent(current)]) {
            swap(current, parent(current));
            current = parent(current);
        }
    }

    // PEEK (Get min) - O(1)
    public int peek() {
        if (size == 0) throw new RuntimeException("Heap is empty!");
        return heap[0];
    }

    // EXTRACT MIN - O(log n)
    public int extractMin() {
        if (size == 0) throw new RuntimeException("Heap is empty!");

        int min = heap[0];

        // Move last element to root
        heap[0] = heap[size - 1];
        size--;

        // Bubble down
        heapifyDown(0);

        return min;
    }

    // HEAPIFY DOWN
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

    // BUILD HEAP from array - O(n)
    public void buildHeap(int[] arr) {
        size = arr.length;
        heap = arr.clone();

        // Start from last non-leaf node
        for (int i = size / 2 - 1; i >= 0; i--) {
            heapifyDown(i);
        }
    }

    public int size() {
        return size;
    }

    public boolean isEmpty() {
        return size == 0;
    }
}
```

---

_Continue in Part 2: 02_Collections_Methods_Table.md_
