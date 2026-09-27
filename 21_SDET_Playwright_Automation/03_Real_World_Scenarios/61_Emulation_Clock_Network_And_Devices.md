# 61. Emulation & Environment Simulation — Devices, Clock, Network, Locale, Permissions

**Navigation**: [← Chapter 60: Tool Comparison](../08_SDET_to_SDE_Bridge/60_Tool_Comparison_Cypress_Selenium_WDIO.md) | [Index](../00_INDEX.md) | [→ Chapter 62: Enterprise Test Operations](../06_CI_CD_And_Reliability/62_Enterprise_Test_Operations.md)

**Cross-links:**

- [`56_Playwright_Config_Deep_Dive.md`](../01_Foundations/56_Playwright_Config_Deep_Dive.md) — where the project matrix lives
- [`26_Flakiness_Diagnosis_and_Fixing.md`](../06_CI_CD_And_Reliability/26_Flakiness_Diagnosis_and_Fixing.md) — `reducedMotion` and Clock kill two flakiness classes
- [`29_Visual_Regression_Testing.md`](../07_Specialised_Testing/29_Visual_Regression_Testing.md) — aria snapshots as the middle ground before screenshots
- [`49_Feature_Flag_Testing.md`](./49_Feature_Flag_Testing.md) — the same matrix-explosion math applies

> **Verified against Playwright 1.60.** The Clock API (`page.clock`) requires ≥ 1.45; `toMatchAriaSnapshot` requires ≥ 1.49.

---

## 5W1H

- **WHAT**: Making the browser lie on purpose — about the device it runs on, what time it is, how fast the network is, where the user is located, and what language they speak — so tests can cover conditions your dev machine never has.
- **WHY**: Your users are not on a 32-core CI runner in `en-US` with fiber internet at 2 PM. They are on a mid-range Android in `de-DE` on hotel Wi-Fi at 23:59 on the last day of the month. Nearly every "works on my machine" production bug lives in that gap.
- **WHO**: Every SDET whose application has mobile users, international users, session timeouts, or an offline state — which is to say, every SDET.
- **WHEN**: Emulation projects run nightly; a small emulation smoke slice runs on every PR. Clock tests run everywhere because they are *faster* than real-time tests, not slower.
- **WHERE**: All of it is context-level configuration — no test code changes when emulation is wired through `playwright.config.ts` projects and fixtures.
- **HOW**: `devices[]` presets, `page.clock`, `context.setOffline` + CDP throttling, `geolocation`/`permissions` context options, `locale`/`timezoneId`, and `toMatchAriaSnapshot`.

---

## 1. The Enterprise Framing — Why Emulation Is a Coverage Dimension, Not a Gimmick

Think of your test suite as covering a matrix:

```
            features (what you test)
              ×
            environments (browser, device, locale, network, time)
```

Most teams invest 100% of effort in the features axis and test exactly ONE point on the environment axis: desktop Chromium, `en-US`, UTC, fast network, current time. Production then fails at a *different point* of the environment axis, and the postmortem says "we had a test for that feature" — true, but at the wrong coordinate.

The real-world discipline:

| Environment dimension | Production bug it catches | Cost to add in Playwright |
| --- | --- | --- |
| Device / viewport | Overlapping buttons on mobile, hover-only menus untouchable on touch | One `devices[]` line per project |
| Time (Clock API) | Session expiry, token refresh, countdown timers, "expires at midnight" logic | One fixture |
| Network conditions | Spinners that never resolve, double-submits on slow POST, missing offline UX | One CDP call |
| Locale / timezone | Broken date parsing, truncated German strings, wrong currency rounding | Two config fields |
| Permissions / geolocation | Permission-denied paths nobody ever tested | One context option |
| Color scheme / motion | Invisible text in dark mode, animation-driven flake | Two config fields |

Every row is cheap. What is expensive is the production incident on the row you skipped.

---

## 2. Device & Mobile Emulation

### 2.1 What a device preset actually sets

`devices['iPhone 15']` is not just a viewport. It sets:

