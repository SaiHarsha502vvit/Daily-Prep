# 🎨 Design Patterns Interview Guide — When, Why, and How

[⬅ System Design Blueprint](06_System_Design_Blueprint.md) | [📚 Index](00_INDEX.md) | [Next: Problem Decomposition ➡](08_Problem_Decomposition_Framework.md)

---

**"Design patterns are not solutions to problems — they are solutions to RECURRING problems. Know WHEN to apply them, not just HOW."**

---

## Table of Contents
1. [The Pattern Selection Framework](#1-the-pattern-selection-framework)
2. [Creational Patterns (Object Creation)](#2-creational-patterns)
3. [Structural Patterns (Composition)](#3-structural-patterns)
4. [Behavioral Patterns (Communication)](#4-behavioral-patterns)
5. [Patterns in Real Systems](#5-patterns-in-real-systems)
6. [Anti-Patterns (What NOT to Do)](#6-anti-patterns)
7. [Interview Pattern Questions](#7-interview-pattern-questions)

---

## 1. The Pattern Selection Framework

### The 5W+H for Design Patterns

```
WHAT  → What problem does this pattern solve?
WHY   → Why is the naive approach insufficient?
WHEN  → When (under what conditions) should I use this?
WHERE → Where in the architecture does it apply?
WHO   → Who are the participants (classes/interfaces)?
HOW   → How do they interact? (UML-level understanding)
```

### Quick Decision Map

```
WHAT DO YOU NEED?                       → PATTERN

CREATE objects?
├── One instance only                   → Singleton
├── Family of related objects           → Abstract Factory
├── Complex object step by step         → Builder
├── Copy existing object                → Prototype
└── Decide at runtime which class       → Factory Method

COMPOSE structures?
├── Wrap object to add behavior         → Decorator
├── Simplify a complex subsystem        → Facade
├── Make incompatible interfaces work   → Adapter
├── Share objects to save memory        → Flyweight
├── Access a remote/expensive object    → Proxy
├── Treat single + group uniformly      → Composite
└── Decouple abstraction from impl      → Bridge

MANAGE behavior?
├── Notify many when one changes        → Observer
├── Switch algorithm at runtime         → Strategy
├── Define skeleton, let subclass fill  → Template Method
├── Undo/redo operations                → Command
├── Process request through a chain     → Chain of Responsibility
├── Traverse collection without expose  → Iterator
├── Encapsulate object state transitions→ State
└── Save and restore object state       → Memento
```

---



🔬 **Section Challenge — 1. The Pattern Selection Framework**

**Challenge 1 (Design):** Factory Method vs Abstract Factory — give a concrete example showing when each is appropriate.
<details><summary>Answer</summary>

Factory Method: `DocumentParser.createParser(fileType)` returns a `PdfParser` or `DocxParser`. One product family, one creator. Abstract Factory: `UIFactory` with `createButton()` + `createTextField()` + `createDialog()`. A `WindowsUIFactory` and `MacUIFactory` each create a FAMILY of related components. Use Abstract Factory when multiple interdependent products must be created together from the same family.
</details>

**Challenge 2 (Reasoning):** Singleton is often called an anti-pattern. Why?
<details><summary>Answer</summary>

1) Hidden global state — any code can access/modify the singleton, making dependencies implicit and testing hard. 2) Tight coupling — hard to swap implementation (no interface). 3) Concurrency: lazy init needs double-checked locking. 4) Violates SRP often. Better: use dependency injection — pass the single instance as a constructor argument. The DI container manages lifecycle. You get the same 'one instance' behavior with testability and explicit dependencies.
</details>


## 2. Creational Patterns

### Singleton — One Instance to Rule Them All

```java
// WHEN: Database connection pool, configuration, logger
// WHY:  Only one pool should exist; creating duplicates wastes resources
// HOW:  Private constructor + static accessor

// Thread-safe implementation (Bill Pugh Singleton)
public class DatabasePool {
    private DatabasePool() {
        // Initialize pool
    }

    // Inner class is loaded ONLY when getInstance() is called
    private static class Holder {
        private static final DatabasePool INSTANCE = new DatabasePool();
    }

    public static DatabasePool getInstance() {
        return Holder.INSTANCE;
    }
}

// INTERVIEW QUESTIONS:
// Q: "Why not just use a global variable?"
// A: "Global variable is created at startup even if unused.
//     Singleton with lazy initialization is created only on first access.
//     It also encapsulates the creation logic."

// Q: "Is Singleton an anti-pattern?"
// A: "It can be — it introduces global state, makes testing harder
//     (can't mock easily), and violates Single Responsibility.
//     Prefer dependency injection. But for infrastructure (connection pool,
//     config), Singleton is pragmatic."

// Q: "How to make Singleton thread-safe?"
// A: "Bill Pugh (inner class holder) — JVM guarantees class loading is
//     thread-safe. Better than double-checked locking."
```

### Factory Method — Let Subclasses Decide

```java
// WHEN: Object type depends on runtime conditions
// WHY:  Avoid hardcoding concrete class names throughout code

// The Pattern:
public interface Notification {
    void send(String message);
}

public class EmailNotification implements Notification {
    public void send(String message) { /* send email */ }
}
public class SMSNotification implements Notification {
    public void send(String message) { /* send SMS */ }
}
public class PushNotification implements Notification {
    public void send(String message) { /* send push */ }
}

// Factory Method
public class NotificationFactory {
    public static Notification create(String channel) {
        return switch (channel) {
            case "email" -> new EmailNotification();
            case "sms"   -> new SMSNotification();
            case "push"  -> new PushNotification();
            default -> throw new IllegalArgumentException("Unknown: " + channel);
        };
    }
}

// Usage: Adding new notification type?
// 1. Create new class
// 2. Add one line to factory
// 3. NO other code changes! (Open/Closed Principle)
```

### Builder — Complex Objects Step by Step

```java
// WHEN: Object has many optional parameters
// WHY:  Telescoping constructors (User(a), User(a,b), User(a,b,c)...) unreadable

public class HttpRequest {
    private final String url;
    private final String method;
    private final Map<String, String> headers;
    private final String body;
    private final int timeout;

    private HttpRequest(Builder builder) {
        this.url = builder.url;
        this.method = builder.method;
        this.headers = builder.headers;
        this.body = builder.body;
        this.timeout = builder.timeout;
    }

    public static class Builder {
        private final String url;                                  // required
        private String method = "GET";                             // default
        private Map<String, String> headers = new HashMap<>();     // default
        private String body = null;                                // optional
        private int timeout = 30000;                               // default

        public Builder(String url) { this.url = url; }

        public Builder method(String method)         { this.method = method; return this; }
        public Builder header(String key, String val){ this.headers.put(key, val); return this; }
        public Builder body(String body)             { this.body = body; return this; }
        public Builder timeout(int ms)               { this.timeout = ms; return this; }

        public HttpRequest build() { return new HttpRequest(this); }
    }
}

// Usage:
HttpRequest req = new HttpRequest.Builder("https://api.example.com/users")
    .method("POST")
    .header("Content-Type", "application/json")
    .body("{\"name\": \"Harsha\"}")
    .timeout(5000)
    .build();

// REAL-WORLD: StringBuilder, Stream API pipeline, Lombok @Builder
```

---



🔬 **Section Challenge — 2. Creational Patterns**

**Challenge 1 (Design):** Factory Method vs Abstract Factory — give a concrete example showing when each is appropriate.
<details><summary>Answer</summary>

Factory Method: `DocumentParser.createParser(fileType)` returns a `PdfParser` or `DocxParser`. One product family, one creator. Abstract Factory: `UIFactory` with `createButton()` + `createTextField()` + `createDialog()`. A `WindowsUIFactory` and `MacUIFactory` each create a FAMILY of related components. Use Abstract Factory when multiple interdependent products must be created together from the same family.
</details>

**Challenge 2 (Reasoning):** Singleton is often called an anti-pattern. Why?
<details><summary>Answer</summary>

1) Hidden global state — any code can access/modify the singleton, making dependencies implicit and testing hard. 2) Tight coupling — hard to swap implementation (no interface). 3) Concurrency: lazy init needs double-checked locking. 4) Violates SRP often. Better: use dependency injection — pass the single instance as a constructor argument. The DI container manages lifecycle. You get the same 'one instance' behavior with testability and explicit dependencies.
</details>


