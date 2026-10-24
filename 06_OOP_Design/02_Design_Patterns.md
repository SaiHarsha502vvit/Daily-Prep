# 🎨 Design Patterns: Complete Guide from Scratch

> **Navigation**: [← OOPS & Design Principles](01_OOPS_Principles.md) | [Chapter index](00_INDEX.md) | [Design Patterns in Java — Gang of… →](08_Design_Patterns_Java.md)

## Building Reusable, Maintainable Software

---

## 🔗 Bridge — Where This Chapter Fits

| Dimension | This chapter |
| --- | --- |
| **Builds on** | [OOP Principles](01_OOPS_Principles.md) (interfaces, composition), [Pattern Recognition](../04_Patterns_Templates/04_Pattern_Recognition.md) |
| **You will learn** | The creational, structural and behavioural categories, when each pattern earns its place, and how patterns combine |
| **Leads to** | [Design Patterns in Java](08_Design_Patterns_Java.md), [LLD Solved Problems](07_LLD_Solved_Problems.md) |
| **Abstraction level** | Isolated principles → **named solutions to recurring forces** → **combinations of patterns in one design** |

> [!NOTE]
> The full gap-free reading order and dependency graph are in the [Learning Path](00_LEARNING_PATH.md).

---

## 💬 Explain It Like a Study Partner — Design Patterns

### 1. The bottom line

A pattern is a named answer to a recurring design force; learn the force first, then the shape of the answer.

### 2. The textbook core

- **Creational** patterns control how objects are made (Factory, Builder, Singleton).
- **Structural** patterns control how objects are composed (Adapter, Decorator, Facade, Proxy, Composite).
- **Behavioural** patterns control how objects communicate (Strategy, Observer, Command, State, Template Method).
- The GoF catalogue (1994) lists 23 patterns: 5 creational, 7 structural, 11 behavioural.
- Many patterns are absorbed by modern language features (lambdas replace simple Strategy and Command).

### 3. The real-world analogy

A **recipe book**: each recipe names a dish, when to cook it and what to watch for, but you still choose ingredients for your own kitchen.

### 4. Walkthrough

1. State the force: "I need to swap the discount rule at run time".
2. Candidate: Strategy (an interface plus implementations).
3. Check cost: a lambda may be enough for one-line rules.
4. Implement, then test each strategy in isolation.
5. Name the pattern in the code or PR so teammates share the vocabulary.

> [!NOTE]
> **Quick check:** What is the first question to ask before reaching for a pattern? *What force (change, variation, coupling) is hurting right now?*

### 5. Check yourself

**Q1.** Observer or Strategy: a UI should refresh when a model changes — which fits?

<details><summary>Answer</summary>

**Observer.** Many dependents must be told when one subject changes. Strategy swaps an algorithm behind a single caller.

</details>

**Q2.** Why can `Comparator.comparing(...)` be called a Strategy without any class hierarchy?

<details><summary>Answer</summary>

A functional interface is an interface; a lambda is an implementation. The role is the same, the ceremony is gone.

</details>

---


## 📚 Topic Pages in This Chapter

This chapter is split into focused pages so each topic can be read on its own. Read them in order the first time; use the table to jump back later.

| # | Page | What is inside | Lines |
| --- | --- | --- | --- |
| 1 | [The 5W+H Framework](02_Design_Patterns/01_the_5w_h_framework.md) | The 5W+H Framework | 212 |
| 2 | [Creational Patterns](02_Design_Patterns/02_creational_patterns.md) | Creational Patterns | 151 |
| 3 | [Structural Patterns](02_Design_Patterns/03_structural_patterns.md) | Structural Patterns | 141 |
| 4 | [Behavioral Patterns](02_Design_Patterns/04_behavioral_patterns.md) | Behavioral Patterns · Pattern Combinations · Quick Reference Table | 301 |

## 💪 Curated Practice Problems — OOP & Design Patterns

**HOW TO USE**: These are system design / OOP implementation problems.
Section 1 = implement data structures using OOP. Section 2 = apply design patterns.
Section 3 = LeetCode design class problems.

---

