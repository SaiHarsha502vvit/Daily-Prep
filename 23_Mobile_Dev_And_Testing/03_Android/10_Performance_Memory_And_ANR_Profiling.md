# Android — Performance, Memory, and ANR Profiling

**Folder**: [03_Android](./) | **Previous**: [09_Dependency_Injection_Hilt.md](./09_Dependency_Injection_Hilt.md) | This is the final chapter in this folder.

> **Reading contract**: This file teaches the chapter [09_Dependency_Injection_Hilt.md](./09_Dependency_Injection_Hilt.md) named as an open gap: ANRs and memory leaks as correctness problems, not just "the app feels slow." You'll learn the exact mechanism that declares an ANR, how StrictMode catches main-thread violations before a user ever sees one, how LeakCanary finds a leak automatically, how to read the Android Studio Profiler's CPU/Memory/Energy tabs, and how to go from a raw bug report ("app freezes sometimes") or a heap dump to a specific line of code. Understanding this file means you stop guessing at performance problems and start diagnosing them.

---

## Table of Contents

1. [Why This Is a Correctness Chapter, Not Just a Performance One](#1-why-this-is-a-correctness-chapter-not-just-a-performance-one)
2. [ANR Fundamentals — The Watchdog and the Main Thread](#2-anr-fundamentals--the-watchdog-and-the-main-thread)
3. [StrictMode — Catching Violations Before Users Do](#3-strictmode--catching-violations-before-users-do)
4. [Memory Fundamentals — Heap, GC, and What "Leak" Actually Means](#4-memory-fundamentals--heap-gc-and-what-leak-actually-means)
5. [LeakCanary — Automatic Leak Detection](#5-leakcanary--automatic-leak-detection)
6. [Android Studio Profiler — CPU, Memory, Energy](#6-android-studio-profiler--cpu-memory-energy)
7. [Diagnosing a Real ANR From a Bug Report](#7-diagnosing-a-real-anr-from-a-bug-report)
8. [Diagnosing a Real Leak From a Heap Dump](#8-diagnosing-a-real-leak-from-a-heap-dump)
9. [Compose-Specific Performance Pitfalls](#9-compose-specific-performance-pitfalls)
10. [Common Mistakes and Their Symptoms](#10-common-mistakes-and-their-symptoms)
11. [Interview Q&A](#11-interview-qa)

---

## 1. Why This Is a Correctness Chapter, Not Just a Performance One

```
THE INSTINCT: "performance" = optional polish, done last, if there's time
THE REALITY:  an ANR is a CRASH the user experiences as a frozen screen —
              the OS kills or offers to kill your app either way
              a leak is a BUG that turns "works fine in the demo" into
              "OutOfMemoryError on the 40th screen navigation in production"

Neither of these is a nice-to-have. Both are correctness failures that
happen to be invisible in a five-minute manual test and guaranteed to
surface at scale — the same "works for me" trap [02_Activity_Fragment_
Lifecycle.md]'s OutOfMemoryError symptom line already named without
teaching the mechanism behind it.
```

This chapter teaches the mechanism: what specifically the OS is watching, what specifically your code did wrong, and what specifically to read (Profiler tab, `StrictMode` violation, LeakCanary trace) to go from symptom to line of code.

---

## 2. ANR Fundamentals — The Watchdog and the Main Thread

```
THE MECHANISM: Android's main thread runs a Looper processing a message
queue — every touch event, every callback, every UI update is a message
on that queue, processed ONE AT A TIME, in order.

If the main thread is busy (blocked on I/O, running a long loop, waiting
on a lock) it cannot process the NEXT message — including the one that
would respond to a user's tap. The system is watching for exactly this:

  INPUT DISPATCH TIMEOUT     ~5 seconds  — no response to a key/touch event
  BROADCASTRECEIVER.onReceive ~10s (foreground) / 60s (background)
  SERVICE.onStartCommand      ~20 seconds (foreground service)

Cross the timeout, and the system declares Application Not Responding —
this is the OS's watchdog, not a crash in YOUR code throwing an exception.
That's the important distinction: an ANR is "the main thread didn't come
back in time," which means the fix is almost never "catch an error" —
it's "get this work off the main thread."
```

```kotlin
// THE ANR-CAUSING PATTERN — looks harmless, blocks the exact thread
// that needs to stay free to answer the next touch event:
override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    val db = SQLiteDatabase.openDatabase(path, null, 0)  // disk I/O — BLOCKS
    val response = httpClient.newCall(request).execute()  // network — BLOCKS
    // Any tap that arrives while either line is running has nowhere
    // to go until this function returns control to the Looper.
}

// THE FIX — get I/O off the main thread; this is exactly what
// [03_ViewModel_StateFlow_LiveData.md]'s viewModelScope + Dispatchers.IO
// already teaches as the default pattern, now with the ANR-avoidance
// reason made explicit rather than left as "best practice":
viewModelScope.launch(Dispatchers.IO) {
    val response = httpClient.newCall(request).execute()
    withContext(Dispatchers.Main) { updateUi(response) }
}
```

---

## 3. StrictMode — Catching Violations Before Users Do

`StrictMode` is a developer-only instrument that watches for the exact category of mistake Section 2 just described, and reports it **immediately, in debug builds, on your own device** — instead of waiting for a user's slower phone to actually cross the ANR timeout in production.

```kotlin
// Application.onCreate() — guarded by BuildConfig.DEBUG so this
// instrumentation never ships to production:
if (BuildConfig.DEBUG) {
    StrictMode.setThreadPolicy(
        StrictMode.ThreadPolicy.Builder()
            .detectDiskReads()      // SharedPreferences.getX() on main thread
            .detectDiskWrites()     // File writes on main thread
            .detectNetwork()        // Any network call on main thread
            .penaltyLog()           // Log it (penaltyDeath() crashes immediately — louder, for CI)
            .build()
    )

    StrictMode.setVmPolicy(
        StrictMode.VmPolicy.Builder()
            .detectLeakedSqlLiteObjects()   // Cursor/Database not closed
            .detectLeakedClosableObjects()  // Any Closeable (Stream, etc.) not closed
            .detectActivityLeaks()          // Activity instance leaked past its lifecycle
            .penaltyLog()
            .build()
    )
}
```

**Why `penaltyLog()` in most setups, not `penaltyDeath()`:** a violation logged to Logcat is something you *notice and fix on your own schedule*; a violation that crashes the app immediately is something you fix *right now, blocking whatever you were doing* — genuinely useful in CI (fail the build on any violation) but disruptive as a default local-dev setting. The choice is itself a small version of the judgment [DOC_08_Patterns_and_AntiPatterns.md] teaches: pick the enforcement level that matches how disruptive the class of mistake actually is.

---

## 4. Memory Fundamentals — Heap, GC, and What "Leak" Actually Means

```
THE JVM/ART TRUTH: Android doesn't have manual memory management —
there's no free()/delete(). The garbage collector reclaims memory for
any object with NO remaining reachable reference from a GC ROOT
(a static field, a running thread's stack, a JNI reference).

A "MEMORY LEAK" IN THIS CONTEXT DOESN'T MEAN "memory disappeared" —
it means the OPPOSITE: an object that should be reachable-then-unreachable
(like a destroyed Activity) is instead STILL reachable through some
reference chain the developer didn't intend — so the GC correctly
leaves it alone, because it correctly still has a path to a GC root.

THE CLASSIC ANDROID LEAK SHAPE:
  A long-lived object (a Singleton, a static field, a background thread,
  a Handler with pending messages) holds a reference — directly or
  through a chain — to a short-lived object (an Activity, a Fragment,
  a View) that should have been destroyed already.
```

```kotlin
// THE LEAK — a static field holding an Activity reference:
class AnalyticsTracker {
    companion object {
        var currentActivity: Activity? = null  // set in onCreate, never cleared
    }
}
// currentActivity is a GC root's field — as long as this static field
// points at the Activity, the Activity (and everything IT references —
// its entire View tree, its ViewModels if not scoped correctly) cannot
// be garbage collected, even long after the user has navigated away
// and the Activity has been destroyed.

// THE FIX — don't hold Activity/View/Context references in anything
// longer-lived than they are; this is exactly why Hilt's scope rule
// [09_Dependency_Injection_Hilt.md]'s Error 3 exists as a COMPILE-TIME
// check — a @Singleton literally cannot be given a shorter-lived
// dependency, which is this exact leak shape prevented structurally:
class AnalyticsTracker @Inject constructor(
    @ApplicationContext private val context: Context  // Application context — lives as long as the tracker does
) { ... }
```

---

## 5. LeakCanary — Automatic Leak Detection

Manually reasoning about every reference chain in a real app is impractical — **LeakCanary** (an open-source library) automates exactly the detection Section 4 just described.

```
THE MECHANISM:
  1. LeakCanary watches specific object types it knows SHOULD become
     unreachable at a specific moment: an Activity after onDestroy(),
     a Fragment's view after onDestroyView(), a ViewModel after onCleared().
  2. It holds a WEAK reference to the watched object, tied to a
     ReferenceQueue — a weak reference does NOT itself prevent GC.
  3. It waits (a short delay, plus forcing a GC) and checks: did the
     object actually get collected?
  4. If NOT collected after it should have been, LeakCanary dumps the
     heap and computes the SHORTEST PATH from a GC root to the leaked
     object — that path IS the reference chain causing the leak.
  5. A notification shows the leak trace directly, in the exact shape
     of "GC ROOT -> AnalyticsTracker.currentActivity -> MainActivity" —
     naming the offending field without you writing any detection code.
```

```gradle
// build.gradle.kts (app module) — debug-only, matching StrictMode's
// own debug-only guard from Section 3:
dependencies {
    debugImplementation("com.squareup.leakcanary:leakcanary-android:2.14")
}
// No further setup needed — LeakCanary installs itself via a
// ContentProvider registered in its own manifest, watching Activities/
// Fragments/ViewModels automatically the moment the dependency is added.
```

**The judgment worth internalizing:** LeakCanary tells you a leak exists and exactly which reference chain causes it — it does not tell you which FIX is correct (clear the field? use a `WeakReference`? move the reference to a properly-scoped Hilt dependency per Section 4's fix?). Reading the trace correctly is the skill; the trace itself is just data.

---

## 6. Android Studio Profiler — CPU, Memory, Energy

The Profiler window (View → Tool Windows → Profiler) is where you go from "something is wrong" to "here is exactly what and when" for problems too broad for StrictMode or LeakCanary to catch alone (StrictMode catches specific rule violations; LeakCanary catches specific leak shapes; the Profiler answers "where is time/memory/battery actually going, right now, on a real timeline").

```
CPU PROFILER:
  Method Trace (Sampled)   — periodic stack-sampling, low overhead,
                             good for "roughly where is time going"
  Method Trace (Instrumented) — records every method entry/exit,
                             precise but high overhead, skews timing
  System Trace             — OS-level scheduling, thread states,
                             good for "is my thread even getting CPU time"

MEMORY PROFILER:
  Live allocation timeline — see allocation SPIKES as they happen,
                             correlate a spike with a specific user action
  Heap dump                — a full snapshot: every object, every
                             reference, the SAME data LeakCanary
                             automates the analysis of in Section 5,
                             available here for manual inspection too
  Native memory             — for JNI/NDK-allocated memory the JVM
                             heap view can't see at all

ENERGY PROFILER:
  Shows wakelocks, location requests, and network/sensor usage that
  keep the CPU/radio awake — the direct cause of "this app drains my
  battery" reports that never show up as a crash or an ANR at all.
```

**The triage question that picks which tab:** is the complaint "the app is slow/janky" (CPU), "the app uses more memory over time / eventually OOMs" (Memory), or "the app drains the battery" (Energy)? Reaching for the wrong tab first is the single most common wasted-time mistake — matching [Flutter_Bootcamp/Reference/DOC_09_Mobile_Debugging_Toolkit.md]'s own "triage instinct: which tool first" framing, one platform over.

---

## 7. Diagnosing a Real ANR From a Bug Report

```
THE BUG REPORT: "The app freezes for a few seconds sometimes, mostly
when I tap the checkout button after adding a lot of items to cart."

STEP 1 — reproduce with the System Trace running (Section 6). Tap
checkout with a large cart. Look at the main thread's row: is it
CONTINUOUSLY busy (one long block) or BLOCKED (waiting, not running)?

STEP 2 — a continuously busy main thread means CPU-bound work is
running there directly. A blocked-and-waiting main thread means it's
stuck on a LOCK or I/O call made from the main thread.

STEP 3 — for "checkout with a large cart" specifically, the likely
culprit is a per-item computation (price recalculation, discount
application) running as a plain loop ON the main thread, scaling with
cart size — exactly the kind of O(n) or worse work that's invisible
with 3 test items and very visible with 200 real ones.

THE FIX PATTERN (mirrors Section 2's Dispatchers.IO fix, generalized —
this isn't I/O, it's CPU-bound work, so Dispatchers.Default is correct,
not Dispatchers.IO, which is sized for blocking I/O, not computation):

viewModelScope.launch(Dispatchers.Default) {
    val total = cartItems.computeTotalWithDiscounts()  // CPU-bound work, off main thread
    withContext(Dispatchers.Main) { updateCheckoutUi(total) }
}
```

The general method, worth restating: **a vague symptom report ("freezes sometimes") becomes a specific diagnosis by finding the SCALING variable** (cart size, item count, list length) **and then checking whether the main thread's per-unit work grows with it** — the same instinct as diagnosing an algorithmic complexity problem, just applied to "what's on the main thread" instead of "what's asymptotically slow."

---

## 8. Diagnosing a Real Leak From a Heap Dump

```
THE SCENARIO: LeakCanary reports (Section 5):

  GC ROOT: static field AnalyticsTracker.currentActivity
    -> MainActivity instance (leaking)
       -> mContentView (View tree)
          -> RecyclerView
             -> Adapter
                -> 4,000 cached Bitmap objects
```

**Reading this trace correctly, top to bottom:**
1. The GC root (`static field`) is the ANCHOR — this is what's incorrectly holding on. It's always the first thing to fix, because everything below it is only leaked *because* of this anchor.
2. Each arrow is a field reference — `AnalyticsTracker.currentActivity` holds a `MainActivity`, whose `mContentView` field holds the View tree, and so on down to the actual expensive payload (4,000 Bitmaps).
3. **The fix targets the ANCHOR, not the payload.** Clearing the 4,000 bitmaps wouldn't fix anything — a new `MainActivity` instance would just accumulate a new set on the next navigation, because the *anchor* (the static field never being cleared) is the actual bug, exactly matching [Section 4](#4-memory-fundamentals--heap-gc-and-what-leak-actually-means)'s fix: `AnalyticsTracker.currentActivity = null` in `onDestroy()`, or — better, per that section's actual recommended fix — never holding an `Activity` reference there in the first place.

**Why this order of reading matters as a general skill:** a heap dump or leak trace can look intimidating because of how much is at the bottom of the chain (thousands of objects, megabytes of bitmaps) — the size of the payload is not the size of the fix. The fix is almost always a single reference at the top of the chain.

---

## 9. Compose-Specific Performance Pitfalls

[04_Jetpack_Compose_Deep_Dive.md's recomposition section](./04_Jetpack_Compose_Deep_Dive.md#3-recomposition--how-compose-updates-the-ui) already teaches *that* Compose recomposes when observed state changes. The senior-level addition: recomposition is supposed to be **narrow** (only the composables actually reading the changed state re-run) — a "recomposition storm" is what happens when Compose can't prove that narrowness, and recomposes far more than necessary.

```kotlin
// THE STORM — an unstable parameter defeats Compose's skip check:
@Composable
fun CartScreen(items: List<CartItem>) {  // List is NOT a stable type to Compose
    // Every recomposition of the PARENT creates a new List reference,
    // even if the actual items are identical — Compose can't prove
    // "this parameter didn't really change," so it can't skip this
    // composable, and everything inside it recomposes too.
    LazyColumn {
        items(items) { item -> CartItemRow(item) }
    }
}

// THE FIX — an immutable, stable collection type Compose CAN reason about:
@Composable
fun CartScreen(items: ImmutableList<CartItem>) {  // kotlinx.collections.immutable
    LazyColumn {
        items(items) { item -> CartItemRow(item) }
    }
}
```

```kotlin
// A SECOND STORM SHAPE — recomposing on every frame for a derived value:
@Composable
fun ScrollHeader(listState: LazyListState) {
    // WRONG: reads listState.firstVisibleItemIndex directly in the
    // composable body — recomposes this composable on EVERY scroll pixel
    val isScrolled = listState.firstVisibleItemIndex > 0
    HeaderBar(elevated = isScrolled)
}

// FIX: derivedStateOf tells Compose "only recompose readers of THIS
// value when the DERIVED boolean actually flips, not every time the
// underlying scroll position changes":
@Composable
fun ScrollHeader(listState: LazyListState) {
    val isScrolled by remember {
        derivedStateOf { listState.firstVisibleItemIndex > 0 }
    }
    HeaderBar(elevated = isScrolled)
}
```

**Finding storms without guessing:** the Compose compiler can emit metrics reports (`-P plugin:androidx.compose.compiler.plugins.kotlin:reportsDestination=<dir>`) listing which composables are `restartable` vs. `skippable` and which parameters are `stable` vs. `unstable` — the same "measure, don't guess" discipline as Section 6's Profiler, applied at the Compose-compiler level instead of the runtime level.

---

## 10. Common Mistakes and Their Symptoms

### Mistake 1: Reading StrictMode Violations as Optional Noise

```
SYMPTOM: Logcat shows StrictMode violations during development;
         team habitually ignores them since "the app still works."
CAUSE:   A main-thread disk/network violation on a fast dev device and
         fast dev network is often too quick to actually cross the ANR
         timeout — but the SAME code on a slow device/network in
         production will cross it.
FIX:     Treat every StrictMode violation as a real bug to fix, not a
         warning to suppress — it's the same class of problem Section 2
         teaches, just caught before a user's slower device turns it
         into an actual ANR.
```

### Mistake 2: Fixing the Symptom Object Instead of the Anchor Reference

```
SYMPTOM: A leak trace is read, the large object at the bottom of the
         chain is cleared/nulled, the leak trace changes shape slightly
         but memory still grows over time.
CAUSE:   Exactly Section 8's lesson inverted — the anchor (the static
         field, the un-cleared listener, the un-cancelled coroutine)
         was left in place; something else eventually accumulates
         behind the same anchor.
FIX:     Always trace to the GC-root anchor first (Section 8's
         top-to-bottom reading order), fix THAT reference, and treat
         clearing the payload object as a symptom relief, not the fix.
```

### Mistake 3: Profiling a Debug Build and Trusting the Numbers

```
SYMPTOM: CPU Profiler shows a method taking much longer than it does
         for real users; energy numbers look worse than release reports.
CAUSE:   Debug builds skip R8/ProGuard optimization and often run with
         additional instrumentation (including StrictMode itself, and
         instrumented — not sampled — method tracing) that adds real
         overhead the release build won't have.
FIX:     For numbers you intend to compare against a target or report
         to stakeholders, profile a "profileable" release build
         (Android Gradle Plugin's <profileable> manifest tag) — sampled
         CPU tracing on a debug build is fine for RELATIVE comparisons
         ("is this change faster than before") but not absolute ones.
```

---

## 11. Interview Q&A

**Q: "What exactly triggers an ANR, mechanically?"**

> "The main thread runs a Looper that processes one message at a time from a queue — every touch event and UI callback is a message. The OS watches specific timeouts: roughly 5 seconds for input dispatch, 10 or 60 seconds for a BroadcastReceiver depending on foreground state, 20 seconds for a foreground service's `onStartCommand`. If the main thread doesn't get back to processing the queue within that window — because it's blocked on disk I/O, a network call, or just CPU-bound work — the system declares Application Not Responding. It's a watchdog timeout, not an exception thrown by your code, which is why the fix is almost always 'move this work off the main thread,' not 'add a try/catch.'"

**Q: "How does LeakCanary actually detect a leak, not just guess?"**

> "It watches specific objects — Activities after `onDestroy()`, Fragment views after `onDestroyView()`, ViewModels after `onCleared()` — using a weak reference tied to a `ReferenceQueue`, since a weak reference doesn't itself keep the object alive. After forcing a GC, it checks whether the object was actually collected. If it wasn't, that's not a guess — it's proof something is still holding a reference when nothing should be. LeakCanary then dumps the heap and computes the shortest path from a GC root to that object, which is the actual reference chain causing the leak, and shows it directly."

**Q: "Why would a Compose screen recompose more than expected, and how do you find out?"**

> "The most common cause is an unstable parameter type — a plain `List` instead of an immutable collection, or a lambda that's recreated on every parent recomposition — which stops Compose from proving a composable's inputs didn't really change, so it can't skip recomposing it. The second common cause is reading a frequently-changing value directly in a composable body instead of behind `derivedStateOf`, which recomposes on every underlying change instead of only when a derived condition flips. Rather than guessing, the Compose compiler can emit a metrics report showing exactly which composables are skippable versus restartable and which parameters it considers stable — that's the authoritative source, not intuition about the code."

---

**This is the final chapter in this folder.** For E2E/Appium testing, see [../02_Android_Native_Dev_And_Testing.md](../02_Android_Native_Dev_And_Testing.md).

**Back to**: [Android folder index](./) | [Series index](../)

---

## Reality Check

**"An ANR means my code crashed"** — An ANR is a WATCHDOG TIMEOUT, not an exception ([Section 2](#2-anr-fundamentals--the-watchdog-and-the-main-thread)): the main thread's Looper that must keep processing its message queue (the mechanism, not a bug in any one function), the timeout thresholds that vary by trigger (~5s input, ~10-60s broadcast, ~20s foreground service — different numbers for different kinds of "the main thread didn't come back"), and the fix that's almost always relocation of work (the [03_ViewModel_StateFlow_LiveData.md] `viewModelScope.launch(Dispatchers.IO)` pattern), not error handling. "My code crashed" misses that nothing threw — the OS gave up waiting, which is why `try`/`catch` around the slow call does nothing to prevent an ANR; only moving the work off the main thread does.

**"StrictMode violations are just noise if the app still runs"** — A StrictMode violation on a FAST dev device is the SAME bug that becomes a real ANR on a slow production device ([Mistake 1](#mistake-1-reading-strictmode-violations-as-optional-noise), [13_DE testing]'s environment-parity lesson): the violation detector (`detectDiskReads`/`detectNetwork`/`detectLeakedClosableObjects` — the specific rule categories), the debug-build-only guard (`BuildConfig.DEBUG` — the same debug-only gating LeakCanary's own dependency uses in [Section 5](#5-leakcanary--automatic-leak-detection)), and the `penaltyLog()` vs `penaltyDeath()` choice (log-and-notice versus crash-and-force-fix-now — a real enforcement-level judgment call, [DOC_08_Patterns_and_AntiPatterns.md]'s general "match the penalty to the mistake" reasoning). "Just noise if it still runs" mistakes a fast dev environment's forgiveness for the bug not existing — the bug is real, the device is just too fast to expose it yet.

**"A memory leak means memory disappeared"** — A leak means the OPPOSITE: memory that SHOULD be reclaimable is still reachable ([Section 4](#4-memory-fundamentals--heap-gc-and-what-leak-actually-means)): the GC root concept (a static field, a running thread, a JNI reference — the thing that makes an object "still reachable" at all), the classic Android leak shape (a long-lived object holding a short-lived one — the [09_Dependency_Injection_Hilt.md] scope-mismatch rule preventing exactly this at compile time for Hilt-managed objects), and the reference CHAIN a leak trace shows (not one bad object, a path of them). "Memory disappeared" is backwards — nothing vanished, something that should have been freed is still pinned in place by a reference nobody meant to keep.

**"The big object at the bottom of a leak trace is the thing to fix"** — The ANCHOR at the TOP of the trace is the actual bug ([Section 8](#8-diagnosing-a-real-leak-from-a-heap-dump), [Mistake 2](#mistake-2-fixing-the-symptom-object-instead-of-the-anchor-reference)): the GC-root-to-object path (read top to bottom, the anchor is always first), the payload at the bottom (the large-and-alarming-looking object — Bitmaps, a big list — that's just what happened to be reachable through the leak, not the cause of it), and the fix that targets the reference, not the payload (clearing the anchor, not the accumulated objects behind it). "Fix the big object" treats a symptom as the disease — clear the payload and the exact same anchor leaks a new payload on the next navigation.

**"Compose recomposition is automatic and always efficient"** — Compose recomposition is automatic SCHEDULING with a SKIPPABILITY check that can fail silently ([Section 9](#9-compose-specific-performance-pitfalls)): the stability inference Compose performs on parameters (the `List` vs `ImmutableList` distinction — a type Compose can't prove is stable defeats skipping for the ENTIRE composable, not just the changed part), the `derivedStateOf` gap (reading a raw fast-changing value directly recomposes every readers on every change, versus gating behind a derived condition), and the compiler metrics report as the authoritative diagnostic (not guessing from reading the code, matching [Section 6](#6-android-studio-profiler--cpu-memory-energy)'s Profiler-over-guessing discipline one layer up the stack). "Automatic and efficient" is true only when Compose can actually prove narrowness — an unstable parameter silently turns a narrow, cheap update into a wide, expensive one, with no error or warning telling you it happened.
