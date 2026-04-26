# 51. Java Generics & Exception Handling — Advanced Deep Dive

**Navigation**: [< DateTime & Regex](Ch05_DateTime_Regex.md) | [Back to Index](../00_MASTER_INDEX.md) | [ClassLoader, JDBC & Logging >](Ch12_ClassLoader_JDBC_Logging.md)

---

## PART 1: GENERICS — Beyond the Basics

---

## 🎯 The 5W1H

```
╔══════════════════════════════════════════════════════════════════╗
║  WHAT = Generics let you write type-safe code that works with    ║
║         ANY type, while the compiler catches type errors         ║
║                                                                  ║
║  WHY  = Without generics: List stores Object, requires casting,  ║
║         ClassCastException at runtime. With: compile-time safety ║
║                                                                  ║
║  WHEN = Collections, utility methods, service layers, builders,  ║
║         API response wrappers, repository patterns               ║
║                                                                  ║
║  HOW  = Type parameters <T>, bounded types, wildcards, PECS      ║
╚══════════════════════════════════════════════════════════════════╝
```

---

## 1. Type Erasure — The #1 Thing to Understand

```
╔═══════════════════════════════════════════════════════════════╗
║ Java generics exist ONLY at compile time.                     ║
║ At runtime, ALL generic type information is ERASED.           ║
║ This is called TYPE ERASURE.                                  ║
╚═══════════════════════════════════════════════════════════════╝
```

```java
// What YOU write:
List<String> strings = new ArrayList<>();
List<Integer> numbers = new ArrayList<>();

// What the JVM sees at RUNTIME:
List strings = new ArrayList();   // Just List, no String
List numbers = new ArrayList();   // Just List, no Integer

// That's why this is TRUE:
strings.getClass() == numbers.getClass();  // true! Both are just ArrayList

// And this DOESN'T work:
if (obj instanceof List<String>) { }  // ❌ COMPILE ERROR!
// Because at runtime, there's no way to check if it's List<String> vs List<Integer>
```

### What Type Erasure Means in Practice

```java
// ❌ Can't create generic arrays
T[] array = new T[10];    // COMPILE ERROR — T is erased

// ❌ Can't use instanceof with generics
if (list instanceof List<String>) { }  // COMPILE ERROR

// ❌ Can't overload by generic type alone
void process(List<String> strings) { }
void process(List<Integer> numbers) { }  // COMPILE ERROR!
// Both erase to process(List) — same erasure

// ✅ Workarounds
@SuppressWarnings("unchecked")
T[] array = (T[]) new Object[10];  // Works but unchecked

// Pass Class<T> for runtime type info
public <T> T create(Class<T> type) throws Exception {
    return type.getDeclaredConstructor().newInstance();
}
```

---



🔬 **Section Challenge — 1. Type Erasure — The #1 Thing to Understand**

**Challenge 1 (Reasoning):** You write `List<String> list = new ArrayList<>();`. At runtime, can you check `list instanceof List<String>`?
<details><summary>Answer</summary>

No — `instanceof List<String>` is a compile error. After erasure, it's just `List` at runtime. Use `instanceof List<?>` for an unparameterized check. This is why you can't do `new T()`, `new T[]`, or `T.class` — T doesn't exist at runtime.
</details>

**Challenge 2 (Bug Hunt):** A method returns `(T) jsonDeserialize(json)` where T is a generic type param. When does the `ClassCastException` actually occur?
<details><summary>Answer</summary>

NOT at the cast — the unchecked cast compiles to nothing at runtime (erasure). The CCE occurs when the calling code tries to USE the returned value as a specific type. This makes debugging hard: the error appears far from the actual source. Use `Class<T> clazz` parameter to do safe `clazz.cast(...)` instead.
</details>


## 2. Bounded Type Parameters — Restricting T

```java
// Upper bound: T must be Number or its subclass
public static <T extends Number> double sum(List<T> list) {
    return list.stream().mapToDouble(Number::doubleValue).sum();
}

sum(List.of(1, 2, 3));         // ✅ Integer extends Number
sum(List.of(1.5, 2.5));        // ✅ Double extends Number
sum(List.of("a", "b"));        // ❌ String doesn't extend Number

// Multiple bounds: T must implement BOTH Comparable AND Serializable
public static <T extends Comparable<T> & Serializable> T findMax(List<T> list) {
    return list.stream().max(Comparable::compareTo).orElseThrow();
}

// Note: can have at most ONE class bound and multiple interface bounds
// Class bound must come FIRST
<T extends SomeClass & Interface1 & Interface2>
```

---



🔬 **Section Challenge — 2. Bounded Type Parameters — Restricting T**

**Challenge 1 (Reasoning):** `<T extends Comparable<T>>` vs `<T extends Comparable>` — what's the difference and why does the first form matter?
<details><summary>Answer</summary>

The raw form `<T extends Comparable>` loses type safety — compares apples to oranges at runtime. `<T extends Comparable<T>>` specifies that T can compare WITH ITSELF: `Integer.compareTo(Integer)`, not `Integer.compareTo(Object)`. This is why `Collections.sort()` uses `<T extends Comparable<? super T>>` — T can be compared using its own or a supertype's compareTo.
</details>


## 3. Wildcards — The `?` Symbol

```java
// There are 3 types of wildcards:

// 1. Unbounded: ? — "any type"
void printAll(List<?> list) {
    for (Object item : list) {
        System.out.println(item);
    }
}

// 2. Upper bounded: ? extends T — "T or its subtypes"
double sum(List<? extends Number> list) {
    // Can READ as Number
    // Can NOT add (except null) — because we don't know WHICH subtype
    double total = 0;
    for (Number n : list) {
        total += n.doubleValue();
    }
    return total;
}

// 3. Lower bounded: ? super T — "T or its supertypes"
void addNumbers(List<? super Integer> list) {
    // Can ADD Integer (or subtype)
    // Can NOT read as Integer (might be Object)
    list.add(1);
    list.add(2);
    list.add(3);
}
```

---



🔬 **Section Challenge — 3. Wildcards — The `?` Symbol**

**Challenge 1 (Reasoning):** `void process(List<? extends Number> list)` — can you call `list.add(3.14)`? Why or why not?
<details><summary>Answer</summary>

No. The compiler doesn't know the actual type — it could be `List<Integer>`, `List<Float>`, or `List<Double>`. Adding a `Double` to a `List<Integer>` would violate type safety. `? extends T` is read-only: you can `get()` as `Number`, but `add()` is forbidden (except null).
</details>

