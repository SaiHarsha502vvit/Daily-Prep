# CSE601 — Spring Boot & Microservices

## Semester 6 · Full-Stack Specialization (Backend Track)

> **Total estimated time:** ~130 hours (16 weeks, ~8h/week)
> **Outcome:** You can build production Spring Boot 3 applications, reason about Spring's auto-configuration mechanism from `@ConditionalOn*` annotations, design microservice boundaries from domain analysis (not technical convenience), and instrument the system end-to-end with Micrometer + OpenTelemetry.
> **Capstone:** Build a multi-service e-commerce platform with circuit breakers, distributed tracing, observability stack, and CI/CD-deployed to Kubernetes.

---

## Navigation

| Course                                                                                                                              | Description |
| ----------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| **CSE601 — Spring Boot & Microservices**                                                                                            | This course |
| **[CSE602 — API Design & Testing](../CSE602_API_Design_And_Testing/README.md)**                                                     | S06 sibling — consumed by this course |
| **[CSE603 — DevOps & CI/CD](../CSE603_DevOps_And_CICD/README.md)**                                                                  | S06 sibling — deploys these services |
| **[CSE604 — Java Concurrency & JVM Internals](../CSE604_Java_Concurrency_And_JVM_Internals/README.md)** | S06 sibling — underlies performance work |

| Related Modules                            | Cross-Reference                                                |
| ------------------------------------------ | -------------------------------------------------------------- |
| `07_Modern_Java/`                          | Primary source — Chapters 24-58 cover Spring Boot              |
| `10_Enterprise_Systems/`                   | DDD bounded contexts inform microservice boundary design       |
| `06_OOP_Design/`                           | SOLID, design patterns underpin Spring's design                |
| `08_SQL/`                                  | JPA layered on top of SQL — N+1, lazy loading                  |
| `22_DevOps/`                               | Deployment target (K8s) for these services                     |

---

## Prerequisites

- `CSE301 OOP & Design Patterns` — SOLID + DI baseline
- `CSE302 Databases & SQL` — query optimization, transactions, isolation
- `07_Modern_Java/Ch01_Java_Foundations.md` through `Ch23_Streams_Deep_Reasoning.md` — Java fluency
- Working dev environment with JDK 21+ and Maven/Gradle

**Constraint:** This course assumes you've completed at least one solo Java project. Spring Boot's "magic" only feels magical when you don't understand DI containers. By Week 3 you should be able to explain Spring's auto-configuration mechanism without referring to docs.

---

## 🗓️ Week-by-Week Plan

### UNIT 1 — Spring Boot Foundations (Weeks 1–3)

#### Week 1 — IoC, DI, Auto-Configuration

| Day | Topic                              | Read                                              | Do                                                       |
| --- | ---------------------------------- | ------------------------------------------------- | -------------------------------------------------------- |
| 1   | IoC + DI from first principles     | `07_Modern_Java/Ch24_Spring_Boot_Intro.md` §1-2   | Refactor a hard-coded dependency to DI manually          |
| 2   | Bean lifecycle, scopes              | `07_Modern_Java/Ch25_Beans_Lifecycle.md`          | Trace bean creation → init → destroy with @PostConstruct |
| 3   | Auto-configuration mechanism        | `07_Modern_Java/Ch26_AutoConfiguration.md`        | Find a `@ConditionalOnMissingBean` in a starter         |
| 4   | Profiles + externalized config     | `07_Modern_Java/Ch27_Configuration_Profiles.md`   | Use a profile for dev/prod DataSource                    |
| 5–7 | Lab + Problem Set SB-PS1            | —                                                 | Build a "hello world" Spring Boot service                |

**Section Challenge (auto-config):**

> You include `spring-boot-starter-web` in your project. Spring Boot detects it on the classpath and auto-configures an embedded Tomcat on port 8080. Explain HOW this happens — what mechanism allows the framework to add Tomcat WITHOUT you writing any configuration?

<details>
<summary>Answer</summary>

