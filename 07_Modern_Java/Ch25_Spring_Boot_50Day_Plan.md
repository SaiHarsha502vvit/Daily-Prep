**Navigation**: [< Previous](Ch52_SB_WebSocket_GraphQL_gRPC.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](Ch15_Concurrency_Core.md)

# 🚀 SPRING BOOT COMPLETE CURRICULUM — Separate Study Plan

**Duration:** 10 Weeks (alongside your DSA plan or standalone)
**Who:** Beginner → Intermediate → Expert (covers everything)
**Framework:** Every topic uses WHY → HOW → EXAMPLE → PITFALL → INTERVIEW Q
**Files covered:** Parts 0-23 (25 files, 26 files total in 07_Modern_Java)

---

## 📊 Overview: 3 Phases

```
Phase 1: FOUNDATIONS (Week 1-3)      → Build your first REST API
Phase 2: PRODUCTION (Week 4-6)       → Security, Testing, Performance
Phase 3: EXPERT/CLOUD (Week 7-10)    → Microservices, Cloud, Advanced
```

---

## 🎯 DAILY STRUCTURE

Each day: ~2-3 hours

| Block       | Time   | Activity                                     |
| ----------- | ------ | -------------------------------------------- |
| 📖 READ     | 45 min | Read the file section (understand WHY + HOW) |
| 💻 CODE     | 60 min | Code along every example in IntelliJ         |
| 🧪 PRACTICE | 30 min | Modify examples, break things, fix them      |
| 📝 NOTES    | 15 min | Write 3 key takeaways in your own words      |

---


### Historical Evolution

**Inventor / Originator:** Rod Johnson / Pivotal (2004) — Spring Framework 1.0 began the shift from XML-heavy J2EE to lightweight, testable Java.

**Predecessor context:** J2EE (1999) required EJB containers, heavyweight application servers (WebSphere, WebLogic), and extensive XML configuration. A "Hello World" web app required days of setup. Unit testing required a full container. This drove developers to POJO-based alternatives.

**Evolution narrative:** Spring 1.0 (2004) offered POJO-based DI without a container requirement. Spring 2.5 (2006) introduced `@Autowired` and `@Component`, dramatically reducing XML. Spring 3.0 (2009) added `@Configuration` classes and SpEL. Spring 4.0 (2013) supported Java 8 (lambdas, streams) and conditional configuration. Spring Boot 1.0 (2014) automated scaffolding via auto-configuration. The 50-day structured plan emerged from the realization that learners needed a guided, incremental path — not a reference dump. Modern full-stack bootcamps (General Assembly, 2011+; Coursera, 2012+) popularized structured 8-12 week curricula. Spring's own guides (spring.io/guides, 2014+) structured learning into incremental steps. Reactive Spring (WebFlux, Spring 5, 2017) was the next paradigm shift — non-blocking for high-concurrency workloads.

**Modern practice:** The modern Java/Spring career path: Java 17+ basics → Spring Boot 3.x → Spring Data JPA → Spring Security → Testing → Spring Cloud microservices → Kubernetes deployment. This 50-day plan maps to that career arc. Spring Academy (spring.academy, 2023) is the official Pivotal learning platform.

- **J2EE — 1999**: Enterprise JavaBeans. Heavyweight containers. The problem Spring solved.
- **Spring 1.0 — 2004**: Rod Johnson. POJO DI. No container required. XML-based wiring.
- **Spring Boot 1.0 — 2014**: Pivotal. Auto-configuration. Spring Initializr. Embedded Tomcat.
- **Spring 5 (WebFlux) — 2017**: Reactive programming. `Mono`/`Flux`. Non-blocking stack.
- **General Assembly / bootcamps — 2011+**: Structured coding bootcamps. 12-24 week intensive programs.
- **Spring Academy — 2023**: Pivotal official learning platform. Guided learning paths.

# PHASE 1: FOUNDATIONS (Week 1-3) 🟢

**Goal:** Go from zero to building a complete REST API with database

---

## Week 1: Java Internals + Spring Core

### Day 1 — Modern Java Prerequisites

| Block | Topic                                           | File                                                             |
| ----- | ----------------------------------------------- | ---------------------------------------------------------------- |
| 📖    | Lambda expressions, Streams, Optional           | [Ch06_Functional_Programming.md](Ch06_Functional_Programming.md) |
| 💻    | Write 10 examples: filter, map, reduce, flatMap | Same file                                                        |
| 🧪    | Convert 5 for-loops to streams                  | Practice                                                         |
| 📝    | WHY functional? HOW does it help Spring?        | Notes                                                            |

**Key concepts:** Lambda, Method Reference, Stream pipeline, Optional

---

### Day 2 — JVM Internals (The Foundation)

| Block | Topic                                  | File                                                  |
| ----- | -------------------------------------- | ----------------------------------------------------- |
| 📖    | JVM Memory Model, Heap/Stack, GC       | [Ch31_SB_Core_Part1.md](Ch31_SB_Core_Part1.md) Ch 1-3 |
| 💻    | Create objects, observe GC in VisualVM | Same file                                             |
| 🧪    | Intentionally cause OutOfMemoryError   | Practice                                              |
| 📝    | WHY does Spring care about memory?     | Notes                                                 |

**Key concepts:** Heap, Stack, GC roots, Young/Old gen

---

### Day 3 — Hidden Foundations Part A

| Block | Topic                                  | File                                                              |
| ----- | -------------------------------------- | ----------------------------------------------------------------- |
| 📖    | Java Reflection, Annotation Processing | [Ch26_Pre_Spring_Part1.md](Ch26_Pre_Spring_Part1.md) Sections A-B |
| 💻    | Write a custom annotation + processor  | Same file                                                         |
| 🧪    | Read Spring's @Component source code   | Practice                                                          |
| 📝    | WHY does Spring need reflection?       | Notes                                                             |

**Key concepts:** Class.forName, getDeclaredFields, @Retention, @Target

---

### Day 4 — Hidden Foundations Part B

| Block | Topic                                        | File                                                                 |
| ----- | -------------------------------------------- | -------------------------------------------------------------------- |
| 📖    | Proxy Patterns, Servlet API, Design Patterns | [Ch26_Pre_Spring_Part1.md](Ch26_Pre_Spring_Part1.md) Sections C-D, J |
| 💻    | Create JDK Dynamic Proxy, implement Filter   | Same file                                                            |
| 🧪    | Debug DispatcherServlet flow in IntelliJ     | Practice                                                             |
| 📝    | HOW does @Transactional use proxies?         | Notes                                                                |

**Key concepts:** CGLIB, JDK Proxy, DispatcherServlet, Filter chain

---

### Day 5 — Hidden Foundations Part C

| Block | Topic                                            | File                                                              |
| ----- | ------------------------------------------------ | ----------------------------------------------------------------- |
| 📖    | Jackson, Connection Pooling, ClassLoading, Maven | [Ch26_Pre_Spring_Part1.md](Ch26_Pre_Spring_Part1.md) Sections E-H |
| 💻    | Custom ObjectMapper, HikariCP config             | Same file                                                         |
| 🧪    | Serialize/Deserialize complex objects            | Practice                                                          |
| 📝    | WHY is HikariCP the default pool?                | Notes                                                             |

**Key concepts:** ObjectMapper, @JsonProperty, HikariCP, dependency scope

---

### Day 6 — Spring Core: IoC & Dependency Injection

| Block | Topic                                           | File                                                  |
| ----- | ----------------------------------------------- | ----------------------------------------------------- |
| 📖    | IoC, Beans, DI methods, @Qualifier, @Primary    | [Ch32_SB_Data_Part2.md](Ch32_SB_Data_Part2.md) Ch 1-4 |
| 💻    | Create 5 beans with constructor/field/setter DI | Same file                                             |
| 🧪    | Create a circular dependency and fix it         | Practice                                              |
| 📝    | WHY constructor injection > field injection?    | Notes                                                 |