```ts
{
  viewport: { width: 393, height: 852 },
  deviceScaleFactor: 3,          // DPR — affects screenshots and image loading
  isMobile: true,                // enables the visual viewport / meta-viewport handling
  hasTouch: true,                // enables touch events; .tap() becomes available
  userAgent: '...iPhone...',     // servers and CDNs branch on this
  defaultBrowserType: 'webkit',  // iPhones run WebKit — testing "iPhone" on Chromium is a lie
}
```

The last line is the one enterprise teams get wrong. If your config forces Chromium for an iPhone preset, you are testing a device that does not exist. Respect `defaultBrowserType`.

### 2.2 The project matrix — how real teams structure it

```ts
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  projects: [
    // ── PR gate: one desktop + one mobile smoke ─────────────────────
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    {
      name: 'mobile-smoke',
      grep: /@smoke/,                            // only smoke-tagged specs
      use: { ...devices['Pixel 7'] },
    },

    // ── Nightly: full device spread ─────────────────────────────────
    { name: 'mobile-android', use: { ...devices['Pixel 7'] } },        // Chromium
    { name: 'mobile-ios',     use: { ...devices['iPhone 15'] } },      // WebKit
    { name: 'tablet',         use: { ...devices['iPad (gen 11)'] } },
    { name: 'desktop-firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'desktop-webkit',  use: { ...devices['Desktop Safari'] } },
  ],
});
```

Then in CI: PRs run `--project=desktop-chromium --project=mobile-smoke`; the nightly runs everything. This is the standard enterprise compromise between signal and cost — full matrix on every PR is how you get 45-minute PR pipelines that developers learn to hate.

### 2.3 Writing tests that survive both desktop and mobile

```ts
test('nav works on any form factor', async ({ page, isMobile }) => {
  await page.goto('/dashboard');

  if (isMobile) {
    // hamburger menu on mobile — the desktop nav bar is display:none
    await page.getByRole('button', { name: 'Open menu' }).tap();
  }
  await page.getByRole('link', { name: 'Reports' }).click();
  await expect(page.getByRole('heading', { name: 'Reports' })).toBeVisible();
});
```

`isMobile` is a built-in fixture — it reflects the project's device settings. A small number of `if (isMobile)` branches at *navigation* points is normal; if you find yourself branching inside business-flow steps, your POM should absorb the difference instead (give the POM a `openNav()` method that branches internally).

### 2.4 Emulation vs real devices — the honest decision table

| Question | Emulation (Playwright) | Real device cloud (BrowserStack / Sauce) |
| --- | --- | --- |
| Layout at mobile viewport | ✅ perfect | ✅ |
| Touch event handling | ✅ good | ✅ |
| WebKit rendering (iOS) | ⚠️ desktop WebKit ≈ iOS Safari, not identical | ✅ |
| OS keyboard, autofill, push, biometrics | ❌ | ✅ |
| GPU/performance characteristics | ❌ | ✅ |
| Cost & speed | free, fast, parallel | $$, slow, limited concurrency |

Enterprise pattern: **emulation for every PR/nightly, a thin real-device suite (5–10 critical flows) weekly or pre-release**. Teams that try to run everything on real devices end up with a 4-hour pipeline and quietly stop running it.

---

## 3. The Clock API — Testing Time Without Waiting for It

The single most underused Playwright feature in enterprise suites. Anything that involves *elapsed time* — session timeout, JWT refresh, auto-save, countdown, polling backoff, "link expires in 15 minutes" — can be tested in milliseconds instead of minutes, deterministically.

### 3.1 The core API

```ts
test('session expires after 30 minutes of inactivity', async ({ page }) => {
  // Install BEFORE navigation so the app boots under the fake clock
  await page.clock.install({ time: new Date('2026-07-25T10:00:00') });

  await page.goto('/dashboard');
  await expect(page.getByTestId('user-menu')).toBeVisible();

  // Jump 29 minutes — still logged in
  await page.clock.fastForward('29:00');
  await expect(page.getByTestId('user-menu')).toBeVisible();

  // Cross the 30-minute line
  await page.clock.fastForward('02:00');
  await expect(page.getByRole('heading', { name: 'Session expired' })).toBeVisible();
});
```

