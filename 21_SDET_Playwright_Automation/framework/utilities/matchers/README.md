# Custom Matchers

Custom Playwright expect matchers for accessibility, performance, and schema validation.

## Registration

Import and call `registerCustomMatchers()` once before tests run. Best practice is to add it to a global setup file:

```typescript
// global-setup.ts
import { registerCustomMatchers } from './utilities/matchers';

registerCustomMatchers();
```

Then reference it in `playwright.config.ts`:

```typescript
export default defineConfig({
  globalSetup: './global-setup.ts',
  // ...
});
```

Alternatively, register in a test file's `beforeAll`:

```typescript
// testsetup.ts
import { registerCustomMatchers } from './utilities/matchers';

beforeAll(() => {
  registerCustomMatchers();
});
```

## Available Matchers

### `toBeReadableTo(options?)`

Asserts that an element has sufficient readability for WCAG AA compliance:

- **Contrast ratio**: ≥ 4.5:1 between foreground and background colors
- **Font size**: ≥ 12px

Uses `page.evaluate` to read computed styles directly from the DOM.

```typescript
import { toBeReadableTo } from './utilities/matchers';

test('login button is readable', async ({ page }) => {
  await page.goto('/login');
  await expect(page.locator('button[type="submit"]')).toBeReadableTo({ timeout: 5000 });
});
```

**Options:**

```typescript
{
  timeout?: number  // Max wait for element visibility (default: 5000ms)
}
```

**Return values:**

- `pass: true` — element passes both contrast and font size checks
- `pass: false` — one or more checks failed; message lists failures

---

### `toRespondWithin(expectedMs)`

Asserts that an API response is successful (2xx) and completes within a time limit.

```typescript
import { toRespondWithin } from './utilities/matchers';

test('API responds within 500ms', async ({ request }) => {
  const response = request.get('/api/health');
  await expect(response).toRespondWithin(500);
});
```

**Parameters:**

- `expectedMs` — Maximum acceptable response time in milliseconds

**Supports both promise and direct Response:**

```typescript
// Promise form
const responsePromise = page.request.get('/api/users');
await expect(responsePromise).toRespondWithin(1000);

// Direct Response (already awaited)
const response = await page.request.get('/api/users');
await expect(response).toRespondWithin(1000);
```

---

### `toMatchSchemaZod(schema)`

Validates data against a Zod schema (or any validator with a `safeParse` interface).

> **Note:** Zod is not bundled by default. Install with `npm install zod`. The matcher is designed to work with any `{ safeParse(data) => { success, error } }` object.

```typescript
import { z } from 'zod';
import { toMatchSchemaZod } from './utilities/matchers';

const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
});

test('user API returns valid schema', async ({ page }) => {
  const response = await page.request.get('/api/user/1');
  const data = await response.json();
  expect(data).toMatchSchemaZod(UserSchema);
});
```

**Error output includes:**

- Top-level error message
- Up to 5 individual validation issues with path
- Count of additional issues if > 5

---

## TypeScript Support

Matchers are declared in the global `PlaywrightTest.Matchers` namespace. After registering, TypeScript will recognize all three matchers on `expect` calls with full IntelliSense.

## Architecture

```
matchers/
├── index.ts              # Barrel export + registerCustomMatchers()
├── to-be-readable-to.ts  # WCAG AA contrast + font size checks
├── to-respond-within.ts  # Response time + status validation
└── to-match-schema-zod.ts # Schema validation via safeParse
```

Each matcher returns `{ pass: boolean, message: () => string }` — the standard Playwright custom matcher interface.