**Key concepts:** @Component, @Service, @Repository, @Autowired, @Qualifier

---

### Day 7 — Spring Core: Lifecycle & Events

| Block | Topic                                              | File                                                   |
| ----- | -------------------------------------------------- | ------------------------------------------------------ |
| 📖    | Bean Scopes, Lifecycle, ApplicationContext, Events | [Ch32_SB_Data_Part2.md](Ch32_SB_Data_Part2.md) Ch 5-10 |
| 💻    | Create prototype bean, publish custom event        | Same file                                              |
| 🧪    | Log every phase of bean lifecycle                  | Practice                                               |
| 📝    | REVIEW Week 1 — write down 10 things you learned   | Notes                                                  |

**Key concepts:** @PostConstruct, @PreDestroy, singleton vs prototype, @EventListener

---

🔬 **Section Challenge — Week 1: Java Internals + Spring Core**

**Challenge 1 (Reasoning):** Why does Spring use CGLIB proxies by default instead of JDK Dynamic Proxies when you annotate a class with `@Transactional`?

<details><summary>Answer</summary>

JDK Dynamic Proxies require the target class to implement an interface. If your service class doesn't implement an interface, JDK proxies fail. CGLIB bypasses this by generating a subclass of your actual target class at runtime and overriding its non-final methods. This allows Spring to inject transaction logic (begin/commit/rollback) around your method calls without forcing you to write boilerplate interfaces for every single service. However, because CGLIB creates a subclass, it _cannot_ proxy `final` methods or `private` methods—which is exactly why calling a `@Transactional` method from within the _same_ class bypasses the proxy and executes without a transaction!

</details>

## Week 2: AOP + HTTP + Building APIs

### Day 8 — AOP (Aspect-Oriented Programming)

| Block | Topic                                        | File                                                |
| ----- | -------------------------------------------- | --------------------------------------------------- |
| 📖    | AOP concepts, Advice types, Pointcuts        | [Ch33_SB_Web_Part3.md](Ch33_SB_Web_Part3.md) Ch 1-6 |
| 💻    | Create logging aspect, timing aspect         | Same file                                           |
| 🧪    | Create an aspect that catches all exceptions | Practice                                            |
| 📝    | WHY does @Transactional need AOP?            | Notes                                               |

**Key concepts:** @Aspect, @Before, @After, @Around, Pointcut expressions

---

### Day 9 — Auto-Configuration + Lombok & DTOs

| Block | Topic                                                  | File                                                                                                          |
| ----- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| 📖    | @SpringBootApplication magic, Profiles, Lombok         | [Ch33_SB_Web_Part3.md](Ch33_SB_Web_Part3.md) Ch 7-9 + [Ch35_SB_Lombok_DTOs.md](Ch35_SB_Lombok_DTOs.md) Ch 1-4 |
| 💻    | Create app with dev/prod profiles, use @Data, @Builder | Both files                                                                                                    |
| 🧪    | See the generated bytecode by Lombok                   | Practice                                                                                                      |
| 📝    | WHY DTOs? WHY not expose entities directly?            | Notes                                                                                                         |

**Key concepts:** @EnableAutoConfiguration, @Profile, @Data, @Builder, @Value

---

### Day 10 — DTO Patterns + HTTP Deep Dive

| Block | Topic                                         | File                                                                                                                    |
| ----- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| 📖    | DTO mapping strategies, HTTP lifecycle        | [Ch35_SB_Lombok_DTOs.md](Ch35_SB_Lombok_DTOs.md) Ch 5-8 + [Ch42_SB_HTTP_Deep_Dive.md](Ch42_SB_HTTP_Deep_Dive.md) Ch 1-7 |
| 💻    | MapStruct mapper, trace HTTP request in logs  | Both files                                                                                                              |
| 🧪    | Send requests with Postman, inspect headers   | Practice                                                                                                                |
| 📝    | Request → DispatcherServlet → Controller flow | Notes                                                                                                                   |

**Key concepts:** ModelMapper, MapStruct, HTTP headers, @PathVariable, @RequestParam

---

### Day 11 — Controllers & REST APIs

| Block | Topic                                             | File                                                              |
| ----- | ------------------------------------------------- | ----------------------------------------------------------------- |
| 📖    | Controller anatomy, HTTP mappings, Request params | [Ch37_SB_Controllers_REST.md](Ch37_SB_Controllers_REST.md) Ch 1-4 |
| 💻    | Build CRUD API for a resource (e.g., Products)    | Same file                                                         |
| 🧪    | Test all endpoints in Postman                     | Practice                                                          |
| 📝    | @GetMapping vs @RequestMapping difference         | Notes                                                             |

**Key concepts:** @RestController, @RequestBody, ResponseEntity, @PathVariable

---

### Day 12 — Validation + Exception Handling

| Block | Topic                                                  | File                                                              |
| ----- | ------------------------------------------------------ | ----------------------------------------------------------------- |
| 📖    | Validation, Exception handling, API versioning         | [Ch37_SB_Controllers_REST.md](Ch37_SB_Controllers_REST.md) Ch 5-8 |
| 💻    | Add @Valid, create @ControllerAdvice exception handler | Same file                                                         |
| 🧪    | Send invalid data, verify error responses              | Practice                                                          |
| 📝    | WHY @ControllerAdvice > try-catch in each controller?  | Notes                                                             |

**Key concepts:** @Valid, @NotNull, @Size, @ControllerAdvice, @ExceptionHandler

---

### Day 13 — Service Layer & Repository Patterns

| Block | Topic                                                  | File                                                                  |
| ----- | ------------------------------------------------------ | --------------------------------------------------------------------- |
| 📖    | Service layer, anti-patterns, Repository fundamentals  | [Ch36_SB_Service_Repository.md](Ch36_SB_Service_Repository.md) Ch 1-5 |
| 💻    | Refactor your CRUD to proper Service → Repository      | Same file                                                             |
| 🧪    | Identify anti-patterns in your own code                | Practice                                                              |
| 📝    | Controller → Service → Repository — WHY this layering? | Notes                                                                 |

**Key concepts:** @Service, @Repository, business logic separation, anemic domain

---

### Day 14 — Repository Queries + Review

| Block | Topic                                                  | File                                                                  |
| ----- | ------------------------------------------------------ | --------------------------------------------------------------------- |
| 📖    | Derived queries, @Query, Specifications                | [Ch36_SB_Service_Repository.md](Ch36_SB_Service_Repository.md) Ch 6-9 |
| 💻    | Write 10 derived query methods, 5 @Query methods       | Same file                                                             |
| 🧪    | Build dynamic search with Specifications               | Practice                                                              |
| 📝    | REVIEW Week 2 — you can now build a complete REST API! | Notes                                                                 |

**Key concepts:** findByNameContaining, @Query JPQL, Specification, dynamic queries

---

🔬 **Section Challenge — Week 2: AOP + HTTP + Building APIs**

**Challenge 1 (Trace — Who/When/What):** You add `@Transactional` to a private method in your `@Service`. The transaction silently doesn't work. **Who** creates the proxy? **When?** **Why** can't the proxy intercept private methods?\n\n<details><summary>Answer</summary>\n\n**Who creates proxy?** Spring's `AbstractAutoProxyCreator` BeanPostProcessor, triggered during bean initialization. **When?** At ApplicationContext startup — before any HTTP requests are served. **Why private methods not intercepted?** Spring uses either JDK proxies (interface-based) or CGLIB (subclass-based). CGLIB generates a subclass at runtime. Subclasses CANNOT override `private` methods in Java — it's a JVM rule. So the proxy subclass has no way to intercept the private method call. **The deeper issue:** Even `this.privateMethod()` bypasses the proxy — the call goes directly to the real object, not through the proxy. Fix: either make the method `public`/`protected`, or extract to a separate Spring bean (self-injection).\n\n</details>

## Week 3: JPA Deep Dive + Data Access

### Day 15 — JPA Architecture & Entity Mapping

