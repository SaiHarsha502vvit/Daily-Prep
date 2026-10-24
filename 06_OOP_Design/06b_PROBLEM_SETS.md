# 📝 OOP & Design — Problem Sets

> **Navigation**: [← LLD Reference Implementations…](13_LLD_Reference_Implementations.md) | [Chapter index](00_INDEX.md) | [From User Stories to Design… →](10_Stories_To_Design.md)

## `06_OOP_Design` Module | ETH Zurich / MIT Style

> **How to use:** Attempt every part before reading the answer. Part B code goes in `JavaSolutions/ps/oop/`. Run JUnit stubs. Read 🔴 **Erklärung** if you fail.

---

## 🔗 Bridge — Where This Chapter Fits

| Dimension | This chapter |
| --- | --- |
| **Builds on** | [OOP Principles](01_OOPS_Principles.md), [Design Patterns](02_Design_Patterns.md), [LLD Solved Problems](07_LLD_Solved_Problems.md) |
| **You will learn** | Practice on SOLID, GoF patterns and low-level design with starter code and tests |
| **Leads to** | [LLD Solved Problems](07_LLD_Solved_Problems.md), [Design Patterns in Java](08_Design_Patterns_Java.md) |
| **Abstraction level** | Reading solutions → **producing your own designs under constraints** |

> [!NOTE]
> The full gap-free reading order and dependency graph are in the [Learning Path](00_LEARNING_PATH.md).

---

## 💬 Explain It Like a Study Partner — OOP and Design Problem Sets

### 1. The bottom line

Attempt the problem, run the tests, then compare with the model solution; the struggle is the learning.

### 2. The textbook core

- Each set targets one skill: SOLID, patterns, or LLD.
- Starter stubs show the expected signatures.
- Tests define the behaviour; the design is yours.
- Review your solution against the principle each problem trains.

### 3. The real-world analogy

A **gym circuit**: each station isolates a muscle so that when you play the real game, the movements are automatic.

### 4. Walkthrough

1. Read the problem and the tests.
2. Sketch the classes and responsibilities.
3. Implement until the tests pass.
4. Refactor against the principle being trained.
5. Compare with the model answer and note the differences.

> [!NOTE]
> **Quick check:** Why do the tests come before the model answer? *Attempting first reveals what you do not yet know.*

### 5. Check yourself

**Q1.** How can you measure whether your design is flexible?

<details><summary>Answer</summary>

Add a plausible new requirement and count how many classes you must edit; fewer is better.

</details>

**Q2.** Why include JUnit stubs?

<details><summary>Answer</summary>

They fix the interface and give immediate feedback so effort goes into design, not guessing signatures.

</details>

---


## Problem Set OOP-PS1 — SOLID Principles

**Prerequisites:** `06_OOP_Design/01_OOPS_Principles.md`

---

### Part A: Theoretical

**A1 (Easy).** Which SOLID principle does this class violate? Explain precisely.

```java
public class UserService {
    public void createUser(User user) { /* save to DB */ }
    public void sendWelcomeEmail(User user) { /* call SMTP */ }
    public void logAuditTrail(User user) { /* write to log */ }
    public void validatePassword(String pw) { /* check regex */ }
}
```

<details><summary>Answer</summary>

**Violation: Single Responsibility Principle (SRP)**

`UserService` has four distinct reasons to change:

1. DB schema changes → `createUser()` changes
2. Email template changes → `sendWelcomeEmail()` changes
3. Audit format changes → `logAuditTrail()` changes
4. Password policy changes → `validatePassword()` changes

**Correct design:** Split into `UserRepository`, `EmailService`, `AuditService`, `PasswordValidator`.

🔴 **Erklärung:** SRP is NOT "one method per class." It is "one reason to change." A class with 50 methods can respect SRP if they all change for the same reason.

</details>

---

**A2 (Medium).** A tax calculator uses `if/else` on country strings. Adding a new country requires modifying the class. Which principle is violated? Provide the corrected design.

```java
public class TaxCalculator {
    public double calculate(Order order, String country) {
        if (country.equals("IN")) return order.total() * 0.18;
        if (country.equals("US")) return order.total() * 0.08;
        if (country.equals("DE")) return order.total() * 0.19;
        return 0;
    }
}
```

<details><summary>Answer</summary>

**Violation: Open-Closed Principle (OCP)** — open for modification, closed for extension.

