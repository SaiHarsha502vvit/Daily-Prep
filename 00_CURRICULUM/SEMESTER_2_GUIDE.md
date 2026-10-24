# 📅 Semester 2 Guide — Systems & Design

## OOP · Design Patterns · Spring Boot + JPA · SQL · Distributed Systems · DDD

> **Total estimated time:** ~155 hours (16 weeks, ~10h/week)  
> **Outcome:** You can design production-grade systems with Spring Boot, write complex SQL (MySQL + Oracle), apply DDD to real domains, and reason about distributed consistency.  
> **Capstone:** Build a fully production-ready Microservice from scratch.

---

## 🗓️ Week-by-Week Plan

### UNIT 1 — OOP, SOLID & Design Patterns (Weeks 1–4)

**Learning Outcomes:**

- Identify all 5 SOLID violations on sight and refactor them
- Apply all 23 GoF patterns in the correct context
- Design a Low-Level System (LLD) from blank paper in a 45-minute interview

---

**Week 1 — OOP Principles & SOLID**

| Day | Topic                                                 | Read                                              | Do                                                                              |
| --- | ----------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------- |
| 1   | Encapsulation, Abstraction, Inheritance, Polymorphism | `06_OOP_Design/01_OOPS_Principles.md` §1-3        | Identify which of the 4 pillars each code snippet violates                      |
| 2   | Single Responsibility + Open-Closed                   | `06_OOP_Design/01_OOPS_Principles.md` §SOLID §1-2 | Refactor a 200-line `UserService` God Class                                     |
| 3   | Liskov Substitution Principle                         | `06_OOP_Design/01_OOPS_Principles.md` §SOLID §3   | Find the LSP violation in the classic `Square extends Rectangle` example        |
| 4   | Interface Segregation + Dependency Inversion          | `06_OOP_Design/01_OOPS_Principles.md` §SOLID §4-5 | Refactor a service that creates its own dependencies into DI-compliant code     |
| 5   | Lab                                                   | —                                                 | **Lab:** Refactor a bloated `OrderProcessor` class using all 5 SOLID principles |
| 6–7 | Problem Set OOP-PS1                                   | —                                                 | `06_OOP_Design/06b_PROBLEM_SETS.md` PS-1 (SOLID)                                 |

**Week 2 — Creational & Structural Patterns**

| Day | Topic                                    | Read                                                | Do                                                                     |
| --- | ---------------------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------- |
| 1   | Factory Method + Abstract Factory        | `06_OOP_Design/02_Design_Patterns.md` §Creational   | Implement a `NotificationFactory` (Email, SMS, Push)                   |
| 2   | Builder + Prototype + Singleton pitfalls | `06_OOP_Design/08_Design_Patterns_Java.md` §Builder | Build a fluent `QueryBuilder` in Java                                  |
| 3   | Adapter + Facade + Decorator             | `06_OOP_Design/02_Design_Patterns.md` §Structural   | Implement Decorator for logging/timing around any service              |
| 4   | Proxy + Bridge + Composite               | `06_OOP_Design/02_Design_Patterns.md` §Structural   | Implement a dynamic Proxy that logs all method calls                   |
| 5   | Lab                                      | —                                                   | Build a file export system: CSV, PDF, Excel — using Factory + Strategy |
| 6–7 | Problem Set OOP-PS2                      | —                                                   | `06_OOP_Design/06b_PROBLEM_SETS.md` PS-2 (GoF Patterns)                 |

**Week 3 — Behavioral Patterns**

| Day | Topic                                | Read                                              | Do                                                                         |
| --- | ------------------------------------ | ------------------------------------------------- | -------------------------------------------------------------------------- |
| 1   | Strategy + Template Method           | `06_OOP_Design/02_Design_Patterns.md` §Behavioral | Replace 5 `if-else` payment handler blocks with Strategy Pattern           |
| 2   | Observer + Event Sourcing connection | `06_OOP_Design/02_Design_Patterns.md` §Observer   | Implement an EventBus with multiple subscribers                            |
| 3   | Command + Chain of Responsibility    | `06_OOP_Design/02_Design_Patterns.md` §Command    | Implement undo/redo using Command Pattern                                  |
| 4   | State + Iterator + Mediator          | `06_OOP_Design/02_Design_Patterns.md` §State      | Model a vending machine using State Pattern                                |
| 5   | Lab                                  | —                                                 | Build a Logger Framework: Chain of Responsibility + Strategy for appenders |
| 6–7 | Problem Set OOP-PS2 (continued)      | —                                                 | Part C challenges                                                          |

