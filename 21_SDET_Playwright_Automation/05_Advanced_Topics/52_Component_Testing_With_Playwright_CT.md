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

---

## 8. CT Configuration for Vue and Svelte

The `@playwright/experimental-ct-vue` and `@playwright/experimental-ct-svelte` packages follow the same pattern as the React variant, with minor differences in how the entry-point hook is exported and how `beforeMount` is used.

### Vue 3 (`@playwright/experimental-ct-vue`)

```typescript
// playwright-ct.config.ts
import { defineConfig, devices } from '@playwright/experimental-ct-vue';

export default defineConfig({
  testDir: './tests-ct-vue',
  use: {
    ...devices['Desktop Chrome'],
    ctPort: 3200,          // avoid port conflict with any running E2E config
  },
});
```

```typescript
// playwright/index.ts
import { beforeMount } from '@playwright/experimental-ct-vue/hooks';
import { createPinia } from 'pinia';       // state-management store if used
import './style.css';

const pinia = createPinia();

beforeMount(async ({ App }) => {
  // Vue apps need the app instance to register plugins / stores
  const app = window.__app__;
  app.use(pinia);
  return <App />;
});
```

```typescript
// tests-ct-vue/ModalDialog.spec.ts
import { test, expect } from '@playwright/experimental-ct-vue';
import ModalDialog from '../../src/components/ModalDialog.vue';

test('@ct emits close on backdrop click', async ({ mount }) => {
  let closed = false;
  const component = await mount(ModalDialog, {
    props: { open: true },
    on: { 'update:open': () => { closed = true; } },
  });

  await component.locator('.modal-backdrop').click();
  expect(closed).toBe(true);
});
```

> **Note:** Vue's `beforeMount` receives a render function rather than JSX, so the return value is `h(App)`, not a JSX element. The `on` property is used to attach event listeners to the component under test, matching Vue 3's event-emit pattern.

### Svelte (`@playwright/experimental-ct-svelte`)

```typescript
// playwright-ct.config.ts
import { defineConfig, devices } from '@playwright/experimental-ct-svelte';

export default defineConfig({
  testDir: './tests-ct-svelte',
  use: {
    ...devices['Desktop Chrome'],
    ctPort: 3300,
  },
});
```

```typescript
// playwright/index.ts
import { beforeMount } from '@playwright/experimental-ct-svelte/hooks';
import './app.css';

beforeMount(async ({ App }) => {
  // Svelte components are compiled to plain JS — no provider wrapper needed.
  // But if you have a layout/store context you can wrap here:
  return <App />;
});
```

```typescript
// tests-ct-svelte/Drawer.spec.ts
import { test, expect } from '@playwright/experimental-ct-svelte';
import Drawer from '../../src/components/Drawer.svelte';

test('@ct renders open state with navigation links', async ({ mount }) => {
  const component = await mount(Drawer, { props: { open: true } });
  await expect(component.getByRole('link', { name: 'Dashboard' })).toBeVisible();
  await expect(component.getByRole('link', { name: 'Settings' })).toBeVisible();
});

test('@ct hides links when closed', async ({ mount }) => {
  const component = await mount(Drawer, { props: { open: false } });
  await expect(component.getByRole('link')).toHaveCount(0);
});
```

### Port collision guard

When running CT alongside E2E tests in the same pipeline, port conflicts cause intermittent failures. Always set a distinct `ctPort` per framework project, and use `process.env.CT_PORT` to allow CI injection:

```typescript
// playwright-ct.config.ts
use: {
  ...devices['Desktop Chrome'],
  ctPort: parseInt(process.env.CT_PORT ?? '3100'),
},
```

---

## 9. Testing Complex Stateful Components

Stateful components — modals, drawers, accordions, tabs — are where CT earns its reputation. Each state transition is a discrete testable unit, fast and isolated from the rest of the application.

### 9.1 Modal / Dialog Component

A `ConfirmDialog` component that accepts `open`, `title`, `message`, and `onConfirm`/`onCancel` props. Tests cover: render closed, render open, backdrop dismiss, confirm button fires callback, cancel button fires callback.