### Section 1: OOP Implementation — Build From Scratch

| #   | Problem                               | Platform | Difficulty | Key Technique                        |
| --- | ------------------------------------- | -------- | ---------- | ------------------------------------ |
| 1   | Design HashMap (LC 706)               | LeetCode | Easy       | Array of buckets + chaining          |
| 2   | Design HashSet (LC 705)               | LeetCode | Easy       | Boolean bucket or linked list        |
| 3   | Min Stack (LC 155)                    | LeetCode | Medium     | Two stacks or store (val, min) pairs |
| 4   | Implement Queue using Stacks (LC 232) | LeetCode | Easy       | Two stacks: push/pop inversion       |
| 5   | Implement Stack using Queues (LC 225) | LeetCode | Easy       | Push costly or pop costly            |
| 6   | Design Linked List (LC 707)           | LeetCode | Medium     | Sentinel nodes, doubly linked        |
| 7   | Design Circular Queue (LC 622)        | LeetCode | Medium     | Array with front/rear pointers       |
| 8   | Design Circular Deque (LC 641)        | LeetCode | Medium     | Extend circular queue both ends      |

---

### Section 2: Design Class Problems (Strategy/Observer/Iterator)

| #   | Problem                               | Platform | Difficulty | Key Technique                        |
| --- | ------------------------------------- | -------- | ---------- | ------------------------------------ |
| 1   | LRU Cache (LC 146)                    | LeetCode | Medium     | HashMap + Doubly Linked List         |
| 2   | LFU Cache (LC 460)                    | LeetCode | Hard       | HashMap + frequency buckets          |
| 3   | Iterator for Combination (LC 1286)    | LeetCode | Medium     | Iterator pattern, precompute or lazy |
| 4   | Flatten Nested List Iterator (LC 341) | LeetCode | Medium     | Stack + recursive flatten            |
| 5   | Peeking Iterator (LC 284)             | LeetCode | Medium     | Decorator pattern on iterator        |
| 6   | Design Twitter (LC 355)               | LeetCode | Medium     | OOP: User, Tweet, Feed (merge k)     |
| 7   | Design Browser History (LC 1472)      | LeetCode | Medium     | Command pattern / doubly linked      |
| 8   | Design Underground System (LC 1396)   | LeetCode | Medium     | HashMap tracking check-in/out        |

---

🔬 **Section Challenge — Section 2: Design Class Problems**

**Challenge 1 (Design — Who/When/What):** LRU Cache (LC 146) uses HashMap + Doubly Linked List. **Why** can't you use HashMap alone? **What** operation becomes O(n) without the linked list? **Who** maintains the eviction order?

<details><summary>Answer</summary>

**HashMap alone:** `get()` and `put()` are O(1), but **eviction** (finding the LEAST recently used key) requires scanning ALL entries to find the oldest access time → O(n). **What operation?** `evict()`. **The linked list** maintains access order: most recently accessed node moves to HEAD, least recently used stays at TAIL. Eviction = remove TAIL → O(1). **Who maintains order?** Every `get()` and `put()` call moves the accessed node to HEAD. The HashMap provides O(1) lookup; the linked list provides O(1) ordering. Together: O(1) for all operations.

</details>

### Section 3: Advanced Design

| #   | Problem                                        | Platform | Difficulty | Key Technique                  |
| --- | ---------------------------------------------- | -------- | ---------- | ------------------------------ |
| 1   | Serialize and Deserialize Binary Tree (LC 297) | LeetCode | Hard       | Preorder + null markers        |
| 2   | Design Add and Search Words (LC 211)           | LeetCode | Medium     | Trie + DFS for wildcard        |
| 3   | Implement Trie (LC 208)                        | LeetCode | Medium     | Array[26] children nodes       |
| 4   | Design File System (LC 1166)                   | LeetCode | Medium     | Trie or HashMap of paths       |
| 5   | Design Hit Counter (LC 362)                    | LeetCode | Medium     | Queue or circular buffer       |
| 6   | Insert Delete GetRandom O(1) (LC 380)          | LeetCode | Medium     | ArrayList + HashMap swap trick |
| 7   | Find Median from Data Stream (LC 295)          | LeetCode | Hard       | Two heaps (maxHeap + minHeap)  |

