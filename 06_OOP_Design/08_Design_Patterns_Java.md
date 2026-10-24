**Navigation**: [< Previous](07_LLD_Solved_Problems.md) | [Back to Index](../00_MASTER_INDEX.md)

# Design Patterns in Java — Gang of Four & Beyond

## Why Learn Design Patterns?

Design patterns are PROVEN SOLUTIONS to RECURRING PROBLEMS.

Without patterns: "I'll figure out a way to do this..."
With patterns: "This is a Strategy problem — I know exactly
how to structure this."

Interview Reality: "Can you give me an example of [Pattern]?"
→ Expected for mid-level and above

---

🔬 **Section Challenge — Why Learn Design Patterns?**

**Challenge 1 (Reasoning):** A junior developer says "I don't need patterns, I can just write code that works." Using Who/When/What: **Who** benefits from patterns? **When** does the benefit become apparent? **What** is the cost of NOT using patterns at scale?

<details><summary>Answer</summary>

**Who?** The entire team, not just the author. Patterns create a shared vocabulary — saying "this is a Strategy" instantly communicates architecture to any developer who knows patterns. **When?** Benefits compound over time: (1) during code review ("is this a Decorator or Proxy?"), (2) during onboarding (new devs recognize patterns), (3) during maintenance (6 months later, you recognize your own structure). **What's the cost without them?** Ad-hoc solutions become "tribal knowledge." Each developer invents their own approach to the same problems. The codebase becomes a museum of different styles. Bug fixes in one approach don't transfer to others. Patterns are the difference between a codebase that scales with team size and one that collapses under it.

</details>

## Pattern Categories Overview

### Historical Evolution

Design patterns as a formal discipline began with **Christopher Alexander's "A Pattern Language" (1977)**, a landmark book on urban architecture and building design that introduced the concept that recurring design problems have recurring solutions expressible as named patterns with context, forces, and resolution. **Kent Beck and Ward Cunningham applied Alexander's pattern language to software in 1987** (C++ Report), writing the first OOP-specific patterns — this is the origin of the pattern movement in computing. **The Gang of Four (Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides) published "Design Patterns: Elements of Reusable Object-Oriented Software" in 1994**, cataloguing 23 patterns across creational, structural, and behavioral categories; this book became the definitive reference, and its patterns are now universal vocabulary. **POSA (Pattern-Oriented Software Architecture, Buschmann et al., 1996)** extended the catalog with concurrent and network patterns (half-object-plus-protocol, reactor,proactor) — the foundation for high-performance server design used in Tomcat, Netty, and Node.js. **Joshua Bloch's "Effective Java" (2008, Item 3)** popularized the enum-based Singleton as superior to classic `getInstance()` double-checked locking — enum Singletons are immune to reflection and serialization attacks, making them the only truly safe form of Singleton in Java. Today, patterns continue to evolve: the **Microservices patterns (2014+, Sam Newman "Building Microservices")** applied classical patterns (sidecar, strangler fig, circuit breaker) at the service boundary; and **AI-assisted code generation (2023+)** is beginning to generate pattern-compliant code automatically from natural language descriptions.

CREATIONAL (5) STRUCTURAL (7) BEHAVIORAL (11)
How objects are How objects are How objects
CREATED COMPOSED COMMUNICATE
───────────── ───────────── ─────────────
Singleton ★ Adapter ★ Strategy ★
Factory Method ★ Decorator ★ Observer ★
Abstract Factory Facade ★ Template Method ★
Builder ★ Proxy ★ Iterator
Prototype Composite Command
Bridge Chain of Resp ★
Flyweight State
Mediator
Memento
Visitor
Interpreter

★ = Most commonly asked in interviews / used in practice

---

🔬 **Section Challenge — Pattern Categories Overview**

**Challenge 1 (Reasoning):** Classify these real-world scenarios into Creational, Structural, or Behavioral: (A) A logging layer that wraps every service call, (B) A factory that creates different database connections based on config, (C) A notification system where placing an order triggers email + SMS + inventory updates.

<details><summary>Answer</summary>

**(A) Structural — Decorator.** The logging layer wraps an existing service without changing it, adding cross-cutting behavior. **(B) Creational — Factory Method.** Object creation is delegated to a factory based on runtime config. **(C) Behavioral — Observer.** Multiple subscribers react to a single event. The mental model: Creational = HOW objects are born. Structural = HOW objects are assembled into larger structures. Behavioral = HOW objects talk to each other and divide responsibilities.

</details>

## Creational Patterns

### 1. Singleton — One Instance Only

PROBLEM: Need exactly ONE instance of a class globally.
ANALOGY: There's only ONE President of a country at a time.
USE: Database connection pool, Logger, Configuration, Cache

```java
// Thread-safe Singleton using enum (Joshua Bloch's recommended approach)
public enum DatabasePool {
    INSTANCE;

    private final HikariDataSource dataSource;

    DatabasePool() {
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl("jdbc:postgresql://localhost/mydb");
        config.setMaximumPoolSize(10);
        this.dataSource = new HikariDataSource(config);
    }

    public Connection getConnection() throws SQLException {
        return dataSource.getConnection();
    }
}

// Usage
Connection conn = DatabasePool.INSTANCE.getConnection();
```

```java
// Double-checked locking (classic approach)
public class Logger {
    private static volatile Logger instance;

    private Logger() { } // private constructor!

    public static Logger getInstance() {
        if (instance == null) {                    // First check (no lock)
            synchronized (Logger.class) {
                if (instance == null) {            // Second check (with lock)
                    instance = new Logger();
                }
            }
        }
        return instance;
    }
}
```

```
⚠️ WARNING: Singleton is often OVERUSED.
   Consider Dependency Injection instead (@Autowired in Spring).
   Spring beans are singletons by default within the container.
```

### 2. Factory Method — Let Subclasses Decide

```
╔══════════════════════════════════════════════════════════════════════╗
║  PROBLEM: Need to create objects without specifying exact class.     ║
║  ANALOGY: You order "a pizza" — the kitchen decides which type.      ║
║  USE: When a class can't anticipate which objects to create.         ║
╚══════════════════════════════════════════════════════════════════════╝
```

```java
// --- Product interface ---
public interface Notification {
    void send(String message);
}

// --- Concrete products ---
public class EmailNotification implements Notification {
    @Override
    public void send(String message) {
        System.out.println("Email: " + message);
    }
}

public class SMSNotification implements Notification {
    @Override
    public void send(String message) {
        System.out.println("SMS: " + message);
    }
}

public class PushNotification implements Notification {
    @Override
    public void send(String message) {
        System.out.println("Push: " + message);
    }
}

// --- Factory ---
public class NotificationFactory {
    public static Notification create(String channel) {
        return switch (channel.toLowerCase()) {
            case "email" -> new EmailNotification();
            case "sms"   -> new SMSNotification();
            case "push"  -> new PushNotification();
            default -> throw new IllegalArgumentException(
                "Unknown channel: " + channel);
        };
    }
}

// Usage — client doesn't know concrete classes
Notification n = NotificationFactory.create("email");
n.send("Your order has shipped!");
```

### 3. Builder — Complex Object Construction

```
╔══════════════════════════════════════════════════════════════════════╗
║  PROBLEM: Constructor with too many parameters (telescoping).        ║
║  ANALOGY: Ordering a customized burger — pick each component.        ║
║  USE: Objects with many optional fields (HttpRequest, User, etc.)    ║
╚══════════════════════════════════════════════════════════════════════╝
```