```java
public interface TaxStrategy {
    double calculate(Order order);
}

public class IndiaTax implements TaxStrategy {
    public double calculate(Order order) { return order.total() * 0.18; }
}

public class TaxCalculator {
    private final Map<String, TaxStrategy> strategies;
    public TaxCalculator(Map<String, TaxStrategy> strategies) {
        this.strategies = strategies;
    }
    public double calculate(Order order, String country) {
        return strategies.getOrDefault(country, o -> 0.0).calculate(order);
    }
}
```

Adding Germany = `strategies.put("DE", o -> o.total() * 0.19)` — zero modification to existing code.

🔴 **Erklärung:** OCP and Strategy Pattern are architecturally equivalent for this class of problem. OCP defines the goal; Strategy defines the mechanism.

</details>

---

**A3 (Hard).** Prove with a concrete example that the Liskov Substitution Principle (LSP) violation breaks polymorphism.

<details><summary>Answer</summary>

```java
class Rectangle {
    int width, height;
    void setWidth(int w) { this.width = w; }
    void setHeight(int h) { this.height = h; }
    int area() { return width * height; }
}

class Square extends Rectangle {
    @Override void setWidth(int w) { this.width = this.height = w; }  // VIOLATION
    @Override void setHeight(int h) { this.width = this.height = h; }
}

void testArea(Rectangle r) {
    r.setWidth(5);
    r.setHeight(3);
    assert r.area() == 15; // FAILS if r is Square — area = 9
}
```

LSP requires: if `S extends P`, objects of `S` must satisfy all postconditions of `P`. `Square` violates the postcondition "setWidth(5) leaves height unchanged."

🔴 **Erklärung:** Geometric taxonomy (square IS-A rectangle) does NOT imply OO substitutability. LSP is about behavioral contracts, not class hierarchy.

</details>

---

### Part B: Implementation

**B1.** Implement a payment processor using Strategy + OCP:

```java
// Skeleton — JavaSolutions/ps/oop/PaymentProcessor.java
public interface PaymentStrategy {
    PaymentResult process(PaymentRequest request);
    String name();
}
public record PaymentRequest(String customerId, java.math.BigDecimal amount) {}
public record PaymentResult(boolean success, String transactionId, String message) {}

public class StripeStrategy implements PaymentStrategy {
    @Override public PaymentResult process(PaymentRequest req) {
        // TODO: simulate Stripe call
        return new PaymentResult(true, "stripe-" + java.util.UUID.randomUUID(), "charged");
    }
    @Override public String name() { return "STRIPE"; }
}

public class PaymentProcessor {
    private final java.util.Map<String, PaymentStrategy> strategies = new java.util.HashMap<>();

    public void register(PaymentStrategy strategy) {
        strategies.put(strategy.name(), strategy);
    }

    public PaymentResult process(String gateway, PaymentRequest request) {
        // TODO: look up strategy, throw IllegalArgumentException if not found
        var strategy = strategies.get(gateway);
        if (strategy == null) throw new IllegalArgumentException("Unknown gateway: " + gateway);
        return strategy.process(request);
    }
}
```

**JUnit Test Stub:**

```java
class PaymentProcessorTest {
    PaymentProcessor processor = new PaymentProcessor();
    @BeforeEach void setup() { processor.register(new StripeStrategy()); }

    @Test void process_stripe_returnsSuccess() {
        var result = processor.process("STRIPE", new PaymentRequest("cust-1", java.math.BigDecimal.valueOf(500)));
        assertTrue(result.success());
        assertNotNull(result.transactionId());
    }
    @Test void process_unknownGateway_throws() {
        assertThrows(IllegalArgumentException.class,
            () -> processor.process("BITCOIN", new PaymentRequest("c1", java.math.BigDecimal.TEN)));
    }
    @Test void addNewGateway_noExistingCodeChange() {
        processor.register(req -> new PaymentResult(true, "BANK-001", "ok"), () -> "BANK");
        assertTrue(processor.process("BANK", new PaymentRequest("c2", java.math.BigDecimal.valueOf(1000))).success());
    }
}
```

🔴 **Erklärung:**

| Mistake                                        | Why                                                 | Fix                                            |
| ---------------------------------------------- | --------------------------------------------------- | ---------------------------------------------- |
| `if (gateway.equals("STRIPE"))` in `process()` | Violates OCP — adding new gateway breaks the method | Use `Map<String, PaymentStrategy>`             |
| No fallback for unknown gateway                | Silent null returns corrupt downstream state        | Always throw or return explicit failure result |
| Mutable state in Strategy implementations      | Thread-safety issues in concurrent API calls        | Strategies should be stateless beans           |

