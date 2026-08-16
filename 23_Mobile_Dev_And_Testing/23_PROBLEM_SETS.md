# 📝 Mobile Dev & Testing — Problem Sets

## `23_Mobile_Dev_And_Testing` Module | Native, Cross-Platform, Appium

> **How to use:** All answers use `<details>` blocks. Read 🔴 **Erklärung** if you are stuck.

---

## Problem Set MOBILE-PS1 — iOS & Android Native Core

**Prerequisites:** `23_Mobile_Dev_And_Testing/03_iOS_Native_Dev_And_Testing.md`, `23_Mobile_Dev_And_Testing/02_Android_Native_Dev_And_Testing.md`

---

### Part A: Theoretical

**A1 (Easy).** In Android, what is the difference between `Activity`, `Fragment`, and `ViewModel`?

<details><summary>Answer</summary>

- **Activity:** The entry point and container representing a single screen or window in the Android OS. Heavyweight lifecycle (onCreate, onStart, onResume).
- **Fragment:** A reusable portion of UI within an Activity. You can have multiple Fragments in one Activity (e.g., tablet split-screen). Managed by `FragmentManager`.
- **ViewModel:** A class that stores and manages UI-related data in a lifecycle-conscious way. Survives configuration changes (like screen rotations) whereas Activities/Fragments are destroyed and recreated.

🔴 **Erklärung:** Beginner mistake: storing data like `counter = 5` inside an `Activity`. When the user rotates their phone, the Activity is killed and recreated, and `counter` resets to 0. Always store state in the `ViewModel`.

</details>

---

**A2 (Medium).** Explain the iOS App Lifecycle. What happens when an app transitions from Foreground to Background?

<details><summary>Answer</summary>

**iOS App Lifecycle states:**

1. **Not Running:** App is terminated.
2. **Inactive:** Foreground, but not receiving events (e.g., incoming call).
3. **Active:** Foreground and receiving events.
4. **Background:** Not visible, executing code in the background (briefly).
5. **Suspended:** In memory, but no code is executing.

**Transition Active → Background:**

- `applicationWillResignActive` (Active → Inactive)
- `applicationDidEnterBackground` (Inactive → Background)
- You have ~3-5 seconds to save user data, release shared resources, and store state before the app is **Suspended**.

🔴 **Erklärung:** Failing to save state in `applicationDidEnterBackground` leads to data loss if the OS terminates your app while it is Suspended (to free up memory for a heavy game the user just opened).

</details>

---

### Part B: Design Challenge

**B1.** Design a cross-platform data synchronization strategy for a mobile note-taking app that works fully offline.

<details><summary>Answer</summary>

**Architecture: Local-First Strategy**

1. **Local Storage (Source of Truth):** SQLite (Room on Android, CoreData on iOS) or realm. Every read/write hits the local DB instantly.
2. **Sync Queue:** An append-only local table tracking changes (`id, action[INSERT/UPDATE/DELETE], entity_id, timestamp, status[PENDING]`).
3. **Background Sync Worker:**
   - On Android: `WorkManager` (respects Doze mode/battery).
   - On iOS: `BGTaskScheduler`.
4. **Conflict Resolution (Server-side):** Last-Write-Wins (LWW) using vector clocks or CRDTs (Conflict-free Replicated Data Types) if collaborative.

🔴 **Erklärung:** The anti-pattern is writing directly to the network and updating the UI _after_ the HTTP response. This causes spinners and fails when offline. Write locally first, update UI instantly (Optimistic UI), and sync in the background.

</details>

---

## Problem Set MOBILE-PS2 — Cross-Platform (Flutter) & Appium

**Prerequisites:** `23_Mobile_Dev_And_Testing/04_Flutter_Dev_And_Testing.md`, `23_Mobile_Dev_And_Testing/01_Playwright_vs_Appium_Full_Comparison.md`

---

### Part A: Theoretical

**A1 (Medium).** How does Flutter's rendering pipeline differ from React Native's?

<details><summary>Answer</summary>

- **React Native:** Uses the OEM (Original Equipment Manufacturer) native widgets. The JS thread communicates with the Native thread over a Bridge (or JSI) to tell iOS/Android to draw native `UIButton` or `android.widget.Button`.
- **Flutter:** Does NOT use native OEM widgets. Flutter uses its own 2D rendering engine (Skia/Impeller) to draw pixels directly to the canvas provided by the OS. It bypasses the platform's UI toolkit entirely.

🔴 **Erklärung:** This is why Flutter apps look identical on iOS and Android out of the box, while React Native apps look like native iOS/Android apps. It also explains why Flutter avoids the JS-to-Native bridge bottleneck.

</details>

---

**A2 (Hard).** You are writing an Appium test for a login screen. The button has the text "Login". Why is `driver.findElement(By.xpath("//*[@text='Login']"))` considered a bad practice, and what should you use instead?

<details><summary>Answer</summary>

**Why XPath by text is bad:**

