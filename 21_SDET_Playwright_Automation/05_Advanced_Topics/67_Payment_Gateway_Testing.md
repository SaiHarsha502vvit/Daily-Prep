# 67. Payment Gateway Testing — Hosted Fields, 3-D Secure, Idempotency, Webhooks & Money

**Navigation**: [← Chapter 66: Senior SDET Decision-Making](../06_SDET_to_SDE_Bridge/66_Senior_SDET_Decision_Making.md) | [Index](../00_INDEX.md)

**Cross-links:**

- [Ch42 — Polling & Async Data](./42_Polling_Async_Data_Patterns.md) — payment status is asynchronous; §7 below polls it
- [Ch57 — Login Taxonomy (OAuth, MFA, OTP, WebAuthn)](./57_Login_Taxonomy_OAuth_OIDC_SAML_MFA_mTLS.md) — 3-D Secure is step-up authentication, the same family as MFA
- [Ch30 — Database Verification](./30_Database_Verification_Direct_SQL.md) — asserting the ledger, not the UI
- [Ch31 — API Mocking with `page.route()`](./31_API_Mocking_page_route.md) — and why you usually should *not* mock the gateway itself
- [Ch40 — Security Testing](../07_Specialised_Testing/40_Security_Testing_OWASP.md) — webhook forgery is a security bug, not just a functional one

