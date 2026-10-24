# 🎨 Part 4: Common Design Patterns

> **Navigation**: [← SOLID Principles](04_solid_principles.md) | [Chapter overview](../01_OOPS_Principles.md)
> Page 5 of 5 in **OOPS & Design Principles: Complete Guide**


## Creational Patterns

### Singleton - "One Instance Only"

```java
// When you need exactly ONE instance globally
// Examples: Logger, Configuration, Database Connection Pool

public class DatabaseConnection {
    private static DatabaseConnection instance;

    private DatabaseConnection() {
        // Private constructor - can't create from outside
    }

    public static synchronized DatabaseConnection getInstance() {
        if (instance == null) {
            instance = new DatabaseConnection();
        }
        return instance;
    }

    public void connect() { /* ... */ }
}

// Usage:
DatabaseConnection.getInstance().connect();
```

### Factory - "Create Without Knowing Exact Type"

```java
// When you need to create objects but don't know exact type upfront

interface Animal {
    void speak();
}

class Dog implements Animal {
    public void speak() { System.out.println("Woof!"); }
}

class Cat implements Animal {
    public void speak() { System.out.println("Meow!"); }
}

class AnimalFactory {
    public static Animal createAnimal(String type) {
        switch (type.toLowerCase()) {
            case "dog": return new Dog();
            case "cat": return new Cat();
            default: throw new IllegalArgumentException("Unknown animal");
        }
    }
}

// Usage - don't need to know Dog/Cat classes
Animal pet = AnimalFactory.createAnimal("dog");
pet.speak();
```

### Builder - "Complex Object Construction"

```java
// When object has many parameters, some optional

class User {
    private String name;       // required
    private String email;      // required
    private int age;           // optional
    private String address;    // optional
    private String phone;      // optional

    private User(Builder builder) {
        this.name = builder.name;
        this.email = builder.email;
        this.age = builder.age;
        this.address = builder.address;
        this.phone = builder.phone;
    }

    public static class Builder {
        private String name;
        private String email;
        private int age;
        private String address;
        private String phone;

        public Builder(String name, String email) {
            this.name = name;
            this.email = email;
        }

        public Builder age(int age) {
            this.age = age;
            return this;
        }

        public Builder address(String address) {
            this.address = address;
            return this;
        }

        public Builder phone(String phone) {
            this.phone = phone;
            return this;
        }

        public User build() {
            return new User(this);
        }
    }
}

// Usage - readable and flexible!
User user = new User.Builder("John", "john@email.com")
    .age(25)
    .address("123 Main St")
    .build();
```

🔬 **Section Challenge — Creational Patterns**

**Challenge 1 (Debug — Who/When/What):** `DatabaseConnection.getInstance()` is `synchronized`. **Who** pays the performance cost? **When** is synchronization actually needed? **What** optimization exists?

<details><summary>Answer</summary>

**Who pays?** EVERY caller, EVERY call — even after instance exists. **When needed?** Only the FIRST call, when `instance == null`. After that, it's just a field read. **Optimization:** Double-checked locking (first check without lock, then synchronize, check again), or enum approach (`enum DatabasePool { INSTANCE; }`) — JVM guarantees thread-safe lazy init with zero sync overhead.

</details>

## Structural Patterns

### Adapter - "Make Incompatible Compatible"

```java
// Old code uses OldPrinter
interface OldPrinter {
    void printOld(String text);
}

// New code uses NewPrinter
interface NewPrinter {
    void print(String text);
}

class ModernPrinter implements NewPrinter {
    public void print(String text) {
        System.out.println("Modern: " + text);
    }
}

// Adapter makes NewPrinter work where OldPrinter is expected
class PrinterAdapter implements OldPrinter {
    private NewPrinter modernPrinter;

    public PrinterAdapter(NewPrinter printer) {
        this.modernPrinter = printer;
    }

    public void printOld(String text) {
        modernPrinter.print(text);  // Delegate to new printer
    }
}

// Usage:
OldPrinter printer = new PrinterAdapter(new ModernPrinter());
printer.printOld("Hello");  // Works!
```

### Decorator - "Add Behavior Dynamically"

```java
// Add features without modifying original class

interface Coffee {
    double getCost();
    String getDescription();
}

class SimpleCoffee implements Coffee {
    public double getCost() { return 1.0; }
    public String getDescription() { return "Simple coffee"; }
}

// Decorator base
abstract class CoffeeDecorator implements Coffee {
    protected Coffee decoratedCoffee;

    public CoffeeDecorator(Coffee coffee) {
        this.decoratedCoffee = coffee;
    }
}

class MilkDecorator extends CoffeeDecorator {
    public MilkDecorator(Coffee coffee) { super(coffee); }

    public double getCost() { return decoratedCoffee.getCost() + 0.5; }
    public String getDescription() { return decoratedCoffee.getDescription() + ", milk"; }
}

class SugarDecorator extends CoffeeDecorator {
    public SugarDecorator(Coffee coffee) { super(coffee); }

    public double getCost() { return decoratedCoffee.getCost() + 0.2; }
    public String getDescription() { return decoratedCoffee.getDescription() + ", sugar"; }
}

// Usage - combine decorators!
Coffee myCoffee = new SimpleCoffee();
myCoffee = new MilkDecorator(myCoffee);
myCoffee = new SugarDecorator(myCoffee);
System.out.println(myCoffee.getDescription());  // "Simple coffee, milk, sugar"
System.out.println(myCoffee.getCost());         // 1.7
```