```typescript
// tests-ct/ConfirmDialog.spec.ts
import { test, expect } from '@playwright/experimental-ct-react';
import { ConfirmDialog } from '../src/components/ConfirmDialog';

test('@ct does not render when open is false', async ({ mount }) => {
  const component = await mount(
    <ConfirmDialog open={false} title="Delete" onConfirm={jest.fn()} />
  );
  await expect(component.locator('[role="dialog"]')).not.toBeAttached();
});

test('@ct renders and is accessible when open', async ({ mount }) => {
  const component = await mount(
    <ConfirmDialog open={true} title="Delete item" message="This cannot be undone." onConfirm={jest.fn()} />
  );
  const dialog = component.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('heading', { name: 'Delete item' })).toBeVisible();
  await expect(dialog.getByText('This cannot be undone.')).toBeVisible();
});

test('@ct backdrop click calls onCancel', async ({ mount }) => {
  const onCancel = jest.fn();
  const component = await mount(
    <ConfirmDialog open={true} title="Discard" onCancel={onCancel} onConfirm={jest.fn()} />
  );
  await component.locator('.backdrop').click({ position: { x: 5, y: 5 } }); // click edge to avoid modal
  expect(onCancel).toHaveBeenCalledTimes(1);
});

test('@ct confirm button calls onConfirm with payload', async ({ mount }) => {
  const onConfirm = jest.fn();
  const component = await mount(
    <ConfirmDialog
      open={true}
      title="Approve"
      itemId="item-42"
      onConfirm={onConfirm}
    />
  );
  await component.getByRole('button', { name: 'Confirm' }).click();
  expect(onConfirm).toHaveBeenCalledWith('item-42');
});

test('@ct pressing Escape triggers onCancel', async ({ mount, page }) => {
  const onCancel = jest.fn();
  await mount(
    <ConfirmDialog open={true} title="Close me" onCancel={onCancel} />
  );
  // Focus must be inside the dialog for Escape to work
  await component.getByRole('dialog').focus();
  await page.keyboard.press('Escape');
  expect(onCancel).toHaveBeenCalledTimes(1);
});
```

### 9.2 Drawer / Sidebar Component

A `AppDrawer` that slides in from the left, conditionally renders navigation links based on `open`, and emits `navigate` events.

```typescript
// tests-ct/AppDrawer.spec.ts
import { test, expect } from '@playwright/experimental-ct-react';
import { AppDrawer } from '../src/components/AppDrawer';

test('@ct renders nothing when closed', async ({ mount }) => {
  const component = await mount(<AppDrawer open={false} onNavigate={() => {}} />);
  await expect(component.locator('nav')).not.toBeVisible();
});

test('@ct renders navigation links when open', async ({ mount }) => {
  const component = await mount(<AppDrawer open={true} onNavigate={() => {}} />);
  const nav = component.locator('nav');
  await expect(nav).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Dashboard' })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Profile' })).toBeVisible();
});

test('@ct emits navigate event with correct route', async ({ mount }) => {
  let receivedRoute: string | null = null;
  const component = await mount(
    <AppDrawer open={true} onNavigate={(route) => { receivedRoute = route; }} />
  );
  await component.getByRole('link', { name: 'Dashboard' }).click();
  expect(receivedRoute).toBe('/dashboard');
});

test('@ct overlay click closes drawer', async ({ mount }) => {
  const onClose = jest.fn();
  const component = await mount(<AppDrawer open={true} onClose={onClose} />);
  await component.locator('.drawer-overlay').click();
  expect(onClose).toHaveBeenCalledTimes(1);
});

test('@ct user menu avatar is present', async ({ mount }) => {
  const component = await mount(
    <AppDrawer open={true} user={{ name: 'Alice', avatar: '/alice.png' }} />
  );
  await expect(component.getByAltText('Alice')).toBeVisible();
});
```

### 9.3 Tabs / Accordion

For a `TabGroup` component that manages active tab state internally:

