# 47. Java Reflection & Custom Annotations — The Complete Deep Dive

> **Navigation**: [< Java Networking & NIO](Ch13_Networking_NIO.md) | [Back to Index](../00_MASTER_INDEX.md) | [Events & Listeners >](Ch11_Events_Listeners.md)

---

## 🎯 The 5W1H Framework

Before we touch any code, let's answer the fundamental questions:

```
╔══════════════════════════════════════════════════════════════════╗
║  WHAT = Java Reflection is a way to inspect and manipulate       ║
║         classes, methods, fields AT RUNTIME (not compile time)   ║
║                                                                  ║
║  WHY  = Frameworks like Spring can't know YOUR classes at        ║
║         compile time, so they discover them at runtime           ║
║                                                                  ║
║  WHEN = Framework building, testing, serialization, plugins,     ║
║         dependency injection, ORM mapping                        ║
║                                                                  ║
║  WHERE = Spring (@Autowired), Hibernate (@Entity), JUnit (@Test) ║
║          Jackson (@JsonProperty), Lombok (compile-time version)  ║
║                                                                  ║
║  WHO  = Framework builders use it directly                       ║
║         Application devs use it indirectly (via annotations)     ║
║                                                                  ║
║  HOW  = java.lang.reflect package + java.lang.Class              ║
╚══════════════════════════════════════════════════════════════════╝
```

---

## 1. What is Reflection? — The Mental Model

Think of it like this:

```
NORMAL CODE (Compile Time):
  You write: new UserService()
  Compiler checks: ✅ UserService class exists
  JVM runs: Creates UserService object
  
  → You KNOW the class name when writing code

REFLECTION (Runtime):
  Framework reads: @Service annotation on some class
  Framework discovers: "Oh, there's a class called UserService"
  Framework creates: Class.forName("UserService").newInstance()
  
  → Framework DISCOVERS class names while running
```

### Real-World Analogy

```
┌─────────────────────────────────────────────┐
│ NORMAL CODE = Calling a friend by name      │
│   "Hey Harsha, come here!"                  │
│   (You know who you're calling)             │
│                                             │
│ REFLECTION = Looking at a phone book        │
│   "Who has annotation @Available?"          │
│   "Oh, Harsha, Ravi, Priya are available"   │
│   "Call all of them!"                       │
│   (You discover people at runtime)          │
└─────────────────────────────────────────────┘
```

---

## 2. The `Class<?>` Object — Everything Starts Here

Every loaded class has exactly ONE `Class<?>` object in the JVM:

```java
// 3 ways to get a Class object
// Way 1: From an instance
User user = new User();
Class<?> c1 = user.getClass();

// Way 2: From the class literal
Class<?> c2 = User.class;

// Way 3: From a string (fully qualified name)
Class<?> c3 = Class.forName("com.example.User");

// All three return the SAME object
System.out.println(c1 == c2);  // true
System.out.println(c2 == c3);  // true
```

### What Can You Discover From `Class<?>`?

```java
Class<?> clazz = User.class;

// Class info
clazz.getName();          // "com.example.User"
clazz.getSimpleName();    // "User"
clazz.getPackageName();   // "com.example"
clazz.getSuperclass();    // class java.lang.Object
clazz.getInterfaces();    // [Serializable, Comparable]
clazz.getModifiers();     // int → decode with Modifier.isPublic(), etc.

// Discover everything
clazz.getDeclaredFields();       // ALL fields (including private)
clazz.getDeclaredMethods();      // ALL methods (including private)
clazz.getDeclaredConstructors(); // ALL constructors
clazz.getAnnotations();          // ALL annotations on this class

// vs. getFields() / getMethods() → only PUBLIC, including inherited
```

```
┌──────────────────────────────────────────────────┐
│ getDeclared___()  = THIS class only, ALL access   │
│ get___()          = THIS + parents, PUBLIC only    │
│                                                    │
│ Use getDeclared for private field hacking          │
│ Use get___ for public API discovery                │
└──────────────────────────────────────────────────┘
```

---



> 🔬 **Section Challenge — 2. The `Class<?>` Object — Everything Starts Here**
>
> **Challenge 1 (Reasoning):** `ExecutorService.submit(task)` — the task throws a `RuntimeException`. Nobody calls `future.get()`. What happens to the exception?
> <details><summary>Answer</summary>
>
> It's silently swallowed. The exception is stored in the `Future` object. Without `future.get()` or `.whenComplete()`, no one ever sees it. The thread pool thread resets and picks up the next task as if nothing happened. This is one of the most dangerous production bugs. Fix: always attach `future.whenComplete((r,ex) -> { if(ex!=null) log.error("Task failed",ex); })` or use `execute()` + `UncaughtExceptionHandler`.
> </details>
>

