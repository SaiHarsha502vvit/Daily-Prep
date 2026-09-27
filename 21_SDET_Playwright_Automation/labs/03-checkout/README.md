# Lab 03 — Checkout: Card Iframes, Double Clicks, Declines & Pennies

**You'll practise:** reaching into cross-origin iframes · asserting on the **server's** state, not just the page · the double-click an impatient customer makes · money in minor units
**Read first:** [Ch67 — Payment Gateway Testing](../../03_Real_World_Scenarios/67_Payment_Gateway_Testing.md) §2, §3, §5, §8
**Time:** 60–120 minutes

---

## The mission

The council's parking-fine checkout goes live next week. Finance has been burned before: last year a different system double-charged 300 people and undercharged everybody else by a penny. They want tests that would have caught both.

The page is simple — one fine, **£19.99**. The card fields are provided by the payment company and live in an **iframe from a different origin**, exactly like real hosted card fields. The payment API is slow (≈0.4 s).

## What you can use

- The checkout page: `/` creates a fresh order and redirects to `/checkout/ORD-n`. The order ID is shown on the page.
- **`GET /api/orders/{orderId}`** — a back-office endpoint returning the order and every charge attempt:
  `{ "id": "ORD-1", "status": "UNPAID" | "PAID", "charges": [{ "amountPence": 1999, "status": "succeeded" | "failed" }] }`
  Call it with Playwright's `request` fixture (it shares the page's `baseURL`).
- Test cards: **4242 4242 4242 4242** always succeeds; **4000 0000 0000 0002** is always declined. Any future expiry (`12/34`) and any CVC (`123`).

## The requirements

| ID | Requirement |
| --- | --- |
| **R1** | Paying with the good card shows **"Payment successful"**, and the order ends up **PAID** with exactly one succeeded charge of **1999** pence. |
| **R2** | Double-clicking **Pay** still results in exactly **one** succeeded charge. |
| **R3** | The declined card shows **"Your card was declined."**, the order stays **UNPAID** with no succeeded charge, and the customer can then pay successfully with another card. |

---

## How to work this lab

### 1. Explore

`npm run app -- 03`, open http://localhost:4400. Pay with both cards. Keep DevTools open on **Network** and look at the request body of `/api/pay`. Then open `http://localhost:4400/api/orders/ORD-1` in another tab — that's the view Finance cares about.

Right-click inside the card fields and choose **Inspect**: notice they're a separate document from a different origin (`127.0.0.1` vs `localhost`).

### 2. Plan

The two design questions that decide whether your tests catch anything:

- **Where does the truth about money live?** The page can say "Payment successful" while the server did something very different. Which of your assertions should be on the page, and which on `/api/orders`?
- **How will you know a double-click is *finished*?** If you check the order too early, a second charge might still be on its way. What could you wait for that proves every payment request has been answered — without a `waitForTimeout`?

### 3. Predict

1. `page.getByLabel('Card number').fill(...)` — will it work? Why or why not?
2. `19.99 * 100` in JavaScript — what exactly is it? (Try it in your browser console after predicting.)
3. After a decline, what would a customer need to be able to do, and how would you prove they can?

### 4. Code, run, grade

```bash
npx playwright test 03-checkout --headed     # app running in another terminal
npm run grade -- 03
```

---

## Hints — one at a time

<details><summary>Hint 1 — reaching the card fields</summary>

The fields are in another document. Root your locators in the iframe: `page.frameLocator('iframe[title="Secure card payment input frame"]').getByLabel('Card number')`. (Ch67 §3 explains why `page.locator()` finds nothing and `page.evaluate()` can't help either.)

</details>

<details><summary>Hint 2 — reading the order</summary>

```ts
test('...', async ({ page, request }) => {
  const res = await request.get(`/api/orders/${orderId}`);
  const order = await res.json();
```

Filter `order.charges` by `status === 'succeeded'` — failed attempts are recorded too.

</details>

<details><summary>Hint 3 — "only one charge" passes, but I still missed the double-charge bug</summary>

Two things to check. (1) Did you actually double-click? `locator.dblclick()`. (2) When you read the order, had the *second* payment request finished? Record the payment requests the page makes with `page.on('request', ...)`, and wait for their responses (`request.response()`) before counting.

</details>

<details><summary>Hint 4 — Finance says the amount is wrong but my test passes</summary>

"Payment successful" isn't an amount. Assert `amountPence` exactly.

</details>

## Debrief

- Which bug did the page hide completely — where the UI looked perfect and only the server revealed it? What does that say about E2E tests that only assert on what's on screen?
- Your R2 test waits for "every payment request to be answered". Why is that more trustworthy than polling the order until the count is 1?
- The page disables the button *and* sends an idempotency key. Which of the two protects against a customer who refreshes and pays again? (Ch67 §5)
