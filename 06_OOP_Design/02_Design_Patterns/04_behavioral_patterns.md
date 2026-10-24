# 🎨 Part 3: Behavioral Patterns

> **Navigation**: [← Structural Patterns](03_structural_patterns.md) | [Chapter overview](../02_Design_Patterns.md)
> Page 4 of 4 in **Design Patterns: Complete Guide from Scratch**


## 3.1 Observer Pattern

### 5W1H: Deep Understanding

```
WHAT: Defines a one-to-many dependency between objects so that when
      one object (Subject) changes state, all its dependents (Observers)
      are notified and updated automatically.

WHY:  Without Observer, objects must POLL for changes:
      while (true) { if (subject.hasChanged()) update(); sleep(100); }
      This wastes CPU and misses changes between polls.
      Observer uses PUSH: subject notifies observers immediately.

ANALOGY — YOUTUBE SUBSCRIPTION:
  YouTuber = Subject (observable)
  Subscribers = Observers
  When YouTuber uploads a video → ALL subscribers get notified.
  You can subscribe (register) and unsubscribe (deregister) anytime.
  YouTuber doesn't need to know WHO the subscribers are.

HOW IT WORKS INTERNALLY:
  1. Subject maintains a List<Observer> (subscribers)
  2. Observer interface has update(data) method
  3. Subject.addObserver(observer) → adds to list
  4. Subject.setState(newState) → iterates list, calls observer.update()
  5. Each observer reacts independently to the notification

REAL-WORLD:
  • React's useState: when state changes, component re-renders (observes state)
  • Spring's ApplicationEventPublisher / @EventListener
  • JavaScript: addEventListener/removeEventListener
  • Message Queues (Kafka, RabbitMQ): producers and consumers
  • MVC: Model (subject) notifies View (observer) on data change

VARIANTS:
  Push model: Subject sends data WITH notification (observer.update(data))
  Pull model: Subject sends notification only, observer PULLS data
  Pub/Sub: Adds a message broker between subject and observer
```

💡 **ANALOGY: Newsletter Subscription**

- You subscribe to a newsletter
- When new content is published, all subscribers get notified
- Subscribers can unsubscribe anytime

🔬 **Section Challenge — 3.1 Observer Pattern**

**Challenge 1 (Design — Who/When/What):** The variants section mentions Push vs Pull model. **When** would you choose Pull over Push? **What** is the problem with Push when observers need different data subsets?

<details><summary>Answer</summary>

**Push problem:** Subject sends ALL data to ALL observers. If Observer A only needs `price` and Observer B only needs `volume`, Push sends both fields to both — wasting bandwidth and coupling observers to the full data model. Adding a new field forces all observers to update. **Pull model:** Subject sends just a notification ("I changed"). Each observer calls back to get only the specific data it needs: `subject.getPrice()`. Observers are decoupled from each other's data needs. **When Pull?** When observers need different data subsets. **When Push?** When all observers need the same small payload and you want to minimize round trips.

</details>

## 3.2 Strategy Pattern

### 5W1H: Deep Understanding

```
WHAT: Defines a family of algorithms, encapsulates each one, and makes
      them INTERCHANGEABLE. Lets the algorithm vary independently.

WHY:  Without Strategy, you get a massive if-else chain:
      if (type == CREDIT) { ... }
      else if (type == PAYPAL) { ... }
      else if (type == BITCOIN) { ... }
      Adding a new payment method = modifying existing code (violates OCP)

      With Strategy: paymentStrategy.pay(amount);
      Adding UPI? Create new UPIPayment implementing PaymentStrategy.
      ZERO changes to existing code.

ANALOGY — NAVIGATION APP:
  Destination: same (office to home)
  Strategy 1: by car (fastest route, consider traffic)
  Strategy 2: by walk (shortest path, no highways)
  Strategy 3: by bus (cheapest, follows bus routes)
  The APP (context) doesn't know the routing algorithm.
  It DELEGATES to the chosen strategy.

HOW IT WORKS INTERNALLY:
  1. Strategy INTERFACE defines the algorithm contract: execute(input)
  2. ConcreteStrategy A, B, C each implement the interface differently
  3. Context class holds a Strategy REFERENCE (composition, not inheritance)
  4. Context delegates work to the strategy: strategy.execute(input)
  5. Client can SWAP strategies at runtime: context.setStrategy(new B())

STRATEGY vs STATE:
  Strategy: client CHOOSES the algorithm (user selects sort method)
  State: object TRANSITIONS between algorithms automatically
        (order goes from Pending → Shipped → Delivered)

REAL-WORLD:
  • Collections.sort(list, comparator) — Comparator IS a Strategy
  • Spring's AuthenticationProvider — different auth strategies
  • Java's ScheduledExecutorService — different scheduling strategies
```

💡 **ANALOGY: Navigation App**

- Same destination, different strategies: Car, Walk, Bike, Transit
- You choose the strategy, app calculates route using that strategy
- Strategies are interchangeable