## 3. Inspecting Fields

```java
public class User {
    private Long id;
    private String name;
    private int age;
    public String email;
}

// Get ALL fields (including private)
Field[] fields = User.class.getDeclaredFields();

for (Field field : fields) {
    System.out.println(
        field.getName() + " : " + 
        field.getType().getSimpleName() + " : " +
        (Modifier.isPrivate(field.getModifiers()) ? "private" : "public")
    );
}
// Output:
// id : Long : private
// name : String : private
// age : int : private    
// email : String : public
```

### Reading/Writing Private Fields

```java
User user = new User();
user.setName("Harsha");

Field nameField = User.class.getDeclaredField("name");
nameField.setAccessible(true);  // ← BYPASS private access!

// READ private field
String name = (String) nameField.get(user);
System.out.println(name);  // "Harsha"

// WRITE private field
nameField.set(user, "Changed!");
System.out.println(user.getName());  // "Changed!"
```

> **⚠️ Interview Alert**: `setAccessible(true)` breaks encapsulation. This is how:
> - **Spring** injects `@Autowired` private fields
> - **Jackson** reads/writes private fields for JSON
> - **Hibernate** hydrates entity objects from database rows

---



> 🔬 **Section Challenge — 3. Inspecting Fields**
>
> **Challenge 1 (Reasoning):** `ExecutorService.submit(task)` — the task throws a `RuntimeException`. Nobody calls `future.get()`. What happens to the exception?
> <details><summary>Answer</summary>
>
> It's silently swallowed. The exception is stored in the `Future` object. Without `future.get()` or `.whenComplete()`, no one ever sees it. The thread pool thread resets and picks up the next task as if nothing happened. This is one of the most dangerous production bugs. Fix: always attach `future.whenComplete((r,ex) -> { if(ex!=null) log.error("Task failed",ex); })` or use `execute()` + `UncaughtExceptionHandler`.
> </details>
>

## 4. Invoking Methods via Reflection

```java
public class Calculator {
    public int add(int a, int b) { return a + b; }
    private String secret() { return "hidden!"; }
}

Calculator calc = new Calculator();

// Invoke public method
Method addMethod = Calculator.class.getMethod("add", int.class, int.class);
int result = (int) addMethod.invoke(calc, 5, 3);
System.out.println(result);  // 8

// Invoke PRIVATE method
Method secretMethod = Calculator.class.getDeclaredMethod("secret");
secretMethod.setAccessible(true);
String secret = (String) secretMethod.invoke(calc);
System.out.println(secret);  // "hidden!"
```

### Method Lookup Pattern

```
getMethod(name, paramTypes...)
                │
                ├── name = "add"
                └── paramTypes = int.class, int.class
                
Why paramTypes? → Because of METHOD OVERLOADING
  add(int, int)     ← different from
  add(double, double)
  
Each overload is a DIFFERENT Method object
```

---



> 🔬 **Section Challenge — 4. Invoking Methods via Reflection**
>
> **Challenge 1 (Reasoning):** `ExecutorService.submit(task)` — the task throws a `RuntimeException`. Nobody calls `future.get()`. What happens to the exception?
> <details><summary>Answer</summary>
>
> It's silently swallowed. The exception is stored in the `Future` object. Without `future.get()` or `.whenComplete()`, no one ever sees it. The thread pool thread resets and picks up the next task as if nothing happened. This is one of the most dangerous production bugs. Fix: always attach `future.whenComplete((r,ex) -> { if(ex!=null) log.error("Task failed",ex); })` or use `execute()` + `UncaughtExceptionHandler`.
> </details>
>

## 5. Creating Objects via Reflection

```java
// Way 1: No-arg constructor
Class<?> clazz = Class.forName("com.example.User");
Object user = clazz.getDeclaredConstructor().newInstance();

// Way 2: Parameterized constructor
Constructor<?> ctor = clazz.getDeclaredConstructor(String.class, int.class);
Object user2 = ctor.newInstance("Harsha", 25);

// Way 3: Private constructor (Singleton breaking!)
Constructor<?> privateCtor = Singleton.class.getDeclaredConstructor();
privateCtor.setAccessible(true);
Object singleton2 = privateCtor.newInstance();  // BREAKS singleton!
```

