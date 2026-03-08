# 52. Java ClassLoader, JDBC & Logging — The Infrastructure Layer

> **Navigation**: [< Generics & Exceptions](51_Java_Generics_Exceptions_Deep.md) | [Back to Index](../00_MASTER_INDEX.md)

---

## PART 1: CLASSLOADER — How Java Finds & Loads Classes

---

## 🎯 The 5W1H

```
╔══════════════════════════════════════════════════════════════════╗
║  WHAT = ClassLoader reads .class files (bytecode) and converts  ║
║         them into Class<?> objects that the JVM can use          ║
║                                                                  ║
║  WHY  = JVM doesn't load ALL classes at startup — it loads them  ║
║         ON DEMAND when first referenced. ClassLoader decides     ║
║         WHERE to find each class.                                ║
║                                                                  ║
║  WHEN = Every time you use 'new', access a static method,       ║
║         or reference a class for the first time                  ║
║                                                                  ║
║  HOW  = Delegation model: child asks parent first                ║
╚══════════════════════════════════════════════════════════════════╝
```

---

## 1. The Three ClassLoaders

```
┌─────────────────────────────────────────────────┐
│         Bootstrap ClassLoader (Native C++)       │
│         Loads: java.lang.*, java.util.*          │
│         From: rt.jar / java.base module          │
│                       ↑                          │
│         ┌─────────────┴──────────────┐           │
│         │ Platform ClassLoader        │           │
│         │ (was Extension ClassLoader) │           │
│         │ Loads: javax.*, java.sql.*  │           │
│         │ From: jre/lib/ext           │           │
│         └─────────────┬──────────────┘           │
│                       ↑                          │
│         ┌─────────────┴──────────────┐           │
│         │ Application ClassLoader     │           │
│         │ (System ClassLoader)        │           │
│         │ Loads: YOUR classes          │           │
│         │ From: classpath (-cp)       │           │
│         └────────────────────────────┘           │
└─────────────────────────────────────────────────┘
```

```java
// See which ClassLoader loaded a class
System.out.println(String.class.getClassLoader());
// null — Bootstrap (native, not a Java object)

System.out.println(java.sql.Connection.class.getClassLoader());
// PlatformClassLoader

System.out.println(MyApp.class.getClassLoader());
// AppClassLoader
```

---

## 2. Delegation Model — Parent-First

```
When Application ClassLoader needs to load "com.myapp.User":

Step 1: App asks Platform: "Do you have com.myapp.User?"
Step 2: Platform asks Bootstrap: "Do you have com.myapp.User?"
Step 3: Bootstrap: "No, I only have java.lang.*, java.util.*, etc."
Step 4: Platform: "No, I only have javax.*, etc."
Step 5: App: "I'll look in the classpath... Found it!"

WHY parent-first?
→ Security: You can't create a fake java.lang.String
→ Your String class will NEVER be loaded because Bootstrap always wins
→ Core classes are always the real ones
```

```java
// Class loading lifecycle
// Loading → Linking (Verify → Prepare → Resolve) → Initialization

// 1. LOADING: Read bytecode from .class file
// 2. VERIFY: Check bytecode is valid (no stack overflow tricks, etc.)
// 3. PREPARE: Allocate memory for static fields (set to defaults)
// 4. RESOLVE: Replace symbolic references with direct references
// 5. INITIALIZE: Run static initializers and static blocks
```

---

## 3. Custom ClassLoader — Practical Use

```java
// Why build one? Plugin systems, hot-reload, encryption, isolation

public class PluginClassLoader extends ClassLoader {
    private final Path pluginDir;
    
    public PluginClassLoader(Path pluginDir, ClassLoader parent) {
        super(parent);
        this.pluginDir = pluginDir;
    }
    
    @Override
    protected Class<?> findClass(String name) throws ClassNotFoundException {
        try {
            String fileName = name.replace('.', '/') + ".class";
            Path classFile = pluginDir.resolve(fileName);
            byte[] bytes = Files.readAllBytes(classFile);
            return defineClass(name, bytes, 0, bytes.length);
        } catch (IOException e) {
            throw new ClassNotFoundException("Could not load: " + name, e);
        }
    }
}

// Usage — load plugin at runtime
PluginClassLoader loader = new PluginClassLoader(Path.of("/plugins"), 
    ClassLoader.getSystemClassLoader());
Class<?> pluginClass = loader.loadClass("com.plugin.MyPlugin");
Object plugin = pluginClass.getDeclaredConstructor().newInstance();
```

