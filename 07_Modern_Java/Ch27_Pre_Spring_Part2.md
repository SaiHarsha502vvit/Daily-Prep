**Navigation**: [< Previous Chapter](Ch26_Pre_Spring_Part1.md) | [Back to Index](../00_MASTER_INDEX.md)

---

## Theory-First Master Lens (Part 2: Infrastructure to Runtime Behavior)

This part focuses on how production systems behave under load, during build, and inside the JVM runtime.

Use these reasoning anchors while reading:

1. Connection pooling is queue management.
   It shifts cost from connection setup to bounded concurrency and wait-time behavior.

2. Classloading is type identity + isolation.
   Class name alone is not enough; classloader identity changes runtime compatibility.

3. Build tools are graph resolution engines.
   Lifecycle phases and dependency scopes determine final classpath and runtime behavior.

4. HTTP semantics drive reliability.
   Correct method, status, and header semantics are prerequisites for stable retries, caching, and gateway behavior.

5. Design patterns are controlled variability.
   Spring patterns are mechanisms for change isolation, not interview vocabulary.

6. Threading is resource budgeting.
   Thread pools, queues, and blocking points determine tail latency more than average latency.

7. Type erasure and bytecode tooling explain "invisible" framework behavior.
   What is not visible in source can still be deterministically explained by runtime metadata and instrumentation phases.

Treat every section as: mechanism -> trade-off -> failure mode -> tuning strategy.

```java
public class MoneyDeserializer extends JsonDeserializer<BigDecimal> {

    @Override
    public BigDecimal deserialize(JsonParser p, DeserializationContext ctxt)
            throws IOException {
        String value = p.getValueAsString();
        if (value != null && value.startsWith("$")) {
            return new BigDecimal(value.substring(1));
        }
        return new BigDecimal(value);
    }
}

// Usage
public class Product {
    @JsonSerialize(using = MoneySerializer.class)
    @JsonDeserialize(using = MoneyDeserializer.class)
    private BigDecimal price;
}
```

🔬 **Section Challenge — Theory-First Master Lens (Part 2: Infrastructure to Runtime Behavior)**

**Challenge 1 (Trace — Who/When/What):** When Spring Boot returns JSON from a `@RestController`, **who** does the serialization? **When** does it happen in the request lifecycle? **What** annotation on the response triggers it?

<details><summary>Answer</summary>

**Who?** `MappingJackson2HttpMessageConverter` using an `ObjectMapper` instance. **When?** After the controller method returns, the `DispatcherServlet` delegates to `RequestResponseBodyMethodProcessor`, which iterates registered `HttpMessageConverter`s and selects Jackson based on the `Accept: application/json` header + `@ResponseBody` (implicit in `@RestController`). **What triggers it?** `@ResponseBody` (present on every method in `@RestController`). Without it, Spring tries to resolve a view template instead of serializing the return value.

</details>

## E.4 Polymorphic Type Handling

```java
// When you have inheritance and need to know the actual type

@JsonTypeInfo(
    use = JsonTypeInfo.Id.NAME,
    include = JsonTypeInfo.As.PROPERTY,
    property = "type"
)
@JsonSubTypes({
    @JsonSubTypes.Type(value = Dog.class, name = "dog"),
    @JsonSubTypes.Type(value = Cat.class, name = "cat")
})
public abstract class Animal {
    private String name;
}

public class Dog extends Animal {
    private String breed;
}

public class Cat extends Animal {
    private boolean indoor;
}

// Serialized Dog: {"type":"dog","name":"Rex","breed":"German Shepherd"}
// Jackson knows to create Dog instance when type="dog"
```

🔬 **Section Challenge — E.4 Polymorphic Type Handling**

**Challenge 1 (Debug — Who/When/What):** Jackson deserializes `{"type":"DOG","name":"Rex"}` into an `Animal` field. **Who** reads the `"type"` discriminator? **When** must `@JsonTypeInfo` be configured? **What** happens if the discriminator is missing?

<details><summary>Answer</summary>

**Who reads?** Jackson's `TypeDeserializer`, selected by `ObjectMapper` based on `@JsonTypeInfo(use=Id.NAME, property="type")` on the `Animal` base class. **When configured?** At startup — Jackson registers the type resolver when it first serializes/deserializes the annotated class. **Missing discriminator?** Throws `InvalidTypeIdException: Could not resolve subtype`. Fix: use `@JsonTypeInfo(use=Id.DEDUCTION)` (Jackson 2.12+) for discriminator-free resolution based on JSON fields present, or provide `@JsonSubTypes.Type(value=Dog.class, name="DOG")` on the base class so Jackson can map the `"type"` string to the concrete class.

</details>

## E.5 Configuring ObjectMapper in Spring Boot

```java
@Configuration
public class JacksonConfig {

    @Bean
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();

        // Don't fail on unknown properties
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

        // Include only non-null values
        mapper.setSerializationInclusion(JsonInclude.Include.NON_NULL);

        // Pretty print
        mapper.enable(SerializationFeature.INDENT_OUTPUT);

        // Date handling
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        // Snake case
        mapper.setPropertyNamingStrategy(PropertyNamingStrategies.SNAKE_CASE);

        return mapper;
    }
}
```

### Via application.yml

```yaml
spring:
  jackson:
    property-naming-strategy: SNAKE_CASE
    serialization:
      indent-output: true
      write-dates-as-timestamps: false
    deserialization:
      fail-on-unknown-properties: false
    default-property-inclusion: non_null
    date-format: yyyy-MM-dd HH:mm:ss
```

---

🔬 **Section Challenge — E.5 Configuring ObjectMapper in Spring Boot**

**Challenge 1 (Debug — Who/When/What):** You register a custom `ObjectMapper` bean but Jackson still uses default settings. **What** is the most likely cause? **Who** has higher priority — your bean or Spring Boot auto-configuration?

<details><summary>Answer</summary>

**Most likely cause:** You created a `new ObjectMapper()` in a `@Bean` method but Spring Boot's `JacksonAutoConfiguration` already registered one. If you use `@Bean` for ObjectMapper, Spring Boot backs off (your bean wins). BUT: if you registered a `Jackson2ObjectMapperBuilderCustomizer` instead, it customizes the AUTO-CONFIGURED ObjectMapper. The two approaches conflict if mixed. **Fix:** Use ONE approach: either provide your own `@Bean ObjectMapper` (full control), or use `Jackson2ObjectMapperBuilderCustomizer` (additive customization). Check with: `context.getBeansOfType(ObjectMapper.class)` — if there are 2, that's the bug.

</details>

# SECTION F: CONNECTION POOLING - DATABASE CONNECTIONS AREN'T FREE

## Why This Matters

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  CREATING A DATABASE CONNECTION IS EXPENSIVE!                                    │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Creating ONE connection:                                                        │
│  1. DNS lookup for database host                                                 │
│  2. TCP handshake (3-way)                                                        │
│  3. TLS handshake (if SSL)                                                       │
│  4. Database authentication                                                      │
│  5. Session initialization                                                       │
│                                                                                  │
│  TIME: 50-200ms PER CONNECTION                                                   │
│                                                                                  │
│  If you create a new connection for every query:                                 │
│  - 10 queries = 500-2000ms just in connection overhead!                          │
│                                                                                  │
│  CONNECTION POOLING: Reuse connections!                                          │
│  - Connection created once at startup                                            │
│  - Borrowed for query, returned to pool                                          │
│  - 10 queries = ~0ms connection overhead                                         │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

## F.1 How Connection Pooling Works

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                    CONNECTION POOL LIFECYCLE                                     │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Application Start:                                                              │
│  ┌────────────────────────────────────────────┐                                  │
│  │ Connection Pool (HikariCP)                 │                                  │
│  │                                            │                                  │
│  │  [Conn1][Conn2][Conn3][Conn4][Conn5]       │ ◄── Minimum idle connections     |
│  │    ↑      ↑      ↑      ↑      ↑           │      created at startup          │
│  │   idle   idle   idle   idle   idle         │                                  │
│  │                                            │                                  │
│  └────────────────────────────────────────────┘                                  │
│                                                                                  │
│  Request comes in:                                                               │
│  ┌────────────────────────────────────────────┐                                  │
│  │ Connection Pool                            │                                  │
│  │                                            │                                  │
│  │  [    ][Conn2][Conn3][Conn4][Conn5]        │                                  │
│  │    ↑                                       │                                  │
│  │   Conn1 borrowed by Thread-1               │                                  │
│  │                                            │                                  │
│  └────────────────────────────────────────────┘                                  │
│                                                                                  │
│  Query completes:                                                                │
│  ┌────────────────────────────────────────────┐                                  │
│  │ Connection Pool                            │                                  │
│  │                                            │                                  │
│  │  [Conn1][Conn2][Conn3][Conn4][Conn5]       │ ◄── Conn1 returned to pool       │
│  │    ↑                                       │      (NOT closed!)               │
│  │   idle again                               │                                  │
│  │                                            │                                  │
│  └────────────────────────────────────────────┘                                  │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

🔬 **Section Challenge — F.1 How Connection Pooling Works**

