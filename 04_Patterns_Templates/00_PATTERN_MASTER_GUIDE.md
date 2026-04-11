> **Navigation**: [Back to Index](../00_MASTER_INDEX.md) | [Pattern Recognition](04_Pattern_Recognition.md) | [Sliding Window](01_Sliding_Window.md)

---

# 🗺️ Pattern Master Guide — The Complete DSA Keyword → Pattern Map

> **This is your cheat sheet.** When you see a problem and feel stuck, open this file.
> Follow: Keywords → Pattern → DS → Study File → Solve.

---

## 🔗 How This Connects to the Rest of Your Repo

```
You encounter a problem
        ↓
Read this file → identify pattern
        ↓
GO LEARN the pattern if needed
  ├── DS file: 02_Data_Structures/
  ├── Pattern file: 04_Patterns_Templates/
  └── Algo file: 03_Algorithms/
        ↓
RETURN to problem → apply pattern
        ↓
Practice more: 05_Problem_Solving/
```

---

## 📋 Complete Pattern Index

### 1. Sliding Window
**Keywords:** `subarray/substring`, `window`, `consecutive`, `maximum/minimum in range`, `at most k distinct`

**DS Used:** Two pointers (left, right) on array  
**Time:** O(n) | **Space:** O(1) or O(k)  

**Identify it:** "Find smallest/largest subarray satisfying a condition"

```java
// Variable window template
int left = 0, result = 0;
for (int right = 0; right < n; right++) {
    // add arr[right] to window state
    while (/* window invalid */) { /* remove arr[left] */ left++; }
    result = Math.max(result, right - left + 1);
}
```

| Problem | Difficulty |
|---------|------------|
| LC 3 — Longest Substring Without Repeating | ⭐⭐ Med |
| LC 76 — Minimum Window Substring | ⭐⭐⭐ Hard |
| LC 209 — Minimum Size Subarray Sum | ⭐⭐ Med |
| LC 1004 — Max Consecutive Ones III | ⭐⭐ Med |

📖 **Study:** [01_Sliding_Window.md](01_Sliding_Window.md) | Returns from: [01b_Arrays.md](../02_Data_Structures/01b_Arrays.md)

---

### 2. Two Pointers
**Keywords:** `sorted array`, `pairs`, `triplets`, `sum`, `palindrome`, `remove duplicates in-place`

**DS Used:** Two indices on array or two references on LL  
**Time:** O(n) to O(n log n) (sort first) | **Space:** O(1)  

**Identify it:** "Sorted input, find pairs/count satisfying condition"

```java
// Opposite ends template
Arrays.sort(arr);
int left = 0, right = arr.length - 1;
while (left < right) {
    int sum = arr[left] + arr[right];
    if (sum == target) { /* found */ left++; right--; }
    else if (sum < target) left++;
    else right--;
}
```

| Problem | Difficulty |
|---------|------------|
| LC 167 — Two Sum II (sorted) | ⭐ Easy |
| LC 15 — 3Sum | ⭐⭐ Med |
| LC 11 — Container with Most Water | ⭐⭐ Med |
| LC 42 — Trapping Rain Water | ⭐⭐⭐ Hard |

📖 **Study:** [07_Two_Pointers_Complete.md](07_Two_Pointers_Complete.md) | [08_Array_Plus_TwoPointers.md](08_Array_Plus_TwoPointers.md)

---

### 3. Prefix Sum
**Keywords:** `range sum query`, `subarray sum equals K`, `count subarrays`, `running total`

**DS Used:** Array + HashMap  
**Time:** O(n) build, O(1) query | **Space:** O(n)  

**Identify it:** "Sum of elements between indices i and j, asked many times"

```java
// Build
int[] prefix = new int[n + 1];
for (int i = 0; i < n; i++) prefix[i+1] = prefix[i] + arr[i];
// Query [l, r]:  prefix[r+1] - prefix[l]

// Count subarrays with sum K:
Map<Integer,Integer> freq = new HashMap<>();
freq.put(0, 1);
int sum = 0, count = 0;
for (int x : arr) {
    sum += x;
    count += freq.getOrDefault(sum - k, 0);
    freq.merge(sum, 1, Integer::sum);
}
```

| Problem | Difficulty |
|---------|------------|
| LC 303 — Range Sum Query | ⭐ Easy |
| LC 560 — Subarray Sum Equals K | ⭐⭐ Med |
| LC 525 — Contiguous Array | ⭐⭐ Med |
| LC 304 — Range Sum Query 2D | ⭐⭐ Med |