---

🔬 **Section Challenge — Section 3: Advanced Design**

**Challenge 1 (Reasoning — Who/When/What):** Trie (LC 208) vs HashMap for word lookup. Both give O(L) lookup for a word of length L. **When** does Trie win? **What** operation is impossible with HashMap alone?

<details><summary>Answer</summary>

**When Trie wins:** Prefix search. `startsWith("app")` in a Trie traverses 3 nodes → O(3). With HashMap, you'd scan ALL keys checking `key.startsWith("app")` → O(n×L). **Impossible operation:** Efficient prefix enumeration. Finding all words starting with "pre" requires visiting the "pre" subtree. HashMap has no notion of shared prefixes. **Trade-off:** Trie uses more memory (26 pointers per node) but enables prefix operations. HashMap is more space-efficient for exact lookups.

</details>

### HIDDEN GEMS — Design Problems

| #   | Problem                             | Platform | Why It's Valuable                      |
| --- | ----------------------------------- | -------- | -------------------------------------- |
| 1   | Design Parking System (LC 1603)     | LeetCode | Simplest OOP design — good warm-up     |
| 2   | Design an Ordered Stream (LC 1656)  | LeetCode | Pointer advancement pattern            |
| 3   | Snapshot Array (LC 1146)            | LeetCode | Binary search on version history       |
| 4   | Time Based Key-Value Store (LC 981) | LeetCode | TreeMap or binary search on timestamps |
| 5   | Online Stock Span (LC 901)          | LeetCode | Monotonic stack as internal state      |

---

---

🔬 **Section Challenge — HIDDEN GEMS — Design Problems**

**Challenge 1 (Debug — Who/When/What):** Snapshot Array (LC 1146) stores version history. If you call `snap()` after every `set()`, **what** is the space complexity? **When** does this become a problem? **What** optimization reduces space?

<details><summary>Answer</summary>

**Space:** O(n × snapshots) — storing full array copy per snapshot. With 10K elements and 10K snapshots = 100M entries. **When problematic?** Frequent snapshots with sparse modifications. If you change 1 element but snap the entire array, 9,999 unchanged values are duplicated. **Optimization:** Store only CHANGES per snapshot: `TreeMap<snapId, value>` at each index. `get(index, snapId)` uses `floorEntry(snapId)` to find the most recent value ≤ snapId. Space: O(total set operations) instead of O(n × snaps).

</details>

---

### PLUS Enhancements

#### Diagram 1: Pattern Categories — Full Map

