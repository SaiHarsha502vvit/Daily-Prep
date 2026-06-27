**Navigation**: [< Previous](Ch54_Message_Queues_Kafka.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](Ch22_Java_Deep_Reasoning.md)

**Modern Java Chapter 30** | [← Message Queues](Ch54_Message_Queues_Kafka.md) | [Index](../00_MASTER_INDEX.md)

### Historical Evolution

**Inventor / Originator:** Spring Boot 1.0 by Dave Syer and the Spring team at Pivotal (2014) — the starter dependency system solved JAR hell.

**Predecessor context:** Before Spring Boot (2014), developers manually assembled Spring projects by finding compatible versions of `spring-core`, `spring-context`, `spring-webmvc`, `hibernate-core`, `c3p0`, and dozens of other JARs. Dependency conflicts (ClassNotFoundException, LinkageError) were common. Maven and Gradle existed but required deep expertise to configure correctly.

**Evolution narrative:** Spring Boot 1.0 (2014) introduced `spring-boot-starter-*` BOMs and opinionated auto-configuration. Adding `spring-boot-starter-web` transitively pulled in `spring-webmvc`, `spring-boot-starter-tomcat`, and Jackson. Spring Boot 1.2 (2014) added `@EnableAutoConfiguration`. Spring Boot 1.4 (2016) introduced `@SpringBootTest`. Spring Boot 2.0 (2018) upgraded to Spring 5, removed legacy starters, and added WebFlux. Spring Boot 2.3 (2020) split `spring-boot-starter-validation` into a separate starter (previously bundled). Spring Boot 3.0 (2023) migrated to Jakarta EE 9 (`jakarta.*` namespace), requiring dependency version bumps for Hibernate 6, Jakarta Servlet, etc.

**Modern practice:** Use `spring-boot-starter-parent` as Maven BOM for version management. Group starters by concern: web (`spring-boot-starter-web`), data (`spring-boot-starter-data-jpa`), security (`spring-boot-starter-security`). Run `mvn dependency:tree` to inspect transitive deps. In Gradle, use `libs.versions.toml` (Gradle 7+) for centralized version catalogs.

- **Maven dependency coordinates — 2004**: `groupId:artifactId:version`. Remote repository (Maven Central, 2005).
- **Spring Boot 1.0 — 2014**: Starters, `@SpringBootApplication`, auto-configuration. Opinionated defaults.
- **Spring Boot 1.4 — 2016**: `@SpringBootTest`, `@MockBean`, `spring-boot-starter-test` with JUnit 4.
- **Spring Boot 2.3 — 2020**: `spring-boot-starter-validation` split from web starter. Requires explicit addition.
- **Spring Boot 3.0 — 2023**: Jakarta EE 9 (`jakarta.*`). Hibernate 6, Java 17 minimum.

---

# Spring Boot Dependencies → Annotations Map

## 5W1H — Why This Chapter?

WHAT: A complete map showing which Maven/Gradle dependency
enables which annotations and features in Spring Boot.

WHY: Developers (especially beginners) face confusion:
"I added @Data but it doesn't work!"
→ Because @Data is Lombok, not Spring.
"Where does @Entity come from?"
→ JPA dependency, not Spring Web.

THE CORE CONFUSION: Spring Boot has 50+ starter dependencies.
Each unlocks different annotations. Without a map, you guess.

WHO: Every Spring Boot developer who's ever been confused
about where an annotation comes from.

HOW: Dependency → what it gives you → common annotations.

---

## 1. The Master Map

