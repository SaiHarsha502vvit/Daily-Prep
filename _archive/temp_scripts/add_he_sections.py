#!/usr/bin/env python3
"""
Add ### Historical Evolution subsections to 07_Modern_Java flagged files.
HE=0 files first, then HE=1 files.
"""
import os

BASE = "/mnt/e/Dev_World/04_Practice/Daily-Prep/07_Modern_Java"

# ─── PATTERN A: Insert AFTER "╚" (end of 5W1H box)
# Files: Ch01b, Ch09, Ch10, Ch28, Ch30, Ch34, Ch41, Ch44, Ch51, Ch52
PATTERN_A_FILES = {
    "Ch01b_Java_Type_System.md": """
### Historical Evolution

**Inventor / Originator:** James Gosling (1991) — Oak language at Sun Microsystems, later renamed Java.

**Predecessor context:** C++ had mutable `std::string` with pointer aliasing bugs. No primitive/reference type split existed — everything was either a value or a raw pointer with no safety guarantees.

**Evolution narrative:** When Sun engineers designed Java in 1991, they made a deliberate choice: primitive types live on the stack (value semantics) and reference types live on the heap (reference semantics). This split was a direct reaction to C++ pointer bugs. Java 5 (2004) introduced generics (type erasure — backward compatible with JVM bytecode from Java 1.0) and autoboxing (with an Integer cache for -128 to 127 to avoid heap thrashing). The PECS rule (Producer Extends, Consumer Super) was coined by Joshua Bloch in *Effective Java* (first edition, 2001). Arrays' covariant type behavior was a known design flaw from Java 1.0; generics fixed this for collection types. Modern Java 14+ records and Java 21 virtual threads extend this lineage further.

**Modern practice:** Modern Java 21 (LTS) adds virtual threads, records, and sealed classes. Spring Boot 3.x (2023) runs on Java 21. Modern type idiom: `record Point(int x, int y)` (Java 16+) replacing verbose POJOs. Use `List<?>` for producer types and `List<Object>` with `Collections.copy()` for consumer types.

- **Oak language — 1991**: James Gosling, Sun Microsystems Green Project. Predecessor to Java.
- **Java 1.0 — 1995**: Reference types on heap, primitives on stack — the founding type split.
- **Java 5 (Tiger) — 2004**: Generics (type erasure), autoboxing, Integer cache, PECS rule.
- **Effective Java 1st ed — 2001**: Joshua Bloch codified PECS, equals/hashCode, and immutability.
- **Java 14 Records (final) / Java 16 — 2021**: Final form. Immutable data carriers replacing POJOs.
- **Java 21 LTS — 2023**: Virtual threads, record patterns, pattern matching switch (preview).""",
    "Ch09_Serialization_IO.md": """
### Historical Evolution

**Inventor / Originator:** Sun Microsystems (1997) — Java serialization introduced with Java 1.1 to support Remote Method Invocation (RMI).

**Predecessor context:** Before Java 1.1, inter-JVM communication required custom byte-encoding. RMI needed a portable object representation that could cross JVM boundaries reliably.

**Evolution narrative:** Java serialization arrived in Java 1.1 (1997) as RMI's wire protocol. It was powerful but dangerous — any class implementing `Serializable` was remotely exploitable. The Equifax breach (2017) and multiple Jenkins vulnerabilities exploited this. The `readResolve()` protection pattern was formalized as the correct fix. XML was the dominant data format in the 2000s (Java 1.4 added regex and NIO, not serialization fixes). JSON won over XML for Java serialization around 2007-2008 — Jackson (2007) and Gson (2008) became the standard alternatives. Java 7 (2011) introduced NIO.2 (Files API) replacing the fragile `java.io.File` API. The decorator pattern (GoF, 1994) shaped Java I/O streams from the beginning.

**Modern practice:** Modern Spring Boot (post-2018) uses Jackson with `@JsonIgnore`, `@JsonView`, and JSON Schema validation. Protobuf (Google, 2008, open-sourced 2008) and Avro (2010) are common in microservices. Spring's `RestTemplate` and `WebClient` use JSON by default. Kryo (2011) is used for high-performance binary serialization in Kafka and Spark.

- **Java serialization — Java 1.1 (1997)**: Sun Microsystems. RMI wire protocol. Security hole by default.
- **JavaBeans spec — 1998**: `PropertyChangeSupport`, `Serializable` — JavaBeans event model.
- **NIO channels/buffers — Java 1.4 (2002)**: Non-blocking I/O. Replaced blocking socket APIs.
- **Jackson — 2007**: JSON serialization. Dominant in Spring Boot. `ObjectMapper`, tree model, data binding.
- **Java 7 NIO.2 Files API — 2011**: `Paths.get()`, `Files.readAllLines()`, `Path` replacing `java.io.File`.
- **Equifax breach — 2017**: Exploited Java deserialization gadgets in Apache Struts. Sparked serialization hardening.""",
    "Ch10_Reflection_Annotations.md": """
### Historical Evolution

**Inventor / Originator:** Sun Microsystems (1995) — `Class.forName()` and `java.lang.reflect` package shipped with Java 1.0.

**Predecessor context:** Before reflection, class names were hard-coded at compile time. Frameworks like EJB 1.0 (1998) required XML configuration because the JVM offered no runtime inspection capability.

**Evolution narrative:** `Class.forName("com.example.User")` was Java 1.0's reflection API — powerful but dangerous. Java 5 (2004) introduced annotations (`@Override`, `@Deprecated`, `@SuppressWarnings`), enabling declarative metadata that frameworks could read via reflection. `@Override` was revolutionary: compile-time verification that a method actually overrides a superclass method. Hibernate 1.0 (2001) used XML mappings; Hibernate 3.0 (2006) migrated to annotation-based mappings. Spring 2.5 (2006) added `@Transactional`, `@Required`, `@Autowired` — eliminating XML for dependency injection. Java 8's `@FunctionalInterface` enabled the lambda revolution. Java 9 (2017) restricted reflection via JPMS, making `setAccessible(true)` fail for private fields in sealed modules unless explicitly opened.

**Modern practice:** Modern Spring Boot uses annotation-driven auto-configuration (Spring 4.0+, 2013). Lombok (2014) generates getters/setters at compile time via annotation processing. Spring's `@ComponentScan`, `@Bean`, and `@Configuration` form the annotation-driven DI model. Java 21 (2023) adds pattern matching for switch and record patterns that integrate with reflection.

- **`Class.forName()` — Java 1.0 (1995)**: Dynamic class loading. Originally for RMI class discovery.
- **Annotations — Java 5 (2004)**: `@Override`, `@Deprecated`. Declarative metadata; framework-readable.
- **Hibernate 3.0 annotations — 2006**: `@Entity`, `@Table`, `@Column` replacing XML mappings.
- **Spring 2.5 — 2006**: `@Autowired`, `@Component`. XML→annotation DI. Spring Boot 1.0 (2014) extended this.
- **Java 9 JPMS — 2017**: `--add-opens` needed for reflection in modular apps. `setAccessible()` restricted.
- **Lombok — 2014**: Compile-time annotation processing. `@Getter`, `@Setter`, `@Builder`.""",
    "Ch28_Annotations_Core.md": """
### Historical Evolution

**Inventor / Originator:** Sun Microsystems (2004) — Java 5 (Tiger) introduced annotations as the first-class language feature.

**Predecessor context:** Before Java 5, metadata required XML configuration files (ejb-jar.xml, web.xml, hibernate.cfg.xml). Every change required editing XML and recompiling — no type safety, no IDE autocompletion.

**Evolution narrative:** Java 5's annotations (`@Override`, `@Deprecated`) were the first standardized metadata marker. `@Override` was the breakthrough: the compiler could now verify method override correctness — a compile-time check that previously required runtime exceptions. JUnit 4 (2006) popularized test annotations (`@Test`, `@Before`, `@After`). Spring 1.2 (2006) introduced `@Transactional` — the first Spring annotation. Before Spring 4.2 (2014), Spring events required manual `ApplicationListener<>` implementation with no annotation shortcut. `@EventListener` (Spring 4.2) dramatically reduced boilerplate. Hibernate JPA annotations emerged around 2006-2010, replacing XML mappings. JPA 2.0 (2009) added `@ElementCollection`, `@OrderColumn`. Validation API (JSR 303, Bean Validation 1.0) arrived in 2009 with `@NotNull`, `@Size`, `@Pattern`.

**Modern practice:** Spring Boot 3.x uses Jakarta EE 9+ (`jakarta.*` namespace). JUnit 5 (2017) introduced `@Tag`, `@Nested`, `@DisplayName`. Spring's `@Retryable` (Spring Retry, 2012), `@CircuitBreaker` (Resilience4j) extend the annotation model for production resilience. Bean Validation 3.0 (2020) adds `@Email`, `@Negative`, `@Positive` with `jakarta.validation.constraints`.

- **Annotations — Java 5 (2004)**: `@Override`, `@Deprecated`. First standardized compile-time metadata.
- **JUnit 4 — 2006**: Kent Beck, Erich Gamma. `@Test`, `@Before`. Replaced JUnit 3's `TestCase` inheritance.
- **Spring @Transactional — Spring 1.2 (2006)**: First Spring annotation. Proxy-based AOP.
- **Hibernate JPA annotations — 2006-2010**: `@Entity`, `@Id`, `@GeneratedValue` replacing XML mappings.
- **`@EventListener` — Spring 4.2 (2014)**: Eliminated `ApplicationListener<>` boilerplate for event handling.
- **Bean Validation (JSR 303) — 2009**: `@NotNull`, `@Size`, `@Pattern`. Hibernate Validator reference impl.""",
    "Ch30_Dependencies_Annotations_Map.md": """
### Historical Evolution

**Inventor / Originator:** Rod Johnson / Pivotal (2004) — Spring Framework 1.0 introduced the starter dependency concept (pre-spring-boot).

**Predecessor context:** Pre-Spring Boot, developers manually managed JAR dependencies. `spring.jar` (2003) contained everything — even if you used only 10% of it. Dependency conflicts were resolved by trial and error. `spring-beans.jar` and `spring-context.jar` were separate downloads.

**Evolution narrative:** Spring 2.5 (2006) introduced annotation-based DI (`@Autowired`) that reduced XML but didn't solve dependency management. Maven repositories (Sonatype, 2005+) helped but didn't solve version conflicts. Spring Boot 1.0 (2014) was the breakthrough: opinionated starters (`spring-boot-starter-web`) that bundle all transitively needed JARs with tested version combinations. The validation starter was included in `spring-boot-starter-web` until Spring Boot 2.3 (2020), when it was split out — a breaking change that confused many developers. Spring Boot 3.0 (2022) migrated from `javax.*` to `jakarta.*` namespaces, requiring dependency updates.

**Modern practice:** Spring Boot 3.x uses the `spring-boot-starter-*` pattern exclusively. The `spring-boot-starter-parent` POM manages version alignment. `spring-boot-starter-validation` is required separately since 2.3. `spring-boot-starter-test` bundles JUnit 5, Mockito, AssertJ. `spring-boot-starter-aop` enables AspectJ for `@Transactional`, `@Cacheable`, and custom aspects.

- **Spring Framework 1.0 — 2004**: Rod Johnson. DI and IoC. Manual JAR management. No starters.
- **Spring 2.5 — 2006**: Annotation-based DI. `@Autowired`, `@Component`. Reduced XML.
- **Maven Central — 2005**: Sonatype-run central repository. Enabled dependency management.
- **Spring Boot 1.0 — 2014**: Pivotal. Auto-configuration, starters, embedded servers. Solved JAR hell.
- **Spring Boot 2.3 — 2020**: Validation starter split from web starter. Breaking change.
- **Spring Boot 3.0 / Java 17+ — 2022**: `javax.*` → `jakarta.*` migration. GraalVM native image support.""",
    "Ch34_SB_Security_Part4.md": """
### Historical Evolution

**Inventor / Originator:** Acegi Security (2003) — Ben Alex and team at SpringSource. Renamed Spring Security in 2008.

**Predecessor context:** Pre-Spring Security, web applications used `web.xml` security with servlet filters. Role checks were manual: `if (user.hasRole("ADMIN"))`. No declarative security model, no CSRF protection out of the box.

**Evolution narrative:** Acegi Security (2003) was the first enterprise-grade security framework for Spring. It introduced declarative security via XML: `<http>` for URL security, `<authentication-manager>` for credentials. Spring Security 2.0 (2008) added annotation support (`@PreAuthorize`, `@Secured`) and replaced Acegi's XML model with a fluent builder API. Spring Security 4.0 (2015) enabled CSRF protection by default — a breaking change that required POST forms to include CSRF tokens. JWT authentication became standard around 2015-2017 as REST APIs replaced session-based auth. OAuth 2.0 (2012, RFC 6749) was adopted by Spring Security OAuth (2014) for social login and API authorization.

**Modern practice:** Spring Security 6.x (2023) uses component-based configuration, lambda DSL for method security, and integrates with Spring Authorization Server (2022) for OAuth 2.1 flows. `@EnableMethodSecurity` enables `@PreAuthorize("hasAuthority('ROLE_ADMIN')")`. JWT with RS256 is the standard for stateless API auth. Spring Boot 3.x requires Spring Security 6.x.

- **Acegi Security — 2003**: Ben Alex, SpringSource. First enterprise Spring security framework.
- **Spring Security 2.0 — 2008**: Renamed from Acegi. Annotation support (`@PreAuthorize`).
- **CSRF default-on — Spring Security 4.0 (2015)**: Breaking change. All POST/PUT/DELETE require CSRF tokens.
- **JWT era — 2015-2017**: REST APIs replaced session cookies. OAuth 2.0 / OIDC for identity.
- **Spring Authorization Server — 2022**: Pivotal. OAuth 2.1 server for issuing access tokens.
- **Spring Security 6.x / Spring Boot 3.x — 2023**: Lambda DSL. Deprecated legacy WebSecurityConfigurerAdapter.""",
    "Ch41_SB_Architecture_Quality.md": """
### Historical Evolution

**Inventor / Originator:** Robert C. Martin / Alistair Cockburn — Clean Architecture (~2012) and Hexagonal Architecture (2005) formalized layered architecture evolution.

**Predecessor context:** Pre-2000, monoliths used procedural code. J2EE 1.2 (1999) introduced EJB as the business layer, but heavyweight EJBs with remote interfaces created performance problems. Hibernate (2001) freed business logic from JDBC, enabling layered design.

**Evolution narrative:** Layered architecture (Controller → Service → Repository) evolved from J2EE best practices in the early 2000s. Hexagonal Architecture (Alistair Cockburn, 2005) introduced the "ports and adapters" concept: the domain core has no framework imports. Clean Architecture (Robert C. Martin, ~2012) extended this with dependency rule: outer layers depend on inner layers, never the reverse. The "Onion Architecture" (Jeffrey Palermo, 2008) added a similar layer model. Spring Framework 1.x (2004) used XML configuration for layers; Spring 2.5 (2006) introduced `@Repository`, `@Service`, `@Controller` annotations. These annotations became the idiomatic way to declare layers. Spring Boot 1.0 (2014) automated layer detection via `@ComponentScan`.

**Modern practice:** Modern Spring Boot 3.x follows a pragmatic layered model: `@Controller`/`@RestController` → `@Service` → `@Repository`/`@JpaRepository`. Domain-Driven Design (DDD) adds `domain/` (entities, value objects), `application/` (use cases), `infrastructure/` (adapters). Spring's `@Configuration` classes replace XML. Component scanning or `@Import` connects layers. Hexagonal Architecture is used in libraries and frameworks that must remain portable outside Spring.

- **Layered architecture — early 2000s**: J2EE best practices. Controller/Service/DAO. Evolved from EJB era.
- **Hexagonal Architecture — 2005**: Alistair Cockburn. Ports and adapters. Framework-independent core.
- **Onion Architecture — 2008**: Jeffrey Palermo. Layered DDD. Dependency pointing inward only.
- **Clean Architecture — ~2012**: Robert C. Martin. Dependency rule: outer → inner. Testability focus.
- **Spring 2.5 annotations — 2006**: `@Service`, `@Repository`. Layer marker annotations for component scan.
- **Spring Boot 1.0 — 2014**: `@SpringBootApplication` + `@ComponentScan`. Opinionated layer wiring.""",
    "Ch44_SB_Caching_Scheduling.md": """
### Historical Evolution

**Inventor / Originator:** Spring Framework team (2004) — `@Scheduled` present since Spring 2.x. Spring 3.1 (2011) introduced `@Cacheable`.

**Predecessor context:** Pre-Spring 3.1, caching was implemented manually: a `Map<key, value>` field in the service layer, with manual `cache.get()` / `cache.put()` calls. No eviction, no TTL, no cache-aside pattern.

**Evolution narrative:** `@Scheduled` appeared in Spring 2.x (2006) for cron-like method execution. Initially XML-only (`<task:scheduled>`); annotations came later. Spring 3.1 (2011) introduced declarative caching with `@Cacheable` — inspired by AspectJ AOP, replacing manual `Map`-based caching. The cache abstraction was abstract: plug in EhCache (2005), ConcurrentHashMap (in-process), or Redis (2009) without changing service code. Caffeine (Ben Manes, 2014) replaced EhCache as the default in-memory cache (Spring Boot 2.0+, 2017) due to superior performance. Spring `@Async` was introduced in Spring 3.0 (2009) for background method execution with `CompletableFuture`. `@EnableScheduling` + `@Scheduled` became the standard for cron jobs.

**Modern practice:** Spring Boot 3.x uses `@Cacheable` backed by Caffeine (default) or Redis. `@CacheEvict` and `@CachePut` manage eviction. `@Async` + `CompletableFuture` handles background tasks. `@Scheduled(cron = "0 0 * * * *")` runs hourly. For distributed scheduling, Quartz Scheduler (2001) or ShedLock (2017) prevents duplicate job execution across instances.

- **`@Scheduled` — Spring 2.x (2006)**: Cron-like scheduling. Originally XML only (`<task:scheduled>`).
- **Spring 3.1 caching — 2011**: `@Cacheable`, `@CacheEvict`. Cache abstraction layer: EhCache/Redis pluggable.
- **Redis — 2009**: Redis (Salvatore Sanfilippo). In-memory data store. Primary distributed cache for Spring.
- **Caffeine — 2014**: Ben Manes. High-performance in-memory cache. Default in Spring Boot 2.x (2017).
- **Spring `@Async` — Spring 3.0 (2009)**: `@EnableAsync` + `CompletableFuture`. Background execution.
- **Spring 5 reactive scheduling — 2017**: `@Scheduled` works with `Mono`/`Flux` in Spring WebFlux applications.""",
    "Ch51_SB_Industry_Projects.md": """
### Historical Evolution

**Inventor / Originator:** Martin Fowler / Ward Cunningham (2003) — Feature flags and dark launching emerged from the "Branch by Abstraction" pattern and continuous deployment practices at ThoughtWorks.

**Predecessor context:** Before continuous deployment (2006+), releases were big-bang events. A feature was developed for months and shipped in one risky deployment. Rollbacks were expensive, requiring code reversion and redeployment. Feature flags were invented to decouple deployment from release.

**Evolution narrative:** Feature flags (toggles, dark launches) were pioneered at Flickr (2006) as "feature switches" for continuous deployment. Martin Fowler documented "Branch by Abstraction" (2007) as the technique for long-lived feature branches. The pattern was adopted by Facebook's gatekeeper system (2010s), which enabled them to deploy code daily without user-visible impact. LaunchDarkly (2014) and Split.io (2015) commercialized feature flags as a SaaS product. Feature flags evolved from boolean on/off to percentage rollouts, user targeting, multivariate tests, and A/B testing. Analytics pipelines evolved from nightly batch ETL (1990s) to real-time streaming (Kafka, 2011) to modern streaming SQL (Apache Flink, 2014+).

**Modern practice:** Modern feature flags (LaunchDarkly, Split, Unleash) support percentage rollouts, user-segment targeting, multivariate experiments, and flag dependency chains. Notification engines use event-driven architecture (Kafka/RabbitMQ, 2011+) with guaranteed delivery. Workflow engines (Camunda, 2010; Temporal, 2018) implement saga patterns for distributed transactions. Spring Boot integrates with all of these via Spring Cloud.

- **Feature flags — Flickr 2006**: "Feature switches." Continuous deployment: deploy code, toggle feature.
- **Facebook gatekeeper — 2010s**: Per-user feature rollout. Percentage-based gradual release.
- **LaunchDarkly — 2014**: SaaS feature flag platform. Real-time toggle evaluation. Target segments.
- **Apache Kafka — 2011**: LinkedIn. Real-time event streaming. Event-driven notification engines.
- **Camunda / Temporal — 2010/2018**: Workflow engines. Saga pattern. Distributed transaction compensation.
- **A/B testing — 2010s**: Statsig, Optimizely. Multivariate feature flags with statistical significance.""",
    "Ch52_SB_WebSocket_GraphQL_gRPC.md": """
### Historical Evolution

**Inventor / Originator:** Ian Fette / RFC 6455 (2011) — WebSocket standardized by IETF after HTML5 community effort. GraphQL at Facebook (2012).

**Predecessor context:** HTTP/1.1 (1999) was request-response only. The " Comet" techniques (long polling, streaming) were hacks to simulate server push. HTTP/1.1 head-of-line blocking meant each request queued behind the previous one.

**Evolution narrative:** WebSocket was standardized as RFC 6455 in 2011 (building on draft-ietf-hybi-thewebsocketprotocol). It enables bidirectional, persistent, full-duplex communication over a single TCP connection — fundamentally different from HTTP's request-response model. GraphQL was created at Facebook in 2012 to solve over-fetching and under-fetching in their mobile app — a REST alternative where the client specifies exactly what data it needs. gRPC was open-sourced by Google in 2016 (building on Google Stubby, 2001) as a high-performance, binary, HTTP/2-based RPC framework. Spring Framework added WebSocket support in Spring 4.0 (2013), GraphQL support via `spring-graphql` in Spring Boot 3.0 (2022), and gRPC via `grpc-spring-boot-starter` (community).

**Modern practice:** Modern Spring Boot 3.x supports all three: `@MessageMapping` (WebSocket), `spring-graphql` (GraphQL Java Tools), and `grpc-spring-boot-starter` (gRPC). HTTP/2 (2015) is the transport for gRPC and increasingly for REST. SSE (Server-Sent Events, 2006 HTML5 draft) is used for one-way server-to-client push as a lighter-weight WebSocket alternative. GraalVM native image (Spring Native, 2021) reduces boot time for all these communication styles.

- **HTTP/1.1 — 1999**: Request-response only. Head-of-line blocking. Comet hacks for push.
- **WebSocket RFC 6455 — 2011**: Bidirectional full-duplex over single TCP. Replaces Comet.
- **GraphQL — Facebook 2012**: Client specifies data needs. Solves over/under-fetching. REST alternative.
- **Server-Sent Events (SSE) — 2006**: One-way server→client push. Lighter than WebSocket for simple cases.
- **gRPC — Google 2016**: Open-sourced. HTTP/2 + Protocol Buffers. High-performance RPC for microservices.
- **Spring Boot 3.0 / spring-graphql — 2022**: First-party Spring GraphQL support. `@Controller` for queries/mutations.""",
}

