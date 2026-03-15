# 🔮 SPRING BOOT PART 0: THE HIDDEN FOUNDATIONS

> **Everything They Assume You Know But Never Teach**
> _The "invisible" knowledge gap between tutorials and real understanding_

---

# 🎯 WHY-HOW-WHEN-WHICH FRAMEWORK

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  WHY: Why Learn Hidden Foundations?                                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│  • Spring is 90% reflection/proxies - without understanding, it's magic        │
│  • Debug faster: Know WHY @Autowired fails, not just WHAT to copy              │
│  • Interview advantage: "Explain how Spring creates beans" - nail it          │
│  • Performance tuning: Understand connection pools, classloading              │
│  • Framework confidence: Build custom starters, understand auto-config        │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│  HOW: How These Foundations Power Spring?                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│  • Reflection: @Autowired, component scanning, bean creation                  │
│  • Proxies: @Transactional, @Cacheable, @Async - all proxy-based              │
│  • Servlet API: DispatcherServlet, filters, request lifecycle                 │
│  • Jackson: JSON serialization, @JsonIgnore, custom serializers               │
│  • Connection pools: HikariCP under the hood for database performance         │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│  WHEN: When to Study These Topics?                                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│  • Before Spring Boot: Understand what it's abstracting                        │
│  • When debugging: Proxy issues, injection failures, serialization bugs       │
│  • Interview prep: These are senior-level differentiators                     │
│  • Performance issues: Connection leaks, memory problems, slow startup        │
│  • Building libraries: Custom starters, shared components                     │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│  WHICH: Which Foundations are Most Critical?                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ESSENTIAL:     Reflection, Proxies, Servlet API                               │
│  IMPORTANT:     Jackson, Connection Pooling, Design Patterns                   │
│  ADVANCED:      Classloading, Bytecode, Annotation Processing                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

# TABLE OF CONTENTS

```
SECTION A: JAVA REFLECTION - THE MAGIC BEHIND SPRING
SECTION B: ANNOTATION PROCESSING - HOW @Annotations ACTUALLY WORK
SECTION C: PROXY PATTERNS - THE REAL SPRING MAGIC
SECTION D: SERVLET API - WHAT SPRING BOOT HIDES FROM YOU
SECTION E: JACKSON & SERIALIZATION - JSON ISN'T MAGIC
SECTION F: CONNECTION POOLING - DATABASE CONNECTIONS AREN'T FREE
SECTION G: CLASSLOADING - HOW YOUR CODE ACTUALLY RUNS
SECTION H: BUILD TOOLS INTERNALS - MAVEN/GRADLE DEEP DIVE
SECTION I: HTTP FUNDAMENTALS - BELOW THE FRAMEWORK
SECTION J: DESIGN PATTERNS IN SPRING - PATTERNS EVERYWHERE
SECTION K: THREADS & EXECUTORS - CONCURRENCY THAT MATTERS
SECTION L: GENERICS & TYPE ERASURE - THE JAVA DARK SECRET
SECTION M: BYTECODE & INSTRUMENTATION - ULTIMATE FOUNDATION
```

---

# SECTION A: JAVA REFLECTION - THE MAGIC BEHIND SPRING

## Why This Matters

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    SPRING IS 90% REFLECTION                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Spring Boot does ALL of this using Reflection:                                  │
│                                                                                  │
│  @Autowired          → Reflection finds field, injects bean                     │
│  @Component scan     → Reflection discovers classes                             │
│  @RequestMapping     → Reflection reads annotation metadata                     │
│  @Value("${prop}")   → Reflection sets field values                             │
│  @Transactional      → Reflection creates proxy at runtime                      │
│  Repository methods  → Reflection generates implementations!                    │
│                                                                                  │
│  WITHOUT UNDERSTANDING REFLECTION = SPRING IS MAGIC                             │
│  WITH REFLECTION KNOWLEDGE = SPRING IS LOGICAL                                  │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Theory Lens: Reflection Is Controlled Late Binding

Reflection is Java's runtime metadata system. It lets frameworks answer questions that are impossible to fully resolve at compile time: Which classes exist? Which methods carry a specific annotation? Which constructor can satisfy dependencies right now?

Think in three layers:

1. Discovery: identify classes, fields, methods, constructors, and annotations.
2. Decision: choose what to instantiate or invoke based on configuration and context.
3. Action: create objects, inject dependencies, and invoke handlers.

Spring's startup phase is mostly Discovery + Decision, while request handling is mostly Action over cached metadata. This is why reflection feels expensive in microbenchmarks but is usually acceptable in real applications: the expensive parts are amortized at startup.

The main trade-off is control vs safety. Reflection bypasses visibility rules and static guarantees, so production frameworks pair it with conventions, caches, validation, and deterministic lifecycle phases.

## A.1 What Is Reflection?

```java
// Normal Java: You know the class at COMPILE time
User user = new User();
user.setName("John");

// Reflection: You DON'T know the class at compile time
// You discover and manipulate it at RUNTIME
Class<?> clazz = Class.forName("com.example.User");
Object instance = clazz.getDeclaredConstructor().newInstance();
Method setter = clazz.getMethod("setName", String.class);
setter.invoke(instance, "John");
```

## A.2 The Class Object - Your Entry Point

```java
// EVERY class in Java has a Class object
// THREE WAYS to get it:

// Way 1: From class literal (compile time)
Class<User> clazz1 = User.class;

// Way 2: From instance (runtime)
User user = new User();
Class<?> clazz2 = user.getClass();

// Way 3: From string name (fully dynamic - Spring uses this!)
Class<?> clazz3 = Class.forName("com.example.User");
```

### What Can You Access via Class Object?

```java
Class<User> clazz = User.class;

// Get ALL information about the class
String name = clazz.getName();                    // "com.example.User"
String simpleName = clazz.getSimpleName();        // "User"
Package pkg = clazz.getPackage();                 // package info
Class<?> superclass = clazz.getSuperclass();      // parent class
Class<?>[] interfaces = clazz.getInterfaces();    // implemented interfaces
int modifiers = clazz.getModifiers();             // public, abstract, final, etc.

// Check modifiers
Modifier.isPublic(modifiers);    // true/false
Modifier.isAbstract(modifiers);  // true/false
Modifier.isFinal(modifiers);     // true/false
```

## A.3 Field Reflection - How @Autowired Works

```java
public class UserService {
    @Autowired
    private UserRepository userRepository;  // How does Spring set this?!
}
```

### Spring's Secret: Field Injection via Reflection

```java
public class SpringFieldInjector {
    
    public void injectDependencies(Object bean, ApplicationContext context) {
        Class<?> clazz = bean.getClass();
        
        // Get ALL fields (including private!)
        Field[] fields = clazz.getDeclaredFields();
        
        for (Field field : fields) {
            // Check if field has @Autowired
            if (field.isAnnotationPresent(Autowired.class)) {
                
                // Get the type Spring needs to inject
                Class<?> fieldType = field.getType();  // UserRepository.class
                
                // Find a bean of that type
                Object dependency = context.getBean(fieldType);
                
                // THE MAGIC: Make private field accessible!
                field.setAccessible(true);  // Bypass private!
                
                // Inject the dependency
                field.set(bean, dependency);
            }
        }
    }
}
```

### Field Reflection Complete API

```java
Class<User> clazz = User.class;

// Get public fields only (includes inherited)
Field[] publicFields = clazz.getFields();

// Get ALL declared fields (private, protected, public - but NOT inherited)
Field[] allFields = clazz.getDeclaredFields();

// Get specific field by name
Field nameField = clazz.getDeclaredField("name");

// Field information
String fieldName = nameField.getName();           // "name"
Class<?> fieldType = nameField.getType();         // String.class
int modifiers = nameField.getModifiers();         // private, final, etc.

// Read/Write field values
User user = new User();
nameField.setAccessible(true);  // Required for private fields!

// Read
Object value = nameField.get(user);  // Gets user.name

// Write
nameField.set(user, "John");  // Sets user.name = "John"
```

## A.4 Method Reflection - How Controllers Are Called

```java
@RestController
public class UserController {
    
    @GetMapping("/users/{id}")
    public User getUser(@PathVariable Long id) {
        return userService.findById(id);
    }
}

// Question: How does Spring know to call getUser() when /users/123 is hit?
// Answer: REFLECTION!
```

### Spring's Dispatcher Servlet (Simplified)

```java
public class SimpleDispatcher {
    
    private Map<String, MethodHandler> mappings = new HashMap<>();
    
    // At startup: Scan for @RequestMapping
    public void registerController(Object controller) {
        Class<?> clazz = controller.getClass();
        
        for (Method method : clazz.getDeclaredMethods()) {
            // Check for mapping annotations
            GetMapping getMapping = method.getAnnotation(GetMapping.class);
            if (getMapping != null) {
                String path = getMapping.value()[0];  // "/users/{id}"
                mappings.put("GET:" + path, new MethodHandler(controller, method));
            }
        }
    }
    
    // At runtime: When HTTP request comes
    public Object handleRequest(String httpMethod, String path, Object... args) {
        MethodHandler handler = mappings.get(httpMethod + ":" + path);
        
        // REFLECTION: Invoke the method!
        return handler.method.invoke(handler.controller, args);
    }
}
```

### Method Reflection Complete API