1. **Performance:** Appium translates XPath into complex UIAutomator/XCUITest tree traversals, which are extremely slow (can take 1-3 seconds per element).
2. **Localization:** Fails immediately if the app language changes to Spanish ("Iniciar sesión").
3. **Fragility:** Fails if the text changes slightly (e.g., "Log In").

**Best Practice:**
Use Accessibility IDs (which map to `contentDescription` on Android and `accessibilityIdentifier` on iOS).

- App code: `button.contentDescription = "login_submit_btn"`
- Appium: `driver.findElement(MobileBy.AccessibilityId("login_submit_btn"))`

🔴 **Erklärung:** Using Accessibility IDs is O(1) for the testing framework and completely immune to localization and UI redesigns.

</details>

---

[← Back to Semester 4 Guide](../00_CURRICULUM/SEMESTER_4_GUIDE.md)


---

## Reality Check

**"Mobile problem sets are about building app features"** — The transferable skills concentrate in the mobile-SPECIFIC hard parts feature-building glosses over: the lifecycle-and-state-restoration ([Android/02] — the app killed and restored, the rotation, the process death), the async-and-concurrency on mobile ([13_DE concurrency] — the coroutine/Future leaked past the screen), the platform fragmentation handling ([02] — the API-availability, the device matrix), and the mobile testing pyramid ([01, Android/07-08] — the flaky UI tests, the simulator gaps). A problem set that builds a feature on the happy path teaches widget assembly; the valuable exercises drill the lifecycle scenarios, the state restoration, the async cleanup, and the platform edges — because mobile's difficulty is exactly the lifecycle, concurrency, fragmentation, and testing challenges that feature-building on a stable device skips.

**"Once the app works on my device, the exercise is done"** — Mobile "works on my device" is the weakest possible bar ([02]'s fragmentation, [Ch61]'s device reality): the app that works on your flagship and crashes on a budget device (performance, memory), on a different OS version (API availability), on a foldable or tablet (layout), after backgrounding (lifecycle/state restoration), with the OS keyboard up (the [Ch61] viewport), or in a poor network. The hardening ladder mirrors [19_FE]'s: test the lifecycle scenarios (rotate, background, kill-and-restore), the device spread (small/old/budget), the interruptions (call, notification), the network conditions. "Works on my device" delegates all the mobile-specific failures to users with different devices — the exercise's real value is in the hardening against the fragmentation, lifecycle, and device-variance that "my device" never exercises.

**"Cross-platform means I only need to learn one set of problems"** — Cross-platform frameworks ([Flutter, 01 Appium]) share the app-logic problems and STILL require per-platform knowledge for the seams: the platform-specific behavior and conventions ([01]'s leak-through), the native-API access (the platform channels, the native code you still write), the platform-specific bugs (the thing that works on Android and breaks on iOS), and the per-platform testing and release ([iOS] signing/review versus [Android] fragmentation). "One set of problems" is true for the shared business logic and false at every platform seam — the cross-platform practitioner still needs enough native knowledge (both platforms' lifecycle, conventions, release processes) to handle the seams, which is why cross-platform reduces but does not eliminate the two-platform learning burden, and the problem sets should include the seam-handling, not just the shared-logic building.

**"Testing mobile apps is like the exercises for web testing"** — Mobile testing exercises must drill what web testing lacks ([01]): the app lifecycle testing (the state across background/kill/restore — no web equivalent), the device-matrix strategy (the fragmentation [02], far beyond browser matrix), the flaky-UI-test sources specific to mobile (the animations, the timing, the [21_SDET Ch26] flakiness in Espresso/XCUITest/Flutter's pump-and-settle), the emulator-versus-real-device decisions ([Ch61] mobile flavor), and the slower build-install-test loop. The [21_SDET] testing discipline transfers (the pyramid, the behavior focus, the flakiness diagnosis) and the mobile-specific layer (lifecycle, fragmentation, device strategy, the gesture and permission handling) is what the exercises must add. "Like web testing" transfers the foundation and misses the mobile-specific testing challenges that are exactly where mobile QA earns its keep.

**"Mobile problem sets stay current once learned"** — Mobile churns hard ([15_React, 25_Python]'s fast-field lesson, mobile flavor): the UI paradigms shifted (Compose replacing Android Views, SwiftUI alongside UIKit, the declarative-reactive migration [Android/04, iOS]), the languages evolved (Kotlin coroutines, Swift concurrency), the OS versions and APIs turn over yearly, and the tooling and best practices move. The FUNDAMENTALS persist (the lifecycle model, the state management, the testing pyramid, the fragmentation reality, the async discipline) while the specifics (the current UI framework, the current async idiom, the current DI tool) rotate. The maintenance strategy anchors on fundamentals and tracks the paradigm shifts (the Compose/SwiftUI migration is a big one worth following), plus the real-device incident harvest ([22_DevOps] — the "crashed only on this device/OS" that becomes a personal problem-set entry). "Stays current" is especially false in mobile given the active UI-paradigm migration — the practitioner on 2018 mobile practices (imperative Views, callback async) is a paradigm behind, and catching up on the declarative-reactive shift is the current mobile-learning imperative.