```java
public class User {
    private final String firstName;     // required
    private final String lastName;      // required
    private final String email;         // required
    private final String phone;         // optional
    private final String address;       // optional
    private final int age;              // optional

    private User(Builder builder) {
        this.firstName = builder.firstName;
        this.lastName = builder.lastName;
        this.email = builder.email;
        this.phone = builder.phone;
        this.address = builder.address;
        this.age = builder.age;
    }

    public static class Builder {
        // Required
        private final String firstName;
        private final String lastName;
        private final String email;
        // Optional — defaults
        private String phone = "";
        private String address = "";
        private int age = 0;

        public Builder(String firstName, String lastName, String email) {
            this.firstName = firstName;
            this.lastName = lastName;
            this.email = email;
        }

        public Builder phone(String phone) {
            this.phone = phone;
            return this;  // enables chaining
        }

        public Builder address(String address) {
            this.address = address;
            return this;
        }

        public Builder age(int age) {
            this.age = age;
            return this;
        }

        public User build() {
            // Validate here if needed
            return new User(this);
        }
    }
}

// Usage — clean, readable, flexible
User user = new User.Builder("Sai", "Harsha", "sai@example.com")
    .phone("1234567890")
    .age(25)
    .build();

// TIP: Use @Builder from Lombok to generate this automatically
// @Builder
// public class User { ... }
```

---

🔬 **Section Challenge — Creational Patterns**

**Challenge 1 (Debug — Who/When/What):** In the double-checked locking Singleton, why is `volatile` on the `instance` field mandatory? What specific bug occurs without it, and who observes it?

<details><summary>Answer</summary>

**Who?** Thread B calling `getInstance()`. **When?** After Thread A creates the instance but the constructor hasn't finished executing (instruction reordering). **What already exists?** Without `volatile`, the JVM may reorder: (1) allocate memory, (2) assign reference to `instance`, (3) run constructor. Thread B sees step 2 (`instance != null`) and returns a PARTIALLY CONSTRUCTED object. `volatile` enforces a happens-before guarantee: all writes in the constructor are visible before the reference is published. Without it, Thread B gets a Logger with null internal fields — a subtle, non-reproducible bug.

</details>

**Challenge 2 (Design):** Builder pattern: why is the `User` constructor `private` and why does `build()` return a new `User` instead of the Builder itself?

<details><summary>Answer</summary>

Private constructor prevents direct instantiation — forces all creation through the Builder, guaranteeing validation runs. `build()` returns `User` (not `Builder`) because the Builder is a temporary construction scaffold — once the object is built, the Builder's job is done. This also makes `User` immutable: all fields are `final`, set once during construction, never modified after. The Builder is mutable (fluent setters); the product is immutable. This separation is the core insight.

</details>

## Structural Patterns

### 4. Adapter — Make Incompatible Interfaces Work Together

```
╔══════════════════════════════════════════════════════════════════════╗
║  PROBLEM: You have an existing interface but need a different one.   ║
║  ANALOGY: A power adapter that converts US plug → EU socket.         ║
║  USE: Integrating third-party libraries, legacy system wrappers.     ║
╚══════════════════════════════════════════════════════════════════════╝
```

```java
// --- Target interface (what our code expects) ---
public interface PaymentProcessor {
    boolean charge(String customerId, double amount);
}

// --- Adaptee (third-party library with incompatible interface) ---
public class StripeAPI {
    public StripeCharge createCharge(StripeChargeRequest request) {
        // third-party Stripe SDK method
        return new StripeCharge(/* ... */);
    }
}

// --- Adapter ---
public class StripeAdapter implements PaymentProcessor {
    private final StripeAPI stripeAPI;

    public StripeAdapter(StripeAPI stripeAPI) {
        this.stripeAPI = stripeAPI;
    }

    @Override
    public boolean charge(String customerId, double amount) {
        StripeChargeRequest request = new StripeChargeRequest();
        request.setCustomer(customerId);
        request.setAmount((long)(amount * 100)); // Stripe uses cents
        request.setCurrency("usd");

        StripeCharge charge = stripeAPI.createCharge(request);
        return charge.isPaid();
    }
}

// Usage — our code only knows PaymentProcessor
PaymentProcessor processor = new StripeAdapter(new StripeAPI());
processor.charge("cust_123", 49.99);

// Tomorrow: switch to PayPal? Write PayPalAdapter implements PaymentProcessor
```

### 5. Decorator — Add Behavior Dynamically

```
╔══════════════════════════════════════════════════════════════════════╗
║  PROBLEM: Need to add features to objects without modifying them.    ║
║  ANALOGY: A coffee with milk, sugar, whipped cream — each is a       ║
║           decorator wrapping the base coffee.                        ║
║  USE: Java I/O streams, logging, caching, validation layers.         ║
╚══════════════════════════════════════════════════════════════════════╝
```

```java
// --- Component interface ---
public interface DataSource {
    String read();
    void write(String data);
}

// --- Base component ---
public class FileDataSource implements DataSource {
    private final String filename;

    public FileDataSource(String filename) { this.filename = filename; }

    @Override
    public String read() { return readFromFile(filename); }

    @Override
    public void write(String data) { writeToFile(filename, data); }
}

// --- Decorator base ---
public abstract class DataSourceDecorator implements DataSource {
    protected DataSource wrappee;

    public DataSourceDecorator(DataSource source) { this.wrappee = source; }

    @Override
    public String read() { return wrappee.read(); }

    @Override
    public void write(String data) { wrappee.write(data); }
}

// --- Concrete decorators ---
public class EncryptionDecorator extends DataSourceDecorator {
    public EncryptionDecorator(DataSource source) { super(source); }

    @Override
    public void write(String data) {
        super.write(encrypt(data));       // encrypt before writing
    }

    @Override
    public String read() {
        return decrypt(super.read());     // decrypt after reading
    }
}

public class CompressionDecorator extends DataSourceDecorator {
    public CompressionDecorator(DataSource source) { super(source); }

    @Override
    public void write(String data) {
        super.write(compress(data));
    }

    @Override
    public String read() {
        return decompress(super.read());
    }
}

// Usage — stack decorators like layers
DataSource source = new FileDataSource("data.txt");
source = new EncryptionDecorator(source);           // add encryption
source = new CompressionDecorator(source);          // add compression

source.write("sensitive data");  // compressed → encrypted → file

// Java I/O is the classic decorator example:
// new BufferedReader(new InputStreamReader(new FileInputStream("file.txt")));
```

### 6. Facade — Simplify Complex Subsystems

```
╔══════════════════════════════════════════════════════════════════════╗
║  PROBLEM: Complex subsystem with many classes — need simple API.     ║
║  ANALOGY: A hotel concierge — one person handles restaurant,         ║
║           taxi, and room service instead of you calling each.        ║
║  USE: Wrapping complex libraries, simplifying microservice calls.    ║
╚══════════════════════════════════════════════════════════════════════╝
```

```java
// Complex subsystems
class InventoryService { boolean checkStock(String productId) { /*...*/ } }
class PaymentService   { boolean processPayment(Order order)    { /*...*/ } }
class ShippingService  { String createShipment(Order order)     { /*...*/ } }
class NotifyService    { void sendConfirmation(String email)    { /*...*/ } }

// Facade — one simple method for the client
public class OrderFacade {
    private final InventoryService inventory;
    private final PaymentService payment;
    private final ShippingService shipping;
    private final NotifyService notify;

    // Constructor with DI...

    public OrderResult placeOrder(Order order) {
        // Step 1: Check stock
        if (!inventory.checkStock(order.getProductId())) {
            return OrderResult.outOfStock();
        }

        // Step 2: Process payment
        if (!payment.processPayment(order)) {
            return OrderResult.paymentFailed();
        }

        // Step 3: Create shipment
        String trackingId = shipping.createShipment(order);

        // Step 4: Notify customer
        notify.sendConfirmation(order.getEmail());

        return OrderResult.success(trackingId);
    }
}

// Client code is SIMPLE
OrderResult result = orderFacade.placeOrder(order);
```

### 7. Proxy — Control Access to an Object

```
╔══════════════════════════════════════════════════════════════════════╗
║  PROBLEM: Need to add control (caching, access, logging) around      ║
║           an object without changing it.                             ║
║  ANALOGY: A security guard (proxy) controlling access to a           ║
║           building (real object).                                    ║
║  USE: Caching proxy, lazy initialization, access control, logging    ║
╚══════════════════════════════════════════════════════════════════════╝
```