```java
Class<UserService> clazz = UserService.class;

// Get public methods (includes inherited from Object!)
Method[] publicMethods = clazz.getMethods();

// Get only declared methods (excludes inherited)
Method[] declaredMethods = clazz.getDeclaredMethods();

// Get specific method by name AND parameter types
Method findById = clazz.getMethod("findById", Long.class);
Method findByName = clazz.getMethod("findByName", String.class, boolean.class);

// Method information
String methodName = findById.getName();                    // "findById"
Class<?> returnType = findById.getReturnType();            // User.class
Class<?>[] paramTypes = findById.getParameterTypes();      // [Long.class]
Class<?>[] exceptions = findById.getExceptionTypes();      // declared throws

// INVOKE the method!
UserService service = new UserService();
Object result = findById.invoke(service, 123L);  // Calls service.findById(123L)

// For private methods
Method privateMethod = clazz.getDeclaredMethod("internalProcess");
privateMethod.setAccessible(true);  // Make it callable
privateMethod.invoke(service);
```

## A.5 Constructor Reflection - How Spring Creates Beans

```java
@Component
public class UserService {
    private final UserRepository repo;
    
    // Spring calls this constructor - but HOW?
    @Autowired
    public UserService(UserRepository repo) {
        this.repo = repo;
    }
}
```

### How Spring Instantiates Beans

```java
public class SpringBeanFactory {
    
    public Object createBean(Class<?> clazz) throws Exception {
        // Find constructors
        Constructor<?>[] constructors = clazz.getDeclaredConstructors();
        
        // Strategy 1: Look for @Autowired constructor
        for (Constructor<?> constructor : constructors) {
            if (constructor.isAnnotationPresent(Autowired.class)) {
                return createWithDependencies(constructor);
            }
        }
        
        // Strategy 2: Use single constructor if only one exists
        if (constructors.length == 1) {
            return createWithDependencies(constructors[0]);
        }
        
        // Strategy 3: Use no-arg constructor
        return clazz.getDeclaredConstructor().newInstance();
    }
    
    private Object createWithDependencies(Constructor<?> constructor) throws Exception {
        Class<?>[] paramTypes = constructor.getParameterTypes();
        Object[] args = new Object[paramTypes.length];
        
        // Resolve each dependency
        for (int i = 0; i < paramTypes.length; i++) {
            args[i] = applicationContext.getBean(paramTypes[i]);
        }
        
        constructor.setAccessible(true);
        return constructor.newInstance(args);
    }
}
```

### Constructor Reflection API

Constructor reflection is central to IoC because it models object graphs, not just objects. In plain Java, you manually wire constructor arguments. In Spring, the container inspects constructor signatures, resolves each parameter from the bean graph, then builds the instance with deterministic ordering.

Why this matters in design:

1. Constructor parameters become explicit dependency contracts.
2. Missing beans fail early at startup, not randomly at runtime.
3. Immutability becomes practical because dependencies can stay final.

In short, constructor reflection turns dependency wiring into a verifiable graph problem, which is one of the strongest foundations of reliable Spring applications.

```java
Class<UserService> clazz = UserService.class;

// Get all public constructors
Constructor<?>[] publicConstructors = clazz.getConstructors();

// Get ALL constructors (including private)
Constructor<?>[] allConstructors = clazz.getDeclaredConstructors();

// Get specific constructor by parameter types
Constructor<UserService> noArg = clazz.getDeclaredConstructor();
Constructor<UserService> withRepo = clazz.getDeclaredConstructor(UserRepository.class);

// Constructor info
Class<?>[] paramTypes = withRepo.getParameterTypes();

// Create instance
withRepo.setAccessible(true);  // If private
UserService instance = withRepo.newInstance(repoInstance);
```

## A.6 Annotation Reflection - How Spring Reads Configuration

```java
@Service
@Transactional
public class OrderService {
    
    @Autowired
    private OrderRepository repo;
    
    @Cacheable("orders")
    public Order findById(Long id) { ... }
}

// Spring reads EVERY annotation here using reflection!
```

### Reading Annotations

```java
Class<OrderService> clazz = OrderService.class;

// Check if annotation is present
boolean isService = clazz.isAnnotationPresent(Service.class);  // true
boolean isController = clazz.isAnnotationPresent(Controller.class);  // false

// Get specific annotation
Service serviceAnn = clazz.getAnnotation(Service.class);
String beanName = serviceAnn.value();  // Read annotation attributes

// Get ALL annotations
Annotation[] annotations = clazz.getAnnotations();          // Includes inherited
Annotation[] declared = clazz.getDeclaredAnnotations();     // Only on this class

// Annotations on methods
Method method = clazz.getMethod("findById", Long.class);
Cacheable cacheable = method.getAnnotation(Cacheable.class);
String[] cacheNames = cacheable.value();  // ["orders"]

// Annotations on fields
Field field = clazz.getDeclaredField("repo");
Autowired autowired = field.getAnnotation(Autowired.class);
boolean required = autowired.required();  // true by default

// Annotations on parameters
Parameter[] params = method.getParameters();
for (Parameter param : params) {
    if (param.isAnnotationPresent(PathVariable.class)) {
        PathVariable pv = param.getAnnotation(PathVariable.class);
        String varName = pv.value();
    }
}
```

## A.7 Generic Type Information - The Advanced Stuff

```java
// This is how Spring knows UserRepository extends JpaRepository<User, Long>

public interface UserRepository extends JpaRepository<User, Long> { }
```

### Reading Generic Types

```java
Class<UserRepository> clazz = UserRepository.class;

// Get generic interfaces
Type[] genericInterfaces = clazz.getGenericInterfaces();

for (Type type : genericInterfaces) {
    if (type instanceof ParameterizedType) {
        ParameterizedType pType = (ParameterizedType) type;
        
        Type rawType = pType.getRawType();  // JpaRepository
        Type[] typeArgs = pType.getActualTypeArguments();  // [User, Long]
        
        Class<?> entityClass = (Class<?>) typeArgs[0];  // User.class
        Class<?> idClass = (Class<?>) typeArgs[1];      // Long.class
        
        // NOW Spring knows the entity type!
    }
}
```

## A.8 Performance Considerations

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    REFLECTION PERFORMANCE                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Operation                        │ Speed vs Direct Call                        │
│  ─────────────────────────────────┼───────────────────────────────────────────│
│  Class.forName()                  │ ~10x slower (but cached)                   │
│  Method.invoke()                  │ ~3-5x slower                               │
│  Field.set/get()                  │ ~3-5x slower                               │
│  Constructor.newInstance()        │ ~3x slower                                 │
│                                                                                  │
│  WHY SPRING IS STILL FAST:                                                      │
│  1. Reflection happens at STARTUP (once)                                        │
│  2. Results are CACHED (bean definitions, mappings)                            │
│  3. Runtime calls use cached references                                         │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Spring's Caching Strategy

```java
// BAD: Reflection every time
public Object handleRequest(String path) {
    Class<?> clazz = Class.forName("com.example.Controller");  // SLOW!
    Method method = clazz.getMethod("handle");                  // SLOW!
    return method.invoke(clazz.newInstance());                  // SLOW!
}

// GOOD: Cache at startup (Spring's approach)
public class CachedDispatcher {
    private final Map<String, Method> methodCache = new HashMap<>();
    private final Map<String, Object> instanceCache = new HashMap<>();
    
    // Once at startup
    public void init() {
        Class<?> clazz = Class.forName("...");
        Method method = clazz.getMethod("handle");
        Object instance = clazz.newInstance();
        
        methodCache.put("/path", method);
        instanceCache.put("/path", instance);
    }
    
    // Fast at runtime
    public Object handleRequest(String path) {
        Method method = methodCache.get(path);      // O(1) lookup
        Object instance = instanceCache.get(path); // O(1) lookup
        return method.invoke(instance);             // Only this uses reflection
    }
}
```

---

# SECTION B: ANNOTATION PROCESSING - HOW @Annotations WORK

## Why This Matters

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  YOU USE ANNOTATIONS DAILY BUT NEVER ASK: HOW DO THEY WORK?                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  @Override          → Checked at COMPILE time (compiler magic)                  │
│  @Deprecated        → Warning at COMPILE time                                   │
│  @Autowired         → Processed at RUNTIME (Spring reflection)                  │
│  @Entity            → Processed at RUNTIME (Hibernate reflection)               │
│  @Getter (Lombok)   → Processed at COMPILE time (code generation!)              │
│                                                                                  │
│  THREE different mechanisms! Do you know which is which?                        │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Theory Lens: Compile-Time vs Runtime Metadata Pipelines

Annotations are only syntax until some engine gives them meaning. The key idea is to map each annotation to its processing phase:

1. Source phase: compiler-only hints like @Override.
2. Class phase: bytecode-visible metadata for tools.
3. Runtime phase: reflection-visible metadata for frameworks.

Spring mostly lives in runtime processing, Lombok mostly in compile-time processing. Confusion disappears once you ask one question for any annotation: Who reads it, and when?

This mental model also improves debugging. If an annotation seems ignored, validate its retention policy first, then verify that the expected processor (compiler plugin, framework scanner, or AOP subsystem) is actually active.

## B.1 Creating Custom Annotations

```java
// Annotations are INTERFACES with special syntax
@Target(ElementType.METHOD)           // Where can this annotation be used?
@Retention(RetentionPolicy.RUNTIME)   // When is it available?
@Documented                           // Include in JavaDoc?
public @interface LogExecutionTime {
    // Annotation elements (like methods that return values)
    String value() default "";
    boolean showArgs() default false;
    LogLevel level() default LogLevel.INFO;
}
```

