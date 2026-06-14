**Navigation**: [< Previous](Ch32_SB_Data_Part2.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](Ch34_SB_Security_Part4.md)

# 🌱 SPRING BOOT COMPLETE GUIDE - Part 3: AOP & Spring Boot Magic

**Aspect-Oriented Programming & Boot Auto-Configuration**
_"Understanding how @Transactional and auto-configuration actually work"_

---

# 🎯 WHY-HOW-WHEN-WHICH FRAMEWORK

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  WHY: Why AOP & Auto-Configuration?                                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│  • @Transactional magic: Without AOP knowledge, it's unexplainable              │
│  • Cross-cutting concerns: Logging, security, caching - applied everywhere      │
│  • Debug proxy issues: "Why isn't @Transactional working?" - now you'll know    │
│  • Auto-config: Understand why adding dependency enables features               │
│  • Custom starters: Build your own Spring Boot starters for libraries           │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│  HOW: How AOP Creates Magic?                                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│  • Proxy wrapping: Spring creates proxy around your bean                        │
│  • Pointcuts: Define WHERE advice applies (method patterns)                     │
│  • Advice types: @Before, @After, @Around - WHEN code runs                      │
│  • Auto-config: @ConditionalOnClass, META-INF/spring.factories                  │
│  • Starters: Pre-configured dependencies + auto-configuration                   │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│  WHEN: When to Use AOP?                                                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│  • Logging: Log all service method entries/exits                                │
│  • Security: Check authorization before method execution                        │
│  • Transactions: @Transactional uses AOP (already built-in)                     │
│  • Caching: @Cacheable wraps methods with cache logic                           │
│  • Performance: Measure method execution time across all services               │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│  WHICH: Which AOP Concepts to Master?                                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ESSENTIAL:     Proxy limitations, @Around advice, pointcut expressions         │
│  IMPORTANT:     Self-invocation problem, @EnableAspectJAutoProxy                │
│  ADVANCED:      Custom auto-configuration, conditional bean creation            │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

# 📌 Tier 3: Aspect — Oriented Programming (aop)

---

## Chapter 1: The Problem AOP Solves

### 🔵 WHY: Cross-Cutting Concerns

## The Cross-Cutting Problem

WITHOUT AOP (Logging everywhere):
@Service
public class UserService {
public User findById(Long id) {
log.info("Entering findById with id={}", id); // REPEATED!
long start = System.currentTimeMillis(); // REPEATED!
try { // REPEATED!
User user = userRepo.findById(id);
log.info("Exiting findById, took {}ms",
System.currentTimeMillis() - start); // REPEATED!
return user;
} catch (Exception e) { // REPEATED!
log.error("Error in findById", e); // REPEATED!
throw e;
}
}
public void createUser(User user) {
log.info("Entering createUser"); // REPEATED!
long start = System.currentTimeMillis(); // REPEATED!
// Same boilerplate... in EVERY method!
}
}

**Problems**:

- ❌ Code duplication everywhere
- ❌ Business logic buried under infrastructure code
- ❌ Adding new concern (security?) = modify every method
- ❌ Hard to maintain, easy to forget

### The AOP Solution

🔬 **Section Challenge — The Cross-Cutting Problem**

**Challenge 1 (Reasoning):** Why should you use `@ControllerAdvice` to handle exceptions globally instead of using `try-catch` blocks inside every single Controller method?

<details><summary>Answer</summary>

Separation of Concerns. Controllers should only focus on mapping requests and delegating to services (the "Happy Path"). Cluttering them with repetitive `try-catch` blocks violates the DRY principle and makes code unreadable. `@ControllerAdvice` acts as a global interceptor that catches exceptions thrown anywhere in the application and translates them into standardized HTTP responses (e.g., `ProblemDetail` or `ErrorResponse`), ensuring a consistent API contract across hundreds of endpoints.

</details>

## With Aop (Separation Of Concerns)

@Service
public class UserService {
public User findById(Long id) {
return userRepo.findById(id); // Pure business logic!
}
public void createUser(User user) {
userRepo.save(user); // Clean!
}
}
@Aspect
@Component
public class LoggingAspect {
@Around("execution(_ com.example.service._.\*(..))")
public Object logMethod(ProceedingJoinPoint pjp) {
// Logging logic defined ONCE, applied everywhere!
}
}

**Benefits**:

- ✅ Business logic is clean and focused
- ✅ Cross-cutting logic defined once
- ✅ Easy to add/remove/modify concerns
- ✅ Single Responsibility Principle maintained

---

## Chapter 2: AOP Terminology

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    AOP VOCABULARY                                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌────────────────┬────────────────────────────────────────────────────────────┐│
│  │ Term           │ Definition                                                 ││
│  ├────────────────┼────────────────────────────────────────────────────────────┤│
│  │ Aspect         │ Module containing cross-cutting logic (like LoggingAspect)│ │
│  │ Advice         │ Action taken (before, after, around a method)             │ │
│  │ Join Point     │ Point in execution (method call, exception thrown)        │ │
│  │ Pointcut       │ Expression selecting join points (which methods)          │ │
│  │ Target         │ Object being advised (original bean)                      │ │
│  │ Proxy          │ Wrapper object created by Spring (contains advice)        │ │
│  │ Weaving        │ Process of applying aspects to targets                    │ │
│  └────────────────┴────────────────────────────────────────────────────────────┘│
│                                                                                 │
│  VISUAL METAPHOR:                                                               │
│                                                                                 │
│  Aspect = Security guard rules                                                  │
│  Advice = Check ID, log entry, call police                                      │
│  Join Point = Every door in the building                                        │
│  Pointcut = "Front entrance and emergency exits"                                │
│  Target = The actual rooms behind the doors                                     │
│  Proxy = The security checkpoint                                                │
│  Weaving = Installing the security system                                       │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

