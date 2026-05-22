# 47. Java Reflection & Custom Annotations â€” The Complete Deep Dive

**Navigation**: [< Java Networking & NIO](Ch13_Networking_NIO.md) | [Back to Index](../00_MASTER_INDEX.md) | [Events & Listeners >](Ch11_Events_Listeners.md)

---

## ðŸŽ¯ The 5W1H Framework

Before we touch any code, let's answer the fundamental questions:

```
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘  WHAT = Java Reflection is a way to inspect and manipulate       â•‘
â•‘         classes, methods, fields AT RUNTIME (not compile time)   â•‘
â•‘                                                                  â•‘
â•‘  WHY  = Frameworks like Spring can't know YOUR classes at        â•‘
â•‘         compile time, so they discover them at runtime           â•‘
â•‘                                                                  â•‘
â•‘  WHEN = Framework building, testing, serialization, plugins,     â•‘
â•‘         dependency injection, ORM mapping                        â•‘
â•‘                                                                  â•‘
â•‘  WHERE = Spring (@Autowired), Hibernate (@Entity), JUnit (@Test) â•‘
â•‘          Jackson (@JsonProperty), Lombok (compile-time version)  â•‘
â•‘                                                                  â•‘
â•‘  WHO  = Framework builders use it directly                       â•‘
â•‘         Application devs use it indirectly (via annotations)     â•‘
â•‘                                                                  â•‘
â•‘  HOW  = java.lang.reflect package + java.lang.Class              â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

---

## 1. What is Reflection? â€” The Mental Model

Think of it like this:

```
NORMAL CODE (Compile Time):
  You write: new UserService()
  Compiler checks: âœ… UserService class exists
  JVM runs: Creates UserService object
  
  â†’ You KNOW the class name when writing code

REFLECTION (Runtime):
  Framework reads: @Service annotation on some class
  Framework discovers: "Oh, there's a class called UserService"
  Framework creates: Class.forName("UserService").newInstance()
  
  â†’ Framework DISCOVERS class names while running
```

### Real-World Analogy

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ NORMAL CODE = Calling a friend by name      â”‚
â”‚   "Hey Harsha, come here!"                  â”‚
â”‚   (You know who you're calling)             â”‚
â”‚                                             â”‚
â”‚ REFLECTION = Looking at a phone book        â”‚
â”‚   "Who has annotation @Available?"          â”‚
â”‚   "Oh, Harsha, Ravi, Priya are available"   â”‚
â”‚   "Call all of them!"                       â”‚
â”‚   (You discover people at runtime)          â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

## 2. The `Class<?>` Object â€” Everything Starts Here

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
clazz.getModifiers();     // int â†’ decode with Modifier.isPublic(), etc.

// Discover everything
clazz.getDeclaredFields();       // ALL fields (including private)
clazz.getDeclaredMethods();      // ALL methods (including private)
clazz.getDeclaredConstructors(); // ALL constructors
clazz.getAnnotations();          // ALL annotations on this class

// vs. getFields() / getMethods() â†’ only PUBLIC, including inherited
```

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ getDeclared___()  = THIS class only, ALL access   â”‚
â”‚ get___()          = THIS + parents, PUBLIC only    â”‚
â”‚                                                    â”‚
â”‚ Use getDeclared for private field hacking          â”‚
â”‚ Use get___ for public API discovery                â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---



ðŸ”¬ **Section Challenge â€” 2. The `Class<?>` Object â€” Everything Starts Here**

**Challenge 1 (Reasoning):** Why is using Java Reflection to access a class's methods dynamically drastically slower than calling the method directly in code?
<details><summary>Answer</summary>

JIT Compilation and Security Checks. When you write `obj.doSomething()`, the JVM's JIT compiler optimizes the call, aggressively inlining it down to bare machine code. When you use `Method.invoke()`, the JVM must dynamically resolve the method signature, box/unbox arguments, perform security access checks, and prevent JIT inlining. Reflection effectively forces the JVM to interpret the call blindly, making it orders of magnitude slower.
</details>


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
nameField.setAccessible(true);  // â† BYPASS private access!

// READ private field
String name = (String) nameField.get(user);
System.out.println(name);  // "Harsha"