```typescript
// tests-ct/TabGroup.spec.ts
import { test, expect } from '@playwright/experimental-ct-react';
import { TabGroup } from '../src/components/TabGroup';

test('@ct renders all tab labels', async ({ mount }) => {
  const component = await mount(
    <TabGroup tabs={[{ id: 'a', label: 'Overview' }, { id: 'b', label: 'Details' }, { id: 'c', label: 'History' }]} />
  );
  await expect(component.getByRole('tab', { name: 'Overview' })).toBeAttached();
  await expect(component.getByRole('tab', { name: 'Details' })).toBeAttached();
  await expect(component.getByRole('tab', { name: 'History' })).toBeAttached();
});

test('@ct first tab is selected by default', async ({ mount }) => {
  const component = await mount(
    <TabGroup tabs={[{ id: 'a', label: 'Overview' }, { id: 'b', label: 'Details' }]} />
  );
  await expect(component.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true');
  await expect(component.getByRole('tab', { name: 'Details' })).toHaveAttribute('aria-selected', 'false');
  await expect(component.getByRole('tabpanel', { name: 'Overview' })).toBeVisible();
});

test('@ct clicking second tab switches panel', async ({ mount }) => {
  const component = await mount(
    <TabGroup tabs={[{ id: 'a', label: 'Overview' }, { id: 'b', label: 'Details' }]} />
  );
  await component.getByRole('tab', { name: 'Details' }).click();
  await expect(component.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'false');
  await expect(component.getByRole('tab', { name: 'Details' })).toHaveAttribute('aria-selected', 'true');
  await expect(component.getByRole('tabpanel', { name: 'Details' })).toBeVisible();
});
```

---

## 10. CT with Mocked Services

CT tests should not hit real HTTP endpoints. The component under test should receive data through props or a context provider — never by fetching inside the component. Two patterns cover the vast majority of cases: **callback mocks** and **MSW (Mock Service Worker)**.

### 10.1 Callback / Prop Mocks (Preferred for Pure UI Components)

When the component receives data via props, you can inject whatever shape you need directly:

```typescript
// tests-ct/UserCard.spec.ts
import { test, expect } from '@playwright/experimental-ct-react';
import { UserCard } from '../src/components/UserCard';

test('@ct renders user data from props', async ({ mount }) => {
  const component = await mount(
    <UserCard
      user={{ id: 1, name: 'Bob', email: 'bob@example.com', role: 'admin' }}
      onDelete={jest.fn()}
    />
  );
  await expect(component.getByText('Bob')).toBeVisible();
  await expect(component.getByText('bob@example.com')).toBeVisible();
  await expect(component.getByText('admin')).toBeVisible();
});

test('@ct delete button fires onDelete with user id', async ({ mount }) => {
  const onDelete = jest.fn();
  const component = await mount(
    <UserCard user={{ id: 42, name: 'Carol', email: 'carol@example.com' }} onDelete={onDelete} />
  );
  await component.getByRole('button', { name: /delete/i }).click();
  expect(onDelete).toHaveBeenCalledWith(42);
});

test('@ct shows skeleton while loading', async ({ mount }) => {
  const component = await mount(<UserCard loading={true} />);
  await expect(component.locator('.skeleton-avatar')).toBeAttached();
  await expect(component.getByText('Bob')).not.toBeAttached();
});
```

### 10.2 MSW for Integration-Flavoured CT

Sometimes a component triggers its own fetch (e.g., a data-fetching hook). In that case, install MSW at the CT entry point to intercept network requests:

```bash
npm i -D msw@latest
npx msw init ./public --save
```

```typescript
// playwright/handlers.ts  — shared mock handlers
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/users/:id', ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      name: 'Mocked User',
      email: 'mocked@example.com',
      role: 'viewer',
    });
  }),
  http.post('/api/users', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ id: 99, ...(body as object) }, { status: 201 });
  }),
];
```

```typescript
// playwright/index.tsx — wire MSW into the CT entry point
import { beforeMount } from '@playwright/experimental-ct-react/hooks';
import { mswDecorator } from 'msw-playwright';
import { handlers } from './handlers';
import './app.css';

beforeMount(async ({ browserContext }) => {
  await mswDecorator(browserContext, handlers);
});
```

```typescript
// tests-ct/UserProfile.spec.ts
import { test, expect } from '@playwright/experimental-ct-react';
import { UserProfile } from '../src/components/UserProfile';

test('@ct fetches and displays user from API', async ({ mount, page }) => {
  // The component internally fetches /api/users/1 — MSW intercepts this.
  const component = await mount(<UserProfile userId={1} />);
  await expect(component.getByText('Mocked User')).toBeVisible();
  await expect(page.getByRole('status')).not.toBeVisible(); // no error state
});

test('@ct shows error state on API failure', async ({ mount, page }) => {
  // Override the specific handler for this test
  server.use(
    http.get('/api/users/999', () => HttpResponse.error(), { status: 500 })
  );
  const component = await mount(<UserProfile userId={999} />);
  await expect(component.getByRole('alert')).toBeVisible();
});
```