> **⚠️ Interview Question**: "How can you break a Singleton?"
> Answer: Reflection + setAccessible(true) on private constructor.
> Defense: Throw exception from constructor if instance exists, OR use enum singleton.

---



> 🔬 **Section Challenge — 5. Creating Objects via Reflection**
>
> **Challenge 1 (Reasoning):** `ExecutorService.submit(task)` — the task throws a `RuntimeException`. Nobody calls `future.get()`. What happens to the exception?
> <details><summary>Answer</summary>
>
> It's silently swallowed. The exception is stored in the `Future` object. Without `future.get()` or `.whenComplete()`, no one ever sees it. The thread pool thread resets and picks up the next task as if nothing happened. This is one of the most dangerous production bugs. Fix: always attach `future.whenComplete((r,ex) -> { if(ex!=null) log.error("Task failed",ex); })` or use `execute()` + `UncaughtExceptionHandler`.
> </details>
>

## 6. How Spring Uses Reflection — The Full Picture

```
YOU WRITE:
┌──────────────────────────────────┐
│ @Service                          │
│ public class UserService {        │
│     @Autowired                    │
│     private UserRepository repo;  │
│                                   │
│     public User findUser(Long id) │
│     { return repo.findById(id); } │
│ }                                 │
└──────────────────────────────────┘

SPRING DOES (via Reflection):
┌──────────────────────────────────────────────────┐
│ Step 1: Scan classpath for @Service classes       │
│   → ClassLoader finds UserService.class           │
│   → Check: clazz.isAnnotationPresent(Service)     │
│                                                    │
│ Step 2: Create instance                            │
│   → clazz.getDeclaredConstructor().newInstance()   │
│                                                    │
│ Step 3: Inject dependencies                        │
│   → Find fields with @Autowired                    │
│   → field.setAccessible(true)                      │
│   → field.set(userService, repoInstance)           │
│                                                    │
│ Step 4: Register as bean                           │
│   → applicationContext.put("userService", instance) │
└──────────────────────────────────────────────────┘
```

### Simplified Spring Container

```java
// This is essentially what Spring does (simplified)
public class MiniSpringContainer {
    private Map<String, Object> beans = new HashMap<>();
    
    public void scan(String packageName) throws Exception {
        // Step 1: Find all classes in package
        List<Class<?>> classes = findClasses(packageName);
        
        for (Class<?> clazz : classes) {
            // Step 2: Check for @Service or @Component
            if (clazz.isAnnotationPresent(Service.class) ||
                clazz.isAnnotationPresent(Component.class)) {
                
                // Step 3: Create instance
                Object instance = clazz.getDeclaredConstructor().newInstance();
                
                // Step 4: Register bean
                String beanName = clazz.getSimpleName();
                beanName = Character.toLowerCase(beanName.charAt(0)) 
                           + beanName.substring(1);
                beans.put(beanName, instance);
            }
        }
        
        // Step 5: Inject dependencies
        for (Object bean : beans.values()) {
            for (Field field : bean.getClass().getDeclaredFields()) {
                if (field.isAnnotationPresent(Autowired.class)) {
                    field.setAccessible(true);
                    Object dependency = beans.get(
                        Character.toLowerCase(field.getType().getSimpleName().charAt(0))
                        + field.getType().getSimpleName().substring(1)
                    );
                    field.set(bean, dependency);
                }
            }
        }
    }
    
    @SuppressWarnings("unchecked")
    public <T> T getBean(String name) {
        return (T) beans.get(name);
    }
}
```

---



> 🔬 **Section Challenge — 6. How Spring Uses Reflection — The Full Picture**
>
> **Challenge 1 (Reasoning):** `ExecutorService.submit(task)` — the task throws a `RuntimeException`. Nobody calls `future.get()`. What happens to the exception?
> <details><summary>Answer</summary>
>
> It's silently swallowed. The exception is stored in the `Future` object. Without `future.get()` or `.whenComplete()`, no one ever sees it. The thread pool thread resets and picks up the next task as if nothing happened. This is one of the most dangerous production bugs. Fix: always attach `future.whenComplete((r,ex) -> { if(ex!=null) log.error("Task failed",ex); })` or use `execute()` + `UncaughtExceptionHandler`.
> </details>
>

