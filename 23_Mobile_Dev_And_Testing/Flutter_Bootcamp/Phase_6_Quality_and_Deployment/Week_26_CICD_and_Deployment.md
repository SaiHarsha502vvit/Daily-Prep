# Week 25 — CI/CD and Deployment
### Automate everything: lint, test, build, ship — every commit

---

> Three lenses on every concept:
> - 🧑‍💻 **Developer** — GitHub Actions workflow syntax, flutter CLI commands, signing
> - 🎨 **Designer** — CI means every design system change is tested before it reaches staging
> - 🧪 **Tester** — CI runs your tests on every PR; no broken code merges without your sign-off

---

## What CI/CD Is

### The Backstory — How Software Delivery Was Transformed

Before CI/CD existed, software teams had what was called "integration hell." Here's how it worked:

**Pre-2000s model:** Developer A works on Feature X for 3 weeks in isolation. Developer B works on Feature Y for 3 weeks in isolation. On "integration day," they merge both branches into the main codebase. The result: everything breaks simultaneously, the code doesn't compile, tests fail everywhere, and nobody knows whose change caused which failure. Integration day could take another 1–2 weeks just to resolve.

**2001 — Martin Fowler and Kent Beck formalize "Continuous Integration."** The key idea: integrate small, integrate often. Instead of waiting 3 weeks, merge at least once a day. Smaller merges = smaller conflicts = faster resolution. They published this as a practice in the Agile Manifesto and related writings.

**2008 — GitHub launches, then GitHub Actions (2019).** GitHub's pull request model formalized code review and CI triggers. Actions (2019) made it trivial to run CI without a separate Jenkins server — just a YAML file in your repo. CI adoption went from "large companies with DevOps teams" to "every open-source project and most startups."

**The mobile app delivery problem:** Web CI was straightforward — build → deploy to a server. Mobile CI had an extra layer: App Store / Play Store review. You can't just "deploy" — Apple reviews your app (1–3 days on average). Fastlane (2015) was built specifically to automate the mechanical parts of app submission — code signing, screenshot capture, TestFlight upload — so developers could ship without manually clicking through Xcode and App Store Connect.

**Why Flutter CI is particularly valuable:** Flutter's strict lint rules (`flutter analyze`), sound null safety, and comprehensive test infrastructure mean that a CI pipeline can catch a very high percentage of bugs before code merges. A PR with no linting errors and passing tests is materially safer to merge than in most other mobile stacks. The investment in setting up CI pays back immediately and continuously.

**The mental model shift:** CI isn't about running tests automatically. It's about **making the cost of integration zero** so you integrate constantly. When integration is free (automated, instant feedback), you do it every commit. The feedback loop shrinks from days to minutes.

---

> 📄 **Continuous Integration / Continuous Delivery:**
> *"CI runs automated checks (lint, test, build) on every commit. CD automates the delivery of those verified builds to testers, the App Store, or production."*

```
Developer pushes commit
         │
         ▼
   GitHub Actions triggered
         │
   ┌─────▼─────┐
   │   Lint    │   flutter analyze — catches style violations
   └─────┬─────┘
         │ pass
   ┌─────▼─────┐
   │   Test    │   flutter test — all unit + widget tests
   └─────┬─────┘
         │ pass
   ┌─────▼─────┐
   │   Build   │   flutter build appbundle / ipa
   └─────┬─────┘
         │ pass
   ┌─────▼─────┐
   │  Deploy   │   Upload to Firebase App Distribution / TestFlight / Play Store
   └───────────┘

If any step fails → PR is blocked → developer fixes before merging
```

This is how professional Flutter teams work. No one manually runs `flutter analyze` before every PR — the pipeline does it automatically.

---

## The Invisible Machinery — What Actually Runs Your CI Pipeline

When you push a commit and GitHub Actions runs your Flutter tests automatically, what is actually happening? Where does the code run? Who owns the machine? This section removes the black box.

---

### The History of Running Code in the Cloud

**1990s — Physical servers (bare metal):**
Every company owned physical computers in a room (server room, later data center). Running a new application meant: buy a server ($5,000–$50,000), rack it in the data center, install the OS, install software, configure networking, wait 4–6 weeks for delivery and setup. If the server sat idle 90% of the time (which they did), you still paid for it.

**2001 — Virtual Machines (VMware changes everything):**