```java
public interface UserRepository {
    User findById(Long id);
}

// Real implementation
public class UserRepositoryImpl implements UserRepository {
    @Override
    public User findById(Long id) {
        // expensive database call
        return queryDatabase(id);
    }
}

// Caching Proxy
public class CachingUserRepository implements UserRepository {
    private final UserRepository realRepo;
    private final Map<Long, User> cache = new ConcurrentHashMap<>();

    public CachingUserRepository(UserRepository realRepo) {
        this.realRepo = realRepo;
    }

    @Override
    public User findById(Long id) {
        return cache.computeIfAbsent(id, realRepo::findById);
    }
}

// Usage — caller doesn't know about caching
UserRepository repo = new CachingUserRepository(new UserRepositoryImpl());
User user = repo.findById(1L);  // DB call
User same = repo.findById(1L);  // cache hit!

// Spring uses proxies everywhere: @Transactional, @Cacheable, @Async
```

---

🔬 **Section Challenge — Structural Patterns**

**Challenge 1 (Design — Who/When/What):** Decorator vs Proxy — both wrap an object. In the code above, `EncryptionDecorator` wraps `FileDataSource` and `CachingUserRepository` wraps `UserRepositoryImpl`. **What** is the fundamental difference in intent? **When** would you choose one over the other?

<details><summary>Answer</summary>

**Decorator intent:** ADD new behavior (encryption, compression, logging) that the original doesn't have. You can stack multiple decorators. **Proxy intent:** CONTROL access to existing behavior (caching, lazy loading, access control). You add no new functionality, just a gate.

**When to choose:** Need to enrich functionality? Decorator. Need to restrict/optimize access? Proxy. The structural implementation is nearly identical (wrapper implements same interface), but the intent drives the design. A logging Decorator adds behavior; a caching Proxy optimizes access. If you're adding layers of features (compress + encrypt + log), that's Decorator stacking. If you're guarding one operation (check cache before DB), that's Proxy.

</details>

## Behavioral Patterns

### 8. Strategy — Swap Algorithms at Runtime

```
╔══════════════════════════════════════════════════════════════════════╗
║  PROBLEM: Multiple ways to do something — want to swap easily.       ║
║  ANALOGY: Different routes to work — GPS selects based on traffic.   ║
║  USE: Sorting, validation, pricing, authentication strategies.       ║
╚══════════════════════════════════════════════════════════════════════╝
```

```java
// Strategy interface
@FunctionalInterface
public interface DiscountStrategy {
    double calculateDiscount(double price);
}

// Concrete strategies
public class NoDiscount implements DiscountStrategy {
    public double calculateDiscount(double price) { return price; }
}

public class PercentageDiscount implements DiscountStrategy {
    private final double percent;
    public PercentageDiscount(double percent) { this.percent = percent; }
    public double calculateDiscount(double price) {
        return price * (1 - percent / 100);
    }
}

public class FlatDiscount implements DiscountStrategy {
    private final double amount;
    public FlatDiscount(double amount) { this.amount = amount; }
    public double calculateDiscount(double price) {
        return Math.max(0, price - amount);
    }
}

// Context
public class ShoppingCart {
    private DiscountStrategy discountStrategy;

    public void setDiscountStrategy(DiscountStrategy strategy) {
        this.discountStrategy = strategy;
    }

    public double checkout(double total) {
        return discountStrategy.calculateDiscount(total);
    }
}

// Usage
ShoppingCart cart = new ShoppingCart();
cart.setDiscountStrategy(new PercentageDiscount(20));
double price = cart.checkout(100.0);  // 80.0

// With lambdas (since it's a functional interface):
cart.setDiscountStrategy(price -> price * 0.9); // 10% off inline
```

### 9. Observer — Notify When State Changes

```
╔══════════════════════════════════════════════════════════════════════╗
║  PROBLEM: Object changes → multiple others need to know.             ║
║  ANALOGY: YouTube subscription — when channel uploads, you get       ║
║           notified (along with all other subscribers).               ║
║  USE: Event systems, UI updates, pub/sub, reactive programming.      ║
╚══════════════════════════════════════════════════════════════════════╝
```

```java
// Observer interface
public interface OrderEventListener {
    void onOrderPlaced(Order order);
}

// Concrete observers
public class InventoryManager implements OrderEventListener {
    @Override
    public void onOrderPlaced(Order order) {
        System.out.println("Reducing stock for: " + order.getProductId());
    }
}

public class EmailService implements OrderEventListener {
    @Override
    public void onOrderPlaced(Order order) {
        System.out.println("Sending confirmation to: " + order.getEmail());
    }
}

public class AnalyticsService implements OrderEventListener {
    @Override
    public void onOrderPlaced(Order order) {
        System.out.println("Tracking order event for analytics");
    }
}

// Subject (publisher)
public class OrderService {
    private final List<OrderEventListener> listeners = new ArrayList<>();

    public void subscribe(OrderEventListener listener) {
        listeners.add(listener);
    }

    public void placeOrder(Order order) {
        // ... business logic ...

        // Notify all observers
        listeners.forEach(l -> l.onOrderPlaced(order));
    }
}

// Usage
OrderService orderService = new OrderService();
orderService.subscribe(new InventoryManager());
orderService.subscribe(new EmailService());
orderService.subscribe(new AnalyticsService());

orderService.placeOrder(new Order(/*...*/));
// All 3 listeners are notified!

// In Spring: ApplicationEventPublisher + @EventListener do exactly this
```

### 10. Template Method — Define Algorithm Skeleton

```
╔══════════════════════════════════════════════════════════════════════╗
║  PROBLEM: Same algorithm steps, different implementation details.    ║
║  ANALOGY: A recipe — same steps (prep, cook, serve) but              ║
║           ingredients/method differ for each dish.                   ║
║  USE: Frameworks (Spring's JdbcTemplate), data processing pipes      ║
╚══════════════════════════════════════════════════════════════════════╝
```

```java
// Template
public abstract class DataImporter {

    // Template method — defines the algorithm skeleton
    public final void importData() {
        String raw = readData();          // Step 1
        List<Record> parsed = parse(raw); // Step 2
        List<Record> valid = validate(parsed); // Step 3
        save(valid);                      // Step 4
        notifyComplete(valid.size());     // Step 5
    }

    protected abstract String readData();              // subclass implements
    protected abstract List<Record> parse(String raw); // subclass implements

    // Common implementation (can be overridden)
    protected List<Record> validate(List<Record> records) {
        return records.stream()
                .filter(Record::isValid)
                .collect(Collectors.toList());
    }

    protected void save(List<Record> records) {
        repository.saveAll(records);
    }

    protected void notifyComplete(int count) {
        log.info("Imported {} records", count);
    }
}

// Concrete implementations
public class CSVImporter extends DataImporter {
    @Override
    protected String readData() { return readFile("data.csv"); }

    @Override
    protected List<Record> parse(String raw) {
        return Arrays.stream(raw.split("\n"))
                .map(line -> Record.fromCSV(line))
                .collect(Collectors.toList());
    }
}

public class JSONImporter extends DataImporter {
    @Override
    protected String readData() { return callAPI("/api/data"); }

    @Override
    protected List<Record> parse(String raw) {
        return objectMapper.readValue(raw, new TypeReference<>() {});
    }
}

// Usage
DataImporter importer = new CSVImporter();
importer.importData(); // runs the whole pipeline
```

### 11. Chain of Responsibility — Pass Request Along a Chain

```
╔══════════════════════════════════════════════════════════════════════╗
║  PROBLEM: Multiple handlers, unknown which one handles request.      ║
║  ANALOGY: Customer support escalation — Level 1 → 2 → Manager.       ║
║  USE: Middleware, validation chains, logging, servlet filters.       ║
╚══════════════════════════════════════════════════════════════════════╝
```