# ─── PATTERN B: Insert AFTER "╚" + section challenge + blank (Ch02, Ch11, Ch12)
PATTERN_B_FILES = {
    "Ch02_Strings_Immutability.md": """
### Historical Evolution

**Inventor / Originator:** James Gosling / Sun Microsystems (1995) — `String` made immutable by design from Java 1.0.

**Predecessor context:** C++'s `std::string` was mutable: two references could point to the same buffer, and one could modify it, silently corrupting the other's data. Pointer aliasing bugs were a major source of production failures.

**Evolution narrative:** Java's designers made `String` immutable from the beginning (Java 1.0, 1995): no `setCharAt()`, no public char[] field. This enabled the string pool (one copy shared by all references), hashCode caching (immutable → compute once), thread safety (no synchronization needed), and security (no one can modify a class name mid-classload). The substring memory leak was a real bug in Java 6 (interned strings in old heap caused OOM) — fixed in Java 7 update 6 (2012). Compact Strings (Java 9, 2017) changed internal storage from `char[]` (2 bytes each) to `byte[]` with ISO-8859-1/LATIN-1 encoding, halving heap usage for ASCII strings. String concatenation was improved in Java 9 via `invokedynamic` (JSR 292), which replaced the older `StringBuilder` bytecode approach.

**Modern practice:** Java 9+ uses `String` methods with `StringConcatFactory` (invokedynamic). String templates (preview, Java 21-22) will add `${expression}` syntax. `String.isBlank()`, `String.strip()`, `String.lines()`, `String.repeat()` (Java 11+) are modern additions. For high-performance string operations, use `StringBuilder` for building, `String.intern()` only for a known finite set, and avoid `new String(s)` in hot paths.

- **Java 1.0 — 1995**: Immutable String by design. Enables string pool, hashCode caching, security.
- **C++ std::string — pre-1995**: Mutable. Aliasing bugs. The foil for Java's design choice.
- **Java 6 substring leak — 2006**: Fixed Java 7u6 (2012). Old substring shared backing array. OOM risk.
- **Java 7 string pool move — 2012**: Pool moved from PermGen to heap. `intern()` now viable in more cases.
- **Compact Strings — Java 9 (2017)**: `char[]` → `byte[]` with LATIN-1 encoding. ~50% heap reduction for ASCII.
- **`invokedynamic` string concat — Java 9 (2017)**: JSR 292. More efficient than pre-Java 9 `StringBuilder` bytecode.""",
    "Ch11_Events_Listeners.md": """
### Historical Evolution

**Inventor / Originator:** Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides (1994) — GoF *Design Patterns* formalized the Observer pattern.

**Predecessor context:** Pre-pattern literature, event handling was ad-hoc: callback function pointers (C), ad-hoc listener interfaces (pre-JavaBeans), or polling loops. No standardized vocabulary, no reusable abstractions.

**Evolution narrative:** The Observer pattern was codified by the Gang of Four in *Design Patterns* (1994) as one of 23 foundational patterns. JavaBeans (1998) introduced `PropertyChangeSupport` and `PropertyChangeListener` — the first standardized event model in Java, requiring explicit registration and firing. The GoF pattern used a `Subject`/`Observer` interface pair; JavaBeans used `PropertyChangeSupport` as a delegate. Spring's event system started as a simple `ApplicationEventPublisher` in Spring 1.0 (2004). Before Spring 4.2 (2014), developers had to implement `ApplicationListener<MyEvent>` for every event — verbose and type-unsafe. `@EventListener` (Spring 4.2, 2014) dramatically reduced boilerplate and enabled SpEL expressions for conditional event handling (`@EventListener("#event.status == 'NEW'")`).

**Modern practice:** Spring's `ApplicationEvent` + `@EventListener` is the standard. For async events, add `@Async` (Spring 3.x) on a separate `@AsyncEventListener`. Spring ApplicationEvent is now generic (`ApplicationEvent<Payload>`) for type-safe payloads. For cross-service events, use Spring ApplicationEventPublisher or Spring Cloud Stream (2016+) with Kafka. Domain Events (DomainEventPublisher in Axon Framework, 2009) implement the Aggregate Root pattern for DDD event sourcing.

- **GoF Observer — 1994**: *Design Patterns* (Gamma et al.). Subject/Observer interface pair. Foundational.
- **JavaBeans PropertyChangeSupport — 1998**: First standardized Java event model. Delegate-based listener.
- **`ApplicationEvent` — Spring 1.0 (2004)**: `ApplicationContext` publishes events. Manual `ApplicationListener` interface.
- **`@EventListener` — Spring 4.2 (2014)**: Annotation-based event handling. SpEL condition support.
- **`@TransactionalEventListener` — Spring 4.2 (2014)**: Events fire after transaction commit/rollback.
- **Spring Cloud Stream / Kafka — 2016+**: Distributed events across microservices. Event-driven messaging.""",
    "Ch12_ClassLoader_JDBC_Logging.md": """
### Historical Evolution

**Inventor / Originator:** James Gosling / Sun Microsystems (1995) — ClassLoader architecture in Java 1.0. JDBC team at Sun (1997).

**Predecessor context:** Before ClassLoaders, all classes were loaded from the bootstrap classpath. No plugin architecture, no OSGi, no dynamic loading. JDBC pre-4.0 required `Class.forName("sun.jdbc.odbc.JdbcOdbcDriver")` for the ODBC bridge.

**Evolution narrative:** The three-tier ClassLoader hierarchy (Bootstrap → Platform/Extension → Application) was designed from Java 1.0 to enable applet sandboxing and plugin architectures. The Parent-Delegation Model prevents classes from overriding core JDK types (e.g., `java.lang.String`). `ServiceLoader` (Java 6, 2006) standardized the Service Provider Interface (SPI) pattern — `META-INF/services/<FQCN>` files listing implementations. JPMS (Java 9, 2017, JSR 376) introduced module path, making the classpath optional. For JDBC, Java 1.1 (1997) introduced `java.sql` with `DriverManager`; JDBC 4.0 (Java 6, 2006) added `DriverManager` auto-loading — no more `Class.forName()`. SLF4J (QOS.ch, 2005) was created to end the log4j 1.x vs `java.util.logging` fragmentation by providing a single facade.

**Modern practice:** Spring Boot 3.x uses JPMS module paths. `DriverManager` auto-registers JDBC 4.0+ drivers via `META-INF/services`. SLF4J with Logback (successor to log4j 1.x) is the standard logging stack. `ServiceLoader` is used by JAX-RS, JDBC drivers, and Java's built-in crypto providers. For plugin architectures, consider Java's `ModuleLayer` (Java 9+) or OSGi (Apache, 2000+).

- **ClassLoader hierarchy — Java 1.0 (1995)**: Bootstrap (C++), Extension, Application. Parent-first delegation.
- **JDBC-ODBC bridge — Java 1.1 (1997)**: `Class.forName("sun.jdbc.odbc.JdbcOdbcDriver")`. Replaced by JDBC 4.0.
- **`ServiceLoader` — Java 6 (2006)**: `META-INF/services/<interface>` SPI. JDBC drivers, JAX-RS implementations.
- **JDBC 4.0 — Java 6 (2006)**: `DriverManager` auto-registers. No more `Class.forName()`. ServiceLoader-based.
- **SLF4J — QOS.ch 2005**: Ceki Gülcü. Single facade: log4j 1.x, `java.util.logging`, Logback. End of fragmentation.
- **JPMS (Jigsaw) — Java 9 (2017)**: JSR 376. Module path alongside classpath. `requires`, `exports` directives.""",
}

