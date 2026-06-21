# 🧪 Testing Fundamentals - Complete Guide

**Navigation**: [< Clean Code](05_Clean_Code.md) | [Index](00_INDEX.md) | [Next: API Design >](07_API_Design_REST.md)

---

# WHY: Why Testing Matters

## The Cost of Bugs

```
When bug is found        │ Cost to fix
─────────────────────────┼───────────
During coding            │ $1
During code review       │ $5
During testing           │ $15
After deployment         │ $100
In production (customer) │ $1,000+
After compliance audit   │ $10,000+

Testing = Finding bugs when they're CHEAP to fix
```

## The Testing Pyramid

```
                    ┌─────┐
                    │ E2E │  ← Slow, expensive, few
                   ─┤     ├─
                  / │     │ \
                 /  └─────┘  \
                /   ┌───────┐ \
               /    │ Integ │  \  ← Medium speed, some
              /     │ration │   \
             /      └───────┘    \
            /     ┌─────────────┐ \
           /      │    UNIT     │  \  ← Fast, cheap, MANY
          /       │    TESTS    │   \
         /        └─────────────┘    \
        ──────────────────────────────

Unit Tests:        70% of all tests (fast, isolated, test ONE method)
Integration Tests: 20% of all tests (test components working together)
E2E Tests:         10% of all tests (test full user workflows)
```

---

🔬 **Section Challenge - The Testing Pyramid**

**Challenge 1 (Reasoning):** A team has 500 E2E tests, 100 integration tests, and 50 unit tests - an inverted pyramid. Name two concrete consequences they experience in CI/CD.

<details><summary>Answer</summary>

1. **Slow CI pipeline**: E2E tests launch a browser, boot the full stack, and run real HTTP calls. 500 of them take 30-60 minutes per run. Developers stop waiting for CI and merge blindly. 2. **Flaky test hell**: E2E tests fail for non-code reasons - network latency, race conditions in UI rendering, external API timeouts. A 2% flake rate across 500 tests = 10 random failures per run. The team learns to ignore red CI, which defeats the entire purpose. Unit tests run in milliseconds, are fully deterministic, and have zero external dependencies. 70% unit / 20% integration / 10% E2E is the target because it maximizes coverage speed and reliability.

</details>

**Challenge 2 (Senior):** Your test suite takes 45 minutes per run. How do you reduce it without deleting tests?

<details><summary>Answer</summary>

1. **Parallelize**: Split tests across multiple runners (GitHub Actions matrix, JUnit Platform parallel execution `junit.jupiter.execution.parallel.enabled=true`). 45 min ÷ 8 runners = ~6 min. 2. **Layer isolation**: Convert integration tests that only test business logic (no DB interaction) to unit tests with mocks. The bulk of time is usually Spring context startup - each `@SpringBootTest` class boots a full context. Annotate shared context tests with `@TestMethodOrder` so they reuse one context. 3. **Shard E2E by feature**: Run E2E tests only for the features changed in the PR (use file-change path filtering in CI). 4. **TestContainers reuse**: Set `testcontainers.reuse.enable=true` so the Postgres container survives between test runs locally.

</details>

# WHAT: Types of Testing

## Unit Testing

```java
// WHAT: Test a single method in ISOLATION
// Mock all dependencies

// The method to test:
public class PriceCalculator {
    public BigDecimal calculateDiscount(BigDecimal price, int percentage) {
        if (percentage < 0 || percentage > 100) {
            throw new IllegalArgumentException("Invalid percentage");
        }
        BigDecimal discount = price.multiply(BigDecimal.valueOf(percentage))
                                   .divide(BigDecimal.valueOf(100));
        return price.subtract(discount);
    }
}

// The test:
@Test
void shouldApply20PercentDiscount() {
    PriceCalculator calc = new PriceCalculator();

    BigDecimal result = calc.calculateDiscount(
        new BigDecimal("100.00"), 20
    );

    assertEquals(new BigDecimal("80.00"), result);
}

@Test
void shouldRejectNegativePercentage() {
    PriceCalculator calc = new PriceCalculator();

    assertThrows(IllegalArgumentException.class, () -> {
        calc.calculateDiscount(new BigDecimal("100.00"), -5);
    });
}
```

