**Navigation**: [< Previous](01_OOPS_Principles.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](03_System_Design.md)

# 🎨 Design Patterns: Complete Guide from Scratch

## Building Reusable, Maintainable Software

---




# 🎨 PART 0: The 5W+H Framework

**Mental Model:** Think of Design Patterns as recipes in cooking. A recipe doesn't give you the exact ingredients in your fridge, but it gives you a proven approach to creating a specific dish. Knowing recipes makes you a master chef; you don't have to invent a new way to bake a cake from scratch every time.

| Question | Design Patterns Context |
| :--- | :--- |
| **WHAT** | Reusable, language-agnostic solutions to common software design problems. They are templates or blueprints for solving issues that occur repeatedly in software architecture. |
| **WHY** | To prevent "reinventing the wheel." Patterns provide proven, battle-tested solutions that improve code maintainability, flexibility, and create a common vocabulary for developers (e.g., saying "I used a Singleton" conveys exact meaning instantly). |
| **WHEN** | Used when you recognize a recurring architectural problem, foresee requirements changing, or need to structure complex interactions between many objects without creating tight coupling. |
| **WHERE** | Found entirely throughout enterprise codebases, libraries, and frameworks (Spring, React, Android SDK). |
| **WHO** | Formalized by the "Gang of Four" (GoF) in their famous 1994 book, *Design Patterns: Elements of Reusable Object-Oriented Software*. |
| **HOW** | By categorizing problems into three groups: **Creational** (how objects are made), **Structural** (how objects are composed together), and **Behavioral** (how objects communicate and delegate responsibility). |

### Where It's Used in Real World
*   **Frameworks (Spring)**: Extensively relies on the **Singleton** pattern (one instance per bean by default), **Factory** pattern (BeanFactory), and **Proxy** pattern (AOP and transactions).
*   **UI/Frontend Development**: The DOM event listener system is a pure implementation of the **Observer** pattern.
*   **Navigation Apps (Google Maps)**: Uses the **Strategy** pattern to swap between routing algorithms (driving, walking, transit) without changing the core map code.
*   **Text Editors**: Implement the **Command** pattern to encapsulate every keystroke or action as an object, enabling "Undo/Redo" functionality.

## What Are Design Patterns?

Design patterns are REUSABLE SOLUTIONS to COMMON problems that occur in
software design. They are templates, not finished code.

💡 **KEY INSIGHT: Patterns are like RECIPES in cooking!**
- Recipe tells you the approach, not exact ingredients
- You adapt the recipe to your specific needs
- Knowing recipes makes you a better cook/developer

💡 **ANALOGY:**

**Without Patterns**:
"I need to make food" → Start from scratch every time

**With Patterns**:
"I need to make curry" → Use curry recipe (known solution)
"I need to bake" → Use baking techniques (known approach)

**In Software**:
"I need one global config" → Use Singleton pattern
"I need to create objects flexibly" → Use Factory pattern

**Historical Evolution**:
- 1977: Christopher Alexander - patterns in architecture
- 1987: Kent Beck & Ward Cunningham - patterns in software
- 1994: Gang of Four (GoF) book - 23 classic patterns
- 2000s: Enterprise patterns, Web patterns emerged
- 2010s: Microservices patterns, Cloud patterns
- Today: Patterns for AI, serverless, reactive systems


🔬 **Section Challenge — What Are Design Patterns?**

**Challenge 1 (Reasoning — Who/When/What):** The GoF book was published in 1994 using C++/Smalltalk. **What** has changed in 30 years that makes some patterns obsolete? Name a pattern that modern Java makes unnecessary and explain **why**.

<details><summary>Answer</summary>

**What changed?** Language features absorbed patterns. **Iterator** is built into Java's `for-each` loop and `Iterable` interface — you never manually implement Iterator anymore. **Strategy** is replaced by lambdas: `list.sort(Comparator.comparing(User::getName))` — no need for `SortStrategy` interface + concrete classes. **Observer** is built into reactive frameworks (RxJava, Project Reactor). **Command** is simplified by `Runnable`/`Callable`. The GoF patterns remain valuable as CONCEPTS, but modern implementations are far lighter.

</details>


## What Problem Do Design Patterns Solve?

**Problem 1 — Reinventing the Wheel**: Developers solve the same problems repeatedly, each solution different and often suboptimal. Patterns provide **proven** solutions.

**Problem 2 — Communication**: *"I used a thing that creates objects..."* (vague) vs *"I used the Factory pattern"* (precise, everyone understands). Patterns give us a **common vocabulary**.

**Problem 3 — Maintainability**: Spaghetti code is hard to change. Patterns enforce **structure** and **separation**.

