# Android — Activity and Fragment Lifecycle

**Folder**: [03_Android](./) | **Previous**: [01_Architecture_And_App_Model.md](./01_Architecture_And_App_Model.md) | **Next**: [03_ViewModel_StateFlow_LiveData.md](./03_ViewModel_StateFlow_LiveData.md)

> **Reading contract**: The lifecycle is the single hardest Android concept to truly understand — not because the individual callbacks are complex, but because the COMBINATION of Activity and Fragment lifecycles, the OS ability to kill your process, and asynchronous operations creates many subtle bugs. This file gives you every callback, every state transition, every common bug pattern, and QA test cases for each. Read it once, then come back to specific sections as reference.

---

## Table of Contents

1. [Why the Lifecycle Exists](#1-why-the-lifecycle-exists)
2. [Activity Lifecycle — Complete State Machine](#2-activity-lifecycle--complete-state-machine)
3. [Every Activity Callback Explained](#3-every-activity-callback-explained)
4. [The Back Stack — How Activities Stack](#4-the-back-stack--how-activities-stack)
5. [Process Death — The Most Misunderstood Topic](#5-process-death--the-most-misunderstood-topic)
6. [Saving and Restoring State](#6-saving-and-restoring-state)
7. [Fragment Lifecycle — Added Complexity](#7-fragment-lifecycle--added-complexity)
8. [Activity vs Fragment Lifecycle Side-by-Side](#8-activity-vs-fragment-lifecycle-side-by-side)
9. [Common Lifecycle Bugs and Their QA Tests](#9-common-lifecycle-bugs-and-their-qa-tests)
10. [Configuration Changes — Rotation, Language, Font Size](#10-configuration-changes--rotation-language-font-size)
11. [Lifecycle-Aware Components](#11-lifecycle-aware-components)
12. [Interview Questions on Lifecycle](#12-interview-questions-on-lifecycle)

---

## 1. Why the Lifecycle Exists

Android is a **resource-constrained, multi-tasking mobile OS**. At any moment:

- A phone call can arrive and take over the screen
- The user can press Home and switch to another app
- The OS can kill your app to free RAM for a foreground app
- The device can rotate, changing the screen dimensions entirely
- A notification can bring the user back to your app mid-task

The lifecycle is Android's solution: the OS notifies your app about each of these events through **callback methods**. Your job is to react appropriately — save state when told to, release resources when told to, restore state when returning.

**The contract**: If you don't implement the lifecycle correctly, you get:

- Memory leaks (holding references to Activities that should be gone)
- Data loss (user loses form data on rotation)
- Crashes (calling a destroyed view)
- Blank screens (not reloading data after returning)
- Double work (starting a network call twice on rotation)

---

## 2. Activity Lifecycle — Complete State Machine

```
APP LAUNCH (cold start)
       │
       ▼
  onCreate()     ← Activity object created. View hierarchy created.
       │           savedInstanceState is non-null if restoring from state.
       │
       ▼
  onStart()      ← Activity is visible to the user (but not interactive yet).
       │
       ▼
  onResume()     ← Activity is IN FOREGROUND, fully interactive.
       │           User can see it and interact with it.
       │
   ┌───┴──────────────────────────────────────────────────────────┐
   │         ACTIVITY IS ACTIVE — USER INTERACTS                  │
   └───┬──────────────────────────────────────────────────────────┘
       │
  ┌────┴────────────────────────────────────────────────────┐
  │   WHY DID WE LEAVE?                                     │
  │   a) User pressed Home or opened another app            │
  │   b) Phone call arrived                                 │
  │   c) Screen turned off                                  │
  │   d) Another Activity opened on top (dialog, etc.)      │
  │   e) User opened notification shade                     │
  └────┬────────────────────────────────────────────────────┘
       │
       ▼
  onPause()      ← Activity partially hidden OR about to be covered.
       │           MUST be fast — blocks the incoming Activity.
       │           Pause animations, release camera, save critical state.
       │
  ┌────┴────────────────────────────────────────────────────┐
  │   IS THE ACTIVITY FULLY HIDDEN?                         │
  └────┬───────────────────────┬────────────────────────────┘
       │ YES                   │ NO (partially visible — dialog on top)
       ▼                       │
  onStop()                     │ (stays paused, user can see it in background)
       │ Activity not visible   │
       │ OS may kill process   │
       │ Heavy cleanup here    │
       │                       │
  ┌────┴────────────────────────────────────────────────────┐
  │   USER RETURNS TO THE ACTIVITY                         │
  └────┬────────────────────────────────────────────────────┘
       │ (if Activity still in memory)
       ▼
  onRestart()    ← Called before onStart() when returning from stopped state
       │
       ▼
  onStart()      ← Back to visible
       ▼
  onResume()     ← Back to interactive

       OR (if process was killed by OS):

APP RELAUNCH     ← OS killed the process when stopped
       │
       ▼
  onCreate(savedInstanceState)  ← savedInstanceState has the saved data
       │                          (if you implemented onSaveInstanceState)
       ▼
  ...continues normally

──────────────────────────────────────────────────────────────────

USER PRESSES BACK / ACTIVITY FINISHES:
       │
       ▼
  onPause()
       ▼
  onStop()
       ▼
  onDestroy()    ← Activity object destroyed. Final cleanup.
                   Cancel background work that doesn't need to outlive the Activity.
```

---

## 3. Every Activity Callback Explained

### onCreate()

```kotlin
override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    // ALWAYS call super first — framework setup happens there

    // Set the content view — ONLY call this once
    setContentView(R.layout.activity_login)
    // OR in Compose:
    setContent { LoginScreen() }

    // Initialize ViewBinding or DataBinding
    binding = ActivityLoginBinding.inflate(layoutInflater)
    setContentView(binding.root)

    // Set up click listeners (once, not every resume)
    binding.loginButton.setOnClickListener { handleLogin() }

    // Observe ViewModel (once, not every resume)
    viewModel.loginState.observe(this) { state -> handleState(state) }

    // Restore state if returning from process death
    if (savedInstanceState != null) {
        val draftEmail = savedInstanceState.getString("draft_email", "")
        binding.emailField.setText(draftEmail)
    }

    // DO NOT do network calls here — that belongs in onResume or ViewModel.init
    // DO NOT start animations here — nothing is visible yet
}
```

**When it's called**: ONCE in the Activity's lifetime (unless the process is killed and the Activity is recreated).

**Common mistake**: Putting network calls in `onCreate`. If the user switches away and comes back, the data is STALE — `onCreate` doesn't run again.

---

### onStart()

```kotlin
override fun onStart() {
    super.onStart()
    // Activity is VISIBLE but not interactive
    // Good for: registering broadcast receivers that need to react to system events
    // while the Activity is visible
    registerReceiver(networkChangeReceiver, IntentFilter(ConnectivityManager.CONNECTIVITY_ACTION))
}

override fun onStop() {
    super.onStop()
    // Paired with onStart — unregister what you registered in onStart
    unregisterReceiver(networkChangeReceiver)
}
```

**When it's called**: Every time the Activity becomes visible — including when returning from a paused/stopped state.

---

### onResume()

```kotlin
override fun onResume() {
    super.onResume()
    // Activity is FULLY interactive — user can touch the screen

    // Good for:
    // 1. Refreshing data that might be stale (the user could have been away for hours)
    viewModel.refreshData()

    // 2. Starting camera preview (camera access should be here — not onCreate)
    cameraPreview.start()

    // 3. Starting animations
    pulseAnimation.start()

    // 4. Resuming media playback
    mediaPlayer.start()

    // 5. Re-subscribing to real-time updates
    locationManager.requestLocationUpdates(...)
}
```

**When it's called**: Every time the Activity is interactive — on launch, after returning from another Activity, after a phone call ends, after the screen turns on.

**QA implication**: If a feature shows stale data after returning from another screen, the data refresh is in `onCreate` instead of `onResume`. This is the #1 lifecycle QA finding.

---

### onPause()

```kotlin
override fun onPause() {
    // MUST BE FAST — the incoming Activity is blocked until this returns
    // Keep it under 5ms ideally, never more than 500ms

    // Good for:
    // 1. Pausing animations (expensive computation)
    pulseAnimation.pause()

    // 2. Releasing camera (another app might need it)
    cameraPreview.stop()

    // 3. Pausing real-time updates (location, sensors)
    locationManager.removeUpdates(locationListener)

    // 4. Saving a lightweight, critical draft (very fast operation only)
    prefs.edit().putString("draft_email", binding.emailField.text.toString()).apply()
    // .apply() is async (non-blocking). .commit() is sync (blocking — BAD in onPause).

    // BAD — DO NOT DO THIS:
    viewModel.saveAllData()  // might be slow — blocks the incoming Activity
    database.runMigration() // definitely slow
    networkCall()           // never make network calls in onPause

    super.onPause()
}
```

**Why it must be fast**: The next Activity's `onResume` cannot run until your `onPause` completes. If your `onPause` takes 2 seconds, the user sees a 2-second freeze transitioning between screens.

---

### onStop()

```kotlin
override fun onStop() {
    super.onStop()
    // Activity is NOT visible — good time for heavier cleanup

    // 1. Stop background music/video that shouldn't play in background
    mediaPlayer.pause()

    // 2. Save user data that doesn't need to be saved every pause
    //    (e.g., form autosave that the user expects to persist)
    viewModel.saveFormDraft(collectFormData())

    // 3. Cancel ongoing work that only makes sense when Activity is visible
    //    (e.g., real-time chat updates — user can't read them anyway)
    chatSubscription.cancel()
}

override fun onRestart() {
    super.onRestart()
    // Called ONLY when returning from stopped state (not from paused state)
    // onRestart() → onStart() → onResume()
    // Rarely used — most resuming logic goes in onResume()
}
```

---

### onDestroy()

```kotlin
override fun onDestroy() {
    // Called when Activity is PERMANENTLY going away
    // isFinishing returns true if the user pressed back or you called finish()
    // isFinishing returns false if the system is recreating (e.g., rotation)

    if (isFinishing) {
        // Truly being destroyed — clean up everything
        viewModel.cancelAllWork()
    }
    // If !isFinishing: the Activity is being recreated — ViewModel handles state

    // Always clean up bindings to prevent memory leaks:
    _binding = null  // if using ViewBinding in Fragments

    super.onDestroy()
}
```

---

### onSaveInstanceState() and onRestoreInstanceState()

```kotlin
override fun onSaveInstanceState(outState: Bundle) {
    super.onSaveInstanceState(outState)
    // Called BEFORE onStop when the system MIGHT kill the process
    // This is your ONLY chance to save transient UI state
    // (state that the user would be annoyed to lose but doesn't need to persist long-term)

    outState.putString("email_draft", binding.emailField.text.toString())
    outState.putInt("selected_tab", currentTab)
    outState.putBoolean("filter_applied", isFilterActive)

    // What to save:
    // ✓ Text field contents (draft, partially typed search)
    // ✓ Scroll position
    // ✓ Selected tab index
    // ✓ Toggle/checkbox states
    // ✓ Any transient UI state

    // What NOT to save:
    // ✗ Large objects (bitmaps, lists) — use ViewModel for these
    // ✗ Data that belongs in a database
    // ✗ Data from the network (re-fetch it)
    // Bundle has a 1MB limit — exceeding it causes TransactionTooLargeException
}

override fun onRestoreInstanceState(savedInstanceState: Bundle) {
    super.onRestoreInstanceState(savedInstanceState)
    // Called after onStart() when restoring state
    // The Bundle is the SAME one from onSaveInstanceState
    // This is an alternative to handling it in onCreate — use whichever is cleaner
    binding.emailField.setText(savedInstanceState.getString("email_draft", ""))
}
```

---

### 🎯 Practice — Activity Lifecycle

**Question**: A user is filling out a long registration form. They receive a phone call, accept it, finish the call, and return to the app. The form is empty — all their input is lost. Which callback is responsible and what is the fix?

<details><summary>Answer</summary>

**What happened**:

1. User is filling out form → `onResume` state
2. Phone call arrives → Activity goes to `onPause` (call UI covers it)
3. If the call is long AND other apps run → OS may kill the app process to free RAM
4. User returns → OS restores the Activity from scratch via `onCreate(savedInstanceState)`
5. `savedInstanceState` is null OR the form fields weren't saved → empty form

**The responsible callback**: `onSaveInstanceState()` was not implemented (or not saving the form fields).

**The fix**:

```kotlin
override fun onSaveInstanceState(outState: Bundle) {
    super.onSaveInstanceState(outState)
    // Save each form field
    outState.putString("field_first_name", binding.firstNameField.text.toString())
    outState.putString("field_last_name", binding.lastNameField.text.toString())
    outState.putString("field_email", binding.emailField.text.toString())
    outState.putString("field_phone", binding.phoneField.text.toString())
    outState.putInt("field_country_index", binding.countrySpinner.selectedItemPosition)
}

override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContent { RegistrationScreen() }

    // Restore if returning from process death
    savedInstanceState?.let { state ->
        viewModel.restoreFormDraft(
            firstName = state.getString("field_first_name", ""),
            lastName = state.getString("field_last_name", ""),
            email = state.getString("field_email", ""),
            phone = state.getString("field_phone", ""),
        )
    }
}
```

**Modern alternative using ViewModel**:

```kotlin
// ViewModel survives configuration changes AND process death (with SavedStateHandle)
class RegistrationViewModel(
    private val savedStateHandle: SavedStateHandle
) : ViewModel() {

    // SavedStateHandle automatically saves/restores from the Bundle
    var firstName by savedStateHandle.saveable { mutableStateOf("") }
    var lastName by savedStateHandle.saveable { mutableStateOf("") }
    var email by savedStateHandle.saveable { mutableStateOf("") }
}
// With this, the user's input is automatically preserved across process death
// without manually writing onSaveInstanceState code
```

**QA test for this fix**:

1. Open registration form
2. Fill in all fields
3. Enable "Don't keep activities" in Developer Options (simulates low-memory kill)
4. Press Home
5. Return to app
6. Expected: All form fields still populated

</details>

---

## 4. The Back Stack — How Activities Stack

The back stack determines what happens when the user presses the Back button:

```
USER JOURNEY:
Press Back ← ← ← ← ← ← ← ← ← ← ← ← ← ←

  [ Login ] → [ Home ] → [ Detail ] → [ Payment ] → [ Success ]
                                            └─ Back ─┘
                                       ← Back         ← Back

BACK STACK (LIFO — Last In, First Out):
   BOTTOM: LoginActivity    ← cannot go below this (app exits)
           HomeActivity
           DetailActivity
           PaymentActivity
      TOP: SuccessActivity  ← currently visible

Pressing Back pops SuccessActivity → PaymentActivity becomes visible
Pressing Back again pops PaymentActivity → DetailActivity becomes visible
```

### Launch Modes — How an Activity Behaves When Already in the Stack

Defined in AndroidManifest:

```xml
<activity
    android:name=".HomeActivity"
    android:launchMode="singleTop">
```

```
LAUNCH MODE       BEHAVIOR                                  USE CASE
───────────────   ────────────────────────────────────────  ──────────────────────────
standard          New instance ALWAYS created               Default — most Activities
(default)         Stack: A → B → B (B has two instances)

singleTop         New instance only if NOT on top           Notification deep links
                  If on top → onNewIntent() called          (prevents duplicate screen)
                  Stack: A → B → B_reused (not two B's)

singleTask        Only ONE instance exists in stack         Home screen, Main Activity
                  If exists → brought to front              User pressing "Home" icon
                  All Activities above it are DESTROYED     should not stack
                  onNewIntent() called

singleInstance    Only ONE instance, in its OWN task        Phone dialer, browser
                  No other Activities in its task
```

**QA implication**: If a user presses a push notification and sees the same screen twice in the back stack (pressing back lands on the same screen again), the launch mode is `standard` when it should be `singleTop` or `singleTask`.

---

## 5. Process Death — The Most Misunderstood Topic

### What Process Death Means

The Android OS is a resource manager. When it needs RAM for a foreground app, it kills background processes. Your app process can be killed at ANY TIME while it is in the background — even between `onStop` and the user returning.

```
FROM THE USER'S PERSPECTIVE:
  1. Opens your app → uses it → presses Home (or Recents)
  2. Uses other apps
  3. Returns to your app via Recents
  4. They expect to see where they left off

WHAT ACTUALLY HAPPENED:
  1-2: Your app process is in background
  2-3: OS kills your process (low memory)
  3:   OS appears to restore your app (shows the task thumbnail in Recents)
       but the actual Activity stack must be RECONSTRUCTED from scratch
  4:   Android recreates the BACK STACK and the top Activity
       using the saved instance state
```

### The "Don't Keep Activities" Developer Option

You can simulate process death without low memory:

```
Settings → Developer Options → "Don't keep activities" → ON

Effect: Activities are destroyed as soon as the user leaves them.
        Every time you return, the Activity is recreated from scratch.
        This simulates low-memory process death EVERY TIME.
```

**QA strategy**: Enable "Don't keep activities" and run your entire regression suite. Any test that now fails exposes a lifecycle/state-restoration bug.

### What Is Preserved Across Process Death

```
PRESERVED (automatically):                NOT PRESERVED:
  Back stack structure                      Activity object
  Intent that started each Activity        Fragment objects
  Bundle from onSaveInstanceState          Any in-memory variables
  Room database                            Network responses (must re-fetch)
  SharedPreferences / DataStore            ViewModel instance*
  Any file on disk

*ViewModel objects are destroyed on process death unless you use SavedStateHandle
```

---

## 6. Saving and Restoring State

### Three Mechanisms — Know When to Use Each

```
MECHANISM 1: onSaveInstanceState Bundle
  Store:   Small, lightweight UI state (text field content, scroll position)
  Size:    Max ~1MB total (TransactionTooLargeException if exceeded)
  Survives: Configuration changes AND process death
  When:    For UI-specific transient state

MECHANISM 2: ViewModel
  Store:   Large data, lists, business logic state
  Size:    Limited only by RAM (not serialized to Bundle)
  Survives: Configuration changes (rotation, language change)
  Does NOT survive: Process death (unless + SavedStateHandle)
  When:    For data loaded from network/DB

MECHANISM 3: ViewModel + SavedStateHandle
  Store:   Small-medium data that the ViewModel needs to survive process death
  Size:    Same Bundle limit as mechanism 1 (~1MB)
  Survives: Configuration changes AND process death
  When:    For ViewModel state that must survive everything

MECHANISM 4: Room / DataStore / SharedPreferences
  Store:   Data that must persist across app restarts
  Size:    Disk size (effectively unlimited)
  Survives: Everything including uninstall (SharedPrefs), app updates
  When:    For user preferences, cached data, user-generated content
```

### The Decision Tree

```
Does this data need to survive process death?
       │ YES                           │ NO
       ▼                               ▼
Is it < 1MB and primitive?        Can it fit in ViewModel memory?
       │ YES            │ NO           │ YES          │ NO
       ▼                ▼             ▼              ▼
SavedStateHandle    Room/DataStore  ViewModel      This is unusual
(in ViewModel)      (persist to DB) (in-memory)   — consider splitting
```

---

## 7. Fragment Lifecycle — Added Complexity

### Why Fragments Have a MORE Complex Lifecycle

A Fragment's lifecycle is coupled to its host Activity's lifecycle — but it has ADDITIONAL states related to its view:

```
FRAGMENT STATES (in addition to Activity-like states):
  - Fragment object can exist WITHOUT a view (when in back stack but not visible)
  - The VIEW of the fragment is created and destroyed separately from the Fragment object
  - This is the source of the most common Fragment bug: using the view after it's destroyed
```

### Complete Fragment Lifecycle

```
Fragment added to Activity (FragmentTransaction.add() or replace())
           │
           ▼
    onAttach(context)     ← Fragment linked to its host Activity
           │                Access context, cast to interface for callbacks
           │
           ▼
    onCreate()             ← Fragment object initialization
           │                NO view yet — do NOT reference any Views here
           │                Initialize non-UI data (ViewModel observation is OK)
           │
           ▼
    onCreateView()         ← CREATE the View hierarchy
           │                Return the inflated View
           │                In Compose Fragments: return ComposeView
           │
           ▼
    onViewCreated(view)    ← View is ready — MOST SETUP GOES HERE
           │                Set up click listeners
           │                Start observing ViewModel (use viewLifecycleOwner, not this)
           │                Configure RecyclerView, adapters
           │
           ▼
    onStart()              ← Same as Activity.onStart
    onResume()             ← Same as Activity.onResume — Fragment interactive
           │
       USER INTERACTS
           │
    onPause()              ← Same as Activity.onPause
    onStop()               ← Same as Activity.onStop
           │
           ▼
    onDestroyView()        ← VIEW is destroyed, Fragment object STILL EXISTS
           │                ← CRITICAL: null out binding references here
           │                   binding = null
           │                ← Fragment is in back stack but view is gone
           │
    (Fragment is in back stack — object alive, view gone)
    (User presses Back or navigates back to this Fragment)
           │
    onCreateView()         ← View RECREATED (Fragment object is the same)
    onViewCreated()        ← Setup again
           │
           ▼
    onDestroyView()        ← View destroyed again
    onDestroy()            ← Fragment object destroyed
    onDetach()             ← Fragment unlinked from Activity
```

### The Most Critical Fragment Bug

```kotlin
// WRONG — using binding after the view is destroyed
class CitationListFragment : Fragment() {
    private var binding: FragmentCitationListBinding? = null

    override fun onCreateView(inflater: LayoutInflater, ...): View {
        binding = FragmentCitationListBinding.inflate(inflater, container, false)
        return binding!!.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        // WRONG: observing with 'this' as lifecycle owner
        // 'this' = Fragment lifecycle — OUTLIVES the view
        // If the fragment is in back stack, the view is gone but 'this' is alive
        // When data arrives, it tries to update binding -> CRASH (null binding)
        viewModel.citations.observe(this) { citations ->
            binding!!.recyclerView.adapter = CitationAdapter(citations)  // CRASH if view gone
        }
    }

    // CORRECT: null binding in onDestroyView
    override fun onDestroyView() {
        super.onDestroyView()
        binding = null  // ← prevents memory leak AND null pointer crash
    }
}

// CORRECT — use viewLifecycleOwner
override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
    // viewLifecycleOwner lifecycle = the VIEW's lifecycle (shorter than Fragment's)
    // Observation automatically stops when onDestroyView() is called
    viewModel.citations.observe(viewLifecycleOwner) { citations ->
        binding?.recyclerView?.adapter = CitationAdapter(citations)  // safe — view exists
    }
}
```

---

### 🎯 Practice — Fragment Lifecycle

**Question**: A Fragment shows a list of citations loaded from a ViewModel. The user taps a citation, navigates to DetailFragment (using Navigation Component, which puts CitationListFragment in the back stack). The user presses Back. The list should show updated data (the tapped citation might now be "VIEWED"). Instead, the list shows stale data. What is the issue?

<details><summary>Answer</summary>

**Root cause**: The data observation was set up in `onCreate()` instead of `onViewCreated()`, or the observer uses `this` (Fragment lifecycle) but the data source (`LiveData`/`StateFlow`) is not re-emitting when the Fragment returns to the front.

Here is what happens step by step:

1. CitationListFragment is created → `onCreateView` and `onViewCreated` run → ViewModel data observed
2. User navigates to DetailFragment → CitationListFragment goes to `onDestroyView`
   - Its VIEW is destroyed (back stack, object alive)
   - If `viewLifecycleOwner` was used → observation STOPPED when view was destroyed
3. User presses Back → CitationListFragment's `onCreateView` and `onViewCreated` run AGAIN
   - View is recreated
   - If observation was set up in `onViewCreated` with `viewLifecycleOwner` → observation RESTARTS
   - ViewModel will re-emit the current value → list updates

**Common bugs**:

**Bug A**: Observation in `onCreate` with `this`:

```kotlin
override fun onCreate(...) {
    // 'this' never dies between navigation events
    // But onCreate doesn't run again on returning from back stack
    // So the observer is registered once and keeps working
    // HOWEVER: if the data source is a StateFlow and the Fragment
    // uses lifecycleScope.launch in onCreate — the coroutine lifecycle
    // doesn't align with the view → can cause crashes
    viewModel.citations.observe(this) { updateList(it) }
}
```

**Bug B**: Observation in `onViewCreated` with `viewLifecycleOwner` but the ViewModel DOESN'T refresh on return:

```kotlin
// ViewModel only loads data once
class CitationListViewModel : ViewModel() {
    init {
        loadCitations()  // only runs when ViewModel is FIRST created
    }

    // When user returns from Detail, init doesn't run again
    // So the list never refreshes
}

// Fix: Expose a refresh trigger, or make the data source reactive (Room Flow)
class CitationListViewModel : ViewModel() {
    // Room Flow automatically re-emits when DB changes
    val citations: Flow<List<Citation>> = citationRepository.observeAll()
    //                                                        ↑
    //                                                        This is a Room @Query
    //                                                        that returns a Flow
    //                                                        It re-emits whenever
    //                                                        the database changes
}
```

**The complete correct solution**:

```kotlin
// ViewModel: use Room Flow (automatic re-emission on DB change)
val citations: StateFlow<List<Citation>> = citationRepository.observeAll()
    .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

// Fragment: observe in onViewCreated with viewLifecycleOwner
override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
    viewLifecycleOwner.lifecycleScope.launch {
        viewLifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
            viewModel.citations.collect { citations ->
                adapter.submitList(citations)  // DiffUtil handles efficient updates
            }
        }
    }
}
// When user returns from Detail: onViewCreated runs → collection restarts
// If the citation was marked VIEWED in DB → Room Flow re-emits → list updates
```

</details>

---

## 8. Activity vs Fragment Lifecycle Side-by-Side

```
ACTIVITY                        FRAGMENT
────────────────────────────    ────────────────────────────────────────
                                onAttach()
onCreate()                      onCreate()
                                onCreateView()
                                onViewCreated()
onStart()                       onStart()
onResume()                      onResume()

[ACTIVE — USER INTERACTS]

onPause()                       onPause()
onStop()                        onStop()
                                onDestroyView()   ← unique to Fragment
                                [in back stack: object alive, view gone]
                                onCreateView()    ← recreated on return
                                onViewCreated()
onDestroy()                     onDestroy()
                                onDetach()

KEY DIFFERENCE: Fragment has TWO lifecycles:
  1. Fragment object lifecycle: onAttach → onDetach
  2. View lifecycle:            onCreateView → onDestroyView

Always use viewLifecycleOwner for UI-related observations.
Always use this (Fragment lifecycle) ONLY for observations that should
survive back stack (very rare — almost never correct).
```

---

## 9. Common Lifecycle Bugs and Their QA Tests

### Bug 1: Stale Data on Return

```
SYMPTOM: User navigates to a screen, goes to another screen, comes back,
         data is old (does not reflect changes made in the other screen)

CAUSE:   Network call in onCreate() instead of onResume() or reactive data source

QA TEST:
  1. Load data on Screen A (e.g., citation list shows "PENDING")
  2. Navigate to Screen B (e.g., mark citation as "PAID")
  3. Navigate back to Screen A
  Expected: Citation shows "PAID"
  Bug: Citation still shows "PENDING"
```

### Bug 2: Memory Leak (Activity/Fragment Not GC'd)

```
SYMPTOM: App uses more and more memory over time, eventually crashes or gets slow
         (OutOfMemoryError after multiple screen navigations)

CAUSE:   A non-UI object (ViewModel, Repository, Thread) holds a strong reference
         to an Activity or Fragment that should be garbage collected

QA TEST: Hard to test directly — requires memory profiling tools
  1. Enable Android Profiler (Memory)
  2. Navigate between screens 20+ times
  3. Force GC
  Expected: Memory usage stable
  Bug: Memory grows monotonically, never stabilizes
```

### Bug 3: Double Network Calls on Rotation

```
SYMPTOM: After rotating the device, two duplicate API requests are sent,
         sometimes showing duplicate items or inconsistent data

CAUSE:   Network call in onCreate() or onResume() rather than in ViewModel.init()
         Activity is destroyed and recreated on rotation → onCreate() runs again

QA TEST:
  1. Navigate to citation list screen
  2. Rotate device (or trigger configuration change)
  Expected: One API call, list shows same data, no flicker
  Bug: API called twice, items duplicate, spinner appears again
```

### Bug 4: Crash After Back Navigation (Null Binding in Fragment)

```
SYMPTOM: App crashes with NullPointerException on the binding object
         after navigating back and forth between screens

CAUSE:   Fragment binding is accessed after onDestroyView() set it to null,
         e.g., a delayed callback fires after the view is gone

QA TEST:
  1. Navigate to Fragment A
  2. Quickly tap something that triggers a delayed operation (e.g., a search with 500ms debounce)
  3. Immediately press Back
  4. Wait 500ms
  Expected: No crash — Fragment handles the case where view is gone
  Bug: NullPointerException crash
```

### Bug 5: State Not Restored After Process Death

```
SYMPTOM: User fills a form, backgrounds the app, returns, form is empty

CAUSE:   onSaveInstanceState() not implemented or not saving all form fields

QA TEST (requires Developer Options):
  1. Enable "Don't keep activities" in Developer Options
  2. Start filling the registration form (email, name, etc.)
  3. Press Home
  4. Return to app via Recents
  Expected: Form fields still contain the user's input
  Bug: Form is empty — user's work is lost
```

---

## 10. Configuration Changes — Rotation, Language, Font Size

### What Is a Configuration Change?

A configuration change is when the device configuration changes and Android needs to update resources:

- **Screen rotation** (portrait ↔ landscape) — new layouts may be needed
- **Language/locale change** — new string resources needed
- **Font size change** (accessibility setting) — layouts must reflow
- **Dark/Light mode toggle**
- **Keyboard attach/detach** (some devices)
- **Window resize** (split-screen)

### Default Behavior: Activity is Recreated

By default, Android **destroys and recreates** the Activity on every configuration change:

```
ROTATION HAPPENS:
  onPause() → onStop() → onDestroy() → [Activity created fresh]
  → onCreate(savedInstanceState) → onStart() → onResume()

This is by design — to load the correct layout for the new orientation.
```

### The Developer Anti-Pattern: Blocking Rotation

```xml
<!-- BAD — blocks all rotation. Disables accessibility for users who need landscape -->
<activity
    android:name=".MainActivity"
    android:screenOrientation="portrait" />
```

```kotlin
// ALSO BAD — manually handles configuration changes to avoid recreation
// Now you must handle all resource updates yourself — prone to bugs
<activity
    android:name=".MainActivity"
    android:configChanges="orientation|screenSize|keyboard" />
```

**The correct approach**: Let Android handle rotation naturally. Use ViewModel to survive the configuration change — the ViewModel is NOT destroyed on rotation:

```kotlin
class CitationListViewModel : ViewModel() {
    // This data survives rotation — only destroyed when Activity is truly finished
    private val _citations = MutableStateFlow<List<Citation>>(emptyList())
    val citations: StateFlow<List<Citation>> = _citations

    init {
        loadCitations()  // only called ONCE — not on rotation
    }
}
```

### QA Tests for Configuration Changes

```
TEST: Rotation preserves state
  1. Load citation list
  2. Scroll to middle of list
  3. Rotate device
  Expected: Same scroll position, same data, no loading spinner
  Bug: List resets to top, or data reloads with spinner

TEST: Font size change doesn't break layout
  1. Set font size to "Large" or "Largest" in Accessibility settings
  2. Navigate through the app
  Expected: All text fits on screen, no truncation or overflow
  Bug: Buttons overlap, text gets cut off, layout breaks

TEST: Dark mode toggle
  1. Enable system dark mode while app is open
  Expected: App applies dark theme instantly without crash
  Bug: Crash, or app stays in light mode (ignoring system theme)
```

---

## 11. Lifecycle-Aware Components

Modern Android uses **lifecycle-aware components** that automatically respond to lifecycle events without you writing manual start/stop code.

```kotlin
// OLD WAY — manual lifecycle management (error-prone)
class CitationListActivity : AppCompatActivity() {
    private var locationManager: LocationManager? = null

    override fun onResume() {
        super.onResume()
        locationManager = getSystemService(LocationManager::class.java)
        locationManager?.requestLocationUpdates(...)  // start
    }

    override fun onPause() {
        super.onPause()
        locationManager?.removeUpdates(...)  // stop — easy to forget!
        locationManager = null
    }
}

// NEW WAY — LifecycleObserver (self-managing component)
class LocationTracker(private val lifecycle: Lifecycle) : DefaultLifecycleObserver {
    override fun onResume(owner: LifecycleOwner) {
        startTracking()  // automatically called on onResume
    }
    override fun onPause(owner: LifecycleOwner) {
        stopTracking()   // automatically called on onPause — cannot forget
    }
}

// In Activity:
class CitationListActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Register once — tracker manages itself from now on
        lifecycle.addObserver(LocationTracker(lifecycle))
    }
    // No onResume/onPause needed for location management
}
```

### The Most Important Lifecycle-Aware Component: ViewModel

```kotlin
// ViewModel is scoped to Activity/Fragment lifecycle
// Survives: rotation, language change, font size change
// Destroyed: Activity finishes (back press, finish())
// Also destroyed: process death (unless SavedStateHandle is used)

class CitationListViewModel(
    private val savedStateHandle: SavedStateHandle,
    private val repository: CitationRepository
) : ViewModel() {

    // This value survives BOTH rotation AND process death
    val searchQuery = savedStateHandle.getStateFlow("search_query", "")

    fun updateSearch(query: String) {
        savedStateHandle["search_query"] = query  // automatically saved
    }

    override fun onCleared() {
        super.onCleared()
        // Called when ViewModel is truly destroyed (Activity finished)
        // Cancel network calls, close non-DB resources
    }
}
```

---

## 12. Interview Questions on Lifecycle

**Q: "What is the difference between onPause and onStop?"**

> "`onPause` is called when the Activity loses focus — it may still be partially visible (for example, a transparent dialog is on top of it). `onStop` is called when the Activity is completely hidden — the user has switched to another app or navigated away entirely. The practical difference: `onPause` must be fast because the system is waiting for it to finish before showing the next Activity. `onStop` can do heavier cleanup — saving data to the database, canceling subscriptions — because there's no UI blocked waiting for it. I release the camera and pause animations in `onPause`, and save data and cancel network subscriptions in `onStop`."

**Q: "What happens to a ViewModel during device rotation?"**

> "The ViewModel is NOT destroyed during rotation. This is its primary purpose. When the device rotates, the Activity is destroyed and recreated, but the Android framework keeps the ViewModel instance alive in a ViewModelStore until the Activity is truly finished. The new Activity instance receives the SAME ViewModel object via `ViewModelProvider`. This means any data loaded by the ViewModel — API responses, lists, computed results — survives rotation without re-fetching. Only if the user presses Back or calls `finish()` does the ViewModel get destroyed via `onCleared()`."

**Q: "What is 'process death' and how do you handle it?"**

> "Process death is when the Android OS kills your app's process to reclaim memory — usually because a foreground app needs RAM. It can happen whenever your app is in the background. From the user's perspective, they left the app, did other things, came back, and expect to see where they left off. But the process is gone — all in-memory state is lost. Android reconstructs the Activity's back stack from saved data. The handles: first, `onSaveInstanceState` — save lightweight transient state (form draft, scroll position) to a Bundle, restore it in `onCreate`. Second, Room database and DataStore — any data that was persisted to disk survives. Third, `SavedStateHandle` in ViewModel — for ViewModel state that must survive. The test is simple: enable 'Don't keep activities' in Developer Options and navigate through the app — any screen that loses state has a process death bug."

---

**Next in this folder**: [03_ViewModel_StateFlow_LiveData.md](./03_ViewModel_StateFlow_LiveData.md) — ViewModel internals, LiveData vs StateFlow, coroutines in ViewModels, and the full reactivity model.

**Back to**: [Android folder index](./) | [Series index](../)


---

## Reality Check

**"The lifecycle is a sequence of callbacks to fill in"** — The lifecycle is a STATE MACHINE whose transitions you must reason about, not a checklist ([14_MM]'s state-machine thinking): the pairs that must balance (onStart/onStop, onResume/onPause, onCreate/onDestroy — the resource acquired in one and released in the paired other, the [17_Backtracking] do/undo symmetry — the leak from acquiring in onResume and releasing in onDestroy), the reentrant transitions (the config change that runs onDestroy then onCreate, the process death that skips onDestroy entirely), and the ordering guarantees. "Callbacks to fill in" produces the mismatched-pair leaks and the wrong-callback logic — the lifecycle is a state machine, and correct handling is about the transitions and the balanced acquire/release, not about putting code in each method.

**"onDestroy is where you clean up"** — onDestroy is NOT guaranteed to be called ([01]'s process death — the OS can kill your process without it), so cleanup that MUST happen belongs in the guaranteed-paired earlier callbacks (onPause/onStop) or in lifecycle-aware components that handle it automatically: the resource released in onStop (guaranteed before background), the coroutine in a lifecycle scope (auto-cancelled), the observer auto-removed. "onDestroy for cleanup" leaks exactly when the process is killed (onDestroy skipped) — the reliable pattern is lifecycle-scoped resources (the [modern architecture] lifecycle-aware components that tie cleanup to lifecycle events that ARE guaranteed) rather than manual cleanup in an onDestroy that may never run.

**"Fragments are reusable UI pieces"** — Fragments are reusable UI with their OWN lifecycle nested in the Activity's, and that nesting is a notorious complexity source: the fragment lifecycle that is subtly different from and coupled to the Activity's (the view lifecycle versus the fragment lifecycle — the two lifecycles a fragment has, the source of the "which lifecycle owner do I use" confusion and the view-binding memory leaks), the fragment manager and back stack (the transactions, the state loss exceptions — the commit-after-onSaveInstanceState crash), and the fragment-to-fragment and fragment-to-activity communication. "Reusable UI pieces" undersells the lifecycle complexity — fragments add a second nested lifecycle with its own hazards (the view lifecycle, the transaction timing, the communication patterns), which is why the ecosystem moved toward single-Activity architectures with navigation components and increasingly toward Compose (which sidesteps much of the fragment lifecycle complexity).

**"saveInstanceState saves my app's state"** — savedInstanceState is a SMALL, serialized bundle for TRANSIENT UI state across recreation — not general state persistence: it has a size limit (the TransactionTooLargeException from stuffing too much in — it is for small UI state like scroll position and form input, not data), it is serialized (the [performance] cost, the parcelable requirement), and it is for recreation (config change, process death) not for permanent storage (the database/DataStore [05] for real persistence). Plus ViewModel [03] handles config-change survival without the serialization, leaving savedInstanceState for the process-death case specifically. "Saves my app's state" over-scopes a small transient bundle — the correct model layers it (ViewModel for config changes, savedInstanceState for the small UI state that must survive process death, real storage for data), and dumping everything into savedInstanceState hits the size limit and the serialization cost.

**"Lifecycle bugs show up in normal testing"** — Lifecycle bugs are timing-and-scenario dependent and easily missed ([01]'s config changes, [21_SDET Ch26] flakiness): the leak that only manifests after many rotations, the crash that needs the exact background-and-restore timing, the state loss that only the process-death scenario triggers (the "don't keep activities" developer option exists precisely to force this rare-in-testing scenario), the observer-update-after-destroy race. Normal click-through testing rarely rotates, backgrounds, kills, and restores in the combinations that trigger lifecycle bugs — the discipline is deliberately testing the lifecycle scenarios (rotate repeatedly, enable don't-keep-activities to force process death, background and restore) plus the lifecycle-aware components that prevent whole classes structurally. "Shows up in normal testing" is why lifecycle bugs reach production — they need the specific scenarios that casual testing skips, and the defense is both structural (lifecycle-aware architecture) and deliberate scenario testing.