🔬 **Section Challenge - Unit Testing**

**Challenge 1 (Reasoning):** A "unit test" calls a real PostgreSQL database and a real Stripe HTTP API. What specifically makes it no longer a unit test, and what are the two concrete failure modes it introduces?

<details><summary>Answer</summary>

A unit test must be **isolated** - it tests one unit of logic with all dependencies replaced by mocks/stubs. Calling real external systems violates isolation. Failure modes: (1) **Flakiness**: the test fails when Postgres is down, the network is slow, or Stripe's sandbox has an outage - for reasons completely unrelated to your code. (2) **Slowness**: a real DB call + HTTP round-trip takes 200-1000ms per test. With 1,000 tests, that's 200 seconds vs 200ms for true unit tests. Proper fix: mock the repository with `@Mock OrderRepository repo; when(repo.save(any())).thenReturn(savedOrder)` and stub the Stripe client. Test the DB and HTTP separately in integration tests.

</details>

**Challenge 2 (Trace):** `calculateDiscount` has 3 branches (0-10%, 11-50%, 51-100%). What is the minimum number of test cases for full **branch coverage**, and what additional cases does **boundary value analysis** demand?

<details><summary>Answer</summary>

**Branch coverage** minimum: 3 cases - one input per branch (e.g., 5%, 25%, 75%). This proves all branches execute. **Boundary value analysis** adds cases at the edges where off-by-one bugs hide: 0 (minimum valid), 10 (upper edge of branch 1), 11 (lower edge of branch 2), 50 (upper edge of branch 2), 51 (lower edge of branch 3), 100 (maximum valid), -1 (just below minimum - should throw), 101 (just above maximum - should throw). Total: 3 branch + 8 boundary = 11 meaningful test cases. This is why high coverage % doesn't mean good tests - 3 tests can hit 100% branch coverage while missing all the boundary bugs.

</details>

## Integration Testing

```java
// WHAT: Test components WORKING TOGETHER
// Use real database, real HTTP calls

@SpringBootTest
@AutoConfigureMockMvc
class OrderControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private OrderRepository orderRepo;

    @Test
    void shouldCreateOrderAndPersistToDatabase() throws Exception {
        String json = """
            {"product": "Laptop", "quantity": 1, "price": 999.99}
            """;

        mockMvc.perform(post("/api/orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").exists());

        // Verify it actually saved to database
        assertEquals(1, orderRepo.count());
    }
}
```

🔬 **Section Challenge - Integration Testing**

**Challenge 1 (Reasoning):** `@SpringBootTest` boots the full Spring context. For a large app this takes 30 seconds per test class. Name two specific strategies to reduce this overhead.

<details><summary>Answer</summary>

1. **Context caching**: Spring Test caches the application context and reuses it across test classes that share the same configuration. To maximize reuse: avoid `@MockBean` (it forces a new context per class), use `@TestConfiguration` with the same beans, and don't use `@DirtiesContext` unless necessary. 2. **Slice tests**: Instead of loading the full context, use targeted slice annotations - `@WebMvcTest` loads only the web layer (controllers, filters, no service/repo beans), `@DataJpaTest` loads only JPA (H2 + repositories, no web layer). A controller test with `@WebMvcTest` starts in ~3 seconds vs 30 seconds for `@SpringBootTest`.

</details>

**Challenge 2 (Bug Hunt):** An integration test asserts `assertEquals(1, orderRepo.count())` after creating one Order. It passes alone but fails in parallel CI with count = 3. What is the bug?

<details><summary>Answer</summary>

**Test isolation failure**: parallel test runs share the same database, so orders created by other tests bleed into this test's count. Fixes: (1) **`@Transactional` on the test class** - each test runs inside a transaction that is rolled back after the test, leaving the DB clean for the next test. (2) **`@Sql` cleanup scripts** - `@Sql(scripts = "/cleanup.sql", executionPhase = BEFORE_TEST_METHOD)` truncates tables before each test. (3) **TestContainers with `@DirtiesContext`** - each test class gets a fresh container. Don't assert absolute counts (`count() == 1`) in shared-DB tests; assert relative changes (`countBefore + 1`) or use `@Transactional` rollback.

</details>