**Problem 4 — Flexibility**: Requirements change constantly. Patterns make code **adaptable** to change.

💡 **Real-World Examples**: Java Collections → Iterator pattern, Spring → Factory/Singleton/Proxy, React → Observer pattern, Android → Builder pattern

---



🔬 **Section Challenge — What Problem Do Design Patterns Solve?**

**Challenge 1 (Reasoning):** Problem 2 says patterns provide a "common vocabulary." In a code review, you say "this is a Facade." **Who** benefits from this? **What** if the team doesn't know patterns — does the benefit disappear?

<details><summary>Answer</summary>

**Who benefits?** Every developer reading the code — now and in the future. Saying "Facade" conveys: simplified entry point, hides subsystem complexity, delegates to multiple internal classes. **Without shared knowledge?** Yes, the communication benefit disappears. BUT the structural benefit remains — the code is still well-organized. This is why learning patterns is a TEAM investment, not individual. The real ROI comes when the whole team speaks the same language.

</details>


## Why Learn Design Patterns?

1. **Better Code Quality** — Patterns are battle-tested; fewer bugs, easier maintenance
2. **Faster Development** — Don't waste time designing from scratch; apply known solutions
3. **Team Communication** — *"Use Strategy pattern here"* — everyone instantly understands
4. **Interview Success** — OOP/Design interviews test pattern knowledge directly
5. **Framework Understanding** — Spring, Hibernate, React all use patterns under the hood
6. **Career Growth** — Senior developers **must** know patterns
- Required for system design and architecture roles


🔬 **Section Challenge — Why Learn Design Patterns?**

**Challenge 1 (Trace):** Point 5 says "Spring uses patterns under the hood." When you annotate a class `@Transactional`, **who** creates the proxy? **When** is the proxy created? **What** pattern is being used?

<details><summary>Answer</summary>

**Who?** Spring's BeanPostProcessor (specifically `AbstractAutoProxyCreator`). **When?** During application startup, after bean instantiation but before the bean is fully initialized. Spring wraps your actual bean in a CGLIB or JDK dynamic proxy. **What pattern?** Proxy pattern (specifically, a dynamic proxy). The proxy intercepts method calls, starts a transaction BEFORE your method runs, commits AFTER success, or rolls back on exception. Your code never sees the proxy — `@Autowired MyService` gives you the proxy, not the real object.

</details>


## When To Use Design Patterns


**Use Patterns When**:
- ✅ You recognize a recurring problem
- ✅ You need flexibility for future changes
- ✅ You're building frameworks or libraries
- ✅ Multiple classes need to work together
- ✅ You want to follow SOLID principles
**Don't Use Patterns When**:
- ❌ Simple code does the job
- ❌ You're forcing a pattern where it doesn't fit
- ❌ Pattern adds unnecessary complexity
- ❌ One-time scripts or throwaway code

💡 **Golden Rule**: *"Use patterns to SOLVE problems, not to SHOW OFF knowledge."*
Over-engineering with patterns is as bad as no patterns!


🔬 **Section Challenge — When To Use Design Patterns**

**Challenge 1 (Design):** The "Don't Use" list says "You're forcing a pattern where it doesn't fit." Give a concrete example of over-engineering with Singleton and explain **what** simpler alternative works.

<details><summary>Answer</summary>