---

## 4. Class.forName vs ClassLoader.loadClass

```java
// Class.forName — LOADS and INITIALIZES the class
Class<?> clazz = Class.forName("com.mysql.cj.jdbc.Driver");
// Static blocks run immediately!

// ClassLoader.loadClass — LOADS but does NOT initialize
Class<?> clazz = ClassLoader.getSystemClassLoader()
    .loadClass("com.mysql.cj.jdbc.Driver");
// Static blocks do NOT run until first use

// This matters for JDBC drivers:
// Old way: Class.forName("com.mysql.cj.jdbc.Driver");
// Modern: Not needed! ServiceLoader auto-discovers drivers via META-INF/services
```

---

## PART 2: JDBC — Database Access Internals

---

## 5. JDBC Architecture

```
┌─────────────────────────────────────────────────┐
│              Your Java Application               │
│                     ↓                            │
│            JDBC API (java.sql.*)                 │
│       Connection, Statement, ResultSet           │
│                     ↓                            │
│           JDBC Driver Manager                    │
│                     ↓                            │
│         ┌───────────┼───────────┐                │
│    MySQL Driver  PostgreSQL   Oracle             │
│    (Type 4)      Driver       Driver             │
│         ↓           ↓           ↓                │
│    MySQL DB    PostgreSQL    Oracle DB            │
└─────────────────────────────────────────────────┘

Type 4 Driver (most common):
  Pure Java → directly converts JDBC calls to database protocol
  No native code needed
  Example: mysql-connector-j, postgresql driver
```

---

## 6. Connection, Statement, ResultSet — The Core Three

```java
// The basic JDBC pattern (always use try-with-resources!)
String url = "jdbc:mysql://localhost:3306/mydb";
String sql = "SELECT id, name, email FROM users WHERE status = ?";

try (
    Connection conn = DriverManager.getConnection(url, "user", "pass");
    PreparedStatement ps = conn.prepareStatement(sql)
) {
    ps.setString(1, "ACTIVE");  // Parameter index starts at 1!
    
    try (ResultSet rs = ps.executeQuery()) {
        while (rs.next()) {
            long id = rs.getLong("id");
            String name = rs.getString("name");
            String email = rs.getString("email");
        }
    }
}
// All three resources auto-closed in reverse order
```

### Statement vs PreparedStatement vs CallableStatement

```
┌──────────────────────────────────────────────────────────────┐
│ Statement           │ Plain SQL, no parameters               │
│                     │ ❌ SQL INJECTION risk!                  │
│                     │ Use only for DDL or admin tasks         │
│─────────────────────│────────────────────────────────────────│
│ PreparedStatement   │ Parameterized SQL with ?               │
│                     │ ✅ SQL injection safe (params are data) │
│                     │ ✅ Precompiled — faster for repeated use│
│                     │ USE THIS 99% OF THE TIME               │
│─────────────────────│────────────────────────────────────────│
│ CallableStatement   │ Calls stored procedures                │
│                     │ {call procedure_name(?, ?)}            │
└──────────────────────────────────────────────────────────────┘
```

### SQL Injection — Why PreparedStatement Matters

```java
// ❌ DANGEROUS — Statement with string concatenation
String name = userInput;  // User types: ' OR '1'='1
String sql = "SELECT * FROM users WHERE name = '" + name + "'";
// Becomes: SELECT * FROM users WHERE name = '' OR '1'='1'
// Returns ALL users!

// ✅ SAFE — PreparedStatement with parameter binding
String sql = "SELECT * FROM users WHERE name = ?";
PreparedStatement ps = conn.prepareStatement(sql);
ps.setString(1, name);
// The ? is replaced with the escaped value — SQL injection impossible
// The database sees the input as DATA, never as SQL code
```

---

## 7. Connection Pooling — Why and How

```
Without pool:
Request 1 → Open connection → Query → Close connection (200ms overhead!)
Request 2 → Open connection → Query → Close connection (200ms overhead!)

With pool:
┌──────────────────────────────────┐
│        Connection Pool           │
│   ┌────┐ ┌────┐ ┌────┐ ┌────┐  │
│   │Conn│ │Conn│ │Conn│ │Conn│  │  ←  Pre-created, reused
│   │ 1  │ │ 2  │ │ 3  │ │ 4  │  │
│   └────┘ └────┘ └────┘ └────┘  │
└──────────────────────────────────┘
Request 1 → Borrow Conn → Query → Return Conn (< 1ms overhead)
Request 2 → Borrow Conn → Query → Return Conn (< 1ms overhead)
```