## E2E / Acceptance Testing

```java
// WHAT: Test full user workflows (browser → backend → database → response)
// Tools: Selenium, Playwright, Cypress

// Example with Selenium:
@Test
void userCanLoginAndViewDashboard() {
    driver.get("http://localhost:8080/login");
    driver.findElement(By.id("email")).sendKeys("user@test.com");
    driver.findElement(By.id("password")).sendKeys("password123");
    driver.findElement(By.id("loginBtn")).click();

    // Should redirect to dashboard
    assertTrue(driver.getCurrentUrl().contains("/dashboard"));
    assertTrue(driver.findElement(By.id("welcomeMsg")).isDisplayed());
}
```

---

🔬 **Section Challenge - E2E / Acceptance Testing**

**Challenge 1 (Trace):** Trace through the following test and identify which phase of Arrange-Act-Assert each block belongs to. Then explain what the `assertEquals` is actually verifying at the domain level.

```java
@Test
void shouldCalculateTotalWithTax() {
    // Block A
    OrderService service = new OrderService(0.18);
    Order order = new Order(List.of(
        new Item("Book", 50.00),
        new Item("Pen", 10.00)
    ));

    // Block B
    BigDecimal total = service.calculateTotal(order);

    // Block C
    assertEquals(new BigDecimal("70.80"), total);
}
```

<details><summary>Answer</summary>

**Block A = Arrange**: creates the system under test (`OrderService`) and the input data (`Order` with 2 items). No production behavior is triggered here. **Block B = Act**: calls exactly ONE method - the unit of behavior being tested. **Block C = Assert**: verifies the result. Domain interpretation: subtotal = 50 + 10 = 60.00. Tax = 60 × 0.18 = 10.80. Total = 70.80. The assertion proves the tax calculation formula is correct. Key insight: this test also implicitly tests that `Item` prices are summed before applying tax (not per-item tax then summed) - a business rule embedded in the assertion value.

</details>

**Challenge 2 (Reasoning):** E2E tests are the most realistic but the most brittle. Name three specific reasons why a Selenium test can fail even when your application code is 100% correct.

<details><summary>Answer</summary>

1. **Timing/async rendering**: Selenium clicks a button before React has re-rendered the result - `findElement(By.id("result"))` throws `NoSuchElementException`. Fix: use `WebDriverWait` + `ExpectedConditions.visibilityOfElementLocated()` instead of implicit waits. 2. **Test environment drift**: the E2E test environment has a different database seed, different feature flags, or a different version of a third-party widget than production. The test passes in CI but fails against staging. 3. **Browser version mismatch**: ChromeDriver version must exactly match the installed Chrome version. A Chrome auto-update breaks all Selenium tests overnight. Fix: use `WebDriverManager` to auto-match driver versions.

</details>

## Test Data Builders (GOOS Pattern)

In _Growing Object-Oriented Software, Guided by Tests_ (GOOS), the authors strongly advocate for the **Test Data Builder** pattern to construct complex domain objects for tests.

```java
// BAD: Brittle constructors make tests hard to read and fragile
@Test
void shouldCalculateDiscount() {
    // What do all these nulls and booleans mean? If Order adds a field, this breaks!
    Order order = new Order(123L, null, "USD", true, false, new Customer("John", "Doe", 30), new ArrayList<>());

    BigDecimal total = service.calculateTotal(order);
    // ...
}

// GOOD: Test Data Builder
@Test
void shouldCalculateDiscount() {
    // Only specify the data relevant to THIS specific test
    Order order = anOrder()
        .withCurrency("USD")
        .withCustomer(aCustomer().withAge(30).build())
        .isPriority()
        .build();

    BigDecimal total = service.calculateTotal(order);
    // ...
}
```

### Why it matters

1. **Readability**: It highlights _only_ the data relevant to the specific test scenario. The irrelevant fields are filled with sensible defaults by the builder.
2. **Resilience**: If you add a new mandatory field to `Order`, you only update the `OrderBuilder` class with a default value. You don't have to fix 500 broken tests that were calling the `Order` constructor directly.

## Test Naming Convention

