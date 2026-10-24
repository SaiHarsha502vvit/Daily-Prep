🧠 **Mental Model**: See [System Design Thinking](../14_Mental_Models/15_System_Design_Thinking.md)

---

# 🏛️ LLD Solved Problems — Low-Level Design with SOLID & Patterns

> **Navigation**: [← Domain-Driven Design Essentials…](09_Domain_Driven_Design_Essentials.md) | [Chapter index](00_INDEX.md) | [LLD Reference Implementations… →](13_LLD_Reference_Implementations.md)

5 classic LLD interview problems solved with clean OOP, SOLID principles, and design patterns

---

## 🔗 Bridge — Where This Chapter Fits

| Dimension | This chapter |
| --- | --- |
| **Builds on** | [Design Patterns](02_Design_Patterns.md), [OOP Principles](01_OOPS_Principles.md) |
| **You will learn** | A framework for LLD interviews applied to parking lot, movie booking, expense sharing, elevator and logger |
| **Leads to** | [Design Patterns in Java](08_Design_Patterns_Java.md), [Domain-Driven Design](09_Domain_Driven_Design_Essentials.md) |
| **Abstraction level** | Patterns in isolation → **a complete class design for a concrete problem** |

> [!NOTE]
> The full gap-free reading order and dependency graph are in the [Learning Path](00_LEARNING_PATH.md).

> [!NOTE]
> The class listings in this chapter are interview outlines (no constructors or getters), so they do not compile alone. The [LLD Reference Implementations](13_LLD_Reference_Implementations.md) page has complete, tested versions of all five designs, including concurrency tests.

---

## 💬 Explain It Like a Study Partner — Low-Level Design Problems

### 1. The bottom line

Find the behaviours and invariants, give each to one owner, and place seams where requirements will change.

### 2. The textbook core

- Clarify requirements and actors.
- Identify entities, value objects and services.
- Assign each invariant to one class.
- Use patterns only where a variation force exists.
- Discuss concurrency at the point of contention.

### 3. The real-world analogy

Laying out a **workshop**: put each tool where the work happens, and decide which workbench needs a lock so two people do not grab the same tool.

### 4. Walkthrough

1. Parking lot: vehicles, spots, tickets.
2. Invariant: a spot holds at most one vehicle.
3. Allocation strategy is the variation (nearest, cheapest).
4. Make the claim of a spot atomic.
5. Add a requirement (EV spots) and check how much code changes.

> [!NOTE]
> **Quick check:** Where does a parking-lot design need synchronisation? *Where two requests can claim the same spot.*

### 5. Check yourself

**Q1.** What is the first thing to decide about concurrency in a booking design?

<details><summary>Answer</summary>

Where the contended resource is (the seat or spot) and make its claim atomic: lock, conditional update or unique constraint.

</details>

**Q2.** Why start LLD from behaviours instead of nouns?

<details><summary>Answer</summary>

Nouns produce data bags plus a manager; behaviours and invariants reveal who owns what.

</details>

---


## 📚 Topic Pages in This Chapter

This chapter is split into focused pages so each topic can be read on its own. Read them in order the first time; use the table to jump back later.

| # | Page | What is inside | Lines |
| --- | --- | --- | --- |
| 1 | [The Lld Interview Framework](07_LLD_Solved_Problems/01_the_lld_interview_framework.md) | The Lld Interview Framework · PROBLEM 1: Design Parking Lot · PROBLEM 2: Design BookMyShow (Movie Booking) · PROBLEM 3: Design Splitwise (Expense Sharing) · PROBLEM 4: Design Elevator System · … | 487 |
| 2 | [PLUS Enhancements](07_LLD_Solved_Problems/02_plus_enhancements.md) | PLUS Enhancements | 530 |

## 🏢 Enterprise Lens — Low-Level Design Problems

| Area | What top-tier engineering looks like |
| ---- | ------------------------------------ |
| **Where it runs in production** | Domain-model reviews, interview loops |
| **Failure modes** | Noun-harvesting into anemic classes; God manager classes; blanket `synchronized` |
| **Testing and verification** | Concurrent test that books the same resource from many threads |

---

## Reality Check

**"LLD interviews test UML and class diagrams"** — They test whether your classes SURVIVE requirement change: the parking lot gains EV spots, the elevator gains express floors, the splitter gains percentage splits — and the rubric is how much code each change touches. Diagrams are scratch paper; the graded artifact is the seam placement. Practice by designing, then self-inflicting one requirement change and counting the blast radius — small radius, good seams.

**"Start LLD by listing all the classes from the nouns"** — Noun-harvesting produces anemic data bags plus a God manager class that does everything — the most common LLD failure shape. Start from BEHAVIORS and invariants instead: what operations exist, what must never be violated (a spot holds one vehicle; a booking cannot double-pay), and let classes crystallize around who OWNS each invariant. Objects earn existence by guarding something, not by appearing in the problem statement.

**"Design patterns are the answer to LLD problems"** — Patterns are vocabulary for LOCAL decisions inside the design — Strategy for pricing rules, State for order/elevator lifecycles, Observer for notifications, Factory for vehicle/piece creation — and each earns mention only with its variation-force named. Pattern-first thinking produces the parody answer (a Singleton ParkingLot with a Factory for everything); force-first thinking mentions three patterns in passing while designing something that actually absorbs change.

**"Concurrency in LLD answers means adding synchronized"** — The graded move is identifying WHERE contention lives and choosing the granularity: the spot-allocation critical section (two cars, one spot — atomic claim via per-spot state or striped locks, not one lot-wide monitor), the booking hold with TTL, the vending machine's single-threaded-by-design simplicity stated explicitly. Blanket synchronized on every method announces unfamiliarity; one precise sentence about the racy invariant plus its guard announces the opposite.

**"A finished LLD is judged by its completeness"** — Time-boxed LLD is judged by PRIORITIZED depth: core invariant-bearing flow implemented cleanly (allocate/release, move-validation, split-and-settle), extension points named for the rest, and explicit non-goals ("payment gateway integration is a stub behind this interface"). Candidates who model every peripheral entity at equal depth run out of time mid-core; candidates who declare scope, nail the core, and gesture accurately at the periphery read as the engineers you can hand a real feature to.
