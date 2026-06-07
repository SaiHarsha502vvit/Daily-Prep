# Challenge 07 — Full Cross-Site Enterprise Flow

> The capstone of Part 3. Touch an admin site, a customer site, a new tab, an API service, and a cleanup step — in a single test, with all seven laws followed.

## Scenario

You are testing this flow:

1. **Admin portal** — admin user creates a customer account (via UI).
2. **Customer portal** — that customer logs in (different tab, fresh context).
3. **Customer places an order** (UI action).
4. **New tab** opens with order confirmation page.
5. **Notification service API** — assert that an `ORDER_CONFIRMED` notification exists for the customer.
6. **Cleanup** — delete the customer account via Admin API.

You don't have an admin portal yet, so simulate it with any combination of:
- OrangeHRM (as admin UI) + reqres.in (as customer/order API), OR
- Two `the-internet.herokuapp.com` sub-pages, OR
- A local Node mock you spin up via `webServer` in `playwright.config.ts`.

The *patterns* matter, not the apps.

## Required structure

```
challenges/solutions/CH07/
├── websites/admin/pages/AdminCustomerCreatePage.ts
├── websites/portal/pages/CustomerPortalPage.ts
├── websites/portal/pages/OrderConfirmationPage.ts
├── applications/notifications-service/api/NotificationsClient.ts
├── applications/admin-service/api/AdminClient.ts
├── fixtures/multi-site.fixture.ts
└── tests/cross-site/order-notification.spec.ts
```

## The seven laws — check each one

| Law | Where you must prove it |
|---|---|
| 1. Tests describe behaviour only | Spec has zero locators, zero URLs, zero hardcoded data |
| 2. Nothing hardcoded | Timeouts from `Timeouts`, URLs from `endpoints`, data from JSON |
| 3. Layered imports | Spec → POMs/Clients → utilities → constants. No upward imports |
| 4. Actions wrapped with logging | `clickElement`/`fillInput` only — no raw `.click()` |
| 5. Parallel safety | `acquireAccount` + `try/finally releaseAccount` |
| 6. UI + API cross-validation | UI confirms success; API confirms notification |
| 7. TS strict | Zero `any`. Every method typed. Every JSON load typed. |

## Acceptance criteria

- Test runs from a clean shell: `npm run test -- order-notification`.
- One test, but uses **at least 6** `test.step()` blocks with searchable names.
- `TestDataBridge` carries the customer id and order id between steps.
- Trace shows both contexts (admin + customer) and both pages (portal + confirmation).
- Cleanup runs in `test.afterEach` or `try/finally` — including if the test fails midway.
- `npm run typecheck` is clean.
- Re-running 10× → zero flakes.

## What this teaches

You've now built a representative production test. The complexity is real:

- Two contexts to manage.
- One API to verify.
- Cleanup that must survive failure.
- Data shared across systems without globals.

This is what most senior SDETs do every day.

## Stretch goal

Add a second variant of the test that uses **storage state chaining** (Pattern 6 from Ch 16) so the admin login happens once in `globalSetup` instead of per test.
