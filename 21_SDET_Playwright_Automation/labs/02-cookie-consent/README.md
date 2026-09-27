# Lab 02 — Cookie Consent: Tracking, Choices & a Banner That Won't Sit Still

**You'll practise:** watching the network as evidence · testing what must *not* happen · persistence across reloads · `page.addLocatorHandler()` for UI that appears at unpredictable moments
**Read first:** [Ch68 — Consent Banners, Overlays & CAPTCHA](../../03_Real_World_Scenarios/68_Consent_Overlays_And_CAPTCHA.md) §1–4
**Time:** 60–120 minutes

---

## The mission

The shop's legal team has one question: *"Can you prove we don't track people who haven't agreed to it?"* Marketing has a different one: *"The new banner keeps breaking our checkout tests — can you make them stop failing?"*

You need tests that answer both. They pull in opposite directions — one set must look *at* the banner, the other must shop *despite* it — and learning to separate those two jobs is the point of this lab.

The banner appears **200–900 ms after the page loads, at random** — you can't predict when. The product list comes from a slow API and takes about a second, so by the time a shopper can press **Add to cart**, the banner is already on screen.

## The requirements

"Tracking request" means any request to `/analytics.js` or `/collect`.

| ID | Requirement |
| --- | --- |
| **R1** | A first-time visitor sees a dialog named **"Cookie consent"** with **Accept all** and **Reject all** buttons. |
| **R2** | No tracking requests are made before the visitor makes a choice. |
| **R3** | After **Reject all**: no tracking requests at all — not now, and not after reloading — and the dialog does not come back. |
| **R4** | After **Accept all**: tracking starts (a `/collect` request is made), and the dialog does not come back after reloading. |
| **R5** | Shopping works whatever the banner does: a visitor can add the product to the cart and the cart shows **"1 item"**. This test must pass reliably even though the banner appears at an unpredictable moment. |

---

## How to work this lab

### 1. Explore

```bash
npm run app -- 02        # http://localhost:4400
```

Open it in a **private window** (so no old cookie exists). Watch DevTools → **Network** from the very first request. Then open DevTools → **Application → Cookies**: what gets stored when you choose? Reload a few times after clearing cookies — notice the banner never appears at the same moment twice.

### 2. Plan

In `tests/consent.spec.ts`, fill in the test plan. Two design questions to answer *before* coding:

- **How will you observe tracking?** You need a list of every tracking request the page makes. When must you start collecting it so that nothing slips past?
- **R5 is not a consent test.** What's the most robust way to get the banner out of the way *whenever* it appears? (Read Ch68 §3.) And what would be lost if you avoided the banner entirely by pre-setting the cookie?

### 3. Predict

1. Your R5 test clicks **Add to cart** at some point after page load. What happens to that click if the banner appeared 50 ms earlier?
2. You test R3 by clicking Reject and asserting the dialog is hidden. Name a bug that test would miss.
3. The grader runs your tests against the correct app **five times**. Why five, for this lab specifically?

### 4. Code, run, grade

```bash
npx playwright test 02-cookie-consent --headed      # app running in another terminal
npm run grade -- 02                                  # stop the app first
```

---

## Hints — one at a time

<details><summary>Hint 1 — recording tracking requests</summary>

Register a listener *before* navigating, and keep the URLs:

```ts
const tracking: string[] = [];
page.on('request', (r) => { if (/\/(analytics\.js|collect)/.test(new URL(r.url()).pathname)) tracking.push(r.url()); });
await page.goto('/');
```

Then "no tracking" is `expect(tracking).toEqual([])` — at the right moments.

</details>

<details><summary>Hint 2 — "no tracking before a choice" needs the banner on screen first</summary>

Asserting an empty list immediately after `goto` proves little: tracking might just not have *happened yet*. Wait for a moment that proves the page had its chance — the dialog becoming visible is a good one — and assert then.

</details>

<details><summary>Hint 3 — my R5 test is flaky</summary>

The click sometimes lands while the banner covers the page. Don't fight the timing — register a handler that dismisses the banner whenever Playwright meets it (`page.addLocatorHandler`, Ch68 §3). Make sure the handler really removes the dialog, or the action will wait for it until timeout.

</details>

<details><summary>Hint 4 — "Tracking starts" after Accept, but when?</summary>

Tracking is asynchronous. `expect(tracking).toContain(...)` checks once. `await expect.poll(() => tracking.some(u => u.includes('/collect'))).toBe(true)` keeps checking until it's true.

</details>

## Debrief

- Which requirement forced you to assert that something did **not** happen? What makes "nothing happened" hard to prove, and how did you make your assertion meaningful rather than just early?
- Your R5 test and your R3 test both deal with the banner. Why is one of them better off *handling* it and the other *interacting* with it deliberately?
- The consent choice lives in a cookie. List two other places an app could store it, and how your tests would change.