🔬 **Section Challenge — Chapter 2: AOP Terminology**

**Challenge 1 (Terminology Trace — Who/When/What):** Map these 5 AOP terms to a Spring logging example that logs every public service method's execution time. **Who** is the `Aspect`, **what** is the `JoinPoint`, **what** is the `Pointcut`, **when** does the `Advice` run, and **what** is the `Weaving` step?

<details><summary>Answer</summary>

**Aspect:** `@Aspect @Component class ExecutionTimeAspect` — the class that packages the cross-cutting concern (timing). **JoinPoint:** Every method execution in the `com.app.service` package — a specific point in execution. The `JoinPoint` object gives you method name, args, target object. **Pointcut:** `@Pointcut("execution(public * com.app.service.*.*(..))")` — the EXPRESSION that selects which JoinPoints. The pointcut is the WHERE. **Advice:** `@Around` method that calls `System.currentTimeMillis()` before `proceedingJoinPoint.proceed()` and after — this is the WHAT and WHEN. Around = before + after. **Weaving:** Spring Boot does **runtime weaving** — at startup, Spring wraps your `UserService` bean in a CGLIB proxy. The proxy intercepts calls, runs advice, then delegates to the real method. Unlike AspectJ's compile-time weaving, Spring's is entirely proxy-based. Weaving = the HOW of connecting aspects to code.

</details>

Separation of Concerns. Controllers should only focus on mapping requests and delegating to services (the "Happy Path"). Cluttering them with repetitive `try-catch` blocks violates the DRY principle and makes code unreadable. `@ControllerAdvice` acts as a global interceptor that catches exceptions thrown anywhere in the application and translates them into standardized HTTP responses (e.g., `ProblemDetail` or `ErrorResponse`), ensuring a consistent API contract across hundreds of endpoints.

</details>

## Chapter 3: Advice Types

### 🟢 HOW: All Five Advice Types

```java
@Aspect
@Component
public class ComprehensiveAspect {

    // ═══════════════════════════════════════════════════════════════════════════
    // 1. @Before - Runs BEFORE method execution
    // ═══════════════════════════════════════════════════════════════════════════
    /*
     * USE CASES:
     * - Logging method entry
     * - Security checks (before proceeding)
     * - Validating parameters
     *
     * CANNOT:
     * - Stop method execution (use @Around for that)
     * - Modify return value
     */
    @Before("execution(* com.example.service.*.*(..))")
    public void beforeAdvice(JoinPoint jp) {
        log.info("Before: {}.{}()",
            jp.getSignature().getDeclaringTypeName(),
            jp.getSignature().getName());

        // Access method arguments
        Object[] args = jp.getArgs();
        log.info("Arguments: {}", Arrays.toString(args));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 2. @After - Runs AFTER method (always, like finally)
    // ═══════════════════════════════════════════════════════════════════════════
    /*
     * USE CASES:
     * - Cleanup resources
     * - Logging method exit (regardless of outcome)
     *
     * RUNS: Always, whether method succeeds or throws
     */
    @After("execution(* com.example.service.*.*(..))")
    public void afterAdvice(JoinPoint jp) {
        log.info("After: {} (success or failure)", jp.getSignature().getName());
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 3. @AfterReturning - Runs AFTER successful return
    // ═══════════════════════════════════════════════════════════════════════════
    /*
     * USE CASES:
     * - Processing return values
     * - Caching results
     * - Auditing successful operations
     *
     * DOES NOT RUN: If method throws exception
     */
    @AfterReturning(
        pointcut = "execution(* com.example.service.*.*(..))",
        returning = "result")  // Bind return value to parameter
    public void afterReturningAdvice(JoinPoint jp, Object result) {
        log.info("Method {} returned: {}", jp.getSignature().getName(), result);

        // Can read but NOT modify the result here
        // Use @Around if you need to modify
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 4. @AfterThrowing - Runs AFTER exception is thrown
    // ═══════════════════════════════════════════════════════════════════════════
    /*
     * USE CASES:
     * - Exception logging
     * - Sending alerts
     * - Audit failed operations
     *
     * CANNOT: Suppress the exception (use @Around for that)
     */
    @AfterThrowing(
        pointcut = "execution(* com.example.service.*.*(..))",
        throwing = "ex")  // Bind exception to parameter
    public void afterThrowingAdvice(JoinPoint jp, Exception ex) {
        log.error("Method {} threw: {}",
            jp.getSignature().getName(),
            ex.getMessage());

        // Exception will still propagate!
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 5. @Around - Full control (most powerful)
    // ═══════════════════════════════════════════════════════════════════════════
    /*
     * USE CASES:
     * - Performance timing
     * - Caching with conditional execution
     * - Transaction management (@Transactional uses this!)
     * - Retrying failed operations
     * - Modifying arguments or return values
     *
     * CAN:
     * - Prevent method execution
     * - Modify arguments
     * - Modify return value
     * - Catch and handle exceptions
     * - Call method multiple times (retry logic)
     */
    @Around("execution(* com.example.service.*.*(..))")
    public Object aroundAdvice(ProceedingJoinPoint pjp) throws Throwable {
        String methodName = pjp.getSignature().getName();

        // BEFORE
        log.info("Before: {}", methodName);
        long startTime = System.currentTimeMillis();

        try {
            // Call the actual method
            Object result = pjp.proceed();  // MUST call this or method won't run!

            // AFTER SUCCESS
            log.info("After success: {} returned {}", methodName, result);
            return result;  // Can modify before returning!

        } catch (Exception e) {
            // AFTER EXCEPTION
            log.error("After exception: {} threw {}", methodName, e.getMessage());
            throw e;  // Or handle it, return default value, etc.

        } finally {
            // ALWAYS (like @After)
            long duration = System.currentTimeMillis() - startTime;
            log.info("Duration: {}ms", duration);
        }
    }
}
```

