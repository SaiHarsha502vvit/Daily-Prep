# 49. Java Enums, Records & Sealed Classes — Advanced Usage Deep Dive

**Navigation**: [< Events & Listeners](Ch11_Events_Listeners.md) | [Back to Index](../00_MASTER_INDEX.md) | [DateTime & Regex >](Ch05_DateTime_Regex.md)

---

## 🎯 The 5W1H Framework

```
╔══════════════════════════════════════════════════════════════════╗
║  WHAT = Enums, Records, Sealed Classes are type-safe constructs  ║
║         that model your domain more precisely than plain classes ║
║                                                                  ║
║  WHY  = Replace magic strings, reduce boilerplate, make illegal  ║
║         states unrepresentable, enable exhaustive pattern match  ║
║                                                                  ║
║  WHEN = Enums: fixed set of constants with behavior              ║
║         Records: immutable data carriers (DTOs, events, keys)    ║
║         Sealed: controlled inheritance hierarchies               ║
║                                                                  ║
║  WHERE = Domain modeling, API responses, state machines,         ║
║          configuration, pattern matching, type-safe design       ║
╚══════════════════════════════════════════════════════════════════╝
```

---

## PART 1: ENUMS — Beyond Simple Constants

---

## 1. Enum Basics — What Most People Know

```java
// Level 1: Simple constants (what 90% of devs do)
public enum Status {
    ACTIVE, INACTIVE, PENDING;
}

// Usage
Status s = Status.ACTIVE;
String name = s.name();      // "ACTIVE"
int order = s.ordinal();     // 0
Status parsed = Status.valueOf("ACTIVE");  // From string
Status[] all = Status.values();            // All values
```

But enums are MUCH more powerful...

---

## 2. Enums WITH Fields and Methods

```java
public enum HttpStatus {
    OK(200, "Success"),
    CREATED(201, "Resource Created"),
    BAD_REQUEST(400, "Bad Request"),
    UNAUTHORIZED(401, "Not Authenticated"),
    FORBIDDEN(403, "Not Authorized"),
    NOT_FOUND(404, "Resource Not Found"),
    INTERNAL_ERROR(500, "Server Error");
    
    private final int code;
    private final String message;
    
    // Constructor MUST be private (or package-private)
    HttpStatus(int code, String message) {
        this.code = code;
        this.message = message;
    }
    
    public int getCode() { return code; }
    public String getMessage() { return message; }
    
    public boolean isSuccess() { return code >= 200 && code < 300; }
    public boolean isClientError() { return code >= 400 && code < 500; }
    public boolean isServerError() { return code >= 500; }
    
    // Reverse lookup: code → enum
    private static final Map<Integer, HttpStatus> BY_CODE = 
        Arrays.stream(values())
              .collect(Collectors.toMap(HttpStatus::getCode, s -> s));
    
    public static HttpStatus fromCode(int code) {
        return Optional.ofNullable(BY_CODE.get(code))
            .orElseThrow(() -> new IllegalArgumentException("Unknown: " + code));
    }
}

// Usage
HttpStatus status = HttpStatus.fromCode(404);
System.out.println(status.getMessage());  // "Resource Not Found"
System.out.println(status.isClientError());  // true
```

---

## 3. Enums WITH Abstract Methods — Strategy Pattern

```java
// Each enum constant provides its OWN implementation
public enum Operation {
    ADD("+") {
        @Override
        public double apply(double a, double b) { return a + b; }
    },
    SUBTRACT("-") {
        @Override
        public double apply(double a, double b) { return a - b; }
    },
    MULTIPLY("*") {
        @Override
        public double apply(double a, double b) { return a * b; }
    },
    DIVIDE("/") {
        @Override
        public double apply(double a, double b) {
            if (b == 0) throw new ArithmeticException("Division by zero");
            return a / b;
        }
    };
    
    private final String symbol;
    
    Operation(String symbol) { this.symbol = symbol; }
    
    public String getSymbol() { return symbol; }
    
    // Abstract method — each constant MUST implement
    public abstract double apply(double a, double b);
}

// Usage — no if-else or switch needed!
Operation op = Operation.ADD;
double result = op.apply(10, 3);  // 13.0
System.out.println(op.getSymbol());  // "+"
```

---



## 4. Enum as State Machine