```java
// Pattern: should_[ExpectedBehavior]_when_[Condition]

@Test void shouldReturnZero_whenCartIsEmpty() {}
@Test void shouldThrowException_whenAmountIsNegative() {}
@Test void shouldApplyDiscount_whenCouponIsValid() {}
@Test void shouldNotChargeShipping_whenOrderExceedsFreeThreshold() {}
```

🔬 **Section Challenge - Test Naming Critique**

The section above shows examples of test names like `shouldReturnZero_whenCartIsEmpty()` and `shouldThrowException_whenAmountIsNegative()`. Compare these to three bad examples from real codebases:

1. `testCalculateDiscount()`
2. `test1()`
3. `shouldWork()`

For each bad name, explain exactly what information is missing that the good names convey. Then write a test name for: testing that `InventoryService.deductStock(sku, quantity)` throws an `InsufficientStockException` when the requested quantity exceeds available stock for a SKU that's been soft-deleted.

<details>
<summary>Answer</summary>

**Information missing from each bad name**:
1. `testCalculateDiscount()` - does not specify the input condition (which discount scenario?) nor the expected outcome (what does the result equal?). Reader must read the test body to know what's tested.
2. `test1()` - provides zero information. Reader cannot tell what behavior is verified; impossible to find this test in a CI failure log.
3. `shouldWork()` - "work" is undefined. The reader doesn't know what behavior is being verified.

**The good names** convey three things:
- **The expected outcome**: `shouldReturnZero`, `shouldThrowException`
- **The triggering condition**: `whenCartIsEmpty`, `whenAmountIsNegative`
- **The subject under test**: implicit in the method name (`calculateDiscount`, `validateAmount`)

**Test name for the challenge**: `shouldThrowInsufficientStockException_whenDeductingMoreThanAvailableForSoftDeletedSku()`. This name tells you:
- Outcome: throws `InsufficientStockException`
- Trigger: deducting more than available
- Edge case: SKU is soft-deleted (not permanently removed from DB)

**Why the long name is OK**: test names are NOT APIs. They are documentation. A reader scanning a CI failure log or test report sees the full name and knows immediately what scenario failed. Compare to a 10-character log message that requires grep + code-reading to understand.

**Trade-off**: very long names clutter IDE displays. The solution is `should_X_when_Y` convention with 3-8 words - enough to be specific, short enough to fit on one line in most IDEs.
</details>

**Challenge 2 (Design):** A codebase has `shouldThrowException_whenAmountIsNegative()` failing. A developer changes it to `@Disabled` and comments "fix later." What is the exact risk this creates and what is the correct fix?

<details><summary>Answer</summary>

`@Disabled` is the test equivalent of `TODO: fix later` - it never gets fixed. The risk: the bug the test was catching (negative amounts not rejected) now silently exists in production. The correct fix is to treat a failing test as a **blocking issue**: either (1) fix the bug in the production code so the test passes, or (2) if the behavior is intentionally changing, update the test to match the new spec (and document why). Disabling tests to make CI green is a form of technical debt that always costs more later - the negative-amount path may cause a downstream accounting bug discovered months later.

</details>

## Edge Cases to ALWAYS Test

```
1. NULL inputs
2. EMPTY collections
3. BOUNDARY values (0, -1, MAX_INT, "")
4. DUPLICATE values
5. VERY LARGE inputs
6. CONCURRENT access
7. INVALID formats ("not-a-number", wrong date format)

// Example: testing ALL edges for age validation
@Test void shouldReject_whenAgeIsNull() {}
@Test void shouldReject_whenAgeIsNegative() {}
@Test void shouldReject_whenAgeIsZero() {}
@Test void shouldAccept_whenAgeIsOne() {}        // boundary
@Test void shouldAccept_whenAgeIs150() {}         // boundary
@Test void shouldReject_whenAgeIs151() {}         // just over boundary
```

🔬 **Section Challenge — Boundary Value Analysis Edge Cases**

A function `validateAge(int age)` must return `true` if `age` is between 18 and 65 inclusive. Using boundary value analysis (BVA), what are the test cases you should write? Why is BVA better than testing only "typical" values?

<details>
<summary>Answer</summary>

**BVA test cases for `validateAge(int age)`** (valid range 18–65 inclusive):