### Advice Execution Order

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    ADVICE EXECUTION ORDER                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  METHOD CALL: userService.findById(1)                                           │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                                                                          │   │
│  │  @Around (before proceed) ────────────────────────────┐                 │    │
│  │      │                                                 │                 │   │
│  │      ▼                                                 │                 │   │
│  │  @Before ─────────────────────────────────────┐       │                 │    │
│  │      │                                         │       │                 │   │
│  │      ▼                                         │       │                 │   │
│  │  ═══════════════════════════════════════════  │       │                 │    │
│  │  ║     ACTUAL METHOD EXECUTION            ║  │       │                 │     │
│  │  ═══════════════════════════════════════════  │       │                 │    │
│  │      │                                         │       │                 │   │
│  │      ▼ (if success)        ▼ (if exception)   │       │                 │    │
│  │  @AfterReturning        @AfterThrowing ───────┘       │                 │    │
│  │      │                      │                          │                 │   │
│  │      └───────┬──────────────┘                          │                 │   │
│  │              ▼                                         │                 │   │
│  │          @After ───────────────────────────────────────┘                │    │
│  │              │                                                           │   │
│  │              ▼                                                           │   │
│  │  @Around (after proceed) ────────────────────────────────────────────   │    │
│  │                                                                          │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

🔬 **Section Challenge — Chapter 3: Advice Types**

**Challenge 1 (Trace — Who/When/What):** You have `@Around` and `@Before` advice on the same method. **Who** executes first? **When** does `@Around` call `proceed()`? **What** happens if `@Around` never calls `proceed()`?\n\n<details><summary>Answer</summary>\n\n**Who executes first?** `@Around` always wraps `@Before`/`@After`. Call stack: Around (enter) → Before → Method → After → Around (exit). **When `proceed()` called?** `proceed()` is the pivot point — everything BEFORE `proceed()` is pre-processing, everything AFTER is post-processing. `@Before` advice runs when `proceed()` is called. **If `proceed()` never called?** The target method and ALL remaining advice (`@Before`, `@After`, `@AfterReturning`) are SKIPPED. The `@Around` advice effectively intercepts and replaces the method call. This is intentional for caching (`@Cacheable` checks cache, returns cached value without calling proceed if cache hit), circuit breakers (returns fallback without calling the actual method).\n\n</details>

**Challenge 2 (Bug Hunt):** A method returns `(T) jsonDeserialize(json)` where T is a generic type param. When does the `ClassCastException` actually occur?

<details><summary>Answer</summary>

NOT at the cast — the unchecked cast compiles to nothing at runtime (erasure). The CCE occurs when the calling code tries to USE the returned value as a specific type. This makes debugging hard: the error appears far from the actual source. Use `Class<T> clazz` parameter to do safe `clazz.cast(...)` instead.

</details>

## Chapter 4: Pointcut Expressions

### 🟢 HOW: Selecting Which Methods to Advise