```java
public enum OrderState {
    PENDING {
        @Override
        public OrderState next() { return CONFIRMED; }
        @Override
        public boolean canCancel() { return true; }
    },
    CONFIRMED {
        @Override
        public OrderState next() { return SHIPPED; }
        @Override
        public boolean canCancel() { return true; }
    },
    SHIPPED {
        @Override
        public OrderState next() { return DELIVERED; }
        @Override
        public boolean canCancel() { return false; }
    },
    DELIVERED {
        @Override
        public OrderState next() { throw new IllegalStateException("Final state"); }
        @Override
        public boolean canCancel() { return false; }
    },
    CANCELLED {
        @Override
        public OrderState next() { throw new IllegalStateException("Final state"); }
        @Override
        public boolean canCancel() { return false; }
    };
    
    public abstract OrderState next();
    public abstract boolean canCancel();
    
    public OrderState cancel() {
        if (!canCancel()) {
            throw new IllegalStateException("Cannot cancel from " + this);
        }
        return CANCELLED;
    }
}

// Usage
OrderState state = OrderState.PENDING;
state = state.next();      // CONFIRMED
state = state.next();      // SHIPPED
state.canCancel();          // false
state = state.next();      // DELIVERED
// state.cancel();          // throws IllegalStateException
```

```
State Machine:
┌─────────┐     ┌───────────┐     ┌─────────┐     ┌───────────┐
│ PENDING │────→│ CONFIRMED │────→│ SHIPPED │────→│ DELIVERED │
└────┬────┘     └─────┬─────┘     └─────────┘     └───────────┘
     │                │
     └────────┬───────┘
              ↓
        ┌───────────┐
        │ CANCELLED │
        └───────────┘
```

---



🔬 **Section Challenge — 4. Enum as State Machine**

**Challenge 1 (Reasoning):** Why is a Java `Record` vastly superior to a standard Java Class for DTOs (Data Transfer Objects)?
<details><summary>Answer</summary>

Immutability and Boilerplate Elimination. A `Record` is a specialized class designed specifically as a transparent carrier of immutable data. By simply defining `public record UserDTO(String name, int age) {}`, the compiler automatically generates the constructor, getters, `equals()`, `hashCode()`, and `toString()`. Furthermore, because all fields are `final`, a Record is inherently thread-safe and guarantees the integrity of data passing between application layers.
</details>


## 5. Enum Singleton Pattern — Thread-Safe by JVM Guarantee

```java
// The SIMPLEST and SAFEST singleton in Java
public enum DatabaseConnection {
    INSTANCE;
    
    private Connection connection;
    
    // Called once when enum is first loaded
    DatabaseConnection() {
        // Initialize your resource
        this.connection = createConnection();
    }
    
    public Connection getConnection() {
        return connection;
    }
    
    private Connection createConnection() {
        // ... setup connection
        return null;
    }
}

// Usage
Connection conn = DatabaseConnection.INSTANCE.getConnection();
```

```
Why enum singleton is BEST:
┌────────────────────────────────────────────────────────┐
│ ✅ Thread-safe — JVM guarantees single instantiation   │
│ ✅ Reflection-safe — can't create via reflection       │
│ ✅ Serialization-safe — JVM handles automatically      │
│ ✅ Lazy — loaded when first accessed                   │
│ ✅ Simple — no boilerplate code needed                 │
│                                                        │
│ Compare to traditional singleton:                      │
│ ❌ Double-checked locking = complex, error-prone       │
│ ❌ Reflection can break it                             │
│ ❌ Serialization can break it                          │
└────────────────────────────────────────────────────────┘
```

---



🔬 **Section Challenge — 5. Enum Singleton Pattern — Thread-Safe by JVM Guarantee**

**Challenge 1 (Reasoning):** Why is a Java `Record` vastly superior to a standard Java Class for DTOs (Data Transfer Objects)?
<details><summary>Answer</summary>

Immutability and Boilerplate Elimination. A `Record` is a specialized class designed specifically as a transparent carrier of immutable data. By simply defining `public record UserDTO(String name, int age) {}`, the compiler automatically generates the constructor, getters, `equals()`, `hashCode()`, and `toString()`. Furthermore, because all fields are `final`, a Record is inherently thread-safe and guarantees the integrity of data passing between application layers.
</details>


## 6. EnumSet and EnumMap — Specialized Collections

