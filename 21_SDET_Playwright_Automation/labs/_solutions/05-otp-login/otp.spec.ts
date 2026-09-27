// REFERENCE SOLUTION — Lab 05. Open only after catching every bug.
import { test, expect, type Page, type APIRequestContext } from '@playwright/test';
import { randomUUID } from 'node:crypto';

const newEmail = () => `user-${randomUUID()}@example.com`;   // one user per test: no shared state

async function latestCode(request: APIRequestContext, email: string): Promise<string> {
  const res = await request.get(`/test-support/otp?email=${encodeURIComponent(email)}`);
  expect(res.ok(), 'no code was sent').toBe(true);
  return (await res.json()).code;
}
/** Move the SERVER's clock. page.clock would only move the browser's. */
async function advanceServerClock(request: APIRequestContext, seconds: number) {
  expect((await request.post('/test-support/clock', { data: { advanceSeconds: seconds } })).ok()).toBe(true);
}
const sendCode = (request: APIRequestContext, email: string) => request.post('/api/otp/send', { data: { email } });
const verify = (request: APIRequestContext, email: string, code: string) => request.post('/api/otp/verify', { data: { email, code } });

async function startLogin(page: Page, email: string) {
  await page.goto('/');
  await page.getByLabel('Email').fill(email);
  await page.getByRole('button', { name: 'Send code' }).click();
  await expect(page.getByLabel('6-digit code')).toBeVisible();
}
async function enterCode(page: Page, code: string) {
  await page.getByLabel('6-digit code').fill(code);
  await page.getByRole('button', { name: 'Verify' }).click();
}

test('R1: the emailed code logs the user in', async ({ page, request }) => {
  const email = newEmail();
  await startLogin(page, email);
  await enterCode(page, await latestCode(request, email));
  await expect(page.getByRole('heading')).toHaveText(`Welcome, ${email}`);
});

test('R2: a code works only once', async ({ page, request }) => {
  const email = newEmail();
  await startLogin(page, email);
  const code = await latestCode(request, email);
  await enterCode(page, code);
  await expect(page.getByRole('heading')).toHaveText(`Welcome, ${email}`);
  const again = await verify(request, email, code);       // the same code, a second time
  expect(again.status()).toBe(401);
  expect((await again.json()).error).toBe('Invalid or expired code');
});

test('R3: a new code retires the previous one', async ({ page, request }) => {
  const email = newEmail();
  await startLogin(page, email);
  const oldCode = await latestCode(request, email);
  await advanceServerClock(request, 31);                   // past the 30 s resend cooldown, on the SERVER
  expect((await sendCode(request, email)).status()).toBe(200);
  const newCode = await latestCode(request, email);
  expect(newCode).not.toBe(oldCode);                       // (1 in a million collision -- acceptable)
  await enterCode(page, oldCode);
  await expect(page.getByRole('alert')).toHaveText('Invalid or expired code');
  await enterCode(page, newCode);
  await expect(page.getByRole('heading')).toHaveText(`Welcome, ${email}`);
});

test('R4: five wrong codes lock the account, even against the right code', async ({ request }) => {
  const email = newEmail();
  expect((await sendCode(request, email)).status()).toBe(200);
  const code = await latestCode(request, email);
  const wrong = code === '000000' ? '111111' : '000000';
  for (let i = 1; i <= 5; i++) await verify(request, email, wrong);
  const res = await verify(request, email, code);
  expect(res.status()).toBe(423);
  expect((await res.json()).error).toBe('Too many attempts. Your account is locked.');
});

test('R5: the server refuses a new code within 30 s, whatever the UI shows', async ({ page, request }) => {
  const email = newEmail();
  await startLogin(page, email);
  await expect(page.getByRole('button', { name: 'Resend code' })).toBeDisabled();   // the UI half...
  const res = await sendCode(request, email);                                          // ...and the rule itself
  expect(res.status()).toBe(429);
});

test('R6: a code expires after 60 seconds', async ({ page, request }) => {
  const email = newEmail();
  await startLogin(page, email);
  const code = await latestCode(request, email);
  await advanceServerClock(request, 61);
  await enterCode(page, code);
  await expect(page.getByRole('alert')).toHaveText('Invalid or expired code');
});