**Challenge 1 (Trace — Who/When/What):** When your `@Repository` method calls `jdbcTemplate.query(...)`, **who** gives it a database connection? **When** is the connection returned to the pool? **What** happens if you forget to close it?

<details><summary>Answer</summary>

**Who?** HikariCP's `HikariDataSource.getConnection()` — it returns a wrapped `Connection` from its pool. **When returned?** When `connection.close()` is called — but HikariCP intercepts `close()` and RETURNS the connection to the pool instead of actually closing it. `JdbcTemplate` handles this automatically in its `execute()` method's `finally` block. **Forgot to close?** Connection leak. The connection stays "borrowed" forever. Eventually all pool connections are leaked, new requests block waiting for `connectionTimeout` (default 30s), then throw `SQLTransientConnectionException`. HikariCP has leak detection: `spring.datasource.hikari.leak-detection-threshold=2000` logs a warning if a connection isn't returned within 2 seconds.

</details>

## F.2 HikariCP Configuration

```yaml
# HikariCP is Spring Boot's default connection pool

spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/mydb
    username: user
    password: pass

    hikari:
      # Pool sizing
      minimum-idle: 5 # Minimum connections to keep in pool
      maximum-pool-size: 10 # Maximum connections in pool

      # Timeouts
      connection-timeout: 30000 # Max wait for connection (30s)
      idle-timeout: 600000 # How long idle connection lives (10min)
      max-lifetime: 1800000 # Max age of connection (30min)

      # Validation
      validation-timeout: 5000 # Time to validate connection

      # Performance
      auto-commit: true
      pool-name: MyHikariPool
```

## F.3 Connection Pool Sizing

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                    POOL SIZING FORMULA                                           │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  connections = ((core_count * 2) + effective_spindle_count)                      │
│                                                                                  │
│  For SSD with 4-core CPU:                                                        │
│  connections = (4 * 2) + 1 = 9-10 connections                                    │
│                                                                                  │
│  IMPORTANT: More connections ≠ Better performance!                               │
│                                                                                  │
│  Why?                                                                            │
│  - Database has limited CPU cores                                                │
│  - More connections = More context switching                                     │
│  - Diminishing returns after optimal point                                       │
│                                                                                  │
│  RULE OF THUMB:                                                                  │
│  - Web app: 10-20 connections per instance                                       │
│  - Batch processing: Higher (dedicated resources)                                │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

🔬 **Section Challenge — F.3 Connection Pool Sizing**

**Challenge 1 (Reasoning — Who/When/What):** The HikariCP wiki says optimal pool size ≈ `(core_count * 2) + disk_spindles`. For a 4-core server with SSD, that's ~9 connections. **Why** is BIGGER not better? **What** happens with 100 connections?

<details><summary>Answer</summary>

**Why not bigger?** Database connections compete for shared resources: CPU cores, disk I/O, memory, and PostgreSQL's `max_connections` (default 100). With 100 connections on a 4-core DB server: massive context switching. Each connection holds a backend process (~5-10MB RAM). 100 connections trying to write simultaneously thrash the disk scheduler. **Result:** WORSE throughput than 10 connections. The 10-connection pool queues requests efficiently, each connection gets full CPU time slices. **The formula works** because: 2 connections per core (one computes while the other waits on I/O) + spindle count (parallel disk access). SSDs have no seek time, so `spindles` ≈ 1.

</details>

## F.4 Common Connection Pool Problems

### Problem 1: Connection Leaks

```java
// BAD: Connection never returned to pool!
public void badMethod() {
    Connection conn = dataSource.getConnection();
    Statement stmt = conn.createStatement();
    ResultSet rs = stmt.executeQuery("SELECT * FROM users");
    // Process results...
    // FORGOT to close! Connection leaked!
}

// GOOD: Try-with-resources
public void goodMethod() {
    try (Connection conn = dataSource.getConnection();
         Statement stmt = conn.createStatement();
         ResultSet rs = stmt.executeQuery("SELECT * FROM users")) {
        // Process results...
    }  // Auto-closed, returned to pool
}

// BEST: Use JdbcTemplate or JPA (they manage connections)
@Autowired
private JdbcTemplate jdbcTemplate;

public List<User> getUsers() {
    return jdbcTemplate.query("SELECT * FROM users", userRowMapper);
    // Connection acquired and released automatically
}
```

### Problem 2: Pool Exhaustion

```java
// All connections in use, new requests wait...

// Identify with logging
spring:
  datasource:
    hikari:
      leak-detection-threshold: 60000  # Log if connection held > 60s

// In code, check pool stats
@Autowired
private HikariDataSource dataSource;

public void checkPool() {
    HikariPoolMXBean poolProxy = dataSource.getHikariPoolMXBean();

    int active = poolProxy.getActiveConnections();
    int idle = poolProxy.getIdleConnections();
    int total = poolProxy.getTotalConnections();
    int waiting = poolProxy.getThreadsAwaitingConnection();

    log.info("Active: {}, Idle: {}, Total: {}, Waiting: {}",
             active, idle, total, waiting);
}
```

### Problem 3: Stale Connections

```java
// Connection seems valid but database closed it (firewall timeout, database restart)

spring:
  datasource:
    hikari:
      connection-test-query: SELECT 1      # For MySQL
      keepalive-time: 300000               # Send keepalive every 5min
      max-lifetime: 1800000                # Recreate before database timeout
```

---

🔬 **Section Challenge — F.4 Common Connection Pool Problems**

**Challenge 1 (Connection Leak Trace — Who/When/What):** A Spring service method manually calls `dataSource.getConnection()` inside a loop but never calls `close()`. The app runs fine for 10 minutes, then every new request hangs for 30 seconds before throwing `SQLTransientConnectionException`. **Who** is holding the connections? **When** does HikariCP give up? **What** single config property would have caught this in logs 28 minutes earlier?

<details><summary>Answer</summary>

**Who is holding?** Each loop iteration borrowed a connection and never returned it. HikariCP treats a borrowed connection as "in use" until `close()` (or `try-with-resources`) is called. With a pool of 10, after 10 loop invocations all connections are permanently borrowed (leaked). **When does HikariCP give up?** After `connectionTimeout` (default 30,000ms / 30s). New threads wait in a queue; after 30s they throw `SQLTransientConnectionException: Connection is not available, request timed out after 30000ms`. **What config catches it early?** `spring.datasource.hikari.leak-detection-threshold=2000` — if any connection is held for > 2s without being returned, HikariCP logs a WARN with the full stack trace of where the connection was borrowed. This would have printed the leak location on the first invocation, not after 10 minutes of degradation.

</details>

**Challenge 2 (Pool Exhaustion vs Leak — Who/When/What):** Pool exhaustion and connection leak both result in `SQLTransientConnectionException`. **What** is the diagnostic difference in HikariCP metrics? **When** should you increase pool size vs fix a leak?

<details><summary>Answer</summary>

**Diagnostic difference:** `HikariPoolMXBean.getThreadsAwaitingConnection()` > 0 with `getActiveConnections() == maximumPoolSize` → exhaustion (all connections legitimately in use but more requests are coming). `getActiveConnections() == maximumPoolSize` with low actual request concurrency → leak (connections never returned). Enable `leak-detection-threshold` to confirm: if warnings fire with stack traces pointing to the same location, it's a leak. **When to increase pool size:** When `getThreadsAwaitingConnection()` spikes during legitimate traffic peaks AND connections are returned normally. **Never** increase pool size to mask a leak — it just delays the inevitable by extending the leak window.

</details>

# SECTION G: CLASSLOADING - HOW YOUR CODE RUNS

## Why This Matters

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  CLASS NOT FOUND? NO CLASS DEF FOUND? CLASS CAST EXCEPTION (SAME CLASS!)?        │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  These errors are CLASSLOADER problems!                                          │
│                                                                                  │
│  Understanding classloaders helps you:                                           │
│  - Debug mysterious ClassNotFoundException                                       │
│  - Understand Spring context hierarchies                                         │
│  - Debug "duplicate class" issues                                                │
│  - Understand hot reloading (like Spring DevTools)                               │
│  - Work with modular applications                                                │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

## G.1 Classloader Hierarchy

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                    CLASSLOADER HIERARCHY                                         │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│                    ┌───────────────────┐                                         │
│                    │ Bootstrap         │ ◄── Loads: java.lang.*, java.util.*     │
│                    │ ClassLoader       │     (rt.jar - core Java)                │
│                    │ (native code)     │                                         │
│                    └─────────┬─────────┘                                         │
│                              │                                                   │
│                              ▼                                                   │
│                    ┌───────────────────┐                                         │
│                    │ Platform          │ ◄── Loads: Java extensions              │
│                    │ ClassLoader       │     (jre/lib/ext)                       │
│                    └─────────┬─────────┘                                         │
│                              │                                                   │
│                              ▼                                                   │
│                    ┌───────────────────┐                                         │
│                    │ Application       │ ◄── Loads: Your code, dependencies      │
│                    │ ClassLoader       │     (classpath)                         │
│                    └─────────┬─────────┘                                         │
│                              │                                                   │
│                              ▼                                                   │
│               ┌──────────────┴──────────────┐                                    │
│               │                              │                                   │
│    ┌──────────────────┐          ┌──────────────────┐                            │
│    │ Custom Loader 1  │          │ Custom Loader 2  │                            │
│    │ (Web App 1)      │          │ (Web App 2)      │                            │
│    └──────────────────┘          └──────────────────┘                            │
│                                                                                  │
│  PARENT DELEGATION: Child asks parent first before loading itself                │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