```
DEPENDENCY                    │ WHAT IT UNLOCKS
──────────────────────────────┼──────────────────────────────────
                              │
spring-boot-starter           │ @SpringBootApplication
(core, always included)       │ @Component, @Service, @Repository
                              │ @Bean, @Configuration
                              │ @Autowired, @Value
                              │ @Qualifier, @Primary
                              │ @Profile, @Conditional*
                              │ @PostConstruct, @PreDestroy
                              │
spring-boot-starter-web       │ @RestController, @Controller
(REST APIs, MVC)              │ @RequestMapping, @GetMapping
                              │ @PostMapping, @PutMapping
                              │ @DeleteMapping, @PatchMapping
                              │ @PathVariable, @RequestParam
                              │ @RequestBody, @ResponseBody
                              │ @ResponseStatus
                              │ @ExceptionHandler
                              │ @ControllerAdvice
                              │ @CrossOrigin
                              │
spring-boot-starter-data-jpa  │ @Entity, @Table, @Id
(database ORM)                │ @GeneratedValue
                              │ @Column, @Transient
                              │ @OneToMany, @ManyToOne
                              │ @ManyToMany, @OneToOne
                              │ @JoinColumn, @JoinTable
                              │ @Query (Spring Data)
                              │ @Transactional
                              │ @Modifying
                              │ @EnableJpaRepositories
                              │
spring-boot-starter-          │ @Valid, @NotNull, @NotBlank
validation                    │ @Size, @Min, @Max
(input validation)            │ @Email, @Pattern
                              │ @Past, @Future
                              │ @Positive, @Negative
                              │ @Validated (class-level)
                              │
spring-boot-starter-security  │ @EnableWebSecurity
(authentication + authz)      │ @PreAuthorize, @PostAuthorize
                              │ @Secured, @RolesAllowed
                              │ @EnableMethodSecurity
                              │ @AuthenticationPrincipal
                              │ @WithMockUser (test)
                              │
spring-boot-starter-test      │ @SpringBootTest
(testing)                     │ @DataJpaTest, @WebMvcTest
                              │ @MockBean, @SpyBean
                              │ @Test (JUnit 5)
                              │ @BeforeEach, @AfterEach
                              │ @DisplayName, @Nested
                              │ @ParameterizedTest
                              │
spring-boot-starter-actuator  │ Exposes /actuator/* endpoints
(monitoring)                  │ @Endpoint, @ReadOperation
                              │ @WriteOperation
                              │ (mostly config, few annotations)
                              │
──── NON-SPRING LIBRARIES ────┼──────────────────────────────────
                              │
lombok                        │ @Data (= @Getter + @Setter +
(NOT Spring! Code generation) │   @ToString + @EqualsAndHashCode
                              │   + @RequiredArgsConstructor)
                              │ @Getter, @Setter
                              │ @Builder
                              │ @NoArgsConstructor
                              │ @AllArgsConstructor
                              │ @RequiredArgsConstructor
                              │ @Slf4j (logging)
                              │ @ToString, @EqualsAndHashCode
                              │
mapstruct                     │ @Mapper, @Mapping
(object mapping)              │ @MappingTarget
                              │
springdoc-openapi             │ @Tag, @Operation
(API documentation)           │ @ApiResponse, @Parameter
                              │ @Schema
```

---

## 2. The Lombok Confusion — Fully Explained

LOMBOK IS NOT SPRING. It's a separate library that generates
Java boilerplate code at COMPILE TIME.

WHY THE CONFUSION:

- Everyone uses it with Spring, so people think it IS Spring.
- It's added as a dependency in pom.xml alongside Spring deps.
- IDE needs a plugin to understand it (IntelliJ: Settings →
  Plugins → search "Lombok" → install).

WHAT @Data ACTUALLY GENERATES:

YOU WRITE: LOMBOK GENERATES AT COMPILE:

@Data public class User {
public class User { private String name;
private String name; private String email;
private String email;
} public String getName()
{ return name; }
public void setName(...)
{ this.name = name; }
public String getEmail()
{ return email; }
public void setEmail(...)
{ this.email = email; }
public String toString()
{ return "User(name=" ... }
public boolean equals(...)
{ ... }
public int hashCode()
{ ... }
public User(String name,
String email) { ... }
}

IF @Data DOESN'T WORK:

1. Check: Is lombok in pom.xml as dependency?
2. Check: Is annotation processing enabled in IDE?
   (IntelliJ: Settings → Build → Compiler → ✓ Enable
   annotation processing)
3. Check: Is Lombok plugin installed in IDE?
4. Try: mvn clean compile (force recompile)

---

🔬 **Section Challenge — 2. The Lombok Confusion — Fully Explained**

**Challenge 1 (Reasoning):** Why does adding the `spring-boot-starter-web` dependency automatically start an embedded Tomcat server on port 8080 without you writing a single line of server code?

