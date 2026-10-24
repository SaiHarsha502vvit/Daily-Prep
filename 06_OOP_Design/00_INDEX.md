# 06 - OOP & Design

> Object-oriented principles, design patterns, domain modelling, requirements-to-design, and system design fundamentals. Chapters of 1000+ lines are **hubs**: the hub gives the overview and a table of topic pages in a same-named folder.

> **Navigation**: [Learning path](00_LEARNING_PATH.md) | [Book Companion](00_BOOK_COMPANION.md) | [← Master Index](../00_MASTER_INDEX.md)

---

## Reading Order

Follow the numbers in the first column; the [Learning Path](00_LEARNING_PATH.md) explains what each step carries in and hands off.

| Step | File | What You'll Learn | Folder of topic pages |
| ---- | ---- | ----------------- | --------------------- |
| 1 | [OOP Principles](01_OOPS_Principles.md) | Encapsulation, inheritance, polymorphism, abstraction, composition, SOLID | [01_OOPS_Principles/](01_OOPS_Principles/) |
| 2 | [Design Patterns](02_Design_Patterns.md) | GoF categories, creational, structural, behavioural, combinations | [02_Design_Patterns/](02_Design_Patterns/) |
| 3 | [Design Patterns in Java](08_Design_Patterns_Java.md) | Java implementations, JDK and Spring examples, selection guide | [08_Design_Patterns_Java/](08_Design_Patterns_Java/) |
| 4 | [Remaining GoF Patterns](12_Remaining_GoF_Patterns.md) 🆕 | Abstract Factory, Prototype, Bridge, Composite, Iterator, Visitor, Flyweight, Mediator, Memento, Interpreter | - |
| 5 | [Design Heuristics](11_Design_Heuristics.md) 🆕 | Least knowledge, tell-don't-ask, Hollywood principle, context independence | - |
| 6 | [Domain-Driven Design Essentials](09_Domain_Driven_Design_Essentials.md) 🆕 | Entities, value objects, aggregates, repositories, bounded contexts | - |
| 7 | [LLD Solved Problems](07_LLD_Solved_Problems.md) | Parking lot, movie booking, expense sharing, elevator, logger | [07_LLD_Solved_Problems/](07_LLD_Solved_Problems/) |
| 8 | [LLD Reference Implementations](13_LLD_Reference_Implementations.md) 🆕 | Compiled, tested versions of the five LLD designs with concurrency tests | - |
| 9 | [Problem Sets](06b_PROBLEM_SETS.md) | SOLID, GoF and LLD problem sets with JUnit stubs | - |
| 10 | [Stories to Design](10_Stories_To_Design.md) 🆕 | INVEST stories, acceptance tests, seams | - |
| 11 | [System Design](03_System_Design.md) | Requirements, scalability, flows, examples | [03_System_Design/](03_System_Design/) |
| 12 | [User & System Flows](04_User_System_Flows.md) | User, data and request flows; flows in code | [04_User_System_Flows/](04_User_System_Flows/) |
| 13 | [System Design Fundamentals](05b_System_Design_Fundamentals.md) | Walking skeleton, scaling primitives, failure modes | - |
| 14 | [Distributed Systems](06_Distributed_Systems_Fundamentals.md) | CAP, consistency, replication, partitioning, consensus | - |
| 15 | [SD Interview Problems](05_SD_Interview_Problems.md) | URL shortener, feed, chat, rate limiter, cache and more | - |

🆕 pages were added after auditing the folder against the books in the repository; see the [Book Companion](00_BOOK_COMPANION.md).

## Roadmap

```mermaid
flowchart LR
  subgraph OBJ["Objects and patterns"]
    A["01 OOP Principles"] --> B["02 Design Patterns"] --> C["08 Patterns in Java"] --> D["12 Remaining Patterns"]
  end
  subgraph DES["Design judgement"]
    E["11 Heuristics"] --> F["09 Domain-Driven Design"] --> G["07 LLD Problems"] --> R["13 LLD Reference"] --> H["06b Problem Sets"] --> I["10 Stories to Design"]
  end
  subgraph SYS["Systems"]
    J["03 System Design"] --> K["04 Flows"] --> L["05b Fundamentals"] --> M["06 Distributed Systems"] --> N["05 Interview Problems"]
  end
  D --> E
  I --> J
  classDef o fill:#dbeafe,stroke:#2563eb,color:#0c1a4a;
  classDef d fill:#dcfce7,stroke:#16a34a,color:#052e16;
  classDef s fill:#fef3c7,stroke:#d97706,color:#451a03;
  class A,B,C,D o;
  class E,F,G,H,I,R d;
  class J,K,L,M,N s;
```

**How to read this diagram.** Blue is the object-level track, green is design judgement (modelling and requirements), amber is system level. The two arrows between groups are the hand-offs: patterns lead to heuristics, and stories lead to system design.

## Chapter Profile

| File | Primary focus | Depth | Breadth |
| ---- | ------------- | ----- | ------- |
| 01 OOP Principles | Core pillars and SOLID | Deep | Low |
| 02 Design Patterns | GoF catalogue | Medium | Medium |
| 08 Patterns in Java | Java pattern implementations | Deep | Low |
| 12 Remaining GoF Patterns | The ten uncovered patterns | Medium | Medium |
| 11 Design Heuristics | Where behaviour belongs | Medium | Low |
| 09 Domain-Driven Design | Domain modelling | Medium | Medium |
| 07 LLD Solved Problems | Complete class designs | Deep | Medium |
| 13 LLD Reference Implementations | Compiled designs with tests | Deep | Low |
| 06b Problem Sets | Practice | Medium | Wide |
| 10 Stories to Design | Requirements to seams | Medium | Low |
| 03 System Design | HLD fundamentals | Medium | Broad |
| 04 User & System Flows | End-to-end flows | Medium | Wide |
| 05b System Design Fundamentals | Skeletons, scaling, failures | Deep | Medium |
| 06 Distributed Systems | CAP, consensus | Deep | Broad |
| 05 SD Interview Problems | Framework applied | Medium | Broad |

> [!NOTE]
> Chapters 1 and 8 carry the pure OOP depth. Chapters 10-14 trade depth for breadth; use the topic pages and the [Learning Path](00_LEARNING_PATH.md) to choose how far to go.

> [!TIP]
> Historical dates and incident summaries in this folder were checked against primary sources (papers, post-mortems, regulator reports). Scenarios without a source are labelled **illustrative**.