## 3. Structural Patterns

### Adapter — Make Incompatible Interfaces Work

```java
// WHEN: Integrating a third-party library with a different interface
// WHY:  You can't change the library code, but your code expects Interface X

// Your code expects this:
public interface PaymentProcessor {
    boolean charge(String userId, double amount);
}

// Third-party library has this:
public class StripeAPI {
    public StripeResult executePayment(StripeCustomer customer, int amountCents) {
        // ... Stripe-specific logic
        return new StripeResult(true);
    }
}

// Adapter bridges the gap:
public class StripeAdapter implements PaymentProcessor {
    private final StripeAPI stripe;

    public StripeAdapter(StripeAPI stripe) { this.stripe = stripe; }

    @Override
    public boolean charge(String userId, double amount) {
        StripeCustomer customer = lookupCustomer(userId);
        int cents = (int) (amount * 100);
        StripeResult result = stripe.executePayment(customer, cents);
        return result.isSuccess();
    }
}

// Now your code uses PaymentProcessor everywhere.
// Switch from Stripe to PayPal? Write a new PayPalAdapter. Done.
```

### Decorator — Add Behavior Without Changing Class

```java
// WHEN: Need to add features dynamically without inheritance explosion
// WHY:  Inheritance: CoffeeWithMilk, CoffeeWithMilkAndSugar... combinatorial explosion!

public interface DataSource {
    void writeData(String data);
    String readData();
}

public class FileDataSource implements DataSource {
    private String filename;
    public FileDataSource(String fn) { this.filename = fn; }
    public void writeData(String data) { /* write to file */ }
    public String readData() { /* read from file */ return "data"; }
}

// Decorator 1: Add encryption
public class EncryptionDecorator implements DataSource {
    private DataSource wrapped;
    public EncryptionDecorator(DataSource source) { this.wrapped = source; }

    public void writeData(String data) { wrapped.writeData(encrypt(data)); }
    public String readData() { return decrypt(wrapped.readData()); }

    private String encrypt(String s) { /* encryption logic */ return s; }
    private String decrypt(String s) { /* decryption logic */ return s; }
}

// Decorator 2: Add compression
public class CompressionDecorator implements DataSource {
    private DataSource wrapped;
    public CompressionDecorator(DataSource source) { this.wrapped = source; }

    public void writeData(String data) { wrapped.writeData(compress(data)); }
    public String readData() { return decompress(wrapped.readData()); }

    private String compress(String s) { return s; }
    private String decompress(String s) { return s; }
}

// Stack decorators dynamically:
DataSource source = new FileDataSource("data.txt");
source = new EncryptionDecorator(source);        // add encryption
source = new CompressionDecorator(source);        // add compression
source.writeData("secret");  // compressed → encrypted → written to file

// REAL-WORLD: Java I/O (BufferedReader(FileReader)), Spring Security filters
```

