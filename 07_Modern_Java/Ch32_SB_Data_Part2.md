**Navigation**: [< Previous](Ch31_SB_Core_Part1.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](Ch33_SB_Web_Part3.md)

# 🌱 SPRING BOOT COMPLETE GUIDE - Part 2: Spring Core (IoC & DI)

**The Heart of Spring - Dependency Injection**
_"Once you understand IoC, everything in Spring makes sense"_

---

# 🎯 WHY-HOW-WHEN-WHICH FRAMEWORK

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  WHY: Why IoC & DI are Foundation of Spring?                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│  • IoC IS Spring: Without it, there's no automatic wiring                       │
│  • Testability: Mock dependencies easily for unit testing                       │
│  • Loose coupling: Change implementations without changing classes              │
│  • Interview must-know: "Explain @Autowired" asked in every interview           │
│  • Configuration flexibility: Switch beans via profiles, conditions             │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│  HOW: How DI Works in Spring?                                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│  • IoC Container: ApplicationContext creates and manages beans                  │
│  • Component Scanning: @Component/@Service/@Repository auto-detected            │
│  • Constructor Injection: Preferred - immutable, testable                       │
│  • Field Injection: @Autowired on fields - avoid (hard to test)                 │
│  • @Qualifier/@Primary: Resolve multiple implementations of same type           │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│  WHEN: When to Use Each Bean Scope?                                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│  • Singleton (default): Stateless services, repositories - most common          │
│  • Prototype: Stateful beans, each injection gets new instance                  │
│  • Request: Per HTTP request - user context, request data                       │
│  • Session: Per user session - shopping cart, user preferences                  │
│  • Application: Shared across entire app - config, global state                 │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│  WHICH: Which DI Concepts to Master?                                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ESSENTIAL:     Constructor injection, @Component, @Service, @Autowired         │
│  IMPORTANT:     Bean scopes, @Qualifier, @Primary, @Configuration               │
│  ADVANCED:      Circular dependency resolution, custom BeanPostProcessors       │
└─────────────────────────────────────────────────────────────────────────────────┘
```


---

# TIER 2: SPRING CORE (IoC & DI)

---

## Chapter 1: Inversion of Control (IoC) - The Philosophy

### 🔵 WHY: The Problem IoC Solves



🔬 **Section Challenge — Chapter 1: Inversion of Control (IoC) - The Philosophy**

**Challenge 1 (Reasoning):** You are writing a query to find users by email: `findByEmail(String email)`. Why is this inherently vulnerable to SQL injection if implemented using native JDBC string concatenation, but completely safe in Spring Data JPA?
<details><summary>Answer</summary>

Prepared Statements. If you concatenate strings (`"SELECT * FROM users WHERE email = '" + email + "'"`), a malicious user can input `' OR 1=1; DROP TABLE users;--` and execute arbitrary SQL. Spring Data JPA automatically compiles the query into a JDBC `PreparedStatement` with bind parameters (`WHERE email = ?`). The database treats the input strictly as literal string data, not executable code, making SQL injection impossible.
</details>


## The Problem: Tight Coupling

WITHOUT IoC (Traditional approach):
public class OrderService {
// OrderService CREATES its dependencies
private UserRepository userRepo = new MySQLUserRepository();
private EmailService email = new SMTPEmailService("smtp.gmail.com");
private PaymentGateway payment = new StripePaymentGateway("sk_xxx");
public void processOrder(Order order) {
// Business logic using hardcoded implementations
}
}

**Problems**:
- ❌ Can't unit test (stuck with real database, real email)
- ❌ Can't switch implementations (MySQL → PostgreSQL = rewrite!)
- ❌ Configuration scattered everywhere (API keys in code!)
- ❌ Every class manages its own dependencies (circular dependencies!)
WITH IoC (Spring approach):
public class OrderService {
// Dependencies are INJECTED (someone else provides them)
private final UserRepository userRepo;
private final EmailService email;
private final PaymentGateway payment;
public OrderService(UserRepository userRepo,
EmailService email,
PaymentGateway payment) {
this.userRepo = userRepo;
this.email = email;
this.payment = payment;
}
}

**Benefits**:
- ✅ Easy unit testing (inject mocks!)
- ✅ Switch implementations without changing code
- ✅ Centralized configuration (application.yml)
- ✅ IoC Container manages object lifecycle