### @Target Options

```java
@Target({
    ElementType.TYPE,            // Class, interface, enum
    ElementType.FIELD,           // Instance variables
    ElementType.METHOD,          // Methods
    ElementType.PARAMETER,       // Method parameters
    ElementType.CONSTRUCTOR,     // Constructors
    ElementType.LOCAL_VARIABLE,  // Local variables (rarely used - no reflection access)
    ElementType.ANNOTATION_TYPE, // Other annotations (meta-annotations)
    ElementType.PACKAGE,         // package-info.java
    ElementType.TYPE_PARAMETER,  // Generic type parameters <T>
    ElementType.TYPE_USE         // Any type use (Java 8+)
})
public @interface MyAnnotation { }
```

### @Retention - THE CRITICAL ONE

```java
// SOURCE: Discarded by compiler, not in .class file
// Used by: @Override, @SuppressWarnings
// You CANNOT read these at runtime!
@Retention(RetentionPolicy.SOURCE)
public @interface CompileTimeOnly { }

// CLASS: In .class file but NOT available at runtime
// Used by: Default if not specified
// Tools that read bytecode can see these
@Retention(RetentionPolicy.CLASS)
public @interface BytecodeOnly { }

// RUNTIME: Available for reflection at runtime
// Used by: @Autowired, @Entity, @RestController - ALL Spring annotations!
// THIS IS WHAT SPRING NEEDS
@Retention(RetentionPolicy.RUNTIME)
public @interface RuntimeAvailable { }
```

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    RETENTION POLICY COMPARISON                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Policy    │ In Source │ In .class │ At Runtime │ Example                       │
│  ──────────┼───────────┼───────────┼────────────┼─────────────────────────────│
│  SOURCE    │    ✅     │    ❌     │     ❌     │ @Override, @SuppressWarnings │
│  CLASS     │    ✅     │    ✅     │     ❌     │ Default, bytecode tools       │
│  RUNTIME   │    ✅     │    ✅     │     ✅     │ @Autowired, @Entity          │
│                                                                                  │
│  SPRING REQUIRES RUNTIME - it uses reflection to read annotations!             │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## B.2 Processing Annotations at Runtime (Spring's Way)

```java
// Custom annotation
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface LogExecutionTime {
    String value() default "";
}

// Usage
@Service
public class OrderService {
    
    @LogExecutionTime("order-creation")
    public Order createOrder(OrderRequest request) {
        // business logic
    }
}
```

### Build Your Own Annotation Processor (AOP Style)

```java
@Aspect
@Component
public class LoggingAspect {
    
    // Intercept ALL methods with @LogExecutionTime
    @Around("@annotation(logAnnotation)")
    public Object logTime(ProceedingJoinPoint joinPoint, 
                          LogExecutionTime logAnnotation) throws Throwable {
        
        String label = logAnnotation.value();  // "order-creation"
        
        long start = System.currentTimeMillis();
        try {
            return joinPoint.proceed();  // Execute actual method
        } finally {
            long duration = System.currentTimeMillis() - start;
            log.info("[{}] took {} ms", label, duration);
        }
    }
}
```

### Without AOP - Pure Reflection Processing

```java
public class AnnotationProcessor {
    
    public void processAnnotations(Object bean) {
        Class<?> clazz = bean.getClass();
        
        // Scan all methods
        for (Method method : clazz.getDeclaredMethods()) {
            
            // Check for our annotation
            if (method.isAnnotationPresent(LogExecutionTime.class)) {
                LogExecutionTime annotation = method.getAnnotation(LogExecutionTime.class);
                
                String label = annotation.value();
                boolean showArgs = annotation.showArgs();
                
                // Now we know this method should be logged
                // We could wrap it with a proxy...
            }
        }
    }
}
```

## B.3 Compile-Time Annotation Processing (Lombok's Way)

```java
// Lombok's @Getter doesn't use reflection at runtime
// It generates code at COMPILE time!

@Getter
@Setter
public class User {
    private String name;
}

// Lombok's annotation processor MODIFIES the AST (Abstract Syntax Tree)
// At compile time, it becomes:

public class User {
    private String name;
    
    public String getName() { return this.name; }
    public void setName(String name) { this.name = name; }
}
```

### How Compile-Time Processing Works

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    COMPILE-TIME PROCESSING FLOW                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Your Code (User.java with @Getter)                                             │
│       │                                                                          │
│       ▼                                                                          │
│  ┌──────────────────┐                                                           │
│  │ Java Compiler    │                                                           │
│  │ (javac)          │                                                           │
│  └────────┬─────────┘                                                           │
│           │                                                                      │
│           │ Finds annotation processor in META-INF/services                     │
│           │ javax.annotation.processing.Processor                               │
│           ▼                                                                      │
│  ┌──────────────────┐                                                           │
│  │ Lombok Processor │ ◄─── Runs DURING compilation                              │
│  │ Generates code   │                                                           │
│  └────────┬─────────┘                                                           │
│           │                                                                      │
│           ▼                                                                      │
│  Modified bytecode (User.class with getName/setName)                           │
│                                                                                  │
│  RESULT: No runtime cost! Methods exist in .class file                         │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## B.4 Creating a Compile-Time Annotation Processor

```java
// The annotation
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.SOURCE)  // Only needed at compile time
public @interface GenerateBuilder { }

// The processor
@SupportedAnnotationTypes("com.example.GenerateBuilder")
@SupportedSourceVersion(SourceVersion.RELEASE_17)
public class BuilderProcessor extends AbstractProcessor {
    
    @Override
    public boolean process(Set<? extends TypeElement> annotations, 
                          RoundEnvironment roundEnv) {
        
        for (Element element : roundEnv.getElementsAnnotatedWith(GenerateBuilder.class)) {
            if (element.getKind() == ElementKind.CLASS) {
                TypeElement classElement = (TypeElement) element;
                generateBuilderClass(classElement);
            }
        }
        return true;
    }
    
    private void generateBuilderClass(TypeElement classElement) {
        String className = classElement.getSimpleName() + "Builder";
        
        // Generate new Java file
        try {
            JavaFileObject file = processingEnv.getFiler()
                .createSourceFile(className);
            
            try (PrintWriter writer = new PrintWriter(file.openWriter())) {
                writer.println("public class " + className + " {");
                // Generate builder methods...
                writer.println("}");
            }
        } catch (IOException e) {
            processingEnv.getMessager().printMessage(
                Diagnostic.Kind.ERROR, 
                "Failed to generate builder: " + e.getMessage()
            );
        }
    }
}
```

---

# SECTION C: PROXY PATTERNS - THE REAL SPRING MAGIC

## Why Proxies Are THE Most Important Concept

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  @Transactional DOESN'T MODIFY YOUR CODE - IT WRAPS IT IN A PROXY              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Your Code:                           What Spring Creates:                      │
│                                                                                  │
│  @Service                             @Service                                  │
│  class UserService {                  class UserService$Proxy extends ... {    │
│      @Transactional                       private UserService target;          │
│      void save(User u) {                                                        │
│          repo.save(u);    ───────►        void save(User u) {                  │
│      }                                        beginTransaction();               │
│  }                                            try {                             │
│                                                   target.save(u);  // YOUR code│
│                                                   commit();                     │
│                                               } catch (Exception e) {          │
│                                                   rollback();                   │
│                                                   throw e;                      │
│                                               }                                 │
│                                           }                                     │
│                                       }                                         │
│                                                                                  │
│  When you @Autowired UserService, you get the PROXY, not your class!           │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Theory Lens: Proxies Are Behavioral Boundaries

A proxy is a boundary object that intercepts method calls before they reach business logic. That boundary is where cross-cutting concerns live: transactions, security, caching, retries, metrics, and tracing.

The important architectural shift is this: annotations like @Transactional are not "method modifiers" in the language sense; they are instructions for proxy generation. If a call path bypasses the proxy, the behavior disappears.

Design implication:

1. Public service boundaries are ideal interception points.
2. Internal private calls are poor interception points.
3. Explicit layering (controller -> service -> repository) makes proxy behavior predictable.

Once you see proxies as boundaries, many "Spring bugs" become simple call-path mistakes.

## C.1 JDK Dynamic Proxies - Interface-Based

```java
// JDK Proxy requires an INTERFACE

public interface UserService {
    void save(User user);
    User findById(Long id);
}

@Service
public class UserServiceImpl implements UserService {
    public void save(User user) { /* implementation */ }
    public User findById(Long id) { /* implementation */ }
}
```

### Creating a JDK Dynamic Proxy

```java
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;

public class TransactionProxyFactory {
    
    @SuppressWarnings("unchecked")
    public static <T> T createProxy(T target, Class<T> interfaceType) {
        
        return (T) Proxy.newProxyInstance(
            interfaceType.getClassLoader(),
            new Class<?>[] { interfaceType },
            new TransactionHandler(target)
        );
    }
}

class TransactionHandler implements InvocationHandler {
    private final Object target;
    
    public TransactionHandler(Object target) {
        this.target = target;
    }
    
    @Override
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        
        // Check if method has @Transactional
        if (method.isAnnotationPresent(Transactional.class)) {
            System.out.println("BEGIN TRANSACTION");
            try {
                Object result = method.invoke(target, args);  // Call real method
                System.out.println("COMMIT");
                return result;
            } catch (Exception e) {
                System.out.println("ROLLBACK");
                throw e;
            }
        }
        
        // No transaction needed
        return method.invoke(target, args);
    }
}
```