// WRITE private field
nameField.set(user, "Changed!");
System.out.println(user.getName());  // "Changed!"
```

**âš ï¸ Interview Alert**: `setAccessible(true)` breaks encapsulation. This is how:
- **Spring** injects `@Autowired` private fields
- **Jackson** reads/writes private fields for JSON
- **Hibernate** hydrates entity objects from database rows

---



ðŸ”¬ **Section Challenge â€” 3. Inspecting Fields**

**Challenge 1 (setAccessible Security):** `field.setAccessible(true)` bypasses Java's `private` modifier. **Who** can call `setAccessible(true)` in a Java 17+ application? **When** does it throw `InaccessibleObjectException`? **What** Java 17 feature restricts this?

<details><summary>Answer</summary>

**Who can call it:** Application code, framework code, and test libraries (e.g., Mockito, Spring) â€” BUT only if the calling module has the right permissions. **When it throws `InaccessibleObjectException`:** In Java 9+ with the module system (JPMS), if a field's class is in a module that does NOT export or open its package, `setAccessible(true)` throws `InaccessibleObjectException`. For example, trying to access private fields in `java.base` module (e.g., `String.value`) is blocked. **Java 17 feature that restricts this:** STRONG ENCAPSULATION of JDK internals. Java 17 made it the DEFAULT to block access to JDK internal APIs. Classes in unnamed modules (regular app code) can still `setAccessible(true)` on their OWN classes. But accessing JDK internals (`sun.*`, `jdk.internal.*`) requires `--add-opens` JVM flag: `--add-opens java.base/java.lang=ALL-UNNAMED`. **Production impact:** Spring Framework 6+ was redesigned to avoid heavy `setAccessible` use due to JPMS restrictions. Libraries that heavily use reflection had to add `module-info.java` or require users to add `--add-opens` flags.

</details>


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
                â”‚
                â”œâ”€â”€ name = "add"
                â””â”€â”€ paramTypes = int.class, int.class
                
Why paramTypes? â†’ Because of METHOD OVERLOADING
  add(int, int)     â† different from
  add(double, double)
  
Each overload is a DIFFERENT Method object
```

---



ðŸ”¬ **Section Challenge â€” 4. Invoking Methods via Reflection**

**Challenge 1 (Exception Wrapping):** `method.invoke(obj, args)` can throw `InvocationTargetException`. **Who** wraps the original exception? **When** must you call `getCause()` and **when** must you call `getMessage()` directly? **What** exception is thrown if you pass wrong argument types to `invoke()`?

<details><summary>Answer</summary>

**Who wraps:** The Reflection API itself. When the invoked method throws a checked or unchecked exception, `invoke()` catches it and wraps it in `InvocationTargetException`. **When to call `getCause()`:** To get the ORIGINAL exception thrown by the method. `invEx.getCause()` returns the actual `NullPointerException`, `IllegalArgumentException`, or business exception your method threw. Always unwrap for meaningful error messages and logging. **When to call `getMessage()` directly:** On `InvocationTargetException` itself, `getMessage()` returns null or a wrapper message â€” not useful. Always prefer `getCause().getMessage()` or rethrow `invEx.getCause()`. **What's thrown for wrong arg types:** `IllegalArgumentException` (NOT `InvocationTargetException`). If you pass an `Integer` where a `String` is expected: `method.invoke(obj, 42)` when method signature is `void setName(String name)` â€” Java throws `IllegalArgumentException: wrong number of arguments` or `argument type mismatch`. This exception propagates DIRECTLY (not wrapped in InvocationTargetException).

</details>


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

**âš ï¸ Interview Question**: "How can you break a Singleton?"
Answer: Reflection + setAccessible(true) on private constructor.
Defense: Throw exception from constructor if instance exists, OR use enum singleton.

---



ðŸ”¬ **Section Challenge â€” 5. Creating Objects via Reflection**

**Challenge 1 (newInstance vs getDeclaredConstructor):** `Class.newInstance()` was DEPRECATED in Java 9. **Why?** **Who** catches exceptions differently between the old `newInstance()` and `getDeclaredConstructor().newInstance()`?

<details><summary>Answer</summary>