**Week 4 — Low Level Design (LLD)**

| Day | Topic                                                               | Read                                                  | Do                                                                    |
| --- | ------------------------------------------------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------- |
| 1   | LLD methodology: Requirements → Entities → Relationships → Patterns | `06_OOP_Design/07_LLD_Solved_Problems.md` §Method     | Design a Parking Lot from scratch in 45 min                           |
| 2   | LLD: BookMyShow (concurrent seat locking)                           | `06_OOP_Design/07_LLD_Solved_Problems.md` §BookMyShow | Trace the optimistic vs pessimistic locking decisions                 |
| 3   | LLD: Splitwise (debt simplification)                                | `06_OOP_Design/07_LLD_Solved_Problems.md` §Splitwise  | Implement the greedy debt simplification algorithm                    |
| 4   | LLD: Elevator System                                                | `06_OOP_Design/07_LLD_Solved_Problems.md` §Elevator   | Implement LOOK scheduling algorithm                                   |
| 5   | Lab                                                                 | —                                                     | **Mini-Project:** Design a Rate Limiter (token bucket + leaky bucket) |
| 6–7 | Problem Set OOP-PS3                                                 | —                                                     | `06_OOP_Design/06b_PROBLEM_SETS.md` PS-3 (LLD)                         |

---

### UNIT 2 — Spring Boot + JPA (Weeks 5–8)

**Learning Outcomes:**

- Explain the Spring Bean lifecycle, proxy mechanism, and AOP
- Write production-grade REST APIs with proper error handling, security, and testing
- Design correct JPA entity mappings and understand N+1 query problem

**Week 5 — Spring Core: IoC, DI, Bean Lifecycle**

| Day | Topic                                                         | Read                                                   | Do                                                                       |
| --- | ------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------ |
| 1   | IoC container, BeanFactory vs ApplicationContext              | `07_Modern_Java/Ch32_SB_Data_Part2.md` §Ch.1 IoC     | Trace: what happens from `@SpringBootApplication` to bean ready?         |
| 2   | `@Component`, `@Service`, `@Repository`, `@Controller`        | `07_Modern_Java/Ch32_SB_Data_Part2.md` §Ch.2 Spring Beans | When does Spring throw `NoUniqueBeanDefinitionException`?                |
| 3   | `@Autowired`, constructor injection, `@Qualifier`, `@Primary` | `07_Modern_Java/Ch26_Pre_Spring_Part1.md` §DI          | Refactor field injection to constructor injection                        |
| 4   | Bean Scopes + `@PostConstruct` + `@PreDestroy`                | `07_Modern_Java/Ch32_SB_Data_Part2.md` §Ch.5 Bean Scopes | What happens when a prototype bean is injected into a singleton?         |
| 5   | Lab                                                           | —                                                      | Build a `ConfigService` that loads settings from 3 sources with priority |
| 6–7 | Problem Set SPRING-PS1 (Part A)                               | —                                                      | `07_Modern_Java/07_PROBLEM_SETS.md` SPRING-PS1 A1-A3                     |

**Week 6 — AOP, REST API Design**

| Day | Topic                                                              | Read                                                  | Do                                                             |
| --- | ------------------------------------------------------------------ | ----------------------------------------------------- | -------------------------------------------------------------- |
| 1   | AOP: Aspects, Advice, Pointcuts, Join Points                       | `07_Modern_Java/Ch33_SB_Web_Part3.md` §AOP            | How does `@Transactional` use AOP internally?                  |
| 2   | `@RestController`, `@RequestMapping`, HTTP semantics               | `07_Modern_Java/Ch37_SB_Controllers_REST.md` §REST Controller Fundamentals + §Ch.2 HTTP Method Mappings | Design REST API for a Blog: GET/POST/PUT/PATCH/DELETE          |
| 3   | `@ExceptionHandler`, `@ControllerAdvice`, RFC 7807 problem details | `07_Modern_Java/Ch33_SB_Web_Part3.md` §Error          | Implement global error handler returning proper error payloads |
| 4   | Validation: `@Valid`, `@NotNull`, `@Size`, custom validators       | `07_Modern_Java/Ch28_Annotations_Core.md` §Validation Annotations | Add Bean Validation to a DTO — write custom `@ValidEmail`      |
| 5   | Lab                                                                | —                                                     | **Mini-Project P04 Start:** Library REST API scaffold          |
| 6–7 | Problem Set SPRING-PS1 (Part B + C)                                | —                                                     | Implement `BookController` from skeleton                       |