🔬 **Section Challenge — 3.2 Strategy Pattern**

**Challenge 1 (Reasoning):** Strategy vs State: both swap behavior. The section says "Strategy: client CHOOSES, State: object TRANSITIONS." **Who** decides the algorithm in each case? Give one example where confusing them causes a bug.

<details><summary>Answer</summary>

**Strategy:** The CLIENT (external code) explicitly picks: `cart.setPaymentStrategy(new PayPalPayment())`. The object doesn't change strategy on its own. **State:** The OBJECT internally transitions: `order.ship()` changes state from PAID → SHIPPED. The client doesn't set the state directly. **Bug from confusion:** If you implement a vending machine with Strategy (client picks state), the machine could go from DISPENSING → ACCEPTING_MONEY — skipping MAKING_CHANGE. With State pattern, the machine enforces valid transitions: only DISPENSING → MAKING_CHANGE → IDLE. Invalid transitions throw exceptions.

</details>

## 3.3 Command Pattern

### 5W1H: Deep Understanding

```
WHAT: Encapsulates a request as an OBJECT, allowing you to parameterize
      clients, queue requests, log operations, and support undo/redo.

WHY:  Sometimes you need to:
      • UNDO an operation (Ctrl+Z in text editor)
      • QUEUE operations for later execution (job queue)
      • LOG all operations for audit trail
      • RETRY failed operations
      None of this is possible if the operation is just a method call.
      By turning the operation into an OBJECT, it becomes data you can
      store, queue, replay, and reverse.

ANALOGY — RESTAURANT ORDER:
  Customer → "I want pasta" (creates a command)
  Waiter writes it on paper (Command object with all details)
  Takes it to kitchen (passes to Invoker)
  Chef executes the order (Receiver executes command)
  Paper slip can be: queued, logged, undone ("cancel that pasta")

HOW IT WORKS INTERNALLY:
  1. Command interface: execute(), undo()
  2. ConcreteCommand: stores Receiver + parameters for the action
  3. Invoker: calls command.execute() (button, menu, scheduler)
  4. Receiver: the object that actually does the work
  5. History stack: stores executed commands for undo/redo

REAL-WORLD:
  • Text editor undo/redo (each keystroke = command)
  • Transaction rollback in databases
  • Spring's TaskExecutor — commands queued for thread pool
  • GUI buttons — each button has a Command object
```

💡 **ANALOGY: Restaurant Order**

- Waiter writes order on paper (Command object)
- Takes it to kitchen (passes to invoker)
- Chef executes the order (receiver)
- Order can be queued, logged, undone

---

🔬 **Section Challenge — 3.3 Command Pattern**

**Challenge 1 (Trace — Who/When/What):** In a text editor's undo system: you type "Hello", then Ctrl+Z. Trace the Command lifecycle. **Who** creates the command? **When** is it stored? **What** does `undo()` actually do vs `execute()`?

<details><summary>Answer</summary>

**Who creates?** The key handler: when you type 'H', it creates `new InsertCharCommand('H', position)`. **When stored?** Immediately after `execute()`: the command is pushed onto a history stack. **What does undo() do?** The INVERSE operation. `execute()` inserts 'H' at position 5 → `undo()` deletes character at position 5. For "Hello" (5 commands on stack), Ctrl+Z pops the top command (`InsertCharCommand('o', 9)`) and calls `undo()` — deleting 'o'. The text becomes "Hell". Each command encapsulates both the DO and UNDO logic.

</details>

## 🎨 Part 4: Pattern Combinations

**Example: E-commerce Order System using Multiple Patterns**

| Pattern       | Role                                             |
| ------------- | ------------------------------------------------ |
| **Singleton** | Configuration, Database connection               |
| **Factory**   | Creating different order types                   |
| **Builder**   | Building complex Order objects                   |
| **Observer**  | Notifying systems when order status changes      |
| **Strategy**  | Different payment methods                        |
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

## 📖 Part 5: Quick Reference Table

| Pattern       | Use When                                                    |
| ------------- | ----------------------------------------------------------- |
| **Singleton** | Need exactly one instance (config, logger, connection pool) |
| **Factory**   | Create objects without specifying exact class               |
| **Builder**   | Complex object with many optional parameters                |
| **Adapter**   | Make incompatible interfaces work together                  |
| **Decorator** | Add behavior dynamically without changing original          |
| **Facade**    | Simplify complex subsystem with single interface            |
| **Observer**  | One-to-many notification when state changes                 |
| **Strategy**  | Swap algorithms at runtime                                  |
| **Command**   | Need undo/redo, queue operations, log operations            |
| **State**     | Object behavior depends on its state                        |
| **Template**  | Define algorithm skeleton, let subclasses fill steps        |
| **Composite** | Tree structure of objects (file system, UI components)      |
| **Proxy**     | Control access, lazy loading, caching                       |

---

[← Structural Patterns](03_structural_patterns.md) | [Chapter overview](../02_Design_Patterns.md)
