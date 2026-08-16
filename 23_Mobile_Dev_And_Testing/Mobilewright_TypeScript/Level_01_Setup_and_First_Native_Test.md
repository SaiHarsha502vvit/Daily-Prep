# Level 1 — Setup & Your First Native Test

### Companion track: [Mobilewright Native Testing with TypeScript](00_ROADMAP.md)

---

## Basics — What You're Actually Installing, and What It Isn't

[06_Mobilewright_Native_Testing.md](../06_Mobilewright_Native_Testing.md) already covered what Mobilewright is at a conceptual level — worth restating precisely before installing anything: it drives **real native UI** (Android Views, iOS UIKit/SwiftUI elements) through a platform driver, not a browser. This is the direct opposite of [Playwright_Mobile_TypeScript's](../Playwright_Mobile_TypeScript/00_ROADMAP.md) Levels 1-8, which never touched a real device at all. Every level in this track assumes a real device, emulator, or simulator connected — there's no "browser emulation" equivalent here to fall back on.

---

## Setup

```bash
npm install mobilewright @mobilewright/test
npm init mobilewright@latest
```

The init command scaffolds `mobilewright.config.ts` and an example test. A minimal config, built up piece by piece as this track progresses:

```typescript
// mobilewright.config.ts
import { defineConfig } from '@mobilewright/test';

export default defineConfig({
  timeout: 30_000,
  use: {
    platform: 'android', // or 'ios'
    bundleId: 'com.example.myapp',
    installApps: './build/app-debug.apk', // or .ipa/.zip for iOS
    deviceType: 'emulator', // 'simulator' | 'emulator' | 'real'
  },
});
```

Each field earns its place: `bundleId` is how Mobilewright identifies *which* installed app to launch and interact with — the same concept as Android's package name or iOS's bundle identifier, [already covered from the ADB/native-dev side in 02_Android_Native_Dev_And_Testing.md](../02_Android_Native_Dev_And_Testing.md). `installApps` points at the actual build artifact to install before tests run. `deviceType` distinguishes a simulator (iOS-only, runs as a Mac process), an emulator (Android, a genuine virtual device), or `real` (a physical device connected over USB/network).

---

## Concept — The `screen`/`device` Fixture Split, Restated With Purpose

```typescript
import { test, expect } from '@mobilewright/test';

test('app launches and shows home screen', async ({ screen }) => {
  await expect(screen.getByText('Welcome')).toBeVisible();
});

test('deep link opens profile', async ({ device, screen }) => {
  await device.openUrl('myapp://profile/123'); // device-level: environment control
  await expect(screen.getByText('Profile')).toBeVisible(); // screen-level: what's on screen
});
```

The split isn't arbitrary — `screen` is scoped to **what's currently rendered**: locators, actions, assertions all operate against the visible UI. `device` is scoped to **the environment the app runs in**: launching URLs, checking which app is in the foreground, and (from [06's coverage](../06_Mobilewright_Native_Testing.md)) attaching to a WebView. Reaching for the wrong one is usually obvious once you ask "am I asking about pixels on screen, or about the device itself" — but it's worth having that question explicit in your head from Level 1, not discovered by trial and error later.

---

## Real-World Problem — Running Your First Test Against a Real Emulator

```bash
# Confirm your environment is actually ready BEFORE writing tests —
# Level 12 covers this command in full; worth knowing it exists from day one
npx mobilewright doctor
```

```typescript
// tests/first-launch.spec.ts
import { test, expect } from '@mobilewright/test';

test('login screen appears on fresh launch', async ({ screen }) => {
  await expect(screen.getByLabel('Email')).toBeVisible();
  await expect(screen.getByLabel('Password')).toBeVisible();
  await expect(screen.getByRole('button', { name: 'Sign In' })).toBeVisible();
});
```

```bash
npx mobilewright test tests/first-launch.spec.ts
```

`mobilewright doctor` is worth running before your very first test, not after your first failure — it checks Node/npm/Git, Xcode and simulators (iOS), and Java/`ANDROID_HOME`/ADB/emulator (Android) in one pass, per Mobilewright's own troubleshooting documentation. A missing SDK path or an unauthorized device is a far more common Level-1 blocker than anything wrong with test code itself, and `doctor` catches it before you spend time debugging a test that was never going to run.

---

## Solution — Reading a Real Failure Message

The first test almost never passes on the first try — reading the failure correctly matters as much as writing the test:

```
Error: Timed out 5000ms waiting for locator.toBeVisible()
Locator: getByLabel('Email')

Call log:
  - checking visibility of getByLabel('Email')
  - element(s) not found
```

`element(s) not found` (not "found but not visible") tells you the search itself failed — the label text doesn't match, or the screen you expected isn't the one currently showing. This is a different failure than "found it, but it's not visible yet" (which would suggest a genuine timing issue). Reading which specific check failed — the same "exists → visible → enabled → stable" sequence [06 already covered](../06_Mobilewright_Native_Testing.md#auto-waiting--four-checks-every-action) — narrows the actual cause before you touch any code.

---

## Challenges

### 🐛 Bug Hunt — The Config That Installs the Wrong Build

```typescript
export default defineConfig({
  use: {
    platform: 'android',
    bundleId: 'com.example.myapp',
    installApps: './build/app-debug.apk',
  },
});
```

A teammate reports: "my tests pass locally but fail in CI with completely different UI text than what I see on my phone." Both environments use this exact config. What's the most likely explanation, given nothing about the config itself is syntactically wrong?

<details><summary>Diagnosis</summary>

🔴 **Explanation:** `installApps: './build/app-debug.apk'` is a **relative path** pointing at whatever happens to exist at that location when the test runs — it says nothing about *which version* of the app was built there. If the teammate's local machine has a stale, manually-built APK sitting in `./build/` from days ago, while CI freshly builds the app from the current commit before running tests, the two environments are genuinely testing two different app versions, despite identical Mobilewright config. This isn't a bug in the config — it's a build-pipeline ordering issue the config can't protect against on its own. The fix is procedural: always run the actual build step immediately before the test step in any environment (`npm run build:android && npx mobilewright test`, never relying on a previously-built artifact sitting around), and treat a stale local build directory as a first suspect whenever local and CI results diverge unexpectedly.

</details>

---

### 🎭 Two Truths and a Lie — Fixtures and Environment

**A.** `screen` and `device` are Mobilewright's only two built-in fixtures — there's no equivalent of a `page` fixture the way Playwright's test runner provides one.

**B.** `deviceType: 'simulator'` can be used in a config targeting Android, since "simulator" and "emulator" are interchangeable terms in Mobilewright's API.

**C.** `npx mobilewright doctor` checks both iOS and Android toolchains in one run, even if your config only targets one platform.

<details><summary>Which one's the lie</summary>

**B is the lie.** Per this level's own config table, `deviceType` distinguishes `'simulator'` (iOS-specific — a simulated device, Mac-only, per [06's own iOS/Android comparison content](../06_Mobilewright_Native_Testing.md)) from `'emulator'` (Android-specific — a genuinely virtualized device) — they are not interchangeable terms, they refer to platform-specific virtualization technologies with real behavioral differences (an iOS Simulator runs as a native Mac process; an Android emulator runs a full virtualized Android OS). Using `deviceType: 'simulator'` with `platform: 'android'` doesn't make sense and isn't how the two options are meant to combine.

🔴 **Explanation:** A is true — there is no `page` fixture in Mobilewright's model at all, because there's no browser DOM to represent one; `screen` is the closest analog, but it's scoped to native UI, not a webpage (the WebView bridge in [06](../06_Mobilewright_Native_Testing.md) is the one place an actual `page`-like object appears, and it's obtained explicitly via `.getByWebView().page()`, not injected as a top-level fixture). C is true and is exactly why running `doctor` early is worth doing regardless of which single platform you're targeting today — it surfaces problems in the *other* toolchain too, which matters the moment [Level 6's multi-platform config](Level_06_Multi_Platform_Project_Config.md) adds a second platform to the same suite.

</details>

---

**Next → [Level 2: Cross-Platform Locators](Level_02_Cross_Platform_Locators.md)**
