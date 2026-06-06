# 01. Playwright vs Appium — Full Comparison

**Navigation**: [📚 Index](00_INDEX.md) | [Android Native →](02_Android_Native_Dev_And_Testing.md)

> **Reading contract**: This file teaches you HOW each tool works at the engine level, WHEN to use each one, and WHERE they overlap. By the end you will have a mental model that lets you pick the right tool for any mobile testing scenario — and explain that decision in an interview.

---

## Table of Contents

1. [The Two Worlds of Mobile Apps](#1-the-two-worlds-of-mobile-apps)
2. [How Playwright Works Under the Hood](#2-how-playwright-works-under-the-hood)
3. [How Appium Works Under the Hood](#3-how-appium-works-under-the-hood)
4. [Side-by-Side Architecture Comparison](#4-side-by-side-architecture-comparison)
5. [What Each Tool Can and Cannot Do](#5-what-each-tool-can-and-cannot-do)
6. [Decision Tree — Which Tool for Which Job](#6-decision-tree--which-tool-for-which-job)
7. [Playwright for Mobile Web — Practical Guide](#7-playwright-for-mobile-web--practical-guide)
8. [Appium for Native Apps — Practical Guide](#8-appium-for-native-apps--practical-guide)
9. [Where They Work Together](#9-where-they-work-together)
10. [Interview Questions on This Topic](#10-interview-questions-on-this-topic)

---

## 1. The Two Worlds of Mobile Apps

Before you pick a testing tool, you need to understand what KIND of app you are testing. This is the most important thing in this file because it determines everything else.

### The Three Types of Mobile Apps

```
┌──────────────────────────────────────────────────────────────────────┐
│                     MOBILE APP TYPES                                 │
├──────────────────┬───────────────────────┬───────────────────────────┤
│   NATIVE APP     │    HYBRID APP         │    MOBILE WEB APP         │
├──────────────────┼───────────────────────┼───────────────────────────┤
│ Written in       │ Web app wrapped in    │ Website running in        │
│ platform-native  │ a native shell        │ mobile browser            │
│ language         │ (WebView inside)      │ (Chrome/Safari)           │
│                  │                       │                           │
│ Android → Kotlin │ Capacitor, Ionic,     │ Your React/Vue/HTML       │
│ iOS → Swift      │ React Native (partly) │ site on phone             │
│ Flutter → Dart   │ Cordova, PhoneGap     │                           │
├──────────────────┼───────────────────────┼───────────────────────────┤
│ UI built with    │ UI built with HTML/   │ UI is pure HTML/CSS/JS    │
│ native widgets   │ CSS but wrapped in    │ rendered by browser       │
│ (View, Widget,   │ native container      │                           │
│ UIView)          │                       │                           │
├──────────────────┼──────────────────────-┼───────────────────────────┤
│ Test with:       │Test with:             │ Test with:                │
│ Espresso (And)   │Playwright (WebView)   │ Playwright ✅            │
│ XCUITest (iOS)   │+ Appium (native shell)│ (best choice)             │
│ Flutter test     │                       │                           │
│ Appium (all)     │                       │                           │
└──────────────────┴──────────────────────-┴───────────────────────────┘
```

### Why Does This Matter?

**A native app does NOT use HTML**. Its buttons, text fields, and lists are built from platform-specific UI components. You cannot "inspect" them like a DOM element in a browser. You need a tool that speaks the platform's native accessibility tree — that is Appium (or Espresso/XCUITest).

**A mobile web app IS HTML running in a browser**. Playwright is a browser automation tool — it is perfect here.

**A hybrid app** has BOTH: a native shell (buttons, navigation drawer, camera access) and a WebView (a Chrome/Safari browser embedded in the app). You need Playwright for the web parts and Appium for the native shell parts.

---

### 🎯 Practice — Level 1

**Question**: A banking app has a native login screen (biometric + PIN), then after login shows a `WebView` rendering a web dashboard. Which tool(s) would you use and why?

<details><summary>Answer</summary>

You need **two tools**:

1. **Appium** for the login screen — it is a native screen with native UI components (biometric prompt, PIN pad). You cannot reach those elements with a browser automation tool.

2. **Playwright** for the dashboard — once inside the WebView, it is HTML/CSS/JavaScript running inside a Chrome WebView (on Android) or WKWebView (on iOS). Playwright can connect to it via Chrome DevTools Protocol (CDP) and interact with it exactly like a regular web page.

The boundary is: everything before the WebView loads = Appium; everything inside the WebView = Playwright (or Appium with `context: 'WEBVIEW'` switch).

</details>

---

**Question**: Your e-commerce company has a progressive web app (PWA) — customers use it in Chrome on Android. Which tool is correct?

<details><summary>Answer</summary>

**Playwright only**. A PWA is a website. It runs inside Chrome on Android. There are no native UI elements. Playwright can:
- Emulate any Android device (Pixel 6, Samsung Galaxy S21) — viewport, screen density, touch events
- Test offline mode (`context.setOffline(true)`)
- Test install prompt behavior
- Test notifications
- Run against real Chrome on Android via `playwright-android`

Appium would be overkill and unnecessary complexity here.

</details>

---

## 2. How Playwright Works Under the Hood

### The Core: Chrome DevTools Protocol (CDP)

Playwright is fundamentally a **CDP client**. CDP is a debugging protocol built into Chrome/Chromium (and Firefox/WebKit have their own equivalents). It gives programmatic access to:
- DOM manipulation
- JavaScript execution
- Network interception
- Screenshots
- Console output
- Cookie/storage management

```
YOUR TEST CODE
     │
     │ Playwright API (TypeScript/Python/Java/etc.)
     ▼
PLAYWRIGHT CORE (Node.js process)
     │
     │ WebSocket connection
     │ Chrome DevTools Protocol (CDP)
     ▼
BROWSER (Chrome / Firefox / WebKit)
     │
     │ Renders your web page
     ▼
YOUR WEB APP (HTML / CSS / JavaScript)
```

### Mobile Emulation — What Actually Happens

When you tell Playwright "emulate an iPhone 14", it does NOT launch an iOS simulator. It tells Chrome to:
1. Set the viewport to 390×844 pixels
2. Set the User-Agent string to an iPhone's UA
3. Set the device pixel ratio to 3
4. Enable touch events instead of mouse events
5. Set screen orientation

```typescript
// What this code actually does to Chrome:
const iPhone14 = devices['iPhone 14'];
const context = await browser.newContext({
  ...iPhone14,
  // This expands to:
  // userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0...'
  // viewport: { width: 390, height: 844 }
  // deviceScaleFactor: 3
  // isMobile: true
  // hasTouch: true
});
```

**Key insight**: Playwright mobile emulation is browser emulation, not device emulation. You are testing how Chrome renders your app under "phone conditions". The operating system is still your laptop's OS. There is no actual iOS or Android present.

### Playwright for Android (The Real Deal — Experimental)

There is a separate module called `playwright-android` that connects to a REAL Chrome browser running on a REAL Android device (or Android emulator) via ADB (Android Debug Bridge). This is different from emulation.

```
YOUR TEST CODE
     │
     │ playwright-android API
     ▼
PLAYWRIGHT-ANDROID (Node.js)
     │
     │ ADB (Android Debug Bridge)
     ▼
ANDROID DEVICE (real or emulated)
     │
     │ Chrome for Android
     │ Chrome DevTools Protocol (CDP) over ADB
     ▼
YOUR WEB APP (running in Chrome on Android)
```

**Still Chrome only** — playwright-android only controls Chrome (not Safari/Firefox/native apps). This is marked experimental as of 2024.

---

### 🎯 Practice — Level 1

**Question**: Your Playwright test uses `devices['Galaxy S21']`. Your colleague says "this test runs on a real Samsung phone". Is he right?

<details><summary>Answer</summary>

**No**. `devices['Galaxy S21']` is a device descriptor — it sets the viewport, User-Agent, touch events, and pixel ratio to match a Galaxy S21. But the test runs in Chrome on your laptop (or CI runner), not on a Samsung phone.

The only way Playwright runs on a real Android device is via `playwright-android` (connecting via ADB to Chrome on the device). Standard `devices` emulation is purely browser-level.

This matters: some mobile bugs only appear on real devices (GPU rendering differences, specific touch drivers, memory pressure, OS-level permissions). Emulation catches layout and logic bugs; real device testing catches everything else.

</details>

---

## 3. How Appium Works Under the Hood

### The Core: WebDriver Protocol + Platform Drivers

Appium is an HTTP server that implements the **WebDriver W3C protocol**. Your test code sends HTTP requests to Appium; Appium translates them into platform-specific commands and passes them to a **driver** that actually controls the device.

```
YOUR TEST CODE (any language)
     │
     │ HTTP requests (WebDriver W3C protocol)
     │ e.g. POST /session/{id}/element (find element)
     │      POST /session/{id}/element/{id}/click
     ▼
APPIUM SERVER (Node.js HTTP server, port 4723)
     │
     │ Routes to the correct driver based on desired capabilities
     ▼
┌────────────────────────────────────────┐
│           APPIUM DRIVERS               │
├─────────────────┬──────────────────────┤
│ UIAutomator2    │ XCUITest Driver      │
│ (Android)       │ (iOS)                │
├─────────────────┼──────────────────────┤
│ Espresso Driver │ Flutter Driver       │
│ (Android)       │ (Android + iOS)      │
├─────────────────┼──────────────────────┤
│ Gecko Driver    │ Safari Driver        │
│ (Firefox)       │ (iOS Safari)         │
└─────────────────┴──────────────────────┘
     │
     ▼
REAL DEVICE or EMULATOR / SIMULATOR
```

### The UIAutomator2 Driver (Android)

UIAutomator2 is Google's accessibility testing framework. It speaks to Android's **accessibility tree** — a hierarchical representation of every UI element on screen, including:
- Button text
- Content descriptions
- Resource IDs
- Element bounds (x, y, width, height)

```
Android Screen
     │
     │ Android Accessibility Framework
     ▼
Accessibility Tree:
  FrameLayout
    └─ LinearLayout (id: com.myapp:id/main_container)
        ├─ TextView (text: "Welcome back, Harsha")
        ├─ EditText (content-desc: "Username field")
        └─ Button (text: "Login", id: com.myapp:id/btn_login)
             │
             │ UIAutomator2 can click/find/assert any of these
             ▼
         Appium Server → Your Test Code
```

**This is why Playwright cannot test native apps**: native apps do not have a DOM. They have an accessibility tree. Playwright only knows how to talk to a DOM via CDP. UIAutomator2 knows how to talk to the accessibility tree via Android's accessibility framework.

### The XCUITest Driver (iOS)

On iOS, it is the same concept but Apple's framework:
- XCUITest is Apple's own UI testing framework (used in Xcode)
- Appium's XCUITest driver wraps XCUITest and exposes it over the WebDriver protocol
- Your Appium test code → HTTP → Appium server → XCUITest framework → iOS Simulator or real device

---

### 🎯 Practice — Level 1

**Question**: In Appium, what does this selector mean: `By.id("com.example.myapp:id/login_button")`? Why is it different from CSS selectors?

<details><summary>Answer</summary>

`By.id("com.example.myapp:id/login_button")` is an **Android resource ID selector**. It breaks down as:
- `com.example.myapp` — the app's package name (like a namespace)
- `id/login_button` — the specific resource ID of the View

In Android XML layouts, developers assign IDs like:
```xml
<Button
    android:id="@+id/login_button"
    android:text="Login" />
```

This becomes `com.example.myapp:id/login_button` in the accessibility tree at runtime.

**Why it is different from CSS selectors**:
- CSS selectors target HTML elements in a DOM (`#login-button`, `.btn-primary`)
- Appium resource IDs target View objects in Android's View hierarchy
- There is no HTML. There is no CSS. The app is rendered using Android's View system, not a browser engine.

On iOS the equivalent would be `By.accessibilityId("loginButton")` — using the `accessibilityIdentifier` property set in Swift/Objective-C code.

</details>

---

## 4. Side-by-Side Architecture Comparison

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ARCHITECTURE COMPARISON                              │
├──────────────────────────────┬──────────────────────────────────────────┤
│           PLAYWRIGHT         │              APPIUM                      │
├──────────────────────────────┼──────────────────────────────────────────┤
│ Protocol: CDP (WebSocket)    │ Protocol: HTTP (WebDriver W3C REST)      │
│                              │                                          │
│ No server needed — connects  │ Requires Appium server running on port   │
│ directly to browser process  │ 4723 (or Appium Grid for parallel)       │
├──────────────────────────────┼──────────────────────────────────────────┤
│ Target: Browser DOM          │ Target: Native UI Accessibility Tree     │
│ (Chrome, Firefox, WebKit)    │ (Android View, iOS UIKit, Flutter)       │
├──────────────────────────────┼──────────────────────────────────────────┤
│ No driver installation       │ Drivers installed separately:            │
│                              │ appium driver install uiautomator2       │
│                              │ appium driver install xcuitest           │
├──────────────────────────────┼──────────────────────────────────────────┤
│ Test language: TypeScript,   │ Test language: Java, Python, JS,         │
│ JavaScript, Python, Java,    │ Ruby, C#, any language with HTTP         │
│ C#, Go, .NET                 │ client                                   │
├──────────────────────────────┼──────────────────────────────────────────┤
│ Startup speed: ~200ms        │ Startup speed: 15-60 seconds             │
│ (browser already running)    │ (installs app, boots device/simulator)   │
├──────────────────────────────┼──────────────────────────────────────────┤
│ Selectors: CSS, XPath,       │ Selectors: Resource ID, XPath,           │
│ text, role, test-id          │ Accessibility ID, class name,            │
│                              │ Android UiSelector, iOS Class Chain      │
├──────────────────────────────┼──────────────────────────────────────────┤
│ Network interception: YES    │ Network interception: Limited            │
│ page.route(), HAR recording  │ (requires proxy setup, no native CDP)    │
├──────────────────────────────┼──────────────────────────────────────────┤
│ Auto-wait: YES               │ Auto-wait: Limited                       │
│ Built into every action      │ Implicit/explicit waits, manual polling  │
├──────────────────────────────┼──────────────────────────────────────────┤
│ Debugging: Playwright UI     │ Debugging: Appium Inspector,             │
│ Mode, trace viewer, codegen  │ screenshots, Appium Desktop              │
└──────────────────────────────┴──────────────────────────────────────────┘
```

### Performance Reality

The startup speed difference is huge and matters in CI:

| Scenario | Playwright | Appium |
|---|---|---|
| Start 1 test | ~200ms browser startup | ~30-60s (boot emulator + install app) |
| Run 50 tests | ~5 minutes | ~20-40 minutes (slow to start, slow to interact) |
| Run on 10 parallel workers | Easy — just launch 10 browsers | Hard — need 10 emulators or 10 real devices |

---

## 5. What Each Tool Can and Cannot Do

This is the most important table in this file. When an interviewer asks "why did you choose X over Y", this is your answer.

```
┌──────────────────────────────────────┬──────────────────┬──────────────────┐
│ CAPABILITY                           │   PLAYWRIGHT     │   APPIUM         │
├──────────────────────────────────────┼──────────────────┼──────────────────┤
│ Test mobile website in Chrome        │ ✅ Best-in-class │ ✅ Slower       │
│ Test mobile website in Safari/iOS    │ ✅ WebKit engine │ ✅ Via Safari   │
│ Emulate any phone viewport           │ ✅ Built-in      │ ❌ Not purpose  │
│ Intercept network requests           │ ✅ page.route()  │ ⚠️ Via proxy    │
│ Mock API responses in tests          │ ✅ Native        │ ⚠️ Workaround   │
│ Test native Android UI               │ ❌ Cannot        │ ✅ UIAutomator2 │
│ Test native iOS UI                   │ ❌ Cannot        │ ✅ XCUITest     │
│ Test native Flutter UI               │ ❌ Cannot        │ ✅Flutter driver│
│ Test Android WebView content         │ ✅ Via CDP       │ ✅ WEBVIEW ctx  │
│ Simulate touch gestures              │ ✅ Built-in      │ ✅ Actions API  │
│ Take screenshots                     │ ✅ Fast          │ ✅ Slower       │
│ Access device camera/GPS/sensors     │ ❌ Cannot        │ ✅ Via Appium   │
│ Test push notifications              │ ❌ Cannot        │ ✅ Via Appium   │
│ Test biometric login                 │ ❌ Cannot        │ ✅ Via Appium   │
│ Test deep links / URL schemes        │ ❌ (web only)    │ ✅              │
│ Parallel test execution              │ ✅ Very easy     │ ⚠️ Complex      │
│ CI/CD integration                    │ ✅ Simple        │ ⚠️ Complex setup│
│ Visual regression testing            │ ✅ Built-in      │ ⚠️ Plugin needed│
│ API testing (REST/GraphQL)           │ ✅ request API   │ ❌ Not purpose  │
│ Auto-wait for elements               │ ✅ Built-in      │ ⚠️ Manual setup │
│ Cross-browser (Chrome+Firefox+Safari)│ ✅ Single API    │ ⚠️ Different cfg│
└──────────────────────────────────────┴──────────────────┴──────────────────┘
```

### The Rule in One Sentence

> **Playwright** is the right tool when your test can be run in a browser. **Appium** is the right tool when your test needs to interact with native app UI elements that are NOT in a browser.

---

### 🎯 Practice — Level 2 (Intermediate)

**Scenario 1**: You are hired to test a food delivery app. It is a native Android app (Kotlin). After ordering, users get a push notification. The order tracking screen shows a Google Map embedded as a WebView fragment. Design the testing strategy.

<details><summary>Answer — Point by Point</summary>

**Break the app into zones**:

```
┌──────────────────────────────────────────────────────────┐
│                  Food Delivery App                       │
├──────────────────────────────────────────────────────────┤
│  ZONE 1: Native screens                                  │
│  - Login (native buttons, text fields)                   │
│  - Restaurant list (RecyclerView — native list)          │
│  - Cart (native UI)                                      │
│  - Checkout (native forms)                               │
│  TOOL: Appium + UIAutomator2                             │
├──────────────────────────────────────────────────────────┤
│  ZONE 2: WebView (Google Maps tracking)                  │
│  - Map embedded as WebView fragment                      │
│  - HTML buttons overlaid on map                          │
│  TOOL: Playwright via playwright-android OR              │
│         Appium with context switch to WEBVIEW            │
├──────────────────────────────────────────────────────────┤
│  ZONE 3: API layer (order service, restaurant service)   │
│  - REST APIs behind the app                              │
│  - Test order creation, payment, status updates          │
│ TOOL: Playwright request API or direct HTTP (Postman/k6) │
├──────────────────────────────────────────────────────────┤
│ ZONE 4: Push notifications                               │
│ - Device-level notification tray                         │
│ TOOL: Appium (can interact with notification drawer)     │
└──────────────────────────────────────────────────────────┘
```

**Execution strategy**:
- Use Appium for the full E2E flow (login → order → checkout)
- Switch context to WEBVIEW for the map interaction
- Use Playwright request API separately to smoke-test APIs
- Use Appium's notification API to verify push notification text

</details>

---

**Scenario 2**: Your company's React app has a mobile web version (accessed via Chrome on Android). QA wants to cover: layout at 375px viewport, network performance at 3G speed, and checking API calls when tapping "Add to Cart". Compare Playwright vs Appium for each sub-task.

<details><summary>Answer — Point by Point</summary>

**Sub-task 1: Layout at 375px viewport**
- Playwright: `devices['iPhone SE']` sets viewport to 375×667. CSS media queries apply. Zero setup.
- Appium: Not the right tool. Appium doesn't control browser viewport in a meaningful way for layout testing. You'd need a separate browser session anyway.
- **Winner: Playwright**

**Sub-task 2: Network performance at 3G speed**
```typescript
// Playwright — built in
const context = await browser.newContext({
  ...devices['Pixel 7'],
});
// Emulate 3G: ~1.5Mbps down, 750Kbps up, 40ms latency
await context.route('**/*', async route => {
  await new Promise(resolve => setTimeout(resolve, 40)); // latency
  await route.continue();
});
// OR use CDP directly:
const client = await context.newCDPSession(page);
await client.send('Network.emulateNetworkConditions', {
  offline: false,
  downloadThroughput: 1.5 * 1024 * 1024 / 8, // bytes/sec
  uploadThroughput: 750 * 1024 / 8,
  latency: 40,
});
```
- Appium: Cannot throttle network without external proxy (Charles, mitmproxy). Much more setup.
- **Winner: Playwright**

**Sub-task 3: Check API calls when tapping "Add to Cart"**
```typescript
// Playwright — network interception is native
const [request] = await Promise.all([
  page.waitForRequest(req =>
    req.url().includes('/api/cart') && req.method() === 'POST'
  ),
  page.getByRole('button', { name: 'Add to Cart' }).tap(), // touch event
]);

const body = JSON.parse(request.postData() || '{}');
expect(body.productId).toBe('SKU-001');
expect(body.quantity).toBe(1);
```
- Appium: Cannot intercept network requests natively. You'd need to set up a proxy server, configure the device to route through it, and parse the proxy logs. 10x more complex.
- **Winner: Playwright — by a large margin**

</details>

---

## 6. Decision Tree — Which Tool for Which Job

Use this tree whenever you face a mobile testing decision:

```
START: What are you testing?
│
├─► Is it a mobile WEBSITE or PWA (runs in browser)?
│       │
│       └─► YES → USE PLAYWRIGHT
│               - Mobile device emulation
│               - Network interception
│               - Layout testing
│               - API testing
│
├─► Is it a NATIVE app (Kotlin/Java, Swift, Flutter)?
│       │
│       └─► YES → USE APPIUM
│               ├─► Android → UIAutomator2 driver
│               ├─► iOS → XCUITest driver
│               └─► Flutter → Flutter driver
│
├─► Is it a HYBRID app (WebView inside native shell)?
│       │
│       ├─► Native shell parts → APPIUM
│       └─► WebView content → PLAYWRIGHT (or Appium WEBVIEW context)
│
├─► Are you testing the API LAYER (REST/GraphQL) that the app calls?
│       │
│       └─► USE PLAYWRIGHT (request API) — fast, no device needed
│
└─► Are you testing DEVICE FEATURES (camera, GPS, notifications)?
        │
        └─► USE APPIUM — it can access device APIs
```

---

## 7. Playwright for Mobile Web — Practical Guide

### Level 1: Device Emulation (The Basics)

Playwright ships with 40+ device descriptors. Here is how to use them and what they actually set:

```typescript
import { test, expect, devices } from '@playwright/test';

test('mobile checkout flow on Pixel 7', async ({ browser }) => {
  // Create a mobile context — sets all device parameters
  const context = await browser.newContext({
    ...devices['Pixel 7'],
    // devices['Pixel 7'] expands to:
    // userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7)...'
    // viewport: { width: 412, height: 915 }
    // deviceScaleFactor: 2.625
    // isMobile: true
    // hasTouch: true
    // defaultBrowserType: 'chromium'
  });

  const page = await context.newPage();
  await page.goto('https://myapp.com/shop');

  // Touch tap (not mouse click)
  await page.getByRole('button', { name: 'Add to Cart' }).tap();

  // Swipe gesture (using touchscreen API)
  await page.touchscreen.swipe(200, 400, 200, 100, { steps: 10 });

  // Check mobile-specific layout
  const hamburgerMenu = page.locator('[data-testid="mobile-nav"]');
  await expect(hamburgerMenu).toBeVisible();

  // Desktop nav should be hidden
  const desktopNav = page.locator('[data-testid="desktop-nav"]');
  await expect(desktopNav).toBeHidden();
});
```

### Level 2: Playwright Config for Mobile Projects

A real project uses `playwright.config.ts` to define multiple device targets:

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  projects: [
    // --- Mobile devices ---
    {
      name: 'mobile-chrome-pixel7',
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'mobile-safari-iphone14',
      use: { ...devices['iPhone 14'] },
    },
    {
      name: 'mobile-chrome-samsung',
      use: { ...devices['Galaxy S21'] },
    },

    // --- Tablet ---
    {
      name: 'tablet-ipad-pro',
      use: { ...devices['iPad Pro 11'] },
    },

    // --- Desktop (for comparison) ---
    {
      name: 'desktop-chrome',
      use: { browserName: 'chromium', viewport: { width: 1440, height: 900 } },
    },
  ],
});

// Now run: npx playwright test --project=mobile-chrome-pixel7
```

### Level 3: Network Interception on Mobile Tests

One of Playwright's most powerful features — unavailable in Appium:

```typescript
test('cart API called correctly when adding item on mobile', async ({ browser }) => {
  const context = await browser.newContext({ ...devices['iPhone 14'] });
  const page = await context.newPage();

  // Intercept the add-to-cart API call
  let capturedRequest: any = null;
  await page.route('**/api/v1/cart/items', async route => {
    // Capture the request payload
    capturedRequest = JSON.parse(route.request().postData() || '{}');
    // Let the request go through (don't mock it)
    await route.continue();
  });

  await page.goto('/product/123');
  await page.getByRole('button', { name: 'Add to Cart' }).tap();

  // Assert the API was called with correct data
  expect(capturedRequest).not.toBeNull();
  expect(capturedRequest.productId).toBe('123');
  expect(capturedRequest.quantity).toBe(1);
  expect(capturedRequest.source).toBe('mobile_web'); // mobile-specific field
});
```

---

### 🎯 Practice — Level 2 (Intermediate)

**Challenge**: Write a Playwright test that:
1. Opens the app on a Pixel 7 emulation
2. Simulates going offline (to test offline mode)
3. Verifies the offline banner appears
4. Goes back online and verifies the banner disappears

<details><summary>Answer — Step by Step</summary>

```typescript
import { test, expect, devices } from '@playwright/test';

test('offline banner appears and disappears', async ({ browser }) => {
  const context = await browser.newContext({ ...devices['Pixel 7'] });
  const page = await context.newPage();
  await page.goto('/');

  // Verify no offline banner at start
  await expect(page.getByTestId('offline-banner')).toBeHidden();

  // Step 1: Go offline — use CDP to set network conditions
  // This simulates the device losing network connectivity
  const client = await context.newCDPSession(page);
  await client.send('Network.enable');
  await client.send('Network.emulateNetworkConditions', {
    offline: true,
    downloadThroughput: -1,
    uploadThroughput: -1,
    latency: 0,
  });

  // OR simpler: use Playwright's built-in context.setOffline()
  await context.setOffline(true);

  // The banner should appear (usually shown by a JavaScript event listener on 'online'/'offline')
  await expect(page.getByTestId('offline-banner')).toBeVisible();
  await expect(page.getByTestId('offline-banner')).toContainText('No internet connection');

  // Step 2: Go back online
  await context.setOffline(false);

  // The banner should disappear (app caught the 'online' event)
  await expect(page.getByTestId('offline-banner')).toBeHidden();
});
```

**Why `context.setOffline(true)` works**: Playwright sends a CDP `Network.emulateNetworkConditions` command to Chrome. Chrome then blocks all network requests, and fires the browser's `window.offline` event. Your app's JavaScript listens to this event to show the banner.

**The edge case to think about**: What if the banner is shown AFTER a failed fetch, not on the `offline` event? Then you also need to verify that `page.reload()` shows a failure state. Test both paths.

</details>

---

## 8. Appium for Native Apps — Practical Guide

### Level 1: Setup and First Test (Android)

Before writing code, you need to understand what needs to be installed:

```
What you need for Appium Android:
1. Java JDK 11+
2. Android Studio (gives you Android SDK + AVD for emulators)
3. Node.js (Appium is a Node.js server)
4. Appium 2.x: npm install -g appium
5. UIAutomator2 driver: appium driver install uiautomator2
6. Your test language dependencies (Java: appium-java-client)
```

**Your first Appium test (Java)**:

```java
import io.appium.java_client.android.AndroidDriver;
import io.appium.java_client.android.options.UiAutomator2Options;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import java.net.URL;

public class LoginTest {

    @Test
    public void testLoginFlow() throws Exception {
        // Step 1: Define capabilities — tells Appium which app/device to use
        UiAutomator2Options options = new UiAutomator2Options()
            .setPlatformName("Android")
            .setAutomationName("UIAutomator2")
            .setDeviceName("emulator-5554")          // AVD name from `adb devices`
            .setApp("/path/to/my-app.apk")           // installs the APK
            .setAppPackage("com.mycompany.myapp")    // app's package name
            .setAppActivity(".activities.LoginActivity"); // first screen to launch

        // Step 2: Connect to Appium server (must be running on port 4723)
        AndroidDriver driver = new AndroidDriver(
            new URL("http://localhost:4723"),
            options
        );

        // Step 3: Find elements by their Android resource ID
        WebElement usernameField = driver.findElement(
            By.id("com.mycompany.myapp:id/et_username")
        );
        usernameField.clear();
        usernameField.sendKeys("testuser@example.com");

        // Step 4: Find by text (XPath)
        WebElement passwordField = driver.findElement(
            By.xpath("//android.widget.EditText[@hint='Password']")
        );
        passwordField.sendKeys("securepassword123");

        // Step 5: Click the login button
        driver.findElement(
            By.id("com.mycompany.myapp:id/btn_login")
        ).click();

        // Step 6: Wait for the home screen and assert
        WebElement welcomeText = driver.findElement(
            By.id("com.mycompany.myapp:id/tv_welcome")
        );
        assertEquals("Welcome, testuser!", welcomeText.getText());

        driver.quit();
    }
}
```

### Level 2: Finding Elements in Native Apps

This is the hardest part of Appium — selectors are different from CSS/XPath on web:

```
┌────────────────────────────────────────────────────────────────┐
│              APPIUM SELECTOR TYPES — ANDROID                   │
├─────────────────────┬──────────────────────────────────────────┤
│ Selector Type       │ Example and When to Use                  │
├─────────────────────┼──────────────────────────────────────────┤
│ Resource ID         │ By.id("com.app:id/btn_login")            │
│                     │ BEST: stable, set by developer           │
│                     │ WORST: when dev doesn't set IDs          │
├─────────────────────┼──────────────────────────────────────────┤
│ Accessibility ID    │ By.accessibilityId("Login Button")       │
│                     │ Good: set via contentDescription in XML  │
│                     │ Works on BOTH Android and iOS!           │
├─────────────────────┼──────────────────────────────────────────┤
│ XPath               │ //android.widget.Button[@text='Login']   │
│                     │ Avoid: slow, brittle, full tree scan     │
├─────────────────────┼──────────────────────────────────────────┤
│ Class Name          │ By.className("android.widget.Button")    │
│                     │ Bad: finds ALL buttons, not unique       │
├─────────────────────┼──────────────────────────────────────────┤
│ UiAutomator         │ new UiSelector().text("Login")           │
│ (Android only)      │   .className("android.widget.Button")    │
│                     │ Powerful for chained conditions          │
├─────────────────────┼──────────────────────────────────────────┤
│ iOS Class Chain     │ **/XCUIElementTypeButton[`label == 'OK'`]│
│ (iOS only)          │ Fast alternative to XPath on iOS         │
└─────────────────────┴──────────────────────────────────────────┘
```

**The real rule**: Ask the developers to add `android:contentDescription` on interactive elements. This becomes your accessibility ID — works on both Android and iOS Appium tests.

```xml
<!-- Android layout XML — developer adds this -->
<Button
    android:id="@+id/btn_login"
    android:text="Login"
    android:contentDescription="Login button" />

<!-- Now you can find it with accessibilityId — works on Android and iOS Appium -->
```

---

### 🎯 Practice — Level 3 (Advanced)

**Challenge**: You are testing a native Android app. The screen has a `RecyclerView` (a scrollable list of items). You need to scroll down until you find an item with the text "Manage Billing", then tap it. Write the Appium code. Why is this harder than scrolling in a web list?

<details><summary>Answer — Point by Point</summary>

**Why it is harder**: In a web app, you can scroll with JavaScript (`element.scrollIntoView()`). In a native Android RecyclerView, the items that are off-screen are NOT in the accessibility tree yet — they don't exist until RecyclerView renders them (because RecyclerView recycles views for performance). You cannot find an element that is not visible.

**Solution**: Use Appium's `UiScrollable` — an Android-specific API that scrolls until it finds an element:

```java
// Java — Appium with UiAutomator2
import io.appium.java_client.AppiumBy;

// UiScrollable scrolls a scrollable container until it finds the target element
// This is the ONLY reliable way to scroll and find in RecyclerView
WebElement manageBillingItem = driver.findElement(
    AppiumBy.androidUIAutomator(
        "new UiScrollable(new UiSelector().scrollable(true))" +
        ".scrollIntoView(new UiSelector().text(\"Manage Billing\"))"
    )
);

// Once it's in view, tap it
manageBillingItem.click();
```

**How UiScrollable works**:
1. `new UiSelector().scrollable(true)` — finds the scrollable container (RecyclerView)
2. `scrollIntoView(...)` — scrolls the container, checking after each scroll if the element exists
3. When found, it stops scrolling and returns the element
4. Android's UIAutomator framework handles this natively — it is fast and reliable

**The equivalent for iOS** (also off-screen elements don't exist):
```javascript
// WebdriverIO + Appium iOS
await driver.execute('mobile: scroll', {
  direction: 'down',
  element: await $('~manage-billing-section'), // scroll until accessible
});
```

**Web comparison** (why web is simpler):
```typescript
// Playwright — the DOM contains all items even if off-screen
await page.locator('text=Manage Billing').scrollIntoViewIfNeeded();
await page.locator('text=Manage Billing').click();
// DOM element exists before scroll — no special logic needed
```

**The lesson**: RecyclerView virtual scrolling is a fundamental difference between native and web. In native, the accessibility tree only shows what is VISIBLE. In web, the DOM contains all items.

</details>

---

## 9. Where They Work Together

The most powerful mobile testing strategy uses BOTH tools — each doing what it does best.

### Real-World Integration Pattern

```typescript
// PLAYWRIGHT handles the API layer
// This creates test data before Appium needs it
async function createTestCitation(amount: number): Promise<string> {
  const apiContext = await request.newContext({
    baseURL: 'https://api.myapp.com',
  });

  const response = await apiContext.post('/citations', {
    data: { amount, status: 'PENDING' }
  });

  const { citationId } = await response.json();
  return citationId; // return to Appium test
}
```

```java
// APPIUM handles the native UI flow
@Test
public void testPayCitationE2E() throws Exception {
  // Step 1: Use Playwright (via REST call) to create test data
  // (Or call the createTestCitation function if using a shared test service)
  String citationId = apiClient.createCitation(150.00);

  // Step 2: Use Appium to drive the native app
  driver.findElement(By.id("com.app:id/btn_search")).click();
  driver.findElement(By.id("com.app:id/et_citation_id"))
        .sendKeys(citationId);
  driver.findElement(By.id("com.app:id/btn_find")).click();

  // Wait for result screen
  WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));
  WebElement amountText = wait.until(
      ExpectedConditions.presenceOfElementLocated(
          By.id("com.app:id/tv_amount")
      )
  );
  assertEquals("$150.00", amountText.getText());

  // Step 3: Pay
  driver.findElement(By.id("com.app:id/btn_pay")).click();

  // Step 4: Verify success
  WebElement successMsg = wait.until(
      ExpectedConditions.presenceOfElementLocated(
          By.id("com.app:id/tv_success")
      )
  );
  assertEquals("Payment successful", successMsg.getText());

  // Step 5: Use Playwright API to verify backend state changed
  // (Don't assert only from UI — verify the actual DB state via API)
}
```

---

## 10. Interview Questions on This Topic

Use these when an interviewer asks about mobile testing:

**Q: "Can Playwright test native mobile apps?"**
> "Playwright is a browser automation tool — it speaks to browser engines via Chrome DevTools Protocol. For mobile, it works excellently for mobile web testing and WebView content, with full network interception and device emulation. For truly native UI elements — Android Views, iOS UIKit elements — you need Appium, which speaks to the platform's accessibility framework via UIAutomator2 or XCUITest. I'd use them together: Playwright for the API layer and web content, Appium for native UI flows."

**Q: "Why is Appium slower than Playwright?"**
> "Two reasons. First, Appium uses HTTP (the WebDriver protocol) — each command is an HTTP round-trip to the Appium server, then to the device. Playwright uses a persistent WebSocket connection — no round-trip overhead. Second, Appium must boot a device or emulator, install the APK or IPA, and wait for the app to launch — that is 30-60 seconds of startup vs. 200ms for a browser."

**Q: "How would you test a React Native app?"**
> "React Native has two modes: the JavaScript logic lives in a JS thread, but the UI is rendered with actual native components (not WebViews). So you use Appium with UIAutomator2 or XCUITest. The app LOOKS native because it IS native at the UI layer. However, if the app uses `WebView` components for any screens, you switch context to `WEBVIEW` in Appium, or use Playwright if the page is a full web page."

---

**Navigation**: [📚 Index](00_INDEX.md) | [Android Native →](02_Android_Native_Dev_And_Testing.md)