**Week 7 — JPA, Hibernate & Database Integration**

| Day | Topic                                                                | Read                                              | Do                                                                       |
| --- | -------------------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------ |
| 1   | JPA entity mapping: `@Entity`, `@Id`, `@GeneratedValue`              | `07_Modern_Java/Ch40_SB_JPA_Deep_Dive.md` §Ch.2 Entity Mapping | Map the `Book` entity with correct types                                 |
| 2   | Relationships: `@OneToMany`, `@ManyToOne`, `@ManyToMany` + FetchType | `07_Modern_Java/Ch40_SB_JPA_Deep_Dive.md` §Ch.3 Entity Relationships | Explain and fix: when does EAGER loading cause a SELECT explosion?       |
| 3   | The N+1 Query Problem                                                | `07_Modern_Java/Ch40_SB_JPA_Deep_Dive.md` §Ch.4 Fetch Strategies (N+1) | Reproduce N+1 in a test, then fix with `JOIN FETCH` / `@EntityGraph`     |
| 4   | `@Transactional` — propagation levels, isolation levels              | `07_Modern_Java/Ch34_SB_Security_Part4.md` §Ch.5 Transaction Management | What is `REQUIRES_NEW`? When does `REQUIRED` silently swallow rollbacks? |
| 5   | Lab                                                                  | —                                                 | Complete **Mini-Project P04** Library REST API                           |
| 6–7 | Problem Set JAVA-PS2                                                 | —                                                 | `07_Modern_Java/07_PROBLEM_SETS.md` JAVA-PS2                             |

**Week 8 — Spring Security + Testing**

| Day | Topic                                                   | Read                                                 | Do                                                 |
| --- | ------------------------------------------------------- | ---------------------------------------------------- | -------------------------------------------------- |
| 1   | Spring Security filter chain architecture               | `07_Modern_Java/Ch34_SB_Security_Part4.md` §Security | Trace an HTTP request through the security chain   |
| 2   | JWT authentication: stateless design                    | `07_Modern_Java/Ch34_SB_Security_Part4.md` §JWT      | Implement JWT generation + validation (use `jjwt`) |
| 3   | Unit Testing: `@SpringBootTest`, `@WebMvcTest`, MockMvc | `07_Modern_Java/Ch59_SB_Testing_Fundamentals.md` §@WebMvcTest | Write 3 MockMvc tests for the Book API             |
| 4   | Integration Testing: `@DataJpaTest`, Testcontainers     | `07_Modern_Java/Ch59_SB_Testing_Fundamentals.md` §@DataJpaTest, `Ch60_SB_Testing_Advanced.md` (Testcontainers sections) | Write an integration test using H2 in-memory DB    |
| 5   | Lab                                                     | —                                                    | Add JWT security to the Library REST API           |
| 6–7 | Problem Set SPRING-PS1 (full review)                    | —                                                    | Review + self-grade all Spring problem sets        |

---

### UNIT 3 — SQL Mastery (Weeks 9–11)

**Learning Outcomes:**

- Write complex analytical queries using Window Functions, CTEs, and Recursive CTEs
- Read and optimize query execution plans in both MySQL and Oracle
- Design indexes strategically for read-heavy and write-heavy workloads
- **All queries delivered in MySQL 8.0 AND Oracle 19c**

**Week 9 — SQL Foundations: Joins, Aggregations, Subqueries**

