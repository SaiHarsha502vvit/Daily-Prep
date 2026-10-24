# 🎨 Part 1: Creational Patterns

> **Navigation**: [← The 5W+H Framework](01_the_5w_h_framework.md) | [Chapter overview](../02_Design_Patterns.md) | [Structural Patterns →](03_structural_patterns.md)
> Page 2 of 4 in **Design Patterns: Complete Guide from Scratch**


## 1.1 Singleton Pattern

## What Is It?

Ensures a class has ONLY ONE INSTANCE and provides a global point of access.

💡 **ANALOGY: Government of a country**

- There's only ONE government at a time
- Everyone accesses the SAME government
- Creating a second government causes chaos

## What Problem Does It Solve

- Database connections: Only one connection pool needed
- Configuration: One config object shared across app
- Logging: One logger instance for entire application
- Cache: One cache instance to avoid inconsistency

## When To Use

- ✅ When exactly one instance is needed
- ✅ When global access is required
- ✅ When instance is expensive to create
- ❌ Don't use when you might need multiple instances later
- ❌ Don't use for everything (makes testing harder)

## 1.2 Factory Pattern

### 5W1H: Deep Understanding

```
WHAT: Creates objects WITHOUT exposing the creation logic to the client.
      The client asks for a TYPE, the factory returns the right object.

WHY:  Without Factory, object creation logic is SCATTERED everywhere:
      if-else chains in controllers, services, and utilities.
      When you add a new type, you modify EVERY location.
      Factory centralizes creation in ONE place.

ANALOGY — PIZZA RESTAURANT:
  You say: "I want Margherita"  (specify type)
  Kitchen: creates the pizza    (factory does creation)
  You get: a pizza             (you receive the object)
  You don't see the kitchen, you don't know the recipe,
  and if the recipe changes, your order doesn't change.

HOW IT WORKS INTERNALLY:
  1. All products implement a common INTERFACE (Animal, Shape, etc.)
  2. Factory method takes a TYPE parameter (string, enum)
  3. Factory returns the correct CONCRETE class based on type
  4. Client works with the INTERFACE — doesn't know concrete type

REAL-WORLD IN SPRING:
  Spring's BeanFactory IS a Factory pattern!
  You ask: context.getBean("userService")
  Spring returns: the UserServiceImpl (you don't create it)
  Spring's entire IoC container is a sophisticated Factory.

FACTORY vs ABSTRACT FACTORY:
  Factory: creates ONE type of product family
  Abstract Factory: creates FAMILIES of related products
  Example: UIFactory creates Button + TextField + Menu
           WindowsUIFactory → WindowsButton + WindowsTextField
           MacUIFactory     → MacButton + MacTextField
```

💡 **ANALOGY: Pizza Restaurant**

- You order "Margherita" → Kitchen creates it (you don't know how)
- You order "Pepperoni" → Kitchen creates it (different recipe)
- You just ask for a type, factory handles the creation

🔬 **Section Challenge — 1.2 Factory Pattern**

**Challenge 1 (Trace — Who/When/What):** Spring's `BeanFactory` IS a Factory. When you write `@Autowired UserService userService`, **who** calls the factory? **When** does bean creation happen? **What** determines if you get a new instance or the same one?

<details><summary>Answer</summary>

**Who?** Spring's IoC container (specifically `DefaultListableBeanFactory`). You never call `getBean()` explicitly — `@Autowired` triggers it. **When?** For singleton-scoped beans: at startup (eager init). For prototype-scoped: at each injection point (lazy). **What determines?** The `@Scope` annotation. Default is `singleton` — the factory creates ONE instance, caches it, and returns the same object every time. `@Scope("prototype")` — factory creates a NEW instance each time. This is Factory + Singleton working together.

</details>

## 1.3 Builder Pattern

### 5W1H: Deep Understanding

```
WHAT: Separates the construction of a complex object from its representation.
      Allows step-by-step construction with a fluent interface.

WHY:  The TELESCOPING CONSTRUCTOR anti-pattern:
      new User(name, email, phone, address, age, null, null, null, true);
      What are all these nulls? Which parameter is which? Error-prone.

      Builder solves this:
      User.builder().name("John").email("john@email.com").age(25).build();
      Clear, readable, self-documenting. Add/remove fields without breaking.

ANALOGY — SUBWAY SANDWICH:
  "I'll have a 6-inch Italian on wheat" (mandatory choices)
  "Add lettuce" (optional)
  "Add tomato" (optional)
  "No onions" (optional)
  "Toast it" (optional)
  "That's my order" (build!)

  Each step is optional, order doesn't matter,
  and the final product is immutable.

HOW IT WORKS INTERNALLY:
  1. Outer class (User) has a PRIVATE constructor
  2. Static inner class (User.Builder) has the same fields
  3. Each builder method sets a field and returns `this` (fluent chaining)
  4. build() method calls the private constructor with all collected values
  5. Allows VALIDATION in build() before creating the object

REAL-WORLD IN JAVA:
  StringBuilder, Stream API, HttpClient.newBuilder(),
  Spring's MockMvc, Lombok's @Builder annotation.
  ALL use the Builder pattern.

BUILDER + IMMUTABILITY:
  Builder pattern is the KEY to creating IMMUTABLE objects with
  many fields. The object itself has no setters — all state is
  set during construction via the builder.
```

💡 **ANALOGY: Building a Custom Burger**

- Start with bun
- Add patty (or multiple)
- Add cheese (optional)
- Add vegetables (optional)
- Add sauces (optional)
- Build final burger

---

🔬 **Section Challenge — 1.3 Builder Pattern**

**Challenge 1 (Debug — Who/When/What):** The Builder has a `build()` method that calls `new User(this)`. **When** should validation happen — in each setter method or in `build()`? **What** goes wrong if you validate in setters?

<details><summary>Answer</summary>

**Validate in `build()`.** Why? Cross-field validation: "if premium user, email is required" — you can't check this in `setEmail()` because `setPremium()` might not have been called yet. Order of setter calls is arbitrary. `build()` sees ALL fields and can validate the COMPLETE state. Validating in setters forces an ordering dependency (call A before B) which defeats the Builder's purpose of order-independent construction.

</details>

---

[← The 5W+H Framework](01_the_5w_h_framework.md) | [Chapter overview](../02_Design_Patterns.md) | [Structural Patterns →](03_structural_patterns.md)