**Challenge 2 (Design):** Write a method that copies elements from any `List<? extends T>` into any `List<? super T>`. Why is this the correct signature?
<details><summary>Answer</summary>

```java
<T> void copy(List<? extends T> src, List<? super T> dst) {
    for (T item : src) dst.add(item);
}
```
PECS: `src` is a Producer (we read from it) → `extends`. `dst` is a Consumer (we write to it) → `super`. This is exactly how `Collections.copy()` is implemented in the JDK.
</details>


## 4. Invariance, Covariance & Contravariance — The Big Picture

```
╔══════════════════════════════════════════════════════════════════╗
║ These 3 words describe HOW subtyping (Dog extends Animal)        ║
║ transfers to GENERIC types (List<Dog> vs List<Animal>).          ║
║                                                                  ║
║ The question: If Dog IS-A Animal, is List<Dog> a List<Animal>?   ║
║ Answer: NO! That's INVARIANCE — Java's default for generics.     ║
╚══════════════════════════════════════════════════════════════════╝
```

### 4a. INVARIANCE — Java's Default (Generics)

```java
// Dog extends Animal
class Animal { }
class Dog extends Animal { }
class Cat extends Animal { }

// ARRAYS are COVARIANT (see 4b) — this compiles:
Animal[] animals = new Dog[3];  // ✅ Compiles!

// GENERICS are INVARIANT — this does NOT compile:
List<Animal> animals = new ArrayList<Dog>();  // ❌ COMPILE ERROR!

// WHY? Because it would be UNSAFE:
List<Dog> dogs = new ArrayList<>();
List<Animal> animals = dogs;    // ❌ Imagine this worked...
animals.add(new Cat());         // Cat IS-A Animal, so this would compile
Dog d = dogs.get(0);            // 💥 But dogs list now has a Cat! ClassCastException!

// Java prevents this entire disaster by making generics INVARIANT
// List<Dog> is NOT a subtype of List<Animal>. Period.
```

```
INVARIANT means: NO subtyping relationship transfers

   Animal
     ↑ IS-A
    Dog

   List<Animal>    List<Dog>
        ↕ ???
   NO RELATIONSHIP!  ← This is INVARIANCE

   List<Dog> is NOT a subtype of List<Animal>
   List<Animal> is NOT a subtype of List<Dog>
```

### 4b. COVARIANCE — `? extends T` (and Arrays)

```
COVARIANT means: subtyping goes in the SAME direction

   Animal                List<? extends Animal>
     ↑ IS-A                      ↑ IS-A
    Dog                    List<Dog>

   "Dog extends Animal" → "List<Dog> fits List<? extends Animal>"
   Direction is PRESERVED → CO-variant (co = same)
```

```java
// Wildcards ENABLE covariance
List<Dog> dogs = List.of(new Dog(), new Dog());
List<? extends Animal> animals = dogs;  // ✅ COVARIANT — compiles!

// SAFE: Read as Animal
Animal a = animals.get(0);  // ✅ Every Dog IS-A Animal

// UNSAFE: Can't write
animals.add(new Dog());  // ❌ Compile error!
animals.add(new Cat());  // ❌ Compile error!
// Compiler doesn't know if it's List<Dog> or List<Cat>
// So it blocks ALL adds (except null) — READ-ONLY
```

#### The Array Covariance Trap

```java
// Java arrays ARE covariant (bad design decision from Java 1.0)
Animal[] animals = new Dog[3];  // ✅ Compiles — arrays are covariant!!!
animals[0] = new Dog();         // ✅ Fine
animals[1] = new Cat();         // ✅ Compiles... but...
// 💥 ArrayStoreException at RUNTIME!
// The array is actually Dog[], and Cat can't go in Dog[]

// This is WHY generics were made INVARIANT by default —
// to catch this at COMPILE TIME, not runtime
// Generics learned from the array mistake
```

### 4c. CONTRAVARIANCE — `? super T`

```
CONTRAVARIANT means: subtyping goes in the OPPOSITE direction

   Animal                List<? super Dog>
     ↑ IS-A                    ↑ IS-A
    Dog                  List<? super Animal>

   Wait — List<? super Animal> IS-A List<? super Dog>?
   Yes! If you accept Animal's supers, you accept Dog's supers too

   Dog → Animal (upward)
   List<? super Animal> → List<? super Dog> (downward)
   Direction is REVERSED → CONTRA-variant (contra = opposite)
```

```java
// Contravariance in action
List<Animal> animals = new ArrayList<>();
List<? super Dog> list = animals;  // ✅ Animal is a supertype of Dog

// SAFE: Write Dog (or subtypes)
list.add(new Dog());  // ✅ Dog fits in any List<? super Dog>

// UNSAFE: Read as Dog
Dog d = list.get(0);     // ❌ Compile error — might be Object
Object o = list.get(0);  // ✅ Can only read as Object
```

### 4d. Summary Table — The Complete Picture

```
┌──────────────────┬────────────────────┬────────────────┬──────────────┐
│ Variance         │ Syntax             │ Read?          │ Write?       │
├──────────────────┼────────────────────┼────────────────┼──────────────┤
│ INVARIANT        │ List<Animal>       │ ✅ as Animal   │ ✅ Animal    │
│ (exact type)     │                    │                │              │
├──────────────────┼────────────────────┼────────────────┼──────────────┤
│ COVARIANT        │ List<? extends     │ ✅ as Animal   │ ❌ nothing   │
│ (same direction) │      Animal>       │ (PRODUCER)     │ (read-only)  │
├──────────────────┼────────────────────┼────────────────┼──────────────┤
│ CONTRAVARIANT    │ List<? super Dog>  │ ❌ only Object │ ✅ Dog       │
│ (opposite dir.)  │                    │ (write-only)   │ (CONSUMER)   │
└──────────────────┴────────────────────┴────────────────┴──────────────┘

RULE OF THUMB:
  Invariant   → full access, no flexibility
  Covariant   → flexible input, read-only (PRODUCER)
  Contravariant → flexible output, write-only (CONSUMER)
  
  This is EXACTLY what PECS says! ↓
```

### 4e. Real-World: Why This Matters