| Day | Topic                                          | Read (MySQL)          | Read (Oracle)                       | Do                                             |
| --- | ---------------------------------------------- | --------------------- | ----------------------------------- | ---------------------------------------------- |
| 1   | INNER, LEFT, RIGHT, FULL OUTER, CROSS JOIN     | `08_SQL` §Joins       | Oracle: `(+)` syntax vs ANSI JOIN   | Write all 5 join types on employees schema     |
| 2   | GROUP BY, HAVING, aggregate functions          | `08_SQL` §Aggregation | Oracle: `CONNECT BY` for hierarchy  | Find departments with avg salary > company avg |
| 3   | Correlated subqueries, EXISTS, IN              | `08_SQL` §Subqueries  | Oracle: `ROWNUM` vs `FETCH FIRST`   | Find employees earning above their dept avg    |
| 4   | Set operations: UNION, INTERSECT, EXCEPT/MINUS | `08_SQL` §Sets        | Oracle: `MINUS` instead of `EXCEPT` | Find employees on no project (EXCEPT)          |
| 5   | Lab                                            | —                     | —                                   | **Project P03:** Dashboard queries 1-3         |
| 6–7 | SQL-PS1                                        | —                     | —                                   | `08_SQL/08b_PROBLEM_SETS.md` PS-1               |

**Week 10 — Window Functions & CTEs**

| Day | Topic                                   | MySQL             | Oracle                | Do                                     |
| --- | --------------------------------------- | ----------------- | --------------------- | -------------------------------------- |
| 1   | ROW_NUMBER, RANK, DENSE_RANK            | `08_SQL` §Windows | Same syntax           | Top-3 per department query             |
| 2   | LAG, LEAD, FIRST_VALUE, LAST_VALUE      | `08_SQL` §Windows | Same syntax           | MoM revenue growth with LAG()          |
| 3   | Running totals, partitioned sums        | `08_SQL` §Windows | Same syntax           | Cumulative revenue by day              |
| 4   | CTEs: WITH clause, multi-step pipelines | `08_SQL` §CTEs    | Oracle: `WITH` clause | Rewrite 3-level subquery as CTE        |
| 5   | Lab                                     | —                 | —                     | **Project P03:** Dashboard queries 4-7 |
| 6–7 | SQL-PS2                                 | —                 | —                     | `08_SQL/08b_PROBLEM_SETS.md` PS-2       |

**Week 11 — Recursive CTEs, Indexes & Optimization**

| Day | Topic                                                     | MySQL                     | Oracle                            | Do                                           |
| --- | --------------------------------------------------------- | ------------------------- | --------------------------------- | -------------------------------------------- |
| 1   | Recursive CTEs — org chart, BOM                           | `08_SQL` §Recursive       | Oracle: `CONNECT BY LEVEL`        | Full org hierarchy from any manager          |
| 2   | EXPLAIN / EXPLAIN PLAN                                    | MySQL EXPLAIN FORMAT=JSON | Oracle: EXPLAIN PLAN + DBMS_XPLAN | Read an execution plan; spot full table scan |
| 3   | B-Tree indexes, composite indexes, index selectivity      | `08_SQL` §Indexes         | Oracle: index hints               | Design covering index for MoM query          |
| 4   | Index pitfalls: function on indexed column, implicit cast | `08_SQL` §Pitfalls        | Oracle: function-based indexes    | Fix: `WHERE YEAR(hire_date) = 2024`          |
| 5   | Lab                                                       | —                         | —                                 | Optimize 3 slow queries from Project P03     |
| 6–7 | SQL-PS3 + SQL-PS4                                         | —                         | —                                 | `08_SQL/08b_PROBLEM_SETS.md` PS-3 + PS-4      |

---

### UNIT 4 — Distributed Systems & DDD (Weeks 12–14)

**Learning Outcomes:**

- Apply the 4-step DDD entity design framework to any new system
- Implement Saga pattern (choreography + orchestration)
- Solve the Dual-Write problem using the Outbox Pattern
- Reason about CAP theorem trade-offs

**Week 12 — Domain-Driven Design**