### Facade — Simplify a Complex Subsystem

```java
// WHEN: Complex library with 20 classes but client needs 3 operations
// WHY:  Shield clients from subsystem complexity

// Complex video conversion subsystem
class VideoFile { /* ... */ }
class AudioMixer { /* ... */ }
class CodecFactory { /* ... */ }
class BitrateReader { /* ... */ }

// Simple Facade
public class VideoConverter {
    public File convert(String filename, String format) {
        VideoFile file = new VideoFile(filename);
        var codec = CodecFactory.extract(file);
        var audioMix = new AudioMixer().fix(codec.getAudio());
        var result = BitrateReader.convert(codec, audioMix, format);
        return result.save();
    }
}

// Client code is one line:
new VideoConverter().convert("video.mp4", "avi");

// REAL-WORLD: JDBC (facade over database protocols),
// SLF4J (facade over logging frameworks), Spring Boot auto-configuration
```

### Proxy — Control Access to an Object

```java
// TYPES AND WHEN:
// 1. Protection Proxy: Access control (check permissions before allowing)
// 2. Virtual Proxy:    Lazy loading (don't create expensive object until needed)
// 3. Caching Proxy:    Return cached results for repeated requests

// Virtual Proxy Example (lazy-loading heavy image):
public interface Image {
    void display();
}

public class RealImage implements Image {
    private String filename;
    public RealImage(String fn) {
        this.filename = fn;
        loadFromDisk();  // EXPENSIVE: 200ms
    }
    private void loadFromDisk() { System.out.println("Loading " + filename); }
    public void display() { System.out.println("Displaying " + filename); }
}

public class ProxyImage implements Image {
    private String filename;
    private RealImage realImage;  // null until needed

    public ProxyImage(String fn) { this.filename = fn; }

    public void display() {
        if (realImage == null) {
            realImage = new RealImage(filename);  // Load only when displayed
        }
        realImage.display();
    }
}

// REAL-WORLD: Hibernate lazy loading, Spring AOP proxies, java.lang.reflect.Proxy
```