> **Scope and honesty note.** Every browser mechanism in this chapter was verified by
> running it in real Chromium against a local two-origin harness (a "merchant" on
> `localhost` and a mock "PSP" on `127.0.0.1`, which the browser treats as different
> origins). Every webhook-signature claim was verified against **Stripe's official Node
> SDK, `stripe` v22.6.2**. Stripe-specific facts — test card numbers, the signature
> scheme, retry and ordering guarantees, currency rules — are quoted from Stripe's docs
> ([testing](https://docs.stripe.com/testing), [webhooks](https://docs.stripe.com/webhooks),
> [currencies](https://docs.stripe.com/currencies)). What was **not** done: driving
> Stripe's live hosted fields, because that needs a real account's test keys. The frame
> titles and button labels for Stripe's own iframes need confirming against your
> integration; the *mechanics* taught here are the part that transfers to any provider.

---

## 5W1H

- **WHAT**: End-to-end and API-level testing of a card checkout — card entry inside a PSP's hosted fields, 3-D Secure challenges, declines, double-submit protection, asynchronous confirmation via webhooks, refunds, and the money arithmetic underneath all of it.
- **WHY**: Payments are the one flow where a "flaky but mostly fine" bug costs real money in both directions — double charges become chargebacks and support tickets; undercharges are silent revenue loss. They also concentrate every hard testing problem at once: third-party cross-origin UI, asynchronous state, retries, idempotency, and a security boundary.
- **WHO**: Any SDET on a product that takes money — e-commerce, SaaS billing, fines and citations (this curriculum's running example), bookings.
- **WHEN**: Before the first production charge, and on every change to checkout, pricing, currency handling, or the webhook consumer.
- **HOW**: Test most of the flow **below** the browser (PaymentIntents with test PaymentMethods, signed test webhooks), and keep a small number of **browser** tests for what only a browser can prove: the hosted fields, the 3DS challenge, and the double-click.

---

## 1. Why payments break the usual testing model

Three properties make a checkout different from a normal form:

1. **The card fields are not your DOM.** For PCI reasons the card number, expiry and CVC are rendered by the payment provider inside a **cross-origin iframe** ("hosted fields"). Your page cannot read them — and neither can a locator rooted at your page (§3).
2. **"Succeeded" is decided somewhere else, later.** The browser's redirect to `/order/success` means the *client* finished its part. Whether money moved is decided by the gateway and announced to your server asynchronously by webhook (§6). A test that asserts on the success page is asserting on the wrong system.
3. **Repeating an action is not harmless.** A double-click, a retry after a timeout, or a webhook delivered twice can each create a second charge unless the system is built to make repeats idempotent (§5).

### The payment test pyramid

| Layer | What it proves | Tooling | How many |
| --- | --- | --- | --- |
| **API**: create/confirm PaymentIntents with test PaymentMethods | Pricing, currency, decline handling, refunds, your order state machine | `request` fixture + gateway test mode | Many |
| **Webhook consumer**: POST signed test events to your endpoint | Signature checks, dedupe, out-of-order handling, fulfilment | Signed payloads (§6.2) | Many |
| **Browser**: hosted fields + 3DS + double-submit | The integration the customer actually touches | `frameLocator`, `dblclick` | Few |

Stripe's own guidance points the same way — for API tests, use test **PaymentMethod IDs** rather than raw card numbers:

> "We don't recommend using card numbers directly in API calls or server-side code, even in testing environments. If you use them, your code might not be PCI-compliant when you go live." — [Stripe testing docs](https://docs.stripe.com/testing)

```typescript
// API-level: no browser, no card number anywhere in your code
const res = await request.post("https://api.stripe.com/v1/payment_intents", {
  headers: { Authorization: `Bearer ${process.env.STRIPE_TEST_SECRET_KEY}` },
  form: { amount: "500", currency: "gbp", payment_method: "pm_card_visa", confirm: "true" },
});
```

(`pm_card_visa`, `pm_card_mastercard`, `pm_card_amex` and `pm_card_discover` are Stripe's documented test PaymentMethods. Keep the secret key in a secrets manager — see [Ch51](../07_Specialised_Testing/51_Secrets_Management_For_SDETs.md).)

---

## 2. The test-card matrix — design cases from the gateway's scenarios

A payment suite that only tests `4242…` tests the one path that never fails. The gateway publishes a card per failure mode; each one is a test case you get for free. From [Stripe's testing docs](https://docs.stripe.com/testing):

| Scenario | Card number | Error code | `decline_code` |
| --- | --- | --- | --- |
| Success (Visa) | `4242424242424242` | — | — |
| Generic decline | `4000000000000002` | `card_declined` | `generic_decline` |
| Insufficient funds | `4000000000009995` | `card_declined` | `insufficient_funds` |
| Lost card | `4000000000009987` | `card_declined` | `lost_card` |
| Expired card | `4000000000000069` | `expired_card` | — |
| Incorrect CVC | `4000000000000127` | `incorrect_cvc` | — |
| Processing error | `4000000000000119` | `processing_error` | — |
| 3DS required, completes | `4000000000003220` (IE), `4000008400000027` (US) | — | — |
| 3DS always authenticate | `4000002760003184` | — | — |
| 3DS required, then declined | `4000008400001629` | `card_declined` | — |

Use any future expiry (Stripe suggests `12/34`) and any 3-digit CVC (4 digits for Amex).

**What to assert for a decline** is not "an error appeared". Assert the three things a real customer and a real support agent depend on:

```typescript
const declines = [
  { card: "4000000000009995", message: /insufficient funds/i },
  { card: "4000000000000069", message: /expired/i },
  { card: "4000000000000127", message: /security code|cvc/i },
] as const;

for (const { card, message } of declines) {
  test(`decline ${card}: specific, retryable error and no order`, async ({ ordersApi }) => {
    const before = await ordersApi.countFor(testCustomer.id);
    await checkout.payWith(card);
    await expect(checkout.errorBanner).toHaveText(message);          // 1. specific, not "Something went wrong"
    await expect(checkout.payButton).toBeEnabled();                   // 2. the customer can try another card
    expect(await ordersApi.countFor(testCustomer.id)).toBe(before);   // 3. no order for a failed payment
  });
}
```

Case 3 is the one teams miss: a decline that still creates a "pending" order which later gets fulfilled is a real, recurring production bug.

---

## 3. Hosted fields — reaching into a cross-origin iframe

### 3.1 Why `page.locator()` finds nothing

Measured against the harness (merchant on `localhost`, card fields served from `127.0.0.1`):

```
page.locator('[name=cardnumber]').count()         = 0
frameLocator(...).getByLabel('Card number') value = 4242424242424242
page.evaluate into cross-origin iframe DOM        -> TypeError: Cannot read properties of null (reading 'querySelector')
```

- A page-rooted locator searches the **page's** document. The card input lives in a *different document* inside the iframe, so the count is 0 — no error, just nothing. A test built on it waits until timeout and reports "element not found" for an element that is plainly on screen.
- `page.evaluate()` runs *as the page*, so it is bound by the same-origin policy: `iframe.contentDocument` of a cross-origin frame is `null`. This is the browser's PCI boundary doing its job, not a Playwright limitation.
- `frameLocator()` works because Playwright drives each frame through the browser's automation protocol, underneath the same-origin policy rather than through page JavaScript.

```typescript
// Anchor on the iframe's title — PSPs set it for accessibility, and it is far
// more stable than generated names. Confirm the exact title in your integration.
const card = page.frameLocator('iframe[title="Secure card payment input frame"]');

await card.getByLabel("Card number").fill("4242424242424242");
await card.getByLabel("Expiration").fill("12/34");
await card.getByLabel("CVC").fill("123");
```

(Same technique as D365's `contentIFrame0` in [Ch10](../03_D365_And_Patterns/10_Dynamics365_CRM_Testing.md) and the POM-root question in [Ch05 §14](../02_Core_Architecture/05_POM_Architecture_Deep_Dive.md) — except here the iframe is cross-origin, so `frameLocator` isn't a convenience, it's the only way in.)

### 3.2 `fill()` vs `pressSequentially()` on formatting inputs

Card inputs usually format as you type (`4242 4242 4242 4242`). *How* they format decides which Playwright method works. The harness includes a field that formats on **keydown**:

```
fill()              -> "4242424242424242"
pressSequentially() -> "4242 4242 4242 4242"
```

`fill()` sets the value and dispatches a single `input` event — **no key events at all** — so a keydown-driven formatter never runs and the field ends up holding a raw value its own code never produced. Depending on the provider that is harmless, rejected, or silently "valid but different". `pressSequentially()` generates real key events and exercises the formatter the customer exercises.

Rule of thumb: start with `fill()`; if the field's displayed value or validation state differs from what a human typing produces, switch that field to `pressSequentially()`. Don't reach for `{ delay }` unless the field genuinely debounces — it only makes the test slower.

---

## 4. 3-D Secure — a nested, cross-origin challenge

Strong Customer Authentication (3DS) puts the **bank's** challenge page in front of the customer, typically as an iframe inside the provider's container iframe — two cross-origin hops from your page. Chain `frameLocator` once per hop:

```typescript
await checkout.payWith("4000000000003220"); // "3DS required" test card

const challenge = page
  .frameLocator('iframe[title="3DS container"]')          // provider's container
  .frameLocator('iframe[title="3D Secure challenge"]');   // the bank (ACS) page inside it

await challenge.getByRole("button", { name: "Complete authentication" }).click();
await expect(page.getByText("Payment succeeded")).toBeVisible();
```

Verified in the harness: the nested challenge page reported back to the merchant via `postMessage`, and the merchant page showed `Payment succeeded`. The frame titles above are the harness's; a real provider's test-mode challenge has its own titles and buttons — inspect your integration once with the [Trace Viewer](../02_Core_Architecture/55_Inspector_TraceViewer_UIMode_Walkthrough.md) and pin those.

**The 3DS cases worth automating** (each maps to a test card in §2):

| Case | Expected outcome |
| --- | --- |
| Challenge completed | Payment succeeds; order created exactly once |
| Challenge **failed** | Payment fails; customer can retry; **no order** |
| Challenge **abandoned** (customer closes it) | No charge; checkout usable again, not stuck in "processing" |
| Completed, then declined (`4000008400001629`) | Decline shown *after* successful authentication — the confusing one; check the message makes sense |

---

## 5. Double-submit and idempotency — assert effects, not requests

Measured with three versions of the same Pay button, each double-clicked with `locator.dblclick()`:

```
naive button, dblclick     -> server received 2 POST(s): [ '(no key)', '(no key)' ]
idempotency key, dblclick  -> server received 2 POST(s), same key: true
disabled-while-pending     -> server received 1 POST(s)
```

Read the middle line carefully, because it is the one people get wrong. **An idempotency key does not prevent the second request.** Both requests arrived. What it prevents is the second *effect*: the server recognises the repeated key and returns the stored result of the first request instead of charging again. So:

- A test asserting "only one request was sent" **fails** against a correctly idempotent system (2 requests) and **passes** against the disabled-button version — which protects only against double-clicks, not against a network retry, a refresh, or a second tab.
- The assertion that actually encodes the business rule is on **charges/orders created**:

```typescript
test("double-clicking Pay charges the customer exactly once", async ({ page, paymentsApi }) => {
  await checkout.fillCard("4242424242424242");
  await checkout.payButton.dblclick();
  await expect(page.getByText("Payment succeeded")).toBeVisible();

  // Poll: the second request may still be in flight when the success page renders.
  await expect
    .poll(() => paymentsApi.chargesFor(orderId).then((c) => c.length), { timeout: 15_000 })
    .toBe(1);
});
```

Two design rules the test is checking:

1. **One key per checkout attempt, generated before the first click** — not per request. A key generated inside the click handler is a fresh key per click and protects nothing.
2. **The same key must reach the gateway.** Stripe accepts an `Idempotency-Key` header on POST requests; the merchant server must forward the client's key (or derive one deterministically from the order) rather than minting its own per call.

Beyond the double-click, the same test shape covers the other ways a charge repeats: `page.reload()` mid-payment, the Back button after success, and a `page.route()`-injected timeout on the first `/pay` response that makes the client retry (see [Ch31](./31_API_Mocking_page_route.md) and [Ch65](./65_Chaos_Engineering_For_Playwright.md)).

---

## 6. Webhooks — the part that actually says "paid"

### 6.1 What the gateway guarantees (and doesn't)

From [Stripe's webhook docs](https://docs.stripe.com/webhooks), four facts your consumer — and therefore your tests — must handle:

| Fact | Stripe's wording | Test it implies |
| --- | --- | --- |
| **No ordering** | "Stripe doesn't guarantee the delivery of events in the order that they're generated." | Deliver `charge.refunded` before `payment_intent.succeeded`; the end state must still be correct |
| **Duplicates happen** | "Webhook endpoints might occasionally receive the same event more than once." | Deliver the same event twice; fulfil once |
| **Retries** | Live mode retries "for up to three days with an exponential backoff"; sandbox events "three times over the course of a few hours" | Return 500 once, then accept; end state correct, no double fulfilment |
| **Verify using the raw body** | "Stripe requires the raw body of the request to perform signature verification." | Forged, altered and stale payloads are rejected |

Also note Stripe's warning about the obvious-but-wrong dedupe key: `created` is recorded in seconds, "so distinct events can share a timestamp. Don't use `created` to determine event order or whether you've already processed an event. Track event IDs … instead."

### 6.2 Signing test events yourself

The signature scheme, per Stripe: header `Stripe-Signature: t=<timestamp>,v1=<hex>`, where `v1` is **HMAC-SHA256** of the string `"<timestamp>.<raw body>"`, keyed with the endpoint's `whsec_…` signing secret. That is small enough to implement as a test helper:

```typescript
// framework/utilities/payments/stripe-webhook.helper.ts
import { createHmac } from "node:crypto";

export function signStripeTestPayload(
  payload: string,
  secret: string,
  timestamp: number = Math.floor(Date.now() / 1000),
): string {
  const v1 = createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
  return `t=${timestamp},v1=${v1}`;
}
```

```typescript
test("webhook consumer marks the order paid", async ({ request, ordersApi }) => {
  const payload = JSON.stringify({
    id: `evt_test_${crypto.randomUUID()}`,
    type: "payment_intent.succeeded",
    data: { object: { id: "pi_test_123", amount: 5000, currency: "gbp", metadata: { orderId } } },
  });
  const res = await request.post("/webhooks/stripe", {
    headers: {
      "Stripe-Signature": signStripeTestPayload(payload, process.env.STRIPE_WEBHOOK_SECRET!),
      "Content-Type": "application/json",
    },
    data: payload, // a STRING — sent byte-for-byte, so the signature still matches
  });
  expect(res.status()).toBe(200);
  await expect.poll(() => ordersApi.status(orderId)).toBe("PAID");
});
```

This helper was checked against **Stripe's own verifier** (`stripe.webhooks.constructEvent`, SDK v22.6.2), with the SDK's `generateTestHeaderString` as a cross-check. The full matrix — which is also exactly the negative-test list for your endpoint:

```
1. my signer, fresh timestamp                    ACCEPTED -> payment_intent.succeeded
2. SDK's own test header (cross-check)           ACCEPTED -> payment_intent.succeeded
3. body re-serialised (pretty-printed JSON)      REJECTED -> No signatures found matching the expected signature
4. amount tampered 5000 -> 1                     REJECTED -> No signatures found matching the expected signature
5. wrong secret                                  REJECTED -> No signatures found matching the expected signature
6. valid sig but timestamp 301s old (replay)     REJECTED -> Timestamp outside the tolerance zone
7. same, 299s old                                ACCEPTED -> payment_intent.succeeded
8. v0 scheme only (downgrade attempt)            REJECTED -> No signatures found with expected scheme
```

What each row teaches:

- **Row 3 is the most common production bug**, not a security curiosity. A framework that parses JSON and re-serialises it before verification changes the bytes (whitespace, key order), and every real webhook fails signature checks. It is also why the test above passes `data` as a *string*: pass an object and the HTTP client serialises it for you, and you are no longer sending the bytes you signed.
- **Row 4** is the attack verification exists for: someone who can reach your endpoint cannot turn a £50 payment into a £0.01 one.
- **Rows 6–7** pin the replay window at Stripe's documented library default of **5 minutes** — 299 seconds accepted, 301 rejected. Stripe also warns: "Don't use a tolerance value of `0`. Using a tolerance value of `0` disables the recency check entirely."
- **Row 8**: only `v1` counts. Stripe: "To prevent downgrade attacks, ignore all schemes that aren't `v1`."

### 6.3 Duplicates and ordering — the tests nobody writes

```typescript
test("the same event delivered twice fulfils once", async ({ request, fulfilmentsApi }) => {
  const payload = succeededEvent(orderId);           // fixed event id
  for (let i = 0; i < 2; i++) {
    const r = await postSigned(request, payload);    // re-signed each time, like a real retry
    expect(r.status()).toBe(200);                    // a duplicate must still be ACKed
  }
  expect(await fulfilmentsApi.countFor(orderId)).toBe(1);
});

test("out-of-order delivery reaches the right end state", async ({ request, ordersApi }) => {
  await postSigned(request, event("charge.refunded", orderId));       // arrives FIRST
  await postSigned(request, event("payment_intent.succeeded", orderId));
  await expect.poll(() => ordersApi.status(orderId)).toBe("REFUNDED"); // not "PAID"
});
```

Two details in those tests are deliberate. The duplicate must still get a **2xx** — returning 4xx for "already processed" tells the gateway the delivery failed and triggers the very retries you are deduplicating. And the ordering test asserts the state a *correct* consumer reaches, which forces the consumer to reconcile against the gateway (or apply a monotonic state machine) rather than blindly letting the last event win.

---

## 7. Asynchronous confirmation — the success page is not the payment

The redirect to your return URL means the browser finished. It does not mean the charge succeeded — for bank-debit methods confirmation can take days, and even for cards the authoritative signal is the webhook. So the end-to-end test waits on **your** system's record of the payment, not the page:

```typescript
await checkout.completePayment();
await expect(page).toHaveURL(/\/order\/[\w-]+\/confirmation/);

// Authoritative: the order your backend recorded after the webhook arrived.
await expect
  .poll(() => ordersApi.status(orderId), { timeout: 60_000, intervals: [1_000, 2_000, 5_000] })
  .toBe("PAID");
```

(Polling mechanics, including why this beats `waitForTimeout`, are in [Ch42](./42_Polling_Async_Data_Patterns.md).) A useful companion test: make the webhook endpoint fail (return 500) and assert the confirmation page shows "processing", **not** "paid" — the UI must not claim money moved before the backend knows it did.

---

## 8. Money arithmetic — minor units and floating point

Gateways take amounts in the currency's **minor unit**, as an integer. From [Stripe's currency docs](https://docs.stripe.com/currencies): "`1000` to charge 10 USD (or any other two-decimal currency)" and "`10` to charge 10 JPY (or any other zero-decimal currency)." Converting a displayed price to that integer is where real undercharges come from:

```
19.99 * 100              = 1998.9999999999998
Math.trunc(19.99 * 100)  = 1998        <- a 1-penny undercharge
Math.round(19.99 * 100)  = 1999
4.35 * 100               = 434.99999999999994
```

Measured across every price from 0.00 to 999.99:

```
prices where Math.trunc(price * 100) is WRONG : 4,586 of 100,000
prices where Math.round(price * 100) is WRONG :     0 of 100,000
```

`0.1 + 0.2 === 0.30000000000000004` is the famous symptom; the cause is that most decimal fractions have no exact binary representation, so `19.99` is stored as slightly *less* than 19.99 and truncation drops the penny. `parseInt(String(x))` truncates the same way. Test cases that catch it:

```typescript
export function toMinorUnits(amount: number, decimals: 0 | 2): number {
  return Math.round(amount * 10 ** decimals); // round — never trunc, floor or parseInt
}

for (const [price, pence] of [[19.99, 1999], [4.35, 435], [0.29, 29], [1000.1, 100010]] as const) {
  test(`£${price} charges ${pence}p`, async ({ checkoutApi }) => {
    const intent = await checkoutApi.createPaymentIntentForPrice(price, "gbp");
    expect(intent.amount).toBe(pence);
  });
}
```

Currency rules that break "just multiply by 100" (all from Stripe's docs):

- **Zero-decimal currencies** (e.g. JPY, KRW): "to charge 500 JPY, provide an `amount` value of `500`." Multiplying by 100 overcharges 100×.
- **ISK and UGX** "transitioned to a zero-decimal currency, but backward compatibility requires you to represent it as a two-decimal value, where the decimal amount is always `00`" — 5 ISK is `500`, and fractions of ISK can't be charged.
- **Minimum charge amounts** differ per currency (e.g. 0.50 USD, 0.30 GBP, 50 JPY). One boundary test each — exactly at, and just below, the minimum — for the currencies you sell in.

The robust design is never to hold money as a float at all: keep integer minor units end to end and format only for display. The tests above are how you prove a codebase actually does that.

---

## 9. Refunds, disputes and the order state machine

Model the order as a state machine and test the **transitions**, including the illegal ones:

| From | Event | To | Test |
| --- | --- | --- | --- |
| `PENDING` | payment succeeded | `PAID` | happy path |
| `PENDING` | payment failed | `FAILED` | decline cases (§2) |
| `PAID` | full refund | `REFUNDED` | amount returned = amount charged |
| `PAID` | partial refund | `PARTIALLY_REFUNDED` | sum of refunds ≤ charge; a second partial can't exceed the remainder |
| `PAID` | dispute opened | `DISPUTED` | fulfilment/access paused per business rule |
| `REFUNDED` | refund again | *(rejected)* | cannot refund more than was charged |
| `FAILED` | fulfil | *(rejected)* | never ship a failed order |

The illegal-transition rows are where the bugs live: "refund an already-refunded order" and "partial refunds summing to more than the charge" are both classic money-losing defects that a happy-path suite never exercises.

---

## 10. Guard-rails

- **Test mode only, always.** Never put a real card number in a test, a fixture, or a trace. Test keys and live keys are different key pairs; a test run that can reach a live key is a configuration bug to fix before anything else ([Ch51](../07_Specialised_Testing/51_Secrets_Management_For_SDETs.md)).
- **Don't mock the gateway in the tests that exist to prove the integration.** `page.route()`-faking the PSP's responses is fine for UI states ("show the insufficient-funds banner"), but a suite that mocks the gateway everywhere cannot find a bug in how you *call* the gateway. Keep at least one real test-mode path per payment method.
- **Rate limits apply in test mode too.** A parallel suite hammering the gateway will hit them — see the 429 handling in [Ch23](../04_Enterprise_Architecture/23_APIUtils_HTTP_Library.md), and push most coverage down to the API and webhook layers from §1.

---

## 🏋️ Practice Challenges

### Challenge 1 [Spot the Bug]

```typescript
await page.locator('input[name="cardnumber"]').fill("4242424242424242");
```

The test times out with "element not found", but the card field is visible in the screenshot. Why, and what's the fix?

<details><summary>Answer</summary>

The field lives inside the PSP's **cross-origin iframe** — a separate document. A page-rooted locator searches only the page's document, so it matches 0 elements (measured: `count() = 0`) and waits until timeout. Root the locator in the frame: `page.frameLocator('iframe[title="…"]').getByLabel("Card number").fill(...)`. `page.evaluate()` can't help either — a cross-origin iframe's `contentDocument` is `null`.

</details>

### Challenge 2 [Assertion Design]

A teammate writes: "Double-click Pay, then assert the network log contains exactly one `POST /pay`." Against a correctly idempotent checkout, does this pass?

<details><summary>Answer</summary>

**No — it fails on the correct implementation.** With an idempotency key both requests are still sent (measured: 2 POSTs, same key); the server dedupes the *effect*. The request-count assertion only passes for a disabled-button implementation, which doesn't protect against retries, refreshes or second tabs. Assert on charges/orders created: exactly one.

</details>

### Challenge 3 [Webhook]

Your webhook endpoint passes every unit test but rejects 100% of real Stripe deliveries with a signature error. The app has `app.use(express.json())` registered globally. What's happening, and what regression test catches it?

<details><summary>Answer</summary>

The body is parsed and re-serialised before verification, so the bytes differ from what Stripe signed (matrix row 3: re-serialised JSON is **REJECTED**). Verification must run on the **raw** body — e.g. mount `express.raw({ type: "application/json" })` on the webhook route only. Regression test: sign a payload, send it as a *string* to the real endpoint over HTTP, expect 200. The unit tests missed it because they called the handler with an already-parsed object.

</details>

### Challenge 4 [Money]

`chargeAmount = parseInt(String(price * 100))`. Which prices does this get wrong, and what's the one-token fix?

<details><summary>Answer</summary>

Any price whose ×100 product lands just below an integer — `19.99 → 1998.9999999999998 → 1998`. Measured: 4,586 of the 100,000 prices from 0.00 to 999.99. Replace the truncation with `Math.round(price * 100)` (0 wrong in the same range) — and for zero-decimal currencies like JPY, don't multiply at all.

</details>

### Challenge 5 [Design]

List the webhook tests that would catch a consumer that (a) fulfils twice, (b) marks a refunded order as paid, (c) accepts forged events.

<details><summary>Answer</summary>

(a) Deliver the same event id twice → one fulfilment, both deliveries ACKed with 2xx. (b) Deliver `charge.refunded` before `payment_intent.succeeded` → end state `REFUNDED`. (c) Tampered amount, wrong secret, stale timestamp (>300 s) and a v0-only header → all rejected (§6.2 matrix rows 4, 5, 6 and 8).

</details>

---

**Navigation**: [← Chapter 66: Senior SDET Decision-Making](../06_SDET_to_SDE_Bridge/66_Senior_SDET_Decision_Making.md) | [Index](../00_INDEX.md)

---

## Reality Check

**"If the success page shows, the payment worked"** → The success page proves the browser finished the client-side flow. Whether money moved is decided by the gateway and reported to your server asynchronously. Assert on your backend's record after the webhook, and test that the UI says "processing" — not "paid" — while the webhook hasn't arrived.

**"Idempotency keys stop duplicate requests"** → They stop duplicate *effects*. Both requests still arrive; the second returns the first's stored result. Tests must count charges, not requests.

**"We mock the payment gateway, so payments are covered"** → Mocks prove your UI reacts to responses you invented. They cannot find a bug in how you call the real gateway — a wrong amount unit, a missing idempotency key, an unforwarded 3DS action. Keep one real test-mode path per payment method.

**"Webhook signature checks are a security feature, not a testing concern"** → The most common webhook failure in production is a *functional* one: body re-serialisation making every legitimate event fail verification. The same negative-test matrix covers both the security case and the reliability case.
