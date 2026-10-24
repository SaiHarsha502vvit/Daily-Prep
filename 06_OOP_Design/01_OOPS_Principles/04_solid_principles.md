# 📐 Part 3: SOLID Principles

> **Navigation**: [← Composition vs Inheritance](03_composition_vs_inheritance.md) | [Chapter overview](../01_OOPS_Principles.md) | [Common Design Patterns →](05_common_design_patterns.md)
> Page 4 of 5 in **OOPS & Design Principles: Complete Guide**


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

[← Composition vs Inheritance](03_composition_vs_inheritance.md) | [Chapter overview](../01_OOPS_Principles.md) | [Common Design Patterns →](05_common_design_patterns.md)