---

## Problem Set OOP-PS2 — Design Patterns (GoF)

---

### Part A: Theoretical

**A1 (Easy).** What is the difference between Factory Method and Abstract Factory? One example of each.

<details><summary>Answer</summary>

**Factory Method:** One interface for creating ONE product. Subclasses decide the concrete type.

- Java example: `Collection.iterator()` — each collection returns its own iterator.

**Abstract Factory:** Creates a **family** of related objects. All created together, ensuring compatibility.

- Java example: `DocumentBuilderFactory.newInstance()` — returns a factory producing consistent XML parser objects.

🔴 **Erklärung:** Factory Method = one product. Abstract Factory = a suite of compatible products. If you need `Button` AND `Scrollbar` to both be Windows-style or Mac-style, use Abstract Factory.

</details>

---

**A2 (Medium).** Map a Spring user-registration flow to the Observer Pattern. Show code.

<details><summary>Answer</summary>

**Subject:** `UserService` publishes `UserRegisteredEvent`.
**Observers:** `WelcomeEmailListener`, `AnalyticsListener`, `AuditLogListener`.

```java
// Event
record UserRegisteredEvent(String userId, String email) {}

// Subject (publisher)
@Service class UserService {
    @Autowired ApplicationEventPublisher publisher;
    public void register(User user) {
        userRepo.save(user);
        publisher.publishEvent(new UserRegisteredEvent(user.id(), user.email()));
    }
}

// Observer 1 — knows nothing about UserService
@Component class WelcomeEmailListener {
    @EventListener void on(UserRegisteredEvent e) { /* send welcome email to e.email() */ }
}
```

`UserService` is completely unaware of what happens after publishing. New observers are added with zero changes to `UserService`. This is textbook Observer.

🔴 **Erklärung:** Calling `emailService.sendWelcome()` directly inside `register()` creates tight coupling. `UserService` then has multiple reasons to change (email template, analytics API, audit format).

</details>

---

**A3 (Hard).** Why is GoF Singleton an anti-pattern in Spring Boot? What replaces it?

<details><summary>Answer</summary>

**Problems with GoF Singleton:**

1. Global mutable state — any class can corrupt it
2. `getInstance()` = tight coupling to concrete class — untestable without hacks
3. Concurrency bugs — static mutable fields are not thread-safe by default
4. Multiple ClassLoader instances in app servers → not actually singleton

**Spring's replacement:** IoC container + `@Singleton` scope (default).

- Spring creates ONE instance per ApplicationContext — same result
- But it is **injected**, not fetched — dependency is in constructor, not `getInstance()`
- In tests, inject a `@MockBean` — zero coupling, full testability

🔴 **Erklärung:** "Spring beans are singletons" and "GoF Singleton pattern" are architecturally different despite the same word. Spring Singleton = container-managed. GoF Singleton = self-managed. The difference is who controls instantiation.

</details>

---

### Part B: Implementation

**B2.** Implement an EventBus (Observer Pattern):

```java
// Skeleton — JavaSolutions/ps/oop/EventBus.java
import java.util.*;
import java.util.function.Consumer;

public class EventBus {
    private final Map<Class<?>, List<Consumer<Object>>> listeners = new HashMap<>();

    @SuppressWarnings("unchecked")
    public <T> void subscribe(Class<T> eventType, Consumer<T> listener) {
        listeners.computeIfAbsent(eventType, k -> new ArrayList<>())
                 .add(e -> listener.accept((T) e));
    }

    public void publish(Object event) {
        var handlers = listeners.getOrDefault(event.getClass(), List.of());
        for (var handler : handlers) handler.accept(event);
    }
}
```

**JUnit Test Stub:**