### The Hollywood Principle

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    "DON'T CALL US, WE'LL CALL YOU"                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  TRADITIONAL CONTROL:                                                           │
│  ──────────────────────                                                         │
│                                                                                 │
│  ┌──────────────┐                                                               │
│  │ OrderService │                                                               │
│  │              │──creates──► MySQLUserRepository                               │
│  │              │──creates──► SMTPEmailService                                  │
│  │              │──creates──► StripePaymentGateway                              │
│  └──────────────┘                                                               │
│                                                                                 │
│  OrderService is in CONTROL (creates its dependencies)                          │
│                                                                                 │
│  ═══════════════════════════════════════════════════════════════════════════    │
│                                                                                 │
│  INVERTED CONTROL (IoC):                                                        │
│  ───────────────────────                                                        │
│                                                                                 │
│  ┌──────────────────────────────────────────────────────┐                       │
│  │              SPRING IoC CONTAINER                     │                      │
│  │                                                       │                      │
│  │  1. Creates OrderService                             │                       │
│  │  2. Creates UserRepository                           │                       │
│  │  3. Creates EmailService                             │                       │
│  │  4. Creates PaymentGateway                           │                       │
│  │  5. INJECTS dependencies into OrderService           │                       │
│  │                                                       │                      │
│  └──────────────────────────────────────────────────────┘                       │
│                       │                                                         │
│                       ▼                                                         │
│  ┌──────────────┐                                                               │
│  │ OrderService │ ← receives dependencies (didn't ask for specific impls)       │
│  └──────────────┘                                                               │
│                                                                                 │
│  Control is INVERTED: Container controls object creation & wiring               │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```


### IoC Container Resolution — Step-by-Step Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│              IoC CONTAINER BEAN RESOLUTION PROCESS                              │
│                                                                                 │
│  PHASE 1: COMPONENT SCANNING                                                    │
│  ──────────────────────────────────────                                         │
│  Classpath scan → find @Component, @Service, @Repository, @Controller           │
│                                                                                 │
│       @Service            @Repository           @Controller                     │
│    OrderService          OrderRepo             OrderController                  │
│         │                    │                       │                          │
│         ▼                    ▼                       ▼                          │
│                                                                                 │
│  PHASE 2: BeanDefinition CREATION                                               │
│  ──────────────────────────────────────                                         │
│  Each class → BeanDefinition object (metadata about the bean)                   │
│                                                                                 │
│    BeanDefinition {                                                             │
│      name: "orderService"                                                       │
│      class: OrderService.class                                                  │
│      scope: SINGLETON                                                           │
│      dependencies: [OrderRepo, NotificationService]                             │
│    }                                                                            │
│                                                                                 │
│  PHASE 3: DEPENDENCY GRAPH CONSTRUCTION                                         │
│  ──────────────────────────────────────                                         │
│  Container builds a directed graph of who-needs-whom:                           │
│                                                                                 │
│    OrderController ──depends──▶ OrderService                                    │
│                                    │                                            │
│                          ┌─────────┴──────────┐                                 │
│                          ▼                     ▼                                │
│                      OrderRepo        NotificationService                       │
│                          │                     │                                │
│                          ▼                     ▼                                │
│                      DataSource           EmailClient                           │
│                                                                                 │
│  PHASE 4: CREATION ORDER (Topological Sort)                                     │
│  ──────────────────────────────────────                                         │
│  Leaves first → dependents last:                                                │
│                                                                                 │
│    Step 1: DataSource        (no deps)                                          │
│    Step 2: EmailClient       (no deps)                                          │
│    Step 3: OrderRepo         (needs DataSource ✅)                               │
│    Step 4: NotificationService (needs EmailClient ✅)                            │
│    Step 5: OrderService      (needs OrderRepo ✅ + NotificationService ✅)        │
│    Step 6: OrderController   (needs OrderService ✅)                             │
│                                                                                 │
│  PHASE 5: INJECTION                                                             │
│  ──────────────────────────────────────                                         │
│  Container injects references into constructor / fields:                        │
│                                                                                 │
│    new OrderController(                                                         │
│        container.getBean(OrderService.class)  ← already created                 │
│    )                                                                            │
│                                                                                 │
│  ⚠️  CIRCULAR DEPENDENCY?                                                       │
│  A → B → A  ═══▶  Spring throws BeanCurrentlyInCreationException                │
│  Fix: @Lazy on one side, or redesign (extract shared logic)                     │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```


---



🔬 **Section Challenge — The Problem: Tight Coupling**

**Challenge 1 (Reasoning):** You are writing a query to find users by email: `findByEmail(String email)`. Why is this inherently vulnerable to SQL injection if implemented using native JDBC string concatenation, but completely safe in Spring Data JPA?
<details><summary>Answer</summary>

Prepared Statements. If you concatenate strings (`"SELECT * FROM users WHERE email = '" + email + "'"`), a malicious user can input `' OR 1=1; DROP TABLE users;--` and execute arbitrary SQL. Spring Data JPA automatically compiles the query into a JDBC `PreparedStatement` with bind parameters (`WHERE email = ?`). The database treats the input strictly as literal string data, not executable code, making SQL injection impossible.
</details>


## Chapter 2: Spring Beans - The Building Blocks

### 🔵 WHAT: What is a Spring Bean?



🔬 **Section Challenge — Chapter 2: Spring Beans - The Building Blocks**

**Challenge 1 (Reasoning):** You are writing a query to find users by email: `findByEmail(String email)`. Why is this inherently vulnerable to SQL injection if implemented using native JDBC string concatenation, but completely safe in Spring Data JPA?
<details><summary>Answer</summary>

Prepared Statements. If you concatenate strings (`"SELECT * FROM users WHERE email = '" + email + "'"`), a malicious user can input `' OR 1=1; DROP TABLE users;--` and execute arbitrary SQL. Spring Data JPA automatically compiles the query into a JDBC `PreparedStatement` with bind parameters (`WHERE email = ?`). The database treats the input strictly as literal string data, not executable code, making SQL injection impossible.
</details>


## Spring Bean Definition

A Spring Bean is simply an object that is:
1. Created by the Spring IoC Container
2. Configured by Spring (dependencies injected)
3. Managed by Spring (lifecycle, scope)

**Plain Java Object**:
User user = new User();  // You create it, you manage it

**Spring Bean**:
@Component
public class UserService { ... }  // Spring creates and manages it

💡 **KEY INSIGHT:**
Spring Beans are the objects that live in Spring's ApplicationContext
The container is a big Map<BeanName, Object> (simplified)

### Ways to Define Beans

```java
// ═══════════════════════════════════════════════════════════════════════════════
// METHOD 1: @Component and stereotypes (Most common)
// ═══════════════════════════════════════════════════════════════════════════════

@Component  // Generic component
public class MyComponent { }

@Service    // Business logic (same as @Component, semantic meaning)
public class UserService { }

@Repository // Data access (adds exception translation)
public class UserRepository { }

@Controller // Web controller (handles HTTP requests)
public class UserController { }

@RestController // @Controller + @ResponseBody (returns JSON)
public class UserApiController { }

/*
 * HIERARCHY:
 * @Component (parent)
 *   └── @Service     (business logic)
 *   └── @Repository  (data access + exception translation)
 *   └── @Controller  (web layer)
 */


// ═══════════════════════════════════════════════════════════════════════════════
// METHOD 2: @Bean in @Configuration (For 3rd party classes, custom setup)
// ═══════════════════════════════════════════════════════════════════════════════

@Configuration
public class AppConfig {

    // Can't add @Component to RestTemplate (it's a library class)
    @Bean
    public RestTemplate restTemplate() {
        RestTemplate template = new RestTemplate();
        template.setConnectTimeout(Duration.ofSeconds(5));
        return template;
    }

    // Multiple beans of same type
    @Bean("mysqlDataSource")
    public DataSource mysqlDataSource() {
        return new HikariDataSource(mysqlConfig());
    }

    @Bean("postgresDataSource")
    public DataSource postgresDataSource() {
        return new HikariDataSource(postgresConfig());
    }

    // Bean with dependencies (Spring provides them)
    @Bean
    public UserService userService(UserRepository repo, EmailService email) {
        return new UserService(repo, email);  // Manual construction
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// METHOD 3: @Import (Programmatic registration)
// ═══════════════════════════════════════════════════════════════════════════════

@Configuration
@Import({SecurityConfig.class, DatabaseConfig.class})
public class AppConfig { }

// ═══════════════════════════════════════════════════════════════════════════════
// METHOD 4: XML Configuration (Legacy, rarely used now)
// ═══════════════════════════════════════════════════════════════════════════════

// beans.xml
<bean id="userService" class="com.example.UserService">
    <constructor-arg ref="userRepository"/>
</bean>
```

---



🔬 **Section Challenge — Spring Bean Definition**

**Challenge 1 (Reasoning):** You are writing a query to find users by email: `findByEmail(String email)`. Why is this inherently vulnerable to SQL injection if implemented using native JDBC string concatenation, but completely safe in Spring Data JPA?
<details><summary>Answer</summary>

Prepared Statements. If you concatenate strings (`"SELECT * FROM users WHERE email = '" + email + "'"`), a malicious user can input `' OR 1=1; DROP TABLE users;--` and execute arbitrary SQL. Spring Data JPA automatically compiles the query into a JDBC `PreparedStatement` with bind parameters (`WHERE email = ?`). The database treats the input strictly as literal string data, not executable code, making SQL injection impossible.
</details>


## Chapter 3: Dependency Injection Methods

### 🔵 WHY: Choosing the Right Injection Style

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    DEPENDENCY INJECTION TYPES COMPARISON                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌────────────────┬──────────────────┬─────────────────────────────────────────┐│
│  │ Type           │ Recommended?     │ Use Case                                ││
│  ├────────────────┼──────────────────┼─────────────────────────────────────────┤│
│  │ Constructor    │ ✅ YES (Default) │ Required dependencies                   │ │
│  │ Setter         │ ⚠️ Sometimes     │ Optional dependencies                   ││
│  │ Field          │ ❌ NO            │ Tests only (convenient but bad)         │ │
│  └────────────────┴──────────────────┴─────────────────────────────────────────┘│
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```


### 1. Constructor Injection (RECOMMENDED)

```java
@Service
public class OrderService {

    // Dependencies are FINAL (immutable after construction)
    private final UserRepository userRepo;
    private final EmailService emailService;
    private final PaymentGateway paymentGateway;

    // Single constructor = @Autowired not needed (Spring 4.3+)
    public OrderService(UserRepository userRepo,
                        EmailService emailService,
                        PaymentGateway paymentGateway) {
        this.userRepo = userRepo;
        this.emailService = emailService;
        this.paymentGateway = paymentGateway;
    }

    /*
     * WHY CONSTRUCTOR INJECTION IS BEST:
     *
     * 1. IMMUTABILITY: Dependencies can be final
     * 2. REQUIRED DEPS: Impossible to create service without dependencies
     * 3. TESTING: Easy to pass mocks in tests
     * 4. CLARITY: All dependencies visible in one place
     * 5. CIRCULAR DETECTION: Fails fast on circular dependencies
     */
}

// LOMBOK SHORTCUT (Generates constructor for final fields)
@Service
@RequiredArgsConstructor
public class OrderService {
    private final UserRepository userRepo;
    private final EmailService emailService;
    private final PaymentGateway paymentGateway;
    // No explicit constructor needed!
}
```

### 2. Setter Injection (For Optional Dependencies)

```java
@Service
public class ReportService {

    private ReportFormatter formatter;  // Optional, has default

    // Called AFTER bean construction if dependency is available
    @Autowired(required = false)  // Won't fail if not found
    public void setFormatter(ReportFormatter formatter) {
        this.formatter = formatter;
    }

    public String generate() {
        if (formatter != null) {
            return formatter.format(data);
        }
        return defaultFormat(data);  // Fallback
    }

    /*
     * WHEN TO USE SETTER INJECTION:
     *
     * 1. Optional dependencies (not required for bean to work)
     * 2. Reconfigurable dependencies (can change at runtime)
     * 3. Circular dependencies (last resort solution)
     *
     * PROBLEMS:
     * - Bean can be partially initialized
     * - Not thread-safe (can be modified after creation)
     * - Dependencies not visible in constructor
     */
}
```

### 3. Field Injection (AVOID!)

```java
@Service
public class BadService {

    @Autowired  // DON'T DO THIS IN PRODUCTION CODE!
    private UserRepository userRepo;

    @Autowired
    private EmailService emailService;

    /*
     * WHY FIELD INJECTION IS BAD:
     *
     * 1. Can't make fields final
     * 2. Hard to test (need reflection to inject mocks)
     * 3. Hides dependencies (not visible in constructor)
     * 4. Can create partially initialized objects
     * 5. Tight coupling to Spring (service can't exist without DI framework)
     *
     * ONLY ACCEPTABLE IN:
     * - Test classes (@MockBean, @InjectMocks)
     * - Quick prototypes (throw away code)
     */
}

// TESTING PROBLEM WITH FIELD INJECTION:
class BadServiceTest {
    @Test
    void test() {
        // How do I inject a mock UserRepository?
        BadService service = new BadService();  // Dependencies are null!
        // Need Spring test context or reflection - PAINFUL!
    }
}

// VS CONSTRUCTOR INJECTION:
class GoodServiceTest {
    @Test
    void test() {
        UserRepository mockRepo = mock(UserRepository.class);
        EmailService mockEmail = mock(EmailService.class);
        GoodService service = new GoodService(mockRepo, mockEmail);  // Easy!
    }
}
```

---



🔬 **Section Challenge — Chapter 3: Dependency Injection Methods**

**Challenge 1 (Reasoning):** Constructor injection vs field injection (`@Autowired` on field) — which is better and why?
<details><summary>Answer</summary>

Constructor injection is better: (1) Dependencies explicit — you can't create object without them. (2) Immutable — field can be `final`. (3) Testable — inject mocks via constructor, no Spring context needed. (4) Detects circular deps at startup, not at first use. Field injection: shorter code but: hidden dependencies, can't be `final`, requires Spring for test setup, circular deps detected late. Spring itself recommends constructor injection since v4.
</details>


## Chapter 4: Resolving Dependencies (@Qualifier, @Primary)

### 🔵 WHY: When Multiple Beans of Same Type Exist

```java
// SCENARIO: Two DataSources in the application

@Configuration
public class DataSourceConfig {

    @Bean("readDataSource")
    public DataSource readDataSource() {
        return createDataSource("jdbc:mysql://read-replica:3306/mydb");
    }

    @Bean("writeDataSource")
    public DataSource writeDataSource() {
        return createDataSource("jdbc:mysql://primary:3306/mydb");
    }
}

@Service
public class UserService {

    @Autowired
    private DataSource dataSource;  // ERROR! Which one?
    // NoUniqueBeanDefinitionException:
    // expected single matching bean but found 2: readDataSource, writeDataSource
}
```

### Solution 1: @Qualifier (Explicit Selection)

```java
@Service
public class UserService {

    private final DataSource readDataSource;
    private final DataSource writeDataSource;

    public UserService(
            @Qualifier("readDataSource") DataSource readDs,
            @Qualifier("writeDataSource") DataSource writeDs) {
        this.readDataSource = readDs;
        this.writeDataSource = writeDs;
    }
}
```

### Solution 2: @Primary (Default Selection)

```java
@Configuration
public class DataSourceConfig {

    @Bean
    @Primary  // This is the default when no @Qualifier specified
    public DataSource writeDataSource() {
        return createDataSource("jdbc:mysql://primary:3306/mydb");
    }

    @Bean
    public DataSource readDataSource() {
        return createDataSource("jdbc:mysql://read-replica:3306/mydb");
    }
}

@Service
public class UserService {

    // Gets writeDataSource (it's @Primary)
    @Autowired
    private DataSource dataSource;

    // Explicitly asks for readDataSource
    @Autowired
    @Qualifier("readDataSource")
    private DataSource readOnly;
}
```

### Solution 3: Custom Qualifier Annotations

```java
// STEP 1: Define custom qualifier
@Qualifier
@Retention(RetentionPolicy.RUNTIME)
@interface ReadOnly { }

@Qualifier
@Retention(RetentionPolicy.RUNTIME)
@interface Primary { }

// STEP 2: Use on beans
@Configuration
public class DataSourceConfig {

    @Bean
    @ReadOnly
    public DataSource readDataSource() { ... }

    @Bean
    @Primary
    public DataSource writeDataSource() { ... }
}

// STEP 3: Use on injection points
@Service
public class UserService {

    @Autowired
    @ReadOnly
    private DataSource readDataSource;
}
```

---



🔬 **Section Challenge — Chapter 4: Resolving Dependencies (@Qualifier, @Primary)**

**Challenge 1 (Reasoning):** You are writing a query to find users by email: `findByEmail(String email)`. Why is this inherently vulnerable to SQL injection if implemented using native JDBC string concatenation, but completely safe in Spring Data JPA?
<details><summary>Answer</summary>

Prepared Statements. If you concatenate strings (`"SELECT * FROM users WHERE email = '" + email + "'"`), a malicious user can input `' OR 1=1; DROP TABLE users;--` and execute arbitrary SQL. Spring Data JPA automatically compiles the query into a JDBC `PreparedStatement` with bind parameters (`WHERE email = ?`). The database treats the input strictly as literal string data, not executable code, making SQL injection impossible.
</details>


## Chapter 5: Bean Scopes

### 🔵 WHY: Understanding When Beans are Created

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    BEAN SCOPE COMPARISON                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌────────────────┬─────────────────────────────────────────────────────────┐   │
│  │ Scope          │ Description                                             │   │
│  ├────────────────┼─────────────────────────────────────────────────────────┤   │
│  │ singleton      │ One instance per container (DEFAULT)                    │   │
│  │ prototype      │ New instance every time bean is requested              │    │
│  │ request        │ One instance per HTTP request (Web only)               │    │
│  │ session        │ One instance per HTTP session (Web only)               │    │
│  │ application    │ One instance per ServletContext (Web only)             │    │
│  │ websocket      │ One instance per WebSocket session                     │    │
│  └────────────────┴─────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  95% of beans are SINGLETON!                                                    │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```


### Singleton Scope (Default)

```java
@Service  // Same as @Scope("singleton")
public class UserService {
    // ONE instance shared across entire application
    // Created when application starts
    // Lives until application shuts down

    // ⚠️ WARNING: No mutable state!
    private User currentUser;  // BAD! Shared across all requests!
}

/*
 * VISUALIZATION - Singleton Scope:
 *
 *   Application Context
 *   ┌─────────────────────────────────────────────────────────────────┐
 *   │                                                                  │
 *   │   UserService Instance (0x001)  ←──────┬──────┬──────┐         │
 *   │                                         │      │      │         │
 *   └─────────────────────────────────────────┼──────┼──────┼─────────┘
 *                                             │      │      │
 *   Request 1: orderService.userService ──────┘      │      │
 *   Request 2: cartService.userService  ─────────────┘      │
 *   Request 3: authController.userService ──────────────────┘
 *
 *   ALL point to the SAME instance!
 */
```

### Prototype Scope

```java
@Component
@Scope("prototype")
public class ShoppingCart {
    // NEW instance every time getBean("shoppingCart") is called
    // Each user needs their own cart!

    private List<Item> items = new ArrayList<>();  // OK, not shared

    public void addItem(Item item) {
        items.add(item);
    }
}

/*
 * VISUALIZATION - Prototype Scope:
 *
 *   User 1: context.getBean(ShoppingCart.class) → ShoppingCart@001
 *   User 2: context.getBean(ShoppingCart.class) → ShoppingCart@002
 *   User 3: context.getBean(ShoppingCart.class) → ShoppingCart@003
 *
 *   Each call creates NEW instance!
 *
 * ⚠️ WARNING: Spring does NOT manage lifecycle of prototype beans!
 *   - @PreDestroy won't be called
 *   - You must handle cleanup yourself
 */
```

### Request and Session Scopes (Web)

```java
@Component
@Scope(value = WebApplicationContext.SCOPE_REQUEST, proxyMode = ScopedProxyMode.TARGET_CLASS)
public class RequestContext {
    // NEW instance for each HTTP request
    // Automatically destroyed when request completes

    private String requestId;
    private Instant startTime = Instant.now();

    @PostConstruct
    public void init() {
        this.requestId = UUID.randomUUID().toString();
    }
}

@Component
@Scope(value = WebApplicationContext.SCOPE_SESSION, proxyMode = ScopedProxyMode.TARGET_CLASS)
public class ShoppingCart {
    // ONE instance per user session
    // Lives until session expires or user logs out

    private List<Item> items = new ArrayList<>();
}

/*
 * WHY proxyMode = TARGET_CLASS?
 *
 * Problem: Singleton bean autowires request-scoped bean
 *
 * @Service  // singleton
 * public class OrderService {
 *     @Autowired
 *     private RequestContext ctx;  // Which request? Bean created at startup!
 * }
 *
 * Solution: Proxy that delegates to current request's instance
 *
 * OrderService.ctx → CGLIB Proxy → Thread's RequestContext
 */
```

### Scope Mixup - The Classic Bug

```java
// PROBLEM: Singleton depends on Request-scoped bean

@Service  // Singleton (default)
public class OrderService {

    @Autowired
    private RequestContext requestContext;  // Request-scoped

    // WITHOUT proxy: requestContext is null or wrong!
    // WITH proxy (proxyMode = TARGET_CLASS): Works correctly
}

/*
 * TIMELINE:
 *
 * 1. Application starts
 * 2. OrderService created (singleton)
 * 3. RequestContext... wait, there's no HTTP request yet!
 *
 * WITHOUT PROXY:
 * - Spring injects NULL or throws error
 *
 * WITH PROXY:
 * - Spring injects a PROXY object
 * - When you call requestContext.getRequestId()
 * - Proxy looks up: "What's the current HTTP request's RequestContext?"
 * - Delegates to that instance
 */
```

---

## Chapter 6: Bean Lifecycle

### 🔵 WHY: Control Over Bean Creation and Destruction

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    COMPLETE BEAN LIFECYCLE                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                           │  │
│  │  1. INSTANTIATE: Bean instance created (constructor called)              │   │
│  │         │                                                                 │  │
│  │         ▼                                                                 │  │
│  │  2. POPULATE PROPERTIES: Dependencies injected                           │   │
│  │         │                                                                 │  │
│  │         ▼                                                                 │  │
│  │  3. BEAN NAME AWARE: setBeanName() called if implements BeanNameAware   │    │
│  │         │                                                                 │  │
│  │         ▼                                                                 │  │
│  │  4. BEAN FACTORY AWARE: setBeanFactory() if implements BeanFactoryAware │    │
│  │         │                                                                 │  │
│  │         ▼                                                                 │  │
│  │  5. APPLICATION CONTEXT AWARE: setApplicationContext() if implements    │    │
│  │         │                                                                 │  │
│  │         ▼                                                                 │  │
│  │  6. PRE-INITIALIZATION: BeanPostProcessor.postProcessBeforeInit()       │    │
│  │         │                                                                 │  │
│  │         ▼                                                                 │  │
│  │  7. INITIALIZATION: @PostConstruct or InitializingBean.afterPropertiesSet│   │
│  │         │                                                                 │  │
│  │         ▼                                                                 │  │
│  │  8. POST-INITIALIZATION: BeanPostProcessor.postProcessAfterInit()       │    │
│  │         │                                                                 │  │
│  │         ▼                                                                 │  │
│  │  ═══════════════════════════════════════════════════════════════════     │   │
│  │                     BEAN IS READY FOR USE                                 │  │
│  │  ═══════════════════════════════════════════════════════════════════     │   │
│  │         │                                                                 │  │
│  │         ▼                                                                 │  │
│  │  9. DESTRUCTION: @PreDestroy or DisposableBean.destroy()                │    │
│  │                                                                           │  │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```


### Lifecycle Callbacks in Code

```java
@Service
public class DatabaseConnectionPool implements InitializingBean, DisposableBean {

    private final DataSourceProperties properties;
    private HikariDataSource dataSource;

    // STEP 1: Constructor (instantiation)
    public DatabaseConnectionPool(DataSourceProperties properties) {
        System.out.println("1. Constructor called");
        this.properties = properties;
    }

    // STEP 2: Dependencies are injected (after constructor)
    @Autowired
    public void setMonitoringService(MonitoringService monitoring) {
        System.out.println("2. Setter injection");
    }

    // STEP 7a: @PostConstruct (after all injection)
    @PostConstruct
    public void init() {
        System.out.println("7a. @PostConstruct");
        // Initialize resources, start connections, validate config
        this.dataSource = new HikariDataSource();
        dataSource.setJdbcUrl(properties.getUrl());
    }

    // STEP 7b: InitializingBean (alternative to @PostConstruct)
    @Override
    public void afterPropertiesSet() throws Exception {
        System.out.println("7b. afterPropertiesSet()");
        // Runs AFTER @PostConstruct
    }

    // STEP 9a: @PreDestroy (on shutdown)
    @PreDestroy
    public void cleanup() {
        System.out.println("9a. @PreDestroy");
        // Close connections, flush buffers, release resources
        if (dataSource != null) {
            dataSource.close();
        }
    }

    // STEP 9b: DisposableBean (alternative to @PreDestroy)
    @Override
    public void destroy() throws Exception {
        System.out.println("9b. destroy()");
        // Runs AFTER @PreDestroy
    }
}

/*
 * Console Output:
 *
 * [STARTUP]
 * 1. Constructor called
 * 2. Setter injection
 * 7a. @PostConstruct
 * 7b. afterPropertiesSet()
 *
 * [SHUTDOWN]
 * 9a. @PreDestroy
 * 9b. destroy()
 */
```

### @PostConstruct Use Cases

```java
@Service
public class CacheService {

    private final ProductRepository productRepo;
    private Map<Long, Product> productCache;

    public CacheService(ProductRepository productRepo) {
        this.productRepo = productRepo;
        // Can't load cache here! productRepo might not be ready
        // (if it's a proxy that needs initialization)
    }

    @PostConstruct
    public void loadCache() {
        // SAFE: All dependencies are fully initialized
        this.productCache = productRepo.findAll()
            .stream()
            .collect(Collectors.toMap(Product::getId, p -> p));
        log.info("Loaded {} products into cache", productCache.size());
    }
}

@Component
public class AppStartupValidator {

    @Autowired
    private DataSource dataSource;

    @Autowired
    private Environment env;

    @PostConstruct
    public void validateConfiguration() {
        // Validate all required configuration at startup
        // Fail fast if something is wrong

        String dbUrl = env.getProperty("spring.datasource.url");
        if (dbUrl == null || !dbUrl.startsWith("jdbc:")) {
            throw new IllegalStateException("Invalid database URL!");
        }

        try (Connection conn = dataSource.getConnection()) {
            log.info("Database connection validated successfully");
        } catch (SQLException e) {
            throw new IllegalStateException("Cannot connect to database!", e);
        }
    }
}
```

### BeanPostProcessor - The Magic Behind AOP

```java
/*
 * BeanPostProcessor is how Spring implements AOP, @Transactional, etc.
 * It can modify or wrap ANY bean after creation
 */

@Component
public class LoggingBeanPostProcessor implements BeanPostProcessor {

    // Called BEFORE @PostConstruct
    @Override
    public Object postProcessBeforeInitialization(Object bean, String beanName) {
        if (bean.getClass().isAnnotationPresent(Loggable.class)) {
            log.info("Initializing @Loggable bean: {}", beanName);
        }
        return bean;  // Return the bean (or a modified version)
    }

    // Called AFTER @PostConstruct - Here's where Spring creates proxies!
    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) {
        if (bean.getClass().isAnnotationPresent(Loggable.class)) {
            // Return a PROXY that wraps the original bean
            return createLoggingProxy(bean);
        }
        return bean;
    }

    private Object createLoggingProxy(Object bean) {
        return Proxy.newProxyInstance(
            bean.getClass().getClassLoader(),
            bean.getClass().getInterfaces(),
            (proxy, method, args) -> {
                log.info("Before: {}.{}()", bean.getClass().getSimpleName(), method.getName());
                Object result = method.invoke(bean, args);
                log.info("After: {}.{}()", bean.getClass().getSimpleName(), method.getName());
                return result;
            }
        );
    }
}

/*
 * THIS IS EXACTLY HOW @Transactional WORKS!
 *
 * TransactionInterceptor wraps your bean in a proxy:
 *
 * YourService (Original)
 *        │
 *   BeanPostProcessor
 *        │
 *        ▼
 * TransactionProxy (wraps YourService)
 *   - Before method: Start transaction
 *   - Invoke original method
 *   - After method: Commit/rollback
 */
```

---

## Chapter 7: ApplicationContext - The IoC Container

### 🔵 WHAT: Where All Beans Live

```java
// ApplicationContext is the Spring IoC Container
// It holds all beans and provides DI

// Types of ApplicationContext:
// 1. AnnotationConfigApplicationContext - For @Configuration classes
// 2. ClassPathXmlApplicationContext - For XML configs (legacy)
// 3. GenericWebApplicationContext - For web applications
// 4. SpringApplication (Boot) - Creates appropriate context automatically

// Manual Context Creation (rarely needed)
public class ManualContextDemo {

    public static void main(String[] args) {
        // Create context from @Configuration classes
        ApplicationContext ctx = new AnnotationConfigApplicationContext(
            AppConfig.class,
            DatabaseConfig.class
        );

        // Get beans by type
        UserService userService = ctx.getBean(UserService.class);

        // Get beans by name
        DataSource ds = (DataSource) ctx.getBean("mysqlDataSource");

        // Get beans by type and name
        DataSource ds2 = ctx.getBean("postgresDataSource", DataSource.class);

        // Get all beans of a type
        Map<String, DataSource> allDataSources = ctx.getBeansOfType(DataSource.class);

        // Check if bean exists
        boolean exists = ctx.containsBean("userService");
    }
}
```

### Accessing ApplicationContext from Beans

```java
// METHOD 1: ApplicationContextAware (traditional)
@Component
public class MyBean implements ApplicationContextAware {

    private ApplicationContext ctx;

    @Override
    public void setApplicationContext(ApplicationContext ctx) {
        this.ctx = ctx;
    }

    public void doSomething() {
        // Can get other beans dynamically
        UserService service = ctx.getBean(UserService.class);
    }
}

// METHOD 2: @Autowired (simpler, preferred)
@Component
public class MyBean {

    @Autowired
    private ApplicationContext ctx;

    // Or via constructor
    public MyBean(ApplicationContext ctx) {
        this.ctx = ctx;
    }
}

// METHOD 3: Static Access (use with caution)
@Component
public class SpringContextHolder implements ApplicationContextAware {

    private static ApplicationContext context;

    @Override
    public void setApplicationContext(ApplicationContext ctx) {
        context = ctx;
    }

    public static <T> T getBean(Class<T> type) {
        return context.getBean(type);
    }
}

// Usage: SpringContextHolder.getBean(UserService.class)
// ⚠️ Only for places where DI is not possible (static methods, legacy code)
```

---



🔬 **Section Challenge — Chapter 7: ApplicationContext - The IoC Container**

**Challenge 1 (Reasoning):** When does React Context cause performance problems and how do you avoid them?
<details><summary>Answer</summary>

Every context consumer re-renders when ANY context value changes. If you have `{theme, user, cart}` in one context, updating cart re-renders all theme and user consumers. Fixes: (1) Split into separate contexts: `ThemeContext`, `UserContext`, `CartContext`. (2) Memoize components with `React.memo`. (3) For complex state, use a state library (Zustand, Jotai) with selector-based subscriptions — only re-render when the specific piece of state changes.
</details>


## Chapter 8: Profiles and Conditional Beans

### 🔵 WHY: Different Configurations for Different Environments

```java
@Configuration
public class DatabaseConfig {

    // DEVELOPMENT: Use H2 in-memory database
    @Bean
    @Profile("dev")
    public DataSource devDataSource() {
        return new EmbeddedDatabaseBuilder()
            .setType(EmbeddedDatabaseType.H2)
            .build();
    }

    // PRODUCTION: Use MySQL with connection pooling
    @Bean
    @Profile("prod")
    public DataSource prodDataSource(DataSourceProperties props) {
        HikariDataSource ds = new HikariDataSource();
        ds.setJdbcUrl(props.getUrl());
        ds.setUsername(props.getUsername());
        ds.setPassword(props.getPassword());
        ds.setMaximumPoolSize(20);
        return ds;
    }

    // TESTING: Mock database
    @Bean
    @Profile("test")
    public DataSource testDataSource() {
        return mock(DataSource.class);
    }
}

// Activate profile:
// 1. application.properties: spring.profiles.active=dev
// 2. Command line: java -jar app.jar --spring.profiles.active=prod
// 3. Environment variable: SPRING_PROFILES_ACTIVE=prod
// 4. Code: SpringApplication.setAdditionalProfiles("dev")
```

### @Conditional - Advanced Bean Registration

```java
// CONDITIONAL ON PROPERTY
@Bean
@ConditionalOnProperty(name = "cache.enabled", havingValue = "true")
public CacheManager cacheManager() {
    return new RedisCacheManager();
}

// CONDITIONAL ON CLASS (class exists in classpath)
@Bean
@ConditionalOnClass(name = "io.lettuce.core.RedisClient")
public RedisConnectionFactory redisConnectionFactory() {
    return new LettuceConnectionFactory();
}

// CONDITIONAL ON MISSING BEAN (only if not already defined)
@Bean
@ConditionalOnMissingBean(DataSource.class)
public DataSource defaultDataSource() {
    return new HikariDataSource();  // Fallback
}

// CONDITIONAL ON BEAN (only if another bean exists)
@Bean
@ConditionalOnBean(SecurityConfiguration.class)
public SecurityAuditLogger securityAuditLogger() {
    return new SecurityAuditLogger();
}

// CONDITIONAL ON EXPRESSION (SpEL)
@Bean
@ConditionalOnExpression("${feature.enabled:false} and ${env.production:false}")
public AdvancedFeature advancedFeature() {
    return new AdvancedFeature();
}

// CUSTOM CONDITION
public class OnLinuxCondition implements Condition {
    @Override
    public boolean matches(ConditionContext ctx, AnnotatedTypeMetadata meta) {
        return System.getProperty("os.name").toLowerCase().contains("linux");
    }
}

@Bean
@Conditional(OnLinuxCondition.class)
public FileWatcher linuxFileWatcher() {
    return new InotifyFileWatcher();
}
```

---

## Chapter 9: Events - Decoupled Communication

### 🔵 WHY: Loose Coupling Between Components

```java
// SCENARIO: After user registration, multiple things need to happen:
// - Send welcome email
// - Initialize user preferences
// - Notify admin
// - Log to analytics

// BAD: Tight coupling
@Service
public class UserService {
    private final EmailService email;
    private final PreferenceService prefs;
    private final AdminNotifier admin;
    private final AnalyticsService analytics;

    public void register(User user) {
        userRepo.save(user);
        email.sendWelcome(user);      // What if email fails? User not registered?
        prefs.initDefaults(user);
        admin.notifyNewUser(user);
        analytics.trackSignup(user);   // Adding new action = modify this service
    }
}

// GOOD: Event-driven (loose coupling)
@Service
public class UserService {
    private final ApplicationEventPublisher eventPublisher;

    public void register(User user) {
        userRepo.save(user);
        eventPublisher.publishEvent(new UserRegisteredEvent(user));
        // Done! Listeners handle the rest
    }
}
```

### Implementing Events

```java
// STEP 1: Define Event
public class UserRegisteredEvent extends ApplicationEvent {

    private final User user;

    public UserRegisteredEvent(Object source, User user) {
        super(source);
        this.user = user;
    }

    public User getUser() {
        return user;
    }
}

// Or simpler (Spring 4.2+):
public record UserRegisteredEvent(User user) { }

// STEP 2: Publish Event
@Service
public class UserService {

    private final ApplicationEventPublisher publisher;

    public void register(User user) {
        userRepo.save(user);
        publisher.publishEvent(new UserRegisteredEvent(user));
    }
}

// STEP 3: Listen to Events
@Component
public class EmailListener {

    @EventListener
    public void handleUserRegistered(UserRegisteredEvent event) {
        emailService.sendWelcome(event.user());
    }
}

@Component
public class AnalyticsListener {

    @EventListener
    public void handleUserRegistered(UserRegisteredEvent event) {
        analytics.trackSignup(event.user());
    }

    // Conditional listener (only for premium users)
    @EventListener(condition = "#event.user.isPremium()")
    public void handlePremiumRegistration(UserRegisteredEvent event) {
        analytics.trackPremiumConversion(event.user());
    }
}

// ASYNC LISTENER (non-blocking)
@Component
public class SlowProcessingListener {

    @Async
    @EventListener
    public void handleUserRegistered(UserRegisteredEvent event) {
        // This runs in separate thread
        // Won't block the registration process
        generateUserReport(event.user());
    }
}

// ORDERED LISTENERS
@Component
public class FirstListener {

    @EventListener
    @Order(1)  // Runs first
    public void handleFirst(UserRegisteredEvent event) { }
}

@Component
public class SecondListener {

    @EventListener
    @Order(2)  // Runs second
    public void handleSecond(UserRegisteredEvent event) { }
}
```

---

# 📚 Chapter 10: Circular Dependencies — Complete Guide

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        CIRCULAR DEPENDENCIES IN SPRING                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  WHAT IS A CIRCULAR DEPENDENCY?                                                 │
│  ─────────────────────────────────────────────────────────────────────────────  │
│                                                                                 │
│  Bean A depends on Bean B, and Bean B depends on Bean A                         │
│                                                                                 │
│     ┌─────────┐        needs        ┌─────────┐                                 │
│     │  BeanA  │ ──────────────────► │  BeanB  │                                 │
│     └─────────┘                      └─────────┘                                │
│          ▲                                │                                     │
│          └────────────── needs ───────────┘                                     │
│                                                                                 │
│  THE PROBLEM:                                                                   │
│  To create A, Spring needs B. But to create B, Spring needs A.                  │
│  = DEADLOCK! Neither can be created first.                                      │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│  EXAMPLE OF CIRCULAR DEPENDENCY                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤

// This code FAILS with BeanCurrentlyInCreationException

@Service
public class OrderService {
    private final PaymentService paymentService;
    
    @Autowired
    public OrderService(PaymentService paymentService) {  // Needs PaymentService
        this.paymentService = paymentService;
    }
}

@Service  
public class PaymentService {
    private final OrderService orderService;
    
    @Autowired
    public PaymentService(OrderService orderService) {  // Needs OrderService
        this.orderService = orderService;
    }
}

// Spring Boot 2.6+ throws by default:
// BeanCurrentlyInCreationException: Error creating bean 'orderService':
// Requested bean is currently in creation: Is there an unresolvable circular reference?

└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│  SOLUTIONS TO CIRCULAR DEPENDENCIES                                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  SOLUTION 1: REDESIGN (BEST APPROACH)                                           │
│  ─────────────────────────────────────────────────────────────────────────────  │
│  Extract shared logic into a third service:                                     │
│                                                                                 │
│     ┌─────────────┐          ┌─────────────┐                                    │
│     │ OrderService│          │PaymentService│                                   │
│     └──────┬──────┘          └──────┬──────┘                                    │
│            │                        │                                           │
│            ▼                        ▼                                           │
│     ┌────────────────────────────────────┐                                      │
│     │        SharedOrderLogic            │  ← New service both can use          │
│     └────────────────────────────────────┘                                      │
│                                                                                 │
│  SOLUTION 2: @Lazy ANNOTATION                                                   │
│  ─────────────────────────────────────────────────────────────────────────────  │

@Service
public class OrderService {
    private final PaymentService paymentService;
    
    @Autowired
    public OrderService(@Lazy PaymentService paymentService) {  // @Lazy here!
        this.paymentService = paymentService;
    }
}

// HOW @Lazy WORKS:
// Instead of real PaymentService, Spring injects a PROXY
// The proxy delays creation until first method call
// By then, OrderService is fully created, breaking the cycle

│  SOLUTION 3: SETTER INJECTION (Not Recommended)                                 │
│  ───────────────────────────────────────────────────────────────────────────── │

@Service
public class OrderService {
    private PaymentService paymentService;
    
    @Autowired
    public void setPaymentService(PaymentService paymentService) {
        this.paymentService = paymentService;
    }
}

// WHY IT WORKS: Bean created first (empty), then dependencies injected later
// WHY NOT RECOMMENDED: Hides design problem, object can be used in invalid state

│  SOLUTION 4: APPLICATION EVENT (When Appropriate)                               │
│  ───────────────────────────────────────────────────────────────────────────── │

// Instead of: orderService.getOrder() from PaymentService
// Use an event:

@Service
public class PaymentService {
    @EventListener
    public void onOrderCreated(OrderCreatedEvent event) {
        // React to order events without direct dependency
    }
}

│  SOLUTION 5: ALLOW CIRCULAR REFS (Last Resort)                                  │
│  ───────────────────────────────────────────────────────────────────────────── │

// application.properties (Spring Boot 2.6+)
spring.main.allow-circular-references=true

// WARNING: This is a WORKAROUND, not a solution!
// You're just hiding the design problem.

└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│  DETECTING CIRCULAR DEPENDENCIES EARLY                                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  COMPILE TIME: Use ArchUnit tests                                               │
│                                                                                 │
│    @Test                                                                        │
│    void noCircularDependencies() {                                              │
│        slices().matching("com.app.(*)..")                                       │
│            .should().beFreeOfCycles()                                           │
│            .check(classes);                                                     │
│    }                                                                            │
│                                                                                 │
│  RUNTIME: Spring throws BeanCurrentlyInCreationException (default in 2.6+)      │
│                                                                                 │
│  DESIGN TIME: Apply SOLID principles                                            │
│    • Single Responsibility: Services doing too much tend to be circular         │
│    • Dependency Inversion: Depend on abstractions, not concretes                │
│                                                                                 │
│  INTERVIEW TIP: "I prefer redesigning to remove the cycle rather than using     │
│  @Lazy because circular dependencies usually indicate poor design"              │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

# 📋 TIER 2 CHECKLIST

```
IoC & DI CONCEPTS:
□ Can explain Inversion of Control vs traditional control
□ Know the difference: BeanFactory vs ApplicationContext
□ Understand the Hollywood Principle

BEAN DEFINITION:
□ Know all ways to define beans (@Component, @Bean, @Import)
□ Understand @Component stereotype hierarchy
□ Can configure third-party classes as beans

DEPENDENCY INJECTION:
□ Know all 3 injection types and their trade-offs
□ Always use constructor injection for required deps
□ Can resolve multiple beans (@Qualifier, @Primary)

BEAN SCOPES:
□ Know all scopes and when to use each
□ Understand proxy mode for mixing scopes
□ Know prototype limitations (no @PreDestroy)

LIFECYCLE:
□ Can draw full bean lifecycle (9 steps)
□ Know @PostConstruct vs InitializingBean
□ Understand BeanPostProcessor (AOP foundation)

PROFILES & CONDITIONALS:
□ Can configure environment-specific beans
□ Know all @ConditionalOn* annotations
□ Can write custom Condition

EVENTS:
□ Can implement event-driven communication
□ Know @EventListener options (async, conditional, ordered)
□ Understand when to use events vs direct calls
```


---

_Continue to Part 3: AOP (Aspect-Oriented Programming)_


---

> **Navigation**: [< Previous](Ch31_SB_Core_Part1.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](Ch33_SB_Web_Part3.md)