> **Navigation**: [< Previous](01_OOPS_Principles.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](03_System_Design.md)

# 🎨 Design Patterns: Complete Guide from Scratch

## Building Reusable, Maintainable Software

---

# 🎨 Part 0: Complete Understanding of Design Patterns

## What Are Design Patterns?

Design patterns are REUSABLE SOLUTIONS to COMMON problems that occur in
software design. They are templates, not finished code.

> 💡 **KEY INSIGHT: Patterns are like RECIPES in cooking!**
- Recipe tells you the approach, not exact ingredients
- You adapt the recipe to your specific needs
- Knowing recipes makes you a better cook/developer

> 💡 **ANALOGY:**

**Without Patterns**:
"I need to make food" → Start from scratch every time

**With Patterns**:
"I need to make curry" → Use curry recipe (known solution)
"I need to bake" → Use baking techniques (known approach)

**In Software**:
"I need one global config" → Use Singleton pattern
"I need to create objects flexibly" → Use Factory pattern

**Historical Evolution**:
- 1977: Christopher Alexander - patterns in architecture
- 1987: Kent Beck & Ward Cunningham - patterns in software
- 1994: Gang of Four (GoF) book - 23 classic patterns
- 2000s: Enterprise patterns, Web patterns emerged
- 2010s: Microservices patterns, Cloud patterns
- Today: Patterns for AI, serverless, reactive systems
## What Problem Do Design Patterns Solve?

**Problem 1 — Reinventing the Wheel**: Developers solve the same problems repeatedly, each solution different and often suboptimal. Patterns provide **proven** solutions.

**Problem 2 — Communication**: *"I used a thing that creates objects..."* (vague) vs *"I used the Factory pattern"* (precise, everyone understands). Patterns give us a **common vocabulary**.

**Problem 3 — Maintainability**: Spaghetti code is hard to change. Patterns enforce **structure** and **separation**.

**Problem 4 — Flexibility**: Requirements change constantly. Patterns make code **adaptable** to change.

> 💡 **Real-World Examples**: Java Collections → Iterator pattern, Spring → Factory/Singleton/Proxy, React → Observer pattern, Android → Builder pattern

---

## Why Learn Design Patterns?

1. **Better Code Quality** — Patterns are battle-tested; fewer bugs, easier maintenance
2. **Faster Development** — Don't waste time designing from scratch; apply known solutions
3. **Team Communication** — *"Use Strategy pattern here"* — everyone instantly understands
4. **Interview Success** — OOP/Design interviews test pattern knowledge directly
5. **Framework Understanding** — Spring, Hibernate, React all use patterns under the hood
6. **Career Growth** — Senior developers **must** know patterns
- Required for system design and architecture roles
## When To Use Design Patterns


**Use Patterns When**:
- ✅ You recognize a recurring problem
- ✅ You need flexibility for future changes
- ✅ You're building frameworks or libraries
- ✅ Multiple classes need to work together
- ✅ You want to follow SOLID principles
**Don't Use Patterns When**:
- ❌ Simple code does the job
- ❌ You're forcing a pattern where it doesn't fit
- ❌ Pattern adds unnecessary complexity
- ❌ One-time scripts or throwaway code

> 💡 **Golden Rule**: *"Use patterns to SOLVE problems, not to SHOW OFF knowledge."*
> Over-engineering with patterns is as bad as no patterns!
## ⭐ Growth Mindset: From Pattern User To Pattern Creator ⭐

| Level | Stage | Milestone |
|-------|-------|----------|
| 1 | **Learner** | *"I know what Singleton is"* |
| 2 | **Implementer** | *"I can implement Singleton correctly"* |
| 3 | **Recognizer** | *"I can identify when to use Singleton in my code"* |
| 4 | **Combiner** | *"I can combine multiple patterns to solve complex problems"* |
| 5 | **Creator** | *"I can create new patterns for recurring problems in my domain"* |

> 💡 **The Truth**: GoF patterns were CREATED by observing recurring solutions! YOU can observe patterns in your domain and document them too!
## Pattern Categories

1. **Creational Patterns** — *Object Creation*
   *"HOW do I create objects?"*
   Singleton, Factory, Abstract Factory, Builder, Prototype

2. **Structural Patterns** — *Object Composition*
   *"HOW do I structure classes and objects?"*
   Adapter, Bridge, Composite, Decorator, Facade, Proxy

3. **Behavioral Patterns** — *Object Interaction*
   *"HOW do objects communicate and behave?"*
   Observer, Strategy, Command, Iterator, State, Template Method