### Usage

```java
// Create the real service
UserService realService = new UserServiceImpl();

// Wrap it in transaction proxy
UserService proxiedService = TransactionProxyFactory.createProxy(
    realService, 
    UserService.class
);

// Now every call goes through the proxy
proxiedService.save(new User());  // Prints: BEGIN TRANSACTION, COMMIT
```

## C.2 CGLIB Proxies - Class-Based (No Interface Needed)

```java
// CGLIB can proxy classes WITHOUT interfaces
// This is what Spring uses when your @Service doesn't implement an interface

@Service
public class UserService {  // No interface!
    
    @Transactional
    public void save(User user) { /* implementation */ }
}
```

### How CGLIB Works

```java
import org.springframework.cglib.proxy.Enhancer;
import org.springframework.cglib.proxy.MethodInterceptor;
import org.springframework.cglib.proxy.MethodProxy;

public class CglibProxyFactory {
    
    @SuppressWarnings("unchecked")
    public static <T> T createProxy(Class<T> targetClass) {
        
        Enhancer enhancer = new Enhancer();
        enhancer.setSuperclass(targetClass);  // CGLIB SUBCLASSES your class!
        enhancer.setCallback(new TransactionInterceptor());
        
        return (T) enhancer.create();
    }
}

class TransactionInterceptor implements MethodInterceptor {
    
    @Override
    public Object intercept(Object obj, Method method, Object[] args, 
                           MethodProxy proxy) throws Throwable {
        
        if (method.isAnnotationPresent(Transactional.class)) {
            System.out.println("BEGIN TRANSACTION");
            try {
                // Call the REAL method (parent class)
                Object result = proxy.invokeSuper(obj, args);
                System.out.println("COMMIT");
                return result;
            } catch (Exception e) {
                System.out.println("ROLLBACK");
                throw e;
            }
        }
        
        return proxy.invokeSuper(obj, args);
    }
}
```

