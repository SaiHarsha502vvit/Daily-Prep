# Lab 05 — OTP Login: Single-Use Codes, Lockouts & Whose Clock Is It?

- **You'll practise:** getting a secret out of a side channel (the "email") through a test-support endpoint · mixing UI and API steps in one test · testing *rules* rather than *screens* · controlling time on the right side of the wire
- **Read first:** [Ch57 — Login Taxonomy](../../03_Real_World_Scenarios/57_Login_Taxonomy_OAuth_OIDC_SAML_MFA_mTLS.md) §6.2 (Email / SMS OTP) · [Ch61 — Emulation](../../03_Real_World_Scenarios/61_Emulation_Clock_Network_And_Devices.md) §3 (the Clock API)
- **Time:** 90–150 minutes

---

## The mission

Our parking-permit portal is dropping passwords. To sign in you type your email, we "email" you a 6-digit code, you type it in. Security signed off on the rules below. Your job: prove every one of them holds — because a one-time code that isn't really one-time is a password anyone can guess.

## What you can use

| Endpoint | What it does |
| --- | --- |
| `GET /` | The sign-in page (email → **Send code** → **6-digit code** → **Verify**; a **Resend code** button unlocks after a 30 s countdown). |
| `POST /api/otp/send` `{ "email" }` | What **Send code** / **Resend code** call. `200 { sent: true }`, or `429` (too soon), or `423` (locked). |
| `POST /api/otp/verify` `{ "email", "code" }` | What **Verify** calls. `200 { email }`, or `401 { error: "Invalid or expired code" }`, or `423` (locked). |
| `GET /test-support/otp?email=…` | **Test environments only.** Returns `{ code }` — the latest code "emailed" to that address. This is your inbox. |
| `POST /test-support/clock` `{ "advanceSeconds" }` | **Test environments only.** Moves the **server's** clock forward. |

On success the page heading becomes `Welcome, <email>`; on failure the message appears in the page's alert.

## The requirements

| ID | Requirement |
| --- | --- |
| **R1** | Entering the emailed code signs the user in. |
| **R2** | A code works **once**. Using it a second time is refused (`401`). |
| **R3** | Requesting a new code **retires** every earlier code for that user. |
| **R4** | After **5** wrong codes the account is **locked**: further attempts get `423` — **even with the correct code**. |
| **R5** | A new code can't be requested within **30 s** of the last one. This is a **server** rule (`429`), not just a disabled button. |
| **R6** | A code **expires** 60 s after it was sent. |

---

## How to work this lab

### 1. Explore

`npm run app -- 05`, open <http://localhost:4400>, sign in by hand. Get your code with:

```bash
curl -s "http://localhost:4400/test-support/otp?email=me@example.com"
```

Then, in a terminal, try to break a rule yourself before you write a test for it — e.g. call `/api/otp/send` twice in a row with `curl -X POST ... -d '{"email":"me@example.com"}'`. What did the server say?

### 2. Plan

Write the TEST PLAN block at the top of `tests/otp.spec.ts`. For each requirement, decide:

- **Where is the rule enforced?** A disabled button enforces nothing — anyone can call the API. Which requirements can a *UI-only* test never prove?
- **What would a user share?** Every test creating users with the same email will collide (lockouts! cooldowns!). How will each test get its own user?
- **Which clock?** R3 needs the 30 s cooldown to be over; R6 needs 60 s to pass. You will not wait 60 real seconds. `page.clock` fakes time **inside the browser**. Who checks whether a code has expired?

### 3. Predict

1. You fake the browser clock forward 61 s with `page.clock`, then enter the code. What happens? Why?
2. R4: after 5 wrong attempts, *what exactly* do you send to prove the lock is real? (A 6th wrong code proves less than you think.)
3. R2: after a successful login the page shows "Welcome" and the form is gone. How do you use the code a second time?

### 4. Code, run, grade

```bash
npx playwright test 05-otp-login        # app running in another terminal
npm run grade -- 05
```

---

## Hints — one at a time

<details><summary>Hint 1 — reading the "email"</summary>

The `request` fixture shares `baseURL` with `page`:

```ts
const { code } = await (await request.get(`/test-support/otp?email=${encodeURIComponent(email)}`)).json();
```

Fetch it **after** the page has sent the code — otherwise there's nothing in the inbox yet (wait for the code field to appear first).

</details>

<details><summary>Hint 2 — one user per test</summary>

`import { randomUUID } from 'node:crypto'` → `` `user-${randomUUID()}@example.com` ``. Now no test's lockout or cooldown can leak into another — and the grader runs your tests several times against the same server.

</details>

<details><summary>Hint 3 — whose clock</summary>

The server decides expiry and cooldown with **its** clock. `page.clock` only changes `Date`/timers in the page — the page's countdown will race ahead, the server won't care. Use `POST /test-support/clock` with `{ advanceSeconds: 61 }`.

</details>

<details><summary>Hint 4 — proving a rule the UI hides</summary>

Call the API directly: `request.post('/api/otp/send', { data: { email } })` and assert the **status**. For R2, `request.post('/api/otp/verify', { data: { email, code } })` with the already-used code.

</details>

## Debrief

- Three of the six rules (R2, R4, R5) are invisible to a test that only drives the UI the way a polite user does. Which *kind* of user is each rule actually protecting against?
- R5's bug had a perfectly working disabled button. Write the one-line bug report you'd file — to whom, and why it matters (hint: every "email" or SMS costs money).
- Your R6 test moved the server's clock. Name a production system where you *can't* do that, and what you'd do instead (think: short expiry configured per environment, or a signed token with a timestamp — see [Lab 04](../04-webhook-receiver/README.md)).