<details><summary>Answer</summary>

Spring Boot Auto-Configuration. The starter POM pulls in the Tomcat binaries and the `spring-boot-autoconfigure` library. On startup, Spring's `@EnableAutoConfiguration` scans the classpath. It sees that `Tomcat.class` and Spring MVC classes are present, and assumes you want a web server. It then automatically registers a `TomcatServletWebServerFactory` bean and boots the server. This is the core magic of Spring Boot: opinionated, context-aware defaults based on classpath presence.

</details>

## 3. Quick Reference: "I Need To Do X — Which Dependency?"

I WANT TO... │ ADD THIS DEPENDENCY
───────────────────────────────┼────────────────────────────────
Create REST APIs │ spring-boot-starter-web
Connect to SQL database │ spring-boot-starter-data-jpa
│ + mysql-connector-java (driver)
Validate input (@NotNull etc) │ spring-boot-starter-validation
Add login/security │ spring-boot-starter-security
Write tests │ spring-boot-starter-test
Monitor app health │ spring-boot-starter-actuator
Reduce boilerplate code │ lombok (+ IDE plugin!)
Generate API docs (Swagger) │ springdoc-openapi-starter-\*
Send/receive messages │ spring-boot-starter-amqp (RMQ)
│ spring-kafka (Kafka)
Use Redis cache │ spring-boot-starter-data-redis
Schedule tasks (@Scheduled) │ spring-boot-starter (built-in)
│ + @EnableScheduling
Send emails │ spring-boot-starter-mail
Upload files to S3 │ aws-sdk-java (not Spring)
Use WebSockets │ spring-boot-starter-websocket
Use MongoDB │ spring-boot-starter-data-mongodb

---

🔬 **Section Challenge — 3. Quick Reference: "I Need To Do X — Which Dependency?"**

**Challenge 1 (Reasoning):** Constructor injection vs field injection (`@Autowired` on field) — which is better and why?

<details><summary>Answer</summary>

Constructor injection is better: (1) Dependencies explicit — you can't create object without them. (2) Immutable — field can be `final`. (3) Testable — inject mocks via constructor, no Spring context needed. (4) Detects circular deps at startup, not at first use. Field injection: shorter code but: hidden dependencies, can't be `final`, requires Spring for test setup, circular deps detected late. Spring itself recommends constructor injection since v4.

</details>

## 4. Annotation Categories — Visual Guide

CATEGORY 1: BEAN CREATION (Spring Core)
"Tell Spring to manage this object"

@Component → Generic Spring bean
@Service → Business logic layer (same as @Component)
@Repository → Data access layer (adds exception translation)
@Controller → Web layer (returns views — HTML)
@RestController → Web layer (returns JSON — @Controller +
@ResponseBody combined)
@Configuration → Declares @Bean methods
@Bean → Method return value becomes a Spring bean

───────────────────────────────────────────────────────────────

CATEGORY 2: DEPENDENCY INJECTION (Spring Core)
"Give me an instance of that class"

@Autowired → Inject a bean (prefer constructor injection)
@Qualifier → Choose WHICH bean when multiple exist
@Primary → This bean is the DEFAULT choice
@Value → Inject a property value
@Value("${server.port}") int port;

───────────────────────────────────────────────────────────────

CATEGORY 3: WEB / HTTP (spring-boot-starter-web)
"Map HTTP requests to Java methods"

@GetMapping("/users") → HTTP GET
@PostMapping("/users") → HTTP POST
@PutMapping("/users/{id}") → HTTP PUT
@DeleteMapping("/users/{id}") → HTTP DELETE
@PathVariable → Extract from URL path
@RequestParam → Extract from query string
@RequestBody → Parse JSON body to object
@ResponseStatus(HttpStatus.CREATED) → Set response status code

───────────────────────────────────────────────────────────────

CATEGORY 4: DATABASE / JPA (spring-boot-starter-data-jpa)
"Map Java classes to database tables"

@Entity → "This class = a database table"
@Table → Customize table name: @Table(name="users")
@Id → Primary key field
@GeneratedValue → Auto-increment strategy
@Column → Column config: nullable, length, unique
@Transient → NOT saved to database (Java-only field)