```java
class EventBusTest {
    EventBus bus = new EventBus();
    record UserEvent(String id) {}
    record OrderEvent(String orderId) {}

    @Test void subscribe_andPublish_callsListener() {
        var received = new ArrayList<String>();
        bus.subscribe(UserEvent.class, e -> received.add(e.id()));
        bus.publish(new UserEvent("user-1"));
        assertEquals(List.of("user-1"), received);
    }
    @Test void multipleListeners_allCalled() {
        var log = new ArrayList<String>();
        bus.subscribe(UserEvent.class, e -> log.add("email-" + e.id()));
        bus.subscribe(UserEvent.class, e -> log.add("audit-" + e.id()));
        bus.publish(new UserEvent("u1"));
        assertEquals(2, log.size());
    }
    @Test void differentEvents_dontInterfere() {
        var userLog = new ArrayList<UserEvent>();
        var orderLog = new ArrayList<OrderEvent>();
        bus.subscribe(UserEvent.class, userLog::add);
        bus.subscribe(OrderEvent.class, orderLog::add);
        bus.publish(new UserEvent("u1"));
        bus.publish(new OrderEvent("o1"));
        assertEquals(1, userLog.size());
        assertEquals(1, orderLog.size());
    }
}
```

---

## Problem Set OOP-PS3 — Low Level Design (LLD)

---

### Part A: Theoretical

**A1 (Medium).** Design a Rate Limiter. Compare Token Bucket vs Sliding Window algorithms.

<details><summary>Answer</summary>

**Token Bucket:**

- Invariant: bucket holds up to `capacity` tokens; refills at rate `r/sec`; 1 request = 1 token.
- Allows burst up to `capacity` tokens.
- Failure: user depletes all tokens instantly in a burst.

**Sliding Window Counter:**

- Invariant: total requests in any rolling N-second window ≤ `limit`.
- No burst beyond limit allowed.
- Failure: memory-intensive for high-cardinality (many unique user keys with timestamps).

**Production usage:** APIs (Stripe, AWS) use Token Bucket — burst tolerance is desirable. Auth systems use Sliding Window — precision is critical (brute-force login prevention).

🔴 **Erklärung:** Naive `if (count++ == limit) block; reset at minute` fails: a user sends `limit` requests at 00:59 and `limit` more at 01:01 → `2×limit` in 2 seconds. Sliding Window fixes this.

</details>

---

### Part B: Implementation

**B3.** Implement Parking Lot (ParkingSpot, Vehicle hierarchy, ParkingLot):

```java
// Skeleton — JavaSolutions/ps/oop/parking/
public enum SpotSize { SMALL, MEDIUM, LARGE }

public abstract class Vehicle {
    public final String plate;
    public final SpotSize requiredSize;
    protected Vehicle(String plate, SpotSize size) { this.plate = plate; this.requiredSize = size; }
}
public class Car extends Vehicle { public Car(String plate) { super(plate, SpotSize.MEDIUM); } }
public class Motorcycle extends Vehicle { public Motorcycle(String plate) { super(plate, SpotSize.SMALL); } }
public class Truck extends Vehicle { public Truck(String plate) { super(plate, SpotSize.LARGE); } }

public class ParkingSpot {
    public final String id;
    public final SpotSize size;
    private Vehicle vehicle;
    public ParkingSpot(String id, SpotSize size) { this.id = id; this.size = size; }
    public boolean isAvailable() { return vehicle == null; }
    public boolean canFit(Vehicle v) { return isAvailable() && size == v.requiredSize; }
    public void park(Vehicle v) { if (!canFit(v)) throw new IllegalStateException(); vehicle = v; }
    public Vehicle vacate() { var v = vehicle; vehicle = null; return v; }
}

public record Ticket(String id, String spotId, String plate, java.time.Instant issuedAt) {}

public class ParkingLot {
    private final List<ParkingSpot> spots;
    private final Map<String, Ticket> active = new HashMap<>();
    public ParkingLot(List<ParkingSpot> spots) { this.spots = spots; }

    public synchronized Ticket park(Vehicle v) {
        // TODO: find spot.canFit(v), park vehicle, create Ticket, store in active
        return spots.stream().filter(s -> s.canFit(v)).findFirst()
            .map(s -> {
                s.park(v);
                var t = new Ticket(java.util.UUID.randomUUID().toString(), s.id, v.plate, java.time.Instant.now());
                active.put(t.id(), t);
                return t;
            }).orElseThrow(() -> new RuntimeException("Parking full"));
    }

    public synchronized void vacate(String ticketId) {
        // TODO: find ticket, find spot, vacate, remove ticket
        var ticket = active.remove(ticketId);
        if (ticket == null) throw new IllegalArgumentException("Invalid ticket");
        spots.stream().filter(s -> s.id.equals(ticket.spotId())).findFirst()
            .ifPresent(ParkingSpot::vacate);
    }

    public long availableSpots(SpotSize size) {
        return spots.stream().filter(s -> s.size == size && s.isAvailable()).count();
    }
}
```