# ─── PATTERN C: Insert AFTER navigation + h1 + table of contents (before section 1 heading)
PATTERN_C_FILES = {
    "Ch08_Collections_Internals.md": """
### Historical Evolution

**Inventor / Originator:** Sun Microsystems (1998) — Java 2 (J2SE 1.2) introduced the Collections Framework as a unified data structure API.

**Predecessor context:** Java 1.0 had only `Vector`, `Hashtable`, `Array` — inconsistent APIs, no iterator pattern, no generics. Every collection had different method names (`addElement` vs `put` vs `add`). Data structure choice was ad-hoc.

**Evolution narrative:** The Collections Framework was introduced in Java 2 (1998) with a unified `Collection`, `List`, `Set`, `Map` hierarchy, `Iterator` interface, and consistent `add`, `remove`, `contains` methods. It was designed by Joshua Bloch and Neal Gafter (Effective Java co-author). `ConcurrentHashMap` was added in Java 5 (2004) as part of Doug Lea's JSR 166 (`java.util.concurrent`) — lock-free reads, segmented writes replacing `Collections.synchronizedMap()`. HashMap treeification (Java 8, 2014) was a security response to Hash Flooding DoS attacks (2011-2012) — when collisions exceeded a threshold, buckets converted from linked lists to red-black trees. `LinkedHashMap` with access-order LRU caching was added to support eviction algorithms. Red-Black Trees (Guibas and Sedgewick, 1979) were the chosen self-balancing tree for their O(log n) guarantees and ease of incremental rebalancing.

**Modern practice:** Modern Java 21 (LTS) adds SequencedCollection (JEP 431) for ordered collections with `getFirst()`/`getLast()`. `Map.of()`, `List.of()`, `Set.of()` (Java 9+) are immutable factory methods. `CopyOnWriteArrayList` (Java 5) is used in concurrent readers scenarios. `PriorityQueue` with `NavigableMap` (TreeMap) underpins Dijkstra's algorithm and scheduling systems.

- **Collections Framework — Java 2 (1998)**: Joshua Bloch, Neal Gafter. `List`, `Set`, `Map`. Unified API.
- **`ConcurrentHashMap` — Java 5 (2004)**: Doug Lea (JSR 166). Lock-free reads. Replaced `Collections.synchronizedMap()`.
- **HashMap treeification — Java 8 (2014)**: Security fix for Hash Flooding DoS. Linked list → Red-Black tree at threshold.
- **Red-Black Tree — Guibas & Sedgewick 1979**: Self-balancing BST. O(log n) insert/delete. Java HashMap/TreeMap structure.
- **LRU cache — Belady 1966**: Belady's algorithm. `LinkedHashMap` access-order implements O(1) LRU.
- **SequencedCollection — Java 21 (2023)**: JEP 431. Ordered collections with `getFirst()`, `getLast()`, `reversed()`.""",
    "Ch14_Maven_Gradle.md": """
### Historical Evolution

**Inventor / Originator:** Apache Foundation (2004) — Maven 1.0 by Jason van Zyl and Sonatype team.

**Predecessor context:** Make (Stuart Feldman, 1977) compiled C. Ant (James Duncan Davidson, 2000) compiled Java with XML build files but no dependency management. Every project manually downloaded JARs into `lib/` — "JAR hell."

**Evolution narrative:** Maven 1.0 (2004) introduced convention over configuration, dependency coordinates (`groupId:artifactId:version`), and remote repositories (Maven Central, 2005). The `pom.xml` replaced `build.xml`. Maven's reactor built multi-module projects in dependency order. Maven 2.0 (2007) added the local repository (`~/.m2/repository`) and improved dependency mediation. Gradle (2007 first commit, 2012 1.0 release) was created by Hans Dockter and Gradle Inc. to combine Ant's flexibility with Maven's dependency management. Gradle used a Groovy (later Kotlin) DSL instead of XML, enabling programmatic builds. Gradle's incremental compilation (2012) and build cache (2017) dramatically reduced build times — a 500-module project could go from 10 minutes to under 2 minutes. Gradle 8.x (2023) adds configuration cache and version catalog support.

**Modern practice:** Gradle has overtaken Maven for new projects (especially Android, 2013). Maven is still dominant in enterprise Java (Spring, Hibernate). Both support `mvnw` / `gradlew` wrappers for reproducible builds. `build.gradle.kts` (Kotlin DSL) is preferred for type-safe builds. Version catalogs (`libs.versions.toml`, Gradle 7+) and Maven BOMs centralize version management.

- **Make — 1977**: Stuart Feldman. C compilation. First build tool. Not Java-aware.
- **Ant — Apache 2000**: James Duncan Davidson. Java XML builds. No dependency management.
- **Maven 1.0 — 2004**: Jason van Zyl / Sonatype. Convention + dependency coordinates + remote repo.
- **Maven Central — 2005**: Sonatype. Central artifact repository. 35M+ artifacts today.
- **Gradle 1.0 — 2012**: Hans Dockter / Gradle Inc. Groovy DSL. Incremental builds. Gradle daemon.
- **Gradle build cache — 2017**: Remote build cache. Same inputs → cached outputs. Massive time savings.""",
}