🔬 **Section Challenge — G.1 Classloader Hierarchy**

**Challenge 1 (Parent Delegation Trace — Who/When/What):** Your app references `org.springframework.web.bind.annotation.RestController`. **Who** loads this class? **When** in the JVM startup does the first load happen? **What** would cause `ClassNotFoundException` for this annotation even with the correct Spring JAR on the classpath?

<details><summary>Answer</summary>

**Who loads it:** The Application ClassLoader (system classloader). It first delegates to Platform ClassLoader, which delegates to Bootstrap ClassLoader. Neither of those have Spring on their classpath, so the class bubbles back down to Application ClassLoader, which finds it in the Spring JAR on the classpath. **When is the first load?** The first time any class in the JVM references `@RestController` — typically during `ApplicationContext` startup when Spring component-scans and reads annotations via reflection. **What causes CNFE even with JAR present?** Most common: Spring JAR is in `<scope>provided</scope>` and you're running the JAR standalone (Tomcat not included). Or the JAR is on the compile classpath but excluded from the fat JAR (check `spring-boot-maven-plugin`'s `<excludes>`). Or you're testing with a custom ClassLoader that doesn't delegate to the parent (common in OSGi, Tomcat web apps with isolated class spaces).

</details>

**Challenge 2 (ClassCastException Mystery):** You load a class `UserService` from two different plugins at runtime. Casting `plugin1UserService` to the `UserService` type throws `ClassCastException` — even though both are `UserService`. **Who** is the culprit? **What** rule explains this?

<details><summary>Answer</summary>

**Who is culprit:** Two different `ClassLoader` instances, each loading their own copy of `UserService.class`. **The rule:** Java class identity = (binary name) + (classloader). A class loaded by `ClassLoaderA` is a DIFFERENT type than the same class loaded by `ClassLoaderB`, even if the `.class` bytecode is byte-for-byte identical. The JVM `instanceof` and cast checks compare classloader identity, not bytecode. **Fix pattern:** Move the shared `UserService` interface to a parent classloader that both plugins share. Plugins load their own implementations; the interface lives in the shared parent — both sides reference the same classloader's definition. This is how Tomcat's `WebAppClassLoader` isolation works: servlet API in parent, app code in isolated child.

</details>

## G.2 Parent Delegation Model

```java
// When you reference a class:

public class MyService {
    User user = new User();  // JVM needs to load User.class
}

// The classloading process:
// 1. Application ClassLoader: "Do I have User.class cached?"
//    - If yes: return it
//    - If no: ask parent
//
// 2. Platform ClassLoader: "Do I have User.class?"
//    - If no: ask parent
//
// 3. Bootstrap ClassLoader: "Do I have User.class?"
//    - If no: return null to child
//
// 4. Platform ClassLoader: "Parent doesn't have it, can I load it?"
//    - If no: return null to child
//
// 5. Application ClassLoader: "Can I load User.class from classpath?"
//    - If yes: load and cache it
//    - If no: throw ClassNotFoundException
```

## G.3 Common Classloading Problems

### Problem 1: ClassNotFoundException

```java
// Class doesn't exist in classpath at ALL
try {
    Class<?> clazz = Class.forName("com.example.NonExistent");
} catch (ClassNotFoundException e) {
    // The .class file is not in any JAR or class directory
}

// FIX: Check your dependencies in pom.xml/build.gradle
```

### Problem 2: NoClassDefFoundError

```java
// Class existed at COMPILE time but not at RUNTIME
public class MyService {
    public void process() {
        SomeClass obj = new SomeClass();  // NoClassDefFoundError!
    }
}

// FIX: The dependency is "provided" or excluded at runtime
// Check: mvn dependency:tree
```

### Problem 3: Same Class, Different Classloaders

```java
// Class loaded by two different classloaders = TWO DIFFERENT CLASSES!

User user1 = classLoader1.loadClass("User").newInstance();
User user2 = classLoader2.loadClass("User").newInstance();

// This FAILS:
user1 = (User) user2;  // ClassCastException!

// Even though it's the "same" User class!
// Because: user1.getClass() != user2.getClass()
// They're loaded by different classloaders
```

🔬 **Section Challenge — G.3 Common Classloading Problems**

**Challenge 1 (Debug — Who/When/What):** `NoClassDefFoundError` vs `ClassNotFoundException` — they sound the same but have DIFFERENT causes. **When** does each occur? **Who** throws each one?

<details><summary>Answer</summary>

**ClassNotFoundException:** Thrown by `Class.forName("com.Foo")` or `ClassLoader.loadClass()` when the `.class` file is NOT on the classpath at all. **Who throws?** The ClassLoader itself. Cause: missing dependency, wrong Maven scope. **NoClassDefFoundError:** The class WAS found during compilation but is MISSING at runtime. Often caused by: static initializer failure (the class loaded once, its `<clinit>` threw, now all future loads fail with NCDFE), or transitive dependency excluded. **Key difference:** CNFE = never found. NCDFE = found once but failed to initialize. Check static blocks and `@PostConstruct` methods for hidden exceptions.

</details>

## G.4 Spring DevTools Hot Reload

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                    HOW SPRING DEVTOOLS WORKS                                     │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Without DevTools:                                                               │
│  - Change User.java → Restart entire application → 10-30 seconds                 │
│                                                                                  │
│  With DevTools:                                                                  │
│  - Your code: Loaded by "RestartClassLoader" (custom)                            │
│  - Dependencies: Loaded by base classloader (not reloaded)                       │
│                                                                                  │
│  Change detected:                                                                │
│  1. Only RestartClassLoader is thrown away                                       │
│  2. New RestartClassLoader created                                               │
│  3. Your classes reloaded (fast!)                                                │
│  4. Dependencies stay loaded (not reloaded)                                      │
│                                                                                  │
│  Result: Restart in 1-3 seconds instead of 10-30!                                │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

🔬 **Section Challenge — G.4 Spring DevTools Hot Reload**

**Challenge 1 (Reasoning — Who/When/What):** Spring DevTools uses TWO classloaders: a "base" classloader for libraries and a "restart" classloader for your code. **Why** two instead of one? **What** does this enable that a full JVM restart doesn't?

<details><summary>Answer</summary>

**Why two?** Libraries (Spring, Jackson, etc.) don't change during development — reloading them wastes 5-10 seconds per restart. By keeping them in the base classloader and only reloading YOUR code in a new restart classloader, DevTools achieves sub-second restarts. **What it enables:** Incremental class reloading. Change a controller → save → restart classloader is discarded and recreated with new classes in ~300ms. Without DevTools: full JVM restart = 10-15 seconds. **Limitation:** Changes to library versions, resource files, or `@Configuration` classes still require a full restart because those are in the base classloader.

</details>

# SECTION H: BUILD TOOLS INTERNALS - MAVEN/GRADLE

## Why This Matters

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  BUILD FAILURES? DEPENDENCY CONFLICTS? UNDERSTANDING LIFECYCLES?                 │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  You use Maven/Gradle daily but:                                                 │
│  - "mvn clean install" - what does each word mean?                               │
│  - Why does "provided" scope exist?                                              │
│  - How does transitive dependency resolution work?                               │
│  - What's the difference between compile and runtime?                            │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