### 10.3 When to Use Each Pattern

| Situation | Recommended approach |
|---|---|
| Component receives all data via props | Callback/prop mocks — no MSW needed |
| Component uses a data-fetching hook internally | MSW at entry point + test-specific overrides |
| You want to test loading / error states | Combine prop mocks with explicit `loading` / `error` props |
| You need to test the HTTP contract itself | That's E2E — not CT territory |

---

## 11. Visual Regression in CT

`toHaveScreenshot` works identically in CT as in E2E, but the isolation window is a single component rather than the full page. This makes it especially powerful for catching CSS regressions that would be noisy in full-page screenshots.

### 11.1 Basic Component Screenshot

```typescript
import { test, expect } from '@playwright/experimental-ct-react';
import { SearchForm } from '../src/components/SearchForm';

test('@ct screenshot — empty state', async ({ mount }) => {
  const component = await mount(<SearchForm onSearch={() => {}} />);
  await expect(component).toHaveScreenshot('search-form-empty.png');
});

test('@ct screenshot — with query', async ({ mount }) => {
  const component = await mount(<SearchForm onSearch={() => {}} />);
  await component.getByRole('textbox').fill('Playwright');
  await expect(component).toHaveScreenshot('search-form-filled.png');
});

test('@ct screenshot — loading state', async ({ mount }) => {
  const component = await mount(<SearchForm loading={true} onSearch={() => {}} />);
  await expect(component).toHaveScreenshot('search-form-loading.png');
});
```

### 11.2 Masking Dynamic Content

Content like timestamps, avatars with random IDs, or generated tokens changes on every render and causes flaky screenshots. Use the `mask` option to blank those elements:

```typescript
test('@ct screenshot — activity feed with masked timestamps', async ({ mount }) => {
  const component = await mount(
    <ActivityFeed items={[
      { id: 1, text: 'Joined',   timestamp: '2026-01-01T10:00:00Z' },
      { id: 2, text: 'Posted',   timestamp: '2026-01-02T14:30:00Z' },
      { id: 3, text: 'Commented',timestamp: '2026-01-03T09:15:00Z' },
    ]} />
  );

  await expect(component).toHaveScreenshot('activity-feed.png', {
    // Blank any element matching these selectors before comparing
    mask: [
      component.locator('.relative-time'),   // "2 hours ago" spans
      component.locator('img[src*="avatar"]'), // dynamic avatar URLs
      component.locator('#session-id'),       // any generated session token
    ],
    // pixelThreshold: 0.01,   // relax tolerance for font-rendering differences
    // maxDiffPixels: 50,
  });
});
```

### 11.3 Masking Multiple Dynamic Areas

For dashboards with many dynamic widgets, create a reusable mask array in a shared fixture:

```typescript
// fixtures/component-screenshot.ts
import { Locator } from '@playwright/test';

export function dashboardMasks(root: Locator): Locator[] {
  return [
    root.locator('[data-testid="timestamp"]'),
    root.locator('[data-testid="user-avatar"]'),
    root.locator('[data-testid="notification-badge"]'),
    root.locator('.chart-tooltip'),
  ];
}
```

```typescript
// tests-ct/DashboardWidget.spec.ts
import { test, expect } from '@playwright/experimental-ct-react';
import { DashboardWidget } from '../src/components/DashboardWidget';
import { dashboardMasks } from '../fixtures/component-screenshot';

test('@ct screenshot — widget in error state', async ({ mount }) => {
  const component = await mount(<DashboardWidget error="Server unavailable" />);
  await expect(component).toHaveScreenshot('widget-error.png', {
    mask: dashboardMasks(component),
  });
});
```

### 11.4 Animations and Screenshots

Animations cause `toHaveScreenshot` to capture mid-transition frames. Pause animations before the shot:

```typescript
test('@ct screenshot — sidebar after animation settles', async ({ mount }) => {
  const component = await mount(<Sidebar open={true} />);
  // Wait for CSS transition to complete (sidebar slides in)
  await component.locator('.sidebar').evaluate(el => {
    const style = (el as HTMLElement).style;
    style.transition = 'none';        // disable transition for stable capture
  });
  await component.locator('.sidebar').evaluate(el => (el as HTMLElement).offsetHeight); // force reflow
  await expect(component).toHaveScreenshot('sidebar-open.png');
});
```