```java
// Without understanding variance, this is CONFUSING:
public void processAnimals(List<Animal> animals) { }

List<Dog> dogs = List.of(new Dog());
processAnimals(dogs);  // ❌ WHY DOESN'T THIS WORK?!
// Because generics are INVARIANT — List<Dog> is NOT List<Animal>

// Fix with covariance (if you only READ):
public void processAnimals(List<? extends Animal> animals) { }
processAnimals(dogs);  // ✅ Now works — covariant

// Fix with contravariance (if you only WRITE):
public void addDogs(List<? super Dog> list) { }
List<Animal> animals = new ArrayList<>();
addDogs(animals);  // ✅ Now works — contravariant

// Comparator uses contravariance beautifully:
// Comparator<Animal> can compare Dogs too (Animal is super of Dog)
Comparator<Animal> byName = Comparator.comparing(Animal::getName);
List<Dog> dogs = new ArrayList<>();
dogs.sort(byName);  // ✅ sort() accepts Comparator<? super Dog>
// A Comparator for Animals can certainly compare Dogs!
```

---



🔬 **Section Challenge — 4. Invariance, Covariance & Contravariance — The Big Picture**

**Challenge 1 (Reasoning):** What is Type Erasure in Java Generics, and why does `List<String>` become a raw `List` at runtime?
<details><summary>Answer</summary>

Backward Compatibility. Generics were introduced in Java 5. To ensure that new code compiled with Generics could still run on older JVMs (Java 1.4), the compiler strips away all Generic type information (`<String>`) during compilation. At runtime, the JVM only sees a raw `List` of `Object`s. The compiler simply inserts hidden casting instructions (`(String) list.get(0)`) where necessary. This is why you cannot do `if (obj instanceof List<String>)` at runtime.
</details>


## 5. PECS — Producer Extends, Consumer Super

```
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║  PECS = Producer Extends, Consumer Super                     ║
║                                                              ║
║  If you READ from a collection  → use ? extends T (Producer) ║
║  If you WRITE to a collection   → use ? super T  (Consumer)  ║
║  If you do BOTH                 → use exact type T           ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

### Visual Explanation

```
? extends Number (PRODUCER — you READ from it):
┌────────────────────────────────────────────┐
│ List<? extends Number> can be:             │
│   List<Integer>                            │
│   List<Double>                             │
│   List<Number>                             │
│                                            │
│ SAFE to read as Number: ✅                 │
│   Number n = list.get(0);  // Always works │
│                                            │
│ UNSAFE to add: ❌                          │
│   list.add(42);  // Compile error!         │
│   // What if it's actually List<Double>?   │
│   // Adding Integer would corrupt it!      │
└────────────────────────────────────────────┘

? super Integer (CONSUMER — you WRITE to it):
┌────────────────────────────────────────────┐
│ List<? super Integer> can be:              │
│   List<Integer>                            │
│   List<Number>                             │
│   List<Object>                             │
│                                            │
│ SAFE to add Integer: ✅                    │
│   list.add(42);  // Always works           │
│   // Integer fits in all of these lists    │
│                                            │
│ UNSAFE to read as Integer: ❌              │
│   Integer i = list.get(0);  // Error!      │
│   // What if it's List<Object>?            │
│   // get() returns Object, not Integer     │
└────────────────────────────────────────────┘
```

### PECS in Action — Collections.copy()

```java
// Java's actual signature:
public static <T> void copy(List<? super T> dest,    // CONSUMER (writes to dest)
                              List<? extends T> src)   // PRODUCER (reads from src)
{
    for (int i = 0; i < src.size(); i++) {
        dest.set(i, src.get(i));
    }
}

// This allows:
List<Number> numbers = new ArrayList<>(List.of(0, 0, 0));
List<Integer> integers = List.of(1, 2, 3);
Collections.copy(numbers, integers);  // ✅ Copy Integer list into Number list
```

---



🔬 **Section Challenge — 5. PECS — Producer Extends, Consumer Super**

**Challenge 1 (Reasoning):** Stack's `pushAll(Iterable<? extends E> src)` vs `popAll(Collection<? super E> dst)` — trace why each wildcard direction is needed.
<details><summary>Answer</summary>

`pushAll`: we READ from `src` to push into the stack → it Produces E → `extends E`. `popAll`: we WRITE popped values INTO `dst` → `dst` Consumes E → `super E`. Applying PECS mechanically: Producer=Extends, Consumer=Super. If you used `<E>` for both, you'd lose flexibility — `pushAll(List<Integer>)` would fail for a `Stack<Number>`.
</details>


## 6. Generic Methods — Type Inference

```java
// Generic method — type parameter on the METHOD, not the class
public static <T> List<T> listOf(T... elements) {
    return Arrays.asList(elements);
}

// Java infers T from the arguments
List<String> names = listOf("a", "b", "c");     // T = String
List<Integer> nums = listOf(1, 2, 3);            // T = Integer

// Multiple type parameters
public static <K, V> Map<K, V> mapOf(K key, V value) {
    return Map.of(key, value);
}

// Bounded generic method
public static <T extends Comparable<T>> T max(T a, T b) {
    return a.compareTo(b) >= 0 ? a : b;
}

max("apple", "banana");  // "banana" — String implements Comparable
max(10, 20);              // 20 — Integer implements Comparable
```

---



🔬 **Section Challenge — 6. Generic Methods — Type Inference**

**Challenge 1 (Reasoning):** You write `List<String> list = new ArrayList<>();`. At runtime, can you check `list instanceof List<String>`?
<details><summary>Answer</summary>

No — `instanceof List<String>` is a compile error. After erasure, it's just `List` at runtime. Use `instanceof List<?>` for an unparameterized check. This is why you can't do `new T()`, `new T[]`, or `T.class` — T doesn't exist at runtime.
</details>

**Challenge 2 (Bug Hunt):** A method returns `(T) jsonDeserialize(json)` where T is a generic type param. When does the `ClassCastException` actually occur?
<details><summary>Answer</summary>

NOT at the cast — the unchecked cast compiles to nothing at runtime (erasure). The CCE occurs when the calling code tries to USE the returned value as a specific type. This makes debugging hard: the error appears far from the actual source. Use `Class<T> clazz` parameter to do safe `clazz.cast(...)` instead.
</details>


## 7. Generic Class Patterns — Real-World

```java
// Pattern 1: Generic wrapper (Result type)
public class Result<T> {
    private final T value;
    private final String error;
    private final boolean success;
    
    private Result(T value, String error, boolean success) {
        this.value = value;
        this.error = error;
        this.success = success;
    }
    
    public static <T> Result<T> ok(T value) {
        return new Result<>(value, null, true);
    }
    
    public static <T> Result<T> fail(String error) {
        return new Result<>(null, error, false);
    }
    
    public <R> Result<R> map(Function<T, R> mapper) {
        if (success) {
            return Result.ok(mapper.apply(value));
        }
        return Result.fail(error);
    }
    
    // Getters...
}

