

### Historical Evolution

**Inventor / Originator:** Kent Beck / Erich Gamma (1997) — JUnit 1.0, the first mainstream unit testing framework.

**Predecessor context:** Before JUnit, testing was manual: run the program, check outputs by hand, hope nothing broke. C programs used `assert()` macros. SUnit (1998) at Xerox PARC pioneered the xUnit pattern for Smalltalk before Java adopted it.

**Evolution narrative:** JUnit 1.0 (1997, Beck/Gamma) brought the xUnit pattern to Java: `@Before`, `@Test` annotations, `assertEquals()`. Test execution was automated. JUnit 4 (2006) replaced the `TestCase` inheritance model with annotations — `@Test` replaced `testX(){}` naming convention. JUnit 5 (2017) introduced a modular architecture: JUnit Platform (test engine API), JUnit Jupiter (programming model), JUnit Vintage (JUnit 3/4 compatibility). Java 5 (2004) introduced `java.util.concurrent` and the JMM (JSR 133), which formalized the happens-before guarantee — understanding this is critical for concurrency problem JAVA-PS1's A3 question. The stream API (Java 8, 2014) was designed by Brian Goetz (lambda spec lead) and built on top of `java.util.function`. Spring's `@Transactional` test support emerged in Spring 2.0 (2006) and improved in Spring 4.2 (2014).

**Modern practice:** JUnit 5 (2023) is the standard. `@Nested` classes for hierarchical test structure, `@ParameterizedTest` (repeats values as test parameters), `@TempDir` (temporary directory), and `@DisplayName` for readable output. Spring Boot's `@SpringBootTest` with `@MockBean` is standard. TestContainers (2016) spins up real databases in Docker for integration tests. AssertJ (2014) provides fluent assertion chains.

- **JUnit 1.0 — 1997**: Kent Beck, Erich Gamma. xUnit pattern for Java. Automated unit testing.
- **SUnit — Xerox PARC 1998**: xUnit pattern invented. Smalltalk predecessor to JUnit.
- **Java 5 JMM (JSR 133) — 2004**: Doug Lea, Bill Pugh. Happens-before guarantee. Memory model formalized.
- **JUnit 4 — 2006**: Annotations replace `TestCase` inheritance. `@Test`, `@BeforeClass`. Industry standard.
- **Java 8 Streams (JSR 335) — 2014**: Brian Goetz (spec lead). Functional pipeline. Base for reactive programming.
- **JUnit 5 (Jupiter) — 2017**: Marc Philipp. Modular architecture. `@Nested`, `@ParameterizedTest`, `@DisplayName`.
# 📝 Java & Spring Boot — Problem Sets

## `07_Modern_Java` Module | MIT / ETH Zurich Style

> **How to use:** Attempt before reading answers. Part B code goes in `JavaSolutions/ps/java/`. Run JUnit stubs. Read 🔴 **Erklärung** when stuck.

---

## Problem Set JAVA-PS1 — Java Core & JVM

**Prerequisites:** `07_Modern_Java/Ch01b_Java_Type_System.md`, `07_Modern_Java/Ch18_JMM_GC_Deep.md`, `07_Modern_Java/Ch19_JVM_Object_Model.md`

---

### Part A: Theoretical

**A1 (Easy).** What is the output of each block? Explain why.

```java
// Block 1
Integer a = 127;
Integer b = 127;
System.out.println(a == b);       // ?

// Block 2
Integer c = 128;
Integer d = 128;
System.out.println(c == d);       // ?

// Block 3
System.out.println(c.equals(d));  // ?
```

<details><summary>Answer</summary>

**Block 1:** `true` — JVM caches `Integer` objects for values -128 to 127 (Integer Cache). `a` and `b` are the same cached object.

**Block 2:** `false` — 128 is outside the cache range. Each autoboxing creates a **new** `Integer` object. `==` compares references, not values.

**Block 3:** `true` — `equals()` compares the int value, not the reference.

🔴 **Erklärung:** NEVER use `==` to compare boxed types (`Integer`, `Long`, `Double`). Always use `.equals()` or `.compareTo()`. The Integer Cache is an implementation detail that silently makes `==` work for small values — this masks bugs that explode in production when values exceed 127.

