# 68. Consent Banners, Overlays & CAPTCHA — The Things Standing Between Your Test and the App

**Navigation**: [← Chapter 67: Payment Gateway Testing](./67_Payment_Gateway_Testing.md) | [Stage 3 — Real-World Scenarios](./README.md) | [Index](../00_INDEX.md)

**Cross-links:**

- [Ch26 — Flakiness Diagnosis](../06_CI_CD_And_Reliability/26_Flakiness_Diagnosis_and_Fixing.md) — a surprise overlay is one of the most common "passes locally, fails in CI" causes
- [Ch57 — Login Taxonomy](./57_Login_Taxonomy_OAuth_OIDC_SAML_MFA_mTLS.md) — CAPTCHA usually guards login and sign-up
- [Ch16 — storageState Chaining](../04_Cross_Site_Patterns_And_D365/16_CrossSite_Pattern6_StorageState_Chaining.md) — the same mechanism pre-seeds consent
- [Ch40 — Security Testing](../07_Specialised_Testing/40_Security_Testing_OWASP.md) — a leaked CAPTCHA test secret is a security bug

> Every behaviour in this chapter was verified in Chromium with Playwright 1.60 against a local
> harness (a shop page whose consent banner appears 400 ms after load, with an analytics script
> that must not load before consent). The CAPTCHA test keys were checked against the vendors'
> **real** verification endpoints; the keys themselves are quoted from each vendor's documentation.

---

## 5W1H

- **WHAT**: Handling the UI that appears *around* the thing you're testing — cookie-consent banners, newsletter pop-ups, "rate this app" dialogs, chat widgets — and CAPTCHAs that exist specifically to stop automation.
- **WHY**: These are the top cause of tests that pass on a developer's machine (where consent was accepted months ago) and fail in CI (every run is a fresh browser). They also hide real, legally significant bugs: a site that loads tracking before the user consents is a GDPR problem, and that's testable.
- **WHO**: Anyone testing a public-facing site. Consent banners are near-universal in the EU/UK, and CAPTCHA guards most sign-up forms.
- **WHEN**: The moment your first CI run fails with "element intercepts pointer events".
- **HOW**: Decide per banner whether it's *in the way* (dismiss or prevent it) or *under test* (assert its behaviour). For CAPTCHA, never try to beat it — configure the vendor's test keys in the test environment.

---

## 1. What actually happens when an overlay appears

A consent banner that covers the page makes Playwright's click refuse to fire, because Playwright checks that the target would really receive the click. Measured — banner appears mid-test, no handling:

```
locator.click: Timeout 2500ms exceeded.
- <div id="cmp" role="dialog" aria-label="Cookie consent">…</div> intercepts pointer events
- <div id="cmp" role="dialog" aria-label="Cookie consent">…</div> intercepts pointer events
- <div id="cmp" role="dialog" aria-label="Cookie consent">…</div> intercepts pointer events
```

This is Playwright protecting you: a real user couldn't click through the banner either. The fix is never `{ force: true }` — that clicks through the overlay and tests a page no user can see.

You have three tools, for three different situations:

| Situation | Tool | Why |
| --- | --- | --- |
| The banner is **in the way**, and the test isn't about it | Pre-seed the consent cookie (§2) | Banner never renders; fastest and fully deterministic |
| Something appears **unpredictably** (timing varies, A/B tested, third-party) | `page.addLocatorHandler()` (§3) | Dismisses it whenever it shows up, mid-action |
| The banner **is** what you're testing | Interact with it explicitly (§4) | It's the feature under test |

Playwright's own guidance on the middle row: when an overlay appears *predictably*, wait for it and dismiss it as a normal step instead of using a handler. Handlers are for the unpredictable ones.

---

## 2. Prevent it: pre-seed the consent cookie

Consent platforms remember the choice in a cookie (or `localStorage`). Put it there before the page loads and the banner never appears:

```ts
test.beforeEach(async ({ context, baseURL }) => {
  await context.addCookies([{ name: 'consent', value: 'essential', url: baseURL! }]);
});
```

