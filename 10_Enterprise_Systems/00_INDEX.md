# 10 - Enterprise Systems

> Real-world enterprise: ERP, finance, and DSA in production systems.

## Reading Order

| #   | File                                                                | What You'll Learn                                                         | Prerequisites                                                            |
| --- | ------------------------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| 1   | [ERP Fundamentals](01_ERP_Fundamentals.md)                          | What ERP is, modules, architecture                                        | None — start here                                                        |
| -   | [DDD Tactical Patterns](01b_DDD_Tactical_Patterns.md)               | Domain-Driven Design tactical patterns                                    | 01 (ERP Fundamentals)                                                    |
| -   | [Entity Design Based on Domain](01c_Domain_Driven_Entity_Design.md) | The 4-step framework, domain generalization, and avoiding entity breakage | 01, 01b                                                                  |
| 2   | [ERP Advanced](02_ERP_Advanced.md)                                  | Integration patterns, customization                                       | 01, 01b                                                                  |
| 3   | [ERP Finance Core](03_ERP_Finance_Core.md)                          | GL, AP, AR, financial close                                               | 01                                                                        |
| 4   | [ERP Finance Real-World](04_ERP_Finance_RealWorld.md)               | Real finance scenarios and bugs                                           | 03                                                                        |
| 5   | [Real-World DSA Problems](05_RealWorld_Problems_DSA.md)             | DSA in production systems                                                 | 01, 01b (assumes basic Java + DSA knowledge)                             |
| 6   | [Real-World Problems Part 2](06_RealWorld_Problems_Part2.md)        | More production scenarios                                                 | 05                                                                        |
| 7   | [Real-World Problems Part 3](07_RealWorld_Problems_Part3.md)        | Advanced production cases                                                 | 05, 06                                                                   |
| 8   | [Real-World Incidents](08_RealWorld_Incidents_DSA.md)               | Outage postmortems with DSA lessons                                       | 05, 06, 07                                                               |
| 9   | [Distributed Patterns](09_Distributed_Patterns.md)                  | Patterns for distributed systems                                          | 01b (DDD tactical — Saga/Outbox)                                        |
| 10  | [Kafka Problem Sets](10_KAFKA_PROBLEM_SETS.md)                          | Kafka-specific problem sets: partitioning, delivery semantics, idempotent consumers, consumer lag diagnosis, circuit breakers, design challenges | 09                                                                   |
| 11  | [Enterprise Problem Sets](10_PROBLEM_SETS.md)                          | DDD and Saga problem sets: bounded contexts, aggregate design, dual-write problem, choreography vs orchestration sagas | 01b, 09                                                               |

---

[← Back to Master Index](../00_MASTER_INDEX.md)
