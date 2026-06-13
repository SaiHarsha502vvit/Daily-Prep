/**
 * Custom matcher to validate data against a Zod schema.
 *
 * Note: This implementation uses a generic validation approach when Zod is not available.
 * For full Zod support, install zod: npm install zod
 *
 * @param received - Data to validate
 * @param schema - Zod schema (or schema-like validator)
 */
export function toMatchSchemaZod(
  received: unknown,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: { safeParse: (data: unknown) => { success: boolean; error?: { message: string; issues?: unknown[] } } }
): { pass: boolean; message: () => string } {
  const result = schema.safeParse(received);

  if (result.success) {
    return {
      pass: true,
      message: () => 'Data matches expected schema',
    };
  }

  const errorMessage = result.error?.message ?? 'Validation failed';
  const issues = result.error?.issues;

  return {
    pass: false,
    message: () => {
      let msg = `Data does not match schema: ${errorMessage}`;
      if (issues && Array.isArray(issues) && issues.length > 0) {
        const issueDetails = issues
          .slice(0, 5)
          .map((issue) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const i = issue as any;
            const path = i.path ? ` at ${i.path.join('.')}` : '';
            return `  - ${i.message ?? 'Unknown error'}${path}`;
          })
          .join('\n');
        msg += `\n${issueDetails}`;
        if (issues.length > 5) {
          msg += `\n  ... and ${issues.length - 5} more issues`;
        }
      }
      return msg;
    },
  };
}

// Extend Playwright expect
declare global {
  namespace PlaywrightTest {
    interface Matchers<R> {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      toMatchSchemaZod(schema: any): R;
    }
  }
}

/*
 * Usage Example (with Zod):
 * -----------------------
 * import { z } from 'zod';
 * import { toMatchSchemaZod } from './to-match-schema-zod';
 *
 * const UserSchema = z.object({
 *   id: z.number(),
 *   name: z.string(),
 *   email: z.string().email(),
 * });
 *
 * test('validates user response', async ({ page }) => {
 *   const response = await page.request.get('/api/user/1');
 *   const data = await response.json();
 *   expect(data).toMatchSchemaZod(UserSchema);
 * });
 *
 * -----------------------------------------------------------------------
 * Usage Example (without Zod - using built-in validator):
 * ---------------------------------------------------------
 * The matcher works with any object that has a safeParse method returning
 * { success: boolean; error?: { message: string; issues?: unknown[] } }
 *
 * // Example custom validator:
 * const myValidator = {
 *   safeParse: (data: unknown) => {
 *     if (typeof data === 'object' && data !== null && 'id' in data) {
 *       return { success: true };
 *     }
 *     return { success: false, error: { message: 'Missing required field: id', issues: [] } };
 *   }
 * };
 *
 * expect({ name: 'test' }).toMatchSchemaZod(myValidator); // fails
 * expect({ id: 1 }).toMatchSchemaZod(myValidator); // passes
 */