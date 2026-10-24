# Behavioral Patterns

> **Navigation**: [← Structural Patterns](02_structural_patterns.md) | [Chapter overview](../08_Design_Patterns_Java.md) | [Why-This-Not-That: Builder vs Constructor… →](04_why_this_not_that_builder_vs.md)
> Page 3 of 4 in **Design Patterns in Java — Gang of Four & Beyond**


## 8. Strategy — Swap Algorithms at Runtime

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

## 9. Observer — Notify When State Changes

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

## 10. Template Method — Define Algorithm Skeleton

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

## 11. Chain of Responsibility — Pass Request Along a Chain

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

## Diagram 2: Decorator Pattern — "Russian Doll" Wrapping Visualization

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

## Diagram 3: Proxy Pattern (Spring AOP) — Transaction/Async Sequence

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

## Mechanism Deep-Dive: Spring's AOP Proxy Chain

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

---

[← Structural Patterns](02_structural_patterns.md) | [Chapter overview](../08_Design_Patterns_Java.md) | [Why-This-Not-That: Builder vs Constructor… →](04_why_this_not_that_builder_vs.md)