**JUnit Test Stub:**

```java
class ParkingLotTest {
    ParkingLot lot = new ParkingLot(List.of(
        new ParkingSpot("S1", SpotSize.SMALL),
        new ParkingSpot("M1", SpotSize.MEDIUM),
        new ParkingSpot("M2", SpotSize.MEDIUM),
        new ParkingSpot("L1", SpotSize.LARGE)
    ));

    @Test void park_car_usesMediumSpot() {
        var ticket = lot.park(new Car("KA01"));
        assertNotNull(ticket.id());
        assertEquals(1, lot.availableSpots(SpotSize.MEDIUM));
    }
    @Test void vacate_freesSpot() {
        var ticket = lot.park(new Car("KA01"));
        lot.vacate(ticket.id());
        assertEquals(2, lot.availableSpots(SpotSize.MEDIUM));
    }
    @Test void park_whenFull_throws() {
        lot.park(new Car("C1")); lot.park(new Car("C2"));
        assertThrows(RuntimeException.class, () -> lot.park(new Car("C3")));
    }
}
```

---

## PLUS Enhancements

### Diagram 1: SOLID Principles Relationship Diagram

```
                         ┌──────────────────┐
                         │   DIP (top)       │
                         │ Dependency Inver. │
                         │ Depend on abs-    │
                         │ tractions, not    │
                         │ concretions       │
                         └────────┬─────────┘
                                  ▲
                         ┌────────┴─────────┐
                         │   ISP (top)       │
                         │ Interface Seg.    │
                         │ Many client-      │
                         │ specific interfac.│
                         └────────┬─────────┘
                                  │
          ┌───────────────────────┼──────────────────────────┐
          │                       │                          │
          ▼                       ▼                          ▼
  ┌───────────────┐     ┌─────────────────┐      ┌─────────────────┐
  │  OCP (middle) │     │  LSP (middle)    │      │                 │
  │  Open-Closed  │     │  Liskov Subst.   │      │                 │
  │  Open for ext │     │ Subtypes must    │      │                 │
  │  Closed for   │     │ satisfy base     │      │                 │
  │  mod          │     │ contracts        │      │                 │
  └───────┬───────┘     └────────┬─────────┘      │                 │
          │                      │                │                 │
          │         ┌────────────┴────────────┐   │                 │
          ▼         ▼                           ▼   │                 │
  ┌─────────────────────────────────────────────────┐ │                 │
  │              SRP (BASE)                         │ │                 │
  │              Single Responsibility              │ │                 │
  │              One reason to change               │ │                 │
  │  All other principles depend on SRP:            │ │                 │
  │    If a class has ONE reason to change,         │ │                 │
  │    → It can be extended without modification    │ │                 │
  │      (OCP)                                      │ │                 │
  │    → Its contract is clear for LSP              │ │                 │
  │    → Its interface is focused for ISP           │ │                 │
  │    → Dependencies are injectable for DIP        │ │                 │
  └─────────────────────────────────────────────────┘ │                 │
                                                         │                 │
                                                         │                 │
                            All 5 principles form a COHESIVE SYSTEM:
                            Violating any one creates cascade violations.
```

### Diagram 2: Observer Pattern with Spring EventBus Sequence