Result<User> result = userService.findById(1L);
Result<String> name = result.map(User::getName);
```

```java
// Pattern 2: Generic Repository
public interface Repository<T, ID> {
    T findById(ID id);
    List<T> findAll();
    T save(T entity);
    void deleteById(ID id);
}

public class UserRepository implements Repository<User, Long> {
    @Override
    public User findById(Long id) { ... }
    @Override
    public List<User> findAll() { ... }
    // ...
}
```

```java
// Pattern 3: Generic Builder
public class Builder<T> {
    private final Supplier<T> constructor;
    private final List<Consumer<T>> modifiers = new ArrayList<>();
    
    public Builder(Supplier<T> constructor) {
        this.constructor = constructor;
    }
    
    public Builder<T> with(Consumer<T> modifier) {
        modifiers.add(modifier);
        return this;
    }
    
    public T build() {
        T instance = constructor.get();
        modifiers.forEach(m -> m.accept(instance));
        return instance;
    }
}

User user = new Builder<>(User::new)
    .with(u -> u.setName("Harsha"))
    .with(u -> u.setAge(25))
    .build();
```

---



## 8. Type Inference Evolution

```java
// Java 5: Full type specification
Map<String, List<Integer>> map = new HashMap<String, List<Integer>>();

// Java 7: Diamond operator <>
Map<String, List<Integer>> map = new HashMap<>();

// Java 10: var (local variable type inference)
var map = new HashMap<String, List<Integer>>();

// Java 11: var in lambdas (for annotations)
list.stream()
    .map((@NotNull var s) -> s.toUpperCase())
    .toList();
```

---



🔬 **Section Challenge — 8. Type Inference Evolution**

**Challenge 1 (Reasoning):** You write `List<String> list = new ArrayList<>();`. At runtime, can you check `list instanceof List<String>`?
<details><summary>Answer</summary>

No — `instanceof List<String>` is a compile error. After erasure, it's just `List` at runtime. Use `instanceof List<?>` for an unparameterized check. This is why you can't do `new T()`, `new T[]`, or `T.class` — T doesn't exist at runtime.
</details>

**Challenge 2 (Bug Hunt):** A method returns `(T) jsonDeserialize(json)` where T is a generic type param. When does the `ClassCastException` actually occur?
<details><summary>Answer</summary>

NOT at the cast — the unchecked cast compiles to nothing at runtime (erasure). The CCE occurs when the calling code tries to USE the returned value as a specific type. This makes debugging hard: the error appears far from the actual source. Use `Class<T> clazz` parameter to do safe `clazz.cast(...)` instead.
</details>


## PART 2: EXCEPTION HANDLING — Beyond try-catch

---



🔬 **Section Challenge — PART 2: EXCEPTION HANDLING — Beyond try-catch**

**Challenge 1 (Reasoning):** What is Type Erasure in Java Generics, and why does `List<String>` become a raw `List` at runtime?
<details><summary>Answer</summary>

Backward Compatibility. Generics were introduced in Java 5. To ensure that new code compiled with Generics could still run on older JVMs (Java 1.4), the compiler strips away all Generic type information (`<String>`) during compilation. At runtime, the JVM only sees a raw `List` of `Object`s. The compiler simply inserts hidden casting instructions (`(String) list.get(0)`) where necessary. This is why you cannot do `if (obj instanceof List<String>)` at runtime.
</details>


## 9. Exception Hierarchy — The Family Tree

```
                    Throwable
                   /          \
               Error          Exception
              /    \         /          \
     OutOfMemory  StackOverflow   RuntimeException    IOException
     VirtualMachine               /      |      \     FileNotFound
     Error                  NullPointer  ClassCast  IllegalArgument
                            IndexOutOf    Arithmetic  IllegalState
                            
┌─────────────────────────────────────────────────────────────────┐
│ Error: JVM problems — DON'T catch (can't recover)               │
│   OutOfMemoryError, StackOverflowError                          │
│                                                                 │
│ Checked Exception (Exception but NOT RuntimeException):         │
│   MUST catch or declare in 'throws'                             │
│   IOException, SQLException, ClassNotFoundException             │
│                                                                 │
│ Unchecked Exception (RuntimeException):                         │
│   DON'T have to catch (but can)                                 │
│   NullPointerException, IllegalArgumentException                │
│                                                                 │
│ RULE: Checked = recoverable situations                          │
│       Unchecked = programming bugs                              │
└─────────────────────────────────────────────────────────────────┘
```

---



🔬 **Section Challenge — 9. Exception Hierarchy — The Family Tree**

**Challenge 1 (Reasoning):** Why does `Error` extend `Throwable` separately from `Exception`? When should you catch `Error`?
<details><summary>Answer</summary>

`Error` represents JVM-level failures: `OutOfMemoryError`, `StackOverflowError`, `VirtualMachineError`. These indicate unrecoverable states. You should almost NEVER catch `Error` — the JVM state is undefined. Only exception: top-level handlers that log the error before terminating gracefully (`catch(Throwable t)` in shutdown hooks). Never catch `Error` in normal application code.
</details>

**Challenge 2 (Bug Hunt):** `catch(Exception e) { log(e.getMessage()); }` — name 3 things wrong with this.
<details><summary>Answer</summary>

1) `e.getMessage()` returns null for some exceptions (NPE, CCE) → NullPointerException in the logger! Use `log(e)` instead to print full stack. 2) Swallowing `Exception` catches runtime bugs (NPE, illegal arg) that should crash/bubble — silent failure is worse than loud failure. 3) No re-throw or meaningful handling — caller has no idea the operation failed.
</details>


## 10. Custom Exception Design — The Right Way

```java
// ❌ BAD: Generic exceptions that tell nothing
throw new Exception("Something went wrong");
throw new RuntimeException("Error");

// ✅ GOOD: Domain-specific exception hierarchy
public class ApplicationException extends RuntimeException {
    private final String errorCode;
    private final HttpStatus httpStatus;
    
    public ApplicationException(String message, String errorCode, HttpStatus httpStatus) {
        super(message);
        this.errorCode = errorCode;
        this.httpStatus = httpStatus;
    }
    
    public String getErrorCode() { return errorCode; }
    public HttpStatus getHttpStatus() { return httpStatus; }
}

// Specific exceptions
public class ResourceNotFoundException extends ApplicationException {
    public ResourceNotFoundException(String resource, Object id) {
        super(resource + " not found with id: " + id, "NOT_FOUND", HttpStatus.NOT_FOUND);
    }
}

public class BusinessRuleViolationException extends ApplicationException {
    public BusinessRuleViolationException(String rule) {
        super("Business rule violated: " + rule, "BUSINESS_ERROR", HttpStatus.UNPROCESSABLE_ENTITY);
    }
}