```java
@Aspect
@Component
public class PointcutExamplesAspect {

    // ═══════════════════════════════════════════════════════════════════════════
    // EXECUTION POINTCUT (Most common - matches method execution)
    // ═══════════════════════════════════════════════════════════════════════════

    /*
     * SYNTAX: execution(modifiers? return-type declaring-type? method-name(params) throws?)
     *
     * WILDCARDS:
     * *      = any single element (one package, one method name, one param)
     * ..     = any number of elements (subpackages, any params)
     * +      = subclasses
     */

    // All methods in service package
    @Pointcut("execution(* com.example.service.*.*(..))")
    public void serviceLayer() {}

    // All methods in service package AND subpackages
    @Pointcut("execution(* com.example.service..*.*(..))")
    public void serviceLayerDeep() {}

    // Only public methods
    @Pointcut("execution(public * com.example.service.*.*(..))")
    public void publicServiceMethods() {}

    // Only methods returning void
    @Pointcut("execution(void com.example.service.*.*(..))")
    public void voidServiceMethods() {}

    // Methods with specific name pattern
    @Pointcut("execution(* com.example.service.*.find*(..))")  // findById, findAll, findByName
    public void findMethods() {}

    // Methods with specific parameter pattern
    @Pointcut("execution(* com.example.service.*.*(Long, ..))")  // First param is Long
    public void methodsWithLongFirstParam() {}

    // ═══════════════════════════════════════════════════════════════════════════
    // WITHIN POINTCUT (Matches all methods in a type)
    // ═══════════════════════════════════════════════════════════════════════════

    // All methods in UserService
    @Pointcut("within(com.example.service.UserService)")
    public void withinUserService() {}

    // All methods in any class in service package
    @Pointcut("within(com.example.service.*)")
    public void withinServicePackage() {}

    // ═══════════════════════════════════════════════════════════════════════════
    // ANNOTATION POINTCUT (Matches annotated methods/classes)
    // ═══════════════════════════════════════════════════════════════════════════

    // Methods annotated with @Transactional
    @Pointcut("@annotation(org.springframework.transaction.annotation.Transactional)")
    public void transactionalMethods() {}

    // Classes annotated with @Service
    @Pointcut("@within(org.springframework.stereotype.Service)")
    public void serviceBeans() {}

    // Methods in classes annotated with @RestController
    @Pointcut("@target(org.springframework.web.bind.annotation.RestController)")
    public void restControllerMethods() {}

    // ═══════════════════════════════════════════════════════════════════════════
    // ARGS POINTCUT (Matches by argument types)
    // ═══════════════════════════════════════════════════════════════════════════

    // Methods that take exactly one Long argument
    @Pointcut("args(Long)")
    public void methodsWithSingleLong() {}

    // Methods where first argument is User
    @Pointcut("args(com.example.model.User, ..)")
    public void methodsWithUserFirstArg() {}

    // ═══════════════════════════════════════════════════════════════════════════
    // COMBINING POINTCUTS (Boolean operators)
    // ═══════════════════════════════════════════════════════════════════════════

    // AND: Service layer AND transactional
    @Pointcut("serviceLayer() && transactionalMethods()")
    public void transactionalServiceMethods() {}

    // OR: Service layer OR controller
    @Pointcut("serviceLayer() || withinControllers()")
    public void serviceOrController() {}

    // NOT: Service layer but NOT findMethods
    @Pointcut("serviceLayer() && !findMethods()")
    public void nonFindServiceMethods() {}

    // Complex combination
    @Pointcut("execution(public * *(..)) && within(com.example..*) && !@annotation(Ignore)")
    public void allPublicExceptIgnored() {}

    // ═══════════════════════════════════════════════════════════════════════════
    // USING POINTCUTS IN ADVICE
    // ═══════════════════════════════════════════════════════════════════════════

    @Before("serviceLayer()")
    public void beforeServiceMethod(JoinPoint jp) {
        // Applies to all service methods
    }

    // Or inline
    @Before("execution(* com.example.service.*.*(..))")
    public void beforeInlinePointcut(JoinPoint jp) {
        // Same as above
    }

    // Binding arguments via pointcut
    @Before("execution(* com.example.service.UserService.findById(Long)) && args(id)")
    public void beforeFindById(JoinPoint jp, Long id) {
        log.info("Finding user by id: {}", id);  // id is directly accessible!
    }

    // Binding annotation via pointcut
    @Before("@annotation(loggable)")
    public void beforeLoggableMethod(JoinPoint jp, Loggable loggable) {
        log.info("Logging level: {}", loggable.level());  // Access annotation attributes!
    }
}
```

---

🔬 **Section Challenge — Chapter 4: Pointcut Expressions**

**Challenge 1 (Expression Debug):** You write pointcut `"execution(* com.app.service.*.*(..))"` to intercept all service methods. But your `OrderServiceImpl` in `com.app.service.impl` is NOT intercepted. **Who** is the scope that excludes it? **What** is the corrected expression, and **what** is the difference between `.*.` and `..*` in pointcut syntax?

<details><summary>Answer</summary>

**Who excludes it:** The single-level wildcard `*`. `com.app.service.*.*` matches classes DIRECTLY in `com.app.service` package, NOT subpackages. `OrderServiceImpl` is in `com.app.service.impl` (one level deeper). **Corrected expression:** `"execution(* com.app.service..*.*(..))"` — note `..` instead of first `.*`. **Difference between `.*.` and `..*`:** `.*.` = single-level package wildcard (one subdirectory level). `..*` = multi-level package wildcard (any depth of subpackages). So `com.app.service..*.*` matches: `com.app.service.UserService.save()`, `com.app.service.impl.UserServiceImpl.save()`, `com.app.service.order.impl.OrderServiceImpl.process()`. **Common mistake:** Using `.*.*` thinking it means "all classes in this tree" — it only means "all classes in the EXACT package". The `..` token is the subtree selector in pointcut expressions.

</details>

Separation of Concerns. Controllers should only focus on mapping requests and delegating to services (the "Happy Path"). Cluttering them with repetitive `try-catch` blocks violates the DRY principle and makes code unreadable. `@ControllerAdvice` acts as a global interceptor that catches exceptions thrown anywhere in the application and translates them into standardized HTTP responses (e.g., `ProblemDetail` or `ErrorResponse`), ensuring a consistent API contract across hundreds of endpoints.

</details>

## Chapter 5: How Spring AOP Works (Proxy Magic)

