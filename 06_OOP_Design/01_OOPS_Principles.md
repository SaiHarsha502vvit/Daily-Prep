# 🏗️ OOPS & Design Principles: Complete Guide

> **Navigation**: [Chapter index](00_INDEX.md) | [Design Patterns: Complete Guide… →](02_Design_Patterns.md)

## Building Software That Lasts

---

## 🔗 Bridge — Where This Chapter Fits

| Dimension | This chapter |
| --- | --- |
| **Builds on** | [Java language basics](../07_Modern_Java/00_INDEX.md), [Memory foundations](../02_Data_Structures/01a_Memory_Foundations.md) |
| **You will learn** | Encapsulation, inheritance, polymorphism, abstraction, composition vs inheritance, SOLID, and how to choose among them |
| **Leads to** | [Design Patterns](02_Design_Patterns.md), [Design Heuristics](11_Design_Heuristics.md) |
| **Abstraction level** | Procedures and data → **objects that guard invariants** → **design rules (SOLID) that keep objects changeable** |

> [!NOTE]
> The full gap-free reading order and dependency graph are in the [Learning Path](00_LEARNING_PATH.md).

---

## 💬 Explain It Like a Study Partner — OOP Principles

### 1. The bottom line

Group data with the rules that protect it, hide the details, depend on abstractions, and prefer composition to inheritance.

### 2. The textbook core

- **Encapsulation** keeps state private so invariants cannot be bypassed.
- **Abstraction** exposes what an object does, not how.
- **Inheritance** models "is-a" and reuses code; **polymorphism** lets callers use the supertype.
- **Composition** ("has-a") is more flexible than inheritance because it can change at run time.
- **SOLID**: single responsibility, open/closed, Liskov substitution, interface segregation, dependency inversion.

### 3. The real-world analogy

A **car**: you use the pedals and wheel (the interface) and never touch the engine (the encapsulated state); any car with the same controls can be driven the same way (polymorphism).

### 4. Walkthrough

1. Start with a class whose fields are public and used everywhere.
2. Make the fields private and add methods that enforce the rules (encapsulation).
3. Notice two subclasses that only differ in one behaviour; extract that behaviour behind an interface.
4. Inject the interface instead of subclassing (composition).
5. Check the result against SOLID: each class has one reason to change.

> [!NOTE]
> **Quick check:** Why is "prefer composition over inheritance" a preference and not a ban? *Inheritance is right for true is-a relationships with a stable base type; it is wrong when used only to reuse code.*

### 5. Check yourself

**Q1.** A `Square` extends `Rectangle` and overrides `setWidth` to also set the height. Which principle breaks, and why?

<details><summary>Answer</summary>

**Liskov substitution.** Code written against `Rectangle` assumes width and height change independently; the subtype breaks that contract. Model both as implementations of a `Shape` interface instead.

</details>

**Q2.** Which SOLID letter does constructor injection of an interface support most directly?

<details><summary>Answer</summary>

**D** (dependency inversion): high-level code depends on an abstraction supplied from outside, not on a concrete class it creates itself.

</details>

---


## 📚 Topic Pages in This Chapter

This chapter is split into focused pages so each topic can be read on its own. Read them in order the first time; use the table to jump back later.

| # | Page | What is inside | Lines |
| --- | --- | --- | --- |
| 1 | [Section 0 — When OOP Principles Break in Production](01_OOPS_Principles/01_section_0_when_oop_principles_break.md) | Section 0 — When OOP Principles Break in… · The 5W+H Framework | 303 |
| 2 | [OOP From First Principles](01_OOPS_Principles/02_oop_from_first_principles.md) | OOP From First Principles | 235 |
| 3 | [Composition vs Inheritance](01_OOPS_Principles/03_composition_vs_inheritance.md) | Composition vs Inheritance | 166 |
| 4 | [SOLID Principles](01_OOPS_Principles/04_solid_principles.md) | SOLID Principles | 219 |
| 5 | [Common Design Patterns](01_OOPS_Principles/05_common_design_patterns.md) | Common Design Patterns · When to Use What · Practice Questions | 376 |