public class DuplicateResourceException extends ApplicationException {
    public DuplicateResourceException(String resource, String field, Object value) {
        super(resource + " already exists with " + field + ": " + value,
              "DUPLICATE", HttpStatus.CONFLICT);
    }
}

// Usage
public User findById(Long id) {
    return repository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("User", id));
}
```

---



🔬 **Section Challenge — 10. Custom Exception Design — The Right Way**

**Challenge 1 (Design):** Design a custom exception hierarchy for a payment system. What should the base class extend and what fields must it have?
<details><summary>Answer</summary>

```java
public class PaymentException extends RuntimeException { // unchecked!
    private final String errorCode;
    private final String transactionId;
    public PaymentException(String code, String txId, String msg, Throwable cause) {
        super(msg, cause); this.errorCode=code; this.transactionId=txId;
    }
}
public class InsufficientFundsException extends PaymentException { ... }
public class PaymentGatewayException extends PaymentException { ... }
```
Always chain the original cause. Include domain-relevant context (errorCode, transactionId) for logging/debugging.
</details>


## 11. Exception Translation — Layer Boundaries

```java
// Repository layer → throw data exceptions
// Service layer → TRANSLATE to business exceptions
// Controller layer → translate to API responses

// Repository
public User findByEmail(String email) throws SQLException {
    // might throw SQLException
}

// Service — CATCHES data exception, THROWS business exception
public User getUserByEmail(String email) {
    try {
        User user = repository.findByEmail(email);
        if (user == null) {
            throw new ResourceNotFoundException("User", email);
        }
        return user;
    } catch (SQLException e) {
        // TRANSLATE: Database error → Application error
        throw new ApplicationException(
            "Failed to fetch user", "DB_ERROR", HttpStatus.INTERNAL_SERVER_ERROR
        );
    }
}

// Controller — Global exception handler
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(ex.getHttpStatus())
            .body(new ErrorResponse(ex.getErrorCode(), ex.getMessage()));
    }
    
    @ExceptionHandler(ApplicationException.class)
    public ResponseEntity<ErrorResponse> handleAppException(ApplicationException ex) {
        return ResponseEntity.status(ex.getHttpStatus())
            .body(new ErrorResponse(ex.getErrorCode(), ex.getMessage()));
    }
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleUnexpected(Exception ex) {
        log.error("Unexpected error", ex);
        return ResponseEntity.status(500)
            .body(new ErrorResponse("INTERNAL_ERROR", "An unexpected error occurred"));
    }
}

record ErrorResponse(String code, String message) {}
```

---



🔬 **Section Challenge — 11. Exception Translation — Layer Boundaries**

**Challenge 1 (Reasoning):** Why does `Error` extend `Throwable` separately from `Exception`? When should you catch `Error`?
<details><summary>Answer</summary>

`Error` represents JVM-level failures: `OutOfMemoryError`, `StackOverflowError`, `VirtualMachineError`. These indicate unrecoverable states. You should almost NEVER catch `Error` — the JVM state is undefined. Only exception: top-level handlers that log the error before terminating gracefully (`catch(Throwable t)` in shutdown hooks). Never catch `Error` in normal application code.
</details>

**Challenge 2 (Bug Hunt):** `catch(Exception e) { log(e.getMessage()); }` — name 3 things wrong with this.
<details><summary>Answer</summary>

1) `e.getMessage()` returns null for some exceptions (NPE, CCE) → NullPointerException in the logger! Use `log(e)` instead to print full stack. 2) Swallowing `Exception` catches runtime bugs (NPE, illegal arg) that should crash/bubble — silent failure is worse than loud failure. 3) No re-throw or meaningful handling — caller has no idea the operation failed.
</details>


## 12. try-with-resources — Deep Understanding

```java
// AutoCloseable interface — the contract
public interface AutoCloseable {
    void close() throws Exception;
}

// Anything implementing AutoCloseable works with try-with-resources
try (
    FileReader reader = new FileReader("file.txt");
    BufferedReader br = new BufferedReader(reader)
) {
    String line = br.readLine();
} // br.close() called FIRST, then reader.close() — REVERSE order!

// Custom AutoCloseable
public class DatabaseTransaction implements AutoCloseable {
    private final Connection conn;
    
    public DatabaseTransaction(Connection conn) throws SQLException {
        this.conn = conn;
        conn.setAutoCommit(false);
        System.out.println("Transaction started");
    }
    
    public void commit() throws SQLException {
        conn.commit();
        System.out.println("Committed");
    }
    
    @Override
    public void close() throws SQLException {
        if (!conn.getAutoCommit()) {
            conn.rollback();  // Auto-rollback if not committed
            System.out.println("Rolled back");
        }
    }
}

// Usage — automatic rollback on exception!
try (var tx = new DatabaseTransaction(connection)) {
    // do work...
    tx.commit();
}  // If exception before commit → close() → rollback automatically
```

### Suppressed Exceptions

```java
// What if BOTH the body AND close() throw exceptions?
try (var resource = new MyResource()) {
    throw new Exception("Body exception");
} // close() also throws: new Exception("Close exception")

// Java handles this:
// Main exception: "Body exception"
// Suppressed: "Close exception"

