// REFERENCE SOLUTION — Lab 03. Open only after catching every bug.
import { test, expect, type Page, type APIRequestContext } from '@playwright/test';

type Order = { id: string; status: string; charges: { amountPence: number; status: string }[] };

/** The server is the source of truth for money -- never the page. */
async function getOrder(request: APIRequestContext, id: string): Promise<Order> {
  const res = await request.get(`/api/orders/${id}`);
  expect(res.ok()).toBe(true);
  return res.json();
}
const succeeded = (o: Order) => o.charges.filter((c) => c.status === 'succeeded');

async function openCheckout(page: Page) {
  await page.goto('/');                                  // redirects to /checkout/ORD-n
  await expect(page).toHaveURL(/\/checkout\/ORD-\d+$/);
  return new URL(page.url()).pathname.split('/').pop()!; // the order ID, straight from the URL
}

async function enterCard(page: Page, number: string) {
  // The card fields are in a CROSS-ORIGIN iframe: page.locator() can't see inside it.
  const card = page.frameLocator('iframe[title="Secure card payment input frame"]');
  await card.getByLabel('Card number').fill(number);
  await card.getByLabel('Expiry (MM/YY)').fill('12/34');
  await card.getByLabel('CVC').fill('123');
}

const pay = (page: Page) => page.getByRole('button', { name: 'Pay £19.99' });

test('R1: a good card pays exactly 1999 pence, once', async ({ page, request }) => {
  const orderId = await openCheckout(page);
  await enterCard(page, '4242424242424242');
  await pay(page).click();
  await expect(page.getByRole('status')).toHaveText('Payment successful');
  const order = await getOrder(request, orderId);
  expect(order.status).toBe('PAID');
  expect(succeeded(order)).toEqual([{ amountPence: 1999, status: 'succeeded' }]);
});

test('R2: double-clicking Pay charges exactly once', async ({ page, request }) => {
  const orderId = await openCheckout(page);
  await enterCard(page, '4242424242424242');

  // Capture every payment request the page makes, so we can wait for ALL of them to be
  // answered before counting charges. Waiting on "the work we caused" beats any timer:
  // a second, duplicate request can't still be in flight when we look.
  const payResponses: Promise<unknown>[] = [];
  page.on('request', (r) => { if (new URL(r.url()).pathname === '/api/pay') payResponses.push(r.response()); });

  await pay(page).dblclick();
  await expect(page.getByRole('status')).toHaveText('Payment successful');
  await Promise.all(payResponses);

  expect(succeeded(await getOrder(request, orderId))).toEqual([{ amountPence: 1999, status: 'succeeded' }]);
});

test('R3: a declined card shows the error, leaves the order unpaid, and the customer can retry', async ({ page, request }) => {
  const orderId = await openCheckout(page);
  await enterCard(page, '4000000000000002');
  await pay(page).click();
  await expect(page.getByRole('alert')).toHaveText('Your card was declined.');
  await expect(pay(page)).toBeEnabled();

  const afterDecline = await getOrder(request, orderId);
  expect(afterDecline.status).toBe('UNPAID');
  expect(succeeded(afterDecline)).toHaveLength(0);

  // Recovery is part of the requirement: prove it by recovering.
  await enterCard(page, '4242424242424242');
  await pay(page).click();
  await expect(page.getByRole('status')).toHaveText('Payment successful');
  expect(succeeded(await getOrder(request, orderId))).toHaveLength(1);
});