```java
// HikariCP — the fastest connection pool (Spring Boot default)
// application.properties
// spring.datasource.url=jdbc:mysql://localhost:3306/mydb
// spring.datasource.hikari.maximum-pool-size=10
// spring.datasource.hikari.minimum-idle=5
// spring.datasource.hikari.connection-timeout=30000
// spring.datasource.hikari.idle-timeout=600000

// Manual HikariCP setup
HikariConfig config = new HikariConfig();
config.setJdbcUrl("jdbc:mysql://localhost:3306/mydb");
config.setUsername("user");
config.setPassword("pass");
config.setMaximumPoolSize(10);
config.setMinimumIdle(5);

HikariDataSource ds = new HikariDataSource(config);

try (Connection conn = ds.getConnection()) {  // Borrows from pool
    // ... use connection
}  // Returns to pool (NOT closed!)
```

---

## 8. Batch Operations & Fetch Size

```java
// Batch INSERT — single round-trip for multiple rows
String sql = "INSERT INTO users (name, email) VALUES (?, ?)";
try (PreparedStatement ps = conn.prepareStatement(sql)) {
    conn.setAutoCommit(false);  // Start transaction
    
    for (User user : users) {
        ps.setString(1, user.getName());
        ps.setString(2, user.getEmail());
        ps.addBatch();
        
        if (users.indexOf(user) % 1000 == 0) {
            ps.executeBatch();  // Execute in chunks of 1000
            ps.clearBatch();
        }
    }
    ps.executeBatch();  // Execute remaining
    conn.commit();
}

// Fetch size — control how many rows are fetched per network round-trip
PreparedStatement ps = conn.prepareStatement(sql);
ps.setFetchSize(100);  // Fetch 100 rows at a time instead of ALL at once
// Important for large result sets — prevents OutOfMemoryError
```

---

## 9. Transaction Management

```java
// Manual transaction
Connection conn = dataSource.getConnection();
try {
    conn.setAutoCommit(false);  // Start transaction
    
    // Multiple operations as ONE atomic unit
    transferMoney(conn, fromAccount, toAccount, amount);
    logTransaction(conn, fromAccount, toAccount, amount);
    
    conn.commit();  // All succeed → commit
} catch (Exception e) {
    conn.rollback();  // Any failure → undo ALL changes
    throw e;
} finally {
    conn.setAutoCommit(true);
    conn.close();
}

// Spring's @Transactional does all of this automatically:
@Transactional
public void transfer(Long from, Long to, BigDecimal amount) {
    accountRepo.debit(from, amount);   // If this throws...
    accountRepo.credit(to, amount);    // ...this won't execute, and debit is rolled back
}
```

---

## PART 3: LOGGING — The Observability Foundation

---

## 10. Logging Landscape

```
┌─────────────────────────────────────────────────────────────────┐
│                   Logging APIs (Facades)                         │
│            ┌──────────────────────────────┐                      │
│            │        SLF4J                  │  ←  Standard facade  │
│            │  (Simple Logging Facade       │     Use THIS API     │
│            │   for Java)                   │                      │
│            └──────────┬───────────────────┘                      │
│                       │ binds to                                  │
│            ┌──────────┴───────────────────┐                      │
│            ↓              ↓               ↓                      │
│        Logback        Log4j2       java.util.logging             │
│     (Default in     (Apache,       (Built-in,                    │
│      Spring Boot)    powerful)      basic)                        │
│                                                                   │
│  RULE: Code against SLF4J API                                    │
│        Swap implementation without changing code                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 11. SLF4J + Logback — The Standard

```java
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class UserService {
    // One logger per class — static final
    private static final Logger log = LoggerFactory.getLogger(UserService.class);
    
    public User findById(Long id) {
        log.debug("Looking up user with id: {}", id);
        
        User user = repository.findById(id).orElse(null);
        
        if (user == null) {
            log.warn("User not found: {}", id);
            throw new ResourceNotFoundException("User", id);
        }
        
        log.info("Found user: {} ({})", user.getName(), user.getEmail());
        return user;
    }
    
    public void processOrder(Order order) {
        log.info("Processing order: {}", order.getId());
        try {
            // ... process
            log.info("Order {} processed successfully", order.getId());
        } catch (Exception e) {
            // Exception as LAST argument — SLF4J prints full stack trace
            log.error("Failed to process order: {}", order.getId(), e);
            throw e;
        }
    }
}