### 🔵 WHY: Understanding the Limitations

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    SPRING AOP = PROXY-BASED AOP                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ORIGINAL BEAN:                                                                 │
│  ┌────────────────────────────────────────┐                                     │
│  │          UserService                    │                                    │
│  │  ┌──────────────────────────────────┐  │                                     │
│  │  │ findById(Long id)                │  │                                     │
│  │  └──────────────────────────────────┘  │                                     │
│  │  ┌──────────────────────────────────┐  │                                     │
│  │  │ createUser(User user)            │  │                                     │
│  │  └──────────────────────────────────┘  │                                     │
│  └────────────────────────────────────────┘                                     │
│                                                                                 │
│  AFTER AOP (What Spring actually injects):                                      │
│  ┌────────────────────────────────────────────────────────────────────┐         │
│  │                    PROXY                                            │        │
│  │  ┌──────────────────────────────────────────────────────────────┐  │         │
│  │  │ findById(Long id)                                             │  │        │
│  │  │   → Execute @Before advice                                    │  │        │
│  │  │   → Execute @Around advice (before)                          │  │         │
│  │  │   → Delegate to REAL UserService.findById()                  │  │         │
│  │  │   → Execute @Around advice (after)                           │  │         │
│  │  │   → Execute @AfterReturning advice                           │  │         │
│  │  └──────────────────────────────────────────────────────────────┘  │         │
│  │                           │                                         │        │
│  │                    ┌──────▼──────┐                                  │        │
│  │                    │ REAL BEAN   │                                  │        │
│  │                    │ UserService │                                  │        │
│  │                    └─────────────┘                                  │        │
│  └────────────────────────────────────────────────────────────────────┘         │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Proxy Types: JDK Dynamic Proxy vs CGLIB

```java
/*
 * SPRING CREATES PROXIES USING TWO METHODS:
 *
 * 1. JDK DYNAMIC PROXY (Interface-based)
 *    - Used when: Bean implements interface
 *    - Pros: Standard Java, no extra dependencies
 *    - Cons: Can only proxy interface methods
 *
 * 2. CGLIB (Subclass-based)
 *    - Used when: Bean doesn't implement interface
 *    - Pros: Works with any class
 *    - Cons: Creates subclass, can't proxy final methods/classes
 *    - Default in Spring Boot!
 */

// JDK PROXY EXAMPLE
public interface UserService {
    User findById(Long id);
}

@Service
public class UserServiceImpl implements UserService {
    @Override
    public User findById(Long id) { ... }
}

// Spring creates: Proxy implements UserService
//                 Delegates to UserServiceImpl

// CGLIB PROXY EXAMPLE
@Service
public class ProductService {  // No interface!
    public Product findById(Long id) { ... }
}

// Spring creates: Subclass extends ProductService
//                 Overrides findById()

// FORCE CGLIB (in application.properties)
// spring.aop.proxy-target-class=true  (default in Boot)
```

### The Self-Invocation Problem

```java
@Service
public class UserService {

    @Transactional
    public void createUser(User user) {
        userRepo.save(user);
        sendWelcomeEmail(user);  // THIS CALL BYPASSES AOP!
    }

    @Transactional  // This annotation has NO EFFECT when called from createUser()
    public void sendWelcomeEmail(User user) {
        // Not in a transaction!
    }
}

/*
 * WHY?
 *
 * External call:                    Self-invocation:
 *
 * Controller                        UserService.createUser()
 *     │                                  │
 *     ▼                                  │ (direct call, no proxy!)
 * [PROXY].createUser()                   │
 *     │                                  ▼
 *     ▼                             sendWelcomeEmail()  ← AOP bypassed!
 * Real.createUser()
 *     │
 *     ▼
 * [PROXY].sendWelcomeEmail()  ← AOP applied!
 *     │
 *     ▼
 * Real.sendWelcomeEmail()
 */

// SOLUTION 1: Inject self
@Service
public class UserService {

    @Autowired
    @Lazy  // Prevent circular dependency
    private UserService self;  // Inject the PROXY

    @Transactional
    public void createUser(User user) {
        userRepo.save(user);
        self.sendWelcomeEmail(user);  // Goes through proxy!
    }
}

// SOLUTION 2: Separate service
@Service
public class UserService {
    @Autowired
    private EmailService emailService;  // Different bean

    @Transactional
    public void createUser(User user) {
        userRepo.save(user);
        emailService.sendWelcomeEmail(user);  // Different proxy!
    }
}
```

---

🔬 **Section Challenge — Chapter 5: How Spring AOP Works (Proxy Magic)**

**Challenge 1 (Proxy Debug — Who/When/What):** You have `@Transactional UserService.save()`. Inside `save()`, you call `this.validate()`. `validate()` has a `@Cacheable` annotation. The cache is NEVER populated. **Who** is `this`? **When** is the proxy bypassed? **What** is the fix?

<details><summary>Answer</summary>

**Who is `this`:** The REAL `UserService` object — not the proxy. When Spring wraps `UserService` in a proxy, `this` inside the object still refers to itself directly, bypassing the proxy. **When proxy is bypassed:** Any time you call a method on `this` directly from within the same bean. The AOP proxy only intercepts external calls (from outside the bean). Internal `this.method()` calls skip the proxy entirely. **What is the fix:** (1) **Self-injection:** `@Autowired private UserService self;` then call `self.validate()`. This references the proxy. (2) **AOP-aware lookup:** `((UserService) AopContext.currentProxy()).validate()` — requires `@EnableAspectJAutoProxy(exposeProxy=true)`. (3) **Refactor:** Move `validate()` to a separate Spring bean (`ValidatorService`) so external injection routes through the proxy. **Why this matters:** `@Transactional`, `@Cacheable`, `@Async`, `@Retryable` ALL use Spring AOP proxies. Internal self-calls silently break all of them — no error, just wrong behavior.

</details>

Separation of Concerns. Controllers should only focus on mapping requests and delegating to services (the "Happy Path"). Cluttering them with repetitive `try-catch` blocks violates the DRY principle and makes code unreadable. `@ControllerAdvice` acts as a global interceptor that catches exceptions thrown anywhere in the application and translates them into standardized HTTP responses (e.g., `ProblemDetail` or `ErrorResponse`), ensuring a consistent API contract across hundreds of endpoints.