```java
// EnumSet — FASTEST Set for enums (bit vector internally)
EnumSet<Permission> adminPerms = EnumSet.of(
    Permission.READ, Permission.WRITE, Permission.DELETE, Permission.ADMIN
);

EnumSet<Permission> readOnly = EnumSet.of(Permission.READ);
EnumSet<Permission> allPerms = EnumSet.allOf(Permission.class);
EnumSet<Permission> noPerms = EnumSet.noneOf(Permission.class);

// Check permission
if (adminPerms.contains(Permission.DELETE)) { ... }

// EnumMap — FASTEST Map with enum keys (array internally)
EnumMap<Day, String> schedule = new EnumMap<>(Day.class);
schedule.put(Day.MONDAY, "DSA Practice");
schedule.put(Day.TUESDAY, "Spring Boot");
schedule.put(Day.WEDNESDAY, "System Design");
```

```
Performance:
┌─────────────────────────────────────────────────┐
│ EnumSet : uses bit vector (1 long = 64 enums)   │
│           → contains() is O(1) bit check        │
│           → add/remove is O(1) bit flip         │
│           → 10x faster than HashSet<Enum>       │
│                                                 │
│ EnumMap : uses plain array indexed by ordinal   │
│           → get/put is O(1) array access        │
│           → 5x faster than HashMap<Enum, V>     │
│                                                 |
│ ALWAYS use EnumSet/EnumMap for enum collections!│
└─────────────────────────────────────────────────┘
```

---

## 7. Enum Internals — What the Compiler Creates

```java
// What YOU write:
public enum Color { RED, GREEN, BLUE; }

// What the COMPILER generates (simplified):
public final class Color extends Enum<Color> {
    public static final Color RED = new Color("RED", 0);
    public static final Color GREEN = new Color("GREEN", 1);
    public static final Color BLUE = new Color("BLUE", 2);
    
    private static final Color[] VALUES = { RED, GREEN, BLUE };
    
    private Color(String name, int ordinal) {
        super(name, ordinal);
    }
    
    public static Color[] values() {
        return VALUES.clone();  // ← defensive copy!
    }
    
    public static Color valueOf(String name) {
        // lookup by name
    }
}

// Key facts:
// → Enum extends java.lang.Enum (can't extend anything else)
// → Each constant is a public static final INSTANCE
// → Constructor is always private
// → values() returns a CLONE (creates array each call!)
```

**⚠️ Performance Note**: `values()` creates a new array every call.
If you call it in a loop, cache the result:
```java
private static final Color[] VALUES = Color.values(); // Cache once
```

---



🔬 **Section Challenge — 7. Enum Internals — What the Compiler Creates**

**Challenge 1 (Reasoning):** Why is a Java `Record` vastly superior to a standard Java Class for DTOs (Data Transfer Objects)?
<details><summary>Answer</summary>

Immutability and Boilerplate Elimination. A `Record` is a specialized class designed specifically as a transparent carrier of immutable data. By simply defining `public record UserDTO(String name, int age) {}`, the compiler automatically generates the constructor, getters, `equals()`, `hashCode()`, and `toString()`. Furthermore, because all fields are `final`, a Record is inherently thread-safe and guarantees the integrity of data passing between application layers.
</details>


## PART 2: RECORDS — Immutable Data Carriers (Java 16+)

---

## 8. Records Basics — What They Replace

```java
// BEFORE Records — 50+ lines for a simple data class:
public class User {
    private final String name;
    private final String email;
    private final int age;
    
    public User(String name, String email, int age) {
        this.name = name;
        this.email = email;
        this.age = age;
    }
    
    public String getName() { return name; }
    public String getEmail() { return email; }
    public int getAge() { return age; }
    
    @Override
    public boolean equals(Object o) { ... }
    @Override
    public int hashCode() { ... }
    @Override
    public String toString() { ... }
}

// WITH Records — 1 line:
public record User(String name, String email, int age) {}
```

### What the Compiler Generates for a Record

```
record User(String name, String email, int age) {}

GENERATES:
┌────────────────────────────────────────────────┐
│ ✅ private final fields: name, email, age      │
│ ✅ Constructor with ALL fields                  │
│ ✅ Accessor methods: name(), email(), age()     │
│    (NOT getName() — just name()!)              │
│ ✅ equals() using ALL fields                    │
│ ✅ hashCode() using ALL fields                  │
│ ✅ toString() with ALL fields                   │
│ ✅ Implements Serializable (if needed)          │
└────────────────────────────────────────────────┘
```

