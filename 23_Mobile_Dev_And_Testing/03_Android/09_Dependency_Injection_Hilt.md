# Android — Dependency Injection with Hilt

**Folder**: [03_Android](./) | **Previous**: [08_Instrumented_And_UI_Tests.md](./08_Instrumented_And_UI_Tests.md) | **Next**: [10_Performance_And_Memory.md](./10_Performance_And_Memory.md)

> **Reading contract**: Dependency Injection (DI) is the practice of providing a class's dependencies from the outside rather than letting the class create them itself. Hilt is Google's official DI framework for Android, built on top of Dagger. This file teaches: why DI exists, how Hilt works at the annotation-processor level, every Hilt scope, how modules provide dependencies, how to inject into every Android component, and the critical patterns for testing with Hilt. Understanding this file will let you read any Hilt codebase and understand every binding decision.

---

## Table of Contents

1. [Why Dependency Injection Exists](#1-why-dependency-injection-exists)
2. [Hilt — The Android DI Framework](#2-hilt--the-android-di-framework)
3. [Hilt Setup](#3-hilt-setup)
4. [Scopes — How Long Does a Dependency Live?](#4-scopes--how-long-does-a-dependency-live)
5. [Modules — Providing Dependencies](#5-modules--providing-dependencies)
6. [Injecting Into Android Components](#6-injecting-into-android-components)
7. [Injecting ViewModels](#7-injecting-viewmodels)
8. [Qualifiers — Multiple Implementations of the Same Type](#8-qualifiers--multiple-implementations-of-the-same-type)
9. [Hilt in Tests — TestInstallIn and Fake Modules](#9-hilt-in-tests--testinstallln-and-fake-modules)
10. [Common Hilt Mistakes and Their Errors](#10-common-hilt-mistakes-and-their-errors)
11. [Interview Q&A](#11-interview-qa)

---

## 1. Why Dependency Injection Exists

### The Problem: Hard-Coded Dependencies

```kotlin
// WITHOUT DI — class creates its own dependencies:
class CitationListViewModel : ViewModel() {
    // Hard-coded: ViewModel directly creates all its dependencies
    private val database = AppDatabase.getInstance(???)  // needs Context — can't get it here
    private val dao = database.citationDao()
    private val api = Retrofit.Builder().baseUrl("...").build()
                               .create(CitationApiService::class.java)
    private val repository = CitationRepository(api, dao)

    // Problems:
    // 1. ViewModel needs Context to create database → forces Android dependency into ViewModel
    // 2. Every ViewModel creates its own API/DB objects → no sharing, wasteful
    // 3. Cannot replace with fakes in tests → every test hits the real API/database
    // 4. Change the constructor of CitationRepository → update EVERY place that creates it
}
```

### The Solution: Inject Dependencies from Outside

```kotlin
// WITH DI — dependencies are GIVEN to the class, not created by it:
class CitationListViewModel(
    private val repository: CitationRepository  // provided from outside
) : ViewModel() {
    // ViewModel just uses the repository — doesn't know how it was created
    // In production: real repository with real API and Room
    // In tests: FakeCitationRepository with in-memory data
}

// Benefits:
// 1. ViewModel has no Android dependencies — pure Kotlin — fully unit testable
// 2. Singleton management handled by DI container (one database, one OkHttp client)
// 3. Swap implementations without changing consumers (swap real API for fake in tests)
// 4. Change dependency graph in ONE place (the module) not in every consumer
```

---

## 2. Hilt — The Android DI Framework

```
DAGGER:        Low-level, annotation-based DI framework
               Generates Java code at compile time (no reflection = fast)
               Complex setup: requires manually writing @Component interfaces

HILT:          Built ON TOP of Dagger
               Provides pre-built @Components for every Android component
               (Activity, Fragment, ViewModel, Service, etc.)
               Eliminates boilerplate: you write @Module, Hilt generates @Component

WHAT HILT DOES AUTOMATICALLY:
  1. Creates a dependency graph at compile time (annotation processing via KSP)
  2. Manages object lifetimes (scopes) tied to Android component lifecycles
  3. Injects dependencies into Activities, Fragments, ViewModels, Services
  4. Verifies the whole graph at compile time — missing bindings = build error
```

---

## 3. Hilt Setup

```kotlin
// build.gradle.kts (project level):
plugins {
    id("com.google.dagger.hilt.android") version "2.51.1" apply false
}

// build.gradle.kts (app module):
plugins {
    id("com.android.application")
    id("com.google.dagger.hilt.android")
    id("com.google.devtools.ksp")        // Kotlin Symbol Processing (Hilt annotation processor)
}

dependencies {
    implementation("com.google.dagger:hilt-android:2.51.1")
    ksp("com.google.dagger:hilt-android-compiler:2.51.1")
}

// Application class — required entry point:
@HiltAndroidApp  // tells Hilt: generate the root component for this application
class MyApplication : Application()

// AndroidManifest.xml:
// <application android:name=".MyApplication" ...>
```

---

## 4. Scopes — How Long Does a Dependency Live?

Scope = how long the same instance is used. Within a scope, the SAME object is returned to all consumers.

```
SCOPE                   ANDROID COMPONENT         LIFETIME
──────────────────────  ────────────────────────  ──────────────────────────────
@Singleton              Application               Lives as long as the app process
                                                  ONE instance for the entire app

@ActivityRetainedScoped Activity (VM-retained)    Lives across rotation
                                                  ONE instance per Activity until
                                                  Activity is FINISHED (not rotated)

@ViewModelScoped        ViewModel                 Lives as long as the ViewModel
                                                  ONE instance per ViewModel instance

@ActivityScoped         Activity                  ONE instance per Activity instance
                                                  Destroyed on rotation

@FragmentScoped         Fragment                  ONE instance per Fragment instance
                                                  Destroyed when Fragment is destroyed

No scope annotation     (Unscoped)                NEW instance every time it is requested
                                                  (default behavior)
```

### Choosing the Right Scope

```
DATABASE, RETROFIT, OKHTTP, SHARED PREFS → @Singleton
  These are expensive to create, must be shared across the app.
  Database must be singleton (one connection per process).

REPOSITORY → @Singleton
  Repositories coordinate data sources — should be shared.
  Multiple ViewModels observing the same repository = same reactive data.

USE CASES → Unscoped (no annotation)
  Use cases are stateless — new instance per injection is fine and cheap.
  No benefit to sharing a stateless object.

VIEW MODELS → injected via @HiltViewModel (handled by Hilt automatically)

ANALYTICS, LOGGER → @Singleton
  Single tracker instance ensures consistent session data.

REQUEST-SCOPED objects → @ActivityRetainedScoped or @ActivityScoped
```

---

## 5. Modules — Providing Dependencies

A Hilt module tells Hilt HOW to create objects it cannot create automatically.

```kotlin
// Hilt can create objects automatically ONLY IF:
//   1. The class has @Inject constructor()
//   2. All constructor parameters are themselves injectable

// For everything else (interfaces, third-party classes, builder patterns) → @Module

@Module
@InstallIn(SingletonComponent::class)  // this module is installed in the App-scoped component
object NetworkModule {

    // @Provides: the function return type is what gets injected
    // @Singleton: same OkHttpClient instance throughout the entire app

    @Provides
    @Singleton
    fun provideOkHttpClient(
        authInterceptor: AuthInterceptor   // ← Hilt injects this (AuthInterceptor has @Inject constructor)
    ): OkHttpClient {
        return OkHttpClient.Builder()
            .addInterceptor(authInterceptor)
            .addInterceptor(HttpLoggingInterceptor().apply {
                level = if (BuildConfig.DEBUG) HttpLoggingInterceptor.Level.BODY
                        else HttpLoggingInterceptor.Level.NONE
            })
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .build()
    }

    @Provides
    @Singleton
    fun provideRetrofit(okHttpClient: OkHttpClient): Retrofit {
        return Retrofit.Builder()
            .baseUrl(BuildConfig.BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(
                Json { ignoreUnknownKeys = true }
                    .asConverterFactory("application/json".toMediaType())
            )
            .build()
    }

    @Provides
    @Singleton
    fun provideCitationApiService(retrofit: Retrofit): CitationApiService {
        return retrofit.create(CitationApiService::class.java)
    }
}

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    @Provides
    @Singleton
    fun provideAppDatabase(@ApplicationContext context: Context): AppDatabase {
        return Room.databaseBuilder(context, AppDatabase::class.java, "app_db")
            .addMigrations(MIGRATION_1_2, MIGRATION_2_3)
            .build()
    }

    // DAOs are provided by their own @Provides functions:
    @Provides
    fun provideCitationDao(db: AppDatabase): CitationDao = db.citationDao()

    @Provides
    fun providePaymentDao(db: AppDatabase): PaymentDao = db.paymentDao()
}
```

### @Binds — For Interface-to-Implementation Binding

```kotlin
// When you have an interface and one implementation:
interface CitationRepository {
    suspend fun fetchCitations(userId: String): Result<List<Citation>>
}

class CitationRepositoryImpl @Inject constructor(
    private val api: CitationApiService,
    private val dao: CitationDao
) : CitationRepository {
    override suspend fun fetchCitations(userId: String): Result<List<Citation>> { ... }
}

// Module using @Binds (more efficient than @Provides for this pattern):
@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {  // abstract class for @Binds

    @Binds
    @Singleton
    abstract fun bindCitationRepository(
        impl: CitationRepositoryImpl  // implementation
    ): CitationRepository             // bound to the interface type
    // Any injection site requesting CitationRepository will receive CitationRepositoryImpl
}
```

### @Provides vs @Binds — The Rule

```
USE @Binds when:
  You have an interface + implementation
  The implementation can be created by Hilt (@Inject constructor)
  @Binds is more efficient (generates less code)

USE @Provides when:
  The object requires a builder pattern (OkHttp, Retrofit, Room)
  The object comes from a third-party library with no @Inject constructor
  The construction requires logic (if/else, BuildConfig checks)
  You need to call methods on an existing instance
```

---

## 6. Injecting Into Android Components

### Field Injection (Activities and Fragments)

```kotlin
// Activity — must be annotated with @AndroidEntryPoint:
@AndroidEntryPoint
class CitationListActivity : AppCompatActivity() {

    // @Inject: Hilt fills this field before onCreate() is called
    @Inject lateinit var analyticsTracker: AnalyticsTracker
    // Note: lateinit because Hilt can't inject via constructor for Activities

    // ViewModels use by viewModels() delegate — Hilt provides them automatically:
    private val viewModel: CitationListViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // analyticsTracker is available here (injected before super.onCreate)
        analyticsTracker.trackScreen("citation_list")
    }
}

// Fragment — must also be @AndroidEntryPoint:
@AndroidEntryPoint
class CitationDetailFragment : Fragment() {

    @Inject lateinit var deepLinkHandler: DeepLinkHandler

    private val viewModel: CitationDetailViewModel by viewModels()
    // OR shared: private val sharedVM: SharedViewModel by activityViewModels()

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        // deepLinkHandler available here
    }
}
```

### Constructor Injection (Non-Android Classes)

```kotlin
// Repository — has @Inject constructor, so Hilt creates it automatically:
class CitationRepositoryImpl @Inject constructor(
    private val api: CitationApiService,     // Hilt provides this from NetworkModule
    private val citationDao: CitationDao,    // Hilt provides this from DatabaseModule
    @IoDispatcher private val dispatcher: CoroutineDispatcher  // qualified injection
) : CitationRepository { ... }

// Use case — unscoped, stateless:
class FetchCitationsUseCase @Inject constructor(
    private val repository: CitationRepository,
    private val userRepository: UserRepository
) {
    suspend operator fun invoke(): Result<List<Citation>> { ... }
}
```

---

## 7. Injecting ViewModels

```kotlin
// ViewModel with @HiltViewModel:
@HiltViewModel
class CitationListViewModel @Inject constructor(
    private val fetchCitationsUseCase: FetchCitationsUseCase,
    private val savedStateHandle: SavedStateHandle  // automatically provided by Hilt
) : ViewModel() { ... }

// In Activity or Fragment — just use the delegate, Hilt handles the rest:
@AndroidEntryPoint
class CitationListFragment : Fragment() {
    private val viewModel: CitationListViewModel by viewModels()
    // Hilt: creates FetchCitationsUseCase → which needs CitationRepository
    //       → which needs CitationApiService (from Retrofit) + CitationDao (from Room)
    //       The entire graph is wired automatically
}

// Passing arguments to ViewModel via SavedStateHandle:
// (Navigation component puts all nav args in SavedStateHandle automatically)
@HiltViewModel
class CitationDetailViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val repository: CitationRepository
) : ViewModel() {
    private val citationId: String = checkNotNull(savedStateHandle["citationId"])
    // citationId comes from the navigation argument "citationId"
    // No @Assisted needed — Navigation + Hilt handles it
}
```

---

## 8. Qualifiers — Multiple Implementations of the Same Type

When you have two bindings of the same type (e.g., two `CoroutineDispatcher`s), qualifiers distinguish them.

```kotlin
// Define qualifier annotations:
@Qualifier
@Retention(AnnotationRetention.BINARY)
annotation class IoDispatcher

@Qualifier
@Retention(AnnotationRetention.BINARY)
annotation class MainDispatcher

@Qualifier
@Retention(AnnotationRetention.BINARY)
annotation class DefaultDispatcher

// Provide in module:
@Module
@InstallIn(SingletonComponent::class)
object DispatcherModule {

    @Provides
    @IoDispatcher
    fun provideIoDispatcher(): CoroutineDispatcher = Dispatchers.IO

    @Provides
    @MainDispatcher
    fun provideMainDispatcher(): CoroutineDispatcher = Dispatchers.Main

    @Provides
    @DefaultDispatcher
    fun provideDefaultDispatcher(): CoroutineDispatcher = Dispatchers.Default
}

// Inject with qualifier:
class CitationRepositoryImpl @Inject constructor(
    private val api: CitationApiService,
    private val dao: CitationDao,
    @IoDispatcher private val dispatcher: CoroutineDispatcher
) : CitationRepository {
    override suspend fun fetchCitations(userId: String): Result<List<Citation>> {
        return withContext(dispatcher) {
            // runs on IO dispatcher
            try { Result.success(api.getCitations().map { it.toDomain() }) }
            catch (e: Exception) { Result.failure(e) }
        }
    }
}

// IMPORTANT: In tests, replace with TestDispatcher via a test module:
@TestInstallIn(
    components = [SingletonComponent::class],
    replaces = [DispatcherModule::class]
)
@Module
object TestDispatcherModule {
    @Provides
    @IoDispatcher
    fun provideTestIoDispatcher(): CoroutineDispatcher = UnconfinedTestDispatcher()

    @Provides
    @MainDispatcher
    fun provideTestMainDispatcher(): CoroutineDispatcher = UnconfinedTestDispatcher()

    @Provides
    @DefaultDispatcher
    fun provideTestDefaultDispatcher(): CoroutineDispatcher = UnconfinedTestDispatcher()
}
```

### Built-In Qualifiers

```kotlin
// Hilt provides these out of the box:
@ApplicationContext   // Context tied to the Application lifecycle
@ActivityContext      // Context tied to the Activity lifecycle

class DatabaseManager @Inject constructor(
    @ApplicationContext private val context: Context  // use ApplicationContext for databases
) { ... }

class ThemeManager @Inject constructor(
    @ActivityContext private val context: Context  // use ActivityContext for UI work
) { ... }
```

---

## 9. Hilt in Tests — TestInstallIn and Fake Modules

(See also File 08 for full test setup. This section covers the Hilt-specific patterns.)

### Replacing a Module in Tests

```kotlin
// Production module (in src/main/...):
@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {
    @Provides @Singleton
    fun provideCitationApi(retrofit: Retrofit): CitationApiService =
        retrofit.create(CitationApiService::class.java)
}

// Test replacement (in src/androidTest/...):
@TestInstallIn(
    components = [SingletonComponent::class],
    replaces = [NetworkModule::class]  // completely replaces the production module
)
@Module
object FakeNetworkModule {
    @Provides @Singleton
    fun provideFakeCitationApi(): CitationApiService = FakeCitationApiService()
    // FakeCitationApiService is in-memory, configurable, no real network
}
```

### Unit Test with Fake Dependencies (No Hilt Needed)

```kotlin
// For unit tests — Hilt is NOT used. Manually construct with fakes:
class CitationListViewModelTest {
    private val fakeRepository = FakeCitationRepository()
    private val fetchCitationsUseCase = FetchCitationsUseCase(fakeRepository, FakeUserRepository())
    private val viewModel = CitationListViewModel(fetchCitationsUseCase, FakeSavedStateHandle())

    @Test
    fun `initial state is Loading`() {
        assertThat(viewModel.uiState.value).isInstanceOf(CitationListUiState.Loading::class.java)
    }
}

// Hilt is for RUNTIME dependency wiring.
// Unit tests don't need Hilt — they construct objects directly.
// Only instrumented tests (that need a real Activity/Fragment) use Hilt.
```

---

## 10. Common Hilt Mistakes and Their Errors

### Error 1: Missing @AndroidEntryPoint

```
ERROR: "CitationListFragment is not a Hilt-injected class"
CAUSE: Fragment uses @Inject but @AndroidEntryPoint annotation is missing.
FIX:  @AndroidEntryPoint class CitationListFragment : Fragment()
```

### Error 2: Injecting in Wrong Lifecycle Point

```kotlin
// WRONG — accessing @Inject field before Hilt injects it:
class MyFragment : Fragment() {
    @Inject lateinit var tracker: AnalyticsTracker

    // Called BEFORE Hilt injection completes:
    override fun onAttach(context: Context) {
        super.onAttach(context)
        tracker.track("attached")  // CRASH: lateinit not initialized
    }

    // Called AFTER Hilt injection:
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        tracker.track("view created")  // CORRECT: tracker is initialized
    }
}
```

### Error 3: Scope Mismatch — Using a Scoped Dependency in a Wider Scope

```
ERROR: "com.myapp.SomeFragmentScopedClass cannot be provided without an
        @Inject constructor or @Provides-annotated method"
CAUSE: A @Singleton dependency tries to inject a @FragmentScoped dependency.
       @FragmentScoped lives shorter than @Singleton — Hilt prevents this.

RULE: A dependency can only inject things that live at LEAST as long as it does.
  @Singleton CAN inject: @Singleton
  @ActivityScoped CAN inject: @Singleton, @ActivityScoped
  @FragmentScoped CAN inject: @Singleton, @ActivityScoped, @FragmentScoped
  @ViewModelScoped CAN inject: @Singleton, @ActivityRetainedScoped, @ViewModelScoped
```

### Error 4: Missing Module — Hilt Cannot Provide Type

```
ERROR: "[Dagger/MissingBinding] com.myapp.CitationRepository cannot be provided
        without an @Provides-annotated method or @Inject constructor"
CAUSE: CitationRepository is an interface. Hilt doesn't know which implementation to use.
FIX:  Add a @Binds method in a module:

@Binds
@Singleton
abstract fun bindCitationRepository(impl: CitationRepositoryImpl): CitationRepository
```

### Error 5: ViewModel Not @HiltViewModel

```
ERROR: "CitationListViewModel must have a factory that provides it,
        but CitationListViewModel is not a @HiltViewModel"
CAUSE: ViewModel has @Inject constructor but is missing @HiltViewModel.
FIX:  @HiltViewModel class CitationListViewModel @Inject constructor(...) : ViewModel()
```

---

## 11. Interview Q&A

**Q: "What is Dependency Injection and why is it used in Android?"**

> "Dependency Injection is a design pattern where an object receives its dependencies from the outside rather than creating them itself. In Android, the main reasons to use DI are: first, testability — a ViewModel that receives a `CitationRepository` interface can work with a `FakeCitationRepository` in tests, eliminating real network and database calls. Second, singleton management — you want exactly one OkHttp client, one Room database, one Retrofit instance across the entire app; DI frameworks handle this automatically. Third, modularity — you can swap an implementation (e.g., switch from Retrofit to Ktor for networking) by changing one module, not every class that creates the dependency."

**Q: "What is the difference between @Singleton, @ViewModelScoped, and @ActivityScoped in Hilt?"**

> "These are scope annotations that control an instance's lifetime. `@Singleton` means one instance for the entire application process — used for expensive shared objects like databases and API clients. `@ViewModelScoped` means one instance per ViewModel instance — scoped things are shared between all classes the ViewModel creates, but each ViewModel gets its own instances. `@ActivityScoped` means one instance per Activity instance — destroyed on rotation (unlike `@ActivityRetainedScoped` which survives rotation). The rule: a dependency can only inject things that live at least as long as it does. A `@Singleton` cannot hold a `@FragmentScoped` dependency because the fragment dies first, leaving the singleton with a dangling reference."

**Q: "How do you replace a real API with a fake in Hilt tests?"**

> "I use `@TestInstallIn` to create a test-specific Hilt module that replaces the production module. The test module provides a `FakeCitationApiService` — a class implementing `CitationApiService` that stores responses in memory. Tests inject the fake and configure it per test: `fakeCitationApi.setCitations(testData)` or `fakeCitationApi.setError(networkException)`. The key point: unit tests don't use Hilt at all — they manually construct the ViewModel with fake use cases and repositories. Only instrumented tests that need a real Activity and full Compose tree use Hilt's test support. The `HiltTestRunner` replaces the default `AndroidJUnitRunner` to register Hilt's component factory before any test runs."

---

**Next in this folder**: [10_Performance_And_Memory.md](./10_Performance_And_Memory.md) — Memory leaks, ANR, profiling, and performance best practices in Android.

**Back to**: [Android folder index](./) | [Series index](../)


---

## Reality Check

**"DI is a framework you add for convenience"** ? Dependency injection is a DESIGN PRINCIPLE (depend on abstractions, receive collaborators from outside � [06_OOP SOLID]) that Hilt AUTOMATES for Android; the principle is what buys testability and flexibility, the framework just removes the wiring boilerplate: the class that RECEIVES its dependencies (testable � you inject fakes/mocks [07], the [03 ViewModel] testability), versus the class that CONSTRUCTS its own (the new-ed-up dependency that cannot be swapped for a test double � the [13_DE testing] untestable coupling). "A framework for convenience" misses that DI-the-principle is what makes code testable and flexible, and Hilt-the-framework is the Android-specific automation of it � adopting Hilt without understanding the principle produces cargo-cult annotations, and understanding the principle without a framework is just DI done manually (constructor injection, which works fine and is what Hilt generates).

**"Hilt magically provides dependencies"** ? Hilt is COMPILE-TIME code generation with a specific mental model, and its errors are the tell ([17_TS, 25_Python]'s decorator-is-generated-code, Android flavor): the dependency graph Hilt builds at compile time (the missing binding that fails the BUILD, not runtime � a good thing, caught early), the SCOPES (the @Singleton versus @ActivityScoped versus unscoped � the [21_SDET fixtures] scope lesson, the wrong scope causing either leaks or unwanted new instances), the modules and bindings (the @Provides/@Binds telling Hilt how to construct things it cannot construct itself � the interface that needs a binding to its implementation), and the entry points (the Hilt-aware Android components). "Magically provides" is the cargo-cult view � Hilt is a compile-time dependency-graph generator whose scopes, bindings, and entry points you must understand, and its cryptic build errors ([17_TS] decorator-error-reading) are decipherable only with the graph-and-scope model.

**"Scopes are just about when to create instances"** ? Scopes are LIFECYCLE and MEMORY decisions with leak consequences ([21_SDET fixtures, 02 lifecycle]): the @Singleton that lives for the app (the shared instance � correct for stateless services, a leak-and-shared-state risk for things holding context or mutable state), the component-scoped that ties an instance's lifetime to a lifecycle ([02] � the ActivityScoped that must not outlive the Activity, the leak if it does), and the unscoped that creates a new instance per injection (the [21_SDET fixtures] scope mismatch � the expensive object recreated, or the state not shared when it should be). "When to create" undersells that scope decides lifetime, sharing, and leak-risk � the @Singleton holding an Activity context leaks it, the wrong scope shares mutable state across screens or fails to, and getting scopes right is a lifecycle-and-memory correctness concern, the [21_SDET fixtures] scope lesson with Android's lifecycle stakes.

**"DI makes testing automatic"** ? DI ENABLES testing by making dependencies swappable; it does not write the tests or guarantee good ones ([07, 13_DE testing]): the injectable dependencies that let you provide fakes/mocks in tests (the testability [03] � the real benefit), but the tests still need writing well (the [07] over-mocking, the [13_DE] behavior-not-implementation), and the Hilt test setup (the test modules that replace production bindings, the Hilt testing APIs � the machinery to inject test doubles). "Makes testing automatic" overstates it � DI removes the untestable-hardcoded-dependency obstacle ([13_DE] the new-ed-up collaborator), and you still write behavior-focused tests with well-chosen fakes at the boundaries ([07]). The value is that testing becomes POSSIBLE and clean (inject the fake), not automatic � the DI is the enabler, the test quality is still your job.

**"Adopt Hilt because it's the standard"** ? Hilt fits Android apps of sufficient size and is overhead for small ones ([Enterprise DDD-tactical, system-design]'s right-tool-for-scale): the small app where manual constructor injection is simpler than Hilt's annotations and build-time weight (the [DDD] over-engineering on a simple app), versus the large multi-module app where Hilt's automated graph genuinely saves substantial wiring and enforces consistency. Plus the build-time cost (the annotation processing that adds to build time � the [22 CI/CD, 17_TS build-performance] consideration) and the learning curve (the graph-and-scope model that the team must understand or cargo-cult). "Adopt because standard" is the [Kubernetes] adopt-past-your-scale � Hilt is the standard for apps that benefit from it, manual DI (constructor injection, no framework) is perfectly correct and simpler for small apps, and the choice is the scale-and-complexity judgment ([system-design] boring-technology), not a default to apply regardless of app size.