📖 **Study:** [04_Pattern_Recognition.md — Pattern 1](04_Pattern_Recognition.md)

---

### 4. HashMap / HashSet
**Keywords:** `two sum`, `frequency`, `group`, `anagram`, `seen before`, `O(1) lookup`

**DS Used:** HashMap<K,V> or HashSet<K>  
**Time:** O(n) | **Space:** O(n)  

**Identify it:** "Need to look up by value (not index)"

```java
// Complement lookup
Map<Integer,Integer> seen = new HashMap<>();
for (int i = 0; i < nums.length; i++) {
    if (seen.containsKey(target - nums[i]))
        return new int[]{seen.get(target - nums[i]), i};
    seen.put(nums[i], i);
}
```

📖 **Study:** [01e_HashTable.md](../02_Data_Structures/01e_HashTable.md) | [10_HashMap_Plus_Counting.md](10_HashMap_Plus_Counting.md)

---

### 5. Binary Search
**Keywords:** `sorted`, `search`, `find minimum satisfying`, `koko eating`, `ship packages`, `rotated`

**DS Used:** Array (sorted) + two pointers  
**Time:** O(log n) | **Space:** O(1)  

**Identify it:** "Can I binary search on the ANSWER (not just the array)?"

```java
// Classic
int left = 0, right = n - 1;
while (left <= right) {
    int mid = left + (right - left) / 2;
    if (arr[mid] == target) return mid;
    else if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
}

// Binary search on ANSWER SPACE
int lo = MIN_POSSIBLE, hi = MAX_POSSIBLE;
while (lo < hi) {
    int mid = lo + (hi - lo) / 2;
    if (canAchieve(mid)) hi = mid;    // try smaller
    else lo = mid + 1;               // need bigger
}
```

| Problem | Difficulty |
|---------|------------|
| LC 704 — Binary Search | ⭐ Easy |
| LC 33 — Search in Rotated Array | ⭐⭐ Med |
| LC 875 — Koko Eating Bananas | ⭐⭐ Med |
| LC 1011 — Capacity to Ship Packages | ⭐⭐ Med |

📖 **Study:** [06_Binary_Search_Patterns.md](06_Binary_Search_Patterns.md)

---

### 6. Kadane's Algorithm
**Keywords:** `maximum subarray`, `maximum sum contiguous`, `minimum subarray`

**DS Used:** Variables (currentMax, maxSoFar)  
**Time:** O(n) | **Space:** O(1)  

```java
int maxSum = arr[0], current = arr[0];
for (int i = 1; i < arr.length; i++) {
    current = Math.max(arr[i], current + arr[i]);
    maxSum  = Math.max(maxSum, current);
}
```

📖 **Study:** [04_Pattern_Recognition.md — Pattern 2](04_Pattern_Recognition.md)

---

### 7. Fast & Slow Pointers (Floyd's)
**Keywords:** `linked list cycle`, `middle of list`, `nth from end`, `palindrome list`

**DS Used:** Linked List with two pointers  
**Time:** O(n) | **Space:** O(1)  

📖 **Study:** [01c_LinkedList.md](../02_Data_Structures/01c_LinkedList.md) | [12_LinkedList_Plus_TwoPointers.md](12_LinkedList_Plus_TwoPointers.md)

---

### 8. Monotonic Stack
**Keywords:** `next greater element`, `next smaller`, `largest rectangle`, `trapping rain water`, `span`

**DS Used:** Stack (stores indices)  
**Time:** O(n) | **Space:** O(n)  

```java
Deque<Integer> stack = new ArrayDeque<>();
int[] result = new int[n];
Arrays.fill(result, -1);
for (int i = 0; i < n; i++) {
    while (!stack.isEmpty() && arr[stack.peek()] < arr[i])
        result[stack.pop()] = arr[i];   // arr[i] is next greater
    stack.push(i);
}
```

📖 **Study:** [11_Stack_Plus_MonotonicPattern.md](11_Stack_Plus_MonotonicPattern.md)

---

### 9. BFS (Breadth First Search)
**Keywords:** `shortest path`, `level order`, `minimum steps`, `connected components`

**DS Used:** Queue + visited set  
**Time:** O(V + E) | **Space:** O(V)  

📖 **Study:** [14_Graph_Plus_Traversal.md](14_Graph_Plus_Traversal.md) | [13_Tree_Plus_DFS_BFS.md](13_Tree_Plus_DFS_BFS.md)

