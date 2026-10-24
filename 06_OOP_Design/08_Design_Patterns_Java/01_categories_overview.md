# Pattern Categories Overview

> **Navigation**: [Chapter overview](../08_Design_Patterns_Java.md) | [Structural Patterns →](02_structural_patterns.md)
> Page 1 of 4 in **Design Patterns in Java — Gang of Four & Beyond**


## Historical Evolution

Design patterns as a named discipline began with **Christopher Alexander's _A Pattern Language_ (1977)**, which described recurring design problems in architecture as named patterns with context, forces and a solution. **Kent Beck and Ward Cunningham carried the idea to software in 1987** ("Using Pattern Languages for Object-Oriented Programs", OOPSLA '87). **The Gang of Four (Gamma, Helm, Johnson, Vlissides) published _Design Patterns: Elements of Reusable Object-Oriented Software_ in 1994**, cataloguing 23 patterns in three categories (5 creational, 7 structural, 11 behavioural); it became the shared vocabulary. **POSA volume 1 (Buschmann et al., 1996)** added architectural patterns, and **POSA volume 2 (Schmidt et al., 2000)** added concurrency and networking patterns such as Reactor, which underlie servers like Netty. **Joshua Bloch's _Effective Java_ (Item 3)** recommends a single-element enum as the preferred Singleton in Java because the JVM guarantees one instance even under serialization and reflection. Later catalogues applied the idea at larger scales: Fowler's _Patterns of Enterprise Application Architecture_ (2002), Nygard's circuit breaker in _Release It!_ (2007), and the service-level patterns in Newman's _Building Microservices_ (2015).

| Creational (5): how objects are **created** | Structural (7): how objects are **composed** | Behavioural (11): how objects **communicate** |
| --- | --- | --- |
| Singleton ★ | Adapter ★ | Strategy ★ |
| Factory Method ★ | Decorator ★ | Observer ★ |
| Abstract Factory | Facade ★ | Template Method ★ |
| Builder ★ | Proxy ★ | Iterator |
| Prototype | Composite | Command |
| | Bridge | Chain of Responsibility ★ |
| | Flyweight | State |
| | | Mediator |
| | | Memento |
| | | Visitor |
| | | Interpreter |

★ = most commonly asked in interviews and used in practice.


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

```text
PROBLEM: Need to create objects without specifying exact class.
ANALOGY: You order "a pizza" — the kitchen decides which type.
USE: When a class can't anticipate which objects to create.
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

```text
PROBLEM: Constructor with too many parameters (telescoping).
ANALOGY: Ordering a customized burger — pick each component.
USE: Objects with many optional fields (HttpRequest, User, etc.)
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

---

[Chapter overview](../08_Design_Patterns_Java.md) | [Structural Patterns →](02_structural_patterns.md)