| Input | Expected | Why |
|---|---|---|
| `age = 17` | `false` | Just below lower boundary |
| `age = 18` | `true` | At lower boundary |
| `age = 19` | `true` | Just above lower boundary |
| `age = 64` | `true` | Just below upper boundary |
| `age = 65` | `true` | At upper boundary |
| `age = 66` | `false` | Just above upper boundary |

Total: 6 boundary tests + 2 nominal tests (`age = 30`, `age = 50`) for sanity.

**Why BVA catches bugs "typical" tests miss**:

Off-by-one bugs at boundaries are extremely common. Consider:
- Developer A writes `if (age >= 18 && age <= 65)` (correct, boundary inclusive).
- Developer B writes `if (age > 18 && age < 65)` (off-by-one — rejects 18 and 65).
- Developer C writes `if (age >= 18 && age < 65)` (off-by-one on upper).

A test suite that only checks `age = 30` passes for all three implementations. A test at `age = 18` and `age = 65` distinguishes them.

**Why not exhaustive testing** (test every value 0–120)?
- 121 test cases for a single integer input is too many
- Most values (e.g., `age = 30`, `age = 45`) test the same code path
- BVA identifies the boundary points where code branches change

**The principle**: bugs cluster at decision boundaries. Test the boundaries + one nominal value, not the middle of ranges.

**Real-world BVA application**:
- Date ranges (first day of month, last day of month, leap year Feb 29)
- Array indices (empty array, single element, last element)
- Numeric limits (INT_MIN, 0, INT_MAX)
- String length (empty string, single char, max length)

Coverage % is a misleading proxy for "tests are good." A 100% coverage test suite with no boundary tests is worse than a 60% coverage suite with thorough BVA.
</details>

## Mocking with Mockito

```java
// WHY mock? Isolate the class under test from its dependencies

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepo;

    @Mock
    private PaymentGateway paymentGateway;

    @InjectMocks
    private OrderService orderService;

    @Test
    void shouldSaveOrder_whenPaymentSucceeds() {
        // Arrange
        Order order = new Order("Laptop", 999.99);
        when(paymentGateway.charge(anyDouble())).thenReturn(true);

        // Act
        orderService.placeOrder(order);

        // Assert
        verify(orderRepo).save(order);  // was save() called?
        verify(paymentGateway).charge(999.99);
    }

    @Test
    void shouldNotSaveOrder_whenPaymentFails() {
        // Arrange
        Order order = new Order("Laptop", 999.99);
        when(paymentGateway.charge(anyDouble())).thenReturn(false);

        // Act & Assert
        assertThrows(PaymentFailedException.class, () -> {
            orderService.placeOrder(order);
        });
        verify(orderRepo, never()).save(any());  // save should NOT be called
    }
}
```

🔬 **Section Challenge - Mocking with Mockito**

**Challenge 1 (Reasoning):** What is the difference between `@Mock` and `@Spy` in Mockito? Give a concrete scenario where you must use `@Spy` instead of `@Mock`.

<details><summary>Answer</summary>

`@Mock` creates a **complete fake** of the class - all methods return null/0/false by default. No real code runs. `@Spy` creates a **partial mock** - it wraps a real object; real methods are called unless you explicitly stub them with `doReturn(...).when(spy).method()`. Use `@Spy` when you want to test ONE method of a class while letting the rest of the class execute normally. Concrete scenario: you have a `ReportGenerator` class with `generatePDF()` calling `fetchData()` internally. You want to test `generatePDF()` with real logic but stub `fetchData()` to return test data without hitting the database. `@Mock ReportGenerator` would make ALL methods fake. `@Spy ReportGenerator` + `doReturn(testData).when(spy).fetchData()` lets the real `generatePDF()` run while intercepting only `fetchData()`.

</details>

**Challenge 2 (Trace):** `verify(orderRepo, never()).save(any())` - what does this assertion prove, and why is it more powerful than just asserting the exception was thrown?

<details><summary>Answer</summary>