---



🔬 **Section Challenge — 3. Structural Patterns**

**Challenge 1 (Design):** Factory Method vs Abstract Factory — give a concrete example showing when each is appropriate.
<details><summary>Answer</summary>

Factory Method: `DocumentParser.createParser(fileType)` returns a `PdfParser` or `DocxParser`. One product family, one creator. Abstract Factory: `UIFactory` with `createButton()` + `createTextField()` + `createDialog()`. A `WindowsUIFactory` and `MacUIFactory` each create a FAMILY of related components. Use Abstract Factory when multiple interdependent products must be created together from the same family.
</details>

**Challenge 2 (Reasoning):** Singleton is often called an anti-pattern. Why?
<details><summary>Answer</summary>

1) Hidden global state — any code can access/modify the singleton, making dependencies implicit and testing hard. 2) Tight coupling — hard to swap implementation (no interface). 3) Concurrency: lazy init needs double-checked locking. 4) Violates SRP often. Better: use dependency injection — pass the single instance as a constructor argument. The DI container manages lifecycle. You get the same 'one instance' behavior with testability and explicit dependencies.
</details>


## 4. Behavioral Patterns

### Strategy — Switch Algorithms at Runtime

```java
// WHEN: Multiple algorithms for same task, chosen at runtime
// WHY:  Avoid giant if-else chains

public interface SortStrategy {
    void sort(int[] array);
}

public class QuickSort implements SortStrategy {
    public void sort(int[] arr) { /* quicksort */ }
}
public class MergeSort implements SortStrategy {
    public void sort(int[] arr) { /* mergesort */ }
}
public class InsertionSort implements SortStrategy {
    public void sort(int[] arr) { /* insertion sort */ }
}

public class Sorter {
    private SortStrategy strategy;

    public Sorter(SortStrategy strategy) { this.strategy = strategy; }

    public void setStrategy(SortStrategy strategy) { this.strategy = strategy; }

    public void sort(int[] data) {
        strategy.sort(data);
    }
}

// Usage: Choose based on data characteristics
Sorter sorter = new Sorter(new QuickSort());
if (data.length < 50) sorter.setStrategy(new InsertionSort());
sorter.sort(data);

// REAL-WORLD: Comparator in Collections.sort(), Authentication strategies,
// Payment processing (credit card vs PayPal vs crypto)
```

### Observer — Event-Driven Communication

```java
// WHEN: One object's state change must notify many others
// WHY:  Tight coupling (calling each dependent directly) doesn't scale

public interface EventListener {
    void update(String eventType, String data);
}

public class EventManager {
    private Map<String, List<EventListener>> listeners = new HashMap<>();

    public void subscribe(String event, EventListener listener) {
        listeners.computeIfAbsent(event, k -> new ArrayList<>()).add(listener);
    }

    public void unsubscribe(String event, EventListener listener) {
        listeners.getOrDefault(event, Collections.emptyList()).remove(listener);
    }

    public void notify(String event, String data) {
        for (EventListener l : listeners.getOrDefault(event, Collections.emptyList())) {
            l.update(event, data);
        }
    }
}

// Concrete observers
public class EmailAlert implements EventListener {
    public void update(String event, String data) {
        System.out.println("Email: " + event + " - " + data);
    }
}
public class SlackAlert implements EventListener {
    public void update(String event, String data) {
        System.out.println("Slack: " + event + " - " + data);
    }
}

// Usage:
EventManager events = new EventManager();
events.subscribe("order.placed", new EmailAlert());
events.subscribe("order.placed", new SlackAlert());
events.notify("order.placed", "Order #1234 by Harsha");
// Both get notified!

// REAL-WORLD: Java Swing listeners, Spring ApplicationEvent,
// React state management, DOM event handling
```

