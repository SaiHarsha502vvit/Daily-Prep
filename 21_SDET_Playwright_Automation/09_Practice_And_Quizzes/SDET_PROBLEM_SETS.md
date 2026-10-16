# 📝 SDET & Test Automation — Problem Sets

## `21_SDET_Playwright_Automation` Module | JUnit5 · Mockito · Playwright · Performance

> **How to use:** Write the test code BEFORE looking. Tests go in `JavaSolutions/ps/sdet/`. All Playwright code in TypeScript.

---

## Problem Set SDET-PS1 — Unit Testing & Mocking

**Prerequisites:** `21_SDET_Playwright_Automation/02_JUnit5.md`, `21_SDET_Playwright_Automation/03_Mockito.md`

---

### Part A: Theoretical

**A1 (Easy).** What is the difference between `@Mock` and `@Spy` in Mockito?

<details><summary>Answer</summary>

|                | `@Mock`                                          | `@Spy`                                       |
| -------------- | ------------------------------------------------ | -------------------------------------------- |
| Object         | Fully synthetic proxy — no real object created   | Wraps a REAL object                          |
| Methods        | All methods return default values unless stubbed | Real methods execute unless stubbed          |
| Use case       | Isolate the class under test from dependencies   | Partially override behavior of a real object |
| When unstubbed | Returns `null` / `0` / `false`                   | Calls the real method                        |

```java
@Mock
UserRepository mockRepo;   // completely fake — no DB access

@Spy
EmailValidator emailValidator = new EmailValidator();  // real object, can override single method

// Override one method on spy:
doReturn(true).when(emailValidator).isValidDomain("test.com");
// All other methods still use the real implementation
```

🔴 **Erklärung:** Overusing `@Spy` is a code smell — it usually means the class under test has too many responsibilities. If you need to spy on the class you're TESTING (not a dependency), the class probably needs to be split.

</details>

---

**A2 (Medium).** What's wrong with this test?

```java
@Test
void testUserService() {
    UserService service = new UserService();  // no mocks
    User result = service.getUserById(1L);
    assertNotNull(result);
}
```

<details><summary>Answer</summary>

**Multiple problems:**

1. **No mock injection** — `UserService` depends on `UserRepository` (likely a DB), so this test hits the real DB. If DB is down, test fails for the wrong reason.

2. **Test name too vague** — `testUserService` tells you nothing about what's being tested. Use: `getUserById_whenUserExists_returnsUser()`

3. **Only testing non-null** — This assertion is too weak. You should verify the actual returned user's ID, name etc.

**Fixed version:**

```java
@ExtendWith(MockitoExtension.class)
class UserServiceTest {
    @Mock UserRepository repo;
    @InjectMocks UserService service;

    @Test
    void getUserById_whenUserExists_returnsCorrectUser() {
        // Arrange
        var user = new User(1L, "Alice", "alice@test.com");
        when(repo.findById(1L)).thenReturn(Optional.of(user));

        // Act
        var result = service.getUserById(1L);

        // Assert
        assertThat(result).isPresent();
        assertThat(result.get().getName()).isEqualTo("Alice");
        verify(repo).findById(1L);  // verify interaction
    }
}
```

🔴 **Erklärung:** The **AAA pattern** (Arrange-Act-Assert) is mandatory for readable tests. Test method names follow **methodName_condition_expectedResult** convention. Each test should test ONE behaviour.

</details>

---

**A3 (Hard).** Implement a complete test class for `LoanService.approveLoan()`:

```java
// Business rule:
// - Loan approved if: credit score >= 700 AND loan amount <= 3 × annual income AND customer not blacklisted
// - Otherwise: LoanRejectedException with reason
class LoanService {
    LoanRepository loanRepo;
    BlacklistService blacklistService;

    LoanResult approveLoan(Customer customer, BigDecimal amount) { /* ... */ }
}
```

<details><summary>Answer</summary>

