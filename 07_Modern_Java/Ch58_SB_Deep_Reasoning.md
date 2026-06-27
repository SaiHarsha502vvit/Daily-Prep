**Navigation**: [< Previous](Ch22_Java_Deep_Reasoning.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](Ch23_Streams_Deep_Reasoning.md)

# Chapter 32 — Spring Boot Deep Reasoning: The Questions That Freeze People

**"Anyone can say 'Spring Boot auto-configures everything.' The senior engineer explains WHAT DispatcherServlet actually does, WHY @Transactional fails on private methods, and HOW the proxy pattern secretly runs your entire application."**

---

## Table of Contents

1. [DispatcherServlet vs Filter: The Request Gate vs Security Guard](#1-dispatcherservlet-vs-filter-the-request-gate-vs-security-guard)
2. [What @SpringBootApplication Actually Does](#2-what-springbootapplication-actually-does)
3. [Auto-Configuration: How Spring "Magically" Knows What You Need](#3-auto-configuration-how-spring-magically-knows-what-you-need)
4. [The Proxy Pattern: Why @Transactional Fails On Self-Calls](#4-the-proxy-pattern-why-transactional-fails-on-self-calls)
5. [Bean Lifecycle: What Happens Between `new` and "Ready"](#5-bean-lifecycle-what-happens-between-new-and-ready)
6. [IoC & DI: Not Just "Injection" — The Inversion Explained](#6-ioc--di-not-just-injection--the-inversion-explained)
7. [@Autowired vs Constructor Injection: Why Seniors Choose Constructor](#7-autowired-vs-constructor-injection-why-seniors-choose-constructor)
8. [Bean Scopes: Why Injecting Prototype Into Singleton Breaks](#8-bean-scopes-why-injecting-prototype-into-singleton-breaks)
9. [@Controller vs @RestController: Not Just "Adds @ResponseBody"](#9-controller-vs-restcontroller-not-just-adds-responsebody)
10. [Spring Security Filter Chain: How Authentication Actually Works](#10-spring-security-filter-chain-how-authentication-actually-works)
11. [Profiles & Conditional Beans: How Spring Switches Environments](#11-profiles--conditional-beans-how-spring-switches-environments)
12. [Why @Async Doesn't Work Without @EnableAsync](#12-why-async-doesnt-work-without-enableasync)

---

## 1. DispatcherServlet vs Filter: The Request Gate vs Security Guard

### The Freeze Question

"What's the difference between a DispatcherServlet and a Filter?"

**This is the question the user explicitly said people freeze on.**

### Deep Reasoning

```
THE OFFICE BUILDING ANALOGY

HTTP Request arrives at your Spring Boot application:

┌──────────────── SERVLET CONTAINER (Tomcat) ────────────────────┐
│                                                                │
│  [Request] → FILTER 1 → FILTER 2 → FILTER 3 →                  │
│                                                                │
│              ┌── DISPATCHER SERVLET ──────────────────┐        │
│              │                                        │        │
│              │  HandlerMapping → "Which controller?"  │        │
│              │  HandlerAdapter → "Call the method"     │       │
│              │  ViewResolver → "Render the response"  │        │
│              │                                        │        │
│              │  @Controller methods live HERE          │       │
│              └────────────────────────────────────────┘        │
│                                                                │
│  ← FILTER 3 ← FILTER 2 ← FILTER 1 ← [Response]                 │
└────────────────────────────────────────────────────────────────┘

FILTER = Security guard at the building entrance
→ Runs BEFORE and AFTER the request reaches Spring
→ Part of the Servlet spec (javax.servlet.Filter)
→ NOT part of Spring — works at the web container level
→ Can modify request/response, reject requests, log, compress
→ Spring Security IS a filter chain!

DISPATCHER SERVLET = The receptionist inside the building
→ A special Servlet that routes requests to the right Controller
→ IS the entry point to Spring MVC
→ Only ONE DispatcherServlet (front controller pattern)
→ Handles: URL mapping, argument binding, exception handling
```

```java
// FILTER: Runs at Servlet container level, wraps the entire request
@Component
public class LoggingFilter implements Filter {
    @Override
    public void doFilter(ServletRequest request, ServletResponse response,
                         FilterChain chain) throws IOException, ServletException {
        long start = System.currentTimeMillis();

        // BEFORE DispatcherServlet
        System.out.println("Request started: " + ((HttpServletRequest) request).getRequestURI());

        chain.doFilter(request, response); // Continue to next filter or DispatcherServlet

        // AFTER DispatcherServlet (response is ready)
        long duration = System.currentTimeMillis() - start;
        System.out.println("Request took: " + duration + "ms");
    }
}

// DISPATCHER SERVLET: Routes to controllers (you don't usually touch this)
// It does this internally:
// 1. HandlerMapping: "/api/users" → UserController.getUsers()
// 2. HandlerAdapter: Converts HTTP params → Java method args
// 3. Calls your @Controller method
// 4. ViewResolver: Converts return value → HTTP response

// BUT WAIT — there's also INTERCEPTOR (between Filter and Controller):
@Component
public class AuthInterceptor implements HandlerInterceptor {
    @Override
    public boolean preHandle(HttpServletRequest request,
                             HttpServletResponse response, Object handler) {
        // Runs AFTER filters, BEFORE controller
        // Has access to Spring context (unlike filters)
        return true; // false = reject request
    }
}
```

### Complete Request Flow:

```
Client → Tomcat → Filter1 → Filter2 → Filter3
  → DispatcherServlet
    → Interceptor.preHandle()
      → @Controller method
    → Interceptor.postHandle()
  → DispatcherServlet (view resolution)
    → Interceptor.afterCompletion()
  → Filter3 → Filter2 → Filter1 → Tomcat → Client
```

### When To Use What:

| Use Case                            | Use                      |
| ----------------------------------- | ------------------------ |
| Logging, CORS, compression          | Filter                   |
| Authentication/Authorization        | Filter (Spring Security) |
| Rate limiting, request modification | Filter                   |
| Audit logging with Spring context   | Interceptor              |
| Controller-specific pre/post logic  | Interceptor              |
| Business logic, API endpoints       | Controller               |

---

🔬 **Section Challenge — 1. DispatcherServlet vs Filter: The Request Gate vs Security Guard**

**Challenge 1 (Filter vs Interceptor Selection):** You need to log every request's URI, method, and response status. You also need to verify a JWT token before reaching any controller. **Who** (Filter or Interceptor) handles each? **When** does an Interceptor fail to catch unauthenticated requests? **What** is Spring Security's role?

<details><summary>Answer</summary>

**JWT verification → Filter.** Filters run BEFORE DispatcherServlet. If the JWT is invalid, the filter rejects the request with HTTP 401 before Spring MVC even sees it. An Interceptor (which runs AFTER DispatcherServlet's `HandlerMapping`) only runs if the request reaches Spring MVC — too late for authentication. Spring Security IS a filter chain running at the Tomcat/Servlet level. **Request logging → either works**, but a `Filter` is better for capturing raw request/response bytes (before/after the full response is committed). An `Interceptor` (`HandlerInterceptor.afterCompletion`) sees the Spring MVC model but not the raw HTTP response body. **When Interceptor fails for auth:** If DispatcherServlet can't find a handler (404 path), `HandlerInterceptor.preHandle()` is NOT called — only filters see that request. Spring Security filter chain always runs regardless of whether a handler is found.

</details>
<details><summary>Answer</summary>

JWT: stateless — any service can validate without a DB call (verify signature with public key). No sticky sessions needed. Downside: can't invalidate a token before expiry (no server-side state). Session cookies: stateful — easy to invalidate (delete session). But: need a shared session store (Redis) for multi-instance deployments, or sticky sessions (load balancer routing). Microservices: JWT wins for scalability. Add a token blacklist (Redis) if revocation is needed.

</details>

## 2. What @SpringBootApplication Actually Does

### The Freeze Question

"What does @SpringBootApplication do? Could you build a Spring Boot app without it?"

```
╔══════════════════════════════════════════════════════════════════╗
║  @SpringBootApplication = THREE annotations in one:              ║
║                                                                  ║
║  @Configuration                                                  ║
║  → "This class itself is a configuration (can define @Beans)"    ║
║  → Makes main class a source of bean definitions                 ║
║                                                                  ║
║  @EnableAutoConfiguration                                        ║
║  → "Scan classpath and auto-configure beans based on what's      ║
║     on the classpath"                                            ║
║  → Found spring-boot-starter-web? → Configure Tomcat,            ║
║    DispatcherServlet, Jackson, error handling...                 ║
║  → Found spring-boot-starter-data-jpa? → Configure DataSource,   ║
║    EntityManagerFactory, TransactionManager...                   ║
║                                                                  ║
║  @ComponentScan                                                  ║
║  → "Scan THIS package and sub-packages for @Component,           ║
║    @Service, @Repository, @Controller"                           ║
║  → THIS is why your main class should be in the ROOT package     ║
║  → If main class is in com.app, it scans com.app.** only         ║
║  → Classes in com.other will NOT be found!                       ║
╚══════════════════════════════════════════════════════════════════╝
```

```java
// These two are IDENTICAL:
@SpringBootApplication
public class MyApp { ... }

// Same as:
@Configuration
@EnableAutoConfiguration
@ComponentScan
public class MyApp { ... }

// YES, you can build without @SpringBootApplication:
@Configuration
@EnableAutoConfiguration
@ComponentScan(basePackages = "com.myapp.specific")
public class MyApp { ... }
// Useful when you want to scan specific packages only
```

---

🔬 **Section Challenge — 2. What @SpringBootApplication Actually Does**

**Challenge 1 (@SpringBootApplication Removal):** Your team disables `@SpringBootApplication` and splits its three constituent annotations. They set `@ComponentScan(basePackages="com.app.api")` but forget `@EnableAutoConfiguration`. **Who** fails to load? **When** does the failure surface? **What** is the minimum set of annotations to get a working embedded Tomcat with Spring MVC?

<details><summary>Answer</summary>

**Who fails:** The embedded Tomcat auto-configuration (`EmbeddedWebServerFactoryCustomizerAutoConfiguration`) and `DispatcherServletAutoConfiguration`. Without `@EnableAutoConfiguration`, Spring does NOT scan `META-INF/spring/AutoConfiguration.imports`. No auto-configurations run. **When it surfaces:** At startup — the application context starts but no embedded server is created. If you try to make an HTTP request, there's no Tomcat listening. **Minimum set for embedded Tomcat + Spring MVC:** `@Configuration` + `@EnableAutoConfiguration` + `@ComponentScan`. That IS exactly `@SpringBootApplication`. Additionally you need `spring-boot-starter-web` on the classpath, `spring.datasource.*` if using JPA. You can use `@SpringBootApplication(scanBasePackages="com.app.api")` to specify the scan package rather than splitting annotations, which is the recommended approach.

</details>
<details><summary>Answer</summary>

Proxy Bypass. Spring implements `@Async` (and `@Transactional`) by wrapping the bean in a CGLIB or JDK Proxy. When an external class calls the method, it hits the proxy, which intercepts the call and submits it to a thread pool. However, if an internal method calls the `@Async` method directly via `this.method()`, the call never leaves the instance, completely bypassing the proxy wrapper, and executes synchronously.

</details>

## 3. Auto-Configuration: How Spring "Magically" Knows What You Need

### The Freeze Question

"How does Spring Boot know to configure a DataSource without you configuring it?"

```
╔══════════════════════════════════════════════════════════════════╗
║  THE SMART HOME ANALOGY                                          ║
║                                                                  ║
║  Spring Boot's auto-configuration is like a smart home system:   ║
║                                                                  ║
║  1. You plug in a smart thermostat (add dependency to pom.xml)   ║
║  2. Smart home detects it (classpath scanning)                   ║
║  3. It auto-configures: connects to HVAC, sets default temp      ║
║  4. You CAN override: set your own temperature (properties)      ║
║                                                                  ║
║  HOW IT ACTUALLY WORKS:                                          ║
║                                                                  ║
║  spring-boot-autoconfigure.jar contains:                         ║
║  META-INF/spring/org.springframework.boot.autoconfigure.         ║
║  AutoConfiguration.imports (list of auto-config classes)         ║
║                                                                  ║
║  Each auto-config class has CONDITIONS:                          ║
║  @ConditionalOnClass(DataSource.class)                           ║
║    → "Only if DataSource is on classpath"                        ║
║  @ConditionalOnMissingBean(DataSource.class)                     ║
║    → "Only if user hasn't defined their own DataSource"          ║
║  @ConditionalOnProperty(name = "spring.datasource.url")          ║
║    → "Only if this property is set"                              ║
║                                                                  ║
║  KEY INSIGHT: Auto-config BACKS OFF when you define your own.    ║
║  It's not magic — it's conditional bean registration.            ║
╚══════════════════════════════════════════════════════════════════╝
```

```java
// Simplified auto-config class:
@AutoConfiguration
@ConditionalOnClass(DataSource.class)           // H2/MySQL on classpath?
@ConditionalOnMissingBean(DataSource.class)     // User hasn't defined one?
public class DataSourceAutoConfiguration {

    @Bean
    @ConditionalOnProperty("spring.datasource.url") // URL configured?
    public DataSource dataSource(DataSourceProperties props) {
        return DataSourceBuilder.create()
            .url(props.getUrl())
            .username(props.getUsername())
            .build();
    }
}

// If you define YOUR OWN DataSource bean, auto-config BACKS OFF:
@Configuration
public class MyConfig {
    @Bean
    public DataSource myDataSource() {
        // Your custom config — auto-config won't create another
        return new HikariDataSource(...);
    }
}

// Debug auto-config: add this to application.properties
// debug=true
// Shows: Positive matches (what was auto-configured)
//        Negative matches (what was skipped and WHY)
```

---

🔬 **Section Challenge — 3. Auto-Configuration: How Spring "Magically" Knows What You Need**

**Challenge 1 (Negative Match Debug):** Your Spring Boot app has `spring-boot-starter-data-jpa` but no `spring.datasource.url`. The app fails to start. **Who** is the auto-configuration trying to create? **When** would `debug=true` show this? **What** two properties fix it without providing a real DB?

<details><summary>Answer</summary>

**Who:** `DataSourceAutoConfiguration` and `HibernateJpaAutoConfiguration`. With `spring-boot-starter-data-jpa` on the classpath, `@ConditionalOnClass(DataSource.class)` is TRUE. Spring tries to auto-configure a DataSource but finds no URL → `DataSourceProperties` binding fails → `Cannot determine embedded database driver class for database type NONE`. **When `debug=true` shows it:** Add `debug=true` to `application.properties`. The startup log shows the "CONDITIONS EVALUATION REPORT": Positive matches (what loaded), Negative matches (what was skipped and WHY — e.g., `DataSourceAutoConfiguration matched: @ConditionalOnClass found class javax.sql.DataSource`). This is the #1 tool for diagnosing auto-configuration surprises. **Two fixes without real DB:** (1) Add H2 to classpath + `spring.datasource.url=jdbc:h2:mem:testdb` — Spring auto-configures in-memory H2. (2) Exclude the JPA auto-config: `@SpringBootApplication(exclude={DataSourceAutoConfiguration.class})` — tell Spring to skip DataSource auto-configuration entirely.

</details>
<details><summary>Answer</summary>

Proxy Bypass. Spring implements `@Async` (and `@Transactional`) by wrapping the bean in a CGLIB or JDK Proxy. When an external class calls the method, it hits the proxy, which intercepts the call and submits it to a thread pool. However, if an internal method calls the `@Async` method directly via `this.method()`, the call never leaves the instance, completely bypassing the proxy wrapper, and executes synchronously.

</details>

## 4. The Proxy Pattern: Why @Transactional Fails On Self-Calls

### The Freeze Question

"I put @Transactional on a method but it doesn't create a transaction. Why?"

```
╔══════════════════════════════════════════════════════════════════╗
║  THE BODYGUARD ANALOGY                                           ║
║                                                                  ║
║  Spring creates a PROXY (bodyguard) around your bean.            ║
║  All calls from OUTSIDE go through the proxy.                    ║
║  The proxy adds behavior (transaction, security, caching).       ║
║                                                                  ║
║  [Caller] → [Proxy: begin TX] → [Your Bean] → [Proxy: commit]    ║
║                                                                  ║
║  BUT! If your bean calls ITS OWN method:                         ║
║  [Your Bean] → this.internalMethod()                             ║
║  → Bypasses the proxy! No transaction started!                   ║
║                                                                  ║
║  It's like the bodyguard stands at the door.                     ║
║  If you're already inside the room and call yourself,            ║
║  you don't go through the door (proxy) again.                    ║
╚══════════════════════════════════════════════════════════════════╝
```

```java
@Service
public class OrderService {

    @Transactional
    public void processOrder(Order order) {
        // ✅ This WORKS — called FROM OUTSIDE through proxy
        saveOrder(order);
        sendNotification(order);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void sendNotification(Order order) {
        // ❌ DOES NOT get its own transaction when called from processOrder!
        // Because processOrder calls this.sendNotification() — bypasses proxy
    }
}

// FIX 1: Inject self (let Spring give you the proxy)
@Service
public class OrderService {
    @Autowired
    private OrderService self; // Spring injects the PROXY, not `this`

    @Transactional
    public void processOrder(Order order) {
        saveOrder(order);
        self.sendNotification(order); // ✅ Goes through proxy!
    }
}

// FIX 2: Extract to separate service
@Service
public class NotificationService {
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void sendNotification(Order order) { ... }
    // ✅ Called from OrderService → goes through NotificationService's proxy
}

// OTHER PROXY GOTCHAS:
// - @Transactional on PRIVATE methods → ignored (proxy can't override private)
// - @Cacheable on self-call → ignored
// - @Async on self-call → runs synchronously
```

---

🔬 **Section Challenge — 4. The Proxy Pattern: Why @Transactional Fails On Self-Calls**

**Challenge 1 (Private Method Gotcha):** You add `@Transactional` to a `private` method. **Who** silently ignores it? **When** does data written in that method get committed or rolled back? **What** is the Spring documentation's stated reason?

<details><summary>Answer</summary>

**Who ignores it:** Spring's CGLIB proxy. CGLIB creates a subclass and overrides methods to inject transactional behavior. `private` methods CANNOT be overridden by subclasses in Java (they're not polymorphic). So the proxy's subclass simply doesn't intercept calls to the private method. **When data is committed/rolled back:** The private method executes within whatever transaction context is ALREADY active on the calling thread (determined by the caller's `@Transactional` or lack thereof). If the caller has a transaction, the private method joins it. If no transaction exists, the private method runs without a transaction (auto-commit per-statement). **Spring's stated reason (from docs):** "Due to the proxy-based nature of Spring's AOP framework, protected, private, or package-visible methods are not intercepted." The solution: always put `@Transactional` on public methods. If internal logic needs transaction boundaries, extract to a separate public method/bean that can be proxied.

</details>
<details><summary>Answer</summary>

READ COMMITTED: both T1 and T2 read balance=1000. Both compute 900. Both write 900. Final balance: 900 (expected: 800). Lost update! REPEATABLE READ (with locking SELECT FOR UPDATE): first SELECT acquires a read lock. T2's SELECT blocks until T1 commits. After T1 commits (balance=900), T2 reads 900, writes 800. Correct! Alternatively: use `UPDATE ... WHERE balance=1000` (optimistic locking with version check).

</details>

## 5. Bean Lifecycle: What Happens Between `new` and "Ready"

### The Freeze Question

"What's the Spring Bean lifecycle?"

```
╔══════════════════════════════════════════════════════════════════╗
║  THE EMPLOYEE ONBOARDING ANALOGY                                 ║
║                                                                  ║
║  1. INSTANTIATION: Hire the employee (new MyBean())              ║
║  2. POPULATE PROPERTIES: Give them a desk, laptop (@Autowired)   ║
║  3. AWARE INTERFACES: Tell them company name, their ID           ║
║     (BeanNameAware, ApplicationContextAware)                     ║
║  4. @PostConstruct: Employee orientation (run custom init)       ║
║  5. InitializingBean.afterPropertiesSet(): Second init hook      ║
║  6. Custom init-method: Third init hook                          ║
║  7. BEAN IS READY — now serving requests                         ║
║  ...                                                             ║
║  8. @PreDestroy: Goodbye party (cleanup before shutdown)         ║
║  9. DisposableBean.destroy(): Second cleanup hook                ║
║  10. Custom destroy-method: Third cleanup hook                   ║
║                                                                  ║
║  PRACTICAL: You usually only need @PostConstruct/@PreDestroy     ║
╚══════════════════════════════════════════════════════════════════╝
```

```java
@Service
public class CacheService {
    private final Map<String, Object> cache = new HashMap<>();

    @PostConstruct // Runs AFTER all dependencies are injected
    public void init() {
        // Load initial data, warm up cache
        // Dependencies are available here
        cache.put("config", loadConfig());
    }

    @PreDestroy // Runs BEFORE bean is destroyed (app shutdown)
    public void cleanup() {
        // Close connections, flush cache, release resources
        cache.clear();
    }
}
```

---

## 6. IoC & DI: Not Just "Injection" — The Inversion Explained

### The Freeze Question

"What is Inversion of Control? What's being inverted?"

```
╔══════════════════════════════════════════════════════════════════╗
║  COOKING AT HOME vs RESTAURANT — The Inversion                   ║
║                                                                  ║
║  WITHOUT IoC (cooking at home):                                  ║
║  YOU control everything:                                         ║
║  → You decide what to buy                                        ║
║  → You buy ingredients (create dependencies)                     ║
║  → You cook (main logic)                                         ║
║  → You clean up                                                  ║
║  YOU have the control.                                           ║
║                                                                  ║
║  WITH IoC (restaurant):                                          ║
║  The FRAMEWORK controls:                                         ║
║  → Restaurant decides kitchen setup (container manages beans)    ║
║  → Waiter brings ingredients (container injects dependencies)    ║
║  → You just cook your dish (write business logic)                ║
║  → Restaurant cleans up (container manages lifecycle)            ║
║  CONTROL IS INVERTED — the framework calls YOU.                  ║
║                                                                  ║
║  WHAT'S INVERTED: Who creates and manages objects.               ║
║  Normal: Your code creates dependencies.                         ║
║  IoC: Framework creates and gives you dependencies.              ║
║  DI: The specific mechanism — injecting through constructor,     ║
║      setter, or field.                                           ║
╚══════════════════════════════════════════════════════════════════╝
```

```java
// WITHOUT IoC: You create everything (tightly coupled)
public class OrderService {
    private PaymentProcessor processor = new StripeProcessor(); // Hardcoded!
    private EmailService email = new GmailService();            // Hardcoded!
    // Changing to PayPal? Edit this class. Violates Open/Closed.
    // Testing? Can't mock StripeProcessor easily.
}

// WITH IoC/DI: Framework gives you what you need (loosely coupled)
@Service
public class OrderService {
    private final PaymentProcessor processor; // Interface!
    private final EmailService email;         // Interface!

    public OrderService(PaymentProcessor processor, EmailService email) {
        this.processor = processor; // Spring injects the right implementation
        this.email = email;
    }
    // Testing? Pass in a mock. Switching to PayPal? Change config, not code.
}
```

---

🔬 **Section Challenge — 6. IoC & DI: Not Just "Injection" — The Inversion Explained**

**Challenge 1 (Tight Coupling Test Pain):** Without IoC, `OrderService` does `new StripeProcessor()` internally. **Who** makes testing impossible without a real Stripe API? **When** does tight coupling cause a unit test to become an integration test? **What** specific Java limitation prevents mocking `new` expressions?

<details><summary>Answer</summary>

**Who makes testing impossible:** `OrderService` itself, by controlling its own dependency creation with `new StripeProcessor()`. The test has no way to substitute a mock without Mockito's PowerMock (which requires a Java agent) or reflection hacks. **When it becomes an integration test:** Whenever `StripeProcessor` makes an HTTP call, hits a DB, reads a file, or has external state. A "unit test" that calls Stripe's real API is an integration test by definition — slow, flaky, environment-dependent. **Java limitation:** `new` expressions are NOT overridable/interceptable in plain Java. The JVM allocates and constructs the object directly. Mockito (standard) works by subclassing (CGLIB) — it can mock class types injected AFTER construction, but cannot intercept `new` calls inside methods. IoC solves this at the architecture level: if `OrderService` receives its `PaymentProcessor` via constructor injection, the test passes `new MockPaymentProcessor()` — zero framework magic needed.

</details>
<details><summary>Answer</summary>

Proxy Bypass. Spring implements `@Async` (and `@Transactional`) by wrapping the bean in a CGLIB or JDK Proxy. When an external class calls the method, it hits the proxy, which intercepts the call and submits it to a thread pool. However, if an internal method calls the `@Async` method directly via `this.method()`, the call never leaves the instance, completely bypassing the proxy wrapper, and executes synchronously.

</details>

## 7. @Autowired vs Constructor Injection: Why Seniors Choose Constructor

### The Freeze Question

"What's wrong with @Autowired on fields?"

```
╔══════════════════════════════════════════════════════════════════╗
║  THREE INJECTION STYLES:                                         ║
║                                                                  ║
║  FIELD INJECTION (the lazy way):                                 ║
║  @Autowired private UserRepository repo;                         ║
║  ❌ Can't make fields final (no immutability)                     ║
║  ❌ Hidden dependencies (not visible in constructor)              ║
║  ❌ Can't use without Spring (can't new + inject in tests)        ║
║  ❌ Allows too many dependencies (no visible bloat signal)        ║
║                                                                  ║
║  SETTER INJECTION (for optional deps):                           ║
║  @Autowired public void setRepo(UserRepository repo) {...}       ║
║  ⚠️ Bean can exist in partially initialized state                ║
║  ✅ Good for optional/changeable dependencies                     ║
║                                                                  ║
║  CONSTRUCTOR INJECTION (the right way):                          ║
║  public UserService(UserRepository repo) { this.repo = repo; }   ║
║  ✅ Immutable (final fields)                                      ║
║  ✅ All dependencies visible in constructor                       ║
║  ✅ Works without Spring (easy testing: new UserService(mock))    ║
║  ✅ Fails fast if dependency missing (constructor error)          ║
║  ✅ Too many params? Signal to split the class                    ║
║  ✅ No @Autowired needed if single constructor (Spring auto)      ║
╚══════════════════════════════════════════════════════════════════╝
```

```java
// ❌ Field injection — tests need reflection or Spring context
@Service
public class UserService {
    @Autowired private UserRepository repo;
    @Autowired private EmailService email;
    @Autowired private CacheService cache;
}

// ✅ Constructor injection — clean, testable, immutable
@Service
@RequiredArgsConstructor // Lombok generates constructor for final fields
public class UserService {
    private final UserRepository repo;
    private final EmailService email;
    private final CacheService cache;
    // Spring auto-detects single constructor — no @Autowired needed
}

// Test without Spring:
UserService service = new UserService(mockRepo, mockEmail, mockCache);
```

---

🔬 **Section Challenge — 7. @Autowired vs Constructor Injection: Why Seniors Choose Constructor**

**Challenge 1 (Immutability & Circular Dependency):** Constructor injection enforces `final` fields. **Who** prevents circular constructor dependencies from compiling? **When** does immutability in a Spring bean matter for thread safety? **What** happens to `final` field visibility across threads without `volatile`?

<details><summary>Answer</summary>

**Who prevents circular constructor deps:** The JVM at runtime (not the compiler). `final` fields must be assigned in the constructor — but Spring throws `BeanCurrentlyInCreationException` before the constructors can form a deadlock cycle. **When immutability matters for thread safety:** Singleton beans are shared across all threads. If a singleton has `private final UserRepository repo` (final + reference set in constructor), the Java Memory Model's final field semantics guarantee that ALL threads see the initialized value of `repo` without synchronization — this is a JMM guarantee for `final` fields written in constructors. **`final` field visibility without `volatile`:** The JMM guarantees: after a constructor completes, all threads that subsequently read the object's `final` field see its value correctly initialized — even without `volatile` or `synchronized`. This is `final` field freeze. BUT: if the constructor reference (`this`) escapes during construction (e.g., `EventBus.register(this)` inside the constructor), the `final` field guarantee is voided and a partially constructed object may be visible. This is "safe publication via constructor" and a key JMM subtlety.

</details>
<details><summary>Answer</summary>

Proxy Bypass. Spring implements `@Async` (and `@Transactional`) by wrapping the bean in a CGLIB or JDK Proxy. When an external class calls the method, it hits the proxy, which intercepts the call and submits it to a thread pool. However, if an internal method calls the `@Async` method directly via `this.method()`, the call never leaves the instance, completely bypassing the proxy wrapper, and executes synchronously.

</details>

## 8. Bean Scopes: Why Injecting Prototype Into Singleton Breaks

### The Freeze Question

"I defined a prototype bean but it's acting like a singleton. Why?"

```
╔══════════════════════════════════════════════════════════════════╗
║  THE COFFEE MACHINE ANALOGY                                      ║
║                                                                  ║
║  Singleton scope: One coffee machine in the office. Everyone     ║
║  shares it. Created once at startup.                             ║
║                                                                  ║
║  Prototype scope: Fresh cup for each person. Created each time   ║
║  it's requested.                                                 ║
║                                                                  ║
║  THE PROBLEM:                                                    ║
║  Singleton OrderService is created ONCE at startup.              ║
║  During creation, Spring injects Prototype ShoppingCart.         ║
║  That cart is created ONCE and stored in OrderService forever.   ║
║                                                                  ║
║  Result: ALL users share the SAME cart!                          ║
║  The prototype is "trapped" inside the singleton.                ║
║                                                                  ║
║  It's like installing a fresh coffee cup holder once —           ║
║  the "fresh cup each time" promise is broken because the         ║
║  holder only gets filled once (at singleton creation).           ║
╚══════════════════════════════════════════════════════════════════╝
```

```java
// ❌ BROKEN: Prototype injected into Singleton
@Component @Scope("prototype")
public class ShoppingCart { private List<Item> items = new ArrayList<>(); }

@Service // singleton by default
public class OrderService {
    private final ShoppingCart cart; // Injected ONCE! Everyone shares it!
    public OrderService(ShoppingCart cart) { this.cart = cart; }
}

// FIX 1: ObjectFactory (Spring creates fresh instance each call)
@Service
public class OrderService {
    private final ObjectFactory<ShoppingCart> cartFactory;
    public OrderService(ObjectFactory<ShoppingCart> cartFactory) {
        this.cartFactory = cartFactory;
    }
    public void addItem(Item item) {
        ShoppingCart cart = cartFactory.getObject(); // Fresh cart!
    }
}

// FIX 2: @Scope with proxyMode (Spring creates a proxy that delegates)
@Component
@Scope(value = "prototype", proxyMode = ScopedProxyMode.TARGET_CLASS)
public class ShoppingCart { ... }
// Now Spring injects a proxy that creates a new ShoppingCart each time
```

---

🔬 **Section Challenge — 8. Bean Scopes: Why Injecting Prototype Into Singleton Breaks**

**Challenge 1 (Request-Scoped Prototype):** You need a fresh `RequestContext` bean per HTTP request (not per class injection). **Who** fails with `@Scope("prototype")` injected into a singleton? **What** scope is correct? **When** does Spring's `request` scope fail outside a web context?

<details><summary>Answer</summary>

**Who fails:** The singleton that receives the prototype via constructor injection. Spring creates ONE instance of the prototype at singleton construction time and stores it. All subsequent requests reuse that one instance — the prototype behavior is lost. **Correct scope:** `@Scope(value = "request", proxyMode = ScopedProxyMode.TARGET_CLASS)`. Spring creates a NEW `RequestContext` for each HTTP request and disposes it when the request completes. The `proxyMode` ensures the singleton receives a SCOPED PROXY — each method call on the proxy delegates to the actual request-scoped bean for the current HTTP request. **When request scope fails:** In non-web contexts — background threads, `@Scheduled` jobs, unit tests without `MockMvc`/`WebApplicationContext`. These have no active `RequestAttributes` in `RequestContextHolder`. Calling a request-scoped bean from a scheduled task throws `ScopeNotActiveException: No thread-bound request found`. Fix: use `RequestContextHolder.setRequestAttributes()` manually or restructure to avoid request-scoped beans in non-request threads.

</details>
<details><summary>Answer</summary>

`new Constructor()`: runs the constructor function (initializes instance properties), sets `__proto__` to `Constructor.prototype`. `Object.create(proto)`: creates an object with `proto` as its prototype, NO constructor called. Use `Object.create(null)` to create a pure dictionary with no inherited properties (no `toString`, `hasOwnProperty`, etc.) — useful for safe maps. `Object.create(SomeClass.prototype)` creates an instance-like object without running the constructor (used in class inheritance setup).

</details>

## 9. @Controller vs @RestController: Not Just "Adds @ResponseBody"

### The Freeze Question

"What's the actual difference?"

```
╔══════════════════════════════════════════════════════════════════╗
║  @Controller = View Returns (traditional MVC web apps)           ║
║  → Return value is a VIEW NAME (JSP, Thymeleaf template)         ║
║  → DispatcherServlet passes to ViewResolver to render HTML       ║
║                                                                  ║
║  @RestController = @Controller + @ResponseBody on every method   ║
║  → Return value is SERIALIZED directly to response body (JSON)   ║
║  → No view resolution — Jackson converts to JSON automatically   ║
║                                                                  ║
║  THE DEEPER UNDERSTANDING:                                       ║
║                                                                  ║
║  @Controller + return "users" → ViewResolver looks for           ║
║    templates/users.html → renders HTML                           ║
║                                                                  ║
║  @RestController + return userList → HttpMessageConverter        ║
║    (Jackson) serializes to JSON → {"users": [...]}               ║
║                                                                  ║
║  You CAN use @Controller for REST APIs:                          ║
║  @Controller                                                     ║
║  public class UserController {                                   ║
║    @ResponseBody  // ← Must add this to EACH method              ║
║    @GetMapping("/users")                                         ║
║    public List<User> getUsers() { ... }                          ║
║  }                                                               ║
║  @RestController just avoids repeating @ResponseBody.            ║
╚══════════════════════════════════════════════════════════════════╝
```

---

## 10. Spring Security Filter Chain: How Authentication Actually Works

### The Freeze Question

"How does Spring Security authenticate a request?"

```
╔══════════════════════════════════════════════════════════════════╗
║  Spring Security = A CHAIN of Servlet Filters                    ║
║  (This ties back to Section 1 — Filters run BEFORE Dispatcher)   ║
║                                                                  ║
║  Request → SecurityFilterChain:                                  ║
║                                                                  ║
║  1. SecurityContextPersistenceFilter                             ║
║     → Load existing security context (from session/token)        ║
║                                                                  ║
║  2. UsernamePasswordAuthenticationFilter                         ║
║     → If login request: extract credentials, authenticate        ║
║     → Delegates to AuthenticationManager                         ║
║       → Which uses AuthenticationProvider                        ║
║         → Which uses UserDetailsService (your DB lookup)         ║
║         → Which uses PasswordEncoder (BCrypt check)              ║
║                                                                  ║
║  3. BasicAuthenticationFilter (if using HTTP Basic)              ║
║  4. BearerTokenAuthenticationFilter (if using JWT/OAuth2)        ║
║                                                                  ║
║  5. AuthorizationFilter                                          ║
║     → Check: Does this user have the required role/authority?    ║
║     → @PreAuthorize, @Secured, hasRole() evaluated here          ║
║                                                                  ║
║  6. ExceptionTranslationFilter                                   ║
║     → Converts auth exceptions to HTTP 401/403                   ║
║                                                                  ║
║  KEY: Spring Security is NOT inside Spring MVC.                  ║
║  It runs BEFORE DispatcherServlet even sees the request.         ║
╚══════════════════════════════════════════════════════════════════╝
```

---

🔬 **Section Challenge — 10. Spring Security Filter Chain: How Authentication Actually Works**

**Challenge 1 (401 vs 403 Trace):** User sends `GET /api/admin/report` without a JWT token. **Who** returns 401? User sends the same request WITH a valid JWT but the user's role is `USER` (not `ADMIN`). **Who** returns 403? **What** filter in the chain makes each decision?

<details><summary>Answer</summary>

**401 (no token) — Who:** `BearerTokenAuthenticationFilter` (if using JWT/OAuth2 resource server). When no `Authorization: Bearer` header is present, the filter finds no credentials. `AuthenticationEntryPoint.commence()` is called → returns HTTP 401 with `WWW-Authenticate` header. The request never reaches `AuthorizationFilter`. **403 (valid token, wrong role) — Who:** `AuthorizationFilter` (Spring Security 6+, replaces `FilterSecurityInterceptor`). The token is valid → authentication succeeds → `SecurityContext` populated with `ROLE_USER`. `AuthorizationFilter` checks: does this principal have `ROLE_ADMIN` for this path? No → `AccessDeniedException` → `AccessDeniedHandler` → HTTP 403. **Filter sequence:** `BearerTokenAuthFilter` (authentication) → `AuthorizationFilter` (authorization). They are separate filters: authentication answers "who are you?" (401 if unknown), authorization answers "are you allowed?" (403 if not permitted). This is the standard security pipeline principle — authn before authz.

</details>
<details><summary>Answer</summary>

JWT: stateless — any service can validate without a DB call (verify signature with public key). No sticky sessions needed. Downside: can't invalidate a token before expiry (no server-side state). Session cookies: stateful — easy to invalidate (delete session). But: need a shared session store (Redis) for multi-instance deployments, or sticky sessions (load balancer routing). Microservices: JWT wins for scalability. Add a token blacklist (Redis) if revocation is needed.

</details>

## 11. Profiles & Conditional Beans: How Spring Switches Environments

### The Freeze Question

"How do you configure different settings for dev, staging, and production?"

```java
// application.yml (default):
spring:
  profiles:
    active: dev  # or set via command line: --spring.profiles.active=prod

// application-dev.yml (auto-loaded when profile = dev):
spring:
  datasource:
    url: jdbc:h2:mem:testdb
  jpa:
    show-sql: true

// application-prod.yml (auto-loaded when profile = prod):
spring:
  datasource:
    url: jdbc:postgresql://prod-server:5432/maindb
  jpa:
    show-sql: false

// Profile-specific beans:
@Configuration
public class StorageConfig {

    @Bean
    @Profile("dev")
    public StorageService localStorage() {
        return new LocalFileStorage(); // Use local filesystem in dev
    }

    @Bean
    @Profile("prod")
    public StorageService cloudStorage() {
        return new S3StorageService(); // Use AWS S3 in production
    }
}
```

---

🔬 **Section Challenge — 11. Profiles & Conditional Beans: How Spring Switches Environments**

**Challenge 1 (Property Resolution Order):** `application.yml` sets `app.timeout=30`. `application-prod.yml` sets `app.timeout=60`. You also pass `--app.timeout=90` on the command line. **Who** wins? **What** is Spring's property source priority order? **When** does `@Value` vs `@ConfigurationProperties` behave differently under profile activation?

<details><summary>Answer</summary>

**Winner:** Command-line argument `--app.timeout=90`. **Spring property source priority (highest to lowest):** (1) Command-line args (`--key=value`). (2) `SPRING_APPLICATION_JSON` (inline JSON env var). (3) OS environment variables. (4) `application-{profile}.properties/yml` (active profile-specific). (5) `application.properties/yml` (default). (6) `@PropertySource` annotations. (7) Default values (`@Value("${key:default}")`). So `application-prod.yml` (priority 4) beats `application.yml` (priority 5), but command-line (priority 1) beats both. **`@Value` vs `@ConfigurationProperties` under profiles:** Both resolve from the same `Environment` — same priority order. The difference is binding time: `@Value` binds at bean creation. `@ConfigurationProperties` binds all at once via `ConfigurationPropertiesBindingPostProcessor`. If you change a property programmatically AFTER context startup, `@Value` fields are NOT updated (they're `final` equivalent). Use Spring Cloud's `@RefreshScope` + `/actuator/refresh` for dynamic property reloading.

</details>
<details><summary>Answer</summary>

Proxy Bypass. Spring implements `@Async` (and `@Transactional`) by wrapping the bean in a CGLIB or JDK Proxy. When an external class calls the method, it hits the proxy, which intercepts the call and submits it to a thread pool. However, if an internal method calls the `@Async` method directly via `this.method()`, the call never leaves the instance, completely bypassing the proxy wrapper, and executes synchronously.

</details>

## 12. Why @Async Doesn't Work Without @EnableAsync

### The Freeze Question

"I added @Async but the method still runs synchronously."

```
╔══════════════════════════════════════════════════════════════════╗
║  Same proxy problem as @Transactional (Section 4):               ║
║                                                                  ║
║  @Async tells Spring: "Run this in a different thread."          ║
║  But Spring needs to create a PROXY to intercept the call        ║
║  and redirect it to a thread pool.                               ║
║                                                                  ║
║  @EnableAsync tells Spring: "Create those proxies."              ║
║  Without it, @Async is just an annotation — no behavior.         ║
║                                                                  ║
║  SAME GOTCHAS:                                                   ║
║  1. Self-call bypasses proxy → runs synchronously                ║
║  2. Private methods can't be proxied → @Async ignored            ║
║  3. Return void or Future<T>, not raw types                      ║
║  4. Default thread pool is SimpleAsyncTaskExecutor (no pool!)    ║
║     → ALWAYS configure a proper ThreadPoolTaskExecutor           ║
╚══════════════════════════════════════════════════════════════════╝
```

```java
@Configuration
@EnableAsync // MUST have this!
public class AsyncConfig {
    @Bean
    public Executor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(5);
        executor.setMaxPoolSize(10);
        executor.setQueueCapacity(25);
        executor.setThreadNamePrefix("Async-");
        executor.initialize();
        return executor;
    }
}

@Service
public class EmailService {
    @Async // Now works — proxy intercepts and runs in thread pool
    public CompletableFuture<Void> sendEmail(String to, String body) {
        // This runs in a separate thread
        mailSender.send(createMessage(to, body));
        return CompletableFuture.completedFuture(null);
    }
}
```

---

🔬 **Section Challenge — 12. Why @Async Doesn't Work Without @EnableAsync**

**Challenge 1 (@Async Thread Pool Exhaustion):** Your `@Async` service uses the default `SimpleAsyncTaskExecutor`. Under load, 500 concurrent requests hit an async endpoint. **Who** creates 500 threads? **When** does this cause OOM? **What** is the correct `ThreadPoolTaskExecutor` configuration for a bounded async pool?

<details><summary>Answer</summary>

**Who creates 500 threads:** `SimpleAsyncTaskExecutor` — Spring's DEFAULT async executor if no custom `Executor` bean is defined. It creates a NEW thread for EVERY task. It has NO thread pool, NO queue, NO max thread limit. 500 concurrent `@Async` calls → 500 new threads. **When OOM occurs:** When threads can't be created (`OutOfMemoryError: unable to create native thread`). Each thread consumes ~512KB-1MB of stack memory. 500 threads = 256-512MB just for stacks. In a container with 512MB RAM, OOM is certain. **Correct `ThreadPoolTaskExecutor` configuration:** `setCorePoolSize(10)` (always-alive threads), `setMaxPoolSize(50)` (max under burst), `setQueueCapacity(200)` (queue when core is busy), `setRejectedExecutionHandler(new CallerRunsPolicy())` (natural backpressure — caller's thread runs task when pool is full, instead of dropping). `CallerRunsPolicy` is the production-safe choice: it never drops tasks and slows the caller as a signal to back off. **Production sizing:** CorePoolSize ≈ CPU count for CPU-bound work; ≈ 10-50 for I/O-bound (DB/HTTP waits). Always bound the queue to prevent unbounded memory growth.

</details>

## Interview Quick-Fire: Spring Boot Freeze Busters

| Freeze Question                                 | Senior-Level Answer                                                                                                                                                                            |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "What is a Servlet?"                            | A Java interface for handling HTTP requests. Tomcat is the Servlet Container that manages servlet lifecycle. DispatcherServlet is Spring's single servlet that delegates to controllers.       |
| "What's @Component vs @Service vs @Repository?" | Functionally identical — all register as beans. @Service and @Repository are semantic markers. @Repository adds automatic exception translation (SQL exceptions → Spring DataAccessException). |
| "What is Spring Boot Starter?"                  | A curated set of dependencies. `spring-boot-starter-web` includes Tomcat + Spring MVC + Jackson + Validation. You add ONE dependency instead of configuring 15.                                |
| "What's the embedded server?"                   | Spring Boot packages Tomcat/Jetty/Undertow INSIDE your jar. No external server needed. Run `java -jar app.jar` → Tomcat starts on port 8080. Production-ready out of the box.                  |
| "How does Spring Boot handle errors?"           | BasicErrorController catches unhandled exceptions. Returns JSON for REST (Accept: application/json) or HTML error page (browser). Customize with @ControllerAdvice + @ExceptionHandler.        |
| "What's Actuator?"                              | Production monitoring endpoints: /health, /metrics, /info, /env. Shows bean definitions, HTTP traces, thread dumps. Secure them in production!                                                 |

---

← Previous: [Chapter 31 — Java Deep Reasoning](Ch22_Java_Deep_Reasoning.md)
| [📚 Index](../00_MASTER_INDEX.md)
| Next: [DSA Deep Reasoning →](../03_Algorithms/16_DSA_Deep_Reasoning.md)

---

> **Navigation**: [< Previous](Ch22_Java_Deep_Reasoning.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](Ch23_Streams_Deep_Reasoning.md)


---

## Reality Check

**"Understanding Spring Boot means memorizing annotations"** ? Annotations are API surface. Deep understanding means knowing the LIFECYCLE: when does @Configuration get processed? (During BeanDefinitionRegistration.) When does @Autowired resolve? (During bean initialization, after instantiation.) When does @PostConstruct fire? (After all dependencies are injected.) When does @Transactional proxy get created? (During BeanPostProcessor phase.) The sequence matters � getting it wrong means beans that are partially initialized or unproxied.

**"You understand a concept when you can use it"** ? You understand it when you can explain WHY it exists and WHAT PROBLEM it solves. Anyone can write @Autowired. Understanding means knowing that without DI, a controller creates its own service which creates its own repository � making the controller untestable because you cannot substitute mock dependencies. DI exists for testability and decoupling, not convenience.

**"Reading documentation is enough for deep understanding"** ? Documentation describes intended behavior. Deep understanding requires reading source code to see ACTUAL behavior. The Spring Security documentation says @PreAuthorize checks authorization. The source code reveals it uses SpEL expression evaluation, which means injection vulnerabilities if user input reaches the expression. Documentation tells you what to use; source code tells you what can go wrong.

**"Design patterns are academic concepts"** ? Spring Boot is BUILT on design patterns: Template Method (JdbcTemplate, RestTemplate), Strategy (HandlerMapping, ViewResolver, AuthenticationProvider), Proxy (AOP, @Transactional), Factory (BeanFactory), Observer (ApplicationEvent), Chain of Responsibility (FilterChain, HandlerInterceptor). If you cannot identify these patterns in Spring, you are memorizing API calls without understanding architecture.

**"Spring Boot debugging means reading stack traces"** ? Spring Boot stack traces include proxy class names like $$EnhancerBySpringCGLIB$$abc123, transaction interceptor calls, security filter chains, and AOP advice invocations. Without understanding the proxy and filter architecture, a 50-line stack trace looks like noise. The skill is knowing which frames are Spring infrastructure (skip them) and which are your code (read them). Enable --debug to see auto-configuration decisions, not just exceptions.