| Block | Topic                                                             | File                                                        |
| ----- | ----------------------------------------------------------------- | ----------------------------------------------------------- |
| 📖    | JPA vs Hibernate vs Spring Data JPA, Entity mapping               | [Ch40_SB_JPA_Deep_Dive.md](Ch40_SB_JPA_Deep_Dive.md) Ch 1-2 |
| 💻    | Create 5 entities with different @Column configs                  | Same file                                                   |
| 🧪    | Check generated DDL, compare with expected                        | Practice                                                    |
| 📝    | JPA = spec, Hibernate = implementation, Spring Data = convenience | Notes                                                       |

**Key concepts:** @Entity, @Table, @Column, @GeneratedValue strategies

---

### Day 16 — Relationships & Fetch Strategies

| Block | Topic                                                | File                                                        |
| ----- | ---------------------------------------------------- | ----------------------------------------------------------- |
| 📖    | Relationships (1:1, 1:N, N:N), Fetch strategies, N+1 | [Ch40_SB_JPA_Deep_Dive.md](Ch40_SB_JPA_Deep_Dive.md) Ch 3-4 |
| 💻    | Build User-Order-Product relationships               | Same file                                                   |
| 🧪    | Enable SQL logging, find N+1 queries, fix them       | Practice                                                    |
| 📝    | LAZY vs EAGER — WHY LAZY is default?                 | Notes                                                       |

**Key concepts:** @OneToMany, @ManyToMany, FetchType.LAZY, JOIN FETCH, @EntityGraph

---

### Day 17 — Entity Lifecycle, Cascades, Transactions

| Block | Topic                                                      | File                                                        |
| ----- | ---------------------------------------------------------- | ----------------------------------------------------------- |
| 📖    | Persistence context, Cascade, Transactions                 | [Ch40_SB_JPA_Deep_Dive.md](Ch40_SB_JPA_Deep_Dive.md) Ch 5-7 |
| 💻    | Test CascadeType.ALL, PERSIST, REMOVE differences          | Same file                                                   |
| 🧪    | See dirty checking in action (modify entity, no save call) | Practice                                                    |
| 📝    | @Transactional: WHY, propagation levels, isolation         | Notes                                                       |

**Key concepts:** Managed/Detached state, dirty checking, @Transactional, REQUIRES_NEW

---

### Day 18 — Pagination & Sorting

| Block | Topic                                          | File                                                                      |
| ----- | ---------------------------------------------- | ------------------------------------------------------------------------- |
| 📖    | Page, Slice, Cursor-based pagination, Sorting  | [Ch52_SB_WebSocket_GraphQL_gRPC.md](Ch52_SB_WebSocket_GraphQL_gRPC.md) §5 |
| 💻    | Add pagination to your CRUD API                | Same file                                                                 |
| 🧪    | Compare Page vs Slice performance              | Practice                                                                  |
| 📝    | WHY cursor pagination > offset for large data? | Notes                                                                     |

**Key concepts:** PageRequest, Sort, Page vs Slice, cursor-based pagination

---

### Day 19 — Clean Architecture & Code Quality

| Block | Topic                                               | File                                                                      |
| ----- | --------------------------------------------------- | ------------------------------------------------------------------------- |
| 📖    | Layered architecture, Package structure, Clean code | [Ch41_SB_Architecture_Quality.md](Ch41_SB_Architecture_Quality.md) Ch 1-4 |
| 💻    | Restructure your project to clean architecture      | Same file                                                                 |
| 🧪    | Code review your own project                        | Practice                                                                  |
| 📝    | Package-by-feature vs Package-by-layer              | Notes                                                                     |

**Key concepts:** Controller/Service/Repository layers, package structure, naming

---

### Day 20 — Error Handling + Config + Postman

| Block | Topic                                                    | File                                                                                                                                      |
| ----- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 📖    | Error handling strategy, Configuration, Postman advanced | [Ch41_SB_Architecture_Quality.md](Ch41_SB_Architecture_Quality.md) Ch 5-8 + [Ch42_SB_HTTP_Deep_Dive.md](Ch42_SB_HTTP_Deep_Dive.md) Ch 8-9 |
| 💻    | Global error handler + Postman collection                | Both files                                                                                                                                |
| 🧪    | Postman environment variables, test scripts              | Practice                                                                                                                                  |
| 📝    | REVIEW Week 3 — you now know JPA, APIs, Architecture!    | Notes                                                                                                                                     |

**Milestone: 🎉 You can build production-quality REST APIs!**

---

### Day 21 — SOLID Principles in Spring Boot

| Block | Topic                                     | File                                           |
| ----- | ----------------------------------------- | ---------------------------------------------- |
| 📖    | SRP, OCP, LSP, ISP, DIP applied to Spring | [Ch38_SB_SOLID_Core.md](Ch38_SB_SOLID_Core.md) |
| 💻    | Refactor your project following SOLID     | Same file                                      |
| 🧪    | Identify SOLID violations in your code    | Practice                                       |
| 📝    | Each principle in 1 sentence with example | Notes                                          |

**Key concepts:** Single Responsibility, Open/Closed, Dependency Inversion

---

🔬 **Section Challenge — Week 3: JPA Deep Dive + Data Access**

**Challenge 1 (Reasoning):** N+1 query problem — explain with a concrete JPA example and show the fix.

<details><summary>Answer</summary>

```java
// N+1: fetches all orders (1 query), then for EACH order fetches customer (N queries)
List<Order> orders = orderRepo.findAll(); // 1 query
orders.forEach(o -> System.out.println(o.getCustomer().getName())); // N queries!

// Fix 1: JOIN FETCH
@Query("SELECT o FROM Order o JOIN FETCH o.customer")
List<Order> findAllWithCustomer();

// Fix 2: EntityGraph
@EntityGraph(attributePaths = "customer")
List<Order> findAll();
```

Both load orders + customers in ONE query (JOIN). Always check Hibernate's SQL log in development.

</details>

# PHASE 2: PRODUCTION READY (Week 4-6) 🟡

**Goal:** Security, Testing, Caching, Essential production features

---

## Week 4: Security + Auth

### Day 22 — Spring Security Fundamentals

| Block | Topic                                                | File                                                                                                                      |
| ----- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| 📖    | Security architecture, Filter chain, Authentication  | [Ch34_SB_Security_Part4.md](Ch34_SB_Security_Part4.md) Ch 7 + [Ch43_SB_Auth_Security.md](Ch43_SB_Auth_Security.md) Ch 1-2 |
| 💻    | Add Spring Security to your project                  | Both files                                                                                                                |
| 🧪    | See the default login page, check security filters   | Practice                                                                                                                  |
| 📝    | SecurityFilterChain — HOW Spring intercepts requests | Notes                                                                                                                     |

**Key concepts:** SecurityFilterChain, AuthenticationManager, UserDetailsService

---

### Day 23 — JWT Authentication

| Block | Topic                                                           | File                                                        |
| ----- | --------------------------------------------------------------- | ----------------------------------------------------------- |
| 📖    | JWT explained, JWT auth flow, Implementation                    | [Ch43_SB_Auth_Security.md](Ch43_SB_Auth_Security.md) Ch 3-5 |
| 💻    | Complete JWT login/register implementation                      | Same file                                                   |
| 🧪    | Test with Postman: register → login → access protected endpoint | Practice                                                    |
| 📝    | JWT structure: Header.Payload.Signature                         | Notes                                                       |

**Key concepts:** JWT, refresh tokens, JwtFilter, token validation

---

### Day 24 — Authorization + Database Security

| Block | Topic                                         | File                                                         |
| ----- | --------------------------------------------- | ------------------------------------------------------------ |
| 📖    | RBAC, Method security, OAuth2, API Keys       | [Ch43_SB_Auth_Security.md](Ch43_SB_Auth_Security.md) Ch 6-11 |
| 💻    | Add ADMIN/USER roles, protect endpoints       | Same file                                                    |
| 🧪    | Test role-based access: admin can, user can't | Practice                                                     |
| 📝    | @PreAuthorize vs @Secured vs @RolesAllowed    | Notes                                                        |