```
  ┌──────────────┐   publishes    ┌──────────────────────────────────┐
  │ UserService  │────────────────▶│      ApplicationEventPublisher   │
  │              │  UserRegistered │         (Spring EventBus)        │
  │ register(u)──│──Event(userId)  └──────────┬───────────┬───────────┘
  └──────────────┘                            │           │
                                                │           │
                                 ┌─────────────┘  ┌────────┴───────────┐
                                 ▼                ▼                    ▼
                        ┌─────────────────┐ ┌──────────────┐ ┌────────────────┐
                        │WelcomeEmailList │ │AnalyticsList│ │AuditLogListener│
                        │                 │ │             │ │                │
                        │ @EventListener  │ │@EventListener│ │@EventListener │
                        │                 │ │             │ │                │
                        │ Sends welcome   │ │ Tracks user │ │ Writes to     │
                        │ email to user   │ │ registration│ │ security log  │
                        └─────────────────┘ │ event       │ └────────────────┘
                                            └──────────────┘

  KEY PROPERTIES:
  1. UserService KNOWS NOTHING about listeners
     → Decoupled: new listeners added with ZERO changes to UserService
  2. All 3 listeners fire in parallel (separate threads in Spring async mode)
  3. If one listener fails, others continue (isolated failure)
  4. Order of listener invocation is NOT guaranteed (don't rely on it)

  CODE FLOW:
  ════════════
  1. UserService.register(user)
     └─ userRepo.save(user)
     └─ publisher.publishEvent(new UserRegisteredEvent(user.id, user.email))
          └─ Spring scans @EventListener beans
               └─ dispatches to: WelcomeEmailListener, AnalyticsListener, AuditLogListener
                    └─ all receive SAME event object (independent copies)

  ADDING A NEW LISTENER:
  ════════════════════
  @Component
  class NewRelicListener {
      @EventListener  ◀── just add @EventListener annotation
      void on(UserRegisteredEvent e) { newRelic.trackEvent(e); }
  }
  // Zero changes to UserService. This is textbook OCP + Observer.
```

### Mechanism Deep-Dive: Liskov Substitution and the Role of @Override