// Access suppressed:
try {
    // ...
} catch (Exception e) {
    System.out.println("Main: " + e.getMessage());
    for (Throwable suppressed : e.getSuppressed()) {
        System.out.println("Suppressed: " + suppressed.getMessage());
    }
}
```

---



🔬 **Section Challenge — 12. try-with-resources — Deep Understanding**

**Challenge 1 (Reasoning):** Both the `try` block and `close()` throw exceptions. Which one propagates? Where does the other go?
<details><summary>Answer</summary>

The `try` block's exception propagates (it's the 'primary' exception). The `close()` exception is SUPPRESSED — attached via `addSuppressed()`. Retrieve it with `e.getSuppressed()`. This is the opposite of old `try/finally` where the `finally` exception would REPLACE the original (swallowing it silently). Always use try-with-resources for `Closeable` resources — never try/finally.
</details>

**Challenge 2 (Bug Hunt):** ```java
InputStream in = new FileInputStream(f);
try { process(in); } catch(IOException e) { } finally { in.close(); }
```
What's wrong?
<details><summary>Answer</summary>

Two bugs: 1) `in` is declared OUTSIDE try — if `new FileInputStream(f)` throws, `in` is null but we attempt `in.close()` in finally → NPE. 2) `in.close()` can also throw `IOException` — not handled in finally → swallowed silently. Fix: use try-with-resources: `try(InputStream in = new FileInputStream(f)) { process(in); }`
</details>


## 13. Exception Handling Patterns

### Pattern 1: Fail-Fast

```java
// Validate early, fail early — don't let bad data travel
public void processOrder(Order order) {
    // Fail-fast: validate at entry point
    Objects.requireNonNull(order, "Order cannot be null");
    if (order.getItems().isEmpty()) {
        throw new IllegalArgumentException("Order must have at least one item");
    }
    if (order.getTotal().compareTo(BigDecimal.ZERO) <= 0) {
        throw new IllegalArgumentException("Order total must be positive");
    }
    
    // Now safe to process — no defensive null checks needed below
    processPayment(order);
    updateInventory(order);
    sendConfirmation(order);
}
```

### Pattern 2: Exception Chaining

```java
// ALWAYS preserve the original cause
try {
    // low-level operation
} catch (SQLException e) {
    // ✅ Chain the original exception as the cause
    throw new DataAccessException("Failed to save user", e);
    
    // ❌ NEVER lose the original
    // throw new DataAccessException("Failed to save user");
}
```

### Pattern 3: Retry on Transient Failures

```java
public <T> T retry(Supplier<T> operation, int maxAttempts, Duration delay) {
    Exception lastException = null;
    for (int attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return operation.get();
        } catch (TransientException e) {
            lastException = e;
            if (attempt < maxAttempts) {
                try {
                    Thread.sleep(delay.toMillis() * attempt); // Exponential backoff
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new RuntimeException("Interrupted during retry", ie);
                }
            }
        }
    }
    throw new RuntimeException("All " + maxAttempts + " attempts failed", lastException);
}

// Usage
User user = retry(() -> userService.fetchFromExternalApi(id), 3, Duration.ofSeconds(1));
```

---



🔬 **Section Challenge — 13. Exception Handling Patterns**

**Challenge 1 (Reasoning):** What is Type Erasure in Java Generics, and why does `List<String>` become a raw `List` at runtime?
<details><summary>Answer</summary>

Backward Compatibility. Generics were introduced in Java 5. To ensure that new code compiled with Generics could still run on older JVMs (Java 1.4), the compiler strips away all Generic type information (`<String>`) during compilation. At runtime, the JVM only sees a raw `List` of `Object`s. The compiler simply inserts hidden casting instructions (`(String) list.get(0)`) where necessary. This is why you cannot do `if (obj instanceof List<String>)` at runtime.
</details>


## 14. Checked vs Unchecked — When to Use Which

```
┌──────────────────────────────────────────────────────────────┐
│ USE CHECKED EXCEPTION WHEN:                                  │
│ • Caller CAN and SHOULD handle the error                     │
│ • Error is a NORMAL alternative outcome                      │
│ • Examples: FileNotFoundException, InsufficientFundsException│
│                                                              │
│ USE UNCHECKED EXCEPTION WHEN:                                │
│ • Error is a PROGRAMMING BUG (nothing caller can do)         │
│ • Caller can't reasonably recover                            │
│ • Examples: NullPointerException, IllegalArgumentException   │
│                                                              │
│ MODERN PRACTICE:                                             │
│ Most modern Java (Spring, etc.) prefers UNCHECKED            │
│ → Checked exceptions clutter API signatures                  │
│ → Callers usually just wrap in RuntimeException anyway       │
│ → Spring converts all checked to unchecked automatically     │
└──────────────────────────────────────────────────────────────┘
```

---

## 15. Multi-catch, Rethrow, and Java 9 TWR

```java
// Multi-catch (Java 7)
try {
    // ...
} catch (IOException | SQLException e) {
    // Handle both the same way
    log.error("I/O or DB error", e);
}

// Precise rethrow (Java 7)
public void process() throws IOException, SQLException {
    try {
        // code that might throw either
    } catch (Exception e) {
        log.error("Error", e);
        throw e;  // Compiler knows it's IOException OR SQLException, not Exception
    }
}

// Effectively-final in try-with-resources (Java 9)
FileReader reader = new FileReader("file.txt");  // Already created
BufferedReader br = new BufferedReader(reader);
try (reader; br) {  // Can use existing variables if effectively final
    // ...
}
```

---

## 16. The Complete Exception Strategy

```
Architecture:
┌─────────────────────────────────────────────────────────────┐
│ Controller Layer │ @ControllerAdvice catches & formats       │
│──────────────────│───────────────────────────────────────────│
│ Service Layer    │ Business exceptions (ResourceNotFound,    │
│                  │ BusinessRuleViolation, DuplicateResource) │
│──────────────────│───────────────────────────────────────────│
│ Repository Layer │ Data exceptions (translated by Spring)    │
│──────────────────│───────────────────────────────────────────│
│ External Calls   │ Retry for transient, wrap for permanent   │
└─────────────────────────────────────────────────────────────┘