</details>

## Chapter 6: Practical AOP Examples

### Logging Aspect

```java
@Aspect
@Component
@Slf4j
public class LoggingAspect {

    @Around("@within(org.springframework.stereotype.Service)")
    public Object logServiceMethods(ProceedingJoinPoint pjp) throws Throwable {
        String className = pjp.getSignature().getDeclaringTypeName();
        String methodName = pjp.getSignature().getName();
        Object[] args = pjp.getArgs();

        // Mask sensitive data
        String maskedArgs = maskSensitiveData(args);

        log.info("→ {}.{}({})", className, methodName, maskedArgs);
        long start = System.currentTimeMillis();

        try {
            Object result = pjp.proceed();
            long duration = System.currentTimeMillis() - start;
            log.info("← {}.{} returned in {}ms", className, methodName, duration);
            return result;
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - start;
            log.error("✗ {}.{} failed in {}ms: {}",
                className, methodName, duration, e.getMessage());
            throw e;
        }
    }

    private String maskSensitiveData(Object[] args) {
        return Arrays.stream(args)
            .map(arg -> {
                if (arg == null) return "null";
                if (arg.toString().contains("password")) return "***";
                return arg.toString();
            })
            .collect(Collectors.joining(", "));
    }
}
```

### Performance Monitoring Aspect

```java
@Aspect
@Component
public class PerformanceAspect {

    private final MeterRegistry meterRegistry;

    @Around("@annotation(Timed)")
    public Object measureTime(ProceedingJoinPoint pjp) throws Throwable {
        String methodName = pjp.getSignature().toShortString();

        Timer.Sample sample = Timer.start(meterRegistry);
        String status = "success";

        try {
            return pjp.proceed();
        } catch (Exception e) {
            status = "error";
            throw e;
        } finally {
            sample.stop(Timer.builder("method.execution")
                .tag("method", methodName)
                .tag("status", status)
                .register(meterRegistry));
        }
    }
}

// Usage:
@Service
public class OrderService {

    @Timed  // Custom annotation
    public Order processOrder(Order order) {
        // This method's execution time is tracked
    }
}
```

### Retry Aspect

```java
@Aspect
@Component
public class RetryAspect {

    @Around("@annotation(retry)")
    public Object retryOnFailure(ProceedingJoinPoint pjp, Retry retry) throws Throwable {
        int maxAttempts = retry.maxAttempts();
        long delay = retry.delay();
        Class<? extends Exception>[] retryOn = retry.retryOn();

        Exception lastException = null;

        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return pjp.proceed();
            } catch (Exception e) {
                if (!shouldRetry(e, retryOn)) {
                    throw e;
                }
                lastException = e;
                log.warn("Attempt {}/{} failed: {}", attempt, maxAttempts, e.getMessage());

                if (attempt < maxAttempts) {
                    Thread.sleep(delay * attempt);  // Exponential backoff
                }
            }
        }

        throw lastException;
    }

    private boolean shouldRetry(Exception e, Class<? extends Exception>[] retryOn) {
        for (Class<? extends Exception> clazz : retryOn) {
            if (clazz.isInstance(e)) return true;
        }
        return false;
    }
}

// Custom annotation
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface Retry {
    int maxAttempts() default 3;
    long delay() default 1000;
    Class<? extends Exception>[] retryOn() default { Exception.class };
}

// Usage:
@Service
public class ExternalApiService {

    @Retry(maxAttempts = 3, delay = 2000, retryOn = { IOException.class })
    public Response callExternalApi() {
        // Automatically retries on network failures
    }
}
```

---

# 🌱 Tier 4: Spring Boot Auto — Configuration

---

## Chapter 7: The Magic of @SpringBootApplication

### 🔵 WHY: How "It Just Works"

```java
// This single annotation enables Spring Boot magic
@SpringBootApplication
public class MyApplication {
    public static void main(String[] args) {
        SpringApplication.run(MyApplication.class, args);
    }
}

/*
 * @SpringBootApplication is a COMPOSITE ANNOTATION:
 *
 * @SpringBootConfiguration  → Marks as configuration class
 * @EnableAutoConfiguration  → THE MAGIC! Auto-configure based on classpath
 * @ComponentScan            → Scan for @Component in this package and below
 */

// WHAT HAPPENS AT STARTUP:
// 1. Spring scans classpath for JARs
// 2. For each JAR, checks META-INF/spring.factories (or spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports)
// 3. Loads AutoConfiguration classes
// 4. Each AutoConfiguration has @Conditional annotations
// 5. Only beans matching conditions are created

// EXAMPLE: DataSourceAutoConfiguration
// Condition: @ConditionalOnClass(DataSource.class)
// If HikariCP JAR is present, creates HikariDataSource
// If Tomcat JDBC JAR is present, creates Tomcat DataSource
// You don't configure anything!
```

### Understanding Auto-Configuration Classes

