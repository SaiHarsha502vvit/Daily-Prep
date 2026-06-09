import { test, expect } from '@playwright/test';
import { endpoints } from '../../constants/endpoints';

const COMMON_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

/**
 * BROKEN TEST — Anti-Pattern: expect.poll() that swallows terminal failures
 * Curriculum Reference: Ch04 — Polling, Ch05 — API Resilience
 * Why it fails: Inside `expect.poll`, a caught exception should be re-thrown
 * when the failure is permanent (e.g., HTTP 404). If we instead swallow it
 * and return a default value, `expect.poll` treats the iteration as "poll
 * not yet satisfied" and spins until the global timeout. The error message
 * becomes a generic timeout instead of the root cause, and the test takes
 * much longer to fail than necessary.
 */
test('broken: poll swallows errors and returns default', async ({ request }) => {
  // Poll for a user that does NOT exist (ID 99999).
  // A well-behaved poll should fail fast with a meaningful 404 message.
  await expect
    .poll(
      async () => {
        try {
          const response = await request.get(
            `${endpoints.reqres.USERS}/99999`,
            { headers: COMMON_HEADERS }
          );
          if (response.status() === 404) {
            // BUG: We return a string instead of throwing. expect.poll now
            // keeps retrying until its own timeout, producing a useless
            // "Timeout 5000ms exceeded" message instead of "User not found".
            return 'not-found-yet';
          }
          const body = (await response.json()) as { data?: { first_name: string } };
          return body.data?.first_name ?? 'no-name';
        } catch {
          // BUG: All exceptions are swallowed, including network failures.
          return 'error';
        }
      },
      { intervals: [500], timeout: 5000 }
    )
    .toBe('Janet');
});

/**
 * FIXED VERSION
 * Fix: Throw immediately on terminal (non-transient) failures such as
 * 404 or 5xx. Only return values when the poll condition is simply not
 * met yet. This gives the developer the real error message in milliseconds.
 */
test('fixed: poll throws on permanent failures', async ({ request }) => {
  await expect
    .poll(
      async () => {
        const response = await request.get(
          `${endpoints.reqres.USERS}/99999`,
          { headers: COMMON_HEADERS }
        );

        // FIXED: Terminal errors are thrown immediately so expect.poll
        // surfaces the root cause instead of timing out cryptically.
        if (response.status() === 404) {
          throw new Error('User 99999 does not exist (404) — permanent failure, aborting poll');
        }
        if (response.status() >= 500) {
          throw new Error(`Server error ${response.status()} — aborting poll`);
        }

        const body = (await response.json()) as { data?: { first_name: string } };
        return body.data?.first_name ?? 'no-name';
      },
      {
        intervals: [500],
        timeout: 5000,
        message: 'Polling for first_name to become "Janet"',
      }
    )
    .toBe('Janet');
});