```java
public abstract class AuthHandler {
    private AuthHandler next;

    public AuthHandler setNext(AuthHandler handler) {
        this.next = handler;
        return handler; // for chaining
    }

    public boolean handle(HttpRequest request) {
        if (next != null) {
            return next.handle(request);
        }
        return true; // end of chain = approved
    }
}

public class RateLimitHandler extends AuthHandler {
    @Override
    public boolean handle(HttpRequest request) {
        if (isRateLimited(request.getIp())) {
            throw new TooManyRequestsException();
        }
        return super.handle(request); // pass to next
    }
}

public class AuthenticationHandler extends AuthHandler {
    @Override
    public boolean handle(HttpRequest request) {
        if (!isValidToken(request.getToken())) {
            throw new UnauthorizedException();
        }
        return super.handle(request);
    }
}

public class AuthorizationHandler extends AuthHandler {
    @Override
    public boolean handle(HttpRequest request) {
        if (!hasPermission(request.getUser(), request.getResource())) {
            throw new ForbiddenException();
        }
        return super.handle(request);
    }
}

// Build the chain
AuthHandler chain = new RateLimitHandler();
chain.setNext(new AuthenticationHandler())
     .setNext(new AuthorizationHandler());

// Process request — goes through rate limit → auth → authz
chain.handle(request);

// Spring Security filter chain works exactly like this!
```

---

🔬 **Section Challenge — Behavioral Patterns**

**Challenge 1 (Reasoning):** Strategy vs Template Method — both let you vary algorithm behavior. In the code above, `DiscountStrategy` uses composition (HAS-A) while `DataImporter` uses inheritance (IS-A). **When** is each appropriate? **What** limitation does Template Method have that Strategy doesn't?

<details><summary>Answer</summary>

**Strategy (composition):** Use when algorithms are interchangeable AT RUNTIME. The `ShoppingCart` can swap discount strategies per transaction. No inheritance needed — strategies are independent objects. **Template Method (inheritance):** Use when the ALGORITHM SKELETON is fixed but specific steps vary. `DataImporter` always runs read→parse→validate→save→notify — subclasses only override specific steps.

**Template Method's limitation:** Single inheritance. A `CSVImporter` can't also be a `CompressedImporter`. With Strategy, you can inject multiple strategies (discount strategy + shipping strategy + tax strategy). Template Method locks you into one hierarchy. Modern Java preference: favor Strategy (composition) over Template Method (inheritance) — this is "favor composition over inheritance" in practice.

</details>

## Patterns in Spring Boot — Where You Already Use Them

```
╔══════════════════════════════════════════════════════════════════════╗
║  PATTERN               │  WHERE IT APPEARS IN SPRING                 ║
╠════════════════════════╪═════════════════════════════════════════════╣
║  Singleton             │  @Component, @Service, @Bean (default)      ║
║  Factory               │  BeanFactory, FactoryBean                   ║
║  Builder               │  ResponseEntity.ok().body(data).build()     ║
║  Proxy                 │  @Transactional, @Cacheable, @Async         ║
║  Template Method       │  JdbcTemplate, RestTemplate                 ║
║  Observer              │  ApplicationEvent + @EventListener          ║
║  Strategy              │  AuthenticationProvider implementations     ║
║  Decorator             │  HttpServletRequestWrapper                  ║
║  Adapter               │  HandlerAdapter in MVC                      ║
║  Chain of Resp         │  Security Filter Chain                      ║
║  Facade                │  Spring Data JPA Repository                 ║
║  Composite             │  CompositeCacheManager                      ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

## Pattern Selection Guide

```
╔══════════════════════════════════════════════════════════════════════╗
║  WHEN YOU NEED TO...              │  USE THIS PATTERN                ║
╠═══════════════════════════════════╪══════════════════════════════════╣
║  Create objects flexibly          │  Factory / Abstract Factory      ║
║  Build complex objects step by    │  Builder                         ║
║  step                             │                                  ║
║  Ensure one instance              │  Singleton                       ║
║  Make incompatible code work      │  Adapter                         ║
║  Add behavior without modifying   │  Decorator                       ║
║  Simplify a complex subsystem     │  Facade                          ║
║  Control access or add caching    │  Proxy                           ║
║  Swap algorithms at runtime       │  Strategy                        ║
║  Notify subscribers of changes    │  Observer                        ║
║  Define algorithm skeleton        │  Template Method                 ║
║  Process through multiple steps   │  Chain of Responsibility         ║
║  Represent tree structures        │  Composite                       ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

🔬 **Section Challenge — Pattern Selection Guide**

**Challenge 1 (Design):** You're building an e-commerce checkout. Requirements: (1) apply different tax rules per state, (2) wrap payment processing with logging + retry, (3) create order objects with 12 optional fields. Which pattern for each and why?

<details><summary>Answer</summary>

**(1) Tax rules → Strategy.** Different algorithms (state tax calculation) swapped at runtime based on shipping address. `TaxStrategy` interface with `CaliforniaTax`, `TexasTax`, etc. **(2) Logging + retry → Decorator.** Wrap `PaymentProcessor` with `LoggingDecorator` then `RetryDecorator`. Each adds behavior without modifying the core. **(3) Order with 12 optional fields → Builder.** Avoids telescoping constructors. Required fields in Builder constructor, optional via fluent methods. `Order order = new Order.Builder(userId, cartId).shippingAddress(...).giftWrap(true).build();`

</details>

## Interview Quick-Fire

```
Q: What's the difference between Strategy and Template Method?
A: Strategy: composition (HAS-A) — inject different algorithms
   Template: inheritance (IS-A) — override specific steps

Q: When would you use Factory over new?
A: When the creation logic is complex, when you want to decouple
   the client from concrete classes, or when the type is determined
   at runtime.

Q: Decorator vs Proxy — what's the difference?
A: Decorator: adds NEW behavior (stacking features)
   Proxy: controls ACCESS to existing behavior (caching, security)
   Structurally similar, different intent.

Q: Name 3 patterns you've used in real projects.
A: Builder (API response objects), Strategy (payment processing
   with multiple gateways), Observer (event-driven order processing
   with Spring @EventListener)

Q: What's wrong with Singleton?
A: Global state, hard to test (use DI instead), hides dependencies,
   violates SRP if it manages its own creation + business logic.
```

---

## Mental Model: Patterns as Communication

```
╔══════════════════════════════════════════════════════════════════════╗
║  Design patterns are a SHARED VOCABULARY between developers.         ║
║                                                                      ║
║  Without patterns:                                                   ║
║  "I made a class that wraps another class and adds logging           ║
║   before calling the original method and..."                         ║
║                                                                      ║
║  With patterns:                                                      ║
║  "I used a Decorator for logging."                                   ║
║  → Everyone immediately understands the architecture.                ║
║                                                                      ║
║  ⚠️ WARNING: Don't force patterns where they're not needed.          ║
║  The cure shouldn't be worse than the disease.                       ║
║  Simple problems deserve simple solutions.                           ║
╚══════════════════════════════════════════════════════════════════════╝
```

## PLUS Enhancements

### Diagram 1: Singleton Double-Checked Locking with volatile (Memory Layout)

