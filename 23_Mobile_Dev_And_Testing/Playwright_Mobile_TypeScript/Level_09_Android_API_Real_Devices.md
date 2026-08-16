# Level 9 — Android API: Real Devices

### Companion track: [Playwright Mobile Testing with TypeScript](00_ROADMAP.md) · Previous: [Level 8](Level_08_Geolocation_Permissions_Storage.md)

---

## Basics — A Genuinely Different Import, a Genuinely Different Target

Every level so far used `devices['Pixel 7']` — **browser emulation**, running entirely on your own machine, no real device involved. This level is the actual "real deal": Playwright's official (and, per its own docs, explicitly **experimental**) Android API, connecting to a **real Android device or emulator** over ADB — the exact daemon architecture covered in [DOC_07](../Flutter_Bootcamp/Reference/DOC_07_ADB_and_Dev_Tooling.md).

```typescript
// A different package entirely — not '@playwright/test'
import { _android as android } from 'playwright';

const [device] = await android.devices(); // enumerates connected devices via ADB
console.log(device.model(), device.serial());
```

Per Playwright's own documentation: *"Raw USB operation is not yet supported, so you need ADB."* Run `adb devices` before anything in this level — if it shows nothing, per [DOC_07's own triage rule](../Flutter_Bootcamp/Reference/DOC_07_ADB_and_Dev_Tooling.md#quick-reference--when-somethings-broken), this level's code won't find a device either, for the exact same underlying reason.

---

## Concept — Two Genuinely Different Capabilities in One API

The Android API does two things that have nothing to do with each other, and it's worth keeping them mentally separate:

```typescript
// 1. Shell access — raw ADB-equivalent commands
await device.shell('am force-stop com.example.myapp');
await device.shell('am start com.example.myapp/.MainActivity');

// 2. Native UI interaction — fill/press against Android VIEW elements,
//    using resource IDs the same way UIAutomator2 (Appium's own Android
//    driver, per DOC_09) would identify them
await device.fill({ res: 'com.example.myapp:id/username' }, 'testuser');
await device.press({ res: 'com.example.myapp:id/login_button' }, 'Enter');

// 3. A real Chrome browser, launched ON the device
const context = await device.launchBrowser();
const page = await context.newPage();
await page.goto('https://example.com');
```

**Why capability 2 matters, and why it's easy to overlook:** this isn't WebView-only — `device.fill()`/`device.press()` interact with genuine native Android View elements, the same accessibility-tree-based targeting Appium's UIAutomator2 driver uses (per [DOC_09's Appium content](../Flutter_Bootcamp/Reference/DOC_09_Mobile_Debugging_Toolkit.md#2-element-not-found-nosuchelementexception)). Playwright's Android API genuinely overlaps with what Appium does for native automation, in addition to what it does for WebView/browser automation — it's just far less mature and far more narrowly scoped than Appium's actual driver ecosystem.

---

## Real-World Problem — Screenshotting a Real Device Mid-Test

```typescript
import { _android as android } from 'playwright';
import { test, expect } from '@playwright/test';

test('login flow works on a real connected device', async () => {
  const [device] = await android.devices();

  await device.shell('am force-stop com.example.myapp');
  await device.shell('am start com.example.myapp/.MainActivity');

  await device.fill({ res: 'com.example.myapp:id/username' }, 'testuser');
  await device.fill({ res: 'com.example.myapp:id/password' }, 'testpass');
  await device.press({ res: 'com.example.myapp:id/login_button' }, 'Enter');

  // Device needs to be awake to screenshot — Playwright's own docs are explicit about this
  const screenshotBuffer = await device.screenshot();
  // (compare against a baseline manually, or wrap in Level 11's toHaveScreenshot pattern
  //  once you're back in browser-context land)

  await device.close();
});
```

**A real, documented caveat worth internalizing now, not discovering later:** *"Device needs to be awake to produce screenshots."* If a test that ran fine minutes ago suddenly fails to screenshot, check whether the device's screen has simply timed out and locked — a mundane, physical-device-specific failure mode that has nothing to do with your test logic at all.

---

## Solution — Where This Fits, Honestly

Per Playwright's own documentation: *"We didn't run all the tests against the device, so not everything works."* This is not production-hardened the way core Playwright is. The honest scoping, matching [06_Mobilewright_Native_Testing.md's own decision table](../06_Mobilewright_Native_Testing.md#deciding-between-mobilewright-appium-and-playwright-for-web):

| You need... | Reach for... |
|---|---|
| Fast, deterministic mobile-*shaped* testing, no real device required | Levels 1-8 of this track — browser emulation |
| A real device, and you're already fully invested in Playwright elsewhere | This API, accepting its experimental status |
| Real device, native UI, production-grade maturity and ecosystem | Appium ([DOC_09](../Flutter_Bootcamp/Reference/DOC_09_Mobile_Debugging_Toolkit.md)) |
| Real device, native UI, Playwright-familiar syntax, cross-platform (iOS too) | [Mobilewright](../06_Mobilewright_Native_Testing.md) |

---

## Challenges

### 🐛 Bug Hunt — The Screenshot That Returns a Black Image

```typescript
test('captures the home screen', async () => {
  const [device] = await android.devices();
  await new Promise(resolve => setTimeout(resolve, 30_000)); // wait for something else to finish
  const buffer = await device.screenshot();
  // buffer is a valid PNG, but it's entirely black
});
```

Using [this level's own caveat](#real-world-problem--screenshotting-a-real-device-mid-test), diagnose the black screenshot without assuming the test code itself is wrong.

<details><summary>Diagnosis</summary>

🔴 **Explanation:** a 30-second unconditional wait is long enough for most phones' default screen-timeout setting to lock the device — and per this level's own quoted caveat, *"Device needs to be awake to produce screenshots."* A locked screen isn't blank in the sense of showing nothing; a locked Android screen is a real black state Playwright is still able to technically capture, it's just not the content anyone intended to test. This isn't a bug in the test's logic at all — it's a physical device setting colliding with test timing. Fixes: `device.shell('input keyevent KEYCODE_WAKEUP')` before the screenshot, or the more robust fix, disabling screen-timeout entirely on the test device (`adb shell settings put system screen_off_timeout 1800000` for 30 minutes) so this class of failure can't happen mid-suite at all.

</details>

---

### 🎭 Two Truths and a Lie — Android API Scope

**A.** `device.fill()` and `device.press()` interact with genuine native Android View elements via resource IDs, the same targeting mechanism Appium's UIAutomator2 driver uses — not just WebView content.

**B.** Playwright's Android API is a stable, fully-supported part of the framework with the same production reliability guarantees as regular browser automation.

**C.** `device.launchBrowser()` returns a real `BrowserContext` you can call `.newPage()` on, behaving like any other Playwright context from that point forward.

<details><summary>Which one's the lie</summary>

**B is the lie** — Playwright's own docs are explicit that this API is experimental, with real, named limitations (device-must-be-awake for screenshots, incomplete internal test coverage). Treat it as genuinely useful for what it does, not as carrying the same reliability bar as `page.goto()` in a normal browser test.

🔴 **Explanation:** A is true and is [this level's Concept section](#concept--two-genuinely-different-capabilities-in-one-api)'s central point — this API isn't WebView-only. C is also true — once you have a `BrowserContext` from `launchBrowser()`, everything from [Levels 1-8](Level_01_Setup_and_First_Mobile_Test.md) applies normally: locators, assertions, network interception, the works.

</details>

---

**Next → [Level 10: Hybrid WebView Testing](Level_10_Hybrid_WebView_Testing.md)**