Relationships:
@OneToMany(mappedBy="user") → One user has many orders
@ManyToOne → Many orders belong to one user
@ManyToMany → Users ↔ Roles
@JoinColumn(name="user_id") → Foreign key column name

───────────────────────────────────────────────────────────────

CATEGORY 5: VALIDATION (spring-boot-starter-validation)
"Reject bad input before processing"

@Valid → Trigger validation on this object
@NotNull → Cannot be null
@NotBlank → Cannot be null, empty, or whitespace
@Size(min, max) → String/collection length bounds
@Min, @Max → Numeric bounds
@Email → Must be valid email format
@Pattern(regex) → Must match regex
@Past, @Future → Date must be before/after now

USAGE:
@PostMapping("/users")
public User create(@Valid @RequestBody CreateUserDTO dto) {
// ^^^^^^ THIS triggers validation
}

───────────────────────────────────────────────────────────────

CATEGORY 6: LOMBOK (separate library, NOT Spring)
"Generate boilerplate Java code at compile time"

@Data → Getter + Setter + toString + equals +
hashCode + RequiredArgsConstructor
@Getter/@Setter → Just getters/setters
@Builder → Builder pattern: User.builder().name()...
@NoArgsConstructor → Empty constructor (JPA needs this!)
@AllArgsConstructor → Constructor with ALL fields
@RequiredArgsConstructor → Constructor for final fields only
@Slf4j → Creates: private static final Logger log
@ToString(exclude="password") → Custom toString
@EqualsAndHashCode(of="id") → Only use id for comparison

---

## 5. Common Mistakes & Fixes

MISTAKE → WHY IT HAPPENS → FIX

"@Entity not recognized"
→ Missing spring-boot-starter-data-jpa dependency.
→ Fix: Add to pom.xml + reimport Maven.

"@Valid doesn't validate anything"
→ Missing spring-boot-starter-validation dep (since SB 2.3+).
→ Before 2.3, validation was included in web starter.
→ Fix: Add spring-boot-starter-validation explicitly.

"@Data generates nothing / red squiggles"
→ Lombok not properly configured.
→ Fix: 1) Add lombok to pom.xml 2) Install Lombok plugin in IntelliJ 3) Enable annotation processing in IDE settings

"@Autowired field is null"
→ Object was created with 'new' instead of Spring injection.
→ Fix: Let Spring create it (@Component + @Autowired), or
use constructor injection (recommended).

"@Transactional doesn't rollback"
→ Called from within same class (proxy bypass).
→ Fix: Call from another bean, or use self-injection.
→ Or: exception is checked (only unchecked rolls back by default)

"@Scheduled doesn't run"
→ Missing @EnableScheduling on @Configuration class.
→ Fix: Add @EnableScheduling to main class or config class.

"Can't find @PreAuthorize"
→ Missing spring-boot-starter-security dependency.
→ Also needs @EnableMethodSecurity on config class.

---

## 6. Typical Entity + DTO + Controller Setup

```java
// ─── ENTITY (JPA + Lombok) ───
// Dependencies: spring-boot-starter-data-jpa + lombok
@Entity
@Table(name = "users")
@Data
@NoArgsConstructor  // JPA requires no-arg constructor
@AllArgsConstructor
@Builder
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Enumerated(EnumType.STRING)
    private Role role;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<Order> orders = new ArrayList<>();
}

// ─── DTO (Lombok + Validation) ───
// Dependencies: lombok + spring-boot-starter-validation
@Data
@Builder
public class CreateUserDTO {
    @NotBlank(message = "Name is required")        // validation
    @Size(min = 2, max = 50)                        // validation
    private String name;

    @NotBlank                                        // validation
    @Email(message = "Invalid email format")         // validation
    private String email;

    private Role role;
}

// ─── CONTROLLER (Web + Validation) ───
// Dependencies: spring-boot-starter-web + spring-boot-starter-validation
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor   // Lombok: generates constructor for final fields
@Slf4j                     // Lombok: creates 'log' variable
public class UserController {

    private final UserService userService;  // Injected via constructor (Lombok generates it)

    @GetMapping
    public List<UserDTO> getAll() {
        log.info("Fetching all users");     // log comes from @Slf4j
        return userService.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserDTO create(@Valid @RequestBody CreateUserDTO dto) {
        //                ^^^^^^ triggers validation annotations on DTO
        return userService.create(dto);
    }

    @GetMapping("/{id}")
    public UserDTO getById(@PathVariable Long id) {
        return userService.findById(id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")    // spring-boot-starter-security
    public void delete(@PathVariable Long id) {
        userService.delete(id);
    }
}
```