# ─── PATTERN D: Insert after navigation + h1 + main heading (before Part 0 / challenge)
PATTERN_D_FILES = {
    "Ch20_AlgoEng_Core.md": """
### Historical Evolution

**Inventor / Originator:** Edsger Dijkstra (1959) — Formalized algorithm engineering as disciplined practice. Dijkstra's algorithm for shortest path.

**Predecessor context:** Pre-1940s, programming was ad-hoc: write code, test it, if it works ship it. No formal algorithm analysis, no Big-O, no data structure theory. Mathematical proof of correctness was not applied to programs.

**Evolution narrative:** The 1940s-50s saw the emergence of programming as a discipline. Big-O notation (Bachmann, 1894; popularized by Knuth in Vol 1, 1968) gave algorithm analysis a mathematical vocabulary. The 1960s-70s produced the foundational algorithms: Dijkstra's algorithm (1959), binary heap (Williams, 1964), red-black tree (Guibas & Sedgewick, 1979), Floyd-Warshall (1962). Robert Sedgewick's textbooks (1975-2023 editions) and Cormen et al.'s *Introduction to Algorithms* (CLRS, 1990) codified the field. The competitive programming era (2000s+) with TopCoder (2001), ACM ICPC, and later LeetCode (2015) created a global practice of algorithmic problem-solving as a skill. Modern algorithm engineering applies these principles to distributed systems: Bloom filters (1970) in Cassandra, skiplist-based Redis Sorted Sets (2009), and range trees in database indexes.

**Modern practice:** Modern algorithm engineering combines theoretical foundation with empirical measurement. JMH (Java Microbenchmark Harness, 2013) measures nanosecond-scale performance. Modern data structures (van Emde Boas tree for O(1) predecessor, 1975; rope data structure for efficient string operations, 1989) handle billion-element datasets. Spring Boot applications use these through standard Java collections — the internals matter for performance-critical paths.

- **Big-O notation — Bachmann 1894 / Knuth 1968**: Formal performance characterization. `O(1)`, `O(n log n)`.
- **Dijkstra's algorithm — 1959**: Shortest path on weighted graphs. Foundation of routing algorithms.
- **CLRS "Introduction to Algorithms" — 1990**: Cormen, Leiserson, Rivest, Stein. Definitive textbook.
- **Competitive programming era — 2000s**: TopCoder (2001), ACM ICPC. Algorithmic problem-solving as global sport.
- **LeetCode — 2015**: Algorithmic interview preparation platform. 3000+ problems. FAANG prep standard.
- **JMH (Java Microbenchmark Harness) — 2013**: Doug Lea, Oracle. Nanosecond-scale JVM benchmarking.""",
}