```
  WITHOUT volatile — THE BROKEN PATH:
  ═══════════════════════════════════

  Thread A (getInstance, creates Logger):
  ─────────────────────────────────────────

  Step 1: allocate memory for Logger object
         ┌─────────────────────────────────┐
         │  instance ─────────────────┐    │
         │  fields: null              │    │
         │  ┌──────────────────────┐  │    │
         │  │ (uninitialized data) │  │    │
         │  └──────────────────────┘  │    │
         └─────────────────────────────────┘
                    │
                    │ INSTRUCTION REORDERING HAPPENS HERE
                    ▼
  Step 2: instance = reference (pointer set)
         ┌─────────────────────────────────┐
         │  instance ─────────────────┐    │
         │  fields: null              │    │
         │  ┌──────────────────────┐  │    │
         │  │ (still uninitialized)│  │    │
         │  └──────────────────────┘  │    │
         └─────────────────────────────────┘
                    │
                    │ (constructor NOT yet run!)
                    ▼
  Step 3: run constructor (writes to fields)
         ┌─────────────────────────────────┐
         │  instance ─────────────────┐    │
         │  fields: fileWriter=...    │    │
         │  ┌──────────────────────┐  │    │
         │  │ FileWriter ready     │  │    │
         │  └──────────────────────┘  │    │
         └─────────────────────────────────┘

  Thread B arrives at if(instance==null)? → SEES instance ≠ null
         → RETURNS PARTIALLY CONSTRUCTED Logger!
         → fileWriter == null → NullPointerException!

  WITH volatile — THE CORRECT PATH:
  ══════════════════════════════════

  volatile creates a happens-before memory barrier:

  Step 1: allocate memory
  Step 2: instance = reference  ──────┐
  Step 3: run constructor              │ happens-before
         └─────────────────────────────┘

  The volatile write (Step 2) happens-before
  any subsequent volatile read (Thread B sees fully constructed object)

  THE DOUBLE-CHECK DIAGRAM:
  ═════════════════════════

  public static Logger getInstance() {
      if (instance == null) {          ◀── First check: fast path (no lock)
          synchronized(Logger.class) {   │
              if (instance == null) {    ◀── Second check: with lock
                  instance = new Logger();│
              }                          │
          }                              │
      }                                  │
      return instance;                   │
  }
                                        │
  Thread A: holds lock → creates        │
  Thread B: waits at synchronized       │
  Thread B: acquires lock → sees        │
            instance ≠ null → returns   │
            (Thread A completed)         │

  WHY TWO CHECKS?
  Without first check: every call acquires lock → massive overhead
  Without second check: two threads both acquire lock → create twice
```

### Diagram 2: Decorator Pattern — "Russian Doll" Wrapping Visualization

```
  COMPONENT INTERFACE
  ════════════════════

  ┌────────────────────────────────────────────────────┐
  │ <<interface>> DataSource                           │
  ├────────────────────────────────────────────────────┤
  │ + read(): String                                   │
  │ + write(data: String): void                        │
  └────────────────────────────────────────────────────┘
                              △
                              │ implements
          ┌───────────────────┴──────────────────┐
          │                                      │
  ┌───────────────┐                      ┌───────────────┐
  │FileDataSource │                      │NetworkSource  │
  │(base concrete)│                      │               │
  └───────────────┘                      └───────────────┘

  DECORATOR CHAIN (wrapping = "russian doll"):
  ══════════════════════════════════════════

  At usage time:
  DataSource source = new CompressionDecorator(
                          new EncryptionDecorator(
                              new FileDataSource("data.txt")));

  Visualization of the chain:
  ════════════════════

  ┌─────────────────────────────────────────────────────┐
  │                  CompressionDecorator               │
  │  wrappee: ────────────▶ ┌────────────────────────┐ │
  │  compress(write)        │  EncryptionDecorator    │ │
  │  decompress(read)       │  wrappee: ────────────▶│ │
  │                         │  encrypt(write)         │ │
  │                         │  decrypt(read)          │ │
  │                         │                         │ │
  │                         │  wrappee: ────────────▶│ │
  │                         │  FileDataSource        │ │
  │                         │  readFromFile()        │ │
  │                         │  writeToFile()         │ │
  │                         └────────────────────────┘ │
  └─────────────────────────────────────────────────────┘

  WRITE FLOW (outside-in):
  ══════════════════════

  client.write("sensitive data")
       │
       ▼
  ┌────────────────────────────────────┐
  │ CompressionDecorator.write(data)   │
  │   compressed = compress(data)      │
  │   super.write(compressed)          │
  │       ▼                           │
  │   ┌──────────────────────────────┐│
  │   │ EncryptionDecorator.write()  ││
  │   │   encrypted = encrypt(comp)  ││
  │   │   super.write(encrypted)     ││
  │   │       ▼                      ││
  │   │   ┌────────────────────────┐ ││
  │   │   │ FileDataSource.write() │ ││
  │   │   │   writeToFile(enc)     │ ││
  │   │   └────────────────────────┘ ││
  │   └──────────────────────────────┘│
  └────────────────────────────────────┘

  READ FLOW (inside-out):
  ══════════════════════
  FileDataSource.read() → FileDataSource.readFromFile()
       │
  EncryptionDecorator.read() → decrypt(raw) ──────────────▶
       │
  CompressionDecorator.read() → decompress(decrypted) ────▶
       │
  client.read() → returns fully processed data

  KEY PROPERTY: Decorators are STACKABLE and COMPOSABLE.
  New decorators added with ZERO changes to existing code (OCP).
```

### Diagram 3: Proxy Pattern (Spring AOP) — Transaction/Async Sequence

```
  ┌──────────────────────────────────────────────────────────────────────────┐
  │           SPRING AOP PROXY CHAIN (how @Transactional works)              │
  └──────────────────────────────────────────────────────────────────────────┘

  WITHOUT SPRING PROXY (what you might expect):
  ══════════════════════════════════════════════
  Client ──────────────────────────────▶ TargetService.method()

  WITH SPRING PROXY (what actually happens):
  ══════════════════════════════════════════════

  Client
    │
    │ userService.method()
    ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │  CGLIB-generated Proxy (extends UserService)                            │
  │                                                                         │
  │  method() {                                                             │
  │    // BEFORE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━       │
  │    // @Transactional: DataSourceUtils.getConnection()                   │
  │    // Connection.setAutoCommit(false)                                   │
  │    // TransactionSynchronizationManager.bindResource()                  │
  │    // @Async: submit to thread pool, return CompletableFuture          │
  │    // @Cacheable: check cache, return if hit                            │
  │    //                                                                   │
  │    ┌───────────────────────────────────────────────────────────────┐   │
  │    │                    TARGET METHOD                               │   │
  │    │              super.method()  ──────────────────────────────▶ │   │
  │    │              (actual UserService logic executes here)         │   │
  │    └───────────────────────────────────────────────────────────────┘   │
  │                                                                         │
  │    // AFTER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━     │
  │    // @Transactional: Connection.commit() or Connection.rollback()     │
  │    // @Cacheable: put result in cache                                   │
  │    // @Async: already returned CompletableFuture to caller              │
  │  }                                                                      │
  └─────────────────────────────────────────────────────────────────────────┘

  BEAN POST-PROCESSOR LIFECYCLE:
  ═══════════════════════════════════

  Spring Container starts
       │
       ▼
  Bean instantiated (new UserServiceImpl())
       │
       ▼
  BeanPostProcessor.postProcessAfterInitialization()
       │
       ▼
  ┌─────────────────────────────────────────────────────────┐
  │  Creates proxy wrapping the bean                        │
  │  If @Transactional on class/method:                     │
  │    → Creates TransactionInterceptor                     │
  │    → Wraps target in JdkDynamicProxy or CGLIB           │
  │  If @Async on method:                                  │
  │    → Wraps in AsyncExecutionInterceptor                │
  └─────────────────────────────────────────────────────────┘
       │
       ▼
  Proxy injected into all @Autowired fields
  (client code never sees the real object — only the proxy)

  SPRING AOP ATTRIBUTE FLOW (annotation → behavior):
  ═══════════════════════════════════════════════════

  @Transactional              @Cacheable           @Async
  ─────────────               ───────────          ──────
  Before: begin tx            Before: check cache  Before: submit to thread pool
  After:  commit/rollback     After:  put in cache  After:  returns Future

  Annotation → Aspect → Pointcut → Advice → Proxy
  ────────────────────────────────────────────────
  @Transactional → TransactionAspect → execution(* *..*Service.*(..))
                  → @Before + @AfterReturning/AfterThrowing
                  → TransactionInterceptor.invoke()

  THE "SELF-INVOCATION" PROBLEM:
  ════════════════════════════════
  Inside UserService:
    methodA() { this.methodB(); }  ← this bypasses proxy!
    @Transactional
    methodB() { /* no transaction! */ }  ← proxy not called

  Fix: inject self (self-injection) or use TransactionTemplate.
```