---

### 10. DFS / Backtracking
**Keywords:** `all possible`, `generate`, `paths`, `permutations`, `combinations`, `subsets`

**DS Used:** Recursion stack + visited  
**Time:** O(2ⁿ) or O(n!) | **Space:** O(n) depth  

```java
void backtrack(int start, List<Integer> current, List<List<Integer>> result) {
    result.add(new ArrayList<>(current));   // record state
    for (int i = start; i < n; i++) {
        current.add(nums[i]);               // choose
        backtrack(i + 1, current, result);  // explore
        current.remove(current.size() - 1); // unchoose
    }
}
```

📖 **Study:** [17_Backtracking_Plus_Pruning.md](17_Backtracking_Plus_Pruning.md)

---

### 11. Dynamic Programming
**Keywords:** `minimum/maximum`, `ways to`, `longest`, `count paths`, `overlapping subproblems`

**DS Used:** 1D or 2D array  
**Time:** O(n²) or O(n) | **Space:** O(n²) → O(n) with optimization  

**Identify it:** "Can I break this into overlapping subproblems?"

📖 **Study:** [16_DP_Pattern_Recognition.md](16_DP_Pattern_Recognition.md) | [23_Knapsack_Family.md](23_Knapsack_Family.md)

---

### 12. Heap / Priority Queue
**Keywords:** `k-th largest`, `top K`, `merge K sorted`, `median in stream`, `task scheduler`

**DS Used:** PriorityQueue (min-heap by default in Java)  
**Time:** O(n log k) | **Space:** O(k)  

```java
// Top K largest elements
PriorityQueue<Integer> minHeap = new PriorityQueue<>();
for (int num : arr) {
    minHeap.offer(num);
    if (minHeap.size() > k) minHeap.poll();
}
```

📖 **Study:** [15_Heap_Plus_GreedySelection.md](15_Heap_Plus_GreedySelection.md) | [01f_Trees_Heaps.md](../02_Data_Structures/01f_Trees_Heaps.md)

---

## 📊 Decision Flowchart

```
NEW PROBLEM
    │
    ├─ Sorted array?──────────────── YES → Binary Search or Two Pointers
    │
    ├─ Find pair/triplet with sum?─── → Two Pointers (sort) or HashMap
    │
    ├─ Subarray/substring?──────────── → Sliding Window or Prefix Sum
    │
    ├─ Subsequence / subsets?──────── → Recursion / DP
    │
    ├─ Need O(1) lookup by value?───── → HashMap / HashSet
    │
    ├─ k-th largest/smallest?──────── → Min-Heap size k
    │
    ├─ Next greater element?──────── → Monotonic Stack
    │
    ├─ Tree + path/depth?──────────── → DFS
    │
    ├─ Tree + level-by-level?──────── → BFS Queue
    │
    ├─ Graph + shortest path?────────── → BFS (unweighted) / Dijkstra (weighted)
    │
    ├─ All possibilities / combinations?── → Backtracking + Pruning
    │
    └─ Optimal count/max/min?────────── → DP (check for overlapping subproblems)
```

---

## 🔗 Quick Navigation