// With Lombok — even simpler
@Slf4j
public class UserService {
    // log variable is auto-generated
    public void doSomething() {
        log.info("Doing something");
    }
}
```

---

## 12. Log Levels — When to Use Each

```
┌───────┬──────────────────────────────────────────────────────┐
│ Level │ When to Use                                          │
├───────┼──────────────────────────────────────────────────────┤
│ TRACE │ Very detailed flow info. Method entry/exit.          │
│       │ Almost never enabled in production.                  │
├───────┼──────────────────────────────────────────────────────┤
│ DEBUG │ Diagnostic information for developers.               │
│       │ Variable values, SQL queries, cache hits/misses.     │
│       │ Enabled in dev, disabled in production.              │
├───────┼──────────────────────────────────────────────────────┤
│ INFO  │ Business events and milestones.                      │
│       │ "User registered", "Order processed", App started.   │
│       │ DEFAULT level in production.                         │
├───────┼──────────────────────────────────────────────────────┤
│ WARN  │ Potential issues that don't stop the app.            │
│       │ Deprecated API used, retry succeeded after failure.  │
│       │ "Something looks wrong but we recovered."            │
├───────┼──────────────────────────────────────────────────────┤
│ ERROR │ Something FAILED and needs attention.                │
│       │ Unhandled exceptions, failed operations.             │
│       │ Always include the exception object.                 │
└───────┴──────────────────────────────────────────────────────┘

Level hierarchy: TRACE < DEBUG < INFO < WARN < ERROR
Setting level to INFO means: INFO, WARN, ERROR are logged
                             TRACE, DEBUG are suppressed
```

---

## 13. Logback Configuration

```xml
<!-- logback-spring.xml (Spring Boot) or logback.xml -->
<configuration>
    
    <!-- Console output -->
    <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
        <encoder>
            <pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
    </appender>
    
    <!-- File output with daily rotation -->
    <appender name="FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
        <file>logs/app.log</file>
        <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
            <fileNamePattern>logs/app.%d{yyyy-MM-dd}.log</fileNamePattern>
            <maxHistory>30</maxHistory>  <!-- Keep 30 days -->
            <totalSizeCap>1GB</totalSizeCap>
        </rollingPolicy>
        <encoder>
            <pattern>%d{ISO8601} [%thread] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
    </appender>
    
    <!-- Package-specific levels -->
    <logger name="com.myapp" level="DEBUG"/>
    <logger name="org.springframework" level="INFO"/>
    <logger name="org.hibernate.SQL" level="DEBUG"/>
    
    <!-- Root level -->
    <root level="INFO">
        <appender-ref ref="CONSOLE"/>
        <appender-ref ref="FILE"/>
    </root>
    
</configuration>
```

```
Pattern symbols:
%d    = Date/time
%thread = Thread name
%-5level = Level, left-padded to 5 chars
%logger{36} = Logger name, max 36 chars
%msg  = The log message
%n    = Newline
%X{key} = MDC value (see below)
```

---

## 14. MDC — Mapped Diagnostic Context

```java
// MDC adds context (like request ID) to ALL log messages in a thread

// Filter that sets MDC for every request
@Component
public class RequestIdFilter implements Filter {
    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {
        String requestId = UUID.randomUUID().toString().substring(0, 8);
        MDC.put("requestId", requestId);
        MDC.put("userId", getCurrentUserId());
        try {
            chain.doFilter(req, res);
        } finally {
            MDC.clear();  // ALWAYS clear — threads are reused!
        }
    }
}

// Logback pattern includes MDC:
// %d [%thread] [%X{requestId}] [%X{userId}] %-5level %logger - %msg%n

// Output:
// 2024-01-15 10:30:00 [http-nio-8080-exec-1] [a1b2c3d4] [user42] INFO UserService - Found user
// 2024-01-15 10:30:01 [http-nio-8080-exec-1] [a1b2c3d4] [user42] INFO OrderService - Processing order