```java
// SIMPLIFIED DataSourceAutoConfiguration
@Configuration
@ConditionalOnClass(DataSource.class)
@EnableConfigurationProperties(DataSourceProperties.class)
public class DataSourceAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean  // Only if you haven't defined your own DataSource
    public DataSource dataSource(DataSourceProperties props) {
        return DataSourceBuilder.create()
            .url(props.getUrl())
            .username(props.getUsername())
            .password(props.getPassword())
            .build();
    }
}

// SIMPLIFIED WebMvcAutoConfiguration
@Configuration
@ConditionalOnClass(Servlet.class, DispatcherServlet.class)
@ConditionalOnWebApplication(type = Type.SERVLET)
public class WebMvcAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean
    public DispatcherServlet dispatcherServlet() {
        return new DispatcherServlet();
    }

    @Bean
    @ConditionalOnMissingBean
    public RequestMappingHandlerMapping requestMappingHandlerMapping() {
        return new RequestMappingHandlerMapping();
    }
}

/*
 * KEY PRINCIPLE: Auto-configuration is OPINIONATED but OVERRIDABLE
 *
 * Spring Boot says: "If you have HikariCP, here's a DataSource configured this way"
 * You say: "No, I want to configure it differently"
 * Spring Boot: "OK, use yours instead" (@ConditionalOnMissingBean)
 */
```

### Customizing Auto-Configuration

```java
// METHOD 1: Override via properties (application.yml)
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/mydb
    username: root
    password: secret
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5

// METHOD 2: Provide your own bean (overrides auto-config)
@Configuration
public class CustomDataSourceConfig {

    @Bean  // This replaces auto-configured DataSource
    public DataSource dataSource() {
        HikariDataSource ds = new HikariDataSource();
        ds.setJdbcUrl("jdbc:mysql://localhost:3306/mydb");
        ds.setMaximumPoolSize(50);
        ds.setConnectionTimeout(30000);
        return ds;
    }
}

// METHOD 3: Exclude auto-configuration entirely
@SpringBootApplication(exclude = { DataSourceAutoConfiguration.class })
public class MyApplication { }

// Or via properties
spring:
  autoconfigure:
    exclude:
      - org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration
```

### Debugging Auto-Configuration

```bash


🔬 **Section Challenge — Chapter 7: The Magic of @SpringBootApplication**

**Challenge 1 (Annotation Internals):** `@SpringBootApplication` is a meta-annotation composed of 3 annotations. **What** are they, **who** triggers auto-configuration, and **when** does `@ConditionalOnMissingBean` fire to prevent double-registering a DataSource?

<details><summary>Answer</summary>

**Three composing annotations:** (1) `@SpringBootConfiguration` — marks this as a Spring `@Configuration` class (equivalent to `@Configuration`). (2) `@EnableAutoConfiguration` — triggers the auto-configuration mechanism: reads `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports` and conditionally registers beans. (3) `@ComponentScan` — scans the package and sub-packages of the class for `@Component`, `@Service`, `@Repository`, `@Controller`. **Who triggers auto-config:** `@EnableAutoConfiguration` instructs Spring to load `DataSourceAutoConfiguration`, `JpaAutoConfiguration`, etc. from the classpath. **When @ConditionalOnMissingBean fires:** During the `BeanFactory` refresh phase, AFTER user-defined `@Configuration` beans are processed, BEFORE auto-config beans run. If you defined `@Bean DataSource myDataSource()` in your own config, `@ConditionalOnMissingBean(DataSource.class)` evaluates `true` (bean already exists) — auto-config skips its DataSource. Your custom bean wins. This is why `@ConditionalOnMissingBean` is the "user overrides framework" mechanism: the auto-config only fills in what you haven't explicitly provided.

</details>

Separation of Concerns. Controllers should only focus on mapping requests and delegating to services (the "Happy Path"). Cluttering them with repetitive `try-catch` blocks violates the DRY principle and makes code unreadable. `@ControllerAdvice` acts as a global interceptor that catches exceptions thrown anywhere in the application and translates them into standardized HTTP responses (e.g., `ProblemDetail` or `ErrorResponse`), ensuring a consistent API contract across hundreds of endpoints.
</details>


# See what auto-configuration is happening
java -jar myapp.jar --debug

# Or in application.properties
debug=true

# Output shows:
# POSITIVE MATCHES (auto-config applied)
# NEGATIVE MATCHES (conditions not met)
# UNCONDITIONAL CLASSES (always applied)
```

---

## Chapter 8: Configuration Properties

### 🔵 WHY: Type-Safe Configuration

```java
// BAD: @Value everywhere (no validation, scattered)
@Service
public class EmailService {

    @Value("${email.host}")
    private String host;

    @Value("${email.port}")
    private int port;

    @Value("${email.username}")
    private String username;

    // Problems:
    // ❌ No compile-time validation
    // ❌ Configuration scattered across classes
    // ❌ No IDE completion
    // ❌ Hard to test
}

// GOOD: @ConfigurationProperties (type-safe, centralized)
@ConfigurationProperties(prefix = "email")
@Validated  // Enable JSR-380 validation
public class EmailProperties {

    @NotBlank
    private String host;

    @Min(1)
    @Max(65535)
    private int port = 587;  // Default value

    @NotBlank
    private String username;

    @NotBlank
    private String password;

    private Duration timeout = Duration.ofSeconds(30);

    private Retry retry = new Retry();  // Nested configuration

    public static class Retry {
        private int maxAttempts = 3;
        private Duration delay = Duration.ofSeconds(1);
        // Getters/setters
    }

    // Getters and setters
}
```

### Using Configuration Properties

```yaml
# application.yml
email:
  host: smtp.gmail.com
  port: 587
  username: myapp@gmail.com
  password: ${EMAIL_PASSWORD} # From environment variable
  timeout: 45s
  retry:
    max-attempts: 5
    delay: 2s
```