**Quick Selection Guide**:

| Need | Pattern |
|------|--------|
| Only one instance | **Singleton** |
| Create objects without specifying exact class | **Factory** |
| Complex object construction | **Builder** |
| Convert interface | **Adapter** |
| Add behavior dynamically | **Decorator** |
| Simplify complex subsystem | **Facade** |
| Notify multiple objects | **Observer** |
| Swap algorithms at runtime | **Strategy** |
| Undo/Redo operations | **Command** |
| Different behavior based on state | **State** |
## Difficulties & Common Mistakes

1. **"Too Abstract"** — Study with REAL examples, not just UML diagrams
2. **"Don't Know When To Use"** — Learn the PROBLEM each pattern solves first
3. **"Patterns Look Similar"** — Focus on INTENT, not structure. *Factory* = which type, *Builder* = how to construct
4. **"Over-Engineering"** — Start simple, add patterns when complexity grows
5. **"Too Many Patterns"** — Master these 10 first: Singleton, Factory, Builder, Adapter, Decorator, Facade, Observer, Strategy, Command, Template Method
## Expected Outcomes

- ✅ PATTERN RECOGNITION: See problem → Know which pattern applies
- ✅ CLEAN CODE: Write maintainable, flexible code
- ✅ FRAMEWORK MASTERY: Understand how Spring, React, etc. work
- ✅ INTERVIEW SUCCESS: Ace OOP design interview rounds
- ✅ COMMUNICATION: Discuss design precisely with team
- ✅ ARCHITECTURE THINKING: Design systems, not just features

**The Transformation**:

**From**: "I'll figure out how to structure this code"

**To**: "This is a Strategy pattern problem, I know exactly how to design it"

---

# 🎨 Part 1: Creational Patterns

## 1.1 Singleton Pattern

## What Is It?

Ensures a class has ONLY ONE INSTANCE and provides a global point of access.

> 💡 **ANALOGY: Government of a country**
- There's only ONE government at a time
- Everyone accesses the SAME government
- Creating a second government causes chaos
## What Problem Does It Solve

- Database connections: Only one connection pool needed
- Configuration: One config object shared across app
- Logging: One logger instance for entire application
- Cache: One cache instance to avoid inconsistency
## When To Use

- ✅ When exactly one instance is needed
- ✅ When global access is required
- ✅ When instance is expensive to create
- ❌ Don't use when you might need multiple instances later
- ❌ Don't use for everything (makes testing harder)

## 1.2 Factory Pattern

## What Is It?

Creates objects WITHOUT exposing the creation logic to the client.
Refers to the newly created object through a common interface.