```
┌────────────────────────────────────────────────────────────────────────────┐
│                  GoF DESIGN PATTERNS — Category Map                        │
└────────────────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────────────┐
  │                    23 GoF Patterns                                   │
  │                                                                     │
  │  CREATIONAL               STRUCTURAL              BEHAVIORAL        │
  │  "How to create objects"  "How to compose"        "How to communicate"│
  │                                                                     │
  │  ┌───────────────────┐   ┌───────────────────┐  ┌─────────────────┐│
  │  │    Singleton      │   │    Adapter        │  │    Observer     ││
  │  │ One instance only │   │ Convert interface │  │ Notify many     ││
  │  └───────────────────┘   └───────────────────┘  └─────────────────┘│
  │  ┌───────────────────┐   ┌───────────────────┐  ┌─────────────────┐│
  │  │    Factory       │   │    Decorator      │  │    Strategy     ││
  │  │ Create by type   │   │ Add behavior dyn. │  │ Swap algorithm  ││
  │  └───────────────────┘   └───────────────────┘  └─────────────────┘│
  │  ┌───────────────────┐   ┌───────────────────┐  ┌─────────────────┐│
  │  │    Builder       │   │    Proxy          │  │    Command      ││
  │  │ Step-by-step     │   │ Control access    │  │ Encapsulate req ││
  │  │ construction     │   │ (lazy/caching)    │  │ (undo/redo)     ││
  │  └───────────────────┘   └───────────────────┘  └─────────────────┘│
  │  ┌───────────────────┐   ┌───────────────────┐  ┌─────────────────┐│
  │  │ Abstract Factory │   │    Facade         │  │    State        ││
  │  │ Family of related│   │ Simplified entry  │  │ Behavior by     ││
  │  │ products         │   │ point to subsystem│  │ internal state  ││
  │  └───────────────────┘   └───────────────────┘  └─────────────────┘│
  │  ┌───────────────────┐   ┌───────────────────┐  ┌─────────────────┐│
  │  │   Prototype      │   │    Composite      │  │  Template Method││
  │  │ Clone to create  │   │ Tree of parts     │  │ Algorithm       ││
  │  │                  │   │ (part-whole)      │  │ skeleton        ││
  │  └───────────────────┘   └───────────────────┘  └─────────────────┘│
  └─────────────────────────────────────────────────────────────────────┘

  Pattern selection decision tree:

  Need to CREATE?  ──► Single instance      ──► Singleton
                   ──► By type family       ──► Factory
                   ──► Complex steps        ──► Builder
                   ──► Clone existing       ──► Prototype

  Need to COMPOSE?  ──► Interface mismatch   ──► Adapter
                    ──► Add features dyn     ──► Decorator
                    ──► Simplify subsystem   ──► Facade
                    ──► Control access       ──► Proxy
                    ──► Tree structure       ──► Composite

  Need to COMMUNICATE? ──► Notify dependents  ──► Observer
                       ──► Swap algorithm     ──► Strategy
                       ──► Undo/redo          ──► Command
                       ──► Internal state     ──► State
                       ──► Algorithm steps    ──► Template Method
```

#### Diagram 2: Observer Pattern — Sequence Diagram

```
┌────────────────────────────────────────────────────────────────────────────┐
│                   OBSERVER PATTERN — Sequence Diagram                      │
└────────────────────────────────────────────────────────────────────────────┘

  Client                    NewsAgency (Subject)              Subscriber A/B/C
     │                             │                              │
     │  new Subscriber("Alice")    │                              │
     │─────────────────────────────▶│                              │
     │                             │                              │
     │  new Subscriber("Bob")      │                              │
     │────────────────────────────────────────────────────────────▶│
     │                             │                              │
     │  new Subscriber("Charlie")  │                              │
     │────────────────────────────────────────────────────────────────▶│
     │                             │                              │
     │  agency.attach(alice)       │                              │
     │─────────────────────────────▶│                              │
     │  agency.attach(bob)         │                              │
     │─────────────────────────────▶│                              │
     │  agency.attach(charlie)     │                              │
     │─────────────────────────────▶│                              │
     │                             │                              │
     │  agency.publishNews(...)    │                              │
     │─────────────────────────────▶│                              │
     │                             │  notifyObservers()           │
     │                             │──────────┐                   │
     │                             │  for each observer:         │
     │                             │──────────┘                   │
     │                             │                              │
     │                             │  alice.update(news)         │
     │                             │─────────────────────────────▶│
     │                             │                              │
     │                             │  bob.update(news)           │
     │                             │────────────────────────────────────────────────▶│
     │                             │                              │
     │                             │  charlie.update(news)       │
     │                             │────────────────────────────────────────────────────────────────▶│
     │                             │                              │

  Internal state of NewsAgency (Subject):

  ┌──────────────────────────────────────────────────────────┐
  │  NewsAgency                                               │
  │  ┌────────────────────────────────────────────────────┐  │
  │  │ List<Observer> observers                           │  │
  │  │  ┌──────┐  ┌──────┐  ┌──────┐                      │  │
  │  │  │Alice │  │ Bob  │  │Charlie│                     │  │
  │  │  └──────┘  └──────┘  └──────┘                      │  │
  │  │    0x10    0x14    0x18                           │  │
  │  └────────────────────────────────────────────────────┘  │
  │  String news = "Java 21 released!"                        │
  └──────────────────────────────────────────────────────────┘

  Flow: publishNews()  →  set news field  →  notifyObservers()
                                   │                    │
                                   ▼                    ▼
                            Iterates list     Calls update(news)
                            of observers      on each subscriber

  Memory leak danger: If subscriber never calls detach(), the Subject
  holds a strong reference → subscriber cannot be garbage collected!
  Fix: Use WeakHashMap<Observer, Object> or explicit lifecycle detach().
```