### Template Method — Define Skeleton, Subclass Fills Details

```java
// WHEN: Algorithm structure is fixed but steps vary
// WHY:  Avoid duplicating the overall flow in each variant

public abstract class DataMiner {
    // Template method — defines the skeleton
    public final void mine(String path) {
        openFile(path);
        String raw = extractData();
        String parsed = parseData(raw);
        analyzeData(parsed);
        generateReport();
        closeFile();
    }

    // Steps that VARY — subclasses implement
    protected abstract void openFile(String path);
    protected abstract String extractData();
    protected abstract String parseData(String raw);

    // Steps that are COMMON — defined here
    private void analyzeData(String data) { /* common analysis */ }
    private void generateReport() { /* common report */ }
    private void closeFile() { /* common cleanup */ }
}

public class CSVDataMiner extends DataMiner {
    protected void openFile(String path) { /* open CSV */ }
    protected String extractData() { return /* CSV rows */  ""; }
    protected String parseData(String raw) { return /* split commas */ ""; }
}

public class PDFDataMiner extends DataMiner {
    protected void openFile(String path) { /* open PDF */ }
    protected String extractData() { return /* OCR text */ ""; }
    protected String parseData(String raw) { return /* parse structure */ ""; }
}

// REAL-WORLD: HttpServlet (doGet/doPost), JUnit test lifecycle,
// Spring JdbcTemplate
```

### Command — Encapsulate Requests as Objects

```java
// WHEN: Need undo/redo, queue operations, or log operations
// WHY:  The invoker shouldn't know the details of the operation

public interface Command {
    void execute();
    void undo();
}

public class AddTextCommand implements Command {
    private StringBuilder document;
    private String text;

    public AddTextCommand(StringBuilder doc, String text) {
        this.document = doc;
        this.text = text;
    }

    public void execute() { document.append(text); }
    public void undo() { document.delete(document.length() - text.length(), document.length()); }
}

// Command history for undo/redo
public class Editor {
    private StringBuilder document = new StringBuilder();
    private Deque<Command> history = new ArrayDeque<>();

    public void executeCommand(Command cmd) {
        cmd.execute();
        history.push(cmd);
    }

    public void undo() {
        if (!history.isEmpty()) {
            history.pop().undo();
        }
    }
}

// REAL-WORLD: Undo in text editors, transaction rollback,
// macro recording, task scheduling
```

### Chain of Responsibility — Pass Request Along a Chain

```java
// WHEN: Multiple handlers might process a request, decided at runtime
// WHY:  Decouple sender from receivers

public abstract class Handler {
    private Handler next;

    public Handler setNext(Handler h) { this.next = h; return h; }

    public void handle(Request request) {
        if (canHandle(request)) {
            process(request);
        } else if (next != null) {
            next.handle(request);
        } else {
            System.out.println("No handler for: " + request);
        }
    }

    protected abstract boolean canHandle(Request request);
    protected abstract void process(Request request);
}

// Example: Support ticket routing
public class L1Support extends Handler {
    protected boolean canHandle(Request r) { return r.severity() < 3; }
    protected void process(Request r) { System.out.println("L1 handles: " + r); }
}
public class L2Support extends Handler {
    protected boolean canHandle(Request r) { return r.severity() < 7; }
    protected void process(Request r) { System.out.println("L2 handles: " + r); }
}
public class L3Support extends Handler {
    protected boolean canHandle(Request r) { return true; }
    protected void process(Request r) { System.out.println("L3 handles: " + r); }
}

// Wire the chain:
Handler chain = new L1Support();
chain.setNext(new L2Support()).setNext(new L3Support());
chain.handle(new Request(5));  // → L2 handles it

// REAL-WORLD: Servlet filters, Spring Security filter chain,
// Exception handling (try → catch → catch → finally)
```

---



🔬 **Section Challenge — 4. Behavioral Patterns**

**Challenge 1 (Design):** Factory Method vs Abstract Factory — give a concrete example showing when each is appropriate.
<details><summary>Answer</summary>

