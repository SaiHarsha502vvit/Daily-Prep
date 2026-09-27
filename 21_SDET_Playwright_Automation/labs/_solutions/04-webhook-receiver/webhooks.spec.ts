// REFERENCE SOLUTION — Lab 04. Open only after catching every bug.
import { test, expect, type APIRequestContext } from '@playwright/test';
import { createHmac, randomUUID } from 'node:crypto';

const SECRET = 'whsec_lab04_test_secret';
const now = () => Math.floor(Date.now() / 1000);       // SECONDS, not milliseconds

function sign(payload: string, secret: string, timestamp: number): string {
  const v1 = createHmac('sha256', secret).update(`${timestamp}.${payload}`).digest('hex');
  return `t=${timestamp},v1=${v1}`;
}

const event = (type: 'payment.succeeded' | 'payment.refunded', orderId: string, id = `evt_${randomUUID()}`) =>
  JSON.stringify({ id, type, data: { orderId } });

/** Send `payload` byte-for-byte (a STRING, so nothing re-serialises it) with a given signature. */
function deliver(request: APIRequestContext, payload: string, signature = sign(payload, SECRET, now())) {
  return request.post('/webhooks/payments', {
    data: payload,
    headers: { 'content-type': 'application/json', 'payment-signature': signature },
  });
}

async function newOrder(request: APIRequestContext): Promise<string> {
  return (await (await request.post('/test-support/orders')).json()).id;
}
async function order(request: APIRequestContext, id: string) {
  return (await request.get(`/api/orders/${id}`)).json();
}

test('R1: a signed payment.succeeded marks the order PAID and fulfils it once', async ({ request }) => {
  const id = await newOrder(request);
  const res = await deliver(request, event('payment.succeeded', id));
  expect(res.status()).toBe(200);
  expect(await order(request, id)).toMatchObject({ status: 'PAID', fulfilments: 1 });
});

test.describe('R2: bad signatures are rejected and change nothing', () => {
  test('wrong secret', async ({ request }) => {
    const id = await newOrder(request);
    const payload = event('payment.succeeded', id);
    const res = await deliver(request, payload, sign(payload, 'whsec_attacker_guess', now()));
    expect(res.status()).toBe(400);
    expect(await order(request, id)).toMatchObject({ status: 'PENDING', fulfilments: 0 });
  });

  test('body changed after signing', async ({ request }) => {
    const signedFor = await newOrder(request);
    const target = await newOrder(request);
    const signature = sign(event('payment.succeeded', signedFor), SECRET, now());
    const res = await deliver(request, event('payment.succeeded', target), signature);
    expect(res.status()).toBe(400);
    expect(await order(request, target)).toMatchObject({ status: 'PENDING', fulfilments: 0 });
  });
});

test('R3: a valid signature older than 300 s is rejected', async ({ request }) => {
  const id = await newOrder(request);
  const payload = event('payment.succeeded', id);
  const res = await deliver(request, payload, sign(payload, SECRET, now() - 600));
  expect(res.status()).toBe(400);
  expect(await order(request, id)).toMatchObject({ status: 'PENDING', fulfilments: 0 });
});

test('R4: a duplicate delivery is acknowledged and not processed twice', async ({ request }) => {
  const id = await newOrder(request);
  const payload = event('payment.succeeded', id);          // same event id both times
  expect((await deliver(request, payload)).status()).toBe(200);
  expect((await deliver(request, payload)).status()).toBe(200);   // re-signed, like a real retry
  expect(await order(request, id)).toMatchObject({ status: 'PAID', fulfilments: 1 });
});

test('R5: a refund arriving before its payment leaves the order refunded, unfulfilled', async ({ request }) => {
  const id = await newOrder(request);
  expect((await deliver(request, event('payment.refunded', id))).status()).toBe(200);
  expect((await deliver(request, event('payment.succeeded', id))).status()).toBe(200);
  expect(await order(request, id)).toMatchObject({ status: 'REFUNDED', fulfilments: 0 });
});
