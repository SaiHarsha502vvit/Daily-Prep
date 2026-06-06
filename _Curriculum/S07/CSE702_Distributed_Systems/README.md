# CSE702 — Distributed Systems

**Estimated time:** ~25h  
**Prerequisite:** S04 (networking basics), S06 (microservices exposure)

## Description

Study of the principles, architectures, and patterns that underpin modern distributed systems. Covers communication models, consensus, replication, partitioning, event-driven architecture, saga patterns, and event sourcing. Grounded in the CAP theorem, Byzantine fault tolerance, and the practical lessons of large-scale system design at companies like Google, Amazon, and Netflix.

## Learning Outcomes

1. Explain the CAP theorem trade-offs and apply them to system design decisions (consistency vs. availability)
2. Implement distributed consensus using Paxos or Raft, and understand when to use leaderless approaches
3. Design and implement event-driven microservices using Apache Kafka, including dead-letter queues and exactly-once semantics
4. Apply Domain-Driven Design (DDD) bounded contexts and aggregate patterns to decompose complex domains
5. Implement the Saga pattern (choreography and orchestration) for distributed transactions across services

## Syllabus Outline

| Week | Topic |
|------|-------|
| 1 | Distributed system fundamentals: fallacies, network models, timing assumptions |
| 2 | CAP theorem and PACELC: consistency, availability, partition tolerance trade-offs |
| 3 | Logical clocks: Lamport timestamps, vector clocks, and causal consistency |
| 4 | Consensus algorithms: Paxos, Raft, Multi-Paxos, and practical implementations |
| 5 | Replication strategies: primary-backup, multi-leader, leaderless (CRDTs) |
| 6 | Partitioning: consistent hashing, virtual nodes, rebalancing strategies |
| 7 | Event-driven architecture: message brokers, Kafka topics, consumer groups |
| 8 | Domain-Driven Design: bounded contexts, aggregates, domain events |
| 9 | Event Sourcing: event store, projections, snapshots, and versioning |
| 10 | Saga pattern: choreography vs. orchestration, compensating transactions |
| 11 | Distributed transactions: two-phase commit, three-phase commit, Sagas |
| 12 | Capstone: design and implement a distributed e-commerce system with event sourcing and saga |

## Linked Existing Content

- [Enterprise Systems — Kafka, DDD, Saga, Event Sourcing](../../10_Enterprise_Systems/)

## Assessment

- Weekly distributed system problem sets and implementations
- Design document for a real-world distributed system scenario
- 3-hour practical exam (debug a distributed system failure, propose a fix)