## C.3 JDK vs CGLIB - When Spring Uses Which

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    JDK PROXY vs CGLIB                                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Feature              │ JDK Dynamic Proxy       │ CGLIB                         │
│  ─────────────────────┼─────────────────────────┼─────────────────────────────│
│  Requires interface   │ YES                     │ NO                            │
│  How it works         │ Implements interface    │ Subclasses your class        │
│  Can proxy final class│ N/A (needs interface)  │ NO (can't subclass final)    │
│  Can proxy final method│ N/A                    │ NO (can't override final)    │
│  Performance          │ Slightly faster         │ Slightly slower (bytecode)   │
│  Included in JDK      │ YES                     │ NO (external library)        │
│                                                                                  │
│  SPRING BOOT DEFAULT: Uses CGLIB for all proxies (spring.aop.proxy-target-class=true)
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## C.4 The Famous @Transactional Self-Invocation Bug

```java
@Service
public class UserService {
    
    @Transactional
    public void methodA() {
        // Transaction works here
    }
    
    public void methodB() {
        methodA();  // ⚠️ NO TRANSACTION! Why?
    }
}
```

### Why It Happens

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    SELF-INVOCATION PROBLEM                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  External Call (through proxy):                                                  │
│  ┌──────────┐      ┌─────────────────┐      ┌──────────────┐                   │
│  │ Caller   │ ───► │ UserService$Proxy│ ───► │ Real Service │                   │
│  └──────────┘      │ (intercepts!)   │      └──────────────┘                   │
│                    └─────────────────┘                                          │
│                                                                                  │
│  Self-Invocation (BYPASSES proxy!):                                             │
│  ┌─────────────────────────────────────────────────────────────────┐           │
│  │ Real Service                                                     │           │
│  │                                                                   │           │
│  │  methodB() {                                                     │           │
│  │      this.methodA();  ◄─── "this" = Real object, NOT proxy!     │           │
│  │  }                         Transaction interceptor never runs    │           │
│  │                                                                   │           │
│  └─────────────────────────────────────────────────────────────────┘           │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Solutions

```java
// Solution 1: Inject self (proxy)
@Service
public class UserService {
    
    @Autowired
    private UserService self;  // This is the PROXY!
    
    public void methodB() {
        self.methodA();  // Goes through proxy = transaction works!
    }
}

// Solution 2: Use ApplicationContext
@Service
public class UserService {
    
    @Autowired
    private ApplicationContext context;
    
    public void methodB() {
        context.getBean(UserService.class).methodA();  // Gets proxy
    }
}

// Solution 3: Refactor to separate service
@Service
public class UserServiceA {
    @Transactional
    public void methodA() { }
}

@Service
public class UserServiceB {
    @Autowired
    private UserServiceA serviceA;
    
    public void methodB() {
        serviceA.methodA();  // Calls through proxy
    }
}
```

## C.5 Why @Transactional Doesn't Work on Private Methods

```java
@Service
public class UserService {
    
    @Transactional
    private void privateMethod() {  // ⚠️ Transaction NEVER works!
        // ...
    }
}
```

### The Reason

```
CGLIB creates a SUBCLASS of your service:

class UserService$CglibProxy extends UserService {
    
    @Override
    public void publicMethod() {  // Can override public
        // Add transaction logic
        super.publicMethod();
    }
    
    // CANNOT override private methods!
    // private methods are not inherited
    // So privateMethod() on proxy calls originalClass.privateMethod() directly
}

RESULT: Private methods bypass the proxy entirely
```

---

# SECTION D: SERVLET API - WHAT SPRING BOOT HIDES

## Why This Matters

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  SPRING MVC IS BUILT ON SERVLETS - YOU JUST DON'T SEE THEM                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  When you write:                     Behind the scenes:                         │
│                                                                                  │
│  @GetMapping("/users")               HttpServletRequest request                 │
│  public List<User> getUsers() {      HttpServletResponse response              │
│      return userService.findAll();   FilterChain chain                         │
│  }                                   DispatcherServlet                          │
│                                      RequestMapping handler                     │
│                                      View resolution                            │
│                                      ... and more!                              │
│                                                                                  │
│  Understanding Servlets = Understanding Spring MVC deeply                       │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Theory Lens: Servlet API Is the Mechanical Core of Spring MVC

Spring MVC is an abstraction layer over the servlet contract, not a replacement for it. Every HTTP exchange still becomes:

1. Request bytes parsed by the container.
2. Filter chain execution.
3. Dispatcher routing to handler logic.
4. Response writing and commit.

Understanding this pipeline gives you precise debugging leverage. Timeouts, CORS failures, body-read issues, and security behavior often happen before controller code executes.

A practical rule: when behavior is request-wide, inspect filters and servlet container settings first; when behavior is endpoint-specific, inspect handler mappings and argument resolution.

## D.1 The Servlet Lifecycle

```java
// A Servlet is the ORIGINAL Java web component
public class MyServlet extends HttpServlet {
    
    // Called ONCE when servlet is created
    @Override
    public void init(ServletConfig config) throws ServletException {
        super.init(config);
        // Load resources, initialize state
    }
    
    // Called for EVERY request
    @Override
    protected void doGet(HttpServletRequest request, 
                        HttpServletResponse response) 
            throws ServletException, IOException {
        
        // Read request
        String name = request.getParameter("name");
        
        // Write response
        response.setContentType("text/html");
        response.getWriter().println("<h1>Hello, " + name + "</h1>");
    }
    
    @Override
    protected void doPost(HttpServletRequest request, 
                         HttpServletResponse response) 
            throws ServletException, IOException {
        // Handle POST
    }
    
    // Called ONCE when servlet is destroyed
    @Override
    public void destroy() {
        // Release resources
    }
}
```

## D.2 HttpServletRequest - Everything About the Request

```java
@GetMapping("/debug")
public void debugRequest(HttpServletRequest request) {
    
    // === URL INFORMATION ===
    String method = request.getMethod();              // "GET", "POST"
    String uri = request.getRequestURI();             // "/api/users"
    String url = request.getRequestURL().toString();  // "http://localhost:8080/api/users"
    String queryString = request.getQueryString();    // "page=1&size=10"
    String contextPath = request.getContextPath();    // "" or "/myapp"
    String servletPath = request.getServletPath();    // "/api/users"
    
    // === PARAMETERS ===
    String page = request.getParameter("page");       // "1" (single value)
    String[] values = request.getParameterValues("ids"); // Multiple values
    Map<String, String[]> allParams = request.getParameterMap();
    
    // === HEADERS ===
    String contentType = request.getHeader("Content-Type");
    String auth = request.getHeader("Authorization");
    Enumeration<String> headerNames = request.getHeaderNames();
    
    // === BODY (for POST/PUT) ===
    BufferedReader reader = request.getReader();      // Text body
    InputStream stream = request.getInputStream();    // Binary body
    
    // === SESSION ===
    HttpSession session = request.getSession();       // Creates if not exists
    HttpSession session2 = request.getSession(false); // Returns null if not exists
    
    // === CLIENT INFO ===
    String remoteAddr = request.getRemoteAddr();      // Client IP
    String remoteHost = request.getRemoteHost();      // Client hostname
    int remotePort = request.getRemotePort();         // Client port
    
    // === ATTRIBUTES (request-scoped storage) ===
    request.setAttribute("user", currentUser);        // Set
    Object user = request.getAttribute("user");       // Get
    request.removeAttribute("user");                  // Remove
}
```

## D.3 HttpServletResponse - Controlling the Response

```java
@GetMapping("/download")
public void customResponse(HttpServletResponse response) throws IOException {
    
    // === STATUS CODE ===
    response.setStatus(HttpServletResponse.SC_OK);           // 200
    response.setStatus(HttpServletResponse.SC_CREATED);      // 201
    response.setStatus(HttpServletResponse.SC_NOT_FOUND);    // 404
    
    // === HEADERS ===
    response.setHeader("X-Custom", "value");          // Set (replaces)
    response.addHeader("X-Custom", "value2");         // Add (appends)
    response.setContentType("application/json");      // Content-Type
    response.setCharacterEncoding("UTF-8");
    
    // === COOKIES ===
    Cookie cookie = new Cookie("session", "abc123");
    cookie.setMaxAge(3600);       // 1 hour
    cookie.setHttpOnly(true);     // Not accessible via JavaScript
    cookie.setSecure(true);       // HTTPS only
    cookie.setPath("/");
    response.addCookie(cookie);
    
    // === BODY ===
    PrintWriter writer = response.getWriter();        // For text
    OutputStream stream = response.getOutputStream(); // For binary
    
    // === REDIRECTS ===
    response.sendRedirect("/other");                  // 302 redirect
    
    // === ERRORS ===
    response.sendError(HttpServletResponse.SC_FORBIDDEN, "Access denied");
}
```

## D.4 Filters - The Pipeline Before Controllers

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    HTTP REQUEST FLOW IN SPRING                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  HTTP Request                                                                    │
│       │                                                                          │
│       ▼                                                                          │
│  ┌──────────────────┐                                                           │
│  │ Filter 1         │  ◄── Logging, CORS, Security checks                       │
│  │ (SecurityFilter) │                                                            │
│  └────────┬─────────┘                                                           │
│           │                                                                      │
│           ▼                                                                      │
│  ┌──────────────────┐                                                           │
│  │ Filter 2         │  ◄── Request/Response modification                        │
│  │ (CustomFilter)   │                                                            │
│  └────────┬─────────┘                                                           │
│           │                                                                      │
│           ▼                                                                      │
│  ┌──────────────────┐                                                           │
│  │ DispatcherServlet│  ◄── Spring's main servlet                               │
│  └────────┬─────────┘                                                           │
│           │                                                                      │
│           ▼                                                                      │
│  ┌──────────────────┐                                                           │
│  │ HandlerMapping   │  ◄── Finds the right @Controller                          │
│  └────────┬─────────┘                                                           │
│           │                                                                      │
│           ▼                                                                      │
│  ┌──────────────────┐                                                           │
│  │ @Controller      │  ◄── Your code                                            │
│  │ method           │                                                            │
│  └──────────────────┘                                                           │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Creating Custom Filters

```java
@Component
@Order(1)  // Lower = earlier in chain
public class RequestLoggingFilter implements Filter {
    
    @Override
    public void doFilter(ServletRequest request, 
                        ServletResponse response, 
                        FilterChain chain) throws IOException, ServletException {
        
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;
        
        // BEFORE controller
        long startTime = System.currentTimeMillis();
        String requestId = UUID.randomUUID().toString();
        
        log.info("[{}] {} {} started", 
                requestId, httpRequest.getMethod(), httpRequest.getRequestURI());
        
        // Pass to next filter (or controller)
        chain.doFilter(request, response);
        
        // AFTER controller
        long duration = System.currentTimeMillis() - startTime;
        log.info("[{}] completed in {} ms with status {}", 
                requestId, duration, httpResponse.getStatus());
    }
}
```

### Filter vs Interceptor vs AOP

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    FILTER vs INTERCEPTOR vs AOP                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Component      │ Level        │ Access To           │ Use Case                 │
│  ───────────────┼──────────────┼─────────────────────┼─────────────────────────│
│  Filter         │ Servlet      │ Request/Response    │ Security, CORS, Logging │
│  (javax.servlet)│              │ (raw bytes)         │ Request modification    │
│                 │              │                     │                          │
│  Interceptor    │ Spring MVC   │ Handler, Request,   │ Pre/post processing     │
│  (HandlerInter.)│              │ ModelAndView        │ Auth, Validation        │
│                 │              │                     │                          │
│  AOP            │ Spring Bean  │ Method parameters,  │ Transactions, Logging   │
│  (@Aspect)      │              │ Return values       │ Cross-cutting concerns  │
│                 │              │                     │                          │
│  ORDER: Filter → Interceptor → AOP → Controller → AOP → Interceptor → Filter  │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## D.5 Understanding DispatcherServlet

```java
// DispatcherServlet is THE single servlet in Spring MVC
// ALL requests go through it

public class DispatcherServlet extends FrameworkServlet {
    
    // Simplified version of what it does
    protected void doDispatch(HttpServletRequest request, 
                             HttpServletResponse response) throws Exception {
        
        // 1. Find handler (controller method) for this request
        HandlerExecutionChain handler = getHandler(request);
        
        // 2. Find adapter for the handler
        HandlerAdapter adapter = getHandlerAdapter(handler.getHandler());
        
        // 3. Run interceptors (preHandle)
        if (!handler.applyPreHandle(request, response)) {
            return;
        }
        
        // 4. Execute controller method
        ModelAndView mv = adapter.handle(request, response, handler.getHandler());
        
        // 5. Run interceptors (postHandle)
        handler.applyPostHandle(request, response, mv);
        
        // 6. Render view (or write JSON response)
        processDispatchResult(request, response, handler, mv);
    }
}
```

---

# SECTION E: JACKSON & SERIALIZATION - JSON ISN'T MAGIC

## Why This Matters

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  EVERY @RestController USES JACKSON - DO YOU KNOW HOW?                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  @GetMapping("/user")                                                           │
│  public User getUser() {                                                        │
│      return new User("John", 25);                                               │
│  }                                                                              │
│                                                                                  │
│  // Response: {"name":"John","age":25}                                          │
│                                                                                  │
│  @PostMapping("/user")                                                          │
│  public void create(@RequestBody User user) {                                   │
│      // user.name = "John", user.age = 25                                       │
│  }                                                                              │
│                                                                                  │
│  WHO CONVERTS JAVA ↔ JSON?  JACKSON!                                           │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Theory Lens: Serialization Is a Contract, Not a Convenience

JSON conversion is often treated as a utility concern, but in distributed systems it is part of your public contract. Field names, null handling, date formats, enum representation, and polymorphic type metadata determine interoperability and backward compatibility.

Jackson's core job is schema projection:

1. Read Java type model + annotations.
2. Build serializer/deserializer pipelines.
3. Apply configuration rules consistently.

When APIs evolve, serialization choices become versioning decisions. Stable contracts require explicit naming strategy, predictable defaults, and deliberate compatibility policy for added or removed fields.

## E.1 ObjectMapper - The Core Component

```java
// ObjectMapper is Jackson's main class
ObjectMapper mapper = new ObjectMapper();

// Java → JSON (Serialization)
User user = new User("John", 25);
String json = mapper.writeValueAsString(user);
// {"name":"John","age":25}

// JSON → Java (Deserialization)
String json = "{\"name\":\"Jane\",\"age\":30}";
User user = mapper.readValue(json, User.class);
```

### How Jackson Serializes

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    JACKSON SERIALIZATION PROCESS                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  User object                                                                     │
│       │                                                                          │
│       ▼                                                                          │
│  ┌──────────────────────────────────────────────────────────────────────┐      │
│  │ 1. INTROSPECTION (Using Reflection!)                                 │      │
│  │    - Finds all getters: getName(), getAge()                          │      │
│  │    - Removes "get" prefix → "name", "age"                            │      │
│  │    - Checks for @JsonProperty annotations                            │      │
│  └────────────────────────────────────────────────────────────────────┬─┘      │
│                                                                        │        │
│                                                                        ▼        │
│  ┌──────────────────────────────────────────────────────────────────────┐      │
│  │ 2. SERIALIZATION                                                      │      │
│  │    - Calls each getter: user.getName() → "John"                      │      │
│  │    - Converts to JSON representation                                  │      │
│  │    - Handles nested objects recursively                              │      │
│  └────────────────────────────────────────────────────────────────────┬─┘      │
│                                                                        │        │
│                                                                        ▼        │
│  {"name":"John","age":25}                                                      │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## E.2 Jackson Annotations

### @JsonProperty - Control the JSON field name

```java
public class User {
    
    @JsonProperty("user_name")  // JSON: {"user_name": "John"}
    private String name;
    
    @JsonProperty(access = Access.READ_ONLY)  // Only in response, ignored in request
    private LocalDateTime createdAt;
    
    @JsonProperty(access = Access.WRITE_ONLY)  // Only in request, hidden in response
    private String password;
}
```

### @JsonIgnore - Exclude fields

```java
public class User {
    private String name;
    
    @JsonIgnore  // Never serialized or deserialized
    private String password;
    
    @JsonIgnore
    private transient String internalState;
}
```

### @JsonFormat - Date/Time formatting

```java
public class Order {
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime orderDate;
    
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "dd-MM-yyyy")
    private Date birthDate;
    
    @JsonFormat(shape = JsonFormat.Shape.STRING)  // Serialize number as string
    private BigDecimal amount;
}
```

### @JsonInclude - Null handling

```java
@JsonInclude(JsonInclude.Include.NON_NULL)  // Exclude null fields from JSON
public class User {
    private String name;      // Included if not null
    private String email;     // Excluded if null
    private Integer age;      // Excluded if null
}

// If email is null:
// {"name":"John","age":25}  ← No "email" field
```

### @JsonNaming - Property naming strategy

```java
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public class UserProfile {
    private String firstName;   // → "first_name"
    private String lastName;    // → "last_name"
    private int userAge;        // → "user_age"
}
```

### @JsonCreator & @JsonValue

```java
public enum Status {
    ACTIVE("A"),
    INACTIVE("I");
    
    private String code;
    
    @JsonCreator  // How to deserialize
    public static Status fromCode(String code) {
        return Arrays.stream(values())
            .filter(s -> s.code.equals(code))
            .findFirst()
            .orElseThrow();
    }
    
    @JsonValue  // How to serialize
    public String getCode() {
        return code;
    }
}
// JSON: "A" ↔ Status.ACTIVE
```

## E.3 Custom Serializers & Deserializers

```java
// When annotations aren't enough - full control

public class MoneySerializer extends JsonSerializer<BigDecimal> {
    
    @Override
    public void serialize(BigDecimal value, JsonGenerator gen, 
                         SerializerProvider provider) throws IOException {
        if (value != null) {
            gen.writeString("$" + value.setScale(2, RoundingMode.HALF_UP));
        }
    }
}

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

# SECTION F: CONNECTION POOLING - DATABASE CONNECTIONS AREN'T FREE

## Why This Matters

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  CREATING A DATABASE CONNECTION IS EXPENSIVE!                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Creating ONE connection:                                                        │
│  1. DNS lookup for database host                                                │
│  2. TCP handshake (3-way)                                                       │
│  3. TLS handshake (if SSL)                                                      │
│  4. Database authentication                                                      │
│  5. Session initialization                                                       │
│                                                                                  │
│  TIME: 50-200ms PER CONNECTION                                                  │
│                                                                                  │
│  If you create a new connection for every query:                                │
│  - 10 queries = 500-2000ms just in connection overhead!                        │
│                                                                                  │
│  CONNECTION POOLING: Reuse connections!                                         │
│  - Connection created once at startup                                           │
│  - Borrowed for query, returned to pool                                         │
│  - 10 queries = ~0ms connection overhead                                        │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Theory Lens: Connection Pools Convert Setup Cost into Queueing Dynamics

Without pooling, latency is dominated by repeated connection setup. With pooling, latency shifts to queueing and contention behavior under load. This is a systems trade-off, not just a configuration trick.

Key dynamics to reason about:

1. Pool too small -> threads wait, latency spikes, throughput stalls.
2. Pool too large -> DB server thrashes, context switching increases.
3. Leaks -> effective pool size collapses over time.

Pool tuning should follow workload shape, transaction duration, and database concurrency limits, not arbitrary defaults.

## F.1 How Connection Pooling Works

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    CONNECTION POOL LIFECYCLE                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Application Start:                                                              │
│  ┌────────────────────────────────────────────┐                                 │
│  │ Connection Pool (HikariCP)                 │                                 │
│  │                                            │                                 │
│  │  [Conn1][Conn2][Conn3][Conn4][Conn5]      │ ◄── Minimum idle connections    │
│  │    ↑      ↑      ↑      ↑      ↑          │      created at startup         │
│  │   idle   idle   idle   idle   idle        │                                 │
│  │                                            │                                 │
│  └────────────────────────────────────────────┘                                 │
│                                                                                  │
│  Request comes in:                                                               │
│  ┌────────────────────────────────────────────┐                                 │
│  │ Connection Pool                            │                                 │
│  │                                            │                                 │
│  │  [    ][Conn2][Conn3][Conn4][Conn5]       │                                 │
│  │    ↑                                       │                                 │
│  │   Conn1 borrowed by Thread-1               │                                 │
│  │                                            │                                 │
│  └────────────────────────────────────────────┘                                 │
│                                                                                  │
│  Query completes:                                                                │
│  ┌────────────────────────────────────────────┐                                 │
│  │ Connection Pool                            │                                 │
│  │                                            │                                 │
│  │  [Conn1][Conn2][Conn3][Conn4][Conn5]      │ ◄── Conn1 returned to pool     │
│  │    ↑                                       │      (NOT closed!)             │
│  │   idle again                               │                                 │
│  │                                            │                                 │
│  └────────────────────────────────────────────┘                                 │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

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
      minimum-idle: 5           # Minimum connections to keep in pool
      maximum-pool-size: 10     # Maximum connections in pool
      
      # Timeouts
      connection-timeout: 30000      # Max wait for connection (30s)
      idle-timeout: 600000          # How long idle connection lives (10min)
      max-lifetime: 1800000         # Max age of connection (30min)
      
      # Validation
      validation-timeout: 5000      # Time to validate connection
      
      # Performance
      auto-commit: true
      pool-name: MyHikariPool
```

## F.3 Connection Pool Sizing

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    POOL SIZING FORMULA                                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  connections = ((core_count * 2) + effective_spindle_count)                     │
│                                                                                  │
│  For SSD with 4-core CPU:                                                       │
│  connections = (4 * 2) + 1 = 9-10 connections                                   │
│                                                                                  │
│  IMPORTANT: More connections ≠ Better performance!                              │
│                                                                                  │
│  Why?                                                                            │
│  - Database has limited CPU cores                                               │
│  - More connections = More context switching                                    │
│  - Diminishing returns after optimal point                                      │
│                                                                                  │
│  RULE OF THUMB:                                                                 │
│  - Web app: 10-20 connections per instance                                      │
│  - Batch processing: Higher (dedicated resources)                               │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

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

# SECTION G: CLASSLOADING - HOW YOUR CODE RUNS

## Why This Matters

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  CLASS NOT FOUND? NO CLASS DEF FOUND? CLASS CAST EXCEPTION (SAME CLASS!)?      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  These errors are CLASSLOADER problems!                                          │
│                                                                                  │
│  Understanding classloaders helps you:                                           │
│  - Debug mysterious ClassNotFoundException                                       │
│  - Understand Spring context hierarchies                                         │
│  - Debug "duplicate class" issues                                                │
│  - Understand hot reloading (like Spring DevTools)                              │
│  - Work with modular applications                                                │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Theory Lens: Classloading Is a Namespace Strategy

A class is identified by both fully qualified name and classloader identity. Two classes with the same name but different loaders are different types. This explains many surprising runtime failures.

Parent delegation exists to preserve core type consistency and security boundaries. Child loaders can add behavior (plugins, reloading), but they also introduce identity splits.

When debugging class issues, always ask:

1. Which loader loaded this class?
2. Is the same logical class loaded by multiple loaders?
3. Is parent delegation being intentionally or accidentally bypassed?

This viewpoint makes classloading errors deterministic instead of mysterious.

## G.1 Classloader Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    CLASSLOADER HIERARCHY                                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│                    ┌───────────────────┐                                        │
│                    │ Bootstrap         │ ◄── Loads: java.lang.*, java.util.*   │
│                    │ ClassLoader       │     (rt.jar - core Java)              │
│                    │ (native code)     │                                        │
│                    └─────────┬─────────┘                                        │
│                              │                                                   │
│                              ▼                                                   │
│                    ┌───────────────────┐                                        │
│                    │ Platform          │ ◄── Loads: Java extensions            │
│                    │ ClassLoader       │     (jre/lib/ext)                      │
│                    └─────────┬─────────┘                                        │
│                              │                                                   │
│                              ▼                                                   │
│                    ┌───────────────────┐                                        │
│                    │ Application       │ ◄── Loads: Your code, dependencies    │
│                    │ ClassLoader       │     (classpath)                        │
│                    └─────────┬─────────┘                                        │
│                              │                                                   │
│                              ▼                                                   │
│               ┌──────────────┴──────────────┐                                   │
│               │                              │                                   │
│    ┌──────────────────┐          ┌──────────────────┐                          │
│    │ Custom Loader 1  │          │ Custom Loader 2  │                          │
│    │ (Web App 1)      │          │ (Web App 2)      │                          │
│    └──────────────────┘          └──────────────────┘                          │
│                                                                                  │
│  PARENT DELEGATION: Child asks parent first before loading itself              │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

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

## G.4 Spring DevTools Hot Reload

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    HOW SPRING DEVTOOLS WORKS                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Without DevTools:                                                               │
│  - Change User.java → Restart entire application → 10-30 seconds               │
│                                                                                  │
│  With DevTools:                                                                  │
│  - Your code: Loaded by "RestartClassLoader" (custom)                          │
│  - Dependencies: Loaded by base classloader (not reloaded)                      │
│                                                                                  │
│  Change detected:                                                                │
│  1. Only RestartClassLoader is thrown away                                      │
│  2. New RestartClassLoader created                                              │
│  3. Your classes reloaded (fast!)                                               │
│  4. Dependencies stay loaded (not reloaded)                                     │
│                                                                                  │
│  Result: Restart in 1-3 seconds instead of 10-30!                              │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

# SECTION H: BUILD TOOLS INTERNALS - MAVEN/GRADLE

## Why This Matters

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  BUILD FAILURES? DEPENDENCY CONFLICTS? UNDERSTANDING LIFECYCLES?               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  You use Maven/Gradle daily but:                                                │
│  - "mvn clean install" - what does each word mean?                              │
│  - Why does "provided" scope exist?                                             │
│  - How does transitive dependency resolution work?                              │
│  - What's the difference between compile and runtime?                           │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Theory Lens: Build Tools Are Dependency Graph Solvers

Maven and Gradle are more than command launchers. They resolve directed graphs under version and scope constraints, then materialize reproducible classpaths across phases.

Three conceptual layers:

1. Lifecycle semantics: what should happen (compile, test, package).
2. Dependency resolution: which artifacts and versions are selected.
3. Plugin execution: how tasks are actually performed.

Most build failures can be mapped to one of these layers. Treating them separately dramatically improves root-cause speed and prevents trial-and-error command usage.

## H.1 Maven Lifecycle Phases

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    MAVEN BUILD LIFECYCLE                                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  mvn [phase]  →  Runs all phases UP TO AND INCLUDING that phase                │
│                                                                                  │
│  Phase           │ What It Does                                                 │
│  ────────────────┼────────────────────────────────────────────────────────────│
│  validate        │ Validate project is correct                                 │
│  compile         │ Compile source code (src/main/java → target/classes)       │
│  test            │ Run unit tests (src/test/java)                              │
│  package         │ Create JAR/WAR file (target/*.jar)                          │
│  verify          │ Run integration tests                                        │
│  install         │ Install to local .m2 repository                             │
│  deploy          │ Upload to remote repository (Nexus, etc.)                   │
│                                                                                  │
│  "mvn install" runs: validate → compile → test → package → verify → install   │
│                                                                                  │
│  OTHER COMMANDS:                                                                 │
│  mvn clean       │ Delete target/ directory                                    │
│  mvn clean install │ Delete target/, then full build                          │
│  mvn package -DskipTests │ Package without running tests                      │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## H.2 Dependency Scopes

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    MAVEN DEPENDENCY SCOPES                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Scope      │ Compile │ Test │ Runtime │ Transitive │ Example                  │
│  ───────────┼─────────┼──────┼─────────┼────────────┼────────────────────────│
│  compile    │   ✅    │  ✅  │   ✅    │    ✅      │ spring-boot-starter     │
│  (default)  │         │      │         │            │                          │
│             │         │      │         │            │                          │
│  provided   │   ✅    │  ✅  │   ❌    │    ❌      │ servlet-api (provided   │
│             │         │      │         │            │ by Tomcat)               │
│             │         │      │         │            │                          │
│  runtime    │   ❌    │  ✅  │   ✅    │    ✅      │ JDBC drivers (mysql-    │
│             │         │      │         │            │ connector-java)          │
│             │         │      │         │            │                          │
│  test       │   ❌    │  ✅  │   ❌    │    ❌      │ JUnit, Mockito           │
│             │         │      │         │            │                          │
│  system     │   ✅    │  ✅  │   ✅    │    ❌      │ Local JAR file          │
│             │         │      │         │            │ (avoid this!)            │
│                                                                                  │
│  COMMON CONFUSION:                                                               │
│  Q: Why is Lombok "provided" in some projects?                                  │
│  A: It generates code at COMPILE time. At runtime, generated code exists,      │
│     no need for Lombok JAR. But usually it's "compile" scope for simplicity.   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## H.3 Transitive Dependencies

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    TRANSITIVE DEPENDENCY RESOLUTION                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Your pom.xml:                                                                   │
│  <dependency>                                                                    │
│      <groupId>org.springframework.boot</groupId>                                │
│      <artifactId>spring-boot-starter-web</artifactId>                          │
│  </dependency>                                                                   │
│                                                                                  │
│  What you actually get:                                                          │
│                                                                                  │
│  spring-boot-starter-web                                                        │
│  ├── spring-boot-starter                                                        │
│  │   ├── spring-boot                                                            │
│  │   ├── spring-boot-autoconfigure                                              │
│  │   └── spring-core                                                            │
│  ├── spring-boot-starter-json                                                   │
│  │   ├── jackson-databind                                                       │
│  │   └── jackson-core                                                           │
│  ├── spring-boot-starter-tomcat                                                │
│  │   └── tomcat-embed-core                                                      │
│  └── spring-webmvc                                                              │
│      ├── spring-aop                                                             │
│      ├── spring-beans                                                           │
│      └── spring-context                                                         │
│                                                                                  │
│  ONE dependency = 20+ JARs downloaded automatically!                            │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
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
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    VERSION CONFLICT RESOLUTION                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Your project has:                                                               │
│  - Library A depends on Guava 28.0                                              │
│  - Library B depends on Guava 30.0                                              │
│                                                                                  │
│  MAVEN'S RULE: "Nearest Definition Wins"                                        │
│                                                                                  │
│  your-project                                                                    │
│  ├── library-a                                                                   │
│  │   └── guava:28.0    (depth 2)                                               │
│  └── library-b                                                                   │
│      └── guava:30.0    (depth 2)                                               │
│                                                                                  │
│  Same depth? FIRST ONE WINS (order in pom.xml matters!)                        │
│                                                                                  │
│  PROBLEM: What if library-a needs Guava 30 features?                           │
│           → RuntimeException!                                                   │
│                                                                                  │
│  SOLUTION: Explicitly declare version in YOUR pom.xml                          │
│                                                                                  │
│  <dependency>                                                                    │
│      <groupId>com.google.guava</groupId>                                        │
│      <artifactId>guava</artifactId>                                             │
│      <version>30.0-jre</version>  ◄── Your explicit version wins               │
│  </dependency>                                                                   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
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

# SECTION I: HTTP FUNDAMENTALS - BELOW THE FRAMEWORK

## Why This Matters

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  SPRING HIDES ALL HTTP COMPLEXITY - BUT YOU MUST UNDERSTAND IT                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  When debugging:                                                                 │
│  - Why is my request timing out?                                                │
│  - Why does the load balancer keep failing health checks?                       │
│  - Why is CORS failing?                                                          │
│  - Why am I getting 502 Bad Gateway?                                            │
│                                                                                  │
│  You need to understand HTTP at the raw level!                                  │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Theory Lens: HTTP Is a Semantics Protocol, Not Just Transport

HTTP methods, status codes, headers, caching directives, and content negotiation encode system intent. Correct semantics improve reliability, scalability, and observability.

Examples:

1. Idempotent methods enable safe retries behind gateways.
2. Correct cache headers reduce origin load and latency.
3. Precise status codes improve client behavior and incident triage.

Frameworks hide syntax, but they cannot choose semantics for you. Good API design starts with protocol correctness before endpoint implementation.

## I.1 HTTP Message Format

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    RAW HTTP REQUEST                                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  POST /api/users HTTP/1.1                 ← Request line                        │
│  Host: api.example.com                    ← Headers start                       │
│  Content-Type: application/json                                                  │
│  Authorization: Bearer eyJhbGc...                                               │
│  Content-Length: 45                                                              │
│  Accept: application/json                                                        │
│                                           ← Empty line (CRLF)                   │
│  {"name":"John","email":"john@test.com"}  ← Body                                │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                    RAW HTTP RESPONSE                                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  HTTP/1.1 201 Created                     ← Status line                         │
│  Content-Type: application/json           ← Headers start                       │
│  Location: /api/users/123                                                        │
│  Content-Length: 67                                                              │
│                                           ← Empty line (CRLF)                   │
│  {"id":123,"name":"John","email":"john@test.com"}  ← Body                       │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## I.2 HTTP Methods - Semantic Meaning

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    HTTP METHODS DEEP DIVE                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Method   │ Safe │ Idempotent │ Has Body │ Use Case                             │
│  ─────────┼──────┼────────────┼──────────┼─────────────────────────────────────│
│  GET      │  ✅  │     ✅     │    ❌    │ Retrieve resource                    │
│  HEAD     │  ✅  │     ✅     │    ❌    │ Like GET but no body (check exists)  │
│  OPTIONS  │  ✅  │     ✅     │    ❌    │ Get allowed methods (CORS preflight) │
│  POST     │  ❌  │     ❌     │    ✅    │ Create resource (not idempotent!)    │
│  PUT      │  ❌  │     ✅     │    ✅    │ Replace entire resource              │
│  PATCH    │  ❌  │     ❌     │    ✅    │ Partial update                       │
│  DELETE   │  ❌  │     ✅     │    ❌*   │ Remove resource                      │
│                                                                                  │
│  SAFE: Doesn't modify server state                                              │
│  IDEMPOTENT: Multiple identical requests = same result                          │
│                                                                                  │
│  EXAMPLE:                                                                        │
│  - POST /orders twice = 2 orders created (NOT idempotent)                       │
│  - PUT /orders/1 twice = 1 order (same result each time) (idempotent)          │
│  - DELETE /orders/1 twice = order deleted first time, 404 second time          │
│                           = same final state (idempotent)                       │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## I.3 HTTP Status Codes - Complete Reference

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    HTTP STATUS CODES                                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  1xx INFORMATIONAL                                                               │
│  100 Continue        - Server received headers, send body                       │
│  101 Switching       - Upgrading to WebSocket                                   │
│                                                                                  │
│  2xx SUCCESS                                                                     │
│  200 OK              - Generic success                                          │
│  201 Created         - Resource created (return Location header!)               │
│  202 Accepted        - Request accepted, processing async                       │
│  204 No Content      - Success but no body (DELETE response)                    │
│                                                                                  │
│  3xx REDIRECTION                                                                 │
│  301 Moved Permanently  - URL changed forever (browser caches)                  │
│  302 Found (Temporary)  - Temporary redirect                                    │
│  304 Not Modified       - Use cached version (ETags)                            │
│                                                                                  │
│  4xx CLIENT ERROR                                                                │
│  400 Bad Request     - Malformed request (validation failed)                    │
│  401 Unauthorized    - Not authenticated (no/invalid token)                     │
│  403 Forbidden       - Authenticated but not authorized                         │
│  404 Not Found       - Resource doesn't exist                                   │
│  405 Method Not Allowed - Wrong HTTP method                                     │
│  409 Conflict        - State conflict (duplicate, version mismatch)             │
│  415 Unsupported Media Type - Wrong Content-Type                               │
│  422 Unprocessable Entity - Semantic errors in body                            │
│  429 Too Many Requests - Rate limited                                           │
│                                                                                  │
│  5xx SERVER ERROR                                                                │
│  500 Internal Server Error - Generic server error                               │
│  502 Bad Gateway     - Proxy got bad response from upstream                     │
│  503 Service Unavailable - Server overloaded or maintenance                     │
│  504 Gateway Timeout - Proxy timeout waiting for upstream                       │
│                                                                                  │
│  SPRING BOOT MAPPINGS:                                                           │
│  - Validation error (@Valid) → 400                                              │
│  - NoHandlerFound → 404                                                         │
│  - MethodNotSupported → 405                                                     │
│  - Unhandled exception → 500                                                    │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## I.4 Keep-Alive and Connection Management

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    HTTP/1.1 KEEP-ALIVE                                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  WITHOUT Keep-Alive (HTTP/1.0 default):                                         │
│                                                                                  │
│  Request 1: [TCP Connect] → [Request] → [Response] → [TCP Close]               │
│  Request 2: [TCP Connect] → [Request] → [Response] → [TCP Close]               │
│  Request 3: [TCP Connect] → [Request] → [Response] → [TCP Close]               │
│                                                                                  │
│  3 requests = 3 TCP handshakes = ~150ms overhead!                               │
│                                                                                  │
│  WITH Keep-Alive (HTTP/1.1 default):                                            │
│                                                                                  │
│  [TCP Connect] → [Request 1] → [Response 1]                                     │
│               → [Request 2] → [Response 2]                                     │
│               → [Request 3] → [Response 3] → [TCP Close]                       │
│                                                                                  │
│  3 requests = 1 TCP handshake = ~50ms overhead!                                 │
│                                                                                  │
│  Headers:                                                                        │
│  Connection: keep-alive                                                          │
│  Keep-Alive: timeout=5, max=100                                                  │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
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
┌─────────────────────────────────────────────────────────────────────────────────┐
│  SPRING IS A DESIGN PATTERNS SHOWCASE - KNOW THE PATTERNS!                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  When interviewer asks:                                                          │
│  "What design patterns does Spring use?"                                        │
│                                                                                  │
│  Don't say "I don't know" - SPRING USES THEM ALL!                              │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Theory Lens: Patterns in Spring Are Constraints Management Tools

Design patterns are not interview trivia; they are controlled ways to manage change and complexity. Spring combines them to separate object creation, extension points, and runtime behavior composition.

A useful reading strategy:

1. Identify what varies (algorithm, implementation, policy, lifecycle).
2. Identify what stays stable (public contracts, orchestration flow).
3. Map the variation to a pattern (strategy, factory, template, proxy, chain).

This turns framework internals into understandable design choices and helps you design modules that stay stable under new requirements.

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

# SECTION K: THREADS & EXECUTORS

## Why This Matters

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  EVERY HTTP REQUEST = ONE THREAD (by default)                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Understanding threading:                                                        │
│  - Why does Tomcat have 200 max threads?                                        │
│  - How does @Async work?                                                        │
│  - What happens with CompletableFuture?                                         │
│  - Why is ThreadLocal useful?                                                   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Theory Lens: Concurrency Is Throughput Budgeting Under Safety Constraints

Threading in server applications is a resource allocation problem. Each thread consumes memory, scheduling time, and shared resource capacity (DB connections, remote calls, CPU slices).

Reason with three budgets:

1. CPU budget: avoid oversubscription for CPU-bound work.
2. I/O wait budget: hide latency without exploding thread count.
3. Contention budget: minimize lock and shared-state pressure.

Executor design is therefore architectural. Pool size, queue policy, and rejection handling directly shape latency tails and failure behavior.

## K.1 Tomcat Thread Pool

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    TOMCAT REQUEST HANDLING                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  HTTP Request                                                                    │
│       │                                                                          │
│       ▼                                                                          │
│  ┌──────────────────────────────────────────────────────────────────────┐      │
│  │ Tomcat Thread Pool                                                    │      │
│  │                                                                        │      │
│  │  [Thread-1] [Thread-2] [Thread-3] ... [Thread-200]                   │      │
│  │      │                                                                 │      │
│  │      └──► Assigned to handle this request                            │      │
│  └──────────────────────────────────────────────────────────────────────┘      │
│       │                                                                          │
│       ▼                                                                          │
│  Your Controller executes on Thread-1                                           │
│       │                                                                          │
│       ▼                                                                          │
│  Response sent, Thread-1 returned to pool                                       │
│                                                                                  │
│                                                                                  │
│  DEFAULT: max 200 threads                                                        │
│  RULE: If request takes 100ms, can handle 2000 req/sec                          │
│        If request takes 1s, can only handle 200 req/sec!                        │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

```yaml
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
┌─────────────────────────────────────────────────────────────────────────────────┐
│  WHY CAN'T I DO: new T() or T.class or instanceof List<String>?               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Answer: TYPE ERASURE                                                            │
│                                                                                  │
│  Generics are a COMPILE-TIME feature only!                                      │
│  At runtime, generic type information is ERASED                                 │
│                                                                                  │
│  This affects:                                                                   │
│  - How Jackson deserializes generic types                                       │
│  - How Spring resolves generic beans                                            │
│  - Why you need TypeReference<T>                                               │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Theory Lens: Generics Improve Compile-Time Guarantees, Not Runtime Types

Type erasure preserves backward compatibility but removes most generic type details at runtime. This creates a split between compile-time safety and runtime introspection.

Frameworks bridge this split using explicit type tokens (TypeReference, ParameterizedType, ResolvableType). Without these helpers, many generic operations collapse to raw Object semantics.

Design implication:

1. Keep generic boundaries explicit in APIs.
2. Preserve type metadata where serialization or DI resolution depends on it.
3. Avoid hidden casts that postpone type failures to production paths.

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

# SECTION M: BYTECODE & INSTRUMENTATION

## Why This Matters

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  ADVANCED: How Tools Modify Your Code at Runtime                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  These tools use bytecode manipulation:                                          │
│  - Spring Data: Generates repository implementations                            │
│  - Hibernate: Adds lazy loading logic to entities                               │
│  - Mockito: Creates mock objects                                                │
│  - CGLIB: Proxies for @Transactional                                            │
│  - JaCoCo: Code coverage                                                         │
│  - Debuggers: Breakpoints                                                        │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Theory Lens: Bytecode Instrumentation Is Runtime Program Rewriting

Bytecode tools alter behavior without changing source files by rewriting class definitions before or during loading. This enables advanced capabilities but adds lifecycle complexity.

Think in phases:

1. Compile-time weaving/generation.
2. Class-load-time transformation.
3. Runtime proxy/instrumentation hooks.

When behavior seems "invisible" in source code (lazy loading, generated repositories, mocks, coverage probes), inspect transformation phase and class origin first. This mental model is essential for debugging advanced framework behavior.

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
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    WHAT YOU SHOULD REMEMBER                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  REFLECTION                                                                      │
│  • Spring uses reflection for EVERYTHING                                        │
│  • setAccessible(true) bypasses private                                         │
│  • Reflection is slow but cached                                                │
│                                                                                  │
│  ANNOTATIONS                                                                     │
│  • RUNTIME retention = Spring can read it                                       │
│  • SOURCE retention = Compile-time only (Lombok)                               │
│                                                                                  │
│  PROXIES                                                                         │
│  • @Transactional creates proxy, not modifies code                              │
│  • Self-invocation bypasses proxy!                                              │
│  • Private methods can't be proxied                                             │
│                                                                                  │
│  SERVLETS                                                                        │
│  • Spring MVC = Fancy servlet framework                                         │
│  • Filter → Interceptor → Controller → Interceptor → Filter                    │
│                                                                                  │
│  JACKSON                                                                         │
│  • @JsonProperty for naming                                                     │
│  • @JsonIgnore for hiding                                                        │
│  • @JsonFormat for dates                                                         │
│                                                                                  │
│  CONNECTIONS                                                                     │
│  • Connection creation is EXPENSIVE                                             │
│  • Pool reuses connections                                                       │
│  • Don't leak connections (use try-with-resources)                             │
│                                                                                  │
│  CLASSLOADING                                                                    │
│  • Parent delegation: ask parent first                                           │
│  • Different classloader = different class!                                     │
│                                                                                  │
│  BUILD TOOLS                                                                     │
│  • Lifecycle phases run in order                                                │
│  • Scopes control when dependency is available                                  │
│  • Transitive = dependencies of dependencies                                    │
│                                                                                  │
│  TYPE ERASURE                                                                    │
│  • Generics erased at runtime                                                   │
│  • Use TypeReference for Jackson                                                │
│  • Can't do: new T() or instanceof List<String>                                │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
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