---

## 12. Decision Matrix — CT vs E2E vs Jest

Use this matrix to decide which testing layer owns a given scenario. The right answer is usually "the highest level that still gives fast, reliable feedback."

| Concern | CT | E2E | Jest / jsdom |
|---|---|---|---|
| **Speed** | Fast (~1s per test) | Slow (~30s per suite) | Fastest (~100ms per test) |
| **Browser realism** | Real Chromium | Real Chromium | Fake DOM (jsdom) |
| **Network layer** | Mocked or intercepted | Real HTTP | Mocked via `fetch.mock` |
| **Component isolation** | Yes — one component at a time | No — full app | Yes — but no layout |
| **CSS / layout testing** | Real rendering, accurate box model | Real rendering | Approximate — no layout engine |
| **Auth complexity** | Avoid — belongs in E2E | Own it — test the real flow | Avoid — mock tokens in props |
| **Type coverage** | High — TypeScript props | Medium — page-level assertions | High — unit function coverage |
| **Flakiness** | Low — isolated, no network | High — network + timing | Very low — deterministic |
| **Debugging experience** | Easy — focused component | Medium — full page context | Easy — unit-scale |
| **When to choose** | Stateful UI, forms, complex components | Full journeys, auth, multi-page flows | Pure utility functions, hooks |
| **Typical CI gate** | Every PR (sub-2 min) | Nightly or on-release | Every commit |

**Decision heuristics:**
- **Choose CT** when you need to assert a component's behaviour in isolation with realistic styling, and speed matters more than network realism.
- **Choose E2E** when the test must span multiple pages, touch real authentication, or verify end-to-end data flows.
- **Choose Jest** when the function under test has no UI, no side effects, and pure unit coverage is the goal.

---

## 13. Anti-patterns

CT is still an evolving tool. These eight mistakes appear repeatedly and are worth knowing before you write your first CT suite.

### 1. Mocking the API inside CT (should be integration)

CT should test component logic — not HTTP. If you find yourself calling `page.route()` or starting an MSW server inside a CT test, ask whether this belongs in an E2E integration test instead. The component should receive data through props or context, not pull it over the network.

```typescript
// ANTI-PATTERN
test('fetches user', async ({ mount, page }) => {
  await page.route('/api/user', route => route.fulfill({ body: '{ "name": "Bob" }' }));
  const component = await mount(<UserCard userId={1} />);
  // This test is testing fetch logic, not card rendering
});

// PREFERRED — component receives data, test only rendering
test('displays user', async ({ mount }) => {
  const component = await mount(<UserCard user={{ name: 'Bob' }} />);
  await expect(component.getByText('Bob')).toBeVisible();
});
```

### 2. Replicating Provider Boilerplate Per Test

If every test manually wraps the component in the same providers, extract that into `beforeMount` in the entry point. The entry point runs once per test session; manual wrapping runs once per test and is easy to get wrong.

```typescript
// ANTI-PATTERN — repeating ThemeProvider per test
test('button style', async ({ mount }) => {
  await mount(<ThemeProvider><Button /></ThemeProvider>);
});

// PREFERRED — set it once in playwright/index.tsx
beforeMount(async ({ App }) => <ThemeProvider><App /></ThemeProvider>);
```

### 3. Asserting Rendered Class Names

CSS-in-JS tools (styled-components, Emotion, vanilla-extract) hash class names between builds. Asserting `.css-1abced` will break whenever the build runs. Use ARIA roles, labels, and text instead — the same locators you would write in an E2E test.

```typescript
// ANTI-PATTERN
await expect(component.locator('.css-1abced')).toBeVisible();

// PREFERRED
await expect(component.getByRole('button', { name: 'Submit' })).toBeVisible();
```

### 4. Putting All Components in One Config

A single `playwright-ct.config.ts` shared between React, Vue, and Svelte components will cause silent mount failures because the entry point uses the wrong framework hook. Keep one CT config per framework in its own test directory.

```
tests-ct-react/   →  playwright-ct-react.config.ts
tests-ct-vue/     →  playwright-ct-vue.config.ts
tests-ct-svelte/  →  playwright-ct-svelte.config.ts
```