> 💡 **ANALOGY: Pizza Restaurant**
- You order "Margherita" → Kitchen creates it (you don't know how)
- You order "Pepperoni" → Kitchen creates it (different recipe)
- You just ask for a type, factory handles the creation
## What Problem Does It Solve


**Without Factory**:
if (type.equals("dog")) animal = new Dog();
else if (type.equals("cat")) animal = new Cat();
// This code is scattered everywhere!

**With Factory**:
Animal animal = AnimalFactory.create(type);
// Creation logic in ONE place!

## 1.3 Builder Pattern

## What Is It?

Separates the construction of a complex object from its representation.
Allows step-by-step construction with fluent interface.

> 💡 **ANALOGY: Building a Custom Burger**
- Start with bun
- Add patty (or multiple)
- Add cheese (optional)
- Add vegetables (optional)
- Add sauces (optional)
- Build final burger
## What Problem Does It Solve

WITHOUT BUILDER (Telescoping constructor anti-pattern):
new User(name, email, phone, address, age, null, null, null, null, true);
// What are all these nulls? Confusing and error-prone!

**With Builder**:
User.builder()
.name("John")
.email("john@email.com")
.age(25)
.build();
// Clear, readable, flexible!

---

# 🎨 Part 2: Structural Patterns

## 2.1 Adapter Pattern

## What Is It?

Allows incompatible interfaces to work together by wrapping an object
with an adapter that translates calls.

> 💡 **ANALOGY: Power Adapter**
- US plug (110V) → Adapter → European socket (220V)
- The adapter makes incompatible things work together
## What Problem Does It Solve

- Legacy code integration
- Third-party library integration
- Working with different data formats

## 2.2 Decorator Pattern

## What Is It?

Attaches additional responsibilities to an object DYNAMICALLY.
Provides flexible alternative to subclassing for extending functionality.

> 💡 **ANALOGY: Coffee Shop**
- Base: Plain Coffee ($2)
- Add Milk decorator: +$0.50
- Add Sugar decorator: +$0.25
- Add Whip decorator: +$0.75
- Total: $3.50 (same coffee, enhanced!)

## 2.3 Facade Pattern

## What Is It?

Provides a SIMPLIFIED INTERFACE to a complex subsystem.
Hides complexity behind a simple API.

> 💡 **ANALOGY: Universal Remote**
- TV, Sound System, DVD Player, Lights - all complex
- Remote has one button: "Watch Movie"
- Behind scenes: dims lights, turns on TV, selects HDMI, starts player

---

# 🎨 Part 3: Behavioral Patterns

## 3.1 Observer Pattern

## What Is It?

Defines a one-to-many dependency between objects so that when one object
changes state, all dependents are notified and updated automatically.

> 💡 **ANALOGY: Newsletter Subscription**
- You subscribe to a newsletter
- When new content is published, all subscribers get notified
- Subscribers can unsubscribe anytime

## 3.2 Strategy Pattern

## What Is It?

Defines a family of algorithms, encapsulates each one, and makes them
interchangeable. Lets the algorithm vary independently from clients.

> 💡 **ANALOGY: Navigation App**
- Same destination, different strategies: Car, Walk, Bike, Transit
- You choose the strategy, app calculates route using that strategy
- Strategies are interchangeable

## 3.3 Command Pattern

## What Is It?

Encapsulates a request as an object, allowing you to parameterize clients,
queue requests, log operations, and support undo/redo.

> 💡 **ANALOGY: Restaurant Order**
- Waiter writes order on paper (Command object)
- Takes it to kitchen (passes to invoker)
- Chef executes the order (receiver)
- Order can be queued, logged, undone

---

# 🎨 Part 4: Pattern Combinations

**Example: E-commerce Order System using Multiple Patterns**

| Pattern | Role |
|---------|------|
| **Singleton** | Configuration, Database connection |
| **Factory** | Creating different order types |
| **Builder** | Building complex Order objects |
| **Observer** | Notifying systems when order status changes |
| **Strategy** | Different payment methods |
| **Decorator** | Adding features to orders (gift wrap, insurance) |

```java
// 1. SINGLETON - Configuration
public enum AppConfig {
    INSTANCE;
    public String getDatabaseUrl() { return "jdbc:mysql://..."; }
}
```

```java
// 2. BUILDER - Complex Order Creation
public class Order {
    public static class Builder {
        private List<OrderItem> items = new ArrayList<>();
        private Address shippingAddress;
        private PaymentStrategy paymentStrategy;
        // ... builder methods
    }
}
```

```java
// 3. FACTORY - Order Types
public class OrderFactory {
    public static Order createOrder(String type, Order.Builder builder) {
        switch (type) {
            case "regular": return builder.build();
            case "express": return new ExpressOrder(builder);
            case "subscription": return new SubscriptionOrder(builder);
        }
    }
}
```

```java
// 4. OBSERVER - Order Status Updates
public class Order implements Subject {
    private List<OrderObserver> observers = new ArrayList<>();

    public void setStatus(OrderStatus status) {
        this.status = status;
        notifyObservers(); // Notify inventory, shipping, customer
    }
}
```

```java
// 5. STRATEGY - Payment
public class Order {
    private PaymentStrategy paymentStrategy;

    public void processPayment() {
        paymentStrategy.pay(getTotal());
    }
}
```

```java
// 6. DECORATOR - Add Features
public interface Order {
    double getTotal();
}

public class GiftWrapDecorator extends OrderDecorator {
    @Override
    public double getTotal() {
        return order.getTotal() + 5.99; // Gift wrap cost
    }
}
```

**All patterns working together:**

```java
Order order = OrderFactory.createOrder("express",
    Order.builder()
        .addItem(new OrderItem("Laptop", 999))
        .shippingAddress(address)
        .paymentStrategy(new CreditCardPayment(card))
        .build());

order.subscribe(new InventoryService());
order.subscribe(new NotificationService());

order = new GiftWrapDecorator(order); // Add gift wrap
order = new InsuranceDecorator(order); // Add insurance

order.processPayment(); // Uses strategy
order.setStatus(OrderStatus.PAID); // Notifies observers
```

---

# 📖 Part 5: Quick Reference Table


| Pattern | Use When |
|---------|----------|
| **Singleton** | Need exactly one instance (config, logger, connection pool) |
| **Factory** | Create objects without specifying exact class |
| **Builder** | Complex object with many optional parameters |
| **Adapter** | Make incompatible interfaces work together |
| **Decorator** | Add behavior dynamically without changing original |
| **Facade** | Simplify complex subsystem with single interface |
| **Observer** | One-to-many notification when state changes |
| **Strategy** | Swap algorithms at runtime |
| **Command** | Need undo/redo, queue operations, log operations |
| **State** | Object behavior depends on its state |
| **Template** | Define algorithm skeleton, let subclasses fill steps |
| **Composite** | Tree structure of objects (file system, UI components) |
| **Proxy** | Control access, lazy loading, caching |


---

# 💪 Curated Practice Problems — OOP & Design Patterns

> **HOW TO USE**: These are system design / OOP implementation problems.
> Section 1 = implement data structures using OOP. Section 2 = apply design patterns.
> Section 3 = LeetCode design class problems.

---

## Section 1: OOP Implementation — Build From Scratch

| # | Problem | Platform | Difficulty | Key Technique |
|---|---------|----------|------------|---------------|
| 1 | Design HashMap (LC 706) | LeetCode | Easy | Array of buckets + chaining |
| 2 | Design HashSet (LC 705) | LeetCode | Easy | Boolean bucket or linked list |
| 3 | Min Stack (LC 155) | LeetCode | Medium | Two stacks or store (val, min) pairs |
| 4 | Implement Queue using Stacks (LC 232) | LeetCode | Easy | Two stacks: push/pop inversion |
| 5 | Implement Stack using Queues (LC 225) | LeetCode | Easy | Push costly or pop costly |
| 6 | Design Linked List (LC 707) | LeetCode | Medium | Sentinel nodes, doubly linked |
| 7 | Design Circular Queue (LC 622) | LeetCode | Medium | Array with front/rear pointers |
| 8 | Design Circular Deque (LC 641) | LeetCode | Medium | Extend circular queue both ends |

---

## Section 2: Design Class Problems (Strategy/Observer/Iterator)

| # | Problem | Platform | Difficulty | Key Technique |
|---|---------|----------|------------|---------------|
| 1 | LRU Cache (LC 146) | LeetCode | Medium | HashMap + Doubly Linked List |
| 2 | LFU Cache (LC 460) | LeetCode | Hard | HashMap + frequency buckets |
| 3 | Iterator for Combination (LC 1286) | LeetCode | Medium | Iterator pattern, precompute or lazy |
| 4 | Flatten Nested List Iterator (LC 341) | LeetCode | Medium | Stack + recursive flatten |
| 5 | Peeking Iterator (LC 284) | LeetCode | Medium | Decorator pattern on iterator |
| 6 | Design Twitter (LC 355) | LeetCode | Medium | OOP: User, Tweet, Feed (merge k) |
| 7 | Design Browser History (LC 1472) | LeetCode | Medium | Command pattern / doubly linked |
| 8 | Design Underground System (LC 1396) | LeetCode | Medium | HashMap tracking check-in/out |

---

## Section 3: Advanced Design

| # | Problem | Platform | Difficulty | Key Technique |
|---|---------|----------|------------|---------------|
| 1 | Serialize and Deserialize Binary Tree (LC 297) | LeetCode | Hard | Preorder + null markers |
| 2 | Design Add and Search Words (LC 211) | LeetCode | Medium | Trie + DFS for wildcard |
| 3 | Implement Trie (LC 208) | LeetCode | Medium | Array[26] children nodes |
| 4 | Design File System (LC 1166) | LeetCode | Medium | Trie or HashMap of paths |
| 5 | Design Hit Counter (LC 362) | LeetCode | Medium | Queue or circular buffer |
| 6 | Insert Delete GetRandom O(1) (LC 380) | LeetCode | Medium | ArrayList + HashMap swap trick |
| 7 | Find Median from Data Stream (LC 295) | LeetCode | Hard | Two heaps (maxHeap + minHeap) |

---

## HIDDEN GEMS — Design Problems

| # | Problem | Platform | Why It's Valuable |
|---|---------|----------|-------------------|
| 1 | Design Parking System (LC 1603) | LeetCode | Simplest OOP design — good warm-up |
| 2 | Design an Ordered Stream (LC 1656) | LeetCode | Pointer advancement pattern |
| 3 | Snapshot Array (LC 1146) | LeetCode | Binary search on version history |
| 4 | Time Based Key-Value Store (LC 981) | LeetCode | TreeMap or binary search on timestamps |
| 5 | Online Stock Span (LC 901) | LeetCode | Monotonic stack as internal state |

---

> **Navigation**: [< Previous](01_OOPS_Principles.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](03_System_Design.md)