## 💪 Curated Practice Problems — OOP Principles

**HOW TO USE**: These are conceptual + coding problems that test your grasp of OOP pillars.

---

### OOP Coding Challenges

| #   | Problem                                    | Platform | Difficulty | OOP Concept Tested                         |
| --- | ------------------------------------------ | -------- | ---------- | ------------------------------------------ |
| 1   | Design Parking System (LC 1603)            | LeetCode | Easy       | Encapsulation, simple class design         |
| 2   | Design HashMap (LC 706)                    | LeetCode | Easy       | Encapsulation + array of linked lists      |
| 3   | Design Browser History (LC 1472)           | LeetCode | Medium     | Stack/List with encapsulated state         |
| 4   | Implement Queue using Stacks (LC 232)      | LeetCode | Easy       | Abstraction: queue interface, stack impl   |
| 5   | Design Twitter (LC 355)                    | LeetCode | Medium     | Composition: User has Tweets, follows Set  |
| 6   | LRU Cache (LC 146)                         | LeetCode | Medium     | Encapsulation: internal doubly-linked list |
| 7   | Serialize/Deserialize Binary Tree (LC 297) | LeetCode | Hard       | Abstraction: encode/decode interface       |
| 8   | Design Snake Game (LC 353)                 | LeetCode | Medium     | State management, queue for body           |

---

### OOP Design Exercises (Think + Sketch)

| #   | Exercise                           | Focus                                                |
| --- | ---------------------------------- | ---------------------------------------------------- |
| 1   | Design a Library Management System | Inheritance (Book/EBook/AudioBook), Polymorphism     |
| 2   | Design a Vending Machine           | State pattern, Encapsulation                         |
| 3   | Design a Chess Game                | Inheritance (Piece hierarchy), Polymorphism (move()) |
| 4   | Design a Deck of Cards             | Abstraction, Factory pattern                         |
| 5   | Design an Elevator System          | Observer pattern, State pattern                      |

---

_OOP is about managing complexity through smart organization!_

---

### PLUS Enhancements

#### Diagram 1: Inheritance Hierarchy — Animal / Dog / Cat

```
┌────────────────────────────────────────────────────────────────────────────┐
│                     INHERITANCE HIERARCHY — Animal Family                  │
└────────────────────────────────────────────────────────────────────────────┘

                        ┌──────────────────────────┐
                        │      <<abstract>>        │
                        │         Animal           │
                        ├──────────────────────────┤
                        │ # name: String           │
                        ├──────────────────────────┤
                        │ + eat(): void            │
                        │ + sleep(): void          │
                        │ + makeSound(): <<abstract>>│
                        └──────────────┬───────────┘
                                       │ extends (IS-A)
                    ┌──────────────────┴──────────────────┐
                    ▼                                     ▼
        ┌───────────────────┐                 ┌───────────────────┐
        │      <<class>>    │                 │      <<class>>    │
        │        Dog        │                 │        Cat        │
        ├───────────────────┤                 ├───────────────────┤
        │                   │                 │                   │
        ├───────────────────┤                 ├───────────────────┤
        │ + bark(): void    │                 │ + meow(): void    │
        │ + fetch(): void   │                 │ + purr(): void    │
        └───────────────────┘                 └───────────────────┘

  Method resolution order at RUNTIME (dynamic dispatch):

  dog.makeSound()
       │
       ▼ JVM looks up vtable for Dog class
  Dog's vtable entry 0 ──▶ Animal.eat()      (inherited, not overridden)
  Dog's vtable entry 1 ──▶ Dog.bark()        (own method)
  Dog's vtable entry 2 ──▶ Animal.makeSound() overridden by Dog

  super() call chain (constructor):

  new Dog("Buddy")
       │
       ├─► Dog() constructor starts
       │        │
       │        ▼ implicit super() call
       │   Animal() runs first  ──► sets name = "Buddy"
       │   Animal() finishes
       │        │
       │        ▼
       │   Dog() body runs  ──► additional Dog initialization
       │        │
       │        ▼
       └─► Dog object fully constructed

  ┌────────────────────────────────────────────────────────────────────────┐
  │ FAILURE MODE: Deep Inheritance Chain                                   │
  │                                                                        │
  │  Animal                                                                │
  │   └── Mammal                                                           │
  │        └── Dog                                                         │
  │             └── ServiceDog                                             │
  │                  └── PoliceDog                                         │
  │                                                                        │
  │  Problem: A change to Animal.eat() ripples through 5 classes.          │
  │  Adding a new method to Dog requires updating PoliceDog.               │
  │  The "is-a" relationship weakens: is PoliceDog really an Animal?       │
  │  Solution: Composition (ServiceDog HAS-A TrainingCertificate)          │
  └────────────────────────────────────────────────────────────────────────┘
```

