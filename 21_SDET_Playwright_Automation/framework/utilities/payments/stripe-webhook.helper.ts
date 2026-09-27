import { createHmac } from 'node:crypto';

/**
 * Builds a `Stripe-Signature` header for a test webhook payload.
 *
 * Scheme (per https://docs.stripe.com/webhooks): `t=<unix seconds>,v1=<hex>` where
 * v1 = HMAC-SHA256(secret, `${t}.${rawBody}`). Verified against the official
 * `stripe` SDK's `webhooks.constructEvent` (v22.6.2). See Ch67 §6.2.
 *
 * `payload` must be the exact string you send — sign and send the same bytes.
 */
export function signStripeTestPayload(
  payload: string,
  secret: string,
  timestamp: number = Math.floor(Date.now() / 1000),
): string {
  const v1 = createHmac('sha256', secret).update(`${timestamp}.${payload}`).digest('hex');
  return `t=${timestamp},v1=${v1}`;
}

/** Converts a decimal amount to integer minor units. Round — never truncate (Ch67 §8). */
export function toMinorUnits(amount: number, decimals: 0 | 2): number {
  return Math.round(amount * 10 ** decimals);
}
