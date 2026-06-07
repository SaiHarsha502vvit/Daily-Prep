# 52. Component Testing with `@playwright/experimental-ct-*` — The Bridge to Dev

**Navigation**: [← 51. Secrets Management](../07_Specialised_Testing/51_Secrets_Management_For_SDETs.md) | [Index](../00_INDEX.md) | [→ 53. Mutation Testing](../07_Specialised_Testing/53_Mutation_Testing_With_Stryker.md)

---

## 5W1H

- **WHAT**: Render a single React/Vue/Svelte component in a real browser and assert against it — no full app, no API, no router.
- **WHY**: E2E tests are slow and over-scoped for "does this button emit the right event." Component tests catch UI bugs at unit-test speed.
- **WHO**: SDETs working closely with frontend devs, or SDETs preparing to shift into FE work.
- **WHEN**: When you have isolated UI components with non-trivial behaviour (forms, dialogs, complex inputs) that are expensive to exercise through full E2E.
- **HOW**: `@playwright/experimental-ct-react` (or `-vue`, `-svelte`) runs Vite, mounts the component, and gives you a normal Playwright `Page` against it.

---

## 1. Where it fits on the pyramid

```
                  ▲
              E2E │ Slow, expensive, owns user journeys
                  ├──────────────
        Integration │ API + DB, fast-ish
                  ├──────────────
   Component (CT) ─┤ ← This chapter. Real browser, one component.
                  ├──────────────
              Unit │ No browser, pure functions, milliseconds
                  ▼
```

CT closes the painful gap between "Jest with jsdom (lies about layout)" and "full Playwright E2E (slow, brittle on UI-only bugs)."

---

## 2. Setup

```bash
npm i -D @playwright/experimental-ct-react @playwright/test
npx playwright install
```

```typescript
// playwright-ct.config.ts
import { defineConfig, devices } from '@playwright/experimental-ct-react';

export default defineConfig({
  testDir: './tests-ct',
  use: {
    ...devices['Desktop Chrome'],
    ctPort: 3100,
  },
});
```

```typescript
// playwright/index.tsx — entry-point Playwright loads with your app's CSS, providers
import { beforeMount } from '@playwright/experimental-ct-react/hooks';
import './app.css';
import { ThemeProvider } from '../src/theme';

beforeMount(async ({ App }) => (
  <ThemeProvider mode="light">
    <App />
  </ThemeProvider>
));
```

---

## 3. The test shape

```typescript
import { test, expect } from '@playwright/experimental-ct-react';
import { LoginForm } from '../src/components/LoginForm';

test('@ct empty submit shows two required errors', async ({ mount }) => {
  const component = await mount(<LoginForm onSubmit={() => {}} />);
  await component.getByRole('button', { name: 'Sign in' }).click();
  await expect(component.getByText('Username required')).toBeVisible();
  await expect(component.getByText('Password required')).toBeVisible();
});

test('@ct valid submit fires onSubmit with payload', async ({ mount }) => {
  let payload: { username: string; password: string } | null = null;
  const component = await mount(
    <LoginForm onSubmit={(p) => { payload = p; }} />
  );
  await component.getByLabel('Username').fill('Admin');
  await component.getByLabel('Password').fill('admin123');
  await component.getByRole('button', { name: 'Sign in' }).click();
  expect(payload).toEqual({ username: 'Admin', password: 'admin123' });
});
```

Note: a `Locator` is returned from `mount`. Treat it exactly like the rest of Playwright.

---

## 4. What CT can and can't do

**Good fit:**
- Form validation
- Custom inputs (date pickers, color pickers, drag-drop)
- Stateful components (modals, drawers, accordions)
- Component-level a11y (axe-core against the rendered DOM)
- Visual regression of one component

**Bad fit:**
- Network calls — mock at component boundary, not via HTTP. CT can intercept fetch, but you're betraying the layer.
- Routing — components that need router context get awkward.
- Auth flows — those belong to E2E.

---

## 5. Common mistakes

1. **Mocking the API inside CT.** That's an integration test pretending to be a component test. Pass props/callbacks instead; let E2E own the network.
2. **Replicating provider boilerplate per test.** Use `beforeMount` once.
3. **Asserting against rendered class names.** They change with CSS-in-JS hashing. Use roles, labels, text — the same locators you'd write in E2E.
4. **Putting all components in one project.** Separate `playwright-ct.config.ts` from your E2E `playwright.config.ts` — different runners, different timeouts.

---

## 6. Senior SDET perspective

CT is the closest "SDET-but-actually-FE" you'll come to without changing roles. Embrace it: it'll make you better at reading frontend code, which is the muscle you'll need for SDE-FE roles.

The other career angle: **propose CT for the team's most flaky form**. If the form has 8 inputs and 3 validations and the E2E touching it flakes monthly, lift it into CT. Senior leadership notices test stability improvements that aren't "added retries."

---

## 7. Exercise

1. Pick any simple form component from a React tutorial or your own work.
2. Wire `@playwright/experimental-ct-react` in a sub-folder.
3. Write **three** CT tests covering: empty submit, partial fill, valid submit.
4. Then write the same coverage as full E2E for comparison. Time both. Note the difference.

The exercise lands the trade-off: CT is 5–10× faster per assertion, but E2E catches the layer interactions CT misses.