#### Diagram 3: Strategy Pattern — Class Structure

```
┌────────────────────────────────────────────────────────────────────────────┐
│                    STRATEGY PATTERN — Class Diagram                        │
└────────────────────────────────────────────────────────────────────────────┘

  ┌────────────────────────────────────────────────────────────────────────┐
  │                        CLIENT (main / service)                          │
  │  ShoppingCart cart = new ShoppingCart();                                │
  │  cart.setPaymentStrategy(new CreditCardPayment());  // ← selects here  │
  │  cart.checkout(100);                                                    │
  └────────────────────────────────────────────────────────────────────────┘

  ┌───────────────────────────────────────────┐
  │           <<interface>>                    │
  │        PaymentStrategy                    │
  ├───────────────────────────────────────────┤
  │ + pay(amount: double): void               │
  │ + refund(amount: double): void            │
  └───────────────────┬───────────────────────┘
                      │ implements
        ┌─────────────┴─────────────┐
        ▼                           ▼
  ┌───────────────────┐    ┌───────────────────┐
  │ CreditCardPayment │    │   PayPalPayment   │
  ├───────────────────┤    ├───────────────────┤
  │ - cardNumber      │    │ - email           │
  │ - cvv             │    │ - password        │
  ├───────────────────┤    ├───────────────────┤
  │ + pay(amount)     │    │ + pay(amount)     │
  │ + refund(amount)  │    │ + refund(amount)  │
  └───────────────────┘    └───────────────────┘
        ▲                           ▲
        │                           │
  ┌─────┴───────────────────────────┴─────┐
  │   UPIPayment / CryptoPayment /        │
  │   BankTransferPayment / GiftCard...   │  ← plug in new strategies
  └───────────────────────────────────────┘

  ┌───────────────────────────────────────────┐
  │              ShoppingCart (Context)        │
  ├───────────────────────────────────────────┤
  │ - items: List<Item>                       │
  │ - paymentStrategy: PaymentStrategy ◀── COMPOSITION (has-a) │
  ├───────────────────────────────────────────┤
  │ + setPaymentStrategy(strategy): void      │
  │ + checkout(amount): void                  │
  │   └── paymentStrategy.pay(amount)         │
  │ + getTotal(): double                      │
  └───────────────────────────────────────────┘

  KEY INSIGHT: The strategy is set at RUNTIME, not compile time.
  The Context (ShoppingCart) doesn't know which strategy it has.
  This is the Open/Closed Principle in action:
  Add UPI payment → create new class, ZERO changes to ShoppingCart.

  Lambda variant (Java 8+):
    cart.setPaymentStrategy(amount ->
        System.out.println("Paid " + amount + " via Credit Card"));
  No interface implementation needed — lambda IS the strategy!
```

#### Deep-Dive 1: Singleton's volatile Keyword — JVM Memory Model

