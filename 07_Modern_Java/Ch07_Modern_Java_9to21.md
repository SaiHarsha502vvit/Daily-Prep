**Navigation**: [Back to Index](../00_MASTER_INDEX.md)
🧠 **Mental Model**: See [Optimization Pipeline](../14_Mental_Models/14_Optimization_Pipeline.md) — new Java features as optimization tools

---

### Historical Evolution

**Inventor / Originator:** Oracle / OpenJDK (2017–2023) — Six-month release cadence introduced in Java 9 fundamentally changed how Java evolves.

**Predecessor context:** Java 8 (2014) was a landmark release but came after a 3-year gap. Java 9 took another 3.5 years. The Java community criticized Oracle for slow innovation compared to C# and Kotlin. The release cadence was opaque and unpredictable.

**Evolution narrative:** Java 9 (2017) introduced the module system (JJP 261), HTTP/2 client, and REPL (jshell). Java 10 (2018) added `var` local type inference. Java 11 (2018, LTS) removed Java EE and CORBA modules, made `java.net.http` standard. Java 14 (2020) brought records (preview), pattern matching instanceof (preview), and switch expressions (final in Java 14). Java 15 (2020) finalized sealed classes (preview). Java 16 (2021) finalized records and pattern matching. Java 17 (2021, LTS) finalized sealed classes, pattern matching, and added `java.nio.file.spi` FileSystemProvider. Java 21 (2023, LTS) is the biggest release since Java 8: virtual threads (JEP 444), pattern matching for switch (final), record patterns, and string templates (preview). The six-month cadence means features ship faster but in preview form.

**Modern practice:** Production standard is Java 21 LTS (2023) or Java 17 LTS (2021). Java 8 is still widely used but EOL approaches. Spring Boot 3.x (2023) requires Java 17 minimum. Use `java --version` to confirm. Build tools (Maven 3.8+, Gradle 7+) enforce Java version.

- **Java 9 — 2017**: JPMS modules, HTTP/2 client, jshell REPL, `ProcessHandle`.
- **Java 10 — 2018**: `var` local type inference.
- **Java 11 LTS — 2018**: HTTP client (java.net.http), removed Java EE modules.
- **Java 14 — 2020**: Records (final), pattern matching instanceof (preview), switch expressions (final).
- **Java 17 LTS — 2021**: Sealed classes final, pattern matching final, random number generators.
- **Java 21 LTS — 2023**: Virtual threads (JEP 444), pattern matching switch final, record patterns, unnamed patterns.

---

# 🆕 Modern Java Features (Java 9–21)

Every feature that changed how production Java is written

---

## ❓ Why This Matters

Interviewers ask: "What Java version do you use? What features?"

Senior devs MUST know: Records, Sealed classes, Pattern matching, Var,
Text blocks, Switch expressions, Virtual threads, Structured concurrency

If you write Java 8-style code in 2026, you look outdated.

---

# PART 1: var — Local Variable Type Inference (Java 10)

```java
// BEFORE: Explicit, verbose
Map<String, List<Employee>> departmentMap = new HashMap<String, List<Employee>>();
BufferedReader reader = new BufferedReader(new FileReader("data.txt"));

// AFTER: var infers the type
var departmentMap = new HashMap<String, List<Employee>>();
var reader = new BufferedReader(new FileReader("data.txt"));

// Works with:
var list = List.of(1, 2, 3);           // List<Integer>
var stream = list.stream();             // Stream<Integer>
var entry = Map.entry("key", 42);       // Map.Entry<String, Integer>

// DOES NOT work with:
// var x;                    // No initializer — can't infer
// var x = null;             // null has no type
// var x = () -> {};         // Lambda needs target type
// var x = {1, 2, 3};       // Array initializer needs type
// var as parameter type     // Not allowed in method signatures
// var as field type         // Only local variables
```

```text
WHEN TO USE var:
✅ Type is obvious from right side: var list = new ArrayList<String>()
✅ Long generic types: var map = service.getComplexMap()
✅ Try-with-resources: try (var br = new BufferedReader(...))

WHEN NOT TO USE:
❌ Type isn't clear: var result = process(data)  // What's result?
❌ Numeric literals: var count = 0  // int? long? byte?
❌ When it hurts readability
```

---

# PART 2: Records — Immutable Data Carriers (Java 16)