</details>

---

**A2 (Medium).** A developer writes:

```java
List<Integer> list = new ArrayList<>();
list.add(1);
list.add(2);
list.add(3);
list.remove(1);
System.out.println(list); // What does this print?
```

What element was removed and why? How would you remove the Integer `1` (the value) instead?

<details><summary>Answer</summary>

**Output:** `[1, 3]` — `list.remove(1)` calls `remove(int index)`, removing the element at **index 1**, which is the value `2`.

**To remove the value `1`:**

```java
list.remove(Integer.valueOf(1));  // calls remove(Object) — removes first occurrence of value 1
```

🔴 **Erklärung:** `List` has two `remove` overloads: `remove(int index)` and `remove(Object o)`. When you pass a raw `int`, Java resolves to `remove(int index)` — not the `Integer` value. This is one of the most classic Java gotchas. Always box the value when you mean "remove by value."

</details>

---

**A3 (Hard).** Explain the Java Memory Model's happens-before relationship. Two threads share `boolean done = false`. Thread T1 sets `done = true`. Thread T2 reads `done`. Without synchronization, can T2 miss the update? Trace exactly why and fix it with `volatile`.

<details><summary>Answer</summary>

**Without volatile:**

- Modern CPUs keep per-core caches. T1 writes `done = true` to its L1 cache but may NOT flush to main memory immediately.
- T2 reads from its own cached copy of `done` — which is still `false`.
- The Java Memory Model does NOT guarantee visibility without synchronization. T2 can loop forever.

**The bug:**

```java
// T1                     // T2
done = true;              while (!done) {} // MAY NEVER EXIT
```

**Fix with volatile:**

```java
volatile boolean done = false;
```

`volatile` guarantees:

1. **Visibility:** Write to `done` in T1 is immediately flushed to main memory.
2. **Happens-before:** All writes BEFORE `done = true` in T1 are visible to T2 AFTER it reads `done = true`.

🔴 **Erklärung:** Students think "it's just one boolean, surely the CPU sees it." Modern CPUs with out-of-order execution and multi-level caches make this assumption invalid. The JMM requires explicit synchronization primitives (`volatile`, `synchronized`, `AtomicXxx`) to establish happens-before.

</details>

---

### Part B: Implementation

**B1.** Implement a generic `Pair<A, B>` with correct `equals`, `hashCode`, and `compareTo` when both types are `Comparable`:

```java
// Skeleton — JavaSolutions/ps/java/Pair.java
import java.util.Objects;

public record Pair<A, B>(A first, B second) {

    public Pair {
        Objects.requireNonNull(first, "first must not be null");
        Objects.requireNonNull(second, "second must not be null");
    }

    public static <A, B> Pair<A, B> of(A a, B b) {
        return new Pair<>(a, b);
    }

    // Records auto-generate equals, hashCode, toString based on fields — verify this is correct!

    /**
     * Compares by first element, then by second element if first is equal.
     * Both A and B must be Comparable.
     * @throws ClassCastException if A or B don't implement Comparable
     */
    @SuppressWarnings("unchecked")
    public int compareTo(Pair<A, B> other) {
        int cmp = ((Comparable<A>) this.first).compareTo(other.first);
        if (cmp != 0) return cmp;
        return ((Comparable<B>) this.second).compareTo(other.second);
    }
}
```

**JUnit Test Stub:**

```java
class PairTest {
    @Test void equals_samePair() {
        assertEquals(Pair.of("a", 1), Pair.of("a", 1));
    }
    @Test void equals_differentPair() {
        assertNotEquals(Pair.of("a", 1), Pair.of("b", 1));
    }
    @Test void hashCode_sameForEqualPairs() {
        assertEquals(Pair.of("x", 42).hashCode(), Pair.of("x", 42).hashCode());
    }
    @Test void compareTo_firstDiffers() {
        var p1 = Pair.of("a", 1);
        var p2 = Pair.of("b", 1);
        assertTrue(p1.compareTo(p2) < 0);
    }
    @Test void compareTo_firstEqualSecondDiffers() {
        var p1 = Pair.of("a", 1);
        var p2 = Pair.of("a", 2);
        assertTrue(p1.compareTo(p2) < 0);
    }
    @Test void nullFirst_throws() {
        assertThrows(NullPointerException.class, () -> Pair.of(null, 1));
    }
}
```