## H.1 Maven Lifecycle Phases

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                    MAVEN BUILD LIFECYCLE                                         │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  mvn [phase]  →  Runs all phases UP TO AND INCLUDING that phase                  │
│                                                                                  │
│  Phase           │ What It Does                                                  │
│  ────────────────┼────────────────────────────────────────────────────────────   │
│  validate        │ Validate project is correct                                   │
│  compile         │ Compile source code (src/main/java → target/classes)          │
│  test            │ Run unit tests (src/test/java)                                │
│  package         │ Create JAR/WAR file (target/*.jar)                            │
│  verify          │ Run integration tests                                         │
│  install         │ Install to local .m2 repository                               │
│  deploy          │ Upload to remote repository (Nexus, etc.)                     │
│                                                                                  │
│  "mvn install" runs: validate → compile → test → package → verify → install      │
│                                                                                  │
│  OTHER COMMANDS:                                                                 │
│  mvn clean       │ Delete target/ directory                                      │
│  mvn clean install │ Delete target/, then full build                             │
│  mvn package -DskipTests │ Package without running tests                         │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

## H.2 Dependency Scopes

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                    MAVEN DEPENDENCY SCOPES                                       │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Scope      │ Compile │ Test │ Runtime │ Transitive │ Example                    │
│  ───────────┼─────────┼──────┼─────────┼────────────┼────────────────────────    │
│  compile    │   ✅    │  ✅  │   ✅    │    ✅      │ spring-boot-starter        │
│  (default)  │         │      │         │            │                            │
│             │         │      │         │            │                            │
│  provided   │   ✅    │  ✅  │   ❌    │    ❌      │ servlet-api (provided    │
│             │         │      │         │            │ by Tomcat)                 │
│             │         │      │         │            │                            │
│  runtime    │   ❌    │  ✅  │   ✅    │    ✅      │ JDBC drivers (mysql-     │
│             │         │      │         │            │ connector-java)            │
│             │         │      │         │            │                            │
│  test       │   ❌    │  ✅  │   ❌    │    ❌      │ JUnit, Mockito           │
│             │         │      │         │            │                            │
│  system     │   ✅    │  ✅  │   ✅    │    ❌      │ Local JAR file           │
│             │         │      │         │            │ (avoid this!)              │
│                                                                                  │
│  COMMON CONFUSION:                                                               │
│  Q: Why is Lombok "provided" in some projects?                                   │
│  A: It generates code at COMPILE time. At runtime, generated code exists,        │
│     no need for Lombok JAR. But usually it's "compile" scope for simplicity.     │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

🔬 **Section Challenge — H.2 Dependency Scopes**

**Challenge 1 (Scope Trace — Who/When/What):** A `mysql-connector-java` JDBC driver is declared in `pom.xml` with `<scope>runtime</scope>`. **Who** is allowed to use it? **When** does it appear on the classpath? **What** breaks if you change it to `<scope>compile</scope>`?

<details><summary>Answer</summary>

**Who can use it:** Only your application at runtime. With `runtime` scope, the driver is NOT on the compile-time classpath — source code cannot reference `com.mysql.cj.jdbc.Driver` directly. **When it appears:** During `mvn test` (test classpath includes runtime) and when running the packaged JAR. It is absent during `mvn compile`. **What breaks if changed to compile:** Nothing functionally — the driver still loads at runtime. But you now CAN accidentally write code that directly imports MySQL-specific classes, coupling your code to a specific vendor. `runtime` scope enforces the abstraction: use `java.sql.DataSource` (compile-time), let the JDBC driver SPI auto-register itself at runtime. **Transitive difference:** `compile` scope propagates to dependents. `runtime` does NOT — dependents don't get the JDBC driver on their compile classpath either, which is the correct behavior for drivers.

</details>

**Challenge 2 (Scope Design):** Why is Lombok declared with `<scope>provided</scope>` in some projects? Why does it still need to be `<scope>compile</scope>` in others?

<details><summary>Answer</summary>

**Provided scope for Lombok:** Lombok runs as an annotation processor at compile time — it generates getter/setter/builder code directly into `.class` files. The Lombok JAR itself is NOT needed at runtime (the generated code is already in your `.class` files). So `provided` is technically correct: present at compile time, absent from the packaged JAR. **But why compile scope in practice?** Some build toolchains (Gradle, certain IDEs without annotation processor config) need `compile` scope to activate the processor correctly. Spring Initializr generates `<scope>provided</scope>` which is the precise correct scope. `<optional>true</optional>` further prevents transitive propagation.

</details>

## H.3 Transitive Dependencies

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                    TRANSITIVE DEPENDENCY RESOLUTION                              │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Your pom.xml:                                                                   │
│  <dependency>                                                                    │
│      <groupId>org.springframework.boot</groupId>                                 │
│      <artifactId>spring-boot-starter-web</artifactId>                            │
│  </dependency>                                                                   │
│                                                                                  │
│  What you actually get:                                                          │
│                                                                                  │
│  spring-boot-starter-web                                                         │
│  ├── spring-boot-starter                                                         │
│  │   ├── spring-boot                                                             │
│  │   ├── spring-boot-autoconfigure                                               │
│  │   └── spring-core                                                             │
│  ├── spring-boot-starter-json                                                    │
│  │   ├── jackson-databind                                                        │
│  │   └── jackson-core                                                            │
│  ├── spring-boot-starter-tomcat                                                  │
│  │   └── tomcat-embed-core                                                       │
│  └── spring-webmvc                                                               │
│      ├── spring-aop                                                              │
│      ├── spring-beans                                                            │
│      └── spring-context                                                          │
│                                                                                  │
│  ONE dependency = 20+ JARs downloaded automatically!                             │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### Viewing Dependencies

```bash
# See all dependencies (including transitive)
mvn dependency:tree

# Find where a specific dependency comes from
mvn dependency:tree -Dincludes=com.fasterxml.jackson.core:jackson-databind
```

## H.4 Dependency Conflicts

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                    VERSION CONFLICT RESOLUTION                                   │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Your project has:                                                               │
│  - Library A depends on Guava 28.0                                               │
│  - Library B depends on Guava 30.0                                               │
│                                                                                  │
│  MAVEN'S RULE: "Nearest Definition Wins"                                         │
│                                                                                  │
│  your-project                                                                    │
│  ├── library-a                                                                   │
│  │   └── guava:28.0    (depth 2)                                                 │
│  └── library-b                                                                   │
│      └── guava:30.0    (depth 2)                                                 │
│                                                                                  │
│  Same depth? FIRST ONE WINS (order in pom.xml matters!)                          │
│                                                                                  │
│  PROBLEM: What if library-a needs Guava 30 features?                             │
│           → RuntimeException!                                                    │
│                                                                                  │
│  SOLUTION: Explicitly declare version in YOUR pom.xml                            │
│                                                                                  │
│  <dependency>                                                                    │
│      <groupId>com.google.guava</groupId>                                         │
│      <artifactId>guava</artifactId>                                              │
│      <version>30.0-jre</version>  ◄── Your explicit version wins                 │
│  </dependency>                                                                   │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### Excluding Transitive Dependencies

```xml
<dependency>
    <groupId>org.springframework</groupId>
    <artifactId>spring-core</artifactId>
    <exclusions>
        <exclusion>
            <groupId>commons-logging</groupId>
            <artifactId>commons-logging</artifactId>
        </exclusion>
    </exclusions>
</dependency>
```

---

🔬 **Section Challenge — H.4 Dependency Conflicts**

**Challenge 1 (Conflict Trace — Who/When/What):** Your app uses `spring-boot-starter-web` and explicitly adds `jackson-databind:2.12.0`. Maven resolves to `2.15.2` (from the BOM). **Who** wins? **When** does Maven's nearest-wins rule fire? **What** command shows you the final resolved tree?

<details><summary>Answer</summary>

**Who wins:** The explicitly declared version wins — `jackson-databind:2.12.0` — because Maven's nearest-wins rule selects the dependency closest to the root `pom.xml` in the dependency graph. Your explicit declaration is at depth 1; the BOM's transitive is at depth 2. **When nearest-wins fires:** During the dependency resolution phase (`mvn dependency:resolve`). If two declarations are at the same depth, the first one declared wins. **Command to see result:** `mvn dependency:tree -Dincludes=com.fasterxml.jackson.core:jackson-databind` — shows only the Jackson subtree with the winning version and why others were omitted. Or `mvn dependency:tree -Dverbose` to see ALL candidates including those omitted due to conflict. **Problem with this:** Spring Boot 3.x requires Jackson 2.15+. Pinning to 2.12.0 will cause `ClassNotFoundException` or `NoSuchMethodError` at runtime when Spring tries to use newer Jackson APIs.

</details>

**Challenge 2 (Bug Hunt):** `mvn dependency:tree` shows two versions of the same library: `[INFO] +- com.example:lib:jar:1.0.0:compile` and `[INFO] | \- com.example:lib:jar:2.0.0:compile (omitted for conflict)`. The app crashes with `NoSuchMethodError` at runtime. **Who** caused this? **What** is the fix?

<details><summary>Answer</summary>

**Who caused it:** The code (or a transitive dependency) calls a method present in `lib:2.0.0` but absent in `lib:1.0.0` (the resolved winner). Maven selected 1.0.0 (nearest-wins), but the calling code was compiled against 2.0.0. **Fix:** Add an explicit `<dependencyManagement>` entry: `<dependency><groupId>com.example</groupId><artifactId>lib</artifactId><version>2.0.0</version></dependency>` — this forces all transitive references to resolve to 2.0.0. Never use `<exclusion>` to drop a transitive dep without re-adding the correct version explicitly, as that causes `ClassNotFoundException` instead.

</details>

# SECTION I: HTTP FUNDAMENTALS - BELOW THE FRAMEWORK

## Why This Matters

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  SPRING HIDES ALL HTTP COMPLEXITY - BUT YOU MUST UNDERSTAND IT                   │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  When debugging:                                                                 │
│  - Why is my request timing out?                                                 │
│  - Why does the load balancer keep failing health checks?                        │
│  - Why is CORS failing?                                                          │
│  - Why am I getting 502 Bad Gateway?                                             │
│                                                                                  │
│  You need to understand HTTP at the raw level!                                   │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

## I.1 HTTP Message Format

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                    RAW HTTP REQUEST                                              │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  POST /api/users HTTP/1.1                 ← Request line                         │
│  Host: api.example.com                    ← Headers start                        │
│  Content-Type: application/json                                                  │
│  Authorization: Bearer eyJhbGc...                                                │
│  Content-Length: 45                                                              │
│  Accept: application/json                                                        │
│                                           ← Empty line (CRLF)                    │
│  {"name":"John","email":"john@test.com"}  ← Body                                 │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────────┐
│                    RAW HTTP RESPONSE                                             │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  HTTP/1.1 201 Created                     ← Status line                          │
│  Content-Type: application/json           ← Headers start                        │
│  Location: /api/users/123                                                        │
│  Content-Length: 67                                                              │
│                                           ← Empty line (CRLF)                    │
│  {"id":123,"name":"John","email":"john@test.com"}  ← Body                        │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

🔬 **Section Challenge — I.1 HTTP Message Format**

**Challenge 1 (Trace — Who/When/What):** A Spring Boot response for a large JSON payload uses `Transfer-Encoding: chunked` instead of `Content-Length`. **Who** decides to use chunked encoding? **When?** **What** is the advantage?\n\n<details><summary>Answer</summary>\n\n**Who decides?** Tomcat's `Response` object — when the response body size is not known before writing begins (no `Content-Length` set). Jackson serializes the object to Tomcat's output buffer incrementally. **When decided?** When the first write exceeds the response buffer (default 8KB) before the response is committed — Tomcat automatically switches to `Transfer-Encoding: chunked`. **Advantage:** You can start sending data to the client BEFORE you know the total size. Each chunk has its own size header, followed by data, terminated by a zero-length chunk. **Client impact:** The client receives and processes chunks as they arrive — better latency for large payloads. **Spring control:** `ResponseEntity.ok().body(data)` with known size sets `Content-Length`. `StreamingResponseBody` or `ResponseBodyEmitter` explicitly stream chunks.\n\n</details>

## I.2 HTTP Methods - Semantic Meaning

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                    HTTP METHODS DEEP DIVE                                        │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Method   │ Safe │ Idempotent │ Has Body │ Use Case                             │
│  ─────────┼──────┼────────────┼──────────┼─────────────────────────────────────  │
│  GET      │  ✅  │     ✅    │    ❌    │ Retrieve resource                    │
│  HEAD     │  ✅  │     ✅    │    ❌    │ Like GET but no body (check exists)  │
│  OPTIONS  │  ✅  │     ✅    │    ❌    │ Get allowed methods (CORS preflight)   │
│  POST     │  ❌  │     ❌    │    ✅    │ Create resource (not idempotent!)     │
│  PUT      │  ❌  │     ✅    │    ✅    │ Replace entire resource               │
│  PATCH    │  ❌  │     ❌    │    ✅    │ Partial update                       │
│  DELETE   │  ❌  │     ✅    │    ❌*   │ Remove resource                       │
│                                                                                  │
│  SAFE: Doesn't modify server state                                               │
│  IDEMPOTENT: Multiple identical requests = same result                           │
│                                                                                  │
│  EXAMPLE:                                                                        │
│  - POST /orders twice = 2 orders created (NOT idempotent)                        │
│  - PUT /orders/1 twice = 1 order (same result each time) (idempotent)            │
│  - DELETE /orders/1 twice = order deleted first time, 404 second time            │
│                           = same final state (idempotent)                        │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

🔬 **Section Challenge — I.2 HTTP Methods - Semantic Meaning**

**Challenge 1 (Reasoning — Who/When/What):** `DELETE /orders/1` is idempotent but `POST /orders` is not. Your client retries a failed POST request due to a timeout. **What** problem can this cause? **What** header pattern prevents duplicate creation?

<details><summary>Answer</summary>

**Problem:** Duplicate resource creation — the first POST may have succeeded (server processed it) but the response was lost in transit. Client retries → second order created. **Fix:** Idempotency keys. Client generates a unique `Idempotency-Key: uuid-1234` header. Server stores (key → response) in a cache. On retry with same key, server returns the cached response without re-processing. Stripe, PayPal, and most payment APIs require this. Alternative: use `PUT /orders/{client-generated-id}` which IS idempotent — multiple PUTs with same ID update (not create) the same resource.

</details>

## I.3 HTTP Status Codes - Complete Reference

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                    HTTP STATUS CODES                                             │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  1xx INFORMATIONAL                                                               │
│  100 Continue        - Server received headers, send body                        │
│  101 Switching       - Upgrading to WebSocket                                    │
│                                                                                  │
│  2xx SUCCESS                                                                     │
│  200 OK              - Generic success                                           │
│  201 Created         - Resource created (return Location header!)                │
│  202 Accepted        - Request accepted, processing async                        │
│  204 No Content      - Success but no body (DELETE response)                     │
│                                                                                  │
│  3xx REDIRECTION                                                                 │
│  301 Moved Permanently  - URL changed forever (browser caches)                   │
│  302 Found (Temporary)  - Temporary redirect                                     │
│  304 Not Modified       - Use cached version (ETags)                             │
│                                                                                  │
│  4xx CLIENT ERROR                                                                │
│  400 Bad Request     - Malformed request (validation failed)                     │
│  401 Unauthorized    - Not authenticated (no/invalid token)                      │
│  403 Forbidden       - Authenticated but not authorized                          │
│  404 Not Found       - Resource doesn't exist                                    │
│  405 Method Not Allowed - Wrong HTTP method                                      │
│  409 Conflict        - State conflict (duplicate, version mismatch)              │
│  415 Unsupported Media Type - Wrong Content-Type                                 │
│  422 Unprocessable Entity - Semantic errors in body                              │
│  429 Too Many Requests - Rate limited                                            │
│                                                                                  │
│  5xx SERVER ERROR                                                                │
│  500 Internal Server Error - Generic server error                                │
│  502 Bad Gateway     - Proxy got bad response from upstream                      │
│  503 Service Unavailable - Server overloaded or maintenance                      │
│  504 Gateway Timeout - Proxy timeout waiting for upstream                        │
│                                                                                  │
│  SPRING BOOT MAPPINGS:                                                           │
│  - Validation error (@Valid) → 400                                               │
│  - NoHandlerFound → 404                                                          │
│  - MethodNotSupported → 405                                                      │
│  - Unhandled exception → 500                                                     │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

🔬 **Section Challenge — I.3 HTTP Status Codes**

**Challenge 1 (Debug — Who/When/What):** Your Spring Boot app returns 500 for a validation error that should be 400. **Who** decides the status code? **When** does Spring auto-map exceptions to codes? **What** annotation fixes this?

<details><summary>Answer</summary>

**Who decides?** Spring's `DefaultHandlerExceptionResolver` for known exceptions, or your `@ControllerAdvice` for custom handling. **When auto-mapped?** `@Valid` failures → 400 automatically. `NoHandlerFoundException` → 404. Unhandled exceptions → 500 (the catch-all). **Fix:** If your custom exception should be 400, annotate it: `@ResponseStatus(HttpStatus.BAD_REQUEST) class InvalidOrderException extends RuntimeException {}`. Or use `@ExceptionHandler` in `@ControllerAdvice` to return `ResponseEntity.badRequest().body(errorDto)`. Never let validation errors bubble to 500 — it signals server bugs to clients and triggers alerting.

</details>

## I.4 Keep-Alive and Connection Management

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                    HTTP/1.1 KEEP-ALIVE                                           │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  WITHOUT Keep-Alive (HTTP/1.0 default):                                          │
│                                                                                  │
│  Request 1: [TCP Connect] → [Request] → [Response] → [TCP Close]                 │
│  Request 2: [TCP Connect] → [Request] → [Response] → [TCP Close]                 │
│  Request 3: [TCP Connect] → [Request] → [Response] → [TCP Close]                 │
│                                                                                  │
│  3 requests = 3 TCP handshakes = ~150ms overhead!                                │
│                                                                                  │
│  WITH Keep-Alive (HTTP/1.1 default):                                             │
│                                                                                  │
│  [TCP Connect] → [Request 1] → [Response 1]                                      │
│               → [Request 2] → [Response 2]                                       │
│               → [Request 3] → [Response 3] → [TCP Close]                         │
│                                                                                  │
│  3 requests = 1 TCP handshake = ~50ms overhead!                                  │
│                                                                                  │
│  Headers:                                                                        │
│  Connection: keep-alive                                                          │
│  Keep-Alive: timeout=5, max=100                                                  │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

## I.5 Content Negotiation

```java
// How client tells server what format it wants

// Request headers:
Accept: application/json                    // I want JSON
Accept: application/xml                     // I want XML
Accept: text/html, application/json;q=0.9  // HTML preferred, JSON acceptable
Accept: */*                                 // Anything is fine

// q-factor (quality factor): 0.0 to 1.0, higher = more preferred
Accept: text/html;q=1.0, application/json;q=0.9, */*;q=0.1

// Spring handling:
@GetMapping(value = "/user", produces = {
    MediaType.APPLICATION_JSON_VALUE,
    MediaType.APPLICATION_XML_VALUE
})
public User getUser() {
    return user;  // Spring picks format based on Accept header
}
```

---

# SECTION J: DESIGN PATTERNS IN SPRING

## Why This Matters

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  SPRING IS A DESIGN PATTERNS SHOWCASE - KNOW THE PATTERNS!                       │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  When interviewer asks:                                                          │
│  "What design patterns does Spring use?"                                         │
│                                                                                  │
│  Don't say "I don't know" - SPRING USES THEM ALL!                                │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

## J.1 Singleton Pattern

```java
// Spring beans are SINGLETON by default

@Service
public class UserService { }  // One instance in entire application

// Behind the scenes:
public class SingletonBeanFactory {
    private Map<String, Object> singletonCache = new ConcurrentHashMap<>();

    public Object getBean(String name, Class<?> type) {
        // Check cache first
        Object singleton = singletonCache.get(name);
        if (singleton != null) {
            return singleton;
        }

        // Create and cache
        synchronized(singletonCache) {
            singleton = type.getDeclaredConstructor().newInstance();
            singletonCache.put(name, singleton);
            return singleton;
        }
    }
}

// WHY IT MATTERS:
// - Don't store request-specific state in @Service/@Repository
// - Beans are shared across ALL requests!
```

🔬 **Section Challenge — J.1 Singleton Pattern**

**Challenge 1 (Debug — Who/When/What):** A `@Service` bean has a `List<String> log = new ArrayList<>()` field. Requests add to it. After 1000 requests, **what** does the list contain? **Who** is responsible for this bug? **What** is the fix?

<details><summary>Answer</summary>

**What does it contain?** All 1000 entries from ALL requests — the log grows forever and is SHARED across every request. **Who is responsible?** The developer. Spring beans are Singleton by default — ONE instance shared across ALL requests. Mutable instance fields are shared state. **Fix options:** (1) Don't store request state in beans at all — pass it as method parameters. (2) Use `ThreadLocal<List<String>>` for request-scoped storage (clear in finally). (3) For true per-request beans, use `@Scope("request")` — but this creates a new bean per HTTP request via a proxy, which has performance overhead. Rule: `@Service`/`@Repository` should be **stateless**. All data flows through method parameters and return values.

</details>

## J.2 Factory Pattern

```java
// BeanFactory/ApplicationContext = Factory that creates beans

ApplicationContext context = new AnnotationConfigApplicationContext(AppConfig.class);
UserService service = context.getBean(UserService.class);  // Factory creates/returns

// @Bean methods are factory methods
@Configuration
public class AppConfig {

    @Bean  // This IS a factory method
    public UserService userService(UserRepository repo) {
        return new UserServiceImpl(repo);
    }
}
```

## J.3 Proxy Pattern

```java
// Already covered in Section C, but the pattern:

// @Transactional creates proxy
@Transactional
public class UserService {
    public void saveUser(User user) { }
}

// UserService$Proxy is created that wraps UserService
// All calls go through proxy first
```

## J.4 Template Method Pattern

```java
// JdbcTemplate, RestTemplate, JmsTemplate...

public abstract class AbstractTemplate {
    // Template method - defines algorithm skeleton
    public final void execute() {
        setup();           // Fixed step
        doSpecificWork();  // Subclass implements
        cleanup();         // Fixed step
    }

    protected void setup() { /* default */ }
    protected void cleanup() { /* default */ }
    protected abstract void doSpecificWork();  // Hook for subclass
}