```
THE MECHANISM: @ConditionalOnClass + spring.factories / AutoConfiguration imports

STEP 1 — META-INF/spring.factories (Spring Boot 2) or
         META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports
         (Spring Boot 3) lists all auto-config classes:

  org.springframework.boot.autoconfigure.web.servlet.WebMvcAutoConfiguration
  org.springframework.boot.autoconfigure.web.servlet.ServletWebServerFactoryAutoConfiguration

STEP 2 — Each auto-config class is annotated with conditional gates:

  @ConditionalOnClass({ Servlet.class, Tomcat.class })
  @ConditionalOnMissingBean(WebServerFactory.class)
  @Configuration
  public class TomcatServletWebServerFactoryAutoConfiguration {
    @Bean public TomcatServletWebServerFactory tomcatFactory() { ... }
  }

  @ConditionalOnClass checks classpath. Since Tomcat is on classpath
  (because spring-boot-starter-web included it), the condition matches.
  @ConditionalOnMissingBean checks if user already defined a WebServerFactory.
  If not, Spring auto-creates the Tomcat bean.

STEP 3 — At startup, @SpringBootApplication enables auto-config import.
  Spring discovers all *.imports files on classpath, loads each class,
  evaluates conditions, registers beans where conditions match.

WHY THIS MATTERS:
  Auto-config is NOT magic. It's:
  1. Discovery (file-system convention)
  2. Conditional evaluation (@ConditionalOn* annotations)
  3. Bean registration

  You can override ANY auto-configured bean by defining your own.
  @ConditionalOnMissingBean steps aside when you provide an alternative.

DEBUGGING:
  Run with --debug flag → Spring prints "Positive matches" and
  "Negative matches" — every auto-config decision is visible.
  This is how you understand WHY a particular bean got configured.
```

</details>

#### Week 2 — Spring MVC

`07_Modern_Java/Ch28_Spring_MVC_REST.md` — @RestController, @RequestMapping, JSR-380 validation, exception handlers.

#### Week 3 — Data Layer (Spring Data JPA)

`07_Modern_Java/Ch29_Spring_Data_JPA.md` + `Ch20_JPA_Hibernate.md` — repositories, derived queries, projections, JPQL vs Criteria.

---

### UNIT 2 — Transactions & Security (Weeks 4–6)

#### Week 4 — Transaction Management

`07_Modern_Java/Ch31_Transactions_Spring.md` — `@Transactional`, propagation modes, isolation, rollback rules.

#### Week 5 — Spring Security

`07_Modern_Java/Ch32_Spring_Security.md` — filter chain, authentication providers, JWT, OAuth2 Resource Server.

#### Week 6 — Validation + Error Handling

`07_Modern_Java/Ch33_Validation_ErrorHandling.md` — Bean Validation, ProblemDetail (RFC 9457), error aggregation.

---

### UNIT 3 — Reactive Programming (Weeks 7–8)

#### Week 7 — Project Reactor

`07_Modern_Java/Ch40_Reactive_Reactor.md` — Mono, Flux, operators, backpressure, schedulers.

#### Week 8 — Spring WebFlux

`07_Modern_Java/Ch41_Spring_WebFlux.md` — reactive controllers, WebClient, R2DBC, MongoDB Reactive.

---

### UNIT 4 — Microservices (Weeks 9–12)

**Learning Outcomes:**

- Design service boundaries from domain analysis, not technical convenience
- Implement circuit breakers, retries, bulkheads with Resilience4j
- Set up service discovery, API gateway, distributed tracing

#### Week 9 — Service Discovery + API Gateway

`07_Modern_Java/Ch50_Service_Discovery.md` + `Ch51_API_Gateway.md` — Eureka/Consul, Spring Cloud Gateway, routing.

#### Week 10 — Resilience Patterns

`07_Modern_Java/Ch52_Resilience_Patterns.md` — Circuit Breaker, Retry, Bulkhead, Timeout via Resilience4j.

#### Week 11 — Distributed Tracing

`07_Modern_Java/Ch53_Distributed_Tracing.md` — Micrometer Tracing, OpenTelemetry, Zipkin/Tempo, sampling.

#### Week 12 — Inter-Service Communication

`07_Modern_Java/Ch54_Inter_Service_Comms.md` — sync (REST) vs async (Kafka, RabbitMQ), saga patterns.

---

### UNIT 5 — Observability + Deployment (Weeks 13–14)

`07_Modern_Java/Ch55_Observability.md` + `Ch56_Deployment_Patterns.md` — Spring Boot Actuator, Micrometer metrics, Docker + K8s deployment patterns.

---

### UNIT 6 — Capstone (Weeks 15–16)

Build a multi-service e-commerce platform: catalog, orders, payments, notifications. With circuit breakers, distributed tracing, observability stack, deployed to K8s via CI/CD.

---

## Problem Sets

[`07_Modern_Java/07_PROBLEM_SETS.md`](../../../07_Modern_Java/07_PROBLEM_SETS.md) — Spring sections.

## Exam Prep

[`07_Modern_Java/Ch58_SB_Deep_Reasoning.md`](../../../07_Modern_Java/Ch58_SB_Deep_Reasoning.md) — 12 freeze moments.