### Mechanism Deep-Dive: Spring's AOP Proxy Chain

**How the BeanPostProcessor creates the proxy at startup:**

```
  SPRING CONTAINER BOOTSTRAP SEQUENCE:
  ══════════════════════════════════════

  1. BeanDefinitionReader parses @Component / @Service
     → Registers bean definition: "userService" → UserServiceImpl.class

  2. BeanFactoryPostProcessor processes bean definitions
     → Finds @Transactional annotations
     → Registers transaction infrastructure beans (DataSource, TransactionManager)

  3. BeanInstantiation: new UserServiceImpl()
     → Real object created (constructor runs)

  4. BeanPostProcessor.postProcessAfterInitialization()
     → Wraps real object in proxy

  ┌──────────────────────────────────────────────────────────────────┐
  │  AnnotationTransactionAspect (aspectJ-based) or                  │
  │  TransactionInterceptor (JDK dynamic proxy)                      │
  │  is registered as a BeanPostProcessor.                          │
  │  It wraps every bean that has @Transactional.                   │
  └──────────────────────────────────────────────────────────────────┘

  PROXY TYPE SELECTION:
  ════════════════════

  If UserServiceImpl implements an interface (e.g., UserService):
    → Spring uses JDK Dynamic Proxy
    → Proxy implements UserService, extends InvocationHandler
    → Proxy.method() → InvocationHandler.invoke()

  If UserServiceImpl does NOT implement an interface:
    → Spring uses CGLIB (code generation library)
    → Proxy SUBCLASSES UserServiceImpl
    → Overrides every method to add intercept logic
    → Proxy is a subclass — may fail if methods are final

  HOW @Transactional TRIGGERS TRANSACTION BOUNDARIES:
  ═════════════════════════════════════════════════════

  @Transactional
  public void transfer(Account from, Account to, double amount) {
      debit(from, amount);
      credit(to, amount);
      // if exception → rollback
      // if success → commit
  }

  What actually executes:
  ═════════════════════

  TransactionInterceptor.invoke(MethodInvocation):

  1. Determine transaction attributes:
     Read propagation, isolation level, timeout from annotation

  2. Check transaction propagation:
     Is there already a transaction on this thread?
     → PROPAGATION.REQUIRED: join existing (don't suspend)
     → PROPAGATION.REQUIRES_NEW: suspend existing, start new

  3. Get connection from DataSource:
     Connection conn = DataSourceUtils.getConnection(dataSource);

  4. Set isolation level:
     conn.setTransactionIsolation(Connection.TRANSACTION_SERIALIZABLE);

  5. Set autoCommit = false:
     conn.setAutoCommit(false);

  6. Bind to ThreadLocal (so nested @Transactional calls join):
     TransactionSynchronizationManager.bindResource(ds, connection)

  7. INVOKE TARGET METHOD (user code runs here)
     invocation.proceed()

  8a. If NO exception: Connection.commit()
  8b. If EXCEPTION thrown: Connection.rollback()

  9. Unbind from ThreadLocal:
      TransactionSynchronizationManager.unbindResource(ds)

  10. Return connection to pool:
      DataSourceUtils.releaseConnection(conn, ds)
```

### Why-This-Not-That: Builder vs Constructor Telescoping

```
  THE PROBLEM: CONSTRUCTOR TELESCOPING
  ══════════════════════════════════════════

  User has 3 required + 5 optional fields:

  // Without telescoping: 2^5 = 32 constructors needed!
  User("John")                         ← which optionals?
  User("John", null)                   ← which is null?
  User("John", null, null)             ← confusing
  User("John", null, null, null)       ← which is address?
  User("John", null, null, null, null) ← impossible to read

  // Telescoping pattern: each constructor adds one optional
  public User(String firstName) {
      this(firstName, null, null, null, null, null);
  }
  public User(String firstName, String lastName) {
      this(firstName, lastName, null, null, null, null);
  }
  public User(String firstName, String lastName, String email) {
      this(firstName, lastName, email, null, null, null);
  }
  // ... 32 variations

  MAINTENANCE COST: Adding one more optional field requires
  adding 16 new constructors (half of 32).

  THE BUILDER SOLUTION:
  ════════════════════════

  User user = new User.Builder("John", "Doe", "john@example.com")
      .phone("1234567890")
      .address("123 Main St")
      .age(30)
      .build();

  COMPARISON TABLE:
  ════════════════════════

  ┌────────────────────────────────┬──────────────────────┬─────────────────────┐
  │  DIMENSION                    │  BUILDER             │  TELESCOPING         │
  ├────────────────────────────────┼──────────────────────┼─────────────────────┤
  │  N optional params             │  1 class             │  2^N constructors   │
  │  (where N = 5)                │  + 1 Builder inner   │  required!          │
  ├────────────────────────────────┼──────────────────────┼─────────────────────┤
  │  Readability at call site     │  YES: Clear names    │  NO: positional args│
  │                                │    .phone("123")     │    User("John",     │
  │                                │                      │    null, "john@",   │
  │                                │                      │    null, 30)        │
  ├────────────────────────────────┼──────────────────────┼─────────────────────┤
  │  Immutability                 │  YES: final fields   │  NO: mutable during │
  │                                │    set in constructor│    construction     │
  ├────────────────────────────────┼──────────────────────┼─────────────────────┤
  │  Validation                   │  YES: Centralized    │  NO: scattered      │
  │                                │    in build()        │    across ctors     │
  ├────────────────────────────────┼──────────────────────┼─────────────────────┤
  │  Adding optional param         │  2 lines: setter +   │  16 constructor     │
  │                                │  field               │  variants modified! │
  ├────────────────────────────────┼──────────────────────┼─────────────────────┤
  │  IDE auto-complete            │  YES: Builder        │  NO: positional,    │
  │                                │    methods named     │    no name hints    │
  ├────────────────────────────────┼──────────────────────┼─────────────────────┤
  │  Lombok @Builder              │  YES: One annotation │  NO: manual all 32  │
  │  (zero-boilerplate)           │    generates all     │    constructors     │
  └────────────────────────────────┴──────────────────────┴─────────────────────┘

  BUILDER + FLUENT INTERFACE:
  ══════════════════════════

  The key insight: Builder methods RETURN THE BUILDER, not void.

  return this;  // enables method chaining

  This is called the FLUENT INTERFACE pattern.
  Used in: StringBuilder, Stream API, JUnit assertions, HttpClient.

  BUILDER + VALIDATION:
  ══════════════════════════

  public User build() {
      if (firstName == null || firstName.isBlank()) {
          throw new IllegalStateException("firstName required");
      }
      if (age != null && age < 0) {
          throw new IllegalStateException("age must be positive");
      }
      // Cross-field validation
      if (phone != null && !phone.matches("\\d{10}")) {
          throw new IllegalStateException("Invalid phone");
      }
      return new User(this);
  }

  Validation happens ONCE at build(), never scattered.
  Impossible with telescoping: each constructor would need its own validation.

  WHEN NOT TO USE BUILDER:
  ─────────────────────────
  1. 1-2 required fields, no optionals → plain constructor is fine
  2. All parameters required → no benefit
  3. Simple DTO with Jackson/JSON → @Data + @Builder for Jackson integration
  4. Performance-critical (GC pressure from Builder allocation) → consider static factory
```

### Breadth Comparison 1: Creational Pattern Selection Table

