# 02. Android Native — Development Concepts + Complete Testing Stack

**Navigation**: [← Playwright vs Appium](01_Playwright_vs_Appium_Full_Comparison.md) | [📚 Index](00_INDEX.md) | [iOS Native →](03_iOS_Native_Dev_And_Testing.md)

> **Reading contract**: This file teaches Android development and Android testing together. You will understand what is being built, why it is built that way, and how to test every part of it. No Android Studio experience assumed.

---

## Table of Contents

1. [What Is an Android App? The Mental Model](#1-what-is-an-android-app-the-mental-model)
2. [Activity — The Core Building Block](#2-activity--the-core-building-block)
3. [The Activity Lifecycle — Why It Exists and Why It Matters](#3-the-activity-lifecycle--why-it-exists-and-why-it-matters)
4. [Intent — How Screens Communicate](#4-intent--how-screens-communicate)
5. [Fragment — Reusable Screen Pieces](#5-fragment--reusable-screen-pieces)
6. [ViewModel — Surviving Configuration Changes](#6-viewmodel--surviving-configuration-changes)
7. [LiveData and StateFlow — Reactive Data](#7-livedata-and-stateflow--reactive-data)
8. [Room Database — Structured Local Storage](#8-room-database--structured-local-storage)
9. [Jetpack Compose — Modern Declarative UI](#9-jetpack-compose--modern-declarative-ui)
10. [Android Testing Pyramid — Three Levels](#10-android-testing-pyramid--three-levels)
11. [Level 1: Unit Tests with JUnit + Mockito](#11-level-1-unit-tests-with-junit--mockito)
12. [Level 2: UI Tests with Espresso](#12-level-2-ui-tests-with-espresso)
13. [Level 3: E2E Tests with Appium](#13-level-3-e2e-tests-with-appium)
14. [Espresso vs Appium — When to Use Which](#14-espresso-vs-appium--when-to-use-which)
15. [Interview Questions on Android](#15-interview-questions-on-android)

---

## 1. What Is an Android App? The Mental Model

Before any code, you need the right mental model of what Android is.

### Android Is a Permission-Sandboxed Operating System

Every Android app runs in its own **sandbox** — a completely isolated process with its own memory space, file storage, and user ID. Apps cannot access each other's data by default. This is why:
- You need to REQUEST permissions (camera, contacts, location)
- Apps can only share data through explicit mechanisms (Content Providers, Intents)

### What Is Inside an APK?

An APK (Android Package) is a ZIP file. Inside it:

```
my-app.apk (it is just a ZIP)
├── AndroidManifest.xml    ← THE most important file: declares everything
│                            - App name, package, min/target SDK
│                            - All Activity, Service, Receiver declarations
│                            - All permissions the app needs
│
├── classes.dex            ← Your Kotlin/Java code compiled to Dalvik bytecode
│                            (Android doesn't run JVM bytecode — it runs DEX)
│
├── res/                   ← Resources: layouts (XML), images, strings, colors
│   ├── layout/
│   │   └── activity_login.xml   ← Describes the Login screen UI
│   ├── drawable/
│   └── values/
│       └── strings.xml    ← All text strings (supports localization)
│
└── assets/                ← Raw files (fonts, JSON configs, SQLite DB)
```

### The Package Name Is Your App's Identity

```
com.mycompany.myapp
 ↑              ↑
 company       app name
```

This is used everywhere: in Appium selectors (`com.mycompany.myapp:id/btn_login`), in the Play Store (unique identifier), and in deep links.

---

### 🎯 Practice — Level 1

**Question**: Your Appium test uses `By.id("com.mycompany.myapp:id/btn_login")`. Where does `btn_login` come from, and where is it defined in the Android project?

<details><summary>Answer</summary>

`btn_login` is a **resource ID** defined in the XML layout file. In the developer's `res/layout/activity_login.xml`:

```xml
<Button
    android:id="@+id/btn_login"
    android:text="Login"
    android:layout_width="match_parent"
    android:layout_height="wrap_content" />
```

The `@+id/btn_login` syntax tells Android to create a resource with the name `btn_login`. At build time, Android generates a `R.java` file that maps this name to an integer ID. At runtime, the full resource identifier becomes `com.mycompany.myapp:id/btn_login`.

**Why this matters for testing**: if a developer removes or renames `btn_login` in the XML, your Appium test will break with "element not found". This is why `contentDescription` (accessibility ID) is a better selector — it is explicitly set for testing purposes and less likely to change with UI refactoring.

</details>

---

## 2. Activity — The Core Building Block

### What Is an Activity?

An **Activity** represents a single screen in your app. Think of it as a "page" — but with complex lifecycle management built in.

```
Your App Has Multiple Activities:
┌─────────────────────────────────────────┐
│  LoginActivity        (login screen)    │
│  HomeActivity         (main dashboard)  │
│  PaymentActivity      (payment form)    │
│  ReceiptActivity      (payment receipt) │
└─────────────────────────────────────────┘

Each Activity is declared in AndroidManifest.xml:

<application>
    <activity android:name=".LoginActivity"
              android:exported="true">
        <intent-filter>
            <action android:name="android.intent.action.MAIN" />
            <category android:name="android.intent.category.LAUNCHER" />
        </intent-filter>
        <!-- ↑ This makes LoginActivity the ENTRY POINT (what opens on app launch) -->
    </activity>

    <activity android:name=".HomeActivity" />
    <activity android:name=".PaymentActivity" />
</application>
```

### A Minimal Activity in Kotlin

```kotlin
// LoginActivity.kt
class LoginActivity : AppCompatActivity() {

    // Called when the Activity is first created
    // This is where you: inflate the layout, find views, set click listeners
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_login)  // loads activity_login.xml

        // Find the button by its resource ID
        val loginButton = findViewById<Button>(R.id.btn_login)

        loginButton.setOnClickListener {
            val username = findViewById<EditText>(R.id.et_username).text.toString()
            val password = findViewById<EditText>(R.id.et_password).text.toString()
            // validate and navigate...
        }
    }
}
```

---

## 3. The Activity Lifecycle — Why It Exists and Why It Matters

### The Problem Android Solves

Your phone has limited RAM. Android needs to be able to:
- Pause your app when you receive a phone call
- Stop your app when you switch to another app
- Kill your app entirely when memory is needed
- Restore your app exactly where you left off when you come back

The **lifecycle** is Android's contract with your app: "I will call these methods to tell you what is happening, and you must respond correctly."

### The 7 Lifecycle States

```
           App launched
                │
                ▼
         ┌─────────────┐
         │  onCreate() │  ← First call ever. Set up UI, initialize data.
         └──────┬──────┘
                │
                ▼
         ┌─────────────┐
         │  onStart()  │  ← Activity becoming VISIBLE (but not interactive yet)
         └──────┬──────┘
                │
                ▼
         ┌─────────────┐
         │ onResume()  │  ← Activity is in FOREGROUND, user can interact
         └──────┬──────┘  ← THIS IS THE RUNNING STATE
                │
         ┌──────┴──────┐
         │  USER USING │  ← Normal usage happens here
         └──────┬──────┘
                │
           Phone call comes in / another app opens
                │
                ▼
         ┌─────────────┐
         │ onPause()   │  ← Activity partially hidden. SAVE QUICK STATE HERE.
         └──────┬──────┘  ← Do NOT do heavy work here (it blocks transition)
                │
                ▼
         ┌─────────────┐
         │  onStop()   │  ← Activity fully hidden. Can do heavier cleanup.
         └──────┬──────┘
                │
          User comes back OR Android kills for memory
                │
         ┌──────┴──────────────────────┐
         │                             │
         ▼                             ▼
   ┌─────────────┐             ┌──────────────┐
   │ onRestart() │             │  onDestroy() │  ← Final call. Clean up
   │ (came back) │             │ (app killed) │    resources, cancel
   └──────┬──────┘             └──────────────┘    coroutines, close DB
          │
          ▼
   Back to onStart()
```

### The Configuration Change Problem (CRITICAL)

**The most important lifecycle fact**: When the user **rotates their phone**, Android **destroys and recreates** the Activity from scratch. This means:
- `onDestroy()` is called
- `onCreate()` is called again
- All your variables are RESET

```kotlin
class CounterActivity : AppCompatActivity() {

    // ❌ WRONG: This variable is lost on rotation
    private var count = 0

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // count is reset to 0 every rotation
        // The user sees the counter reset — this is a bug
    }

    fun onIncrementClick() {
        count++
        updateUI()
    }
}
```

**Why does Android do this?** Because when you rotate, the screen dimensions change, and Android needs to re-inflate the layout with different resources (maybe a landscape layout). The simplest solution was to restart the Activity. This is why ViewModel exists — discussed in Section 6.

---

### 🎯 Practice — Level 1

**Question**: A user is filling out a 10-field form in your app. They receive a WhatsApp message, switch to WhatsApp, read it, and come back to your app. Which lifecycle methods are called, in what order? Is the form data lost?

<details><summary>Answer — Full Trace</summary>

**Timeline:**

```
User is in form (onResume state — RUNNING)
         │
WhatsApp notification tapped
         │
         ▼
onPause()     ← Your app loses focus. Save quick state HERE.
         │
         ▼
onStop()      ← Your app is completely hidden.
         │
         (WhatsApp is now in foreground — your Activity is in the STOPPED state)
         │
User taps back / recent apps and returns to your app
         │
         ▼
onRestart()   ← Android decides NOT to kill it (enough memory available)
         │
         ▼
onStart()
         │
         ▼
onResume()    ← Your app is back in foreground
```

**Is the form data lost?**

It depends on how you stored it:
- **Instance variables in the Activity**: NOT lost (the Activity was never destroyed — it went to onStop, not onDestroy)
- **If Android HAD killed the process** (extreme memory pressure): YES, lost — unless you saved to `savedInstanceState` or a ViewModel
- **In a ViewModel**: NEVER lost (ViewModel survives even when Activity is recreated by rotation)

**The practical rule**: for form data, use a ViewModel or `onSaveInstanceState()`. Do not rely on the Activity surviving.

</details>

---

**Question**: A user opens your app → fills half a form → rotates their phone → continues filling. Without any special handling, is the form data preserved? What lifecycle methods fire during rotation?

<details><summary>Answer</summary>

**Without special handling: NO, data is lost on rotation.**

Lifecycle methods fired during rotation:
```
onPause()
onStop()
onDestroy()    ← DESTROYED (rotation triggers full recreation)
    │
    (new Activity instance created)
    │
onCreate()     ← Fresh start, all variables reset
onStart()
onResume()
```

The form fields will be empty. This is one of the most common Android bugs.

**The fix**: Use a `ViewModel`. ViewModel is tied to the screen's lifecycle, not the Activity instance — it survives rotation. We cover this in Section 6.

```kotlin
// With ViewModel — survives rotation
class FormViewModel : ViewModel() {
    var formData = MutableStateFlow(FormState())
    // This object lives across Activity recreation
}
```

</details>

---

## 4. Intent — How Screens Communicate

### What Is an Intent?

An **Intent** is a message object that describes an action to perform. It is how Android components (Activities, Services) communicate.

Two types:
1. **Explicit Intent**: "Open THIS specific Activity" — you name the class
2. **Implicit Intent**: "Someone handle THIS action" — Android picks the right app

```kotlin
// Explicit Intent — navigate to PaymentActivity from HomeActivity
class HomeActivity : AppCompatActivity() {

    fun onPayCitationClick(citationId: String) {
        // Create an intent targeting PaymentActivity specifically
        val intent = Intent(this, PaymentActivity::class.java)

        // Attach data as key-value pairs called "extras"
        intent.putExtra("CITATION_ID", citationId)
        intent.putExtra("AMOUNT", 150.00)

        // Launch it
        startActivity(intent)
    }
}

// PaymentActivity receives the data
class PaymentActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_payment)

        // Retrieve the data passed from HomeActivity
        val citationId = intent.getStringExtra("CITATION_ID") ?: ""
        val amount = intent.getDoubleExtra("AMOUNT", 0.0)

        // Now use citationId and amount to display the payment form
    }
}
```

```kotlin
// Implicit Intent — open a URL in the browser
// Android asks: "who can handle ACTION_VIEW with a http URL?"
// Chrome, Firefox, or whatever browser is installed will handle it
val browserIntent = Intent(Intent.ACTION_VIEW, Uri.parse("https://myapp.com"))
startActivity(browserIntent)

// Implicit Intent — share text to any app
val shareIntent = Intent(Intent.ACTION_SEND).apply {
    type = "text/plain"
    putExtra(Intent.EXTRA_TEXT, "Check out my citation: CIT-001")
}
startActivity(Intent.createChooser(shareIntent, "Share via"))
```

---

### 🎯 Practice — Level 2

**Scenario**: You are writing an Appium test for a flow where a user:
1. Taps "Pay Citation" on the home screen
2. Is taken to the Payment screen
3. The amount `$150.00` is displayed on the Payment screen

The amount is passed via Intent extra. What could break this flow in production that your test should verify?

<details><summary>Answer</summary>

**Two things can break this:**

**Bug 1: Intent extra key mismatch**
The HomeActivity uses key `"AMOUNT"` when putting the extra. The PaymentActivity uses key `"amount"` (lowercase) when reading it. Android is case-sensitive. Result: `getDoubleExtra("amount", 0.0)` returns `0.0` — the payment screen shows `$0.00`.

Your test catches this by asserting the amount displayed:
```java
// Appium test
WebElement amountText = driver.findElement(By.id("com.app:id/tv_amount"));
assertEquals("$150.00", amountText.getText());
// If it shows $0.00, the Intent key is wrong
```

**Bug 2: Missing null check / default value**
If the PaymentActivity is launched WITHOUT the intent extra (e.g., via a deep link that doesn't include the amount), `getDoubleExtra("AMOUNT", 0.0)` silently returns 0. The user sees $0.00, pays nothing, and the citation is marked paid with zero amount.

Your test should include a negative case — launch PaymentActivity directly without extras and verify it shows an error, not $0.00.

</details>

---

## 5. Fragment — Reusable Screen Pieces

### The Problem Fragment Solves

Imagine a news app on a phone and a tablet:

```
PHONE (narrow screen):              TABLET (wide screen):
┌─────────────────────┐             ┌──────────────────────────────────┐
│   Article List      │             │  Article List │  Article Detail  │
│   ─────────────     │             │  ──────────── │  ──────────────  │
│   > Article 1       │             │  > Article 1  │  Article 1 body  │
│   > Article 2       │             │  > Article 2  │  text text text  │
│   > Article 3       │             │  > Article 3  │  text text text  │
│                     │             │               │                  │
└─────────────────────┘             └──────────────────────────────────┘
Tap an article → new screen         Both panels side by side
```

Without Fragments, you need completely different code for phone and tablet. With Fragments, you have:
- `ArticleListFragment` — reusable piece showing the list
- `ArticleDetailFragment` — reusable piece showing one article

On phone: show them one at a time. On tablet: show both at once. Same Fragments, different layout.

### Fragment Basics in Kotlin

```kotlin
// A Fragment is like a mini-Activity with its own lifecycle and layout
class ArticleListFragment : Fragment(R.layout.fragment_article_list) {

    // onViewCreated is Fragment's equivalent of Activity's onCreate
    // At this point, the fragment's XML is inflated and views exist
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        val recyclerView = view.findViewById<RecyclerView>(R.id.rv_articles)
        recyclerView.adapter = ArticleAdapter(getArticles())
    }

    // Activity uses setContentView() — Fragment returns its layout here
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        return inflater.inflate(R.layout.fragment_article_list, container, false)
    }
}

// The Activity HOSTS the Fragment — it provides the container
class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        // Add the fragment to a container view in activity_main.xml
        supportFragmentManager.beginTransaction()
            .replace(R.id.fragment_container, ArticleListFragment())
            .commit()
    }
}
```

### Fragment Lifecycle vs Activity Lifecycle

Fragment has additional lifecycle methods beyond Activity's:

```
Activity onCreate()
      │
      ▼
Fragment onAttach()      ← Fragment attached to Activity context
Fragment onCreate()      ← Fragment initializing (no view yet)
Fragment onCreateView()  ← Fragment inflates its layout — RETURN the view here
Fragment onViewCreated() ← View exists — wire up click listeners, RecyclerView HERE
      │
Activity/Fragment is visible
      │
Fragment onDestroyView() ← Fragment view destroyed (Fragment can still exist)
Fragment onDetach()      ← Fragment detached from Activity
```

**Key insight**: `onDestroyView()` is called when the Fragment's view is gone but the Fragment OBJECT still exists in memory. This means you must null out view references in `onDestroyView()` to prevent memory leaks.

---

## 6. ViewModel — Surviving Configuration Changes

### The Problem

We established that rotation destroys and recreates the Activity. You need a place to store UI data that **survives rotation but is still tied to the screen's lifetime** (destroyed when user leaves the screen permanently).

That place is `ViewModel`.

### How ViewModel Survives

```
                    User Uses App
                          │
              ┌───────────┴────────────┐
              │                        │
      Activity Instance          ViewModel Instance
      (in RAM, tied to         (in RAM, tied to
       screen config)            screen CONCEPT)
              │                        │
         User ROTATES                  │
              │                        │ ← NOT destroyed
         ┌────▼────┐                   │
         │DESTROYED│                   │
         └────┬────┘                   │
              │                        │
      New Activity Instance ←──────────┘
      (onCreate called)         ViewModel survives!
      gets SAME ViewModel
```

Android achieves this via a `ViewModelStore` that is kept alive across config changes, attached to the activity's non-configuration instance.

### ViewModel in Practice

```kotlin
// The ViewModel — holds UI state and business logic
// Lives as long as the screen is on the back stack
class LoginViewModel : ViewModel() {

    // MutableStateFlow holds state that the UI observes
    // private to prevent UI from setting it directly
    private val _loginState = MutableStateFlow<LoginState>(LoginState.Idle)

    // Public read-only view exposed to the UI
    val loginState: StateFlow<LoginState> = _loginState.asStateFlow()

    // Business logic — calls the repository (network/DB layer)
    fun login(username: String, password: String) {
        _loginState.value = LoginState.Loading

        viewModelScope.launch {  // coroutine scoped to ViewModel lifetime
            try {
                val result = authRepository.login(username, password)
                _loginState.value = LoginState.Success(result.userId)
            } catch (e: Exception) {
                _loginState.value = LoginState.Error(e.message ?: "Login failed")
            }
        }
        // viewModelScope is cancelled automatically when ViewModel is cleared
        // (i.e., when the user navigates away permanently)
    }
}

// Sealed class — represents all possible states of the login process
sealed class LoginState {
    object Idle    : LoginState()              // nothing happening
    object Loading : LoginState()              // network call in progress
    data class Success(val userId: String) : LoginState()
    data class Error(val message: String) : LoginState()
}
```

```kotlin
// The Activity — OBSERVES the ViewModel, updates UI
class LoginActivity : AppCompatActivity() {

    // ViewModels are retrieved, not created directly
    // Android ensures you get THE SAME instance after rotation
    private val viewModel: LoginViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_login)

        // Observe state changes and update UI accordingly
        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.loginState.collect { state ->
                    when (state) {
                        is LoginState.Idle    -> showForm()
                        is LoginState.Loading -> showSpinner()
                        is LoginState.Success -> navigateToHome(state.userId)
                        is LoginState.Error   -> showError(state.message)
                    }
                }
            }
        }

        findViewById<Button>(R.id.btn_login).setOnClickListener {
            val username = findViewById<EditText>(R.id.et_username).text.toString()
            val password = findViewById<EditText>(R.id.et_password).text.toString()
            viewModel.login(username, password)
        }
    }
}
```

---

### 🎯 Practice — Level 2

**Question**: Why is the business logic (API call) in the ViewModel and NOT in the Activity?

<details><summary>Answer — Point by Point</summary>

**Reason 1: Rotation safety**
If the login API call takes 3 seconds and the user rotates mid-call, the Activity is destroyed. If the call was in the Activity, it is cancelled. If it is in the ViewModel (in `viewModelScope`), it continues through rotation. The new Activity instance subscribes to the same ViewModel and gets the result.

**Reason 2: Testability**
You can test the ViewModel in pure JUnit without any Android emulator or device. The ViewModel has no Android UI dependencies — it only knows about `LoginState` and the repository interface. Testing the Activity requires a device or Robolectric (heavyweight). Testing the ViewModel is:
```kotlin
@Test
fun `login success updates state to Success`() = runTest {
    val fakeRepo = FakeAuthRepository(shouldSucceed = true)
    val viewModel = LoginViewModel(fakeRepo)

    viewModel.login("user@test.com", "password")

    val state = viewModel.loginState.value
    assertThat(state).isInstanceOf(LoginState.Success::class.java)
}
```

**Reason 3: Single Responsibility Principle**
Activity is responsible for: binding views, handling lifecycle, observing state. ViewModel is responsible for: holding state, calling business logic. Mixing them creates a "God Activity" that is impossible to test and maintain.

</details>

---

## 7. LiveData and StateFlow — Reactive Data

### The Core Idea: Observer Pattern

Instead of the Activity asking the ViewModel "what is the current user?" every time, the Activity **subscribes once** and the ViewModel **pushes updates** when data changes.

```
WITHOUT REACTIVE:                   WITH REACTIVE (StateFlow):
─────────────────                   ───────────────────────────

Activity asks:                      Activity subscribes ONCE:
"What is the user?"                 viewModel.userFlow.collect { user →
                                      updateUI(user)
Every 2 seconds:                    }
"What is the user?"
"What is the user?"                 ViewModel pushes:
                                    _userFlow.value = newUser
→ Polling is wasteful              → Activity automatically gets it
→ UI can be stale between polls    → UI always shows latest
```

### LiveData vs StateFlow — Which to Use

| | LiveData | StateFlow |
|---|---|---|
| Origin | Android Jetpack (Java-friendly) | Kotlin Coroutines |
| Lifecycle aware | YES — auto (stops when UI not visible) | Manual (`repeatOnLifecycle`) |
| Initial value required | NO | YES — must have initial value |
| Transformation | `map`, `switchMap` (clunky) | Kotlin operators (clean) |
| Testing | Harder | Easy with `runTest` |
| Recommended in 2024 | Only for legacy code | ✅ Prefer StateFlow |

```kotlin
// StateFlow example — modern approach
class CartViewModel : ViewModel() {

    data class CartState(
        val items: List<CartItem> = emptyList(),
        val totalAmount: Double = 0.0,
        val isLoading: Boolean = false
    )

    private val _state = MutableStateFlow(CartState())
    val state: StateFlow<CartState> = _state.asStateFlow()

    fun addItem(item: CartItem) {
        val current = _state.value
        val newItems = current.items + item
        val newTotal = newItems.sumOf { it.price }

        // Emit new state — Activity will receive this automatically
        _state.value = current.copy(
            items = newItems,
            totalAmount = newTotal
        )
    }

    fun removeItem(itemId: String) {
        val current = _state.value
        val newItems = current.items.filter { it.id != itemId }
        _state.value = current.copy(
            items = newItems,
            totalAmount = newItems.sumOf { it.price }
        )
    }
}
```

```kotlin
// Collecting in the Activity/Fragment
lifecycleScope.launch {
    repeatOnLifecycle(Lifecycle.State.STARTED) {
        // STARTED means: start collecting when visible, stop when not
        // This prevents memory leaks and wasted computation
        viewModel.state.collect { state ->
            cartAdapter.submitList(state.items)
            totalTextView.text = "$${state.totalAmount}"
            progressBar.isVisible = state.isLoading
        }
    }
}
```

---

## 8. Room Database — Structured Local Storage

Room is Android's recommended SQLite wrapper. It maps Kotlin data classes to database tables.

```kotlin
// 1. ENTITY — Maps to a database table
@Entity(tableName = "citations")
data class Citation(
    @PrimaryKey val id: String,
    val amount: Double,
    val status: String,           // "PENDING", "PAID", "CANCELLED"
    val createdAt: Long           // Unix timestamp in milliseconds
)

// 2. DAO (Data Access Object) — Defines database operations
@Dao
interface CitationDao {

    @Query("SELECT * FROM citations ORDER BY createdAt DESC")
    fun getAllCitations(): Flow<List<Citation>>
    // Flow means this auto-updates when the DB changes — reactive!

    @Query("SELECT * FROM citations WHERE status = :status")
    fun getCitationsByStatus(status: String): Flow<List<Citation>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCitation(citation: Citation)

    @Update
    suspend fun updateCitation(citation: Citation)

    @Delete
    suspend fun deleteCitation(citation: Citation)

    @Query("SELECT COUNT(*) FROM citations WHERE status = 'PENDING'")
    suspend fun getPendingCount(): Int
}

// 3. DATABASE — The Room database class
@Database(entities = [Citation::class], version = 1)
abstract class AppDatabase : RoomDatabase() {
    abstract fun citationDao(): CitationDao

    companion object {
        // Singleton pattern — only one DB instance
        @Volatile
        private var instance: AppDatabase? = null

        fun getInstance(context: Context): AppDatabase {
            return instance ?: synchronized(this) {
                Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "app_database"
                ).build().also { instance = it }
            }
        }
    }
}
```

---

### 🎯 Practice — Level 2

**Question**: Your ViewModel needs to show citations from Room DB. Write the ViewModel code that fetches citations reactively and exposes them as StateFlow to the UI. Also: why use `Flow<List<Citation>>` from the DAO instead of `List<Citation>`?

<details><summary>Answer</summary>

```kotlin
class CitationListViewModel(
    private val dao: CitationDao
) : ViewModel() {

    // Convert Room's Flow<List<Citation>> → StateFlow for the UI
    // stateIn: converts cold Flow to hot StateFlow
    val citations: StateFlow<List<Citation>> = dao
        .getAllCitations()
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000L),
            initialValue = emptyList()
        )
    // 5000L ms: keep StateFlow alive for 5 seconds after last collector
    // (prevents restart if Activity briefly goes to background and comes back)
}
```

**Why `Flow<List<Citation>>` instead of `List<Citation>`?**

`Flow<List<Citation>>` is a **reactive stream**. Room uses SQLite observers under the hood — when you INSERT, UPDATE, or DELETE a citation, Room detects the change and emits a new `List<Citation>` to all collectors automatically.

If you used `suspend fun getAllCitations(): List<Citation>` instead, you would only get the list ONCE at call time. To see new citations, you'd have to manually call it again. With `Flow`, the UI always shows the latest data — you insert one record anywhere in the app, and the list screen updates automatically.

This is identical to the reactive streams concept in Spring Boot (`Flux<T>` in WebFlux) — the same pattern across platforms.

</details>

---

## 9. Jetpack Compose — Modern Declarative UI

### XML vs Compose: Two Ways to Build UI

Android originally built UIs with XML files (declarative structure + Java/Kotlin code to connect them). Jetpack Compose (2021+) is a fully code-based declarative UI system — like React for Android.

```
XML APPROACH (traditional):               COMPOSE APPROACH (modern):
─────────────────────────────             ─────────────────────────────
res/layout/activity_login.xml             LoginScreen.kt
(XML — declares structure)
                                          @Composable
<LinearLayout>                            fun LoginScreen(
  <EditText                                   viewModel: LoginViewModel
      android:id="@+id/et_user" />        ) {
  <Button                                     var username by remember {
      android:id="@+id/btn_login" />              mutableStateOf("") }
</LinearLayout>                               Column {
                                              TextField(
LoginActivity.kt                                value = username,
(Kotlin — connects the XML)                     onValueChange = { username = it }
                                              )
val usernameField =                           Button(
    findViewById<EditText>(R.id.et_user)          onClick = {
usernameField.addTextChangedListener {            viewModel.login(username, ...)
    // update something                       }
}                                           ) { Text("Login") }
                                          }
                                      }
```

### A Real Compose Screen

```kotlin
// Login screen in Jetpack Compose
@Composable
fun LoginScreen(
    viewModel: LoginViewModel = viewModel(),
    onLoginSuccess: (String) -> Unit
) {
    // Collect ViewModel state — recomposition happens automatically when state changes
    val loginState by viewModel.loginState.collectAsStateWithLifecycle()

    // Local UI state (not in ViewModel — truly local to this Composable)
    var username by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var passwordVisible by remember { mutableStateOf(false) }

    // React to state changes
    LaunchedEffect(loginState) {
        if (loginState is LoginState.Success) {
            onLoginSuccess((loginState as LoginState.Success).userId)
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = "Welcome Back",
            style = MaterialTheme.typography.headlineMedium,
            modifier = Modifier.padding(bottom = 32.dp)
        )

        OutlinedTextField(
            value = username,
            onValueChange = { username = it },
            label = { Text("Email") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(16.dp))

        OutlinedTextField(
            value = password,
            onValueChange = { password = it },
            label = { Text("Password") },
            visualTransformation = if (passwordVisible)
                VisualTransformation.None else PasswordVisualTransformation(),
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(24.dp))

        // Show spinner or button based on state
        when (loginState) {
            is LoginState.Loading -> CircularProgressIndicator()
            is LoginState.Error   -> {
                Text(
                    text = (loginState as LoginState.Error).message,
                    color = MaterialTheme.colorScheme.error
                )
                LoginButton(username, password, viewModel)
            }
            else -> LoginButton(username, password, viewModel)
        }
    }
}

@Composable
private fun LoginButton(username: String, password: String, viewModel: LoginViewModel) {
    Button(
        onClick = { viewModel.login(username, password) },
        modifier = Modifier.fillMaxWidth(),
        enabled = username.isNotEmpty() && password.isNotEmpty()
    ) {
        Text("Login")
    }
}
```

---

## 10. Android Testing Pyramid — Three Levels

```
                        ▲
                       / \
                      /   \
                     / E2E \      ← Appium (small number, slow, high value)
                    /       \
                   /─────────\
                  / Instrument \   ← Espresso (medium, runs on device)
                 /  ed Tests    \
                /               \
               /─────────────────\
              /    Unit Tests      \  ← JUnit + Mockito (large number, fast)
             /_____________________ \
```

| Layer | Tool | What It Tests | Speed | Count |
|---|---|---|---|---|
| Unit | JUnit 5 + Mockito | Pure logic: ViewModel, Repository, Utility classes | ~50ms/test | Many (hundreds) |
| Instrumented | Espresso | UI interactions on a real device/emulator | ~2-10s/test | Medium (tens) |
| E2E | Appium | Full user journey across multiple screens | ~30-120s/test | Few (10-20) |

**The Rule**: If a test CAN be a unit test, it SHOULD be a unit test. Don't use Espresso where JUnit works. Don't use Appium where Espresso works.

---

## 11. Level 1: Unit Tests with JUnit + Mockito

Unit tests run on your laptop's JVM — NO emulator needed. This is why they're fast.

### Testing a ViewModel

```kotlin
// Build.gradle dependencies for testing
// testImplementation "junit:junit:4.13.2"
// testImplementation "org.mockito.kotlin:mockito-kotlin:5.1.0"
// testImplementation "org.jetbrains.kotlinx:kotlinx-coroutines-test:1.7.3"
// testImplementation "app.cash.turbine:turbine:1.0.0"  ← for testing Flow/StateFlow

class LoginViewModelTest {

    // Replace coroutine dispatchers with TestDispatcher in tests
    @get:Rule
    val coroutineRule = MainDispatcherRule()

    private lateinit var fakeRepository: FakeAuthRepository
    private lateinit var viewModel: LoginViewModel

    @Before
    fun setup() {
        fakeRepository = FakeAuthRepository()
        viewModel = LoginViewModel(fakeRepository)
    }

    @Test
    fun `initial state is Idle`() {
        assertThat(viewModel.loginState.value).isInstanceOf(LoginState.Idle::class.java)
    }

    @Test
    fun `login sets Loading state then Success on successful login`() = runTest {
        // Given: repository will succeed
        fakeRepository.shouldSucceed = true

        // Use Turbine to test StateFlow emissions in order
        viewModel.loginState.test {
            // Consume initial Idle state
            assertThat(awaitItem()).isInstanceOf(LoginState.Idle::class.java)

            // When: user logs in
            viewModel.login("user@test.com", "password123")

            // Then: Loading state first
            assertThat(awaitItem()).isInstanceOf(LoginState.Loading::class.java)

            // Then: Success state
            val successState = awaitItem()
            assertThat(successState).isInstanceOf(LoginState.Success::class.java)
            assertThat((successState as LoginState.Success).userId).isEqualTo("USR-001")
        }
    }

    @Test
    fun `login sets Error state on failed login`() = runTest {
        fakeRepository.shouldSucceed = false
        fakeRepository.errorMessage = "Invalid credentials"

        viewModel.loginState.test {
            awaitItem() // Idle

            viewModel.login("bad@email.com", "wrongpassword")

            awaitItem() // Loading

            val errorState = awaitItem()
            assertThat(errorState).isInstanceOf(LoginState.Error::class.java)
            assertThat((errorState as LoginState.Error).message).isEqualTo("Invalid credentials")
        }
    }

    @Test
    fun `login with empty username does not call repository`() = runTest {
        viewModel.login("", "password123")

        verify(fakeRepository, never()).login(any(), any())
        // State should remain Idle — empty username rejected before network call
        assertThat(viewModel.loginState.value).isInstanceOf(LoginState.Idle::class.java)
    }
}

// Fake repository — no network, controlled behavior
class FakeAuthRepository : AuthRepository {
    var shouldSucceed = true
    var errorMessage = "Error"

    override suspend fun login(username: String, password: String): AuthResult {
        if (shouldSucceed) return AuthResult(userId = "USR-001")
        else throw Exception(errorMessage)
    }
}
```

### Testing Room DAO (Instrumented Unit Test — Runs on Device)

```kotlin
// Runs on device, but still isolated — uses in-memory DB (no files)
@RunWith(AndroidJUnit4::class)
class CitationDaoTest {

    private lateinit var db: AppDatabase
    private lateinit var dao: CitationDao

    @Before
    fun createDb() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        // inMemoryDatabaseBuilder: DB lives in RAM, auto-deleted after test
        db = Room.inMemoryDatabaseBuilder(context, AppDatabase::class.java)
            .allowMainThreadQueries() // only for tests
            .build()
        dao = db.citationDao()
    }

    @After
    fun closeDb() {
        db.close()
    }

    @Test
    fun insertAndRetrieveCitation() = runTest {
        val citation = Citation(
            id = "CIT-001",
            amount = 150.0,
            status = "PENDING",
            createdAt = System.currentTimeMillis()
        )

        dao.insertCitation(citation)

        val retrieved = dao.getAllCitations().first()
        assertThat(retrieved).hasSize(1)
        assertThat(retrieved[0].id).isEqualTo("CIT-001")
        assertThat(retrieved[0].amount).isEqualTo(150.0)
    }

    @Test
    fun getPendingCountReturnsCorrectNumber() = runTest {
        dao.insertCitation(Citation("CIT-001", 100.0, "PENDING", 0))
        dao.insertCitation(Citation("CIT-002", 200.0, "PENDING", 0))
        dao.insertCitation(Citation("CIT-003", 300.0, "PAID", 0))

        val pendingCount = dao.getPendingCount()
        assertThat(pendingCount).isEqualTo(2)  // CIT-001 and CIT-002
    }
}
```

---

### 🎯 Practice — Level 2

**Challenge**: Write a unit test for `CartViewModel.addItem()` that verifies:
1. Adding one item updates the item list
2. The total amount is correctly calculated
3. Adding the same item again increases quantity (not adds duplicate)

<details><summary>Answer</summary>

```kotlin
class CartViewModelTest {

    @get:Rule
    val coroutineRule = MainDispatcherRule()

    private lateinit var viewModel: CartViewModel

    @Before
    fun setup() {
        viewModel = CartViewModel()
    }

    @Test
    fun `addItem adds item to list and updates total`() = runTest {
        val item = CartItem(id = "PROD-1", name = "Widget", price = 29.99, quantity = 1)

        viewModel.addItem(item)

        val state = viewModel.state.value
        assertThat(state.items).hasSize(1)
        assertThat(state.items[0].id).isEqualTo("PROD-1")
        assertThat(state.totalAmount).isEqualTo(29.99)
    }

    @Test
    fun `addItem multiple items sums total correctly`() = runTest {
        viewModel.addItem(CartItem("P1", "A", 10.0, 1))
        viewModel.addItem(CartItem("P2", "B", 25.50, 1))
        viewModel.addItem(CartItem("P3", "C", 5.00, 1))

        val state = viewModel.state.value
        assertThat(state.items).hasSize(3)
        assertThat(state.totalAmount).isEqualTo(40.50)
    }

    @Test
    fun `addItem same product increments quantity not adds duplicate`() = runTest {
        val item = CartItem("P1", "Widget", 10.0, 1)

        viewModel.addItem(item)
        viewModel.addItem(item)  // same product

        val state = viewModel.state.value
        // Should have 1 item with quantity 2, NOT 2 items with quantity 1
        assertThat(state.items).hasSize(1)
        assertThat(state.items[0].quantity).isEqualTo(2)
        assertThat(state.totalAmount).isEqualTo(20.0)  // 2 × $10
    }
}
```

</details>

---

## 12. Level 2: UI Tests with Espresso

Espresso is Google's UI testing framework for Android. It runs on a real device or emulator. It has direct access to the app's UI thread — meaning it KNOWS when the app is idle vs. processing (no `sleep()` needed).

### Espresso's Core API

```kotlin
// Three parts to every Espresso interaction:
// 1. onView()  — find the element
// 2. perform() — do something to it
// 3. check()   — assert something about it

// Find by resource ID and click
onView(withId(R.id.btn_login))
    .perform(click())

// Find by text
onView(withText("Login"))
    .check(matches(isDisplayed()))

// Type into a text field
onView(withId(R.id.et_username))
    .perform(clearText(), typeText("user@test.com"), closeSoftKeyboard())

// Assert text content
onView(withId(R.id.tv_error))
    .check(matches(withText("Invalid credentials")))

// Assert visibility
onView(withId(R.id.progress_bar))
    .check(matches(not(isDisplayed())))
```

### A Full Espresso Test

```kotlin
@RunWith(AndroidJUnit4::class)
@LargeTest  // Marks this as a slow test (runs on device)
class LoginActivityTest {

    // Launches the Activity before each test
    @get:Rule
    val activityRule = ActivityScenarioRule(LoginActivity::class.java)

    @Test
    fun successfulLogin_navigatesToHomeScreen() {
        // Type username
        onView(withId(R.id.et_username))
            .perform(
                clearText(),
                typeText("valid@user.com"),
                closeSoftKeyboard()
            )

        // Type password
        onView(withId(R.id.et_password))
            .perform(
                clearText(),
                typeText("correctpassword"),
                closeSoftKeyboard()
            )

        // Click login button
        onView(withId(R.id.btn_login))
            .perform(click())

        // After successful login, HomeActivity should be visible
        // ActivityScenario handles the Activity transition
        onView(withId(R.id.tv_welcome_home))
            .check(matches(isDisplayed()))
        onView(withId(R.id.tv_welcome_home))
            .check(matches(withText(startsWith("Welcome,"))))
    }

    @Test
    fun invalidCredentials_showsErrorMessage() {
        onView(withId(R.id.et_username))
            .perform(typeText("bad@user.com"), closeSoftKeyboard())
        onView(withId(R.id.et_password))
            .perform(typeText("wrongpass"), closeSoftKeyboard())
        onView(withId(R.id.btn_login))
            .perform(click())

        // Error message should appear
        onView(withId(R.id.tv_error))
            .check(matches(isDisplayed()))
            .check(matches(withText("Invalid email or password")))

        // Login button should still be visible (not navigated away)
        onView(withId(R.id.btn_login))
            .check(matches(isDisplayed()))
    }

    @Test
    fun emptyUsername_loginButtonDisabled() {
        // Leave username empty, fill password
        onView(withId(R.id.et_password))
            .perform(typeText("somepassword"), closeSoftKeyboard())

        // Login button should be disabled (greyed out)
        onView(withId(R.id.btn_login))
            .check(matches(not(isEnabled())))
    }
}
```

### Testing a RecyclerView with Espresso

RecyclerView needs a special Espresso matcher because items are virtual:

```kotlin
// Espresso RecyclerView actions
@Test
fun citationList_clickOnItem_navigatesToDetail() {
    // Scroll to position 3 and click
    onView(withId(R.id.rv_citations))
        .perform(RecyclerViewActions.actionOnItemAtPosition<CitationViewHolder>(
            3,
            click()
        ))

    // Verify detail screen appeared
    onView(withId(R.id.tv_citation_detail_title))
        .check(matches(isDisplayed()))
}

@Test
fun citationList_scrollAndClickByText() {
    // Scroll until item with specific text is visible, then click
    onView(withId(R.id.rv_citations))
        .perform(RecyclerViewActions.scrollTo<CitationViewHolder>(
            hasDescendant(withText("Citation CIT-500"))
        ))
        .perform(RecyclerViewActions.actionOnItem<CitationViewHolder>(
            hasDescendant(withText("Citation CIT-500")),
            click()
        ))

    onView(withId(R.id.tv_citation_id))
        .check(matches(withText("CIT-500")))
}
```

---

### 🎯 Practice — Level 3 (Advanced)

**Challenge**: You have a payment form. You want to test that:
- Amount field only accepts numbers (not letters)
- Submit button is disabled when amount is 0 or empty
- Submitting a valid amount shows a confirmation dialog
- Dismissing the dialog returns to the form

Write the Espresso tests.

<details><summary>Answer</summary>

```kotlin
@RunWith(AndroidJUnit4::class)
@LargeTest
class PaymentFormTest {

    @get:Rule
    val activityRule = ActivityScenarioRule(PaymentActivity::class.java)

    @Test
    fun amountField_rejectsLetters() {
        onView(withId(R.id.et_amount))
            .perform(typeText("abc123"), closeSoftKeyboard())

        // Only "123" should be in the field — letters filtered by inputType="numberDecimal"
        onView(withId(R.id.et_amount))
            .check(matches(withText("123")))
    }

    @Test
    fun submitButton_disabledWhenAmountEmpty() {
        // Don't type anything
        onView(withId(R.id.btn_submit))
            .check(matches(not(isEnabled())))
    }

    @Test
    fun submitButton_disabledWhenAmountIsZero() {
        onView(withId(R.id.et_amount))
            .perform(typeText("0"), closeSoftKeyboard())
        onView(withId(R.id.btn_submit))
            .check(matches(not(isEnabled())))
    }

    @Test
    fun validAmount_showsConfirmationDialog() {
        onView(withId(R.id.et_amount))
            .perform(typeText("150.00"), closeSoftKeyboard())
        onView(withId(R.id.btn_submit))
            .check(matches(isEnabled()))
            .perform(click())

        // Dialog should appear — use Espresso's onView with isDisplayed()
        // AlertDialog title is in a system view:
        onView(withText("Confirm Payment"))
            .check(matches(isDisplayed()))
        onView(withText("You are about to pay $150.00. Confirm?"))
            .check(matches(isDisplayed()))
    }

    @Test
    fun dismissingConfirmationDialog_returnsToForm() {
        onView(withId(R.id.et_amount))
            .perform(typeText("150.00"), closeSoftKeyboard())
        onView(withId(R.id.btn_submit))
            .perform(click())

        // Dismiss by clicking Cancel
        onView(withText("Cancel"))
            .check(matches(isDisplayed()))
            .perform(click())

        // Dialog gone, form still visible
        onView(withId(R.id.et_amount))
            .check(matches(isDisplayed()))
        onView(withId(R.id.et_amount))
            .check(matches(withText("150.00")))  // data preserved
    }
}
```

</details>

---

## 13. Level 3: E2E Tests with Appium

Appium tests the full user journey — multiple screens, real app behavior. This is what you saw in Chapter 1.

### Setting Up Appium for Android Testing

```java
// Java — Full Appium setup for Android
public class BaseAppiumTest {

    protected AndroidDriver driver;

    @BeforeEach
    public void setUp() throws MalformedURLException {
        UiAutomator2Options options = new UiAutomator2Options()
            .setPlatformName("Android")
            .setPlatformVersion("13")
            .setDeviceName("emulator-5554")
            .setApp(System.getProperty("user.dir") + "/apps/myapp-debug.apk")
            .setAppPackage("com.mycompany.myapp")
            .setAppActivity(".MainActivity")
            .setAutoGrantPermissions(true)   // auto-accept permission dialogs
            .setNewCommandTimeout(Duration.ofSeconds(60));

        driver = new AndroidDriver(new URL("http://127.0.0.1:4723"), options);
        driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(10));
    }

    @AfterEach
    public void tearDown() {
        if (driver != null) driver.quit();
    }
}
```

### A Full E2E Test — Login to Pay Citation

```java
public class CitationPaymentE2ETest extends BaseAppiumTest {

    @Test
    public void fullPaymentFlow_successfullyPaysCitation() throws InterruptedException {
        // ── Screen 1: Login ──────────────────────────────────────────────
        // Find elements by resource ID (stable, developer-assigned)
        WebElement usernameField = driver.findElement(
            AppiumBy.id("com.mycompany.myapp:id/et_username")
        );
        usernameField.sendKeys("testuser@example.com");

        WebElement passwordField = driver.findElement(
            AppiumBy.id("com.mycompany.myapp:id/et_password")
        );
        passwordField.sendKeys("TestPassword123!");

        driver.findElement(AppiumBy.id("com.mycompany.myapp:id/btn_login"))
              .click();

        // ── Screen 2: Home / Citation List ───────────────────────────────
        // Wait for home screen to load
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(15));
        WebElement citationList = wait.until(
            ExpectedConditions.presenceOfElementLocated(
                AppiumBy.id("com.mycompany.myapp:id/rv_citations")
            )
        );
        assertTrue(citationList.isDisplayed(), "Citation list not visible after login");

        // Scroll to find the specific citation (in case it is below the fold)
        WebElement targetCitation = driver.findElement(
            AppiumBy.androidUIAutomator(
                "new UiScrollable(new UiSelector().scrollable(true))" +
                ".scrollIntoView(new UiSelector().textContains(\"CIT-001\"))"
            )
        );
        targetCitation.click();

        // ── Screen 3: Citation Detail ─────────────────────────────────────
        WebElement amountText = wait.until(
            ExpectedConditions.presenceOfElementLocated(
                AppiumBy.id("com.mycompany.myapp:id/tv_amount")
            )
        );
        assertEquals("$150.00", amountText.getText());

        WebElement payButton = driver.findElement(
            AppiumBy.id("com.mycompany.myapp:id/btn_pay")
        );
        assertTrue(payButton.isEnabled(), "Pay button should be enabled");
        payButton.click();

        // ── Screen 4: Payment Confirmation ───────────────────────────────
        WebElement confirmTitle = wait.until(
            ExpectedConditions.presenceOfElementLocated(
                AppiumBy.id("com.mycompany.myapp:id/tv_confirm_title")
            )
        );
        assertEquals("Confirm Payment", confirmTitle.getText());

        // Confirm payment
        driver.findElement(AppiumBy.id("com.mycompany.myapp:id/btn_confirm"))
              .click();

        // ── Screen 5: Success Screen ──────────────────────────────────────
        WebElement successMsg = wait.until(
            ExpectedConditions.presenceOfElementLocated(
                AppiumBy.id("com.mycompany.myapp:id/tv_success")
            )
        );
        assertTrue(successMsg.isDisplayed());
        assertTrue(successMsg.getText().contains("Payment successful"));

        // Verify the citation status updated on success screen
        WebElement statusBadge = driver.findElement(
            AppiumBy.id("com.mycompany.myapp:id/tv_status")
        );
        assertEquals("PAID", statusBadge.getText());
    }

    @Test
    public void paymentFlow_networkError_showsRetryOption() {
        // Test the error path — requires network to be mocked
        // For Appium: use Charles Proxy or MockWebServer to return 500
        // Then verify the error state is shown with a retry button
        loginAs("testuser@example.com", "TestPassword123!");
        tapCitation("CIT-002");

        // Simulate network failure (configured in test setup via proxy)
        driver.findElement(AppiumBy.id("com.mycompany.myapp:id/btn_pay")).click();
        driver.findElement(AppiumBy.id("com.mycompany.myapp:id/btn_confirm")).click();

        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));
        WebElement errorView = wait.until(
            ExpectedConditions.presenceOfElementLocated(
                AppiumBy.id("com.mycompany.myapp:id/tv_error")
            )
        );
        assertTrue(errorView.isDisplayed());
        // Retry button should appear
        WebElement retryButton = driver.findElement(
            AppiumBy.id("com.mycompany.myapp:id/btn_retry")
        );
        assertTrue(retryButton.isDisplayed());
    }
}
```

---

## 14. Espresso vs Appium — When to Use Which

```
┌────────────────────────────────┬──────────────────────┬───────────────────────┐
│ Scenario                       │ Use Espresso         │ Use Appium            │
├────────────────────────────────┼──────────────────────┼───────────────────────┤
│ Test login form validation     │ ✅ Faster, simpler   │ ❌ Overkill           │
│ Test one Activity's UI logic   │ ✅ Direct access     │ ❌ Overhead           │
│ Test a full 5-screen flow      │ ⚠️ Can do it         │ ✅ Better suited      │
│ Test across apps (share, open) │ ❌ Cannot            │ ✅ System-level       │
│ Test push notifications        │ ❌ Cannot            │ ✅ Notification drawer│
│ Test on multiple platforms     │ ❌ Android only      │ ✅ Android + iOS      │
│ Test speed                     │ ✅ Fast (~2-5s)      │ ⚠️ Slower (~30-60s)  │
│ CI setup complexity            │ ✅ Simple            │ ⚠️ Complex            │
│ Test deep links                │ ⚠️ Limited           │ ✅ via driver.get()   │
│ Team is Java/Kotlin only       │ ✅ Native language   │ ✅ Any language       │
│ QA team (non-Android devs)     │ ⚠️ Need Android KT  │ ✅ Use Python/JS      │
└────────────────────────────────┴──────────────────────┴───────────────────────┘
```

**The practical rule in most teams:**
- Developers write Espresso tests (they know the code, they're in Android Studio)
- QA/SDET engineers write Appium tests (they cover cross-platform, cross-screen flows)
- Appium is NOT a replacement for Espresso — it is a complement at a higher level

---

## 15. Interview Questions on Android

**Q: "What is the Activity lifecycle and why does it matter?"**
> "Activity lifecycle is Android's contract for managing app state across system events — phone calls, screen rotation, memory pressure, and app switching. The key methods are: `onCreate` (one-time setup), `onResume/onPause` (visibility changes), `onStop/onStart` (foreground/background), and `onDestroy` (final cleanup). The critical thing to understand is that screen rotation triggers a full `onDestroy → onCreate` cycle, which is why data must be stored in a ViewModel rather than instance variables — the ViewModel survives configuration changes."

**Q: "What is ViewModel and why not just use a static variable?"**
> "ViewModel provides UI data that survives configuration changes like rotation. Unlike a static variable, ViewModel is scoped to the screen's lifecycle — it is cleared when the user permanently leaves the screen (via back stack). Static variables live for the entire app process, causing memory leaks and state bleeding between screens. ViewModel also integrates with `viewModelScope` for coroutine lifecycle management — coroutines are automatically cancelled when the screen is gone."

**Q: "What is the difference between Espresso and Appium for Android?"**
> "Espresso is Google's white-box UI test framework built into Android. It runs in-process alongside the app, knows about the app's UI thread, and auto-waits for the app to be idle — no explicit waits needed. It's fast, accurate, and best for testing individual Activity/Fragment behavior. Appium is a black-box E2E framework that runs out-of-process, communicates via HTTP to UIAutomator2, and is better for cross-platform tests or cross-app flows. I'd use Espresso for form validation and navigation logic, and Appium for full user journeys that might span multiple screens or need to interact with system UI."

---

**Navigation**: [← Playwright vs Appium](01_Playwright_vs_Appium_Full_Comparison.md) | [📚 Index](00_INDEX.md) | [iOS Native →](03_iOS_Native_Dev_And_Testing.md)
