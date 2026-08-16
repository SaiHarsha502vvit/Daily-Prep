# Android — Unit Testing with JUnit, MockK, and Coroutines

**Folder**: [03_Android](./) | **Previous**: [06_Networking_Retrofit_OkHttp.md](./06_Networking_Retrofit_OkHttp.md) | **Next**: [08_Instrumented_And_UI_Tests.md](./08_Instrumented_And_UI_Tests.md)

> **Reading contract**: Unit tests are the fastest, cheapest tests in your suite. A good Android unit test runs in milliseconds, requires no device, and tells you exactly which function broke and why. This file teaches: the correct test structure, how MockK replaces Mockito for Kotlin, how to test coroutines and Flow without timing hacks, how to test every Android layer (ViewModel, Repository, UseCase, Mapper), and how to organize a test suite that gives you real confidence. By the end you will be able to write tests before you write code.

---

## Table of Contents

1. [Why Unit Tests — The Real Value Proposition](#1-why-unit-tests--the-real-value-proposition)
2. [JUnit 5 — The Test Framework](#2-junit-5--the-test-framework)
3. [The AAA Pattern — Arrange, Act, Assert](#3-the-aaa-pattern--arrange-act-assert)
4. [MockK — Kotlin-First Mocking](#4-mockk--kotlin-first-mocking)
5. [Testing ViewModels](#5-testing-viewmodels)
6. [Testing Coroutines — The TestDispatcher](#6-testing-coroutines--the-testdispatcher)
7. [Testing Flow Emissions with Turbine](#7-testing-flow-emissions-with-turbine)
8. [Testing Use Cases](#8-testing-use-cases)
9. [Testing Mappers and Pure Functions](#9-testing-mappers-and-pure-functions)
10. [Testing the Repository Layer](#10-testing-the-repository-layer)
11. [Test Doubles — Fake vs Mock vs Stub vs Spy](#11-test-doubles--fake-vs-mock-vs-stub-vs-spy)
12. [Parameterized Tests — Test Many Cases with One Method](#12-parameterized-tests--test-many-cases-with-one-method)
13. [Test Organization — What to Test and What Not To](#13-test-organization--what-to-test-and-what-not-to)
14. [Common Unit Testing Mistakes](#14-common-unit-testing-mistakes)
15. [Interview Q&A](#15-interview-qa)

---

## 1. Why Unit Tests — The Real Value Proposition

```
SCENARIO: You have 50,000 lines of code, no tests.
  A new developer refactors the payment calculation logic.
  They run the app manually, the happy path works.
  They ship.
  Production: edge case input → wrong payment amount → financial loss.

SCENARIO: Same codebase, with unit tests.
  Developer refactors payment logic.
  Runs: ./gradlew test  (takes 8 seconds)
  Tests fail: "calculateTotalWithLateFee_overdueByMoreThan30Days_applies20PercentPenalty FAILED"
  Developer sees exactly which case broke, fixes it.
  Ships with confidence.
```

### What Unit Tests Are

A **unit test** tests a **single unit of behavior** in isolation:

- Isolates the class under test from its dependencies (using test doubles)
- Has no Android framework (no Activity, no Context, no Instrumentation)
- Runs on the JVM — on your machine, in the CI pipeline, in 8 seconds
- Tests ONE behavior per test method

```
TEST PYRAMID:
          ╱╲
         ╱  ╲     End-to-End tests (5%)
        ╱ E2E╲    → Slow, expensive, brittle. Test user journeys.
       ╱──────╲
      ╱        ╲   Integration tests (20%)
     ╱Integration╲ → Medium speed. Test component interactions.
    ╱────────────╲
   ╱              ╲  Unit tests (75%)
  ╱   Unit Tests   ╲ → Fast, cheap, surgical. Test individual behaviors.
 ╱──────────────────╲

GOAL: Most tests should be unit tests. They are the foundation.
```

---

## 2. JUnit 5 — The Test Framework

Android uses **JUnit 4** in instrumented tests (on device) and **JUnit 5** is available for pure JVM unit tests via the android-junit5 plugin. This file covers both, noting where they differ.

```kotlin
// build.gradle.kts — test dependencies:
dependencies {
    // JUnit 5 (for JVM unit tests):
    testImplementation("org.junit.jupiter:junit-jupiter-api:5.10.2")
    testImplementation("org.junit.jupiter:junit-jupiter-params:5.10.2")  // parameterized
    testRuntimeOnly("org.junit.jupiter:junit-jupiter-engine:5.10.2")

    // Coroutines testing:
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.8.1")

    // MockK — Kotlin mocking:
    testImplementation("io.mockk:mockk:1.13.12")

    // Turbine — Flow testing:
    testImplementation("app.cash.turbine:turbine:1.2.0")

    // Truth — readable assertions:
    testImplementation("com.google.truth:truth:1.4.4")
}
```

### JUnit 5 Annotations

```kotlin
class CitationCalculatorTest {

    // @BeforeEach: runs before EVERY test method in this class
    @BeforeEach
    fun setup() {
        calculator = CitationCalculator()
    }

    // @AfterEach: runs after every test method (cleanup)
    @AfterEach
    fun cleanup() {
        // clear mocks, close resources
    }

    // @BeforeAll: runs ONCE before all tests in this class (expensive setup)
    // Must be in companion object (or @JvmStatic) for JUnit 5:
    companion object {
        @BeforeAll
        @JvmStatic
        fun setupDatabase() {
            // Start test database, etc.
        }

        @AfterAll
        @JvmStatic
        fun teardownDatabase() { }
    }

    // @Test: marks a test method
    @Test
    fun `calculateLateFee returns zero when citation is not overdue`() {
        // ...
    }

    // @Disabled: skips a test with a reason
    @Disabled("API endpoint not yet implemented — ticket PROJ-123")
    @Test
    fun `pay citation with Apple Pay`() { }

    // @Nested: group related tests in inner classes
    @Nested
    inner class WhenCitationIsOverdue {

        @Test
        fun `applies 10 percent fee when overdue by 1-30 days`() { }

        @Test
        fun `applies 20 percent fee when overdue by more than 30 days`() { }
    }
}
```

### Test Method Naming — The Backtick Convention

```kotlin
// Java style (readable but verbose):
@Test
fun calculateLateFee_overdueByMoreThan30Days_applies20PercentPenalty() { }

// Kotlin backtick style (most readable — use this):
@Test
fun `calculateLateFee - overdue by more than 30 days - applies 20 percent penalty`() { }

// BDD style (When/Given/Then in name):
@Test
fun `given a PENDING citation when payment is submitted then status changes to PAID`() { }

// Rule: test names should read like a specification:
// "CitationCalculator: calculateLateFee - overdue by more than 30 days - applies 20% penalty"
// A failing test name alone should tell you EXACTLY what broke.
```

---

## 3. The AAA Pattern — Arrange, Act, Assert

Every unit test has three sections:

```kotlin
@Test
fun `fetchCitations - network succeeds - returns mapped domain list`() {
    // ──────────── ARRANGE ────────────
    // Set up: test data, mock return values, system under test
    val mockCitationDto = CitationDto(
        citationId = "CIT-001",
        citationNumber = "CN-001",
        amount = 150.0,
        statusCode = "P",
        issuedTimestamp = 1704067200L,
        dueTimestamp = 1706745600L,
        description = "Parking violation",
        attachmentCount = 0
    )
    coEvery { mockApi.getCitations() } returns listOf(mockCitationDto)

    // ──────────── ACT ────────────
    // Execute the single behavior being tested
    val result = runBlocking { repository.fetchCitations() }

    // ──────────── ASSERT ────────────
    // Verify the outcome
    assertTrue(result.isSuccess)
    val citations = result.getOrNull()!!
    assertEquals(1, citations.size)
    assertEquals("CIT-001", citations[0].id)
    assertEquals(CitationStatus.PENDING, citations[0].status)
    // "P" → PENDING mapping tested here (not in a separate test for the API)

    // Optionally verify interactions:
    coVerify(exactly = 1) { mockApi.getCitations() }
}
```

### One Behavior Per Test — The Critical Rule

```kotlin
// WRONG — testing multiple behaviors in one test:
@Test
fun testCitationRepository() {
    // Tests insert, query, update, delete in one test
    // If it fails: which behavior is broken? You don't know.
    dao.insert(citation)
    val fetched = dao.getById("CIT-001")
    assertNotNull(fetched)
    dao.update(fetched!!.copy(status = "PAID"))
    val updated = dao.getById("CIT-001")
    assertEquals("PAID", updated!!.status)
    dao.delete(updated)
    assertNull(dao.getById("CIT-001"))
}

// CORRECT — each behavior in its own test:
@Test
fun `insert - stores citation in database`() { ... }

@Test
fun `getById - returns null when citation does not exist`() { ... }

@Test
fun `update - changes citation status`() { ... }

@Test
fun `delete - removes citation from database`() { ... }
```

---

## 4. MockK — Kotlin-First Mocking

MockK is the standard Kotlin mocking library. Prefer it over Mockito for Kotlin code.

```kotlin
// ── CREATING MOCKS ─────────────────────────────────────────────────────

// Annotation-based (with @ExtendWith(MockKExtension::class)):
@MockK lateinit var mockRepository: CitationRepository

// Programmatic:
val mockRepository: CitationRepository = mockk()

// Relaxed mock — all functions return default values (0, null, empty list, etc.)
// without needing explicit stubbing:
val mockRepository: CitationRepository = mockk(relaxed = true)

// Relaxed unit mock — only functions returning Unit are relaxed (don't need stubbing),
// other return types still need explicit stubbing:
val mockRepository: CitationRepository = mockk(relaxUnitFun = true)

// Spy — wraps a real object, delegates to real implementation unless overridden:
val realRepository = CitationRepository(dao)
val spyRepository = spyk(realRepository)
every { spyRepository.fetchCitations() } returns Result.success(emptyList())
// Other methods call the real implementation

// ── STUBBING RETURN VALUES ──────────────────────────────────────────────

// Regular function:
every { mockRepository.getCitationById("CIT-001") } returns mockCitation

// Suspend function (requires coEvery):
coEvery { mockRepository.fetchCitations() } returns Result.success(listOf(mockCitation))

// Return different values on successive calls:
coEvery { mockRepository.fetchCitations() } returnsMany listOf(
    Result.failure(NetworkException.NoConnectivity()),
    Result.success(listOf(mockCitation))  // second call succeeds
)

// Throw an exception:
coEvery { mockRepository.fetchCitations() } throws RuntimeException("Unexpected")

// Return based on argument:
every { mockRepository.getCitationById(any()) } answers {
    val id = firstArg<String>()
    if (id.startsWith("CIT")) mockCitation else null
}

// Flow stubbing:
every { mockRepository.observeAllCitations("USR-001") } returns
    flowOf(listOf(mockCitation))  // emits one list then completes

// Capture argument:
val capturedId = slot<String>()
coEvery { mockRepository.getCitationById(capture(capturedId)) } returns mockCitation
// Later: assertEquals("CIT-001", capturedId.captured)

// ── VERIFICATION ────────────────────────────────────────────────────────

// Verify a function was called:
verify { mockRepository.getCitationById("CIT-001") }

// Verify a suspend function was called:
coVerify { mockRepository.fetchCitations() }

// Verify call count:
coVerify(exactly = 1) { mockRepository.fetchCitations() }
coVerify(exactly = 0) { mockRepository.deleteCitation(any()) }

// Verify was NOT called:
coVerify(inverse = true) { mockRepository.deleteCitation(any()) }
// OR:
verify { mockRepository wasNot Called }

// Verify order of calls:
verifyOrder {
    mockRepository.fetchCitations()
    mockRepository.getCitationById("CIT-001")
}

// Verify all stubs were actually called (prevents silent test misconfigurations):
confirmVerified(mockRepository)
```

### MockK vs Mockito — Key Differences

```
FEATURE               MOCKITO                    MOCKK
─────────────────     ──────────────────────     ─────────────────────────────
suspend functions     NOT supported              coEvery { }, coVerify { }
Extension functions   Cannot mock               CAN mock (mockk<MyClass>())
Object/companion      Cannot mock               mockk<MyObject>()
Top-level functions   Cannot mock               mockkStatic("com.pkg.FileKt")
Final classes         Needs special setup        Works by default
Kotlin idioms         Verbose                   Natural: every { } returns value
```

---

## 5. Testing ViewModels

ViewModels are the most important unit to test well. They contain business logic, state transitions, and event emissions.

```kotlin
@ExtendWith(MockKExtension::class)
class CitationListViewModelTest {

    // Rule to replace Dispatchers.Main with a test dispatcher:
    @get:Rule
    val mainDispatcherRule = MainDispatcherRule()

    @MockK
    lateinit var fetchCitationsUseCase: FetchCitationsUseCase

    private lateinit var viewModel: CitationListViewModel

    @BeforeEach
    fun setup() {
        // Important: create ViewModel AFTER mocks are initialized by MockKExtension
        viewModel = CitationListViewModel(fetchCitationsUseCase)
    }

    // ── STATE TESTS ─────────────────────────────────────────────────────

    @Test
    fun `initial state is Loading`() {
        // ViewModel emits Loading in init block before any coroutine runs
        assertThat(viewModel.uiState.value)
            .isInstanceOf(CitationListUiState.Loading::class.java)
    }

    @Test
    fun `loadCitations - use case succeeds - transitions to Success state`() = runTest {
        val citations = listOf(
            Citation(id = "CIT-001", amount = 150.0, status = CitationStatus.PENDING),
            Citation(id = "CIT-002", amount = 75.0, status = CitationStatus.PAID)
        )
        coEvery { fetchCitationsUseCase() } returns Result.success(citations)

        viewModel.loadCitations()

        // runTest's advanceUntilIdle() is called implicitly at the end
        // of the runTest block, so coroutines complete before assertions

        val state = viewModel.uiState.value
        assertThat(state).isInstanceOf(CitationListUiState.Success::class.java)
        val successState = state as CitationListUiState.Success
        assertThat(successState.citations).hasSize(2)
        assertThat(successState.citations[0].id).isEqualTo("CIT-001")
    }

    @Test
    fun `loadCitations - use case returns empty list - transitions to Empty state`() = runTest {
        coEvery { fetchCitationsUseCase() } returns Result.success(emptyList())

        viewModel.loadCitations()

        assertThat(viewModel.uiState.value)
            .isInstanceOf(CitationListUiState.Empty::class.java)
    }

    @Test
    fun `loadCitations - use case fails with NoConnectivity - transitions to Error state`() = runTest {
        coEvery { fetchCitationsUseCase() } returns
            Result.failure(NetworkException.NoConnectivity())

        viewModel.loadCitations()

        val state = viewModel.uiState.value
        assertThat(state).isInstanceOf(CitationListUiState.Error::class.java)
        assertThat((state as CitationListUiState.Error).message)
            .contains("internet")  // message references connectivity
    }

    @Test
    fun `loadCitations - sets Loading state before fetching`() = runTest {
        // We need to observe intermediate states, not just the final state
        val states = mutableListOf<CitationListUiState>()
        val collectJob = launch(UnconfinedTestDispatcher()) {
            viewModel.uiState.collect { states.add(it) }
        }

        coEvery { fetchCitationsUseCase() } coAnswers {
            delay(100)  // simulate async work
            Result.success(listOf(mockCitation))
        }

        viewModel.loadCitations()
        advanceUntilIdle()
        collectJob.cancel()

        // Verify the sequence: Loading → Success
        assertThat(states).hasSize(2)
        assertThat(states[0]).isInstanceOf(CitationListUiState.Loading::class.java)
        assertThat(states[1]).isInstanceOf(CitationListUiState.Success::class.java)
    }

    // ── EVENT TESTS ─────────────────────────────────────────────────────

    @Test
    fun `onCitationClicked - emits NavigateToDetail event`() = runTest {
        viewModel.events.test {
            viewModel.onCitationClicked("CIT-001")

            val event = awaitItem()
            assertThat(event).isInstanceOf(CitationListEvent.NavigateToDetail::class.java)
            assertThat((event as CitationListEvent.NavigateToDetail).citationId)
                .isEqualTo("CIT-001")

            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test
    fun `loadCitations fails - emits ShowErrorSnackbar event`() = runTest {
        coEvery { fetchCitationsUseCase() } returns
            Result.failure(NetworkException.NoConnectivity())

        viewModel.events.test {
            viewModel.loadCitations()

            val event = awaitItem()
            assertThat(event).isInstanceOf(CitationListEvent.ShowErrorSnackbar::class.java)
            cancelAndIgnoreRemainingEvents()
        }
    }

    // ── SEARCH FILTER TESTS ─────────────────────────────────────────────

    @Test
    fun `onSearchQueryChanged - filters citations by ID`() = runTest {
        val citations = listOf(
            Citation(id = "CIT-001", description = "Parking"),
            Citation(id = "CIT-002", description = "Speeding")
        )
        coEvery { fetchCitationsUseCase() } returns Result.success(citations)
        viewModel.loadCitations()
        advanceUntilIdle()

        viewModel.onSearchQueryChanged("001")
        advanceUntilIdle()

        assertThat(viewModel.filteredCitations.value).hasSize(1)
        assertThat(viewModel.filteredCitations.value[0].id).isEqualTo("CIT-001")
    }

    @Test
    fun `onSearchQueryChanged - empty query - shows all citations`() = runTest {
        val citations = listOf(
            Citation(id = "CIT-001"),
            Citation(id = "CIT-002")
        )
        coEvery { fetchCitationsUseCase() } returns Result.success(citations)
        viewModel.loadCitations()
        advanceUntilIdle()
        viewModel.onSearchQueryChanged("001")
        advanceUntilIdle()

        viewModel.onSearchQueryChanged("")  // clear filter
        advanceUntilIdle()

        assertThat(viewModel.filteredCitations.value).hasSize(2)
    }

    @Test
    fun `onRetryClicked - calls loadCitations again`() = runTest {
        coEvery { fetchCitationsUseCase() } returns
            Result.failure(NetworkException.NoConnectivity())
        viewModel.loadCitations()
        advanceUntilIdle()

        // Second call — set up success this time
        coEvery { fetchCitationsUseCase() } returns Result.success(listOf(mockCitation))
        viewModel.onRetryClicked()
        advanceUntilIdle()

        assertThat(viewModel.uiState.value)
            .isInstanceOf(CitationListUiState.Success::class.java)

        // Verify the use case was called exactly twice:
        coVerify(exactly = 2) { fetchCitationsUseCase() }
    }
}
```

---

## 6. Testing Coroutines — The TestDispatcher

Coroutines run asynchronously by default. In tests, you need control over timing.

### Why You Need TestDispatcher

```kotlin
// WITHOUT TestDispatcher — this test would ALWAYS fail:
@Test
fun `loadCitations succeeds - state is Success`() {
    coEvery { mockUseCase() } returns Result.success(citations)

    viewModel.loadCitations()
    // loadCitations launches a coroutine on Dispatchers.Main
    // The coroutine hasn't run yet — state is still Loading
    // This assertion runs IMMEDIATELY after loadCitations() returns
    assertThat(viewModel.uiState.value).isInstanceOf(CitationListUiState.Success)
    // FAILS: state is Loading (coroutine hasn't executed yet)
}
```

### The MainDispatcherRule

```kotlin
// JUnit 4 version (for instrumented tests or if not using JUnit 5 plugin):
class MainDispatcherRule(
    private val dispatcher: TestDispatcher = UnconfinedTestDispatcher()
) : TestWatcher() {
    override fun starting(description: Description) {
        Dispatchers.setMain(dispatcher)
    }
    override fun finished(description: Description) {
        Dispatchers.resetMain()
    }
}

// JUnit 5 version (extension):
class MainDispatcherExtension(
    private val dispatcher: TestDispatcher = UnconfinedTestDispatcher()
) : BeforeEachCallback, AfterEachCallback {
    override fun beforeEach(context: ExtensionContext) {
        Dispatchers.setMain(dispatcher)
    }
    override fun afterEach(context: ExtensionContext) {
        Dispatchers.resetMain()
    }
}

// Usage:
@ExtendWith(MainDispatcherExtension::class)
class MyViewModelTest { ... }
```

### UnconfinedTestDispatcher vs StandardTestDispatcher

```
UnconfinedTestDispatcher:
  Coroutines run EAGERLY — immediately when launched
  No need to call advanceUntilIdle() for most tests
  Best for: most ViewModel tests where you just want the coroutine to run

StandardTestDispatcher:
  Coroutines are PAUSED until you explicitly advance time
  You control timing: advanceTimeBy(), advanceUntilIdle(), runCurrent()
  Best for: testing intermediate states, testing delays, testing timeouts
```

```kotlin
// StandardTestDispatcher — full time control:
@Test
fun `shows Loading then Success - in correct order`() = runTest(StandardTestDispatcher()) {
    val states = mutableListOf<UiState>()
    val job = launch { viewModel.uiState.collect { states.add(it) } }

    viewModel.loadCitations()  // launches coroutine, but it's PAUSED

    // State is Loading because coroutine hasn't run yet:
    assertThat(states.last()).isInstanceOf(UiState.Loading::class.java)

    advanceUntilIdle()  // now run all coroutines to completion

    // State is now Success:
    assertThat(states.last()).isInstanceOf(UiState.Success::class.java)
    assertThat(states).hasSize(2)  // exactly 2 state emissions

    job.cancel()
}

// Testing delays:
@Test
fun `debounced search - only fires after 300ms of inactivity`() = runTest {
    viewModel.onSearchQueryChanged("C")
    advanceTimeBy(100)  // only 100ms passed — debounce hasn't fired
    viewModel.onSearchQueryChanged("CI")
    advanceTimeBy(100)
    viewModel.onSearchQueryChanged("CIT")

    // 0 filter updates yet (all within debounce window):
    assertThat(viewModel.filteredCitations.value).hasSize(0)

    advanceTimeBy(300)  // 300ms after last input — debounce fires
    assertThat(viewModel.filteredCitations.value).hasSize(expectedFilteredCount)
}
```

---

## 7. Testing Flow Emissions with Turbine

Turbine is a library specifically for testing Kotlin Flows. It handles the threading complexity of Flow collection in tests.

```kotlin
// Dependency: testImplementation("app.cash.turbine:turbine:1.2.0")

@Test
fun `events flow - emits NavigateToDetail when citation clicked`() = runTest {
    // .test { } starts collecting the Flow and gives you a TurbineTestContext:
    viewModel.events.test {
        viewModel.onCitationClicked("CIT-001")

        // awaitItem(): waits for the next emission (with timeout):
        val event = awaitItem()
        assertThat(event).isInstanceOf(CitationListEvent.NavigateToDetail::class.java)

        // cancelAndIgnoreRemainingEvents(): cancel collection, ignore any queued items
        cancelAndIgnoreRemainingEvents()
    }
}

@Test
fun `events flow - emits multiple events in correct order`() = runTest {
    viewModel.events.test {
        viewModel.pay("CIT-001", 150.0)

        // First event: processing started
        val firstEvent = awaitItem()
        assertThat(firstEvent).isInstanceOf(PaymentEvent.ShowProcessing::class.java)

        // Second event: success
        val secondEvent = awaitItem()
        assertThat(secondEvent).isInstanceOf(PaymentEvent.NavigateToSuccess::class.java)

        cancelAndIgnoreRemainingEvents()
    }
}

@Test
fun `StateFlow - emits correct sequence during loading`() = runTest {
    coEvery { fetchCitationsUseCase() } coAnswers {
        delay(100)
        Result.success(listOf(mockCitation))
    }

    viewModel.uiState.test {
        // First emission: the initial value (Loading from init block)
        assertThat(awaitItem()).isInstanceOf(CitationListUiState.Loading::class.java)

        viewModel.loadCitations()

        // After loading: Success (delay(100) completes due to runTest's virtual time)
        assertThat(awaitItem()).isInstanceOf(CitationListUiState.Success::class.java)

        cancelAndIgnoreRemainingEvents()
    }
}

// Testing Room Flow (requires in-memory database — see integration tests):
@Test
fun `observeAllCitations - emits new list when citation inserted`() = runTest {
    dao.observeAllCitations("USR-001").test {
        // Initial emission: empty list
        assertThat(awaitItem()).isEmpty()

        dao.insertCitation(CitationEntity(id = "CIT-001", ownerId = "USR-001", ...))

        // After insert: list with one item
        val updatedList = awaitItem()
        assertThat(updatedList).hasSize(1)
        assertThat(updatedList[0].id).isEqualTo("CIT-001")

        cancelAndIgnoreRemainingEvents()
    }
}
```

### Turbine API Summary

```kotlin
// COLLECTING:
flow.test {          // starts collecting, provides TurbineTestContext
    awaitItem()      // wait for next emission
    awaitComplete()  // wait for Flow to complete (onCompletion)
    awaitError()     // wait for Flow to throw an error
    expectNoEvents() // assert no emissions occurred
    cancelAndIgnoreRemainingEvents()  // stop collecting
    cancelAndConsumeRemainingEvents() // stop and return remaining items
    ensureAllEventsConsumed()         // fail if any unconsumed items remain
}

// MULTIPLE FLOWS at once:
turbineScope {
    val flow1 = viewModel.uiState.testIn(this)
    val flow2 = viewModel.events.testIn(this)

    viewModel.loadCitations()

    flow1.awaitItem()  // Loading
    flow1.awaitItem()  // Success
    flow2.awaitItem()  // some event emitted

    flow1.cancelAndIgnoreRemainingEvents()
    flow2.cancelAndIgnoreRemainingEvents()
}
```

---

## 8. Testing Use Cases

Use cases (interactors) contain business logic and coordinate between repositories. They are pure Kotlin — no Android dependencies.

```kotlin
class FetchCitationsUseCase(
    private val citationRepository: CitationRepository,
    private val userRepository: UserRepository
) {
    // Returns only citations for the currently logged-in user
    suspend operator fun invoke(): Result<List<Citation>> {
        val userId = userRepository.getCurrentUserId()
            ?: return Result.failure(AppException.Unauthorized())
        return citationRepository.fetchCitations(userId)
    }
}

// ─── TEST ─────────────────────────────────────────────────────────────────────

class FetchCitationsUseCaseTest {

    private val mockCitationRepository: CitationRepository = mockk()
    private val mockUserRepository: UserRepository = mockk()
    private lateinit var useCase: FetchCitationsUseCase

    @BeforeEach
    fun setup() {
        useCase = FetchCitationsUseCase(mockCitationRepository, mockUserRepository)
    }

    @Test
    fun `invoke - user is logged in - returns citations for that user`() = runBlocking {
        val userId = "USR-001"
        val citations = listOf(
            Citation(id = "CIT-001", status = CitationStatus.PENDING),
            Citation(id = "CIT-002", status = CitationStatus.PAID)
        )
        every { mockUserRepository.getCurrentUserId() } returns userId
        coEvery { mockCitationRepository.fetchCitations(userId) } returns
            Result.success(citations)

        val result = useCase()

        assertTrue(result.isSuccess)
        assertThat(result.getOrNull()).hasSize(2)

        // Verify the correct userId was passed to the repository:
        coVerify(exactly = 1) { mockCitationRepository.fetchCitations(userId) }
    }

    @Test
    fun `invoke - no user logged in - returns Unauthorized failure`() = runBlocking {
        every { mockUserRepository.getCurrentUserId() } returns null

        val result = useCase()

        assertTrue(result.isFailure)
        assertThat(result.exceptionOrNull()).isInstanceOf(AppException.Unauthorized::class.java)

        // Repository should NOT be called if no user:
        coVerify(exactly = 0) { mockCitationRepository.fetchCitations(any()) }
    }

    @Test
    fun `invoke - repository fails - propagates failure`() = runBlocking {
        every { mockUserRepository.getCurrentUserId() } returns "USR-001"
        coEvery { mockCitationRepository.fetchCitations(any()) } returns
            Result.failure(NetworkException.NoConnectivity())

        val result = useCase()

        assertTrue(result.isFailure)
        assertThat(result.exceptionOrNull())
            .isInstanceOf(NetworkException.NoConnectivity::class.java)
    }
}
```

### Testing Business Logic Use Cases

```kotlin
class CalculateLateFeeUseCase {
    operator fun invoke(citation: Citation, currentDate: LocalDate): Double {
        if (citation.status == CitationStatus.PAID) return 0.0

        val daysOverdue = ChronoUnit.DAYS.between(citation.dueDate.toLocalDate(), currentDate)
        if (daysOverdue <= 0) return 0.0

        return when {
            daysOverdue <= 30  -> citation.amount * 0.10   // 10% fee
            daysOverdue <= 90  -> citation.amount * 0.20   // 20% fee
            else               -> citation.amount * 0.30   // 30% fee
        }
    }
}

class CalculateLateFeeUseCaseTest {

    private val useCase = CalculateLateFeeUseCase()
    private val today = LocalDate.of(2024, 3, 15)
    private val baseCitation = Citation(
        id = "CIT-001",
        amount = 100.0,
        status = CitationStatus.PENDING,
        dueDate = LocalDateTime.of(2024, 1, 1, 0, 0)  // Jan 1, 2024 = 74 days ago
    )

    @Test
    fun `invoke - citation is PAID - returns zero fee`() {
        val paidCitation = baseCitation.copy(status = CitationStatus.PAID)
        assertEquals(0.0, useCase(paidCitation, today), 0.001)
    }

    @Test
    fun `invoke - citation not yet overdue - returns zero fee`() {
        val futureDueCitation = baseCitation.copy(
            dueDate = LocalDateTime.of(2024, 3, 20, 0, 0)  // due in 5 days
        )
        assertEquals(0.0, useCase(futureDueCitation, today), 0.001)
    }

    @Test
    fun `invoke - overdue by 1 day - applies 10 percent fee`() {
        val yesterday = today.minusDays(1)
        val citation = baseCitation.copy(dueDate = yesterday.atStartOfDay())
        assertEquals(10.0, useCase(citation, today), 0.001)  // 10% of 100
    }

    @Test
    fun `invoke - overdue by 30 days - applies 10 percent fee`() {
        val thirtyDaysAgo = today.minusDays(30)
        val citation = baseCitation.copy(dueDate = thirtyDaysAgo.atStartOfDay())
        assertEquals(10.0, useCase(citation, today), 0.001)
    }

    @Test
    fun `invoke - overdue by 31 days - applies 20 percent fee`() {
        val thirtyOneDaysAgo = today.minusDays(31)
        val citation = baseCitation.copy(dueDate = thirtyOneDaysAgo.atStartOfDay())
        assertEquals(20.0, useCase(citation, today), 0.001)
    }

    @Test
    fun `invoke - overdue by 91 days - applies 30 percent fee`() {
        val ninetyOneDaysAgo = today.minusDays(91)
        val citation = baseCitation.copy(dueDate = ninetyOneDaysAgo.atStartOfDay())
        assertEquals(30.0, useCase(citation, today), 0.001)
    }
}
```

---

## 9. Testing Mappers and Pure Functions

Mappers (DTO → Domain, Entity → Domain) are pure functions — no mocking needed.

```kotlin
class CitationDtoMapperTest {

    @Test
    fun `toDomain - maps status code P to PENDING`() {
        val dto = CitationDto(
            citationId = "CIT-001", citationNumber = "CN-001",
            amount = 150.0, statusCode = "P",
            issuedTimestamp = 1704067200L, dueTimestamp = 1706745600L,
            description = "Parking violation"
        )

        val domain = dto.toDomain()

        assertEquals("CIT-001", domain.id)
        assertEquals(CitationStatus.PENDING, domain.status)
        assertEquals(150.0, domain.amount, 0.001)
    }

    @Test
    fun `toDomain - maps status code PD to PAID`() {
        val dto = CitationDto(citationId = "CIT-001", statusCode = "PD", ...)
        assertEquals(CitationStatus.PAID, dto.toDomain().status)
    }

    @Test
    fun `toDomain - maps status code OD to OVERDUE`() {
        val dto = CitationDto(citationId = "CIT-001", statusCode = "OD", ...)
        assertEquals(CitationStatus.OVERDUE, dto.toDomain().status)
    }

    @Test
    fun `toDomain - unknown status code - throws IllegalArgumentException`() {
        val dto = CitationDto(citationId = "CIT-001", statusCode = "UNKNOWN", ...)
        assertThrows<IllegalArgumentException> { dto.toDomain() }
    }

    @Test
    fun `toDomain - converts epoch seconds to LocalDateTime correctly`() {
        // issuedTimestamp = 1704067200 = 2024-01-01T00:00:00 UTC
        val dto = CitationDto(
            citationId = "CIT-001", statusCode = "P",
            issuedTimestamp = 1704067200L, ...
        )
        val domain = dto.toDomain()
        assertEquals(2024, domain.issuedDate.year)
        assertEquals(1, domain.issuedDate.monthValue)
        assertEquals(1, domain.issuedDate.dayOfMonth)
    }
}
```

---

## 10. Testing the Repository Layer

Repository tests use a real fake or in-memory implementation for the data source, not a mock:

```kotlin
class CitationRepositoryTest {

    private val fakeApi = FakeCitationApi()   // fake (not mock) — see Section 11
    private val fakeLocalDao = FakeCitationDao()
    private lateinit var repository: CitationRepository

    @BeforeEach
    fun setup() {
        repository = CitationRepository(fakeApi, fakeLocalDao)
    }

    @Test
    fun `fetchCitations - remote succeeds - caches in local database`() = runBlocking {
        val remoteCitations = listOf(
            CitationDto(citationId = "CIT-001", statusCode = "P", amount = 150.0, ...)
        )
        fakeApi.setCitations(remoteCitations)

        val result = repository.fetchCitations("USR-001")

        // Verify result:
        assertTrue(result.isSuccess)
        assertEquals(1, result.getOrNull()!!.size)

        // Verify caching: local DAO should have been written to:
        assertEquals(1, fakeLocalDao.getAllCitations().size)
        assertEquals("CIT-001", fakeLocalDao.getAllCitations()[0].id)
    }

    @Test
    fun `fetchCitations - remote fails - returns cached local data`() = runBlocking {
        // Pre-populate cache:
        fakeLocalDao.insertCitation(CitationEntity(id = "CIT-001", ...))
        fakeApi.setError(NetworkException.NoConnectivity())

        val result = repository.fetchCitations("USR-001")

        // Should return cached data despite network failure:
        assertTrue(result.isSuccess)
        assertEquals("CIT-001", result.getOrNull()!![0].id)
    }

    @Test
    fun `fetchCitations - remote and cache both fail - returns failure`() = runBlocking {
        fakeApi.setError(NetworkException.NoConnectivity())
        // cache is empty

        val result = repository.fetchCitations("USR-001")

        assertTrue(result.isFailure)
    }
}
```

---

## 11. Test Doubles — Fake vs Mock vs Stub vs Spy

These terms are precise. Using the right double makes tests more readable and maintainable.

```
TERM        WHAT IT IS                           WHEN TO USE
──────────  ───────────────────────────────────  ──────────────────────────────────────
Dummy       Object passed but never used          Constructor args you don't care about
Stub        Returns hardcoded value               When you need a specific return value
            No verification                       and don't care about interactions
Mock        Pre-programmed expectations           When you need to verify an interaction
            Verifies calls were made              happened (e.g., "was this API called?")
Spy         Wraps real object, can override       When you want real behavior except
            specific methods                      for one or two methods
Fake        Simplified real implementation        When the real dependency is complex
            Works in-memory without              or slow (database, API) but you want
            external dependencies                realistic behavior, not just returns

RULE OF THUMB:
  Use Fake for: repositories, DAOs (use in-memory), API services (use FakeApi)
  Use Mock for: verifying interactions (was this email sent? was this metric tracked?)
  Use Stub for: simple return values in ViewModel/UseCase tests
```

### Writing a Fake

```kotlin
// FakeCitationRepository — used in ViewModel and UseCase tests
class FakeCitationRepository : CitationRepository {

    // In-memory storage — acts like a real database
    private val storedCitations = mutableListOf<Citation>()
    private var shouldReturnError = false
    private var errorToReturn: Exception = NetworkException.NoConnectivity()

    // Test control methods (not part of the interface):
    fun addCitation(citation: Citation) { storedCitations.add(citation) }
    fun setError(error: Exception) { shouldReturnError = true; errorToReturn = error }
    fun clearAll() { storedCitations.clear(); shouldReturnError = false }

    // Interface implementation:
    override suspend fun fetchCitations(userId: String): Result<List<Citation>> {
        if (shouldReturnError) return Result.failure(errorToReturn)
        return Result.success(storedCitations.filter { it.ownerId == userId }.toList())
    }

    override fun observeAllCitations(userId: String): Flow<List<Citation>> {
        return flow {
            emit(storedCitations.filter { it.ownerId == userId }.toList())
        }
    }

    override suspend fun insertCitation(citation: Citation) {
        storedCitations.removeIf { it.id == citation.id }  // replace if exists
        storedCitations.add(citation)
    }
}

// In tests — much more readable than mocks for complex behavior:
class PaymentViewModelTest {
    private val fakeRepository = FakeCitationRepository()
    private lateinit var viewModel: PaymentViewModel

    @BeforeEach
    fun setup() {
        fakeRepository.clearAll()
        fakeRepository.addCitation(
            Citation(id = "CIT-001", amount = 150.0, status = CitationStatus.PENDING)
        )
        viewModel = PaymentViewModel(fakeRepository)
    }

    @Test
    fun `payment succeeds - citation status changes to PAID`() = runTest {
        viewModel.pay("CIT-001", 150.0)
        advanceUntilIdle()

        // Verify the fake's in-memory state was updated:
        val updatedCitation = fakeRepository.getCitationById("CIT-001")
        assertEquals(CitationStatus.PAID, updatedCitation?.status)
    }
}
```

---

## 12. Parameterized Tests — Test Many Cases with One Method

When you have many input/output combinations, parameterized tests prevent code duplication.

```kotlin
// JUnit 5 parameterized test:
@ParameterizedTest
@MethodSource("citationStatusMappingArguments")
fun `toDomain - correctly maps all API status codes`(
    apiStatusCode: String,
    expectedDomainStatus: CitationStatus
) {
    val dto = CitationDto(citationId = "CIT-001", statusCode = apiStatusCode, ...)
    assertEquals(expectedDomainStatus, dto.toDomain().status)
}

companion object {
    @JvmStatic
    fun citationStatusMappingArguments(): Stream<Arguments> = Stream.of(
        Arguments.of("P",  CitationStatus.PENDING),
        Arguments.of("PD", CitationStatus.PAID),
        Arguments.of("OD", CitationStatus.OVERDUE),
        Arguments.of("C",  CitationStatus.CANCELLED)
    )
}

// Inline value source (simpler for single parameter):
@ParameterizedTest
@ValueSource(strings = ["UNKNOWN", "X", "", "pending", "PAID_MAYBE"])
fun `toDomain - unknown status codes - throw IllegalArgumentException`(
    invalidCode: String
) {
    val dto = CitationDto(citationId = "CIT-001", statusCode = invalidCode, ...)
    assertThrows<IllegalArgumentException> { dto.toDomain() }
}

// CSV-based (quick inline test cases):
@ParameterizedTest
@CsvSource(
    "100.0, 1,   10.0",   // amount, daysOverdue, expectedFee
    "100.0, 30,  10.0",
    "100.0, 31,  20.0",
    "100.0, 90,  20.0",
    "100.0, 91,  30.0",
    "200.0, 15,  20.0"    // different amount
)
fun `calculateLateFee - returns correct fee for each overdue period`(
    amount: Double,
    daysOverdue: Long,
    expectedFee: Double
) {
    val citation = Citation(
        amount = amount,
        dueDate = LocalDateTime.now().minusDays(daysOverdue),
        status = CitationStatus.PENDING
    )
    assertEquals(expectedFee, useCase(citation, LocalDate.now()), 0.001)
}
```

---

## 13. Test Organization — What to Test and What Not To

### What ALWAYS needs tests

```
✓ Business logic (fee calculations, status transitions, validation rules)
✓ Use cases — every branch, success and failure
✓ ViewModel state transitions — Loading → Success, Loading → Error, Empty
✓ ViewModel events — navigation, snackbar emissions
✓ Mappers — every status code, every edge case in field mapping
✓ Repository error handling — network errors, 4xx/5xx, parse errors
✓ Edge cases: empty lists, null values, maximum values, minimum values
✓ Boundary conditions: overdue by exactly 1 day vs 0 days
```

### What Does NOT need unit tests

```
✗ Simple data classes (no logic):
  data class Citation(val id: String, val amount: Double)
  → Nothing to test — the compiler verifies this

✗ Single-line pass-through functions:
  fun getCitation(id: String) = repository.getCitation(id)
  → Test this via the ViewModel or integration test

✗ Android framework code (UI layout, navigation setup):
  → Test via Compose UI tests or Espresso

✗ DI module bindings (Hilt modules):
  → Trust Hilt's compile-time verification

✗ Logging statements:
  → Not business logic
```

### File Structure — Mirror Your Source Tree

```
src/
  main/
    kotlin/
      com.myapp/
        domain/
          usecase/
            FetchCitationsUseCase.kt
            CalculateLateFeeUseCase.kt
        presentation/
          citations/
            CitationListViewModel.kt
        data/
          repository/
            CitationRepositoryImpl.kt

test/
  kotlin/
    com.myapp/
      domain/
        usecase/
          FetchCitationsUseCaseTest.kt     ← mirrors source
          CalculateLateFeeUseCaseTest.kt
      presentation/
        citations/
          CitationListViewModelTest.kt     ← mirrors source
      data/
        repository/
          CitationRepositoryTest.kt        ← mirrors source
```

---

## 14. Common Unit Testing Mistakes

### Mistake 1: Testing Implementation, Not Behavior

```kotlin
// WRONG — test is tightly coupled to internal implementation:
@Test
fun `loadCitations calls fetchCitationsUseCase`() = runTest {
    viewModel.loadCitations()
    coVerify { fetchCitationsUseCase() }  // only verifies method was called
    // This test passes even if the result is ignored and state never updates
}

// CORRECT — test behavior (what the user experiences):
@Test
fun `loadCitations - success - state contains citations from use case`() = runTest {
    coEvery { fetchCitationsUseCase() } returns Result.success(citations)
    viewModel.loadCitations()
    assertThat(viewModel.uiState.value)
        .isInstanceOf(CitationListUiState.Success::class.java)
    // The interaction (calling the use case) is implied by the observable behavior
}
```

### Mistake 2: Not Resetting Mocks Between Tests

```kotlin
// WRONG — mock state leaks between tests:
class MyTest {
    val mockRepo: CitationRepository = mockk()  // created ONCE, shared across tests
    // If test A stubs fetchCitations() and test B doesn't, test B might use test A's stub
}

// CORRECT — fresh mock per test:
class MyTest {
    lateinit var mockRepo: CitationRepository

    @BeforeEach
    fun setup() {
        mockRepo = mockk()  // new mock before EVERY test
    }
}
// OR: use MockKAnnotations.init(this) with clearAllMocks() in @AfterEach
```

### Mistake 3: asserting True/False on Object Equality

```kotlin
// WRONG — unhelpful failure message:
assertTrue(result.getOrNull()?.id == "CIT-001")
// Failure: "expected true but was false" — tells you nothing

// CORRECT — Truth or assertEquals give useful failure messages:
assertThat(result.getOrNull()?.id).isEqualTo("CIT-001")
// Failure: "expected: CIT-001, but was: null" — immediately actionable
```

---

## 15. Interview Q&A

**Q: "What is the difference between a Mock, Stub, and Fake?"**

> "These are three types of test doubles with different purposes. A Stub provides canned responses to method calls — you set 'when this is called, return that value' and the stub doesn't track or verify anything. A Mock also provides responses but additionally verifies that specific interactions happened — 'was this method called exactly once?' A Fake is a working lightweight implementation of an interface, like an in-memory database instead of a real one. For most of my ViewModel and UseCase tests I use stubs (MockK's `coEvery`) — I just need specific return values. I use mocks when I need to verify a side-effect happened (an analytics event was tracked). I use fakes for repositories in integration tests where I want realistic behavior without a real database or network."

**Q: "How do you test a ViewModel that uses coroutines?"**

> "There are two problems to solve: first, ViewModels default to `Dispatchers.Main` which doesn't exist in unit tests. I solve this with a `MainDispatcherRule` (JUnit 4) or `MainDispatcherExtension` (JUnit 5) that replaces `Dispatchers.Main` with a `TestDispatcher` before each test. Second, coroutines run asynchronously but tests are synchronous. I use `runTest { }` from `kotlinx-coroutines-test` which runs all coroutines in a virtual time environment. `UnconfinedTestDispatcher` runs coroutines eagerly so I don't need to advance time for simple tests. `StandardTestDispatcher` gives me control over timing for testing intermediate states or debounced behavior. For testing Flow emissions, I use Turbine's `.test { }` which gives a clean API for awaiting and asserting on each emitted item."

**Q: "How do you decide what to unit test?"**

> "I focus on behavior that has business value and meaningful decision points. Business logic functions — fee calculations, validation rules, status transitions — always get tested with full boundary analysis. Use cases get tested for every execution path: success, each failure type, authentication state. ViewModels get tested for every state transition and every event emission. Mappers get tested for every enum mapping and every edge case in type conversion. I don't write tests for simple data classes, single-line delegating functions, or framework boilerplate — those have no logic to verify. The heuristic: if a bug in this function could reach a user and affect their experience or data, test it."

---

**Next in this folder**: [08_Instrumented_And_UI_Tests.md](./08_Instrumented_And_UI_Tests.md) — Android instrumented tests, Espresso for XML views, Compose UI tests, and end-to-end testing strategies.

**Back to**: [Android folder index](./) | [Series index](../)


---

## Reality Check

**"Unit tests on Android need the emulator"** — True unit tests run on the JVM with NO device/emulator ([03 ViewModel]'s testability point, [13_DE testing]'s pyramid): the pure-logic tests (the ViewModel, the domain logic, the utility functions — fast, milliseconds, no Android framework), versus the instrumented tests ([08] that DO need a device for framework-dependent code). The architecture that separates testable-logic from framework-code ([01 architecture]) is what enables the fast JVM unit tier — and the sign of poor architecture is logic so tangled in Activities/framework classes that it CANNOT be unit-tested without a device. "Need the emulator" is true for framework-dependent code and false for the well-architected logic that is most of what should be unit-tested — and if your units need the emulator, the coupling is the design problem.

**"Mockito mocks everything, so tests are easy"** — Over-mocking produces tests that verify their own wiring, not behavior ([13_DE testing]'s mock lesson, Android flavor): the test that mocks so much it tests the mock's configuration (the [13_DE] mock-of-a-mock, the interaction-scripted test that breaks on every refactor), the mocking of what should be real (the value objects, the simple data classes mocked for no reason), and the mocking that hides the real integration bug (the mocked repository that returns clean data, hiding the parsing/null bug [06] the real one would surface). The discipline mirrors [13_DE testing]: mock at the boundaries (the network, the database — the slow/external), use real objects for the logic under test and its value collaborators, prefer fakes-with-behavior over interaction-scripted mocks. "Mocks everything therefore easy" produces brittle, wiring-testing tests — the skill is mocking the boundaries and testing real behavior.

**"Testing coroutines and Flow is like testing sync code"** — Async testing needs specific tooling and has specific traps ([25_Python asyncio, 16_JS async]'s test lessons, Kotlin flavor): the test dispatchers (the coroutine that must run on a controllable test dispatcher, not the real one — the runTest and the dispatcher injection, the test that hangs or races without it), the virtual time (the delay that should not actually wait — the test clock advancing time, the [21_SDET Ch61] clock lesson), the Flow collection (the StateFlow/Flow asserted with the turbine-style collection or the test collectors — the emission-over-time that sync assertions cannot check), and the main-dispatcher rule (the ViewModel's viewModelScope that needs the main dispatcher replaced in tests). "Like sync code" produces the hanging test, the racy test, and the test that actually waits for real delays — async testing on Android needs the dispatcher injection, the virtual time, and the Flow-collection tooling, and skipping them gives flaky or slow async tests.

**"High test coverage means the logic is correct"** — Coverage measures execution, not verification ([13_DE testing, 25_Python]'s coverage lesson): the test that executes the code and asserts nothing meaningful (the [13_DE] vacuous test), the test that covers the happy path and misses the edges ([05_Problem_Solving/23] edge cases — the null, the empty, the error), the test coupled to implementation that breaks on refactor without catching bugs ([13_DE] implementation-coupling), and the coverage that includes trivial getters while missing the complex logic's branches. The Android-specific version: the coverage that is all fast unit tests missing the integration and lifecycle bugs ([02, 08] — the lifecycle and framework-integration failures that unit tests structurally cannot see). "High coverage therefore correct" is the [13_DE] coverage-theater — coverage is a floor for finding untested code, not evidence of correctness, and the mutation-testing question ([21_SDET Ch53] — would the tests catch a deliberate bug) is the real quality measure.

**"Fast unit tests are enough for confidence"** — Unit tests cover logic and MISS the Android-specific failure classes ([08]'s integration tests, [02] lifecycle): the lifecycle bugs (the config-change, process-death scenarios [02] — untestable in pure JVM units), the framework integration (the actual Room query, the real navigation, the real Compose recomposition — the [08] instrumented tier), the UI behavior (the [21_SDET] behavior on the real view hierarchy), and the device-specific issues ([02 Android] fragmentation, [Ch61] real-device). The [13_DE testing] pyramid applies: many fast unit tests (logic), a layer of instrumented/integration tests (framework, lifecycle), a thin UI/E2E tier (critical flows on device). "Fast unit tests enough" is the incomplete-pyramid confidence — the lifecycle, integration, and device failures that dominate mobile bugs live above the unit tier, and a suite that is all fast units has high coverage of logic and no coverage of Android's hardest, most-common failure modes.