```
┌────────────────────────────────────────────────────────────────────────────┐
│        DOUBLE-CHECKED LOCKING — Why volatile Is Mandatory in Java         │
└────────────────────────────────────────────────────────────────────────────┘

  The naive (broken) implementation:

  public class DatabaseConnection {
      private static DatabaseConnection instance;  // NOT volatile

      public static DatabaseConnection getInstance() {
          if (instance == null) {           // Check 1: fast path
              synchronized (DatabaseConnection.class) {
                  if (instance == null) {
                      instance = new DatabaseConnection();  // Problem here!
                  }
              }
          }
          return instance;
      }
  }

  WHY THIS FAILS WITHOUT volatile:

  instance = new DatabaseConnection() is NOT atomic in bytecode.
  It decomposes into 4 steps:

  ┌─────────────────────────────────────────────────────────────────┐
  │  bytecode for:  instance = new DatabaseConnection()             │
  │                                                                  │
  │  Step 1:  new DatabaseConnection    // Allocate memory          │
  │           (object exists in heap, fields set to defaults)        │
  │  Step 2:  dup                         // Duplicate ref on stack │
  │  Step 3:  invokespecial <init>       // Run constructor         │
  │           (set fields to real values)                            │
  │  Step 4:  astore instance             // STORE reference         │
  │           (make instance point to this object)                   │
  └─────────────────────────────────────────────────────────────────┘

  The JIT compiler and CPU can REORDER steps 2-4 (instruction reordering).
  The actual order might become:

    1. new DatabaseConnection       (allocate memory)
    2. astore instance               (reference is NOW non-null!)
    3. invokespecial <init>          (constructor runs)

  Thread A sees instance != null (because of step 2) and returns it.
  But Thread B might see the object BEFORE constructor finished (step 3).
  Result: Thread B gets an object with HALF-INITIALIZED fields!

  JMM (Java Memory Model) happens-before guarantee:

  Without volatile:
    Thread 1: constructor may reorder past astore  ──► Thread 2 reads uninitialized

  With volatile:
    Thread 1: volatile write (astore instance)  happens-before
    Thread 2: volatile read (load instance)
                                                    │
    Thread 1's write is visible to Thread 2 only if a happens-before          │
    relationship exists. Volatile creates that relationship:                 │
    volatile write ──► happens-before ──► volatile read of same variable.    │

  CORRECT IMPLEMENTATION:

  public class DatabaseConnection {
      private static volatile DatabaseConnection instance;  // ← MANDATORY

      public static DatabaseConnection getInstance() {
          if (instance == null) {           // Check 1: fast path
              synchronized (DatabaseConnection.class) {
                  if (instance == null) {   // Check 2: synchronized path
                      instance = new DatabaseConnection();
                  }
              }
          }
          return instance;
      }
  }

  Why two checks?
    First check: avoids synchronized lock on every call after init (performance)
    Second check: ensures only one thread creates the instance (correctness)

  Even better: use holder pattern (JVM handles synchronization):

  private static class Holder {
      private static final DatabaseConnection INSTANCE = new DatabaseConnection();
  }
  // INSTANCE is created lazily — only when getInstance() first calls Holder.INSTANCE
  // JVM guarantees thread-safe init with no explicit synchronization needed.
```

#### Deep-Dive 2: Factory vs Builder — When to Use Which

```
┌────────────────────────────────────────────────────────────────────────────┐
│              FACTORY vs BUILDER — Decision Framework                       │
└────────────────────────────────────────────────────────────────────────────┘

  FACTORY: "Give me one of N similar things by specifying a type/name"

  Use when:
    - You need to CREATE ONE object from a set of known alternatives
    - Client should NOT know the concrete class names
    - Creation logic involves branching (if/else or switch)
    - Objects are of the same "kind" with different implementations

  Examples:
    AnimalFactory.createAnimal("dog")      // Dog or Cat — same kind
    NotificationFactory.create("email")    // Email or SMS notification
    DocumentFactory.open("pdf")            // PDF or Word document

  ─────────────────────────────────────────────────────────────────────────────

  BUILDER: "Construct ONE complex object step by step, some optional"

  Use when:
    - The object has MANY fields (5+) with validations
    - Some fields are REQUIRED, some are OPTIONAL
    - Order of setting fields shouldn't matter
    - You want a FLUENT (chainable) API
    - The object should be IMMUTABLE after construction

  Examples:
    User.builder("John", "john@email.com").age(25).phone("123").build()
    HttpRequest.newBuilder().uri(url).timeout(5s).header(k,v).build()
    StringBuilder — Builder for String

  ─────────────────────────────────────────────────────────────────────────────

  COMPARISON TABLE:

  ┌────────────────────┬─────────────────────┬──────────────────────────────┐
  │ Dimension          │ Factory             │ Builder                      │
  ├────────────────────┼─────────────────────┼──────────────────────────────┤
  │ Purpose            │ Choose WHICH class  │ HOW to construct one class   │
  │ Number of params   │ 1 (type/name)       │ Many (all object fields)     │
  │ Object count       │ Creates ONE object  │ Creates ONE complex object   │
  │ Optionality        │ N/A                 │ Required + optional fields   │
  │ Return type        │ Interface/superclass│ The specific class being     │
  │                    │                     │ built                        │
  │ Mutability         │ Returns mutable obj │ Produces immutable object    │
  │ Real-world Java    │ BeanFactory         │ StringBuilder, HttpClient    │
  └────────────────────┴─────────────────────┴──────────────────────────────┘

  WHEN TO USE FACTORY + BUILDER TOGETHER:

  Scenario: Payment system with many types AND many optional fields

    PaymentFactory.create("credit_card")          // Factory: which type
        .cardNumber("...")                         // Builder: how to configure it
        .expiry("...")
        .build()

  OR: nested builder for a complex product:

    Order.builder()
        .customer(customerBuilder.build())   // Builder as a field
        .items(itemBuilder.buildList())      // of another builder
        .shipping(addressBuilder.build())
        .build()
```