#### Diagram 2: Diamond Inheritance — C++ vs Java 8 Default Methods

```
┌────────────────────────────────────────────────────────────────────────────┐
│           DIAMOND PROBLEM — C++ vs Java 8 Default Methods                 │
└────────────────────────────────────────────────────────────────────────────┘

  C++ DIAMOND (multiple inheritance — AMBIGUOUS):

       ┌──────────────┐
       │     Base     │  class A { void foo(); }
       │   foo()      │
       └──────┬───────┘
              │
       ┌──────┴───────┐
       ▼              ▼
  ┌──────────┐  ┌──────────┐
  │  Left    │  │  Right   │
  │ extends A│  │ extends A│
  │  foo()   │  │  foo()   │
  └────┬─────┘  └────┬─────┘
       │             │
       └──────┬──────┘
              │
              ▼
       ┌──────────────┐
       │    Derived   │
       │extends L, R  │  class D : public L, public R {}
       └──────────────┘

  PROBLEM: d.foo() ──► Compiler error: "request for member 'foo' is ambiguous"
            Both L and R inherited foo() from A, and D has two copies.
  FIX: D must explicitly say which one: d.L::foo(); or d.R::foo();

  ────────────────────────────────────────────────────────────────────────────

  JAVA 8 INTERFACE DIAMOND (compile ERROR + resolution):

       ┌──────────────────┐
       │   <<interface>>  │
       │        A         │  interface A { default void foo(); }
       │  default foo()   │
       └────────┬─────────┘
                │
        ┌───────┴───────┐
        ▼               ▼
  ┌─────────────┐  ┌─────────────┐
  │<<interface>> │  │<<interface>>│
  │     B       │  │     C       │
  │ implements A│  │ implements A│
  └──────┬──────┘  └──────┬──────┘
         │                │
         └────────┬───────┘
                  ▼
         ┌────────────────┐
         │    <<class>>   │
         │       D        │
         │ implements B,C │
         └────────────────┘

  PROBLEM: d.foo() ──► Java 7: compile error! Which foo()?
           Java 8: RESOLVED automatically — more SPECIFIC wins.
           Since D explicitly implements B and C, and neither overrides foo(),
           A.foo() is inherited once (not twice) because Java does NOT
           duplicate default method implementations through interfaces.

  COMPILATION ERROR SCENARIO (Java 8+):

  interface A    { default void x() { System.out.println("A"); } }
  interface B extends A { @Override default void x() { System.out.println("B"); } }
  interface C extends A { @Override default void x() { System.out.println("C"); } }
  class D implements B, C {
      // Which x()? B.x() and C.x() both override A.x() — AMBIGUOUS!
      // Fix: D must override x() { B.super.x(); }
  }

  ┌──────────────────────────────────────────────────────────────────────┐
  │ SUMMARY TABLE                                                          │
  │                                                                        │
  │  Language   │ Duplication  │ Resolution           │ Fix Required?      │
  │  ────────────────────────────────────────────────────────────────────│
  │  C++        │ YES (2 copies│ Explicit scope::     │ YES (always)       │
  │  Java 7     │ No duplication│ N/A — compile error │ YES (diamond not   │
  │             │ (not allowed)│                      │  allowed)          │
  │  Java 8+    │ No duplication│ Nearest super wins   │ No (unless both    │
  │             │ (single copy)│ (specificity rule)   │  override A)       │
  └──────────────────────────────────────────────────────────────────────┘
```