Rules:
1. Validate at system boundaries (controller inputs)
2. Fail-fast in business logic
3. Translate exceptions at layer boundaries
4. ALWAYS chain cause exceptions
5. Log at the HANDLING point, not at throw point
6. Use specific exception types, not generic Exception
7. Clean up resources with try-with-resources
```

---



🔬 **Section Challenge — 16. The Complete Exception Strategy**

**Challenge 1 (Reasoning):** Why does `Error` extend `Throwable` separately from `Exception`? When should you catch `Error`?
<details><summary>Answer</summary>

`Error` represents JVM-level failures: `OutOfMemoryError`, `StackOverflowError`, `VirtualMachineError`. These indicate unrecoverable states. You should almost NEVER catch `Error` — the JVM state is undefined. Only exception: top-level handlers that log the error before terminating gracefully (`catch(Throwable t)` in shutdown hooks). Never catch `Error` in normal application code.
</details>

**Challenge 2 (Bug Hunt):** `catch(Exception e) { log(e.getMessage()); }` — name 3 things wrong with this.
<details><summary>Answer</summary>

1) `e.getMessage()` returns null for some exceptions (NPE, CCE) → NullPointerException in the logger! Use `log(e)` instead to print full stack. 2) Swallowing `Exception` catches runtime bugs (NPE, illegal arg) that should crash/bubble — silent failure is worse than loud failure. 3) No re-throw or meaningful handling — caller has no idea the operation failed.
</details>


## 17. Interview Questions & Answers

**Q: What is type erasure? Why does Java have it?**
Generics are a compile-time feature. At runtime, `List<String>` becomes just `List`. Java does this for backward compatibility with pre-Java-5 code. Consequence: can't use `instanceof` with generics or create generic arrays.

**Q: What are invariance, covariance, and contravariance?**
Invariance (default): `List<Dog>` is NOT `List<Animal>` — no subtyping transfers. Covariance (`? extends T`): subtyping preserved — `List<Dog>` fits `List<? extends Animal>`, read-only. Contravariance (`? super T`): subtyping reversed — `List<Animal>` fits `List<? super Dog>`, write-only.

**Q: Why are Java arrays covariant but generics invariant?**
Arrays were designed in Java 1.0 before generics existed. `Dog[] → Animal[]` compiles but throws `ArrayStoreException` at runtime if you add a Cat. Generics (Java 5) learned from this — they're invariant by default to catch type errors at compile time. Wildcards (`? extends`, `? super`) opt-in to covariance/contravariance safely.

**Q: Explain PECS with an example.**
Producer Extends, Consumer Super. If you READ from a collection, use `? extends T` (it produces values). If you WRITE to a collection, use `? super T` (it consumes values). Example: `Collections.copy(List<? super T> dest, List<? extends T> src)`.

**Q: Difference between `<T extends Number>` and `<? extends Number>`?**
`T extends Number` declares a type parameter you can reference later (e.g., return T). `? extends Number` is a wildcard for an unknown type — you can't reference it. Use T when you need the type, ? when you don't.

**Q: When should you use checked vs unchecked exceptions?**
Checked: when the caller can meaningfully recover (e.g., file not found → try another path). Unchecked: programming errors or unrecoverable situations. Modern practice favors unchecked.

**Q: What happens to suppressed exceptions in try-with-resources?**
If both the try body and `close()` throw, the body's exception is primary and close()'s exception is added as suppressed. Access via `exception.getSuppressed()`.

---

---

## 18. Exceptions in Multithreaded Code — The Hidden Traps

This bridges `Ch04` (Exceptions) + `Ch15` (Threads). Extremely common source of production bugs.

```java
// ═══════════════════════════════════════
// TRAP 1: Exception in Thread = Silent Death
// ═══════════════════════════════════════

// ❌ Exception escapes thread — silently kills it
new Thread(() -> {
    processOrders();  // Throws RuntimeException
    // Thread is DEAD. No log. No alert. Orders stop processing.
}).start();

// ✅ UncaughtExceptionHandler — see Ch15 for full details
Thread t = new Thread(() -> processOrders());
t.setUncaughtExceptionHandler((thread, ex) ->
    log.error("Order processor thread '{}' died", thread.getName(), ex));
t.start();

// ═══════════════════════════════════════
// TRAP 2: submit() vs execute() exception visibility
// ═══════════════════════════════════════

// ❌ submit() — exception SILENTLY swallowed
pool.submit(() -> { throw new RuntimeException("Silent!"); });
// No UncaughtExceptionHandler called. No log.

// ✅ execute() — exception goes to UncaughtExceptionHandler
pool.execute(() -> { throw new RuntimeException("Visible!"); });

// ✅ submit() + future.get() — forces exception visibility
Future<?> f = pool.submit(() -> { throw new RuntimeException("caught!"); });
try {
    f.get();
} catch (ExecutionException e) {
    log.error("Task failed: {}", e.getCause().getMessage(), e.getCause());
}

// ═══════════════════════════════════════
// TRAP 3: InterruptedException — NEVER swallow it!
// ═══════════════════════════════════════

// ❌ WORST CODE IN JAVA — the empty catch
try {
    Thread.sleep(1000);
} catch (InterruptedException e) {
    // DO NOTHING  ← This erases the interrupt signal FOREVER
    // The thread can NEVER be stopped now
}

// ✅ Pattern 1: Re-interrupt immediately (for tasks that can't stop now)
try {
    Thread.sleep(1000);
} catch (InterruptedException e) {
    Thread.currentThread().interrupt();  // Restore the flag!
    // Task will check isInterrupted() and stop next iteration
}

// ✅ Pattern 2: Propagate upward (for tasks that SHOULD stop)
public void doWork() throws InterruptedException {
    while (!Thread.currentThread().isInterrupted()) {
        Thread.sleep(100);  // Let exception propagate — caller handles stop
        processItem();
    }
}
```

---



🔬 **Section Challenge — 18. Exceptions in Multithreaded Code — The Hidden Traps**

**Challenge 1 (Reasoning):** What is Type Erasure in Java Generics, and why does `List<String>` become a raw `List` at runtime?
<details><summary>Answer</summary>

Backward Compatibility. Generics were introduced in Java 5. To ensure that new code compiled with Generics could still run on older JVMs (Java 1.4), the compiler strips away all Generic type information (`<String>`) during compilation. At runtime, the JVM only sees a raw `List` of `Object`s. The compiler simply inserts hidden casting instructions (`(String) list.get(0)`) where necessary. This is why you cannot do `if (obj instanceof List<String>)` at runtime.
</details>


## 19. Exceptions in CompletableFuture — Async Exception Handling

```java
// In async code, exceptions are DEFERRED — they surface on .get() or .join()

// ═══════════════════════════════════════
// TRAP: Exception swallowed in pipeline
// ═══════════════════════════════════════

CompletableFuture<User> future = CompletableFuture.supplyAsync(() -> fetchUser(id))
    .thenApply(user -> enrichUser(user));   // enrichUser throws!

// If nobody calls .get() — exception is lost FOREVER
// If pool gets GC'd before get() — exception is lost FOREVER

// ✅ Pattern 1: exceptionally() — fallback value on ANY exception
CompletableFuture<User> safe = CompletableFuture
    .supplyAsync(() -> fetchUser(id))
    .thenApply(user -> enrichUser(user))
    .exceptionally(ex -> {
        log.error("Failed to fetch user", ex);
        return User.anonymous();  // Fallback
    });

// ✅ Pattern 2: handle() — handle both success and failure
CompletableFuture<Response> handled = CompletableFuture
    .supplyAsync(() -> fetchUser(id))
    .handle((user, ex) -> {
        if (ex != null) {
            log.error("Error fetching user", ex);
            return Response.error(500, ex.getMessage());
        }
        return Response.ok(user);
    });

// ✅ Pattern 3: whenComplete() — side effect (logging) without changing result
CompletableFuture<User> logged = CompletableFuture
    .supplyAsync(() -> fetchUser(id))
    .whenComplete((user, ex) -> {
        if (ex != null) {
            log.error("Async task failed", ex);
            metrics.increment("user_fetch.failure");
        } else {
            metrics.increment("user_fetch.success");
        }
    });