// Now you can grep ALL logs for one request: grep "a1b2c3d4" app.log
```

---

## 15. Structured JSON Logging — Production Standard

```xml
<!-- Logback with JSON output (for ELK/Splunk/CloudWatch) -->
<!-- Add dependency: logstash-logback-encoder -->
<appender name="JSON" class="ch.qos.logback.core.ConsoleAppender">
    <encoder class="net.logstash.logback.encoder.LogstashEncoder">
        <includeMdcKeyName>requestId</includeMdcKeyName>
        <includeMdcKeyName>userId</includeMdcKeyName>
    </encoder>
</appender>

<!-- Output:
{
  "@timestamp": "2024-01-15T10:30:00.123Z",
  "level": "INFO",
  "thread": "http-nio-8080-exec-1",
  "logger": "com.myapp.UserService",
  "message": "Found user: Harsha",
  "requestId": "a1b2c3d4",
  "userId": "user42"
}
-->
```

---

## 16. Logging Best Practices

```java
// ✅ DO: Use parameterized messages — SLF4J evaluates ONLY if level is enabled
log.debug("User {} has {} orders", userId, orderCount);

// ❌ DON'T: String concatenation — always evaluated even if debug is off
log.debug("User " + userId + " has " + orderCount + " orders");

// ✅ DO: Log exception as last argument
log.error("Payment failed for order: {}", orderId, exception);

// ❌ DON'T: Swallow the stack trace
log.error("Payment failed: " + exception.getMessage());

// ✅ DO: Check level for expensive operations
if (log.isDebugEnabled()) {
    log.debug("Full request body: {}", objectMapper.writeValueAsString(request));
}

// ❌ DON'T: Log sensitive data
log.info("User login: {} password: {}", email, password);  // NEVER!

// ✅ DO: Log at the right level
log.info("User registered: {}", email);     // Business event
log.debug("Cache hit for key: {}", key);    // Diagnostic
log.warn("Retry attempt {} of {}", i, max); // Potential issue
log.error("Failed to send email", ex);      // Failure
```

---

## 17. Quick Reference — All Three Combined

```
ClassLoader Chain:
  Bootstrap → Platform → Application → Custom
  Parent-first delegation = security + consistency

JDBC Essentials:
  ALWAYS use PreparedStatement (SQL injection protection)
  ALWAYS use try-with-resources (Connection, Statement, ResultSet)
  ALWAYS use connection pooling (HikariCP) in production
  ALWAYS use @Transactional in Spring (not manual commits)

Logging Rules:
  API: SLF4J (facade) + Logback (implementation)
  Levels: ERROR > WARN > INFO > DEBUG > TRACE
  Pattern: log.info("msg {}", param)  — NOT string concatenation
  MDC: Add requestId for tracing across services
  Production: JSON structured logging for search/aggregation
```

---

## 18. Interview Questions & Answers

**Q: Explain the ClassLoader delegation model.**
> When a class needs loading, the Application ClassLoader delegates to Platform, which delegates to Bootstrap. Only if the parent can't find it does the child try. This prevents overriding core Java classes — security guarantee.

**Q: Why must you use PreparedStatement instead of Statement?**
> PreparedStatement prevents SQL injection by sending query structure and data separately. The database treats parameters as data, never as executable SQL. It's also faster for repeated queries because the execution plan is cached.

**Q: What's the difference between SLF4J and Logback?**
> SLF4J is the API (facade) — you code against it. Logback is one implementation. You can swap Logback for Log4j2 without changing any application code, only the dependency and config file.

**Q: What is MDC and why is it important?**
> Mapped Diagnostic Context stores per-thread key-value pairs (like request ID, user ID) that appear in every log line. Essential for tracing a single request across multiple service classes. Always clear MDC in a finally block because threads are reused.

**Q: How does connection pooling work?**
> A pool pre-creates database connections and keeps them alive. When code needs a connection, it borrows one from the pool and returns it when done (close() returns to pool, doesn't actually close). This eliminates the 200ms+ overhead of establishing a new TCP connection + authentication for every query.

---

> **Key Takeaway**: ClassLoaders enforce Java's security model through parent-first 
> delegation. JDBC's PreparedStatement is non-negotiable for SQL injection protection. 
> SLF4J + Logback + MDC + JSON logging form the observability foundation for 
> any production Java application.

> **Navigation**: [< Generics & Exceptions](51_Java_Generics_Exceptions_Deep.md) | [Back to Index](../00_MASTER_INDEX.md)