| Pattern | DS File | Pattern File | Practice File |
|---------|---------|--------------|---------------|
| Arrays | [01b_Arrays](../02_Data_Structures/01b_Arrays.md) | [08_Array_Plus_TwoPointers](08_Array_Plus_TwoPointers.md) | [04_Arrays](../05_Problem_Solving/04_Arrays.md) |
| Sliding Window | — | [01_Sliding_Window](01_Sliding_Window.md) | [05_Sliding_Window](../05_Problem_Solving/05_Sliding_Window.md) |
| Two Pointers | — | [07_Two_Pointers_Complete](07_Two_Pointers_Complete.md) | [06_Two_Pointers](../05_Problem_Solving/06_Two_Pointers.md) |
| Binary Search | — | [06_Binary_Search_Patterns](06_Binary_Search_Patterns.md) | [07_Binary_Search](../05_Problem_Solving/07_Binary_Search.md) |
| HashMap | [01e_HashTable](../02_Data_Structures/01e_HashTable.md) | [10_HashMap_Plus_Counting](10_HashMap_Plus_Counting.md) | [17_HashMap_Hashing](../05_Problem_Solving/17_HashMap_Hashing.md) |
| Stack/Queue | [01d_Stack_Queue](../02_Data_Structures/01d_Stack_Queue.md) | [11_Stack_Plus_Monotonic](11_Stack_Plus_MonotonicPattern.md) | [08_Stack_Queue](../05_Problem_Solving/08_Stack_Queue.md) |
| Trees | [01f_Trees_Heaps](../02_Data_Structures/01f_Trees_Heaps.md) | [13_Tree_Plus_DFS_BFS](13_Tree_Plus_DFS_BFS.md) | [09_Trees](../05_Problem_Solving/09_Trees.md) |
| Graphs | — | [14_Graph_Plus_Traversal](14_Graph_Plus_Traversal.md) | [10_Graphs](../05_Problem_Solving/10_Graphs.md) |
| DP | — | [16_DP_Pattern_Recognition](16_DP_Pattern_Recognition.md) | [11_Dynamic_Programming](../05_Problem_Solving/11_Dynamic_Programming.md) |
| Backtracking | — | [17_Backtracking_Plus_Pruning](17_Backtracking_Plus_Pruning.md) | [12_Backtracking](../05_Problem_Solving/12_Backtracking.md) |
| Heap | [01f_Trees_Heaps](../02_Data_Structures/01f_Trees_Heaps.md) | [15_Heap_Plus_GreedySelection](15_Heap_Plus_GreedySelection.md) | [16_Heap](../05_Problem_Solving/16_Heap.md) |
| LinkedList | [01c_LinkedList](../02_Data_Structures/01c_LinkedList.md) | [12_LinkedList_Plus_TwoPointers](12_LinkedList_Plus_TwoPointers.md) | [15_LinkedList](../05_Problem_Solving/15_LinkedList.md) |

---

## 🏋️ Practice & Interview Questions — OOP & Design Patterns

### Predict / Trace
**Q1.** What design pattern does this code follow?
```java
Logger logger = Logger.getInstance();
```
<details><summary>Answer</summary>

**Singleton** — ensures only one Logger instance exists globally.
</details>

**Q2.** What SOLID principle is violated?
```java
class User {
    void login() { ... }
    void logout() { ... }
    void sendEmail() { ... }  // ← ?
    void generateReport() { ... }  // ← ?
}
```
<details><summary>Answer</summary>

**SRP (Single Responsibility)** — User class has 4 responsibilities: authentication, email, reporting. Should be split into: `AuthService`, `EmailService`, `ReportService`.
</details>

### Design Pattern Problems
**Q3.** ⭐ Implement Strategy pattern for payment processing.
<details><summary>Solution</summary>

```java
interface PaymentStrategy { void pay(int amount); }
class CreditCard implements PaymentStrategy { public void pay(int amount){ /*...*/ } }
class PayPal implements PaymentStrategy { public void pay(int amount){ /*...*/ } }
class UPI implements PaymentStrategy { public void pay(int amount){ /*...*/ } }

class PaymentContext {
    private PaymentStrategy strategy;
    void setStrategy(PaymentStrategy s){ this.strategy=s; }
    void processPayment(int amount){ strategy.pay(amount); }
}
// Switch strategy at runtime — open/closed principle!
```
</details>

**Q4.** ⭐⭐ Implement Observer pattern for event notification.
<details><summary>Solution</summary>

```java
interface Observer { void update(String event); }
interface Observable {
    void subscribe(Observer o); void unsubscribe(Observer o); void notify(String event);
}
class EventBus implements Observable {
    List<Observer> observers = new ArrayList<>();
    public void subscribe(Observer o){ observers.add(o); }
    public void unsubscribe(Observer o){ observers.remove(o); }
    public void notify(String event){ observers.forEach(o -> o.update(event)); }
}
```
</details>

**Q5.** ⭐⭐ Builder pattern for a complex configuration object.
<details><summary>Solution</summary>

```java
class ServerConfig {
    private final String host; private final int port; private final int timeout;
    private ServerConfig(Builder b){ host=b.host; port=b.port; timeout=b.timeout; }

    static class Builder {
        String host="localhost"; int port=8080; int timeout=30;
        Builder host(String h){ host=h; return this; }
        Builder port(int p){ port=p; return this; }
        Builder timeout(int t){ timeout=t; return this; }
        ServerConfig build(){ return new ServerConfig(this); }
    }
}
// ServerConfig config = new ServerConfig.Builder().host("prod.com").port(443).build();
```
</details>