#### Diagram 3: SOLID Principles Pyramid

```
┌────────────────────────────────────────────────────────────────────────────┐
│                    SOLID PRINCIPLES PYRAMID                                │
│              (layered by dependency direction and failure modes)           │
└────────────────────────────────────────────────────────────────────────────┘

                              ┌──────────────────────────┐
                              │         DIP             │  Dependency Inversion
                              │  Depend on abstractions  │  High-level → abstract
                              │  not concretions         │
                              └──────────┬───────────────┘
                                         │
                              ┌──────────┴───────────────┐
                              │         ISP             │  Interface Segregation
                              │  Many small interfaces   │  Clients shouldn't depend
                              │  > one fat interface     │  on unused methods
                              └──────────┬───────────────┘
                                         │
                              ┌──────────┴───────────────┐
                              │         LSP             │  Liskov Substitution
                              │  Substitutable for base │  Square isn't Rectangle
                              │  everywhere             │  (behavioral contract)
                              └──────────┬───────────────┘
                                         │
                              ┌──────────┴───────────────┐
                              │         OCP             │  Open/Closed
                              │  Open for extension      │  Don't modify existing
                              │  Closed for modification │  code to add features
                              └──────────┬───────────────┘
                                         │
                              ┌──────────┴───────────────┐
                              │         SRP             │  Single Responsibility
                              │  One reason to change    │  BASE OF PYRAMID
                              │  One class, one job      │  All others build on this
                              └──────────────────────────┘

  FAILURE MODE MAP:

  ┌────────────────┬───────────────────────────────────────────────────┐
  │ Principle      │ Failure Mode (symptom)                            │
  ├────────────────┼───────────────────────────────────────────────────┤
  │ SRP            │ God class — 50 reasons to change, 3000 lines      │
  │                │ Change in email logic breaks payment processing    │
  ├────────────────┼───────────────────────────────────────────────────┤
  │ OCP            │ if (type == DOG) ... else if (type == CAT) ...   │
  │                │ Adding Cat means modifying the existing code       │
  ├────────────────┼───────────────────────────────────────────────────┤
  │ LSP            │ Square extends Rectangle → resize() breaks        │
  │                │ NullPointerException from violating preconditions │
  ├────────────────┼───────────────────────────────────────────────────┤
  │ ISP            │ interface Worker { eat(); sleep(); work(); }      │
  │                │ Robot forced to implement eat() and sleep()        │
  ├────────────────┼───────────────────────────────────────────────────┤
  │ DIP            │ new EmailService() inside UserService             │
  │                │ Can't swap to SMSService without editing UserService│
  └────────────────┴───────────────────────────────────────────────────┘
```

#### Deep-Dive 1: Mechanism — Polymorphism at the JVM Bytecode Level

