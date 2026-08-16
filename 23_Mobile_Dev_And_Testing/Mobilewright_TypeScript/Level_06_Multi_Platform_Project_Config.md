# Level 6 — Multi-Platform Project Config

### Companion track: [Mobilewright Native Testing with TypeScript](00_ROADMAP.md) · Previous: [Level 5](Level_05_Deep_Links_and_Cross_App_Flows.md)

---

## Basics — From One `use` Block to a `projects` Array

[Level 1's config](Level_01_Setup_and_First_Native_Test.md#setup) had a single top-level `use` block, hardcoded to one platform. Real apps ship on both — the config scales up the same way Playwright's own multi-browser config does:

```typescript
// mobilewright.config.ts
import { defineConfig } from '@mobilewright/test';

export default defineConfig({
  timeout: 30_000,
  projects: [
    {
      name: 'android',
      use: {
        platform: 'android',
        bundleId: 'com.example.myapp',
        installApps: './build/android/app-debug.apk',
        deviceType: 'emulator',
      },
    },
    {
      name: 'ios',
      use: {
        platform: 'ios',
        bundleId: 'com.example.myapp',
        installApps: './build/ios/MyApp.app',
        deviceType: 'simulator',
      },
    },
  ],
});
```

```bash
npx mobilewright test                  # runs every project
npx mobilewright test --project=android # runs just one
```

---

## Concept — Why Most Test Files Need Zero Platform-Specific Code

This is where [Level 2's cross-platform locator normalization](Level_02_Cross_Platform_Locators.md#basics--what-getbyrole-actually-normalizes) actually pays off structurally, not just conceptually: because `getByRole('textfield')` already means the same thing on both platforms, **the exact same test file runs, unmodified, against both projects.** There's no `if (platform === 'android')` branch needed anywhere in the common case — the `projects` array is what actually runs the shared file twice, once per platform, not a code-level fork.

```typescript
// tests/login.spec.ts — this file has ZERO platform-specific code,
// and runs correctly under both the 'android' and 'ios' projects
import { test, expect } from '@mobilewright/test';

test('user can log in with valid credentials', async ({ screen }) => {
  await screen.getByRole('textfield', { name: 'Email' }).fill('user@example.com');
  await screen.getByRole('textfield', { name: 'Password' }).fill('correct-password');
  await screen.getByRole('button', { name: 'Sign In' }).tap();
  await expect(screen.getByText('Welcome back')).toBeVisible();
});
```

---

## Real-World Problem — The One Test That Genuinely Needs to Branch

Some behavior really is platform-specific — a permission dialog's exact system wording, or a hardware-button interaction that only exists on one OS. Branching for a real difference is legitimate; the discipline is keeping it to the one test that actually needs it:

```typescript
import { test, expect } from '@mobilewright/test';

test('location permission prompt shows platform-correct wording', async ({ screen }, testInfo) => {
  await screen.getByRole('button', { name: 'Enable Location' }).tap();

  if (testInfo.project.name === 'android') {
    await expect(screen.getByText('Allow MyApp to access this device\'s location?')).toBeVisible();
  } else {
    await expect(screen.getByText('"MyApp" Would Like to Use Your Location')).toBeVisible();
  }
});
```

`testInfo.project.name` reads back whichever `name` field the currently-running project declared in config — the same mechanism Playwright's own multi-browser suites use to branch only where a real difference exists, never as a default habit.

---

## Solution — Config-Level Differences vs Code-Level Differences

The `projects` array is the right place for anything that's a genuine **environment** difference (which build artifact, which platform, which device type) — `testInfo.project.name` branching inside a test is the right place only for genuine **behavioral** differences the app itself exhibits per platform. Mixing the two — hardcoding a platform check into config, or duplicating a whole test file per platform instead of trusting the shared-file model — throws away the exact benefit [this level's Concept section](#concept--why-most-test-files-need-zero-platform-specific-code) just established:

```typescript
// WRONG — duplicating the whole file defeats the purpose of the projects array
// tests/login.android.spec.ts and tests/login.ios.spec.ts, nearly identical

// RIGHT — one file, shared, running under both projects automatically;
// branch only the specific assertion that's genuinely platform-different,
// exactly as this level's Real-World Problem did
```

---

## Challenges

### 🐛 Bug Hunt — The iOS Project That Tries to Install an Android Build

```typescript
export default defineConfig({
  projects: [
    {
      name: 'android',
      use: { platform: 'android', bundleId: 'com.example.myapp', installApps: './build/app-debug.apk', deviceType: 'emulator' },
    },
    {
      name: 'ios',
      use: { platform: 'ios', bundleId: 'com.example.myapp', installApps: './build/app-debug.apk', deviceType: 'simulator' },
    },
  ],
});
```

Running `npx mobilewright test --project=ios` fails immediately, before any test logic runs. Using [this level's own Basics config](#basics--from-one-use-block-to-a-projects-array), what's wrong?

<details><summary>Diagnosis & Fix</summary>

🔴 **Explanation:** both projects point `installApps` at the exact same path, `./build/app-debug.apk` — an Android APK build artifact. The `ios` project's `deviceType: 'simulator'` needs an iOS `.app` bundle (or `.ipa`), not an `.apk` — these are entirely different, platform-specific build output formats, and attempting to install an APK onto an iOS Simulator fails structurally, not from any test-writing mistake. This is a copy-paste config error — the `ios` project block was likely cloned from the `android` one without updating the build artifact path. The fix, matching [this level's Basics example](#basics--from-one-use-block-to-a-projects-array) exactly:

```typescript
{
  name: 'ios',
  use: { platform: 'ios', bundleId: 'com.example.myapp', installApps: './build/ios/MyApp.app', deviceType: 'simulator' },
}
```

The general lesson: when adding a second project by duplicating the first, every field that's build-artifact-specific (`installApps`, and potentially `deviceType`) needs deliberate review — only `bundleId` (assuming the same app ID across platforms) and shared top-level options like `timeout` are safe to leave identical.

</details>

---

### 🎭 Two Truths and a Lie — Projects and Branching

**A.** `testInfo.project.name` is only readable inside a test function — it can't influence which build artifact gets installed, since that decision already happened before the test started.

**B.** Running `npx mobilewright test` with no `--project` flag runs every project defined in the config, one after another (or in parallel, depending on worker config).

**C.** A test file that never references `testInfo.project.name` and never branches on platform is proof that file is somehow platform-agnostic and doesn't really need to run against both projects.

<details><summary>Which one's the lie</summary>

**C is the lie.** A test file having zero platform-specific branches doesn't mean it's *safe to skip* running against one platform — it means the test author expects the same behavior on both, which is exactly the case [this level's Concept section](#concept--why-most-test-files-need-zero-platform-specific-code) described as the *common* case, not a reason to only run it once. Running it against both projects is precisely what catches the case where an assumption of "this behaves the same everywhere" turns out to be wrong on one platform — skipping a platform because a file "looks platform-agnostic" defeats the actual value of having two projects in the first place.

🔴 **Explanation:** A is true — by the time a test function runs, `installApps` and `deviceType` have already been consumed to prepare the environment; `testInfo.project.name` is read-only information about which project is currently executing, not a lever a test can pull to change setup retroactively. B is true and is the entire mechanical point of the `projects` array — it's what actually causes one shared test file to execute twice, once per platform, without any code duplication.

</details>

---

**Next → [Level 7: Sharding for CI Speed](Level_07_Sharding_for_CI_Speed.md)**