**Key concepts:** @PreAuthorize, hasRole, @Secured, OAuth2

---

### Day 25 — Database Security Deep Dive

| Block | Topic                                                     | File                                                     |
| ----- | --------------------------------------------------------- | -------------------------------------------------------- |
| 📖    | User entity, Password encoding, SQL injection, Encryption | [Ch46_SB_Database_Design.md](Ch46_SB_Database_Design.md) |
| 💻    | BCrypt password encoding, audit logging                   | Same file                                                |
| 🧪    | Try SQL injection on your app, verify it's blocked        | Practice                                                 |
| 📝    | Row-level security — WHY and HOW                          | Notes                                                    |

**Key concepts:** BCryptPasswordEncoder, @CreatedBy, @LastModifiedDate, parameterized queries

---

🔬 **Section Challenge — Week 4: Security + Auth**

**Challenge 1 (Diagnostic - Who/What/Where):** A developer adds a new `/api/v1/public` endpoint but it returns 401 Unauthorized. **Who** intercepts this request before it reaches the controller? **Where** in the configuration must this be fixed, and **What** is the exact method call needed in Spring Security 6.x to allow unauthenticated access?

<details><summary>Answer</summary>

**Who intercepts:** The `DelegatingFilterProxy` which hands off to the `SecurityFilterChain` (specifically the `AuthorizationFilter` in Spring Security 6). **Where to fix:** In your `@Configuration` class that defines the `SecurityFilterChain` bean. **What to call:** You must configure the `authorizeHttpRequests` customizer to permit the endpoint: `.requestMatchers("/api/v1/public/**").permitAll()`. If this is missing, the default rule (`anyRequest().authenticated()`) blocks it.

</details>

## Week 5: Testing + Production Features

### Day 26 — Unit Testing (JUnit 5 + Mockito)

| Block | Topic                                | File                                                                          |
| ----- | ------------------------------------ | ----------------------------------------------------------------------------- |
| 📖    | Testing philosophy, JUnit 5, Mockito | [Ch59_SB_Testing_Fundamentals.md](Ch59_SB_Testing_Fundamentals.md) First half |
| 💻    | 10 unit tests for your service layer | Same file                                                                     |
| 🧪    | Mock repository, verify interactions | Practice                                                                      |
| 📝    | @Mock vs @InjectMocks vs @MockBean   | Notes                                                                         |

**Key concepts:** @Test, @Mock, @InjectMocks, when().thenReturn(), verify()

---

### Day 27 — Integration & Controller Testing

| Block | Topic                                             | File                                                                           |
| ----- | ------------------------------------------------- | ------------------------------------------------------------------------------ |
| 📖    | @SpringBootTest, @WebMvcTest, TestContainers, TDD | [Ch59_SB_Testing_Fundamentals.md](Ch59_SB_Testing_Fundamentals.md) Second half |
| 💻    | Write controller tests with MockMvc               | Same file                                                                      |
| 🧪    | Integration test with real H2 database            | Practice                                                                       |
| 📝    | Testing pyramid: Unit > Integration > E2E         | Notes                                                                          |

**Key concepts:** MockMvc, @WebMvcTest, @DataJpaTest, TestContainers

---

### Day 28 — Caching + Async + Scheduling

| Block | Topic                                                     | File                                                                  |
| ----- | --------------------------------------------------------- | --------------------------------------------------------------------- |
| 📖    | Spring Cache, @Async, @Scheduled                          | [Ch44_SB_Caching_Scheduling.md](Ch44_SB_Caching_Scheduling.md) Ch 1-3 |
| 💻    | Add caching to your API, create async task, scheduled job | Same file                                                             |
| 🧪    | Verify cache hit/miss in logs                             | Practice                                                              |
| 📝    | @Cacheable vs @CacheEvict vs @CachePut                    | Notes                                                                 |

**Key concepts:** @EnableCaching, @Cacheable, @Async, @Scheduled, cron expressions

---

### Day 29 — Actuator + Swagger + Logging

| Block | Topic                                           | File                                                                     |
| ----- | ----------------------------------------------- | ------------------------------------------------------------------------ |
| 📖    | Actuator endpoints, OpenAPI/Swagger, Logging    | [Ch44_SB_Caching_Scheduling.md](Ch44_SB_Caching_Scheduling.md) Ch 4-5, 8 |
| 💻    | Enable actuator, add Swagger UI to your project | Same file                                                                |
| 🧪    | Visit /actuator/health, /swagger-ui.html        | Practice                                                                 |
| 📝    | Which Actuator endpoints to expose in prod?     | Notes                                                                    |

**Key concepts:** /actuator/health, @Tag, @Operation, SLF4J, Logback

---

### Day 30 — File Upload + Email + Externalized Config

| Block | Topic                                       | File                                                                      |
| ----- | ------------------------------------------- | ------------------------------------------------------------------------- |
| 📖    | Multipart upload, JavaMailSender, Config    | [Ch44_SB_Caching_Scheduling.md](Ch44_SB_Caching_Scheduling.md) Ch 6-7, 11 |
| 💻    | Build file upload endpoint, send test email | Same file                                                                 |
| 🧪    | Upload large file, test size limits         | Practice                                                                  |
| 📝    | @ConfigurationProperties vs @Value          | Notes                                                                     |

**Key concepts:** MultipartFile, JavaMailSender, @ConfigurationProperties

---

🔬 **Section Challenge — Week 5: Testing + Production Features**

**Challenge 1 (Reasoning):** You wrote a `@SpringBootTest` that uses `@MockBean` for a repository. Why does your test suite suddenly take 5x longer to run when you add this single test class?

<details><summary>Answer</summary>

Context Caching. Spring Boot optimizes test execution by heavily caching the `ApplicationContext` between test classes. However, when you introduce `@MockBean` (or `@SpyBean`), you are fundamentally altering the beans in the context. Spring realizes the cached context is no longer valid for this specific test, forces a context refresh (which drops the cache), boots up a completely new application context just for this test, and then drops it again. If you scatter `@MockBean` randomly across many test classes, Spring will continuously tear down and rebuild the entire application context, destroying your test suite's performance.

</details>

## Week 6: Database Migrations + Annotations Reference

### Day 31 — Flyway + Liquibase

| Block | Topic                                     | File                                                                                                                                             |
| ----- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| 📖    | Flyway migrations + Liquibase alternative | [Ch44_SB_Caching_Scheduling.md](Ch44_SB_Caching_Scheduling.md) Ch 9 + [Ch52_SB_WebSocket_GraphQL_gRPC.md](Ch52_SB_WebSocket_GraphQL_gRPC.md) §14 |
| 💻    | Set up Flyway, write 3 migration scripts  | Both files                                                                                                                                       |
| 🧪    | Mess up a migration, learn to fix it      | Practice                                                                                                                                         |
| 📝    | WHY database migrations > JPA auto-DDL?   | Notes                                                                                                                                            |

**Key concepts:** V1\_\_init.sql, Flyway naming, Liquibase changelog, rollback

---

### Day 32 — Annotations Complete Reference

| Block | Topic                                                   | File                                                 |
| ----- | ------------------------------------------------------- | ---------------------------------------------------- |
| 📖    | ALL annotations: JPA, Spring, Security, Testing, Lombok | [Ch28_Annotations_Core.md](Ch28_Annotations_Core.md) |
| 💻    | Create a cheat sheet of 30 most-used annotations        | Same file                                            |
| 🧪    | Use 5 annotations you've never used before              | Practice                                             |
| 📝    | Group annotations by category in your notes             | Notes                                                |

**Key concepts:** Every annotation organized by category

---

### Day 33 — i18n + HATEOAS + Spring Data REST

