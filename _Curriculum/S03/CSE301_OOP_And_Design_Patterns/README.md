# CSE301 — OOP & Design Patterns

## Semester 3 · Full-Stack Foundation

> **Total estimated time:** ~130 hours (16 weeks, ~8h/week)
> **Outcome:** You can refactor a legacy codebase using SOLID, recognize when a GoF pattern is the right tool (and when it's accidental complexity), and conduct LLD interviews from a position of derivation, not memorization.
> **Capstone:** Refactor a real-world legacy module (parking lot, BookMyShow, ride-share) end-to-end using SOLID + 3-5 patterns. Defend every pattern choice in writing.

---

## Navigation

| Course                                                                | Description |
| --------------------------------------------------------------------- | ----------- |
| **CSE301 — OOP & Design Patterns**                                    | This course |
| **[CSE302 — Databases & SQL](../CSE302_Databases_And_SQL/README.md)** | S03 sibling |
| **[CSE303 — Theory of Computation](../CSE303_Theory_Of_Computation/README.md)** | S03 sibling |
| **[CSE304 — Numerical Methods](../CSE304_Numerical_Methods/README.md)** | S03 sibling |

| Related Modules                                       | Cross-Reference                                            |
| ----------------------------------------------------- | ---------------------------------------------------------- |
| `06_OOP_Design/`                                      | Primary source — every chapter cited below                 |
| `07_Modern_Java/`                                     | Spring DI uses these patterns; required for Unit 6-7       |
| `10_Enterprise_Systems/`                              | DDD, bounded contexts, aggregate roots                     |
| `14_Mental_Models/`                                   | Decision frameworks for pattern selection                  |
| `20_Interview_Mastery/`                               | LLD + System Design interview questions and rubrics        |

---

## Prerequisites

- `CSE102 Programming Fundamentals` — Java syntax + classes
- `CSE201 Data Structures` — for the LLD problems (parking lot uses queues, BookMyShow uses trees)
- `06_OOP_Design/01_OOPS_Principles.md` §1-2 — encapsulation/inheritance/polymorphism baseline

**Constraint:** This course is NOT memorizing the 23 GoF patterns. It is learning to RECOGNIZE when a pattern is the right answer to a constraint. A learner who memorizes patterns and applies them everywhere creates worse code than one who knows zero patterns and writes clear procedural code.

---

## 🗓️ Week-by-Week Plan

### UNIT 1 — OOP Foundations (Weeks 1–2)

**Learning Outcomes:**

- Distinguish encapsulation from data hiding (they are not the same)
- Apply composition over inheritance with concrete refactoring exercises
- Reason about Liskov Substitution from the FAILURE direction (Boeing 737 MAX case study)

---

#### Week 1 — Encapsulation, Inheritance, Polymorphism

| Day | Topic                                  | Read                                              | Do                                                       |
| --- | -------------------------------------- | ------------------------------------------------- | -------------------------------------------------------- |
| 1   | Encapsulation — what to hide and why   | `06_OOP_Design/01_OOPS_Principles.md` §1-2        | Find encapsulation violations in a sample codebase       |
| 2   | Inheritance hierarchies — when to use  | `06_OOP_Design/01_OOPS_Principles.md` §3          | Trace: why does `Rectangle ↔ Square` violate LSP?        |
| 3   | Polymorphism — runtime vs compile-time | `06_OOP_Design/01_OOPS_Principles.md` §4          | Write Java code where method overriding goes wrong       |
| 4   | Composition over inheritance           | `06_OOP_Design/01_OOPS_Principles.md` §5          | Refactor a Vehicle inheritance tree to composition       |
| 5   | Lab + Review                           | —                                                 | Lab: refactor `Bird → FlyingBird, NonFlyingBird` problem |
| 6–7 | Review + Problem Set OOP-PS1           | —                                                 | `06_OOP_Design/06b_PROBLEM_SETS.md` PS-1                  |

**Section Challenge (Liskov Substitution failure):**

> A `Bird` class has a `fly()` method. You add `Penguin extends Bird`. Penguins can't fly, so you throw `UnsupportedOperationException`. Now your `feedBirdsInZoo(List<Bird>)` method crashes whenever it encounters a Penguin. What does this reveal about the design, and what is the actual fix?

<details>
<summary>Answer</summary>

```
WHAT WENT WRONG:
  Liskov Substitution Principle (LSP) says: anywhere you accept a Bird,
  you must accept a Penguin (subtype) without changing behavior.
  Throwing UnsupportedOperationException CHANGES behavior — the caller
  designed for "all birds can fly" and Penguin breaks that contract.

THE NAIVE FIX (wrong):
  Add `if (bird instanceof Penguin) skip;` in every caller.
  This makes EVERY caller aware of Penguin specifically — that's the
  Open/Closed Principle violation. Every new flightless bird becomes
  a code change in every caller.

THE STRUCTURAL FIX:
  The taxonomy is wrong. `Bird` is too broad to share a `fly()` method.
  Refactor:
    interface Bird { void eat(); String getName(); }
    interface Flyable { void fly(); }
    class Eagle implements Bird, Flyable { ... }
    class Penguin implements Bird { ... } // no fly()
  Now `flyBirdsOverField(List<Flyable>)` and `feedBirdsInZoo(List<Bird>)`
  are different methods, accepting the precise capability they need.

REAL-WORLD ECHO:
  The Boeing 737 MAX MCAS system implicitly assumed all pilots
  could disable the auto-trim with a specific procedure. Some pilots
  COULDN'T (under specific stress conditions). The interface contract
  "pilot disables MCAS" was violated by reality. People died.
  Liskov violations in code are inconvenient; in physical systems
  they kill. The principle matters because it represents a real
  taxonomical truth about substitutability.
```

</details>

---

#### Week 2 — Abstraction & Coupling

| Day | Topic                                | Read                                              | Do                                                       |
| --- | ------------------------------------ | ------------------------------------------------- | -------------------------------------------------------- |
| 1   | Abstract classes vs interfaces        | `06_OOP_Design/01_OOPS_Principles.md` §6          | When does each fit? Trace 3 scenarios                    |
| 2   | Coupling — afferent and efferent     | `06_OOP_Design/01_OOPS_Principles.md` §7          | Measure coupling in a sample with ASM or JDepend         |
| 3   | Cohesion — what belongs together     | `06_OOP_Design/01_OOPS_Principles.md` §8          | Split a God Class into cohesive units                    |
| 4–5 | Lab + Review                         | —                                                 | Lab: refactor a 500-line God Class                       |
| 6–7 | Problem Set OOP-PS2                  | —                                                 | `06_OOP_Design/06b_PROBLEM_SETS.md` PS-2                  |

---

### UNIT 2 — SOLID Principles (Weeks 3–4)

**Learning Outcomes:**

- Apply each SOLID principle with before/after refactoring examples
- Recognize SRP violations via the "reasons to change" test
- Use OCP to eliminate `if-instanceof` chains via polymorphism

#### Week 3 — SRP, OCP

`06_OOP_Design/01_OOPS_Principles.md` §9-10 — Single Responsibility (production failure story: UserService doing too much), Open/Closed (discount calculator extension).

#### Week 4 — LSP, ISP, DIP

`06_OOP_Design/01_OOPS_Principles.md` §11-13 — Liskov, Interface Segregation, Dependency Inversion + IoC containers (Spring preview).

---

### UNIT 3 — Creational Patterns (Week 5)

**Learning Outcomes:**

- Implement Singleton, Factory Method, Abstract Factory, Builder, Prototype
- Recognize when each pattern is overkill vs essential

| Day | Topic                                | Read                                              | Do                                                       |
| --- | ------------------------------------ | ------------------------------------------------- | -------------------------------------------------------- |
| 1   | Singleton — thread-safe lazy init    | `06_OOP_Design/02_Design_Patterns.md` §3.1        | Implement 4 ways: eager, lazy+sync, DCL, holder; compare |
| 2   | Factory Method + Abstract Factory    | `06_OOP_Design/02_Design_Patterns.md` §3.2-3.3    | Refactor `new Logger(type)` switch to Factory            |
| 3   | Builder — when constructor explodes  | `06_OOP_Design/02_Design_Patterns.md` §3.4        | Build an immutable Email with 20 optional fields         |
| 4   | Prototype + Object Pool              | `06_OOP_Design/02_Design_Patterns.md` §3.5        | When is shallow vs deep clone correct? Demonstrate       |
| 5–7 | Review + Problem Set OOP-PS3         | —                                                 | `06_OOP_Design/06b_PROBLEM_SETS.md` PS-3                  |

---

### UNIT 4 — Structural Patterns (Week 6)

| Pattern | When                                                 | Read                                              |
| ------- | ---------------------------------------------------- | ------------------------------------------------- |
| Adapter | Convert one interface to another                     | `06_OOP_Design/02_Design_Patterns.md` §4.1        |
| Bridge  | Decouple abstraction from implementation             | `06_OOP_Design/02_Design_Patterns.md` §4.2        |
| Composite | Tree of objects treated uniformly                  | `06_OOP_Design/02_Design_Patterns.md` §4.3        |
| Decorator | Add behavior without modification (Java IO streams) | `06_OOP_Design/02_Design_Patterns.md` §4.4        |
| Facade  | Simplify complex subsystem                           | `06_OOP_Design/02_Design_Patterns.md` §4.5        |
| Flyweight | Share state to reduce memory                       | `06_OOP_Design/02_Design_Patterns.md` §4.6        |
| Proxy   | Lazy load, access control, remote                   | `06_OOP_Design/02_Design_Patterns.md` §4.7        |

---

### UNIT 5 — Behavioral Patterns (Weeks 7–8)

`06_OOP_Design/02_Design_Patterns.md` §5 — Observer, Strategy, Command, State, Template Method, Iterator, Chain of Responsibility, Mediator, Memento, Visitor, Interpreter.

---

### UNIT 6 — Low-Level Design (Weeks 9–12)

**Learning Outcomes:**

- Design class diagrams for: Parking Lot, BookMyShow, Elevator, Splitwise, LRU Cache
- Identify concurrency hazards (booking same seat by two users)
- Justify every pattern used

Read `06_OOP_Design/07_LLD_Solved_Problems.md` and work through each problem, hiding the solution.

| Week | Problem                                | Read                                              |
| ---- | -------------------------------------- | ------------------------------------------------- |
| 9    | Parking Lot                            | `06_OOP_Design/07_LLD_Solved_Problems.md` §1     |
| 10   | BookMyShow                             | `06_OOP_Design/07_LLD_Solved_Problems.md` §2     |
| 11   | Elevator system                        | `06_OOP_Design/07_LLD_Solved_Problems.md` §3     |
| 12   | Splitwise + LRU Cache                  | `06_OOP_Design/07_LLD_Solved_Problems.md` §4-5   |

---

### UNIT 7 — System Design (Weeks 13–15)

`06_OOP_Design/03_System_Design.md` — CAP theorem, consistent hashing, replication strategies, message queues, caching layers, database choices.

| Week | Topic                                | Read                                              |
| ---- | ------------------------------------ | ------------------------------------------------- |
| 13   | CAP theorem + replication            | `06_OOP_Design/03_System_Design.md` §1-2          |
| 14   | Consistent hashing + sharding        | `06_OOP_Design/03_System_Design.md` §3-4          |
| 15   | Queues, caches, search, recommendations | `06_OOP_Design/03_System_Design.md` §5-7       |

---

### Week 16 — Capstone Integration

Refactor a real-world module of your choice. Justify every pattern choice in writing.

**Capstone reference:** [`06_OOP_Design/07_LLD_Solved_Problems.md`](../../../06_OOP_Design/07_LLD_Solved_Problems.md) — extend with your own problem.

---

## Problem Sets

[`06_OOP_Design/06b_PROBLEM_SETS.md`](../../../06_OOP_Design/06b_PROBLEM_SETS.md) — 3 problem sets (SOLID, GoF patterns, LLD), each with theory + implementation parts.

## Exam Prep

- [`00_CURRICULUM/EXAM_BANK.md`](../../../00_CURRICULUM/EXAM_BANK.md) — S03 OOP section
- [`20_Interview_Mastery/`](../../../20_Interview_Mastery/) — LLD and system design interview drills