A hypervisor is software that runs on a physical machine and creates the illusion of multiple completely separate machines — "virtual machines" (VMs). Each VM has its own isolated:
- CPU (virtual)
- RAM (allocated slice)
- Disk (a file on the host machine's disk)
- Network card (virtual)
- Operating system (whatever the VM owner installs — Windows, Linux, macOS)

The physical machine (the "host") might run 20–50 VMs simultaneously. Each VM thinks it's a real computer. They're completely isolated from each other — a bug in one VM cannot crash another.

**VMware** (founded 1998) made this practical. By the early 2000s, companies could run 10 servers on one physical machine, dramatically reducing hardware costs.

**2006 — Amazon EC2 launches (the cloud is born):**

Amazon had built massive infrastructure for amazon.com. They realized they were using maybe 10% of their capacity on average (they built for peak shopping days). In 2006, they started **renting VMs to other companies by the hour** — this became Amazon Web Services (AWS) EC2.

The revolution: you no longer needed to buy hardware. You could rent a VM for $0.01/hour, run your workload for 10 minutes, and pay $0.002. Infrastructure became software.

Google Cloud (2008), Microsoft Azure (2010) followed. The "cloud" is just a marketing name for "someone else's computers, rented by the hour."

**2008–2013 — Linux Containers: A Better Isolation Primitive**

VMs have overhead. Each VM boots a full OS kernel. A 512MB VM uses 300MB just for the OS. Booting takes 30–60 seconds.

Linux had two technologies that enabled a lighter-weight alternative:

**Linux Namespaces (2002–2008):** The Linux kernel can create isolated views of system resources. One process sees its own isolated:
- Process tree (PID namespace) — can't see other processes
- Network interfaces (network namespace) — has its own IP stack
- File system (mount namespace) — sees a different directory tree
- Hostname (UTS namespace) — has its own hostname

**Control Groups / cgroups (2006, Google engineers):** Limit how much CPU, RAM, and disk I/O a process can use. A container can be told "you get at most 2 CPU cores and 1GB RAM" — the kernel enforces this.

Together, namespaces + cgroups create a **container**: an isolated process (or group of processes) that thinks it has its own machine, but shares the host OS kernel. No second kernel to boot. Startup time: milliseconds. Memory overhead: almost nothing.

**LXC (Linux Containers, 2008)** packaged these kernel features into a usable tool. But the API was complex and the tooling was rough.

**2013 — Docker: Making Containers Actually Usable**

Solomon Hykes, a French developer, built **Docker** as an internal tool at a company called dotCloud. He open-sourced it in March 2013 at PyCon.

Docker's insight wasn't the technology (Linux already had namespaces + cgroups). It was the **developer experience**:

1. **Dockerfile** — a text file describing how to build your environment, step by step
2. **Image layers** — each step in the Dockerfile creates an immutable "layer." Layers are shared between images. If 50 containers all use Ubuntu, there's one copy of the Ubuntu layer, not 50.
3. **Docker Hub** — a public registry of pre-built images. `FROM ubuntu:22.04` downloads Ubuntu in seconds.
4. **`docker run`** — one command to pull an image and start a container

Before Docker: "It works on my machine" was a genuine crisis. Setting up a new developer's machine took hours. Deploying to a server required careful manual configuration that differed from development.

After Docker: package your app + its exact dependencies into an image. Run the same image anywhere — your laptop, a colleague's machine, a cloud server — identical results.

**2014 — Kubernetes: Managing Many Containers**

Running one container is easy. Running 100 containers across 50 machines, restarting crashed ones, load-balancing traffic between them, rolling out updates without downtime — that's hard.

**Kubernetes** (Greek for "helmsman," nicknamed "k8s") was built by Google engineers who had been running a similar internal system called Borg for a decade. Open-sourced in 2014, it became the standard way to orchestrate containers at scale.

For your Flutter CI pipeline, you don't directly interact with Kubernetes. But **GitHub Actions runs on Kubernetes-orchestrated containers** under the hood.

---

### How GitHub Actions Actually Runs Your Flutter Tests

When you push a commit and your CI pipeline triggers, here's the precise sequence:

```
1. You push to GitHub
        │
        ▼
2. GitHub's webhook system detects the push
   Reads .github/workflows/ci.yml from your repo
        │
        ▼
3. GitHub allocates a "runner"
   A runner is a VM (on Microsoft Azure — GitHub is owned by Microsoft)
   Spec: 2 vCPUs, 7GB RAM, 14GB SSD — this is what "ubuntu-latest" gives you
   The VM was pre-warmed and idle in a pool, waiting for jobs
        │
        ▼
4. Your workflow steps execute on this VM:

   "uses: subosito/flutter-action@v2"
   → Downloads and installs Flutter SDK into the VM
   → (Often cached from previous runs — GitHub caches between builds)

   "run: flutter pub get"
   → Downloads your pub.dev dependencies into the VM

   "run: flutter test"
   → Runs all your Dart tests on this VM's CPUs
   → Output streams back to GitHub's servers in real time
   → You see it in the GitHub Actions UI

   "run: flutter build appbundle"
   → Compiles your Flutter app to an Android App Bundle
   → The .aab file exists on the VM's filesystem
        │
        ▼
5. If all steps pass:
   → "actions/upload-artifact" copies the .aab from the VM to GitHub's storage
   → GitHub marks the PR as "checks passed"
   → If deploying: the .aab is uploaded to Google Play Console via their API

6. VM is destroyed
   All files, installations, cached data from YOUR run are gone
   The VM is returned to the pool and cleaned for the next job
```

**The "ubuntu-latest" you specify** is a Docker image — a pre-built snapshot of Ubuntu 22.04 with common tools already installed (git, curl, Java, Android SDK tools). GitHub pulls this image and boots a container (or VM, depending on the runner type) from it.

**macOS runners** for iOS builds (`runs-on: macos-latest`) are actual macOS VMs running on Apple Mac mini hardware — Apple doesn't allow macOS to run on non-Apple hardware, even in virtualization. Apple Silicon Mac minis are physically hosted in GitHub's data centers. This is why macOS runners cost more ($0.10/minute vs $0.008/minute for Linux runners on paid plans).

---

### Why This Architecture Matters for Flutter CI

**Reproducibility:** Every run starts from the same clean Docker image. "It passes on my machine but fails in CI" is almost always because your machine has something extra installed. The Docker image has only what's declared — a feature, not a bug.

**Parallelism:** Your workflow can run multiple jobs simultaneously (test on Android + build iOS + run integration tests — all at the same time on separate VMs). GitHub allocates separate VMs for each parallel job.

**Caching:** `flutter pub get` would download ~200MB of packages on every run without caching. GitHub's caching action stores the pub cache between runs. The cache key is the `pubspec.lock` file hash — if dependencies don't change, the cache is reused. This cuts build time from ~5 minutes to ~2 minutes.

**Why secrets aren't in your YAML:** Your `PLAY_STORE_KEY` and `APP_STORE_KEY` are stored in GitHub's encrypted secrets vault, not in your repo. They're injected as environment variables into the VM at runtime. The VM's environment is isolated — other jobs running simultaneously on other VMs cannot see your secrets.

---

## Setup — GitHub Actions

Create `.github/workflows/ci.yml` in your repo root:

```yaml
name: Flutter CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  FLUTTER_VERSION: '3.24.0'
  JAVA_VERSION: '17'

jobs:
  # ─── Job 1: Analyze + Test ────────────────────────────────────────
  test:
    name: Analyze & Test
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Java (needed for Android toolchain)
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: ${{ env.JAVA_VERSION }}

      - name: Setup Flutter
        uses: subosito/flutter-action@v2
        with:
          flutter-version: ${{ env.FLUTTER_VERSION }}
          channel: 'stable'
          cache: true   # caches Flutter SDK between runs → faster

      - name: Get dependencies
        run: flutter pub get

      - name: Verify formatting
        run: dart format --output=none --set-exit-if-changed .

      - name: Analyze (lint)
        run: flutter analyze --fatal-infos --fatal-warnings
        # --fatal-warnings: treat lint warnings as errors → nothing slips through

      - name: Run tests with coverage
        run: flutter test --coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v4
        with:
          file: coverage/lcov.info
          token: ${{ secrets.CODECOV_TOKEN }}

  # ─── Job 2: Build Android ─────────────────────────────────────────
  build-android:
    name: Build Android
    runs-on: ubuntu-latest
    needs: test   # only runs if test job passes

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: ${{ env.JAVA_VERSION }}

      - uses: subosito/flutter-action@v2
        with:
          flutter-version: ${{ env.FLUTTER_VERSION }}
          cache: true

      # Decode the keystore from a base64 secret
      - name: Decode keystore
        run: |
          echo "${{ secrets.ANDROID_KEYSTORE_BASE64 }}" | base64 --decode > android/app/upload-keystore.jks

      - name: Create key.properties
        run: |
          cat > android/key.properties << EOF
          storePassword=${{ secrets.ANDROID_KEY_PASSWORD }}
          keyPassword=${{ secrets.ANDROID_KEY_PASSWORD }}
          keyAlias=${{ secrets.ANDROID_KEY_ALIAS }}
          storeFile=upload-keystore.jks
          EOF

      - name: Get dependencies
        run: flutter pub get

      - name: Build App Bundle
        run: flutter build appbundle --release

      - name: Upload AAB artifact
        uses: actions/upload-artifact@v4
        with:
          name: release-aab
          path: build/app/outputs/bundle/release/app-release.aab
          retention-days: 7

  # ─── Job 3: Build iOS ─────────────────────────────────────────────
  build-ios:
    name: Build iOS
    runs-on: macos-latest    # iOS builds require macOS
    needs: test

    steps:
      - uses: actions/checkout@v4

      - uses: subosito/flutter-action@v2
        with:
          flutter-version: ${{ env.FLUTTER_VERSION }}
          cache: true

      - name: Get dependencies
        run: flutter pub get

      - name: Install CocoaPods
        run: cd ios && pod install

      - name: Build iOS (no codesign — for CI)
        run: flutter build ios --release --no-codesign

      - name: Upload IPA artifact
        uses: actions/upload-artifact@v4
        with:
          name: release-ios
          path: build/ios/iphoneos/Runner.app
          retention-days: 7
```

---

## Android Signing Setup

```bash
# 1. Generate keystore (one time, keep it safe)
keytool -genkey -v -keystore upload-keystore.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias upload

# 2. Encode the keystore as base64 for GitHub Secrets
base64 upload-keystore.jks
# Copy the output

# 3. Add these GitHub Secrets in your repo Settings → Secrets:
# ANDROID_KEYSTORE_BASE64   → the base64 output from step 2
# ANDROID_KEY_PASSWORD      → the password you chose
# ANDROID_KEY_ALIAS         → "upload"
```

```groovy
// android/app/build.gradle — use key.properties for signing
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file('key.properties')
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    signingConfigs {
        release {
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
            storeFile keystoreProperties['storeFile'] ? file(keystoreProperties['storeFile']) : null
            storePassword keystoreProperties['storePassword']
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            shrinkResources true
        }
    }
}
```

**Rule:** Never commit `key.properties` or `upload-keystore.jks` to git. Add them to `.gitignore`. Use GitHub Secrets for CI.

---

## Versioning — `pubspec.yaml`

```yaml
# pubspec.yaml
version: 1.3.2+47
#         │   │
#         │   └── Build number (versionCode on Android, CFBundleVersion on iOS)
#         │       Increment on EVERY build to Play Store / App Store
#         └──── Version name (shown to users)
#               Follow semver: major.minor.patch
```

```bash
# Bump version in CI — inject from git tag
flutter build appbundle \
  --build-name=$(git describe --tags --abbrev=0 | sed 's/v//') \
  --build-number=${{ github.run_number }}
# github.run_number increments on every CI run → unique build numbers
```

```bash
# Release tagging flow
git tag -a v1.3.2 -m "Release v1.3.2 — added expense search"
git push origin v1.3.2
# CI can trigger deployment jobs only on tags:
on:
  push:
    tags:
      - 'v*'
```

---

## Firebase App Distribution — Automated Test Builds

```yaml
# .github/workflows/distribute.yml — triggered on push to develop

name: Distribute to Testers

on:
  push:
    branches: [develop]

jobs:
  distribute-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: subosito/flutter-action@v2
        with: { flutter-version: '3.24.0', cache: true }

      - run: flutter pub get
      - run: flutter build apk --release   # APK for App Distribution (not AAB)

      - name: Upload to Firebase App Distribution
        uses: wzieba/Firebase-Distribution-Github-Action@v1
        with:
          appId: ${{ secrets.FIREBASE_ANDROID_APP_ID }}
          serviceCredentialsFileContent: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
          groups: internal-testers   # tester group in Firebase Console
          file: build/app/outputs/flutter-apk/app-release.apk
          releaseNotes: "Build from commit ${{ github.sha }}"
```

🧪 **Tester:** App Distribution sends testers an email with a download link. No more "send me the APK on WhatsApp." Every commit to `develop` automatically reaches the tester group. Testers get the freshest build. You get bugs reported against the exact commit.

---

## `flutter_flavors` — Dev vs Staging vs Production

```yaml
# pubspec.yaml — flavors for different environments
flutter:
  flavors:
    dev:
      app-suffix: .dev
      display-name: "ExpenseTracker DEV"
    staging:
      app-suffix: .staging
      display-name: "ExpenseTracker STAGING"
    prod:
      display-name: "ExpenseTracker"
```

```dart
// lib/core/config/app_config.dart
enum Flavor { dev, staging, prod }

class AppConfig {
  final Flavor flavor;
  final String apiBaseUrl;
  final String firebaseProjectId;
  final bool enableLogging;

  const AppConfig._({
    required this.flavor,
    required this.apiBaseUrl,
    required this.firebaseProjectId,
    required this.enableLogging,
  });

  static AppConfig? _current;
  static AppConfig get current => _current!;

  static void initialize(Flavor flavor) {
    _current = switch (flavor) {
      Flavor.dev => const AppConfig._(
          flavor: Flavor.dev,
          apiBaseUrl: 'https://api-dev.expensetracker.com',
          firebaseProjectId: 'expense-tracker-dev',
          enableLogging: true,
        ),
      Flavor.staging => const AppConfig._(
          flavor: Flavor.staging,
          apiBaseUrl: 'https://api-staging.expensetracker.com',
          firebaseProjectId: 'expense-tracker-staging',
          enableLogging: true,
        ),
      Flavor.prod => const AppConfig._(
          flavor: Flavor.prod,
          apiBaseUrl: 'https://api.expensetracker.com',
          firebaseProjectId: 'expense-tracker-prod',
          enableLogging: false,
        ),
    };
  }
}
```

```dart
// main_dev.dart
void main() {
  AppConfig.initialize(Flavor.dev);
  runApp(const App());
}

// main_prod.dart
void main() {
  AppConfig.initialize(Flavor.prod);
  runApp(const App());
}
```

```bash
# Run specific flavor
flutter run --flavor dev -t lib/main_dev.dart
flutter run --flavor prod -t lib/main_prod.dart

# Build specific flavor
flutter build appbundle --flavor prod -t lib/main_prod.dart
```

---

## `analysis_options.yaml` — Lint Rules

```yaml
# analysis_options.yaml

include: package:flutter_lints/flutter.yaml

analyzer:
  exclude:
    - '**/*.g.dart'       # generated files
    - '**/*.freezed.dart'
  errors:
    invalid_annotation_target: ignore   # for json_serializable

linter:
  rules:
    # Performance
    prefer_const_constructors: true
    prefer_const_declarations: true
    prefer_const_literals_to_create_immutables: true

    # Code style
    prefer_single_quotes: true
    require_trailing_commas: true
    sort_child_properties_last: true

    # Safety
    avoid_print: true            # use debugPrint or a logger
    unawaited_futures: true      # catch missing awaits
    always_use_package_imports: true

    # Avoid common mistakes
    cancel_subscriptions: true
    close_sinks: true
    use_build_context_synchronously: true
```

---

## Deployment to Google Play Store

```yaml
# .github/workflows/deploy-play-store.yml

name: Deploy to Play Store

on:
  push:
    tags:
      - 'v*'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { distribution: 'temurin', java-version: '17' }
      - uses: subosito/flutter-action@v2
        with: { flutter-version: '3.24.0', cache: true }

      - name: Decode keystore
        run: echo "${{ secrets.ANDROID_KEYSTORE_BASE64 }}" | base64 --decode > android/app/upload-keystore.jks

      - name: Create key.properties
        run: |
          cat > android/key.properties << EOF
          storePassword=${{ secrets.ANDROID_KEY_PASSWORD }}
          keyPassword=${{ secrets.ANDROID_KEY_PASSWORD }}
          keyAlias=upload
          storeFile=upload-keystore.jks
          EOF

      - run: flutter pub get
      - run: flutter build appbundle --release --build-number=${{ github.run_number }}

      - name: Upload to Play Store (Internal Testing)
        uses: r0adkll/upload-google-play@v1
        with:
          serviceAccountJsonPlainText: ${{ secrets.PLAY_STORE_SERVICE_ACCOUNT }}
          packageName: com.yourname.expensetracker
          releaseFiles: build/app/outputs/bundle/release/app-release.aab
          track: internal        # start in internal testing, promote to production manually
          status: completed
          whatsNewDirectory: distribution/whatsnew
```

---

## Environment Variables — Never Hard-Code Secrets

```dart
// BAD — secrets in code
const apiKey = 'AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXX';

// GOOD — use --dart-define at build time
// flutter run --dart-define=API_KEY=your-key-here

const apiKey = String.fromEnvironment('API_KEY');

// Or in CI:
// flutter build appbundle --dart-define=API_KEY=${{ secrets.API_KEY }}
```

```yaml
# Even better for Flutter — use flutter_dotenv
dependencies:
  flutter_dotenv: ^5.1.0
```

```
# .env  (NOT committed to git — in .gitignore)
API_KEY=AIzaSyXXXXXXXX
BASE_URL=https://api.expensetracker.com
```

```dart
await dotenv.load(fileName: '.env');
final apiKey = dotenv.env['API_KEY']!;
```

---

## 9. Fastlane — Automated iOS Distribution

> 📄 **Fastlane Docs:**
> *"fastlane is an open source platform aimed at simplifying Android and iOS deployment. fastlane lets you automate every aspect of your development and release workflow."*

iOS code signing is the most painful part of Flutter deployment. Fastlane Match solves it by storing all certificates in a Git repo and syncing them on CI.

```bash
# Install fastlane (macOS only — iOS builds require macOS)
gem install fastlane

# In your Flutter project root
cd ios
fastlane init

# Setup Match — centralized certificate management
fastlane match init
# Enter your certificates Git repo URL (private repo!)
# This stores your signing certificates encrypted in git
```

```ruby
# ios/Fastfile

default_platform(:ios)

platform :ios do
  desc "Build and upload to TestFlight"
  lane :beta do
    # Sync signing certificates from the match git repo
    match(
      type: "appstore",                    # or "development" for dev builds
      git_url: "https://github.com/your-org/certificates",
      app_identifier: "com.yourname.expensetracker",
      readonly: true,                      # CI: read-only, don't create new certs
    )

    # Increment build number to the CI run number
    increment_build_number(
      build_number: ENV["BUILD_NUMBER"],
    )

    # Build the Flutter IPA
    sh("flutter build ipa --release")

    # Upload to TestFlight
    upload_to_testflight(
      api_key_path: "fastlane/app_store_connect_api_key.json",
      ipa: "../build/ios/ipa/ExpenseTracker.ipa",
      skip_waiting_for_build_processing: true,  # don't block CI for Apple's processing
    )
  end

  desc "Run tests"
  lane :test do
    sh("flutter test")
  end
end
```

```yaml
# GitHub Actions for iOS — add to build-ios job
- name: Setup Ruby and Fastlane
  uses: ruby/setup-ruby@v1
  with:
    ruby-version: '3.2'
    bundler-cache: true

- name: Setup SSH for Match
  uses: webfactory/ssh-agent@v0.9.0
  with:
    ssh-private-key: ${{ secrets.MATCH_DEPLOY_KEY }}
    # MATCH_DEPLOY_KEY = deploy key for your certificates git repo (read access)

- name: Install dependencies
  run: |
    cd ios && bundle install
    flutter pub get
    cd ios && pod install

- name: Run Fastlane beta
  env:
    MATCH_PASSWORD: ${{ secrets.MATCH_PASSWORD }}  # password for decrypting certs
    BUILD_NUMBER: ${{ github.run_number }}
  run: cd ios && bundle exec fastlane beta
```

**Match workflow explained:**
```
First time (your Mac):
  fastlane match appstore   → generates cert + provisioning profile
                            → encrypts them with MATCH_PASSWORD
                            → pushes to certificates git repo

On CI (read-only):
  match(readonly: true)     → clones certificates repo
                            → decrypts with MATCH_PASSWORD
                            → installs cert + profile on CI macOS runner
                            → Xcode can now sign the build
```

---

## 10. App Store Metadata — `deliver`

```ruby
# Fastfile — automate App Store metadata
lane :release do
  # Build
  match(type: "appstore", readonly: true)
  sh("flutter build ipa --release")

  # Upload binary + metadata
  deliver(
    api_key_path: "fastlane/app_store_connect_api_key.json",
    ipa: "../build/ios/ipa/ExpenseTracker.ipa",
    submit_for_review: false,              # true = submit immediately
    automatic_release: false,
    metadata_path: "fastlane/metadata",   # screenshots, descriptions, keywords
    screenshots_path: "fastlane/screenshots",
  )
end
```

---

## 11. Staged Rollouts — Ship to 1% Before 100%

> 🏢 **Enterprise Reality:**
> *"No enterprise ships a release to 100% of users at once. You roll out to 1%, monitor crash rate for 24 hours, then 10%, then 50%, then 100%. If crashes spike, you halt the rollout instantly."*

```yaml
# Google Play Console staged rollout — set in CI
- name: Staged rollout to production (1%)
  uses: r0adkll/upload-google-play@v1
  with:
    serviceAccountJsonPlainText: ${{ secrets.PLAY_SERVICE_ACCOUNT }}
    packageName: com.yourname.expensetracker
    releaseFiles: build/app/outputs/bundle/release/app-release.aab
    track: production
    rolloutPercentage: 0.01   # 1% of users
    status: inProgress
    # Manually increase to 10%, 50%, 100% in Play Console after monitoring
```

```
Rollout timeline (enterprise standard):
Day 0:  Deploy to internal (team only)      → smoke test
Day 1:  Deploy to beta (1000 testers)       → monitor Crashlytics
Day 2:  Production rollout: 1%              → monitor crash-free rate
Day 3:  If crash-free > 99.5%: increase to 10%
Day 5:  If metrics stable: increase to 50%
Day 7:  Full rollout: 100%

If crash-free drops below 99%: HALT rollout → investigate → hotfix
```

---

## 12. Semantic Versioning — Enterprise Release Management

```
MAJOR.MINOR.PATCH+BUILD
  │      │      │     │
  │      │      │     └── CI build number (auto-incremented)
  │      │      └── Bug fix (backward-compatible)
  │      └── New feature (backward-compatible)
  └── Breaking change (API change, migration required)

Examples:
  2.0.0+1    → Major redesign, requires data migration
  2.1.0+45   → Added expense categories feature
  2.1.1+46   → Fixed crash on empty category
  2.1.2+47   → Fixed currency formatting in Hindi locale
```

```yaml
# Automate version from git tags
- name: Set version from git tag
  run: |
    VERSION=$(git describe --tags --abbrev=0 | sed 's/v//')
    BUILD=${{ github.run_number }}
    echo "VERSION=$VERSION" >> $GITHUB_ENV
    echo "BUILD=$BUILD" >> $GITHUB_ENV

- name: Build with version
  run: flutter build appbundle --build-name=${{ env.VERSION }} --build-number=${{ env.BUILD }}
```

---

## 13. Rollback Strategy — When Things Go Wrong

```yaml
# Hotfix workflow — branch from the release tag, not main
# main may have unreleased features that can't ship yet

# 1. Create hotfix branch from the last release tag
# git checkout -b hotfix/2.1.1 v2.1.0

# 2. Fix the bug, commit, tag
# git commit -m "fix: crash on empty expense list"
# git tag v2.1.1

# 3. CI builds and deploys to internal → beta → 1% production

# 4. Cherry-pick the fix back to main
# git checkout main && git cherry-pick hotfix/2.1.1
```

```dart
// Force update — when a critical bug requires all users to update
class ForceUpdateChecker {
  Future<void> check() async {
    final remoteConfig = FirebaseRemoteConfig.instance;
    await remoteConfig.fetchAndActivate();

    final minVersion = remoteConfig.getString('min_app_version');  // "2.1.1"
    final currentVersion = await PackageInfo.fromPlatform().then((p) => p.version);

    if (_isVersionLower(currentVersion, minVersion)) {
      // Show blocking dialog — user must update
      showDialog(
        barrierDismissible: false,
        builder: (_) => AlertDialog(
          title: const Text('Update Required'),
          content: const Text('Please update to continue using the app.'),
          actions: [
            FilledButton(
              onPressed: () => launchUrl(Uri.parse(_storeUrl)),
              child: const Text('Update Now'),
            ),
          ],
        ),
      );
    }
  }
}
```

---

## 14. Security Hardening — Production Checklist

```yaml
# Android ProGuard/R8 — obfuscate release code
# android/app/build.gradle
android {
  buildTypes {
    release {
      minifyEnabled true    # remove unused code
      shrinkResources true  # remove unused assets
      proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
  }
}
```

```dart
// Root/jailbreak detection
import 'package:flutter_jailbreak_detection/flutter_jailbreak_detection.dart';

Future<void> checkDeviceIntegrity() async {
  final isJailbroken = await FlutterJailbreakDetection.jailbroken;
  final isDeveloperMode = await FlutterJailbreakDetection.developerMode;

  if (isJailbroken) {
    // Log to analytics, show warning, or block sensitive features
    logger.w('App running on jailbroken/rooted device');
    analytics.trackEvent('security_warning', params: {'type': 'jailbroken'});
  }
}

// Prevent screenshots on sensitive screens (banking, health)
import 'package:flutter_windowmanager/flutter_windowmanager.dart';

@override
void initState() {
  super.initState();
  if (Platform.isAndroid) {
    FlutterWindowManager.addFlags(FlutterWindowManager.FLAG_SECURE);
  }
}

@override
void dispose() {
  if (Platform.isAndroid) {
    FlutterWindowManager.clearFlags(FlutterWindowManager.FLAG_SECURE);
  }
  super.dispose();
}
```

**Enterprise security checklist:**
```
□ ProGuard/R8 enabled for release builds (code obfuscation)
□ Certificate pinning for all API calls
□ Auth tokens in flutter_secure_storage (not SharedPreferences)
□ No PII in logs (email, phone, name, tokens)
□ FLAG_SECURE on sensitive screens (prevents screenshots)
□ Root/jailbreak detection with appropriate response
□ API keys injected via --dart-define, never in source code
□ Firestore security rules tested and deployed
□ App Transport Security (iOS) / Network Security Config (Android)
□ Content Security Policy for WebView content
```

---

## Lab — Set Up CI for the Expense Tracker

1. Create `.github/workflows/ci.yml` with the analyze + test job
2. Add `analysis_options.yaml` with the lint rules from this file
3. Run `flutter analyze` locally — fix any warnings
4. Push to GitHub — watch the Actions tab run your pipeline
5. Intentionally introduce a `print()` statement — verify CI fails with `avoid_print`
6. Fix it and push again — verify CI passes

---

## Challenge — Complete Pipeline

Add a second job `build-android` to your workflow that:
1. Only runs when the test job passes (`needs: test`)
2. Builds a release APK (not AAB — for simplicity)
3. Uploads it as a GitHub Actions artifact
4. Add a version badge to your README: `![CI](https://github.com/YOUR_USER/YOUR_REPO/actions/workflows/ci.yml/badge.svg)`

---

## Week 25 Verify

1. What is the difference between CI and CD? Give an example of each in a Flutter context.
2. Why does the `build-android` job have `needs: test`? What would happen without it?
3. You run `flutter build appbundle --build-number=${{ github.run_number }}` — what does `github.run_number` give you? Why is this better than hard-coding?
4. `--fatal-warnings` in `flutter analyze` — what does this do? Why would a team enable it?
5. Why is the keystore file encoded as base64 before storing in GitHub Secrets?
6. What is the difference between `internal`, `alpha`, `beta`, and `production` tracks on the Play Store?
7. `String.fromEnvironment('API_KEY')` — what does this return if the key was not passed at build time?
8. What does `match(type: "appstore", readonly: true)` do on CI? Why is `readonly: true` important for CI but not your local machine?
9. Fastlane Match stores certificates in a Git repo. Why is this better than each team member generating their own certificate? What problem does it solve with iOS provisioning profiles?
10. `upload_to_testflight(skip_waiting_for_build_processing: true)` — what does this flag do? Why would you set it to `true` in CI?
11. Your staged rollout is at 10% and crash-free rate drops to 98.5% (below the 99% threshold). What do you do? Describe the exact steps from halt to hotfix to re-rollout.
12. `MAJOR.MINOR.PATCH+BUILD` — you add a new optional field to the API response. Which number do you bump? You remove a deprecated screen. Which number? You fix a crash. Which number?
13. Your security checklist includes ProGuard/R8 obfuscation, root/jailbreak detection, and `FLAG_SECURE` on sensitive screens. What does each of these protect against? Which one prevents screenshots in the app switcher?

---

**Next → [Week 26: Project — Chat App (Phase 6 Capstone)](Week_26_Project_ChatApp.md)**