```java
// Enable in your main class
@SpringBootApplication
@EnableConfigurationProperties(EmailProperties.class)
public class MyApplication { }

// Or use @ConfigurationPropertiesScan (auto-discovers)
@SpringBootApplication
@ConfigurationPropertiesScan("com.example.config")
public class MyApplication { }

// Inject and use
@Service
public class EmailService {

    private final EmailProperties properties;

    public EmailService(EmailProperties properties) {
        this.properties = properties;
    }

    public void send(Email email) {
        // Access with IDE completion and type safety
        String host = properties.getHost();
        int maxRetries = properties.getRetry().getMaxAttempts();
    }
}
```

---

## Chapter 9: Profiles in Spring Boot

### 🔵 WHY: Environment-Specific Configuration

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    PROFILE-BASED CONFIGURATION                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  application.yml          → Default (always loaded)                             │
│  application-dev.yml      → Development (local)                                 │
│  application-test.yml     → Testing (CI/CD)                                     │
│  application-staging.yml  → Staging (pre-prod)                                  │
│  application-prod.yml     → Production                                          │
│                                                                                 │
│  LOADING ORDER (later overrides earlier):                                       │
│  1. application.yml                                                             │
│  2. application-{profile}.yml                                                   │
│  3. Environment variables                                                       │
│  4. Command line arguments                                                      │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

```yaml


🔬 **Section Challenge — Chapter 9: Profiles in Spring Boot**

**Challenge 1 (Profile Debug — Who/When/What):** You have `application-dev.yml` with `spring.datasource.url=jdbc:h2:mem:testdb` and `application-prod.yml` with the real PostgreSQL URL. You deploy to production but it's connecting to H2. **Who** determines the active profile? **When** is it resolved? **What** are the 4 ways to set the active profile in order of precedence?

<details><summary>Answer</summary>

**Who determines active profile:** The `Environment` abstraction in Spring — it evaluates all property sources and resolves `spring.profiles.active`. **When resolved:** At application context startup, before beans are instantiated. Once resolved, profile-specific property files are loaded and merged. **4 ways in ORDER OF PRECEDENCE (highest to lowest):** (1) **Command line argument:** `--spring.profiles.active=prod` (overrides everything). (2) **Environment variable:** `SPRING_PROFILES_ACTIVE=prod` (set by Docker/Kubernetes). (3) **JVM system property:** `-Dspring.profiles.active=prod` (set in startup script). (4) **`application.properties/yml`:** `spring.profiles.active=dev` (lowest — the default). **Why H2 was used in prod:** The deployment script was missing the env var / CLI arg, so Spring fell back to `application.yml` which had `spring.profiles.active=dev` as a default. **Fix:** `export SPRING_PROFILES_ACTIVE=prod` in the production deployment script, OR in Kubernetes: `env: [{name: SPRING_PROFILES_ACTIVE, value: prod}]`.

</details>

Separation of Concerns. Controllers should only focus on mapping requests and delegating to services (the "Happy Path"). Cluttering them with repetitive `try-catch` blocks violates the DRY principle and makes code unreadable. `@ControllerAdvice` acts as a global interceptor that catches exceptions thrown anywhere in the application and translates them into standardized HTTP responses (e.g., `ProblemDetail` or `ErrorResponse`), ensuring a consistent API contract across hundreds of endpoints.
</details>


# application.yml (defaults)
spring:
    application:
        name: my-service
    jpa:
        show-sql: false

server:
    port: 8080

---
# application-dev.yml
spring:
    datasource:
        url: jdbc:h2:mem:devdb
    jpa:
        show-sql: true
        hibernate:
            ddl-auto: create-drop

logging:
    level:
        com.example: DEBUG

---
# application-prod.yml
spring:
    datasource:
        url: jdbc:mysql://prod-db:3306/myapp
        hikari:
            maximum-pool-size: 50
    jpa:
        hibernate:
            ddl-auto: validate

logging:
    level:
        root: WARN
        com.example: INFO
```

### Activating Profiles

```bash
# Command line
java -jar myapp.jar --spring.profiles.active=prod

# Environment variable
export SPRING_PROFILES_ACTIVE=prod

# In application.yml
spring:
  profiles:
    active: dev

# Multiple profiles
spring:
  profiles:
    active: prod,monitoring,async

# In tests
@SpringBootTest
@ActiveProfiles("test")
class MyTest { }
```

---

# 📋 TIER 3 & 4 CHECKLIST

```
AOP CONCEPTS:
□ Can explain cross-cutting concerns
□ Know all 5 advice types and when to use each
□ Can write pointcut expressions (execution, within, @annotation)
□ Understand proxy types (JDK vs CGLIB)
□ Know the self-invocation problem and solutions

SPRING BOOT:
□ Know what @SpringBootApplication does (3 annotations)
□ Understand auto-configuration conditions
□ Can customize/override auto-configuration
□ Know debugging techniques (--debug flag)

CONFIGURATION:
□ Can use @ConfigurationProperties (type-safe)
□ Know property source loading order
□ Can use profiles effectively
□ Understand externalized configuration
```

---

_Continue to Part 4: Data Access (JPA & Hibernate), Security, Web & Testing_

---

> **Navigation**: [< Previous](Ch32_SB_Data_Part2.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](Ch34_SB_Security_Part4.md)
