# Lab 04 — Webhook Receiver: Signatures, Replays, Duplicates & Disorder

**You'll practise:** API testing with Playwright's `request` fixture · implementing a signing scheme from a written spec · negative security tests · designing tests for things providers *guarantee won't* be orderly
**Read first:** [Ch67 — Payment Gateway Testing](../../03_Real_World_Scenarios/67_Payment_Gateway_Testing.md) §6
**Time:** 90–150 minutes

---

## The mission

When a customer pays, the payment provider calls **our** server: `POST /webhooks/payments`. That call is what actually marks an order paid and triggers fulfilment (posting the permit, releasing the car). There's no page here — the webhook *is* the product.

The provider's documentation (below) is all you get. Your job: prove our receiver does exactly what it should with every kind of delivery the real world will throw at it — including forged ones.

## The provider's documentation

**Endpoint:** `POST /webhooks/payments`, body is JSON:

```json
{ "id": "evt_123", "type": "payment.succeeded", "data": { "orderId": "ORD-1" } }
```

`type` is `payment.succeeded` or `payment.refunded`. `id` is unique per event.

**Signature:** every delivery carries a header

```
Payment-Signature: t=<unix timestamp in seconds>,v1=<signature>
```

where `signature` = **hex-encoded HMAC-SHA256** of the string `"<t>.<raw request body>"`, keyed with the endpoint secret. The test environment's secret is:

```
whsec_lab04_test_secret
```

**Delivery guarantees:** events can be delivered **more than once**, and **in any order**. Receivers must answer every *valid* delivery — including duplicates — with a **2xx**, or the provider keeps retrying. Receivers must reject signatures more than **300 seconds** old.

## What you can use

- `POST /test-support/orders` → creates a fresh order `{ "id": "ORD-n", "status": "PENDING", "fulfilments": 0 }` (use one per test).
- `GET /api/orders/{id}` → `{ id, status: "PENDING" | "PAID" | "REFUNDED", fulfilments }`.

## The requirements

| ID | Requirement |
| --- | --- |
| **R1** | A correctly signed `payment.succeeded` gets **200**; the order becomes **PAID** with **1** fulfilment. |
| **R2** | A delivery whose signature is wrong — wrong secret, or body changed after signing — gets **400**, and the order is unchanged. |
| **R3** | A delivery signed with a timestamp more than 300 s old gets **400**, even though the signature itself is valid. |
| **R4** | The same event delivered twice: **both** get **200**, and the order still has exactly **1** fulfilment. |
| **R5** | If `payment.refunded` arrives **before** the `payment.succeeded` it refunds, the order ends **REFUNDED** with **0** fulfilments. |

---

## How to work this lab

### 1. Explore

There's no page to click. Start the app (`npm run app -- 04`) and poke it from a terminal:

```bash
curl -s -X POST http://localhost:4400/test-support/orders
curl -s http://localhost:4400/api/orders/ORD-1
curl -s -X POST http://localhost:4400/webhooks/payments -d '{}'      # what does an unsigned call get?
```

### 2. Build your signer first

Before any test, write the function the whole lab rests on:

```ts
function sign(payload: string, secret: string, timestamp: number): string   // -> "t=...,v1=..."
```

Use Node's built-in `node:crypto` (`createHmac`). Then prove it works on its own: a correctly signed `payment.succeeded` should get 200. If it doesn't, your signer is wrong — fix that before anything else.

**Design decision to make now:** why does `timestamp` need to be a *parameter* rather than always "now"? (R3 will tell you.)

### 3. Plan, then predict

1. Playwright's `request.post(url, { data })` — if you pass a JavaScript **object** as `data`, what bytes go over the wire? Will they match the string you signed?
2. For R2, what does "the order is unchanged" require you to check, beyond the status code?
3. For R4, which *two* things must be true of the second delivery?

### 4. Code, run, grade

```bash
npx playwright test 04-webhook-receiver       # app running in another terminal
npm run grade -- 04
```

---

## Hints — one at a time

<details><summary>Hint 1 — the signer</summary>

```ts
import { createHmac } from 'node:crypto';
const v1 = createHmac('sha256', secret).update(`${timestamp}.${payload}`).digest('hex');
```

The header value is `` `t=${timestamp},v1=${v1}` `` — `timestamp` in **seconds**, not milliseconds.

</details>

<details><summary>Hint 2 — my correctly-signed request gets 400</summary>

Send **exactly** the string you signed: `request.post('/webhooks/payments', { data: payloadString, headers: {...} })`. If you pass an object, Playwright serialises it itself — possibly with different bytes. Also check seconds vs milliseconds.

</details>

<details><summary>Hint 3 — testing a replay</summary>

Sign with `Math.floor(Date.now() / 1000) - 600`. The signature is genuinely valid for that timestamp; only its age is wrong.

</details>

<details><summary>Hint 4 — a tampered body</summary>

Sign one payload, then send a *different* one (e.g. a different `orderId`) with that signature. Then check the order you targeted is still PENDING.

</details>

## Debrief

- Two of the five bugs were **security** bugs. Could any happy-path test have found them? What does that tell you about where to spend testing effort on security-sensitive endpoints?
- "Duplicate → 409" sounds safe. Explain, in one sentence to a developer, why it causes an outage.
- Your signer takes a timestamp parameter. Name one more test that design makes possible.
- Compare your signer with [`framework/utilities/payments/stripe-webhook.helper.ts`](../../framework/utilities/payments/stripe-webhook.helper.ts) — Stripe's real scheme is almost identical.
