import { test, expect } from '@playwright/test';

const SECRET = 'whsec_lab04_test_secret';

/*
 * TEST PLAN — before any code.
 * R1: TODO(you)
 * R2: TODO(you)
 * R3: TODO(you)
 * R4: TODO(you)
 * R5: TODO(you)
 *
 * Why does sign() take a timestamp parameter? TODO(you)
 * Predictions (README step 3): TODO(you)
 */

/** Build the Payment-Signature header value for `payload` (see the provider docs in README). */
function sign(payload: string, secret: string, timestamp: number): string {
  // TODO(you): HMAC-SHA256 of `${timestamp}.${payload}`, hex; return "t=...,v1=..."
  void payload; void secret; void timestamp;
  return '';
}

test('R1: TODO(you)', async ({ request }) => {
  void sign; void SECRET; void request;
  // TODO(you)
});

void expect;
