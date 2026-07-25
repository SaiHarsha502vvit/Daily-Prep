# Android — ViewModel, StateFlow, and LiveData

**Folder**: [03_Android](./) | **Previous**: [02_Activity_Fragment_Lifecycle.md](./02_Activity_Fragment_Lifecycle.md) | **Next**: [04_Jetpack_Compose_Deep_Dive.md](./04_Jetpack_Compose_Deep_Dive.md)

> **Reading contract**: ViewModel is the single most important architectural component in modern Android. It is the bridge between the UI and the data layer, and the solution to the lifecycle problems explained in the previous file. This file teaches you: what a ViewModel IS at the JVM level, why LiveData was replaced by StateFlow, how to use coroutines in ViewModels correctly, how state flows from data source to UI, and every common mistake developers make.

---

## Table of Contents

1. [What Problem ViewModel Solves](#1-what-problem-viewmodel-solves)
2. [How ViewModel Works Internally](#2-how-viewmodel-works-internally)
3. [ViewModel Scope and Lifetime](#3-viewmodel-scope-and-lifetime)
4. [LiveData — The Original Solution](#4-livedata--the-original-solution)
5. [Kotlin Flow — The Modern Solution](#5-kotlin-flow--the-modern-solution)
6. [StateFlow vs SharedFlow vs LiveData](#6-stateflow-vs-sharedflow-vs-livedata)
7. [The Complete ViewModel Pattern](#7-the-complete-viewmodel-pattern)
8. [UiState — Modeling All UI States](#8-uistate--modeling-all-ui-states)
9. [Coroutines in ViewModels](#9-coroutines-in-viewmodels)
10. [SavedStateHandle — Surviving Process Death](#10-savedstatehandle--surviving-process-death)
11. [ViewModel in Tests](#11-viewmodel-in-tests)
12. [Common ViewModel Bugs and Their Tests](#12-common-viewmodel-bugs-and-their-tests)
13. [Interview Q&A](#13-interview-qa)

---

## 1. What Problem ViewModel Solves

Before ViewModel existed, developers put data-loading logic directly in Activities. This caused three problems:

### Problem 1: Data Lost on Rotation

```kotlin
// BEFORE ViewModel — data in Activity:
class CitationListActivity : AppCompatActivity() {
    private var citations: List<Citation> = emptyList()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Every rotation → Activity is destroyed and recreated
        // → onCreate() runs again → API call repeats → user sees spinner again
        fetchCitationsFromAPI()
    }

    private fun fetchCitationsFromAPI() {
        lifecycleScope.launch {
            citations = repository.fetchCitations()  // API call
            updateUI(citations)
        }
    }
    // After rotation: citations is empty, fetchCitationsFromAPI runs AGAIN
    // User experience: spinner appears every time they rotate the device
}
```

### Problem 2: UI Did Work That Belongs Elsewhere

Activities managed network calls, database queries, and business logic — making them impossible to unit test (they require a real Android device to run).

### Problem 3: Memory Leaks

```kotlin
// BEFORE ViewModel — callback holding Activity reference:
class CitationListActivity : AppCompatActivity() {
    override fun onCreate(...) {
        repository.fetchCitations { citations ->
            // This callback holds a reference to 'this' (the Activity)
            // If the Activity is destroyed (rotation, back press) before callback fires:
            // → The Activity CANNOT be garbage collected (the callback holds it)
            // → MEMORY LEAK
            this.updateUI(citations)  // might crash: Activity is destroyed
        }
    }
}
```

### The ViewModel Solution

```
WITHOUT VIEWMODEL:                    WITH VIEWMODEL:
Activity ←── data ←── Repository     Activity ←observes── ViewModel ←── Repository
    │                                                │
    ▼ (on rotation)                                  │ (survives rotation)
Activity DESTROYED                                   │
    │                                                ▼
New Activity created                          SAME ViewModel instance
    │                                                │
    ▼                                                ▼
API called AGAIN                           Data already in ViewModel
Spinner appears again                      UI updates instantly, no spinner
```

---

## 2. How ViewModel Works Internally

### The ViewModelStore

```kotlin
// What the Android framework does behind the scenes:

// Inside ComponentActivity (AppCompatActivity's ancestor):
private val viewModelStore = ViewModelStore()
// ViewModelStore is a simple HashMap: Map<String, ViewModel>

// When you call:
val viewModel: CitationListViewModel by viewModels()

// The framework does:
val key = "com.myapp.CitationListViewModel"
val existing = viewModelStore.get(key)

if (existing != null) {
    return existing as CitationListViewModel  // RETURNS THE SAME INSTANCE on rotation
}

val newViewModel = CitationListViewModel(repository)
viewModelStore.put(key, newViewModel)
return newViewModel  // fresh instance on first creation
```

### Why It Survives Rotation

```
ROTATION SEQUENCE:
  onPause() → onStop() → onDestroy() → [new Activity] → onCreate() → ...

DURING ROTATION (before onDestroy):
  Android saves the ViewModelStore to a NonConfigurationInstance:
  └─ Activity.onRetainNonConfigurationInstance() saves the ViewModelStore
     This is an Android internal mechanism — it runs BEFORE onDestroy

AFTER RECREATION (in new Activity):
  Activity.getLastNonConfigurationInstance() retrieves the ViewModelStore
  ViewModelProvider finds the existing ViewModel in the store
  → The SAME ViewModel object is returned
  → No new instance, no re-initialization
```

### When ViewModel IS Destroyed

```kotlin
override fun onCleared() {
    super.onCleared()
    // Called when:
    // 1. Activity finishes (user presses Back or calls finish())
    // 2. Activity is removed from back stack programmatically
    // 3. App process is killed (process death)

    // NOT called on rotation
    // NOT called on language change
    // NOT called when Activity goes to background

    // Clean up:
    job.cancel()                 // cancel coroutines not tied to viewModelScope
    subscription.close()         // close non-coroutine subscriptions
    mediaPlayer.release()        // release resources
}
```

---

## 3. ViewModel Scope and Lifetime

### Activity-Scoped vs Fragment-Scoped

```kotlin
// Fragment-scoped ViewModel — lives as long as the Fragment
class CitationDetailFragment : Fragment() {
    // Different fragments get different ViewModel instances
    private val viewModel: CitationDetailViewModel by viewModels()
}

// Activity-scoped ViewModel — shared across all Fragments in the same Activity
class CitationListFragment : Fragment() {
    // ALL fragments in this Activity share the SAME instance
    // Used for: communicating between sibling Fragments
    private val sharedViewModel: SharedCitationViewModel by activityViewModels()
}

// Custom-scoped ViewModel (Navigation back stack entry)
class CitationDetailFragment : Fragment() {
    // Scoped to the Navigation back stack entry — lives as long as
    // the destination exists in the back stack
    private val viewModel: CitationDetailViewModel by navGraphViewModels(R.id.payment_graph)
}
```

### When to Use Shared ViewModels

```
SCENARIO: CitationListFragment and CitationFilterBottomSheet need to share state.
The user sets filters in the bottom sheet, and the list updates.

WITHOUT shared ViewModel:
  BottomSheet → listener → Activity → listener → Fragment  ← messy
  Multiple interfaces, tight coupling, hard to test

WITH Activity-scoped ViewModel:
  BottomSheet:    sharedViewModel.setFilters(filters)
  ListFragment:   sharedViewModel.filteredCitations.collect { updateList(it) }
  Communication: automatic, reactive, no interfaces needed
```

---

## 4. LiveData — The Original Solution

LiveData is an **observable data holder** that is lifecycle-aware — it automatically stops delivering values when the observer's lifecycle is not in an active state (STARTED or RESUMED).

```kotlin
class CitationListViewModel : ViewModel() {
    // MutableLiveData: internal — ViewModel can write
    private val _citations = MutableLiveData<List<Citation>>()
    // LiveData: exposed — UI can only read (observe)
    val citations: LiveData<List<Citation>> = _citations

    fun loadCitations() {
        viewModelScope.launch {
            val data = repository.fetchCitations()
            _citations.value = data               // must be called on main thread
            // or: _citations.postValue(data)     // can be called from any thread
        }
    }
}

// In Fragment:
override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
    // 'viewLifecycleOwner' ensures observation stops when view is destroyed
    viewModel.citations.observe(viewLifecycleOwner) { citations ->
        adapter.submitList(citations)
    }
}
```

### LiveData Limitations (Why It Was Replaced)

```
LIMITATION 1: Not a good fit for Kotlin coroutines
  LiveData is Java-based — no built-in suspend function support
  Workaround: liveData { } builder — awkward

LIMITATION 2: Only for Android — no use in pure Kotlin modules
  LiveData is part of androidx — cannot use in domain layer (pure Kotlin)
  Forces Android dependency into business logic

LIMITATION 3: No built-in transformation operators
  Kotlin Flow has 50+ operators (map, filter, debounce, combine, merge, ...)
  LiveData has only: Transformations.map(), Transformations.switchMap()

LIMITATION 4: Single value — not a stream
  LiveData delivers the LATEST value, not a stream of values
  For streams (multiple events), you need channels or custom solutions

LIMITATION 5: No backpressure handling
  If data arrives faster than UI can process, LiveData just overwrites
```

LiveData is still found in older codebases and is not wrong to use — but new code should use **StateFlow** and **SharedFlow**.

---

## 5. Kotlin Flow — The Modern Solution

Flow is a **cold, asynchronous stream of values**. It is part of the Kotlin coroutines library — no Android dependency.

### Cold vs Hot Streams

```
COLD STREAM (Flow):                     HOT STREAM (StateFlow, SharedFlow):
  Code runs ONLY when collected          Code runs regardless of collectors
  Each collector gets its own stream     All collectors share the same stream
  Like a database query (runs each time) Like a live broadcast (ongoing)

  val flow: Flow<Int> = flow {           val stateFlow = MutableStateFlow(0)
      println("Starting work")           // This runs immediately — no collector needed
      emit(1)
      emit(2)
  }
  // Nothing happens until:
  flow.collect { value -> ... }
```

### Flow Operators — The Power of Flow

```kotlin
val repository: CitationRepository = ...

// A pipeline of transformations:
val filteredCitations: Flow<List<Citation>> =
    repository.observeAll()                          // Flow<List<Citation>> from Room
        .filter { list -> list.isNotEmpty() }        // skip empty emissions
        .map { list ->
            list.filter { it.status == "PENDING" }   // only PENDING citations
        }
        .distinctUntilChanged()                      // skip if same as last emission
        .debounce(300)                               // wait 300ms of no new emissions
        .catch { error ->
            emit(emptyList())                        // emit empty list on error
            logError(error)
        }
```

### Flow vs suspend function — When to Use Which

```
USE suspend fun when:                   USE Flow when:
  Single result                           Multiple results over time
  One-shot operation                      Ongoing data stream
  "Get me the current value"              "Notify me whenever the value changes"

  suspend fun fetchCitations():           fun observeCitations():
      List<Citation>                          Flow<List<Citation>>

  // Called once, returns, done           // Emits whenever DB changes
  // Example: one-time API call          // Example: Room database query
```

---

## 6. StateFlow vs SharedFlow vs LiveData

This is the most important table in this file. Understand it completely.

```
PROPERTY          LiveData              StateFlow             SharedFlow
────────────────  ────────────────────  ────────────────────  ────────────────────
Type              Java observable       Kotlin hot flow       Kotlin hot flow
Android dep?      YES (androidx)        NO (kotlinx)          NO (kotlinx)
Has initial val?  NO (starts null)      YES (required)        NO (optional)
Replays to new    YES (last value)      YES (last value)      Configurable (0..N)
subscribers?
Skips same val?   NO                    YES (by default)      NO
Lifecycle aware?  YES (built-in)        NO (you manage)       NO (you manage)
Best for          Simple state, Java    Current UI state      Events/navigation
                  interop               (loading, data,       (one-time events:
                                        error)                snackbar, nav)
```

### StateFlow — For UI State

```kotlin
class CitationListViewModel(
    private val repository: CitationRepository
) : ViewModel() {

    // PRIVATE MutableStateFlow — ViewModel controls writes
    private val _uiState = MutableStateFlow<CitationListUiState>(CitationListUiState.Loading)
    // PUBLIC StateFlow — UI can only read
    val uiState: StateFlow<CitationListUiState> = _uiState.asStateFlow()

    init {
        loadCitations()
    }

    private fun loadCitations() {
        viewModelScope.launch {
            _uiState.value = CitationListUiState.Loading
            try {
                val citations = repository.fetchCitations()
                _uiState.value = CitationListUiState.Success(citations)
            } catch (e: Exception) {
                _uiState.value = CitationListUiState.Error(e.message ?: "Unknown error")
            }
        }
    }
}
```

Key property of StateFlow: it always has a value. New subscribers immediately receive the current value — they never miss it. This is the "replay 1" behavior.

### SharedFlow — For One-Time Events

```kotlin
class PaymentViewModel : ViewModel() {

    // SharedFlow with replay=0: events are NOT replayed to new subscribers
    // This is critical for navigation: you don't want to navigate again
    // when the screen is recreated from the back stack
    private val _events = MutableSharedFlow<PaymentEvent>(replay = 0)
    val events: SharedFlow<PaymentEvent> = _events.asSharedFlow()

    fun pay(citationId: String, amount: Double) {
        viewModelScope.launch {
            try {
                val receipt = repository.payCitation(citationId, amount)
                _events.emit(PaymentEvent.NavigateToSuccess(receipt))
                // ↑ This event is consumed once. If the screen rotates after navigation,
                //   the new screen does NOT re-navigate (replay=0)
            } catch (e: NetworkException) {
                _events.emit(PaymentEvent.ShowSnackbar("Payment failed: ${e.message}"))
            }
        }
    }
}

sealed class PaymentEvent {
    data class NavigateToSuccess(val receipt: PaymentReceipt) : PaymentEvent()
    data class ShowSnackbar(val message: String) : PaymentEvent()
}

// In Fragment:
viewLifecycleOwner.lifecycleScope.launch {
    viewLifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
        viewModel.events.collect { event ->
            when (event) {
                is PaymentEvent.NavigateToSuccess ->
                    findNavController().navigate(
                        PaymentFragmentDirections.toSuccess(event.receipt.id))
                is PaymentEvent.ShowSnackbar ->
                    Snackbar.make(requireView(), event.message, Snackbar.LENGTH_LONG).show()
            }
        }
    }
}
```

### Why Not Use StateFlow for Navigation Events?

```
PROBLEM with StateFlow for navigation:
  StateFlow replays the last value to new subscribers.
  If you store NavigateToSuccess in a StateFlow:

  1. Payment succeeds → _navState.value = NavigateToSuccess(receipt)
  2. Fragment navigates to SuccessScreen
  3. User presses Back → returns to PaymentFragment
  4. PaymentFragment's collector RESTARTS (new lifecycle)
  5. StateFlow replays the last value: NavigateToSuccess(receipt)
  6. Fragment navigates to SuccessScreen AGAIN → unwanted navigation loop

  FIX: Use SharedFlow(replay=0) for one-time events (snackbar, navigation, toast)
       Use StateFlow for persistent state (loading, data, error)
```

---

## 7. The Complete ViewModel Pattern

Putting everything together — a production-quality ViewModel:

```kotlin
@HiltViewModel
class CitationListViewModel @Inject constructor(
    private val fetchCitationsUseCase: FetchCitationsUseCase,
    private val savedStateHandle: SavedStateHandle
) : ViewModel() {

    // ─── UI STATE (current screen state) ──────────────────────────────
    private val _uiState = MutableStateFlow<CitationListUiState>(CitationListUiState.Loading)
    val uiState: StateFlow<CitationListUiState> = _uiState.asStateFlow()

    // ─── ONE-TIME EVENTS (navigate, snackbar) ─────────────────────────
    private val _events = MutableSharedFlow<CitationListEvent>(replay = 0)
    val events: SharedFlow<CitationListEvent> = _events.asSharedFlow()

    // ─── SEARCH QUERY (survives process death via SavedStateHandle) ────
    val searchQuery: StateFlow<String> =
        savedStateHandle.getStateFlow("search_query", initialValue = "")

    // ─── DERIVED STATE (computed from other state) ─────────────────────
    val filteredCitations: StateFlow<List<Citation>> =
        combine(uiState, searchQuery) { state, query ->
            when (state) {
                is CitationListUiState.Success ->
                    if (query.isBlank()) state.citations
                    else state.citations.filter {
                        it.id.contains(query, ignoreCase = true) ||
                        it.description.contains(query, ignoreCase = true)
                    }
                else -> emptyList()
            }
        }.stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5_000),
            initialValue = emptyList()
        )

    // ─── INITIALIZATION ────────────────────────────────────────────────
    init {
        loadCitations()
    }

    // ─── USER ACTIONS (called from UI) ────────────────────────────────
    fun loadCitations() {
        viewModelScope.launch {
            _uiState.value = CitationListUiState.Loading
            fetchCitationsUseCase()
                .onSuccess { citations ->
                    _uiState.value = CitationListUiState.Success(citations)
                }
                .onFailure { error ->
                    _uiState.value = CitationListUiState.Error(
                        error.message ?: "Failed to load citations"
                    )
                    _events.emit(CitationListEvent.ShowErrorSnackbar(error.message ?: "Error"))
                }
        }
    }

    fun onSearchQueryChanged(query: String) {
        savedStateHandle["search_query"] = query  // auto-saves to process death bundle
    }

    fun onCitationClicked(citationId: String) {
        viewModelScope.launch {
            _events.emit(CitationListEvent.NavigateToDetail(citationId))
        }
    }

    fun onRetryClicked() {
        loadCitations()
    }
}
```

---

## 8. UiState — Modeling All UI States

A screen can be in multiple states: loading, success, empty, error. A sealed class models this cleanly:

```kotlin
// Sealed class — exhaustive: every possible state is represented
sealed class CitationListUiState {
    // Loading: no data yet, show spinner
    object Loading : CitationListUiState()

    // Empty: loaded successfully but zero items
    object Empty : CitationListUiState()

    // Success: loaded successfully with data
    data class Success(
        val citations: List<Citation>,
        val isRefreshing: Boolean = false  // pull-to-refresh in progress
    ) : CitationListUiState()

    // Error: something went wrong
    data class Error(
        val message: String,
        val canRetry: Boolean = true
    ) : CitationListUiState()
}

sealed class CitationListEvent {
    data class NavigateToDetail(val citationId: String) : CitationListEvent()
    data class ShowErrorSnackbar(val message: String) : CitationListEvent()
    object NavigateToLogin : CitationListEvent()  // session expired
}
```

```kotlin
// In Composable (or Fragment), handle every state:
when (val state = uiState) {
    is CitationListUiState.Loading -> LoadingSpinner()
    is CitationListUiState.Empty   -> EmptyStateView(onAddCitation = { ... })
    is CitationListUiState.Success -> CitationList(
        citations = state.citations,
        isRefreshing = state.isRefreshing,
        onRefresh = { viewModel.loadCitations() }
    )
    is CitationListUiState.Error   -> ErrorView(
        message = state.message,
        onRetry = if (state.canRetry) { { viewModel.onRetryClicked() } } else null
    )
}
```

### Why Not Just Use Nullable Fields?

```kotlin
// BAD — nullable fields allow impossible combinations:
data class CitationListState(
    val isLoading: Boolean = false,
    val citations: List<Citation>? = null,
    val error: String? = null
)

// What does this represent?
CitationListState(isLoading = true, citations = listOf(...), error = "Something failed")
// → isLoading AND has data AND has error simultaneously — impossible state, but allowed

// GOOD — sealed class makes impossible states impossible:
// Loading: cannot have data or error
// Success: must have data, cannot have error
// Error: must have message, no data
// These constraints are enforced by the type system at compile time
```

---

### 🎯 Practice — ViewModel and State

**Question**: Your `PaymentViewModel` exposes a `StateFlow<PaymentUiState>`. After a successful payment, it emits `PaymentUiState.Success`. The UI navigates to the Success screen. The user presses Back, returning to the Payment screen. The Success state is still in the StateFlow — the screen shows "Success" instead of the original payment form. How do you fix this?

<details><summary>Answer</summary>

There are two common solutions:

**Solution 1: Reset state after navigation event (most common)**

```kotlin
class PaymentViewModel : ViewModel() {
    private val _uiState = MutableStateFlow<PaymentUiState>(PaymentUiState.Idle)
    val uiState: StateFlow<PaymentUiState> = _uiState.asStateFlow()

    // Separate event for navigation (SharedFlow, not StateFlow)
    private val _events = MutableSharedFlow<PaymentEvent>(replay = 0)
    val events: SharedFlow<PaymentEvent> = _events.asSharedFlow()

    fun pay(citationId: String, amount: Double) {
        viewModelScope.launch {
            _uiState.value = PaymentUiState.Processing
            try {
                val receipt = repository.payCitation(citationId, amount)
                // Emit navigation event (not state) — won't replay on back navigation
                _events.emit(PaymentEvent.NavigateToSuccess(receipt))
                // Reset state so form shows again if user comes back
                _uiState.value = PaymentUiState.Idle
            } catch (e: Exception) {
                _uiState.value = PaymentUiState.Error(e.message ?: "Payment failed")
            }
        }
    }
}
```

**Solution 2: Use separate StateFlow for data, SharedFlow for one-time events**

The key insight: `Success` is a **one-time event** (navigate to success screen), not a **persistent state** (show success on the payment screen). These require different observable types:

```
PERSISTENT STATE → StateFlow:    Loading, Idle, Error (shown on the payment screen)
ONE-TIME EVENT   → SharedFlow:   NavigateToSuccess, ShowSnackbar, ShowToast

RULE: If the information should still be visible after rotation → StateFlow
      If the information should only happen once → SharedFlow(replay=0)
```

**The test that catches this bug**:

1. Navigate to Payment screen
2. Complete a payment successfully
3. Navigate to Success screen
4. Press Back
5. Expected: Payment form shows in its original state
6. Bug: Success state is shown (infinite loop risk)

</details>

---

## 9. Coroutines in ViewModels

### viewModelScope — The ViewModel's Coroutine Scope

```kotlin
class CitationListViewModel(
    private val repository: CitationRepository
) : ViewModel() {

    fun loadCitations() {
        // viewModelScope is tied to ViewModel lifecycle
        // Automatically cancelled when ViewModel.onCleared() is called
        // → when Activity finishes or back stack removes the ViewModel
        viewModelScope.launch {
            // This runs on Dispatchers.Main by default
            _uiState.value = CitationListUiState.Loading

            // withContext switches to a background thread for the heavy work
            val citations = withContext(Dispatchers.IO) {
                repository.fetchCitations()  // network or DB call
            }
            // Back on Main thread after withContext
            _uiState.value = CitationListUiState.Success(citations)
        }
    }
}
```

### Dispatcher Guide

```
Dispatchers.Main      → UI work. Must use for: updating StateFlow.value,
                         LiveData.value, any view manipulation.
                         Default in viewModelScope.launch { }

Dispatchers.IO        → Blocking I/O: network calls (Retrofit), file reads,
                         blocking database calls.
                         Room's suspend functions handle this automatically —
                         you don't need withContext(IO) for Room suspending DAOs.

Dispatchers.Default   → CPU-intensive computation: sorting large lists,
                         parsing JSON manually, image processing.

Dispatchers.Unconfined → Avoid in production. For testing only.
```

### Structured Concurrency — Multiple Parallel Calls

```kotlin
fun loadDashboard() {
    viewModelScope.launch {
        _uiState.value = DashboardUiState.Loading

        // Launch both calls in PARALLEL:
        val citationsDeferred = async(Dispatchers.IO) { repository.fetchCitations() }
        val profileDeferred   = async(Dispatchers.IO) { repository.fetchProfile() }

        // Wait for BOTH to complete:
        val citations = citationsDeferred.await()
        val profile   = profileDeferred.await()

        // Total time = max(citations time, profile time) — not sum
        _uiState.value = DashboardUiState.Success(citations, profile)
    }
}

// Compare: sequential (slower):
fun loadDashboardSlow() {
    viewModelScope.launch {
        val citations = repository.fetchCitations()  // waits for this first
        val profile   = repository.fetchProfile()     // then this
        // Total time = citations time + profile time — always slower
    }
}
```

### Error Handling in Coroutines

```kotlin
// Pattern 1: try/catch in the coroutine
fun loadCitations() {
    viewModelScope.launch {
        try {
            val citations = repository.fetchCitations()
            _uiState.value = CitationListUiState.Success(citations)
        } catch (e: NetworkException) {
            _uiState.value = CitationListUiState.Error("No internet connection")
        } catch (e: ServerException) {
            _uiState.value = CitationListUiState.Error("Server error. Please try again.")
        } catch (e: Exception) {
            _uiState.value = CitationListUiState.Error("Unexpected error: ${e.message}")
        }
    }
}

// Pattern 2: Result type — cleaner for use cases
fun loadCitations() {
    viewModelScope.launch {
        repository.fetchCitations()  // returns Result<List<Citation>>
            .onSuccess { citations ->
                _uiState.value = CitationListUiState.Success(citations)
            }
            .onFailure { error ->
                _uiState.value = CitationListUiState.Error(error.message ?: "Unknown error")
            }
    }
}

// Pattern 3: CoroutineExceptionHandler (catches unhandled exceptions in launch blocks)
private val exceptionHandler = CoroutineExceptionHandler { _, throwable ->
    viewModelScope.launch {
        _uiState.value = CitationListUiState.Error("Unexpected: ${throwable.message}")
        logError(throwable)
    }
}

fun loadCitations() {
    viewModelScope.launch(exceptionHandler) {
        val citations = repository.fetchCitations()  // if this throws, handler catches it
        _uiState.value = CitationListUiState.Success(citations)
    }
}
```

### Flow Collection in ViewModel — stateIn

When exposing a cold Flow as a StateFlow:

```kotlin
class CitationListViewModel(
    private val repository: CitationRepository
) : ViewModel() {

    // Repository returns a cold Flow (e.g., from Room)
    // stateIn converts it to a hot StateFlow

    val citations: StateFlow<List<Citation>> =
        repository.observeAllCitations()      // cold Flow from Room
            .map { list ->                     // transform
                list.sortedByDescending { it.issuedDate }
            }
            .stateIn(
                scope = viewModelScope,
                // SharingStarted.WhileSubscribed(5_000):
                //   Upstream (Room query) active while subscribers exist
                //   5000ms grace period: keeps active for 5s after last subscriber
                //   (handles rotation: Fragment destroyed → 5s gap → new Fragment subscribes)
                started = SharingStarted.WhileSubscribed(5_000),
                initialValue = emptyList()  // emitted immediately to new subscribers
            )
}
```

### The WhileSubscribed(5000) Pattern — Why 5 Seconds?

```
ROTATION TIMELINE:
  T=0:    Fragment A subscribes to StateFlow
  T=5:    Fragment A destroyed (rotation starts)
          StateFlow: 0 subscribers → starts 5 second timer
          Upstream (Room query): STILL ACTIVE during grace period
  T=5.3:  New Fragment A created (rotation complete)
          Fragment A subscribes → StateFlow: 1 subscriber → timer cancelled
          No gap: Room query never stopped, data continuously available

WITHOUT grace period (WhileSubscribed(0)):
  T=5:    Fragment A destroyed → 0 subscribers → Room query STOPS immediately
  T=5.3:  New Fragment subscribes → Room query RESTARTS → brief loading state
  User experience: Brief flicker or spinner on every rotation

5 seconds is generous — rotation takes < 1 second. The 5s covers slow devices.
```

---

## 10. SavedStateHandle — Surviving Process Death

SavedStateHandle is a map that the Android framework backs with the instance state Bundle — meaning its contents survive process death, just like `onSaveInstanceState`.

```kotlin
@HiltViewModel
class CitationDetailViewModel @Inject constructor(
    private val savedStateHandle: SavedStateHandle,
    private val repository: CitationRepository
) : ViewModel() {

    // Read navigation argument (Jetpack Navigation puts args in SavedStateHandle)
    private val citationId: String = checkNotNull(savedStateHandle["citationId"])
    // The Navigation component puts all navArgs into SavedStateHandle automatically

    // StateFlow that survives process death — persisted in the Bundle
    val selectedTab: StateFlow<Int> =
        savedStateHandle.getStateFlow("selected_tab", initialValue = 0)

    fun onTabSelected(tabIndex: Int) {
        savedStateHandle["selected_tab"] = tabIndex  // saved to Bundle automatically
    }

    // Data loaded from network — NOT in SavedStateHandle (too large)
    // Reload it when ViewModel is recreated
    val citation: StateFlow<CitationDetailUiState> =
        repository.observeCitation(citationId)
            .map { citation ->
                if (citation != null) CitationDetailUiState.Success(citation)
                else CitationDetailUiState.Error("Citation not found")
            }
            .catch { emit(CitationDetailUiState.Error(it.message ?: "Error")) }
            .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000),
                     CitationDetailUiState.Loading)
}
```

### What to Put in SavedStateHandle vs What Not To

```
PUT IN SavedStateHandle:            DO NOT PUT:
  Navigation arguments              Large objects (lists, bitmaps)
  User's current tab selection      Network responses (re-fetch instead)
  Current filter/sort state         Data already in Room (load from DB)
  Search query text                 Anything > ~50KB
  Scroll position (if critical)     Sensitive data (stays in memory, potentially in Bundle)
  Form draft fields

LIMIT: Same 1MB limit as onSaveInstanceState Bundle
       Violation causes TransactionTooLargeException at runtime
```

---

## 11. ViewModel in Tests

Unit testing a ViewModel is straightforward because it has no Android dependencies (if designed correctly):

```kotlin
// build.gradle.kts (test dependencies)
testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.9.0")
testImplementation("io.mockk:mockk:1.13.12")
testImplementation("com.google.truth:truth:1.4.4")
testImplementation("app.cash.turbine:turbine:1.2.0")  // for testing Flow

// ─────────────────────────────────────────────────────────────────────

class CitationListViewModelTest {

    // TestDispatcher: makes coroutines run synchronously in tests
    private val testDispatcher = UnconfinedTestDispatcher()

    @get:Rule
    val mainDispatcherRule = MainDispatcherRule(testDispatcher)
    // This replaces Dispatchers.Main with testDispatcher in tests
    // (Required because ViewModel uses Main dispatcher by default)

    private val mockRepository: CitationRepository = mockk()
    private lateinit var viewModel: CitationListViewModel

    @Before
    fun setup() {
        viewModel = CitationListViewModel(mockRepository)
    }

    @Test
    fun `initial state is Loading`() = runTest {
        // The ViewModel emits Loading before the init block's coroutine runs
        assertThat(viewModel.uiState.value).isInstanceOf(CitationListUiState.Loading::class.java)
    }

    @Test
    fun `loadCitations success updates state to Success`() = runTest {
        // Arrange: mock returns success
        val citations = listOf(
            Citation(id = "CIT-001", amount = 150.0, status = "PENDING"),
            Citation(id = "CIT-002", amount = 75.0, status = "PAID")
        )
        coEvery { mockRepository.fetchCitations() } returns Result.success(citations)

        // Act: (init already calls loadCitations, but we can re-trigger)
        viewModel.loadCitations()

        // Assert: state is now Success with the citations
        val state = viewModel.uiState.value
        assertThat(state).isInstanceOf(CitationListUiState.Success::class.java)
        assertThat((state as CitationListUiState.Success).citations).hasSize(2)
        assertThat(state.citations[0].id).isEqualTo("CIT-001")
    }

    @Test
    fun `loadCitations failure updates state to Error`() = runTest {
        // Arrange: mock returns failure
        coEvery { mockRepository.fetchCitations() } returns
            Result.failure(NetworkException("No internet"))

        viewModel.loadCitations()

        val state = viewModel.uiState.value
        assertThat(state).isInstanceOf(CitationListUiState.Error::class.java)
        assertThat((state as CitationListUiState.Error).message).contains("No internet")
    }

    @Test
    fun `onSearchQueryChanged filters citations correctly`() = runTest {
        // Arrange: load citations first
        val citations = listOf(
            Citation(id = "CIT-001", amount = 150.0, status = "PENDING"),
            Citation(id = "CIT-002", amount = 75.0, status = "PAID")
        )
        coEvery { mockRepository.fetchCitations() } returns Result.success(citations)
        viewModel.loadCitations()

        // Act: search for "001"
        viewModel.onSearchQueryChanged("001")

        // Assert: only CIT-001 in filtered list
        assertThat(viewModel.filteredCitations.value).hasSize(1)
        assertThat(viewModel.filteredCitations.value[0].id).isEqualTo("CIT-001")
    }

    @Test
    fun `onCitationClicked emits NavigateToDetail event`() = runTest {
        // Turbine: library for testing Flow emissions
        viewModel.events.test {
            // Act
            viewModel.onCitationClicked("CIT-001")

            // Assert: an event was emitted
            val event = awaitItem()
            assertThat(event).isInstanceOf(CitationListEvent.NavigateToDetail::class.java)
            assertThat((event as CitationListEvent.NavigateToDetail).citationId)
                .isEqualTo("CIT-001")

            cancelAndIgnoreRemainingEvents()
        }
    }
}

// Helper: Rule to set Main dispatcher in tests
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
```

---

## 12. Common ViewModel Bugs and Their Tests

### Bug 1: Network Call on Main Thread

```kotlin
// WRONG:
fun loadCitations() {
    viewModelScope.launch {
        // fetchCitations() is a blocking network call (not suspend)
        // Running it on Main thread (the default) → NetworkOnMainThreadException crash
        val citations = repository.fetchCitations()
        _uiState.value = CitationListUiState.Success(citations)
    }
}

// CORRECT:
fun loadCitations() {
    viewModelScope.launch {
        val citations = withContext(Dispatchers.IO) {
            repository.fetchCitations()  // runs on IO thread
        }
        _uiState.value = CitationListUiState.Success(citations)  // back on Main
    }
}
// Better: make fetchCitations() a suspend function that handles dispatchers internally
```

**QA test**: If the app crashes immediately on screen load with `NetworkOnMainThreadException` in the logcat, this is the cause.

### Bug 2: Loading State Stuck on Error

```kotlin
// WRONG — only Loading or Success, never Error:
fun loadCitations() {
    viewModelScope.launch {
        _uiState.value = CitationListUiState.Loading
        // If this throws, the coroutine CRASHES without setting Error state
        // _uiState remains stuck at Loading forever
        val citations = repository.fetchCitations()
        _uiState.value = CitationListUiState.Success(citations)
    }
}

// CORRECT:
fun loadCitations() {
    viewModelScope.launch {
        _uiState.value = CitationListUiState.Loading
        try {
            val citations = repository.fetchCitations()
            _uiState.value = CitationListUiState.Success(citations)
        } catch (e: Exception) {
            _uiState.value = CitationListUiState.Error(e.message ?: "Error")
        }
    }
}
```

**QA test**: Disable network, navigate to any data screen. Expected: Error state with retry button. Bug: Infinite spinner.

### Bug 3: Double Loading on ViewModel Re-creation

```kotlin
// WRONG — init calls loadCitations, and loadCitations is also called from Fragment.onViewCreated
// On rotation: new Fragment → onViewCreated → loadCitations called again
// But ViewModel was NOT recreated (same instance) → init does NOT run again
// However: the Fragment's onViewCreated calling loadCitations triggers a SECOND API call

class CitationListViewModel : ViewModel() {
    init { loadCitations() }         // called ONCE (when ViewModel created)
}

class CitationListFragment : Fragment() {
    override fun onViewCreated(...) {
        viewModel.loadCitations()    // called EVERY time view is created (including rotation)
        // → redundant call on rotation
    }
}

// CORRECT: ViewModel handles its own data loading. UI just observes.
class CitationListFragment : Fragment() {
    override fun onViewCreated(...) {
        // Just observe — don't trigger loading
        viewLifecycleOwner.lifecycleScope.launch {
            viewLifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.uiState.collect { state -> renderState(state) }
            }
        }
        // Only trigger loading on explicit user action:
        binding.retryButton.setOnClickListener { viewModel.loadCitations() }
        binding.swipeRefresh.setOnRefreshListener { viewModel.loadCitations() }
    }
}
```

---

## 13. Interview Q&A

**Q: "What is a ViewModel and why does it exist?"**

> "A ViewModel is an architecture component that stores and manages UI-related data across configuration changes. Before ViewModel, developers stored data in Activities — every rotation destroyed the Activity and its data, causing unnecessary re-fetches and bad UX. ViewModel survives rotation because Android stores it in a ViewModelStore that is retained across configuration changes. It also separates concerns: the ViewModel doesn't know about Views, making it fully unit testable without a device. It's destroyed only when the Activity is truly finished — not on rotation."

**Q: "What is the difference between LiveData and StateFlow?"**

> "Both are observable data holders. LiveData is lifecycle-aware by default — it stops delivering updates when the observer's lifecycle is not active, preventing crashes and wasted work. StateFlow is a Kotlin Coroutines construct with no Android dependency, making it usable in the domain layer. StateFlow always has a current value (like LiveData's initial value), it only emits when the value changes (unlike LiveData which can deliver the same value twice), and it has all of Kotlin Flow's operator set (map, filter, combine, debounce, etc.) making data transformations cleaner. New code should prefer StateFlow, with careful manual lifecycle management using `repeatOnLifecycle(STARTED)` in the UI."

**Q: "When would you use SharedFlow instead of StateFlow?"**

> "For one-time events: navigation actions, showing snackbars, displaying toasts, triggering dialogs. The distinction is whether a new subscriber should see the last value. StateFlow always replays the last value — appropriate for 'show the current state of this screen'. SharedFlow with replay=0 does not replay — appropriate for 'this event happened once and should not happen again when a new subscriber (after rotation) arrives'. A concrete example: after a successful payment, I emit NavigateToSuccess as a SharedFlow event. If I stored it in StateFlow, returning to the Payment screen from the Success screen would immediately re-navigate — a bug caused by the replay behavior."

**Q: "What is SharingStarted.WhileSubscribed(5000) and why 5000ms?"**

> "WhileSubscribed means the upstream cold Flow is only active while there are active subscribers. When the last subscriber leaves, a timer starts — 5000ms by default. If no new subscriber arrives within that time, the upstream is cancelled. The 5 seconds covers the Activity/Fragment recreation cycle during rotation: the old Fragment unsubscribes, Android recreates the Fragment (takes under 1 second), the new Fragment subscribes. The 5-second grace period ensures the Room database query is never restarted during rotation, preventing a brief loading flicker. It's a balance — too short and rotations cause re-fetches; too long and resources stay active unnecessarily."

---

**Next in this folder**: [04_Jetpack_Compose_Deep_Dive.md](./04_Jetpack_Compose_Deep_Dive.md) — Composable functions, recomposition, state in Compose, Compose vs XML Views, and testing Composables.

**Back to**: [Android folder index](./) | [Series index](../)


---

## Reality Check

**"ViewModel is where you put your logic"** ? ViewModel's specific job is SURVIVING configuration changes and holding UI state independent of the view lifecycle ([02] � the rotation that recreates the Activity but keeps the ViewModel), not a general logic dumping ground: the business logic belongs in the domain/data layers ([01 architecture, Enterprise 01c]'s anemic-versus-rich � the ViewModel that becomes a god object with all logic is the anemic-architecture smell), the ViewModel EXPOSES state and handles UI-related decisions, and it must NOT hold a reference to the view/context (the leak � the ViewModel outlives the Activity, so holding the Activity leaks it). "Where you put your logic" produces the bloated ViewModel; its actual role is the config-change-surviving holder of UI state that delegates real logic downward and never references the view.

**"LiveData and StateFlow are interchangeable"** ? They overlap and differ in ways that matter: LiveData is lifecycle-aware by default (it stops emitting to inactive observers � the [02] update-after-destroy crash prevented automatically) and Android-specific, while StateFlow is a Kotlin coroutines primitive (more powerful, composable with the Flow operators, but NOT lifecycle-aware by default � the collection must be lifecycle-scoped, the repeatOnLifecycle pattern that developers forget, causing the update-while-backgrounded waste or leak). The modern direction favors StateFlow (the coroutines ecosystem, the operators) WITH the lifecycle-aware collection pattern. "Interchangeable" misses that LiveData bakes in lifecycle-awareness while StateFlow requires you to add it (repeatOnLifecycle) � and forgetting that with StateFlow reintroduces exactly the lifecycle bugs LiveData prevented.

**"Exposing MutableLiveData/MutableStateFlow is fine"** ? Exposing the MUTABLE type breaks encapsulation ([06_OOP]'s encapsulation-theater in Android form): any observer can then MUTATE the state (the view writing to the ViewModel's state directly � the unidirectional-data-flow violation, the [15_React] state-should-flow-one-way), bypassing the ViewModel's logic. The idiom is exposing the immutable type (LiveData/StateFlow) publicly while keeping the mutable version private (the backing property pattern) � the view OBSERVES the immutable state and sends EVENTS to the ViewModel (the unidirectional flow), never mutating state directly. "Fine to expose mutable" is the encapsulation break that lets the UDF degrade into two-way mutation, and the private-mutable-public-immutable pattern is the standard precisely to enforce the one-way flow.

**"State and events are the same thing"** ? STATE (the current UI state � the list, the loading flag) and EVENTS (the one-time occurrences � the navigation, the snackbar, the toast) need different handling, and conflating them causes the replayed-event bug: the event modeled as state that RE-FIRES on config change (the snackbar that reappears on every rotation, the navigation that re-triggers � because StateFlow/LiveData replay the current value to new observers, and an event-as-state gets replayed). Events need one-time-consumption handling (the SharedFlow, the event wrapper, the channel � the "consume once" semantics), while state is the replayable current value. "Same thing" produces the re-firing-events-on-rotation bug that is a rite of passage � the distinction (replayable state versus consume-once events) is a real modeling decision with its own patterns.

**"ViewModel testing needs the Android framework"** ? ViewModel is designed to be TESTABLE without the Android framework ([01 architecture]'s point � that is much of why it exists): the ViewModel with no view/context reference, its logic testable as plain Kotlin (the [13_DE testing] fast unit tests � the coroutine test dispatchers, the StateFlow/LiveData assertions with the test rules), no device or emulator needed. This is a FEATURE � the architecture that puts logic in testable ViewModels (and domain/data layers) enables the fast unit-test tier of the [Android 07] pyramid. "Needs the Android framework" is true of Activities and Views and false of a well-designed ViewModel � and if your ViewModel needs the framework to test, it is probably holding a view/context reference it should not (the leak and the testability problem being the same design flaw).
