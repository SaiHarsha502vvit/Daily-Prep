**Navigation**: [< Previous](19_Prefix_Sum_Prefix_XOR_2D_Prefix_Java_Complete.md) | [Back to Index](00_INDEX.md)

# Chapter 20 - DSA Patterns PDF to Java Coverage Map

Purpose: Convert the DSA pattern list from your PDF into a Java-first revision map inside this folder.

---

## 1. How to Use This Chapter

1. Pick a pattern from the PDF category list.
2. Jump to mapped Java chapter(s) in this repository.
3. Solve listed warm-up + interview-level problems.
4. Use the Java implementation checklist to verify readiness.

This chapter is not theory-heavy; it is a navigation and execution layer.

---

## 2. Coverage Map (PDF Topic -> Java Chapter)

## 2.1 Arrays, Prefix, Hashing

- Prefix Sum / Prefix XOR / 2D Prefix
  - `19_Prefix_Sum_Prefix_XOR_2D_Prefix_Java_Complete.md`
  - `08b_NumberTheory_Advanced.md`

- Sliding Window
  - `01_Sliding_Window_TwoPointers.md`
  - `12_Greedy_Interview_Mastery.md`

- Hashing and Frequency
  - `02_Sorting_Searching_Complete.md`
  - `17_DSA_Java_Implementation_Mastery.md`

## 2.2 Binary Search and Variants

- Binary Search on answer / bounds
  - `02_Sorting_Searching_Complete.md`
  - `13_Binary_Search_Deep_Dive.md`

🔬 **Section Challenge — 2.2 Binary Search and Variants**

**Challenge 1 (Reasoning):** Binary search on `[1,3,5,7,9]` with `target=6`. Trace `lo`, `hi`, `mid` at each step and explain the final state.
<details><summary>Answer</summary>

lo=0,hi=4 → mid=2(val=5): 5<6 → lo=3. lo=3,hi=4 → mid=3(val=7): 7>6 → hi=2. lo(3)>hi(2): loop ends, return -1 (not found). Key insight: lo overtakes hi — this is the standard termination condition. `lo` ends at the insertion point where 6 would go.
</details>

**Challenge 2 (Design):** Binary search on a rotated array `[4,5,6,7,0,1,2]`. How do you determine which half is sorted?
<details><summary>Answer</summary>

Compare `nums[lo]` and `nums[mid]`. If `nums[lo] <= nums[mid]`: left half is sorted. Check if target is in `[nums[lo], nums[mid])` — if yes, search left; else search right. Otherwise right half is sorted. Check if target is in `(nums[mid], nums[hi]]` — if yes, search right; else search left. This always works because at least one half of a rotated sorted array is always sorted.
</details>


## 2.3 Recursion, Backtracking, DP

- Recursion fundamentals and patterns
  - `03_Recursion_Backtracking_Complete.md`

- Dynamic Programming core patterns
  - `04_Dynamic_Programming_Complete.md`
  - `14_Dynamic_Programming_Deep_Dive.md`

🔬 **Section Challenge — 2.3 Recursion, Backtracking, DP**

**Challenge 1 (Reasoning):** Every recursive algorithm can be converted to iterative. What data structure replaces the call stack?
<details><summary>Answer</summary>

An explicit `Stack<State>` where State holds what the stack frame would hold (current node, remaining work, partial results). DFS → explicit stack. Factorial → accumulator variable (tail recursion → loop). Tree traversal → stack with nodes + 'visited' flag. When to use recursion vs iteration: recursion = cleaner code when tree/graph depth is bounded. Iteration = necessary when depth is unbounded (stack overflow risk) or when performance is critical.
</details>

**Challenge 2 (Bug Hunt):** ```java
void fib(int n) { return n<=1 ? n : fib(n-1) + fib(n-2); }
fib(50) // takes forever
```
Why and what are the 3 fixes?
<details><summary>Answer</summary>

Exponential time O(2^N) — `fib(n-1)` and `fib(n-2)` each recursively recompute the same subproblems billions of times. Fix 1: Memoization — `Map<Integer,Long> memo`, return early if computed. O(N) time, O(N) space. Fix 2: Bottom-up DP — array `dp[i] = dp[i-1] + dp[i-2]`. O(N) time, O(N) space. Fix 3: O(1) space — just track last two values with two variables. O(N) time, O(1) space.
</details>


## 2.4 Graphs and Trees

- Trees, traversals, BST, LCA
  - `05_Trees_BST_Complete.md`

- Graph BFS/DFS/topological/shortest path
  - `06_Graphs_Complete.md`
  - `15_Graphs_Deep_Dive.md`



🔬 **Section Challenge — 2.4 Graphs and Trees**

**Challenge 1 (Reasoning):** BFS finds shortest path in unweighted graphs but not in weighted graphs. Why exactly?
<details><summary>Answer</summary>