Factory Method: `DocumentParser.createParser(fileType)` returns a `PdfParser` or `DocxParser`. One product family, one creator. Abstract Factory: `UIFactory` with `createButton()` + `createTextField()` + `createDialog()`. A `WindowsUIFactory` and `MacUIFactory` each create a FAMILY of related components. Use Abstract Factory when multiple interdependent products must be created together from the same family.
</details>

**Challenge 2 (Reasoning):** Singleton is often called an anti-pattern. Why?
<details><summary>Answer</summary>

1) Hidden global state — any code can access/modify the singleton, making dependencies implicit and testing hard. 2) Tight coupling — hard to swap implementation (no interface). 3) Concurrency: lazy init needs double-checked locking. 4) Violates SRP often. Better: use dependency injection — pass the single instance as a constructor argument. The DI container manages lifecycle. You get the same 'one instance' behavior with testability and explicit dependencies.
</details>


## 5. Patterns in Real Systems

### Where Do You Actually See These?

```
┌──────────────────┬──────────────────────────────────────────────────────┐
│ System            │ Patterns Used                                        │
├──────────────────┼──────────────────────────────────────────────────────┤
│ Spring Framework  │ Factory (BeanFactory), Singleton (default scope),   │
│                   │ Proxy (AOP), Template Method (JdbcTemplate),        │
│                   │ Observer (ApplicationEvent), Strategy (interface)    │
├──────────────────┼──────────────────────────────────────────────────────┤
│ Java I/O          │ Decorator (BufferedReader wraps FileReader),        │
│                   │ Adapter (InputStreamReader adapts InputStream)       │
├──────────────────┼──────────────────────────────────────────────────────┤
│ Java Collections  │ Iterator (for-each loop), Strategy (Comparator),   │
│                   │ Factory (Collections.unmodifiableList)              │
├──────────────────┼──────────────────────────────────────────────────────┤
│ Web Frameworks    │ MVC (Model-View-Controller), Front Controller,     │
│                   │ Chain of Responsibility (middleware/filters)        │
├──────────────────┼──────────────────────────────────────────────────────┤
│ Microservices     │ API Gateway (Facade), Circuit Breaker (State),     │
│                   │ Saga (choreography/orchestration), CQRS            │
├──────────────────┼──────────────────────────────────────────────────────┤
│ React/Frontend    │ Observer (state management), Strategy (render props)│
│                   │ Composite (component tree), HOC (Decorator)        │
└──────────────────┴──────────────────────────────────────────────────────┘
```

### SOLID Principles — The Foundation of Good Design

```
S — Single Responsibility: "A class should have only one reason to change."
    → UserService handles user logic. EmailService handles emails.
    → NOT: UserService sends emails AND manages users.

O — Open/Closed: "Open for extension, closed for modification."
    → Add new NotificationType by creating new class (extension).
    → Don't modify existing NotificationService code (closed).
    → How: Strategy pattern, Factory pattern.

L — Liskov Substitution: "Subtypes must be substitutable for base types."
    → If function takes Shape, it must work with Circle AND Rectangle.
    → Violation: Square extends Rectangle but setWidth breaks setHeight.

I — Interface Segregation: "Don't force clients to depend on unused methods."
    → Split fat interface into focused ones.
    → Printer, Scanner, Fax → NOT: MultiFunctionDevice with all methods.

D — Dependency Inversion: "Depend on abstractions, not concretions."
    → OrderService depends on PaymentProcessor interface,
       NOT on StripePayment directly. Inject the implementation.
    → How: Dependency Injection (Spring, Guice).

INTERVIEW: "These principles are guidelines, not laws. The goal is
maintainable code. Over-engineering violates YAGNI (You Ain't Gonna Need It).
I apply them when the complexity justifies it."
```

---




## 6. Anti-Patterns (What NOT to Do)