### MCQ Rapid Fire
| # | Question | Answer |
|---|---|---|
| 1 | SOLID: O stands for | Open/Closed Principle |
| 2 | Factory vs Abstract Factory | Factory: one product; Abstract Factory: family of products |
| 3 | Composition over inheritance means | Prefer has-a (field) over is-a (extends) for flexibility |
| 4 | Decorator pattern purpose | Add behavior dynamically without subclassing |
| 5 | Facade pattern purpose | Simplified interface to complex subsystem |
| 6 | Proxy pattern types | Virtual, protective, remote, caching |
| 7 | Command pattern encapsulates | Request as an object (supports undo/redo) |
| 8 | Template Method pattern | Defines algorithm skeleton, subclasses fill in steps |

---

## 🧠 Deep Conceptual Questions — OOP, SOLID & Design Patterns

**C1. What is the difference between an interface and an abstract class — when to use each?**
<details><summary>Deep Answer</summary>

**Abstract class**: can have fields, constructors, concrete method implementations. Models IS-A with shared state and behavior. Use when: you have partial implementation to share (template method pattern). Single inheritance: if you extend an abstract class, you can't extend another. **Interface**: pure contract, no state (Java 8+: default methods allowed). Models CAN-DO / role capability. A class can implement unlimited interfaces. Use when: defining a capability across unrelated classes (`Comparable`, `Serializable`, `Runnable`). Rule: prefer interfaces for type definitions. Use abstract class when you need to share implementation code AND all subtypes share the same "IS-A" relationship. In practice: interfaces + composition > abstract class + inheritance.
</details>

**C2. Liskov Substitution Principle: what does it actually mean and how do you violate it?**
<details><summary>Deep Answer</summary>

LSP: if `S extends P`, anywhere you use `P`, you should be able to use `S` without breaking correctness. Violation example: `Square extends Rectangle`. Rectangle behavior: setWidth and setHeight are independent. Square invariant: width must equal height. `Square s = new Square(5); s.setWidth(10);` — now `s.getHeight() == 10` (Square enforced equality) but Rectangle contract says height should still be 5. Code using Rectangle is surprised. Better: Square and Rectangle as siblings under a Shape hierarchy. Another classic: override a method and throw exception for a case the parent method handled → violates LSP. Test: can you run the parent's test suite against the child and pass?
</details>

**C3. Strategy pattern vs. if-else chains: the OCP argument.**
<details><summary>Deep Answer</summary>

```java
// BAD: add new payment type = modify this method = Open for modification (violates OCP)
if(type == "credit") { } else if(type == "paypal") { } else if(type == "crypto") { }

// GOOD: add new payment = new class, zero modification of existing code
interface PaymentStrategy { void pay(int amount); }
// Add Crypto: new CryptoPayment implements PaymentStrategy — no other file touched
```
Open/Closed Principle: open for extension, closed for modification. Each `else if` = a modification to an existing method = risk of breaking existing behavior, requires re-testing the entire method. Strategy = extension by new class = old code untouched = zero regression risk. When if-else is fine: 2-3 fixed cases that never change. When strategy shines: extensible behaviors that vary at runtime.
</details>

**C4. What is the Dependency Inversion Principle and how does it enable testability?**
<details><summary>Deep Answer</summary>

DIP: high-level modules should not depend on low-level modules — both should depend on abstractions. Without DIP: `OrderService` directly creates `MySQLOrderRepository`. To test OrderService: must have MySQL running. With DIP: `OrderService` depends on `OrderRepository` interface. In production: inject `MySQLOrderRepository`. In tests: inject `MockOrderRepository`. The high-level business logic (OrderService) has zero knowledge of the database layer. This makes: unit testing trivial (mock the interface), swapping implementations easy (SQLite, PostgreSQL, in-memory), layer boundaries clear. Dependency INJECTION (DI framework like Spring) is the mechanism that enables DIP at runtime.
</details>

**C5. Observer pattern vs. Event Bus: when does one become the other?**
<details><summary>Deep Answer</summary>

**Observer**: subject holds direct references to observer objects. Subject explicitly notifies each one. Tightly coupled (subject knows about observers). Fine for: small systems, known observers at compile time. Breaks when: observers span different modules, dynamic subscription needed, observers need to be remote. **Event Bus / Message Queue**: publishers and subscribers decoupled. Publisher sends event with a TYPE to the bus. Subscribers register for event types — publisher doesn't know who's listening. De-facto standard in large systems: Spring ApplicationEventPublisher, Kafka, RabbitMQ are all event buses. Rule: Observer for in-process tightly-coupled notification. Event bus for loose coupling, cross-module, or distributed communication.
</details>

