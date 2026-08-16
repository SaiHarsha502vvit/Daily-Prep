# Level 13 — Capstone: Cross-Platform CI Pipeline

### Companion track: [Mobilewright Native Testing with TypeScript](00_ROADMAP.md) · Previous: [Level 12](Level_12_Docker_Cloud_Devices_and_Troubleshooting.md)

---

## What This Level Actually Is

No new API. Every piece below is something a previous level already taught — this level's only job is wiring twelve levels' worth of separate skills into one real, working GitHub Actions pipeline, and being precise about which platform can run where, since [Level 12 already established](Level_12_Docker_Cloud_Devices_and_Troubleshooting.md#concept--two-genuinely-different-device-sourcing-strategies) that this isn't a symmetric choice between Android and iOS.

---

## The Honest Boundary First — Android and iOS Don't Get the Same CI Story

Per [Level 12's own comparison table](Level_12_Docker_Cloud_Devices_and_Troubleshooting.md#real-world-problem--choosing-between-the-two-for-a-real-ci-pipeline):

- **Android** can run on a standard `ubuntu-latest` GitHub-hosted runner, using a real, hardware-accelerated emulator — GitHub's Linux runners support KVM, and community actions (`reactivecircus/android-emulator-runner`) wrap the emulator-boot process for CI use. No Docker, no cloud dependency required.
- **iOS** has exactly two viable options, and only two: `macos-latest` runners (which have a real Simulator available natively, no special setup) or a cloud device provider (`MobileNextDriver`, from [Level 12's config](Level_12_Docker_Cloud_Devices_and_Troubleshooting.md#concept--two-genuinely-different-device-sourcing-strategies)) — a Linux runner running iOS tests through a Docker container is not a third option, because [Level 12 already established](Level_12_Docker_Cloud_Devices_and_Troubleshooting.md#-bug-hunt--assuming-docker-solves-an-ios-problem-it-structurally-cant) that's structurally impossible regardless of configuration.

This capstone's pipeline runs Android on `ubuntu-latest` (cheaper, GitHub-hosted, no extra billing) and iOS on `macos-latest` (real Simulator, still GitHub-hosted, just a pricier runner class) — the honest default for a project not yet needing a cloud device farm at all.

---

## The Complete Workflow

```yaml
# .github/workflows/mobile-native-tests.yml
name: Mobilewright Native Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  android:
    timeout-minutes: 30
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      # Level 7's sharding — split Android's suite across 2 parallel jobs
      matrix:
        shard: [1/2, 2/2]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run build:android # produces ./build/android/app-debug.apk fresh, every run

      # Hardware-accelerated emulator on a standard Linux runner —
      # no Docker, no cloud device needed for Android specifically
      - name: Run Android emulator and tests
        uses: reactivecircus/android-emulator-runner@v2
        with:
          api-level: 34
          script: npx mobilewright test --project=android --shard=${{ matrix.shard }}

      - name: Upload failure screenshots
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: android-failure-screenshots-${{ strategy.job-index }}
          path: test-results/**/*.png
          retention-days: 7

  ios:
    timeout-minutes: 30
    runs-on: macos-latest
    strategy:
      fail-fast: false
      matrix:
        shard: [1/2, 2/2]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run build:ios # produces ./build/ios/MyApp.app fresh, every run

      # Real iOS Simulator, native to macos-latest — no cloud device,
      # no Docker; this is the ONE runner class that gets this for free
      - name: Run tests against iOS Simulator
        run: npx mobilewright test --project=ios --shard=${{ matrix.shard }}

      - name: Upload failure screenshots
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: ios-failure-screenshots-${{ strategy.job-index }}
          path: test-results/**/*.png
          retention-days: 7
```

---

## Walking Through the Non-Obvious Parts

**Two separate `runs-on` values, not one matrix with a `platform` dimension:** it's tempting to fold `android`/`ios` into the *same* matrix, the way [the Playwright track's capstone](../Playwright_Mobile_TypeScript/Level_13_Capstone_CICD_Pipeline.md) folds device projects into one matrix — but here, Android and iOS genuinely need **different runner operating systems** (`ubuntu-latest` vs `macos-latest`), which a single matrix's `runs-on` can express (`runs-on: ${{ matrix.os }}`), but doing so would obscure the actual reason they differ: it's not an arbitrary config choice the way three browser/device projects are in the Playwright track — it's the structural Linux-can't-run-iOS-Simulator boundary from [Level 12](Level_12_Docker_Cloud_Devices_and_Troubleshooting.md#concept--two-genuinely-different-device-sourcing-strategies). Two explicit jobs make that boundary visible in the workflow file itself, rather than hidden inside a matrix array.

**`npm run build:android` / `build:ios` run fresh every time, right before the test step:** this is [Level 1's own Bug Hunt](Level_01_Setup_and_First_Native_Test.md#-bug-hunt--the-config-that-installs-the-wrong-build) taken seriously at the CI level — `installApps` pointing at a relative path is only safe if that path is guaranteed fresh, and the only way to guarantee that in CI is building immediately before testing, every run, never relying on a cached or previously-built artifact.

**`fail-fast: false` on both jobs:** same reasoning as the Playwright capstone — a single flaky shard shouldn't cancel the other shard's still-useful, in-progress results.

**No visual-regression step:** per [Level 9](Level_09_Screenshots_and_Missing_Visual_Regression.md#basics--screenscreenshot-captures-pixels-it-doesnt-compare-them), there's no built-in comparison assertion to run in CI — the pipeline instead uploads failure screenshots for human review, the lighter pattern [Level 9's own Solution section](Level_09_Screenshots_and_Missing_Visual_Regression.md#solution--deciding-whether-full-visual-regression-is-worth-building-yet) described, not a fabricated `toHaveScreenshot()`-style step that doesn't actually exist.

---

## Challenges

### 🐛 Bug Hunt — Collapsing Two Jobs Into One Matrix, Incorrectly

```yaml
jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        include:
          - os: ubuntu-latest
            project: android
          - os: ubuntu-latest
            project: ios
    steps:
      - run: npx mobilewright test --project=${{ matrix.project }}
```

The `android` entry passes. The `ios` entry fails immediately in CI, every single run, with no clear test-level error. Using [this level's own Honest Boundary section](#the-honest-boundary-first--android-and-ios-dont-get-the-same-ci-story), diagnose the mistake.

<details><summary>Diagnosis & Fix</summary>

🔴 **Explanation:** both matrix entries were given `os: ubuntu-latest` — the `ios` entry needed `os: macos-latest` to have any Simulator available at all, and this is exactly [Level 12's own Bug Hunt](Level_12_Docker_Cloud_Devices_and_Troubleshooting.md#-bug-hunt--assuming-docker-solves-an-ios-problem-it-structurally-cant) recurring at the CI-matrix level instead of the Docker level — a copy-paste matrix entry that changed `project` but forgot `os` needed to change too. The fix:

```yaml
strategy:
  matrix:
    include:
      - os: ubuntu-latest
        project: android
      - os: macos-latest
        project: ios
```

The general lesson repeats across two levels now for a reason: **Android/iOS parity in test *code* (thanks to Level 2's locator normalization) doesn't extend to parity in CI *infrastructure requirements*** — every place a config or workflow names a platform, the platform-specific infrastructure it actually needs has to be checked explicitly, not assumed symmetric.

</details>

---

### 👹 Boss Battle — Design the Missing Piece: Cloud Devices as a Cost/Coverage Tradeoff

**The spec:** this capstone's pipeline uses `macos-latest` for iOS, which works but is a pricier GitHub-hosted runner class than `ubuntu-latest`, and only tests against whatever iOS Simulator version ships with that runner image — not a spread of real, older physical devices. Design a **separate**, `workflow_dispatch`-triggered job (manually triggered, not on every push) that runs the existing iOS test suite against `MobileNextDriver` cloud devices instead, covering a real-device matrix the Simulator alone can't. Explain why this should be manually triggered rather than running on every PR the way the two main jobs do.

<details><summary>One reasonable design</summary>

```yaml
  ios-real-device-coverage:
    timeout-minutes: 25
    runs-on: ubuntu-latest # cloud driver — doesn't need macOS at all
    if: github.event_name == 'workflow_dispatch'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run build:ios
      - name: Run against real device cloud
        env:
          MOBILE_NEXT_API_KEY: ${{ secrets.MOBILE_NEXT_API_KEY }}
        run: npx mobilewright test --project=ios-cloud-devices
```

```yaml
on:
  push: { branches: [main] }
  pull_request: { branches: [main] }
  workflow_dispatch: {} # adds a manual "Run workflow" button in GitHub's UI
```

🔴 **Explanation:** manual triggering, rather than running on every PR, comes down to the same cost/frequency reasoning [the Playwright capstone's Boss Battle](../Playwright_Mobile_TypeScript/Level_13_Capstone_CICD_Pipeline.md#-boss-battle--design-the-missing-piece-real-device-coverage-as-a-separate-job) already established for its own real-device job: cloud device minutes are typically metered and billed, unlike GitHub-hosted runner minutes, so running this on every single PR push would scale cost with commit frequency rather than with actual need. A genuinely useful cadence is closer to "run before a release" or "run when someone specifically wants broader real-device confidence" — both of which `workflow_dispatch`'s manual button, or alternatively a scheduled nightly run, serve far better than an unconditional per-PR trigger. Worth noting explicitly: this job runs on `ubuntu-latest`, not `macos-latest` — because [Level 12's config](Level_12_Docker_Cloud_Devices_and_Troubleshooting.md#basics--ghcriomobile-nextmobilewright-what-docker-actually-buys-you-here) showed `MobileNextDriver` connects to devices over the network, meaning the CI runner itself never needs to run iOS Simulator locally at all — the cloud provider's actual device does that job, which is precisely why this option exists as the answer for iOS-on-Linux in the first place.

</details>

---

## Track Complete

Thirteen levels, from `npm init mobilewright@latest` to a real, platform-aware CI pipeline. This track leaned harder than most on naming genuine gaps — no built-in visual regression, no custom-fixture API, the hard Linux/iOS wall — deliberately, because knowing exactly where a tool's documented capability ends is what separates fluency from having memorized a happy path. If you've typed out and run the code in each level against a real device or simulator, not just read it, that's the actual skill this track was built to produce.

**→ Related:** [00_ROADMAP.md](00_ROADMAP.md) · [06_Mobilewright_Native_Testing.md](../06_Mobilewright_Native_Testing.md) · [Playwright_Mobile_TypeScript/00_ROADMAP.md](../Playwright_Mobile_TypeScript/00_ROADMAP.md) · [Flutter_Bootcamp/Reference/DOC_09_Mobile_Debugging_Toolkit.md](../Flutter_Bootcamp/Reference/DOC_09_Mobile_Debugging_Toolkit.md)