```
┌─────────────────┬───────────────────┬─────────────────┬────────────────────────────┐
│  PATTERN        │  WHEN TO USE      │  TRADE-OFFS     │  SELECTION CRITERIA        │
├─────────────────┼───────────────────┼─────────────────┼────────────────────────────┤
│  Factory        │  Type determined  │  Decouples      │  Do you need to create     │
│  Method         │  at subclass      │  creator from   │  ONE family of related     │
│                 │  (Collection.     │  concrete type; │  objects with shared       │
│                 │  iterator())      │  adds indirection│  configuration?           │
├─────────────────┼───────────────────┼─────────────────┼────────────────────────────┤
│  Abstract       │  Creating         │  More complex   │  Need Button + Scrollbar   │
│  Factory        │  families of      │  (many factory  │  to both be Windows-style  │
│                 │  related objects  │  classes);      │  or both Mac-style? Use    │
│                 │  (e.g., UI:       │  hard to add    │  Abstract Factory          │
│                 │  Button+TextField │  new product    │                             │
│                 │  must match style)│  families       │                             │
├─────────────────┼───────────────────┼─────────────────┼────────────────────────────┤
│  Builder        │  Complex object,  │  More code      │  Object has 4+ fields,     │
│                 │  many optional    │  (Builder class);│  some required, some      │
│                 │  params, need     │  1 extra object │  optional; or validation   │
│                 │  immutability     │  allocation     │  needed; or want readable  │
│                 │                   │                 │  call site                 │
├─────────────────┼───────────────────┼─────────────────┼────────────────────────────┤
│  Prototype      │  Creating objects │  Cloning can    │  Need copies of complex   │
│                 │  by cloning       │  be complex for │  objects; avoid rebuilding│
│                 │  existing one     │  deep copies    │  from scratch; e.g.,      │
│                 │  (Shape.clone())  │  (circular refs)│  prototype registry       │
├─────────────────┼───────────────────┼─────────────────┼────────────────────────────┤
│  Singleton      │  One instance,    │  Global state;  │  Framework globals (log,  │
│  (use DI)       │  globally         │  hides deps;    │  config); but prefer DI   │
│                 │  accessible       │  untestable     │  + Spring @Component      │
│                 │  (Registry)       │                 │  over self-managed        │
│                 │                   │                 │  getInstance()            │
├─────────────────┼───────────────────┼─────────────────┼────────────────────────────┤
│  Object Pool    │  Reuse expensive  │  Must manage    │  DB connections, thread   │
│  (not GoF)      │  objects          │  pool lifecycle;│  pools, string pool       │
│                 │                   │  memory if pool │  (reuse String literals)  │
│                 │                   │  too large      │                            │
└─────────────────┴───────────────────┴─────────────────┴────────────────────────────┘

  QUICK DECISION GUIDE:
  ══════════════════════════
  Need ONE of something, global access?  → Singleton (or DI)
  Create by type parameter?              → Factory Method
  Create families of related objects?    → Abstract Factory
  Create complex objects step-by-step?   → Builder
  Create copies of existing objects?     → Prototype
  Reuse expensive resources?             → Object Pool

  MOST USED IN PRODUCTION: Builder (#1), Factory (#2), DI/Singleton (#3)
```

### Breadth Comparison 2: Structural Pattern Comparison — Adapter vs Decorator vs Proxy vs Facade

```
┌──────────────────┬───────────────┬───────────────┬───────────────┬──────────────┐
│  DIMENSION       │  ADAPTER      │  DECORATOR    │  PROXY        │  FACADE      │
├──────────────────┼───────────────┼───────────────┼───────────────┼──────────────┤
│  WRAPS           │  Interface    │  Interface    │  Interface    │  Subsystem   │
│  (what)          │  (converts)   │  (adds)       │  (controls)   │  (simplifies)│
├──────────────────┼───────────────┼───────────────┼───────────────┼──────────────┤
│  CHANGES         │  Interface    │  Behavior     │  Access       │  API         │
│  (what changes)  │  shape        │  (add new)    │  (same op,    │  (many -> 1) │
│                  │               │               │  guarded)     │              │
├──────────────────┼───────────────┼───────────────┼───────────────┼──────────────┤
│  CLIENT SEES     │  New interface│  Same interface│  Same interface│  Simple     │
│                  │  (target)     │  (component)   │  (service)    │  interface   │
├──────────────────┼───────────────┼───────────────┼───────────────┼──────────────┤
│  CAN STACK       │  No (wrap     │  YES - stack  │  No (single   │  No (one     │
│  (multiple)      │  once)        │  many layers  │  level)       │  level)      │
├──────────────────┼───────────────┼───────────────┼───────────────┼──────────────┤
│  LOCATION        │  Anywhere     │  Same package │  Same package │  Client side │
│                  │  (bridges)    │  (extension)  │  (control)    │  (isolation) │
├──────────────────┼───────────────┼───────────────┼───────────────┼──────────────┤
│  INTENTION       │  Make work    │  Add behavior │  Control access│  Simplify   │
│  (why)           │  together     │  dynamically  │  (lazy, cache,│  complexity  │
│                  │               │               │  auth, log)   │              │
├──────────────────┼───────────────┼───────────────┼───────────────┼──────────────┤
│  JAVA EXAMPLE    │  Arrays.asList│  BufferedReader│  @Transactional│  OrderFacade│
│                  │  (ListAdapter)│  wrapping     │  (Spring AOP) │  (placeOrder)│
│                  │               │  FileReader   │  Lazy init    │              │
│                  │               │               │  (Hibernate)  │              │
├──────────────────┼───────────────┼───────────────┼───────────────┼──────────────┤
│  SPRING USE      │  HandlerAdapter│ HttpServlet  │  @Transactional│  Repository │
│  CASE            │  (converts    │  RequestWrap │  @Cacheable   │  (hides JPA  │
│                  │  HTTP request) │  (adds gzip) │  @Async       │  complexity) │
├──────────────────┼───────────────┼───────────────┼───────────────┼──────────────┤
│  STRUCTURAL      │  Target <-> Adaptee Component<-> │  Real<->Proxy │ Client<->  │
│  PARITY          │  (compatible) │  Decorator<-> │  (transparent)│  Subsystem   │
│                  │               │  Concrete     │               │  (all hidden)│
└──────────────────┴───────────────┴───────────────┴───────────────┴──────────────┘

  THE COMMON STRUCTURE (all four wrap):
  ═════════════════════════════════════════

  All four structural patterns share the WRAPPER pattern:

  ┌────────────────┐
  │    Client      │
  └───────┬────────┘
          │
          ▼
  ┌────────────────┐     implements      ┌────────────────────┐
  │  Wrapper       │────────────────────▶│  Target Interface  │
  │  (Adapter/     │                     └────────────────────┘
  │   Decorator/   │                            ▲
  │   Proxy/Facade)│                            │ implements
  │                │                     ┌──────┴──────────────┐
  │  wrappee: ────▶│                     │                     │
  └────────────────┘                     │                     │
                                          └─────────────────────┘

  WHAT DIFFERS IS THE WRAPPER'S BEHAVIOR:
  ════════════════════════════════════

  ADAPTER:    Wraps incompatible interface → makes it look like target
  DECORATOR:  Wraps same interface → adds NEW behavior (stacking OK)
  PROXY:      Wraps same interface → CONTROLS access (caching, auth)
  FACADE:     Wraps MULTIPLE interfaces → provides SIMPLE entry point

  REMEMBER:
  ─────────
  "Adapter makes things WORK together."
  "Decorator makes things DO MORE."
  "Proxy makes things ACCESS SAFELY."
  "Facade makes things SIMPLER."

  STRUCTURAL SIMILARITY → PRACTICAL DIFFERENCE:
  ══════════════════════════════════════════════
  Adapter:   I have X but need Y → adapt X to look like Y
  Decorator: I have X and need X + logging → wrap X with logging
  Proxy:     I have X but don't want to load it until called → lazy X
  Facade:    I have A+B+C+D and client only knows E → E hides A+B+C+D
```

