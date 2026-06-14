import { type Response } from '@playwright/test';

/**
 * Custom matcher to verify an API response is successful and completes within expected time.
 *
 * @param received - Promise resolving to Response, or a Response directly
 * @param expectedMs - Maximum acceptable response time in milliseconds
 */
export async function toRespondWithin(
  received: PromiseLike<Response> | Response,
  expectedMs: number,
): Promise<{ pass: boolean; message: () => string }> {
  const startTime = Date.now();

  let response: Response;
  try {
    // Await if received is a Promise
    response = await Promise.resolve(received);
  } catch (error) {
    return {
      pass: false,
      message: () =>
        `Request failed before response: ${error instanceof Error ? error.message : String(error)}`,
    };
  }

  const elapsedMs = Date.now() - startTime;
  const isOk = response.ok();
  const status = response.status();

  const failures: string[] = [];

  // Check status code
  if (!isOk) {
    failures.push(`Response status ${status} is not OK (expected 2xx)`);
  }

  // Check response time
  if (elapsedMs > expectedMs) {
    failures.push(`Response time ${elapsedMs}ms exceeds limit of ${expectedMs}ms`);
  }

  const pass = failures.length === 0;

  return {
    pass,
    message: () =>
      pass
        ? `Response OK (${status}) in ${elapsedMs}ms (limit: ${expectedMs}ms)`
        : `Response check failed:\n  Status: ${status} ${isOk ? '✓' : '✗'}\n  Time: ${elapsedMs}ms ${elapsedMs <= expectedMs ? '✓' : `✗ (limit: ${expectedMs}ms)`}`,
  };
}

// Extend Playwright expect
declare global {
  namespace PlaywrightTest {
    interface Matchers<R> {
      toRespondWithin(expectedMs: number): Promise<R>;
    }
  }
}