```java
// BEFORE: 60+ lines of boilerplate
public class Point {
    private final int x;
    private final int y;

    public Point(int x, int y) { this.x = x; this.y = y; }
    public int getX() { return x; }
    public int getY() { return y; }

    @Override public boolean equals(Object o) { /* ... 10 lines ... */ }
    @Override public int hashCode() { return Objects.hash(x, y); }
    @Override public String toString() { return "Point[x=" + x + ", y=" + y + "]"; }
}

// AFTER: 1 line. Same exact behavior.
public record Point(int x, int y) {}

// What you get automatically:
// ✅ private final fields (x, y)
// ✅ Constructor with all fields
// ✅ Accessor methods: point.x(), point.y()  (NOT getX()!)
// ✅ equals() based on all fields
// ✅ hashCode() based on all fields
// ✅ toString() → "Point[x=1, y=2]"
// ✅ Implements Serializable-compatible

// Custom validation in compact constructor:
public record Email(String address) {
    public Email {  // Compact constructor — no parens
        if (address == null || !address.contains("@")) {
            throw new IllegalArgumentException("Invalid email: " + address);
        }
        address = address.toLowerCase();  // Can transform before assignment
    }
}

// Records can have:
public record User(String name, int age) {
    // Static fields and methods
    static final User ANONYMOUS = new User("anon", 0);

    // Instance methods
    public String greeting() { return "Hello, " + name; }

    // Custom accessor (override generated one)
    public String name() { return name.toUpperCase(); }

    // Implements interfaces
    // implements Comparable<User>
}

// Records CANNOT:
// ❌ Extend other classes (implicitly extend Record)
// ❌ Have mutable fields (all fields are final)
// ❌ Be abstract
// ❌ Have additional instance fields
```

**WHEN TO USE RECORDS:**

```text
✅ DTOs (Data Transfer Objects)         record UserDTO(String name, String email)
✅ API responses                        record ApiResponse<T>(T data, int code)
✅ Value objects (DDD)                  record Money(BigDecimal amount, Currency)
✅ Configuration holders                record DbConfig(String url, int pool)
✅ Compound map keys                    record CacheKey(String type, long id)
✅ Method return types (multiple vals)  record ParseResult(int value, int pos)

DON'T USE WHEN:
❌ Entity needs mutability (JPA entities — but JPA 3.2 starts supporting them)
❌ Complex inheritance needed
❌ Need builder pattern (records have all-args constructor only)
```

---

# PART 3: Sealed Classes — Controlled Inheritance (Java 17)

```java
// Sealed class: ONLY these specific classes can extend me
public sealed class Shape permits Circle, Rectangle, Triangle {
    abstract double area();
}

// Each permitted subclass MUST be: final, sealed, or non-sealed
public final class Circle extends Shape {
    double radius;
    double area() { return Math.PI * radius * radius; }
}

public final class Rectangle extends Shape {
    double width, height;
    double area() { return width * height; }
}

public non-sealed class Triangle extends Shape {
    // non-sealed: anyone can extend Triangle further
    double base, height;
    double area() { return 0.5 * base * height; }
}

// Sealed interfaces
public sealed interface Payment permits CreditCard, BankTransfer, Crypto {
    double amount();
}
public record CreditCard(double amount, String number) implements Payment {}
public record BankTransfer(double amount, String iban) implements Payment {}
public record Crypto(double amount, String wallet) implements Payment {}
```

```text
WHY SEALED CLASSES?

1. EXHAUSTIVE PATTERN MATCHING — compiler knows ALL subtypes
   → No need for "default" case in switch (compiler checks all)
2. DOMAIN MODELING — exactly represents business rules
   "A payment can ONLY be CreditCard, BankTransfer, or Crypto"
3. LIB DESIGN — allow extension by known types only

sealed = "these classes and NO others can extend me"
final = "nobody can extend me"
non-sealed = "anyone can extend me" (escape hatch)
```

---

# PART 4: Pattern Matching — The Game Changer (Java 16-21)

## instanceof Pattern Matching (Java 16)

```java
// BEFORE: Cast after instanceof (verbose, error-prone)
if (obj instanceof String) {
    String s = (String) obj;  // Redundant cast
    System.out.println(s.length());
}

// AFTER: Pattern variable bound directly
if (obj instanceof String s) {  // s is available if true
    System.out.println(s.length());
}

// Works with && (s available in both conditions)
if (obj instanceof String s && s.length() > 5) {
    System.out.println(s.toUpperCase());
}

// Does NOT work with || (s might not be bound)
// if (obj instanceof String s || s.length() > 5) { }  // COMPILE ERROR
```

