# CI/CD & Deployment Challenges

### Companion to [Week 26: CI/CD & Deployment](Week_26_CICD_and_Deployment.md)

---

## How This Works

These are the last challenges in the bootcamp, and they're deliberately less "run it in DartPad" and more "reason like an engineer shipping to real users" — writing a workflow file from scratch, tracing a version number through a real release, and diagnosing the specific kind of bug that only shows up in CI, never on your own machine.

---

### W26-1 (Medium) — Write a GitHub Actions workflow from scratch, and justify the step order

**Problem:** without copying a template, write the YAML for a workflow that: checks out code, sets up Flutter, installs dependencies, runs static analysis, then runs tests.

```yaml
name: Flutter CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      # TODO: checkout, flutter setup, pub get, analyze, test — in the right order
```

**Task:** write the five steps. Then answer: why should `flutter analyze` run **before** `flutter test`, rather than after or in parallel? Think about cost and failure speed, not just convention.

<details><summary>Solution & Explanation</summary>

```yaml
    steps:
      - uses: actions/checkout@v4
      - uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.27.0'
          channel: 'stable'
      - run: flutter pub get
      - run: flutter analyze
      - run: flutter test --coverage
```

🔴 **Explanation:** `flutter analyze` is a **static** check — it reads your code without executing any of it, typically finishing in a few seconds even on a large codebase. `flutter test` actually **runs** every test, which means spinning up the Flutter test harness, executing real (simulated) code paths, and can easily take minutes on a large suite. Running `analyze` first means a trivial mistake (an unused import, a type error) fails the build in seconds rather than burning several minutes of CI compute time only to fail on a problem a much cheaper check would have caught instantly. This is the general CI principle **"fail fast, cheapest check first"** — the same reasoning behind why linters run before test suites and why unit tests (fast, isolated) typically run before integration tests (slow, need a full environment) in any well-ordered pipeline.

</details>

---

### W26-2 (Easy) — Version number arithmetic, and what the stores actually enforce

**Problem:** the current `pubspec.yaml` reads `version: 1.4.2+23`. For each release below, write the new version string:

1. A bugfix release (no new features, no UI changes)
2. A release adding a new "dark mode" feature, no breaking changes
3. A release with a significant redesign of the main navigation (a breaking UX change users will notice)
4. A rejected build that needs to be resubmitted unchanged (no code changes, just a resubmission after a store rejection for an unrelated metadata issue)

<details><summary>Answers</summary>

1. `1.4.3+24` — patch version bumps, build number always increments.
2. `1.5.0+24` — minor version bumps (new feature, backward compatible), patch resets to 0, build number increments.
3. `2.0.0+24` — major version bumps (significant enough to warrant signaling to users this is a meaningfully different app), minor and patch reset, build number increments.
4. `1.4.2+24` — **the user-facing version stays identical** (nothing changed for users), but the **build number must still increment** — this is the one people get wrong.

🔴 **Explanation:** `major.minor.patch` (semantic versioning) is entirely a human/marketing convention — nothing in Google Play or the App Store *enforces* what counts as a "major" change; it's genuinely your judgment call, though the industry convention (breaking/major, feature/minor, fix/patch) is worth following so version numbers communicate something real to users and other developers. The **build number** (`+24`), in sharp contrast, is enforced by both stores mechanically: Google Play and App Store Connect both reject an upload whose build number is not strictly greater than every previously uploaded build for that app — this is true even if you change nothing about the user-facing version, which is exactly case 4. Forgetting to bump the build number on a resubmission is a genuinely common real mistake that produces a confusing rejection from the store's upload tooling.

</details>

---

### W26-3 (Hard) — Diagnose "works on my machine, fails in CI"

**Problem:** a test that reliably passes locally and reliably fails in CI:

```dart
test('shows correct greeting for the time of day', () {
  final hour = DateTime.now().hour;
  final greeting = hour < 12 ? 'Good morning' : 'Good afternoon';
  expect(greeting, 'Good morning'); // fails in CI depending on WHEN the pipeline runs
});
```

**Task:** identify the exact root cause (it's not a Flutter or CI configuration issue — it's a property of the test itself). Fix it so the test is deterministic regardless of what time it actually runs.

<details><summary>Solution & Explanation</summary>

