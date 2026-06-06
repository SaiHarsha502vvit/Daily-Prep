# All Testing Types — Complete Guide

**Folder**: [00_Testing_Fundamentals](../../00_Testing_Fundamentals) | **Series**: [23_Mobile_Dev_And_Testing](../..)

> **Purpose of this file**: Most engineers learn testing tools before they learn WHY different test types exist. This is backwards. This file first teaches you the vocabulary — what each test type IS, what problem it solves, when it runs, and who owns it. The next file (`02_Smoke_Sanity_Regression_Deep_Dive.md`) goes deep on the three most confused types. Only once you have the mental model do the tool-specific chapters make sense.

---

## Table of Contents

1. [Why So Many Testing Types Exist](#1-why-so-many-testing-types-exist)
2. [The Testing Pyramid — The Mental Model](#2-the-testing-pyramid--the-mental-model)
3. [Unit Testing](#3-unit-testing)
4. [Integration Testing](#4-integration-testing)
5. [Component / Widget Testing](#5-component--widget-testing)
6. [End-to-End (E2E) Testing](#6-end-to-end-e2e-testing)
7. [Smoke Testing](#7-smoke-testing)
8. [Sanity Testing](#8-sanity-testing)
9. [Regression Testing](#9-regression-testing)
10. [Exploratory Testing](#10-exploratory-testing)
11. [User Acceptance Testing (UAT)](#11-user-acceptance-testing-uat)
12. [Performance Testing](#12-performance-testing)
13. [Security Testing](#13-security-testing)
14. [Accessibility Testing](#14-accessibility-testing)
15. [Visual Regression Testing](#15-visual-regression-testing)
16. [Contract Testing](#16-contract-testing)
17. [Mutation Testing](#17-mutation-testing)
18. [The Master Decision Table](#18-the-master-decision-table)
19. [The SDLC Testing Map — What Runs When](#19-the-sdlc-testing-map--what-runs-when)

---

## 1. Why So Many Testing Types Exist

Every testing type answers a **different question about a different risk**. They were not invented arbitrarily — each one emerged because a certain category of bugs was being missed.

| Question | Test Type That Answers It |
| --- | --- |
| Does this one function work? | Unit Testing |
| Do two components work together? | Integration Testing |
| Does this UI widget render correctly? | Component / Widget Testing |
| Does the full user journey work? | End-to-End (E2E) Testing |
| Did the latest build even start? | Smoke Testing |
| Did this one bug fix actually work? | Sanity Testing |
| Did my new code break old features? | Regression Testing |
| What bugs are we NOT thinking about? | Exploratory Testing |
| Does the app do what the client asked? | User Acceptance Testing (UAT) |
| Can it handle real traffic load? | Performance Testing |
| Is the data / communication safe? | Security Testing |
| Can everyone use it? | Accessibility Testing |
| Does the UI look exactly right? | Visual Regression Testing |
| Does our API match what consumers expect? | Contract Testing |
| Are our tests actually catching bugs? | Mutation Testing |

**The key insight**: No single test type covers all risks. A codebase with 100% unit test coverage can still have:
- Integration failures (components don't fit together)
- Performance problems (each unit is fast but the sum is slow)
- UX failures (all functions work but the user journey is broken)
- Accessibility issues (buttons exist but cannot be found by screen readers)

A professional testing strategy uses multiple types together, each one running at the right moment in the development cycle.

---

## 2. The Testing Pyramid — The Mental Model

The Testing Pyramid is the most important concept in test strategy. It tells you how many tests of each type to write and why.

```
                             ▲
                            /|\
                           / | \
                          /  |  \
                         / Manual\     ← Manual / Exploratory
                        /  Testing\      (fewest, most expensive, humanist)
                       /───────────\
                      /   E2E / UI  \   ← Automated E2E (few, slow, expensive)
                     /    Testing    \
                    /─────────────────\
                   /   Integration     \  ← Integration Tests (medium count)
                  /      Testing        \
                 /───────────────────────\
                /      Unit Testing       \ ← Unit Tests (MOST, fast, cheap)
               /___________________________\
               Foundation: Fast feedback loop

```

### The Pyramid Rules

**Write MANY unit tests** because they:
- Run in milliseconds
- Require no infrastructure (no database, no network, no device)
- Pinpoint exactly which function broke
- Cost almost nothing to maintain when properly isolated

**Write SOME integration tests** because they:
- Take seconds to run
- Require some infrastructure (test database, mock server)
- Catch contract mismatches between components

**Write FEW E2E tests** because they:
- Take minutes to run
- Require full infrastructure (device/emulator, running app, live or mock backend)
- Are fragile — any UI change can break them
- Are expensive to maintain
- But: they are the ONLY tests that prove the whole user journey actually works

### The Anti-Pattern: The Testing Ice Cream Cone

```
WRONG — "Ice Cream Cone" (what bad projects look like):

          /─────────────────────────────────\
         /         Manual Testing            \  ← Too much
        /──────────────────────────────────── \
       /          E2E Automated Tests          \  ← Too many
      /──────────────────────────────────────   \
     /         Integration Tests                 \  ← Some
    /──────────────────────────────────────────   \
   /               Unit Tests                      \  ← Too few
  / ________________________________________________\

Result: Slow CI, fragile tests, developers avoid running tests,
        bugs discovered late, expensive to fix.
```

If your project has 500 E2E tests and 50 unit tests, you have an ice cream cone. The tests take hours to run, developers stop running them, and bugs accumulate.

---

## 3. Unit Testing

### What It Is

Unit testing verifies the **smallest testable piece of code** in complete isolation. A "unit" is typically one function, one method, or one class. Everything outside the unit — databases, network, other classes — is replaced with fakes or mocks.

```
REAL SYSTEM:                        UNIT TEST:
┌──────────────────────────────┐    ┌──────────────────────────────┐
│ PaymentViewModel             │    │ PaymentViewModel             │
│   calls PaymentRepository    │    │   calls MockRepository       │
│   calls AnalyticsService     │    │   calls MockAnalytics        │
│   calls NavigationService    │    │   calls MockNavigation       │
│   reads from Database        │    │   reads from InMemoryDB      │
└──────────────────────────────┘    └──────────────────────────────┘
     Real dependencies                   All replaced with fakes
     = slow, unpredictable               = fast, deterministic
```

### What It Catches

- Logic errors in a single function (wrong calculation, off-by-one)
- Edge cases (empty input, null, zero, maximum value)
- Business rule violations
- State machine transitions (does PENDING → PAID work? What about PAID → PAID?)

### What It Does NOT Catch

- Whether the API response format matches what you expect
- Whether the database schema matches your query
- Whether two components integrate correctly
- Any real-world timing or network issues

### When to Run

- **Locally**: Every time you save a file (watch mode)
- **On commit**: Pre-commit hook (blocks commit if unit tests fail)
- **In CI**: Every push, every PR — must pass before merge

### Who Writes and Owns It

Developers. Unit tests are part of writing the code, not a separate phase.

### Mobile Examples

```kotlin
// Android — Kotlin/JUnit 5
@Test
fun `calculateTax returns correct amount for standard rate`() {
    val result = TaxCalculator.calculate(amount = 100.0, ratePercent = 8.5)
    assertEquals(8.50, result, 0.001)
}

@Test
fun `calculateTax throws for negative amount`() {
    assertThrows<IllegalArgumentException> {
        TaxCalculator.calculate(amount = -50.0, ratePercent = 8.5)
    }
}
```

```swift
// iOS — Swift/XCTest
func test_calculateTax_standardRate_returnsCorrectAmount() {
    let result = TaxCalculator.calculate(amount: 100.0, ratePercent: 8.5)
    XCTAssertEqual(result, 8.50, accuracy: 0.001)
}
```

```dart
// Flutter — Dart/flutter_test
test('calculateTax returns correct amount for standard rate', () {
    final result = TaxCalculator.calculate(amount: 100.0, ratePercent: 8.5);
    expect(result, closeTo(8.50, 0.001));
});
```

### Tools

| Platform | Primary | Mock Library |
|---|---|---|
| Android/Java | JUnit 5 | Mockito, MockK |
| iOS/Swift | XCTest (built-in) | — (use protocols) |
| Flutter/Dart | flutter_test (built-in) | mocktail, mockito |
| Node.js | Jest, Mocha | Jest mocks |
| Python | pytest | unittest.mock |

---

### 🎯 Practice — Unit Testing

**Question**: You have this function:

```kotlin
fun formatCitationId(rawId: String): String {
    return "CIT-${rawId.padStart(3, '0').uppercase()}"
}
```

Write unit tests for: normal input, already padded input, empty string, and a 4+ digit input.

<details><summary>Answer</summary>

```kotlin
@Test fun `formatCitationId pads single digit`() =
    assertEquals("CIT-001", formatCitationId("1"))

@Test fun `formatCitationId pads two digits`() =
    assertEquals("CIT-042", formatCitationId("42"))

@Test fun `formatCitationId already three digits unchanged`() =
    assertEquals("CIT-100", formatCitationId("100"))

@Test fun `formatCitationId four digits not truncated`() =
    assertEquals("CIT-1000", formatCitationId("1000"))
    // padStart(3) only pads if shorter than 3 — does NOT truncate longer strings

@Test fun `formatCitationId uppercases letters`() =
    assertEquals("CIT-ABC", formatCitationId("abc"))

@Test fun `formatCitationId empty string pads to three zeros`() =
    assertEquals("CIT-000", formatCitationId(""))
    // padStart(3, '0') on "" gives "000"
    // Important: empty string is a valid edge case that must be explicitly handled
```

**The "four digits" test is critical**: Many developers assume `padStart` truncates if the string is already longer than the target. It does NOT. This is a common logic misunderstanding caught only by testing the boundary.

</details>

---

## 4. Integration Testing

### What It Is

Integration testing verifies that **two or more components work correctly when connected together**. It does NOT mock everything — it uses real implementations of the components being integrated.

```
UNIT TEST:                          INTEGRATION TEST:
PaymentViewModel                    PaymentViewModel
  + MockRepository        vs          + REAL PaymentRepository
  + MockDatabase                      + REAL Database (test DB)
  → Tests ViewModel logic             → Tests ViewModel + Repository
    in isolation                        + Database together
```

### The Three Levels of Integration Testing

**Level 1: Module Integration** — Two classes in the same module:
```
ViewModel ←→ Repository  (both your code, test them together)
```

**Level 2: Service Integration** — Your code + external service:
```
Repository ←→ Real Database (SQLite in-memory, or test Postgres)
APIClient  ←→ Mock HTTP server (WireMock, MockServer)
```

**Level 3: System Integration** — Multiple services together:
```
Mobile App ←→ Backend API ←→ Database
```

### What It Catches

- Serialization mismatches (your JSON parsing doesn't match what the API sends)
- Database query bugs (the query compiles but returns wrong data)
- Contract violations between components (ViewModel calls a method that Repository doesn't implement correctly)
- Threading bugs (data written on background thread, read on main thread)

### What It Does NOT Catch

- Full user journey bugs
- UI rendering issues
- Performance under real load

### When to Run

- **On commit/push**: Slower than unit tests, so typically run in CI pipeline, not on every save
- **Before merge**: Must pass on every PR
- NOT usually run as a pre-commit hook (too slow)

### Mobile Examples

```kotlin
// Android — Integration test with Room database (no mock)
@RunWith(AndroidJUnit4::class)
class CitationRepositoryIntegrationTest {

    private lateinit var db: AppDatabase
    private lateinit var dao: CitationDao
    private lateinit var repository: CitationRepository

    @Before fun setup() {
        // Use in-memory database — real Room, but data not persisted
        db = Room.inMemoryDatabaseBuilder(
            ApplicationProvider.getApplicationContext(),
            AppDatabase::class.java
        ).build()
        dao = db.citationDao()
        repository = CitationRepository(dao)
    }

    @After fun teardown() { db.close() }

    @Test fun `save and fetch round trip preserves all fields`() = runTest {
        val citation = Citation(id = "CIT-001", amount = 150.0, status = "PENDING")
        repository.save(citation)

        val fetched = repository.getById("CIT-001")

        assertNotNull(fetched)
        assertEquals(150.0, fetched!!.amount, 0.001)
        assertEquals("PENDING", fetched.status)
    }
}
```

### Tools

| Need | Tool |
|---|---|
| Mock HTTP server | WireMock (Java), MockServer, nock (Node) |
| In-memory database (Android) | Room `inMemoryDatabaseBuilder` |
| Test database (iOS) | Core Data in-memory store |
| Contract testing | Pact |

---

### 🎯 Practice — Integration Testing

**Scenario**: Your `CitationRepository` fetches from an API. In a unit test you mock the API. In an integration test, what do you use instead and why?

<details><summary>Answer</summary>

In an integration test you replace the real API with a **local mock HTTP server** (WireMock, MockWebServer, or similar). You do NOT use a mock object (Mockito) because that would just be a unit test again.

**Why a mock server instead of the real API?**
- The real API is out of your control — it can go down, change responses, be slow
- You want deterministic responses ("for this URL, always return this JSON")
- You want to test error paths (401, 500) without actually causing server errors
- You want tests to run in CI without network access to production systems

```kotlin
// Android — OkHttp MockWebServer (integration test)
class CitationAPIClientIntegrationTest {

    val server = MockWebServer()

    @Before fun setup() { server.start() }
    @After  fun teardown() { server.shutdown() }

    @Test fun `fetchCitations parses valid JSON response correctly`() = runTest {
        // Arrange: server returns known JSON
        server.enqueue(MockResponse()
            .setBody("""[{"id":"CIT-001","amount":150.0,"status":"PENDING"}]""")
            .setResponseCode(200)
            .setHeader("Content-Type", "application/json"))

        val client = CitationAPIClient(baseUrl = server.url("/").toString())

        // Act: real HTTP call to the local mock server
        val citations = client.fetchCitations()

        // Assert: parsing was correct
        assertEquals(1, citations.size)
        assertEquals("CIT-001", citations[0].id)
        assertEquals(150.0, citations[0].amount, 0.001)
    }

    @Test fun `fetchCitations throws UnauthorizedException on 401`() = runTest {
        server.enqueue(MockResponse().setResponseCode(401))
        val client = CitationAPIClient(baseUrl = server.url("/").toString())

        assertThrows<UnauthorizedException> { client.fetchCitations() }
    }
}
```

This is an integration test because:
- Real HTTP is happening (OkHttp is making actual TCP connections)
- Real JSON deserialization is happening
- Real error handling is happening
- Only the remote server is replaced — everything else is real

</details>

---

## 5. Component / Widget Testing

### What It Is

Component testing verifies a **UI component in isolation** — without a real device or browser. The component is rendered in a test environment and you assert on its output.

This is Flutter's "widget tests" and React's "component tests". Android and iOS don't have a clean equivalent because UIKit/Views were designed to run on a device.

```
COMPONENT TEST:
┌──────────────────────────────────────┐
│  Test renders CitationTile widget    │
│  + passes Citation(id="CIT-001",     │
│       amount=150.0, status="PENDING")│
│                                      │
│  Assert:                             │
│  - "CIT-001" text is visible         │
│  - "$150.00" text is visible         │
│  - Orange color for PENDING status   │
│  - No crash on null amount           │
└──────────────────────────────────────┘
    No real device. No real network.
    Runs in ~100ms on developer machine.
```

### When to Run

- Same as unit tests: on commit, every PR, in CI
- Faster than E2E tests, much more UI-specific than unit tests

### Flutter Widget Test Example

```dart
testWidgets('CitationTile shows correct status color for PENDING', (tester) async {
    await tester.pumpWidget(MaterialApp(
        home: CitationTile(
            citation: Citation(id: 'CIT-001', amount: 150.0, status: 'PENDING'),
        ),
    ));

    // Find the status badge widget
    final badge = find.byKey(const Key('statusBadge'));
    expect(badge, findsOneWidget);

    // Verify the color (PENDING = orange)
    final container = tester.widget<Container>(find.descendant(
        of: badge, matching: find.byType(Container)));
    expect((container.decoration as BoxDecoration).color, Colors.orange);
});
```

---

## 6. End-to-End (E2E) Testing

### What It Is

E2E testing simulates a **complete user journey** from the first screen to the last, using a real app on a real device (or emulator/simulator), hitting a real (or realistic) backend.

It answers: "If I am the user, does the full flow actually work?"

```
E2E TEST FLOW — Payment Journey:
┌─────────┐    ┌─────────┐    ┌────────────┐    ┌──────────┐    ┌─────────┐
│  Login  │ →  │  Home   │ →  │  Citation  │ →  │  Payment │ →  │ Success │
│ Screen  │    │  Screen │    │  Detail    │    │  Modal   │    │ Screen  │
└─────────┘    └─────────┘    └────────────┘    └──────────┘    └─────────┘
     ↑ Real app,  ↑ Real navigation,  ↑ Real API calls,  ↑ Real assertions
```

### What It Catches

- Broken navigation flows
- API/frontend contract mismatches
- Data not persisting correctly end-to-end
- Race conditions in the UI
- Bugs that only appear when the full system runs together

### What It Does NOT Catch Well

- Logic bugs in individual functions (use unit tests)
- Performance under load (use performance tests)
- Visual pixel-level issues (use visual regression tests)

### When to Run

- **NOT on every commit** — too slow (minutes per test)
- **On every PR** — a subset of critical path tests
- **Nightly CI** — the full E2E suite
- **Before release** — must pass before going to production/TestFlight/Play Store

### E2E vs Integration — The Confusion

This is one of the most commonly confused pairs:

```
INTEGRATION TEST:                       E2E TEST:
Scope: 2-3 components                   Scope: Entire application
Backend: Mock or test DB                Backend: Real or realistic staging
Device: Not needed                      Device: Real or emulator
Data: Controlled test data              Data: Full realistic data set
Speed: Seconds                          Speed: Minutes
Runs: Every commit                      Runs: Every PR + nightly
```

---

### 🎯 Practice — E2E Testing

**Question**: List 5 scenarios for a citation payment app where E2E tests add value that unit and integration tests alone CANNOT provide.

<details><summary>Answer</summary>

1. **Navigation state after payment**: Unit tests verify the payment function works. Integration tests verify the API call succeeds. But only an E2E test can verify that after payment, the app navigates back to the citation list AND the citation shows "PAID" status — because this involves the backend updating the record AND the frontend re-fetching it AND the UI re-rendering it.

2. **Deep link handling**: A push notification carries `citationapp://citation/CIT-001`. Tapping it must open the app (if backgrounded) or launch it (if closed), authenticate if needed, and navigate directly to the correct citation detail screen. This is impossible to test with unit or integration tests — it requires the OS, the app, and the navigation stack to all work together.

3. **Biometric authentication flow**: Face ID prompt appears → user authenticates → app unlocks → lands on the correct screen. Each piece can be unit tested, but the OS-level prompt and the resulting navigation state require a full device test.

4. **Session expiry handling**: User opens the app, the JWT token expires mid-session, they tap something that triggers an API call, they get 401, the app shows a "Session expired" screen, they re-login, they land back on the same screen they were on. This multi-step recovery flow needs E2E.

5. **Offline → Online sync**: App loads citations, network drops (airplane mode), user views cached data, network comes back, pull-to-refresh occurs, new server data syncs. Each layer (cache, network, sync, UI) can be tested individually, but their interaction under real network conditions requires E2E.

</details>

---

## 7. Smoke Testing

### What It Is

Smoke testing (also called **Build Verification Testing**) verifies that the **most critical functions of a new build work at the most basic level** before investing time in deeper testing.

The name comes from hardware engineering: "Does it smoke when we turn it on?" — meaning, is this build so broken that testing it further is a waste of time?

### The Core Question

> "Is this build stable enough to test?"

```
NEW BUILD ARRIVES
       │
       ▼
┌─────────────────────────────────────────────┐
│  SMOKE TEST SUITE (10-20 tests, ~5 minutes) │
│                                             │
│  ✓ App launches without crashing            │
│  ✓ Login screen renders                     │
│  ✓ Login with valid credentials succeeds    │
│  ✓ Home screen loads                        │
│  ✓ Core list (citations) loads              │
│  ✓ Detail screen opens                      │
│  ✓ App does not crash on basic navigation   │
│  ✓ Logout works                             │
└─────────────────────────────────────────────┘
       │
       │ PASS?                    FAIL?
       ▼                          ▼
PROCEED TO FULL TESTING     STOP. REJECT BUILD.
(regression, E2E, UAT)      Notify dev team.
                            No further testing
                            — the build is broken.
```

### What Smoke Tests Are NOT

- Not thorough. They do not test error paths, edge cases, or complex flows.
- Not regression tests. They don't verify every old feature still works.
- Not UAT. They don't validate business requirements.

### Example Smoke Test Suite for a Mobile App

```java
// Appium Java — Smoke Test Suite
public class AppSmokeTest extends BaseTest {

    @Test
    @Order(1)
    public void appLaunchesWithoutCrash() {
        // If the app is running at all, this passes
        assertNotNull(driver.getSessionId());
    }

    @Test
    @Order(2)
    public void loginScreenRendersCorrectly() {
        assertTrue(driver.findElement(AppiumBy.accessibilityId("usernameField")).isDisplayed());
        assertTrue(driver.findElement(AppiumBy.accessibilityId("passwordField")).isDisplayed());
        assertTrue(driver.findElement(AppiumBy.accessibilityId("loginButton")).isDisplayed());
    }

    @Test
    @Order(3)
    public void loginWithValidCredentialsSucceeds() {
        login("smoke_test@user.com", "SmokePass123!");
        assertTrue(
            new WebDriverWait(driver, Duration.ofSeconds(15))
                .until(ExpectedConditions.presenceOfElementLocated(
                    AppiumBy.accessibilityId("homeScreen")))
                .isDisplayed()
        );
    }

    @Test
    @Order(4)
    public void citationListLoads() {
        // Already logged in from previous test (or use @BeforeEach to login)
        WebElement list = driver.findElement(AppiumBy.accessibilityId("citationList"));
        assertTrue(list.isDisplayed());
    }

    @Test
    @Order(5)
    public void logoutWorks() {
        driver.findElement(AppiumBy.accessibilityId("profileTab")).click();
        driver.findElement(AppiumBy.accessibilityId("logoutButton")).click();
        assertTrue(driver.findElement(AppiumBy.accessibilityId("loginButton")).isDisplayed());
    }
}
```

### When to Run

- **On every build** — immediately after a new build is generated
- **In CI/CD** — triggered automatically after the build step, before regression tests
- **Gate**: If smoke fails → block the pipeline → notify the developer who caused the build break → do NOT proceed to regression

### Who Runs It

Automated (CI pipeline). No manual involvement needed.

---

## 8. Sanity Testing

### What It Is

Sanity testing verifies a **specific narrow area of functionality after a specific bug fix or small change**. It is fast and focused — not a full regression run.

The name comes from "a sanity check" — a quick check to confirm you're not crazy, that this one specific thing works as expected.

### Smoke vs Sanity — The Key Difference

```
SMOKE TEST                          SANITY TEST
──────────────────────────────      ──────────────────────────────
Runs on: EVERY new build            Runs on: After a SPECIFIC fix
Scope: Entire app, broad            Scope: One feature/fix, narrow
Purpose: Is the build alive?        Purpose: Did THIS fix work?
Depth: Shallow                      Depth: Deep (for that one area)
Who triggers it: CI automatically   Who triggers it: QA after fix
Duration: 5-15 minutes              Duration: 10-30 minutes
Result: Go/No-Go for build          Result: Fix verified / not verified
```

### Example

**Bug report**: "When a user pays a citation with amount > $1,000, the app shows $0.00 on the success screen."

**Fix**: Developer fixes the amount formatting for values > 999.

**Sanity test** (not the full regression suite):
```
1. Pay a citation with amount = $1,000.00 → confirm success screen shows "$1,000.00" ✓
2. Pay a citation with amount = $1,500.00 → confirm success screen shows "$1,500.00" ✓
3. Pay a citation with amount = $999.99   → confirm still works (was not broken) ✓
4. Pay a citation with amount = $0.01     → confirm still works (smallest valid) ✓
```

Only 4 tests. Not the entire payment regression suite (which might be 50 tests). This is intentional — the goal is to verify THIS fix quickly, not to re-verify everything.

### When to Run

- After a developer submits a bug fix
- QA receives a new build tagged "Fix: CIT-4521 — amount formatting"
- Before running the full regression suite (to confirm the fix is even present)

---

## 9. Regression Testing

### What It Is

Regression testing verifies that **previously working functionality still works after new code changes**. It is run to ensure that fixing one bug (or adding one feature) did not accidentally break something else.

**The word "regression"** = a return to a worse state. We are checking that the software has not "regressed" — gone backwards.

### Why It Exists

```
Version 1.0:                Version 1.1 (new feature added):
  ✓ Login works               ✓ Login works
  ✓ Payment works             ✓ Payment works
  ✓ Logout works              ✗ Logout broken ← REGRESSION
                              ✓ New feature works
```

When developers add the new feature (Version 1.1), they accidentally introduced a bug in the logout flow. Without regression testing, this goes undetected until a user reports it.

### Types of Regression Tests

**Full Regression**: Run the entire test suite. Every test. Takes hours. Run before major releases, not on every commit.

**Partial Regression**: Run only the tests related to the changed area. A developer changes the payment module → run all payment-related tests + smoke tests. Faster, but requires good test tagging.

**Risk-Based Regression**: Prioritize tests based on which areas have the highest risk of being affected by the change. Requires experience and good test documentation.

### How to Organize for Regression

```
All tests tagged by area:

@Tag("auth")      Login, Logout, Session refresh, Biometric
@Tag("payment")   Pay citation, Payment history, Receipt
@Tag("profile")   Edit profile, Change password, Preferences
@Tag("citation")  View list, View detail, Filter, Sort
@Tag("smoke")     Core path — runs always
@Tag("critical")  High-priority user journeys — runs on every PR
@Tag("full")      Everything — runs nightly
```

```java
// JUnit 5 — running only payment regression
// In CI: mvn test -Dgroups="payment,smoke"

@Tag("payment")
@Tag("regression")
public class PaymentRegressionTest {
    @Test public void payValidAmount() { /* ... */ }
    @Test public void payMaxAmount() { /* ... */ }
    @Test public void payWithExpiredCard() { /* ... */ }
    // ...
}
```

### When to Run

| Trigger | Test Type Run |
|---|---|
| Every commit to feature branch | Unit + Integration + Smoke |
| PR to `develop` or `main` | + Critical regression tests |
| After merge to `develop` | + Full regression (or nightly) |
| Before release candidate | Full regression |
| After a hotfix | Sanity + Smoke + affected-area regression |

---

### 🎯 Practice — Smoke vs Sanity vs Regression

**Scenario**: A mobile app gets a new build `v2.4.1`. This build contains: (1) a new "Dark Mode" feature, and (2) a fix for bug "CIT-4521: Payment success screen shows $0 for amounts over $999".

What testing sequence do you run and in what order?

<details><summary>Answer</summary>

**Step 1: Smoke Test** (automated, ~5-10 minutes)
Run the smoke suite against `v2.4.1`. Verify: app launches, login works, home screen loads, basic navigation works.

**If smoke FAILS**: Reject the build. Send back to developer. Stop here. Running sanity or regression against a broken build wastes everyone's time.

**If smoke PASSES**: Continue.

---

**Step 2: Sanity Test on the Bug Fix** (~15 minutes, QA-run)
Verify that CIT-4521 is actually fixed:
- Pay citation for $1,000.00 → success screen shows "$1,000.00" ✓
- Pay citation for $5,000.00 → success screen shows "$5,000.00" ✓
- Pay citation for $999.99 → success screen shows "$999.99" (not broken) ✓
- Pay citation for $0.01 → still works ✓

**If sanity FAILS**: The fix was not correctly included or caused a new problem. Reject and return to developer with specific failure details.

**If sanity PASSES**: Continue.

---

**Step 3: Regression Test on Payment Area** (~30-60 minutes, automated)
Since this build touched the payment module (bug fix), run ALL payment regression tests to ensure nothing else in payment broke:
```bash
mvn test -Dgroups="payment,regression"
```

---

**Step 4: Test the New Dark Mode Feature** (exploratory + scripted)
Test the new feature against its acceptance criteria. This is new feature testing, not regression.

---

**Step 5: Full Regression** (if this is a release candidate — nightly CI or pre-release)
Run the complete suite including auth, citation, profile, and other modules.

---

**The order matters**: Smoke → Sanity → Partial Regression → Feature Test → Full Regression.
Running full regression before smoke is wasteful. Running sanity before smoke is wasteful.

</details>

---

## 10. Exploratory Testing

### What It Is

Exploratory testing is **simultaneous learning, designing, and test execution**. There is no predefined test script — the tester explores the app, uses their knowledge and intuition, and discovers bugs that scripted tests never would.

It is NOT random clicking. It is skilled, structured investigation.

```
SCRIPTED TESTING:                   EXPLORATORY TESTING:
──────────────────────              ──────────────────────────────
Test plan written first             Tester learns as they go
Steps are fixed                     Steps adapt based on what is found
Tests what we expect to happen      Tests what we DON'T expect
Finds known-category bugs           Finds unknown-category bugs
Repeatable by anyone                Depends on tester's skill/knowledge
```

### Why It Exists — Scripted Tests Miss Things

Scripted tests only test what we thought to test when we wrote the script. Exploratory testing finds bugs in scenarios we never thought of:

- "What if I rotate the screen mid-payment?"
- "What if I background the app during biometric authentication?"
- "What if the text field has Arabic characters in an English locale app?"
- "What if I force-quit the app right after tapping Pay but before the API responds?"

### How to Do It Effectively — Charter-Based Exploration

A **charter** defines the scope and focus of an exploratory session without prescribing the steps:

```
CHARTER: Payment Flow Under Unusual Conditions
Time box: 60 minutes
App area: Payment screens
Starting point: Login as test user, navigate to any citation
Risk: Payment state corruption on app interruption

FOCUS AREAS TO EXPLORE:
- What happens if you rotate mid-payment?
- What happens if you receive a phone call during payment?
- What happens if airplane mode is toggled during payment?
- What happens if you force-quit and reopen during payment?
- What if the amount has many decimal places?
- What if you submit the same payment twice very fast?
```

### What It Finds That Automation Misses

| Automation finds | Exploratory finds |
|---|---|
| Known regression bugs | Unknown interaction bugs |
| Data-driven edge cases | Hardware/OS interaction bugs |
| Navigation flow breaks | UI inconsistencies across states |
| API error responses | Usability and UX problems |

### When to Run

- Before each release cycle, after regression automation passes
- After any major new feature ships
- When entering a new platform or OS version
- When a domain expert joins and needs to learn the product

---

## 11. User Acceptance Testing (UAT)

### What It Is

UAT is testing performed **by the client, product owner, or end users** to verify that the software meets the business requirements. It is the last gate before a feature or release goes to production.

```
Who tests?      → Business stakeholders, product owners, real users
What they test? → Does it meet the business requirement?
What they use?  → The staging or pre-production environment
When?           → After QA signs off on technical testing
What happens?   → Go/No-Go decision for production deployment
```

### UAT vs QA Testing

```
QA Testing:                         UAT:
"Does the code work as designed?"   "Does it work as we NEED it to work?"
Technical correctness               Business value correctness
QA team runs it                     Business/product team runs it
Catches bugs                        Catches requirement misunderstandings
Example: "Payment calculates tax    Example: "We agreed invoices over
correctly per the formula"          $500 need manager approval — where is that?"
```

### In Mobile Development

For mobile apps, UAT typically means:
1. Distributing an internal build to stakeholders via **TestFlight** (iOS) or **Firebase App Distribution** (Android/iOS)
2. Providing a test data sheet with accounts and scenarios to test
3. Stakeholders use the app manually and report issues via a shared tracker (Jira, Linear)

---

## 12. Performance Testing

### What It Is

Performance testing verifies that the application behaves acceptably **under expected and unexpected load conditions**. It is NOT just "is it fast?" — it covers stability, capacity, and behavior under stress.

### The Sub-Types of Performance Testing

```
LOAD TESTING:
Tests behavior under EXPECTED load.
"We have 10,000 daily users. Does the app and API handle 1,000 concurrent requests?"

STRESS TESTING:
Tests behavior BEYOND normal capacity until it breaks.
"At what point does the system degrade or fail?"

SPIKE TESTING:
Tests behavior when load increases SUDDENLY.
"A push notification goes to 100,000 users simultaneously. What happens?"

SOAK TESTING (Endurance):
Tests behavior under normal load for a LONG time.
"Does the app leak memory over 8 hours of continuous use?"

SCALABILITY TESTING:
Tests whether adding resources (servers) improves performance linearly.
"If we add 2x servers, do we get 2x capacity?"
```

### Mobile-Specific Performance Testing

```
Backend API performance:            Mobile App performance:
- Response time under load          - Memory usage over time (leaks)
- Throughput (requests/second)      - Battery consumption
- CPU on server                     - Frame rate (fps) — 60fps = smooth
                                    - App start time (cold and warm)
                                    - Network payload size
```

```bash
# k6 — load testing the payment API
import http from 'k6/http';
import { check } from 'k6';

export const options = {
    stages: [
        { duration: '30s', target: 100 },   // Ramp to 100 users over 30s
        { duration: '60s', target: 100 },   // Hold 100 users for 60s
        { duration: '30s', target: 0 },     // Ramp down
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'],   // 95% of requests < 500ms
        http_req_failed: ['rate<0.01'],      // Less than 1% error rate
    },
};

export default function () {
    const res = http.post('https://api.myapp.com/citations/pay', {
        citationId: 'CIT-001',
        amount: 150.0,
    }, { headers: { Authorization: 'Bearer ...' }});

    check(res, {
        'status is 200': (r) => r.status === 200,
        'response time < 500ms': (r) => r.timings.duration < 500,
    });
}
```

### When to Run

- **Load tests**: Weekly in CI on a dedicated staging environment
- **Stress tests**: Before major releases and when capacity is being planned
- **Soak tests**: Monthly (they run for hours)
- **Spike tests**: Before any marketing campaigns or expected traffic spikes

---

## 13. Security Testing

### What It Is

Security testing verifies that the application **protects data, resists attacks, and handles authentication and authorization correctly**.

### Types of Security Testing

**SAST (Static Application Security Testing)**
- Analyzes source code without running it
- Tools: SonarQube, Checkmarx, CodeQL
- When: On every commit (automated)

**DAST (Dynamic Application Security Testing)**
- Tests the running application by simulating attacks
- Tools: OWASP ZAP, Burp Suite
- When: In CI against staging

**Penetration Testing (Pen Test)**
- Humans attempt to compromise the system using real attack techniques
- Who: Security specialists (internal or contracted)
- When: Before major releases, annually

### OWASP Mobile Top 10 — What Mobile QA Should Know

The OWASP Mobile Top 10 is the standard checklist for mobile security:

| # | Risk | What to test |
|---|---|---|
| M1 | Improper Platform Usage | Are permissions over-granted? |
| M2 | Insecure Data Storage | Is sensitive data in plaintext on device? |
| M3 | Insecure Communication | Is HTTPS enforced? Is certificate pinning used? |
| M4 | Insecure Authentication | Can authentication be bypassed? |
| M5 | Insufficient Cryptography | Is weak encryption used? |
| M6 | Insecure Authorization | Can user A access user B's data? |
| M7 | Client Code Quality | SQL injection in local queries? |
| M8 | Code Tampering | Can the app be modified and re-run? |
| M9 | Reverse Engineering | Are API keys hardcoded? |
| M10 | Extraneous Functionality | Are debug endpoints still active? |

---

## 14. Accessibility Testing

### What It Is

Accessibility testing verifies that the application **can be used by people with disabilities** — visual, motor, cognitive, and auditory.

It is not just a nice-to-have. In many countries, digital accessibility is a legal requirement (ADA in the US, WCAG 2.1 in the EU).

### What to Test

```
VISUAL:
  - Screen reader support (TalkBack on Android, VoiceOver on iOS)
  - Sufficient color contrast ratio (4.5:1 minimum for text)
  - Does not rely on color alone to convey meaning
  - Text scalable up to 200% without breaking layout

MOTOR:
  - All interactive elements reachable by keyboard / switch control
  - Touch targets at least 44×44 points (Apple) or 48×48dp (Android)
  - No actions that require simultaneous touch (pinch-only zoom is accessible,
    but single-tap alternative should exist for complex gestures)

COGNITIVE:
  - Clear error messages that explain how to fix the problem
  - No time limits on critical actions (or user can extend)
  - Consistent navigation structure

AUDITORY:
  - Video content has captions
  - Audio alerts have visual equivalents
```

### Mobile Accessibility Tools

```bash
# Android — TalkBack (built-in screen reader)
# Enable: Settings → Accessibility → TalkBack
# Test: Navigate the entire payment flow using only TalkBack

# iOS — VoiceOver (built-in screen reader)
# Enable: Settings → Accessibility → VoiceOver
# Test: Navigate the entire payment flow using only VoiceOver

# Automated tools:
# Android: Accessibility Scanner (Google Play)
# iOS: Xcode Accessibility Inspector
# Cross-platform: axe-core (for web/Playwright)
```

---

## 15. Visual Regression Testing

### What It Is

Visual regression testing captures **screenshots of UI components or full screens** and compares them pixel-by-pixel (or using AI-based comparison) against a baseline. If pixels change, the test fails.

```
BASELINE (v1.0):                CURRENT BUILD (v1.1):
[Screenshot of Home Screen]     [Screenshot of Home Screen]
                          ↓  COMPARE  ↓
                  DIFF IMAGE shows changed pixels
                  (e.g., button moved 2px, font changed)
```

### When It Catches Bugs That Other Tests Miss

A developer changes a shared stylesheet. All unit tests pass — functions still work. All E2E tests pass — navigation still works. But 15 screens now have the wrong font size. Only visual regression tests catch this.

### Tools

| Tool | Best For |
|---|---|
| Percy (BrowserStack) | Web + mobile visual testing |
| Applitools | AI-powered cross-platform |
| Playwright screenshot assertions | Web |
| Flutter golden tests | Flutter widget visual testing |

```dart
// Flutter — Golden Test (visual regression for a widget)
testWidgets('CitationTile matches golden file', (tester) async {
    await tester.pumpWidget(MaterialApp(
        home: CitationTile(citation: Citation(id: 'CIT-001',
                                              amount: 150.0,
                                              status: 'PENDING')),
    ));

    // First run: creates the golden file (the baseline image)
    // Subsequent runs: compares against it
    await expectLater(
        find.byType(CitationTile),
        matchesGoldenFile('goldens/citation_tile_pending.png'),
    );
});
```

---

## 16. Contract Testing

### What It Is

Contract testing verifies that a **consumer (mobile app) and a provider (backend API)** agree on the format and behavior of their communication — without having to run both systems together simultaneously.

```
WITHOUT CONTRACT TESTING:
┌──────────┐   "Give me citations"   ┌──────────┐
│ Mobile   │ ─────────────────────→  │ Backend  │
│ App      │ ←─────────────────────  │ API      │
│          │   Returns JSON          │          │
└──────────┘                         └──────────┘
   Backend team changes API format → Mobile app crashes at runtime.
   This is discovered in QA or worse, in production.

WITH CONTRACT TESTING (Pact):
┌──────────┐  1. Mobile records what it expects (the "contract")
│ Mobile   │  2. Contract is shared with backend team
│ App      │  3. Backend runs contract verification in CI
│          │  4. If backend changes break the contract → CI fails immediately
└──────────┘  5. No integration environment needed to catch this
```

### Tools

- **Pact** — the most widely used contract testing framework
- **Spring Cloud Contract** — Java/Spring ecosystem

### When to Use

Essential when:
- Mobile team and backend team work independently
- Microservices with separate deployment cycles
- API versioning is in use

---

## 17. Mutation Testing

### What It Is

Mutation testing **tests the quality of your tests**. It automatically introduces bugs ("mutations") into your source code and then runs your test suite. If your tests catch the mutation (test fails when bug is introduced), the mutation is "killed". If your tests miss the mutation (test still passes despite the bug), the mutation "survived" — meaning your tests have a blind spot.

```
MUTATION EXAMPLE:
Original code:    if (amount > 0)           ← correct
Mutant version:   if (amount >= 0)          ← bug introduced

If your unit test for amount = 0 passes with this mutation:
→ Your tests don't cover the case where amount = 0 should be REJECTED
→ You need to add: test("zero amount is rejected")
```

### When to Use

- When you need high confidence in test quality for critical modules (payment, auth)
- NOT for the entire codebase — too computationally expensive

### Tools

- **PIT (Pitest)** — Java
- **Stryker** — JavaScript/TypeScript
- **mutmut** — Python

---

## 18. The Master Decision Table

```
Testing Type        | When to run                  | Who runs it    | Blocking?
────────────────────┼──────────────────────────────┼────────────────┼──────────
Unit Tests          | Every commit (pre-commit)    | CI automated   | YES
Integration Tests   | Every PR (CI)                | CI automated   | YES
Widget/Component    | Every PR (CI)                | CI automated   | YES
Smoke Tests         | Every new build              | CI automated   | YES
Sanity Tests        | After a specific bug fix     | QA (manual/auto)| YES (for the fix)
Regression Tests    | On PRs + nightly             | CI automated   | YES (critical path)
Exploratory Tests   | Pre-release, new features    | QA engineers   | Blocks release sign-off
UAT                 | Pre-production               | Stakeholders   | Blocks go-live
E2E Tests           | Every PR (critical) + nightly| CI automated   | YES
Performance Tests   | Pre-release, weekly          | Performance eng | Blocks capacity sign-off
Security Tests      | Every PR (SAST), pre-release | SecEng/CI      | YES (critical findings)
Visual Regression   | Every PR (critical screens)  | CI automated   | YES (approved changes)
Contract Tests      | Every PR on API changes      | CI automated   | YES
Accessibility Tests | Pre-release                  | QA + AT users  | Blocks release sign-off
Mutation Tests      | Periodic (monthly)           | CI scheduled   | NO (advisory)
```

---

## 19. The SDLC Testing Map — What Runs When

This shows WHERE in the Software Development Lifecycle each test type runs:

```
DEVELOPMENT PHASE:
  Developer writes code
  ├── Pre-commit:  Unit tests (runs locally, blocks commit if red)
  └── Push:        Unit + Integration + Widget tests (fast CI check)

PULL REQUEST (PR) PHASE:
  Code review opened
  ├── CI pipeline: Unit + Integration + Widget + Smoke + Critical E2E
  ├── Contract tests (if API changes)
  ├── SAST security scan
  └── Visual regression on changed screens
  Blocks merge if any of above fails

MERGE TO DEVELOP:
  Full regression suite runs (nightly or post-merge)
  Performance tests run on staging
  All results reported to team

QA PHASE:
  QA team receives new build
  ├── Smoke test: Is the build testable?
  ├── Sanity test: Did the specific fixes work?
  ├── Regression: Did anything break?
  └── Exploratory: What did we miss?

STAGING / PRE-PRODUCTION:
  UAT: Business stakeholders validate
  Performance: Load + spike tests
  Security: DAST + pen test
  Accessibility: Screen reader testing

PRODUCTION RELEASE:
  Smoke test on production (just launched — verify it works)
  Monitor: Error rates, crash rates, response times
  If any spike → rollback

POST-RELEASE:
  Exploratory testing on real production data patterns
  Mutation testing on critical modules (monthly)
  Accessibility audit (quarterly)
```

---

**Next file**: [02_Smoke_Sanity_Regression_Deep_Dive.md](./02_Smoke_Sanity_Regression_Deep_Dive.md) — goes deeper into the three most confused test types with real CI/CD pipeline integration examples.

**Back to series**: [23_Mobile_Dev_And_Testing](../..)
