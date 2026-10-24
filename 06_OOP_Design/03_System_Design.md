# 🏗️ System Design & Feature Creation Guide

> **Navigation**: [← From User Stories to Design…](10_Stories_To_Design.md) | [Chapter index](00_INDEX.md) | [Understanding User Flows & System… →](04_User_System_Flows.md)

## From User Needs to Working Systems

---

## 🔗 Bridge — Where This Chapter Fits

| Dimension | This chapter |
| --- | --- |
| **Builds on** | [OOP Principles](01_OOPS_Principles.md), [Design Patterns](02_Design_Patterns.md), [Hash tables](../02_Data_Structures/01e_HashTable.md) |
| **You will learn** | Requirements, user and data flows, feature creation, OOP vs functional design, and system-design patterns with worked examples |
| **Leads to** | [User & System Flows](04_User_System_Flows.md), [SD Interview Problems](05_SD_Interview_Problems.md) |
| **Abstraction level** | Classes in one process → **components and data flows** → **a system that meets scale and reliability requirements** |

> [!NOTE]
> The full gap-free reading order and dependency graph are in the [Learning Path](00_LEARNING_PATH.md).

---

## 💬 Explain It Like a Study Partner — System Design Basics

### 1. The bottom line

Start from requirements and numbers, draw the flow of data, then pick the simplest components that meet the load.

### 2. The textbook core

- Clarify functional and non-functional requirements (latency, availability, consistency, scale).
- Estimate load with back-of-envelope arithmetic.
- Draw the request path and the data path.
- Pick storage and caching to match access patterns.
- Name the trade-off for every choice.

### 3. The real-world analogy

Planning a **city road network**: first count the traffic, then decide where the highways, junctions and bypasses go.

### 4. Walkthrough

1. Requirement: 10 million reads per day.
2. That is roughly 115 reads per second on average; peak might be 5-10 times higher.
3. One database can serve that with a cache for hot keys.
4. Add replicas only when measurements show the limit.
5. Write down what you traded: complexity, staleness, cost.

> [!NOTE]
> **Quick check:** Why estimate numbers before choosing components? *Because the numbers decide whether one node is enough or sharding is justified.*

### 5. Check yourself

**Q1.** 10 million requests per day is about how many requests per second on average?

<details><summary>Answer</summary>

10,000,000 / 86,400 ≈ **116 requests per second** (peaks are higher).

</details>

**Q2.** A recovery tool depends on the same network it must repair. Which design principle does this violate?

<details><summary>Answer</summary>

**Independent failure domains**: the recovery path should not share failure modes with the system it recovers.

</details>

---


## 📚 Topic Pages in This Chapter

This chapter is split into focused pages so each topic can be read on its own. Read them in order the first time; use the table to jump back later.

| # | Page | What is inside | Lines |
| --- | --- | --- | --- |
| 1 | [Complete Understanding of System Design](03_System_Design/01_complete_understanding_of_system_design.md) | Complete Understanding of System Design | 222 |
| 2 | [Understanding User Flows](03_System_Design/02_understanding_user_flows.md) | Understanding User Flows · Feature Creation Framework | 196 |
| 3 | [Data Flows in Systems](03_System_Design/03_data_flows_in_systems.md) | Data Flows in Systems | 124 |
| 4 | [OOP vs FUNCTIONAL DESIGN](03_System_Design/04_oop_vs_functional_design.md) | OOP vs FUNCTIONAL DESIGN · System Design Patterns · Real — World System Design Examples | 330 |
| 5 | [Practice Exercises](03_System_Design/05_practice_exercises.md) | ASCII Diagram 1: C4 Model Hierarchy · ASCII Diagram 2: End-to-End Request Flow · ASCII Diagram 3: CAP Theorem Triangle · CAP Refinement: PACELC and the "Choose 2"… · Deep-Dive: Database Read Replicas · … | 604 |

## 🏢 Enterprise Lens — System Design Basics

| Area | What top-tier engineering looks like |
| ---- | ------------------------------------ |
| **Where it runs in production** | Architecture reviews, capacity planning, incident post-mortems |
| **Failure modes** | Designing for imaginary scale; hidden single points of failure; ignoring failure modes |
| **Testing and verification** | Load tests against the estimates; failure-injection drills |

---

## Reality Check

**"System design is about knowing the right architecture"** — It is about DERIVING an architecture from numbers: QPS, payload sizes, read/write ratio, and latency budgets — then justifying each component as the cheapest thing that meets them. The same URL shortener is a single Postgres box at 100 QPS and a partitioned key-value fleet at 1M QPS; presenting the fleet for the box problem fails the interview exactly as hard as the reverse. Architecture without arithmetic is decoration; the estimation pass IS the design.

**"More components means more senior-sounding design"** — Every component added must earn its operational cost: a cache invalidation strategy, a queue's redelivery semantics, a second database's consistency boundary. Senior designs are notable for what they REFUSE to add at current scale — with the sentence "at 10x we would introduce X, and here is the seam where it slots in." Junior designs sprinkle Kafka; senior designs sprinkle deferral points.

**"CAP theorem means choosing two of three"** — CAP's honest content is narrower: DURING a network partition, choose availability or consistency — partition tolerance is not optional in distributed systems. Outside partitions the real currency is LATENCY versus consistency (PACELC), and real systems choose per-OPERATION, not per-system: the cart is available-first, the checkout is consistent-first, in the same product. "We pick AP" as a whole-system stance is the tell of slogan-level understanding; per-flow reasoning is the graded skill.

**"Horizontal scaling solves capacity problems"** — Horizontal scaling solves STATELESS capacity; every stateful layer scales by a different, harder trick — databases by replication (read scaling, replica lag) then sharding (key choice, resharding pain, lost cross-shard transactions), caches by consistent hashing, coordination by consensus quorums. Designs that draw more app-server boxes when the database is the bottleneck reveal the gap instantly. The first question of any scaling answer: WHERE is the state, and which trick does that layer take?

**"Async messaging decouples services, making systems simpler"** — Queues trade temporal coupling for a new obligation set: at-least-once delivery forces idempotent consumers, ordering exists only per-partition, failures move to dead-letter queues someone must drain, and end-to-end tracing must now cross an async boundary. The system is more RESILIENT, not simpler — debugging spans two timelines instead of one call stack. Saying "add a queue" without saying "and consumers become idempotent via dedup keys" is the incomplete answer interviewers are listening for.
