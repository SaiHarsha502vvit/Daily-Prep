# 🏗️ OOPS & Design Principles: Complete Guide

## Building Software That Lasts

---

# PART 0: COMPLETE UNDERSTANDING OF OOP

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                 OBJECT-ORIENTED PROGRAMMING - COMPLETE UNDERSTANDING          ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHAT IS OOP?                                                                 │
├──────────────────────────────────────────────────────────────────────────────┤
│ OOP is a programming PARADIGM (way of thinking) where software is organized │
│ around "objects" - bundles of related DATA (attributes) and BEHAVIOR         │
│ (methods) that represent real-world entities or concepts.                    │
│                                                                              │
│ KEY INSIGHT: OOP isn't about "classes and objects" - it's about              │
│ MANAGING COMPLEXITY through organization and abstraction.                    │
│                                                                              │
│ HISTORICAL EVOLUTION:                                                        │
│ • 1960s: Simula (Norway) - First OOP language for simulations               │
│ • 1970s: Smalltalk (Xerox PARC) - Pure OOP, introduced GUI                  │
│ • 1980s: C++ (Bjarne Stroustrup) - Added OOP to C                           │
│ • 1995: Java (Sun) - "Write once, run anywhere", pure OOP mainstream        │
│ • Today: Python, JavaScript, Kotlin all support OOP                          │
│                                                                              │
│ PARADIGM EVOLUTION:                                                          │
│ Machine Code → Assembly → Procedural → OOP → Functional → Hybrid            │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHAT PROBLEM DOES OOP SOLVE?                                                 │
├──────────────────────────────────────────────────────────────────────────────┤
│ CORE PROBLEM: As software grows, complexity grows EXPONENTIALLY              │
│                                                                              │
│ PROCEDURAL PROGRAMMING (Before OOP):                                         │
│ ┌─────────────────────────────────────────────────────────────────┐         │
│ │ Data here ──────► Functions there ──────► More data somewhere   │         │
│ │                      ↓                        ↓                  │         │
│ │                 More functions ◄──────► Even more data          │         │
│ │                                                                  │         │
│ │ PROBLEMS:                                                        │         │
│ │ • Anyone can modify any data from anywhere                       │         │
│ │ • Change one function, break 10 others                           │         │
│ │ • Hard to understand which functions use which data             │         │
│ │ • Code reuse requires copy-paste                                 │         │
│ │ • Testing is nightmare (everything connected to everything)     │         │
│ └─────────────────────────────────────────────────────────────────┘         │
│                                                                              │
│ OOP SOLUTION:                                                                │
│ ┌─────────────────────────────────────────────────────────────────┐         │
│ │        ┌─────────────┐       ┌─────────────┐                    │         │
│ │        │   Object A   │       │   Object B   │                   │         │
│ │        │ ┌─────────┐ │       │ ┌─────────┐ │                    │         │
│ │        │ │ data    │ │       │ │ data    │ │                    │         │
│ │        │ │ methods │ │◄─────►│ │ methods │ │                    │         │
│ │        │ └─────────┘ │       │ └─────────┘ │                    │         │
│ │        └─────────────┘       └─────────────┘                    │         │
│ │                                                                  │         │
│ │ BENEFITS:                                                        │         │
│ │ • Data + related functions bundled together                      │         │
│ │ • Clear boundaries - change inside without breaking outside     │         │
│ │ • Reuse through inheritance and composition                      │         │
│ │ • Model real-world entities naturally                            │         │
│ └─────────────────────────────────────────────────────────────────┘         │
│                                                                              │
│ REAL-WORLD ANALOGY:                                                          │
│ • Procedural: Factory floor with tools scattered everywhere                 │
│ • OOP: Organized workstations with each worker having their own tools       │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHY USE OOP?                                                                 │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ 1. MODULARITY: Break complex system into manageable pieces                   │
│    → "Can understand one class without understanding entire system"          │
│                                                                              │
│ 2. MAINTAINABILITY: Change implementation without affecting users            │
│    → "Internal engine change doesn't require changing how you drive"         │
│                                                                              │
│ 3. REUSABILITY: Inherit and extend existing code                             │
│    → "Don't reinvent the wheel, extend it to make a car"                    │
│                                                                              │
│ 4. MODELING: Code structure matches real-world mental model                  │
│    → "Customer object has orders, Order has items - intuitive!"             │
│                                                                              │
│ 5. TEAM COLLABORATION: Clear interfaces between modules                      │
│    → "You build PaymentService, I build OrderService, they just connect"    │
│                                                                              │
│ OOP vs PROCEDURAL vs FUNCTIONAL:                                             │
│ ┌────────────────┬─────────────────────────────────────────────────────────┐│
│ │ Paradigm       │ Best For                                                ││
│ ├────────────────┼─────────────────────────────────────────────────────────┤│
│ │ Procedural     │ Simple scripts, system utilities, quick tasks           ││
│ │ OOP            │ Large applications, GUIs, simulations, enterprise       ││
│ │ Functional     │ Data transformations, parallel processing, math-heavy   ││
│ │ HYBRID ⭐     │ Modern apps use ALL based on context!                    ││
│ └────────────────┴─────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHEN TO USE OOP PRINCIPLES?                                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ USE ENCAPSULATION WHEN:                                                      │
│ • Data has rules/constraints (balance can't be negative)                     │
│ • Implementation might change (database → API)                              │
│ • Need to control access (read-only, write-only)                            │
│                                                                              │
│ USE ABSTRACTION WHEN:                                                        │
│ • Implementation details shouldn't concern user                              │
│ • Multiple implementations possible (different databases)                    │
│ • Want to hide complexity from users of your code                           │
│                                                                              │
│ USE INHERITANCE WHEN:                                                        │
│ • TRUE "is-a" relationship (Dog is-a Animal)                                │
│ • Shared behavior across related classes                                     │
│ • ⚠️ BUT prefer composition when in doubt!                                  │
│                                                                              │
│ USE POLYMORPHISM WHEN:                                                       │
│ • Same operation on different types (calculate area of any shape)           │
│ • Want extensibility (add new types without changing existing code)         │
│ • Plugin architecture (add features without modifying core)                  │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ HOW TO THINK IN OOP?                                                         │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ STEP 1: IDENTIFY NOUNS → These become CLASSES                                │
│   Problem: "Customer places order for products from store"                   │
│   Classes: Customer, Order, Product, Store                                   │
│                                                                              │
│ STEP 2: IDENTIFY VERBS → These become METHODS                                │
│   "places order" → customer.placeOrder()                                    │
│   "add to cart" → cart.addProduct()                                         │
│                                                                              │
│ STEP 3: IDENTIFY ADJECTIVES → These become ATTRIBUTES                        │
│   "premium customer" → customer.membershipLevel                              │
│   "discounted product" → product.discountPercent                            │
│                                                                              │
│ STEP 4: IDENTIFY RELATIONSHIPS                                               │
│   Customer HAS-A Cart (composition)                                          │
│   Order CONTAINS Products (aggregation)                                      │
│   PremiumCustomer IS-A Customer (inheritance)                               │
│                                                                              │
│ THE MENTAL SHIFT:                                                            │
│ PROCEDURAL: "What steps do I need to do?"                                    │
│ OOP:        "What things exist and what can they do?"                       │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ DIFFICULTIES & COMMON MISTAKES                                               │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ 1. OVER-ENGINEERING:                                                         │
│    Creating classes for everything, too many layers                          │
│    Solution: Start simple, refactor when needed (YAGNI principle)           │
│                                                                              │
│ 2. MISUSING INHERITANCE:                                                     │
│    Using inheritance for code reuse instead of true "is-a"                  │
│    Example: Square extends Rectangle - WRONG! (violates LSP)                │
│    Solution: Use composition for code reuse                                  │
│                                                                              │
│ 3. GOD CLASSES:                                                              │
│    One class doing everything (1000+ lines)                                  │
│    Solution: Single Responsibility - one class, one job                      │
│                                                                              │
│ 4. ANEMIC DOMAIN MODEL:                                                      │
│    Classes with only getters/setters, no behavior                           │
│    Solution: Put behavior WITH the data it operates on                       │
│                                                                              │
│ 5. TIGHT COUPLING:                                                           │
│    Classes depending on concrete implementations                             │
│    Solution: Depend on abstractions (interfaces)                             │
│                                                                              │
│ 6. EXPOSING INTERNAL STATE:                                                  │
│    Returning mutable internal collections                                    │
│    Solution: Return copies or unmodifiable views                             │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ EXPECTED OUTPUTS OF GOOD OOP DESIGN                                          │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ ✅ READABLE: New team member understands system in hours, not weeks         │
│ ✅ TESTABLE: Can unit test each class independently                          │
│ ✅ EXTENSIBLE: Add new features without modifying existing code             │
│ ✅ MAINTAINABLE: Bug in one place doesn't cascade everywhere                │
│ ✅ REUSABLE: Classes work in different contexts                              │
│                                                                              │
│ METRICS OF GOOD OOP:                                                         │
│ • High Cohesion: Class does ONE thing well                                   │
│ • Low Coupling: Classes don't depend heavily on each other                  │
│ • Small class sizes: < 200 lines typically                                   │
│ • Shallow inheritance: Max 3 levels usually                                  │
│ • Interface segregation: Many small interfaces > one big one                │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

# PART 1: OOP FROM FIRST PRINCIPLES

## What is OOP Really About?

```
THE REAL STORY:
OOP isn't about "classes and objects" - it's about MANAGING COMPLEXITY.

As software grows, complexity grows EXPONENTIALLY.
OOP gives us tools to ORGANIZE and CONTAIN that complexity.

PROCEDURAL PROGRAMMING:
- Data here, functions there, connections everywhere
- Change one thing, break 10 things
- Hard to reason about

OOP:
- Related data + behavior BUNDLED together
- Clear boundaries between parts
- Change one thing, only affect that thing
```

## The Four Pillars (Why They Exist)

### 1. ENCAPSULATION - "Hide the Mess"

```java
// WITHOUT ENCAPSULATION:
class BankAccountBad {
    public double balance;  // Anyone can mess with this!
}

BankAccountBad account = new BankAccountBad();
account.balance = -1000;  // Negative balance? Sure, why not!

// WITH ENCAPSULATION:
class BankAccountGood {
    private double balance;  // Hidden!

    public void deposit(double amount) {
        if (amount > 0) {  // VALIDATION
            balance += amount;
        }
    }

    public boolean withdraw(double amount) {
        if (amount > 0 && amount <= balance) {  // RULES ENFORCED
            balance -= amount;
            return true;
        }
        return false;
    }

    public double getBalance() {
        return balance;  // READ-ONLY access
    }
}

// WHY? Because the OBJECT controls its own rules.
// You can't create invalid state from outside.
```

### 2. ABSTRACTION - "Show Only What Matters"

```java
// When you drive a car:
// - You use steering wheel, pedals, gear shift (INTERFACE)
// - You don't see engine mechanics, fuel injection (IMPLEMENTATION)

interface PaymentProcessor {
    boolean processPayment(double amount);
    // User only sees: "I can pay with this"
}

class CreditCardProcessor implements PaymentProcessor {
    // All the complex stuff hidden:
    // - Connect to bank API
    // - Encrypt data
    // - Handle timeout/retry
    // - Log transaction

    public boolean processPayment(double amount) {
        // Complex implementation hidden
        return connectAndProcess(amount);
    }

    private boolean connectAndProcess(double amount) {
        // 100 lines of code hidden from user
        return true;
    }
}

// WHY? User of PaymentProcessor doesn't need to know HOW it works.
// They just need to know WHAT it does.
```

### 3. INHERITANCE - "Reuse and Extend" (Use Carefully!)

```java
// GOOD USE: True "is-a" relationship
class Animal {
    protected String name;
    public void eat() { System.out.println(name + " is eating"); }
}

class Dog extends Animal {
    public void bark() { System.out.println("Woof!"); }
}

// Dog IS-A Animal. Makes sense.
// Dog can eat (inherited) and bark (own method).

// BAD USE: Using inheritance for code reuse
class Rectangle {
    protected double width, height;
    public double area() { return width * height; }
}

class Square extends Rectangle {
    // Problem! Square doesn't need width AND height
    // Setting width should also set height
    // This violates "Liskov Substitution Principle"
}

// Square is-a Rectangle mathematically,
// but NOT in terms of behavior!
```

### 4. POLYMORPHISM - "Many Forms, One Interface"

```java
// The POWER of OOP!

interface Shape {
    double area();
}

class Circle implements Shape {
    private double radius;
    public Circle(double r) { radius = r; }
    public double area() { return Math.PI * radius * radius; }
}

class Square implements Shape {
    private double side;
    public Square(double s) { side = s; }
    public double area() { return side * side; }
}

// THE MAGIC:
public double totalArea(Shape[] shapes) {
    double total = 0;
    for (Shape s : shapes) {
        total += s.area();  // Don't know if Circle or Square - DON'T CARE!
    }
    return total;
}

// WHY? Add new shapes (Triangle, Hexagon) WITHOUT changing totalArea!
// This is the "Open-Closed Principle" - open for extension, closed for modification.
```

---

# PART 2: COMPOSITION VS INHERITANCE

## The "Has-A" vs "Is-A" Debate

```
INHERITANCE (Is-A):
- Dog IS-A Animal
- ArrayList IS-A List
- Creates TIGHT coupling
- Hard to change later

COMPOSITION (Has-A):
- Car HAS-A Engine
- Person HAS-A Address
- Creates LOOSE coupling
- Easy to change later

RULE: "Favor composition over inheritance"
```

## The Superman Example (From Your Conversation!)

```java
// ❌ INHERITANCE APPROACH:
class Man {
    public void walk() { System.out.println("Walking"); }
    public void talk() { System.out.println("Talking"); }
}

class SuperMan extends Man {
    // Superman IS-A Man? Kind of...
    // But Superman isn't born as man, he's from Krypton!
    // What if we want FlashMan, SpiderMan?
    // They have different origins but similar powers.

    public void fly() { System.out.println("Flying"); }
    public void shootLasers() { System.out.println("Pew pew"); }
}

// PROBLEM: Can't mix and match powers easily!
// What if SpiderMan wants to fly but not shoot lasers?
// Multiple inheritance? Java doesn't allow it.
```

```java
// ✅ COMPOSITION APPROACH:

// Basic human capabilities
class Man {
    private String name;

    public Man(String name) {
        this.name = name;
    }

    public void walk() { System.out.println(name + " is walking"); }
    public void talk() { System.out.println(name + " is talking"); }
}

// Superpowers as separate components - PLUG AND PLAY!
interface SuperPower {
    void usePower();
}

class Flight implements SuperPower {
    public void usePower() { System.out.println("Flying through the sky!"); }
}

class LaserEyes implements SuperPower {
    public void usePower() { System.out.println("Shooting laser beams!"); }
}

class SuperStrength implements SuperPower {
    public void usePower() { System.out.println("Lifting heavy objects!"); }
}

class WebSlinging implements SuperPower {
    public void usePower() { System.out.println("Swinging on webs!"); }
}

// SuperMan HAS-A Man (delegate human behaviors)
// SuperMan HAS-A list of powers (composable!)
class SuperMan {
    private Man humanSide;  // Delegation
    private List<SuperPower> powers;

    public SuperMan(String name) {
        this.humanSide = new Man(name);  // HAS-A Man
        this.powers = new ArrayList<>();
    }

    // Delegation - forward human behaviors
    public void walk() { humanSide.walk(); }
    public void talk() { humanSide.talk(); }

    // Add powers dynamically!
    public void addPower(SuperPower power) {
        powers.add(power);
    }

    public void useAllPowers() {
        for (SuperPower power : powers) {
            power.usePower();
        }
    }
}

// USAGE:
public static void main(String[] args) {
    SuperMan clark = new SuperMan("Clark Kent");
    clark.addPower(new Flight());
    clark.addPower(new LaserEyes());
    clark.addPower(new SuperStrength());

    clark.walk();  // Human behavior
    clark.useAllPowers();  // Super powers!

    // SpiderMan? Easy!
    SuperMan peter = new SuperMan("Peter Parker");
    peter.addPower(new WebSlinging());
    peter.addPower(new SuperStrength());
    // No laser eyes, no flight - different power combo!
}
```

## The Interior Decorator Analogy

```
YOUR ANALOGY:
"Composition is like having an interior decorator do your work"

TRANSLATION TO CODE:
- The decorator (composed object) does the actual work
- Your class (the client) just DELEGATES to them
- You can swap decorators anytime!

class Room {
    private InteriorDecorator decorator;  // "Hire" a decorator

    public void decorateRoom() {
        decorator.decorate();  // Let them do the work
    }

    public void changeDecorator(InteriorDecorator newOne) {
        this.decorator = newOne;  // Change decorator anytime!
    }
}

THIS IS DEPENDENCY INJECTION!
- Room doesn't CREATE the decorator
- Room RECEIVES the decorator from outside
- Room can work with ANY decorator implementation
```

---

# PART 3: SOLID PRINCIPLES

## S - Single Responsibility Principle

```java
// ❌ BAD: UserManager does EVERYTHING
class UserManager {
    public void createUser(User user) { /* ... */ }
    public void saveToDatabase(User user) { /* ... */ }
    public void sendEmail(User user) { /* ... */ }
    public void validateUser(User user) { /* ... */ }
    public void generateReport() { /* ... */ }
}

// ✅ GOOD: Each class has ONE job
class UserService {
    public void createUser(User user) { /* ... */ }
}

class UserRepository {
    public void save(User user) { /* ... */ }
}

class EmailService {
    public void sendEmail(User user) { /* ... */ }
}

class UserValidator {
    public boolean isValid(User user) { /* ... */ }
}

// WHY? When email logic changes, you only change EmailService.
// UserService doesn't need to be retested.
```

## O - Open/Closed Principle

```java
// ❌ BAD: Have to modify code to add new shapes
class AreaCalculator {
    public double calculateArea(Object shape) {
        if (shape instanceof Circle) {
            Circle c = (Circle) shape;
            return Math.PI * c.radius * c.radius;
        } else if (shape instanceof Square) {
            Square s = (Square) shape;
            return s.side * s.side;
        }
        // Add Triangle? Have to modify this class!
        return 0;
    }
}

// ✅ GOOD: Open for extension, closed for modification
interface Shape {
    double area();
}

class Circle implements Shape {
    double radius;
    public double area() { return Math.PI * radius * radius; }
}

class Square implements Shape {
    double side;
    public double area() { return side * side; }
}

// Add Triangle without modifying existing code!
class Triangle implements Shape {
    double base, height;
    public double area() { return 0.5 * base * height; }
}

class AreaCalculator {
    public double calculateArea(Shape shape) {
        return shape.area();  // Works for ANY shape!
    }
}
```

## L - Liskov Substitution Principle

```java
// "Subclass should be substitutable for base class"

// ❌ BAD: Square breaks Rectangle's contract
class Rectangle {
    protected int width, height;

    public void setWidth(int w) { width = w; }
    public void setHeight(int h) { height = h; }
    public int area() { return width * height; }
}

class Square extends Rectangle {
    @Override
    public void setWidth(int w) {
        width = w;
        height = w;  // Side effect! Unexpected behavior.
    }

    @Override
    public void setHeight(int h) {
        width = h;
        height = h;
    }
}

// This code breaks with Square:
void resize(Rectangle r) {
    r.setWidth(5);
    r.setHeight(10);
    assert r.area() == 50;  // FAILS for Square! Area is 100.
}

// ✅ BETTER: Don't use inheritance here
interface Shape {
    int area();
}

class Rectangle implements Shape { /* ... */ }
class Square implements Shape { /* ... */ }  // Separate class, no inheritance
```

## I - Interface Segregation Principle

```java
// "Don't force classes to implement methods they don't need"

// ❌ BAD: Fat interface
interface Worker {
    void work();
    void eat();
    void sleep();
}

class Robot implements Worker {
    public void work() { /* OK */ }
    public void eat() { /* Robots don't eat! */ }  // Forced to implement
    public void sleep() { /* Robots don't sleep! */ }
}

// ✅ GOOD: Segregated interfaces
interface Workable {
    void work();
}

interface Eatable {
    void eat();
}

interface Sleepable {
    void sleep();
}

class Human implements Workable, Eatable, Sleepable {
    // Implements all - makes sense for humans
}

class Robot implements Workable {
    // Only implements what it needs
}
```

## D - Dependency Inversion Principle

```java
// "Depend on abstractions, not concretions"

// ❌ BAD: High-level module depends on low-level module
class EmailNotificationService {
    public void sendEmail(String message) { /* ... */ }
}

class UserService {
    private EmailNotificationService notifier = new EmailNotificationService();

    public void createUser(User user) {
        // ...
        notifier.sendEmail("User created");  // Tightly coupled!
    }
}

// ✅ GOOD: Both depend on abstraction
interface NotificationService {
    void notify(String message);
}

class EmailNotificationService implements NotificationService {
    public void notify(String message) { /* send email */ }
}

class SMSNotificationService implements NotificationService {
    public void notify(String message) { /* send SMS */ }
}

class UserService {
    private NotificationService notifier;  // Depends on interface!

    // Dependency Injection
    public UserService(NotificationService notifier) {
        this.notifier = notifier;
    }

    public void createUser(User user) {
        // ...
        notifier.notify("User created");  // Works with any notifier!
    }
}

// Usage: Easily swap implementations!
UserService userService = new UserService(new EmailNotificationService());
// or
UserService userService = new UserService(new SMSNotificationService());
```

---

# PART 4: COMMON DESIGN PATTERNS

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

# PART 5: WHEN TO USE WHAT

```
┌─────────────────────────────────────────────────────────────────┐
│ NEED                          │ USE                             │
├───────────────────────────────┼─────────────────────────────────│
│ Share code between classes    │ Composition (HAS-A)             │
│ True "is-a" relationship      │ Inheritance sparingly           │
│ Multiple variations of algo   │ Strategy Pattern                │
│ Add behavior dynamically      │ Decorator Pattern               │
│ One global instance           │ Singleton                       │
│ Create objects without type   │ Factory                         │
│ Complex object construction   │ Builder                         │
│ Make incompatible work        │ Adapter                         │
│ React to state changes        │ Observer                        │
│ Undo operations               │ Command Pattern                 │
└─────────────────────────────────────────────────────────────────┘
```

---

# PART 6: PRACTICE QUESTIONS

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

_OOP is about managing complexity through smart organization!_ 🏗️