```dart
String greetingFor(int hour) => hour < 12 ? 'Good morning' : 'Good afternoon';

test('shows correct greeting for the time of day', () {
  expect(greetingFor(9), 'Good morning');   // 9am -> morning
  expect(greetingFor(15), 'Good afternoon'); // 3pm -> afternoon
});
```

🔴 **Explanation:** the original test calls `DateTime.now()` **inside the test itself** — its outcome depends entirely on the real-world clock at the exact moment the test happens to execute. Locally, you probably always run your tests during the workday (mornings), so it "always passes" — in CI, pipelines can trigger at any hour (a scheduled nightly build, a contributor in a different timezone pushing at 2am their time, a merge queue processing overnight), and the identical test fails for reasons that have nothing to do with a code bug. The fix is a general principle, not specific to this example: **extract the time-dependent logic into a pure function taking the "current time" as a parameter**, and test that pure function against specific, fixed inputs — the function itself no longer needs to know or care what time it actually is when the test runs. Any test whose outcome depends on the real wall clock, a random number generator without a fixed seed, or network conditions is a flaky test waiting to happen — not a "sometimes CI is weird" mystery.

</details>

---

### W26-4 (Medium) — Design a Fastlane lane with a manual production gate

**Problem:** the requirement: every merge to `develop` should auto-deploy to the Play Store's **internal testing track**, no human involved. Deploying to **production** (the real Play Store listing) should require a human to explicitly trigger it — never automatic.

