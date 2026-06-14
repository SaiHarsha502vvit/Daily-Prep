# CSE601 — Spring Boot & Microservices

**Estimated time:** ~30h  
**Prerequisite:** [CSE604](./CSE604_Java_Concurrency_And_JVM_Internals/README.md) (JVM internals foundational)

## Description

Comprehensive Spring Boot 3.x coverage from core concepts through distributed systems. Covers auto-configuration, Spring Data JPA, WebFlux reactive programming, microservice patterns (circuit breakers, API gateways, service mesh), and deployment to cloud-native targets. Builds on S03 OOP/SQL and S04 networking foundations.

## Learning Outcomes

1. Build production-ready Spring Boot 3 applications: auto-configuration, profiles, externalized configuration
2. Implement layered architectures: Controller → Service → Repository with Spring DI
3. Master Spring Data: JPA repositories, auditing, query methods, projections
4. Design reactive systems with Spring WebFlux: Flux/Mono, backpressure, reactive streams
5. Architect microservices: discovery (Eureka), API gateway (Spring Cloud Gateway), circuit breakers (Resilience4j), distributed tracing

## Syllabus Outline

| Week | Topic                                                                         |
| ---- | ----------------------------------------------------------------------------- |
| 1    | Spring Boot fundamentals: auto-configuration, starters, actuator              |
| 2    | Dependency injection: @Bean, @Component, @Configuration, @Primary, @Qualifier |
| 3    | Spring MVC: controllers, request/response mapping, validation (JSR-380)       |
| 4    | Spring Data JPA: repositories, query derivation, auditing, pagination         |
| 5    | Transaction management: @Transactional, propagation, isolation levels         |
| 6    | Spring Security: JWT authentication, OAuth2 Resource Server                   |
| 7    | Spring WebFlux: reactive controllers, WebClient, MongoDB Reactive             |
| 8    | Microservices patterns: circuit breaker, bulkhead, retry, timeout             |
| 9    | Service discovery & API gateway: Eureka, Spring Cloud Gateway, routing        |
| 10   | Observability: Micrometer, distributed tracing (Zipkin), health endpoints     |
| 11   | Deployment: Docker, Helm, 12-factor config, environment promotion             |
| 12   | Capstone: multi-service e-commerce platform with circuit breakers             |

## Linked Existing Content

- [Modern Java (Spring Boot chapters)](../../07_Modern_Java/) — Chapters 24–58

## Assessment

- Weekly coding assignments (single-service then multi-service)
- Spring Boot microservice portfolio project
- 3-hour practical exam (troubleshooting, optimization, new feature implementation)