---

## 9. Record Features — Beyond Basic

### Compact Constructor (Validation)

```java
public record User(String name, String email, int age) {
    // Compact constructor — no explicit parameter assignment needed
    public User {
        // Validation happens HERE, assignment happens AUTOMATICALLY after
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Name required");
        }
        if (age < 0 || age > 150) {
            throw new IllegalArgumentException("Invalid age: " + age);
        }
        // Normalization
        name = name.trim();
        email = email.toLowerCase().trim();
    }
}

new User("Harsha", "H@Mail.com", 25);
// name = "Harsha", email = "h@mail.com", age = 25

new User("", "h@mail.com", 25);
// throws IllegalArgumentException: Name required
```

### Custom Methods

```java
public record Point(double x, double y) {
    // You CAN add methods
    public double distanceTo(Point other) {
        double dx = this.x - other.x;
        double dy = this.y - other.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    // Static factory methods
    public static Point origin() {
        return new Point(0, 0);
    }
    
    // You CAN implement interfaces
    // Records CAN'T extend classes (they already extend Record)
}
```

### Records as Map Keys and in Collections

```java
// Records make PERFECT Map keys (equals + hashCode auto-generated)
record Coordinate(int row, int col) {}

Map<Coordinate, String> grid = new HashMap<>();
grid.put(new Coordinate(0, 0), "Start");
grid.put(new Coordinate(5, 5), "Treasure");

// Two different Coordinate objects with same values are EQUAL
grid.get(new Coordinate(0, 0));  // "Start" ← works perfectly!
```

---

## 10. Record Restrictions — What You CAN'T Do

```
┌──────────────────────────────────────────────────────────────┐
│ ❌ Can't extend a class (records extend Record implicitly)    │
│ ❌ Can't be extended (records are final)                      │
│ ❌ Can't have mutable state (fields are final)                │
│ ❌ Can't add instance fields beyond components                │
│                                                               │
│ ✅ CAN implement interfaces                                   │
│ ✅ CAN have static fields and methods                         │
│ ✅ CAN have instance methods                                  │
│ ✅ CAN override auto-generated methods                        │
│ ✅ CAN have compact/custom constructors                       │
│ ✅ CAN be generic: record Pair<A, B>(A first, B second) {}    │
│ ✅ CAN be nested/inner classes                                │
│ ✅ CAN be sealed class members                                │
└──────────────────────────────────────────────────────────────┘
```

### When to Use Records vs Classes

```
USE RECORD:
  → DTOs (Data Transfer Objects)
  → API request/response bodies
  → Event objects
  → Configuration values
  → Map keys / Set elements
  → Value types (Money, Coordinate, Range)
  → Pattern matching carriers

USE CLASS:
  → Mutable state (entities with setters)
  → Complex behavior with internal state
  → Inheritance hierarchies
  → Builder pattern objects
  → When you need custom equals/hashCode logic
```

---

## 11. Records with Jackson, JPA, and Spring

```java
// Records with Jackson (Spring REST)
public record CreateUserRequest(
    @NotBlank String name,
    @Email String email,
    @Min(18) int age
) {}

@PostMapping("/users")
public ResponseEntity<UserResponse> createUser(@Valid @RequestBody CreateUserRequest request) {
    // request.name(), request.email(), request.age()
    User user = userService.create(request);
    return ResponseEntity.ok(new UserResponse(user.getId(), user.getName()));
}

public record UserResponse(Long id, String name) {}
```

```
⚠️ Records with JPA:
┌────────────────────────────────────────────────────────────┐
│ Records CANNOT be JPA @Entity (entities need mutable state)│
│                                                            │
│ BUT they're perfect for:                                   │
│ ✅ @Query projections:                                     │
│    record UserSummary(String name, Long orderCount) {}     │
│    @Query("SELECT new ...UserSummary(u.name, COUNT(o))..") │
│                                                            │
│ ✅ DTOs for API responses                                  │
│ ✅ Value objects inside entities (with @Embeddable adapter) │
└────────────────────────────────────────────────────────────┘
```

---



🔬 **Section Challenge — 11. Records with Jackson, JPA, and Spring**

**Challenge 1 (Reasoning):** Why is a Java `Record` vastly superior to a standard Java Class for DTOs (Data Transfer Objects)?
<details><summary>Answer</summary>

