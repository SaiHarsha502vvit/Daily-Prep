# Android — Instrumented Tests, Espresso, and End-to-End Testing

**Folder**: [03_Android](./) | **Previous**: [07_Unit_Tests_JUnit_Mockito.md](./07_Unit_Tests_JUnit_Mockito.md) | **Next**: [09_Dependency_Injection_Hilt.md](./09_Dependency_Injection_Hilt.md)

> **Reading contract**: Instrumented tests run on a real Android device or emulator. They are slower than unit tests but test what users actually experience: real UI, real database, real navigation. This file covers: the difference between unit and instrumented tests, Espresso for XML-based UIs, Compose UI tests for Compose-based UIs, testing navigation, testing with fake dependencies using Hilt test modules, and end-to-end test strategy. This is the layer of testing that catches integration failures that unit tests cannot.

---

## Table of Contents

1. [Instrumented vs Unit Tests — The Core Distinction](#1-instrumented-vs-unit-tests--the-core-distinction)
2. [Test Configuration — The androidTest Directory](#2-test-configuration--the-androidtest-directory)
3. [Espresso — XML View UI Testing](#3-espresso--xml-view-ui-testing)
4. [Espresso API — Finders, Matchers, Actions, Assertions](#4-espresso-api--finders-matchers-actions-assertions)
5. [Compose UI Tests — Testing Compose Screens](#5-compose-ui-tests--testing-compose-screens)
6. [Testing Navigation](#6-testing-navigation)
7. [Testing with Hilt — Replacing Dependencies in Tests](#7-testing-with-hilt--replacing-dependencies-in-tests)
8. [Integration Testing — Room + Repository + ViewModel](#8-integration-testing--room--repository--viewmodel)
9. [End-to-End Test Strategy — What to Automate](#9-end-to-end-test-strategy--what-to-automate)
10. [Test Configuration — Build Variants and Test Flavors](#10-test-configuration--build-variants-and-test-flavors)
11. [Common Instrumented Test Failures](#11-common-instrumented-test-failures)
12. [Interview Q&A](#12-interview-qa)

---

## 1. Instrumented vs Unit Tests — The Core Distinction

```
UNIT TESTS (test/ directory):
  Run on: JVM (your machine, CI server)
  Speed: Milliseconds per test
  Dependencies: Mocked (MockK, Fake objects)
  Android framework: NOT available (no Context, no Activity)
  Good for: Business logic, ViewModels, use cases, mappers

INSTRUMENTED TESTS (androidTest/ directory):
  Run on: Real device or Android emulator
  Speed: Seconds per test (device startup, install, run)
  Dependencies: Can use real Android components
  Android framework: FULLY available (Context, Activity, Fragment, Database)
  Good for: UI behavior, database queries, navigation, real integration paths
```

### When a Test Must Be Instrumented

```kotlin
// These REQUIRE instrumented tests (cannot run on JVM):

// 1. Room database (SQLite requires Android):
Room.inMemoryDatabaseBuilder(context, AppDatabase::class.java).build()
// → context is a real Android ApplicationContext — JVM cannot provide this

// 2. UI testing (Espresso, Compose tests):
onView(withId(R.id.payButton)).perform(click())
composeTestRule.onNodeWithText("Pay Now").performClick()
// → requires a running Activity/Fragment

// 3. Navigation (NavController requires Activity):
findNavController().navigate(...)
// → requires a real Fragment lifecycle on a real Activity

// 4. SharedPreferences, DataStore, ContentProvider
// → depend on the Android file system

// 5. SQLite migrations (require the full Android SQLite implementation)
```

---

## 2. Test Configuration — The androidTest Directory

```
app/
  src/
    main/         ← production code
    test/         ← unit tests (JVM)
    androidTest/  ← instrumented tests (device/emulator)
      kotlin/
        com.myapp/
          CitationDaoTest.kt        ← Room integration test
          CitationListScreenTest.kt ← Compose UI test
          PaymentFlowTest.kt        ← end-to-end flow test
          HiltTestRunner.kt         ← custom runner for Hilt DI
```

```kotlin
// build.gradle.kts — instrumented test dependencies:
dependencies {
    // Base:
    androidTestImplementation("androidx.test.ext:junit:1.2.1")
    androidTestImplementation("androidx.test:runner:1.6.1")
    androidTestImplementation("androidx.test:rules:1.6.1")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.6.1")

    // Compose UI tests:
    androidTestImplementation("androidx.compose.ui:ui-test-junit4:$composeVersion")
    debugImplementation("androidx.compose.ui:ui-test-manifest:$composeVersion")

    // Navigation:
    androidTestImplementation("androidx.navigation:navigation-testing:2.8.4")

    // Hilt test support:
    androidTestImplementation("com.google.dagger:hilt-android-testing:$hiltVersion")
    kaptAndroidTest("com.google.dagger:hilt-android-compiler:$hiltVersion")

    // MockK (can be used in instrumented tests too):
    androidTestImplementation("io.mockk:mockk-android:1.13.12")

    // Coroutines test:
    androidTestImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.8.1")
}
```

---

## 3. Espresso — XML View UI Testing

Espresso is Google's UI testing framework for View-based (XML) Android UIs. It synchronizes with the UI thread automatically — no `sleep()` needed.

### How Espresso Synchronization Works

```
ESPRESSO'S GUARANTEE:
Before executing any action or assertion, Espresso waits for:
  1. The main thread to be idle (no pending UI work)
  2. AsyncTask pool to be idle (legacy async)
  3. No pending animations

This means you never need Thread.sleep() in Espresso tests.
If your code uses coroutines, you may need to configure IdlingResources
or use the HiltTestRunner with coroutine test support.
```

### Basic Espresso Test

```kotlin
@RunWith(AndroidJUnit4::class)
@LargeTest  // @SmallTest = fast, @MediumTest = medium, @LargeTest = slow UI tests
class CitationListActivityTest {

    // ActivityScenarioRule launches the Activity before each test and closes it after
    @get:Rule
    val activityRule = ActivityScenarioRule(CitationListActivity::class.java)

    @Test
    fun citationList_displaysCorrectly_whenCitationsLoaded() {
        // Espresso waits for UI to be idle before each interaction

        // Verify toolbar title is displayed:
        onView(withId(R.id.toolbar_title))
            .check(matches(withText("My Citations")))

        // Verify RecyclerView is displayed:
        onView(withId(R.id.citations_recycler_view))
            .check(matches(isDisplayed()))
    }

    @Test
    fun payButton_opensPaymentScreen_whenCitationIsClicked() {
        // Scroll RecyclerView to the item and click it:
        onView(withId(R.id.citations_recycler_view))
            .perform(
                RecyclerViewActions.actionOnItemAtPosition<RecyclerView.ViewHolder>(
                    0,
                    click()
                )
            )

        // After click, verify navigation occurred — Payment screen is now shown:
        onView(withId(R.id.payment_amount_text))
            .check(matches(isDisplayed()))
    }

    @Test
    fun searchBar_filtersResults_whenQueryEntered() {
        // Type in search bar:
        onView(withId(R.id.search_input))
            .perform(
                click(),
                typeText("CIT-001"),
                closeSoftKeyboard()
            )

        // Verify only matching citations shown:
        onView(withText("CIT-001")).check(matches(isDisplayed()))
        // Non-matching citation is not displayed:
        onView(withText("CIT-002")).check(doesNotExist())
    }

    @Test
    fun paymentForm_showsValidationError_whenAmountIsEmpty() {
        // Navigate to payment screen:
        onView(withId(R.id.citations_recycler_view))
            .perform(RecyclerViewActions.actionOnItemAtPosition<RecyclerView.ViewHolder>(0, click()))

        // Clear the amount field and try to submit:
        onView(withId(R.id.payment_amount_field))
            .perform(clearText())

        onView(withId(R.id.submit_payment_button))
            .perform(click())

        // Verify validation error is shown:
        onView(withId(R.id.amount_error_text))
            .check(matches(isDisplayed()))
            .check(matches(withText("Please enter a valid amount")))

        // Verify we're still on payment screen (did not navigate):
        onView(withId(R.id.submit_payment_button))
            .check(matches(isDisplayed()))
    }
}
```

---

## 4. Espresso API — Finders, Matchers, Actions, Assertions

### ViewMatchers — Finding Views

```kotlin
// By view ID (most reliable):
onView(withId(R.id.pay_button))

// By text content:
onView(withText("Pay Now"))
onView(withText(R.string.pay_button_label))  // string resource

// By hint text (for EditText):
onView(withHint("Enter amount"))

// By content description (accessibility label):
onView(withContentDescription("Close dialog"))

// Combined matchers (AND logic):
onView(allOf(
    withId(R.id.citation_item),
    withText("CIT-001"),
    isDisplayed()
))

// Parent/child relationships:
onView(allOf(withId(R.id.status_badge), isDescendantOfA(withId(R.id.citation_item_001))))

// In a specific RecyclerView item:
onView(withRecyclerView(R.id.citations_recycler_view).atPositionOnView(0, R.id.item_title))
```

### ViewActions — Interacting with Views

```kotlin
// Text input:
onView(withId(R.id.search_field)).perform(click())
onView(withId(R.id.search_field)).perform(typeText("CIT-001"))
onView(withId(R.id.search_field)).perform(replaceText("CIT-002"))  // clear + type
onView(withId(R.id.search_field)).perform(clearText())
onView(withId(R.id.search_field)).perform(closeSoftKeyboard())

// Clicking:
onView(withId(R.id.pay_button)).perform(click())
onView(withId(R.id.pay_button)).perform(longClick())

// Scrolling:
onView(withId(R.id.content_scroll_view)).perform(scrollTo())
onView(withId(R.id.citations_recycler_view))
    .perform(RecyclerViewActions.scrollToPosition<RecyclerView.ViewHolder>(10))

// Swipe:
onView(withId(R.id.swipe_refresh_layout)).perform(swipeDown())

// Press back key:
pressBack()

// Press IME action (Done, Search button on keyboard):
onView(withId(R.id.search_field)).perform(pressImeActionButton())
```

### ViewAssertions — Verifying the Result

```kotlin
// Existence:
onView(withId(R.id.error_view)).check(matches(isDisplayed()))
onView(withId(R.id.error_view)).check(matches(not(isDisplayed())))  // hidden
onView(withId(R.id.error_view)).check(doesNotExist())               // not in view tree

// Text:
onView(withId(R.id.citation_title)).check(matches(withText("CIT-001")))
onView(withId(R.id.amount_text)).check(matches(withText(containsString("150"))))

// State:
onView(withId(R.id.pay_button)).check(matches(isEnabled()))
onView(withId(R.id.pay_button)).check(matches(not(isEnabled())))
onView(withId(R.id.checkbox)).check(matches(isChecked()))
onView(withId(R.id.spinner)).check(matches(isSelected()))

// RecyclerView item count:
onView(withId(R.id.citations_recycler_view))
    .check(RecyclerViewItemCountAssertion(expectedCount = 5))
```

---

## 5. Compose UI Tests — Testing Compose Screens

For Compose-based UIs, use the Compose UI test library instead of Espresso. (Covered also in File 04, but with more test strategy context here.)

```kotlin
@RunWith(AndroidJUnit4::class)
class CitationListScreenTest {

    @get:Rule
    val composeTestRule = createAndroidComposeRule<MainActivity>()
    // OR: createComposeRule() for testing a single composable without an Activity

    @Test
    fun citationListScreen_showsLoadingSpinner_initially() {
        // The loading spinner should be visible when screen first loads
        composeTestRule
            .onNodeWithContentDescription("Loading citations")
            .assertIsDisplayed()
    }

    @Test
    fun citationListScreen_showsCitations_afterLoad() {
        // Wait for loading to complete:
        composeTestRule.waitUntil(timeoutMillis = 5_000) {
            composeTestRule
                .onAllNodesWithTag("citation_item")
                .fetchSemanticsNodes().isNotEmpty()
        }

        // Verify citations are displayed:
        composeTestRule
            .onAllNodesWithTag("citation_item")
            .assertCountEquals(expectedCount)
    }

    @Test
    fun citationListScreen_searchFilter_narrowsResults() {
        // Wait for list to load:
        composeTestRule.waitUntil(timeoutMillis = 5_000) {
            composeTestRule.onAllNodesWithTag("citation_item")
                .fetchSemanticsNodes().isNotEmpty()
        }

        // Type in search:
        composeTestRule
            .onNodeWithTag("search_input")
            .performTextInput("CIT-001")

        // Verify filter applied:
        composeTestRule.waitUntil(timeoutMillis = 2_000) {
            composeTestRule.onAllNodesWithTag("citation_item")
                .fetchSemanticsNodes().size == 1
        }
        composeTestRule.onNodeWithText("CIT-001").assertIsDisplayed()
    }

    @Test
    fun citationListScreen_clickCitation_navigatesToDetail() {
        // Wait for list:
        composeTestRule.waitUntil(5_000) {
            composeTestRule.onAllNodesWithTag("citation_item")
                .fetchSemanticsNodes().isNotEmpty()
        }

        // Click first citation:
        composeTestRule
            .onAllNodesWithTag("citation_item")[0]
            .performClick()

        // Verify navigation to detail screen:
        composeTestRule
            .onNodeWithTag("citation_detail_screen")
            .assertIsDisplayed()
    }

    @Test
    fun paymentScreen_emptyAmount_showsValidationError() {
        // Navigate to payment screen (assuming a citation is already loaded):
        composeTestRule.onNodeWithTag("pay_button_CIT-001").performClick()

        // Clear amount and try to submit:
        composeTestRule.onNodeWithTag("payment_amount_field").performTextClearance()
        composeTestRule.onNodeWithTag("submit_payment_button").performClick()

        // Verify error:
        composeTestRule
            .onNodeWithText("Please enter a valid amount")
            .assertIsDisplayed()
    }
}
```

### waitUntil — Handling Async UI

```kotlin
// Compose tests are synchronous but content loads asynchronously (from ViewModel).
// waitUntil polls until the condition is true or timeout expires:

composeTestRule.waitUntil(timeoutMillis = 5_000) {
    composeTestRule
        .onAllNodesWithText("CIT-001")
        .fetchSemanticsNodes().isNotEmpty()
}

// Common timeout values:
//   1_000ms  → for UI state transitions (no network)
//   5_000ms  → for network calls on test server
//   10_000ms → for slow operations (image upload, PDF generation)
```

---

## 6. Testing Navigation

```kotlin
// Testing navigation in isolation (NavController test):
@RunWith(AndroidJUnit4::class)
class NavigationTest {

    @get:Rule
    val composeTestRule = createAndroidComposeRule<MainActivity>()

    private lateinit var navController: NavController

    @Before
    fun setupNavController() {
        composeTestRule.activity.runOnUiThread {
            navController = composeTestRule.activity
                .supportFragmentManager
                .findFragmentById(R.id.nav_host_fragment)
                ?.findNavController()
                ?: throw IllegalStateException("NavController not found")
        }
    }

    @Test
    fun clickCitation_navigatesToDetailDestination() {
        // Wait for list screen:
        composeTestRule.waitUntil(5_000) {
            composeTestRule.onAllNodesWithTag("citation_item")
                .fetchSemanticsNodes().isNotEmpty()
        }

        composeTestRule.onAllNodesWithTag("citation_item")[0].performClick()

        composeTestRule.runOnIdle {
            // Verify the back stack destination changed to the detail screen:
            assertEquals(
                R.id.citationDetailFragment,
                navController.currentDestination?.id
            )
        }
    }

    @Test
    fun pressBack_fromDetailScreen_returnsToListScreen() {
        // Navigate to detail:
        composeTestRule.runOnIdle {
            navController.navigate(R.id.citationDetailFragment,
                bundleOf("citationId" to "CIT-001"))
        }

        // Press back:
        composeTestRule.activityRule.scenario.onActivity {
            it.onBackPressedDispatcher.onBackPressed()
        }

        composeTestRule.runOnIdle {
            assertEquals(R.id.citationListFragment, navController.currentDestination?.id)
        }
    }
}
```

### Testing Compose Navigation

```kotlin
@RunWith(AndroidJUnit4::class)
class ComposeNavigationTest {

    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun navigation_citationList_to_citationDetail() {
        val navController = TestNavHostController(
            ApplicationProvider.getApplicationContext()
        )

        composeTestRule.setContent {
            navController.setViewModelStore(ViewModelStore())
            navController.setGraph(R.navigation.app_nav_graph)

            AppNavHost(navController = navController)
        }

        // Click on a citation in the list:
        composeTestRule.onAllNodesWithTag("citation_item")[0].performClick()

        // Verify navigation:
        composeTestRule.runOnIdle {
            assertEquals(
                "citation/{citationId}",
                navController.currentBackStackEntry?.destination?.route
            )
        }
    }
}
```

---

## 7. Testing with Hilt — Replacing Dependencies in Tests

In instrumented tests, you often need to replace real dependencies (the real API, the real database) with fakes. Hilt provides test modules for this.

```kotlin
// 1. Create a fake module for tests:
@TestInstallIn(
    components = [SingletonComponent::class],
    replaces = [NetworkModule::class]  // replaces the PRODUCTION module
)
@Module
object FakeNetworkModule {

    @Provides
    @Singleton
    fun provideFakeCitationApi(): CitationApiService = FakeCitationApiService()
    // FakeCitationApiService: in-memory, configurable responses, no real network

    @Provides
    @Singleton
    fun provideFakeAuthRepository(): AuthRepository = FakeAuthRepository()
}

// 2. Custom test runner (registers Hilt's component factory):
class HiltTestRunner : AndroidJUnitRunner() {
    override fun newApplication(cl: ClassLoader?, name: String?, context: Context?): Application {
        return super.newApplication(cl, HiltTestApplication::class.java.name, context)
    }
}

// 3. Register in build.gradle.kts:
android {
    defaultConfig {
        testInstrumentationRunner = "com.myapp.HiltTestRunner"
    }
}

// 4. In each test class:
@HiltAndroidTest  // enables Hilt injection in this test
@RunWith(AndroidJUnit4::class)
class CitationListScreenTest {

    @get:Rule(order = 0)
    val hiltRule = HiltAndroidRule(this)

    @get:Rule(order = 1)
    val composeTestRule = createAndroidComposeRule<MainActivity>()

    // Inject the fake API to configure it per test:
    @Inject
    lateinit var fakeCitationApi: FakeCitationApiService

    @Before
    fun setup() {
        hiltRule.inject()  // performs injection into this test class
    }

    @Test
    fun citationListScreen_showsError_whenApiFails() {
        // Configure fake to return an error:
        fakeCitationApi.setError(NetworkException.ServerError(503))

        // Launch the screen:
        composeTestRule.waitUntil(5_000) {
            composeTestRule.onAllNodesWithTag("error_view")
                .fetchSemanticsNodes().isNotEmpty()
        }

        composeTestRule.onNodeWithTag("error_view").assertIsDisplayed()
        composeTestRule.onNodeWithText("Service unavailable").assertIsDisplayed()
    }

    @Test
    fun citationListScreen_showsCitations_whenApiReturnsData() {
        fakeCitationApi.setCitations(listOf(
            CitationDto(citationId = "CIT-001", statusCode = "P", amount = 150.0, ...)
        ))

        composeTestRule.waitUntil(5_000) {
            composeTestRule.onAllNodesWithTag("citation_item")
                .fetchSemanticsNodes().isNotEmpty()
        }

        composeTestRule.onNodeWithText("CIT-001").assertIsDisplayed()
    }
}
```

### Fake API Service — The Test Backbone

```kotlin
// A complete fake that tests can configure:
class FakeCitationApiService : CitationApiService {

    private val citations = mutableListOf<CitationDto>()
    private var error: Exception? = null
    private var latencyMs: Long = 0

    fun setCitations(list: List<CitationDto>) { citations.clear(); citations.addAll(list) }
    fun setError(exception: Exception) { error = exception }
    fun setLatency(ms: Long) { latencyMs = ms }
    fun reset() { citations.clear(); error = null; latencyMs = 0 }

    override suspend fun getCitations(): List<CitationDto> {
        if (latencyMs > 0) delay(latencyMs)
        error?.let { throw it }
        return citations.toList()
    }

    override suspend fun getCitationById(id: String): CitationDto {
        error?.let { throw it }
        return citations.firstOrNull { it.citationId == id }
            ?: throw HttpException(Response.error<CitationDto>(
                404, "{}".toResponseBody("application/json".toMediaType())
            ))
    }

    override suspend fun payCitation(id: String, request: PaymentRequestDto): PaymentResponseDto {
        error?.let { throw it }
        return PaymentResponseDto(receiptId = "RCP-${System.currentTimeMillis()}", ...)
    }
}
```

---

## 8. Integration Testing — Room + Repository + ViewModel

This is the most valuable instrumented test pattern: testing the full data layer working together.

```kotlin
@HiltAndroidTest
@RunWith(AndroidJUnit4::class)
class CitationRepositoryIntegrationTest {

    @get:Rule
    val hiltRule = HiltAndroidRule(this)

    @Inject
    lateinit var db: AppDatabase

    @Inject
    lateinit var fakeCitationApi: FakeCitationApiService

    @Inject
    lateinit var repository: CitationRepository

    @Before
    fun setup() {
        hiltRule.inject()
    }

    @After
    fun teardown() {
        db.close()
    }

    @Test
    fun fetchAndCache_thenOfflineLoad_returnsCache() = runBlocking {
        // Set up: API returns data
        fakeCitationApi.setCitations(listOf(
            CitationDto(citationId = "CIT-001", amount = 150.0, statusCode = "P", ...)
        ))

        // First fetch: hits API, stores in Room
        val onlineResult = repository.fetchCitations("USR-001")
        assertTrue(onlineResult.isSuccess)
        assertEquals(1, onlineResult.getOrNull()!!.size)

        // Simulate offline: API returns error
        fakeCitationApi.setError(NetworkException.NoConnectivity())

        // Second fetch: API fails, but cached data available
        val offlineResult = repository.fetchCitations("USR-001")
        assertTrue(offlineResult.isSuccess)
        assertEquals(1, offlineResult.getOrNull()!!.size)
        assertEquals("CIT-001", offlineResult.getOrNull()!![0].id)
    }

    @Test
    fun observeCitations_emitsNewData_whenApiDataChanges() = runBlocking {
        val userId = "USR-001"
        val emittedLists = mutableListOf<List<Citation>>()

        val job = launch {
            repository.observeAllCitations(userId).collect {
                emittedLists.add(it)
            }
        }
        delay(100)  // let initial emission happen

        // First emission: empty (no data yet)
        assertEquals(1, emittedLists.size)
        assertTrue(emittedLists[0].isEmpty())

        // Fetch from API (stores in Room → triggers Flow emission)
        fakeCitationApi.setCitations(listOf(
            CitationDto(citationId = "CIT-001", amount = 150.0, statusCode = "P", ...)
        ))
        repository.fetchCitations(userId)
        delay(100)

        // Second emission: one citation
        assertEquals(2, emittedLists.size)
        assertEquals(1, emittedLists[1].size)
        assertEquals("CIT-001", emittedLists[1][0].id)

        job.cancel()
    }
}
```

---

## 9. End-to-End Test Strategy — What to Automate

Not everything should be automated in E2E tests. The key is test value vs maintenance cost.

### Automate These User Journeys

```
HIGH VALUE E2E TEST SCENARIOS:
  1. Happy path — core user journey
     Login → View citations list → Click citation → Pay citation → View receipt

  2. Session expiry — security scenario
     Perform any action with expired token → Redirected to login → Log in →
     Continue from where user was

  3. Offline capability — critical for mobile
     Load citations while online → Go offline → App shows cached data →
     Go back online → Data refreshes automatically

  4. Error recovery — user resilience
     Network error during payment → Show error → Retry → Payment succeeds

  5. First-run experience — new user
     First launch → Onboarding shown → Grant permissions → Land on main screen

  6. Deep links — external navigation
     Open app from notification with citation ID → Navigate directly to detail

  7. Process death recovery — critical Android scenario
     Fill payment form → Simulate process death → Return to app →
     Form fields preserved (SavedStateHandle working)
```

### Do NOT Automate These as E2E

```
NOT WORTH E2E AUTOMATION:
  ✗ Every validation error message (test in unit tests — faster)
  ✗ Every API error code (test with MockWebServer — faster)
  ✗ Filter/sort combinations (test in ViewModel unit tests — faster)
  ✗ Animation timing (flaky, tests break often)
  ✗ Specific pixel layouts (screenshot tests are better for this)
  ✗ Third-party SDK behavior (trust the SDK)
```

### Test Pyramid for Mobile

```
        ╱─────╲
       ╱  E2E   ╲   5-10 tests: critical user journeys only
      ╱───────────╲
     ╱  UI Tests   ╲  20-30 tests: screen-level behavior, navigation
    ╱───────────────╲
   ╱  Integration   ╲   30-50 tests: Room, Repository, API integration
  ╱─────────────────╲
 ╱    Unit Tests      ╲   200+ tests: everything with logic
╱──────────────────────╲
```

---

## 10. Test Configuration — Build Variants and Test Flavors

```kotlin
// build.gradle.kts — separate build type for CI testing:
android {
    buildTypes {
        create("staging") {
            initWith(getByName("debug"))
            applicationIdSuffix = ".staging"
            buildConfigField("String", "BASE_URL", "\"https://staging.myapp.com/\"")
            // Staging: connects to staging server, no certificate pinning, logging enabled
        }
    }

    // Test-specific product flavor for mock tests:
    flavorDimensions += "environment"
    productFlavors {
        create("mock") {
            dimension = "environment"
            applicationIdSuffix = ".mock"
            // All API calls intercepted by in-memory fake — no real server needed
            // Used for: running UI tests in CI without network access
        }
        create("real") {
            dimension = "environment"
            // Real server — for manual QA testing on staging
        }
    }
}
```

```
TEST EXECUTION IN CI:
  ./gradlew testDebugUnitTest          ← Unit tests (fast, no device)
  ./gradlew connectedMockDebugAndroidTest ← Instrumented tests with mock flavor
  ./gradlew connectedRealStagingAndroidTest ← Integration tests against staging
```

---

## 11. Common Instrumented Test Failures

### Failure 1: Test Is Flaky Due to Timing

```
SYMPTOM: Test passes most of the time, fails occasionally.
         "NoMatchingViewException: No views in hierarchy found matching..."
CAUSE:   Test asserts before async operation completes.

FIX (Espresso): Use IdlingResource or register test with IdlingRegistry
FIX (Compose):  Use composeTestRule.waitUntil { ... }

// Bad:
onView(withId(R.id.citations_list)).check(matches(isDisplayed()))
// This runs immediately — list might not be visible yet

// Good:
composeTestRule.waitUntil(timeoutMillis = 5_000) {
    composeTestRule.onAllNodesWithTag("citation_item")
        .fetchSemanticsNodes().isNotEmpty()
}
```

### Failure 2: Test Depends on Previous Test State

```
SYMPTOM: Test passes when run in isolation, fails when run with other tests.
CAUSE:   Shared state (database, preferences) not cleared between tests.

FIX:
  @Before
  fun clearDatabase() {
    db.clearAllTables()       // clear Room database
    dataStore.edit { it.clear() }  // clear DataStore
    fakeCitationApi.reset()   // reset fake API state
  }

RULE: Every test must be independent — can run in any order, in isolation.
```

### Failure 3: Test Crashes — Activity Not Found

```
SYMPTOM: "ActivityNotFoundException: Unable to find explicit activity class"
CAUSE:   Activity not declared in AndroidManifest.xml for the test build.
         OR: Wrong test runner configured.
         OR: Hilt TestRunner not configured.

FIX:
  Verify defaultConfig { testInstrumentationRunner = "com.myapp.HiltTestRunner" }
  Verify HiltTestRunner.kt exists and is in androidTest/
  Verify @HiltAndroidTest annotation on the test class
  Verify HiltAndroidRule is added as a @Rule
```

### Failure 4: Soft Keyboard Covers Assert Target

```
SYMPTOM: After typing text, the assertion cannot find the view (keyboard covers it).
FIX:
  onView(withId(R.id.search_input))
      .perform(typeText("CIT-001"), closeSoftKeyboard())
  // Always close the keyboard after typing before asserting
```

---

## 12. Interview Q&A

**Q: "What is the difference between unit tests and instrumented tests in Android?"**

> "Unit tests run on the JVM — your machine or CI server — with no Android framework. They use mocks and fakes to isolate the code under test. They run in milliseconds and require no device. Instrumented tests run on a real Android device or emulator and have access to the full Android framework: real Activity, Fragment, Context, SQLite, SharedPreferences. They run in seconds and require a device or emulator. The practical rule: test business logic, ViewModels, use cases, and mappers as unit tests. Test UI behavior, database migrations, navigation, and integration between layers as instrumented tests."

**Q: "How does Espresso handle asynchronous operations — why don't you need Thread.sleep()?"**

> "Espresso has built-in idle synchronization. Before executing any action or assertion, Espresso checks its IdlingResource registry and waits until all registered resources are idle: the main thread has no pending messages, the AsyncTask thread pool is empty, and no animations are running. When Espresso sees the app is idle, it proceeds. This eliminates sleep() and makes tests deterministic. For custom async work — like coroutines or manual threads — you can create a custom IdlingResource or use OkHttp's OkHttp3IdlingResource to tell Espresso when network calls are active. For Compose tests, the equivalent is `waitUntil { condition }` which polls until a condition is true."

**Q: "How do you replace real dependencies (like the API) in instrumented tests?"**

> "With Hilt's `@TestInstallIn` annotation. I create a test-specific Hilt module that replaces the production module for the test component. The replacement provides a fake implementation — an in-memory class that implements the same interface as the real API but returns configured responses instead of hitting the network. Each test can configure the fake: `fakeCitationApi.setCitations(testData)` or `fakeCitationApi.setError(exception)`. This approach tests the real integration between the UI, ViewModel, repository, and Room database — only the network boundary is replaced. The result is fast, hermetic tests that can run in CI without network access and still catch integration bugs."

---

**Next in this folder**: [09_Dependency_Injection_Hilt.md](./09_Dependency_Injection_Hilt.md) — Hilt setup, modules, scopes, and testing patterns with Hilt.

**Back to**: [Android folder index](./) | [Series index](../)