What each method does — and when to reach for it:

| Method | What it does | Use for |
| --- | --- | --- |
| `clock.install({ time })` | Replaces `Date`, `setTimeout`, `setInterval`, `requestAnimationFrame` with controllable fakes | Always first, before `goto` |
| `clock.fastForward('30:00')` | Jumps forward; fires timers *once* if they were due (a 1s interval fires 1×, not 1800×) | Session expiry, long timeouts |
| `clock.runFor('05:00')` | Advances firing **every** intermediate timer (1s interval fires 300×) | Polling loops, animations where each tick matters |
| `clock.pauseAt(new Date('...T23:59:59'))` | Runs real-ish until that moment, then freezes | Midnight-boundary logic |
| `clock.resume()` | Un-freezes, ticks normally | After a `pauseAt` assertion |
| `clock.setFixedTime(date)` | `Date.now()` is pinned but timers still run | "Render this page as if it were Dec 31" |
| `clock.setSystemTime(date)` | Sets time without touching timers at all | Pure display-formatting tests |

The `fastForward` vs `runFor` distinction is the interview-grade detail: `fastForward` is "the laptop lid was closed for 30 minutes" (each interval callback fires at most once); `runFor` is "30 minutes genuinely elapsed" (every scheduled tick fires). A polling dashboard test that uses `fastForward` and expects 60 poll requests will see exactly 1.

### 3.2 Real-world case: token refresh race

An enterprise SPA refreshes its access token 60 seconds before expiry. The bug class: two tabs, or one tab plus a background retry, both attempt refresh; the second invalidates the first's new token; user gets logged out randomly. This is nearly impossible to reproduce with real time — and trivial with the Clock:

```ts
test('parallel refresh attempts do not log the user out', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-07-25T10:00:00') });
  await page.goto('/dashboard');   // token TTL = 15 min

  let refreshCalls = 0;
  await page.route('**/auth/refresh', async (route) => {
    refreshCalls++;
    await route.fulfill({ json: { token: `fresh-${refreshCalls}` } });
  });

  // Jump to the refresh window; both the interval-based refresher and the
  // visibilitychange refresher wake up in the same tick.
  await page.clock.fastForward('14:01');

  await expect(page.getByTestId('user-menu')).toBeVisible();  // still logged in
  expect(refreshCalls).toBe(1);  // dedup worked — the app must single-flight refresh
});
```

Without the Clock this test takes 14 minutes and passes or fails on scheduler luck. With it: ~2 seconds, deterministic.

### 3.3 What Clock does NOT fake

`page.clock` fakes the **browser's** time. It does not touch:

- **Your backend's clock** — if the server rejects an expired JWT, jumping the browser forward does not age the token on the server. Pair the Clock with a mocked API (`page.route`) or a test-only server endpoint that mints short-TTL tokens.
- **`Date` inside Web Workers / Service Workers** (install it before they boot, or they keep real time).
- **TLS certificate validation, HSTS, cookie `Expires`** — all enforced outside JS.

The enterprise pattern is Clock-for-frontend + route-mocks-for-backend, or Clock + a seeded backend whose data was created with `expires_at` values in the near future.

---

## 4. Network Emulation — Offline, Slow, and Hostile

### 4.1 Offline mode

```ts
test('offline banner appears and queued edits sync on reconnect', async ({ page, context }) => {
  await page.goto('/notes');
  await page.getByRole('textbox').fill('draft while online');

  await context.setOffline(true);
  await page.getByRole('textbox').fill('edited while offline');
  await expect(page.getByText('Offline — changes will sync')).toBeVisible();

  await context.setOffline(false);
  await expect(page.getByText('All changes saved')).toBeVisible();
});
```

`setOffline` cuts network at the browser level — `fetch` rejects, the `offline` event fires, service workers see it. It does **not** change `navigator.connection` and it does not slow anything down; it is a binary switch.

### 4.2 Throttling via CDP (Chromium only)