---

## 7. pom.xml — Complete Example with Annotations

```xml
<dependencies>
    <!-- CORE: @SpringBootApplication, @Component, @Autowired, etc -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter</artifactId>
    </dependency>

    <!-- WEB: @RestController, @GetMapping, @RequestBody, etc -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>

    <!-- JPA: @Entity, @Table, @Id, @OneToMany, @Query, etc -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>

    <!-- VALIDATION: @Valid, @NotNull, @Email, @Size, etc -->
    <!-- ⚠ Required separately since Spring Boot 2.3+ -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>

    <!-- SECURITY: @PreAuthorize, @EnableWebSecurity, etc -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-security</artifactId>
    </dependency>

    <!-- MONITORING: /actuator/health, /actuator/metrics -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-actuator</artifactId>
    </dependency>

    <!-- LOMBOK (NOT Spring!): @Data, @Builder, @Slf4j, etc -->
    <!-- Needs IDE plugin + annotation processing enabled -->
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <optional>true</optional>
    </dependency>

    <!-- DATABASE DRIVER: Needed for JPA to connect to actual DB -->
    <dependency>
        <groupId>com.mysql</groupId>
        <artifactId>mysql-connector-j</artifactId>
        <scope>runtime</scope>
    </dependency>

    <!-- TEST: @SpringBootTest, @MockBean, @DataJpaTest, etc -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
        <scope>test</scope>
    </dependency>
</dependencies>
```

---

## Interview Quick-Fire

```
Q: Where does @Data come from?
→ LOMBOK, not Spring. Requires lombok dependency in pom.xml,
  IDE plugin, and annotation processing enabled. It generates
  getters, setters, toString, equals, hashCode, and constructor.

Q: Why doesn't @Valid work in my Spring Boot 3 project?
→ Since SB 2.3+, validation is NOT included in web starter.
  Add spring-boot-starter-validation separately.

Q: What's the difference between @Component, @Service, @Repository?
→ Functionally identical (all create Spring beans). Semantic difference:
  @Service = business logic, @Repository = data access (adds
  exception translation), @Component = generic. Use the right one
  for clarity.

Q: Why is my @Autowired field null?
→ The object was created with 'new MyClass()' instead of Spring.
  Spring can only inject into beans IT manages. Solution: use
  constructor injection with @RequiredArgsConstructor (Lombok).
```

---

[← Message Queues](Ch54_Message_Queues_Kafka.md) | [Index](../00_MASTER_INDEX.md)

---

### Production Reality

Adding dependencies and using annotations without understanding their failure modes creates production incidents. These are the named failure modes linked to this dependency/annotation map.

**Named failure modes:**

- **`JAR hell — split package`** — Two transitive dependencies contain classes in the same package (e.g., `com.google.gson` in both `gson-2.8.jar` and a shaded `shaded-gson-2.9.jar`). The JVM loads whichever JAR appears first in the classpath, silently. Behavior varies between local, CI, and production environments. **Debug workflow:** Run `mvn dependency:tree | grep -E "gson|jackson|guava|commons-lang"` to find duplicates. Use `jdeps` to verify package ownership. Add explicit `<exclusions>` in the POM. Enforce with Maven Enforcer Plugin's `banDuplicatePomDependencyVersions`.

- **`Maven dependency convergence failure`** — A transitive dependency pulls in `jackson-databind 2.12.0` while you explicitly declared `jackson-databind 2.15.0`. Nearest-wins picks 2.12.0, and your code using 2.15 APIs gets `NoSuchMethodError` at runtime. **Debug workflow:** Run `mvn dependency:tree -Dincludes=com.fasterxml.jackson.core:jackson-databind` to find all versions. Add the version explicitly in `<dependencyManagement>`. Check with `mvn versions:display-dependency-updates`.