## 7. Annotations — Understanding From Ground Up

### What IS an Annotation?

```
╔══════════════════════════════════════════════════════════════╗
║ An annotation is METADATA attached to code elements          ║
║                                                              ║
║ By itself, it does NOTHING                                   ║
║ It's like a sticky note on a book page                       ║
║                                                              ║
║ Someone (a framework/processor) must READ the annotation     ║
║ and take ACTION based on it                                  ║
╚══════════════════════════════════════════════════════════════╝
```

```
ANNOTATION = Sticky note (data only, no behavior)
PROCESSOR  = Person who reads sticky notes and acts

@Override      → Compiler reads it, checks method exists in parent
@Test          → JUnit reads it, runs the method as a test
@Autowired     → Spring reads it, injects the dependency
@Entity        → Hibernate reads it, maps class to table
@JsonProperty  → Jackson reads it, changes JSON field name
```

### Built-in Annotations You Already Know

```java
@Override       // Compiler checks: method overrides parent
@Deprecated     // Compiler warns: method is outdated
@SuppressWarnings("unchecked")  // Compiler: skip this warning
@FunctionalInterface  // Compiler: ensure only 1 abstract method

// These are processed at COMPILE TIME by javac
```

---



> 🔬 **Section Challenge — 7. Annotations — Understanding From Ground Up**
>
> **Challenge 1 (Reasoning):** `ExecutorService.submit(task)` — the task throws a `RuntimeException`. Nobody calls `future.get()`. What happens to the exception?
> <details><summary>Answer</summary>
>
> It's silently swallowed. The exception is stored in the `Future` object. Without `future.get()` or `.whenComplete()`, no one ever sees it. The thread pool thread resets and picks up the next task as if nothing happened. This is one of the most dangerous production bugs. Fix: always attach `future.whenComplete((r,ex) -> { if(ex!=null) log.error("Task failed",ex); })` or use `execute()` + `UncaughtExceptionHandler`.
> </details>
>

## 8. Creating Custom Annotations — Step by Step

### The Syntax

```java
// Step 1: Define the annotation
@Target(ElementType.METHOD)          // WHERE can it be placed?
@Retention(RetentionPolicy.RUNTIME)  // WHEN is it available?
public @interface LogExecutionTime {
    // Annotation elements (optional)
    String value() default "";    // default value = optional
    boolean logArgs() default false;
}
```

### @Target — WHERE Can This Annotation Go?

```
┌─────────────────────────────────────────────────┐
│ ElementType        │ Can Annotate               │
│────────────────────│────────────────────────────│
│ TYPE               │ class, interface, enum      │
│ FIELD              │ instance variables           │
│ METHOD             │ methods                      │
│ PARAMETER          │ method parameters            │
│ CONSTRUCTOR        │ constructors                 │
│ LOCAL_VARIABLE     │ local variables              │
│ ANNOTATION_TYPE    │ other annotations (meta)     │
│ PACKAGE            │ package declarations          │
│ TYPE_PARAMETER     │ generic type parameters       │
│ TYPE_USE           │ any type use (Java 8+)        │
│ RECORD_COMPONENT   │ record components (Java 16+)  │
└─────────────────────────────────────────────────┘
```

### @Retention — WHEN Is It Available?

```
┌──────────────────────────────────────────────────────────┐
│ RetentionPolicy  │ Available When?    │ Use Case          │
│──────────────────│────────────────────│───────────────────│
│ SOURCE           │ Compile time only  │ @Override          │
│                  │ Gone after compile │ @SuppressWarnings  │
│──────────────────│────────────────────│───────────────────│
│ CLASS (default)  │ In .class file     │ Bytecode tools     │
│                  │ NOT at runtime     │ (rarely used)      │
│──────────────────│────────────────────│───────────────────│
│ RUNTIME          │ At runtime via     │ @Autowired         │
│                  │ Reflection         │ @Entity, @Test     │
│                  │                    │ MOST frameworks    │
└──────────────────────────────────────────────────────────┘
```

```
SOURCE → COMPILE → .class → RUNTIME
  ↑                 ↑          ↑
  │                 │          └── RUNTIME annotations live here
  │                 └── CLASS annotations stop here  
  └── SOURCE annotations stop here
```

> **Rule of Thumb**: If you're creating an annotation for a framework 
> to process at runtime → use `RetentionPolicy.RUNTIME`