`verify(orderRepo, never()).save(any())` proves that **the repository's `save` method was never called** during the test. This is more powerful than just `assertThrows(PaymentFailedException.class, ...)` because: asserting the exception only proves the exception was thrown. It does NOT prove that no side effects occurred before the throw. The bug scenario: a buggy implementation calls `orderRepo.save(order)` THEN calls `paymentGateway.charge()`, which throws. The exception propagates, your exception assertion passes — but the order was already persisted to the database in a failed state. `verify(orderRepo, never()).save(any())` catches this bug: it proves the save was never called, meaning the failure is truly atomic. This is **behavior-based testing** — verifying interactions, not just outputs.

</details>

🔬 **Section Challenge — Mockito Spy vs Mock**

You have a `UserService` that delegates to a `UserRepository`. You want to test that `UserService.registerUser()` calls `repository.save(user)` exactly once with the correct User object. You have two options:

```java
// Option A: Mock the repository
@Mock UserRepository repository;

@Test
void testRegisterUser() {
    UserService service = new UserService(repository);
    User user = new User("alice@example.com");
    service.registerUser(user);
    verify(repository).save(user);
}

// Option B: Spy on the real repository
@Spy UserRepository repository = new UserRepository();

@Test
void testRegisterUser() {
    UserService service = new UserService(repository);
    User user = new User("alice@example.com");
    service.registerUser(user);
    verify(repository).save(user);
}
```

What's the difference between `@Mock` and `@Spy`? When would you choose each?

<details>
<summary>Answer</summary>

**`@Mock`**: creates a stub. All methods return default values (null, 0, false) unless stubbed. The repository isn't a real instance — it's a placeholder.

**`@Spy`**: wraps a real instance. Real methods are called unless explicitly stubbed. You can verify SOME calls while letting others execute normally.

**When to use each**:
- **`@Mock`**: when the dependency is complex or has side effects you don't want (e.g., `UserRepository.save()` actually writes to a database — you don't want that in a unit test).
- **`@Spy`**: when you want to verify SOME behavior while executing the rest. E.g., spy on a `Cache` to verify `get()` was called, but let it actually retrieve from the underlying store.

**For the `registerUser` test**: `@Mock` is the right choice. You don't want `UserRepository.save()` to actually write to a database in a unit test — you only want to verify the call happened.

**Anti-pattern**: using `@Spy` on a real repository that writes to the actual database. The test now requires database setup, runs slowly, and can leave dirty data.

**The line**: if the dependency is "outside the unit" (database, network, file system), use `@Mock`. If the dependency is "inside the unit" and you want partial verification, use `@Spy`.

**Production note**: Mockito 5.x deprecated `verifyNoMoreInteractions()` and other strict verifications. Use `verify(...)` for what you care about; don't assert on every interaction.
</details>

## TDD (Test-Driven Development)

```
TDD Cycle:
  1. RED   - Write a FAILING test first
  2. GREEN - Write the MINIMUM code to make it pass
  3. REFACTOR - Clean up without breaking tests

Example:
  Step 1 (RED): Write test → shouldCalculateAreaOfCircle(radius=5) → 78.54
  Step 2 (GREEN): Write method → return Math.PI * r * r;
  Step 3 (REFACTOR): Extract to Circle class, add validation

WHY TDD?
  - You THINK about design before coding
  - Every line of code is tested from birth
  - Tests serve as living documentation
  - Refactoring is SAFE (tests catch regressions)
```

---

# WHERE: Testing in Real Projects

## Test Structure

```
src/
├── main/java/com/myapp/
│   ├── controller/
│   ├── service/
│   └── repository/
└── test/java/com/myapp/
    ├── controller/      ← Integration tests (MockMvc)
    ├── service/         ← Unit tests (Mockito)
    └── repository/      ← Integration tests (H2 DB)
```

## What to Test (Priority)

```
ALWAYS test:
  ✅ Business logic (calculations, rules, validations)
  ✅ Edge cases and error paths
  ✅ API contracts (request/response format)
  ✅ Database queries (correct data returned?)

DON'T test:
  ❌ Getters and setters
  ❌ Framework code (Spring handles it)
  ❌ Private methods directly (test via public methods)
  ❌ Third-party libraries
```

## Code Coverage

```
Coverage = % of code lines executed by tests

Guidelines:
  80%+ → Good for most projects
  90%+ → Critical systems (banking, healthcare)
  100% → Diminishing returns, not practical

IMPORTANT: High coverage ≠ good tests!
  You can have 100% coverage with ZERO meaningful assertions.
  Focus on testing BEHAVIOR, not just executing lines.
```

