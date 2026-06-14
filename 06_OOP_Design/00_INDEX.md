# 06 - OOP & Design

> Object-Oriented principles, design patterns, and system design fundamentals.

## Reading Order

| #   | File                                                          | What You'll Learn                                     |
| --- | ------------------------------------------------------------- | ----------------------------------------------------- |
| 1   | [OOP Principles](01_OOPS_Principles.md)                       | Encapsulation, inheritance, polymorphism, abstraction |
| 2   | [Design Patterns](02_Design_Patterns.md)                      | GoF patterns: creational, structural, behavioral      |
| 3   | [System Design](03_System_Design.md)                          | HLD fundamentals, scalability, load balancing         |
| 4   | [User System Flows](04_User_System_Flows.md)                  | End-to-end flow: login, checkout, payment             |
| 5   | [SD Interview Problems](05_SD_Interview_Problems.md)          | URL shortener, Twitter, Netflix design                |
| 6   | [Distributed Systems](06_Distributed_Systems_Fundamentals.md) | CAP theorem, consensus, replication                   |
| 7   | [LLD Solved Problems](07_LLD_Solved_Problems.md)              | Low-level design: parking lot, elevator               |
| 8   | [Design Patterns Java](08_Design_Patterns_Java.md)            | Java implementations of design patterns               |

## Roadmap

```
OOP Principles → Design Patterns → System Design → Interview Problems
                       ↓
            Distributed Systems → LLD Problems
```

## PLUS Enhancements

### Chapter Dependency Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        06_OOP_Design — Chapter Flow                         │
└─────────────────────────────────────────────────────────────────────────────┘

  ┌───────────────────┐
  │ 01_OOPS_Principles │◀──── ENTRY POINT (fundamentals)
  │  Encapsulation     │
  │  Inheritance       │
  │  Polymorphism      │
  │  Abstraction       │
  │  SOLID             │
  └────────┬──────────┘
           │ builds-on
           ▼
  ┌───────────────────┐
  │ 02_Design_Patterns │   GoF catalog
  │  Creational        │
  │  Structural        │
  │  Behavioral        │
  └────────┬──────────┘
           │ extends
           ▼
  ┌───────────────────┐
  │ 03_System_Design   │   HLD fundamentals
  │  Scalability       │
  │  Load Balancing    │
  └────────┬──────────┘
           │ combines
           ▼
  ┌───────────────────┐
  │ 04_User_System_    │   End-to-end flows
  │     Flows          │   Login, checkout, payment
  └────────┬──────────┘
           │
           ▼
  ┌───────────────────┐
  │ 05_SD_Interview_   │   LLD/HLD interview
  │     Problems       │   problems
  └────────┬──────────┘
           │
     ┌─────┴──────┐
     ▼            ▼
┌─────────────────────┐    ┌─────────────────────────────┐
│ 06_Distributed_     │    │ 07_LLD_Solved_Problems      │
│  Systems_Fundamentals│    │  Parking lot, elevator      │
│  CAP, consensus     │    │  Low-level design           │
└──────────┬──────────┘    └──────────────┬──────────────┘
           │                             │
           ▼                             (converge at)
┌─────────────────────────────┐
│ 08_Design_Patterns_Java     │   Java-specific
│  Factory, Builder, Proxy    │   implementations
└─────────────────────────────┘
```

### Breadth vs Depth Comparison by Chapter

| #   | File                     | Primary Focus            | Depth           | Breadth         | OOP Concept Weight | Pattern Weight |
| --- | ------------------------ | ------------------------ | --------------- | --------------- | ------------------ | -------------- |
| 1   | 01_OOPS_Principles       | Core OOP pillars + SOLID | ⭐⭐⭐⭐⭐ Deep | Low             | 100%               | 0%             |
| 2   | 02_Design_Patterns       | GoF catalog              | ⭐⭐⭐⭐ Medium | Medium          | 30%                | 70%            |
| 3   | 03_System_Design         | HLD, scalability         | ⭐⭐⭐ Medium   | ⭐⭐⭐⭐ Broad  | 10%                | 20%            |
| 4   | 04_User_System_Flows     | End-to-end flows         | ⭐⭐⭐ Medium   | ⭐⭐⭐⭐⭐ Wide | 20%                | 30%            |
| 5   | 05_SD_Interview_Problems | Interview prep           | ⭐⭐⭐ Medium   | ⭐⭐⭐⭐ Broad  | 30%                | 30%            |
| 6   | 06_Distributed_Systems   | CAP, consensus           | ⭐⭐⭐⭐ Deep   | ⭐⭐⭐⭐ Broad  | 5%                 | 15%            |
| 7   | 07_LLD_Solved_Problems   | LLD implementation       | ⭐⭐⭐⭐⭐ Deep | Medium          | 50%                | 40%            |
| 8   | 08_Design_Patterns_Java  | Java pattern impl        | ⭐⭐⭐⭐ Deep   | Low             | 20%                | 80%            |

**Key insight**: Chapter 1 (OOP Principles) is the only chapter with pure depth on fundamentals. Chapters 7-8 are where depth + breadth combine for interview mastery. Chapters 3-5 trade depth for breadth over the full system design landscape.

---

[← Back to Master Index](../00_MASTER_INDEX.md)