Playwright has no first-class throttling API (deliberately — it's Chromium-only), but the CDP session is one line:

```ts
test('checkout is usable on slow 3G', async ({ page, context }) => {
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 400,                       // ms round-trip
    downloadThroughput: (400 * 1024) / 8,  // 400 kbps in bytes/sec
    uploadThroughput: (400 * 1024) / 8,
  });

  await page.goto('/checkout');
  await page.getByRole('button', { name: 'Place order' }).click();

  // The bug class this catches: button not disabled during slow POST → double order
  await expect(page.getByRole('button', { name: 'Place order' })).toBeDisabled();
  await expect(page.getByText('Order confirmed')).toBeVisible({ timeout: 20_000 });
});
```

Real-world guidance: you do not need a full slow-network matrix. **One test per money-moving flow** (checkout, submit, payment) under ~400 kbps / 400 ms answers the only question that matters: *is the UI protected against the second click?*

### 4.3 Failure injection with `route.abort()`

Slow is one hostile condition; *dead* is the other:

```ts
// The analytics vendor is down — does checkout still work?
await page.route('**/analytics.example.com/**', (route) => route.abort('connectionrefused'));
await page.goto('/checkout');
await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible();
```

This is the cheapest chaos engineering you will ever do. Enterprises that lost a Black Friday to a hanging third-party tag all have this test now; you can have it before the incident.

---

## 5. Geolocation & Permissions

```ts
// playwright.config.ts project, or test.use()
test.use({
  geolocation: { latitude: 52.52, longitude: 13.405 },   // Berlin
  permissions: ['geolocation'],
});

test('store locator finds nearest Berlin store', async ({ page }) => {
  await page.goto('/stores');
  await page.getByRole('button', { name: 'Use my location' }).click();
  await expect(page.getByText('Berlin Mitte')).toBeVisible();
});

test('denied geolocation shows manual ZIP entry', async ({ page, context }) => {
  await context.clearPermissions();     // now the prompt would appear → Playwright auto-denies
  await page.goto('/stores');
  await page.getByRole('button', { name: 'Use my location' }).click();
  await expect(page.getByLabel('Enter ZIP code')).toBeVisible();
});
```

Two real-world notes:

1. **The denied path is the valuable test.** Roughly half of real users deny the prompt. Teams test the happy path with granted permission and ship a broken denied path for years.
2. Mid-test moves: `context.setGeolocation({ latitude: 48.85, longitude: 2.35 })` — for delivery-tracking UIs that re-render as the courier moves.

The same `permissions` array accepts `'camera'`, `'microphone'`, `'clipboard-read'` and `'notifications'`, and the grant-one/deny-one pattern is the right shape — **but for camera, microphone and notifications the grant alone is not enough in Playwright's default Chromium**, and in one configuration it is actively dangerous. An earlier version of this paragraph said the pattern was "identical"; measured, it isn't. See §5b.

---

## 5b. Camera, Microphone & Push Notifications — What the Grant Doesn't Cover

Video KYC, "scan your ID", QR-code login, voice notes and push notifications all need more than a permission flag. Everything below was measured in Playwright 1.60 on Chromium, including the difference between Playwright's two headless modes: the default **headless shell**, and **new headless** (`channel: "chromium"`, the full browser without a window).

### Camera and microphone

`navigator.mediaDevices.getUserMedia({ video: true, audio: true })` under each configuration:

| Configuration | Result |
| --- | --- |
| Default headless, `permissions: ['camera']` | ❌ `NotSupportedError` |
| Default headless, `--use-fake-device-for-media-stream` + permission | ❌ `NotSupportedError` |
| Default headless, `--use-fake-device-for-media-stream --use-fake-ui-for-media-stream` | ✅ fake camera + mic |
| New headless, `permissions: ['camera']` only | ⚠️ **opened this machine's real webcam** ("Integrated Camera") |
| New headless, `--use-fake-device-for-media-stream` + permission | ✅ `fake_device_0` |
| New headless, `--use-fake-device-for-media-stream`, **no** permission | ✅ `NotAllowedError` — the denied path |

Two things to take from that table. In the default headless shell the permission grant does nothing for media, and only `--use-fake-ui-for-media-stream` (which auto-accepts every prompt) makes capture work — which also means you can't test denial that way. And in new headless a bare permission grant reaches for **real hardware**: on a developer laptop that's the webcam, on a CI runner it's typically "no device" — the same test behaves differently per machine, and on a laptop it is a privacy problem. The deterministic, testable configuration is new headless plus the fake device, with the permission deciding grant vs deny:

```ts
// playwright.config.ts
{
  name: 'media',
  use: {
    channel: 'chromium',                                  // new headless: permissions apply to media
    launchOptions: { args: ['--use-fake-device-for-media-stream'] },
    permissions: ['camera', 'microphone'],                // grant; a test can clearPermissions() for the deny path
  },
}
```

**Feeding the camera a specific picture.** The default fake device shows a synthetic moving pattern — fine for "the preview appears", useless for "the app read the QR code" or "the ID was detected". `--use-file-for-fake-video-capture=<file>` replaces it with a video you supply (`.y4m` or `.mjpeg`). Verified with a generated 64×48 solid-red `.y4m`: the page's video track reported the file as its label, the stream was 64×48, and the centre pixel drawn from the live `<video>` was `RGB(254, 0, 0)`. So a test can put a known QR code or document image in front of the camera and assert what the app extracted from it:

```ts
launchOptions: { args: [
  '--use-fake-device-for-media-stream',
  '--use-file-for-fake-video-capture=' + path.resolve('fixtures/media/qr-login-token.y4m'),
  '--use-file-for-fake-audio-capture=' + path.resolve('fixtures/media/hello.wav'),
] },
```

Convert an image with `ffmpeg -loop 1 -i qr.png -t 2 -pix_fmt yuv420p qr.y4m` — verified end to end: a solid-blue PNG converted with exactly that command appeared in the camera stream as `RGB(0, 0, 251)`. The audio flag works the same way: with a generated 440 Hz WAV, the microphone stream's dominant frequency measured **439 Hz** (the default fake audio input peaks at 59 Hz), so a speech-to-text or voice-note feature can be fed a known recording. Firefox has equivalents as prefs rather than flags — `firefoxUserPrefs: { 'media.navigator.streams.fake': true, 'media.navigator.permission.disabled': true }` produced a working fake stream in the same run — but no file injection; WebKit has neither.

### Push notifications

A push notification has two halves, and they need different tools:

1. **Delivery** — the push service wakes your service worker's `push` handler.
2. **Display** — the handler calls `registration.showNotification()`.

You can't route a real push service in a test, but Chromium's CDP `ServiceWorker` domain can deliver a push payload straight to the registered worker — no push subscription, VAPID keys or FCM involved:

```ts
test('payment push shows a notification', async ({ page, context }) => {
  const cdp = await context.newCDPSession(page);
  const regs: { registrationId: string; scopeURL: string }[] = [];
  cdp.on('ServiceWorker.workerRegistrationUpdated', (e) => regs.push(...e.registrations));
  await cdp.send('ServiceWorker.enable');

  await page.goto('/inbox');
  await page.evaluate(() => navigator.serviceWorker.ready);
  const origin = new URL(page.url()).origin;
  const reg = regs.find((r) => r.scopeURL.startsWith(origin))!;

  await cdp.send('ServiceWorker.deliverPushMessage', {
    origin,
    registrationId: reg.registrationId,
    data: JSON.stringify({ title: 'Citation CIT-00042 paid', body: '£50.00 received', tag: 'payment' }),
  });

  // Assert what the service worker actually displayed
  await expect.poll(() => page.evaluate(async () =>
    (await (await navigator.serviceWorker.ready).getNotifications()).map((n) => n.title),
  )).toEqual(['Citation CIT-00042 paid']);
});
```

Measured in both headless modes with `permissions: ['notifications']`:

```
[default headless] Notification.permission: denied
                   push delivered to the worker: yes
                   showNotification -> TypeError: No notification permission has been granted for this origin.
[new headless]     Notification.permission: granted
                   push delivered to the worker: yes
                   getNotifications() -> [{"title":"Citation CIT-00042 paid","body":"£50.00 received","tag":"payment"}]
```

So delivery works everywhere, but **display only in new headless** — the default headless shell ignores the notifications grant, the same limitation as the camera. Two scope notes: this is CDP, so Chromium-only (see Ch03's cross-browser table); and it tests *your* worker's handling of a payload, not your server's integration with the push service — cover that with an API-level test against the push provider's sandbox.

---

## 6. Locale, Timezone & i18n Testing

### 6.1 The two config fields that catch a whole bug class

```ts
{ name: 'de-berlin',  use: { locale: 'de-DE', timezoneId: 'Europe/Berlin' } },
{ name: 'ja-tokyo',   use: { locale: 'ja-JP', timezoneId: 'Asia/Tokyo' } },
{ name: 'en-newyork', use: { locale: 'en-US', timezoneId: 'America/New_York' } },
```

`locale` drives `Intl.*`, `navigator.language`, and the `Accept-Language` header. `timezoneId` drives every `Date` the page renders. Together they surface:

- **Date parsing bugs**: `03/04/2026` is March 4 in New York and April 3 in Berlin. Any UI that round-trips a user-typed date through `new Date(string)` has this bug.
- **Day-boundary bugs**: a report "for today" queried in UTC shows *yesterday's* data to a Tokyo user until 9 AM. The Tokyo project + `clock.setFixedTime` at 08:00 JST catches it.
- **Layout breakage**: German strings run ~30% longer than English ("Settings" → "Einstellungen"). Buttons truncate, badges wrap.
- **Currency rounding**: `Intl.NumberFormat('de-DE')` renders `1.234,56 €` — string-based price assertions written for `$1,234.56` all fail, which is the *point*: your assertions should target semantic values, not formatted strings.

### 6.2 The assertion discipline i18n forces on you

```ts
// ❌ Breaks in every non-US project — asserts the FORMAT
await expect(page.getByTestId('total')).toHaveText('$1,234.56');

// ✅ Assert the semantic value; format is the browser's job
const totalText = await page.getByTestId('total').textContent();
const numeric = Number(totalText!.replace(/[^\d,.-]/g, '').replace(',', '.'));
expect(numeric).toBeCloseTo(1234.56, 2);

// ✅ Or better: the app exposes the raw value as a data attribute
await expect(page.getByTestId('total')).toHaveAttribute('data-amount', '1234.56');
```

The third form is the enterprise answer: agree with the frontend team that machine-readable values ride along in `data-*` attributes, and locale projects become nearly free.

### 6.3 The war story — the midnight DST failure

A nightly suite ran green for months, then failed 40 tests at exactly 02:00–03:00 on the last Sunday of March. Root cause: the app computed "tomorrow" as `now + 24h`; on the night Europe springs forward, that lands on the *same calendar day*, and every date-picker test asserting tomorrow's date was off by one. Nobody could reproduce it in the office — by 9 AM the bug was 6 hours in the past.

The fix as a permanent regression test:

```ts
test('date math survives the spring-forward night', async ({ page }) => {
  test.use({ timezoneId: 'Europe/Berlin' });
  await page.clock.install({ time: new Date('2026-03-29T00:30:00+01:00') }); // 90 min before the jump
  await page.goto('/booking');
  await page.getByRole('button', { name: 'Tomorrow' }).click();
  await expect(page.getByTestId('selected-date')).toHaveAttribute('data-date', '2026-03-30');
});
```

Clock + timezone emulation turned a once-a-year 2 AM heisenbug into a test that runs on every PR. That combination — freeze time *at* the nasty boundary — is the template: end of month, end of quarter, Feb 29, DST both directions, midnight UTC.

---

## 7. Color Scheme, Motion & Media Emulation

```ts
// Projects
{ name: 'dark-mode', use: { colorScheme: 'dark' } },

// Or per-test / mid-test
await page.emulateMedia({ colorScheme: 'dark' });
await page.emulateMedia({ reducedMotion: 'reduce' });
await page.emulateMedia({ forcedColors: 'active' });   // Windows High Contrast
```

Three distinct enterprise uses:

1. **Dark mode regression** — pair `colorScheme: 'dark'` with `toHaveScreenshot()` on your 10 core screens. The classic production bug (dark-gray text on dark background — technically rendered, actually invisible) is invisible to DOM assertions and obvious to a screenshot diff.
2. **`reducedMotion: 'reduce'` as a flakiness tool** — if the app respects `prefers-reduced-motion` (it should — it's a WCAG criterion), setting it globally in config disables transition animations, which removes the "clicked mid-animation" flake class entirely. Many enterprise configs set this on **every** project for exactly this reason.
3. **`forcedColors: 'active'`** — Windows High Contrast Mode strips author colors. Enterprise apps sold to governments and banks get audited for this; a screenshot pass under `forcedColors` is cheap evidence.

---

## 8. Aria Snapshots — Structural Assertions Between Text and Pixels

`toMatchAriaSnapshot` asserts the **accessibility tree** — more structure than `toHaveText`, less brittleness than `toHaveScreenshot`:

```ts
await expect(page.getByRole('navigation')).toMatchAriaSnapshot(`
  - navigation "Main":
    - link "Dashboard"
    - link "Reports"
    - button "Open menu" [expanded=false]
`);
```

Where it fits in the assertion hierarchy:

| Assertion | Catches | Blind to | Breaks when |
| --- | --- | --- | --- |
| `toHaveText` | one string | structure, roles, order | copy changes |
| `toMatchAriaSnapshot` | roles, names, hierarchy, state | pixels, colors, layout | semantic structure changes (usually a real regression) |
| `toHaveScreenshot` | everything visual | nothing | *anything* changes, incl. font rendering per OS |

Real-world sweet spot: complex composite widgets — navigation trees, data-grid headers, multi-step wizards — where "the structure is intact" is the actual requirement and a screenshot would flake on every font-hinting difference between local and CI. It also doubles as an accessibility contract: if the aria snapshot is empty or garbage, screen-reader users see empty garbage too — you cannot write this assertion for an inaccessible widget, which is quietly the best argument for using it.

Update workflow mirrors screenshots: `npx playwright test --update-snapshots` regenerates, and the diff shows up in code review as readable YAML instead of a binary PNG.

---

## 9. Wiring It Into the Framework — Fixtures Over Copy-Paste

The house pattern ([Ch06](../02_Test_Architecture/06_Custom_Fixtures_Architecture.md)): emulation setups become fixtures, so specs stay clean.

```ts
// fixtures/emulation.fixture.ts
import { test as base } from '@playwright/test';

type EmulationFixtures = {
  slowNetwork: void;
  frozenClock: Date;
};

export const test = base.extend<EmulationFixtures>({
  slowNetwork: [async ({ page, context, browserName }, use) => {
    test.skip(browserName !== 'chromium', 'CDP throttling is Chromium-only');
    const cdp = await context.newCDPSession(page);
    await cdp.send('Network.emulateNetworkConditions', {
      offline: false, latency: 400,
      downloadThroughput: 51_200, uploadThroughput: 51_200,
    });
    await use();
  }, { scope: 'test' }],

  frozenClock: [async ({ page }, use) => {
    const frozen = new Date('2026-07-25T10:00:00Z');
    await page.clock.install({ time: frozen });
    await use(frozen);
  }, { scope: 'test' }],
});
```

```ts
// checkout.slow.spec.ts
import { test } from '../fixtures/emulation.fixture';

test('checkout under slow network', async ({ page, slowNetwork }) => {
  // spec reads like a normal test; the environment is declared, not built
});
```

And the CI split ([Ch25](../06_CI_CD_And_Reliability/25_CICD_Integration_GitHub_Azure.md)):

| Tier | Projects | When |
| --- | --- | --- |
| PR gate | `desktop-chromium`, `mobile-smoke` | every push |
| Nightly | full device matrix + `de-berlin` + `dark-mode` + slow-network specs | 02:00 |
| Pre-release | real-device cloud thin suite + `forcedColors` screenshots | release branch |

---

## 🏋️ Practice Challenges

**Challenge 1 — The double-order bug.** Write a test that proves the "Place order" button cannot fire two POSTs: throttle to 400 kbps via CDP, click once, assert the button disables, and use `page.route` to count requests to `**/orders`. Then break the app (remove the disable) and confirm your test catches it.

**Challenge 2 — Token expiry across a lunch break.** Using `page.clock`, simulate: user loads the dashboard at 11:55, laptop lid closes (use `fastForward('01:05:00')`), lid opens. Assert the app either silently refreshed (if TTL logic uses absolute expiry) or shows the re-login screen — and decide with your team which one is *correct* before writing the assertion.

**Challenge 3 — The Tokyo report.** Add a `ja-tokyo` project. Freeze the clock at `2026-08-01T08:00:00+09:00` (which is July 31 in UTC). Load the "today's sales" report and assert which day's data appears. If the assertion surprises you, you have found the same bug half the industry has.

<details>
<summary>Challenge 3 — what you should observe</summary>

If the backend interprets "today" in UTC, the Tokyo user at 8 AM on August 1 sees **July 31** data — the report is a day behind for the first 9 hours of every Japanese business day. The fix is either passing the browser timezone to the API (`Intl.DateTimeFormat().resolvedOptions().timeZone`) or having the API accept an explicit date range computed client-side. The test's assertion should target `data-report-date="2026-08-01"` after the fix — and the pre-fix failure message is the exact evidence you attach to the ticket.

</details>

---

**Navigation**: [← Chapter 60: Tool Comparison](../08_SDET_to_SDE_Bridge/60_Tool_Comparison_Cypress_Selenium_WDIO.md) | [Index](../00_INDEX.md) | [→ Chapter 62: Enterprise Test Operations](../06_CI_CD_And_Reliability/62_Enterprise_Test_Operations.md)

---

## Reality Check

**"Device emulation is as good as testing on a real phone"** → Emulation reproduces viewport, DPR, touch events, and user agent — which covers layout and interaction logic. It does not reproduce: the OS keyboard covering half the viewport on focus, iOS Safari's dynamic toolbar collapsing, autofill behavior, or real GPU/CPU constraints. The enterprise split is emulation for every CI run plus a thin real-device suite for release gates. Teams that claim "we test mobile" but only emulate have never seen their form disappear behind the Android keyboard.

**"The Clock API makes time-based tests slower and more complex"** → The opposite on both counts. A session-timeout test with real time takes 30+ minutes and is scheduler-dependent; with `page.clock` it takes 2 seconds and is deterministic. The complexity moved from the test (flaky `waitForTimeout` chains) into one `clock.install` line. If your suite has any `waitForTimeout(60_000)` calls, the Clock API deletes them.

**"setOffline(true) simulates bad networks"** → `setOffline` is a binary kill switch — requests fail instantly. Real bad networks are worse than dead ones: requests *hang*, succeed after 20 seconds, or drop mid-response. Those need CDP `Network.emulateNetworkConditions` (latency/throughput) or `route.abort()` on specific endpoints. The bugs are different too: offline triggers your error path; slow triggers your *missing* loading-state path — the double-submit, the stuck spinner.

**"Locale testing means translating the test expectations"** → If switching to `de-DE` forces you to rewrite assertions from `$1,234.56` to `1.234,56 €`, the assertions were testing formatting, not behavior. Locale projects force the right discipline: assert semantic values (via `data-*` attributes or parsed numbers), let the browser own formatting. One suite then runs unmodified across all locale projects — the goal is zero locale-specific test code outside the config matrix.

**"Aria snapshots are just accessibility testing"** → `toMatchAriaSnapshot` is a *structural regression* tool that happens to read the accessibility tree. It sits between text assertions (too narrow) and screenshots (too brittle): it catches a nav item silently disappearing or a wizard step reordering, while ignoring font rendering and color shifts that flake screenshot tests across OSes. The accessibility benefit is the bonus: a widget with a meaningless aria snapshot is invisible to screen readers — the assertion doubles as an a11y contract.