---

## Problem Set JAVA-PS2 — Streams & Functional Programming

**Prerequisites:** `07_Modern_Java/Ch06_Functional_Programming.md`

---

### Part A: Theoretical

**A1 (Medium).** Rewrite this imperative code as a clean Stream pipeline:

```java
List<String> result = new ArrayList<>();
for (Employee emp : employees) {
    if (emp.getSalary() > 50000) {
        result.add(emp.getName().toUpperCase());
    }
}
result.sort(Comparator.naturalOrder());
```

<details><summary>Answer</summary>

```java
List<String> result = employees.stream()
    .filter(emp -> emp.getSalary() > 50000)
    .map(emp -> emp.getName().toUpperCase())
    .sorted()
    .collect(Collectors.toList());
```

Or with Java 16+:

```java
var result = employees.stream()
    .filter(emp -> emp.getSalary() > 50000)
    .map(e -> e.getName().toUpperCase())
    .sorted()
    .toList(); // immutable
```

🔴 **Erklärung:** `.sorted()` without a comparator uses natural order (Comparable). Do not add `.sorted(Comparator.naturalOrder())` — it is redundant. Always use `.toList()` in Java 16+ for immutable results instead of `.collect(Collectors.toList())`.

</details>

---

**A2 (Hard).** What is the difference between `map()` and `flatMap()`? Show a case where using `map()` gives `Stream<Stream<T>>`.

<details><summary>Answer</summary>

**map():** Transforms each element 1:1. Returns a `Stream<R>`.
**flatMap():** Transforms each element 1:N, then flattens all streams into one. Returns `Stream<R>`.

**The stream-of-streams problem:**

```java
List<List<String>> nested = List.of(
    List.of("a", "b"),
    List.of("c", "d")
);

// WRONG — gives Stream<Stream<String>>
Stream<Stream<String>> wrong = nested.stream().map(Collection::stream);

// CORRECT — gives Stream<String> → ["a", "b", "c", "d"]
Stream<String> flat = nested.stream().flatMap(Collection::stream);
```

**Real use case:** `Optional.flatMap()` — if you have `Optional<Optional<User>>`, `flatMap` collapses it to `Optional<User>`.

🔴 **Erklärung:** When you have a function `T → Stream<R>` (or `T → Collection<R>`), always use `flatMap`. Using `map` wraps each sub-stream inside the outer stream — you get `Stream<Stream<R>>` which is nearly impossible to work with.

</details>

---

### Part B: Implementation

**B2.** Implement a custom `Collector` that groups strings by their first character:

```java
// Skeleton — JavaSolutions/ps/java/FirstCharGrouper.java
import java.util.*;
import java.util.stream.*;
import java.util.function.*;

public class FirstCharGrouper {

    /**
     * Returns a Collector that groups strings by their first character.
     * e.g., ["apple", "avocado", "banana"] → {'a': ["apple", "avocado"], 'b': ["banana"]}
     */
    public static Collector<String, ?, Map<Character, List<String>>> byFirstChar() {
        return Collectors.groupingBy(
            s -> s.isEmpty() ? '\0' : s.charAt(0)  // classifier function
        );
    }

    /**
     * Generates infinite Fibonacci numbers as a Stream.
     * Terminates when consumer calls .limit(n) or .takeWhile(predicate).
     */
    public static Stream<Long> fibonacci() {
        // TODO: use Stream.iterate with two-value state
        return Stream.iterate(new long[]{0, 1}, pair -> new long[]{pair[1], pair[0] + pair[1]})
                     .map(pair -> pair[0]);
    }
}
```

**JUnit Test Stub:**

