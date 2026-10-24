# Structural Patterns

> **Navigation**: [← Pattern Categories Overview](01_categories_overview.md) | [Chapter overview](../08_Design_Patterns_Java.md) | [Behavioral Patterns →](03_behavioral_patterns.md)
> Page 2 of 4 in **Design Patterns in Java — Gang of Four & Beyond**


## 4. Adapter — Make Incompatible Interfaces Work Together

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

## 5. Decorator — Add Behavior Dynamically

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

## 6. Facade — Simplify Complex Subsystems

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

## 7. Proxy — Control Access to an Object

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

---

[← Pattern Categories Overview](01_categories_overview.md) | [Chapter overview](../08_Design_Patterns_Java.md) | [Behavioral Patterns →](03_behavioral_patterns.md)