| Day | Topic                                                         | Read                                                            | Do                                               |
| --- | ------------------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------ |
| 1   | DDD Strategic: Bounded Contexts, Ubiquitous Language          | `10_Enterprise_Systems/01b_DDD_Tactical_Patterns.md` §Strategic | Draw context map for a bank with 5 departments   |
| 2   | DDD Tactical: Entity, Value Object, Aggregate                 | `10_Enterprise_Systems/01b_DDD_Tactical_Patterns.md` §Tactical  | Why is `Money` a Value Object, not an Entity?    |
| 3   | Entity Design Framework (4 steps)                             | `10_Enterprise_Systems/01c_Domain_Driven_Entity_Design.md`      | Apply to Swiggy-like app: extract all domains    |
| 4   | Aggregate Root: invariant enforcement, transaction boundaries | `10_Enterprise_Systems/01b_DDD_Tactical_Patterns.md` §Aggregate | Fix the cross-aggregate reference anti-pattern   |
| 5   | Lab                                                           | —                                                               | **Mini-Project P05:** Food Delivery Domain Model |
| 6–7 | Problem Set ENTERPRISE-PS1                                    | —                                                               | `10_Enterprise_Systems/10_PROBLEM_SETS.md`       |

**Week 13 — Distributed Consistency**

| Day | Topic                                          | Read                                                                | Do                                                     |
| --- | ---------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------ |
| 1   | CAP Theorem: proofs and real system trade-offs | `10_Enterprise_Systems/01b_DDD_Tactical_Patterns.md` §4             | Classify: Zookeeper, Cassandra, DynamoDB, PostgreSQL   |
| 2   | Saga Pattern: Choreography                     | `10_Enterprise_Systems/01b_DDD_Tactical_Patterns.md` §Saga          | Trace a 4-step order saga with compensation            |
| 3   | Saga Pattern: Orchestration + State Machine    | `10_Enterprise_Systems/01b_DDD_Tactical_Patterns.md` §Orchestration | Draw state machine for order saga                      |
| 4   | Outbox Pattern + CDC (Debezium)                | `10_Enterprise_Systems/01b_DDD_Tactical_Patterns.md` §Outbox        | Why does `save() + kafkaSend()` fail? Implement Outbox |
| 5   | Lab                                            | —                                                                   | Design distributed order system (on paper)             |
| 6–7 | Problem Set ENTERPRISE-PS2                     | —                                                                   | `10_Enterprise_Systems/10_PROBLEM_SETS.md`             |

**Week 14 — Event Sourcing & CQRS**

| Day | Topic                                               | Read                                                      | Do                                                     |
| --- | --------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------ |
| 1   | Event Sourcing: Append-Only log, rehydration        | `10_Enterprise_Systems/01b_DDD_Tactical_Patterns.md` §4.4 | Design an Event Store table for a bank account         |
| 2   | CQRS: Command vs Query separation                   | `10_Enterprise_Systems/01b_DDD_Tactical_Patterns.md` §4.5 | Draw CQRS architecture for a Twitter-like feed         |
| 3   | Kafka partitioning + ordering guarantees            | `10_Enterprise_Systems/01b_DDD_Tactical_Patterns.md` §5   | What Kafka partition key ensures event ordering?       |
| 4   | Idempotency: at-least-once vs exactly-once delivery | `10_Enterprise_Systems/09_Distributed_Patterns.md`        | Design an idempotency key scheme for payments          |
| 5   | Lab                                                 | —                                                         | **Capstone 2 Start:** Project planning and scaffolding |
| 6–7 | Full review                                         | —                                                         | Self-grade all Semester 2 problem sets                 |

---

### UNIT 5 — Semester 2 Capstone (Weeks 15–16)

**🏆 Capstone 2: Production Microservice from Scratch**

**Estimated time:** 25 hours  
→ Full spec: `00_CURRICULUM/PROJECTS/CAP02_Microservice.md`

Build a production-grade Spring Boot microservice:

- REST API with full CRUD (Spring Boot 3 + Java 17)
- DDD entity design (proper Aggregate Roots, Value Objects, Domain Events)
- JPA + PostgreSQL (Docker Compose)
- Spring Security + JWT authentication
- `@Transactional` with proper propagation levels
- Outbox Pattern for Domain Events
- JUnit 5 + Testcontainers integration tests
- Swagger/OpenAPI documentation
- Health check + Actuator endpoints

---

[← Semester 1](SEMESTER_1_GUIDE.md) | [Back to Overview](CURRICULUM_OVERVIEW.md) | [Semester 3 →](SEMESTER_3_GUIDE.md)