# ─── PATTERN E: Insert after navigation + h1 (before learning path diagram)
PATTERN_E_FILES = {
    "Ch24_Spring_Boot_Roadmap.md": """
### Historical Evolution

**Inventor / Originator:** Rod Johnson / Pivotal (2014) — Spring Boot 1.0 redefined Java productivity tooling.

**Predecessor context:** Pre-Spring Boot, building a Spring MVC application required: downloading 20+ JARs, writing `web.xml`, configuring `servlet-context.xml`, setting up `DataSource`, wiring transaction management, deploying to Tomcat. A "Hello World" web app took 2 days to scaffold. XML configuration dominated (Spring 2.5-3.x).

**Evolution narrative:** Spring 2.5 (2006) introduced annotation-based DI, reducing XML. Spring 3.0 (2009) added `@Configuration` classes. Spring 4.0 (2013) supported Java 8 features and conditional configuration. Spring Boot 1.0 (2014) was the inflection point: auto-configuration that detected `spring-boot-starter-web` on the classpath and automatically configured Tomcat, DispatcherServlet, Jackson, and Spring MVC — reducing 2 days of setup to 2 minutes. Spring Boot 2.0 (2018) brought Spring 5, WebFlux (reactive), and Java 8 minimum. Spring Boot 3.0 (2022) required Java 17+ and introduced GraalVM native image support (sub-second startup). Spring Cloud (2015+) was built on Boot to address microservice patterns: service discovery (Eureka), circuit breakers (Resilience4j), distributed tracing (Zipkin/Brave).

**Modern practice:** Spring Boot 3.x + Java 21 LTS. Spring Initializr (start.spring.io, 2014) generates projects in seconds. `spring-boot-starter-data-jpa`, `spring-boot-starter-webflux`, `spring-boot-starter-security` form the modern stack. Spring Cloud 2023.x is the current microservices constellation. GraalVM native image achieves <100ms startup — critical for serverless and containers.

- **Spring Framework 1.0 — 2004**: Rod Johnson. XML-based DI. "Lightweight" alternative to EJB.
- **Spring 2.5 annotations — 2006**: `@Autowired`, `@Component`. XML → annotation DI transition.
- **Spring 4.0 conditional config — 2013**: `@Conditional`. Foundation for auto-configuration.
- **Spring Boot 1.0 — 2014**: Pivotal. Auto-configuration. Embedded Tomcat. Spring Initializr. Zero XML.
- **Spring Boot 2.0 / Spring 5 — 2018**: WebFlux reactive. Functional routing. Java 8 minimum.
- **Spring Boot 3.0 / Java 17+ — 2022**: `jakarta.*` namespace. GraalVM native image. Virtual threads (Java 21).""",
}