| Block | Topic                                             | File                                                                               |
| ----- | ------------------------------------------------- | ---------------------------------------------------------------------------------- |
| 📖    | Internationalization, HATEOAS, Spring Data REST   | [Ch52_SB_WebSocket_GraphQL_gRPC.md](Ch52_SB_WebSocket_GraphQL_gRPC.md) §6, §7, §13 |
| 💻    | Add i18n to error messages, HATEOAS to 1 endpoint | Same file                                                                          |
| 🧪    | Test with Accept-Language: hi header              | Practice                                                                           |
| 📝    | When HATEOAS makes sense vs when it's overkill    | Notes                                                                              |

**Key concepts:** MessageSource, EntityModel, @RepositoryRestResource

---

### Day 34 — Rate Limiting + Pagination Review

| Block | Topic                                          | File                                                                       |
| ----- | ---------------------------------------------- | -------------------------------------------------------------------------- |
| 📖    | API Rate Limiting with Bucket4j                | [Ch52_SB_WebSocket_GraphQL_gRPC.md](Ch52_SB_WebSocket_GraphQL_gRPC.md) §12 |
| 💻    | Add rate limiting filter to your API           | Same file                                                                  |
| 🧪    | Hit API 100 times quickly, verify 429 response | Practice                                                                   |
| 📝    | Token Bucket algorithm — draw the diagram      | Notes                                                                      |

**Milestone: 🎉 You can build secure, tested, production-ready apps!**

---

# PHASE 3: EXPERT / CLOUD (Week 7-10) 🔴

**Goal:** Advanced patterns, Microservices, Cloud deployment, Expert topics

---

## Week 7: Messaging + Reactive

### Day 35 — Kafka & RabbitMQ

| Block | Topic                                              | File                                                                 |
| ----- | -------------------------------------------------- | -------------------------------------------------------------------- |
| 📖    | Messaging basics, Kafka produce/consume, RabbitMQ  | [Ch44_SB_Caching_Scheduling.md](Ch44_SB_Caching_Scheduling.md) Ch 12 |
| 💻    | Set up Kafka with Docker, produce/consume messages | Same file                                                            |
| 🧪    | Send 1000 messages, verify all consumed            | Practice                                                             |
| 📝    | Kafka vs RabbitMQ — when to use which?             | Notes                                                                |

**Key concepts:** @KafkaListener, KafkaTemplate, @RabbitListener, RabbitTemplate

---

### Day 36 — WebSockets & SSE

| Block | Topic                                      | File                                                                      |
| ----- | ------------------------------------------ | ------------------------------------------------------------------------- |
| 📖    | WebSocket, STOMP, Server-Sent Events       | [Ch52_SB_WebSocket_GraphQL_gRPC.md](Ch52_SB_WebSocket_GraphQL_gRPC.md) §1 |
| 💻    | Build a simple chat app with WebSocket     | Same file                                                                 |
| 🧪    | Open 2 browser tabs, chat between them     | Practice                                                                  |
| 📝    | WebSocket vs SSE vs Polling decision chart | Notes                                                                     |

**Key concepts:** @MessageMapping, SimpMessagingTemplate, SseEmitter, STOMP

---

### Day 37 — Reactive Programming (WebFlux) Part 1

| Block | Topic                                         | File                                                      |
| ----- | --------------------------------------------- | --------------------------------------------------------- |
| 📖    | Reactive fundamentals, Mono, Flux, Operators  | [Ch48_SB_WebFlux_Core.md](Ch48_SB_WebFlux_Core.md) Ch 1-5 |
| 💻    | Build reactive GET endpoints with Flux        | Same file                                                 |
| 🧪    | Stream data to browser with text/event-stream | Practice                                                  |
| 📝    | Mono = 0 or 1 item, Flux = 0 to N items       | Notes                                                     |

**Key concepts:** Mono, Flux, map, flatMap, zip, WebFlux controllers

---

### Day 38 — Reactive Programming Part 2

| Block | Topic                                              | File                                                       |
| ----- | -------------------------------------------------- | ---------------------------------------------------------- |
| 📖    | R2DBC, WebClient, Error handling, Testing          | [Ch48_SB_WebFlux_Core.md](Ch48_SB_WebFlux_Core.md) Ch 6-11 |
| 💻    | WebClient to call external API, StepVerifier tests | Same file                                                  |
| 🧪    | Compare WebClient vs RestTemplate performance      | Practice                                                   |
| 📝    | MVC vs WebFlux — decision framework                | Notes                                                      |

**Key concepts:** R2DBC, WebClient, StepVerifier, backpressure

---

🔬 **Section Challenge — Week 7: Messaging + Reactive**

**Challenge 1 (Reasoning):** In Spring WebFlux, if you call a blocking database operation (like standard JDBC) inside a reactive `map()` operator, the entire application freezes under load. Why does WebFlux completely collapse, whereas standard Spring MVC survives?

<details><summary>Answer</summary>

Thread Starvation. Spring MVC allocates one thread per request (e.g., 200 Tomcat threads). If a thread blocks on JDBC, only that specific user is delayed. WebFlux uses the Event Loop model (Netty), running on just a handful of threads (typically 1 per CPU core). If you execute a blocking JDBC call on the Event Loop thread, you literally freeze the core routing engine of the application. No new requests can be accepted, and no ongoing events can be processed until that DB call returns. This is why you **must** use non-blocking drivers (R2DBC) or strictly offload blocking calls to a separate bounded thread pool (`Schedulers.boundedElastic()`) in reactive apps.

</details>

## Week 8: Microservices

### Day 39 — Microservices Architecture + Service Discovery

| Block | Topic                                        | File                                                                      |
| ----- | -------------------------------------------- | ------------------------------------------------------------------------- |
| 📖    | Architecture overview, Eureka, Consul        | [Ch61_SB_Microservices_Core.md](Ch61_SB_Microservices_Core.md) First half |
| 💻    | Set up Eureka Server + 2 client services     | Same file                                                                 |
| 🧪    | Kill a service, watch Eureka deregister it   | Practice                                                                  |
| 📝    | Monolith vs Microservice — decision criteria | Notes                                                                     |

**Key concepts:** @EnableEurekaServer, @EnableDiscoveryClient, service registry

---

### Day 40 — API Gateway + Circuit Breaker

| Block | Topic                                                          | File                                                                  |
| ----- | -------------------------------------------------------------- | --------------------------------------------------------------------- |
| 📖    | API Gateway, Circuit Breaker (Resilience4j), Load Balancing    | [Ch61_SB_Microservices_Core.md](Ch61_SB_Microservices_Core.md) Middle |
| 💻    | Spring Cloud Gateway with routes, Resilience4j circuit breaker | Same file                                                             |
| 🧪    | Simulate service failure, verify circuit opens                 | Practice                                                              |
| 📝    | Circuit states: CLOSED → OPEN → HALF_OPEN                      | Notes                                                                 |

**Key concepts:** Spring Cloud Gateway, @CircuitBreaker, fallback, retry

---

### Day 41 — Config Server + Saga + CQRS

| Block | Topic                                               | File                                                                       |
| ----- | --------------------------------------------------- | -------------------------------------------------------------------------- |
| 📖    | Config management, Saga pattern, CQRS, Event-driven | [Ch61_SB_Microservices_Core.md](Ch61_SB_Microservices_Core.md) Second half |
| 💻    | Spring Cloud Config Server from Git repo            | Same file                                                                  |
| 🧪    | Change config in Git, see app pick it up            | Practice                                                                   |
| 📝    | Saga choreography vs orchestration                  | Notes                                                                      |

**Key concepts:** Config Server, Saga, CQRS, @EventListener

---

### Day 42 — Distributed Tracing

| Block | Topic                                                     | File                                                             |
| ----- | --------------------------------------------------------- | ---------------------------------------------------------------- |
| 📖    | Tracing fundamentals, Micrometer, Zipkin, Log correlation | [Ch53_SB_Distributed_Tracing.md](Ch53_SB_Distributed_Tracing.md) |
| 💻    | Add tracing to 2 microservices, set up Zipkin             | Same file                                                        |
| 🧪    | Make request through gateway, trace in Zipkin UI          | Practice                                                         |
| 📝    | TraceID = entire request, SpanID = single service         | Notes                                                            |

