# Component Testing — Playwright CT

> Specialised reference for testing individual UI components in isolation, in real browsers, via `@playwright/experimental-ct-*`. The reference layer covers E2E primitives — this layer is about the COMPONENT model, what CT is good for, what it isn't, the trade-offs vs Jest+RTL, vs Storybook+Chromatic, vs Cypress CT.
>
> Reference: [`reference/03_locators.md`](../reference/03_locators.md), [`reference/04_fixtures.md`](../reference/04_fixtures.md). This focuses on the CT-specific bits.

---

## Table of contents

1. [What CT is and what it isn't](#1-what-ct-is)
2. [Supported frameworks](#2-supported-frameworks)
3. [The mount API](#3-mount-api)
4. [Props, events, callbacks](#4-props-events-callbacks)
5. [Composition and slots](#5-composition)
6. [Mocking dependencies](#6-mocking)
7. [Visual regression in CT](#7-visual-regression)
8. [Performance — CT vs E2E](#8-performance)
9. [Bundler integration — Vite, webpack](#9-bundler)
10. [CT vs Jest + Testing Library](#10-ct-vs-jest)
11. [CT vs Storybook + Chromatic](#11-ct-vs-storybook)
12. [CT vs Cypress component](#12-ct-vs-cypress)
13. [The fixture model in CT](#13-fixture-model)
14. [Common failures](#14-common-failures)
15. [Anti-patterns](#15-anti-patterns)

---

## 1. What CT is

Component Testing mounts ONE component in a real browser, in isolation from the rest of the app, with full Playwright control.

### 1.1 The execution model

```
Test (Node)
   ↓
Bundler (Vite/webpack)
   ↓
Compiled component + Playwright runtime → loaded into a real browser
   ↓
Playwright drives the browser
```

### 1.2 What you get

- Real browser rendering (Chromium, Firefox, WebKit).
- Real CSS layout.
- Real DOM events.
- Playwright's locator API.
- Playwright's auto-waiting.
- Playwright's trace viewer, UI mode, etc.

### 1.3 What you don't get

- Real backend (mock all API calls).
- Real routing (must mock or instantiate Router).
- Real auth state (must inject context).
- Full app context (Redux, etc. — must wrap).

### 1.4 When to use CT

| Scenario                                          | CT or E2E? |
| ------------------------------------------------- | ---------- |
| "Does this button look right and handle a click?" | CT         |
| "Does the form validate correctly?"               | CT         |
| "Does the modal trap focus?"                      | CT         |
| "Does the dropdown open?"                         | CT         |
| "Does the chart render with this data?"           | CT         |
| "Does the user flow work end-to-end?"             | E2E        |
| "Does navigation work?"                           | E2E        |
| "Does the API integration work?"                  | E2E        |
| "Do permissions work?"                            | E2E        |

CT is for COMPONENT correctness. E2E is for WORKFLOW correctness. They complement.

### 1.5 The "experimental" label

CT has been "experimental" since 2022. It's production-ready for React/Vue/Svelte/Solid — Microsoft uses it internally. The label remains because they reserve the right to break the API.

---

## 2. Supported frameworks

| Framework  | Package                              | Status                               |
| ---------- | ------------------------------------ | ------------------------------------ |
| React      | `@playwright/experimental-ct-react`  | Stable                               |
| Vue        | `@playwright/experimental-ct-vue`    | Stable                               |
| Svelte     | `@playwright/experimental-ct-svelte` | Stable                               |
| Solid      | `@playwright/experimental-ct-solid`  | Stable                               |
| Angular    | Not officially supported             | Use TestBed + Karma OR Cypress CT    |
| Vanilla JS | Not directly                         | Mount via React with vanilla wrapper |

For unsupported frameworks: E2E tests against a dev page that renders the component in isolation.

---

## 3. Mount API

### 3.1 React example

```typescript
import { test, expect } from '@playwright/experimental-ct-react';
import { CustomerCard } from './CustomerCard';

test('renders customer name', async ({ mount }) => {
  const component = await mount(<CustomerCard name="Alice" status="Active" />);

  await expect(component).toBeVisible();
  await expect(component.getByRole('heading', { name: 'Alice' })).toBeVisible();
  await expect(component.getByText('Active')).toBeVisible();
});
```

`mount` returns a Locator pointing at the rendered component's root element. All standard Playwright locator methods work.

### 3.2 Vue example

```typescript
import { test, expect } from "@playwright/experimental-ct-vue";
import CustomerCard from "./CustomerCard.vue";

test("renders customer card", async ({ mount }) => {
  const component = await mount(CustomerCard, {
    props: { name: "Alice", status: "Active" },
  });
  await expect(component.getByRole("heading")).toContainText("Alice");
});
```

### 3.3 The mounted root

```typescript
const component = await mount(<MyComponent />);
// component is a Locator pointing at the component's root element

// All locators are scoped within the component
await component.getByRole('button').click();    // only finds buttons in this component

// component.page() gives you full page access if needed
const page = component.page();
```

### 3.4 Mounting multiple times in a test

```typescript
const c1 = await mount(<Card name="A" />);
await c1.unmount();

const c2 = await mount(<Card name="B" />);
// Now only c2 is in the DOM
```

`unmount` removes the previous component. Without it, both stay mounted (and may interfere).

---

## 4. Props, events, callbacks

### 4.1 Function props

```typescript
const onSave = vi.fn();      // Vitest mock OR your own spy

test('calls onSave when save clicked', async ({ mount }) => {
  const component = await mount(<EditForm onSave={onSave} />);
  await component.getByRole('button', { name: 'Save' }).click();

  expect(onSave).toHaveBeenCalledTimes(1);
});
```

Wait — Playwright doesn't have built-in spies like Vitest. Use a closure:

```typescript
test('calls onSave', async ({ mount }) => {
  const calls: { name: string }[] = [];

  const component = await mount(<EditForm onSave={(arg) => calls.push(arg)} />);
  await component.getByRole('button', { name: 'Save' }).click();

  expect(calls).toEqual([{ name: 'expected' }]);
});
```

Or expose calls via a window global the test reads via `page.evaluate`.

### 4.2 Async props (data fetchers)

```typescript
test('fetches and displays data', async ({ mount }) => {
  const component = await mount(<CustomerList fetcher={() => Promise.resolve([{ name: 'Alice' }, { name: 'Bob' }])} />);

  await expect(component.getByText('Alice')).toBeVisible();
  await expect(component.getByText('Bob')).toBeVisible();
});
```

Injected fetcher = no real API needed. Component thinks data came from somewhere.

### 4.3 Update props mid-test

CT doesn't support prop updates directly. To change props, unmount and remount:

```typescript
let component = await mount(<Card status="Pending" />);
await expect(component.getByText('Pending')).toBeVisible();

await component.unmount();
component = await mount(<Card status="Paid" />);
await expect(component.getByText('Paid')).toBeVisible();
```

For tests that NEED stateful prop updates, consider wrapping in a test harness component:

```typescript
function PropsHarness() {
  const [status, setStatus] = useState('Pending');
  return (
    <>
      <Card status={status} />
      <button onClick={() => setStatus('Paid')}>Set Paid</button>
    </>
  );
}

test('updates with new props', async ({ mount }) => {
  const component = await mount(<PropsHarness />);
  await expect(component.getByText('Pending')).toBeVisible();
  await component.getByRole('button', { name: 'Set Paid' }).click();
  await expect(component.getByText('Paid')).toBeVisible();
});
```

---

## 5. Composition

### 5.1 Component with children

```typescript
test('Modal renders its children', async ({ mount }) => {
  const component = await mount(
    <Modal title="Settings">
      <p>Modal body content</p>
      <button>Action</button>
    </Modal>
  );

  await expect(component.getByRole('heading', { name: 'Settings' })).toBeVisible();
  await expect(component.getByText('Modal body content')).toBeVisible();
});
```

### 5.2 Provider context (React)

For components that need React Context:

```typescript
test('renders within a theme provider', async ({ mount }) => {
  const component = await mount(
    <ThemeProvider theme={{ primary: '#ff0000' }}>
      <Button>Click me</Button>
    </ThemeProvider>
  );

  // Assert the button uses the theme
  const bgColor = await component.locator('button').evaluate(el => getComputedStyle(el).backgroundColor);
  expect(bgColor).toBe('rgb(255, 0, 0)');
});
```

### 5.3 Setup hooks for common providers

```typescript
// playwright/index.tsx
import { beforeMount } from '@playwright/experimental-ct-react/hooks';
import { ThemeProvider } from '../src/ThemeProvider';

export default beforeMount(async ({ App }) => {
  return (
    <ThemeProvider>
      <App />
    </ThemeProvider>
  );
});
```

All mounted components get wrapped in `ThemeProvider`. No need to wrap each one in tests.

### 5.4 Router context

Components using React Router:

```typescript
test('renders link to /settings', async ({ mount }) => {
  const component = await mount(
    <MemoryRouter initialEntries={['/']}>
      <NavBar />
    </MemoryRouter>
  );

  await component.getByRole('link', { name: 'Settings' }).click();
  // Note: clicking changes route but no actual navigation occurs in CT
});
```

For routing-heavy components, use a `MemoryRouter` to stub navigation.

---

## 6. Mocking

### 6.1 Fetch / network mocking

CT components calling `fetch` work, but there's no real server. Use Playwright's `page.route`:

```typescript
test('fetches and displays', async ({ mount, page }) => {
  await page.route('**/api/customers', async (route) => {
    await route.fulfill({ body: JSON.stringify([{ id: '1', name: 'Alice' }]) });
  });

  const component = await mount(<CustomerList />);
  await expect(component.getByText('Alice')).toBeVisible();
});
```

The component renders, calls fetch, the route handler intercepts, returns mock data.

### 6.2 Module mocking

Playwright CT doesn't have Jest-style `jest.mock`. To mock modules:

- Use dependency injection (pass the dependency as a prop or via context).
- Use the bundler's mock-resolution if supported (Vite alias).
- For React: use a context-based service injection pattern.

### 6.3 Timer mocking

```typescript
test('debounced search', async ({ page, mount }) => {
  await page.clock.install();

  const component = await mount(<SearchBox debounceMs={500} />);
  await component.locator('input').fill('Alice');

  // Debounce hasn't fired
  await expect(component.getByText('Searching...')).not.toBeVisible();

  // Fast-forward
  await page.clock.runFor(500);
  await expect(component.getByText('Searching...')).toBeVisible();

  await page.clock.uninstall();
});
```

`page.clock` works in CT — useful for debounced/throttled components.

---

## 7. Visual regression in CT

### 7.1 Component screenshots

```typescript
test('renders correctly', async ({ mount }) => {
  const component = await mount(<CustomerCard name="Alice" status="Active" />);
  await expect(component).toHaveScreenshot('customer-card.png');
});
```

Component baselines are smaller, more isolated, and less prone to noise than page screenshots.

### 7.2 The component-visual workflow

| Test type                | Purpose                  |
| ------------------------ | ------------------------ |
| Visual unit (CT)         | Per-component appearance |
| Visual integration (E2E) | Page layout              |

Run thousands of fast component visuals; run few slow page visuals.

---

## 8. Performance

### 8.1 CT vs E2E timing

| Action                    | CT          | E2E             |
| ------------------------- | ----------- | --------------- |
| Mount a component         | ~100 ms     | N/A             |
| Navigate a page           | N/A         | ~1000 ms        |
| Make an API call (mocked) | ~10 ms      | ~10 ms (mocked) |
| Make an API call (real)   | N/A         | ~50-500 ms      |
| Assert visible            | ~10 ms      | ~10 ms          |
| Total per test            | ~200-500 ms | ~2000-5000 ms   |

For testing component-level behavior, CT is 5–10× faster.

### 8.2 Parallel CT runs

CT tests parallelise like E2E — `fullyParallel: true`, workers, sharding. The smaller per-test cost means MORE benefit from parallelism.

A suite of 500 component tests with 4 workers: ~25–50 seconds. Same suite as E2E: 4–8 minutes.

---

## 9. Bundler integration

### 9.1 Vite (recommended)

```typescript
// playwright-ct.config.ts
import { defineConfig, devices } from "@playwright/experimental-ct-react";

export default defineConfig({
  testDir: "./src",
  testMatch: "**/*.spec.tsx",
  ctPort: 3100, // dev server port
  ctViteConfig: {
    // Same Vite config as your app
    plugins: [react()],
  },
});
```

Vite is fast. Hot module replacement (HMR) makes iterating CT tests pleasant.

### 9.2 webpack

```typescript
ctConfig: {
  // webpack config
}
```

Slower than Vite. Use only if your app uses webpack and you need exact config parity.

### 9.3 Build performance

CT recompiles components on changes. With Vite: ~50–200 ms per file. With webpack: 1–5 seconds.

For TS projects with type checking: add another 1–3 seconds. Worth disabling type checking in CT runs (your spec already type-checks).

---

## 10. CT vs Jest + Testing Library

|                   | Playwright CT             | Jest + RTL            |
| ----------------- | ------------------------- | --------------------- |
| Runtime           | Real browser              | jsdom (simulated DOM) |
| CSS               | Real                      | Approximated          |
| Layout            | Real                      | Approximated          |
| Animations        | Real                      | Mostly absent         |
| Performance API   | Real                      | Mocked                |
| canvas / WebGL    | Real                      | Mocked                |
| Locator API       | Playwright's              | RTL's findByX         |
| Speed             | Slower (browser overhead) | Faster (no browser)   |
| Debugging         | Playwright UI Mode, trace | Console               |
| Visual regression | Yes                       | No                    |
| Cross-browser     | Yes                       | No (jsdom only)       |

### 10.1 When Jest + RTL wins

- Component has lots of logic, little visual concern.
- Speed matters and the team has a Jest investment.
- You don't need to test CSS / layout.
- You don't need cross-browser.

### 10.2 When Playwright CT wins

- Component has visual / layout / animation behaviour.
- Need cross-browser verification.
- Need visual regression.
- Want one tool for unit + integration + E2E.

Many teams use both: Jest for logic-heavy components; Playwright CT for visual-heavy components.

---

## 11. CT vs Storybook + Chromatic

|                       | Playwright CT         | Storybook + Chromatic              |
| --------------------- | --------------------- | ---------------------------------- |
| Component preview     | Yes (via UI Mode)     | Yes (Storybook UI)                 |
| Visual regression     | Yes                   | Yes (Chromatic)                    |
| Interactivity testing | Yes (full Playwright) | Limited (play function)            |
| Behavior assertions   | Native                | Storybook Test Runner (additional) |
| Cost                  | Free                  | Free dev, paid Chromatic           |
| Browser environments  | All                   | All (Chromatic Cloud)              |

### 11.1 The split

Storybook EXCELS at:

- Documentation (component examples for designers, PMs).
- Manual exploration during development.
- Visual snapshot review across components.

Playwright CT excels at:

- Behavior testing.
- Assertions on logic.
- Integration with E2E tests.

Many teams: Storybook for docs + Chromatic for visual review + Playwright CT for behavior.

---

## 12. CT vs Cypress component

Cypress component testing is mature, polished:

- Same Cypress runner UI.
- Time-travel debugger.
- Strong React/Vue support.

Playwright CT advantages:

- Cross-browser (Cypress is Chromium-only).
- Better TypeScript integration.
- Better with cross-origin scenarios.
- Faster execution.

Cypress advantages:

- More polished DX.
- Better community for component testing patterns.
- Less "experimental" label baggage.

For 2026: Cypress CT is more mature. Playwright CT is catching up fast.

---

## 13. The fixture model

CT fixtures work like E2E fixtures.

```typescript
const test = base.extend<{ themeProvider: (children: React.ReactNode) => JSX.Element }>({
  themeProvider: async ({}, use) => {
    const wrapper = (children: React.ReactNode) => (
      <ThemeProvider theme={mockTheme}>{children}</ThemeProvider>
    );
    await use(wrapper);
  },
});

test('themed button', async ({ mount, themeProvider }) => {
  const component = await mount(themeProvider(<Button>Test</Button>));
  // ...
});
```

See [`reference/04_fixtures.md`](../reference/04_fixtures.md).

---

## 14. Common failures

### Failure 1 — Component renders blank

**Cause:** Required provider (Theme, Router, Redux) is missing.
**Fix:** Wrap component in provider, or use the `beforeMount` hook.

### Failure 2 — Tests pass in CT, fail in E2E

**Cause:** CT mocks dependencies; E2E hits real backend. Component has implicit assumptions.
**Fix:** Tests at both layers. CT verifies component logic; E2E verifies integration.

### Failure 3 — Mount fails with "module not found"

**Cause:** Bundler can't resolve imports. Often related to project aliases.
**Fix:** Mirror your app's bundler config in `ctViteConfig` / `ctConfig`.

### Failure 4 — Component rendering doesn't match production

**Cause:** Production uses CSS-in-JS / theme system that CT doesn't load.
**Fix:** Load styles via `beforeMount`. Or import the global CSS file.

### Failure 5 — Visual baselines differ between CT and production

**Cause:** CT renders in a clean shell — no parent margins, body padding, etc. Production has site-wide CSS that adds offsets.
**Fix:** Component-level visuals SHOULD differ from page visuals. Use both for different purposes.

### Failure 6 — Network mocks not applied

**Cause:** `page.route` registered after `mount`. Mount already triggered fetches.
**Fix:** Register route BEFORE `mount`.

---

## 15. Anti-patterns

| ❌                                                       | ✅                              |
| -------------------------------------------------------- | ------------------------------- |
| CT tests for full user workflows                         | Use E2E for workflows           |
| E2E tests for per-component behavior                     | Use CT for components           |
| Mocking everything in CT (the component becomes useless) | Mock only external dependencies |
| Visual baselines in CT for highly dynamic data           | Mask or don't include           |
| Mounting a top-level App component in CT                 | Mount specific components       |
| Cypress-style end-to-end in Playwright CT                | Use Playwright (E2E)            |
| Real router in CT                                        | MemoryRouter                    |
| Real Redux store with thunks                             | Mocked store or sandbox         |
| Skipping CT because Jest exists                          | Use both for different purposes |

---

## Cross-references

- E2E vs component split: [`./visual_regression.md §10`](./visual_regression.md#10-per-component)
- Test fixture patterns: [`../reference/04_fixtures.md`](../reference/04_fixtures.md)
- Mocking in CT (page.route): [`../reference/13_mocking.md`](../reference/13_mocking.md)
- Accessibility in components: [`./accessibility.md`](./accessibility.md)