```
┌────────────────────────────────────────────────────────────────────────────┐
│         POLYMORPHISM — Virtual Method Dispatch at Bytecode Level           │
└────────────────────────────────────────────────────────────────────────────┘

  THREE JVM BYTECODE INVOKE OPCODES — key difference:

  ┌──────────────────┬──────────────────────────────────────────────────────┐
  │ Opcode           │ Behavior                                              │
  ├──────────────────┼──────────────────────────────────────────────────────┤
  │ invokestatic     │ No dispatch — resolved at compile time (static)       │
  │ invokevirtual    │ Virtual dispatch via vtable (dynamic)                 │
  │ invokeinterface  │ Interface dispatch via itable (dynamic, slower)       │
  └──────────────────┴──────────────────────────────────────────────────────┘

  VTABLE (virtual table) — one per class, shared by all instances:

  class Animal (vtable):
    slot 0: Object.hashCode()      (inherited from Object)
    slot 1: Object.equals()        (inherited from Object)
    slot 2: Animal.eat()           (overridable)
    slot 3: Animal.makeSound()     (abstract → slot set by subclass)

  class Dog extends Animal (vtable):
    slot 0: Object.hashCode()      (inherited, unchanged)
    slot 1: Object.equals()        (inherited, unchanged)
    slot 2: Dog.eat()              (OVERRIDDEN — new entry)
    slot 3: Dog.makeSound()        (IMPLEMENTED — new entry)

  Memory layout of a Dog object on the heap:

  ┌─────────────────────────────────────────────┐
  │ Object Header (mark word + klass pointer)   │  12 bytes (64-bit JVM)
  ├─────────────────────────────────────────────┤
  │ Animal fields (name)                       │  Reference (4 or 8 bytes)
  ├─────────────────────────────────────────────┤
  │ Dog fields (breed)                         │  Reference (4 or 8 bytes)
  └─────────────────────────────────────────────┘

  The vtable pointer lives IN the klass object (Dog.class), not in each instance.
  Each Dog instance has a pointer to Dog.class, which has the vtable.

  Method call: animal.makeSound()  where animal is actually a Dog

  Bytecode: invokevirtual #12   // resolves to Animal.makeSound() in constant pool

  At RUNTIME (JIT):
    1. Load animal from local var
    2. Read klass pointer from animal object header
    3. Look up method at vtable[slot 3]
    4. Jump to Dog.makeSound() address

  THIS is why Java is polymorphic by default — the actual class determines
  the method address at runtime, not the reference variable type.

  invokeinterface is similar but uses an ITABLE (interface method table)
  because a class can implement multiple interfaces, requiring separate lookup:

  interface I1 { void m1(); }
  interface I2 { void m2(); }
  class C implements I1, I2 {
    void m1() {}
    void m2() {}
  }

  C's itable: [I1 → slot 0: C.m1()] [I2 → slot 0: C.m2()]
  invokeinterface I1.m1() → itable lookup → C.m1()
  invokeinterface is ~10-20% slower than invokevirtual due to 2-level lookup.
```

#### Deep-Dive 2: Why Composition Over Inheritance — Side-by-Side