🔬 **Section Challenge — instanceof Pattern Matching (Java 16)**

**Challenge 1 (Diagnostic - What/Where/Why):** You write `if (!(obj instanceof String s)) { return; } System.out.println(s.length());` and the compiler accepts it. **What** is this feature called? **Where** is the variable `s` in scope, and **Why** does the compiler allow access to `s` after the `if` block?

<details><summary>Answer</summary>

**What it is:** Pattern Matching for `instanceof` (Java 16) combined with flow typing. **Where it is in scope:** The variable `s` is in scope anywhere the compiler can mathematically prove that the `instanceof` check must have evaluated to `true`. **Why it works:** Because the `if` block contains a `return` statement for the `false` condition (`!`), the code _after_ the `if` block can only be reached if `obj` was indeed a `String`. Flow typing recognizes this and keeps `s` in scope for the rest of the method.

</details>

## Switch Expressions (Java 14) + Pattern Matching (Java 21)

```java
// OLD switch — verbose, fall-through bugs
switch (day) {
    case MONDAY:
    case FRIDAY:
        System.out.println("Working");
        break;  // Forget break = silent bug!
    default:
        System.out.println("Other");
}

// NEW switch expression — concise, no fall-through, returns value
String result = switch (day) {
    case MONDAY, FRIDAY -> "Working hard";
    case SATURDAY, SUNDAY -> "Weekend!";
    default -> "Regular day";
};

// Switch with blocks (use yield to return value)
int numericDay = switch (day) {
    case MONDAY -> 1;
    case TUESDAY -> {
        log.info("It's Tuesday");
        yield 2;  // yield returns value from block
    }
    default -> 0;
};

// PATTERN MATCHING IN SWITCH (Java 21) — THE POWER FEATURE
String describe(Object obj) {
    return switch (obj) {
        case Integer i when i > 0 -> "Positive integer: " + i;
        case Integer i            -> "Non-positive integer: " + i;
        case String s when s.isEmpty() -> "Empty string";
        case String s             -> "String of length " + s.length();
        case int[] arr            -> "Int array of length " + arr.length;
        case null                 -> "null";
        default                   -> "Unknown: " + obj.getClass();
    };
}

// WITH SEALED CLASSES — NO DEFAULT NEEDED (compiler checks exhaustiveness)
double area(Shape shape) {
    return switch (shape) {
        case Circle c    -> Math.PI * c.radius() * c.radius();
        case Rectangle r -> r.width() * r.height();
        case Triangle t  -> 0.5 * t.base() * t.height();
        // No default! Compiler knows these are ALL possible shapes.
    };
}
```

🔬 **Section Challenge — Switch Expressions (Java 14) + Pattern Matching (Java 21)**

**Challenge 1 (Bug Hunt - Why/What/How):** You add a new subclass `Pentagon` to a `sealed interface Shape`. Suddenly, a switch expression over `Shape` in another class fails to compile. **Why** did this happen? **What** safety feature triggered this error, and **How** do you fix it without adding a `default` case?

<details><summary>Answer</summary>

**Why it happened:** The switch expression was previously exhaustive over all known shapes. By adding `Pentagon`, the switch no longer handles all possible cases. **What safety feature:** Exhaustiveness checking. Because `Shape` is a sealed type, the compiler knows exactly how many implementations exist. Switch expressions _must_ be exhaustive (handle all possible inputs). **How to fix:** You must add a `case Pentagon p -> ...` to the switch expression. Do NOT add a `default` case, as that defeats the compiler's ability to warn you when future shapes are added!

</details>

## Record Patterns — Destructuring (Java 21)

```java
// Destructure record components directly in patterns
record Point(int x, int y) {}
record Line(Point start, Point end) {}

// Destructuring in instanceof
if (obj instanceof Point(int x, int y)) {
    System.out.println("x=" + x + ", y=" + y);
}

// NESTED destructuring
if (obj instanceof Line(Point(int x1, int y1), Point(int x2, int y2))) {
    double length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

// In switch
String describe(Object obj) {
    return switch (obj) {
        case Point(int x, int y) when x == 0 && y == 0 -> "Origin";
        case Point(int x, int y) -> "Point(" + x + "," + y + ")";
        case Line(Point s, Point e) -> "Line from " + s + " to " + e;
        default -> "Unknown";
    };
}
```