- **`ClassNotFoundException` from missing optional dependency** — A `@Configuration` class uses `@Bean` for a class from an optional library. The compile-scoped dependency was `provided` but the runtime JAR is missing. **Debug workflow:** The stack trace shows the missing class name. Run `mvn dependency:tree` to check if the JAR is in compile scope but missing at runtime. Change to `runtime` scope or add the missing JAR explicitly.

- **`spring-boot-starter-validation` missing since Spring Boot 2.3** — Spring Boot 2.3+ removed `spring-boot-starter-validation` from `spring-boot-starter-web`. Applications upgrading from 2.2 with `@Valid` on controller parameters now receive silent validation bypass instead of 400 errors. **Debug workflow:** Add `spring-boot-starter-validation` explicitly in pom.xml. Check `mvn dependency:tree | grep validation`. This is one of the most common silent failures during Spring Boot upgrades.

- **`@Data` (Lombok) breaking equals/hashCode for entities in Sets/Maps** — Lombok generates `equals()` and `hashCode()` based on all fields including the database-generated `@Id`. Two entities with `id=null` are equal, so `HashSet<Entity>` deduplication behaves incorrectly. **Debug workflow:** Use `@EqualsAndHashCode(onlyExplicitlyIncluded = "id")` on JPA entities. Implement equals/hashCode manually using business key fields. Run `lombok.addLombokGeneratedAnnotation=true` to mark generated methods.

---

### Conceptual Depth: Dependency Injection

The invariant of dependency injection is: a component should declare its dependencies, not create them. This holds because inversion of control separates construction from usage, enabling testability and loose coupling. The principle breaks down when constructor injection creates a hard cycle (A→B→C→A) — at that point Spring cannot resolve the startup order and throws `BeanCurrentlyInCreationException`. Use `@Lazy` or setter injection to break cycles, or refactor toward a shared intermediate component.

**Invariants:**
- Constructor injection ensures dependencies are available before the bean is used — field injection does not
- Spring creates all singleton beans before handling requests, so circular dependencies fail fast at startup

---

> **Navigation**: [< Previous](Ch54_Message_Queues_Kafka.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](Ch22_Java_Deep_Reasoning.md)


---

## Reality Check

**"@Autowired is the only way to inject dependencies"** → Constructor injection with no annotation needed since Spring 4.3 for single-constructor classes is the recommended approach. @Autowired on fields bypasses immutability since fields cannot be final, makes testing harder because you need reflection or Spring context, and hides dependencies from the class API. Constructor injection makes dependencies explicit and allows plain new instantiation in tests.

**"Adding a starter dependency auto-configures everything"** → Starters include transitive dependencies AND auto-configuration classes. But auto-configuration classes have @Conditional annotations — they only activate when conditions are met. spring-boot-starter-data-jpa auto-configures only if a DataSource bean exists AND entity classes are found on the classpath. Missing one condition and the auto-configuration silently does nothing with no error, just absent beans.

**"@Component @Service @Repository and @Controller are interchangeable"** → Functionally they all register beans. But @Repository adds persistence exception translation converting JDBC SQLExceptions to Spring DataAccessException hierarchy. @Controller enables handler mapping for HTTP requests. @Service is purely semantic — it adds nothing over @Component. Using the wrong stereotype means missing framework behavior, not just wrong naming.

**"Maven and Gradle dependency versions do not conflict"** → Spring Boot dependency management BOM pins compatible versions. But adding explicit version overrides or dependencies outside the BOM can cause classpath conflicts: two versions of Jackson, two versions of SLF4J, or javax and jakarta package splits. The symptom is NoSuchMethodError at runtime — the JVM loaded class version A but your code expects method from version B.

**"All annotations are processed at startup"** → Annotations have different processing times: @Component scan happens during BeanDefinition registration in early startup. @PostConstruct runs after dependency injection. @Scheduled and @EventListener activate after the context is fully refreshed. @ConditionalOnProperty is evaluated before bean creation. Confusing these timings causes bugs like scheduling a method that depends on a bean not yet initialized.
