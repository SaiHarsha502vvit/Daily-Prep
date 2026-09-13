# iOS — Performance, Memory, and Instruments

### Companion to [03_iOS_Native_Dev_And_Testing.md](03_iOS_Native_Dev_And_Testing.md) · The Android-side equivalent: [03_Android/10_Performance_Memory_And_ANR_Profiling.md](03_Android/10_Performance_Memory_And_ANR_Profiling.md)

> **Reading contract**: [03_iOS_Native_Dev_And_Testing.md](03_iOS_Native_Dev_And_Testing.md) covers ARC and retain cycles conceptually (Section 4's memory warning, the Reality Check's "ARC doesn't detect cycles" point) — this file teaches the tooling that turns "retain cycles are a thing" into "here is the specific line holding the reference." You'll learn iOS's watchdog-termination mechanism (its ANR-equivalent, with real timeout numbers), the Hang Rate metric Xcode's Organizer reports from real users, the three Instruments tools that matter most (Time Profiler, Allocations, Leaks), how to read the Memory Graph Debugger, and two full worked diagnoses — a hang from a bug report, a leak from a memory graph.

---

## Table of Contents

1. [Why This Is a Correctness Chapter, Not Just a Performance One](#1-why-this-is-a-correctness-chapter-not-just-a-performance-one)
2. [iOS's ANR-Equivalent — Watchdog Terminations and Hang Rate](#2-ioss-anr-equivalent--watchdog-terminations-and-hang-rate)
3. [Instruments — Time Profiler](#3-instruments--time-profiler)
4. [Instruments — Allocations](#4-instruments--allocations)
5. [Instruments — Leaks and the Memory Graph Debugger](#5-instruments--leaks-and-the-memory-graph-debugger)
6. [Reading a Retain Cycle at the Tooling Level](#6-reading-a-retain-cycle-at-the-tooling-level)
7. [Jetsam — When the OS Kills You for Using Too Much Memory](#7-jetsam--when-the-os-kills-you-for-using-too-much-memory)
8. [Diagnosing a Real Hang From a Bug Report](#8-diagnosing-a-real-hang-from-a-bug-report)
9. [Diagnosing a Real Leak From the Memory Graph Debugger](#9-diagnosing-a-real-leak-from-the-memory-graph-debugger)
10. [Common Mistakes and Their Symptoms](#10-common-mistakes-and-their-symptoms)
11. [Interview Q&A](#11-interview-qa)

---

## 1. Why This Is a Correctness Chapter, Not Just a Performance One

```
THE INSTINCT: "performance" = optional polish, done last, if there's time
THE REALITY:  a watchdog termination is a CRASH the user experiences as
              the app vanishing — no exception, no stack trace in your
              own code, just gone
              a retain cycle is a BUG that turns "works fine in a five-
              minute demo" into "memory climbs every screen and the OS
              kills the app after ten minutes of real use"

[03_iOS_Native_Dev_And_Testing.md]'s own Reality Check already names
the retain cycle as real and common — this chapter is where "real and
common" becomes "here's the tool that shows you exactly which two
objects are holding each other."
```

---

## 2. iOS's ANR-Equivalent — Watchdog Terminations and Hang Rate

```
THE MECHANISM: like Android's main-thread Looper, iOS's main thread
runs a RunLoop processing UI events one at a time. iOS has TWO
separate, related watchdogs worth distinguishing:

WATCHDOG TERMINATIONS — a hard kill, not a metric, when a specific
LIFECYCLE TRANSITION takes too long (verified current numbers):
  Process launch                    ~20.0 seconds
  Process exit                       ~5.0 seconds
  Resuming / background task window ~30 seconds
  (background task EXPIRATION handlers specifically get only a few
  seconds to actually finish once called)

These produce the exception code 0x8badf00d ("ate bad food") in a
crash report — the direct iOS analog to an Android ANR trace, and the
first thing to search for when a crash report has no stack trace
pointing at your own code at all.

HANG RATE — a SOFTER, ongoing metric, not a kill: any time the main
thread is unresponsive for at least 250 MILLISECONDS counts as a
"hang." Xcode's Organizer aggregates this across your real user base
and reports both the MEDIAN hang rate and the 90th-percentile hang
rate — the tail number matters because a median-only view can hide a
subset of users (older devices, specific screens) having a much worse
experience than "typical."
```

**Why both matter, and why they're different problems:** a watchdog termination is binary — you either crossed the line or you didn't, and it takes one one specific slow launch/resume to produce it. Hang Rate is a distribution — most 250ms+ hangs never come close to a watchdog termination, but a high hang rate is a real UX problem the crash-free-rate metric alone would never surface, since a hang isn't a crash at all.

*Sources verified via WebSearch (2026-09): [iOS Watchdog Terminations and How They Can Stem From Background Tasks](https://embrace.io/blog/ios-watchdog-terminations/); [Track down hangs with Xcode and on-device detection — WWDC22](https://developer.apple.com/videos/play/wwdc2022/10082/); [Analyzing responsiveness issues in your shipping app — Apple Developer Documentation](https://developer.apple.com/documentation/xcode/analyzing-responsiveness-issues-in-your-shipping-app).*

---

## 3. Instruments — Time Profiler

```
WHAT IT ANSWERS: "where is CPU time actually going, on which thread,
right now" — the direct iOS equivalent of Android Studio Profiler's
CPU tab from [03_Android/10_...]'s Section 6.

HOW IT WORKS: periodic STACK SAMPLING (not full instrumentation) —
low overhead, statistical rather than exact, good for "roughly where
is time going" without skewing the very timing you're trying to measure.

READING THE CALL TREE:
  "Separate by Thread"  — is the expensive work even ON the main
                           thread? (If not, it can't cause a hang.)
  "Invert Call Tree"    — see LEAF functions first (where time is
                           actually spent) instead of starting from
                           main() and drilling down manually
  "Hide System Libraries" — focus on YOUR code's frames, not the
                           OS frameworks calling into it
```

The triage question this tool answers first: **is the main thread doing this work at all, and if so, is it CPU-bound (the Time Profiler's job) or blocked waiting (a different signal — a thread state, not CPU usage, which System Trace-equivalent tooling in Instruments' "Thread State" track would show instead)?**

---

## 4. Instruments — Allocations

```
WHAT IT ANSWERS: "is memory usage growing over time, and from what,
and does it come back down when it should?"

THE GENERATION WORKFLOW (the specific technique that finds leaks
without needing a leak to be "detected" automatically first):
  1. Start recording, let the app reach a stable resting state
  2. Mark GENERATION A — a snapshot baseline
  3. Perform the suspect action (open and close a screen, say, 10 times)
  4. Mark GENERATION B
  5. Compare: objects that persist in Generation B that should have
     been freed after step 3 (e.g., 10 ViewController instances still
     alive after navigating away from all of them 10 times) are the
     leak candidates — the growth between generations IS the leak,
     made visible without any automated leak-detection heuristic at all.
```

**Why the generation technique matters as a method, not just a feature:** it turns "memory seems to grow" (a vague, hard-to-act-on observation) into "these 10 specific ViewController instances, that should not exist anymore, do" — a concrete, addressable list of objects, the same shift from vague symptom to specific object that [Android Ch10's Section 5](03_Android/10_Performance_Memory_And_ANR_Profiling.md#5-leakcanary--automatic-leak-detection) achieves automatically via LeakCanary's weak-reference-plus-forced-GC check. iOS's Allocations tool requires you to manually bookmark the before/after — the underlying logic (something that should be gone, isn't) is the same.

---

## 5. Instruments — Leaks and the Memory Graph Debugger

```
LEAKS (the Instruments tool): periodically scans the heap for objects
with NO PATH from any root — but note this is a NARROWER guarantee
than it sounds: ARC's retain-count model means a genuine RETAIN CYCLE
(two objects strongly referencing each other, referenced by nothing
else) IS unreachable from outside the cycle and WILL be flagged. But
an object that's technically still reachable through some long-lived
container it was never removed from is NOT a "leak" by this
tool's definition, even though it's functionally the same bug
[Section 6] describes — Leaks specifically finds cycles/orphans,
not "reachable-but-shouldn't-be" the way a human would define a leak.

MEMORY GRAPH DEBUGGER (Xcode's own, separate, on-demand tool):
  Triggered any time from the debug bar while the app is running —
  shows the CURRENT object graph, with a small purple exclamation-mark
  badge on any object Xcode's own heuristics suspect is leaked. Unlike
  Leaks (an Instruments recording session), this is a live, on-demand
  snapshot — useful for "I suspect THIS screen leaks, let me check
  right now" without a separate profiling run.
```

The practical rule: **Leaks (Instruments) for a systematic sweep over a recording session; Memory Graph Debugger for a targeted "let me check this one suspicion right now" during normal debugging** — the same two-tools-two-jobs relationship as Android's LeakCanary (automatic, always-on) versus a manual heap dump inspection in Android Studio's own Profiler.

---

## 6. Reading a Retain Cycle at the Tooling Level

```kotlin
// (Swift, shown for the retain-cycle SHAPE — same underlying concept
// [03_iOS_Native_Dev_And_Testing.md]'s Reality Check named conceptually)
class ProfileViewController: UIViewController {
    var onSave: (() -> Void)?

    override func viewDidLoad() {
        super.viewDidLoad()
        // THE CYCLE: this closure captures `self` STRONGLY, and self
        // holds `onSave` STRONGLY — two strong references, each
        // keeping the other's retain count above zero forever.
        onSave = {
            self.saveProfile()   // strong capture of self
        }
    }
}
```

**What the Memory Graph Debugger actually shows for this:** selecting the leaked `ProfileViewController` instance displays its retain graph — an arrow FROM the closure object TO `self`, and (implicitly, since the closure is stored in `self.onSave`) an arrow FROM `self` back TO the closure. A cycle, visually, is exactly what it sounds like: following the arrows returns you to where you started, with no path back out to any root. Reading the graph is the entire diagnosis — the fix is a one-word change:

```swift
onSave = { [weak self] in
    self?.saveProfile()   // weak capture — breaks the cycle
}
```

**Why `[weak self]` and not always** — a `weak` reference doesn't prevent deallocation, so `self` becomes `nil` once nothing else holds it. That's correct here because the closure genuinely shouldn't be the thing keeping the view controller alive. The judgment [DOC_08_Patterns_and_AntiPatterns.md] models generally applies here too: `weak` is not a default habit to sprinkle everywhere — it's the fix specifically when the reference being captured shouldn't be the one extending the other object's lifetime.

---

## 7. Jetsam — When the OS Kills You for Using Too Much Memory

```
JETSAM is iOS's system-wide memory-pressure killer — distinct from
BOTH watchdog terminations (Section 2, about TIME) and Leaks (Section 5,
about REACHABILITY). Jetsam kills the app using the most memory when
the WHOLE DEVICE is under memory pressure, regardless of whether any
individual app has a "leak" in the reachability sense at all — a
correctly-written app that legitimately needs a lot of memory for a
moment (decoding several large images at once, say) can still be
Jetsam-killed if the device is low on memory system-wide.

THE PRACTICAL DEFENSE: implement didReceiveMemoryWarning() (already
introduced conceptually in [03_iOS_Native_Dev_And_Testing.md]'s Section 4)
to proactively release cached, recreatable data (image caches, prefetched
data) BEFORE Jetsam decides your process is the one to kill — the
memory warning is the OS's polite request; Jetsam is what happens if
nothing responds to it.
```

---

## 8. Diagnosing a Real Hang From a Bug Report

```
THE BUG REPORT: "The app freezes for a couple seconds when I pull to
refresh the feed, especially the first time after opening the app."

STEP 1 — reproduce with Time Profiler (Section 3) attached, filtered
to the main thread, system libraries hidden.

STEP 2 — "especially the first time" is the scaling clue (the same
diagnostic instinct as [Android Ch10's Section 7](03_Android/10_Performance_Memory_And_ANR_Profiling.md#7-diagnosing-a-real-anr-from-a-bug-report)'s
cart-size clue) — something is doing MORE work, or blocking work, on
a cold start specifically. A common cause: a cache or a large JSON
response being PARSED synchronously on the main thread the first time,
with subsequent refreshes hitting an already-warm in-memory cache.

STEP 3 — the Time Profiler's inverted call tree shows a JSON-decoding
function as the top self-time consumer on the main thread during the
hang window, confirming the hypothesis.

THE FIX:
struct FeedLoader {
    func loadFeed() async throws -> [Post] {
        let data = try await urlSession.data(from: feedURL).0
        // Decode OFF the main thread — Task.detached or a background
        // actor, mirroring Android's Dispatchers.Default move for
        // CPU-bound work in the equivalent Android diagnosis:
        return try await Task.detached(priority: .userInitiated) {
            try JSONDecoder().decode([Post].self, from: data)
        }.value
    }
}
```

---

## 9. Diagnosing a Real Leak From the Memory Graph Debugger

```
THE SCENARIO: QA reports the app "feels sluggish after using it for
a while, especially after opening a lot of product detail screens."

STEP 1 — open several product detail screens, navigate back each
time, then trigger the Memory Graph Debugger from the debug bar.

STEP 2 — filter to the ProductDetailViewController class. If ten were
opened and closed, but ten (or close to it) instances still show up
in the graph, that's the leak — the exact "should be gone, isn't"
signal from Section 4's generation technique, now via a live snapshot
instead of a recorded Allocations session.

STEP 3 — select one leaked instance, follow its retain graph.
Suppose it shows: ProductDetailViewController -> onAddedToCart closure
-> (captures self) -> back to ProductDetailViewController. Exactly
Section 6's cycle shape.

THE FIX — same pattern as Section 6, applied at the actual call site:
class ProductDetailViewController: UIViewController {
    var onAddedToCart: (() -> Void)?
    func setupCartButton() {
        onAddedToCart = { [weak self] in
            self?.showAddedToCartToast()
        }
    }
}
```

**The general method, restated for iOS specifically:** a vague "feels sluggish over time" report becomes a specific diagnosis by (1) finding the repeatable action that should leave no trace (closing a screen), (2) confirming via a before/after comparison that something persists anyway, and (3) reading the retain graph from the surviving instance outward until you find the cycle — the same three-step shape as Android's heap-dump diagnosis in [Ch10's Section 8](03_Android/10_Performance_Memory_And_ANR_Profiling.md#8-diagnosing-a-real-leak-from-a-heap-dump), expressed through Apple's tooling instead of Android's.

---

## 10. Common Mistakes and Their Symptoms

### Mistake 1: Profiling a Debug Build and Trusting the Absolute Numbers

```
SYMPTOM: Time Profiler shows a function taking much longer than users
         actually experience; the app "feels" faster on a real device
         than the profiled numbers suggest it should.
CAUSE:   Debug builds skip whole-module optimization and compile with
         debug-level Swift optimization settings — the same
         debug-vs-release trap as [Android Ch10's Mistake 3](03_Android/10_Performance_Memory_And_ANR_Profiling.md#mistake-3-profiling-a-debug-build-and-trusting-the-numbers).
FIX:     Profile a Release-configuration build (or a build with
         Swift's release optimization level) for numbers you intend
         to compare against a target — a Debug build is fine for
         RELATIVE before/after comparisons, not absolute ones.
```

### Mistake 2: Treating "Leaks Found Nothing" as "No Leaks Exist"

```
SYMPTOM: The Leaks instrument reports zero leaks, but the Allocations
         generation comparison (Section 4) clearly shows objects
         persisting that shouldn't.
CAUSE:   Per Section 5's own distinction, Leaks specifically finds
         unreachable cycles/orphans — an object kept alive because it
         was added to some long-lived array or cache and never removed
         is technically still REACHABLE, so Leaks correctly reports
         "not a leak" by its narrow definition, even though it's the
         same functional bug (memory that should be freed, isn't).
FIX:     Don't treat a clean Leaks run as proof of no memory problems —
         run the Allocations generation comparison too; they catch
         genuinely different shapes of the same underlying issue.
```

### Mistake 3: Confusing a Watchdog Termination With an Ordinary Crash

```
SYMPTOM: A crash report shows exception code 0x8badf00d with no stack
         frames pointing into the app's own code at all; the team
         treats it as unactionable ("no stack trace, nothing we can do").
CAUSE:   A watchdog termination's crash report shows what the OS was
         doing (killing the process), not what YOUR code was doing —
         because the point of the timeout is that your code never got
         a chance to finish. The actionable data is which LIFECYCLE
         TRANSITION was in progress (launch/resume/background-exit,
         Section 2) and how long it typically takes, not a stack trace.
FIX:     Check launch-time or background-task-duration metrics (via
         MetricKit or the Organizer) for the affected version — a
         spike in 0x8badf00d terminations correlating with a recent
         change to app-launch or background-task code is the real signal,
         not the individual crash report's missing stack trace.
```

---

## 11. Interview Q&A

**Q: "What's iOS's equivalent of an Android ANR?"**

> "iOS has watchdog terminations, tracked with exception code 0x8badf00d — informally 'ate bad food.' The mechanism is similar to Android's: specific lifecycle transitions have a time budget, and if the main thread doesn't complete that transition in time, the OS kills the process. The budgets differ by transition — around 20 seconds for process launch, around 5 seconds for process exit, and around 30 seconds for a background resume window, with background task expiration handlers getting only a few seconds once invoked. Unlike Android's ANR, there's no user-facing 'wait or close' dialog — the process is just terminated, which is why the crash report shows the OS's exception code rather than a stack trace into your own code."

**Q: "How is Hang Rate different from a watchdog termination?"**

> "Hang Rate is a softer, ongoing UX metric, not a kill. iOS counts any period where the main thread is unresponsive for at least 250 milliseconds as a hang, and Xcode's Organizer aggregates this across real users, reporting both the median hang rate and the 90th-percentile rate. A watchdog termination is binary and rare — you crossed a specific timeout during a specific transition. A high hang rate can exist with zero watchdog terminations at all — it just means users are experiencing a lot of brief unresponsiveness that never gets anywhere close to the kill threshold, which is exactly why you'd track both metrics rather than assuming a good crash-free rate means the app feels responsive."

**Q: "Why would the Leaks instrument report no leaks in an app that's clearly using more and more memory?"**

> "Leaks specifically detects objects that are unreachable from any root but still retained — the classic retain-cycle shape. It won't flag an object that's technically still reachable, like one that got appended to a static array or a cache and was never removed — that object is 'leaked' in the everyday sense of the word, but not in Leaks' narrower definition, since something can genuinely still reach it. That's why the Allocations instrument's generation-comparison technique matters as a separate check: it doesn't care about reachability semantics at all, it just asks 'did the count of this object type go back down after the action that should have freed them,' which catches this exact case Leaks is structurally unable to."

---

**Back to**: [03_iOS_Native_Dev_And_Testing.md](03_iOS_Native_Dev_And_Testing.md) | [Series index / CONTEXT.md](CONTEXT.md)

---

## Reality Check

**"Instruments is one tool for finding one kind of problem"** — Instruments is a SUITE of separate, narrowly-scoped tools, each answering a different question ([Section 3](#3-instruments--time-profiler), [4](#4-instruments--allocations), [5](#5-instruments--leaks-and-the-memory-graph-debugger)): Time Profiler (where is CPU time going, on which thread — a sampling tool, not exhaustive), Allocations (is memory growing, and specifically what's not being freed — via the generation-comparison technique), and Leaks (a narrower reachability-cycle detector, per [Mistake 2](#mistake-2-treating-leaks-found-nothing-as-no-leaks-exist), that can report clean while real memory problems exist). "One tool" undersells that picking the WRONG one first — running Leaks when the real problem needs an Allocations generation comparison — wastes a debugging session on a tool that was never going to catch that shape of bug.

**"A watchdog termination and a crash are the same kind of problem"** — A watchdog termination is a TIMEOUT enforced by the OS, not an exception your code threw ([Section 2](#2-ioss-anr-equivalent--watchdog-terminations-and-hang-rate), [Mistake 3](#mistake-3-confusing-a-watchdog-termination-with-an-ordinary-crash)): the specific lifecycle-transition budgets (~20s launch, ~5s exit, ~30s background resume — verified current numbers, not folklore), the 0x8badf00d exception code that shows the OS killed the process rather than your code crashing it, and the diagnostic approach that follows (correlate against launch/background-task duration metrics, not a stack trace that was never going to exist). "Same kind of problem" leads teams to dismiss watchdog terminations as unactionable "crashes with no stack trace," when the actionable signal (which transition, how long it's taking across your real user base) is available through entirely different tooling (MetricKit, the Organizer) than a normal crash reporter.

**"Hang Rate only matters for really broken, unusably slow apps"** — Hang Rate catches BRIEF unresponsiveness (≥250ms) that never approaches a watchdog termination at all ([Section 2](#2-ioss-anr-equivalent--watchdog-terminations-and-hang-rate)): the median-versus-90th-percentile distinction the Organizer reports (a fine median can hide a real tail problem on older devices or specific screens), and the fact that a hang is fundamentally a UX metric, not a stability metric — an app with a perfect crash-free rate can still have a high hang rate, and users notice stutters and freezes long before anything crashes. "Only matters for broken apps" misses that Hang Rate is specifically designed to surface the *far more common* case: an app that never crashes but doesn't feel smooth, which a crash-free-rate dashboard alone would never reveal.

**"A retain cycle always shows up as a leak the tooling catches automatically"** — Leaks (Instruments) catches the CYCLE shape specifically; a reachable-but-shouldn't-be object slips past it entirely ([Section 5](#5-instruments--leaks-and-the-memory-graph-debugger), [Mistake 2](#mistake-2-treating-leaks-found-nothing-as-no-leaks-exist)): the narrow definition Leaks actually uses (unreachable from any root, via a cycle), versus the everyday meaning of "leak" (should have been freed, wasn't, for ANY reason) that also includes objects sitting in a cache or array nobody cleaned up. "Automatically caught" gives false confidence — a clean Leaks run is evidence against ONE specific bug shape, not proof the app has no memory problems, which is exactly why the Allocations generation-comparison technique in [Section 4](#4-instruments--allocations) exists as a separate, necessary check.

**"Jetsam and watchdog terminations are the same mechanism with different names"** — They're triggered by entirely different conditions ([Section 7](#7-jetsam--when-the-os-kills-you-for-using-too-much-memory)): watchdog terminations fire on a TIME budget being exceeded during a specific lifecycle transition, regardless of memory usage, while Jetsam fires on system-wide MEMORY PRESSURE, regardless of how fast your app's code runs — a perfectly fast app that happens to need a lot of memory at the wrong moment, on a device the whole system is straining, can be Jetsam-killed with zero watchdog involvement at all. "Same mechanism" would lead you to look for a timing bug when the actual fix (Section 7's `didReceiveMemoryWarning()` response, proactively releasing recreatable caches) has nothing to do with speed at all.