---

## WHO: Origin Story

**Kent Beck** created **SUnit in 1989** (Smalltalk) - the first xUnit framework, originally as a tool for himself. He didn't intend to create a movement; he just wanted help debugging Smalltalk code.

**Kent Beck and Erich Gamma** released **JUnit in 1997** - the Java port of SUnit that catalyzed the xUnit adoption wave. Gamma was visiting Beck at Apple; they pair-programmed the first version over a weekend. JUnit's design was so clean it became the template for xUnit frameworks in 30+ languages (Python's unittest, .NET's NUnit, JavaScript's Jest, Go's testing, Rust's cargo test).

**Dan North** introduced **Behavior-Driven Development (BDD)** in **2006** - the observation that "test" was the wrong metaphor for stakeholder communication. The shift to "given/when/then" scenarios (later formalized in Gherkin by Aslak Hellesøy for Cucumber, 2008) made tests readable by product owners.

**JUnit 5** released **September 2017** after 5+ years in development - a complete rewrite under JUnit Lambda (championed by Marc Philipp and Stefan Bechtold), introducing the `@DisplayName` annotation, nested tests, and parameterized tests with method sources.

The lineage matters: Beck's 1989 motivation (write a tiny test, then refactor confidently) drove Gamma's 1997 implementation (make it Java-idiomatic) which North's 2006 BDD reframed (make it business-readable). Modern testing culture descends from these three decisions.

### Historical Evolution

**Testing frameworks and practices have evolved from Smalltalk to JavaScript:**

- **1989** - SUnit (Smalltalk Unit Testing Framework) created by Kent Beck at Tektronix, introducing the xUnit pattern: `setUp()`, `tearDown()`, `assert*` methods, and the test runner. Every modern testing framework (JUnit, NUnit, pytest, Jest) descends directly from SUnit's design.
- **1997** - Kent Beck and Erich Gamma released JUnit at the PLoP conference (pattern languages conference). JUnit established Java as a first-class testing language and introduced the `TestCase`, `TestSuite`, and `assert*` patterns that became the universal testing vocabulary.
- **2003** - Kent Beck's "Test-Driven Development by Example" (Addison-Wesley) formalized TDD as a disciplined practice: Red (failing test), Green (make it pass), Refactor. This book evangelized TDD across the industry and remains the canonical TDD reference.
- **2006** - JUnit 4 released, adopting Java 5 annotations (`@Test`, `@Before`, `@After`) instead of method naming conventions, and integrating with modern build tools (Maven, Ant). The framework matured from a tool into an ecosystem.
- **2006** - Dan North introduced BDD (Behavior-Driven Development) in his article "Introducing BDD" (dannorth.net), reframing tests as specifications of behavior using a Given-When-Then vocabulary. JBehave and then Cucumber popularized this outside-in testing approach.
- **2014** - Jest released by Facebook (originally for React testing). Jest's focus on zero-configuration, integrated mocking, and fast execution (Jest uses jsdom + isolated sandboxed tests) established the modern standard for JavaScript testing.
- **2017** - JUnit 5 (Codename: JUnit Lambda) released after three years of development. JUnit 5 introduced a modular architecture (JUnit Platform, Jupiter, Vintage), native support for lambdas in tests, parameterized tests, and improved extensibility - modernizing the framework for Java 8+.

**Key references:**
- Kent Beck - SUnit (1989) and JUnit (1997) - The originator of the xUnit testing pattern; every modern testing framework in any language traces back to Beck's Smalltalk implementation.
- Kent Beck - *Test-Driven Development by Example* (2003) - The canonical TDD reference; introduced the Red-Green-Refactor cycle and demonstrated TDD as a design practice, not just a testing technique.
- Dan North - BDD article "Introducing BDD" (2006) - Reframed testing from checking behavior to specifying behavior; the Given-When-Then vocabulary became the standard for acceptance testing.
- JUnit Team - JUnit 5 / JUnit Lambda (2017) - Modernized the 20-year-old JUnit framework with Java 8+ features, a modular architecture, and the `@Tag`, `@Nested`, and `@DisplayName` annotations that make large test suites maintainable.