Verified: with the cookie pre-seeded, the banner count after 700 ms was **0**, and a click that previously timed out succeeded immediately. For a whole suite, do it once in global setup and save it into the `storageState` every test already loads ([Ch16](../04_Cross_Site_Patterns_And_D365/16_CrossSite_Pattern6_StorageState_Chaining.md)).

Two cautions. Pre-seed **"essential only"** unless a test specifically needs analytics — a suite that accepts everything sends test traffic into your production analytics and can mask the consent bugs in §4. And real consent platforms (OneTrust, Cookiebot, Didomi and others) use their own cookie names and value formats; read yours from DevTools once after clicking the banner, and pin the exact value.

---

## 3. Handle it when it's unpredictable: `page.addLocatorHandler()`

```ts
await page.addLocatorHandler(
  page.getByRole('dialog', { name: 'Cookie consent' }),
  async (banner) => { await banner.getByRole('button', { name: 'Reject all' }).click(); },
);

await page.goto('/shop');
await page.getByRole('button', { name: 'Add to cart' }).click();   // written as if the banner didn't exist
```

How it works (from Playwright's own documentation): before every action that performs an actionability check, and before every retry of an auto-waiting assertion, Playwright checks whether the handler's locator is visible. If it is, the handler runs first; then Playwright **waits for that locator to become hidden** before continuing. Verified: the banner appeared mid-test, the handler ran exactly once, and the click then succeeded (`cart: 1 item | handler calls: 1`).

### The trap: a handler that doesn't actually remove the overlay

That "then waits for it to become hidden" step is the default (`noWaitAfter: false`). If your handler doesn't get rid of the overlay — wrong button name, the click lands on a banner that needs two steps, the platform re-renders it — the action hangs until its timeout. Measured with a handler that ran but didn't dismiss:

```
locator.click: Timeout 3000ms exceeded. (after 3013 ms)
call log: - locator handler has finished, waiting for getByRole('dialog', { name: 'Cookie consent' }) to be hidden
          | 10 × locator resolved to visible <div id="cmp" role="dialog" aria-label="Cookie consent">…</div>
```

The call log names the cause precisely — read it before blaming the button. Other rules worth knowing:

- **`{ times: 1 }`** removes the handler after one call — right for a banner that shows once per session.
- **`{ noWaitAfter: true }`** skips the "wait until hidden" step — only for handlers whose trigger locator legitimately stays visible.
- The handler's time **counts against the action's timeout**, so a slow dismissal can cause the timeout you were trying to avoid.
- The handler **changes page state mid-test**: it moves focus and the mouse. A test that does `locator.focus()` then `keyboard.press()` can have a handler run between them and type into the wrong element. Prefer self-contained actions like `click()` and `fill()`.
- A handler only fires when your test performs an action or assertion. An overlay that appears while the test is idle is ignored until the next action.

---

## 4. When the banner is the feature: testing consent itself

Under GDPR and the UK/EU cookie rules, **non-essential tracking must not run before consent, and a rejection must be honoured**. That's a testable, legally significant requirement, and suites that pre-seed consent everywhere never check it. Measured — network requests to the analytics endpoints before and after each choice, then again after a reload:

```
Reject all -> tracking before choice: [] | after: []                          | cookie: essential
              after reload: banner=0 tracking=[]
Accept all -> tracking before choice: [] | after: ["analytics.js","collect"]  | cookie: all
              after reload: banner=0 tracking=["analytics.js","collect"]
```

```ts
test('no tracking before consent, and Reject is honoured after reload', async ({ page }) => {
  const tracking: string[] = [];
  page.on('request', (r) => { if (/analytics|collect|gtag|pixel/.test(r.url())) tracking.push(r.url()); });

  await page.goto('/');
  await expect(page.getByRole('dialog', { name: 'Cookie consent' })).toBeVisible();
  expect(tracking, 'tracking fired BEFORE the user chose').toEqual([]);

  await page.getByRole('dialog', { name: 'Cookie consent' }).getByRole('button', { name: 'Reject all' }).click();
  await page.reload();
  await expect(page.getByRole('dialog', { name: 'Cookie consent' })).toHaveCount(0);   // choice remembered
  expect(tracking, 'tracking fired after Reject').toEqual([]);
});
```

The two most common real defects this catches: a tag manager that loads analytics on page load and only *stops* after rejection (the "before" assertion fails), and a choice stored in a way that doesn't survive a reload or a new tab (the banner reappears, or tracking resumes).

---

## 5. CAPTCHA — use the vendor's test keys, never try to beat it

A CAPTCHA's whole purpose is to stop automation. Trying to solve it in a test — OCR, audio transcription, paid solving services, stealth plugins — makes your suite a bot-detection arms race that breaks whenever the vendor updates, and it may breach the vendor's terms. Every major vendor instead publishes **test keys**: configure them in your test environment and the widget passes (or fails) deterministically.

### 5.1 The published test keys

**Cloudflare Turnstile** ([testing docs](https://developers.cloudflare.com/turnstile/troubleshooting/testing/)):

| Site key | Behaviour |
| --- | --- |
| `1x00000000000000000000AA` | Always passes (visible) |
| `2x00000000000000000000AB` | Always fails (visible) |
| `1x00000000000000000000BB` | Always passes (invisible) |
| `2x00000000000000000000BB` | Always fails (invisible) |
| `3x00000000000000000000FF` | Forces an interactive challenge (visible) |

| Secret key | Behaviour |
| --- | --- |
| `1x0000000000000000000000000000000AA` | Validation passes |
| `2x0000000000000000000000000000000AA` | Validation fails |
| `3x0000000000000000000000000000000AA` | Returns `timeout-or-duplicate` |

Test site keys produce the dummy token `XXXX.DUMMY.TOKEN.XXXX`, which production secret keys reject.

**Google reCAPTCHA v2** ([FAQ](https://developers.google.com/recaptcha/docs/faq)): site key `6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI`, secret key `6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe` — "all verification requests will pass", and the widget shows a warning that it isn't for production. For reCAPTCHA **v3**, Google says to create a separate key for testing environments; there's no universal test key.

**hCaptcha** ([docs](https://docs.hcaptcha.com/#integration-testing-test-keys)): site key `10000000-ffff-ffff-ffff-000000000001`, secret `0x0000000000000000000000000000000000000000`, which always yields the response token `10000000-aaaa-bbbb-cccc-000000000001` and `success: true`. Enterprise accounts have additional keys for "safe user" and "bot detected" scenarios.

### 5.2 Verified against the real verification endpoints

The half that matters most is your **server's** check, so the secrets were posted to each vendor's live `siteverify` endpoint:

```
Turnstile pass secret           -> {"success":true,"error-codes":[]}
Turnstile fail secret           -> {"success":false,"error-codes":["invalid-input-response"]}
Turnstile timeout secret        -> {"success":false,"error-codes":["timeout-or-duplicate"]}
Turnstile non-test secret + dummy token -> ["invalid-input-secret"]
reCAPTCHA v2 test secret, token "anything-at-all" -> {"success":true,"hostname":"testkey.google.com"}
hCaptcha test secret + test token  -> {"success":true}
hCaptcha test secret + WRONG token -> {"success":false,"error-codes":["invalid-input-response"]}
```

### 5.3 What to actually test

Test keys turn CAPTCHA into ordinary cases:

| Case | Configure | Assert |
| --- | --- | --- |
| Human passes | "always passes" site + secret | Form submits; account created |
| Bot blocked | Turnstile `2x…AB` / fail secret | Form rejected **server-side**, with a usable message |
| Token expired or replayed | Turnstile `3x…AA` (`timeout-or-duplicate`) | User can re-verify without losing what they typed |
| Challenge shown | Turnstile `3x…FF` | The form stays usable while the challenge is open |
| No token submitted | Strip the token field from the request (API test) | Server rejects — the client-side widget is not the gate |

That last row is the one most often missed. The widget in the browser is only a token producer; the security decision is the server's `siteverify` call. An API-level test that posts the form **without** a token, and expects rejection, proves the server enforces it. A browser test with a passing widget proves nothing about that.

### 5.4 The production guard-rail

Look at the reCAPTCHA row again: Google's test secret returned `success: true` for the literal token `"anything-at-all"`. If that secret ever reaches production config, **every bot passes** — silently, because nothing errors. Two cheap defences:

1. **Check `hostname` on the server.** The test key's responses report `hostname: "testkey.google.com"`; a server that compares `hostname` against its own domain rejects them automatically.
2. **A CI check that production configuration contains none of the published test keys.** It's a one-line grep over deployed config for the keys in §5.1, and it catches the copy-paste mistake before it ships.

---

## 🏋️ Practice Challenges

### Challenge 1 [Diagnose]

A test passes on your laptop and fails in CI with `<div id="onetrust-banner-sdk"> intercepts pointer events`. A teammate proposes `click({ force: true })`. What's wrong with that, and what do you do instead?

<details><summary>Answer</summary>

Your laptop's browser profile accepted consent long ago; CI starts fresh every run, so the banner appears there only. `force: true` clicks *through* an overlay a real user can't click through, so the test would pass while testing an impossible interaction. If the test isn't about consent, pre-seed the consent cookie (or bake it into `storageState`) so the banner never renders. If the banner's timing is unpredictable, register `page.addLocatorHandler()` for it.

</details>

### Challenge 2 [Spot the Bug]

```ts
await page.addLocatorHandler(page.locator('#newsletter-modal'), async () => {
  await page.getByRole('button', { name: 'Close' }).click();
});
```

Tests now intermittently time out, and the call log says `locator handler has finished, waiting for locator('#newsletter-modal') to be hidden`. What are two likely causes?

<details><summary>Answer</summary>

After the handler runs, Playwright waits for `#newsletter-modal` to be hidden (default `noWaitAfter: false`), so the modal is still visible. Either (1) `getByRole('button', { name: 'Close' })` matches a *different* Close button on the page (not scoped to the modal — use the `locator` argument the handler receives, e.g. `modal.getByRole('button', { name: 'Close' })`), or (2) the modal needs more than one step to dismiss, or animates out slower than the action's remaining timeout.

</details>

### Challenge 3 [Design]

Your team pre-seeds "accept all" consent in global setup for the entire suite. What production risk does that create, and what test would you add?

<details><summary>Answer</summary>

No test ever exercises the pre-consent or rejected state, so "tracking loads before consent" and "Reject isn't honoured" can't be caught — both are GDPR/UK-GDPR exposures. Seed "essential only" by default, and add §4's test: record tracking requests, assert none before the choice, click Reject, reload, assert the banner is gone and tracking is still empty.

</details>

### Challenge 4 [Security]

Your sign-up tests use reCAPTCHA's test keys and all pass. How do you prove the **server** actually enforces the CAPTCHA?

<details><summary>Answer</summary>

Browser tests with a passing widget can't prove it. Add an API test that submits the sign-up form with the token field missing (and one with an invalid token) and expects rejection. Also verify that production config never contains the published test secret — Google's test secret returns `success: true` for any token — and that the server checks the `hostname` in the `siteverify` response.

</details>

---

**Navigation**: [← Chapter 67: Payment Gateway Testing](./67_Payment_Gateway_Testing.md) | [Stage 3 — Real-World Scenarios](./README.md) | [Index](../00_INDEX.md)

---

## Reality Check

**"Just use `force: true` to click through the banner"** → Force-clicking bypasses Playwright's actionability checks, so the test clicks something no real user could reach. It hides the banner problem instead of solving it, and it will hide a genuinely broken overlay too.

**"Our E2E tests pass, so our consent implementation is compliant"** → Almost every suite pre-seeds consent, so the banner, the pre-consent state and the reject path are never exercised. Compliance needs its own tests that start from a fresh browser and watch the network.

**"We'll automate the CAPTCHA with an AI model"** → Beating a CAPTCHA turns your test suite into a bot. It's brittle, often against the vendor's terms, and pointless — every major vendor publishes test keys for exactly this. The CAPTCHA you should be testing is your server's verification of it.

**"The CAPTCHA widget passed, so sign-up is protected"** → The widget only produces a token. Protection happens when your server verifies that token. Test the server by submitting without a token, not by passing the widget.