// JdbcTemplate does this:
// 1. Get connection (fixed)
// 2. Execute your query (your code via callback)
// 3. Handle results (your code)
// 4. Close connection (fixed)
```

## J.5 Strategy Pattern

```java
// Spring uses strategies everywhere

// Example: Resource loading strategy
Resource resource1 = new ClassPathResource("file.txt");   // Strategy 1
Resource resource2 = new FileSystemResource("/path/file"); // Strategy 2
Resource resource3 = new UrlResource("http://...");        // Strategy 3

// All implement same interface, different strategy
public interface Resource {
    InputStream getInputStream();
    boolean exists();
    // ...
}

// Transaction management strategies
PlatformTransactionManager jpa = new JpaTransactionManager();
PlatformTransactionManager jdbc = new DataSourceTransactionManager();
```

## J.6 Observer Pattern (Events)

```java
// Spring's event system

// Define event
public class UserCreatedEvent extends ApplicationEvent {
    private final User user;

    public UserCreatedEvent(Object source, User user) {
        super(source);
        this.user = user;
    }
}

// Publisher
@Service
public class UserService {
    @Autowired
    private ApplicationEventPublisher publisher;

    public User createUser(User user) {
        // Save user...
        publisher.publishEvent(new UserCreatedEvent(this, user));  // Notify observers
        return user;
    }
}