### 5. Not Separating CT from E2E Configs

CT tests run in under 2 minutes per suite. E2E tests run in 20–30 minutes. Mixing them means CT results are blocked by E2E flakiness, and CT failures don't fail the fast gate. Use separate `playwright.config.ts` and `playwright-ct.config.ts`, run CT on every PR, and E2E nightly or on release.

### 6. Testing Components That Are Too Thin (Pure Functions)

A component that just renders `props.name` is a pure function. Testing it in a real browser with Playwright CT adds overhead without catching any bugs that a simple Jest snapshot wouldn't catch faster. Write CT tests for components with meaningful state, side effects, or user interaction. Write Jest tests for everything else.

```typescript
// TOO THIN FOR CT — just renders text
const Greeting = ({ name }: { name: string }) => <p>Hello {name}</p>;
// This belongs in a Jest unit test, not CT
```

### 7. Ignoring Accessibility in CT

CT runs in a real browser, which means axe-core works against the component's rendered DOM. Skipping a11y assertions in CT is a missed opportunity — accessibility bugs are UI bugs, and catching them in CT is faster and cheaper than catching them in E2E or, worse, production.

```typescript
import AxeBuilder from '@axe-core/playwright';

test('@ct is accessible — login form', async ({ mount }) => {
  const component = await mount(<LoginForm onSubmit={() => {}} />);
  const results = await new AxeBuilder({ page: component.page })
    .include(component.locator('form'))
    .analyze();
  expect(results.violations).toEqual([]);
});
```

### 8. Not Running CT in CI

A test suite that only runs locally is a test suite that will drift. Add CT to the PR pipeline with a separate job that installs dependencies, runs `npx playwright test --config=playwright-ct.config.ts`, and publishes the HTML report as a CI artifact. A reasonable target: sub-3-minute CT gate on every PR.

```yaml
# .github/workflows/ct.yml
- name: Run Component Tests
  run: npx playwright test --config=playwright-ct.config.ts
  env:
    CI: true
    CT_PORT: 3100
```

---

## 14. Senior SDET Perspective

CT occupies a uniquely valuable position in the testing stack — and in the SDET career. It is the first testing layer that forces you to read, write, and reason about frontend code fluently, rather than just driving it from the outside. When you write a CT test for a `LoginForm`, you are not just asserting a form submission; you are learning how the component receives props, manages focus, fires validation events, and renders error messages. That literacy is the foundation of every senior SDET skill that follows: reading source code to debug flakes, writing frontend-aware assertions, and proposing architectural improvements that make tests more reliable.

The career angle is equally compelling. The components that cause the most E2E instability are almost always the same ones: complex forms with multiple validation states, modals with async confirmations, drawers that animate. These components get tested on every PR through the E2E suite and flake monthly, generating retry logs, investigation time, and eventually resignation from whoever owns the flaky suite. Proposing to lift those components into CT — with a clear before/after metric (e.g., "CT catches the validation bug in 2 seconds; E2E catches it in 45 seconds and is still flaky") — is exactly the kind of cross-team technical contribution that gets noticed by engineering leadership. It is a concrete demonstration of system-level thinking, and it lands well in performance reviews and technical design discussions.

Finally, CT is a natural stepping stone for SDETs who want to drift toward frontend engineering. The toolchain (Vite, JSX/TSX, component lifecycles) is identical to what a frontend engineer uses daily. Writing a solid CT suite is credible evidence of frontend-adjacent competence in a way that maintaining a 10,000-line E2E test suite is not. If your goal is to move into FE-adjacent SDET roles, or to transition into FE engineering, CT is the highest-signal starting point.

---

## 15. DevSecOps Seed

CT is a natural fit for security-sensitive UI components because it provides strong isolation without the overhead of a full E2E environment with real network access. Password strength meters, MFA code inputs, token display components, and permission-gated UI elements can all be tested in isolation for:

- **Correct masking behaviour** — password fields must mask characters; CT can screenshot the rendered input and verify no characters are exposed in the DOM.
- **Rate-limiting UI feedback** — components that display "too many attempts" warnings can be tested across lockout states without a real account lockout mechanism.
- **Role-based visibility** — components that hide sensitive controls based on `user.role` can be mounted with different role props and assert visibility without any real authentication.
- **XSS surface** — any component that renders user-supplied content (e.g., a notification that echoes a username) can be mounted with injection payloads in props, asserting that the rendered output does not execute script.

