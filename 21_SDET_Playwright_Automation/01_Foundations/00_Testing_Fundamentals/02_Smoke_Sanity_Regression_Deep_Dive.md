# Smoke, Sanity, and Regression Testing — Deep Dive

**Folder**: [00_Testing_Fundamentals](..) | **Previous**: [01_All_Testing_Types_Complete_Guide.md](./01_All_Testing_Types_Complete_Guide.md)

> **Purpose of this file**: These three test types are the most confused in the industry. Many QA engineers use the words interchangeably. They are NOT the same thing. Understanding the differences — precisely — is what separates a junior QA from a mid-level QA. This file gives you exact definitions, the real distinctions, how each fits into a CI/CD pipeline, what to write for each, and how to answer interview questions about them.

---

## Table of Contents

1. [The Core Problem — Why These Three Are Confused](#1-the-core-problem--why-these-three-are-confused)
2. [The Single Deciding Question](#2-the-single-deciding-question)
3. [Smoke Testing — Full Technical Deep Dive](#3-smoke-testing--full-technical-deep-dive)
4. [Sanity Testing — Full Technical Deep Dive](#4-sanity-testing--full-technical-deep-dive)
5. [Regression Testing — Full Technical Deep Dive](#5-regression-testing--full-technical-deep-dive)
6. [The Relationship Between All Three](#6-the-relationship-between-all-three)
7. [Designing a Smoke Test Suite — Step by Step](#7-designing-a-smoke-test-suite--step-by-step)
8. [Designing a Regression Test Suite — Step by Step](#8-designing-a-regression-test-suite--step-by-step)
9. [CI/CD Pipeline Integration — Full Pipeline Design](#9-cicd-pipeline-integration--full-pipeline-design)
10. [Real Scenarios With Decisions](#10-real-scenarios-with-decisions)
11. [Interview Q&A — Exact Answers](#11-interview-qa--exact-answers)

---

## 1. The Core Problem — Why These Three Are Confused

The confusion comes from the fact that all three types:

- Run against a deployed application
- Can use the same automation tools (Appium, Selenium, XCUITest)
- Involve checking "does things work?"
- Produce pass/fail results that gate deployments

But they answer **completely different questions** at **completely different moments** in the release process.

Here is the confusion map:

```
COMMON CONFUSION:
"We ran smoke tests on the regression suite"  ← meaningless hybrid
"We sanity tested the whole app"              ← sanity doesn't test the whole app
"We regressed the smoke tests"                ← redundant — smoke IS a subset of regression

WHY IT MATTERS:
If you call everything "regression testing", you lose the ability to:
- Know quickly if a build is even worth testing
- Verify a specific fix without running everything
- Prioritize test execution time intelligently
```

---

## 2. The Single Deciding Question

Ask yourself ONE question to instantly classify which test type you need:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   "Am I checking if the BUILD is stable?"                       │
│                                ↓ YES → SMOKE TEST               │
│                                ↓ NO  ↓                          │
│                                                                 │
│   "Am I checking if a SPECIFIC FIX/CHANGE worked?"              │
│                                ↓ YES → SANITY TEST              │
│                                ↓ NO  ↓                          │
│                                                                 │
│   "Am I checking that EXISTING FEATURES still work?"            │
│                                ↓ YES → REGRESSION TEST          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

Memorize this. Use it in interviews. Use it on the job.

---

## 3. Smoke Testing — Full Technical Deep Dive

### The Exact Mental Model

Smoke testing is a **viability check on the build**. Before you invest hours of testing time, you verify that the build is not so broken that it cannot be tested at all.

Think of it like checking if a car has fuel before taking it to a race track. You don't test the engine performance — you just check if it can start.

```
BUILD ARRIVES FROM CI
         │
         ▼
    Is the app installable?
         │ YES
         ▼
    Does it launch without crashing?
         │ YES
         ▼
    Does the core navigation work?
         │ YES
         ▼
    Does the primary user journey start?
         │ YES
         ▼
  BUILD IS STABLE — PROCEED TO FULL TESTING
```

### What Goes in a Smoke Suite

The rule: **Include the top N critical paths where if they break, ALL testing stops**. Nothing else.

```
INCLUDE:                                    EXCLUDE:
──────────────────────────────────────────  ─────────────────────────────────────────
App launches (crash check)                  Error message text (too specific)
Splash screen → Login screen loads          Edge case inputs
Login with valid credentials works          Empty state handling
Primary data loads (citation list shows)    Second-level navigation
Basic navigation (go to detail screen)      Profile settings
Logout works                                Filters, sort, search
                                            Payment (too specific — in regression)
                                            Notifications
                                            Any optional feature
```

**The 80/20 test**: "If I can only run 10 tests and the build must be working at a basic level, which 10 tests give me the most confidence?" Those 10 tests ARE your smoke suite.

### Duration Rule

A smoke suite should complete in **under 15 minutes**. If it takes longer:

- You have included too many tests
- Remove non-critical tests to a regression suite

### The "Go/No-Go" Gate

Smoke testing is a **binary gate**. There are only two outcomes:

```
SMOKE PASS:
- Build is stable
- Proceed to regression, sanity, and exploratory testing
- Report: "Build v2.4.1 passed smoke (12/12 tests, 6m 32s)"

SMOKE FAIL:
- Build is NOT stable
- STOP all further testing immediately
- Do NOT run regression (waste of time on a broken build)
- Reject the build
- Notify developer: "Build v2.4.1 failed smoke at test #4:
  Login with valid credentials failed — got 500 from auth API"
- Developer fixes, rebuilds, smoke runs again
```

### A Real Smoke Suite — Mobile App (Appium Java)

```java
// SmokeTestSuite.java
// Tagged: @Tag("smoke") — runs first in every pipeline

@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class AppSmokeTestSuite extends BaseAppiumTest {

    @Test
    @Order(1)
    @DisplayName("SMOKE-01: App installs and launches without crash")
    public void appLaunchesWithoutCrash() {
        // The BaseAppiumTest setUp() starts the driver and launches the app
        // If we reach this line, the app launched without crashing
        assertNotNull(driver.getSessionId(),
            "Driver session should exist — app failed to launch");

        // Additional crash check: app should not immediately close
        assertTrue(driver.isAppInstalled("com.mycompany.myapp"),
            "App should be installed");
    }

    @Test
    @Order(2)
    @DisplayName("SMOKE-02: Login screen renders with all required elements")
    public void loginScreenRenders() {
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));

        WebElement usernameField = wait.until(
            ExpectedConditions.visibilityOfElementLocated(
                AppiumBy.accessibilityId("loginUsernameField")));
        WebElement passwordField = wait.until(
            ExpectedConditions.visibilityOfElementLocated(
                AppiumBy.accessibilityId("loginPasswordField")));
        WebElement loginButton = wait.until(
            ExpectedConditions.visibilityOfElementLocated(
                AppiumBy.accessibilityId("loginButton")));

        assertTrue(usernameField.isDisplayed(), "Username field must be visible");
        assertTrue(passwordField.isDisplayed(), "Password field must be visible");
        assertTrue(loginButton.isDisplayed(), "Login button must be visible");
    }

    @Test
    @Order(3)
    @DisplayName("SMOKE-03: Valid login navigates to Home screen")
    public void validLoginNavigatesToHome() {
        LoginPage loginPage = new LoginPage(driver);
        loginPage.login(SmokeTestData.VALID_USERNAME, SmokeTestData.VALID_PASSWORD);

        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(15));
        WebElement homeScreen = wait.until(
            ExpectedConditions.presenceOfElementLocated(
                AppiumBy.accessibilityId("homeScreen")));

        assertTrue(homeScreen.isDisplayed(),
            "Home screen must appear after successful login");
    }

    @Test
    @Order(4)
    @DisplayName("SMOKE-04: Citation list loads with at least one item")
    public void citationListLoads() {
        // Already on Home after SMOKE-03 (tests share state here intentionally —
        // smoke tests are not independent — each builds on the previous)
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));
        WebElement list = wait.until(
            ExpectedConditions.presenceOfElementLocated(
                AppiumBy.accessibilityId("citationList")));

        assertTrue(list.isDisplayed(), "Citation list must be visible");

        // Verify at least one item loaded (not empty state)
        List<WebElement> items = driver.findElements(
            AppiumBy.accessibilityId("citationListItem"));
        assertTrue(items.size() > 0,
            "Citation list must have at least one item for smoke test data");
    }

    @Test
    @Order(5)
    @DisplayName("SMOKE-05: Tapping a citation opens detail screen")
    public void tapCitationOpensDetail() {
        WebElement firstCitation = driver.findElement(
            AppiumBy.accessibilityId("citationListItem"));
        firstCitation.click();

        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));
        WebElement detailScreen = wait.until(
            ExpectedConditions.presenceOfElementLocated(
                AppiumBy.accessibilityId("citationDetailScreen")));

        assertTrue(detailScreen.isDisplayed(),
            "Detail screen must open when citation is tapped");
    }

    @Test
    @Order(6)
    @DisplayName("SMOKE-06: Back navigation returns to list")
    public void backNavigationReturnsToList() {
        driver.navigate().back();  // or: driver.pressKey(new KeyEvent(AndroidKey.BACK))

        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(5));
        WebElement list = wait.until(
            ExpectedConditions.presenceOfElementLocated(
                AppiumBy.accessibilityId("citationList")));

        assertTrue(list.isDisplayed(), "List must be visible after pressing back");
    }

    @Test
    @Order(7)
    @DisplayName("SMOKE-07: Logout returns to login screen")
    public void logoutReturnsToLoginScreen() {
        // Navigate to profile tab
        driver.findElement(AppiumBy.accessibilityId("profileTab")).click();
        driver.findElement(AppiumBy.accessibilityId("logoutButton")).click();

        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));
        WebElement loginButton = wait.until(
            ExpectedConditions.presenceOfElementLocated(
                AppiumBy.accessibilityId("loginButton")));

        assertTrue(loginButton.isDisplayed(),
            "Login screen must appear after logout");
    }
}
```

### Smoke Test Data Strategy

Smoke tests need **dedicated, stable test data** that never changes:

```java
public class SmokeTestData {
    // Dedicated smoke test user — never used in other tests
    // Always has at least one citation in PENDING status
    // Password never expires (set in test environment config)
    public static final String VALID_USERNAME = "smoke_test@myapp.com";
    public static final String VALID_PASSWORD = "SmokeTest_2024!";

    // Known citation that always exists for the smoke user
    public static final String KNOWN_CITATION_ID = "CIT-SMOKE-001";
}
```

**Why dedicated data?** If smoke tests share test data with other tests, a regression test might modify or delete that data, causing smoke tests to fail for reasons unrelated to build quality.

---

### 🎯 Practice — Smoke Testing

**Challenge**: You are the QA lead for a mobile banking app. Design a smoke test suite. List exactly which 8 tests you include and explain why each one is "smoke worthy" (i.e., if it fails, all testing must stop).

<details><summary>Answer</summary>

```
BANKING APP SMOKE SUITE — 8 Tests

SMOKE-01: App launches without crash
WHY: If this fails, nothing else is testable. Non-negotiable.

SMOKE-02: Login screen renders
WHY: Entry point to all features. If login screen is broken,
     testing any feature is impossible.

SMOKE-03: Login with valid credentials succeeds
WHY: Authentication is the gate to all features.
     If login is broken, zero features can be tested.

SMOKE-04: Account balance displays on home screen
WHY: Core value proposition. If balance can't display,
     the app serves no purpose in testing.

SMOKE-05: Transaction list loads (at least one transaction visible)
WHY: Second most used feature. If data loading is broken
     across the board, all feature testing is blocked.

SMOKE-06: Transfer/Payment screen is reachable
WHY: Core financial operation. If navigation to it is broken,
     entire payment regression is blocked.

SMOKE-07: Notification permissions can be accepted/declined
WHY: On first launch, the permission dialog blocks the app.
     If it crashes here, the first-install flow is broken.

SMOKE-08: Logout works and user is returned to login
WHY: State management. If logout is broken, test users
     pollute each other's sessions, making ALL other tests unreliable.
```

**What I excluded and why**:

- Transfer completion — too specific, goes in regression
- Error message text — too specific, goes in regression
- Search functionality — secondary feature
- Settings — non-critical to testing

</details>

---

## 4. Sanity Testing — Full Technical Deep Dive

### The Exact Mental Model

Sanity testing is a **narrow verification of a specific change**. When a developer fixes bug #4521, you don't re-run 500 regression tests — you run 5-10 targeted tests that directly verify bug #4521 is fixed AND that the fix didn't break the immediately surrounding area.

Think of it like checking that a specific leaky pipe was repaired correctly — not inspecting every pipe in the building.

```
BUG REPORTED: "Payment success screen shows $0 for amounts over $999"
     │
     ▼
Developer fixes bug, submits build v2.4.2-hotfix
     │
     ▼
SANITY TEST (not regression, not smoke):
  Test 1: Pay $1,000 → success screen shows "$1,000.00" ← directly tests the fix
  Test 2: Pay $1,500 → success screen shows "$1,500.00" ← boundary above
  Test 3: Pay $999   → success screen shows "$999.00"   ← boundary below (not broken)
  Test 4: Pay $0.01  → success screen shows "$0.01"     ← smallest valid amount
  Test 5: Pay $10,000 → success screen shows "$10,000.00" ← upper boundary
     │
     ▼
PASS: Fix confirmed. Proceed to regression (full payment suite).
FAIL: Fix did not work OR fix introduced a new bug.
```

### Sanity vs Smoke — The Exact Difference

```
SCOPE:
Smoke:   The entire app (at surface level)
Sanity:  ONE specific area/fix (at depth)

TRIGGER:
Smoke:   Every new build
Sanity:  A specific bug fix / targeted change

DEPTH:
Smoke:   Shallow — 1-2 steps per area, many areas
Sanity:  Deep — many steps, one area

OUTPUT:
Smoke:   "Is this build testable?"
Sanity:  "Is this specific fix correct?"

ANALOGY:
Smoke:   Checking if a restaurant is open before going inside
Sanity:  Checking if your specific order was cooked correctly
```

### What Sanity Tests Look Like vs Other Types

**Same bug, three different test types**:

```
BUG: "App crashes when you filter citations by amount range with no network"

UNIT TEST (tests logic):
  Given: CitationFilterViewModel
  When: filterByAmount(min=0, max=100) is called with isOffline=true
  Then: Returns cached citations within range, does NOT throw exception
  ← Tests the function in isolation

INTEGRATION TEST (tests components together):
  Given: CitationRepository backed by local cache
  When: fetchFilteredCitations(min=0, max=100) called with no network
  Then: Repository returns cached data, does not attempt network call
  ← Tests Repository + Cache together

SANITY TEST (tests the fix in the real app):
  Steps:
    1. Open app while online, load citation list (data cached)
    2. Enable airplane mode
    3. Tap filter icon
    4. Set amount range 0-100
    5. Apply filter
  Expected: Shows filtered cached citations WITHOUT crashing
  ← Tests the actual fix in real app conditions
```

### Who Writes Sanity Tests

QA engineers write them based on the bug report and the developer's explanation of what was fixed and what was touched.

The best sanity tests come from the **exact reproduction steps of the original bug** — those steps become the test, with the expectation changed from "crashes" to "works correctly".

### Sanity Test Document Template

For each bug fix, document:

```
SANITY TEST DOCUMENT
──────────────────────────────────────────────────────
Bug ID:           CIT-4521
Build:            v2.4.2-hotfix
Developer:        Harsha V.
Change Summary:   Fixed DecimalFormat pattern for amounts ≥ 1000
Files Changed:    PaymentSuccessFormatter.kt

ORIGINAL BUG STEPS:
  1. Login
  2. Open citation with amount $1,500
  3. Tap Pay
  4. Confirm payment
  Expected: "$1,500.00" shown on success screen
  Actual: "$0.00" shown on success screen

SANITY TEST CASES:
  Test 1: Amount exactly $1,000.00 → shows "$1,000.00"          [PASS/FAIL]
  Test 2: Amount $1,500.00        → shows "$1,500.00"           [PASS/FAIL]
  Test 3: Amount $9,999.99        → shows "$9,999.99"           [PASS/FAIL]
  Test 4: Amount $999.99 (boundary below) → shows "$999.99"     [PASS/FAIL]
  Test 5: Amount $0.01 (minimum)  → shows "$0.01"               [PASS/FAIL]
  Test 6: Payment history entry   → amount formatted correctly  [PASS/FAIL]
  (Test 6: added because PaymentSuccessFormatter is also used there)

SANITY RESULT: ☐ PASS (proceed to regression)  ☐ FAIL (reject, return to dev)
```

---

### 🎯 Practice — Sanity Testing

**Scenario**: Bug CIT-5678 is: "When user changes their email address in Profile, the new email appears correctly in Profile, but the old email is still shown in the top navigation bar greeting ('Welcome, old@email.com')."

Developer says: "Fixed — the navigation bar now subscribes to the user profile state object. Changed UserProfileViewModel.swift."

Write the sanity test cases.

<details><summary>Answer</summary>

```
SANITY TEST — CIT-5678 (Navigation bar email not updated)

Context: The fix is in how the navigation bar reads the user profile state.
We need to verify:
a) The fix works (new email appears in nav bar)
b) The nav bar didn't break anything else
c) The profile screen still works correctly

TEST 1: Email change reflects in nav bar (core fix)
  1. Login as test user (email: original@test.com)
  2. Verify nav bar shows "Welcome, original@test.com"
  3. Navigate to Profile
  4. Change email to new@test.com
  5. Save
  6. Navigate back to any screen with nav bar
  Expected: Nav bar shows "Welcome, new@test.com"
  Before fix: Nav bar showed "Welcome, original@test.com" ← the bug

TEST 2: Profile screen shows correct email after change
  1. Follow steps 1-5 above
  2. Navigate back to Profile
  Expected: Profile email field shows "new@test.com"
  Purpose: Confirm the profile screen itself still works

TEST 3: Change persists after app restart (state is saved, not just in-memory)
  1. Change email as in Test 1
  2. Force-quit the app
  3. Reopen the app
  4. Login if needed
  Expected: Nav bar shows "Welcome, new@test.com" (not the original email)

TEST 4: Changing email twice works correctly
  1. Change to email_v2@test.com
  2. Verify nav bar shows email_v2
  3. Change to email_v3@test.com
  4. Verify nav bar shows email_v3 (not email_v2)

TEST 5: Original email before any change is correct (non-regression)
  1. Login as a fresh user (never changed email)
  2. Verify nav bar shows the correct registration email
  Purpose: Confirm the fix didn't break the initial state

TEST 6: Display name (if different from email) not affected
  1. User with display name "Harsha" and email "h@test.com"
  2. Change email
  3. Verify nav bar shows correct name (not accidentally replaced with email)
```

**Why Test 3 matters**: The fix might have only updated an in-memory state. If the fix doesn't persist to storage, the nav bar will revert on next launch. This is a common "fix" that is actually only half-fixed.

**Why Test 6 matters**: The developer touched `UserProfileViewModel.swift` — the same place display names come from. It's possible the fix accidentally broke display name rendering. Good sanity tests check the boundary of what was changed.

</details>

---

## 5. Regression Testing — Full Technical Deep Dive

### The Exact Mental Model

Regression testing ensures that **the software has not gone backwards**. Every time code changes, there is a risk that something previously working is now broken. Regression testing is the systematic process of detecting those breakages.

```
VERSION 2.3 (last week):     VERSION 2.4 (today — added Dark Mode):
✓ Login works                ✓ Login works
✓ Payment works              ✓ Payment works ← Did the developer test this?
✓ Logout works               ✗ Logout broken ← REGRESSION (introduced by Dark Mode code)
                             ✓ Dark Mode works

Without regression tests: QA or users discover logout is broken.
With regression tests:    CI discovers it before the PR is merged.
```

### Why Regression Bugs Happen

Regression bugs are introduced when:

1. **Shared code changes**: Developer modifies a utility function used in 10 places — 9 places still work, 1 place breaks
2. **State management changes**: A global state object is modified — some screens that read from it break
3. **Database schema changes**: A column is renamed or removed — queries that reference it fail
4. **Dependency updates**: A library is upgraded and a behavior changes subtly
5. **Configuration changes**: An API endpoint URL changes — affected calls fail

### Regression Test Scope — The Three Circles

```
Circle 1 — ALWAYS (every build):
  Smoke tests (is the build alive?)
  + Tests directly related to changed feature
  + Tests that use shared code that was modified

Circle 2 — EVERY PR (before merge):
  Circle 1
  + Critical path tests for all major features
  + Tests for areas adjacent to what changed

Circle 3 — FULL REGRESSION (nightly / pre-release):
  All automated tests
  All areas
  All edge cases that are too slow for every PR
```

### The Risk-Based Approach — What to Always Prioritize

Not all features have equal risk. Prioritize regression tests for:

```
HIGH RISK (always in regression):
  - Authentication (login, logout, session management)
  - Payment/financial transactions
  - Data persistence (save, load, sync)
  - Core navigation (the main user journey)
  - Error recovery (app doesn't crash on bad data)

MEDIUM RISK (in PR regression):
  - Search and filter
  - Profile management
  - Notifications
  - Settings changes

LOW RISK (nightly only):
  - UI polish (animations, transitions)
  - Non-critical secondary features
  - Accessibility details
```

### Test Tagging Strategy — The System That Makes Regression Work

Without tagging, you run everything every time — too slow. With tagging, you run exactly the right tests at the right moment:

```java
// Annotation usage — JUnit 5
@Tag("smoke")        // Run in smoke suite
@Tag("regression")   // Run in regression suite
@Tag("critical")     // Run on every PR
@Tag("auth")         // Feature area: authentication
@Tag("payment")      // Feature area: payment
@Tag("nightly")      // Run only in nightly build
@Tag("flaky")        // Known to be flaky — excluded from blocking gates

// A test can have multiple tags:
@Test
@Tag("critical")
@Tag("regression")
@Tag("auth")
public void loginWithValidCredentialsSucceeds() { ... }

// Running specific subsets:
// mvn test -Dgroups="smoke"
// mvn test -Dgroups="critical,regression"
// mvn test -Dgroups="payment,regression"
// mvn test -Dgroups="nightly" -DexcludedGroups="flaky"
```

```python
# Python — pytest markers
import pytest

@pytest.mark.smoke
@pytest.mark.critical
@pytest.mark.auth
def test_login_with_valid_credentials():
    ...

# Running:
# pytest -m "smoke"
# pytest -m "regression and not flaky"
# pytest -m "payment and critical"
```

### Regression Suite Organization

```
test/
├── smoke/
│   └── AppSmokeTestSuite.java           ← 10-15 tests, always runs first
│
├── regression/
│   ├── auth/
│   │   ├── LoginRegressionTest.java
│   │   ├── LogoutRegressionTest.java
│   │   └── SessionManagementTest.java
│   │
│   ├── payment/
│   │   ├── PaymentFlowRegressionTest.java
│   │   ├── PaymentValidationTest.java
│   │   ├── PaymentHistoryTest.java
│   │   └── PaymentEdgeCasesTest.java
│   │
│   ├── citation/
│   │   ├── CitationListRegressionTest.java
│   │   ├── CitationDetailRegressionTest.java
│   │   ├── CitationFilterTest.java
│   │   └── CitationSearchTest.java
│   │
│   └── profile/
│       ├── ProfileEditRegressionTest.java
│       └── ProfileSettingsTest.java
│
├── nightly/
│   ├── FullPaymentJourneyTest.java      ← Long-running tests
│   ├── OfflineOnlineSyncTest.java
│   └── PerformanceBaselineTest.java
│
└── exploratory/
    └── ExploratoryTestCharters.md       ← Documentation, not code
```

### Test Independence — The Critical Property

Regression tests MUST be independent of each other. This is the most common source of regression test failures that aren't actual bugs:

```java
// WRONG — tests depend on each other's state
@Test @Order(1) public void createCitation() {
    // Creates citation with ID 123 in the database
}
@Test @Order(2) public void viewCitation() {
    // ASSUMES ID 123 exists from the previous test
    // If test 1 fails, test 2 fails for the wrong reason
}

// RIGHT — each test sets up its own data
@Test
public void viewCitation_showsCorrectDetails() {
    // Arrange: create the data this test needs
    Citation citation = testDataFactory.createCitation(amount: 150.0, status: "PENDING");

    // Act: navigate to the citation
    homePage.navigateToCitation(citation.id);

    // Assert: verify the correct data is shown
    assertEquals("$150.00", citationDetailPage.getAmount());
    assertEquals("PENDING", citationDetailPage.getStatus());

    // Cleanup happens in @AfterEach — delete the citation we created
}
```

### Handling Flaky Tests

Flaky tests pass sometimes and fail sometimes for non-deterministic reasons (timing, test data conflicts, network delays). They are the #1 cause of regression suite credibility loss.

```java
// Strategies for handling flakiness:

// Strategy 1: Explicit waits instead of Thread.sleep
// BAD:
Thread.sleep(3000);  // hopes the element appears in 3 seconds
element.click();

// GOOD:
WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));
wait.until(ExpectedConditions.elementToBeClickable(By.id("confirmButton"))).click();

// Strategy 2: Test data isolation — never share data between tests
// Each test creates its own data in @BeforeEach and deletes it in @AfterEach

// Strategy 3: Retry on failure (last resort — treats the symptom, not the cause)
@RetryOnFailure(times = 2)  // retry once if it fails (JUnit Pioneer)
@Test
public void occasionallyUnreliableTest() { ... }

// Strategy 4: Tag known flaky tests and exclude from blocking gates
@Tag("flaky")
@Disabled("CIT-9000: Investigating timing issue on CI — 2024-01-15")
@Test
public void thisTestIsKnownToBeFlaky() { ... }
```

---

## 6. The Relationship Between All Three

```
┌────────────────────────────────────────────────────────────────────────┐
│                       FULL TEST LIFECYCLE                              │
│                                                                        │
│  BUILD ARRIVES                                                         │
│       │                                                                │
│       ▼                                                                │
│  ┌─────────────────────────────────────────────────────────────┐       │
│  │  SMOKE TEST                                                 │       │
│  │  Duration: 5-15 min                                         │       │
│  │  Scope: Entire app, shallow                                 │       │
│  │  Runs: EVERY build                                          │       │
│  └────────────────────────┬────────────────────────────────────┘       │
│                           │ PASS                                       │
│              ┌────────────┴───────────────┐                            │
│              ▼                            ▼                            │
│  ┌───────────────────┐      ┌─────────────────────────────────┐        │
│  │  SANITY TEST      │      │  REGRESSION TEST                │        │
│  │  (if build has    │      │  Duration: 30min - 4hrs         │        │
│  │   a specific fix) │      │  Scope: All previous features   │        │
│  │  Duration: 15-30m │      │  Runs: Every PR + nightly       │        │
│  │  Scope: The fix   │      └─────────────────────────────────┘        │
│  └───────────────────┘                   │                             │
│              │                           │ PASS                        │
│              │ PASS                      ▼                             │
│              └──────────────► EXPLORATORY / UAT / RELEASE              │
└────────────────────────────────────────────────────────────────────────┘
```

**Key principle**: Smoke ALWAYS runs first. Regression runs after smoke passes. Sanity runs in parallel with (or before) regression for the specific fix. If smoke fails, NOTHING ELSE runs.

---

## 7. Designing a Smoke Test Suite — Step by Step

### Step 1: Map the Critical User Journeys

List the journeys that, if broken, make the app completely useless:

```
For a citation payment app:
Journey 1: User can log in
Journey 2: User can see their citations
Journey 3: User can navigate to a citation detail
Journey 4: User can initiate a payment
Journey 5: User can log out

For a food delivery app:
Journey 1: User can log in
Journey 2: User can see restaurants
Journey 3: User can add item to cart
Journey 4: User can place an order
Journey 5: User can view order status
```

### Step 2: For Each Journey, Write ONE Positive Test

Only the happy path. No error cases. No edge cases.

```
Journey 1 → Login with valid credentials → lands on home screen
Journey 2 → Citation list screen loads with at least one item
Journey 3 → Tap first citation → detail screen appears
Journey 4 → Tap Pay → payment form appears (just navigation, not completion)
Journey 5 → Tap Logout → login screen appears
```

### Step 3: Add App-Level Stability Checks

```
App launches without crash
App does not consume abnormally high CPU on launch (check Activity Monitor / Instruments)
No memory crash within 2 minutes of launch
```

### Step 4: Validate the Suite Duration

Time the suite. If it exceeds 15 minutes:

- Remove any test that is not a critical journey
- Move edge cases to regression
- Optimize waits and navigation

### Step 5: Assign Dedicated Test Data

Create smoke-only test accounts and data that:

- Never expire
- Always have the minimum data needed
- Are never modified by other tests

---

## 8. Designing a Regression Test Suite — Step by Step

### Step 1: Audit All Features

List every feature the app has. Every screen. Every action a user can take.

```
Authentication:     Login, Logout, Register, Forgot Password, Biometric
Citations:          List, Detail, Filter, Sort, Search, Pagination
Payments:           Initiate, Confirm, Cancel, Payment History, Receipts
Profile:            View, Edit, Change Password, Change Email
Notifications:      Push notification open, Notification settings
Settings:           Theme, Language, Data/Privacy
```

### Step 2: Write Test Cases for Each Feature

For each feature, cover:

- Happy path (the ideal user flow)
- Boundary values (minimum and maximum inputs)
- Error paths (invalid input, network errors, server errors)
- Edge cases (empty state, already-done actions, concurrent actions)

```
PAYMENT FEATURE — Test Coverage:
Happy path:     Pay valid amount → success screen
Boundary:       Pay $0.01 (min valid) → success
Boundary:       Pay $10,000 (max valid) → success
Boundary:       Pay $10,001 (over limit) → validation error
Error path:     Pay with no network → shows offline error
Error path:     API returns 500 → shows generic error
Error path:     API returns 401 → session expired flow
Edge case:      Double-tap Pay button → only one payment submitted
Edge case:      Pay, receive phone call, return → payment state preserved
```

### Step 3: Prioritize with Tags

```
@critical → must pass before any PR can merge
@high     → must pass before any release
@medium   → runs nightly
@low      → runs in full regression (pre-release only)
```

### Step 4: Set a Maintenance Process

Regression suites DECAY without maintenance. Set a process:

- When a new feature ships → add regression tests for it before release
- When a test fails due to a UI change (not a bug) → update the test immediately
- Monthly: Review and remove tests for deprecated features
- Quarterly: Audit test coverage against current feature set

---

## 9. CI/CD Pipeline Integration — Full Pipeline Design

```yaml
# .github/workflows/mobile-tests.yml (GitHub Actions — conceptual)

name: Mobile Test Pipeline

on:
  push:
    branches: [feature/*, develop]
  pull_request:
    branches: [main, develop]
  schedule:
    - cron: "0 2 * * *" # Nightly at 2 AM

jobs:
  # Stage 1: Build — runs on every push
  build:
    runs-on: macos-14
    steps:
      - name: Build Android Debug APK
        run: ./gradlew assembleDebug
      - name: Upload APK as artifact
        uses: actions/upload-artifact@v4
        with: { name: app-debug, path: app/build/outputs/apk/debug/ }

  # Stage 2: Smoke — runs after build, on every push
  smoke:
    needs: build
    runs-on: macos-14
    steps:
      - name: Start Android Emulator
        run: $ANDROID_HOME/tools/emulator -avd test_emulator &
      - name: Wait for emulator
        run: adb wait-for-device
      - name: Run Smoke Tests ONLY
        run: mvn test -Dgroups="smoke" -Dplatform=android
      - name: Upload smoke results
        if: always()
        uses: actions/upload-artifact@v4
        with: { name: smoke-results, path: target/surefire-reports/ }
    # If smoke fails → all downstream jobs are skipped automatically

  # Stage 3: Regression — runs after smoke, on PRs
  regression:
    needs: smoke
    if: github.event_name == 'pull_request' # Only on PRs, not every push
    runs-on: macos-14
    steps:
      - name: Run Critical Regression Tests
        run: mvn test -Dgroups="regression,critical" -DexcludedGroups="flaky"
      - name: Publish test results
        uses: dorny/test-reporter@v1
        with:
          name: Regression Results
          path: target/surefire-reports/*.xml
          reporter: java-junit

  # Stage 4: Full Regression — runs nightly only
  nightly-full-regression:
    needs: smoke
    if: github.event_name == 'schedule'
    runs-on: macos-14
    strategy:
      matrix:
        test-area: [auth, payment, citation, profile]
    steps:
      - name: Run ${{ matrix.test-area }} Full Regression
        run: mvn test -Dgroups="${{ matrix.test-area }},regression"
```

### The Pipeline in Plain English

```
Every push (feature branch):
  Build → Smoke
  If smoke passes: engineer gets green checkmark, PR can be opened

Every PR:
  Build → Smoke → Critical Regression
  PR cannot be merged if any step fails

Every night:
  Build → Smoke → Full Regression (all areas, parallel)
  Team reviews results in the morning

Before release:
  Full Regression → UAT build distribution → Exploratory → Sign-off
```

---

## 10. Real Scenarios With Decisions

**Scenario 1**: A developer pushes a commit that changes the color of the primary button from blue to green across the entire app.

```
DECISION: What tests run?
- Smoke: YES (every push) — verifies the build is not broken
- Sanity: YES (quick sanity on primary buttons in critical screens)
- Regression (critical): YES (on PR — ensures no functional regressions)
- Visual regression: YES — this is EXACTLY what visual tests catch
  (button color change affects every screen; visual diff will show all changes)
- Full regression: Only if this is a pre-release commit
```

**Scenario 2**: QA receives build v3.1.0. It contains 15 new features and 30 bug fixes developed over 2 weeks.

```
DECISION: Testing sequence?
1. Smoke — Is the build even stable? (15 minutes)
2. Sanity — Quick check on the highest-risk bug fixes (30 minutes)
3. Regression — Full suite to catch any regressions from 2 weeks of changes (4-6 hours)
4. New Feature Testing — Test the 15 new features against acceptance criteria (2-3 days)
5. Exploratory — Focused sessions on the riskiest new features (4 hours)
6. UAT — Business stakeholders validate on staging (1-2 days)
7. Pre-release full regression — Final gate (overnight)
```

**Scenario 3**: Production reports bug: "Crash on startup for iOS 17.4 users." A hotfix is developed and a new build arrives.

```
DECISION: What tests do you run, in what order?
1. Smoke on iOS 17.4 simulator — Does it even launch? (5 minutes)
2. Sanity on the crash scenario — launch the app on iOS 17.4, navigate to the
   screen that crashed, verify no crash (15 minutes)
3. Smoke on other iOS versions — Ensure hotfix didn't break iOS 16, 17.0, 17.3 (15 minutes)
4. Targeted regression on iOS 17.4 only — Run the critical path on the specific OS (30 minutes)
5. If all pass → deploy hotfix to production
6. Full regression runs overnight to verify no other regressions
```

---

## 11. Interview Q&A — Exact Answers

**Q: "What is the difference between smoke testing and regression testing?"**

> "Smoke testing is a build viability check — it answers 'is this build stable enough to test?' We run 10-15 high-level tests covering the most critical app functions. If smoke passes, the build is testable; if it fails, we reject the build and don't waste time on further testing.
>
> Regression testing is a completeness check — it answers 'did our new code break any existing features?' We run a broader set of tests across all feature areas to ensure that fixing bug A or adding feature B hasn't broken features C, D, and E.
>
> The key differences: smoke is shallow and broad, regression is deep and targeted to feature areas. Smoke runs on every build; regression runs on every PR or nightly. Smoke takes 15 minutes; regression can take hours. Most importantly, smoke GATES regression — you never run regression against a failed smoke build."

---

**Q: "What is sanity testing? How is it different from regression testing?"**

> "Sanity testing is a narrow verification of a specific fix. After a developer resolves bug #4521, I don't run the full regression suite — I run 5-10 targeted tests that directly verify that specific fix works and that the area immediately around it wasn't affected.
>
> The difference from regression: regression is comprehensive and covers all features; sanity is focused and covers only the changed area. Regression takes 1-4 hours; sanity takes 15-30 minutes. Regression is always automated; sanity can be quick manual testing.
>
> I think of it this way: regression asks 'did anything old break?'; sanity asks 'did this specific fix work?'"

---

**Q: "In a CI/CD pipeline, when would each test type run?"**

> "In a typical mobile CI/CD pipeline: Unit and integration tests run on every commit as pre-commit hooks or on push — they take seconds and give immediate feedback. Smoke tests run after every build — they verify the build artifact is deployable. Critical regression tests run on every pull request, blocking merge if they fail. The full regression suite runs nightly or post-merge to develop. Sanity tests run on-demand after specific hotfixes. Performance tests run weekly on staging. Exploratory and UAT happen in the pre-release phase after automation passes."

---

**Next**: Continue to Ch00 Foundations → [`../00_SDET_Foundations_Mindset.md`](../00_SDET_Foundations_Mindset.md)

**Back to**: [Series Index](../..)