---

🔬 **Section Challenge — Record Patterns — Destructuring (Java 21)**

**Challenge 1 (Diagnostic - Who/What/How):** You have a nested record structure: `record Box(Item item)` and `record Item(String name)`. You want to extract the name directly in an `if` statement. **Who** unwraps the nested objects? **What** syntax makes this possible in Java 21, and **How** do you write the condition?

<details><summary>Answer</summary>

**Who unwraps:** The JVM pattern matcher natively destructures the records. **What syntax:** Record Patterns (finalized in Java 21), which allow nested destructuring. **How to write it:** You write the pattern exactly like the constructor structure: `if (obj instanceof Box(Item(String name))) { System.out.println(name); }`. The compiler safely checks both `instanceof Box` and `instanceof Item`, and binds the inner `name` to a local variable in one step.

</details>

# PART 5: Text Blocks (Java 15) & String Enhancements

```java
// BEFORE: Escape hell
String json = "{\n" +
    "  \"name\": \"John\",\n" +
    "  \"age\": 30\n" +
    "}";

// AFTER: Text blocks — multi-line strings
String json = """
        {
          "name": "John",
          "age": 30
        }
        """;
// Incidental whitespace (before closing """) is stripped
// Trailing whitespace trimmed per line
// Final newline included (put """ on same line to exclude)

// Formatting with text blocks
String html = """
        <html>
          <body>
            <h1>%s</h1>
            <p>%s</p>
          </body>
        </html>
        """.formatted(title, content);

// New String methods (Java 9-17):
"  hello  ".strip();          // "hello" (Unicode-aware, better than trim())
"  hello  ".stripLeading();   // "hello  "
"  hello  ".stripTrailing();  // "  hello"
"hello".repeat(3);            // "hellohellohello"
"hello".isBlank();            // false
"".isBlank();                 // true
"   ".isBlank();              // true (only whitespace)
"hello\nworld".lines();       // Stream<String> of lines
"hello".indent(4);            // "    hello\n"
"HELLO".transform(s -> s.toLowerCase() + "!");  // "hello!"
```

---

# PART 6: Collection Factory Methods & Stream Enhancements

```java
// IMMUTABLE COLLECTION FACTORIES (Java 9)
var list = List.of(1, 2, 3);           // Immutable
var set = Set.of("a", "b", "c");       // Immutable, no duplicates
var map = Map.of("a", 1, "b", 2);     // Immutable, up to 10 entries
var map2 = Map.ofEntries(              // Immutable, any number of entries
    Map.entry("a", 1),
    Map.entry("b", 2)
);
// list.add(4);  // throws UnsupportedOperationException!

// Copy factory (Java 10)
var mutable = new ArrayList<>(List.of(1, 2, 3));
var immutableCopy = List.copyOf(mutable);  // Immutable copy

// STREAM ENHANCEMENTS
// takeWhile / dropWhile (Java 9)
List.of(1, 2, 3, 4, 5, 6).stream()
    .takeWhile(n -> n < 4)   // [1, 2, 3] — stops at first failure
    .toList();

List.of(1, 2, 3, 4, 5).stream()
    .dropWhile(n -> n < 3)   // [3, 4, 5] — skips until first success
    .toList();

// Stream.ofNullable (Java 9)
Stream.ofNullable(nullableValue)  // Empty stream if null, single-element if not
    .flatMap(...)

// Collectors.toUnmodifiableList/Set/Map (Java 10)
var result = stream.collect(Collectors.toUnmodifiableList());

// stream.toList() (Java 16) — shorthand
var result = stream.toList();  // Returns unmodifiable list

// mapMulti (Java 16) — replaces complex flatMap
stream.<String>mapMulti((item, consumer) -> {
    if (item.isValid()) {
        consumer.accept(item.getName());
        consumer.accept(item.getAlias());
    }
});
```

---

# PART 7: Other Essential Features

## Optional Enhancements (Java 9-11)

