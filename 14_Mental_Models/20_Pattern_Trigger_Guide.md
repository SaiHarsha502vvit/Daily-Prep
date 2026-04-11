# 🎯 Pattern Trigger Guide — From Problem Signal to Solution Pattern

> **Purpose:** Your brain fires a signal when it sees a pattern. This guide maps that signal to the verified correct technique.
> **Use:** Read the signal table every morning. Within 2 weeks, your gut instinct becomes algorithmic.
>
> 🔗 **Navigate back:** [Mental Models Index](00_INDEX.md) | [Pattern Master Guide](../04_Patterns_Templates/00_PATTERN_MASTER_GUIDE.md)

---

## 🔑 The Master Signal → Pattern Table

> For each problem, find the strongest matching signal. That's your starting pattern.

| Signal You See in Problem | Your Brain Should Say | Verify With | Jump To |
|---|---|---|---|
| `"subarray"` + `"of size k"` | → **Fixed Sliding Window** | Is window size constant? Yes → Fixed | [SW PS](../05_Problem_Solving/05_Sliding_Window.md) |
| `"longest subarray/substring"` + `"with condition"` | → **Variable Sliding Window** | Does adding right & shrinking left work? | [SW PS](../05_Problem_Solving/05_Sliding_Window.md) |
| `"pair that sums to target"` in sorted array | → **Two Pointers (opposite ends)** | Is it sorted? Must it be? | [2P PS](../05_Problem_Solving/06_Two_Pointers.md) |
| `"three numbers sum to 0"` / `"k-sum"` | → **Fix one + Two Pointer** | Sort, fix outer loop, two-pointer inner | [2P PS](../05_Problem_Solving/06_Two_Pointers.md) |
| `"remove duplicates in-place"` | → **Two Pointers (same direction)** | Slow=writer, fast=reader | [2P PS](../05_Problem_Solving/06_Two_Pointers.md) |
| `"sorted array"` + `"find target"` or `"insert position"` | → **Binary Search** | Is search space monotonic? | [BS PS](../05_Problem_Solving/07_Binary_Search.md) |
| `"minimum X to achieve Y"` | → **Binary Search on Answer** | Is "can I achieve with X?" monotonic? | [BS PS](../05_Problem_Solving/07_Binary_Search.md) |
| `"find kth largest/smallest"` | → **Min-Heap of size K** | K-size heap; root = kth largest | [Heap PS](../05_Problem_Solving/16_Heap.md) |
| `"median of stream"` / `"balance two halves"` | → **Two Heaps (max + min)** | Max-heap left half, min-heap right half | [Heap PS](../05_Problem_Solving/16_Heap.md) |
| `"two numbers add to target"` (unsorted, any) | → **HashMap complement** | One-pass: store seen values | [HP PS](../05_Problem_Solving/17_HashMap_Hashing.md) |
| `"how many subarrays sum to K"` | → **Prefix Sum + HashMap** | `count[prefixSum - k]` | [HP PS](../05_Problem_Solving/17_HashMap_Hashing.md) |
| `"group by property"` (anagrams, etc.) | → **HashMap grouping** | Key = sorted string / frequency tuple | [HP PS](../05_Problem_Solving/17_HashMap_Hashing.md) |
| `"next greater element"`, `"span"`, `"histogram"` | → **Monotonic Stack** | Decreasing stack; pop when violated | [SQ PS](../05_Problem_Solving/08_Stack_Queue.md) |
| `"valid parentheses"`, `"balanced brackets"` | → **Stack matching** | Push open, pop and compare on close | [SQ PS](../05_Problem_Solving/08_Stack_Queue.md) |
| `"level-order traversal"`, `"minimum hops"` | → **BFS (Queue)** | Layer-by-layer; use queue + level counter | [Tree PS](../05_Problem_Solving/09_Trees.md) |
| `"all paths"`, `"path sum"`, `"leaf nodes"` | → **DFS (Recursion)** | Pre/in/post-order choices | [Tree PS](../05_Problem_Solving/09_Trees.md) |
| `"islands"`, `"connected components"`, `"flood fill"` | → **DFS/BFS on grid** | Visit + mark grid cells | [Graph PS](../05_Problem_Solving/10_Graphs.md) |
| `"shortest path"` (unweighted graph/grid) | → **BFS** | BFS guarantees shortest in unweighted | [Graph PS](../05_Problem_Solving/10_Graphs.md) |
| `"shortest path"` (weighted, positive edges) | → **Dijkstra** | Min-heap on distance | [Graph PS](../05_Problem_Solving/10_Graphs.md) |
| `"prerequisites"`, `"order tasks"`, `"dependency"` | → **Topological Sort** | Kahn's BFS or DFS postorder | [Graph PS](../05_Problem_Solving/10_Graphs.md) |
| `"find all combinations/subsets"` | → **Backtracking** | Choose → Explore → Unchoose | [BT PS](../05_Problem_Solving/12_Backtracking.md) |
| `"minimum cost to reach"`, `"maximize value"` with constraints | → **DP** | Sub-problems overlap? DP. | [DP PS](../05_Problem_Solving/11_Dynamic_Programming.md) |
| `"longest increasing subsequence"` | → **1D DP** or **Patience Sort (O(n log n))** | dp[i] = max of dp[j]+1 where j<i, nums[j]<nums[i] | [DP PS](../05_Problem_Solving/11_Dynamic_Programming.md) |
| `"edit distance"`, `"LCS"`, `"wildcard matching"` | → **2D String DP** | dp[i][j] = answer for s1[0..i] vs s2[0..j] | [DP PS](../05_Problem_Solving/11_Dynamic_Programming.md) |
| `"pick/skip items"`, `"knapsack"`, `"coin change"` | → **Knapsack DP** | dp[i][w] = max value with capacity w | [DP PS](../05_Problem_Solving/11_Dynamic_Programming.md) |
| `"intervals"`, `"merge meetings"`, `"non-overlapping"` | → **Sort by start + Greedy/Heap** | Sort by start time; merge or count overlaps | [Greedy PS](../05_Problem_Solving/13_Greedy.md) |
| `"minimum number of X"` (coins, jumps, platforms) | → **Greedy first, then DP if fails** | Greedy: always pick local best. If counterexample exists → DP | [Greedy PS](../05_Problem_Solving/13_Greedy.md) |
| `"cycle in linked list"` | → **Fast & Slow Pointers** | Floyd's tortoise & hare | [LL PS](../05_Problem_Solving/15_LinkedList.md) |
| `"reverse linked list"` / `"palindrome list"` | → **3-pointer reversal** | `prev=null; curr=head; save next; flip; advance` | [LL PS](../05_Problem_Solving/15_LinkedList.md) |