```java
@ExtendWith(MockitoExtension.class)
class LoanServiceTest {
    @Mock LoanRepository loanRepo;
    @Mock BlacklistService blacklistService;
    @InjectMocks LoanService service;

    private Customer goodCustomer;

    @BeforeEach void setup() {
        goodCustomer = Customer.builder()
            .id(1L).creditScore(750)
            .annualIncome(new BigDecimal("60000"))
            .build();
        when(blacklistService.isBlacklisted(any())).thenReturn(false);
    }

    @Test
    void approveLoan_whenAllCriteriaMet_returnsApproved() {
        var amount = new BigDecimal("50000"); // < 3 × 60000 = 180000
        var result = service.approveLoan(goodCustomer, amount);
        assertThat(result.isApproved()).isTrue();
        verify(loanRepo).save(any(Loan.class));
    }

    @Test
    void approveLoan_whenCreditScoreTooLow_throwsRejection() {
        goodCustomer.setCreditScore(650); // below 700
        assertThatThrownBy(() -> service.approveLoan(goodCustomer, new BigDecimal("10000")))
            .isInstanceOf(LoanRejectedException.class)
            .hasMessageContaining("credit score");
    }

    @Test
    void approveLoan_whenAmountExceedsLimit_throwsRejection() {
        var amount = new BigDecimal("200000"); // > 3 × 60000 = 180000
        assertThatThrownBy(() -> service.approveLoan(goodCustomer, amount))
            .isInstanceOf(LoanRejectedException.class)
            .hasMessageContaining("amount");
    }

    @Test
    void approveLoan_whenCustomerBlacklisted_throwsRejection() {
        when(blacklistService.isBlacklisted(goodCustomer)).thenReturn(true);
        assertThatThrownBy(() -> service.approveLoan(goodCustomer, new BigDecimal("10000")))
            .isInstanceOf(LoanRejectedException.class)
            .hasMessageContaining("blacklisted");
    }

    @ParameterizedTest
    @CsvSource({ "700,true", "699,false", "850,true", "300,false" })
    void approveLoan_creditScoreBoundary(int score, boolean shouldApprove) {
        goodCustomer.setCreditScore(score);
        if (shouldApprove) {
            assertDoesNotThrow(() -> service.approveLoan(goodCustomer, new BigDecimal("10000")));
        } else {
            assertThrows(LoanRejectedException.class,
                () -> service.approveLoan(goodCustomer, new BigDecimal("10000")));
        }
    }
}
```

</details>

---

## Problem Set SDET-PS2 — Playwright E2E Testing

**Prerequisites:** `21_SDET_Playwright_Automation/05_Playwright_Core.md`

---

### Part A: Locate Bugs

**A1 (Medium).** This Playwright test is flaky. Why?

```typescript
test("user can add item to cart", async ({ page }) => {
  await page.goto("http://localhost:3000");
  await page.click("#add-to-cart");
  expect(await page.textContent("#cart-count")).toBe("1");
});
```

<details><summary>Answer</summary>

**Three problems:**

1. **No readiness signal** — `.goto()` resolves at the `load` event, which can come before the framework has attached its handlers. The click itself auto-waits for `#add-to-cart` to exist and be actionable, but it cannot know the button is not yet wired up: click too early and nothing happens. If your app has a "hydrated/ready" marker, assert on it first. Do not reach for `waitForLoadState("networkidle")` — Playwright's typings mark it **DISCOURAGED** ("rely on web assertions to assess readiness instead").

2. **Legacy string-selector calls** — `page.click("#add-to-cart")` and `page.textContent("#cart-count")` are the old API shape; the typings steer you to `page.locator("#add-to-cart").click()` and `.textContent()`. This is a style problem, not the cause of the flake: `page.click()` runs the same actionability checks and auto-wait as `locator.click()` (the string form is also not strict-mode: it silently acts on the first match).

3. **`textContent()` is one-shot** — it doesn't wait for the count to update. If the cart update is async (API call + state update), the count might still be `0` when read. This is the real flake.

**Fixed version:**

```typescript
test("user can add item to cart", async ({ page }) => {
  await page.goto("http://localhost:3000");

  // Locator API: lazy, auto-waiting, strict
  await page.locator("#add-to-cart").click();

  // A web-first assertion retries until it passes or times out
  await expect(page.locator("#cart-count")).toHaveText("1");
});
```