```java
Optional<String> opt = Optional.of("hello");

// ifPresentOrElse (Java 9)
opt.ifPresentOrElse(
    val -> System.out.println("Found: " + val),
    () -> System.out.println("Not found")
);

// or() — lazy fallback Optional (Java 9)
Optional<String> result = opt
    .or(() -> fetchFromCache())     // Try cache
    .or(() -> fetchFromDatabase()); // Then DB

// stream() — convert to Stream (Java 9)
List<String> names = optionalList.stream()
    .flatMap(Optional::stream)   // Filters out empty optionals
    .toList();
```

🔬 **Section Challenge — Optional Enhancements (Java 9-11)**

**Challenge 1 (Reasoning):** `Optional.get()` without `isPresent()` check — what's the point of Optional then?

<details><summary>Answer</summary>

`Optional.get()` is a code smell. The right API: `orElse(default)`, `orElseGet(supplier)`, `orElseThrow()`, `map(fn)`, `ifPresent(consumer)`. Optional's value: it makes the ABSENCE of a value explicit in the type signature — callers MUST handle the empty case. Using `get()` defeats this. Rule: never call `get()` unless you've already verified presence through the Optional API.

</details>

## HTTP Client (Java 11)

```java
// Modern HTTP client (replaces HttpURLConnection)
HttpClient client = HttpClient.newBuilder()
    .connectTimeout(Duration.ofSeconds(10))
    .followRedirects(HttpClient.Redirect.NORMAL)
    .build();

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.example.com/users"))
    .header("Content-Type", "application/json")
    .timeout(Duration.ofSeconds(30))
    .GET()
    .build();

// Synchronous
HttpResponse<String> response = client.send(request,
    HttpResponse.BodyHandlers.ofString());

// Asynchronous
CompletableFuture<HttpResponse<String>> future = client.sendAsync(request,
    HttpResponse.BodyHandlers.ofString());
```

🔬 **Section Challenge — HTTP Client (Java 11)**

**Challenge 1 (Debug — Who/When/What):** Java 9 module system — your library uses `module-info.java` with `exports com.lib.api`. A user tries `module.open("com.lib.internal")` via reflection. **Who** enforces access? **When?** **What** is the difference between `exports` and `opens`?

<details><summary>Answer</summary>

**Who enforces?** The JVM's module access control at runtime — `java.lang.module.Module.canRead()`. **When?** At the reflective access call (`field.setAccessible(true)`). The JVM throws `InaccessibleObjectException` if the package is neither `exports` nor `opens`. **`exports` vs `opens`:** `exports com.lib.api` = compile-time + runtime API access (other modules can compile against it and call public methods). `opens com.lib.internal` = runtime-ONLY deep reflection access (allows `field.setAccessible(true)`, Jackson/Hibernate deserialization). `exports` is strict; `opens` allows frameworks to introspect internals. `opens ... to specific.module` limits which modules can reflect.

</details>

## Helpful NullPointerExceptions (Java 14)

```java
// BEFORE: "NullPointerException" — WHERE?!
user.getAddress().getCity().toUpperCase();
// Exception: NullPointerException  (which one is null??)

// AFTER (Java 14): Helpful message
// Exception: Cannot invoke "Address.getCity()" because the return value of
//            "User.getAddress()" is null
// → Tells you EXACTLY which reference was null!
```

---

🔬 **Section Challenge — Helpful NullPointerExceptions (Java 14)**

**Challenge 1 (Trace - What/Why/Where):** You get a `NullPointerException` on `a.b.c()`. In Java 8, the stack trace only gives the line number. In Java 14+, the message says exactly that `b` is null. **What** is this feature called? **Why** couldn't Java 8 do this, and **Where** does the JVM gather this detailed information?

<details><summary>Answer</summary>

**What it is:** Helpful NullPointerExceptions (JEP 358). **Why Java 8 couldn't:** Previous JVMs only threw an NPE when the hardware generated a SIGSEGV (segmentation fault) at a specific memory address, mapped back to a bytecode index (BCI) and line number. The JVM didn't track _which_ variable at that line caused the fault. **Where it gathers it:** When a SIGSEGV occurs now, the JVM inspects the exact bytecode instruction at the BCI. If it's `getfield` or `invokevirtual`, it traces backward in the bytecode to determine exactly which local variable or field was pushed onto the operand stack right before the fault, enabling the precise error message.

</details>

# 📋 Part 8: Feature Summary Table

