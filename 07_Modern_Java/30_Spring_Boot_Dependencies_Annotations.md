> **Navigation**: [< Previous](29_Message_Queues_Kafka.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](31_Java_Deep_Reasoning.md)

> **Modern Java Chapter 30** | [← Message Queues](29_Message_Queues_Kafka.md) | [Index](../00_MASTER_INDEX.md)

# Spring Boot Dependencies → Annotations Map

## 5W1H — Why This Chapter?


> WHAT: A complete map showing which Maven/Gradle dependency
> enables which annotations and features in Spring Boot.
>
> WHY:  Developers (especially beginners) face confusion:
> "I added @Data but it doesn't work!"
> → Because @Data is Lombok, not Spring.
> "Where does @Entity come from?"
> → JPA dependency, not Spring Web.
>
> THE CORE CONFUSION: Spring Boot has 50+ starter dependencies.
> Each unlocks different annotations. Without a map, you guess.
>
> WHO:  Every Spring Boot developer who's ever been confused
> about where an annotation comes from.
>
> HOW:  Dependency → what it gives you → common annotations.


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


> LOMBOK IS NOT SPRING. It's a separate library that generates
> Java boilerplate code at COMPILE TIME.
>
> WHY THE CONFUSION:
> - Everyone uses it with Spring, so people think it IS Spring.
> - It's added as a dependency in pom.xml alongside Spring deps.
> - IDE needs a plugin to understand it (IntelliJ: Settings →
> Plugins → search "Lombok" → install).
>
> WHAT @Data ACTUALLY GENERATES:
>
> YOU WRITE:                        LOMBOK GENERATES AT COMPILE:
>
> @Data                             public class User {
> public class User {                   private String name;
> private String name;              private String email;
> private String email;
> }                                     public String getName()
> { return name; }
> public void setName(...)
> { this.name = name; }
> public String getEmail()
> { return email; }
> public void setEmail(...)
> { this.email = email; }
> public String toString()
> { return "User(name=" ... }
> public boolean equals(...)
> { ... }
> public int hashCode()
> { ... }
> public User(String name,
> String email) { ... }
> }
>
> IF @Data DOESN'T WORK:
> 1. Check: Is lombok in pom.xml as dependency?
> 2. Check: Is annotation processing enabled in IDE?
> (IntelliJ: Settings → Build → Compiler → ✓ Enable
> annotation processing)
> 3. Check: Is Lombok plugin installed in IDE?
> 4. Try: mvn clean compile (force recompile)


---

## 3. Quick Reference: "I Need To Do X — Which Dependency?"


> I WANT TO...                   │ ADD THIS DEPENDENCY
> ───────────────────────────────┼────────────────────────────────
> Create REST APIs               │ spring-boot-starter-web
> Connect to SQL database        │ spring-boot-starter-data-jpa
> │ + mysql-connector-java (driver)
> Validate input (@NotNull etc)  │ spring-boot-starter-validation
> Add login/security             │ spring-boot-starter-security
> Write tests                    │ spring-boot-starter-test
> Monitor app health             │ spring-boot-starter-actuator
> Reduce boilerplate code        │ lombok (+ IDE plugin!)
> Generate API docs (Swagger)    │ springdoc-openapi-starter-*
> Send/receive messages          │ spring-boot-starter-amqp (RMQ)
> │ spring-kafka (Kafka)
> Use Redis cache                │ spring-boot-starter-data-redis
> Schedule tasks (@Scheduled)    │ spring-boot-starter (built-in)
> │ + @EnableScheduling
> Send emails                    │ spring-boot-starter-mail
> Upload files to S3             │ aws-sdk-java (not Spring)
> Use WebSockets                 │ spring-boot-starter-websocket
> Use MongoDB                    │ spring-boot-starter-data-mongodb


---

## 4. Annotation Categories — Visual Guide