```
GOD CLASS:
  ❌ One class with 5000 lines handling everything
  ✅ Split by responsibility (Single Responsibility Principle)

SPAGHETTI CODE:
  ❌ Deeply nested if-else chains, goto-like jumps
  ✅ Strategy pattern, early returns, guard clauses

GOLDEN HAMMER:
  ❌ "We use microservices for EVERYTHING" (including a 2-person team)
  ✅ Match architecture to team size and complexity

PREMATURE OPTIMIZATION:
  ❌ Building a distributed cache before proving you need one
  ✅ Measure first, optimize the actual bottleneck

COPY-PASTE PROGRAMMING:
  ❌ Same 20 lines in 15 places
  ✅ Extract method/class, DRY (Don't Repeat Yourself)

LAVA FLOW:
  ❌ Dead code kept "just in case" from 3 years ago
  ✅ Delete it — version control remembers everything

MAGIC NUMBERS:
  ❌ if (status == 3) ...
  ✅ if (status == OrderStatus.SHIPPED) ...
```

---



🔬 **Section Challenge — 6. Anti-Patterns (What NOT to Do)**

**Challenge 1 (Design):** Factory Method vs Abstract Factory — give a concrete example showing when each is appropriate.
<details><summary>Answer</summary>

Factory Method: `DocumentParser.createParser(fileType)` returns a `PdfParser` or `DocxParser`. One product family, one creator. Abstract Factory: `UIFactory` with `createButton()` + `createTextField()` + `createDialog()`. A `WindowsUIFactory` and `MacUIFactory` each create a FAMILY of related components. Use Abstract Factory when multiple interdependent products must be created together from the same family.
</details>

**Challenge 2 (Reasoning):** Singleton is often called an anti-pattern. Why?
<details><summary>Answer</summary>

1) Hidden global state — any code can access/modify the singleton, making dependencies implicit and testing hard. 2) Tight coupling — hard to swap implementation (no interface). 3) Concurrency: lazy init needs double-checked locking. 4) Violates SRP often. Better: use dependency injection — pass the single instance as a constructor argument. The DI container manages lifecycle. You get the same 'one instance' behavior with testability and explicit dependencies.
</details>


## 7. Interview Pattern Questions

### "Design a Parking Lot System"

```java
// Patterns used: Strategy, Factory, Observer

// Strategy: Different pricing for different vehicle types
public interface PricingStrategy {
    double calculate(int hours);
}
public class StandardPricing implements PricingStrategy {
    public double calculate(int hours) { return hours * 2.0; }
}
public class PremiumPricing implements PricingStrategy {
    public double calculate(int hours) { return hours * 5.0; }
}

// Factory: Create correct spot type
public class SpotFactory {
    public static ParkingSpot create(VehicleType type) {
        return switch (type) {
            case MOTORCYCLE -> new MotorcycleSpot();
            case CAR        -> new CarSpot();
            case TRUCK      -> new TruckSpot();
        };
    }
}

// Observer: Notify display board when spots change
public class ParkingLot {
    private EventManager events = new EventManager();
    // Subscribe display boards, mobile apps, etc.
    // When vehicle parks/leaves → notify all observers
}
```

### "Design a Notification System"

```
Patterns: Strategy + Factory + Observer + Template Method

Strategy:    Choose delivery channel (email, SMS, push)
Factory:     Create correct notification sender based on channel
Observer:    Subscribe users to event types
Template:    Common flow (validate → format → send → log) with
             varying format and send steps per channel

This combination is how most real notification systems are built.
Spring's ApplicationEventPublisher is literally the Observer pattern.
```

---

## Cross-References

| Topic | Deep Dive |
|-------|-----------|
| OOP Principles | [06_OOP_Design/01_OOPS_Principles](../06_OOP_Design/01_OOPS_Principles.md) |
| Design Patterns Deep Dive | [06_OOP_Design/02_Design_Patterns](../06_OOP_Design/02_Design_Patterns.md) |
| System Design | [06_System_Design_Blueprint](06_System_Design_Blueprint.md) |
| Functional Programming | [07_Modern_Java/01_Functional_Programming](../07_Modern_Java/01_Functional_Programming.md) |
| Pattern Recognition (DSA) | [03_DSA_Pattern_Recognition_Engine](03_DSA_Pattern_Recognition_Engine.md) |

---

[⬅ System Design Blueprint](06_System_Design_Blueprint.md) | [📚 Index](00_INDEX.md) | [Next: Problem Decomposition ➡](08_Problem_Decomposition_Framework.md)