```
┌────────────────────────────────────────────────────────────────────────────┐
│        COMPOSITION vs INHERITANCE — Side-by-Side Failure Analysis          │
└────────────────────────────────────────────────────────────────────────────┘

  INHERITANCE APPROACH (Vehicle → Car):

  ┌─────────────────────────────┐
  │ <<abstract>> Vehicle        │
  ├─────────────────────────────┤
  │ + start()                   │
  │ + stop()                    │
  │ + refuel()                  │
  └─────────────┬───────────────┘
                │
    ┌───────────┴───────────────┐
    ▼                           ▼
  ┌──────────┐              ┌──────────┐
  │   Car    │              │   Bike   │
  │          │              │          │
  └────┬─────┘              └──────────┘
       │
  ┌────┴─────┐
  ▼          ▼
┌─────────┐ ┌──────────┐
│SportsCar│ │SedanCar  │
│         │ │          │
└─────────┘ └──────────┘

  FAILURE MODE: What if a SportsCar needs to share engine behavior with SedanCar?
  1. Add ElectricCar ──► must decide: IS-A Car? IS-A Vehicle?
  2. Add HybridCar ──► IS-A SportsCar? IS-A SedanCar? Neither fits.
  3. Add FlyingCar ──► The entire hierarchy collapses — mix flying + driving.
  4. Result: 7 classes to model 4 vehicles with shared features.

  ────────────────────────────────────────────────────────────────────────────

  COMPOSITION APPROACH (Car HAS-A Engine, Transmission, etc.):

  ┌───────────────────────────────────────────────────────────────────────┐
  │                          Car (composition root)                       │
  │  ┌─────────────────────────────────────────────────────────────────┐ │
  │  │ - engine: Engine                                                │ │
  │  │ - transmission: Transmission                                     │ │
  │  │ - wheels: List<Wheel>                                            │ │
  │  └─────────────────────────────────────────────────────────────────┘ │
  └───────────────────────────────────────────────────────────────────────┘

  Interfaces for swappable behavior:

  ┌──────────────────┐   ┌──────────────────────┐   ┌────────────────────┐
  │    <<interface>> │   │   <<interface>>      │   │  <<interface>>     │
  │     Engine       │   │   Transmission       │   │  FuelSystem        │
  ├──────────────────┤   ├──────────────────────┤   ├────────────────────┤
  │ + start()        │   │ + shift(gear)        │   │ + refuel()         │
  │ + stop()         │   │ + getCurrentGear()   │   │ + checkLevel()     │
  └──────────────────┘   └──────────────────────┘   └────────────────────┘
         ▲                        ▲                         ▲
         │                        │                         │
  ┌──────┴──────┐          ┌─────┴──────┐            ┌─────┴──────┐
  │V8Engine     │          │AutoTrans   │            │ PetrolFuel │
  │ElectricMotor│          │ManualTrans │            │ElectricFuel│
  │HybridEngine │          │CVTTrans    │            │HybridFuel  │
  └─────────────┘          └────────────┘            └────────────┘

  FlyingCar? Just add: - flyingMechanism: FlyingMechanism
  No class hierarchy change. Just compose a new capability.

  ElectricCar? engine=ElectricMotor, fuelSystem=ElectricFuel, transmission=AutoTrans
  No inheritance. All behavior is plug-and-play.

  ┌──────────────────────────────────────────────────────────────────────┐
  │ PRODUCTION FAILURE MODE — The Deep Inheritance Chain                │
  │                                                                       │
  │ Real-world example from a production codebase:                       │
  │                                                                       │
  │  Entity (base)                                                        │
  │    └── PersistentObject (adds save/load)                             │
  │          └── UserObject (adds userId)                                │
  │                └── AdminUserObject (adds admin flags)                │
  │                      └── SuperAdminUserObject (adds super flags)     │
  │                                                                       │
  │  Problem at scale (10K+ users, 50+ fields):                          │
  │  - Changing Entity.toString() requires retesting 5 classes           │
  │  - PersistentObject.getId() null in unit tests → 4-level stack trace │
  │  - New developer adds method to AdminUserObject, forgets SuperAdmin  │
  │  - The "is-a" chain is fragile: is SuperAdmin really an Entity?      │
  │                                                                       │
  │  Fix: Replace with composition + traits (Java records + sealed)      │
  │  record Auditable(id, createdAt, updatedAt) {}                        │
  │  record Adminable(roles, permissions) {}                             │
  │  class User implements Auditable, Adminable {}                        │
  └──────────────────────────────────────────────────────────────────────┘
```

#### Breadth Comparison 1: OOP vs Other Paradigms

| Paradigm       | Core Idea                        | Strengths                                                                                       | Weaknesses                                                                                   | Best Use Cases                                                           |
| -------------- | -------------------------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| **OOP**        | Objects bundle data + behavior   | Natural model for real-world entities; polymorphism for extensibility; encapsulation for safety | Can lead to deep inheritance; mutable state can cause bugs; over-engineering risk            | GUI apps, enterprise systems, simulations, domain modeling               |
| **Procedural** | Functions act on data structures | Simple, fast, low overhead; predictable; great for scripts                                      | No reuse mechanism; data/function separation causes coupling; hard to scale                  | System scripts, shell pipelines, simple file processing                  |
| **Functional** | Pure functions, no side effects  | Thread-safe by design; composable; easier to reason about; great for parallelism                | Not natural for stateful domains; steeper learning curve; performance overhead in some cases | Data transformation pipelines, compilers, concurrent/parallel processing |
| **Reactive**   | Data streams + propagation       | Handles async/event-driven naturally; backpressure support; declarative                         | Debugging is harder; learning curve; can over-engineer simple sync problems                  | UI event streams, real-time data feeds, IoT, microservices               |
| **Hybrid** ⭐  | Mix based on context             | Best of all worlds; pragmatic                                                                   | Requires team discipline; harder to maintain style guide                                     | Modern applications — all production systems use this                    |

#### Breadth Comparison 2: Inheritance Strategies Compared