// Observer/Listener
@Component
public class EmailNotificationListener {

    @EventListener
    public void onUserCreated(UserCreatedEvent event) {
        // Send welcome email
    }
}

@Component
public class AuditLogListener {

    @EventListener
    public void onUserCreated(UserCreatedEvent event) {
        // Log to audit trail
    }
}

// Multiple observers, decoupled from publisher!
```

## J.7 Decorator Pattern

```java
// Spring's BeanPostProcessor = Decorator

@Component
public class LoggingBeanPostProcessor implements BeanPostProcessor {

    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) {
        // Wrap/decorate every bean with logging
        if (bean instanceof SomeService) {
            return createLoggingProxy(bean);  // Return decorated version
        }
        return bean;
    }
}

// Servlet Filters are also decorators:
// Each filter wraps the next, adding behavior
```

🔬 **Section Challenge — J.7 Decorator Pattern**

**Challenge 1 (Trace — Who/When/What):** The code shows `BeanPostProcessor` wrapping beans. **When** in Spring's bean lifecycle does `postProcessAfterInitialization` run? **What** has already happened to the bean at that point? **Who** calls it?

<details><summary>Answer</summary>

**When?** After: (1) constructor injection, (2) setter/field injection, (3) `@PostConstruct` method, (4) `InitializingBean.afterPropertiesSet()`, (5) custom `init-method`. **What already happened?** The bean is FULLY initialized — all dependencies are injected, all init callbacks have run. **Who calls?** `AbstractAutowireCapableBeanFactory.initializeBean()` iterates ALL registered BeanPostProcessors and calls `postProcessAfterInitialization()` on each bean. This is how `@Transactional` proxies are created — the BeanPostProcessor wraps the fully-initialized bean in a proxy AFTER all initialization is complete.

</details>

## J.8 Chain of Responsibility

```java
// Filter chain, Interceptor chain, Security filter chain

public interface Filter {
    void doFilter(Request req, Response res, FilterChain chain);
}

// Each filter can:
// 1. Process and pass to next: chain.doFilter(req, res)
// 2. Short-circuit: return early without calling chain.doFilter()

// Security filter chain:
// Request → AuthenticationFilter → AuthorizationFilter → ... → Controller
```

---

🔬 **Section Challenge — J.8 Chain of Responsibility**

**Challenge 1 (Debug — Who/When/What):** In Spring Security's filter chain, a custom `AuthFilter` calls `chain.doFilter(req, res)` to pass to the next filter. **What** happens if you forget to call `chain.doFilter()`? **Who** never executes?

<details><summary>Answer</summary>

**What happens?** The request STOPS at your filter. No subsequent filters execute, and the Controller never receives the request. The client gets a blank response (or whatever your filter wrote to the response). **Who never executes?** All downstream filters + the DispatcherServlet + your Controller. This is called "short-circuiting" the chain — it's intentional for auth failures (return 401 without proceeding), but a bug if you forgot the call. **Key pattern:** Always call `chain.doFilter()` in the success path. Only skip it when you intentionally want to block the request (e.g., invalid token → write 401 → return).

</details>

# SECTION K: THREADS & EXECUTORS

## Why This Matters

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  EVERY HTTP REQUEST = ONE THREAD (by default)                                    │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Understanding threading:                                                        │
│  - Why does Tomcat have 200 max threads?                                         │
│  - How does @Async work?                                                         │
│  - What happens with CompletableFuture?                                          │
│  - Why is ThreadLocal useful?                                                    │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

## K.1 Tomcat Thread Pool

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                    TOMCAT REQUEST HANDLING                                       │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  HTTP Request                                                                    │
│       │                                                                          │
│       ▼                                                                          │
│  ┌──────────────────────────────────────────────────────────────────────┐        │
│  │ Tomcat Thread Pool                                                    │       │
│  │                                                                        │      │
│  │  [Thread-1] [Thread-2] [Thread-3] ... [Thread-200]                   │        │
│  │      │                                                                 │      │
│  │      └──► Assigned to handle this request                            │        │
│  └──────────────────────────────────────────────────────────────────────┘        │
│       │                                                                          │
│       ▼                                                                          │
│  Your Controller executes on Thread-1                                            │
│       │                                                                          │
│       ▼                                                                          │
│  Response sent, Thread-1 returned to pool                                        │
│                                                                                  │
│                                                                                  │
│  DEFAULT: max 200 threads                                                        │
│  RULE: If request takes 100ms, can handle 2000 req/sec                           │
│        If request takes 1s, can only handle 200 req/sec!                         │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

```yaml


🔬 **Section Challenge — K.1 Tomcat Thread Pool**

**Challenge 1 (Reasoning — Who/When/What):** Default Tomcat max threads = 200. Your endpoint calls an external API taking 2 seconds per request. **When** does your server stop accepting new requests? **What** is the max throughput in requests/sec?

<details><summary>Answer</summary>

