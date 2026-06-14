# Android — Architecture and App Model

**Folder**: [03_Android](./) | **Series**: [23_Mobile_Dev_And_Testing](../)

**Files in this folder**:

1. **01_Architecture_And_App_Model.md** ← you are here
2. [02_Activity_Fragment_Lifecycle.md](./02_Activity_Fragment_Lifecycle.md)
3. [03_ViewModel_StateFlow_LiveData.md](./03_ViewModel_StateFlow_LiveData.md)
4. [04_Jetpack_Compose_Deep_Dive.md](./04_Jetpack_Compose_Deep_Dive.md)
5. [05_Room_Database_And_DataStore.md](./05_Room_Database_And_DataStore.md)
6. [06_Networking_Retrofit_OkHttp.md](./06_Networking_Retrofit_OkHttp.md)
7. [07_Unit_Tests_JUnit_Mockito.md](./07_Unit_Tests_JUnit_Mockito.md)
8. [08_UI_Tests_Espresso.md](./08_UI_Tests_Espresso.md)
9. [09_E2E_Tests_Appium_UIAutomator2.md](./09_E2E_Tests_Appium_UIAutomator2.md)

> **Reading contract**: This file teaches you what an Android app IS from the ground up — before any code. Understanding the runtime, the package structure, the app components, the build system, and Android version fragmentation is the foundation for everything that follows. Every lifecycle, testing, and debugging concept makes more sense once you have this mental model.

---

## Table of Contents