**Task:** sketch the lane structure (pseudocode is fine, doesn't need to be runnable Fastlane syntax) satisfying both halves of the requirement. Then explain, concretely — not just "it's safer" — what specific failure mode the manual production gate prevents that full automation wouldn't.

<details><summary>Solution & Explanation</summary>

```ruby
# Automatic — runs on every merge to develop via CI trigger
lane :deploy_internal do
  gradle(task: 'bundle', build_type: 'Release')
  upload_to_play_store(track: 'internal')
end

# Manual — a human runs this deliberately, e.g. `fastlane deploy_production`,
# NEVER wired to a CI trigger on push/merge
lane :deploy_production do
  gradle(task: 'bundle', build_type: 'Release')
  upload_to_play_store(track: 'production', rollout: '0.1') # staged rollout, not 100% at once
end
```

**The concrete failure mode:** imagine a bug slips past CI's automated tests (tests can't catch everything — a subtle UX regression, a copy error, a pricing mistake) and gets merged to `develop`. With full automation to production, that bug reaches every user within minutes of the merge, with no human ever having looked at the actual build before it shipped. The manual gate means a person reviews the internal-track build first — actually opens the app, checks the release notes, confirms nothing looks wrong — **before** the one irreversible action (pushing to the store's production track, visible to potentially millions of users) happens. The `internal` track auto-deploy is safe to fully automate specifically because its blast radius is limited to your own testing team; `production`'s blast radius is your entire user base, and that asymmetry is exactly why one gets a human checkpoint and the other doesn't.

</details>

---

## Bonus Round — Mix It Up

Different formats, same topic. See [the full challenge-type roster](../00_CHALLENGE_TYPES.md) for what each icon means.

---

### 🐛 Bug Hunt — The Pipeline That Ships Broken Builds

```yaml
name: Flutter CI

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: subosito/flutter-action@v2
      - run: flutter pub get
      - run: flutter build appbundle --release
      - uses: actions/upload-artifact@v4
        with:
          name: android-release
          path: build/app/outputs/bundle/release/app-release.aab

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: subosito/flutter-action@v2
      - run: flutter pub get
      - run: flutter test
```

Both jobs run, both eventually show green on GitHub. A broken change — one that fails `flutter test` — got merged to `main` last week, and the broken `.aab` was still sitted in the workflow's artifacts, downloadable, despite the `test` job having correctly failed. What's structurally wrong with this workflow, given that `test` failing didn't stop `build` from producing (and uploading) an artifact?

<details><summary>Diagnosis & Fix</summary>

🔴 **Explanation:** `build` and `test` are two **completely independent jobs** with no relationship declared between them — by default, GitHub Actions runs all jobs in a workflow **in parallel**, unless you explicitly say otherwise. `test` failing doesn't stop `build` from running, because nothing told GitHub Actions that `build` should depend on `test` succeeding first. The fix is a `needs:` key:

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: subosito/flutter-action@v2
      - run: flutter pub get
      - run: flutter test

  build:
    needs: test # <-- build will NOT start until test succeeds
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: subosito/flutter-action@v2
      - run: flutter pub get
      - run: flutter build appbundle --release
      - uses: actions/upload-artifact@v4
        with:
          name: android-release
          path: build/app/outputs/bundle/release/app-release.aab
```

With `needs: test`, if `test` fails, `build` is automatically skipped entirely — no artifact gets produced or uploaded from a commit whose tests didn't pass. This is a genuinely common real-world CI misconfiguration: two jobs that *look* related because they're in the same file, but say nothing to the scheduler about actually depending on each other.

</details>

---

### 🎭 Two Truths and a Lie — Deployment Practices

**A.** A build number (the `+15` in `1.2.0+15`) must strictly increase with every single upload to a store, even between different tracks (internal, beta, production) of the same app.

**B.** Signing keystores and certificates should be committed directly into the git repository so CI workflows have reliable access to them.

**C.** `flutter build appbundle --release` and `flutter build apk --release` produce different file formats — the Play Store requires the `.aab` (App Bundle) for new app submissions, not a raw `.apk`.

<details><summary>Which one's the lie</summary>

**B is the lie**, and it's not a subtle one — signing keys and certificates are exactly the kind of secret this bootcamp's own git safety practices exist to prevent from ever reaching a commit. They belong in CI secrets (GitHub Actions' encrypted secrets, decoded to a file at build time via a step, then discarded) — never in the repository itself, where they'd be visible to anyone with read access, permanently present in git history even if later "removed" in a subsequent commit.

🔴 **Explanation:** A and C are both true and both worth knowing precisely. A matters because it's easy to assume build numbers only need to increase within one track — they actually need to strictly increase across every upload to the app, period, regardless of which track received the previous one. C is the reason [this week's core content](Week_26_CICD_and_Deployment.md) always shows `flutter build appbundle`, not `flutter build apk`, when the target is a real Play Store submission — the `.apk` format still has legitimate uses (direct sideloading, some CI artifact-testing setups) but isn't what the Play Store accepts for new app uploads.

</details>

---

### 🏗️ Build It Blind — Design a Three-Stage Pipeline

No YAML given. Spec only:

> Design (write, from scratch) a GitHub Actions workflow with three stages: a `test` job that must pass before anything else runs; a `build` job that, once tests pass, builds Android and iOS artifacts **in parallel with each other** (not one after the other — they don't depend on each other, only on `test`); and a `deploy` job that only runs when both builds succeed, only triggers on pushes to `main` (not on pull requests or other branches), and uploads to an internal testing track automatically with no manual approval step.

Think through the `needs:` graph on paper before writing any YAML — which jobs depend on which, and which can run concurrently.

<details><summary>One reasonable solution</summary>

```yaml
name: Flutter CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: subosito/flutter-action@v2
      - run: flutter pub get
      - run: flutter test

  build_android:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: subosito/flutter-action@v2
      - run: flutter build appbundle --release
      - uses: actions/upload-artifact@v4
        with: { name: android-release, path: build/app/outputs/bundle/release/app-release.aab }

  build_ios:
    needs: test
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: subosito/flutter-action@v2
      - run: flutter build ios --release --no-codesign

  deploy_internal:
    needs: [build_android, build_ios]
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    steps:
      - run: echo "Deploy to internal track — actual fastlane/upload steps here"
```

🔴 **Explanation:** the key structural insight — `build_android` and `build_ios` both list `needs: test` but **not** each other, which is exactly what makes GitHub Actions run them concurrently once `test` passes, rather than sequentially; jobs only wait for each other when one explicitly appears in the other's `needs:` list. `deploy_internal`'s `needs: [build_android, build_ios]` (a list, not a single value) means it waits for **both** to succeed, not just one. The `if: github.ref == 'refs/heads/main' && github.event_name == 'push'` condition is what stops this from also trying to deploy on every pull request — without it, opening a PR against `main` would trigger `test` and both builds (harmless, useful even) but also attempt an internal-track deploy from unmerged code, which is not what anyone wants.

</details>

---

## Bootcamp Complete

Every teaching week from Week 1 through Week 26 now has a hands-on challenge companion. If you've worked through even half of these seriously — actually solving before opening `<details>`, actually running the "prove it yourself" problems instead of taking the explanation on faith — you have a genuinely different relationship with this material than someone who only read the weekly content. That's the whole point.

**Next → [Week 27: Project — Chat App (Capstone)](Week_27_Project_ChatApp.md)**
