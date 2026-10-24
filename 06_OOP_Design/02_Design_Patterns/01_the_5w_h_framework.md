# 🎨 PART 0: The 5W+H Framework

> **Navigation**: [Chapter overview](../02_Design_Patterns.md) | [Creational Patterns →](02_creational_patterns.md)
> Page 1 of 4 in **Design Patterns: Complete Guide from Scratch**


**Mental Model:** Think of Design Patterns as recipes in cooking. A recipe doesn't give you the exact ingredients in your fridge, but it gives you a proven approach to creating a specific dish. Knowing recipes makes you a master chef; you don't have to invent a new way to bake a cake from scratch every time.

| Question  | Design Patterns Context                                                                                                                                                                                                                                 |
| :-------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **WHAT**  | Reusable, language-agnostic solutions to common software design problems. They are templates or blueprints for solving issues that occur repeatedly in software architecture.                                                                           |
| **WHY**   | To prevent "reinventing the wheel." Patterns provide proven, battle-tested solutions that improve code maintainability, flexibility, and create a common vocabulary for developers (e.g., saying "I used a Singleton" conveys exact meaning instantly). |
| **WHEN**  | Used when you recognize a recurring architectural problem, foresee requirements changing, or need to structure complex interactions between many objects without creating tight coupling.                                                               |
| **WHERE** | Found entirely throughout enterprise codebases, libraries, and frameworks (Spring, React, Android SDK).                                                                                                                                                 |
| **WHO**   | Formalized by the "Gang of Four" (GoF) in their famous 1994 book, _Design Patterns: Elements of Reusable Object-Oriented Software_.                                                                                                                     |
| **HOW**   | By categorizing problems into three groups: **Creational** (how objects are made), **Structural** (how objects are composed together), and **Behavioral** (how objects communicate and delegate responsibility).                                        |

## Where It's Used in Real World

- **Frameworks (Spring)**: Extensively relies on the **Singleton** pattern (one instance per bean by default), **Factory** pattern (BeanFactory), and **Proxy** pattern (AOP and transactions).
- **UI/Frontend Development**: The DOM event listener system is a pure implementation of the **Observer** pattern.
- **Navigation Apps (Google Maps)**: Uses the **Strategy** pattern to swap between routing algorithms (driving, walking, transit) without changing the core map code.
- **Text Editors**: Implement the **Command** pattern to encapsulate every keystroke or action as an object, enabling "Undo/Redo" functionality.

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

- "I need to make curry" → Use curry recipe (known solution)
- "I need to bake" → Use baking techniques (known approach)

**In Software**:

- "I need one global config" → Use Singleton pattern
- "I need to create objects flexibly" → Use Factory pattern

**Historical Evolution**:

- 1977: Christopher Alexander - patterns in architecture
- 1987: Kent Beck & Ward Cunningham - pattern languages for object-oriented programs (OOPSLA '87)
- 1994: Gang of Four (GoF) book - 23 classic patterns (copyright page says 1995)
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

**Problem 2 — Communication**: _"I used a thing that creates objects..."_ (vague) vs _"I used the Factory pattern"_ (precise, everyone understands). Patterns give us a **common vocabulary**.

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
3. **Team Communication** — _"Use Strategy pattern here"_ — everyone instantly understands
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

💡 **Golden Rule**: _"Use patterns to SOLVE problems, not to SHOW OFF knowledge."_
Over-engineering with patterns is as bad as no patterns!

🔬 **Section Challenge — When To Use Design Patterns**

**Challenge 1 (Design):** The "Don't Use" list says "You're forcing a pattern where it doesn't fit." Give a concrete example of over-engineering with Singleton and explain **what** simpler alternative works.

<details><summary>Answer</summary>

**Over-engineering:** Making `UserValidator` a Singleton. It has no mutable state, no expensive construction, no shared resources. Making it Singleton adds: hidden global dependency, harder testing (can't create fresh instance per test), thread-safety concerns for no benefit. **Simpler alternative:** Just create a new instance: `new UserValidator().validate(user)`. Or make methods static if there's truly no state. Patterns solve COMPLEXITY — if there's no complexity, the pattern IS the complexity.

</details>

## ⭐ Growth Mindset: From Pattern User To Pattern Creator ⭐

| Level | Stage           | Milestone                                                         |
| ----- | --------------- | ----------------------------------------------------------------- |
| 1     | **Learner**     | _"I know what Singleton is"_                                      |
| 2     | **Implementer** | _"I can implement Singleton correctly"_                           |
| 3     | **Recognizer**  | _"I can identify when to use Singleton in my code"_               |
| 4     | **Combiner**    | _"I can combine multiple patterns to solve complex problems"_     |
| 5     | **Creator**     | _"I can create new patterns for recurring problems in my domain"_ |

💡 **The Truth**: GoF patterns were CREATED by observing recurring solutions! YOU can observe patterns in your domain and document them too!

## Pattern Categories

1. **Creational Patterns** — _Object Creation_
   _"HOW do I create objects?"_
   Singleton, Factory, Abstract Factory, Builder, Prototype

2. **Structural Patterns** — _Object Composition_
   _"HOW do I structure classes and objects?"_
   Adapter, Bridge, Composite, Decorator, Facade, Proxy

3. **Behavioral Patterns** — _Object Interaction_
   _"HOW do objects communicate and behave?"_
   Observer, Strategy, Command, Iterator, State, Template Method

**Quick Selection Guide**:

| Need                                          | Pattern       |
| --------------------------------------------- | ------------- |
| Only one instance                             | **Singleton** |
| Create objects without specifying exact class | **Factory**   |
| Complex object construction                   | **Builder**   |
| Convert interface                             | **Adapter**   |
| Add behavior dynamically                      | **Decorator** |
| Simplify complex subsystem                    | **Facade**    |
| Notify multiple objects                       | **Observer**  |
| Swap algorithms at runtime                    | **Strategy**  |
| Undo/Redo operations                          | **Command**   |
| Different behavior based on state             | **State**     |

🔬 **Section Challenge — Pattern Categories**

**Challenge 1 (Reasoning — Who/When/What):** The selection guide maps "Only one instance" → Singleton, "Swap algorithms" → Strategy. But **when** would you use Strategy AND Factory together? Give a real scenario.

<details><summary>Answer</summary>

Scenario: Payment processing. **Factory** selects WHICH payment processor to create based on user choice: `PaymentFactory.create("stripe")` vs `create("paypal")`. **Strategy** defines HOW each processor charges: `StripeStrategy.pay(amount)` vs `PayPalStrategy.pay(amount)`. Factory answers "which object?" Strategy answers "which algorithm?" Combined: `PaymentStrategy strategy = PaymentFactory.create(userChoice); strategy.pay(100);`. The Factory decouples object creation; the Strategy decouples algorithm selection. They solve different problems and compose naturally.

</details>

## Difficulties & Common Mistakes

1. **"Too Abstract"** — Study with REAL examples, not just UML diagrams
2. **"Don't Know When To Use"** — Learn the PROBLEM each pattern solves first
3. **"Patterns Look Similar"** — Focus on INTENT, not structure. _Factory_ = which type, _Builder_ = how to construct
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

[Chapter overview](../02_Design_Patterns.md) | [Creational Patterns →](02_creational_patterns.md)