**Key concepts:** Micrometer Tracing, Zipkin, trace-id, span-id, baggage

---

🔬 **Section Challenge — Week 8: Microservices**

**Challenge 1 (Reasoning):** Service A calls Service B which calls Service C. C is slow. How does this cause a cascade failure?

<details><summary>Answer</summary>

Without circuit breakers: A has a thread pool for B calls. B is slow (waiting for C) → B responses are slow → A's thread pool fills with waiting threads → A's thread pool exhausted → A becomes slow for ALL callers, not just B-related ones. Cascade: C slow → B slow → A slow → entire system degraded. Fix: Resilience4j circuit breaker — after N failures, 'open' the circuit → fail fast with fallback response instead of waiting. Timeouts + bulkhead patterns to isolate failure.

</details>

## Week 9: Cloud + Docker + GraphQL + gRPC

### Day 43 — Docker + Kubernetes

| Block | Topic                                           | File                                                                                                                             |
| ----- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 📖    | Docker containers, K8s deployment               | [Ch63_SB_Cloud_Core.md](Ch63_SB_Cloud_Core.md) First half + [Ch44_SB_Caching_Scheduling.md](Ch44_SB_Caching_Scheduling.md) Ch 10 |
| 💻    | Dockerfile for your app, docker-compose with DB | Both files                                                                                                                       |
| 🧪    | Build image, run container, test API            | Practice                                                                                                                         |
| 📝    | Multi-stage Docker build — WHY?                 | Notes                                                                                                                            |

**Key concepts:** Dockerfile, docker-compose, K8s Pod/Service/Deployment

---

### Day 44 — Cloud Deployment (AWS/Azure/GCP)

| Block | Topic                                      | File                                                       |
| ----- | ------------------------------------------ | ---------------------------------------------------------- |
| 📖    | AWS, Azure, GCP deployment, CI/CD, Secrets | [Ch63_SB_Cloud_Core.md](Ch63_SB_Cloud_Core.md) Second half |
| 💻    | GitHub Actions CI/CD pipeline              | Same file                                                  |
| 🧪    | Deploy to a cloud provider (free tier)     | Practice                                                   |
| 📝    | IaC: Terraform vs CloudFormation           | Notes                                                      |

**Key concepts:** ECS, App Service, Cloud Run, GitHub Actions, Terraform

---

### Day 45 — GraphQL with Spring Boot

| Block | Topic                                          | File                                                                      |
| ----- | ---------------------------------------------- | ------------------------------------------------------------------------- |
| 📖    | GraphQL schema, queries, mutations, DataLoader | [Ch52_SB_WebSocket_GraphQL_gRPC.md](Ch52_SB_WebSocket_GraphQL_gRPC.md) §2 |
| 💻    | Build GraphQL API replacing your REST endpoint | Same file                                                                 |
| 🧪    | Use GraphiQL playground, compare with REST     | Practice                                                                  |
| 📝    | GraphQL vs REST — decision matrix              | Notes                                                                     |

**Key concepts:** @QueryMapping, @MutationMapping, @BatchMapping, schema.graphqls

---

### Day 46 — gRPC + Spring Batch

| Block | Topic                                                | File                                                                          |
| ----- | ---------------------------------------------------- | ----------------------------------------------------------------------------- |
| 📖    | gRPC basics, Protocol Buffers, Spring Batch          | [Ch52_SB_WebSocket_GraphQL_gRPC.md](Ch52_SB_WebSocket_GraphQL_gRPC.md) §3, §4 |
| 💻    | Create .proto file, implement gRPC service           | Same file                                                                     |
| 🧪    | Build batch job to import CSV                        | Practice                                                                      |
| 📝    | gRPC = internal, REST = external, GraphQL = flexible | Notes                                                                         |

**Key concepts:** .proto, StreamObserver, ItemReader, ItemProcessor, ItemWriter, chunk

---

> 🔬 **Section Challenge — Week 9: Cloud + Docker + GraphQL + gRPC**
>
> **Challenge 1 (Systems Architecture):** You are exposing a single GraphQL endpoint to the frontend, which aggregates data from multiple backend gRPC microservices. What is the biggest performance trap with this "GraphQL over gRPC" design when querying nested relationships (e.g., fetching a User, their 50 Orders, and the 3 Items per Order), and how do you solve it?
>
> <details><summary>Answer</summary>
>
> **Scenario:** The Distributed N+1 Problem in GraphQL DataFetchers.
> **Trace:** In REST + JPA, N+1 occurs in the database layer. In GraphQL over microservices, N+1 becomes a _network-level_ catastrophe. The GraphQL engine resolves the `User` (1 gRPC call to UserService). Then for their 50 `Orders`, it makes 50 distinct gRPC calls to the OrderService. Finally, for the 150 total `Items`, it makes 150 distinct gRPC calls to the InventoryService. What was one frontend query just spawned 201 network requests across your infrastructure, crushing latency.
> **Debug/Fix:** Use the **DataLoader** pattern (implemented via `org.dataloader` in Spring for GraphQL). DataLoader batches and caches resolution requests at the field level. Instead of making 50 individual gRPC calls for orders, DataLoader aggregates the 50 User IDs, waits for the current tick of the event loop, and dispatches a _single_ batched gRPC request (`getOrdersByUserIds(List<String>)`) to the OrderService. This reduces the network calls from 201 to exactly 3.
>
> </details>

## Week 10: Expert Topics + Capstone

### Day 47 — Spring Boot 3.x + GraalVM + Spring Modulith

| Block | Topic                                                            | File                                                                                |
| ----- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| 📖    | Records, Sealed classes, Virtual Threads, Native Image, Modulith | [Ch52_SB_WebSocket_GraphQL_gRPC.md](Ch52_SB_WebSocket_GraphQL_gRPC.md) §9, §10, §11 |
| 💻    | Convert DTOs to Records, try native compile                      | Same file                                                                           |
| 🧪    | Enable virtual threads, load test                                | Practice                                                                            |
| 📝    | Virtual Threads = game changer for I/O apps                      | Notes                                                                               |

**Key concepts:** record, sealed, virtual threads, AOT, ApplicationModules

---

### Day 48 — Multi-Tenancy + DSA in Spring Boot

| Block | Topic                                            | File                                                                                                                                   |
| ----- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| 📖    | Multi-tenancy strategies, DSA applied to backend | [Ch52_SB_WebSocket_GraphQL_gRPC.md](Ch52_SB_WebSocket_GraphQL_gRPC.md) §8 + [Ch50_SB_DSA_Applications.md](Ch50_SB_DSA_Applications.md) |
| 💻    | Implement tenant filter, LRU cache service       | Both files                                                                                                                             |
| 🧪    | Test with 2 different X-Tenant-ID headers        | Practice                                                                                                                               |
| 📝    | Where DSA shows up in real Spring Boot apps      | Notes                                                                                                                                  |

**Key concepts:** TenantContext, Hibernate filter, Trie, LRU cache, Priority Queue

---

### Day 49 — Industry Projects Study

| Block | Topic                                   | File                                                         |
| ----- | --------------------------------------- | ------------------------------------------------------------ |
| 📖    | 5 industry project blueprints           | [Ch51_SB_Industry_Projects.md](Ch51_SB_Industry_Projects.md) |
| 💻    | Pick 1 project, implement core feature  | Same file                                                    |
| 🧪    | Design the database schema              | Practice                                                     |
| 📝    | What makes an "industry-level" project? | Notes                                                        |

**Key concepts:** Notification engine, Feature flags, Analytics, Workflow engine

---

### Day 50 — CAPSTONE: Build a Complete Application

| Block | Topic                                                    | Activity               |
| ----- | -------------------------------------------------------- | ---------------------- |
| 📖    | Review ALL files                                         | Pick the best patterns |
| 💻    | Build: REST API + JWT + JPA + Caching + Testing + Docker | Full project           |
| 🧪    | 80%+ test coverage, Swagger docs, Docker image           | Verify                 |
| 📝    | Write README.md for your project (portfolio-ready)       | Documentation          |