---



> 🔬 **Section Challenge — 8. Creating Custom Annotations — Step by Step**
>
> **Challenge 1 (Design):** Design a custom exception hierarchy for a payment system. What should the base class extend and what fields must it have?
> <details><summary>Answer</summary>
>
> ```java
> public class PaymentException extends RuntimeException { // unchecked!
>     private final String errorCode;
>     private final String transactionId;
>     public PaymentException(String code, String txId, String msg, Throwable cause) {
>         super(msg, cause); this.errorCode=code; this.transactionId=txId;
>     }
> }
> public class InsufficientFundsException extends PaymentException { ... }
> public class PaymentGatewayException extends PaymentException { ... }
> ```
> Always chain the original cause. Include domain-relevant context (errorCode, transactionId) for logging/debugging.
> </details>
>

## 9. Practical Example: Building @LogExecutionTime

### Step 1: Define Annotation

```java
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface LogExecutionTime {
    String value() default "";  // optional label
}
```

### Step 2: Use It

```java
@Service
public class UserService {
    
    @LogExecutionTime("findUser")
    public User findUser(Long id) {
        return userRepo.findById(id).orElseThrow();
    }
    
    @LogExecutionTime
    public List<User> findAll() {
        return userRepo.findAll();
    }
}
```

### Step 3: Process It (Using Spring AOP)

```java
@Aspect
@Component
public class LoggingAspect {
    
    private static final Logger log = LoggerFactory.getLogger(LoggingAspect.class);
    
    @Around("@annotation(logAnnotation)")
    public Object logExecutionTime(ProceedingJoinPoint joinPoint, 
                                    LogExecutionTime logAnnotation) throws Throwable {
        String label = logAnnotation.value().isEmpty() 
            ? joinPoint.getSignature().getName() 
            : logAnnotation.value();
        
        long start = System.currentTimeMillis();
        
        try {
            Object result = joinPoint.proceed();
            long elapsed = System.currentTimeMillis() - start;
            log.info("[{}] executed in {}ms", label, elapsed);
            return result;
        } catch (Throwable ex) {
            long elapsed = System.currentTimeMillis() - start;
            log.error("[{}] FAILED after {}ms: {}", label, elapsed, ex.getMessage());
            throw ex;
        }
    }
}
```

### Step 3 Alternative: Process Without Spring (Pure Reflection)

```java
public class AnnotationProcessor {
    
    public static void processAnnotations(Object target) throws Exception {
        Class<?> clazz = target.getClass();
        
        for (Method method : clazz.getDeclaredMethods()) {
            if (method.isAnnotationPresent(LogExecutionTime.class)) {
                LogExecutionTime annotation = method.getAnnotation(LogExecutionTime.class);
                String label = annotation.value().isEmpty() 
                    ? method.getName() 
                    : annotation.value();
                
                System.out.println("Found @LogExecutionTime on: " + label);
                
                // Invoke with timing
                long start = System.nanoTime();
                method.setAccessible(true);
                Object result = method.invoke(target);
                long elapsed = System.nanoTime() - start;
                
                System.out.printf("[%s] took %.2fms%n", label, elapsed / 1_000_000.0);
            }
        }
    }
}
```

---



> 🔬 **Section Challenge — 9. Practical Example: Building @LogExecutionTime**
>
> **Challenge 1 (Reasoning):** `ExecutorService.submit(task)` — the task throws a `RuntimeException`. Nobody calls `future.get()`. What happens to the exception?
> <details><summary>Answer</summary>
>
> It's silently swallowed. The exception is stored in the `Future` object. Without `future.get()` or `.whenComplete()`, no one ever sees it. The thread pool thread resets and picks up the next task as if nothing happened. This is one of the most dangerous production bugs. Fix: always attach `future.whenComplete((r,ex) -> { if(ex!=null) log.error("Task failed",ex); })` or use `execute()` + `UncaughtExceptionHandler`.
> </details>
>

## 10. Practical Example: Building @Validate