| Strategy                         | Language Support               | Coupling                      | Reuse Mechanism          | When to Use                               | Failure Mode                                                |
| -------------------------------- | ------------------------------ | ----------------------------- | ------------------------ | ----------------------------------------- | ----------------------------------------------------------- |
| **Single Inheritance (extends)** | Java, C#                       | Tight to parent               | Inherited methods        | True "is-a" + one parent only             | Diamond problem impossible, but limited reuse               |
| **Multiple Interfaces**          | Java, C# (interface)           | Loose — contract only         | Method signatures        | "Can-do" relationships                    | Fat interfaces (ISP violation)                              |
| **Multiple via Mixins/Traits**   | Scala, PHP traits, Ruby mixins | Medium                        | Injected into class body | Cross-cutting behavior (logging, caching) | Conflict resolution complexity                              |
| **Composition (HAS-A)**          | All languages                  | Loose                         | Delegation               | Reuse without "is-a"; swappable behavior  | Boilerplate delegation code (solved by @Delegate in Lombok) |
| **C++ Multiple Inheritance**     | C++ only                       | Very tight (multiple parents) | Full method inheritance  | True multiple parents needed              | Diamond ambiguity, order dependency                         |


---

## 🏢 Enterprise Lens — OOP Principles

| Area | What top-tier engineering looks like |
| ---- | ------------------------------------ |
| **Where it runs in production** | Frameworks (Spring beans are composed, not subclassed), SDK design, plugin systems |
| **Failure modes** | Deep inheritance trees; classes with many reasons to change; Liskov violations that surface as `instanceof` checks |
| **Testing and verification** | Substitute each subtype in the supertype tests; review class responsibilities in code review |

---

## Reality Check

**"Encapsulation means making fields private"** — Private fields with public getters AND setters for everything is encapsulation theater — the state is exactly as exposed, just with more syntax. Real encapsulation is hiding DECISIONS: a class that exposes deposit/withdraw but not setBalance encapsulates the invariant balance-changes-are-audited; one that returns defensive copies of its internal list encapsulates its storage choice. The test: can you change the internal representation without touching callers? If not, the getters leaked the design.

**"Inheritance models is-a relationships"** — Inheritance models is-SUBSTITUTABLE-for, which is stricter than everyday is-a: a Square IS-A Rectangle in geometry but violates substitutability the moment setWidth breaks the square invariant (the canonical LSP failure). The working test is behavioral: every property callers rely on for the parent must hold for the child — preconditions no stronger, postconditions no weaker. Taxonomy intuition creates hierarchies; substitutability analysis validates them.

**"Polymorphism is method overriding"** — Overriding is one mechanism; the DESIGN payoff is that conditionals disappear into dispatch: a switch on type scattered across five files becomes five classes each owning its branch. The reverse lesson matters equally — when variants are closed and data-like, a sealed hierarchy plus pattern matching (or a plain enum-switch) beats forcing behavior into classes. Polymorphism is the tool for OPEN variant sets; switches are legitimate for closed ones. Modern Java (sealed interfaces plus records plus switch patterns) made both directions first-class.

**"Composition versus inheritance is a preference debate"** — They differ mechanically in FLEXIBILITY and FRAGILITY: inheritance binds at compile time, exposes the child to every parent implementation change (the fragile-base-class problem — a parent method calling an overridable sibling breaks children silently), and spends your single extends slot. Composition binds at runtime, exposes only interfaces, and stacks (a class can wrap several collaborators). The heuristic with teeth: inherit only when you need polymorphic SUBSTITUTION into APIs expecting the parent; for mere code reuse, always compose — reuse-by-inheritance is where the horror stories originate.

**"Java is a pure OOP language, so these principles are automatic"** — The language enforces none of them: public mutable fields compile fine, 3000-line God classes compile fine, downcast-and-instanceof chains compile fine. Static methods, primitives, and now records and lambdas make Java deliberately multi-paradigm — and idiomatic modern Java freely mixes functional cores (streams, immutable records) inside object shells. The principles are DISCIPLINE applied through review; believing the compiler applies them is how enterprise codebases rot while remaining perfectly compilable.