| Java Version | Key Features |
| --- | --- |
| Java 9 | Modules, JShell, Collection factories, Stream takeWhile/dropWhile, Optional.or/ifPresentOrElse, private interface methods, compact Strings internally |
| Java 10 | var (local variable type inference), List.copyOf, Collectors.toUnmodifiable*, G1 GC improvements |
| Java 11 LTS | HttpClient, String strip/isBlank/lines/repeat, Files.readString/writeString, Optional.isEmpty |
| Java 14 | Switch expressions (finalized), Helpful NPEs, Records (preview) |
| Java 15 | Text blocks (finalized), Sealed classes (preview), Hidden classes |
| Java 16 | Records (finalized), instanceof pattern matching, Stream.toList(), mapMulti |
| Java 17 LTS | Sealed classes (finalized), pattern matching for switch (preview), always-strict floating-point |
| Java 21 LTS | Virtual threads, Record patterns, Pattern matching switch (finalized), Sequenced collections, Structured concurrency (preview), String templates (preview) |

**INTERVIEW MUST-KNOWS:**

```text
Q: "What Java version do you use?"
A: "Java 21 LTS — virtual threads, records, sealed classes, pattern matching"

Q: "Records vs Lombok @Value?"
A: "Records are native, no annotation processor, work with pattern matching.
    Lombok needs compile-time dependency. Records can't have mutable fields."

Q: "When would you use sealed classes?"
A: "Domain modeling where exactly N types exist — payment types, AST nodes,
    state machines. Enables exhaustive switch without default."

Q: "var vs explicit types — your preference?"
A: "var when type is obvious from context. Explicit when it aids readability.
    Never in public API signatures."
```

---

> **Navigation**: [< Previous](Ch16_Concurrency_Advanced.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](Ch54_Message_Queues_Kafka.md)


---

## Reality Check

**"Java modules (JPMS) are the same as Maven/Gradle modules"** → Java modules (Java 9 Platform Module System, `module-info.java`) are language-level: they define which packages a JAR exports and which modules it requires, enforced by the JVM at compile and runtime. Maven/Gradle modules are build-system concepts: how a project is split into independently-built sub-projects. The two are independent — you can have a Maven multi-module project where none of the modules use JPMS (most real projects). JPMS adoption outside of the JDK itself has been slow due to complexity with reflection and the existing ecosystem.

**"Records are just immutable data classes"** → Java Records (Java 16+) are: implicitly final classes, all fields are `final` (set in constructor), automatic `equals()`, `hashCode()`, `toString()` based on all components, a canonical constructor. But: Records CAN have custom methods, custom constructors (compact constructor: just the validation body), implement interfaces, and be generic. Records CANNOT: extend another class (implicitly extends `java.lang.Record`), declare mutable instance fields. They're Kotlin's `data class` equivalent, but Java records are immutable by design.

**"Sealed classes are just classes where subclassing is restricted"** → Sealed classes (Java 17+) define an exhaustive hierarchy: `sealed interface Shape permits Circle, Rectangle, Triangle`. The compiler knows all permitted subtypes — enabling exhaustive pattern matching in `switch` without a default case. This is the key use case: `switch (shape) { case Circle c -> ...; case Rectangle r -> ...; case Triangle t -> ...; }` — the compiler warns if a case is missing. Sealed classes + pattern matching switch = algebraic data types in Java, matching Kotlin sealed classes or Haskell ADTs.

**"Text blocks (Java 15+) are just multi-line strings"** → Text blocks handle indentation: the incidental indentation (leading whitespace common to all lines) is stripped. `String json = """ { "key": "value" } """` strips the leading spaces, giving you `{ "key": "value" }` without the indentation. This is not what `"{\n  \"key\": \"value\"\n}"` does (no stripping). Text blocks also disable the need to escape double quotes within the block (unless you need `"""`). The trailing `"""` position determines how much indentation is stripped.

**"Virtual threads (Java 21) replace thread pools"** → Virtual threads (Project Loom, Java 21) are JVM-managed lightweight threads: you can create millions of them, and blocking I/O does NOT block the underlying OS thread (the JVM parks the virtual thread and reuses the carrier thread). This means blocking code (JDBC, REST calls, file I/O) scales to millions of concurrent operations without the callback-hell of reactive programming. Thread pools for I/O-bound work: replace with virtual threads. Thread pools for CPU-bound work: keep using platform threads with pools sized to CPU cores. Virtual threads don't speed up CPU work.