# ─── PATTERN F: Insert after navigation + h1 + phase overview (before PHASE 1)
PATTERN_F_FILES = {
    "Ch25_Spring_Boot_50Day_Plan.md": """
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
- **Spring Academy — 2023**: Pivotal official learning platform. Guided learning paths.""",
}

# ─── PATTERN G: Insert after navigation + h1 (before challenge, for problem sets)
PATTERN_G_FILES = {
    "07_PROBLEM_SETS.md": """
### Historical Evolution

**Inventor / Originator:** Kent Beck / Erich Gamma (1997) — JUnit 1.0, the first mainstream unit testing framework.

**Predecessor context:** Before JUnit, testing was manual: run the program, check outputs by hand, hope nothing broke. C programs used `assert()` macros. SUnit (1998) at Xerox PARC pioneered the xUnit pattern for Smalltalk before Java adopted it.

**Evolution narrative:** JUnit 1.0 (1997, Beck/Gamma) brought the xUnit pattern to Java: `@Before`, `@Test` annotations, `assertEquals()`. Test execution was automated. JUnit 4 (2006) replaced the `TestCase` inheritance model with annotations — `@Test` replaced `testX(){}` naming convention. JUnit 5 (2017) introduced a modular architecture: JUnit Platform (test engine API), JUnit Jupiter (programming model), JUnit Vintage (JUnit 3/4 compatibility). Java 5 (2004) introduced `java.util.concurrent` and the JMM (JSR 133), which formalized the happens-before guarantee — understanding this is critical for concurrency problem JAVA-PS1's A3 question. The stream API (Java 8, 2014) was designed by Brian Goetz (lambda spec lead) and built on top of `java.util.function`. Spring's `@Transactional` test support emerged in Spring 2.0 (2006) and improved in Spring 4.2 (2014).

**Modern practice:** JUnit 5 (2023) is the standard. `@Nested` classes for hierarchical test structure, `@ParameterizedTest` (repeats values as test parameters), `@TempDir` (temporary directory), and `@DisplayName` for readable output. Spring Boot's `@SpringBootTest` with `@MockBean` is standard. TestContainers (2016) spins up real databases in Docker for integration tests. AssertJ (2014) provides fluent assertion chains.

- **JUnit 1.0 — 1997**: Kent Beck, Erich Gamma. xUnit pattern for Java. Automated unit testing.
- **SUnit — Xerox PARC 1998**: xUnit pattern invented. Smalltalk predecessor to JUnit.
- **Java 5 JMM (JSR 133) — 2004**: Doug Lea, Bill Pugh. Happens-before guarantee. Memory model formalized.
- **JUnit 4 — 2006**: Annotations replace `TestCase` inheritance. `@Test`, `@BeforeClass`. Industry standard.
- **Java 8 Streams (JSR 335) — 2014**: Brian Goetz (spec lead). Functional pipeline. Base for reactive programming.
- **JUnit 5 (Jupiter) — 2017**: Marc Philipp. Modular architecture. `@Nested`, `@ParameterizedTest`, `@DisplayName`.""",
    "07_CONCURRENCY_PROBLEM_SETS.md": """
### Historical Evolution

**Inventor / Originator:** Edsger Dijkstra (1965) — Semaphore. Dijkstra introduced the concept of "semaphores" for inter-process synchronization in THE operating system.

**Predecessor context:** Pre-1965, concurrent programs used ad-hoc techniques: busy-wait polling, disable-interrupts, or no synchronization at all. Deadlock, race conditions, and visibility bugs were discovered through production crashes, not prevented through design.

**Evolution narrative:** Dijkstra introduced semaphores (1965) — the first formal synchronization primitive. The Producers-Consumers problem (Dijkstra, 1965) and Dining Philosophers (Dijkstra, 1965-71) became the canonical teaching problems for concurrency. The BoundedBuffer (also called the bounded-buffer problem, Dijkstra, 1965) is the exact problem addressed by JAVA-PS3's B1 question. `Object.wait()/notify()` arrived with Java 1.0 (1995) — low-level and error-prone (spurious wakeups, missed signals). Doug Lea's `java.util.concurrent` (JSR 166, Java 5, 2004) was the breakthrough: `CountDownLatch`, `CyclicBarrier`, `ConcurrentHashMap`, `BlockingQueue`, `Semaphore`, `Exchanger`. `Future` (Java 5) was the first-class async result. `CompletableFuture` (Java 8, 2014) added composition (`thenApply`, `thenCompose`, `allOf`). The Java Memory Model (JSR 133, 2005, formalized in Java 5) defined happens-before and synchronizes-with rules that explain data races precisely.

**Modern practice:** Modern Java 21 (LTS) has virtual threads (JEP 444, project Loom) — millions of lightweight threads per process, solving the C10K problem. Structured concurrency (JEP 453, preview in Java 21) makes multi-threaded task trees a single logical unit. `ReentrantLock`, `StampedLock`, `Phaser`, and `ForkJoinPool` (Java 7, 2007) are in active use. Spring's `@Async` uses `TaskExecutor`. RxJava (2013) and Project Reactor (2013+) implement reactive streams for event-driven concurrency.

- **Semaphore — Dijkstra 1965**: First formal synchronization primitive. `P()`/`V()` operations. THE OS.
- **Dining Philosophers — Dijkstra 1965-71**: Canonical deadlock problem. 5 philosophers, 5 forks, circular wait.
- **`java.util.concurrent` — Java 5 (2004)**: Doug Lea (JSR 166). `CountDownLatch`, `ConcurrentHashMap`, `BlockingQueue`.
- **Java Memory Model (JSR 133) — 2005**: Doug Lea, Bill Pugh. Happens-before. Volatile, `synchronized` guarantees.
- **`CompletableFuture` — Java 8 (2014)**: Composition of async tasks. `thenApply`, `thenCompose`, `allOf`.
- **Virtual Threads — Java 21 (2023)**: JEP 444. Project Loom. Millions of threads. Memory-bound, not OS threads.""",
}