> CATEGORY 1: BEAN CREATION (Spring Core)
> "Tell Spring to manage this object"
>
> @Component       → Generic Spring bean
> @Service         → Business logic layer (same as @Component)
> @Repository      → Data access layer (adds exception translation)
> @Controller      → Web layer (returns views — HTML)
> @RestController  → Web layer (returns JSON — @Controller +
> @ResponseBody combined)
> @Configuration   → Declares @Bean methods
> @Bean            → Method return value becomes a Spring bean
>
> ───────────────────────────────────────────────────────────────
>
> CATEGORY 2: DEPENDENCY INJECTION (Spring Core)
> "Give me an instance of that class"
>
> @Autowired       → Inject a bean (prefer constructor injection)
> @Qualifier       → Choose WHICH bean when multiple exist
> @Primary         → This bean is the DEFAULT choice
> @Value           → Inject a property value
> @Value("${server.port}") int port;
>
> ───────────────────────────────────────────────────────────────
>
> CATEGORY 3: WEB / HTTP (spring-boot-starter-web)
> "Map HTTP requests to Java methods"
>
> @GetMapping("/users")              → HTTP GET
> @PostMapping("/users")             → HTTP POST
> @PutMapping("/users/{id}")         → HTTP PUT
> @DeleteMapping("/users/{id}")      → HTTP DELETE
> @PathVariable                      → Extract from URL path
> @RequestParam                      → Extract from query string
> @RequestBody                       → Parse JSON body to object
> @ResponseStatus(HttpStatus.CREATED) → Set response status code
>
> ───────────────────────────────────────────────────────────────
>
> CATEGORY 4: DATABASE / JPA (spring-boot-starter-data-jpa)
> "Map Java classes to database tables"
>
> @Entity          → "This class = a database table"
> @Table           → Customize table name: @Table(name="users")
> @Id              → Primary key field
> @GeneratedValue  → Auto-increment strategy
> @Column          → Column config: nullable, length, unique
> @Transient       → NOT saved to database (Java-only field)
>
> Relationships:
> @OneToMany(mappedBy="user")  → One user has many orders
> @ManyToOne                    → Many orders belong to one user
> @ManyToMany                   → Users ↔ Roles
> @JoinColumn(name="user_id")  → Foreign key column name
>
> ───────────────────────────────────────────────────────────────
>
> CATEGORY 5: VALIDATION (spring-boot-starter-validation)
> "Reject bad input before processing"
>
> @Valid            → Trigger validation on this object
> @NotNull          → Cannot be null
> @NotBlank         → Cannot be null, empty, or whitespace
> @Size(min, max)   → String/collection length bounds
> @Min, @Max        → Numeric bounds
> @Email            → Must be valid email format
> @Pattern(regex)   → Must match regex
> @Past, @Future    → Date must be before/after now
>
> USAGE:
> @PostMapping("/users")
> public User create(@Valid @RequestBody CreateUserDTO dto) {
> //                  ^^^^^^ THIS triggers validation
> }
>
> ───────────────────────────────────────────────────────────────
>
> CATEGORY 6: LOMBOK (separate library, NOT Spring)
> "Generate boilerplate Java code at compile time"
>
> @Data             → Getter + Setter + toString + equals +
> hashCode + RequiredArgsConstructor
> @Getter/@Setter   → Just getters/setters
> @Builder          → Builder pattern: User.builder().name()...
> @NoArgsConstructor → Empty constructor (JPA needs this!)
> @AllArgsConstructor → Constructor with ALL fields
> @RequiredArgsConstructor → Constructor for final fields only
> @Slf4j            → Creates: private static final Logger log
> @ToString(exclude="password") → Custom toString
> @EqualsAndHashCode(of="id")   → Only use id for comparison


---

## 5. Common Mistakes & Fixes


> MISTAKE → WHY IT HAPPENS → FIX
>
> "@Entity not recognized"
> → Missing spring-boot-starter-data-jpa dependency.
> → Fix: Add to pom.xml + reimport Maven.
>
> "@Valid doesn't validate anything"
> → Missing spring-boot-starter-validation dep (since SB 2.3+).
> → Before 2.3, validation was included in web starter.
> → Fix: Add spring-boot-starter-validation explicitly.
>
> "@Data generates nothing / red squiggles"
> → Lombok not properly configured.
> → Fix: 1) Add lombok to pom.xml
> 2) Install Lombok plugin in IntelliJ
> 3) Enable annotation processing in IDE settings
>
> "@Autowired field is null"
> → Object was created with 'new' instead of Spring injection.
> → Fix: Let Spring create it (@Component + @Autowired), or
> use constructor injection (recommended).
>
> "@Transactional doesn't rollback"
> → Called from within same class (proxy bypass).
> → Fix: Call from another bean, or use self-injection.
> → Or: exception is checked (only unchecked rolls back by default)
>
> "@Scheduled doesn't run"
> → Missing @EnableScheduling on @Configuration class.
> → Fix: Add @EnableScheduling to main class or config class.
>
> "Can't find @PreAuthorize"
> → Missing spring-boot-starter-security dependency.
> → Also needs @EnableMethodSecurity on config class.


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

> [← Message Queues](29_Message_Queues_Kafka.md) | [Index](../00_MASTER_INDEX.md)


---

> **Navigation**: [< Previous](29_Message_Queues_Kafka.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](31_Java_Deep_Reasoning.md)