```java
class FirstCharGrouperTest {
    @Test void groupByFirstChar() {
        var words = List.of("apple", "avocado", "banana", "blueberry", "cherry");
        var result = words.stream().collect(FirstCharGrouper.byFirstChar());
        assertEquals(List.of("apple", "avocado"), result.get('a'));
        assertEquals(List.of("banana", "blueberry"), result.get('b'));
        assertEquals(1, result.get('c').size());
    }

    @Test void fibonacci_first10() {
        var fibs = FirstCharGrouper.fibonacci().limit(10).toList();
        assertEquals(List.of(0L,1L,1L,2L,3L,5L,8L,13L,21L,34L), fibs);
    }

    @Test void fibonacci_isLazy() {
        // This should NOT run forever — limit() makes it terminate
        long fib50 = FirstCharGrouper.fibonacci().skip(49).findFirst().orElseThrow();
        assertTrue(fib50 > 0); // just verify it terminates and returns a value
    }
}
```

---

## Problem Set SPRING-PS1 — Spring Boot Core

**Prerequisites:** `07_Modern_Java/Ch26_Pre_Spring_Part1.md`, `07_Modern_Java/Ch32_SB_Data_Part2.md`, `07_Modern_Java/Ch33_SB_Web_Part3.md`, `07_Modern_Java/Ch34_SB_Security_Part4.md`

---

### Part A: Theoretical

**A1 (Easy).** What is the difference between `@Component`, `@Service`, `@Repository`, and `@Controller`? Are they functionally different in Spring's IoC container?

<details><summary>Answer</summary>

All four are **specializations of `@Component`** — they all trigger Spring's component scan and register the bean in the ApplicationContext. Functionally, the IoC container treats them identically.

**Semantic differences:**

- `@Service` — marks business logic layer (no extra behavior)
- `@Repository` — adds exception translation: wraps SQL/JPA exceptions in Spring's `DataAccessException` hierarchy
- `@Controller` — enables MVC request mapping (used by `DispatcherServlet`)
- `@RestController` = `@Controller` + `@ResponseBody`

🔴 **Erklärung:** Students think `@Service` and `@Component` are interchangeable everywhere. They are — but `@Repository` is NOT just semantic: it enables the Spring exception translator, which wraps vendor-specific SQL exceptions (`com.mysql.exceptions.MySQLException`) into Spring's `DataIntegrityViolationException`. Without `@Repository`, those vendor exceptions leak through.

</details>

---

**A2 (Medium).** Explain the Spring Bean lifecycle. What is the correct order?

<details><summary>Answer</summary>

**Full lifecycle order:**

1. **Instantiation** — `new MyBean()` called by Spring
2. **Dependency Injection** — `@Autowired` fields set (field injection) OR constructor called with deps (constructor injection)
3. **`@PostConstruct`** — method annotated `@PostConstruct` called; bean is fully initialized
4. **Bean ready** — available in ApplicationContext for use
5. **`@PreDestroy`** — called on ApplicationContext close (e.g., app shutdown)
6. **Destruction** — object GC'd

**Constructor injection order:** Constructor executes WITH dependencies already created — no separate injection step.

🔴 **Erklärung:** `@PostConstruct` fires AFTER all injections are complete. Students try to use `@Autowired` fields inside a constructor — at that point, field injection hasn't happened yet. **Always use constructor injection** to avoid this ordering trap entirely.

</details>

---

**A3 (Hard).** A developer adds `@Transactional` to a `private` method inside a class and calls it from another method in the SAME class. Does the transaction work? Explain exactly why using Spring's proxy mechanism.

<details><summary>Answer</summary>

**Answer: No, the transaction does NOT work.**

**Reason — Spring AOP Proxies:**

Spring implements `@Transactional` using JDK Dynamic Proxies (or CGLIB). When you call `orderService.placeOrder()`, you are actually calling through a **proxy object** that wraps the real bean. The proxy intercepts the call, begins a transaction, delegates to the real method, and commits.

**The problem:**

```java
@Service class OrderService {
    public void placeOrder(Order order) {
        this.processPayment(order); // calls this — bypasses proxy!
    }

    @Transactional
    private void processPayment(Order order) { ... } // NO TRANSACTION — and private = not proxyable
}
```

When `placeOrder` calls `this.processPayment`, `this` is the **real bean**, NOT the proxy. The proxy never intercepts the internal call. The transaction annotation is completely ignored.

**Two problems here:**

1. `private` methods cannot be proxied (proxy can only override public/protected methods)
2. `this.method()` bypasses the proxy even for public methods