**Why this matters for testing:** The testing pyramid (70% unit, 20% integration, 10% E2E) and the Arrange-Act-Assert pattern are not arbitrary - they emerged from 30 years of empirical evidence about what makes test suites fast, reliable, and maintainable. Understanding the SUnit (1989) → JUnit (1997) → JUnit 5 (2017) evolution explains why modern testing frameworks work the way they do.

---

# 🧭 Testing Cheat Sheet

```
UNIT:          JUnit 5 + Mockito
INTEGRATION:   @SpringBootTest + TestContainers
API:           MockMvc / RestAssured
E2E:           Selenium / Playwright
PERFORMANCE:   JMeter / Gatling
PATTERN:       Arrange → Act → Assert (AAA)
NAMING:        should_[behavior]_when_[condition]
```

---

# 🏋️ Practice

## Exercise 1: Unit Test

```
Write a StringUtils class with methods:
  - reverse(String)
  - isPalindrome(String)
  - countWords(String)
Write tests for each with 5+ edge cases.
```

## Exercise 2: TDD

```
Using TDD (write test FIRST):
Build a BankAccount class with:
  - deposit(amount)
  - withdraw(amount)
  - getBalance()
  - transferTo(account, amount)
Handle: negative amounts, insufficient funds, null account
```

---

### Production Reality

**Testing practices fail in production in these named ways:**

- **Flaky test tax** - Google research (2020, Luo et al.): 16% of CI failures are flaky tests (tests that fail non-deterministically, passing on re-run). At Google scale, flaky tests cost millions in developer hours per year. The 30% of test suite time spent re-running flaky tests reduces effective code review bandwidth. The real danger: developers learn to ignore red CI, and when a real failure appears in the noise, it is dismissed as "another flake."
- **Test coverage as misleading proxy** - 80% line coverage can hide zero assertions on critical paths. A test that calls `order.calculateTotal()` and has 100% line coverage but no assertion (only `// assert result > 0`) passes but catches nothing. Capers Jones research: coverage metrics correlate weakly with defect removal efficiency. The test might be executing code without verifying that the output is correct.
- **Integration test with shared state** - a `@SpringBootTest` that doesn't use `@Transactional` rollback shares state with other test classes running in parallel. Test A creates a user; Test B finds 2 users instead of 1. Test execution order in CI differs from local, making the failure appear intermittently. This is the "works on my machine" of test suites.
- **E2E test fragility on environment drift** - a Selenium test passes in CI against staging but fails in production because production has different feature flags, a newer third-party JS library, or a different CDN response. Browser auto-updates can break ChromeDriver compatibility overnight. Tests that depend on exact DOM element ordering are the most fragile.

**Debug workflow:** For flaky tests: `git bisect` across commits to find the commit that introduced the flake; check for async timing issues (`Thread.sleep`), shared mutable state, or random data generation. For coverage proxy failures: use mutation testing (Pitest) to verify tests actually catch defects, not just execute lines.
**Mitigation discipline:** Configure CI to auto-retry flaky tests once (`--retries=1` in most test frameworks); use `@DirtiesContext` or TestContainers with unique ports per test class to eliminate shared state; maintain a "flaky test quarantine" dashboard to track and fix flakes before they accumulate.

---

### Trade-off: Test Level Variants

| Aspect              | Unit Test         | Integration Test  | End-to-End Test    | Contract Test     |
|---------------------|-------------------|-------------------|-------------------|-------------------|
| Speed               | ms                | seconds           | minutes            | seconds           |
| Scope               | one function      | one service       | whole system      | service boundary  |
| Maintenance         | low               | medium            | high              | medium            |
| Confidence gained   | low               | medium            | high              | medium            |
| Flakiness           | very low          | medium            | high              | low               |
| Year popularized    | 1997 (JUnit)      | 2003 (SpringTest) | 2010 (Selenium)   | 2014 (Pact)       |
| Best for            | business logic    | API contracts     | critical user flows| cross-team APIs   |

**Selection rule (testing pyramid):** Many unit tests, fewer integration tests, fewer still E2E tests, plus contract tests at service boundaries.

**Next Chapter**: [API Design & REST →](07_API_Design_REST.md)

---