**Final Checklist:**

- [ ] REST CRUD APIs with validation
- [ ] JWT authentication + RBAC
- [ ] JPA with proper relationships
- [ ] Pagination + Sorting
- [ ] Caching with Redis/in-memory
- [ ] Exception handling + i18n
- [ ] Unit + Integration tests (80%+)
- [ ] Swagger/OpenAPI docs
- [ ] Flyway DB migrations
- [ ] Dockerized deployment
- [ ] CI/CD pipeline
- [ ] Clean architecture + SOLID

---

# 📊 COMPLETE TOPIC COVERAGE MAP

| #   | Topic                                      | Level        | Part       | Day |
| --- | ------------------------------------------ | ------------ | ---------- | --- |
| 1   | Lambda, Streams, Optional                  | Beginner     | 01         | 1   |
| 2   | JVM Memory, GC                             | Beginner     | Part 1     | 2   |
| 3   | Reflection, Annotations                    | Intermediate | Part 0     | 3   |
| 4   | Proxies, Servlets, Design Patterns         | Intermediate | Part 0     | 4   |
| 5   | Jackson, HikariCP, Maven                   | Beginner     | Part 0     | 5   |
| 6   | IoC, DI, Beans, Scopes                     | Beginner     | Part 2     | 6   |
| 7   | Events, Lifecycle                          | Intermediate | Part 2     | 7   |
| 8   | AOP                                        | Intermediate | Part 3     | 8   |
| 9   | Auto-config, Profiles, Lombok              | Beginner     | Part 3,5   | 9   |
| 10  | DTOs, HTTP Deep Dive                       | Intermediate | Part 5,10  | 10  |
| 11  | Controllers, REST APIs                     | Beginner     | Part 7     | 11  |
| 12  | Validation, Exception Handling             | Beginner     | Part 7     | 12  |
| 13  | Service Layer, Repository                  | Intermediate | Part 6     | 13  |
| 14  | Derived Queries, @Query, Specs             | Intermediate | Part 6     | 14  |
| 15  | JPA Architecture, Entities                 | Intermediate | Part 8     | 15  |
| 16  | Relationships, N+1, Fetch                  | Intermediate | Part 8     | 16  |
| 17  | Persistence Context, Cascade, Transactions | Advanced     | Part 8     | 17  |
| 18  | Pagination, Sorting                        | Beginner     | Part 23    | 18  |
| 19  | Clean Architecture                         | Intermediate | Part 9     | 19  |
| 20  | Error Handling, Config, Postman            | Intermediate | Part 9,10  | 20  |
| 21  | SOLID Principles                           | Intermediate | Part 16    | 21  |
| 22  | Spring Security Fundamentals               | Intermediate | Part 4,11  | 22  |
| 23  | JWT Authentication                         | Intermediate | Part 11    | 23  |
| 24  | Authorization, RBAC, OAuth2                | Advanced     | Part 11    | 24  |
| 25  | Database Security                          | Advanced     | Part 17    | 25  |
| 26  | Unit Testing (JUnit + Mockito)             | Intermediate | Part 19    | 26  |
| 27  | Integration Testing, TDD                   | Advanced     | Part 19    | 27  |
| 28  | Caching, @Async, Scheduling                | Intermediate | Part 14    | 28  |
| 29  | Actuator, Swagger, Logging                 | Beginner     | Part 14    | 29  |
| 30  | File Upload, Email, Config                 | Intermediate | Part 14    | 30  |
| 31  | Flyway, Liquibase                          | Intermediate | Part 14,23 | 31  |
| 32  | ALL Annotations Reference                  | All          | Part 22    | 32  |
| 33  | i18n, HATEOAS, Data REST                   | Intermediate | Part 23    | 33  |
| 34  | Rate Limiting                              | Intermediate | Part 23    | 34  |
| 35  | Kafka, RabbitMQ                            | Advanced     | Part 14    | 35  |
| 36  | WebSockets, SSE                            | Intermediate | Part 23    | 36  |
| 37  | Reactive/WebFlux Part 1                    | Advanced     | Part 15    | 37  |
| 38  | Reactive/WebFlux Part 2                    | Advanced     | Part 15    | 38  |
| 39  | Microservices, Service Discovery           | Advanced     | Part 20    | 39  |
| 40  | API Gateway, Circuit Breaker               | Advanced     | Part 20    | 40  |
| 41  | Config Server, Saga, CQRS                  | Expert       | Part 20    | 41  |
| 42  | Distributed Tracing                        | Expert       | Part 18    | 42  |
| 43  | Docker, Kubernetes                         | Intermediate | Part 21,14 | 43  |
| 44  | Cloud (AWS/Azure/GCP), CI/CD               | Advanced     | Part 21    | 44  |
| 45  | GraphQL                                    | Intermediate | Part 23    | 45  |
| 46  | gRPC, Spring Batch                         | Advanced     | Part 23    | 46  |
| 47  | Java 17+, GraalVM, Modulith                | Expert       | Part 23    | 47  |
| 48  | Multi-Tenancy, DSA in Backend              | Expert       | Part 23,12 | 48  |
| 49  | Industry Projects                          | Expert       | Part 13    | 49  |
| 50  | CAPSTONE Project                           | All          | All Parts  | 50  |

---

# 📁 FILE REFERENCE

| File                                                                   | Content                                                                                                                                     | Used In                  |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| [Ch06_Functional_Programming.md](Ch06_Functional_Programming.md)       | Streams, Lambda, Optional                                                                                                                   | Day 1                    |
| [Ch20_AlgoEng_Core.md](Ch20_AlgoEng_Core.md)                           | Algorithm optimization                                                                                                                      | Reference                |
| [Ch26_Pre_Spring_Part1.md](Ch26_Pre_Spring_Part1.md)                   | Reflection, Proxy, Servlets, Jackson                                                                                                        | Day 3-5                  |
| [Ch31_SB_Core_Part1.md](Ch31_SB_Core_Part1.md)                         | JVM, Memory, GC, Threading                                                                                                                  | Day 2                    |
| [Ch32_SB_Data_Part2.md](Ch32_SB_Data_Part2.md)                         | IoC, DI, Beans, Events                                                                                                                      | Day 6-7                  |
| [Ch33_SB_Web_Part3.md](Ch33_SB_Web_Part3.md)                           | AOP, Auto-config, Profiles                                                                                                                  | Day 8-9                  |
| [Ch34_SB_Security_Part4.md](Ch34_SB_Security_Part4.md)                 | JPA, REST, Security basics                                                                                                                  | Day 22                   |
| [Ch35_SB_Lombok_DTOs.md](Ch35_SB_Lombok_DTOs.md)                       | Lombok, DTO patterns                                                                                                                        | Day 9-10                 |
| [Ch36_SB_Service_Repository.md](Ch36_SB_Service_Repository.md)         | Service layer, Repository                                                                                                                   | Day 13-14                |
| [Ch37_SB_Controllers_REST.md](Ch37_SB_Controllers_REST.md)             | Controllers, Validation                                                                                                                     | Day 11-12                |
| [Ch40_SB_JPA_Deep_Dive.md](Ch40_SB_JPA_Deep_Dive.md)                   | JPA, Relationships, N+1                                                                                                                     | Day 15-17                |
| [Ch41_SB_Architecture_Quality.md](Ch41_SB_Architecture_Quality.md)     | Clean architecture                                                                                                                          | Day 19-20                |
| [Ch42_SB_HTTP_Deep_Dive.md](Ch42_SB_HTTP_Deep_Dive.md)                 | HTTP, Postman, @PathVariable                                                                                                                | Day 10, 20               |
| [Ch43_SB_Auth_Security.md](Ch43_SB_Auth_Security.md)                   | JWT, OAuth2, RBAC                                                                                                                           | Day 22-24                |
| [Ch50_SB_DSA_Applications.md](Ch50_SB_DSA_Applications.md)             | DSA in backend                                                                                                                              | Day 48                   |
| [Ch51_SB_Industry_Projects.md](Ch51_SB_Industry_Projects.md)           | 5 project blueprints                                                                                                                        | Day 49                   |
| [Ch44_SB_Caching_Scheduling.md](Ch44_SB_Caching_Scheduling.md)         | Cache, Async, Actuator, Kafka, Docker                                                                                                       | Day 28-31, 35, 43        |
| [Ch48_SB_WebFlux_Core.md](Ch48_SB_WebFlux_Core.md)                     | WebFlux, Mono, Flux, R2DBC                                                                                                                  | Day 37-38                |
| [Ch38_SB_SOLID_Core.md](Ch38_SB_SOLID_Core.md)                         | SOLID in Spring                                                                                                                             | Day 21                   |
| [Ch46_SB_Database_Design.md](Ch46_SB_Database_Design.md)               | DB security, encryption                                                                                                                     | Day 25                   |
| [Ch53_SB_Distributed_Tracing.md](Ch53_SB_Distributed_Tracing.md)       | Tracing, Zipkin                                                                                                                             | Day 42                   |
| [Ch59_SB_Testing_Fundamentals.md](Ch59_SB_Testing_Fundamentals.md)     | JUnit, Mockito, TDD                                                                                                                         | Day 26-27                |
| [Ch61_SB_Microservices_Core.md](Ch61_SB_Microservices_Core.md)         | Microservices patterns                                                                                                                      | Day 39-41                |
| [Ch63_SB_Cloud_Core.md](Ch63_SB_Cloud_Core.md)                         | Docker, K8s, AWS, CI/CD                                                                                                                     | Day 43-44                |
| [Ch28_Annotations_Core.md](Ch28_Annotations_Core.md)                   | All annotations                                                                                                                             | Day 32                   |
| [Ch52_SB_WebSocket_GraphQL_gRPC.md](Ch52_SB_WebSocket_GraphQL_gRPC.md) | WebSocket, GraphQL, gRPC, Batch, Pagination, HATEOAS, i18n, Multi-tenancy, Java 17+, GraalVM, Modulith, Rate Limiting, Data REST, Liquibase | Day 18, 33-34, 36, 45-48 |