**Fix:** Extract `processPayment` to a separate Spring bean and inject it.

🔴 **Erklärung:** This is one of the most common Spring bugs at mid-level. The fix is architecturally correct too: if two operations are in different transactions, they belong in different beans.

</details>

---

### Part B: Implementation

**B3.** Implement a Spring Boot `BookController` with proper HTTP semantics:

```java
// Skeleton — JavaSolutions/ps/java/spring/BookController.java
@RestController
@RequestMapping("/api/books")
@Validated
public class BookController {

    private final BookService bookService;

    public BookController(BookService bookService) {
        this.bookService = bookService;
    }

    // GET /api/books — list all books (with optional ?title= search param)
    @GetMapping
    public ResponseEntity<List<BookResponse>> getAllBooks(
            @RequestParam(required = false) String title) {
        // TODO: return 200 with list (filter by title if present)
        return null;
    }

    // GET /api/books/{id}
    @GetMapping("/{id}")
    public ResponseEntity<BookResponse> getBook(@PathVariable Long id) {
        // TODO: return 200 or 404 (throw BookNotFoundException, handled by @ControllerAdvice)
        return null;
    }

    // POST /api/books — create new book
    @PostMapping
    public ResponseEntity<BookResponse> createBook(@Valid @RequestBody BookRequest request) {
        // TODO: return 201 Created with Location header
        return null;
    }

    // PUT /api/books/{id} — full update
    @PutMapping("/{id}")
    public ResponseEntity<BookResponse> updateBook(@PathVariable Long id,
                                                    @Valid @RequestBody BookRequest request) {
        // TODO: return 200 updated or 404
        return null;
    }

    // DELETE /api/books/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBook(@PathVariable Long id) {
        // TODO: return 204 No Content or 404
        return null;
    }
}
```

**JUnit + MockMvc Test Stub:**

```java
@WebMvcTest(BookController.class)
class BookControllerTest {
    @Autowired MockMvc mockMvc;
    @MockBean BookService bookService;
    @Autowired ObjectMapper mapper;

    @Test void getBook_found_returns200() throws Exception {
        when(bookService.findById(1L)).thenReturn(sampleResponse());
        mockMvc.perform(get("/api/books/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.title").value("Clean Code"));
    }

    @Test void getBook_notFound_returns404() throws Exception {
        when(bookService.findById(99L)).thenThrow(new BookNotFoundException(99L));
        mockMvc.perform(get("/api/books/99"))
            .andExpect(status().isNotFound());
    }

    @Test void createBook_validBody_returns201() throws Exception {
        var req = new BookRequest("Clean Code", "978-0-13-235088-4", "Robert Martin");
        when(bookService.create(any())).thenReturn(sampleResponse());
        mockMvc.perform(post("/api/books")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(req)))
            .andExpect(status().isCreated())
            .andExpect(header().exists("Location"));
    }

    @Test void createBook_missingTitle_returns400() throws Exception {
        var req = new BookRequest(null, "978-0-13-235088-4", "Author");
        mockMvc.perform(post("/api/books")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(req)))
            .andExpect(status().isBadRequest());
    }

    private BookResponse sampleResponse() {
        return new BookResponse(1L, "Clean Code", "978-0-13-235088-4", "Robert Martin");
    }
}
```

🔴 **Erklärung:**

| Mistake                                   | Why                                                               | Fix                                                                            |
| ----------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Return `200` for POST create              | REST semantics: resource WAS created                              | Return `201 Created` + `Location: /api/books/{id}` header                      |
| Return `200` for DELETE                   | REST semantics: no body returned                                  | Return `204 No Content`                                                        |
| Throw raw `RuntimeException` from service | Stack trace leaks in response                                     | Throw typed exceptions (`BookNotFoundException`) caught by `@ControllerAdvice` |
| `@Autowired` on field                     | Field injection — not testable without Spring context             | Constructor injection always                                                   |
| Missing `@Valid` on request body          | Bean Validation annotations ignored — invalid data enters service | Always `@Valid @RequestBody`                                                   |

---

[← Back to Semester 2 Guide](../00_CURRICULUM/SEMESTER_2_GUIDE.md)
