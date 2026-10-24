# Book Companion — OOP, Design Patterns, DDD, Stories and System Design

> **Navigation**: [Chapter index](00_INDEX.md) | [Learning path](00_LEARNING_PATH.md) | [Algorithms companion](../03_Algorithms/00_BOOK_COMPANION.md)

This page maps five books that are stored in the repository root to the pages in this folder. It does **not** reproduce the books; it tells you which chapter to read for more depth and which page here applies the idea. Chapter titles were checked against each book's table of contents.

| Book | Authors | Role in this folder |
| --- | --- | --- |
| _Head First Design Patterns_, 2nd ed. | Eric Freeman, Elisabeth Robson | Pattern intuition and the core OO design principles |
| _Growing Object-Oriented Software, Guided by Tests_ | Steve Freeman, Nat Pryce | Test-first design, mocking roles, object-oriented style |
| _Domain-Driven Design_ | Eric Evans | Domain modelling: entities, aggregates, bounded contexts |
| _User Stories Applied_ | Mike Cohn | Requirements as stories and acceptance tests |
| _Software Design Decoded: 66 Ways Experts Think_ | Marian Petre, André van der Hoek (illustrations by Yen Quach) | Habits of expert designers |

> [!NOTE]
> The files are `Head_First_Design_Patterns_…2nd_Edition.pdf`, `Growing Object-Oriented Software, Guided by Tests.pdf`, `Domain Driven Design Tackling Complexity in the Heart of Software - Eric Evans.pdf`, `User-Stories-Applied-Mike-Cohn.pdf` and `Software-design-decoded-66-ways-experts-think.pdf` in the repository root.

---

## 1. _Head First Design Patterns_ (2nd edition)

| Book chapter | Pattern or principle | Read it with |
| --- | --- | --- |
| 1 Welcome to Design Patterns | Strategy; "identify what varies", "program to an interface", "favor composition over inheritance" | [OOP Principles](01_OOPS_Principles.md), [Design Patterns](02_Design_Patterns.md) |
| 2 Keeping your Objects in the Know | Observer | [Design Patterns](02_Design_Patterns.md), [Patterns in Java](08_Design_Patterns_Java.md) |
| 3 Decorating Objects | Decorator; open/closed principle | [Patterns in Java](08_Design_Patterns_Java.md) |
| 4 Baking with OO Goodness | Factory Method, Abstract Factory; dependency inversion | [Patterns in Java](08_Design_Patterns_Java.md), [Remaining GoF Patterns](12_Remaining_GoF_Patterns.md) |
| 5 One-of-a-Kind Objects | Singleton | [Patterns in Java](08_Design_Patterns_Java.md) |
| 6 Encapsulating Invocation | Command | [Design Patterns](02_Design_Patterns.md) |
| 7 Being Adaptive | Adapter, Facade; **principle of least knowledge** | [Design Heuristics](11_Design_Heuristics.md) |
| 8 Encapsulating Algorithms | Template Method; **Hollywood principle** | [Design Heuristics](11_Design_Heuristics.md) |
| 9 Well-Managed Collections | Iterator, Composite | [Remaining GoF Patterns](12_Remaining_GoF_Patterns.md) |
| 10 The State of Things | State | [Design Patterns](02_Design_Patterns.md), [LLD Problems](07_LLD_Solved_Problems.md), [LLD Reference](13_LLD_Reference_Implementations.md) |
| 11 Controlling Object Access | Proxy | [Patterns in Java](08_Design_Patterns_Java.md) |
| 12 Patterns of Patterns | Compound patterns (MVC) | [Design Patterns](02_Design_Patterns.md) (pattern combinations) |
| 13 Patterns in the Real World | What a pattern is; pattern categories | [Design Patterns](02_Design_Patterns.md) |
| Appendix: Leftover Patterns | Bridge, Builder, Chain of Responsibility, Flyweight, Interpreter, Mediator, Memento, Prototype, Visitor | [Remaining GoF Patterns](12_Remaining_GoF_Patterns.md), [Patterns in Java](08_Design_Patterns_Java.md) |

**Use it for**: the story-driven first read of each pattern. This folder then adds Java 21 idioms (lambdas, records, sealed types) that the book's examples predate.

## 2. _Growing Object-Oriented Software, Guided by Tests_

| Book chapter | Idea | Read it with |
| --- | --- | --- |
| 2 Test-Driven Development with Objects | A web of objects; values and objects; **Tell, Don't Ask**; unit-testing collaborators with mocks | [Design Heuristics](11_Design_Heuristics.md), [System Design Fundamentals](05b_System_Design_Fundamentals.md) |
| 4 Kick-Starting the Test-Driven Cycle | **Walking skeleton**; expose uncertainty early | [System Design Fundamentals](05b_System_Design_Fundamentals.md) |
| 5 Maintaining the Test-Driven Cycle | **Start each feature with an acceptance test**; unit-test behaviour, not methods; listen to the tests | [Stories to Design](10_Stories_To_Design.md) |
| 6 Object-Oriented Style | Internals vs peers; **no "and"s, "or"s or "but"s**; object peer stereotypes; composite simpler than the sum of its parts; **context independence** | [Design Heuristics](11_Design_Heuristics.md) |
| 7 Achieving Object-Oriented Design | Communication over classification; value types; where objects come from; relationships through interfaces | [OOP Principles](01_OOPS_Principles.md), [Domain-Driven Design](09_Domain_Driven_Design_Essentials.md) |
| 10 The Walking Skeleton | Worked example | [System Design Fundamentals](05b_System_Design_Fundamentals.md) |
| 20-24 Part IV | Listening to the tests, readability, test data builders, diagnostics, flexibility | [Problem Sets](06b_PROBLEM_SETS.md), [LLD Reference](13_LLD_Reference_Implementations.md) (tests as design feedback) |
| 25-27 Part V | Testing persistence, threads and asynchronous code | [Distributed Systems](06_Distributed_Systems_Fundamentals.md) |