```java
// Step 1: Define validation annotations
@Target(ElementType.FIELD)
@Retention(RetentionPolicy.RUNTIME)
public @interface NotEmpty {
    String message() default "Field cannot be empty";
}

@Target(ElementType.FIELD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Range {
    int min() default 0;
    int max() default Integer.MAX_VALUE;
    String message() default "Value out of range";
}

// Step 2: Use on a DTO
public class CreateUserRequest {
    @NotEmpty(message = "Name is required")
    private String name;
    
    @NotEmpty
    private String email;
    
    @Range(min = 18, max = 120, message = "Age must be 18-120")
    private int age;
    
    // constructors, getters, setters
}

// Step 3: Build the validator
public class Validator {
    
    public static List<String> validate(Object obj) throws IllegalAccessException {
        List<String> errors = new ArrayList<>();
        Class<?> clazz = obj.getClass();
        
        for (Field field : clazz.getDeclaredFields()) {
            field.setAccessible(true);
            Object value = field.get(obj);
            
            // Check @NotEmpty
            if (field.isAnnotationPresent(NotEmpty.class)) {
                NotEmpty annotation = field.getAnnotation(NotEmpty.class);
                if (value == null || (value instanceof String s && s.isBlank())) {
                    errors.add(field.getName() + ": " + annotation.message());
                }
            }
            
            // Check @Range
            if (field.isAnnotationPresent(Range.class)) {
                Range annotation = field.getAnnotation(Range.class);
                if (value instanceof Number num) {
                    int val = num.intValue();
                    if (val < annotation.min() || val > annotation.max()) {
                        errors.add(field.getName() + ": " + annotation.message());
                    }
                }
            }
        }
        
        return errors;
    }
}

// Step 4: Use it
CreateUserRequest request = new CreateUserRequest("", "harsha@mail.com", 15);
List<String> errors = Validator.validate(request);
// ["name: Name is required", "age: Age must be 18-120"]
```

---



> 🔬 **Section Challenge — 10. Practical Example: Building @Validate**
>
> **Challenge 1 (Reasoning):** `ExecutorService.submit(task)` — the task throws a `RuntimeException`. Nobody calls `future.get()`. What happens to the exception?
> <details><summary>Answer</summary>
>
> It's silently swallowed. The exception is stored in the `Future` object. Without `future.get()` or `.whenComplete()`, no one ever sees it. The thread pool thread resets and picks up the next task as if nothing happened. This is one of the most dangerous production bugs. Fix: always attach `future.whenComplete((r,ex) -> { if(ex!=null) log.error("Task failed",ex); })` or use `execute()` + `UncaughtExceptionHandler`.
> </details>
>

## 11. Practical Example: Building Mini @JsonProperty

```java
// Custom annotation
@Target(ElementType.FIELD)
@Retention(RetentionPolicy.RUNTIME)
public @interface JsonField {
    String value();  // the JSON key name
}

// Model
public class User {
    @JsonField("user_name")
    private String name;
    
    @JsonField("user_email")
    private String email;
    
    private int age;  // no annotation → use field name
    
    public User(String name, String email, int age) {
        this.name = name;
        this.email = email;
        this.age = age;
    }
}

// Serializer
public class MiniJsonSerializer {
    
    public static String toJson(Object obj) throws IllegalAccessException {
        StringBuilder json = new StringBuilder("{");
        Field[] fields = obj.getClass().getDeclaredFields();
        
        for (int i = 0; i < fields.length; i++) {
            Field field = fields[i];
            field.setAccessible(true);
            
            // Determine JSON key name
            String key = field.isAnnotationPresent(JsonField.class)
                ? field.getAnnotation(JsonField.class).value()
                : field.getName();
            
            // Get value
            Object value = field.get(obj);
            
            // Format
            if (value instanceof String) {
                json.append("\"").append(key).append("\":\"").append(value).append("\"");
            } else {
                json.append("\"").append(key).append("\":").append(value);
            }
            
            if (i < fields.length - 1) json.append(",");
        }
        
        json.append("}");
        return json.toString();
    }
}

// Usage
User user = new User("Harsha", "h@mail.com", 25);
String json = MiniJsonSerializer.toJson(user);
// {"user_name":"Harsha","user_email":"h@mail.com","age":25}
```

---



> 🔬 **Section Challenge — 11. Practical Example: Building Mini @JsonProperty**
>
> **Challenge 1 (Reasoning):** `ExecutorService.submit(task)` — the task throws a `RuntimeException`. Nobody calls `future.get()`. What happens to the exception?
> <details><summary>Answer</summary>
>
> It's silently swallowed. The exception is stored in the `Future` object. Without `future.get()` or `.whenComplete()`, no one ever sees it. The thread pool thread resets and picks up the next task as if nothing happened. This is one of the most dangerous production bugs. Fix: always attach `future.whenComplete((r,ex) -> { if(ex!=null) log.error("Task failed",ex); })` or use `execute()` + `UncaughtExceptionHandler`.
> </details>
>