Immutability and Boilerplate Elimination. A `Record` is a specialized class designed specifically as a transparent carrier of immutable data. By simply defining `public record UserDTO(String name, int age) {}`, the compiler automatically generates the constructor, getters, `equals()`, `hashCode()`, and `toString()`. Furthermore, because all fields are `final`, a Record is inherently thread-safe and guarantees the integrity of data passing between application layers.
</details>


## PART 3: SEALED CLASSES — Controlled Inheritance (Java 17+)

---



🔬 **Section Challenge — PART 3: SEALED CLASSES — Controlled Inheritance (Java 17+)**

**Challenge 1 (Reasoning):** Why is a Java `Record` vastly superior to a standard Java Class for DTOs (Data Transfer Objects)?
<details><summary>Answer</summary>

Immutability and Boilerplate Elimination. A `Record` is a specialized class designed specifically as a transparent carrier of immutable data. By simply defining `public record UserDTO(String name, int age) {}`, the compiler automatically generates the constructor, getters, `equals()`, `hashCode()`, and `toString()`. Furthermore, because all fields are `final`, a Record is inherently thread-safe and guarantees the integrity of data passing between application layers.
</details>


## 12. Sealed Classes — The Problem They Solve

```
BEFORE SEALED:
┌────────────────────────────────────────────────────────┐
│ public abstract class Shape { }                        │
│                                                        │
│ Anyone, anywhere can extend Shape:                     │
│ class Circle extends Shape { }    ← You know this      │
│ class Square extends Shape { }    ← You know this      │
│ class WeirdShape extends Shape {} ← Surprise!          │
│                                                        │
│ Your switch/if can't be exhaustive because             │
│ you don't control who extends Shape                    │
└────────────────────────────────────────────────────────┘

AFTER SEALED:
┌────────────────────────────────────────────────────────┐
│ public sealed class Shape                              │
│     permits Circle, Rectangle, Triangle { }            │
│                                                        │
│ ONLY Circle, Rectangle, Triangle can extend Shape      │
│ class WeirdShape extends Shape {} ← COMPILE ERROR!     │
│                                                        │
│ Compiler KNOWS all subtypes → exhaustive matching!     │
└────────────────────────────────────────────────────────┘
```

### Syntax

```java
// Sealed parent — declares which classes can extend
public sealed class Shape permits Circle, Rectangle, Triangle {
    public abstract double area();
}

// Permitted subclasses must be: final, sealed, or non-sealed
public final class Circle extends Shape {
    private final double radius;
    
    public Circle(double radius) { this.radius = radius; }
    
    @Override
    public double area() { return Math.PI * radius * radius; }
}

public final class Rectangle extends Shape {
    private final double width, height;
    
    public Rectangle(double width, double height) {
        this.width = width;
        this.height = height;
    }
    
    @Override
    public double area() { return width * height; }
}

public final class Triangle extends Shape {
    private final double base, height;
    
    public Triangle(double base, double height) {
        this.base = base;
        this.height = height;
    }
    
    @Override
    public double area() { return 0.5 * base * height; }
}
```

---

## 13. Pattern Matching with Sealed Classes (Java 21+)

```java
// Because compiler KNOWS all subtypes, switch can be EXHAUSTIVE
public static String describe(Shape shape) {
    return switch (shape) {
        case Circle c    -> "Circle with radius " + c.getRadius();
        case Rectangle r -> "Rectangle " + r.getWidth() + "x" + r.getHeight();
        case Triangle t  -> "Triangle with base " + t.getBase();
        // No default needed! Compiler knows these are ALL possibilities
    };
}

// With guarded patterns
public static String classify(Shape shape) {
    return switch (shape) {
        case Circle c when c.getRadius() > 100 -> "Large circle";
        case Circle c                           -> "Small circle";
        case Rectangle r when r.getWidth() == r.getHeight() -> "Square!";
        case Rectangle r                        -> "Rectangle";
        case Triangle t                         -> "Triangle";
    };
}
```

---



🔬 **Section Challenge — 13. Pattern Matching with Sealed Classes (Java 21+)**

**Challenge 1 (Reasoning):** Why is a Java `Record` vastly superior to a standard Java Class for DTOs (Data Transfer Objects)?
<details><summary>Answer</summary>