**When?** After 200 concurrent requests — all threads are blocked waiting for the external API. Request 201 enters the `accept-count` queue (default 100). Request 301 gets connection refused. **Max throughput:** 200 threads ÷ 2 sec/request = 100 requests/sec. **Fix options:** (1) Increase threads (but each thread costs ~1MB stack → 200 threads = 200MB). (2) Use `@Async` + `CompletableFuture` to release the Tomcat thread during the API call. (3) Switch to WebFlux (reactive, non-blocking) — one thread handles thousands of concurrent requests. (4) Add a timeout: `RestTemplate.setConnectTimeout(500)` — fail fast instead of blocking forever.

</details>


# Tomcat thread pool configuration
server:
  tomcat:
    threads:
      max: 200        # Maximum worker threads
      min-spare: 10   # Minimum idle threads
    max-connections: 8192    # Max simultaneous connections
    accept-count: 100        # Queue when all threads busy
```

## K.2 ExecutorService Basics

```java
// Creating thread pools

// Fixed size pool
ExecutorService fixedPool = Executors.newFixedThreadPool(10);

// Cached pool (grows/shrinks as needed)
ExecutorService cachedPool = Executors.newCachedThreadPool();

// Single thread (tasks execute sequentially)
ExecutorService singleThread = Executors.newSingleThreadExecutor();

// Scheduled tasks
ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(5);

// Submit tasks
Future<String> future = fixedPool.submit(() -> {
    return "Result";
});

String result = future.get();  // Blocks until complete
```

## K.3 @Async in Spring

```java
@Configuration
@EnableAsync
public class AsyncConfig {

    @Bean
    public Executor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(5);         // Min threads
        executor.setMaxPoolSize(10);         // Max threads
        executor.setQueueCapacity(25);       // Queue size before creating new threads
        executor.setThreadNamePrefix("Async-");
        executor.initialize();
        return executor;
    }
}

@Service
public class EmailService {

    @Async  // Runs on separate thread!
    public void sendEmail(String to, String body) {
        // This method returns immediately to caller
        // Email sending happens in background
    }

    @Async
    public CompletableFuture<String> sendEmailAsync(String to, String body) {
        // Return a Future if you need the result
        return CompletableFuture.completedFuture("Email sent");
    }
}
```

🔬 **Section Challenge — K.3 @Async in Spring**

**Challenge 1 (Debug — Who/When/What):** You annotate a method `@Async` but it still runs synchronously on the caller's thread. **What** is the most common cause? **Who** creates the proxy that enables async behavior?

<details><summary>Answer</summary>

**Most common cause:** Calling the `@Async` method from within the SAME class (`this.sendEmail()`). Spring's `@Async` works via a proxy wrapper. When you call `this.sendEmail()`, you bypass the proxy and invoke the raw method directly. **Who creates the proxy?** `AsyncAnnotationBeanPostProcessor`, which wraps the bean in a proxy that intercepts `@Async` methods and submits them to the configured `TaskExecutor`. **Fix:** Inject the service into another class and call it from there, or inject `self` via `@Lazy @Autowired`. Same issue affects `@Transactional`, `@Cacheable` — all proxy-based AOP features.

</details>

## K.4 ThreadLocal - Request-Scoped Storage

```java
// ThreadLocal = Variable unique to each thread

public class RequestContext {
    private static final ThreadLocal<User> currentUser = new ThreadLocal<>();

    public static void setUser(User user) {
        currentUser.set(user);
    }

    public static User getUser() {
        return currentUser.get();
    }

    public static void clear() {
        currentUser.remove();  // IMPORTANT: Prevent memory leaks!
    }
}

// Usage in filter:
public class AuthFilter implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response,
                        FilterChain chain) throws IOException, ServletException {
        try {
            User user = authenticate(request);
            RequestContext.setUser(user);  // Set for this thread/request
            chain.doFilter(request, response);
        } finally {
            RequestContext.clear();  // ALWAYS clear after request!
        }
    }
}

// Anywhere in your code:
@Service
public class OrderService {

    public Order createOrder(OrderRequest request) {
        User user = RequestContext.getUser();  // Get current user
        // No need to pass user through every method!
    }
}
```

### MDC (Mapped Diagnostic Context) - Logging's ThreadLocal

```java
// MDC stores logging context per thread

public class RequestLoggingFilter implements Filter {

    public void doFilter(ServletRequest request, ServletResponse response,
                        FilterChain chain) {
        try {
            String requestId = UUID.randomUUID().toString();
            MDC.put("requestId", requestId);
            MDC.put("userId", getCurrentUserId());

            chain.doFilter(request, response);
        } finally {
            MDC.clear();
        }
    }
}

// In logback.xml:
<pattern>%d{HH:mm:ss} [%X{requestId}] [%X{userId}] %msg%n</pattern>

// Now every log line includes requestId and userId automatically!
// 14:32:01 [abc-123] [user-456] Processing order...
```

---

# SECTION L: GENERICS & TYPE ERASURE

## Why This Matters

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  WHY CAN'T I DO: new T() or T.class or instanceof List<String>?                  │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Answer: TYPE ERASURE                                                            │
│                                                                                  │
│  Generics are a COMPILE-TIME feature only!                                       │
│  At runtime, generic type information is ERASED                                  │
│                                                                                  │
│  This affects:                                                                   │
│  - How Jackson deserializes generic types                                        │
│  - How Spring resolves generic beans                                             │
│  - Why you need TypeReference<T>                                                 │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

## L.1 What Is Type Erasure?

```java
// At compile time:
List<String> strings = new ArrayList<>();
List<Integer> numbers = new ArrayList<>();

// At runtime (after erasure):
List strings = new ArrayList();  // No <String>!
List numbers = new ArrayList();  // No <Integer>!

// They're THE SAME TYPE at runtime!
strings.getClass() == numbers.getClass()  // TRUE!

// This FAILS:
if (obj instanceof List<String>) { }  // Compile error!
// Because at runtime, it's just "List"
```

🔬 **Section Challenge — L.1 What Is Type Erasure?**

**Challenge 1 (Reasoning — Who/When/What):** Generics were erased for backward compatibility with Java 1.4. **Who** generates bridge methods? **When?** **What** is a bridge method?\n\n<details><summary>Answer</summary>\n\n**Who generates?** `javac` — the Java compiler, not the JVM. **When?** During compilation of a class that overrides a generic method. **What is a bridge method?** When you implement `Comparable<String>.compareTo(String)`, the compiler generates TWO methods in the bytecode: your actual `compareTo(String)` AND a synthetic bridge `compareTo(Object)` that casts and delegates. The bridge satisfies the erased `Comparable.compareTo(Object)` contract — required because older JVM bytecode expects `compareTo(Object)`. You can see bridge methods with `javap -verbose`. **Why it matters:** Bridge methods can cause unexpected method resolution in reflection — `getDeclaredMethods()` returns bridge methods too. Filter with `Method.isBridge()` to exclude them.\n\n</details>

## L.2 Problems Caused by Type Erasure

```java
// Problem 1: Can't create generic type
public class Box<T> {
    private T item;

    public void createItem() {
        item = new T();  // COMPILE ERROR! T doesn't exist at runtime
    }
}

// Solution: Pass Class<T>
public class Box<T> {
    private final Class<T> type;

    public Box(Class<T> type) {
        this.type = type;
    }

    public T createItem() throws Exception {
        return type.getDeclaredConstructor().newInstance();
    }
}

// Problem 2: Can't get generic type at runtime
public <T> void process(List<T> list) {
    Class<T> elementType = ???  // No way to get T!
}
```

🔬 **Section Challenge — L.2 Problems Caused by Type Erasure**

**Challenge 1 (Design — Who/When/What):** The code shows `new T()` fails. The solution is `Class<T> type` passed to the constructor. **Why** can't the JVM just "remember" T? **What** specifically is lost at compile time?

<details><summary>Answer</summary>

**What's lost?** The compiler replaces `T` with its upper bound (usually `Object`) during erasure. `Box<String>` and `Box<Integer>` compile to identical bytecode: `Box<Object>`. The JVM sees ONE class, not two parameterized versions. **Why not keep it?** Backward compatibility. Generics were added in Java 5 (2004) but the JVM spec couldn't break existing bytecode. Reified generics (like C# has) would require JVM changes that break all existing .class files. **The `Class<T>` trick works** because `Class` objects DO exist at runtime — `String.class` is a real object. You're passing the type info explicitly rather than relying on generic metadata.

</details>

## L.3 TypeReference - Jackson's Solution

```java
// Without TypeReference:
String json = "[{\"name\":\"John\"}, {\"name\":\"Jane\"}]";

// This FAILS to get correct type:
List<User> users = objectMapper.readValue(json, List.class);
// users contains LinkedHashMap, not User objects!

// Because at runtime: List.class = List.class (no generic info)

// With TypeReference:
List<User> users = objectMapper.readValue(
    json,
    new TypeReference<List<User>>() {}  // Anonymous class preserves generic!
);