1. [How Android Runs Your Code — The Runtime](#1-how-android-runs-your-code--the-runtime)
2. [What Is an APK? Inside the Package](#2-what-is-an-apk-inside-the-package)
3. [AndroidManifest.xml — The Most Important File](#3-androidmanifestxml--the-most-important-file)
4. [The Four App Components](#4-the-four-app-components)
5. [The Application Class — App-Level Singleton](#5-the-application-class--app-level-singleton)
6. [The Gradle Build System](#6-the-gradle-build-system)
7. [Build Variants — Debug vs Release vs Staging](#7-build-variants--debug-vs-release-vs-staging)
8. [Android Version Fragmentation — Why QA Cares](#8-android-version-fragmentation--why-qa-cares)
9. [App Signing and Distribution](#9-app-signing-and-distribution)
10. [The Android Architecture Stack](#10-the-android-architecture-stack)
11. [Recommended App Architecture — MVVM with Clean Architecture](#11-recommended-app-architecture--mvvm-with-clean-architecture)
12. [How Data Flows Through the Architecture](#12-how-data-flows-through-the-architecture)
13. [Interview Questions on Android Architecture](#13-interview-questions-on-android-architecture)

---

## 1. How Android Runs Your Code — The Runtime

### Before: Dalvik (Android 2.x–4.3)

Early Android used the **Dalvik Virtual Machine (DVM)**. Code was compiled to `.dex` (Dalvik Executable) files and interpreted at runtime — similar to how the JVM works but optimized for low-memory mobile devices.

**Problem**: Interpretation is slow. Every method was compiled to native code at first use (JIT — Just-In-Time). Users felt the lag.

### Now: ART — Android Runtime (Android 5.0+)

ART replaced Dalvik. It uses **AOT (Ahead-Of-Time) compilation** — the entire app is compiled to native ARM machine code when the app is installed:

```
YOUR SOURCE CODE:
  Kotlin/Java source (.kt / .java)
         │
         ▼  kotlinc / javac
  JVM Bytecode (.class files)
         │
         ▼  D8 compiler (Google's tool)
  DEX Bytecode (.dex files)  ← inside the APK
         │
         ▼  ART (at install time on device)
  Native ARM machine code  ← what actually runs on the CPU
```

**Why this matters for QA**:

- Apps compiled for debug have extra safety checks, unobfuscated code, and debug symbols — easier to understand crashes
- Apps compiled for release are obfuscated (ProGuard/R8), AOT-compiled, and stripped — they behave differently and crash differently
- A bug in a debug build does NOT always reproduce in a release build, and vice versa
- Always test the release build before shipping, not just the debug build

### ART vs iOS Compilation

```
Android ART:                        iOS:
  .kt/.java → .dex (in APK)          .swift → LLVM IR → native ARM (in IPA)
  AOT compiled at install time        AOT compiled at build time (Xcode)
  Can update without full recompile   Any change requires full recompile + resign
  Google Play can patch bytecode      Apple App Store: no patching allowed
```

---

## 2. What Is an APK? Inside the Package

An APK (Android Package) is a **ZIP file** with a specific structure. You can rename any `.apk` to `.zip` and open it:

```
MyApp.apk (ZIP archive)
│
├── AndroidManifest.xml       ← Compiled (binary XML) — the app's declaration
│
├── classes.dex               ← Your compiled Kotlin/Java code (DEX bytecode)
├── classes2.dex              ← Overflow DEX (if method count > 65,536 — "multidex")
│
├── res/                      ← Compiled resources
│   ├── layout/               ← XML layouts compiled to binary
│   ├── drawable-xxhdpi/      ← Images for high-density screens
│   ├── drawable-xxxhdpi/     ← Images for very-high-density screens (flagship phones)
│   └── values/               ← strings.xml, colors.xml, dimens.xml (compiled)
│
├── assets/                   ← Raw files: fonts, JSON, audio — NOT compiled
│
├── lib/                      ← Native libraries (.so files) per CPU architecture
│   ├── arm64-v8a/            ← 64-bit ARM (modern phones — required since 2019)
│   ├── armeabi-v7a/          ← 32-bit ARM (older phones)
│   └── x86_64/               ← Emulators
│
├── META-INF/                 ← APK signature (RSA signature + certificate)
│   ├── CERT.RSA
│   └── MANIFEST.MF
│
└── resources.arsc            ← Resource table mapping (id → actual resource)
```

### AAB vs APK — The Modern Distribution Format

Since 2021, Google Play requires **AAB (Android App Bundle)** instead of APK for new apps.

```
APK (old):                          AAB (new):
Single file, contains everything    NOT directly installable
Installed as-is on every device     Google Play splits it and builds
                                    a device-specific APK:
                                    ┌─────────────────────────────┐
                                    │ Phone: arm64-v8a + xxhdpi   │
                                    │ Tablet: arm64-v8a + xhdpi   │
                                    │ Old phone: armeabi-v7a      │
                                    └─────────────────────────────┘
                                    Each device downloads ONLY what it needs
                                    → smaller download size (20-60% smaller)
```

**For testing**: You install APKs on test devices (debug builds). AAB is for production distribution through Play Store. Appium uses APK files.

---

## 3. AndroidManifest.xml — The Most Important File

The manifest is the app's **declaration to the Android operating system**. The OS reads it before launching your app. It defines:

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest
    xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.mycompany.myapp"
    android:versionCode="42"
    android:versionName="2.4.1">
    <!--
        package: The unique identifier — like a Java package name.
                 This is what Appium uses as bundleId equivalent.
                 com.mycompany.myapp.debug  → debug build
                 com.mycompany.myapp        → production build
                 They can COEXIST on the same device (different package names)

        versionCode: Integer. Must increment with every release.
                     Used by Play Store to determine if an update exists.

        versionName: Human-readable. "2.4.1" shown to users.
    -->

    <!-- ═══════════════════════════════════════════════════════════════ -->
    <!--  PERMISSIONS — what OS features the app can use               -->
    <!-- ═══════════════════════════════════════════════════════════════ -->
    <uses-permission android:name="android.permission.INTERNET" />
    <!-- INTERNET is granted automatically — no runtime prompt needed  -->

    <uses-permission android:name="android.permission.CAMERA" />
    <!-- Camera is DANGEROUS → user must grant it at runtime            -->
    <!-- Declaring it here does NOT mean it's granted yet               -->

    <uses-permission android:name="android.permission.USE_BIOMETRIC" />
    <!-- Biometric — granted automatically if hardware exists          -->

    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <!-- Android 13+ (API 33): user must explicitly grant this         -->

    <!-- ═══════════════════════════════════════════════════════════════ -->
    <!--  APPLICATION block — app-level settings                        -->
    <!-- ═══════════════════════════════════════════════════════════════ -->
    <application
        android:name=".MyApplication"
        android:label="@string/app_name"
        android:icon="@mipmap/ic_launcher"
        android:theme="@style/AppTheme"
        android:allowBackup="true"
        android:networkSecurityConfig="@xml/network_security_config"
        android:usesCleartextTraffic="false">
        <!--
            android:name: Points to your custom Application class (see section 5)
            android:networkSecurityConfig: Defines which domains are trusted
                (important for certificate pinning in security testing)
            android:usesCleartextTraffic="false": Forces HTTPS (no HTTP allowed)
                If true on production → SECURITY BUG (data transmitted in plaintext)
        -->

        <!-- ─────────────────────────────────────────────────────── -->
        <!--  ACTIVITY — each screen that can be launched            -->
        <!-- ─────────────────────────────────────────────────────── -->
        <activity
            android:name=".presentation.login.LoginActivity"
            android:exported="true"
            android:screenOrientation="portrait"
            android:windowSoftInputMode="adjustResize">
            <!--
                android:exported="true": Can OTHER apps launch this Activity?
                    The launcher icon requires exported="true" on the MAIN activity.
                    Other activities should be exported="false" for security.

                android:screenOrientation: locks orientation
                    "portrait" = always portrait
                    "landscape" = always landscape
                    "unspecified" = follows device (can rotate)
                    ← QA: test rotation behavior if unspecified

                android:windowSoftInputMode:
                    "adjustResize" = screen shrinks when keyboard appears (text fields visible)
                    "adjustPan" = screen pans up when keyboard appears
                    "adjustNothing" = keyboard may cover content ← common QA find
            -->

            <!-- Intent filter: marks this as the app's entry point -->
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>

            <!-- Deep link intent filter: handles citationapp://citation/CIT-001 -->
            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data
                    android:scheme="https"
                    android:host="myapp.com"
                    android:pathPrefix="/citation" />
            </intent-filter>
        </activity>

        <activity
            android:name=".presentation.home.HomeActivity"
            android:exported="false" />
            <!-- exported="false" = only THIS app can start HomeActivity -->

        <!-- ─────────────────────────────────────────────────────── -->
        <!--  SERVICE — background work                              -->
        <!-- ─────────────────────────────────────────────────────── -->
        <service
            android:name=".service.SyncService"
            android:exported="false" />

        <!-- ─────────────────────────────────────────────────────── -->
        <!--  RECEIVER — listens for system broadcasts              -->
        <!-- ─────────────────────────────────────────────────────── -->
        <receiver
            android:name=".receiver.BootReceiver"
            android:exported="false">
            <intent-filter>
                <action android:name="android.intent.action.BOOT_COMPLETED" />
            </intent-filter>
        </receiver>

        <!-- ─────────────────────────────────────────────────────── -->
        <!--  PROVIDER — exposes data to other apps                 -->
        <!-- ─────────────────────────────────────────────────────── -->
        <provider
            android:name=".provider.CitationFileProvider"
            android:authorities="com.mycompany.myapp.fileprovider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/file_paths" />
        </provider>

    </application>
</manifest>
```

### Why the Manifest Matters for QA

```
QA CHECKLIST — AndroidManifest.xml:

□ Package name is correct for the environment
  Production: com.mycompany.myapp
  Debug:      com.mycompany.myapp.debug (different package → can coexist on device)
  Staging:    com.mycompany.myapp.staging

□ usesCleartextTraffic="false" on production builds
  (If true → HTTP allowed → security risk → QA finding)

□ Permissions declared match what the app actually uses
  (Declaring unused permissions → privacy concern → App Store rejection risk)

□ exported="false" on all Activities except the entry point
  (exported="true" on internal activities → security risk → any app can launch them)

□ Deep link patterns are correct
  (Wrong pathPrefix → push notification taps go nowhere → QA regression)

□ versionCode is incremented in each release
  (Same versionCode → Play Store won't recognize new version → update broken)

□ windowSoftInputMode is set on activities with text fields
  (If not set → keyboard may cover the input → usability bug)
```

---

### 🎯 Practice — AndroidManifest

**Question**: A QA engineer finds that in the staging build, a push notification deep link `https://myapp.com/citation/CIT-001` opens the app but lands on the home screen instead of the citation detail screen. The same deep link works correctly in production. What in the manifest should you check first?

<details><summary>Answer</summary>

Check the `<intent-filter>` for deep links in the staging build's manifest.

The most common cause: the `android:pathPrefix` in the intent filter does not match the path `/citation/CIT-001`.

**Example bug**:

```xml
<!-- Production manifest -->
<data android:pathPrefix="/citation" />   ← matches /citation/CIT-001

<!-- Staging manifest (wrong) -->
<data android:pathPrefix="/citations" />  ← does NOT match /citation/CIT-001
                                           (plural vs singular)
```

**Other things to check**:

1. `android:autoVerify="true"` — App Links (HTTPS deep links) require domain verification. Staging might not have the `.well-known/assetlinks.json` file published, so the OS falls back to opening the app at the default screen instead of the deep link destination.

2. The scheme/host combination:

```xml
<!-- Does staging use a different host? -->
android:host="staging.myapp.com"   ← the link uses myapp.com → no match
```

3. The Activity receiving the intent — ensure the `HomeActivity` or `DeepLinkHandlerActivity` reads the intent URI and extracts the citation ID correctly.

**The lesson**: Always verify that staging environment deep links are tested with the SAME domain and path structure as production. Staging-specific URL patterns are a frequent source of navigation bugs.

</details>

---

## 4. The Four App Components

Android apps are not just a single entry point. They are built from four types of components, each with its own lifecycle and purpose.

### Component 1: Activity — The Screen

An Activity hosts one screen. It is the primary entry point for user interaction.

```kotlin
// Every screen is either an Activity or a destination inside an Activity
class LoginActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_login)  // or setContent {} for Compose
    }
}
```

```
Key properties:
- Has its own lifecycle (onCreate → onResume → onPause → onDestroy)
- Has its own task stack (back button pops Activities)
- Can receive data via Intent extras
- Can be launched from other apps (if exported=true)
- Modern apps often have ONE Activity and multiple Fragments/Composables
```

### Component 2: Fragment — A Reusable UI Piece

A Fragment is a modular UI section that runs inside an Activity. Modern apps use the **Single Activity Architecture** — one Activity hosts all screens via Fragments or Jetpack Compose.

```
BEFORE (Multi-Activity):             AFTER (Single Activity + Fragments):
LoginActivity                        MainActivity (ONE Activity)
    │                                    │
HomeActivity                          NavHost (Jetpack Navigation)
    │                                    ├── LoginFragment
PaymentActivity                          ├── HomeFragment
    │                                    ├── PaymentFragment
ProfileActivity                          └── ProfileFragment

Back button: destroys Activity        Back button: pops Fragment from back stack
Data passing: Intent extras           Data passing: ViewModel (shared), arguments
```

### Component 3: Service — Background Work

A Service runs in the background without a UI. Used for:

- Long-running operations (music playback, file download)
- Periodic sync (upload citation data while app is backgrounded)
- WorkManager handles most modern background work (replaces Services for many cases)

```kotlin
// Foreground Service — runs with a notification (user knows it's running)
class SyncService : Service() {
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // Show a notification (required for foreground services)
        startForeground(NOTIFICATION_ID, buildNotification())
        // Do work
        syncData()
        return START_STICKY  // restart if killed by OS
    }
}
```

**Why QA cares**: Services are a common source of battery drain bugs. If a Service is not properly stopped when its work is done, it keeps running, consuming CPU and battery.

### Component 4: BroadcastReceiver — Listen for System Events

A BroadcastReceiver reacts to system-wide events — device booted, network changed, battery low, or custom app events.

```kotlin
// Triggered when device connectivity changes
class NetworkChangeReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val isConnected = isNetworkAvailable(context)
        if (isConnected) {
            // Trigger data sync
            WorkManager.getInstance(context).enqueue(SyncWorker.buildRequest())
        }
    }
}
```

**Why QA cares**: Many offline/online sync bugs trace back to BroadcastReceivers not firing correctly, or firing when they shouldn't (battery saver mode, Doze mode).

---

### 🎯 Practice — App Components

**Question**: A user opens your app, starts a music playlist, then switches to another app. The music should continue playing. Thirty seconds later, the OS kills your app to free memory. What component handles the music, and what happens to it when the app is killed?

<details><summary>Answer</summary>

Music playback runs in a **Foreground Service**. Here is what happens when the OS kills the app:

**If the music service is a FOREGROUND Service** (correct implementation):

- Shows a notification (e.g., "Now Playing: Song Title")
- The OS treats it as user-visible → much lower chance of being killed
- If killed anyway (extreme low memory), it restarts automatically if `START_STICKY` is returned from `onStartCommand`
- Music continues even after the hosting Activity is destroyed

**If the music service is a BACKGROUND Service** (wrong implementation):

- No notification
- Android 8.0+ does NOT allow background services to run indefinitely
- The OS kills it within minutes
- Music stops unexpectedly → user-reported bug

**QA test for this**:

1. Start music playback
2. Switch to another app
3. Open Memory Manager and force-kill the app (not the service, the full app)
4. Expected: Music continues playing + notification persists
5. After ~2 minutes: Music still playing (restart worked via START_STICKY)

**What `onStartCommand` return values mean**:

- `START_STICKY`: Service is restarted after being killed (null intent)
- `START_NOT_STICKY`: Service is NOT restarted (for one-time tasks)
- `START_REDELIVER_INTENT`: Service is restarted with the original intent (file downloads)

</details>

---

## 5. The Application Class — App-Level Singleton

The `Application` class is instantiated once when the process starts and lives until the process is killed. It is the single place for app-level initialization.

```kotlin
class MyApplication : Application() {

    override fun onCreate() {
        super.onCreate()
        // This runs ONCE when the app process starts
        // Order matters — dependencies must be initialized before their dependents

        // 1. Crash reporting — FIRST, so we catch crashes in other initializations
        FirebaseCrashlytics.getInstance().setCrashlyticsCollectionEnabled(!BuildConfig.DEBUG)

        // 2. Logging — second
        if (BuildConfig.DEBUG) {
            Timber.plant(Timber.DebugTree())
        } else {
            Timber.plant(CrashReportingTree())
        }

        // 3. Dependency injection framework
        // Hilt is initialized automatically via @HiltAndroidApp annotation
        // But if using manual DI:
        DependencyContainer.initialize(this)

        // 4. Analytics
        AnalyticsManager.initialize(this, BuildConfig.ANALYTICS_KEY)

        // 5. Push notifications channel registration (Android 8+)
        NotificationChannelManager.createChannels(this)
    }

    override fun onTrimMemory(level: Int) {
        super.onTrimMemory(level)
        // OS is asking us to free memory
        // level indicates urgency:
        // TRIM_MEMORY_UI_HIDDEN: app is not visible — good time to free UI caches
        // TRIM_MEMORY_RUNNING_LOW: system is running low
        // TRIM_MEMORY_COMPLETE: system is about to kill the process
        if (level >= ComponentCallbacks2.TRIM_MEMORY_UI_HIDDEN) {
            imageCache.evictAll()
        }
    }
}
```

```xml
<!-- Register in AndroidManifest.xml -->
<application
    android:name=".MyApplication"
    ...>
```

**Why QA cares**: If initialization in `Application.onCreate()` takes too long, the app appears to hang on launch. This is measured as "cold start time". On modern devices it should be under 500ms. If it's over 1 second, something in `onCreate()` is doing too much work.

---

## 6. The Gradle Build System

Gradle is Android's build tool. It compiles code, manages dependencies, and produces the APK/AAB.

```
PROJECT STRUCTURE:
MyApp/
├── build.gradle.kts           ← Project-level: classpath plugins
├── settings.gradle.kts        ← Defines module names
├── gradle.properties          ← JVM args, flags
├── local.properties           ← SDK path (NOT committed to git)
│
└── app/
    ├── build.gradle.kts       ← Module-level: all the real config
    └── src/
        ├── main/              ← Production code
        ├── debug/             ← Debug-only code (overrides main/)
        ├── release/           ← Release-only code (overrides main/)
        └── test/              ← Unit tests (JVM, no device)
        └── androidTest/       ← Instrumented tests (need device/emulator)
```

```kotlin
// app/build.gradle.kts — the most important file
plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("com.google.dagger.hilt.android")  // dependency injection
}

android {
    namespace = "com.mycompany.myapp"
    compileSdk = 35               // compile against Android 15 APIs
    defaultConfig {
        applicationId = "com.mycompany.myapp"
        minSdk = 26               // Minimum Android 8.0 (drops older devices)
        targetSdk = 35            // Optimized for Android 15 behavior
        versionCode = 42
        versionName = "2.4.1"

        // Run unit tests with JUnit 4 runner
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        debug {
            // Debug build: NOT obfuscated, includes debug info, testing features enabled
            isDebuggable = true
            isMinifyEnabled = false
            applicationIdSuffix = ".debug"      // com.mycompany.myapp.debug
            versionNameSuffix = "-debug"        // 2.4.1-debug
        }
        release {
            // Release build: obfuscated, optimized, no debug info
            isDebuggable = false
            isMinifyEnabled = true              // enables R8/ProGuard obfuscation
            isShrinkResources = true            // removes unused resources
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            signingConfig = signingConfigs.getByName("release")
        }
    }

    // Enables Jetpack Compose
    buildFeatures {
        compose = true
        buildConfig = true   // generates BuildConfig class with debug/release flags
    }
}

dependencies {
    // Jetpack Compose
    implementation(platform("androidx.compose:compose-bom:2024.10.00"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.material3:material3")

    // Architecture
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.7")
    implementation("androidx.navigation:navigation-compose:2.8.4")

    // Networking
    implementation("com.squareup.retrofit2:retrofit:2.11.0")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")

    // Database
    implementation("androidx.room:room-runtime:2.6.1")
    ksp("androidx.room:room-compiler:2.6.1")        // annotation processor

    // DI
    implementation("com.google.dagger:hilt-android:2.52")
    ksp("com.google.dagger:hilt-compiler:2.52")

    // ── TEST DEPENDENCIES ──────────────────────────────────────────────
    // Unit tests (run on JVM — no device needed):
    testImplementation("junit:junit:4.13.2")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.9.0")
    testImplementation("io.mockk:mockk:1.13.12")
    testImplementation("com.google.truth:truth:1.4.4")

    // Instrumented tests (run on device/emulator):
    androidTestImplementation("androidx.test.espresso:espresso-core:3.6.1")
    androidTestImplementation("androidx.test:runner:1.6.2")
    androidTestImplementation("androidx.test:rules:1.6.1")
    androidTestImplementation("androidx.compose.ui:ui-test-junit4")
}
```

---

## 7. Build Variants — Debug vs Release vs Staging

A **build variant** is a combination of a **build type** (debug/release) and a **product flavor** (free/paid, staging/production). Understanding this is critical for QA.

```kotlin
// app/build.gradle.kts
android {
    flavorDimensions += "environment"

    productFlavors {
        create("staging") {
            dimension = "environment"
            applicationIdSuffix = ".staging"           // com.mycompany.myapp.staging
            buildConfigField("String", "API_BASE_URL",
                             "\"https://staging-api.myapp.com\"")
            buildConfigField("Boolean", "FEATURE_FLAGS_ENABLED", "true")
        }
        create("production") {
            dimension = "environment"
            // No suffix: com.mycompany.myapp
            buildConfigField("String", "API_BASE_URL",
                             "\"https://api.myapp.com\"")
            buildConfigField("Boolean", "FEATURE_FLAGS_ENABLED", "false")
        }
    }
}
```

This generates four build variants:

```
stagingDebug    → staging API + debug mode + package .staging + .debug suffix
stagingRelease  → staging API + release mode + package .staging
productionDebug → production API + debug mode (DANGEROUS — used rarely)
productionRelease → production API + release mode → what ships to Play Store
```

**In BuildConfig** — this is how developers read which environment they're in:

```kotlin
val apiUrl = BuildConfig.API_BASE_URL    // different per flavor
val isDebug = BuildConfig.DEBUG          // true/false per build type
```

**QA implication — which build to test?**:

```
QA TESTING MATRIX:
┌──────────────────┬───────────────────────────────────────────────────┐
│ Build Variant    │ When QA Tests It                                  │
├──────────────────┼───────────────────────────────────────────────────┤
│ stagingDebug     │ Developer testing, early QA integration testing    │
│ stagingRelease   │ Full QA regression, performance testing            │
│ productionDebug  │ Rarely — only to debug production-specific issues │
│ productionRelease│ UAT, final release verification                    │
└──────────────────┴───────────────────────────────────────────────────┘

CRITICAL: Never do final sign-off on stagingDebug.
          stagingRelease is the minimum for regression.
          productionRelease is required before App Store submission.
```

---

## 8. Android Version Fragmentation — Why QA Cares

This is one of Android's biggest QA challenges. iOS has ~95% of devices on the latest or previous version. Android has users spread across 7+ years of versions:

```
Android Version   API Level   Codename      ~Market Share (2024)
────────────────  ─────────   ──────────    ─────────────────────
Android 15        35          Vanilla Ice   ~2% (new, rolling out)
Android 14        34          Upside Down   ~25%
Android 13        33          Tiramisu      ~22%
Android 12        32/31       Snow Cone     ~15%
Android 11        30          Red Velvet    ~14%
Android 10        29          Quince Tart   ~7%
Android 9         28          Pie           ~6%
Android 8.x       26-27       Oreo          ~5%
Older             ≤25         —             ~4%
```

### API Level Changes That Break Tests

```
API LEVEL  CHANGE                                          QA IMPACT
─────────  ──────────────────────────────────────────────  ─────────────────────────────
API 33     POST_NOTIFICATIONS permission required          Push notification tests fail
(Android 13)                                               if permission not granted

API 32     Photos/videos permissions split                 Gallery picker tests change
(Android 12L)

API 31     Exported attribute required in manifest         App install fails on device
(Android 12)  on all intent-filter Activities             running 12+

API 30     Background location requires separate prompt    Location test flow changes
(Android 11)

API 29     Scoped storage — can't access arbitrary files   File sharing tests change
(Android 10)

API 28     Cleartext traffic blocked by default           HTTP calls fail in testing
(Android 9)                                               if not using HTTPS

API 26     Background service execution limits            Background sync tests change
(Android 8)
```

### Minimum SDK Strategy

Setting `minSdk` defines the oldest Android you support:

```
minSdk = 21 (Android 5.0): Supports 99% of devices, but old and slow devices
minSdk = 24 (Android 7.0): Supports 95% of devices, some useful APIs available
minSdk = 26 (Android 8.0): Supports 90% of devices, modern APIs, common choice
minSdk = 28 (Android 9.0): Supports 85% of devices, better security defaults
```

**QA implication**: Test on the minimum SDK version AND the latest. The oldest device is where the most compatibility bugs appear.

---

### 🎯 Practice — Version Fragmentation

**Scenario**: Your app has `minSdk=26` and `targetSdk=34`. QA reports: "On Android 13 devices, push notifications from the app never appear. On Android 12 devices, they work fine." What is the most likely cause?

<details><summary>Answer</summary>

Android 13 (API 33) introduced the `POST_NOTIFICATIONS` permission — a **runtime permission** that must be explicitly granted by the user. On Android 12 and below, apps automatically had notification permission.

**The bug**: The app's permission request code was never added. The manifest declares:

```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

But the app never calls `ActivityCompat.requestPermissions()` to ask the user for it. On Android 12, the permission is auto-granted (the system ignores POST_NOTIFICATIONS on API < 33). On Android 13, the permission is denied by default until requested AND granted.

**The fix**: Add runtime permission request for Android 13+:

```kotlin
// In Activity onCreate or onboarding flow:
if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
    if (ContextCompat.checkSelfPermission(
            this, Manifest.permission.POST_NOTIFICATIONS
        ) != PackageManager.PERMISSION_GRANTED) {
        ActivityCompat.requestPermissions(
            this,
            arrayOf(Manifest.permission.POST_NOTIFICATIONS),
            NOTIFICATION_PERMISSION_CODE
        )
    }
}
```

**QA test matrix for this issue**:
| Android Version | Expected Behavior |
|---|---|
| Android 12 (API 32) | Notifications appear without explicit prompt |
| Android 13 (API 33) | Permission prompt appears on first launch → grant → notifications work |
| Android 13 (API 33) | Permission prompt → DENY → notifications do NOT appear → app handles gracefully |
| Android 14 (API 34) | Same as 13 |

**The lesson**: Whenever a new Android version ships, review the changelog for new runtime permissions. These are the #1 source of version-specific regressions.

</details>

---

## 9. App Signing and Distribution

### Why Signing Exists

Android requires every APK to be **digitally signed** before installation. The signature:

- Proves the APK came from you (not tampered by a third party)
- Enables system updates (update must be signed by same key)
- Controls what apps can share data with each other (same signing key = can share data)

```
SIGNING FLOW:
Your code → Build system → Unsigned APK → zipalign (align bytes) → Sign with keystore → Signed APK → Install/Upload
```

### Debug vs Release Signing

```kotlin
android {
    signingConfigs {
        // Debug: automatic, uses a default debug.keystore
        // Created automatically by Android Studio
        // NEVER use for production — everyone has the same debug key

        // Release: YOUR keystore — must be kept VERY safe
        create("release") {
            storeFile = file(System.getenv("KEYSTORE_PATH"))
            storePassword = System.getenv("KEYSTORE_PASSWORD")
            keyAlias = System.getenv("KEY_ALIAS")
            keyPassword = System.getenv("KEY_PASSWORD")
            // Read from environment variables — NEVER commit keystore passwords to git
        }
    }
}
```

**The catastrophic failure**: If you lose the release keystore AND its password, you CANNOT update your app on the Play Store. Users would have to uninstall the old app and install the new one from scratch. Google Play App Signing (enrolling your key with Google) is the protection against this.

### Distribution Channels

```
DEVELOPMENT BUILDS:
  ADB install (USB or WiFi):
    adb install -r myapp-debug.apk    (-r = replace existing)

  Appium test install:
    Appium installs the APK automatically via capabilities
    app: "/path/to/myapp.apk"

INTERNAL TESTING:
  Firebase App Distribution → share debug/staging APKs with testers
  Google Play Internal Testing Track → test Play Store install flow

BETA TESTING:
  Google Play Open/Closed Testing Tracks
  TestFlight equivalent: Play Store beta

PRODUCTION:
  Google Play Store (requires AAB, not APK)
  App must comply with Play Store policies
```

---

## 10. The Android Architecture Stack

This shows every layer from the hardware to your code:

```
YOUR APP CODE (Kotlin/Java)
     │
     ▼
ANDROID FRAMEWORK (android.*, androidx.*)
  Activity, Fragment, ViewModel, Room, LiveData, Flow
     │
     ▼
ANDROID RUNTIME (ART)
  Executes your compiled DEX → native ARM code
  Garbage collector, JIT warmup
     │
     ▼
NATIVE LIBRARIES (C/C++)
  OpenGL ES, SQLite, WebKit, Skia (drawing)
  Biometric hardware access, Camera access
     │
     ▼
LINUX KERNEL
  Process management, memory management
  Device drivers (camera, WiFi, Bluetooth)
  Hardware Abstraction Layer (HAL)
     │
     ▼
HARDWARE
  ARM CPU, GPU, RAM, Flash storage, sensors
```

**Why this matters for testing**:

- Bugs in YOUR APP LAYER → unit tests and integration tests catch these
- Bugs at FRAMEWORK LAYER → version-specific bugs (minSdk differences)
- Bugs at NATIVE LAYER → crash with SIGSEGV in native code — harder to debug
- Bugs at LINUX KERNEL → usually manufacturer-specific (Samsung vs Pixel behavior differences)

---

## 11. Recommended App Architecture — MVVM with Clean Architecture

Modern Android apps follow this layered architecture. Understanding it tells you WHAT to unit test, WHAT to integration test, and WHAT to E2E test.

```
┌─────────────────────────────────────────────────────────────────────┐
│  PRESENTATION LAYER                                                 │
│  (Android-aware — Activities, Fragments, Composables, ViewModels)  │
│                                                                     │
│  UI (Composable/Fragment/Activity)                                  │
│    ↕ observes state changes                                        │
│  ViewModel (holds UI state, calls use cases)                       │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ calls
┌──────────────────────────────▼──────────────────────────────────────┐
│  DOMAIN LAYER                                                       │
│  (Pure Kotlin — no Android imports)                                │
│                                                                     │
│  Use Cases / Interactors                                            │
│    Example: PayCitationUseCase, FetchCitationsUseCase              │
│    Each use case does ONE thing (Single Responsibility)            │
│                                                                     │
│  Domain Models (data classes)                                       │
│    Example: Citation, Payment, User                                │
│                                                                     │
│  Repository Interfaces (contracts only — no implementation)         │
│    interface CitationRepository { fun fetchCitations(): Flow<...>  }│
└──────────────────────────────┬──────────────────────────────────────┘
                               │ implemented by
┌──────────────────────────────▼──────────────────────────────────────┐
│  DATA LAYER                                                         │
│  (Android-aware — Room, Retrofit, SharedPreferences, DataStore)    │
│                                                                     │
│  Repository Implementations                                         │
│    CitationRepositoryImpl: implements CitationRepository            │
│    Decides: "fetch from network or local cache?"                   │
│                                                                     │
│  Data Sources                                                       │
│    Remote: CitationRemoteDataSource (Retrofit API calls)           │
│    Local:  CitationLocalDataSource (Room DAO queries)              │
│                                                                     │
│  Data Transfer Objects (DTOs)                                       │
│    CitationDto (API response format) → maps to → Citation (domain) │
└─────────────────────────────────────────────────────────────────────┘
```

### What to Test at Each Layer

```
PRESENTATION LAYER:
  - ViewModel unit tests (mock the use cases)
  - Composable/Fragment widget tests (Compose Test, Espresso)
  - E2E tests (Appium) for full screen flows

DOMAIN LAYER:
  - Unit tests for use case logic (pure Kotlin — no mocks needed)
  - These are the MOST valuable unit tests — zero dependencies
  - Example: PayCitationUseCaseTest verifies business rules

DATA LAYER:
  - Integration tests for Repository (real Room DB or MockWebServer)
  - Unit tests for DTO → Domain model mapping logic
  - Contract tests for API format verification
```

---

## 12. How Data Flows Through the Architecture

Follow a user tapping "Pay" through every layer:

```
USER taps PAY button on CitationDetailScreen
         │
         ▼
1. COMPOSABLE captures tap:
   onPayClick() → viewModel.pay(citationId, amount)

         │
         ▼
2. VIEWMODEL validates and delegates:
   fun pay(citationId: String, amount: Double) {
       viewModelScope.launch {
           _uiState.value = PaymentUiState.Loading
           payCitationUseCase(citationId, amount)
               .onSuccess { receipt →
                   _uiState.value = PaymentUiState.Success(receipt)
               }
               .onFailure { error →
                   _uiState.value = PaymentUiState.Error(error.message)
               }
       }
   }

         │
         ▼
3. USE CASE applies business rules:
   class PayCitationUseCase(private val repo: CitationRepository) {
       suspend operator fun invoke(citationId: String, amount: Double):
               Result<PaymentReceipt> {
           // Business rule: amount must be > 0
           if (amount <= 0) return Result.failure(InvalidAmountException())
           // Business rule: citation must be in PENDING status
           val citation = repo.getCitationById(citationId)
               ?: return Result.failure(CitationNotFoundException())
           if (citation.status != "PENDING")
               return Result.failure(AlreadyPaidException())
           // Delegate to repository for actual payment
           return repo.payCitation(citationId, amount)
       }
   }

         │
         ▼
4. REPOSITORY IMPLEMENTATION decides: network + cache
   suspend fun payCitation(id: String, amount: Double): Result<PaymentReceipt> {
       return try {
           val receipt = remoteDataSource.payCitation(id, amount)  // API call
           localDataSource.updateCitationStatus(id, "PAID")        // update cache
           Result.success(receipt)
       } catch (e: Exception) {
           Result.failure(e)
       }
   }

         │
         ▼
5. REMOTE DATA SOURCE calls the API:
   suspend fun payCitation(id: String, amount: Double): PaymentReceiptDto {
       return api.payCitation(PaymentRequest(citationId = id, amount = amount))
   }

         │
         ▼
6. RETROFIT sends the HTTP request:
   POST /citations/{id}/pay
   Body: { "amount": 150.00 }
   Authorization: Bearer <token>

         │
         ▼
7. RESPONSE comes back:
   { "receiptId": "RCP-001", "timestamp": "2024-01-15T10:30:00Z" }

         │ (all the way back up)
         ▼
8. UI REACTS:
   _uiState.value = PaymentUiState.Success(receipt)
   → Composable observes state change → shows Success screen
```

---

## 13. Interview Questions on Android Architecture

**Q: "What is the difference between compileSdk and minSdk?"**

> "`compileSdk` is the Android API level you compile AGAINST — it determines which APIs are available to call in your code. `minSdk` is the MINIMUM Android version you support — your app will refuse to install on anything older. You should set `compileSdk` to the latest stable API to access modern APIs and receive deprecation warnings. `minSdk` is a business decision based on your user base. A common configuration is `compileSdk=35, minSdk=26` — you use the latest APIs but maintain backward compatibility to Android 8."

**Q: "What is the difference between an Activity and a Fragment?"**

> "An Activity is an independent, OS-managed component — it has its own task, its own lifecycle managed directly by Android, and can be launched from outside the app. A Fragment is a reusable UI piece that LIVES INSIDE an Activity — it cannot exist without a host. Modern Android development favors a single-Activity architecture where one MainActivity hosts all screens via Fragments or Jetpack Compose destinations managed by Jetpack Navigation. Fragments provide a more modular, testable UI structure and better back stack management through the Navigation component."

**Q: "Why should sensitive config like API keys not be in the manifest or build.gradle?"**

> "AndroidManifest.xml and build.gradle are committed to source control. API keys in these files are visible to anyone with access to the repository — including if the repo is accidentally public. Additionally, anyone who reverse-engineers the APK can extract the manifest and read plaintext values from it. The correct approach: store sensitive values as environment variables on CI machines, inject them at build time via `BuildConfig` fields (which are obfuscated in release builds), or better yet, use Android Keystore for runtime secrets and fetch them from a secure backend endpoint at login time — never hardcode them."

---

**Next in this folder**: [02_Activity_Fragment_Lifecycle.md](./02_Activity_Fragment_Lifecycle.md) — the complete lifecycle with visual state diagrams and every callback explained with QA implications.

**Back to**: [03_Android subfolder index](./) | [Series Index](../)