Immutability and Boilerplate Elimination. A `Record` is a specialized class designed specifically as a transparent carrier of immutable data. By simply defining `public record UserDTO(String name, int age) {}`, the compiler automatically generates the constructor, getters, `equals()`, `hashCode()`, and `toString()`. Furthermore, because all fields are `final`, a Record is inherently thread-safe and guarantees the integrity of data passing between application layers.
</details>


## 14. Sealed Interfaces + Records = Algebraic Data Types

```java
// The MOST POWERFUL combo in modern Java
public sealed interface Result<T> {
    record Success<T>(T value) implements Result<T> {}
    record Failure<T>(String error, Exception cause) implements Result<T> {}
}

// Usage
public Result<User> findUser(Long id) {
    try {
        User user = repository.findById(id).orElse(null);
        if (user == null) {
            return new Result.Failure<>("User not found", null);
        }
        return new Result.Success<>(user);
    } catch (Exception e) {
        return new Result.Failure<>("Database error", e);
    }
}

// Pattern match the result
Result<User> result = findUser(42L);
switch (result) {
    case Result.Success<User> s -> System.out.println("Found: " + s.value().getName());
    case Result.Failure<User> f -> System.err.println("Error: " + f.error());
}
```

### More Examples: Domain Modeling

```java
// Payment method — only these types exist
public sealed interface PaymentMethod {
    record CreditCard(String number, String expiry, String cvv) implements PaymentMethod {}
    record BankTransfer(String iban, String bic) implements PaymentMethod {}
    record DigitalWallet(String walletId, WalletType type) implements PaymentMethod {}
    
    enum WalletType { PAYPAL, GOOGLE_PAY, APPLE_PAY }
}

// Process payment — compiler ensures ALL types handled
public double processPayment(PaymentMethod method, double amount) {
    return switch (method) {
        case CreditCard cc     -> chargeCard(cc, amount);
        case BankTransfer bt   -> transferFromBank(bt, amount);
        case DigitalWallet dw  -> chargeWallet(dw, amount);
    };
}
```

```java
// API response — type-safe union
public sealed interface ApiResponse<T> {
    record Ok<T>(T data, int statusCode) implements ApiResponse<T> {}
    record Error<T>(String message, int statusCode, List<String> details) 
        implements ApiResponse<T> {}
    record Loading<T>() implements ApiResponse<T> {}
}
```

---



🔬 **Section Challenge — 14. Sealed Interfaces + Records = Algebraic Data Types**

**Challenge 1 (Debug — Who/When/What):** You have a `sealed interface Shape permits Circle, Rectangle, Triangle`. A `switch(shape)` expression covers only `Circle` and `Rectangle`. **Who** detects the missing case? **When?** **What** error is thrown?\n\n<details><summary>Answer</summary>\n\n**Who detects?** The Java compiler (`javac`) at compile time. Sealed classes make the set of permitted subtypes KNOWN at compile time — the compiler can check switch exhaustiveness. **When?** During compilation, before the code ever runs. **Error:** `compile error: the switch expression does not cover all possible input values` — specifically naming `Triangle` as unhandled. **Why this matters:** Without sealed, you'd need a `default` case and could only get runtime failures. With sealed + pattern matching, you get compile-time exhaustiveness checking — the compiler FORCES you to handle every subtype. If you add `Diamond` to the sealed hierarchy later, every switch breaks at compile time — no silent bugs.\n\n</details>

**Challenge 2 (Bug Hunt):** A method returns `(T) jsonDeserialize(json)` where T is a generic type param. When does the `ClassCastException` actually occur?
<details><summary>Answer</summary>

NOT at the cast — the unchecked cast compiles to nothing at runtime (erasure). The CCE occurs when the calling code tries to USE the returned value as a specific type. This makes debugging hard: the error appears far from the actual source. Use `Class<T> clazz` parameter to do safe `clazz.cast(...)` instead.
</details>


## 15. The Three Keywords Comparison

```
┌────────────────────────────────────────────────────────────────┐
│ KEYWORD     │ MEANING                │ WHAT SUBCLASS DOES      │
│─────────────│────────────────────────│─────────────────────────│
│ final       │ NO further subclassing │ "The chain ends here"    │
│ sealed      │ RESTRICTED subclassing │ "Only these can extend"  │
│ non-sealed  │ OPEN subclassing again │ "Anyone can extend me"   │
│─────────────│────────────────────────│─────────────────────────│
│                                                                │
│ Example:                                                       │
│ sealed class A permits B, C, D { }                             │
│                                                                │
│ final class B extends A { }          // B can't be extended    │
│ sealed class C extends A permits E { } // C allows only E     │
│ non-sealed class D extends A { }     // D opens hierarchy      │
│ class E extends C { }                // E extends sealed C     │
│ class F extends D { }                // F can extend D (open)  │
│ class G extends A { }                // ❌ COMPILE ERROR!      │
└────────────────────────────────────────────────────────────────┘
```

