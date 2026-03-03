# 🧪 Testing Fundamentals — Complete Guide

> **Navigation**: [< Clean Code](05_Clean_Code.md) | [Index](00_INDEX.md) | [Next: API Design >](07_API_Design_REST.md)

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

# HOW: Writing Good Tests

## The AAA Pattern

```java
@Test
void shouldCalculateTotalWithTax() {
    // ARRANGE — Setup test data and dependencies
    OrderService service = new OrderService(taxRate: 0.18);
    Order order = new Order(items: List.of(
        new Item("Book", 50.00),
        new Item("Pen", 10.00)
    ));
    
    // ACT — Call the method under test
    BigDecimal total = service.calculateTotal(order);
    
    // ASSERT — Verify the result
    assertEquals(new BigDecimal("70.80"), total); // 60 + 18% tax
}
```

## Test Naming Convention

```java
// Pattern: should_[ExpectedBehavior]_when_[Condition]

@Test void shouldReturnZero_whenCartIsEmpty() {}
@Test void shouldThrowException_whenAmountIsNegative() {}
@Test void shouldApplyDiscount_whenCouponIsValid() {}
@Test void shouldNotChargeShipping_whenOrderExceedsFreeThreshold() {}
```

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

## TDD (Test-Driven Development)

```
TDD Cycle:
  1. RED   — Write a FAILING test first
  2. GREEN — Write the MINIMUM code to make it pass  
  3. REFACTOR — Clean up without breaking tests

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

> **Next Chapter**: [API Design & REST →](07_API_Design_REST.md)