---

_Learn 5 patterns deeply (Strategy, Factory, Builder, Observer, Decorator). The rest you can recognize and reference._

---

---

🔬 **Section Challenge — Mental Model: Patterns as Communication**

**Challenge 1 (Reasoning):** The warning says "Don't force patterns where they're not needed." Give a concrete example of pattern over-engineering: describe a simple problem where applying a design pattern makes the code WORSE, and explain why the simple solution is better.

<details><summary>Answer</summary>

**Example:** A small script that reads a config file. Over-engineered: `ConfigReaderFactory` + `ConfigReader` interface + `JSONConfigReader` + `YAMLConfigReader` + `ConfigReaderBuilder`. For a single-file, single-format script, this is 5 classes for what should be `Properties.load(new FileInputStream("config.properties"))`. **Why worse?** More code to maintain, more indirection to trace, more files to navigate. Patterns solve recurring problems in COMPLEX systems — applying them to simple problems adds complexity without benefit. The rule: if you can explain the entire module in one sentence, you probably don't need a pattern. Patterns should reduce cognitive load, not increase it. If adding a pattern makes the code harder to understand for a competent developer, you're over-engineering.

</details>

### Production Reality

- **Boeing 737 MAX 2018-2019**: MCAS (Maneuvering Characteristics Augmentation System) software caused two crashes killing **346 people**. Root cause relevant to OOP/SOLID: (1) **SRP violation**: MCAS was given a single input — one Angle-of-Attack (AoA) sensor. The system had one reason to change (flight envelope protection) but relied on a single sensor rather than voting across multiple redundant sensors. (2) **DIP violation**: The MCAS was tightly coupled to a physical sensor without an abstraction layer — if the sensor failed, there was no fallback. In OOP terms: the design violated ISP (the sensor abstraction exposed raw voltage values rather than a "flight condition is safe" boolean) and DIP (the flight controller depended on a concrete sensor, not an interface). The fix added a second AoA sensor, an AoA disagree alert, and an independent architecture layer that could not be overridden by the original MCAS code.
- **Cisco IOS 2018**: A VPN vulnerability allowed **unauthenticated remote code execution** on Cisco enterprise routers. Root cause: improper input validation — the encapsulation boundary was broken at the network stack boundary. The IOS process handling VPN packets did not validate packet length fields before copying them into fixed-size buffers, causing a stack buffer overflow. In OOP terms: this is a broken **encapsulation** violation at the system boundary. Data from an external source (the network) was treated as trusted and passed directly into internal state structures without validation. The OOP principle that applies: "validate all input at the boundary" — untrusted data from outside a class's encapsulation layer must always be treated as potentially malicious. The fix was a boundary validation layer (packet sanitizer) inserted between the network interface and the IOS processing core.
- **Singleton anti-pattern in production**: The GoF Singleton (self-managed `getInstance()`) is a source of real production failures in Java. The `volatile` bug described in the challenge above has caused silent data corruption in logging frameworks (partially constructed loggers with null fields write nothing, silently losing audit trails). Spring's `@Component` (a container-managed singleton with DI) avoids this entirely — the container owns instantiation, so the container can inject mocks, control lifecycle, and guarantee thread-safe construction. **Pattern lesson**: use DI + container-managed scopes instead of self-managed Singleton. If you must use Singleton, use the enum form (Joshua Bloch, Effective Java, Item 3) which is immune to reflection and serialization attacks.

#### In Production: Diamond Inheritance with Java 8+ Default Methods

Java forbids class multiple inheritance (`class D extends A, B`), but allows _interface_ multiple inheritance via `implements`. With Java 8's `default` methods, two interfaces can both provide an implementation of the same method signature — creating the **interface diamond problem**:

```java
// Two orthogonal interfaces — Audit and Notification — both default to logging
interface AuditLog { default void log(String event) { System.out.println("Audit: " + event); } }
interface NotifyAdmin { default void log(String event) { System.out.println("Admin: " + event); } }

// This COMPILE ERRORs — unrelated defaults for log():
class OrderService implements AuditLog, NotifyAdmin { }  // error!

// Must explicitly resolve:
class OrderService implements AuditLog, NotifyAdmin {
    public void log(String event) { AuditLog.super.log(event); }  // picks AuditLog's version
}
```

**Production failure mode**: Java's own Collections API designers avoided this by using abstract classes (`AbstractList`, `AbstractSet`) rather than interfaces with defaults. If `List` and `Set` had both declared `default` implementations of `toArray()` with different logic, any class implementing both would require mandatory override. The interface default method feature, added in Java 8 for lambda-compatible evolution, has caused compile errors in real codebases that tried to retrofit default behavior onto orthogonal APIs.

**C++ parity**: The C++ multiple-inheritance diamond (`class D : public B, public C`) has the same ambiguity with no compiler automatic resolution. C++ requires either explicit disambiguation (`D::B::foo()`) or virtual inheritance (`class B : virtual public A`). Virtual inheritance adds a vptr indirection cost and complicates constructor ordering — it is rarely used, so C++ codebases simply avoid multiple inheritance of stateful base classes.

In Java, the interface default method feature is a powerful tool for API evolution but must be used with care to avoid unintentional diamond inheritance issues. The best practice is to avoid default methods in interfaces that are likely to be implemented together, or to design interfaces with clear orthogonal responsibilities that don't overlap in method signatures.


---

## Reality Check

**"Java pattern implementations are the GoF book translated"** — Modern Java ABSORBED half the catalog into language and library: Strategy is a Function or Comparator parameter, Observer is listeners/reactive streams, Template Method competes with lambda-parameterized methods, Decorator lives in java.io and Collections wrappers, and Builder collapses into records for pure data (surviving only for many-optional-argument construction). Writing 1994-shaped class hierarchies where a lambda suffices is the number-one signal of book-learned rather than practiced Java.

**"The JDK uses patterns as textbook examples"** — The JDK is a pattern MUSEUM with honest exhibit labels: Integer.valueOf is Flyweight (the -128..127 cache — the same cache behind the boxed-equality trap), Collections.unmodifiableList is a protection Proxy whose view semantics (underlying changes show through) surprise people, Runtime.getRuntime is Singleton, Iterator is everywhere, and Stream pipelines are Builder-plus-lazy-Interpreter. Reading these as pattern instances with their JDK-specific quirks teaches more than any invented Shape hierarchy.

**"Enum singletons are a Java trivia answer"** — The enum form solves the two attacks the classic forms lose to — serialization creating a second instance (readResolve forgotten) and reflective constructor access — because the JVM guarantees enum constant uniqueness through both. But the modern context matters more: in DI-managed applications, container-scoped beans replace hand-rolled singletons entirely, and the enum trick remains relevant mainly for framework-free libraries. Knowing both the trick AND its shrinking habitat is the senior answer.

**"Spring uses patterns internally, which is implementation detail"** — Spring's programming MODEL is patterns you configure: proxies wrap your beans (which is why self-invocation skips transactions — the Proxy pattern's mechanics becoming a production bug), BeanFactory/FactoryBean are Factory at two levels, template classes (JdbcTemplate, RestTemplate) are Template Method inverted through callbacks, and the entire event system is Observer. Debugging Spring without pattern literacy means debugging effects without models; half of the famous Spring gotchas are pattern mechanics showing through.

**"Pattern knowledge in Java is tested by implementing them"** — Production and senior interviews test pattern JUDGMENT in Java's specific constraint field: when sealed interfaces plus pattern-matching switches beat Visitor (almost always now), when records kill Builder, when composition via default methods replaces skeletal-implementation inheritance, when a ConcurrentHashMap of lambdas replaces a Strategy registry. The Java-flavored question is never "implement Observer" — it is "this listener list is leaking memory; why?" (anonymous inner classes holding outer references — pattern mechanics meeting GC reality).