---

_50 Days • 50 Topics • Beginner → Expert • All in your workspace_

---

### Production Reality

This 50-day plan teaches you to write Spring Boot code. It does not teach you to operate it. These are the production failure modes you will encounter after Day 50 — and why the plan alone is insufficient.

**Named failure modes (taught across the chapters referenced by this plan):**

- **`JPA N+1 query problem`** — Day 15-17 (Ch40) teaches JPA relationships. The failure: `@OneToMany` lazy loading without `JOIN FETCH` generates N+1 queries (1 to load parent + N to load each child) for every list display. At 1000 rows, this is 1001 database round trips. **Debug workflow:** Enable SQL logging: `spring.jpa.show-sql=true` and count the queries in a page load. Fix with `JOIN FETCH` in JPQL or `@EntityGraph`. Monitor with Micrometer: `hikaricp.connections.active` spikes correlate with N+1 patterns.

- **`Spring circular dependency`** — Day 6-7 (Ch32) teaches IoC/DI. The failure: two `@Service` beans each constructor-inject the other. `BeanCurrentlyInCreationException` at startup. **Debug workflow:** Enable `logging.level.org.springframework.beans=DEBUG`. Fix with `@Lazy` annotation on one injection point or refactor to a third intermediate service.

- **`@Transactional` rollback-only** — Day 22 (Ch34) teaches transactions. The failure: checked exception thrown inside a `@Transactional(readOnly=true)` method marks the transaction rollback-only, so subsequent code in the same transaction silently succeeds without persisting. **Debug workflow:** Add `transactionManager.setGlobalRollbackOnParticipationFailure(false)` as a debug hook, or use `@Transactional(noRollbackFor = Exception.class)` carefully. Always check `TransactionSynchronizationManager.isActualTransactionActive()` before committing in nested transaction scenarios.

- **`@Async` void return value (fire-and-forget swallowed exception)** — Day 37-38 (Ch48) teaches async. The failure: `@Async` on a method returning `void` swallows exceptions — they disappear silently. **Debug workflow:** Return `CompletableFuture<Void>` and attach `.exceptionally(ex -> {...})`. Or use `@Async("taskExecutor")` with an `AsyncUncaughtExceptionHandler`. Without this, background email sending, notification dispatch, and scheduled jobs fail silently.

- **`LazyInitializationException` in tests** — Day 26-27 (Ch59) teaches testing. The failure: `@DataJpaTest` loads lazily but the test accesses a lazy association after the test method ends, outside the auto-configured transaction. **Debug workflow:** Use `JOIN FETCH` in the repository query to eagerly load associations under test. Or wrap the test in `@Transactional` (the default for `@DataJpaTest`) and ensure the access happens before commit.

- **Missing Spring profile in production** — Day 28-31 (Ch44) teaches profiles. The failure: application starts with no active profile, falls back to defaults that connect to localhost DB. **Debug workflow:** Always set `SPRING_PROFILES_ACTIVE=prod` in the environment. Add `spring.profiles.active` to a startup check that fails fast if the configured profile is not a known-safe list.

---

### Conceptual Depth: Auto-Configuration Philosophy

The invariant of auto-configuration is: every sensible default should be opinionated and overridable. This holds because Spring Boot must guess the right configuration while respecting the developer's explicit intent when they diverge. The principle breaks down when two auto-configurations conflict for the same bean — at that point the first-loaded wins silently, and the application behaves unexpectedly. Always use `spring.main.allow-bean-definition-overriding=false` in production to catch these conflicts early.

**Invariants:**
- A bean defined in a `@Configuration` class always takes precedence over auto-configuration
- Conditional annotations (`@ConditionalOnClass`, `@ConditionalOnProperty`) mean the bean only exists when the dependency is present

---

> **Navigation**: [< Previous](Ch52_SB_WebSocket_GraphQL_gRPC.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](Ch15_Concurrency_Core.md)


---

## Reality Check

**"Following a linear learning plan means sequential understanding"** — Concepts in Spring Boot are deeply interconnected — you cannot fully understand @Service without understanding @Transactional, which requires understanding proxy mechanics, which requires understanding AOP, which requires understanding BeanPostProcessor. Accept partial understanding in early days and revisit concepts as deeper layers click.

**"Building CRUD apps teaches Spring Boot"** — CRUD apps exercise roughly 15 percent of Spring Boot surface: controllers, repositories, and basic validation. Production Spring Boot requires understanding connection pool tuning with HikariCP, circuit breakers with Resilience4j, distributed tracing with Micrometer, health checks with Actuator, graceful shutdown, and profile-based configuration. Build a CRUD app in week 1, then immediately add production concerns.

**"Unit tests are enough for Spring Boot applications"** — @SpringBootTest loads the entire application context — it is an integration test, not a unit test. True unit tests mock dependencies and test business logic in isolation. Spring Boot applications need BOTH: unit tests for service logic, @WebMvcTest for the controller layer, @DataJpaTest for the repository layer, and @SpringBootTest for end-to-end flows. Each test slice loads only the relevant context.

**"Day 50 means production-ready"** — 50 days of learning produces a developer who can build features. Production-readiness requires understanding failure modes: what happens when the database is down, when a downstream service times out, when memory fills up, when the JVM pauses for GC. These are learned from operating systems under load and debugging incidents, not from tutorials.

**"Spring Boot versions do not matter much"** — Spring Boot 2.x uses javax packages and Spring Boot 3.x uses jakarta packages from the Java EE to Jakarta EE migration. This is not a simple rename — all servlet filters, JPA entities, validation annotations, and dependency injection annotations changed package. Libraries that have not migrated to jakarta break on Spring Boot 3.x. Always check your Spring Boot version matches your dependency ecosystem.