# ─── PATTERN H: Insert after navigation + h1 + main content structure (before main heading)
PATTERN_H_FILES = {
    "Ch59_SB_Testing_Fundamentals.md": """
### Historical Evolution

**Inventor / Originator:** Kent Beck / Erich Gamma (1997) — JUnit 1.0. First mainstream automated testing framework for Java.

**Predecessor context:** Before JUnit, Java testing was manual: compile, run, visually inspect output. C programs used `assert()` macros with no framework. The "laser surgery" problem (test one module without side effects) was unsolved.

**Evolution narrative:** JUnit 1.0 (1997) introduced the xUnit pattern to Java: fixture setup, test methods, assertions. It was so influential that it spread to every language (pytest, PHPUnit, RSpec). JUnit 4 (2006) replaced `TestCase` inheritance with annotations — `@Test` replaced `public void testX()` convention. Mockito (Emmanuel Bernard, Red Hat, 2004) succeeded EasyMock (2001) as the dominant Java mocking library — it used a static mock interceptor, unlike EasyMock's proxy-based approach. TestContainers (2016, AtomicJar) revolutionized integration testing by running real databases in Docker containers — no more in-memory H2 hacks that behave differently from production PostgreSQL. Spring Boot 1.4 (2016) introduced `@MockBean` for Spring context mock injection. JUnit 5 (2017) introduced `@Nested` classes, `@ParameterizedTest`, and the Jupiter extension model.

**Modern practice:** JUnit 5 with Mockito 5.x and AssertJ 3.x is the standard modern stack. `@SpringBootTest` with `@MockBean` for integration tests, `@WebMvcTest` for controller tests, `@DataJpaTest` for repository tests. TestContainers for real Postgres, Redis, Kafka in integration tests. ArchUnit (2019) for architectural testing (layer violations, cycle detection).

- **JUnit 1.0 — 1997**: Kent Beck, Erich Gamma. xUnit pattern. Fixture, test, assertion. Game-changing.
- **EasyMock — 2001**: First mock object framework for Java. Proxy-based. Verbose record/replay.
- **Mockito — 2004**: Emmanuel Bernard, Red Hat. Static interceptor. Less verbose than EasyMock.
- **TestContainers — 2016**: AtomicJar. Real Docker containers for integration tests. Postgres, Redis, Kafka.
- **Spring Boot `@MockBean` — 1.4 (2016)**: Spring context mock injection. `@MockBean UserService userService`.
- **JUnit 5 (Jupiter) — 2017**: Marc Philipp. Modular: Platform + Jupiter + Vintage. `@Nested`, `@ParameterizedTest`.""",
    "Ch60_SB_Testing_Advanced.md": """
### Historical Evolution

**Inventor / Originator:** Kent Beck / Erich Gamma (1997) — JUnit 1.0 for Java. Inspired by SUnit (Smalltalk, Xerox PARC, 1998).

**Predecessor context:** Pre-JUnit, testing frameworks were custom per project. Integration tests required a full application server. Performance tests were run manually with a stopwatch.

**Evolution narrative:** JUnit 4 (2006) introduced `@WebMvcTest` as a concept in Spring Test — test only the web layer with mocked services. `@SpringBootTest` (Spring Boot 1.4, 2016) spun up the full Spring context for integration tests. TestContainers (AtomicJar, 2016) solved the "works on my machine" problem by running real databases in Docker. Pact (2015, real-diffs by Stripe and Spotify) introduced consumer-driven contract testing — each service defines the contracts it expects from its providers, run independently. Spring Cloud Contract (2016, Pivotal) brought contract testing to Spring Boot. Gatling (2012, Stéphane Landelle) introduced Scala-based load testing with a DSL — more maintainable than JMeter's XML. ArchUnit (2019, Siemens) brought architectural testing to Java: test that `Controller` never imports `Repository` directly.

**Modern practice:** Modern Spring Boot 3.x testing uses `@SpringBootTest` + `@MockBean`, TestContainers for integration tests, `@JsonFileAssertions` (JSONassert) for API contract validation, Gatling for load tests, and ArchUnit for architecture enforcement. `@TestConfiguration` (Spring 5.2, 2019) lets tests define beans without affecting production. `@DisabledIfEnvironmentVariable` enables environment-specific test skipping.

- **`@SpringBootTest` — Spring Boot 1.4 (2016)**: Full context integration testing. `@MockBean` for service mocking.
- **TestContainers — 2016**: Real Docker containers. Postgres, MySQL, Redis, Kafka. Reproducible integration tests.
- **Pact contract testing — 2015**: Consumer-driven contracts. Stripe + Spotify. Each service independently verifiable.
- **Spring Cloud Contract — 2016**: Pivotal. Contract testing for Spring Boot. `@SpringCloudContractTest`.
- **Gatling — 2012**: Stéphane Landelle. Scala DSL. Load testing. HTTP, WebSocket, JMS simulation.
- **ArchUnit — 2019**: Siemens. Architectural rules in JUnit 5. Layer violations, import cycles, naming conventions.""",
}