The isolation property is key: a CT environment has no access to production APIs, tokens, or sessions, making it safe to run untrusted payloads against the component even in shared CI infrastructure.

```typescript
// tests-ct/PasswordInput.spec.ts — DevSecOps seed
import { test, expect } from '@playwright/experimental-ct-react';
import { PasswordInput } from '../src/components/PasswordInput';

test('@ct password is masked by default', async ({ mount }) => {
  const component = await mount(<PasswordInput value="Secret123!" />);
  await expect(component.locator('input')).toHaveAttribute('type', 'password');
});

test('@ct XSS payload is rendered as text, not script', async ({ mount }) => {
  const component = await mount(
    <PasswordInput value='<script>alert(1)</script>' onChange={() => {}} />
  );
  // The value must not cause script execution — rendered as plain text in the DOM
  await expect(component.locator('input')).toHaveValue('<script>alert(1)</script>');
});

test('@ct shows strength indicator — weak password', async ({ mount }) => {
  const component = await mount(<PasswordInput value="abc" onChange={() => {}} />);
  await expect(component.getByText('Weak')).toBeVisible();
  await expect(component.locator('.strength-bar')).toHaveAttribute('data-strength', '1');
});

test('@ct shows strength indicator — strong password', async ({ mount }) => {
  const component = await mount(<PasswordInput value="Str0ng!Pass#2026" onChange={() => {}} />);
  await expect(component.getByText('Strong')).toBeVisible();
  await expect(component.locator('.strength-bar')).toHaveAttribute('data-strength', '4');
});

test('@ct locked state prevents input', async ({ mount }) => {
  const onChange = jest.fn();
  const component = await mount(<PasswordInput locked={true} value="locked" onChange={onChange} />);
  await component.locator('input').fill('new');
  expect(onChange).not.toHaveBeenCalled();
});
```

---

## 16. Exercise — Complete Deliverable

### Objective

Build a CT test suite for a `SearchForm` component with three distinct states — loading, results, and empty — then replicate the same coverage as E2E, and compare execution times.

### Component Under Test

`SearchForm` accepts:
- `query: string` — current search text
- `loading: boolean` — shows a spinner
- `results: SearchResult[]` — array of `{ id: string; title: string; snippet: string }`
- `onSearch: (query: string) => void` — called when form is submitted
- `onQueryChange: (query: string) => void` — called on keystroke

States:
1. **Empty** — no query, no results, submit button disabled
2. **Loading** — query present, `loading={true}`, spinner visible, results hidden
3. **Results** — query present, `loading={false}`, `results` array rendered as list
4. **Empty results** — query present, `loading={false}`, `results` is `[]`, empty-state message shown

### Part A — CT Tests

Create `tests-ct/SearchForm.spec.ts`:

```typescript
import { test, expect } from '@playwright/experimental-ct-react';
import { SearchForm } from '../src/components/SearchForm';

// State 1: Empty
test('@ct empty — submit button disabled', async ({ mount }) => {
  const component = await mount(
    <SearchForm query="" loading={false} results={[]} />
  );
  await expect(component.getByRole('button', { name: /search/i })).toBeDisabled();
});

test('@ct empty — no results list rendered', async ({ mount }) => {
  const component = await mount(
    <SearchForm query="" loading={false} results={[]} />
  );
  await expect(component.locator('ul[data-testid="results"]')).not.toBeAttached();
});

// State 2: Loading
test('@ct loading — spinner visible, results hidden', async ({ mount }) => {
  const component = await mount(
    <SearchForm query="Playwright" loading={true} results={[]} />
  );
  await expect(component.getByRole('status')).toBeVisible(); // spinner
  await expect(component.locator('ul[data-testid="results"]')).not.toBeAttached();
});

// State 3: Results
test('@ct results — renders result list', async ({ mount }) => {
  const results = [
    { id: '1', title: 'Playwright CT Guide', snippet: 'Component testing with Playwright...' },
    { id: '2', title: 'E2E vs CT', snippet: 'When to use each testing layer...' },
  ];
  const component = await mount(
    <SearchForm query="Playwright" loading={false} results={results} />
  );
  const list = component.locator('ul[data-testid="results"]');
  await expect(list).toBeVisible();
  await expect(list.getByRole('listitem')).toHaveCount(2);
  await expect(list.getByText('Playwright CT Guide')).toBeVisible();
});

// State 4: Empty results
test('@ct empty results — shows empty state message', async ({ mount }) => {
  const component = await mount(
    <SearchForm query="nonexistent query xyz" loading={false} results={[]} />
  );
  await expect(component.getByText(/no results found/i)).toBeVisible();
});

// Interaction
test('@ct typing calls onQueryChange', async ({ mount }) => {
  let lastQuery = '';
  const component = await mount(
    <SearchForm query="" loading={false} results={[]} onQueryChange={(q) => { lastQuery = q; }} />
  );
  await component.getByRole('textbox').fill('CT');
  expect(lastQuery).toBe('CT');
});

test('@ct submit calls onSearch', async ({ mount }) => {
  let submittedQuery = '';
  const component = await mount(
    <SearchForm
      query="Playwright"
      loading={false}
      results={[]}
      onSearch={(q) => { submittedQuery = q; }}
    />
  );
  await component.getByRole('button', { name: /search/i }).click();
  expect(submittedQuery).toBe('Playwright');
});
```

