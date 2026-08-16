# Mobile Debugging Toolkit Challenges

### Companion to [DOC_09: Mobile Debugging & Troubleshooting Toolkit](DOC_09_Mobile_Debugging_Toolkit.md)

---

## How This Works

These test the triage instinct this doc is actually about — given a symptom, do you reach for the right tool first, or burn twenty minutes in the wrong one? Mixed formats — see [the full challenge-type roster](../00_CHALLENGE_TYPES.md) for what each icon means.

---

### 🐛 Bug Hunt — The Appium Test That Fails Only Sometimes

```java
List<WebElement> items = driver.findElements(AppiumBy.className("android.widget.TextView"));
WebElement thirdItem = items.get(2);

// Simulated network delay causes the list to refresh right about here
Thread.sleep(500);

thirdItem.click(); // fails intermittently with StaleElementReferenceException
```

This test passes about half the time and fails the other half with `StaleElementReferenceException`, with no code change between runs. Diagnose it using [this doc's own content](DOC_09_Mobile_Debugging_Toolkit.md#3-staleelementreferenceexception) before opening the answer.

<details><summary>Diagnosis & Fix</summary>

🔴 **Explanation:** `thirdItem` is located **before** the `Thread.sleep(500)`, and if the list happens to refresh during that sleep (a real background data update — the comment says as much), the underlying UI tree changes and the cached `WebElement` reference goes stale, exactly [this doc's `StaleElementReferenceException` section](DOC_09_Mobile_Debugging_Toolkit.md#3-staleelementreferenceexception) describes. The intermittency is the tell: if the refresh always happened, the test would fail every time; if it never happened, it'd pass every time — "sometimes" means the refresh's timing is racing against the test's own timing, which is the signature of a stale-reference bug, not a wrong-locator bug (a wrong locator fails consistently, every run). Fix: re-locate immediately before the interaction, not before an arbitrary wait:

```java
Thread.sleep(500);
WebElement thirdItem = driver.findElements(AppiumBy.className("android.widget.TextView")).get(2);
thirdItem.click(); // located fresh, right before use — no stale window
```

</details>

---

### 🎭 Two Truths and a Lie — Logcat and Trace Viewer

**A.** `adb logcat *:E` filters to error-and-above priority across every process on the device, not just your app — you may still need a package/tag filter on top of it.

**B.** Playwright's Trace Viewer requires the test to still be running (or the browser to still be open) to inspect what happened — it cannot be opened after the fact from a saved file.

**C.** In a Java stack trace from `adb logcat`, the fix usually belongs at the first stack frame that's inside your own app's package — not necessarily the very first line of the trace.

<details><summary>Which one's the lie</summary>

**B is the lie.** The entire point of Trace Viewer, per [this doc's own content](DOC_09_Mobile_Debugging_Toolkit.md#playwright-debugging--the-real-toolchain) and Playwright's own docs, is that it works from a **saved `.zip` file** — `npx playwright show-trace trace.zip`, completely offline, with no live browser or running test required at all. This is specifically what makes it valuable for CI failures: the CI run is long gone by the time a human looks at the failure, and the trace file is what survives that gap.

🔴 **Explanation:** A and C are both true and both matter in practice — A is why `-c` (clear the buffer) plus a package-specific filter (`-s flutter`, or `--pid=`) is the combination [this doc recommends](DOC_09_Mobile_Debugging_Toolkit.md#adb-logcat--reading-it-for-real) rather than priority filtering alone, since `*:E` on a real device still shows errors from every other app and system process running. C is the actual reading skill this doc teaches — the top of a stack trace is where the crash was *detected*, but the fix lives wherever your own code's frame appears, which is often several frames down.

</details>

---

### 🏗️ Build It Blind — Triage Four Vague Bug Reports

No code. For each report, name the **first** tool you'd open, using [this doc's triage table](DOC_09_Mobile_Debugging_Toolkit.md#the-triage-table--symptom-to-tool) — and justify it in one sentence.

1. "The app just closes itself sometimes when I open the camera screen."
2. "Our nightly Playwright suite has three tests that fail about once a week, always different tests, never locally."
3. "The product list scrolls fine but feels 'sticky' — like it's skipping frames — only on our oldest test device."
4. "I can't even get Appium Inspector to show me the app's UI tree at all today."

<details><summary>Reasoning</summary>

1. **`adb logcat`** — "closes itself" is a crash, and a crash's ground truth is always the stack trace; guessing at the cause without reading it first wastes time.
2. **Trace Viewer**, specifically enabling `trace: 'on-first-retry'` if it isn't already — "always different tests, never locally" is the classic signature of environment-specific flakiness that's nearly impossible to diagnose by staring at code; you need the recorded DOM/network/timing state from the actual failing run, not a guess based on re-running locally where the failure won't reproduce.
3. **Flutter DevTools Performance tab** — "feels sticky," frame-skipping, and specifically worse on older hardware is squarely a rendering-performance question, not a logic or connection question; `adb logcat` won't show you *why* a frame took too long, DevTools will.
4. **`adb devices`** first — per [this doc's own triage table](DOC_09_Mobile_Debugging_Toolkit.md#the-triage-table--symptom-to-tool) and [DOC_07's identical rule](DOC_07_ADB_and_Dev_Tooling.md#quick-reference--when-somethings-broken), a tool failing to connect at all is very often an ADB connection problem wearing a different UI, not a problem with the tool itself.

🔴 **Explanation:** notice none of these four reports mention a tool name or even hint at the cause — that's deliberate. Real bug reports from users or teammates almost never come pre-labeled with which layer they belong to; matching a vague symptom to the right first tool, fast, is the actual skill this whole doc trains.

</details>

---

### 👹 Boss Battle — Diagnose the Hybrid App Bug, Step by Step

**The spec:** using [this doc's own hybrid-app diagnostic flowchart](DOC_09_Mobile_Debugging_Toolkit.md#the-hybrid-app-case--when-you-need-all-of-it-at-once), write out your actual investigation plan — in order, with a stopping condition at each step — for this bug report against a Capacitor app: *"Users say the 'Confirm Purchase' button sometimes does nothing when tapped. It's not consistent, and no one's been able to reproduce it on demand."*

Don't just name the three possible causes — write the **order** you'd check them in, and what specific signal at each step would tell you to stop and which branch to follow.

<details><summary>One reasonable investigation plan</summary>

**Step 1 — Reproduce with both `adb logcat` and a WebView console connection open simultaneously**, since neither tool alone tells you which layer the bug is in, and the report gives no hint. Clear the logcat buffer first (`adb logcat -c`) to cut noise.

**Step 2 — Tap the button repeatedly until it reproduces**, watching both streams live. Three possible signals, in the order they'd most likely appear if present:
  - **A native permission dialog or system overlay event appears in `logcat` right before the failed tap** → native shell is silently intercepting the tap. Stop here; this is an `adb logcat`/native-code investigation from this point, following [this doc's Native branch](DOC_09_Mobile_Debugging_Toolkit.md#the-hybrid-app-case--when-you-need-all-of-it-at-once).
  - **A JavaScript error appears in the WebView console at the moment of the failed tap** → the click handler itself is throwing. Stop here; open [DOC_05's `device.webView()` connection](../../05_Mobile_Web_And_Hybrid_Playwright.md#real-world-problem--i-built-this-in-capacitorionic-can-playwright-test-it) and inspect the actual handler code around that error.
  - **Neither stream shows anything unusual, but the button visually doesn't respond** → likely a timing/race condition — check whether the button's `disabled`/`enabled` state depends on an async call (an inventory check, a payment-method validation) that hasn't resolved yet, making the tap land on a disabled element that silently does nothing.

**Step 3 — Once you have a candidate cause, try to make it happen on demand** — e.g., if you suspect the async race, artificially slow down the dependent API call (via Playwright's `page.route()` if you can reach it, or a debug build with an injected delay) and confirm the bug now reproduces reliably. A candidate cause you can't turn into a reliable repro is still a guess, not a diagnosis.

🔴 **Explanation:** the actual point of writing this out as an ordered plan, not just a list of possibilities, is that real debugging sessions waste the most time when you investigate causes in a scattershot order instead of running the cheapest, most-likely-to-immediately-disambiguate check first. Having both streams open *simultaneously* from the start (rather than checking one tool, ruling it out, then switching to the next) is what turns three separate investigation sessions into one.

</details>

---

**Reference library complete — nine docs, nine challenge companions.** From here, the honest next step isn't reading a tenth doc — it's picking a real bug in a real project and watching which of these tools you reach for first.