BFS explores by 'hop count' (number of edges). Each level = one more edge away from source. All edges are treated as weight=1. In a weighted graph, the 'shortest by hop count' path may not be 'shortest by weight sum'. Example: A→B (weight 1, 1 hop) vs A→C→B (weight 0.1+0.1=0.2, 2 hops). BFS finds A→B (1 hop), Dijkstra finds A→C→B (lower total weight). BFS is optimal ONLY when all edges have equal weight.
</details>

**Challenge 2 (Design):** Detect if a directed graph has a cycle. Write the algorithm and explain why we need 3 states (not 2).
<details><summary>Answer</summary>

3 states: UNVISITED, IN_PROGRESS (currently in DFS path), DONE. DFS: mark node IN_PROGRESS before visiting neighbors. If we reach an IN_PROGRESS node → cycle found. Mark DONE when all neighbors processed. Why 3 states: with 2 (visited/unvisited), we'd get false positives — reaching a VISITED node that was processed in a DIFFERENT DFS subtree is not a cycle. IN_PROGRESS specifically marks nodes in the CURRENT DFS path (potential back edge).
</details>


## 2.5 Bit Manipulation and XOR

- Bit operations and mask patterns
  - `10_Bit_Manipulation_Complete.md`

- Bitwise Trie
  - `18_Bitwise_Trie_Java_Complete.md`

## 2.6 Number Theory and Math

- GCD, modular arithmetic, primes
  - `08_GCD_NumberTheory_Patterns.md`
  - `08b_NumberTheory_Advanced.md`

- Combinatorics and counting strategy
  - `09_Pattern_Programs_Complete.md`
  - `../20_Interview_Mastery/19_DSA_Permutations_Combinations_Interview_Math.md`

## 2.7 Advanced Data Structures

- Segment Tree / Fenwick / DS design thinking
  - `07_Advanced_DataStructures.md`
  - `16_Advanced_DataStructures_Deep_Dive.md`

## 2.8 Interview Strategy and Java Execution

- End-to-end Java implementation playbook
  - `17_DSA_Java_Implementation_Mastery.md`

- High-value interview pattern recall
  - `11_Interview_Pattern_Mastery.md`

---

## 3. Java Readiness Checklist per Pattern

For each topic, verify you can do all of these in Java:

1. Write brute force first in 2 minutes.
2. Explain optimized pattern in 4 lines.
3. Implement optimized version without template copy.
4. State time and space complexity clearly.
5. Handle edge cases:
- empty input
- single element
- duplicates
- negatives
- overflow-sensitive sums
6. Convert logic into reusable helper methods/classes.

---




## 4. 21-Day Java Revision Route (Pattern-Focused)

### Week 1 - Core speed

Day 1: arrays, hashing, prefix sum
Day 2: sliding window and two pointers
Day 3: binary search patterns
Day 4: recursion + backtracking
Day 5: bit basics + xor range logic
Day 6: trees fundamentals
Day 7: mock set + recap

### Week 2 - Interview depth

Day 8: dynamic programming 1D/2D
Day 9: graph traversal + topo
Day 10: shortest path and union-find
Day 11: bitwise trie + max xor
Day 12: 2D prefix and matrix sums
Day 13: advanced DS intro
Day 14: timed mixed round

### Week 3 - Production-style communication

Day 15: solve and narrate in interview language
Day 16: solve with complexity trade-off discussion
Day 17: convert solutions to clean Java classes
Day 18: failure case drills and bug fixing
Day 19: problem mashup day (graph + dp / prefix + hashmap)
Day 20: full mock interview set
Day 21: finalize personal cheat sheets

---



## 5. Gap Closure Status from PDF

Based on PDF-to-workspace matching done in this session:

- Covered strongly: arrays, sliding window, binary search, recursion, DP, trees, graphs, bit manipulation, number theory.
- Strengthened now in Java detail:
  - Bitwise Trie chapter added.
  - Prefix Sum/XOR/2D Prefix dedicated Java chapter added.
- Remaining improvement direction:
  - keep adding problem banks by company style if needed.

---



🔬 **Section Challenge — 5. Gap Closure Status from PDF**

**Challenge 1 (Reasoning):** What is a closure and why can't garbage collection remove variables that are closed over?
<details><summary>Answer</summary>

A closure is a function that retains a reference to its lexical environment (the scope where it was created). Variables closed over are kept alive by the closure reference — GC can't collect them because there's still a reference (the closure's internal scope). Memory leak scenario: large data object captured in a closure, closure stored in a long-lived event listener → data stays in memory for the page's lifetime. Fix: explicitly null the large variable after use, or use a WeakRef.
</details>


## 6. Final Interview Positioning (What to Say)

"I maintain pattern-specific Java templates: prefix family, trie/xor family, graph traversals, and DP states. For each new problem, I first identify invariant and data shape, then map to known template, and finally optimize edge handling and complexity."

---


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

**Navigation**: [< Previous](19_Prefix_Sum_Prefix_XOR_2D_Prefix_Java_Complete.md) | [Back to Index](00_INDEX.md)
