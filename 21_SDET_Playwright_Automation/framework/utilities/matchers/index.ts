import { expect } from '@playwright/test';

import { toBeReadableTo } from './to-be-readable-to';
import { toMatchSchemaZod } from './to-match-schema-zod';
import { toRespondWithin } from './to-respond-within';

export { toBeReadableTo, toRespondWithin, toMatchSchemaZod };

/**
 * Registers all custom matchers with Playwright's expect.
 * Call this once in a global setup file or test fixture before running tests.
 *
 * @example
 * // In your global-setup file (e.g., global-setup.ts):
 * import { registerCustomMatchers } from './utilities/matchers';
 * registerCustomMatchers();
 */
export function registerCustomMatchers(): void {
  expect.extend({ toBeReadableTo, toRespondWithin, toMatchSchemaZod });
}