// ✅ Pattern 4: Global async exception handler (Spring)
@Bean
public AsyncUncaughtExceptionHandler asyncUncaughtExceptionHandler() {
    return (ex, method, params) -> {
        log.error("Async method '{}' threw exception", method.getName(), ex);
    };
}
```

---



🔬 **Section Challenge — 19. Exceptions in CompletableFuture — Async Exception Handling**

**Challenge 1 (Reasoning):** What is Type Erasure in Java Generics, and why does `List<String>` become a raw `List` at runtime?
<details><summary>Answer</summary>

Backward Compatibility. Generics were introduced in Java 5. To ensure that new code compiled with Generics could still run on older JVMs (Java 1.4), the compiler strips away all Generic type information (`<String>`) during compilation. At runtime, the JVM only sees a raw `List` of `Object`s. The compiler simply inserts hidden casting instructions (`(String) list.get(0)`) where necessary. This is why you cannot do `if (obj instanceof List<String>)` at runtime.
</details>


## 20. Spring Boot Global Exception Handling — Complete Strategy

```java
// ═══════════════════════════════════════════════════════════════
// THE COMPLETE SPRING BOOT EXCEPTION ARCHITECTURE
// ═══════════════════════════════════════════════════════════════

// LAYER 1: Domain exceptions (no Spring dependency — pure Java)
public class DomainException extends RuntimeException {
    private final String code;

    public DomainException(String message, String code) {
        super(message);
        this.code = code;
    }
    public String getCode() { return code; }
}

public class NotFoundException extends DomainException {
    public NotFoundException(String resource, Object id) {
        super(resource + " not found: " + id, "NOT_FOUND");
    }
}

public class ConflictException extends DomainException {
    public ConflictException(String message) {
        super(message, "CONFLICT");
    }
}

public class ValidationException extends DomainException {
    private final Map<String, String> fieldErrors;

    public ValidationException(Map<String, String> errors) {
        super("Validation failed", "VALIDATION_ERROR");
        this.fieldErrors = Collections.unmodifiableMap(errors);
    }
    public Map<String, String> getFieldErrors() { return fieldErrors; }
}

// LAYER 2: Error response DTO
public record ErrorResponse(
    String code,
    String message,
    Map<String, String> fieldErrors,  // for validation errors
    Instant timestamp,
    String traceId
) {
    // Factory for simple errors
    public static ErrorResponse of(String code, String message) {
        return new ErrorResponse(code, message, null,
                                 Instant.now(), MDC.get("traceId"));
    }
}

// LAYER 3: Global exception handler
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    // 404 — Resource not found
    @ExceptionHandler(NotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorResponse handleNotFound(NotFoundException ex) {
        return ErrorResponse.of(ex.getCode(), ex.getMessage());
    }

    // 409 — Conflict
    @ExceptionHandler(ConflictException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ErrorResponse handleConflict(ConflictException ex) {
        return ErrorResponse.of(ex.getCode(), ex.getMessage());
    }

    // 422 — Validation
    @ExceptionHandler(ValidationException.class)
    @ResponseStatus(HttpStatus.UNPROCESSABLE_ENTITY)
    public ErrorResponse handleValidation(ValidationException ex) {
        return new ErrorResponse(ex.getCode(), ex.getMessage(),
                                 ex.getFieldErrors(), Instant.now(),
                                 MDC.get("traceId"));
    }

    // 400 — Spring's own validation (@Valid on controller params)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleBindingErrors(MethodArgumentNotValidException ex) {
        Map<String, String> errors = ex.getBindingResult()
            .getFieldErrors()
            .stream()
            .collect(Collectors.toMap(
                FieldError::getField,
                e -> e.getDefaultMessage() != null ? e.getDefaultMessage() : "invalid"
            ));
        return new ErrorResponse("VALIDATION_ERROR", "Request validation failed",
                                 errors, Instant.now(), MDC.get("traceId"));
    }

    // 500 — Catch-all (MUST log here — this is the last line of defense)
    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ErrorResponse handleUnexpected(Exception ex, HttpServletRequest req) {
        log.error("Unhandled exception on {} {}", req.getMethod(), req.getRequestURI(), ex);
        // Alert: send to PagerDuty, Slack, etc.
        return ErrorResponse.of("INTERNAL_ERROR",
            "An unexpected error occurred. Reference: " + MDC.get("traceId"));
    }
}
```

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  EXCEPTION HANDLING — 10 ANTI-PATTERNS TO NEVER DO                              │
│                                                                                 │
│  1. catch (Exception e) {} ← Silent swallow — BUG GRAVEYARD                    │
│  2. catch (Exception e) { e.printStackTrace(); } ← Logs go nowhere in prod     │
│  3. throw new RuntimeException(e.getMessage()) ← LOSES stack trace! Use (e)    │
│  4. throws Exception ← Forces caller to handle EVERYTHING or declare same      │
│  5. Catching Error ← OutOfMemoryError, StackOverflow can't be recovered        │
│  6. Catching InterruptedException {} ← Breaks thread cancellation forever      │
│  7. Exception in finally ← SWALLOWS the original exception!                    │
│  8. Logging AND rethrowing ← double logging — log at handler only!             │
│  9. Generic messages: "Error occurred" ← Useless in production                 │
│  10. Creating expensive exceptions where performance matters ← stacktrace=slow │
│                                                                                 │
│  GOLDEN RULES:                                                                  │
│  • LOG at the place that HANDLES it, not where it's thrown                      │
│  • ALWAYS chain cause: throw new MyEx("msg", originalException)                │
│  • ALWAYS interrupt: Thread.currentThread().interrupt() after InterruptedException│
│  • Use SPECIFIC exception types — they document intent                          │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

**Key Takeaway**: Generics provide compile-time type safety, but understand
type erasure's limits. PECS guides wildcard choice. For exceptions, design a
hierarchy that maps to HTTP status codes, translate at layer boundaries,
always chain the original cause, **and handle UncaughtExceptionHandler in every thread/pool**.


---



🔬 **Section Challenge — 20. Spring Boot Global Exception Handling — Complete Strategy**

**Challenge 1 (Reasoning):** What is Type Erasure in Java Generics, and why does `List<String>` become a raw `List` at runtime?
<details><summary>Answer</summary>

Backward Compatibility. Generics were introduced in Java 5. To ensure that new code compiled with Generics could still run on older JVMs (Java 1.4), the compiler strips away all Generic type information (`<String>`) during compilation. At runtime, the JVM only sees a raw `List` of `Object`s. The compiler simply inserts hidden casting instructions (`(String) list.get(0)`) where necessary. This is why you cannot do `if (obj instanceof List<String>)` at runtime.
</details>