// How it works:
// Anonymous class = new class that extends TypeReference<List<User>>
// Generic superclass type IS preserved in bytecode!
// Jackson reads it via reflection: getGenericSuperclass()
```

🔬 **Section Challenge — L.3 TypeReference - Jackson's Solution**

**Challenge 1 (Trace — Who/When/What):** `new TypeReference<List<User>>() {}` uses an anonymous class. **Why** does this trick preserve generic type info when normal generics are erased? **What** reflection method does Jackson call to extract it?

<details><summary>Answer</summary>

**Why preserved?** Anonymous classes are compiled to actual `.class` files (e.g., `MyClass$1.class`). The EXTENDS clause (`extends TypeReference<List<User>>`) is baked into the bytecode as the generic superclass — this is structural type info that survives erasure. Only TYPE VARIABLES (like `T`) are erased; CONCRETE parameterized types in class hierarchies are retained. **Jackson calls:** `getClass().getGenericSuperclass()` which returns `ParameterizedType`, then `getActualTypeArguments()[0]` to get `List<User>`. This is the "Super Type Token" pattern invented by Neal Gafter.

</details>

## L.4 ResolvableType - Spring's Solution

```java
// Spring can resolve complex generic types

// Get type argument of List<User>
ResolvableType listType = ResolvableType.forClass(UserRepository.class)
    .as(JpaRepository.class)
    .getGeneric(0);  // First generic parameter

Class<?> entityClass = listType.resolve();  // User.class

// Useful for:
// - Determining entity type in generic repositories
// - Resolving event types in @EventListener
// - Auto-wiring generic beans
```

---

🔬 **Section Challenge — L.4 ResolvableType - Spring's Solution**

**Challenge 1 (Reasoning — Who/When/What):** `ResolvableType` lets Spring resolve `JpaRepository<User, Long>` to know the entity is `User`. **When** does Spring need this? **What** would fail without it?

<details><summary>Answer</summary>

**When?** During auto-configuration. Spring Data needs to know the entity type to: (1) generate the `SimpleJpaRepository` implementation, (2) configure the correct `EntityManager`, (3) validate `@Query` method return types. **What fails?** Without type resolution, `findAll()` would return `List<Object>` instead of `List<User>`. Custom query methods like `findByEmail(String)` couldn't be auto-implemented because Spring wouldn't know WHICH table to query. `ResolvableType` uses the same "generic superclass preservation" trick as TypeReference, but wraps it in a Spring-friendly API with caching and hierarchical resolution.

</details>

# SECTION M: BYTECODE & INSTRUMENTATION

## Why This Matters

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  ADVANCED: How Tools Modify Your Code at Runtime                                 │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  These tools use bytecode manipulation:                                          │
│  - Spring Data: Generates repository implementations                             │
│  - Hibernate: Adds lazy loading logic to entities                                │
│  - Mockito: Creates mock objects                                                 │
│  - CGLIB: Proxies for @Transactional                                             │
│  - JaCoCo: Code coverage                                                         │
│  - Debuggers: Breakpoints                                                        │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

## M.1 Java Bytecode Basics

```java
// Your Java code:
public int add(int a, int b) {
    return a + b;
}

// Becomes bytecode (simplified):
// ILOAD 1      - Load first int parameter
// ILOAD 2      - Load second int parameter
// IADD         - Add them
// IRETURN      - Return int result

// View bytecode:
// javap -c MyClass.class
```

## M.2 How Spring Data Generates Repository Implementations

```java
// You write:
public interface UserRepository extends JpaRepository<User, Long> {
    List<User> findByLastName(String lastName);
}

// Spring Data generates AT RUNTIME:
public class UserRepositoryImpl implements UserRepository {

    @Override
    public List<User> findByLastName(String lastName) {
        // Generated query execution code
        String jpql = "SELECT u FROM User u WHERE u.lastName = :lastName";
        return entityManager.createQuery(jpql, User.class)
            .setParameter("lastName", lastName)
            .getResultList();
    }

    // All JpaRepository methods also implemented...
}

// This is created using:
// 1. java.lang.reflect.Proxy (for interface)
// 2. Method name parsing ("findBy" + "LastName")
// 3. Query generation
```

🔬 **Section Challenge — M.2 How Spring Data Generates Repository Implementations**

**Challenge 1 (Trace — Who/When/What):** You write `interface UserRepo extends JpaRepository<User, Long> { List<User> findByEmail(String email); }` with NO implementation. **Who** creates the implementation? **When?** **What** bytecode is generated?

<details><summary>Answer</summary>

**Who?** `JpaRepositoryFactoryBean` + `ProxyFactory`. Spring Data scans for interfaces extending `Repository`, creates a JDK dynamic proxy for each. **When?** At application startup, during bean creation. **What's generated?** A proxy that delegates: `findByEmail("x")` → Spring Data parses the method name into a JPQL query `SELECT u FROM User u WHERE u.email = ?1`, executes it via `EntityManager`, and returns the result. Standard methods like `findAll()` delegate to `SimpleJpaRepository` (a concrete class Spring Data provides). The "magic" is method-name-to-query parsing — not actual bytecode generation like Hibernate does for entities.

</details>

## M.3 Hibernate Bytecode Enhancement

```java
@Entity
public class User {
    @Id
    private Long id;

    @OneToMany(fetch = FetchType.LAZY)
    private List<Order> orders;  // Lazy loaded
}

// Hibernate enhances bytecode to add:
public class User$HibernateProxy extends User {
    private boolean ordersLoaded = false;

    @Override
    public List<Order> getOrders() {
        if (!ordersLoaded) {
            // Load from database NOW
            this.orders = loadOrdersFromDb();
            ordersLoaded = true;
        }
        return super.getOrders();
    }
}
```

🔬 **Section Challenge — M.3 Hibernate Bytecode Enhancement**

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

## M.4 Java Agents

```java
// Java agents can transform classes as they load

// Agent class (requires premain method)
public class MyAgent {

    public static void premain(String args, Instrumentation inst) {
        inst.addTransformer(new ClassFileTransformer() {
            @Override
            public byte[] transform(ClassLoader loader, String className,
                                   Class<?> classBeingRedefined,
                                   ProtectionDomain protectionDomain,
                                   byte[] classfileBuffer) {
                // Modify bytecode here!
                return modifiedBytecode;
            }
        });
    }
}

// Run with agent:
// java -javaagent:myagent.jar -jar myapp.jar

// Used by:
// - APM tools (New Relic, Datadog)
// - Code coverage (JaCoCo)
// - Profilers (YourKit)
// - Mocking libraries (PowerMock)
```

---

# 📋 QUICK REFERENCE: KEY TAKEAWAYS

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                    WHAT YOU SHOULD REMEMBER                                      │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  REFLECTION                                                                      │
│  • Spring uses reflection for EVERYTHING                                         │
│  • setAccessible(true) bypasses private                                          │
│  • Reflection is slow but cached                                                 │
│                                                                                  │
│  ANNOTATIONS                                                                     │
│  • RUNTIME retention = Spring can read it                                        │
│  • SOURCE retention = Compile-time only (Lombok)                                 │
│                                                                                  │
│  PROXIES                                                                         │
│  • @Transactional creates proxy, not modifies code                               │
│  • Self-invocation bypasses proxy!                                               │
│  • Private methods can't be proxied                                              │
│                                                                                  │
│  SERVLETS                                                                        │
│  • Spring MVC = Fancy servlet framework                                          │
│  • Filter → Interceptor → Controller → Interceptor → Filter                      │
│                                                                                  │
│  JACKSON                                                                         │
│  • @JsonProperty for naming                                                      │
│  • @JsonIgnore for hiding                                                        │
│  • @JsonFormat for dates                                                         │
│                                                                                  │
│  CONNECTIONS                                                                     │
│  • Connection creation is EXPENSIVE                                              │
│  • Pool reuses connections                                                       │
│  • Don't leak connections (use try-with-resources)                               │
│                                                                                  │
│  CLASSLOADING                                                                    │
│  • Parent delegation: ask parent first                                           │
│  • Different classloader = different class!                                      │
│                                                                                  │
│  BUILD TOOLS                                                                     │
│  • Lifecycle phases run in order                                                 │
│  • Scopes control when dependency is available                                   │
│  • Transitive = dependencies of dependencies                                     │
│                                                                                  │
│  TYPE ERASURE                                                                    │
│  • Generics erased at runtime                                                    │
│  • Use TypeReference for Jackson                                                 │
│  • Can't do: new T() or instanceof List<String>                                  │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

# 🎯 INTERVIEW QUESTIONS ON HIDDEN FOUNDATIONS

1. **How does @Autowired work internally?**
   → Reflection: finds field, makes accessible, sets value

2. **Why doesn't @Transactional work on private methods?**
   → CGLIB subclasses, can't override private

3. **What's the difference between Filter and Interceptor?**
   → Filter: Servlet level, raw request/response
   → Interceptor: Spring MVC level, handler info

4. **Why does self-invocation bypass @Transactional?**
   → `this` refers to real object, not proxy

5. **How does Jackson know to serialize getName() as "name"?**
   → Reflection + convention (removes "get", lowercases)

6. **Why is connection pooling important?**
   → Connection creation: 50-200ms overhead per connection

7. **What is type erasure?**
   → Generic types removed at runtime

8. **How does Spring Data generate repository implementations?**
   → JDK Proxy + method name parsing + query generation

---

_This foundation makes Spring LOGICAL instead of MAGICAL!_

---

> **Navigation**: [< Previous](Ch26_Pre_Spring_Part1.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](Ch21_AlgoEng_Advanced.md)