#### Breadth Comparison 1: Pattern Selection by Problem Type

| Need / Problem                                  | Root Cause                                  | Best Pattern(s)                | Why It Fits                    |
| ----------------------------------------------- | ------------------------------------------- | ------------------------------ | ------------------------------ |
| Need to create ONE object globally              | Multiple instances cause resource conflicts | **Singleton**                  | One instance, global access    |
| Need to create objects by type                  | Client shouldn't know concrete classes      | **Factory / Abstract Factory** | Decouples creation from client |
| Need complex object with many fields            | Telescoping constructor anti-pattern        | **Builder**                    | Fluent, readable construction  |
| Need to clone existing objects                  | Copy constructor / clone() scattered        | **Prototype**                  | Deep copy via interface        |
| Need to adapt one interface to another          | Third-party code has incompatible API       | **Adapter**                    | Translates interfaces          |
| Need to add behavior dynamically                | Subclass explosion                          | **Decorator**                  | Stackable behaviors at runtime |
| Need to simplify a complex subsystem            | Client drowning in complexity               | **Facade**                     | Single entry point             |
| Need to control access to an object             | Lazy loading / access control / caching     | **Proxy**                      | Surrogate controls access      |
| Need to notify multiple objects                 | Polling is inefficient                      | **Observer**                   | Push-based one-to-many         |
| Need to swap algorithms at runtime              | if-else chain grows                         | **Strategy**                   | Interchangeable algorithms     |
| Need undo/redo / queue / log operations         | Operation is just a method call             | **Command**                    | Operations become objects      |
| Need behavior based on internal state           | Big if-else on state variable               | **State**                      | State → behavior mapping       |
| Need algorithm skeleton with customizable steps | Repeated structure, different steps         | **Template Method**            | Inheritance for steps          |
| Need tree / hierarchical structure              | Recursive composition                       | **Composite**                  | Part-whole hierarchy           |

#### Breadth Comparison 2: GoF Patterns vs Modern Language Alternatives

| GoF Pattern   | Classic Implementation             | Modern Alternative                                                                                | When GoF Still Wins                                                                      |
| ------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| **Observer**  | Subject + List + interface         | RxJava/Reactor, EventEmitter (Node.js), Pub/Sub (Kafka)                                           | Simple notification without broker infrastructure                                        |
| **Iterator**  | Iterator interface + hasNext/next  | `for (Type item : collection)` (Java), `for x in items` (Python/JS)                               | When you need external iteration with state management                                   |
| **Strategy**  | Interface + concrete classes       | Lambdas: `list.sort((a,b) -> a-b)`, `Comparator.comparing(User::getName)`                         | When strategy needs state and multiple methods                                           |
| **Command**   | Command interface + execute/undo   | Lambda: `Runnable`, `Supplier<T>`, `Consumer<T>` for one-shot ops                                 | When you need to serialize commands, queue them, or support complex undo trees           |
| **Factory**   | Factory class + switch/if          | `Map<String, Supplier<T>>` registry; Spring `@Component` auto-registration                        | When creation logic involves more than just instantiation (validation, logging, caching) |
| **Decorator** | Decorator class wrapping interface | `BufferedInputStream(InputStream)` (still used in Java I/O!), function composition `f.andThen(g)` | When you need runtime stacking of multiple behaviors                                     |
| **Singleton** | static instance + getInstance()    | Spring bean (default scope), `enum Singleton { INSTANCE }` (simplest)                             | When you need eager init with zero framework dependency                                  |
| **Facade**    | Interface + implementation         | Spring Boot `@SpringBootApplication`, SLF4J Logger, JDBC                                          | When you need to wrap a complex subsystem with a simple API                              |
| **Builder**   | Static inner Builder class         | Lombok `@Builder`, DSL in Kotlin, named parameters in Python                                      | When you need immutable objects and Java pre-Lombok                                      |