---

## 16. Putting It All Together — Complete Domain Model

```java
// Modern Java domain modeling using all three features:

// State machine with enum
public enum OrderStatus {
    PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED;
    
    public boolean isFinal() {
        return this == DELIVERED || this == CANCELLED;
    }
}

// Sealed type hierarchy for payment
public sealed interface Payment permits 
    Payment.CardPayment, Payment.CashPayment, Payment.OnlinePayment {
    
    double amount();
    
    record CardPayment(String cardNumber, double amount) implements Payment {}
    record CashPayment(double amount, double change) implements Payment {}
    record OnlinePayment(String provider, String transactionId, double amount) 
        implements Payment {}
}

// Record for immutable data
public record OrderItem(String productId, String name, int quantity, double price) {
    public OrderItem {
        if (quantity <= 0) throw new IllegalArgumentException("Quantity must be positive");
        if (price < 0) throw new IllegalArgumentException("Price can't be negative");
    }
    
    public double total() {
        return quantity * price;
    }
}

// Using everything together
public class OrderProcessor {
    
    public String processPayment(Payment payment) {
        return switch (payment) {
            case Payment.CardPayment cp -> 
                "Charging card ending in " + cp.cardNumber().substring(cp.cardNumber().length() - 4);
            case Payment.CashPayment cash -> 
                String.format("Cash: $%.2f, Change: $%.2f", cash.amount(), cash.change());
            case Payment.OnlinePayment op -> 
                "Online via " + op.provider() + " (TX: " + op.transactionId() + ")";
        };
    }
}
```

---



🔬 **Section Challenge — 16. Putting It All Together — Complete Domain Model**

**Challenge 1 (Reasoning):** Why is a Java `Record` vastly superior to a standard Java Class for DTOs (Data Transfer Objects)?
<details><summary>Answer</summary>

Immutability and Boilerplate Elimination. A `Record` is a specialized class designed specifically as a transparent carrier of immutable data. By simply defining `public record UserDTO(String name, int age) {}`, the compiler automatically generates the constructor, getters, `equals()`, `hashCode()`, and `toString()`. Furthermore, because all fields are `final`, a Record is inherently thread-safe and guarantees the integrity of data passing between application layers.
</details>


## 17. Interview Questions & Answers

**Q: Can an enum have a constructor? What's the restriction?**
Yes, but it must be private (or package-private). You can't create enum instances with `new`. The JVM creates them when the enum class loads.

**Q: How would you implement a thread-safe singleton?**
Use an enum singleton. JVM guarantees single instantiation. It's safe against reflection, serialization, and threading attacks.

**Q: What's the difference between enum `values()` and `valueOf()`?**
`values()` returns an array of all constants (creates a new array each call — cache it!). `valueOf(String)` converts a string to the enum constant (throws IllegalArgumentException if not found).

**Q: What are records for? Can they be JPA entities?**
Records are immutable data carriers — auto-generated constructor, accessors, equals/hashCode/toString. They CANNOT be JPA entities (need mutable state + no-arg constructor). Use them for DTOs, events, query projections.

**Q: What does 'sealed' mean and why use it?**
Sealed restricts which classes can extend/implement. It enables exhaustive switch expressions — the compiler knows all subtypes and verifies you handle each one. No default case needed.

**Q: What's an Algebraic Data Type in Java?**
A sealed interface + records. Like `sealed interface Result<T> { record Success<T>(T value) implements Result<T> {} record Failure<T>(String error) implements Result<T> {} }`. The compiler ensures you handle both cases.

---

**Key Takeaway**: Modern Java (16-21) gives you `enum` for fixed constants 
with behavior, `record` for immutable data, and `sealed` for controlled 
hierarchies. Combined with pattern matching, they eliminate entire categories 
of bugs by making illegal states unrepresentable.

**Navigation**: [< Events & Listeners](Ch11_Events_Listeners.md) | [Back to Index](../00_MASTER_INDEX.md) | [DateTime & Regex >](Ch05_DateTime_Regex.md)