---



## 🧠 5-Question Quick Classifier (Use for Any Problem)

```
Before writing code, answer these 5 questions:

Q1: What's the input structure?
    Linear (array/string) → Sliding Window / Two Pointer / Binary Search
    Graph/Tree → BFS/DFS/DP
    Unknown/stream → Heap

Q2: What does "optimal" mean here?
    Min/Max → DP or Greedy
    Shortest → BFS (unweighted) / Dijkstra (weighted)
    All solutions → Backtracking

Q3: What's the repeating operation that's slow in brute force?
    Recomputing sum of same elements → Prefix Sum / Sliding Window
    Searching in sorted structure → Binary Search
    Checking if element was seen → HashMap/HashSet

Q4: What constraints hint at the algorithm?
    n ≤ 20 → Bitmask DP or Backtracking O(2^n)
    n ≤ 500 → O(n²) DP
    n ≤ 10^5 → O(n log n) — sort + BS, or O(n) sliding window
    n ≤ 10^7 → O(n) only — prefix sum, single-pass, two-pointer

Q5: Does the sub-problem repeat?
    Yes + optimal substructure → DP (add memoization to recursion)
    Yes + greedy choice property → Greedy (no need to remember all choices)
    No → Divide and Conquer or simple traversal
```

---

## ⚡ 30-Second Pattern Flash Cards

> Read these fast every morning. Don't think — just react.

```
"contiguous" + "sum/max/length"        → Sliding Window O(n)
"sorted" + "pair"                      → Two Pointers O(n)
"sorted" + "find target"               → Binary Search O(log n)
"min/max k elements"                   → Heap O(n log k)
"two numbers sum"                      → HashMap O(n)
"subarray sum = k"                     → Prefix Sum + HashMap O(n)
"next greater"                         → Monotonic Stack O(n)
"shortest path unweighted"             → BFS O(V+E)
"shortest path weighted"               → Dijkstra O(E log V)
"all combinations"                     → Backtracking O(2^n)
"overlapping subproblems"              → DP (memoization)
"prerequisites/dependencies"           → Topological Sort O(V+E)
"cycle in list"                        → Fast & Slow Pointers O(n)
```

---



## 🔄 Brute Force → Optimal: The Optimization Path

| Brute Force | Bottleneck | Optimization | Result |
|---|---|---|---|
| Double loop on array O(n²) | Re-scanning for each position | Sliding Window or Prefix Sum | O(n) |
| Check all pairs for sum O(n²) | Linear search for complement | HashMap lookup | O(n) |
| Scan all n elements per query O(n·q) | Recomputing range sum | Prefix sum array | O(1) per query |
| Try all orderings O(n!) | No pruning | Backtracking + prune | O(2^n) avg |
| Recursion with repeated calls O(2^n) | Recomputing same state | Memoization / DP table | O(n·k) |
| Linear search in sorted array O(n) | Not using sorted property | Binary Search | O(log n) |

---

## 🎓 Pattern Recognition Confidence Tracker

> Mark off as you can recognize these within 30 seconds of reading a problem:

```
□ Sliding Window (fixed)
□ Sliding Window (variable)
□ Two Pointers (opposite ends)
□ Two Pointers (same direction)
□ Binary Search (classic)
□ Binary Search on Answer
□ HashMap Two-Sum
□ Prefix Sum + HashMap
□ Monotonic Stack
□ BFS on graph/grid
□ DFS on graph/grid
□ Dijkstra's algorithm
□ Topological Sort
□ Backtracking (generate all)
□ 1D DP
□ 2D DP (grid)
□ 2D DP (string comparison)
□ Knapsack DP
□ Greedy (exchange argument)
□ Min-Heap (top-K)
□ Two Heaps (median)
□ Fast & Slow Pointers
□ Dummy Head (linked list)
□ DFS on tree (postorder)
□ BFS on tree (level-order)
```

**Score yourself:**
- 0–8: Keep reading theory files
- 9–15: You're building the pattern library
- 16–20: Interview-ready
- 21–25: You ARE the pattern library 🔥

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