**Over-engineering:** Making `UserValidator` a Singleton. It has no mutable state, no expensive construction, no shared resources. Making it Singleton adds: hidden global dependency, harder testing (can't create fresh instance per test), thread-safety concerns for no benefit. **Simpler alternative:** Just create a new instance: `new UserValidator().validate(user)`. Or make methods static if there's truly no state. Patterns solve COMPLEXITY — if there's no complexity, the pattern IS the complexity.

</details>


## ⭐ Growth Mindset: From Pattern User To Pattern Creator ⭐

| Level | Stage | Milestone |
|-------|-------|----------|
| 1 | **Learner** | *"I know what Singleton is"* |
| 2 | **Implementer** | *"I can implement Singleton correctly"* |
| 3 | **Recognizer** | *"I can identify when to use Singleton in my code"* |
| 4 | **Combiner** | *"I can combine multiple patterns to solve complex problems"* |
| 5 | **Creator** | *"I can create new patterns for recurring problems in my domain"* |

💡 **The Truth**: GoF patterns were CREATED by observing recurring solutions! YOU can observe patterns in your domain and document them too!



## Pattern Categories

1. **Creational Patterns** — *Object Creation*
   *"HOW do I create objects?"*
   Singleton, Factory, Abstract Factory, Builder, Prototype

2. **Structural Patterns** — *Object Composition*
   *"HOW do I structure classes and objects?"*
   Adapter, Bridge, Composite, Decorator, Facade, Proxy

3. **Behavioral Patterns** — *Object Interaction*
   *"HOW do objects communicate and behave?"*
   Observer, Strategy, Command, Iterator, State, Template Method

**Quick Selection Guide**:

| Need | Pattern |
|------|--------|
| Only one instance | **Singleton** |
| Create objects without specifying exact class | **Factory** |
| Complex object construction | **Builder** |
| Convert interface | **Adapter** |
| Add behavior dynamically | **Decorator** |
| Simplify complex subsystem | **Facade** |
| Notify multiple objects | **Observer** |
| Swap algorithms at runtime | **Strategy** |
| Undo/Redo operations | **Command** |
| Different behavior based on state | **State** |


🔬 **Section Challenge — Pattern Categories**

**Challenge 1 (Reasoning — Who/When/What):** The selection guide maps "Only one instance" → Singleton, "Swap algorithms" → Strategy. But **when** would you use Strategy AND Factory together? Give a real scenario.

<details><summary>Answer</summary>

Scenario: Payment processing. **Factory** selects WHICH payment processor to create based on user choice: `PaymentFactory.create("stripe")` vs `create("paypal")`. **Strategy** defines HOW each processor charges: `StripeStrategy.pay(amount)` vs `PayPalStrategy.pay(amount)`. Factory answers "which object?" Strategy answers "which algorithm?" Combined: `PaymentStrategy strategy = PaymentFactory.create(userChoice); strategy.pay(100);`. The Factory decouples object creation; the Strategy decouples algorithm selection. They solve different problems and compose naturally.

</details>


## Difficulties & Common Mistakes

1. **"Too Abstract"** — Study with REAL examples, not just UML diagrams
2. **"Don't Know When To Use"** — Learn the PROBLEM each pattern solves first
3. **"Patterns Look Similar"** — Focus on INTENT, not structure. *Factory* = which type, *Builder* = how to construct
4. **"Over-Engineering"** — Start simple, add patterns when complexity grows
5. **"Too Many Patterns"** — Master these 10 first: Singleton, Factory, Builder, Adapter, Decorator, Facade, Observer, Strategy, Command, Template Method
## Expected Outcomes

- ✅ PATTERN RECOGNITION: See problem → Know which pattern applies
- ✅ CLEAN CODE: Write maintainable, flexible code
- ✅ FRAMEWORK MASTERY: Understand how Spring, React, etc. work
- ✅ INTERVIEW SUCCESS: Ace OOP design interview rounds
- ✅ COMMUNICATION: Discuss design precisely with team
- ✅ ARCHITECTURE THINKING: Design systems, not just features

**The Transformation**:

**From**: "I'll figure out how to structure this code"

**To**: "This is a Strategy pattern problem, I know exactly how to design it"

---

# 🎨 Part 1: Creational Patterns

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


# 🎨 Part 2: Structural Patterns

## 2.1 Adapter Pattern

### 5W1H: Deep Understanding

```
WHAT: Converts one interface into another that a client expects.
      Makes incompatible interfaces work together by wrapping.

WHY:  In real projects, you integrate third-party libraries,
      legacy systems, or APIs with interfaces YOU can't change.
      The Adapter translates between your interface and theirs.

ANALOGY — POWER ADAPTER:
  US plug (110V, flat pins) can't fit European socket (220V, round pins).
  An adapter sits between them, translating the connection.
  The plug doesn't change. The socket doesn't change.
  The ADAPTER makes them compatible.

HOW IT WORKS INTERNALLY:
  1. You have a TARGET interface (what your code expects)
  2. You have an ADAPTEE class (incompatible third-party code)
  3. You create an ADAPTER that: implements TARGET, wraps ADAPTEE
  4. Adapter translates method calls from TARGET → ADAPTEE

REAL-WORLD EXAMPLES:
  • Arrays.asList() — adapts array to List interface
  • InputStreamReader — adapts InputStream (bytes) to Reader (chars)
  • Spring's HandlerAdapter — adapts different controller types
  • JDBC Driver — adapts database-specific protocol to JDBC API
```

💡 **ANALOGY: Travel Power Adapter**
- US plug (110V) → Adapter → European socket (220V)
- The adapter makes incompatible things work together



🔬 **Section Challenge — 2.1 Adapter Pattern**

**Challenge 1 (Design — Who/When/What):** The real-world examples list `Arrays.asList()` as an Adapter. **Who** is the adaptee? **What** interface does it adapt TO? **What** surprising limitation does this specific adapter have?

<details><summary>Answer</summary>

**Adaptee:** A raw Java array (`T[]`). **Adapts to:** `List<T>` interface. **Limitation:** The returned List is a FIXED-SIZE wrapper — it's backed by the original array. `list.add("new")` throws `UnsupportedOperationException`. `list.set(0, "updated")` works (modifies the original array). This is a classic adapter trade-off: it makes the array LOOK like a List, but doesn't give you ALL List behaviors. The adapter's contract is "interface compatibility", not "full functionality."

</details>


## 2.2 Decorator Pattern

### 5W1H: Deep Understanding

```
WHAT: Attaches additional responsibilities to an object DYNAMICALLY.
      Provides flexible alternative to subclassing.

WHY:  Subclassing creates a COMBINATORIAL EXPLOSION.
      If you have 3 features (milk, sugar, whip cream) for coffee:
      CoffeeWithMilk, CoffeeWithSugar, CoffeeWithMilkAndSugar,
      CoffeeWithMilkAndWhip, CoffeeWithSugarAndWhip,
      CoffeeWithMilkAndSugarAndWhip... = 7 subclasses!
      Each new feature DOUBLES the number of classes.

      Decorators compose features at RUNTIME:
      new WhipDecorator(new SugarDecorator(new MilkDecorator(coffee)))
      Add/remove features without creating new classes.

HOW IT WORKS INTERNALLY:
  1. Decorator implements the SAME interface as the wrapped object
  2. Decorator holds a REFERENCE to the wrapped object
  3. Decorator DELEGATES to the wrapped object for base behavior
  4. Decorator adds its OWN behavior before/after delegation
  5. Decorators can be STACKED (decorator wrapping decorator)

ANALOGY — COFFEE SHOP:
  Base: Plain Coffee ($2)
  + MilkDecorator: delegates to coffee.cost() + $0.50
  + SugarDecorator: delegates to milk.cost() + $0.25
  Total: Sugar calls Milk calls Coffee = $2 + $0.50 + $0.25 = $2.75

REAL-WORLD:
  • Java I/O: BufferedReader(InputStreamReader(FileInputStream(file)))
    Three decorators wrapping each other!
  • Spring: @Transactional = TransactionInterceptor DECORATING your service
  • Collections.unmodifiableList() = decorator that throws on modification
```



🔬 **Section Challenge — 2.2 Decorator Pattern**

**Challenge 1 (Design — Who/When/What):** The code shows `EncryptionDecorator` and `CompressionDecorator` wrapping `FileDataSource`. **Why** not just use inheritance: `EncryptedCompressedFileDataSource extends FileDataSource`? **When** does Decorator beat inheritance?

<details><summary>Answer</summary>

**Inheritance explosion:** With 3 features (encrypt, compress, cache), inheritance needs 2³ = 8 classes: `EncryptedFile`, `CompressedFile`, `CachedFile`, `EncryptedCompressedFile`, `EncryptedCachedFile`... Adding a 4th feature → 16 classes. **Decorator:** 4 decorator classes, composed in any combination at RUNTIME. `new CacheDecorator(new EncryptionDecorator(source))` — no new classes needed. **When Decorator wins:** When behaviors are optional, combinable, and need to be applied/removed dynamically. **When Inheritance wins:** When the relationship IS-A (a Dog IS an Animal) and the behavior is fixed at compile time.

</details>


## 2.3 Facade Pattern

### 5W1H: Deep Understanding

```
WHAT: Provides a SIMPLIFIED INTERFACE to a complex subsystem.
      Hides complexity behind a simple API.

WHY:  Complex systems have dozens of classes that interact.
      A client shouldn't need to understand ALL of them.
      Facade provides a SINGLE entry point.

ANALOGY — UNIVERSAL REMOTE:
  TV: power(), selectInput(), setVolume(), setBrightness()
  SoundSystem: power(), setEqualizer(), selectSource()
  BluRayPlayer: power(), insertDisc(), play()
  Lights: dim(), setColor()

  Facade (Remote "Watch Movie" button):
  watchMovie() { lights.dim(); tv.power(); soundSystem.power();
                 tv.selectInput(HDMI); bluray.play(); }

  One call replaces 6 calls. Client doesn't know the subsystem.

REAL-WORLD:
  • Spring Boot itself is a Facade over Spring Framework!
    One annotation @SpringBootApplication hides:
    @Configuration + @EnableAutoConfiguration + @ComponentScan
  • SLF4J is a Facade over various logging frameworks
  • JDBC is a Facade over database-specific protocols
```

---



🔬 **Section Challenge — 2.3 Facade Pattern**

**Challenge 1 (Reasoning — Who/When/What):** Spring Boot is called a "Facade over Spring Framework." **Who** is hidden behind the facade? **What** does `@SpringBootApplication` actually do under the hood?

<details><summary>Answer</summary>

**Who is hidden?** Three complex subsystems: (1) `@Configuration` — marks class as a bean definition source, (2) `@EnableAutoConfiguration` — triggers Spring Boot's auto-configuration based on classpath, (3) `@ComponentScan` — scans for `@Component`/`@Service`/`@Repository` in the package tree. **What does it do?** One annotation replaces 3 annotations + XML config + manual bean registration. The developer just writes `@SpringBootApplication` (one facade call) instead of understanding the 3 subsystems individually.

</details>


# 🎨 Part 3: Behavioral Patterns

## 3.1 Observer Pattern

### 5W1H: Deep Understanding

```
WHAT: Defines a one-to-many dependency between objects so that when
      one object (Subject) changes state, all its dependents (Observers)
      are notified and updated automatically.

WHY:  Without Observer, objects must POLL for changes:
      while (true) { if (subject.hasChanged()) update(); sleep(100); }
      This wastes CPU and misses changes between polls.
      Observer uses PUSH: subject notifies observers immediately.

ANALOGY — YOUTUBE SUBSCRIPTION:
  YouTuber = Subject (observable)
  Subscribers = Observers
  When YouTuber uploads a video → ALL subscribers get notified.
  You can subscribe (register) and unsubscribe (deregister) anytime.
  YouTuber doesn't need to know WHO the subscribers are.

HOW IT WORKS INTERNALLY:
  1. Subject maintains a List<Observer> (subscribers)
  2. Observer interface has update(data) method
  3. Subject.addObserver(observer) → adds to list
  4. Subject.setState(newState) → iterates list, calls observer.update()
  5. Each observer reacts independently to the notification

REAL-WORLD:
  • React's useState: when state changes, component re-renders (observes state)
  • Spring's ApplicationEventPublisher / @EventListener
  • JavaScript: addEventListener/removeEventListener
  • Message Queues (Kafka, RabbitMQ): producers and consumers
  • MVC: Model (subject) notifies View (observer) on data change

VARIANTS:
  Push model: Subject sends data WITH notification (observer.update(data))
  Pull model: Subject sends notification only, observer PULLS data
  Pub/Sub: Adds a message broker between subject and observer
```

💡 **ANALOGY: Newsletter Subscription**
- You subscribe to a newsletter
- When new content is published, all subscribers get notified
- Subscribers can unsubscribe anytime



🔬 **Section Challenge — 3.1 Observer Pattern**

**Challenge 1 (Design — Who/When/What):** The variants section mentions Push vs Pull model. **When** would you choose Pull over Push? **What** is the problem with Push when observers need different data subsets?

<details><summary>Answer</summary>

**Push problem:** Subject sends ALL data to ALL observers. If Observer A only needs `price` and Observer B only needs `volume`, Push sends both fields to both — wasting bandwidth and coupling observers to the full data model. Adding a new field forces all observers to update. **Pull model:** Subject sends just a notification ("I changed"). Each observer calls back to get only the specific data it needs: `subject.getPrice()`. Observers are decoupled from each other's data needs. **When Pull?** When observers need different data subsets. **When Push?** When all observers need the same small payload and you want to minimize round trips.

</details>


## 3.2 Strategy Pattern

### 5W1H: Deep Understanding

```
WHAT: Defines a family of algorithms, encapsulates each one, and makes
      them INTERCHANGEABLE. Lets the algorithm vary independently.

WHY:  Without Strategy, you get a massive if-else chain:
      if (type == CREDIT) { ... }
      else if (type == PAYPAL) { ... }
      else if (type == BITCOIN) { ... }
      Adding a new payment method = modifying existing code (violates OCP)

      With Strategy: paymentStrategy.pay(amount);
      Adding UPI? Create new UPIPayment implementing PaymentStrategy.
      ZERO changes to existing code.

ANALOGY — NAVIGATION APP:
  Destination: same (office to home)
  Strategy 1: by car (fastest route, consider traffic)
  Strategy 2: by walk (shortest path, no highways)
  Strategy 3: by bus (cheapest, follows bus routes)
  The APP (context) doesn't know the routing algorithm.
  It DELEGATES to the chosen strategy.

HOW IT WORKS INTERNALLY:
  1. Strategy INTERFACE defines the algorithm contract: execute(input)
  2. ConcreteStrategy A, B, C each implement the interface differently
  3. Context class holds a Strategy REFERENCE (composition, not inheritance)
  4. Context delegates work to the strategy: strategy.execute(input)
  5. Client can SWAP strategies at runtime: context.setStrategy(new B())

STRATEGY vs STATE:
  Strategy: client CHOOSES the algorithm (user selects sort method)
  State: object TRANSITIONS between algorithms automatically
        (order goes from Pending → Shipped → Delivered)

REAL-WORLD:
  • Collections.sort(list, comparator) — Comparator IS a Strategy
  • Spring's AuthenticationProvider — different auth strategies
  • Java's ScheduledExecutorService — different scheduling strategies
```

💡 **ANALOGY: Navigation App**
- Same destination, different strategies: Car, Walk, Bike, Transit
- You choose the strategy, app calculates route using that strategy
- Strategies are interchangeable



🔬 **Section Challenge — 3.2 Strategy Pattern**

**Challenge 1 (Reasoning):** Strategy vs State: both swap behavior. The section says "Strategy: client CHOOSES, State: object TRANSITIONS." **Who** decides the algorithm in each case? Give one example where confusing them causes a bug.

<details><summary>Answer</summary>

**Strategy:** The CLIENT (external code) explicitly picks: `cart.setPaymentStrategy(new PayPalPayment())`. The object doesn't change strategy on its own. **State:** The OBJECT internally transitions: `order.ship()` changes state from PAID → SHIPPED. The client doesn't set the state directly. **Bug from confusion:** If you implement a vending machine with Strategy (client picks state), the machine could go from DISPENSING → ACCEPTING_MONEY — skipping MAKING_CHANGE. With State pattern, the machine enforces valid transitions: only DISPENSING → MAKING_CHANGE → IDLE. Invalid transitions throw exceptions.

</details>


## 3.3 Command Pattern

### 5W1H: Deep Understanding

```
WHAT: Encapsulates a request as an OBJECT, allowing you to parameterize
      clients, queue requests, log operations, and support undo/redo.

WHY:  Sometimes you need to:
      • UNDO an operation (Ctrl+Z in text editor)
      • QUEUE operations for later execution (job queue)
      • LOG all operations for audit trail
      • RETRY failed operations
      None of this is possible if the operation is just a method call.
      By turning the operation into an OBJECT, it becomes data you can
      store, queue, replay, and reverse.

ANALOGY — RESTAURANT ORDER:
  Customer → "I want pasta" (creates a command)
  Waiter writes it on paper (Command object with all details)
  Takes it to kitchen (passes to Invoker)
  Chef executes the order (Receiver executes command)
  Paper slip can be: queued, logged, undone ("cancel that pasta")

HOW IT WORKS INTERNALLY:
  1. Command interface: execute(), undo()
  2. ConcreteCommand: stores Receiver + parameters for the action
  3. Invoker: calls command.execute() (button, menu, scheduler)
  4. Receiver: the object that actually does the work
  5. History stack: stores executed commands for undo/redo

REAL-WORLD:
  • Text editor undo/redo (each keystroke = command)
  • Transaction rollback in databases
  • Spring's TaskExecutor — commands queued for thread pool
  • GUI buttons — each button has a Command object
```

💡 **ANALOGY: Restaurant Order**
- Waiter writes order on paper (Command object)
- Takes it to kitchen (passes to invoker)
- Chef executes the order (receiver)
- Order can be queued, logged, undone

---



🔬 **Section Challenge — 3.3 Command Pattern**

**Challenge 1 (Trace — Who/When/What):** In a text editor's undo system: you type "Hello", then Ctrl+Z. Trace the Command lifecycle. **Who** creates the command? **When** is it stored? **What** does `undo()` actually do vs `execute()`?

<details><summary>Answer</summary>

**Who creates?** The key handler: when you type 'H', it creates `new InsertCharCommand('H', position)`. **When stored?** Immediately after `execute()`: the command is pushed onto a history stack. **What does undo() do?** The INVERSE operation. `execute()` inserts 'H' at position 5 → `undo()` deletes character at position 5. For "Hello" (5 commands on stack), Ctrl+Z pops the top command (`InsertCharCommand('o', 9)`) and calls `undo()` — deleting 'o'. The text becomes "Hell". Each command encapsulates both the DO and UNDO logic.

</details>


# 🎨 Part 4: Pattern Combinations

**Example: E-commerce Order System using Multiple Patterns**

| Pattern | Role |
|---------|------|
| **Singleton** | Configuration, Database connection |
| **Factory** | Creating different order types |
| **Builder** | Building complex Order objects |
| **Observer** | Notifying systems when order status changes |
| **Strategy** | Different payment methods |
| **Decorator** | Adding features to orders (gift wrap, insurance) |

```java
// 1. SINGLETON - Configuration
public enum AppConfig {
    INSTANCE;
    public String getDatabaseUrl() { return "jdbc:mysql://..."; }
}
```

```java
// 2. BUILDER - Complex Order Creation
public class Order {
    public static class Builder {
        private List<OrderItem> items = new ArrayList<>();
        private Address shippingAddress;
        private PaymentStrategy paymentStrategy;
        // ... builder methods
    }
}
```

```java
// 3. FACTORY - Order Types
public class OrderFactory {
    public static Order createOrder(String type, Order.Builder builder) {
        switch (type) {
            case "regular": return builder.build();
            case "express": return new ExpressOrder(builder);
            case "subscription": return new SubscriptionOrder(builder);
        }
    }
}
```

```java
// 4. OBSERVER - Order Status Updates
public class Order implements Subject {
    private List<OrderObserver> observers = new ArrayList<>();

    public void setStatus(OrderStatus status) {
        this.status = status;
        notifyObservers(); // Notify inventory, shipping, customer
    }
}
```

```java
// 5. STRATEGY - Payment
public class Order {
    private PaymentStrategy paymentStrategy;

    public void processPayment() {
        paymentStrategy.pay(getTotal());
    }
}
```

```java
// 6. DECORATOR - Add Features
public interface Order {
    double getTotal();
}

public class GiftWrapDecorator extends OrderDecorator {
    @Override
    public double getTotal() {
        return order.getTotal() + 5.99; // Gift wrap cost
    }
}
```

**All patterns working together:**

```java
Order order = OrderFactory.createOrder("express",
    Order.builder()
        .addItem(new OrderItem("Laptop", 999))
        .shippingAddress(address)
        .paymentStrategy(new CreditCardPayment(card))
        .build());

order.subscribe(new InventoryService());
order.subscribe(new NotificationService());

order = new GiftWrapDecorator(order); // Add gift wrap
order = new InsuranceDecorator(order); // Add insurance

order.processPayment(); // Uses strategy
order.setStatus(OrderStatus.PAID); // Notifies observers
```

---

# 📖 Part 5: Quick Reference Table


| Pattern | Use When |
|---------|----------|
| **Singleton** | Need exactly one instance (config, logger, connection pool) |
| **Factory** | Create objects without specifying exact class |
| **Builder** | Complex object with many optional parameters |
| **Adapter** | Make incompatible interfaces work together |
| **Decorator** | Add behavior dynamically without changing original |
| **Facade** | Simplify complex subsystem with single interface |
| **Observer** | One-to-many notification when state changes |
| **Strategy** | Swap algorithms at runtime |
| **Command** | Need undo/redo, queue operations, log operations |
| **State** | Object behavior depends on its state |
| **Template** | Define algorithm skeleton, let subclasses fill steps |
| **Composite** | Tree structure of objects (file system, UI components) |
| **Proxy** | Control access, lazy loading, caching |


---

# 💪 Curated Practice Problems — OOP & Design Patterns

**HOW TO USE**: These are system design / OOP implementation problems.
Section 1 = implement data structures using OOP. Section 2 = apply design patterns.
Section 3 = LeetCode design class problems.

---

## Section 1: OOP Implementation — Build From Scratch

| # | Problem | Platform | Difficulty | Key Technique |
|---|---------|----------|------------|---------------|
| 1 | Design HashMap (LC 706) | LeetCode | Easy | Array of buckets + chaining |
| 2 | Design HashSet (LC 705) | LeetCode | Easy | Boolean bucket or linked list |
| 3 | Min Stack (LC 155) | LeetCode | Medium | Two stacks or store (val, min) pairs |
| 4 | Implement Queue using Stacks (LC 232) | LeetCode | Easy | Two stacks: push/pop inversion |
| 5 | Implement Stack using Queues (LC 225) | LeetCode | Easy | Push costly or pop costly |
| 6 | Design Linked List (LC 707) | LeetCode | Medium | Sentinel nodes, doubly linked |
| 7 | Design Circular Queue (LC 622) | LeetCode | Medium | Array with front/rear pointers |
| 8 | Design Circular Deque (LC 641) | LeetCode | Medium | Extend circular queue both ends |

---

## Section 2: Design Class Problems (Strategy/Observer/Iterator)

| # | Problem | Platform | Difficulty | Key Technique |
|---|---------|----------|------------|---------------|
| 1 | LRU Cache (LC 146) | LeetCode | Medium | HashMap + Doubly Linked List |
| 2 | LFU Cache (LC 460) | LeetCode | Hard | HashMap + frequency buckets |
| 3 | Iterator for Combination (LC 1286) | LeetCode | Medium | Iterator pattern, precompute or lazy |
| 4 | Flatten Nested List Iterator (LC 341) | LeetCode | Medium | Stack + recursive flatten |
| 5 | Peeking Iterator (LC 284) | LeetCode | Medium | Decorator pattern on iterator |
| 6 | Design Twitter (LC 355) | LeetCode | Medium | OOP: User, Tweet, Feed (merge k) |
| 7 | Design Browser History (LC 1472) | LeetCode | Medium | Command pattern / doubly linked |
| 8 | Design Underground System (LC 1396) | LeetCode | Medium | HashMap tracking check-in/out |

---



🔬 **Section Challenge — Section 2: Design Class Problems**

**Challenge 1 (Design — Who/When/What):** LRU Cache (LC 146) uses HashMap + Doubly Linked List. **Why** can't you use HashMap alone? **What** operation becomes O(n) without the linked list? **Who** maintains the eviction order?

<details><summary>Answer</summary>

**HashMap alone:** `get()` and `put()` are O(1), but **eviction** (finding the LEAST recently used key) requires scanning ALL entries to find the oldest access time → O(n). **What operation?** `evict()`. **The linked list** maintains access order: most recently accessed node moves to HEAD, least recently used stays at TAIL. Eviction = remove TAIL → O(1). **Who maintains order?** Every `get()` and `put()` call moves the accessed node to HEAD. The HashMap provides O(1) lookup; the linked list provides O(1) ordering. Together: O(1) for all operations.

</details>


## Section 3: Advanced Design

| # | Problem | Platform | Difficulty | Key Technique |
|---|---------|----------|------------|---------------|
| 1 | Serialize and Deserialize Binary Tree (LC 297) | LeetCode | Hard | Preorder + null markers |
| 2 | Design Add and Search Words (LC 211) | LeetCode | Medium | Trie + DFS for wildcard |
| 3 | Implement Trie (LC 208) | LeetCode | Medium | Array[26] children nodes |
| 4 | Design File System (LC 1166) | LeetCode | Medium | Trie or HashMap of paths |
| 5 | Design Hit Counter (LC 362) | LeetCode | Medium | Queue or circular buffer |
| 6 | Insert Delete GetRandom O(1) (LC 380) | LeetCode | Medium | ArrayList + HashMap swap trick |
| 7 | Find Median from Data Stream (LC 295) | LeetCode | Hard | Two heaps (maxHeap + minHeap) |

---



🔬 **Section Challenge — Section 3: Advanced Design**

**Challenge 1 (Reasoning — Who/When/What):** Trie (LC 208) vs HashMap for word lookup. Both give O(L) lookup for a word of length L. **When** does Trie win? **What** operation is impossible with HashMap alone?

<details><summary>Answer</summary>

**When Trie wins:** Prefix search. `startsWith("app")` in a Trie traverses 3 nodes → O(3). With HashMap, you'd scan ALL keys checking `key.startsWith("app")` → O(n×L). **Impossible operation:** Efficient prefix enumeration. Finding all words starting with "pre" requires visiting the "pre" subtree. HashMap has no notion of shared prefixes. **Trade-off:** Trie uses more memory (26 pointers per node) but enables prefix operations. HashMap is more space-efficient for exact lookups.

</details>


## HIDDEN GEMS — Design Problems

| # | Problem | Platform | Why It's Valuable |
|---|---------|----------|-------------------|
| 1 | Design Parking System (LC 1603) | LeetCode | Simplest OOP design — good warm-up |
| 2 | Design an Ordered Stream (LC 1656) | LeetCode | Pointer advancement pattern |
| 3 | Snapshot Array (LC 1146) | LeetCode | Binary search on version history |
| 4 | Time Based Key-Value Store (LC 981) | LeetCode | TreeMap or binary search on timestamps |
| 5 | Online Stock Span (LC 901) | LeetCode | Monotonic stack as internal state |

---


---



🔬 **Section Challenge — HIDDEN GEMS — Design Problems**

**Challenge 1 (Debug — Who/When/What):** Snapshot Array (LC 1146) stores version history. If you call `snap()` after every `set()`, **what** is the space complexity? **When** does this become a problem? **What** optimization reduces space?

<details><summary>Answer</summary>

**Space:** O(n × snapshots) — storing full array copy per snapshot. With 10K elements and 10K snapshots = 100M entries. **When problematic?** Frequent snapshots with sparse modifications. If you change 1 element but snap the entire array, 9,999 unchanged values are duplicated. **Optimization:** Store only CHANGES per snapshot: `TreeMap<snapId, value>` at each index. `get(index, snapId)` uses `floorEntry(snapId)` to find the most recent value ≤ snapId. Space: O(total set operations) instead of O(n × snaps).

</details>