## 12. Meta-Annotations — Annotations ON Annotations

```java
// Spring's @Service is actually a meta-annotation:
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Component                        // ← Meta-annotation! @Service IS a @Component
public @interface Service {
    String value() default "";
}

// So when Spring scans for @Component, it also finds @Service, 
// @Repository, @Controller — because they're ALL @Component underneath!
```

### @Repeatable — Same Annotation Multiple Times

```java
// Container annotation
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Schedules {
    Schedule[] value();
}

// Repeatable annotation
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Repeatable(Schedules.class)
public @interface Schedule {
    String cron();
}

// Usage — same annotation twice!
@Schedule(cron = "0 0 * * * *")   // Every hour
@Schedule(cron = "0 0 9 * * MON") // Monday 9 AM
public void generateReport() { ... }
```

### @Inherited — Annotation Passes to Subclasses

```java
@Inherited
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
public @interface Auditable { }

@Auditable
public class BaseEntity { }

// SubEntity INHERITS @Auditable without declaring it!
public class SubEntity extends BaseEntity { }

SubEntity.class.isAnnotationPresent(Auditable.class);  // true!
```

---

## 13. Reflection Performance & When NOT to Use It

```
┌─────────────────────────────────────────────────────────────┐
│              PERFORMANCE COMPARISON                          │
│                                                             │
│ Direct call:     user.getName()         →   ~2 ns           │
│ Reflection:      method.invoke(user)    → ~50 ns            │
│                                                             │
│ That's ~25x slower!                                         │
│                                                             │
│ BUT: For framework initialization (once at startup),        │
│      this cost is IRRELEVANT                                │
│                                                             │
│ For hot loops (millions of calls), it MATTERS               │
└─────────────────────────────────────────────────────────────┘
```

### Performance Optimization Tips

```java
// BAD: Lookup method every time
for (int i = 0; i < 1_000_000; i++) {
    Method m = clazz.getMethod("process", String.class);  // Lookup each time!
    m.invoke(target, data);
}

// GOOD: Cache the Method object
Method m = clazz.getMethod("process", String.class);       // Lookup ONCE
m.setAccessible(true);                                       // Set ONCE
for (int i = 0; i < 1_000_000; i++) {
    m.invoke(target, data);                                  // Only invoke
}
```

### When to Use / Not Use

```
✅ USE REFLECTION FOR:
  • Framework building (DI containers, ORM)
  • Plugin systems (discover classes at runtime)
  • Testing (access private methods)
  • Serialization (object → JSON/XML)
  • Configuration-driven behavior

❌ DON'T USE REFLECTION FOR:
  • Normal application code (use interfaces instead)
  • Performance-critical hot paths
  • When compile-time safety matters
  • Simple object creation (just use new)
```

---

## 14. Dynamic Proxy — Reflection's Power Feature

```java
// Dynamic proxies let you intercept ALL method calls on an interface

public interface UserService {
    User findById(Long id);
    void save(User user);
}

// Create a proxy that logs every call
UserService proxy = (UserService) Proxy.newProxyInstance(
    UserService.class.getClassLoader(),
    new Class<?>[]{ UserService.class },
    (proxyObj, method, args) -> {
        System.out.println("Calling: " + method.getName());
        long start = System.nanoTime();
        
        // Call the REAL method
        Object result = method.invoke(realUserService, args);
        
        long elapsed = System.nanoTime() - start;
        System.out.printf("%s took %.2fms%n", method.getName(), elapsed / 1e6);
        
        return result;
    }
);

// Now every call goes through the proxy
proxy.findById(1L);
// Output:
// Calling: findById
// findById took 12.34ms
```

```
┌──────────────────────────────────────────────────────────┐
│ This is EXACTLY how Spring creates:                       │
│                                                           │
│ • @Transactional proxies (begin/commit/rollback)          │
│ • @Cacheable proxies (check cache, return if found)       │
│ • @Async proxies (submit to thread pool)                  │
│ • AOP aspects (before/after/around advice)                │
│                                                           │
│ JDK Dynamic Proxy → interfaces only                       │
│ CGLIB Proxy       → classes (subclass approach)           │
│ Spring default    → CGLIB (since Spring Boot 2.x)         │
└──────────────────────────────────────────────────────────┘
```

