# Week 25 — CI/CD and Deployment
### Automate everything: lint, test, build, ship — every commit

---

> Three lenses on every concept:
> - 🧑‍💻 **Developer** — GitHub Actions workflow syntax, flutter CLI commands, signing
> - 🎨 **Designer** — CI means every design system change is tested before it reaches staging
> - 🧪 **Tester** — CI runs your tests on every PR; no broken code merges without your sign-off

---

## What CI/CD Is

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

---

**Next → [Week 26: Project — Chat App (Phase 6 Capstone)](Week_26_Project_ChatApp.md)**