**How Java Enforces LSP (and what it can't check at compile time):**

Liskov Substitution Principle states: "Objects of a supertype shall be replaceable with objects of a subtype without affecting program correctness." In Java, the compiler enforces some aspects of this but not the critical behavioral part:

```
  COMPILE-TIME ENFORCEMENT (what Java catches):
  ───────────────────────────────────────────
  1. Return type covariance (Java 5+):
     class Rectangle {
         Rectangle getBounds() { return this; }
     }
     class Square extends Rectangle {
         @Override
         Square getBounds() { return this; }  // OK: Square IS-A Rectangle
     }

  2. Exception covariance (Java 7+):
     interface Closable {
         void close() throws IOException;
     }
     class MyResource implements Closable {
         @Override
         void close() throws FileNotFoundException { }  // OK: FileNotFound IS-A IOException
     }

  NOT COMPILE-TIME ENFORCEMENT (runtime only):
  ─────────────────────────────────────────────
  class Rectangle {
      int width, height;
      void setWidth(int w)  { this.width = w; }
      void setHeight(int h) { this.height = h; }
  }

  class Square extends Rectangle {
      @Override
      void setWidth(int w)  { this.width = this.height = w; }  // COMPILES FINE
      @Override
      void setHeight(int h) { this.width = this.height = h; }  // but VIOLATES LSP!
  }

  void testArea(Rectangle r) {
      r.setWidth(5);
      r.setHeight(4);
      assert r.area() == 20;  // FAILURE if r is a Square (area = 16 or 25)
  }

  The compiler won't catch this. The violation is a SEMANTIC mismatch.
  The @Override annotation only confirms method signatures match, not contracts.
```

**Why @Override Exists (and how it catches LSP violations at compile time):**

The `@Override` annotation is a developer tool that leverages the compiler as a LSP enforcement mechanism. Without it, a method in a subclass with a slightly different signature creates a NEW method, not an override:

```
  WITHOUT @Override (silent LSP trap):
  ───────────────────────────────────
  class Rectangle {
      void setSize(int w, int h) { this.width=w; this.height=h; }
  }

  class Square extends Rectangle {
      void setSize(int side) {    // OOPS: different signature!
          super.setSize(side, side);  // Compiles but HIDES the parent method
      }
  }

  Rectangle r = new Square();
  r.setSize(5, 3);  // Calls Rectangle.setSize! Square.setSize never invoked!
  // This is NOT an LSP violation — it's a completely different method.
  // But the behavior is WRONG and the compiler says nothing.

  WITH @Override (compiler catches signature drift):
  ────────────────────────────────────────────────
  class Square extends Rectangle {
      @Override                      // COMPILE ERROR!
      void setSize(int side) {       // "method does not override from Rectangle"
          super.setSize(side, side);
      }
  }

  The @Override annotation turns signature mismatch from SILENT BUG into COMPILE ERROR.
  It also protects against refactoring accidents: if you rename a method in the
  parent, @Override on all children immediately flags which overrides need updating.
```

### Why-This-Not-That: Strategy vs Template Method

| DIMENSION | STRATEGY | TEMPLATE METHOD |
| --- | --- | --- |
| MECHANISM (how it varies) | COMPOSITION (HAS-A)<br>Algorithm is a separate object injected into context | INHERITANCE (IS-A)<br>Subclass overrides specific steps of a fixed algorithm skeleton |
| RUNTIME FLEXIBILITY | ✓ Swap at runtime (cart.setStrategy) | ✗ Fixed at compile time (new CSVImporter) |
| MULTIPLE STRATEGIES (can combine) | ✓ Inject multiple (discount+tax+shipping simultaneously) | ✗ One inheritance path (CSVImporter can't also be JSONImporter) |
| TESTABILITY | ✓ Test strategies in isolation | ✗ Requires subclass for each variant |
| USE WHEN | Algorithms interchangeable at runtime, or multiple concerns combined | Algorithm skeleton fixed, specific steps vary by subclass type |
| JAVA EXAMPLE | DiscountStrategy (PaymentStrategy) | DataImporter (JdbcTemplate) |
| OOP PRINCIPLE<br>ALIGNMENT | Favor composition over inheritance (GoF) | Inversion of Control (frameworks) |
| KEY LIMITATION | Must expose strategy interface to context | Single inheritance limits flexibility |

```
  DECISION TREE:
  ══════════════
  Does the algorithm have a FIXED skeleton with variable steps?
  YES → Template Method (framework hooks: beforeProcess, afterProcess)
  NO  → Does behavior need to change at runtime?
        YES → Strategy (swap discount from 10% to 20% per user segment)
        NO  → Does behavior vary by type?
              YES → Template Method (CSVImporter vs JSONImporter share read→parse→save)
              NO  → Neither — use simple conditional logic

  MODERN JAVA TREND: Favor Strategy (composition) over Template Method.
  Lambda expressions (Java 8+) make Strategy even lighter:
  cart.setDiscountStrategy(price -> price * 0.9);  // inline Strategy
```

### Breadth Comparison 1: Design Pattern Selection Table (10+ Scenarios)

| PROBLEM / SCENARIO | PATTERN(S) | WHY |
| --- | --- | --- |
| 1. One instance, global access (but prefer DI) | Singleton (enum form best) | Registry, config, logger or use Spring @Component |
| 2. Create objects based on type string/config | Factory Method / Abstract Factory | new X() → factory.create(X.class) decouples creator from product |
| 3. Object with 5+ optional fields, need immutability | Builder | Avoids 2^n telescoping constructors readable, chainable, validated |
| 4. Need different algorithm at runtime | Strategy | Swap SortStrategy at runtime (discount, sort, routing) |
| 5. Fixed algorithm, variable steps | Template Method | ImportData: read→parse→validate (JdbcTemplate, test hooks) |
| 6. State change → notify multiple dependents | Observer / Publish-Subscriber | One event → many listeners (Spring @EventListener) |
| 7. Add logging/caching<br>WITHOUT modifying class | Decorator | Stack decorators (compress→encrpyt<br>→log) around same interface |
| 8. Control access to object (don't load/hit real object) | Proxy | Lazy init, caching, auth checks (Spring @Transactional AOP) |
| 9. Incompatible interfaces, make them work together | Adapter | Legacy XML parser → new JSON API wrap interface B around A |
| 10. Complex subsystem, need simple entry point | Facade | OrderFacade.placeOrder() wraps<br>Inventory+Payment+Shipping+Notify |
| 11. Request passes through multiple handlers, unknown | Chain of Resp. | Auth middleware: rate→auth→authz<br>Spring Security filter chain |
| 12. Object with two states, behavior changes by state | State | Order: PENDING→PAID→SHIPPED→DONE each state = different behavior |
| 13. Capture & replay object state externally | Memento | Undo/redo (save object state, restore later) |
| 14. Traverse tree/hierarchy without exposing structure | Iterator / Visitor | Recurse tree, process each node (FileSystem traversal) |

### Breadth Comparison 2: SOLID Violation Symptom Table

| PRINCIPLE | WHAT VIOLATION LOOKS LIKE | FIX PATTERN |
| --- | --- | --- |
| SRP | Class changes for multiple reasons<br>UserService: save+email+audit+val<br>God class with 50 unrelated methods<br>Merge conflict in every PR | SPLIT into focused classes<br>UserRepo / EmailSvc /AuditLogger / PasswordValidator |
| OCP | Adding new type → modify switch/if-else in existing class<br>"Adding Germany required changing<br>TaxCalculator.java" | STRATEGY / POLYMORPHISM<br>TaxCalculator + TaxStrategy interface. New country = new class, no existing code |
| LSP | instanceof checks downstream<br>Square extends Rectangle → area() breaks for Square<br>Methods that "should work" fail mysteriously for subtypes | DESIGN BY CONTRACT /REFACTOR hierarchy<br>Square and Rectangle should<br>NOT have inheritance here.<br>Use composition or separate interfaces instead. |
| ISP | Interface with 20 methods, clients only use 2-3<br>"implements HugeInterface, but only override print()"<br>Clients forced to implement methods they don't need | SEGREGATE into small interfaces<br>Printable / Scannable /Faxable instead of<br>AllInOneInterface |
| DIP | High-level module depends on low-level concrete classes<br>"Changing MySQL requires rewriting<br>OrderService"<br>Constructor does `new` of concrete class (tight coupling) | DEPEND ON ABSTRACTIONS<br>OrderService depends on<br>PaymentGateway interface, not StripePaymentGateway.<br>Inject via constructor/Spring<br>@Autowired PaymentGateway |

```
  VIOLATION CASCADE DETECTION:
  ═══════════════════════════
  You identify ONE violation → ask: "What else broke?"

  SRP → OCP: If class has multiple reasons to change,
           adding new types requires modifying the class (violates OCP)

  LSP → OCP: If subtypes break contracts, you add instanceof checks
             to work around it (violates OCP)

  ISP → DIP: Fat interfaces force clients to depend on methods
             they don't use (violates DIP — depends on more than needed)

  OCP → DIP: Open for modification = violating DIP by adding dependencies
             on low-level details in high-level code

  THE CASCADE PATTERN: Every SOLID violation tends to create another.
  Fixing SRP often fixes OCP. Fixing DIP often fixes ISP.
```

[← Back to Semester 2 Guide](../00_CURRICULUM/SEMESTER_2_GUIDE.md)


---

## 🏢 Enterprise Lens — OOP and Design Problem Sets

| Area | What top-tier engineering looks like |
| ---- | ------------------------------------ |
| **Where it runs in production** | Onboarding exercises, code katas, interview practice |
| **Failure modes** | Copying solutions without attempting; passing tests with a poor design |
| **Testing and verification** | Run the stub tests; add a requirement change and count the lines it touches |

---

## Reality Check

**"Design problem sets are read-and-nod material"** — A design problem set only trains when you produce an ARTIFACT per problem — a numbers sheet, a component sketch, one seam explored deep — BEFORE reading any provided direction. Reading solutions first converts every problem into confirmation; producing first converts every solution into a diff against your own thinking, which is where the learning density is. The discipline: 25 minutes of production, then compare, then write the one-line delta lesson.

**"Problem sets should be completed in order, once"** — Design skills decay toward slogan-recall without SPACED revisits, and revisiting the same problem with changed constraints is the highest-value rep: the same feed design at 100x scale, the same chat with groups of 10k, the same rate limiter as a shared library instead of a service. Second passes cost a third of the time and teach the branch points — which is what the interview actually tests. One pass through twenty problems loses to three passes through seven.

**"The goal is a complete design per problem"** — Completeness is the wrong optimization target for practice: rotating FOCUS beats finishing everything — this session only estimation and bottleneck identification, that session only failure modes, another only the data model. Focused reps build the individual muscles; complete-design reps rehearse the assembly. Doing only assembly reps is why practiced candidates still hand-wave the arithmetic — they always spent their session time touring components instead.

**"Solo practice on problem sets prepares you for the interview"** — Solo practice cannot train INTERRUPTION RECOVERY — the defining texture of real design rounds: requirement changes mid-design, "actually assume 10x that," a hostile what-if against your queue choice. The cheapest simulation: after your solo design, roll one of three prepared perturbations (scale jump, region failure, new consistency requirement) and revise for ten minutes. Candidates who never practiced perturbation present beautifully and collapse at the first push.

**"More problems covered means better preparation"** — Coverage has sharply diminishing returns after the core archetypes (feed, chat, shortener/KV, rate limiter, queue-based pipeline, top-k/trending, storage service, scheduler) because new problems recombine the same decisions: fan-out, partitioning, consistency-per-flow, hot keys, idempotency. Depth on the recurring DECISIONS — able to argue each from numbers in any costume — beats breadth over problem titles. The problem set is the gymnasium, not the syllabus.