### Part B — E2E Equivalents

Create `tests-e2e/search-form.spec.ts`. Mount the full app at a route that renders `SearchForm` with the real search endpoint:

```typescript
// tests-e2e/search-form.spec.ts
import { test, expect, Page } from '@playwright/test';

// Helper to seed the page with a particular state
async function mountSearchForm(page: Page, state: { query: string; loading: boolean; results: unknown[] }) {
  await page.goto('/search');
  if (state.query) await page.getByRole('textbox').fill(state.query);
  // E2E has no way to force loading/error/empty states without API mocking —
  // you'd need a backdoor or seed data. For fair comparison, time the full API round-trip.
}

test('search form — full round-trip', async ({ page }) => {
  await page.goto('/search');
  const input = page.getByRole('textbox');
  await input.fill('Playwright');
  await page.getByRole('button', { name: /search/i }).click();
  // Wait for real API response
  await expect(page.getByRole('listitem')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('[data-testid="result-title"]').first()).toBeVisible();
});

test('search form — empty results', async ({ page }) => {
  await page.goto('/search');
  await page.getByRole('textbox').fill('this-wont-match-anything-xyz');
  await page.getByRole('button', { name: /search/i }).click();
  await expect(page.getByText(/no results found/i)).toBeVisible({ timeout: 10_000 });
});

test('search form — loading state during API call', async ({ page }) => {
  await page.goto('/search');
  await page.getByRole('textbox').fill('delay');
  await page.getByRole('button', { name: /search/i }).click();
  // Capture loading spinner — E2E can see this, but timing is flaky
  await expect(page.getByRole('status')).toBeVisible();
});
```

### Part C — Timing Comparison

Run both suites and record timings. Typical results on a local machine:

```bash
npx playwright test tests-ct/SearchForm.spec.ts --config=playwright-ct.config.ts
npx playwright test tests-e2e/search-form.spec.ts --config=playwright.config.ts
```

| Test suite | Tests | Total time | Avg per test |
|---|---|---|---|
| CT | 8 tests | ~8 seconds | ~1 second |
| E2E | 3 tests | ~35 seconds | ~11 seconds |

### Part D — Self-Grading Rubric

| Criterion | 0 (Not done) | 1 (Partial) | 2 (Complete) | 3 (Excellent) |
|---|---|---|---|---|
| All 4 states tested in CT | Fewer than 2 states | 2 states | 3 states | All 4 states |
| Callback events verified | No event tests | 1 event test | 2 event tests | 3+ event tests |
| E2E equivalents written | No E2E tests | 1 test | 2 tests | 3 tests with API wait |
| Timing comparison documented | Not present | Rough estimate | Approximate timings | Exact timings with table |
| Mask / visual regression (bonus) | Not attempted | Screenshot without mask | Screenshot with mask | Multiple states, masked |
| Accessibility check (bonus) | Not attempted | `toBeVisible` only | One axe-core test | axe-core on all form elements |

**Passing score:** 8/12 (with E2E equivalence). Bonus points for accessibility and visual regression show senior-level initiative.