**Bottom line**: Modern languages have absorbed the SIMPLEST cases of most patterns (Strategy → lambdas, Iterator → for-each). However, the CONCEPTS remain essential: you still need Observer semantics even if the implementation is RxJava; you still need Factory decoupling even if the implementation uses a Map registry.


---

## 🏢 Enterprise Lens — Design Patterns

| Area | What top-tier engineering looks like |
| ---- | ------------------------------------ |
| **Where it runs in production** | JDK (`Comparator` as Strategy, `java.io` as Decorator), Spring (proxies, templates, events) |
| **Failure modes** | Pattern-first design, Singleton as hidden global state, over-engineered hierarchies |
| **Testing and verification** | Test the varying part through its interface; check that adding a variant touches one place |

---

## Reality Check

**"Knowing all 23 GoF patterns is the goal"** — The 1994 catalog is a HISTORICAL inventory, not a checklist: several patterns solved C++-specific problems (Prototype for expensive construction without reflection), others were absorbed into languages (Iterator is foreach; Strategy is a lambda; Observer is events/streams), and modern practice draws from maybe eight regularly. The durable skill is recognizing the FORCES a pattern balances — when someone says "we need different behavior per payment provider, chosen at runtime, testable in isolation," hearing Strategy — not reciting intent sections.

**"Singleton is the easy pattern"** — Singleton is the pattern most likely to be an ANTI-pattern in context: it is global mutable state with a design-pattern alibi — untestable (cannot substitute), concurrency-delicate (double-checked locking history), and hostile to anything needing two instances (multi-tenancy, tests in parallel). The modern verdicts: for true single services, let the DI container manage scope (Spring singletons are container-scoped, not class-enforced); for stateless utility, use static methods; for the rare genuine case, an enum singleton. Interview-wise, critiquing Singleton fluently scores higher than implementing it.

**"Factory Method and Abstract Factory are the same idea at different sizes"** — They answer different questions: Factory Method defers WHICH subclass to instantiate (one product, decided by subclasses or parameters); Abstract Factory guarantees FAMILIES stay consistent (all-Windows widgets or all-Mac widgets, never mixed). The consistency guarantee is the entire point of the second — flattening them into "factories make objects" loses the one sentence that makes Abstract Factory worth its weight, and interviewers probe exactly that sentence.

**"Decorator is how you add features to classes"** — Decorator adds features to INSTANCES at runtime, stacking transparently behind the same interface — java.io streams being the canonical live specimen (BufferedInputStream wrapping FileInputStream). Its costs are real: deep wrapper chains obscure debugging (which layer ate the exception?), identity breaks (equals across wrappers), and Java's sealed-type future limits it. Contrast-and-choose is the skill: subclassing for compile-time fixed variants, Decorator for runtime composition, AOP/proxies for cross-cutting concerns — three tools where the naive answer sees one.

**"Patterns make code better"** — Patterns make TRADE-OFFS explicit; applied without their forces present, they make code worse — the FactoryFactoryStrategyManager enterprise parody exists because pattern-count became a proxy for design skill. The discipline that survives review: name the force (variation point, family consistency, runtime stacking), THEN reach for the matching pattern, and prefer the language feature when one absorbed the pattern (lambda over Strategy class, enum over State machine for closed sets). Pattern fluency is knowing when NOT to, stated in the same breath.