🔴 **Erklärung:** **Never use `page.textContent()` to assert dynamic values.** Use `await expect(locator).toHaveText()` — this has built-in retry logic, waits up to `timeout` ms for the assertion to pass. `page.textContent()` is a one-shot read — it reads whatever is there at THAT moment.

</details>

---

**A2 (Hard).** Write a complete Page Object Model for a Login flow:

```typescript
// pages/LoginPage.ts
import { Page, Locator } from "@playwright/test";

export class LoginPage {
  private readonly emailInput: Locator;
  private readonly passwordInput: Locator;
  private readonly submitButton: Locator;
  private readonly errorMessage: Locator;

  constructor(private page: Page) {
    this.emailInput = page.getByLabel("Email");
    this.passwordInput = page.getByLabel("Password");
    this.submitButton = page.getByRole("button", { name: "Sign In" });
    this.errorMessage = page.getByRole("alert");
  }

  async goto(): Promise<void> {
    await this.page.goto("/login");
    await this.page.waitForLoadState("domcontentloaded");
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async getErrorMessage(): Promise<string | null> {
    return this.errorMessage.textContent();
  }
}

// tests/login.spec.ts
import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { DashboardPage } from "../pages/DashboardPage";

test.describe("Login", () => {
  test("valid credentials → dashboard", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login("alice@example.com", "Password1!");

    const dashboard = new DashboardPage(page);
    await expect(dashboard.heading).toHaveText("Welcome, Alice");
  });

  test("invalid password → error message", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login("alice@example.com", "wrong");

    await expect(page.getByRole("alert")).toContainText("Invalid credentials");
    await expect(page).toHaveURL("/login"); // still on login page
  });

  test("empty email → validation error", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login("", "Password1!");

    await expect(page.getByText("Email is required")).toBeVisible();
  });
});
```

---

### Part B: Design Challenge

**B1.** Design a complete test strategy for the Food Delivery app (P05). What tests at each level?

<details><summary>Answer</summary>

```
Test Pyramid for Food Delivery:

         /\
        /  \
       / E2E \   ← 5% — happy path flows (place order, delivery confirmed)
      /────────\
     / Integration\  ← 15% — OrderService + DB + Kafka
    /──────────────\
   /   Unit Tests   \  ← 80% — OrderAggregate, Payment, Saga steps
  /──────────────────\
```

**Unit Tests (JUnit 5 + Mockito):**

- `Order.deliver("correct-otp")` → status DELIVERED, event fired
- `Order.deliver("wrong-otp")` → IllegalArgumentException
- `Order.cancel()` after PICKED_UP → IllegalStateException
- `OrderSagaOrchestrator` compensation on payment failure
- `Money.add()` with mismatched currencies → IllegalArgumentException

**Integration Tests (Spring + Testcontainers):**

- POST `/api/orders` → Order saved to PostgreSQL → `OrderPlaced` event in Kafka
- `FanoutService` consumes `OrderPlaced` → assigns driver
- Full order lifecycle via REST API (PLACED → ACCEPTED → PREPARING → READY → DELIVERED)

**E2E Tests (Playwright):**

- Customer places order → restaurant accepts → driver delivers → order marked delivered
- Payment failure → order cancelled → inventory released
- OTP verification flow
</details>

---

🔴 **SDET Erklärung Summary:**

| Mistake                        | Why                                                   | Fix                                                          |
| ------------------------------ | ----------------------------------------------------- | ------------------------------------------------------------ |
| Testing implementation details | Brittle — breaks on refactor without behaviour change | Test observable behaviour: return values, events, DB state   |
| One giant test method          | Hard to debug — which assertion failed?               | One behaviour per test, descriptive name                     |
| `Thread.sleep(1000)` for async | Slow + still flaky on CI                              | Use `await expect(locator).toHaveText()` (auto-retry)        |
| All happy-path tests           | Production bugs are edge cases                        | Test boundary conditions: null, empty, max, min, concurrent  |
| Mocking the class under test   | You're testing the mock, not the code                 | Only mock DEPENDENCIES — never mock the class you're testing |

---

[← Back to Semester 4 Guide](../../00_CURRICULUM/SEMESTER_4_GUIDE.md)