**Why deprecated:** `Class.newInstance()` had a fundamental design flaw: it propagated checked exceptions WITHOUT declaring them. If the no-arg constructor threw a checked exception (e.g., `IOException`), `newInstance()` rethrew it unchecked â€” violating Java's exception handling contract. Callers couldn't know which checked exceptions to catch. **Who catches exceptions differently:** `getDeclaredConstructor().newInstance()` is the replacement: it throws `InvocationTargetException` (wrapping the constructor's exception) + `InstantiationException` + `IllegalAccessException` + `NoSuchMethodException`. These are all declared checked exceptions â€” the caller is FORCED to handle them. **Old pattern (broken):** `MyClass obj = MyClass.class.newInstance();` â€” silently ate checked exceptions. **New pattern (correct):** `MyClass obj = MyClass.class.getDeclaredConstructor().newInstance();` inside try-catch for the 4 exception types. `getDeclaredConstructor()` also lets you use parameterized constructors: `getDeclaredConstructor(String.class, int.class).newInstance("hello", 42)`, unlike the old `newInstance()` which ONLY supported no-arg constructors.

</details>


## 6. How Spring Uses Reflection â€” The Full Picture

```
YOU WRITE:
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ @Service                          â”‚
â”‚ public class UserService {        â”‚
â”‚     @Autowired                    â”‚
â”‚     private UserRepository repo;  â”‚
â”‚                                   â”‚
â”‚     public User findUser(Long id) â”‚
â”‚     { return repo.findById(id); } â”‚
â”‚ }                                 â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

SPRING DOES (via Reflection):
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Step 1: Scan classpath for @Service classes       â”‚
â”‚   â†’ ClassLoader finds UserService.class           â”‚
â”‚   â†’ Check: clazz.isAnnotationPresent(Service)     â”‚
â”‚                                                    â”‚
â”‚ Step 2: Create instance                            â”‚
â”‚   â†’ clazz.getDeclaredConstructor().newInstance()   â”‚
â”‚                                                    â”‚
â”‚ Step 3: Inject dependencies                        â”‚
â”‚   â†’ Find fields with @Autowired                    â”‚
â”‚   â†’ field.setAccessible(true)                      â”‚
â”‚   â†’ field.set(userService, repoInstance)           â”‚
â”‚                                                    â”‚
â”‚ Step 4: Register as bean                           â”‚
â”‚   â†’ applicationContext.put("userService", instance) â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
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



ðŸ”¬ **Section Challenge â€” 6. How Spring Uses Reflection â€” The Full Picture**

**Challenge 1 (Spring Proxy Type):** Spring uses Reflection to call `@Autowired` constructors, but uses `CGLIB proxy` for `@Transactional`. **Who** creates the CGLIB proxy? **When** does Spring choose CGLIB vs. JDK Dynamic Proxy? **What** constraint does CGLIB impose on your classes?

<details><summary>Answer</summary>

**Who creates CGLIB proxy:** Spring's `ProxyFactory` (via AOP infrastructure). At startup, when Spring detects `@Transactional` or `@Cacheable` on a bean, it creates a CGLIB subclass of your class that overrides the annotated methods to add the AOP advice (before/after logic). **When Spring chooses CGLIB vs JDK Dynamic Proxy:** JDK Dynamic Proxy = when the bean implements an INTERFACE (proxy IS the interface). CGLIB = when the bean is a CONCRETE CLASS (no interface). Spring Boot defaults to `proxyTargetClass=true` â€” it ALWAYS uses CGLIB even if an interface exists. This changed from older Spring where JDK proxies were default. **What CGLIB imposes:** (1) Your class must NOT be `final` (CGLIB must subclass it). `final class MyService` = error. (2) The transactional method must NOT be `private` (overriding can't access private). Private methods skip the proxy, `@Transactional` on private methods is SILENTLY IGNORED. (3) `final` methods are also not proxied â€” `@Transactional final void save()` â€” SILENTLY IGNORED. This is a common production bug: developer marks method `final`, transaction disappears.

</details>


## 7. Annotations â€” Understanding From Ground Up

### What IS an Annotation?

```
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ An annotation is METADATA attached to code elements          â•‘
â•‘                                                              â•‘
â•‘ By itself, it does NOTHING                                   â•‘
â•‘ It's like a sticky note on a book page                       â•‘
â•‘                                                              â•‘
â•‘ Someone (a framework/processor) must READ the annotation     â•‘
â•‘ and take ACTION based on it                                  â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

```
ANNOTATION = Sticky note (data only, no behavior)
PROCESSOR  = Person who reads sticky notes and acts

@Override      â†’ Compiler reads it, checks method exists in parent
@Test          â†’ JUnit reads it, runs the method as a test
@Autowired     â†’ Spring reads it, injects the dependency
@Entity        â†’ Hibernate reads it, maps class to table
@JsonProperty  â†’ Jackson reads it, changes JSON field name
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



ðŸ”¬ **Section Challenge â€” 7. Annotations â€” Understanding From Ground Up**

**Challenge 1 (Retention Policy):** `@Retention` has three values: SOURCE, CLASS, RUNTIME. **Who** can read each? **When** should you use RUNTIME? **What** is the DEFAULT if `@Retention` is omitted?

<details><summary>Answer</summary>

**Who reads each:** `SOURCE` = only the Java compiler (javac). Discarded in .class file. Used by: `@Override`, `@SuppressWarnings`, `@FunctionalInterface`. You can use them with annotation processors (APT). `CLASS` = stored in .class bytecode. Readable by bytecode tools (e.g., ASM, Byte Buddy) but NOT at runtime via Reflection. Default if `@Retention` is omitted. `RUNTIME` = stored in .class AND available at runtime via `Class.getAnnotation()`. Required for framework annotations: `@Component`, `@Transactional`, `@Autowired`. **When to use RUNTIME:** Whenever your annotation is READ AT RUNTIME by a framework or by reflection-based processing. Spring's `@Service`, `@RequestMapping` â€” all RUNTIME. **When CLASS is enough:** When you're using bytecode weaving (AspectJ compile-time weaving can read CLASS annotations). Saves tiny bit of memory by not keeping metadata at runtime. **Default if omitted:** `RetentionPolicy.CLASS` â€” stored in bytecode but NOT accessible via Reflection. This is a common mistake: writing a custom annotation but forgetting `@Retention(RUNTIME)`, then `method.getAnnotation(MyAnnotation.class)` always returns `null`.

</details>


## 8. Creating Custom Annotations â€” Step by Step

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

### @Target â€” WHERE Can This Annotation Go?

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ ElementType        â”‚ Can Annotate               â”‚
â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚
â”‚ TYPE               â”‚ class, interface, enum      â”‚
â”‚ FIELD              â”‚ instance variables           â”‚
â”‚ METHOD             â”‚ methods                      â”‚
â”‚ PARAMETER          â”‚ method parameters            â”‚
â”‚ CONSTRUCTOR        â”‚ constructors                 â”‚
â”‚ LOCAL_VARIABLE     â”‚ local variables              â”‚
â”‚ ANNOTATION_TYPE    â”‚ other annotations (meta)     â”‚
â”‚ PACKAGE            â”‚ package declarations          â”‚
â”‚ TYPE_PARAMETER     â”‚ generic type parameters       â”‚
â”‚ TYPE_USE           â”‚ any type use (Java 8+)        â”‚
â”‚ RECORD_COMPONENT   â”‚ record components (Java 16+)  â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### @Retention â€” WHEN Is It Available?

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ RetentionPolicy  â”‚ Available When?    â”‚ Use Case          â”‚
â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚
â”‚ SOURCE           â”‚ Compile time only  â”‚ @Override          â”‚
â”‚                  â”‚ Gone after compile â”‚ @SuppressWarnings  â”‚
â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚
â”‚ CLASS (default)  â”‚ In .class file     â”‚ Bytecode tools     â”‚
â”‚                  â”‚ NOT at runtime     â”‚ (rarely used)      â”‚
â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚
â”‚ RUNTIME          â”‚ At runtime via     â”‚ @Autowired         â”‚
â”‚                  â”‚ Reflection         â”‚ @Entity, @Test     â”‚
â”‚                  â”‚                    â”‚ MOST frameworks    â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

```
SOURCE â†’ COMPILE â†’ .class â†’ RUNTIME
  â†‘                 â†‘          â†‘
  â”‚                 â”‚          â””â”€â”€ RUNTIME annotations live here
  â”‚                 â””â”€â”€ CLASS annotations stop here
  â””â”€â”€ SOURCE annotations stop here
```

**Rule of Thumb**: If you're creating an annotation for a framework 
to process at runtime â†’ use `RetentionPolicy.RUNTIME`

---



ðŸ”¬ **Section Challenge â€” 8. Creating Custom Annotations â€” Step by Step**

**Challenge 1 (Design):** Create an annotation called `@AuditAction` for methods that must be read by a runtime processor. Which `@Target` and `@Retention` should it use, and what metadata should it expose?
<details><summary>Trace, Reasoning & Debug</summary>

```java
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface AuditAction {
    String value();
    boolean includeArgs() default false;
}
```

Reason from the processor backward: if reflection must read the annotation while the program runs, `RUNTIME` retention is mandatory. If the annotation only makes sense on methods, restrict `@Target` to `METHOD`; broad targets create invalid usage sites your processor must reject later.
</details>


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



ðŸ”¬ **Section Challenge â€” 9. Practical Example: Building @LogExecutionTime**

**Challenge 1 (AOP vs Reflection):** `@LogExecutionTime` can be implemented with Reflection (manual interceptor) or Spring AOP. **Who** should use which approach? **When** does Spring AOP `@Around` advice add overhead? **What** is the benchmark difference between AOP proxy and direct method call?

<details><summary>Answer</summary>

**Who should use which:** Reflection (manual) = when you're building a standalone library with NO Spring dependency, or when you need annotation processing at class-load time. Spring AOP = when you're INSIDE a Spring Boot application. Let Spring manage the proxy creation â€” zero boilerplate, no manual `method.invoke()`. **When AOP advice adds overhead:** Every `@Transactional` or `@Around` advice goes through a PROXY METHOD CALL. Spring uses CGLIB to subclass your bean. The proxy intercepts the call, runs advice, then calls the real method. This proxy dispatch adds ~1-5 microseconds per call in the worst case. For methods called millions of times/second (hot paths), this matters. **Benchmark difference:** Direct method call: ~2ns. CGLIB proxy dispatch: ~50-200ns (25-100x slower). In practice: for typical Spring services processing ~1000 req/sec, each with ~5ms of actual work, 200ns per annotated method call = 0.004% overhead â€” completely negligible. Only matters for ultra-low-latency applications (HFT, game loops). **Production rule:** Don't pre-optimize AOP overhead. Profile first. If annotations are on hot inner loops, extract the logging/timing to a direct call in those paths.

</details>


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



ðŸ”¬ **Section Challenge â€” 10. Practical Example: Building @Validate**

**Challenge 1 (Validator Chain):** `@Validate` processes multiple constraints (NotNull, Size, Pattern) on a field. **Who** determines processing ORDER? **When** does short-circuit evaluation matter? **What** happens if two validators conflict (e.g., `@Size(min=5)` and `@Pattern(regexp=".{0,3}")`)?

<details><summary>Answer</summary>

**Who determines processing order:** The order annotation processors iterate over the annotation list. `field.getAnnotations()` returns annotations in order they appear in source code. In a custom validator, YOU control the order by iterating in the order you check. In Bean Validation (JSR 380 / Hibernate Validator), you can use `@GroupSequence` to define explicit group ordering. **When short-circuit matters:** Performance: if `@NotNull` fails (field is null), there's no point running `@Pattern` or `@Size` checks. Short-circuit on FIRST failure: `if (field == null) { errors.add("NotNull"); return; }`. This is particularly important for `@Size` on strings: checking size on a null string would throw NPE. Always validate nullness FIRST. **What happens with conflicting validators:** BOTH violations are reported (unless you short-circuit). `@Size(min=5)` â€” minimum 5 chars. `@Pattern(regexp=".{0,3}")` â€” max 3 chars. For a 4-char input: Size says VALID (â‰¥5? no, INVALID). Pattern says INVALID. For a 6-char input: Size says VALID. Pattern says INVALID. No input can satisfy both â€” this is a configuration bug, NOT detected by the framework. The developer must resolve conflicting constraints at design time. Bean Validation just reports all violations.

</details>


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
    
    private int age;  // no annotation â†’ use field name
    
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



ðŸ”¬ **Section Challenge â€” 11. Practical Example: Building Mini @JsonProperty**

**Challenge 1 (Serialization Field Ordering):** Your `@JsonProperty` implementation uses `getDeclaredFields()`. **Who** determines the order fields are serialized? **When** does field order matter in production? **What** Java 17 change affects field ordering guarantees?

<details><summary>Answer</summary>

**Who determines order:** The JVM. `getDeclaredFields()` returns fields in an implementation-defined order â€” it's typically SOURCE-ORDER (declaration order in the class) but the JVM spec does NOT guarantee this. Different JVM implementations or versions may return fields in different orders. **When field order matters in production:** (1) JSON responses where clients expect a stable field order for readability or comparison. (2) Binary serialization protocols (Protobuf, Avro) where field position maps to a wire ID â€” changing order breaks backward compatibility. (3) CSV serialization where column position matters. (4) Hash/signature computation over serialized JSON â€” field reordering changes the hash. **Java 17 change:** No major change in Java 17 specifically for field ordering. However, Java 17 introduced Record classes where the component order IS guaranteed to match declaration order. For `record Point(int x, int y)`, `getDeclaredFields()` always returns `[x, y]`. For regular classes, use `@JsonProperty(name="...", index=N)` or sort fields alphabetically for stable output: `Arrays.sort(fields, Comparator.comparing(Field::getName));`.

</details>


## 12. Meta-Annotations â€” Annotations ON Annotations

```java
// Spring's @Service is actually a meta-annotation:
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Component                        // â† Meta-annotation! @Service IS a @Component
public @interface Service {
    String value() default "";
}

// So when Spring scans for @Component, it also finds @Service, 
// @Repository, @Controller â€” because they're ALL @Component underneath!
```

### @Repeatable â€” Same Annotation Multiple Times

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

// Usage â€” same annotation twice!
@Schedule(cron = "0 0 * * * *")   // Every hour
@Schedule(cron = "0 0 9 * * MON") // Monday 9 AM
public void generateReport() { ... }
```

### @Inherited â€” Annotation Passes to Subclasses

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
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚              PERFORMANCE COMPARISON                          â”‚
â”‚                                                             â”‚
â”‚ Direct call:     user.getName()         â†’   ~2 ns           â”‚
â”‚ Reflection:      method.invoke(user)    â†’ ~50 ns            â”‚
â”‚                                                             â”‚
â”‚ That's ~25x slower!                                         â”‚
â”‚                                                             â”‚
â”‚ BUT: For framework initialization (once at startup),        â”‚
â”‚      this cost is IRRELEVANT                                â”‚
â”‚                                                             â”‚
â”‚ For hot loops (millions of calls), it MATTERS               â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
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
âœ… USE REFLECTION FOR:
  â€¢ Framework building (DI containers, ORM)
  â€¢ Plugin systems (discover classes at runtime)
  â€¢ Testing (access private methods)
  â€¢ Serialization (object â†’ JSON/XML)
  â€¢ Configuration-driven behavior

âŒ DON'T USE REFLECTION FOR:
  â€¢ Normal application code (use interfaces instead)
  â€¢ Performance-critical hot paths
  â€¢ When compile-time safety matters
  â€¢ Simple object creation (just use new)
```

---

## 14. Dynamic Proxy â€” Reflection's Power Feature

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
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ This is EXACTLY how Spring creates:                       â”‚
â”‚                                                           â”‚
â”‚ â€¢ @Transactional proxies (begin/commit/rollback)          â”‚
â”‚ â€¢ @Cacheable proxies (check cache, return if found)       â”‚
â”‚ â€¢ @Async proxies (submit to thread pool)                  â”‚
â”‚ â€¢ AOP aspects (before/after/around advice)                â”‚
â”‚                                                           â”‚
â”‚ JDK Dynamic Proxy â†’ interfaces only                       â”‚
â”‚ CGLIB Proxy       â†’ classes (subclass approach)           â”‚
â”‚ Spring default    â†’ CGLIB (since Spring Boot 2.x)         â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---



ðŸ”¬ **Section Challenge â€” 14. Dynamic Proxy â€” Reflection's Power Feature**

**Challenge 1 (Interface-Only Constraint):** `Proxy.newProxyInstance()` requires an INTERFACE array. **Who** breaks when you try to proxy a concrete class with JDK Dynamic Proxy? **When** does Spring automatically fall back to CGLIB? **What** happens if the `InvocationHandler` doesn't call `method.invoke(target, args)` for some methods?

<details><summary>Answer</summary>

**Who breaks:** The JDK Dynamic Proxy itself. `Proxy.newProxyInstance(classLoader, new Class<?>[]{ConcreteClass.class}, handler)` â€” if `ConcreteClass.class` is NOT an interface, it throws `IllegalArgumentException: not an interface`. JDK Dynamic Proxy can ONLY implement interfaces, never subclass concrete classes. **When Spring falls back to CGLIB:** Spring Boot 2.0+ defaults to `spring.aop.proxy-target-class=true`, meaning it ALWAYS uses CGLIB even for interface-implementing beans. Before Spring Boot 2.0, Spring used JDK proxies for beans implementing interfaces. **What happens if InvocationHandler skips `method.invoke()`:** The method returns `null` (or 0 for primitives) WITHOUT calling the real implementation. This is actually intentional in some patterns: Mock frameworks (Mockito) return stub values WITHOUT calling real code. Circuit breakers return fallback values when the circuit is OPEN. Caching proxies return cached values WITHOUT calling the real method. When writing a custom `InvocationHandler`, you must explicitly decide: call real method (`method.invoke(target, args)`) or return a fake value â€” there's no default passthrough.

</details>


## 15. Complete Reflection Cheat Sheet

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ OPERATION              â”‚ CODE                                   â”‚
â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”‚
â”‚ Get class              â”‚ obj.getClass() / Type.class             â”‚
â”‚ Get class by name      â”‚ Class.forName("com.example.Type")       â”‚
â”‚ Create instance        â”‚ clazz.getDeclaredConstructor().newInst()â”‚
â”‚ Get all fields         â”‚ clazz.getDeclaredFields()               â”‚
â”‚ Get specific field     â”‚ clazz.getDeclaredField("name")          â”‚
â”‚ Read field value       â”‚ field.setAccessible(true); field.get(o) â”‚
â”‚ Write field value      â”‚ field.set(obj, newValue)                â”‚
â”‚ Get all methods        â”‚ clazz.getDeclaredMethods()              â”‚
â”‚ Get specific method    â”‚ clazz.getDeclaredMethod("name", args)   â”‚
â”‚ Invoke method          â”‚ method.invoke(obj, args)                â”‚
â”‚ Check annotation       â”‚ elem.isAnnotationPresent(Anno.class)    â”‚
â”‚ Get annotation         â”‚ elem.getAnnotation(Anno.class)          â”‚
â”‚ Check modifiers        â”‚ Modifier.isPrivate(field.getModifiers())â”‚
â”‚ Create proxy           â”‚ Proxy.newProxyInstance(cl, ifs, handler) â”‚
â”‚ Check if interface     â”‚ clazz.isInterface()                     â”‚
â”‚ Check if enum          â”‚ clazz.isEnum()                          â”‚
â”‚ Check if array         â”‚ clazz.isArray()                         â”‚
â”‚ Get generic type       â”‚ field.getGenericType()                  â”‚
â”‚ Get superclass         â”‚ clazz.getSuperclass()                   â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

## 16. Interview Questions & Answers

**Q: What is reflection and when would you use it?**
Reflection lets you inspect & manipulate classes at runtime. Used by frameworks for DI, ORM, serialization, and testing. Don't use it in normal application code.

**Q: How does Spring @Autowired work internally?**
Spring scans for fields annotated with @Autowired, calls `field.setAccessible(true)`, then `field.set(bean, dependency)` using reflection.

**Q: Difference between `getFields()` and `getDeclaredFields()`?**
`getFields()` â†’ public fields including inherited. `getDeclaredFields()` â†’ all fields in this class only (including private), not inherited.

**Q: How can you break a Singleton using reflection?**
Get the private constructor, call `setAccessible(true)`, then `newInstance()`. Defense: use enum singleton or throw exception from constructor.

**Q: What are the 3 retention policies?**
SOURCE (compile only, e.g., @Override), CLASS (in .class file, default), RUNTIME (available via reflection, e.g., @Autowired).

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

**Key Takeaway**: Reflection is the BACKBONE of every Java framework. 
You use it indirectly every time you write `@Autowired`, `@Entity`, or `@Test`.
Understanding reflection = understanding HOW frameworks work.

**Navigation**: [< Java Networking & NIO](Ch13_Networking_NIO.md) | [Back to Index](../00_MASTER_INDEX.md) | [Events & Listeners >](Ch11_Events_Listeners.md)