**Use it for**: the argument that a hard-to-test design is telling you something about its seams.

## 3. _Domain-Driven Design_ (Evans)

| Book chapter | Idea | Read it with |
| --- | --- | --- |
| 1 Crunching Knowledge | Work with domain experts to build a model | [Domain-Driven Design](09_Domain_Driven_Design_Essentials.md) |
| 2 Communication and the Use of Language | **Ubiquitous language** | [Domain-Driven Design](09_Domain_Driven_Design_Essentials.md) |
| 4 Isolating the Domain | Layered architecture | [System Design](03_System_Design.md) |
| 5 A Model Expressed in Software | Entities, value objects, services, modules | [Domain-Driven Design](09_Domain_Driven_Design_Essentials.md) |
| 6 The Life Cycle of a Domain Object | **Aggregates**, factories, repositories | [Domain-Driven Design](09_Domain_Driven_Design_Essentials.md) |
| 10 Supple Design | Intention-revealing interfaces, side-effect-free functions, assertions | [Design Heuristics](11_Design_Heuristics.md) |
| 14 Maintaining Model Integrity | **Bounded context**, context map, anticorruption layer | [Domain-Driven Design](09_Domain_Driven_Design_Essentials.md) |
| 15-17 Distillation, large-scale structure, strategy | Strategic design | Not covered here; see the book and [DDD Tactical Patterns](../10_Enterprise_Systems/01b_DDD_Tactical_Patterns.md) |

**Use it for**: the vocabulary for deciding which objects must stay consistent together and which can be eventually consistent.

## 4. _User Stories Applied_ (Cohn)

| Book chapter | Idea | Read it with |
| --- | --- | --- |
| 1 An Overview | Stories as reminders for conversations | [Stories to Design](10_Stories_To_Design.md) |
| 2 Writing Stories | **INVEST**; splitting and spikes | [Stories to Design](10_Stories_To_Design.md) |
| 6 Acceptance Testing User Stories | Tests on the back of the card | [Stories to Design](10_Stories_To_Design.md) |
| 7 Guidelines for Good Stories | Slice the cake; closed stories; keep the UI out | [Stories to Design](10_Stories_To_Design.md) |
| 8-11 Estimating and planning | Story points, release and iteration planning, velocity | Not covered here |
| 14 A Catalog of Story Smells | Common story mistakes | [Stories to Design](10_Stories_To_Design.md) (common mistakes) |

## 5. _Software Design Decoded_ (Petre, van der Hoek)

The book is organised into ten groups of observed expert habits: keep it simple; collaborate; break the rules; sketch; work with uncertainty; are not afraid; iterate; test; reflect; keep going. Examples from the first group: experts prefer simple solutions, solve simpler problems first, divide and conquer, avoid over-generalising, design elegant abstractions and use metaphor.

| Habit group | Applied in |
| --- | --- |
| Keep it simple | [OOP Principles](01_OOPS_Principles.md), [Design Heuristics](11_Design_Heuristics.md) |
| Sketch and externalise | [User & System Flows](04_User_System_Flows.md) |
| Work with uncertainty; iterate | [System Design Fundamentals](05b_System_Design_Fundamentals.md) (walking skeleton) |
| Test | [Stories to Design](10_Stories_To_Design.md) |

**Use it for**: the human side of design. It is short and works as a reflective read between the technical chapters.

## 6. Other Books in the Repository and Where They Are Used

| Book | Used in |
| --- | --- |
| _Java SE 8 Complete Book_ (Oracle) | Language reference for [Modern Java](../07_Modern_Java/00_INDEX.md) |
| _Spring Boot Reference_ | Framework mechanics in [Modern Java](../07_Modern_Java/00_INDEX.md) |
| _Competitive Programmer's Handbook_, _Programming Challenges_ | [Algorithms](../03_Algorithms/00_BOOK_COMPANION.md) |

## 7. Coverage Gaps (Honest List)

- **DDD strategic design** (distillation, large-scale structure) is only named, not taught.
- **Story estimation and release planning** (Cohn, chapters 8-11) belong to project management and are not covered.
- **Software Design Decoded** has 66 habits; this folder applies about a dozen. Read the book for the rest.
- The books use older Java (Head First uses pre-Java-8 style in places); modern equivalents are in [Patterns in Java](08_Design_Patterns_Java.md).