🔬 **Section Challenge — Structural Patterns**

**Challenge 1 (Reasoning — Who/When/What):** Both Adapter and Decorator use wrapping. `PrinterAdapter` wraps `NewPrinter`; `MilkDecorator` wraps `Coffee`. **What** is the fundamental difference in intent?

<details><summary>Answer</summary>

**Adapter:** Changes the INTERFACE without changing BEHAVIOR. `PrinterAdapter` doesn't add printing capability — it translates `printOld()` → `print()`. **Decorator:** Preserves the INTERFACE but changes BEHAVIOR. `MilkDecorator` keeps `Coffee` interface but ADDS extra cost. Key test: Does it add new functionality? Decorator. Does it just translate APIs? Adapter.

</details>

## Behavioral Patterns

### Strategy - "Swappable Algorithms"

```java
// Change algorithm at runtime

interface PaymentStrategy {
    void pay(double amount);
}

class CreditCardPayment implements PaymentStrategy {
    public void pay(double amount) {
        System.out.println("Paid " + amount + " via Credit Card");
    }
}

class PayPalPayment implements PaymentStrategy {
    public void pay(double amount) {
        System.out.println("Paid " + amount + " via PayPal");
    }
}

class ShoppingCart {
    private PaymentStrategy paymentStrategy;

    public void setPaymentStrategy(PaymentStrategy strategy) {
        this.paymentStrategy = strategy;
    }

    public void checkout(double amount) {
        paymentStrategy.pay(amount);
    }
}

// Usage - change payment method easily!
ShoppingCart cart = new ShoppingCart();
cart.setPaymentStrategy(new CreditCardPayment());
cart.checkout(100.0);  // Pays via Credit Card

cart.setPaymentStrategy(new PayPalPayment());
cart.checkout(50.0);   // Pays via PayPal
```

### Observer - "Notify When Something Changes"

```java
// When many objects need to know about state changes

interface Observer {
    void update(String message);
}

interface Subject {
    void attach(Observer observer);
    void detach(Observer observer);
    void notifyObservers();
}

class NewsAgency implements Subject {
    private List<Observer> observers = new ArrayList<>();
    private String news;

    public void attach(Observer observer) {
        observers.add(observer);
    }

    public void detach(Observer observer) {
        observers.remove(observer);
    }

    public void notifyObservers() {
        for (Observer observer : observers) {
            observer.update(news);
        }
    }

    public void publishNews(String news) {
        this.news = news;
        notifyObservers();  // All subscribers get notified!
    }
}

class Subscriber implements Observer {
    private String name;

    public Subscriber(String name) { this.name = name; }

    public void update(String message) {
        System.out.println(name + " received: " + message);
    }
}

// Usage:
NewsAgency agency = new NewsAgency();
agency.attach(new Subscriber("Alice"));
agency.attach(new Subscriber("Bob"));
agency.publishNews("Breaking: Java 21 released!");
// Alice received: Breaking: Java 21 released!
// Bob received: Breaking: Java 21 released!
```

---

🔬 **Section Challenge — Behavioral Patterns**

**Challenge 1 (Debug — Who/When/What):** In the Observer example, `publishNews()` iterates the observers list. **What** happens if one subscriber's `update()` throws? Do remaining subscribers get notified? **Who** should handle errors?

<details><summary>Answer</summary>

**What happens?** The loop terminates at the failing observer — all subscribers AFTER it never get notified. **Who handles?** The Subject. Fix: wrap each call in try-catch: `try { observer.update(news); } catch (Exception e) { log.error(e); }`. **Bonus bug:** Memory leak — if you `attach()` but forget `detach()`, the Subject holds a strong reference → observer can't be GC'd. Use `WeakReference<Observer>` or ensure `detach()` in lifecycle cleanup.

</details>

## 📌 Part 5: When to Use What

| Need                                   | Use                     |
| -------------------------------------- | ----------------------- |
| Share code between classes             | Composition (HAS-A)     |
| True "is-a" relationship               | Inheritance (sparingly) |
| Multiple variations of algorithm       | Strategy Pattern        |
| Add behavior dynamically               | Decorator Pattern       |
| One global instance                    | Singleton               |
| Create objects without knowing type    | Factory                 |
| Complex object construction            | Builder                 |
| Make incompatible things work together | Adapter                 |
| React to state changes                 | Observer                |
| Undo operations                        | Command Pattern         |

---

## 💪 Part 6: Practice Questions

1. Design a parking lot system
2. Design a library management system
3. Design a vending machine
4. Design a chess game
5. Design an elevator system

For each, think about:

- What are the main entities (classes)?
- What relationships exist (is-a vs has-a)?
- What behaviors can change (strategy pattern)?
- What needs to be notified of changes (observer)?

---

[← SOLID Principles](04_solid_principles.md) | [Chapter overview](../01_OOPS_Principles.md)