---



> 🔬 **Section Challenge — 14. Dynamic Proxy — Reflection's Power Feature**
>
> **Challenge 1 (Reasoning):** How do you identify that a problem requires DP vs Greedy? What's the key test?
> <details><summary>Answer</summary>
>
> Greedy test: does the locally optimal choice always lead to the globally optimal solution? (Prove via exchange argument.) If yes → greedy. If making a local choice requires knowing future choices → DP. Example: Coin Change with standard coins [1,5,10,25] → greedy works (always pick largest). Coin Change with coins [1,3,4] and amount 6 → greedy picks 4+1+1=3 coins, optimal is 3+3=2 coins. Greedy fails → DP.
> </details>
>
> **Challenge 2 (Design):** You need to find the number of ways to climb N stairs taking 1 or 2 steps at a time. Define the DP state and recurrence.
> <details><summary>Answer</summary>
>
> State: `dp[i]` = number of ways to reach step i. Recurrence: `dp[i] = dp[i-1] + dp[i-2]` (come from step i-1 via 1 step, or from step i-2 via 2 steps). Base: `dp[0]=1` (one way: don't move), `dp[1]=1`. This is exactly Fibonacci. Space optimization: only need last 2 values → O(1) space.
> </details>
>

## 15. Complete Reflection Cheat Sheet

```
┌────────────────────────────────────────────────────────────────┐
│ OPERATION              │ CODE                                   │
│────────────────────────│────────────────────────────────────────│
│ Get class              │ obj.getClass() / Type.class             │
│ Get class by name      │ Class.forName("com.example.Type")       │
│ Create instance        │ clazz.getDeclaredConstructor().newInst()│
│ Get all fields         │ clazz.getDeclaredFields()               │
│ Get specific field     │ clazz.getDeclaredField("name")          │
│ Read field value       │ field.setAccessible(true); field.get(o) │
│ Write field value      │ field.set(obj, newValue)                │
│ Get all methods        │ clazz.getDeclaredMethods()              │
│ Get specific method    │ clazz.getDeclaredMethod("name", args)   │
│ Invoke method          │ method.invoke(obj, args)                │
│ Check annotation       │ elem.isAnnotationPresent(Anno.class)    │
│ Get annotation         │ elem.getAnnotation(Anno.class)          │
│ Check modifiers        │ Modifier.isPrivate(field.getModifiers())│
│ Create proxy           │ Proxy.newProxyInstance(cl, ifs, handler) │
│ Check if interface     │ clazz.isInterface()                     │
│ Check if enum          │ clazz.isEnum()                          │
│ Check if array         │ clazz.isArray()                         │
│ Get generic type       │ field.getGenericType()                  │
│ Get superclass         │ clazz.getSuperclass()                   │
└────────────────────────────────────────────────────────────────┘
```

---

## 16. Interview Questions & Answers

**Q: What is reflection and when would you use it?**
> Reflection lets you inspect & manipulate classes at runtime. Used by frameworks for DI, ORM, serialization, and testing. Don't use it in normal application code.

**Q: How does Spring @Autowired work internally?**
> Spring scans for fields annotated with @Autowired, calls `field.setAccessible(true)`, then `field.set(bean, dependency)` using reflection.

**Q: Difference between `getFields()` and `getDeclaredFields()`?**
> `getFields()` → public fields including inherited. `getDeclaredFields()` → all fields in this class only (including private), not inherited.

**Q: How can you break a Singleton using reflection?**
> Get the private constructor, call `setAccessible(true)`, then `newInstance()`. Defense: use enum singleton or throw exception from constructor.

**Q: What are the 3 retention policies?**
> SOURCE (compile only, e.g., @Override), CLASS (in .class file, default), RUNTIME (available via reflection, e.g., @Autowired).

**Q: Create a custom annotation that marks a method as cached.**

```java
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Cached {
    long ttlSeconds() default 300;
    String key() default "";
}
```

---

> **Key Takeaway**: Reflection is the BACKBONE of every Java framework. 
> You use it indirectly every time you write `@Autowired`, `@Entity`, or `@Test`.
> Understanding reflection = understanding HOW frameworks work.

> **Navigation**: [< Java Networking & NIO](Ch13_Networking_NIO.md) | [Back to Index](../00_MASTER_INDEX.md) | [Events & Listeners >](Ch11_Events_Listeners.md)