# ─── PATTERN I: Insert after navigation + h1 (before table of contents / main content)
PATTERN_I_FILES = {
    "Ch13_Networking_NIO.md": """
### Historical Evolution

**Inventor / Originator:** Linus Torvalds / BSD (1983) — `select()` system call in 4.2 BSD Unix. Foundation of Java NIO's Selector API.

**Predecessor context:** Blocking I/O (`Socket`, `ServerSocket`) was Java 1.0's only model. Each socket consumed one OS thread. 10,000 concurrent connections required 10,000 threads — context switching overhead made this infeasible past ~1,000 connections.

**Evolution narrative:** Unix's `select()` (4.2 BSD, 1983) introduced I/O multiplexing: one thread polls multiple file descriptors. `epoll` (Linux 2.6, 2003) replaced `select`/`poll` with O(1) notification. Java NIO (Java 1.4, 2002) brought `Selector`, `Channel`, and `Buffer` — the Selector-based non-blocking model. It was inspired by Unix's `select`/`poll`. Java NIO.2 (Java 7, 2011) added `AsynchronousServerSocketChannel` and `AsynchronousChannelGroup` for true async I/O callbacks. Netty (Trustin Lee, 2004; now Apache, 2013) built on NIO to provide a production-grade event-driven network framework — used by Cassandra (2010), Spark (2010), and most high-performance Java servers. Java 11 HttpClient (2018) brought HTTP/2 and WebSocket over NIO.

**Modern practice:** Netty is the standard for high-performance network applications (gRPC, Akka, Vert.x). Vert.x (2009, Red Hat) is the reactive alternative built on Netty. Java 11 HttpClient is standard for simple HTTP calls. For I/O-bound Spring Boot apps, the default Tomcat (blocking) suffices. For high-concurrency scenarios, switch to Reactive Spring (WebFlux, Netty-based) or Undertow (2012, Red Hat).

- **`select()` — 4.2 BSD 1983**: I/O multiplexing. One thread handles multiple file descriptors. Foundation of NIO.
- **`epoll` — Linux 2.6 (2003)**: Event notification O(1). `select`/`poll` were O(n). Game changer for scale.
- **Java NIO — Java 1.4 (2002)**: `Selector`, `Channel`, `Buffer`. Non-blocking I/O model on JVM.
- **Netty — Trustin Lee 2004**: Event-driven network framework. Apache 2013. Used by Cassandra, Spark, gRPC.
- **Java NIO.2 async — Java 7 (2011)**: `AsynchronousServerSocketChannel`. True async callbacks on JVM.
- **Java 11 HttpClient — 2018**: HTTP/1.1, HTTP/2, WebSocket. Built on NIO. Non-blocking by default.""",
    "Ch45_SB_Actuator_Metrics.md": """
### Historical Evolution

**Inventor / Originator:** Pivotal (2014) — Spring Boot Actuator shipped with Spring Boot 1.0. Metrics infrastructure evolved from Dropwizard Metrics (2010) to Micrometer (2017).

**Predecessor context:** Pre-Spring Boot Actuator, monitoring required custom `/health` endpoints, JMX beans, or external tools like Java Melody. No standardized way to expose operational metrics. Spring Boot 1.0 (2014) introduced Actuator as a "what's running in production?" endpoint set.

**Evolution narrative:** Spring Boot Actuator was introduced in Spring Boot 1.0 (2014) with `/health`, `/info`, `/metrics`, and `/env` endpoints. Spring Boot 1.5 (2017) added `/prometheus`, `/httptrace`, `/threaddump`. Spring Boot 2.0 (2018) overhauled metrics with Micrometer (2017) — a vendor-neutral metrics facade. Micrometer replaced Dropwizard Metrics (Coda Hale, 2010) as the industry standard: you write Micrometer code and it reports to Prometheus, Datadog, Graphite, or CloudWatch depending on the registry. Flyway (Boxfuse, 2010) and Liquibase (2006) were the two dominant database migration tools integrated into Spring Boot. Docker (Solomon Hykes, 2013) fundamentally changed deployment — Spring Boot 2.3+ optimized for Docker with layered JARs andBuildpacks support.

**Modern practice:** Spring Boot 3.x uses Micrometer 1.12+. `@Timed` and `@Counted` annotations on controller methods auto-generate metrics. Spring Boot Actuator exposes health indicators for Redis, DB, Kafka. `/actuator/prometheus` exports Prometheus-format metrics. Grafana (2013+) visualizes Prometheus data. OpenTelemetry (2021, CNCF) is the emerging standard for distributed tracing that Micrometer integrates with.

- **Spring Boot Actuator — Spring Boot 1.0 (2014)**: `/health`, `/metrics`, `/env`. Standardized operational endpoints.
- **Dropwizard Metrics — Coda Hale 2010**: `Meter`, `Timer`, `Counter`. Pre-Micrometer industry standard.
- **Micrometer — 2017**: Vendor-neutral metrics facade. Prometheus, Datadog, Graphite, CloudWatch registries.
- **Flyway / Liquibase — 2010/2006**: Database migrations. Spring Boot 2.x integrates both via starters.
- **Docker — Solomon Hykes 2013**: Containerization. Spring Boot 2.3+ layered JARs + buildpacks for optimization.
- **Prometheus + Grafana — 2012/2013**: CNCF projects. Metrics scraping + visualization. Standard in Kubernetes.""",
}


# ─── All files grouped by pattern ───
ALL_GROUPS = [
    ("pattern_a", PATTERN_A_FILES, "╚", "after"),
    ("pattern_b", PATTERN_B_FILES, "╚", "after"),
    ("pattern_c", PATTERN_C_FILES, "## 1.", "before"),
    ("pattern_d", PATTERN_D_FILES, "# \u0110\u0111", "after_heading"),
    ("pattern_e", PATTERN_E_FILES, "# VISUAL LEARNING PATH", "before"),
    ("pattern_f", PATTERN_F_FILES, "PHASE 1: FOUNDATIONS", "before"),
    ("pattern_g", PATTERN_G_FILES, "# \U0001f4dd Java & Spring Boot \u2014 Problem Sets", "before"),
    ("pattern_h", PATTERN_H_FILES, "# Spring Boot Part 19: Testing", "before"),
    ("pattern_i", PATTERN_I_FILES, "## Table of Contents", "before"),
]


def find_insert_line(content, marker, mode):
    """Find the line number to insert before/after."""
    lines = content.split('\n')
    for i, line in enumerate(lines):
        if marker in line:
            if mode == "after":
                return i + 1
            elif mode == "before":
                return i
            elif mode == "after_heading":
                # Insert after h1 heading line (lines starting with # )
                if line.startswith('# ') and i + 1 < len(lines):
                    return i + 1
    return None


def insert_section(filepath, section_content, marker, mode):
    """Insert HE section at appropriate location in file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if already has HE section
    if "### Historical Evolution" in content:
        print(f"  SKIP (already has HE section): {os.path.basename(filepath)}")
        return False
    
    lines = content.split('\n')
    
    insert_idx = None
    
    if mode == "after_heading":
        # Insert after first h1 line
        for i, line in enumerate(lines):
            if line.startswith('# ') and i + 2 < len(lines):
                # Make sure not to insert in the middle of a title
                insert_idx = i + 2
                break
    elif mode == "after":
        # Find first occurrence of marker
        for i, line in enumerate(lines):
            if marker in line:
                insert_idx = i + 1
                break
    elif mode == "before":
        # Find first occurrence of marker
        for i, line in enumerate(lines):
            if marker in line:
                insert_idx = i
                break
    else:
        return False
    
    if insert_idx is None:
        print(f"  WARN (marker not found): {os.path.basename(filepath)} marker='{marker}'")
        return False
    
    # Insert with blank lines before and after
    new_content = '\n'.join(lines[:insert_idx]) + '\n' + section_content + '\n' + '\n'.join(lines[insert_idx:])
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print(f"  OK: {os.path.basename(filepath)} (insert at line {insert_idx})")
    return True


def main():
    total_edited = 0
    
    all_files = {}
    for group_name, file_dict, marker, mode in ALL_GROUPS:
        for filename, section_content in file_dict.items():
            all_files[filename] = (section_content, marker, mode, group_name)
    
    print(f"\nProcessing {len(all_files)} files...")
    
    for filename, (section_content, marker, mode, group_name) in sorted(all_files.items()):
        filepath = os.path.join(BASE, filename)
        if not os.path.exists(filepath):
            print(f"  MISSING: {filename}")
            continue
        if insert_section(filepath, section_content, marker, mode):
            total_edited += 1
    
    print(f"\nTotal files edited: {total_edited}/{len(all_files)}")
    
    # Print summary
    print("\nGroup summary:")
    for group_name, file_dict, marker, mode in ALL_GROUPS:
        count = sum(1 for f in file_dict if os.path.exists(os.path.join(BASE, f)))
        print(f"  {group_name}: {count} files")

if __name__ == "__main__":
    main()